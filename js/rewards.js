/* DopaCart — rewards: macro-reward alla consegna, badge, scatola mistero, vista Profilo. */
window.DC = window.DC || {};
DC.views = DC.views || {};
(function () {
  DC.BADGES = [
    { id: "primo-ordine", icon: "cart",   name: "Primo ordine" },
    { id: "streak-3",     icon: "flame",  name: "Streak 3" },
    { id: "streak-7",     icon: "zap",    name: "Streak 7" },
    { id: "notturno",     icon: "moon",   name: "Notturno" },
    { id: "risparmiatore",icon: "piggy",  name: "Risparmio" },
    { id: "collezionista",icon: "trophy", name: "Collezione" },
    { id: "fortunato",    icon: "gift",   name: "Fortunato" },
    { id: "livello-5",    icon: "star",   name: "Livello 5" }
  ];
  function badgeName(id) { var b = DC.BADGES.find(function (x) { return x.id === id; }); return b ? b.name : id; }

  function grantForDelivery(order) {
    if (order.rewarded) return { granted: false };
    order.rewarded = true; DC.store.save();

    var xpGain = 10 + order.items.length;
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

    return { granted: true, xp: xpGain, saved: order.total, leveledUp: lvl.leveledUp, level: lvl.level, streak: streak.count, newBadges: newBadges };
  }
  DC.rewards = { grantForDelivery: grantForDelivery };

  DC.openMystery = function (el) {
    if (!DC.store.canOpenMystery()) { DC.fx.toast("Torna domani per un'altra sorpresa", { icon: "gift" }); return; }
    if (el) el.classList.add("shake");
    DC.fx.sound.pop(); DC.fx.buzz.medium();
    var rewards = [{ xp: 15, msg: "Niente male, dai." }, { xp: 25, msg: "Che fortuna!" }, { xp: 40, msg: "Jackpot assoluto!" }, { xp: 10, msg: "Ci sta, si riparte." }];
    var r = rewards[Math.floor(Math.random() * rewards.length)];
    setTimeout(function () {
      DC.store.markMystery();
      var lvl = DC.store.addXp(r.xp);
      DC.store.addBadge("fortunato");
      DC.fx.buzz.win();
      DC.refreshNav();
      DC.fx.reveal({
        icon: "gift", title: "+" + r.xp + " XP", sub: r.msg, variant: "warm",
        onClose: function () {
          if (lvl.leveledUp) { DC.fx.sound.levelup(); DC.fx.toast("Livello " + lvl.level + "!", { win: true, icon: "trophy" }); }
          DC.refresh();
        }
      });
    }, DC.fx.reduced ? 0 : 480);
  };

  DC.views.profile = function (root) {
    var s = DC.store, p = s.state.profile, sp = s.xpProgress();
    var delivered = s.state.orders.filter(function (o) { return o.delivered; }).length;

    root.innerHTML =
      '<div class="h1">Profilo</div>' +
      '<div class="level-card"><div class="cap">Livello</div><div class="lvl tnum">' + sp.level + '</div>' +
        '<div class="xpbar"><div class="fill" style="width:' + sp.pct + '%"></div></div>' +
        '<div class="xp-meta tnum">' + sp.into + ' / ' + sp.need + ' XP al livello ' + (sp.level + 1) + '</div></div>' +

      (s.canOpenMystery() ?
        '<div class="mystery" id="profMystery"><div class="box">' + DC.icon("gift") + '</div>' +
          '<div class="mt">Scatola mistero</div><div class="ms">Disponibile! Toccala</div></div>' : '') +

      '<div class="stat-row">' +
        '<div class="stat streak"><div class="ico-top">' + DC.icon("flame") + ' Streak</div><div class="big tnum js-count" data-to="' + p.streak.count + '" data-fmt="int">0</div></div>' +
        '<div class="stat"><div class="ico-top">' + DC.icon("package") + ' Pacchi</div><div class="big tnum js-count" data-to="' + delivered + '" data-fmt="int">0</div></div>' +
      '</div>' +
      '<div class="stat-row">' +
        '<div class="stat savings"><div class="ico-top">' + DC.icon("piggy") + ' Questo mese</div><div class="big tnum js-count" data-to="' + p.savings.monthFake + '" data-fmt="eur">' + DC.fx.euro(0) + '</div></div>' +
        '<div class="stat savings"><div class="ico-top">' + DC.icon("wallet") + ' In totale</div><div class="big tnum js-count" data-to="' + p.savings.totalFake + '" data-fmt="eur">' + DC.fx.euro(0) + '</div></div>' +
      '</div>' +

      '<div class="section-title">' + DC.icon("trophy") + 'Collezione badge</div>' +
      '<div class="badges">' + DC.BADGES.map(function (b) {
        var owned = s.hasBadge(b.id);
        return '<div class="bdg ' + (owned ? "owned" : "locked") + '" title="' + b.name + '">' + DC.icon(b.icon) + '<span class="nm">' + b.name + '</span></div>';
      }).join("") + '</div>' +

      '<div class="section-title">' + DC.icon("user") + 'Account</div>' +
      '<div class="settings-card" id="acctCard"></div>' +
      '<div class="section-title">' + DC.icon("settings") + 'Impostazioni</div>' +
      '<div class="settings-card">' +
        toggleRow("sound", "Suoni", s.state.settings.sound) +
        toggleRow("haptics", "Vibrazione", s.state.settings.haptics) +
      '</div>' +
      '<div class="disclaimer">DopaCart è intrattenimento a costo zero. Buono shopping (finto).</div>';

    var pm = root.querySelector("#profMystery");
    if (pm) pm.addEventListener("click", function () { DC.openMystery(pm); });
    root.querySelectorAll("[data-toggle]").forEach(function (t) {
      t.addEventListener("click", function () {
        var k = t.dataset.toggle; s.state.settings[k] = !s.state.settings[k]; s.save(); DC.fx.sound.tap(); DC.views.profile(root);
      });
    });

    // —— Account (passwordless via email) ——
    var acct = root.querySelector("#acctCard");
    if (acct && DC.auth) {
      if (DC.auth.isLoggedIn()) {
        var ss = DC.auth.sess();
        acct.innerHTML = '<div class="cart-row" style="padding:var(--sp-3) 0"><span><b>' + (ss.name || "Account") +
          '</b><br><span class="sub" style="font-size:var(--fs-xs)">' + ss.email + '</span></span>' +
          '<button class="chip" id="logout">Esci</button></div>';
        acct.querySelector("#logout").addEventListener("click", function () { DC.auth.logout(); DC.fx.sound.tap(); DC.fx.toast("Disconnesso", { icon: "user" }); DC.views.profile(root); });
      } else if (DC.auth.enabled()) {
        acct.innerHTML = '<div style="padding:var(--sp-2) 0"><button class="btn btn-action btn-block" id="login">' + DC.icon("user") + ' Accedi / Registrati</button>' +
          '<div class="disclaimer" style="margin-top:var(--sp-2)">Senza password: ti mandiamo un codice via email. I tuoi ordini ti seguono.</div></div>';
        acct.querySelector("#login").addEventListener("click", function () { DC.auth.open(); });
      } else {
        acct.innerHTML = '<div class="disclaimer" style="padding:var(--sp-3) 0">Accesso via email in arrivo.</div>';
      }
    }

    root.querySelectorAll(".js-count").forEach(function (el) {
      var to = parseFloat(el.dataset.to) || 0;
      if (el.dataset.fmt === "eur") DC.fx.countUp(el, to, function (v) { return DC.fx.euro(v); });
      else DC.fx.countUp(el, to);
    });
  };

  function toggleRow(key, label, on) {
    return '<div class="cart-row" style="padding:var(--sp-3) 0"><span style="font-weight:600">' + label + '</span>' +
      '<button data-toggle="' + key + '" class="chip" role="switch" aria-checked="' + !!on + '" aria-label="' + label + '">' + (on ? "Attivo" : "Off") + '</button></div>';
  }
})();
