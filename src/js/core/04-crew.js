// ================= crew: people with skills, habits and moods =================
// Candidates follow the 2025 fisher register: age groups, 6 % women, 11 % with fishing as a side occupation. Troms has only
// 963 full-time fishers, so hands are scarce, scarcest in the skrei season when every boat wants crew.
const CREW_M = ['Ole Martin', 'Stian', 'Tor Arne', 'Mats', 'Eirik', 'Sondre', 'Håkon', 'Vegard', 'Kjell', 'Rune', 'Geir', 'Arild', 'Svein Erik', 'Jørgen', 'Andreas', 'Kristian', 'Tommy', 'Roger', 'Frode', 'Bjørnar', 'Ronny', 'Jan Erik', 'Terje', 'Odd Inge', 'Magnus', 'Henrik', 'Sindre', 'Espen', 'Trond', 'Leif'];
const CREW_F = ['Kari', 'Ingrid', 'Siri', 'Hanne', 'Marit', 'Tone', 'Line', 'Silje', 'Ida', 'Hege', 'Marte', 'Randi'];
const CREW_SN = ['Hansen', 'Johansen', 'Olsen', 'Pedersen', 'Karlsen', 'Nilsen', 'Jakobsen', 'Andreassen', 'Berg', 'Eriksen', 'Mikalsen', 'Pettersen', 'Nordvik', 'Hamnvik', 'Strand', 'Isaksen', 'Bakke', 'Mathisen'];
const CREW_HOME = [['Husøy', 'husoy'], ['Gryllefjord', 'gryllefjord'], ['Senjahopen', 'senjahopen'], ['Botnhamn', 'botnhamn'], ['Finnsnes', 'finnsnes'], ['Torsken', 'torsken'], ['Skaland', null], ['Mefjordvær', null], ['Silsand', null], ['Sørreisa', null], ['Tromsø', null], ['Harstad', null], ['Andenes', null]];
// where a new hand is from: the places round your home harbour, anywhere on the coast (Senja's list where the game began)
function crewHome(){
  const hp = portById(S.home || HOME0), f = portById('finnsnes'), near = hp && typeof plantsNear === 'function' ? plantsNear(hp.p, 8) : [];
  if (hp && f && dist(hp.p, f.p) > 60 && near.length){ const x = near[Math.floor(Math.random() * near.length)].pt; return [x.name, x.id]; }
  return CREW_HOME[Math.floor(Math.random() * CREW_HOME.length)];
}
const ATTR = [['erf', 'Erfaring', 'Experience'], ['styrke', 'Styrke', 'Strength'], ['uth', 'Utholdenhet', 'Stamina'], ['tek', 'Teknisk', 'Technical'], ['kokk', 'Kokk', 'Cook'], ['sjo', 'Sjømannskap', 'Seamanship']];
const GEARS = [['juksa', 'Juksa', 'Jig'], ['line', 'Line', 'Longline'], ['garn', 'Garn', 'Nets'], ['teiner', 'Teiner', 'Pots']];
const TRAITS = {
  arbeidsjern:{no:'Arbeidsjern', en:'Workhorse', w:1.2, d:{no:'Jobber hardt og lenge, men blir irritert på folk som tar det med ro.', en:'Works hard and long, but gets annoyed by those who take it easy.'}},
  kranglefant:{no:'Kranglefant', en:'Quarrelsome', w:0.9, d:{no:'Sterk og dyktig, men lager lett splid om bord.', en:'Strong and able, but easily causes friction aboard.'}},
  spokefugl:{no:'Spøkefugl', en:'Joker', w:1, d:{no:'Holder humøret oppe og demper krangler.', en:'Keeps spirits up and calms quarrels.'}},
  grinebiter:{no:'Grinebiter', en:'Grump', w:0.9, d:{no:'Pålitelig og slutter sjelden, men sur, og trekker stemningen ned.', en:'Reliable and rarely quits, but sour, and drags the mood down.'}},
  perfeksjonist:{no:'Perfeksjonist', en:'Perfectionist', w:0.8, d:{no:'Behandler fisken perfekt, men jobber litt saktere.', en:'Handles the fish perfectly, but works a little slower.'}},
  lokalkjent:{no:'Lokalkjent', en:'Local knowledge', w:1, d:{no:'Kjenner feltene rundt hjemstedet og får mer fisk der.', en:'Knows the grounds around home and catches more there.'}},
  sjosyk:{no:'Sjøsyk', en:'Seasick', w:0.7, d:{no:'Blir dårlig i grov sjø og gjør lite da.', en:'Gets sick in rough seas and does little then.'}},
  olglad:{no:'Ølglad', en:'Likes a pint', w:0.9, d:{no:'Trives på puben, men morgenen etter går det tregt.', en:'Loves the pub, but the morning after is slow.'}},
  laerevillig:{no:'Lærevillig', en:'Eager learner', w:1, d:{no:'Blir fort flinkere med fartstid.', en:'Improves quickly with time at sea.'}},
  rastlos:{no:'Rastløs', en:'Restless', w:0.8, d:{no:'Mister fort motet når det går dårlig, og slutter lettere.', en:'Loses heart quickly when things go badly, and quits more easily.'}},
  makelig:{no:'Makelig', en:'Easy-going', w:0.9, d:{no:'Rolig og grei, men tar det med ro på dekk.', en:'Calm and pleasant, but takes it easy on deck.'}},
  omsorgsfull:{no:'Omsorgsfull', en:'Caring', w:0.8, d:{no:'Passer på de andre og skaper god stemning.', en:'Looks after the others and builds a good atmosphere.'}},
  stolt:{no:'Stolt', en:'Proud', w:0.8, d:{no:'Dyktig, men tåler dårlig å bli overkjørt.', en:'Able, but does not take being overruled well.'}}
};
function pickW(pairs){ let r = Math.random() * pairs.reduce((a, q) => a + q[1], 0); for (const q of pairs){ r -= q[1]; if (r <= 0) return q[0]; } return pairs[0][0]; }
function crewAge(){ const b = pickW([[0, 4.3], [1, 19.4], [2, 19.5], [3, 16.7], [4, 20.1], [5, 16.1], [6, 3.9]]), lo = [16, 20, 30, 40, 50, 60, 70][b], hi = [19, 29, 39, 49, 59, 69, 74][b]; return lo + Math.floor(Math.random() * (hi - lo + 1)); }
const r15 = x => clamp(Math.round(x * 2) / 2, 1, 5);
function skreiSeason(H){ const m = gDate(H).getUTCMonth(); return m <= 3; }
function crewDerive(c){ const lvl = c.attr.erf >= 4 ? 2 : c.attr.erf >= 2.5 ? 1 : 0; c.lv = ['lærling', 'erfaren', 'dreven'][lvl]; c.lvEn = ['apprentice', 'experienced', 'seasoned'][lvl]; c.skill = clamp(0.6 + 0.1 * c.attr.erf + 0.04 * c.attr.sjo, 0.7, 1.3); return c; }
function genCrew(){
  const f = Math.random() < 0.06, age = crewAge(), yrs = Math.max(0, Math.round((age - 16) * (0.25 + Math.random() * 0.75))), home = crewHome();
  const ex = 1 + 4 * (1 - Math.exp(-yrs / 9)), peak = 1 - Math.abs(age - 34) / 45, rnd = () => Math.random() - 0.5;
  const attr = {erf:r15(ex + rnd()), styrke:r15(2 + 3 * peak + rnd() * 1.5), uth:r15(1.8 + 2.6 * peak + rnd() * 1.6), tek:r15(1 + Math.random() * 3.2 + (Math.random() < 0.15 ? 1.2 : 0)), kokk:r15(1 + Math.random() * 3 + (Math.random() < 0.12 ? 1.5 : 0)), sjo:r15(ex * 0.8 + Math.random())};
  const gear = {juksa:r15(1.5 + ex * 0.7 * Math.random() + 0.5), line:r15(1 + (yrs > 10 ? ex * 0.7 : ex * 0.3) * Math.random() + 0.3), garn:r15(1 + ex * 0.6 * Math.random()), teiner:r15(1 + ex * 0.5 * Math.random()), ...deckSkills(ex)};
  const tw = () => Object.entries(TRAITS).map(([k, T]) => [k, T.w * (k === 'laerevillig' && age < 30 ? 2 : k === 'grinebiter' && age > 50 ? 1.8 : 1)]);
  const traits = [pickW(tw())]; if (Math.random() < 0.55){ let t2 = traits[0]; for (let i = 0; i < 8 && t2 === traits[0]; i++) t2 = pickW(tw()); if (t2 !== traits[0]) traits.push(t2); }
  if (traits.includes('kranglefant')) attr.styrke = Math.min(5, attr.styrke + 1);
  const bi = Math.random() < 0.108, nm = (f ? CREW_F : CREW_M)[Math.floor(Math.random() * (f ? CREW_F : CREW_M).length)] + ' ' + CREW_SN[Math.floor(Math.random() * CREW_SN.length)];
  // what they ask, in shares (lott, Økonomi 2): an apprentice the agreement's 40, 60 or 75 % of a share by his years (§ 24.4), a hand a whole
  // share, a tenth more for a workhorse or when every boat wants hands in the skrei season
  const ask = attr.erf < 2.5 ? LOTT.appr[Math.min(LOTT.appr.length - 1, Math.floor(yrs))] : lotR(LOTT.hand + (traits.includes('arbeidsjern') ? 0.1 : 0) + (skreiSeason(S.t / 60) ? 0.1 : 0));
  return crewDerive({id:'k' + Math.random().toString(36).slice(2, 9), name:nm, sex:f ? 'f' : 'm', age, home:home[0], homePort:home[1], yrs, attr, gear, traits, known:[true, traits.length < 2], bi, biDays:bi ? [0, 0, 0, 0, 1, 1, 1] : null, ask, share:ask, morale:62, fatigue:10, seaH:0, grudge:{}, earn:[], hiredT:S.t});
}
// the deck skills: gutting, icing and crab sorting grow with the years on deck
function deckSkills(ex){ return {sloy:r15(1.2 + ex * 0.6 * Math.random() + 0.3), is:r15(1.3 + ex * 0.5 * Math.random()), sort:r15(1 + ex * 0.4 * Math.random())}; }
// crew from before this system get skills that match their level; crew from before the deck skills get those
function crewUpgrade(c){ lotMigrate(c); if (c.attr){ if (c.gear && c.gear.sloy == null) Object.assign(c.gear, deckSkills(c.attr.erf)); return c; } const g = genCrew(), e = c.lv === 'dreven' ? 4.5 : c.lv === 'erfaren' ? 3 : 1.5; return crewDerive(Object.assign(g, {id:c.id, name:c.name, sex:c.sex || (CREW_F.includes(String(c.name).split(' ')[0]) ? 'f' : 'm'), age:c.age || g.age, share:c.share, ask:c.share, bi:false, biDays:null, known:[true, true], attr:Object.assign(g.attr, {erf:e, sjo:r15(e * 0.9)})})); }
// ---- the share system of the coastal fleet (Økonomi 2, Ø2, 27.10.2026; docs/planer/okonomi/02-design.md) ----
// After «Fiskerioverenskomst og oppgjørsavtaler mellom Mannskapsseksjonen og Båteierseksjonen i Norges Fiskarlag», in force from
// 1.1.2025 (the copy Jonas found, 27.10.2026). The gross catch less the expenses of § 8 B (the levies; fuel, ice, bait, harbour dues,
// baiting, the jig's gear; for nets, lines and pots the gear lost: the oppgjørsavtaler §§ 1, 3, 19) is the shared catch (delingsfangst);
// VAT stays outside (§ 8 E). The crew's percentage of it is in the oppgjørsavtaler, by the fishery, the vessel's length in feet and the
// men aboard (the jig's by the jigging machines in use, § 18); everyone aboard counts, you too, an apprentice as half a man (§ 24.3). The
// tables also weigh the hold in m³; here the length alone is used. A man whose number is not in the table takes the nearest row
// (the oppgjørsavtaler, introduction). The crew's part is split in shares: a hand 1, an apprentice 40 %, 60 % and 75 % of a share in his
// first, second and third year (§ 24.4); you aboard have one share, which stays in the cash box with the boat's part (no private economy,
// Jonas 27.10.2026). The skipper while you are ashore has an extra share paid by the company (§ 22 a: 1/6 of a share at 10-15 m,
// 1/3 at 15-24 m, 1/2 from 24 m; the game gives 1/6 under 10 m too), and a mate on a round-the-clock plan the mate's wage (§ 22 a:
// 408 kr a day under 24 m, 500 from 24 m, the company's). The day wage for everyone (hyre, E3 04.10.2026) is gone: the share is the rule.
// A table row is [from men, to men, first column, the percentages ...].
const OPPG = {
  // § 18 juksa og dorgefiske: by the jigging machines in use, the feet
  juksa:{ref:'§ 18', by:'mask', b:[30, 35, 40, 50, 60, 70, 80, 90, 100, Infinity], r:[
    [0, 0, 0, 74.5, 70.5, 68.5, 66.5, 65.5, 64.5, 63.5, 62.5, 61.5, 60.5], [1, 1, 0, 72.5, 68.5, 66.5, 64.5, 63.5, 62.5, 61.5, 60.5, 59.5, 58.5],
    [2, 2, 0, 70.5, 66.5, 64.5, 62.5, 61.5, 60.5, 59.5, 58.5, 57.5, 56.5], [3, 3, 0, 69.5, 65.5, 63.5, 61.5, 60.5, 59.5, 58.5, 57.5, 56.5, 55.5],
    [4, 4, 0, 68.5, 64.5, 62.5, 60.5, 59.5, 58.5, 57.5, 56.5, 55.5, 54.5], [5, 5, 0, 67.5, 63.5, 60.5, 59.5, 58.5, 57.5, 56.5, 55.5, 54.5, 53.5],
    [6, 6, 1, 62.5, 58.5, 57.5, 56.5, 55.5, 54.5, 53.5, 52.5, 51.5], [7, 7, 1, 61.5, 56.5, 55.5, 54.5, 53.5, 52.5, 51.5, 50.5, 49.5],
    [8, 8, 2, 54.5, 53.5, 52.5, 51.5, 50.5, 49.5, 48.5, 47.5], [9, 9, 2, 52.5, 51.5, 50.5, 49.5, 48.5, 47.5, 46.5, 45.5], [10, 10, 2, 50.5, 49.5, 48.5, 47.5, 46.5, 45.5, 44.5, 43.5]]},
  // § 1 garnfiske etter bunnfisk samt teinefiske etter krabbe (+3 % for the crab pots, § 1 c)
  garn:{ref:'§ 1', b:[30, 35, 40, 45, 50, 55, 60, 65, 75, 90, 110, 120, 135, 150, Infinity], r:[
    [2, 2, 0, 59.5, 55, 50, 47.5, 45.5, 43.5, 41.5, 40.5, 39.5], [3, 3, 0, 60.5, 56, 51, 48.5, 46.5, 44.5, 42.5, 41.5, 40.5, 37.5],
    [4, 4, 2, 52, 49.5, 47.5, 45.5, 43.5, 42.5, 41.5, 38.5, 37.5], [5, 5, 3, 51.5, 49.5, 46.5, 44.5, 43.5, 42.5, 39.5, 38.5, 37.5],
    [6, 6, 3, 52.5, 50.5, 48.5, 46.5, 45.5, 43.5, 40.5, 39.5, 38.5, 37.5, 36.5, 35.5], [7, 7, 5, 50.5, 48.5, 47.5, 45.5, 41.5, 40.5, 39.5, 38.5, 37.5, 36.5],
    [8, 8, 8, 47.5, 42.5, 41.5, 40.5, 39.5, 38.3, 37.5], [9, 9, 9, 43.5, 42.5, 41.5, 40.5, 39.5, 38.5], [10, 10, 10, 43.5, 42.5, 41.5, 40.5, 39.5],
    [11, 11, 10, 44.5, 43.5, 42.5, 41.5, 40.5], [12, 12, 10, 45.5, 44.5, 43.5, 42.5, 41.5], [13, 13, 10, 46.5, 45.5, 44.5, 43.5, 42.5],
    [14, 15, 10, 47.5, 46.5, 45.5, 44.5, 43.5], [16, 17, 10, 48.5, 47.5, 46.5, 45.5, 44.5], [18, 19, 10, 49.5, 48.5, 47.5, 46.5, 45.5], [20, 21, 10, 50.5, 49.5, 48.5, 47.5, 46.5]]},
  // § 3 linefiske med haling, egnet i land
  line:{ref:'§ 3', b:[35, 40, 45, 50, 55, 60, 65, 70, 75, 80, Infinity], r:[
    [2, 2, 0, 60, 58, 56.5, 53.5, 52.5, 50.5, 48.5, 46.5], [3, 3, 0, 61, 59, 57.5, 54.5, 53.5, 51.5, 49.5, 47.5, 46.5],
    [4, 4, 1, 60, 58.5, 55.5, 54.5, 52.5, 50.5, 48.5, 47.5, 45.5, 44.5], [5, 5, 2, 60.5, 57.5, 55.5, 53.5, 51.5, 49.5, 48.5, 46.5, 45.5],
    [6, 6, 2, 61.5, 58.5, 56.5, 54.5, 52.5, 50.5, 49.5, 47.5, 46.5], [7, 7, 4, 57.5, 55.5, 53.5, 51.5, 50.5, 48.5, 47.5], [8, 8, 8, 51.5, 49.5, 48.5]]},
  // § 6 konvensjonell havfiskeflåte over 28 meter, autoline, garn og snurrevad: by the length in metres
  hav:{ref:'§ 6', m:true, b:[28, 35, 39, 44, 49, 54, 59, 62, Infinity], r:[
    [4, 4, 0, 41.5], [5, 5, 0, 42.5, 41.5], [6, 6, 0, 43.5, 42.5, 41.5, 40.5, 39.5], [7, 7, 0, 44.5, 43.5, 42.5, 41.5, 40.5], [8, 8, 0, 45.5, 44.5, 43.5, 42.5, 41.5],
    [9, 9, 0, 46.5, 45.5, 44.5, 43.5, 42.5], [10, 10, 0, 47.5, 46.5, 45.5, 44.5, 43.5], [11, 11, 0, 48.5, 47.5, 46.5, 45.5, 44.5], [12, 12, 0, 49.5, 48.5, 47.5, 46.5, 45.5],
    [13, 13, 0, 50.5, 49.5, 48.5, 47.5, 46.5, 45, 44, 43, 42], [14, 15, 0, 51.5, 50.5, 49.5, 48.5, 47.5, 46, 45, 44, 43], [16, 17, 0, 52.5, 51.5, 50.5, 49.5, 48.5, 47, 46, 45, 44],
    [18, 19, 0, 53.5, 52.5, 51.5, 50.5, 49.5, 48, 47, 46, 45], [20, 21, 0, 54.5, 53.5, 52.5, 51.5, 50.5, 49, 48, 47, 46], [22, 99, 0, 55.5, 54.5, 53.5, 52.5, 51.5, 50, 49, 48, 47]]},
  // § 20 snøkrabbe: 35 %
  snokrabbe:{ref:'§ 20', flat:35}
};
const LOTT = {appr:[0.4, 0.6, 0.75], hand:1, step:0.1, min:0.5, max:1.5, half:0.5, ft:3.2808, crabAdd:3, hav:28,
  skip:[[10, 1 / 6], [15, 1 / 6], [24, 1 / 3], [Infinity, 1 / 2]], mate:[[24, 408], [Infinity, 500]]};
