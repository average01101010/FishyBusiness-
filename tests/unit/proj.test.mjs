// The national frame (core/00-proj.js, 01-world.js): UTM zone 33 in km, x = (E + 250 km) / 1000 east, y = (8 050 km − N) / 1000 south,
// and the grid convergence that turns a grid bearing into a true one. Known points along the coast go there and back.
export default function (t){
  const {natP, natLL, P, gridGamma, trueDeg, newState} = t.K;
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
