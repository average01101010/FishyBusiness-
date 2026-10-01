// ===== passive gear: nets, line and pots that stand in the sea while the boat is away =====
// Rules: cod nets north of 62° N have at least 156 mm mesh (maskeviddeforskriften); inside the fjord line at most 80 cod nets and 5,000
// hooks, and no vessel of 15 m or more (høstingsforskriften kap. VI); nets and line for halibut and monkfish are tended at least every
// 4th day, and each vessel hauls only its own pots (kap. V); lost gear must be reported (Fiskeridirektoratet, "Meld tapt redskap"); brown
// crab at least 13 cm across the shell (kap. X). A tub (stamp) holds about 300 hooks of bank line or 700 of haddock line; hand line stands
// 3–4 hours and other line overnight (Store norske leksikon, "line"). Catch rates, times, wear and prices are start values for play-testing.
// Gear aboard each vessel is S.pgear (a VKEY); gear in the sea is S.sets for the whole company, so the map and 3D can draw every buoy.
const GEAR = {
  garn:{no:'Garn', en:'Nets', u:['garn', 'garn', 'net', 'nets'], km:0.03, set:0.8, haul:4, hand:2.5, crewMin:2, haulers:['garnhaler'], q:0.07, skill:'garn'},
  line:{no:'Line', en:'Line', u:['stamp', 'stamper', 'tub', 'tubs'], kmHook:0.0015, set:5, haul:25 / 700, hand:2.0, crewMin:1, haulers:['linehaler', 'elhaler'], q:0.032, skill:'line'},
  teine:{no:'Teiner', en:'Pots', u:['teine', 'teiner', 'pot', 'pots'], km:0.025, set:0.9, haul:1.2, hand:2.5, crewMin:1, haulers:['teinehaler', 'elhaler'], q:0.12, skill:'teiner'}
};
const LINE_KINDS = {hyse:{no:'Hyseline', en:'Haddock line', hooks:700, price:2100, egn:500, baitKg:5}, bank:{no:'Bankline', en:'Bank line', hooks:300, price:1700, egn:300, baitKg:3}};
const POTS = {small:{no:'Små teiner', en:'Small pots', price:550, cap:8, f:1}, big:{no:'Store teiner', en:'Big pots', price:850, cap:15, f:1.4, big:true}};
const MESHES = [156, 180, 200];                                  // legal cod nets north of 62° N; bigger mesh, bigger fish
const GPRICE = {net:1500, kit:2500, heavy:1500, bait:18, potBait:0.4, bot:180, egnRate:560};   // kr, kg bait per pot, bøteri kr per net per 0.1, hooks baited per hour
const FJORD_MAX = {nets:80, hooks:5000};
const GFINE = {crab:2000, perCrab:100};                          // overtredelsesgebyr for undersized crab: a placeholder, not checked against a source
// how well each gear takes each species, relative to the jig (1 for every fish); pots take crab and a little cod and tusk
const SELQ = {
  garn:{torsk:1.0, hyse:0.45, sei:0.7, lyr:0.6, lange:0.35, brosme:0.25, uer:0.3, kveite:0.35},
  'line:hyse':{torsk:0.7, hyse:2.6, sei:0.15, lyr:0.2, lange:0.8, brosme:1.0, uer:0.3, kveite:0.6},
  'line:bank':{torsk:0.8, hyse:0.8, sei:0.1, lyr:0.15, lange:2.4, brosme:2.8, uer:0.4, kveite:1.8},
  teine:{torsk:0.012, brosme:0.008}
};
const GK = {torsk:1, hyse:1.05, sei:1, lyr:1, lange:0.8, brosme:0.95, uer:1.15, kveite:0.7};   // body shape in the mesh: optimal length per mm mesh
const CRAB = {roeM:[0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.08, 0.04, 0.03, 0.06, 0.1, 0.1], claws:[0.97, 0.92], slack:[0.06, 0.12]};   // berried share of females; intact claws careful/quick; kept by quick sorting (undersized, berried)
const gearKey = s => s.kind === 'line' ? 'line:' + s.lk : s.kind;
const setMid = s => ({x:(s.a.x + s.b.x) / 2, y:(s.a.y + s.b.y) / 2});
const tideRate = H => Math.abs(tideH(H + 0.5) - tideH(H - 0.5));
function crabArea(p){ return 0.35 + 0.9 * sstep(35, 75, p.y); }   // brown crab is common south of Senja and thin north of it (IMR 2023–24)
function newPGear(){ return {nets:[], lines:{hyse:{n:0, baited:0}, bank:{n:0, baited:0}}, pots:{small:0, big:0}, bait:0, kits:{n:0, heavy:0}, shore:[]}; }
const gid = p => p + (S.gseq = (S.gseq || 0) + 1);
const gL = (no, en) => S.lang === 'no' ? no : en;
const unitName = (kind, n) => { const u = GEAR[kind].u; return S.lang === 'no' ? (n === 1 ? u[0] : u[1]) : (n === 1 ? u[2] : u[3]); };
// the vessel that owns a set, and a log line in that vessel's deck log
const setVessel = s => (S.fleet || []).find(v => v.id === s.vid);
function setLog(s, no, en, k){ const v = setVessel(s); if (v) onVessel(v, () => log(no, en, k)); else log(no, en, k); }
function mySets(vid){ return (S.sets || []).filter(s => s.vid === (vid || S.cur) && !s.lost); }
function hasHauler(kind){ return GEAR[kind].haulers.some(k => S.equip && S.equip[k]); }

// ---- what the vessel owns: aboard, ashore (baiting, mending) and in the sea
function ownedUnits(kind){
  const pg = S.pgear || newPGear(), sea = mySets().filter(s => s.kind === kind).reduce((a, s) => a + s.n, 0);
  const shore = (pg.shore || []).reduce((a, j) => a + (kind === 'garn' && (j.kind === 'bot' || j.kind === 'mendself') ? j.lenke.n : kind === 'line' && (j.kind === 'egn' || j.kind === 'egnself') ? j.n : 0), 0);
  if (kind === 'garn') return pg.nets.reduce((a, l) => a + l.n, 0) + sea + shore;
  if (kind === 'line') return pg.lines.hyse.n + pg.lines.bank.n + sea + shore;
  return pg.pots.small + pg.pots.big + sea;
}
function gearRoom(kind){ const m = (BOAT.gearMax || {})[kind === 'line' ? 'stamp' : kind] || 0; return Math.max(0, m - ownedUnits(kind)); }

