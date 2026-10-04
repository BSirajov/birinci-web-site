/* file:// cannot fetch AZ/EN/RU/KY sibling pages. Bounce to start-dev.bat's
 * server — but only if that origin is actually Birİnci. Another local app
 * (often DAAB) uses 8765; a blind redirect would open that site. */
(function (root) {
  "use strict";
  var CANDIDATE_PORTS = [8765, 8775, 8776, 8777, 8778, 8779, 8780, 8766, 8767, 8769, 8770];

  function relFromFileUrl() {
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
    return rel;
  }

  function isBirinciPreview(body) {
    return body.indexOf("Birİnci") >= 0 || body.indexOf("birinci.cloud") >= 0;
  }

  function probePort(port) {
    var origin = "http://127.0.0.1:" + port;
    return fetch(origin + "/index.html", { cache: "no-store" }).then(function (resp) {
      if (!resp || !resp.ok) return Promise.reject();
      return resp.text().then(function (body) {
        if (isBirinciPreview(body || "")) return origin;
        return Promise.reject();
      });
    });
  }

  function firstBirinciOrigin(ports, i) {
    if (i >= ports.length) return Promise.reject();
    return probePort(ports[i]).catch(function () {
      return firstBirinciOrigin(ports, i + 1);
    });
  }

  function bounceIfLocalBirinci() {
    try {
      if (typeof location === "undefined" || location.protocol !== "file:") return;
      var rel = relFromFileUrl();
      firstBirinciOrigin(CANDIDATE_PORTS, 0)
        .then(function (origin) {
          location.replace(origin + "/" + rel + (location.search || "") + (location.hash || ""));
        })
        .catch(function () {});
    } catch (_) {}
  }

  root.__birinciBounceFileToLocalHttp = bounceIfLocalBirinci;
  bounceIfLocalBirinci();
})(typeof window !== "undefined" ? window : this);
