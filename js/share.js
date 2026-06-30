/* DopaCart — share-card condivisibile (la leva di crescita n.1: lo screenshot È il prodotto).
   Genera un'immagine 1080x1350 via canvas e la condivide (Web Share API) o la scarica come fallback. */
window.DC = window.DC || {};
(function () {
  var W = 1080, H = 1350;
  function siteUrl() {
    var base = location.pathname.replace(/\/[^\/]*$/, "").replace(/\/$/, "");
    return (location.origin + base).replace(/^https?:\/\//, "");
  }

  function loadImg(src) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var im = new Image(); im.crossOrigin = "anonymous";
      im.onload = function () { res(im); }; im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    var words = (text || "").split(" "), line = "", lines = [];
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; } else line = t;
    }
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] += "…"; }
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], x, y + j * lh);
    return lines.length * lh;
  }

  async function buildBlob(opts) {
    opts = opts || {};
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d");

    // sfondo gradiente brand + glow
    var g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, "#ff5470"); g.addColorStop(0.55, "#8b4be0"); g.addColorStop(1, "#2f7fff");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var rg = ctx.createRadialGradient(W - 120, 160, 60, W - 120, 160, 720);
    rg.addColorStop(0, "rgba(255,255,255,.28)"); rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    var disp = "'Bricolage Grotesque', system-ui, sans-serif";
    var body = "'Hanken Grotesk', system-ui, sans-serif";

    // header
    ctx.textAlign = "left"; ctx.fillStyle = "#fff";
    ctx.font = "800 60px " + disp; ctx.fillText("DopaCart", 80, 130);
    ctx.font = "700 28px " + body; ctx.globalAlpha = .9; ctx.fillText("SHOPPING A COSTO ZERO", 82, 174); ctx.globalAlpha = 1;
    // chip 0,00 €
    ctx.font = "800 40px " + disp; var chip = "0,00 €"; var cw = ctx.measureText(chip).width + 56;
    ctx.fillStyle = "rgba(255,255,255,.18)"; rr(ctx, W - 80 - cw, 78, cw, 70, 35); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(chip, W - 80 - cw / 2, 126);

    // hero
    var im = await loadImg(opts.img);
    var heroY = 220, heroH = 540;
    ctx.fillStyle = "rgba(255,255,255,.14)"; rr(ctx, 80, heroY, W - 160, heroH, 48); ctx.fill();
    if (im) {
      var s = 460, ix = (W - s) / 2, iy = heroY + 40;
      ctx.save(); rr(ctx, ix, iy, s, s, 36); ctx.clip();
      // cover
      var ar = im.width / im.height, dw = s, dh = s, ox = 0, oy = 0;
      if (ar > 1) { dh = s; dw = s * ar; ox = -(dw - s) / 2; } else { dw = s; dh = s / ar; oy = -(dh - s) / 2; }
      ctx.fillStyle = "#fff"; ctx.fillRect(ix, iy, s, s);
      ctx.drawImage(im, ix + ox, iy + oy, dw, dh); ctx.restore();
    } else {
      // niente foto: grande importo al centro
      ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      ctx.font = "800 150px " + disp; ctx.fillText(opts.bigStat || "0,00 €", W / 2, heroY + 320);
    }
    // titolo
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "700 44px " + body;
    wrap(ctx, opts.title || "", W / 2, heroY + heroH - 36, W - 220, 52, 1);

    // headline
    ctx.font = "800 92px " + disp; ctx.fillText(opts.headline || "CONSEGNATO!", W / 2, 900);
    // linea
    ctx.font = "600 36px " + body; ctx.globalAlpha = .95;
    var used = wrap(ctx, opts.line || "", W / 2, 968, W - 180, 46, 2); ctx.globalAlpha = 1;
    // risparmio
    if (opts.savings) { ctx.font = "800 56px " + disp; ctx.fillText(opts.savings, W / 2, 968 + used + 80); }

    // footer
    ctx.font = "700 34px " + body; ctx.globalAlpha = .92;
    ctx.fillText("Lo shopping che ti dà la scarica, non il conto.", W / 2, H - 120); ctx.globalAlpha = 1;
    ctx.font = "800 40px " + disp; ctx.fillText(siteUrl(), W / 2, H - 64);

    return await new Promise(function (res) { c.toBlob(function (b) { res(b); }, "image/png", 0.95); });
  }

  async function doShare(blob, opts) {
    var caption = opts.caption || ("Shopping su DopaCart: speso 0,00 €. https://" + siteUrl());
    var file = new File([blob], "dopacart.png", { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: caption });
        if (DC.fx) DC.fx.sound.tap();
        return;
      }
    } catch (e) { return; /* utente ha annullato lo share nativo */ }
    var url = URL.createObjectURL(blob); var a = document.createElement("a"); a.href = url; a.download = "dopacart.png"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    try { if (navigator.clipboard) navigator.clipboard.writeText(caption); } catch (e) {}
    if (DC.fx) DC.fx.toast("Immagine salvata, condividila dove vuoi!", { icon: "check", win: true, ms: 2400 });
  }

  async function share(opts) {
    opts = opts || {};
    var blob; try { blob = await buildBlob(opts); } catch (e) { if (DC.fx) DC.fx.toast("Impossibile creare l'immagine", { icon: "x" }); return; }
    return doShare(blob, opts);
  }

  // Anteprima VISIBILE della card (secondo picco dopaminico) prima di condividere/scaricare
  async function preview(opts) {
    opts = opts || {};
    var blob; try { blob = await buildBlob(opts); } catch (e) { return share(opts); }
    var url = URL.createObjectURL(blob);
    var ov = document.createElement("div"); ov.className = "share-ov";
    ov.innerHTML =
      '<div class="share-wrap">' +
        '<img class="share-preview" src="' + url + '" alt="La tua card DopaCart">' +
        '<button class="btn btn-action btn-block btn-lg" id="shDo">' + (DC.icon ? DC.icon("share") : "") + ' Condividi</button>' +
        '<button class="share-close" id="shClose">Chiudi</button>' +
      '</div>';
    document.body.appendChild(ov);
    if (DC.fx) { DC.fx.confetti({ count: 90, y: innerHeight * 0.28 }); if (DC.fx.sound) DC.fx.sound.pop(); if (DC.fx.buzz) DC.fx.buzz.medium(); }
    function close() { ov.style.opacity = "0"; setTimeout(function () { ov.remove(); URL.revokeObjectURL(url); }, 250); }
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    ov.querySelector("#shClose").addEventListener("click", close);
    ov.querySelector("#shDo").addEventListener("click", function () { doShare(blob, opts); });
  }

  DC.share = { share: share, preview: preview, buildBlob: buildBlob, siteUrl: siteUrl };
})();
