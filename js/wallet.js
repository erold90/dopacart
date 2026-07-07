/* DopaCart — portafoglio (carte finte ironiche + carte sbloccabili con XP) e rubrica indirizzi.
   Selettori bottom-sheet riusati da Profilo e Checkout. Tutto client-side, salvato nel profilo sincronizzato. */
window.DC = window.DC || {};
(function () {
  // Catalogo carte: 4 base (livello 1) + 2 sbloccabili salendo di livello. grad = sfondo carta.
  DC.CARDS = [
    { id: "dopacard",     name: "DopaCard ∞",        num: "4200 0000 0000 0000", minLevel: 1,
      grad: "linear-gradient(135deg,oklch(0.74 0.16 62),oklch(0.66 0.20 30))",
      tag: "Fondi illimitati di dopamina. Addebito 0,00 €, per sempre." },
    { id: "visamaisoldi", name: "Visamaisoldi",       num: "4000 1234 5678 9010", minLevel: 1,
      grad: "linear-gradient(135deg,oklch(0.46 0.13 265),oklch(0.28 0.10 278))",
      tag: "Declina con eleganza qualsiasi spesa reale." },
    { id: "masterkarma",  name: "MasterKarma",        num: "5300 7777 0000 1111", minLevel: 1,
      grad: "linear-gradient(135deg,oklch(0.63 0.21 25),oklch(0.74 0.18 62))",
      tag: "Paghi in buone intenzioni. Saldo karmico sempre positivo." },
    { id: "klarnaria",    name: "KlarnAria",          num: "6011 0300 0300 0000", minLevel: 1,
      grad: "linear-gradient(135deg,oklch(0.78 0.13 350),oklch(0.55 0.18 300))",
      tag: "Paga in 3 comode rate da 0,00 €. Interessi: aria." },
    { id: "espresso",     name: "American Espresso",  num: "3700 0000 0000 002",  minLevel: 5,
      grad: "linear-gradient(135deg,oklch(0.56 0.11 165),oklch(0.36 0.08 178))",
      tag: "Membership dei perditempo di lusso. Dal giorno che ti sei annoiato." },
    { id: "infinity",     name: "Carta Infinity",     num: "0000 0000 0000 0000", minLevel: 10,
      grad: "linear-gradient(135deg,oklch(0.34 0.02 285),oklch(0.15 0.015 285))",
      tag: "Nera come il tuo tempo libero. Priorità assoluta su nulla." }
  ];

  function level() { return (DC.store.xpProgress && DC.store.xpProgress().level) || 1; }
  function cardById(id) { return DC.CARDS.find(function (c) { return c.id === id; }) || DC.CARDS[0]; }
  function unlocked(c) { return level() >= c.minLevel; }
  function esc(s) { return (s || "").toString().replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

  // Riepilogo del pagamento corrente (per checkout/profilo)
  function paymentSummary() {
    var p = DC.store.getPayment();
    if (p.method === "cod") return { icon: "coins", title: "Contrassegno", sub: "Paghi alla consegna, in complimenti al corriere." };
    var c = cardById(p.cardId);
    return { icon: "creditCard", title: c.name + " · 0,00 €", sub: c.tag, card: c };
  }

  function addrLine(a) {
    if (!a) return "";
    return [a.street, [a.zip, a.city].filter(Boolean).join(" ") + (a.prov ? " (" + a.prov + ")" : "")].filter(Boolean).join(" · ");
  }

  // ship (per createOrder/buyNow) dall'indirizzo salvato
  function shipFrom(a) {
    if (!a) return {};
    return { name: a.name, addr: a.street, city: [a.zip, a.city].filter(Boolean).join(" ") + (a.prov ? " (" + a.prov + ")" : ""), label: a.label };
  }
  // info pagamento (per l'ordine) dal metodo scelto
  function payInfo() {
    var p = DC.store.getPayment();
    return p.method === "cod" ? { method: "cod", label: "Contrassegno" } : { method: "card", cardId: p.cardId, label: cardById(p.cardId).name };
  }

  // Card art (per selettore/portafoglio)
  function cardArt(c, opts) {
    opts = opts || {};
    var lock = opts.locked;
    return '<div class="fcard' + (opts.sel ? " sel" : "") + (lock ? " locked" : "") + (opts.sm ? " sm" : "") + '"' +
        ' style="background:' + c.grad + '"' + (lock ? "" : ' data-card="' + c.id + '"') + '>' +
        (lock ? '<div class="fcard-lock">' + DC.icon("lock") + ' Livello ' + c.minLevel + '</div>' : "") +
        (opts.sel ? '<span class="fcard-check">' + DC.icon("check") + "</span>" : "") +
        '<div class="fcard-top"><span class="fcard-name">' + c.name + "</span></div>" +
        '<div class="fcard-chip"></div>' +
        '<div class="fcard-num">' + c.num + "</div>" +
        '<div class="fcard-tag">' + c.tag + "</div>" +
        '<div class="fcard-meta"><span>SEMPRE TU</span><span>∞ / ∞</span></div>' +
      "</div>";
  }

  /* —— bottom sheet generico —— */
  function sheet(title, bodyHTML) {
    var ov = document.createElement("div");
    ov.className = "sheet-ov";
    ov.innerHTML = '<div class="sheet-card"><div class="sheet-h"><span>' + title + '</span>' +
      '<button class="auth-x" data-x>' + DC.icon("x") + '</button></div><div class="sheet-b">' + bodyHTML + "</div></div>";
    document.body.appendChild(ov);
    if (DC.fx && DC.fx.sound) DC.fx.sound.pop();
    function close() { ov.style.opacity = "0"; setTimeout(function () { ov.remove(); }, 220); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector("[data-x]").addEventListener("click", close);
    return { ov: ov, close: close, body: ov.querySelector(".sheet-b") };
  }

  /* —— Form indirizzo —— */
  function editAddress(addr, cb) {
    addr = addr || {};
    var s = sheet(addr.id ? "Modifica indirizzo" : "Nuovo indirizzo",
      '<div class="chips-row" id="lblChips">' +
        ["Casa", "Ufficio", "Altro"].map(function (l) { return '<button class="chip' + (addr.label === l ? " on" : "") + '" data-lbl="' + l + '">' + l + "</button>"; }).join("") +
      '</div>' +
      '<div class="field"><label>Etichetta</label><input id="a-label" value="' + esc(addr.label || "Casa") + '" placeholder="Casa"></div>' +
      '<div class="field"><label>Nome e cognome</label><input id="a-name" value="' + esc(addr.name || DC.store.state.profile.name || "") + '" placeholder="Mario Rossi"></div>' +
      '<div class="field"><label>Via e civico</label><input id="a-street" value="' + esc(addr.street || "") + '" placeholder="Via Roma 1"></div>' +
      '<div class="row2"><div class="field"><label>CAP</label><input id="a-zip" inputmode="numeric" maxlength="5" value="' + esc(addr.zip || "") + '" placeholder="00100"></div>' +
      '<div class="field"><label>Città</label><input id="a-city" value="' + esc(addr.city || "") + '" placeholder="Roma"></div></div>' +
      '<div class="field"><label>Provincia</label><input id="a-prov" maxlength="2" value="' + esc(addr.prov || "") + '" placeholder="RM" style="text-transform:uppercase"></div>' +
      '<button class="btn btn-action btn-block btn-lg" id="a-save">Salva indirizzo</button>');
    s.body.querySelectorAll("[data-lbl]").forEach(function (b) {
      b.addEventListener("click", function () { s.body.querySelector("#a-label").value = b.dataset.lbl; s.body.querySelectorAll("[data-lbl]").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); });
    });
    s.body.querySelector("#a-save").addEventListener("click", function () {
      var v = function (id) { return (s.body.querySelector(id).value || "").trim(); };
      var name = v("#a-name"), street = v("#a-street"), city = v("#a-city");
      if (!name || !street || !city) { DC.fx.toast("Compila nome, via e città", { icon: "x" }); return; }
      var id = DC.store.saveAddress({ id: addr.id, label: v("#a-label") || "Casa", name: name, street: street, zip: v("#a-zip"), city: city, prov: v("#a-prov").toUpperCase() });
      DC.fx.sound.tap(); DC.fx.buzz.light(); DC.fx.toast("Indirizzo salvato", { icon: "check" });
      s.close(); if (cb) cb(id);
    });
  }

  /* —— Selettore indirizzo (rubrica) —— */
  function pickAddress(cb) {
    function render() {
      var list = DC.store.addresses(), def = (DC.store.defaultAddress() || {}).id;
      var body = (list.length ? list.map(function (a) {
        return '<div class="pick-row' + (a.id === def ? " sel" : "") + '" data-pick="' + a.id + '">' +
            '<div class="pick-ic">' + DC.icon(a.label === "Ufficio" ? "briefcase" : "home") + '</div>' +
            '<div class="pick-main"><b>' + esc(a.label || "Indirizzo") + (a.id === def ? ' <span class="pill-def">predefinito</span>' : "") + "</b>" +
              '<div class="sub">' + esc(a.name) + " · " + esc(addrLine(a)) + "</div></div>" +
            '<button class="ic-btn" data-edit="' + a.id + '" aria-label="Modifica">' + DC.icon("pencil") + "</button>" +
            '<button class="ic-btn" data-del="' + a.id + '" aria-label="Elimina">' + DC.icon("trash") + "</button>" +
          "</div>";
      }).join("") : '<div class="sub" style="padding:var(--sp-2) 0">Nessun indirizzo salvato.</div>') +
      '<button class="btn btn-ghost btn-block" id="addAddr" style="margin-top:var(--sp-3)">' + DC.icon("plus") + " Aggiungi indirizzo</button>";
      s.body.innerHTML = body;
      s.body.querySelectorAll("[data-pick]").forEach(function (r) {
        r.addEventListener("click", function (e) {
          if (e.target.closest("[data-edit],[data-del]")) return;
          DC.store.setDefaultAddress(r.dataset.pick); DC.fx.sound.tap(); s.close(); if (cb) cb(r.dataset.pick);
        });
      });
      s.body.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { s.close(); editAddress(DC.store.addresses().find(function (x) { return x.id === b.dataset.edit; }), function () { pickAddress(cb); }); }); });
      s.body.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { DC.store.deleteAddress(b.dataset.del); DC.fx.buzz.light(); render(); }); });
      s.body.querySelector("#addAddr").addEventListener("click", function () { s.close(); editAddress(null, function () { pickAddress(cb); }); });
    }
    var s = sheet("Indirizzo di consegna", "");
    render();
  }

  /* —— Selettore pagamento (contrassegno + carte) —— */
  function pickPayment(cb) {
    var p = DC.store.getPayment();
    var cardsHTML = DC.CARDS.map(function (c) {
      var lk = !unlocked(c);
      return cardArt(c, { sel: p.method === "card" && p.cardId === c.id && !lk, locked: lk });
    }).join("");
    var s = sheet("Metodo di pagamento",
      '<div class="pick-row cod' + (p.method === "cod" ? " sel" : "") + '" data-cod><div class="pick-ic">' + DC.icon("coins") + "</div>" +
        '<div class="pick-main"><b>Contrassegno' + (p.method === "cod" ? ' <span class="pill-def">scelto</span>' : "") + "</b>" +
          '<div class="sub">Paghi alla consegna, in complimenti al corriere.</div></div>' +
        (p.method === "cod" ? '<span class="fcard-check" style="position:static">' + DC.icon("check") + "</span>" : "") + "</div>" +
      '<div class="section-title" style="margin:var(--sp-4) 0 var(--sp-2)">' + DC.icon("wallet") + "Le tue carte</div>" +
      '<div class="wallet-scroll">' + cardsHTML + "</div>" +
      '<div class="disclaimer" style="margin-top:var(--sp-2)">Sblocchi nuove carte salendo di livello. Nessun addebito reale, mai.</div>');
    s.body.querySelector("[data-cod]").addEventListener("click", function () { DC.store.setPayment("cod"); DC.fx.sound.tap(); s.close(); if (cb) cb(); });
    s.body.querySelectorAll("[data-card]").forEach(function (el) {
      el.addEventListener("click", function () { DC.store.setPayment("card", el.dataset.card); DC.fx.sound.success(); DC.fx.buzz.light(); s.close(); if (cb) cb(); });
    });
  }

  // 1-Tap Dopamina: ordine immediato di un singolo prodotto con indirizzo+pagamento predefiniti
  DC.oneTapBuy = function (productId) {
    var s = DC.store, addr = s.defaultAddress();
    if (!addr) { DC.fx.toast("Imposta un indirizzo per il 1-Tap", { icon: "mapPin" }); editAddress(null, function () { DC.oneTapBuy(productId); }); return; }
    var o = s.buyNow(productId, shipFrom(addr), { payment: payInfo() });
    if (!o) return;
    DC.refreshNav();
    DC.go("#/confirm/" + o.id);
  };

  DC.wallet = {
    level: level, cardById: cardById, unlocked: unlocked, cardArt: cardArt,
    paymentSummary: paymentSummary, addrLine: addrLine, shipFrom: shipFrom, payInfo: payInfo,
    editAddress: editAddress, pickAddress: pickAddress, pickPayment: pickPayment
  };
})();
