// ===== Quotas for cod, haddock and saithe north of 62° N. The regulation as it stood from 1 October 2026 (J-187-2026, fiskeridir.no)
// is the base; the chain from Norway's quota to the group quotas and the vessel quotas follows the Directorate of Fisheries' case
// document 5/2025 for the regulation meeting (November 2025), and gives § 5 of the regulation exactly. Tonnes unless said otherwise.
// Sources and what is uncertain: docs/OVERLEVERING.md 5.5 and chapter 6. =====
const REG26 = {
  tac:{torsk:285000, hyse:153293, sei:164149},              // the agreed total quotas for 2026 (hi.no)
  nor:{torsk:139827, hyse:78289, sei:150770},               // § 2: Norway's quotas north of 62° N
  open:{torsk:9257, ff:865},                                 // § 5: the open group's cod, of which the fresh-fish scheme's share
  lukket:{torsk:72945, ff:7085},                             // § 5: the closed group's cod, of which the fresh-fish scheme's share
  grp:{u11:19164, g11:19036, g15:17407, g21:12796},          // § 5: the closed group's cod by quota length (hjemmelslengde)
  unit:{u11:8.4172, g11:7.2662, g15:6.9986, g21:6.9982},     // § 16: cod per quota factor
  // §§ 21, 26, 27: the open group by vessel length (under 8 m, 8–9.99 m, 10 m and over); the maximum quotas are those the year
  // started with (the maximum-quota fishing was stopped on 16 April 2026), haddock and saithe have no maximum
  openMax:[4.0, 5.6, 6.4], openGuar:[3.0, 4.2, 4.8], hyseG:[4.0, 5.6, 6.4], seiG:5
};
// Norway's quota from the agreed total quota. Cod: 21 000 t of Norwegian coastal cod are added, third countries take their share
// (13.455 % in 2026, worked out from § 2), the rest is split in two, and Russia passes 6 000 t to Norway; this hits every year
// 2019–2025 exactly. Haddock and saithe follow their total quotas in proportion to 2026 (Norway's share is about half of the
// haddock and the saithe less 13 750 t to other countries; the proportion is within a few per cent).
function norQuota(sp, tac){
  if (sp === 'torsk') return (tac + 21000 - 0.13455 * tac) / 2 + 6000;
  if (sp === 'sei') return REG26.nor.sei * (tac - 13750) / (REG26.tac.sei - 13750);
  return REG26.nor.hyse * tac / REG26.tac.hyse;
}
// From Norway's cod quota to the groups: set aside at the top (research 880 t, youth and leisure fishing 7 000 t, the coastal scheme
// 0.9 % but at least 3 000 t, live storage 500 t, recruitment quotas 2 543 t in the closed and 450 t in the open group), the open
// group 6.62 %, the trawl ladder (28 % of what is left under 130 000 t, rising to 33 % at 330 000 t), the ocean-going conventional
// vessels 12.81 % and the closed group 87.19 % of the rest; the closed group gives the fresh-fish scheme its share and splits the
// rest by quota length (the Finnmark model: 27.83 / 26.31 / 26.43 / 19.43 %, plus the recruitment quotas under 15 m)
function codChain(N){
  const top = 880 + 7000 + Math.max(3000, 0.009 * N) + 500 + 2543 + 450, open = 0.0662 * N, R = N - top - open;
  const tr = R < 130000 ? 0.28 : R > 330000 ? 0.33 : 0.28 + 0.05 * (R - 130000) / 200000;
  const lukket = R * (1 - tr) * 0.8719, ff = lukket * REG26.lukket.ff / REG26.lukket.torsk, rest = lukket - ff;
  return {N, open, openFF:open * REG26.open.ff / REG26.open.torsk, lukket, ff, grp:{u11:rest * 0.2783 + 835, g11:rest * 0.2631 + 1708, g15:rest * 0.2643, g21:rest * 0.1943}};
}
// the agreed total quota for a year: 2026 and before as agreed; later years come from the stock model
function tacOf(sp, y){ return y <= 2026 ? REG26.tac[sp] : stockYear(sp, y).tac; }
// one year's quotas (cached; the stock model sets the later years)
const YQC = {};
function yearQuota(y){
  const key = y + ':' + (S && S.qseed || 0); if (YQC[key]) return YQC[key];
  const nor = {torsk:norQuota('torsk', tacOf('torsk', y)), hyse:norQuota('hyse', tacOf('hyse', y)), sei:norQuota('sei', tacOf('sei', y))};
  if (y <= 2026) Object.assign(nor, REG26.nor);
  const ch = codChain(nor.torsk), fo = ch.open / REG26.open.torsk, fh = nor.hyse / REG26.nor.hyse, fs = nor.sei / REG26.nor.sei, r1 = x => Math.round(x * 10) / 10;
  const unit = {}; for (const g in REG26.unit) unit[g] = REG26.unit[g] * ch.grp[g] / REG26.grp[g];
  // how tight the Directorate sets the open group's maximum quotas at the start of the year (OPENF.ov, 0.85–1.15): some years low
  // and raised later (2021, 2022), some years generous and stopped early (2019); 2026 as it was. With 100 saves for 2027: 39 % of
  // the years without a stop, the middle stop on 13 April, raises in 18 %
  const ov = y <= 2026 ? 1 : OPENF.ov[0] + OPENF.ov[1] * h2(y * 53 + (S && S.qseed || 0) % 99991, 7100);
  return YQC[key] = {y, tac:{torsk:tacOf('torsk', y), hyse:tacOf('hyse', y), sei:tacOf('sei', y)}, nor, chain:ch, unit, fh, fs,
    open:{Q:ch.open, ff:ch.openFF, ov, max:REG26.openMax.map(v => r1(v * fo * ov)), guar:REG26.openGuar.map((v, i) => r1(Math.min(v * fo, REG26.openMax[i] * fo * ov))), hyseG:REG26.hyseG.map(v => r1(v * fh)), seiG:r1(REG26.seiG * fs)}};
}

// ---- the closed group: quota lengths the game sells, with J-187-2026's quota factors and quantities (§§ 16, 18, 19). Cod is a fixed
// vessel quota: the quota factor times the year's unit for the group. Haddock and saithe: [guaranteed, maximum by the vessel's largest
// length] in 2026 tonnes, scaled with Norway's quota; null is no maximum (haddock under 11 m from 31 August 2026). Largest length
// bands: haddock under 11 m / 11 m and over; saithe for quota lengths under 11 m: under 11 / 11–14.99 / 15 m and over, 11–14.99 m:
// under 15 / 15 and over, 15–20.99 m: under 21 / 21 and over. The quota follows the quota length, whatever the boat (deltakerforskriften
// 2026 sets no largest length for the closed group, only under 500 m³ of hold).
const HJ = {
  u7: {grp:'u11', hl:'under 7 m', kf:1.2623, hyse:[5.391, [null, null]], sei:[5.88, [182.13, 94.00, 49.94], [11, 15]]},
  h7: {grp:'u11', hl:'7–7,9 m', kf:1.4918, hyse:[6.306, [null, null]], sei:[6.87, [213.02, 109.94, 58.41], [11, 15]]},
  h8: {grp:'u11', hl:'8–8,9 m', kf:1.7734, hyse:[7.509, [null, null]], sei:[8.18, [253.68, 130.93, 69.56], [11, 15]]},
  h9: {grp:'u11', hl:'9–9,9 m', kf:2.1698, hyse:[9.289, [null, null]], sei:[10.12, [313.83, 161.98, 86.05], [11, 15]]},
  h10:{grp:'u11', hl:'10–10,9 m', kf:2.3471, hyse:[9.915, [null, null]], sei:[10.81, [334.99, 172.90, 91.85], [11, 15]]},
  h14:{grp:'g11', hl:'14–14,9 m', kf:5.2289, hyse:[20.590, [308.849, 164.720]], sei:[22.38, [67.14, 44.76], [15]]},
  h20:{grp:'g15', hl:'20–20,9 m', kf:10.2540, hyse:[35.423, [247.963, 141.693]], sei:[45.57, [91.15, 68.36], [21]]}
};
// a right's quotas in kg for the year of H, on a boat of largest length len: {torsk, hyse:[max, guaranteed], sei:[max, guaranteed]}
// (Infinity for no maximum). Old saves keep the right's id and get the year's figures from it.
function licQ(l, H, len){
  if (l && HAVLIC[l.id]) return havQ(l, H);   // an ocean permit (H1 of the ocean step, below)
  const R = l && HJ[l.id]; if (!R) return {torsk:l ? l.cod || 0 : 0, hyse:l && l.hyse ? l.hyse : [0, 0], sei:l && l.sei ? l.sei : [0, 0]};
  const Y = yearQuota(yearH(H == null ? S.t / 60 : H)), L = len || BOAT.len || 5.8, kg = t => t == null ? Infinity : Math.round(t * 1000);
  const hMax = R.hyse[1][L < 11 ? 0 : 1], sb = R.sei[2], si = sb.filter(b => L >= b).length, sMax = R.sei[1][si];
  // structure quotas and a second right under the special scheme add their quota factors; a cooperation adds the partner's
  // quota for the year (haddock and saithe in the same proportion)
  const co = l.coop && l.coop.y === Y.y ? HJ[l.coop.id].kf : 0, kf = R.kf + (l.extra || 0) + co, m = kf / R.kf;
  return {torsk:Math.round(kf * Y.unit[R.grp] * 1000), hyse:[hMax == null ? Infinity : kg(hMax * Y.fh * m), kg(R.hyse[0] * Y.fh * m)], sei:[kg(sMax * Y.fs * m), kg(R.sei[0] * Y.fs * m)]};
}
// what the seller of a boat with a right has fished of this year's cod quota (§ 29: it comes off the buyer's quota); a share that
// grows through the year, different for each boat and year
function sellerCod(id, H){ const d = doyH(H), u = h2(yearH(H) * 31 + (S.qseed || 0) % 9973, 700 + id.length * 7 + id.charCodeAt(1)); return clamp(d / 365 * (0.6 + 0.9 * u), 0, 0.85); }
// the offers in Båthandel (LIC_OFFERS in 03-simulation.js) show this year's quotas for the boat they come with
// and the quota price now (kpkAt, KM5): a right bought keeps it as l.kpk (ui/phone/14-act.js buylic)
for (const O of LIC_OFFERS){ O.k = O.k || O.id; O.hl = HJ[O.id].hl; const f = () => licQ(O, S.t / 60, VESSELS[O.ves].len);
  Object.defineProperties(O, {cod:{get:() => f().torsk}, hyse:{get:() => f().hyse}, sei:{get:() => f().sei}, kpk:{get:() => kpkAt(S.t / 60), enumerable:true}}); }
