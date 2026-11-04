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
}
