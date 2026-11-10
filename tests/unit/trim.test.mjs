// The boat in the sea with a load: trim, list and the crew's weight (OB15, 09.11.2026; docs/planer/om-bord.md kap. 5, S1–S3;
// core/03c-stability.js STAB_AT, stabLoad, stabOf, hullRest). The load has its place aboard, read off the models' anchors: the hold or
// the boxes on the floor, the nets, the line tubs and the pots on deck, the tubs waiting at the table, the hauler, and the people at their
// stations (90 kg each). Checked: nothing aboard in still water lies level and upright; a full hold aft trims her by the stern and one
// forward by the head; the nets on the stern press the stern down; the line in the hauler heels her towards it; a person at the rail of
// a small boat heels her a little; and the 3D hull (hullRest, hullStep) lies at the trim the core reckons.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// a boat model's anchors (vessel3d.js glbLoad: the GLB's scenes[0].extras.anchors), read from the exported src/data/<file>.b64
function anchorsOf(file){
  const b = Buffer.from(readFileSync(join(ROOT, 'src', 'data', file), 'utf8').trim(), 'base64'), n = b.readUInt32LE(12);
  return JSON.parse(b.subarray(20, 20 + n).toString('utf8')).scenes[0].extras.anchors;
}
export default function (t){
  const K = t.K, DEG = 180 / Math.PI;
  const KYST = ['skiff', 'trebat', 'snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21'];
  const empty = {hold:0, deck:0, gear:0};
  const full = type => ({hold:K.VESSELS[type].holdCap, deck:0, gear:0});

  // ---- nothing aboard, still water: on an even keel and upright ----
  for (const type of KYST){
    const St = K.stabOf(type, empty);
    t.near((St.trim || 0) * DEG, 0, 0.05, type + ': tom båt ligger på rett kjøl (trim i grader)');
    t.near((St.list || 0) * DEG, 0, 0.05, type + ': tom båt ligger uten slagside (grader)');
  }

  // ---- the hold has its place: aft on the havsjark (the hatch abaft the wheelhouse), forward on the trebåt (the boxes in the fore part) ----
  { const St = K.stabOf('sjark', full('sjark'));
    t.ok(St.trim > 0.5 / DEG && St.trim < 6 / DEG, 'sjark med fullt rom akter: tung akter, 0,5–6° (' + (St.trim * DEG).toFixed(2) + '°)'); }
  { const St = K.stabOf('trebat', full('trebat'));
    t.ok(St.trim < -0.2 / DEG && St.trim > -6 / DEG, 'trebåt med fulle kasser forut: tung forut (' + (St.trim * DEG).toFixed(2) + '°)'); }
  // more in the hold, more trim (and the same way)
  { const a = K.stabOf('sjark', {hold:2000, deck:0, gear:0}).trim, b = K.stabOf('sjark', full('sjark')).trim;
    t.ok(a > 0 && b > a, 'sjark: mer i rommet gir mer trim akter (' + (a * DEG).toFixed(2) + '° → ' + (b * DEG).toFixed(2) + '°)'); }

  // ---- the plastsjark's hold is aft of the wheelhouse (OB7, 09.11.2026: the house forward, «stort lasterom akter»): a full hold trims her by the stern ----
  { const St = K.stabOf('plastsjark', {hold:3000, deck:0, gear:0});
    t.ok(St.trim > 0.1 / DEG, 'plastsjark med 3 t i rommet akter: hekken ned (' + (St.trim * DEG).toFixed(2) + '°)'); }

  // ---- 30 nets on the stern press the stern down (the den nye hurtigsjarken's net place is on the stern) ----
  { const St = K.stabOf('hurtigsjark', {hold:0, deck:0, gear:30 * 9, gp:{net:30 * 9}});
    t.ok(St.trim > 0.1 / DEG, 'hurtigsjark med 30 garn på hekken: hekken ned (' + (St.trim * DEG).toFixed(2) + '°)'); }

  // ---- the havsjark's nets and line tubs stand in the starboard gangway aft, by the setting port in the stern (OB8, 10.11.2026; before,
  // forward of the hatch to port): 30 nets trim her by the stern and heel her a little to starboard ----
  { const St = K.stabOf('sjark', {hold:0, deck:0, gear:30 * 9, gp:{net:30 * 9}});
    t.ok(St.trim > 0.3 / DEG, 'sjark med 30 garn akter: hekken ned, over 0,3° (' + (St.trim * DEG).toFixed(2) + '°)');
    t.ok(St.list > 0, 'sjark med 30 garn i styrbord gang akter: slagside mot styrbord (' + (St.list * DEG).toFixed(2) + '°)'); }

  // ---- the line in the hauler heels her towards it (the hauler on the starboard rail) ----
  for (const type of ['sjark', 'plastsjark', 'kyst15']){
    const St = K.stabOf(type, {hold:0, deck:0, gear:0, pull:200, crew:['haling']});
    t.ok(St.list > 0.3 / DEG && St.list < St.deckEdge, type + ': 200 kg i haleren om styrbord gir krengning mot styrbord (' + (St.list * DEG).toFixed(2) + '°)');
  }
  // the heavier the pull, the more she heels
  { const a = K.stabOf('sjark', {hold:0, deck:0, gear:0, pull:100}).list, b = K.stabOf('sjark', {hold:0, deck:0, gear:0, pull:300}).list;
    t.ok(b > a && a > 0, 'sjark: tyngre trekk, mer krengning (' + (a * DEG).toFixed(2) + '° → ' + (b * DEG).toFixed(2) + '°)'); }

  // ---- the people weigh 90 kg each: one at the rail of the trebåt and the skiff heels her a little ----
  for (const type of ['trebat', 'skiff']){
    const St0 = K.stabOf(type, empty), St = K.stabOf(type, {hold:0, deck:0, gear:0, crew:['fiske']});
    t.ok(St.D > St0.D + 0.08, type + ': en om bord veier 90 kg (' + ((St.D - St0.D) * 1000).toFixed(0) + ' kg)');
    t.ok(St.list > 0.3 / DEG && St.list < 8 / DEG, type + ': en ved ripa om styrbord krenger henne litt (' + (St.list * DEG).toFixed(2) + '°)');
  }
  // the skiff (stiff, GM 2 m) heels less than the trebåt for the same person
  { const a = K.stabOf('skiff', {hold:0, deck:0, gear:0, crew:['fiske']}).list, b = K.stabOf('trebat', {hold:0, deck:0, gear:0, crew:['fiske']}).list;
    t.ok(a < b, 'skiffen (GM 2 m) krenger mindre enn trebåten for samme person (' + (a * DEG).toFixed(2) + '° mot ' + (b * DEG).toFixed(2) + '°)'); }

  // ---- water in the hull alone (it has no place: a level layer) sinks her without trimming her ----
  { const St = K.stabOf('sjark', {hold:1000, deck:0, gear:0, water:1000});
    t.near(St.trim * DEG, 0, 0.02, 'sjark med 1 t vann i skroget: dypere, men ingen trim'); }

  // ---- the 3D hull lies at the core's trim: hullRest at the load's centre of gravity, and hullStep keeps her there in still water ----
  for (const type of ['sjark', 'trebat', 'skiff']){
    const A = K.stabPlaces(type), H = K.hullSections(type, A.bow, A.stern), St = K.stabOf(type, full(type)), R = K.hullRest(H, St.D, K.hullRest(H, St.D).zG + St.dzG);
    t.near(R.th0 * DEG, St.trim * DEG, 0.01, type + ': skroget i 3D ligger med kjernens trim');
    const X = K.hullX(R), eta = new Float64Array(H.n); for (let i = 0; i < 120 * 10; i++) K.hullStep(H, R, X, eta, null, 1 / 120, {});
    t.near(X.th * DEG, St.trim * DEG, 0.05, type + ': og blir liggende slik i stille vann (10 s)');
    t.near(X.y, R.y0, 0.01, type + ': på samme høyde');
  }

  // ---- STAB_AT is read off the model (OB9, 10.11.2026, the used hurtigsjark): the bench moved aft abreast the hatch, the line tubs forward
  // under the shelter, and the game's waterline the empty boat's (WLE, 5 cm under the drawn one), so the deck stands 5 cm higher. Each
  // place the table holds for her against the exported anchors, within 2 cm ----
  { const A = anchorsOf('boat-hurtig11.b64'), T = K.STAB_AT.hurtigsjark, xz = p => [p[0], p[2]];
    const pairs = {dy:[T.dy, A.deck.y], table:[T.table, xz(A.work.table)], deck:[T.deck, xz(A.work.tub)], tub:[T.tub, xz(A.kit.stamps.at)], net:[T.net, xz(A.kit.garn.at)],
      haul:[T.haul, xz(A.hauler)], helm:[T.helm, xz(A.skipperAt)], hatch:[T.hatch, A.hatch[2]], stern:[T.stern, A.stern]};
    for (const k in pairs){ const [a, b] = pairs[k], d = Array.isArray(a) ? Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) : Math.abs(a - b);
      t.ok(d < 0.02, 'hurtigsjark: STAB_AT.' + k + ' er modellens (' + JSON.stringify(a) + ' mot ' + JSON.stringify(b) + ')'); } }
  // ---- the same for the new hurtigsjark (OB10, 10.11.2026): the game's waterline is the empty boat's (WLE, 0.665 m under the drawing's
  // largest, which carries 45 t), so the deck stands 1.6 m over the water; the bench to port abreast the hatch, the line tubs along the
  // hatch's starboard side aft, the pots in the starboard quarter and on the hatch ----
  { const A = anchorsOf('boat-hs11.b64'), T = K.STAB_AT.sjarkny, xz = p => [p[0], p[2]], P = A.kit.pots.at;
    const pairs = {dy:[T.dy, A.deck.y], table:[T.table, xz(A.work.table)], deck:[T.deck, xz(A.work.tub)], tub:[T.tub, xz(A.kit.stamps.at)], net:[T.net, xz(A.kit.garn.at)],
      haul:[T.haul, xz(A.hauler)], helm:[T.helm, xz(A.skipperAt)], hatch:[T.hatch, A.hatch[2]], stern:[T.stern, A.stern],
      pots:[T.pots, [P.reduce((a, q) => a + q[0], 0) / P.length, P.reduce((a, q) => a + q[2], 0) / P.length]]};
    for (const k in pairs){ const [a, b] = pairs[k], d = Array.isArray(a) ? Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) : Math.abs(a - b);
      t.ok(d < 0.02, 'sjarkny: STAB_AT.' + k + ' er modellens (' + JSON.stringify(a) + ' mot ' + JSON.stringify(b) + ')'); } }
}
