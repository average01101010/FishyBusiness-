// The boat in the sea with a load: trim, list and the crew's weight (OB15, 09.11.2026; docs/planer/om-bord.md kap. 5, S1–S3;
// core/03c-stability.js STAB_AT, stabLoad, stabOf, hullRest). The load has its place aboard, read off the models' anchors: the hold or
// the boxes on the floor, the nets, the line tubs and the pots on deck, the tubs waiting at the table, the hauler, and the people at their
// stations (90 kg each). Checked: nothing aboard in still water lies level and upright; a full hold aft trims her by the stern and one
// forward by the head; the nets on the stern press the stern down; the line in the hauler heels her towards it; a person at the rail of
// a small boat heels her a little; and the 3D hull (hullRest, hullStep) lies at the trim the core reckons.
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
}
