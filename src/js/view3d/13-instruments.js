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
      if (q.x < MAPB.x0 || q.y < MAPB.y0 || q.x > MAPB.x1 || q.y > MAPB.y1) c = [60, 66, 70]; else if (isLand(q)) c = [224, 206, 150]; else { const dd = dok ? depthF(q) : 50; c = dd < Math.min(2, sd / 2) ? [128, 176, 222] : dd < sd ? [165, 202, 234] : dd < 30 ? [236, 243, 248] : [250, 252, 253]; }
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    sg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(plotSmall, 0, top, cw, ch);
    const X = x => (x - p.x) / kpp * (cw / sw), Y = y => top + ch / 2 + (y - p.y) / kpp * (cw / sw);
    g.save(); g.beginPath(); g.rect(0, top, cw, ch); g.clip();
    // the echo sounder's heat map, the same as on the chart plotter (ui/03c-heat.js)
    if (typeof heatDrawInto === 'function') heatDrawInto(g, p, cw / 2, top + ch / 2, cw / (2 * rng), true);   // without the blur filter (costly on a tablet)
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
    g.fillStyle = '#9fe3c6'; g.font = '600 15px ui-monospace, monospace'; const sog = b.status === 'port' ? 0 : b.v;
    g.fillText('SOG ' + fmt(sog, 1) + ' kn', 10, 18);
    g.textAlign = 'right'; g.fillText(hm(Hn), W - 10, 18); g.textAlign = 'left';
    g.fillStyle = '#7fa5b6'; g.font = '12px ui-monospace, monospace'; const ll = LL(p); g.fillText(ll.lat.toFixed(4) + '°N  ' + ll.lon.toFixed(4) + '°E', 10, Hc - 5);
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
  // the name on the hull: light on a dark hull, dark on a light one (vessel3d.js hullRGB), so it reads on every boat and every paint
  function paintName(t, liv){
    const nm = S.boatName || 'Havbris', c = hullRGB(t || vtype(), liv !== undefined ? liv : hullLiv(S.boat)), light = isLight(c), key = nm + (light ? '|l' : '|d');
    if (SK.nameKey === key) return; SK.nameKey = key;
    nameCanvas(SK.cvN, nm, light); upTex(SK.tName, SK.cvN);
  }
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
    const k = L.kind === 'u' ? 'u:' + img.src.length + ':' + img.src.slice(-24) : logoStr(L); let e = LTX.get(k);
    if (!e){ if (LTX.size >= 8){ let old = null; for (const [kk, v] of LTX) if (!old || v.used < old[1].used) old = [kk, v]; gl.deleteTexture(old[1].tex); LTX.delete(old[0]); }
      if (!LCV){ LCV = document.createElement('canvas'); LCV.width = LCV.height = 256; } logoCanvas(LCV, L, img); e = {tex:mkTex(), cv:null}; upTex(e.tex, LCV); LTX.set(k, e); }
    e.used = performance.now(); return e.tex;
  }
  const LOGOQ = {};
  function logoQ(t){ if (!(t in LOGOQ)){ const st = logoStrips(t); LOGOQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return LOGOQ[t]; }
  function drawLogo(t, M, VP, L, img){ const q = L && logoQ(t), tex = q && logoTexOf(L, img); if (!tex) return; gl.disableVertexAttribArray(2); for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]); }
  const ownLogo = () => { const L = curLogo(); return [L, L && L.kind === 'u' ? imgOf(L.img) : null]; };
  const MARKQ = {};
  function markQ(t){ if (!(t in MARKQ)){ const st = markStrips(t); MARKQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return MARKQ[t]; }
  function drawMark(t, M, VP, liv){ const q = markQ(t), tex = q && markTex(t, liv); if (!tex) return; gl.disableVertexAttribArray(2); for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]); }
  function nameCanvas(cv, nm, light){
    const g = cv.getContext('2d'); g.clearRect(0, 0, 512, 128); g.fillStyle = light ? '#f3f1e8' : '#14233d'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.3)'; g.shadowBlur = 3;
    let fs = 78; g.font = 'italic 700 ' + fs + 'px Georgia, serif'; while (g.measureText(nm).width > 480 && fs > 30){ fs -= 4; g.font = 'italic 700 ' + fs + 'px Georgia, serif'; }
    g.fillText(nm, 256, 66); g.shadowBlur = 0;
  }
  const isLight = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2] < 0.5;
  // the names of the other boats: a small pool of textures by name and shade (the boats near you change seldom), the oldest let go
  const NTX = new Map(); let NCV = null;
  function nameTex(nm, light, mark){
    const k = (mark ? 'M:' : '') + nm + (light ? '|l' : '|d'); let e = NTX.get(k);
    if (!e){ if (NTX.size >= 14){ let old = null; for (const [kk, v] of NTX) if (!old || v.used < old[1].used) old = [kk, v]; gl.deleteTexture(old[1].tex); NTX.delete(old[0]); }
      if (!NCV){ NCV = document.createElement('canvas'); NCV.width = 512; NCV.height = 128; }
      (mark ? markCanvas : nameCanvas)(NCV, nm, light); e = {tex:mkTex()}; upTex(e.tex, NCV); NTX.set(k, e); }
    e.used = performance.now(); return e.tex;
  }
  // the six nearest boats within 250 m that are drawn near (their glass is in) carry their names on the hull, light or dark by her paint
  function drawNPCNames(kit, VP){
    const near = []; for (const n of kit){ if (!n.name || !n.K || !n.K.glass) continue; n.dd = Math.hypot(n.M[12], n.M[14]); if (n.dd < 250) near.push(n); }
    if (!near.length) return; near.sort((a, b) => a.dd - b.dd); gl.disableVertexAttribArray(2);
    for (const n of near.slice(0, 6)){
      const t = npcType(n), q = nameQ(t); if (!q) continue;
      const lv = n.player ? livParse(n.liv) : LIVERY[(n.liv || 0) % LIVERY.length], c = lv && lv.hull ? lv.hull : hullRGB(t);
      const tex = nameTex(String(n.name).slice(0, 24), isLight(c)), M = chain(n.M, n.K.S);
      for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]);
      const mk = n.player && livMark(n.liv), mq = mk && markQ(t); if (mq){ const mt = nameTex(mk, isLight(markRGB(t, lv)), true); for (const s of mq) drawTexQuad(s, mt, M, VP, true, [0, 0.2, 0]); }
      const lg = n.player && logoParse(n.liv); if (lg) drawLogo(t, M, VP, lg, lg.kind === 'u' && typeof peerLogo === 'function' ? peerLogo(String(n.id).slice(1), lg.ver) : null);
      const pn = n.player && livPen(n.liv), mt = pn && mastTop(geoOf(t)); if (mt){ gl.disableVertexAttribArray(2); drawTexQuad(FLAGM, penTex(), chain(M, chain(model(mt[0], mt[1], mt[2], Math.PI / 2, 0, 0), PEN_S[Math.min(3, pn) - 1])), VP, true, [0, 0.6, 0]); }   // the week's pennants
    }
  }
  // the name strips of a type that is not steered by hand (vessel3d.js nameStrips), built once
  const NAMEQ = {};
  function nameQ(t){ if (!(t in NAMEQ)){ const st = nameStrips(t); NAMEQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return NAMEQ[t]; }
  // the hand-steered boat's paint (vessel3d.js hullLiv): the hull's colours uploaded again when it changes
  function paintHand(){
    const lv = hullLiv(S.boat), k = livKey(lv); if ((SK.livK || '') === k || !SK.hullT) return; SK.livK = k;
    const part = glbPart(SK.hullT, 'lod0'); if (!part) return;
    const o = lv && DESIGNS.some(q => lv[q]) ? glbDesign(SK.hullT, part, lv) : glbPaint(part, lv);
    if (o.p.length === SK.hull.n * 3){ gl.bindBuffer(gl.ARRAY_BUFFER, SK.hull.cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.c), gl.STATIC_DRAW); return; }
    // a design that cuts the hull: new buffers for the shape (the old ones go)
    for (const b of [SK.hull.pb, SK.hull.nb, SK.hull.cb]) gl.deleteBuffer(b);
    SK.hull = {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3};
  }
  function limbM(A, B, r){ const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, z = d.map(v => v / L), up = Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(v => v / xl); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0] * r, x[1] * r, x[2] * r, 0, y[0] * r, y[1] * r, y[2] * r, 0, z[0] * L, z[1] * L, z[2] * L, 0, A[0], A[1], A[2], 1]); }
  function drawSkiff(BMrel, VP, dt, showSkipper, showCrew){
    if (!SK) return; const b = S.boat;
    // wheel follows the turn rate, the outboard follows the wheel, the lever follows the speed
    if (SK.headPrev === null) SK.headPrev = bv.head; const rate = angDiff(SK.headPrev, bv.head) / Math.max(dt, 1e-3); SK.headPrev = bv.head;
    SK.wheelA += (clamp(rate * 9, -2.4, 2.4) - SK.wheelA) * Math.min(1, dt * 2.5);
    const on = engineOn(), frac = on ? clamp(b.v / BOAT.vmax, 0, 1) : 0; SK.propA += (on ? 6 + frac * 120 : 0) * dt;
    nSetup(VP);
    const fishing = S.boat.status === 'fishing' && !S.boat.deckStop;   // with all hands on deck, nobody fishes
    refreshPeople(SK); paintHand(); const wr = wearOn(vtype()); drawN(SK.hull, BMrel); if (wr) wearOff(); if (showSkipper && !fishing) drawN(SK.skipper, BMrel); if (showCrew) drawN(SK.crew, BMrel);
    SK.rodT += dt; SK.lines = [];
    const T = SK.rodT, A = SK.anim || (SK.anim = {mode:null, st:'jig', t:0, fish:[], fly:[], th:0, mc:[], bq:[], bl:null});
    const kv = S.target === 'kveite' && S.boat.kgear && !kveiteClosed(S.t / 60), mode = !fishing ? null : S.boat.gop ? 'gear' : (!kv && S.equip && S.equip.jukse > 0 && !window.jigActive) ? 'machine' : (S.boat.gear || kv) ? 'juksa' : null;
    if (mode !== A.mode){ A.mode = mode; A.st = 'jig'; A.t = 0; A.fish = []; A.fly = []; A.mc = []; A.bq = []; A.bl = null; }
    // fish reported by the fishing step; stale ones (3D was off) are dropped
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now();
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!mode) Q.length = 0;
    const airKg = Q.reduce((a, f) => a + f.kg, 0) + A.fish.reduce((a, f) => a + f.kg, 0) + A.fly.reduce((a, f) => a + f.kg, 0) + A.mc.reduce((a, m) => a + (m.fish || []).reduce((c, f) => c + f.kg, 0), 0);
    // the catch in the tub: one fish per ~5 kg, species in proportion to the hold; fish still in the air are not in it yet
    // (in the kit's 300 l tub where the model has its place, tools/deck/fisk.py; else in the model's own box)
    const KTq = ((GEO(vtype()) || {}).kit || {}).tubs, KTp = KTq && KTq[0], KTm = KTp && kit('fish', 'kar' + (KTp[4] || 300)), tb = KTm ? 0.14 : 0.05;
    KST.htub = 0; if (KTm){ drawN(KTm, chain(BMrel, M4.T(KTp[0], KTp[1], KTp[2]), M4.RY(KTp[3] || 0))); KST.htub = 1; }
    { const all = S.hold.reduce((a, x) => a + x.kg, 0), tot = Math.max(0, all - airKg), n = Math.min(40, Math.ceil(tot / 5)); if (n > 0){ const cum = []; let acc = 0; for (const sp of ALLSP){ acc += S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0); cum.push([sp, acc / all]); }
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
    const TUB = [SKA.tub[0], SKA.tub[1] + 0.42, SKA.tub[2] - 0.05], F = SKA.fisher;
    // fish swung from the rail into the tub
    for (let i = A.fly.length - 1; i >= 0; i--){ const f = A.fly[i]; f.u += dt / 0.75; if (f.u >= 1){ A.fly.splice(i, 1); continue; }
      const u = f.u; hang(f.sp, f.kg, [f.a[0] + (TUB[0] - f.a[0]) * u, f.a[1] + (TUB[1] - f.a[1]) * u + Math.sin(Math.PI * u) * 0.45, f.a[2] + (TUB[2] - f.a[2]) * u], i); }
    if (mode){
      const FP = chain(M4.T(F[0], F[1], F[2]), M4.RY(-Math.PI / 2)); drawN(SK.fisher, chain(BMrel, FP));
      const shY = SK.wk ? WK_SH : 1.3, shR = xf(FP, [0.2, shY, 0]), shL = xf(FP, [-0.2, shY, 0]); let hR, hL;
      A.t += dt;
      if (mode === 'gear'){
        const RL = SKA.haul, w = T * 3.2, hauling = S.boat.gop.op === 'haul';
        hR = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w)), RL[2] + 0.12]; hL = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w + Math.PI)), RL[2] - 0.12];
        SK.lines.push([L2R(RL), L2R([RL[0] + 1.4, -0.3, RL[2] - 1.0])]);
        if (hauling && Q.length && (A.t > 0.9) && !A.bl && !A.bq.length){ const f = Q.shift(); A.bq.push({...f, a:[RL[0] - 0.05, RL[1] + 0.1, RL[2]], u:0}); A.t = 0; }
      } else if (mode === 'juksa'){
        // hand jig: the left hand works the line over the roller; on a bite the right hand cranks it up with a fish on the pilk and the fly hooks
        const C = SKA.reel, RL = [C[0] + 0.14, C[1] - 0.05, C[2]], WX = C[0] + 0.3;
        if (A.st === 'jig' && Q.length && (Q.length >= 3 || nowT - Q[0].t > 2500)){ A.fish = Q.splice(0, 5); A.st = 'haul'; A.t = 0; A.d0 = -1.6 - 0.55 * A.fish.length; }
        let jig = 0; if (A.st === 'jig') jig = Math.pow(Math.max(0, Math.sin(T * 2.4)), 3); else A.th += dt * 10;
        drawN(SK.reelF, chain(BMrel, M4.T(C[0], C[1], C[2]))); drawN(SK.reelD, chain(BMrel, M4.T(C[0], C[1], C[2]), M4.RZ(A.th)));
        hR = [C[0] - 0.13 * Math.sin(A.th), C[1] + 0.13 * Math.cos(A.th), C[2] + 0.26];
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
        const n = Math.min(3, S.equip.jukse);
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
      // arms: shoulder to hand with the elbow bent down and out
      const arm = (Sw, Hw, sd, sp) => { const d = [Hw[0] - Sw[0], Hw[1] - Sw[1], Hw[2] - Sw[2]], Lh = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = d.map(v => v / Lh), seg = 0.31, Lc = Math.min(Lh, 2 * seg * 0.995);
        let bv = [0, -1, sd * 0.5]; const kk = bv[0] * u[0] + bv[1] * u[1] + bv[2] * u[2]; bv = [bv[0] - kk * u[0], bv[1] - kk * u[1], bv[2] - kk * u[2]]; const bl = Math.hypot(bv[0], bv[1], bv[2]) || 1, h = Math.sqrt(Math.max(0, seg * seg - (Lc / 2) ** 2));
        const Hc = [Sw[0] + u[0] * Lc, Sw[1] + u[1] * Lc, Sw[2] + u[2] * Lc], E = [(Sw[0] + Hc[0]) / 2 + bv[0] / bl * h, (Sw[1] + Hc[1]) / 2 + bv[1] / bl * h, (Sw[2] + Hc[2]) / 2 + bv[2] / bl * h];
        if (SK.wk){ const W = SK.wk, f = [Hc[0] - E[0], Hc[1] - E[1], Hc[2] - E[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1, HT = [Hc[0] + f[0] / fl * WK_S, Hc[1] + f[1] / fl * WK_S, Hc[2] + f[2] / fl * WK_S];
          drawN(W.uarm, chain(BMrel, limbM(Sw, E, WK_S))); drawN(W.farm, chain(BMrel, limbM(E, Hc, WK_S)));
          // the hands in their grips (hender.py): relaxed, the palm in and down; round the knife's handle when it bleeds a fish
          const HM = handMeshes(); if (!HM){ drawN(W.hand, chain(BMrel, limbM(Hc, HT, WK_S))); return Hc; }
          const s2 = sp || {g:'relax', n:[-sd * 0.9, -0.4, 0]}, Fr = handFrame(nrm3(f), s2, sd), gd = (HM.grip[s2.g] || HM.grip.relax)[sd > 0 ? 'R' : 'L'];
          drawN(HM[sd > 0 ? 'R' : 'L'][s2.g] || HM[sd > 0 ? 'R' : 'L'].relax, chain(BMrel, handMtx(Fr, Hc), M4.S(WK_S))); return add3(Hc, mul3(inFrame(Fr, gd.at), WK_S)); }
        drawN(SK.limb, chain(BMrel, limbM(Sw, E, 0.056))); drawN(SK.limb, chain(BMrel, limbM(E, Hc, 0.048))); drawN(SK.hand, chain(BMrel, M4.T(Hc[0], Hc[1], Hc[2]))); return Hc; };
      const gR = arm(shR, hR, 1, kDir ? {g:'grip', a:kDir, tool:true} : null); arm(shL, hL, -1);
      if (kDir && gR){ const kn = kit('fish', 'kniv'); if (kn) drawN(kn, chain(BMrel, toolM(gR, kDir))); }
      if (DKBLOOD.length) dkBloodDraw(VP);
    }
    if (SK.wheelAt){
      drawN(SK.wheel, chain(BMrel, M4.T(...SK.wheelAt), M4.RX(-SK.wheelTilt), M4.RZ(SK.wheelA)));
      drawN(SK.lever, chain(BMrel, M4.T(...SK.leverAt), M4.RX(-(0.1 + frac * 0.9))));
      const MM = chain(BMrel, M4.T(...SK.motorAt), M4.RY(-SK.wheelA * 0.1), M4.RX(on ? 0.05 : 0));
      drawN(SK.motor, MM); drawN(SK.prop, chain(MM, M4.T(...(SK.propAt || [0, -1.0, 0.54])), M4.RZ(SK.propA)));
    } else {
      // an inboard boat with a tiller: the tiller swings about the rudder head as she turns, the propeller turns under the stern
      if (SK.tiller && SK.tillerAt) drawN(SK.tiller, chain(BMrel, M4.T(...SK.tillerAt), M4.RY(SK.wheelA * 0.3)));
      if (SK.prop && SK.propAt) drawN(SK.prop, chain(BMrel, M4.T(...SK.propAt), M4.RZ(SK.propA * 0.35)));
    }
    gl.disableVertexAttribArray(2);
    // screens and name boards up close
    const near = Math.hypot(BMrel[12], BMrel[13], BMrel[14]) < 45, now = performance.now();
    if (!S.unnamed){ paintName(); for (const q of SK.qName) drawTexQuad(q, SK.tName, BMrel, VP, true, [0, 0.2, 0]); }   // an unnamed boat has her mark only
    drawMark(SK.hullT || vtype(), BMrel, VP); drawLogo(SK.hullT || vtype(), BMrel, VP, ...ownLogo());
    if (near && SK.live !== false){
      if (now - SK.tP > 500){ SK.tP = now; paintPlotter(); if (S.equip.vhf) paintVhf(); }
      if (now - SK.tG > 90){ paintGauges((now - SK.tG) / 1000); SK.tG = now; }
      drawTexQuad(SK.qPlot, SK.tPlot, BMrel, VP, false); drawTexQuad(SK.qGauge, SK.tGauge, BMrel, VP, false); if (S.equip.vhf) drawTexQuad(SK.qVhf, SK.tVhf, BMrel, VP, false);
    }
  }
  function drawSkiffGlass(BMrel, VP){ if (SK) drawGlass(SK.glass, BMrel, VP); }
  // the jigging machines on a boat with a wheelhouse (Jonas 13.10.2026: «alle båter utenom havflåten skal ha anledning til å bruke
  // juksamaskin»): up to three on the starboard rail by the working deck, clear of the hauler. Where the rail is, is read off the
  // boat's own model once per type: in a slice across her at each place, the top of the outermost part of her side.
  const JIGR = {}, JIG_Z = {breisjark:[3.5, 4.25, 5.0]};    // where the side is covered forward (her shelter), the open deck aft
  function jigRail(t, G){
    if (t in JIGR) return JIGR[t];
    const m = vesselModel(t), P = m && m.o && m.o.p, out = [];
    if (P && G && G.deck){ const half = (G.beam || 3) / 2, hz = G.hauler ? G.hauler[2] : 1e9, st = G.stern || 4, bw = G.bow != null ? G.bow : -st, dy = G.deck.y;
      // the places to try: out from the middle of the working deck both ways, clear of the hauler and the ends
      const zs = JIG_Z[t] || [...Array(24).keys()].map(k => G.deck.z + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.35).filter(z => Math.abs(z - hz) > 0.6 && z < st - 0.9 && z > bw + 1.5);
      for (const z of zs){ if (out.length >= 3) break; if (out.some(q => Math.abs(q[2] - z) < 0.7)) continue;
        let xm = 0; for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 2] - z) < 0.12 && P[i] > xm && P[i] < half + 0.3) xm = P[i];
        if (xm < half * 0.6) continue;
        // the top of her side there, a rail between knee and hip height over the deck
        let ym = -1e9; for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 2] - z) < 0.12 && P[i] > xm - 0.18 && P[i + 1] > ym && P[i + 1] < dy + 1.3) ym = P[i + 1];
        if (ym < dy + 0.35) continue;
        out.push([xm - 0.05, ym, z]); }
      out.sort((a, b) => a[2] - b[2]); }
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
    const spots = jigRail(t, G), n = Math.min(3, S.equip.jukse, spots.length); if (!n) return;
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now(), T = (SK.rodT || 0), L2R = q => xf(BMrel, q), x = MG.x, sp = x.spool, sh = x.sheave;
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!run){ JA.mc = []; for (let k = 0; k < n; k++){ const P = spots[k]; drawN(MG.body, chain(BMrel, M4.T(P[0], P[1], P[2])));
      if (MG.spool) drawN(MG.spool, chain(BMrel, M4.T(P[0] + sp[0], P[1] + sp[1], P[2] + sp[2]))); if (MG.sheave) drawN(MG.sheave, chain(BMrel, M4.T(P[0] + sh[0], P[1] + sh[1], P[2] + sh[2]))); } return; }
    while (JA.mc.length < n) JA.mc.push({st:'jig', t:0, fish:[], a:0});
    for (let k = 0; k < n; k++){ const m = JA.mc[k], P = spots[k], tip = [P[0] + x.tip[0], P[1] + x.tip[1], P[2] + x.tip[2]]; m.t += dt;
      drawN(MG.body, chain(BMrel, M4.T(P[0], P[1], P[2])));
      if (m.st === 'jig' && Q.length && (Q.length >= 2 || nowT - Q[0].t > 2000)){ m.fish = Q.splice(0, 3); m.st = 'haul'; m.t = 0; m.d0 = -1.6 - 0.5 * m.fish.length; }
      m.a = m.st === 'jig' ? 1.6 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3) : m.a - dt * 9;
      if (MG.spool) drawN(MG.spool, chain(BMrel, M4.T(P[0] + sp[0], P[1] + sp[1], P[2] + sp[2]), M4.RZ(m.a)));
      if (MG.sheave) drawN(MG.sheave, chain(BMrel, M4.T(P[0] + sh[0], P[1] + sh[1], P[2] + sh[2]), M4.RZ(m.a * x.spoolR / x.sheaveR)));
      SK.lines.push([L2R([P[0] + sp[0], P[1] + sp[1] + x.spoolR, P[2] + sp[2]]), L2R([P[0] + x.lead[0], P[1] + x.lead[1], P[2] + x.lead[2]])]);
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
    if (!PDROP){ try { PDROP = program(LITN_VS, DROP_FS, ['aPos', 'aNor', 'aCol'], 'draaper'); } catch (e){ console.warn('draaper', e.message || e); PDROP = false; } }
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
  // the week's pennants (core/09f-merker.js; Jonas 07.10.2026): the Norwegian pennant at the masthead, longer for each chapter finished,
  // on your own boat and on other players' (their paint code's p:N, vessel3d.js livPen). It flies on the ensign's own waving cloth
  // (FLAGM), drawn long and thin; the cloth's picture is the red tapering pennant with the cross's white and blue running lengthwise
  // to the tip (what is outside is clear and not drawn)
  const PEN_S = [2.8, 3.4, 4].map(sx => new Float32Array([sx, 0, 0, 0, 0, 0.65, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));   // about 1.7, 2 and 2.4 m by 0.3 m
  let PENT = null;
  function penTex(){
    if (PENT) return PENT;
    const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    // a band of k times the pennant's height, tapering with it from the hoist to a blunt tip
    const band = (k, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H / 2 * (1 - k)); g.lineTo(W, H / 2 - 12 * k); g.lineTo(W, H / 2 + 12 * k); g.lineTo(0, H / 2 * (1 + k)); g.closePath(); g.fill(); };
    band(1, '#ba0c2f'); band(0.32, '#f4f4f0'); band(0.16, '#00205b');
    // mipmapped, so the thin stripes stay whole at a distance; the clear texels take the red, so the smaller levels get no dark rim
    const im = g.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) if (!d[i + 3]){ d[i] = 186; d[i + 1] = 12; d[i + 2] = 47; }
    PENT = mkTex(); upTex(PENT, im); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); return PENT;
  }
  // the masthead: the highest of the boat's lights (a detailed model's and a kit model's alike) when it is above the ensign's pole.
  // A boat with no mast flies no pennant, only the ensign (Jonas 07.10.2026): the open boats, whose highest light is the stern lantern or
  // the all-round light on a stake by the ensign's pole (within a metre of it); the snekke's all-round light sits on her mast amidships
  function mastTop(G){ if (!G) return null; let top = null;
    for (const L of G.lights || []) if (L && L[0] && L[2] !== 'stern' && L[2] !== 'work' && (!top || L[0][1] > top[1])) top = L[0];
    if (!top || (G.pole && (top[1] <= G.pole[1] || Math.hypot(top[0] - G.pole[0], top[2] - G.pole[2]) < 1.0))) return null;
    return [top[0], top[1] + 0.3, top[2]]; }
  function updateFlag(t, appW){
    const droop = (1 - sstep(1.5, 8, appW)) * 1.25, amp = 0.03 + 0.09 * sstep(2, 16, appW), om = 4 + appW * 1.1;
    const P3 = (u, v) => { const z = amp * (u / FLAG_W) * Math.sin(u * 11 - t * om + v * 3); return [u * Math.cos(droop), v - FLAG_H - u * Math.sin(droop), z]; };
    const a = FLAGM.pos; let k = 0;
    for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++){
      const u0 = i / FW * FLAG_W, u1 = (i + 1) / FW * FLAG_W, v0 = j / FH * FLAG_H, v1 = (j + 1) / FH * FLAG_H;
      const p00 = P3(u0, v0), p10 = P3(u1, v0), p11 = P3(u1, v1), p01 = P3(u0, v1);
      for (const q of [p00, p10, p11, p00, p11, p01]){ a[k++] = q[0]; a[k++] = q[1]; a[k++] = q[2]; }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, FLAGM.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, a);
  }

