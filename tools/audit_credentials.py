"""Check tracked files for credential signatures without printing their values."""
import re
import subprocess
from pathlib import Path

SIGNATURE = re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bghp_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b')

def audit(root):
    names = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).split(b'\0')
    failures = []
    for name in names:
        if not name:
            continue
        path = root / name.decode('utf-8')
        if not path.is_file():
            continue
        # All headers are inspected, including extensionless credential files.
        with path.open('rb') as stream:
            data = stream.read() if path.suffix.lower() in {'.js', '.json', '.py', '.yml', '.txt', '.html', '.php', '.env'} else stream.read(8192)
        if SIGNATURE.search(data):
            failures.append(name.decode('utf-8'))
    return failures

if __name__ == '__main__':
    failures = audit(Path(__file__).resolve().parents[1])
    for name in failures:
        print('Credential signature (value withheld):', name)
    print('Credential scan:', 'FAIL' if failures else 'PASS')
    raise SystemExit(bool(failures))
