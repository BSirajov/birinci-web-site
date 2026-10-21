from pathlib import Path
from story_source_policy import is_story_collection


def test_only_generic_notices_are_removed():
    import json
    from story_source_policy import is_generic_story_notice, visible_story_paragraphs
    from remove_generic_story_notices import clean_html
    for lang in ('az', 'en', 'ru', 'ky', 'de'):
        notice = json.loads((Path(__file__).parent/'locales'/f'{lang}.json').read_text(encoding='utf-8'))['ui']['story_source']
        assert is_generic_story_notice(notice.replace('\n', ''))
        paragraphs = ['Story body.', 'Moral: Be kind.', notice, 'Etibar Siracsoy', 'Source: https://example.com/story']
        assert visible_story_paragraphs(paragraphs) == paragraphs[:2]+paragraphs[3:]
        source = '<p class="story__source"><span>'+notice.replace('\n', '</span><span>')+'</span></p>'
        article = '<article class="story"><p>Body</p>'+source+'<p>Etibar Siracsoy</p></article>'
        assert clean_html(article) == article.replace(source, '')
        intro = '<div class="intro__source">'+notice+'</div>'
        assert clean_html(intro) == intro
    assert not is_generic_story_notice('This story mentions internet sources.')

def test_compiled_collections_are_not_stories():
    for name in ["Kyrgyz_Wisdom_Stories_Collection.docx", "All_Stories_Combined.docx", "Moral-Stories-Collection.docx"]:
        assert is_story_collection(Path(name))
    for name in ["collecting-kindness.docx", "collection.docx", "telling-lies.docx"]:
        assert not is_story_collection(Path(name))
