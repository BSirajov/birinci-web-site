#!/usr/bin/env node
import fs from "node:fs";

const src = fs.readFileSync(new URL("../assets/site.js", import.meta.url), "utf8");
const start = src.indexOf("const pageLocaleCode = () =>");
const end = src.indexOf("window.__birinciPickTtsVoice = pickVoice;");
if (start < 0 || end < 0 || end <= start) {
  throw new Error("Could not extract pickVoice from assets/site.js");
}

const liveI18n = () => ({ tts_voice: "az-AZ-BabekNeural" });
const LOCALE_TAG = "az";
const window = {};
const document = {
  body: { getAttribute: () => "az" },
  documentElement: { lang: "az" },
};

const extracted = src.slice(start, end);
const factory = new Function(
  "liveI18n",
  "LOCALE_TAG",
  "window",
  "document",
  `${extracted}\nreturn pickVoice;`
);
const pickVoice = factory(liveI18n, LOCALE_TAG, window, document);

const voices = [
  { name: "Google US English", lang: "en-US" },
  { name: "Microsoft David - English (United States)", lang: "en-US" },
  { name: "Google Türkçe", lang: "tr-TR" },
  {
    name: "Microsoft Babek Online (Natural) - Azerbaijani (Azerbaijan)",
    lang: "az-AZ",
  },
  {
    name: "Microsoft Banu Online (Natural) - Azerbaijani (Azerbaijan)",
    lang: "az-AZ",
  },
];

const picked = pickVoice(voices, "az");
if (!picked || !/Babek/i.test(picked.name)) {
  throw new Error(`expected Babek, got ${JSON.stringify(picked)}`);
}

const noBabek = pickVoice(
  voices.filter((v) => !/Babek/i.test(v.name)),
  "az"
);
if (!noBabek || !/^az\b/i.test(noBabek.lang)) {
  throw new Error(`expected remaining AZ voice, got ${JSON.stringify(noBabek)}`);
}

const english = pickVoice(
  voices.filter((v) => /^en\b/i.test(v.lang)),
  "az"
);
if (english) {
  throw new Error(`AZ must not pick English, got ${JSON.stringify(english)}`);
}

const fallback = pickVoice(
  [
    { name: "Google US English", lang: "en-US" },
    { name: "Yelda", lang: "tr-TR" },
  ],
  "az"
);
if (!fallback || fallback.lang !== "tr-TR") {
  throw new Error(`expected Turkish fallback, got ${JSON.stringify(fallback)}`);
}

console.log("test_pick_tts_voice.mjs: ok");