const lotR = v => clamp(Math.round(v * 20) / 20, LOTT.min, LOTT.max);
const lotS = v => fmt(v, Math.round(v * 100) % 10 ? 2 : Math.round(v * 10) % 10 ? 1 : 0) + (S.lang === 'no' ? ' lott' : (Math.abs(v - 1) < 1e-9 ? ' share' : ' shares'));
// an apprentice (by his experience) is paid by his years at sea (§ 24.4); everyone else by his share
const isAppr = c => c.lv === 'lærling';
const apprLot = c => LOTT.appr[Math.min(LOTT.appr.length - 1, Math.max(0, Math.floor(c.yrs || 0)))];
const lotOf = c => isAppr(c) ? apprLot(c) : c.share;
// a crew member from before the shares: a percentage of the catch (0.07-0.20) becomes the nearest quarter share (15 % was a hand's whole
// share), and one on a day wage goes over to a share
function lotMigrate(c){
  if (!c) return c;
  const q4 = v => lotR(Math.round(v / 0.15 * 4) / 4);
  if (c.share != null && c.share < 0.45) c.share = q4(c.share);
  if (c.ask != null && c.ask < 0.45) c.ask = q4(c.ask);
  if (c.share == null) c.share = c.ask != null ? c.ask : LOTT.hand;
  if (c.pay === 'hyre'){ delete c.pay; delete c.hyre; if (typeof log === 'function') log(c.name + ' går over fra hyre til lott: ' + lotS(c.share) + '.', c.name + ' moves from a wage to a share: ' + lotS(c.share) + '.'); }
  return c;
}
// the table's percentage for n men (a half for an apprentice: the mean of the rows on either side, § 24.3) at length len (m)
function oppgPct(T, n, len){
  if (T.flat != null) return T.flat;
  const x = T.m ? len : len * LOTT.ft; let col = T.b.findIndex(b => x < b); if (col < 0) col = T.b.length - 1;
  const at = (row, c0) => row[2] <= c0 && c0 < row[2] + row.length - 3 ? row[3 + c0 - row[2]] : null;
  const one = k => { // the row for k men, else the nearest row this column has (and the nearest column when the length has none)
    for (let d = 0; d < T.b.length; d++) for (const c0 of [col - d, col + d]){ if (c0 < 0 || c0 >= T.b.length) continue;
      const R = T.r.map(r => ({r, v:at(r, c0), dn:k < r[0] ? r[0] - k : k > r[1] ? k - r[1] : 0})).filter(q => q.v != null).sort((a, b) => a.dn - b.dn);
      if (R.length) return R[0].v; }
    return 50; };
  const lo = Math.floor(n), hi = Math.ceil(n); return lo === hi ? one(lo) : (one(lo) + one(hi)) / 2;
}
// the fishery the trip is settled by: the gear used last on it (§ 8 A: «det siste fisket det har deltatt i»), else the jig
function lottFishery(b = S.boat){ const G = b.tripGear || {}, ks = Object.keys(G).sort((x, y) => (G[y] || 0) - (G[x] || 0)), g = ks[0] || 'juksa', len = BOAT.len || 0;
  if (g === 'teine') return len >= LOTT.hav ? 'snokrabbe' : 'teine'; if ((g === 'line' || g === 'garn') && len >= LOTT.hav) return 'hav'; return OPPG[g] ? g : 'juksa'; }
