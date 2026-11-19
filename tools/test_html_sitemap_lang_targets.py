# -*- coding: utf-8 -*-
"""Sitemap builder keeps lang-switcher href and data-lang-target aligned."""
from html_sitemap import build_sitemap_page_html


def test_sitemap_rewrites_data_lang_target_not_only_href():
    index = """<!DOCTYPE html><html><head><title>Home</title>
<meta property="og:title" content="Home" />
<meta property="og:description" content="Home" />
<meta property="og:url" content="https://birinci.cloud/de/index.html" />
<meta name="twitter:title" content="Home" />
<meta name="twitter:description" content="Home" />
</head>
<body class="page-home" data-lang="de" data-wisdom-generator="german-docx">
<nav class="breadcrumbs"><ol class="breadcrumbs__list"></ol></nav>
<header class="site-header"><nav class="lang-switcher" aria-label="Sprache">
<button type="button" class="lang-switcher__toggle"></button>
<div class="lang-switcher__menu" id="lang-switcher-menu" role="listbox">
<a class="lang-switcher__option" href="../az/index.html" data-lang="az" data-lang-target="../az/index.html">AZ</a>
<a class="lang-switcher__option" href="../de/index.html" data-lang="de" data-lang-target="../de/index.html">DE</a>
</div></nav></header>
<main id="main"><div class="page-home__content">home</div></main>
</body></html>"""
    out = build_sitemap_page_html(index, "de")
    assert 'href="../az/sitemap.html"' in out
    assert 'data-lang-target="../az/sitemap.html"' in out
    assert 'data-lang-target="../az/index.html"' not in out
