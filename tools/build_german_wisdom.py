"""Generate only the German Wisdom section, from reviewed DOCX and existing templates.

Run with Python 3.12+ and python-docx/lxml. No deployment, image conversion,
source-document writes, or Discoveries generation takes place here.
The published AZ catalog supplies stable category membership and cross-language IDs;
German DOCX supplies every displayed story paragraph, including source credits.
"""
from __future__ import annotations

import copy
import json
import posixpath
import re
from story_source_policy import is_story_collection
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

from docx import Document
from lxml import etree, html

from stories_catalog import load_stories_catalog
from chrome_restore import SITE_CHROME_ASSET_VERSION

ROOT = Path(__file__).resolve().parents[1]
VERSION = SITE_CHROME_ASSET_VERSION
LANGS = ("az", "en", "ru", "ky", "de")
NAMES = dict(az="Azərbaycan", en="English", ru="Русский", ky="Кыргызча", de="Deutsch")
AUTHORS = {"bakhtiyar": "Bakhtiyar Sirajov", "etibar": "Etibar Siracsoy"}
# Etibar verse published in AZ (and DE sources) but not on the German site.
ETIBAR_POETRY_STEMS = {
    "time-has-passed",
    "flowers",
    "reflections",
    "my-lifes-journey",
    "pandemic-and-quarantine",
}
ETIBAR_DE_SENTENCE_TITLES = {
    "thoughtfulness": "Zuwendung",
    "life-flows-silently": "Zeit – das Leben, das lautlos dahinfließt",
    "another-day": "Wieder einen Tag gelebt …",
    "humanity-etibar-siracsoy": "Menschlichkeit",
    "relationships": "Beziehungen",
    "nails-lesson": "Die Geschichte eines Nagels",
    "small-changes-great-value": "Kleine Neuerungen, große Werte …",
}


ILLUSTRATION_STAMP = "20261019illust"
FORM_JUNK = frozenset({"top of form", "bottom of form"})
MORAL_LABEL_RE = re.compile(
    r"^(?:die\s+)?(?:lehre|moral)\s*:\s*(.*)$",
    re.I | re.S,
)


def canonical_stem(stem: str) -> str:
    return re.sub(r"^(?:bs_|es_)", "", stem).replace("nail’s-", "nails-")


def is_url_only(text: str) -> bool:
    return bool(re.match(r"^https?://\S+$", text.strip(), re.I))


def sentence_case_de(title: str) -> str:
    """Normalize spacing while preserving the reviewed German capitalization.

    Capitalized nouns are required in German, even when every word in a
    short title starts with a capital. Case cannot be inferred from that pattern.
    """
    return " ".join(title.split()).strip()


def normalize_de_paragraphs(paragraphs: list[str]) -> list[str]:
    """Strip citation URLs / form junk; normalize moral label to Lehre:."""
    paras = [p.strip() for p in paragraphs if p and p.strip()]
    while paras:
        last = paras[-1].strip()
        if is_url_only(last) or last.casefold() in FORM_JUNK:
            paras = paras[:-1]
            continue
        break
    out: list[str] = []
    for p in paras:
        if p == "Geschichten aus dem Internet gesammelt und mithilfe von KI bearbeitet. Alle Illustrationen sind KI-generiert.":
            locale = json.loads((ROOT / "tools/locales/de.json").read_text(encoding="utf-8"))
            out.append(locale["ui"]["story_source"])
            continue
        m = MORAL_LABEL_RE.match(p)
        if m:
            body = " ".join(m.group(1).split()).strip()
            out.append(f"Lehre: {body}" if body else "Lehre:")
        else:
            out.append(" ".join(p.split()).strip())
    return out


