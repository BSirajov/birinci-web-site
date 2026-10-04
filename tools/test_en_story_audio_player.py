# -*- coding: utf-8 -*-
"""Playwright: EN Wisdom Audio button — MP3 play/pause/resume/restart/stop/switch.

TTS fallback is checked only when the MP3 is missing.
"""
from __future__ import annotations

import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATEGORY = "en/categories/iman-ve-meneviyyat.html"
STEM_A = "lawful-morsel"
STEM_B = "calamity-and-blessing"


class _QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):  # noqa: A003
        return


def _start_server() -> tuple[ThreadingHTTPServer, str]:
    handler = partial(_QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address[:2]
    return server, f"http://{host}:{port}"


def main() -> None:
    from playwright.sync_api import sync_playwright

    server, origin = _start_server()
    url = f"{origin}/{CATEGORY}"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            spoken = {"n": 0}
            page.add_init_script(
                """
                (() => {
                  const orig = window.speechSynthesis && window.speechSynthesis.speak
                    ? window.speechSynthesis.speak.bind(window.speechSynthesis)
                    : null;
                  window.__birinciTtsSpeakCount = 0;
                  if (!orig) return;
                  window.speechSynthesis.speak = function (u) {
                    window.__birinciTtsSpeakCount = (window.__birinciTtsSpeakCount || 0) + 1;
                    return orig(u);
                  };
                })();
                """
            )
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_selector(f"article.story#{STEM_A} [data-tts-mode='listen']")

            def listen(stem: str):
                return page.locator(f"article.story#{stem} [data-tts-mode='listen']")

            def stop(stem: str):
                return page.locator(f"article.story#{stem} [data-tts-mode='stop']")

            def audio_state():
                return page.evaluate(
                    """() => {
                      const el = document.querySelector("[data-audio-el]");
                      const count = window.__birinciTtsSpeakCount || 0;
                      if (!el) return { hasEl: false, tts: count };
                      return {
                        hasEl: true,
                        src: el.currentSrc || el.src || "",
                        paused: el.paused,
                        ended: el.ended,
                        time: el.currentTime || 0,
                        tts: count,
                      };
                    }"""
                )

            listen(STEM_A).click()
            page.wait_for_function(
                """() => {
                  const el = document.querySelector("[data-audio-el]");
                  return !!(el && el.src && !el.paused);
                }""",
                timeout=15000,
            )
            playing = audio_state()
            assert STEM_A in playing["src"], playing
            assert playing["tts"] == 0, playing

            page.locator("[data-audio-play]").click()
            page.wait_for_function(
                """() => {
                  const el = document.querySelector("[data-audio-el]");
                  return !!(el && el.src && el.paused && !el.ended);
                }""",
                timeout=8000,
            )
            paused = audio_state()
            assert paused["tts"] == 0, paused

            page.locator("[data-audio-play]").click()
            page.wait_for_function(
                """() => {
                  const el = document.querySelector("[data-audio-el]");
                  return !!(el && !el.paused);
                }""",
                timeout=8000,
            )
            resumed = audio_state()
            assert resumed["tts"] == 0, resumed

            page.evaluate(
                """() => {
                  const el = document.querySelector("[data-audio-el]");
                  if (el && el.duration) el.currentTime = Math.max(0, el.duration - 0.05);
                }"""
            )
            page.wait_for_function(
                """() => {
                  const el = document.querySelector("[data-audio-el]");
                  return !!(el && el.ended);
                }""",
                timeout=15000,
            )
            listen(STEM_A).click()
            page.wait_for_function(
                """() => {
                  const el = document.querySelector("[data-audio-el]");
                  return !!(el && !el.paused && el.currentTime < 2);
                }""",
                timeout=8000,
            )
            restarted = audio_state()
            assert restarted["tts"] == 0, restarted

            listen(STEM_B).click()
            page.wait_for_function(
                f"""() => {{
                  const el = document.querySelector("[data-audio-el]");
                  return !!(el && el.src && el.src.includes("{STEM_B}") && !el.paused);
                }}""",
                timeout=15000,
            )
            switched = audio_state()
            assert STEM_B in switched["src"], switched
            assert switched["tts"] == 0, switched

            stop(STEM_B).click()
            page.wait_for_function(
                """() => {
                  const shell = document.querySelector(".audio-player");
                  const el = document.querySelector("[data-audio-el]");
                  const hidden = !shell || shell.hidden || shell.hasAttribute("hidden");
                  return hidden && (!el || !el.src || el.paused);
                }""",
                timeout=8000,
            )
            stopped = audio_state()
            assert stopped["tts"] == 0, stopped

            # Missing MP3 → browser TTS only.
            page.evaluate(
                f"""() => {{
                  const story = document.getElementById("{STEM_A}");
                  if (story) story.setAttribute("data-audio", "wisdom-stories/audio/__missing-en-test__.mp3");
                }}"""
            )
            listen(STEM_A).click()
            page.wait_for_function(
                "() => (window.__birinciTtsSpeakCount || 0) > 0",
                timeout=12000,
            )
            fallback = audio_state()
            assert fallback["tts"] >= 1, fallback

            browser.close()
            print("OK: EN player play/pause/resume/restart/stop/switch; TTS only on missing MP3")
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
