"""Build public, searchable guides from the reviewed multilingual manual content."""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]
LANGS = ('az', 'de', 'en', 'ky', 'ru')
LABELS = {
 'az': ['İstifadəçi təlimatı','Sayta qayıt','Təlimatda axtar','Mövzu','Bütün mövzular','Naviqasiya','Hekayələri oxuma','Dil müqayisəsi','Rəy və təklif','Mobil və ayarlar','Təmizlə','Hamısını aç','Hamısını yığ','Çap et / PDF','bölmə','Uyğun bölmə tapılmadı. Axtarışı və ya mövzu filtrini dəyişin.','Şəkli böyüt','Bağla','Bölməyə keçid','Yuxarı','Saytın xəritəsi','Əsas məzmuna keç','Dillər'],
 'en': ['User guide','Back to website','Search this guide','Topic','All topics','Navigation','Reading stories','Language comparison','Feedback','Mobile and settings','Clear','Expand all','Collapse all','Print / PDF','sections','No matching sections. Try another search or topic.','Enlarge screenshot','Close','Link to section','Back to top','Sitemap','Skip to content','Languages'],
 'de': ['Benutzerhandbuch','Zur Website','Handbuch durchsuchen','Thema','Alle Themen','Navigation','Geschichten lesen','Sprachvergleich','Feedback','Mobilgeräte und Einstellungen','Zurücksetzen','Alle öffnen','Alle schließen','Drucken / PDF','Abschnitte','Keine passenden Abschnitte. Ändern Sie die Suche oder das Thema.','Bild vergrößern','Schließen','Link zum Abschnitt','Nach oben','Seitenübersicht','Zum Inhalt springen','Sprachen'],
 'ru': ['Руководство пользователя','На сайт','Поиск по руководству','Тема','Все темы','Навигация','Чтение рассказов','Сравнение языков','Обратная связь','Телефон и настройки','Сбросить','Развернуть всё','Свернуть всё','Печать / PDF','разделов','Подходящих разделов нет. Измените запрос или тему.','Увеличить снимок','Закрыть','Ссылка на раздел','Наверх','Карта сайта','Перейти к содержимому','Языки'],
 'ky': ['Колдонуучу колдонмосу','Сайтка кайтуу','Колдонмодон издөө','Тема','Бардык темалар','Навигация','Аңгемелерди окуу','Тилдерди салыштыруу','Пикир','Телефон жана жөндөөлөр','Тазалоо','Баарын ачуу','Баарын жабуу','Басып чыгаруу / PDF','бөлүм','Туура келген бөлүм табылган жок. Издөөнү же теманы өзгөртүңүз.','Сүрөттү чоңойтуу','Жабуу','Бөлүмгө шилтеме','Жогору','Сайт картасы','Мазмунга өтүү','Тилдер'],
}
GROUPS = ['navigation','reading','navigation','reading','reading','comparison','settings','settings','feedback','feedback','navigation','navigation']
TOPICS = ['navigation','reading','comparison','feedback','settings']
e = html.escape

def sitemap_link(lang):
    return f'<a class="sitemap-jump__chip sitemap-jump__chip--manual" href="user-manual.html">{e(LABELS[lang][0])}</a>'