// § 29: what the owner has landed this year with a boat in the open group follows the owner to the next boat there (the new boat's
// quota is reduced by it); a boat that takes over a closed-group right starts the year with what the seller fished on it
function openUsedSave(q){ const y = yearH(S.t / 60); if (!q || q.y !== y) return; const O = S.openUsed && S.openUsed.y === y ? S.openUsed : (S.openUsed = {y, torsk:0, hyse:0, sei:0});
  for (const sp of ['torsk', 'hyse', 'sei']) O[sp] = Math.max(O[sp], q[sp] || 0); }
function openUsedLoad(){ const q = quotaState(), O = S.openUsed; if (O && O.y === q.y) for (const sp of ['torsk', 'hyse', 'sei']) q[sp] = Math.max(q[sp], O[sp]); }
function freshQuota(){ S.quota = null; return quotaState(); }
function licStart(lic){ const q = freshQuota(); q.torsk = Math.round(licQ(lic).torsk * sellerCod(lic.id, S.t / 60)); q.seller = q.torsk; return q.torsk; }
// ---- the stocks and the total quotas year by year. History and the advice for 2027 from the Institute of Marine Research (hi.no,
// kvoteråd, June 2026; ICES for saithe): spawning stock (SSB) and agreed total quota (TAC), t. After that a simple model per save:
// the stock drifts back towards a long-run level (a) with year-class luck (sd), and fishing above the advice holds it back; the advice
// follows the stock (∝ SSB^0.55, lower below B_pa, the curve fitted to 2014–2027), changes at most ±cap a year above B_pa as the
// harvest rules say, and the agreed quota lands at or a little over the advice (cod 2026: 285 000 t against 269 440 t). ----
const STOCK = {
  torsk:{ssb:{2014:2070400, 2015:1647624, 2016:1298178, 2017:1334847, 2018:1197991, 2019:1136354, 2020:902033, 2021:762061, 2022:638202, 2023:659627, 2024:500725, 2025:351746, 2026:338014, 2027:345518},
    tac:{2014:993000, 2015:894000, 2016:894000, 2017:890000, 2018:775000, 2019:725000, 2020:738000, 2021:885600, 2022:708480, 2023:566784, 2024:453427, 2025:340000, 2026:285000},
    adv27:312667, Blim:220000, Bpa:460000, Bm:900000, a:0.2, sd:0.15, cap:0.2, slack:0.08},
  hyse:{ssb:{2015:505545, 2016:497770, 2017:416370, 2018:306104, 2019:233900, 2020:194343, 2021:180887, 2022:177659, 2023:176883, 2024:163034, 2025:157942, 2026:164781, 2027:186998},
    tac:{2014:178500, 2015:178500, 2016:244000, 2017:233000, 2018:202305, 2019:172000, 2020:215000, 2021:232537, 2022:178532, 2023:170067, 2024:141000, 2025:130000, 2026:153293},
    adv27:180336, Blim:50000, Bpa:80000, Bm:250000, a:0.2, sd:0.22, cap:0.2, slack:0.12},
  // saithe: the spawning stock 2014-2026 from ICES's assessment of 2026 (pok.27.1-2, the Stock Assessment Graphs database, sag.ices.dk,
  // assessment key 22657, read 02.11.2026); 2027 and the 2028 projection (223 227 t) are ICES's advice
  sei:{ssb:{2014:279140, 2015:295586, 2016:338619, 2017:305373, 2018:359427, 2019:356823, 2020:355347, 2021:391020, 2022:392392, 2023:374691, 2024:351434, 2025:234266, 2026:205000, 2027:197518}, tac:{2014:119000, 2015:122000, 2016:140000, 2017:150000, 2018:172500, 2019:149550, 2020:171982, 2021:197779, 2022:197212, 2023:226794, 2024:223123, 2025:193117, 2026:164149},
    adv27:127807, Blim:93923, Bpa:131492, Bm:300000, a:0.25, sd:0.18, cap:0.15, slack:0},
  // Greenland halibut (07.10.2026): the female spawning stock from JRN-AFWG 2026 (the years between are not in the text; 2027 is the
  // start of the year in the advice), the total quotas 2020-2026 from the Norwegian-Russian commission (regjeringen.no and the
  // Directorate's regulation papers; the years before were not found). Long-lived and slow: it drifts back slowly with small year-class
  // luck, and the agreed quota has been far over the advice (2025: 19 000 t against 12 431 t)
  blakveite:{ssb:{2015:93020, 2019:89902, 2021:80283, 2023:68445, 2025:58116, 2026:55174, 2027:52635},
    tac:{2020:27000, 2021:27000, 2022:25000, 2023:25000, 2024:21250, 2025:19000, 2026:19000},
    adv27:19610, Blim:33391, Bpa:46747, Bm:75000, a:0.1, sd:0.06, cap:0.2, slack:0.1},
  // snow crab (H3a of docs/planer/havsteget-h3-snokrabbe.md, V4, 06.11.2026): HI's quota advice for 2027 (Rapport fra havforskningen
  // 2026-54, tab. 5 and 6, read): the stock as B/BMSY from the SPiCT model (idx: an index, not tonnes; 2018, 2020 and 2022 between their
  // neighbours), the total quotas 2017-2027 (the ministry set 16 594 t for 2027 on 28.10.2026), MSY Btrigger 0.5 and Blim 0.3 of BMSY.
  // The advice is the catch at FMSY with no cap on the change from year to year, and the quota has been set at or under it (slack 0).
  // After 2027 the game's model: the stock drifts towards Bm (the level fished at the advice; 2 BMSY unfished in the model, an
  // assumption), with year-class luck sd; the newcomer's stock grew sevenfold 2017-2027
  snokrabbe:{idx:true, ssb:{2017:0.24, 2018:0.28, 2019:0.32, 2020:0.46, 2021:0.61, 2022:0.87, 2023:1.13, 2024:1.58, 2025:1.6, 2026:1.7, 2027:1.78},
    tac:{2017:4000, 2018:4000, 2019:4000, 2020:4500, 2021:6500, 2022:6725, 2023:7117, 2024:9758, 2025:12019, 2026:12336},
    adv27:16594, Blim:0.3, Bpa:0.5, Bm:1.6, a:0.2, sd:0.15, cap:0.6, slack:0}
};
// The coastal cod are not the Northeast Arctic cod (B4, 02.11.2026): ICES assesses them on their own (the Stock Assessment Graphs database,
// sag.ices.dk, read 02.11.2026). North of 67° N (cod.27.1-2.coastN, assessment of 2026, key 22637): the spawning stock in tonnes. Between
// 62 and 67° N (cod.27.2.coastS, 2026, key 23775): only B/Bmsy, the stock against the level of the largest lasting yield (data-limited;
// F was 1.5-1.66 times Fmsy every year 2012-2025). South of 62° N the game has no series (the North Sea and Skagerrak cod are other
// stocks): 1. The resident cod's level in a year is the square root of the stock against 2024-2025, the years of the landing notes the
// places come from (fiske.json); after the last year of data it holds (no projection of our own).
const KYSTT = {
  N:{2012:99036, 2013:99679, 2014:103685, 2015:94896, 2016:98719, 2017:81216, 2018:74416, 2019:61230, 2020:65388, 2021:56729, 2022:54951, 2023:53035, 2024:71729, 2025:80933},
  S:{2012:0.74, 2013:0.68, 2014:0.67, 2015:0.66, 2016:0.66, 2017:0.63, 2018:0.59, 2019:0.54, 2020:0.5, 2021:0.48, 2022:0.44, 2023:0.42, 2024:0.42, 2025:0.42, 2026:0.44}};
