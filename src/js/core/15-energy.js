// ================= your own energy: a day at sea empties it, eight hours at the quay fill it =================
// Under 25 % your work goes slower. At 0 you fall asleep where you are, for eight hours of game time: with crew aboard the best
// seaman takes the helm and the trip goes on; alone, the work stops and the boat drifts with the wind, and it can ground. You
// wake with 60 % (sleep in a seat at sea is poorer than a night ashore; a start value). It runs while the game is closed too.
const ENERGY = {sea:100 / 24 / 60, quay:100 / 8 / 60, warn:25, dim:15, sleep:480, wake:60, slow:0.75};
const myVessel = () => (S.fleet || []).find(v => v.id === S.me) || null;
const asleep = () => !!(S.sleep && S.t < S.sleep.until);
// The bridge watch alarm (EQUIP.brovakt; the user's wish 03.10.2026): dozing off at sea with it aboard, it goes off after three
// minutes and beeps until it is acknowledged («ACK» on the screen, ui/05b-work.js). That wakes you at once, but drowsy (10 %): until
// you have rested at the quay (60 %) you may doze off again at any minute (3 %), and each time it goes off again. Nobody to press
// ACK (the game closed), it beeps on and you sleep as without it.
const BNWAS = {after:3, wake:10, risk:0.03, rested:60};
const alarmOn = () => !!(asleep() && S.sleep.alarmAt != null && S.t >= S.sleep.alarmAt);
function alarmAck(){
  if (!alarmOn()) return false;
  S.sleep = null; S.energy = Math.max(S.energy || 0, BNWAS.wake); S.drowsy = true; S.enWarn = true;
  log('Du kvitterte brovaktsalarmen. Du er våken, men trøtt og døsig. Kom deg til kai og hvil.', 'You acknowledged the bridge watch alarm. You are awake, but tired and drowsy. Get to the quay and rest.');
  if (hooks.onEnergy) hooks.onEnergy('ack');
  return true;
}
const meEff = () => S.energy != null && S.energy < ENERGY.warn ? ENERGY.slow : 1;
// «Energi av» in the admin app (the user's wish 03.10.2026, for testing without falling asleep): full energy, no sleep, no dozing
const energyOff = () => !!(S.adm && S.adm.noEnergy);
// once a minute, before the vessels move
function energyMinute(){
  if (S.energy == null) S.energy = 100;
  if (energyOff()){ S.energy = 100; S.sleep = null; S.drowsy = false; S.enWarn = false; return; }
  if (S.sleep){ if (S.t >= S.sleep.until) wakeUp(); return; }
  const v = myVessel(), b = v && vget(v, 'boat'), quay = !b || b.status === 'port';
  S.energy = clamp(S.energy + (quay ? ENERGY.quay * naustRest(b) : -ENERGY.sea), 0, 100);   // the naust's roof and stove (07c-naust.js)
  if (S.energy > ENERGY.warn + 5) S.enWarn = false;
  if (S.drowsy && quay && S.energy >= BNWAS.rested){ S.drowsy = false; log('Du har hvilt deg ut ved kai.', 'You have had a proper rest at the quay.'); }
  if (quay) return;
  // drowsy after the alarm: you may doze off again (the same minute is the same for every player: a hash, not Math.random)
  if (S.drowsy && S.energy > 0 && h2(S.t, 977) < BNWAS.risk){ fallAsleep(v, true); return; }
  if (S.energy <= ENERGY.warn && !S.enWarn){ S.enWarn = true; log('Du begynner å bli sliten. Arbeidet ditt går tregere.', 'You are getting tired. Your work goes slower.'); if (hooks.onEnergy) hooks.onEnergy('warn'); }
  if (S.energy <= 0) fallAsleep(v);
}
function fallAsleep(v, doze){
  S.sleep = {t0:S.t, until:S.t + ENERGY.sleep, v:v.id};
  onVessel(v, () => {
    const on = crewAboard(), b = S.boat; S.sleep.alone = !on.length;
    if (S.equip && S.equip.brovakt && b.status !== 'port') S.sleep.alarmAt = S.t + BNWAS.after;
    if (doze) log('Du duppet av.', 'You dozed off.');
    if (S.sleep.alone){ b.v = 0; log('Du sovnet av utmattelse. Båten ligger og driver.', 'You fell asleep from exhaustion. The boat is drifting.'); }
    else { const sk = on.slice().sort((a, c) => c.attr.sjo - a.attr.sjo)[0]; log('Du sovnet av utmattelse. ' + sk.name.split(' ')[0] + ' tar roret.', 'You fell asleep from exhaustion. ' + sk.name.split(' ')[0] + ' takes the helm.'); }
  });
  if (hooks.onEnergy) hooks.onEnergy('sleep');
}
function wakeUp(){ S.sleep = null; S.energy = ENERGY.wake; S.enWarn = false; S.drowsy = false; log('Du våknet etter åtte timers søvn.', 'You woke after eight hours of sleep.'); if (hooks.onEnergy) hooks.onEnergy('wake'); }
// Woken before the eight hours are out (the sleep screen's «Våkn opp», or coming back to the game after being away): the energy the
// sleep has given so far, 60 % after the whole of it, and not before an hour. The game's clock is one for every player, so a sleep
// cannot be shortened by running it faster (the user 03.10.2026); it can only be broken off, with less rest.
const WAKE_MIN = 60;
const sleepGain = () => S.sleep ? clamp((S.t - S.sleep.t0) / ENERGY.sleep, 0, 1) * ENERGY.wake : 0;
function wakeEarly(back){
  if (!asleep() || S.t - S.sleep.t0 < WAKE_MIN) return false;
  const e = Math.max(1, Math.round(sleepGain())), h = Math.floor((S.t - S.sleep.t0) / 60);
  S.sleep = null; S.energy = e; S.enWarn = e <= ENERGY.warn;
  log((back ? 'Du våknet da du kom tilbake' : 'Du vekket deg selv') + ' etter ' + h + ' t søvn. Energi ' + e + ' %.', (back ? 'You woke when you came back' : 'You woke yourself') + ' after ' + h + ' h of sleep. Energy ' + e + ' %.');
  if (hooks.onEnergy) hooks.onEnergy('wake');
  return true;
}
// asleep and alone aboard: nobody steers or fishes, and the boat drifts downwind at 0.3–0.8 kn
const sleepAlone = () => asleep() && meAboard() && !crewAboard().length;
function sleepDrift(H){
  const b = S.boat, W = windAt(H), kn = 0.3 + 0.5 * clamp(W / 15, 0, 1), h = (windDir(H) - gridGamma(b.pos) + 180) * Math.PI / 180, d = kn * NM / 60;
  const to = {x:b.pos.x + Math.sin(h) * d, y:b.pos.y - Math.cos(h) * d}, gp = groundCheck(b.pos, to); b.v = 0;
  if (gp){ runAground(gp); return; }
  if (!isLand(to)){ b.pos = to; b.drift = (b.drift || 0) + d; }
}
