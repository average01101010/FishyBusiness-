// ================= your own energy: a day at sea empties it, a night ashore fills it =================
// Where you rest: see restRate below (ashore in the naust or a rorbu, or aboard a boat with bunks). Under 25 % your work goes slower. At 0 you fall asleep where you are, for eight hours of game time: with crew aboard the best
// seaman takes the helm and the trip goes on; alone, the work stops and the boat drifts with the wind, and it can ground. You
// wake with 60 % (sleep in a seat at sea is poorer than a night ashore; a start value). It runs while the game is closed too.
const ENERGY = {sea:100 / 24 / 60, quay:100 / 8 / 60, warn:25, half:50, dim:15, sleep:480, wake:60, slow:0.75};
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
// and, from 17.10.2026 (tilbakemelding #70; Jonas: «i båter som har køye skal man kunne hvile ombord»), in the bunk of a boat with
// berths (schema v2, docs/batplan.md del 8) lying at anchor or at sea with someone of the crew awake on watch: 'koye'. Slower than a
// bed ashore (restRate), and the crew work on while you sleep (restAshore tells the deck and the 3D view apart from the rest ashore)
const crewOf = v => v ? (v.id === S.cur ? S.crew : v.crew) || [] : S.crew || [];
const bunkOk = (b, v) => !!(b && b.status !== 'port' && bunks(b) && (b.anch || crewOf(v).some(c => !c.off)));
const restWhere = b => b && b.status === 'port' ? (isRorbu(b.port) ? 'rorbu' : atHome(b) ? 'naust' : null) : bunkOk(b, myVessel()) ? 'koye' : null;
const myBoat = () => { const v = myVessel(); return v ? vget(v, 'boat') : S.boat; };
const resting = () => { const b = myBoat(); if (!S.rest || !b) return false; return S.rest.w === 'koye' ? bunkOk(b, myVessel()) : b.status === 'port' && b.port === S.rest.port; };
const restAshore = () => resting() && S.rest.w !== 'koye';
const bunks = b => !!(b && VESSELS[b.type] && VESSELS[b.type].berths > 0);
// energy a minute where she lies (0 when there is no rest to be had)
function restRate(b){
  if (!b) return ENERGY.quay;
  if (b.status !== 'port') return S.rest && S.rest.w === 'koye' && resting() ? ENERGY.quay * (b.anch ? 0.85 : 0.7) : 0;   // the bunk: a berth at anchor, poorer under way
  if (S.rest && S.rest.port === b.port) return S.rest.w === 'rorbu' ? RORBU.rate : ENERGY.quay * naustRest(b);
  return bunks(b) ? ENERGY.quay : 0;
}
function restStart(){
  const b = myBoat(), w = restWhere(b); if (!w) return bunks(b) ? ['Du kan hvile i køya til ankers, eller på sjøen når noen av mannskapet er våkne og har vakta.', 'You can rest in the bunk at anchor, or at sea when someone of the crew is awake on watch.'] : ['Du kan hvile i naustet i hjemhavna eller på en rorbu.', 'You can rest in the boathouse in your home harbour or at a rorbu.'];
  if (resting()) return null;
  const pt = b.port ? portById(b.port) : null;
  if (w === 'koye'){ const sk = crewOf(myVessel()).filter(c => !c.off).slice().sort((a, c) => c.attr.sjo - a.attr.sjo)[0]; log(b.anch ? 'Du gikk ned i køya mens båten ligger til ankers.' : 'Du gikk ned i køya. ' + sk.name.split(' ')[0] + ' har vakta.', b.anch ? 'You went down to the bunk while the boat lies at anchor.' : 'You went down to the bunk. ' + sk.name.split(' ')[0] + ' has the watch.'); }
  else if (w === 'rorbu'){
    if (spendable() < RORBU.kr) return ['Du har ikke ' + kr(RORBU.kr) + ' til en natt på rorbua.', 'You do not have ' + kr(RORBU.kr) + ' for a night at the rorbu.'];
    book('land', -RORBU.kr, 'Rorbu', 'Rorbu');
    log('Du tok inn på rorbua i ' + pt.name + ' for ' + kr(RORBU.kr) + ' natta.', 'You took a room at the rorbu in ' + pt.name + ' for ' + kr(RORBU.kr) + ' a night.');
  } else log('Du gikk opp i naustet for å hvile.', 'You went up to the boathouse to rest.');
  S.rest = {port:b.port || null, w, t0:S.t, paid:S.t + RORBU.night}; achAdd('sleep');
  if (hooks.onEnergy) hooks.onEnergy('rest');
  return null;
}
function restEnd(quiet){
  if (!S.rest) return; const w = S.rest.w; S.rest = null;
  if (!quiet) log(w === 'koye' ? 'Du kom opp fra køya. Energi ' + Math.round(S.energy) + ' %.' : (w === 'rorbu' ? 'Du gikk ned fra rorbua' : 'Du gikk ned fra naustet') + ' og om bord. Energi ' + Math.round(S.energy) + ' %.', w === 'koye' ? 'You came up from the bunk. Energy ' + Math.round(S.energy) + ' %.' : 'You went down from the ' + (w === 'rorbu' ? 'rorbu' : 'boathouse') + ' and aboard. Energy ' + Math.round(S.energy) + ' %.');
  if (hooks.onEnergy) hooks.onEnergy('rest');
}
// once a minute: the rest is over when the boat has gone, and a rorbu wants its next night paid
function restMinute(){
  if (!S.rest) return;
  if (!resting()){ S.rest = null; return; }
  if (S.rest.w === 'rorbu' && S.t >= S.rest.paid){
    if (spendable() < RORBU.kr){ restEnd(true); log('Du hadde ikke penger til en natt til på rorbua og gikk om bord.', 'You had no money for another night at the rorbu and went aboard.'); return; }
    book('land', -RORBU.kr, 'Rorbu', 'Rorbu'); S.rest.paid += RORBU.night;
    log('En natt til på rorbua, ' + kr(RORBU.kr) + '.', 'Another night at the rorbu, ' + kr(RORBU.kr) + '.');
  }
}
// where to rest from here, in words (Ø8b M1, Jonas 06.11.2026: «Sørg også for at spillere på båter uten lugarer vet at de må finne en
// rorbu for å sove. Dette er viktig for nye spillere.»): the bunk on a boat with berths (at anchor, or with someone of the crew on watch),
// else ashore, with the nearest rorbu and how far it is
// (a rorbu whose quay was looked for on the shore and not found has no berth and no mark on the chart: rorbuSite, 07d-rorbu.js; one not
// worked out yet, its map block not in, is kept)
const rorbuUsable = R => { try { rorbuSite(R); } catch (e){} return R.site !== null; };
function rorbuTip(p){ const rb = p ? rorbuNear(p, 120).find(e => rorbuUsable(e.R)) : null; return rb ? {name:rb.R.name, nm:rb.d / NM} : null; }
// «Nærmeste rorbu er i Husa, 3 nm unna.» (the toast, the log and the handbook's drip say it the same way)
const rorbuLine = r => { const n = r.nm < 0.5 ? ['under 1', 'under 1'] : [String(Math.round(r.nm)), String(Math.round(r.nm))];
  return ['Nærmeste rorbu er i ' + r.name + ', ' + n[0] + ' nm unna.', 'The nearest rorbu is in ' + r.name + ', ' + n[1] + ' nm away.']; };
