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
// ---- the bait as the player sees it (Jonas 20.10.2026, after tilbakemelding #74: «det må gjøres mer intuitivt hva båten har slags
// fiskeredskaper ombord og hva disse eventuelt er egnet med», and no hints): each kind its own colour, the same on the tubs in the inventory,
// in the chart's panel, in the choosers and in the set choices, with its name beside it
const BAITCOL = {makrell:'#2b7fa8', krabbe:'#e07b39', reke:'#ef8fa6', sei:'#5f7480', krill:'#c8372d', sild:'#a9c2d8', blekksprut:'#8a5bb0'};
const baitNm = k => BAITS[k] ? GL(BAITS[k].no, BAITS[k].en) : String(k);
const baitLc = k => baitNm(k).toLowerCase();
// a species' name inside a sentence or on a chip: lower case, but the Greenland halibut keeps its capital in English
const spLc = sp => S.lang === 'no' ? SPECIES[sp].no.toLowerCase() : SPECIES[sp].en.replace(/^(?!Greenland)./, c => c.toLowerCase());
// the species a bait takes better than others (its factors over 1), best first
const baitGood = k => { const f = (BAITS[k] || {f:{}}).f; return Object.keys(f).filter(sp => f[sp] > 1 && SPECIES[sp]).sort((a, b) => f[b] - f[a]); };
const baitDot = (k, cls) => '<i class="bdot' + (cls ? ' ' + cls : '') + '"' + (k ? ' style="--bc:' + (BAITCOL[k] || '#8d9aa3') + '"' : '') + '></i>';
// a line kind's tubs as they stand: baited by kind (bt, most first), with the crew (being baited or stripped, pg.shore), and unbaited
function tubState(lk){
  const pg = S.pgear, L0 = pg.lines[lk], bt = btOf(L0), out = {lk, n:L0.n, baited:[], work:[], un:Math.max(0, L0.n - L0.baited)};
  for (const k of Object.keys(bt).filter(k => bt[k] > 0).sort((a, b) => bt[b] - bt[a])) out.baited.push([k, bt[k]]);
  for (const j of pg.shore || []){ if (j.lk !== lk) continue;
    if (j.kind === 'egnself'){ const q = (S.jobs || []).find(x => x.kind === 'egn' && x.lk === lk && x.n === j.n); out.work.push({op:'egn', k:j.bait || (q && q.bait) || 'makrell', n:j.n}); }
    else if (j.kind === 'stripself') out.work.push({op:'strip', k:j.bait, n:j.n}); }
  return out;
}
// the tubs in a row, one mark each: filled in the bait's colour, ringed in it while the crew works on it, open when unbaited
function tubsHtml(lk){
  const st = tubState(lk), t = [], tub = (cls, k) => '<i class="tub ' + cls + '"' + (k ? ' style="--bc:' + (BAITCOL[k] || '#8d9aa3') + '"' : '') + '></i>';
  for (const [k, n] of st.baited) for (let i = 0; i < n; i++) t.push(tub('b', k));
  for (const w of st.work) for (let i = 0; i < w.n; i++) t.push(tub('w ' + w.op, w.k));
  for (let i = 0; i < st.un; i++) t.push(tub('e'));
  return t.length ? '<div class="tubs" role="img" aria-label="' + tubWords(st) + '">' + t.join('') + '</div>' : '';
}
// the same in words, kind by kind: «5 makrell · 2 egnes med sild · 3 ikke egnet»
function tubWords(st){
  const w = st.baited.map(([k, n]) => n + ' ' + baitLc(k)).concat(st.work.map(x => x.n + ' ' + (x.op === 'egn' ? GL('egnes med ', 'being baited with ') : GL('renses for ', 'being stripped of ')) + baitLc(x.k)));
  if (st.un) w.push(st.un + ' ' + GL('ikke egnet', 'not baited'));
  return w.join(' · ');
}
function tubLegend(lk){
  const st = tubState(lk), c = st.baited.map(([k, n]) => '<span class="bchip">' + baitDot(k) + '<b>' + n + '</b> ' + baitLc(k) + '</span>')
    .concat(st.work.map(x => '<span class="bchip">' + baitDot(x.k, 'w') + '<b>' + x.n + '</b> ' + (x.op === 'egn' ? GL('egnes med ', 'being baited with ') : GL('renses for ', 'being stripped of ')) + baitLc(x.k) + '</span>'));
  if (st.un) c.push('<span class="bchip">' + baitDot(null, 'e') + '<b>' + st.un + '</b> ' + GL('ikke egnet', 'not baited') + '</span>');
  return c.length ? '<div class="blegend">' + c.join('') + '</div>' : '';
}
// what a set is, in words: the line kind and the bait on its tubs, the pots' bait, the nets' kind and mesh
function setBaitTxt(s){
  if (s.kind === 'teine') return baitLc(s.bait || 'makrell');
  if (s.kind !== 'line') return '';
  const w = s.baitW || {makrell:s.n}, ks = Object.keys(w).filter(k => w[k] > 0).sort((a, b) => w[b] - w[a]);
  return ks.map(k => (ks.length > 1 ? w[k] + ' ' : '') + baitLc(k)).join(', ');
}
function setWhat(s){
  const n = s.n + ' ' + unitName(s.kind, s.n);
  if (s.kind === 'line' && LINE_KINDS[s.lk]) return GL(LINE_KINDS[s.lk].no, LINE_KINDS[s.lk].en) + ', ' + n + ' · ' + setBaitTxt(s);
  if (s.kind === 'teine') return GEAR.teine[S.lang] + ', ' + n + ' · ' + setBaitTxt(s);
  if (s.kind === 'garn') return GEAR.garn[S.lang] + ', ' + n + ' · ' + GL(netNo(s), netEn(s));
  return GEAR[s.kind][S.lang] + ', ' + n;
}
function setLabel(s, short){
  const a = fmt((S.t - s.tSet) / 60, 0) + ' t';
  return short ? GEAR[s.kind][S.lang] + ' · ' + a : setWhat(s) + ' · ' + a + ' · ' + GL(SETST[setState(s)][0], SETST[setState(s)][1]);
}
// the gear aboard as ready-made choices for setting: whole strings of nets, the baited tubs of a kind by their bait (Jonas 20.10.2026: «4
// stamper bankline · makrell»), the pots by the bait there is for them. all: also what is aboard and cannot be set, as a row that says why
// (off: «2 stamper bankline · ikke egnet», pots without bait), for the «Sett ut» fan; the plan and the route take only the settable ones
function setChoices(all){
  const pg = S.pgear, out = [], r = RIGS[(DRIFTCTX && DRIFTCTX.rig) || rigOf()].kind; if (!pg || !r) return out;
  for (const l of pg.nets) out.push({kind:'garn', spec:{nid:l.id}, n:l.n, lbl:[l.n + ' garn ' + netNo(l), l.n + ' nets ' + netEn(l)]});
  for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk]; if (!L0 || !L0.n) continue; const bt = btOf(L0), K = LINE_KINDS[lk];
    const lbl = (n, no, en) => [n + ' ' + (n === 1 ? 'stamp' : 'stamper') + ' ' + K.no.toLowerCase() + ' · ' + no, n + ' ' + (n === 1 ? 'tub' : 'tubs') + ' of ' + K.en.toLowerCase() + ' · ' + en];
    for (const k of Object.keys(bt).filter(k => bt[k] > 0).sort((a, b) => bt[b] - bt[a])) out.push({kind:'line', spec:{lk, n:bt[k], bait:k}, n:bt[k], bait:k, lbl:lbl(bt[k], BAITS[k] ? BAITS[k].no.toLowerCase() : k, BAITS[k] ? BAITS[k].en.toLowerCase() : k)});
    const un = L0.n - L0.baited; if (all && un > 0) out.push({kind:'line', off:true, lk, n:un, lbl:lbl(un, 'ikke egnet', 'not baited')}); }
  for (const pot of ['big']){ const np = pg.pots[pot] || 0; if (!np) continue; const B = baitOf(pg), P = POTS[pot];
    for (const k of Object.keys(B).filter(k => BAITS[k] && B[k] >= GPRICE.potBait - 1e-9).sort((a, b) => B[b] - B[a])){ const n = Math.min(np, Math.floor(B[k] / GPRICE.potBait + 1e-9));
      out.push({kind:'teine', spec:{pot, n, bait:k}, n, bait:k, lbl:[n + ' ' + P.no.toLowerCase() + ' · ' + BAITS[k].no.toLowerCase(), n + ' ' + P.en.toLowerCase() + ' · ' + BAITS[k].en.toLowerCase()]}); }
    if (all && !out.some(c => c.kind === 'teine')) out.push({kind:'teine', off:true, n:np, lbl:[np + ' ' + P.no.toLowerCase() + ' · uten agn', np + ' ' + P.en.toLowerCase() + ' · no bait']}); }
  return out.filter(c => c.kind === r);
}
// what the boat is doing with gear, for the status line and the action bar
function gopText(){
  const g = S.boat.gop; if (!g) return null;
  const k = GEAR[g.kind], left = Math.max(0, (g.n - g.done - g.prog) * gopUnitMin(g, S.t / 60, hsAt(S.boat.pos, S.t / 60)) / haulSlow(g)) + (g.lead || 0);
  const slow = haulSlow(g) < 0.95;   // the bleeding tub is filling: the haul goes slower
  return [(g.op === 'set' ? 'Setter ' : 'Trekker ') + k.no.toLowerCase() + ' ' + g.done + '/' + g.n + ' · ' + (isFinite(left) ? dur(left / 60) : GL('ingen haler', 'nobody hauling')) + (slow ? ' · saktere, karet fylles' : ''), (g.op === 'set' ? 'Setting ' : 'Hauling ') + k.en.toLowerCase() + ' ' + g.done + '/' + g.n + ' · ' + (isFinite(left) ? dur(left / 60) : GL('ingen haler', 'nobody hauling')) + (slow ? ' · slower, the tub is filling' : ''),
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
// the tackle the jig fishes with now, as targetF counts it: the halibut pilk when halibut is chosen, the gear is aboard and the season open
const jigInUse = () => S.target === 'kveite' && S.boat.kgear && !kveiteClosed(S.t / 60) ? 'kveite' : 'mark';
// the jig tackle aboard (Jonas 20.10.2026): fly hooks and pilk with the jig or the reels, the halibut pilk with the halibut gear, each with
// the species it takes (jigTake), the halibut pilk only in its open season
function jigSets(){
  const b = S.boat, H = S.t / 60, out = [];
  if (b.gear || (S.equip && S.equip.jukse > 0)) out.push({k:'mark'});
  if (b.kgear) out.push({k:'kveite', closed:kveiteClosed(H)});
  const use = jigInUse();
  for (const o of out){ o.on = o.k === use; o.sp = SP.filter(sp => jigTake(sp, H, o.k) >= 0.5 && !(sp === 'kveite' && kveiteClosed(H))); }
  return out;
}
const spChips = sps => '<span class="spchips">' + sps.map(sp => '<em style="--sc:' + ((typeof GUIDE !== 'undefined' && GUIDE.COL[sp]) || '#5b6c76') + '">' + spLc(sp) + '</em>').join('') + '</span>';
// the gear section of the fish panel: what is aboard as it stands, the tubs by their bait
function gearPanel(){
  const b = S.boat, pg = S.pgear, h = []; if (!pg) return '';
  h.push('<h3>' + GL('Redskap', 'Gear') + '</h3>');
  for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk], all = L0.n + tubState(lk).work.reduce((a, w) => a + w.n, 0); if (!all) continue;
    h.push('<div class="kv"><span>' + GL(LINE_KINDS[lk].no, LINE_KINDS[lk].en) + '</span><span>' + all + ' ' + GL(all === 1 ? 'stamp' : 'stamper', all === 1 ? 'tub' : 'tubs') + '</span></div>' + tubsHtml(lk) + tubLegend(lk)); }
  for (const l of pg.nets) h.push('<div class="kv"><span>' + l.n + ' garn ' + GL(netNo(l), netEn(l)) + '</span><span>' + Math.round(l.cond * 100) + ' %</span></div>');
  for (const pot of ['big']) if (pg.pots[pot]) h.push('<div class="kv"><span>' + GL(POTS[pot].no, POTS[pot].en) + '</span><span>' + pg.pots[pot] + ' · ' + Math.round(((pg.potc || {}).cond || 1) * 100) + ' %</span></div>');
  for (const j of jigSets()) h.push('<div class="kv"><span>' + GL(CARE.jig[j.k].no, CARE.jig[j.k].en) + (j.on ? ' · ' + GL('i bruk', 'in use') : '') + '</span><span>' + (j.k === 'kveite' && j.closed ? GL('kveita er fredet', 'halibut closed') : Math.round(((pg.jig || {})[j.k] || {c:1}).c * 100) + ' %') + '</span></div>' + (j.sp.length ? spChips(j.sp) : ''));
  const bk = Object.entries(baitOf(pg)).filter(e => e[1] > 0.05 && BAITS[e[0]]);
  h.push('<div class="kv"><span>' + GL('Agn', 'Bait') + '</span><span class="bkg">' + (bk.length ? bk.map(([k, kg]) => baitDot(k) + baitNm(k) + ' ' + fmt(kg, 0) + ' kg').join(' · ') : GL('ingen', 'none')) + '</span></div>');
  h.push('<div class="kv"><span>' + GL('Blåsesett', 'Buoy sets') + '</span><span>' + pg.kits.n + '</span></div>');
  if (b.gop){ const g = gopText(); h.push('<p><b>' + GL(g[0], g[1]) + '</b></p><div class="btns"><button class="btn" data-act="gstop">' + GL('Stopp', 'Stop') + '</button></div>'); }
  else if (b.status === 'idle'){ const ch = setChoices(), s = nearSet(b.pos, 0.3);
    h.push('<div class="btns">' + (s ? '<button class="btn primary" data-act="ghaul" data-id="' + s.id + '">' + GL('Trekk ', 'Haul ') + setLabel(s, true).toLowerCase() + '</button>' : '') + ch.map((c, i) => '<button class="btn" data-act="gset" data-c="' + i + '">' + GL('Sett ', 'Set ') + GL(c.lbl[0], c.lbl[1]) + '</button>').join('') + '</div>'); }
  const mine = (S.sets || []).filter(s => s.vid === S.cur);
  if (mine.length) h.push('<ul class="wps">' + mine.map(s => '<li><span class="n" style="background:' + SETCOL[s.kind] + '"></span><span class="lbl">' + setLabel(s) + '<small>' + coordStr(setMid(s)) + ' · ' + fmt(dist(b.pos, setMid(s)) / NM, 1) + ' nm</small></span></li>').join('') + '</ul>');
  return h.join('');
}
// the chart: two buoys and the string between them, for every vessel in the company
function gearSvg(u){
  const g = [];
  // the other players' sets, in grey and without a name (tilbakemelding #35): under ours, and not tappable, so a route can go by them
  for (const s of PEERGEAR){
    const dash = s.k === 'line' ? ' stroke-dasharray="' + (5 * u) + ' ' + (3 * u) + '"' : s.k === 'teine' ? ' stroke-dasharray="' + (1.5 * u) + ' ' + (3 * u) + '"' : '';
    g.push('<line x1="' + s.a.x + '" y1="' + s.a.y + '" x2="' + s.b.x + '" y2="' + s.b.y + '" class="gline peer" stroke="#8d9aa3" stroke-width="' + (1.8 * u) + '"' + dash + '/>');
    for (const e of [s.a, s.b]) g.push('<circle cx="' + e.x + '" cy="' + e.y + '" r="' + (3.2 * u) + '" class="buoy peer" fill="#a9b4bb" stroke-width="' + (1.1 * u) + '"/>');
  }
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
  // with Autonav the way goes to a point just off the buoy, and the haul starts there
  if (LEIA_ARM && s.vid === S.cur && !s.lost){ leiaTo(buoyStandoff(s, hit.e), true, {op:'haul', sid:s.id, kind:s.kind}).then(() => { const w = S.draft[S.draft.length - 1]; if (w && w.act && w.act.sid === s.id) toast(GL('Trekk av ' + GEAR[s.kind].no.toLowerCase() + ' er lagt i ruta. Det starter når du er framme.', 'Hauling the ' + GEAR[s.kind].en.toLowerCase() + ' is in the route. It starts when you get there.')); }); return; }
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
  if (act === 'gset'){ const c = setChoices(el.dataset.all === '1')[+el.dataset.c]; if (!c || c.off) return true; setModeStart(c); return true; }
  else if (act === 'ghaul') why = startHaul(el.dataset.id, el.dataset.r === '1', 0);
  else if (act === 'gstop'){ gopAbort('stop'); }
  else if (act === 'gwp'){ const w = S.draft[+el.dataset.i]; if (w) wpActCycle(w); }
  else return false;
  if (why) toast(why[0]);
  return true;
}
