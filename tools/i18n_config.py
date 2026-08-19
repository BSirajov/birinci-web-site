# -*- coding: utf-8 -*-
"""Locale configuration loaded from languages.json."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALES_DIR = Path(__file__).resolve().parent / "locales"
LANGUAGES_JSON = ROOT / "languages.json"


@lru_cache(maxsize=1)
def load_languages_config() -> dict:
    if not LANGUAGES_JSON.is_file():
        raise FileNotFoundError(f"Missing language config: {LANGUAGES_JSON}")
    data = json.loads(LANGUAGES_JSON.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("languages"), list):
        raise ValueError(f"{LANGUAGES_JSON} must be an object with a languages array")
    return data


def all_languages() -> list[dict]:
    return [lang for lang in load_languages_config()["languages"] if isinstance(lang, dict) and lang.get("code")]


def enabled_languages() -> list[dict]:
    return [lang for lang in all_languages() if lang.get("enabled", True)]


def is_implemented(lang: dict) -> bool:
    return bool(lang.get("implemented", True))


def show_in_switcher(lang: dict) -> bool:
    return bool(lang.get("show_in_switcher", True))


def switcher_languages() -> list[dict]:
    return [lang for lang in enabled_languages() if show_in_switcher(lang)]


def stories_ready(lang: dict | str | None = None) -> bool:
    """Whether this locale should publish story bodies (False = placeholder chrome)."""
    if isinstance(lang, str):
        lang = language_by_code(lang)
    if not isinstance(lang, dict):
        return True
    return bool(lang.get("stories_ready", True))


def implemented_languages() -> list[dict]:
    return [lang for lang in enabled_languages() if is_implemented(lang)]


def language_by_code(code: str) -> dict | None:
    return next((lang for lang in all_languages() if lang["code"] == code), None)


def lang_codes(enabled_only: bool = False) -> tuple[str, ...]:
    rows = enabled_languages() if enabled_only else all_languages()
    return tuple(str(lang["code"]) for lang in rows)


SUPPORTED_LANGS = lang_codes()
SOURCE_LANG = str(load_languages_config().get("source") or "az")
TARGET_LANGS = tuple(code for code in SUPPORTED_LANGS if code != SOURCE_LANG)
GATE_PROMPT = str(load_languages_config().get("gate_prompt") or "Choose language")
LANG_LABELS = {lang["code"]: str(lang.get("label") or lang["code"].upper()) for lang in all_languages()}
LANG_NAV_PREFIXES = {
    lang["code"]: tuple(lang.get("nav_prefixes") or ())
    for lang in implemented_languages()
    if lang.get("nav_prefixes")
}
TTS_VOICES = {lang["code"]: lang.get("tts_voice") for lang in all_languages()}
TTS_DIALOGUE_VOICES = {
    lang["code"]: lang.get("tts_dialogue_voice") for lang in all_languages()
}


def load_locale(lang: str) -> dict:
    if lang not in SUPPORTED_LANGS:
        raise ValueError(f"Unsupported lang {lang!r}; expected one of {SUPPORTED_LANGS}")
    path = LOCALES_DIR / f"{lang}.json"
    if not path.is_file():
        raise FileNotFoundError(f"Missing locale file: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"Locale {path} must be a JSON object")
    return data


def locale_root(lang: str) -> Path:
    return ROOT / lang


def source_root() -> Path:
    return ROOT / "source"


def story_sources(lang: str) -> Path:
    return source_root() / "stories" / lang


def discovery_sources(lang: str) -> Path:
    return source_root() / "discoveries" / lang


def progress_manifest_path() -> Path:
    return ROOT / "docs" / "i18n" / "translation_manifest.json"


def lang_label(lang: str) -> str:
    meta = language_by_code(lang)
    if meta and meta.get("label"):
        return str(meta["label"])
    return LANG_LABELS.get(lang, lang.upper())


def lang_name(lang: str) -> str:
    meta = language_by_code(lang)
    if meta and meta.get("name"):
        return str(meta["name"])
    return lang_label(lang)
