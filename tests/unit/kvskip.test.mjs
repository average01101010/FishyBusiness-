// The coast guard's ships (steg 100, valg 30 V1 C, V2 A; core/09j-kystvakt.js, tools/boats/kv.py): the 47 m one at the quay and along
// the coast, the 93 m one at sea aboard an ocean vessel, each with the model's own length and beam; where she lies (rafted on the port side
// at the quay, where the quay is to the boat's starboard; off the starboard side along the coast; off the port side at sea), never so close
// that the hulls meet, for every boat in VESSELS; and the RIB's stages through the 90 minutes of the check at sea.
export default function (t){
  const K = t.K, {KV, KVH, KVS, VESSELS, kvOff, kvRib, kvNpcs, kvPose, kvState, newState} = K;
  const S = newState(); K.set('S', S);

  // the ships and their models (the lengths and beams in tools/boats/kv.py's SHIPS, from the sources in kystvakt-grunnlag.md)
  t.ok(KVS.kyst.t === 'kv47' && KVS.kyst.L === 47.2 && KVS.kyst.B === 10.3, 'langs kysten og ved kai: skipet på 47,2 × 10,3 m (kv47)');
  t.ok(KVS.hav.t === 'kv90' && KVS.hav.L === 93.0 && KVS.hav.B === 16.6, 'til havs: skipet på 93 × 16,6 m (kv90)');
  t.ok(KVS.hav.rib && KVS.hav.rib.L >= 7 && KVS.hav.rib.L <= 9 && !KVS.kyst.rib, 'bare det store setter ut lettbåten (7–9 m), ved kai trengs den ikke');

  // the NPC she is in the list: her own model, length and beam (before steg 100 she was the 15 m coastal boat, type kyst, 15 × 5 m)
  const st = kvState(); st.visit = {t0:S.t, hav:null, p:{x:500, y:500}, hd:0, v:0};
  let n = kvNpcs()[0];
  t.ok(n && n.kv && n.vtype === 'kv47' && n.L === 47.2 && n.B === 10.3 && !n.rib, 'ved kai og langs kysten: kv47 med modellens lengde og bredde, uten lettbåt', n && [n.vtype, n.L, n.B]);
  st.visit.hav = true; n = kvNpcs()[0];
  t.ok(n && n.vtype === 'kv90' && n.L === 93.0 && n.B === 16.6 && n.rib && n.rib.t0 === S.t, 'til havs: kv90, og lettbåtens klokke fra besøkets start', n && [n.vtype, n.L, n.B]);

  // where she lies: across from the boat by the two half-beams and the gap, for every type; the sides
  let close = [], sides = true;
  for (const k of Object.keys(VESSELS)){
    const bB = VESSELS[k].beam;
    for (const [w, sh, gap] of [['kai', KVS.kyst, KV.gap.kai], ['sjo', KVS.kyst, KV.gap.sjo], ['hav', KVS.hav, KVH.gapMin]]){
      const d = kvOff(bB, sh, w), clear = Math.abs(d) * 1000 - bB / 2 - sh.B / 2;
      if (clear < gap - 1e-9) close.push([k, w, +clear.toFixed(2)]);
      if ((w === 'sjo') !== (d > 0)) sides = false;
    }
  }
  t.ok(!close.length, 'skrogene går aldri i hverandre: minst ' + KV.gap.kai + ' m klart ved kai, ' + KV.gap.sjo + ' m langs kysten og ' + KVH.gapMin + ' m til havs, for alle båttypene', close.slice(0, 4));
  t.ok(sides, 'ved kai om babord (kaia er om styrbord), langs kysten om styrbord, til havs om babord');
  t.ok(Math.abs(kvOff(15.5, KVS.hav, 'hav')) >= KVH.side, 'til havs ligger hun minst ' + KVH.side * 1000 + ' m unna, som før');

  // at sea (not at the quay): her place is the boat's position moved across by kvOff, her heading the boat's
  const b = S.boat; b.type = 'kyst15'; b.status = 'fishing'; b.pos = {x:600, y:700}; b.heading = 0.7;
  st.visit.hav = null; let q = kvPose(b), d = kvOff(VESSELS.kyst15.beam, KVS.kyst, 'sjo');
  const across = (q.p.x - b.pos.x) * Math.cos(b.heading) + (q.p.y - b.pos.y) * Math.sin(b.heading), along = (q.p.x - b.pos.x) * Math.sin(b.heading) - (q.p.y - b.pos.y) * Math.cos(b.heading);
  t.ok(q.hd === b.heading && Math.abs(along) < 1e-9 && across >= d - 1e-9 && across <= d + 0.0401, 'langs kysten: ved siden av båten om styrbord, samme kurs', [+(across * 1000).toFixed(1), +(d * 1000).toFixed(1)]);
  st.visit.hav = true; b.type = 'snokrabbe'; q = kvPose(b); d = kvOff(VESSELS.snokrabbe.beam, KVS.hav, 'hav');
  t.near(Math.hypot(q.p.x - b.pos.x, q.p.y - b.pos.y), Math.abs(d), 1e-9, 'til havs: av babord, ' + Math.round(Math.abs(d) * 1000) + ' m mellom sentrene');

  // the RIB: lowered, across, alongside, back and hoisted, together the 90 minutes of the check
  t.eq(K.KVRIB.reduce((a, s) => a + s[1], 0), KVH.visitMin, 'lettbåtens faser er til sammen kontrollens ' + KVH.visitMin + ' minutter');
  t.ok(kvRib(-1).ph === 'davit' && kvRib(1).ph === 'ned' && kvRib(5).ph === 'ut' && kvRib(40).ph === 'side' && kvRib(85).ph === 'inn' && kvRib(89).ph === 'opp' && kvRib(90).ph === 'davit',
    'lettbåten: i daviten, firt ned, over, langs fartøyets babord side, tilbake, heist inn');
  t.near(kvRib(5).f, 0.5, 1e-9, 'fasen har sin egen klokke (halvveis over etter fem minutter)');
}
