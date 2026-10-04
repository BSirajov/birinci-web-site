# -*- coding: utf-8 -*-
"""Local stand-in for {lang}/mail-feedback.php (DAAB-style plain-text replies)."""
from __future__ import annotations

import email.policy
import re
from datetime import datetime, timezone
from email.parser import BytesParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTBOX = ROOT / "tools" / ".feedback-outbox"
MAX_BODY = 6 * 1024 * 1024
MAX_FILE = 5 * 1024 * 1024
OK_EXT = frozenset({"jpg", "jpeg", "png", "webp", "gif", "pdf"})
UNSAFE_NAME = re.compile(
    r"\.(php\d?|phtml|phar|svg|html?|js|exe|dll|sh|bat|cmd|htaccess)(?:\.|$)",
    re.I,
)
EMAIL_OK = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
NAME_OK = re.compile(r"[^\W\d_](?:[^\W\d_]|[ .'’\-])*", re.UNICODE)


def _name_ok(value: str) -> bool:
    return bool(NAME_OK.fullmatch(value.strip()))


def _unsafe(text: str) -> bool:
    if re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", text):
        return True
    if re.search(r"<\s*/?\s*[a-z!]", text, re.I):
        return True
    if re.search(r"(?:javascript|vbscript|data)\s*:", text, re.I):
        return True
    folded = text.lower()
    return bool(
        re.search(r"\bunion\s+select\b|\bdrop\s+table\b|\binsert\s+into\b|\bdelete\s+from\b", folded)
    )


def _url_ok(value: str) -> bool:
    v = value.strip()
    if not v:
        return True
    if len(v) > 500 or re.search(r"\s", v):
        return False
    if v.startswith("/") and not v.startswith("//"):
        return True
    return v.lower().startswith("http://") or v.lower().startswith("https://")


def parse_multipart(content_type: str, body: bytes) -> tuple[dict[str, str], dict[str, tuple[str, bytes]]]:
    header = f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8")
    msg = BytesParser(policy=email.policy.HTTP).parsebytes(header + body)
    fields: dict[str, str] = {}
    files: dict[str, tuple[str, bytes]] = {}
    if not msg.is_multipart():
        return fields, files
    for part in msg.iter_parts():
        disp = part.get("Content-Disposition", "")
        name = part.get_param("name", header="content-disposition")
        if not name:
            continue
        filename = part.get_filename()
        payload = part.get_payload(decode=True) or b""
        if filename:
            files[str(name)] = (str(filename), payload)
        else:
            charset = part.get_content_charset() or "utf-8"
            fields[str(name)] = payload.decode(charset, errors="replace")
    return fields, files


def validate(fields: dict[str, str], files: dict[str, tuple[str, bytes]]) -> str | None:
    if (fields.get("website") or "").strip():
        return None
    name = (fields.get("name") or "").strip()
    email_addr = (fields.get("email") or "").strip()
    ftype = (fields.get("feedback_type") or "").strip()
    subject = (fields.get("subject") or "").strip()
    message = (fields.get("message") or "").strip()
    url = (fields.get("related_url") or "").strip()
    privacy = (fields.get("privacyconfirm") or "").strip()
    if not name:
        return "error:name"
    if not _name_ok(name):
        return "error:name_invalid"
    if _unsafe(name) or _unsafe(subject) or _unsafe(message):
        return "error:unsafe"
    if not email_addr:
        return "error:email_required"
    if not EMAIL_OK.match(email_addr) or re.search(r"[\r\n]", email_addr):
        return "error:email"
    if not ftype:
        return "error:type"
    if not subject:
        return "error:subject"
    if not message:
        return "error:message"
    if url and not _url_ok(url):
        return "error:url"
    if privacy != "yes":
        return "error:privacy"
    if "attachment" in files:
        filename, payload = files["attachment"]
        if not filename or not payload:
            return None
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if UNSAFE_NAME.search(filename) or ext not in OK_EXT:
            return "error:file_type"
        if len(payload) > MAX_FILE:
            return "error:file_size"
    return None


def store(fields: dict[str, str], files: dict[str, tuple[str, bytes]]) -> None:
    OUTBOX.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    dest = OUTBOX / f"{stamp}-feedback.txt"
    lines = [
        f"Name: {fields.get('name', '')}",
        f"Email: {fields.get('email', '')}",
        f"Type: {fields.get('feedback_type', '')}",
        f"Subject: {fields.get('subject', '')}",
        f"URL: {fields.get('related_url', '')}",
        f"Page: {fields.get('page_url', '')}",
        "",
        fields.get("message", ""),
        "",
    ]
    if "attachment" in files:
        filename, payload = files["attachment"]
        lines.append(f"Attachment: {filename} ({len(payload)} bytes)")
        bin_path = OUTBOX / f"{stamp}-{Path(filename).name}"
        bin_path.write_bytes(payload)
    dest.write_text("\n".join(lines), encoding="utf-8")


def handle_post(content_type: str, body: bytes) -> tuple[int, str]:
    if len(body) > MAX_BODY:
        return 413, "error:file_size"
    fields, files = parse_multipart(content_type or "", body)
    if (fields.get("website") or "").strip():
        return 200, "success"
    err = validate(fields, files)
    if err:
        return 400, err
    store(fields, files)
    return 200, "success"
