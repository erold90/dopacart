/* DopaCart — Tracking del pacco (FEATURE REGINA): mappa animata + stati a cascata + notifiche distribuite.
   Lo stato si ricalcola dal tempo trascorso => riprende corretto anche riaprendo l'app. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  DC.cleanupTrack = clearTimers;
  var LAST = function () { return DC.ORDER_STATES.length - 1; };

  function etaText(o) {
    var name = (o.ship && o.ship.name && o.ship.name !== "Tu") ? o.ship.name : "te";
    var remaining = Math.max(0, Math.round((o.offsets[LAST()] - (Date.now() - o.createdAt)) / 1000));
    if (o.delivered || remaining <= 0) return { big: "Consegnato", small: "Goditi la dopamina, a costo zero" };
    var t = remaining < 60 ? ("~" + remaining + " s") : ("~" + Math.ceil(remaining / 60) + " min");
    return { big: "Arrivo tra " + t, small: "Stiamo arrivando da " + name };
  }

  function deliveryLine(p) {
    var L = [
      "Il tuo " + p.title + " è atterrato. Non esiste, ma che soddisfazione.",
      p.title + " consegnato dal corriere immaginario. 0,00 € spesi.",
      "Pacco aperto: dentro c’era pura dopamina, e zero addebiti.",
      "Ta-daaa! Il tuo " + p.title + " è “tuo”. Il conto ringrazia.",
      p.title + " recapitato in un universo dove hai risparmiato tutto.",
      "Scartato. Il " + p.title + " era bellissimo… per 0,3 secondi di pura gioia.",
      "Consegna riuscita: hai provato l’ebbrezza, il portafoglio non se n’è accorto.",
      "Il " + p.title + " ora vive nella tua immaginazione, rent-free."
    ];
    return L[Math.floor(Math.random() * L.length)];
  }
  function fmtDate(ts) {
    return new Date(ts).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  DC.views.track = function (root, params) {
    clearTimers();
    var o = DC.store.getOrder(params.id);
    if (!o) { root.innerHTML = DC.emptyBox("package", "Ordine non trovato"); return; }
    render(root, o);
    schedule(root, o);
  };

  function render(root, o) {
    var first = DC.store.productById(o.items[0].productId);
    var aff = DC.affiliateUrl(first);

    root.innerHTML =
      '<button class="backbtn" id="back">' + DC.icon("chevronLeft") + ' Ordini</button>' +
      '<div class="h1">Il tuo pacco</div>' +
      '<div class="eta" id="eta"></div>' +
      '<div class="tracker-map">' +
        '<svg class="map-svg" viewBox="0 0 320 200" preserveAspectRatio="none" aria-hidden="true">' +
          '<path id="roadPath" d="M16,170 C 72,170 60,86 132,92 S 246,150 306,50" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 12"/>' +
        '</svg>' +
        '<span class="lm" style="left:24%;top:33%">' + DC.icon("home") + '</span>' +
        '<span class="lm tree" style="left:46%;top:74%"></span>' +
        '<span class="lm" style="left:66%;top:40%">' + DC.icon("home") + '</span>' +
        '<span class="lm tree" style="left:82%;top:78%"></span>' +
        '<span class="dest">' + DC.icon("home") + '</span>' +
        '<div class="courier" id="courier">' + DC.icon("truck") + '</div>' +
      '</div>' +

      '<div class="timeline" id="timeline">' +
        DC.ORDER_STATES.map(function (st, i) {
          return '<div class="tl" id="tl-' + i + '"><div class="dot">' + DC.icon(st.icon) + '</div>' +
            '<div class="tl-body"><div class="tl-title">' + st.label + '</div><div class="tl-time" id="tlt-' + i + '"></div></div></div>';
        }).join("") +
      '</div>' +

      '<div class="affiliate">' +
        '<div class="head">' + DC.icon("sparkles") + 'Ti è scattata la voglia per davvero?</div>' +
        '<a class="btn btn-action btn-block" href="' + aff + '" target="_blank" rel="sponsored nofollow noopener" id="affBtn">' + DC.icon("cart") + ' Compralo su Amazon</a>' +
        '<div class="disc-label">In qualità di Affiliato Amazon, DopaCart riceve un guadagno dagli acquisti idonei · link affiliato</div>' +
      '</div>';

    root.querySelector("#back").addEventListener("click", function () { clearTimers(); DC.go("#/orders"); });
    root.querySelector("#affBtn").addEventListener("click", function () { DC.fx.sound.tap(); });
    updateView(root, o);
  }

  function updateView(root, o) {
    var eta = etaText(o), etaEl = root.querySelector("#eta");
    if (etaEl) etaEl.innerHTML = '<div class="big">' + eta.big + '</div><small>' + eta.small + '</small>';
    var courier = root.querySelector("#courier");
    if (courier) {
      courier.innerHTML = DC.icon(o.delivered ? "checkCircle" : "truck");
      var path = root.querySelector("#roadPath");
      if (path && path.getTotalLength) {
        var pt = path.getPointAtLength(path.getTotalLength() * (o.stateIndex / LAST()));
        courier.style.left = (pt.x / 320 * 100) + "%";
        courier.style.top = (pt.y / 200 * 100) + "%";
      } else {
        courier.style.left = (9 + (o.stateIndex / LAST()) * 78) + "%";
      }
    }
    for (var i = 0; i <= LAST(); i++) {
      var row = root.querySelector("#tl-" + i); if (!row) continue;
      row.className = "tl " + (i < o.stateIndex ? "done" : i === o.stateIndex ? (o.delivered ? "done" : "active") : "pending");
      var tEntry = o.timeline.find(function (t) { return t.state === DC.ORDER_STATES[i].id; });
      var tt = root.querySelector("#tlt-" + i);
      if (tt) tt.textContent = tEntry ? new Date(tEntry.at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
    }
  }

  function schedule(root, o) {
    var elapsed = Date.now() - o.createdAt, idx = 0;
    for (var i = 0; i <= LAST(); i++) if (elapsed >= o.offsets[i]) idx = i;
    if (idx > o.stateIndex) DC.store.setOrderIndex(o.id, idx);
    updateView(root, o);
    if (o.stateIndex >= LAST()) { grant(o, true); return; }
    for (var j = o.stateIndex + 1; j <= LAST(); j++) {
      (function (target) {
        var delay = Math.max(0, o.offsets[target] - (Date.now() - o.createdAt));
        timers.push(setTimeout(function () { advance(root, o, target); }, delay));
      })(j);
    }
  }

  function advance(root, o, target) {
    DC.store.setOrderIndex(o.id, target);
    var st = DC.ORDER_STATES[target];
    updateView(root, o);
    if (st.id === "IN_CONSEGNA") {
      DC.fx.sound.pop(); DC.fx.buzz.strong();
      DC.fx.toast("Il tuo pacco è IN CONSEGNA!", { win: true, icon: "mapPin", ms: 2200 });
    } else if (st.id === "CONSEGNATO") {
      grant(o, false);
    } else {
      DC.fx.sound.tap(); DC.fx.buzz.light();
      DC.fx.toast(st.label, { icon: st.icon, ms: 1500 });
    }
  }

  function grant(o, silent) {
    var res = DC.rewards.grantForDelivery(o);
    DC.refreshNav();
    if (silent || !res.granted) return;
    var first = DC.store.productById(o.items[0].productId);
    DC.fx.buzz.win();
    DC.fx.reveal({
      icon: DC.iconFor(first), title: "Consegnato!",
      sub: deliveryLine(first) + " · +" + res.xp + " XP · risparmiati " + DC.fx.euro(res.saved),
      variant: "reward", ms: 3400,
      onClose: function () {
        if (res.leveledUp) { DC.fx.sound.levelup(); DC.fx.toast("Livello " + res.level + "!", { win: true, icon: "trophy", ms: 2200 }); }
        res.newBadges.forEach(function (b, i) { setTimeout(function () { DC.fx.toast("Badge: " + b, { icon: "trophy", ms: 2000 }); }, 300 + i * 700); });
      }
    });
  }

  /* —— Vista ORDINI —— */
  DC.views.orders = function (root) {
    var orders = DC.store.state.orders;
    if (!orders.length) {
      root.innerHTML = '<div class="h1">Ordini</div>' +
        '<div class="empty"><div class="em">' + DC.icon("package") + '</div><div class="et">Nessun ordine</div>' +
        '<p>Fai il tuo primo finto ordine e segui il pacco in arrivo.</p>' +
        '<div style="margin-top:var(--sp-5)"><button class="btn btn-action" id="go">' + DC.icon("grid") + ' Inizia</button></div></div>';
      var g = root.querySelector("#go"); if (g) g.addEventListener("click", function () { DC.go("#/catalog"); });
      return;
    }
    root.innerHTML = '<div class="h1">Ordini</div><div style="margin-top:var(--sp-4)">' +
      orders.map(function (o) {
        var st = DC.ORDER_STATES[o.stateIndex];
        var first = DC.store.productById(o.items[0].productId);
        return '<div class="cart-item" data-go="' + o.id + '">' +
          '<div class="ci-thumb" style="--h:' + (first ? first.hue : 280) + '">' + DC.icon(o.delivered ? "checkCircle" : st.icon) + '</div>' +
          '<div class="ci-body"><div class="ci-title">' + o.items.length + (o.items.length === 1 ? ' articolo' : ' articoli') + ' · ' + DC.fx.euro(o.total) + '</div>' +
          '<div class="tl-time">' + (o.delivered ? "Consegnato" : st.label) + ' · ' + fmtDate(o.createdAt) + '</div></div>' +
          DC.icon("chevronRight") + '</div>';
      }).join("") + '</div>';
    root.querySelectorAll("[data-go]").forEach(function (el) {
      el.addEventListener("click", function () { DC.go("#/track/" + el.dataset.go); });
    });
  };
})();
