/* DopaCart — donazioni PayPal (tip-jar a livelli, discreto). Nessun backend: usa PayPal.me.
   IMPOSTA DC.PAYPAL_USER col tuo handle PayPal.me per attivare (es. "danielelore"). Vuoto = dormiente. */
window.DC = window.DC || {};
DC.PAYPAL_USER = ""; // es. "danielelore" -> paypal.me/danielelore
(function () {
  var TIERS = [3, 10, 25];
  function enabled() { return !!DC.PAYPAL_USER; }
  function pay(amount) {
    var a = Math.max(1, Math.round(amount || 3));
    if (!enabled()) { if (DC.fx) DC.fx.toast("Donazioni in arrivo, grazie di cuore!", { icon: "heart", win: true }); return; }
    window.open("https://paypal.me/" + encodeURIComponent(DC.PAYPAL_USER) + "/" + a + "EUR", "_blank", "noopener");
    if (DC.fx) { DC.fx.sound.tap(); DC.fx.buzz.light(); }
  }
  function open() {
    var ov = document.createElement("div");
    ov.className = "donate-ov";
    ov.innerHTML =
      '<div class="donate-card"><button class="auth-x" id="dx">' + DC.icon("x") + '</button>' +
      '<div class="donate-ico">' + DC.icon("coffee") + '</div>' +
      '<div class="auth-h">Sostieni DopaCart</div>' +
      '<div class="auth-sub">Fatto da una persona sola, a caffè e zero sponsor. Se ti ha strappato anche solo un secondo di gioia, lascia quello che vuoi: server e dominio costano davvero.</div>' +
      '<div class="donate-tiers">' + TIERS.map(function (t) { return '<button class="donate-tier" data-amt="' + t + '">€' + t + '</button>'; }).join("") + '</div>' +
      '<div class="donate-custom"><span class="dc-eur">€</span><input id="dAmt" type="number" min="1" inputmode="decimal" placeholder="importo libero"><button class="btn btn-action" id="dGo">Offri</button></div>' +
      '<div class="donate-foot">' + DC.icon("heart") + ' PayPal · nessun addebito automatico, solo se vuoi tu</div>' +
      '</div>';
    document.body.appendChild(ov);
    if (DC.fx && DC.fx.sound) DC.fx.sound.pop();
    function close() { ov.style.opacity = "0"; setTimeout(function () { ov.remove(); }, 250); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector("#dx").addEventListener("click", close);
    ov.querySelectorAll(".donate-tier").forEach(function (b) { b.addEventListener("click", function () { pay(+b.dataset.amt); }); });
    ov.querySelector("#dGo").addEventListener("click", function () {
      var v = parseFloat((ov.querySelector("#dAmt").value || "").replace(",", "."));
      if (!v || v < 1) { DC.fx.toast("Inserisci un importo", { icon: "ticket" }); return; }
      pay(v);
    });
  }
  DC.donate = { open: open, enabled: enabled, pay: pay };
})();