function restTip(b){
  if (bunks(b)) return bunkOk(b, myVessel()) ? ['Gå ned i køya og hvil.', 'Go down to the bunk and rest.'] : ['Ankre opp og gå ned i køya, eller gå i køya når noen av mannskapet har vakta.', 'Anchor and go down to the bunk, or take the bunk when someone of the crew has the watch.'];
  const r = b && b.status !== 'port' ? rorbuTip(b.pos) : null;
  const ln = r ? rorbuLine(r) : null;
  return r ? ['Båten har ingen køyer, så du må i land for å sove. ' + ln[0], 'The boat has no bunks, so you must go ashore to sleep. ' + ln[1]]
    : ['Båten har ingen køyer, så du må i land for å sove: seil til naustet eller en rorbu.', 'The boat has no bunks, so you must go ashore to sleep: sail to your boathouse or a rorbu.'];
}
const meEff = () => S.energy != null && S.energy < ENERGY.warn ? ENERGY.slow : 1;
// «Energi av» in the admin app (the user's wish 03.10.2026, for testing without falling asleep): full energy, no sleep, no dozing
const energyOff = () => !!(S.adm && S.adm.noEnergy);
// ===== Skippertak (Jonas 12.10.2026): an energy drink, for real money only (never for the game's kroner), in three sizes =====
// While it works, you and every crew on every vessel of the fleet stay rested: your energy is held at 100 %, no one falls asleep, the
// crews' fatigue stays at 0, and an operations plan's rest sessions are left out (06d-drift.js), so a boat on a plan works through
// them. The time is the game's one clock for every player, so it runs while the game is closed too. A new one is added to what is
// left. The energy model itself (ENERGY, RORBU, the crews' fatigue) is never made harder to sell more: tests/skiptest.py locks the
// numbers, and the free way, rest in the naust or at a rorbu, stays as it is (docs/engasjement.md). The prices are the database's
// (supabase/migrations/20261012120000_skippertak.sql); the game shows its own, and the two must agree (as HAILL and BOOSTS).
const SKIP = {light:{h:24, nok:29, no:'Skippertak Light', en:'Skippertak Light'},
  std:{h:48, nok:39, no:'Skippertak', en:'Skippertak'},
  max:{h:96, nok:49, no:'Skippertak Max', en:'Skippertak Max', best:true}};
