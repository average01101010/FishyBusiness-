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
//   music    quiet ambient chords and a bell now and then, made as it plays (below; its own volume, S.settings.music)
// The volume and on or off are in the phone's settings (S.settings.vol, 0 to 1; S.settings.sound false is off).
// Where you hear it from (the user's wish 03.10.2026): in 3D the ear is the camera (G3.ear), and what has a place (your boat's engine,
// wash, hauler, reel and slaps, the gulls round her, the plant's crane, forklift and ice chute, the pump, the three nearest boats of
// the fleet; G3.sndSrc) is fainter with the distance, (ref / d)^0.9 from ref metres out, duller (a lower low-pass) and to the left or
// right as it lies from the camera. The wind, the rain and the sea round you are where the camera is, fading as it rises (gone well up
// in the air, where only the music is left). The bridge watch alarm is never under
// half. In the 2D chart the ear is aboard, as before.
const SNDREF = {eng:12, wash:10, haul:5, reel:4, slap:8, gull:12, crane:18, beep:20, chute:15, pump:6, alarm:8, npc:12, npcBig:30, air:350};
const SND = (() => {
  let ac = null, master = null, L = null, started = false, lastIce = null, craneT = 0, beepT = 0, alarmT = 0, EAR = null, semiT = 0;
  const FIRES = [];   // the semi-diesel's firings ahead, as performance.now() times (the 3D view puffs black smoke at each)
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
  // The semi-diesel (VESSELS semi, the old wooden boat; Jonas 05.10.2026, from his video of a 1973 Sabb G at low revs): one firing
  // every two revolutions, 0.35 s apart at 340 rpm and 0.14 s at the most, 850 rpm (VESSELS rpm); each a low boom falling from 62 to 42 Hz with its
  // overtone near 75 Hz, the diesel knock (300-1200 Hz) and a short crack from the exhaust, and the softer clack of the valve gear;
  // harder as the throttle opens and the engine takes load
  // 0.37 of a cycle later (the video's 0.13 s of 0.35). Scheduled ahead from the tick, a little uneven, as old engines are.
  function thump(t, T, a, frac){
    const out = oneOut(a.pan), k = (0.85 + Math.random() * 0.3) * a.g * (0.8 + 0.4 * frac), f = filt('lowpass', (900 + 900 * frac) * a.lp, 0.7), g = gain(0, out); f.connect(g);
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); o.connect(f);
    const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.setValueAtTime(80, t); o2.frequency.exponentialRampToValueAtTime(70, t + 0.1); const g2 = gain(0.35, f); o2.connect(g2);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.34 * k, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24); o.start(t); o2.start(t); o.stop(t + 0.26); o2.stop(t + 0.26);
    const nz = (buf, type, fq, q, peak, att, dur, at) => { const s = ac.createBufferSource(); s.buffer = buf; const x = filt(type, fq, q), gg = gain(0, out); s.connect(x); x.connect(gg);
      gg.gain.setValueAtTime(0, at); gg.gain.linearRampToValueAtTime(peak, at + att); gg.gain.exponentialRampToValueAtTime(0.0005, at + dur); s.start(at, Math.random() * 1.5); s.stop(at + dur + 0.02); };
    nz(PINK, 'bandpass', 650, 0.8, 0.17 * k, 0.004, 0.07, t);                         // the knock
    nz(WHITE, 'bandpass', 2200, 1.2, 0.05 * k * (0.6 + frac), 0.002, 0.025, t);        // the crack from the exhaust
    nz(PINK, 'bandpass', 950, 1.1, 0.07 * k, 0.003, 0.035, t + 0.37 * T);             // the valve gear's clack
    FIRES.push({at:performance.now() + (t - ac.currentTime) * 1000, frac}); if (FIRES.length > 24) FIRES.shift();
  }
  // the forklift reversing: three to six beeps
  function beeps(a){
    const t0 = ac.currentTime, n = 3 + Math.floor(Math.random() * 4), g = gain(0, oneOut(a.pan)), o = osc('square', 1040); o.connect(g);
    for (let i = 0; i < n; i++){ const t = t0 + i * 0.9; g.gain.setValueAtTime(0.025 * a.g, t); g.gain.setValueAtTime(0, t + 0.45); }
    o.stop(t0 + n * 0.9);
  }
  // ---------- the music (Jonas 05.10.2026: «rolig ambient instrumentaler som svak stemning i bakgrunnen. Må kunne skrus av i innstillinger») ----------
  // Made here as it plays and never quite the same: slow chords of soft pads in D (dorian by day, aeolian at night) over a low drone,
  // and now and then a few notes on a soft bell from the chord, through a long echo and a made-up room. Darker at night and when the
  // weather is bad, sparser in a storm. Its own volume in the settings (S.settings.music, 0 off to 1; it never gets loud) and its own way
  // out, so it plays with the sound effects off too.
  const musVol = () => S.settings.music == null ? 0.35 : S.settings.music;
  const MUS = {bus:null, out:null, bells:null, next:0, nextBell:0, ci:0, night:false, chord:null};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // the chords (MIDI notes, the drone first): by day Dm9, G6, Cmaj7, Am7, Dm9, Fmaj7, G6, Am7; at night Dm9, Bbmaj7, Fmaj7, Am7, Dm, Gm7, Bbmaj7, C
  const CH_DAY = [[38, 50, 57, 60, 64, 65], [43, 55, 59, 62, 64], [36, 48, 55, 59, 64], [45, 57, 60, 64, 67], [38, 50, 57, 60, 64, 65], [41, 53, 57, 60, 64], [43, 55, 59, 62, 64], [45, 57, 60, 64, 67]];
  const CH_NIGHT = [[38, 50, 57, 60, 64, 65], [46, 50, 57, 62, 65], [41, 53, 57, 60, 64], [45, 57, 60, 64, 67], [38, 50, 53, 57, 62], [43, 50, 55, 58, 65], [46, 50, 57, 62, 65], [36, 48, 55, 60, 64]];
  function musBuild(){
    const out = gain(0, ac.destination), bus = gain(1, out), bells = gain(1, out);
    // a made-up room: four seconds of noise dying away, a little different in each ear
    const n = Math.floor(ac.sampleRate * 4), ir = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
    const room = ac.createConvolver(); room.buffer = ir; const wet = gain(0.55, out); room.connect(wet); bus.connect(room); bells.connect(room);
    // a long echo on the bells, duller each time round
    const dl = ac.createDelay(2), fb = gain(0.38), lp = filt('lowpass', 1800, 0.5), dw = gain(0.4, out); dl.delayTime.value = 0.62; bells.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(dw);
    Object.assign(MUS, {out, bus, bells});
  }
  function padNote(m, t, d, lvl, cut){
    const f = mtof(m), g = gain(0), lp = filt('lowpass', cut, 0.4); lp.connect(g); g.connect(MUS.bus);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + d * 0.38); g.gain.setValueAtTime(lvl, t + d * 0.62); g.gain.linearRampToValueAtTime(0, t + d);
    for (const [type, det, a] of [['sine', 0, 1], ['triangle', 7, 0.3], ['sine', -5, 0.55]]){ const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det + (Math.random() - 0.5) * 4; o.connect(gain(a, lp)); o.start(t); o.stop(t + d + 0.1); }
  }
  function bellNote(m, t, lvl){
    const f = mtof(m), g = gain(0, MUS.bells); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0004, t + 4.5);
    for (const [k, a, len] of [[1, 1, 4.5], [2.005, 0.22, 2.2], [3.01, 0.06, 0.9]]){ const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * k; const og = gain(a, g); og.gain.setValueAtTime(a, t); og.gain.exponentialRampToValueAtTime(0.001, t + len); o.connect(og); o.start(t); o.stop(t + len + 0.05); }
  }
  function musTick(){
    const v = musVol(); if (!v && !MUS.out) return;
    if (!MUS.out) musBuild();
    const now = ac.currentTime, H = S.t / 60, sun = typeof sunAt === 'function' ? sunAt(H).el : 10, wind = typeof windAt === 'function' ? windAt(H) : 5;
    const storm = clamp((wind - 11) / 9, 0, 1), dark = sun < -3 ? 1 : sun < 4 ? (4 - sun) / 7 : 0;
    MUS.out.gain.setTargetAtTime(v * 0.2 * (1 - 0.35 * storm), now, 1.5); LV.music = v * 0.2 * (1 - 0.35 * storm);
    if (!v) return;
    if (now + 0.5 >= MUS.next){
      MUS.night = dark > 0.5; const list = MUS.night ? CH_NIGHT : CH_DAY; MUS.ci = (MUS.ci + (Math.random() < 0.15 ? 2 : 1)) % list.length;
      const ch = list[MUS.ci], t = Math.max(now + 0.1, MUS.next), d = 19 + Math.random() * 6, cut = 1150 - 520 * dark - 300 * storm; MUS.chord = ch;
      ch.forEach((m, i) => padNote(m, t, d, i === 0 ? 0.05 : 0.026 * (i > 3 ? 0.8 : 1), i === 0 ? 300 : cut));
      MUS.next = t + d * 0.7;
    }
    if (now >= MUS.nextBell && MUS.chord){
      // a short phrase of one to three notes from the chord, an octave or two up, less often in a storm
      const ch = MUS.chord.slice(1), k = 1 + Math.floor(Math.random() * 3); let t = now + 0.05;
      for (let i = 0; i < k; i++){ const m = ch[Math.floor(Math.random() * ch.length)] + (Math.random() < 0.6 ? 12 : 24); bellNote(m, t, 0.05 + Math.random() * 0.03); t += 0.5 + Math.random() * 0.9; }
      MUS.nextBell = now + (5 + Math.random() * 9) * (1 + 2 * storm);
    }
  }
  function tick(){
    if (!ac || ac.state !== 'running') return;
    musTick();
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
    const semi = !!BOAT.semi; LV.semi = semi ? 1 : 0;
    set('eng', run && !semi ? (dsl ? 0.13 + 0.12 * frac : 0.08 + 0.17 * frac) * aB.g : 0, 0.4); place('eng', aB);
    if (semi) LV.eng = run ? 0.34 * (0.8 + 0.4 * frac) * aB.g : 0;   // the semi-diesel is its thumps (harder under load); its level is theirs
    if (semi && run && aB.g > 0.001){
      const R = BOAT.rpm || [340, 850], T = 120 / (R[0] + frac * (R[1] - R[0])); LV.semiT = T;
      if (semiT < now) semiT = now + 0.03;
      while (semiT < now + 0.25){ thump(semiT, T, aB, frac); semiT += T * (0.96 + Math.random() * 0.08); }
    } else semiT = 0;
    // the sea round you, and the wash along her hull from where she is; the wind, the rain
    // (the sea, the wind and the rain are round the ear when it is down by the water; up in the air they die away with the camera's
    // height, so far up only the music is left: Jonas 05.10.2026, «Det burde være nesten helt stille når jeg zoomer så langt unna»)
    const hF = ref => EAR ? Math.min(1, Math.pow(ref / Math.max(ref, EAR.y - 2), 1.4)) : 1; LV.hSea = hF(15);
    const aW = at(boat, SNDREF.wash);
    set('sea', (atSea ? (0.03 + Math.min(0.12, hs * 0.06)) * hF(15) + Math.min(0.2, v * 0.011) * aW.g : 0.012 * hF(15)), 0.4); L.sea.f.frequency.setTargetAtTime(500 + v * 45 * aW.lp + hs * 120, now, 0.5);
    set('wind', Math.pow(clamp((W - 2.5) / 22, 0, 1), 1.3) * (atSea ? 0.28 : 0.14) * hF(40), 0.6); L.wind.f.frequency.setTargetAtTime(450 + W * 30 + Math.random() * 300, now, 0.8);
    set('rain', rain > 0.15 && !snow ? (rain - 0.15) * 0.16 * hF(25) : 0, 1);
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
    if (started || (!vol() && !musVol())) return;
    try { build(); started = true; setInterval(tick, 100); } catch (e){ console.warn('sound', e); }
  }
  // the first touch starts it; a hidden page is silent
  document.addEventListener('pointerdown', () => { if (!started) start(); else if (ac && ac.state === 'suspended' && !document.hidden) ac.resume(); }, true);
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });
  // testEar / testSrc (for the tests): an ear and the places, as G3.ear and G3.sndSrc give them in 3D
  return {start, FIRES, MUS, get started(){ return started; }, get state(){ return ac ? ac.state : 'none'; }, LV, tick, at:(q, ref, e) => { const k = EAR; EAR = e; const r = at(q, ref); EAR = k; return r; }, testEar:null, testSrc:null};
})();
