// The fishing grounds along the whole coast (Ø14 F1 of docs/planer/fangstfelt.md, 08.11.2026; tools/npc/felt.py → src/data/felt.json and
// felt-s.b64, core/01e-marks.js feltData, feltIn, feltShape): the three kinds (and since Ø14 F5 Kartverket's names in the sea, the kind s), the species with gear and months from Fiskeridirektoratet,
// the washed names, the shapes around their points, Senja's grounds as all the others, and the spawning and nursery grounds never in
// the fleet's pressure (core/03g-trykk.js trkAreas, trkCellW). And Ø14 F2 (08.11.2026, core/03j-felt.js): the fish on the grounds as the
// good spots stand in the sea, the location's sum the same, no edge, and the baseline as high on a ground as beside it.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

export default function (t){
  const K = t.K;
  const t0 = performance.now(), D = K.feltData(), ms = performance.now() - t0;
  t.ok(D && D.length > 6000, `feltData leser ${D ? D.length : 0} felt på ${ms.toFixed(0)} ms`);
  const by = k => D.filter(f => f.k === k);
  const nf = by('f').length, ng = by('g').length, no = by('o').length;
  // 1. the three kinds (V3: the spawning and nursery grounds of the same interviews, as names)
  t.ok(nf > 4500 && nf < 4900 && ng > 1550 && ng < 1700 && no > 400 && no < 470, `slagene: ${nf} fiskeplasser, ${ng} gyteområder, ${no} oppvekst- og beiteområder`);
  // 2. the species with gear and months (V2 A), only the game's species
  const FELT = K.get('FELT'), GARN = 1 << FELT.gear.indexOf('garn'), SNV = 1 << FELT.gear.indexOf('snurrevad');
  const line = (f, sp) => f && f.l.find(q => q[0] === sp);
  const bil = D.find(f => f.k === 'f' && f.n === 'Billefjordjupet'), bt = line(bil, 'torsk');
  t.ok(bt && (bt[1] & GARN) && bt[2] === 4095, `Billefjordjupet har torsk med garn hele året (${bil ? JSON.stringify(bil.l) : 'ikke funnet'})`);
  // Bjørnvika by Båtsfjord: Danish seine for cod, haddock and saithe May-September; Gryllefjorden on Senja: cod in December-February
  const bjo = D.find(f => f.k === 'f' && f.n === 'Bjørnvika' && line(f, 'torsk') && (line(f, 'torsk')[1] & SNV)), bjt = line(bjo, 'torsk');
  t.ok(bjt && bjt[2] === 0b000111110000, `Bjørnvika (Båtsfjord): torsk med snurrevad mai–september (${bjt ? bjt[2].toString(2).padStart(12, '0') : '–'})`);
  const gry = D.find(f => f.k === 'f' && f.n === 'Gryllefjorden'), gt = gry && gry.l.filter(q => q[0] === 'torsk').reduce((a, q) => a | q[2], 0);
  t.ok(gt === (1 | 2 | 2048), `Gryllefjorden (Senja): torsk i desember–februar (${gt !== undefined ? gt.toString(2).padStart(12, '0') : '–'})`);
  const SPN = Object.keys(K.SPECIES), bad = D.filter(f => f.l.some(q => !SPN.includes(q[0]) || !(q[2] > 0 && q[2] < 4096)));
  t.eq(bad.length, 0, 'alle linjene har en art spillet kjenner og minst én måned');
  t.ok(D.filter(f => f.k !== 'f').every(f => f.l.every(q => q[1] === 0) && f.g === '-'), 'gyte- og oppvekstområdene har ikke redskap');
  const withL = D.filter(f => f.l.length).length, season = by('f').filter(f => f.l.some(q => q[2] !== 4095)).length;
  t.ok(withL > 5000 && season > 2000, `${withL} felt har arter spillet kjenner, ${season} fiskeplasser har en sesong`);
  // 3. the names washed (2.6): no positions, no names in capitals, a capital first letter, the chart's name shortened
  const pos = D.filter(f => /\d+\s*°/.test(f.n + f.nf)), caps = D.filter(f => { const L = f.nf.replace(/[^A-Za-zÆØÅæøå]/g, ''); return L.length >= 3 && L === L.toUpperCase(); });
  const word = D.filter(f => /(^|[\s-])(?![IVX]+\b)[A-ZÆØÅ]{4,}/.test(f.nf)), low = D.filter(f => f.n && f.n[0] !== f.n[0].toUpperCase());
  t.ok(pos.length === 0 && caps.length === 0 && word.length === 0 && low.length === 0,
    `navnene vasket: ${pos.length} med koordinater, ${caps.length} med bare store bokstaver, ${word.length} med et ord i store bokstaver, ${low.length} med liten forbokstav${caps.concat(word, low).slice(0, 3).map(f => ' «' + f.nf + '»').join('')}`);
  // (the compass points and Roman numerals stay in capitals: «Karmøy SV», not «Karmøy Sv»)
  const cmp = D.filter(f => /(^|[\s(.-])(Nø|Nv|Sø|Sv|Ssv|Ssø|Nnv|Nnø|Ii|Iii|Iv)(?=$|[\s).,-])/.test(f.nf));
  t.eq(cmp.length, 0, `kompasspunkt og romertall står med store bokstaver (${cmp.slice(0, 4).map(f => '«' + f.nf + '»').join(' ')})`);
  const unnamed = by('f').filter(f => !f.n).length;
  t.ok(unnamed > 0 && unnamed < 10, `${unnamed} fiskeplasser hadde bare en posisjon for navn: de står uten navn, som vekt`);
  const long = D.filter(f => f.n.length > 29 || (f.n !== f.nf && !f.n.endsWith('…') && f.n.includes('/'))).length, cut = D.filter(f => f.n !== f.nf).length;
  t.ok(long === 0 && cut > 200, `kartets navn er kortet ved skråstrek eller etter 28 tegn (${cut} kortet, hele navnet i nf)`);
  t.ok(D.some(f => f.nf === 'Ytterholla/Porsangerfjorden' && f.n === 'Ytterholla'), 'Ytterholla/Porsangerfjorden står som Ytterholla i kartet');
  // 4. the shapes around their points (felt-s.b64; Douglas-Peucker to 100 m)
  t.eq(K.feltShape(D[0]), null, 'uten fila (Node, eller før den er hentet) gir feltShape null, ikke en form');
  const bytes = Uint8Array.from(Buffer.from(readFileSync(join(SRC, 'data', 'felt-s.b64'), 'utf8').trim(), 'base64'));
  const S = K.feltShapesFrom(bytes); t.ok(S && S.length === D.length, `formene leses (${(bytes.length / 1000).toFixed(0)} kB, ${S ? S.length : 0} felt)`);
  t.eq(K.feltShapesFrom(bytes.subarray(1)), false, 'en fil som ikke passer felt.json, gir ingen former');
  if (S){
    const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2){ const yi = r[i + 1], yj = r[j + 1]; if ((yi > y) !== (yj > y) && x < (r[j] - r[i]) * (y - yi) / (yj - yi) + r[i]) c = !c; } return c; };
    let has = 0, inside = 0, near = 0, other = 0;
    for (const f of D){ const R = S[f.i]; if (f.k !== 'f'){ other += R.length; continue; } if (!R.length) continue; has++;
      if (R.some(r => inRing(r, f.x, f.y))) inside++;
      let d = 1e9; for (const r of R) for (let i = 0; i < r.length; i += 2) d = Math.min(d, Math.hypot(r[i] - f.x, r[i + 1] - f.y)); if (d < Math.max(2, f.r * 2)) near++; }
    t.ok(has > 0.99 * nf && inside > 0.97 * has && near > 0.995 * has && other === 0, `formene ligger rundt punktene: ${has} av ${nf} fiskeplasser har form, punktet inne i formen på ${inside}, nær den på ${near}; gyte- og oppvekstområdene ingen (${other})`);
    FELT.S = S; const h = D.find(f => f.n === 'Ytre Mefjorden Sør'); t.ok(h && K.feltShape(h).length > 0, 'feltShape gir formen når fila er lest');
    FELT.S = false; t.eq(K.feltShape(h), false, 'og false for godt når fila ikke passer (ikke null, som betyr at den er på vei)'); FELT.S = null;
  }
  // 5. Senja's grounds as all the others (Jonas 08.11.2026): the grounds by GROUNDS are no longer left out
  const nearG = by('f').filter(f => K.GROUNDS.some(g => Math.hypot(g.p.x - f.x, g.p.y - f.y) < 1.5));
  t.ok(nearG.length >= 1 && nearG.some(f => f.n === 'Ytre Mefjorden Sør'), `fiskeplassene innen 1,5 km av Senjas seks felt er med (${nearG.map(f => f.n).join(', ')})`);
  // 6. the chart has only the named fishing grounds until F4
  const box = K.feltIn(-1e4, -1e4, 1e4, 1e4);
  t.ok(box.length === by('f').filter(f => f.n).length && box.every(f => f.k === 'f' && f.n), `feltIn gir bare fiskeplassene med navn (${box.length})`);
  // with all (the chart's names, F4): the named spawning and nursery grounds too, after every fishing ground, none without a name
  const all = K.feltIn(-1e4, -1e4, 1e4, 1e4, true), firstGO = all.findIndex(f => f.k !== 'f');
  t.ok(all.length === D.filter(f => f.n).length && all.every(f => f.n) && firstGO === box.length && all.slice(firstGO).every(f => f.k === 'g' || f.k === 'o' || f.k === 's')
    && all.slice(firstGO).every((f, i, a) => !i || a[i - 1].r >= f.r), `feltIn med all gir også gyte- og oppvekstområdene og Kartverkets sjønavn, etter fiskeplassene og de største først (${all.length}, ${all.length - box.length} g, o og s)`);
  // 7. the spawning and nursery grounds are never pressure: trkAreas counts the same without them, and a cell by a spawning ground
  // far from any fishing ground has no ground weight
  K.set('S', K.newState()); const TRK = K.get('TRK');
  TRK.A = null; const A1 = K.trkAreas(); const keep = FELT.d; FELT.d = keep.filter(f => f.k === 'f'); TRK.A = null; const A2 = K.trkAreas(); FELT.d = keep; TRK.A = null;
  const same = A1.gc.every((v, i) => v === A2.gc[i]) && A1.gch.every((v, i) => v === A2.gch[i]);
  t.ok(same, `trkAreas teller bare fiskeplassene (${A1.gc.reduce((a, b) => a + b, 0)} ruter på felt, det samme uten g, o og s: ${A2.gc.reduce((a, b) => a + b, 0)})`);
  const lone = by('g').find(f => !D.some(o => o.k === 'f' && Math.hypot(o.x - f.x, o.y - f.y) < TRK.groundR + 4) && K.lokOfCell({x:f.x, y:f.y}).l >= 0);
  if (lone){ const c = {cx:lone.x, cy:lone.y}; t.eq(K.trkCellW(c), 1, `en rute ved gyteområdet ${lone.n} uten fiskeplass i nærheten har ingen feltvekt i trykket`); }
  else t.ok(false, 'fant ikke et gyteområde langt fra fiskeplassene');
  f5(t, K, D, S);
  f2(t, K, D, S);
}

