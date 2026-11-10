"""Stable initial toolbar placement and shared accessibility/SEO semantics."""
import re

def normalize(markup):
    language = re.search(r'<html\b[^>]*lang="([^"]+)"', markup)
    tools_label = {'az':'Alətlər','en':'Tools','de':'Werkzeuge','ru':'Инструменты','ky':'Куралдар'}.get(language[1] if language else 'en', 'Tools')
    # Keep the generator-owned, last alternate per language.
    alternates = list(re.finditer(r'<link\b[^>]*\bhreflang="([^"]+)"[^>]*>\s*', markup, re.I))
    seen = set()
    for match in reversed(alternates):
        lang = match[1].lower()
        if lang in seen:
            markup = markup[:match.start()] + markup[match.end():]
        seen.add(lang)
    markup = re.sub(r'<aside(\s+class="[^"]*story-nav[^\"]*"[^>]*)>(.*?)</aside>', r'<nav\1>\2</nav>', markup, flags=re.S)
    markup = re.sub(r'class="manual-content manual-tools"(?! role=)', f'class="manual-content manual-tools" role="region" aria-label="{tools_label}"', markup)
    markup = re.sub(r'class="sc-status" id="sc-status"(?! role=)', 'class="sc-status" id="sc-status" role="status"', markup)
    markup = markup.replace('role="region" aria-label="Tools"', f'role="region" aria-label="{tools_label}"')
    if 'data-page-toolbar' not in markup:
        start = re.search(r'<div\b[^>]*class="tools-bar[^\"]*"[^>]*data-tools="(?:home|category|sitemap)"[^>]*>', markup)
        if start:
            depth = 1
            for tag in re.finditer(r'<(/?)div\b[^>]*>', markup[start.end():]):
                depth += -1 if tag[1] else 1
                if not depth:
                    end = start.end() + tag.end()
                    block = markup[start.start():end]
                    markup = markup[:start.start()] + markup[end:]
                    anchor = re.search(r'<nav\b[^>]*class="breadcrumbs[^\"]*".*?</nav>', markup, re.S)
                    if not anchor:
                        anchor = re.search(r'<header\b[^>]*class="site-header[^\"]*".*?</header>', markup, re.S)
                    if anchor:
                        label = re.search(r'id="(?:home-view|tools-view)-label"[^>]*>([^<]+)', block)
                        label = label[1] if label else tools_label
                        slot = f'\n<div class="page-toolbar" data-page-toolbar="" role="region" aria-label="{label}">{block}</div>\n'
                        markup = markup[:anchor.end()] + slot + markup[anchor.end():]
                        markup = re.sub(r'(<body\b[^>]*class=")', r'\1has-page-toolbar ', markup, count=1)
                    else:
                        raise ValueError('Toolbar has no stable header anchor')
                    break
    return re.sub(r'[ \t]+\n', '\n', markup)