// the crew's percentage of the shared catch: the fishery's table, by the men aboard (or the jigging machines), the length
function lottM(n, len, fishery = 'juksa'){
  if (n <= 0) return 0;
  if (fishery === 'juksa') return oppgPct(OPPG.juksa, Math.min(10, (S.equip && S.equip.jukse) || 0), len) / 100;
  if (fishery === 'teine') return (oppgPct(OPPG.garn, Math.max(2, n), len) + LOTT.crabAdd) / 100;
  return oppgPct(OPPG[fishery] || OPPG.garn, Math.max(2, n), len) / 100;
}
const skipExtra = len => LOTT.skip.find(x => len < x[0])[1];
const mateWage = len => LOTT.mate.find(x => len < x[0])[1];
// the trip's common costs (§ 8 B), counted where they come: the litres burnt (fuelUse), the ice on the fish (deckMinute), the bait set
// (startSet), the baiting at the shed (egnOrder), the harbour dues (havnMinute), the jig's gear bought (careBuy, shopBuy) and the gear lost
// (gearHour); priced at the tank's average price, the plant's ice price and what was paid. A new trip starts at each landing.
function tripOf(b = S.boat){ return b.trip || (b.trip = {t0:S.t, fuelL:0, iceKg:0, baitKr:0}); }
function tripAdd(b, k, kr0){ if (!b || !(kr0 > 0)) return; const T = tripOf(b); T[k] = (T[k] || 0) + kr0; }
function tripCost(b = S.boat){ const T = tripOf(b), fuelKr = Math.round(T.fuelL * (b.fuelKrL || fuelPrice())), iceKr = Math.round(T.iceKg * PRICE.ice), baitKr = Math.round((T.baitKr || 0) + (T.egnKr || 0)),
  havnKr = Math.round(T.havnKr || 0), gearKr = Math.round((T.jigKr || 0) + (T.lostKr || 0));
  return {fuelL:T.fuelL, fuelKr, iceKg:T.iceKg, iceKr, baitKr, havnKr, gearKr, sum:fuelKr + iceKr + baitKr + havnKr + gearKr}; }
