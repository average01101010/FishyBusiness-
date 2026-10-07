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
    reg:['Ønskenummer', 'Own number', 'Velg løpenummeret i registreringsmerket selv.', 'Choose the serial number in the registration mark yourself.'],
    logo:['Rederilogo', 'Company logo', 'Logoen på skroget midtskips og som rederiflagg på alle båtene dine. Lag den av et tegn, bokstaver og to farger, eller last opp et eget bilde.',
      'The logo on the hull midships and as the house flag on all your boats. Make it from a sign, letters and two colours, or upload a picture of your own.']};
  const LGNAME = {anker:['Anker', 'Anchor'], fisk:['Fisk', 'Fish'], bolge:['Bølger', 'Waves'], stjerne:['Stjerne', 'Star'], ring:['Ring', 'Ring'], kompass:['Kompassrose', 'Compass rose']};
  const LGPIC = {}; const logoPic = L => { if (L && L.kind === 'u') return L.img || ''; const k = logoStr(L); if (!LGPIC[k]){ const cv = document.createElement('canvas'); cv.width = cv.height = 64; logoCanvas(cv, L); LGPIC[k] = cv.toDataURL(); } return LGPIC[k]; };
  const initials = () => String(S.company || S.boatName || 'DSB').split(/\s+/).filter(w => /^[A-Za-zÆØÅæøå]/.test(w)).map(w => w[0].toUpperCase()).join('').slice(0, 3) || 'DSB';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const DNOK = 29, NOK = {flagg:19, reg:29}, nok = k => NOK[k] || DNOK;
  const SHAPE = {rekt:['Rektangel', 'Rectangle'], vimpel:['Vimpel', 'Pennant'], splitt:['Splitt', 'Swallowtail']};
  // the flags as small pictures for the picker, drawn once
  const FPIC = {}; const fpic = (code, shape) => { const k = code + '|' + shape; if (!FPIC[k]){ const cv = document.createElement('canvas'); cv.width = 64; cv.height = 47; flagCanvas(cv, code, shape); FPIC[k] = cv.toDataURL(); } return FPIC[k]; };
  const flagCh = (b, p) => { const a = flagOf(p), c = flagOf(b.liv); return a.code !== c.code || a.shape !== c.shape; };
  const flagFree = p => { const f = flagOf(p); return f.code === 'NO' && f.shape === 'rekt'; };
  // a flag the player may fly: Norway's rectangle; any nation with the flags; the house flag with the logo
  const flagOk = p => flagFree(p) || (flagOf(p).code === 'LOGO' ? owned('logo') : owned('flagg'));
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
    const fCh = flagCh(b, pre) && flagOk(pre), lgCh = pre.logo !== undefined && owned('logo') && logoStr(pre.logo) !== logoStr(S.logo);
    const hullCh = s !== c, dCh = DESIGNS.some(k => owned(k) && (pre.d[k] || null) !== curD(b, k)) || fCh || lgCh, cost = hullCh && !free ? pr : 0, short = cost > S.cash;
    const tried = DESIGNS.filter(k => !owned(k) && pre.d[k] && designFits(b.type, k)).concat(!flagOk(pre) ? ['flagg'] : []).concat(!owned('logo') && pre.logo ? ['logo'] : []);
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
        '<div class="pnt-flags">' + ((pre.logo !== undefined ? pre.logo : S.logo) ? '<button class="pnt-fl' + (f.code === 'LOGO' ? ' on' : '') + '" data-pa="pntf" data-k="LOGO" title="' + L('Rederiflagg', 'House flag') + '" aria-label="' + L('Rederiflagg', 'House flag') + '"><img alt="" src="' + logoPic(pre.logo !== undefined ? pre.logo : S.logo) + '"></button>' : '') + Object.keys(FLAGS).map(k => '<button class="pnt-fl' + (k === f.code ? ' on' : '') + '" data-pa="pntf" data-k="' + k + '" title="' + L(FLAGS[k][0], FLAGS[k][1]) + '" aria-label="' + L(FLAGS[k][0], FLAGS[k][1]) + '"><img alt="" src="' + fpic(k, 'rekt') + '"></button>').join('') + '</div>' +
        '<p class="pnt-name"><b>' + (f.code === 'LOGO' ? L('Rederiflagg', 'House flag') : L(FLAGS[f.code][0], FLAGS[f.code][1])) + '</b></p><div class="pnt-row">' +
        FLAGSHAPES.map(k => '<button class="ph-btn sm' + (k === f.shape ? ' on' : '') + '" data-pa="pntfs" data-k="' + k + '"' + (k === 'splitt' && f.code === 'NO' ? ' disabled' : '') + '>' + L(SHAPE[k][0], SHAPE[k][1]) + '</button>').join(' ') + '</div>' +
        (f.code === 'NO' ? '<p class="ph-note">' + L('Det norske splittflagget er statsflagget og brukes bare av staten.', 'The Norwegian swallow-tailed flag is the state\'s flag and is flown only by the state.') + '</p>' : '') +
        (!has && !flagFree(pre) && f.code !== 'LOGO' ? '<button class="ph-btn" data-pa="pntbuy" data-d="flagg">' + shopLabel(nok('flagg')) + '</button>' + shopFine() : '') + '</div>'); }
    // the registration mark: as the home harbour's municipality gives it, or with a number of one's own
    { const r = regOf(b), has = owned('reg');
      if (r) h.push('<div class="ph-card pnt-d"><h4>' + L('Registreringsmerke', 'Registration mark') + '<span class="pnt-own">' + (has ? L('Ditt', 'Yours') : realKr(nok('reg'))) + '</span></h4>' +
        '<p class="pnt-mark">' + regText(r) + '</p><p class="ph-note">' + L('Fylke, løpenummer og kommune, malt på begge sider ved baugen (ervervstillatelsesforskriften §§ 22–23). Med ønskenummer velger du løpenummeret selv, så lenge ingen annen båt har det.',
          'County, serial number and municipality, painted on both sides near the bow (ervervstillatelsesforskriften §§ 22–23). With your own number you choose the serial number yourself, as long as no other boat has it.') + '</p>' +
        '<div class="pnt-row"><input id="pntNum" class="pnt-num" type="number" inputmode="numeric" min="1" max="9999" value="' + r.n + '" aria-label="' + L('Løpenummer', 'Serial number') + '"> ' +
        '<button class="ph-btn sm" data-pa="pntreg">' + (has ? L('Bruk nummeret', 'Use the number') : shopLabel(nok('reg'))) + '</button></div>' + (has ? '' : shopFine()) + '</div>'); }
    // the company logo (all the company's boats): made, or a picture of one's own; shown to the others, so the admin may take it away
    { const has = owned('logo'), lg = pre.logo !== undefined ? pre.logo : S.logo, N = DNAME.logo, g = lg && lg.kind === 'g' ? lg : {kind:'g', sym:'anker', txt:initials(), c1:'marine', c2:'hvit'};
      const pal = (d, now) => '<div class="pnt-pal sm">' + HULLPAL.filter(x => x[3]).map(x => sw('pntlgc', d, x[0], now, null, x)).join('') + '</div>';
      h.push('<div class="ph-card pnt-d"><h4>' + L(N[0], N[1]) + '<span class="pnt-own">' + (has ? L('Din', 'Yours') : realKr(nok('logo'))) + '</span></h4><p class="ph-note">' + L(N[2], N[3]) + '</p>' +
        '<div class="pnt-logos">' + Object.keys(LOGOSYM).map(k => '<button class="pnt-lg' + (lg && lg.kind === 'g' && lg.sym === k ? ' on' : '') + '" data-pa="pntlg" data-k="' + k + '" title="' + L(LGNAME[k][0], LGNAME[k][1]) + '" aria-label="' + L(LGNAME[k][0], LGNAME[k][1]) + '"><img alt="" src="' + logoPic(Object.assign({}, g, {sym:k})) + '"></button>').join('') + '</div>' +
        '<div class="pnt-row"><input id="pntLogoTxt" class="pnt-num" maxlength="3" value="' + esc(g.txt || '') + '" aria-label="' + L('Bokstaver', 'Letters') + '"> <button class="ph-btn sm" data-pa="pntlgt">' + L('Bruk bokstavene', 'Use the letters') + '</button></div>' +
        '<p class="ph-note">' + L('Bunnfarge', 'Ground') + '</p>' + pal('c1', g.c1) + '<p class="ph-note">' + L('Tegn og bokstaver', 'Sign and letters') + '</p>' + pal('c2', g.c2) +
        '<div class="pnt-row"><label class="ph-btn sm pnt-up">' + L('Last opp eget bilde', 'Upload a picture') + '<input id="pntLogoFile" type="file" accept="image/*" hidden></label>' + (lg ? ' <button class="ph-btn sm" data-pa="pntlgoff">' + L('Uten logo', 'No logo') + '</button>' : '') + '</div>' +
        '<p class="ph-note">' + L('Et opplastet bilde ser alle som er i nærheten av båten din. Er det støtende, kan det bli tatt bort, og da får du beskjed om hvorfor og kan velge et nytt uten å betale igjen.',
          'Everyone near your boat sees an uploaded picture. If it is offensive it may be taken away; you are then told why and may choose a new one without paying again.') + '</p>' +
        (!has && lg ? '<button class="ph-btn" data-pa="pntbuy" data-d="logo">' + shopLabel(nok('logo')) + '</button>' + shopFine() : '') + '</div>'); }
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
    const f = flagOf(flagOk(pre) ? pre : b.liv); if (f.code !== 'NO' || f.shape !== 'rekt') liv.flag = {c:f.code, s:f.shape};
    if (pre.logo !== undefined && owned('logo')) logoSet(pre.logo);
    if (Object.keys(liv).length) b.liv = liv; else delete b.liv;
  }
  function act(a, d){
    const b = S.boat; if (!pre) pre = copy(b.liv);
    if (a === 'pntsel'){ if (!HULLPAL.some(x => x[0] === d.k)) return false; pre.hull = d.k; PAINTPRE = pre; return true; }
    if (a === 'pntd'){ const k = d.d; if (!DESIGNS.includes(k)) return false;
      if (!d.k) delete pre.d[k]; else if (k === 'lakk') pre.d[k] = 1; else if (HULLPAL.some(x => x[0] === d.k && x[3])) pre.d[k] = d.k; else return false;
      PAINTPRE = pre; return true; }
    if (a === 'pntf'){ if (!FLAGS[d.k] && d.k !== 'LOGO') return false; const f = flagOf(pre); pre.flag = {c:d.k, s:d.k === 'NO' && f.shape === 'splitt' ? 'rekt' : f.shape}; PAINTPRE = pre; return true; }
    if (a === 'pntfs'){ if (!FLAGSHAPES.includes(d.k)) return false; const f = flagOf(pre); if (f.code === 'NO' && d.k === 'splitt') return false; pre.flag = {c:f.code, s:d.k}; PAINTPRE = pre; return true; }
    if (a === 'pntlg' || a === 'pntlgc' || a === 'pntlgt'){ const cur0 = pre.logo !== undefined ? pre.logo : S.logo, g = Object.assign({kind:'g', sym:'anker', txt:initials(), c1:'marine', c2:'hvit'}, cur0 && cur0.kind === 'g' ? cur0 : {});
      if (a === 'pntlg'){ if (!LOGOSYM[d.k]) return false; g.sym = d.k; }
      else if (a === 'pntlgc'){ if (!['c1', 'c2'].includes(d.d) || !palRGB(d.k)) return false; g[d.d] = d.k; }
      else { const el = document.getElementById('pntLogoTxt'); g.txt = String(el ? el.value : '').toUpperCase().replace(/[^A-ZÆØÅ]/g, '').slice(0, 3); }
      pre.logo = g; PAINTPRE = pre; return true; }
    if (a === 'pntlgoff'){ pre.logo = null; if (flagOf(pre).code === 'LOGO') pre.flag = {c:'NO', s:'rekt'}; PAINTPRE = pre; return true; }
    if (a === 'pntreg'){ const r = regOf(b), el = document.getElementById('pntNum'), n = el ? Math.round(+el.value) : 0; if (!r) return false;
      if (!(n >= 1 && n <= 9999)){ toast(L('Velg et nummer fra 1 til 9999.', 'Choose a number from 1 to 9999.')); return false; }
      if (n === r.n) return false;
      if (regUsed(r.f, r.k, n)){ toast(L(r.f + '-' + n + '-' + r.k + ' er en ekte båt. Velg et annet nummer.', r.f + '-' + n + '-' + r.k + ' is a real boat. Choose another number.')); return false; }
      if (owned('reg')){ regSet(n); return false; }
      S.cosWant = Object.assign({}, S.cosWant, {reg:n}); payBuy('des_reg', () => { giveCos('reg'); if (typeof DOCK !== 'undefined') DOCK.render(); }); return true; }
    if (a === 'pntbuy'){ const k = d.d; if (!COS.includes(k) || owned(k)) return false;
      S.cosWant = Object.assign({}, S.cosWant, {[k]:k === 'flagg' ? Object.assign({}, pre.flag) : k === 'logo' ? pre.logo || null : pre.d[k] || 1});   // what to put on when it comes back from the payment
      payBuy('des_' + k, () => { giveCos(k); const was = pre; pre = copy(S.boat.liv); if (k === 'logo' && was && flagOf(was).code === 'LOGO') pre.flag = was.flag; PAINTPRE = pre; if (typeof DOCK !== 'undefined'){ DOCK.render(); DOCK.redraw(); } });
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
  // a picture chosen for the logo: made 256 × 256 (contained, the rest clear) and small enough to share (WebP, else PNG; about 45 kB at
  // most as text), then tried on the boat like the rest
  function upload(file){
    if (!file || !/^image\//.test(file.type)) return; const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), k = Math.min(256 / im.naturalWidth, 256 / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
        g.drawImage(im, (256 - w) / 2, (256 - h) / 2, w, h); let url = cv.toDataURL('image/webp', 0.85); if (!/^data:image\/webp/.test(url) || url.length > 58000) url = cv.toDataURL('image/webp', 0.6);
        if (!/^data:image\/webp/.test(url)) url = cv.toDataURL('image/png'); if (url.length > 58000){ cv.width = cv.height = 160; cv.getContext('2d').drawImage(im, 0, 0, 160, 160); url = cv.toDataURL('image/png'); }
        if (url.length > 58000){ toast(L('Bildet er for stort. Prøv et enklere bilde.', 'The picture is too big. Try a simpler one.')); return; }
        if (!pre) pre = copy(S.boat.liv); pre.logo = {kind:'u', img:url}; PAINTPRE = pre; if (typeof DOCK !== 'undefined') DOCK.redraw(); };
      im.src = fr.result; };
    fr.readAsDataURL(file);
  }
  if (typeof document !== 'undefined') document.addEventListener('change', e => { if (e.target && e.target.id === 'pntLogoFile') upload(e.target.files && e.target.files[0]); });
  return {page, act, live, price, owned, DNAME, nok};
})();
// the company's logo is set (yours once bought): a picture goes to the shared world first (logo_put; one per player, the admin may take
// it away), without the cloud (the artifact, the tests) it stays on this device
async function logoSet(L){
  if (!L){ S.logo = null; return; }
  if (L.kind === 'u' && typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest())){
    try { const v = await cloudRpc('logo_put', {img:L.img}); L = Object.assign({}, L, {ver:+v || 1}); }
    catch (e){ toast(S.lang === 'en' ? 'The picture could not be put up just now. Try again later.' : 'Bildet kunne ikke legges ut akkurat nå. Prøv igjen senere.'); return; } }
  S.logo = L; save();
}
// on start: a picture the admin has taken away is gone from the boats, and the player is told why (the logo is still theirs)
async function logoCheck(){
  if (!S.logo || S.logo.kind !== 'u' || typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user) return;
  let r = null; try { r = await cloudRpc('logo_mine', {}); } catch (e){ return; }
  if (r && r.removed){ S.logo = null; if (S.boat.liv && S.boat.liv.flag && S.boat.liv.flag.c === 'LOGO') S.boat.liv.flag = {c:'NO', s:'rekt'};
    msg('Malerverkstedet', 'Logoen din er tatt bort' + (r.reason ? ': ' + r.reason : '.') + ' Du kan laste opp et nytt bilde i Malerverkstedet uten å betale igjen.', 'Your logo has been taken away' + (r.reason ? ': ' + r.reason : '.') + ' You can upload a new picture in the paint shop without paying again.'); save(); }
}
// a design is yours (the shop's grant, ui/10i-shop.js shopGive, or a test): on every boat from now on, and on this one at once if it was
// being tried when it was bought
function giveCos(k){
  if (!COS.includes(k)) return null; S.cos = Object.assign({}, S.cos, {[k]:1});
  const want = S.cosWant && S.cosWant[k], b = S.boat; if (S.cosWant) delete S.cosWant[k];
  if (want && k === 'reg') regSet(want);
  else if (k === 'logo' && want) logoSet(want);
  else if (want && k === 'flagg' && want.c){ b.liv = Object.assign({}, b.liv, {flag:{c:want.c, s:want.s || 'rekt'}}); }
  else if (want && designFits(b.type, k)){ b.liv = Object.assign({}, b.liv); b.liv.d = Object.assign({}, b.liv.d, {[k]:want}); }
  const N = PAINT.DNAME[k]; log('Du har nå «' + N[0] + '» i Malerverkstedet.', 'You now have «' + N[1] + '» in the paint shop.');
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
