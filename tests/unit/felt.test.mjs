// The fishing grounds along the whole coast (Ø14 F1 of docs/planer/fangstfelt.md, 08.11.2026; tools/npc/felt.py → src/data/felt.json and
// felt-s.b64, core/01e-marks.js feltData, feltIn, feltShape): the three kinds, the species with gear and months from Fiskeridirektoratet,
// the washed names, the shapes around their points, Senja's grounds as all the others, and the spawning and nursery grounds never in
// the fleet's pressure (core/03g-trykk.js trkAreas, trkCellW).
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
  t.ok(all.length === D.filter(f => f.n).length && all.every(f => f.n) && firstGO === box.length && all.slice(firstGO).every(f => f.k === 'g' || f.k === 'o')
    && all.slice(firstGO).every((f, i, a) => !i || a[i - 1].r >= f.r), `feltIn med all gir også gyte- og oppvekstområdene med navn, etter fiskeplassene og de største først (${all.length}, ${all.length - box.length} g og o)`);
  // 7. the spawning and nursery grounds are never pressure: trkAreas counts the same without them, and a cell by a spawning ground
  // far from any fishing ground has no ground weight
  K.set('S', K.newState()); const TRK = K.get('TRK');
  TRK.A = null; const A1 = K.trkAreas(); const keep = FELT.d; FELT.d = keep.filter(f => f.k === 'f'); TRK.A = null; const A2 = K.trkAreas(); FELT.d = keep; TRK.A = null;
  const same = A1.gc.every((v, i) => v === A2.gc[i]) && A1.gch.every((v, i) => v === A2.gch[i]);
  t.ok(same, `trkAreas teller bare fiskeplassene (${A1.gc.reduce((a, b) => a + b, 0)} ruter på felt, det samme uten g og o: ${A2.gc.reduce((a, b) => a + b, 0)})`);
  const lone = by('g').find(f => !D.some(o => o.k === 'f' && Math.hypot(o.x - f.x, o.y - f.y) < TRK.groundR + 4) && K.lokOfCell({x:f.x, y:f.y}).l >= 0);
  if (lone){ const c = {cx:lone.x, cy:lone.y}; t.eq(K.trkCellW(c), 1, `en rute ved gyteområdet ${lone.n} uten fiskeplass i nærheten har ingen feltvekt i trykket`); }
  else t.ok(false, 'fant ikke et gyteområde langt fra fiskeplassene');
}
