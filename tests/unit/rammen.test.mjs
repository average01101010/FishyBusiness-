// The frame of H1b (docs/planer/havsteget-h1b-rammen.md, 03.11.2026): the seas the ocean fleet fishes are inside MAPB, the projection
// holds out there against PROJ (tests/proj_ref.json, tools/map/projref.py), the grid's scale k (gridScale) and the true distance
// (kmTrue), negative cells, and the far readers that pick the core's fine layers or the wide frame's coarse ones, with no data as land
// for a boat and as the open sea for a fetch ray.
import { readFileSync } from 'node:fs';
export default function (t){
  const K = t.K, {natP, natLL, utm33, utm33inv, gridScale, kmTrue, gridKey, gridKeyX, MAPB, farL, inFrame, isLandFar, coastDistFar, expoFar, landFracM, dcCellFar, fetchRay, newState} = K;
  K.set('S', newState()); const gridKeyY = K.get('gridKeyY');
  // the projection against PROJ in the far seas (Krüger of the sixth order holds well past 40° off the central meridian)
  const REF = JSON.parse(readFileSync(new URL('../proj_ref.json', import.meta.url), 'utf8'));
  let dE = 0, dG = 0, dK = 0, dB = 0, n = 0, far = 0;
  for (const r of REF){ const u = utm33(r.lat, r.lon), b = utm33inv(r.E, r.N); dE = Math.max(dE, Math.hypot(u.E - r.E, u.N - r.N)); dG = Math.max(dG, Math.abs(u.gamma - r.gamma)); dK = Math.max(dK, Math.abs(u.k - r.k));
    dB = Math.max(dB, Math.abs(b.lat - r.lat) + Math.abs(b.lon - r.lon)); n++; if (Math.abs(r.lon - 15) > 25) far++; }
  t.ok(far >= 7, 'PROJ-punktene tar med havet langt fra sentralmeridianen (' + far + ' over 25° unna)');
  t.ok(dE < 1e-3, 'utm33 mot PROJ innen 1 mm over ' + n + ' punkter (' + (dE * 1000).toFixed(3) + ' mm)');
  t.ok(dG < 1e-7 && dK < 1e-9, 'γ og k mot PROJ (' + dG.toExponential(1) + '°, ' + dK.toExponential(1) + ')');
  t.ok(dB < 1e-8, 'utm33inv tilbake innen 1e-8° (' + dB.toExponential(1) + ')');
  // the frame takes in every ground the ocean fleet fishes, and the old frame
  const seas = {Bjørnøya:[74.45, 19.0], 'nord på Svalbard':[80.8, 20.0], Kvitøya:[80.1, 32.0], Sentralbanken:[76.0, 35.0], Smutthullet:[73.5, 37.0], Petsjorahavet:[69.5, 52.0],
    'Novaja Semlja':[74.0, 56.0], 'Jan Mayen':[71.0, -8.5], 'Nord-Island':[66.5, -18.0], Reykjavík:[64.1, -22.0], Danmarkstredet:[66.5, -27.0], 'Øst-Grønland':[70.0, -22.0],
    Færøyane:[62.0, -7.0], Shetland:[61.0, -1.0], 'Nordsjøen vest':[59.0, -2.0], Lindesnes:[58.0, 7.0], 'Grense Jakobselv':[69.8, 31.0]};
  for (const [nm, [la, lo]] of Object.entries(seas)){ const p = natP(la, lo); t.ok(p.x > MAPB.x0 + 50 && p.x < MAPB.x1 - 50 && p.y > MAPB.y0 + 50 && p.y < MAPB.y1, nm + ' er i rammen med margin (x ' + p.x.toFixed(0) + ', y ' + p.y.toFixed(0) + ')'); }
  t.ok(MAPB.x0 <= 0 && MAPB.y0 <= 0 && MAPB.x1 >= 1450 && MAPB.y1 >= 1720, 'den gamle rammen ligger inne i den nye (origo er der det var)');
  // gridScale is k by the km cell; kmTrue takes it out
  for (const [nm, [la, lo]] of [['Finnsnes', [69.2287, 17.9816]], ['Reykjavík', [64.1, -22.0]], ['Petsjorahavet', [69.5, 52.0]], ['Bergen', [60.39, 5.32]]]){
    const p = natP(la, lo), c = natLL({x:Math.floor(p.x) + 0.5, y:Math.floor(p.y) + 0.5}), k = utm33(c.lat, c.lon).k;
    t.near(gridScale(p), k, 1e-12, nm + ': gridScale er k i midten av km-ruta (' + k.toFixed(4) + ')');
    const q = {x:p.x + 3, y:p.y + 4}; t.near(kmTrue(p, q), 5 / gridScale({x:p.x + 1.5, y:p.y + 2}), 1e-9, nm + ': kmTrue er rutenettets avstand delt på k');
  }
  t.ok(gridScale(natP(64.1, -22.0)) > 1.03, 'k ved Reykjavík er over 1,03 (avstandene ville vært 3–4 % for lange uten den)');
  t.ok(Math.abs(gridScale(natP(69.2287, 17.9816)) - 1) < 5e-4, 'k på Senja er innen 0,05 % av 1 (kysten er så godt som uendret)');
  // the true distance between two far points against the ellipsoid (Vincenty on GRS80 over 20 km): within 0.05 %
  const vin = (a, b) => { const A = 6378137, f = 1 / 298.257222101, B = A * (1 - f), r = Math.PI / 180, L = (b[1] - a[1]) * r, U1 = Math.atan((1 - f) * Math.tan(a[0] * r)), U2 = Math.atan((1 - f) * Math.tan(b[0] * r));
    let l = L, s, c, sg, sa, c2, cm, C, l0; const sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
    for (let i = 0; i < 100; i++){ const sl = Math.sin(l), cl = Math.cos(l); s = Math.sqrt((cU2 * sl) ** 2 + (cU1 * sU2 - sU1 * cU2 * cl) ** 2); c = sU1 * sU2 + cU1 * cU2 * cl; sg = Math.atan2(s, c); sa = cU1 * cU2 * sl / s; c2 = 1 - sa * sa; cm = c - 2 * sU1 * sU2 / c2; C = f / 16 * c2 * (4 + f * (4 - 3 * c2)); l0 = l; l = L + (1 - C) * f * sa * (sg + C * s * (cm + C * c * (-1 + 2 * cm * cm))); if (Math.abs(l - l0) < 1e-13) break; }
    const u2 = c2 * (A * A - B * B) / (B * B), AA = 1 + u2 / 16384 * (4096 + u2 * (-768 + u2 * (320 - 175 * u2))), BB = u2 / 1024 * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
    const ds = BB * s * (cm + BB / 4 * (c * (-1 + 2 * cm * cm) - BB / 6 * cm * (-3 + 4 * s * s) * (-3 + 4 * cm * cm))); return B * AA * (sg - ds) / 1000; };
  for (const [nm, a, b] of [['Danmarkstredet', [66.5, -27.0], [66.6, -26.7]], ['Petsjorahavet', [69.5, 52.0], [69.62, 52.2]], ['Senja', [69.3, 17.0], [69.4, 17.3]]]){
    const g = kmTrue(natP(a[0], a[1]), natP(b[0], b[1])), v = vin(a, b); t.near(g / v, 1, 5e-4, nm + ': kmTrue mot ellipsoiden (' + g.toFixed(3) + ' mot ' + v.toFixed(3) + ' km)');
  }
  // negative cells and keys
  for (const [ix, iy] of [[-5500, -6250], [-1, -1], [12499, 8599], [0, 0]]){ const k = gridKey(ix, iy); t.ok(gridKeyX(k) === ix && gridKeyY(k) === iy, 'gridKey fram og tilbake for (' + ix + ', ' + iy + ')'); }
  t.ok(gridKey(-1, 0) !== gridKey(0, -1) && gridKey(-1, -1) !== gridKey(0, 0), 'negative celler får egne nøkler');
  // the far readers on a stub of the core: a fine layer over the old frame and a coarse one over the whole frame
  const MAPD = K.get('MAPD'), keep = Object.assign({}, MAPD.L);
  // rcell reads a block of n by n cells; with n = 1 each cell is its own block, and the stub's mapBlock gives the cell's value
  const mk = (name, c, x0, y0, x1, y1, fn) => ({name, c, ix0:Math.round(x0 / c), iy0:Math.round(y0 / c), nx:Math.round((x1 - x0) / c), ny:Math.round((y1 - y0) / c), n:1, k:1, bx:NaN, by:NaN, b:null, fn});
  const L200 = mk('land200', 0.2, 0, 0, 1450, 1750, (x, y) => x > 800 && x < 900 && y > 300 && y < 400 ? 1 : 0), D200 = mk('dc200', 0.2, 0, 0, 1450, 1750, () => 50), E = mk('expo', 0.5, 0, 0, 1450, 1750, () => 200);
  const L1k = mk('land1k', 1, MAPB.x0, MAPB.y0, MAPB.x1, MAPB.y1, (x, y) => x > 700 && x < 900 && y > -900 && y < -400 ? 1 : 0), D1k = mk('dc1k', 1, MAPB.x0, MAPB.y0, MAPB.x1, MAPB.y1, (x, y) => Math.min(255, Math.round(Math.hypot(Math.max(0, 700 - x, x - 900), Math.max(0, -900 - y, y + 400)) / 0.5))), E2k = mk('expo2k', 2, MAPB.x0, MAPB.y0, MAPB.x1, MAPB.y1, () => 120);
  K.set('mapBlock', (L, bx, by) => { const v = L.fn((bx + 0.5) * L.c, (by + 0.5) * L.c); return [v]; });
  const put = Ls => { for (const k in MAPD.L) delete MAPD.L[k]; for (const L of Ls) MAPD.L[L.name] = L; };
  put([L200, D200, E]);
  // before the wide layers come (R2): the new seas have no data; land for a boat, the open sea for a fetch ray, as off the frame before
  const bj = natP(74.45, 19.0), sval = natP(78.2, 15.6), seja = {x:850, y:350}, sea = {x:700, y:300};
  t.ok(farL('land', sea) === L200 && farL('land', bj) === null, 'uten de grove lagene: 200 m-laget i den gamle rammen, ingenting ved Bjørnøya');
  t.ok(isLandFar(bj) && !inFrame(bj), 'uten data er Bjørnøya-havet land for båtene og utenfor kartet på skjermene');
  t.ok(coastDistFar(bj) === 0 && expoFar(bj) === 0 && landFracM(bj.x * 1000, bj.y * 1000) === 0, 'uten data: avstand 0, åpenhet 0 og sjø i 3D, som utenfor rammen før');
  t.ok(fetchRay(700, 5, 0, -1) >= K.get('FETCH').open, 'en strøklengdestråle nordover fra y 5 km får havets 600 km der dataene slutter, som før');
  t.ok(!isLandFar(sea) && isLandFar(seja) && coastDistFar(sea) === 5 && expoFar(sea) === 200, 'i den gamle rammen leses 200 m-lagene som før');
  // with the wide layers: they answer outside the old frame and never inside it (where the fine ones are)
  put([L200, D200, E, L1k, D1k, E2k]);
  t.ok(farL('land', sea) === L200 && farL('land', bj) === L1k && farL('dc', bj) === D1k && farL('expo', bj) === E2k, 'med de grove lagene: de fine i den gamle rammen, de grove utenfor');
  t.ok(!isLandFar(bj) && inFrame(bj) && isLandFar(sval), 'Bjørnøya-havet er sjø, Svalbard er land (1 km-laget)');
  const dBj = Math.min(127.5, Math.hypot(Math.max(0, 700 - bj.x, bj.x - 900), Math.max(0, bj.y + 400)));   // (u8 in 0.5 km steps: 127.5 km at most)
  t.near(coastDistFar(bj), dBj, 1, 'avstanden til land i 1 km-laget er i steg på 0,5 km (' + coastDistFar(bj).toFixed(1) + ' km)');
  t.near(dcCellFar(bj), dBj, 1, 'ruteplanleggerens grove celle leser samme lag');
  t.ok(expoFar(bj) === 120 && expoFar(sea) === 200, 'åpenheten fra 2 km-laget utenfor, 500 m-laget innenfor');
  t.ok(fetchRay(850, -300, 0, -1) < 300, 'en stråle nordover fra Bjørnøya-havet stopper på Svalbard');
  for (const k in MAPD.L) delete MAPD.L[k]; Object.assign(MAPD.L, keep);
}
