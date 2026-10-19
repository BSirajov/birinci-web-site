"""Verify Discoveries modal clones the article in original order."""
from __future__ import annotations

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765"
PAGES = {
    "en": "/en/discoveries/discoveries-and-inventions.html",
    "az": "/az/discoveries/discoveries-and-inventions.html",
}


def check_locale(page, label: str) -> None:
    page.goto(BASE + PAGES[label], wait_until="domcontentloaded", timeout=60000)
    page.wait_for_selector(".inventions-entry", state="attached")
    page.wait_for_selector(".inventions-card", state="visible")
    page.wait_for_timeout(400)

    info = page.evaluate(
        """() => {
          const card = document.querySelector(".inventions-card[data-entry]");
          const id = card && card.getAttribute("data-entry");
          const withImg = id && document.getElementById(id);
          if (!withImg) return { error: "no card/entry pair" };
          const img = withImg.querySelector(".inventions-entry-visual-media img");
          if (!img || !img.getAttribute("src")) return { error: "entry has no article image" };
          const visual = withImg.querySelector(".inventions-entry-visual");
          const kids = Array.from(withImg.children).map((el) =>
            (el.className && String(el.className).split(" ")[0]) || el.tagName.toLowerCase()
          );
          const visualKids = visual
            ? Array.from(visual.children).map((el) =>
                (el.className && String(el.className).split(" ")[0]) || el.tagName.toLowerCase()
              )
            : [];
          const nameEl = withImg.querySelector(".inventions-entry-name");
          return {
            id: withImg.id,
            src: img.getAttribute("src"),
            title: nameEl ? nameEl.textContent.trim() : "",
            kids: kids.filter((cls) => cls !== "inventions-entry-title"),
            visualKids,
          };
        }"""
    )
    if info.get("error"):
        raise AssertionError(f"{label}: {info['error']}")

    page.locator(f'.inventions-card[data-entry="{info["id"]}"] .inventions-card__body').first.click()
    page.wait_for_selector(".inventions-article-modal:not([hidden])")
    page.wait_for_timeout(250)

    modal = page.evaluate(
        """(expected) => {
          const overlay = document.querySelector(".inventions-article-modal");
          const body = overlay && overlay.querySelector(".inventions-article-modal__body");
          const clone = body && body.querySelector(".inventions-entry");
          const img = clone && clone.querySelector(".inventions-entry-visual-media img");
          const visual = clone && clone.querySelector(".inventions-entry-visual");
          const rect = img ? img.getBoundingClientRect() : null;
          const bodyRect = body ? body.getBoundingClientRect() : null;
          const kids = clone
            ? Array.from(clone.children).map((el) =>
                (el.className && String(el.className).split(" ")[0]) || el.tagName.toLowerCase()
              )
            : [];
          const visualKids = visual
            ? Array.from(visual.children).map((el) =>
                (el.className && String(el.className).split(" ")[0]) || el.tagName.toLowerCase()
              )
            : [];
          const firstBodyChild = body && body.firstElementChild;
          const heroDetached = !!(
            firstBodyChild &&
            firstBodyChild.matches("img, figure, .inventions-entry-visual-media")
          );
          const headerTitle = overlay && overlay.querySelector(".inventions-article-modal__title");
          const bodyTitle = clone && clone.querySelector(".inventions-entry-title, .inventions-entry-name");
          const sectionHeads = clone
            ? Array.from(clone.querySelectorAll(".inventions-entry-section h3")).map((el) => el.textContent.trim())
            : [];
          return {
            hidden: !overlay || overlay.hidden,
            hasClone: !!clone,
            headerTitle: headerTitle ? headerTitle.textContent.trim() : "",
            bodyTitleCount: clone ? clone.querySelectorAll(".inventions-entry-title").length : 0,
            hasBodyName: !!bodyTitle,
            sectionHeads,
            src: img ? img.getAttribute("src") : "",
            imgCount: body ? body.querySelectorAll("img").length : 0,
            width: rect ? rect.width : 0,
            height: rect ? rect.height : 0,
            overflows: !!(rect && bodyRect && rect.width > bodyRect.width + 2),
            kids,
            visualKids,
            heroDetached,
            imgInsideVisual: !!(img && visual && visual.contains(img)),
            copyAfterMedia: visualKids[0] === "inventions-entry-visual-media" &&
              visualKids.indexOf("inventions-entry-visual-copy") === 1,
          };
        }""",
        info,
    )
    assert not modal["hidden"], f"{label}: modal did not open"
    assert modal["hasClone"], f"{label}: article was not cloned into the modal"
    assert modal["headerTitle"] == info["title"], (
        f"{label}: header title {modal['headerTitle']!r} != {info['title']!r}"
    )
    assert modal["bodyTitleCount"] == 0, f"{label}: in-body article title still present"
    assert not modal["hasBodyName"], f"{label}: article name still in body"
    assert modal["sectionHeads"], f"{label}: section headings were stripped"
    assert not modal["heroDetached"], f"{label}: image was pulled out of the article"
    assert modal["imgInsideVisual"], f"{label}: image left its visual block"
    assert modal["copyAfterMedia"], f"{label}: visual children restacked {modal['visualKids']}"
    assert modal["src"] == info["src"], f"{label}: src {modal['src']!r} != {info['src']!r}"
    assert modal["kids"] == info["kids"], f"{label}: article child order {modal['kids']} != {info['kids']}"
    assert modal["visualKids"] == info["visualKids"], (
        f"{label}: visual order {modal['visualKids']} != {info['visualKids']}"
    )
    assert modal["width"] > 40 and modal["height"] > 40, f"{label}: image not visible {modal}"
    assert not modal["overflows"], f"{label}: image overflows modal body"
    print(f"OK {label} as-is clone: {info['id']} kids={info['kids']} visual={info['visualKids']}")

    listen = page.evaluate(
        """() => {
          const overlay = document.querySelector(".inventions-article-modal");
          const btn = overlay && overlay.querySelector('[data-article-tts][data-tts-mode="listen"]');
          const img = overlay && overlay.querySelector(".inventions-entry-visual-media img");
          const media = overlay && overlay.querySelector(".inventions-entry-visual-media");
          const b = btn ? btn.getBoundingClientRect() : null;
          const i = img ? img.getBoundingClientRect() : null;
          return {
            text: btn ? (btn.getAttribute("aria-label") || "").trim() : "",
            aria: btn ? btn.getAttribute("aria-label") : "",
            preferMale: btn ? btn.getAttribute("data-tts-prefer-male") : "",
            lang: btn ? btn.getAttribute("data-tts-lang") : "",
            inMedia: !!(btn && media && media.contains(btn)),
            belowImage: !!(b && i && b.top >= i.bottom - 8),
          };
        }"""
    )
    expected_listen = "Dinlə" if label == "az" else "Listen"
    assert listen["text"] == expected_listen, f"{label}: listen label {listen['text']!r}"
    assert listen["aria"] == expected_listen, f"{label}: listen aria {listen['aria']!r}"
    assert listen["inMedia"], f"{label}: listen button is not under the image"
    assert listen["belowImage"], f"{label}: listen button is not below the image"
    if label == "az":
        assert listen["preferMale"] == "true", f"{label}: AZ should prefer male voice"
        assert listen["lang"] == "az-AZ", f"{label}: AZ lang {listen['lang']!r}"
        picked = page.evaluate(
            """() => {
              const api = window.__inventionsArticleModalTts;
              const voices = [
                { name: "Microsoft Banu Online (Natural) - Azerbaijani (Azerbaijan)", lang: "az-AZ", voiceURI: "banu" },
                { name: "Microsoft Babek Online (Natural) - Azerbaijani (Azerbaijan)", lang: "az-AZ", voiceURI: "babek" },
                { name: "Microsoft Zira Desktop - English (United States)", lang: "en-US", voiceURI: "zira" },
              ];
              return api.pickVoice(voices, { ui: "az", bcp: "az-AZ" });
            }"""
        )
        assert "Babek" in (picked.get("name") or ""), f"{label}: expected Babek, got {picked}"
        assert picked.get("male") is True, f"{label}: Babek not marked male: {picked}"
        assert picked.get("utterLang") == "az-AZ", f"{label}: utterLang {picked}"
        no_az_male = page.evaluate(
            """() => {
              const api = window.__inventionsArticleModalTts;
              const voices = [
                { name: "Microsoft Banu Online (Natural) - Azerbaijani (Azerbaijan)", lang: "az-AZ", voiceURI: "banu" },
                { name: "Microsoft David Desktop - English (United States)", lang: "en-US", voiceURI: "david" },
              ];
              return api.pickVoice(voices, { ui: "az", bcp: "az-AZ" });
            }"""
        )
        assert no_az_male.get("engine") == "edge-tts", (
            f"{label}: missing AZ male should use Edge Babek, not {no_az_male}"
        )
        assert "Babek" in (no_az_male.get("name") or ""), (
            f"{label}: expected Babek fallback, got {no_az_male}"
        )
        assert "David" not in (no_az_male.get("name") or ""), (
            f"{label}: must not attach English David to AZ text"
        )
    print(f"OK {label} listen button below image ({listen['text'].encode('ascii', 'replace').decode('ascii')})")

    page.locator('.inventions-article-modal [data-article-tts][data-tts-mode="listen"]').click()
    page.wait_for_function("() => !!(window.__inventionsArticleModalTts && window.__inventionsArticleModalTts.lastVoice())")
    page.wait_for_timeout(200)
    after_click = page.evaluate(
        """() => {
          const btn = document.querySelector('.inventions-article-modal [data-article-tts][data-tts-mode="listen"]');
          const api = window.__inventionsArticleModalTts;
          return {
            state: btn ? btn.getAttribute("data-tts-state") : "",
            last: api && api.lastVoice ? api.lastVoice() : null,
            speaking: api && api.isSpeaking ? api.isSpeaking() : false,
          };
        }"""
    )
    assert after_click["last"], f"{label}: click did not record a voice choice"
    spoken = page.evaluate("() => window.__inventionsArticleModalTts.lastSpokenText()")
    assert spoken and "<" not in spoken, f"{label}: spoken text looks like markup: {spoken[:80]!r}"
    if label == "az":
        last = after_click["last"]
        assert last.get("preferMale") is True, f"{label}: last voice not preferMale {last}"
        assert (last.get("utterLang") or "").lower().startswith("az"), f"{label}: last utterLang {last}"
        assert last.get("engine") == "edge-tts" or "az" in (last.get("lang") or "").lower(), (
            f"{label}: AZ used a non-Azerbaijani engine {last}"
        )
        assert "David" not in (last.get("name") or ""), f"{label}: AZ still using English David"
        assert "od" in spoken.lower() or "insan" in spoken.lower() or "ə" in spoken, (
            f"{label}: spoken text is not AZ article prose: {spoken[:120]!r}"
        )
        page.wait_for_timeout(2500)
        playback = page.evaluate(
            """() => {
              const api = window.__inventionsArticleModalTts;
              const audios = Array.from(document.querySelectorAll("audio"));
              return {
                speaking: api.isSpeaking(),
                audioCount: audios.length,
                currentTime: audios[0] ? audios[0].currentTime : 0,
                paused: audios[0] ? audios[0].paused : true,
              };
            }"""
        )
        print(
            "AZ voice="
            + (last.get("name") or "")
            + " lang="
            + (last.get("utterLang") or "")
            + " engine="
            + (last.get("engine") or "")
            + " playback="
            + str(playback)
            + " sample="
            + spoken[:160].encode("ascii", "replace").decode("ascii")
        )
        assert playback["speaking"] or playback["audioCount"] > 0, (
            f"{label}: Babek audio did not start {playback}"
        )
    print(f"OK {label} listen click lastVoice={after_click['last']}")

    page.locator(".inventions-article-modal__close").click()
    page.wait_for_timeout(150)
    closed = page.evaluate(
        """() => {
          const overlay = document.querySelector(".inventions-article-modal");
          return !overlay || overlay.hidden || overlay.hasAttribute("hidden");
        }"""
    )
    assert closed, f"{label}: close button did not hide modal"
    speaking_after_close = page.evaluate(
        """() => {
          const api = window.__inventionsArticleModalTts;
          const synthSpeaking = !!(window.speechSynthesis && window.speechSynthesis.speaking);
          return {
            api: api && api.isSpeaking ? api.isSpeaking() : false,
            synth: synthSpeaking,
          };
        }"""
    )
    assert not speaking_after_close["api"], f"{label}: TTS still marked speaking after close"
    print(f"OK {label} close via X (speech stopped)")

    page.evaluate(
        """(excludeId) => {
          const entries = Array.from(document.querySelectorAll(".inventions-layout .inventions-entry"));
          const target = entries.find((el) => el.id && el.id !== excludeId);
          if (!target) return;
          target.querySelectorAll(".inventions-entry-visual-media, .inventions-entry-icon img").forEach((el) => el.remove());
          window.__noImgEntryId = target.id;
        }""",
        info["id"],
    )
    no_id = page.evaluate("() => window.__noImgEntryId")
    assert no_id, f"{label}: could not prepare no-image entry"
    page.locator(f'.inventions-card[data-entry="{no_id}"] .inventions-card__body').first.click()
    page.wait_for_selector(".inventions-article-modal:not([hidden])")
    page.wait_for_timeout(150)
    noimg = page.evaluate(
        """() => {
          const overlay = document.querySelector(".inventions-article-modal");
          const body = overlay && overlay.querySelector(".inventions-article-modal__body");
          const clone = body && body.querySelector(".inventions-entry");
          const listen = body && body.querySelector("[data-article-tts][data-tts-mode=\"listen\"]");
          const group = body && body.querySelector(".inventions-article-listen");
          return {
            hidden: !overlay || overlay.hidden,
            imgCount: body ? body.querySelectorAll("img").length : 0,
            hasClone: !!clone,
            hasListen: !!listen,
            listenFirst: !!(clone && group && clone.firstElementChild === group),
            text: body ? (body.textContent || "").trim().slice(0, 80) : "",
          };
        }"""
    )
    assert not noimg["hidden"], f"{label}: no-image article modal did not open"
    assert noimg["hasClone"], f"{label}: no-image article was not cloned"
    assert noimg["imgCount"] == 0, f"{label}: unexpected images in no-image modal"
    assert noimg["hasListen"], f"{label}: no-image modal missing Listen button"
    assert noimg["listenFirst"], f"{label}: no-image Listen button not at top of body"
    assert noimg["text"], f"{label}: no-image modal has empty body"
    page.keyboard.press("Escape")
    page.wait_for_timeout(150)
    closed2 = page.evaluate(
        """() => {
          const overlay = document.querySelector(".inventions-article-modal");
          return !overlay || overlay.hidden || overlay.hasAttribute("hidden");
        }"""
    )
    assert closed2, f"{label}: Escape did not close no-image modal"
    print(f"OK {label} no-image article {no_id} + Escape close")


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        check_locale(page, "en")
        check_locale(page, "az")
        browser.close()
    print("ALL CHECKS PASSED")


if __name__ == "__main__":
    main()
