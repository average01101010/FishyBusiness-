// Trim and the engine in the manoeuvring model (core/16b-dyn.js; tilbakemelding 06.11.2026: «spillere som kjøper trim-boost opplever at
// båten ikke går fortere»). Under way by Autonav or by hand the boat moves by the model, and the model's engine was calibrated once a
// vessel type from VESSELS (dynCal(type)), so the boat's own top speed (BOAT.vmax: Trim, the yard's bigger engine, the 90 hp outboard,
// applyVessel) never reached the throttle: full ahead held the type's own top speed whatever was bought. Here the calm-water top speed
// at full throttle is measured on the model the game steers her with (dynCalOf, or dynCal(type) as the game did before the fix), and
// must follow BOAT.vmax.
export default function (t){
  const K = t.K, KN = K.NM * 1000 / 3600, St = () => K.get('S');   // (KN_MS shares a line with DYN_RUD, so it is not one of the names the harness hands out)
  // the calibration the game's helm and Autonav use for the player's boat
  const calOf = b => typeof K.dynCalOf === 'function' ? K.dynCalOf(b) : K.dynCal(b.type);
  // full ahead in calm water from a standstill until she holds her speed (knots)
  const top = P => { const s = K.dynZero(); for (let i = 0; i < 60000; i++){ const u0 = s.u; K.dynInt(P, s, 1, 0, 0.1, 1); if (i > 100 && Math.abs(s.u - u0) < 1e-7) break; } return s.u / KN; };
  const boat = (type, o = {}) => { K.set('S', K.newState()); Object.assign(St().boat, {type, fuel:1e6, ice:0}, o); K.applyVessel(); return St().boat; };

  // ---- the boat's own top speed with nothing bought: the model holds the type's (as before) ----
  for (const type of ['trebat', 'sjark', 'hurtigsjark', 'kyst15']){
    const b = boat(type), v0 = top(calOf(b).P);
    t.near(v0 / K.BOAT.vmax, 1, 0.03, type + ': full fart uten trim er båtens toppfart (' + v0.toFixed(2) + ' av ' + K.BOAT.vmax.toFixed(2) + ' kn)');
  }
  // ---- Trim: each of the three on, the top speed follows BOAT.vmax (+50 %, +75 %, dobbel) ----
  for (const type of ['trebat', 'sjark', 'hurtigsjark', 'kyst15']) for (const k of Object.keys(K.BOOSTS)){
    const b0 = boat(type), v0 = top(calOf(b0).P);
    const b = boat(type, {trim:{k, t0:St().t}}), B = K.BOOSTS[k]; t.ok(K.trimOn(b) === B, type + ' ' + k + ': trimmen er på');
    const v1 = top(calOf(b).P);
    t.near(v1 / K.BOAT.vmax, 1, 0.03, type + ' ' + k + ': full fart med trim er toppfarten med trim (' + v1.toFixed(2) + ' av ' + K.BOAT.vmax.toFixed(2) + ' kn)');
    t.near(v1 / v0, B.x, 0.03, type + ' ' + k + ': trimmen gir ' + Math.round((B.x - 1) * 100) + ' % mer fart i modellen (' + ((v1 / v0 - 1) * 100).toFixed(0) + ' %)');
  }
  // ---- the yard's bigger engine and the 90 hp outboard: the same road to the throttle ----
  { const b = boat('hurtigsjark', {engLv:2}), v = top(calOf(b).P); t.ok(K.BOAT.vmax > K.VESSELS.hurtigsjark.vmax, 'større motor: toppfarten er høyere på papiret');
    t.near(v / K.BOAT.vmax, 1, 0.03, 'større motor (trinn 2): modellen når toppfarten (' + v.toFixed(2) + ' av ' + K.BOAT.vmax.toFixed(2) + ' kn)'); }
  { const b = boat('skiff'); St().equip.motor90 = 1; K.applyVessel(); const v = top(calOf(b).P);
    t.near(K.BOAT.vmax, K.EQUIP.motor90.boost.vmax, 1e-9, '90 hk påhengs: toppfarten er 30 kn på papiret');
    t.near(v / K.BOAT.vmax, 1, 0.03, '90 hk påhengs: modellen når toppfarten (' + v.toFixed(2) + ' av ' + K.BOAT.vmax.toFixed(2) + ' kn)'); }
  // ---- a trim that runs out: the speed goes back (the calibration follows BOAT, not what was cached for the trim) ----
  { const b = boat('sjark', {trim:{k:'turbo', t0:St().t}}), vOn = top(calOf(b).P);
    St().t += K.BOOSTS.turbo.h * 60 + 1; K.applyVessel(); t.ok(!K.trimOn(b), 'trimmen har gått ut');
    const vOff = top(calOf(b).P); t.near(vOff / K.VESSELS.sjark.vmax, 1, 0.03, 'etter trimmen er farten tilbake på båtens egen (' + vOff.toFixed(2) + ' kn, med trim ' + vOn.toFixed(2) + ')'); }
  // ---- the hull is the same: the turning circle at the type's cruising speed and the drift are not changed by the engine ----
  { const b0 = boat('sjark'), c0 = calOf(b0), b1 = boat('sjark', {trim:{k:'turbo', t0:St().t}}), c1 = calOf(b1);
    t.near(c1.P.k2, c0.P.k2, 1e-9, 'trim endrer ikke skrogets motstand'); t.near(c1.P.rs, c0.P.rs, 1e-9, 'trim endrer ikke roret');
    // (a little wider, 6-7 %: at the same speed the stronger screw runs at less throttle and puts a little less race over the rudder;
    // the autopilot's gains are measured on the model with that engine, dynCalRun nom)
    t.near(K.dynTurn(c1.P, c0.V).R, K.dynTurn(c0.P, c0.V).R, 0.1 * K.dynTurn(c0.P, c0.V).R, 'nesten samme svingradius ved marsjfart uten trim (innen 10 %)');
    t.ok(c1.nom.length === c0.nom.length + 1 && c1.nom[c1.nom.length - 1].u > c0.nom[c0.nom.length - 1].u * 1.9, 'autopilotens forsterkning er også målt ved marsjfarten med trim');
    t.ok(c1.stop.length > c0.stop.length, 'stopplengdene er målt opp til den nye toppfarten (autopiloten bremser riktig fra full fart)'); }

  // ---- the route's own speed (Jonas 06.11.2026: «Det skal ikke være nødvendig med refresh etter kjøp av noen typer boost»): the speed
  // chosen on the slider is knots, and Autonav and the minute step hold her under it, so a trim on a route set at the old top speed (or
  // at cruise) gave nothing until the slider was moved. Given the way the shop gives it (trimSet, or as the game did before: b.trim and
  // applyVessel), the running route's speed and the next route's follow the trim, and go back when it runs out (trimEnd) ----
  const give = k => typeof K.trimSet === 'function' ? K.trimSet(k) : (St().boat.trim = {k, t0:St().t}, K.applyVessel());
  const end = () => typeof K.trimEnd === 'function' ? K.trimEnd() : (delete St().boat.trim, K.applyVessel());
  { boat('trebat'); St().plan = {wps:[{x:0, y:0}], idx:0, speed:7, returning:false}; St().draftSpeed = 6; St().draftFull = false;
    give('turbo');
    t.near(St().plan.speed, 14, 0.05, 'turbotrim på ruta som går: rutas 7 kn (gammel toppfart) blir 14 kn uten at glidebryteren flyttes');
    t.near(St().draftSpeed, 12, 0.05, 'neste rute: marsjfarten 6 kn blir 12 kn med trimmen');
    give('pump');
    t.near(St().plan.speed, 10.5, 0.05, 'ny trim i stedet for den som er på: farten følger den nye (+50 %), ikke begge');
    end();
    t.near(St().plan.speed, 7, 0.05, 'trimmen går ut: rutas fart tilbake på 7 kn'); t.near(St().draftSpeed, 6, 0.05, 'og neste rute tilbake på 6 kn'); }
  { boat('trebat'); St().plan = null; St().draftSpeed = 16; give('turbo');
    t.ok(St().draftSpeed >= K.BOAT.vmax, 'standardfarten (16 kn, over toppfarten) holder seg over den nye toppfarten: full fart'); }

  // ---- «Full fart» as the default (Jonas 06.11.2026: «den slideren burde alltid stå på det som er høyest mulig», also the operations
  // plans): the slider's top is full, not knots, and follows the top speed she has now (speedPin in applyVessel) ----
  { const b = boat('hurtigsjark');
    t.ok(St().draftFull === true, 'nytt spill: farten står på full'); t.near(St().draftSpeed, K.BOAT.vmax, 1e-9, 'full fart er båtens toppfart (22 kn, ikke 16)');
    b.engLv = 2; K.applyVessel(); t.near(St().draftSpeed, K.BOAT.vmax, 1e-9, 'større motor: full fart følger den nye toppfarten (' + K.BOAT.vmax.toFixed(1) + ' kn)');
    St().plan = {wps:[{x:0, y:0}], idx:0, speed:K.BOAT.vmax, full:true, returning:false}; give('turbo');
    t.near(St().plan.speed, K.BOAT.vmax, 1e-9, 'rute på full fart med turbotrim: toppfarten med trim (' + K.BOAT.vmax.toFixed(1) + ' kn), ikke dobbelt opp'); t.near(St().draftSpeed, K.BOAT.vmax, 1e-9, 'og neste rute også');
    end(); t.near(St().plan.speed, K.BOAT.vmax, 1e-9, 'trimmen går ut: full fart er toppfarten uten trim igjen'); }
  { boat('trebat'); St().draftFull = false; St().draftSpeed = 5; K.applyVessel(); t.near(St().draftSpeed, 5, 1e-9, 'valgt lavere fart (5 kn) blir stående');
    St().plan = {wps:[{x:0, y:0}], idx:0, speed:5, full:false, returning:false}; give('turbo'); t.near(St().plan.speed, 10, 0.05, 'og følger trimmen (5 → 10 kn)'); }
  // a save from before the flag: at or over the top speed is full, under it is the knots chosen
  { boat('trebat'); delete St().draftFull; St().draftSpeed = 16; K.applyVessel(); t.ok(St().draftFull === true && St().draftSpeed === K.BOAT.vmax, 'gammel lagring med 16 kn: full fart');
    boat('trebat'); delete St().draftFull; St().draftSpeed = 5; K.applyVessel(); t.ok(St().draftFull === false && St().draftSpeed === 5, 'gammel lagring med 5 kn: blir 5 kn'); }
  // ---- a second trim (06.11.2026, the review of known issues, point 1): the same kind adds its hours to the one on (no paid time lost);
  // another kind replaces it, which the Trim app asks about first (phone/14-act.js trimPend) ----
  { const b = boat('sjark'); K.trimSet('turbo'); St().t += 10 * 60; t.near(K.trimLeft(b), 62, 0.01, 'turbotrim etter 10 timer: 62 timer igjen');
    K.trimSet('turbo'); t.near(K.trimLeft(b), 134, 0.01, 'ny turbotrim mens den går: timene legges til (62 + 72 = 134), ingenting betalt går tapt');
    t.near(K.BOAT.vmax, 2 * K.VESSELS.sjark.vmax, 1e-9, 'farten er fortsatt dobbel');
    St().t += 133 * 60; t.ok(!!K.trimOn(b), 'på i 133 timer til'); St().t += 2 * 60; t.ok(!K.trimOn(b), 'og ute etter 134');
    boat('sjark'); K.trimSet('turbo'); St().t += 10 * 60; K.trimSet('pump'); t.near(K.trimLeft(St().boat), 24, 0.01, 'en annen type erstatter den som går (24 timer, +50 %)'); t.near(K.BOAT.vmax, 1.5 * K.VESSELS.sjark.vmax, 1e-9, 'farten er den nye'); }
}
