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
const HOP = {steps:[[60, 0.75], [240, 0.50], [Infinity, 0.25]], min:5, maxMin:14 * 1440};
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
  if (pl.halt || pl.replan) return ['Båten stopper eller finner en vei rundt. Vent til hun går videre.', 'The boat is stopping or finding a way round. Wait until she goes on.'];
  if (b.anch || b.hove) return ['Båten ligger for anker eller ligger bi.', 'The boat is at anchor or lying to.'];
  if (typeof helmOn === 'function' && helmOn()) return ['Du har roret selv.', 'You have the helm.'];
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
  const save = {pos:b.pos, v:b.v, heading:b.heading, idx:pl.idx}, T = trimOn(b), tEnd = T ? trimUntil(b) : -1;
  const auto = !!(S.settings && S.settings.autoOn), limW = windLim(), limS = seaLim();
  let m = 0, fuel = 0, trimMin = 0, wx = null, why = null, heading = b.heading; const track = [];
  try {
    while (pl.idx <= iS){
      if (m >= HOP.maxMin){ why = ['Ruta er for lang til å regne ut her.', 'The route is too long to work out here.']; break; }
      const H = (S.t + m + 1) / 60, W = windAt(H), hs = hsAt(b.pos, H);
      if (m % 60 === 0) track.push({x:b.pos.x, y:b.pos.y});
      if (!wx && (riskLevel(W, hs) > 0 || (auto && (W > limW || hs > limS)))){ wx = {W, hs}; if (!paid) break; }
      let v; try { v = sailV(H, hs); } catch (e){ v = Math.min(pl.speed || BOAT.vcruise, speedCap(hs)); }
      const trimmed = T && S.t + m < tEnd; if (T && !trimmed) v = Math.min(v, speedCap(hs) / T.x);
      if (trimmed) trimMin++;
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
  finally { b.pos = save.pos; b.v = save.v; b.heading = save.heading; pl.idx = save.idx; }
  if (!why && wx && !paid) why = ['Været på veien er for hardt for et hopp: ' + fmt(wx.W, 0) + ' m/s og ' + fmt(wx.hs, 1) + ' m sjø. Hopp går ikke forbi været.', 'The weather on the way is too hard for a hop: ' + fmt(wx.W, 0) + ' m/s and ' + fmt(wx.hs, 1) + ' m of sea. A hop does not get past the weather.'];
  if (!why && !paid && fuel > (b.fuel || 0)) why = ['For lite diesel til å komme fram: turen bruker ' + Math.ceil(fuel) + ' l, tanken har ' + Math.floor(b.fuel || 0) + ' l.', 'Too little diesel to get there: the trip burns ' + Math.ceil(fuel) + ' l, the tank has ' + Math.floor(b.fuel || 0) + ' l.'];
  if (!why && !paid && m < GAME_RATE) why = ['Båten er nesten fremme.', 'The boat is nearly there.'];
  return {why, stop:iS, w:pl.wps[iS], min:m, real:m / GAME_RATE, kr:hopPrice(m / GAME_RATE), fuel, trimMin, track, heading};
}
// what a hop from here would cost and save, or why it cannot be had (the price is shown before anything is bought)
function hopQuote(){ const why = hopWhy(); return why ? {why} : hopRun(false); }
// your energy over n minutes (e %, s minutes of sleep left, rate a minute: down at sea, up in a bunk), as energyMinute has it: at nought
// you sleep ENERGY.sleep minutes and wake at ENERGY.wake
function hopEnergy(e, s, n, rate){
  for (let i = 0; i < n; i++){ if (s > 0){ if (--s === 0) e = ENERGY.wake; continue; } e = clamp(e + rate, 0, 100); if (e <= 0) s = ENERGY.sleep; }
  return {e, s};
}
// The hop itself, on the dry run q: what the trip would have used and done, and then she is at the stop
function hopDo(q){
  const b = S.boat, pl = S.plan, n = q.min, H0 = S.t / 60;
  fuelUse(b, q.fuel);
  b.engH = (b.engH || 0) + n / 60;
  if (q.trimMin && b.trim) b.trim.until = trimUntil(b) - q.trimMin;   // (run out: vesselStep ends it and says so)
  // the catch, each minute where she would have been
  for (let m = 0; m < n; m++) holdMinute(H0 + (m + 1) / 60, q.track[Math.min(q.track.length - 1, Math.floor(m / 60))] || b.pos);
  // you, if you are aboard, and the crew aboard (no sea hours to their experience: that is earned by sailing)
  if (meAboard() && !energyOff() && !skipOn()){
    const bunk = typeof resting === 'function' && resting(), r = hopEnergy(S.energy == null ? 100 : S.energy, S.sleep ? Math.max(0, S.sleep.until - S.t) : 0, n, bunk ? restRate(b) : -ENERGY.sea);
    S.energy = r.e;
    if (r.s > 0){ const v = myVessel(); S.sleep = Object.assign(S.sleep || {v:v ? v.id : S.cur, alone:!crewAboard().length}, {t0:S.t - (ENERGY.sleep - r.s), until:S.t + r.s}); }
    else if (S.sleep) S.sleep = null;
  }
  if (!skipOn()) for (const c of crewAboard()){
    let f = 0; for (let h = 0; h < n / 60; h++){ const hr = gDate(H0 + h).getUTCHours(); f += crewSeaFat(c, false, 0, hr >= 22 || hr < 6) * Math.min(1, n / 60 - h); }
    c.fatigue = clamp((c.fatigue || 0) + f, 0, 100);
  }
  // there
  const w = pl.wps[q.stop], pt = w.port && portById(w.port), hh = Math.floor(q.real / 60), mm = Math.round(q.real % 60);
  const saved = (hh ? hh + ' t ' : '') + mm + ' min', to = pt ? pt.name : null;
  b.pos = {x:w.x, y:w.y}; b.heading = q.heading; b.v = 0; pl.idx = q.stop;
  log('Hoppet ' + (to ? 'til ' + to : 'til neste stopp på ruta') + '. Spart ' + saved + '.', 'Hopped ' + (to ? 'to ' + to : 'to the next stop on the route') + '. Saved ' + saved.replace(' t ', ' h ') + '.', 'nav');
  arrive(w);
  return true;
}
// a hop now: the map at the stop first (a block not in is an error, not a value), then the dry run again on the world as it is by then
async function hopGo(paid){
  let q = hopWhy() ? {why:hopWhy()} : hopRun(!!paid); if (q.why) return q;
  try { if (typeof mapNeed === 'function') await mapNeed({x:q.w.x, y:q.w.y}, MAPD.simR); } catch (e){ console.warn('hopGo map', e); }
  q = hopWhy() ? {why:hopWhy()} : hopRun(!!paid); if (q.why) return q;
  hopDo(q); return q;
}