// ---- the trip's line on the landing note and in the deck log (Ø8b S2, V2 A and V4 A in docs/planer/spillbarhet-fangst.md, Jonas
// 06.11.2026): how the trip went and why, from the sums fish() and finishHaul keep in the trip (T.j for the jig, T.g for the hauls).
// Only what the model reckons is said, and of the steps only those that took or gave at least TRIPL.min of the fish.
// tight and thin: what the fish stood to against a fair hour for the rig (HEATG.fair.jig), past which the line says the fish stood dense or thin
const TRIPL = {min:0.1, minM:15, tight:3, thin:0.4};
// the sums made into shares: the jig's kilos an hour, what the fish stood to an hour (p0, before the fishing down, the weather, the cold
// and the wear), a fair hour for the rig (HEATG.fair.jig per hand jig's effort), and each step's share of p0 (they add up to
// 1 − pJ/p0, the whole loss); the luck as what it gave on top of what was left. The hauls: kilos against fair hauls for the soak
function tripSum(T){
  if (!T || T.tut) return null;
  const J = T.j, G = T.g, W = {};
  if (J && J.m >= TRIPL.minM && J.p0 > 0){
    const h = J.m / 60, kg = Math.max(0, J.kg - (J.top || 0)), P = J.p0;
    W.j = {h, kg, kgph:kg / h, pot:P / h, fair:HEATG.fair.jig * J.fe / J.m, mk:J.mk || 0, hs:J.hs / J.m, w:J.w / J.m,
      sh:{stock:(P - J.pS) / P, sea:(J.pS - J.pW) / P, cold:(J.pW - J.pC) / P, pilk:(J.pC - J.pJ) / P}, pen:1 - J.pJ / P, luck:J.pJ > 0 ? J.pL / J.pJ - 1 : 0};
  }
  if (G && G.n > 0 && G.fair > 0) W.g = {n:G.n, kg:G.kg, fair:G.fair, stock:G.r0 > 0 ? Math.max(0, 1 - G.rL / G.r0) : 0, luck:G.rL > 0 ? G.r / G.rL - 1 : 0, kinds:Object.keys(G.k || {})};
  return W.j || W.g ? W : null;
}
// the line itself, [Norwegian, English]: «Turen ga 38 kg i timen med håndjuksa. Fisken sto til rundt 50: sjøen (1,4 m) tok 20 %, kulda 12 %.»
function tripWhy(W){
  if (!W) return null;
  const nf = (v, d, no) => { const x = (Math.round(v * 10 ** d) / 10 ** d).toFixed(d); return no ? x.replace('.', ',') : x; };
  const kgS = (v, no) => v >= 1 ? nf(v >= 10 ? v : Math.round(v), 0, no) : (no ? 'under 1' : 'under 1');
  const about = v => v >= 20 ? Math.round(v / 5) * 5 : Math.round(v);   // «rundt 50»: the model's number, not a weighing
  const pc = v => Math.round(v * 100);
  const no = [], en = [], lk = Math.max(W.j ? W.j.luck : 0, W.g ? W.g.luck : 0);
  if (W.j){ const j = W.j, rigNo = j.mk > 0 ? (j.mk > 1 ? 'juksamaskiner' : 'juksamaskin') : 'håndjuksa', rigEn = j.mk > 0 ? (j.mk > 1 ? 'jigging machines' : 'a jigging machine') : 'a hand jig';
    no.push('Turen ga ' + kgS(j.kgph, true) + ' kg i timen med ' + rigNo + '.'); en.push('The trip gave ' + kgS(j.kgph, false) + ' kg an hour with ' + rigEn + '.');
    const wind = j.w > 8.5, F = [['sea', (wind ? 'sjøen og vinden (' : 'sjøen (') + nf(j.hs, 1, true) + ' m' + (wind ? ', ' + nf(j.w, 0, true) + ' m/s' : '') + ')', (wind ? 'the sea and the wind (' : 'the sea (') + nf(j.hs, 1, false) + ' m' + (wind ? ', ' + nf(j.w, 0, false) + ' m/s' : '') + ')'],
      ['cold', 'kulda', 'the cold'], ['stock', 'nedfisket felt', 'fished-down grounds'], ['pilk', 'slitt pilk og kroker', 'worn pilk and hooks']]
      .map(([k, a, b]) => [j.sh[k], a, b]).filter(x => x[0] >= TRIPL.min).sort((a, b) => b[0] - a[0]);
    const tight = j.fair > 0 && j.pot >= TRIPL.tight * j.fair, thin = j.fair > 0 && j.pot <= TRIPL.thin * j.fair, P = nf(about(j.pot), 0, true);
    const s0no = 'Fisken sto ' + (tight ? 'tett, til rundt ' : thin ? 'tynt, til rundt ' : 'til rundt ') + P, s0en = 'The fish stood ' + (tight ? 'dense, for about ' : thin ? 'thin, for about ' : 'for about ') + nf(about(j.pot), 0, false);
    if (F.length){ no.push(s0no + ': ' + F.map((x, i) => x[1] + (i ? ' ' : ' tok ') + pc(x[0]) + ' %').join(', ') + '.'); en.push(s0en + ': ' + F.map((x, i) => x[2] + (i ? ' ' : ' took ') + pc(x[0]) + ' %').join(', ') + '.'); }
    else { no.push(s0no + '.'); en.push(s0en + '.'); }
  }
  if (W.g){ const g = W.g, one = g.n === 1;
    no.push((one ? 'Trekket' : 'De ' + g.n + ' trekkene') + ' ga ' + nf(g.kg, 0, true) + ' kg, mot rundt ' + nf(about(g.fair), 0, true) + ' i ' + (one ? 'et vanlig trekk' : 'vanlige trekk') + ' med samme ståtid' + (g.stock >= TRIPL.min ? '; nedfisket felt tok ' + pc(g.stock) + ' %' : '') + '.');
    en.push((one ? 'The haul' : 'The ' + g.n + ' hauls') + ' gave ' + nf(g.kg, 0, false) + ' kg, against about ' + nf(about(g.fair), 0, false) + ' in ' + (one ? 'an ordinary haul' : 'ordinary hauls') + ' with the same soak' + (g.stock >= TRIPL.min ? '; fished-down grounds took ' + pc(g.stock) + ' %' : '') + '.');
  }
  if (lk >= TRIPL.min){ const x = Math.abs(lk - 1) <= 0.05 ? 2 : Math.abs(lk - 2) <= 0.05 ? 3 : 0;
    no.push('Haillen ga ' + (x ? (x === 2 ? 'det dobbelte' : 'det tredobbelte') : pc(lk) + ' % mer') + '.'); en.push('The luck gave ' + (x ? (x === 2 ? 'double' : 'triple') : pc(lk) + ' % more') + '.'); }
  return [no.join(' '), en.join(' ')];
}
// ---- the trip's limits on an ocean vessel (H2b of docs/planer/havsteget-h2-autoline.md, 05.11.2026). The fuel, the bait, the hooks for
// the hook change (10b-gearcare.js autoFixHour) and the room in the hold each last so many days at the trip's pace so far (until half a
// day at sea has gone, and for the hold until a tonne is in, the vessel's own: her generators and a day of gear work, 5.5 t of product a
// day); the fuel keeps what she needs to steam to the nearest plant that takes her (straight line and a fifth, at her cruising speed).
// 6-7 weeks is usual for an autoliner (HI report 2024-11). Each is said once every 12 hours when it lasts under TRIPX.warn days more.
const TRIPX = {warn:2, every:720, gearL:1300, prodDay:5500, way:1.2};
function tripHome(b = S.boat){
  let best = null, bd = Infinity;
  for (const q of PORTS){ if (!(q.mottak || q.havOnly) || portWhy(q, b.type)) continue; const d = kmTrue(q.p, b.pos); if (d < bd){ bd = d; best = q; } }
  return best ? {pt:best, km:bd * TRIPX.way, days:bd * TRIPX.way / NM / Math.max(4, BOAT.vcruise || 8) / 24} : null;
}
function tripLeft(b = S.boat){
  const T = tripOf(b), d = (T.seaM || 0) / 1440, pg = S.pgear, home = b.status === 'port' ? null : tripHome(b);
  // (the fuel kept for the way in at the speed she goes it: the plan steams at full speed since 06.11.2026 («Full fart som standard»), which
  // takes twice the cruise's litres an hour on the snow crab vessel, 851 against 400; reckoned at the cruise she ran dry on the way in, H3c)
  const vh = S.plan && S.plan.ops && S.plan.speed ? Math.max(4, Math.min(S.plan.speed, BOAT.vmax || S.plan.speed)) : Math.max(4, BOAT.vcruise || 8);
  const fuelDay = d < 0.5 ? (BOAT.plantLph || 0) * 24 + TRIPX.gearL : T.fuelL / d, homeL = home ? home.km / NM / vh * (typeof fuelLph === 'function' ? fuelLph(vh, 8) : (BOAT.lph || 0)) : 0;
  const prod = holdLoad(), prodDay = d < 0.5 || prod < 1000 ? TRIPX.prodDay : prod / d, L = BOAT.autoHooks && pg ? autoL(pg) : null, R = {d, home};
  R.fuel = Math.max(0, b.fuel - homeL) / Math.max(1, fuelDay);
  if (L){ const lenker = BOAT.autoHooks / LINE_KINDS.auto.hooks; R.bait = baitKg(pg) / (lenker * LINE_KINDS.auto.baitKg); R.hooks = (pg.hooks || 0) / (BOAT.autoHooks * AUTOFIX.day); }
  R.hold = Math.max(0, capHold() - prod) / prodDay; if (lagOf()) R.prov = provOf(b) / Math.max(1, provMen());
  if (snoVessel()) snoTrip(R, b, d);   // (H3b: the bait for the pots, the room in the tanks on a live trip, 10e-krabbefabrikk.js)
  const inf = v => v == null ? Infinity : v;
  R.min = Math.min(R.fuel, R.hold, inf(R.bait), inf(R.hooks), inf(R.prov), inf(R.tank));
  return R;
}
const TRIPW = {prov:['Provianten', 'The provisions'], fuel:['Drivstoffet', 'The fuel'], bait:['Agnet', 'The bait'], hooks:['Krokene til krokbyttet', 'The hooks for the hook change'], hold:['Plassen i lasterommet', 'The room in the hold'], tank:['Plassen i tankene', 'The room in the tanks']};
// once an hour at sea on an ocean vessel: the days at sea, and a word when the trip is running out of something
function tripHour(){
  const b = S.boat; if (BOAT.cls !== 'hav' || b.status === 'port') return;
  const T = tripOf(b); T.seaM = (T.seaM || 0) + 60;
  const R = tripLeft(b), W = b.tripWarn || (b.tripWarn = {}), home = R.home ? R.home.pt.name : '', hd = R.home ? fmtC(R.home.days, 1) : '';
  for (const k of ['prov', 'fuel', 'bait', 'hooks', 'hold', 'tank']){ const v = R[k]; if (v == null || v >= TRIPX.warn || S.t - (W[k] || -1e9) < TRIPX.every) continue; W[k] = S.t;
    const days = v < 0.5 ? ['under et halvt døgn', 'under half a day'] : ['om lag ' + fmtC(v, 1) + ' døgn', 'about ' + fmtC(v, 1) + ' days'];
    const no = TRIPW[k][0] + ' rekker ' + days[0] + ' til' + (k === 'fuel' && home ? ', og så trengs resten for å gå til ' + home + ' (' + hd + ' døgn)' : '') + '.',
      en = TRIPW[k][1] + ' lasts ' + days[1] + ' more' + (k === 'fuel' && home ? ', and the rest is needed to steam to ' + home + ' (' + hd + ' days)' : '') + '.';
    log(no, en); msg(gL('Turen', 'The trip'), no + (k === 'hold' || k === 'prov' || k === 'tank' ? ' Det er tid for å gå til mottaket.' : home ? ' Nærmeste mottak som tar båten, er ' + home + '.' : ''), en + (k === 'hold' || k === 'prov' || k === 'tank' ? ' It is time to head for the plant.' : home ? ' The nearest plant that takes her is ' + home + '.' : '')); }
}
// ===== the ocean vessel's crew as anonymous teams (H2b of docs/planer/havsteget-h2-autoline.md, V3 A; Jonas 05.11.2026: the teams
// «Følger båten») =====
// VESSELS crew: the key people (skipper, mate, engineers, cook, bosun), the deck team and the factory team, and rot crews that take turns
// a trip each (the profitability survey 2024, table G 14: 30.1 men a vessel and 15.5 man-years, so two crews of 15 with you). The teams
// come with the vessel, a number and a skill (3 of 5 at the start, a tenth more each trip, up to 4.5); nobody is hired from the exchange
// for them. At sea the deck and factory teams go six and six: two watches, the first 00-06 and 12-18, the second 06-12 and 18-24, half
// of each team on each; the bosun works the first watch with them; the skipper and the mate have the bridge one watch each and take the
// helm when she is under way and you are not at it; the engineers keep the engine room and the cook the galley (a meal every six hours,
// 4 of 5), so none of them is on deck. The crew aboard changes at each landing (lagLanded). They are not in S.crew: no names, moods,
// quarrels or exchange (named key people with lives come in H7); the work (core/13-work.js workAssign) has them as people at the stations.
const LAG = {skill0:3, step:0.1, max:4.5, watch:6, cook:4};
const fmtC = (v, d = 0) => typeof fmt === 'function' ? fmt(v, d) : v.toFixed(d);   // (the UI's number format; plain in the unit tests)
const lagSpec = () => (VESSELS[S.boat && S.boat.type] || {}).crew || null;
function lagOf(){
  const V = lagSpec(); if (!V) return null;
  if (!S.lag || S.lag.type !== S.boat.type) S.lag = {type:S.boat.type, on:0, since:S.t, sh:Array.from({length:V.rot || 1}, (_, i) => ({i, skill:LAG.skill0, trips:0}))};
  return S.lag;
}
const lagN = () => { const V = lagSpec(); return V ? V.key.length + V.teams.reduce((a, t) => a + t.n, 0) : 0; };
const lagShName = i => String.fromCharCode(65 + i);   // skift A, B
const lagWatch = H => Math.floor(gDate(H).getUTCHours() / LAG.watch) % 2;   // 0: 00-06 and 12-18, 1: 06-12 and 18-24
// the people of the crew aboard (made once per crew, skill and language; not saved: the save keeps the number and the skill)
let LAGC = {k:'', P:[]};
function lagPeople(){
  const G = lagOf(); if (!G) return [];
  const V = lagSpec(), s = G.sh[G.on].skill, k = G.type + ':' + G.on + ':' + s.toFixed(2) + ':' + S.lang; if (LAGC.k === k) return LAGC.P;
  const no = S.lang === 'no', sh = lagShName(G.on), P = [], hi = Math.min(5, s + 0.5), lo = Math.max(1, s - 0.5);
  const mk = (id, role, w, nm, gear, hab, x) => P.push(Object.assign({id:'lag-' + sh + '-' + id, anon:true, role, w, name:nm, sex:'m', age:24 + hashStr(sh + id) % 34, traits:[], fatigue:15, morale:65,
    attr:{erf:s, styrke:s, uth:s, tek:s, kokk:2, sjo:s}, gear:Object.assign({juksa:s, line:s, garn:s, teiner:s, sloy:s, is:s, sort:s}, gear), hab:Object.assign({}, hab), said:[], known:[true, true], grudge:{}, earn:[]}, x || {}));
  // the bridge: the skipper the first watch and the mate the second (at the helm under way, mate:true for workAssign)
  if (V.key.includes('skipper')) mk('sk', 'bro', 0, no ? 'Skipperen' : 'The skipper', {}, {ror:600}, {mate:true});
  if (V.key.includes('styrmann')) mk('st', 'bro', 1, no ? 'Styrmannen' : 'The mate', {}, {ror:600}, {mate:true});
  if (V.key.includes('bas')) mk('bas', 'dekk', 0, no ? 'Basen' : 'The bosun', {line:hi, sloy:s, is:s}, {haling:400, sloy:300});
  for (const t of V.teams){ const dk = t.role === 'dekk';
    for (let i = 0; i < t.n; i++) mk(t.role + (i + 1), t.role, i % 2, (dk ? (no ? 'Dekk ' : 'Deck ') : (no ? 'Fabrikk ' : 'Factory ')) + (i + 1),
      dk ? {line:hi, sloy:lo, is:lo} : {line:lo, sloy:hi, is:hi}, dk ? {haling:900, blogg:600} : {sloy:900, is:800}); }
  LAGC = {k, P}; return P;
}
// those of the crew at the deck's stations this minute: the watch on (half of each team, the bosun with the first) and, when she is
// under way, the bridge's man of the watch; nobody at all while the vessel lies at a plant with her catch being landed by the plant's gang
function lagOnDeck(H, under){
  if (!lagOf()) return []; const w = lagWatch(H == null ? S.t / 60 : H);
  return lagPeople().filter(c => c.w === w && (c.role !== 'bro' || under));
}
// a meal from the vessel's cook when it is due (core/14-crewlife.js mealMinute): no word in the log, the crew eat in the mess
function lagMeal(){ const M = mealState(), q = provOf() > 0 ? LAG.cook : 1; M.hist.push(q); if (M.hist.length > 8) M.hist.shift(); M.due = S.t + MEAL.every; M.cook = null; M.last = {t:S.t, q, by:'lag'}; }
// the crew aboard has landed: it signs off with its share, a tenth more skill for the trip, and the other crew signs on. Hands from the
// exchange aboard an ocean vessel (hired on one before H2b) go ashore here with this landing's share paid: the teams are her crew now
function lagLanded(kr){
  const G = lagOf(); if (!G) return;
  if ((S.crew || []).length){ const nm = S.crew.map(c => c.name.split(' ')[0]); for (const c of S.crew.slice()){ crewSettle(c); if (typeof flyOut === 'function') flyOut(c); } S.crew = [];
    log(nm.join(', ') + ' har gått i land. Havbåten har sine egne lag.', nm.join(', ') + ' went ashore. The ocean vessel has her own teams.'); }
  if (G.sh.length < 2) return; const a = G.sh[G.on]; a.trips++; a.skill = Math.min(LAG.max, Math.round((a.skill + LAG.step) * 100) / 100);
  // (H3b) a vessel whose crews go so many weeks on (VESSELS crew rotD: the snow crab vessel's five weeks on and five off) keeps the crew
  // aboard until its time is out; the autoliner's change at each landing (H2b). A save from before has no sign-on time: it changes now
  const rd = lagSpec().rotD, on = G.since != null ? (S.t - G.since) / 1440 : Infinity;
  if (rd && on < rd){ log('Skift ' + lagShName(a.i) + ' blir om bord' + (kr > 0 ? ' og får ' + fmtC(kr, 0) + ' kr i lott' : '') + '. Det har vært om bord i ' + fmtC(on, 0) + ' av ' + rd + ' døgn.',
    'Crew ' + lagShName(a.i) + ' stays aboard' + (kr > 0 ? ' and gets NOK ' + fmtC(kr, 0) + ' in shares' : '') + '. It has been aboard for ' + fmtC(on, 0) + ' of ' + rd + ' days.'); return; }
  G.on = (G.on + 1) % G.sh.length; G.since = S.t; const b = G.sh[G.on];
  log('Skift ' + lagShName(a.i) + ' går i land' + (kr > 0 ? ' med ' + fmtC(kr, 0) + ' kr i lott' : '') + ', og skift ' + lagShName(b.i) + ' mønstrer på (' + lagN() + ' mann, ferdighet ' + fmtC(b.skill, 1) + ').',
    'Crew ' + lagShName(a.i) + ' signs off' + (kr > 0 ? ' with NOK ' + fmtC(kr, 0) + ' in shares' : '') + ', and crew ' + lagShName(b.i) + ' signs on (' + lagN() + ' men, skill ' + fmtC(b.skill, 1) + ').');
}
// ---- the provisions of an ocean vessel (H2b; Jonas 05.11.2026: «Fylles ved avgang»): the ship's chandler fills the stores aboard when she
// casts off, for PROV.days days for all a crew aboard and you (15 on the autoliner), at PROV.kr a man-day (the profitability survey 2024,
// table G 14: 1.05 MNOK a year for provisions, about 250 kr a man a day at sea), booked as the company's own cost. At sea those aboard
// eat a day's share a day; the stores are a limit of the trip (tripLeft), and with them empty the meals are dry bread
const PROV = {days:60, kr:250};
const provMen = () => lagN() + (meAboard() ? 1 : 0) + crewAboard().length;
// (H3b) the days a vessel stores for (VESSELS provDays: the snow crab vessel's trips are shorter, 30 days), else the autoliner's 60
const provDays = () => (typeof BOAT !== 'undefined' && BOAT && BOAT.provDays) || PROV.days;
const provCap = () => provDays() * (lagN() + 1);
function provOf(b = S.boat){ if (b.prov == null) b.prov = provCap(); return b.prov; }
function provFill(){
  const b = S.boat; if (!lagOf()) return 0; const cap = provCap(), add = Math.max(0, cap - provOf(b)); if (add < 1) return 0;
  const kr0 = Math.round(add * PROV.kr); book('proviant', -kr0, 'Proviant for turen', 'Provisions for the trip'); b.prov = cap;
  log('Skipshandelen har levert proviant om bord for ' + provDays() + ' døgn til ' + (lagN() + 1) + ' mann: ' + fmtC(kr0, 0) + ' kr.', 'The ship\'s chandler has delivered provisions for ' + provDays() + ' days for ' + (lagN() + 1) + ' men: NOK ' + fmtC(kr0, 0) + '.');
  return kr0;
}
function provMinute(){ const b = S.boat; if (!lagOf() || b.status === 'port') return; b.prov = Math.max(0, provOf(b) - provMen() / 1440); }
// a vessel with teams takes no one from the exchange (the teams are her crew)
function crewHireWhy(){ return lagSpec() ? [gL('Havbåten har sine egne lag, to skift som følger båten. Mannskapsbørsen er for kystbåtene.', 'The ocean vessel has her own teams, two crews that come with her. The crew exchange is for the coastal boats.')] : null; }
// who shares: the crew aboard (those asleep in their bunks too) or aboard when fish now in the hold was caught (c.trip); with you ashore
// the one who skippers (the skipper you named, else the most seasoned)
function lottParty(){
  const onIds = new Set(crewAboard(null, true).map(c => c.id)), me = meAboard(), C = (S.crew || []).filter(c => c.trip || onIds.has(c.id)).map(lotMigrate), len = BOAT.len || 0;
  const sk = me ? null : (crewSkipper() && C.includes(crewSkipper()) ? crewSkipper() : C.slice().sort((a, b) => (b.attr ? b.attr.erf + b.attr.sjo : 0) - (a.attr ? a.attr.erf + a.attr.sjo : 0))[0]);
  const P = C.map(c => ({c, lots:lotOf(c), sk:sk === c, appr:isAppr(c)})), own = me ? LOTT.hand : 0, f = lottFishery();
  // the ocean vessel's crew aboard shares as one, a share a man; with you ashore their skipper has the skipper's extra (H2b)
  const G = lagOf(); if (G){ const sh = G.sh[G.on], m = lagN(); P.push({c:{id:'lag-' + lagShName(G.on), name:gL('Skift ', 'Crew ') + lagShName(G.on) + ' (' + m + gL(' mann)', ' men)'), lag:true}, lots:m, sk:!me && !sk, appr:false, lag:m}); }
  const n = P.reduce((a, p) => a + (p.lag ? p.lag : p.appr ? LOTT.half : 1), 0) + (me ? 1 : 0);
  return {P, n, own, tot:P.reduce((a, p) => a + p.lots, 0) + own, M:lottM(n, len, f), f, ref:(OPPG[f === 'teine' ? 'garn' : f] || {}).ref, skX:P.some(p => p.sk) ? skipExtra(len) : 0};
}
// the shares of a shared catch D: {M, n, tot, f, per:[{c, lots, kr, sk, x (the skipper's extra share, paid by the company)}], crew}
function lottSplit(D){ const Q = lottParty(), pot = Math.max(0, D) * Q.M, one = Q.tot > 0 ? pot / Q.tot : 0;
  const per = Q.P.map(p => ({c:p.c, lots:p.lots, sk:p.sk, appr:p.appr, kr:Math.round(one * (p.lots + (p.sk ? Q.skX : 0))), x:p.sk ? Q.skX : 0}));
  return {M:Q.M, n:Q.n, tot:Q.tot, own:Q.own, f:Q.f, ref:Q.ref, skX:Q.skX, D:Math.round(Math.max(0, D)), pot:Math.round(pot), per, crew:per.reduce((a, p) => a + p.kr, 0)}; }
