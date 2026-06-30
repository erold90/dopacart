/* DopaCart — viste: Home, Catalogo (ricerca + scroll infinito), Scheda prodotto.
   Meccaniche "shopping vero" simulate client-side: caccia, urgenza, social proof, raccomandazioni. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  function discount(p) { return Math.round((1 - p.price / p.list) * 100); }
  function rate(p) { return '<span class="rate">' + DC.icon("star") + ' ' + p.rating.toFixed(1) + ' <span style="color:var(--text-faint)">(' + p.reviews.toLocaleString("it-IT") + ')</span></span>'; }
  function esc(s) { return (s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000; return h; }
  function catName(id) { var c = DC.catalog.categories.find(function (x) { return x.id === id; }); return c ? c.name : ""; }
  function liveCounts(p) { var s = hash(p.id); return { sold: p.boughtBy, left: 1 + (s % 8), claimed: 62 + (s % 37), viewing: 4 + (s % 22) }; }

  /* —— Card prodotto —— */
  function productCard(p, opts) {
    opts = opts || {};
    var tag = p.badges[0], lc = liveCounts(p);
    var stock = opts.lightning ? '<div class="cstock"><div class="cstock-bar"><span style="width:' + lc.claimed + '%"></span></div><div class="cstock-l">Richiesto al ' + lc.claimed + '%</div></div>' : '';
    return '<article class="pcard" data-id="' + p.id + '">' +
        '<div class="tile" style="--h:' + p.hue + '">' +
          (tag ? '<span class="tag ' + tag + '">' + tag.replace("-", " ") + '</span>' : '') +
          DC.icon(DC.iconFor(p)) + DC.imgTag(p, 500) +
          '<button class="quickadd" data-add="' + p.id + '" aria-label="Aggiungi ' + p.title + ' al carrello">' + DC.icon("plus") + '</button>' +
        '</div>' +
        '<div class="body">' +
          '<div class="ptitle">' + p.title + '</div>' + rate(p) +
          '<div class="price"><span class="now">' + DC.fx.euro(p.price) + '</span><span class="was">' + DC.fx.euro(p.list) + '</span></div>' +
          '<div class="cmeta"><span class="disc">-' + discount(p) + '%</span><span class="sold">' + lc.sold.toLocaleString("it-IT") + ' venduti</span></div>' + stock +
        '</div>' +
      '</article>';
  }
  function bindCards(scope) {
    scope.querySelectorAll(".pcard:not(.bnd)").forEach(function (c) {
      c.classList.add("bnd");
      c.addEventListener("click", function (e) { if (e.target.closest("[data-add]")) return; DC.go("#/product/" + c.dataset.id); });
    });
    scope.querySelectorAll("[data-add]:not(.bnd)").forEach(function (b) {
      b.classList.add("bnd");
      b.addEventListener("click", function (e) { e.stopPropagation(); DC.addToCartFx(b.dataset.add, b); });
    });
  }

  /* —— Recensioni —— */
  var R_NAMES = ["Marco R.", "Giulia P.", "Luca D.", "Sara V.", "Andrea T.", "Chiara L.", "Davide F.", "Elena B.", "Matteo S.", "Francesca N.", "Paolo G.", "Ilaria C."];
  var R_POS = ["Spedizione finta, soddisfazione vera. Lo “riordino” domani.", "Esattamente come me lo immaginavo. Anzi, di più.", "Lo uso ogni giorno nella mia testa. Promosso a pieni voti.", "Arrivato in un minuto col corriere immaginario. Top.", "Non l’ho pagato e sto benissimo lo stesso.", "Qualità percepita altissima, addebito pari a zero."];
  var R_MILD = "Bello e d’impatto, ma mi aspettavo la “scatola” un filo più grande. Comunque ci sta.";
  function buildReviews(p) {
    var seed = hash(p.id); function pick(a, k) { return a[(seed + k) % a.length]; }
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

  /* —— HOME —— */
  DC.views.home = function (root) {
    var s = DC.store;
    var offerteAll = DC.catalog.products.filter(function (p) { return p.badges.indexOf("offerta") >= 0; });
    var offIds = offerteAll.map(function (p) { return p.id; });
    var offerte = offerteAll.slice(0, 8);
    var perTe = DC.catalog.products.filter(function (p) { return offIds.indexOf(p.id) < 0; }).sort(function () { return Math.random() - 0.5; }).slice(0, 8);
    var recent = s.state.recent.map(function (id) { return s.productById(id); }).filter(Boolean).slice(0, 8);
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

      '<div class="section-title">' + DC.icon("bolt") + 'Offerte lampo <span class="lz-time" id="lzTime">--:--:--</span></div>' +
      '<div class="grid stagger">' + offerte.map(function (p) { return productCard(p, { lightning: true }); }).join("") + '</div>' +

      (recent.length ?
        '<div class="section-title">' + DC.icon("eye") + 'Visti di recente</div>' +
        '<div class="hscroll" id="recentRow">' + recent.map(function (p) { return productCard(p); }).join("") + '</div>' : "") +

      '<div class="section-title">' + DC.icon("sparkles") + 'Pensati per te</div>' +
      '<div class="grid stagger">' + perTe.map(function (p) { return productCard(p); }).join("") + '</div>';

    bindCards(root);
    root.querySelector("#heroCta").addEventListener("click", function () { DC.fx.sound.tap(); DC.go("#/catalog"); });
    var mb = root.querySelector("#homeMystery");
    if (mb) mb.addEventListener("click", function () { DC.openMystery(mb); });
    startLightning(root);
  };

  function startLightning(root) {
    var el = root.querySelector("#lzTime"); if (!el) return;
    var WIN = 3 * 3600 * 1000;
    function tick() {
      var now = Date.now(), r = Math.max(0, Math.ceil(now / WIN) * WIN - now);
      var h = Math.floor(r / 3600000), m = Math.floor(r % 3600000 / 60000), sec = Math.floor(r % 60000 / 1000);
      function z(n) { return (n < 10 ? "0" : "") + n; }
      el.textContent = z(h) + ":" + z(m) + ":" + z(sec);
    }
    tick(); DC.regTimer(setInterval(tick, 1000));
  }

  /* —— CATALOGO: ricerca + ricerche popolari + scroll infinito —— */
  var activeCat = "all", query = "";
  var POPULAR = ["cuffie", "caffè", "sneakers", "gaming", "smartwatch", "regalo", "casa"];
  var io = null, ipage = 0, ibase = [], iwork = [];
  var PAGE = 16;

  function searchResults(q) {
    var s = q.trim().toLowerCase();
    return DC.catalog.products.filter(function (p) {
      return p.title.toLowerCase().indexOf(s) >= 0 || catName(p.cat).toLowerCase().indexOf(s) >= 0;
    });
  }
  function shuffleBy(arr, seed) {
    return arr.map(function (p, i) { return { p: p, k: (hash(p.id) + seed * 97 + i * 13) % 100000 }; })
      .sort(function (a, b) { return a.k - b.k; }).map(function (o) { return o.p; });
  }

  DC.views.catalog = function (root, params) {
    if (params && params.cat) { activeCat = params.cat; query = ""; }
    if (io) { io.disconnect(); io = null; }
    root.innerHTML =
      '<div class="searchbar"><span class="si">' + DC.icon("search") + '</span>' +
        '<input id="q" type="search" placeholder="Cerca di tutto su DopaCart…" value="' + esc(query) + '" autocomplete="off">' +
      '</div><div id="catBody"></div>';
    var q = root.querySelector("#q");
    q.addEventListener("input", function () { query = q.value; renderBody(root); });
    renderBody(root);
  };

  function renderBody(root) {
    var body = root.querySelector("#catBody");
    if (io) { io.disconnect(); io = null; }

    if (query.trim()) {
      var res = searchResults(query);
      body.innerHTML = '<div class="sub" style="margin:var(--sp-1) 0 var(--sp-3)">' + res.length + ' risultati per “' + esc(query.trim()) + '”</div>' +
        (res.length ? '<div class="grid" id="grid">' + res.map(function (p) { return productCard(p); }).join("") + '</div>'
          : DC.emptyBox("search", "Nessun risultato") + '<div class="sub" style="text-align:center;margin-top:-24px">Prova con un’altra parola.</div>');
      if (res.length) bindCards(body.querySelector("#grid"));
      return;
    }

    var cats = [{ id: "all", name: "Tutto" }].concat(DC.catalog.categories);
    body.innerHTML =
      '<div class="pop">' + POPULAR.map(function (t) { return '<button class="poptag" data-q="' + t + '">' + DC.icon("search") + t + '</button>'; }).join("") + '</div>' +
      '<div class="chips">' + cats.map(function (c) {
        return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + (c.id === activeCat) + '">' + DC.icon(DC.CAT_ICON[c.id] || "sparkles") + c.name + '</button>';
      }).join("") + '</div>' +
      '<div class="grid" id="grid"></div>' +
      '<div id="ioSentinel" class="io-sentinel">' + Array.from({ length: 2 }).map(function () { return '<div class="sk sk-card"></div>'; }).join("") + '</div>';

    ibase = activeCat === "all" ? DC.catalog.products.slice() : DC.catalog.products.filter(function (p) { return p.cat === activeCat; });
    iwork = ibase.slice(); ipage = 0;
    appendPage(body); // prima pagina subito
    var sentinel = body.querySelector("#ioSentinel");
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) appendPage(body); }, { rootMargin: "300px" });
      io.observe(sentinel);
    } else { appendPage(body); appendPage(body); }

    body.querySelectorAll(".poptag").forEach(function (t) {
      t.addEventListener("click", function () { query = t.dataset.q; var qi = document.getElementById("q"); if (qi) qi.value = query; DC.fx.sound.tap(); renderBody(document.getElementById("view")); });
    });
    body.querySelectorAll(".chip").forEach(function (ch) {
      ch.addEventListener("click", function () { activeCat = ch.dataset.cat; DC.fx.sound.tap(); DC.fx.buzz.light(); renderBody(document.getElementById("view")); });
    });
    var act = body.querySelector('.chip[aria-pressed="true"]');
    if (act && act.scrollIntoView) act.scrollIntoView({ inline: "center", block: "nearest" });
  }

  function appendPage(body) {
    var grid = body.querySelector("#grid"), sentinel = body.querySelector("#ioSentinel");
    if (!grid) return;
    var start = ipage * PAGE;
    while (iwork.length < start + PAGE && ibase.length) iwork = iwork.concat(shuffleBy(ibase, iwork.length)); // ricicla = pozzo senza fondo
    var slice = iwork.slice(start, start + PAGE);
    ipage++;
    grid.insertAdjacentHTML("beforeend", slice.map(function (p) { return productCard(p); }).join(""));
    bindCards(grid);
    if (ipage >= 12 && sentinel) { if (io) io.disconnect(); sentinel.remove(); } // limite DOM (~192 card)
  }

  /* —— SCHEDA PRODOTTO —— */
  DC.views.product = function (root, params) {
    var p = DC.store.productById(params.id);
    if (!p) { root.innerHTML = DC.emptyBox("search", "Prodotto non trovato"); return; }
    DC.store.addRecent(p.id);
    var lc = liveCounts(p);
    var isBest = p.badges.indexOf("best-seller") >= 0;
    var rank = 1 + (hash(p.id) % 5);

    // Spesso comprati insieme
    var sameCat = DC.catalog.products.filter(function (x) { return x.cat === p.cat && x.id !== p.id; });
    var addons = (sameCat.length >= 2 ? sameCat : sameCat.concat(DC.catalog.products.filter(function (x) { return x.cat !== p.cat && x.id !== p.id; }))).slice(0, 2);
    var addSum = addons.reduce(function (t, x) { return t + x.price; }, 0);
    var bundle = p.price + addSum;
    var saving = Math.round(addSum * 0.15 * 100) / 100;
    var bundleIds = [p.id].concat(addons.map(function (x) { return x.id; })).join(",");

    root.innerHTML =
      '<button class="backbtn" id="back">' + DC.icon("chevronLeft") + ' Indietro</button>' +
      '<div class="pd-hero" style="--h:' + p.hue + '">' + DC.icon(DC.iconFor(p)) + DC.imgTag(p, 800) + '</div>' +
      (isBest ? '<div class="rankline">' + DC.icon("trophy") + ' Bestseller n.' + rank + ' in ' + catName(p.cat) + '</div>' : '') +
      '<div class="pd-title">' + p.title + '</div>' +
      '<div class="pd-social">' + DC.icon("star") + p.rating.toFixed(1) + ' · ' + p.reviews.toLocaleString("it-IT") + ' recensioni · ' + lc.sold.toLocaleString("it-IT") + ' venduti</div>' +
      '<div class="pd-price"><span class="now">' + DC.fx.euro(p.price) + '</span><span class="was">' + DC.fx.euro(p.list) + '</span><span class="disc">-' + discount(p) + '%</span></div>' +
      '<div class="urgency">' +
        '<span class="u-left">' + DC.icon("bolt") + ' Solo <b>' + lc.left + '</b> rimasti a questo prezzo</span>' +
        '<span class="u-view">' + DC.icon("eye") + ' <b id="viewN">' + lc.viewing + '</b> lo stanno guardando</span>' +
      '</div>' +
      '<div class="delivery">' + DC.icon("truck") + ' Ricevilo (per finta) <b>entro domani</b> · spedizione 0,00 €</div>' +
      '<p class="pd-blurb">' + p.blurb + '</p>' +

      '<div class="fbt"><div class="fbt-h">' + DC.icon("plusCircle") + ' Spesso comprati insieme</div>' +
        '<div class="fbt-row">' +
          [p].concat(addons).map(function (x, i) {
            return (i ? '<span class="fbt-plus">+</span>' : '') + '<div class="fbt-item" style="--h:' + x.hue + '">' + DC.icon(DC.iconFor(x)) + DC.imgTag(x, 200) + '</div>';
          }).join("") +
        '</div>' +
        '<div class="fbt-foot"><div><div class="fbt-tot tnum">' + DC.fx.euro(bundle) + '</div><div class="fbt-save">risparmi ' + DC.fx.euro(saving) + '</div></div>' +
          '<button class="btn btn-action" id="fbtAdd" data-fbt="' + bundleIds + '">Aggiungi tutti e ' + (addons.length + 1) + '</button></div>' +
      '</div>' +

      '<div class="section-title">' + DC.icon("star") + 'Recensioni</div>' +
      '<div class="reviews">' + (p.revs && p.revs.length ? p.revs.map(reviewCard).join("") : '<p class="sub">Ancora nessuna recensione.</p>') + '</div>' +

      '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="addBtn">' + DC.icon("cart") + ' Aggiungi · ' + DC.fx.euro(p.price) + '</button></div>';

    root.querySelector("#back").addEventListener("click", function () { history.back(); });
    root.querySelector("#addBtn").addEventListener("click", function (e) { DC.addToCartFx(p.id, e.currentTarget); DC.fx.toast("Aggiunto al carrello", { icon: "check" }); });
    root.querySelector("#fbtAdd").addEventListener("click", function (e) {
      e.currentTarget.dataset.fbt.split(",").forEach(function (id) { DC.store.addToCart(id); });
      DC.fx.sound.add(); DC.fx.buzz.medium(); DC.fx.flyToCart(e.currentTarget); DC.refreshNav(true);
      DC.fx.toast("Aggiunti " + (addons.length + 1) + " articoli", { icon: "check", win: true });
    });
    // "N lo stanno guardando" vivo
    var vEl = root.querySelector("#viewN");
    if (vEl) { var n = lc.viewing; DC.regTimer(setInterval(function () { n = Math.max(3, n + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3))); vEl.textContent = n; }, 2600)); }
  };

  function emptyBox(icon, title) { return '<div class="empty"><div class="em">' + DC.icon(icon) + '</div><div class="et">' + title + '</div></div>'; }
  DC.emptyBox = emptyBox;
})();
