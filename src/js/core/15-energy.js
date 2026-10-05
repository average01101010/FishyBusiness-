// ================= your own energy: a day at sea empties it, a night ashore fills it =================
// Where you rest: see restRate below (ashore in the naust or a rorbu, or aboard a boat with bunks). Under 25 % your work goes slower. At 0 you fall asleep where you are, for eight hours of game time: with crew aboard the best
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
  log('Du kvitterte brovaktsalarmen. Du er våken, men trøtt og døsig. Kom deg i land og hvil.', 'You acknowledged the bridge watch alarm. You are awake, but tired and drowsy. Get ashore and rest.');
  if (hooks.onEnergy) hooks.onEnergy('ack');
  return true;
}
// Where you rest (Jonas 05.10.2026: «Man skal ikke kunne hvile i en åpen båt, da må man enten seile hjem til naustet sitt eller ta inn
// på en rorbu. Rorbua må være billig. Energi skal kunne lade opp fra 0-100% på 6 timer in-game ved hvile på rorbuer», and «Ved hvile
// forsvinner skipperen fra båten»): ashore, by going in to rest (S.rest; the skipper is gone from the boat until you go aboard again):
// - in Father's naust, in the home harbour at either berth: eight hours to full, faster with the roof and the stove (naustRest)
// - in a rorbu (07d-rorbu.js): six hours to full, RORBU.kr a night, paid when you go in and then once a day while you stay
// Aboard at the quay a boat with bunks (VESSELS berths) rests you in eight hours as before; an open boat gives no rest at all, at the
// quay or at sea.
const restWhere = b => b && b.status === 'port' ? (isRorbu(b.port) ? 'rorbu' : atHome(b) ? 'naust' : null) : null;
const myBoat = () => { const v = myVessel(); return v ? vget(v, 'boat') : S.boat; };
const resting = () => { const b = myBoat(); return !!(S.rest && b && b.status === 'port' && b.port === S.rest.port); };
const bunks = b => !!(b && VESSELS[b.type] && VESSELS[b.type].berths > 0);
// energy a minute where she lies (0 when there is no rest to be had)
function restRate(b){
  if (!b) return ENERGY.quay;
  if (b.status !== 'port') return 0;
  if (S.rest && S.rest.port === b.port) return S.rest.w === 'rorbu' ? RORBU.rate : ENERGY.quay * naustRest(b);
  return bunks(b) ? ENERGY.quay : 0;
}
function restStart(){
  const b = myBoat(), w = restWhere(b); if (!w) return ['Du kan hvile i naustet i hjemhavna eller på en rorbu.', 'You can rest in the boathouse in your home harbour or at a rorbu.'];
  if (resting()) return null;
  const pt = portById(b.port);
  if (w === 'rorbu'){
    if (S.cash < RORBU.kr) return ['Du har ikke ' + kr(RORBU.kr) + ' til en natt på rorbua.', 'You do not have ' + kr(RORBU.kr) + ' for a night at the rorbu.'];
    S.cash -= RORBU.kr; S.stats.costs += RORBU.kr;
    log('Du tok inn på rorbua i ' + pt.name + ' for ' + kr(RORBU.kr) + ' natta.', 'You took a room at the rorbu in ' + pt.name + ' for ' + kr(RORBU.kr) + ' a night.');
  } else log('Du gikk opp i naustet for å hvile.', 'You went up to the boathouse to rest.');
  S.rest = {port:b.port, w, t0:S.t, paid:S.t + RORBU.night};
  if (hooks.onEnergy) hooks.onEnergy('rest');
  return null;
}
function restEnd(quiet){
  if (!S.rest) return; const w = S.rest.w; S.rest = null;
  if (!quiet) log((w === 'rorbu' ? 'Du gikk ned fra rorbua' : 'Du gikk ned fra naustet') + ' og om bord. Energi ' + Math.round(S.energy) + ' %.', 'You went down from the ' + (w === 'rorbu' ? 'rorbu' : 'boathouse') + ' and aboard. Energy ' + Math.round(S.energy) + ' %.');
  if (hooks.onEnergy) hooks.onEnergy('rest');
}
// once a minute: the rest is over when the boat has gone, and a rorbu wants its next night paid
function restMinute(){
  if (!S.rest) return;
  if (!resting()){ S.rest = null; return; }
  if (S.rest.w === 'rorbu' && S.t >= S.rest.paid){
    if (S.cash < RORBU.kr){ restEnd(true); log('Du hadde ikke penger til en natt til på rorbua og gikk om bord.', 'You had no money for another night at the rorbu and went aboard.'); return; }
    S.cash -= RORBU.kr; S.stats.costs += RORBU.kr; S.rest.paid += RORBU.night;
    log('En natt til på rorbua, ' + kr(RORBU.kr) + '.', 'Another night at the rorbu, ' + kr(RORBU.kr) + '.');
  }
}
const meEff = () => S.energy != null && S.energy < ENERGY.warn ? ENERGY.slow : 1;
// «Energi av» in the admin app (the user's wish 03.10.2026, for testing without falling asleep): full energy, no sleep, no dozing
const energyOff = () => !!(S.adm && S.adm.noEnergy);
// once a minute, before the vessels move
function energyMinute(){
  if (S.energy == null) S.energy = 100;
  if (energyOff()){ S.energy = 100; S.sleep = null; S.drowsy = false; S.enWarn = false; return; }
  if (S.sleep){ if (S.t >= S.sleep.until) wakeUp(); return; }
  restMinute();
  const v = myVessel(), b = v && vget(v, 'boat'), quay = !b || b.status === 'port', rate = restRate(b);
  S.energy = clamp(S.energy + (quay ? rate : -ENERGY.sea), 0, 100);   // at the quay only where there is rest (restRate)
  if (S.energy > ENERGY.warn + 5) S.enWarn = false;
  if (S.drowsy && quay && rate > 0 && S.energy >= BNWAS.rested){ S.drowsy = false; log('Du har hvilt deg ut.', 'You have had a proper rest.'); }
  if (quay) return;
  // drowsy after the alarm: you may doze off again (the same minute is the same for every player: a hash, not Math.random)
  if (S.drowsy && S.energy > 0 && h2(S.t, 977) < BNWAS.risk){ fallAsleep(v, true); return; }
  if (S.energy <= ENERGY.warn && !S.enWarn){ S.enWarn = true; const rb = bunks(b) ? null : rorbuNear(b.pos, 40)[0], tip = rb ? [' Nærmeste rorbu er i ' + rb.R.name + ', ' + fmt(rb.d / NM, 0) + ' nm unna.', ' The nearest rorbu is in ' + rb.R.name + ', ' + fmt(rb.d / NM, 0) + ' nm away.'] : ['', '']; log('Du begynner å bli sliten. Arbeidet ditt går tregere.' + tip[0], 'You are getting tired. Your work goes slower.' + tip[1]); if (hooks.onEnergy) hooks.onEnergy('warn'); }
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
