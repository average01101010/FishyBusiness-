// ===== THE SHOP (05.10.2026; supabase/migrations/20261006040000_shop.sql, supabase/functions/shop-checkout and stripe-webhook) =====
// Haill, trim and the yard done now are bought for real money (Jonas: «hele spillet skal være free-to-play, men med betalte boostere i
// form av haill-appen og trim-appen og betaling for å hoppe over verkstedtid»). Signed in on the game's site, a buy button asks
// shop-checkout for a Stripe Checkout page and goes straight there; the line under it says the delivery is at once and the right of
// withdrawal then ends (angrerettloven § 22 n). Stripe sends the player back with ?kjop=<session>; by then the webhook has booked the purchase
// as a grant, or soon will (the game asks a few times). The game gives what is granted (shopGive), keeps the ids it has given
// (S.shopGiven, so nothing is given twice) and tells the server it is done. The prices the game shows are its own (HAILL, BOOSTS,
// YARD_NOW_NOK); what is charged is the database's (products), and the two must agree.
// Where there is no cloud (the artifact, the tests) the buttons give it at once, as a test without payment; so does the Admin's game
// until the shop is set up. Signed in elsewhere, the shop is «on sale soon» until Stripe is set up. On the game's own sites with the
// cloud off (#nocloud, no network, GitHub Pages) the shop is closed, never free (Ø6 funn 5, 05.11.2026).
// An account made after the server's switch was turned (P5, 10.11.2026: the first players come before the payment is ready for
// strangers; tm_hello's shop:false, CLOUD.shopOff) sees «on sale soon» too, and the server gives it no quote.
// Haill from the server is kept there until it is switched on (HS2, 10.11.2026, docs/planer/haill-saldo.md;
// supabase/migrations/20261110180000_haill_use.sql): shop_pending answers the open grants and the haill that is delivered and not used
// (held), S.haillSrv is replaced by that at every claim, and switching one on tells the server (haillTell, haill_use), now or when the
// network is back. A server from before the migration (haill_use answers 404) gets the game as it was: the haill into S.haillInv.
// Trim, Skippertak and the yard done now are used when they are delivered, so a save that goes on without them (two devices in
// conflict, an earlier save taken back, an upload that never arrived, a new game) had lost what was paid for. Now shop_pending also
// answers those delivered the last 7 days (held, with done_at; HS3, 11.11.2026, supabase/migrations/20261111120000_shop_back.sql), and
// one that is not in the save's S.shopGiven is given again with only the time that is left (shopBack). A server from before that
// migration answers none of them, and nothing is given again.
// The server is the truth for haill and everything bought (HS4, 11.11.2026, supabase/migrations/20261111140000_haill_srv.sql; Jonas
// 10.11.2026: «Spillere skal ikke kunne redigere sin egen lagring og gi seg selv så mye haill eller andre varer de selv vil»): the
// save is only a copy of the haill in store, the haill aboard, the trim on every boat, Skippertak, the credit for the yard done now
// and the paid paint designs. At every start with a network and every claim the game asks shop_state() and writes the copy over
// with the answer (shopClaim4, srvApply), so what a player writes into the save is gone. The pub's wheel is drawn on the server
// (pubAsk), the haill of chapter 2 is a grant asked for once (achHaillAsk), and the game's own numbers from before are made into
// grants once, within the server's cap (srvImport). A server from before the migration (shop_state answers 404) gets the game as it
// was after HS3, all of it. Where there is no cloud (the artifact, the tests) all is as before too; on the game's own sites with the
// cloud off, what the server said last stands and nothing new is won (srvOnly).
const SHOP = {ready:null, busy:false, ret:null, hs4:null, gen:0};
const SHOP_PRODUCT = {haill:'haill', luksus:'luksus', pump:'trim_pump', ic:'trim_ic', turbo:'trim_turbo', yard:'verft_na', sk_light:'skip_light', sk_std:'skip', sk_max:'skip_max',
  des_ripe:'des_ripe', des_totone:'des_totone', des_vann:'des_vann', des_stripe:'des_stripe', des_lakk:'des_lakk', des_flagg:'des_flagg', des_reg:'des_reg', des_logo:'des_logo',   // the paint designs (ui/10j-paint.js)
  hopp:'hopp'};   // the hop over the rest of a route (HO3, ui/10u-hopp.js): the price is the server's for the minutes (shop_quote_hop)
