"""Publish a validated bundle using an edition-restricted SSH key, then smoke test."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bundle', type=Path, required=True)
    ap.add_argument('--edition', choices=['online', 'offline'], required=True)
    ap.add_argument('--run', type=int, required=True)
    a = ap.parse_args()
    manifest = json.loads(a.bundle.with_suffix('.json').read_text())
    if manifest['edition'] != a.edition:
        raise ValueError('Bundle edition mismatch')
    with tempfile.TemporaryDirectory() as temp:
        key = Path(temp) / 'key'; key.write_text(os.environ['DEPLOY_SSH_KEY'].strip() + '\n'); key.chmod(0o600)
        known = Path(temp) / 'known_hosts'; known.write_text(os.environ['DEPLOY_KNOWN_HOSTS'].strip() + '\n')
        ssh = ['ssh', '-T', '-i', str(key), '-p', os.environ['DEPLOY_PORT'],
               '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes',
               '-o', f'UserKnownHostsFile={known}', '-o', 'ServerAliveInterval=30',
               '-o', 'ServerAliveCountMax=6', os.environ['DEPLOY_USER'] + '@' + os.environ['DEPLOY_HOST']]
        with a.bundle.open('rb') as source:
            subprocess.run(ssh + [f'deploy {a.run}'], stdin=source, check=True)
        base = 'https://birinci.cloud/' + ('offline/' if a.edition == 'offline' else '')
        paths = ['index.html'] + [f'{lang}/index.html' for lang in ['az','de','en','ky','ru']]
        paths += ['sw.js', 'offline-packs.json', 'manifest.webmanifest'] if a.edition == 'offline' else ['assets/build-info.json']
        try:
            for path in paths:
                for attempt in range(4):
                    try:
                        req = urllib.request.Request(base + path + f'?release={a.run}', headers={'Cache-Control': 'no-cache'})
                        with urllib.request.urlopen(req, timeout=45) as response:
                            actual = hashlib.sha256(response.read()).hexdigest()
                        if actual != manifest['files'][path]['sha256']:
                            raise ValueError(f'Live hash mismatch: {path}')
                        break
                    except Exception:
                        if attempt == 3:
                            raise
                        time.sleep(5)
            # The separately hosted edition must still respond.
            other = 'https://birinci.cloud/' + ('' if a.edition == 'offline' else 'offline/')
            with urllib.request.urlopen(other + f'?release={a.run}', timeout=45) as response:
                if response.status != 200:
                    raise ValueError('Other edition is unavailable')
        except Exception:
            subprocess.run(ssh + [f'rollback {a.run}'], check=True)
            raise
        print(f'{a.edition}: live hashes verified; other edition remains available')

if __name__ == '__main__':
    main()
