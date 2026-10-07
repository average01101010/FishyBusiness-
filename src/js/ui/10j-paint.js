// ===== THE PAINT SHOP (Malerverkstedet; Jonas 06.10.2026, docs/engasjement.md): a button of its own under Verft. Your own boat lies
// in 3D with the camera turning slowly round her (G3.paintView), and what you choose shows on her at once (vessel3d.js PAINTPRE), before
// anything is paid. The hull's colour costs game money, about 1 % of what the boat costs (at least 1 500 kr), and every boat's first
// colour is free: b.liv.hull is unset until she is painted the first time (a bought boat starts without it). The designs (the stripe
// under the sheer, two-tone, the waterline stripe, the stripe colour and fresh gloss) are bought once for real money and are then yours
// on every boat (S.cos, and the account's entitlements as CLOUD.owned); they can be tried on before they are bought. The paint is the
// boat's (b.liv = {hull, d:{design: colour}}, in the vessel's state), so it follows her through the fleet and into the save. =====
// (a var: the dock, earlier in the same script, asks it on every page it draws, and must find nothing rather than fail before this runs)
var PAINT = (() => {
  const L = (no, en) => S.lang === 'en' ? en : no;
  const DNAME = {ripe:['Ripestripe', 'Sheer stripe', 'En stripe like under rekka, i fargen du velger.', 'A stripe just under the sheer, in the colour you choose.'],
    totone:['Totone', 'Two-tone', 'Den nedre delen av skutesiden i en annen farge.', 'The lower part of the topsides in another colour.'],
    vann:['Vannlinjestripe', 'Boot stripe', 'En stripe langs vannlinja.', 'A stripe along the waterline.'],
    stripe:['Stripefarge', 'Stripe colour', 'Båtens egen stripe i en annen farge.', 'The boat\'s own stripe in another colour.'],
    lakk:['Nylakkert', 'Fresh gloss', 'Blank, nylakkert skutesid som speiler lyset.', 'Glossy, freshly varnished topsides that catch the light.'],
    flagg:['Flagg', 'Flags', 'Alle nasjonene og formene: rektangel, vimpel og splitt.', 'All the nations and shapes: rectangle, pennant and swallowtail.'],
    reg:['Ønskenummer', 'Own number', 'Velg løpenummeret i registreringsmerket selv.', 'Choose the serial number in the registration mark yourself.']};
  const DNOK = 29, NOK = {flagg:19, reg:29}, nok = k => NOK[k] || DNOK;
  const SHAPE = {rekt:['Rektangel', 'Rectangle'], vimpel:['Vimpel', 'Pennant'], splitt:['Splitt', 'Swallowtail']};
  // the flags as small pictures for the picker, drawn once
  const FPIC = {}; const fpic = (code, shape) => { const k = code + '|' + shape; if (!FPIC[k]){ const cv = document.createElement('canvas'); cv.width = 64; cv.height = 47; flagCanvas(cv, code, shape); FPIC[k] = cv.toDataURL(); } return FPIC[k]; };
  const flagCh = (b, p) => { const a = flagOf(p), c = flagOf(b.liv); return a.code !== c.code || a.shape !== c.shape; };
  const flagFree = p => { const f = flagOf(p); return f.code === 'NO' && f.shape === 'rekt'; };
  const price = b => Math.max(1500, Math.round((VESSELS[b.type].price || 0) * 0.01 / 100) * 100);
  const cur = b => (b.liv && b.liv.hull) || 'orig';
  const curD = (b, k) => (b.liv && b.liv.d && b.liv.d[k]) || null;
  const owned = k => !!((S.cos && S.cos[k]) || (typeof CLOUD !== 'undefined' && (CLOUD.owned || []).includes('des_' + k)));
  const css = e => e && e[3] ? 'rgb(' + e[3].map(v => Math.round(v * 255)).join(',') + ')' : '';
  const copy = x => { const o = JSON.parse(JSON.stringify(x || {})); o.d = o.d || {}; return o; };
  let pre = null, on = false;
  // the drawer page is open or not: the camera and the paint being tried go with it
  function live(want){
    if (want === on) return; on = want;
    pre = want ? copy(S.boat.liv) : null; PAINTPRE = pre;
    if (typeof G3 !== 'undefined' && G3.paintView) G3.paintView(want);
  }
  const sw = (pa, d, k, sel, now, e) => '<button class="pnt-sw' + (k === sel ? ' on' : '') + (k === now ? ' cur' : '') + (e[3] ? '' : ' orig') + '" data-pa="' + pa + '"' + (d ? ' data-d="' + d + '"' : '') +
    ' data-k="' + k + '" title="' + L(e[1], e[2]) + '" aria-label="' + L(e[1], e[2]) + '"' + (e[3] ? ' style="background:' + css(e) + '"' : '') + '></button>';
  function page(){
    const b = S.boat; if (!pre){ pre = copy(b.liv); PAINTPRE = pre; }
    if (b.status !== 'port') return '<div class="ph-c"><p class="ph-note">' + L('Båten må ligge i havn for å males.', 'The boat must be in port to be painted.') + '</p></div>';
    const c = cur(b), s = pre.hull || 'orig', e = HULLPAL.find(x => x[0] === s) || HULLPAL[0], free = !(b.liv && b.liv.hull), pr = price(b);
    const fCh = flagCh(b, pre) && (owned('flagg') || flagFree(pre));
    const hullCh = s !== c, dCh = DESIGNS.some(k => owned(k) && (pre.d[k] || null) !== curD(b, k)) || fCh, cost = hullCh && !free ? pr : 0, short = cost > S.cash;
    const tried = DESIGNS.filter(k => !owned(k) && pre.d[k] && designFits(b.type, k)).concat(!owned('flagg') && !flagFree(pre) ? ['flagg'] : []);
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + L('Skrogfarge', 'Hull colour') + '</h4>' +
      '<p class="ph-note">' + L('Trykk på en farge, så vises den på skroget. Du betaler først når du maler.', 'Tap a colour and it shows on the hull. You pay only when you paint.') + '</p>' +
      '<div class="pnt-pal">' + HULLPAL.map(x => sw('pntsel', '', x[0], s, c, x)).join('') + '</div>' +
      '<p class="pnt-name"><b>' + L(e[1], e[2]) + '</b>' + (s === c ? ' · ' + L('nå', 'now') : '') + '</p>' +
      '<p class="ph-note">' + (free ? L('Første fargevalg på denne båten er gratis.', 'The first choice of colour on this boat is free.') :
        L('Å male skroget koster ' + kr(pr) + ' for ' + (S.boatName || 'båten') + '.', 'Painting the hull costs ' + kr(pr) + ' for ' + (S.boatName || 'the boat') + '.')) + '</p></div>'];
    // the designs this boat can wear
    const ks = DESIGNS.filter(k => designFits(b.type, k));
    if (ks.length){
      h.push('<h4 class="pnt-h">' + L('Malingsdesign', 'Paint designs') + '</h4>');
      for (const k of ks){ const N = DNAME[k], v = pre.d[k] || null, has = owned(k);
        h.push('<div class="ph-card pnt-d"><h4>' + L(N[0], N[1]) + '<span class="pnt-own">' + (has ? L('Din', 'Yours') : realKr(DNOK)) + '</span></h4><p class="ph-note">' + L(N[2], N[3]) + '</p>' +
          (k === 'lakk' ? '<div class="pnt-row"><button class="ph-btn sm' + (v ? ' on' : '') + '" data-pa="pntd" data-d="lakk" data-k="' + (v ? '' : '1') + '">' + (v ? L('På', 'On') : L('Prøv', 'Try')) + '</button></div>'
            : '<div class="pnt-pal sm">' + HULLPAL.filter(x => x[3]).map(x => sw('pntd', k, x[0], v, curD(b, k), x)).join('') +
              '<button class="pnt-sw off' + (v ? '' : ' on') + '" data-pa="pntd" data-d="' + k + '" data-k="" title="' + L('Av', 'Off') + '" aria-label="' + L('Av', 'Off') + '">' + L('Av', 'Off') + '</button></div>') +
          (!has && v ? '<button class="ph-btn" data-pa="pntbuy" data-d="' + k + '">' + shopLabel(DNOK) + '</button>' + shopFine() : '') + '</div>'); }
    }
    // the flag at the stern: Norway's in a rectangle as she came, any nation and shape when the flags are yours
    { const f = flagOf(pre), has = owned('flagg'), N = DNAME.flagg;
      h.push('<div class="ph-card pnt-d"><h4>' + L(N[0], N[1]) + '<span class="pnt-own">' + (has ? L('Dine', 'Yours') : realKr(nok('flagg'))) + '</span></h4><p class="ph-note">' + L(N[2], N[3]) + '</p>' +
        '<div class="pnt-flags">' + Object.keys(FLAGS).map(k => '<button class="pnt-fl' + (k === f.code ? ' on' : '') + '" data-pa="pntf" data-k="' + k + '" title="' + L(FLAGS[k][0], FLAGS[k][1]) + '" aria-label="' + L(FLAGS[k][0], FLAGS[k][1]) + '"><img alt="" src="' + fpic(k, 'rekt') + '"></button>').join('') + '</div>' +
        '<p class="pnt-name"><b>' + L(FLAGS[f.code][0], FLAGS[f.code][1]) + '</b></p><div class="pnt-row">' +
        FLAGSHAPES.map(k => '<button class="ph-btn sm' + (k === f.shape ? ' on' : '') + '" data-pa="pntfs" data-k="' + k + '"' + (k === 'splitt' && f.code === 'NO' ? ' disabled' : '') + '>' + L(SHAPE[k][0], SHAPE[k][1]) + '</button>').join(' ') + '</div>' +
        (f.code === 'NO' ? '<p class="ph-note">' + L('Det norske splittflagget er statsflagget og brukes bare av staten.', 'The Norwegian swallow-tailed flag is the state\'s flag and is flown only by the state.') + '</p>' : '') +
        (!has && !flagFree(pre) ? '<button class="ph-btn" data-pa="pntbuy" data-d="flagg">' + shopLabel(nok('flagg')) + '</button>' + shopFine() : '') + '</div>'); }
    // the registration mark: as the home harbour's municipality gives it, or with a number of one's own
    { const r = regOf(b), has = owned('reg');
      if (r) h.push('<div class="ph-card pnt-d"><h4>' + L('Registreringsmerke', 'Registration mark') + '<span class="pnt-own">' + (has ? L('Ditt', 'Yours') : realKr(nok('reg'))) + '</span></h4>' +
        '<p class="pnt-mark">' + regText(r) + '</p><p class="ph-note">' + L('Fylke, løpenummer og kommune, malt på begge sider ved baugen (ervervstillatelsesforskriften §§ 22–23). Med ønskenummer velger du løpenummeret selv, så lenge ingen annen båt har det.',
          'County, serial number and municipality, painted on both sides near the bow (ervervstillatelsesforskriften §§ 22–23). With your own number you choose the serial number yourself, as long as no other boat has it.') + '</p>' +
        '<div class="pnt-row"><input id="pntNum" class="pnt-num" type="number" inputmode="numeric" min="1" max="9999" value="' + r.n + '" aria-label="' + L('Løpenummer', 'Serial number') + '"> ' +
        '<button class="ph-btn sm" data-pa="pntreg">' + (has ? L('Bruk nummeret', 'Use the number') : shopLabel(nok('reg'))) + '</button></div>' + (has ? '' : shopFine()) + '</div>'); }
    h.push('<div class="ph-card pnt-go">' + (tried.length ? '<p class="ph-note">' + L('Du prøver ' + tried.map(k => DNAME[k][0].toLowerCase()).join(' og ') + '. Kjøp designet for å beholde det.',
        'You are trying ' + tried.map(k => DNAME[k][1].toLowerCase()).join(' and ') + '. Buy the design to keep it.') + '</p>' : '') +
      '<button class="ph-btn" data-pa="pntgo"' + (!hullCh && !dCh || short ? ' disabled' : '') + '>' + (hullCh ? L('Mal skroget', 'Paint the hull') + ' · ' + (free ? L('gratis', 'free') : kr(cost)) :
        dCh ? L('Bruk designet', 'Use the design') : L('Båten har denne malingen', 'The boat has this paint')) + '</button>' +
      (short ? '<p class="ph-note r2">' + L('Du har ikke nok penger.', 'You do not have enough money.') + '</p>' : '') + '</div></div>');
    return h.join('');
  }
  // what the paint shop puts on: the hull (paid for when it changes) and the designs that are yours
  function apply(b){
    const s = pre.hull || 'orig', d = {}; for (const k of DESIGNS) if (owned(k) && pre.d[k] && designFits(b.type, k)) d[k] = pre.d[k];
    const liv = {}; if (s !== cur(b) || (b.liv && b.liv.hull)) liv.hull = s; if (Object.keys(d).length) liv.d = d;
    const f = flagOf(owned('flagg') || flagFree(pre) ? pre : b.liv); if (f.code !== 'NO' || f.shape !== 'rekt') liv.flag = {c:f.code, s:f.shape};
    if (Object.keys(liv).length) b.liv = liv; else delete b.liv;
  }
  function act(a, d){
    const b = S.boat; if (!pre) pre = copy(b.liv);
    if (a === 'pntsel'){ if (!HULLPAL.some(x => x[0] === d.k)) return false; pre.hull = d.k; PAINTPRE = pre; return true; }
    if (a === 'pntd'){ const k = d.d; if (!DESIGNS.includes(k)) return false;
      if (!d.k) delete pre.d[k]; else if (k === 'lakk') pre.d[k] = 1; else if (HULLPAL.some(x => x[0] === d.k && x[3])) pre.d[k] = d.k; else return false;
      PAINTPRE = pre; return true; }
    if (a === 'pntf'){ if (!FLAGS[d.k]) return false; const f = flagOf(pre); pre.flag = {c:d.k, s:d.k === 'NO' && f.shape === 'splitt' ? 'rekt' : f.shape}; PAINTPRE = pre; return true; }
    if (a === 'pntfs'){ if (!FLAGSHAPES.includes(d.k)) return false; const f = flagOf(pre); if (f.code === 'NO' && d.k === 'splitt') return false; pre.flag = {c:f.code, s:d.k}; PAINTPRE = pre; return true; }
    if (a === 'pntreg'){ const r = regOf(b), el = document.getElementById('pntNum'), n = el ? Math.round(+el.value) : 0; if (!r) return false;
      if (!(n >= 1 && n <= 9999)){ toast(L('Velg et nummer fra 1 til 9999.', 'Choose a number from 1 to 9999.')); return false; }
      if (n === r.n) return false;
      if (regUsed(r.f, r.k, n)){ toast(L(r.f + '-' + n + '-' + r.k + ' er en ekte båt. Velg et annet nummer.', r.f + '-' + n + '-' + r.k + ' is a real boat. Choose another number.')); return false; }
      if (owned('reg')){ regSet(n); return false; }
      S.cosWant = Object.assign({}, S.cosWant, {reg:n}); payBuy('des_reg', () => { giveCos('reg'); if (typeof DOCK !== 'undefined') DOCK.render(); }); return true; }
    if (a === 'pntbuy'){ const k = d.d; if (!COS.includes(k) || owned(k)) return false;
      S.cosWant = Object.assign({}, S.cosWant, {[k]:k === 'flagg' ? Object.assign({}, pre.flag) : pre.d[k] || 1});   // what to put on when it comes back from the payment
      payBuy('des_' + k, () => { giveCos(k); pre = copy(S.boat.liv); PAINTPRE = pre; if (typeof DOCK !== 'undefined') DOCK.render(); });
      return true; }
    if (a === 'pntgo'){
      if (b.status !== 'port') return false; const s = pre.hull || 'orig', free = !(b.liv && b.liv.hull), cost = s !== cur(b) && !free ? price(b) : 0; if (cost > S.cash) return false;
      const was = cur(b); if (cost){ S.cash -= cost; S.stats.costs += cost; }
      apply(b); pre = copy(b.liv); PAINTPRE = pre;
      if (s !== was){ const e = HULLPAL.find(x => x[0] === s);
        log((S.boatName || 'Båten') + ' er malt ' + (s === 'orig' ? 'tilbake i originalfargen' : e[1].toLowerCase()) + (cost ? ' for ' + fmt(cost) + ' kr' : '') + '.',
          (S.boatName || 'The boat') + ' is painted ' + (s === 'orig' ? 'back in her original colour' : e[2].toLowerCase()) + (cost ? ' for NOK ' + fmt(cost) : '') + '.'); }
      else log((S.boatName || 'Båten') + ' har fått ny maling.', (S.boatName || 'The boat') + ' has new paint.');
      return true;
    }
    return false;
  }
  return {page, act, live, price, owned, DNAME, nok};
})();
// a design is yours (the shop's grant, ui/10i-shop.js shopGive, or a test): on every boat from now on, and on this one at once if it was
// being tried when it was bought
function giveCos(k){
  if (!COS.includes(k)) return null; S.cos = Object.assign({}, S.cos, {[k]:1});
  const want = S.cosWant && S.cosWant[k], b = S.boat; if (S.cosWant) delete S.cosWant[k];
  if (want && k === 'reg') regSet(want);
  else if (want && k === 'flagg' && want.c){ b.liv = Object.assign({}, b.liv, {flag:{c:want.c, s:want.s || 'rekt'}}); }
  else if (want && designFits(b.type, k)){ b.liv = Object.assign({}, b.liv); b.liv.d = Object.assign({}, b.liv.d, {[k]:want}); }
  const N = PAINT.DNAME[k]; log('Malingsdesignet «' + N[0] + '» er ditt.', 'The paint design «' + N[1] + '» is yours.');
  return S.lang === 'en' ? N[1] : N[0];
}
// a number of one's own in the boat's registration mark: the shared world's claim first (no two players' boats wear the same mark,
// supabase/migrations/20261007100000_designs.sql reg_claim); without the cloud (the artifact, the tests) it is set at once
async function regSet(n){
  const b = S.boat, r = regOf(b); if (!r) return false; const mark = r.f + '-' + n + '-' + r.k, L = (no, en) => S.lang === 'en' ? en : no;
  if (typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest())){
    let ok = false; try { ok = await cloudRpc('reg_claim', {mark}); } catch (e){ toast(L('Fikk ikke sjekket nummeret. Prøv igjen litt senere.', 'Could not check the number. Try again a little later.')); return false; }
    if (ok !== true){ toast(L(mark + ' er tatt av en annen båt. Velg et annet nummer.', mark + ' is taken by another boat. Choose another number.')); return false; }
  }
  b.reg = {f:r.f, n, k:r.k}; log((S.boatName || 'Båten') + ' har fått registreringsmerket ' + mark + '.', (S.boatName || 'The boat') + ' now carries the registration mark ' + mark + '.');
  save(); if (typeof DOCK !== 'undefined') DOCK.render(); return true;
}
