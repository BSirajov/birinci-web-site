"""Focused coverage for German legal translations and published links."""
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from lxml import html
from legal_copy import pages_de, pages_en

ROOT = Path(__file__).resolve().parents[1]
SLUGS = ("terms-of-use", "cookie-policy", "legal-notice")


def test_translation_keeps_sections_and_disclosures():
    for slug in SLUGS:
        original, translated = pages_en()[slug], pages_de()[slug]
        assert len(original["highlights"]) == len(translated["highlights"])
        assert [s["id"] for s in original["sections"]] == [s["id"] for s in translated["sections"]]
        for a, b in zip(original["sections"], translated["sections"]):
            assert len(a["paragraphs"]) == len(b["paragraphs"])
            assert len(a["bullets"]) == len(b["bullets"])
    dispute = pages_de()["legal-notice"]["sections"][-1]["paragraphs"][0]
    assert "20. Juli 2025 eingestellt" in dispute
    assert "https://consumer-redress.ec.europa.eu/dispute-resolution-bodies" in dispute
    assert "ec.europa.eu/consumers/odr" not in dispute


def test_german_legal_navigation_resolves_to_german_pages():
    for path in (ROOT / "de").rglob("*.html"):
        if any(p.startswith("_") for p in path.relative_to(ROOT).parts):
            continue
        doc = html.fromstring(path.read_text(encoding="utf-8"))
        for link in doc.xpath('//a[@href]'):
            if link.get("data-lang"):
                continue  # Language choices intentionally leave the German section.
            href = link.get("href")
            url = urlsplit(urljoin("https://birinci.cloud/" + path.relative_to(ROOT).as_posix(), href))
            if url.netloc == "birinci.cloud" and Path(url.path).stem in SLUGS:
                assert url.path.startswith("/de/"), (path, href)
                assert (ROOT / url.path.lstrip("/")).is_file()
                assert "(Englisch)" not in link.text_content()


def test_legal_pages_and_language_targets():
    for slug in SLUGS:
        for lang in ("az", "de", "en", "ky", "ru"):
            doc = html.fromstring((ROOT / lang / (slug + ".html")).read_text(encoding="utf-8"))
            assert doc.xpath('//a[@data-lang="de"]/@href') == [f"../de/{slug}.html"]
            for target in ("az", "de", "en", "ky", "ru"):
                assert doc.xpath(f'//a[@data-lang="{target}"]/@href') == [f"../{target}/{slug}.html"]
            if lang == "de":
                assert doc.get("lang") == "de"
                assert len(doc.xpath('//article[@class="legal-doc"]//h2')) == 5
