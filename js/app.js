/* DopaCart — app shell: icone, router hash, bottom-nav, bootstrap, onboarding. */
window.DC = window.DC || {};
(function () {
  /* —— Icone (inline SVG, stroke currentColor) —— */
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12.4a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.3L22 7H6"/>',
    package: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
    chevronRight: '<path d="M9 18l6-6-6-6"/>'
  };
  DC.icon = function (n) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || "") + '</svg>';
  };

  var NAV = [
    { route: "home", hash: "#/home", icon: "home", label: "Home" },
    { route: "catalog", hash: "#/catalog", icon: "grid", label: "Catalogo" },
    { route: "cart", hash: "#/cart", icon: "cart", label: "Carrello" },
    { route: "orders", hash: "#/orders", icon: "package", label: "Ordini" },
    { route: "profile", hash: "#/profile", icon: "user", label: "Profilo" }
  ];

  DC.go = function (hash) { location.hash = hash; };

  /* —— Aggiungi al carrello con effetti —— */
  DC.addToCartFx = function (id, el) {
    DC.store.addToCart(id);
    DC.fx.sound.add(); DC.fx.buzz.light(); DC.fx.flyToCart(el);
    var lvl = DC.store.addXp(1);
    DC.refreshNav(true);
    if (lvl.leveledUp) { DC.fx.sound.levelup(); DC.fx.toast("🏆 Livello " + lvl.level + "!", { win: true }); }
  };

  /* —— Chrome (topbar + nav) —— */
  function buildChrome() {
    document.getElementById("topbar").innerHTML =
      '<div class="brand"><span class="logo">🛒</span>DopaCart</div><div class="spacer"></div>' +
      '<div class="streak-pill" id="streakPill">🔥 <span class="tnum" id="streakN">0</span></div>';
    document.getElementById("bottomnav").innerHTML = NAV.map(function (n) {
      return '<button class="navbtn" data-route="' + n.route + '" data-hash="' + n.hash + '">' +
        DC.icon(n.icon) + (n.route === "cart" ? '<span class="badge" id="cartBadge" hidden>0</span>' : '') +
        '<span>' + n.label + '</span></button>';
    }).join("");
    document.querySelectorAll(".navbtn").forEach(function (b) {
      b.addEventListener("click", function () { DC.fx.sound.tap(); DC.go(b.dataset.hash); });
    });
  }

  DC.refreshNav = function (pop) {
    var n = DC.store.cartCount();
    var badge = document.getElementById("cartBadge");
    if (badge) { badge.textContent = n; badge.hidden = n === 0; if (pop) { badge.classList.remove("pop"); void badge.offsetWidth; badge.classList.add("pop"); } }
    var sn = document.getElementById("streakN"); if (sn) sn.textContent = DC.store.state.profile.streak.count;
  };

  function setActive(route) {
    document.querySelectorAll(".navbtn").forEach(function (b) {
      if (b.dataset.route === route) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  /* —— Router —— */
  function parse() {
    var h = location.hash.replace(/^#\/?/, "");
    var p = h.split("/");
    return { base: p[0] || "home", a: p[1] };
  }
  function render() {
    if (DC.cleanupTrack) DC.cleanupTrack();
    var r = parse(), view = document.getElementById("view");
    window.scrollTo(0, 0);
    var map = {
      home: function () { DC.views.home(view); return "home"; },
      catalog: function () { DC.views.catalog(view, { cat: r.a }); return "catalog"; },
      product: function () { DC.views.product(view, { id: r.a }); return "catalog"; },
      cart: function () { DC.views.cart(view); return "cart"; },
      checkout: function () { DC.views.checkout(view); return "cart"; },
      orders: function () { DC.views.orders(view); return "orders"; },
      track: function () { DC.views.track(view, { id: r.a }); return "orders"; },
      profile: function () { DC.views.profile(view); return "profile"; }
    };
    var fn = map[r.base] || map.home;
    setActive(fn());
    DC.refreshNav();
  }
  DC.refresh = render;

  /* —— Onboarding (primo avvio) —— */
  function onboarding(done) {
    if (DC.store.state.seenOnboarding) { done(); return; }
    var o = document.createElement("div");
    o.className = "onb";
    o.innerHTML =
      '<div class="big-emoji">🛒✨</div>' +
      '<h2>Lo shopping che ti dà<br>la scarica, non il conto</h2>' +
      '<p>Riempi il carrello, "ordina" e segui il pacco in arrivo. Niente pagamenti, solo la dopamina. A costo zero.</p>' +
      '<button class="btn btn-action btn-lg" id="start" style="margin-top:var(--sp-4)">Inizia 🎉</button>';
    document.body.appendChild(o);
    o.querySelector("#start").addEventListener("click", function () {
      DC.store.state.seenOnboarding = true; DC.store.save();
      DC.fx.sound.success(); DC.fx.buzz.medium(); DC.fx.confetti({ count: 90 });
      o.style.transition = "opacity .3s"; o.style.opacity = "0";
      setTimeout(function () { o.remove(); done(); }, 300);
    });
  }

  /* —— Bootstrap —— */
  function boot() {
    buildChrome();
    if (!location.hash) location.hash = "#/home";
    window.addEventListener("hashchange", render);
    onboarding(render);
    // Service worker solo su http(s)
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
