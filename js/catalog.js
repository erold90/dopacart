/* DopaCart — viste: Home, Catalogo, Scheda prodotto. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  var fx = function () { return DC.fx; };

  function discount(p) { return Math.round((1 - p.price / p.list) * 100); }

  function productCard(p) {
    var tag = p.badges[0];
    return '' +
      '<article class="pcard" data-id="' + p.id + '" style="--h:' + p.hue + '">' +
        (tag ? '<span class="tag ' + tag + '">' + tag.replace("-", " ") + '</span>' : '') +
        '<div class="thumb">' + p.emoji + '</div>' +
        '<button class="quickadd" data-add="' + p.id + '" aria-label="Aggiungi ' + p.title + ' al carrello">' + DC.icon("plus") + '</button>' +
        '<div class="body">' +
          '<div class="ptitle">' + p.title + '</div>' +
          '<div class="rating">' + DC.fx.stars(p.rating) + ' <span>(' + p.reviews.toLocaleString("it-IT") + ')</span></div>' +
          '<div class="price"><span class="now">' + DC.fx.euro(p.price) + '</span><span class="was">' + DC.fx.euro(p.list) + '</span></div>' +
          '<div class="disc">-' + discount(p) + '%</div>' +
        '</div>' +
      '</article>';
  }

  function bindCards(root) {
    root.querySelectorAll(".pcard").forEach(function (c) {
      c.addEventListener("click", function (e) {
        if (e.target.closest("[data-add]")) return;
        DC.go("#/product/" + c.dataset.id);
      });
    });
    root.querySelectorAll("[data-add]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        DC.addToCartFx(b.dataset.add, b);
      });
    });
  }

  /* —— HOME —— */
  DC.views.home = function (root) {
    var s = DC.store;
    var sp = s.xpProgress();
    var offerte = DC.catalog.products.filter(function (p) { return p.badges.indexOf("offerta") >= 0; });
    var perTe = DC.catalog.products.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 8);
    var canMystery = s.canOpenMystery();

    root.innerHTML =
      '<div class="h1">Ciao 👋</div>' +
      '<div class="sub">Cosa ti coccola oggi? Riempi il carrello, niente conto.</div>' +

      (canMystery ?
        '<div class="mystery" id="homeMystery" style="margin-top:var(--sp-4)">' +
          '<div class="box">🎁</div>' +
          '<div style="font-weight:800;font-size:var(--fs-lg);margin-top:6px">Scatola mistero del giorno</div>' +
          '<div style="opacity:.9;font-size:var(--fs-sm);margin-top:2px">Toccala per un bonus a sorpresa</div>' +
        '</div>' : '') +

      '<div class="section-title">🔥 Offerte lampo</div>' +
      '<div class="grid">' + offerte.map(productCard).join("") + '</div>' +

      '<div class="section-title">✨ Pensati per te</div>' +
      '<div class="grid">' + perTe.map(productCard).join("") + '</div>';

    bindCards(root);
    var mb = root.querySelector("#homeMystery");
    if (mb) mb.addEventListener("click", function () { DC.openMystery(mb); });
  };

  /* —— CATALOGO —— */
  var activeCat = "all";
  DC.views.catalog = function (root, params) {
    if (params && params.cat) activeCat = params.cat;
    var cats = [{ id: "all", name: "Tutto", emoji: "🛍️" }].concat(DC.catalog.categories);

    root.innerHTML =
      '<div class="h1">Catalogo</div>' +
      '<div class="chips">' + cats.map(function (c) {
        return '<button class="chip" data-cat="' + c.id + '" aria-pressed="' + (c.id === activeCat) + '">' +
          '<span>' + c.emoji + '</span>' + c.name + '</button>';
      }).join("") + '</div>' +
      '<div class="grid" id="catGrid">' +
        Array.from({ length: 6 }).map(function () { return '<div class="sk sk-card"></div>'; }).join("") +
      '</div>';

    // skeleton breve -> performance percepita (Doherty / progressive loading)
    var grid = root.querySelector("#catGrid");
    setTimeout(function () {
      var list = activeCat === "all" ? DC.catalog.products
        : DC.catalog.products.filter(function (p) { return p.cat === activeCat; });
      grid.innerHTML = list.map(productCard).join("");
      bindCards(grid);
    }, DC.fx.reduced ? 0 : 320);

    root.querySelectorAll(".chip").forEach(function (ch) {
      ch.addEventListener("click", function () {
        activeCat = ch.dataset.cat;
        DC.fx.sound.tap(); DC.fx.buzz.light();
        DC.views.catalog(root);
      });
    });
  };

  /* —— SCHEDA PRODOTTO —— */
  DC.views.product = function (root, params) {
    var p = DC.store.productById(params.id);
    if (!p) { root.innerHTML = '<div class="empty"><div class="em">🔍</div><div class="et">Prodotto non trovato</div></div>'; return; }

    root.innerHTML =
      '<button class="backbtn" id="back">' + DC.icon("chevronLeft") + ' Indietro</button>' +
      '<div class="pd-hero" style="--h:' + p.hue + '">' + p.emoji + '</div>' +
      '<div class="pd-title">' + p.title + '</div>' +
      '<div class="pd-social">' + DC.fx.stars(p.rating) + ' ' + p.rating.toFixed(1) +
        ' · ' + p.reviews.toLocaleString("it-IT") + ' recensioni · scelto da ' + p.boughtBy.toLocaleString("it-IT") + ' persone</div>' +
      '<div class="pd-price"><span class="now">' + DC.fx.euro(p.price) + '</span>' +
        '<span class="was" style="text-decoration:line-through;color:var(--text-soft)">' + DC.fx.euro(p.list) + '</span>' +
        '<span class="disc">-' + discount(p) + '%</span></div>' +
      '<p class="pd-blurb">' + p.blurb + '</p>' +
      '<div class="section-title" style="margin-top:var(--sp-5)">Recensioni</div>' +
      '<div class="reviews">' + p.quotes.map(function (q) {
        return '<div class="review"><div class="stars">★★★★★</div><div class="who">Acquirente verificato</div>' +
          '<div style="font-size:var(--fs-sm);margin-top:4px">“' + q + '”</div></div>';
      }).join("") + '</div>' +

      '<div class="sticky-cta"><button class="btn btn-action btn-block btn-lg" id="addBtn">' +
        DC.icon("cart") + ' Aggiungi · ' + DC.fx.euro(p.price) + '</button></div>';

    root.querySelector("#back").addEventListener("click", function () { history.back(); });
    root.querySelector("#addBtn").addEventListener("click", function (e) {
      DC.addToCartFx(p.id, e.currentTarget);
      DC.fx.toast("Aggiunto al carrello", { icon: "🛒" });
    });
  };
})();
