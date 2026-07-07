/* DopaCart — login passwordless via codice email (parla col Worker Cloudflare).
   IMPOSTA DC.AUTH_URL con l'URL del Worker per attivare. Vuoto = funzione dormiente. */
window.DC = window.DC || {};
DC.AUTH_URL = "https://dopacart-auth.erold90.workers.dev"; // login passwordless + sync (dominio Resend verificato)
(function () {
  var KEY = "dopacart.session";
  function sess() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function enabled() { return !!DC.AUTH_URL; }
  function isLoggedIn() { var s = sess(); return !!(s && s.token); }
  function logout() { localStorage.removeItem(KEY); }

  // "Ricorda su questo dispositivo": email già verificate → rientro senza codice (finché il token 30gg è vivo)
  var KKEY = "dopacart.known";
  function known() { try { return JSON.parse(localStorage.getItem(KKEY)) || {}; } catch (e) { return {}; } }
  function saveKnown(d) {
    if (!d || !d.email || !d.token) return;
    var k = known(); k[d.email.toLowerCase()] = { token: d.token, name: d.name, email: d.email };
    try { localStorage.setItem(KKEY, JSON.stringify(k)); } catch (e) {}
  }
  function knownFor(email) { return known()[(email || "").toLowerCase()] || null; }
  async function me(token) {
    var res = await fetch(DC.AUTH_URL.replace(/\/$/, "") + "/me", { headers: { "Authorization": "Bearer " + token } });
    if (!res.ok) throw new Error("no_session");
    return res.json();
  }

  async function api(path, payload) {
    var res = await fetch(DC.AUTH_URL.replace(/\/$/, "") + path, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.message || data.error || ("Errore " + res.status));
    return data;
  }

  function open() {
    if (!enabled()) { DC.fx.toast("Accesso non ancora configurato", { icon: "user" }); return; }
    var ov = document.createElement("div");
    ov.className = "auth-ov";
    document.body.appendChild(ov);
    var state = { step: 1, name: "", email: "" };

    function close() { ov.style.opacity = "0"; setTimeout(function () { ov.remove(); }, 250); }
    function render() {
      if (state.step === 1) {
        ov.innerHTML =
          '<div class="auth-card"><button class="auth-x" id="x">' + DC.icon("x") + '</button>' +
          '<div class="auth-h">Accedi a DopaCart</div>' +
          '<div class="auth-sub">Niente password: ti mandiamo un codice via email. I tuoi ordini ti seguono.</div>' +
          '<div class="field"><label>Nome</label><input id="a-name" value="' + esc(state.name) + '" autocomplete="name" placeholder="Come ti chiami"></div>' +
          '<div class="field"><label>Email</label><input id="a-email" type="email" value="' + esc(state.email) + '" autocomplete="email" placeholder="tu@email.it"></div>' +
          '<button class="btn btn-action btn-block btn-lg" id="send">Invia codice</button></div>';
        ov.querySelector("#send").addEventListener("click", sendCode);
      } else {
        ov.innerHTML =
          '<div class="auth-card"><button class="auth-x" id="x">' + DC.icon("x") + '</button>' +
          '<div class="auth-h">Controlla l\'email</div>' +
          '<div class="auth-sub">Codice inviato a <b>' + esc(state.email) + '</b></div>' +
          '<div class="field"><label>Codice a 6 cifre</label><input id="a-code" inputmode="numeric" maxlength="6" placeholder="••••••" style="letter-spacing:.4em;text-align:center;font-size:var(--fs-xl)"></div>' +
          '<button class="btn btn-action btn-block btn-lg" id="verify">Entra</button>' +
          '<button class="auth-link" id="back">Cambia email</button></div>';
        var ci = ov.querySelector("#a-code"); if (ci) ci.focus();
        ov.querySelector("#verify").addEventListener("click", doVerify);
        ov.querySelector("#back").addEventListener("click", function () { state.step = 1; render(); });
      }
      ov.querySelector("#x").addEventListener("click", close);
    }
    function sendCode() {
      state.name = (ov.querySelector("#a-name").value || "").trim();
      state.email = (ov.querySelector("#a-email").value || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) { DC.fx.toast("Email non valida", { icon: "x" }); return; }
      var btn = ov.querySelector("#send"); btn.disabled = true; btn.textContent = "Attendo…";
      var kn = knownFor(state.email);
      if (kn && kn.token) {
        // email nota su questo dispositivo → prova rientro istantaneo senza codice
        me(kn.token).then(function (info) {
          save({ token: kn.token, email: info.email || kn.email, name: info.name || kn.name });
          DC.store.state.profile.name = info.name || kn.name; DC.store.save();
          DC.fx.sound.success(); DC.fx.buzz.win();
          DC.fx.toast("Bentornato, " + (info.name || kn.name) + "! Niente codice stavolta.", { win: true, icon: "check" });
          close();
          if (DC.sync) DC.sync.onLogin().then(function () { DC.refresh(); }); else DC.refresh();
        }).catch(function () { doSendCode(btn); }); // token scaduto → codice
      } else {
        doSendCode(btn);
      }
    }
    function doSendCode(btn) {
      btn.textContent = "Invio…";
      api("/auth/request", { email: state.email, name: state.name || "Cliente" })
        .then(function () { DC.fx.sound.tap(); state.step = 2; render(); })
        .catch(function (e) { DC.fx.toast(e.message, { icon: "x", ms: 2600 }); btn.disabled = false; btn.textContent = "Invia codice"; });
    }
    function doVerify() {
      var code = (ov.querySelector("#a-code").value || "").trim();
      if (!/^\d{6}$/.test(code)) { DC.fx.toast("Inserisci le 6 cifre", { icon: "x" }); return; }
      var btn = ov.querySelector("#verify"); btn.disabled = true; btn.textContent = "Verifico…";
      api("/auth/verify", { email: state.email, code: code })
        .then(function (d) {
          save({ token: d.token, email: d.email, name: d.name }); saveKnown(d);
          DC.store.state.profile.name = d.name; DC.store.save();
          DC.fx.confetti({ count: 90 }); DC.fx.sound.success(); DC.fx.buzz.win();
          DC.fx.toast("Bentornato, " + d.name + "!", { win: true, icon: "check" });
          close();
          if (DC.sync) DC.sync.onLogin().then(function () { DC.refresh(); }); else DC.refresh();
        })
        .catch(function (e) { DC.fx.toast(e.message, { icon: "x", ms: 2600 }); btn.disabled = false; btn.textContent = "Entra"; });
    }
    function esc(s) { return (s || "").replace(/"/g, "&quot;"); }
    render();
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  }

  // Riusabili dal checkout (registrazione soft inline)
  function request(email, name) { return api("/auth/request", { email: email, name: name || "Cliente" }); }
  function verify(email, code) {
    return api("/auth/verify", { email: email, code: code }).then(function (d) {
      save({ token: d.token, email: d.email, name: d.name }); saveKnown(d);
      DC.store.state.profile.name = d.name; DC.store.save();
      return d;
    });
  }

  DC.auth = { sess: sess, enabled: enabled, isLoggedIn: isLoggedIn, logout: logout, open: open, request: request, verify: verify };
})();
