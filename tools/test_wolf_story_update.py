"""Approved wolf story stays aligned across languages and keeps its stable route."""
import json
from pathlib import Path
from docx import Document
from PIL import Image
from chrome_restore import pin_asset_versions, ILLUSTRATION_ASSET_VERSION

ROOT=Path(__file__).resolve().parents[1]
TITLES={'az':'Görünüş aldadıcı ola bilər','en':'Appearances can be deceptive','de':'Der Schein kann trügen','ru':'Внешность бывает обманчива','ky':'Сырткы көрүнүш алдамчы болушу мүмкүн'}

def test_wolf_story_is_distinct_from_painting_and_has_correct_assets():
    manifest=json.loads((ROOT/'tools/story-build-manifest.json').read_text(encoding='utf-8'))
    for lang,title in TITLES.items():
        story=next(s for c in manifest[lang]['categories'] for s in c['stories'] if s['stem']=='light-of-the-world')
        assert story['title']==title
        paragraphs=[p.text.strip() for p in Document(ROOT/story['source']).paragraphs if p.text.strip()]
        painting=[p.text.strip() for p in Document(ROOT/lang/'wisdom-stories/door-to-the-heart.docx').paragraphs if p.text.strip()]
        assert paragraphs[0]==title
        assert len(paragraphs)==11
        assert paragraphs[1]!=painting[1]
        assert Image.open(ROOT/lang/'wisdom-stories/illustrations/light-of-the-world.webp').size==(1530,1200)

def test_story_illustration_cache_revision_is_repeatable():
    markup='<img src="../wisdom-stories/illustrations/light-of-the-world.webp?v=20261030qafixes"><img src="../wisdom-stories/illustrations/door-to-the-heart.webp?v=20261030qafixes">'
    result=pin_asset_versions(markup)
    assert f'light-of-the-world.webp?v={ILLUSTRATION_ASSET_VERSION}' in result
    assert f'door-to-the-heart.webp?v={ILLUSTRATION_ASSET_VERSION}' in result
    assert pin_asset_versions(result)==result


def test_uppercase_poem_illustration_folder_gets_current_cache_version():
    markup='<img src="../wisdom-stories/Etibar%20Siracsoy/Illustrations/my-lifes-journey.webp?v=20261103titles">'
    result=pin_asset_versions(markup)
    assert f'my-lifes-journey.webp?v={ILLUSTRATION_ASSET_VERSION}' in result
    assert pin_asset_versions(result)==result

