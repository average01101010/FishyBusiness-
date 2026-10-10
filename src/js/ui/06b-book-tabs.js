// ---------- the deck log's other tabs: seasons, events, gear and sales ----------
// Each tab is a list of pages in the same book (ui/06-logbook.js), oldest first, so a tab opens at its newest page. Everything here
// is read from what drives the game: the season rules and monthly prices in core, the weekly price movement (weekDev), the weather
// premium (supplyFactor), the gear that has stood in the sea (S.sets and S.gearLog) and the landing notes kept with each sale.
const BKL = (no, en) => S.lang === 'no' ? no : en;
const bkMin = ms => (ms - EPOCH) / 6e4;   // a date as game minutes
const bkDate = m => { const d = gDate(m / 60); return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear(); };
const bkMonth = i => (S.lang === 'no' ? MONF.no : MONF.en)[((i % 12) + 12) % 12];
const pctS = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), 0) + ' %';
// entries a page holds, and the pages a list of entries makes
function bkPages(items, per, head, empty){
  if (!items.length) return [head + '<p class="hw">' + empty + '</p>'];
  const out = []; for (let i = 0; i < items.length; i += per) out.push(head + items.slice(i, i + per).join(''));
  return out;
}
const bkHead = (no, en, sub) => '<div class="pg-h"><span class="pg-t">' + BKL(no, en) + '</span><span class="pg-d">' + (sub || '') + '</span></div>';
// an entry as in a ring binder: title and dates in ink, text below; one that is over is crossed out
const bkEntry = (e, now) => '<div class="bk-e' + (e.b < now ? ' over' : e.a <= now ? ' now' : '') + '"><div class="bk-et"><span>' + BKL(e.t[0], e.t[1]) + '</span><span class="bk-ed">' + bkDate(e.a) + (e.b - e.a > 1440 ? ' – ' + bkDate(e.b) : '') + '</span></div><p class="hw">' + BKL(e.x[0], e.x[1]) + (e.a <= now && e.b >= now ? ' <b class="bk-nw">' + BKL('nå', 'now') + '</b>' : '') + '</p></div>';

// --- seasons: this year's rules and the months each species fetches more or less than usual
function bookSeasons(){
  const now = S.t, y = gDate(now / 60).getUTCFullYear(), D = (yy, m, d) => bkMin(Date.UTC(yy, m, d)), out = [];
  const E = (a, b, t, x) => out.push({a, b, t, x});
  E(D(y - 1, 11, 20), D(y, 3, 20) + 1439, ['Kveita er fredet', 'Halibut closed'], ['Fra 20. desember til og med 20. april er det forbudt å fiske kveite nord for 62° N. Levende kveite slippes med én gang.', 'From 20 December to 20 April halibut may not be fished north of 62° N. Live halibut is released at once.']);
  E(D(y, 0, 1), D(y, 3, 30) + 1439, ['Skreisesongen', 'Skrei season'], ['Skreien står inne på kysten for å gyte. Mest i februar og mars, og fisken er stor.', 'The skrei is in on the coast to spawn. Most in February and March, and the fish are big.']);
  const sd = codStopDoy(y); E(D(y, 0, 1), sd != null ? D(y, 0, 1 + sd) - 1 : D(y, 11, 31) + 1439, ['Maksimalkvoter i åpen gruppe', 'Maximum quotas in the open group'], ['Båtene i åpen gruppe kan fiske mot maksimalkvoten. Etter stoppen gjelder bare den garanterte kvoten.', 'Open-group boats may fish towards the maximum quota. After the stop only the guaranteed quota applies.']);
  E(D(y, 5, 1), D(y, 7, 31) + 1439, ['Uer på juksa', 'Redfish on the jig'], ['Båter under 15 meter kan fiske uer med juksa. Resten av året er uer bare tillatt som bifangst.', 'Boats under 15 m may jig for redfish. The rest of the year redfish is bycatch only.']);
  E(D(y, 5, 29), D(y, 11, 31) + 1439, ['Ferskfiskordningen', 'The fresh-fish scheme'], ['Torsk tilsvarende 20 % av det du lander fersk hver uke kommer utenom kvoten. Noen år øker andelen om høsten.', 'Cod up to 20 % of what you land fresh each week comes on top of the quota. Some years the share is raised in the autumn.']);
  // the price seasons (the king crab's too), from the monthly curves: months in a row that stand out
  const runs = (vals, ok) => { const r = []; for (let m = 0; m < 12; m++) if (ok(vals[m]) && !ok(vals[(m + 11) % 12])){ let e = m; while (ok(vals[(e + 1) % 12]) && e - m < 11) e++; r.push([m, e]); } return r; };
  for (const sp of [...SP, 'krabbe']){
    const pm = SPECIES[sp].pm, mean = pm.reduce((a, v) => a + v, 0) / 12, n0 = SPECIES[sp].no.toLowerCase(), n1 = SPECIES[sp].en.toLowerCase();
    for (const [hi, ok] of [[true, v => v >= mean * 1.1], [false, v => v <= mean * 0.9]]) for (const [m, e] of runs(pm, ok)){
      const ms = []; for (let k = m; k <= e; k++) ms.push(pm[k % 12]); const dv = (ms.reduce((a, v) => a + v, 0) / ms.length / mean - 1) * 100;
      const a = D(y, m, 1), b = D(y, e + 1, 1) - 1, span = bkMonth(m) + (e > m ? '–' + bkMonth(e) : '');
      E(a, b, hi ? ['Høy pris på ' + n0, 'High price for ' + n1] : ['Lav pris på ' + n0, 'Low price for ' + n1],
        hi ? ['Etterspørselen er stor, og prisen ligger rundt ' + pctS(dv) + ' over årssnittet i ' + span + '.', 'Demand is high, and the price is about ' + pctS(dv) + ' above the yearly average in ' + span + '.']
           : ['Etterspørselen er lav, og prisen ligger rundt ' + pctS(dv) + ' under årssnittet i ' + span + '.', 'Demand is low, and the price is about ' + pctS(dv) + ' below the yearly average in ' + span + '.']);
    }
  }
  return out.sort((p, q) => p.a - q.a || p.b - q.b);
}