const skipOn = () => !!(S.skip && S.skip.until != null && S.t < S.skip.until);
const skipLeft = () => skipOn() ? (S.skip.until - S.t) / 60 : 0;   // game hours left
// the crews of the whole fleet (the vessel you are on keeps hers in S.crew, the others in their own fields: VKEYS)
function fleetCrews(){ const out = [S.crew || []]; for (const v of S.fleet || []) if (v.id !== S.cur && v.crew) out.push(v.crew); return out; }
function giveSkip(k){
  const X = SKIP[k]; if (!X) return null;
  const now = boostT(), from = skipOn() ? Math.max(S.skip.until, now) : now;   // (from the world's minute: boostT, 01-world.js)
  S.skip = {k, t0:now, until:from + X.h * 60};
  S.sleep = null; S.energy = 100; S.drowsy = false; S.enWarn = false;
  for (const cr of fleetCrews()) for (const c of cr) c.fatigue = 0;
  // (no rest on the rorbu, the tab says: you go aboard, and the plans go on at once; Jonas 06.11.2026)
  if (S.rest) restEnd();
  if (typeof plan2SkipGiven === 'function') plan2SkipGiven();
  const hl = Math.round((S.skip.until - now) / 60); log(X.no + ': du og mannskapet på hele flåten er uthvilt i ' + hl + ' timer.', X.en + ': you and the crews of the whole fleet are rested for ' + hl + ' hours.');
  if (hooks.onEnergy) hooks.onEnergy('skip');
  return X[S.lang === 'en' ? 'en' : 'no'];
}
// once a minute, before the vessels move
function energyMinute(){
  if (S.energy == null) S.energy = 100;
  if (energyOff()){ S.energy = 100; S.sleep = null; S.drowsy = false; S.enWarn = false; return; }
  // the first trip holds the energy where it is, awake (Jonas 27.10.2026: «skru av energien til etter tutorialen»): a player away for hours
  // in the middle of it would otherwise wake to the boat drifted ashore, where the guide has no way on; it runs again from the next minute
  // after the first trip
  if (S.tut && S.tut.v === 2){ if (S.sleep) S.sleep = null; S.drowsy = false; return; }
  // Skippertak: held at full, awake, and once it has run out, said once
  if (skipOn()){ if (S.sleep) S.sleep = null; restMinute(); S.energy = 100; S.drowsy = false; S.enWarn = false; return; }
  if (S.skip && !S.skip.told){ S.skip.told = true; log(SKIP[S.skip.k] ? SKIP[S.skip.k].no + ' har gått ut. Nå trenger du og mannskapet hvile igjen.' : 'Skippertak har gått ut.', (SKIP[S.skip.k] ? SKIP[S.skip.k].en : 'Skippertak') + ' has run out. You and the crews need rest again.'); }
  if (S.sleep){ if (S.t >= S.sleep.until) wakeUp(); return; }
  restMinute();
  const v = myVessel(), b = v && vget(v, 'boat'), quay = !b || b.status === 'port', rate = restRate(b), bunk = !quay && resting();   // (in the bunk at anchor or at sea, #70)
  S.energy = clamp(S.energy + (quay || bunk ? rate : -ENERGY.sea), 0, 100);   // at the quay only where there is rest (restRate)
  if (S.energy > ENERGY.warn + 5) S.enWarn = false;
  if (S.drowsy && (quay || bunk) && rate > 0 && S.energy >= BNWAS.rested){ S.drowsy = false; log('Du har hvilt deg ut.', 'You have had a proper rest.'); }
  if (quay || bunk) return;
  // drowsy after the alarm: you may doze off again (the same minute is the same for every player: a hash, not Math.random)
  if (S.drowsy && S.energy > 0 && h2(S.t, 977) < BNWAS.risk){ fallAsleep(v, true); return; }
  // the first time under half at sea on a boat with no bunks, once: there is no sleep aboard, and where the nearest rorbu is (Ø8b M1)
  if (S.energy < ENERGY.half && !bunks(b) && !S.enNoBunk){ S.enNoBunk = S.t || 1; const tip = restTip(b); log(tip[0], tip[1]); if (hooks.onEnergy) hooks.onEnergy('nobunk'); }
  if (S.energy <= ENERGY.warn && !S.enWarn){ S.enWarn = true; const tip = restTip(b); log('Du begynner å bli sliten. Arbeidet ditt går tregere. ' + tip[0], 'You are getting tired. Your work goes slower. ' + tip[1]); if (hooks.onEnergy) hooks.onEnergy('warn'); }
  if (S.energy <= 0) fallAsleep(v);
}
function fallAsleep(v, doze){
  S.sleep = {t0:S.t, until:S.t + ENERGY.sleep, v:v.id}; achAdd('sleep');
  onVessel(v, () => {
    // (an ocean vessel's teams (lagOf, 04-crew.js) work on and keep the watch on the bridge, as sleepAlone has it; the screen and the log
    // said she drifted, H2e 06.11.2026)
    const on = crewAboard(), b = S.boat, lag = !on.length && typeof lagOf === 'function' && lagOf(); S.sleep.alone = !on.length && !lag;
    if (S.equip && S.equip.brovakt && b.status !== 'port') S.sleep.alarmAt = S.t + BNWAS.after;
    if (doze) log('Du duppet av.', 'You dozed off.');
    if (S.sleep.alone){ b.v = 0; log('Du sovnet av utmattelse. Båten ligger og driver.', 'You fell asleep from exhaustion. The boat is drifting.'); }
    else if (lag) log('Du sovnet av utmattelse. Vakta på broa tar over, og lagene arbeider videre.', 'You fell asleep from exhaustion. The watch on the bridge takes over, and the teams work on.');
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
// asleep and alone aboard: nobody fishes, and the boat drifts downwind at 0.3–0.8 kn. Toward land or shallow water she stops where
// she is and lies there: she never runs aground in your sleep (tilbakemelding #47, 08.10.2026: a night's drift put a boat on land, and
// the player could do nothing about it). On a route the autopilot steers instead (05-vessels.js vesselStep).
const sleepAlone = () => asleep() && meAboard() && !crewAboard().length && !lagOf();
function sleepDrift(H){
  const b = S.boat, W = windAt(H), kn = 0.3 + 0.5 * clamp(W / 15, 0, 1), h = (windDir(H) - gridGamma(b.pos) + 180) * Math.PI / 180, d = kn * NM / 60 * gridScale(b.pos);
  const to = {x:b.pos.x + Math.sin(h) * d, y:b.pos.y - Math.cos(h) * d}; b.v = 0;
  let held = true; try { held = isLand(to) || !!groundCheck(b.pos, to); } catch (e){}   // (a tile not in yet: she waits)
  if (held){ if (S.sleep && !S.sleep.held){ S.sleep.held = true; log('Båten drev inn mot land og ble liggende der.', 'The boat drifted in toward the land and lies there.', 'nav'); } return; }
  b.pos = to; b.drift = (b.drift || 0) + d;
}
