// ===== the snow crab (H3a of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026) =====
// The snow crab (Chionoecetes opilio) is a newcomer on the Barents Sea banks, sedentary and the coastal state's (HR-2023-491-P), and the
// game's snow crab vessel fishes it with conical pots in strings (lenker) of 200, 25 m apart (HI, Rapport fra havforskningen 2023-51 and
// 2023-61: «oftest satt i lenker på 200 eller 400 stykker per lenke, og avstanden mellom enkeltteiner er typisk 25 meter»).
//
//  snoArea(p, H)     how much snow crab stands at a point and hour against the fished banks' mean (1): the landing notes by location and
//                    month (fiske.json snok, tools/npc/fiske.py snokrabbe, 2024-2026), the depth of the banks, only on Norway's shelf
//  snoSoak(s, H)     an hour in the sea for a string of snow crab pots: the crabs that walk in (soakHour in 10-gear.js asks it)
//  snoCrab(m)        one crab as it comes up: sex, carapace width (mm), weight (kg), soft (newly moulted) and dead
//  landSno(g, n)     the sorting on deck: males from 9.5 cm kept, the rest back alive; soft crab counted, dead crab kept
//  snoHaulDone(g, s) after a string is hauled: what was sorted, and the 20 % soft crab of J-237-2025 § 5
//
// Sources (kap. 2 and 2b of the plan; read 06.11.2026 unless said):
//  - width-weight: HI 2023-61 p. 17 fig. 8 (weight by 5 mm width group and shell age, survey crabs 90-125+ mm, males in practice):
//    hard shell 95-99 mm 380 g, 110-114 mm 600 g, 120-124 mm 780 g; newly moulted 10-15 % lighter. The curves W(g) = 2.36e-4 CW^3.126
//    (hard) and 2.10e-4 CW^3.121 (new shell) are our fit to the figure's medians, not published (no W = a CW^b for the Barents Sea found)
//  - the males in standard pots: HI toktrapport 2024-21 fig. 4.5 (June 2023): median about 104 mm, mode 105-108, about 15 % under 95 mm;
//    HI 2023-51: 27 % undersize in the survey's standard pots (2020), 26 % in a string after 21 days, 11 % in another study, up to 50 %
//    after a skipper. cwM gives 18 % under 95 mm. The landing notes' live crab weighs 350-500 g (18 %), 500-800 g (51 %), 800-999 g (22 %)
//    (fiske.json snok.meta.sz), larger than the pots' males: the live buyers take the big ones (our reading)
//  - females: «never grow large enough to be caught in standard pots» (HI 2026-55 p. 7); fem is an assumption for the few that come up
//  - soft crab: the legal crabs moult in late spring and early summer, many soft in July-August, and also in October-December
//    (Fiskeridirektoratet's hearing note 30.06.2023 p. 14); the meat is best January-April (HI 2025-52). The shares by month are ours
//  - the catch per pot: not found by bank and month (HI has figures only); worked out from the notes and the profitability survey (kap. 2b):
//    5-7 kg a pot, 8 t a day at sea, about 100 t round weight a trip of about 20 days. q is calibrated to that (tests/unit/snokrabbe.test.mjs)
//  - the bait: one squid (akkar) cut in two (HI 2023-51), «2 × 400 g Illex» (a study of LED in pots, a search snippet): 0.5 kg here
//  - the soak: 3-17 days in 2021 and 4-25 in 2022 for HI's test string (2023-51); tau, the bait's pull, is an assumption
//  - the crab lives in the pot: «98 % levende» in pots that had stood 1.5 years (HI)
const SNOC = {
  // where: the season's catch per location as an index, its fourth root (pow) against the catch-weighted mean: the fleet goes where the crab
  // is, so the catch differs far more than the crab does. Measured 06.11.2026 against the notes' frozen trips (t a day between landings, less
  // three days): Storbanken 9.5 t in February, Sentralbanken 7.9 and at Hopen 5.3 (3 trips), where the catch a year is 1 846, 1 611 and 110 t
  // (24-02, 15-05, 23-15): a ratio of about 0.5 at Hopen, which the fourth root gives (the square root gave 0.25). A location without
  // landings beside some at nb of their mean, the rest of
  // the Norwegian shelf in the Barents Sea (north of 72° N, east of 20° E) at far; the month against the season's mean within mlo-mhi
  pow:0.25, nb:0.35, far:0.06, mlo:0.4, mhi:1.6, open:[11, 0, 1, 2, 3, 4, 5],
  // the depth of the banks where it is fished (HI 2023-51: 250-350 m), full from 220 to 380 m, nothing above 150 or below 460 m
  d:[150, 220, 380, 460],
  // the catch: crabs an hour into one pot at index 1 with fresh bait (calibrated), the bait's pull falling with tau hours, the pull of a
  // pot whose bait is gone, and the crabs a conical pot holds
  q:0.18, tau:60, ghost:0.04, cap:150,
  // the crabs: share of females, width [mean, spread] mm of males and females, the minimum width (høstingsforskriften § 47: 9.5 cm,
  // measured over the widest part of the shell, § 46), the width-weight curves (g, mm), soft by month, dead in the pot
  fem:0.03, cwM:[105, 11], cwF:[70, 8], minCW:95,
  wa:2.36e-4, wb:3.126, wsa:2.10e-4, wsb:3.121,
  soft:[0.04, 0.03, 0.03, 0.04, 0.08, 0.15, 0.3, 0.3, 0.2, 0.15, 0.12, 0.1], dead:0.01,
  // J-237-2025 § 5: at most 20 % soft crab in the catch; over it the vessel changes field (a warning there for softDays, an assumption)
  softMax:0.2, softDays:7,
  // the local stock (S.sstk) fills back this share of what is missing an hour (about two weeks to most of it; an assumption)
  back:0.003,
  // the string, the cap and the tending (høstingsforskriften §§ 18, 25 and 28)
  lenke:200, max:8000, tendH:21 * 24, warnH:18 * 24, posH:21 * 24
};
// the index by location and month (Float32Array of RU.lok × 12, 0 where the notes have nothing), built once from fiske.json snok
const SNOF = {};
function snoField(){
  if (SNOF.f !== undefined) return SNOF.f;
  const D = fkData(); if (!D || !D.snok || !RU.ok){ SNOF.f = null; return null; }
  const NL = RU.lok.length, I = new Map(RU.lok.map((h, i) => [h.c, i])), kg = new Float64Array(NL * 12), seas = new Float64Array(NL);
  for (const [c, ms] of D.snok.lok){ const l = I.get(c); if (l == null) continue; for (let m = 0; m < 12; m++) kg[l * 12 + m] = ms[m]; for (const m of SNOC.open) seas[l] += ms[m]; }
  // the reference: the catch-weighted mean of the index over the landings is 1
  let s1 = 0, s2 = 0; for (let l = 0; l < NL; l++) if (seas[l] > 0){ s1 += seas[l] * Math.pow(seas[l], SNOC.pow); s2 += seas[l]; }
  const sr = s2 > 0 ? s1 / s2 : 1, base = new Float32Array(NL);
  for (let l = 0; l < NL; l++) base[l] = seas[l] > 0 ? Math.pow(seas[l], SNOC.pow) / sr : 0;
  const NB = fkNeighbours(), b0 = base.slice();
  for (let l = 0; l < NL; l++) if (!(b0[l] > 0)){ const nb = NB[l].filter(b => b0[b] > 0); if (nb.length) base[l] = SNOC.nb * nb.reduce((a, b) => a + b0[b], 0) / nb.length; }
  const A = new Float32Array(NL * 12);
  for (let l = 0; l < NL; l++) for (let m = 0; m < 12; m++){
    let f = 1;
    if (seas[l] > 0 && SNOC.open.includes(m)){ const k = (kg[l * 12 + m] + 0.25 * (kg[l * 12 + (m + 11) % 12] + kg[l * 12 + (m + 1) % 12])) / 1.5; f = clamp(Math.sqrt(k / (seas[l] / SNOC.open.length)), SNOC.mlo, SNOC.mhi); }
    A[l * 12 + m] = base[l] * f; }
  return SNOF.f = {A, base};
}
const snoDepth = d => sstep(SNOC.d[0], SNOC.d[1], d) * (1 - sstep(SNOC.d[2], SNOC.d[3], d));
// the crab stands in patches on the bank (a slow pattern some tens of km across, mean 1)
const snoPatch = p => 0.7 + 0.6 * (vn(p.x / 25, 7711) + vn(p.y / 25, 7712) + vn((p.x + p.y) / 35, 7713)) / 3;
function snoArea(p, H){
  const F = snoField(); if (!F || isLand(p) || !ruShelf(p)) return 0;
  const c = lokOfCell(p); let v = c.l >= 0 ? fkAt(F.A, c.l, fkMonth(H)) : 0;
  if (!(v > 0)) v = c.lat > 72 && c.lon > 20 ? SNOC.far : 0;
  return v * snoDepth(depthF(p)) * snoPatch(p);
}
// with the stock: the bank's own (the year's index, stockF) and what the pots have taken here (S.sstk)
const snoDen = (p, H) => snoArea(p, H) * stockF('snokrabbe', H) * stockAt(p, 'snokrabbe', H);
// one crab as it comes up in month m (0-11)
function snoW(cw, soft){ return (soft ? SNOC.wsa * Math.pow(cw, SNOC.wsb) : SNOC.wa * Math.pow(cw, SNOC.wb)) / 1000; }
function snoCrab(m){
  const fem = Math.random() < SNOC.fem, W = fem ? SNOC.cwF : SNOC.cwM;
  const cw = Math.max(30, Math.round((W[0] + W[1] * gauss(Math.random(), Math.random())) * 10) / 10);
  const soft = Math.random() < SNOC.soft[((m % 12) + 12) % 12], dead = Math.random() < SNOC.dead;
  return {fem, cw, soft, dead, w:Math.round(snoW(cw, soft) * 1000) / 1000};
}
// the mean weight of a crab in the pot, all sizes (kg; the kilos the string is said to hold before it is sorted)
const SNOWM = (() => { let s = 0, n = 0; for (let i = -40; i <= 40; i++){ const z = i / 10, w = Math.exp(-z * z / 2); s += w * ((1 - SNOC.fem) * snoW(SNOC.cwM[0] + SNOC.cwM[1] * z) + SNOC.fem * snoW(SNOC.cwF[0] + SNOC.cwF[1] * z)); n += w; } return s / n; })();
// the points along a string the pots stand on (five, the ends and between), for the crab they meet and the stock they take
function snoPts(s){ const o = []; for (let k = 0; k < 5; k++){ const f = (k + 0.5) / 5; o.push({x:s.a.x + (s.b.x - s.a.x) * f, y:s.a.y + (s.b.y - s.a.y) * f}); } return o; }
// an hour in the sea: the crabs that walk in, by the crab where the string stands, the bait's pull (fresh at the setting, falling with tau,
// a little left when it is gone), the room in the pots and their condition. The crab lives in the pot (HI: 98 % alive after 1.5 years)
function snoSoak(s, H){
  const a = (S.t - s.tSet) / 60, P = POTS[s.pot], A = s.acc.snokrabbe || (s.acc.snokrabbe = {kg:0, n:0, ts:0}), pts = snoPts(s);
  let D = 0; for (const p of pts) D += snoDen(p, H); D /= pts.length;
  const pull = Math.exp(-a / SNOC.tau) * baitF(s.bait || 'blekksprut', 'snokrabbe') + SNOC.ghost;
  const lam = SNOC.q * s.n * D * pull * Math.max(0, 1 - A.n / ((P.cap || SNOC.cap) * s.n * haillCap())) * potQ(s) * luck('snokrabbe');   // (the room grows with the haill, haillCap)
  if (!(lam > 0)) return 0;
  const kg = lam * SNOWM; A.kg += kg; A.n += lam; A.ts += kg * H;
  if (!s.dry) for (const p of pts) takeStock(p, kg / pts.length, 'snokrabbe');
  return kg;
}
// the sorting on deck as the crabs come out of the pot (høstingsforskriften §§ 46, 47 and 51; J-237-2025 § 5): a male from 9.5 cm over
// the widest part of the shell is kept, and so is every crab over the minimum (no female here reaches it) and every dead one, which may
// not be thrown back; the small ones and the females go back alive. Soft crab is kept and counted against the 20 %. The kept crab lies in
// the hold in three classes (hard, soft, dead) at the one price there is
function landSno(g, n){
  const G = S.gacc || (S.gacc = {}), so = g.snoS || (g.snoS = {n:0, kept:0, rel:0, fem:0, soft:0, dead:0, kg:0, small:0}), m = gDate(S.t / 60).getUTCMonth();
  G.snoN = (G.snoN || 0) + n; let room = capHold() - holdLoad();
  while (G.snoN >= 1 && room > 0.05){
    G.snoN -= 1; const c = snoCrab(m); so.n++; if (c.fem) so.fem++;
    if (c.cw < SNOC.minCW && !c.dead){ so.rel++; g.rel = (g.rel || 0) + 1; S.stats.released = (S.stats.released || 0) + 1; if (!c.fem) so.small++; continue; }
    const k = Math.min(c.w, room); room -= k;
    addCatch('snokrabbe', k, c.dead ? 2 : c.soft ? 1 : 0, false, {fresh:100, how:'teine'}); g.kg += k; so.kept++; so.kg += k;
    if (c.soft) so.soft++; if (c.dead) so.dead++;
    if (typeof window !== 'undefined'){ const cq = window.CATCHQ || (window.CATCHQ = []); if (cq.length < 30) cq.push({sp:'snokrabbe', kg:k, t:performance.now()}); }
  }
}
// after a string is hauled: the sorting in the log, and the soft crab against J-237-2025 § 5 («Det er ikke tillatt å ha mer enn 20 %
// innblanding av bløtkrabbe i fangst etter snøkrabbe»): over it the fishing stops here, the vessel changes field and the share is
// reported to the Directorate (the game reports it for you and remembers the location for softDays)
function snoHaulDone(g, s){
  const so = g.snoS; if (!so || !so.n) return;
  log('Sortert: ' + fmtC(so.kept, 0) + ' krabber beholdt' + (so.soft ? ', ' + fmtC(so.soft, 0) + ' bløte' : '') + (so.dead ? ', ' + fmtC(so.dead, 0) + ' døde' : '') + '; ' + fmtC(so.rel, 0) + ' satt ut levende (' + fmtC(so.small, 0) + ' under 9,5 cm' + (so.fem ? ', ' + fmtC(so.fem, 0) + ' hunner' : '') + ').',
    'Sorted: ' + fmtC(so.kept, 0) + ' crabs kept' + (so.soft ? ', ' + fmtC(so.soft, 0) + ' soft' : '') + (so.dead ? ', ' + fmtC(so.dead, 0) + ' dead' : '') + '; ' + fmtC(so.rel, 0) + ' put back alive (' + fmtC(so.small, 0) + ' under 9.5 cm' + (so.fem ? ', ' + fmtC(so.fem, 0) + ' females' : '') + ').');
  const sh = so.kept >= 50 ? so.soft / so.kept : 0;
  if (sh > SNOC.softMax){ const c = lokOfCell(setMid(s)); S.snoSoft = {l:c.l, t:S.t, pct:Math.round(sh * 100)};
    msg('Fiskeridirektoratet', 'Innblandingen av bløtkrabbe i trekket var ' + Math.round(sh * 100) + ' %. Over 20 % skal fangsten stoppes og fartøyet skifte felt (J-237-2025 § 5). Innblandingen er meldt.',
      'The soft crab in the haul was ' + Math.round(sh * 100) + '%. Over 20% the fishing stops and the vessel changes field (J-237-2025 § 5). The share has been reported.'); }
}
// the field the soft crab closed for this vessel, or null (rulesAt asks it, sk5)
function snoSoftAt(p){ const q = S && S.snoSoft; if (!q || S.t - q.t > SNOC.softDays * 1440) return null; const c = lokOfCell(p); return c.l >= 0 && c.l === q.l ? q : null; }
// the vessel's snow crab pots in the sea (§ 28: at most 8 000)
const snoInSea = () => mySets().filter(s => s.kind === 'teine' && POTS[s.pot] && POTS[s.pot].sno).reduce((a, s) => a + s.n, 0);
// § 25 annet ledd b: the position of the snow crab gear «skal rapporteres minst en gang hver tredje uke etter setting» (the vessel's
// catch log does it: at the setting and every third week), and § 18: «røktes minst én gang hver tredje uke», warned three days before
function snoTend(s, a, mid){
  if (!(POTS[s.pot] && POTS[s.pot].sno)) return;
  const rep = s.posRep || s.tSet; if (S.t - rep >= SNOC.posH * 60){ s.posRep = S.t; setLog(s, 'Posisjonen for lenka ved ' + coordStr(mid) + ' er rapportert til Fiskeridirektoratet (høstingsforskriften § 25).', 'The position of the string at ' + coordStr(mid) + ' is reported to the Directorate of Fisheries (høstingsforskriften § 25).'); }
  if (a >= SNOC.warnH && !(s.warn & 8)){ s.warn |= 8; setLog(s, 'Lenka ved ' + coordStr(mid) + ' har stått i 18 døgn. Snøkrabbeteiner skal røktes minst hver tredje uke.', 'The string at ' + coordStr(mid) + ' has stood for 18 days. Snow crab pots must be tended at least every third week.'); }
  if (a >= SNOC.tendH && !(s.warn & 16)){ s.warn |= 16; msg('Fiskeridirektoratet', 'Påminnelse: teiner for snøkrabbe skal røktes minst én gang hver tredje uke (høstingsforskriften § 18). Lenka ved ' + coordStr(mid) + ' har stått i ' + fmtC(a / 24, 0) + ' døgn.', 'Reminder: snow crab pots must be tended at least once every third week (høstingsforskriften § 18). The string at ' + coordStr(mid) + ' has stood for ' + fmtC(a / 24, 0) + ' days.'); }
}
