"""Create and validate runtime-only release bundles. Shared with the SSH receiver."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import tarfile

LANGS = {'az', 'de', 'en', 'ky', 'ru'}
EXTENSIONS = {'.html', '.css', '.js', '.json', '.webp', '.png', '.jpg', '.jpeg',
              '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf'}
FORBIDDEN = {'docs', 'tools', 'tests', 'api', 'tmp', 'backup', 'backups',
             '_backups', '_reviews', 'releases', 'staging', 'node_modules'}
SECRET = re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b')

def allowed(name, edition):
    p = PurePosixPath(name)
    if not name or p.as_posix() != name or p.is_absolute() or '\\' in name or ':' in name:
        return False
    if any(v in {'', '.', '..'} or v.lower() in FORBIDDEN or (v.startswith('.') and v != '.htaccess') for v in p.parts):
        return False
    if name == '.htaccess':
        return True
    if edition == 'online':
        if name in {'index.html', '404.html', 'languages.json', 'robots.txt', 'sitemap.xml', 'private/abuse-terms.json', 'assets/fonts/OFL.txt'}:
            return True
        if name in {f'{lang}/mail-feedback.php' for lang in LANGS}:
            return True
        if name in {f'{lang}/stories/.htaccess' for lang in LANGS}:
            return True
    elif edition == 'offline':
        if name in {'index.html', 'offline.html', 'sw.js', 'offline-packs.json', 'manifest.webmanifest', 'languages.json'}:
            return True
    else:
        return False
    roots = LANGS | {'assets', 'flags'} | ({'offline-assets'} if edition == 'offline' else set())
    return len(p.parts) > 1 and p.parts[0] in roots and p.suffix.lower() in EXTENSIONS

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()

def inventory(root, edition):
    result = {}
    for p in sorted(root.rglob('*')):
        if p.is_symlink():
            raise ValueError(f'Symlink forbidden: {p}')
        if not p.is_file():
            continue
        name = p.relative_to(root).as_posix()
        if not allowed(name, edition):
            raise ValueError(f'Not a permitted {edition} runtime file: {name}')
        if p.suffix in {'.html', '.css', '.js', '.json', '.php', '.txt'} and SECRET.search(p.read_bytes()):
            raise ValueError(f'Credential signature in {name}; value withheld')
        result[name] = {'bytes': p.stat().st_size, 'sha256': digest(p)}
    required = {'index.html', '.htaccess'} | {f'{lang}/index.html' for lang in LANGS}
    if edition == 'offline':
        required |= {'sw.js', 'offline-packs.json', 'manifest.webmanifest'}
    if not required <= result.keys():
        raise ValueError(f'Missing runtime entry points: {required - result.keys()}')
    return result

def pack(root, edition, revision, output):
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('A full source commit SHA is required')
    files = inventory(root, edition)
    manifest = {'schema': 1, 'edition': edition, 'revision': revision, 'files': files}
    output.parent.mkdir(parents=True, exist_ok=True)
    # No compression: most bytes are already-compressed illustrations.
    with tarfile.open(output, 'w') as tar:
        import io
        data = json.dumps(manifest, sort_keys=True).encode()
        info = tarfile.TarInfo('release-manifest.json'); info.size = len(data)
        tar.addfile(info, io.BytesIO(data))
        for name in files:
            tar.add(root / name, arcname=name, recursive=False)
    output.with_suffix('.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'Validated {edition}: {len(files)} runtime files')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', type=Path, required=True)
    ap.add_argument('--edition', choices=['online', 'offline'], required=True)
    ap.add_argument('--revision', required=True)
    ap.add_argument('--output', type=Path, required=True)
    a = ap.parse_args(); pack(a.root, a.edition, a.revision, a.output)
