// ===== Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.
// A plan (S.ops v4, a vessel's own field) is the player's answers: home, rig, the places in the order they are worked (fields with units
// and soak, jig places), the weather limits, the departure hour, the rhythm and the landing rule. The DAY is reckoned from the answers and
// the gear in the sea by ONE function, planDay: the steps with their hours (out, set, jig, haul, land, home, baiting, rest, watches). The
// page shows that day, and the engine (part 2) follows it; there is no other sketch. Nothing here searches or waits: the legs are kept in
// o.legs when the plan is made (part 2), and a leg not known is reckoned straight with a fifth on.
// DRIFT2 is the switch: off, today's plan (06d-drift.js) runs as before and no save is touched; on (part 7), plan2Ops switches older plans
// off with a word (Jonas 26.10.2026, choice 5 C) and the new engine runs.
let DRIFT2 = true;   // on since 27.10.2026 (part 7): the old plan's code (06d-drift.js, ui/05c-drift.js) stays until part 8 and runs with the switch off (the old tests set it)
const DRV2 = 4;
const DRP2 = {
  dayMax:14, minDay:2, tired:72, rested:25, late:8, fatH:5, enH:100 / 24, enMin:15,     // the day's length: 14 h, the crew at 72 with 5 an hour, you at 15 % with 4.2 an hour
  dayFrom:6, watch:12,                                                                 // the skipper's day watch 06–18, the mate's night (Jonas 26.10.2026)
  work:{sett:{line:5 / 60, garn:1 / 60, teine:1 / 60}, trekk:{line:20 / 60, garn:4.3 / 60, teine:1 / 60}},   // hours a unit, the engine's own pace (measured 26.10.2026)
  landH:1, stockH:10 / 60, legF:1.25, full:0.8, freshLand:65, jigMin:0.5, placesMax:12, fcH:5, cutH:3,                     // the forecast she goes out on: the next 5 hours; a haul due within 3 hours is still done when the day is cut
  rest:{quay:8, night:12},                                                             // the crew's fatigue an hour of rest without bunks (04-crew.js crewTick); with bunks or a rorbu RORBU.rate (p2RestRate)
  egn:{selfH:1 / 3, coop:[0, 1, 2, 2.5, 3, 3.5, 4], shedH:3, shedPer:1 / 3},           // baiting: a third of an hour a tub by one hand, the shed 3 h plus 20 min a tub
  soak:{line:[4, 6, 20, 30], garn:[8, 12, 36, 60], teine:[18, 24, 60, 96]}, soakDef:{line:8, garn:24, teine:48}};
