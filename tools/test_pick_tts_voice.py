#!/usr/bin/env python3
"""Regression checks for Azerbaijani Discoveries TTS voice ranking.

Mirrors assets/site.js pickVoice: Babek / az-AZ wins; English is never chosen for AZ.
"""
from __future__ import annotations

import re
import sys


def score_az(voice: dict) -> int:
    lang = str(voice.get("lang") or "")
    name = str(voice.get("name") or "")
    name_l = name.lower()
    configured = "az-az-babekneural"
    if re.search(r"^en\b", lang, re.I) or re.search(
        r"english|david|zira|mark\b|susan|george|hazel|google us english|google uk english",
        name_l,
        re.I,
    ):
        return -1000
    s = 0
    if configured in name_l or configured.replace("neural", "") in name_l:
        s += 120
    if re.search(r"babek", name, re.I):
        s += 100
    if re.search(r"^az\b", lang, re.I):
        s += 60
    if re.search(r"azərbaycan|azerbaijani|babek", name, re.I):
        s += 50
    if re.search(r"male", name, re.I) and re.search(r"^az\b", lang, re.I):
        s += 8
    return s


def pick_az(voices: list[dict]) -> dict | None:
    best = None
    best_score = 0
    for voice in voices:
        s = score_az(voice)
        if s > best_score:
            best = voice
            best_score = s
    if best:
        return best
    for voice in voices:
        lang = str(voice.get("lang") or "")
        name = str(voice.get("name") or "")
        if score_az(voice) <= -1000:
            continue
        if re.search(r"^tr\b", lang, re.I) or re.search(r"turkish|türk", name, re.I):
            return voice
    return None


def main() -> int:
    voices = [
        {"name": "Google US English", "lang": "en-US"},
        {"name": "Microsoft David - English (United States)", "lang": "en-US"},
        {"name": "Microsoft Server Speech Text to Speech Voice (en-US, GuyNeural)", "lang": "en-US"},
        {"name": "Google Türkçe", "lang": "tr-TR"},
        {
            "name": "Microsoft Babek Online (Natural) - Azerbaijani (Azerbaijan)",
            "lang": "az-AZ",
        },
        {"name": "Microsoft Banu Online (Natural) - Azerbaijani (Azerbaijan)", "lang": "az-AZ"},
    ]
    picked = pick_az(voices)
    assert picked is not None, "expected an AZ voice"
    assert "Babek" in picked["name"], picked
    assert not str(picked["lang"]).lower().startswith("en"), picked

    no_babek = [v for v in voices if "Babek" not in v["name"]]
    picked = pick_az(no_babek)
    assert picked is not None
    assert picked["lang"].lower().startswith("az"), picked
    assert "Banu" in picked["name"], picked

    english_only = [v for v in voices if str(v["lang"]).lower().startswith("en")]
    picked = pick_az(english_only)
    assert picked is None, picked

    fallback = [
        {"name": "Google US English", "lang": "en-US"},
        {"name": "Yelda", "lang": "tr-TR"},
    ]
    picked = pick_az(fallback)
    assert picked is not None
    assert picked["lang"] == "tr-TR", picked

    print("test_pick_tts_voice: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
