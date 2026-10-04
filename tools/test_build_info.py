"""Public footer build stamp helpers."""
from datetime import datetime, timezone, timedelta
from pathlib import Path

from build_info import ROOT, format_offset, make_build_info, write_build_info

LIVE_LANGS = ("az", "en", "ru", "ky")


def test_make_build_info_compact_local_format():
    now = datetime(2026, 10, 3, 14, 40, tzinfo=timezone(timedelta(hours=2)))
    info = make_build_info(now)
    assert info["id"] == "20261003-1440"
    assert info["builtAt"] == "2026-10-03 14:40 +02:00"


def test_format_offset():
    now = datetime(2026, 10, 3, 14, 40, tzinfo=timezone(timedelta(hours=2)))
    assert format_offset(now) == "+02:00"


def test_write_build_info(tmp_path):
    now = datetime(2026, 10, 3, 14, 40, tzinfo=timezone(timedelta(hours=2)))
    path = write_build_info(tmp_path, now)
    text = path.read_text(encoding="utf-8")
    assert '"id": "20261003-1440"' in text
    assert '"builtAt": "2026-10-03 14:40 +02:00"' in text


def test_footer_stamp_js_is_english_build_id_only():
    site = (ROOT / "assets" / "site.js").read_text(encoding="utf-8")
    assert 'const FOOTER_COPY_LINE = "© Birİnci - All rights reserved";' in site
    assert 'stamp.textContent = " | Build " + info.id;' in site
    assert "© 2026" not in site
    assert " · Build " not in site
    assert "footer_build" not in site
    assert "footerBuildLabel" not in site
    assert "+ info.builtAt" not in site


def test_footer_build_i18n_stays_english():
    import json

    for lang in LIVE_LANGS:
        locale = json.loads(
            (ROOT / "tools" / "locales" / f"{lang}.json").read_text(encoding="utf-8")
        )
        assert locale["ui"]["footer_build"] == "Build"
        assert locale["ui"]["footer_rights_reserved"] == "All rights reserved"
