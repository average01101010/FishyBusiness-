// ===== harbours: quays, berths and mooring =====
// Quays and piers from OpenStreetMap as the boxes the 3D view draws (metres): an open pier line is a 4.2 m wide quay along it,
// a closed quay outline is its oriented bounding box, a breakwater is lower and wider. Harbours without a mapped quay get one
// from the shore out to the berth. The 3D view and the berths both use this list, so a boat lies against what you see.
const QTOP = 2.4;   // quay deck above mean sea level (m); about 3.7 m above chart datum, usual for fishing quays in the north
const PIERBOX = (() => {
  const out = [];
  for (const pr of PIERS){
    const bw = pr[0] === 1, n = (pr.length - 1) / 2, X = k => pr[1 + k * 2] * 1000, Z = k => pr[2 + k * 2] * 1000;
    const closed = n > 3 && Math.hypot(X(0) - X(n - 1), Z(0) - Z(n - 1)) < 1;
    if (closed && !bw){
      let cx = 0, cz = 0; for (let k = 0; k < n - 1; k++){ cx += X(k); cz += Z(k); } cx /= n - 1; cz /= n - 1;
      let sxx = 0, szz = 0, sxz = 0; for (let k = 0; k < n - 1; k++){ const a = X(k) - cx, b = Z(k) - cz; sxx += a * a; szz += b * b; sxz += a * b; }
      const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th); let l0 = 1e9, l1 = -1e9, w0 = 1e9, w1 = -1e9;
      for (let k = 0; k < n - 1; k++){ const a = X(k) - cx, b = Z(k) - cz, pu = a * ux + b * uz, pv = -a * uz + b * ux; l0 = Math.min(l0, pu); l1 = Math.max(l1, pu); w0 = Math.min(w0, pv); w1 = Math.max(w1, pv); }
      out.push({x:cx + ux * (l0 + l1) / 2 - uz * (w0 + w1) / 2, z:cz + uz * (l0 + l1) / 2 + ux * (w0 + w1) / 2, w:Math.max(3, w1 - w0), l:Math.max(3, l1 - l0), ang:Math.atan2(ux, uz), bw:false, closed:true});
    } else for (let k = 0; k < n - 1; k++){
      const ax = X(k), az = Z(k), bx = X(k + 1), bz = Z(k + 1), L = Math.hypot(bx - ax, bz - az); if (L < 0.5) continue;
      out.push({x:(ax + bx) / 2, z:(az + bz) / 2, w:bw ? 9 : 4.2, l:L + (bw ? 4 : 1), ang:Math.atan2(bx - ax, bz - az), bw, closed:false});
    }
  }
  for (const pt of PORTS){
    if (pt.pier) continue;
    const px = pt.p.x * 1000, pz = pt.p.y * 1000, dx = pt.coast.x * 1000 - px, dz = pt.coast.y * 1000 - pz, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ql = L + 20;
    out.push({x:px + ux * (ql / 2 + 8), z:pz + uz * (ql / 2 + 8), w:9, l:ql, ang:Math.atan2(ux, uz), bw:false, closed:false, made:true});
  }
  return out;
})();
// beam (m) of the player's vessels, for lying alongside
const BEAM = {skiff:2.2, snekke:2.7, sjark:3.8, sjarkny:4.3};
const CAST_MIN = 2;   // game minutes to take the lines in before the boat moves
// Where a vessel lies in a harbour: alongside the quay face nearest the harbour's berth point, parallel to it with the quay to
// starboard (where the skipper stands), off the face by half the beam and the fenders. Returned in km like the rest of the chart,
// with the face (metres) for the bollards and fenders. null when there is no quay near: the boat then lies as before.
const BERTHPOSE = {};
function berthPose(pid, type){
  const key = pid + '|' + type; if (key in BERTHPOSE) return BERTHPOSE[key];
  const pt = portById(pid), px = pt.p.x * 1000, pz = pt.p.y * 1000, Lb = VESSELS[type].len, Bb = BEAM[type] || 3;
  let best = null;
  for (const q of PIERBOX){
    if (q.bw || Math.hypot(q.x - px, q.z - pz) > (q.l + q.w) / 2 + 150) continue;
    const ax = Math.sin(q.ang), az = Math.cos(q.ang), nx = Math.cos(q.ang), nz = -Math.sin(q.ang);
    const faces = [[nx, nz, q.w / 2, ax, az, q.l / 2], [-nx, -nz, q.w / 2, ax, az, q.l / 2]];
    if (q.closed) faces.push([ax, az, q.l / 2, nx, nz, q.w / 2], [-ax, -az, q.l / 2, nx, nz, q.w / 2]);
    for (const [Nx, Nz, off, ux, uz, hl] of faces){
      const fx = q.x + Nx * off, fz = q.z + Nz * off, rx = px - fx, rz = pz - fz, along = rx * ux + rz * uz, out = rx * Nx + rz * Nz;
      if ((out < -1 && Math.abs(along) < hl) || hl * 2 < Lb + 2) continue;   // inside the quay, or a face too short to lie at
      const room = Math.max(0, hl - Lb / 2 - 1), a = clamp(along, -room, room), d = Math.hypot(along - a, out);
      const cx = fx + ux * a + Nx * (Bb / 2 + 0.4), cz = fz + uz * a + Nz * (Bb / 2 + 0.4);
      const ends = [[cx, cz], [cx + ux * Lb / 2, cz + uz * Lb / 2], [cx - ux * Lb / 2, cz - uz * Lb / 2]];
      if (ends.some(([x, z]) => isLand({x:x / 1000, y:z / 1000}))) continue;
      if (!best || d < best.d) best = {d, cx, cz, fx, fz, ux, uz, Nx, Nz, hl, a, depth:off * 2};
    }
  }
  if (!best || best.d > 150){ BERTHPOSE[key] = null; return null; }
  // starboard of a boat heading hd is (cos hd, sin hd); the quay must be on that side
  let hd = Math.atan2(best.ux, -best.uz); if (Math.cos(hd) * -best.Nx + Math.sin(hd) * -best.Nz < 0) hd += Math.PI;
  const f = {x:Math.sin(hd), z:-Math.cos(hd)};
  return BERTHPOSE[key] = {x:best.cx / 1000, y:best.cz / 1000, hd, fwd:f, face:{x:best.fx, z:best.fz, ux:best.ux, uz:best.uz, nx:best.Nx, nz:best.Nz, hl:best.hl, depth:best.depth}, a:best.a, Lb, Bb};
}
