// The boat models' numbers in Node (moved from tests/vessel3d.py 01.11.2026, Jonas: «flytt tallsjekkene til en rask Node-test»): each type
// with a model is built from src/data/ as the page builds it (vessel3d.js needs no WebGL), and checked as vessel3d.py checked it in
// SwiftShader: the points near and in the middle version against the budget, no NaN, the hull's length and beam against VESSELS, every
// place the 3D view needs, and the local fleet's kit models (scale, budget, livery). vessel3d.py keeps the pictures, the showroom and
// another player's boat.
export const scripts = ['js/vessel3d.js'];
export const data = true;

export default function (t){
  const {VESSELS, vesselSpec, glbHas, glbPart, buildVesselModel, FLEET, npcKit, npcModel} = t.K;
  const types = Object.keys(VESSELS).filter(k => vesselSpec(k) && (!vesselSpec(k).hand || glbHas(k)));
  t.ok(types.length >= 15, 'typene med modell: ' + types.length);
  for (const k of types){
    const V = VESSELS[k], m = buildVesselModel(k, 2), mid = buildVesselModel(k, 1).o.p.length / 3, verts = m.o.p.length / 3;
    const nan = m.o.p.some(x => !isFinite(x)) || m.o.n.some(x => !isFinite(x));
    // a detailed model from tools/boats is drawn as triangles without shared corners: about three points to a triangle. Your own boat near
    // (lod 2) up to some 300 000 triangles since F1 (30.10.2026), its middle version (lod 1: lodm, else lod0) at 120 000 points
    const budget = m.glb ? 900000 : V.cls === 'hav' ? 45000 : 25000, bmid = m.glb ? 120000 : budget;
    t.ok(verts <= budget && mid <= bmid && !nan, `${k}: ${verts} punkter nær (budsjett ${budget}), ${mid} middels (budsjett ${bmid}), uten NaN`);
    if (m.glb){
      // the hull from 0.3 m under the waterline to 1.5 m over it (the fender strake, the stem up to it), without the bow roller, the riding
      // sail's boom and the gantry over the stern; a raked stem over a bulb makes it up to 6 % shorter than the length over all
      const H = glbPart(k, 'lod0') || m.o; let z0 = 1e9, z1 = -1e9, x0 = 1e9, x1 = -1e9;
      for (let i = 0; i < H.p.length; i += 3){ const y = H.p[i + 1]; if (y < -0.3 || y > 1.5) continue; const x = H.p[i], z = H.p[i + 2]; z0 = Math.min(z0, z); z1 = Math.max(z1, z); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
      const len = z1 - z0, beam = x1 - x0, need = ['eye', 'skipperAt', 'crewSpots', 'lights', 'hauler', 'pole', 'deck', 'stern', 'bow'], miss = need.filter(q => !m.geo || m.geo[q] == null);
      t.ok(-0.06 < (len - V.len) / V.len && (len - V.len) / V.len < 0.03 && Math.abs(beam - V.beam) / V.beam < 0.05 && !miss.length,
        `${k} (GLB): skroget ${len.toFixed(2)} × ${beam.toFixed(2)} m mot ${V.len} × ${V.beam}` + (miss.length ? ', mangler ' + miss.join(', ') : ', alle plassene finnes'));
    } else {
      let z0 = 1e9, z1 = -1e9; for (let i = 2; i < m.o.p.length; i += 3){ z0 = Math.min(z0, m.o.p[i]); z1 = Math.max(z1, m.o.p[i]); }
      t.ok(Math.abs(z1 - z0 - V.len) / V.len < 0.08, `${k}: modellen er ${(z1 - z0).toFixed(2)} m lang mot ${V.len}`);
    }
  }
  // the local fleet: each boat on the nearest kit model within 30 % of her length and beam, the versions within their budgets, liveries
  const kits = FLEET.map(f => { const k = npcKit(f.L, f.B), V = VESSELS[k]; return [f.n, k, f.L / V.len, f.B / V.beam]; });
  t.ok(kits.every(q => q[1] && q[2] >= 0.75 && q[2] <= 1.3 && q[3] >= 0.75 && q[3] <= 1.3), 'hver båt i lokalflåten får en modell innenfor 30 % av lengden og bredden', kits.filter(q => !(q[2] >= 0.75 && q[2] <= 1.3 && q[3] >= 0.75 && q[3] <= 1.3)));
  for (const k of [...new Set(kits.map(q => q[1]))]){
    const near = npcModel(k, 1, 1), far = npcModel(k, 0.3, 2), a = near.o.p.length / 3, b = far.o.p.length / 3, g = !!near.glb;
    t.ok(a <= (g ? 120000 : 25000) && b <= (g ? 12000 : 6000), `lokalflåten ${k}: ${a} punkter nær (${g ? 120000 : 25000}), ${b} fjern (${g ? 12000 : 6000})`);
  }
  const c0 = npcModel('sjark', 0.3, 0).o.c, c1 = npcModel('sjark', 0.3, 1).o.c; let d = 0; for (let i = 0; i < c0.length; i++) if (Math.abs(c0[i] - c1[i]) > 1e-3) d++;
  t.ok(d > 0, 'utgavene (livery) endrer fargene');
  // the painted places on every hull (07.11.2026: the ringnotbåt had no place for the company logo, so it was never drawn on her): the
  // logo, the registration mark and the call sign on both sides, and the logo on none of the name, the mark and the call sign
  const {logoStrips, markStrips, callStrips, nameStrips, stripProud, stripPaint} = t.K;
  const box = s => { const P = s[0].concat(s[1]), z = P.map(p => p[2]), y = P.map(p => p[1]); return [Math.min(...z), Math.max(...z), Math.min(...y), Math.max(...y), Math.sign(P.reduce((a, p) => a + p[0], 0))]; };
  const all = Object.keys(VESSELS), miss = all.filter(k => !(logoStrips(k) && markStrips(k) && callStrips(k)));
  t.ok(!miss.length, `hver type (${all.length}) har plass til rederilogoen, registreringsmerket og kallesignalet på skroget` + (miss.length ? ', mangler: ' + miss.join(', ') : ''));
  const laps = []; for (const k of all){ const L = logoStrips(k); if (!L) continue;
    for (const [n, st] of [['navnet', nameStrips(k)], ['merket', markStrips(k)], ['kallesignalet', callStrips(k)]]) if (st && L.some(a => st.some(b => { const p = box(a), q = box(b); return p[4] === q[4] && p[0] < q[1] && p[1] > q[0] && p[2] < q[3] && p[3] > q[2]; }))) laps.push(k + ' på ' + n); }
  t.ok(!laps.length, 'logoen ligger ikke på navnet, merket eller kallesignalet' + (laps.length ? ': ' + laps.join(', ') : ''));
  // the ringnotbåt's logo stands on the blue band of her topsides near midships, on each side: no porthole, outlet or strake under it
  // or within a quarter of its height round it, one even hull paint
  const {stripBare} = t.K, R = logoStrips('ringnot38'), Rb = R && R.map(box), z0 = Math.min(...t.K.HULLT.ringnot38.flatMap(q => [q[2], q[5], q[8]])), Lr = VESSELS.ringnot38.len;
  t.ok(R && R.every(s => { const p = stripPaint('ringnot38', s); return !stripProud('ringnot38', s) && !stripBare('ringnot38', s) && p && p.even >= 0.9 && p.zone1 >= 0.9; })
    && Rb.every(b => b[3] - b[2] >= 0.9 && Math.abs((b[0] + b[1]) / 2 - z0 - Lr / 2) < 0.15 * Lr),
    'ringnot38: logoen nær midtskips på skrogets egen maling, uten koøyer, utløp eller lister under eller rundt den på noen side, minst 0,9 m høy'
    + (R ? ' (' + Rb.map((b, i) => `${i ? 'babord' : 'styrbord'} ${(b[3] - b[2]).toFixed(2)} m, z ${b[0].toFixed(2)}–${b[1].toFixed(2)}, y ${b[2].toFixed(2)}–${b[3].toFixed(2)}`).join('; ') + ')' : ''));
  // TP1 (steg 108): another player's model is keyed on the part of her paint code that changes it (livPaint: h o d r t v s g x), not on
  // her registration mark, logo or flag, so two boats painted alike share one model; a partner's design ('x:') is a model of its own.
  // Seen red 13.11.2026 against vessel3d.js before the change: npcModel gave each code its own model.
  const {livPaint, livFlag} = t.K;
  const A = 'h:kobolt;r:hvit;f:SE.vimpel;m:T.112.LK;l:g.anker.JH.marine.hvit', B = 'h:kobolt;r:hvit;f:NO.rekt;m:N.12.B;l:u.3', C = 'h:kobolt;r:hvit;x:-9', D = 'h:oksblod;r:hvit;m:T.112.LK';
  t.ok(npcModel('sjark', 0.3, A) === npcModel('sjark', 0.3, B), 'to spillerbåter med lik maling og ulikt merke, logo og flagg får samme modell');
  t.ok(npcModel('sjark', 0.3, A) !== npcModel('sjark', 0.3, D), 'ulik skrogfarge gir egen modell');
  t.eq(typeof livPaint === 'function' && livPaint(A), 'h:kobolt;r:hvit', 'livPaint: bare malingen blir igjen');
  t.ok(typeof livPaint === 'function' && livPaint(C) !== livPaint(A) && livPaint(C).endsWith('x:-9'), 'livPaint: et sponset design gir en ny nøkkel');
  t.eq(typeof livPaint === 'function' && [livPaint('f:SE.rekt;m:T.1.LK'), livPaint(3), livPaint('m:T.1.LK;h:hvit;g:1;h:rod')], ['', 3, 'h:rod;g:1'], 'livPaint: tom uten maling, tallene for lokalflåten som de er, fast rekkefølge, den siste av to like (som livParse)');
  t.eq(typeof livFlag === 'function' && [livFlag(A), livFlag(''), livFlag('h:hvit;f:LOGO.splitt'), livFlag('f:XX.rekt'), livFlag('f:SE.bred')].map(f => f.code + '.' + f.shape),
    ['SE.vimpel', 'NO.rekt', 'LOGO.splitt', 'NO.rekt', 'SE.rekt'], 'livFlag: det kjøpte flagget, ellers Norge i rektangel');
}
