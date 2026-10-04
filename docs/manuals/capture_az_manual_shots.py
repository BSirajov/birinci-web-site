"""Capture local AZ UI screenshots for the user manual."""
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765"
OUT = Path(__file__).resolve().parent / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)


def shot(page, name):
    path = OUT / name
    page.screenshot(path=str(path), full_page=False)
    print("saved", path.name, page.viewport_size)


def wait_ready(page):
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(700)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        desktop = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
            locale="az-AZ",
        )
        page = desktop.new_page()
        page.goto(f"{BASE}/az/index.html?view=cards", wait_until="networkidle")
        wait_ready(page)
        page.evaluate("window.scrollTo(0,0)")
        shot(page, "01-ana-sehife-tesnifli.png")

        page.locator(".lang-switcher__toggle").click()
        page.wait_for_timeout(300)
        shot(page, "02-dil-kecidi.png")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        page.locator("#global-search-toggle").click()
        page.wait_for_selector("#global-search-input")
        page.fill("#global-search-input", "dost")
        page.wait_for_timeout(900)
        shot(page, "03-qlobal-axtaris.png")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        page.goto(
            f"{BASE}/az/categories/dostluq-ve-insan-munasibetleri.html",
            wait_until="networkidle",
        )
        wait_ready(page)
        page.evaluate("window.scrollTo(0,0)")
        shot(page, "04-kateqoriya-ardicil.png")

        cards = page.locator('button[data-home-view="cards"]')
        if cards.count():
            cards.first.click()
            page.wait_for_timeout(400)
            shot(page, "05-kateqoriya-tesnifli.png")

        page.locator('button[data-home-view="list"]').first.click()
        page.wait_for_timeout(500)
        show_img = page.locator(
            'article#friendship-of-horses button[data-images-mode="show"]'
        )
        if show_img.count():
            show_img.first.click()
            page.wait_for_timeout(400)
        page.locator("#friendship-of-horses").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        shot(page, "06-hekaye-siyahi.png")

        fig = page.locator("#friendship-of-horses .story__figure-open")
        if fig.count():
            fig.first.click()
            page.wait_for_selector(".illustration-lightbox:not([hidden])")
            page.wait_for_timeout(400)
            shot(page, "07-sekil-lightbox.png")
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)

        title = page.locator("#friendship-of-horses .story__title")
        title.click()
        page.wait_for_selector(".text-lightbox:not([hidden])")
        page.wait_for_timeout(400)
        shot(page, "08-metn-lightbox.png")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        ml = page.locator("#friendship-of-horses a.story-multilingual-btn")
        if ml.count():
            page.locator("#friendship-of-horses .card-header").scroll_into_view_if_needed()
            page.wait_for_timeout(200)
            shot(page, "09-coxdilli-duyme.png")

        page.goto(f"{BASE}/az/sitemap.html", wait_until="networkidle")
        wait_ready(page)
        page.evaluate("window.scrollTo(0,0)")
        shot(page, "10-sayt-xeritesi.png")

        page.goto(
            f"{BASE}/az/about/mission-vision-values.html", wait_until="networkidle"
        )
        wait_ready(page)
        page.evaluate("window.scrollTo(0,0)")
        shot(page, "11-meram-baxis-deyerler.png")

        desktop.close()

        phone = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 "
                "Mobile/15E148 Safari/604.1"
            ),
            locale="az-AZ",
        )
        page = phone.new_page()
        page.goto(f"{BASE}/az/index.html?view=cards", wait_until="networkidle")
        wait_ready(page)
        page.evaluate("window.scrollTo(0,0)")
        shot(page, "12-mobil-ana.png")
        page.locator("#nav-toggle").click()
        page.wait_for_timeout(400)
        shot(page, "13-mobil-menyü.png")
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)

        page.goto(
            f"{BASE}/az/categories/dostluq-ve-insan-munasibetleri.html",
            wait_until="networkidle",
        )
        wait_ready(page)
        page.evaluate("window.scrollTo(0,0)")
        shot(page, "14-mobil-kateqoriya.png")
        toc = page.locator(".events-menu-toggle")
        if toc.count():
            toc.first.click()
            page.wait_for_timeout(400)
            shot(page, "15-mobil-hekayeler-paneli.png")

        phone.close()
        browser.close()


if __name__ == "__main__":
    main()
