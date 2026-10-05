// ===== SOUND (the user's wish 03.10.2026) =====
// Made in the browser with Web Audio, nothing recorded: it starts at the first touch (the browsers allow no sound before one) and
// follows what the boat does and where she is, every 100 ms:
//   engine   two oscillators at the firing rate from the speed (an outboard revs high; a diesel low, with the chug of its strokes),
//            through a low-pass that opens with the load; idling when she lies still at sea, off in port, adrift or aground
//   sea      the wash along the hull (pink noise, louder and brighter with speed and waves) and slaps on the hull now and then
//   weather  the wind in band-passed noise that wanders with the gusts; rain (snow falls silently: its hiss was a white noise, Jonas 05.10.2026)
//   gulls    a cry now and then round the boat, often while the catch is gutted
//   harbour  while the catch is landed the crane's whine and the forklift's reversing beeps; the pump while she is fuelled; the ice
//            chute's rumble when ice comes aboard
//   fishing  the hauler's hydraulic whine while gear is hauled; the jigging reel now and then while fishing
// The volume and on or off are in the phone's settings (S.settings.vol, 0 to 1; S.settings.sound false is off).
// Where you hear it from (the user's wish 03.10.2026): in 3D the ear is the camera (G3.ear), and what has a place (your boat's engine,
// wash, hauler, reel and slaps, the gulls round her, the plant's crane, forklift and ice chute, the pump, the three nearest boats of
// the fleet; G3.sndSrc) is fainter with the distance, (ref / d)^0.9 from ref metres out, duller (a lower low-pass) and to the left or
// right as it lies from the camera. The wind, the rain and the sea round you are where you are. The bridge watch alarm is never under
// half. In the 2D chart the ear is aboard, as before.
const SNDREF = {eng:12, wash:10, haul:5, reel:4, slap:8, gull:12, crane:18, beep:20, chute:15, pump:6, alarm:8, npc:12, npcBig:30, air:350};
const SND = (() => {
  let ac = null, master = null, L = null, started = false, lastIce = null, craneT = 0, beepT = 0, alarmT = 0, EAR = null;
  const LV = {};   // the levels set at the last tick (for the tests)
  const vol = () => S.settings.sound === false ? 0 : (S.settings.vol == null ? 0.6 : S.settings.vol);
  function noise(sec, pink){
    const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < n; i++){ const w = Math.random() * 2 - 1; if (pink){ b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; } else d[i] = w; }
    return b;
  }
  const loop = buf => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; };
  const gain = (v, to) => { const g = ac.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
  const filt = (type, f, q) => { const x = ac.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };
  const osc = (type, f) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.start(); return o; };
  // a gain that reaches the master through a stereo panner (left -1 to right 1), for what has a place
  const pgain = () => { const g = gain(0), p = ac.createStereoPanner ? ac.createStereoPanner() : null; if (p){ g.connect(p); p.connect(master); } else g.connect(master); return {g, p}; };
  let PINK, WHITE;
  function build(){
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = gain(0, ac.destination); PINK = noise(3, true); WHITE = noise(2, false); L = {};
    // the engine: a saw at the firing rate and a square an octave down, a ripple at the rate of the revolutions, through a low-pass
    { const {g, p} = pgain(), f = filt('lowpass', 400, 2.5), am = gain(0.7, f), o1 = osc('sawtooth', 60), o2 = osc('square', 30), g2 = gain(0.35, am), lfo = osc('sine', 12), lg = gain(0.3);
      f.connect(g); o1.connect(am); o2.connect(g2); lfo.connect(lg); lg.connect(am.gain); L.eng = {g, p, f, o1, o2, lfo, lg}; }
    // the three nearest boats of the fleet: a diesel each, low and dull
    for (let k = 0; k < 3; k++){ const {g, p} = pgain(), f = filt('lowpass', 260, 1.5), o1 = osc('sawtooth', 32), o2 = osc('square', 16), g2 = gain(0.4, f); o1.connect(f); o2.connect(g2); f.connect(g); L['npc' + k] = {g, p, f, o1, o2}; }
    // the nearest aircraft: pink noise through a low-pass with the propellers' hum, chopped at the blade rate for a helicopter
    { const {g, p} = pgain(), f = filt('lowpass', 600, 0.8), am = gain(0.6, f), o = osc('sawtooth', 82), og = gain(0.12, f), lfo = osc('sine', 0.3), lg = gain(0.05);
      loop(PINK).connect(am); o.connect(og); lfo.connect(lg); lg.connect(am.gain); f.connect(g); L.air = {g, p, f, o, lfo, lg}; }
    // the wash and the sea round her
    { const g = gain(0, master), f = filt('lowpass', 800, 0.7); loop(PINK).connect(f); f.connect(g); L.sea = {g, f}; }
    // the wind
    { const g = gain(0, master), f = filt('bandpass', 700, 0.9); loop(PINK).connect(f); f.connect(g); L.wind = {g, f}; }
    // rain
    { const g = gain(0, master), f = filt('highpass', 2500, 0.5); loop(WHITE).connect(f); f.connect(g); L.rain = {g, f}; }
    // the hydraulics (the hauler), the crane's motor and the fuel pump: hums through band-passes
    for (const [k, type, fr, bp, q] of [['haul', 'sawtooth', 165, 520, 3], ['crane', 'sawtooth', 118, 380, 2], ['pump', 'triangle', 50, 120, 1.5], ['reel', 'sawtooth', 340, 900, 4]]){
      const {g, p} = pgain(), f = filt('bandpass', bp, q), o = osc(type, fr), wob = osc('sine', k === 'reel' ? 13 : 0.7), wg = gain(fr * 0.02); wob.connect(wg); wg.connect(o.frequency); o.connect(f); f.connect(g); L[k] = {g, p, o};
    }
  }
  const set = (k, v, tc) => { LV[k] = v; L[k].g.gain.setTargetAtTime(v, ac.currentTime, tc || 0.25); };
  // where a sound at q ([x, y, z] m) is heard from the ear: {g (0-1), pan (-1 left to 1 right), lp (the low-pass's share), d}
  function at(q, ref){
    const e = EAR; if (!e || !q) return {g:1, pan:0, lp:1, d:0};
    const dx = q[0] - e.x, dy = q[1] - e.y, dz = q[2] - e.z, dh = Math.hypot(dx, dz), d = Math.hypot(dh, dy), fl = Math.hypot(e.fx, e.fz) || 1;
    const side = dh > 0.01 ? (dx * -e.fz / fl + dz * e.fx / fl) / dh : 0;
    return {g:Math.min(1, Math.pow(ref / Math.max(ref, d), 0.9)), pan:clamp(side * 0.85 * clamp(dh / 4, 0, 1), -0.85, 0.85), lp:clamp(1.15 - 0.25 * Math.log10(Math.max(d, 1)), 0.35, 1), d};
  }
  const place = (k, a) => { const P = L[k].p; LV[k + 'Pan'] = a.pan; if (P) P.pan.setTargetAtTime(a.pan, ac.currentTime, 0.1); };
  // a one-shot's own panner (the gull, the slap, the beeps, the chute, the alarm)
  const oneOut = pan => { if (!pan || !ac.createStereoPanner) return master; const p = ac.createStereoPanner(); p.pan.value = pan; p.connect(master); return p; };
  // a burst of noise through a filter, with an attack and a decay (a slap, the chute)
  function burst(type, f, q, peak, dur, att, pan){
    const s = ac.createBufferSource(); s.buffer = PINK; const x = filt(type, f, q), g = gain(0, oneOut(pan)), t = ac.currentTime;
    s.connect(x); x.connect(g); g.gain.linearRampToValueAtTime(peak, t + (att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.start(t, Math.random() * 2); s.stop(t + dur + 0.05);
  }
  // a gull's cry: a falling, then rising and falling squeal, two or three calls
  function gull(near, pan){
    const t0 = ac.currentTime, n = 1 + Math.floor(Math.random() * 3), base = 1400 + Math.random() * 500, g = gain(0, oneOut(pan)), f = filt('bandpass', 2200, 1.2), o = osc('sawtooth', base);
    o.connect(f); f.connect(g);
    for (let i = 0; i < n; i++){ const t = t0 + i * 0.32; o.frequency.setValueAtTime(base * 1.25, t); o.frequency.exponentialRampToValueAtTime(base * 0.7, t + 0.22);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05 * near, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.26); }
    o.stop(t0 + n * 0.32 + 0.1);
  }
  // the forklift reversing: three to six beeps
  function beeps(a){
    const t0 = ac.currentTime, n = 3 + Math.floor(Math.random() * 4), g = gain(0, oneOut(a.pan)), o = osc('square', 1040); o.connect(g);
    for (let i = 0; i < n; i++){ const t = t0 + i * 0.9; g.gain.setValueAtTime(0.025 * a.g, t); g.gain.setValueAtTime(0, t + 0.45); }
    o.stop(t0 + n * 0.9);
  }
  function tick(){
    if (!ac || ac.state !== 'running') return;
    const b = S.boat, H = S.t / 60, p3 = typeof G3 !== 'undefined' && G3.isActive(), mv = vol() * (p3 ? 1 : 0.6);
    master.gain.setTargetAtTime(mv, ac.currentTime, 0.3); LV.master = mv; if (!mv) return;
    // the ear and the places: the camera in 3D (or what a test sets), else aboard
    EAR = SND.testEar || (p3 && G3.ear ? G3.ear() : null);
    const SRC = SND.testSrc || (EAR && G3.sndSrc ? G3.sndSrc() : {}), boat = SRC.boat || null, now = ac.currentTime;
    const aB = at(boat, SNDREF.eng); LV.engAtt = aB.g; LV.d = aB.d;
    // the bridge watch alarm: a shrill beep twice a second until it is acknowledged; never under half, wherever the camera is
    LV.alarm = typeof alarmOn === 'function' && alarmOn() ? 1 : 0;
    if (LV.alarm && now > alarmT){ const a = at(boat, SNDREF.alarm), t = Math.max(now, alarmT), g = gain(0, oneOut(a.pan)), o = osc('square', 2900); o.connect(g); LV.alarmG = Math.max(0.5, a.g);
      g.gain.setValueAtTime(0.09 * LV.alarmG, t); g.gain.setValueAtTime(0, t + 0.22); o.stop(t + 0.25); alarmT = t + 0.5; }
    const atSea = !['port', 'unmooring'].includes(b.status), v = b.status === 'sailing' || b.gop ? (b.v || 0) : 0, frac = clamp(v / Math.max(1, BOAT.vmax), 0, 1);
    const W = windAt(H), hs = atSea ? hsAt(b.pos, H) : 0.1, rain = precipAt(H), snow = airTemp(H) < 1;
    // the engine
    const run = ['sailing', 'unmooring', 'fishing', 'idle'].includes(b.status) || !!b.gop, dsl = !!BOAT.diesel || !BOAT.planing;
    const rpm = dsl ? 650 + frac * 1500 : 900 + Math.pow(frac, 0.85) * 5100, fire = rpm / 60 * (dsl ? 3 : 2), E = L.eng;
    E.o1.frequency.setTargetAtTime(fire, now, 0.3); E.o2.frequency.setTargetAtTime(fire / 2, now, 0.3); E.lfo.frequency.setTargetAtTime(rpm / 60, now, 0.3);
    E.lg.gain.setTargetAtTime(dsl ? 0.45 : 0.15, now, 0.5); E.f.frequency.setTargetAtTime((220 + 1300 * frac + (dsl ? 0 : 300)) * aB.lp, now, 0.3);
    set('eng', run ? (dsl ? 0.13 + 0.12 * frac : 0.08 + 0.17 * frac) * aB.g : 0, 0.4); place('eng', aB);
    // the sea round you, and the wash along her hull from where she is; the wind, the rain
    const aW = at(boat, SNDREF.wash);
    set('sea', (atSea ? 0.03 + Math.min(0.2, v * 0.011) * aW.g + Math.min(0.12, hs * 0.06) : 0.012), 0.4); L.sea.f.frequency.setTargetAtTime(500 + v * 45 * aW.lp + hs * 120, now, 0.5);
    set('wind', Math.pow(clamp((W - 2.5) / 22, 0, 1), 1.3) * (atSea ? 0.28 : 0.14), 0.6); L.wind.f.frequency.setTargetAtTime(450 + W * 30 + Math.random() * 300, now, 0.8);
    set('rain', rain > 0.15 && !snow ? (rain - 0.15) * 0.16 : 0, 1);
    // hull slaps at sea, more in a sea and under way
    if (atSea && Math.random() < 0.01 + Math.min(0.06, hs * 0.03 + v * 0.002)){ const a = at(boat, SNDREF.slap); burst('lowpass', (180 + Math.random() * 160) * a.lp, 1, (0.08 + Math.min(0.25, hs * 0.1 + v * 0.008) * Math.random()) * a.g, 0.35, 0.006, a.pan); }
    // gulls: now and then round the boat, often while the catch is gutted (the offal)
    const gut = atSea && S.hold && S.hold.some(x => !x.gut) && typeof catchGut === 'function' && catchGut();
    if (Math.random() < (gut ? 0.05 : b.status === 'port' ? 0.012 : atSea && v < 12 ? 0.006 : 0.002)){
      const r = 8 + Math.random() * 30, an = Math.random() * 6.28, q = boat ? [boat[0] + Math.sin(an) * r, boat[1] + 6 + Math.random() * 12, boat[2] + Math.cos(an) * r] : null, a = at(q, SNDREF.gull);
      if (a.g > 0.02) gull((0.5 + Math.random() * 0.5) * a.g, a.pan); }
    // the harbour: the crane and the forklift while landing (at the plant), the pump (at the bunker quay), the ice chute
    const land = b.status === 'port' && b.land, aC = at(SRC.crane, SNDREF.crane);
    if (land){ if (now > craneT){ craneT = now + 4 + Math.random() * 6; L.crane.on = !L.crane.on; } } else L.crane.on = false;
    set('crane', L.crane.on ? 0.06 * aC.g : 0, 0.3); place('crane', aC);
    if (land && now > beepT && Math.random() < 0.05){ beepT = now + 8; beeps(at(SRC.crane, SNDREF.beep)); }
    const f = b.fueling, aP = at(SRC.pump, SNDREF.pump); set('pump', f && S.t >= f.pumpAt ? 0.09 * aP.g : 0, 0.4); place('pump', aP);
    if (lastIce != null && b.ice > lastIce + 5 && b.status === 'port'){ const a = at(SRC.chute, SNDREF.chute); burst('bandpass', 320 * a.lp, 0.6, 0.18 * a.g, 3.5, 0.4, a.pan); }
    lastIce = b.ice;
    // the hauler, the reel
    const aH = at(boat, SNDREF.haul);
    set('haul', (b.gop && b.gop.op === 'haul' ? 0.07 : b.gop ? 0.025 : 0) * aH.g, 0.3); place('haul', aH);
    if (b.status === 'fishing' && !b.gop && Math.random() < 0.02) L.reel.until = now + 2 + Math.random() * 2;
    const aR = at(boat, SNDREF.reel); set('reel', b.status === 'fishing' && L.reel.until > now ? 0.03 * aR.g : 0, 0.15); place('reel', aR);
    // the nearest aircraft (in 3D only), heard far: a drone that grows and fades as it passes
    const air = EAR && SRC.air ? SRC.air : null, aA = at(air, SNDREF.air);
    if (air){ const hl = !!air[3]; L.air.o.frequency.setTargetAtTime(hl ? 24 : 82, now, 0.5); L.air.lfo.frequency.setTargetAtTime(hl ? 21 : 0.3, now, 0.5); L.air.lg.gain.setTargetAtTime(hl ? 0.5 : 0.05, now, 0.5); L.air.f.frequency.setTargetAtTime((hl ? 480 : 700) * aA.lp, now, 0.5); }
    set('air', air ? 0.22 * aA.g : 0, 1.0); place('air', aA);
    // the three nearest boats of the fleet that are under way or idling (in 3D only: the 2D chart has no place to hear them from)
    const npc = (EAR && SRC.npc ? SRC.npc : []).map(n => ({n, a:at([n.x, 2, n.z], n.big ? SNDREF.npcBig : SNDREF.npc)})).filter(o => o.a.d < 2500).sort((x, y) => x.a.d - y.a.d);
    for (let k = 0; k < 3; k++){
      const o = npc[k], N = L['npc' + k]; if (!o){ set('npc' + k, 0, 0.6); continue; }
      const nv = o.n.v || 0, on = o.n.st !== 'port' || nv > 0.3, fr = (650 + Math.min(1, nv / 10) * 1100) / 60 * 3 * (o.n.big ? 0.6 : 1);
      N.o1.frequency.setTargetAtTime(fr, now, 0.5); N.o2.frequency.setTargetAtTime(fr / 2, now, 0.5); N.f.frequency.setTargetAtTime((200 + nv * 25) * o.a.lp, now, 0.5);
      set('npc' + k, on ? (o.n.big ? 0.16 : 0.1) * (nv > 0.5 ? 1 : 0.4) * o.a.g : 0, 0.6); place('npc' + k, o.a);
    }
  }
  function start(){
    if (started || !vol()) return;
    try { build(); started = true; setInterval(tick, 100); } catch (e){ console.warn('sound', e); }
  }
  // the first touch starts it; a hidden page is silent
  document.addEventListener('pointerdown', () => { if (!started) start(); else if (ac && ac.state === 'suspended' && !document.hidden) ac.resume(); }, true);
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
  // testEar / testSrc (for the tests): an ear and the places, as G3.ear and G3.sndSrc give them in 3D
  return {start, get started(){ return started; }, get state(){ return ac ? ac.state : 'none'; }, LV, tick, at:(q, ref, e) => { const k = EAR; EAR = e; const r = at(q, ref); EAR = k; return r; }, testEar:null, testSrc:null};
})();
