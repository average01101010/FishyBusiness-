'use strict';
// ===== CORE START =====
// This file comes first in the page: the 'use strict' above covers the whole first script.
// ===== PROJECTION: UTM zone 33 (ETRS89, EPSG:25833) =====
// Transverse Mercator after Krüger with Karney's (2011) sixth-order series: a few nanometres in the zone and well under a millimetre
// out to Grense Jakobselv (16 degrees east of the central meridian). Forward and back, with the meridian convergence gamma (degrees,
// true bearing = grid bearing + gamma, positive east of 15 degrees E) and the point scale k. Not in use yet: the whole coast is drawn in this projection
// from phase K4 of the coast plan, in a frame of km with x east and y south: x = (E + 250 km) / 1000, y = (8 050 km - N) / 1000.
const UTM = (() => {
  const a = 6378137, f = 1 / 298.257222101, n = f / (2 - f), n2 = n * n, n3 = n2 * n, n4 = n3 * n, n5 = n4 * n, n6 = n5 * n;
  const A = a / (1 + n) * (1 + n2 / 4 + n4 / 64 + n6 / 256);
  const al = [0,
    n / 2 - 2 * n2 / 3 + 5 * n3 / 16 + 41 * n4 / 180 - 127 * n5 / 288 + 7891 * n6 / 37800,
    13 * n2 / 48 - 3 * n3 / 5 + 557 * n4 / 1440 + 281 * n5 / 630 - 1983433 * n6 / 1935360,
    61 * n3 / 240 - 103 * n4 / 140 + 15061 * n5 / 26880 + 167603 * n6 / 181440,
    49561 * n4 / 161280 - 179 * n5 / 168 + 6601661 * n6 / 7257600,
    34729 * n5 / 80640 - 3418889 * n6 / 1995840,
    212378941 * n6 / 319334400];
  const be = [0,
    n / 2 - 2 * n2 / 3 + 37 * n3 / 96 - n4 / 360 - 81 * n5 / 512 + 96199 * n6 / 604800,
    n2 / 48 + n3 / 15 - 437 * n4 / 1440 + 46 * n5 / 105 - 1118711 * n6 / 3870720,
    17 * n3 / 480 - 37 * n4 / 840 - 209 * n5 / 4480 + 5569 * n6 / 90720,
    4397 * n4 / 161280 - 11 * n5 / 504 - 830251 * n6 / 7257600,
    4583 * n5 / 161280 - 108847 * n6 / 3991680,
    20648693 * n6 / 638668800];
  return {a, f, e:Math.sqrt(f * (2 - f)), n, A, al, be, k0:0.9996, lon0:15, fe:500000, e0:-250000, n1:8050000};
})();
const PJ_RAD = Math.PI / 180;
// lat, lon (degrees) to easting and northing (m), with gamma (degrees) and k
function utm33(lat, lon){
  const {e, A, al, k0, n} = UTM, phi = lat * PJ_RAD, lam = (lon - UTM.lon0) * PJ_RAD, s = Math.sin(phi);
  const t = Math.sinh(Math.atanh(s) - e * Math.atanh(e * s)), cl = Math.cos(lam), sl = Math.sin(lam);
  const xi1 = Math.atan2(t, cl), eta1 = Math.atanh(sl / Math.sqrt(1 + t * t));
  let xi = xi1, eta = eta1, sg = 1, ta = 0;
  for (let j = 1; j <= 6; j++){
    const c = Math.cos(2 * j * xi1), sn = Math.sin(2 * j * xi1), ch = Math.cosh(2 * j * eta1), sh = Math.sinh(2 * j * eta1);
    xi += al[j] * sn * ch; eta += al[j] * c * sh; sg += 2 * j * al[j] * c * ch; ta += 2 * j * al[j] * sn * sh;
  }
  const r = Math.sqrt(1 + t * t), tl = Math.tan(lam);
  const gamma = Math.atan((ta * r + sg * t * tl) / (sg * r - ta * t * tl)) / PJ_RAD;
  const tp = (1 - n) / (1 + n) * Math.tan(phi), k = k0 * A / UTM.a * Math.sqrt((1 + tp * tp) * (sg * sg + ta * ta) / (t * t + cl * cl));
  return {E:UTM.fe + k0 * A * eta, N:k0 * A * xi, gamma, k};
}
// easting and northing (m) back to lat, lon (degrees): the series to the conformal latitude, then Newton for the geodetic one
function utm33inv(E, N){
  const {e, A, be, k0} = UTM, xi = N / (k0 * A), eta = (E - UTM.fe) / (k0 * A);
  let xi1 = xi, eta1 = eta;
  for (let j = 1; j <= 6; j++){ xi1 -= be[j] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta); eta1 -= be[j] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta); }
  const sx = Math.sin(xi1), shy = Math.sinh(eta1), cx = Math.cos(xi1), tc = sx / Math.sqrt(shy * shy + cx * cx);
  let tau = tc;
  for (let i = 0; i < 5; i++){
    const sig = Math.sinh(e * Math.atanh(e * tau / Math.sqrt(1 + tau * tau)));
    const tp = tau * Math.sqrt(1 + sig * sig) - sig * Math.sqrt(1 + tau * tau);
    const d = (tc - tp) / Math.sqrt(1 + tp * tp) * (1 + (1 - e * e) * tau * tau) / ((1 - e * e) * Math.sqrt(1 + tau * tau));
    tau += d; if (Math.abs(d) < 1e-14) break;
  }
  return {lat:Math.atan(tau) / PJ_RAD, lon:UTM.lon0 + Math.atan2(shy, cx) / PJ_RAD};
}
// the national frame (km, x east, y south) and back
function natP(lat, lon){ const u = utm33(lat, lon); return {x:(u.E - UTM.e0) / 1000, y:(UTM.n1 - u.N) / 1000}; }
function natLL(p){ return utm33inv(p.x * 1000 + UTM.e0, UTM.n1 - p.y * 1000); }