function kystAt(T, y){ const ys = Object.keys(T).map(Number), y0 = Math.min(...ys), y1 = Math.max(...ys), yy = clamp(y, y0, y1); return T[yy] != null ? T[yy] : T[y1]; }
function kystF(lat, H){
  const y = yearH(H) + doyH(H) / 365, a = Math.floor(y), f = y - a, at = T => kystAt(T, a) * (1 - f) + kystAt(T, a + 1) * f;
  const n = Math.sqrt(at(KYSTT.N) / ((KYSTT.N[2024] + KYSTT.N[2025]) / 2)), s = Math.sqrt(at(KYSTT.S) / ((KYSTT.S[2024] + KYSTT.S[2025]) / 2));
  const wn = sstep(66.6, 67.4, lat), ws = (1 - wn) * sstep(61.6, 62.4, lat);
  return n * wn + s * ws + (1 - wn - ws);
}
const STKY = {};
// (sd: the seed to use instead of the save's, S.qseed; kpkAt asks for WORLD_SEED's)
function stockYear(sp, y, sd){
  // the server's stock when the admin has turned it on (B4, world_cfg.stock_server; WSH.stock comes with the world)
  if (typeof WSH !== 'undefined' && WSH.stock){ const r = WSH.stock.find(q => q[0] === sp && q[1] === y); if (r) return {ssb:r[2], tac:r[3], adv:r[4]}; }
  const sd0 = sd != null ? sd : (S && S.qseed || 0), key = sp + ':' + y + ':' + sd0; if (STKY[key]) return STKY[key];
  const P = STOCK[sp], seed = sd0 % 100003, u = k => h2(y * 977 + seed, 4000 + k + ALLSP.indexOf(sp) * 31);
  const curve = b => Math.pow(b, 0.55) * Math.sqrt(Math.min(1, b / P.Bpa)), A = P.adv27 / curve(P.ssb[2027]);
  let r;
  if (y <= 2026) r = {ssb:P.ssb[y] || P.ssb[2026], tac:P.tac[y] || P.tac[2026], adv:P.tac[y] || P.tac[2026]};
  else if (y === 2027) r = {ssb:P.ssb[2027], adv:P.adv27, tac:Math.round(P.adv27 * (1 + P.slack * u(1)) / 100) * 100};
  else { const p = stockYear(sp, y - 1, sd), over = Math.max(0, p.tac / p.adv - 1);
    const s1 = p.ssb * Math.exp(P.a * Math.log(P.Bm / p.ssb) + P.sd * gauss(u(2), u(3)) - 0.5 * over), ssb = P.idx ? Math.round(s1 * 1000) / 1000 : Math.round(s1);   // (an index, the snow crab's B/BMSY: not whole tonnes)
    let adv = A * curve(ssb); if (ssb >= P.Bpa) adv = clamp(adv, p.tac * (1 - P.cap), p.tac * (1 + P.cap));
    adv = Math.round(adv / 100) * 100; r = {ssb, adv, tac:Math.round(adv * (1 + P.slack * u(4)) / 100) * 100}; }
  return STKY[key] = r;
}
// the stock's effect on the fish in the sea: the square root of the spawning stock against March 2027, through the year from one
// year's stock to the next (1 for the other species)
function ssbAt(sp, H){ const y = yearH(H), f = doyH(H) / 365, a = stockYear(sp, y).ssb, b = stockYear(sp, y + 1).ssb; return a + (b - a) * f; }
function stockF(sp, H){ if (!STOCK[sp] || !S) return 1; return clamp(Math.sqrt(ssbAt(sp, H) / ssbAt(sp, 0)), 0.6, 1.6); }

// ---- the open group's season. About 2 100 boats fish the group quota down a day at a time (more in the skrei season and on days
// with less than 12 m/s, and with the stock); each closes on its maximum quota. The Directorate stops the maximum-quota fishing with
// a week's notice when the group quota will be taken, raises the maximum quotas on 1 May and 1 June when the boats would leave much
// of it, and opens free fishing in the autumn when even that is not enough (2019–2026: stopped between 24 March and 15 May in five
// years; raised and free fishing in 2021 and 2022; neither in 2024). How many boats are out and how hard they fish is drawn for each
// year, so some years have no stop. Calibrated so that 2026's quotas give a stop between early April and mid-May in half the years. A year is worked out a day at a time
// up to today and kept in S.qy, so a stop announced stays announced, and your own landings and the other players' (wshOpen) count in the
// group's catch. ----
const OPENF = {n:2100, mix:[0.45, 0.35, 0.20], k:0.02, ov:[0.85, 0.3], season:[0.8, 1.0, 1.3, 1.2, 0.8, 0.6, 0.4, 0.5, 0.6, 0.6, 0.5, 0.3]};
const doyOf = (y, m, d) => Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 864e5);
const hOfDoy = (y, d) => (Date.UTC(y, 0, 1) + d * 864e5 - EPOCH) / 36e5;
function qyOf(y){ S.qy = S.qy || {}; let Y = S.qy[y]; if (Y) return Y;
  const u = k => h2(y * 389 + (S.qseed || 0) % 99991, 6000 + k);
  Y = S.qy[y] = {d:-1, c:0, me:0, r:0, stop:null, ann:null, add:0, free:null, log:[], n:Math.round(OPENF.n * (0.92 + 0.14 * u(1))), act:0.8 + 0.18 * u(2), sk:0.85 + 0.3 * u(3), freeDay:doyOf(y, 9, 27) + Math.floor(u(4) * 14)};
  for (const k in S.qy) if (+k < y - 2) delete S.qy[k];   // the save keeps three years
  return Y; }
// the open group's boats out: the register's (OPENF.n, drawn per year) less the players active in the open group this year (WSH.openBoats,
// B4): a player who fishes the open group takes the place of one of the virtual boats, so the number of boats out stays right
function qyBoats(Y, y){ const p = typeof WSH !== 'undefined' && WSH.y === y ? (WSH.openBoats || 0) : 0; return Math.max(Math.round(Y.n * 0.5), Y.n - p); }
function qyStep(Y, y, d){
  const n = qyBoats(Y, y);
  const O = yearQuota(y).open, Qf = O.Q - O.ff, H = hOfDoy(y, d), m = new Date(Date.UTC(y, 0, 1 + d)).getUTCMonth();
  let good = 0; for (const h of [8, 12, 16]) if (windAt(H + h) < 12) good++;
  const mx = O.max.reduce((a, v, i) => a + OPENF.mix[i] * (v + Y.add), 0) * (Y.free != null && d >= Y.free ? 2 : 1), gu = O.guar.reduce((a, v, i) => a + OPENF.mix[i] * v, 0);
  const open = Y.stop == null || d < Y.stop, cap = Y.act * (open ? mx : gu), e = OPENF.season[m] * good / 3 * stockF('torsk', H + 12) * Y.sk;
  const dc = n * OPENF.k * e * Math.max(0, cap - Y.c / n); Y.c += dc; Y.r = 0.7 * Y.r + 0.3 * dc;
  if (Y.stop != null || Y.free != null) return;
  // (the stops came between 24 March and 15 May; later in the year the boats' own maximum quotas hold the catch)
  if (d >= 14 && d < doyOf(y, 6, 1) && Y.c + Y.me + wshOpen(y) + 7 * Y.r >= Qf){ Y.stop = d + 7; Y.ann = d; Y.log.push([d, 'stop', Y.stop]); return; }
  // on 1 May and 1 June: a raise when what the boats can take on their maximum quotas falls short of the group quota, and free
  // fishing in the autumn when even the raised quotas will not take it
  const got = Y.c + Y.me + wshOpen(y), proj = Math.max(got, n * Y.act * mx * 0.97);
  if ((d === doyOf(y, 5, 1) || d === doyOf(y, 6, 1)) && proj < 0.95 * Qf){ const s = Math.max(0.5, Math.round((Qf - proj) / n / Y.act * 2) / 2); Y.add += s; Y.log.push([d, 'raise', s]); }
  if (d === Y.freeDay && got < 0.85 * Qf){ Y.free = d; Y.log.push([d, 'free']); }
}
// the year's course up to H, or up to today for a later H (what is not yet known is not worked out)
// a new year: structure quotas whose time is up go back, and last year's cooperation ends (the partner goes ashore)
function quotaNewYear(y){ if (S.qyY === y) return; S.qyY = y;
  if (typeof kmFree === 'function') kmFree(S.t / 60);   // a free right whose two years are up goes back to the register (03i-kvotemarked.js)
  for (const v of S.fleet || []){ const l = vget(v, 'lic'); if (!l) continue; if (structExpire(l, y)) log('En strukturkvote på «' + vget(v, 'boatName') + '» har gått ut og er fordelt tilbake til gruppen.', 'A structure quota on the «' + vget(v, 'boatName') + '» has run out and gone back to the group.');
    if (l.coop && l.coop.y < y){ const cr = vget(v, 'crew') || [], i = cr.findIndex(c => c.id === l.coop.crew); if (i >= 0) cr.splice(i, 1); log(l.coop.name + ' gikk i land: kvotesamarbeidet var for ett år.', l.coop.name + ' went ashore: the cooperation was for one year.'); l.coop = null; } } }
function qyAt(H){ const y = yearH(H), now = S.t / 60, ny = yearH(now), Y = qyOf(y), last = y < ny ? doyOf(y, 12, 31) : y > ny ? -1 : Math.min(doyH(H), doyH(now));
  while (Y.d < last) qyStep(Y, y, ++Y.d); if (y === ny) quotaNewYear(y); return Y; }
