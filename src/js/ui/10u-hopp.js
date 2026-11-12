// ---------- Hopp over resten av ruta: the fast-forward button, the card and the purchase (HO2–HO3, steg 105–106; docs/planer/hopp.md) ----------
// Jonas 12.11.2026: «Jeg tenker selve knappen kan legges her på skjermen, og vises som et "fast forward"-symbol, nesten som en
// spoleknapp. Den skal være kontekstuell og kun komme opp når en rute er i gang.» The button stands in 3D on the right, under the
// camera and the cinema (#camBtn, #kinoBtn), only while a route is sailed (not on the operations plan, not by hand at the helm, not in
// the cinema's clean view or the chart), and where the shop sells (shopMode live or test). Pressing it stops the boat where she is
// (core hopHoldOn; Jonas: «Når brukeren trykker på hopp-knappen stopper båten momentant som om den var fryst i tiden»), and the card
// says where the hop goes, the real time saved and the price in kroner with 💎, or why it cannot be had. «Kjøp» buys the hop for the
// price of the minutes (the server's, shop_quote_hop); paid, the grant comes back (srvApply) and the boat, still held, is hopped to the
// end of the route (hopDeliver). That is the service: nothing is owed after it, and a hop is sold only here (Jonas: «Hopp skal ikke
// selges i kaiboden, det skal kun selges per minutt når man trykker på knappen under seilas»; «Når spilleren har kommet fram til
// endepunktet av ruten ved hjelp av hoppet er tjenesten levert og spilleren skal ikke ha noe "hopp" tilgode»). The Admin app's switch
// (S.adm.hopp, for admins) still gives the button and a free hop, for testing.
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
function hopUi(){ hopHoldTick(); const btn = $('hopBtn'); if (!btn) return; const on = hopShown() || HOPUI.busy; if (btn.hidden === on) btn.hidden = !on; }
const hopL = (no, en) => S.lang === 'en' ? en : no;
const hopEsc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
// the card: open at once with «working it out», and filled when the dry run (a few hundred ms on a long route) is done, so the tap
// never freezes the screen before anything shows
function hopOpen(){
  if (HOPUI.busy) return;
  hopHoldOn(); HOPUI.card = true; HOPUI.payAt = 0;   // (the boat stops at once, before the card: the price is for where she stands)
  const n = ++HOPUI.open, title = '<h3>' + hopL('Hopp over resten av ruta', 'Skip the rest of the route') + '</h3>';
  modal(title + '<p class="hop-calc">' + hopL('Regner ut turen …', 'Working out the trip …') + '</p>');
  setTimeout(() => { if (n !== HOPUI.open || $('modal').hidden) return; hopCard(title, hopQuote(false)); }, 30);
}
function hopCard(h, q){
  // (no hop to be had: the boat goes on at once, so the card is never a free stop in a storm)
  if (q.why){ hopHoldOff(); modal(h + '<p>' + hopEsc(hopL(q.why[0], q.why[1])) + '</p><div class="btns"><button class="btn primary" data-close>' + hopL('Lukk', 'Close') + '</button></div>'); return; }
  const w = q.w, pt = w.port && portById(w.port), np = pt ? null : nearestPlace(w);
  h += '<p>' + (pt ? hopL('Til ', 'To ') + '<b>' + hopEsc(pt.name) + '</b>. ' : hopL('Til neste stopp på ruta, ', 'To the next stop on the route, ') + '<b>' + hopEsc(hopL(np.no, np.en)) + '</b>. ') +
    hopL('Du sparer ', 'You save ') + '<b>' + hopSaved(q.real, S.lang === 'en') + '</b>' + hopL(' og er fremme med en gang.', ' and are there at once.') + '</p>' +
    '<p>' + hopL('Båten ligger stille mens du bestemmer deg. Dieselen, fisken, isen og folkene om bord går som om dere seilte. Fartstid og distanse får du bare ved å seile.', 'The boat lies still while you decide. The diesel, the fish, the ice and the people aboard go as if you had sailed. Sea time and miles come only from sailing.') + '</p>' +
    '<p class="hop-kr">' + (typeof realKr === 'function' ? realKr(q.kr) : '\u{1F48E} ' + q.kr + ' kr') + '</p>';
  let btn;
  if (hopAdm()){ h += '<p class="hop-test">' + hopL('Admin: hoppet er gratis med testbryteren.', 'Admin: the hop is free with the test switch.') + '</p>'; btn = hopL('Hopp', 'Hop'); }
  else btn = shopLabel(q.kr);
  h += '<div class="btns"><button class="btn" data-close>' + hopL('Avbryt', 'Cancel') + '</button><button class="btn primary" id="hopGo">' + btn + '</button></div>' + (hopAdm() ? '' : shopFine());
  modal(h);
  $('hopGo').onclick = hopAdm() ? () => hopPress() : () => {
    // (live: the hold is kept for the payment, the price and the stop go with the purchase and the page goes to Stripe; test: given at
    // once, as the other wares)
    // (shopGo marks itself busy at once: the payment page is being opened, and the hold is kept for it; a guest asked to register, or
    // the shop closed, ends it)
    const hd = S.boat.hopHold; SHOP.hopQ = {kr:q.kr, realMin:q.realMin}; HOPUI.card = false; $('modal').hidden = true;
    payBuy('hopp', () => hopPress(), {min:q.realMin, to:{x:q.w.x, y:q.w.y, port:q.w.port || null}});
    if (hd && S.boat.hopHold === hd){ if (SHOP.busy){ hd.pay = true; hd.until = S.t + HOP.holdReal * GAME_RATE; HOPUI.payAt = Date.now(); } else if (!HOPUI.busy) hopHoldOff(); }
  };
}
// the hold ends when it is not used: the card closed with no purchase, the payment page not opened after all (shopGo said why), or
// the page hidden with the card open (each frame, hopUi; and visibilitychange below)
function hopHoldTick(){
  const hd = S.boat && S.boat.hopHold; if (!hd || HOPUI.busy) { if (HOPUI.card && $('modal').hidden) HOPUI.card = false; return; }
  if (HOPUI.card && $('modal').hidden){ HOPUI.card = false; if (!hd.pay) hopHoldOff(); }
  else if (hd.pay && HOPUI.payAt && !SHOP.busy && Date.now() - HOPUI.payAt > 1500){ HOPUI.payAt = 0; hopHoldOff(); }
  // (paid for and waiting for the payment's answer: asked every 20 s while the page is shown, a webhook slower than shopStart's tries)
  else if (hd.pay && !HOPUI.payAt && document.visibilityState === 'visible' && Date.now() - (HOPUI.askAt || 0) > 20000 && typeof shopClaim === 'function'){ HOPUI.askAt = Date.now(); shopClaim(); }
}
// back from Stripe by the browser's own back button with the page kept (bfcache): the payment page was left, the purchase not made
window.addEventListener('pageshow', e => { if (!e.persisted) return; if (typeof SHOP !== 'undefined') SHOP.busy = false;
  const hd = S.boat && S.boat.hopHold; if (hd && hd.pay && HOPUI.payAt){ HOPUI.payAt = 0; toast(hopL('Båten ligger stille og venter på betalingen for hoppet. Vil du seile videre, trykk ⏩ og «Avbryt».', 'The boat lies still, waiting for the payment for the hop. To sail on, tap ⏩ and «Cancel».')); } });
