"""Validate an audited runtime artifact before using it as offline build input."""
import argparse
from pathlib import Path
from deployment_receiver import extract

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--bundle', type=Path, required=True)
    ap.add_argument('--edition', choices=['online', 'offline'], required=True)
    ap.add_argument('--output', type=Path, required=True)
    a = ap.parse_args()
    a.output.mkdir(parents=True, exist_ok=False)
    with a.bundle.open('rb') as source:
        manifest = extract(source, a.output, a.edition)
    print(f"Validated {len(manifest['files'])} files from {manifest['revision']}")