const shopFn = () => CLOUD_CFG.supabaseUrl.replace(/\/$/, '') + '/functions/v1/shop-checkout';
const shopL = (no, en) => S.lang === 'en' ? en : no;
function shopMode(){
  if (!CLOUD.on) return pubHost() ? 'off' : 'test';
  if (CLOUD.user && SHOP.ready) return CLOUD.shopOff ? 'off' : 'live';
  return adminOk() ? 'test' : 'off';
}
// a price in real money, marked with 💎 so it never looks like the game's kroner (a player could not tell them apart, 06.10.2026)
function realKr(nok){ return '<span class="realkr" title="' + shopL('Ekte penger', 'Real money') + '">\u{1F48E} ' + nok + ' kr</span>'; }
// the label of a buy button for a price in kroner
function shopLabel(nok){
  const m = shopMode();
  return m === 'live' ? shopL('Kjøp · ', 'Buy · ') + realKr(nok) : m === 'test' ? shopL('Kjøp (test, ingen betaling)', 'Buy (test, no payment)') : shopL('Snart i salg', 'On sale soon');
}
// what a key is and costs, for the consent and the receipt in the log (g: the grant, for a price that is the purchase's own: the hop)
function shopWhat(k, g){
  if (HAILL[k]) return {name:HAILL[k][S.lang === 'en' ? 'en' : 'no'], nok:HAILL[k].nok};
  if (BOOSTS[k]) return {name:'Trim: ' + BOOSTS[k][S.lang === 'en' ? 'en' : 'no'], nok:BOOSTS[k].nok};
  if (/^sk_/.test(k) && SKIP[k.slice(3)]){ const X = SKIP[k.slice(3)]; return {name:X[S.lang === 'en' ? 'en' : 'no'], nok:X.nok}; }   // Skippertak (core/15-energy.js)
  if (/^des_/.test(k)){ const N = PAINT.DNAME[k.slice(4)] || ['', '']; return {name:(k === 'des_flagg' || k === 'des_reg' ? '' : shopL('Malingsdesign: ', 'Paint design: ')) + shopL(N[0], N[1]), nok:PAINT.nok(k.slice(4))}; }
  // (back from Stripe the card's SHOP.hopQ is gone with the page: the grant has the minutes and the price paid)
  if (k === 'hopp'){ const d = g && g.data || {}, q = d.kr != null ? {kr:d.kr, realMin:d.min} : SHOP.hopQ;
    return {name:shopL('Hopp over resten av ruta', 'Skip the rest of the route') + (q && q.realMin ? ' (' + q.realMin + ' min)' : ''), nok:q ? q.kr : HOP.min}; }
  return {name:shopL('Verftet ferdig nå', 'The yard done now'), nok:YARD_NOW_NOK};
}
// a buy button: at once in a test, straight to Stripe when the shop is live (Jonas 05.10.2026: «Gjør dette på en intuitiv måte som tar
// fokuset bort fra handlingen, vi må tenke salg salg salg»): no dialog in between. The consent to delivery at once is the line under
// the button (shopFine) and the same words by Stripe's pay button (shop-checkout custom_text)
function payBuy(k, give, extra){
  if (typeof isGuest === 'function' && isGuest()){ guestAsk('shop'); return; }   // real money only on an account (ui/10f-cloud.js)
  const m = shopMode();
  if (m === 'test'){ give(); return; }
  if (m === 'off'){ toast(shopL('Butikken åpner snart.', 'The shop opens soon.')); return; }
  shopGo(k, extra);
}
// the small line under a buy button when the shop is live
function shopFine(){
  return shopMode() === 'live' ? '<p class="ph-note shop-fine">' + shopL('\u{1F48E} betyr ekte penger, betalt med kort. ', '\u{1F48E} means real money, paid by card. ') + shopL('Leveres i spillet med én gang. Når du kjøper, ber du om det, og angreretten faller da bort.', 'Delivered in the game at once. By buying you ask for that, and the right of withdrawal then ends.') + '</p>' : '';
}
async function shopGo(k, extra){
  if (SHOP.busy) return; SHOP.busy = true; toast(shopL('Åpner betalingen …', 'Opening the payment …'));
  try {
    const tok = await cloudToken(); if (!tok) throw new Error(shopL('du er ikke logget inn', 'you are not signed in'));
    const r = await fetch(shopFn(), {method:'POST', headers:{'Content-Type':'application/json', apikey:CLOUD_CFG.supabaseAnon, Authorization:'Bearer ' + tok},
      body:JSON.stringify(Object.assign({product:SHOP_PRODUCT[k], boat:S.cur, lang:S.lang, back:location.origin + location.pathname}, extra || {}))});
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(j.error === 'unavailable' || r.status >= 500 ? shopL('betalingen er ikke tilgjengelig akkurat nå. Prøv igjen senere.', 'the payment is not available just now. Try again later.') : j.error || String(r.status));
    save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true);   // the game as it is, before the page goes to Stripe
    location.href = j.url;
  } catch (e){
    SHOP.busy = false;
    toast(shopL('Kunne ikke åpne betalingen: ', 'Could not open the payment: ') + (e.message || e));
  }
}
// the yard done now, on the boat aboard: the yard jobs running are finished, or with none a credit is kept. Returns the jobs finished
function shopYard(){ let n = 0; for (const j of S.jobs || []) if (YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t){ j.until = S.t; n++; }
  if (!n) S.yardCredit = (S.yardCredit || 0) + 1; return n; }
