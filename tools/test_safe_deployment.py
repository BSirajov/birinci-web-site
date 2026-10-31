import io
import json
from pathlib import Path
import tarfile
import pytest
from runtime_bundle import allowed, pack, LANGS
from deployment_receiver import extract, promote, rollback

def runtime(root, edition):
    root.mkdir()
    for name in ['index.html', '.htaccess'] + [f'{lang}/index.html' for lang in LANGS]:
        p = root / name; p.parent.mkdir(exist_ok=True); p.write_text('runtime')
    if edition == 'offline':
        for name in ['sw.js', 'offline-packs.json', 'manifest.webmanifest']:
            (root / name).write_text('{}')
    return root

@pytest.mark.parametrize('name', ['../index.html','/index.html','assets/../../x','assets\\x.js',
    'offline/index.html', 'docs/manual.docx','assets/manual.docx','assets/.env',
    'private/turnstile.json','az/_reviews/report.html','tools/test.js','assets/key.pem'])
def test_excludes_authoring_secrets_and_other_edition(name):
    assert not allowed(name, 'online')

@pytest.mark.parametrize('edition', ['online', 'offline'])
def test_round_trip_and_tampering(tmp_path, edition):
    source = runtime(tmp_path / 'source', edition)
    bundle = tmp_path / 'release.tar'
    pack(source, edition, 'a' * 40, bundle)
    stage = tmp_path / 'stage'; stage.mkdir()
    with bundle.open('rb') as f:
        result = extract(f, stage, edition)
    assert result['edition'] == edition
    data = bundle.read_bytes().replace(b'runtime', b'changed', 1)
    other = tmp_path / 'other'; other.mkdir()
    with pytest.raises(ValueError):
        extract(io.BytesIO(data), other, edition)

def test_online_preserves_offline_and_secret(tmp_path):
    public = runtime(tmp_path / 'public_html', 'online')
    (tmp_path / '.safe-deploy').mkdir()
    (public / 'offline').mkdir(); (public / 'offline/sw.js').write_text('old offline')
    (public / 'private').mkdir(); (public / 'private/turnstile.json').write_text('secret')
    (public / 'obsolete.html').write_text('old')
    stage = runtime(tmp_path / 'stage', 'online')
    promote(tmp_path, stage, 'online')
    assert (public / 'offline/sw.js').read_text() == 'old offline'
    assert (public / 'private/turnstile.json').read_text() == 'secret'
    assert not (public / 'obsolete.html').exists()
    assert (tmp_path / '.safe-deploy/online-previous/obsolete.html').exists()

def test_offline_does_not_touch_online(tmp_path):
    public = runtime(tmp_path / 'public_html', 'online')
    (tmp_path / '.safe-deploy').mkdir()
    (public / 'offline').mkdir(); (public / 'offline/old.html').write_text('old')
    before = (public / 'index.html').stat().st_mtime_ns
    stage = runtime(tmp_path / 'stage', 'offline')
    promote(tmp_path, stage, 'offline')
    assert (public / 'index.html').stat().st_mtime_ns == before
    assert not (public / 'offline/old.html').exists()
    assert (tmp_path / '.safe-deploy/offline-previous/old.html').exists()

def test_failed_switch_restores_previous_release(tmp_path, monkeypatch):
    public = runtime(tmp_path / 'public_html', 'online')
    (tmp_path / '.safe-deploy').mkdir()
    stage = runtime(tmp_path / 'stage', 'online')
    original = Path.rename
    def rename(self, target):
        if self == stage:
            raise OSError('simulated failed promotion')
        return original(self, target)
    monkeypatch.setattr(Path, 'rename', rename)
    with pytest.raises(OSError):
        promote(tmp_path, stage, 'online')
    assert (public / 'index.html').read_text() == 'runtime'

@pytest.mark.parametrize('kind', ['symlink', 'traversal', 'unexpected', 'wrong-edition', 'missing'])
def test_malicious_or_incomplete_archives_fail_closed(tmp_path, kind):
    data = io.BytesIO()
    with tarfile.open(fileobj=data, mode='w') as tar:
        manifest = {'schema': 1, 'edition': 'offline' if kind == 'wrong-edition' else 'online',
                    'revision': 'a' * 40, 'files': {'index.html': {'bytes': 1, 'sha256': '0' * 64}}}
        raw = json.dumps(manifest).encode()
        info = tarfile.TarInfo('release-manifest.json'); info.size = len(raw)
        tar.addfile(info, io.BytesIO(raw))
        if kind != 'missing':
            info = tarfile.TarInfo('../escape' if kind == 'traversal' else 'index.html' if kind == 'symlink' else 'unexpected.html')
            if kind == 'symlink':
                info.type = tarfile.SYMTYPE; info.linkname = '/etc/passwd'
            tar.addfile(info)
    stage = tmp_path / 'stage'; stage.mkdir()
    data.seek(0)
    with pytest.raises(ValueError):
        extract(data, stage, 'online')
    assert not (tmp_path / 'escape').exists()

def test_online_rollback_preserves_a_newer_offline_release(tmp_path):
    public = runtime(tmp_path / 'public_html', 'online')
    (tmp_path / '.safe-deploy').mkdir()
    (public / 'offline').mkdir(); (public / 'offline/sw.js').write_text('v1')
    stage = runtime(tmp_path / 'stage', 'online')
    (stage / 'index.html').write_text('new online')
    promote(tmp_path, stage, 'online')
    offline = runtime(tmp_path / 'offline-stage', 'offline')
    (offline / 'sw.js').write_text('v2')
    promote(tmp_path, offline, 'offline')
    rollback(tmp_path, 'online')
    assert (public / 'offline/sw.js').read_text() == 'v2'
    assert (public / 'index.html').read_text() == 'runtime'
