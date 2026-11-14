// The car ferries along the whole coast (Ø15 N3, 11.11.2026; tools/npc/ferje.py → src/data/ferje.json, core/05b-ferje.js): the data
// (no operator, line or vessel in it, the size), a ferry's place as a pure function of the clock (at the quay before the departure,
// in the middle of the leg half-way, at the other quay after the crossing's time, at a quay at night; the same clock gives the same
// place), the week's journeys dealt to ferries that are where their next journey leaves from, Senja's own ferry as she has always
// sailed, the names, the AIS range, and the departures a storm stops. N4 (12.11.2026): the express boats with many calls on a journey,
// the passenger ferries, and the coastal route's ships (one each way every day Bergen - Kirkenes, at Tromsø, Bodø, Ålesund and
// Finnsnes when the timetable says, never two at a quay the timetable does not put there, the same at the same clock).
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
  t.ok(raw.length < 300000, `ferje.json er under 0,3 MB (${(raw.length / 1000).toFixed(1)} kB)`);
  t.ok(D.s.length >= 100 && D.q.length >= 250 && D.l.length >= 200, `${D.s.length} samband, ${D.q.length} kaier og ${D.l.length} legger`);
  t.eq(Object.keys(D).sort().join(), 'k,l,meta,q,s', 'fila har bare meta, kaiene, leggene, sambandene og kystruta');
  t.ok(D.s.every(e => Object.keys(e).every(k => ['k', 'y', 'p', 'w', 's'].includes(k))), 'et samband har bare slaget, størrelsesklassen, mønstrene og ukene (ingen operatør, linje eller fartøy)');
  t.eq(Object.keys(D.k).sort().join(), 'dep,n,p,tm', 'kystruta har bare anløpene, tidene, avgangen og tallet på skip (ingen operatør eller skip)');
  const ny = y => D.s.filter(e => (e.y || 0) === y).length;
  t.ok(ny(0) >= 120 && ny(1) >= 60 && ny(2) >= 15 && D.s.every(e => !e.y || (e.y <= 2 && e.k <= 1)), `${ny(0)} bilferjer, ${ny(1)} hurtigbåtsamband og ${ny(2)} passasjerferjer`);
  t.ok(!!D.meta.sum, `sommeruka er med (${D.meta.sum})`);
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
    const {m, P} = best, R = P.R[0], dur = P.tm[0], q0 = F.q[P.q[0]], q1 = F.q[P.q[1]], off = s.L / 2000 + 0.04 + 3 * (s.L + 15) / 1000, hhmm = ['on', 'to', 'fr', 'lø', 'sø', 'ma', 'ti'][Math.floor(m / 1440)] + ' ' + String(Math.floor(m % 1440 / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
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
  let nN = 0, nU = 0, off = 0, close = 0;
  for (const s of F.s){ const A = K.ferjeStates(s, H(180), false), lie = A.filter(n => n.v === 0);
    for (const n of A){ nN++; if (n.v > 0){ nU++; continue; }
      if (!s.pats.some(P => P.q.some(q => dist(n.p, F.q[q].p) <= s.L / 2000 + 0.04 + A.length * (s.L + 15) / 1000))) off++; }
    for (let i = 0; i < lie.length; i++) for (let j = i + 1; j < lie.length; j++) if (dist(lie[i].p, lie[j].p) < s.L / 1000) close++; }
  t.ok(nN >= 150 && off === 0 && nU < nN * 0.15, `kl. 03 ligger ferjene ved en ferjekai (${nN} ferjer, ${nU} under fart, ${off} et annet sted)`);
  t.ok(close <= 2, `to ferjer ved samme kai ligger etter hverandre, ikke i hverandre (${close} par nærmere enn en båtlengde: en legg for kort for rekka)`);

  // 4. the deal: every journey to one ferry, and a ferry's next journey leaves from where her last one ended, after it ended
  let trips = 0, dealt = 0, jump = 0, early = 0, wrap = 0, ferries = 0, fast = 0, legs = 0;
  for (const s of F.s){ if (!s.w) continue; const V = K.ferjeChain(s, s.w); ferries += V.length;
    for (const d of s.w.d) for (const P of s.pats) trips += (s.w.t[d][P.i] || []).length;
    for (const v of V){ dealt += v.tr.filter(q => !q.empty).length; for (let i = 1; i < v.tr.length; i++){ const a = v.tr[i - 1], b = v.tr[i]; if (a.P.q[a.P.q.length - 1] !== b.P.q[0]) jump++; if (b.t0 < a.t1) early++; }
      const a = v.tr[v.tr.length - 1], b = v.tr[0]; if (a.P.q[a.P.q.length - 1] !== b.P.q[0]) wrap++; }
    for (const P of s.pats) P.R.forEach((R, j) => { legs++; const dep = j ? P.tm[2 * j - 1] : 0, kn = R.len / ((P.tm[2 * j] - dep) / 60) / 1.852; if (kn > (s.y ? 42 : 25)) fast++; }); }
  t.ok(trips > 20000 && dealt === trips, `ukas ${trips} avganger er alle gitt til en ferje (${ferries} ferjer)`);
  t.ok(jump === 0 && early === 0, `ingen ferje hopper mellom kaier eller går før hun er framme (${jump} hopp, ${early} for tidlig)`);
  t.ok(wrap <= ferries * 0.1, `ved ukeskiftet ligger ferjene der uka begynner (${wrap} av ${ferries} bytter kai natt til mandag, etter posisjonsturene)`);
  t.ok(fast <= legs * 0.03, `farten rutetida gir, er en ferjes eller en hurtigbåts (${fast} av ${legs} legger over 25 kn for en bilferje, 42 for de andre)`);
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
  // a strong gale (17 m/s) stops the express boats, not the passenger ferries (18) or the car ferries (20-25)
  wx({w:17, d:0}); const by = [0, 0, 0], byP = [0, 0, 0];
  for (const s of F.s) if (!s.lg){ by[s.y] += K.ferjeStates(s, H(611), true).filter(n => n.v > 0).length; byP[s.y] += K.ferjeStates(s, H(611), false).filter(n => n.v > 0).length; }
  t.ok(byP[1] > 5 && by[1] === 0 && by[0] === byP[0] && by[2] === byP[2], `i sterk kuling (17 m/s) står hurtigbåtene (${byP[1]} etter rutetida, ${by[1]} går), passasjerferjene (${by[2]}) og bilferjene (${by[0]}) går`);
  wx({w:19, d:0}); let p19 = 0; for (const s of F.s) if (!s.lg && s.y === 2) p19 += K.ferjeStates(s, H(611), true).filter(n => n.v > 0).length;
  t.eq(p19, 0, 'i 19 m/s står passasjerferjene også');
  wx(null);

  // 8. an express boat with many calls: Tromsø - Harstad (by Finnsnes), at every quay at its time, under way between, at a quay at night
  const xs = F.s.filter(s => s.y === 1), th = xs.find(s => s.key.split('|').includes('Tromsø Prostneset') && s.key.split('|').includes('Harstad')) || xs.find(s => s.pats.some(P => P.q.length >= 4));
  t.ok(!!th, 'hurtigbåten Tromsø–Harstad er med' + (th ? ' (' + th.key + ')' : ''));
  if (th){
    const P = th.pats.slice().sort((a, b) => b.q.length - a.q.length)[0], off2 = th.L / 2000 + 0.04 + 3 * (th.L + 15) / 1000;
    let d0 = -1, m0 = 0; for (let dd = 0; dd < 7 && d0 < 0; dd++){ let m = 0; for (const dt of th.w.t[th.w.d[(2 + dd) % 7]][P.i] || []){ m += dt; d0 = dd; m0 = m; break; } }
    t.ok(P.q.length >= 3 && d0 >= 0, `hurtigbåten har en tur med ${P.q.length} anløp (${P.q.map(q => F.q[q].name).join(' – ')})`);
    const T0 = d0 * 1440 + m0, R0 = P.R[0], m1 = K.atRoute(R0, R0.len / 2).p, go = K.ferjeStates(th, H(T0 + P.tm[0] / 2), false).filter(n => n.v > 0 && dist(n.p, m1) < 0.3), id = go.length ? go[0].id : null;
    const me = m => K.ferjeStates(th, H(m), false).find(n => n.id === id);
    let atQ = 0, under = 0, kn = [];
    for (let j = 1; j < P.q.length; j++){ const dep = j > 1 ? P.tm[2 * j - 3] : 0, arr = P.tm[2 * j - 2], nx = j < P.q.length - 1 ? P.tm[2 * j - 1] : arr + 2;
      const u = me(T0 + (dep + arr) / 2); if (u && u.v > 0){ under++; kn.push(u.v); }
      const a = me(T0 + (arr + Math.min(nx, arr + 2)) / 2); if (a && a.v === 0 && dist(a.p, F.q[P.q[j]].p) <= off2) atQ++; }
    t.ok(id && atQ === P.q.length - 1 && under === P.q.length - 1, `hun ligger ved hver kai til rutetida (${atQ} av ${P.q.length - 1}) og er under fart mellom dem (${under}, ${kn.join(', ')} kn)`);
    t.ok(kn.every(v => v >= 12 && v <= 40), 'farten mellom kaiene er en hurtigbåts (12–40 kn)');
    const night = K.ferjeStates(th, H(180), false);
    t.ok(night.length && night.every(n => n.v === 0 && th.pats.some(P2 => P2.q.some(q => dist(n.p, F.q[q].p) <= off2))), `kl. 03 ligger hurtigbåtene ved en kai (${night.length})`);
    t.ok(night.every(n => n.type === 'ferry' && n.ex === 1 && /^MS [A-ZÆØÅ]/.test(n.name) && n.L === th.L && n.L < 40), `typen ferry med ex 1, «MS …» (${night.map(n => n.name).join(', ')}), ${th.L} m`);
  }
  const ps = F.s.find(s => s.y === 2), pn = ps && K.ferjeStates(ps, H(611), false);
  t.ok(pn && pn.length && pn.every(n => n.ex === 2 && /^MS /.test(n.name) && n.L < 30), 'en passasjerferje har ex 2, «MS …» og sine egne mål' + (ps ? ' (' + ps.key + ')' : ''));

  // 9. the coastal route: one round journey Bergen - Kirkenes - Bergen every day, as many ships as the round takes
  const KR = F.k, KP = KR && KR.P, qn = KP ? KP.q.map(q => F.q[q].name) : [];
  t.ok(KR && qn[0] === qn[qn.length - 1] && /Bergen/.test(qn[0]) && qn.includes('Kirkenes') && qn.length >= 60 && KR.n === 11, `kystruta: ${qn.length} anløp fra ${qn[0]} til Kirkenes og tilbake, ${KP && (KP.dur / 1440).toFixed(2)} døgn, ${KR && KR.n} skip`);
  if (KR){
    const ks = H2 => K.kystStates(H2), day = HofUTC(2027, 10, 17), dep = KR.dep, off3 = 0.07 + 2 * 0.15;
    const quayOf = (name, nth) => { let k = -1; for (let i = 0; i < qn.length; i++) if (qn[i] === name && nth-- === 0){ k = i; break; } return k; };
    for (const name of ['Tromsø', 'Bodø', 'Ålesund', 'Finnsnes']){
      for (const nth of [0, 1]){ const i = quayOf(name, nth); if (i < 0){ t.ok(false, `${name} er et anløp ${nth ? 'sørgående' : 'nordgående'}`); continue; }
        const arr = KP.tm[2 * i - 2], lv = KP.tm[2 * i - 1], m = dep + (arr + lv) / 2, Hm = day + m / 60, A = ks(Hm), qp = F.q[KP.q[i]].p;
        const lie = A.filter(n => n.v === 0 && dist(n.p, qp) <= off3);
        const hh = mm => String(Math.floor(((mm % 1440) + 1440) % 1440 / 60)).padStart(2, '0') + ':' + String(Math.round(((mm % 60) + 60) % 60)).padStart(2, '0');
        t.ok(lie.length === 1 && lie[0].type === 'coastal', `${nth ? 'sørgående' : 'nordgående'} ligger ved ${name} ${hh(dep + arr)}–${hh(dep + lv)} (${lie.map(n => n.name).join(', ') || 'ingen'})`);
        const bA = ks(day + (dep + arr - 20) / 60).filter(n => n.v > 0 && dist(n.p, qp) < 15).length; t.ok(bA >= 1, `${name}: tjue minutter før ankomsten er hun under fart på vei inn (${bA})`); }
    }
    // the ship that leaves Bergen on a day is the one that comes back 11 days later and leaves again that evening
    const at0 = ks(day + (dep + 30) / 60).filter(n => n.v > 0 && dist(n.p, F.q[KP.q[0]].p) < 15), at11 = ks(day + 11 * 24 + (dep + 30) / 60).filter(n => n.v > 0 && dist(n.p, F.q[KP.q[0]].p) < 15);
    t.ok(at0.length === 1 && at11.length === 1 && at0[0].id === at11[0].id && ks(day + 24 + (dep + 30) / 60).filter(n => n.v > 0 && dist(n.p, F.q[KP.q[0]].p) < 15)[0].id !== at0[0].id, `skipet som går fra Bergen en kveld, går igjen etter 11 døgn (${at0.map(n => n.name)}), og et annet går neste kveld`);
    // every ship somewhere, all different names, the fields of the AIS card on the ship
    const all = ks(day + 12);
    t.ok(all.length === KR.n && new Set(all.map(n => n.name)).size === KR.n && all.some(n => n.name === 'MS Kystpilen') && all.every(n => /^MS [A-ZÆØÅ]/.test(n.name) && n.L >= 110 && n.B > 15 && n.T > 4 && /^[A-Z]{4}$/.test(n.cs) && n.own && n.id.indexOf('kyst') === 0), `alle ${all.length} skipene har eget navn, «MS Kystpilen» er ett, og lengde, bredde, dypgående, kallesignal og eier står på skipet`);
    // never two at one quay unless the timetable puts them there (the windows of the round's calls at the quay overlap in the day)
    const win = {}; for (let i = 1; i < KP.q.length - 1; i++){ const q = KP.q[i]; (win[q] = win[q] || []).push([(dep + KP.tm[2 * i - 2]) % 1440, KP.tm[2 * i - 1] - KP.tm[2 * i - 2]]); }
    const ovl = q => { const w = win[q] || []; for (let a = 0; a < w.length; a++) for (let b = a + 1; b < w.length; b++){ const d1 = ((w[b][0] - w[a][0]) % 1440 + 1440) % 1440; if (d1 < w[a][1] || 1440 - d1 < w[b][1]) return true; } return false; };
    let pairs = 0, wrong = 0, under = 0, samples = 0;
    for (let mi = 0; mi < 11 * 1440; mi += 10){ const A = ks(day + mi / 60); samples++; under += A.filter(n => n.v > 0).length;
      for (let a = 0; a < A.length; a++) for (let b = a + 1; b < A.length; b++) if (A[a].v === 0 && A[b].v === 0 && dist(A[a].p, A[b].p) < 1){ pairs++; const q = KP.q.find(q2 => dist(F.q[q2].p, A[a].p) < 1); if (!ovl(q)) wrong++; } }
    t.ok(wrong === 0, `to skip ligger aldri ved samme kai uten at rutetabellen sier det (${pairs} ganger ved samme kai over 11 døgn, ${wrong} utenfor rutetida)`);
    t.ok(under / samples > 6, `de fleste skipene er under fart (snitt ${(under / samples).toFixed(1)} av ${KR.n})`);
    // the same clock gives the same ships, also in another core (a player who opens the game later)
    t.ok(JSON.stringify(ks(day + 17.3)) === JSON.stringify(K2.kystStates(day + 17.3)), 'samme klokke gir de samme skipene på samme sted, også i en ny kjerne');
    // within AIS range only, and one asked for by id
    const tq = F.q[KP.q[quayOf('Tromsø', 0)]].p; S.boat.pos = {x:tq.x + 2, y:tq.y};
    const nk = K.ferjeNear(day + (dep + (KP.tm[2 * quayOf('Tromsø', 0) - 2] + KP.tm[2 * quayOf('Tromsø', 0) - 1]) / 2) / 60).filter(n => n.type === 'coastal');
    t.ok(nk.length >= 1 && nk.every(n => dist(n.p, S.boat.pos) <= R), `ved Tromsø viser AIS-en kystruteskipet innen ${R} km (${nk.map(n => n.name).join(', ')})`);
    t.ok(nk.length && JSON.stringify(K.ferjeNear(day + 30, nk[0].id)) === JSON.stringify(ks(day + 30).filter(n => n.id === nk[0].id)), 'ett skip spurt etter med id-en finnes uansett hvor hun er');
    S.boat.pos = {x:tq.x - 300, y:tq.y}; t.eq(K.ferjeNear(day + 30).filter(n => n.type === 'coastal').length, 0, 'langt til havs vises ingen kystruteskip');
  }
}
