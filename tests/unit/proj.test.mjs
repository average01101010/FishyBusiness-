// The national frame (core/00-proj.js, 01-world.js): UTM zone 33 in km, x = (E + 250 km) / 1000 east, y = (8 050 km − N) / 1000 south,
// and the grid convergence that turns a grid bearing into a true one. Known points along the coast go there and back.
// UTM 33 itself against PROJ (tests/proj_ref.json from tools/map/projref.py, pyproj EPSG:25833), moved here from tests/projtest.py 02.11.2026.
import { readFileSync } from 'node:fs';
const REF = JSON.parse(readFileSync(new URL('../proj_ref.json', import.meta.url), 'utf8'));
export default function (t){
  const {natP, natLL, P, gridGamma, trueDeg, newState, utm33, utm33inv} = t.K;
  {
    const RAD = Math.PI / 180;
    let dE = 0, dG = 0, dK = 0, dBack = 0, dFrame = 0;
    for (const q of REF){
      const u = utm33(q.lat, q.lon); dE = Math.max(dE, Math.hypot(u.E - q.E, u.N - q.N)); dG = Math.max(dG, Math.abs(u.gamma - q.gamma)); dK = Math.max(dK, Math.abs(u.k - q.k));
      const ll = utm33inv(u.E, u.N); dBack = Math.max(dBack, Math.hypot((ll.lat - q.lat) * 111320, (ll.lon - q.lon) * 111320 * Math.cos(q.lat * RAD)));
      const g = natLL(natP(q.lat, q.lon)); dFrame = Math.max(dFrame, Math.hypot((g.lat - q.lat) * 111320, (g.lon - q.lon) * 111320 * Math.cos(q.lat * RAD)));
    }
    t.ok(dE < 0.001, 'UTM 33 fram er innen 1 mm av PROJ i alle ' + REF.length + ' punktene (' + (dE * 1000).toFixed(4) + ' mm)');
    t.ok(dG < 1e-7 && dK < 1e-9, 'meridiankonvergensen og punktskalaen stemmer med PROJ');
    t.ok(dBack < 1e-5 && dFrame < 1e-5, 'tilbake til lat/lon innen 0,01 mm, også gjennom rammen i km');
    const gj = natP(69.7895, 30.9555), id = natP(58.9, 11.43), sw = natP(57.0, 4.0);
    t.ok(0 < gj.x && gj.x < 1450 && 0 < gj.y && gj.y < 1720 && 0 < id.x && id.x < 1450 && 0 < id.y && id.y < 1720 && sw.x > 0 && sw.y < 1720, 'rammen rommer Grense Jakobselv, Iddefjorden og havet utenfor Jæren');
    const a = utm33(69.5, 25), c = utm33(69.5001, 25), brg = Math.atan2(c.E - a.E, c.N - a.N) / RAD;
    t.ok(Math.abs(brg + a.gamma) < 1e-3, 'sann nord ligger γ mot klokka fra rutenettets nord (sann kurs = rutenettkurs + γ)');
  }
  t.K.set('S', newState());
  const pts = {Bergen:[60.3913, 5.3221], Ålesund:[62.4722, 6.1549], Bodø:[67.2804, 14.4049], Finnsnes:[69.2287, 17.9816], Hammerfest:[70.6634, 23.6821], Vardø:[70.3705, 31.1107]};
  for (const [name, [lat, lon]] of Object.entries(pts)){
    const p = natP(lat, lon), ll = natLL(p);
    t.near(ll.lat, lat, 1e-7, name + ' fram og tilbake, bredde');
    t.near(ll.lon, lon, 1e-7, name + ' fram og tilbake, lengde');
    t.ok(p.x > 0 && p.y > 0, name + ' ligger i positivt rutenett (x ' + p.x.toFixed(0) + ', y ' + p.y.toFixed(0) + ')');
  }
  t.eq(P(69.2287, 17.9816), natP(69.2287, 17.9816), 'P(lat, lon) er natP');
  // Finnsnes by the frame's definition: UTM 33 E 617 967, N 7 682 734 (Kartverket), so x = 867.97, y = 367.27
  const f = natP(69.2287, 17.9816);
  t.near(f.x, 867.967, 0.002, 'Finnsnes x fra UTM 33 øst');
  t.near(f.y, 367.266, 0.002, 'Finnsnes y fra UTM 33 nord');
  // y grows southward, x eastward
  t.ok(natP(60.39, 5.32).y > natP(70.37, 31.11).y, 'y vokser sørover');
  t.ok(natP(70.37, 31.11).x > natP(60.39, 5.32).x, 'x vokser østover');
  // the grid convergence: zero on the central meridian 15° E, positive east of it, negative west, growing with latitude
  t.near(gridGamma(natP(68, 15)), 0, 0.02, 'γ ≈ 0 på sentralmeridianen 15° Ø (regnet i midten av 1 km-ruta)');
  t.ok(gridGamma(f) > 2 && gridGamma(f) < 3.5, 'γ ved Finnsnes er 2–3,5°');
  t.ok(gridGamma(natP(60.39, 5.32)) < -7, 'γ ved Bergen er negativ (vest for 15° Ø)');
  t.ok(gridGamma(natP(70.37, 31.11)) > 14, 'γ ved Vardø er over 14°');
  // trueDeg takes the grid heading in radians (as S.boat.heading is) and gives true degrees
  t.near(trueDeg(0, f), gridGamma(f), 1e-9, 'sann kurs = rutenettkurs + γ');
  t.near(trueDeg(Math.PI / 2, f), 90 + gridGamma(f), 1e-9, 'trueDeg(π/2) = 90° + γ');
  t.near(trueDeg(2 * Math.PI - 0.001, f), (360 - 0.001 * 180 / Math.PI + gridGamma(f)) % 360, 1e-9, 'trueDeg holder seg i 0–360');
}