// ---- buying (in port)
function buyGear(what, spec, n){
  const pg = S.pgear, b = S.boat; n = Math.max(1, Math.round(n || 1));
  if (b.status !== 'port') return [gL('Redskap kjøpes i havn.', 'Gear is bought in port.')];
  let cost = 0, kind = null;
  if (what === 'net'){ kind = 'garn'; if (!MESHES.includes(spec)) return [gL('Torskegarn nord for 62° N skal ha minst 156 mm maskevidde.', 'Cod nets north of 62° N must have at least 156 mm mesh.')]; cost = n * GPRICE.net; }
  else if (what === 'stamp'){ kind = 'line'; cost = n * LINE_KINDS[spec].price; }
  else if (what === 'pot'){ kind = 'teine'; cost = n * POTS[spec].price; }
  else if (what === 'kit') cost = n * GPRICE.kit;
  else if (what === 'heavy') cost = n * GPRICE.heavy;
  else if (what === 'bait') cost = n * GPRICE.bait;
  if (kind && gearRoom(kind) < n) return [gL('Det er ikke plass til mer ' + GEAR[kind].no.toLowerCase() + ' på denne båten.', 'There is no room for more ' + GEAR[kind].en.toLowerCase() + ' on this vessel.')];
  if (what === 'heavy' && pg.kits.heavy + n > pg.kits.n) return [gL('Tunge dregger kjøpes til blåsesett du har.', 'Heavy anchors go with buoy sets you own.')];
  if (cost > S.cash) return [gL('Ikke nok penger.', 'Not enough money.')];
  S.cash -= cost; S.stats.costs += cost;
  if (what === 'net') pg.nets.push({id:gid('n'), mesh:spec, n, cond:1});
  else if (what === 'stamp') pg.lines[spec].n += n;
  else if (what === 'pot') pg.pots[spec] += n;
  else if (what === 'kit') pg.kits.n += n;
  else if (what === 'heavy') pg.kits.heavy += n;
  else if (what === 'bait') pg.bait += n;
  return null;
}
// join two lenker of the same mesh, or split one
function joinNets(id1, id2){ const pg = S.pgear, a = pg.nets.find(l => l.id === id1), c = pg.nets.find(l => l.id === id2); if (!a || !c || a === c || a.mesh !== c.mesh) return false; a.cond = (a.cond * a.n + c.cond * c.n) / (a.n + c.n); a.n += c.n; pg.nets.splice(pg.nets.indexOf(c), 1); return true; }
function splitNets(id, n){ const pg = S.pgear, a = pg.nets.find(l => l.id === id); if (!a || n < 1 || n >= a.n) return false; a.n -= n; pg.nets.push({id:gid('n'), mesh:a.mesh, n, cond:a.cond}); return true; }

// ---- rules for setting at a place
// distance from a point to the string between the buoys
function segDist(p, a, b){ const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy, t = L2 ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L2, 0, 1) : 0; return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); }
function nearSet(p, km){ let best = null, bd = km || 0.3; for (const s of mySets()){ const d = Math.min(dist(p, s.a), dist(p, s.b)); if (d < bd){ bd = d; best = s; } } return best; }
function gearRules(kind, spec, p){
  const b = S.boat, pg = S.pgear;
  if (b.gop) return [gL('Redskapsarbeidet er allerede i gang.', 'Gear work is already going on.')];
  if (b.status !== 'idle' && b.status !== 'fishing') return [gL('Båten må ligge stille på feltet.', 'The boat must lie still on the grounds.')];
  if (handsAboard() < GEAR[kind].crewMin) return [gL('Garn krever minst to om bord: deg og én til, eller to fra mannskapet.', 'Nets need at least two aboard: you and one more, or two of the crew.')];
  if (depthF(p) < 5) return [gL('For grunt til å sette her.', 'Too shallow to set here.')];
  if (pg.kits.n < 1) return [gL('Du trenger et blåsesett: to blåser med stake, flagg og dregg.', 'You need a buoy set: two buoys with pole, flag and anchor.')];
  let nets = 0, hooks = 0;
  if (kind === 'garn'){ const l = pg.nets.find(x => x.id === spec.nid); if (!l) return [gL('Velg ei garnlenke.', 'Choose a string of nets.')]; nets = l.n; }
  else if (kind === 'line'){ const L0 = pg.lines[spec.lk]; if (!L0 || spec.n < 1 || L0.baited < spec.n) return [gL('Du har ikke så mange egnede stamper om bord.', 'You do not have that many baited tubs aboard.')]; hooks = spec.n * LINE_KINDS[spec.lk].hooks; }
  else { if (!(pg.pots[spec.pot] >= spec.n) || spec.n < 1) return [gL('Du har ikke så mange teiner om bord.', 'You do not have that many pots aboard.')]; if (pg.bait < spec.n * GPRICE.potBait) return [gL('Teinene trenger agn: ' + fmt(spec.n * GPRICE.potBait, 0) + ' kg.', 'The pots need bait: ' + fmt(spec.n * GPRICE.potBait, 0) + ' kg.')]; }
  if (insideFjord(p)){
    if (BOAT.len >= 15) return [gL('Fartøy på 15 meter eller mer kan ikke fiske innenfor fjordlinja.', 'Vessels of 15 m or more may not fish inside the fjord line.')];
    const inside = mySets().filter(s => insideFjord(setMid(s)));
    if (nets && inside.filter(s => s.kind === 'garn').reduce((a, s) => a + s.n, 0) + nets > FJORD_MAX.nets) return [gL('Innenfor fjordlinja kan du ha høyst 80 torskegarn i sjøen.', 'Inside the fjord line you may have at most 80 cod nets in the sea.')];
    if (hooks && inside.filter(s => s.kind === 'line').reduce((a, s) => a + s.hooks, 0) + hooks > FJORD_MAX.hooks) return [gL('Innenfor fjordlinja kan du ha høyst 5 000 kroker i sjøen.', 'Inside the fjord line you may have at most 5,000 hooks in the sea.')];
  }
  return null;
}
// where the string goes: along the course, or turned until both ends are at sea on at least 5 m of water
function setGeom(p, hdg, km){
  for (const d of [0, 0.5, -0.5, 1, -1, 1.57, -1.57, 2.3, -2.3, 3.14]){ const h = hdg + d, e = {x:p.x + Math.sin(h) * km, y:p.y - Math.cos(h) * km};
    if (!isLand(e) && depthF(e) >= 5 && legClear(p, e)) return {a:{x:p.x, y:p.y}, b:e, h}; }
  return null;
}

// exactly where it is drawn on the chart (ui/03d-setmode.js), or null when that does not work
function setGeomExact(p, hdg, km){ const e = {x:p.x + Math.sin(hdg) * km, y:p.y - Math.cos(hdg) * km}; return !isLand(e) && depthF(e) >= 5 && legClear(p, e) ? {a:{x:p.x, y:p.y}, b:e, h:hdg} : null; }

