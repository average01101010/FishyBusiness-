// ---------- Hopp over resten av ruta (HO1, steg 104; docs/planer/hopp.md, Jonas 12.11.2026) ----------
// «Under seiling så dukker det opp en liten knapp i hjørnet som åpen en rute der det står en kostnad for å skippe resten av ruten,
// altså teleportere seg til målet.» The boat is moved at once to the next stop on her route: a harbour, a fishing spot, gear work, an
// anchoring, or the route's end (hopStop). The world's clock does not move, and the time that is gone touches nothing but the catch in
// the hold (Jonas 12.11.2026: «Det eneste som taper seg med tiden som forsvinner er kvaliteten på fisken i lasterommet»): the fish and
// the ice go minute by minute as they would have (holdMinute, 05-vessels.js; the live snow crab in the tanks, snoTankHour); the diesel,
// the engine hours, the trim, Skippertak, your energy, the crew and the provisions are as they were. The minutes come from a dry run of
// the sailing (hopRun: sailV, the wind and the sea where she would be, the trim while it lasts), so the price is for the time it saves.
// Nothing earned by sailing is earned by a hop: no sea time (fsMinute), no miles (tatAdd), no badges (achMinute), none of it called.
// Nothing stops a purchase but a route not under way (Jonas 12.11.2026: «Ingenting skal være en hindring for å kjøpe "hopp". Det er
// dårlig business.»; «For at et hopp skal kunne kjøpes og brukes må en rute mellom A og B være startet»): not the weather, the diesel,
// an anchor, a leak, a tow, the first trip or a trip mission. The price is a ladder by the real minutes saved, like tax steps, so the
// total always rises with the time and nobody gains by a detour (Jonas 12.11.2026, A: «75 / 50 / 25 øre»; at least 5 kr, no cap).
const HOP = {steps:[[60, 0.75], [240, 0.50], [Infinity, 0.25]], min:5, maxMin:14 * 1440, mapMs:20000, holdReal:35};
// The hold (HO3, Jonas 12.11.2026: «Når brukeren trykker på hopp-knappen stopper båten momentant som om den var fryst i tiden, det løser
// problemet», and «Når spilleren har kommet fram til endepunktet av ruten ved hjelp av hoppet er tjenesten levert og spilleren skal ikke
// ha noe "hopp" tilgode»): the fast-forward button stops the boat where she is, with no way on, no diesel, no weather turning her and no
// engine trouble (vesselStep, dynCan), so the price and the stop on the card stay what the payment pays for, also while the page is at
// Stripe and the time away is played in. The world's clock goes on; the catch aboard, the crew and you go on as on a boat lying still.
// It ends with the hop, when the card is closed with no purchase, when the purchase is cancelled at Stripe, when the route is changed,
// or after HOP.holdReal real minutes (Stripe's checkout runs out after 30, shop-checkout expires_at, so no payment comes after it).
// b.hopHold = {t0, until (game minutes), to:{x, y, port} the stop}
function hopHoldOn(){ const b = S.boat, pl = S.plan, iS = hopStop(pl); if (!pl || b.status !== 'sailing' || iS < 0) return null; const w = pl.wps[iS];
  b.hopHold = {t0:S.t, until:S.t + HOP.holdReal * GAME_RATE, to:{x:w.x, y:w.y, port:w.port || null}}; b.v = 0; return b.hopHold; }
function hopHoldOff(){ if (S.boat) S.boat.hopHold = null; }
// she is held now (an end passed, a route changed or ended, or she not sailing: the hold is gone)
function hopHeld(b){ const h = b && b.hopHold; if (!h) return false;
  if (S.t >= h.until || b.status !== 'sailing' || b !== S.boat || !hopMatch(h.to)){ b.hopHold = null; return false; } return true; }
