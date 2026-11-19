/**
 * Capture Birİnci Offline screenshots for Help offline-* sections.
 * Serves the local offline PWA and writes PNGs into screenshots-20261110/{lang}/.
 */
const { chromium } = require('C:/Users/BSira/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const offlineRoot = path.resolve('C:/dev/birinci-offline/build/pwa');
const shotRoot = path.resolve(__dirname, 'screenshots-20261110');
const langs = ['az', 'en', 'de', 'ru', 'ky'];
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url.endsWith('/')) url += 'index.html';
  const file = path.resolve(offlineRoot, '.' + url);
  if (!file.startsWith(offlineRoot + path.sep) && file !== offlineRoot) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, buf) => {
    res.writeHead(err ? 404 : 200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
    });
    res.end(err ? 'Not found' : buf);
  });
});

async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((img) => {
          const r = img.getBoundingClientRect();
          return r.top < innerHeight && r.bottom > 0;
        })
        .map((img) => img.decode().catch(() => {}))
    );
  });
}

async function writeAllLangs(name, buffer) {
  for (const lang of langs) {
    const dir = path.join(shotRoot, lang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.png`), buffer);
  }
}

(async () => {
  if (!fs.existsSync(path.join(offlineRoot, 'index.html'))) {
    throw new Error('Missing offline PWA at ' + offlineRoot);
  }
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(20000);

    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await page.locator('#packs button, .pack-card, [data-pack]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    await ready(page);
    const install = await page.screenshot({ type: 'png' });
    await writeAllLangs('offline-install', install);
    console.log('offline-install');

    // Fixture a few packs so download/verify/update chrome is visible.
    await page.evaluate(async () => {
      const catalog = await (await fetch('offline-packs.json')).json();
      const store = window.OfflineStore
        ? OfflineStore.create(location.href)
        : null;
      if (!store) return;
      for (const id of ['core', 'en-text', 'en-media', 'az-text']) {
        await store.setState(id, {
          id,
          version: catalog.version || 'fixture',
          cache: 'manual-shot-fixture',
          files: [],
        });
      }
    }).catch(() => {});
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await ready(page);
    const download = await page.screenshot({ type: 'png' });
    await writeAllLangs('offline-download', download);
    console.log('offline-download');

    // Prefer an opened language shelf if available; else keep library.
    const openBtn = page.locator('a:has-text("Open"), button:has-text("Open")').first();
    if (await openBtn.count()) {
      try {
        await openBtn.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
      } catch (_) {}
    }
    await ready(page);
    const testShot = await page.screenshot({ type: 'png' });
    await writeAllLangs('offline-test', testShot);
    console.log('offline-test');

    // USB / storage / updates: back to library and scroll to storage controls.
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const storage = page.locator('text=/protected storage|Check for updates|Your device storage/i').first();
    if (await storage.count()) {
      await storage.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    await ready(page);
    const usb = await page.screenshot({ type: 'png' });
    await writeAllLangs('offline-usb', usb);
    console.log('offline-usb');

    await ctx.close();
  } finally {
    await browser.close();
    server.close();
  }
})().catch((err) => {
  console.error(err);
  server.close();
  process.exitCode = 1;
});