function codStopDoy(y){ return qyAt(Math.max(hOfDoy(y, 0), Math.min(S.t / 60, hOfDoy(y, 364)))).stop; }
function openMaxAdd(H){ const Y = qyAt(H), d = doyH(H); return Y.free != null && d >= Y.free ? Infinity : Y.add; }
// the fresh-fish scheme (J-187-2026 § 25): 20 % of the week's fresh landings from 29 June; the share was raised in the autumn in
// 2017, 2018, 2021, 2022, 2024 and 2025 (to 30–50 %, between 15 September and 25 November), went down in 2023, stopped in late
// November 2019, and was often cut to 10 % before Christmas. Drawn for each year from that history.
const FFC = {};
function ffPlan(y){ const key = y + ':' + (S.qseed || 0); if (FFC[key]) return FFC[key];
  const u = k => h2(y * 131 + (S.qseed || 0) % 9973, 5000 + k), P = [[doyOf(y, 6, 29), 0.2]], r = u(0);
  if (r < 0.1) P.push([doyOf(y, 9, 20) + Math.floor(u(1) * 14), 0.1]);
  else if (r < 0.8){ const d1 = doyOf(y, 9, 15) + Math.floor(u(2) * 28), p1 = u(3) < 0.7 ? 0.3 : 0.4; P.push([d1, p1]);
    if (u(4) < 0.55) P.push([Math.max(d1 + 21, doyOf(y, 10, 13) + Math.floor(u(5) * 40)), Math.min(0.5, p1 + (u(6) < 0.7 ? 0.1 : 0.2))]); }
  if (u(7) < 0.05) P.push([doyOf(y, 11, 29), 0]);
  else if (u(8) < 0.6) P.push([doyOf(y, 12, 15) + Math.floor(u(9) * 10), 0.1]);
  return FFC[key] = P.sort((a, b) => a[0] - b[0]); }
function ffPct(H){ const d = doyH(H); let p = 0; for (const [d0, v] of ffPlan(yearH(H))) if (d >= d0) p = v; return p; }

// ---- the closed group's register: a fixed number of rights (1 622 in the cod fishery north of 62° N on 17.10.2025, case document
// 5/2025 table 8), split here on the quota lengths the game sells. Every right has an owner (NPCs in the game). You buy your way in
// from one of them, so there is one owner fewer for each right you buy, and structuring takes the boat out for good. When the game
// has real players on a shared server, they take NPCs' places in the same register. ----
const REGN = {u7:300, h7:280, h8:230, h9:200, h10:162, h14:291, h20:103};
// the ocean permits in the same register (H1 of docs/planer/havsteget.md, Jonas 03.11.2026: «tillatelsene må også være realistiske»):
// as many as there are in life. Konvensjonelle havfiskefartøy 26 (Fiskeridirektoratet, høringsnotat 26.03.2026, the table for 2025),
// torsketrål 36 (snl.no «torskefiske», 2019; not confirmed for 2025), ringnot 69 (21.10.2025), snow crab 34 (worked out: 12 036 t for
// the fleet over 351 t guaranteed each; a reply to the Storting speaks of about 70 permits, year not given). For each permit a player
// holds, one NPC ship of the kind leaves the sea (Jonas' rule, havHeld in 05d-hav.js; the NPC fleet has more ships than permits, as
// vessels with other permits, shrimp and saithe trawl among them, fish beside them)
// (H3a, 06.11.2026: snow crab 30, Fiskeridirektoratet's sak 17/2026: «70 fartøy hadde en slik tillatelse i 2024» and from 2025 «fikk 30
// fartøy tillatelse til å delta»; it was 34, worked out of the vessel quota, before. A save from before is cut to 30 in npcReg)
const HREG = {tral:36, konv:26, rnot:69, krab:30};
// B4 (02.11.2026): the register is the server's when the game is online (one for all players, supabase/migrations/20261102120000_register.sql:
// a right one player buys is gone from the NPC owners for everybody, and a player who neither lands nor buys for 90 days gives the place
// back); it comes with the world every ten minutes (WSH.reg) and after each purchase or sale. Offline the save keeps its own as before.
// (H1 of docs/planer/havsteget.md, 03.11.2026: the ocean permits HREG share the register; a save from before gets them full)
function npcReg(){ const R = S.npcReg || (S.npcReg = {...REGN}); for (const k in HREG) if (R[k] == null || R[k] > HREG[k]) R[k] = Math.min(R[k] == null ? HREG[k] : R[k], HREG[k]);
  if (typeof WSH !== 'undefined' && WSH.reg){ for (const k in REGN) if (WSH.reg[k] != null) R[k] = WSH.reg[k]; for (const k in HREG) if (WSH.reg[k] != null) R[k] = Math.min(WSH.reg[k], HREG[k]); } return R; }   // (never over HREG: the server's snow crab register said 34 until its migration to 30, H3a)
function regSend(fn, id){
  if (typeof cloudRpc !== 'function' || typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user) return;
  cloudRpc(fn, {rid:id}).then(r => { if (r && typeof r === 'object') WSH.reg = r; })
    .catch(e => { if (/no owner left/.test(e && e.message)) log('Registeret på land hadde ingen eier igjen med den hjemmelslengden; kjøpet står i lagringen din.', 'The register ashore had no owner left at that quota length; the purchase stands in your save.'); });
}
function regTake(id){ const R = npcReg(); R[id] = Math.max(0, (R[id] || 0) - 1); regSend('reg_take', id); }
// a right that leaves the player (sold with the boat) goes back to the NPC owners
function regFree(id){ const R = npcReg(); R[id] = Math.min(REGN[id] || HREG[id] || 0, (R[id] || 0) + 1); regSend('reg_free', id); }
// the owner selling a right this week: a name and a home harbour, the same all week
function regSeller(id, H){ const w = weekOfH(H), u = k => h2(w * 31 + id.charCodeAt(1) * 7 + id.length, 8200 + k);
  return {name:CREW_M[Math.floor(u(1) * CREW_M.length)] + ' ' + CREW_SN[Math.floor(u(2) * CREW_SN.length)], home:CREW_HOME[Math.floor(u(3) * CREW_HOME.length)][0]}; }
// ---- structure quotas (forskrift om spesielle kvoteordninger for kystfiskeflåten, J-244-2025): quota lengths 11–27.99 m may buy a
// boat in the same group (11–14.99, 15–20.99, 21–27.99 m), have it struck off the register of fishing vessels (§ 8: «meldt ut av
// registeret over fiskefartøy»; scrapping is no longer required) and take its quota factor less 10 % (§ 11), for 20 years, up to the
// quota cap (§ 12: 3+3 or 5+1 times the boat's own quota for 11–14.99 m, 4+4 or 6+2 for 15–27.99 m, counted with the own quota; a
// player's boat has only the whitefish sector, so she is a specialist: 5 and 6 times; KM1, 08.11.2026, it was 3 and 4. The cap stands
// in Fiskeridirektoratet's «Forslag etter høring» 11.09.2026 kap. 4.2, which only adds 4+2 and 5+3 for generalists) ----
const STRUCT = {cut:0.1, years:20, cap:{g11:5, g15:6, g21:6}};
// whether a boat's right l has room for add more quota factors under the cap
function structFits(l, add){ const A = l && HJ[l.id]; return !!(A && STRUCT.cap[A.grp]) && A.kf + (l.extra || 0) + add <= A.kf * STRUCT.cap[A.grp] + 1e-9; }
function structRoom(l, id){ const A = l && HJ[l.id], B = HJ[id]; if (!A || !B || A.grp === 'u11' || A.grp !== B.grp) return false; return structFits(l, B.kf * (1 - STRUCT.cut)); }
function structPrice(id, H){ return Math.round(licQ({id}, H).torsk * kpkAt(H)); }   // the right's quota at the quota price now; its boat is struck off the register
// (the NPC owner leaves the register with regTake where the purchase is made, ui/phone/14-act.js; structIn took one more until KM1)
function structIn(l, id, H){ const k = HJ[id].kf * (1 - STRUCT.cut), y = yearH(H); l.st = (l.st || []).concat([{id, kf:k, from:y, until:y + STRUCT.years}]); licExtra(l); return k; }
function licExtra(l){ l.extra = (l.st || []).reduce((a, s) => a + s.kf, 0) + (l.two ? HJ[l.two].kf : 0); }
// a structure quota whose time is up goes back to the group it came from (fordelt etter «modell X»; not modelled further)
function structExpire(l, y){ if (!l || !l.st) return 0; const n = l.st.length; l.st = l.st.filter(s => s.until > y); licExtra(l); return n - l.st.length; }
// ---- the special scheme for quota lengths under 11 m (kap. 2, from 2025): an owner with two such boats, both owned since the year
// before, gives up one right and fishes both quotas with the other boat; no reduction (as far as the text reads) ----
function twoOK(la, lb, y){ return !!(la && lb && la !== lb && HJ[la.id] && HJ[lb.id] && HJ[la.id].grp === 'u11' && HJ[lb.id].grp === 'u11' && !la.two && !lb.two && !la.coop && (la.since || 0) < y && (lb.since || 0) < y); }
// ---- quota cooperation (J-187-2026 § 31): two closed-group boats under 11 m with different owners; both owners aboard, the passive
// boat lies still, one cooperation a year. Here with an NPC owner who comes aboard as crew and takes half the first-hand value of
// what is landed on his quota (the split is an assumption). ----
const COOP = {share:0.5};
function coopOffer(H){ const ids = ['u7', 'h7', 'h8', 'h9', 'h10'], w = weekOfH(H), id = ids[Math.floor(h2(w * 13, 8300) * ids.length)]; return {id, ...regSeller(id + 'c', H)}; }
function coopOK(l, y){ return !!(l && HJ[l.id] && HJ[l.id].grp === 'u11' && !l.two && (l.since || 0) < y && !(l.coop && l.coop.y === y)); }

