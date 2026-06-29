# 05 · Sviluppo — DopaCart MVP

PWA "dopamine site" in HTML/CSS/JS vanilla, zero dipendenze, `localStorage`. Funziona anche con doppio click su `index.html` (script classici, niente fetch/moduli).

## Struttura

```
index.html              · shell + ordine di caricamento script
manifest.webmanifest    · PWA
sw.js                   · service worker (offline, attivo solo su http/https)
css/  tokens.css        · design token OKLCH (vedi ../DESIGN.md)
      app.css           · stili componenti
data/ catalog.js        · catalogo proprio (23 prodotti) — niente API Amazon
js/   store.js          · stato + persistenza localStorage
      fx.js             · coriandoli, suono (WebAudio), haptic, toast, formattazione
      catalog.js        · viste Home / Catalogo / Scheda prodotto
      cart.js           · carrello
      checkout.js       · checkout simulato (3 step)
      tracker.js        · ⭐ tracking del pacco + lista ordini
      rewards.js        · XP, livelli, streak, badge, risparmio, scatola mistero, profilo
      app.js            · icone, router hash, bottom-nav, onboarding, bootstrap
assets/ icon.svg        · icona PWA
```

## Avvio locale

- **Veloce:** doppio click su `index.html` (il service worker non si attiva su `file://`, ma l'app funziona).
- **Completo (PWA):** server statico →
  ```bash
  cd 05_SVILUPPO && python3 -m http.server 8765
  # apri http://localhost:8765
  ```

## Deploy (come gli altri progetti)

Repo dedicato → **GitHub Pages**. Tutto statico, nessun backend. `start_url`/`scope` sono relativi, quindi funziona anche in sottocartella.

## Stato MVP (Fase 1 — completata)

✅ Home + scatola mistero · ✅ Catalogo con filtri + skeleton · ✅ Scheda prodotto · ✅ Carrello con totale animato + goal-gradient · ✅ Checkout 3 step · ✅ Conferma con coriandoli/suono/haptic · ✅ **Tracking del pacco** con mappa animata, stati a cascata, notifiche · ✅ Reward macro alla consegna (XP/livello/streak/badge/risparmio) · ✅ Profilo · ✅ Affiliate nudge conforme · ✅ PWA installabile + offline · ✅ `prefers-reduced-motion` + toggle suono/vibrazione.

## TODO prossime fasi (vedi ../02_PRODOTTO/roadmap_mvp.md)

- Sostituire `ASSOCIATE_TAG-21` in `data/catalog.js` con il tag Associates reale (link SiteStripe per i prodotti di punta).
- Icone PNG 192/512 + screenshot per install prompt Android.
- Drop a tempo, suoni rifiniti, avatar/"casa", account+leaderboard, Web Push, Creators API (fase 2).
