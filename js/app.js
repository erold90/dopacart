/* DopaCart — app shell: router hash, bottom-nav, bootstrap, onboarding. Icone da js/icons.js. */
window.DC = window.DC || {};
(function () {
  var NAV = [
    { route: "home", hash: "#/home", icon: "home", label: "Home" },
    { route: "catalog", hash: "#/catalog", icon: "grid", label: "Catalogo" },
    { route: "cart", hash: "#/cart", icon: "cart", label: "Carrello" },
    { route: "orders", hash: "#/orders", icon: "package", label: "Ordini" },
    { route: "profile", hash: "#/profile", icon: "user", label: "Profilo" }
  ];

  DC.go = function (hash) { location.hash = hash; };

  // Registry timer di vista (countdown offerte, "N lo stanno guardando"): puliti a ogni cambio schermata
  DC._viewTimers = [];
  DC.regTimer = function (id) { DC._viewTimers.push(id); return id; };
  DC.clearViewTimers = function () { DC._viewTimers.forEach(function (id) { clearInterval(id); }); DC._viewTimers = []; };

  DC.addToCartFx = function (id, el) {
    DC.store.addToCart(id);
    DC.fx.sound.add(); DC.fx.buzz.light(); DC.fx.flyToCart(el);
    var lvl = DC.store.addXp(1);
    DC.refreshNav(true);
    if (lvl.leveledUp) { DC.fx.sound.levelup(); DC.fx.toast("Livello " + lvl.level + "!", { win: true, icon: "trophy" }); }
  };

  function buildChrome() {
    document.getElementById("topbar").innerHTML =
      '<div class="brand"><span class="logo">' + DC.icon("cart") + '</span>DopaCart</div><div class="spacer"></div>' +
      '<div class="streak-pill">' + DC.icon("flame") + '<span class="tnum" id="streakN">0</span></div>';
    document.getElementById("bottomnav").innerHTML = NAV.map(function (n) {
      return '<button class="navbtn" data-route="' + n.route + '" data-hash="' + n.hash + '">' +
        '<span class="pill">' + DC.icon(n.icon) + (n.route === "cart" ? '<span class="badge" id="cartBadge" hidden>0</span>' : '') + '</span>' +
        '<span>' + n.label + '</span></button>';
    }).join("");
    document.querySelectorAll(".navbtn").forEach(function (b) {
      b.addEventListener("click", function () { DC.fx.sound.tap(); DC.go(b.dataset.hash); });
    });
  }

  DC.refreshNav = function (pop) {
    var n = DC.store.cartCount(), badge = document.getElementById("cartBadge");
    if (badge) { badge.textContent = n; badge.hidden = n === 0; if (pop) { badge.classList.remove("pop"); void badge.offsetWidth; badge.classList.add("pop"); } }
    var sn = document.getElementById("streakN"); if (sn) sn.textContent = DC.store.state.profile.streak.count;
  };

  function setActive(route) {
    document.querySelectorAll(".navbtn").forEach(function (b) {
      if (b.dataset.route === route) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  function parse() { var h = location.hash.replace(/^#\/?/, ""), p = h.split("/"); return { base: p[0] || "home", a: p[1] }; }
  function render() {
    if (DC.cleanupTrack) DC.cleanupTrack();
    if (DC.clearViewTimers) DC.clearViewTimers();
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
    setActive((map[r.base] || map.home)());
    DC.refreshNav();
  }
  DC.refresh = render;

  function onboarding(done) {
    if (DC.store.state.seenOnboarding) { done(); return; }
    var o = document.createElement("div");
    o.className = "onb";
    o.innerHTML =
      '<div class="ob-logo">' + DC.icon("cart") + '</div>' +
      '<h2>Riempi il carrello, salta il conto</h2>' +
      '<p>Vivi tutto il rituale dell’acquisto e segui il pacco in arrivo. Niente pagamenti, solo la dopamina. A costo zero.</p>' +
      '<button class="btn btn-lg" id="start">Inizia ' + DC.icon("arrowRight") + '</button>';
    document.body.appendChild(o);
    o.querySelector("#start").addEventListener("click", function () {
      DC.store.state.seenOnboarding = true; DC.store.save();
      DC.fx.sound.success(); DC.fx.buzz.medium(); DC.fx.confetti({ count: 90 });
      o.style.transition = "opacity .3s"; o.style.opacity = "0";
      setTimeout(function () { o.remove(); done(); }, 300);
    });
  }

  function boot() {
    buildChrome();
    if (!location.hash) location.hash = "#/home";
    window.addEventListener("hashchange", render);
    onboarding(render);
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
