"""Same-origin TTS proxy for AZ and KY using Microsoft Edge neural voices (edge-tts)."""
from __future__ import annotations

import asyncio
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from edge_tts import Communicate

HOST = "127.0.0.1"
PORT = 8767
MAX_CHARS = 4000

# Microsoft Edge TTS has no ky-KG voice; Kazakh male neural is the closest Turkic option.
ROUTES: dict[str, dict[str, str]] = {
    "/api/az-tts": {
        "content_lang": "az-AZ",
        "voice": "az-AZ-BabekNeural",
        "rate": "-6%",
        "pitch": "+0Hz",
        "note": "",
    },
    "/az-tts": {
        "content_lang": "az-AZ",
        "voice": "az-AZ-BabekNeural",
        "rate": "-6%",
        "pitch": "+0Hz",
        "note": "",
    },
    "/api/ky-tts": {
        "content_lang": "ky-KG",
        "voice": "kk-KZ-DauletNeural",
        "rate": "-4%",
        "pitch": "+0Hz",
        "note": "kk-KZ-fallback",
    },
    "/ky-tts": {
        "content_lang": "ky-KG",
        "voice": "kk-KZ-DauletNeural",
        "rate": "-4%",
        "pitch": "+0Hz",
        "note": "kk-KZ-fallback",
    },
}


class TtsProxyHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):  # noqa: A003
        return

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        route = ROUTES.get(path)
        if not route:
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(max(0, length)) if length else b""
        text = ""
        ctype = (self.headers.get("Content-Type") or "").lower()
        try:
            if "json" in ctype:
                payload = json.loads(raw.decode("utf-8") or "{}")
                text = str(payload.get("text") or "")
            else:
                text = raw.decode("utf-8")
        except Exception:
            text = ""
        text = " ".join(text.split()).strip()[:MAX_CHARS]
        if not text:
            self.send_error(400, "empty text")
            return

        try:
            audio = asyncio.run(
                _synthesize(
                    text,
                    route["voice"],
                    rate=route["rate"],
                    pitch=route["pitch"],
                )
            )
        except Exception as exc:
            self.send_response(502)
            self._cors()
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(str(exc).encode("utf-8"))
            return

        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("X-TTS-Voice", route["voice"])
        self.send_header("X-TTS-Lang", route["content_lang"])
        if route.get("note"):
            self.send_header("X-TTS-Voice-Note", route["note"])
        self.send_header("Content-Length", str(len(audio)))
        self.end_headers()
        self.wfile.write(audio)


async def _synthesize(text: str, voice: str, *, rate: str, pitch: str) -> bytes:
    communicate = Communicate(text, voice, rate=rate, pitch=pitch, volume="+0%")
    chunks: list[bytes] = []
    async for item in communicate.stream():
        if item.get("type") == "audio":
            chunks.append(item["data"])
    data = b"".join(chunks)
    if len(data) < 64:
        raise RuntimeError("empty audio")
    return data


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), TtsProxyHandler)
    print(f"TTS proxy on http://{HOST}:{PORT}", flush=True)
    print("  POST /api/az-tts  (az-AZ-BabekNeural)", flush=True)
    print("  POST /api/ky-tts  (kk-KZ-DauletNeural; Kyrgyz content, no ky-KG Edge voice)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
