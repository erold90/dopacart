/* DopaCart — vista Carrello. Totale che cresce + goal-gradient "drop" + coupon + upsell. */
window.DC = window.DC || {};
DC.views = DC.views || {};
DC.coupon = DC.coupon || { code: null, pct: 0 };
(function () {
  var GOAL = 150;

  DC.views.cart = function (root) {
    var s = DC.store, lines = s.state.cart;

    if (!lines.length) {
      DC.coupon = { code: null, pct: 0 };
      root.innerHTML =
        '<div class="h1">Carrello</div>' +
        '<div class="empty"><div class="em">' + DC.icon("cart") + '</div>' +
        '<div class="et">Il carrello ti aspetta</div><p>Riempilo senza pensieri: non pagherai mai davvero.</p>' +
        '<div style="margin-top:var(--sp-5)"><button class="btn btn-action" id="goShop">' + DC.icon("grid") + ' Vai allo shopping</button></div></div>';
      root.querySelector("#goShop").addEventListener("click", function () { DC.go("#/catalog"); });
      return;
    }

    var sub = s.cartTotal();
    var disc = sub * (DC.coupon.pct || 0);
    var total = sub - disc;
    var pct = Math.min(100, Math.round(sub / GOAL * 100));
    var toGoal = Math.max(0, GOAL - sub);
    var inCart = lines.map(function (l) { return l.productId; });
    var upsell = toGoal > 0 ? DC.catalog.products.filter(function (p) { return inCart.indexOf(p.id) < 0; }).sort(function (a, b) { return a.price - b.price; }).slice(0, 2) : [];

    root.innerHTML =
      '<div class="h1">Carrello</div>' +
      '<div class="sub">' + (s.cartCount() === 1 ? '1 articolo pronto a partire' : s.cartCount() + ' articoli pronti a partire') + '</div>' +
      '<div style="margin-top:var(--sp-4)">' +
        lines.map(function (l) {
          var p = s.productById(l.productId);
          return '<div class="cart-item" data-id="' + p.id + '">' +
            '<div class="ci-thumb" style="--h:' + p.hue + '">' + DC.icon(DC.iconFor(p)) + DC.imgTag(p, 160) + '</div>' +
            '<div class="ci-body"><div class="ci-title">' + p.title + '</div><div class="ci-price tnum">' + DC.fx.euro(p.price * l.qty) + '</div></div>' +
            '<div class="qty"><button data-dec="' + p.id + '" aria-label="Diminuisci">' + DC.icon("minus") + '</button><span class="tnum">' + l.qty + '</span>' +
              '<button data-inc="' + p.id + '" aria-label="Aumenta">' + DC.icon("plus") + '</button></div></div>';
        }).join("") +
      '</div>' +

      (upsell.length ?
        '<div class="upsell"><div class="upsell-h">' + DC.icon("bolt") + ' Aggiungi e sblocca il drop</div>' +
          upsell.map(function (p) {
            return '<div class="upsell-i" data-up="' + p.id + '"><div class="ci-thumb" style="--h:' + p.hue + '">' + DC.icon(DC.iconFor(p)) + '</div>' +
              '<div class="ci-body"><div class="ci-title">' + p.title + '</div><div class="ci-price tnum">' + DC.fx.euro(p.price) + '</div></div>' +
              '<button class="quickadd" data-add="' + p.id + '" aria-label="Aggiungi">' + DC.icon("plus") + '</button></div>';
          }).join("") + '</div>' : "") +

      '<div class="coupon"><span class="ci-thumb cpico">' + DC.icon("ticket") + '</span>' +
        '<input id="coupon" placeholder="Codice sconto (prova DOPA10)" value="' + (DC.coupon.code || "") + '" autocomplete="off">' +
        '<button class="btn btn-ghost" id="applyCoupon">Applica</button></div>' +

      '<div class="cart-summary">' +
        '<div class="goalbar"><div class="track"><div class="fill" style="width:' + pct + '%"></div></div>' +
          '<div class="label">' + (toGoal > 0 ? 'Ti mancano <b class="tnum">' + DC.fx.euro(toGoal) + '</b> per sbloccare il <b>drop</b>' : 'Drop sbloccato! Spedizione express simulata') + '</div></div>' +
        '<div class="cart-row"><span class="sub">Subtotale</span><span class="tnum">' + DC.fx.euro(sub) + '</span></div>' +
        (disc > 0 ? '<div class="cart-row"><span style="color:var(--success);font-weight:700">Sconto ' + DC.coupon.code + '</span><span class="tnum" style="color:var(--success)">-' + DC.fx.euro(disc) + '</span></div>' : '') +
        '<div class="cart-row"><span class="cart-total">Totale (finto)</span><span class="cart-total tnum">' + DC.fx.euro(total) + '</span></div>' +
      '</div>' +

      '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="checkout">Vai al checkout · ' + DC.fx.euro(total) + '</button></div>';

    root.querySelectorAll("[data-inc]").forEach(function (b) {
      b.addEventListener("click", function () { var l = s.state.cart.find(function (x) { return x.productId === b.dataset.inc; }); s.setQty(b.dataset.inc, l.qty + 1); DC.fx.sound.add(); DC.fx.buzz.light(); DC.refreshNav(); DC.views.cart(root); });
    });
    root.querySelectorAll("[data-dec]").forEach(function (b) {
      b.addEventListener("click", function () { var l = s.state.cart.find(function (x) { return x.productId === b.dataset.dec; }); s.setQty(b.dataset.dec, l.qty - 1); DC.fx.sound.tap(); DC.fx.buzz.light(); DC.refreshNav(); DC.views.cart(root); });
    });
    root.querySelectorAll("[data-add]").forEach(function (b) {
      b.addEventListener("click", function () { s.addToCart(b.dataset.add); DC.fx.sound.add(); DC.fx.buzz.light(); DC.refreshNav(true); DC.views.cart(root); });
    });
    root.querySelector("#applyCoupon").addEventListener("click", function () {
      var code = (root.querySelector("#coupon").value || "").trim().toUpperCase();
      if (code === "DOPA10") { DC.coupon = { code: "DOPA10", pct: 0.10 }; DC.fx.sound.success(); DC.fx.buzz.medium(); DC.fx.toast("Sconto -10% applicato!", { win: true, icon: "ticket" }); DC.views.cart(root); }
      else if (!code) { DC.fx.toast("Inserisci un codice", { icon: "ticket" }); }
      else { DC.coupon = { code: null, pct: 0 }; DC.fx.buzz.light(); DC.fx.toast("Codice non valido", { icon: "x" }); DC.views.cart(root); }
    });
    root.querySelector("#checkout").addEventListener("click", function () { DC.go("#/checkout"); });
  };
})();
