// ===== The moment a boat is bought (M5 in docs/planer/butikker-og-sponsorer.md): the top and the end of the purchase =====
// 15 seconds over the 3D view: the camera turns slowly round her at the yard's quay (G3.paintView, as in the paint shop) when she is the
// boat you are on, her name is painted on letter by letter, and the flag goes up. «Hopp over» ends it at once; nothing waits on it.
// On the boat you are on, with the 3D view up, the name is painted onto her hull where she carries it and her ensign goes up its pole in
// the model (G3.buyShow, view3d/13-instruments.js buyAt; steg 28), and the card says only the type, the year and the quay. Else (a boat
// for the fleet, at sea, one with no name, or no 3D) the card paints the name and hoists a small flag itself, as before.
// The traded-in boat stays with the yard (since 07.11.2026 she is not put out again: Kystmegleren lists only the players' boats, B5).
// (a var: the phone's buttons earlier in the script call BUYM.show, and must find it when they run)
var BUYM = (() => {
  const L = (no, en) => S.lang === 'en' ? en : no, esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const DUR = 15000;
  let el = null, tm = 0, t0 = 0, cam = false, r3d = false;
  // the flag (the boat's own when she flies another, else Norway's) as a small picture on a pole
  const FLAG = '<svg viewBox="0 0 22 16" class="bm-fl" aria-hidden="true"><rect width="22" height="16" fill="#ba0c2f"/><rect x="6" width="4" height="16" fill="#fff"/><rect y="6" width="22" height="4" fill="#fff"/><rect x="7" width="2" height="16" fill="#00205b"/><rect y="7" width="22" height="2" fill="#00205b"/></svg>';
  function close(skip){
    if (!el) return; clearTimeout(tm); el.remove(); el = null;
    if (r3d && typeof G3 !== 'undefined' && G3.buyShow) G3.buyShow(null); r3d = false;
    if (cam && typeof G3 !== 'undefined' && G3.paintView) G3.paintView(false); cam = false;
    if (typeof cloudEv === 'function') cloudEv('buy_moment', {skip:!!skip, s:Math.round((performance.now() - t0) / 1000)});
  }
  // v: the vessel bought for the fleet, or nothing for the one you are on (a trade-in)
  function show(v){
    close(); const own = !v || v.id === S.cur, b = own ? S.boat : vget(v, 'boat'), nm = own ? S.boatName : vget(v, 'boatName'), V = VESSELS[b.type]; if (!V) return;
    const pt = portById(b.port), yr = b.built || (V.isNew ? yearH(S.t / 60) : V.year);
    if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close();
    if (typeof PHONE !== 'undefined' && PHONE.show) PHONE.show(false);
    if (own && b.status === 'port' && typeof G3 !== 'undefined' && G3.paintView){ G3.paintView(true); cam = true;
      // (the 3D view must be up now: the first time it is loaded, or where it cannot be, the card paints the name itself; so it does for
      // a boat with no name, which carries only her mark on the hull, ui/08-actions.js boatUnnamed)
      if (!S.unnamed && G3.buyShow && !G3.failWhy && G3.isActive && G3.isActive()){ G3.buyShow(nm); r3d = true; } }
    el = document.createElement('div'); el.id = 'buyMoment'; el.className = 'bm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', L('Båten er din', 'The boat is yours') + (r3d ? ': ' + nm : ''));
    const letters = [...String(nm)].map((c, i) => '<span style="animation-delay:' + (0.6 + i * 0.22).toFixed(2) + 's">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</span>').join('');
    el.innerHTML = '<div class="bm-card"><p class="bm-k">' + L('Kontrakten er underskrevet', 'The contract is signed') + '</p>' +
      (r3d ? '' : '<div class="bm-row"><div class="bm-pole"><i></i><span class="bm-flag">' + FLAG + '</span></div><div class="bm-name" aria-label="' + esc(nm) + '">' + letters + '</div></div>') +
      '<p class="bm-sub">' + esc(V.name[S.lang]) + ' · ' + yr + (pt ? ' · ' + L('ved kaia i ', 'at the quay in ') + esc(pt.name) : '') + '</p>' +
      '<p class="bm-note">' + (r3d ? L('Hun er din. Navnet males på skroget, og flagget går opp.', 'She is yours. The name is painted on her hull, and the flag goes up.') : own ? L('Hun er din. Navnet males på, og flagget går opp.', 'She is yours. The name is painted on, and the flag goes up.') : L('Hun er din, og ligger klar til flåten.', 'She is yours, and lies ready for the fleet.')) + '</p>' +
      '<button class="ph-btn alt bm-skip" type="button">' + L('Hopp over', 'Skip') + '</button></div>';
    document.body.appendChild(el); el.querySelector('.bm-skip').addEventListener('click', () => close(true));
    t0 = performance.now(); tm = setTimeout(() => close(false), DUR);
  }
  return {show, close, get on(){ return !!el; }, get in3d(){ return r3d; }, DUR};
})();
