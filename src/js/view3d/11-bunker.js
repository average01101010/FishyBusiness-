  // ---------- bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle ----------
  const BUNKERS = []; let BUNKN = null;
  function buildBunkers(){
    BUNKERS.length = 0; const nb = NB();
    const TANK = [0.9, 0.91, 0.9, 0.35], RED = [0.78, 0.12, 0.1, 0.35], CONC = [0.62, 0.62, 0.6, 0.05], DK = [0.14, 0.15, 0.16, 0.3], STEEL = [0.7, 0.72, 0.74, 0.5], POLE = [0.45, 0.47, 0.5, 0.4];
    for (const pt of PORTS){
      if (!pt.fuel || !portHere(pt)) continue; const kind = hasBunker(pt.id) ? 'bunker' : 'main', bp = berthPose(pt.id, 'skiff', kind); if (!bp) continue;
      const f = bp.face, u = [f.ux, f.uz], n = [f.nx, f.nz], at = (a, o) => [f.x + u[0] * a + n[0] * o, f.z + u[1] * a + n[1] * o], depth = f.depth || 6;
      const pa = clamp(bp.a + 2.4, -f.hl + 1, f.hl - 1), B = {id:pt.id, kind, bp, f, u, n, at, pa, pump:at(pa, -1.5), gy:() => QTOP, spray:0};
      B.outlet = at(pa, -1.15); B.sign = at(clamp(bp.a - 3.5, -f.hl + 0.5, f.hl - 0.5), -0.9);
      // a harbour unit has its own pump, hose reel, tank and sign: only the meter and the hose are drawn
      const U = UNITS[pt.id], M = U && unitModel(U.v);
      if (M){ const W = q => unitW(U, q[0], q[2]); B.unit = true; B.pump = W(M.A.pump); B.outlet = W(M.A.reel); B.meterAt = W(M.A.meter); B.meterY = M.A.meter[1]; BUNKERS.push(B); continue; }
      // the pump: cabinet with a red top, the hose reel on its side
      obox(nb, B.pump, u, n, 0.8, 0.55, QTOP, 1.55, TANK); obox(nb, B.pump, u, n, 0.86, 0.6, QTOP + 1.55, 0.14, RED);
      const rc = at(pa + 0.62, -1.5); nb.tube([[rc[0] - u[0] * 0.12, QTOP + 0.9, rc[1] - u[1] * 0.12], [rc[0] + u[0] * 0.12, QTOP + 0.9, rc[1] + u[1] * 0.12]], 0.36, DK, 14);
      nb.disc([rc[0] + u[0] * 0.13, QTOP + 0.9, rc[1] + u[1] * 0.13], [u[0], 0, u[1]], 0.38, STEEL, 14); nb.disc([rc[0] - u[0] * 0.13, QTOP + 0.9, rc[1] - u[1] * 0.13], [-u[0], 0, -u[1]], 0.38, STEEL, 14);
      // the tank lies along the quay on two saddles inside a low concrete bund
      const tc = at(pa, -Math.min(depth - 2.2, 6.2)), T = (a, y) => [tc[0] + u[0] * a, y, tc[1] + u[1] * a], ty = QTOP + 1.45;
      nb.tube([T(-2.3, ty), T(2.3, ty)], 1.05, TANK, 18); nb.disc(T(2.3, ty), [u[0], 0, u[1]], 1.05, TANK, 18); nb.disc(T(-2.3, ty), [-u[0], 0, -u[1]], 1.05, TANK, 18);
      nb.tube([T(-0.6, ty), T(0.6, ty)], 1.07, RED, 18);
      for (const a of [-1.5, 1.5]) obox(nb, [tc[0] + u[0] * a, tc[1] + u[1] * a], u, n, 0.3, 1.6, QTOP, 0.55, DK);
      for (const [a, o, l, w] of [[0, 1.6, 6.2, 0.2], [0, -1.6, 6.2, 0.2], [3.1, 0, 0.2, 3.4], [-3.1, 0, 0.2, 3.4]]) obox(nb, [tc[0] + u[0] * a + n[0] * o, tc[1] + u[1] * a + n[1] * o], u, n, l, w, QTOP, 0.45, CONC);
      const vent = T(1.8, ty + 1.0); nb.tube([[vent[0], ty + 0.9, vent[2]], [vent[0], ty + 1.7, vent[2]]], 0.05, STEEL, 6);
      // sign post
      nb.tube([[B.sign[0], QTOP, B.sign[1]], [B.sign[0], QTOP + 3.1, B.sign[1]]], 0.07, POLE, 6);
      BUNKERS.push(B);
    }
    BUNKN = nb.mesh(mapMid());
  }
  function nearestBunker(eye){ let best = null, bd = 600; for (const B of BUNKERS){ const d = Math.hypot(B.pump[0] - eye[0], B.pump[1] - eye[2]); if (d < bd){ bd = d; best = B; } } return best; }
  function drawBunker(B, eye, VP, T, BMrel){
    nSetup(VP);
    const b = S.boat, f = b.fueling, here = f && b.status === 'port' && b.port === B.id && berthKind(b) === B.kind && BMrel, gt = S.t + currentFrac();
    const rel = (x, y, z) => [x - eye[0], y - eye[1], z - eye[2]], seaH = Math.atan2(B.n[0], -B.n[1]);
    let shown = 0;
    if (here){
      // the filler on the starboard side (the quay side), and whoever holds the nozzle standing at the edge above it
      const vt = vtype(), G = GEO(vt), fl = G.hand ? SKA.filler : G.filler;
      const Fr = xf(BMrel, fl), Fw = [Fr[0] + eye[0], Fr[1] + eye[1], Fr[2] + eye[2]], al = (Fw[0] - B.f.x) * B.u[0] + (Fw[2] - B.f.z) * B.u[1], edge = B.at(al, -0.7);
      const active = gt >= f.t0 + 0.4 && gt < f.until - 0.4, st = active ? {x:edge[0], z:edge[1], h:seaH, task:'nozzle', walk:false, s:0} : {x:B.pump[0] + B.n[0] * 0.8, z:B.pump[1] + B.n[1] * 0.8, h:seaH + Math.PI, task:'look', walk:false, s:0};
      const w = follow(B, 'p', st, T, 1.4); drawWorker(B, w, eye, T, 5);
      if (active && Math.hypot(w.x - edge[0], w.z - edge[1]) < 0.4){
        const F = [Math.sin(seaH), -Math.cos(seaH)], hand = rel(edge[0] + F[0] * 0.42, QTOP + 0.85, edge[1] + F[1] * 0.42), o = rel(B.outlet[0], QTOP + 1.0, B.outlet[1]);
        const sag = (A, C, s, n0) => { let p0 = A; for (let k = 1; k <= n0; k++){ const q = k / n0, P = [A[0] + (C[0] - A[0]) * q, A[1] + (C[1] - A[1]) * q - s * 4 * q * (1 - q), A[2] + (C[2] - A[2]) * q]; drawN(PM.fhose, limbM(p0, P, 0.028)); p0 = P; } };
        sag(o, hand, 0.35, 8); sag(hand, Fr, 0.12, 5);
        if (gt >= f.pumpAt) shown = Math.min(f.liters, (gt - f.pumpAt) * f.lpm);
      }
    }
    // the meter on the pump, and the sign
    const v = Math.round(shown);
    if (!B.meter){ B.cv = document.createElement('canvas'); B.cv.width = 256; B.cv.height = 128; B.meter = {tex:mkTex(), v:-1};
      const du = [-B.n[1], B.n[0]], c = B.unit ? [B.meterAt[0] + B.n[0] * 0.005, B.meterAt[1] + B.n[1] * 0.005] : B.at(B.pa, -1.5 + 0.28), w2 = 0.26, a = [c[0] - du[0] * w2, c[1] - du[1] * w2], d = [c[0] + du[0] * w2, c[1] + du[1] * w2];   // read from the water side
      const my = B.unit ? B.meterY - 0.13 : QTOP + 1.05; B.meter.q = texQuad([d[0], my, d[1]], [a[0], my, a[1]], [a[0], my + 0.26, a[1]], [d[0], my + 0.26, d[1]]);
      const sv = document.createElement('canvas'); sv.width = 512; sv.height = 256; const g = sv.getContext('2d'); g.fillStyle = '#c21f19'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 118px Archivo, Arial, sans-serif'; g.fillText('BUNKERS', 256, 104); g.font = '600 52px Archivo, Arial, sans-serif'; g.fillText('DIESEL · BENSIN', 256, 200); B.signT = mkTex(); upTex(B.signT, sv);
      const s0 = [B.sign[0] + B.n[0] * 0.09, B.sign[1] + B.n[1] * 0.09], sw = 0.9, sa = [s0[0] - du[0] * sw, s0[1] - du[1] * sw], sb = [s0[0] + du[0] * sw, s0[1] + du[1] * sw];
      B.signQ = texQuad([sb[0], QTOP + 2.2, sb[1]], [sa[0], QTOP + 2.2, sa[1]], [sa[0], QTOP + 3.1, sa[1]], [sb[0], QTOP + 3.1, sb[1]]); }
    if (B.meter.v !== v){ B.meter.v = v; const g = B.cv.getContext('2d'); g.fillStyle = '#10161a'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#7dff9a'; g.font = '700 72px monospace'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(String(v), 200, 66); g.font = '600 34px monospace'; g.fillText('L', 244, 76); upTex(B.meter.tex, B.cv); }
    const TMx = M4.T(-eye[0], -eye[1], -eye[2]);
    drawTexQuad(B.meter.q, B.meter.tex, TMx, VP, false, [B.n[0], 0, B.n[1]]); if (!B.unit) drawTexQuad(B.signQ, B.signT, TMx, VP, true, [B.n[0], 0, B.n[1]]);
    return {liters:v, here:!!here};
  }

