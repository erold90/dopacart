/* DopaCart — sincronizzazione stato cross-device (parla col Worker via DC.auth).
   Attiva SOLO se DC.AUTH_URL è impostato E l'utente è loggato; altrimenti dormiente (zero overhead).
   Merge conservativo: non riduce mai i progressi (XP/risparmio = max, badge/wishlist/ordini = unione). */
window.DC = window.DC || {};
(function () {
  var DEBOUNCE = 4000;
  var dirty = false, timer = null, pushing = false, pending = false;

  function base() { return (DC.AUTH_URL || "").replace(/\/$/, ""); }
  function tokenOf() { var s = DC.auth && DC.auth.sess && DC.auth.sess(); return s && s.token; }
  function active() { return !!(base() && tokenOf()); }

  async function apiGet() {
    var res = await fetch(base() + "/state", { headers: { "Authorization": "Bearer " + tokenOf() } });
    if (!res.ok) throw new Error("state_get " + res.status);
    var d = await res.json();
    return d.state || null;
  }
  async function apiPut(state, keepalive) {
    var res = await fetch(base() + "/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + tokenOf() },
      body: JSON.stringify({ state: state }),
      keepalive: !!keepalive
    });
    if (!res.ok) throw new Error("state_put " + res.status);
  }

  /* —— Merge conservativo —— */
  function unionIds(a, b) { var out = [], seen = {}; (a || []).concat(b || []).forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(id); } }); return out; }
  function pickStreak(a, b) {
    a = a || { count: 0, lastDay: null }; b = b || { count: 0, lastDay: null };
    if ((a.lastDay || "") === (b.lastDay || "")) return (a.count || 0) >= (b.count || 0) ? a : b;
    return (a.lastDay || "") > (b.lastDay || "") ? a : b;
  }
  function mergeSavings(a, b) {
    a = a || {}; b = b || {};
    var out = { month: a.month || b.month || "", monthFake: 0, totalFake: Math.max(a.totalFake || 0, b.totalFake || 0) };
    if ((a.month || "") === (b.month || "")) { out.month = a.month || b.month || ""; out.monthFake = Math.max(a.monthFake || 0, b.monthFake || 0); }
    else if ((a.month || "") >= (b.month || "")) { out.month = a.month; out.monthFake = a.monthFake || 0; }
    else { out.month = b.month; out.monthFake = b.monthFake || 0; }
    return out;
  }
  function mergeOrders(a, b) {
    var byId = {}, order = [];
    (a || []).concat(b || []).forEach(function (o) { if (o && o.id != null && !byId[o.id]) { byId[o.id] = o; order.push(o); } });
    order.sort(function (x, y) { return (y.createdAt || 0) - (x.createdAt || 0); });
    return order.slice(0, 60);
  }
  function mergeCart(a, b) {
    var byId = {};
    (a || []).forEach(function (l) { if (l && l.productId != null) byId[l.productId] = { productId: l.productId, qty: l.qty || 1 }; });
    (b || []).forEach(function (l) {
      if (!l || l.productId == null) return;
      if (byId[l.productId]) byId[l.productId].qty = Math.max(byId[l.productId].qty, l.qty || 1);
      else byId[l.productId] = { productId: l.productId, qty: l.qty || 1 };
    });
    return Object.keys(byId).map(function (k) { return byId[k]; });
  }
  function maxDay(a, b) { if (!a) return b || null; if (!b) return a; return a > b ? a : b; }
  function mergeAddresses(a, b, srvNewer) {
    var byId = {}, order = [];
    // primo il lato "vincente" così sui duplicati per id prevale il più recente
    (srvNewer ? (b || []).concat(a || []) : (a || []).concat(b || [])).forEach(function (x) {
      if (x && x.id && !byId[x.id]) { byId[x.id] = x; order.push(x); }
    });
    return order.slice(0, 30);
  }

  function merge(local, server) {
    if (!server) return local;
    var out = JSON.parse(JSON.stringify(local));
    var lp = local.profile || {}, sp = server.profile || {};
    out.profile = out.profile || {};
    out.profile.xp = Math.max(lp.xp || 0, sp.xp || 0);
    out.profile.badges = unionIds(lp.badges, sp.badges);
    out.profile.streak = pickStreak(lp.streak, sp.streak);
    out.profile.savings = mergeSavings(lp.savings, sp.savings);
    out.profile.name = lp.name || sp.name || out.profile.name;
    // wallet: unione indirizzi (mai persi); predefinito/pagamento dal lato modificato più di recente
    var lw = lp.walletUpdatedAt || 0, sw = sp.walletUpdatedAt || 0, srvNewer = sw > lw;
    out.profile.addresses = mergeAddresses(lp.addresses, sp.addresses, srvNewer);
    out.profile.walletUpdatedAt = Math.max(lw, sw);
    out.profile.defaultAddressId = srvNewer ? (sp.defaultAddressId || lp.defaultAddressId) : (lp.defaultAddressId || sp.defaultAddressId);
    out.profile.payment = srvNewer ? (sp.payment || lp.payment) : (lp.payment || sp.payment);
    var ids = out.profile.addresses.map(function (a) { return a.id; });
    if (out.profile.defaultAddressId && ids.indexOf(out.profile.defaultAddressId) < 0) out.profile.defaultAddressId = ids[0] || null;
    out.wishlist = unionIds(local.wishlist, server.wishlist).slice(0, 200);
    out.recent = unionIds(local.recent, server.recent).slice(0, 12);
    out.orders = mergeOrders(local.orders, server.orders);
    out.cart = mergeCart(local.cart, server.cart);
    out.seenOnboarding = !!(local.seenOnboarding || server.seenOnboarding);
    out.variable = out.variable || {};
    out.variable.lastMysteryDay = maxDay(local.variable && local.variable.lastMysteryDay, server.variable && server.variable.lastMysteryDay);
    out.settings = local.settings || server.settings; // il dispositivo locale ha priorità sulle preferenze
    return out;
  }

  function applyMerged(merged) {
    var st = DC.store.state;
    Object.keys(merged).forEach(function (k) { st[k] = merged[k]; });
    DC.store.save();
  }

  async function doPush(keepalive) {
    if (!active()) return;
    if (pushing) { pending = true; return; }
    pushing = true; dirty = false;
    try { await apiPut(DC.store.state, keepalive); }
    catch (e) { dirty = true; }
    finally { pushing = false; if (pending) { pending = false; schedule(); } }
  }
  function schedule() {
    if (!active()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; doPush(false); }, DEBOUNCE);
  }

  // Chiamato da DC.store.save() a ogni mutazione: accumula e pusha in modo debounced
  function markDirty() { if (!active()) return; dirty = true; schedule(); }

  // Login: scarica lo stato del server, fondi (unione), risalva, ricarica l'unione sul server
  async function onLogin() {
    if (!active()) return;
    try {
      var server = await apiGet();
      if (server) applyMerged(merge(DC.store.state, server));
      await doPush(false);
    } catch (e) { /* silenzioso: se offline/server ko il sito funziona comunque in locale */ }
  }

  // Boot: se già loggato, sincronizza all'avvio e ridisegna
  async function start() {
    if (active()) {
      try {
        var server = await apiGet();
        if (server) { applyMerged(merge(DC.store.state, server)); if (DC.refresh) DC.refresh(); }
        await doPush(false);
      } catch (e) {}
    }
    // flush all'uscita (best-effort con keepalive)
    window.addEventListener("pagehide", function () { if (dirty && active()) doPush(true); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && dirty && active()) doPush(true); });
  }

  DC.sync = { markDirty: markDirty, onLogin: onLogin, start: start, active: active };
})();