// ---- Ø14 F5 (11.11.2026): Kartverket's place names in the sea where Fiskeridirektoratet has little (the kind s) ----
function f5(t, K, D, S){
  const FELT = K.get('FELT'), TRK = K.get('TRK'), s = D.filter(f => f.k === 's'), raw = JSON.parse(readFileSync(join(SRC, 'data', 'felt.json'), 'utf8'));
  // 1. the kind is there, in Finnmark only (first the thinnest stretch), with the names the plan checked by Båtsfjord
  t.ok(s.length > 500 && raw.meta.kinds.s === s.length && raw.meta.kv && raw.meta.kv.fylker.length > 0, `slaget s finnes: ${s.length} sjønavn fra Kartverket (meta.kinds.s ${raw.meta.kinds.s}, fylkene ${raw.meta.kv && raw.meta.kv.fylker})`);
  t.ok(/Kartverket/.test(raw.meta.src) && /CC BY 4\.0/.test(raw.meta.src), 'kilden og lisensen for sjønavnene står i meta.src (Kartverket, CC BY 4.0)');
  const ll = s.map(f => K.natLL({x:f.x, y:f.y})), out = ll.filter(q => q.lat < 69.6 || q.lon < 20.5).length;
  // (only while Finnmark is the one county fetched, KV_FYLKER in felt.py; more counties, and this check falls away)
  if (raw.meta.kv && raw.meta.kv.fylker.join() === '56') t.ok(out === 0 && s.length < 1200, `alle sjønavnene ligger i Finnmark (nord for 69,6° N og øst for 20,5° Ø; ${out} utenfor)`);
  // (Troms and Finnmark: north of 68,3° N and east of 15,5° E; and never more names than the two counties have places)
  if (raw.meta.kv && raw.meta.kv.fylker.join() === '56,55'){ const o2 = ll.filter(q => !(q.lat > 68.3 && q.lon > 15.5)).length; t.ok(o2 === 0 && s.length < 3000, `alle sjønavnene ligger i Troms og Finnmark (${o2} utenfor, ${s.length} navn)`); }
  if (raw.meta.kv && raw.meta.kv.fylker.includes('55')){ const tr = ll.filter(q => q.lat < 69.5 && q.lat > 68.3).length; t.ok(tr > 300, `Troms er med (Jonas 11.11.2026): ${tr} sjønavn mellom 68,3 og 69,5° N`); }
  const bf = K.P(70.635, 29.72), near = n => s.find(f => f.n === n && Math.hypot(f.x - bf.x, f.y - bf.y) < 40);
  t.ok(near('Leira') && near('Seigrunnen') && near('Skarberggrunnen'), `ved Båtsfjord: havdypet Leira og grunnene Seigrunnen og Skarberggrunnen (${s.filter(f => Math.hypot(f.x - bf.x, f.y - bf.y) < 20).length} sjønavn innen 20 km)`);
  // 2. a name and a point only: no gear, no lines, no size, no shape
  t.ok(s.length > 0 && s.every(f => f.g === '-' && f.l.length === 0 && f.r === 0 && f.n), 'et sjønavn er bare navn og punkt: uten redskap, linjer og størrelse');
  if (S) t.ok(s.length > 0 && s.every(f => S[f.i].length === 0), 'og uten form (0 ringer i felt-s.b64, så antallet følger felt.json)');
  // 3. never the same name twice: not a ground's name (its whole name, the chart's name or a part of a slash name; without the
  // definite ending and the hyphens) within 3 km, as the same name within 3 km is one ground, not a sea name again within 1 km,
  // and no two sea names on one spot
  const nk = n => { const k = n.toLowerCase().replace(/[^a-zæøåáčđŋšŧžäö]/g, ''); return k.length > 5 ? k.replace(/(ene|ane|en|an|et|a)$/, '') : k; };
  const keys = f => new Set([f.nf, f.n.replace(/…$/, ''), ...f.nf.split(/\s*\/\s*/)].filter(Boolean).map(nk));
  const cell = new Map(), key = (x, y) => Math.floor(x / 3) + ':' + Math.floor(y / 3);
  for (const f of D){ if (!f.n) continue; f._k = keys(f); const k = key(f.x, f.y); if (!cell.has(k)) cell.set(k, []); cell.get(k).push(f); }
  const dbl = [], spot = [];
  for (const f of s) for (let dy = -3; dy <= 3; dy += 3) for (let dx = -3; dx <= 3; dx += 3) for (const o of cell.get(key(f.x + dx, f.y + dy)) || []){ if (o === f) continue;
    const d = Math.hypot(o.x - f.x, o.y - f.y); if (o.k === 's' && d < 0.1) spot.push(f);
    if (d < (o.k === 's' ? 1 : 3) && [...f._k].some(q => o._k.has(q))) dbl.push(f.nf + ' / ' + o.nf + ' (' + o.k + ', ' + d.toFixed(2) + ' km)'); }
  t.ok(s.length > 0 && dbl.length === 0, `ingen sjønavn står to ganger: ikke som et felt innen 3 km, ikke som et sjønavn innen 1 km (${dbl.length}${dbl.slice(0, 4).map(q => ' «' + q + '»').join('')})`);
  t.eq(spot.length, 0, 'ingen to sjønavn på samme sted (innen 100 m)');
  // 4. never weight and never pressure: a cell by a sea name far from any fishing ground, inside a location, has no ground weight
  // (trkAreas without every kind but f is check 7 above; the fish on the grounds, 03j-felt.js, are built from k = f alone)
  const lone = s.find(f => !D.some(o => o.k === 'f' && Math.hypot(o.x - f.x, o.y - f.y) < TRK.groundR + 4) && K.lokOfCell({x:f.x, y:f.y}).l >= 0);
  if (lone){ const c = {cx:lone.x, cy:lone.y}; t.ok(K.trkCellW(c) === 1 && c.gwa === 1, `en rute ved sjønavnet ${lone.n} uten fiskeplass i nærheten har ingen feltvekt i trykket`); }
  else t.ok(false, 'fant ikke et sjønavn langt fra fiskeplassene, i en lokasjon');
}

