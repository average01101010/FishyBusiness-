// The upgrades' models and their place over the stern (OPP5 of docs/planer/oppgraderinger.md, 10.11.2026; tools/deck/oppgr.py, vessel3d.js
// SETTERS): the parts are in the page with the measures the game leans on (the tiers' knives and gaffs lie in the hand as the old ones),
// and on every coastal boat the line setter fits, the place kit.setter is on the model: the rail's top is under it (rays down the
// model), the sea is open aft of it, and nothing of the boat stands in the chute's way out over the stern.
export const scripts = ['js/vessel3d.js'];
export const data = true;

export default function (t){
  const {VESSELS, EQUIP, equipFits, glbHas, glbPart, glbLoad, geoOf} = t.K;
  const box = o => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < o.p.length; i += 3) for (let k = 0; k < 3; k++){ lo[k] = Math.min(lo[k], o.p[i + k]); hi[k] = Math.max(hi[k], o.p[i + k]); } return {lo, hi}; };
  const need = ['kniv2', 'kniv3', 'hott2', 'hott3', 'setter', 'setter_mag', 'setter_ben', 'renne'], miss = need.filter(n => !glbPart('deck-upg', n));
  t.ok(glbHas('deck-upg') && !miss.length, 'deck-upg har alle delene', miss);
  if (miss.length) return;
  // the tiers lie in the hand as the first: the blade's point and the hook's bend where fisk.py's are (the poses are made for those)
  const k1 = box(glbPart('deck-fish', 'kniv')), h1 = box(glbPart('deck-fish', 'hott'));
  for (const n of ['kniv2', 'kniv3']){ const b = box(glbPart('deck-upg', n)); t.ok(Math.abs(b.lo[2] - k1.lo[2]) < 0.012 && Math.abs(b.hi[2] - k1.hi[2]) < 0.012, `${n}: odden og skaftet som knivens (${b.lo[2].toFixed(3)} til ${b.hi[2].toFixed(3)} mot ${k1.lo[2].toFixed(3)} til ${k1.hi[2].toFixed(3)})`); }
  for (const n of ['hott2', 'hott3']){ const b = box(glbPart('deck-upg', n)); t.ok(Math.abs(b.lo[2] - h1.lo[2]) < 0.03 && Math.abs(b.lo[1] - h1.lo[1]) < 0.03, `${n}: kroken der høttens er (fram ${(-b.lo[2]).toFixed(3)} mot ${(-h1.lo[2]).toFixed(3)}, ned ${(-b.lo[1]).toFixed(3)} mot ${(-h1.lo[1]).toFixed(3)})`); }
  const h3 = box(glbPart('deck-upg', 'hott3')), X = (glbLoad('deck-upg') || {}).ex || {};
  t.ok(h3.hi[2] - h3.lo[2] > 1.4 && h3.hi[2] - h3.lo[2] < 1.7 && h1.hi[2] - h1.lo[2] < 1.0, `den lange høtten er lang: ${(h3.hi[2] - h3.lo[2]).toFixed(2)} m mot ${(h1.hi[2] - h1.lo[2]).toFixed(2)}`);
  t.ok(X.hott_butt && Math.abs(X.hott_butt.hott3 - h3.hi[2]) < 0.13 && X.mag && X.mag.leg && X.setter && X.renne, 'extras: høttenes ender, magasinets bein, setteren og renna');
  const se = box(glbPart('deck-upg', 'setter')), re = box(glbPart('deck-upg', 'renne')), mg = box(glbPart('deck-upg', 'setter_mag'));
  t.ok(se.hi[2] > 0.5 && se.hi[2] < 0.8 && se.lo[2] < -0.3 && se.hi[0] - se.lo[0] < 0.5, `linesetteren: ${(se.hi[2]).toFixed(2)} m ut over hekken, ${(-se.lo[2]).toFixed(2)} m inn, ${(se.hi[0] - se.lo[0]).toFixed(2)} m bred`);
  t.ok(re.hi[0] - re.lo[0] > 0.9 && re.hi[0] - re.lo[0] < 1.1 && re.hi[2] > 0.6, `garnrenna er bred: ${(re.hi[0] - re.lo[0]).toFixed(2)} m, ${(re.hi[2]).toFixed(2)} m ut over hekken`);
  t.ok(mg.hi[1] < 0.05 && mg.lo[2] < -1.4, `magasinet står innenfor rekka og under toppen av den (${mg.hi[1].toFixed(2)} m over, ${(-mg.lo[2]).toFixed(2)} m inn)`);
  // the place on every boat the setter fits
  const boats = Object.keys(VESSELS).filter(k => VESSELS[k].cls !== 'hav' && equipFits('linesetter', k) && glbHas(k));
  t.ok(boats.length >= 10, 'kystbåtene linesetteren passer: ' + boats.length);
  for (const k of boats){ const G = geoOf(k), P = G && G.kit && G.kit.setter;
    // (the 15 m boat's stern is the closed wall of her shelter deck: no place until the opening in the stern is built, OB12 in
    // docs/planer/om-bord.md; with the old place there this file's wall check was red)
    if (!P){ t.ok(k === 'kyst15', k + (k === 'kyst15' ? ': ingen plass over hekken ennå (lukket hekk, kommer med OB12)' : ': har plassen kit.setter')); continue; }
    const p = glbPart(k, 'lod0').p, a = P[3] || 0, D = [Math.sin(a), Math.cos(a)], R = [Math.cos(a), -Math.sin(a)];
    // the highest thing of the model under (x, z) between y0 and y1 (every triangle; a vertical ray)
    const top = (x, z, y0, y1) => { let best = null; for (let i = 0; i < p.length; i += 9){ const ax = p[i], az = p[i + 2], bx = p[i + 3], bz = p[i + 5], cx = p[i + 6], cz = p[i + 8];
        if (Math.min(ax, bx, cx) > x || Math.max(ax, bx, cx) < x || Math.min(az, bz, cz) > z || Math.max(az, bz, cz) < z) continue;
        const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-12) continue; const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, w = 1 - u - v;
        if (u < 0 || v < 0 || w < 0) continue; const y = u * p[i + 1] + v * p[i + 4] + w * p[i + 7]; if (y >= y0 && y <= y1 && (best == null || y > best)) best = y; } return best; };
    const at = (along, across) => [P[0] + D[0] * along + R[0] * across, P[2] + D[1] * along + R[1] * across];
    // (and a straight line through the model: does the segment A-B cut any triangle; walls stand upright, so the rays down miss them)
    const cut = (A, B) => { const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]; for (let i = 0; i < p.length; i += 9){
        const e1 = [p[i + 3] - p[i], p[i + 4] - p[i + 1], p[i + 5] - p[i + 2]], e2 = [p[i + 6] - p[i], p[i + 7] - p[i + 1], p[i + 8] - p[i + 2]];
        const h = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]], det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2]; if (Math.abs(det) < 1e-12) continue;
        const s0 = [A[0] - p[i], A[1] - p[i + 1], A[2] - p[i + 2]], u = (s0[0] * h[0] + s0[1] * h[1] + s0[2] * h[2]) / det; if (u < 0 || u > 1) continue;
        const q = [s0[1] * e1[2] - s0[2] * e1[1], s0[2] * e1[0] - s0[0] * e1[2], s0[0] * e1[1] - s0[1] * e1[0]], v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det; if (v < 0 || u + v > 1) continue;
        const tt = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det; if (tt >= 0 && tt <= 1) return tt; } return null; };
    // the rail's top just inside the place, within 6 cm of its height
    let rail = null; for (const al of [-0.03, -0.06, -0.09]){ const q = at(al, 0), y = top(q[0], q[1], P[1] - 0.3, P[1] + 0.3); if (y != null && (rail == null || Math.abs(y - P[1]) < Math.abs(rail - P[1]))) rail = y; }
    t.ok(rail != null && Math.abs(rail - P[1]) < 0.06, `${k}: toppen av rekka er under plassen (${rail == null ? 'ingen' : rail.toFixed(2)} mot ${P[1]})`);
    // the sea aft of it: nothing of the model as high as the rail from 0.12 m out, and nothing in the chute's way (from 3 cm over the
    // rail's top to 0.5 m over it, the setter's width, from the rail and 0.67 m out)
    let hit = null; for (let al = 0.12; al <= 0.68 && !hit; al += 0.07) for (const ac of [-0.2, 0, 0.2]){ const q = at(al, ac), y = top(q[0], q[1], P[1] - 0.14, P[1] + 0.5); if (y != null){ hit = [al.toFixed(2), ac, y.toFixed(2)]; break; } }
    t.ok(!hit, `${k}: fritt ut over hekken der renna går` + (hit ? ' ' + JSON.stringify(hit) : ''));
    // and over the rail inboard where the chute's mouth is (0.4 m in, 3 cm to 0.5 m over the rail's top)
    let hin = null; for (let al = -0.4; al <= 0 && !hin; al += 0.08) for (const ac of [-0.2, 0, 0.2]){ const q = at(al, ac), y = top(q[0], q[1], P[1] + 0.04, P[1] + 0.5); if (y != null){ hin = [al.toFixed(2), ac, y.toFixed(2)]; break; } }
    t.ok(!hin, `${k}: fritt over rekka der munningen står` + (hin ? ' ' + JSON.stringify(hin) : ''));
    // no wall, post or rail across the chute: straight lines along it from 0.67 m out to 0.45 m in, 0.12 and 0.3 m over the rail's top
    let wall = null; for (const ac of [-0.15, 0, 0.15]) for (const up of [0.12, 0.3]){ const A = at(0.67, ac), B = at(-0.45, ac), u = cut([A[0], P[1] + up, A[1]], [B[0], P[1] + up, B[1]]); if (u != null && !wall) wall = [ac, up, (0.67 - u * 1.12).toFixed(2)]; }
    t.ok(!wall, `${k}: ingen vegg, stolpe eller rekke på tvers av renna` + (wall ? ' ' + JSON.stringify(wall) : ''));
    // the widest thing she can carry there (the net chute where it fits, else the setter) clear of the flagstaff and of what stands on
    // the rail to each side: the staff outside its edge, and no post or rail across its sides
    const wide = equipFits('garnrenne', k) ? X.renne.half : X.setter.half, pole = G.pole;
    if (pole){ const dx = pole[0] - P[0], dz = pole[2] - P[2], ac = Math.abs(dx * R[0] + dz * R[1]), al = dx * D[0] + dz * D[1];
      t.ok(ac > wide + 0.01 || al < -0.5 || al > 0.8, `${k}: flaggstanga står klar av ${equipFits('garnrenne', k) ? 'garnrenna' : 'linesetteren'} (${ac.toFixed(2)} m til siden mot ${wide.toFixed(2)})`); }
    let side = null; for (const ac of [-(wide - 0.05), wide - 0.05]) for (const up of [0.15, 0.3]){ const A = at(0.6, ac), B = at(-0.3, ac), u = cut([A[0], P[1] + up, A[1]], [B[0], P[1] + up, B[1]]); if (u != null && !side) side = [ac.toFixed(2), up, (0.6 - u * 0.9).toFixed(2)]; }
    t.ok(!side, `${k}: ingenting på rekka i veien for sidene (${wide.toFixed(2)} m til hver side)` + (side ? ' ' + JSON.stringify(side) : ''));
    // the tub magazine inside the bulwark (where the place says her deck has room): nothing of the model in the rack or in the tubs on
    // it (from 6 cm under the rollers to 0.45 m over them), and a deck under its legs
    if (P[4] !== 0){ const Mg = X.mag, ry = P[1] + Mg.top; let clash = null;
      for (let al = -Mg.at[0]; al >= -Mg.at[1] - 1e-6 && !clash; al -= 0.106) for (const ac of [-Mg.half, -Mg.half / 2, 0, Mg.half / 2, Mg.half]){ const q = at(al, ac), y = top(q[0], q[1], ry - 0.06, ry + 0.45); if (y != null){ clash = [al.toFixed(2), ac, y.toFixed(2)]; break; } }
      t.ok(!clash, `${k}: magasinet står fritt innenfor rekka` + (clash ? ' ' + JSON.stringify(clash) : ''));
      const lq = at(Mg.leg[2], 0), dk = top(lq[0], lq[1], P[1] - 2.4, ry - 0.3);
      t.ok(dk != null && ry - dk > 0.3 && ry - dk < 1.6, `${k}: dekk under magasinets bein (${dk == null ? 'ingen' : (ry - dk).toFixed(2) + ' m under rullene'})`); }
  }
  // the net chute is wider: the same on the boats it fits
  t.ok(EQUIP.garnrenne && EQUIP.linesetter, 'varene finnes');
}
