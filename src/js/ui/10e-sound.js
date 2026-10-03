// ===== SOUND (the user's wish 03.10.2026) =====
// Made in the browser with Web Audio, nothing recorded: it starts at the first touch (the browsers allow no sound before one) and
// follows what the boat does and where she is, every 100 ms:
//   engine   two oscillators at the firing rate from the speed (an outboard revs high; a diesel low, with the chug of its strokes),
//            through a low-pass that opens with the load; idling when she lies still at sea, off in port, adrift or aground
//   sea      the wash along the hull (pink noise, louder and brighter with speed and waves) and slaps on the hull now and then
//   weather  the wind in band-passed noise that wanders with the gusts; rain (or the softer hiss of snow)
//   gulls    a cry now and then round the boat, often while the catch is gutted
//   harbour  while the catch is landed the crane's whine and the forklift's reversing beeps; the pump while she is fuelled; the ice
//            chute's rumble when ice comes aboard
//   fishing  the hauler's hydraulic whine while gear is hauled; the jigging reel now and then while fishing
// The volume and on or off are in the phone's settings (S.settings.vol, 0 to 1; S.settings.sound false is off).
const SND = (() => {
  let ac = null, master = null, L = null, started = false, lastIce = null, craneT = 0, beepT = 0, alarmT = 0;
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
  let PINK, WHITE;
  function build(){
    ac = new (window.AudioContext || window.webkitAudioContext)(); master = gain(0, ac.destination); PINK = noise(3, true); WHITE = noise(2, false); L = {};
    // the engine: a saw at the firing rate and a square an octave down, a ripple at the rate of the revolutions, through a low-pass
    { const g = gain(0, master), f = filt('lowpass', 400, 2.5), am = gain(0.7, f), o1 = osc('sawtooth', 60), o2 = osc('square', 30), g2 = gain(0.35, am), lfo = osc('sine', 12), lg = gain(0.3);
      f.connect(g); o1.connect(am); o2.connect(g2); lfo.connect(lg); lg.connect(am.gain); L.eng = {g, f, o1, o2, lfo, lg}; }
    // the wash and the sea round her
    { const g = gain(0, master), f = filt('lowpass', 800, 0.7); loop(PINK).connect(f); f.connect(g); L.sea = {g, f}; }
    // the wind
    { const g = gain(0, master), f = filt('bandpass', 700, 0.9); loop(PINK).connect(f); f.connect(g); L.wind = {g, f}; }
    // rain or snow
    { const g = gain(0, master), f = filt('highpass', 2500, 0.5); loop(WHITE).connect(f); f.connect(g); L.rain = {g, f}; }
    // the hydraulics (the hauler), the crane's motor and the fuel pump: hums through band-passes
    for (const [k, type, fr, bp, q] of [['haul', 'sawtooth', 165, 520, 3], ['crane', 'sawtooth', 118, 380, 2], ['pump', 'triangle', 50, 120, 1.5], ['reel', 'sawtooth', 340, 900, 4]]){
      const g = gain(0, master), f = filt('bandpass', bp, q), o = osc(type, fr), wob = osc('sine', k === 'reel' ? 13 : 0.7), wg = gain(fr * 0.02); wob.connect(wg); wg.connect(o.frequency); o.connect(f); f.connect(g); L[k] = {g, o};
    }
  }
  const set = (k, v, tc) => { LV[k] = v; L[k].g.gain.setTargetAtTime(v, ac.currentTime, tc || 0.25); };
  // a burst of noise through a filter, with an attack and a decay (a slap, the chute)
  function burst(type, f, q, peak, dur, att){
    const s = ac.createBufferSource(); s.buffer = PINK; const x = filt(type, f, q), g = gain(0, master), t = ac.currentTime;
    s.connect(x); x.connect(g); g.gain.linearRampToValueAtTime(peak, t + (att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.start(t, Math.random() * 2); s.stop(t + dur + 0.05);
  }
  // a gull's cry: a falling, then rising and falling squeal, two or three calls
  function gull(near){
    const t0 = ac.currentTime, n = 1 + Math.floor(Math.random() * 3), base = 1400 + Math.random() * 500, g = gain(0, master), f = filt('bandpass', 2200, 1.2), o = osc('sawtooth', base);
    o.connect(f); f.connect(g);
    for (let i = 0; i < n; i++){ const t = t0 + i * 0.32; o.frequency.setValueAtTime(base * 1.25, t); o.frequency.exponentialRampToValueAtTime(base * 0.7, t + 0.22);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05 * near, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.26); }
    o.stop(t0 + n * 0.32 + 0.1);
  }
  // the forklift reversing: three to six beeps
  function beeps(){
    const t0 = ac.currentTime, n = 3 + Math.floor(Math.random() * 4), g = gain(0, master), o = osc('square', 1040); o.connect(g);
    for (let i = 0; i < n; i++){ const t = t0 + i * 0.9; g.gain.setValueAtTime(0.025, t); g.gain.setValueAtTime(0, t + 0.45); }
    o.stop(t0 + n * 0.9);
  }
  function tick(){
    if (!ac || ac.state !== 'running') return;
    const b = S.boat, H = S.t / 60, p3 = typeof G3 !== 'undefined' && G3.isActive(), mv = vol() * (p3 ? 1 : 0.6);
    master.gain.setTargetAtTime(mv, ac.currentTime, 0.3); LV.master = mv; if (!mv) return;
    // the bridge watch alarm: a shrill beep twice a second until it is acknowledged
    LV.alarm = typeof alarmOn === 'function' && alarmOn() ? 1 : 0;
    if (LV.alarm && ac.currentTime > alarmT){ const t = Math.max(ac.currentTime, alarmT), g = gain(0, master), o = osc('square', 2900); o.connect(g);
      g.gain.setValueAtTime(0.09, t); g.gain.setValueAtTime(0, t + 0.22); o.stop(t + 0.25); alarmT = t + 0.5; }
    const atSea = !['port', 'unmooring'].includes(b.status), v = b.status === 'sailing' || b.gop ? (b.v || 0) : 0, frac = clamp(v / Math.max(1, BOAT.vmax), 0, 1);
    const W = windAt(H), hs = atSea ? hsAt(b.pos, H) : 0.1, rain = precipAt(H), snow = airTemp(H) < 1;
    // the engine
    const run = ['sailing', 'unmooring', 'fishing', 'idle'].includes(b.status) || !!b.gop, dsl = !!BOAT.diesel || !BOAT.planing;
    const rpm = dsl ? 650 + frac * 1500 : 900 + Math.pow(frac, 0.85) * 5100, fire = rpm / 60 * (dsl ? 3 : 2), E = L.eng, now = ac.currentTime;
    E.o1.frequency.setTargetAtTime(fire, now, 0.3); E.o2.frequency.setTargetAtTime(fire / 2, now, 0.3); E.lfo.frequency.setTargetAtTime(rpm / 60, now, 0.3);
    E.lg.gain.setTargetAtTime(dsl ? 0.45 : 0.15, now, 0.5); E.f.frequency.setTargetAtTime(220 + 1300 * frac + (dsl ? 0 : 300), now, 0.3);
    set('eng', run ? (dsl ? 0.13 + 0.12 * frac : 0.08 + 0.17 * frac) : 0, 0.4);
    // the sea, the wind, the rain
    set('sea', (atSea ? 0.03 + Math.min(0.2, v * 0.011) + Math.min(0.12, hs * 0.06) : 0.012), 0.4); L.sea.f.frequency.setTargetAtTime(500 + v * 45 + hs * 120, now, 0.5);
    set('wind', Math.pow(clamp((W - 2.5) / 22, 0, 1), 1.3) * (atSea ? 0.28 : 0.14), 0.6); L.wind.f.frequency.setTargetAtTime(450 + W * 30 + Math.random() * 300, now, 0.8);
    set('rain', rain > 0.15 ? (rain - 0.15) * (snow ? 0.05 : 0.16) : 0, 1);
    // hull slaps at sea, more in a sea and under way
    if (atSea && Math.random() < 0.01 + Math.min(0.06, hs * 0.03 + v * 0.002)) burst('lowpass', 180 + Math.random() * 160, 1, 0.08 + Math.min(0.25, hs * 0.1 + v * 0.008) * Math.random(), 0.35, 0.006);
    // gulls: now and then, often while the catch is gutted (the offal)
    const gut = atSea && S.hold && S.hold.some(x => !x.gut) && typeof catchGut === 'function' && catchGut();
    if (Math.random() < (gut ? 0.05 : b.status === 'port' ? 0.012 : atSea && v < 12 ? 0.006 : 0.002)) gull(0.5 + Math.random() * 0.5);
    // the harbour: the crane and the forklift while landing, the pump, the ice chute
    const land = b.status === 'port' && b.land;
    if (land){ if (now > craneT){ craneT = now + 4 + Math.random() * 6; L.crane.on = !L.crane.on; } } else L.crane.on = false;
    set('crane', L.crane.on ? 0.06 : 0, 0.3);
    if (land && now > beepT && Math.random() < 0.05){ beepT = now + 8; beeps(); }
    const f = b.fueling; set('pump', f && S.t >= f.pumpAt ? 0.09 : 0, 0.4);
    if (lastIce != null && b.ice > lastIce + 5 && b.status === 'port') burst('bandpass', 320, 0.6, 0.18, 3.5, 0.4);
    lastIce = b.ice;
    // the hauler, the reel
    set('haul', b.gop && b.gop.op === 'haul' ? 0.07 : b.gop ? 0.025 : 0, 0.3);
    if (b.status === 'fishing' && !b.gop && Math.random() < 0.02) L.reel.until = now + 2 + Math.random() * 2;
    set('reel', b.status === 'fishing' && L.reel.until > now ? 0.03 : 0, 0.15);
  }
  function start(){
    if (started || !vol()) return;
    try { build(); started = true; setInterval(tick, 100); } catch (e){ console.warn('sound', e); }
  }
  // the first touch starts it; a hidden page is silent
  document.addEventListener('pointerdown', () => { if (!started) start(); else if (ac && ac.state === 'suspended' && !document.hidden) ac.resume(); }, true);
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
  return {start, get started(){ return started; }, get state(){ return ac ? ac.state : 'none'; }, LV, tick};
})();
