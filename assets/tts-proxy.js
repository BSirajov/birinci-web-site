/**
 * Same-origin TTS proxy client (AZ / KY). Requires tools/tts_proxy_server.py in dev
 * or a host route that forwards /api/az-tts and /api/ky-tts.
 */
(function (global) {
  "use strict";

  var ROUTES = {
    az: { path: "/api/az-tts", devPort: 8767 },
    ky: { path: "/api/ky-tts", devPort: 8767 },
  };

  function proxyUrls(lang) {
    var spec = ROUTES[lang];
    if (!spec) return [];
    var urls = [];
    try {
      urls.push(new URL(spec.path, document.baseURI).href);
    } catch (_) {}
    try {
      urls.push(new URL("../../api/" + lang + "-tts", document.baseURI).href);
    } catch (_) {}
    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(location.origin)) {
      urls.push("http://127.0.0.1:" + spec.devPort + spec.path);
    }
    return urls;
  }

  function chunkText(text, maxLen) {
    var max = maxLen || 240;
    var chunks = [];
    var rest = String(text || "").replace(/\s+/g, " ").trim();
    while (rest.length > max) {
      var slice = rest.slice(0, max);
      var cut = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf(" ")
      );
      if (cut < 40) cut = max;
      chunks.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1).trim();
    }
    if (rest) chunks.push(rest);
    return chunks;
  }

  function synthesize(lang, text) {
    var urls = proxyUrls(lang);
    var attempt = function (index) {
      if (index >= urls.length) {
        return Promise.reject(new Error(lang + "-tts-proxy-missing"));
      }
      return fetch(urls[index], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      }).then(function (res) {
        if (!res.ok) throw new Error(lang + "-tts-proxy-" + res.status);
        return res.blob();
      }).catch(function () {
        return attempt(index + 1);
      });
    };
    return attempt(0);
  }

  global.BirinciTtsProxy = {
    proxyUrls: proxyUrls,
    chunkText: chunkText,
    synthesize: synthesize,
  };
})(typeof window !== "undefined" ? window : globalThis);
