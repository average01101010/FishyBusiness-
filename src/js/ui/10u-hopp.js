// ---------- Hopp over resten av ruta: the fast-forward button and the card (HO2, steg 105; docs/planer/hopp.md) ----------
// Jonas 12.11.2026: «Jeg tenker selve knappen kan legges her på skjermen, og vises som et "fast forward"-symbol, nesten som en
// spoleknapp. Den skal være kontekstuell og kun komme opp når en rute er i gang.» The button stands in 3D on the right, under the
// camera and the cinema (#camBtn, #kinoBtn), only while a route is sailed (not on the operations plan, not by hand at the helm, not in
// the cinema's clean view or the chart). The card says where the hop goes, the real time saved and the price in kroner with 💎, or why
// it cannot be had; the hop itself is the core's (core/06j-hopp.js hopGo). Until the purchase is built (HO3, steg 106) the button shows
// only with the Admin app's test switch (S.adm.hopp, for admins), so no player can hop for free; the card shows the price as it will be.
const HOPUI = {busy:false, ms:null};
const hopShown = () => { const b = S.boat, pl = S.plan;
  return !!(S.adm && S.adm.hopp && typeof adminOk === 'function' && adminOk() && typeof G3 !== 'undefined' && G3.isActive() && pl && !pl.ops && !pl.p2 && b.status === 'sailing' && !(typeof helmOn === 'function' && helmOn())); };
// each frame (08-actions.js tick): the button only while a route is under way
function hopUi(){ const btn = $('hopBtn'); if (!btn) return; const on = hopShown() || HOPUI.busy; if (btn.hidden === on) btn.hidden = !on; }
function hopOpen(){
  if (HOPUI.busy) return;
  const L = (no, en) => S.lang === 'en' ? en : no, esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]), q = hopQuote();
  let h = '<h3>' + L('Hopp over resten av ruta', 'Skip the rest of the route') + '</h3>';
  if (q.why){ modal(h + '<p>' + esc(L(q.why[0], q.why[1])) + '</p><div class="btns"><button class="btn primary" data-close>' + L('Lukk', 'Close') + '</button></div>'); return; }
  const w = q.w, pt = w.port && portById(w.port), np = pt ? null : nearestPlace(w), to = pt ? pt.name : L(np.no, np.en);
  h += '<p>' + L('Til ', 'To ') + '<b>' + esc(to) + '</b>' + (w.port ? '' : L(' (neste stopp på ruta)', ' (the next stop on the route)')) + '. ' + L('Du sparer ', 'You save ') + '<b>' + hopSaved(q.real, S.lang === 'en') + '</b>' + L(' og er fremme med en gang.', ' and are there at once.') + '</p>' +
    '<p>' + L('Dieselen, fisken, isen og folkene om bord går som om dere seilte. Fartstid og distanse får du bare ved å seile.', 'The diesel, the fish, the ice and the people aboard go as if you had sailed. Sea time and miles come only from sailing.') + '</p>' +
    '<p class="hop-kr">' + (typeof realKr === 'function' ? realKr(q.kr) : '\u{1F48E} ' + q.kr + ' kr') + '</p>' +
    '<p class="hop-test">' + L('Testmodus: hoppet er gratis til kjøpet er på plass.', 'Test mode: the hop is free until the purchase is in place.') + '</p>' +
    '<div class="btns"><button class="btn" data-close>' + L('Avbryt', 'Cancel') + '</button><button class="btn primary" id="hopGo">' + L('Hopp', 'Hop') + '</button></div>';
  modal(h); $('hopGo').onclick = hopPress;
}
// the hop: the screen dims, the map at the stop is loaded and the hop made (hopGo), and the screen comes back
async function hopPress(){
  if (HOPUI.busy) return; HOPUI.busy = true; $('modal').hidden = true;
  const fade = $('hopFade'), t0 = performance.now(); let q = null;
  if (fade) fade.classList.add('on');
  try { q = await hopGo(); } catch (e){ console.error(e); }
  HOPUI.ms = Math.round(performance.now() - t0);
  if (q && q.why) toast(S.lang === 'en' ? q.why[1] : q.why[0]);
  if (typeof save === 'function') save();
  panelDirty = true; if (typeof renderHud === 'function') renderHud(); if (typeof DOCK !== 'undefined' && DOCK.redraw) DOCK.redraw();
  setTimeout(() => { if (fade) fade.classList.remove('on'); HOPUI.busy = false; }, 700);
}
$('hopBtn').onclick = hopOpen;
