  // ---------- the skiff's live instruments ----------
  const M4 = {
    T:(x, y, z) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]),
    RX:a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); },
    RY:a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); },
    RZ:a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); },
    S:k => new Float32Array([k,0,0,0, 0,k,0,0, 0,0,k,0, 0,0,0,1])
  };
  const chain = (...ms) => ms.reduce((a, b) => mul(a, b));
  let plotSmall = null, aisCache = {t:-1, v:[]};
  function engineOn(){ const st = S.boat.status; return st === 'sailing' || st === 'fishing' || st === 'idle' || st === 'returning' || st === 'unmooring' || MO.phase === 'in'; }
  function paintPlotter(){
    const g = SK.cvP.getContext('2d'), W = 512, Hc = 320, b = S.boat, p = {x:bv.x / 1000, y:bv.z / 1000}, Hn = S.t / 60, L = (no, en) => S.lang === 'no' ? no : en;
    g.fillStyle = '#0a1117'; g.fillRect(0, 0, W, Hc);
    // the chart shows ±1.1 km, more when the echo sounder's heat reaches further (CHIRP)
    const ht = typeof heatTier === 'function' ? heatTier() : null, top = 26, cw = 318, ch = Hc - top - 18, rng = Math.max(1.1, ht ? HEAT.tiers[ht].r * 1.05 : 0), sw = 106, sh = Math.round(sw * ch / cw), kpp = 2 * rng / sw, sd = safeDepth();
    plotSmall = plotSmall || document.createElement('canvas'); plotSmall.width = sw; plotSmall.height = sh;
    const sg = plotSmall.getContext('2d'), img = sg.createImageData(sw, sh), d = img.data, dok = mapViewReady(p.x - sw * kpp / 2, p.y - sh * kpp / 2, p.x + sw * kpp / 2, p.y + sh * kpp / 2);
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++){
      const q = {x:p.x + (i + 0.5 - sw / 2) * kpp, y:p.y + (j + 0.5 - sh / 2) * kpp}, o = (j * sw + i) * 4; let c;
      if (!inMapFrame(q)) c = [60, 66, 70]; else if (isLand(q)) c = [224, 206, 150]; else { const dd = dok ? depthF(q) : 50; c = dd < Math.min(2, sd / 2) ? [128, 176, 222] : dd < sd ? [165, 202, 234] : dd < 30 ? [236, 243, 248] : [250, 252, 253]; }
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    sg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(plotSmall, 0, top, cw, ch);
    const X = x => (x - p.x) / kpp * (cw / sw), Y = y => top + ch / 2 + (y - p.y) / kpp * (cw / sw);
    g.save(); g.beginPath(); g.rect(0, top, cw, ch); g.clip();
    // the echo sounder's heat map, the same as on the chart plotter (ui/03c-heat.js)
    if (typeof heatDrawInto === 'function') heatDrawInto(g, p, cw / 2, top + ch / 2, cw / (2 * rng), true);   // without the blur filter (costly on a tablet)
    // the sets in the sea, as on the chart: ours in their colours, the other players' and the coast boats' (NPCGEAR) in grey
    const setLn = (s, a, c, col, w, k) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(k === 'line' ? [7, 4] : k === 'teine' ? [2, 4] : []); g.beginPath(); g.moveTo(X(a.x) + cw / 2, Y(a.y)); g.lineTo(X(c.x) + cw / 2, Y(c.y)); g.stroke(); g.setLineDash([]);
      for (const e of [a, c]){ g.fillStyle = s; g.beginPath(); g.arc(X(e.x) + cw / 2, Y(e.y), 4, 0, Math.PI * 2); g.fill(); } };
    for (const q of PEERGEAR) setLn('#a9b4bb', q.a, q.b, '#8d9aa3', 2, q.k);
    for (const q of NPCGEAR) setLn('#e0884a', q.a, q.b, '#7f8f99', 2, q.k);
    for (const q of S.sets || []) if (!q.lost) setLn(SETCOL[q.kind] || '#e0884a', q.a, q.b, SETCOL[q.kind] || '#e0884a', 3, q.kind);
    // route and trail
    if (S.plan){ g.strokeStyle = '#d6336c'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(p.x) + cw / 2, Y(p.y)); for (const w of S.plan.wps.slice(S.plan.idx)) g.lineTo(X(w.x) + cw / 2, Y(w.y)); g.stroke(); }
    // other vessels
    if (Hn - aisCache.t > 0.02 || aisCache.t < 0){ aisCache = {t:Hn, v:npcStates(Hn).filter(aisShown)}; }
    // the other players in gold, larger and ringed, as on the chart (ui/03-map.js)
    for (const n of aisCache.v){ const x = X(n.p.x) + cw / 2, y = Y(n.p.y), k = n.player ? 1.45 : 1; if (x < -10 || x > cw + 10 || y < top - 10 || y > top + ch + 10) continue;
      if (n.player){ g.strokeStyle = 'rgba(242,179,61,.75)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 17, 0, Math.PI * 2); g.stroke(); }
      g.save(); g.translate(x, y); g.rotate(n.cog !== undefined ? n.cog : n.hd); g.fillStyle = n.player ? '#f2b33d' : n.fleet || n.coast ? '#ff8a65' : '#4c8df0'; g.strokeStyle = '#1b2a33'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -9 * k); g.lineTo(5 * k, 6 * k); g.lineTo(0, 3 * k); g.lineTo(-5 * k, 6 * k); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    // own boat with heading line
    g.save(); g.translate(cw / 2, top + ch / 2); g.rotate(bv.head); g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -60); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 10); g.lineTo(0, 5); g.lineTo(-8, 10); g.closePath(); g.fill(); g.restore();
    g.restore();
    // scale bar
    g.fillStyle = '#123'; g.font = '600 13px system-ui, sans-serif'; g.fillText('0,5 nm', 10, top + ch - 10); g.fillRect(10, top + ch - 26, (0.926 / kpp) * (cw / sw) / 1, 3);
    // echo sounder on the right
    const ec = document.getElementById('echo'), ex = cw + 4, ew = W - ex;
    g.fillStyle = '#021628'; g.fillRect(ex, top, ew, ch);
    if (INSTR.echoOn()){
      if (ec && ec.width) g.drawImage(ec, ex, top, ew, ch);
      const dep = Math.max(0.8, depthF(p) + tideCD(Hn));
      g.fillStyle = '#fff'; g.font = '700 30px system-ui, sans-serif'; g.fillText(fmt(dep, dep < 100 ? 1 : 0), ex + 8, top + 34); g.font = '600 13px system-ui, sans-serif'; g.fillText('m', ex + 12 + g.measureText(fmt(dep, dep < 100 ? 1 : 0)).width * 2.3, top + 34);
    } else { g.fillStyle = '#5f7d8c'; g.font = '700 16px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(L('EKKOLODD AV', 'SOUNDER OFF'), ex + ew / 2, top + ch / 2); g.textAlign = 'left'; }
    // data bars
    g.fillStyle = '#152029'; g.fillRect(0, 0, W, top); g.fillRect(0, Hc - 18, W, 18);
    g.fillStyle = '#9fe3c6'; g.font = '600 15px ui-monospace, monospace'; const sog = b.status === 'port' ? 0 : typeof dynSog === 'function' ? dynSog(b).kn : b.v;   // (over the ground, with the stream: F8b)
    g.fillText('SOG ' + fmt(sog, 1) + ' kn', 10, 18);
    g.textAlign = 'right'; g.fillText(hm(Hn), W - 10, 18); g.textAlign = 'left';
    g.fillStyle = '#7fa5b6'; g.font = '12px ui-monospace, monospace'; const ll = LL(p); g.fillText(ll.lat.toFixed(4) + '°N  ' + Math.abs(ll.lon).toFixed(4) + (ll.lon < 0 ? '°W' : '°E'), 10, Hc - 5);
    upTex(SK.tPlot, SK.cvP);
  }
  function dial(g, cx, cy, r, v0, v1, v, a0, a1, ticks, labels, title, redFrom){
    g.fillStyle = '#f4f4f2'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9aa0a6'; g.lineWidth = r * 0.07; g.beginPath(); g.arc(cx, cy, r * 0.97, 0, Math.PI * 2); g.stroke();
    const ang = t => a0 + (a1 - a0) * t;
    if (redFrom !== undefined){ g.strokeStyle = '#d33'; g.lineWidth = r * 0.08; g.beginPath(); g.arc(cx, cy, r * 0.8, ang((redFrom - v0) / (v1 - v0)), a1); g.stroke(); }
    g.strokeStyle = '#111'; for (let i = 0; i <= ticks; i++){ const a = ang(i / ticks), big = labels && i % (ticks / (labels.length - 1)) === 0; g.lineWidth = big ? r * 0.05 : r * 0.025; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * (big ? 0.68 : 0.76), cy + Math.sin(a) * r * (big ? 0.68 : 0.76)); g.lineTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); g.stroke(); }
    if (labels){ g.fillStyle = '#111'; g.font = '700 ' + Math.round(r * 0.2) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; labels.forEach((l, i) => { const a = ang(i / (labels.length - 1)); g.fillText(l, cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52); }); }
    g.fillStyle = '#333'; g.font = '600 ' + Math.round(r * 0.13) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, cx, cy + r * 0.34);
    const a = ang(clamp((v - v0) / (v1 - v0), 0, 1)); g.strokeStyle = '#e8401c'; g.lineWidth = r * 0.06; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - Math.cos(a) * r * 0.12, cy - Math.sin(a) * r * 0.12); g.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); g.stroke();
    g.fillStyle = '#222'; g.beginPath(); g.arc(cx, cy, r * 0.11, 0, Math.PI * 2); g.fill(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }
  function paintGauges(dt){
    const g = SK.cvG.getContext('2d'), W = 512, Hc = 256, b = S.boat, on = engineOn(), N = SK.needle, k = Math.min(1, dt * 3);
    const frac = on ? clamp(b.v / BOAT.vmax, 0, 1) : 0, rpmT = on ? 750 + Math.pow(frac, 0.85) * 5150 + (b.status === 'fishing' ? 150 : 0) : 0;
    N.rpm += (rpmT - N.rpm) * k; N.fuel += (b.fuel / BOAT.fuelCap - N.fuel) * k; N.temp += ((on ? 72 : 8) - N.temp) * Math.min(1, dt * 0.2); N.volt += ((on ? 14.2 : 12.6) - N.volt) * k;
    const bg = g.createLinearGradient(0, 0, 0, Hc); bg.addColorStop(0, '#2b2e32'); bg.addColorStop(1, '#16181b'); g.fillStyle = bg; g.fillRect(0, 0, W, Hc);
    dial(g, 256, 128, 112, 0, 6000, N.rpm, Math.PI * 0.75, Math.PI * 2.25, 30, ['0', '1', '2', '3', '4', '5', '6'], 'RPM x1000', 5500);
    // hour meter in the tachometer
    g.fillStyle = '#9fb49a'; g.fillRect(222, 168, 68, 18); g.fillStyle = '#1b2418'; g.font = '700 14px ui-monospace, monospace'; g.textAlign = 'center'; g.fillText(fmt(b.engH || 0, 1) + 'h', 256, 182); g.textAlign = 'left';
    dial(g, 72, 76, 58, 0, 1, N.fuel, Math.PI * 1.15, Math.PI * 1.85, 8, ['E', '½', 'F'], 'FUEL', undefined);
    dial(g, 72, 196, 50, 40, 120, N.temp, Math.PI * 1.15, Math.PI * 1.85, 8, ['40', '80', '120'], '°C', 105);
    dial(g, 440, 76, 58, -1, 1, on ? -0.2 + frac * 0.5 : -0.9, Math.PI * 1.15, Math.PI * 1.85, 8, ['↓', '', '↑'], 'TRIM', undefined);
    g.fillStyle = '#0d1512'; g.fillRect(398, 150, 86, 40); g.fillStyle = '#ff4a3a'; g.font = '700 26px ui-monospace, monospace'; g.fillText(fmt(N.volt, 1), 405, 180); g.fillStyle = '#aab'; g.font = '11px system-ui, sans-serif'; g.fillText('V', 470, 180);
    const warn = [['OIL', on && b.status !== 'port' ? 0 : 1], ['TEMP', N.temp > 105 ? 1 : 0], ['BATT', on ? 0 : 1]];
    warn.forEach((w, i) => { g.fillStyle = w[1] ? '#e33' : '#3a1414'; g.beginPath(); g.arc(404 + i * 32, 214, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#aab'; g.font = '9px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(w[0], 404 + i * 32, 236); g.textAlign = 'left'; });
    upTex(SK.tGauge, SK.cvG);
  }
  function paintVhf(){
    const g = SK.cvV.getContext('2d'), W = 256, Hc = 140, Hn = S.t / 60;
    const bg = g.createLinearGradient(0, 0, 0, Hc); bg.addColorStop(0, '#ffb24a'); bg.addColorStop(1, '#f08a24'); g.fillStyle = bg; g.fillRect(0, 0, W, Hc);
    g.fillStyle = '#3a1c05'; g.font = '700 16px ui-monospace, monospace'; g.fillText('25W  DSC', 10, 22); g.fillText('G', 10, 118); g.font = '700 17px ui-monospace, monospace'; g.fillText(hm(Hn), 30, 118);
    g.font = '800 78px ui-monospace, monospace'; g.textAlign = 'right'; g.fillText('16', W - 12, 92); g.textAlign = 'left';
    g.font = '600 12px ui-monospace, monospace'; g.fillText(windAt(Hn) >= 13.9 ? (S.lang === 'no' ? 'KULINGVARSEL' : 'GALE WARNING') : 'INT  SQL:2', 10, 44);
    g.fillText('CH ▲  CH ▼', 150, 130);
    upTex(SK.tVhf, SK.cvV);
  }
  // the boat's name where boats carry it (vessel3d.js namePlaces): across the wheelhouse roof's front edge and on the transom with the home
  // port under it, or along the bows on an open boat; in block capitals, white or black by the paint under each line (nameInkLight)
  const PLACEQ = {};
  function placeQ(t){ if (!(t in PLACEQ)){ const pl = namePlaces(t); PLACEQ[t] = pl.map(p => ({q:texStrip(p.B, p.T), p})); } return PLACEQ[t]; }
  function drawNames(t, M, VP, liv, nm, port){
    const Q = nm ? placeQ(t) : null; if (!Q || !Q.length) return; gl.disableVertexAttribArray(2);
    for (const {q, p} of Q){ const txt = p.line === 'port' ? port : nm; if (!txt) continue;
      drawTexQuad(q, nameTex(txt, nameInkLight(placeRGB(t, p, liv)), p.aspect), M, VP, true, [0, 0.2, 0]); }
  }
  // the home port the stern carries: the player's own, a boat of the local fleet's (core/05-vessels.js FLEET), else none
  const ownPort = () => { const hp = portById(S.home || HOME0); return hp ? hp.name : ''; };
  const npcPort = n => { const f = n.fleet && FLEET[n.fi], h = f && f.home; if (!h) return ''; const q = portById(h); return q ? q.name : h; };
  // the registration mark: block letters, white on dark paint and black on light (§ 23: white on black or black on white), by the paint
  // under the letters (vessel3d.js markRGB: the hull's, or a stripe's where the mark could find no place off it)
  function markCanvas(cv, txt, light){
    const g = cv.getContext('2d'); g.clearRect(0, 0, 512, 128); g.fillStyle = light ? '#f6f6f2' : '#101215'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = 96; g.font = '800 ' + fs + 'px "Arial Narrow", Arial, sans-serif'; while (g.measureText(txt).width > 470 && fs > 30){ fs -= 4; g.font = '800 ' + fs + 'px "Arial Narrow", Arial, sans-serif'; }
    g.fillText(txt, 256, 68);
  }
  const MARKT = {tex:null, cv:null, key:''};
  function markTex(t, liv){
    const txt = regText(regOf(S.boat)), c = markRGB(t || vtype(), liv !== undefined ? liv : hullLiv(S.boat)), light = isLight(c), key = txt + (light ? '|l' : '|d');
    if (!txt) return null; if (MARKT.key !== key){ MARKT.key = key; if (!MARKT.tex){ MARKT.tex = mkTex(); MARKT.cv = document.createElement('canvas'); MARKT.cv.width = 512; MARKT.cv.height = 128; } markCanvas(MARKT.cv, txt, light); upTex(MARKT.tex, MARKT.cv); }
    return MARKT.tex;
  }
  // the company logo: on the own boat the one being tried in the paint shop, else the company's once it is theirs; another player's from
  // her paint code (made ones drawn here, pictures fetched by her id, ui/10h-world.js peerLogo). Textures in a small pool by what they show.
  const LOGOIMG = {}, LTX = new Map(); let LCV = null;
  function imgOf(src){ if (!src) return null; let im = LOGOIMG[src]; if (!im){ im = LOGOIMG[src] = new Image(); im.src = src; } return im; }
  function curLogo(){ return PAINTPRE && PAINTPRE.logo !== undefined ? PAINTPRE.logo : COSOWN('logo') ? S.logo : null; }
  function logoTexOf(L, img){
    if (!L) return null; const ready = L.kind !== 'u' || (img && img.complete && img.naturalWidth); if (!ready) return null;
    const k = L.kind === 'u' ? (L.url ? 'x:' + L.url : 'u:' + img.src.length + ':' + img.src.slice(-24)) : logoStr(L); let e = LTX.get(k);   // (a partner's picture by its whole address)
    if (!e){ if (LTX.size >= 8){ let old = null; for (const [kk, v] of LTX) if (!old || v.used < old[1].used) old = [kk, v]; gl.deleteTexture(old[1].tex); LTX.delete(old[0]); }
      if (!LCV){ LCV = document.createElement('canvas'); LCV.width = LCV.height = 256; } logoCanvas(LCV, L, img); e = {tex:mkTex(), cv:null}; upTex(e.tex, LCV); LTX.set(k, e); }
    e.used = performance.now(); return e.tex;
  }
  const LOGOQ = {};
  function logoQ(t){ if (!(t in LOGOQ)){ const st = logoStrips(t); LOGOQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return LOGOQ[t]; }
  function drawLogo(t, M, VP, L, img){ const q = L && logoQ(t), tex = q && logoTexOf(L, img); if (!tex) return; gl.disableVertexAttribArray(2); for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]); }
  const ownLogo = () => { const L = curLogo(); return [L, L && L.kind === 'u' ? imgOf(L.img) : null]; };
  // a partner's design (core/09l-sponsor.js, steg 44) has its own mark on the hull: the sponsor's picture (fetched with CORS, so it
  // can go into a texture; one that does not load is not drawn) or the made one. On the own boat it takes the company logo's place
  // on the hull while the design is worn (the house flag is still the company's)
  function imgCors(src){ let im = LOGOIMG['c:' + src]; if (!im){ im = LOGOIMG['c:' + src] = new Image(); im.crossOrigin = 'anonymous'; im.src = src; } return im; }
  const spLogo = W => { const L = W && typeof spPaintLogo === 'function' ? spPaintLogo(W) : null; return L ? [L, L.kind === 'u' ? imgCors(L.url) : null] : null; };
  const hullLogo = () => { const W0 = typeof spWorn === 'function' ? spWorn(PAINTPRE || S.boat.liv) : null, W = W0 && modelLiv(spPaintLiv(W0, S.boat.type)) ? W0 : null; return (W && spLogo(W)) || ownLogo(); };   // (a design without a mark leaves the company's logo)
  const MARKQ = {};
  function markQ(t){ if (!(t in MARKQ)){ const st = markStrips(t); MARKQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return MARKQ[t]; }
  function drawMark(t, M, VP, liv){ const q = markQ(t), tex = q && markTex(t, liv); if (!tex) return; gl.disableVertexAttribArray(2); for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]); }
  // the call sign on both sides aft of the mark (vessel3d.js callStrips; core/06b-coastports.js callOf, Ø11.5), in the mark's letters,
  // white or black by the paint under it as § 9 of the marking rules has it for the registration mark
  const CALLQ = {};
  function callQ(t){ if (!(t in CALLQ)){ const st = callStrips(t); CALLQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return CALLQ[t]; }
  function drawCall(t, M, VP, liv){ const cs = callOf(S.boat), q = cs && callQ(t); if (!q) return; const tex = nameTex(cs, isLight(callRGB(t, liv !== undefined ? liv : hullLiv(S.boat))), 4, true);
    gl.disableVertexAttribArray(2); for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]); }
  // the name in block capitals (the game's own Archivo, bold and a little narrow, in the page so it is the same on every device), as tall
  // as the strip allows (caps at 0.74 of it, room for the ring over Å) and narrower where the name is long, centred
  function nameCanvas(cv, nm, light){
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, txt = String(nm).toUpperCase(); g.clearRect(0, 0, W, H);
    g.fillStyle = light ? '#f7f7f4' : '#111214'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; if ('fontStretch' in g) g.fontStretch = 'semi-condensed';
    if ('letterSpacing' in g) g.letterSpacing = Math.round(H * 0.03) + 'px';
    let fs = Math.round(H * 0.74 / 0.72); const f = () => { g.font = '700 ' + fs + 'px Archivo, "Arial Narrow", Arial, sans-serif'; }; f();
    const sc = Math.min(1, W * 0.97 / Math.max(1, g.measureText(txt).width));
    g.save(); g.translate(W / 2, H * 0.5 + H * 0.37); g.scale(sc, 1); g.fillText(txt, 0, 0); g.restore();
  }
  // the font is in the page as data, but may not be decoded the first time a name is painted: then the names are painted again once it is
  let FONTOK = typeof document === 'undefined' || !document.fonts || document.fonts.check('700 20px Archivo');
  if (!FONTOK) document.fonts.load('700 20px Archivo').then(() => { FONTOK = true; for (const [, e] of NTX) gl.deleteTexture(e.tex); NTX.clear(); }).catch(() => { FONTOK = true; });
  const isLight = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2] < 0.5;
  // the names: a small pool of textures by text, shade and the strip's shape (the own boat's two or three and those of the boats near you,
  // which change seldom), the oldest let go
  const NTX = new Map(), NCV = {};
  function nameTex(nm, light, aspect, mark){
    const H = mark ? 128 : Math.max(32, Math.min(256, Math.round(1024 / (aspect || 4) / 16) * 16)), k = (mark ? 'M:' : H + ':') + nm + (light ? '|l' : '|d'); let e = NTX.get(k);
    if (!e){ if (NTX.size >= 28){ let old = null; for (const [kk, v] of NTX) if (!old || v.used < old[1].used) old = [kk, v]; gl.deleteTexture(old[1].tex); NTX.delete(old[0]); }
      const W = mark ? 512 : 1024, cv = NCV[W + 'x' + H] || (NCV[W + 'x' + H] = document.createElement('canvas')); cv.width = W; cv.height = H;
      (mark ? markCanvas : nameCanvas)(cv, nm, light); e = {tex:mkTex()}; upTex(e.tex, cv); NTX.set(k, e); }
    e.used = performance.now(); return e.tex;
  }
  // the six nearest boats within 250 m that are drawn near (their glass is in) carry their names on the hull, light or dark by her paint
  function drawNPCNames(kit, VP){
    const near = []; for (const n of kit){ if (!n.name || !n.K || !n.K.glass) continue; n.dd = Math.hypot(n.M[12], n.M[14]); if (n.dd < 250) near.push(n); }
    if (!near.length) return; near.sort((a, b) => a.dd - b.dd); gl.disableVertexAttribArray(2);
    for (const n of near.slice(0, 6)){
      const t = npcType(n), lv = n.player ? livParse(n.liv, t) : LIVERY[(n.liv || 0) % LIVERY.length], M = chain(n.M, n.K.S);
      drawNames(t, M, VP, lv, String(n.name).slice(0, 24), npcPort(n));
      const mk = n.player && livMark(n.liv), mq = mk && markQ(t); if (mq){ const mt = nameTex(mk, isLight(markRGB(t, lv)), 4, true); for (const s of mq) drawTexQuad(s, mt, M, VP, true, [0, 0.2, 0]); }
      const sl = n.player && typeof spPaintIn === 'function' ? spPaintIn(n.liv) : null, sq = sl && spLogo(sl); if (sq) drawLogo(t, M, VP, sq[0], sq[1]);
      const lg = n.player && !sq && logoParse(n.liv); if (lg) drawLogo(t, M, VP, lg, lg.kind === 'u' && typeof peerLogo === 'function' ? peerLogo(String(n.id).slice(1), lg.ver) : null);
    }
  }
  // the hand-steered boat's paint (vessel3d.js hullLiv): the hull's colours uploaded again when it changes
  function paintHand(){
    const lv = hullLiv(S.boat), k = livKey(lv); if ((SK.livK || '') === k || !SK.hullT) return; SK.livK = k;
    const part = glbPart(SK.hullT, 'lod0'); if (!part) return;
    const o = lv && DESIGNS.some(q => lv[q]) ? glbDesign(SK.hullT, part, lv) : glbPaint(part, lv);
    if (o.p.length === SK.hull.n * 3){ gl.bindBuffer(gl.ARRAY_BUFFER, SK.hull.cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.c), gl.STATIC_DRAW); return; }
    // a design that cuts the hull: new buffers for the shape (the old ones go)
    for (const b of [SK.hull.pb, SK.hull.nb, SK.hull.cb]) gl.deleteBuffer(b);
    SK.hull = {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3};
  }
  function limbM(A, B, r){ const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, z = d.map(v => v / L), up = Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(v => v / xl); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0] * r, x[1] * r, x[2] * r, 0, y[0] * r, y[1] * r, y[2] * r, 0, z[0] * L, z[1] * L, z[2] * L, 0, A[0], A[1], A[2], 1]); }
  // an arm from the shoulder Sw to the hand Hw (boat frame) with the elbow bent down and out, in the arm meshes W (the worker's sleeves in
  // the look of the one it belongs to: SK.wk the skipper's, SK.wkC the first hand's); sd 1 the right arm, -1 the left; sp the hand's grip.
  // Returns where the hand holds
  function armTo(BMrel, W, Sw, Hw, sd, sp){ const d = [Hw[0] - Sw[0], Hw[1] - Sw[1], Hw[2] - Sw[2]], Lh = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = d.map(v => v / Lh), seg = 0.31, Lc = Math.min(Lh, 2 * seg * 0.995);
    let bv = [0, -1, sd * 0.5]; const kk = bv[0] * u[0] + bv[1] * u[1] + bv[2] * u[2]; bv = [bv[0] - kk * u[0], bv[1] - kk * u[1], bv[2] - kk * u[2]]; const bl = Math.hypot(bv[0], bv[1], bv[2]) || 1, h = Math.sqrt(Math.max(0, seg * seg - (Lc / 2) ** 2));
    const Hc = [Sw[0] + u[0] * Lc, Sw[1] + u[1] * Lc, Sw[2] + u[2] * Lc], E = [(Sw[0] + Hc[0]) / 2 + bv[0] / bl * h, (Sw[1] + Hc[1]) / 2 + bv[1] / bl * h, (Sw[2] + Hc[2]) / 2 + bv[2] / bl * h];
    if (W){ const f = [Hc[0] - E[0], Hc[1] - E[1], Hc[2] - E[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1, HT = [Hc[0] + f[0] / fl * WK_S, Hc[1] + f[1] / fl * WK_S, Hc[2] + f[2] / fl * WK_S];
      drawN(W.uarm, chain(BMrel, limbM(Sw, E, WK_S))); drawN(W.farm, chain(BMrel, limbM(E, Hc, WK_S)));
      // the hands in their grips (hender.py): relaxed, the palm in and down; round the knife's handle when it bleeds a fish
      const HM = handMeshes(); if (!HM){ drawN(W.hand, chain(BMrel, limbM(Hc, HT, WK_S))); return Hc; }
      const s2 = sp || {g:'relax', n:[-sd * 0.9, -0.4, 0]}, Fr = handFrame(nrm3(f), s2, sd), gd = (HM.grip[s2.g] || HM.grip.relax)[sd > 0 ? 'R' : 'L'];
      drawN(HM[sd > 0 ? 'R' : 'L'][s2.g] || HM[sd > 0 ? 'R' : 'L'].relax, chain(BMrel, handMtx(Fr, Hc), M4.S(WK_S))); return add3(Hc, mul3(inFrame(Fr, gd.at), WK_S)); }
    drawN(SK.limb, chain(BMrel, limbM(Sw, E, 0.056))); drawN(SK.limb, chain(BMrel, limbM(E, Hc, 0.048))); drawN(SK.hand, chain(BMrel, M4.T(Hc[0], Hc[1], Hc[2]))); return Hc; }
  function drawSkiff(BMrel, VP, dt, showSkipper, showCrew){
    if (!SK) return; const b = S.boat;
    // wheel follows the turn rate, the outboard follows the wheel, the lever follows the speed
    if (SK.headPrev === null) SK.headPrev = bv.head; const rate = angDiff(SK.headPrev, bv.head) / Math.max(dt, 1e-3); SK.headPrev = bv.head;
    SK.wheelA += (clamp(rate * 9, -2.4, 2.4) - SK.wheelA) * Math.min(1, dt * 2.5);
    const on = engineOn(), frac = on ? clamp(b.v / BOAT.vmax, 0, 1) : 0; SK.propA += (on ? 6 + frac * 120 : 0) * dt;
    nSetup(VP);
    // with all hands on deck, nobody fishes; nor when the one aboard alone is at the table or the tub (drawDeck draws him there; tilbakemelding
    // #98: he jigged at the rail and gutted at the table at once)
    // (and with crew aboard too, Tony 06.11.2026: skipper and one hand on the trebåt gave three figures, the skipper at the rail and at
    // the table at once; DECKACT.me says drawDeck draws him on the deck work, as awaySk hides the tiller figure)
    const fishing = S.boat.status === 'fishing' && !S.boat.deckStop && !(DECKACT.on && (DECKACT.alone || DECKACT.me));
    refreshPeople(SK); paintHand(); const wr = wearOn(vtype()), lf = lifeOn('me', BMrel, null, vtype(), HL.meAge, wr, bv.spd, GEO(vtype())); drawN(SK.hull, BMrel); if (lf) lifeOff(); else if (wr) wearOff();
    SK.rodT += dt; SK.lines = [];
    const T = SK.rodT, A = SK.anim || (SK.anim = {mode:null, st:'jig', t:0, fish:[], fly:[], th:0, mc:[], bq:[], bl:null});
    const kv = S.target === 'kveite' && S.boat.kgear && !kveiteClosed(S.t / 60), mode = !fishing ? null : S.boat.gop ? 'gear' : (!kv && S.equip && S.equip.jukse > 0 && !window.jigActive) ? 'machine' : (S.boat.gear || kv) ? 'juksa' : null;
    // (OB1, docs/planer/om-bord.md 4.1, F4, F5, F1; Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig») the work
    // aboard a boat worked by hand, where the model has the places (snekke23.py skiff: set, setter, coil, coilTub, moor):
    // - setting: the gear goes out from the tubs over the starboard quarter (SKA.set) while she runs slowly; the skipper steers at the
    //   tiller, and a hand aboard sits by the tubs and feeds it out over the rail. The hauler stands. Alone, the skipper sets it himself from the tiller
    // - hauling: the one at the rail hauls (the line in the small hauler, the nets hand over hand over the rail: no net hauler under 7.5 m,
    //   valg 21 B) and bleeds the fish; a hand aboard takes the gear from him and lays it down: the line coiled in a tub at his feet
    //   (SKA.coilTub), the net down on the floor to the net tub
    // - at the quay or the boathouse: the skipper himself takes the lines on and off at their cleats (MO, view3d/15-env-mooring.js), one at
    //   a time; at the tiller until she lies alongside
    const g0 = S.boat.gop, gearOn = mode === 'gear' && !!g0, setting = gearOn && g0.op === 'set', handNet = gearOn && g0.kind === 'garn' && !hasHauler('garn');
    const mate = showCrew && !!SK.fisherC && gearOn && !!SKA.coil && !!SKA.setter, atRail = !(setting && SKA.set);   // (a model without the places keeps the fisher at the rail)
    const moorI = SKA.moor && meAboard() && !cam.helm && (b.status === 'port' || b.status === 'unmooring') && (MO.phase === 'lines' || MO.phase === 'out') && MO.lines > 0.02 && MO.lines < 3.98 ? Math.min(3, Math.floor(MO.lines)) : -1;
    if (((showSkipper && !fishing) || (setting && SKA.set && meAboard() && !cam.helm)) && moorI < 0) drawN(SK.skipper, BMrel);
    if (showCrew && !mate) drawN(SK.crew, BMrel);
    if (mode !== A.mode){ A.mode = mode; A.st = 'jig'; A.t = 0; A.fish = []; A.fly = []; A.mc = []; A.bq = []; A.bl = null; }
    // fish reported by the fishing step; stale ones (3D was off) are dropped
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now();
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!mode) Q.length = 0;
    const airKg = Q.reduce((a, f) => a + f.kg, 0) + A.fish.reduce((a, f) => a + f.kg, 0) + A.fly.reduce((a, f) => a + f.kg, 0) + A.mc.reduce((a, m) => a + (m.fish || []).reduce((c, f) => c + f.kg, 0), 0);
    // the catch in the tub: one fish per ~5 kg, species in proportion to the hold; fish still in the air are not in it yet
    // (in the kit's 300 l tub where the model has its place, tools/deck/fisk.py; else in the model's own box)
    // (an open boat with her fish tubs, core/07f-kar.js: drawDeck draws them with the catch, and the round fish in the bleeding tub)
    const KTq = ((GEO(vtype()) || {}).kit || {}).tubs, karB = !!(VESSELS[vtype()] || {}).kar && KTq && KTq.length, KTp = !karB && KTq && KTq[0], KTm = KTp && kit('fish', 'kar' + (KTp[4] || 300)), tb = KTm ? 0.14 : 0.05;
    KST.htub = 0; if (KTm){ drawN(KTm, chain(BMrel, M4.T(KTp[0], KTp[1], KTp[2]), M4.RY(KTp[3] || 0))); KST.htub = 1; }
    if (!karB){ const all = S.hold.reduce((a, x) => a + x.kg, 0), tot = Math.max(0, all - airKg), n = Math.min(40, Math.ceil(tot / 5)); if (n > 0){ const cum = []; let acc = 0; for (const sp of ALLSP){ acc += S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0); cum.push([sp, acc / all]); }
      for (let i = 0; i < n; i++){ const r = hash(i * 7 + 3), sp = (cum.find(c => r <= c[1] + 1e-9) || cum[0])[0], rz = M4.RZ(sp === 'krabbe' ? 0 : Math.PI / 2 * (hash(i * 11) > 0.5 ? 1 : -1)), sc = M4.S((0.42 + hash(i * 13) * 0.12) * (sp === 'krabbe' ? 1.7 : 1));
        // in the kit's tub lengthwise, two across and two along, ten layers to the rim; in the model's own box across it as before
        if (KTm){ const lay = Math.floor(i / 4), k = i % 4; drawN(fishOf(sp), chain(BMrel, M4.T(KTp[0], KTp[1], KTp[2]), M4.RY(KTp[3] || 0), M4.T(-0.14 + (k % 2) * 0.28 + (hash(i * 3 + 1) - 0.5) * 0.04, tb + lay * 0.05, -0.22 + Math.floor(k / 2) * 0.44), M4.RY((k % 2 ? Math.PI : 0) + (hash(i * 5) - 0.5) * 0.3), rz, sc)); continue; }
        const lay = Math.floor(i / 8), k = i % 8, x = SKA.tub[0] - 0.18 + (k % 2) * 0.36 + (hash(i * 3 + 1) - 0.5) * 0.06, z = SKA.tub[2] - 0.16 + Math.floor(k / 2) * 0.11;
        drawN(fishOf(sp), chain(BMrel, M4.T(x, SKA.tub[1] + tb + lay * 0.05, z), M4.RY(Math.PI / 2 + (k % 2 ? Math.PI : 0) + (hash(i * 5) - 0.5) * 0.4), rz, sc)); } } }
    // luck aboard: a charm swinging from the grab rail
    if (S.haill && haillF() > 0){ const CM = chain(BMrel, M4.T(CHARM_AT[0], CHARM_AT[1], CHARM_AT[2]), M4.RZ(Math.sin(T * 1.3) * 0.18), M4.RX(Math.sin(T * 0.9) * 0.12)); drawN(SK.cstr, CM);
      if (S.haill.type === 'luksus') drawN(SK.shoe, CM); else drawN(SK.fishM.torsk, chain(CM, M4.T(0, -0.17, 0), M4.RX(Math.PI / 2), M4.S(0.16))); }
    const L2R = q => xf(BMrel, q), fsc = kg => clamp(0.42 * Math.cbrt(kg), 0.28, 1.2);
    const hang = (sp, kg, P, w) => drawN(fishOf(sp), chain(BMrel, M4.T(P[0], P[1] - fsc(kg) * 0.45, P[2]), M4.RX(Math.PI / 2), M4.RZ(Math.sin(T * 9 + w) * 0.45), M4.S(fsc(kg))));
    const WT = karB && GEO(vtype()).work ? GEO(vtype()).work.tub : null, TUB = WT ? [WT[0], WT[1] + 0.42, WT[2]] : [SKA.tub[0], SKA.tub[1] + 0.42, SKA.tub[2] - 0.05], F = SKA.fisher;   // (an open boat with tubs: into the bleeding tub, where the one who guts takes them)
    // fish swung from the rail into the tub
    for (let i = A.fly.length - 1; i >= 0; i--){ const f = A.fly[i]; f.u += dt / 0.75; if (f.u >= 1){ A.fly.splice(i, 1); continue; }
      const u = f.u; hang(f.sp, f.kg, [f.a[0] + (TUB[0] - f.a[0]) * u, f.a[1] + (TUB[1] - f.a[1]) * u + Math.sin(Math.PI * u) * 0.45, f.a[2] + (TUB[2] - f.a[2]) * u], i); }
    if (mode && atRail){
      const FP = chain(M4.T(F[0], F[1], F[2]), M4.RY(-Math.PI / 2)); drawN(SK.fisher, chain(BMrel, FP));
      const shY = SK.wk ? WK_SH : 1.3, shR = xf(FP, [0.2, shY, 0]), shL = xf(FP, [-0.2, shY, 0]); let hR, hL;
      A.t += dt;
      if (mode === 'gear'){
        const RL = handNet && SKA.rail ? SKA.rail : SKA.haul, w = T * 3.2, hauling = S.boat.gop.op === 'haul';   // (the nets over the rail itself, SKA.rail)
        if (handNet){
          // the nets hand over hand over the rail: each hand reaches out and down over the rail, takes hold and pulls in and up, the
          // other going out as it comes in (no net hauler on a boat under 7.5 m, valg 21 B; the net drawn from the rail by drawGearOp)
          const pull = k => 0.5 + 0.5 * Math.sin(T * 1.8 + k * Math.PI), L3 = (P, Q2, u) => [P[0] + (Q2[0] - P[0]) * u, P[1] + (Q2[1] - P[1]) * u, P[2] + (Q2[2] - P[2]) * u];
          hR = L3([RL[0] + 0.2, RL[1] - 0.1, RL[2] + 0.14], [RL[0] - 0.36, RL[1] + 0.26, RL[2] + 0.1], pull(0)); hL = L3([RL[0] + 0.2, RL[1] - 0.1, RL[2] - 0.14], [RL[0] - 0.36, RL[1] + 0.26, RL[2] - 0.1], pull(1));
          SK.lines.push([L2R([RL[0] + 0.6, -0.3, RL[2] - 0.5]), L2R(pull(0) < pull(1) ? hR : hL)], [L2R(hR), L2R(hL)]);
        } else if (SKA.haulFoot && hasHauler('line')){
          // (OB1, U4) the line hauler on its post turns by itself (drawGearOp): he tends it, the right hand at the line coming up to the
          // sheave to take the fish off the hook, the left on the line coming off it by the stripper
          const k = Math.sin(T * 1.3) * 0.03;
          hR = [RL[0] + 0.1, RL[1] - 0.14 + k, RL[2] + 0.14]; hL = [RL[0] - 0.16, RL[1] - 0.12 - k, RL[2] + 0.02];
        } else {
          hR = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w)), RL[2] + 0.12]; hL = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w + Math.PI)), RL[2] - 0.12];
          SK.lines.push([L2R(RL), L2R([RL[0] + 1.4, -0.3, RL[2] - 1.0])]); }
        if (hauling && Q.length && (A.t > 0.9) && !A.bl && !A.bq.length){ const f = Q.shift(); A.bq.push({...f, a:[RL[0] - 0.05, RL[1] + 0.1, RL[2]], u:0}); A.t = 0; }
      } else if (mode === 'juksa'){
        // hand jig: the left hand works the line over the roller; on a bite the right hand cranks it up with a fish on the pilk and the fly hooks
        // (the juksahjul's eye at the end of its wire arm and the knob on its spool, from the model where it is in the page, tools/gear/vinde.py)
        const C = SKA.reel, RX = SK.reelX, EY = RX && RX.eye, RL = EY ? [C[0] + EY[0], C[1] + EY[1] + 0.02, C[2] + EY[2]] : [C[0] + 0.14, C[1] - 0.05, C[2]], WX = EY ? RL[0] + 0.03 : C[0] + 0.3;
        const KR = RX && RX.crank ? RX.crank[0] : 0.13, KZ = RX && RX.crank ? RX.crank[2] : 0.26;
        if (A.st === 'jig' && Q.length && (Q.length >= 3 || nowT - Q[0].t > 2500)){ A.fish = Q.splice(0, 5); A.st = 'haul'; A.t = 0; A.d0 = -1.6 - 0.55 * A.fish.length; }
        let jig = 0; if (A.st === 'jig') jig = Math.pow(Math.max(0, Math.sin(T * 2.4)), 3); else A.th += dt * 10;
        drawN(SK.reelF, chain(BMrel, M4.T(C[0], C[1], C[2]))); drawN(SK.reelD, chain(BMrel, M4.T(C[0], C[1], C[2]), M4.RZ(A.th)));
        hR = [C[0] - KR * Math.sin(A.th), C[1] + KR * Math.cos(A.th), C[2] + KZ];
        hL = A.st === 'jig' ? [RL[0] - 0.02, RL[1] + 0.12 + 0.3 * jig, RL[2] - 0.02] : [RL[0] - 0.05, RL[1] + 0.06, RL[2]];
        const top = [RL[0], RL[1] + 0.04, RL[2]];
        if (A.st === 'jig'){ SK.lines.push([L2R([C[0] + 0.02, C[1] + 0.08, C[2]]), L2R(hL)], [L2R(hL), L2R(top)], [L2R(top), L2R([WX, -0.3, C[2]])]); }
        else {
          const end = A.d0 + A.t * 1.6;       // the pilk comes up at about 1.6 m/s
          SK.lines.push([L2R([C[0] + 0.02, C[1] + 0.08, C[2]]), L2R(top)]);
          let low = null;
          for (let i = A.fish.length - 1; i >= 0; i--){ const f = A.fish[i], y = end + i * 0.55;       // pilk at the end, fly hooks above it
            if (y >= RL[1] - 0.1){ A.bq.push({...f, a:[WX - 0.05, RL[1], C[2]], u:0}); A.fish.splice(i, 1); continue; }
            const P = [WX + 0.04 * Math.sin(T * 3 + i), y, C[2]]; if (y > -0.2) hang(f.sp, f.kg, P, i + 1); low = low || P; }
          SK.lines.push([L2R(top), L2R(low || [WX, Math.min(RL[1], end), C[2]])]);
          if (!A.fish.length && A.t > 0.8){ A.st = 'jig'; A.t = 0; }
        }
      } else {
        // jigging machines on the rail work by themselves; the fisher takes the fish off as they come up
        const n = Math.min(SKA.mach.length, S.equip.jukse);
        while (A.mc.length < n) A.mc.push({st:'jig', t:0, fish:[]});
        let busy = null;
        for (let k = 0; k < n; k++){ const m = A.mc[k], P = SKA.mach[k], G = SK.machG, tip = G ? [P[0] + G.x.tip[0], P[1] + G.x.tip[1], P[2] + G.x.tip[2]] : [P[0] + 0.8, P[1] + 0.62, P[2]]; m.t += dt;
          drawN(SK.mach, chain(BMrel, M4.T(P[0], P[1], P[2])));
          // the spool jerks the jig up and down while it fishes and runs the line in fast when fish are on; the sheave follows the line
          if (G){ const was = m.a || 0; m.a = m.st === 'jig' ? 1.6 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3) : was - dt * 9;
            const sp = G.x.spool, sh = G.x.sheave, sa = m.a;
            if (G.spool) drawN(G.spool, chain(BMrel, M4.T(P[0] + sp[0], P[1] + sp[1], P[2] + sp[2]), M4.RZ(sa)));
            if (G.sheave) drawN(G.sheave, chain(BMrel, M4.T(P[0] + sh[0], P[1] + sh[1], P[2] + sh[2]), M4.RZ(sa * G.x.spoolR / G.x.sheaveR)));
            SK.lines.push([L2R([P[0] + sp[0], P[1] + sp[1] + G.x.spoolR, P[2] + sp[2]]), L2R([P[0] + G.x.lead[0], P[1] + G.x.lead[1], P[2] + G.x.lead[2]])]); }
          if (m.st === 'jig' && Q.length && (Q.length >= 2 || nowT - Q[0].t > 2000)){ m.fish = Q.splice(0, 3); m.st = 'haul'; m.t = 0; m.d0 = -1.4 - 0.5 * m.fish.length; }
          if (m.st === 'jig'){ const bob = 0.25 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3); SK.lines.push([L2R(tip), L2R([tip[0], -0.3 - bob, tip[2]])]); }
          else { const end = m.d0 + m.t * 1.3; let low = null;
            for (let i = m.fish.length - 1; i >= 0; i--){ const f = m.fish[i], y = end + i * 0.5;
              if (y >= tip[1] - 0.35){ A.bq.push({...f, a:[tip[0] - 0.2, tip[1] - 0.35, tip[2]], u:0}); m.fish.splice(i, 1); busy = tip; continue; }
              const Pf = [tip[0], y, tip[2]]; if (y > -0.2) hang(f.sp, f.kg, Pf, i + k * 3); low = low || Pf; if (y > tip[1] - 1.0) busy = tip; }
            SK.lines.push([L2R(tip), L2R(low || [tip[0], Math.min(tip[1], end), tip[2]])]);
            if (!m.fish.length && m.t > 0.6){ m.st = 'jig'; m.t = 0; } } }
        hR = busy ? [busy[0] - 0.35, busy[1] - 0.45, busy[2] + 0.08] : [F[0] + 0.43, F[1] + 0.92, F[2] + 0.12]; hL = busy ? [busy[0] - 0.4, busy[1] - 0.5, busy[2] - 0.08] : [F[0] + 0.43, F[1] + 0.92, F[2] - 0.12];
      }
      // every fish is bled before it goes in the tub (Jonas 20.10.2026): he takes it in at the rail, holds it up by the head, the knife across the
      // throat and the blood running, and tosses it in the tub; the machines and the line wait meanwhile (one at a time, the next one queued)
      let kDir = null; if (!A.bl && A.bq.length) A.bl = {f:A.bq.shift(), t:0};
      if (A.bl){ const B = A.bl, f = B.f, c = (B.t += dt), ch = [F[0] + 0.36, F[1] + shY - 0.18, F[2] - 0.08], kU = [F[0] + 0.3, F[1] + shY - 0.05, F[2] + 0.2], kD = [F[0] + 0.42, F[1] + shY - 0.24, F[2] - 0.02], ease = u => u * u * (3 - 2 * u), L3 = (P, Q2, u) => [P[0] + (Q2[0] - P[0]) * u, P[1] + (Q2[1] - P[1]) * u, P[2] + (Q2[2] - P[2]) * u];
        if (c < 0.4){ hL = L3(f.a, ch, ease(c / 0.4)); hang(f.sp, f.kg, hL, 2); }
        else if (c < 1.45){ hL = ch; hang(f.sp, f.kg, hL, 2 + Math.sin(c * 7) * 0.1); hR = L3(kU, kD, ease(clamp((c - 0.45) / 0.35, 0, 1)));
          kDir = [0.6, -0.6, -0.4];   // (the knife is drawn in the right hand's grip, below with the arms)
          if (c > 0.75){ const sc = fsc(f.kg), th = xf(BMrel, [ch[0], ch[1] - sc * 0.12, ch[2]]), U = xf(BMrel, TUB); for (let i = 0; i < 10; i++){ const u = ((c - 0.75) * 1.6 + hash(i * 5) * 0.6) % 1; DKBLOOD.push([th[0] + (U[0] - th[0]) * 0.2 * u + (hash(i) - 0.5) * 0.03, th[1] - 0.9 * u * u, th[2] + (U[2] - th[2]) * 0.2 * u + (hash(i + 3) - 0.5) * 0.03]); } } }
        else { A.fly.push({sp:f.sp, kg:f.kg, a:ch, u:0}); A.bl = null; A.nb = (A.nb || 0) + 1; } }   // (nb: bled, for the tests)
      const arm = (Sw, Hw, sd, sp) => armTo(BMrel, SK.wk, Sw, Hw, sd, sp);
      const gR = arm(shR, hR, 1, kDir ? {g:'grip', a:kDir, tool:true} : null); arm(shL, hL, -1);
      if (kDir && gR){ const kn = knifeKit(true); if (kn) drawN(kn, chain(BMrel, toolM(gR, kDir))); }
      if (DKBLOOD.length) dkBloodDraw(VP);
    }
    // the hand aboard at the gear (above): seated by the tubs feeding the gear out over the quarter while she sets; standing by the tub at
    // his feet while she hauls, coiling the line into it or laying the net down
    if (mate){
      const WC = SK.wkC || SK.wk, L3 = (P, Q2, u) => [P[0] + (Q2[0] - P[0]) * u, P[1] + (Q2[1] - P[1]) * u, P[2] + (Q2[2] - P[2]) * u];
      if (setting){
        const P = SKA.setter, SP = SKA.set, MP = chain(M4.T(P[0], P[1], P[2]), M4.RY(-(P[3] != null ? P[3] : Math.PI / 3))); drawN(SK.setterC || SK.fisherC, chain(BMrel, MP));
        const sh = (SK.wkC ? WK_SH : 1.3) * 0.72, sR = xf(MP, [0.2, sh, 0]), sL = xf(MP, [-0.2, sh, 0]), fe = 0.5 + 0.5 * Math.sin(T * 5.5);
        const hR2 = [SP[0] - 0.12, SP[1] + 0.04 + 0.03 * fe, SP[2] - 0.04], hL2 = L3(xf(MP, [-0.05, sh - 0.38, -0.32]), [SP[0] - 0.3, SP[1] - 0.05, SP[2] + 0.05], fe);
        armTo(BMrel, WC, sR, hR2, 1, {g:'grip', a:[1, -0.2, 0]}); armTo(BMrel, WC, sL, hL2, -1);
        SK.lines.push([L2R(hL2), L2R(hR2)]);
      } else {
        const P = SKA.coil, C = SKA.coilTub || [P[0] + 0.45, P[1], P[2]], MP = chain(M4.T(P[0], P[1], P[2]), M4.RY(-Math.PI / 2)); drawN(SK.fisherC, chain(BMrel, MP));
        const sh = SK.wkC ? WK_SH : 1.3, sR = xf(MP, [0.2, sh, 0]), sL = xf(MP, [-0.2, sh, 0]), ph = T * 2.3, top = [C[0], C[1] + 0.45, C[2]];
        // the line: the coil laid round in the tub, the hands passing it down in turns; the net: armfuls laid down over the floor
        const loop = k => [C[0] + 0.14 * Math.cos(ph + k), C[1] + 0.4 + 0.12 * Math.max(0, Math.sin(ph * 0.5 + k)), C[2] + 0.14 * Math.sin(ph + k)];
        const hR2 = loop(0), hL2 = L3(loop(Math.PI), [SKA.haul[0] - 0.4, SKA.haul[1] + 0.1, SKA.haul[2]], 0.35);
        armTo(BMrel, WC, sR, hR2, 1); armTo(BMrel, WC, sL, hL2, -1);
        if (g0.kind === 'line'){ const ST = kit('rig', 'stamp'), LR = kit('rig', 'line_r'); if (ST){ const M = chain(BMrel, M4.T(C[0], C[1], C[2])); drawN(ST, M); if (LR) drawN(LR, chain(M, M4.S(1, 0.4 + 0.6 * clamp(((T * 0.02) % 1), 0, 1), 1))); } }
        SK.lines.push([L2R([SKA.haul[0] - 0.05, SKA.haul[1] + 0.08, SKA.haul[2]]), L2R(hL2)], [L2R(hL2), L2R(hR2)], [L2R(hR2), L2R(top)]);
      }
    }
    // the skipper at the lines (moorI: the one going on or coming off now, as 15-env-mooring.js takes them: mid, bow, stern, mid): he
    // stands inboard of its cleat, on the floor amidships or on the thwart at the bow and the stern, both hands on the line at the cleat
    if (moorI >= 0){
      const G = GEO(vtype()), sx = G.beam / 2, gw = G.gw || 1, mid = (G.bow + G.stern) / 2, which = ['mid', 'bow', 'stern', 'mid'][moorI], M0 = SKA.moor;
      const cl = {bow:[sx * 0.55, gw + 0.05, G.bow + 0.4], mid:[sx * 0.95, gw + 0.05, mid], stern:[sx * 0.8, gw + 0.05, G.stern - 0.35]}[which];
      const P = M0[which] || M0.mid, MP = chain(M4.T(P[0], P[1], P[2]), M4.RY(-Math.atan2(cl[0] - P[0], -(cl[2] - P[2])))); drawN(SK.fisher, chain(BMrel, MP));
      const sh = SK.wk ? WK_SH : 1.3, ph = Math.sin(T * 3), hR2 = [cl[0] - 0.06, cl[1] + 0.12 + 0.06 * ph, cl[2] + 0.06], hL2 = [cl[0] - 0.32, cl[1] + 0.2 - 0.06 * ph, cl[2] - 0.06];
      armTo(BMrel, SK.wk, xf(MP, [0.2, sh, 0]), hR2, 1); armTo(BMrel, SK.wk, xf(MP, [-0.2, sh, 0]), hL2, -1);
      SK.lines.push([L2R(hL2), L2R(hR2)]);
    }
    if (SK.wheelAt){
      drawN(SK.wheel, chain(BMrel, M4.T(...SK.wheelAt), M4.RX(-SK.wheelTilt), M4.RZ(SK.wheelA)));
      drawN(SK.lever, chain(BMrel, M4.T(...SK.leverAt), M4.RX(-(0.1 + frac * 0.9))));
      const MM = chain(BMrel, M4.T(...SK.motorAt), M4.RY(-SK.wheelA * 0.1), M4.RX(on ? 0.05 : 0));
      const m90 = !!(S.equip && S.equip.motor90 && SK.motor90);   // (D6, OB5: the 90 hp outboard once it is bought)
      drawN(m90 ? SK.motor90 : SK.motor, MM); drawN(m90 && SK.prop90 ? SK.prop90 : SK.prop, chain(MM, M4.T(...((m90 ? SK.prop90At : SK.propAt) || [0, -1.0, 0.54])), M4.RZ(SK.propA)));
    } else {
      // an inboard boat with a tiller: the tiller swings about the rudder head as she turns, the propeller turns under the stern
      if (SK.tiller && SK.tillerAt) drawN(SK.tiller, chain(BMrel, M4.T(...SK.tillerAt), M4.RY(SK.wheelA * 0.3)));
      if (SK.prop && SK.propAt) drawN(SK.prop, chain(BMrel, M4.T(...SK.propAt), M4.RZ(SK.propA * 0.35)));
    }
    gl.disableVertexAttribArray(2);
    // screens and name boards up close
    const near = Math.hypot(BMrel[12], BMrel[13], BMrel[14]) < 45, now = performance.now();
    if (!S.unnamed) drawNames(SK.hullT || vtype(), BMrel, VP, hullLiv(S.boat), S.boatName, ownPort());   // an unnamed boat has her mark only
    drawMark(SK.hullT || vtype(), BMrel, VP); drawCall(SK.hullT || vtype(), BMrel, VP); drawLogo(SK.hullT || vtype(), BMrel, VP, ...hullLogo());
    if (near && SK.live !== false){
      if (now - SK.tP > 500){ SK.tP = now; paintPlotter(); if (S.equip.vhf) paintVhf(); }
      if (now - SK.tG > 90){ paintGauges((now - SK.tG) / 1000); SK.tG = now; }
      drawTexQuad(SK.qPlot, SK.tPlot, BMrel, VP, false); drawTexQuad(SK.qGauge, SK.tGauge, BMrel, VP, false); if (S.equip.vhf) drawTexQuad(SK.qVhf, SK.tVhf, BMrel, VP, false);
    }
  }
  function drawSkiffGlass(BMrel, VP){ if (SK) drawGlass(SK.glass, BMrel, VP); }
  // the jigging machines on a boat with a wheelhouse (Jonas 13.10.2026: «alle båter utenom havflåten skal ha anledning til å bruke
  // juksamaskin»): on the rails by the working deck (starboard first, then port), clear of the hauler. Where the rail is, is read off the
  // boat's own model once per type: in a slice across her at each place, the top of the outermost part of her side.
  // the places along a model's rails where the side is no rail to bolt a machine to (a shelter's wall, a casing, a table): per side, 1 starboard
  // and -1 port, in the game's z. The breisjark (malo36.py, 02.11.2026, Jonas: the shelter open to starboard for the work): starboard in the
  // open side under the shelter aft of the bleeding tub and on the aft deck clear of the ladder; port aft of the casing
  // The 15 m shelter-decker (kyst15.py, OB12 11.11.2026): her places are the model's own, anchors.jigZ: two on the hauling station's sill
  // aft of the bleeding tub and two in the after hatch (the rest of her side is the shelter's closed wall)
  const JIGR = {};   // (the table JIG_Z for the breisjark and the kyst15 went with OB12: both models carry anchors.jigZ)
  function jigRail(t, G){
    if (t in JIGR) return JIGR[t];
    const m = vesselModel(t), P = m && m.o && m.o.p, out = [];
    if (P && G && G.deck){ const half = (G.beam || 3) / 2, hz = G.hauler ? G.hauler[2] : 1e9, st = G.stern || 4, bw = G.bow != null ? G.bow : -st, dy = G.deck.y;
      // the rail at z on a side: in a slice across her there, the outermost part of her side, and the top of it, a rail between knee
      // and hip height over the deck (null where there is none)
      const railPt = (sd, z) => { let xm = 0; for (let i = 0; i < P.length; i += 3){ const xs = sd * P[i]; if (Math.abs(P[i + 2] - z) < 0.12 && xs > xm && xs < half + 0.3) xm = xs; }
        if (xm < half * 0.6) return null;
        let ym = -1e9; for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 2] - z) < 0.12 && sd * P[i] > xm - 0.18 && P[i + 1] > ym && P[i + 1] < dy + 1.3) ym = P[i + 1];
        return ym < dy + 0.35 ? null : [sd * (xm - 0.05), ym, z, sd]; };
      // the model's own places, in the order the machines are bolted on (anchors.jigZ, [side, z]: the snekke, OB6 09.11.2026, where
      // the search put place 2 in the corner by the dashboard with the hard top's post through the one standing there)
      // (OB12: [side, z, x, y] is the point on the rail itself, for a side that flares out over the rail: the kyst15's sills, where the
      // outermost point of the slice is the shelter deck's cap and railPt found the strake under the sill)
      if (Array.isArray(G.jigZ)){ for (const J of G.jigZ){ const q = J.length >= 4 ? [J[2], J[3], J[1], J[0]] : railPt(J[0], J[1]); if (q) out.push(q); } return (JIGR[t] = out); }
      // the places to try: out from the middle of the working deck both ways, clear of the hauler and the ends
      const zs = [...Array(24).keys()].map(k => G.deck.z + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.35).filter(z => Math.abs(z - hz) > 0.6 && z < st - 0.9 && z > bw + 1.5);
      // as many as she may carry (jukseMax; Jonas' survey 30.10.2026, D2: only three were drawn of up to eight): the starboard rail
      // first, then the port one, each place's fourth number the side (1 starboard, -1 port: the machine turned round to face out)
      const max = Math.max(1, (VESSELS[t] || {}).jukseMax || 3), sides = [];
      for (const sd of [1, -1]){ const side = [];
        // (F21, OB3: an arm's length between two machines, so the lines do not foul each other, and as many to port as to starboard;
        // before 0.7 m apart and one more to starboard. The models' own places are as they were: anchors.jigZ)
        for (const z of zs){ if (side.length >= max) break; if (side.some(q => Math.abs(q[2] - z) < 1.0)) continue;
          const q = railPt(sd, z); if (q) side.push(q); }
        side.sort((a, b) => a[2] - b[2]); sides.push(side); }
      // (searched places, F21: the machines are bolted on a side in turn, starboard first, so two machines stand one to each side, each
      // side from the middle of the working deck outwards)
      // (a side with fewer places than the other: the rest on the side that has them, as many as she may carry)
      if (sides.length){ for (const sd of sides) sd.sort((a, b) => Math.abs(a[2] - G.deck.z) - Math.abs(b[2] - G.deck.z)); for (let i = 0; out.length < max && (i < sides[0].length || i < sides[1].length); i++) for (const sd of sides) if (sd[i] && out.length < max) out.push(sd[i]); } }
    return (JIGR[t] = out);
  }
  const JA = {mc:[], t:null};
  function drawJigRail(BMrel, VP, t, G, dt){
    if (!SK) return; SK.lines = []; SK.rodT = (SK.rodT || 0) + dt;
    // the machines stay bolted to the rail whatever she does; they run (spool, line, fish) only while she jigs with them
    const b = S.boat, own = S.equip && S.equip.jukse > 0, run = own && b.status === 'fishing' && !b.gop && !window.jigActive && !(S.target === 'kveite' && b.kgear), MG = SK.machG;
    if (!own || !MG){ JA.mc = []; return; }
    nSetup(VP);
    if (JA.t !== t){ JA.t = t; JA.mc = []; }
    const spots = jigRail(t, G), n = Math.min(S.equip.jukse, spots.length); if (!n) return;
    // a machine's frame, and a point of it, at its place (turned round on the port rail)
    const atM = P => P[3] < 0 ? chain(BMrel, M4.T(P[0], P[1], P[2]), M4.RY(Math.PI)) : chain(BMrel, M4.T(P[0], P[1], P[2])), off = (P, v) => [P[0] + (P[3] || 1) * v[0], P[1] + v[1], P[2] + (P[3] || 1) * v[2]];
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now(), T = (SK.rodT || 0), L2R = q => xf(BMrel, q), x = MG.x, sp = x.spool, sh = x.sheave;
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!run){ JA.mc = []; for (let k = 0; k < n; k++){ const P = spots[k], M = atM(P); drawN(MG.body, M);
      if (MG.spool) drawN(MG.spool, chain(M, M4.T(sp[0], sp[1], sp[2]))); if (MG.sheave) drawN(MG.sheave, chain(M, M4.T(sh[0], sh[1], sh[2]))); } return; }
    while (JA.mc.length < n) JA.mc.push({st:'jig', t:0, fish:[], a:0});
    for (let k = 0; k < n; k++){ const m = JA.mc[k], P = spots[k], M = atM(P), tip = off(P, x.tip); m.t += dt;
      drawN(MG.body, M);
      if (m.st === 'jig' && Q.length && (Q.length >= 2 || nowT - Q[0].t > 2000)){ m.fish = Q.splice(0, 3); m.st = 'haul'; m.t = 0; m.d0 = -1.6 - 0.5 * m.fish.length; }
      m.a = m.st === 'jig' ? 1.6 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3) : m.a - dt * 9;
      if (MG.spool) drawN(MG.spool, chain(M, M4.T(sp[0], sp[1], sp[2]), M4.RZ(m.a)));
      if (MG.sheave) drawN(MG.sheave, chain(M, M4.T(sh[0], sh[1], sh[2]), M4.RZ(m.a * x.spoolR / x.sheaveR)));
      SK.lines.push([L2R(off(P, [sp[0], sp[1] + x.spoolR, sp[2]])), L2R(off(P, x.lead))]);
      if (m.st === 'jig'){ const bob = 0.25 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3); SK.lines.push([L2R(tip), L2R([tip[0], -0.3 - bob, tip[2]])]); }
      else { const end = m.d0 + m.t * 1.3; let low = null;
        // the fish come up on the line and are taken in over the rail at the top (onto the deck, where the catch is shown)
        for (let i = m.fish.length - 1; i >= 0; i--){ const f = m.fish[i], y = end + i * 0.5;
          if (y >= tip[1] - 0.35){ m.fish.splice(i, 1); dkEvent('bleed', tip, f.sp, f.kg); continue; }
          const sc = clamp(0.42 * Math.cbrt(f.kg), 0.28, 1.2), Pf = [tip[0], y, tip[2]];
          if (y > -0.2) drawN(SK.fishM[f.sp] || SK.fishM.torsk, chain(BMrel, M4.T(Pf[0], Pf[1] - sc * 0.45, Pf[2]), M4.RX(Math.PI / 2), M4.RZ(Math.sin(T * 9 + i + k * 3) * 0.45), M4.S(sc)));
          low = low || Pf; }
        SK.lines.push([L2R(tip), L2R(low || [tip[0], Math.min(tip[1], end), tip[2]])]);
        if (!m.fish.length && m.t > 0.6){ m.st = 'jig'; m.t = 0; } } }
  }
  function drawGlass(m, BMrel, VP){
    if (!m || !m.n) return; nSetup(VP); gl.uniform1f(PRGN.u.uAlpha, 0.2);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    drawN(m, BMrel); gl.disableVertexAttribArray(2);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.useProgram(PL.p);
  }
  // Rain on the wheelhouse's windows, seen from the helm (G6): beads that sit on the glass (more the harder it rains, some left while it
  // dries) and drops that run down with a wet trail, in the glass's own frame so they stay on the window as the boat moves; spray in a
  // gale too. Drawn over the glass with the same mesh; each bead lighter at the top and darker under, as a drop shows the sky upside down.
  const DROP_FS = 'precision highp float;uniform float uRain;uniform float uT;uniform vec3 uSunCol;uniform vec3 uAmb;varying vec3 vW;varying vec3 vN;varying vec4 vC;varying vec3 vP;varying vec3 vNm;' + NOISE +
    'void main(){vec3 a=abs(vNm);vec2 q=a.x>a.z?vP.zy:vP.xy;' +
    'vec2 g=q*38.0;vec2 c=floor(g);vec2 f=fract(g)-0.5;float on=step(hs(c),uRain*0.32);vec2 o=vec2(hs(c+7.1),hs(c+3.3))-0.5;float r=0.08+0.3*pow(hs(c+1.7),2.0);' +
    'vec2 dl=f-o*(1.0-2.0*r);float dd=length(dl*vec2(1.0,1.15));float bead=on*(1.0-smoothstep(r*0.75,r,dd));float lt=smoothstep(-0.3,0.7,dl.y/r);' +
    'float cl=floor(q.x*30.0);float hc=hs(vec2(cl,9.0));float run=step(hc,uRain*0.3);float fx=fract(q.x*30.0)-0.5;float u=fract((q.y+uT*(0.05+0.12*hc))*0.8+hc*5.0);' +
    'float head=run*(1.0-smoothstep(0.22,0.42,abs(fx)))*(1.0-smoothstep(0.006,0.018,u));float trail=run*(1.0-smoothstep(0.06,0.14,abs(fx)))*smoothstep(0.012,0.02,u)*(1.0-smoothstep(0.02,0.25,u));' +
    'bead*=1.0-run*(1.0-smoothstep(0.3,0.5,abs(fx)))*smoothstep(0.0,0.02,u)*(1.0-smoothstep(0.02,0.5,u));' +
    'float al=max(bead,head)*0.45+trail*0.14;if(al<0.01)discard;vec3 base=uAmb*1.3+uSunCol*0.25;vec3 col=base*(0.45+1.1*max(lt*bead,head*0.8))+uSunCol*0.5*smoothstep(0.55,0.9,lt)*bead;' +
    'gl_FragColor=vec4(col,al);}';
  let PDROP = null;
  function drawDrops(m, BMrel, VP, t){
    if (!m || !m.n || !cam.helm || !WETON) return;
    const rain = env.temp > 0.5 ? sstep(0.04, 0.7, env.precip || 0) : 0, spray = sstep(12, 22, env.wind || 0) * 0.5, R = Math.max(rain, spray, (env.wet || 0) * 0.45);
    if (R < 0.03) return;
    if (!PDROP){ try { PDROP = program(LITN_VS, DROP_FS, ['aPos', 'aNor', 'aCol'], 'draaper'); } catch (e){ console.warn('3D ' + 'draaper' + ' faller bort · ' + GPU, e); PDROP = false; } }
    if (!PDROP) return;
    gl.useProgram(PDROP.p); const u = PDROP.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniformMatrix4fv(u.uM, false, BMrel); gl.uniform1f(u.uRain, R); gl.uniform1f(u.uT, t % 3600); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    attr(0, m.pb, 3); attr(1, m.nb, 3); gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, m.n); gl.disableVertexAttribArray(2);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.useProgram(PL.p);
  }
  function buildBoat(){
    const m = MB(), cap = MB(), NS = 16, Lh = 5.8;
    const bw = s => s < 0.35 ? 1.0 + 0.1 * s / 0.35 : 1.1 * Math.sqrt(Math.max(0, 1 - ((s - 0.35) / 0.65) ** 2));
    const gy = s => 0.55 + 0.3 * s * s, ky = s => -0.32 + 0.22 * s * s, chy = s => -0.08 + 0.12 * s * s, zs = s => 2.9 - s * Lh;
    const prof = s => { const b = bw(s), g = gy(s), z = zs(s); return [[-b,g,z],[-b * 0.98,g - 0.12,z],[-0.84 * b,chy(s),z],[0,ky(s),z],[0.84 * b,chy(s),z],[b * 0.98,g - 0.12,z],[b,g,z]]; };
    const cols = [NAVY, WHITE, RED, RED, WHITE, NAVY];
    for (let i = 0; i < NS; i++){
      const s0 = i / NS, s1 = (i + 1) / NS, A = prof(s0), B2 = prof(s1);
      for (let j = 0; j < 6; j++) m.quad(A[j], A[j + 1], B2[j + 1], B2[j], cols[j]);
      if (s1 <= 0.87){ const f0 = 0.74 * bw(s0), f1 = 0.74 * bw(s1); m.quad([-f0,0.12,zs(s0)], [f0,0.12,zs(s0)], [f1,0.12,zs(s1)], [-f1,0.12,zs(s1)], FLOOR); }
      if (s0 >= 0.8) m.quad([-bw(s0),gy(s0),zs(s0)], [bw(s0),gy(s0),zs(s0)], [bw(s1),gy(s1),zs(s1)], [-bw(s1),gy(s1),zs(s1)], WHITE);
      cap.quad([-bw(s0),gy(s0) - 0.03,zs(s0)], [bw(s0),gy(s0) - 0.03,zs(s0)], [bw(s1),gy(s1) - 0.03,zs(s1)], [-bw(s1),gy(s1) - 0.03,zs(s1)], WHITE);
    }
    const T = prof(0), c = [0, 0.12, 2.9];
    for (let j = 0; j < 6; j++) m.tri(c, T[j], T[j + 1], WHITE); m.tri(c, T[6], T[0], WHITE);
    m.box(0, 0.12, 0.2, 0.8, 0.95, 0.55, [0.84, 0.86, 0.87], 0);
    m.box(0, 1.07, -0.02, 0.8, 0.3, 0.05, GLASS, 0);
    const c2 = MB(); c2.box(0, 0.64, -1.0, 0.36, 0.14, 0.4, [0.2, 0.24, 0.32], 0); c2.box(0, 0.72, -1.02, 0.4, 0.5, 0.26, [0.95, 0.75, 0.15], 0); c2.box(0, 1.22, -1.02, 0.22, 0.24, 0.22, SKIN, 0); c2.box(0, 1.44, -1.02, 0.25, 0.07, 0.25, [0.6, 0.1, 0.1], 0); CREW2M = c2.mesh();
    const pm = MB(); pm.box(-0.1, 0.2, 0.78, 0.15, 0.8, 0.2, [0.14, 0.17, 0.24], 0); pm.box(0.1, 0.2, 0.78, 0.15, 0.8, 0.2, [0.14, 0.17, 0.24], 0); pm.box(0, 1.0, 0.78, 0.44, 0.58, 0.3, ORANGE, 0); pm.box(-0.2, 1.22, 0.55, 0.09, 0.09, 0.42, ORANGE, 0.05); pm.box(0.2, 1.22, 0.55, 0.09, 0.09, 0.42, ORANGE, -0.05); pm.box(0, 1.58, 0.78, 0.24, 0.26, 0.24, SKIN, 0); pm.box(0, 1.84, 0.78, 0.27, 0.08, 0.27, NAVY, 0); PERSONM = pm.mesh();
    m.box(0, 0.55, 3.08, 0.42, 0.52, 0.55, DARK, 0);
    m.box(0, -0.55, 3.1, 0.14, 1.1, 0.18, [0.28, 0.3, 0.33], 0);
    m.box(-0.78, 0.55, 2.72, 0.04, 1.3, 0.04, GREY, 0);
    BOATM = m.mesh(); CAPM = cap.mesh();
    const r = MB(); r.beam([0.28, 1.25, 0.62], [1.95, 2.0, 0.3], 0.018, DARK); RODM = r.mesh();
  }
  const FW = 22, FH = 16, FLAG_W = 0.6, FLAG_H = 0.44;
  function buildFlag(){
    const col = [];
    for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++){
      const blue = i === 7 || i === 8 || j === 7 || j === 8, white = (i >= 6 && i <= 9) || (j >= 6 && j <= 9);
      const k = blue ? [0, 0.13, 0.36] : white ? [0.95, 0.95, 0.95] : [0.73, 0.05, 0.18];
      for (let v = 0; v < 6; v++) col.push(k[0], k[1], k[2]);
    }
    // the picture's coordinates for the cloth (vessel3d.js flagCanvas: the hoist at u = 0, the top of the picture at the top)
    const uv = []; for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++){ const u0 = i / FW, u1 = (i + 1) / FW, v0 = 1 - j / FH, v1 = 1 - (j + 1) / FH; uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); }
    FLAGM = {pb:buf(new Float32Array(FW * FH * 18), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), cb:buf(new Float32Array(col)), ub:buf(new Float32Array(uv)), n:FW * FH * 6, pos:new Float32Array(FW * FH * 18), tex:null, key:''};
  }
  // the ensign the boat flies (Malerverkstedet: the nation and the shape, b.liv.flag; tried on while the paint shop is open)
  function flagTex(){
    const f = flagOf(PAINTPRE || S.boat.liv); let L = null, img = null, lk = '';
    if (f.code === 'LOGO'){ [L, img] = ownLogo(); if (L && (L.kind !== 'u' || (img && img.complete && img.naturalWidth))) lk = L.kind === 'u' ? 'u' + (L.img || '').length : logoStr(L); else f.code = 'NO'; }
    const k = f.code + '|' + f.shape + '|' + lk;
    if (FLAGM.key !== k){ FLAGM.key = k; if (!FLAGM.tex) FLAGM.tex = mkTex(); if (!FLAGM.cv){ FLAGM.cv = document.createElement('canvas'); FLAGM.cv.width = 256; FLAGM.cv.height = 188; }
      let lc = null; if (lk){ lc = document.createElement('canvas'); lc.width = lc.height = 256; logoCanvas(lc, L, img); }
      flagCanvas(FLAGM.cv, f.code, f.shape, lc); upTex(FLAGM.tex, FLAGM.cv); }
    return f;
  }
  // the masthead: the highest of the boat's lights (a detailed model's and a kit model's alike) when it is above the ensign's pole.
  // A boat with no mast: the open boats, whose highest light is the stern lantern or the all-round light on a stake by the ensign's pole
  // (within a metre of it); the snekke's all-round light sits on her mast amidships. (It carried the week's pennants until Jonas took
  // them off 09.11.2026; the model tests still read it through G3._debug.)
  function mastTop(G){ if (!G) return null; let top = null;
    for (const L of G.lights || []) if (L && L[0] && L[2] !== 'stern' && L[2] !== 'work' && (!top || L[0][1] > top[1])) top = L[0];
    if (!top || (G.pole && (top[1] <= G.pole[1] || Math.hypot(top[0] - G.pole[0], top[2] - G.pole[2]) < 1.0))) return null;
    return [top[0], top[1] + 0.3, top[2]]; }
  function updateFlag(t, appW){
    const droop = (1 - sstep(1.5, 8, appW)) * 1.25, amp = 0.03 + 0.09 * sstep(2, 16, appW), om = 4 + appW * 1.1;
    // the wave's phase adds up frame by frame (steg 44: t * om jumped with every small change of the wind once t was large, so the cloth
    // snapped to a new shape when the apparent wind moved)
    FLAGM.ph = (FLAGM.ph || 0) + om * (FLAGM.t0 == null ? 0 : Math.min(0.5, Math.max(0, t - FLAGM.t0))); FLAGM.t0 = t; const ph = FLAGM.ph;
    const P3 = (u, v) => { const z = amp * (u / FLAG_W) * Math.sin(u * 11 - ph + v * 3); return [u * Math.cos(droop), v - FLAG_H - u * Math.sin(droop), z]; };
    const a = FLAGM.pos; let k = 0;
    for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++){
      const u0 = i / FW * FLAG_W, u1 = (i + 1) / FW * FLAG_W, v0 = j / FH * FLAG_H, v1 = (j + 1) / FH * FLAG_H;
      const p00 = P3(u0, v0), p10 = P3(u1, v0), p11 = P3(u1, v1), p01 = P3(u0, v1);
      for (const q of [p00, p10, p11, p00, p11, p01]){ a[k++] = q[0]; a[k++] = q[1]; a[k++] = q[2]; }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, FLAGM.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, a);
  }

