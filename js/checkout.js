/* DopaCart — Checkout a pagina unica (stile Amazon): indirizzo + pagamento pre-compilati, un tap "Ordina ora". Pagamento finto. */
window.DC = window.DC || {};
(function () {
  var email = ""; // email ospite (registrazione soft)
  function esc(s) { return (s || "").toString().replace(/</g, "&lt;"); }
  function validEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

  DC.views.checkout = function (root) {
    var s = DC.store;
    if (!s.state.cart.length) {
      root.innerHTML = '<button class="backbtn" id="back">' + DC.icon("chevronLeft") + ' Carrello</button>' +
        DC.emptyBox("cart", "Carrello vuoto", { sub: "Aggiungi qualcosa prima di pagare (per finta).", btn: "Vai al catalogo", btnHash: "#/catalog", btnIcon: "grid" });
      var b = root.querySelector("#back"); if (b) b.addEventListener("click", function () { DC.go("#/cart"); });
      return;
    }
    paint(root);
  };

  function paint(root) {
    var s = DC.store;
    var sub = s.cartTotal();
    var disc = sub * ((DC.coupon && DC.coupon.pct) || 0);
    var total = sub - disc;
    var addr = s.defaultAddress();
    var pay = DC.wallet.paymentSummary();

    var addrInner = addr
      ? '<div class="co-main"><b>' + esc(addr.label || "Consegna") + " · " + esc(addr.name) + "</b>" +
          '<div class="sub">' + esc(DC.wallet.addrLine(addr)) + "</div></div>"
      : '<div class="co-main"><b>Aggiungi un indirizzo</b><div class="sub">Dove lo spediamo (per finta)</div></div>';

    root.innerHTML =
      '<button class="backbtn" id="back">' + DC.icon("chevronLeft") + " Carrello</button>" +
      '<div class="h1">Checkout</div>' +

      '<div class="co-card" id="coAddr"><div class="co-ic">' + DC.icon("mapPin") + "</div>" +
        addrInner + '<span class="link-btn">' + (addr ? "Modifica" : "Aggiungi") + "</span></div>" +

      '<div class="co-card" id="coPay"><div class="co-ic">' + DC.icon(pay.icon) + "</div>" +
        '<div class="co-main"><b>' + esc(pay.title) + '</b><div class="sub">' + esc(pay.sub) + "</div></div>" +
        '<span class="link-btn">Cambia</span></div>' +

      (DC.auth && DC.auth.enabled() && !DC.auth.isLoggedIn()
        ? '<div class="co-email"><label>' + DC.icon("user") + ' La tua email <span class="opt">facoltativa</span></label>' +
            '<input id="coEmail" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.it" value="' + esc(email) + '">' +
            '<div class="sub">Inseriscila per registrarti e ritrovare ordini e progressi su ogni dispositivo.</div></div>'
        : "") +

      '<div class="section-title">' + DC.icon("clipboard") + "Riepilogo</div>" +
      '<div class="cart-summary">' +
        s.state.cart.map(function (l) {
          var p = s.productById(l.productId);
          return '<div class="cart-row"><span>' + esc(p.title) + " ×" + l.qty + '</span><span class="tnum">' + DC.fx.euro(p.price * l.qty) + "</span></div>";
        }).join("") +
        (disc > 0 ? '<div class="cart-row"><span class="sub">Sconto ' + (DC.coupon.code || "") + '</span><span class="tnum" style="color:var(--action)">-' + DC.fx.euro(disc) + "</span></div>" : "") +
        '<div class="cart-row"><span class="cart-total">Totale</span><span class="cart-total tnum">' + DC.fx.euro(total) + "</span></div>" +
        '<div class="disclaimer">0,00 € verranno addebitati. Davvero.</div>' +
      "</div>" +

      '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="order">' + DC.icon("zap") + " Ordina ora · " + DC.fx.euro(total) + "</button></div>";

    root.querySelector("#back").addEventListener("click", function () { DC.go("#/cart"); });
    root.querySelector("#coAddr").addEventListener("click", function () {
      if (s.addresses().length) DC.wallet.pickAddress(function () { paint(root); });
      else DC.wallet.editAddress(null, function () { paint(root); });
    });
    root.querySelector("#coPay").addEventListener("click", function () { DC.wallet.pickPayment(function () { paint(root); }); });
    var ce = root.querySelector("#coEmail");
    if (ce) ce.addEventListener("input", function () { email = ce.value.trim(); });
    root.querySelector("#order").addEventListener("click", function () { placeOrder(root); });
  }

  function placeOrder(root) {
    var s = DC.store;
    var addr = s.defaultAddress();
    if (!addr) {
      DC.fx.toast("Aggiungi un indirizzo di consegna", { icon: "mapPin" });
      DC.wallet.editAddress(null, function () { paint(root); });
      return;
    }
    var sub = s.cartTotal();
    var disc = sub * ((DC.coupon && DC.coupon.pct) || 0);
    var o = s.createOrder(DC.wallet.shipFrom(addr), { discountAmt: disc, payment: DC.wallet.payInfo() });
    DC.coupon = { code: null, pct: 0 };
    // Registrazione soft: se ospite e email valida → salva pending + invia codice (verifica dopo, nella conferma)
    if (DC.auth && DC.auth.enabled() && !DC.auth.isLoggedIn() && validEmail(email)) {
      try { localStorage.setItem("dopacart.pending", JSON.stringify({ email: email, name: addr.name || "Cliente" })); } catch (e) {}
      if (DC.auth.request) DC.auth.request(email, addr.name).catch(function () {});
    }
    email = "";
    DC.refreshNav();
    DC.go("#/confirm/" + o.id);
  }
})();
