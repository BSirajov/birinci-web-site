# -*- coding: utf-8 -*-
"""Extract categories + profiles from Prominent figures.docx for preview page build."""
from __future__ import annotations

import json
import re
from pathlib import Path

from docx import Document

DOC = Path(r"c:/dev/birinci-web-site/en/prominent-figures/Prominent figures.docx")
OUT = Path(r"c:/dev/birinci-web-site/en/prominent-figures/_extract.json")

SKIP_H1 = {
    "purpose and scope",
    "selection methodology",
    "turkic-world expansion",
    "how to read the profiles",
    "image selection and rights",
    "table of contents",
    "notes and sources",
    "image sources",
    "acknowledgements",
    "appendix",
    "endnotes and selected bibliography",
    "alphabetical index",
    "image credits and rights",
}


def slugify(text: str) -> str:
    s = text.strip().lower()
    s = s.replace("ə", "e").replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ğ", "g").replace("ş", "s").replace("ç", "c")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "item"


def main() -> None:
    doc = Document(str(DOC))
    categories: list[dict] = []
    current_cat = None
    current_person = None
    front = []

    for para in doc.paragraphs:
        text = (para.text or "").strip()
        style = para.style.name if para.style else ""
        if not text:
            continue

        if style == "Heading 1":
            if current_person and current_cat is not None:
                current_cat["people"].append(current_person)
                current_person = None
            if current_cat is not None:
                categories.append(current_cat)
            low = text.casefold()
            if low in SKIP_H1 or low.startswith("appendix") or "notes and sources" in low:
                current_cat = None
                continue
            current_cat = {
                "id": slugify(text),
                "title": text,
                "intro": [],
                "people": [],
            }
            continue

        if current_cat is None:
            if style in {"Title", "Subtitle", "Normal", "List Bullet"} and len(front) < 40:
                front.append({"style": style, "text": text})
            continue

        if style == "Heading 2":
            if current_person is not None:
                current_cat["people"].append(current_person)
            current_person = {
                "id": slugify(text),
                "name": text,
                "meta": "",
                "sections": [],
                "body": [],
            }
            continue

        if current_person is None:
            if style in {"Normal", "List Bullet"}:
                current_cat["intro"].append(text)
            continue

        if style == "Profile Metadata":
            current_person["meta"] = (current_person["meta"] + " " + text).strip()
            continue

        if style == "Heading 3":
            current_person["sections"].append({"heading": text, "items": [], "paras": []})
            continue

        if style == "List Bullet":
            if current_person["sections"]:
                current_person["sections"][-1]["items"].append(text)
            else:
                current_person["body"].append({"type": "li", "text": text})
            continue

        if style in {"Profile Body", "Normal", "Source Text"}:
            if current_person["sections"] and style == "Profile Body":
                # body under a heading3 without bullets goes to paras
                if current_person["sections"][-1]["items"] and not current_person["sections"][-1]["paras"]:
                    current_person["body"].append({"type": "p", "text": text})
                else:
                    current_person["sections"][-1]["paras"].append(text)
            else:
                current_person["body"].append({"type": "p", "text": text})
            continue

        current_person["body"].append({"type": "p", "text": text})

    if current_person and current_cat is not None:
        current_cat["people"].append(current_person)
    if current_cat is not None:
        categories.append(current_cat)

    # dedupe person ids within category
    for cat in categories:
        seen = {}
        for p in cat["people"]:
            base = p["id"]
            n = seen.get(base, 0)
            seen[base] = n + 1
            if n:
                p["id"] = f"{base}-{n+1}"

    payload = {
        "title": "Humanity's Makers",
        "subtitle": "Influential Scientists, Scholars, Engineers, Physicians, Thinkers, and Artists",
        "front": front[:12],
        "categories": categories,
        "counts": {
            "categories": len(categories),
            "people": sum(len(c["people"]) for c in categories),
        },
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload["counts"], indent=2))
    for c in categories:
        print(f"- {c['title']}: {len(c['people'])}")


if __name__ == "__main__":
    main()
