# -*- coding: utf-8 -*-
"""
Build sticky-note lexicon from ADİL PDF volumes (non-Turkic origins only).

Reads the four PDFs in assets/lexicon/, decodes their custom Latin-1-mapped
encoding, extracts headwords whose etymology mark is non-Turkic
(ər., fars., yun., lat., fr., rus., …), and writes popup-data.js for the UI.
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import pymupdf

ROOT = Path(r"c:/dev/birinci-web-site")
LEX = ROOT / "assets" / "lexicon"
OUT = LEX / "data"
STAMP = "20260822c"

# PDF text is extracted with a fixed remapping of Latin-1 codepoints → AZ Latin.
DECODE = str.maketrans(
    {
        "à": "a",
        "á": "b",
        "â": "v",
        "ã": "q",
        "ä": "d",
        "å": "e",
        "æ": "ə",
        "ç": "z",
        "è": "i",
        "é": "y",
        "ê": "k",
        "ë": "l",
        "ì": "m",
        "í": "n",
        "î": "o",
        "ï": "p",
        "ð": "r",
        "ñ": "s",
        "ò": "t",
        "ó": "u",
        "ô": "f",
        "õ": "x",
        "ö": "ü",
        "÷": "ç",
        "ø": "ş",
        "ù": "h",
        "ú": "c",
        "û": "ı",
        "ü": "ğ",
        "ý": "g",
        "þ": "ö",
        "ÿ": "ə",
        "À": "A",
        "Á": "B",
        "Â": "V",
        "Ã": "Q",
        "Ä": "D",
        "Å": "E",
        "Æ": "Ə",
        "Ç": "Z",
        "È": "İ",
        "É": "Y",
        "Ê": "K",
        "Ë": "L",
        "Ì": "M",
        "Í": "N",
        "Î": "O",
        "Ï": "P",
        "Ð": "R",
        "Ñ": "S",
        "Ò": "T",
        "Ó": "U",
        "Ô": "F",
        "Õ": "X",
        "Ö": "Ü",
        "×": "Ç",
        "Ø": "Ş",
        "Ù": "H",
        "Ú": "C",
        "Û": "I",
        "Ü": "Ğ",
        "Ý": "G",
        "Þ": "Ö",
        "ß": "Ə",
    }
)

POS_RE = (
    r"is\.|f\.is\.|f\.|sif\.|zərf\.?|əv\.|say\.|bağ\.|bağl\.|nid\.|nida|əd\.|qoş\.|"
    r"məch\.|icb\.|qarş\.|əmr\.|şüh\.|nəql\.|cəm\.?|zool\.|bot\.|fiziol\.|"
    r"fiz\.|kim\.|arxit\.|din\.|klas\.|köhn\.|məc\.|dan\.|kit\.|"
    r"tar\.|coğr\.|musiqi\.|mus\.|rıy\.|riyaz\.|tib\.|astr\.|fəls\.|"
    r"hüq\.|iqt\.|siy\.|ədəb\.|dilç\.|şair\.|fon\.|"
    r"xüs\.|tex\.|top\.|idm\.|anat\.|hərb\.|mal\.|əcz\.|mat\.|biol\.|coğ\."
)

# Core part-of-speech tags (not field/style labels).
CORE_POS = {
    "is.",
    "f.",
    "f.is.",
    "sif.",
    "zərf.",
    "zərf",
    "əv.",
    "say.",
    "bağ.",
    "bağl.",
    "nid.",
    "nida",
    "əd.",
    "qoş.",
}

HEAD_RE = re.compile(
    rf"^([A-ZƏÖÜĞÇŞİI][A-ZƏÖÜĞÇŞİI0-9\-’'/\.]{{0,48}})"
    rf"(?:\s+((?:{POS_RE})(?:\s*,\s*(?:{POS_RE}))*))?"
    rf"(?:\s+(\[[^\]]{{1,160}}\]))?"
    rf"(?:\s+((?:{POS_RE})(?:\s*,\s*(?:{POS_RE}))*))?"
    rf"(?:\s+(.*))?$",
    re.UNICODE,
)

POS_ONLY_RE = re.compile(
    rf"^((?:{POS_RE})(?:\s*,\s*(?:{POS_RE}))*)\s*(.*)$",
    re.UNICODE | re.IGNORECASE,
)

BAX_RE = re.compile(
    r"^(?:b\s*a\s*x|bax)\s+([A-Za-zÇçƏəĞğIıİiÖöŞşÜü\-’']+)",
    re.UNICODE | re.IGNORECASE,
)

ORIGIN_RE = re.compile(r"\[([^\]]{1,160})\]")

LANG_PATTERNS = [
    (re.compile(r"\bər(?:əb)?\b|\bəreb\b", re.I), "ərəb"),
    (re.compile(r"\bfars\b", re.I), "fars"),
    (re.compile(r"\byun(?:an)?\b", re.I), "yunan"),
    (re.compile(r"\blat(?:ın|in)?\b", re.I), "latın"),
    (re.compile(r"\bfr(?:ans)?\b", re.I), "fransız"),
    (re.compile(r"\bing(?:ilis)?\b", re.I), "ingilis"),
    (re.compile(r"\balm(?:an)?\b", re.I), "alman"),
    (re.compile(r"\brus\b", re.I), "rus"),
    (re.compile(r"\bital(?:yan)?\b|\bit\b", re.I), "italyan"),
    (re.compile(r"\bisp(?:an)?\b", re.I), "ispan"),
    (re.compile(r"\bport(?:uqal)?\b", re.I), "portuqal"),
    (re.compile(r"\bholl(?:and)?\b", re.I), "holland"),
    (re.compile(r"\bxar(?:ici)?\b", re.I), "xarici"),
    (re.compile(r"\btürk\b|\bturk\b", re.I), "türk"),
]

TURKIC = {"türk"}
NON_TURKIC_OK = {
    "ərəb",
    "fars",
    "yunan",
    "latın",
    "fransız",
    "ingilis",
    "alman",
    "rus",
    "italyan",
    "ispan",
    "portuqal",
    "holland",
    "xarici",
}


def lower_az(s: str) -> str:
    s = (s or "").strip().replace("İ", "i").replace("I", "ı")
    return s.casefold()


def decode(s: str) -> str:
    return s.translate(DECODE)


def pdfs() -> list[Path]:
    return sorted(LEX.glob("*.pdf"))


def extract_pdf_text(path: Path) -> str:
    doc = pymupdf.open(path)
    start = 0
    for i in range(min(80, doc.page_count)):
        t = decode(doc.load_page(i).get_text("text") or "")
        marked = len(
            re.findall(
                r"^[A-ZƏÖÜĞÇŞİI][A-ZƏÖÜĞÇŞİI0-9\-’']{0,40}\s+(?:is\.|sif\.|zərf)",
                t,
                re.M,
            )
        )
        if marked >= 3:
            start = i
            break
    parts: list[str] = []
    for i in range(start, doc.page_count):
        parts.append(decode(doc.load_page(i).get_text("text") or ""))
    doc.close()
    return "\n".join(parts)


def has_core_pos(pos: str | None) -> bool:
    if not pos:
        return False
    parts = [p.strip().casefold() for p in pos.split(",")]
    return any(p in {c.casefold() for c in CORE_POS} for p in parts)


def normalize_pos(pos: str | None) -> str | None:
    if not pos:
        return None
    parts = []
    for p in re.split(r"\s*,\s*", pos.strip()):
        p = p.strip()
        if not p:
            continue
        low = p.casefold()
        if low == "cəm":
            p = "cəm"
        elif low == "zərf":
            p = "zərf"
        elif low == "nida":
            p = "nida"
        elif not p.endswith(".") and low not in {"zərf", "nida", "cəm"}:
            # keep as-is
            pass
        parts.append(p)
    return ", ".join(parts) if parts else None


def ensure_pos(pos: str | None, gloss: str, body_text: str) -> tuple[str | None, str | None]:
    """Return (pos, bax_target). Default unmarked definitions to is. (ADİL practice)."""
    pos = normalize_pos(pos)
    bax_target = None
    bm = BAX_RE.match(body_text.strip()) or BAX_RE.match(gloss.strip())
    if bm:
        bax_target = lower_az(bm.group(1).rstrip("."))

    if has_core_pos(pos):
        return pos, bax_target

    # Unmarked headwords with a real definition are nouns in ADİL.
    g = (gloss or "").strip()
    if g and not BAX_RE.match(g):
        if pos:
            # Keep field labels, add core POS.
            if "is." not in pos.casefold():
                pos = "is., " + pos
        else:
            pos = "is."
    return normalize_pos(pos), bax_target


def normalize_space(s: str) -> str:
    s = s.replace("\u00a0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s


def parse_origin(raw_inner: str) -> dict:
    raw = "[" + raw_inner.strip().strip("[]") + "]"
    inner = raw_inner.replace("\n", " ")
    inner = re.sub(r"\s+", " ", inner).strip()
    langs: list[str] = []
    for pat, code in LANG_PATTERNS:
        if pat.search(inner):
            if code not in langs:
                langs.append(code)
    primary = next((x for x in langs if x != "türk"), None)
    if primary is None and langs:
        primary = langs[0]
    uncertain = bool(re.search(r"\bxar\b|ehtimal|mübahis|qeyri", inner, re.I))
    original = None
    m = re.search(r"[“\"]([^”\"]{1,80})[”\"]", inner)
    if m:
        original = m.group(1).strip()
    if not original:
        # e.g. [lat. adapto – uyğunlaşdırıram], [ər. əmirülbəhr – …]
        m2 = re.search(
            r"(?:ər|ərəb|fars|yun|yunan|lat|latın|fr|ing|alm|rus|ital)\.?\s+"
            r"([A-Za-zÇçƏəĞğIıİiÖöŞşÜü\-’']{2,48})"
            r"(?:\s*(?:–|-|—)\s*|\s+söz)",
            inner,
            re.I,
        )
        if m2:
            cand = m2.group(1).strip()
            if cand.casefold() not in {
                "əsli",
                "söz",
                "sözü",
                "və",
                "ile",
                "ilə",
            }:
                original = cand
    note = inner if len(inner) > 12 else None
    return {
        "language": primary,
        "languages": langs,
        "original": original,
        "uncertain": uncertain,
        "note": note,
        "raw": raw,
    }


def is_non_turkic(origin: dict) -> bool:
    langs = origin.get("languages") or []
    if not langs and not origin.get("raw"):
        return False
    if any(x in TURKIC for x in langs) and not any(x in NON_TURKIC_OK for x in langs):
        return False
    if any(x in NON_TURKIC_OK for x in langs):
        return True
    # Unknown bracket with language-looking abbreviation — keep if not clearly turkic-only
    raw = origin.get("raw") or ""
    if re.search(r"\[(ər|fars|yun|lat|fr|ing|alm|rus|ital|isp|xar)\b", raw, re.I):
        return True
    return False


def lemma_id(lemma: str) -> str:
    s = lower_az(lemma)
    s = re.sub(r"[^a-zəöüğçşı0-9\-]+", "", s)
    return s or "x"


def first_gloss(rest: str) -> str:
    text = re.sub(r"\s+", " ", (rest or "").strip())
    if not text:
        return ""
    text = ORIGIN_RE.sub("", text, count=1).strip(" ;.-")
    text = re.sub(r"^(b\s*a\s*x|bax)\s+[^\s,;]+[.,]?\s*", "", text, flags=re.I)
    text = re.sub(
        r"^(köhn\.|klas\.|məc\.|dan\.|kit\.|şair\.|fon\.|tar\.|din\.)\s*",
        "",
        text,
        flags=re.I,
    )
    text = re.sub(r"^(\d+[.)]\s*|//\s*)+", "", text)
    # Stop before next sense, proverb mark, or author initials after a sentence.
    parts = re.split(
        r"\s+(?://|◊)\s+|\s+\d+[.)]\s+|(?<=\.)\s+(?=[A-ZƏÖÜĞÇŞİI]\.[A-ZƏÖÜĞÇŞİI]|[A-ZƏÖÜĞÇŞİI][a-zəöüğçşı]{2,}\s*:)",
        text,
        maxsplit=1,
    )
    gloss = (parts[0] if parts else text).strip(" ;.-")
    if len(gloss) > 320:
        gloss = gloss[:319].rstrip() + "…"
    return gloss


def iter_entries(full_text: str, volume: str):
    # Join hyphenated line breaks inside words: "uyğunlaş-\ndırmaq"
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", full_text)
    lines = [ln.strip() for ln in text.splitlines()]
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line:
            i += 1
            continue
        m = HEAD_RE.match(line)
        if not m:
            i += 1
            continue
        lemma = m.group(1)
        pos = m.group(2) or m.group(4)
        bracket = m.group(3)
        rest = m.group(5) or ""
        if len(lemma) < 2 or lemma in {"A", "B", "C", "Ç", "D", "E", "Ə"}:
            i += 1
            continue
        body = [rest] if rest else []
        j = i + 1
        while j < len(lines):
            nxt = lines[j]
            if not nxt:
                j += 1
                continue
            if HEAD_RE.match(nxt):
                break
            body.append(nxt)
            j += 1
            if sum(len(x) for x in body) > 1600:
                break
        body_text = re.sub(r"\s+", " ", " ".join(body)).strip()

        # POS sometimes sits at the start of the body after the origin mark.
        if not pos:
            pm = POS_ONLY_RE.match(body_text)
            if pm:
                pos = pm.group(1)
                body_text = (pm.group(2) or "").strip()

        origin_raw = bracket
        if not origin_raw:
            om = ORIGIN_RE.search((rest + " " + body_text)[:220])
            if om:
                origin_raw = "[" + om.group(1) + "]"
        if not origin_raw:
            i = j
            continue

        origin = parse_origin(origin_raw.strip("[]"))
        if not is_non_turkic(origin):
            i = j
            continue

        gloss = first_gloss(body_text)
        if not pos:
            pm = POS_ONLY_RE.match(gloss)
            if pm:
                pos = pm.group(1)
                gloss = (pm.group(2) or "").strip()
        if len(gloss) < 8:
            # Fall back to a longer slice of the entry body
            gloss = first_gloss(body_text[:500]) or body_text[:200].strip()
            gloss = re.sub(r"^(\d+[.)]\s*)+", "", gloss).strip()
            if not pos:
                pm = POS_ONLY_RE.match(gloss)
                if pm:
                    pos = pm.group(1)
                    gloss = (pm.group(2) or "").strip()
            if len(gloss) > 320:
                gloss = gloss[:319].rstrip() + "…"

        # Drop obvious front-matter / instruction false positives
        low = lower_az(gloss)
        if "mürəkkəb sözlərdə mənşə" in low or "lüğətdən istifadə" in low:
            i = j
            continue
        if "tərkibi başqa-başqa dillərə" in low:
            i = j
            continue

        # Skip empty intro-example heads (no definition body).
        if len(re.sub(r"\s+", "", gloss)) < 3 and not BAX_RE.match(body_text):
            i = j
            continue

        pos, bax_target = ensure_pos(pos, gloss, body_text)

        yield {
            "id": lemma_id(lemma),
            "lemma": lemma,
            "pos": pos,
            "gloss": gloss,
            "bax_target": bax_target,
            "origin": origin,
            "source": {"document": "ADİL", "volume": volume, "entry": lemma},
            "forms": [lower_az(lemma)],
        }
        i = j


def compact(entry: dict) -> dict:
    origin = entry.get("origin") or {}
    return {
        "lemma": entry["lemma"],
        "pos": entry.get("pos"),
        "gloss": entry.get("gloss") or "",
        "origin": {
            "language": origin.get("language"),
            "languages": origin.get("languages") or [],
            "original": origin.get("original"),
            "uncertain": bool(origin.get("uncertain")),
            "note": origin.get("note"),
            "raw": origin.get("raw"),
        },
        "example": None,
        "source": entry.get("source") or {},
    }


def resolve_bax_pos(entries: dict[str, dict], form_to_id: dict[str, str]) -> int:
    """Copy POS from bax targets when the cross-ref entry has no core POS."""
    fixed = 0
    for e in entries.values():
        target = e.pop("bax_target", None)
        if has_core_pos(e.get("pos")):
            continue
        if not target:
            continue
        tid = form_to_id.get(target) or form_to_id.get(lower_az(target))
        if not tid:
            continue
        src = entries.get(tid)
        if src and has_core_pos(src.get("pos")):
            e["pos"] = src.get("pos")
            fixed += 1
        elif not e.get("pos"):
            e["pos"] = "is."
            fixed += 1
    # Any remaining empty POS → is.
    for e in entries.values():
        if not e.get("pos"):
            e["pos"] = "is."
            fixed += 1
    return fixed


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = pdfs()
    if len(files) != 4:
        raise SystemExit(f"Expected 4 PDFs in {LEX}, found {len(files)}")

    raw_entries: dict[str, dict] = {}
    form_to_id: dict[str, str] = {}
    lang_counts: Counter[str] = Counter()
    per_volume: dict[str, int] = {}

    for path in files:
        volume = path.stem
        print(f"Extracting {path.name} ...")
        text = normalize_space(extract_pdf_text(path))
        n = 0
        for e in iter_entries(text, volume):
            cid = e["id"]
            prev = raw_entries.get(cid)
            if prev and len(prev.get("gloss") or "") >= len(e.get("gloss") or ""):
                form_to_id[lower_az(e["lemma"])] = cid
                continue
            raw_entries[cid] = e
            form_to_id[lower_az(e["lemma"])] = cid
            lang = (e.get("origin") or {}).get("language") or "?"
            lang_counts[lang] += 1
            n += 1
        per_volume[volume] = n
        print(f"  kept {n} non-Turkic entries")

    fixed = resolve_bax_pos(raw_entries, form_to_id)
    print(f"POS filled/fixed: {fixed}")

    all_entries = {cid: compact(e) for cid, e in raw_entries.items()}
    empty_pos = sum(1 for e in all_entries.values() if not e.get("pos"))
    print(f"empty POS remaining: {empty_pos}")

    bundle = {
        "version": STAMP,
        "lang": "az",
        "policy": "Sticky notes: ADİL PDF non-Turkic origin marks only (ər., fars., yun., lat., …).",
        "count": len(all_entries),
        "formToId": form_to_id,
        "entries": all_entries,
    }

    js_path = LEX / "popup-data.js"
    js_path.write_text(
        "window.__BIRINCI_AZ_POPUP__="
        + json.dumps(bundle, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )

    meta = {
        "stamp": STAMP,
        "sources": [p.name for p in files],
        "entries": len(all_entries),
        "forms": len(form_to_id),
        "per_volume": per_volume,
        "languages": dict(lang_counts),
        "empty_pos": empty_pos,
        "popup_data_js_bytes": js_path.stat().st_size,
    }
    (OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "TECH-NOTE.md").write_text(
        "\n".join(
            [
                "# ADİL PDF lexicon (non-Turkic)",
                "",
                "Built from the four *Azərbaycan dilinin izahlı lüğəti* PDF volumes.",
                "PDF text uses a custom Latin-1 codepoint remapping; see `DECODE` in `tools/build_adil_pdf_lexicon.py`.",
                "Only headwords with non-Turkic origin brackets are kept for sticky notes.",
                "Unmarked headwords default to `is.` (isim), matching ADİL practice.",
                "",
                f"- Entries: {len(all_entries)}",
                f"- Forms: {len(form_to_id)}",
                f"- Output: `assets/lexicon/popup-data.js`",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(json.dumps(meta, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
