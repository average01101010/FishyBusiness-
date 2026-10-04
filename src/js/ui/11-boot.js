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
  // the harbours (a new game starts in one, and every boat can go home) and the grounds (the talk on the quay weighs them all)
  for (const q of PORTS) pts.push(q.p); for (const g of GROUNDS) pts.push(g.p);
  await Promise.all([mapLoad(MAPD.core), ...pts.map(p => mapNeed(p, MAPD.simR))]);
  DEPTH = true;
}
function bootGame(){
S = load();
if (S){ awayMs = Date.now() - (S.lastReal || Date.now()); } else S = newState();
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
  if (!S.boat.type) S.boat.type = 'skiff'; if (S.boat.engH === undefined){ S.boat.engH = 0; S.boat.svcAt = 0; }
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
{ const r = svg.getBoundingClientRect(); const asp = (r.width / r.height) || 1; view.z = clamp(MAP_H * asp / MAP_W, 0.8, 1.6); }
refreshAll();
if (!S.intro) showIntro();
else if (!S.boatName) showIntro(true);
// the catch-up waits for the simulation's data (simReady below), so the time away is played with the real depths
AWAY = !S.intro || !S.boatName ? 0 : awayMs > 6000 ? awayMs : 0;
lastWall = Date.now();
streakTouch();
refreshAll();
document.addEventListener('visibilitychange', () => { if (!document.hidden && streakTouch()){ save(); refreshAll(); } });
INSTR.show(); tab = 'route'; setBodyView(true);
// G3 comes from a later <script> (view3d.js): the clock starts when the whole page is read (it may be read already)
mapOnReady(() => { setInterval(tick, 200); G3.show(true, true); });
// the simulation's data are in (bootMap), so the clock may run, and the time away is played
SIMREADY = true; CONT_D = null; renderBase(); panelDirty = true;
if (AWAY){ catchUp(AWAY + Date.now() - BOOT_T); AWAY = 0; refreshAll(); } lastWall = Date.now();
loadRoads().then(r => { ROADS = r; scheduleStatic(); if (g3Live()) G3.roadsReady(); }).catch(e => console.error(e));
loadFine().then(f => { FINE = f; if (g3Live()) G3.fineReady(); }).catch(e => console.error(e));
}
bootMap().then(bootGame).catch(e => { console.error(e); const m = document.getElementById('modal'); if (m){ m.hidden = false; m.innerHTML = '<div class="card"><h2>Kartet lastet ikke</h2><p class="note">' + String(e && e.message || e) + '</p></div>'; } });
