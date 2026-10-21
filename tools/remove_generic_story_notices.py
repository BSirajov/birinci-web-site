"""Remove only the standard internet/AI notice from generated story output."""
import html
import json
import re
from pathlib import Path
from story_source_policy import is_generic_story_notice, visible_story_paragraphs


def clean_html(markup):
    def article(match):
        value = match[0]
        if not re.search(r'class="[^"]*\bstory\b', value.split('>', 1)[0]):
            return value
        def paragraph(p):
            text = html.unescape(re.sub(r'<[^>]+>', '', p[0]))
            return '' if is_generic_story_notice(text) else p[0]
        return re.sub(r'<p\b[^>]*>.*?</p>', paragraph, value, flags=re.S)
    return re.sub(r'<article\b[^>]*>.*?</article>', article, markup, flags=re.S)


def apply(root):
    changed = []
    for lang in ('az', 'en', 'ru', 'ky', 'de'):
        for folder in ('categories', 'authors'):
            for path in (root/lang/folder).glob('*.html'):
                old = path.read_text(encoding='utf-8'); new = clean_html(old)
                if new != old:
                    path.write_text(new, encoding='utf-8', newline='\n'); changed.append(path.relative_to(root).as_posix())
        path = root/lang/'assets/stories-data.js'
        raw = path.read_text(encoding='utf-8')
        prefix, body = raw.split('=', 1)
        catalog = json.loads(body.strip().rstrip(';'))
        count = 0
        for category in catalog['categories']:
            for story in category['stories']:
                old = story['paragraphs']; new = visible_story_paragraphs(old)
                count += len(old)-len(new); story['paragraphs'] = new
        if count:
            path.write_text(prefix+'= '+json.dumps(catalog, ensure_ascii=False, separators=(',', ':'))+';\n', encoding='utf-8', newline='\n')
            changed.append(path.relative_to(root).as_posix())
    return changed


if __name__ == '__main__':
    print('\n'.join(apply(Path(__file__).resolve().parents[1])))
