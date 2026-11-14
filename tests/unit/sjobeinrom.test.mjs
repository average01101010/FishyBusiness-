// The sea legs' room on each boat's own model (FB4, steg 120, 13.11.2026; deckcrew.js seaRoom, seaScan, seaClip over vessel3d.js
// deckMap; Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger, rekka eller andre ting»): with the deck 15°
// either way and fore and aft, nobody at a break's place or at the work has a leg, the spine, a shoulder or the head through
// anything that is clear on a level deck. Without a browser.
export const scripts = ['js/vessel3d.js', 'js/deckcrew.js'];
export const data = true;

export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), {VESSELS, CREW3D, applyVessel, genCrew, GROUNDS} = K;
  K.set('hsWork', () => 0.3); K.set('hsAt', () => 0.3);   // (no chart in Node: a calm sea)
  const g0 = GROUNDS[2].p, b = S.boat, settle = () => { const ST = CREW3D._st; ST.ctxT = -1e9; ST.lastSim = null; CREW3D.tick(0.05); ST.ctxT = -1e9; CREW3D.tick(0.05); };
  const bad = {}, work = {}; let places = 0, boats = 0, upright = 0, braced = 0;
  for (const vt of Object.keys(VESSELS)){ const V = VESSELS[vt];
    S.tut = 0; S.me = S.cur; b.type = vt; applyVessel(); CREW3D.reset(); if (!CREW3D.on()) continue; boats++;
    S.crew = [...Array(Math.min(3, V.crewMax || 1)).keys()].map(() => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62}));
    b.status = 'idle'; b.port = null; b.pos = {...g0}; b.gop = null; S.hold = []; b.deckStop = false; S.equip.linehaler = true; S.equip.garnhaler = true; settle();
    const R = CREW3D.seaScan(); for (const k in R){ places += R[k][1]; if (R[k][0] !== R[k][1]) (bad[vt] = bad[vt] || {})[k] = R[k]; }
    // (the work: hauling line, everyone at a station)
    b.status = 'fishing'; b.gop = {op:'haul', kind:'line', n:10, done:2, prog:0, a:{...g0}, b:{x:g0.x + 0.2, y:g0.y}, hooksPer:300}; S.hold = [{sp:'torsk', kg:200, gut:false, iced:false}]; S.t += 40; settle();
    for (const c of CREW3D.seaClip() || []){ if (c.n) (work[vt] = work[vt] || []).push(c.task + ':' + c.n); for (const u of c.room.r.concat(c.room.f)) u >= 1 ? upright++ : braced++; }
    b.gop = null; }
  t.ok(boats >= 10 && places > 300, 'sjøbeinas rom er målt på hver båt med dekkskart (' + boats + ' båter, ' + places + ' plasser og pauser)');
  t.ok(!Object.keys(bad).length, 'med dekket 15° hver vei går ingen i en pause gjennom noe som er fritt på rett kjøl ' + JSON.stringify(bad));
  t.ok(!Object.keys(work).length, 'og ingen på stasjonen sin under linetrekket ' + JSON.stringify(work));
  t.ok(upright > 0 && braced > 0, 'noen har rom til å stå oppreist i sjøen, andre står vinkelrett på dekket inntil det de står ved (' + upright + ' retninger med alt rommet, ' + braced + ' med mindre)');
}