const p2RestRate = where => where === 'anker' ? RORBU.rate * 60 * 0.85 : where === 'bunks' ? RORBU.rate * 60 : DRP2.rest.quay;   // (RORBU is defined later in the build, so it is read when used)
const PLAN2_KIND = {line:'line', garn:'garn', teiner:'teine'};
const p2Kind = o => PLAN2_KIND[o.rig] || null;
const p2Jig = o => !p2Kind(o) || !!o.jig;
let P2_SID = 0;
const plan2Sid = () => 'p' + Date.now().toString(36).slice(-4) + (P2_SID++).toString(36);
function plan2New(over){
  const b = S.boat, here = b.status === 'port' ? b.port : null;
  return Object.assign({v:DRV2, on:false, home:here, anchor:false, rig:RIGS[b.rig] ? b.rig : 'juksa', jig:true, places:[],
    wx:{wind:13, hs:2.5}, dep:5, rhythm:'day', days:3, land:{mode:'near', port:null, when:'full', days:2},
    legs:{}, M:null, homeA:null, restA:null, made:null, err:null, t0:null, run:null, held:null, stop:null, hold:0,
    stats:{days:[], sum:{trips:0, kg:0, kr:0, lott:0, cost:{fuel:0, bait:0, egn:0}, conf:0, sp:{}, port:{}}}}, over || {});
}
// the plan the new engine runs: with the switch off, none (today's plan is left alone); on, a v4, and an older plan is switched off with a word
function plan2Ops(){
  if (!DRIFT2) return null;
  const o = S.ops; if (!o) return null; if (o.v === DRV2) return o;
  S.ops = null;
  msg(gL('Driftsplan', 'Operations plan'), 'Driftsplanen er laget på nytt. Den gamle planen for «' + S.boatName + '» er slått av. Lag en ny under Driftsplan. Redskapet i sjøen står der det står.', 'The operations plan has been made anew. The old plan for «' + S.boatName + '» is switched off. Make a new one under Operations plan. The gear in the sea stays where it is.');
  return null;
}
// ---- the places: a point, a port, or a key ('H' home, 'Q' the home quay, 'M' the plant, 'A' the rest anchorage)
function plan2P(o, k){
  if (k === 'H') return o.homeA || (portById(o.home) || {}).p || null;
  if (k === 'Q') return (portById(o.home) || {}).p || null;
  if (k === 'M') return (portById(o.M) || {}).p || null;
  if (k === 'A') return o.restA || null;
  const q = o.places.find(x => x.id === k); return q ? {x:q.x, y:q.y} : null;
}
const plan2Port = (o, k) => k === 'H' ? (o.homeA ? null : o.home) : k === 'Q' ? o.home : k === 'M' ? o.M : null;
// the hours of a leg: the kept leg (o.legs, 06d-drift.js drLK) at cruising speed, else straight with a fifth on
function plan2LegH(o, a, ap, b, bp, v){
  if (!a || !b) return 0; v = Math.max(1, v || BOAT.vcruise || 7);
  if (drCK(a, ap) === drCK(b, bp) || dist(a, b) < 0.005) return 0;
  const L = o.legs && o.legs[drLK(a, ap, b, bp)];
  if (L && !L.none && L.d != null) return L.d / (v * NM);
  return dist(a, b) * DRP2.legF / (v * NM);
}
// ---- the state the day is reckoned from: where she lies, the hold, the gear in the sea and aboard, the crew, you. Tests pass their own
function plan2State(o){
  const b = S.boat, pg = S.pgear || newPGear(), hold = holdTotal();
  const at = b.status === 'port' || b.status === 'unmooring' ? {p:{x:portById(b.port).p.x, y:portById(b.port).p.y}, port:b.port}
    : o.homeA && dist(b.pos, o.homeA) < 0.4 ? {p:o.homeA, port:null} : o.restA && dist(b.pos, o.restA) < 0.4 ? {p:o.restA, port:null} : {p:{x:b.pos.x, y:b.pos.y}, port:null};
  const V = VESSELS[b.type] || {};
  return {H:S.t / 60, at, hold, cap:capHold(), fresh:S.hold.length ? Math.min(...S.hold.map(x => x.fresh)) : 100,
    sets:mySets().map(s => ({fid:s.fid || null, kind:s.kind, n:s.n, tSet:s.tSet, x:setMid(s).x, y:setMid(s).y})),
    aboard:{line:{n:(pg.lines.hyse.n || 0) + (pg.lines.bank.n || 0), baited:(pg.lines.hyse.baited || 0) + (pg.lines.bank.baited || 0)}, garn:pg.nets.reduce((a, l) => a + l.n, 0), teine:pg.pots.big || 0, bait:Object.values(baitOf(pg)).reduce((a, v) => a + v, 0)},
    crew:crewAboard(null, true).map(c => ({name:c.name, fat:c.fatigue || 0, sk:!!c.sk, mate:!!c.mate, rate:6 * (1.4 - 0.16 * ((c.attr && c.attr.uth) || 2.5)) * ((BOAT.fx && BOAT.fx.fat) || 1) * (V.fac && V.fac.house === 'open' ? 1.1 : 1)})),   // fatigue an hour of fishing (04-crew.js crewTick)
    me:{aboard:meAboard(), energy:S.energy == null ? 100 : S.energy}, bunks:V.berths || 0, house:!!V.watch, crewMax:V.crewMax || 0, v:BOAT.vcruise || 7,
    homeRest:plan2RestOk(o.home), homeShed:!!(portById(o.home) || {}).mottak, dayIndex:o.t0 == null ? 0 : Math.floor((S.t - o.t0) / 1440),
    lost:(S.gearLog || []).filter(e => e.lost && !e.tHaul && e.vid === S.cur).map(e => ({x:e.x, y:e.y, kind:e.kind, n:e.n, t:e.lost}))};
}
function plan2RestOk(pid){ const p = portById(pid); if (!p) return false; return isRorbu(pid) || pid === (S.home || HOME0) || (VESSELS[S.boat.type].berths || 0) > 0; }
// the units ready to set, of the plan's kind
function plan2Ready(kind, st){ return kind === 'line' ? st.aboard.line.baited : kind === 'garn' ? st.aboard.garn : kind === 'teine' ? Math.min(st.aboard.teine, Math.floor(st.aboard.bait / GPRICE.potBait + 1e-9)) : 0; }
// the next departure: today's hour if it has not passed by more than DRP2.late, else tomorrow's; never before `from`
function plan2NextDep(o, H, from){
  const ds = H - driftHod(H); let dep = ds + o.dep;
  if (H > dep + DRP2.late) dep += 24;
  // not before `from` (the rest, the baiting): late the same day when it is within DRP2.late of the hour, else the next day's hour
  if (from != null && dep < from){ if (from <= dep + DRP2.late) dep = from; else { while (dep < from) dep += 24; } }
  return dep;
}
// the watch at an hour: 'A' the skipper's (06–18), 'B' the mate's (18–06), and when it changes
function plan2Watch(H){ const h = driftHod(H), a = h >= DRP2.dayFrom && h < DRP2.dayFrom + DRP2.watch; const next = a ? H - h + DRP2.dayFrom + DRP2.watch : (h < DRP2.dayFrom ? H - h + DRP2.dayFrom : H - h + 24 + DRP2.dayFrom); return {w:a ? 'A' : 'B', until:next}; }
function plan2Roles(st){
  const sk = st.me.aboard ? null : st.crew.find(c => c.sk) || null, mate = st.crew.find(c => c.mate && c !== sk) || st.crew.find(c => c !== sk) || null;
  const deck = st.crew.filter(c => c !== sk && c !== mate), A = (st.me.aboard ? ['deg'] : sk ? [sk.name] : []).concat(deck.filter((c, i) => i % 2 === 0).map(c => c.name)), B = (mate ? [mate.name] : []).concat(deck.filter((c, i) => i % 2 === 1).map(c => c.name));
  return {A, B};
}

