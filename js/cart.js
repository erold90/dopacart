/* DopaCart — vista Carrello. Totale che cresce + goal-gradient verso il "drop". */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  var GOAL = 150;

  DC.views.cart = function (root) {
    var s = DC.store;
    var lines = s.state.cart;

    if (!lines.length) {
      root.innerHTML =
        '<div class="h1">Carrello</div>' +
        '<div class="empty"><div class="em">' + DC.icon("cart") + '</div>' +
        '<div class="et">Il carrello ti aspetta</div>' +
        '<p>Riempilo senza pensieri: non pagherai mai davvero.</p>' +
        '<div style="margin-top:var(--sp-5)"><button class="btn btn-action" id="goShop">' + DC.icon("grid") + ' Vai allo shopping</button></div></div>';
      root.querySelector("#goShop").addEventListener("click", function () { DC.go("#/catalog"); });
      return;
    }

    var total = s.cartTotal();
    var pct = Math.min(100, Math.round(total / GOAL * 100));
    var toGoal = Math.max(0, GOAL - total);

    root.innerHTML =
      '<div class="h1">Carrello</div>' +
      '<div class="sub">' + (s.cartCount() === 1 ? '1 articolo pronto a partire' : s.cartCount() + ' articoli pronti a partire') + '</div>' +
      '<div style="margin-top:var(--sp-4)">' +
        lines.map(function (l) {
          var p = s.productById(l.productId);
          return '<div class="cart-item" data-id="' + p.id + '">' +
            '<div class="ci-thumb" style="--h:' + p.hue + '">' + DC.icon(DC.iconFor(p)) + '</div>' +
            '<div class="ci-body"><div class="ci-title">' + p.title + '</div>' +
              '<div class="ci-price tnum">' + DC.fx.euro(p.price * l.qty) + '</div></div>' +
            '<div class="qty"><button data-dec="' + p.id + '" aria-label="Diminuisci">' + DC.icon("minus") + '</button>' +
              '<span class="tnum">' + l.qty + '</span>' +
              '<button data-inc="' + p.id + '" aria-label="Aumenta">' + DC.icon("plus") + '</button></div>' +
          '</div>';
        }).join("") +
      '</div>' +

      '<div class="cart-summary">' +
        '<div class="goalbar"><div class="track"><div class="fill" style="width:' + pct + '%"></div></div>' +
          '<div class="label">' + (toGoal > 0
            ? 'Ti mancano <b class="tnum">' + DC.fx.euro(toGoal) + '</b> per sbloccare il <b>drop</b>'
            : 'Drop sbloccato! Spedizione express simulata') + '</div></div>' +
        '<div class="cart-row"><span class="sub">Totale (finto)</span><span class="cart-total tnum">' + DC.fx.euro(total) + '</span></div>' +
      '</div>' +

      '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="checkout">Vai al checkout · ' + DC.fx.euro(total) + '</button></div>';

    root.querySelectorAll("[data-inc]").forEach(function (b) {
      b.addEventListener("click", function () {
        var line = s.state.cart.find(function (x) { return x.productId === b.dataset.inc; });
        s.setQty(b.dataset.inc, line.qty + 1); DC.fx.sound.add(); DC.fx.buzz.light(); DC.refreshNav(); DC.views.cart(root);
      });
    });
    root.querySelectorAll("[data-dec]").forEach(function (b) {
      b.addEventListener("click", function () {
        var line = s.state.cart.find(function (x) { return x.productId === b.dataset.dec; });
        s.setQty(b.dataset.dec, line.qty - 1); DC.fx.sound.tap(); DC.fx.buzz.light(); DC.refreshNav(); DC.views.cart(root);
      });
    });
    root.querySelector("#checkout").addEventListener("click", function () { DC.go("#/checkout"); });
  };
})();
