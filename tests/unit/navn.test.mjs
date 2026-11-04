// The boat's name on her model (vessel3d.js namePlaces, Jonas 04.11.2026: «navnet på båten skrives i blokkbokstaver på kanten av
// styrhustaket foran, men også på hekken. På hekken står som regel også hjemmehavnen til båten under navnet»; «teksten er enten svart
// eller hvit alt ettersom hvilken farge som får høyest kontrast»): every boat with a wheelhouse carries the name across its roof's front
// edge and, where she has a transom, the name and the home port under it there; the open boats carry it on the bows, clear of the
// registration mark; the letters are white or black by the contrast against the paint under each line.
export const scripts = ['js/vessel3d.js'];
export const data = true;

export default function (t){
  const {VESSELS, vesselSpec, glbHas, namePlaces, markStrips, nameInkLight, placeRGB, HULLPAL} = t.K;
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
    // a boat with a wheelhouse has no name on the bows any more; one without has it there, never on the registration mark
    const sides = P.filter(p => p.kind === 'side'), M = markStrips(k) || [];
    if (house) t.ok(!sides.length, `${k}: med styrhus står navnet ikke lenger langs baugen`);
    const lap = sides.some(s => { const n = box(s.B, s.T); return M.some(([B, T]) => { const m = box(B, T); return n.sd === m.sd && Math.min(n.z1, m.z1) - Math.max(n.z0, m.z0) > 0.05 && Math.min(n.y1, m.y1) - Math.max(n.y0, m.y0) > 0.08; }); });
    t.ok(!lap, `${k}: navnet ligger aldri over registreringsmerket`);
    // the ink follows the paint under each place, and a repainted hull or house changes it where the place lies on that paint
    const p1 = P.find(p => p.paint && p.paint.zone1 >= 0.6);
    if (p1) t.ok(nameInkLight(placeRGB(k, p1, {hull:pal('sort')})) && !nameInkLight(placeRGB(k, p1, {hull:pal('hvit')})), `${k}: på skroget blir skriften hvit når skroget males sort og svart når det males hvitt`);
  }
  t.note('plassene: ' + JSON.stringify(sum));
  // every boat with a closed wheelhouse in the national fleet has the name on it, and all but the stern trawler on the transom too
  for (const k of ['sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21', 'ringnot38', 'snokrabbe', 'autoliner', 'pelagisk'])
    if (types.includes(k)) t.ok(/house/.test(sum[k]) && /stern\+havn/.test(sum[k]), `${k}: navnet på styrhuset foran og på hekken med hjemmehavnen`);
}