def inventory() -> tuple[dict, dict]:
    sources = {}
    for path in sorted((ROOT / "de/wisdom-stories").rglob("*.docx")):
        if is_story_collection(path):
            continue
        if any(part.lower() in {"backup", "_backups", "_reviews"} for part in path.parts):
            continue
        stem = canonical_stem(path.stem)
        if stem in sources:
            raise ValueError(f"Duplicate source: {stem}")
        paragraphs = [p.text.strip() for p in Document(path).paragraphs if p.text.strip()]
        if len(paragraphs) < 2:
            raise ValueError(f"Empty story: {path}")
        title = sentence_case_de(paragraphs[0])
        if stem in ETIBAR_DE_SENTENCE_TITLES:
            title = ETIBAR_DE_SENTENCE_TITLES[stem]
        body = normalize_de_paragraphs(paragraphs[1:])
        if not body:
            raise ValueError(f"Empty body after normalize: {path}")
        sources[stem] = dict(
            path=path.relative_to(ROOT).as_posix(),
            imageStem=path.stem,
            title=title,
            paragraphs=body,
            authorKey="bakhtiyar" if "Bakhtiyar Sirajov" in path.parts else
            "etibar" if "Etibar Siracsoy" in path.parts else "",
        )
    images = {}
    for p in (ROOT / "de/wisdom-stories").rglob("*.webp"):
        if any(part.lower() in {"backup", "_backups", "_reviews"} for part in p.parts):
            continue
        images[canonical_stem(p.stem)] = p
    published = load_stories_catalog("az")
    # German omits Etibar poetry; expect bijection with AZ minus poetry.
    ids = [
        s["stem"]
        for c in published["categories"]
        for s in c["stories"]
        if s["stem"] not in ETIBAR_POETRY_STEMS
    ]
    if (
        len(sources) != len(ids)
        or len(images) != len(ids)
        or len(ids) != len(set(ids))
        or set(ids) != set(sources)
        or set(ids) != set(images)
    ):
        missing_src = sorted(set(ids) - set(sources))
        missing_img = sorted(set(ids) - set(images))
        extra_src = sorted(set(sources) - set(ids))
        raise ValueError(
            "Expected bijection of German sources, AZ-minus-poetry IDs, and illustrations; "
            f"sources={len(sources)} images={len(images)} ids={len(ids)} "
            f"missing_src={missing_src[:8]} missing_img={missing_img[:8]} extra_src={extra_src[:8]}"
        )
    for stem, source in sources.items():
        source["image"] = images[stem].relative_to(ROOT / "de").as_posix()
    return sources, published


def pairs(en, de):
    if isinstance(en, dict) and isinstance(de, dict):
        for k in en.keys() & de.keys():
            yield from pairs(en[k], de[k])
    elif isinstance(en, list) and isinstance(de, list):
        for a, b in zip(en, de):
            yield from pairs(a, b)
    elif isinstance(en, str) and isinstance(de, str) and en:
        yield en, de


def replace_text(node, text):
    for child in list(node):
        node.remove(child)
    node.text = text


def rel(target, page):
    p = urlsplit(target)
    path = posixpath.relpath(p.path, posixpath.dirname(page))
    return urlunsplit(("", "", quote(path, safe="/-._"), p.query, p.fragment))