document.addEventListener('visibilitychange', () => { const hd = S.boat && S.boat.hopHold;
  if (document.visibilityState === 'hidden' && hd && !hd.pay && !HOPUI.busy){ hopHoldOff(); if (HOPUI.card){ HOPUI.card = false; $('modal').hidden = true; } } });
// the hop: the screen goes dark first (two frames, so the dark is drawn before the work; a timer too, since a hidden page draws no
// frames), the map at the stop and the hop (hopGo), then every kind of pack the chart and the 3D view read round the stop, as the start
// along the coast loads them (08c-start.js), within HOPUI.packMs, and the screen comes back
HOPUI.packMs = 15000;
// paid: a hop bought (whatever the weather, hopGo(true)); id: its grant, told used to the server once the hop is made (hopUse); min: the
// real minutes it was bought for (hopCovers); quiet: from the delivery (hopDeliver), which says itself why a hop was not made and leaves
// the receipt open. Returns the hop's answer (null when another hop is being made)
async function hopPress(paid, id, min, quiet){
  if (HOPUI.busy) return null;
  HOPUI.busy = true; HOPUI.card = false; if (!quiet) $('modal').hidden = true;
  const fade = $('hopFade'), t0 = performance.now(); let q = null;
  if (fade) fade.classList.add('on');
  await Promise.race([new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))), new Promise(r => setTimeout(r, 120))]);
  try { q = await hopGo(!!paid, id != null ? min : null); } catch (e){ console.error(e); q = {why:['Hoppet gikk ikke. Prøv igjen.', 'The hop did not go through. Try again.']}; }
  if (id != null && q && !q.why) hopUse(id);
  if (q && !q.why && typeof mapPreload === 'function'){
    try { await Promise.race([mapPreload([S.boat.pos], [['sim', 8], ['chart', 8], ['view', 10], ['vec', 10], ['far', 30]]), new Promise(r => setTimeout(r, HOPUI.packMs))]); } catch (e){ console.warn('hop packs', e); }
  }
  HOPUI.ms = Math.round(performance.now() - t0);
  if (q && q.why && !quiet){ toast(S.lang === 'en' ? q.why[1] : q.why[0]); if (id == null) hopHoldOff(); }
  if (typeof save === 'function') save();
  panelDirty = true; if (typeof renderHud === 'function') renderHud(); if (typeof DOCK !== 'undefined' && DOCK.redraw) DOCK.redraw();
  setTimeout(() => { if (fade) fade.classList.remove('on'); HOPUI.busy = false; }, 400);
  return q;
}
// the server told a hop is used (hop_use), once at a time per hop: kept in S.hopQ until it has answered (srvApply asks again for those
// not answered). false: it was used already, on another device; the hop is made, and that is counted (hop_twice)
HOPUI.fly = new Set();
function hopUse(id){
  const Q = S.hopQ || (S.hopQ = []); if (!Q.includes(id)) Q.push(id);
  const D = S.hopDone || (S.hopDone = []); if (!D.includes(id)){ D.push(id); if (D.length > 50) D.splice(0, D.length - 50); }
  if (HOPUI.fly.has(id) || typeof cloudRpc !== 'function') return; HOPUI.fly.add(id);
  cloudRpc('hop_use', {id}).then(ok => { const i = (S.hopQ || []).indexOf(id); if (i >= 0){ S.hopQ.splice(i, 1); if (typeof save === 'function') save(); }
    if (ok === false){ console.warn('hop_use: used before', id); if (typeof cloudEv === 'function') cloudEv('hop_twice', {id}); } })
    .catch(e => console.error(e)).finally(() => HOPUI.fly.delete(id));
}
// a hop paid for that could not be made (the hold ended before the payment came, the route changed, someone in the water): nothing is
// owed in the game; the purchase is marked for a refund on the server (hop_void: the grant is never made after it, and the admin page
// lists it, admin_hop_void, for a refund at Stripe; shop_refund then takes it back), and the log, Meldinger and the screen say so. Once
// per grant; never one made here (S.hopDone)
function hopVoid(id, why){
  if ((S.hopDone || []).includes(id)) return;
  const V = S.hopVoid || (S.hopVoid = []); if (V.includes(id)) return; V.push(id); if (V.length > 50) V.splice(0, V.length - 50);
  if (typeof cloudRpc === 'function') cloudRpc('hop_void', {id, why:why[1]}).catch(e => console.error(e));
  const no = 'Hoppet ble ikke gjort: ' + why[0] + ' Kjøpet er merket, og pengene betales tilbake.', en = 'The hop was not made: ' + why[1] + ' The purchase is marked, and the money is paid back.';
  log(no, en); toast(hopL(no, en)); if (typeof msg === 'function') msg('Det Store Blå', no, en);
  if (typeof cloudEv === 'function') cloudEv('hop_void', {id, why:why[1]});
  if (typeof save === 'function') save();
}
// a hop paid for, when the payment comes (srvApply): made from where the boat is held, at once or as soon as what passes by itself has
// passed (hopWait, the map at the stop not come yet; at most HOPUI.waitMs, and never while another hop is being made); else hopVoid.
// Another page or device holding the game makes it there (the hold is in the save)
async function hopDeliver(id, d){
  if (HOPUI.pend.has(id)) return; HOPUI.pend.add(id); const t0 = Date.now(), left = () => Date.now() - t0 < HOPUI.waitMs;
  const not = ['Båten lå ikke lenger stille på ruta da betalingen kom.', 'The boat was no longer lying still on the route when the payment came.'];
  try {
    for (;;){
      while ((hopWait() || HOPUI.busy) && left() && !hopTabGone()) await new Promise(r => setTimeout(r, 1000));
      if (hopTabGone()) return;
      const q = hopHoldFor(d) ? await hopPress(true, id, d.min, true) : {why:not};
      if (q && !q.why) return;
      if ((!q || q.map || hopWait()) && left()){ await new Promise(r => setTimeout(r, 3000)); continue; }
      if (hopTabGone()) return;
      hopVoid(id, q && q.why || not); hopHoldOff(); return;
    }
  } finally { HOPUI.pend.delete(id); }
}
$('hopBtn').onclick = hopOpen;