// the mate's wage on a round-the-clock plan (§ 22 a), the company's, paid at midnight
function payMates(){ eachVessel(() => { const len = BOAT.len || 0; for (const c of S.crew || []) if (c.mate && !c.off){ const w = mateWage(len); book('mannskap', -w, 'Bestmannshyre, ' + c.name, 'Mate\'s wage, ' + c.name); if (typeof lifeEarn === 'function') lifeEarn(c, w); c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, w]]); } }); }
// what a share of this boat's ordinary week brings (the morale's yardstick): the week's catch value at the vessel's length (WEEKKR, an
// estimate in the game's money, to be calibrated against progweek), less a fifth for the levies and the common costs, the crew's part,
// split in the shares aboard; more in the skrei season, less outside it
const WEEKKR = [[5, 25000], [7, 40000], [9, 60000], [11, 90000], [15, 220000], [21, 450000], [28, 800000], [40, 2000000], [70, 5000000]];
function weekKr(len){ const T = WEEKKR; if (len <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (len <= T[i][0]){ const [a, va] = T[i - 1], [b, vb] = T[i]; return va + (vb - va) * (len - a) / (b - a); } return T[T.length - 1][1]; }
function lotWeek(c, H = S.t / 60){ const Q = lottParty(), tot = Math.max(Q.tot, lotOf(c));
  return weekKr(BOAT.len || 6) * 0.8 * (skreiSeason(H) ? 1.25 : 0.85) * Q.M * (isAppr(c) ? lotOf(c) : c.ask) / tot; }
// (all: those off watch asleep in their bunks too, 06h-plan2-engine.js plan2WatchTick; they are crew and share the catch, but are not on deck)
// (a hand in the old form, as the quay's candidates are hired, is made whole in place once: made again at every call he came out
// different each time, aboard in one call and ashore in the next, until the hour's crewTick kept one)
function crewAboard(H, all){ if (H == null) H = S.t / 60; const wd = (gDate(H).getUTCDay() + 6) % 7, C = S.crew || []; for (let i = 0; i < C.length; i++) if (!C[i].attr) C[i] = crewUpgrade(C[i]); return C.filter(c => !c.off && (all || !c.sleepW) && (!c.bi || c.biDays[wd])); }
// a part-timer's days as words («fredag–søndag»), from biDays (Monday first)
const WDN = [['mandag', 'Monday'], ['tirsdag', 'Tuesday'], ['onsdag', 'Wednesday'], ['torsdag', 'Thursday'], ['fredag', 'Friday'], ['lørdag', 'Saturday'], ['søndag', 'Sunday']];
function biDaysTxt(c){ const d = (c.biDays || []).map((v, i) => v ? i : -1).filter(i => i >= 0), en = S.lang === 'en' ? 1 : 0; if (!d.length) return '';
  const run = d.every((v, i) => !i || v === d[i - 1] + 1); return run && d.length > 2 ? WDN[d[0]][en] + '–' + WDN[d[d.length - 1]][en] : d.map(i => WDN[i][en]).join(en ? ' and ' : ' og '); }
// who of the crew is ashore today because the job at sea is their second one (spilltest 3, F7): a sentence, or ''
function crewBiOff(H){ if (H == null) H = S.t / 60; const wd = (gDate(H).getUTCDay() + 6) % 7, off = (S.crew || []).filter(c => !c.off && c.bi && c.biDays && !c.biDays[wd]); if (!off.length) return '';
  return off.map(c => S.lang === 'en' ? ' ' + c.name + ' only comes along ' + biDaysTxt(c) + ' (a second job) and is ashore today.' : ' ' + c.name + ' er bare med ' + biDaysTxt(c) + ' (biyrke) og er på land i dag.').join(''); }
function crewEff(c, H, hs, g = 'juksa'){
  const A = c.attr, T = c.traits; let e = 0.55 + 0.08 * A.erf + 0.07 * (c.gear[g] || c.gear.juksa || 1) + 0.04 * A.styrke;
  if (T.includes('arbeidsjern')) e *= 1.12; if (T.includes('makelig')) e *= 0.9; if (T.includes('perfeksjonist')) e *= 0.95;
  if (T.includes('lokalkjent') && c.homePort && dist(portById(c.homePort).p, S.boat.pos) < 15) e *= 1.12;
  for (const f of crewDrive(c, H, hs)) e *= f[1];
  return e;
}
// ---- what lifts or drags a person's effort just now, besides what they can and who they are (Jonas 23.10.2026: «dette skal være dynamisk
// og vil variere alt etter energi, humør, miljø, sult, og andre faktorer»): [reason, factor about 1]. Fatigue and mood as before (the
// mood now in a smooth step, the same 0.85 at the bottom and a little over 1 at the top), a meal that is late, poor or good food, a heavy
// sea (the seaman minds it less), the seasick, the dark, how the crew pull together (crewTeam), a quarrel and the morning after the pub.
// The cold is not here: it already takes its share of the fishing and the hauling (coldPen), and crewEffort shows it beside these.
let DRIVE_SUN = {t:-1, dark:false};
function crewDrive(c, H, hs){
  const T = c.traits, b = S.boat, sea = b.status !== 'port', F = [];
  F.push(['tired', 1 - 0.5 * sstep(50, 100, c.fatigue)]);
  F.push([c.morale >= 62 ? 'glad' : 'sour', 0.85 + 0.2 * sstep(20, 85, c.morale)]);
  if (sea){
    const M = S.meal; if (M && M.due != null && S.t > M.due) F.push(['hungry', 1 - 0.08 * clamp((S.t - M.due) / 60, 0, 1)]);
    if (typeof foodScore === 'function'){ const q = foodScore(); if (Math.abs(q - 3) > 0.4) F.push([q > 3 ? 'food' : 'poorfood', 1 + (q - 3) * 0.02]); }
    const hw = hs * ((BOAT.fx && BOAT.fx.sea) || 1); if (hw > 1.5) F.push(['sea', 1 - Math.min(0.12, 0.05 * (hw - 1.5) * (1.2 - 0.12 * c.attr.sjo))]);
    if (T.includes('sjosyk') && hs > 1.2) F.push(['seasick', 0.75]);
    if (DRIVE_SUN.t !== S.t){ DRIVE_SUN.t = S.t; DRIVE_SUN.dark = sunAt(H, b.pos).el < -6; } if (DRIVE_SUN.dark) F.push(['dark', 0.98]);
  }
  const tv = crewTeam().v; if (Math.abs(tv - 50) > 5) F.push([tv > 50 ? 'team' : 'noteam', 0.96 + 0.08 * tv / 100]);
  if (c.cpen) F.push(['quarrel', 0.9]); if (c.cut && S.t < c.cut) F.push(['cut', 0.88]);
  if (T.includes('olglad') && S.pubE === pubEvening(H - 12) && gDate(H).getUTCHours() < 12) F.push(['hangover', 0.8]);
  return F;
}
// how a person is working, in words for the Mannskap page: a level and the strongest reason when it matters
const DRIVE_WHY = {tired:['sliten', 'tired'], glad:['i godt humør', 'in good spirits'], sour:['misfornøyd', 'unhappy'], hungry:['sulten', 'hungry'], food:['god mat i magen', 'good food inside'],
  poorfood:['dårlig mat', 'poor food'], sea:['grov sjø', 'a heavy sea'], seasick:['sjøsyk', 'seasick'], dark:['mørkt på dekk', 'dark on deck'], team:['godt lag om bord', 'a good team aboard'],
  noteam:['dårlig stemning om bord', 'a sour atmosphere aboard'], quarrel:['uvenner med noen', 'at odds with someone'], hangover:['tung i hodet etter puben', 'heavy-headed after the pub'], cut:['har skåret seg i hånda', 'has cut a hand'], cold:['kald på fingrene', 'cold fingers']};
const DRIVE_LVL = [[1.03, 'Står på', 'Going hard'], [0.95, 'Jevn innsats', 'Steady'], [0.85, 'Går litt tregt', 'A bit slow'], [0, 'Har lite å gi', 'Little left to give']];
function crewEffort(c, H, hs){
  if (H == null) H = S.t / 60; if (hs == null) hs = hsWork(S.boat.pos, H);
  const F = crewDrive(c, H, hs); if (S.boat.status !== 'port'){ const cp = coldPen(H, hs); if (cp > 0.03) F.push(['cold', 1 - cp]); }
  const f = F.reduce((a, x) => a * x[1], 1), L = DRIVE_LVL.find(x => f >= x[0]), no = S.lang === 'no';
  let why = null, wv = 0.03; for (const [k, v] of F){ const d = f >= 1 ? v - 1 : 1 - v; if (d > wv){ wv = d; why = k; } }
  return {f, lvl:DRIVE_LVL.indexOf(L), word:no ? L[1] : L[2], why, text:(no ? L[1] : L[2]) + (why ? ': ' + DRIVE_WHY[why][no ? 0 : 1] : '')};
}
// ---- samhold: how the crew aboard pull together (Jonas 23.10.2026: «Samhold ja, men det må gjøres intuitivt»), 0-100 per vessel (S.team,
// VKEYS), 50 among strangers. Once an hour it moves towards what the hour gives it: time at sea together (hard weather counts half again),
// people who get on (compat), the food, their spirits, and against it a quarrel, grudges and new faces (a newcomer takes it some of the way
// back to 50 and the shared time down by four tenths). It lifts their effort (crewDrive, ±4 %), their mood (crewTick), how ready they are
// to pitch in rather than rest (13-work.js restScore), and makes quarrels rarer. It stands still while nobody is aboard.
function crewTeam(){ return S.team || (S.team = {v:50, h:0, ids:'', nw:null, c:{}, why:null}); }
const TEAM_WHY = {pair:[['de kommer godt overens', 'they get on well'], ['{a} og {b} går hverandre på nervene', '{a} and {b} get on each other\'s nerves']],
  time:[['de har stått i det sammen en stund', 'they have been through it together for a while'], null], food:[['maten er god', 'the food is good'], ['maten er dårlig', 'the food is poor']],
  mood:[['humøret er godt', 'spirits are high'], ['flere er misfornøyde', 'several are unhappy']], quarrel:[null, ['krangelen henger i', 'the quarrel hangs over them']],
  grudge:[null, ['noen bærer nag', 'someone bears a grudge']], fresh:[null, ['det er nye folk om bord', 'there are new faces aboard']]};
function teamHour(H, on, hs, food){
  const T = crewTeam(); if (!on.length) return;
  const ids = on.map(c => c.id).sort().join(',');
  if (T.ids && ids !== T.ids){ const was = new Set(T.ids.split(',')), fresh = on.filter(c => !was.has(c.id)).length;
    if (fresh){ T.h *= 0.6; T.v += (50 - T.v) * Math.min(0.5, 0.25 * fresh); T.nw = S.t; } }
  T.ids = ids;
  const sea = S.boat.status !== 'port'; if (sea) T.h += hs > 1.5 ? 1.5 : 1;
  let pk = 0, n = 0, worst = null, wk = 1e9; for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++){ const k = compat(on[i], on[j]); pk += k; n++; if (k < wk){ wk = k; worst = [on[i], on[j]]; } }
  const mood = on.reduce((a, c) => a + c.morale, 0) / on.length, grudge = on.reduce((a, c) => a + Object.values(c.grudge || {}).reduce((x, v) => x + v, 0), 0);
  const ev = S.cevt && on.some(c => c.id === S.cevt.a || c.id === S.cevt.b);
  const C = {pair:n ? clamp(6 * pk / n, -12, 12) : 0, time:Math.min(14, T.h / 15), food:(food - 3) * 4, mood:clamp((mood - 60) * 0.25, -15, 10), quarrel:ev ? -14 : 0,
    grudge:-Math.min(12, grudge * 3), fresh:T.nw != null && S.t - T.nw < 3 * 1440 ? -5 : 0};
  const tg = clamp(50 + Object.values(C).reduce((a, v) => a + v, 0), 0, 100);
  T.v = clamp(T.v + (tg - T.v) * (sea ? 0.04 : 0.015), 0, 100); T.c = C; T.pair = worst && wk < 0 ? [worst[0].id, worst[1].id] : null;
  // the reason said with it: the strongest pull the way it is going (falling: what drags it down, even while it is still good), or, while
  // it holds, the way it stands
  const up = Math.abs(tg - T.v) >= 3 ? tg > T.v : T.v >= 50; let why = null, wv = 1; for (const k in C){ const v = up ? C[k] : -C[k]; if (v > wv && TEAM_WHY[k][up ? 0 : 1]){ wv = v; why = k; } } T.why = why; T.up = up;
}
// samhold in one line for the Mannskap page: how it stands and why
function teamLine(){
  const T = crewTeam(), no = S.lang === 'no', v = T.v, i = no ? 0 : 1;
  const w = v >= 70 ? ['Godt samhold', 'Pulling together well'] : v >= 55 ? ['Greit samhold', 'Getting along'] : v >= 40 ? ['Samholdet er så som så', 'So-so as a crew'] : ['Dårlig samhold', 'Not pulling together'];
  let r = T.why && TEAM_WHY[T.why][(T.up != null ? T.up : v >= 50) ? 0 : 1]; r = r ? r[i] : '';
  if (r && T.pair){ const a = crewById(T.pair[0]), b = crewById(T.pair[1]); r = a && b ? r.replace('{a}', a.name.split(' ')[0]).replace('{b}', b.name.split(' ')[0]) : ''; }
  if (r.includes('{a}')) r = '';
  return {v, text:w[i] + (r ? ': ' + r : ''), lvl:v >= 70 ? 0 : v >= 55 ? 1 : v >= 40 ? 2 : 3};
}
function teamEff(team, me = true, g = 'juksa'){ const H = S.t / 60, hs = hsWork(S.boat.pos, H), n = (me ? 1 : 0) + team.length; return n ? ((me ? 1 : 0) + team.reduce((a, c) => a + crewEff(c, H, hs, g), 0)) / n : 1; }
// how two people get along: habits, home village, age, and old grudges
function compat(a, b){
  const A = a.traits, B = b.traits, both = t => A.includes(t) && B.includes(t), either = t => A.includes(t) || B.includes(t); let k = 0;
  if (a.home === b.home) k += 1; if (either('spokefugl')) k += 1; if (either('omsorgsfull')) k += 1; if (both('olglad')) k += 1;
  if (either('kranglefant')) k -= both('kranglefant') ? 3 : 2; if ((A.includes('arbeidsjern') && B.includes('makelig')) || (B.includes('arbeidsjern') && A.includes('makelig'))) k -= 2;
  if (either('stolt') && either('kranglefant')) k -= 1; if ((A.includes('grinebiter') && B.includes('spokefugl')) || (B.includes('grinebiter') && A.includes('spokefugl'))) k -= 1;
  if (Math.abs(a.age - b.age) > 30) k -= 1; k -= Math.round(((a.grudge || {})[b.id] || 0) + ((b.grudge || {})[a.id] || 0));
  return k;
}
const PAIR_TOPICS = {jobb:{no:'{a} mener {b} ikke tar sin del av jobben på dekk.', en:'{a} thinks {b} is not pulling their weight on deck.'}, sloying:{no:'{a} og {b} er uenige om hvem som skal sløye.', en:'{a} and {b} disagree about who should gut the fish.'},
  musikk:{no:'{a} og {b} krangler om musikken i styrehuset.', en:'{a} and {b} are arguing about the music in the wheelhouse.'}, kaffe:{no:'{a} er sur fordi {b} tok den siste kaffen igjen.', en:'{a} is sulking because {b} took the last coffee again.'},
  respekt:{no:'{a} føler at {b} snakker ned til seg.', en:'{a} feels {b} talks down to them.'}, vaer:{no:'{a} og {b} er uenige om det var lurt å gå ut i dette været.', en:'{a} and {b} disagree about going out in this weather.'}};
