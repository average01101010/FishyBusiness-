// The boat's name on her model (vessel3d.js namePlaces, Jonas 04.11.2026: «navnet på båten skrives i blokkbokstaver på kanten av
// styrhustaket foran, men også på hekken. På hekken står som regel også hjemmehavnen til båten under navnet»; «teksten er enten svart
// eller hvit alt ettersom hvilken farge som får høyest kontrast»): every boat with a wheelhouse carries the name across its roof's front
// edge and, where she has a transom, the name and the home port under it there, small; the open boats without one carry it small aft on
// their quarters, never on the bows; the letters are white or black by the contrast against the paint under each line.
export const scripts = ['js/vessel3d.js'];
export const data = true;

export default function (t){
  const {VESSELS, vesselSpec, glbHas, namePlaces, nameInkLight, placeRGB, HULLPAL} = t.K;
  // the ink: WCAG's contrast, white on dark paint, black on light, and on the middle colours the one that reads best
  const pal = k => HULLPAL.find(p => p[0] === k)[3];
  t.eq(['hvit', 'krem', 'lysgra', 'gul', 'oransje', 'himmel'].map(k => nameInkLight(pal(k))), [false, false, false, false, false, false], 'svart skrift på hvitt, krem, lys grå, gult, oransje og himmelblått');
  t.eq(['sort', 'antrasitt', 'marine', 'kobolt', 'flaske', 'oksblod', 'rod', 'petrol'].map(k => nameInkLight(pal(k))), [true, true, true, true, true, true, true, true], 'hvit skrift på sort, antrasitt, marine, kobolt, flaskegrønt, oksblod, rødt og petrol');
  const types = Object.keys(VESSELS).filter(k => vesselSpec(k) && glbHas(k));
  const box = (B, T) => { const P = B.concat(T); return {sd:Math.sign(P.reduce((a, p) => a + p[0], 0)), x0:Math.min(...P.map(p => p[0])), x1:Math.max(...P.map(p => p[0])), y0:Math.min(...P.map(p => p[1])), y1:Math.max(...P.map(p => p[1])), z0:Math.min(...P.map(p => p[2])), z1:Math.max(...P.map(p => p[2]))}; };
  const sum = {};
  for (const k of types){
    const P = namePlaces(k), kinds = P.map(p => p.kind + (p.line === 'port' ? '+havn' : '')), house = P.find(p => p.kind === 'house'), name = P.find(p => p.kind === 'stern' && p.line === 'name'), port = P.find(p => p.kind === 'stern' && p.line === 'port');
    sum[k] = kinds.join(' ');
    t.ok(P.length > 0 && P.every(p => p.B.length === p.T.length && p.B.length > 2 && p.B.concat(p.T).every(q => q.every(isFinite)) && p.aspect > 1), `${k}: navnet har ${P.length} plasser (${kinds.join(', ')}), alle med gyldige striper`);
    // the house front lies across the boat (leaning no more than a raked front does), the letters read from starboard to port as seen from ahead
    if (house){ const b = box(house.B, house.T); t.ok(house.B[0][0] > 0 && house.B[house.B.length - 1][0] < 0 && house.B.every((q, i) => Math.abs(house.T[i][2] - q[2]) < Math.max(0.3, 1.3 * (house.T[i][1] - q[1]))) && b.y1 - b.y0 > 0.08, `${k}: navnet på styrhustakets kant foran går tvers over (${(b.x1 - b.x0).toFixed(2)} m bredt, ${(b.y1 - b.y0).toFixed(2)} m høyt)`); }
    // the transom: the home port under the name, smaller, from port to starboard as seen from astern
    if (name){ const a = box(name.B, name.T); t.ok(name.B[0][0] < 0 && a.z0 > 0 && (!port || (box(port.B, port.T).y1 <= a.y0 + 1e-6 && (port.T[0][1] - port.B[0][1]) < (name.T[0][1] - name.B[0][1]))), `${k}: navnet på hekken${port ? ' med hjemmehavnen under i mindre skrift' : ''}`); }
    // never on the bows (Jonas 04.11.2026: «Fjern også navnet som står i baugen»): every place on a side lies in the aft half, and the
    // transom's text is at most half its breadth (the strip is half the transom there, the letters within it)
    const L = VESSELS[k].len, aft = P.filter(p => p.kind !== 'house').every(p => box(p.B, p.T).z0 > -0.05 * L);
    t.ok(aft && !P.some(p => p.kind === 'side'), `${k}: ingen navn i baugen`);
    if (name){ const a = box(name.B, name.T); t.ok(a.x1 - a.x0 <= 0.52 * VESSELS[k].beam && a.y1 - a.y0 <= 0.3 / 0.74 + 1e-6, `${k}: navnet på hekken er høyst halve bredden (${(a.x1 - a.x0).toFixed(2)} m av ${VESSELS[k].beam} m) og ${((a.y1 - a.y0) * 0.74 * 100).toFixed(0)} cm høye bokstaver`); }
    // the ink follows the paint under each place, and a repainted hull or house changes it where the place lies on that paint
    const p1 = P.find(p => p.paint && p.paint.zone1 >= 0.6);
    if (p1) t.ok(nameInkLight(placeRGB(k, p1, {hull:pal('sort')})) && !nameInkLight(placeRGB(k, p1, {hull:pal('hvit')})), `${k}: på skroget blir skriften hvit når skroget males sort og svart når det males hvitt`);
  }
  t.note('plassene: ' + JSON.stringify(sum));
  // the open boats without a transom for it carry the name small on their quarters
  for (const k of ['skiff', 'trebat']) if (types.includes(k)) t.ok(/^quarter quarter$/.test(sum[k]), `${k}: navnet akter på begge sider`);
  // every boat with a closed wheelhouse in the national fleet has the name on it, and all but the stern trawler on the transom too
  for (const k of ['sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21', 'ringnot38', 'snokrabbe', 'autoliner', 'pelagisk'])
    if (types.includes(k)) t.ok(/house/.test(sum[k]) && /stern\+havn/.test(sum[k]), `${k}: navnet på styrhuset foran og på hekken med hjemmehavnen`);
  // the breisjark says where her name and her mark stand (OB11 round 2, Jonas 11.11.2026: «Navnet på båten skal bare være over
  // styrhusvinduet på bremen og på akterspeilet. det andre nummeret kan gjøres mindre å plasseres høyere opp på det hvite»): the name
  // on the roof brim's front face in the hull's paint, the mark on the white bulwark over the strake, its ink by the superstructure's
  // paint as the player has painted it
  if (types.includes('breisjark')){ const { markStrips, markRGB, stripPaint, vesselModel } = t.K, G = vesselModel('breisjark').geo, h = namePlaces('breisjark').find(p => p.kind === 'house');
    t.ok(h && h.B === G.nameHouse[0] && h.paint && h.paint.zone1 >= 0.9, 'breisjark: navnet står på bremmens forkant, modellens egen plass, på skrogets maling', h && h.paint);
    const mk = markStrips('breisjark'), P = stripPaint('breisjark', mk[0]), lum = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    t.ok(mk === G.marks && P && P.zone3 >= 0.9 && lum(P.rgb) > 0.7, 'breisjark: merket står på den hvite skansen, modellens egen plass', P);
    t.ok(lum(markRGB('breisjark', null)) > 0.7 && lum(markRGB('breisjark', {house:[0.05, 0.1, 0.3]})) < 0.3, 'breisjark: merkets blekk følger overbyggets maling (hvitt gir mørke bokstaver, et mørkt malt overbygg lyse)'); }
  // TP2 (steg 109; Jonas 12.11.2026, V4 B «Tre skrifter og farge»): the name's lettering and ink. A chosen ink is used only where it
  // reads against the paint under it (3:1, WCAG's for large text), else the name falls back to white or black as before
  { const {nameInk, nameStyle, contrastOf, inkRGB, NAMEINK, NAMEMIN, livStr, livPaint, livParse, livName, livHome, npcModelKey} = t.K, S = t.K.newState(); t.K.set('S', S);
    const hex = c => c.map(v => Math.round(v * 255)).join(',');
    t.ok(NAMEMIN === 3 && Math.abs(contrastOf([1, 1, 1], [0, 0, 0]) - 21) < 1e-9 && Math.abs(contrastOf(pal('rod'), pal('rod')) - 1) < 1e-9, 'kontrasten er WCAG-ens: hvitt mot svart 21, en farge mot seg selv 1, grensen 3:1');
    t.eq(hex(nameInk(pal('sort'), 'gull')), hex(NAMEINK.gull[2]), 'gull på sort skrog blir gull');
    t.eq(hex(nameInk(pal('marine'), 'hvit')), hex(NAMEINK.hvit[2]), 'hvitt på marineblått blir hvitt');
    t.eq(hex(nameInk(pal('gul'), 'gull')), hex(NAMEINK.sort[2]), 'gull på gult skrog leses ikke (under 3:1) og faller tilbake til svart');
    t.eq(hex(nameInk(pal('marine'), 'sort')), hex(NAMEINK.hvit[2]), 'svart på marineblått leses ikke og faller tilbake til hvitt');
    t.eq(hex(nameInk(pal('hvit'), 'hvit')), hex(NAMEINK.sort[2]), 'hvitt på hvitt faller tilbake til svart');
    t.eq(hex(nameInk(pal('kobolt'), 'kobolt')), hex(NAMEINK.hvit[2]), 'skrogets egen farge på skroget faller tilbake til hvitt');
    t.ok(['hvit', 'krem', 'sort', 'marine', 'rod', 'gul', 'petrol', 'oransje'].every(k => hex(nameInk(pal(k), 'auto')) === hex(nameInkLight(pal(k)) ? NAMEINK.hvit[2] : NAMEINK.sort[2])), 'automatisk er svart eller hvitt som før (nameInkLight)');
    // every ink and every paint: what is used always reads (3:1 or more)
    const inks = ['auto', ...Object.keys(NAMEINK), ...HULLPAL.filter(x => x[3]).map(x => x[0])], under = HULLPAL.filter(x => x[3]).map(x => x[3]);
    let worst = 99; for (const c of inks) for (const u of under) worst = Math.min(worst, contrastOf(nameInk(u, c), u));
    t.ok(worst >= NAMEMIN, `skriften leses alltid: minste kontrast over alle farger og all maling er ${worst.toFixed(2)}:1`);
    t.eq(nameStyle(null), {f:'b', c:'auto'}, 'uten valg: blokk og automatisk');
    t.eq(nameStyle({nf:'z', nc:'orig'}), {f:'b', c:'auto'}, 'en ukjent skrift og «Original» som farge gir blokk og automatisk');
    t.eq(nameStyle({nf:'a', nc:'oksblod'}), {f:'a', c:'oksblod'}, 'antikva i oksblod');
    t.ok(inkRGB('gull') && inkRGB('petrol') && !inkRGB('blaa'), 'fargene er gull, hvit, svart og palettens');
    // the code: 'n:' the lettering and 'k:' the home port, neither in the part that makes the model (TP1's shared models)
    S.home = 'm1234'; const b = Object.assign(S.boat, {liv:{hull:'sort', nf:'a', nc:'gull'}});
    const code = livStr(b);
    t.ok(/(^|;)n:a\.gull(;|$)/.test(code) && /(^|;)k:m1234(;|$)/.test(code), 'koden har skriften og fargen (n:a.gull) og hjemhavna (k:m1234): ' + code);
    t.eq(livPaint(code), 'h:sort', 'skriften, fargen og hjemhavna endrer ikke modellen (livPaint)');
    t.eq(JSON.stringify(livParse(code, 'sjark')), JSON.stringify(livParse('h:sort', 'sjark')), 'og malingen leses likt med og uten dem (livParse)');
    t.ok(npcModelKey('sjark', 1, code) === npcModelKey('sjark', 1, 'h:sort'), 'to båter med lik maling og ulik skrift deler modell');
    t.ok(!/(^|;)[nk]:/.test(livStr({type:'sjark', liv:{hull:'sort'}})), 'en annen båt enn din egen og uten valg sender ingen n: og k:');
    t.eq(livName(code), {f:'a', c:'gull'}, 'de andre leser skriften og fargen');
    t.eq(livName('h:hvit;n:q.gull'), {f:'b', c:'gull'}, 'en skrift de ikke kjenner, blir blokk');
    t.eq([livHome(code), livHome('h:hvit'), livHome('k:Bad<x>'), livHome('k:' + 'a'.repeat(30))], ['m1234', '', '', ''], 'hjemhavna leses bare som en kort id');
  }
}
