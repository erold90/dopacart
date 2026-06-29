/* DopaCart — Checkout simulato. 3 step (Zeigarnik + goal-gradient), pagamento finto, meso-reward alla conferma. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  var step = 1;
  var ship = {};

  function stepsBar() {
    return '<div class="steps">' + [1, 2, 3].map(function (i) {
      var cls = i < step ? "done" : (i === step ? "active" : "");
      return '<div class="step ' + cls + '"></div>';
    }).join("") + '</div>';
  }

  DC.views.checkout = function (root) {
    if (!DC.store.state.cart.length) { DC.go("#/cart"); return; }
    step = 1; ship = {}; paint(root);
  };

  function paint(root) {
    var s = DC.store, total = s.cartTotal(), inner;

    if (step === 1) {
      inner =
        '<div class="section-title" style="margin-top:0">' + DC.icon("mapPin") + 'Dove lo spediamo (per finta)</div>' +
        '<div class="field"><label>Nome</label><input id="f-name" value="Tu" autocomplete="off"></div>' +
        '<div class="field"><label>Indirizzo</label><input id="f-addr" value="Via della Dopamina, 1" autocomplete="off"></div>' +
        '<div class="field"><label>Città</label><input id="f-city" value="Lecce" autocomplete="off"></div>' +
        '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="next">Continua</button></div>';
    } else if (step === 2) {
      inner =
        '<div class="section-title" style="margin-top:0">' + DC.icon("wallet") + 'Pagamento (finto, tranquillo)</div>' +
        '<div class="fakecard"><div style="opacity:.85;font-size:var(--fs-sm);font-weight:700">DopaCard · nessun addebito</div>' +
          '<div class="chiprect"></div>' +
          '<div class="num">5470 0000 0000 0000</div>' +
          '<div class="meta"><span>SEMPRE TU</span><span>∞ / ∞</span></div></div>' +
        '<div class="cart-summary"><div class="cart-row"><span class="sub">Totale</span>' +
          '<span class="cart-total tnum">' + DC.fx.euro(total) + '</span></div>' +
          '<div class="disclaimer">0,00 € verranno addebitati. Davvero.</div></div>' +
        '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="next">Continua</button></div>';
    } else {
      inner =
        '<div class="section-title" style="margin-top:0">' + DC.icon("clipboard") + 'Conferma</div>' +
        s.state.cart.map(function (l) {
          var p = s.productById(l.productId);
          return '<div class="cart-row"><span>' + p.title + ' ×' + l.qty + '</span><span class="tnum">' + DC.fx.euro(p.price * l.qty) + '</span></div>';
        }).join("") +
        '<div class="cart-summary"><div class="cart-row"><span class="cart-total">Totale</span><span class="cart-total tnum">' + DC.fx.euro(total) + '</span></div></div>' +
        '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="order">' + DC.icon("zap") + ' Ordina ora</button></div>';
    }

    root.innerHTML =
      '<button class="backbtn" id="back">' + DC.icon("chevronLeft") + ' ' + (step === 1 ? 'Carrello' : 'Indietro') + '</button>' +
      '<div class="h1">Checkout</div>' + stepsBar() + inner;

    root.querySelector("#back").addEventListener("click", function () { if (step === 1) DC.go("#/cart"); else { step--; paint(root); } });
    var next = root.querySelector("#next");
    if (next) next.addEventListener("click", function () {
      if (step === 1) {
        ship = {
          name: (root.querySelector("#f-name").value || "").trim() || "Tu",
          addr: (root.querySelector("#f-addr").value || "").trim(),
          city: (root.querySelector("#f-city").value || "").trim()
        };
      }
      DC.fx.sound.tap(); DC.fx.buzz.light(); step++; paint(root);
    });
    var order = root.querySelector("#order");
    if (order) order.addEventListener("click", placeOrder);
  }

  function placeOrder() {
    var o = DC.store.createOrder(ship);
    DC.fx.confetti({ count: 120, y: innerHeight * 0.5 });
    DC.fx.sound.success(); DC.fx.buzz.strong();
    DC.fx.toast("Ordine confermato! Il pacco è in viaggio", { win: true, icon: "check", ms: 2000 });
    DC.refreshNav();
    DC.go("#/track/" + o.id);
  }
})();
