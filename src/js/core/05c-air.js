// ---------- aircraft over the coast (plan E4, 05.10.2026) ----------
// Regional turboprops between the coast's airports and helicopters between the bases and the hospitals, on a deterministic timetable
// like the coastal fleet: each route flies a few times a day each way between 06 and 22, by the day's hash. They fly straight between
// the fields at the cruise speed, climbing out and descending in (about 3 degrees in), and are drawn and heard in 3D within about 15 km
// (view3d.js drawAir, tools/air/fly.py). The fields are a hand list (ICAO, position in degrees) from memory, within a few hundred metres;
// the routes are a plausible network, not a real timetable.
const AIRFIELDS = {
  ENTC:[69.6833, 18.9189], ENDU:[69.0558, 18.5404], ENAN:[69.2925, 16.1442], ENEV:[68.4913, 16.6781], ENSR:[69.7868, 20.9594], ENHK:[70.4867, 22.1397],
  ENHF:[70.6797, 23.6686], ENAT:[69.9761, 23.3717], ENNA:[70.0688, 24.9735], ENHV:[71.0097, 25.9836], ENMH:[71.0297, 27.8267], ENBV:[70.8714, 29.0342],
  ENBS:[70.6005, 29.6914], ENSS:[70.3554, 31.0449], ENVD:[70.0653, 29.8447], ENKR:[69.7258, 29.8913], ENBO:[67.2692, 14.3653], ENSH:[68.2433, 14.6692],
  ENLK:[68.1525, 13.6094], ENSK:[68.5788, 15.0334], ENRS:[67.5278, 12.1036], ENRA:[66.3639, 14.3014], ENMS:[65.7840, 13.2149], ENST:[65.9568, 12.4689],
  ENBN:[65.4611, 12.2175], ENRM:[64.8383, 11.1461], ENNM:[64.4722, 11.5786], ENVA:[63.4578, 10.9240], ENKB:[63.1118, 7.8245], ENML:[62.7447, 7.2625],
  ENAL:[62.5625, 6.1197], ENOV:[62.1800, 6.0741], ENFL:[61.5836, 5.0247], ENBR:[60.2934, 5.2181], ENHD:[59.3453, 5.2084], ENZV:[58.8767, 5.6378], ENCN:[58.2042, 8.0854]
};
// helicopter places: the ambulance and rescue bases, hospitals and a heliport (positions in degrees, within a few hundred metres)
const HELIPADS = {
  unn:[69.6820, 18.9870], finnsnes:[69.2290, 17.9800], harstad:[68.7920, 16.5420], gravdal:[68.1210, 13.5030], bodo:[67.2800, 14.4050], varoy:[67.6546, 12.7270],
  hammerfest:[70.6630, 23.6900], banak:[70.0688, 24.9735], kirkenes:[69.7258, 29.8913], vadso:[70.0700, 29.7500], mo:[66.3200, 14.1700], sandnes:[65.9600, 12.4900],
  bronnoy:[65.4611, 12.2175], namsos:[64.4700, 11.5000], orland:[63.6989, 9.6040], alesund:[62.4600, 6.3500], forde:[61.4500, 5.8600], floro:[61.5836, 5.0247], sola:[58.8767, 5.6378]
};
// [from, to, flights a day each way]
const AIR_ROUTES = [
  ['ENTC', 'ENBO', 4], ['ENTC', 'ENSR', 2], ['ENSR', 'ENHK', 2], ['ENHK', 'ENHF', 2], ['ENTC', 'ENAT', 3], ['ENTC', 'ENHF', 3], ['ENTC', 'ENAN', 2], ['ENTC', 'ENEV', 2],
  ['ENAT', 'ENHF', 2], ['ENHF', 'ENHV', 3], ['ENHV', 'ENMH', 2], ['ENMH', 'ENBV', 2], ['ENBV', 'ENBS', 2], ['ENBS', 'ENSS', 2], ['ENSS', 'ENVD', 2], ['ENVD', 'ENKR', 3],
  ['ENTC', 'ENNA', 2], ['ENBO', 'ENEV', 3], ['ENBO', 'ENSH', 4], ['ENBO', 'ENLK', 4], ['ENBO', 'ENSK', 3], ['ENBO', 'ENAN', 3], ['ENBO', 'ENRS', 2], ['ENBO', 'ENRA', 3],
  ['ENBO', 'ENST', 3], ['ENST', 'ENBN', 3], ['ENST', 'ENMS', 2], ['ENBN', 'ENRM', 2], ['ENRM', 'ENNM', 2], ['ENNM', 'ENVA', 3], ['ENBN', 'ENVA', 2], ['ENVA', 'ENKB', 3],
  ['ENKB', 'ENML', 2], ['ENML', 'ENAL', 2], ['ENAL', 'ENOV', 2], ['ENOV', 'ENFL', 2], ['ENFL', 'ENBR', 4], ['ENBR', 'ENHD', 4], ['ENHD', 'ENZV', 3], ['ENZV', 'ENCN', 3]
];
const HELI_ROUTES = [
  ['unn', 'finnsnes', 2], ['unn', 'harstad', 2], ['harstad', 'gravdal', 1], ['bodo', 'gravdal', 2], ['bodo', 'varoy', 2], ['bodo', 'mo', 1], ['banak', 'hammerfest', 2],
  ['kirkenes', 'vadso', 2], ['bronnoy', 'sandnes', 2], ['orland', 'namsos', 1], ['alesund', 'forde', 1], ['floro', 'forde', 2], ['sola', 'floro', 1]
];
const AIR = {plane:{kmh:470, alt:[700, 5500]}, heli:{kmh:250, alt:[250, 500]}, view:16};
let AIRL = null;
function airLegs(){
  if (AIRL) return AIRL;
  AIRL = [];
  const add = (kind, A, B, n, k) => { const a = P(A[0], A[1]), b = P(B[0], B[1]), d = dist(a, b); if (d < 2) return;
    AIRL.push({kind, a, b, d, n, k, hd:Math.atan2(b.x - a.x, -(b.y - a.y)), dur:d / AIR[kind].kmh, alt:kind === 'heli' ? AIR.heli.alt[0] + Math.min(1, d / 150) * (AIR.heli.alt[1] - AIR.heli.alt[0]) : Math.min(AIR.plane.alt[1], AIR.plane.alt[0] + d * 22)}); };
  AIR_ROUTES.forEach(([f, t, n], i) => { add('plane', AIRFIELDS[f], AIRFIELDS[t], n, i * 2); add('plane', AIRFIELDS[t], AIRFIELDS[f], n, i * 2 + 1); });
  HELI_ROUTES.forEach(([f, t, n], i) => { add('heli', HELIPADS[f], HELIPADS[t], n, 500 + i * 2); add('heli', HELIPADS[t], HELIPADS[f], n, 500 + i * 2 + 1); });
  return AIRL;
}
// the departures of a leg on day d (hours from the epoch): spread over 06–22, a little different each day
const airDeps = (L, d) => { const out = []; for (let j = 0; j < L.n; j++) out.push(d * 24 + 6.2 + (j + 0.15 + hash(L.k * 977 + d * 131 + j * 17) * 0.7) * (15.5 / L.n)); return out; };
// the aircraft in the air at H within km of p: {kind, p, alt (m), hd, pitch, v (km/h), id}
function airStates(H, p, km){
  const out = [], R = km || AIR.view, d0 = Math.floor(H / 24);
  for (const L of airLegs()){
    // the leg's line must pass within R of p
    const ux = (L.b.x - L.a.x) / L.d, uy = (L.b.y - L.a.y) / L.d, s0 = clamp((p.x - L.a.x) * ux + (p.y - L.a.y) * uy, 0, L.d);
    if (Math.hypot(L.a.x + ux * s0 - p.x, L.a.y + uy * s0 - p.y) > R) continue;
    for (const d of [d0 - 1, d0]) for (const dep of airDeps(L, d)){
      const u = (H - dep) / L.dur; if (u < 0 || u > 1) continue;
      const s = u * L.d, q = {x:L.a.x + ux * s, y:L.a.y + uy * s}; if (dist(q, p) > R) continue;
      // climb out at about 8 % and come in on a 3 degree slope, the cruise between (km from each end)
      const up = L.kind === 'heli' ? 1.2 : 0.08, dn = L.kind === 'heli' ? 1.2 : 0.052, alt = Math.max(0, Math.min(L.alt, s * 1000 * up, (L.d - s) * 1000 * dn));
      const pitch = alt < L.alt - 1 ? (s * 1000 * up < (L.d - s) * 1000 * dn ? Math.atan(up) : -Math.atan(dn)) : 0;
      out.push({kind:L.kind, p:q, alt:Math.max(alt, L.kind === 'heli' ? 15 : 30), hd:L.hd, pitch, v:AIR[L.kind].kmh, id:L.k * 100 + (dep - d * 24 | 0)});
    }
  }
  return out;
}
