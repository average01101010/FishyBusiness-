// ===== Kvotemarkedet and the cloud (KM3 of docs/planer/kvotemarkedet.md; the server is KM2, supabase/migrations/20261108230000_kvotemarked.sql) =====
// Rights (hjemler) and structure quotas players sell to each other, in the same auction house as the boats (ui/10s-broker.js MBC): the
// same bids with the money held, the same settlement each minute and the same ledger, which MBC.sync fetches with {km:true} and
// core/09k-market.js mbApply applies (mbKm). Here are the quota market's own calls: the list (listings_get with kind km, one national
// market, V5 A), put out (km_put, with the seller's key for the good, kmKey), bid and buy (listing_bid, listing_buy, no delivery), withdraw
// (listing_cancel), the wish (km_wish_set), and the two things that need no server: the quick sale of a right to the register at 90 %
// (V3 A: the register is the floor) and a free right put on a boat of one's own. Only game kroner; nothing here costs real money.
// The buyer chooses the boat when he bids (put on a boat without a right, or structured onto one in the same group); the choice is kept
// per listing in the save (S.mkt.km.to), so the settlement finds it also when the game was closed. Without the cloud the market has
// nothing from other players, and the register sells as before.
var KMC = (() => {
  const L = (no, en) => typeof S !== 'undefined' && S && S.lang === 'en' ? en : no;
  const st = {data:null, at:0, busy:false, err:null};
  const on = () => MBC.on(), guest = () => MBC.guest();
  const list = () => (st.data && st.data.list) || [];
  const byId = id => list().find(x => String(x.id) === String(id)) || null;
  const mine = () => (st.data && st.data.mine) || [];
  const bids = () => ((st.data && st.data.bids) || []).filter(b => b.kind === 'right' || b.kind === 'struct');
  const sold = () => ((st.data && st.data.sold) || []).filter(x => x.kind === 'right' || x.kind === 'struct');
  // the good of a listing as the core's checks want it (mine: kmBuyWhy says own)
  const item = Q => Q && Q.item ? Object.assign({}, Q.item, {mine:!!Q.mine}) : null;
  // what the server said, in words (km_put's own errors; the rest are the broker's, MBC.why)
  function why(e){
    const m = String((e && e.message) || e || ''), w = (m.match(/(?:^|[\s"'])(bad ref|bad item|short|bad value|listed|too many)(?:$|[\s"',.])/) || [])[1] || '';
    return ({'bad ref':L('Varen kan ikke legges ut.', 'The good cannot be put out.'), 'bad item':L('Varen kan ikke legges ut slik den er.', 'The good cannot be put out as it is.'),
      short:L('Strukturkvoten har under ett år igjen.', 'The structure quota has under a year left.'), 'bad value':L('Taksten stemmer ikke med registeret på land. Prøv igjen senere.', 'The valuation does not match the register ashore. Try again later.'),
      listed:L('Den ligger alt ute, eller båten gjør det.', 'It is out already, or the boat is.'), 'too many':L('For mange på kort tid, eller tre oppføringer ute alt.', 'Too many in a short time, or three listings out already.')})[w] || MBC.why(e);
  }
  async function load(force){
    if (!on() || st.busy) return st.data; if (!force && st.at && Date.now() - st.at < 30000) return st.data;
    st.busy = true;
    try { const r = await cloudRpc('listings_get', {x:null, y:null, r:null, kind:'km'}); if (r && Array.isArray(r.list)){ st.data = r; st.at = Date.now(); st.err = null; if (r.now) MBC._st.skew = Date.parse(r.now) - Date.now(); wishTell(); heal(); } }
    catch (e){ st.err = e; st.at = Date.now(); if (/ 404$/.test(String(e && e.message))) MBC._st.off = true; }
    finally { st.busy = false; }
    MBC.redraw(); return st.data;
  }
  // a lock whose row never came (a save from another device, a ledger row lost): taken off when the server says the listing was
  // withdrawn or went unsold, or knows nothing of it a day after its time. Never for one that is sold: its paid row takes the good
  // out and the lock off together, so the right cannot be sold twice in between
  function heal(){
    const K = kmState(), now = Date.now() + MBC._st.skew;
    for (const k of Object.keys(K.out)){ const o = K.out[k], m = mine().find(x => x.id === o.lid);
      if (m ? m.state !== 'open' && m.state !== 'sold' && o.until + 600000 < now : o.until + 864e5 < now) kmUnlock(k, o.lid); }
  }
  // after the ledger was applied: the list again when the market has been looked at
  function after(){ if (st.data) load(true); }
  // the wish's goods, told once each in Meldinger while the game is open (the push is the server's, km_tell)
  function wishHits(){ const W = kmState().wish; if (!W) return [];
    return list().filter(Q => !Q.mine && Q.item && (!W.rid || Q.item.id === W.rid) && (!W.kind || Q.kind === W.kind) && Math.min(mbNext(Q), Q.buynow || Infinity) <= W.max); }
  function wishTell(){
    const K = kmState(), seen = K.told || (K.told = []), hits = wishHits().filter(x => !seen.includes(x.id));
    for (const x of hits.slice(0, 3)){ seen.push(x.id); msg('Kvotemarkedet', (x.kind === 'struct' ? 'En strukturkvote ' : 'En hjemmel ') + HJ[x.item.id].hl + ' som passer ønsket ditt, er til salgs. Se Kvote → Marked.', (x.kind === 'struct' ? 'A structure quota of ' : 'A right of ') + HJ[x.item.id].hl + ' quota length that suits your wish is for sale. See Quota → Market.'); }
    if (seen.length > 60) seen.splice(0, seen.length - 60);
  }
  // put a right or a structure quota out: checked here as on the server, then locked (kmLock: the boat lies in port until it is over)
  async function put(src, start, buynow, hours){
    const w = kmPutWhy(src); if (w) return {err:w};
    const it = kmPack(src), key = kmKey(src); if (!it || !key) return {err:'gone'};
    const value = kmTakst(it), bad = mbPriceWhy(value, start, buynow); if (bad) return {err:bad};
    if (!MB.hours.includes(hours)) return {err:'hours'}; if (!on()) return {err:'cloud'}; if (guest()) return {err:'guest'};
    try {
      const r = await cloudRpc('km_put', {vid:key, item:it, value, start_kr:Math.round(start), buynow:buynow == null ? null : Math.round(buynow), hours, seller_name:S.company || ''});
      if (!r || r.id == null) return {err:'server'};
      kmLock(src, r, {start, buynow, hours, value, item:it}); save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true);
      const nm = (it.kind === 'struct' ? 'Strukturkvoten ' : 'Hjemmelen ') + it.hl, en = (it.kind === 'struct' ? 'The structure quota of ' : 'The right of ') + it.hl;
      log(nm + ' er lagt ut i Kvotemarkedet fra ' + kr(start) + (buynow ? ', «Kjøp nå» ' + kr(buynow) : '') + '.' + (src.v ? ' «' + vget(src.v, 'boatName') + '» ligger til kai til salget er over.' : ''),
        en + ' is put out in the quota market from ' + kr(start) + (buynow ? ', buy now ' + kr(buynow) : '') + '.' + (src.v ? ' The «' + vget(src.v, 'boatName') + '» lies at the quay until the sale is over.' : ''));
      if (typeof cloudEv === 'function') cloudEv('km_put', {kind:it.kind, id:it.id, hours, pc:Math.round(start / value * 100), bn:buynow ? Math.round(buynow / value * 100) : 0});
      load(true); return {ok:true};
    } catch (e){ return {err:'srv', text:why(e)}; }
  }
  // the choice of boat kept with the bid, so the settlement knows where the good goes
  function choose(lid, to){ if (to && to.v) kmState().to[lid] = {vid:to.v.id, how:to.how, t:Date.now()}; }
  async function bid(lid, kr0, to){
    const Q = byId(lid); if (!Q) return {err:'gone'}; const w = kmBuyWhy(item(Q), to, kr0); if (w) return {err:w};
    if (guest()) return {err:'guest'}; if (kr0 < mbNext(Q)) return {err:'srv', text:MBC.why('low ' + mbNext(Q))};
    choose(lid, to); save();
    try { const r = await cloudRpc('listing_bid', {lid, kr:Math.round(kr0), deliver:null}); await MBC.sync(); await load(true);
      if (typeof cloudEv === 'function') cloudEv('km_bid', {kind:Q.kind, id:Q.item.id, pc:Math.round(kr0 / Math.max(1, Q.value) * 100)}); return {ok:true, r}; }
    catch (e){ load(true); return {err:'srv', text:why(e)}; }
  }
  async function buy(lid, to){
    const Q = byId(lid); if (!Q || !Q.buynow) return {err:'gone'}; const w = kmBuyWhy(item(Q), to, Q.buynow); if (w) return {err:w};
    if (guest()) return {err:'guest'};
    choose(lid, to); save();
    try { const r = await cloudRpc('listing_buy', {lid, deliver:null}); await MBC.sync(); await load(true);
      if (typeof cloudEv === 'function') cloudEv('km_buy', {kind:Q.kind, id:Q.item.id, pc:Math.round(Q.buynow / Math.max(1, Q.value) * 100)}); return {ok:true, r}; }
    catch (e){ load(true); return {err:'srv', text:why(e)}; }
  }
  async function cancel(lid){
    try { await cloudRpc('listing_cancel', {lid}); await MBC.sync(); await load(true); return {ok:true}; }
    catch (e){ return {err:'srv', text:why(e)}; }
  }
  // «Ønsket hjemmel»: the server tells by push when one that suits is put out (km-wish, at most one in twelve hours)
  async function wish(W){
    kmState().wish = W || null; if (!on() || guest()) return;
    try { await cloudRpc('km_wish_set', {rid:W ? W.rid || null : null, kind:W ? W.kind || null : null, max_kr:W ? Math.round(W.max) : null}); } catch (e){}
  }
  // a structure quota that waits for a boat: the choice is kept, and the ledger is asked again (the row was never marked done)
  async function take(row, v){
    const K = kmState(), W = K.wait[row]; if (!W) return {err:'gone'}; const w = kmBuyWhy(W.item, {v, how:'struct'}, null); if (w) return {err:w};
    K.to[W.listing] = {vid:v.id, how:'struct', t:Date.now()}; save();
    if (!on()) return {err:'cloud'};
    await MBC.sync(); return K.wait[row] ? {err:'srv', text:L('Det gikk ikke nå. Prøv igjen.', 'It did not work just now. Try again.')} : {ok:true};
  }
  // «Selg nå til registeret» (V3 A, kmQuick): a right goes back to the owners ashore for 90 % of the valuation, at once, with the
  // structure quotas on it; the boat stays in the company without it. (A structure quota alone is no place in the register.)
  function quickWhy(src){ const w = kmPutWhy(src); if (w && w !== 'many' && w !== 'ops') return w; return src.kind === 'struct' ? 'how' : null; }
  function quick(src){
    const w = quickWhy(src); if (w) return {err:w};
    const it = kmPack(src); if (!it || it.kind !== 'right') return {err:'gone'};
    const val = kmQuick(it), pc = Math.round(val / Math.max(1, kmTakst(it)) * 100), o = kmOut(src); if (!o) return {err:'gone'};
    regFree(it.id); book('baat', val, 'Hjemmel solgt til registeret: ' + it.hl, 'Right sold to the register: ' + it.hl);
    msg('Fiskeridirektoratet', 'Hjemmelen ' + it.hl + ' er solgt tilbake til registeret for ' + kr(val) + (it.st.length ? ', og strukturkvotene som fulgte den, er fordelt tilbake til gruppen.' : '.') + (o.two ? ' Den andre kvoten fra den særlige ordningen falt bort.' : ''),
      'The ' + it.hl + ' quota length right is sold back to the register for ' + kr(val) + (it.st.length ? ', and its structure quotas have gone back to the group.' : '.') + (o.two ? ' The second quota from the special scheme fell away.' : ''));
    log('Solgte hjemmelen ' + it.hl + ' til registeret for ' + kr(val) + '.', 'Sold the ' + it.hl + ' right to the register for ' + kr(val) + '.');
    if (typeof cloudEv === 'function') cloudEv('km_quick', {id:it.id, pc});
    save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true); if (typeof refreshAll === 'function') refreshAll();
    return {ok:true, kr:val};
  }
  // a free right of the company's own put on a boat (or structured onto one): no sale, so no server; Fiskeridirektoratet sends word
  function freeTo(i, to){
    const src = {free:i}, w0 = kmPutWhy(src); if (w0 && w0 !== 'many') return {err:w0};
    const it = kmPack(src); if (!it) return {err:'gone'}; const w = kmBuyWhy(it, to, null); if (w) return {err:w};
    const f = kmFreeList()[i]; kmFreeList().splice(i, 1);
    if (kmApply(it, to) == null){ kmFreeList().splice(i, 0, f); return {err:'boat'}; }
    save(); if (typeof cloudSaveSoon === 'function') cloudSaveSoon(true); if (typeof refreshAll === 'function') refreshAll();
    return {ok:true};
  }
  return {on, guest, list, byId, item, mine, bids, sold, load, after, put, bid, buy, cancel, wish, wishHits, take, quick, quickWhy, freeTo, why, get loaded(){ return !!st.data; }, get err(){ return st.err; }, _st:st};
})();