// ---- the ocean permits (H1 of docs/planer/havsteget.md, 03.11.2026). Jonas' choices the same day: V1 A (the autoliner first), V2 B
// («Prisene må reflektere det virkelige liv»: the quota is paid at its value on top of the hull), V3 A («tillatelsene må også være
// realistiske»: one permit per group as in life, with the seller's quota factors). The vessel quota is the quota factors (the permit's
// own plus structure quota, l.extra) times the year's quota per factor 1.00. Sources (kap. 2 of the plan):
//   tral  torsketråltillatelse, konsesjonsforskriften § 2-1; J-187-2026 §§ 7-9: 372 t cod, 332 t haddock, 422 t saithe per factor 1.00
//   konv  konvensjonell havfisketillatelse (autoline and nets over 28 m; Danish seine over 28 m under it until the rule is found):
//         118 t cod and 107 t haddock per factor; saithe 272 t only with garnseitillatelse, which the game does not have (kap. 6), so
//         saithe has no vessel quota here (an assumption: not confirmed what the group fishes without it)
//   rnot  ringnottillatelse, § 4-1: NVG herring, Norway's 342 666 t, about 49 % to the purse seiners, over the 69 permits (21.10.2025);
//         the real factor follows the licence capacity in hl, here one factor is the mean permit (an assumption)
//   krab  snow crab permit, the regulation for 2026: a guaranteed vessel quota of 351 t (12 336 t in all, 16 594 t in 2027)
// A permit for sale carries the factors its NPC owner has: the group's factors over its vessels (trawl 31 785 / 372 = 85.4 over 36,
// conventional 10 717 / 118 = 90.8 over 26: 2.37 and 3.49 on average, structure quota included), 0.6-1.4 times the mean, the same all week.
// Each group's quota for cod, haddock and saithe (J-187-2026 § 5, «gruppedeling») follows the year: the trawl and the ocean-going
// conventional vessels' cod from the quota chain (codChain: the trawl ladder and the 12.81 %, which give 32 535 and 10 717 t for 2026
// exactly), haddock and saithe with Norway's quota (fh, fs); herring as 2026; snow crab with its total quota (2027 known, then held).
const HAVLIC = {
  tral:{no:'Torsketråltillatelse', en:'Cod trawl permit', ves:['bunntral'], gear:['tral'], q26:{torsk:372, hyse:332, sei:422}, grp26:{torsk:31785, hyse:28665, sei:43397}, src:'konsesjonsforskriften § 2-1; J-187-2026 §§ 5, 7–9'},
  konv:{no:'Konvensjonell havfisketillatelse', en:'Ocean-going conventional permit', ves:['autoliner'], gear:['line', 'garn', 'snurrevad'], q26:{torsk:118, hyse:107, sei:null}, grp26:{torsk:10717, hyse:8647, sei:6128}, src:'konsesjonsforskriften; J-187-2026 §§ 5, 13'},
  rnot:{no:'Ringnottillatelse', en:'Purse seine permit', ves:['pelagisk', 'ringnot38'], gear:['not'], q26:{sild:342666 * 0.49 / 69}, grp26:{sild:342666 * 0.49}, src:'konsesjonsforskriften § 4-1; NVG-reguleringen 2026'},
  krab:{no:'Snøkrabbetillatelse', en:'Snow crab permit', ves:['snokrabbe'], gear:['teine'], q26:{snokrabbe:351}, grp26:{snokrabbe:12336}, src:'Regulering av fangst av snøkrabbe i 2026 (J-237-2025); for 2027 Fiskeridirektoratets forslag (sak 17/2026)', flat:true, yq:y => ({snokrabbe:snoYear(y).vq})}
};
// ---- the snow crab's regulation year by year, as data (V4 of docs/planer/havsteget-h3-snokrabbe.md, Jonas 06.11.2026: «Gjør det som blir
// mest riktig, og passer spillet i et fremtidsperspektiv»). Each year's J-message gives the total quota (tac, t), the part set aside for
// live delivery (live), the research and management quota (fou), the overregulation of the vessel quota (over) and whether unused or
// overfished vessel quota carries over to the next year (flex, at most that share of the vessel quota). The vessel quotas are worked out of
// them with the permits (n): the ordinary (tac - live - fou) / n × (1 + over), and the extra quota for live crab live / n. A new year's
// regulation is one more row here (the one for 2027 comes in December). After the last row the total quota is the stock's (stockYear)
// and the rest as the last row.
//   2026  J-237-2025 §§ 2-4 (read): 12 336 t, 2 460 t for live delivery, 300 t research, «10 % overregulering fra starten av året»
//         (sak 17/2026): 351 t ordinary and 82 t extra a vessel, which is § 3 and § 4. The 10 % flexibility is on the total quota only.
//   2027  the total quota is set (16 594 t); the rest is Fiskeridirektoratet's proposal (sak 17/2026, reguleringsmøtet 4.-5.11.2026,
//         read): no overregulation, 20 % for live delivery (the example: 3 300 t), the flexibility of 10 % on the vessel quota from the
//         turn of 2027/2028. «Den ordinære fartøykvoten vil utgjøre om lag 430 tonn og tilleggskvoten om lag 110 tonn.»
const SNOREG = {
  2026:{tac:12336, live:2460, fou:300, over:0.1, flex:0, n:30, src:'J-237-2025'},
  2027:{tac:16594, live:3300, fou:300, over:0, flex:0.1, n:30, src:'Fiskeridirektoratet, sak 17/2026 (forslag)'}};
const SNOREG_LIVE = 0.2;   // the share for live delivery in a year after the last row (sak 17/2026: «videreført med 20 % avsetning»)
// The vessel's snow crab quota for the year of H (kg round weight): the ordinary vessel quota, what the flexibility carried from last year
// (S.lic.flex {y, kg}, + unused or - overfished), and how far over it the year's flexibility lets her fish (deducted the year after);
// null without a snow crab permit. The landings count in round weight (quotaState().snokrabbe)
function snoQuota(H){ const l = S.lic; if (!l || l.id !== 'krab') return null; const y = yearH(H == null ? S.t / 60 : H), Y = snoYear(y), base = Math.round(Y.vq * 1000), fl = l.flex && l.flex.y === y ? l.flex.kg : 0;
  return {y, base, flex:fl, over:Math.round(Y.flex * base), max:base + fl + Math.round(Y.flex * base), extra:Math.round(Y.tq * 1000)}; }
