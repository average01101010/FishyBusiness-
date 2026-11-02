// ===== Sponsorer in the game (M6, core/09l-sponsor.js): the list from the cloud, the sponsored item card, the link out and the
// handbook's page. Marked «Samarbeid» everywhere (mfl. § 3); a sponsored item is sold beside the generic one, at the same price and with
// the same numbers, and is the same EQUIP item with a name on it. Nothing sponsored at sea, in the chart plotter, in the HUD or in push. =====
var SPUI = (() => {
  const L = (no, en) => S.lang === 'en' ? en : no, esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  let tm = 0;
  // the list: the test sponsor with #sptest (tests, demo), else the cloud's sp_now() now and every hour; quietly nothing without it
  function load(){
    if (/sptest/.test(location.hash || '')){ spSet(SP_TEST); return; }
    if (typeof cloudRpc !== 'function' || typeof CLOUD_CFG === 'undefined' || !CLOUD_CFG || !CLOUD_CFG.supabaseUrl) return;
    cloudRpc('sp_now', {}, {anon:true}).then(r => { spSet(r); }).catch(() => {});
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
  // the signs' measure (view3d drawSigns, M7): one sp_view per placement every ten minutes and when the page is hidden; only with the
  // player's consent to statistics, as every event (cloudEv sends nothing without it)
  function sendViews(){ if (typeof G3 === 'undefined' || !G3.signTake || typeof cloudEv !== 'function') return; for (const v of G3.signTake()) cloudEv('sp_view', v); }
  setInterval(sendViews, 600000); addEventListener('pagehide', sendViews, true); document.addEventListener('visibilitychange', () => { if (document.hidden) sendViews(); }, true);   // (capture: before the cloud sends its batch)
  setTimeout(start, 1500);
  return {load, card, hb, brandOf, setBrand, sendViews};
})();
