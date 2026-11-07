// The fishing data (B1 of docs/planer/bestand-og-flaate.md, tools/npc/fiske.py → src/data/fiske.json): the sums per species and year
// against Fiskeridirektoratet's own figures, the cells against the totals, every location against rules.json, the size, and that only
// statistics are written. Reads the JSON files; needs no core.
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data');

// Fiskeridirektoratet, «Vekestatistikk for utvalde artar», veke 53 2025 (veke-53-2025.xlsx, fiskeridir.no → Tall og analyse → Fangst →
// Vekestatistikk for utvalgte arter, hentet 01.11.2026): «Sum kvotebelastning 2025» and «Fangst t.o.m. uke 53 2024», tonnes, north of
// 62° N (Greenland halibut: the Northeast Arctic stock). The set-asides for leisure and youth fishing are a fixed number in the table,
// not landing notes, so they are taken off: torsk 7 000 t (the table says 780 t of it were registered in 2025), hyse 300 t, sei 2 000 t.
const FDIR = {
  2025: {torsk_n62: 172147 - 7000, hyse_n62: 66950 - 300, sei_n62: 141826 - 2000, blakveite_nea: 9474, lange_n62: 9261, brosme_n62: 9723},
  2024: {torsk_n62: 207447 - 7000, hyse_n62: 71435 - 300, sei_n62: 171100 - 2000, blakveite_nea: 10452, lange_n62: 10144, brosme_n62: 9305},
};
// the quota counts and the notes are not quite the same thing (quota flexibility between the years, estimates for the fresh-fish and
// coastal schemes from Råfisklaget), so 1 %; ling, tusk and Greenland halibut meet the table to the tonne
const TOL = 0.01;
// Fiskeridirektoratet's official statistics, table F.06.002 «Fangst av norske fartøy etter landingsnasjon, art og redskap (2000-2025)»
// (statistikkbanken.fiskeridir.no, PxWeb, updated 18.06.2026, hentet 01.11.2026): rundvekt in tonnes, all landing nations, all gear, all
// areas, summed over the species codes (taskekrabbe: 0502001-0502003, kongekrabbe: 0503001 and 0504002). Every species of fiske.json.
const FDIR_TOT = {
  2024: {torsk: 207809, hyse: 74354, sei: 196841, lyr: 2772, lange: 17319, brosme: 13265, uer: 8948, kveite: 4065, blakveite: 14423,
         krabbe: 3988, kongekrabbe: 1526, sild: 259031, makrell: 250187, snokrabbe: 10462},
  2025: {torsk: 170945, hyse: 69900, sei: 175989, lyr: 2267, lange: 15635, brosme: 12853, uer: 10196, kveite: 2673, blakveite: 12246,
         krabbe: 3780, kongekrabbe: 2391, sild: 258730, makrell: 156234, snokrabbe: 13431},
};

