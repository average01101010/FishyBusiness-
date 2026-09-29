// ---------- boot ----------
S = load();
let awayMs = 0;
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
{ const d = newState(); for (const k of ['equip', 'crew', 'loan', 'member', 'msgs', 'sales', 'order', 'owned', 'stock', 'marks', 'jobs', 'prep', 'tripBuff', 'draftDep', 'navrows', 'company', 'boatName', 'tut', 'incidents', 'lore', 'ops', 'lic', 'haill', 'pubE', 'target', 'daily', 'tubs', 'clean', 'clothes', 'orders', 'rep', 'bors', 'cevt', 'workLog']) if (S[k] === undefined || (k === 'stock' && !S[k])) S[k] = d[k];
  if (!S.boat.type) S.boat.type = 'skiff'; if (S.boat.engH === undefined){ S.boat.engH = 0; S.boat.svcAt = 0; }
  applyVessel(); if (!S.settings.chart) S.settings.chart = S.settings.plotter && S.equip.plotter ? 'fish' : 'nav'; if (!S.equip.plotter && S.settings.chart === 'fish') S.settings.chart = 'nav';
  if (S.boat.status === 'port' && portById(S.boat.port)){ const pp = portById(S.boat.port).p; S.boat.pos = {x:pp.x, y:pp.y}; }
  if (S.fleet && S.fleet.length){ ensureFleet(); for (const v of S.fleet) withVessel(v, () => { if (S.boat.status === 'port' && portById(S.boat.port)){ const pp = portById(S.boat.port).p; S.boat.pos = {x:pp.x, y:pp.y}; } }); } else ensureFleet(); }
view.cx = MAP_W * 0.56; view.cy = MAP_H * 0.5;
{ const r = svg.getBoundingClientRect(); const asp = (r.width / r.height) || 1; view.z = clamp(MAP_H * asp / MAP_W, 0.8, 1.6); }
refreshAll();
if (!S.intro) showIntro();
else if (!S.boatName) showIntro(true);
else if (awayMs > 6000) catchUp(awayMs);
lastWall = Date.now();
refreshAll();
setInterval(tick, 200);
INSTR.show(); tab = 'route'; setBodyView(true);
document.addEventListener('DOMContentLoaded', () => G3.show(true, true));
loadDepth().then(d => { if (!d) return; DEPTH = d; CONT_D = null; renderBase(); panelDirty = true; }).catch(e => console.error(e));
loadRoads().then(r => { ROADS = r; scheduleStatic(); if (G3.isActive()) G3.roadsReady(); }).catch(e => console.error(e));
loadFine().then(f => { FINE = f; if (G3.isActive()) G3.fineReady(); }).catch(e => console.error(e));