// ---- the day. H0: the hour the day begins (the departure). Returns {t0, steps:[{t, k, …}], end, why:[no, en], skipped:[{id, no, en}]}.
// Steps: avgang {from}, sett {pid, n, kind, h}, trekk {pid, n, kind, h, reset, soakH}, juks {pid, h, until}, vent {pid, until},
// lever {port, h} or behold {kg}, agn {port, kg}, hjem {port, anchor}, egning {where, n, ready}, hvile {until, where}, vakt {w, who, until}, ut {}
function planDay(o, H0, st){
  st = st || plan2State(o);
  // o.fetch (the page's «Hent redskapet», choice 2 A): a day of hauls only, whatever the soak, nothing set again, no jig; the engine switches the plan off when nothing stands in the sea
  const fetch = !!o.fetch, kind = p2Kind(o), jig = p2Jig(o) && !fetch, v = st.v, W = DRP2.work, steps = [], skipped = [], nm = id => (portById(id) || {name:'?'}).name;
  const fat0 = st.crew.length ? Math.max(...st.crew.map(c => c.fat)) : 0, watch = o.rhythm === 'watch';
  // the day's length: 14 h, or shorter so nobody passes 72 and you keep 15 % (dagdrift; the watches take care of it round the clock)
  let dayMax = DRP2.dayMax, why = ['dagen er ' + DRP2.dayMax + ' t', 'the day is ' + DRP2.dayMax + ' h'];
  if (!watch){
    // (each hand tires at their own rate, by their stamina: the one who reaches 72 first sets the day)
    const cF = st.crew.map(c => ({c, h:(DRP2.tired - c.fat) / Math.max(1, c.rate || DRP2.fatH)})).sort((a, b) => a.h - b.h)[0], bF = cF ? cF.h : Infinity, bE = st.me.aboard ? (st.me.energy - DRP2.enMin) / DRP2.enH : Infinity;
    if (bF < dayMax){ dayMax = bF; const c = cF.c; why = [c.name.split(' ')[0] + ' blir sliten (' + DRP2.tired + ') etter ' + fmt(bF, 1) + ' t', c.name.split(' ')[0] + ' is tired (' + DRP2.tired + ') after ' + fmt(bF, 1) + ' h']; }
    if (bE < dayMax){ dayMax = bE; why = ['energien din holder ' + fmt(bE, 1) + ' t', 'your energy lasts ' + fmt(bE, 1) + ' h']; }
    dayMax = Math.max(DRP2.minDay, dayMax);
  }
  if (fetch) why = ['henter redskapet, så er planen av', 'fetches the gear, then the plan is off'];
  const endBy = H0 + dayMax, legH = (a, ap, b, bp) => plan2LegH(o, a, ap, b, bp, v);
  let t = H0, at = st.at.p, atPort = st.at.port, ready = kind ? plan2Ready(kind, st) : 0, setToday = 0, hauledLine = 0;
  steps.push({t, k:'avgang', from:atPort});
  if (watch){ const w = plan2Watch(t), R = plan2Roles(st); steps.push({t, k:'vakt', w:w.w, who:w.w === 'A' ? R.A : R.B, until:w.until}); }
  const go = (q, port) => { const h = legH(at, atPort, q, port); t += h; at = q; atPort = port || null; return h; };
  // bait for the pots (two rounds, for those aboard and in the sea); short for a re-set today, she goes to the plant first
  const potsSea = kind === 'teine' ? st.sets.filter(x => x.kind === 'teine').reduce((a, x) => a + x.n, 0) : 0, baitRound = kind === 'teine' ? (st.aboard.teine + potsSea) * GPRICE.potBait : 0;
  const dueSoon = kind === 'teine' ? st.sets.filter(x => x.kind === 'teine' && (() => { const q = o.places.find(y => y.id === x.fid); return q && x.tSet / 60 + q.soak <= H0 + dayMax; })()).reduce((a, x) => a + x.n, 0) : 0;
  if (kind === 'teine' && dueSoon > 0 && st.aboard.bait < dueSoon * GPRICE.potBait - 1e-6 && plan2P(o, 'M') && !watch){ go(plan2P(o, 'M'), o.M); steps.push({t, k:'agn', port:o.M, kg:Math.ceil(baitRound * 2 - st.aboard.bait)}); t += DRP2.stockH; st = Object.assign({}, st, {aboard:Object.assign({}, st.aboard, {bait:baitRound * 2})}); }
  // pass 1: the places in the player's order. A field: haul what is due by arrival (and set again), set what is empty if gear is ready,
  // remember what is not yet due. A jig place: remembered for the jig hours
  const pending = [], jigs = [];
  for (const q of o.places){
    if (q.k === 'juks'){ jigs.push(q); continue; }
    if (!kind){ skipped.push({id:q.id, no:'båten fisker bare med juksa', en:'the boat fishes with the jig only'}); continue; }
    const s = st.sets.find(x => x.fid === q.id);
    if (s){
      const due = s.tSet / 60 + q.soak, hArr = legH(at, atPort, q, null);
      if (fetch || due <= t + hArr){ go(q); const soakH = t - s.tSet / 60; steps.push({t, k:'trekk', pid:q.id, n:s.n, kind, h:s.n * W.trekk[kind], soakH, reset:false, due:fetch ? t : due}); t += s.n * W.trekk[kind]; if (kind === 'line') hauledLine += s.n;
        pending.push({q, due:null, hauled:true}); }
      else pending.push({q, due, s});
    } else if (fetch) skipped.push({id:q.id, no:'ingenting står her', en:'nothing stands here'});
    else {
      const n = Math.min(q.n, ready - setToday);
      if (n >= 1){ go(q); steps.push({t, k:'sett', pid:q.id, n, kind, h:n * W.sett[kind]}); t += n * W.sett[kind]; setToday += n; pending.push({q, due:t + q.soak, setToday:true}); }
      else { const lost = (st.lost || []).find(e => e.kind === kind && dist(e, q) < 0.5); skipped.push(lost ? {id:q.id, no:'redskapet gikk tapt i været (' + lost.n + ' ' + unitName(kind, lost.n) + '). Meld det til Kystvakten under Beholdning', en:'the gear was lost in the weather (' + lost.n + ' ' + unitName(kind, lost.n) + '). Report it to the Coast Guard under Inventory'} : {id:q.id, no:kind === 'line' ? 'lina er ikke egnet' : kind === 'teine' ? (st.aboard.teine < 1 ? 'ingen teiner om bord' : 'ikke nok agn til teinene') : 'ingen garn om bord', en:kind === 'line' ? 'the line is not baited' : kind === 'teine' ? (st.aboard.teine < 1 ? 'no pots aboard' : 'not enough bait for the pots') : 'no nets aboard'}); }
    }
  }
  // what the day must still hold after the fishing: the hauls due today, the landing (decided now, from the rule and the hold) and the way home
  const dueToday = pending.filter(p => p.due != null && p.due <= endBy).sort((a, b) => a.due - b.due);
  const mustFresh = st.hold > 0.5 && keepF(keepDay(st.fresh) + 1) < DRP2.freshLand, L = o.land || {when:'full'};
  const willFish = (jig && (jigs.length || dueToday.length)) || dueToday.length > 0;
  const land = watch ? false : fetch ? (st.sets.length > 0 || st.hold > 0.5) : L.when === 'trip' ? (willFish || st.hold > 0.5) : L.when === 'days' ? ((st.dayIndex % Math.max(1, L.days || 2)) === 0 && (willFish || st.hold > 0.5)) || st.hold >= DRP2.full * st.cap || mustFresh : st.hold >= DRP2.full * st.cap || mustFresh;
  const lineUn = kind === 'line' ? st.aboard.line.n - st.aboard.line.baited + dueToday.reduce((a, p) => a + (p.s ? p.s.n : 0), 0) : 0;
  const needBait = (kind === 'teine' && (st.aboard.teine + potsSea) >= 1 && st.aboard.bait < baitRound - 1e-6) || (kind === 'line' && lineUn >= 1 && st.aboard.bait < lineUn * LINE_KINDS.hyse.baitKg - 1e-6), toM = (land || needBait) && !!plan2P(o, 'M');
  const tailH = () => { let h = 0, a = at, ap = atPort; for (const p of dueToday){ if (p.done) continue; h += legH(a, ap, p.q, null) + p.q.n * (W.trekk[kind] + W.sett[kind]); a = p.q; ap = null; }
    if (toM){ h += legH(a, ap, plan2P(o, 'M'), o.M) + (land ? DRP2.landH : 0) + (needBait ? DRP2.stockH : 0); a = plan2P(o, 'M'); ap = o.M; }
    return h + (watch ? 0 : legH(a, ap, plan2P(o, 'H'), plan2Port(o, 'H'))); };
  // the jig: until the first haul is due, or the day's end less what remains; the hours shared by the player's own numbers (06d-drift.js planJigRate)
  // (the hours until the first haul is due are free whatever the day's length: the haul cannot come sooner, so the jig has them)
  const jigTo = dueToday.length ? dueToday[0].due : watch ? H0 + 24 : endBy - tailH();
  const jigAt = (list, until) => { const hours = until - (t + legH(at, atPort, list[0], null)); if (hours < DRP2.jigMin) return false;
    const R = list.map(j => Math.max(1, planJigRate(j))), Rs = R.reduce((a, r) => a + r, 0);
    list.forEach((j, i) => { const share = hours * (0.5 / list.length + 0.5 * R[i] / Rs); go(j); const h = Math.max(DRP2.jigMin / 2, Math.min(share, until - t)); steps.push({t, k:'juks', pid:j.id, h, until:t + h}); t += h; });
    return true; };
  if (jig && jigs.length) jigAt(jigs, jigTo);
  else if (jig && dueToday.length && jigTo - t >= DRP2.jigMin){ steps.push({t, k:'juks', pid:null, h:jigTo - t, until:jigTo}); t = jigTo; }
  else if (!jig && dueToday.length && dueToday[0].due > t){ go(dueToday[0].q); steps.push({t, k:'vent', pid:dueToday[0].q.id, until:dueToday[0].due}); t = Math.max(t, dueToday[0].due); }
  // pass 2: the hauls in the order they fall due, never before the soak is up; nets and pots are set again, the line only when baited
  // tubs are left and the soak fits before the day ends
  for (const p of dueToday){
    go(p.q); const tArr = t; t = Math.max(t, p.due);
    const n = p.s ? p.s.n : Math.min(p.q.n, ready); const soakH = p.s ? t - p.s.tSet / 60 : p.q.soak, wait = t - tArr;
    let reset = kind !== 'line'; if (kind === 'line'){ const left = ready - setToday; reset = left >= 1 && t + n * W.trekk.line + p.q.soak + n * W.trekk.line + DRP2.landH + 2 <= endBy; }
    steps.push({t, k:'trekk', pid:p.q.id, n, kind, h:n * W.trekk[kind], soakH, reset, wait, due:p.due}); t += n * W.trekk[kind]; if (kind === 'line') hauledLine += n;
    if (reset){ steps.push({t, k:'sett', pid:p.q.id, n, kind, h:n * W.sett[kind]}); t += n * W.sett[kind]; if (kind === 'line') setToday += n; }
    p.done = true;
  }
  for (const p of pending) if (p.due != null && p.due > endBy) skipped.push({id:p.q.id, no:'trekkes ' + (p.due - H0 < 24 ? 'i kveld etter dagen' : p.due - H0 < 48 ? 'i morgen' : 'om ' + Math.ceil((p.due - H0) / 24) + ' døgn') + ' (ståtida er ute kl. ' + driftClock(driftHod(p.due)) + ')', en:'hauled ' + (p.due - H0 < 48 ? 'tomorrow' : 'in ' + Math.ceil((p.due - H0) / 24) + ' days') + ' (the soak is up at ' + driftClock(driftHod(p.due)) + ')'});
  // the rest of the day by the gear, with the jig
  if (!watch && jig && dueToday.length){ const left = endBy - tailH() - t; if (left >= DRP2.jigMin){ const j = jigs.length ? jigs[jigs.length - 1] : null; if (j) go(j); steps.push({t, k:'juks', pid:j ? j.id : null, h:left, until:t + left}); t += left; } }
  // the landing: every trip, when the hold is full or the fish must go, or every N days (the engine lands sooner when the hold fills)
  if (watch){ steps.push({t:null, k:'lever', port:o.M, full:true}); steps.push({t:null, k:'ut'}); }
  else if (toM){ const M = plan2P(o, 'M'); { go(M, o.M); if (land){ steps.push({t, k:'lever', port:o.M, h:DRP2.landH}); t += DRP2.landH; } if (needBait){ steps.push({t, k:'agn', port:o.M, kg:Math.ceil((kind === 'teine' ? baitRound * 2 : lineUn * LINE_KINDS.hyse.baitKg) - st.aboard.bait)}); t += DRP2.stockH; } } }
  else if (st.hold > 0.5) steps.push({t, k:'behold', kg:Math.round(st.hold)});
  // home (or the night aboard on a long trip), the baiting, the rest
  if (!watch){
    const multi = o.rhythm === 'multi', last = multi && st.dayIndex % Math.max(2, o.days || 2) === Math.max(2, o.days || 2) - 1;
    if (multi && !last){ const A = plan2P(o, 'A'), M = plan2P(o, 'M'); if (A){ go(A); steps.push({t, k:'hvile', where:'anker', until:null}); } else if (M){ go(M, o.M); steps.push({t, k:'hvile', where:'kai', until:null}); } }
    else { const H = plan2P(o, 'H'), hp = plan2Port(o, 'H'); go(H, hp); steps.push({t, k:'hjem', port:o.home, anchor:!!o.homeA}); }
    const home = t;
    let ready2 = home;
    if (kind === 'line'){ const un = Math.max(0, st.aboard.line.n - st.aboard.line.baited + hauledLine); if (un >= 1){ const hands = Math.max(1, st.crew.length + (st.me.aboard ? 1 : 0)), coop = DRP2.egn.coop[Math.min(hands, DRP2.egn.coop.length - 1)];
      const where = st.homeShed && !(multi && !last) ? 'egnebu' : 'mannskapet', h = where === 'egnebu' ? DRP2.egn.shedH + un * DRP2.egn.shedPer : un * DRP2.egn.selfH / coop; ready2 = home + h; steps.push({t:home, k:'egning', where, n:un, ready:ready2}); } }
    const seaH = home - H0, fatEnd = fat0 + seaH * (st.crew.length ? Math.max(...st.crew.map(c => c.rate || DRP2.fatH)) : DRP2.fatH), rate = multi && !last ? p2RestRate('anker') : st.homeRest ? p2RestRate('bunks') : p2RestRate('quay');
    const restH = Math.max(0, (fatEnd - DRP2.rested) / rate), until = Math.max(home + restH, ready2);
    if (seaH > dayMax + 0.1) why = ['dagen blir ' + fmt(seaH, 1) + ' t: ståtida' + (land ? ', leveringen' : '') + ' og veien hjem gir ikke kortere dag', 'the day comes to ' + fmt(seaH, 1) + ' h: the soak' + (land ? ', the landing' : '') + ' and the way home allow no shorter day'];
    steps.push({t:home, k:'hvile', where:multi && !last ? 'anker' : 'hjem', until, fat:Math.round(fatEnd)});
    for (const s of steps) if (s.k === 'hvile' && s.until == null) s.until = until;
    return {t0:H0, steps, end:until, home, why, skipped, dayMax};
  }
  // round the clock: the watches of the coming 24 hours
  { let w = plan2Watch(H0); const R = plan2Roles(st); for (let k = 0; k < 2; k++){ const nw = plan2Watch(w.until + 0.01); steps.push({t:w.until, k:'vakt', w:nw.w, who:nw.w === 'A' ? R.A : R.B, until:nw.until}); w = nw; } }
  steps.sort((a, b) => (a.t == null ? 1e9 : a.t) - (b.t == null ? 1e9 : b.t));
  return {t0:H0, steps, end:H0 + 24, home:null, why:['døgndrift: to vakter à ' + DRP2.watch + ' t', 'round the clock: two watches of ' + DRP2.watch + ' h'], skipped, dayMax:24};
}
// ---- the day as text: [[clock, no, en], …], one line a step, the skipped places and the reason last
function planDayText(o, day){
  const nm = id => (portById(id) || {name:'?'}).name, pl = id => { const q = o.places.find(x => x.id === id), i = q ? o.places.filter(x => x.k === q.k).indexOf(q) + 1 : '?'; return q && q.k === 'juks' ? ['juksplass ' + i, 'jig place ' + i] : ['felt ' + i, 'field ' + i]; };
  const kind = p2Kind(o), U = kind ? GEAR[kind].u : ['', '', '', ''], un = (n, lang) => U[lang === 'no' ? (n === 1 ? 0 : 1) : (n === 1 ? 2 : 3)];
  const ck = t => t == null ? '–' : driftClock(driftHod(t)), out = [];
  for (const s of day.steps){
    const c = ck(s.t); let no = '', en = '';
    if (s.k === 'avgang'){ no = 'Går fra ' + (s.from ? nm(s.from) : 'der båten ligger'); en = 'Leaves ' + (s.from ? nm(s.from) : 'where the boat lies'); }
    else if (s.k === 'sett'){ no = 'Setter ' + s.n + ' ' + un(s.n, 'no') + ' på ' + pl(s.pid)[0]; en = 'Sets ' + s.n + ' ' + un(s.n, 'en') + ' at ' + pl(s.pid)[1]; }
    else if (s.k === 'trekk'){ no = 'Trekker ' + pl(s.pid)[0] + ' (sto ' + fmt(s.soakH, 1) + ' t)' + (s.reset ? ', setter på nytt' : ''); en = 'Hauls ' + pl(s.pid)[1] + ' (stood ' + fmt(s.soakH, 1) + ' h)' + (s.reset ? ', sets again' : ''); }
    else if (s.k === 'juks'){ no = 'Jukser ' + (s.pid ? 'på ' + pl(s.pid)[0] : 'ved redskapet') + ' til kl. ' + ck(s.until) + ' (' + fmt(s.h, 1) + ' t)'; en = 'Jigs ' + (s.pid ? 'at ' + pl(s.pid)[1] : 'by the gear') + ' until ' + ck(s.until) + ' (' + fmt(s.h, 1) + ' h)'; }
    else if (s.k === 'vent'){ no = 'Venter ved ' + pl(s.pid)[0] + ' til ståtida er ute kl. ' + ck(s.until); en = 'Waits by ' + pl(s.pid)[1] + ' until the soak is up at ' + ck(s.until); }
    else if (s.k === 'lever'){ no = s.full ? 'Leverer i ' + nm(s.port) + ' når lasten er full' : 'Leverer i ' + nm(s.port); en = s.full ? 'Lands at ' + nm(s.port) + ' when the hold is full' : 'Lands at ' + nm(s.port); }
    else if (s.k === 'behold'){ no = 'Beholder ' + s.kg + ' kg om bord til i morgen'; en = 'Keeps ' + s.kg + ' kg aboard until tomorrow'; }
    else if (s.k === 'agn'){ no = 'Kjøper ' + s.kg + ' kg agn i ' + nm(s.port); en = 'Buys ' + s.kg + ' kg of bait at ' + nm(s.port); }
    else if (s.k === 'hjem'){ no = 'Hjem til ' + nm(s.port) + (s.anchor ? ', til ankers' : ''); en = 'Home to ' + nm(s.port) + (s.anchor ? ', at anchor' : ''); }
    else if (s.k === 'egning'){ no = (s.where === 'egnebu' ? 'Egnebua egner ' + s.n + ' stamper, klar kl. ' + ck(s.ready) : 'Mannskapet egner ' + s.n + ' stamper underveis eller ved kai, klar senest kl. ' + ck(s.ready)); en = (s.where === 'egnebu' ? 'The shed baits ' + s.n + ' tubs, ready at ' + ck(s.ready) : 'The crew bait ' + s.n + ' tubs under way or at the quay, ready by ' + ck(s.ready)); }
    else if (s.k === 'hvile'){ no = (s.where === 'anker' ? 'Hviler om bord' : s.where === 'kai' ? 'Hviler ved kaia' : 'Hviler') + ' til kl. ' + ck(s.until); en = (s.where === 'anker' ? 'Rests aboard' : s.where === 'kai' ? 'Rests at the quay' : 'Rests') + ' until ' + ck(s.until); }
    else if (s.k === 'vakt'){ no = 'Vakt ' + s.w + ' til kl. ' + ck(s.until) + ': ' + s.who.join(', '); en = 'Watch ' + s.w + ' until ' + ck(s.until) + ': ' + s.who.join(', '); }
    else if (s.k === 'ut'){ no = 'Ut igjen'; en = 'Out again'; }
    out.push([c, no, en]);
  }
  for (const x of day.skipped) out.push(['', pl(x.id)[0] + ': ' + x.no, pl(x.id)[1] + ': ' + x.en]);
  out.push(['', 'Dagen: ' + day.why[0] + '.', 'The day: ' + day.why[1] + '.']);
  return out;
}
// ---- the check: errors keep the plan from being switched on, warnings only inform (as driftCheck; the rhythm's rules from Jonas 26.10.2026)
function plan2Check(o, st){
  st = st || plan2State(o); const E = [], Wn = [], kind = p2Kind(o), no = gL, hp = portById(o.home);
  if (!hp) E.push(no('Velg hvor båten skal ligge hjemme.', 'Choose where the boat lies at home.'));
  if (!RIGS[o.rig]) E.push(no('Velg hva båten skal fiske med.', 'Choose what the boat fishes with.'));
  else if (!rigHas(o.rig)) E.push(no('Båten mangler haleren til ' + rigName(o.rig).toLowerCase() + '. Monter den under Oppgrader på verftet.', 'The boat has no hauler for ' + rigName(o.rig).toLowerCase() + '. Fit one under Upgrade at the yard.'));
  const F = o.places.filter(q => q.k === 'felt'), J = o.places.filter(q => q.k === 'juks');
  if (kind && !F.length) E.push(no('Legg ut minst ett felt for ' + rigName(o.rig).toLowerCase() + '.', 'Put out at least one field for the ' + rigName(o.rig).toLowerCase() + '.'));
  if (!kind && !J.length) E.push(no('Velg minst én juksplass.', 'Choose at least one jig place.'));
  if (o.places.length > DRP2.placesMax) E.push(no('Høyst ' + DRP2.placesMax + ' plasser.', 'At most ' + DRP2.placesMax + ' places.'));
  if (kind){ const own = ownedUnits(kind), want = F.reduce((a, f) => a + f.n, 0), sk = DRP2.soak[kind];
    { const k = (S.pgear && S.pgear.kits ? S.pgear.kits.n : 0) || 0; if (F.length > k) Wn.push(no('Hver lenke i sjøen trenger et blåsesett, og båten har ' + k + ' til ' + F.length + ' felt. Kjøp i utstyrsbutikken.', 'Every string in the sea needs a buoy set, and the boat has ' + k + ' for ' + F.length + ' fields. Buy them at the gear shop.')); }
    if (want > own) Wn.push(no('Feltene vil ha ' + want + ' ' + unitName(kind, want) + ', men båten eier ' + own + '. De første feltene får det som finnes.', 'The fields want ' + want + ' ' + unitName(kind, want) + ', but the boat owns ' + own + '. The first fields get what there is.'));
    for (const f of F){ if (f.soak < sk[0]) Wn.push(no('Ståtiden ' + f.soak + ' t er kort for ' + GEAR[kind].no.toLowerCase() + '.', 'A soak of ' + f.soak + ' h is short for ' + GEAR[kind].en.toLowerCase() + '.')); else if (f.soak > sk[3]) Wn.push(no('Ståtiden ' + f.soak + ' t er lang for ' + GEAR[kind].no.toLowerCase() + '. Fangsten forringes og redskapet kan gå tapt.', 'A soak of ' + f.soak + ' h is long for ' + GEAR[kind].en.toLowerCase() + '. The catch spoils and the gear can be lost.')); }
    if (kind === 'garn' && st.crewMax < 1) E.push(no('Garn krever to om bord, og båten har ikke plass til flere.', 'Nets need two aboard, and the boat has no room for more.')); }
  { const r = drRulesWhy({fields:F, jigs:J, rig:o.rig, jig:o.jig}, S.t / 60, true); if (r) E.push(gL(r.no, r.en)); }
  // no access to cod, haddock and saithe without you aboard (the open group, J-30-2026 § 35; a second vessel: none): bycatch at most, and with halibut gear the plan fishes halibut
  if (!S.lic && o.rig !== 'teiner' && (S.cur !== openVesselId() || !st.me.aboard) && !(S.boat.kgear && !kveiteClosed(S.t / 60)))
    Wn.push(S.cur !== openVesselId() ? no('Båten har ikke adgang til å fiske torsk, hyse og sei. De kan bare være bifangst, høyst 10 % av landingen, og resten blir inndratt. Med kveiteutstyr fisker planen kveite.', 'The boat has no access to fish cod, haddock and saithe. They can only be bycatch, at most 10% of the landing, and the rest is confiscated. With halibut gear the plan fishes halibut.')
      : no('I åpen gruppe må du være om bord for å fiske torsk, hyse og sei. Uten deg kan de bare være bifangst, høyst 10 % av landingen, og resten blir inndratt. Kjøp kveiteutstyr i butikken, så fisker planen kveite når du ikke er med.', 'In the open group you must be aboard to fish cod, haddock and saithe. Without you they can only be bycatch, at most 10% of the landing, and the rest is confiscated. Buy halibut gear at the shop, and the plan fishes halibut when you are not along.'));
  if (!st.me.aboard){ if (st.crewMax < 2) Wn.push(no('Båten har plass til bare én i mannskapet, så planen går bare når du er om bord.', 'The boat has room for only one crew, so the plan runs only when you are aboard.'));
    else if (!st.crew.some(c => c.sk) || !st.crew.some(c => c.mate && !c.sk)) E.push(no('Når du ikke er om bord, må både en skipper og en styrmann være utnevnt. Gjør det på Mannskap-siden.', 'When you are not aboard, both a skipper and a mate must be appointed. Do it on the Crew page.')); }
  const aboard = st.crew.length + (st.me.aboard ? 1 : 0);
  if (o.rhythm === 'watch'){
    if (st.crew.length < 4) E.push(no('Døgndrift krever fire i mannskapet: skipper, styrmann og to på dekk. Båten har ' + st.crew.length + '.', 'Round the clock needs four crew: a skipper, a mate and two on deck. The boat has ' + st.crew.length + '.'));
    if (!st.house) E.push(no('Døgndrift krever styrhus og køyer om bord.', 'Round the clock needs a wheelhouse and bunks aboard.'));
    else if (st.bunks < aboard) E.push(no('Døgndrift krever køyer til alle om bord: båten har ' + st.bunks + ', dere er ' + aboard + '.', 'Round the clock needs bunks for everyone aboard: the boat has ' + st.bunks + ', you are ' + aboard + '.')); }
  if (o.rhythm === 'multi' && !(st.bunks > 0)) E.push(no('Turer over flere døgn krever køyer om bord.', 'Trips of several days need bunks aboard.'));
  if (hp && o.rhythm !== 'watch' && st.crew.length && !st.homeRest) Wn.push(no('Båten har ingen køyer, og ' + hp.name + ' er en vanlig kai. Mannskapet hviler dårlig der.', 'The boat has no bunks, and ' + hp.name + ' is an ordinary quay. The crew rest poorly there.'));
  if (o.anchor && (BOAT.len || 0) < DRP.bigLen) E.push(no('Bare båter fra ' + DRP.bigLen + ' m kan ligge til ankers hjemme.', 'Only boats from ' + DRP.bigLen + ' m can lie at anchor at home.'));
  if (o.land && o.land.mode === 'port' && !(portById(o.land.port) || {}).mottak) E.push(no('Velg et fiskemottak å levere på.', 'Choose a fish plant to land at.'));
  if (!E.length && o.rhythm !== 'watch' && o.places.length){ try { const d = planDay(o, plan2NextDep(o, S.t / 60), st), seaH = d.home - d.t0; if (seaH > d.dayMax + 1) Wn.push(no('Dagen blir ' + fmt(seaH, 1) + ' t med disse plassene og mottaket ' + (o.M ? fmt(dist(plan2P(o, 'M'), plan2P(o, 'H')) / NM, 0) + ' nm unna' : 'så langt unna') + '. Mannskapet blir slitne.', 'The day comes to ' + fmt(seaH, 1) + ' h with these places and the plant ' + (o.M ? fmt(dist(plan2P(o, 'M'), plan2P(o, 'H')) / NM, 0) + ' nm away' : 'so far away') + '. The crew get tired.')); } catch (e){} }
  if (o.wx.hs > BOAT.risk[1] * 0.95) Wn.push(no('Båten tåler ikke mer enn ' + fmt(BOAT.risk[1] * 0.95, 1) + ' m sjø, så den grensen gjelder.', 'The boat takes no more than ' + fmt(BOAT.risk[1] * 0.95, 1) + ' m of sea, so that limit holds.'));
  return {ok:!E.length, errors:E, warnings:Wn};
}
