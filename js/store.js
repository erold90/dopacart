/* DopaCart — store: stato + persistenza localStorage. Nessun dato personale, nessun server. */
window.DC = window.DC || {};
(function () {
  var KEY = "dopacart.v1";

  DC.ORDER_STATES = [
    { id: "CONFERMATO",     label: "Ordine confermato",  emoji: "✅" },
    { id: "IN_PREPARAZIONE",label: "In preparazione",    emoji: "📦" },
    { id: "SPEDITO",        label: "Spedito",            emoji: "🚚" },
    { id: "IN_TRANSITO",    label: "In transito",        emoji: "🛣️" },
    { id: "IN_CONSEGNA",    label: "In consegna!",       emoji: "📍" },
    { id: "CONSEGNATO",     label: "Consegnato",         emoji: "🎉" }
  ];

  function todayStr() { var d = new Date(); return d.toISOString().slice(0, 10); }
  function monthStr() { return new Date().toISOString().slice(0, 7); }

  var defaults = {
    cart: [],
    orders: [],
    profile: {
      xp: 0, badges: [],
      streak: { count: 0, lastDay: null },
      savings: { month: monthStr(), monthFake: 0, totalFake: 0 }
    },
    settings: { sound: true, haptics: true },
    variable: { lastMysteryDay: null },
    seenOnboarding: false
  };

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaults));
      var s = JSON.parse(raw);
      // merge difensivo con i default
      s.profile = Object.assign({}, defaults.profile, s.profile);
      s.profile.streak = Object.assign({}, defaults.profile.streak, s.profile.streak);
      s.profile.savings = Object.assign({}, defaults.profile.savings, s.profile.savings);
      s.settings = Object.assign({}, defaults.settings, s.settings);
      s.variable = Object.assign({}, defaults.variable, s.variable);
      s.cart = s.cart || []; s.orders = s.orders || [];
      return s;
    } catch (e) { return JSON.parse(JSON.stringify(defaults)); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function productById(id) { return DC.catalog.products.find(function (p) { return p.id === id; }); }

  /* —— Carrello —— */
  function addToCart(id) {
    var line = state.cart.find(function (l) { return l.productId === id; });
    if (line) line.qty++; else state.cart.push({ productId: id, qty: 1 });
    save();
  }
  function setQty(id, qty) {
    var i = state.cart.findIndex(function (l) { return l.productId === id; });
    if (i < 0) return;
    if (qty <= 0) state.cart.splice(i, 1); else state.cart[i].qty = qty;
    save();
  }
  function clearCart() { state.cart = []; save(); }
  function cartCount() { return state.cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function cartTotal() {
    return state.cart.reduce(function (t, l) {
      var p = productById(l.productId); return t + (p ? p.price * l.qty : 0);
    }, 0);
  }

  /* —— Ordini —— */
  function createOrder() {
    var items = state.cart.map(function (l) {
      var p = productById(l.productId);
      return { productId: p.id, qty: l.qty, price: p.price, title: p.title, emoji: p.emoji, hue: p.hue };
    });
    var total = cartTotal();
    // tempi compressi e leggermente variabili (rapporto variabile) — offset dallo "createdAt"
    var base = [0, 1, 2, 3, 4, 5];
    var unit = 12000; // 12s per step (MVP: anticipazione senza annoiare)
    var schedule = DC.ORDER_STATES.map(function (s, i) {
      var jitter = i === 0 ? 0 : Math.round((Math.random() * 0.5 + 0.75) * unit);
      return jitter;
    });
    // cumulativo
    var acc = 0, offsets = schedule.map(function (j) { acc += j; return acc; });
    var order = {
      id: "o" + Date.now(),
      items: items, total: total,
      createdAt: Date.now(),
      stateIndex: 0,
      offsets: offsets,           // ms dall'inizio per raggiungere ogni stato
      timeline: [{ state: "CONFERMATO", at: Date.now() }],
      delivered: false
    };
    state.orders.unshift(order);
    clearCart();
    save();
    return order;
  }
  function getOrder(id) { return state.orders.find(function (o) { return o.id === id; }); }
  function activeOrder() { return state.orders.find(function (o) { return !o.delivered; }) || null; }
  function setOrderIndex(id, idx) {
    var o = getOrder(id); if (!o) return;
    o.stateIndex = idx;
    var st = DC.ORDER_STATES[idx];
    if (!o.timeline.some(function (t) { return t.state === st.id; }))
      o.timeline.push({ state: st.id, at: Date.now() });
    if (idx >= DC.ORDER_STATES.length - 1) o.delivered = true;
    save();
  }

  /* —— XP / livelli —— */
  function costForLevel(l) { return 50 + 30 * (l - 1); }          // costo per salire DA livello l
  function totalXpForLevel(l) { var t = 0; for (var k = 1; k < l; k++) t += costForLevel(k); return t; }
  function levelFromXp(xp) { var l = 1; while (xp >= totalXpForLevel(l + 1)) l++; return l; }
  function xpProgress() {
    var xp = state.profile.xp, l = levelFromXp(xp);
    var floorXp = totalXpForLevel(l), need = costForLevel(l);
    return { level: l, into: xp - floorXp, need: need, pct: Math.min(100, Math.round((xp - floorXp) / need * 100)) };
  }
  function addXp(n) {
    var before = levelFromXp(state.profile.xp);
    state.profile.xp += n;
    var after = levelFromXp(state.profile.xp);
    save();
    return { leveledUp: after > before, level: after };
  }

  /* —— Streak —— */
  function touchStreak() {
    var s = state.profile.streak, today = todayStr();
    if (s.lastDay === today) { save(); return { count: s.count, isNew: false }; }
    var yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    s.count = (s.lastDay === yesterday) ? s.count + 1 : 1;
    s.lastDay = today;
    save();
    return { count: s.count, isNew: true };
  }

  /* —— Badge —— */
  function addBadge(id) {
    if (state.profile.badges.indexOf(id) < 0) { state.profile.badges.push(id); save(); return true; }
    return false;
  }
  function hasBadge(id) { return state.profile.badges.indexOf(id) >= 0; }

  /* —— Risparmio simulato —— */
  function addSavings(amount) {
    var sv = state.profile.savings, m = monthStr();
    if (sv.month !== m) { sv.month = m; sv.monthFake = 0; }
    sv.monthFake += amount; sv.totalFake += amount;
    save();
  }

  /* —— Scatola mistero (1/giorno) —— */
  function canOpenMystery() { return state.variable.lastMysteryDay !== todayStr(); }
  function markMystery() { state.variable.lastMysteryDay = todayStr(); save(); }

  DC.store = {
    get state() { return state; }, save: save, productById: productById,
    addToCart: addToCart, setQty: setQty, clearCart: clearCart, cartCount: cartCount, cartTotal: cartTotal,
    createOrder: createOrder, getOrder: getOrder, activeOrder: activeOrder, setOrderIndex: setOrderIndex,
    xpProgress: xpProgress, addXp: addXp, levelFromXp: levelFromXp,
    touchStreak: touchStreak, addBadge: addBadge, hasBadge: hasBadge,
    addSavings: addSavings, canOpenMystery: canOpenMystery, markMystery: markMystery,
    todayStr: todayStr
  };
})();
