/* DopaCart — donazioni via Ko-fi (0% commissioni, incassi sul TUO PayPal/Stripe). Nessun backend.
   IMPOSTA DC.KOFI_USER col tuo handle Ko-fi per attivare (es. "dopacart" -> ko-fi.com/dopacart). Vuoto = dormiente. */
window.DC = window.DC || {};
DC.KOFI_USER = ""; // es. "dopacart"
(function () {
  function enabled() { return !!DC.KOFI_USER; }
  function go() {
    if (!enabled()) { if (DC.fx) DC.fx.toast("Donazioni in arrivo, grazie di cuore!", { icon: "heart", win: true }); return; }
    window.open("https://ko-fi.com/" + encodeURIComponent(DC.KOFI_USER), "_blank", "noopener");
    if (DC.fx) { DC.fx.sound.tap(); DC.fx.buzz.light(); }
  }
  function open() {
    var ov = document.createElement("div");
    ov.className = "donate-ov";
    ov.innerHTML =
      '<div class="donate-card"><button class="auth-x" id="dx">' + DC.icon("x") + '</button>' +
      '<div class="donate-ico">' + DC.icon("coffee") + '</div>' +
      '<div class="auth-h">Offrici un caffè</div>' +
      '<div class="auth-sub">DopaCart è fatto da una persona sola, a caffè e zero sponsor. Se ti ha strappato anche solo un secondo di gioia, offri quello che vuoi: server e dominio costano davvero.</div>' +
      '<button class="btn btn-action btn-block btn-lg" id="dGo" style="margin-top:var(--sp-6)">' + DC.icon("coffee") + ' Sostieni su Ko-fi</button>' +
      '<div class="donate-foot">' + DC.icon("heart") + ' Scegli tu l\'importo · PayPal o carta · senza registrarti</div>' +
      '</div>';
    document.body.appendChild(ov);
    if (DC.fx && DC.fx.sound) DC.fx.sound.pop();
    function close() { ov.style.opacity = "0"; setTimeout(function () { ov.remove(); }, 250); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector("#dx").addEventListener("click", close);
    ov.querySelector("#dGo").addEventListener("click", go);
  }
  DC.donate = { open: open, enabled: enabled, go: go };
})();
