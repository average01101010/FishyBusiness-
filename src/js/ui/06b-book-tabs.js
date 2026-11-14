// ---------- the deck log's other tab: the sales (D4, 14.11.2026: the tabs for seasons, events and gear went out, Jonas 13.11.2026) ----------
// Each tab is a list of pages in the same book (ui/06-logbook.js), oldest first, so a tab opens at its newest page. Everything here
// is read from what drives the game: the season rules and monthly prices in core, the weekly price movement (weekDev), the weather
// premium (supplyFactor), the gear that has stood in the sea (S.sets and S.gearLog) and the landing notes kept with each sale.
const BKL = (no, en) => S.lang === 'no' ? no : en;
const bkDate = m => { const d = gDate(m / 60); return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear(); };
const pctS = v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), 0) + ' %';
const bkHead = (no, en, sub) => '<div class="pg-h"><span class="pg-t">' + BKL(no, en) + '</span><span class="pg-d">' + (sub || '') + '</span></div>';
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
      for (const [, c, g, gut, kg, sum, n, fz] of bySp[sp]){ const cl = sd && sd.cls[c], wk = gut && sd ? kg / sd.uh : kg; sumKr += sum; sumKg += Math.round(wk); sumN += n || 0;
        h += '<tr><td>' + (cl ? cl[2] : '') + '</td><td>' + g + (fz ? BKL(' fryst', ' frozen') : '') + '</td><td>' + fmt(sum / Math.max(wk, 0.01), 2) + '</td><td>' + (gut ? BKL('ja', 'yes') : '–') + '</td><td>' + (n ? fmt(n, 0) : '–') + '</td><td>' + fmt(Math.round(wk), 0) + '</td><td>' + fmt(sum, 0) + '</td></tr>'; }
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
    if (d.ved > 0.5) cost.push([BKL('Vederlag for ilandføring, 20 % av det inndratte', 'Compensation for landing, 20 % of what was confiscated'), kr(d.ved)]);
    if (d.conf && d.conf[3] > 0.5) cost.push([BKL('Krabbe under minstemål', 'Undersized crab'), '−' + kr(d.conf[3])]);
    if (d.roe > 0.5) cost.push([BKL('Trekk for rognkrabbe', 'Berried crab deduction'), '−' + kr(d.roe)]);
    if (d.gf > 0.5) cost.push([BKL('Sløyd på mottaket', 'Gutted by the buyer'), '−' + kr(d.gf)]);   // (round haddock and saithe, R2)
    const tks = (d.tk || []).reduce((a, v) => a + v, 0);
    if (tks > 0) cost.push([BKL('Trekk til Råfisklaget og staten', 'Sales organisation and state levies'), '−' + kr(tks)]);
    // the common costs and the shares (Økonomi 2, Ø2: [name, shares, kr, skipper]); a note from before has [name, part of the net]
    if (d.fk){ const [fl, fkr, ik, ikr, bkr, hkr, gkr] = d.fk; if (hkr > 0) cost.push([BKL('Felleskostnad: havneavgift', 'Common cost: harbour dues'), '(' + kr(hkr) + ')']); if (gkr > 0) cost.push([BKL('Felleskostnad: juksautstyr og tapt redskap', 'Common cost: jig tackle and gear lost'), '(' + kr(gkr) + ')']); if (fkr > 0) cost.push([BKL('Felleskostnad: drivstoff ', 'Common cost: fuel ') + fmt(fl, 0) + ' l', '(' + kr(fkr) + ')']); if (ikr > 0) cost.push([BKL('Felleskostnad: is ', 'Common cost: ice ') + fmt(ik, 0) + ' kg', '(' + kr(ikr) + ')']); if (bkr > 0) cost.push([BKL('Felleskostnad: agn', 'Common cost: bait'), '(' + kr(bkr) + ')']); }
    if (d.dl && (d.crew || []).length) cost.push([BKL('Delingsfangst ', 'Shared catch ') + kr(d.dl[0]) + BKL(', mannskapets del ', ', the crew\'s part ') + fmt(d.dl[1] * 100, 0) + ' %', '']);
    for (const r of d.crew || []){ const [nm, sh, k2, sk, sx] = r; cost.push(k2 != null ? [nm + ' · ' + lotS(sh) + (sk ? BKL(' + skippertillegg', ' + skipper\'s extra') + (sx ? ' ' + fmt(sx, 2) : '') : ''), '−' + kr(k2)] : [nm + ' · ' + fmt(sh * 100, 0) + ' % ' + BKL('lott', 'share'), '−' + kr(Math.round(sh * (x.total - tks)))]); }
    if (d.fine > 0) cost.push([BKL('Gebyr fra Fiskeridirektoratet', 'Fine from the Directorate'), '−' + kr(d.fine)]);
    if (cost.length) h += '<div class="bk-sub">' + BKL('Utgifter', 'Expenses') + '</div>' + cost.map(([a, b]) => row(a, b, 'red')).join('');
    h += row('<b>' + BKL('Netto til kassa', 'Net to the cash box') + '</b>', '<b>' + kr(x.total - tks - (d.lott || 0) - (d.fine || 0)) + '</b>', 'net') + '</div>';
    return h;
  });
}
// the entry for a set in the gear log, from the set itself
function gearLogEntry(s){
  const m = setMid(s), lbl = s.kind === 'garn' ? netN(s, s.n) : s.kind === 'line' ? [s.n + ' ' + (s.n === 1 ? 'stamp' : 'stamper') + ' ' + LINE_KINDS[s.lk].no.toLowerCase(), s.n + ' ' + (s.n === 1 ? 'tub' : 'tubs') + ' of ' + LINE_KINDS[s.lk].en.toLowerCase()] : [s.n + ' ' + POTS[s.pot].no.toLowerCase(), s.n + ' ' + POTS[s.pot].en.toLowerCase()];
  return {id:s.id, vid:s.vid, kind:s.kind, lbl, n:s.n, tSet:s.tSet, x:m.x, y:m.y, depth:s.depth, tHaul:null, kg:null, lost:null};
}
function bookTabPages(t, spread){
  if (t === 'salg'){ const p = bookSales(); return p.length ? p : [bkHead('Salg', 'Sales') + '<p class="hw">' + BKL('Ingen landinger ennå.', 'No landings yet.') + '</p>']; }
  return [];
}
