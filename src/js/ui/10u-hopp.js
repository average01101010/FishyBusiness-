// ---------- Hopp over resten av ruta: the fast-forward button and the card (HO2, steg 105; docs/planer/hopp.md) ----------
// Jonas 12.11.2026: «Jeg tenker selve knappen kan legges her på skjermen, og vises som et "fast forward"-symbol, nesten som en
// spoleknapp. Den skal være kontekstuell og kun komme opp når en rute er i gang.» The button stands in 3D on the right, under the
// camera and the cinema (#camBtn, #kinoBtn), only while a route is sailed (not on the operations plan, not by hand at the helm, not in
// the cinema's clean view or the chart). The card says where the hop goes, the real time saved and the price in kroner with 💎, or why
// it cannot be had; the hop itself is the core's (core/06j-hopp.js hopGo). Until the purchase is built (HO3, steg 106) the button shows
// only with the Admin app's test switch (S.adm.hopp, for admins), so no player can hop for free; the card shows the price as it will be.
const HOPUI = {busy:false, ms:null, open:0};
// (not while she stops or Autonav finds a way round, nor while the time the game was closed is still being played in: CATCH_LEFT)
const hopShown = () => { const b = S.boat, pl = S.plan;
  return !!(S.adm && S.adm.hopp && typeof adminOk === 'function' && adminOk() && typeof G3 !== 'undefined' && G3.isActive() && pl && !pl.ops && !pl.p2 && !pl.halt && !pl.replan &&
    b.status === 'sailing' && !(typeof helmOn === 'function' && helmOn()) && !(typeof CATCH_LEFT !== 'undefined' && CATCH_LEFT > 0)); };
// each frame (08-actions.js tick): the button only while a route is under way
function hopUi(){ const btn = $('hopBtn'); if (!btn) return; const on = hopShown() || HOPUI.busy; if (btn.hidden === on) btn.hidden = !on; }
const hopL = (no, en) => S.lang === 'en' ? en : no;
const hopEsc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
// the card: open at once with «working it out», and filled when the dry run (a few hundred ms on a long route) is done, so the tap
// never freezes the screen before anything shows
function hopOpen(){
  if (HOPUI.busy) return;
  const n = ++HOPUI.open, title = '<h3>' + hopL('Hopp over resten av ruta', 'Skip the rest of the route') + '</h3>';
  modal(title + '<p class="hop-calc">' + hopL('Regner ut turen …', 'Working out the trip …') + '</p>');
  setTimeout(() => { if (n !== HOPUI.open || $('modal').hidden) return; hopCard(title, hopQuote()); }, 30);
}
function hopCard(h, q){
  if (q.why){ modal(h + '<p>' + hopEsc(hopL(q.why[0], q.why[1])) + '</p><div class="btns"><button class="btn primary" data-close>' + hopL('Lukk', 'Close') + '</button></div>'); return; }
  const w = q.w, pt = w.port && portById(w.port), np = pt ? null : nearestPlace(w);
  h += '<p>' + (pt ? hopL('Til ', 'To ') + '<b>' + hopEsc(pt.name) + '</b>. ' : hopL('Til neste stopp på ruta, ', 'To the next stop on the route, ') + '<b>' + hopEsc(hopL(np.no, np.en)) + '</b>. ') +
    hopL('Du sparer ', 'You save ') + '<b>' + hopSaved(q.real, S.lang === 'en') + '</b>' + hopL(' og er fremme med en gang.', ' and are there at once.') + '</p>' +
    '<p>' + hopL('Dieselen, fisken, isen og folkene om bord går som om dere seilte. Fartstid og distanse får du bare ved å seile.', 'The diesel, the fish, the ice and the people aboard go as if you had sailed. Sea time and miles come only from sailing.') + '</p>' +
    '<p class="hop-kr">' + (typeof realKr === 'function' ? realKr(q.kr) : '\u{1F48E} ' + q.kr + ' kr') + '</p>' +
    '<p class="hop-test">' + hopL('Testmodus: hoppet er gratis til kjøpet er på plass.', 'Test mode: the hop is free until the purchase is in place.') + '</p>' +
    '<div class="btns"><button class="btn" data-close>' + hopL('Avbryt', 'Cancel') + '</button><button class="btn primary" id="hopGo">' + hopL('Hopp', 'Hop') + '</button></div>';
  modal(h); $('hopGo').onclick = hopPress;
}
// the hop: the screen goes dark first (two frames, so the dark is drawn before the work), the map at the stop and the hop (hopGo), then
// every kind of pack the chart and the 3D view read round the stop, as the start along the coast loads them (08c-start.js), within
// HOPUI.packMs, and the screen comes back
HOPUI.packMs = 15000;
async function hopPress(){
  if (HOPUI.busy) return; HOPUI.busy = true; $('modal').hidden = true;
  const fade = $('hopFade'), t0 = performance.now(); let q = null;
  if (fade) fade.classList.add('on');
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try { q = await hopGo(); } catch (e){ console.error(e); }
  if (q && !q.why && typeof mapPreload === 'function'){
    try { await Promise.race([mapPreload([S.boat.pos], [['sim', 8], ['chart', 8], ['view', 10], ['vec', 10], ['far', 30]]), new Promise(r => setTimeout(r, HOPUI.packMs))]); } catch (e){ console.warn('hop packs', e); }
  }
  HOPUI.ms = Math.round(performance.now() - t0);
  if (q && q.why) toast(S.lang === 'en' ? q.why[1] : q.why[0]);
  if (typeof save === 'function') save();
  panelDirty = true; if (typeof renderHud === 'function') renderHud(); if (typeof DOCK !== 'undefined' && DOCK.redraw) DOCK.redraw();
  setTimeout(() => { if (fade) fade.classList.remove('on'); HOPUI.busy = false; }, 400);
}
$('hopBtn').onclick = hopOpen;
