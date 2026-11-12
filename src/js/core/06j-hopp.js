// ---------- Hopp over resten av ruta (HO1, steg 104; docs/planer/hopp.md, Jonas 12.11.2026) ----------
// «Under seiling så dukker det opp en liten knapp i hjørnet som åpen en rute der det står en kostnad for å skippe resten av ruten,
// altså teleportere seg til målet.» The boat is moved at once to the next stop on her route: a harbour, a fishing spot, gear work, an
// anchoring, or the route's end (hopStop). The world's clock does not move, so everything but the time goes as if she had sailed it
// (Jonas: «Ja, med vilkår»): the diesel and the engine hours from a dry run of the sailing minute by minute (hopRun: sailV, the wind
// and the sea where she would be), the trim used for the minutes it would have run, the catch keeping and the hands on deck gutting and
// icing (holdMinute, 05-vessels.js), your energy (hopEnergy, as energyMinute has it) and the crew's fatigue (crewSeaFat, 04-crew.js).
// Nothing earned by sailing is earned by a hop: no sea time (fsMinute), no miles (tatAdd), no badges (achMinute), none of it called.
// It is refused, before it is bought, when the weather on the way is over the Autonav limit or the boat's own risk, with too little
// diesel, on the operations plan, on a trip mission with this boat, or on the first trip. Once paid (HO3), it goes whatever the weather
// (Jonas: «uavhengig av været eller andre ting»). The price is a ladder by the real minutes saved, like tax steps, so the total always
// rises with the time and nobody gains by a detour (Jonas 12.11.2026, A: «75 / 50 / 25 øre»; at least 5 kr, no cap).
const HOP = {steps:[[60, 0.75], [240, 0.50], [Infinity, 0.25]], min:5, maxMin:14 * 1440, mapMs:20000};
// kr for the real minutes saved
function hopPrice(realMin){
  let kr = 0, m0 = 0;
  for (const [m1, r] of HOP.steps){ const m = Math.min(realMin, m1) - m0; if (m <= 0) break; kr += m * r; m0 = m1; }
  return Math.max(HOP.min, Math.round(kr));
}
// the index of the next stop on the route from where she is
function hopStop(pl){
  if (!pl || !pl.wps) return -1;
  for (let i = pl.idx; i < pl.wps.length; i++){ const w = pl.wps[i]; if (wpStop(w) || w.anchor || i === pl.wps.length - 1) return i; }
  return -1;
}
// why a hop cannot be had now, before anything is run (null: it may, the weather and the diesel are the dry run's)
function hopWhy(){
  const b = S.boat, pl = S.plan;
  if (!pl || b.status !== 'sailing' || !(pl.idx < pl.wps.length)) return ['Hopp går bare mens båten seiler en rute.', 'A hop is only possible while the boat sails a route.'];
  if (pl.ops || pl.p2) return ['Driftsplanen styrer båten. Hopp går bare på en rute du har lagt selv.', 'The operations plan runs the boat. A hop is only possible on a route you set yourself.'];
  if (pl.halt) return ['Båten stopper.', 'The boat is stopping.'];
  if (pl.replan) return ['Autonav finner en vei rundt grunt vann. Vent til båten går videre.', 'Autonav is finding a way round shallow water. Wait until the boat goes on.'];
  // the time the game was closed, not yet played in (the world's clock ahead of S.t, ui/08-actions.js CATCH_LEFT): the hop would count
  // minutes the catch-up sails anyway, and the time saved and the price would be too high
  if (WCLOCK.on && worldT() - S.t > 1) return ['Spillet henter fortsatt inn tida det var lukket. Vent litt.', 'The game is still catching up on the time it was closed. Wait a little.'];
  if (b.anch || b.hove) return ['Båten ligger for anker eller ligger bi.', 'The boat is at anchor or lying to.'];
  // a leak is not hopped past: the water rises minute by minute and the pump may not keep up (hullMinute, 16c-hull.js)
  if (b.dmg && (b.dmg.A > 0 || b.dmg.w > 0)) return ['Båten tar inn vann. Hopp går ikke forbi en lekkasje.', 'The boat is taking in water. A hop does not get past a leak.'];
  if (pl.mob || S.mob) return ['Ikke mens noen er i sjøen.', 'Not while someone is in the water.'];
  if (S.ptowH && S.ptowH.st === 'tow') return ['Ikke mens du sleper en annen båt.', 'Not while you tow another boat.'];
  if (S.tut) return ['Ikke på første tur.', 'Not on the first trip.'];
  if (S.turer && (S.turer.act || []).some(m => m.vid === S.cur)) return ['Ikke mens et turoppdrag er i gang med denne båten.', 'Not while a trip mission is under way with this boat.'];
  return null;
}
// The dry run: the rest of the way to the next stop sailed minute by minute as sail() would (sailV for the speed, with the speed limits,
// the braking into the stop and the sea; the trim until it runs out), with the wind and the sea where she is each minute. Nothing in the
// game is changed: the boat's place, way and heading and the route's index are put back. paid: the weather does not stop it (HO3).
// Returns {why, stop, w, min (game minutes), real, kr, fuel (l), trimMin, track (where she is each hour), heading}
function hopRun(paid){
  const b = S.boat, pl = S.plan, iS = hopStop(pl);
  if (iS < 0) return {why:['Ruta har ikke noe mål.', 'The route has no end.']};
  const save = {pos:b.pos, v:b.v, heading:b.heading, idx:pl.idx, speed:pl.speed, dspeed:S.draftSpeed, trim:b.trim}, T = trimOn(b), tEnd = T ? trimUntil(b) : -1;
  const auto = !!(S.settings && S.settings.autoOn), limW = windLim(), limS = seaLim();
  let m = 0, fuel = 0, trimMin = 0, wx = null, why = null, heading = b.heading, ended = false; const track = [];
  try {
    while (pl.idx <= iS){
      if (m >= HOP.maxMin){ why = ['Ruta er for lang til å regne ut her.', 'The route is too long to work out here.']; break; }
      const H = (S.t + m + 1) / 60, W = windAt(H), hs = hsAt(b.pos, H);
      if (m % 60 === 0) track.push({x:b.pos.x, y:b.pos.y});
      if (!wx && (riskLevel(W, hs) > 0 || (auto && (W > limW || hs > limS)))){ wx = {W, hs}; if (!paid) break; }
      // (the trim runs out where it would: trimEnd as vesselStep calls it, the top speed and the route's speed down; put back below)
      if (T && !ended && S.t + m >= tEnd){ trimEnd(); ended = true; }
      if (T && !ended) trimMin++;
      let v; try { v = sailV(H, hs); } catch (e){ v = Math.min(pl.speed || BOAT.vcruise, speedCap(hs)); }
      b.v = v; fuel += fuelLph(v, W) / 60;
      let left = v * NM / 60 * gridScale(b.pos);
      while (left > 1e-9 && pl.idx <= iS){
        const w = pl.wps[pl.idx], d = dist(b.pos, w); if (d > 1e-6) b.heading = Math.atan2(w.x - b.pos.x, -(w.y - b.pos.y));
        if (d <= left){ b.pos = {x:w.x, y:w.y}; left -= d; pl.idx++; } else { b.pos = {x:b.pos.x + (w.x - b.pos.x) / d * left, y:b.pos.y + (w.y - b.pos.y) / d * left}; left = 0; }
      }
      m++;
    }
    heading = b.heading;
  } catch (e){ console.warn('hopRun', e); why = why || ['Turen kunne ikke regnes ut herfra.', 'The trip could not be worked out from here.']; }
  finally { b.pos = save.pos; b.v = save.v; b.heading = save.heading; pl.idx = save.idx;
    if (ended){ b.trim = save.trim; applyVessel(); pl.speed = save.speed; S.draftSpeed = save.dspeed; } }
  if (!why && wx && !paid) why = ['Været på veien er for hardt for et hopp: ' + fmt(wx.W, 0) + ' m/s og ' + fmt(wx.hs, 1) + ' m sjø. Hopp går ikke forbi været.', 'The weather on the way is too hard for a hop: ' + fmt(wx.W, 0) + ' m/s and ' + fmt(wx.hs, 1) + ' m of sea. A hop does not get past the weather.'];
  if (!why && !paid && fuel > (b.fuel || 0)) why = ['For lite diesel til å komme fram: turen bruker ' + Math.ceil(fuel) + ' l, tanken har ' + Math.floor(b.fuel || 0) + ' l.', 'Too little diesel to get there: the trip burns ' + Math.ceil(fuel) + ' l, the tank has ' + Math.floor(b.fuel || 0) + ' l.'];
  if (!why && !paid && m < GAME_RATE) why = ['Båten er nesten fremme.', 'The boat is nearly there.'];
  // (the price on the whole real minutes, as the server works it out: supabase/migrations/20261112200000_hopp.sql hop_price)
  const realMin = Math.max(1, Math.round(m / GAME_RATE));
  return {why, stop:iS, w:pl.wps[iS], min:m, real:m / GAME_RATE, realMin, kr:hopPrice(realMin), fuel, trimMin, track, heading};
}
// the stop of a hop bought (HO3: the purchase keeps {x, y, port}) is the next stop on the route sailed now: the same harbour, or within
// 100 m; else the route has changed since, and the hop waits in Kaiboden
function hopMatch(to){
  const pl = S.plan, iS = hopStop(pl); if (!to || iS < 0) return false;
  const w = pl.wps[iS]; return to.port ? w.port === to.port : dist(w, to) < 0.1;
}
// what a hop from here would cost and save, or why it cannot be had (the price is shown before anything is bought)
function hopQuote(){ const why = hopWhy(); return why ? {why} : hopRun(false); }
// your energy over n minutes (e %, s minutes of sleep left, rate a minute: down at sea, up in a bunk), as energyMinute has it: at nought
// you sleep ENERGY.sleep minutes and wake at ENERGY.wake
function hopEnergy(e, s, n, rate){
  for (let i = 0; i < n; i++){ if (s > 0){ if (--s === 0) e = ENERGY.wake; continue; } e = clamp(e + rate, 0, 100); if (e <= 0) s = ENERGY.sleep; }
  return {e, s};
}
// minutes as «1 t 20 min» (rounded to the whole minute first, so never «60 min»)
function hopSaved(real, en){ const tm = Math.max(1, Math.round(real)), h = Math.floor(tm / 60), m = tm % 60; return (h ? h + (en ? ' h' : ' t') + (m ? ' ' : '') : '') + (m || !h ? m + ' min' : ''); }
// The hop itself, on the dry run q: what the trip would have used and done, and then she is at the stop
function hopDo(q){
  const b = S.boat, pl = S.plan, n = q.min, T0 = S.t, p0 = b.pos;
  fuelUse(b, q.fuel);
  b.engH = (b.engH || 0) + n / 60;
  if (q.trimMin && b.trim) b.trim.until = trimUntil(b) - q.trimMin;   // (run out: vesselStep ends it and says so)
  // Skippertak is used for the minutes as the trim is: while it holds, you and the crew stay rested (energyMinute, crewTick)
  let skipM = 0; if (skipOn()){ skipM = Math.min(n, S.skip.until - S.t); S.skip.until -= skipM; }
  // the crew: the minutes each works (the helm, the galley, the deck: workAssign, 13-work.js, as workMinute counts them in c.wk), and
  // at each whole hour of the clock their fatigue for it as crewTick counts it (Skippertak holds it at nought)
  // (no c.wk yet: crewTick counts the hour as worked, and so does this until the first hour is counted or a minute worked)
  const crew = crewAboard(), worked = new Map(crew.map(c => [c, Object.values(c.wk || {}).reduce((a, x) => a + x, 0)])), wkSeen = new Set(crew.filter(c => c.wk));
  // each minute where she would have been: the catch, the provisions, the crew's fatigue; each hour the trip's hours at sea, the
  // autoline's hooks and the live snow crab in the tanks (vesselStep and step, minute and hour)
  try {
    for (let m = 0; m < n; m++){
      const t = T0 + m + 1, H = t / 60, p = q.track[Math.min(q.track.length - 1, Math.floor(m / 60))] || p0, hr = gDate(H).getUTCHours(), night = hr >= 22 || hr < 6;
      b.pos = p; holdMinute(H, p); provMinute();
      if (crew.length){ const A = workAssign(); for (const c of crew) if (A.some(x => x.c === c && WORK_ALL.includes(x.st))){ worked.set(c, worked.get(c) + 1); wkSeen.add(c); } }
      if (t % 60 === 0){ autoFixHour(); tripHour(); if (BOAT.tank) snoTankHour(H);
        for (const c of crew){ c.fatigue = m < skipM ? 0 : clamp((c.fatigue || 0) + crewSeaFat(c, false, wkSeen.has(c) ? clamp(worked.get(c) / 60, 0, 1) : 1, night), 0, 100); worked.set(c, 0); c.wk = {}; wkSeen.add(c); } }
    }
  } finally { b.pos = p0; }
  for (const c of crew){ const w = worked.get(c); c.wk = w > 0 ? {hop:w} : {}; }   // (the hour begun: the next crewTick counts it, as after sailing in)
  // you, if you are aboard: rested through the Skippertak minutes, then down at sea or up in a bunk, asleep at nought
  if (meAboard() && !energyOff() && n > skipM){
    const bunk = typeof resting === 'function' && resting(), was = !!S.sleep, r = hopEnergy(skipM ? 100 : (S.energy == null ? 100 : S.energy), S.sleep && !skipM ? Math.max(0, S.sleep.until - S.t) : 0, n - skipM, bunk ? restRate(b) : -ENERGY.sea);
    S.energy = r.e;
    if (r.s > 0){ const v = myVessel(), lag = !crewAboard().length && typeof lagOf === 'function' && lagOf();
      S.sleep = Object.assign(S.sleep || {v:v ? v.id : S.cur, alone:!crewAboard().length && !lag}, {t0:S.t - (ENERGY.sleep - r.s), until:S.t + r.s});
      if (!was){ if (S.equip && S.equip.brovakt) S.sleep.alarmAt = S.sleep.t0 + BNWAS.after; log('Du sovnet av utmattelse underveis.', 'You fell asleep from exhaustion on the way.'); } }
    else if (S.sleep) S.sleep = null;
  } else if (skipM && meAboard()) S.energy = 100;
  // there: the points passed go into the track (the way home and the chart read it, as arrive does each one), then the stop
  for (let i = pl.idx; i < q.stop; i++){ const w = pl.wps[i]; S.trail.push({x:w.x, y:w.y, port:w.port || null}); }
  const w = pl.wps[q.stop], pt = w.port && portById(w.port), to = pt ? pt.name : null;
  b.pos = {x:w.x, y:w.y}; b.heading = q.heading; b.v = 0; pl.idx = q.stop;
  log('Hoppet ' + (to ? 'til ' + to : 'til neste stopp på ruta') + '. Spart ' + hopSaved(q.real) + '.', 'Hopped ' + (to ? 'to ' + to : 'to the next stop on the route') + '. Saved ' + hopSaved(q.real, true) + '.', 'nav');
  arrive(w);
  return true;
}
// a hop now: the map at the stop first (a block not in is an error, not a value; a fetch that hangs is given up after HOP.mapMs), then
// the one dry run on the world as it is by then
async function hopGo(paid){
  let why = hopWhy(); if (why) return {why};
  const pl = S.plan, iS = hopStop(pl); if (iS < 0) return {why:['Ruta har ikke noe mål.', 'The route has no end.']};
  const w = pl.wps[iS];
  try { if (typeof mapNeed === 'function') await Promise.race([mapNeed({x:w.x, y:w.y}, MAPD.simR), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), HOP.mapMs))]); }
  catch (e){ console.warn('hopGo map', e); return {why:['Kartet ved målet kom ikke. Prøv igjen om litt.', 'The chart at the stop did not come. Try again in a little while.'], map:true}; }
  why = hopWhy(); if (why) return {why};
  const q = hopRun(!!paid); if (q.why) return q;
  hopDo(q); return q;
}
