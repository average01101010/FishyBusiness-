// ===== passive gear on screen: the action bar, the fish panel, the chart and the route =====
const GL = (no, en) => S.lang === 'no' ? no : en;
const SETCOL = {garn:'#e8792b', line:'#e3b52b', teine:'#d2453a'};
// how a set is doing: pots want 20 hours, line is best within a day, nets should come up daily
function setState(s){
  if (s.lost) return 'lost'; const a = (S.t - s.tSet) / 60;
  if (s.kind === 'teine') return a < 20 ? 'wait' : a < 44 ? 'ok' : a < 48 ? 'due' : 'late';
  if (s.kind === 'line') return a < 18 ? 'ok' : a < 24 ? 'due' : 'late';
  return a < 24 ? 'ok' : a < 48 ? 'due' : 'late';
}
const SETST = {wait:['står for kort', 'too short'], ok:['står', 'soaking'], due:['bør trekkes', 'should be hauled'], late:['står for lenge', 'standing too long'], lost:['tapt', 'lost']};
function setLabel(s, short){
  const n = s.n + ' ' + unitName(s.kind, s.n), a = fmt((S.t - s.tSet) / 60, 0) + ' t';
  return short ? GEAR[s.kind][S.lang] + ' · ' + a : GEAR[s.kind][S.lang] + ', ' + n + ' · ' + a + ' · ' + GL(SETST[setState(s)][0], SETST[setState(s)][1]);
}
// the gear aboard as ready-made choices for setting: whole strings of nets, all baited tubs of a kind, all pots of a size with bait
function setChoices(){
  const pg = S.pgear, out = [], r = RIGS[rigOf()].kind; if (!pg || !r) return out;
  for (const l of pg.nets) out.push({kind:'garn', spec:{nid:l.id}, n:l.n, lbl:[l.n + ' garn ' + l.mesh + ' mm', l.n + ' nets ' + l.mesh + ' mm']});
  for (const lk of ['hyse', 'bank']){ const n = pg.lines[lk].baited; if (n > 0) out.push({kind:'line', spec:{lk, n}, n, lbl:[n + ' ' + (n === 1 ? 'stamp' : 'stamper') + ' ' + LINE_KINDS[lk].no.toLowerCase(), n + ' ' + (n === 1 ? 'tub' : 'tubs') + ' of ' + LINE_KINDS[lk].en.toLowerCase()]}); }
  for (const pot of ['small', 'big']){ const n = Math.min(pg.pots[pot], Math.floor(Math.max(0, ...Object.values(baitOf(pg))) / GPRICE.potBait + 1e-9)); if (n > 0) out.push({kind:'teine', spec:{pot, n}, n, lbl:[n + ' ' + POTS[pot].no.toLowerCase(), n + ' ' + POTS[pot].en.toLowerCase()]}); }
  return out.filter(c => c.kind === r);
}
// what the boat is doing with gear, for the status line and the action bar
function gopText(){
  const g = S.boat.gop; if (!g) return null;
  const k = GEAR[g.kind], left = Math.max(0, (g.n - g.done - g.prog) * gopUnitMin(g, S.t / 60, hsAt(S.boat.pos, S.t / 60)));
  return [(g.op === 'set' ? 'Setter ' : 'Trekker ') + k.no.toLowerCase() + ' ' + g.done + '/' + g.n + ' · ' + (isFinite(left) ? dur(left / 60) : GL('ingen haler', 'nobody hauling')), (g.op === 'set' ? 'Setting ' : 'Hauling ') + k.en.toLowerCase() + ' ' + g.done + '/' + g.n + ' · ' + (isFinite(left) ? dur(left / 60) : GL('ingen haler', 'nobody hauling')),
    (g.op === 'set' ? 'Setter ' : 'Trekker ') + g.done + '/' + g.n, (g.op === 'set' ? 'Setting ' : 'Hauling ') + g.done + '/' + g.n];
}
// buttons for the action bar: at a buoy, haul; lying still, set what is aboard; while working, how far and a stop
function gearActs(LS){
  const b = S.boat, h = [];
  if (b.gop){ const g = gopText(); h.push('<span class="stp"><span class="lg">' + GL(g[0], g[1]) + '</span><span class="sh">' + GL(g[2], g[3]) + '</span></span><button data-act="gstop">' + LS('Stopp redskapsarbeidet', 'Stop the gear work', 'Stopp', 'Stop') + '</button>'); return h.join(''); }
  if (b.status === 'port'){
    const pg = S.pgear, un = pg ? ['hyse', 'bank'].reduce((a, lk) => a + pg.lines[lk].n - pg.lines[lk].baited, 0) : 0;
    if (un > 0) h.push('<button data-ui="redskap">' + LS('Egn ' + un + ' stamper', 'Bait ' + un + ' tubs', 'Egning', 'Baiting') + '</button>');
    return h.join('');
  }
  if (b.status !== 'idle') return '';
  const s = nearSet(b.pos, 0.3);
  if (s){ h.push('<button class="pri" data-act="ghaul" data-id="' + s.id + '">' + LS('Trekk ' + setLabel(s, true).toLowerCase(), 'Haul ' + setLabel(s, true).toLowerCase(), 'Trekk', 'Haul') + '</button>');
    if (s.kind !== 'line') h.push('<button data-act="ghaul" data-id="' + s.id + '" data-r="1">' + LS('Trekk og sett ut igjen', 'Haul and set again', 'Trekk og sett', 'Haul, set') + '</button>'); }
  const ch = setChoices();
  ch.slice(0, 3).forEach((c, i) => h.push('<button data-act="gset" data-c="' + i + '">' + LS('Sett ' + c.lbl[0], 'Set ' + c.lbl[1], 'Sett ' + c.n, 'Set ' + c.n) + '</button>'));
  if (ch.length > 3 || mySets().length) h.push('<button data-ui="redskap">' + LS('Redskap', 'Gear', 'Redskap', 'Gear') + '</button>');
  return h.join('');
}
// the gear section of the fish panel
function gearPanel(){
  const b = S.boat, pg = S.pgear, h = []; if (!pg) return '';
  h.push('<h3>' + GL('Redskap', 'Gear') + '</h3>');
  const on = [];
  if (pg.nets.length) on.push(pg.nets.map(l => l.n + ' garn ' + l.mesh + ' mm (' + Math.round(l.cond * 100) + ' %)').join(', '));
  for (const lk of ['hyse', 'bank']) if (pg.lines[lk].n) on.push(pg.lines[lk].n + ' ' + LINE_KINDS[lk].no.toLowerCase() + ' (' + pg.lines[lk].baited + ' ' + GL('egnet', 'baited') + ')');
  for (const pot of ['small', 'big']) if (pg.pots[pot]) on.push(pg.pots[pot] + ' ' + POTS[pot].no.toLowerCase());
  h.push('<div class="kv"><span>' + GL('Om bord', 'Aboard') + '</span><span>' + (on.length ? on.join('; ') : GL('ingen', 'none')) + '</span></div>');
  h.push('<div class="kv"><span>' + GL('Blåsesett og agn', 'Buoy sets and bait') + '</span><span>' + pg.kits.n + ' · ' + fmt(baitKg(pg), 0) + ' kg</span></div>');
  if (b.gop){ const g = gopText(); h.push('<p><b>' + GL(g[0], g[1]) + '</b></p><div class="btns"><button class="btn" data-act="gstop">' + GL('Stopp', 'Stop') + '</button></div>'); }
  else if (b.status === 'idle'){ const ch = setChoices(), s = nearSet(b.pos, 0.3);
    h.push('<div class="btns">' + (s ? '<button class="btn primary" data-act="ghaul" data-id="' + s.id + '">' + GL('Trekk ', 'Haul ') + setLabel(s, true).toLowerCase() + '</button>' : '') + ch.map((c, i) => '<button class="btn" data-act="gset" data-c="' + i + '">' + GL('Sett ', 'Set ') + GL(c.lbl[0], c.lbl[1]) + '</button>').join('') + '</div>'); }
  const mine = (S.sets || []).filter(s => s.vid === S.cur);
  if (mine.length) h.push('<ul class="wps">' + mine.map(s => '<li><span class="n" style="background:' + SETCOL[s.kind] + '"></span><span class="lbl">' + setLabel(s) + '<small>' + coordStr(setMid(s)) + ' · ' + fmt(dist(b.pos, setMid(s)) / NM, 1) + ' nm</small></span></li>').join('') + '</ul>');
  h.push('<label class="tog"><input type="checkbox" id="setCrabSort"' + (S.settings.crabSort !== false ? ' checked' : '') + '><span>' + GL('Sorter krabben nøye', 'Sort the crab carefully') + '<small>' + GL('Småkrabbe under 13 cm og rognkrabbe går ut igjen. Det tar litt lengre tid, men slurv gir bot og prisfradrag.', 'Crab under 13 cm and berried crab go back. It takes a little longer, but sloppy sorting brings a fine and a price cut.') + '</small></span></label>');
  return h.join('');
}
// the chart: two buoys and the string between them, for every vessel in the company
function gearSvg(u){
  const g = [];
  for (const s of S.sets || []){
    const st = setState(s), c = SETCOL[s.kind], dash = s.kind === 'line' ? ' stroke-dasharray="' + (5 * u) + ' ' + (3 * u) + '"' : s.kind === 'teine' ? ' stroke-dasharray="' + (1.5 * u) + ' ' + (3 * u) + '"' : '';
    g.push('<line x1="' + s.a.x + '" y1="' + s.a.y + '" x2="' + s.b.x + '" y2="' + s.b.y + '" class="gline ' + st + '" stroke="' + c + '" stroke-width="' + (2.2 * u) + '"' + dash + '/>');
    for (const e of [s.a, s.b]) g.push('<circle cx="' + e.x + '" cy="' + e.y + '" r="' + (4 * u) + '" class="buoy ' + st + '" fill="' + c + '" stroke-width="' + (1.4 * u) + '"/>');
    if (view.z > 3 || st === 'due' || st === 'late' || st === 'lost') g.push(txt({x:s.b.x + 6 * u, y:s.b.y - 5 * u}, (s.lost ? '✕ ' : '') + setLabel(s, true) + (S.fleet.length > 1 && s.vid !== S.cur ? ' (' + vget(setVessel(s) || curVessel(), 'boatName') + ')' : ''), 'lbl-gear ' + st, 10 * u, 'stroke-width="' + (3 * u) + '"'));
  }
  return g.join('');
}
function gearHit(p, r){ let best = null, bd = r; for (const s of S.sets || []) for (const e of [s.a, s.b]){ const d = dist(e, p); if (d < bd){ bd = d; best = {s, e}; } } return best; }
// a point 50 m off the buoy, away from the string, so the boat stops clear of it and within reach of the haul
function buoyStandoff(s, e){
  const o = e === s.a ? s.b : s.a, d = dist(e, o) || 1, q = {x:e.x + (e.x - o.x) / d * 0.05, y:e.y + (e.y - o.y) / d * 0.05};
  return !isLand(q) && depthF(q) >= 3 ? q : {x:e.x, y:e.y};
}
// a tap on a buoy: while planning, the haul goes into the route; otherwise the set is described
function gearTap(hit){
  const b = S.boat, s = hit.s;
  // with Autonav the way goes to a point just off the buoy, where «Ta opp» can haul it
  if (LEIA_ARM && s.vid === S.cur && !s.lost){ leiaTo(buoyStandoff(s, hit.e)); return; }
  if (s.vid === S.cur && !s.lost && ['port', 'idle'].includes(b.status)){
    addWaypoint(hit.e); const w = S.draft[S.draft.length - 1];
    if (w && !w.port && dist(w, hit.e) < 0.01){ w.act = {op:'haul', sid:s.id, kind:s.kind}; toast(GL('Trekk av ' + GEAR[s.kind].no.toLowerCase() + ' er lagt i ruta.', 'Hauling the ' + GEAR[s.kind].en.toLowerCase() + ' is in the route.')); panelDirty = true; }
    return;
  }
  toast((S.fleet.length > 1 ? vget(setVessel(s) || curVessel(), 'boatName') + ': ' : '') + setLabel(s));
}
// the route: what to do at each waypoint, chosen by tapping through the options
function wpActOptions(w){
  const opts = [null];
  for (const c of setChoices()) opts.push({op:'set', kind:c.kind, spec:c.spec, lbl:c.lbl});
  for (const s of mySets()) if (Math.min(dist(w, s.a), dist(w, s.b)) < 0.5){ opts.push({op:'haul', sid:s.id, kind:s.kind}); if (s.kind !== 'line') opts.push({op:'haul', sid:s.id, kind:s.kind, reset:true}); }
  return opts;
}
function wpActLabel(a){
  if (!a) return GL('Redskap: nei', 'Gear: no');
  if (a.op === 'cycle') return GL('Stasjon: ', 'Station: ') + GEAR[a.kind][S.lang].toLowerCase();
  if (a.op === 'set') return GL('Sett ', 'Set ') + GL((a.lbl || ['', ''])[0], (a.lbl || ['', ''])[1]);
  return (a.reset ? GL('Trekk og sett ', 'Haul and set ') : GL('Trekk ', 'Haul ')) + GEAR[a.kind][S.lang].toLowerCase();
}
function wpActCycle(w){
  const opts = wpActOptions(w), key = a => a ? JSON.stringify([a.op, a.kind, a.sid || '', !!a.reset, a.spec ? JSON.stringify(a.spec) : '']) : '';
  const i = opts.findIndex(a => key(a) === key(w.act || null)), nx = opts[(i + 1) % opts.length];
  if (nx) w.act = nx; else delete w.act;
}
function gearDoAct(act, el){
  let why = null;
  // setting by hand is drawn on the chart first (ui/03d-setmode.js)
  if (act === 'gset'){ const c = setChoices()[+el.dataset.c]; if (!c) return true; setModeStart(c); return true; }
  else if (act === 'ghaul') why = startHaul(el.dataset.id, el.dataset.r === '1', 0);
  else if (act === 'gstop'){ gopAbort('stop'); }
  else if (act === 'gwp'){ const w = S.draft[+el.dataset.i]; if (w) wpActCycle(w); }
  else return false;
  if (why) toast(why[0]);
  return true;
}
