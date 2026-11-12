// ---------- Hopp over resten av ruta: the fast-forward button and the card (HO2, steg 105; docs/planer/hopp.md) ----------
// Jonas 12.11.2026: «Jeg tenker selve knappen kan legges her på skjermen, og vises som et "fast forward"-symbol, nesten som en
// spoleknapp. Den skal være kontekstuell og kun komme opp når en rute er i gang.» The button stands in 3D on the right, under the
// camera and the cinema (#camBtn, #kinoBtn), only while a route is sailed (not on the operations plan, not by hand at the helm, not in
// the cinema's clean view or the chart). The card says where the hop goes, the real time saved and the price in kroner with 💎, or why
// it cannot be had; the hop itself is the core's (core/06j-hopp.js hopGo). HO3 (steg 106): the button shows where the shop sells
// (ui/10i-shop.js shopMode live or test, not off: no cloud on a public site, or the shop closed for the account, P5), and «Kjøp» is a
// purchase of the hop for the price of the minutes (the server's, shop_quote_hop); paid, the grant comes back (srvApply) and the hop is
// made (hopSpend). A hop kept in Kaiboden (the boat was elsewhere when the payment came) is offered on a later route it covers. The Admin
// app's switch (S.adm.hopp, for admins) still gives the button and a free hop, for testing.
const HOPUI = {busy:false, ms:null, open:0};
const hopAdm = () => !!(S.adm && S.adm.hopp && typeof adminOk === 'function' && adminOk());   // the Admin app's free hop
// (not while she stops or Autonav finds a way round, nor while the time the game was closed is still being played in: CATCH_LEFT)
const hopShown = () => { const b = S.boat, pl = S.plan;
  return !!((hopAdm() || (typeof shopMode === 'function' && shopMode() !== 'off')) && typeof G3 !== 'undefined' && G3.isActive() && pl && !pl.ops && !pl.p2 && !pl.halt && !pl.replan &&
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
    '<p class="hop-kr">' + (typeof realKr === 'function' ? realKr(q.kr) : '\u{1F48E} ' + q.kr + ' kr') + '</p>';
  // a hop kept in Kaiboden that covers this route (the shortest that does), else the purchase; the Admin app's switch hops for free
  const kept = (S.hopSrv || []).filter(x => x.min >= q.realMin).sort((a, b) => a.min - b.min)[0], m = typeof shopMode === 'function' ? shopMode() : 'off';
  let btn;
  if (kept){ h += '<p>' + hopL('Du har et hopp i Kaiboden for høyst ' + kept.min + ' minutter. Det brukes nå, uten ny betaling.', 'You have a hop kept in Kaiboden for at most ' + kept.min + ' minutes. It is used now, with no new payment.') + '</p>'; btn = hopL('Bruk hoppet fra Kaiboden', 'Use the hop from Kaiboden'); }
  else if (hopAdm()){ h += '<p class="hop-test">' + hopL('Admin: hoppet er gratis med testbryteren.', 'Admin: the hop is free with the test switch.') + '</p>'; btn = hopL('Hopp', 'Hop'); }
  else btn = shopLabel(q.kr);
  h += '<div class="btns"><button class="btn" data-close>' + hopL('Avbryt', 'Cancel') + '</button><button class="btn primary" id="hopGo">' + btn + '</button></div>' + (kept || hopAdm() ? '' : shopFine());
  modal(h);
  $('hopGo').onclick = kept ? () => hopSpend(kept.id) : hopAdm() ? () => hopPress() : () => {
    // (live: the price and the stop are kept for the purchase, the page goes to Stripe; test: given at once, as the other wares)
    SHOP.hopQ = {kr:q.kr, realMin:q.realMin}; $('modal').hidden = true;
    payBuy('hopp', () => hopPress(), {min:q.realMin, to:{x:q.w.x, y:q.w.y, port:q.w.port || null}});
  };
}
// the hop: the screen goes dark first (two frames, so the dark is drawn before the work), the map at the stop and the hop (hopGo), then
// every kind of pack the chart and the 3D view read round the stop, as the start along the coast loads them (08c-start.js), within
// HOPUI.packMs, and the screen comes back
HOPUI.packMs = 15000;
// paid: a hop bought or kept (whatever the weather, hopGo(true)); id: its grant, told used to the server once the hop is made (hop_use;
// kept in S.hopQ until the server has it, ui/10i-shop.js srvApply)
async function hopPress(paid, id){
  if (HOPUI.busy) return; HOPUI.busy = true; $('modal').hidden = true;
  const fade = $('hopFade'), t0 = performance.now(); let q = null;
  if (fade) fade.classList.add('on');
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try { q = await hopGo(!!paid); } catch (e){ console.error(e); }
  if (id != null && q && !q.why){ S.hopSrv = (S.hopSrv || []).filter(x => x.id !== id); const Q = S.hopQ || (S.hopQ = []); if (!Q.includes(id)) Q.push(id);
    if (typeof cloudRpc === 'function') cloudRpc('hop_use', {id}).then(() => { const i = S.hopQ.indexOf(id); if (i >= 0){ S.hopQ.splice(i, 1); if (typeof save === 'function') save(); } }).catch(e => console.error(e)); }
  if (id != null && q && q.why) toast(S.lang === 'en' ? 'The hop is kept in Kaiboden: ' + q.why[1] : 'Hoppet ligger i Kaiboden: ' + q.why[0]);
  if (q && !q.why && typeof mapPreload === 'function'){
    try { await Promise.race([mapPreload([S.boat.pos], [['sim', 8], ['chart', 8], ['view', 10], ['vec', 10], ['far', 30]]), new Promise(r => setTimeout(r, HOPUI.packMs))]); } catch (e){ console.warn('hop packs', e); }
  }
  HOPUI.ms = Math.round(performance.now() - t0);
  if (q && q.why && id == null) toast(S.lang === 'en' ? q.why[1] : q.why[0]);
  if (typeof save === 'function') save();
  panelDirty = true; if (typeof renderHud === 'function') renderHud(); if (typeof DOCK !== 'undefined' && DOCK.redraw) DOCK.redraw();
  setTimeout(() => { if (fade) fade.classList.remove('on'); HOPUI.busy = false; }, 400);
}
// a hop paid for or kept (srvApply when the payment comes, the card for one kept in Kaiboden)
function hopSpend(id){ return hopPress(true, id); }
$('hopBtn').onclick = hopOpen;