// --- events: what moved the prices these last four weeks, and the rules that changed
function bookEvents(){
  const now = S.t, H = now / 60, w0 = weekOfH(H), from = (w0 - 4) * 168 - 6, out = [], y = gDate(H).getUTCFullYear();
  const E = (a, b, t, x) => out.push({a, b, t, x});
  for (let w = w0 - 4; w <= w0; w++){
    const Hs = w * 168 - 6;
    for (const sp of SP){ const dv = weekDev(sp, Hs + 1) * 100; if (Math.abs(dv) < 8) continue;
      const n0 = SPECIES[sp].no.toLowerCase(), n1 = SPECIES[sp].en.toLowerCase();
      E(Hs * 60, (Hs + 168) * 60 - 1, dv > 0 ? ['Stor etterspørsel etter ' + n0, 'Strong demand for ' + n1] : ['Lite etterspørsel etter ' + n0, 'Weak demand for ' + n1],
        [(dv > 0 ? 'Mottakene vil ha mer ' + n0 + '. ' : 'Mottakene har nok ' + n0 + '. ') + 'Prisen ligger ' + pctS(dv) + ' mot det vanlige for årstida denne uka.', (dv > 0 ? 'The plants want more ' + n1 + '. ' : 'The plants have enough ' + n1 + '. ') + 'The price is ' + pctS(dv) + ' against the usual for the season this week.']); }
  }
  for (let d = Math.ceil(from / 24); d * 24 <= H; d++){ const sf = supplyFactor(d * 24 + 7); if (sf < 1.025) continue;
    E(d * 1440, d * 1440 + 1439, ['Uvær ga toppris', 'Bad weather, top prices'], ['Få båter kom seg ut, og mottakene betalte rundt ' + pctS((sf - 1) * 100) + ' ekstra for fisken.', 'Few boats got out, and the plants paid about ' + pctS((sf - 1) * 100) + ' extra for the fish.']); }
  const D = (m, d) => bkMin(Date.UTC(y, m, d)), sd = codStopDoy(y), stop = sd != null ? bkMin(Date.UTC(y, 0, 1 + sd)) : null, end = D(11, 31) + 1439, Y = qyAt(H), dd = d => bkMin(Date.UTC(y, 0, 1 + d));
  const rules = [...(stop != null ? [[stop - 7 * 1440, stop - 1, ['Varsel om kvotestopp', 'Quota stop announced'], ['Fiskeridirektoratet stopper fisket på maksimalkvotene i åpen gruppe ' + bkDate(stop) + '.', 'The Directorate stops fishing on the maximum quotas in the open group on ' + bkDate(stop) + '.']],
    [stop, end, ['Maksimalkvotefisket er stoppet', 'Maximum-quota fishing stopped'], ['Resten av året gjelder bare de garanterte kvotene i åpen gruppe.', 'For the rest of the year only the guaranteed quotas apply in the open group.']]] : []),
    ...Y.log.filter(e => e[1] === 'raise').map(e => [dd(e[0]), end, ['Maksimalkvotene økt', 'Maximum quotas raised'], ['Fiskeridirektoratet økte maksimalkvotene i åpen gruppe med ' + fmt(e[2], 1) + ' tonn torsk.', 'The Directorate raised the open group\'s maximum quotas by ' + fmt(e[2], 1) + ' t of cod.']]),
    ...Y.log.filter(e => e[1] === 'free').map(e => [dd(e[0]), end, ['Fritt fiske i åpen gruppe', 'Free fishing in the open group'], ['Resten av året kan båtene i åpen gruppe fiske torsk uten maksimalkvote.', 'For the rest of the year the open group may fish cod without a maximum quota.']]),
    ...ffPlan(y).slice(1).map(([d0, p]) => [dd(d0), end, ['Ferskfiskordningen endret', 'Fresh-fish scheme changed'], [p ? 'Fra nå er tillegget ' + Math.round(p * 100) + ' % av ukas ferske landinger.' : 'Ordningen er stoppet: avsetningen er tatt.', p ? 'From now the allowance is ' + Math.round(p * 100) + ' % of the week\'s fresh landings.' : 'The scheme has stopped: its share is taken.']]),
    [D(5, 29), end, ['Ferskfiskordningen er i gang', 'The fresh-fish scheme has started'], ['Torsk tilsvarende 20 % av det du lander fersk hver uke kommer utenom kvoten.', 'Cod up to 20 % of what you land fresh each week comes on top of the quota.']],
    [D(3, 21), D(11, 19) + 1439, ['Kveitefisket er åpent', 'Halibut fishing open'], ['Fredningen er over. Minstemålet er 84 cm, og kveite over 200 cm skal slippes.', 'The closed season is over. The minimum size is 84 cm, and halibut over 200 cm goes back.']],
    [D(11, 20), bkMin(Date.UTC(y + 1, 3, 20)) + 1439, ['Kveita er fredet', 'Halibut closed'], ['Fram til og med 20. april er det forbudt å fiske kveite nord for 62° N.', 'Until 20 April halibut may not be fished north of 62° N.']],
    [D(5, 1), D(7, 31) + 1439, ['Uerfisket åpner for juksa', 'Redfish opens for jigs'], ['Fra 1. juni til 31. august kan båter under 15 meter fiske uer med juksa.', 'From 1 June to 31 August boats under 15 m may jig for redfish.']]];
  for (const [a, b, t, x] of rules) if (a >= from * 60 && a <= now) E(a, b, t, x);
  return out.sort((p, q) => p.a - q.a);
}

