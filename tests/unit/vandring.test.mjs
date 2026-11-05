// The distribution and the migrations (B2 of docs/planer/bestand-og-flaate.md, 03f-fiske.js): the field from the landing notes
// (areaF, fkAvail) and the curves (MIG) at real places, without the map (the place's depth, exposure and skreiSpot are given), and that
// the ocean fleet's species (herring, mackerel, snow crab) cannot be fished by the player.
export default function (t){
  const K = t.K, P = K.P, H = (m, d) => (Date.UTC(2028, m, d, 8) - K.EPOCH) / 3.6e6;
  t.ok(K.fkBuild() && K.FK.af.torsk && K.FK.af.sild, `fiske.json leses og feltet bygges (${K.FK.ms.toFixed(0)} ms)`);
  // one place: a bank of 100 m, exposed, a full skrei spot, the 2 km cell's location
  const at = (sp, lat, lon, h, skr = 1) => { const p = P(lat, lon), T = {H:h, fk:K.fkMonth(h), skf:{}}; T[sp] = {av:K.seasonal(K.SPECIES[sp].av, h), sf:1};
    return K.fkAvail(sp, {p, d:100, E:0.8, skr, c:K.lokOfCell(p)}, T); };
  const skreiPart = (lat, lon, h) => at('torsk', lat, lon, h, 1) - at('torsk', lat, lon, h, 0);
  const lok = (lat, lon) => { const c = K.lokOfCell(P(lat, lon)); return c.l >= 0 ? K.RU.lok[c.l].c : '-'; };
  const BAT = [70.72, 29.75], ROST = [67.55, 12.05], LOF = [68.13, 14.45], BERGEN = [60.42, 4.95], MORE = [62.55, 5.85], HUSOY = K.natLL(K.GROUNDS[0].p);

  // the skrei front: Båtsfjord before Røst (the day the pulse passes half of its top)
  const first = (lat, lon) => { const c = K.lokOfCell(P(lat, lon)); for (let d = 0; d < 150; d++) if (K.skreiFront(c.lat, H(0, 1) + d * 24) > 1.25) return d; return 999; };
  const db = first(...BAT), dr = first(...ROST);
  t.ok(db + 14 <= dr, `skreien er i Båtsfjord (${lok(...BAT)}) før Røst (${lok(...ROST)}): dag ${db} mot ${dr} av året, ${dr - db} dager før`);
  // at Senja's latitude the front is the game's own pulse
  t.near(K.skreiFront(HUSOY.lat, H(2, 10)), K.seasonal(K.SPECIES.torsk.skrei, H(2, 10)), 0.25, 'på Senja er skreipulsen den samme som før');
  // more skrei in Lofoten in March than in Bergen, and none in Bergen
  const sl = skreiPart(...LOF, H(2, 15)), sb = skreiPart(...BERGEN, H(2, 15));
  t.ok(sl > 0.3 && sl > 5 * sb, `mer skrei i Lofoten i mars (${sl.toFixed(2)}) enn i Bergen (${sb.toFixed(3)})`);
  t.ok(sb < 0.05, `ingen skrei i Bergen (${lok(...BERGEN)}): ${sb.toFixed(3)}`);
  t.ok(at('torsk', ...LOF, H(2, 15)) > at('torsk', ...BERGEN, H(2, 15)), 'mer torsk i Lofoten enn i Bergen i mars');
  t.ok(skreiPart(...LOF, H(2, 15)) > 3 * skreiPart(...LOF, H(6, 15)) + 0.01 || skreiPart(...LOF, H(6, 15)) < 0.01, 'skreien er borte fra Lofoten om sommeren');

  // the herring spawns off Møre in February, and is not there in July
  const sm = at('sild', ...MORE, H(1, 15)), smj = at('sild', ...MORE, H(6, 15)), sbg = at('sild', ...BERGEN, H(1, 15));
  t.ok(sm > 0.5 && sm > 4 * smj && sm > 2 * sbg, `silda er på Møre i februar (${sm.toFixed(2)}; juli ${smj.toFixed(2)}, Bergen i februar ${sbg.toFixed(2)})`);
  // the herring winters off Troms and Vesterålen
  t.ok(at('sild', 69.3, 17.0, H(11, 15)) > 4 * at('sild', 69.3, 17.0, H(6, 15)), 'silda overvintrer utenfor Troms og Vesterålen');
  // the mackerel is in Lofoten in August and not in February
  const ma = at('makrell', ...LOF, H(7, 15)), mf = at('makrell', ...LOF, H(1, 15));
  t.ok(ma > 0.2 && mf === 0, `makrellen er i Lofoten i august (${ma.toFixed(2)}) og ikke i februar (${mf})`);
  t.ok(at('makrell', 70.7, 25, H(7, 15)) < 0.2 * ma, 'makrellen når ikke Finnmark i august');
  // the snow crab is in the far north-east only
  t.ok(at('snokrabbe', ...LOF, H(5, 15)) === 0 && K.MIG.snokrabbe(72.6, 32) > 0.9, 'snøkrabben er bare nordøst i Barentshavet');
  // saithe: the notes rule where they have the location, and Senja keeps its saithe
  // since 02.11.2026 the season comes from the notes too (FK.season 'data'): Senja's saithe in May is the notes' level against Senja's
  // mean over the year, not the old table's May peak
  const se = at('sei', HUSOY.lat, HUSOY.lon, H(4, 15));
  t.ok(se > 0.1 && se < 3, `seien på Senja i mai følger sedlene (${se.toFixed(2)} mot Senjas snitt over året)`);

  // the reader: kg and landings a year by location, month, gear and length group, and by main area for the ocean fleet
  const c = K.fkCell('torsk', '00-46', 2), cg = K.fkCell('torsk', '00-46', 2, 'garn'), ch = K.fkCell('sild', '04', 0);
  t.ok(c.kg > 1e5 && c.n > 100 && cg.kg > 0 && cg.kg < c.kg, `fkCell: torsk i 00-46 i mars ${Math.round(c.kg / 1000)} t i året, ${Math.round(c.n)} landinger, garn ${Math.round(cg.kg / 1000)} t`);
  t.ok(ch.kg > 1e6, `fkCell: sild i hovedområde 04 i januar ${Math.round(ch.kg / 1000)} t i året (havflåtens vintersild utenfor Troms og Finnmark)`);

  // the ocean fleet's species: not for the player (SHELL, ALLSP and PLAYSP share SP's const line, so they are asked for by name)
  const SHELL = K.get('SHELL'), ALLSP = K.get('ALLSP'), PLAYSP = K.get('PLAYSP');
  for (const sp of ['sild', 'makrell', 'snokrabbe']){
    t.ok(K.SPECIES[sp].npc && !K.SP.includes(sp) && !SHELL.includes(sp) && !PLAYSP.includes(sp) && K.spCatchable(sp, H(7, 15)) === false,
      `${sp} kan ikke fiskes av spilleren (ikke i SP, SHELL eller Fiskeguiden, spCatchable nei)`);
  }
  // they are last in ALLSP, so no other species' seeds move: the crab is still the ninth, the Greenland halibut right before them
  t.eq(ALLSP.slice(-4), ['blakveite', 'sild', 'makrell', 'snokrabbe'], 'de nye artene ligger sist i ALLSP, etter blåkveita');
  t.eq(ALLSP.indexOf('krabbe'), 8, 'krabben er fortsatt den niende');
  K.set('S', K.newState()); t.ok(K.recList().length === PLAYSP.length && K.recList().every(r => !K.SPECIES[r.sp].npc), 'rekordene viser ikke de nye artene');

  // ---- the fish move: where the schools swim, up and down in the water, the capelin, the skrei streaming in (B2, 01.11.2026) ----
  const ang = (a, b) => Math.abs(((a - b) % 360 + 540) % 360 - 180);
  const mh = K.migHeading('torsk', 68.2, 14.5, 1.5), mo = K.migHeading('torsk', 68.2, 14.5, 4.4), mb = K.migHeading('torsk', 60.4, 5.0, 1.5);
  t.ok(mh.w > 0.5 && ang(mh.b, 225) < 30, `skreistimene i Lofoten går sørvest i februar (${mh.b.toFixed(0)}°, styrke ${mh.w.toFixed(2)})`);
  t.ok(mo.w > 0.4 && ang(mo.b, 45) < 30, `og nordøst ut igjen i slutten av april (${mo.b.toFixed(0)}°)`);
  t.ok(mb.w === 0, 'torsken i Bergen vandrer ikke (bare vimser)');
  const mk = K.migHeading('makrell', 62, 5, 6.2), sw = K.migHeading('sild', 69.5, 17, 9.6);
  t.ok(mk.w > 0.5 && ang(mk.b, 0) < 30 && sw.w > 0.4 && ang(sw.b, 45) < 45, `makrellen går nord i juli (${mk.b.toFixed(0)}°), silda nordøst mot Troms i oktober (${sw.b.toFixed(0)}°)`);
  // the heading is smooth in space (no seams at the 20 km nodes) and the schools turn without jumping
  const q0 = K.P(68.2, 14.5), kk = Math.floor(H(1, 10) / K.SCHOOL.T); let worst = 0;
  for (let i = 0; i < 40; i++){ const a = K.migDir('torsk', {x:q0.x + i * 0.5, y:q0.y + i * 0.37}, kk, K.SCHOOL.T, 1, 0), b = K.migDir('torsk', {x:q0.x + i * 0.5 + 0.05, y:q0.y + i * 0.37}, kk, K.SCHOOL.T, 1, 0); worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1])); }
  t.ok(worst < 0.01, `retningen er jevn i rommet: høyst ${worst.toFixed(4)} over 50 m`);
  let jump = 0, mean = 0, n = 0; for (let m = 0; m < 600; m++){ const h0 = H(1, 10) + m / 60, a = K.school('torsk', q0, h0), b = K.school('torsk', q0, h0 + 1 / 60); jump = Math.max(jump, Math.abs(a - b)); }
  for (let i = 0; i < 400; i++){ mean += K.school('torsk', {x:q0.x + (i % 20) * 0.13, y:q0.y + Math.floor(i / 20) * 0.17}, H(1, 10) + i * 0.7); n++; }
  t.ok(jump < 0.03 && Math.abs(mean / n - 1) < 0.05, `stimene snur uten hopp (høyst ${jump.toFixed(3)} per minutt) og gir 1 i snitt (${(mean / n).toFixed(3)})`);
  // up and down in the water: higher by night, the bottom gear by day and the floating net by night, about 1 over a day
  const hus = K.GROUNDS[0].p; let bot = 0, flt = 0, bD = 0, bN = 0; for (let h = 0; h < 24; h++){ const hh = H(2, 10) + h - 8, g = K.gearVertF('torsk', 'garn', hus, hh); bot += g; flt += K.gearVertF('sei', 'garn:flyt', hus, hh); if (h === 12) bD = g; if (h === 0) bN = g; }
  t.ok(K.vertZ('sild', 1) > 2 * K.vertZ('sild', 0) && K.vertZ('torsk', 1) > K.vertZ('torsk', 0), 'silda og torsken står høyere i vannet om natta');
  t.ok(bD > bN && Math.abs(bot / 24 - 1) < 0.08 && Math.abs(flt / 24 - 1) < 0.25, `bunngarnet tar mer torsk om dagen (${bD.toFixed(2)} mot ${bN.toFixed(2)} om natta), snittet over døgnet ${(bot / 24).toFixed(2)}; flytegarnet ${(flt / 24).toFixed(2)}`);
  let bmax = 0, bnoon = K.biteF('torsk', hus, H(5, 21) + 3); for (let h = 0; h < 24; h += 0.25) bmax = Math.max(bmax, K.biteF('torsk', hus, H(2, 10) - 8 + h));
  t.ok(bmax > 1.1 && bnoon < 1.09, `juksa biter best i skumringen (${bmax.toFixed(2)}), midt på dagen som før, bortsett fra stille strøm (${bnoon.toFixed(2)})`);
  // the capelin: in Finnmark the cod's spring comes later than the skrei front alone, in March-April
  const cB = K.lokOfCell(K.P(...BAT)), cL = K.lokOfCell(K.P(...LOF)), pb = K.skreiPulse(cB, H(3, 10)), pf = K.skreiFront(cB.lat, H(3, 10)), pl = K.skreiPulse(cL, H(3, 10));
  t.ok(pb > pf + 0.3 && pb > pl, `lodda trekker torsken inn til Finnmark i april (${pb.toFixed(2)} mot skreifronten alene ${pf.toFixed(2)}, Lofoten ${pl.toFixed(2)})`);
  let iB = 0, iS = 0; for (let d = 0; d < 150; d++){ iB += K.skreiPulse(cB, H(0, 1) + d * 24); iS += K.skreiFront(K.MIG.latRef, H(0, 1) + d * 24); }
  t.ok(Math.abs(iB / iS - 1) < 0.2, `lodda flytter torsken i tid, ikke mengden over våren (${(iB / iS).toFixed(2)} mot Senja)`);
  // the skrei streams in: a fished cell on its way fills faster while it passes, not in summer and not in Bergen
  const kOf = (lat, lon) => { const p = K.P(lat, lon); return K.gridKey(Math.floor(p.x / 2), Math.floor(p.y / 2)); };
  const fl = K.skreiFlow(kOf(...LOF), H(2, 15)), fj = K.skreiFlow(kOf(...LOF), H(6, 15)), fb = K.skreiFlow(kOf(...BERGEN), H(2, 15));
  t.ok(fl > 0.1 && fj < 0.02 && fb === 0, `skreien strømmer inn i Lofoten i mars (${fl.toFixed(2)}), ikke i juli (${fj.toFixed(2)}) eller i Bergen (${fb})`);

  // the current and the weather (B4): cod bites a little better at slack water; in a gale the bottom fish come off the bottom
  let slack = 0, run = 1e9; for (let m = 0; m < 24 * 60; m += 10){ const h = H(5, 21) + 3 + m / 60, b = K.biteF('torsk', hus, h); if (b > slack) slack = b; if (b < run) run = b; }
  t.ok(slack > run * 1.04 && slack < 1.1, `torsken biter litt bedre i stille strøm midt på dagen (${run.toFixed(3)} til ${slack.toFixed(3)})`);
  const calm = K.gearVertF('torsk', 'garn', hus, H(5, 21) + 4), wind0 = K.windAt; let gale;
  K.set('windAt', () => 22); gale = K.gearVertF('torsk', 'garn', hus, H(5, 21) + 5); K.set('windAt', wind0);
  t.ok(gale < calm, `i storm står bunnfisken høyere, og bunngarnet tar mindre (${calm.toFixed(2)} → ${gale.toFixed(2)})`);

  // the coastal cod's own stock (ICES 2026): north of 67° N it fell to 2023 and came back in 2024-2025; 62-67° N is low and level
  const Hy = yy => (Date.UTC(yy, 6, 1) - K.EPOCH) / 3.6e6;
  t.ok(K.kystF(69.5, Hy(2023)) < 0.92 && Math.abs(K.kystF(69.5, Hy(2025)) - 1) < 0.08 && K.kystF(69.5, Hy(2014)) > 1.1, `kysttorsken nord for 67° N følger ICES: ${[2014, 2023, 2025, 2030].map(yy => K.kystF(69.5, Hy(yy)).toFixed(2)).join(' / ')} (2014, 2023, 2025, 2030)`);
  t.ok(Math.abs(K.kystF(64, Hy(2030)) - 1) < 0.08 && K.kystF(64, Hy(2012)) > 1.25 && K.kystF(60.4, Hy(2014)) === 1, `62-67° N var sterkere i 2012 (${K.kystF(64, Hy(2012)).toFixed(2)}) og holder nivået; sør for 62° N har spillet ingen serie`);

  // H1b R6: the fields off the coast. Where the coastal fleet has no figure, the ocean fleet's notes (the h table) give one: cod at
  // Bjørnøya (main area 20) and west of Spitsbergen (21), snow crab on the Central Bank (15) and north-east of Svalbard (24); the
  // coast's figures are the same as before (they are filled only where the coast left nothing)
  const cell = (sp, lat, lon, m) => { const c = K.lokOfCell(P(lat, lon)), F = K.FK.af[sp]; return c.l >= 0 ? K.fkAt(F.m, c.l, K.fkMonth(H(m, 15))) : NaN; };
  const BJ = [74.3, 22.0], SPV = [77.5, 10.5], SENT = [75.5, 35.0], NE = [79.0, 34.0];
  const bj = [0, 3, 6, 9].map(m => cell('torsk', ...BJ, m)), sv = [6, 9].map(m => cell('torsk', ...SPV, m));
  t.ok(bj.every(v => v > 0) && sv.some(v => v > 0), `torsken har tall ved Bjørnøya (${lok(...BJ)}: ${bj.map(v => v.toFixed(2)).join(' ')}) og vest av Spitsbergen (${lok(...SPV)}: ${sv.map(v => v.toFixed(2)).join(' ')})`);
  const sk = [1, 3].map(m => at('snokrabbe', ...SENT, H(m, 15))), skn = at('snokrabbe', ...NE, H(2, 15));
  t.ok(sk.every(v => v > 0.05) && skn > 0.05 && at('snokrabbe', ...BAT, H(2, 15)) === 0, `snøkrabben er på Sentralbanken (${lok(...SENT)}: ${sk.map(v => v.toFixed(2)).join(' ')}) og nordøst for Svalbard (${lok(...NE)}: ${skn.toFixed(2)}), ikke i Båtsfjord`);
  // the herring feeds in the Norwegian Sea in summer (out there, nothing in winter)
  const nh = at('sild', 68.5, 0, H(6, 15)), nw = at('sild', 68.5, 0, H(0, 15));
  t.ok(nh > 3 * nw, `silda beiter i Norskehavet om sommeren (juli ${nh.toFixed(2)}, januar ${nw.toFixed(2)})`);
  // the capelin's spring is the coast's: not out in the Barents Sea at Bjørnøya
  t.ok(K.MIG.loddeW(...BAT) > 0.4 && K.MIG.loddeW(...BJ) === 0, 'loddetorsken er langs kysten av Finnmark, ikke ute ved Bjørnøya');
}
