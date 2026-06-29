/* DopaCart — libreria di icone di linea (no emoji). Stroke currentColor, viewBox 24.
   DC.icon(name, cls) -> <svg>. Variante piena per le stelle (rating). */
window.DC = window.DC || {};
(function () {
  var P = {
    /* — UI / nav — */
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3.5H5l2.2 11.4a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.3L21 7.5H6"/>',
    package: '<path d="M21 8.5 12 13 3 8.5 12 4z"/><path d="M3 8.5v7L12 20l9-4.5v-7"/><path d="M12 13v7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.3 12.4l2.4 2.4 5-5.2"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    flame: '<path d="M12 3c1.2 2.8 4 4.2 4 7.6a4 4 0 0 1-8 0c0-1.4.5-2.4 1.1-3 .3 1 .9 1.5 1.6 1.7C10 7.5 11 5.2 12 3z"/>',
    zap: '<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',
    trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6.5H4.5V8a3 3 0 0 0 3 3"/><path d="M17 6.5h2.5V8a3 3 0 0 1-3 3"/><path d="M9.5 21h5M12 16v5"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4.5" rx="1"/><path d="M5 13v8h14v-8"/><path d="M12 8.5V21"/><path d="M12 8.5C9.5 8.5 8 7.7 8 6.2S9.2 4 10.4 4.8 12 8.5 12 8.5zM12 8.5c2.5 0 4-.8 4-2.3S14.8 4 13.6 4.8 12 8.5 12 8.5z"/>',
    sparkles: '<path d="M12 4l1.7 4.5L18 10l-4.3 1.5L12 16l-1.7-4.5L6 10l4.3-1.5z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.5 4.5l2 2M17.5 17.5l2 2M2.5 12h3M18.5 12h3M4.5 19.5l2-2M17.5 6.5l2-2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
    piggy: '<path d="M18.5 10.2C20 10.5 21 11.6 21 13s-1 2.3-2.5 2.6V18a1.5 1.5 0 0 1-1.5 1.5h-1l-1 1.5H9l-1-1.5a6 6 0 0 1-4-5.7 6 6 0 0 1 6-5.8h4c1.3 0 2.6.5 3.5 1.2z"/><circle cx="15.5" cy="11.5" r="1"/><path d="M9 9.5C9 7 11 5 13 5"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9h18"/><circle cx="17" cy="13" r="1.3"/>',
    truck: '<rect x="2.5" y="6.5" width="11" height="9" rx="1.5"/><path d="M13.5 9.5H18l3 3v3h-7.5z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/>',
    mapPin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    party: '<path d="M3.5 20.5 8 8l8 8z"/><path d="M14.5 6c1-1 3-1 4 0M16.5 2.5v3M21 7h-3M19 11.5c1.2 0 2 .6 2 1.6"/>',
    boxes: '<path d="M9 3.5 5 5.5v4l4 2 4-2v-4z"/><path d="M5 13.5l-2.5 1.2v3.6L7 20.5l2.5-1.2"/><path d="M19 13.5l2.5 1.2v3.6L17 20.5l-2.5-1.2"/>',
    bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 2 5.5 2 5.5H4s2-1 2-5.5z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    clipboard: '<rect x="5" y="5" width="14" height="16" rx="2"/><rect x="8.5" y="3" width="7" height="4" rx="1.4"/><path d="M9 13l2 2 4-4.2"/>',

    /* — Categorie — */
    cpu: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/><path d="M9.5 2v3M14.5 2v3M9.5 19v3M14.5 19v3M2 9.5h3M2 14.5h3M19 9.5h3M19 14.5h3"/>',
    shirt: '<path d="M8 3 4 6l2 3 2-1.2V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.8L18 9l2-3-4-3-2 2H10z"/>',

    /* — Prodotti — */
    headphones: '<path d="M4 14v-1.5a8 8 0 0 1 16 0V14"/><rect x="3" y="13.5" width="4" height="6.5" rx="1.6"/><rect x="17" y="13.5" width="4" height="6.5" rx="1.6"/>',
    watch: '<circle cx="12" cy="12" r="5.6"/><path d="M12 9.2V12l1.7 1.4"/><path d="M9 6.6 9.6 3h4.8l.6 3.6M9 17.4l.6 3.4h4.8l.6-3.4"/>',
    tv: '<rect x="2.5" y="6.5" width="19" height="13" rx="2.5"/><path d="M8 6.5 12 3l4 3.5"/>',
    keyboard: '<rect x="2.5" y="6.5" width="19" height="11" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7 14h10"/>',
    battery: '<rect x="2.5" y="8" width="15" height="8" rx="2.5"/><path d="M20 11v2"/><path d="m10 9-2.2 3.2H11L9 15.5"/>',
    coffee: '<path d="M5 8.5h11V14a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3v2.2M11.5 3v2.2"/>',
    lamp: '<path d="M4.5 19.5h7"/><path d="M8 19.5v-6"/><path d="m5 13.5 2.6-7.5h4.8l2.6 7.5z"/><path d="M16.5 6H20v4.2"/>',
    bed: '<path d="M3 18.5v-7h13.5a4 4 0 0 1 4 4v3"/><path d="M3 14.5h17.5"/><path d="M3 18.5v2.5M20.5 18.5v2.5"/><path d="M6.5 11.5v-3h5v3"/>',
    wind: '<path d="M3 8.5h9a2.6 2.6 0 1 0-2.6-2.6"/><path d="M3 12.5h13a2.6 2.6 0 1 1-2.6 2.6"/><path d="M3 16.5h6.5a2.2 2.2 0 1 1-2.2 2.2"/>',
    bot: '<rect x="4" y="8" width="16" height="11" rx="3.5"/><path d="M12 4.5V8M9 13h.01M15 13h.01M9.5 16h5"/><circle cx="12" cy="3.5" r="1.3"/>',
    footprints: '<path d="M7 13.5c-1.5 0-2.6-1.2-2.6-3.4S5.5 5.5 7 5.5s2.4 2.4 2.4 4.6-.4 3.4-2.4 3.4z"/><path d="M6.6 13.5c0 1.8.4 2.8.4 4.2S6 20.5 7 20.5s1.6-1 1.6-2.4"/><path d="M17 9.5c1.5 0 2.6 1.2 2.6 3.4S18.5 17.5 17 17.5 14.6 15.1 14.6 13s.4-3.5 2.4-3.5z"/>',
    backpack: '<path d="M6 9.5a6 6 0 0 1 12 0V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M9.5 9.5V6.5a2.5 2.5 0 0 1 5 0v3"/><path d="M9 14.5h6"/>',
    glasses: '<circle cx="6.5" cy="14" r="3"/><circle cx="17.5" cy="14" r="3"/><path d="M9.5 13.2c1.2-1 3.8-1 5 0M3.5 11l2-4M20.5 11l-2-4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
    droplet: '<path d="M12 3.2s6 6.6 6 11A6 6 0 0 1 6 14.2c0-4.4 6-11 6-11z"/>',
    flower: '<circle cx="12" cy="12" r="2.6"/><path d="M12 9.4c0-2.2 1.1-3.7 0-5.9-1.1 2.2 0 3.7 0 5.9zM14.6 12c2.2 0 3.7 1.1 5.9 0-2.2-1.1-3.7 0-5.9 0zM12 14.6c0 2.2-1.1 3.7 0 5.9 1.1-2.2 0-3.7 0-5.9zM9.4 12c-2.2 0-3.7-1.1-5.9 0 2.2 1.1 3.7 0 5.9 0z"/>',
    gamepad: '<rect x="2.5" y="8" width="19" height="9" rx="4.5"/><path d="M7 11v3M5.5 12.5h3"/><path d="M15.5 12h.01M18 13.5h.01"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1.6 0 2.2-1.1 1.7-2.3-.5-1.2.3-2.2 1.6-2.2H18a3 3 0 0 0 3-3.2A9 9 0 0 0 12 3z"/><circle cx="7.7" cy="11" r="1"/><circle cx="10" cy="7.6" r="1"/><circle cx="14.5" cy="7.6" r="1"/>',
    dumbbell: '<path d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11"/>',
    plane: '<path d="M12 3c1 0 1.5 1.1 1.5 3.2v2.9l7 4.1v2.1l-7-2.1v3.1l2 1.5v1.9l-3.5-1L9 21.7v-1.9l2-1.5v-3.1l-7 2.1v-2.1l7-4.1V6.2C11 4.1 11 3 12 3z"/>',
    speaker: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><circle cx="12" cy="14.5" r="3.6"/><circle cx="12" cy="6.5" r="1.1"/>'
  };

  DC.icon = function (name, cls) {
    var inner = P[name];
    if (!inner) inner = P.package;
    var filled = (name === "star");
    return '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" ' +
      (filled ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke="currentColor"') +
      ' stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  };
  DC.hasIcon = function (n) { return !!P[n]; };
})();