// ---- Ø14 F2: the fish on the grounds (core/03j-felt.js) ----
// Node has no map, so the sea is made up here: water everywhere, a depth of 40-200 m and an exposure that vary over a few km (the same
// for the location's means, which read the far layers, and for density, which reads the tiles)
const HOUR = (y, m, d, h) => (Date.UTC(y, m - 1, d, h) - Date.UTC(2027, 2, 1, 6)) / 3.6e6;
function f2(t, K, D, S){
  K.set('S', K.newState());
  const TRK = K.get('TRK'), RU = K.get('RU'), FELT = K.get('FELT'), FW = K.FELTW;
  // 5. the baseline on a ground against the sea beside it (2.3 of the plan: cod by Henningsvær in March 0.68 against 0.85 before F2):
  // the mean over the fishing grounds within 25 km of the place against cells 4-6 km from each in the same location and over 3.5 km from
  // every ground, cod on 15 March 2027 at 08 UTC
  const Hm = HOUR(2027, 3, 15, 8), F = D.filter(f => f.k === 'f');
  const base = (ll) => { const c0 = K.P(ll[0], ll[1]); let on = 0, off = 0, n = 0;
    for (const f of F){ if (Math.hypot(f.x - c0.x, f.y - c0.y) > 25) continue; const l = K.lokOfCell({x:f.x, y:f.y}).l; if (l < 0) continue;
      let q = null; for (let r = 4; r <= 6 && !q; r += 0.5) for (let a = 0; a < 16 && !q; a++){ const p = {x:f.x + Math.cos(a / 16 * 2 * Math.PI) * r, y:f.y + Math.sin(a / 16 * 2 * Math.PI) * r};
        if (K.lokOfCell(p).l === l && !F.some(o => Math.hypot(o.x - p.x, o.y - p.y) < 3.5)) q = p; }
      if (!q) continue; on += K.baseAt({x:f.x, y:f.y}, 'torsk', Hm); off += K.baseAt(q, 'torsk', Hm); n++; }
    return {on:on / n, off:off / n, n}; };
  for (const [nm, ll] of [['Henningsvær', [68.15, 14.2]], ['Røst', [67.5, 12.07]], ['Båtsfjord', [70.65, 29.75]]]){
    const b = base(ll); t.ok(b.n > 3 && b.on >= 0.97 * b.off, `grunnlinja for torsk i mars på feltene ved ${nm} er minst 0,97 av den like ved: ${b.on.toFixed(3)} mot ${b.off.toFixed(3)} (${b.n} felt)`); }
  if (!FW){ t.ok(false, 'FELTW finnes ikke: Ø14 F2 er ikke bygd'); return; }
  // the made-up sea, and the shapes from the file
  const keep = {}; for (const n of ['isLand', 'isLandFar', 'depthF', 'offDepth', 'expoFar']) keep[n] = K.get(n);
  const sea = p => 40 + 160 * K.noise2(p.x / 6, p.y / 6, 3);
  K.set('isLand', () => false); K.set('isLandFar', () => false); K.set('depthF', sea); K.set('offDepth', sea); K.set('expoFar', p => 60 + 150 * K.noise2(p.x / 9, p.y / 9, 4));
  FELT.S = S; FW.G = null; FW.on = true;
  const PL = {Henningsvær:[68.15, 14.2], Bodø:[67.3, 14.3], Bergen:[60.4, 5.0], Hammerfest:[70.68, 23.6], Båtsfjord:[70.65, 29.75]};
  const den = (sp, p, H, on) => { FW.on = on; const v = K.density(sp, p, H); FW.on = true; return v; };
  // 1. the location's sum stands: cod over the location's sea on a 1 km grid, at six hours through the month in four years (the grounds'
  // pulls are drawn anew every 120 hours, so one month's sum with few grounds can lie a percent or two off), with F2 against without
  for (const [nm, ll] of Object.entries(PL)){
    const l = K.lokOfCell(K.P(ll[0], ll[1])).l, rs = [];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const P of RU.lok[l].P) for (const r of P.rings) for (let i = 0; i < r.length; i += 2){ x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); }
    const pts = []; for (let y = y0 + 0.31; y < y1; y += 1) for (let x = x0 + 0.17; x < x1; x += 1){ const p = {x, y}; if (K.lokOfCell(p).l === l) pts.push(p); }
    for (const m of [3, 7]){ let a = 0, b = 0; for (let k = 0; k < 24; k++){ const H = HOUR(2027 + (k & 3), m, 1, 8) + (k >> 2) * 122; for (const p of pts){ a += den('torsk', p, H, true); b += den('torsk', p, H, false); } }
      rs.push(a / b); }
    const w = [K.feltWlOf(l, 'torsk', 2), K.feltWlOf(l, 'torsk', 6)];
    t.ok(rs.every(r => Math.abs(r - 1) <= 0.01), `summen av torsk i lokasjonen ${RU.lok[l].c} (${nm}, ${pts.length} punkter) med F2 mot uten: mars ${rs[0].toFixed(4)}, juli ${rs[1].toFixed(4)} (1 ± 1 %; snittløftet ${w.map(v => v.toFixed(3)).join(' og ')})`);
  }
  // 2. the season: a ground with cod in December-February (Gryllefjorden on Senja), a point well inside it and one 4-6 km away outside
  // every ground in the same location; the ratio with F2 against without, over January and over July
  const gry = D.find(f => f.k === 'f' && f.n === 'Gryllefjorden'), gl = K.lokOfCell({x:gry.x, y:gry.y}).l, G = K.feltGeo().find(g => g.f === gry);
  let pin = null; for (let i = 0; i < 400 && !pin; i++){ const p = {x:G.b[0] + (G.b[2] - G.b[0]) * K.hash(i * 7 + 1), y:G.b[1] + (G.b[3] - G.b[1]) * K.hash(i * 7 + 2)}; const fl = K.feltAt(p);
    if (K.feltSd(G, p.x, p.y) > 1.5 && K.lokOfCell(p).l === gl && fl && fl.F.length === 1 && K.feltDepth('torsk', sea(p)) > 0.7) pin = p; }
  let pout = null; for (let r = 4; r <= 6 && !pout; r += 0.25) for (let a = 0; a < 24 && !pout; a++){ const p = {x:pin.x + Math.cos(a / 24 * 2 * Math.PI) * r, y:pin.y + Math.sin(a / 24 * 2 * Math.PI) * r}; if (K.lokOfCell(p).l === gl && !K.feltAt(p)) pout = p; }
  const ratio = (p, m) => { let a = 0, b = 0; for (let k = 0; k < 60; k++){ const H = HOUR(2027, m, 1, 7) + k * 12; a += den('torsk', p, H, true); b += den('torsk', p, H, false); } return a / b; };
  const rin1 = ratio(pin, 1), rout1 = ratio(pout, 1), rin7 = ratio(pin, 7), rout7 = ratio(pout, 7);
  t.ok(pin && pout && rin1 > 1.15 && rout1 < 1 && rout1 > 0.9, `Gryllefjorden i januar (i sesong): torsken med F2 mot uten ${rin1.toFixed(3)} på feltet og ${rout1.toFixed(3)} 4–6 km unna`);
  t.ok(Math.abs(rin7 - rout7) < 0.02 && Math.abs(rin7 - 1) < 0.05, `Gryllefjorden i juli (utenfor sesong): ${rin7.toFixed(3)} på feltet og ${rout7.toFixed(3)} like ved, det samme`);
  // 3. the pull changes without a jump, and not faster than the spots (a fresh draw every 120 hours at most, faded over the period)
  let dmax = 0, lo = 1, hi = 0; for (let h = 0; h < 3000; h++){ const a = K.feltPull(G, h), b = K.feltPull(G, h + 1); dmax = Math.max(dmax, Math.abs(b - a)); lo = Math.min(lo, a); hi = Math.max(hi, a); }
  t.ok(FW.T >= K.get('HOT').T && dmax <= FW.max * 1.5 / FW.T + 1e-6 && lo >= 0 && hi <= FW.max, `trekket skifter uten hopp: høyst ${dmax.toFixed(4)} i timen (${lo.toFixed(2)}–${hi.toFixed(2)} over 3000 timer, ny trekning hver ${FW.T}. time)`);
  // 4. no edge: across the outlines of the grounds round Henningsvær and Båtsfjord in March, from 2 km outside to 2 km inside, the ratio
  // with F2 against without changes by at most 10 % per 100 m (the made-up depth changes too slowly to matter over 100 m)
  let worst = 0, nx = 0; const Hx = HOUR(2027, 3, 12, 9);
  for (const ll of [PL.Henningsvær, PL.Båtsfjord]){ const c0 = K.P(ll[0], ll[1]);
    for (const g of K.feltGeo()){ if (!g.R || !g.sm.torsk || Math.hypot(g.cx - c0.x, g.cy - c0.y) > 30) continue; const r = g.R[0]; if (r.length < 6) continue;
      const i = 0, xa = r[0], ya = r[1], xb = r[2], yb = r[3], L = Math.hypot(xb - xa, yb - ya); if (L < 0.3) continue;
      const mx = (xa + xb) / 2, my = (ya + yb) / 2; let nX = (yb - ya) / L, nY = -(xb - xa) / L; if (K.feltSd(g, mx + nX * 0.2, my + nY * 0.2) > 0){ nX = -nX; nY = -nY; }   // outward
      let prev = null; for (let s = -2; s <= 2.001; s += 0.1){ const p = {x:mx - nX * s, y:my - nY * s}; const v = den('torsk', p, Hx, true) / den('torsk', p, Hx, false);
        if (prev !== null) worst = Math.max(worst, Math.abs(v / prev - 1)); prev = v; }
      if (++nx >= 40) break; } }
  t.ok(nx >= 20 && worst <= 0.10, `ingen kant: over omrisset av ${nx} felt endrer fisken med F2 mot uten seg høyst ${(worst * 100).toFixed(1)} % per 100 m (grensa 10 %)`);
  for (const n in keep) K.set(n, keep[n]);
  FELT.S = null; FW.G = null;
}
