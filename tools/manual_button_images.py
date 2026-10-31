"""Inline references to screenshots of the site's real, localized controls."""
import html
import json
import re
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Paragraph-specific controls also cover instructions that describe an icon
# without quoting its tooltip. These remain plain text and images, not buttons.
REFERENCES = {
    'home': {0: ['help', 'feedback', 'sitemap'], 1: ['language'], 2: ['top', 'bottom']},
    'category': {0: ['cards', 'list'], 2: ['clear-filter'],
                 3: ['show-image', 'hide-image', 'show-text', 'hide-text']},
    'search': {0: ['clear-filter'], 1: ['search'], 2: ['close']},
    'story': {0: ['show-image'], 1: ['hide-image', 'show-image', 'show-text', 'hide-text']},
    'reading': {0: ['compare'], 1: ['show-image'], 2: ['close']},
    'comparison': {0: ['compare', 'lang-az', 'lang-de', 'lang-en', 'lang-ky', 'lang-ru'],
                   1: ['show-image', 'hide-image', 'show-text', 'hide-text'],
                   2: ['previous', 'next', 'first', 'last'], 3: ['close']},
    'languages': {3: ['show-image']},
    'mobile': {0: ['open-menu', 'close-menu', 'language', 'search'], 1: ['stories-menu']},
    'feedback': {0: ['feedback']},
    'attachment': {0: ['choose-file', 'replace-file', 'remove-file'], 1: ['send-feedback']},
    'sitemap': {0: ['sitemap']},
    'footer': {0: ['clear-filter'], 1: ['compare', 'close'], 2: ['language', 'feedback']},
    'help': {0: ['help', 'open-menu'], 3: ['close', 'section-link', 'language', 'top', 'bottom']},
    'offline-download': {1: ['download'], 2: ['download'], 3: ['repair'],
                         4: ['repair', 'verify'], 5: ['pause', 'repair', 'download']},
    'offline-test': {3: ['open'], 4: ['downloads']},
    'offline-usb': {1: ['open'], 3: ['updates', 'update', 'verify'],
                    4: ['persist', 'remove-illustrations', 'remove-language'], 5: ['repair']},
}


def render_button_paragraph(text, lang, section, index):
    metadata = json.loads((ROOT / 'docs/manuals/button-references.json').read_text(encoding='utf-8'))[lang]
    controls = REFERENCES.get(section, {}).get(index, [])
    matches, extra = [], []
    for key in controls:
        item = metadata[key]
        label = item['label'].replace(' ↗', '')
        candidates = [label]
        if key == 'open-menu' and section == 'help':
            candidates.insert(0, {'az': 'üç üfüqi xətlə göstərilən menyu düyməsinə',
                                  'en': 'three-line menu'}.get(lang, label))
        if key in ('clear-filter', 'close'):
            candidates.insert(0, '×')
        if key in ('previous', 'next', 'first', 'last'):
            candidates.insert(0, item['text'])
        match = None
        for candidate in candidates:
            if not candidate:
                continue
            pattern = r'(?<!\w)' + re.escape(candidate) + r'(?!\w)' if candidate[0].isalnum() else re.escape(candidate)
            # Offline controls retain their English labels in every guide.
            # Do not attach Open to the ordinary verb "open", or Update to
            # the status message "Update available".
            flags = 0 if section.startswith('offline-') else re.IGNORECASE
            for found in re.finditer(pattern, text, flags):
                a, b = found.span()
                if key == 'update' and re.match(r'\s+available\b', text[b:], re.IGNORECASE):
                    continue
                if key in ('previous', 'next') and ((a and text[a-1] == candidate) or text[b:b+1] == candidate):
                    continue
                if not any(a < end and b > start for start, end, _ in matches):
                    match = (a, b, key)
                    break
            if match:
                break
        if match:
            matches.append(match)
        else:
            extra.append(key)

    def image(key):
        item = metadata[key]
        height = min(25, item['height'])
        width = round(item['width'] * height / item['height'], 1)
        filename = f'{key}.png'
        if key == 'open-menu':
            # A new filename avoids browsers reusing the earlier padded capture.
            source = ROOT / 'assets/manuals/buttons' / lang / filename
            filename = f'open-menu-{hashlib.sha256(source.read_bytes()).hexdigest()[:8]}.png'
            target = source.with_name(filename)
            if not target.exists(): target.write_bytes(source.read_bytes())
        return f'<img class="button-reference" src="../assets/manuals/buttons/{lang}/{filename}" width="{width}" height="{height}" alt="" aria-hidden="true" loading="lazy" decoding="async">'

    result, cursor = [], 0
    for a, b, key in sorted(matches):
        result.extend([html.escape(text[cursor:b]), image(key)])
        cursor = b
    result.append(html.escape(text[cursor:]))
    if extra:
        result.append(' <span class="button-references">' + '; '.join(
            f'<span>{html.escape(metadata[key]["label"].replace(" ↗", ""))}{image(key)}</span>' for key in extra) + '.</span>')
    return ''.join(result)