// --- gear: every set that has stood in the sea, with the hours as tally marks
const bkTally = h => { if (h > 40) return '<b class="hw">' + fmt(h, 0) + ' t</b>'; const g = []; let n = Math.floor(h);
  while (n > 0){ const k = Math.min(5, n); n -= k; g.push('<svg class="bk-tl" viewBox="0 0 26 18" width="' + (k === 5 ? 26 : 5 * k + 2) + '" height="18">' + [0, 1, 2, 3].slice(0, Math.min(4, k)).map(i => '<path d="M' + (3 + i * 5) + ' 2l-1 14"/>').join('') + (k === 5 ? '<path d="M0 12L24 5"/>' : '') + '</svg>'); }
  return g.join('') || '–'; };
const bkDms = p => { const q = LL(p), f = (v, w) => { const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.round(((a - d) * 60 - m) * 60); return d + '° ' + m + "' " + s + '"'; }; return f(q.lat) + ' N, ' + f(q.lon) + (S.lang === 'no' ? ' Ø' : ' E'); };
const BKGEAR = {
  garn:'<svg viewBox="0 0 40 30"><path d="M4 6c10-3 22-3 32 0v18c-10 3-22 3-32 0z" fill="#d9e7ea" stroke="#3d6e7a"/><path d="M4 12h32M4 18h32M10 5v21M16 4v23M22 4v23M28 4v23M34 5v21" stroke="#3d6e7a" stroke-width=".7"/></svg>',
  line:'<svg viewBox="0 0 40 30"><path d="M8 9h24l-3 18H11z" fill="#c9a26b" stroke="#6b4a24"/><ellipse cx="20" cy="9" rx="12" ry="3" fill="#e7d3ad" stroke="#6b4a24"/><path d="M13 9c2 4 5 4 7 0s5-4 7 0" fill="none" stroke="#555" stroke-width=".8"/></svg>',
  teine:'<svg viewBox="0 0 40 30"><path d="M5 26V12a15 9 0 0 1 30 0v14z" fill="#e9dcc0" stroke="#7a5a2a"/><path d="M5 18h30M12 7v19M20 4v22M28 7v19" stroke="#7a5a2a" stroke-width=".8"/><circle cx="20" cy="18" r="3" fill="#fff" stroke="#7a5a2a"/></svg>'};
