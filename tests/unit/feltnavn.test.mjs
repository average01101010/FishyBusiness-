// The names of the fishing grounds in the texts (Ø14 F3 of docs/planer/fangstfelt.md, 11.11.2026; core/01-world.js feltNameAt, placeAt,
// feltNear, nearestPlace; 09b-records.js recPlace; 06-services.js rumourAt, feltSeasonIn, newsForDay; 09g-turer.js turLetePlace;
// 14-crewlife.js alumniGround): Fiskeridirektoratet's grounds along the whole coast name the place, the pub's rumour and the paper's
// local stories are from the grounds near the harbour, and Senja's six names of the game's own (GROUNDS) are in no text.
// Seen red against the code before F3 (git stash of src/): nearestPlace on Bjørnvika gave «2,7 nm fra Båtsfjord»-like harbour distances,
// the rumour had no rumourAt (Husøy's grounds everywhere), and GROUNDS' names were read in five files.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const HOUR = (y, m, d, h) => (Date.UTC(y, m - 1, d, h) - Date.UTC(2027, 2, 1, 6)) / 3.6e6;

export default function (t){
  const K = t.K, D = K.feltData(), FELT = K.get('FELT'), FW = K.FELTW, NM = K.NM;
  K.set('S', K.newState());
  globalThis.fmt = (v, d) => v.toFixed(d).replace('.', ',');   // (the page's number format is in ui/)
  const bytes = Uint8Array.from(Buffer.from(readFileSync(join(SRC, 'data', 'felt-s.b64'), 'utf8').trim(), 'base64'));
  FELT.S = K.feltShapesFrom(bytes); FW.G = null; FW.on = true;
  const has = n => typeof K[n] === 'function';
  if (!has('feltNameAt') || !has('placeAt') || !has('feltNear') || !has('rumourAt') || !has('feltSeasonIn')){ t.ok(false, 'feltNameAt, placeAt, feltNear, rumourAt eller feltSeasonIn finnes ikke: Ø14 F3 er ikke bygd'); }
  const G = K.feltGeo(), F = D.filter(f => f.k === 'f' && f.n), port = id => K.portById(id), dPort = p => Math.min(...K.PORTS.map(q => Math.hypot(q.p.x - p.x, q.p.y - p.y)));
  const GN = K.GROUNDS.flatMap(g => [g.name.no, g.name.en]), OWN = GN.filter(n => !F.some(f => f.n === n || f.nf === n)), hasGN = s => OWN.some(n => String(s).toLowerCase().includes(n.toLowerCase()));   // (Solbergfjorden and Malangsgapet may also be grounds of Fiskeridirektoratet's)

  // 1. nearestPlace and recPlace on Bjørnvika by Båtsfjord (the ground of the plan's example): the ground, not the miles from a harbour
  const line = (f, sp) => f.l.find(q => q[0] === sp), SNV = 1 << FELT.gear.indexOf('snurrevad');
  const bjo = D.find(f => f.k === 'f' && f.n === 'Bjørnvika' && line(f, 'torsk') && (line(f, 'torsk')[1] & SNV)), bj = {x:bjo.x, y:bjo.y};
  // (Bjørnvika had the same ring twice in felt-s.b64 until Ø14 F3-rest, 12.11.2026, so by the even-odd rule of feltSd nothing was
  // inside it and the point was «ved Bjørnvika»; tools/npc/felt.py now writes the union of a ground's polygons, and the ground's own
  // point lies inside it: «på». Seen red against the data before: «ved Bjørnvika», feltSd −0.57.)
  const nb = K.nearestPlace(bj), bg = G.find(g => g.f === bjo);
  t.ok(bg && bg.R && bg.R.length === 1 && K.feltSd(bg, bj.x, bj.y) > 0, `Bjørnvikas punkt ligger inne i feltets ene ring (${bg && bg.R ? bg.R.length : 0} ringer, feltSd ${bg ? K.feltSd(bg, bj.x, bj.y).toFixed(2) : '–'} km)`);
  t.ok(nb.no === 'på Bjørnvika' && nb.en === 'at Bjørnvika' && dPort(bj) > 1.5 * NM, `nearestPlace på Bjørnvika (${dPort(bj).toFixed(1)} km fra nærmeste havn) gir feltet: «${nb.no}» / «${nb.en}»`);
  t.eq(K.recPlace(bj), 'Bjørnvika', 'recPlace på Bjørnvika gir feltets navn');
  // a ground with a whole outline (Makkaur-sandfjorden by Båtsfjord), a point well inside it: «på»
  const mak = G.find(g => g.f.n === 'Makkaur-sandfjorden'); let bp = {x:mak.f.x, y:mak.f.y};
  for (let k = 0; k < 400 && !(K.feltSd(mak, bp.x, bp.y) > 0.2 && dPort(bp) > 0.5 * NM && (!has('feltNameAt') || K.feltNameAt(bp).f === mak.f)); k++) bp = {x:mak.b[0] + (mak.b[2] - mak.b[0]) * K.hash(k * 2 + 11), y:mak.b[1] + (mak.b[3] - mak.b[1]) * K.hash(k * 2 + 12)};
  const np = K.nearestPlace(bp);
  t.ok(K.feltSd(mak, bp.x, bp.y) > 0 && np.no === 'på Makkaur-sandfjorden' && np.en === 'at Makkaur-sandfjorden', `inne i omrisset av Makkaur-sandfjorden (${dPort(bp).toFixed(1)} km fra nærmeste havn): «${np.no}» / «${np.en}»`);
  t.eq(K.recPlace(bp), 'Makkaur-sandfjorden', 'og rekorden står på feltet');
  // 2. by a ground (outside its outline, within 1.5 nm, no harbour nearer), far from everything, and in a harbour that lies on a ground
  let by = null, far = null, inH = null;
  if (has('feltNameAt')){
    for (const g of G){ if (by || !g.f.n) continue; for (let a = 0; a < 8 && !by; a++){ const p = {x:g.b[2] + 1.2 * Math.cos(a), y:(g.b[1] + g.b[3]) / 2 + 1.2 * Math.sin(a)}, q = K.feltNameAt(p); if (q && !q.on && q.d > 0.5 && q.d < 2 && dPort(p) > q.d + 1) by = {p, q}; } }
    const pb = by && K.nearestPlace(by.p);
    t.ok(by && pb.no === 'ved ' + by.q.n && pb.en === 'near ' + by.q.n, `${by ? by.q.d.toFixed(1) : '–'} km utenfor omrisset av ${by && by.q.n}, havna lenger unna: «${pb && pb.no}»`);
    for (let i = 0; i < 4000 && !far; i++){ const p = {x:200 + 900 * K.hash(i * 3 + 1), y:100 + 1500 * K.hash(i * 3 + 2)}; if (!K.feltNameAt(p) && dPort(p) > 1.5 * NM && dPort(p) < 60) far = p; }
    const pf = far && K.nearestPlace(far);
    t.ok(far && / nm fra /.test(pf.no) && / nm from /.test(pf.en) && K.recPlace(far) !== undefined, `uten felt innen 1,5 nm står milene fra havna som før: «${pf && pf.no}»`);
    for (const pt of K.PORTS){ const q = K.feltNameAt(pt.p); if (q && q.on){ inH = pt; break; } }
    const ph = inH && K.nearestPlace(inH.p);
    t.ok(inH && ph.no === 'ved ' + inH.name, `i en havn som ligger på et felt (${inH && inH.name}, på ${inH && K.feltNameAt(inH.p).n}), vinner havna: «${ph && ph.no}»`);
    // of several grounds over one point, the smallest names it
    let multi = null; for (const f of F){ const fl = K.feltAt({x:f.x, y:f.y}); if (!fl) continue; const on = fl.F.filter((g, i) => fl.m[i] > 0.5 && g.f.n); if (on.length > 1){ multi = {f, on}; break; } }
    const mq = multi && K.feltNameAt({x:multi.f.x, y:multi.f.y});
    t.ok(multi && mq.f.r === Math.min(...multi.on.map(g => g.f.r)), `der flere felt dekker punktet, gir det minste navnet (${multi && multi.on.map(g => g.f.n + ' ' + g.f.r).join(', ')} → ${mq && mq.n})`);
    // a name the chart cut is whole in a text
    const cut = F.find(f => f.n.endsWith('…')); t.ok(cut && K.feltName(cut) === cut.nf && !K.feltName(cut).endsWith('…'), `et navn kartet kortet, står helt i teksten («${cut && cut.n}» → «${cut && K.feltName(cut)}»)`);
  }
  // a name that is a description takes no «på» or «ved»
  if (has('feltPa')){ const a = K.feltPa('Sør av Vallosen'), b = K.feltPa('Bjørnvika'), c = K.feltPa('Utenfor Mefjorden'), d = K.feltPa('Nordsida');
    t.ok(a.no === 'sør av Vallosen' && b.no === 'på Bjørnvika' && b.en === 'at Bjørnvika' && c.no === 'utenfor Mefjorden' && d.no === 'på Nordsida', `feltPa: «${a.no}», «${b.no}», «${c.no}», «${d.no}»`);
    const desc = F.filter(f => K.feltDesc(K.feltName(f))); t.ok(desc.length > 20 && desc.length < 600, `${desc.length} av ${F.length} feltnavn er beskrivelser (${desc.slice(0, 4).map(f => '«' + K.feltName(f) + '»').join(', ')})`);
    // by a harbour (within half a mile) the harbour names the place also when a ground's outline is nearer
    let hb = null; for (const pt of K.PORTS){ if (pt.sted && pt.coastal && !pt.mottak) continue; for (let a2 = 0; a2 < 12 && !hb; a2++){ const p = {x:pt.p.x + 0.6 * Math.cos(a2), y:pt.p.y + 0.6 * Math.sin(a2)}, q = K.feltNameAt(p); if (q && !q.on && q.d < 0.5 && dPort(p) > q.d) hb = {pt, p, q}; } if (hb) break; }
    t.ok(hb && K.placeAt(hb.p).felt === null && K.nearestPlace(hb.p).no.startsWith('ved '), `0,6 km fra ${hb && hb.pt.name} og ${hb && hb.q.d.toFixed(2)} km fra omrisset av ${hb && hb.q.n}: «${hb && K.nearestPlace(hb.p).no}»`); }
  else t.ok(false, 'feltPa finnes ikke');
  // 3. Senja's six points: the place is one of Fiskeridirektoratet's grounds or a harbour, never one of the game's own six names
  const six = K.GROUNDS.map(g => K.nearestPlace(g.p).no + ' | ' + K.recPlace(g.p));
  t.ok(!six.some(hasGN), `på Senjas seks punkter står ingen av de seks gamle navnene: ${six.join('; ')}`);

  // 4. the pub's rumour, in a made-up sea (Node has no map: water everywhere, 40-200 m)
  const sea = p => 40 + 160 * K.noise2(p.x / 6, p.y / 6, 3);
  K.set('isLand', () => false); K.set('isLandFar', () => false); K.set('depthF', sea); K.set('offDepth', sea); K.set('expoFar', p => 60 + 150 * K.noise2(p.x / 9, p.y / 9, 4));
  const PL = [['Bergen', 60.4, 5.3], ['Bodø', 67.28, 14.4], ['Båtsfjord', 70.63, 29.72], ['Husøy', 69.55, 17.67]];
  const nearPort = (lat, lon) => { const c = K.P(lat, lon); return K.PORTS.filter(q => q.mottak).sort((a, b) => Math.hypot(a.p.x - c.x, a.p.y - c.y) - Math.hypot(b.p.x - c.x, b.p.y - c.y))[0]; };
  if (has('rumourAt')) for (const [nm, lat, lon] of PL){ const pt = nearPort(lat, lon), names = new Set(); let ok = true, n = 0;
    for (const [m, d] of [[1, 15], [3, 15], [5, 15], [7, 15], [9, 15], [11, 15]]){ const H = HOUR(2027, m, d, 18), r = K.rumourAt(pt, H); if (!r) continue; n++;
      const dk = Math.hypot(r.f.x - pt.p.x, r.f.y - pt.p.y), g = G.find(q => q.f === r.f), mo = m - 1;
      const inS = K.feltNear(pt.p, 20).some(q => Object.keys(q.g.sm).some(sp => ((q.g.sm[sp] >> mo) & 1) && !K.SPECIES[sp].npc && K.feltLawful(sp, q.p, H)));   // (no ground near in season, as by Båtsfjord in March: the jig's species all the same)
      if (!(dk <= 20 && r.f.k === 'f' && r.n && (((g.sm[r.sp] >> mo) & 1) || !inS) && K.feltLawful(r.sp, r.p, H) && K.feltSd(g, r.p.x, r.p.y) > 0 && !hasGN(r.n))) ok = false; names.add(r.n + ' (' + r.sp + ')'); }
    t.ok(ok && n === 6, `ryktet i ${pt.name} (${nm}) nevner et felt innen 20 km, med arten i måneden der et felt har en, ${n} av 6 måneder: ${[...names].join(', ')}`); }
  if (has('rumourAt')){ const be = nearPort(60.4, 5.3), hu = K.portById('husoy'), H = HOUR(2027, 3, 15, 18), a = K.rumourAt(be, H), b = K.rumourAt(hu, H);
    t.ok(a && b && a.f !== b.f && Math.hypot(a.f.x - hu.p.x, a.f.y - hu.p.y) > 500, `ryktet i ${be.name} er ikke fra Senja (${a && a.n}; på Husøy: ${b && b.n})`);
    t.eq(K.rumourAt(null, H), null, 'uten havn: ikke noe rykte'); }

  // 5. the paper: thin fishing and the season's coming on grounds near the home harbour, at most one season story a week, never one of
  // Senja's six names; a year from each of four homes
  if (has('feltSeasonIn')){
    const S0 = K.get('S'); S0.stock = S0.stock || {};
    for (const [nm, lat, lon] of PL){ const pt = nearPort(lat, lon); S0.home = pt.id; const near = new Set(K.feltNear(pt.p, 20).map(q => q.n));
      let thin = 0, seas = [], bad = [], gn = 0; const d0 = Math.floor(HOUR(2027, 1, 1, 0) / 24);
      for (let d = d0; d < d0 + 365; d++) for (const s of K.newsForDay(d)){ const h = s.h.no; if (hasGN(h) || hasGN(s.b.no) || hasGN(s.h.en)) gn++;
        const m1 = /^Tynt fiske på (.+)$/.exec(h), m2 = /^Skreia er kommet til (.+)$/.exec(h) || /^Sesongen for \S+ er i gang på (.+)$/.exec(h), m3 = !m2 && /^Sesongen for \S+ er i gang (.+)$/.exec(h);
        if (m3){ seas.push(d); if (![...near].some(n => n.toLowerCase() === m3[1].toLowerCase())) bad.push(h); }
        if (m1){ thin++; if (!near.has(m1[1])) bad.push(h); } if (m2){ seas.push(d); if (!near.has(m2[1])) bad.push(h); if (/\d/.test(s.b.no.replace(m2[1], ''))) bad.push('tall: ' + s.b.no); } }
      const gap = seas.slice(1).map((d, i) => d - seas[i]);
      t.ok(bad.length === 0 && gn === 0 && gap.every(g => g >= 7), `Kystposten med hjemmehavn ${pt.name} (${nm}), ett år: ${thin} «Tynt fiske på» og ${seas.length} sesongsaker, alle på felt innen 20 km (${near.size} felt), minst sju dager mellom sesongsakene, ingen av Senjas seks navn${bad.slice(0, 3).map(q => ' «' + q + '»').join('')}`); }
    // thin fishing: a ground by Husøy fished hard (the stock taken down on it) is the one the paper names, on a third day
    { const hu = K.portById('husoy'); S0.home = 'husoy'; const q = K.feltNear(hu.p, 20).find(k => K.FELTW.jig.some(sp => k.g.sm[sp] === 4095));
      for (let i = 0; i < 400; i++) K.takeStock(q.p, 5000, 'torsk', true);
      let d = Math.floor(HOUR(2027, 6, 1, 0) / 24); while (d % 3) d++; const hs = K.newsForDay(d).map(s => s.h.no).filter(h => /^Tynt fiske på /.test(h)), v = K.stockAt(q.p, 'torsk', d * 24 + 12);
      t.ok(v < 0.62 && hs.length === 1 && K.feltNear(hu.p, 20).some(k => hs[0] === 'Tynt fiske på ' + k.n), `et felt ved Husøy fisket hardt (${q.n}, bestanden ${v.toFixed(2)}): «${hs[0]}», og ingen slik sak dagen etter (${K.newsForDay(d + 1).filter(s => /^Tynt/.test(s.h.no)).length})`); }
    // «Skreia er kommet til …» for cod January-April north of 62° N (seen red with natLL given two numbers: never printed), and never
    // south of it
    { const yr = id => { S0.home = id; const d0 = Math.floor(HOUR(2027, 1, 1, 0) / 24), hs = []; for (let d = d0; d < d0 + 365; d++) for (const s of K.newsForDay(d)) hs.push(s.h.no); return hs; };
      const hu = yr('husoy').filter(h => /^Skreia er kommet til /.test(h)), be = yr(nearPort(60.4, 5.3).id).filter(h => /^Skreia er kommet til /.test(h));
      t.ok(hu.length >= 1 && be.length === 0, `«Skreia er kommet til …» står i avisa på Husøy (${hu.length} i året: ${hu.slice(0, 2).join('; ')}) og ikke ved Bergen (${be.length})`); }
    // a species the rules close is not announced: the halibut by Bodø comes into the fishermen's months in April, inside the closed
    // season (to 20 April), and the redfish outside 1 June-31 August
    { const bo = nearPort(67.28, 14.4), near = K.feltNear(bo.p, 20), bad = [];
      for (let mo = 0; mo < 12; mo++){ const H = HOUR(2027, mo + 1, 1, 12), all = K.feltSeasonIn(near, mo), law = K.feltSeasonIn(near, mo, H);
        for (const e of law) if (K.rulesAt({p:e.q.p, H, len:10, gear:'juksa', sp:e.sp}).v === 'no') bad.push(e.sp + ' ' + (mo + 1)); if (law.length > all.length) bad.push('flere'); }
      const apr = K.feltSeasonIn(near, 3).filter(e => e.sp === 'kveite').length, aprL = K.feltSeasonIn(near, 3, HOUR(2027, 4, 1, 12)).filter(e => e.sp === 'kveite').length;
      t.ok(bad.length === 0 && apr > 0 && aprL === 0, `sesongsaken nevner ikke en art reglene stenger: kveita ved Bodø 1. april ${apr} felt uten regelsjekken, ${aprL} med (${bad.join(', ')})`);
      t.ok(K.feltLawful('torsk', bo.p, HOUR(2027, 3, 1, 12)) && !K.feltLawful('kveite', bo.p, HOUR(2027, 2, 1, 12)), 'feltLawful: torsk ved Bodø i mars ja, kveite i februar nei'); }
    // the season's coming: the month's bit set and the month before's not
    const near = K.feltNear(K.portById('husoy').p, 40), gry = near.find(q => q.f.n === 'Gryllefjorden');
    const inDec = K.feltSeasonIn(near, 11).find(e => e.q === gry), inJan = K.feltSeasonIn(near, 0).find(e => e.q === gry);
    t.ok(gry && inDec && inDec.sp === 'torsk' && !inJan, 'Gryllefjorden (torsk desember–februar) går inn i sesongen i desember, ikke i januar');
    S0.home = undefined;
  }

  { const S0 = K.get('S'); S0.home = nearPort(67.28, 14.4).id; let gis = 0; const d0 = Math.floor(HOUR(2027, 1, 1, 0) / 24); for (let d = d0; d < d0 + 365; d++) for (const x of K.newsForDay(d)) if (/Gisundet/.test(x.h.no + x.b.no + x.h.en)) gis++;
    t.eq(gis, 0, 'Kystposten i Bodø nevner ikke Gisundet (godværssaken sier hjemmehavna)'); S0.home = undefined; }
  // 6. the search mission and the alumni
  const lp = K.turLetePlace(bp); t.ok(lp.no === 'på Makkaur-sandfjorden' && lp.en === 'at Makkaur-sandfjorden', `leteoppdraget på et felt sier feltets navn: «${lp.no}»`);
  if (far){ const lf = K.turLetePlace(far); t.ok(/^(ved | ?[\d,]+ nm fra )/.test(lf.no), `og utenfor feltene mottaket eller havna som før: «${lf.no}»`); }
  if (has('feltNear')) for (const [nm, lat, lon] of PL){ const pt = nearPort(lat, lon), a = {id:'a' + nm, homePort:pt.id}, g = K.alumniGround(a), q = g && K.feltNameAt(g);
    t.ok(g && q && q.on && Math.hypot(g.x - pt.p.x, g.y - pt.p.y) <= 40 && !hasGN(q.n), `en tidligere matros med egen båt fra ${pt.name} ligger på en fiskeplass innen 40 km (${q && q.n}, ${g ? Math.hypot(g.x - pt.p.x, g.y - pt.p.y).toFixed(1) : '–'} km)`); }
  { const sh = FELT.S; FELT.S = null; FW.G = null; const a = {id:'early', homePort:'husoy'}, g = K.alumniGround(a), k = FW.key; FELT.S = sh; FW.G = null; K.feltGeo(); t.ok(k === 0 && g && a.gv === undefined && a.g === undefined, 'før formene er inne, lagres ikke plassen (den finnes på nytt neste gang)'); }
  { const a = {id:'old', homePort:'husoy', g:{x:1, y:1}}; const g = K.alumniGround(a); t.ok(a.gv === 1 && g && g.x !== 1, 'en plass funnet før F3 (uten gv) finnes på nytt'); }

  // 7. no text reads GROUNDS' names: in src/js only the table itself has them
  const files = []; const walk = d => { for (const n of readdirSync(d)){ const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.js')) files.push(p); } }; walk(join(SRC, 'js'));
  const uses = [];
  for (const f of files){ const src = readFileSync(f, 'utf8').split('\n'); src.forEach((ln, i) => { const code = ln.replace(/\/\/.*$/, '');
    if (/GROUNDS[^;\n]*\.name\b|\bg\.name\.(no|en)\b|g\.name\[/.test(code) && !/^\s*\{name:/.test(code)) uses.push(f.slice(SRC.length + 1) + ':' + (i + 1));
    if (/(Havet nord for Husøy|Utenfor Mefjorden|Vest av Gryllefjord|Gisundet nord|North Gisundet|Malangen mouth)/.test(code) && !/^\s*\{name:/.test(code)) uses.push(f.slice(SRC.length + 1) + ':' + (i + 1) + ' (navnet)'); }); }
  t.eq(uses.length, 0, `ingen kode leser GROUNDS-navnene eller skriver dem i en tekst (${uses.slice(0, 6).join(', ')})`);
}