// the boat held for a hop bought for the stop `to` (the grant's data: the boat it was bought for, aboard now)
function hopHoldFor(d){ const b = S.boat; return !!(d && d.boat === S.cur && hopHeld(b) && d.to && (d.to.port && b.hopHold.to.port === d.to.port || dist(b.hopHold.to, d.to) < 0.1)); }
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
// the time the game was closed, not yet played in: the world's clock ahead of S.t, or the minutes the tick has still to play
// (ui/08-actions.js CATCH_LEFT, not there before the UI's files have run)
function hopCatching(){ return (WCLOCK.on && worldT() - S.t > 1) || (typeof CATCH_LEFT !== 'undefined' && CATCH_LEFT > 0); }
// a hop paid for waits for what passes by itself (HO3, the kontroll: back from Stripe the page plays in
// the minutes it was away): the time away played in, Autonav's way round shallow water
function hopWait(){ const pl = S.plan; return !!(pl && S.boat.status === 'sailing' && (pl.replan || hopCatching())); }
// the minutes paid for cover the trip made: the wind may have freshened since the purchase (a tenth and two minutes more is covered),
// never a trip far longer than was paid for. hopCoverMax is the longest trip a hop bought for paidMin covers, the number the words say
function hopCoverMax(paidMin){ return Math.ceil(paidMin * 1.1) + 2; }
function hopCovers(paidMin, realMin){ return realMin <= hopCoverMax(paidMin); }
// real minutes in words (never «1 minutter»)
function hopMinWords(n){ return [n === 1 ? '1 minutt' : n + ' minutter', n === 1 ? '1 minute' : n + ' minutes']; }
// why a hop cannot be had now, before anything is run (null: it may, the weather and the diesel are the dry run's)
function hopWhy(){
  const b = S.boat, pl = S.plan;
  if (!pl || b.status !== 'sailing' || !(pl.idx < pl.wps.length)) return ['Hopp går bare mens båten seiler en rute.', 'A hop is only possible while the boat sails a route.'];
  // (the game is another page's or device's, ui/02-format-state.js TAB: nothing is hopped or used here; asked again after the map)
  if (typeof TAB !== 'undefined' && TAB && (TAB.lost || TAB.held)) return ['Spillet er åpent et annet sted.', 'The game is open somewhere else.'];
  // (the operations plan's route is the fleet's, not one the player has started: no button there, ui/10u-hopp.js hopShown)
  if (pl.ops || pl.p2) return ['Driftsplanen styrer båten. Hopp går bare på en rute du har lagt selv.', 'The operations plan runs the boat. A hop is only possible on a route you set yourself.'];
  // the time the game was closed, not yet played in (the world's clock ahead of S.t, ui/08-actions.js CATCH_LEFT): the hop would count
  // minutes the catch-up sails anyway, and the time saved and the price would be too high. It passes by itself; the card waits for it
  if (hopCatching()) return ['Spillet henter fortsatt inn tida det var lukket. Vent litt.', 'The game is still catching up on the time it was closed. Wait a little.'];
  return null;
}
// The dry run: the rest of the way to the next stop sailed minute by minute as sail() would (sailV for the speed, with the speed limits,
// the braking into the stop and the sea; the trim until it runs out), with the wind and the sea where she is each minute. Nothing in the
// game is changed: the boat's place, way and heading and the route's index are put back. Nothing refuses it but a route too long to
// work out (HOP.maxMin): not the weather, the diesel or the boat nearly there (Jonas 12.11.2026). paid: kept for the callers, no
// difference now.
// Returns {why, stop, w, min (game minutes), real, kr, fuel (l), trimMin, track (where she is each hour), heading}
function hopRun(paid){
  const b = S.boat, pl = S.plan, iS = hopStop(pl);
  if (iS < 0) return {why:['Ruta har ikke noe mål.', 'The route has no end.']};
  const save = {pos:b.pos, v:b.v, heading:b.heading, idx:pl.idx, speed:pl.speed, dspeed:S.draftSpeed, trim:b.trim}, T = trimOn(b), tEnd = T ? trimUntil(b) : -1;
  let m = 0, fuel = 0, trimMin = 0, why = null, heading = b.heading, ended = false; const track = [];
  try {
    while (pl.idx <= iS){
      if (m >= HOP.maxMin){ why = ['Ruta er for lang til å regne ut her.', 'The route is too long to work out here.']; break; }
      const H = (S.t + m + 1) / 60, W = windAt(H), hs = hsAt(b.pos, H);
      if (m % 60 === 0) track.push({x:b.pos.x, y:b.pos.y});
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
  // (the price on the whole real minutes, as the server works it out: supabase/migrations/20261112200000_hopp.sql hop_price)
  const realMin = Math.max(1, Math.round(m / GAME_RATE));
  return {why, stop:iS, w:pl.wps[iS], min:m, real:m / GAME_RATE, realMin, kr:hopPrice(realMin), fuel, trimMin, track, heading};
}
// the stop of a hop bought (HO3: the purchase keeps {x, y, port}) is the next stop on the route sailed now: the same harbour, or within
// 100 m of it (the place decides too, so a harbour id kept with a character lost on the way is the same stop); else the route has
// changed since, and the hop is not made (it is marked for a refund, ui/10u-hopp.js hopVoid)
function hopMatch(to){
  const pl = S.plan, iS = hopStop(pl); if (!to || iS < 0) return false;
  const w = pl.wps[iS]; return (!!to.port && w.port === to.port) || dist(w, to) < 0.1;
}
// what a hop from here would cost and save, or why it cannot be had (the price is shown before anything is bought)
// (paid: for a hop paid for and waiting, which the weather does not stop either)
function hopQuote(paid){ const why = hopWhy(); return why ? {why} : hopRun(!!paid); }
// minutes as «1 t 20 min» (rounded to the whole minute first, so never «60 min»)
function hopSaved(real, en){ const tm = Math.max(1, Math.round(real)), h = Math.floor(tm / 60), m = tm % 60; return (h ? h + (en ? ' h' : ' t') + (m ? ' ' : '') : '') + (m || !h ? m + ' min' : ''); }
// The hop itself, on the dry run q: what the trip would have used and done, and then she is at the stop
function hopDo(q){
  const b = S.boat, pl = S.plan, n = q.min, T0 = S.t, p0 = b.pos;
  b.hopHold = null;   // (the service is delivered: nothing is owed after it)
  // (an anchor coming up, lying to or «Stopp båten»: she is at the stop now; Jonas: «Ingenting skal være en hindring»)
  b.anch = null; b.hove = null; if (pl.halt) pl.halt = null;
  // the catch in the hold, each minute where she would have been: the fish and the ice (holdMinute) and the live snow crab in the
  // tanks each hour (snoTankHour); nothing else the minutes would have touched
  try {
    for (let m = 0; m < n; m++){
      const t = T0 + m + 1, H = t / 60, p = q.track[Math.min(q.track.length - 1, Math.floor(m / 60))] || p0;
      b.pos = p; holdMinute(H, p);
      if (t % 60 === 0 && BOAT.tank) snoTankHour(H);
    }
  } finally { b.pos = p0; }
  // there: the points passed go into the track (the way home and the chart read it, as arrive does each one), then the stop
  for (let i = pl.idx; i < q.stop; i++){ const w = pl.wps[i]; S.trail.push({x:w.x, y:w.y, port:w.port || null}); }
  const w = pl.wps[q.stop], pt = w.port && portById(w.port), to = pt ? pt.name : null;
  b.pos = {x:w.x, y:w.y}; b.heading = q.heading; b.v = 0; pl.idx = q.stop;
  log('Hoppet ' + (to ? 'til ' + to : 'til neste stopp på ruta') + '. Spart ' + hopSaved(q.real) + '.', 'Hopped ' + (to ? 'to ' + to : 'to the next stop on the route') + '. Saved ' + hopSaved(q.real, true) + '.', 'nav');
  arrive(w);
  return true;
}
// a hop now: the map at the stop first (a block not in is an error, not a value; a fetch that hangs is given up after HOP.mapMs), then
// the one dry run on the world as it is by then. maxMin: the real minutes a hop bought covers (hopCovers), checked on that run
async function hopGo(paid, maxMin){
  let why = hopWhy(); if (why) return {why};
  const pl = S.plan, iS = hopStop(pl); if (iS < 0) return {why:['Ruta har ikke noe mål.', 'The route has no end.']};
  const w = pl.wps[iS];
  try { if (typeof mapNeed === 'function') await Promise.race([mapNeed({x:w.x, y:w.y}, MAPD.simR), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), HOP.mapMs))]); }
  catch (e){ console.warn('hopGo map', e); return {why:['Kartet ved målet kom ikke. Prøv igjen om litt.', 'The chart at the stop did not come. Try again in a little while.'], map:true}; }
  why = hopWhy(); if (why) return {why};
  const q = hopRun(!!paid); if (q.why) return q;
  if (maxMin != null && !hopCovers(maxMin, q.realMin)){ const a = hopMinWords(q.realMin), c = hopMinWords(hopCoverMax(maxMin));
    return {why:['Turen er lengre enn hoppet ble kjøpt for: ' + a[0] + ' i virkeligheten, og hoppet dekker ' + c[0] + '.', 'The trip is longer than the hop was bought for: ' + a[1] + ' in real time, and the hop covers ' + c[1] + '.'], over:true}; }
  hopDo(q); return q;
}
