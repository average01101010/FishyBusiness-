// ===== Kystmegleren and the cloud (B1–B8 in docs/planer/etter-tonys-test.md, supabase/migrations/20261107140000_broker.sql) =====
// The listings come from the server (listings_get): fetched when the broker's page opens and every half minute while it is open, every
// ten minutes when a wish is set (a new boat that suits it is told in Meldinger). The ledger (broker_pending) is applied to the save by
// core/09k-market.js mbApply and marked done (broker_done): at the start, each minute while the company has a boat out or a bid held,
// every five minutes else, and right after each call that binds or frees money. Without the cloud (the tests, the artifact, offline) the
// broker has no boats, and the page says the yard sells new ones at full price (B6). Guests may look; the server lets only accounts trade.
var MBC = (() => {
  const L = (no, en) => typeof S !== 'undefined' && S && S.lang === 'en' ? en : no;
  const st = {data:null, at:0, skew:0, busy:false, sync:false, off:false, err:null, tm:0, last:0, wish:0};
  const on = () => !st.off && typeof havnCloud === 'function' && havnCloud();
  const guest = () => typeof isGuest === 'function' && isGuest();
  const list = () => (st.data && st.data.list) || [];
  const nowMs = () => Date.now() + st.skew;
  const left = until => Math.max(0, (typeof until === 'number' ? until : Date.parse(until)) - nowMs());
  // what the server said, in words (the errors are single words, 'low N' with the lowest bid)
  function why(e){
    const m = String((e && e.message) || e || ''), w = (m.match(/(?:^|[\s"'])(low \d+|too many|bad value|bad hours|bad type|bad boat|bad port|no buynow|not yours|not signed in|guest|gone|own|top|buynow|cash|start|listed|bids)(?:$|[\s"',.])/) || [])[1] || '';
    if (/ 404$/.test(m)) return L('Kystmegleren er ikke åpen ennå.', 'Kystmegleren is not open yet.');
    if (/^low /.test(w)) return L('Budet må være minst ' + kr(+w.slice(4)) + '.', 'The bid must be at least ' + kr(+w.slice(4)) + '.');
    return ({'too many':L('For mange på kort tid, eller tre båter til salgs alt.', 'Too many in a short time, or three boats for sale already.'), 'guest':L('Registrer deg for å handle hos Kystmegleren.', 'Register to trade at Kystmegleren.'),
      'not signed in':L('Logg inn for å handle hos Kystmegleren.', 'Sign in to trade at Kystmegleren.'), gone:L('Salget er over.', 'The sale is over.'), own:L('Det er din egen båt.', 'That is your own boat.'),
      top:L('Du har alt det høyeste budet.', 'You hold the highest bid already.'), buynow:L('Det er «Kjøp nå»-prisen eller mer: kjøp henne heller.', 'That is the buy-now price or more: buy her instead.'),
      cash:L('Du har ikke nok penger til budet.', 'You do not have the money for the bid.'), start:L('Startprisen må være mellom 40 % og 160 % av verdien.', 'The start price must be between 40 % and 160 % of the value.'),
      'no buynow':L('Hun har ingen «Kjøp nå»-pris.', 'She has no buy-now price.'), listed:L('Hun ligger alt til salgs.', 'She is for sale already.'), bids:L('Hun har bud og kan ikke trekkes.', 'She has bids and cannot be withdrawn.'),
      'not yours':L('Det er ikke din oppføring.', 'That is not your listing.'), 'bad value':L('Verdien stemmer ikke med båttypen.', 'The value does not match the type.')})[w] || L('Det gikk ikke nå. Prøv igjen.', 'It did not work just now. Try again.');
  }
  // the pages that show the broker, drawn again when an answer comes
  function redraw(){
    try { if (typeof PHONE !== 'undefined' && PHONE.isOpen()) PHONE.render(); } catch (e){}
    try { if (typeof DOCK !== 'undefined' && DOCK.page && DOCK.redraw) DOCK.redraw(); } catch (e){}
    try { if (typeof renderHud === 'function') renderHud(); } catch (e){}
  }
  // what is for sale, from the boat you follow (nearest first); force: now, else at most every 30 s
  async function load(force){
    if (!on() || st.busy) return st.data; if (!force && st.at && Date.now() - st.at < 30000) return st.data;
    st.busy = true;
    try { const p = S.boat.pos, r = await cloudRpc('listings_get', {x:p.x, y:p.y, r:null}); if (r && Array.isArray(r.list)){ st.data = r; st.at = Date.now(); st.err = null; if (r.now) st.skew = Date.parse(r.now) - Date.now(); wishTell(); } }
    catch (e){ st.err = e; st.at = Date.now(); if (/ 404$/.test(String(e && e.message))) st.off = true; }   // (an error waits its half minute too: the page asks on every draw)
    finally { st.busy = false; }
    redraw(); return st.data;
  }
  // the ledger applied, and marked done
  async function sync(){
    if (!on() || st.sync) return 0; st.sync = true; st.last = Date.now();
    try {
      const rows = await cloudRpc('broker_pending', {}); if (!Array.isArray(rows) || !rows.length) return 0;
      const before = S.fleet.length, ids = mbApply(rows), got = mktState().mb.got;
      if (ids.length){ save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true); try { await cloudRpc('broker_done', {ids}); } catch (e){ console.error(e); } }
      if (got && S.fleet.length > before && typeof BUYM !== 'undefined'){ const v = vesselById(got.vid); mktState().mb.got = null; if (v) setTimeout(() => BUYM.show(v), 60); }
      if (typeof refreshAll === 'function') refreshAll();
      return ids.length;
    } catch (e){ if (/ 404$/.test(String(e && e.message))) st.off = true; return 0; }
    finally { st.sync = false; redraw(); }
  }
  // the wish's boats, told once each in Meldinger while the game is open (the push is the server's, when it is not)
  function wishTell(){
    const M = mktState(), seen = M.mb.told || (M.mb.told = []), hits = mbWishHits(list()).filter(x => !seen.includes(x.id));
    for (const x of hits.slice(0, 3)){ seen.push(x.id); msg('Kystmegleren', 'En båt som passer ønsket ditt, er til salgs: «' + x.name + '» ved verftet i ' + mbPlace(portById(x.port)) + '.', 'A boat that suits your wish is for sale: «' + x.name + '» at the yard in ' + mbPlace(portById(x.port)) + '.'); }
    if (seen.length > 60) seen.splice(0, seen.length - 60);
  }
  const busy = () => S.fleet.some(v => mbSale(v)) || Object.keys(mktState().mb.held).length > 0;
  function tick(){
    if (typeof document !== 'undefined' && document.hidden) return;
    if (on() && Date.now() - st.last > (busy() ? 60000 : 300000)) sync();
    if (on() && mktState().wish && Date.now() - st.at > 600000) load(true);
  }
  function start(){ clearInterval(st.tm); st.tm = setInterval(tick, 15000); setTimeout(sync, 4000); document.addEventListener('visibilitychange', () => { if (!document.hidden && on()) sync(); }); }
  // put a boat out (B1): checked here as on the server, then she is moved to the nearest yard and locked
  async function put(vid, start, buynow, hours){
    const v = vesselById(vid), w = mbWhy(v); if (w) return {err:w};
    const value = vesselValue(v), bad = mbPriceWhy(value, start, buynow); if (bad) return {err:bad};
    if (!MB.hours.includes(hours)) return {err:'hours'}; if (!on()) return {err:'cloud'}; if (guest()) return {err:'guest'};
    const b = vget(v, 'boat'), yard = mbYardNear(b.pos); if (!yard) return {err:'yard'};
    try {
      const r = await cloudRpc('listing_put', {vid, vessel:mbPack(v, yard), value, lic_kr:mbLicKr(v), start_kr:Math.round(start), buynow:buynow == null ? null : Math.round(buynow), hours, port:yard.id, x:yard.p.x, y:yard.p.y, seller_name:S.company || ''});
      if (!r || r.id == null) return {err:'server'};
      mbLock(v, r, {start, buynow, hours, value}, yard); save();
      log('«' + vget(v, 'boatName') + '» er lagt ut hos Kystmegleren fra ' + kr(start) + (buynow ? ', «Kjøp nå» ' + kr(buynow) : '') + '. Hun ligger ved verftet i ' + mbPlace(yard) + ' til salget er over.',
        'The «' + vget(v, 'boatName') + '» is put out at Kystmegleren from ' + kr(start) + (buynow ? ', buy now ' + kr(buynow) : '') + '. She lies at the yard in ' + mbPlace(yard) + ' until the sale is over.');
      if (typeof cloudEv === 'function') cloudEv('mb_put', {type:b.type, hours, pc:Math.round(start / value * 100), bn:buynow ? Math.round(buynow / value * 100) : 0});
      load(true); return {ok:true, yard};
    } catch (e){ return {err:'srv', text:why(e)}; }
  }
  async function bid(lid, kr0, to){
    const Lx = byId(lid); if (!Lx) return {err:'gone'}; const fee = mbFee(kr0, to, Lx.port), w = mbBuyWhy(Lx, kr0 + fee); if (w) return {err:w};
    if (kr0 < mbNext(Lx)) return {err:'srv', text:why('low ' + mbNext(Lx))};
    try { const r = await cloudRpc('listing_bid', {lid, kr:Math.round(kr0), deliver:fee ? to : null}); await sync(); await load(true);
      if (typeof cloudEv === 'function') cloudEv('mb_bid', {type:Lx.type, pc:Math.round(kr0 / Lx.value * 100), dl:!!fee}); return {ok:true, r}; }
    catch (e){ load(true); return {err:'srv', text:why(e)}; }
  }
  async function buy(lid, to){
    const Lx = byId(lid); if (!Lx || !Lx.buynow) return {err:'gone'}; const fee = mbFee(Lx.buynow, to, Lx.port), w = mbBuyWhy(Lx, Lx.buynow + fee); if (w) return {err:w};
    try { const r = await cloudRpc('listing_buy', {lid, deliver:fee ? to : null}); await sync(); await load(true);
      if (typeof cloudEv === 'function') cloudEv('mb_buy', {type:Lx.type, pc:Math.round(Lx.buynow / Lx.value * 100), dl:!!fee}); return {ok:true, r}; }
    catch (e){ load(true); return {err:'srv', text:why(e)}; }
  }
  async function cancel(lid){
    try { await cloudRpc('listing_cancel', {lid}); await sync(); await load(true); return {ok:true}; }
    catch (e){ return {err:'srv', text:why(e)}; }
  }
  async function wish(cls, max){ if (!on() || guest()) return; try { await cloudRpc('broker_wish_set', {cls:cls || null, max_kr:max ? Math.round(max) : null}); } catch (e){} }
  const byId = id => list().find(x => String(x.id) === String(id)) || null;
  const mine = () => (st.data && st.data.mine) || [];
  const mineOf = vid => mine().find(m => m.vid === vid && m.state === 'open') || null;
  const bids = () => (st.data && st.data.bids) || [];
  return {on, guest, list, byId, mine, mineOf, bids, sold:() => (st.data && st.data.sold) || [], load, sync, put, bid, buy, cancel, wish, start, left, why, redraw, get loaded(){ return !!st.data; }, get err(){ return st.err; }, _st:st};
})();
