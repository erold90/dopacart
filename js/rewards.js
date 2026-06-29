/* DopaCart — rewards: macro-reward alla consegna, badge, scatola mistero, vista Profilo. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  DC.BADGES = [
    { id: "primo-ordine", emoji: "🛍️", name: "Primo ordine" },
    { id: "streak-3",     emoji: "🔥", name: "Streak 3" },
    { id: "streak-7",     emoji: "⚡", name: "Streak 7" },
    { id: "notturno",     emoji: "🌙", name: "Notturno" },
    { id: "risparmiatore",emoji: "💸", name: "Risparmiatore" },
    { id: "collezionista",emoji: "🏆", name: "Collezionista" },
    { id: "fortunato",    emoji: "🎁", name: "Fortunato" },
    { id: "livello-5",    emoji: "⭐", name: "Livello 5" }
  ];
  function badgeName(id) { var b = DC.BADGES.find(function (x) { return x.id === id; }); return b ? b.name : id; }

  /* —— Macro-reward alla consegna (idempotente) —— */
  function grantForDelivery(order) {
    if (order.rewarded) return { granted: false };
    order.rewarded = true; DC.store.save();

    var xpGain = 10 + order.items.length;            // un po' di XP per ordine
    var lvl = DC.store.addXp(xpGain);
    var streak = DC.store.touchStreak();
    DC.store.addSavings(order.total);

    var newBadges = [];
    function tryBadge(id, cond) { if (cond && DC.store.addBadge(id)) newBadges.push(badgeName(id)); }
    var delivered = DC.store.state.orders.filter(function (o) { return o.delivered; }).length;
    var hour = new Date().getHours();

    tryBadge("primo-ordine", true);
    tryBadge("streak-3", streak.count >= 3);
    tryBadge("streak-7", streak.count >= 7);
    tryBadge("notturno", hour >= 22 || hour < 6);
    tryBadge("risparmiatore", DC.store.state.profile.savings.totalFake >= 500);
    tryBadge("collezionista", delivered >= 5);
    tryBadge("livello-5", lvl.level >= 5);

    return {
      granted: true, xp: xpGain, saved: order.total,
      leveledUp: lvl.leveledUp, level: lvl.level,
      streak: streak.count, newBadges: newBadges
    };
  }
  DC.rewards = { grantForDelivery: grantForDelivery };

  /* —— Scatola mistero (1/giorno, rapporto variabile) —— */
  DC.openMystery = function (el) {
    if (!DC.store.canOpenMystery()) { DC.fx.toast("Torna domani per un'altra sorpresa 🎁"); return; }
    if (el) el.classList.add("shake");
    DC.fx.sound.pop(); DC.fx.buzz.medium();

    var rewards = [
      { xp: 15, msg: "+15 XP a sorpresa!" },
      { xp: 25, msg: "+25 XP, che fortuna!" },
      { xp: 40, msg: "Jackpot: +40 XP! 🤑" },
      { xp: 10, msg: "+10 XP, ci sta!" }
    ];
    var r = rewards[Math.floor(Math.random() * rewards.length)];

    setTimeout(function () {
      DC.store.markMystery();
      var lvl = DC.store.addXp(r.xp);
      DC.store.addBadge("fortunato");
      DC.fx.confetti({ count: 110 });
      DC.fx.sound.success(); DC.fx.buzz.win();
      DC.fx.toast("🎁 " + r.msg, { win: true, ms: 2200 });
      DC.refreshNav();
      if (lvl.leveledUp) setTimeout(function () { DC.fx.sound.levelup(); DC.fx.toast("🏆 Livello " + lvl.level + "!", { win: true }); }, 800);
      setTimeout(function () { DC.refresh(); }, 1200);
    }, DC.fx.reduced ? 0 : 480);
  };

  /* —— Vista PROFILO —— */
  DC.views.profile = function (root) {
    var s = DC.store, p = s.state.profile, sp = s.xpProgress();
    var delivered = s.state.orders.filter(function (o) { return o.delivered; }).length;

    root.innerHTML =
      '<div class="h1">Profilo</div>' +

      '<div class="level-card"><div style="opacity:.9;font-weight:600">Livello</div>' +
        '<div class="lvl tnum">' + sp.level + '</div>' +
        '<div class="xpbar"><div class="fill" style="width:' + sp.pct + '%"></div></div>' +
        '<div style="font-size:var(--fs-sm);opacity:.9;margin-top:6px" class="tnum">' + sp.into + ' / ' + sp.need + ' XP al livello ' + (sp.level + 1) + '</div>' +
      '</div>' +

      (s.canOpenMystery() ?
        '<div class="mystery" id="profMystery"><div class="box">🎁</div>' +
          '<div style="font-weight:800;font-size:var(--fs-lg);margin-top:6px">Scatola mistero</div>' +
          '<div style="opacity:.9;font-size:var(--fs-sm)">Disponibile! Toccala</div></div>' : '') +

      '<div class="stat-row">' +
        '<div class="stat"><div class="big tnum">' + p.streak.count + ' 🔥</div><div class="lbl">Streak giorni</div></div>' +
        '<div class="stat"><div class="big tnum">' + delivered + '</div><div class="lbl">Pacchi ricevuti</div></div>' +
      '</div>' +
      '<div class="stat-row">' +
        '<div class="stat savings"><div class="big tnum">' + DC.fx.euro(p.savings.monthFake) + '</div><div class="lbl">Risparmiati questo mese</div></div>' +
        '<div class="stat savings"><div class="big tnum">' + DC.fx.euro(p.savings.totalFake) + '</div><div class="lbl">Risparmiati in totale</div></div>' +
      '</div>' +

      '<div class="section-title">Collezione badge</div>' +
      '<div class="badges">' + DC.BADGES.map(function (b) {
        var owned = s.hasBadge(b.id);
        return '<div class="bdg' + (owned ? '' : ' locked') + '" title="' + b.name + '">' + b.emoji +
          '<span class="nm">' + b.name + '</span></div>';
      }).join("") + '</div>' +

      '<div class="section-title">Impostazioni</div>' +
      '<div class="cart-summary">' +
        toggleRow("sound", "🔊 Suoni", p.settings ? p.settings.sound : s.state.settings.sound) +
        toggleRow("haptics", "📳 Vibrazione", s.state.settings.haptics) +
      '</div>' +
      '<div class="disclaimer">DopaCart è intrattenimento a costo zero. Nessun dato lascia il tuo telefono.</div>';

    var pm = root.querySelector("#profMystery");
    if (pm) pm.addEventListener("click", function () { DC.openMystery(pm); });

    root.querySelectorAll("[data-toggle]").forEach(function (t) {
      t.addEventListener("click", function () {
        var k = t.dataset.toggle;
        s.state.settings[k] = !s.state.settings[k]; s.save();
        DC.fx.sound.tap();
        DC.views.profile(root);
      });
    });
  };

  function toggleRow(key, label, on) {
    return '<div class="cart-row"><span>' + label + '</span>' +
      '<button data-toggle="' + key + '" class="chip" aria-pressed="' + !!on + '">' + (on ? "Attivo" : "Off") + '</button></div>';
  }
})();
