// ---------- Hopp over resten av ruta: the fast-forward button and the card (HO2, steg 105; docs/planer/hopp.md) ----------
// Jonas 12.11.2026: «Jeg tenker selve knappen kan legges her på skjermen, og vises som et "fast forward"-symbol, nesten som en
// spoleknapp. Den skal være kontekstuell og kun komme opp når en rute er i gang.» The button stands in 3D on the right, under the
// camera and the cinema (#camBtn, #kinoBtn), only while a route is sailed (not on the operations plan, not by hand at the helm, not in
// the cinema's clean view or the chart). The card says where the hop goes, the real time saved and the price in kroner with 💎, or why
// it cannot be had; the hop itself is the core's (core/06j-hopp.js hopGo). HO3 (steg 106): the button shows where the shop sells
// (ui/10i-shop.js shopMode live or test, not off: no cloud on a public site, or the shop closed for the account, P5), and «Kjøp» is a
// purchase of the hop for the price of the minutes (the server's, shop_quote_hop); paid, the grant comes back (srvApply) and the hop is
// made (hopDeliver). A hop kept in Kaiboden (the boat was elsewhere when the payment came) is offered on a later route it covers. The Admin
// app's switch (S.adm.hopp, for admins) still gives the button and a free hop, for testing.
// pend: the hops paid for and waiting to be made (hopDeliver); waitMs: how long one waits for what passes by itself (hopWait)
const HOPUI = {busy:false, ms:null, open:0, pend:new Set(), waitMs:180000};
// the game is another page's or device's (ui/02-format-state.js TAB): nothing paid for is used here
const hopTabGone = () => typeof TAB !== 'undefined' && !!(TAB.lost || TAB.held);
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
    '<p>' + hopL('Dieselen, fisken, isen og folkene om bord går som om dere seilte. Fartstid og distanse får du bare ved å seile.', 'The diesel, the fish, the ice and the people aboard go as if you had sailed. Sea time and miles come only from sailing.') + '</p>';
  // a hop kept in Kaiboden that covers this route (the shortest that does), else the purchase; the Admin app's switch hops for free
  // (only as the server said it this session, SHOP.hopFresh: a save from another device may still list a hop used there)
  const kept = typeof SHOP !== 'undefined' && SHOP.hopFresh ? (S.hopSrv || []).filter(x => !HOPUI.pend.has(x.id) && hopCovers(x.min, q.realMin)).sort((a, b) => a.min - b.min)[0] : null;
  // (the price only for a hop to be bought: one kept in Kaiboden is paid for, and a price by it would read as a new payment)
  if (!kept) h += '<p class="hop-kr">' + (typeof realKr === 'function' ? realKr(q.kr) : '\u{1F48E} ' + q.kr + ' kr') + '</p>';
  let btn;
  if (kept){ h += '<p>' + hopL('Du har et hopp i Kaiboden for en tur på høyst ' + kept.min + ' minutter i virkeligheten. Det brukes nå, uten ny betaling.', 'You have a hop kept in Kaiboden for a trip of at most ' + kept.min + ' real minutes. It is used now, with no new payment.') + '</p>'; btn = hopL('Bruk hoppet fra Kaiboden', 'Use the hop from Kaiboden'); }
  else if (hopAdm()){ h += '<p class="hop-test">' + hopL('Admin: hoppet er gratis med testbryteren.', 'Admin: the hop is free with the test switch.') + '</p>'; btn = hopL('Hopp', 'Hop'); }
  else btn = shopLabel(q.kr);
  h += '<div class="btns"><button class="btn" data-close>' + hopL('Avbryt', 'Cancel') + '</button><button class="btn primary" id="hopGo">' + btn + '</button></div>' + (kept || hopAdm() ? '' : shopFine());
  modal(h);
  $('hopGo').onclick = kept ? () => hopSpend(kept.id, kept.min) : hopAdm() ? () => hopPress() : () => {
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
// kept in S.hopQ until the server has it, ui/10i-shop.js srvApply); min: the real minutes it was bought for (hopCovers)
async function hopPress(paid, id, min){
  if (HOPUI.busy) return;
  if (id != null && hopTabGone()){ hopKept(hopFate({}), min); return; }
  HOPUI.busy = true; $('modal').hidden = true;
  const fade = $('hopFade'), t0 = performance.now(); let q = null;
  if (fade) fade.classList.add('on');
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try { q = await hopGo(!!paid, id != null ? min : null); } catch (e){ console.error(e); }
  if (id != null && q && !q.why){ S.hopSrv = (S.hopSrv || []).filter(x => x.id !== id); const Q = S.hopQ || (S.hopQ = []); if (!Q.includes(id)) Q.push(id);
    // (false: the server had it used already, on another device; the hop is made, and that is counted)
    if (typeof cloudRpc === 'function') cloudRpc('hop_use', {id}).then(ok => { const i = S.hopQ.indexOf(id); if (i >= 0){ S.hopQ.splice(i, 1); if (typeof save === 'function') save(); }
      if (ok === false){ console.warn('hop_use: used before', id); if (typeof cloudEv === 'function') cloudEv('hop_twice', {id}); } }).catch(e => console.error(e)); }
  if (id != null && q && q.why) hopKept(q.why, min);
  if (q && !q.why && typeof mapPreload === 'function'){
    try { await Promise.race([mapPreload([S.boat.pos], [['sim', 8], ['chart', 8], ['view', 10], ['vec', 10], ['far', 30]]), new Promise(r => setTimeout(r, HOPUI.packMs))]); } catch (e){ console.warn('hop packs', e); }
  }
  HOPUI.ms = Math.round(performance.now() - t0);
  if (q && q.why && id == null) toast(S.lang === 'en' ? q.why[1] : q.why[0]);
  if (typeof save === 'function') save();
  panelDirty = true; if (typeof renderHud === 'function') renderHud(); if (typeof DOCK !== 'undefined' && DOCK.redraw) DOCK.redraw();
  setTimeout(() => { if (fade) fade.classList.remove('on'); HOPUI.busy = false; }, 400);
}
// a hop kept in Kaiboden, used from the card
function hopSpend(id, min){ return hopPress(true, id, min); }
// a hop paid for (the grant's data d: boat, min, to): null when it is made now, or once what passes by itself has passed (hopWait);
// else why it is kept in Kaiboden. Jonas 12.11.2026: «Så lenge betalingen har gått gjennom skal spillerene kunne teleportere seg frem
// til målet, uavhengig av været eller andre ting»: the weather never keeps it (hopGo(true)); the boat there already, another boat or
// another route, a leak, someone in the water, a tow, an anchor and the like do (docs/planer/hopp.md, «Når hoppet ikke kan gjøres»)
function hopFate(d){
  if (hopTabGone()) return ['Spillet er åpent et annet sted.', 'The game is open somewhere else.'];
  if (d.boat !== S.cur) return ['Du er om bord i en annen båt enn den hoppet ble kjøpt for.', 'You are aboard another boat than the one the hop was bought for.'];
  if (!S.plan || S.boat.status !== 'sailing') return ['Båten var fremme før betalingen kom.', 'The boat was there before the payment came.'];
  if (!hopMatch(d.to)) return ['Båten seiler en annen rute enn den hoppet ble kjøpt for.', 'The boat sails another route than the one the hop was bought for.'];
  return hopWait() ? null : hopWhy();
}
// the words for a hop kept in Kaiboden, in the log and on the screen
function hopKeptWords(why, min){
  return ['Hoppet ligger i Kaiboden: ' + why[0] + ' Det kan brukes én gang på en senere rute' + (min ? ' som tar høyst ' + min + ' minutter i virkeligheten' : '') + ': trykk ⏩ på ruta.',
    'The hop is kept in Kaiboden: ' + why[1] + ' It can be used once on a later route' + (min ? ' of at most ' + min + ' real minutes' : '') + ': tap ⏩ on the route.'];
}
function hopKept(why, min){ const w = hopKeptWords(why, min); log(w[0], w[1]); toast(hopL(w[0], w[1])); }
// a hop paid for, when the payment comes (srvApply): made now, or as soon as what passes by itself has passed (at most HOPUI.waitMs,
// and never while another hop is being made); else kept in Kaiboden, and the log says why
async function hopDeliver(id, d){
  if (HOPUI.pend.has(id)) return; HOPUI.pend.add(id); const t0 = Date.now();
  try {
    while ((hopWait() || HOPUI.busy) && Date.now() - t0 < HOPUI.waitMs && !hopTabGone()) await new Promise(r => setTimeout(r, 1000));
    const why = hopFate(d) || (hopWait() || HOPUI.busy ? ['Båten var ikke klar til å hoppe.', 'The boat was not ready to hop.'] : null);
    if (why){ hopKept(why, d.min); return; }
    HOPUI.pend.delete(id); await hopPress(true, id, d.min);
  } finally { HOPUI.pend.delete(id); }
}
$('hopBtn').onclick = hopOpen;
