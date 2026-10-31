"""Server-installed forced SSH command; never install inside public_html.

Usage: python3 deployment_receiver.py DOMAIN_DIRECTORY online|offline
SSH_ORIGINAL_COMMAND is limited to 'deploy RUN_ID' or 'status'.
"""
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tarfile
import tempfile
import time
from runtime_bundle import allowed, inventory

MAX_BYTES = 4 * 1024 ** 3

def extract(stream, stage, edition):
    with tarfile.open(fileobj=stream, mode='r|') as tar:
        members = iter(tar)
        first = next(members)
        if first.name != 'release-manifest.json' or not first.isfile() or first.size > 4 * 1024 ** 2:
            raise ValueError('Missing or oversized release manifest')
        manifest = json.load(tar.extractfile(first))
        if manifest.get('schema') != 1 or manifest.get('edition') != edition:
            raise ValueError('Wrong edition or schema')
        if not re.fullmatch(r'[0-9a-f]{40}', manifest.get('revision', '')):
            raise ValueError('Invalid source revision')
        files = manifest['files']
        if not isinstance(files, dict) or len(files) > 20000:
            raise ValueError('Invalid file list')
        seen = set(); total = 0
        for member in members:
            name = member.name
            if not member.isfile() or name in seen or name not in files or not allowed(name, edition):
                raise ValueError(f'Forbidden archive member: {name}')
            if member.size != files[name]['bytes'] or member.size > 128 * 1024 ** 2:
                raise ValueError('Unexpected file size')
            total += member.size
            if total > MAX_BYTES:
                raise ValueError('Release too large')
            target = stage / name
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as out:
                shutil.copyfileobj(tar.extractfile(member), out)
            target.chmod(0o644)
            seen.add(name)
        if seen != set(files) or inventory(stage, edition) != files:
            raise ValueError('Incomplete release or hash mismatch')
        return manifest

def copy_tree(source, target):
    # Never follow server-side symlinks into a different site or secrets directory.
    if source.is_symlink() or any(p.is_symlink() for p in source.rglob('*')):
        raise ValueError(f'Unexpected symlink in preserved directory: {source.name}')
    shutil.copytree(source, target, copy_function=os.link)

def rollback(domain, edition):
    public = domain / 'public_html'
    state = domain / '.safe-deploy'
    target = public if edition == 'online' else public / 'offline'
    backup = state / (edition + '-previous')
    if not backup.is_dir():
        raise ValueError('No previous release available')
    if edition == 'online':
        # An offline release may have occurred since the online release being reverted.
        if (backup / 'offline').exists():
            shutil.rmtree(backup / 'offline')
        if (public / 'offline').exists():
            copy_tree(public / 'offline', backup / 'offline')
    failed = state / (edition + '-failed')
    if failed.exists():
        shutil.rmtree(failed)
    target.rename(failed)
    try:
        backup.rename(target)
    except BaseException:
        failed.rename(target)
        raise

def promote(domain, stage, edition):
    public = domain / 'public_html'
    state = domain / '.safe-deploy'
    target = public if edition == 'online' else public / 'offline'
    backup = state / (edition + '-previous')
    if target.is_symlink() or public.is_symlink():
        raise ValueError('Unexpected public directory symlink')
    if edition == 'online':
        if (public / 'offline').exists():
            copy_tree(public / 'offline', stage / 'offline')
        # This is the only local secret permitted in the public runtime; .htaccess denies access.
        secret = public / 'private/turnstile.json'
        if secret.exists():
            if secret.is_symlink():
                raise ValueError('Unexpected secret symlink')
            (stage / 'private').mkdir(exist_ok=True)
            shutil.copy2(secret, stage / 'private/turnstile.json')
    if backup.exists():
        shutil.rmtree(backup)
    existed = target.exists()
    if existed:
        target.rename(backup)
    try:
        stage.rename(target)
    except BaseException:
        if existed:
            backup.rename(target)
        raise
    return backup

def main():
    import fcntl
    domain = Path(sys.argv[1]).resolve()
    edition = sys.argv[2]
    if edition not in {'online', 'offline'} or not (domain / 'public_html').is_dir():
        raise ValueError('Invalid fixed deployment destination')
    command = os.environ.get('SSH_ORIGINAL_COMMAND', '')
    state = domain / '.safe-deploy'; state.mkdir(mode=0o700, exist_ok=True)
    if command == 'status':
        p = state / (edition + '.json')
        print(p.read_text() if p.exists() else '{}'); return
    match = re.fullmatch(r'(deploy|rollback) ([1-9][0-9]{0,19})', command)
    if not match:
        raise ValueError('Only deploy RUN_ID, rollback RUN_ID and status are allowed')
    run = int(match[2])
    with (state / 'lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        record = state / (edition + '.json')
        previous = json.loads(record.read_text()) if record.exists() else {}
        if match[1] == 'rollback':
            if run != previous.get('run') or previous.get('rolledBack'):
                raise ValueError('Rollback does not match the current release')
            rollback(domain, edition)
            previous['rolledBack'] = True
            record.write_text(json.dumps(previous))
            print(json.dumps(previous)); return
        if run <= previous.get('run', 0):
            raise ValueError('Stale or already-published workflow run')
        with tempfile.TemporaryDirectory(prefix=edition + '-', dir=state) as temp:
            stage = Path(temp) / 'runtime'; stage.mkdir(mode=0o755)
            manifest = extract(sys.stdin.buffer, stage, edition)
            promote(domain, stage, edition)
            result = {'run': run, 'revision': manifest['revision'], 'edition': edition,
                      'files': len(manifest['files']), 'deployedAt': int(time.time())}
            pending = record.with_suffix('.new')
            pending.write_text(json.dumps(result)); pending.replace(record)
            print(json.dumps(result))

if __name__ == '__main__':
    main()