// ---- the work at sea: status stays 'fishing' with b.gop, so deck work, rest rules, auto-return and the tub pause work as before
function gopUnitMin(g, H, hs){
  const G = GEAR[g.kind], P = handsAboard(), onDeck = P >= 2 && deckPending() > 0.5 ? 1 : 0, w = Math.max(1, P - onDeck), team = crewAboard();
  const crewF = teamEff(team, meAboard(), G.skill) * (1 + (g.kind === 'garn' ? 0.4 : 0.3) * (w - 1));
  let base = g.op === 'set' ? G.set : G.haul;
  if (g.kind === 'line') base = g.op === 'set' ? G.set * g.hooksPer / 700 : G.haul * g.hooksPer;
  const hand = g.op === 'haul' && !hasHauler(g.kind) ? G.hand : 1;
  const sort = g.op === 'haul' && g.kind === 'teine' && S.settings.crabSort !== false ? 1.3 : 1;
  return base * hand * sort * (1 + coldPen(H, hs)) / crewF;
}
// hdg: the course drawn on the chart; the gear goes out exactly there or not at all. Without it the string follows the course
function startSet(kind, spec, fishAfter, hdg){
  const b = S.boat, pg = S.pgear, why = gearRules(kind, spec, b.pos); if (why) return why;
  let n, km, s = {kind};
  if (kind === 'garn'){ const l = pg.nets.find(x => x.id === spec.nid); n = l.n; km = n * GEAR.garn.km; Object.assign(s, {mesh:l.mesh, lid:l.id, cond:l.cond}); }
  else if (kind === 'line'){ n = spec.n; km = n * LINE_KINDS[spec.lk].hooks * GEAR.line.kmHook; Object.assign(s, {lk:spec.lk, hooks:n * LINE_KINDS[spec.lk].hooks}); }
  else { n = spec.n; km = n * GEAR.teine.km; Object.assign(s, {pot:spec.pot}); }
  const geo = hdg != null ? setGeomExact(b.pos, hdg, km) : setGeom(b.pos, b.heading || 0, km); if (!geo) return [gL('Det er ikke plass til redskapet her. Prøv lenger ut.', 'There is no room for the gear here. Try further out.')];
  // the gear leaves the deck as it goes over the side; it is reserved now
  if (kind === 'garn') pg.nets.splice(pg.nets.findIndex(x => x.id === spec.nid), 1);
  else if (kind === 'line'){ pg.lines[spec.lk].n -= n; pg.lines[spec.lk].baited -= n; }
  else { pg.pots[spec.pot] -= n; pg.bait -= n * GPRICE.potBait; }
  const heavy = pg.kits.heavy > 0; pg.kits.n--; if (heavy) pg.kits.heavy--;
  Object.assign(s, {n, heavy});
  if (hdg != null) b.heading = hdg;
  b.status = 'fishing'; b.fishUntil = null; b.deckStop = false; b.deckEnd = null;
  b.gop = {op:'set', kind, s, n, done:0, prog:0, a:geo.a, b:geo.b, fishAfter:fishAfter || 0, hooksPer:kind === 'line' ? LINE_KINDS[spec.lk].hooks : 0};
  log('Setter ' + n + ' ' + unitName(kind, n) + '.', 'Setting ' + n + ' ' + unitName(kind, n) + '.');
  return null;
}
function startHaul(sid, reset, fishAfter){
  const b = S.boat, s = (S.sets || []).find(x => x.id === sid);
  if (!s || s.lost) return [gL('Finner ikke redskapet.', 'Cannot find the gear.')];
  if (s.vid !== S.cur) return [gL('Hvert fartøy trekker bare sitt eget redskap.', 'Each vessel hauls only its own gear.')];
  if (b.gop) return [gL('Redskapsarbeidet er allerede i gang.', 'Gear work is already going on.')];
  if (b.status !== 'idle' && b.status !== 'fishing') return [gL('Båten må ligge stille ved blåsa.', 'The boat must lie still at the buoy.')];
  const da = dist(b.pos, s.a), db = dist(b.pos, s.b); if (Math.min(da, db) > 0.3) return [gL('Gå helt inn til blåsa først.', 'Go right up to the buoy first.')];
  if (handsAboard() < GEAR[s.kind].crewMin) return [gL('Garn krever minst to om bord: deg og én til, eller to fra mannskapet.', 'Nets need at least two aboard: you and one more, or two of the crew.')];
  if (s.kind === 'teine' && POTS[s.pot].big && !S.equip.teinehaler) return [gL('Store teiner kan ikke trekkes for hånd. Du trenger teinehaler.', 'Big pots cannot be hauled by hand. You need a pot hauler.')];
  s.hauling = true;
  const from = da <= db ? s.a : s.b, to = da <= db ? s.b : s.a;
  b.status = 'fishing'; b.fishUntil = null; b.deckStop = false; b.deckEnd = null;
  b.gop = {op:'haul', kind:s.kind, sid, n:s.n, done:0, prog:0, a:{...from}, b:{...to}, reset:!!reset, fishAfter:fishAfter || 0, kg:0, rel:0, dead:0, hooksPer:s.kind === 'line' ? s.hooks / s.n : 0, soak:(S.t - s.tSet) / 60};
  S.gacc = {}; S.gnext = {};
  log('Trekker ' + GEAR[s.kind].no.toLowerCase() + ': ' + s.n + ' ' + unitName(s.kind, s.n) + ', sto ' + fmt(b.gop.soak, 0) + ' t.', 'Hauling ' + GEAR[s.kind].en.toLowerCase() + ': ' + s.n + ' ' + unitName(s.kind, s.n) + ', soaked ' + fmt(b.gop.soak, 0) + ' h.');
  return null;
}
function gearOpMinute(H, W, hs){
  const b = S.boat, g = b.gop; b.lastGear = GEAR[g.kind].skill;
  if (handsAboard() < GEAR[g.kind].crewMin){ gopAbort('crew'); return; }
  if (g.op === 'haul' && holdTotal() >= capHold() - 0.01){ log('Lasten er full. Resten av redskapet står igjen.', 'The hold is full. The rest of the gear stays in the sea.'); gopAbort('full'); return; }
  g.prog += 1 / gopUnitMin(g, H, hs);
  while (g.prog >= 1 && g.done < g.n){ g.prog -= 1; g.done++; if (g.op === 'haul') haulUnit(g, H); }
  const f = Math.min(1, (g.done + g.prog) / g.n); b.pos = {x:g.a.x + (g.b.x - g.a.x) * f, y:g.a.y + (g.b.y - g.a.y) * f};
  if (Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y) > 1e-6) b.heading = Math.atan2(g.b.x - g.a.x, -(g.b.y - g.a.y));
  b.v = 2.5;
  if (g.done >= g.n) (g.op === 'set' ? finishSet : finishHaul)(g, H);
}
function finishSet(g, H){
  const b = S.boat, s = Object.assign(g.s, {id:gid('s'), vid:S.cur, a:g.a, b:g.b, tSet:S.t, depth:Math.round(depthF(setMid({a:g.a, b:g.b}))), acc:{}, dead:0, lost:null, rep:false, warn:0});
  S.sets = S.sets || []; S.sets.push(s);
  // the deck log's gear tab keeps every set, also after it is hauled (ui/06b-book-tabs.js)
  S.gearLog = S.gearLog || []; S.gearLog.push(gearLogEntry(s)); if (S.gearLog.length > 60) S.gearLog.shift();
  const what = s.kind === 'garn' ? s.n + ' garn (' + s.mesh + ' mm)' : s.kind === 'line' ? s.n + ' ' + (s.n === 1 ? 'stamp' : 'stamper') + ' ' + LINE_KINDS[s.lk].no.toLowerCase() : s.n + ' ' + POTS[s.pot].no.toLowerCase();
  const whatEn = s.kind === 'garn' ? s.n + ' nets (' + s.mesh + ' mm)' : s.kind === 'line' ? s.n + ' ' + (s.n === 1 ? 'tub' : 'tubs') + ' of ' + LINE_KINDS[s.lk].en.toLowerCase() : s.n + ' ' + POTS[s.pot].en.toLowerCase();
  log('Satte ' + what + ' på ' + s.depth + ' m, ' + coordStr(setMid(s)) + '.', 'Set ' + whatEn + ' at ' + s.depth + ' m, ' + coordStr(setMid(s)) + '.', 'nav');
  gopEnd(g);
}
function gopEnd(g){ const b = S.boat; b.gop = null; b.v = 0; b.gopQuiet = true; b.fishUntil = S.t + (g.fishAfter || 0) * 60; S.gacc = null; S.gnext = null; }
// stop halfway: what is set stays in the sea as a shorter string, what is hauled is aboard
function gopAbort(why){
  const b = S.boat, g = b.gop; if (!g) return;
  if (g.op === 'set'){
    if (g.done >= 1){ g.n = g.done; const s = g.s; s.n = g.done; if (s.kind === 'line') s.hooks = g.done * g.hooksPer; g.b = {x:b.pos.x, y:b.pos.y}; finishSet(g, S.t / 60); }
    // nothing went over the side: the gear, the buoy set, the bait on the hooks and in the pots all come back
    else { const pg = S.pgear, s = g.s; gearBack(s, s.n, s.cond); pg.kits.n++; if (s.heavy) pg.kits.heavy++; if (s.kind === 'line') pg.lines[s.lk].baited += s.n; else if (s.kind === 'teine') pg.bait += s.n * GPRICE.potBait;
      log('Setting avbrutt. Redskapet er tatt om bord igjen.', 'Setting stopped. The gear is back aboard.'); b.gop = null; }
  } else {
    const s = S.sets.find(x => x.id === g.sid);
    if (s && g.done > 0 && g.done < s.n){ gearBack(s, g.done, wearNets(s, g)); s.n -= g.done; if (s.kind === 'line') s.hooks = s.n * g.hooksPer; s.a = {x:b.pos.x, y:b.pos.y}; s.b = {...g.b}; }
    if (s) s.hauling = false;
    log('Trekkingen stoppet. ' + (s ? s.n + ' ' + unitName(s.kind, s.n) + ' står igjen i sjøen.' : ''), 'Hauling stopped. ' + (s ? s.n + ' ' + unitName(s.kind, s.n) + ' remain in the sea.' : ''));
    b.gop = null;
  }
  b.v = 0; S.gacc = null; S.gnext = null;
  if (why !== 'return' && why !== 'dock' && b.status === 'fishing'){ b.gopQuiet = true; b.fishUntil = S.t; }
}
// gear back on deck after hauling (or a stopped set); nets with their condition
function gearBack(s, n, cond){
  const pg = S.pgear;
  if (s.kind === 'garn'){ if (n > 0) pg.nets.push({id:s.lid && !pg.nets.some(l => l.id === s.lid) ? s.lid : gid('n'), mesh:s.mesh, n, cond:cond != null ? cond : s.cond}); }
  else if (s.kind === 'line') pg.lines[s.lk].n += n;
  else pg.pots[s.pot] += n;
}
// wear on a string of nets from one haul: more with a heavy catch, crab in the net, rough sea and long soaks; a worn net can go to pieces
function wearNets(s, g){
  if (s.kind !== 'garn') return null;
  const kgpn = (g.kg || 0) / Math.max(1, g.done), hs = hsAt(setMid(s), S.t / 60), crab = density('krabbe', setMid(s), S.t / 60) > 0.05 ? 1.3 : 1;
  const w = 0.05 * (1 + kgpn / 60) * (hs > 2 ? 1.4 : 1) * ((g.soak || 0) > 48 ? 1.5 : 1) * crab;
  return Math.max(0, Math.round((s.cond - w) * 100) / 100);
}
// one unit (net, tub, pot) over the rail: its share of what the string has caught
function haulUnit(g, H){
  const b = S.boat, s = S.sets.find(x => x.id === g.sid); if (!s) return;
  const left = s.n - g.done + 1, f = 1 / left, mid = setMid(s), hook = s.kind === 'line';
  (b.tripGear = b.tripGear || {})[s.kind] = 1;
  for (const sp in s.acc){
    const A = s.acc[sp], kg = A.kg * f, n = A.n * f, ts = A.ts * f; A.kg -= kg; A.n -= n; A.ts -= ts; if (kg <= 0) continue;
    if (sp === 'krabbe'){ landCrabs(g, n, kg); continue; }
    const age = kg > 0 ? S.t / 60 - ts / kg : 0;
    let fresh = s.kind === 'line' ? 100 - 2.5 * Math.max(0, age - 5) - 4 * Math.max(0, g.soak - 24)
      : s.kind === 'garn' ? 84 - (1 + 0.3 * Math.max(0, seasonal(SST, H) - 3)) * age - 3 * Math.max(0, g.soak - 24) : 90;
    fresh = clamp(fresh, 5, 100);
    g.kg += landFish(sp, kg, gearKey(s), s.mesh, mid, H, hook, fresh, g);
  }
  if (s.dead > 0){ const d = s.dead * f; s.dead -= d; g.dead += d; }
}
// kg of one species from the gear becomes single fish of the sizes this gear takes; undersized and closed-season fish go back
function landFish(sp, kg, key, mesh, p, H, hook, fresh, g){
  const acc = S.gacc || (S.gacc = {}), nx = S.gnext || (S.gnext = {}); let got = 0, room = capHold() - holdTotal();
  acc[sp] = (acc[sp] || 0) + kg;
  while (room > 0.01){
    if (!nx[sp]) nx[sp] = sampleSel(sp, key, mesh, p, H);
    if (acc[sp] < nx[sp]) break;
    const w = nx[sp]; acc[sp] -= w; nx[sp] = 0;
    if (w < SPECIES[sp].minKg || (SPECIES[sp].maxKg && w > SPECIES[sp].maxKg) || (sp === 'kveite' && kveiteClosed(H))){ S.stats.released = (S.stats.released || 0) + 1; if (g) g.rel++; continue; }
    const k = Math.min(w, room); room -= k; addCatch(sp, k, clsOf(sp, w), hook, {fresh}); got += k;
    if (typeof window !== 'undefined'){ const cq = window.CATCHQ || (window.CATCHQ = []); if (cq.length < 30) cq.push({sp, kg:k, t:performance.now()}); }
  }
  return got;
}
// size selection: nets keep fish near the optimal length for the mesh (and big fish that tangle); hooks let the smallest go
function netLen(w){ return Math.pow(1000 * w / 0.0068, 1 / 3.1); }
function retain(sp, key, mesh, w){
  if (key === 'garn'){ const L = netLen(w), Lo = 0.40 * mesh * (GK[sp] || 1), r = Math.exp(-0.5 * ((L - Lo) / (0.18 * Lo)) ** 2); return L > Lo ? Math.max(r, 0.35 * Math.exp(-(L - Lo) / (0.5 * Lo))) : r; }
  if (key === 'line:hyse') return sstep(0.35, 0.9, w);
  if (key === 'line:bank') return sstep(0.8, 2.2, w);
  return 1;
}
function sampleSel(sp, key, mesh, p, H){ let w = 0; for (let i = 0; i < 24; i++){ w = sampleFish(sp, p, H); if (Math.random() < retain(sp, key, mesh, w)) return w; } return w; }
// crabs: sex, width, roe and claws are drawn as they come up; sorting sends the small and berried ones back
function crabW(cw){ return Math.round(0.00018 * cw * cw * cw * 100) / 100; }
function landCrabs(g, n, kg){
  const H = S.t / 60, m = gDate(H).getUTCMonth(), careful = S.settings.crabSort !== false, sk = clamp(teamEff(crewAboard(), meAboard(), 'teiner'), 0.6, 1.3);
  S.gacc = S.gacc || {}; S.gacc.crabN = (S.gacc.crabN || 0) + n; let room = capHold() - holdTotal();
  while (S.gacc.crabN >= 1 && room > 0.05){
    S.gacc.crabN -= 1;
    const cw = SPECIES.krabbe.cw[0] * Math.exp(SPECIES.krabbe.cw[1] * gauss(Math.random(), Math.random())), w = crabW(cw), fem = Math.random() < 0.5;
    const small = cw < SPECIES.krabbe.minCw, roe = fem && Math.random() < CRAB.roeM[m];
    let cls = small ? 2 : roe ? 3 : fem ? 0 : 1;
    if (small || roe){ const keep = !careful && Math.random() < (small ? CRAB.slack[0] : CRAB.slack[1]) / sk; if (!keep){ S.stats.released = (S.stats.released || 0) + 1; g.rel++; continue; } }
    const claws = Math.random() < CRAB.claws[careful ? 0 : 1];
    const k = Math.min(w, room); room -= k; addCatch('krabbe', k, cls, false, {fresh:claws ? 100 : 60}); g.kg += k;
    if (typeof window !== 'undefined'){ const cq = window.CATCHQ || (window.CATCHQ = []); if (cq.length < 30) cq.push({sp:'krabbe', kg:k, t:performance.now()}); }
  }
  void kg;
}
function finishHaul(g, H){
  const b = S.boat, s = S.sets.find(x => x.id === g.sid); if (!s){ gopEnd(g); return; }
  const cond = wearNets(s, g);
  S.sets.splice(S.sets.indexOf(s), 1);
  { const e = (S.gearLog || []).find(x => x.id === s.id); if (e){ e.tHaul = S.t; e.kg = Math.round(g.kg || 0); } }
  let tore = 0;
  if (s.kind === 'garn' && cond < 0.25){ const p = Math.min(1, 3 * (0.25 - cond) + (cond <= 0 ? 1 : 0)); for (let i = 0; i < s.n; i++) if (Math.random() < p) tore++; }
  const back = s.n - tore;
  gearBack(s, back, cond);
  S.pgear.kits.n++; if (s.heavy) S.pgear.kits.heavy++;
  const what = GEAR[s.kind].no.toLowerCase(), whatEn = GEAR[s.kind].en.toLowerCase();
  log('Trakk ' + what + ': ' + fmt(g.kg, 0) + ' kg, sto ' + fmt(g.soak, 0) + ' t' + (g.rel ? ', ' + g.rel + (s.kind === 'teine' ? ' krabber satt ut igjen' : ' fisk sluppet') : '') + (g.dead >= 1 ? ', ' + Math.round(g.dead) + ' døde krabber kastet' : '') + '.',
    'Hauled ' + whatEn + ': ' + fmt(g.kg, 0) + ' kg, soaked ' + fmt(g.soak, 0) + ' h' + (g.rel ? ', ' + g.rel + (s.kind === 'teine' ? ' crabs put back' : ' fish released') : '') + (g.dead >= 1 ? ', ' + Math.round(g.dead) + ' dead crabs thrown' : '') + '.');
  if (tore) log(tore + ' garn gikk i filler. De var for slitt.', tore + ' nets went to pieces. They were too worn.');
  else if (s.kind === 'garn' && cond < 0.35) log('Garna er slitt (' + Math.round(cond * 100) + ' %). Bøt dem før de går i filler.', 'The nets are worn (' + Math.round(cond * 100) + ' %). Mend them before they go to pieces.');
  S.marks.push({x:setMid(s).x, y:setMid(s).y, t:S.t, kgph:0, g:s.kind, kgpu:Math.round(g.kg / Math.max(1, s.n) * 10) / 10}); if (S.marks.length > 80) S.marks.shift();
  // set the same gear again where it stood (line has to be baited in port first)
  if (g.reset && back > 0 && s.kind !== 'line'){
    const spec = s.kind === 'garn' ? {nid:S.pgear.nets[S.pgear.nets.length - 1].id} : {pot:s.pot, n:back};
    // back to where the string started, and out again along the same line
    b.gop = null; b.pos = {...s.a}; b.heading = Math.atan2(s.b.x - s.a.x, -(s.b.y - s.a.y));
    const why = startSet(s.kind, spec, g.fishAfter);
    if (why){ log(why[0], why[0]); gopEnd(g); }
    return;
  }
  gopEnd(g);
}