const BOSS_TOPICS = {lott:{no:'{a} mener lotten er for lav for jobben som gjøres.', en:'{a} thinks the share is too low for the work done.'},
  vaer:{no:'{a} liker ikke at dere går ut i så mye vær.', en:'{a} does not like you going out in this much weather.'}, kulde:{no:'{a} fryser og vil ha bedre klær om bord.', en:'{a} is freezing and wants better clothes aboard.'}, generelt:{no:'{a} er misfornøyd og sier klart fra om det.', en:'{a} is unhappy and says so plainly.'}};
function crewById(id){ return (S.crew || []).find(c => c.id === id); }
// What the hold is worth to the crew now: priced at this plant (or the nearest one) as sell() would, less the sales organisation's
// deductions (TREKK), on which the share is reckoned
function holdNet(){
  if (!S.hold.length) return 0; const H = S.t / 60, here = portById(S.boat.port), pt = here && here.mottak ? here : (plantsNear(S.boat.pos, 1)[0] || {}).pt; if (!pt) return 0;
  let v = 0; for (const x of S.hold){ const c = x.cls != null ? x.cls : SPECIES[x.sp].ref, g = grade(x.fresh);
    v += x.kg * (x.sp === 'krabbe' ? ((x.fresh || 0) < KC.dead ? 0 : clsPrice(pt, x.sp, c, H, false)) : g === 'V' ? 1 : clsPrice(pt, x.sp, c, H, x.hook) * GM[g]); }
  return v - trekkOf(v, BOAT.len || 0).sum;
}
// The settlement when someone leaves the boat (let go, or signing off): a crew member on a share who was aboard when fish now in the
// hold was caught gets the share of it at once, and one on a wage gets the day's wage for the part of the day worked (Adrian 13.10.2026:
// crew let go just before the landing were paid nothing for the trip)
function crewSettle(c){
  lotMigrate(c); let lott = 0;
  // the shared catch of the hold as it would be landed now: its value less the levies and the trip's common costs so far
  if (c.trip && S.hold.length){ const L = lottSplit(holdNet() - tripCost().sum), p = L.per.find(x => x.c === c); lott = p ? p.kr : 0; }
  const sum = lott; delete c.trip; if (sum <= 0) return 0;
  book('mannskap', -sum, 'Oppgjør med ' + c.name, 'Settled with ' + c.name); c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, sum]]); if (typeof lifeEarn === 'function') lifeEarn(c, sum);
  log(c.name + ' fikk ' + kr(sum) + ' i lott for fangsten om bord.', c.name + ' was paid ' + kr(sum) + ' as the share of the catch aboard.');
  return sum;
}
function crewQuit(c, why, whyEn){ const i = S.crew.indexOf(c); if (i < 0) return; crewSettle(c); flyOut(c); S.crew.splice(i, 1); for (const o of S.crew){ if (o.grudge) delete o.grudge[c.id]; }
  msg(c.name, why || 'Jeg mønstrer av her. Det er ikke noe for meg lenger.', whyEn || 'I am signing off here. It is not for me any more.'); log(c.name + ' har mønstret av.', c.name + ' has signed off.'); if (S.cevt && (S.cevt.a === c.id || S.cevt.b === c.id)) S.cevt = null; }
