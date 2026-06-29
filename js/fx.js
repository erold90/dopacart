/* DopaCart — fx: coriandoli, suono (WebAudio), haptic, toast, formattazione.
   La delizia è centellinata sui picchi (conferma ordine, in consegna, level-up). */
window.DC = window.DC || {};
(function () {
  var prefersReduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Formattazione —— */
  function euro(n) { return "€" + n.toFixed(2).replace(".", ","); }
  function stars(r) { var full = Math.round(r); return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full); }

  /* —— Suono (sintetizzato, nessun asset) —— */
  var actx = null;
  function ac() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return actx; }
  function tone(freq, dur, type, when, gain) {
    var ctx = ac(); if (!ctx || !DC.store.state.settings.sound) return;
    var t = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain || 0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur);
  }
  var sound = {
    tap: function () { tone(520, 0.08, "sine", 0, 0.10); },
    add: function () { tone(660, 0.09, "triangle"); tone(880, 0.10, "triangle", 0.05); },
    success: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, "triangle", i * 0.08, 0.16); }); },
    pop: function () { tone(880, 0.07, "square", 0, 0.08); tone(1320, 0.10, "square", 0.04, 0.06); },
    levelup: function () { [659, 784, 988, 1319].forEach(function (f, i) { tone(f, 0.22, "sawtooth", i * 0.09, 0.12); }); }
  };

  /* —— Haptic —— */
  function haptic(pattern) {
    if (!DC.store.state.settings.haptics) return;
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  }
  var buzz = {
    light: function () { haptic(8); },
    medium: function () { haptic(18); },
    strong: function () { haptic([0, 30, 40, 30]); },
    win: function () { haptic([0, 20, 30, 20, 30, 60]); }
  };

  /* —— Toast —— */
  function toast(msg, opts) {
    opts = opts || {};
    var wrap = document.getElementById("toasts");
    var el = document.createElement("div");
    el.className = "toast" + (opts.win ? " win" : "");
    el.innerHTML = (opts.icon ? "<span>" + opts.icon + "</span>" : "") + "<span>" + msg + "</span>";
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .3s, transform .3s";
      el.style.opacity = "0"; el.style.transform = "translateY(8px)";
      setTimeout(function () { el.remove(); }, 300);
    }, opts.ms || 1800);
  }

  /* —— Coriandoli (canvas) —— */
  function confetti(opts) {
    if (prefersReduced) return;
    opts = opts || {};
    var cv = document.getElementById("confetti");
    var ctx = cv.getContext("2d");
    var W = cv.width = innerWidth, H = cv.height = innerHeight;
    var colors = ["#ff5470", "#ffb020", "#7c5cfc", "#18c29c", "#2fa8ff"];
    var n = opts.count || 130;
    var parts = [];
    var ox = opts.x != null ? opts.x : W / 2, oy = opts.y != null ? opts.y : H * 0.35;
    for (var i = 0; i < n; i++) {
      parts.push({
        x: ox, y: oy,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -16 - 4,
        g: 0.4 + Math.random() * 0.2,
        s: 6 + Math.random() * 7,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        c: colors[i % colors.length], life: 0
      });
    }
    var max = 110;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var alive = false;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; p.life++;
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99;
        if (p.y < H + 20 && p.life < max) alive = true;
        var a = Math.max(0, 1 - p.life / max);
        ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
      }
      if (alive) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  }

  /* —— Animazione "vola nel carrello" —— */
  function flyToCart(fromEl) {
    if (prefersReduced || !fromEl) return;
    var r = fromEl.getBoundingClientRect();
    var target = document.querySelector('.navbtn[data-route="cart"]');
    if (!target) return;
    var tr = target.getBoundingClientRect();
    var dot = document.createElement("div");
    dot.textContent = "🛒";
    dot.style.cssText = "position:fixed;z-index:75;font-size:22px;left:" + (r.left + r.width / 2) + "px;top:" +
      (r.top + r.height / 2) + "px;transition:transform .6s cubic-bezier(.5,-0.3,.3,1),opacity .6s;pointer-events:none";
    document.body.appendChild(dot);
    requestAnimationFrame(function () {
      dot.style.transform = "translate(" + (tr.left + tr.width / 2 - r.left - r.width / 2) + "px," +
        (tr.top + tr.height / 2 - r.top - r.height / 2) + "px) scale(.4)";
      dot.style.opacity = "0.2";
    });
    setTimeout(function () { dot.remove(); }, 620);
  }

  DC.fx = {
    euro: euro, stars: stars, sound: sound, buzz: buzz,
    toast: toast, confetti: confetti, flyToCart: flyToCart,
    reduced: prefersReduced
  };
})();