function snoRoom(H){ const Q = snoQuota(H); return Q ? Math.max(0, Q.max - quotaState().snokrabbe) : 0; }
// at the turn of the year (quotaState): what was unused, or fished over, of last year's vessel quota is carried into the new year, at most
// the flexibility (10 % of the vessel quota, from 2027/2028, sak 17/2026), kept in the save on the permit (S.lic.flex)
function snoFlexNewYear(q, y){
  const l = S.lic; if (!l || l.id !== 'krab' || q.y !== y - 1) return; const Yp = snoYear(q.y); if (!Yp.flex){ l.flex = null; return; }
  const base = Math.round(Yp.vq * 1000), had = l.flex && l.flex.y === q.y ? l.flex.kg : 0, lim = Math.round(Yp.flex * base), kg = clamp(base + had - (q.snokrabbe || 0), -lim, lim);
  l.flex = {y, kg:Math.round(kg)}; if (Math.abs(kg) >= 1000) log('Kvotefleks for snøkrabbe: ' + fmtC(Math.abs(kg) / 1000, 1) + ' t ' + (kg > 0 ? 'ubrukt kvote er godskrevet' : 'overfiske er belastet') + ' ' + y + '.', 'Snow crab quota flexibility: ' + fmtC(Math.abs(kg) / 1000, 1) + ' t ' + (kg > 0 ? 'of unused quota credited to' : 'of overfishing charged to') + ' ' + y + '.');
}
// the year's figures: {y, tac, live, fou, over, flex, n, vq (the ordinary vessel quota, t), tq (the extra quota for live crab, t), src, known}
function snoYear(y){
  const ys = Object.keys(SNOREG).map(Number), y1 = Math.max(...ys), R = SNOREG[clamp(y, Math.min(...ys), y1)] || SNOREG[y1];
  let o = {...R, known:y <= y1};
  if (y > y1){ const tac = stockYear('snokrabbe', y).tac; o = {...SNOREG[y1], tac, live:Math.round(tac * SNOREG_LIVE / 100) * 100, known:false, src:'spillets bestand (etter ' + y1 + ')'}; }
  o.y = y; o.vq = Math.round((o.tac - o.live - o.fou) / o.n * (1 + o.over)); o.tq = Math.round(o.live / o.n); return o;   // (whole tonnes, as § 3 and § 4 give them: 351 and 82)
}
// the mean quota factors a vessel of the group holds (the group's factors in 2026 over its permits)
const HAVKF = {tral:31785 / 372 / 36, konv:10717 / 118 / 26, rnot:1, krab:1};
// the quota price, kr per kg of the vessel quota (V2 B): cod at KPK as for the coast (260 kr/kg in 2026, Hepsøfjord 2025; no source publishes
// quota prices), the other species in proportion to their first-hand price against cod (Råfisklaget's minimum prices 2026: haddock and
// saithe about 20 against 42 kr; herring 12 and snow crab 115 kr from the landing notes 2025). Estimates: an average conventional permit
// (3.49 factors) comes to about 155 MNOK, an average trawl permit (2.37) to about 450 MNOK; the herring and the snow crab are the least
// certain (a structure quota in the purse seine fleet is said to go for well over 100 MNOK per 100 basistonn)
// (the 2026 prices: havValue moves them with the coast's index, kpkAt / KPK, KM5)
const HPK = {torsk:KPK, hyse:Math.round(KPK * 20 / 42), sei:Math.round(KPK * 20 / 42), sild:Math.round(KPK * 12 / 42), snokrabbe:Math.round(KPK * 115 / 42)};
// ---- the quota price that lives (KM5 of docs/planer/kvotemarkedet.md, steg 64; Jonas 07.11.2026, V4 B: «V4, anbefalt») ----
// The takst per kg of cod quota is KPK (260 kr/kg, 2026) times two things the whole coast sees alike, held within 0.7–1.4 times:
//  - the cod price against the normal for the time of year (marketPrice over seasonal, that is the week's deviation, weekDev in
//    03-simulation.js), against its mean for 2026, smoothed over four game weeks (the mean of the last 28 days, at noon). The season
//    itself is left out (Jonas 12.11.2026: «Uten årstiden»): it comes back every year, and the register sells at the takst and buys back
//    at 90 % with no limit (V3 A), so a takst that swung ±13 % with the season (cod 52.6 kr in January, 39.9 in July) would pay anyone
//    who bought every summer and sold every winter;
//  - the quota outlook, the day it is known (Jonas 12.11.2026: «Trinnet med en gang»; smoothed over four weeks, the price could be seen
//    coming, and in 2027 it rose 22 % in the four weeks after the advice, a sure 10 % against the register's buy-back): from 26 June the
//    advice for next year (the quota advice the Institute of Marine Research publishes then), from 17 October next year's agreed total
//    quota (the Norwegian-Russian commission), against this year's, as the closed group's cod in the quota chain (codChain), so the price
//    leads the quota by the half year the market knows it. On 1 January the year's quota takes the new figure and the outlook goes back
//    to 1, so a right's value (its quota × the price) hardly moves at the new year.
// A pure function of the clock: WORLD_SEED's stock (or the server's, WSH.stock, B4), never anything from the save. The same every hour of a
// calendar day (UTC), in whole kroner. The index is an assumption (no source publishes quota prices; docs/planer/kvotemarkedet.md kap. 7)
// The start (Jonas 12.11.2026: «Glid inn over fire uker»): the price stood at 260 until KM5, and the living one was 303 kr/kg at the
// time it came (October 2027 in the game, the total quota for 2028 above the year's). So it stays 260 up to 15 November 2027 on the shared
// clock (about 18 November 2026 in real time), whenever the release comes before that, and glides from 260 to the living price over four
// game weeks from there. A release after that date gives a part of the jump at once; then move start.
const KPKL = {lo:0.7, hi:1.4, days:28, adv:[6, 26], tac:[10, 17], start:Date.UTC(2027, 10, 15), glide:28};
const kpkLukket = tac => codChain(norQuota('torsk', tac)).lukket;
// the outlook for year y's quota as known at H: 1 before 26 June, and for a day of the year before (the new year's quota is known then)
function kpkOut(H, y){
  if (yearH(H) < y) return 1; const d = doyH(H); if (d < doyOf(y, KPKL.adv[0], KPKL.adv[1])) return 1;
  const N = stockYear('torsk', y + 1, WORLD_SEED);
  return kpkLukket(d < doyOf(y, KPKL.tac[0], KPKL.tac[1]) ? N.adv : N.tac) / kpkLukket(stockYear('torsk', y, WORLD_SEED).tac);
}
const kpkCod = H => 1 + weekDev('torsk', H);   // the cod price against the normal for the time of year
let KPK26 = 0;
// the cod price index of a day against 2026's mean
function kpkCodIx(H){ if (!KPK26){ let s = 0; for (let d = 0; d < 365; d++) s += kpkCod(hOfDoy(2026, d) + 12); KPK26 = s / 365; } return kpkCod(H) / KPK26; }
const KPKC = {st:undefined, v:{}, n:0};
// the quota price at H, kr per kg of cod quota
function kpkAt(H){
  H = H == null ? S.t / 60 : H; const W = typeof WSH !== 'undefined' ? WSH.stock : null;
  if (KPKC.st !== W || KPKC.n > 4000){ KPKC.st = W; KPKC.v = {}; KPKC.n = 0; }   // (a stock from the server changes the outlook)
  const D = Math.floor((EPOCH + H * 36e5) / 864e5); if (KPKC.v[D] != null) return KPKC.v[D];
  const H0 = (D * 864e5 - EPOCH) / 36e5 + 12; let s = 0;
  for (let k = 0; k < KPKL.days; k++) s += kpkCodIx(H0 - 24 * k);
  const m = clamp(s / KPKL.days * kpkOut(H0, yearH(H0)), KPKL.lo, KPKL.hi), w = clamp((D * 864e5 - KPKL.start) / 864e5 / KPKL.glide, 0, 1);
  KPKC.n++; return KPKC.v[D] = Math.round(KPK * (1 - w + w * m));
}
// the permit an ocean vessel type needs (null for a coast boat)
function havLicFor(type){ for (const id in HAVLIC) if (HAVLIC[id].ves.includes(type)) return id; return null; }
// the factor a group's 2026 figures are scaled by in year y, per species
function havF(id, sp, y){
  if (y <= 2026) return 1; const Y = yearQuota(y), ch = Y.chain, R = ch.N - (880 + 7000 + Math.max(3000, 0.009 * ch.N) + 500 + 2543 + 450) - ch.open;
  const tr = R < 130000 ? 0.28 : R > 330000 ? 0.33 : 0.28 + 0.05 * (R - 130000) / 200000;
  if (sp === 'torsk') return id === 'tral' ? R * tr / 32535.29 : R * (1 - tr) * 0.1281 / 10717.12;
  if (sp === 'hyse') return Y.fh; if (sp === 'sei') return Y.fs;
  return HAVF_SP[sp] || 1;
}
// the species whose quota for the coming year is set already (snow crab: 16 594 t for 2027 against 12 336 t for 2026, regjeringen.no);
// a table, not a test on the name, since a species shares its name with a vessel type (vesseltest)
const HAVF_SP = {};   // (snow crab: its rows in SNOREG and the stock since H3a, snoYear)
// a group's quota in tonnes for the year (§ 5 for cod, haddock and saithe; the purse seiners' herring; the snow crab total)
function havGroup(id, y){ const P = HAVLIC[id], o = {}; for (const sp in P.grp26) o[sp] = Math.round(P.grp26[sp] * havF(id, sp, y)); if (id === 'krab') o.snokrabbe = snoYear(y).tac; return o; }
// a permit's vessel quota in kg for the year of H, in the shape licQ gives (haddock and saithe as [maximum, guaranteed], Infinity for
// no vessel quota), and the ocean species by name; a permit is {id, kf (default 1), extra (structure quota, later)}
function havQ(l, H){
  const P = HAVLIC[l.id], y = yearH(H == null ? S.t / 60 : H), kf = P.flat ? 1 : (l.kf || 1) + (l.extra || 0), YQ = P.yq ? P.yq(y) : null,
    kg = sp => YQ && YQ[sp] != null ? Math.round(YQ[sp] * kf * 1000) : P.q26[sp] == null ? (sp in P.q26 ? Infinity : 0) : Math.round(P.q26[sp] * havF(l.id, sp, y) * kf * 1000);
  const o = {torsk:kg('torsk'), hyse:[kg('hyse'), kg('hyse')], sei:[kg('sei'), kg('sei')]};
  for (const sp in P.q26) if (!(sp in o)) o[sp] = kg(sp); return o;
}
// what is wrong with taking a permit for an ocean vessel now: blad B (the participation act § 6 as for the closed group) and an NPC owner left
// in the register; null when it can be taken
function havLicWhy(type){
  const id = havLicFor(type); if (!id) return null; const P = HAVLIC[id];
  if (!bladB()) return [P.no + ' krever blad B i fiskermanntallet. Se Papirer.', 'A ' + P.en.toLowerCase() + ' needs blad B of the fishermen\'s register. See Papers.'];
  if ((npcReg()[id] || 0) <= 0) return ['Registeret har ingen ' + P.no.toLowerCase() + ' igjen å selge.', 'The register has no ' + P.en.toLowerCase() + ' left to sell.'];
  return null;
}
// the permit for sale this week with an ocean vessel: its NPC owner and the quota factors he has (0.6-1.4 times the group's mean)
function havOffer(id, H){ const sl = regSeller(id, H), u = h2(weekOfH(H) * 37 + id.charCodeAt(0) * 11 + id.length, 8400);
  return {id, kf:HAVLIC[id].flat ? 1 : Math.round(HAVKF[id] * (0.6 + 0.8 * u) * 100) / 100, from:sl.name + ', ' + sl.home}; }   // (a flat permit, the snow crab's: every vessel the same quota, J-237-2025 § 3)
