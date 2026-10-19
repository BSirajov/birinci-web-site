"""Apply the requested German ə -> a correction, preserving DOCX package content."""
import hashlib
import json
import re
import shutil
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
WS = ROOT / 'de/wisdom-stories'
BACKUP = ROOT / 'de/_backups/wisdom-stories/schwa-20261005'
REPORT = ROOT / 'de/_reviews/wisdom-stories/schwa-20261005.json'
BASELINE = ROOT / 'de/_reviews/wisdom-stories/web-integration/preservation-baseline.json'

def main():
    if REPORT.exists():
        raise SystemExit('Already applied; inspect the existing report before running again.')
    baseline = json.loads(BASELINE.read_text(encoding='utf-8-sig'))
    BACKUP.mkdir(parents=True, exist_ok=False)
    shutil.copy2(BASELINE, BACKUP / 'preservation-baseline.json')
    changes = []
    for path in sorted(WS.rglob('*.docx')):
        with ZipFile(path) as archive:
            entries = [(info, archive.read(info.filename)) for info in archive.infolist()]
        updated = []
        count = 0
        for info, data in entries:
            new = data
            if info.filename.startswith('word/') and info.filename.endswith('.xml'):
                def replace(match):
                    nonlocal count
                    count += match[0].count('ə'.encode())
                    return match[0].replace('ə'.encode(), b'a')
                new = re.sub(rb'<w:t(?:\s[^>]*)?>[\s\S]*?</w:t>', replace, data)
            updated.append((info, new))
        if not count:
            continue
        relative = path.relative_to(WS)
        saved = BACKUP / relative
        saved.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, saved)
        temporary = path.with_suffix('.docx.tmp')
        with ZipFile(temporary, 'w') as archive:
            for info, data in updated:
                archive.writestr(info, data)
        temporary.replace(path)
        with ZipFile(path) as archive:
            for (info, old), (_, new) in zip(entries, updated):
                assert archive.read(info.filename) == new
                assert new == old or new == old.replace('ə'.encode(), b'a')
        name = path.relative_to(ROOT).as_posix()
        baseline[name] = hashlib.sha256(path.read_bytes()).hexdigest()
        changes.append({'story': relative.as_posix(), 'illustration': path.stem + '.webp', 'replacements': count})
    source_edits = []
    for name, old, new in [
        ('tools/locales/de.json', 'Bəxtiyar Siracov', 'Baxtiyar Siracov'),
        ('tools/build_german_wisdom.py', '"bakhtiyar": "Bəxtiyar Siracov"', '"bakhtiyar": "Baxtiyar Siracov"'),
    ]:
        path = ROOT / name
        text = path.read_text(encoding='utf-8')
        assert text.count(old) == 1, name
        saved = BACKUP / name
        saved.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, saved)
        path.write_text(text.replace(old, new), encoding='utf-8')
        source_edits.append(name)
    BASELINE.write_text(json.dumps(baseline, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    report = {'story_replacements': sum(row['replacements'] for row in changes), 'stories_changed': len(changes),
              'author_label_source_replacements': 2, 'source_edits': source_edits,
              'illustration_artwork_modified': False, 'backup': BACKUP.relative_to(ROOT).as_posix(), 'files': changes}
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
