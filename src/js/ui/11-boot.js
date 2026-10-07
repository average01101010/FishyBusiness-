// ---------- boot ----------
// The map comes first (01b-mapdata.js): the manifest, the core layers, and the sim packs round every vessel and its plan. Then the
// saved game is read and the page built. The clock waits for SIMREADY (08-actions.js tick), and later for each vessel's waters.
let awayMs = 0, AWAY = 0, SIMREADY = false;
const BOOT_T = Date.now();
const g3Live = () => typeof G3 !== 'undefined' && G3.isActive();
async function bootMap(){
  await mapStart();
  const saved = load(), pts = [];
  for (const v of saved && saved.fleet && saved.fleet.length ? saved.fleet : saved ? [saved] : []){
    const b = v.boat; if (b && b.pos) pts.push(b.pos); for (const w of [...((v.plan && v.plan.wps) || []), ...((v.ops && v.ops.wps) || []), ...(v.draft || [])]) pts.push(w); }
  for (const s of (saved && saved.sets) || []) if (s.a && s.b) pts.push(setMid(s));
  // Senja's harbours (a new game starts in Finnsnes before the player picks a place, ui/08c-start.js), the saved home and the grounds
  // (the talk on the quay weighs them all); not the coast's receivers, which would be the whole coast's packs
  for (const q of PORTS) if (!q.coastal) pts.push(q.p); for (const g of GROUNDS) pts.push(g.p);
  { const h = saved && saved.home && portById(saved.home); if (h) pts.push(h.p); }
  await Promise.all([mapLoad(MAPD.core), ...pts.map(p => mapNeed(p, MAPD.simR))]);
  DEPTH = true;
}
function bootGame(){
S = load();
if (S){ awayMs = Date.now() - (S.lastReal || Date.now()); } else S = newState();
// the skiff is only bought at the yard (05.10.2026, Jonas: «Den båten der skal kun være tilgjengelig for kjøp i verftet … For alle
// brukere»): a save that still sails the free aluminium skiff it started with (the start boat until 04.10.2026: the first vessel, never
// traded, S.owned just ['skiff'] or not kept yet) gets Father's old wooden boat instead, and what does not fit her (the 90 hp outboard)
// is paid back at its price. A skiff bought at the yard (S.owned has more) stays. (A save migration about one old type by name, which
// the rule against branching on type names in game logic, vesseltest, does not cover.)
{ const v0 = S.fleet && S.fleet.length ? S.fleet[0] : null, on = fn => v0 ? withVessel(v0, fn) : fn(), OLD = 'skiff', isOld = t => !t || t === OLD;
  if ((!S.owned || (S.owned.length === 1 && isOld(S.owned[0]))) && on(() => isOld(S.boat.type))){
    let back = 0;
    on(() => { const b = S.boat; b.type = 'trebat'; b.fuel = Math.min(b.fuel || 0, VESSELS.trebat.fuelCap); b.engH = 0; b.svcAt = 0;
      for (const q of Object.keys(EQUIP)) if (S.equip && S.equip[q] && !equipFits(q, 'trebat')){ back += EQUIP[q].price * (EQUIP[q].multi ? S.equip[q] : 1); S.equip[q] = EQUIP[q].multi ? 0 : false; } });
    S.owned = ['trebat']; S.cash += back;
    log('Aluminiumsskiffen kan nå bare kjøpes på verftet. Du har fått fars gamle trebåt i stedet' + (back ? ', og ' + kr(back) + ' tilbake for utstyr som ikke passer i henne' : '') + '.',
      'The aluminium skiff can now only be bought at the yard. You have Father’s old wooden boat instead' + (back ? ', and ' + kr(back) + ' back for gear that does not fit her' : '') + '.');
  } }
{ const fixW = w => { if (w && w.port){ const q = portById(w.port); if (q){ w.x = q.p.x; w.y = q.p.y; } } };
  if (S.boat.status === 'port'){ const q = portById(S.boat.port); S.boat.pos = {x:q.p.x, y:q.p.y}; S.trail = [{x:q.p.x, y:q.p.y, port:q.id}]; }
  (S.draft || []).forEach(fixW); if (S.plan) S.plan.wps.forEach(fixW); S.trail.forEach(fixW);
  // real coastline: anything that now sits on land is brought back to a harbour
  if ((S.draft || []).some(w => isLand(w))) S.draft = [];
  const bb = S.boat, onLand = bb.status !== 'port' && isLand(bb.pos), badPlan = S.plan && S.plan.wps.slice(S.plan.idx).some((w, i, a) => isLand(w) || !legClear(i ? a[i - 1] : bb.pos, w));
  if (onLand || badPlan){
    const q = PORTS.slice().sort((a, b) => dist(a.p, bb.pos) - dist(b.p, bb.pos))[0];
    S.plan = null; bb.status = 'port'; bb.port = q.id; bb.pos = {x:q.p.x, y:q.p.y}; bb.v = 0; S.trail = [{x:q.p.x, y:q.p.y, port:q.id}];
    log('Kartet har fått ekte kystlinje. Båten er flyttet til ' + q.name + '.', 'The chart now has the real coastline. The boat was moved to ' + q.name + '.');
  } }
{ const d = newState(); for (const k of ['equip', 'crew', 'loan', 'member', 'msgs', 'sales', 'order', 'owned', 'stock', 'marks', 'jobs', 'prep', 'tripBuff', 'draftDep', 'navrows', 'company', 'boatName', 'tut', 'incidents', 'lore', 'tattoos', 'tat', 'sets', 'gseq', 'ops', 'lic', 'qseed', 'haill', 'pubE', 'target', 'streak', 'clothes', 'orders', 'rep', 'bors', 'cevt', 'workLog']) if (S[k] === undefined || (k === 'stock' && !S[k])) S[k] = d[k];
  if (!S.fm) S.fm = fmInit();   // blad B from the landing notes kept, and at once for a company that already has a closed-group right
  if (!adminOk()){ S.mult = 1; if (S.adm) S.adm.noEnergy = false; }
  // one clock for everyone (core/01-world.js): no pace of one's own, and the world's seed for the quota years, stocks and sellers
  if (WCLOCK.on){ S.mult = 1; S.qseed = WORLD_SEED; }   // the Admin app's pace and energy are only Jonas's (cloud adminOk)
  if (!S.boat.type) S.boat.type = 'trebat'; if (S.boat.engH === undefined){ S.boat.engH = 0; S.boat.svcAt = 0; }
  delete S.settings.bleed;   // never used; the fish is always bled at the rail
  if (typeof S.tut === 'number') S.tut = 0;   // saves from before «Første tur» are not sent through it
  applyVessel(); if (!S.settings.chart) S.settings.chart = S.settings.plotter && S.equip.plotter ? 'fish' : 'nav'; if (S.settings.heatSp && !HEAT.sp.includes(S.settings.heatSp)) delete S.settings.heatSp;
  if (S.boat.status === 'port' && portById(S.boat.port)){ const pp = portById(S.boat.port).p; S.boat.pos = {x:pp.x, y:pp.y}; }
  if (S.fleet && S.fleet.length){ ensureFleet(); for (const v of S.fleet) withVessel(v, () => { if (S.boat.status === 'port' && portById(S.boat.port)){ const pp = portById(S.boat.port).p; S.boat.pos = {x:pp.x, y:pp.y}; } }); } else ensureFleet(); }
// every vessel gets its gear locker (saves from before passive gear have none, also on vessels that are not bound)
for (const v of S.fleet) withVessel(v, () => { if (!S.pgear) S.pgear = newPGear(); });
// «Kaffe på kaia» was replaced by the daily login bonus on 01.10.2026: unused free pub rounds are paid out, borrowed deck tubs
// and the clean-hull bonus are gone, and the bonus starts at zero
if (S.daily){ const v = S.daily.pubV || 0; if (v > 0){ S.cash += v * PUB_COST; log('Kaffe på kaia er lagt ned. Du fikk ' + kr(v * PUB_COST) + ' for ' + v + (v > 1 ? ' ubrukte pubrunder.' : ' ubrukt pubrunde.'), '«Coffee on the quay» is gone. You got ' + kr(v * PUB_COST) + ' for ' + v + ' unused pub round' + (v > 1 ? 's.' : '.')); } delete S.daily; }
// trim was for good and free to try until 05.10.2026; now it is for a while and bought (core BOOSTS): the old fittings go
for (const v of S.fleet || []) if (v.boat) delete v.boat.boost; if (S.boat) delete S.boat.boost;
if (!S.haillInv) S.haillInv = {haill:0, luksus:0}; if (S.haill && !HAILL[S.haill.type]) S.haill.type = 'haill';   // the halibut luck is gone (04.10.2026)
// brown crab is out of the game (04.10.2026): what an old save has in its holds goes, and the key now means king crab
if (!S.kc){ S.kc = 1; let kg = 0;
  for (const v of S.fleet) withVessel(v, () => { kg += S.hold.reduce((a, x) => a + (x.sp === 'krabbe' ? x.kg : 0), 0); S.hold = S.hold.filter(x => x.sp !== 'krabbe'); });
  if (kg > 0.05) log('Taskekrabben er tatt ut av spillet. ' + fmt(kg, 1) + ' kg i lasten er fjernet. Teinene fisker nå kongekrabbe.', 'Brown crab is out of the game. ' + fmt(kg, 1) + ' kg in the hold has gone. The pots now fish king crab.'); }
delete S.tubs; delete S.clean; delete S.rodN; delete S.rodBest; for (const v of S.fleet || []){ delete v.tubs; delete v.clean; }
// before 01.10.2026 a hauler fitting had no length and never finished (until NaN, saved as null), which kept the boat in port
for (const v of S.fleet) withVessel(v, () => { for (const j of S.jobs || []) jobOk(j); if (S.plan && S.plan.depAt != null && !Number.isFinite(S.plan.depAt)) S.plan.depAt = S.t; });
// before 30.09.2026 a standing-plan trip with you aboard counted as the hired skipper's, and the landing lost its access
for (const v of S.fleet) withVessel(v, () => { const b = S.boat; if (S.plan && S.plan.ops && (b.status !== 'port' || b.land) && meAboard()) S.tripOwner = true; });
view.cx = HOME.x0 + MAP_W * 0.56; view.cy = HOME.y0 + MAP_H * 0.5;
{ const bp = S.boat.pos; if (bp.x < HOME.x0 || bp.x > HOME.x1 || bp.y < HOME.y0 || bp.y > HOME.y1){ view.cx = bp.x; view.cy = bp.y; } }   // a boat away from Senja: the chart round her
{ const r = svg.getBoundingClientRect(); const asp = (r.width / r.height) || 1; view.z = clamp(MAP_H * asp / MAP_W, 0.8, 1.6); }
refreshAll();
if (!S.intro) showIntro();
else if (!S.boatName) showIntro(true);
else { S.opens = (S.opens || 0) + 1; setTimeout(nameNudge, 8000); }   // the openings of a started game (registering, naming the boat: ui/10f-cloud.js)
// the badges: a game played before them is ticked for what it has done, and the gifts come once the screen is free (core/09f-merker.js)
achSeed(); setTimeout(() => achCheck(), 6000);
// the catch-up waits for the simulation's data (simReady below), so the time away is played with the real depths
AWAY = !S.intro || !S.boatName ? 0 : awayMs > 6000 ? awayMs : 0;
if (WCLOCK.on && S.intro && S.boatName && worldT() - S.t > 1) AWAY = Math.max(AWAY, 6001);   // behind the world's clock: catchUp plays the gap
lastWall = Date.now();
streakTouch();
refreshAll();
document.addEventListener('visibilitychange', () => { if (!document.hidden && streakTouch()){ save(); refreshAll(); } });
INSTR.show(); tab = 'route'; setBodyView(true);
// G3 comes from a later <script> (view3d.js): the clock starts when the whole page is read (it may be read already)
// the 3D view starts after Father's letter is put down: building it takes the main thread for seconds, and the letter's animation
// stood still meanwhile (ui/08b-letter.js)
mapOnReady(() => { setInterval(tick, 200); const go3d = () => { if (document.getElementById('letter') || document.getElementById('startPick')) setTimeout(go3d, 400); else G3.show(true, true); }; go3d(); });
// the simulation's data are in (bootMap), so the clock may run, and the time away is played
SIMREADY = true; CONT_D = null; renderBase(); panelDirty = true;
if (AWAY){ catchUp(AWAY + Date.now() - BOOT_T); AWAY = 0; refreshAll(); } lastWall = Date.now();
loadRoads().then(r => { ROADS = r; scheduleStatic(); if (g3Live()) G3.roadsReady(); }).catch(e => console.error(e));
loadFine().then(f => { FINE = f; if (g3Live()) G3.fineReady(); }).catch(e => console.error(e));
}
bootMap().then(cloudGate).then(() => { bootGame(); cloudHooks(); cloudStart(); }).catch(e => { console.error(e); const m = document.getElementById('modal'); if (m){ m.hidden = false; m.innerHTML = '<div class="card"><h2>Kartet lastet ikke</h2><p class="note">' + String(e && e.message || e) + '</p></div>'; } });