// what the server has granted and the game has not given yet: given now, and the server told. Each gift leaves a line for the
// confirmation (SHOP.rc, shopThanks): what it did, and on which boat
function shopGive(g, srv){
  const d = g.data || {}, v = (S.fleet || []).find(x => x.id === d.boat) || curVessel(), rc = SHOP.rc || (SHOP.rc = []), say = (no, en) => rc.push({g, no, en});
  if (d.give === 'haill' && HAILL[d.type]){ if (srv) giveHaill(d.type, 'shop', g.id); else giveHaill(d.type, 'shop'); say('Ligger i Haill-appen. Trykk «Aktiver» når du vil bruke den.', 'It is in the Luck app. Tap «Switch on» when you want it.'); return HAILL[d.type][S.lang === 'en' ? 'en' : 'no']; }
  // (the same kind as the one on adds its hours, another kind takes its place: core trimSet)
  if (d.give === 'trim' && BOOSTS[d.k]) return withVessel(v, () => { const B = BOOSTS[d.k], w = trimWords(d.k, trimSet(d.k)); log(w.no, w.en); say(w.no, w.en); return B[S.lang === 'en' ? 'en' : 'no']; });
  // (nothing left to finish when it came, the job done during the payment: kept as a credit for the next yard job, YARD_NOW_MIN)
  if (d.give === 'yard') return withVessel(v, () => { const n = shopYard();
    const no = n ? 'Verftet gjorde ' + (n > 1 ? n + ' jobber' : 'jobben') + ' på «' + S.boatName + '» ferdig med én gang.' : 'Jobben på «' + S.boatName + '» ble ferdig før kjøpet kom fram. «Ferdig nå» ligger klar og gjør neste verftsjobb ferdig med én gang.',
      en = n ? 'The yard finished ' + (n > 1 ? n + ' jobs' : 'the job') + ' on the «' + S.boatName + '» straight away.' : 'The job on the «' + S.boatName + '» was done before the purchase came. «Done now» is kept and finishes the next yard job at once.';
    log(no, en); say(no, en); return shopL('Verftet er ferdig', 'The yard is done'); });
  if (d.give === 'skip' && SKIP[d.k]){ const nm = giveSkip(d.k);   // Skippertak, for the whole fleet (core/15-energy.js)
    if (nm){ const h = Math.max(0, (S.skip.until - boostT()) / 60), r = fmt(h / GAME_RATE, h / GAME_RATE < 10 ? 1 : 0); say('Du og mannskapet på hele flåten er uthvilt i ' + fmt(h, 0) + ' timer (' + r + ' timer i virkeligheten), også på driftsplanene.', 'You and the crews of the whole fleet are rested for ' + fmt(h, 0) + ' hours (' + r + ' hours in real life), on the operations plans too.'); }
    return nm; }
  // (a paint design, yours on every boat, ui/10j-paint.js; what was tried goes on the boat it was bought on, d.boat)
  if (d.give === 'cos') return withVessel(v, () => { const nm = giveCos(d.k);
    if (nm) say('Ditt for godt, på alle båtene dine. Du finner det i Malerverkstedet.', 'Yours for good, on all your boats. You find it in the paint shop.');
    return nm; });
  return null;
}
// the confirmation (Jonas 06.11.2026, Tony's test: «det må ikke være tvil om at salget har gått gjennom»): a window from Det Store Blå
// with what was bought, the price and what it did now, and the same in Meldinger to keep. A gift from us (data.comp: a correction) says
// so, without a price. It waits while another window is open
function shopThanks(rc){
  const L = shopL, gift = rc.every(r => (r.g.data || {}).comp);
  const its = rc.map(r => { const k = Object.keys(SHOP_PRODUCT).find(x => SHOP_PRODUCT[x] === r.g.product), w = k ? shopWhat(k, r.g) : null;
    return {nm:w ? w.name : String(r.g.product || ''), nok:(r.g.data || {}).comp ? 0 : w ? w.nok : 0, no:r.no, en:r.en}; });
  const head = gift ? ['En gave fra Det Store Blå', 'A gift from Det Store Blå'] : ['Takk for kjøpet!', 'Thank you for your purchase!'];
  const lead = gift ? ['Vi har gitt deg dette, og det er levert i spillet:', 'We have given you this, and it is delivered in the game:'] : ['Betalingen er gjennomført, og kjøpet er levert i spillet:', 'The payment went through, and the purchase is delivered in the game:'];
  msg('Det Store Blå', head[0] + ' ' + its.map(x => x.nm + (x.nok ? ' (\u{1F48E} ' + x.nok + ' kr)' : '') + ': ' + x.no).join(' '), head[1] + ' ' + its.map(x => x.nm + (x.nok ? ' (\u{1F48E} ' + x.nok + ' kr)' : '') + ': ' + x.en).join(' '));
  const html = '<div class="ob shoprc"><p class="reg-from">Det Store Blå</p><h2>' + L(head[0], head[1]) + '</h2><p>' + L(lead[0], lead[1]) + '</p>' +
    its.map(x => '<p class="shoprc-it"><b>' + x.nm + '</b>' + (x.nok ? ' · ' + realKr(x.nok) : '') + '<br>' + L(x.no, x.en) + '</p>').join('') +
    '<p class="note">' + L('Bekreftelsen ligger også i Meldinger.', 'The confirmation is in Messages too.') + '</p><div class="btns"><button class="btn p" data-close>' + L('Fint!', 'Great!') + '</button></div></div>';
  const show = () => { const m = document.getElementById('modal'); if (m && !m.hidden){ setTimeout(show, 2000); return; } modal(html); };
  setTimeout(show, 300);
}
// Bought, delivered and not in this save (HS3): given again, in the order they were delivered, as if each came on then. A trim goes on
// the boat it was bought for (not in the fleet: not given), with the end it had: boostBack, never longer than what was bought, and
// nothing when the end has passed. Skippertak the same, for the whole fleet. The yard done now finishes the yard jobs running, or
// is kept as a credit. No new confirmation: one line in the log and in Meldinger, and the event shop_back. Returns the ids that are
// dealt with (given, or with nothing left to give); one whose boat is not in this save, or of a kind this page does not know, is not
// among them and is asked about again at the next claim, never marked as given and lost
function shopBack(list){
  const ms = g => Date.parse(g.done_at), now = boostT(), wn = worldNow(), at = g => backT(ms(g), wn, S.t, WCLOCK.on), hrs = e => Math.max(0, (e - now) / 60);
  const L = list.filter(g => isFinite(ms(g))).sort((a, b) => ms(a) - ms(b) || a.id - b.id), ev = (g, h) => { if (typeof cloudEv === 'function') cloudEv('shop_back', {id:g.id, product:g.product, h:Math.round(h * 10) / 10}); };
  const tell = (no, en) => { no = 'Kjøpet ditt er lagt inn igjen: ' + no; en = 'Your purchase is back in the game: ' + en; log(no, en); msg('Det Store Blå', no, en); };
  const left = h => { const r = h / GAME_RATE; return [fmt(h, h < 10 ? 1 : 0) + ' timer igjen (' + fmt(r, r < 10 ? 1 : 0) + ' timer i virkeligheten)', fmt(h, h < 10 ? 1 : 0) + ' hours left (' + fmt(r, r < 10 ? 1 : 0) + ' hours in real life)']; };
  const did = new Set();
  // trim, boat by boat (the boat is known by its id only)
  const boats = new Map(); for (const g of L){ const d = g.data || {}; if (d.give !== 'trim' || !BOOSTS[d.k]) continue; const v = (S.fleet || []).find(x => x.id === d.boat); if (!v) continue; if (!boats.has(v)) boats.set(v, []); boats.get(v).push(g); }
  for (const [v, gs] of boats) withVessel(v, () => { for (const g of gs) did.add(g.id); const b = S.boat, on = b.trim && BOOSTS[b.trim.k] ? {k:b.trim.k, t0:b.trim.t0, until:trimUntil(b)} : null;
    const c = boostBack(on, gs.map(g => ({k:g.data.k, h:BOOSTS[g.data.k].h, at:at(g)})), false);
    if (!c || !(c.until > now) || (on && on.k === c.k && on.until === c.until)) return;
    trimBack(c); const B = BOOSTS[c.k], h = hrs(c.until), w = left(h), g = gs.filter(x => x.data.k === c.k).pop() || gs[gs.length - 1];
    tell(B.no + ' på «' + S.boatName + '», ' + w[0] + '. Toppfart ' + fmt(BOAT.vmax, 1) + ' knop.', B.en + ' on the «' + S.boatName + '», ' + w[1] + '. Top speed ' + fmt(BOAT.vmax, 1) + ' knots.'); ev(g, h); });
  // Skippertak, one for the whole fleet
  const sk = L.filter(g => (g.data || {}).give === 'skip' && SKIP[g.data.k]);
  for (const g of sk) did.add(g.id);
  if (sk.length){ const on = S.skip && S.skip.until != null ? {k:S.skip.k, t0:S.skip.t0, until:S.skip.until} : null, c = boostBack(on, sk.map(g => ({k:g.data.k, h:SKIP[g.data.k].h, at:at(g)})), true);
    if (c && c.until > now && !(on && on.until === c.until) && giveSkip(c.k, c.until, c.t0)){ const X = SKIP[c.k], h = hrs(c.until), w = left(h);
      tell(X.no + ', ' + w[0] + ' for deg og mannskapet på hele flåten.', X.en + ', ' + w[1] + ' for you and the crews of the whole fleet.'); ev(sk[sk.length - 1], h); } }
  // the yard done now
  for (const g of L){ const d = g.data || {}; if (d.give !== 'yard') continue; const v = (S.fleet || []).find(x => x.id === d.boat) || curVessel();
    withVessel(v, () => { const k = shopYard();
      if (k) tell('verftet gjorde ' + (k > 1 ? k + ' jobber' : 'jobben') + ' på «' + S.boatName + '» ferdig med én gang.', 'the yard finished ' + (k > 1 ? k + ' jobs' : 'the job') + ' on the «' + S.boatName + '» straight away.');
      else tell('«Ferdig nå» ligger klar og gjør neste verftsjobb ferdig med én gang.', '«Done now» is kept and finishes the next yard job at once.'); });
    ev(g, 0); did.add(g.id); }
  return did;
}
// does the server keep the haill (the migration is run)? Asked once, with an id no grant has: true or false from the new server, 404
// from the old one. Null when it cannot be known now (no network): then the haill waits on the server
async function haillProbe(){
  if (SHOP.hs != null) return SHOP.hs;
  try { const r = await cloudRpc('haill_use', {id:0}); return SHOP.hs = typeof r === 'boolean'; }
  catch (e){ return / 404$/.test(String(e && e.message)) ? (SHOP.hs = false) : null; }
}
// the server told of the haill switched on here (S.haillQ), one by one and each until it has answered: at once when it is switched on
// (now: the game is saved first, so the id is never shown again), at every claim and when the network is back. «false» is a haill the
// server had as used already, on another device with no network: it is not taken from the player (V1 A), only counted (haill_twice)
async function haillTell(now){
  if (now){ SHOP.gen++; save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true); }
  if (!CLOUD.on || !CLOUD.user) return;
  if (SHOP.telling) return SHOP.telling;   // (one at a time, and whoever asks meanwhile waits for the same answer)
  return SHOP.telling = haillTell1().finally(() => { SHOP.telling = null; });
}
async function haillTell1(){
  try {
    // (HS4: does the server take the minute? Asked once, with an id no grant has. Until it is known nothing is told: a haill switched
    // on with no network must go with its own minute, never the minute the network came back)
    if (SHOP.hs4 == null){ try { const r = await cloudRpc('haill_on', {id:0, t0:0}); SHOP.hs4 = !!(r && typeof r.ok === 'boolean'); } catch (e){ if (/ 404$/.test(String(e && e.message))) SHOP.hs4 = false; else return; } }
    while ((S.haillQ || []).length){ const id = S.haillQ[0]; let r;
      // (HS4: with the minute it was switched on, on the one clock; the server takes its own minute when it is later or not sent.
      // A haill the server says is gone, taken back or never there, is taken off the boat; one used before is the server's to say)
      const t0 = WCLOCK.on && S.haillT && isFinite(S.haillT[id]) ? S.haillT[id] : null;
      try { r = SHOP.hs4 === true ? await cloudRpc('haill_on', {id, t0}) : await cloudRpc('haill_use', {id}); } catch (e){ break; }
      const q = S.haillQ || [], i = q.indexOf(id); if (i >= 0) q.splice(i, 1); if (S.haillT) delete S.haillT[id];
      const twice = r === false || (r && r.ok === false && r.why === 'used'), gone = !!(r && r.ok === false && r.why === 'gone');
      if (twice && typeof cloudEv === 'function') cloudEv('haill_twice', {id});
      if (gone){ if (S.haill && S.haill.id === id){ S.haill = null; log('Haillen fantes ikke lenger på kontoen din og er tatt bort.', 'The luck was no longer on your account and has been taken away.'); }
        if (typeof cloudEv === 'function') cloudEv('haill_gone', {id}); }
      save(); }
    // (the credits for the yard done now used here, HS4 yard_use; whatever the server answers, it is told)
    while ((S.yardQ || []).length){ const id = S.yardQ[0];
      try { await cloudRpc('yard_use', {id}); } catch (e){ break; }
      const q = S.yardQ || [], i = q.indexOf(id); if (i >= 0) q.splice(i, 1); save(); } }
  catch (e){ console.error(e); }
}
// ---- HS4: the server is the truth ----
// Is what the server keeps only the server's to give here? With the cloud and a server that has HS4 (or not asked yet): yes. On the
// game's own sites with the cloud off (#nocloud, no network, GitHub Pages): yes, and nothing new is won. Where there is no cloud
// (the artifact, the tests): no, the game gives it itself as before
function srvOnly(){ return CLOUD.on ? !!CLOUD.user && SHOP.hs4 !== false : pubHost(); }
// the pub's wheel (ui/09-hand-fishing.js round): the server's answer {ok, k, id} or {ok:false, why}; null with no network; undefined
// from a server before HS4 (the game draws itself, as before)
async function pubAsk(){
  if (!CLOUD.on || !CLOUD.user) return null;
  try { const r = await cloudRpc('pub_spin', {}); if (r && typeof r.ok === 'boolean'){ SHOP.hs4 = true; return r; } return SHOP.hs4 === false ? undefined : null; }
  catch (e){ if (/ 404$/.test(String(e && e.message))){ SHOP.hs4 = false; return undefined; } return null; }
}
// the haill of chapter 2 (core/09f-merker.js achChapter): true when the server gives it (asked now, or at the next claim when there
// is no answer), false when the game gives it itself
function achHaillAsk(){
  if (!srvOnly()) return false;
  S.achH = 1; setTimeout(() => { if (typeof shopClaim === 'function') shopClaim(); }, 0); return true;
}
// a credit for the yard done now was used (core/05-vessels.js vesselStep): the oldest of the server's is told as used
function yardUsed(){
  const ys = S.yardSrv; if (!ys || !ys.length) return;
  (S.yardQ || (S.yardQ = [])).push(ys.shift()); SHOP.gen++; setTimeout(() => haillTell(true), 0);
}
// The game's own numbers from before HS4 made into the server's, once per account (haill_import): the haill in S.haillInv, the
// credits in S.yardCredit and the haill aboard that the server does not know. A haill from the server that went into the numbers
// (a page or a server from before HS2, S.haillOld) and is still unused there, stays there and is taken out of the count sent, so
// it is never counted twice and never lost to the cap. Whatever the server
// answers, the numbers are gone after: the server gave what its cap allows, or the account was brought over before. False when the
// server could not be asked now (the numbers stand, and it is tried again at the next claim)
async function srvImport(st){
  haillInit();
  const dbl = {}; for (const g of st.list) if (g.held && (g.data || {}).give === 'haill' && S.haillOld.includes(g.id)) dbl[g.data.type] = (dbl[g.data.type] || 0) + 1;
  const inv = S.haillInv || {}, n = k => Math.max(0, (Math.floor(inv[k]) || 0) - (dbl[k] || 0)), h = S.haill;
  const on = h && HAILL[h.type] && h.how !== 'srv' && haillLeft() > 0 ? {type:h.type, t0:tToSrv(h.t0, st.t, boostT(), WCLOCK.on)} : null;
  const send = {haill:n('haill'), luksus:n('luksus'), takk:n('takk'), yard:Math.max(0, Math.floor(S.yardCredit) || 0), on};
  let r; try { r = await cloudRpc('haill_import', {inv:send}); } catch (e){ return false; }
  if (typeof cloudEv === 'function') cloudEv('haill_import', {had:send, got:r});
  S.haillInv = {haill:0, luksus:0}; S.yardCredit = 0; save();
  return true;
}
// what the server has given this player, all of it, written over the copy in the save. Returns the number of new things given
// (a purchase delivered now), or null when the server is from before HS4
async function shopClaim4(){
  if (S.achH){ try { await cloudRpc('ach_haill', {ch:1}); delete S.achH; } catch (e){ if (/ 404$/.test(String(e && e.message))){ SHOP.hs4 = false; } } }
  if (SHOP.hs4 === false){ if (S.achH){ delete S.achH; giveHaill('haill', 'gift'); save(); } return null; }
  // (the state first: it says whether the server has HS4, and only then is the server told of what was switched on here, with its minute)
  let st, tries = 0;
  for (;;){ const g0 = SHOP.gen;
    try { st = await cloudRpc('shop_state', {}); } catch (e){ if (/ 404$/.test(String(e && e.message))){ SHOP.hs4 = false; if (S.achH){ delete S.achH; giveHaill('haill', 'gift'); save(); } return null; } return 0; }
    if (!st || st.v !== 4 || !Array.isArray(st.list) || !isFinite(st.t)){ SHOP.hs4 = false; return null; }
    SHOP.hs4 = SHOP.hs = true; haillInit();
    if ((S.haillQ || []).length || (S.yardQ || []).length){ await haillTell(); if ((S.haillQ || []).length || (S.yardQ || []).length || tries++ > 4) return 0; continue; }
    if (!st.imp){ if (tries++ < 2 && await srvImport(st)) continue; return 0; }   // (not brought over, and the server not reached: nothing is written over yet)
    // (a haill switched on or a credit used while the answer was on its way: told, and asked again)
    if (SHOP.gen !== g0 && tries++ < 4){ await haillTell(); continue; }
    break; }
  return srvApply(st);
}
function srvApply(st){
  const list = st.list, now = boostT(), wn = worldNow(), world = WCLOCK.on, tol = world ? 1 : 30, lang = S.lang === 'en' ? 'en' : 'no';
  const given = S.shopGiven || (S.shopGiven = []), seen = S.shopAt || (S.shopAt = {}), rc = SHOP.rc = [], names = [], ids = [], unk = SHOP.unk || (SHOP.unk = new Set());
  const ms = g => Date.parse(g.done_at), at = g => backT(ms(g), wn, S.t, world), say = (g, no, en) => rc.push({g, no, en});
  const ev = (what, x) => { if (typeof cloudEv === 'function') cloudEv('srv_fix', Object.assign({what}, x)); };
  // (new: delivered by this very answer, or within the last minutes and not confirmed here yet, should that answer have been lost)
  const isNew = g => !!g.held && !given.includes(g.id) && (g.new === true || wn - ms(g) < 120000);
  const snap = () => JSON.stringify([S.haillSrv, S.haillInv, S.haill, S.skip, S.yardSrv, S.yardCredit, S.hopVoid, S.cos, S.pubE, (S.fleet || []).map(v => (v.id === S.cur ? S.boat : v.boat || {}).trim || null)]), was = snap();
  let thanks = 0, gifts = 0;
  // 1. the haill in store: the server's unused, never one switched on here. The game's own numbers are gone (srvImport)
  const had = S.haillSrv || []; S.haillSrv = haillMirror(list.filter(g => g.held), S.haillUsed); S.haillInv = {haill:0, luksus:0}; S.haillOld = [];
  for (const x of S.haillSrv){ const g = list.find(y => y.id === x.id), d = g.data;
    if (isNew(g)){ given.push(g.id); seen[g.id] = wn;
      if (d.reward) thanks++; else if (d.gift) gifts++;
      else if (!d.pub && !d.ach && !d.imp){ say(g, 'Ligger i Haill-appen. Trykk «Aktiver» når du vil bruke den.', 'It is in the Luck app. Tap «Switch on» when you want it.'); names.push(HAILL[d.type][lang]); } }
    else if (!had.some(y => y.id === x.id) && !given.includes(g.id) && !d.pub && !d.ach && !d.imp && typeof cloudEv === 'function') cloudEv('haill_back', {id:x.id, type:x.type}); }
  // 2. the haill aboard: the server's, unless it is not told of the one here yet
  { const h = S.haill, wait = !!(h && h.id != null && (S.haillQ || []).includes(h.id)), o = st.on;
    const srv = o && isFinite(o.t0) ? {id:o.id, type:o.type, t0:srvToT(o.t0, st.t, now, world)} : null, next = haillFromSrv(h, srv, wait);
    if (h && HAILL[h.type] && haillLeft() > 0 && (!next || next.type !== h.type || Math.abs(next.t0 - h.t0) > tol)) ev('haill', {type:h.type});
    if (!next) S.haill = null; else if (!h || next !== h && (h.type !== next.type || h.id !== next.id || Math.abs(next.t0 - h.t0) > tol)) S.haill = next; }
  // 3. the trim, boat by boat: what the delivered grants give, and nothing else
  // (bought for a boat that is not in this save, or given with no boat, a correction: on the first boat, so nothing paid for is lost)
  const fleet = S.fleet || [], trims = list.filter(g => g.held && (g.data || {}).give === 'trim' && BOOSTS[g.data.k] && isFinite(ms(g))), home = g => fleet.find(x => x.id === g.data.boat) || fleet[0];
  for (const v of fleet){
    const gs = trims.filter(g => home(g) === v);
    const c = boostSrv(gs.map(g => ({k:g.data.k, h:BOOSTS[g.data.k].h, at:at(g)})), false, now);
    withVessel(v, () => { const b = S.boat, on = b.trim && BOOSTS[b.trim.k] ? {k:b.trim.k, until:trimUntil(b)} : null;
      if (c){ if (!on || on.k !== c.k || Math.abs(on.until - c.until) > tol){ if (on && on.until > now && !gs.some(isNew)) ev('trim', {k:on.k}); trimBack(c); } }
      else if (b.trim){ if (trimOn(b)) ev('trim', {k:b.trim.k}); trimEnd(); }
      for (const g of gs) if (isNew(g)){ given.push(g.id); seen[g.id] = wn; if (!c || c.k !== g.data.k) continue;
        const w = trimWords(g.data.k, c.t0 < at(g) - tol ? 'ext' : 'new'); log(w.no, w.en); say(g, w.no, w.en); names.push(BOOSTS[g.data.k][lang]); } }); }
  // 4. Skippertak, one for the whole fleet
  { const sk = list.filter(g => g.held && (g.data || {}).give === 'skip' && SKIP[g.data.k] && isFinite(ms(g))), fresh = sk.filter(isNew);
    const c = boostSrv(sk.map(g => ({k:g.data.k, h:SKIP[g.data.k].h, at:at(g)})), true, now), on = skipOn() ? S.skip : null;
    if (c){ if (!on || fresh.length || Math.abs(on.until - c.until) > tol){ if (on && !fresh.length) ev('skip', {k:on.k}); giveSkip(c.k, c.until, c.t0); } }
    else if (S.skip && S.skip.until != null && S.skip.until > now){ ev('skip', {k:S.skip.k}); S.skip = null; }
    for (const g of fresh){ given.push(g.id); seen[g.id] = wn; if (!c) continue; const X = SKIP[g.data.k], h = Math.max(0, (c.until - now) / 60), r = fmt(h / GAME_RATE, h / GAME_RATE < 10 ? 1 : 0);
      log(X.no + ': du og mannskapet på hele flåten er uthvilt i ' + Math.round(h) + ' timer.', X.en + ': you and the crews of the whole fleet are rested for ' + Math.round(h) + ' hours.');
      say(g, 'Du og mannskapet på hele flåten er uthvilt i ' + fmt(h, 0) + ' timer (' + r + ' timer i virkeligheten), også på driftsplanene.', 'You and the crews of the whole fleet are rested for ' + fmt(h, 0) + ' hours (' + r + ' hours in real life), on the operations plans too.'); names.push(X[lang]); } }
  // 5. the yard done now: the grants not used are the credits; one that came now finishes the yard jobs on its boat at once
  { const q = S.yardQ || (S.yardQ = []), ys = list.filter(g => g.held && (g.data || {}).give === 'yard' && !q.includes(g.id));
    if ((S.yardCredit || 0) > ys.length) ev('yard', {n:S.yardCredit - ys.length});
    S.yardSrv = ys.map(g => g.id); S.yardCredit = ys.length;
    for (const g of ys) if (isNew(g)){ given.push(g.id); seen[g.id] = wn; if (g.data.imp) continue; const v = (S.fleet || []).find(x => x.id === g.data.boat) || curVessel();
      withVessel(v, () => { let n = 0; for (const j of S.jobs || []) if (YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t){ j.until = S.t; n++; }
        if (n){ const i = S.yardSrv.indexOf(g.id); if (i >= 0) S.yardSrv.splice(i, 1); S.yardCredit = S.yardSrv.length; q.push(g.id); }
        const no = n ? 'Verftet gjorde ' + (n > 1 ? n + ' jobber' : 'jobben') + ' på «' + S.boatName + '» ferdig med én gang.' : 'Jobben på «' + S.boatName + '» ble ferdig før kjøpet kom fram. «Ferdig nå» ligger klar og gjør neste verftsjobb ferdig med én gang.',
          en = n ? 'The yard finished ' + (n > 1 ? n + ' jobs' : 'the job') + ' on the «' + S.boatName + '» straight away.' : 'The job on the «' + S.boatName + '» was done before the purchase came. «Done now» is kept and finishes the next yard job at once.';
        log(no, en); say(g, no, en); names.push(shopL('Verftet er ferdig', 'The yard is done')); }); } }
  // 5b. the hop over the rest of a route (HO3, ui/10u-hopp.js): a grant not used is a hop paid for and not made yet. It is made when the
  // boat it was bought for lies held for it (hopHoldFor: the fast-forward button stopped her, and the hold is in the save, so another
  // device holding the game makes it too), whatever the weather (Jonas 12.11.2026: «uavhengig av været eller andre ting»), at once or
  // as soon as the time away is played in (hopDeliver, hopWait). Nothing is owed in the game after it (Jonas: «skal ikke ha noe "hopp"
  // tilgode»): one that can not be made is marked for a refund (hopVoid). S.hopQ: used here, and the server not yet told (hop_use).
  // Not on a page that has lost the game (TAB): the one that has it delivers
  { const q = S.hopQ || (S.hopQ = []); for (let i = q.length - 1; i >= 0; i--) if (!list.some(g => g.id === q[i])) q.splice(i, 1);
    const hs = list.filter(g => g.held && (g.data || {}).give === 'hopp' && !q.includes(g.id)), gone = typeof hopTabGone === 'function' && hopTabGone();
    for (const g of hs){ if (gone) break; if ((S.hopVoid || []).includes(g.id)) continue;   // (marked for a refund: never made after all)
      const d = g.data, fresh = isNew(g), held = typeof hopHoldFor === 'function' && hopHoldFor(d);
      if (fresh){ given.push(g.id); seen[g.id] = wn; }
      if (held){ if (fresh){ say(g, 'Hoppet gjøres nå: båten er fremme om et øyeblikk.', 'The hop is made now: the boat is there in a moment.'); names.push(shopL('Hopp over ruta', 'Skip the route')); }
        if (typeof hopDeliver === 'function') setTimeout(() => hopDeliver(g.id, d), 0); }
      else if (typeof hopVoid === 'function'){ const why = ['Båten lå ikke lenger stille på ruta da betalingen kom.', 'The boat was no longer lying still on the route when the payment came.'];
        if (fresh) say(g, 'Hoppet ble ikke gjort: ' + why[0] + ' Kjøpet er merket, og pengene betales tilbake.', 'The hop was not made: ' + why[1] + ' The purchase is marked, and the money is paid back.');
        hopVoid(g.id, why); } }
    if (!gone) for (const id of q) if (typeof hopUse === 'function') hopUse(id); }
  // 6. the paid paint designs: the account's entitlements, never the save's own list
  if (Array.isArray(st.owned)){ CLOUD.owned = st.owned.slice(); if (typeof cosSrv === 'function') cosSrv(st.owned); }
  // 7. what is still open: a paint design, given as before and the server told (shop_done); one this game does not know is left there
  for (const g of list){ if (g.held) continue;
    if (given.includes(g.id)){ seen[g.id] = wn; ids.push(g.id); continue; }
    const nm = shopGive(g); if (!nm){ if (!unk.has(g.id)){ unk.add(g.id); console.warn('shop: a grant this game does not know', g.id, g.product); if (typeof cloudEv === 'function') cloudEv('shop_unknown', {id:g.id, product:g.product}); } continue; }
    names.push(nm); given.push(g.id); seen[g.id] = wn; ids.push(g.id); }
  // 8. tonight's round at the pub, taken on another device or before a save was lost
  if (world && st.pub && st.pub.e === pubEvening(S.t / 60) && S.pubE !== st.pub.e) S.pubE = st.pub.e;
  { const keep = givenKeep(given, seen, wn, 8); if (keep.length !== given.length) given.splice(0, given.length, ...keep); }
  if (snap() === was && !ids.length && !rc.length && !thanks && !gifts){ if ((S.yardQ || []).length) haillTell(); return 0; }
  save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true);
  if (ids.length) cloudRpc('shop_done', {ids}).catch(e => console.error(e));
  if ((S.yardQ || []).length) haillTell();
  if (rc.length) shopThanks(rc);
  shopWords(gifts, thanks);
  if (typeof PHONE !== 'undefined' && PHONE.isOpen()) PHONE.render(); if (typeof refreshAll === 'function') refreshAll();
  return names.length;
}
// the directorate's message for the welcome gift, and the thanks for feedback that helped
function shopWords(gifts, thanks){
  if (gifts){ msg('Fiskeridirektoratet', 'Du er ført i fiskermanntallet i eget navn. Spillet ditt er lagret på kontoen, og en luksushaill ligger om bord som velkomstgave. God tur!', 'You are in the fishermen’s register in your own name. Your game is saved to the account, and a luxury luck is aboard as a welcome gift. Good fishing!');
    toast(shopL('Registrert! Luksushaill om bord.', 'Registered! A luxury luck aboard.')); }
  if (thanks){ const no = 'Takk for tilbakemeldingen! Den hjalp oss å gjøre spillet bedre. ' + (thanks > 1 ? thanks + ' takk-haill' : 'Takk-haill') + ' med 12 timer fullt haill ligger i Haill-appen. Aktiver det når du vil.',
      en = 'Thank you for your feedback! It helped us make the game better. ' + (thanks > 1 ? thanks + ' thank-you lucks' : 'Thank-you luck') + ' with 12 hours of full luck ' + (thanks > 1 ? 'are' : 'is') + ' in the Luck app. Switch it on when you like.';
    msg('Det Store Blå', no, en); toast(shopL(no, en)); }
}
async function shopClaim(){
  if (!CLOUD.on || !CLOUD.user) return 0;
  // (HS4: a server that has shop_state is the truth, and the copy is written over; one from before it goes on as after HS3, below.
  // One claim at a time: two answers must never be written over each other)
  if (SHOP.claiming) return SHOP.claiming;
  if (SHOP.hs4 !== false || S.achH){ const p = shopClaim4().finally(() => { SHOP.claiming = null; }); SHOP.claiming = p.then(n => n == null ? 0 : n); const n = await p; if (n != null) return n; }
  await haillTell();
  let list; try { list = await cloudRpc('shop_pending', {}); } catch (e){ return 0; }
  list = list || []; haillInit();
  const isH = g => (g.data || {}).give === 'haill' && !!HAILL[g.data.type];
  // (asked only when it matters: a haill to give, or a copy the answer would empty)
  let srv = SHOP.hs; if (srv == null && list.some(g => g.held)) srv = SHOP.hs = true;
  if (srv == null && (S.haillSrv.length || list.some(isH))) srv = await haillProbe();
  haillInit();
  const given = S.shopGiven || (S.shopGiven = []), seen = S.shopAt || (S.shopAt = {}), tNow = worldNow(), back = [], old = S.haillOld, ids = [], names = [], mir = [], fresh = new Set(), unk = SHOP.unk || (SHOP.unk = new Set()); let thanks = 0, gifts = 0; const rc = SHOP.rc = [];   // (rc is this call's own: another call may start while this one waits for shop_done)
  for (const g of list){
    // (a haill delivered before and not used, kept on the server: into the copy, with no words. One that went into the game's own
    // numbers, from a page or a server before HS2, is used on the server now, so it is never counted twice)
    // (HS3: a trim, a Skippertak or the yard done now delivered the last week and not in this save is given again below, shopBack)
    if (given.includes(g.id)) seen[g.id] = tNow;   // (kept for as long as the server lists it, givenKeep)
    if (g.held){ if (!isH(g)){ if (!given.includes(g.id) && g.done_at) back.push(g); continue; } if (old.includes(g.id)) cloudRpc('haill_use', {id:g.id}).then(() => { const o = S.haillOld || [], i = o.indexOf(g.id); if (i >= 0) o.splice(i, 1); }).catch(() => {}); else mir.push(g); continue; }
    // (given before and the server not told, a lost connection: told now. One this game does not know, a product newer than the page
    // or a page from before an update, is left on the server and given when the game knows it: never marked done and lost, 06.11.2026)
    if (given.includes(g.id)){ ids.push(g.id); if (isH(g) && !old.includes(g.id)) mir.push(g); continue; }
    if (isH(g)){
      if (srv == null) continue;   // (whether the server keeps it is not known now: it waits there)
      const d = g.data, how = d.reward ? 'fb' : d.gift ? 'gift' : 'shop';
      if (srv){ mir.push(g); fresh.add(g.id); } else { old.push(g.id); if (old.length > 200) old.splice(0, old.length - 200); }
      // (the welcome gift for registering, HS1 10.11.2026: one grant per account, made by the server's tm_hello and never by the game,
      // supabase/migrations/20261110150000_reg_gift.sql; no purchase, so no confirmation and no price: the directorate's message below)
      if (d.reward){ if (srv) giveHaill(d.type, how, g.id); else giveHaill(d.type, how); thanks++; }
      else if (d.gift){ if (srv) giveHaill(d.type, how, g.id); else giveHaill(d.type, how); gifts++; }
      else names.push(shopGive(g, srv));
    }
    else { const nm = shopGive(g); if (!nm){ if (!unk.has(g.id)){ unk.add(g.id); console.warn('shop: a grant this game does not know', g.id, g.product); if (typeof cloudEv === 'function') cloudEv('shop_unknown', {id:g.id, product:g.product}); } continue; } names.push(nm); }
    given.push(g.id); seen[g.id] = tNow; ids.push(g.id); }
  // the copy is what the server says now, never added to: a haill taken back or used on another device is gone. One that comes
  // back because the save did not have it, is counted (haill_back: how often a purchase would have been lost before HS2)
  let moved = false;
  if (srv === true){ const was = S.haillSrv, next = haillMirror(mir, S.haillUsed.concat(old));
    for (const x of next) if (!fresh.has(x.id) && !was.some(y => y.id === x.id) && typeof cloudEv === 'function') cloudEv('haill_back', {id:x.id, type:x.type});
    moved = JSON.stringify(was.map(x => x.id).sort((a, b) => a - b)) !== JSON.stringify(next.map(x => x.id)) || fresh.size > 0; S.haillSrv = next; }
  if (back.length) for (const id of shopBack(back)){ given.push(id); seen[id] = tNow; moved = true; }
  // (every id the server can still list is kept: by age, not the last 200, core givenKeep)
  { const keep = givenKeep(given, seen, tNow, 8); if (keep.length !== given.length) given.splice(0, given.length, ...keep); }
  if (!ids.length && !moved) return 0;
  save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true);
  if (ids.length) try { await cloudRpc('shop_done', {ids}); } catch (e){ console.error(e); }
  if (rc.length) shopThanks(rc);
  shopWords(gifts, thanks);
  if (typeof PHONE !== 'undefined' && PHONE.isOpen()) PHONE.render(); if (typeof refreshAll === 'function') refreshAll();
  return names.length;
}
// at the start, signed in: is the shop set up, and anything bought (also back from Stripe with ?kjop=…, asked again for a while)
function shopStart(){
  const q = new URLSearchParams(location.search), k = q.get('kjop');
  if (k){ SHOP.ret = k; q.delete('kjop'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); }
  fetch(shopFn(), {cache:'no-store'}).then(r => r.ok ? r.json() : {ready:false}).then(j => { SHOP.ready = !!j.ready; if (typeof PHONE !== 'undefined' && PHONE.isOpen()) PHONE.render(); }).catch(() => { SHOP.ready = false; });
  // (a hop's hold ends when its purchase is cancelled; back with no answer at all, the browser's back button, the boat lies still till
  // the payment comes or the hold ends: said, with the way out. ui/10u-hopp.js)
  const hh = S.boat && S.boat.hopHold;
  if (SHOP.ret === 'avbrutt'){ toast(shopL('Kjøpet ble avbrutt. Ingenting er trukket.', 'The purchase was cancelled. Nothing was charged.')); SHOP.ret = null; if (hh && typeof hopHoldOff === 'function') hopHoldOff(); }
  else if (!SHOP.ret && hh && hh.pay) toast(shopL('Båten ligger stille og venter på betalingen for hoppet. Vil du seile videre, trykk ⏩ og «Avbryt».', 'The boat lies still, waiting for the payment for the hop. To sail on, tap ⏩ and «Cancel».'));
  const tries = SHOP.ret ? [0, 3000, 8000, 20000, 45000] : [0];
  if (SHOP.ret) toast(shopL('Takk! Henter det du kjøpte …', 'Thank you! Fetching what you bought …'));
  for (const ms of tries) setTimeout(() => { if (ms && !SHOP.ret) return; shopClaim().then(n => { if (n) SHOP.ret = null; }); }, ms);
  // still nothing after the last try: say so, rather than nothing (it is given at the next start, or when the game is opened again)
  if (SHOP.ret) setTimeout(() => { if (!SHOP.ret) return; SHOP.ret = null; toast(shopL('Betalingen er ikke bekreftet ennå. Det du kjøpte, kommer så snart den er det, også neste gang du åpner spillet.', 'The payment is not confirmed yet. What you bought comes as soon as it is, also the next time you open the game.')); }, 52000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') shopClaim(); });
  window.addEventListener('online', () => { haillTell(); });   // a haill switched on with no network: the server told when it is back (HS2)
  setInterval(() => { if (document.visibilityState === 'visible') shopClaim(); }, 10 * 60000);   // a thank-you given while the game is open
}
