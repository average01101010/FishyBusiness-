// The car ferries along the whole coast (Ø15 N3, 11.11.2026; tools/npc/ferje.py → src/data/ferje.json, core/05b-ferje.js): the data
// (no operator, line or vessel in it, the size), a ferry's place as a pure function of the clock (at the quay before the departure,
// in the middle of the leg half-way, at the other quay after the crossing's time, at a quay at night; the same clock gives the same
// place), the week's journeys dealt to ferries that are where their next journey leaves from, Senja's own ferry as she has always
// sailed, the names, the AIS range, and the departures a storm stops.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

export default function (t){
  const K = t.K, raw = readFileSync(join(SRC, 'data', 'ferje.json'), 'utf8'), D = JSON.parse(raw);
  const EPOCH = K.get('EPOCH'), HofUTC = (y, m, d, h = 0, mi = 0) => (Date.UTC(y, m, d, h, mi) - EPOCH) / 3600000;
  // a Wednesday in November 2027 (the winter week), at minute mi of the day
  const WED = new Date(Date.UTC(2027, 10, 17)); t.eq(WED.getUTCDay(), 3, '17.11.2027 er en onsdag');
  const H = mi => HofUTC(2027, 10, 17, 0, 0) + mi / 60;

  // 1. the data
  t.ok(raw.length < 200000, `ferje.json er under 0,2 MB (${(raw.length / 1000).toFixed(1)} kB)`);
  t.ok(D.s.length >= 100 && D.q.length >= 250 && D.l.length >= 200, `${D.s.length} samband, ${D.q.length} kaier og ${D.l.length} legger`);
  t.eq(Object.keys(D).sort().join(), 'l,meta,q,s', 'fila har bare meta, kaiene, leggene og sambandene');
  t.ok(D.s.every(e => Object.keys(e).every(k => ['k', 'p', 'w', 's'].includes(k))), 'et samband har bare størrelsesklassen, mønstrene og ukene (ingen operatør, linje eller fartøy)');
  t.ok(!/Authority|Line:|ServiceJourney|\bAS\b|M\/?F |M\/?S /.test(raw.replace(D.meta.src, '').replace(D.meta.lic, '')), 'ingen operatør, linje-id eller fartøynavn i fila');
  t.ok(/NLOD/.test(D.meta.lic) && /Entur/.test(D.meta.src) && D.meta.baked === true, 'kilden og lisensen står i fila, og leggene er bakt mot spillets land');
  t.ok(D.s.every(e => e.k >= 0 && e.k <= 2 && e.p.every(([q, tm]) => q.length >= 2 && tm.length === 2 * q.length - 3 && tm.every((v, i) => v > 0 && (!i || v >= tm[i - 1])))), 'hvert mønster har kaier og stigende tider (ankomst, avgang, ankomst …)');

  // 2. the three crossings of the plan are there, and a ferry's place follows the clock
  const F = K.ferjeInit(), at = (R, s) => K.atRoute(R, s).p, dist = K.dist;
  for (const [a, b] of [['Halhjem', 'Sandvikvåg'], ['Bodø', 'Moskenes'], ['Bognes', 'Lødingen']]){
    const s = K.ferjeFind(a, b); t.ok(!!s, `${a}–${b} er med`); if (!s) continue;
    // the first departure after 06:00, Wednesday or the first day after it that has one, of a pattern that begins with the leg between the two
    let best = null;
    for (let dd = 0; dd < 7 && !best; dd++) for (const P of s.pats){ const n0 = F.q[P.q[0]].name, n1 = F.q[P.q[1]].name; if (!((n0 === a && n1 === b) || (n0 === b && n1 === a))) continue;
      let m = 0; for (const dt of s.w.t[s.w.d[(2 + dd) % 7]][P.i] || []){ m += dt; if (m >= 360 && (!best || m < best.m)) best = {m:m + dd * 1440, P}; } }
    t.ok(!!best, `${a}–${b} har en avgang etter kl. 06 onsdag eller en av dagene etter`); if (!best) continue;
    const {m, P} = best, R = P.R[0], dur = P.tm[0], q0 = F.q[P.q[0]], q1 = F.q[P.q[1]], off = s.L / 2000 + 0.04, hhmm = ['on', 'to', 'fr', 'lø', 'sø', 'ma', 'ti'][Math.floor(m / 1440)] + ' ' + String(Math.floor(m % 1440 / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    const before = K.ferjeStates(s, H(m - 0.5), false), lying = before.filter(n => n.v === 0 && dist(n.p, q0.p) <= off);
    t.ok(lying.length >= 1, `${q0.name}–${q1.name}: en ferje ligger ved ${q0.name} et halvt minutt før avgangen ${hhmm}`);
    const mid = K.ferjeStates(s, H(m + dur / 2), false), under = mid.filter(n => n.v > 0 && dist(n.p, at(R, R.len / 2)) < 0.05 && lying.some(q => q.id === n.id));
    t.ok(under.length === 1, `${q0.name}–${q1.name}: den samme ferja er midt i leia midtveis (${under.length ? under[0].v + ' kn, ' + R.len.toFixed(1) + ' km på ' + dur + ' min' : 'ingen'})`);
    const after = K.ferjeStates(s, H(m + dur + 0.4), false).find(n => under.length && n.id === under[0].id);
    t.ok(after && after.v === 0 && dist(after.p, q1.p) <= off, `${q0.name}–${q1.name}: hun ligger ved ${q1.name} etter overfartstida`);
    t.ok(JSON.stringify(K.ferjeStates(s, H(m + 7.25), false)) === JSON.stringify(K.ferjeStates(s, H(m + 7.25), false)), `${a}–${b}: samme klokke gir samme posisjon`);
    t.ok(mid.every(n => n.type === 'ferry' && n.L === s.L && n.B === s.B && n.T === s.T && /^MF [A-ZÆØÅ]/.test(n.name)), `${a}–${b}: typen ferry, lengde, bredde og dypgående fra størrelsesklassen (${s.L} × ${s.B} m), oppdiktet navn (${mid.map(n => n.name).join(', ')})`);
  }
  // another core gives the same ferries (the names and the deal come from the data alone)
  const K2 = t.fresh(), s1 = K.ferjeFind('Halhjem', 'Sandvikvåg'), s2 = K2.ferjeFind('Halhjem', 'Sandvikvåg');
  t.ok(JSON.stringify(K2.ferjeStates(s2, H(611.3), false)) === JSON.stringify(K.ferjeStates(s1, H(611.3), false)), 'en annen spiller (en ny kjerne) ser de samme ferjene på samme sted med samme navn');

  // 3. at night: every ferry that is not under way lies at a quay of her crossing, and few are under way at 03
  let nN = 0, nU = 0, off = 0;
  for (const s of F.s) for (const n of K.ferjeStates(s, H(180), false)){ nN++; if (n.v > 0){ nU++; continue; }
    if (!s.pats.some(P => P.q.some(q => dist(n.p, F.q[q].p) <= s.L / 2000 + 0.04))) off++; }
  t.ok(nN >= 150 && off === 0 && nU < nN * 0.15, `kl. 03 ligger ferjene ved en ferjekai (${nN} ferjer, ${nU} under fart, ${off} et annet sted)`);

  // 4. the deal: every journey to one ferry, and a ferry's next journey leaves from where her last one ended, after it ended
  let trips = 0, dealt = 0, jump = 0, early = 0, wrap = 0, ferries = 0, fast = 0, legs = 0;
  for (const s of F.s){ if (!s.w) continue; const V = K.ferjeChain(s, s.w); ferries += V.length;
    for (const d of s.w.d) for (const P of s.pats) trips += (s.w.t[d][P.i] || []).length;
    for (const v of V){ dealt += v.tr.filter(q => !q.empty).length; for (let i = 1; i < v.tr.length; i++){ const a = v.tr[i - 1], b = v.tr[i]; if (a.P.q[a.P.q.length - 1] !== b.P.q[0]) jump++; if (b.t0 < a.t1) early++; }
      const a = v.tr[v.tr.length - 1], b = v.tr[0]; if (a.P.q[a.P.q.length - 1] !== b.P.q[0]) wrap++; }
    for (const P of s.pats) P.R.forEach((R, j) => { legs++; const dep = j ? P.tm[2 * j - 1] : 0, kn = R.len / ((P.tm[2 * j] - dep) / 60) / 1.852; if (kn > 25) fast++; }); }
  t.ok(trips > 20000 && dealt === trips, `ukas ${trips} avganger er alle gitt til en ferje (${ferries} ferjer)`);
  t.ok(jump === 0 && early === 0, `ingen ferje hopper mellom kaier eller går før hun er framme (${jump} hopp, ${early} for tidlig)`);
  t.ok(wrap <= ferries * 0.1, `ved ukeskiftet ligger ferjene der uka begynner (${wrap} av ${ferries} bytter kai natt til mandag, etter posisjonsturene)`);
  t.ok(fast <= legs * 0.03, `farten rutetida gir, er en ferjes (${fast} av ${legs} legger over 25 kn)`);
  const hs = K.ferjeFind('Halhjem', 'Sandvikvåg'), nh = K.ferjeChain(hs, hs.w).length;
  t.ok(nh >= 3 && nh <= 7 && hs.k === 2, `Halhjem–Sandvikvåg seiles av ${nh} store ferjer`);
  const bm = K.ferjeFind('Bodø', 'Moskenes'); t.ok(bm && bm.k === 2, 'Bodø–Moskenes har en stor ferje');

  // 5. Senja's ferry as before: the same place as the old formula at every minute of a June day, 12 knots, nothing in November
  const sj = K.ferjeFind('Botnhamn', 'Brensholmen'), NPCR = K.get('NPCR'), NM = K.get('NM');
  const old = hod => { const vf = 12 * NM, tc = NPCR.ferry.len / vf; let a = null, sp = 0;
    if (hod >= 7 && hod < 21.5){ const e = (hod - 7) % 1.5; if (e < tc){ a = K.atRoute(NPCR.ferry, e * vf); sp = 12; } else if (e < 0.75){ a = K.atRoute(NPCR.ferry, NPCR.ferry.len); } else if (e < 0.75 + tc){ a = K.atRoute(NPCR.ferryRev, (e - 0.75) * vf); sp = 12; } }
    if (!a) a = K.atRoute(NPCR.ferry, 0); return {p:a.p, hd:a.hd, v:sp}; };
  K.set('berthShift', p => p);   // (the berth by the harbour needs the map; the game shifts the old and the new alike)
  let worst = 0, hdBad = 0, vBad = 0, n = 0;
  for (let mi = 0; mi < 1290; mi += 1){ const Hj = HofUTC(2027, 5, 16, 0, mi), a = K.ferjeNear(Hj, 'ferje')[0], o = old(mi / 60); if (!a){ worst = 9; break; } n++;
    worst = Math.max(worst, dist(a.p, o.p)); if (Math.abs(Math.atan2(Math.sin(a.hd - o.hd), Math.cos(a.hd - o.hd))) > 1e-6) hdBad++; if (Math.abs(a.v - o.v) > 0.05) vBad++; }
  const one = K.ferjeNear(HofUTC(2027, 5, 16, 7, 10), 'ferje')[0];
  t.ok(sj && sj.lg && one && one.id === 'ferje' && one.name === 'MF Senjasund' && one.L === 49.9 && one.B === 12.4 && one.T === 3.1, 'Senjas ferje er ett samband blant de andre, med id-en, navnet og målene sine');
  t.ok(n === 1290 && worst < 1e-6 && hdBad === 0 && vBad === 0, `«MF Senjasund» er der den gamle formelen sier hvert minutt 00:00–21:30 en junidag (størst avvik ${(worst * 1000).toFixed(3)} m, ${hdBad} kurser, ${vBad} farter)`);
  t.eq(K.ferjeNear(HofUTC(2027, 10, 17, 12), 'ferje').length, 0, 'Senjas ferje går ikke i november');

  // 6. within AIS range of the boat you follow, through npcStates' call
  const S = K.newState(); K.set('S', S); const hq = F.q.find(q => q.name === 'Halhjem');
  S.boat.pos = {x:hq.p.x + 1, y:hq.p.y}; const near = K.ferjeNear(H(611)), R = K.get('AIS_KM');
  t.ok(near.length >= 2 && near.every(n => n.type === 'ferry' && dist(n.p, S.boat.pos) <= R), `ved Halhjem vises ${near.length} ferjer, alle innen AIS-rekkevidden på ${R} km`);
  t.ok(JSON.stringify(K.ferjeNear(H(611), near[0].id)) === JSON.stringify([near[0]]), 'én ferje spurt etter med id-en er den samme');
  S.boat.pos = {x:hq.p.x - 150, y:hq.p.y}; t.eq(K.ferjeNear(H(611)).length, 0, 'langt til havs vises ingen');
  const names = new Set(); let dup = 0; for (const s of F.s) for (const n of K.ferjeStates(s, H(611), false)){ if (names.has(s.i + n.name)) dup++; names.add(s.i + n.name); }
  t.eq(dup, 0, 'ingen to ferjer i samme samband har samme navn');

  // 7. a storm stops the departures (not Senja's, which sails as before)
  // (which journeys are sailed is worked out once per ferry and week, for the weather is the clock's; the test changes it, so the deal is dropped)
  const wx = w => { K.set('WX_FORCE', w); for (const s of F.s) s.ch = {}; };
  wx({w:30, d:0});
  let going = 0; for (const s of F.s) if (!s.lg) for (const n of K.ferjeStates(s, H(611), true)) if (n.v > 0) going++;
  let plan = 0; for (const s of F.s) if (!s.lg) for (const n of K.ferjeStates(s, H(611), false)) if (n.v > 0) plan++;
  t.ok(plan > 30 && going === 0, `i storm (30 m/s) går ingen ferje (${plan} etter rutetida, ${going} i stormen)`);
  wx({w:6, d:0}); let calm = 0; for (const s of F.s) if (!s.lg) for (const n of K.ferjeStates(s, H(611), true)) if (n.v > 0) calm++;
  t.eq(calm, plan, 'i bris går alle etter rutetida');
  wx(null);
}
