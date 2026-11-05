// The cod by main area (COD_AREA in core/03f-fiske.js, 05.11.2026): the landing notes per vessel-day give Finnmark about twice Senja in
// the skrei season (boats under 11 m with jig, March 2025-2026: West Finnmark 892 kg a day, East Finnmark 664, Senja 430). The table
// lifts only Finnmark, the skrei more than the resident cod, and leaves Senja and Lofoten as they were.
export default function (t){
  const K = t.K, P = K.P, H = (m, d) => (Date.UTC(2028, m, d, 8) - K.EPOCH) / 3.6e6;
  K.set('S', K.newState()); t.ok(K.fkBuild() && K.FK.af.torsk, 'fiske.json leses');
  const at = (lat, lon, h) => { const p = P(lat, lon), T = {H:h, fk:K.fkMonth(h), skf:{}}; T.torsk = {av:K.seasonal(K.SPECIES.torsk.av, h), sf:1}; return K.fkAvail('torsk', {p, d:100, E:0.8, skr:1, c:K.lokOfCell(p)}, T); };
  const lok = (lat, lon) => { const c = K.lokOfCell(P(lat, lon)); return c.l >= 0 ? K.RU.lok[c.l].c : '-'; };
  const GJE = [71.15, 25.40], VARDO = [70.40, 31.20], LOF = [68.13, 14.45], HUS = K.natLL(K.GROUNDS[0].p);
  t.ok(lok(...GJE).startsWith('04') && lok(...VARDO).startsWith('03') && lok(...LOF).startsWith('00') && lok(HUS.lat, HUS.lon).startsWith('05'), `stedene ligger i 04, 03, 00 og 05: ${lok(...GJE)}, ${lok(...VARDO)}, ${lok(...LOF)}, ${lok(HUS.lat, HUS.lon)}`);
  const mar = H(2, 10), keep = {...K.COD_AREA};
  const g1 = at(...GJE, mar), v1 = at(...VARDO, mar), l1 = at(...LOF, mar), h1 = at(HUS.lat, HUS.lon, mar);
  for (const k in K.COD_AREA) K.COD_AREA[k] = [1, 1];
  const g0 = at(...GJE, mar), v0 = at(...VARDO, mar), l0 = at(...LOF, mar), h0 = at(HUS.lat, HUS.lon, mar);
  Object.assign(K.COD_AREA, keep);
  t.ok(g1 / g0 > 1.4 && g1 / g0 < 2, `Vest-Finnmark i mars løftes (${(g1 / g0).toFixed(2)}×)`);
  t.ok(v1 / v0 > 1.4 && v1 / v0 < 2.3, `Øst-Finnmark i mars løftes (${(v1 / v0).toFixed(2)}×)`);
  t.ok(l1 === l0 && h1 === h0, 'Lofoten og Senja er som før');
  t.ok(K.COD_AREA['04'][1] > K.COD_AREA['04'][0] && K.COD_AREA['03'][1] > K.COD_AREA['03'][0], 'skreien løftes mer enn den stedegne torsken');
}