// ---- a station on a route or the standing plan: haul what stands here and set it again, or set new gear if nothing stands here.
// Before a gale (over 17 m/s within 36 hours) the gear is brought home instead of set again.
function cycleSpec(kind, want){
  const pg = S.pgear;
  if (kind === 'garn'){ const l = pg.nets.find(x => !want || x.mesh === want.mesh) || pg.nets[0]; return l ? {nid:l.id} : null; }
  if (kind === 'line'){ const lk = want && want.lk && pg.lines[want.lk].baited ? want.lk : pg.lines.hyse.baited ? 'hyse' : 'bank'; return pg.lines[lk].baited ? {lk, n:pg.lines[lk].baited} : null; }
  const pot = want && want.pot && pg.pots[want.pot] ? want.pot : pg.pots.big ? 'big' : 'small', n = Math.min(pg.pots[pot], Math.floor(pg.bait / GPRICE.potBait + 1e-9)); return n > 0 ? {pot, n} : null;
}
function gearCycle(w, fishAfter){
  const a = w.act, b = S.boat, H = S.t / 60;
  let gale = false; for (let k = 0; k <= 36; k += 3) if (windAt(H + k) > 17) gale = true;
  const s = mySets().find(x => x.kind === a.kind && segDist(w, x.a, x.b) < 0.5);
  if (s){ b.pos = dist(b.pos, s.a) <= dist(b.pos, s.b) ? {...s.a} : {...s.b}; const why = startHaul(s.id, a.kind !== 'line' && !gale, fishAfter); if (!why && gale) log('Kuling i varselet. Tar redskapet med hjem.', 'A gale in the forecast. Taking the gear home.'); return why; }
  if (gale) return [gL('Kuling i varselet. Setter ikke ut redskap nå.', 'A gale in the forecast. Not setting gear now.')];
  const spec = cycleSpec(a.kind, a.spec && (a.kind === 'garn' ? {mesh:(S.pgear.nets.find(l => l.id === a.spec.nid) || {}).mesh} : a.spec));
  if (!spec) return [gL('Ikke noe ' + GEAR[a.kind].no.toLowerCase() + ' klart om bord.', 'No ' + GEAR[a.kind].en.toLowerCase() + ' ready aboard.')];
  return startSet(a.kind, spec, fishAfter);
}
// what the standing plan needs before it leaves: two aboard for nets, bait for the pots (bought at the plant), line baited
function opsGearNeeds(o){
  const acts = (o.wps || []).filter(w => w.act).map(w => w.act.kind), pg = S.pgear, p = portById(S.boat.port), miss = [];
  if (!acts.length || !pg) return null;
  if (acts.includes('garn') && handsAboard() < 2) miss.push(gL('garn krever to om bord', 'nets need two aboard'));
  if (acts.includes('teine')){ const need = (pg.pots.small + pg.pots.big) * GPRICE.potBait - pg.bait; if (need > 0 && p && p.mottak){ const kg = Math.ceil(need), c = kg * GPRICE.bait; if (c <= S.cash){ S.cash -= c; S.stats.costs += c; pg.bait += kg; } } }
  if (acts.includes('line') && !pg.lines.hyse.baited && !pg.lines.bank.baited && !mySets().some(s => s.kind === 'line')) miss.push(gL('lina er ikke egnet', 'the line is not baited'));
  return miss.length ? miss : null;
}
// after a standing-plan landing: the hauled line goes to the baiting shed so it is ready for the next trip
function opsGearAfter(){
  const pg = S.pgear, p = portById(S.boat.port); if (!pg) return;
  for (const lk of ['hyse', 'bank']){ const un = pg.lines[lk].n - pg.lines[lk].baited; if (un <= 0) continue;
    if (egnPort(p)) egnOrder(lk, un); else egnSelf(lk, un); }
}

