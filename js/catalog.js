/* DopaCart — viste: Home, Catalogo, Scheda prodotto. Icone di linea, niente emoji. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  function discount(p) { return Math.round((1 - p.price / p.list) * 100); }
  function rate(p) { return '<span class="rate">' + DC.icon("star") + ' ' + p.rating.toFixed(1) + ' <span style="color:var(--text-faint)">(' + p.reviews.toLocaleString("it-IT") + ')</span></span>'; }

  var R_NAMES = ["Marco R.", "Giulia P.", "Luca D.", "Sara V.", "Andrea T.", "Chiara L.", "Davide F.", "Elena B.", "Matteo S.", "Francesca N.", "Paolo G.", "Ilaria C."];
  var R_POS = [
    "Spedizione finta, soddisfazione vera. Lo “riordino” domani.",
    "Esattamente come me lo immaginavo. Anzi, di più.",
    "Lo uso ogni giorno nella mia testa. Promosso a pieni voti.",
    "Arrivato in un minuto col corriere immaginario. Top.",
    "Non l’ho pagato e sto benissimo lo stesso.",
    "Qualità percepita altissima, addebito pari a zero."
  ];
  var R_MILD = "Bello e d’impatto, ma mi aspettavo la “scatola” un filo più grande. Comunque ci sta.";
  function buildReviews(p) {
    var seed = 0; for (var i = 0; i < p.id.length; i++) seed += p.id.charCodeAt(i);
    function pick(a, k) { return a[(seed + k) % a.length]; }
    var out = [
      { name: pick(R_NAMES, 1), stars: 5, date: "2 giorni fa", text: (p.quotes && p.quotes[0]) || pick(R_POS, 0) },
      { name: pick(R_NAMES, 4), stars: 5, date: "1 settimana fa", text: pick(R_POS, seed + 2) },
      { name: pick(R_NAMES, 7), stars: 4, date: "3 settimane fa", text: R_MILD }
    ];
    if (p.quotes && p.quotes[1]) out.splice(1, 0, { name: pick(R_NAMES, 9), stars: 5, date: "5 giorni fa", text: p.quotes[1] });
    return out;
  }
  function reviewCard(r) {
    var st = ""; for (var i = 0; i < 5; i++) st += '<span class="' + (i < r.stars ? "on" : "off") + '">' + DC.icon("star") + "</span>";
    return '<div class="review"><div class="rev-top"><span class="stars">' + st + '</span><span class="rev-date">' + r.date + '</span></div>' +
      '<div class="who">' + r.name + ' · acquirente verificato</div><p>“' + r.text + '”</p></div>';
  }

  function productCard(p) {
    var tag = p.badges[0];
    return '' +
      '<article class="pcard" data-id="' + p.id + '">' +
        '<div class="tile" style="--h:' + p.hue + '">' +
          (tag ? '<span class="tag ' + tag + '">' + tag.replace("-", " ") + '</span>' : '') +
          DC.icon(DC.iconFor(p)) +
          '<button class="quickadd" data-add="' + p.id + '" aria-label="Aggiungi ' + p.title + ' al carrello">' + DC.icon("plus") + '</button>' +
        '</div>' +
        '<div class="body">' +
          '<div class="ptitle">' + p.title + '</div>' +
          rate(p) +
          '<div class="price"><span class="now">' + DC.fx.euro(p.price) + '</span><span class="was">' + DC.fx.euro(p.list) + '</span></div>' +
          '<span class="disc">-' + discount(p) + '%</span>' +
        '</div>' +
      '</article>';
  }

  function bindCards(root) {
    root.querySelectorAll(".pcard").forEach(function (c) {
      c.addEventListener("click", function (e) { if (e.target.closest("[data-add]")) return; DC.go("#/product/" + c.dataset.id); });
    });
    root.querySelectorAll("[data-add]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); DC.addToCartFx(b.dataset.add, b); });
    });
  }

  /* —— HOME —— */
  DC.views.home = function (root) {
    var s = DC.store;
    var offerte = DC.catalog.products.filter(function (p) { return p.badges.indexOf("offerta") >= 0; });
    var offIds = offerte.map(function (p) { return p.id; });
    var perTe = DC.catalog.products.filter(function (p) { return offIds.indexOf(p.id) < 0; }).sort(function () { return Math.random() - 0.5; }).slice(0, 8);
    var canMystery = s.canOpenMystery();

    root.innerHTML =
      '<section class="hero">' +
        '<div class="eyebrow">Shopping a costo zero</div>' +
        '<h2>Riempi il carrello, salta il conto.</h2>' +
        '<p>Vivi tutto il brivido dell’acquisto, la dopamina senza la spesa.</p>' +
        '<button class="btn btn-action" id="heroCta">Inizia a riempire ' + DC.icon("arrowRight") + '</button>' +
        '<div class="floaties">' + ["headphones", "gamepad", "watch"].map(function (i) { return '<span>' + DC.icon(i) + '</span>'; }).join("") + '</div>' +
      '</section>' +

      (canMystery ?
        '<div class="mystery" id="homeMystery"><div class="box">' + DC.icon("gift") + '</div>' +
          '<div class="mt">Scatola mistero del giorno</div><div class="ms">Toccala per un bonus a sorpresa</div></div>' : '') +

      '<div class="section-title">' + DC.icon("flame") + 'Offerte lampo</div>' +
      '<div class="grid stagger">' + offerte.map(productCard).join("") + '</div>' +

      '<div class="section-title">' + DC.icon("sparkles") + 'Pensati per te</div>' +
      '<div class="grid stagger">' + perTe.map(productCard).join("") + '</div>';

    bindCards(root);
    root.querySelector("#heroCta").addEventListener("click", function () { DC.fx.sound.tap(); DC.go("#/catalog"); });
    var mb = root.querySelector("#homeMystery");
    if (mb) mb.addEventListener("click", function () { DC.openMystery(mb); });
  };

  /* —— CATALOGO —— */
  var activeCat = "all";
  DC.views.catalog = function (root, params) {
    if (params && params.cat) activeCat = params.cat;
    var cats = [{ id: "all", name: "Tutto" }].concat(DC.catalog.categories);

    root.innerHTML =
      '<div class="h1">Catalogo</div>' +
      '<div class="chips">' + cats.map(function (c) {
        return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + (c.id === activeCat) + '">' +
          DC.icon(DC.CAT_ICON[c.id] || "sparkles") + c.name + '</button>';
      }).join("") + '</div>' +
      '<div class="grid stagger" id="catGrid">' +
        Array.from({ length: 6 }).map(function () { return '<div class="sk sk-card"></div>'; }).join("") +
      '</div>';

    var grid = root.querySelector("#catGrid");
    setTimeout(function () {
      var list = activeCat === "all" ? DC.catalog.products : DC.catalog.products.filter(function (p) { return p.cat === activeCat; });
      grid.innerHTML = list.map(productCard).join("");
      bindCards(grid);
    }, DC.fx.reduced ? 0 : 300);

    root.querySelectorAll(".chip").forEach(function (ch) {
      ch.addEventListener("click", function () { activeCat = ch.dataset.cat; DC.fx.sound.tap(); DC.fx.buzz.light(); DC.views.catalog(root); });
    });
    var act = root.querySelector('.chip[aria-pressed="true"]');
    if (act && act.scrollIntoView) act.scrollIntoView({ inline: "center", block: "nearest" });
  };

  /* —— SCHEDA PRODOTTO —— */
  DC.views.product = function (root, params) {
    var p = DC.store.productById(params.id);
    if (!p) { root.innerHTML = emptyBox("search", "Prodotto non trovato"); return; }

    root.innerHTML =
      '<button class="backbtn" id="back">' + DC.icon("chevronLeft") + ' Indietro</button>' +
      '<div class="pd-hero" style="--h:' + p.hue + '">' + DC.icon(DC.iconFor(p)) + '</div>' +
      '<div class="pd-title">' + p.title + '</div>' +
      '<div class="pd-social">' + DC.icon("star") + p.rating.toFixed(1) + ' · ' + p.reviews.toLocaleString("it-IT") + ' recensioni · scelto da ' + p.boughtBy.toLocaleString("it-IT") + '</div>' +
      '<div class="pd-price"><span class="now">' + DC.fx.euro(p.price) + '</span><span class="was">' + DC.fx.euro(p.list) + '</span>' +
        '<span class="disc">-' + discount(p) + '%</span></div>' +
      '<p class="pd-blurb">' + p.blurb + '</p>' +
      '<div class="section-title">' + DC.icon("star") + 'Recensioni</div>' +
      '<div class="reviews">' + buildReviews(p).map(reviewCard).join("") + '</div>' +
      '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="addBtn">' + DC.icon("cart") + ' Aggiungi · ' + DC.fx.euro(p.price) + '</button></div>';

    root.querySelector("#back").addEventListener("click", function () { history.back(); });
    root.querySelector("#addBtn").addEventListener("click", function (e) {
      DC.addToCartFx(p.id, e.currentTarget);
      DC.fx.toast("Aggiunto al carrello", { icon: "check" });
    });
  };

  function emptyBox(icon, title) {
    return '<div class="empty"><div class="em">' + DC.icon(icon) + '</div><div class="et">' + title + '</div></div>';
  }
  DC.emptyBox = emptyBox;
})();
