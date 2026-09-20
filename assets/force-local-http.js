/* file:// cannot fetch AZ/EN/RU/KY sibling pages. Bounce to start-dev.bat's server. */
(function () {
  "use strict";
  try {
    if (typeof location === "undefined" || location.protocol !== "file:") return;
    var raw = decodeURIComponent(String(location.pathname || "").replace(/\\/g, "/"));
    var lower = raw.toLowerCase();
    var marker = "birinci-web-site/";
    var at = lower.lastIndexOf(marker);
    var rel = at >= 0 ? raw.slice(at + marker.length) : "";
    if (!rel) {
      var parts = raw.replace(/^\/+[a-zA-Z]:/, "").split("/").filter(Boolean);
      rel = parts.length ? parts[parts.length - 1] : "index.html";
    }
    if (!rel || rel.charAt(rel.length - 1) === "/") rel += "index.html";
    location.replace(
      "http://127.0.0.1:8765/" + rel + (location.search || "") + (location.hash || "")
    );
  } catch (_) {}
})();