// what the permit's quotas are worth this year (HPK, moved with the quota price index as the coast's, kpkAt), kr
function havValue(l, H){ if (l.id === 'krab') return snoLicValue(yearH(H == null ? S.t / 60 : H)).v;
  const Q = havQ(l, H), f = kpkAt(H) / KPK; let v = 0; for (const sp in HPK){ const q = Q[sp], kg = Array.isArray(q) ? q[1] : q; if (kg && kg !== Infinity) v += kg * HPK[sp] * f; } return Math.round(v / 1e5) * 1e5; }
// The snow crab permit at what the fishery bears (V6 B, Jonas 06.11.2026): no price for a permit is found (they were given out by catch
// history, konsesjonsforskriften § 6-2, and follow the vessel when she is sold for further fishing), so it is the earnings before
// depreciation of a mean vessel with the year's quota, times SNOV.yrs. Read (kap. 2b of the plan): the profitability survey 2024, group 014
// «Havgående krabbefartøy» (Fiskeridirektoratet, tab. G 22; 5 vessels of 14): income 52.5 MNOK a vessel, the crew 16.6 (31.5 %), fuel 4.9,
// bait, ice, salt and packing 3.1, provisions 0.54, upkeep 4.3, gear 2.7, the operating result -3.7 MNOK; the group took 9 181 t snow crab
// and 2 000 t shrimp. The other costs are the rest (24.06 MNOK with the depreciation, dep assumed); the costs are put on the snow crab by
// its share of the income (sno, 656 t at 68.90 kr/kg of 52.5 MNOK). The prices of several years (Fiskeridirektoratet's sak 17/2025: frozen
// 68.90 and 130.68, live 63.68 and 82.41 kr/kg round weight in 2024 and 2025; 2026 to week 22 live 71.23 and frozen clusters about 179
// kr/kg product, about 120 round with 1.49, a search snippet), the mean, so the bad 2024 and the good 2025 both count. The crew's share is
// the game's 35 % (§ 20; 31.5-43.6 % of the income 2022-2024). yrs: 7, the present value of ten years' earnings at 7 % (the bank's 6.9 %;
// our choice: the permit is lasting, the stock is not). An estimate without a sale price, as the plan says.
const SNOV = {pF:[68.90, 130.68, 120], pL:[63.68, 82.41, 71.23], crew:0.35, cost:15.54 + 24.06, dep:4, sno:656 * 68.90 / 52500, yrs:7};
function snoLicValue(y){
  const Y = snoYear(y), mean = a => a.reduce((x, v) => x + v, 0) / a.length;
  const inc = (Y.vq * mean(SNOV.pF) + Y.tq * mean(SNOV.pL)) / 1000, cost = (SNOV.cost - SNOV.dep) * SNOV.sno, ebitda = inc * (1 - SNOV.crew) - cost;
  return {inc, cost, ebitda, v:Math.round(Math.max(0, ebitda) * SNOV.yrs * 10) * 1e5};   // (MNOK in, kr out)
}
// the price of an ocean vessel with this week's permit: the hull and the quota
function havPrice(type, H){ const id = havLicFor(type); return (VESSELS[type] || {}).price + (id ? havValue(havOffer(id, H), H) : 0); }
// the permit taken from an NPC owner when an ocean vessel is bought (one NPC ship of her kind leaves the sea, havHeld in 05d-hav.js)
function havLicTake(type, H){
  const id = havLicFor(type); if (!id || havLicWhy(type)) return null; const P = HAVLIC[id], O = havOffer(id, H);
  regTake(id); return {id, hav:true, hl:P.no, kf:O.kf, since:yearH(H), from:O.from};
}
// ---- ling and tusk for vessels of 28 m and over (H2a of docs/planer/havsteget-h2-autoline.md, 05.11.2026). J-128-2026 (2026) and the
// Directorate's proposal for 2027 (reguleringsmøtet 4-5.11.2026, sak 15/2026): the group of 28 m and over (the conventional ocean
// vessels and the closed coastal group) has 3 202 t of ling and 5 516 t of tusk; «inntil 35 % bifangst av lange i de enkelte fangster
// og ved landing» all year (no direct fishery for ling), and «fritt fiske etter brosme» until the group quota is taken, when it is
// stopped (2025: 11 September, 2026: 6 August) and 15 % is allowed as bycatch (J-128-2026 § 6). Each year's stop is drawn between those
// two dates; the rule is checked at the landing (the share of each haul is not followed)
const LBQ = {lange:0.35, brosme:0.15, stop:[[8, 6], [9, 11]], notice:3};
const LBC = {};
function lbStop(y){ const k = y + ':' + (S.qseed || 0); if (LBC[k] != null) return LBC[k];
  const a = doyOf(y, LBQ.stop[0][0], LBQ.stop[0][1]), b = doyOf(y, LBQ.stop[1][0], LBQ.stop[1][1]), u = h2(y * 17 + (S.qseed || 0) % 991, 8811);
  return LBC[k] = hOfDoy(y, Math.round(a + (b - a) * u)); }
// the share of a landing a species may be for a vessel of 28 m and over (1: free)
function lbShare(sp, H){ if (sp === 'lange') return LBQ.lange; if (sp === 'brosme') return H >= lbStop(yearH(H)) ? LBQ.brosme : 1; return 1; }
// Fiskeridirektoratet's notice of the tusk stop, 3 days before (for the vessels of 28 m and over)
function lbNews(H){
  if (!(BOAT.len >= 28)) return; const y = yearH(H), st = lbStop(y), Q = quotaState(); Q.lbTold = Q.lbTold || 0;
  if (!(Q.lbTold & 1) && H >= st - LBQ.notice * 24 && H < st){ Q.lbTold |= 1; msg('Fiskeridirektoratet', 'Fisket etter brosme for fartøy på 28 m og over stoppes ' + dayStr(st) + ', fordi gruppekvoten er tatt. Etter det er inntil 15 % brosme lov som bifangst. Lange er bare lov som bifangst, inntil 35 %, hele året.', 'The tusk fishery for vessels of 28 m and over stops ' + dayStr(st) + ', as the group quota is taken. After that, up to 15 % tusk is allowed as bycatch. Ling is only allowed as bycatch, up to 35 %, all year.'); }
}
// the saithe an ocean permit without gillnet-saithe access may land as bycatch (J-187-2026 § 14: 25 %; 50 % while the gillnet-saithe fishery is open)
const HAVBY = {sei:0.25};
// ---- Greenland halibut (blåkveite) for vessels under 28 m (J-241-2025, the regulation for 2026; docs/blakveite.md 2-3, 07.10.2026) ----
// The direct fishery is one period from 25 May 00:00 until Fiskeridirektoratet stops it when the group quota (5 230 t) is reckoned
// fished, announced 2-3 days before with a time limit for taking up the gear (2026: 30 days, 2025: 97 days; here each year's length is
// drawn between them, more often short). Open group: owner and master on blad B. Maximum quota by the vessel's greatest length (0-13.99 m
// 9.7 t, 14-19.99 m 10.9 t, 20-27.99 m 12.1 t), not transferable; 28 m and over only bycatch, at most 12.1 t. Outside the direct fishery
// at most 7 % Greenland halibut in a week's landings (Monday to Sunday), counted against the maximum quota.
const BKQ = {open:[5, 25], days:[30, 97], notice:3, max:[[14, 9700], [20, 10900], [28, 12100]], over28:12100, by:0.07, group:5230};
const BKC = {};
function bkSeason(y){ const k = y + ':' + (S.qseed || 0); if (BKC[k]) return BKC[k];
  const o = hOfDoy(y, doyOf(y, BKQ.open[0], BKQ.open[1])), u = h2(y * 13 + (S.qseed || 0) % 977, 8800), days = Math.round(BKQ.days[0] + (BKQ.days[1] - BKQ.days[0]) * u * u);
  return BKC[k] = {open:o, stop:o + days * 24, notice:o + (days - BKQ.notice) * 24, days}; }
