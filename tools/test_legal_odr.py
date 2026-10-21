"""The legal notices describe the closed ODR service and link to current ADR help."""
from pathlib import Path

import pytest
from lxml import html
from legal_copy import page_for

URL = "https://consumer-redress.ec.europa.eu/dispute-resolution-bodies"
DATES = {"az": "20 iyul 2025", "en": "20 July 2025", "ru": "20 июля 2025", "ky": "2025-жылдын 20-июлунда", "de": "20. Juli 2025"}


@pytest.mark.parametrize("lang", DATES)
def test_legal_notice_uses_current_dispute_resolution_link(lang):
    section = next(s for s in page_for(lang, "legal-notice")["sections"] if s["id"] == "dispute")
    assert DATES[lang] in section["paragraphs"][0]
    assert URL in section["paragraphs"][0]
    path = Path(__file__).resolve().parents[1] / lang / "legal-notice.html"
    markup = path.read_text(encoding="utf-8")
    assert "ec.europa.eu/consumers/odr" not in markup
    doc = html.fromstring(markup)
    assert doc.xpath('//h2[@id="dispute"]/following-sibling::p[1]/a/@href') == [URL]
