/* DopaCart — Service Worker: shell offline-first. */
var CACHE = "dopacart-v4";
var ASSETS = [
  "./", "index.html", "manifest.webmanifest",
  "assets/icon.svg", "assets/icon-192.png", "assets/icon-512.png",
  "css/tokens.css", "css/app.css",
  "data/catalog.js", "js/icons.js", "js/store.js", "js/fx.js", "js/catalog.js",
  "js/cart.js", "js/checkout.js", "js/tracker.js", "js/rewards.js", "js/app.js"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // font/cross-origin -> rete
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match("index.html"); });
    })
  );
});