function bkOpen(H){ const s = bkSeason(yearH(H)); return H >= s.open && H < s.stop; }
// from 2027 the group quota and the maximum quotas follow the total quota (STOCK, against 19 000 t in 2026), to the nearest 100 kg
const bkTacF = y => y <= 2026 ? 1 : stockYear('blakveite', y).tac / STOCK.blakveite.tac[2026];
const bkGroup = y => Math.round(BKQ.group * bkTacF(y));
const bkMax = (len, y) => { const f = bkTacF(y == null ? yearH(S.t / 60) : y); for (const [l, kg] of BKQ.max) if (len < l) return Math.round(kg * f / 100) * 100; return Math.round(BKQ.over28 * f / 100) * 100; };
// the direct fishery for this vessel: open (a landing two days after the stop still counts: the gear had to be ashore by then), blad B, under 28 m
function bkDirect(H, len){ const s = bkSeason(yearH(H)); return H >= s.open && H < s.stop + 48 && bladB() && len < 28; }
// what each vessel has landed this year (kg), and this week's landings for the 7 % rule
function bkState(H){ const y = yearH(H); if (!S.bkq || S.bkq.y !== y) S.bkq = {y, v:{}, wk:-1, wtot:0, wbk:0}; return S.bkq; }
const bkUsed = H => bkState(H).v[S.cur] || 0;
// the Greenland halibut a landing may keep (kg) of bk in the hold, all being the landing's total
function bkAllow(H, bk, all){
  const B = bkState(H), room = Math.max(0, bkMax(BOAT.len, yearH(H)) - bkUsed(H)); if (bkDirect(H, BOAT.len)) return Math.min(bk, room);
  const wk = weekOfH(H), wtot = B.wk === wk ? B.wtot : 0, wbk = B.wk === wk ? B.wbk : 0;
  return Math.min(bk, room, Math.max(0, BKQ.by * (wtot + all) - wbk));
}
function bkLanded(H, bk, all){ const B = bkState(H), wk = weekOfH(H); if (B.wk !== wk){ B.wk = wk; B.wtot = 0; B.wbk = 0; } B.wtot += all; B.wbk += bk; B.v[S.cur] = (B.v[S.cur] || 0) + bk; }
// the announcements: the opening on the day, the stop 3 days before (Kystposten and a message from Fiskeridirektoratet)
function bkNews(H){
  const y = yearH(H), s = bkSeason(y), B = bkState(H); B.told = B.told || 0;
  if (!(B.told & 1) && H >= s.open && H < s.stop){ B.told |= 1; msg('Fiskeridirektoratet', 'Direktefisket etter blåkveite er åpnet for fartøy under 28 m. Maksimalkvoten er ' + fmt(bkMax(BOAT.len, y) / 1000, 1) + ' tonn for din båt. Fisket stoppes når gruppekvoten er tatt.', 'The direct fishery for Greenland halibut is open for vessels under 28 m. The maximum quota is ' + fmt(bkMax(BOAT.len, y) / 1000, 1) + ' tonnes for your boat. It is stopped when the group quota is taken.'); }
  if (!(B.told & 2) && H >= s.notice && H < s.stop){ B.told |= 2; msg('Fiskeridirektoratet', 'Direktefisket etter blåkveite stoppes ' + dayStr(s.stop) + '. Redskapen skal være på land innen da.', 'The direct fishery for Greenland halibut stops ' + dayStr(s.stop) + '. The gear must be ashore by then.'); }
}

// ---- cod south of 62° N (Ø10c, steg 68, 11.11.2026; docs/systemer/kvoter-og-regler.md 5.28e). Forskrift 19. desember 2025 nr. 2805 om
// regulering av fisket etter torsk i Nordsjøen og Skagerrak i 2026, read word for word in J-160-2026 at fiskeridir.no («Forskriften lyder
// etter dette», in force from 1 October 2026). § 1: «Det er forbudt for norske fartøy å fiske og lande torsk» in the North Sea («Norges
// territorialfarvann og økonomiske sone sør for 62° N avgrenset mot øst av en rett linje gjennom Hanstholmen fyr og Lindesnes fyr») and
// in the Skagerrak outside the baseline. § 4 second paragraph: «Fartøy med adgang til å delta i åpen gruppe i fisket etter torsk for
// fartøy med mindre enn 500m³ lasteromvolum som fisker med konvensjonelle redskap i Nordsjøen, kan maksimalt fiske og lande følgende
// kvanta torsk i Nordsjøen»: 2 tonnes guaranteed and 3 tonnes maximum, the same for all three lengths. § 4 last paragraph: the jig
// under 11 m on blad B in the Skagerrak, 1 April – 30 June, «maksimalt fiske og lande 3 tonn torsk». § 5: «inntil 15 % bifangst av torsk
// i de enkelte fangster og ved landing» with conventional gear other than seine in the North Sea, 5 % in the Skagerrak, and «Når det
// direkte fisket etter torsk er stoppet eller når det enkelte fartøy har fisket sin maksimalkvote, kan fartøy med adgang til å delta i et
// direkte fiske etter torsk i Nordsjøen ha bifangst av torsk i fisket etter andre arter etter bestemmelsene i § 5». § 2: «Alle kvanta i
// forskriften angis i rund vekt.»
// The game has no closed group south of 62° N, so the player is counted in the open group there (a right north of 62° N is not one in
// the North Sea). Who is in it is deltakerforskriften's (J-66-2026, read at fiskeridir.no 11.11.2026) § 16: «Når vilkårene for deltakelse
// i lukket gruppe ikke er oppfylt, kan fartøy som oppfyller følgende vilkår delta i åpen gruppe»: registered and under 500 m³ (no length
// limit, unlike north of 62° N), «eier av fartøyet og høvedsmann må være ført i fiskermanntallet» (the player is, as in the open group
// north of 62° N), and «under utøvelse av fangst må eier selv være høvedsmann om bord i fartøyet» (S.tripOwner); and § 6: «Hvis eier av
// fartøy som deltar i åpen gruppe eier 50 % eller mer i annet fartøy, kan ikke sistnevnte fartøy delta i åpen gruppe i samme fiskeri»,
// so one vessel an owner: the first of the fleet to land cod on the cap in a year has it for that year (sorAcc). A vessel outside it
// has the bycatch only. The caps are counted where the quotas north of 62° N are (quotaState(): q.nsjo and q.skag4, kg round weight landed on the cap
// this year), from what the hold knows was taken in each zone (S.boat.byc, 05-vessels.js bycAdd, by 03e-rules.js ruByc).
// The open group's fishing is not stopped in the game, because it was not in 2026: the group quota was not taken, and Fiskeridirektoratet
// raised the closed group's maximum quotas three times instead (6 tonnes for the smallest in J-113-2026 of 26 June, 10 in J-135-2026 of
// 27 August, 12.5 in J-160-2026 of 1 October), and no J-melding stops the fishery (the list for south of 62° N read 11.11.2026). So the
// 3 tonnes hold all year, and the guaranteed 2 are said and never the limit. The bycatch share is taken of what was caught in the
// zone, as in the Skagerrak (5.28d).
// 'sorfri' is the cod taken inside the baseline east of the line (the coast of Sørlandet outside the Oslo fjord): § 1 names the North
// Sea and the Skagerrak «utenfor den norske grunnlinjen» only, and the quotas of J-187-2026 are for north of 62° N, so no quota holds
// there. It is counted so the landing keeps it off the quota north of 62° N, and nothing of it is taken
const SORQ = {
  nsjo:{max:3000, guar:2000, by:0.15, open:true, ref:'FOR-2025-12-19-2805 §§ 4 og 5', url:'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-160-2026'},
  skag4:{max:3000, by:0.05, ref:'FOR-2025-12-19-2805 §§ 4 og 5', url:'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-160-2026'},
  sorfri:{max:Infinity, by:1}};
// the vessel's place in the open group in the North Sea (deltakerforskriften § 16 d and § 6, above): 'open' or 'none'
function sorOpenId(){ const y = yearH(S.t / 60); for (const v of S.fleet || []){ const q = vget(v, 'quota'); if (q && q.y === y && q.nsjo > 0) return v.id; } return null; }
function sorAcc(){ if (S.tripOwner === false) return 'none'; const id = sorOpenId(); return id == null || id === S.cur ? 'open' : 'none'; }
// the cod aboard that was taken south of 62° N where it is counted (the caps, the free cod, the Skagerrak bycatch): not on the quota
// north of 62° N. Never more than the cod in the hold
function sorCodAboard(){ const c = (S.boat && S.boat.byc) || {}; let n = 0; for (const k in c) n += c[k].cod || 0;
  return Math.min(n, (S.hold || []).reduce((a, x) => a + (x.sp === 'torsk' ? x.kg : 0), 0)); }
// what is left of a cap for the vessel, kg round weight: q the year's count (quotaState()), acc her place in the open group (sorAcc())
function sorRoom(k, q, acc){ const Q = SORQ[k]; if (!Q || (Q.open && acc === 'none')) return 0; return Math.max(0, Q.max - ((q && q[k]) || 0)); }
// … and with the cod aboard from the zone taken off (the vessel now: what she may still catch on the cap)
function sorLeft(k){ let q = null, acc = 'open'; try { q = quotaState(); acc = sorAcc(); } catch (e){}
  const c = S.boat && S.boat.byc && S.boat.byc[k]; return Math.max(0, sorRoom(k, q, acc) - ((c && c.cod) || 0)); }
// what a landing does with the cod counted in the zones with a cap. byc: the hold's count ({nsjo:{kg, cod}, skag4:{kg, cod}}, round
// weight as caught), codHold: the cod aboard that is not already taken as bycatch elsewhere (kg as it lies, so gutted cod weighs less
// than it was counted). Per zone: the cod goes on the cap while there is room, what is over may be a bycatch of the catch from the
// zone (15 % or 5 %), and the rest is confiscated. Returns cod (the hold's kg these zones answer for), ok (round kg onto each cap),
// by (hold kg confiscated per zone) and kg (their sum). Pure
function sorConf(byc, codHold, q, acc){
  const out = {cod:0, kg:0, ok:{}, by:{}}; if (!byc) return out;
  const ks = Object.keys(SORQ).filter(k => byc[k] && byc[k].cod > 0), round = ks.reduce((a, k) => a + byc[k].cod, 0); if (!(round > 0)) return out;
  const s = Math.min(1, Math.max(0, codHold) / round);   // hold kg per counted kg
  for (const k of ks){ const c = byc[k], ok = Math.min(c.cod, sorRoom(k, q, acc)), conf = Math.max(0, c.cod - ok - SORQ[k].by * (c.kg || 0));
    out.cod += c.cod * s; if (ok > 0) out.ok[k] = ok; if (conf > 0.001){ out.by[k] = conf * s; out.kg += conf * s; } }
  return out;
}
// the landing is done: the cod that went on the caps is counted for the year
function sorLanded(q, ok){ for (const k in (ok || {})) q[k] = (q[k] || 0) + ok[k]; }