// ---- in the sea, every hour: catch, losses, weather and deadlines (company level)
function soakHour(s, H){
  const a = (S.t - s.tSet) / 60, mid = setMid(s), acc = s.acc; let tot = 0;
  const add = (sp, kg, n) => { const A = acc[sp] || (acc[sp] = {kg:0, n:0, ts:0}); A.kg += kg; A.n += n; A.ts += kg * H; };
  if (s.kind === 'teine'){
    const P = POTS[s.pot], A = acc.krabbe || {n:0}, cap = P.cap * s.n, g = Math.min(1, a / 6) * Math.exp(-a / 40);
    const lam = GEAR.teine.q * 30 * s.n * P.f * density('krabbe', mid, H) * luck('krabbe') * g * Math.max(0, 1 - A.n / cap);
    const mw = crabW(SPECIES.krabbe.cw[0]);
    if (lam > 0){ add('krabbe', lam * mw, lam); tot += lam * mw; takeStock(mid, lam * mw, 'krabbe'); }
    for (const sp in SELQ.teine){ const r = 30 * GEAR.teine.q * s.n * SELQ.teine[sp] * density(sp, mid, H) * g; if (r > 0) add(sp, r, r / SPECIES[sp].size[0]); }
    // after two days the crab starts to die in the pots
    if (a > 48 && acc.krabbe && acc.krabbe.n > 0){ const fr = a > 72 ? 0.05 : 0.02, K = acc.krabbe; s.dead += K.n * fr; K.n *= 1 - fr; K.kg *= 1 - fr; K.ts *= 1 - fr; }
    return tot;
  }
  const key = gearKey(s), sel = SELQ[key], G = GEAR[s.kind];
  const nNow = Object.values(acc).reduce((q, x) => q + x.n, 0), kgNow = Object.values(acc).reduce((q, x) => q + x.kg, 0);
  const f = s.kind === 'line' ? Math.exp(-a / 10) * Math.max(0, 1 - nNow / (s.hooks * 0.35)) : Math.exp(-a / 30) * Math.max(0, 1 - kgNow / (80 * s.n));
  const units = s.kind === 'line' ? s.hooks / 100 : s.n, cond = s.kind === 'garn' ? 0.5 + 0.5 * (s.cond || 1) : 1;
  for (const sp in sel){ const r = 30 * G.q * units * sel[sp] * density(sp, mid, H) * luck(sp) * f * cond; if (r > 0){ add(sp, r, r / SPECIES[sp].size[0]); tot += r; } }
  if (!s.dry) takeStock(mid, tot);
  // amphipods (marflo) and hagfish eat what hangs dead in the gear after the first day
  const loss = (s.kind === 'line' ? 0.07 : 0.03) * sstep(20, 28, a);
  if (loss > 0) for (const sp in acc){ const A = acc[sp]; A.kg *= 1 - loss; A.n *= 1 - loss; A.ts *= 1 - loss; }
  return tot;
}
function gearHour(H){
  if (!S.sets || !S.sets.length) return;
  for (const s of S.sets.slice()){
    if (s.lost || s.hauling) continue;
    soakHour(s, H);
    const a = (S.t - s.tSet) / 60, mid = setMid(s), hs = hsAt(mid, H), shallow = depthF(mid) < 20 ? 1.3 : 0.8, kf = {garn:1, line:0.6, teine:0.8}[s.kind];
    // loss per hour: small in ordinary weather, real in a storm (about 15 % over a day at 5 m seas); heavy anchors hold better
    const p = (0.0002 + 0.008 * sstep(2.5, 5, hs) * shallow * kf) * (s.heavy ? 0.35 : 1) + (s.kind === 'garn' ? 0.001 * sstep(0.25, 0.45, tideRate(H)) : 0);
    const r = Math.random(), what = GEAR[s.kind].no.toLowerCase(), whatEn = GEAR[s.kind].en.toLowerCase();
    if (r < p){
      s.lost = S.t; { const e = (S.gearLog || []).find(x => x.id === s.id); if (e) e.lost = S.t; }
      setLog(s, 'Mistet ' + what + ' (' + s.n + ' ' + unitName(s.kind, s.n) + ') i været. Tapt redskap skal meldes til Kystvakten.', 'Lost ' + whatEn + ' (' + s.n + ' ' + unitName(s.kind, s.n) + ') in the weather. Lost gear must be reported to the Coast Guard.');
      msg(gL('Redskap', 'Gear'), 'Blåsene er borte, og ' + what + ' er tapt. Meld tapt redskap til Kystvakten under Beholdning.', 'The buoys are gone and the ' + whatEn + ' is lost. Report the lost gear to the Coast Guard under Inventory.');
      continue;
    }
    if (r < p * 2.5){
      if (s.kind === 'garn'){ s.cond = Math.max(0, Math.round((s.cond - 0.1 - Math.random() * 0.15) * 100) / 100); setLog(s, 'Været har gjort skade på garna.', 'The weather has damaged the nets.'); }
      else if (s.kind === 'teine' && s.n > 1){ const k = Math.max(1, Math.round(s.n * (0.1 + Math.random() * 0.2))); s.n -= k; setLog(s, 'Været har revet løs ' + k + ' teiner.', 'The weather has torn loose ' + k + ' pots.'); }
    }
    // deadlines
    if (a >= 48 && !(s.warn & 1)){ s.warn |= 1; setLog(s, s.kind === 'teine' ? 'Teinene har stått i to døgn. Krabben begynner å dø.' : 'Redskapet har stått i to døgn. Fisken blir dårlig.', s.kind === 'teine' ? 'The pots have stood for two days. The crab is starting to die.' : 'The gear has stood for two days. The fish is spoiling.'); }
    if (a >= 96 && s.kind !== 'teine' && !(s.warn & 2)){ s.warn |= 2; msg('Fiskeridirektoratet', 'Påminnelse: garn og line for kveite og breiflabb skal røktes minst hver fjerde dag. ' + GEAR[s.kind].no + ' ved ' + coordStr(mid) + ' har stått i ' + fmt(a / 24, 0) + ' døgn.', 'Reminder: nets and line for halibut and monkfish must be tended at least every fourth day. ' + GEAR[s.kind].en + ' at ' + coordStr(mid) + ' has stood for ' + fmt(a / 24, 0) + ' days.'); }
  }
  // shore work that is ready: a message to the vessel
  for (const v of S.fleet || []) onVessel(v, () => { for (const j of (S.pgear && S.pgear.shore) || []) if (!j.told && S.t >= j.ready){ j.told = true; msg(j.kind === 'egn' ? gL('Egnebua', 'The baiting shed') : gL('Bøteriet', 'The net loft'), (j.kind === 'egn' ? j.n + ' stamper er egnet og klare i ' : 'Garna er bøtet og klare i ') + portById(j.port).name + '.', (j.kind === 'egn' ? j.n + ' tubs are baited and ready at ' : 'The nets are mended and ready at ') + portById(j.port).name + '.'); } });
}
function reportLost(sid){
  const s = (S.sets || []).find(x => x.id === sid); if (!s || !s.lost) return false;
  S.sets.splice(S.sets.indexOf(s), 1);
  msg('Kystvakten', 'Takk. Tapt redskap er registrert: ' + GEAR[s.kind].no.toLowerCase() + ', ' + s.n + ' ' + unitName(s.kind, s.n) + ', sist ved ' + coordStr(setMid(s)) + '. Det tas med i Fiskeridirektoratets opprenskning.', 'Thank you. Lost gear registered: ' + GEAR[s.kind].en.toLowerCase() + ', ' + s.n + ' ' + unitName(s.kind, s.n) + ', last at ' + coordStr(setMid(s)) + '. It goes into the Directorate of Fisheries’ clean-up.');
  return true;
}

