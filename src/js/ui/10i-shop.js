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
const SHOP = {ready:null, busy:false, ret:null};
const SHOP_PRODUCT = {haill:'haill', luksus:'luksus', pump:'trim_pump', ic:'trim_ic', turbo:'trim_turbo', yard:'verft_na', sk_light:'skip_light', sk_std:'skip', sk_max:'skip_max',
  des_ripe:'des_ripe', des_totone:'des_totone', des_vann:'des_vann', des_stripe:'des_stripe', des_lakk:'des_lakk', des_flagg:'des_flagg', des_reg:'des_reg', des_logo:'des_logo'};   // the paint designs (ui/10j-paint.js)
const shopFn = () => CLOUD_CFG.supabaseUrl.replace(/\/$/, '') + '/functions/v1/shop-checkout';
const shopL = (no, en) => S.lang === 'en' ? en : no;
function shopMode(){
  if (!CLOUD.on) return pubHost() ? 'off' : 'test';
  if (CLOUD.user && SHOP.ready) return 'live';
  return adminOk() ? 'test' : 'off';
}
// a price in real money, marked with 💎 so it never looks like the game's kroner (a player could not tell them apart, 06.10.2026)
function realKr(nok){ return '<span class="realkr" title="' + shopL('Ekte penger', 'Real money') + '">\u{1F48E} ' + nok + ' kr</span>'; }
// the label of a buy button for a price in kroner
function shopLabel(nok){
  const m = shopMode();
  return m === 'live' ? shopL('Kjøp · ', 'Buy · ') + realKr(nok) : m === 'test' ? shopL('Kjøp (test, ingen betaling)', 'Buy (test, no payment)') : shopL('Snart i salg', 'On sale soon');
}
// what a key is and costs, for the consent and the receipt in the log
function shopWhat(k){
  if (HAILL[k]) return {name:HAILL[k][S.lang === 'en' ? 'en' : 'no'], nok:HAILL[k].nok};
  if (BOOSTS[k]) return {name:'Trim: ' + BOOSTS[k][S.lang === 'en' ? 'en' : 'no'], nok:BOOSTS[k].nok};
  if (/^sk_/.test(k) && SKIP[k.slice(3)]){ const X = SKIP[k.slice(3)]; return {name:X[S.lang === 'en' ? 'en' : 'no'], nok:X.nok}; }   // Skippertak (core/15-energy.js)
  if (/^des_/.test(k)){ const N = PAINT.DNAME[k.slice(4)] || ['', '']; return {name:(k === 'des_flagg' || k === 'des_reg' ? '' : shopL('Malingsdesign: ', 'Paint design: ')) + shopL(N[0], N[1]), nok:PAINT.nok(k.slice(4))}; }
  return {name:shopL('Verftet ferdig nå', 'The yard done now'), nok:YARD_NOW_NOK};
}
// a buy button: at once in a test, straight to Stripe when the shop is live (Jonas 05.10.2026: «Gjør dette på en intuitiv måte som tar
// fokuset bort fra handlingen, vi må tenke salg salg salg»): no dialog in between. The consent to delivery at once is the line under
// the button (shopFine) and the same words by Stripe's pay button (shop-checkout custom_text)
function payBuy(k, give){
  if (typeof isGuest === 'function' && isGuest()){ guestAsk('shop'); return; }   // real money only on an account (ui/10f-cloud.js)
  const m = shopMode();
  if (m === 'test'){ give(); return; }
  if (m === 'off'){ toast(shopL('Butikken åpner snart.', 'The shop opens soon.')); return; }
  shopGo(k);
}
// the small line under a buy button when the shop is live
function shopFine(){
  return shopMode() === 'live' ? '<p class="ph-note shop-fine">' + shopL('\u{1F48E} betyr ekte penger, betalt med kort. ', '\u{1F48E} means real money, paid by card. ') + shopL('Leveres i spillet med én gang. Når du kjøper, ber du om det, og angreretten faller da bort.', 'Delivered in the game at once. By buying you ask for that, and the right of withdrawal then ends.') + '</p>' : '';
}
async function shopGo(k){
  if (SHOP.busy) return; SHOP.busy = true; toast(shopL('Åpner betalingen …', 'Opening the payment …'));
  try {
    const tok = await cloudToken(); if (!tok) throw new Error(shopL('du er ikke logget inn', 'you are not signed in'));
    const r = await fetch(shopFn(), {method:'POST', headers:{'Content-Type':'application/json', apikey:CLOUD_CFG.supabaseAnon, Authorization:'Bearer ' + tok},
      body:JSON.stringify({product:SHOP_PRODUCT[k], boat:S.cur, lang:S.lang, back:location.origin + location.pathname})});
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(j.error === 'unavailable' || r.status >= 500 ? shopL('betalingen er ikke tilgjengelig akkurat nå. Prøv igjen senere.', 'the payment is not available just now. Try again later.') : j.error || String(r.status));
    save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true);   // the game as it is, before the page goes to Stripe
    location.href = j.url;
  } catch (e){
    SHOP.busy = false;
    toast(shopL('Kunne ikke åpne betalingen: ', 'Could not open the payment: ') + (e.message || e));
  }
}
// what the server has granted and the game has not given yet: given now, and the server told. Each gift leaves a line for the
// confirmation (SHOP.rc, shopThanks): what it did, and on which boat
function shopGive(g){
  const d = g.data || {}, v = (S.fleet || []).find(x => x.id === d.boat) || curVessel(), rc = SHOP.rc || (SHOP.rc = []), say = (no, en) => rc.push({g, no, en});
  if (d.give === 'haill' && HAILL[d.type]){ giveHaill(d.type, 'shop'); say('Ligger i Haill-appen. Trykk «Aktiver» når du vil bruke den.', 'It is in the Luck app. Tap «Switch on» when you want it.'); return HAILL[d.type][S.lang === 'en' ? 'en' : 'no']; }
  // (the same kind as the one on adds its hours, another kind takes its place: core trimSet)
  if (d.give === 'trim' && BOOSTS[d.k]) return withVessel(v, () => { const B = BOOSTS[d.k], w = trimWords(d.k, trimSet(d.k)); log(w.no, w.en); say(w.no, w.en); return B[S.lang === 'en' ? 'en' : 'no']; });
  // (nothing left to finish when it came, the job done during the payment: kept as a credit for the next yard job, YARD_NOW_MIN)
  if (d.give === 'yard') return withVessel(v, () => { let n = 0; for (const j of S.jobs || []) if (YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t){ j.until = S.t; n++; }
    if (!n) S.yardCredit = (S.yardCredit || 0) + 1;
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
  const its = rc.map(r => { const k = Object.keys(SHOP_PRODUCT).find(x => SHOP_PRODUCT[x] === r.g.product), w = k ? shopWhat(k) : null;
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
async function shopClaim(){
  if (!CLOUD.on || !CLOUD.user) return 0;
  let list; try { list = await cloudRpc('shop_pending', {}); } catch (e){ return 0; }
  const given = S.shopGiven || (S.shopGiven = []), ids = [], names = [], unk = SHOP.unk || (SHOP.unk = new Set()); let thanks = 0, gifts = 0; const rc = SHOP.rc = [];   // (rc is this call's own: another call may start while this one waits for shop_done)
  for (const g of list || []){
    // (given before and the server not told, a lost connection: told now. One this game does not know, a product newer than the page
    // or a page from before an update, is left on the server and given when the game knows it: never marked done and lost, 06.11.2026)
    if (given.includes(g.id)){ ids.push(g.id); continue; }
    if ((g.data || {}).reward && HAILL[g.data.type]){ giveHaill(g.data.type, 'fb'); thanks++; }
    // (the welcome gift for registering, HS1 10.11.2026: one grant per account, made by the server's tm_hello and never by the game,
    // supabase/migrations/20261110150000_reg_gift.sql; no purchase, so no confirmation and no price: the directorate's message below)
    else if ((g.data || {}).gift && g.data.give === 'haill' && HAILL[g.data.type]){ giveHaill(g.data.type, 'gift'); gifts++; }
    else { const nm = shopGive(g); if (!nm){ if (!unk.has(g.id)){ unk.add(g.id); console.warn('shop: a grant this game does not know', g.id, g.product); if (typeof cloudEv === 'function') cloudEv('shop_unknown', {id:g.id, product:g.product}); } continue; } names.push(nm); }
    given.push(g.id); ids.push(g.id); }
  if (given.length > 200) given.splice(0, given.length - 200);
  if (!ids.length) return 0;
  save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true);
  try { await cloudRpc('shop_done', {ids}); } catch (e){ console.error(e); }
  if (rc.length) shopThanks(rc);
  if (gifts){ msg('Fiskeridirektoratet', 'Du er ført i fiskermanntallet i eget navn. Spillet ditt er lagret på kontoen, og en luksushaill ligger om bord som velkomstgave. God tur!', 'You are in the fishermen’s register in your own name. Your game is saved to the account, and a luxury luck is aboard as a welcome gift. Good fishing!');
    toast(shopL('Registrert! Luksushaill om bord.', 'Registered! A luxury luck aboard.')); }
  if (thanks){ const no = 'Takk for tilbakemeldingen! Den hjalp oss å gjøre spillet bedre. ' + (thanks > 1 ? thanks + ' takk-haill' : 'Takk-haill') + ' med 12 timer fullt haill ligger i Haill-appen. Aktiver det når du vil.',
      en = 'Thank you for your feedback! It helped us make the game better. ' + (thanks > 1 ? thanks + ' thank-you lucks' : 'Thank-you luck') + ' with 12 hours of full luck ' + (thanks > 1 ? 'are' : 'is') + ' in the Luck app. Switch it on when you like.';
    msg('Det Store Blå', no, en); toast(shopL(no, en)); }
  if (typeof PHONE !== 'undefined' && PHONE.isOpen()) PHONE.render(); if (typeof refreshAll === 'function') refreshAll();
  return names.length;
}
// at the start, signed in: is the shop set up, and anything bought (also back from Stripe with ?kjop=…, asked again for a while)
function shopStart(){
  const q = new URLSearchParams(location.search), k = q.get('kjop');
  if (k){ SHOP.ret = k; q.delete('kjop'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); }
  fetch(shopFn(), {cache:'no-store'}).then(r => r.ok ? r.json() : {ready:false}).then(j => { SHOP.ready = !!j.ready; if (typeof PHONE !== 'undefined' && PHONE.isOpen()) PHONE.render(); }).catch(() => { SHOP.ready = false; });
  if (SHOP.ret === 'avbrutt'){ toast(shopL('Kjøpet ble avbrutt. Ingenting er trukket.', 'The purchase was cancelled. Nothing was charged.')); SHOP.ret = null; }
  const tries = SHOP.ret ? [0, 3000, 8000, 20000, 45000] : [0];
  if (SHOP.ret) toast(shopL('Takk! Henter det du kjøpte …', 'Thank you! Fetching what you bought …'));
  for (const ms of tries) setTimeout(() => { if (ms && !SHOP.ret) return; shopClaim().then(n => { if (n) SHOP.ret = null; }); }, ms);
  // still nothing after the last try: say so, rather than nothing (it is given at the next start, or when the game is opened again)
  if (SHOP.ret) setTimeout(() => { if (!SHOP.ret) return; SHOP.ret = null; toast(shopL('Betalingen er ikke bekreftet ennå. Det du kjøpte, kommer så snart den er det, også neste gang du åpner spillet.', 'The payment is not confirmed yet. What you bought comes as soon as it is, also the next time you open the game.')); }, 52000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') shopClaim(); });
  setInterval(() => { if (document.visibilityState === 'visible') shopClaim(); }, 10 * 60000);   // a thank-you given while the game is open
}
