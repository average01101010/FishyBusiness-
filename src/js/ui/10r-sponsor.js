// ===== Sponsorer in the game (M6, core/09l-sponsor.js): the list from the cloud, the sponsored item card, the link out and the
// handbook's page. Marked «Samarbeid» everywhere (mfl. § 3); a sponsored item is sold beside the generic one, at the same price and with
// the same numbers, and is the same EQUIP item with a name on it. Nothing sponsored at sea, in the chart plotter, in the HUD or in push. =====
// the demo build (KYST_DEMO=1 node build.mjs, M9) turns the test sponsor on from the start; build.mjs puts true in its place
const SP_DEMO = /*@demo*/false;
var SPUI = (() => {
  const L = (no, en) => S.lang === 'en' ? en : no, esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  let tm = 0;
  // the list: the test sponsor with #sptest (tests, demo), else the cloud's sp_now() now and every hour; quietly nothing without it
  function load(){
    if (SP_DEMO || /sptest/.test(location.hash || '')){ spSet(SP_TEST); gifts(); return; }
    if (typeof cloudRpc !== 'function' || typeof CLOUD_CFG === 'undefined' || !CLOUD_CFG || !CLOUD_CFG.supabaseUrl) return;
    cloudRpc('sp_now', {}, {anon:true}).then(r => { spSet(r); gifts(); }).catch(() => {});
  }
  // a partner's gift (M8, F7): something that is sold for game money anyway (a garment, CLOTHES), once per gift and player, with the
  // sender's name; 'welcome' to every player while it is active. Never haill, never Skippertak (they are sold)
  function gifts(){
    if (typeof S === 'undefined' || !S || !S.clothes) return; S.spGift = S.spGift || {};
    for (const r of SPN.list) if (r.kind === 'gift' && r.target === 'welcome' && !(r.id in S.spGift)){ const D = r.data || {}, C = typeof CLOTHES !== 'undefined' && CLOTHES[D.item]; if (!C) continue;
      S.spGift[r.id] = S.t; S.clothes[D.item] = (S.clothes[D.item] || 0) + 1;
      if (typeof msg === 'function') msg(r.sponsor.name, (D.text ? String(D.text).slice(0, 200) + ' ' : '') + 'Gaven ligger under Om bord: ' + C.no.toLowerCase() + '. (Samarbeid)', (D.text_en ? String(D.text_en).slice(0, 200) + ' ' : '') + 'The gift is under Aboard: ' + C.en.toLowerCase() + '. (Partnership)');
      log('Gave fra ' + r.sponsor.name + ': ' + C.no.toLowerCase() + '.', 'A gift from ' + r.sponsor.name + ': ' + C.en.toLowerCase() + '.');
      if (typeof cloudEv === 'function') cloudEv('sp_gift', {pl:r.id}); }
  }
  function start(){ load(); clearInterval(tm); tm = setInterval(load, 3600 * 1000); }
  // the brand bought on a vessel's item: S.brand['v1:garnhaler'] = {n, m}
  const brandOf = k => (S.brand || {})[S.cur + ':' + k] || null;
  function setBrand(k, sp){ S.brand = S.brand || {}; if (sp) S.brand[S.cur + ':' + k] = {n:sp.sponsor.name, m:sp.data.model || ''}; else delete S.brand[S.cur + ':' + k]; }
  // the sponsored card for an item, beside the generic one; btn: the same buy button with data-sp
  function card(k, btn, extra){
    const sp = spOf('item', k); if (!sp) return ''; const E = EQUIP[k], url = spUrl(sp.sponsor.site);
    return itemCard(Object.assign({k, id:'ic-' + k + '-sp', name:esc(sp.data.model || E.name[S.lang]), sub:'<span class="ic-sp-tag">' + L('Samarbeid', 'Partnership') + '</span> ' + L('levert av ', 'supplied by ') + esc(sp.sponsor.name),
      price:E.price, note:(sp.data.line ? esc(sp.data.line) + '. ' : '') + L('Samme pris og virkning som ' + E.name.no.toLowerCase() + ' over.', 'The same price and effect as the ' + E.name.en.toLowerCase() + ' above.'),
      body:url ? '<p class="ic-sp-out"><a class="ic-sp-link" href="' + esc(url) + '" target="_blank" rel="noopener sponsored" data-pl="' + sp.id + '">' + L('Se hos ' + esc(sp.sponsor.name) + ' ↗', 'See at ' + esc(sp.sponsor.name) + ' ↗') + '</a> <small>' + L('åpner utenfor spillet', 'opens outside the game') + '</small></p>' : '',
      btns:btn}, extra || {}));
  }
  // the handbook's «Sponsorer»: who, and on what; or that there are none
  function hb(lang){
    const S0 = spSponsors(), no = lang !== 'en';
    if (!S0.length) return no ? 'Ingen ennå. Spillet har samarbeidspartnere bare med skriftlig avtale, og da står de her med det avtalen gjelder. En sponset vare koster det samme og virker likt som den usponsede.'
      : 'None yet. The game has partners only with a written agreement, and then they are listed here with what the agreement covers. A sponsored item costs the same and works the same as the unsponsored one.';
    return (no ? 'Samarbeidspartnere med skriftlig avtale: ' : 'Partners with a written agreement: ') + S0.map(s => s.name + ' (' + s.on.map(r => r.kind === 'item' && EQUIP[r.target] ? (r.data.model || EQUIP[r.target].name[no ? 'no' : 'en']) : r.kind).join(', ') + ')').join('; ') +
      (no ? '. En sponset vare koster det samme og virker likt som den usponsede. Lenker til samarbeidspartnere åpner utenfor spillet, og Det Store Blå er ikke part i noe kjøp der.' : '. A sponsored item costs the same and works the same as the unsponsored one. Links to partners open outside the game, and Det Store Blå is no party to any purchase there.');
  }
  // a click out is counted (sp_click, the placement only)
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a.ic-sp-link'); if (a && typeof cloudEv === 'function') cloudEv('sp_click', {pl:+a.dataset.pl || 0}); });
  // the signs' measure (view3d drawSigns, M7; the rules in SPM below): what has changed per placement every ten minutes and when the page
  // is hidden; only with the player's consent to statistics, as every event (cloudEv sends nothing without it). Before the consent (no
  // CLOUD.sid yet) the counts wait, so a player who says yes later in the page still sends the session's one view
  function sendViews(){ if (typeof cloudEv !== 'function' || typeof CLOUD === 'undefined' || !CLOUD.sid) return;
    if (SPM.sid !== CLOUD.sid){ if (SPM.sid) SPM.restart(); SPM.sid = CLOUD.sid; }   // a new session (the consent taken back and given again): its own views
    for (const v of SPM.take()) cloudEv('sp_view', v); }
  setInterval(sendViews, 600000); addEventListener('pagehide', sendViews, true); document.addEventListener('visibilitychange', () => { if (document.hidden) sendViews(); }, true);   // (capture: before the cloud sends its batch)
  setTimeout(start, 1500);
  return {load, card, hb, brandOf, setBrand, sendViews, gifts};
})();
// ---------- the signs' measure, the rules (IAB/MRC Intrinsic In-Game Advertising Measurement Guidelines 2.0, the draft of 14.06.2022;
// docs/planer/butikker-og-sponsorer.md 4.4 and 10.6, docs/sponsor/mediekort.md). view3d drawSigns says per frame and banner what it
// sees (frame), and the rules count here, pure, so a test without 3D can feed them frames. A session is the page (CLOUD.sid lives as long
// as it): per placement at most one viewable impression in it (3.2 note 3), however often the player looks away and back; each later
// second in a row is a re-view (re), reported on its own. Every second the banner meets the pixel, size and angle rules adds to sec, also
// those before the threshold (3.2.10.3). At most 0.2 s is credited per frame (3.2.6: a measure every 200 ms), so a slow phone never gets
// more than it measured. The three buckets (3.2.10.2) are told by m and u: m = measured (drawn within 150 m with the occlusion query),
// u = undetermined (drawn within 150 m on WebGL 1, which has no query: never counted as viewable); a session with m and no imp is not
// viewable. Nothing while nobody has touched the game for two minutes or the page is hidden (3.1.5.3, o.live false). =====
var SPM = (() => {
  const DT = 0.2, THR = 1, pl = {};
  // o: {ok: 1.5 % of the screen, under 55°, half inside it; vis: half its cells neither behind a 3D object nor under the UI; det: the
  // occlusion could be measured (WebGL 2); sight: not in fog thicker than the distance, not at night; live; area; last (for the tests)}
  function frame(id, o, dt){
    const C = pl[id] || (pl[id] = {seen:0, imp:0, re:0, sec:0, run:0, area:0, m:0, u:0, sm:0, su:0, last:null});
    if (o.last) C.last = o.last;
    if (!o.live){ C.run = 0; return C; }
    dt = Math.min(DT, Math.max(0, +dt || 0));
    if (!o.det){ C.u = 1; C.run = 0; return C; }
    C.m = 1;
    if (!(o.ok && o.vis && o.sight)){ C.run = 0; return C; }
    const r0 = C.run; C.run += dt; C.sec += dt; C.area = Math.max(C.area, o.area || 0);
    if (r0 < THR && C.run >= THR){ if (!C.seen){ C.seen = 1; C.imp = 1; } else C.re++; }
    return C;
  }
  // what has changed since the last time, per placement: {pl, imp (0 or 1, once a session), re, sec (tenths), m, u (each once a session)}
  function take(){
    const out = [];
    for (const [id, C] of Object.entries(pl)){
      const sec = Math.floor(C.sec * 10 + 1e-6) / 10,   // (the rest waits for the next time)
        m = C.m && !C.sm ? 1 : 0, u = C.u && !C.su ? 1 : 0;
      if (!C.imp && !C.re && sec < 0.1 && !m && !u) continue;
      out.push({pl:+id, imp:C.imp, re:C.re, sec, m, u}); C.imp = 0; C.re = 0; C.sec -= sec; if (m) C.sm = 1; if (u) C.su = 1;
    }
    return out;
  }
  // the screen under a point (CSS px): true when the UI lies over the 3D picture there (3.2.4: the UI is occlusion too). What lies on top
  // is what the browser would hand a touch at that point (elementFromPoint): the phone, the drawer, the box, the cards, the dock and the
  // instruments; outside the screen counts as hidden. Elements that take no touch (pointer-events: none: the labels' text) are looked through.
  function uiOver(x, y, cv){ const e = document.elementFromPoint(x, y); return !e || (e !== cv && !(cv && cv.contains(e))); }
  // fog and night (3.2.5): not when the sight (visibility, km) is shorter than the distance to the banner (m), and not when the sun is
  // more than 6° under the horizon: nothing lights the banner then (its shader takes the sun and the sky only, not the lamps)
  const sightOk = (vis, d, el) => !(vis != null && vis * 1000 < d) && !(el != null && el < -6);
  // fix: the tests set a sight (km) or the sun's height (°) here to see fog and night without waiting for the weather
  // a new session in the same page (CLOUD.sid changed): the once-a-session marks start again; what is counted but not sent goes with it
  function restart(){ for (const C of Object.values(pl)){ C.seen = 0; C.m = 0; C.u = 0; C.sm = 0; C.su = 0; C.run = 0; } }
  return {frame, take, restart, uiOver, sightOk, pl, DT, THR, sid:null, fix:{vis:null, el:null}};
})();
