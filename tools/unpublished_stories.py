"""Hide retired stories from generated output while retaining all authoring files.

To restore a story, remove its stem below and rebuild the website.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNPUBLISHED_STEMS = frozenset({'ill-gotten-money', 'forbidden-money'})


def apply_unpublished_stories(root=ROOT, langs=('az', 'en', 'ru', 'ky', 'de')):
    for lang in langs:
        folder = root / lang
        for name in ('stories-data.js', 'search-index.js'):
            path = folder / 'assets' / name
            if not path.exists():
                continue
            original = path.read_text(encoding='utf-8')
            start = original.index('=') + 1
            start += len(original[start:]) - len(original[start:].lstrip())
            data, end = json.JSONDecoder().raw_decode(original, start)
            if isinstance(data, list):
                data = [s for s in data if s.get('stem') not in UNPUBLISHED_STEMS]
            else:
                for category in data.get('categories', []):
                    category['stories'] = [s for s in category['stories'] if s.get('stem') not in UNPUBLISHED_STEMS]
                    category['count'] = len(category['stories'])
            updated = original[:start] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + original[end:]
            if updated != original:
                path.write_text(updated, encoding='utf-8')
        paths = [folder / 'sitemap.html', folder / 'index.html', *sorted((folder / 'categories').glob('*.html'))]
        for path in paths:
            if not path.exists():
                continue
            original = path.read_text(encoding='utf-8')
            updated = original
            for stem in UNPUBLISHED_STEMS:
                escaped = re.escape(stem)
                for pattern in (
                    rf'<article\b[^>]*\bid="{escaped}"[^>]*>.*?</article>',
                    rf'<a\b[^>]*\bdata-stem="{escaped}"[^>]*>.*?</a>',
                    rf'<li\b[^>]*\bdata-stem="{escaped}"[^>]*>.*?</li>',
                    rf'<li>\s*<a\b[^>]*href="[^"\s]*#{escaped}"[^>]*>.*?</a>\s*</li>',
                ):
                    updated = re.sub(pattern, '', updated, flags=re.S)
            if path.name == 'sitemap.html':
                def recount_block(match):
                    block = match.group(0)
                    count = len(re.findall(r'<li>', block))
                    return re.sub(r'(<span class="sitemap-block__count">)\d+',
                                  lambda m: m.group(1) + str(count), block)
                updated = re.sub(r'<article class="sitemap-block sitemap-block--stories">.*?</article>',
                                 recount_block, updated, flags=re.S)
                catalog = folder / 'assets' / 'stories-data.js'
                if catalog.exists():
                    raw = catalog.read_text(encoding='utf-8')
                    blob = json.JSONDecoder().raw_decode(raw[raw.index('=') + 1:].lstrip())[0]
                    total = sum(len(c['stories']) for c in blob['categories'])
                    updated = re.sub(r'(<a class="sitemap-card sitemap-card--stories".*?<p class="sitemap-card__meta">)\d+',
                                     lambda m: m.group(1) + str(total), updated, flags=re.S)
            if updated != original:
                count = len(re.findall(r'<article\b[^>]*\bclass="story\b', updated))
                if count:
                    updated = re.sub(r'(<span data-tools-count>)\d+(</span>)', rf'\g<1>{count}\2', updated)
                path.write_text(updated, encoding='utf-8')


if __name__ == '__main__':
    apply_unpublished_stories()
