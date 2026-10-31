import json
from pathlib import Path
from lxml import html
from manual_button_images import render_button_paragraph


def test_offline_icons_follow_commands_not_verbs_or_status():
    root = Path(__file__).resolve().parents[1]
    for lang in ('az', 'en', 'de', 'ru', 'ky'):
        data = json.loads((root / f'docs/manuals/manual-{lang}.json').read_text(encoding='utf-8'))
        section = next(s for s in data['sections'] if s.get('id') == 'offline-usb')
        for index, key in ((1, 'open'), (3, 'update')):
            tree = html.fragment_fromstring(render_button_paragraph(section['paras'][index], lang, 'offline-usb', index), create_parent='div')
            image = tree.xpath(f'.//img[contains(@src,"/{key}.png")]')[0]
            preceding = ''.join(image.xpath('preceding-sibling::text()'))
            assert preceding.endswith(key.title())
            assert not (image.tail or '').lstrip().startswith('available')
            if lang == 'en' and key == 'open':
                assert preceding.endswith('then select Open')
