/* DopaCart — Tracking del pacco (FEATURE REGINA): mappa animata + stati a cascata + notifiche distribuite.
   Lo stato si ricalcola dal tempo trascorso => riprende corretto anche riaprendo l'app. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  var timers = [];
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  DC.cleanupTrack = clearTimers; // l'app chiama questo cambiando vista

  var LAST = function () { return DC.ORDER_STATES.length - 1; };

  function couriderPct(idx) { return 10 + (idx / LAST()) * 78; }

  function etaText(o) {
    var remaining = Math.max(0, Math.round((o.offsets[LAST()] - (Date.now() - o.createdAt)) / 1000));
    if (o.delivered || remaining <= 0) return { big: "Consegnato 🎉", small: "Goditi la dopamina, a costo zero" };
    var t = remaining < 60 ? ("~" + remaining + " s") : ("~" + Math.ceil(remaining / 60) + " min");
    return { big: "Arrivo tra " + t, small: "Stiamo arrivando da te" };
  }

  /* —— Vista TRACK —— */
  DC.views.track = function (root, params) {
    clearTimers();
    var o = DC.store.getOrder(params.id);
    if (!o) { root.innerHTML = '<div class="empty"><div class="em">📦</div><div class="et">Ordine non trovato</div></div>'; return; }
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
      '<div class="tracker-map"><div class="road"></div><div class="dest">🏠</div>' +
        '<div class="courier" id="courier">🚚</div></div>' +

      '<div class="timeline" id="timeline">' +
        DC.ORDER_STATES.map(function (st, i) {
          return '<div class="tl" id="tl-' + i + '"><div class="dot">' + st.emoji + '</div>' +
            '<div class="tl-body"><div class="tl-title">' + st.label + '</div>' +
            '<div class="tl-time" id="tlt-' + i + '"></div></div></div>';
        }).join("") +
      '</div>' +

      '<div class="affiliate">' +
        '<p><span class="ico">💭</span> Ti è scattata la voglia per davvero?</p>' +
        '<a class="btn btn-action btn-block" href="' + aff + '" target="_blank" rel="sponsored nofollow noopener" id="affBtn">' +
          DC.icon("cart") + ' Compralo su Amazon</a>' +
        '<div class="disc-label">In qualità di Affiliato Amazon, DopaCart riceve un guadagno dagli acquisti idonei · link affiliato</div>' +
      '</div>';

    root.querySelector("#back").addEventListener("click", function () { clearTimers(); DC.go("#/orders"); });
    root.querySelector("#affBtn").addEventListener("click", function () { DC.fx.sound.tap(); });
    updateView(root, o);
  }

  function updateView(root, o) {
    var eta = etaText(o);
    var etaEl = root.querySelector("#eta");
    if (etaEl) etaEl.innerHTML = eta.big + '<small>' + eta.small + '</small>';
    var courier = root.querySelector("#courier");
    if (courier) { courier.style.left = couriderPct(o.stateIndex) + "%"; if (o.delivered) courier.textContent = "📬"; }

    o.timeline.forEach(function () {});
    for (var i = 0; i <= LAST(); i++) {
      var row = root.querySelector("#tl-" + i); if (!row) continue;
      row.className = "tl " + (i < o.stateIndex ? "done" : i === o.stateIndex ? (o.delivered ? "done" : "active") : "pending");
      var tEntry = o.timeline.find(function (t) { return t.state === DC.ORDER_STATES[i].id; });
      var tt = root.querySelector("#tlt-" + i);
      if (tt) tt.textContent = tEntry ? new Date(tEntry.at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "";
    }
  }

  function schedule(root, o) {
    var elapsed = Date.now() - o.createdAt;
    // recupera (silenzioso) lo stato corretto in base al tempo trascorso
    var idx = 0;
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
      // PICCO: alto impatto
      DC.fx.sound.pop(); DC.fx.buzz.strong();
      DC.fx.toast("📍 Il tuo pacco è IN CONSEGNA!", { win: true, ms: 2200 });
    } else if (st.id === "CONSEGNATO") {
      grant(o, false);
    } else {
      DC.fx.sound.tap(); DC.fx.buzz.light();
      DC.fx.toast(st.emoji + " " + st.label, { ms: 1500 });
    }
  }

  function grant(o, silent) {
    var res = DC.rewards.grantForDelivery(o); // idempotente
    DC.refreshNav();
    if (silent || !res.granted) return;
    DC.fx.confetti({ count: 160 });
    DC.fx.sound.success(); DC.fx.buzz.win();
    DC.fx.toast("Consegnato! +" + res.xp + " XP · risparmiati " + DC.fx.euro(res.saved), { win: true, ms: 2400 });
    if (res.leveledUp) setTimeout(function () {
      DC.fx.sound.levelup();
      DC.fx.toast("🏆 Livello " + res.level + "!", { win: true, ms: 2200 });
    }, 900);
    res.newBadges.forEach(function (b, i) {
      setTimeout(function () { DC.fx.toast("🎖️ Badge: " + b, { ms: 2000 }); }, 1600 + i * 700);
    });
  }

  /* —— Vista ORDINI (lista) —— */
  DC.views.orders = function (root) {
    var orders = DC.store.state.orders;
    if (!orders.length) {
      root.innerHTML = '<div class="h1">Ordini</div>' +
        '<div class="empty"><div class="em">📭</div><div class="et">Nessun ordine</div>' +
        '<p>Fai il tuo primo finto ordine e segui il pacco in arrivo.</p>' +
        '<div style="margin-top:var(--sp-4)"><button class="btn btn-action" id="go">Inizia</button></div></div>';
      var g = root.querySelector("#go"); if (g) g.addEventListener("click", function () { DC.go("#/catalog"); });
      return;
    }
    root.innerHTML = '<div class="h1">Ordini</div><div style="margin-top:var(--sp-3)">' +
      orders.map(function (o) {
        var st = DC.ORDER_STATES[o.stateIndex];
        var preview = o.items.map(function (it) { return it.emoji; }).slice(0, 4).join(" ");
        return '<div class="cart-item" data-go="' + o.id + '" style="--h:280">' +
          '<div class="ci-thumb" style="font-size:24px">' + preview + '</div>' +
          '<div class="ci-body"><div class="ci-title">' + o.items.length + ' articoli · ' + DC.fx.euro(o.total) + '</div>' +
          '<div class="tl-time">' + (o.delivered ? "✅ Consegnato" : st.emoji + " " + st.label) + '</div></div>' +
          DC.icon("chevronRight") + '</div>';
      }).join("") + '</div>';
    root.querySelectorAll("[data-go]").forEach(function (el) {
      el.addEventListener("click", function () { DC.go("#/track/" + el.dataset.go); });
    });
  };
})();