class Builder:
    def __init__(self):
        self.sources, self.az = inventory()  # verify before any writes
        self.locale = json.loads((ROOT / "tools/locales/de.json").read_text(encoding="utf-8"))
        english = json.loads((ROOT / "tools/locales/en.json").read_text(encoding="utf-8"))
        self.translations = dict(pairs(english, self.locale))
        self.translations.update({"Breadcrumb": "Brotkrumennavigation", "Email": "E-Mail",
            "QR code linking to birinci.cloud": "QR-Code zur Website birinci.cloud",
            "Show full-size brand icon": "Markenzeichen vergrößern", "Story pagination": "Geschichten durchblättern",
            "First story": "Erste Geschichte", "Last story": "Letzte Geschichte", "Story number": "Nummer der Geschichte",
            "Current story / total — enter a number to jump": "Aktuelle Geschichte / Gesamtzahl – Nummer zum Aufrufen eingeben",
            "Wisdom": "Weisheits", "stories": "geschichten", "Home": "Startseite",
            "Page navigation": "Seitennavigation", "Ctrl+K": "Strg+K",
            "© Birİnci - All rights reserved": "© Birİnci – Alle Rechte vorbehalten",
            "Privacy notice, Terms of use, Cookie policy and Legal notice (Imprint)": "Datenschutzhinweise, Nutzungsbedingungen, Cookie-Richtlinie und Impressum",
            "This page sets forth our purpose, our vision for the future, and our core principles. Our hearth aims to…": "Unser Auftrag, unsere Zukunftsvision und unsere Grundwerte.",
            "Send a comment or correction. There is no ticket system on the public site.": "Sende uns eine Anmerkung oder Korrektur. Die öffentliche Website hat kein Ticketsystem.",
            "How Birİnci handles information on the public website.": "Wie Birİnci mit Informationen auf der öffentlichen Website umgeht.",
            "The conditions for reading and reusing Birİnci’s public pages.": "Bedingungen für die Nutzung und Weiterverwendung der öffentlichen Seiten von Birİnci.",
            "What this site stores in your browser — and what it does not.": "Welche Informationen diese Website in deinem Browser speichert.",
            "Austrian and EU imprint information (MedienG / ECG). Only verified details are filled in.": "Impressumsangaben nach österreichischem und EU-Recht (MedienG / ECG). Alle Angaben sind geprüft."})
        self.catalog = dict(site_title=self.locale["site_title"], lang="de", categories=[])
        self.all = []
        self.counterparts = {}
        for lang in LANGS[:-1]:
            self.counterparts[lang] = {s["stem"]: c["slug"] for c in load_stories_catalog(lang)["categories"] for s in c["stories"]}
        for category in self.az["categories"]:
            translated = self.locale["categories"][category["slug"]]
            cat = dict(slug=category["slug"], title=translated["title"], blurb=translated["blurb"],
                       count=0, stories=[])
            for original in category["stories"]:
                stem = original["stem"]
                if stem in ETIBAR_POETRY_STEMS:
                    continue
                story = dict(stem=stem, **self.sources[stem], hasImage=True, hasAudio=False,
                             href=f"categories/{category['slug']}.html#{stem}")
                cat["stories"].append(story)
                self.all.append((story, cat))
            cat["count"] = len(cat["stories"])
            self.catalog["categories"].append(cat)
        self.article_template = self.template("en/categories/sevgi-ve-evlilik.html").xpath("//article")[0]
        self.outputs = []

    def template(self, path):
        root = html.fromstring((ROOT / path).read_text(encoding="utf-8"))
        for node in root.iter():
            if not isinstance(node.tag, str) or node.tag in ("script", "style"):
                continue
            for attr in ("text", "tail"):
                value = getattr(node, attr)
                if value and value.strip() in self.translations:
                    setattr(node, attr, value.replace(value.strip(), self.translations[value.strip()]))
            for key in ("title", "aria-label", "placeholder", "alt", "data-title", "data-blurb"):
                if node.get(key) in self.translations:
                    node.set(key, self.translations[node.get(key)])
        for node in root.xpath('//script[@type="application/ld+json"]'):
            node.getparent().remove(node)
        root.set("lang", "de")
        root.xpath("//body")[0].set("data-lang", "de")
        root.xpath("//body")[0].set("data-wisdom-generator", "german-docx")
        return root

    def article(self, story, page, standalone=False):
        article = copy.deepcopy(self.article_template)
        article.set("id", story["stem"])
        article.set("data-stem", story["stem"])
        article.set("data-title", story["title"])
        article.attrib.pop("data-audio", None)
        title = article.xpath('.//*[contains(@class,"story__title")]')[0]
        replace_text(title, "")
        if standalone:
            title.tag = "h1"
            title.text = story["title"]
        else:
            title.text = story["title"]
        for button in article.xpath('.//*[@aria-controls]'):
            prefix = button.get("aria-controls").split("-")[0]
            button.set("aria-controls", f'{prefix}-{story["stem"]}')
        for group in article.xpath('.//*[@data-story-tts]/ancestor::div[contains(@class,"story__action-group")][1]'):
            if group.getparent() is not None:
                group.getparent().remove(group)
        text = article.xpath('.//*[contains(@class,"story__text")]')[0]
        replace_text(text, None)
        text.set("id", f'text-{story["stem"]}')
        for paragraph in story["paragraphs"]:
            p = etree.SubElement(text, "p")
            is_source = paragraph == story["paragraphs"][-1] and (
                story["authorKey"]
                or paragraph == "Bakhtiyar Sirajov"
                or paragraph.startswith("Die Geschichte stammt")
                or "Internet" in paragraph
                or paragraph.startswith("Geschichten aus dem Internet")
                or paragraph.startswith("Die Geschichten stammen")
            )
            if paragraph.startswith("Lehre:"):
                p.set("class", "story__moral")
                p.text = paragraph
            elif is_source:
                p.set("class", "story__source")
                lines = [ln.strip() for ln in str(paragraph or "").splitlines() if ln.strip()]
                if not lines:
                    lines = [str(paragraph or "").strip()] if str(paragraph or "").strip() else []
                for line in lines:
                    span = etree.SubElement(p, "span")
                    span.set("class", "story__source-line")
                    span.text = line
            else:
                p.text = paragraph
        figure = article.xpath('.//figure')[0]
        figure.set("id", f'figure-{story["stem"]}')
        image = figure.xpath('.//img')[0]
        img_rel = rel("de/" + story["image"], page)
        if "?" not in img_rel:
            img_rel = f"{img_rel}?v={ILLUSTRATION_STAMP}"
        image.set("data-src", img_rel)
        image.set("alt", f'Comic-Illustration zu „{story["title"]}“ mit mehreren Bildtafeln.')
        image.set("width", "1536")
        image.set("height", "1024")
        figure.xpath('.//button')[0].set("aria-label", f'Illustration zu „{story["title"]}“ vergrößern')
        if standalone:
            article.set("class", "story news-card")
            image.set("src", image.attrib.pop("data-src"))
        return article

    def alternates(self, page, story=None, author=None):
        result = {"de": page}
        for lang in LANGS[:-1]:
            if story:
                category = self.counterparts[lang].get(story["stem"])
                if category:
                    result[lang] = f'{lang}/categories/{category}.html#{story["stem"]}'
            elif author:
                result[lang] = f"{lang}/index.html?view=list&author={author}"
            else:
                target = lang + page[2:]
                if (ROOT / target).is_file():
                    result[lang] = target
        return result

    def finish(self, root, page, title, description, story=None, author=None):
        head = root.xpath("//head")[0]
        if story or author or page in ("de/sitemap.html", "de/authors/index.html"):
            root.xpath("//body")[0].set("data-wisdom-static-breadcrumbs", "true")
        if story:
            root.xpath("//body")[0].set("data-wisdom-standalone", "true")
            description = story["title"] + ": " + story["paragraphs"][0]
            if len(description) > 200:
                description = description[:197].rsplit(" ", 1)[0] + " …"
            for meta in head.xpath('./meta[@property="og:image" or @name="twitter:image"]'):
                meta.set("content", "https://birinci.cloud/de/" + quote(story["image"], safe="/"))
        for globe in root.xpath('//*[@data-globe-lang]'):
            globe.set("data-globe-lang", "de")
            if globe.tag == "img":
                globe.set("src", rel("assets/language-globe-turk-plus-DE.webp", page) + "?v=" + VERSION)
        root.xpath("//title")[0].text = title + " · Birİnci"
        for meta in head.xpath('./meta[@name="description" or @property="og:description" or @name="twitter:description"]'):
            meta.set("content", description)
        for meta in head.xpath('./meta[@property="og:title" or @name="twitter:title"]'):
            meta.set("content", title + " · Birİnci")
        for meta in head.xpath('./meta[@property="og:locale"]'):
            meta.set("content", "de_DE")
        for meta in head.xpath('./meta[@property="og:url"]'):
            meta.set("content", "https://birinci.cloud/" + page)
        for link in head.xpath('./link[@rel="canonical" or @rel="alternate"]'):
            head.remove(link)
        etree.SubElement(head, "link", rel="canonical", href="https://birinci.cloud/" + page)
        alternatives = self.alternates(page, story, author)
        for lang, target in alternatives.items():
            etree.SubElement(head, "link", rel="alternate", hreflang=lang, href="https://birinci.cloud/" + target)
        if "en" in alternatives:
            etree.SubElement(head, "link", rel="alternate", hreflang="x-default", href="https://birinci.cloud/" + alternatives["en"])
        # Templates are at the same depth as their outputs; local assets remain shared.
        # Unavailable German sections link to existing English pages, clearly labelled.
        for node in root.xpath('//*[@href]'):
            href = node.get("href")
            parsed = urlsplit(href)
            if parsed.scheme or parsed.netloc or not parsed.path or node.get("hreflang"):
                continue
            target = posixpath.normpath(posixpath.join(posixpath.dirname(page), parsed.path))
            if target.startswith("de/") and not self.planned(target):
                counterpart = "en/" + target[3:]
                if (ROOT / counterpart).is_file():
                    node.set("href", rel(urlunsplit(("", "", counterpart, parsed.query, parsed.fragment)), page))
                    node.set("hreflang", "en")
                    node.set("lang", "de")
                    node.set("title", "Diese Seite ist auf Englisch verfügbar")
                    # Explicit notice on navigational text; leave SVG markup intact.
                    leaf = node.xpath('.//span[not(*)]')
                    if leaf:
                        leaf[-1].text = (leaf[-1].text or "") + " (Englisch)"
                    elif len(node) == 0:
                        node.text = (node.text or "") + " (Englisch)"
                else:
                    node.getparent().remove(node)
        switches = root.xpath('//nav[contains(@class,"lang-switcher")]')
        if switches:
            switch = switches[0]
            toggle = switch.xpath('.//button')[0]
            toggle.set("title", "Deutsch")
            toggle.xpath('.//img')[0].set("src", rel("flags/de.svg", page))
            toggle.xpath('.//span[contains(@class,"lang-switcher__name")]')[0].text = "DE"
            menu = switch.xpath('.//*[@role="listbox"]')[0]
            replace_text(menu, None)
            for lang in LANGS:
                if lang not in alternatives:
                    continue
                option = etree.SubElement(menu, "a", {"class": "lang-switcher__option", "role": "option", "href": rel(alternatives[lang], page),
                    "hreflang": lang, "data-lang": lang, "aria-selected": str(lang == "de").lower(), "title": NAMES[lang]})
                etree.SubElement(option, "img", {"class": "lang-switcher__flag", "src": rel(f"flags/{lang}.svg", page), "alt": "", "width": "20", "height": "14", "decoding": "async"})
                etree.SubElement(option, "span").text = lang.upper()
        for script in root.xpath('//script[@src]'):
            src = script.get("src")
            if any(x in src for x in ("i18n.js", "site.js", "story-compare.js", "compare-window.js")):
                script.set("src", src.split("?")[0] + "?v=" + VERSION)
        # Prose line breaks and archive pagination use the shared stylesheet.
        path = ROOT / page
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("<!DOCTYPE html>\n" + html.tostring(root, encoding="unicode", method="html"), encoding="utf-8")
        self.outputs.append(page)

    def planned(self, path):
        if (ROOT / path).is_file():
            return True
        if path in ("de/index.html", "de/sitemap.html", "de/stories/compare.html", "de/authors/index.html", "de/authors/bakhtiyar.html", "de/authors/etibar.html"):
            return True
        return path in {f'de/categories/{c["slug"]}.html' for c in self.catalog["categories"]}

    def breadcrumbs(self, root, page, entries):
        lists = root.xpath('//ol[contains(@class,"breadcrumbs__list")]')
        if not lists:
            return
        listing = lists[0]
        replace_text(listing, None)
        for name, target in entries:
            li = etree.SubElement(listing, "li", {"class": "breadcrumbs__item"})
            if target:
                etree.SubElement(li, "a", href=rel(target, page)).text = name
            else:
                li.set("aria-current", "page")
                etree.SubElement(li, "span").text = name

    def category_page(self, page, title, blurb, stories, story=None, author=None):
        root = self.template("en/categories/sevgi-ve-evlilik.html")
        replace_text(root.xpath('//header[contains(@class,"category-hero")]/h1')[0], title)
        replace_text(root.xpath('//p[contains(@class,"category-hero__lead")]')[0], blurb + ("" if story else f" · {len(stories)} Geschichten"))
        if story:
            hero = root.xpath('//header[contains(@class,"category-hero")]')[0]
            hero.getparent().remove(hero)
        listing = root.xpath('//*[@data-tools-list]')[0]
        replace_text(listing, None)
        for s in stories:
            listing.append(self.article(s, page, bool(story)))
        for cards in root.xpath('//*[@data-tools-cards]'):
            replace_text(cards, None)
            for s in stories:
                card = etree.SubElement(cards, "a", {"class": "cat-card page-card", "href": "#" + s["stem"],
                    "data-stem": s["stem"], "data-title": s["title"], "data-blurb": s["paragraphs"][0]})
                body = etree.SubElement(card, "div", {"class": "card-body"})
                etree.SubElement(body, "h2", {"class": "card-title"}).text = s["title"]
                etree.SubElement(body, "div", {"class": "card-desc"}).text = s["paragraphs"][0]
        toc = root.xpath('//*[@data-tools-nav]')[0]
        replace_text(toc, None)
        for s in stories:
            li = etree.SubElement(toc, "li", {"data-stem": s["stem"], "data-title": s["title"]})
            etree.SubElement(li, "a", href="#" + s["stem"]).text = s["title"]
        # Categories keep filtering and per-story controls; individual pages
        # don't need catalog-view switches that could hide their sole article.
        if story:
            for view in root.xpath('//*[@data-view="cards"]'):
                view.getparent().remove(view)
            for view in root.xpath('//*[@data-view="list"]'):
                view.attrib.pop("data-view", None)
                view.attrib.pop("hidden", None)
            for toolbar in root.xpath('//*[@data-tools="category"]'):
                toolbar.getparent().remove(toolbar)
            article = listing[0]
            index = next(i for i, (s, c) in enumerate(self.all) if s["stem"] == story["stem"])
            pager = etree.Element("nav", {"class": "wisdom-pager", "aria-label": "Vorherige und nächste Geschichte"})
            for i, label in ((index-1, "← Vorherige Geschichte"), (index+1, "Nächste Geschichte →")):
                if 0 <= i < len(self.all):
                    next_story = self.all[i][0]
                    etree.SubElement(pager, "a", href=rel(f'de/stories/{next_story["stem"]}.html', page)).text = label + ": " + next_story["title"]
            listing.addnext(pager)
            cat = self.all[index][1]
            entries = [("Weisheitsgeschichten", "de/index.html"), (cat["title"], f'de/categories/{cat["slug"]}.html'), (story["title"], None)]
            if story["authorKey"]:
                credit = article.xpath('.//p[@class="story__source"]')[0]
                name = credit.text
                replace_text(credit, None)
                etree.SubElement(credit, "a", href=rel(f'de/authors/{story["authorKey"]}.html', page)).text = name
        else:
            entries = [("Weisheitsgeschichten", "de/index.html"), (title, None)]
        self.breadcrumbs(root, page, entries)
        self.finish(root, page, title, blurb, story, author)

    def build(self):
        # Catalog and search use the same shared runtime formats as other locales.
        assetdir = ROOT / "de/assets"
        assetdir.mkdir(parents=True, exist_ok=True)
        (assetdir / "stories-data.js").write_text("window.__BIRINCI_STORIES__ = " + json.dumps(self.catalog, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
        search = [dict(title=s["title"], stem=s["stem"], category=c["title"], slug=c["slug"],
                       href=s["href"], hay=" ".join([s["title"], c["title"], *s["paragraphs"]]).lower()) for s, c in self.all]
        (assetdir / "search-index.js").write_text("window.__BIRINCI_SEARCH__ = " + json.dumps(search, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
        from chrome_restore import write_lang_i18n_from_locale
        write_lang_i18n_from_locale("de")
        root = self.template("en/index.html")
        page = "de/index.html"
        for c in self.catalog["categories"]:
            card = root.xpath(f'//a[contains(@class,"cat-card") and starts-with(@href,"categories/{c["slug"]}.html")]')[0]
            card.set("data-title", c["title"])
            card.set("data-blurb", c["blurb"])
            card.set("data-count", str(c["count"]))
            replace_text(card.xpath('.//h2')[0], c["title"])
            replace_text(card.xpath('.//*[contains(@class,"card-desc")]')[0], c["blurb"])
            replace_text(card.xpath('.//*[contains(@class,"cat-card__meta")]')[0], f'{c["count"]} Geschichten')
        for n in root.xpath('//*[@data-stories-script]'):
            n.set("data-stories-script", "assets/stories-data.js?v=" + VERSION)
        hero = root.xpath('//*[@id="about-hero-title"]')[0]
        replace_text(hero, "Weisheitsgeschichten")
        published = len(self.all)
        self.breadcrumbs(root, page, [("Weisheitsgeschichten", None)])
        self.finish(root, page, "Weisheitsgeschichten", f"{published} Weisheitsgeschichten, Gleichnisse und Gedichte auf Deutsch – nach Themen und Autoren geordnet, mit Illustrationen.")
        for c in self.catalog["categories"]:
            self.category_page(f'de/categories/{c["slug"]}.html', c["title"], c["blurb"], c["stories"])
        for key, name in AUTHORS.items():
            stories = [s for s, c in self.all if s["authorKey"] == key]
            kind = "Geschichten" if key == "etibar" else "Geschichten und Gedichte"
            self.category_page(f"de/authors/{key}.html", name, f"{kind} von {name} auf Deutsch.", stories, author=key)
        root = self.template("en/stories/compare.html")
        self.finish(root, "de/stories/compare.html", "Geschichten im Sprachvergleich", "Weisheitsgeschichten in den verfügbaren Sprachen nebeneinander lesen.")
        self.write_human_sitemap()
        self.directory("de/authors/index.html", "Autoren", all_stories=False)
        self.integrate_existing()
        self.integrate_sitemap()
        from german_story_routes import migrate
        migrate(ROOT)
        review = ROOT / "de/_reviews/wisdom-stories/web-integration"
        review.mkdir(parents=True, exist_ok=True)
        (review / "generation.json").write_text(json.dumps(dict(pages=self.outputs, story_count=len(self.all),
            mapping={s["stem"]: dict(source=s["path"], illustration="de/" + s["image"]) for s, c in self.all}), ensure_ascii=False, indent=2), encoding="utf-8")
        self.drop_unpublished_poetry_pages()
        print(
            f"Generated {len(self.outputs)} German pages; "
            f"{len(self.all)} published stories from {len(self.sources)} source/image pairs."
        )

    def drop_unpublished_poetry_pages(self):
        for stem in ETIBAR_POETRY_STEMS:
            path = ROOT / f"de/stories/{stem}.html"
            if path.is_file():
                path.unlink()
        sitemap = ROOT / "sitemap.xml"
        if sitemap.is_file():
            text = sitemap.read_text(encoding="utf-8")
            for stem in ETIBAR_POETRY_STEMS:
                text = re.sub(
                    r"\s*<url><loc>https://birinci\.cloud/de/stories/"
                    + re.escape(stem)
                    + r"\.html</loc></url>",
                    "",
                    text,
                )
            sitemap.write_text(text, encoding="utf-8")

    def write_human_sitemap(self):
        from chrome_restore import patch_emitted_html
        from html_sitemap import write_html_sitemaps

        write_html_sitemaps(
            lambda markup, lang, rel_path="": patch_emitted_html(markup, lang, rel_path=rel_path),
            langs=("de",),
        )

    def directory(self, page, title, all_stories):
        # Same category shell, but a static directory so every story is also
        # reachable without JavaScript and crawlable from the listing's sitemap.
        root = self.template("en/categories/sevgi-ve-evlilik.html")
        main = root.xpath("//main")[0]
        replace_text(main, None)
        section = etree.SubElement(main, "section", {"class": "category-page"})
        etree.SubElement(section, "h1").text = title
        for key, name in AUTHORS.items():
            p = etree.SubElement(section, "p")
            etree.SubElement(p, "a", href=rel(f"de/authors/{key}.html", page)).text = name
        if all_stories:
            for c in self.catalog["categories"]:
                heading = etree.SubElement(section, "h2")
                etree.SubElement(heading, "a", href=rel(f'de/categories/{c["slug"]}.html', page)).text = c["title"]
                ul = etree.SubElement(section, "ul")
                for s in c["stories"]:
                    li = etree.SubElement(ul, "li")
                    etree.SubElement(li, "a", href=rel('de/' + s['href'], page)).text = s["title"]
        self.breadcrumbs(root, page, [("Weisheitsgeschichten", "de/index.html"), (title, None)])
        self.finish(root, page, title, "Autoren, Themen und Geschichten der deutschen Weisheitsgeschichten.")

    def integrate_existing(self):
        # Surgical insertion only: existing language text/artwork/body stays intact.
        # Reruns are idempotent, without serializing the other locales' documents.
        for lang in LANGS[:-1]:
            for suffix in ["index.html", "stories/compare.html", *[f'categories/{c["slug"]}.html' for c in self.catalog["categories"]]]:
                path = ROOT / lang / suffix
                if not path.is_file():
                    continue
                text = path.read_text(encoding="utf-8")
                text = re.sub(r'((?:site|story-compare|compare-window)\.js)\?v=[^"\s<>]+', r'\1?v=' + VERSION, text)
                target = "de/" + suffix
                if 'hreflang="de"' not in text:
                    text = text.replace("</head>", f'<link rel="alternate" hreflang="de" href="https://birinci.cloud/{target}">\n</head>', 1)
                # Compare has its own runtime language controls, no dropdown.
                if 'class="lang-switcher__option"' in text and 'data-lang="de"' not in text:
                    current = f"{lang}/{suffix}"
                    option = f'<a class="lang-switcher__option" role="option" href="{rel(target,current)}" hreflang="de" data-lang="de" aria-selected="false" title="Deutsch"><img class="lang-switcher__flag" src="{rel("flags/de.svg",current)}" alt="" width="20" height="14" decoding="async"><span>DE</span></a>'
                    text = re.sub(r'(<div[^>]+id="lang-switcher-menu"[^>]*>)(.*?)(</div>)', lambda m: m[1]+m[2]+option+m[3], text, count=1, flags=re.S)
                if text != path.read_text(encoding="utf-8"):
                    path.write_text(text, encoding="utf-8")
        # Root landing language choice must expose the new section too.
        path = ROOT / "index.html"
        text = path.read_text(encoding="utf-8")
        text = re.sub(r'(site\.js)\?v=[^"\s<>]+', r'\1?v=' + VERSION, text)
        if 'hreflang="de" href="https://birinci.cloud/de/index.html"' not in text:
            text = text.replace("</head>", '<link rel="alternate" hreflang="de" href="https://birinci.cloud/de/index.html">\n</head>', 1)
        path.write_text(text, encoding="utf-8")
        if 'href="de/index.html"' not in text:
            root = html.fromstring(text)
            links = root.xpath('//a[@href="en/index.html"]')
            if links:
                # Find source tag (format independent), clone its existing styles.
                match = re.search(r'<a\b[^>]*href="en/index.html"[^>]*>.*?</a>', text, re.S)
                if match:
                    new = match[0].replace('en/index.html', 'de/index.html').replace('flags/en.svg', 'flags/de.svg').replace('data-lang="en"', 'data-lang="de"').replace('hreflang="en"', 'hreflang="de"').replace('English', 'Deutsch')
                    new = re.sub(r'>EN<', '>DE<', new)
                    text = text[:match.end()] + new + text[match.end():]
                    path.write_text(text, encoding="utf-8")
        # The root page localizes its own full-site cards in place for established
        # locales. German is Wisdom-only and must navigate to its real index.
        text = path.read_text(encoding="utf-8")
        needle = '      applyLang(code);\n    },\n    true'
        guard = '      if (!pack[code]) {\n        window.location.assign(link.href);\n        return;\n      }\n'
        text = re.sub("(?:" + re.escape(guard) + ")+", lambda match: guard, text)
        if guard not in text and needle in text:
            text = text.replace(needle, guard + needle, 1)
        if text != path.read_text(encoding="utf-8"):
            path.write_text(text, encoding="utf-8")

    def integrate_sitemap(self):
        # Add this section without regenerating unrelated URLs, dates, robots,
        # 404s, or applying a different Discoveries publication policy.
        path = ROOT / "sitemap.xml"
        if not path.is_file():
            return
        text = path.read_text(encoding="utf-8")
        additions = []
        for page in self.outputs:
            if page.endswith("/compare.html"):
                continue  # comparison UI follows the established noindex policy
            url = "https://birinci.cloud/" + page
            if "<loc>" + url + "</loc>" not in text:
                additions.append("  <url><loc>" + url + "</loc></url>")
        if additions:
            path.write_text(text.replace("</urlset>", "\n".join(additions) + "\n</urlset>"), encoding="utf-8")


if __name__ == "__main__":
    Builder().build()
