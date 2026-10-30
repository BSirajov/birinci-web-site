"""Rebuild reviewed story content using tracked page layouts and DOCX sources.

The manifest owns category membership, image paths and stable routes; Word owns
story text. Existing tracked HTML pages are layout templates. No recovered
bytecode, undocumented category module or media rewriting is required.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
import html as escape
import json
from pathlib import Path
import re
from urllib.parse import unquote

from docx import Document
from lxml import html
from PIL import Image

from chrome_restore import pin_asset_versions
from story_note_markup import MORAL, strip_moral_label
from story_source_policy import is_generic_story_notice, is_story_collection
from unpublished_stories import UNPUBLISHED_STEMS

ROOT = Path(__file__).resolve().parents[1]
LEGACY_NOTICES = {
    "Hekayələr internetdən toplanıb və süni intellekt vasitəsilə işlənib. Bütün illüstrasiyalar süni intellektlə yaradılıb.",
    "Stories collected from the internet and processed by AI. All illustrations are AI-generated.",
    "Истории собраны из интернета и обработаны с помощью ИИ. Все иллюстрации созданы ИИ.",
    "Истории собраны в интернете и обработаны с помощью ИИ. Все иллюстрации созданы ИИ.",
    "Аңгемелер интернеттен чогултулуп, жасалма интеллекттин жардамы менен иштелип чыккан. Бардык сүрөттөр жасалма интеллект аркылуу түзүлгөн.",
    "Geschichten aus dem Internet gesammelt und mithilfe von KI bearbeitet. Alle Illustrationen sind KI-generiert.",
}
POEMS = {"flowers", "my-lifes-journey", "pandemic-and-quarantine", "reflections", "time-has-passed"}


def normalize(text):
    return " ".join(text.split())


def read_story(path, lang, stem, approved_title, keep_urls=False, preserve_breaks=False, credit_display=None):
    paragraphs = [p.text.strip() for p in Document(path).paragraphs if p.text.strip()]
    if lang == "en" and stem == "not-my-concern":
        paragraphs = paragraphs[paragraphs.index("English") + 1:]
    if len(paragraphs) < 2:
        raise ValueError(f"Empty story: {path}")
    title = normalize(paragraphs[0])
    # AZ reviewed display capitalization is intentionally distinct from Word.
    az_case = lambda value: value.replace('İ', 'i').replace('I', 'ı').lower()
    if lang == "az" and az_case(title) == az_case(approved_title):
        title = approved_title
    body = []
    for p in paragraphs[1:]:
        if (normalize(p) in LEGACY_NOTICES or is_generic_story_notice(p)
                or (not keep_urls and re.fullmatch(r"https?://\S+", p))
                or p.casefold() in {"top of form", "bottom of form"}):
            continue
        if body and re.fullmatch(r"(?:İbrət|Nəticə|Moral|Lesson|Мораль|Урок|Сабак|Lehre):", body[-1], re.I):
            body[-1] += " " + p
        else:
            keep_break = preserve_breaks is True or (isinstance(preserve_breaks, list) and len(body) in preserve_breaks)
            body.append(p if keep_break else normalize(p))
    if lang == "de":
        body = [re.sub(r"^(?:Moral|(?:Die )?Lehre)\s*:", "Lehre:", p, flags=re.I) for p in body]
    if not any(MORAL.match(p) for p in body) and not (lang == "az" and stem in POEMS):
        raise ValueError(f"Missing moral: {path}")
    if credit_display:
        for i, p in enumerate(body):
            if p in credit_display:
                body[i] = credit_display[p]
    return title, body


def paragraph_markup(paragraphs, stem):
    parts, after_moral = [], False
    for i, text in enumerate(paragraphs):
        moral = bool(MORAL.match(text))
        source = after_moral or (stem in POEMS and i == len(paragraphs) - 1)
        cls = ' class="story__moral"' if moral else ' class="story__source"' if source else ''
        if moral:
            text = strip_moral_label(text)
            after_moral = True
        value = escape.escape(text).replace("\n", "<br />")
        parts.append(f"<p{cls}>{value}</p>")
    return "\n".join(parts)


def patch_page(text, stories):
    seen = set()

    def article(match):
        markup = match.group()
        opening = markup.split(">", 1)[0]
        ident = re.search(r'\bid="([^"]+)"', opening)
        if not ident or ident[1] not in stories:
            return markup
        stem = ident[1]
        story = stories[stem]
        node = html.fromstring(markup)
        titles = node.xpath('.//*[contains(concat(" ", normalize-space(@class), " "), " story__title ")]')
        bodies = node.xpath('.//*[contains(concat(" ", normalize-space(@class), " "), " story__text ")]')
        if len(titles) != 1 or len(bodies) != 1:
            raise ValueError(f"Ambiguous story template: {stem}")
        titles[0].text = story['title']
        if node.get('data-title') is not None:
            node.set('data-title', story['title'])
        body = bodies[0]
        for child in list(body):
            body.remove(child)
        body.text = None
        for fragment in html.fragments_fromstring(paragraph_markup(story['paragraphs'], stem)):
            body.append(fragment)
        if story.get('_imageSize'):
            for image in node.xpath('.//img'):
                src = image.get('src') or image.get('data-src') or ''
                if '/illustrations/' in src.lower():
                    image.set('width', str(story['_imageSize'][0]))
                    image.set('height', str(story['_imageSize'][1]))
        seen.add(stem)
        return html.tostring(node, encoding='unicode', method='html', with_tail=False)

    text = re.sub(r'<article\b[^>]*>.*?</article>', article, text, flags=re.S | re.I)
    return pin_asset_versions(text), seen


def plan_build(root, langs):
    manifest = json.loads((root / 'tools/story-build-manifest.json').read_text(encoding='utf-8'))
    writes = {}
    counts = {}
    for lang in langs:
        catalog = deepcopy(manifest[lang])
        registered = {s['source'] for c in catalog['categories'] for s in c['stories']}
        active = {
            p.relative_to(root).as_posix() for p in (root / lang / 'wisdom-stories').rglob('*.docx')
            if not is_story_collection(p) and not p.name.startswith('~$')
            and p.stem not in UNPUBLISHED_STEMS
            and not any(v.lower() in {'backup', '_backups', '_reviews', 'archive'} for v in p.parts)
        }
        if active != registered:
            raise ValueError(f"Source manifest mismatch in {lang}: unregistered={sorted(active - registered)}, missing={sorted(registered - active)}")
        stories = {}
        search = []
        for category in catalog['categories']:
            for story in category['stories']:
                stem = story['stem']
                if stem in UNPUBLISHED_STEMS or stem in stories:
                    raise ValueError(f"Unpublished or duplicate story: {lang}/{stem}")
                source = (root / story.pop('source')).resolve()
                if not source.is_relative_to(root.resolve()):
                    raise ValueError(f"Source outside project: {source}")
                title, paragraphs = read_story(source, lang, stem, story['title'],
                                               story.pop('keepSourceUrls', False),
                                               story.pop('preserveLineBreaks', False),
                                               story.pop('creditDisplay', None))
                story.update(title=title, paragraphs=paragraphs)
                image = root / lang / unquote(story.get('image') or f"wisdom-stories/illustrations/{story.get('imageStem') or stem}.webp")
                if not image.is_file():
                    raise FileNotFoundError(image)
                if lang == 'ky':
                    with Image.open(image) as opened:
                        story['_imageSize'] = opened.size
                stories[stem] = story
                search.append(dict(title=title, stem=stem, category=category['title'], slug=category['slug'],
                                   href=story.get('href') or f"categories/{category['slug']}.html#{stem}",
                                   hay=' '.join([title, category['title'], *paragraphs]).lower()))
            category['count'] = len(category['stories'])
        counts[lang] = len(stories)
        seen = set()
        for path in (root / lang).rglob('*.html'):
            if any(p in {'wisdom-stories', 'discovery-articles', '_reviews', '_backups', 'Archive'} for p in path.relative_to(root).parts):
                continue
            text = path.read_text(encoding='utf-8')
            # Update names in navigation/card attributes before inserting DOCX text.
            for cat in manifest[lang]['categories']:
                for original in cat['stories']:
                    old, new = original['title'], stories[original['stem']]['title']
                    if old != new:
                        text = text.replace(escape.escape(old, quote=True), escape.escape(new, quote=True))
            updated, page_stems = patch_page(text, stories)
            seen.update(page_stems)
            writes[path] = updated
        if seen != set(stories):
            raise ValueError(f"Missing story page templates: {lang}: {sorted(set(stories) - seen)}")
        for story in stories.values():
            story.pop('_imageSize', None)
        writes[root / lang / 'assets/stories-data.js'] = 'window.__BIRINCI_STORIES__ = ' + json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + ';\n'
        writes[root / lang / 'assets/search-index.js'] = 'window.__BIRINCI_SEARCH__ = ' + json.dumps(search, ensure_ascii=False, separators=(',', ':')) + ';\n'
    for path in root.glob('*.html'):
        writes[path] = pin_asset_versions(path.read_text(encoding='utf-8'))
    return writes, counts


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lang', choices=['all', 'az', 'de', 'en', 'ky', 'ru'], default='all')
    parser.add_argument('--check', action='store_true', help='Validate sources and templates without writing files')
    args = parser.parse_args(argv)
    langs = ['az', 'de', 'en', 'ky', 'ru'] if args.lang == 'all' else [args.lang]
    writes, counts = plan_build(ROOT, langs)
    if not args.check:
        from dev_story_edit_server import _atomic_write_text
        for path, text in writes.items():
            if path.read_text(encoding='utf-8') != text:
                _atomic_write_text(path, text)
        from chrome_restore import write_lang_i18n_from_locale
        for lang in langs:
            write_lang_i18n_from_locale(lang)
    print(('Validated' if args.check else 'Built') + ' reviewed site: ' + json.dumps(counts))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