// ===== Named folk on the coast (Jonas 06.11.2026): real people who have asked to be in the game, as crew to hire at their home quay =====
// Tony Hjelmseth (Jonas 06.11.2026, after his visit: «Legg inn en NPC-fisker på Husøya som heter Tony Hjelmseth … spøkefugl født 10. mai
// 1998 … jobbet på en garnbåt med fast havn på Husøy noen år … tidligere kjøpmann på butikk før han startet som røkter på
// oppdrettsanlegg, men nå er han fisker på fulltid»; then «Tony er ikke en båt, men en man skal kunne ansette som mannskap»). He stands
// on the quay in Husøy whenever the boat lies there and he is not aboard one of the company's boats, in the crew exchange like the
// others, with his own story on the card and his own lines at sea (14-crewlife.js NAMED_SAY). His age follows the game's clock.
const NAMED_CREW = [{nid:'tony', name:'Tony Hjelmseth', sex:'m', born:[1998, 5, 10], home:['Husøy', 'husoy'], yrs:4, traits:['spokefugl', 'lokalkjent'],
  attr:{erf:3, styrke:3.5, uth:3.5, tek:3, kokk:2.5, sjo:3}, gear:{juksa:2.5, line:2.5, garn:4, teiner:2.5, sloy:3, is:3, sort:2.5},
  story:['Født 10. mai 1998 på Husøy. Sto bak disken i butikken i flere år, var røkter på et oppdrettsanlegg, og har de siste årene gått på en garnbåt med fast havn på Husøy. Fisker på fulltid nå, og har en kommentar til det meste.',
    'Born 10 May 1998 on Husøy. Kept the shop counter for years, tended fish at a salmon farm, and has gone on a gillnetter out of Husøy these last years. A full-time fisher now, with a remark about most things.']}];
function namedAge(n, H){ const d = gDate(H); let a = d.getUTCFullYear() - n.born[0]; if (d.getUTCMonth() + 1 < n.born[1] || (d.getUTCMonth() + 1 === n.born[1] && d.getUTCDate() < n.born[2])) a--; return a; }
function namedMake(n){
  return crewDerive({id:'n_' + n.nid, nid:n.nid, name:n.name, sex:n.sex, age:namedAge(n, S.t / 60), home:n.home[0], homePort:n.home[1], yrs:n.yrs, attr:Object.assign({}, n.attr), gear:Object.assign({}, n.gear), traits:n.traits.slice(),
    known:[true, true], bi:false, biDays:null, ask:LOTT.hand, share:LOTT.hand, morale:66, fatigue:10, seaH:0, grudge:{}, earn:[], hiredT:S.t, story:n.story.slice()});
}
// aboard one of the company's boats already (the one you are on, or another in the fleet)
function namedTaken(nid){ const id = 'n_' + nid; if ((S.crew || []).some(c => c.id === id)) return true; for (const v of S.fleet || []) if (v.id !== S.cur && (v.crew || []).some(c => c.id === id)) return true; return false; }
function namedTick(B){
  if (!S.boat || S.boat.status !== 'port') return;
  for (const n of NAMED_CREW){ const id = 'n_' + n.nid, inPool = B.pool.find(c => c.id === id);
    if (S.boat.port !== n.home[1] || namedTaken(n.nid)){ if (inPool) inPool.until = Math.min(inPool.until, S.t + 60); continue; }   // (gone from the list an hour after she left)
    if (inPool){ inPool.until = S.t + 1440; inPool.age = namedAge(n, S.t / 60); continue; }
    const c = namedMake(n); c.until = S.t + 1440; B.pool.push(c);
    log(n.name + ' (' + c.age + ') står på kaia i ' + n.home[0] + ' og vil mønstre på. Se Mannskapsbørsen.', n.name + ' (' + c.age + ') is on the quay in ' + n.home[0] + ' and wants to sign on. See the crew exchange.'); }
}
// the job exchange: new people look for a berth every morning; fewer in the skrei season, when every boat is hiring
function borsTick(H){
  const B = S.bors || (S.bors = {pool:[], day:-1}), day = Math.floor((H + 6) / 24);
  B.pool = B.pool.filter(c => c.until > S.t);
  namedTick(B);   // the named folk at their home quay, whatever the day
  const first = B.day === -1; if (B.day === day || (!first && gDate(H).getUTCHours() < 7)) return; B.day = day;
  if (typeof alumniReturn === 'function') alumniReturn(B);
  const n = skreiSeason(H) ? (Math.random() < 0.5 ? 1 : 0) : 1 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < n + (first ? 2 : 0) && B.pool.length < 6; i++){ const c = genCrew(); c.until = S.t + (2 + Math.floor(Math.random() * 4)) * 1440; B.pool.push(c); }
}
function crewRumour(){ const B = S.bors; if (!B || Math.random() < 0.5) return null; const c = B.pool.find(x => !x.known[1] && x.traits.length > 1); if (!c) return null; c.known[1] = true; const T = TRAITS[c.traits[1]];
  return S.lang === 'no' ? 'Kjentfolk på puben sier at ' + c.name + ' fra Mannskapsbørsen er ' + T.no.toLowerCase() + '. ' + T.d.no : 'Locals at the pub say ' + c.name + ' from the crew exchange is ' + T.en.toLowerCase() + '. ' + T.d.en; }
