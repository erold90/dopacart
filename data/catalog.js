/* DopaCart — helper catalogo + LAZY LOADER. Dati in data/catalog.json (fetch a runtime). */
window.DC = window.DC || {};
DC.loadCatalog = function () { if (DC.catalog) return Promise.resolve(DC.catalog); return fetch('data/catalog.json').then(function (r) { return r.json(); }).then(function (j) { DC.catalog = j; return j; }); };
DC.CAT_ICON = { all:"sparkles", tech:"cpu", home:"home", fashion:"shirt", beauty:"droplet", sport:"dumbbell", food:"cart" };
DC.iconFor = function (p) { return DC.CAT_ICON[p && p.cat] || "package"; };
DC.imgTag = function (p) { if (!p || !p.img) return ""; return '<img class="pimg" src="' + p.img + '" alt="' + (p.title || "") + '" loading="lazy" onload="this.classList.add(\'on\')" onerror="this.remove()">'; };
DC.affiliateUrl = function (product) { return "https://www.amazon.it/s?k=" + encodeURIComponent(product.title) + "&tag=ASSOCIATE_TAG-21"; };
