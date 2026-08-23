#!/usr/bin/env node
import fs from "node:fs";

const src = fs.readFileSync(new URL("../assets/site.js", import.meta.url), "utf8");
const start = src.indexOf("const hasAzVoice = (voices) =>");
const end = src.indexOf("window.__birinciHasAzVoice = hasAzVoice;");
if (start < 0 || end < 0 || end <= start) {
  throw new Error("Could not extract AZ TTS browser helpers from assets/site.js");
}

const extracted = src.slice(start, end);
const factory = new Function(
  "window",
  "currentVoices",
  `${extracted}\nreturn { hasAzVoice, isDesktopEdge, browserSupportsAzTts };`
);

const make = (voices, ua) =>
  factory({ navigator: { userAgent: ua } }, () => voices);

const chromeUa =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const edgeUa =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0";
const edgeAndroidUa =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36 EdgA/128.0.0.0";
const edgeIosUa =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/128.0.0.0";

const englishVoices = [{ name: "Google US English", lang: "en-US" }];
const babekVoices = [
  {
    name: "Microsoft Babek Online (Natural) - Azerbaijani (Azerbaijan)",
    lang: "az-AZ",
  },
];

const chrome = make(englishVoices, chromeUa);
if (chrome.hasAzVoice(englishVoices)) {
  throw new Error("Chrome English voices must not count as AZ");
}
if (chrome.isDesktopEdge()) {
  throw new Error("Chrome UA must not count as desktop Edge");
}
if (chrome.browserSupportsAzTts()) {
  throw new Error("Chrome without an AZ voice must be unsupported");
}

const chromeWithBabek = make(babekVoices, chromeUa);
if (!chromeWithBabek.browserSupportsAzTts()) {
  throw new Error("An AZ/Babek voice must count as supported even in Chrome");
}

const edge = make([], edgeUa);
if (!edge.isDesktopEdge()) {
  throw new Error("desktop Edge UA must be recognized");
}
if (!edge.browserSupportsAzTts()) {
  throw new Error("desktop Edge must be treated as AZ-capable before voices load");
}

const edgeAndroid = make([], edgeAndroidUa);
if (edgeAndroid.isDesktopEdge() || edgeAndroid.browserSupportsAzTts()) {
  throw new Error("Edge Android must not be treated as desktop Edge");
}

const edgeIos = make([], edgeIosUa);
if (edgeIos.isDesktopEdge() || edgeIos.browserSupportsAzTts()) {
  throw new Error("Edge iOS must not be treated as desktop Edge");
}

const locales = ["az", "en", "ru", "ky"];
const requiredKeys = [
  "tts_az_unavailable_title",
  "tts_az_unavailable_lead",
  "tts_az_unavailable_recommend",
  "tts_az_unavailable_step1",
  "tts_az_unavailable_step2",
  "tts_az_unavailable_step3",
  "tts_az_open_edge",
  "tts_az_copy_url",
  "tts_az_copied",
  "tts_az_download_edge",
];
for (const lang of locales) {
  const i18nPath = new URL(`../${lang}/assets/i18n.js`, import.meta.url);
  const text = fs.readFileSync(i18nPath, "utf8");
  const prefix = "window.__BIRINCI_I18N__ = ";
  if (!text.startsWith(prefix)) {
    throw new Error(`${lang}/assets/i18n.js missing I18N prefix`);
  }
  const blob = JSON.parse(text.slice(prefix.length).trim().replace(/;$/, ""));
  for (const key of requiredKeys) {
    if (!blob.ui || !blob.ui[key]) {
      throw new Error(`${lang} i18n missing ${key}`);
    }
  }
  if (!/Microsoft Edge/i.test(blob.ui.tts_az_unavailable_lead + blob.ui.tts_az_unavailable_recommend)) {
    throw new Error(`${lang} help text must name Microsoft Edge`);
  }
  const expectStoryListen = lang !== "ky";
  if (Boolean(blob.show_audio_controls) !== expectStoryListen) {
    throw new Error(
      `${lang} show_audio_controls should be ${expectStoryListen}, got ${blob.show_audio_controls}`
    );
  }
}

const langsJson = JSON.parse(
  fs.readFileSync(new URL("../languages.json", import.meta.url), "utf8")
);
for (const row of langsJson.languages || []) {
  const expect = row.code !== "ky";
  if (Boolean(row.show_audio_controls) !== expect) {
    throw new Error(
      `languages.json ${row.code} show_audio_controls should be ${expect}`
    );
  }
}
if (!src.includes("const mountStoryTts = () =>")) {
  throw new Error("assets/site.js must mount story Listen buttons");
}
if (!/const SHOW_AUDIO_CONTROLS = PAGE_LANG !== "ky"/.test(src)) {
  throw new Error("story Listen must not be gated on stale show_audio_controls");
}
const hikmet = fs.readFileSync(
  new URL("../az/categories/hikmet-ve-heyat-dersleri.html", import.meta.url),
  "utf8"
);
if (!hikmet.includes('data-story-tts data-tts-mode="listen"')) {
  throw new Error("AZ wisdom stories HTML must include Listen buttons");
}
if (/tools-bar__field--listen"[^>]*\bhidden\b/.test(hikmet)) {
  throw new Error("toolbar Listen must not be hidden on category pages");
}
if (!hikmet.includes('class="story-tts cat-card__listen"')) {
  throw new Error("category cards must include Listen buttons");
}
const home = fs.readFileSync(new URL("../az/index.html", import.meta.url), "utf8");
if (/tools-bar__field--listen"[^>]*\bhidden\b/.test(home)) {
  throw new Error("home toolbar Listen must not be hidden");
}
if (!src.includes('a.cat-card[data-stem]')) {
  throw new Error("assets/site.js must mount Listen on story cards");
}

console.log("test_az_tts_browser.mjs: ok");