export default function (t){
  const file = join(SRC, 'fiske.json'), F = JSON.parse(readFileSync(file, 'utf8')), M = F.meta;
  const R = JSON.parse(readFileSync(join(SRC, 'rules.json'), 'utf8'));
  const lok = new Set(R.lok.map(x => x.c)), hom = new Set(R.hom.map(x => x.c));
  const kb = statSync(file).size / 1000;
  t.ok(kb < 400, `fiske.json er under 400 kB (${kb.toFixed(0)} kB)`);
  t.eq(M.ny, M.years.length, 'ny er antall år');

  // the sums against Fiskeridirektoratet's own figures, for the years the file has
  for (const y of M.years){
    const ref = FDIR[y];
    if (!ref){ t.note(`ingen tall fra Fiskeridirektoratet i testen for ${y}: legg dem inn fra ukestatistikken for uke 52/53`); continue; }
    for (const [k, tonnes] of Object.entries(ref)){
      const got = (M.chk[y] || {})[k] / 1000;
      t.ok(Math.abs(got / tonnes - 1) <= TOL, `${k} ${y}: ${Math.round(got)} t mot Fiskeridirektoratets ${tonnes} t (±${TOL * 100} %)`);
    }
  }
  // every species and year against the official statistics (the notes are updated after the table was made, so 1 %)
  for (const y of M.years){
    const ref = FDIR_TOT[y];
    if (!ref){ t.note(`ingen årstall fra statistikkbanken i testen for ${y}: legg dem inn fra tabell F.06.002`); continue; }
    for (const [s, tonnes] of Object.entries(ref)){
      const got = (M.tot[s] || {})[y] / 1000;
      t.ok(Math.abs(got / tonnes - 1) <= TOL, `${s} ${y}: ${Math.round(got)} t mot Fiskeridirektoratets årstall ${tonnes} t (±${TOL * 100} %)`);
    }
  }
  // every species: the cells hold all the kilos of the totals (the small cells are joined, not dropped; kg has three figures)
  const SPECIES = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'blakveite', 'krabbe', 'kongekrabbe', 'sild', 'makrell', 'snokrabbe'];
  for (const s of SPECIES){
    const o = F.sp[s]; let kg = 0, n = 0, bad = 0;
    for (const tab of ['k', 'h']) for (const [a, ms] of o[tab]){
      if (ms.length !== 12) bad++;
      if (!(a >= 0 && a < (tab === 'k' ? M.lok : M.hom).length)) bad++;
      for (const c of ms){ if (c.length % 3) bad++; for (let i = 0; i < c.length; i += 3){ kg += c[i + 1]; n += c[i + 2]; if (c[i] < 0 || c[i] >= 54 || c[i + 2] < 1) bad++; } }
    }
    const want = Object.values(M.tot[s]).reduce((a, b) => a + b, 0);
    t.ok(want > 0 && Math.abs(kg / want - 1) < 0.002, `${s}: cellene summerer til totalen (${Math.round(kg / 1000)} mot ${Math.round(want / 1000)} t over ${M.ny} år)`);
    t.eq(bad, 0, `${s}: alle celler har område, 12 måneder, redskap × 6 + lengde og minst én landing`);
  }
  // the places: every location is one of rules.json's 578, every main area is in rules.json or listed as outside it
  t.eq(M.lok.filter(c => !lok.has(c)), [], 'alle lokasjonene i fiske.json finnes i rules.json');
  t.eq(M.hom.filter(c => !hom.has(c) && !M.homOut.includes(c)), [], 'alle hovedområdene finnes i rules.json eller står i homOut');
  t.ok(M.homOut.every(c => !hom.has(c)), `homOut er bare områdene utenfor rules.json (${M.homOut.join(', ')})`);
  // the coast fleet in the game's waters: Lofoten (00), Røstbanken–Malangsgrunnen (05), Vest-Finnmark (04), Møre (07) have cod
  for (const c of ['00-', '05-', '04-', '07-']) t.ok(M.lok.some(x => x.startsWith(c)), `kystflåten har lokasjoner i hovedområde ${c.slice(0, 2)}`);
  // the coverage, measured: the share of the coast fleet's locations with landings each month (meta.coverUsed; meta.cover is of all 578)
  for (const s of ['torsk', 'sei', 'hyse']) t.ok(M.coverUsed[s].length === 12 && M.coverUsed[s].every(v => v > 0.4), `${s}: over 40 % av kystlokasjonene har landinger hver måned (${M.coverUsed[s].map(v => Math.round(v * 100)).join(' ')} %)`);

  // the boats: the register's count, the share active (Fiskeridirektoratet: 4 989 registered and 89 % active at the end of 2025,
  // «Offisiell statistikk om fiskefartøy», fiskeridir.no), and every kommune a four-digit number
  const B = M.boats; let reg = 0, act = 0, res = 0; const badKom = [];
  for (const [knr, rows] of Object.entries(F.kom)){
    if (!/^\d{4}$/.test(knr)) badKom.push(knr);
    for (const [lg, g, r, a, rv] of rows){ reg += r; act += a; res += rv; if (lg < 0 || lg > 4 || g < 0 || g > 8) badKom.push(knr + ':' + lg + '/' + g); }
  }
  t.eq(badKom, [], `alle ${Object.keys(F.kom).length} kommunene har fire sifre, gyldig lengdegruppe og redskap`);
  t.eq([reg, act, res], [B.registered, B.active, B.reserve], 'kommunene summerer til registeret');
  t.ok(Math.abs(B.registered / 4989 - 1) < 0.05, `registeret har ${B.registered} fartøy (Fiskeridirektoratet: 4 989 ved utgangen av 2025, ±5 %)`);
  t.ok(B.active / B.registered > 0.84 && B.active / B.registered < 0.94, `${Math.round(B.active / B.registered * 100)} % av registeret hadde landinger siste år (Fiskeridirektoratet: 89 %)`);

  // only statistics: the top level and the meta keys are the ones the script writes, and the kommune names are names, not vessels
  t.eq(Object.keys(F).sort(), ['kn', 'kom', 'meta', 'snok', 'sp'], 'fiske.json har bare meta, sp, kom, kn og snøkrabben per lokasjon (snok, H3a)');
  // (H3a) the snow crab by location: only statistics (location codes, kilos, landings), no vessels
  t.ok(F.snok.lok.length > 20 && F.snok.lok.every(r => /^\d\d-\d\d$/.test(r[0]) && r[1].length === 12 && r[2].length === 12) && Object.keys(F.snok.meta).sort().join() === 'frozen,last,live,n,src,sz,unit,years',
    `snok: ${F.snok.lok.length} lokasjoner med kilo og landinger per måned, ingen fartøy`);
  t.ok(Object.values(F.kn).every(n => /^[A-ZÆØÅa-zæøåáčđŋšŧžÁČĐŊŠŦŽ .'-]+$/.test(n)) && Object.keys(F.kn).every(k => k in F.kom), 'kn er bare kommunenavn for kommunene i kom');
  t.ok(!/[A-ZÆØÅ]{1,2} ?\d{4}[A-ZÆØÅ]{1,2}\b|Fartøynavn|Mottaker/.test(readFileSync(file, 'utf8')), 'ingen registreringsmerker eller fartøy- og kjøperfelt i fila');
}
