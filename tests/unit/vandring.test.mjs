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
  const se = at('sei', HUSOY.lat, HUSOY.lon, H(4, 15)) / K.seasonal(K.SPECIES.sei.av, H(4, 15));
  t.ok(se > 0.4 && se < 2.5, `seien på Senja i mai holder seg nær før (faktor ${se.toFixed(2)})`);

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
}