function bookGear(){
  const log = (S.gearLog || []).slice(), seen = new Set(log.map(e => e.id));
  for (const s of S.sets || []) if (!seen.has(s.id)) log.push(gearLogEntry(s));
  const live = new Map((S.sets || []).map(s => [s.id, s]));
  return log.sort((p, q) => p.tSet - q.tSet).map(e => {
    const s = live.get(e.id), lost = e.lost || (s && s.lost), end = e.tHaul || (lost ? lost : S.t), hrs = Math.max(0, (end - e.tSet) / 60);
    const vt = S.fleet && S.fleet.length > 1 && e.vid ? ' <small>«' + (vget(vesselById(e.vid) || curVessel(), 'boatName') || '') + '»</small>' : '';
    return '<div class="bk-g"><div class="bk-gi">' + (BKGEAR[e.kind] || '') + '</div><div class="bk-gb"><div class="bk-gt">' + BKL(e.lbl[0], e.lbl[1]) + vt + '</div>' +
      '<div class="bk-gr"><span>' + BKL('Satt', 'Set') + ':</span><span class="hw">' + bkDate(e.tSet) + ' ' + hm(e.tSet / 60) + '</span></div>' +
      '<div class="bk-gr"><span>' + BKL('Ståtid (timer)', 'Soak (hours)') + ':</span><span>' + bkTally(hrs) + '</span></div>' +
      '<div class="bk-gr"><span>' + BKL('Posisjon', 'Position') + ':</span><span class="hw">' + bkDms(e) + (e.depth ? ', ' + e.depth + ' m' : '') + '</span></div>' +
      '<div class="bk-gr"><span>' + BKL('Trukket', 'Hauled') + ':</span><span class="hw">' + (e.tHaul ? bkDate(e.tHaul) + ' ' + hm(e.tHaul / 60) : lost ? '<span class="bk-red">' + BKL('tapt', 'lost') + '</span>' : BKL('står i sjøen', 'in the sea')) + '</span></div>' +
      '<div class="bk-gr"><span>' + BKL('Fangst totalt', 'Total catch') + ':</span><span class="hw">' + (e.tHaul ? fmt(e.kg || 0, 0) + ' kg' : '–') + '</span></div></div></div>';
  });
}