// ---- in port: baiting at the shed or by the crew, mending by the crew or at the net loft in Finnsnes
const egnPort = p => !!(p && p.mottak);          // assumed: a baiting shed at the fish plants (not checked)
const botPort = p => !!(p && p.id === 'finnsnes');
function egnOrder(lk, n){
  const b = S.boat, pg = S.pgear, p = portById(b.port), L0 = pg.lines[lk], free = L0.n - L0.baited;
  if (b.status !== 'port' || !egnPort(p)) return [gL('Det er ingen egnebu her.', 'There is no baiting shed here.')];
  if (n < 1 || free < n) return [gL('Du har ikke så mange uegnede stamper om bord.', 'You do not have that many unbaited tubs aboard.')];
  const fee = n * LINE_KINDS[lk].egn + n * LINE_KINDS[lk].baitKg * GPRICE.bait; if (fee > S.cash) return [gL('Ikke nok penger.', 'Not enough money.')];
  S.cash -= fee; S.stats.costs += fee; L0.n -= n;
  const busy = pg.shore.filter(j => j.kind === 'egn' && j.port === b.port && j.ready > S.t).reduce((a, j) => Math.max(a, j.ready), S.t);
  const ready = Math.max(S.t, busy) + 180 + n * 20;
  pg.shore.push({kind:'egn', port:b.port, lk, n, ready, fee});
  log('Leverte ' + n + ' stamper til egnebua i ' + p.name + ', ' + kr(fee) + '. Klar ca. kl. ' + hm(ready / 60) + '.', 'Left ' + n + ' tubs at the baiting shed in ' + p.name + ', ' + kr(fee) + '. Ready at about ' + hm(ready / 60) + '.');
  return null;
}
function egnSelf(lk, n){
  const b = S.boat, pg = S.pgear, L0 = pg.lines[lk], free = L0.n - L0.baited, kg = n * LINE_KINDS[lk].baitKg;
  if (b.status !== 'port') return [gL('Lina egnes i havn.', 'The line is baited in port.')];
  if (n < 1 || free < n) return [gL('Du har ikke så mange uegnede stamper om bord.', 'You do not have that many unbaited tubs aboard.')];
  if (pg.bait < kg) return [gL('Du trenger ' + fmt(kg, 0) + ' kg agn.', 'You need ' + fmt(kg, 0) + ' kg of bait.')];
  const hands = handsAboard(), eff = hands * teamEff(crewAboard(), meAboard(), 'line'); if (!hands) return [gL('Ingen om bord kan egne.', 'Nobody aboard can bait.')];
  const h = Math.round(n * LINE_KINDS[lk].hooks / (GPRICE.egnRate * eff) * 10) / 10;
  if (!queueJob({kind:'egn', lk, n, h, no:'Egne ' + n + ' stamper', en:'Bait ' + n + ' tubs'})) return [gL('Verkstedkøen er full.', 'The work queue is full.')];
  pg.bait -= kg; L0.n -= n; pg.shore.push({kind:'egnself', lk, n});
  log('Egner ' + n + ' stamper selv, ca. ' + fmt(h, 1) + ' t.', 'Baiting ' + n + ' tubs ourselves, about ' + fmt(h, 1) + ' h.');
  return null;
}
function mendSelf(nid){
  const b = S.boat, pg = S.pgear, l = pg.nets.find(x => x.id === nid);
  if (b.status !== 'port') return [gL('Garn bøtes i havn.', 'Nets are mended in port.')];
  if (!l || l.cond >= 0.9) return [gL('Garna trenger ikke bøting.', 'The nets do not need mending.')];
  const hands = handsAboard(), eff = hands * teamEff(crewAboard(), meAboard(), 'garn'); if (!hands) return [gL('Ingen om bord kan bøte.', 'Nobody aboard can mend.')];
  const h = Math.round(l.n * (0.95 - l.cond) / 0.25 * 0.5 / eff * 10) / 10;
  if (!queueJob({kind:'mend', nid, h, no:'Bøte ' + l.n + ' garn', en:'Mend ' + l.n + ' nets'})) return [gL('Verkstedkøen er full.', 'The work queue is full.')];
  pg.nets.splice(pg.nets.indexOf(l), 1); pg.shore.push({kind:'mendself', lenke:l});
  log('Bøter ' + l.n + ' garn selv, ca. ' + fmt(h, 1) + ' t.', 'Mending ' + l.n + ' nets ourselves, about ' + fmt(h, 1) + ' h.');
  return null;
}
function botOrder(nid){
  const b = S.boat, pg = S.pgear, p = portById(b.port), l = pg.nets.find(x => x.id === nid);
  if (b.status !== 'port' || !botPort(p)) return [gL('Bøteriet ligger i Finnsnes.', 'The net loft is in Finnsnes.')];
  if (!l || l.cond >= 0.9) return [gL('Garna trenger ikke bøting.', 'The nets do not need mending.')];
  const fee = Math.round(GPRICE.bot * l.n * (0.95 - l.cond) / 0.1); if (fee > S.cash) return [gL('Ikke nok penger.', 'Not enough money.')];
  S.cash -= fee; S.stats.costs += fee; pg.nets.splice(pg.nets.indexOf(l), 1);
  const ready = S.t + 24 * 60; pg.shore.push({kind:'bot', port:b.port, lenke:l, n:l.n, ready, fee});
  log('Leverte ' + l.n + ' garn til bøteriet i ' + p.name + ', ' + kr(fee) + '. Klare om et døgn.', 'Left ' + l.n + ' nets at the net loft in ' + p.name + ', ' + kr(fee) + '. Ready in a day.');
  return null;
}
// jobs done by the crew in port, and gear to pick up from the shed or the loft when the boat is there
function gearJob(j){
  const pg = S.pgear;
  if (j.kind === 'egn'){ const i = pg.shore.findIndex(x => x.kind === 'egnself' && x.lk === j.lk && x.n === j.n); if (i >= 0) pg.shore.splice(i, 1); pg.lines[j.lk].n += j.n; pg.lines[j.lk].baited += j.n; log(j.n + ' stamper er egnet.', j.n + ' tubs are baited.'); return true; }
  if (j.kind === 'mend'){ const i = pg.shore.findIndex(x => x.kind === 'mendself' && x.lenke.id === j.nid); if (i >= 0){ const l = pg.shore[i].lenke; pg.shore.splice(i, 1); l.cond = 0.95; pg.nets.push(l); log(l.n + ' garn er bøtet.', l.n + ' nets are mended.'); } return true; }
  return false;
}
function gearJobCancel(j){
  const pg = S.pgear; if (!pg) return;
  if (j.kind === 'egn'){ const i = pg.shore.findIndex(x => x.kind === 'egnself' && x.lk === j.lk && x.n === j.n); if (i >= 0) pg.shore.splice(i, 1); pg.lines[j.lk].n += j.n; pg.bait += j.n * LINE_KINDS[j.lk].baitKg; }
  if (j.kind === 'mend'){ const i = pg.shore.findIndex(x => x.kind === 'mendself' && x.lenke.id === j.nid); if (i >= 0){ pg.nets.push(pg.shore[i].lenke); pg.shore.splice(i, 1); } }
}
function shoreTick(){
  const b = S.boat, pg = S.pgear; if (!pg || !pg.shore.length || b.status !== 'port') return;
  for (const j of pg.shore.slice()){
    if (j.port !== b.port || S.t < j.ready) continue;
    if (j.kind === 'egn'){ pg.lines[j.lk].n += j.n; pg.lines[j.lk].baited += j.n; log('Hentet ' + j.n + ' egnede stamper fra egnebua.', 'Picked up ' + j.n + ' baited tubs from the baiting shed.'); }
    else if (j.kind === 'bot'){ j.lenke.cond = 0.95; pg.nets.push(j.lenke); log('Hentet ' + j.n + ' bøtede garn fra bøteriet.', 'Picked up ' + j.n + ' mended nets from the net loft.'); }
    else continue;
    pg.shore.splice(pg.shore.indexOf(j), 1);
  }
}
