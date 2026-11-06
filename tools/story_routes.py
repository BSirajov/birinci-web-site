"""Generate shared story-language routes from the published build manifest."""
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit


def story_routes(manifest, poems=None):
    routes = {}
    categories = {}
    for lang, catalog in manifest.items():
        categories[lang] = []
        seen = set()
        for category in catalog['categories']:
            slug = category['slug']
            categories[lang].append(slug)
            for story in category['stories']:
                stem = story['stem']
                if stem in seen:
                    raise ValueError(f'Duplicate story route: {lang}/{stem}')
                seen.add(stem)
                href = story.get('href') or f'categories/{slug}.html#{stem}'
                url = urlsplit(href)
                if (url.scheme or url.netloc or href.startswith('/') or '..' in url.path.split('/')
                        or unquote(url.fragment) != stem):
                    raise ValueError(f'Invalid story route: {lang}/{stem}: {href}')
                routes.setdefault(stem, {})[lang] = f'{lang}/{href}'
    poems = poems or {}
    for stem, translations in poems.items():
        if (stem not in routes or len(translations) != len(set(translations))
                or set(translations) != set(routes[stem])):
            raise ValueError(f'Poem translations list disagrees with published routes: {stem}')
    return {'stories': routes, 'categories': categories, 'poems': poems}


def routes_script(manifest):
    poems = json.loads(Path(__file__).with_name('poem-translations.json').read_text('utf-8'))
    return ('// Generated from tools/story-build-manifest.json; do not edit.\n'
            'window.__BIRINCI_STORY_ROUTES__ = '
            + json.dumps(story_routes(manifest, poems), ensure_ascii=False, separators=(',', ':')) + ';\n')