def main():
    from lxml import html as lh
    from PIL import Image
    from dev_story_edit_server import _atomic_write_text
    from legal_meta import render_breadcrumbs_nav
    from chrome_restore import HELP_NAV_LABELS, SITE_ASSET_VERSION
    for lang in LANGS:
        m = json.loads((ROOT / 'docs/manuals' / f'manual-{lang}.json').read_text(encoding='utf-8'))
        t = LABELS[lang]
        locale = json.loads((ROOT / 'tools/locales' / f'{lang}.json').read_text(encoding='utf-8'))
        breadcrumbs = render_breadcrumbs_nav([
            ('../index.html', locale['home_crumb'], False),
            (None, HELP_NAV_LABELS[lang], True),
        ], lang)
        site = lh.fromstring((ROOT / lang / 'index.html').read_text(encoding='utf-8'))
        header = site.xpath('//header[contains(@class,"site-header")]')[0]
        for a in header.xpath('.//a[contains(@class,"lang-switcher__option")]'):
            target = f"../{a.get('data-lang')}/user-manual.html"
            a.set('href', target)
            a.set('data-lang-target', target)
        for a in header.xpath('.//*[@aria-current]'):
            a.attrib.pop('aria-current', None)
        for a in header.xpath('.//*[@data-nav-help]'):
            a.set('aria-current', 'page')
        chrome = lh.tostring(header, encoding='unicode') + lh.tostring(site.get_element_by_id('global-search'), encoding='unicode')
        footer = lh.tostring(site.get_element_by_id('site-footer'), encoding='unicode')
        page_jump = lh.tostring(site.xpath('//nav[@class="page-jump"]')[0], encoding='unicode')
        site_css = site.xpath('//link[contains(@href,"assets/site.css")]/@href')[0]
        site_js = site.xpath('//script[contains(@src,"assets/site.js")]/@src')[0]
        i18n_js = site.xpath('//script[contains(@src,"assets/i18n.js")]/@src')[0]
        sections, contents = [], []
        for i, s in enumerate(m['sections']):
            anchor = s['shot']
            dest = ROOT / 'assets/manuals' / lang / f'{anchor}.webp'
            dest.parent.mkdir(parents=True, exist_ok=True)
            source = ROOT / 'docs/manuals/screenshots-20261030' / lang / f'{anchor}.png'
            with Image.open(source) as im:
                w, h = im.size
                if not dest.exists() or dest.stat().st_mtime < source.stat().st_mtime:
                    im.save(dest, 'WEBP', quality=88, method=6)
            contents.append(f'<li><a href="#{anchor}" data-section="{anchor}">{e(s["title"])}</a></li>')
            paras = ''.join(f'<p data-search-text>{e(p)}</p>' for p in s['paras'])
            sections.append(f'''<section class="guide-section" data-topic="{GROUPS[i]}" id="{anchor}">
<details open><summary><h2 data-search-text>{e(s['title'])}</h2></summary>
<div class="section-body">{paras}<figure><a class="screenshot" href="../assets/manuals/{lang}/{anchor}.webp" aria-label="{e(t[16])}: {e(s['title'])}"><img src="../assets/manuals/{lang}/{anchor}.webp" width="{w}" height="{h}" loading="lazy" decoding="async" alt="{e(s['caption'])}"></a><figcaption data-search-text>{e(s['caption'])}</figcaption></figure>
<a class="permalink" href="#{anchor}">{e(t[18])} ↗</a></div></details></section>''')
        options = ''.join(f'<option value="{g}">{e(t[j+5])}</option>' for j,g in enumerate(TOPICS))
        alternates = ''.join(f'<link rel="alternate" hreflang="{l}" href="https://birinci.cloud/{l}/user-manual.html">' for l in LANGS)
        page = f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>{e(m['title'])} · Birİnci</title><meta name="description" content="{e(m['intro'])}"><link rel="canonical" href="https://birinci.cloud/{lang}/user-manual.html">{alternates}<link rel="icon" href="../assets/favicon.ico"><link rel="stylesheet" href="{site_css}"><link rel="stylesheet" href="../assets/user-manual.css?v={SITE_ASSET_VERSION}"><script src="{i18n_js}"></script><script src="{site_js}" defer></script><script src="../assets/user-manual.js?v={SITE_ASSET_VERSION}" defer></script></head>
<body id="top" class="page-user-manual" data-lang="{lang}" data-lang-page="user-manual.html"><a class="skip" href="#main">{e(t[21])}</a>
{chrome}
{breadcrumbs}
<div class="manual-content manual-tools"><div class="controls" hidden><div class="fields"><label><span class="guide-label-sr">{e(t[2])}</span><input id="guide-search" type="search" autocomplete="off" placeholder="{e(t[2])}…"></label><label><span class="guide-label-sr">{e(t[3])}</span><select id="guide-topic"><option value="all">{e(t[4])}</option>{options}</select></label></div></div></div>
<section class="intro manual-intro" aria-labelledby="manual-hero-title">
<div class="intro__atmosphere" aria-hidden="true"></div>
<div class="intro__content"><div class="intro__copy">
<h1 class="intro__brand" id="manual-hero-title"><span>{e(t[0])}</span></h1>
<p class="intro__lead">{e(m['intro'])}</p>
</div><div class="intro__visual"><img src="../assets/pearl-hero.webp" alt="" width="1536" height="1024" decoding="async"></div></div>
</section>
<div class="manual-content">
<div class="layout"><aside><nav aria-label="{e(m['contents'])}"><h2>{e(m['contents'])}<button type="button" class="contents-toggle" aria-expanded="false" aria-controls="manual-contents-list" aria-label="{e(m['contents'])}" hidden><span aria-hidden="true">☰</span></button></h2><ol id="manual-contents-list">{''.join(contents)}</ol></nav></aside>
<main id="main">
<p id="no-results" role="status" hidden>{e(t[15])}</p>{''.join(sections)}</main></div>
<dialog id="screenshot-dialog" aria-labelledby="screenshot-caption"><button type="button" id="close-dialog">{e(t[17])} ×</button><img alt=""><p id="screenshot-caption"></p></dialog></div>
{page_jump}{footer}</body></html>'''
        _atomic_write_text(ROOT / lang / 'user-manual.html', page)
        # Keep checked-in sitemaps discoverable without rebuilding unrelated pages.
        sitemap = ROOT / lang / 'sitemap.html'
        text = sitemap.read_text(encoding='utf-8')
        text = re.sub(r'<p class="manual-link">.*?</p>', '', text)
        text = re.sub(r'<a class="sitemap-jump__chip sitemap-jump__chip--manual"[^>]*>.*?</a>', '', text)
        text = re.sub(r'(<a class="sitemap-jump__chip sitemap-jump__chip--languages"[^>]*>.*?</a>)',
                      lambda match: match[1] + sitemap_link(lang), text, count=1)
        _atomic_write_text(sitemap, text)
    print('Built 5 HTML guides with 60 optimized screenshots.')

if __name__ == '__main__':
    main()
