# -*- coding: utf-8 -*-
"""Local stand-in for {lang}/mail-feedback.php (DAAB-style plain-text replies)."""
from __future__ import annotations

import email.policy
import json
import re
import secrets
import time
import urllib.parse
import urllib.request
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


_TURNSTILE_PASS = "1x0000000000000000000000000000000AA"
_TURNSTILE_FAIL = "2x0000000000000000000000000000000AA"
_LEET = str.maketrans({"@": "a", "$": "s", "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t"})
_ABUSE_RULES: dict | None = None


def _fold(text: str) -> str:
    # Keep this aligned with abuse_fold() in tools/mail_feedback.php.
    text = text.casefold().replace("\u0307", "").replace("ß", "ss").replace("ẞ", "ss")
    text = re.sub(r"[\u200b-\u200d\ufeff\u00ad]", "", text)
    return text.translate(_LEET)


def _abuse_rules() -> dict | None:
    global _ABUSE_RULES
    if _ABUSE_RULES is not None:
        return _ABUSE_RULES
    path = ROOT / "private" / "abuse-terms.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    rules: dict[str, dict[str, int]] = {"terms": {}, "prefixes": {}, "masked": {}}
    if not all(isinstance(data.get(key), list) for key in rules):
        return None
    for key in rules:
        for item in data[key]:
            if not isinstance(item, str):
                return None
            letters = "".join(ch for ch in _fold(item) if ch.isalpha())
            if len(letters) >= 3:
                rules[key][letters] = 1
    if not any(rules.values()):
        return None
    _ABUSE_RULES = rules
    return rules


def _tokens(text: str) -> tuple[list[str], list[str]]:
    text = _fold(text)
    masked: list[str] = []
    for chunk in text.split():
        if any(not ch.isalpha() for ch in chunk):
            flat = "".join(ch for ch in chunk if ch.isalpha())
            if len(flat) >= 3:
                masked.append(flat)
    parts: list[str] = []
    current: list[str] = []
    for ch in text:
        if ch.isalpha():
            current.append(ch)
        elif current:
            parts.append("".join(current))
            current = []
    if current:
        parts.append("".join(current))
    tokens: list[str] = []
    run = ""
    for part in parts:
        if len(part) == 1:
            run += part
            continue
        if len(run) >= 3:
            tokens.append(run)
        run = ""
        tokens.append(part)
    if len(run) >= 3:
        tokens.append(run)
    return tokens, masked


def _hit(token: str, rules: dict, allow_masked: bool) -> bool:
    if token in rules["terms"]:
        return True
    if allow_masked and token in rules["masked"]:
        return True
    for prefix in rules["prefixes"]:
        if token.startswith(prefix):
            return True
    if len(token) > 40 or not re.search(r"(.)\1", token):
        return False
    for term in rules["terms"]:
        if len(term) < 3:
            continue
        pattern = "^" + "".join(re.escape(ch) + "+" for ch in term) + "$"
        if re.fullmatch(pattern, token):
            return True
    return False


def _abusive(name: str, subject: str, message: str) -> str | None:
    if len(re.findall(r"https?://", subject + "\n" + message, flags=re.I)) >= 3:
        return "error:abuse"
    rules = _abuse_rules()
    if rules is None:
        return "error:unavailable"
    for text in (name, subject, message):
        tokens, masked = _tokens(text)
        if any(_hit(token, rules, False) for token in tokens):
            return "error:abuse"
        if any(_hit(token, rules, True) for token in masked):
            return "error:abuse"
    return None


def _too_fast(fields: dict[str, str]) -> bool:
    raw = (fields.get("form_started") or "").strip()
    if not re.fullmatch(r"\d{10,13}", raw):
        return True
    started = int(raw)
    if started < 100_000_000_000:
        started *= 1000
    now = int(time.time() * 1000)
    if started > now + 15_000:
        return True
    age = now - started
    return age < 3000 or age > 7 * 24 * 3600 * 1000


def _turnstile() -> tuple[str, str]:
    site = ""
    secret = ""
    path = ROOT / "private" / "turnstile.json"
    if path.is_file():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            data = {}
        if isinstance(data, dict):
            site = str(data.get("site_key") or "").strip()
            secret = str(data.get("secret") or "").strip()
    return site, secret


def _turnstile_passes(secret: str, token: str) -> bool:
    token = token.strip()
    if not token or len(token) > 2048 or re.search(r"[\x00-\x20\x7f]", token):
        return False
    if secret == _TURNSTILE_PASS:
        return True
    if secret == _TURNSTILE_FAIL:
        return False
    body = urllib.parse.urlencode({"secret": secret, "response": token}).encode("utf-8")
    request = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=body,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (OSError, ValueError):
        return False
    return bool(isinstance(data, dict) and data.get("success"))


def challenge_document() -> str:
    site_key, _secret = _turnstile()
    return json.dumps({"sitekey": site_key}, ensure_ascii=False)


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
    if _too_fast(fields):
        return "error:too_fast"
    problem = _abusive(name, subject, message)
    if problem:
        return problem
    secret = _turnstile()[1]
    if secret and not _turnstile_passes(secret, fields.get("cf-turnstile-response") or ""):
        return "error:challenge"
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
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S") + '-' + secrets.token_hex(8)
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
        lines.append("The attachment was checked for type and size only. Open it only if you trust the sender.")
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
    if err == "error:challenge":
        return 403, err
    if err == "error:unavailable":
        return 503, err
    if err:
        return 400, err
    store(fields, files)
    return 200, "success"