// --- sales: the landing notes, one to a page
const BKFISH = (sp) => {
  const S0 = {torsk:['#b8a479', 1], hyse:['#9a9ea6', 2], sei:['#5d6b6a', 0], lyr:['#8f7d4f', 0], lange:['#8a6a46', 3], brosme:['#7d5a38', 4], uer:['#e2673c', 5], kveite:['#7b6a52', 6], blakveite:['#3f3b37', 6], krabbe:['#c8743a', 7]}[sp] || ['#999', 0];
  const c = S0[0], k = S0[1];
  if (k === 6) return '<svg viewBox="0 0 70 34"><path d="M6 17C18 3 42 3 54 17 42 31 18 31 6 17z" fill="' + c + '"/><path d="M54 17l12-9v18z" fill="' + c + '"/><circle cx="16" cy="13" r="1.6" fill="#222"/></svg>';
  if (k === 7) return '<svg viewBox="0 0 70 34"><ellipse cx="35" cy="20" rx="17" ry="10" fill="' + c + '"/><path d="M20 16l-9-8 4 9M50 16l9-8-4 9M22 24l-8 5M48 24l8 5M24 27l-5 6M46 27l5 6" stroke="' + c + '" stroke-width="2.4" fill="none"/></svg>';
  const long = k === 3 ? 1.25 : 1, body = '<path d="M4 17C14 6 38 5 54 12l12-8-3 13 3 13-12-8C38 29 14 28 4 17z" fill="' + c + '" transform="scale(' + long + ' 1)"/>';
  const extra = k === 2 ? '<circle cx="20" cy="15" r="2.4" fill="#222"/><path d="M10 15c15-3 30-2 44 2" stroke="#333" stroke-width=".8" fill="none"/>' : k === 1 ? '<g fill="#7d6a45"><circle cx="24" cy="12" r=".9"/><circle cx="30" cy="14" r=".9"/><circle cx="36" cy="12" r=".9"/><circle cx="42" cy="15" r=".9"/></g><path d="M10 16c15-3 30-2 44 2" stroke="#efe6d0" stroke-width=".9" fill="none"/>'
    : k === 5 ? '<path d="M18 9l3-6 3 5 3-6 3 5 3-6 3 6" fill="' + c + '" stroke="#b5452a" stroke-width=".6"/>' : '<path d="M10 16c15-3 30-2 44 2" stroke="#e8e2d0" stroke-width=".8" fill="none"/>';
  return '<svg viewBox="0 0 76 34">' + body + extra + '<circle cx="10" cy="15" r="1.5" fill="#222"/></svg>';
};
function bookSales(){
  return S.sales.map((x, i) => {
    const d = x.d, p = portById(x.port), vt = S.fleet && S.fleet.length > 1 && x.v ? ' · «' + (vget(vesselById(x.v) || curVessel(), 'boatName') || '') + '»' : '';
    let h = '<div class="pg-h"><span class="pg-t">' + BKL('Sluttseddel', 'Landing note') + (d ? ' #' + String(d.id).padStart(4, '0') : '') + '</span><span class="pg-d">' + (p ? p.name : '') + ' · ' + bkDate(x.t) + ' ' + hm(x.t / 60) + '</span></div>' + (vt ? '<div class="pg-v">' + vt.slice(3) + '</div>' : '');
    if (!d){
      // older landings kept only kilos and kroner per species
      h += '<table class="lg bk-st"><thead><tr><th>' + BKL('Art', 'Species') + '</th><th>' + BKL('Vekt (kg)', 'Weight (kg)') + '</th></tr></thead><tbody>' + (x.sp || []).map(([sp, kg]) => '<tr><td>' + spName(sp) + '</td><td>' + fmt(kg, 0) + '</td></tr>').join('') + '</tbody></table>';
      return h + '<div class="pg-sum">' + BKL('Totalt ', 'Total ') + fmt(x.kg, 0) + ' kg · ' + kr(x.total) + '</div><p class="hw bk-note">' + BKL('Denne landingen ble ført før sluttsedlene kom i boka.', 'This landing was entered before the landing notes came into the book.') + '</p>';
    }
    const bySp = {}; for (const r of d.ln) (bySp[r[0]] = bySp[r[0]] || []).push(r);
    let sumKr = 0, sumKg = 0, sumN = 0;
    for (const sp of Object.keys(bySp)){
      const sd = SPECIES[sp];
      h += '<div class="bk-sp"><span class="bk-sn">' + spName(sp) + '</span><span class="bk-fish">' + BKFISH(sp) + '</span></div><table class="lg bk-st"><thead><tr><th>' + BKL('Størrelse', 'Size') + '</th><th>' + BKL('Kv.', 'Gr.') + '</th><th>' + BKL('Kr/kg', 'NOK/kg') + '</th><th>' + BKL('Sløyd', 'Gutted') + '</th><th>' + BKL('Ant.', 'No.') + '</th><th>kg</th><th>' + BKL('Beløp', 'Amount') + '</th></tr></thead><tbody>';
      for (const [, c, g, gut, kg, sum, n] of bySp[sp]){ const cl = sd && sd.cls[c], wk = gut && sd ? kg / sd.uh : kg; sumKr += sum; sumKg += Math.round(wk); sumN += n || 0;
        h += '<tr><td>' + (cl ? cl[2] : '') + '</td><td>' + g + '</td><td>' + fmt(sum / Math.max(wk, 0.01), 2) + '</td><td>' + (gut ? BKL('ja', 'yes') : '–') + '</td><td>' + (n ? fmt(n, 0) : '–') + '</td><td>' + fmt(Math.round(wk), 0) + '</td><td>' + fmt(sum, 0) + '</td></tr>'; }
      h += '</tbody></table>';
    }
    const row = (a, b, cls) => '<div class="bk-row' + (cls ? ' ' + cls : '') + '"><span>' + a + '</span><span class="hw">' + b + '</span></div>';
    h += '<div class="bk-tot">' + row(BKL('Total fiskemengde', 'Total catch'), fmt(sumN, 0) + BKL(' fisk · ', ' fish · ') + fmt(sumKg, 0) + ' kg · ' + kr(sumKr));
    const bon = [];
    if (d.ex) for (const n in d.ex) if (d.ex[n][1] > 0) bon.push([n === 'lever' ? BKL('Lever', 'Liver') : BKL('Rogn', 'Roe'), kr(d.ex[n][1])]);
    if (d.st && d.st[1] > 0) bon.push([BKL('Innloggingsbonus ', 'Login bonus ') + pctS(d.st[0]), kr(d.st[1])]);
    if (d.ord > 0) bon.push([BKL('Tillegg for oppdrag', 'Order premiums'), kr(d.ord)]);
    if (bon.length) h += '<div class="bk-sub">' + BKL('Bonus', 'Bonus') + '</div>' + bon.map(([a, b]) => row(a, b)).join('');
    const cost = [];
    if (d.conf && d.conf[1] > 0.5) cost.push([BKL('Inndratt over kvote eller bifangst', 'Confiscated over quota or bycatch'), '−' + kr(d.conf[1])]);
    if (d.conf && d.conf[3] > 0.5) cost.push([BKL('Krabbe under minstemål', 'Undersized crab'), '−' + kr(d.conf[3])]);
    if (d.roe > 0.5) cost.push([BKL('Trekk for rognkrabbe', 'Berried crab deduction'), '−' + kr(d.roe)]);
    const tks = (d.tk || []).reduce((a, v) => a + v, 0);
    if (tks > 0) cost.push([BKL('Trekk til Råfisklaget og staten', 'Sales organisation and state levies'), '−' + kr(tks)]);
    for (const [nm, sh] of d.crew || []) cost.push([nm + ' · ' + fmt(sh * 100, 0) + ' % ' + BKL('lott', 'share'), '−' + kr(Math.round(sh * (x.total - tks)))]);
    if (d.fine > 0) cost.push([BKL('Gebyr fra Fiskeridirektoratet', 'Fine from the Directorate'), '−' + kr(d.fine)]);
    if (cost.length) h += '<div class="bk-sub">' + BKL('Utgifter', 'Expenses') + '</div>' + cost.map(([a, b]) => row(a, b, 'red')).join('');
    h += row('<b>' + BKL('Netto til kassa', 'Net to the cash box') + '</b>', '<b>' + kr(x.total - tks - (d.lott || 0) - (d.fine || 0)) + '</b>', 'net') + '</div>';
    return h;
  });
}
// the entry for a set in the gear log, from the set itself
function gearLogEntry(s){
  const m = setMid(s), lbl = s.kind === 'garn' ? [s.n + ' garn ' + netNo(s), s.n + ' nets ' + netEn(s)] : s.kind === 'line' ? [s.n + ' ' + (s.n === 1 ? 'stamp' : 'stamper') + ' ' + LINE_KINDS[s.lk].no.toLowerCase(), s.n + ' ' + (s.n === 1 ? 'tub' : 'tubs') + ' of ' + LINE_KINDS[s.lk].en.toLowerCase()] : [s.n + ' ' + POTS[s.pot].no.toLowerCase(), s.n + ' ' + POTS[s.pot].en.toLowerCase()];
  return {id:s.id, vid:s.vid, kind:s.kind, lbl, n:s.n, tSet:s.tSet, x:m.x, y:m.y, depth:s.depth, tHaul:null, kg:null, lost:null};
}
function bookTabPages(t){
  const now = S.t;
  if (t === 'ses'){ const y = gDate(now / 60).getUTCFullYear(); return bkPages(bookSeasons().map(e => bkEntry(e, now)), 5, bkHead('Sesonger', 'Seasons', y), BKL('Ingen sesonger.', 'No seasons.')); }
  if (t === 'hen') return bkPages(bookEvents().map(e => bkEntry(e, now)), 5, bkHead('Hendelser', 'Events', BKL('siste fire uker', 'last four weeks')), BKL('Ingen hendelser de siste fire ukene. Prisene har ligget som vanlig for årstida.', 'No events these last four weeks. Prices have been as usual for the season.'));
  if (t === 'uts') return bkPages(bookGear(), 3, bkHead('Utstyr', 'Gear', BKL('redskap i sjøen', 'gear in the sea')), BKL('Ingen redskap er satt ennå.', 'No gear has been set yet.'));
  if (t === 'salg'){ const p = bookSales(); return p.length ? p : [bkHead('Salg', 'Sales') + '<p class="hw">' + BKL('Ingen landinger ennå.', 'No landings yet.') + '</p>']; }
  return [];
}
