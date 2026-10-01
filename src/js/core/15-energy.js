// ================= your own energy: a day at sea empties it, eight hours at the quay fill it =================
// Under 25 % your work goes slower. At 0 you fall asleep where you are, for eight hours of game time: with crew aboard the best
// seaman takes the helm and the trip goes on; alone, the work stops and the boat drifts with the wind, and it can ground. You
// wake with 60 % (sleep in a seat at sea is poorer than a night ashore; a start value). It runs while the game is closed too.
const ENERGY = {sea:100 / 24 / 60, quay:100 / 8 / 60, warn:25, dim:15, sleep:480, wake:60, slow:0.75};
const myVessel = () => (S.fleet || []).find(v => v.id === S.me) || null;
const asleep = () => !!(S.sleep && S.t < S.sleep.until);
const meEff = () => S.energy != null && S.energy < ENERGY.warn ? ENERGY.slow : 1;
// once a minute, before the vessels move
function energyMinute(){
  if (S.energy == null) S.energy = 100;
  if (S.sleep){ if (S.t >= S.sleep.until) wakeUp(); return; }
  const v = myVessel(), b = v && vget(v, 'boat'), quay = !b || b.status === 'port';
  S.energy = clamp(S.energy + (quay ? ENERGY.quay : -ENERGY.sea), 0, 100);
  if (S.energy > ENERGY.warn + 5) S.enWarn = false;
  if (quay) return;
  if (S.energy <= ENERGY.warn && !S.enWarn){ S.enWarn = true; log('Du begynner å bli sliten. Arbeidet ditt går tregere.', 'You are getting tired. Your work goes slower.'); if (hooks.onEnergy) hooks.onEnergy('warn'); }
  if (S.energy <= 0) fallAsleep(v);
}
function fallAsleep(v){
  S.sleep = {t0:S.t, until:S.t + ENERGY.sleep, v:v.id};
  onVessel(v, () => {
    const on = crewAboard(), b = S.boat; S.sleep.alone = !on.length;
    if (S.sleep.alone){ b.v = 0; log('Du sovnet av utmattelse. Båten ligger og driver.', 'You fell asleep from exhaustion. The boat is drifting.'); }
    else { const sk = on.slice().sort((a, c) => c.attr.sjo - a.attr.sjo)[0]; log('Du sovnet av utmattelse. ' + sk.name.split(' ')[0] + ' tar roret.', 'You fell asleep from exhaustion. ' + sk.name.split(' ')[0] + ' takes the helm.'); }
  });
  if (hooks.onEnergy) hooks.onEnergy('sleep');
}
function wakeUp(){ S.sleep = null; S.energy = ENERGY.wake; S.enWarn = false; log('Du våknet etter åtte timers søvn.', 'You woke after eight hours of sleep.'); if (hooks.onEnergy) hooks.onEnergy('wake'); }
// asleep and alone aboard: nobody steers or fishes, and the boat drifts downwind at 0.3–0.8 kn
const sleepAlone = () => asleep() && meAboard() && !crewAboard().length;
function sleepDrift(H){
  const b = S.boat, W = windAt(H), kn = 0.3 + 0.5 * clamp(W / 15, 0, 1), h = (windDir(H) + 180) * Math.PI / 180, d = kn * NM / 60;
  const to = {x:b.pos.x + Math.sin(h) * d, y:b.pos.y - Math.cos(h) * d}, gp = groundCheck(b.pos, to); b.v = 0;
  if (gp){ runAground(gp); return; }
  if (!isLand(to)){ b.pos = to; b.drift = (b.drift || 0) + d; }
}