function crewTick(H){
  if (typeof mobCrewHour === 'function') mobCrewHour();   // back aboard at a quay after the sick leave from a fall overboard; an event left behind ended, also on a vessel with only teams (Ø11.6, 14b-sikkerhet.js)
  const b = S.boat; if (!S.crew || !S.crew.length){ S.workLog = []; return; }
  S.crew = S.crew.map(crewUpgrade);
  flyTick();   // the crew flying in to Svalbard (H1b R7)
  plan2WatchTick(H);   // 2 + 2: who is on watch this hour (06h-plan2-engine.js)
  const hs = hsAt(b.pos, H), atSea = b.status === 'sailing' || b.status === 'fishing', fishing = b.status === 'fishing', hr = gDate(H).getUTCHours(), night = hr >= 22 || hr < 6;
  // the vessel's own log of hours at sea, for the crew page
  S.workLog = (S.workLog || []).concat([atSea ? 1 : 0]).slice(-24);
  const on = crewAboard(H), onIds = new Set(on.map(c => c.id)), has = t => on.filter(c => c.traits.includes(t)).length;
  // the drying room (UPGS.dry) takes the edge off the cold, as do the boat's own shelter deck and drying room; an open boat is colder (schema v2 fac, docs/batplan.md del 8)
  const F = BOAT.fac || {}, cold = coldPen(H, hs) * ((BOAT.fx && BOAT.fx.cold) || 1) * (F.shelter ? 0.75 : 1) * (F.dry ? 0.85 : 1) * (F.house === 'open' ? 1.15 : 1), food = foodScore();
  const tripH = (() => { let n = 0; for (let i = S.workLog.length - 1; i >= 0 && S.workLog[i]; i--) n++; return n; })();
  // resting ashore with the skipper (the naust or a rorbu, 15-energy.js) they come back as fast as he does: 0 to 100 in six hours in a
  // rorbu (Jonas 06.10.2026: «Så begge sover på en måte i rorbuen»)
  // and at a rorbu they sleep there too, with you or without you (tilbakemelding #11)
  const restC = meAboard() && restAshore() ? restRate(b) * 60 : b.status === 'port' && ((typeof isRorbu === 'function' && isRorbu(b.port)) || bunks(b)) ? RORBU.rate * 60 : b.anch && b.status !== 'port' && bunks(b) ? RORBU.rate * 60 * 0.85 : 0;   // (a boat with bunks rests the crew at the quay as fast as a rorbu does, Jonas 08.10.2026)
  for (const c of S.crew.slice()){
    const here = onIds.has(c.id) && atSea;
    if (typeof lifeDay === 'function'){ crewLife(c); lifeOffTick(c); lifeDay(c, H); if (!S.crew.includes(c)) continue; if (here && fishing) lifeInjury(c, hs); }   // del 2: their life beside the work (14-crewlife.js)
    // the share of the hour spent working: a break at sea tires less, but is not rest
    const wm = Object.values(c.wk || {}).reduce((a, m) => a + m, 0), workF = c.wk ? clamp(wm / 60, 0, 1) : 1;
    c.fatigue = skipOn() ? 0 : here ? clamp(c.fatigue + (fishing ? 6 : 3) * (0.4 + 0.6 * workF) * (1.4 - 0.16 * c.attr.uth) * (night ? 1.25 : 1) * ((BOAT.fx && BOAT.fx.fat) || 1) * (F.house === 'open' ? 1.1 : 1), 0, 100) : clamp(c.fatigue - Math.max(8 * (night ? 1.5 : 1), restC), 0, 100);
    if (onIds.has(c.id) && b.status !== 'port') learnHour(c);
    c.wk = {};
    if (here){ c.seaH = (c.seaH || 0) + 1; const k = c.traits.includes('laerevillig') ? 2 : 1;
      // the skills grow with the station they work (learnHour); experience grows with the hours at sea
      if (c.seaH % 40 === 0){ c.attr.erf = Math.min(5, c.attr.erf + 0.1 * k); c.attr.sjo = Math.min(5, c.attr.sjo + 0.05 * k); crewDerive(c); }
      if (!c.known[1] && c.seaH >= 12){ c.known = [true, true]; const T = TRAITS[c.traits[c.traits.length - 1]]; msg(c.name, 'Etter noen dager på sjøen vet du mer om ' + c.name + ': ' + T.no.toLowerCase() + '. ' + T.d.no, 'After some days at sea you know more about ' + c.name + ': ' + T.en.toLowerCase() + '. ' + T.d.en); } }
    // what their mood is heading towards
    let tg;
    // the share against the one asked for (a tenth of a share about 4), and the week's earnings against what a share of this boat brings in
    // an ordinary week (lotWeek)
    { tg = 60 + (isAppr(c) ? 0 : (c.share - c.ask) * 40);
      const earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).reduce((a, e) => a + e[1], 0), expect = Math.max(500, lotWeek(c, H));
      if (S.t - (c.hiredT || 0) > 3 * 1440) tg += clamp((earn - expect) / expect * 12, -12, 12); }
    if (here) tg += (food - 3) * 3 + ((BOAT.fx && BOAT.fx.mood) || 0) + (F.mess ? 3 : F.galley === 'bysse' ? 1 : 0) - (!F.wc && tripH >= 12 ? 3 : 0);   // the food on board (the last four meals), the mess and galley (built in, or UPGS.galley), no toilet on a long day
    tg -= Math.max(0, c.fatigue - 50) * 0.5; tg -= cold * 50 * (here ? 1 : 0.3);
    if (here && hs * ((BOAT.fx && BOAT.fx.sea) || 1) > 1.5) tg -= (hs * ((BOAT.fx && BOAT.fx.sea) || 1) - 1.5) * 10 * (1.2 - 0.12 * c.attr.sjo); if (here && hs > 1.2 && c.traits.includes('sjosyk')) tg -= 15;
    if (here) tg += (crewTeam().v - 50) * 0.1;   // samhold (teamHour)
    const me = t => c.traits.includes(t) ? 1 : 0; tg += 4 * (has('spokefugl') - me('spokefugl')) + 3 * (has('omsorgsfull') - me('omsorgsfull')) - 2 * (has('grinebiter') - me('grinebiter')); if (me('grinebiter')) tg -= 5;
    tg -= Object.values(c.grudge || {}).reduce((a, v) => a + v, 0) * 5; if (me('olglad') && S.pubE === pubEvening(H)) tg += 6; if (c.cpen) tg -= c.cpen;
    c.morale = clamp(c.morale + (tg - c.morale) * (me('rastlos') ? 0.07 : 0.04), 0, 100);
    for (const k in (c.grudge || {})){ c.grudge[k] = Math.max(0, c.grudge[k] - 0.01); if (c.grudge[k] <= 0) delete c.grudge[k]; }
    // someone who stays unhappy too long signs off at the next harbour
    const lim = me('rastlos') ? 30 : me('grinebiter') ? 15 : 22; c.low = c.morale < lim ? (c.low || 0) + 1 : 0;
    if (c.low > 36 && b.status === 'port'){ crewQuit(c, 'Jeg har ikke trivdes på lenge. Jeg mønstrer av her.'); continue; }
  }
  teamHour(H, on, hs, food);
  // quarrels between people, or with you as skipper; bad food makes them likelier, good food rarer, and so does a crew that pulls together
  const foodQ = (food < 2.5 ? 1.6 : food > 3.5 ? 0.7 : 1) * (1.5 - crewTeam().v / 100);
  if (!S.cevt && atSea){
    for (let i = 0; i < on.length && !S.cevt; i++) for (let j = i + 1; j < on.length && !S.cevt; j++){ const a = on[i], c2 = on[j], k = compat(a, c2); if (k > -1) continue;
      const pr = 0.004 * (-k) * (1 + (a.fatigue + c2.fatigue) / 200) * (1 + (100 - (a.morale + c2.morale) / 2) / 100) * foodQ;
      if (Math.random() < pr){ const tp = (a.traits.includes('arbeidsjern') && c2.traits.includes('makelig')) ? 'jobb' : (a.traits.includes('stolt') || c2.traits.includes('stolt')) ? 'respekt' : hs > 1.5 ? 'vaer' : ['sloying', 'musikk', 'kaffe'][Math.floor(Math.random() * 3)];
        S.cevt = {type:'pair', a:a.id, b:c2.id, topic:tp, t0:S.t}; const tx = PAIR_TOPICS[tp]; msg('Om bord', tx.no.replace('{a}', a.name).replace('{b}', c2.name) + ' Løs det under Mannskap.', tx.en.replace('{a}', a.name).replace('{b}', c2.name) + ' Sort it out under Crew.'); } }
    for (const c of on){ if (S.cevt || c.morale >= 45) continue; const tf = c.traits.some(t => ['kranglefant', 'stolt', 'grinebiter', 'rastlos'].includes(t)) ? 1.5 : 0.6;
      if (Math.random() < 0.003 * (45 - c.morale) / 20 * tf * foodQ){ const tp = !isAppr(c) && c.share < c.ask - 0.001 ? 'lott' : hs > 1.5 ? 'vaer' : cold > 0.1 ? 'kulde' : 'generelt'; S.cevt = {type:'boss', a:c.id, topic:tp, t0:S.t};
        const tx = BOSS_TOPICS[tp]; msg(c.name, tx.no.replace('{a}', c.name) + ' Svar under Mannskap.', tx.en.replace('{a}', c.name) + ' Answer under Crew.'); } }
  }
  vitalsTalk(on);
  sayHour(H, on, hs);
  if (typeof lifeHail === 'function') lifeHail(H);
  // a quarrel left alone gets worse
  if (S.cevt){ const age = S.t - S.cevt.t0, A = crewById(S.cevt.a), Bc = crewById(S.cevt.b);
    if (age > 720 && !S.cevt.esc){ S.cevt.esc = true; if (A) A.cpen = 10; if (Bc) Bc.cpen = 10; msg('Om bord', 'Krangelen om bord er ikke løst, og stemningen blir verre.', 'The quarrel aboard is not sorted out, and the mood is getting worse.'); }
    if (age > 2880){ const q = Bc || A; S.cevt = null; if (A) A.cpen = 0; if (Bc) Bc.cpen = 0; if (q) crewQuit(q, 'Når ingen tar tak i dette, mønstrer jeg av.'); } }
}
function codRoom(H){ const q = quotaState(); return Math.max(0, codLimitNow(H) - q.torsk); }

// ===== the crew fly to and from Svalbard (H1b R7, 05.11.2026; docs/planer/havsteget-h1b-rammen.md V4 B) =====
// Longyearbyen is a harbour with a yard and a tackle shop but no plant; there is no road to the mainland, so a hand who signs on there flies
// up from Tromsø and one who signs off there flies home to Tromsø. The flight: SAS flies Tromsø-Longyearbyen direct, 1 h 55 min by its
// own route page (sas.no «Fly fra Tromsø til Longyearbyen/Svalbard»; Skyscanner's mean 1 h 43 min); with an hour at the airport before
// and half an hour from Svalbard lufthavn to the quay (5 km) the journey is 3 h 25 min (FLY.min). The ticket, one way, is SAS's lowest
// fare of the month in its 2026 low-fare calendar where it was read (July 2 392 kr, November 950 kr, December 895 kr, read through a web
// search 05.11.2026: sas.no is closed to this environment); the months between are drawn straight between those three (an assumption,
// BACKLOG). The company pays the ticket both ways, booked as a crew cost (an assumption: the agreement's rule on travel is not read, BACKLOG).
const FLY = {min:205, from:'Tromsø', to:'Longyearbyen', lat:76,
  kr:[1150, 1400, 1650, 1900, 2150, 2392, 2392, 2100, 1700, 1300, 950, 895], ref:'SAS, lavpriskalender Tromsø-Longyearbyen 2026'};
// a harbour on Svalbard: the crew come and go by air there
const flyPort = pt => !!pt && !!pt.p && natLL(pt.p).lat >= FLY.lat;
const flyKr = (H = S.t / 60) => FLY.kr[gDate(H).getUTCMonth()];
// a hand signs on in a harbour on Svalbard: off the boat until the plane is in and they are at the quay; the ticket booked now
function flyIn(c){
  const pt = portById(S.boat && S.boat.port); if (!flyPort(pt) || !c) return false;
  const k = flyKr(); book('mannskap', -k, 'Flybillett ' + FLY.from + '–' + FLY.to + ', ' + c.name, 'Air ticket ' + FLY.from + '–' + FLY.to + ', ' + c.name);
  c.off = true; c.fly = {arr:S.t + FLY.min, kr:k};
  log(c.name + ' tar flyet fra ' + FLY.from + ' og er på kaia i ' + FLY.to + ' om ' + Math.floor(FLY.min / 60) + ' t ' + FLY.min % 60 + ' min. Billetten kostet ' + kr(k) + '.',
    c.name + ' takes the plane from ' + FLY.from + ' and is at the quay in ' + FLY.to + ' in ' + Math.floor(FLY.min / 60) + ' h ' + FLY.min % 60 + ' min. The ticket cost ' + kr(k) + '.');
  return true;
}
// a hand leaves the boat in a harbour on Svalbard: the ticket home to Tromsø
function flyOut(c){
  const pt = portById(S.boat && S.boat.port); if (!flyPort(pt) || !c || c.fly) return 0;
  const k = flyKr(); book('mannskap', -k, 'Flybillett ' + FLY.to + '–' + FLY.from + ', ' + c.name, 'Air ticket ' + FLY.to + '–' + FLY.from + ', ' + c.name);
  log(c.name + ' flyr hjem fra ' + FLY.to + ' til ' + FLY.from + '. Billetten kostet ' + kr(k) + '.', c.name + ' flies home from ' + FLY.to + ' to ' + FLY.from + '. The ticket cost ' + kr(k) + '.');
  return k;
}
// the plane is in: they come aboard (crewTick, each hour) the next time the boat lies at a quay; a boat that sailed before the plane was in
// picks them up at the next harbour (they travel on there at their own cost)
function flyTick(){
  const b = S.boat; if (!b || b.status !== 'port') return;
  for (const c of S.crew || []) if (c.fly && S.t >= c.fly.arr){ delete c.fly; c.off = false;
    msg(c.name, typeof crewDialect === 'function' ? crewDialect(c, 'Flyet landet. Jeg er på kaia og kommer om bord.') : 'Flyet landet. Jeg er på kaia og kommer om bord.', 'The plane is in. I am at the quay and coming aboard.'); }
}
