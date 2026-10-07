// ===== THE PAINT SHOP (Malerverkstedet; Jonas 06.10.2026, docs/engasjement.md): a button of its own under Verft. Your own boat lies
// in 3D with the camera turning slowly round her (G3.paintView), and the colour you tap shows on her hull at once (vessel3d.js PAINTPRE),
// before anything is paid. The hull's colour costs game money, about 1 % of what the boat costs (at least 1 500 kr), and every boat's
// first choice is free: b.liv is unset until she is painted the first time (a bought boat starts without it). The paint is the boat's
// (b.liv, in the vessel's state), so it follows her through the fleet and into the save. =====
// (a var: the dock, earlier in the same script, asks it on every page it draws, and must find nothing rather than fail before this runs)
var PAINT = (() => {
  const L = (no, en) => S.lang === 'en' ? en : no;
  const price = b => Math.max(1500, Math.round((VESSELS[b.type].price || 0) * 0.01 / 100) * 100);
  const cur = b => (b.liv && b.liv.hull) || 'orig';
  const css = e => e[3] ? 'rgb(' + e[3].map(v => Math.round(v * 255)).join(',') + ')' : '';
  let sel = null, on = false;
  // the drawer page is open or not: the camera and the colour being tried go with it
  function live(want){
    if (want === on) return; on = want;
    if (!want){ sel = null; PAINTPRE = null; }
    if (typeof G3 !== 'undefined' && G3.paintView) G3.paintView(want);
  }
  function page(){
    const b = S.boat, c = cur(b), s = sel || c, e = HULLPAL.find(x => x[0] === s) || HULLPAL[0], free = !b.liv, pr = price(b);
    if (b.status !== 'port') return '<div class="ph-c"><p class="ph-note">' + L('Båten må ligge i havn for å males.', 'The boat must be in port to be painted.') + '</p></div>';
    const sw = HULLPAL.map(x => '<button class="pnt-sw' + (x[0] === s ? ' on' : '') + (x[0] === c ? ' cur' : '') + (x[3] ? '' : ' orig') + '" data-pa="pntsel" data-k="' + x[0] + '" title="' + L(x[1], x[2]) +
      '" aria-label="' + L(x[1], x[2]) + '"' + (x[3] ? ' style="background:' + css(x) + '"' : '') + '></button>').join('');
    const same = s === c, cost = free ? 0 : pr, short = cost > S.cash;
    return '<div class="ph-c"><div class="ph-card"><h4>' + L('Skrogfarge', 'Hull colour') + '</h4>' +
      '<p class="ph-note">' + L('Trykk på en farge, så vises den på skroget. Du betaler først når du maler.', 'Tap a colour and it shows on the hull. You pay only when you paint.') + '</p>' +
      '<div class="pnt-pal">' + sw + '</div>' +
      '<p class="pnt-name"><b>' + L(e[1], e[2]) + '</b>' + (s === c ? ' · ' + L('nå', 'now') : '') + '</p>' +
      '<button class="ph-btn" data-pa="pntgo"' + (same || short ? ' disabled' : '') + '>' + (same ? L('Båten har denne fargen', 'The boat has this colour') :
        L('Mal skroget', 'Paint the hull') + ' · ' + (free ? L('gratis', 'free') : kr(cost))) + '</button>' +
      (short && !same ? '<p class="ph-note r2">' + L('Du har ikke nok penger.', 'You do not have enough money.') + '</p>' : '') +
      '<p class="ph-note">' + (free ? L('Første fargevalg på denne båten er gratis.', 'The first choice of colour on this boat is free.') :
        L('Å male skroget koster ' + kr(pr) + ' for ' + (S.boatName || 'båten') + '.', 'Painting the hull costs ' + kr(pr) + ' for ' + (S.boatName || 'the boat') + '.')) + '</p></div></div>';
  }
  function act(a, d){
    const b = S.boat;
    if (a === 'pntsel'){ if (!HULLPAL.some(x => x[0] === d.k)) return false; sel = d.k; PAINTPRE = d.k; return true; }
    if (a === 'pntgo'){
      const s = sel || cur(b); if (s === cur(b) || b.status !== 'port') return false;
      const free = !b.liv, cost = free ? 0 : price(b); if (cost > S.cash) return false;
      if (cost){ S.cash -= cost; S.stats.costs += cost; }
      b.liv = Object.assign({}, b.liv, {hull:s}); sel = null; PAINTPRE = null;
      const e = HULLPAL.find(x => x[0] === s);
      log((S.boatName || 'Båten') + ' er malt ' + (s === 'orig' ? 'tilbake i originalfargen' : e[1].toLowerCase()) + (cost ? ' for ' + fmt(cost) + ' kr' : '') + '.',
        (S.boatName || 'The boat') + ' is painted ' + (s === 'orig' ? 'back in her original colour' : e[2].toLowerCase()) + (cost ? ' for NOK ' + fmt(cost) : '') + '.');
      return true;
    }
    return false;
  }
  return {page, act, live, price};
})();
