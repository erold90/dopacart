/* DopaCart — store: stato + persistenza localStorage. Nessun dato personale, nessun server. */
window.DC = window.DC || {};
(function () {
  var KEY = "dopacart.v1";

  DC.ORDER_STATES = [
    { id: "CONFERMATO",     label: "Ordine confermato",  icon: "checkCircle" },
    { id: "IN_PREPARAZIONE",label: "In preparazione",    icon: "package" },
    { id: "SPEDITO",        label: "Spedito",            icon: "boxes" },
    { id: "IN_TRANSITO",    label: "In transito",        icon: "truck" },
    { id: "IN_CONSEGNA",    label: "In consegna!",       icon: "mapPin" },
    { id: "CONSEGNATO",     label: "Consegnato",         icon: "party" }
  ];

  function todayStr() { var d = new Date(); return d.toISOString().slice(0, 10); }
  function monthStr() { return new Date().toISOString().slice(0, 7); }

  var defaults = {
    cart: [],
    orders: [],
    recent: [],
    wishlist: [],
    profile: {
      xp: 0, badges: [],
      streak: { count: 0, lastDay: null },
      savings: { month: monthStr(), monthFake: 0, totalFake: 0 },
      addresses: [], defaultAddressId: null,
      payment: { method: "card", cardId: "dopacard" }
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
      s.cart = s.cart || []; s.orders = s.orders || []; s.recent = s.recent || []; s.wishlist = s.wishlist || [];
      return s;
    } catch (e) { return JSON.parse(JSON.stringify(defaults)); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} if (window.DC && DC.sync) DC.sync.markDirty(); }

  function productById(id) { return DC.catalog.products.find(function (p) { return p.id === id; }); }

  /* —— Visti di recente —— */
  function addRecent(id) {
    state.recent = state.recent.filter(function (x) { return x !== id; });
    state.recent.unshift(id);
    if (state.recent.length > 12) state.recent = state.recent.slice(0, 12);
    save();
  }

  /* —— Preferiti (wishlist) —— */
  function toggleWishlist(id) {
    var i = state.wishlist.indexOf(id);
    if (i >= 0) state.wishlist.splice(i, 1); else state.wishlist.unshift(id);
    save(); return i < 0;
  }
  function inWishlist(id) { return state.wishlist.indexOf(id) >= 0; }
  function wishlistCount() { return state.wishlist.length; }

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
  function itemFrom(l) { var p = productById(l.productId); return { productId: p.id, qty: l.qty, price: p.price, title: p.title, hue: p.hue }; }
  function buildOrder(items, ship, opts) {
    opts = opts || {};
    var sub = items.reduce(function (t, it) { return t + it.price * it.qty; }, 0);
    var discount = opts.discountAmt ? Math.min(sub, opts.discountAmt) : 0;
    var total = sub - discount;
    // consegna realistica diversa per prodotto: giorni = max dei tempi-spedizione degli articoli
    var dd = items.reduce(function (m, it) { var p = productById(it.productId); var d = (p && p.ship && p.ship.days) || 5; return Math.max(m, d); }, 1);
    var etaAt = Date.now() + dd * 86400000;
    // durata simulata del tracking PROPORZIONALE ai giorni (consegne lente = animazione più lunga), compressa in minuti
    var totalMs = Math.min(100000, Math.max(16000, 14000 + dd * 3000));
    var unit = totalMs / (DC.ORDER_STATES.length - 1);
    var schedule = DC.ORDER_STATES.map(function (s, i) { return i === 0 ? 0 : Math.round((Math.random() * 0.4 + 0.8) * unit); });
    var acc = 0, offsets = schedule.map(function (j) { acc += j; return acc; });
    var order = {
      id: "o" + Date.now(),
      items: items, total: total, discount: discount,
      ship: ship || {}, payment: opts.payment || null, deliveryDays: dd, etaAt: etaAt,
      createdAt: Date.now(),
      stateIndex: 0,
      offsets: offsets,           // ms dall'inizio per raggiungere ogni stato (compressi)
      timeline: [{ state: "CONFERMATO", at: Date.now() }],
      delivered: false
    };
    state.orders.unshift(order);
    save();
    return order;
  }
  function createOrder(ship, opts) { var o = buildOrder(state.cart.map(itemFrom), ship, opts); clearCart(); return o; }
  function buyNow(productId, ship, opts) {
    var p = productById(productId); if (!p) return null;
    return buildOrder([{ productId: p.id, qty: 1, price: p.price, title: p.title, hue: p.hue }], ship, opts);
  }

  /* —— Rubrica indirizzi —— */
  function touchWallet() { state.profile.walletUpdatedAt = Date.now(); }
  function addresses() { return state.profile.addresses; }
  function defaultAddress() {
    var a = state.profile.addresses;
    return a.find(function (x) { return x.id === state.profile.defaultAddressId; }) || a[0] || null;
  }
  function saveAddress(addr) {
    var a = state.profile.addresses;
    if (addr.id) { var i = a.findIndex(function (x) { return x.id === addr.id; }); if (i >= 0) a[i] = addr; else a.push(addr); }
    else { addr.id = "ad" + Date.now(); a.push(addr); }
    if (!state.profile.defaultAddressId) state.profile.defaultAddressId = addr.id;
    touchWallet(); save(); return addr.id;
  }
  function deleteAddress(id) {
    state.profile.addresses = state.profile.addresses.filter(function (x) { return x.id !== id; });
    if (state.profile.defaultAddressId === id) state.profile.defaultAddressId = (state.profile.addresses[0] || {}).id || null;
    touchWallet(); save();
  }
  function setDefaultAddress(id) { state.profile.defaultAddressId = id; touchWallet(); save(); }

  /* —— Pagamento —— */
  function getPayment() { return state.profile.payment; }
  function setPayment(method, cardId) { state.profile.payment = { method: method, cardId: cardId || state.profile.payment.cardId }; touchWallet(); save(); }
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
    createOrder: createOrder, buyNow: buyNow, getOrder: getOrder, activeOrder: activeOrder, setOrderIndex: setOrderIndex,
    addresses: addresses, defaultAddress: defaultAddress, saveAddress: saveAddress, deleteAddress: deleteAddress, setDefaultAddress: setDefaultAddress,
    getPayment: getPayment, setPayment: setPayment,
    xpProgress: xpProgress, addXp: addXp, levelFromXp: levelFromXp,
    touchStreak: touchStreak, addBadge: addBadge, hasBadge: hasBadge,
    addSavings: addSavings, canOpenMystery: canOpenMystery, markMystery: markMystery,
    addRecent: addRecent, toggleWishlist: toggleWishlist, inWishlist: inWishlist, wishlistCount: wishlistCount,
    todayStr: todayStr
  };
})();
