/* DopaCart — catalogo proprio (nessuna dipendenza dall'API Amazon).
   Caricato come script classico => funziona anche con doppio click (file://), niente fetch.
   I prodotti usano un'emoji + tinta come visual: zero asset esterni per l'MVP.
   affiliateUrl: placeholder con tag Associates da sostituire (link manuale SiteStripe). */
window.DC = window.DC || {};
DC.catalog = {
  categories: [
    { id: "tech",    name: "Tecnologia",   emoji: "💻" },
    { id: "home",    name: "Casa",         emoji: "🛋️" },
    { id: "fashion", name: "Moda",         emoji: "👟" },
    { id: "beauty",  name: "Bellezza",     emoji: "💄" },
    { id: "fun",     name: "Tempo libero", emoji: "🎮" }
  ],
  products: [
    // —— Tecnologia ——
    { id:"t1", cat:"tech", title:"Cuffie wireless ANC", emoji:"🎧", hue:240, price:79.90, list:129.90, rating:4.6, reviews:2143, boughtBy:1280, badges:["offerta","best-seller"], blurb:"Cancellazione del rumore, 40h di autonomia, custodia inclusa.", quotes:["Una bomba, le adoro.","Silenzio totale in metro."] },
    { id:"t2", cat:"tech", title:"Smartwatch GPS", emoji:"⌚", hue:200, price:119.00, list:159.00, rating:4.4, reviews:980, boughtBy:540, badges:["novità"], blurb:"GPS, SpO2, 14 giorni di batteria, sempre connesso.", quotes:["Preciso e bellissimo."] },
    { id:"t3", cat:"tech", title:"Mini proiettore 1080p", emoji:"📽️", hue:280, price:99.99, list:149.99, rating:4.2, reviews:412, boughtBy:210, badges:["offerta"], blurb:"Cinema in salotto, WiFi e altoparlante integrato.", quotes:["Serate film salvate."] },
    { id:"t4", cat:"tech", title:"Tastiera meccanica low-profile", emoji:"⌨️", hue:150, price:64.90, list:89.90, rating:4.7, reviews:1530, boughtBy:870, badges:["best-seller"], blurb:"Switch silenziosi, retroilluminazione, USB-C.", quotes:["Scrivere è un piacere."] },
    { id:"t5", cat:"tech", title:"Power bank 20.000 mAh", emoji:"🔋", hue:30, price:29.90, list:44.90, rating:4.5, reviews:3210, boughtBy:2100, badges:["offerta"], blurb:"Ricarica rapida 22.5W, due porte, ultra-compatto.", quotes:["Non rimango mai a secco."] },

    // —— Casa ——
    { id:"h1", cat:"home", title:"Macchina caffè espresso", emoji:"☕", hue:35, price:149.00, list:199.00, rating:4.6, reviews:1890, boughtBy:1020, badges:["best-seller"], blurb:"Pressione 20 bar, montalatte, crema perfetta.", quotes:["Bar a casa mia."] },
    { id:"h2", cat:"home", title:"Lampada da scrivania LED", emoji:"💡", hue:55, price:34.90, list:49.90, rating:4.3, reviews:760, boughtBy:430, badges:[], blurb:"Tre temperature, dimmerabile, ricarica wireless.", quotes:["Luce perfetta per leggere."] },
    { id:"h3", cat:"home", title:"Set lenzuola in cotone", emoji:"🛏️", hue:330, price:39.99, list:59.99, rating:4.5, reviews:1340, boughtBy:910, badges:["offerta"], blurb:"Cotone 100%, morbidezza che dura nel tempo.", quotes:["Dormo come un sasso."] },
    { id:"h4", cat:"home", title:"Diffusore aromi smart", emoji:"🪔", hue:160, price:44.50, list:64.50, rating:4.1, reviews:520, boughtBy:280, badges:["novità"], blurb:"Luce d'atmosfera, timer, controllo da app.", quotes:["Casa profumata e rilassante."] },
    { id:"h5", cat:"home", title:"Aspirapolvere robot", emoji:"🤖", hue:210, price:189.00, list:259.00, rating:4.4, reviews:2670, boughtBy:1400, badges:["best-seller"], blurb:"Mappatura laser, svuotamento automatico.", quotes:["Pavimenti sempre puliti senza fatica."] },

    // —— Moda ——
    { id:"f1", cat:"fashion", title:"Sneakers retro", emoji:"👟", hue:15, price:69.90, list:99.90, rating:4.5, reviews:1980, boughtBy:1190, badges:["best-seller"], blurb:"Comfort tutto il giorno, suola ammortizzata.", quotes:["Le indosso ovunque."] },
    { id:"f2", cat:"fashion", title:"Zaino impermeabile", emoji:"🎒", hue:190, price:49.90, list:74.90, rating:4.6, reviews:1120, boughtBy:760, badges:["offerta"], blurb:"Scomparto laptop, porta USB, antifurto.", quotes:["Perfetto per viaggiare."] },
    { id:"f3", cat:"fashion", title:"Occhiali da sole polarizzati", emoji:"🕶️", hue:45, price:24.90, list:39.90, rating:4.2, reviews:640, boughtBy:380, badges:[], blurb:"UV400, montatura leggera, custodia inclusa.", quotes:["Eleganti e leggeri."] },
    { id:"f4", cat:"fashion", title:"Orologio minimalista", emoji:"⌚", hue:300, price:54.00, list:79.00, rating:4.4, reviews:870, boughtBy:520, badges:["novità"], blurb:"Quadrante pulito, cinturino in pelle, 3ATM.", quotes:["Sta bene con tutto."] },

    // —— Bellezza ——
    { id:"b1", cat:"beauty", title:"Phon ionico professionale", emoji:"💨", hue:330, price:59.90, list:89.90, rating:4.5, reviews:1430, boughtBy:880, badges:["best-seller"], blurb:"Asciuga in metà tempo, capelli lucidi.", quotes:["Capelli da salone."] },
    { id:"b2", cat:"beauty", title:"Set skincare vitamina C", emoji:"🧴", hue:25, price:34.90, list:54.90, rating:4.3, reviews:990, boughtBy:610, badges:["offerta"], blurb:"Siero, crema e contorno occhi illuminanti.", quotes:["Pelle visibilmente più luminosa."] },
    { id:"b3", cat:"beauty", title:"Profumo unisex 50ml", emoji:"🌸", hue:310, price:44.00, list:69.00, rating:4.6, reviews:1260, boughtBy:840, badges:["novità"], blurb:"Note agrumate e legnose, lunga tenuta.", quotes:["Ricevo complimenti ogni volta."] },
    { id:"b4", cat:"beauty", title:"Spazzolino elettrico sonico", emoji:"🪥", hue:185, price:39.90, list:59.90, rating:4.4, reviews:2010, boughtBy:1230, badges:["best-seller"], blurb:"5 modalità, timer, 30 giorni di batteria.", quotes:["Denti puliti come dal dentista."] },

    // —— Tempo libero ——
    { id:"g1", cat:"fun", title:"Controller wireless pro", emoji:"🎮", hue:265, price:49.90, list:69.90, rating:4.5, reviews:1760, boughtBy:1010, badges:["best-seller"], blurb:"Grip antiscivolo, trigger regolabili, low latency.", quotes:["Reattivo e comodissimo."] },
    { id:"g2", cat:"fun", title:"Set acquerelli 36 colori", emoji:"🎨", hue:340, price:19.90, list:29.90, rating:4.7, reviews:830, boughtBy:560, badges:["offerta"], blurb:"Pigmenti vividi, pennello incluso, atossici.", quotes:["Colori fantastici."] },
    { id:"g3", cat:"fun", title:"Tappetino yoga premium", emoji:"🧘", hue:155, price:29.90, list:44.90, rating:4.4, reviews:1190, boughtBy:720, badges:[], blurb:"Antiscivolo, 6mm, cinghia per trasporto.", quotes:["Stabile e morbido al punto giusto."] },
    { id:"g4", cat:"fun", title:"Drone mini con camera", emoji:"🛸", hue:215, price:89.00, list:129.00, rating:4.1, reviews:470, boughtBy:240, badges:["novità"], blurb:"Camera HD, stabilizzazione, valigetta inclusa.", quotes:["Riprese aeree spettacolari."] },
    { id:"g5", cat:"fun", title:"Cassa Bluetooth waterproof", emoji:"🔊", hue:20, price:39.90, list:59.90, rating:4.6, reviews:2540, boughtBy:1600, badges:["best-seller","offerta"], blurb:"360° di suono, IPX7, 24h di musica.", quotes:["Suono potente ovunque."] }
  ]
};

/* Mappa prodotto -> icona di linea (vedi js/icons.js). Niente emoji. */
DC.PRODUCT_ICON = {
  t1:"headphones", t2:"watch", t3:"tv", t4:"keyboard", t5:"battery",
  h1:"coffee", h2:"lamp", h3:"bed", h4:"wind", h5:"bot",
  f1:"footprints", f2:"backpack", f3:"glasses", f4:"clock",
  b1:"wind", b2:"droplet", b3:"flower", b4:"sparkles",
  g1:"gamepad", g2:"palette", g3:"dumbbell", g4:"plane", g5:"speaker"
};
DC.CAT_ICON = { all:"sparkles", tech:"cpu", home:"home", fashion:"shirt", beauty:"droplet", fun:"gamepad" };
DC.iconFor = function (p) { return DC.PRODUCT_ICON[p.id] || "package"; };

/* Costruisce l'URL affiliato (placeholder: sostituire ASSOCIATE_TAG e l'ASIN reale via SiteStripe). */
DC.affiliateUrl = function (product) {
  var q = encodeURIComponent(product.title);
  return "https://www.amazon.it/s?k=" + q + "&tag=ASSOCIATE_TAG-21";
};
