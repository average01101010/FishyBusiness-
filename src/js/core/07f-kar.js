// ===== the fish tubs (docs/planer/fiskekar-dekk.md, Jonas 04.11.2026) =====
// A boat without a hold keeps her catch in white tubs on deck, and the tubs ARE her hold: a full tub is TUB_KG («ett fullt kar er 500 kg,
// for enkelthetsskyld»), the boat has her own number of them (VESSELS.kar.n) and the yard gives one more a step up to the places she
// has (kar.max; a place may be on top of another tub, the model's kit.tubs). The tubs are lifted ashore one by one at the plant, and
// the empty ones come back washed in one lift. The boats with a hold land their catch in the plant's tubs of the same size, from the hold.
const TUB_KG = 500;
// how many tubs an open boat has with the yard's steps (0 for a boat with a hold)
function karN(type, lv){ const K = (VESSELS[type] || {}).kar; return K ? Math.min(K.max, K.n + Math.max(0, lv || 0)) : 0; }
// how many of the yard's hold steps the boat can take (the open boats: one tub a step, up to her places; the rest: HOLDUP)
function karSteps(type){ const K = (VESSELS[type] || {}).kar; return K ? Math.max(0, K.max - K.n) : HOLDUP.length; }
// a fish that goes in the tubs: gutted or iced, not one kept alive (the crabs go in their tank)
const inTub = x => (x.gut || x.iced) && !(SPECIES[x.sp] || {}).live;
// what lies in each of n tubs: they fill in turn, TUB_KG each, the iced fish under the not yet iced (the packer ices as he goes), and
// the last tub takes what is over (a hold that shrank keeps its fish). [{kg, iced, sp:{sp:kg}}], n long.
function tubLoads(hold, n){
  const T = []; for (let i = 0; i < Math.max(0, n); i++) T.push({kg:0, iced:0, sp:{}});
  if (!T.length) return T;
  const fish = (hold || []).filter(inTub).slice().sort((a, b) => (b.iced ? 1 : 0) - (a.iced ? 1 : 0));
  let i = 0;
  for (const x of fish){ let kg = x.kg;
    while (kg > 1e-9){ const t = T[i], room = i === T.length - 1 ? Infinity : TUB_KG - t.kg, k = Math.min(kg, room);
      if (k > 0){ t.kg += k; if (x.iced) t.iced += k; t.sp[x.sp] = (t.sp[x.sp] || 0) + k; kg -= k; }
      if (kg > 1e-9) i++; } }
  return T;
}
// the tubs with fish in them (the lifts at a landing)
const tubsFull = T => T.filter(t => t.kg >= 0.5).length;

// ---- packing a tub: where each fish lies (Jonas: «fisken gradvis fyller karret opp og ser realistisk ut, uten clipping») ----
// The fish lie on their side in layers on the tub's floor, lengthwise (heads both ways) in one layer and crosswise in the next where the
// fish are short enough, side by side with a little overlap as gutted fish lie. Every fish is checked against the tub's inside at the
// height it lies: the walls lean out 2.5 degrees from the floor (in_floor) to the rim (in_top), the corners are rounded (KAR_R), and a
// fish keeps KAR_GAP from the wall; one too long for its place is turned the other way or made a little shorter (at most 12 %; the
// fish model is 1 m long, so the scale is its length). A full tub (TUB_KG) is filled to KAR_TOP under the rim; the ice takes no room
// (Jonas 04.11.2026), it shows on the fish that are iced. The plan is fixed for a tub (its seed and the species in it), and the fish
// show one by one as the kilos come in, from the bottom up.
const KAR_R = 0.08;     // the corners inside, as fisk.py builds them
const KAR_GAP = 0.018;  // from a fish to the wall
const KAR_TOP = 0.05;   // a full tub under its rim
// a fish's length (m) from its weight, as everywhere in 3D (the hanging fish, the deck)
const fishLen = kg => clamp(0.42 * Math.cbrt(Math.max(0.05, kg)), 0.28, 1.2);
// the body on its side, per metre of length: how wide it lies (back to belly, the fins folded) and how thick (the layer's height)
const FISH_LIE = {torsk:[0.26, 0.15], sei:[0.22, 0.13], hyse:[0.26, 0.13], lyr:[0.23, 0.13], lange:[0.15, 0.10], brosme:[0.17, 0.11], uer:[0.36, 0.17], kveite:[0.46, 0.07], blakveite:[0.40, 0.09]};   // (with the fins: tools/fish/fisk.py SPEC h and the dorsal and anal fins)
const fishLie = sp => FISH_LIE[sp] || [0.24, 0.14];
// the inside of a tub at height y over its base (dims: the deck-fish extras' tubs entry): half width (x) and half length (z)
function karIn(dims, y){ const u = clamp((y - dims.floor) / Math.max(0.01, dims.rim - dims.floor), 0, 1);
  return [(dims.in_floor[0] + (dims.in_top[0] - dims.in_floor[0]) * u) / 2, (dims.in_floor[1] + (dims.in_top[1] - dims.in_floor[1]) * u) / 2]; }
// is the point (x, z) inside the rounded rectangle of half sizes hx, hz (corner radius r), with gap g to spare
function inRR(x, z, hx, hz, r, g){ const ax = Math.abs(x), az = Math.abs(z), ex = hx - g, ez = hz - g; if (ax > ex || az > ez) return false;
  const rr = Math.max(0, r - g), cx = ex - rr, cz = ez - rr; if (ax <= cx || az <= cz) return true; return Math.hypot(ax - cx, az - cz) <= rr; }
// the corners of a fish's footprint: centre (x, z), length L along its axis turned yaw from z, width b
function fishCorners(x, z, yaw, L, b){ const c = Math.cos(yaw), s = Math.sin(yaw), out = [];
  for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [0, -0.5], [0, 0.5]]){ const a = v * L, w = u * b; out.push([x + w * c + a * s, z - w * s + a * c]); }
  return out; }
function fishFits(dims, x, y, z, yaw, L, b){ const [hx, hz] = karIn(dims, y); return fishCorners(x, z, yaw, L, b).every(([px, pz]) => inRR(px, pz, hx, hz, KAR_R, KAR_GAP)); }
// the plan of a tub: fish slots bottom up [{sp, x, y, z, yaw, s (the model's scale = length), flip, kg}], laid until the layers reach
// KAR_TOP under the rim; spec: the species' shares {sp:kg} (what the tub holds), seed: the tub's own. Pure: the same in, the same out.
function tubPack(dims, spec, seed){
  const sps = Object.keys(spec || {}).filter(k => spec[k] > 0); if (!sps.length) sps.push('torsk');
  const tot = sps.reduce((a, k) => a + spec[k], 0) || 1, cum = []; let acc = 0; for (const k of sps){ acc += spec[k] / tot; cum.push([k, acc]); }
  let h = (seed || 1) * 2654435761 >>> 0; const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
  const pick = () => { const r = rnd(); return (cum.find(c => r <= c[1] + 1e-9) || cum[cum.length - 1])[0]; };
  const top = dims.rim - KAR_TOP, out = []; let y = dims.floor + 0.012, layer = 0;
  while (y < top && layer < 40){
    const [hx, hz] = karIn(dims, y), across = layer % 2 === 1;   // every other layer crosswise, where the fish are short enough
    const row = []; let sp = pick(), used = 0, thick = 0;
    const lenOf = q => { const S0 = SPECIES[q] || {}, kg = S0.size ? S0.size[0] * (0.75 + rnd() * 0.6) : 2; return [fishLen(kg), kg]; };
    // lay the fish side by side across the layer, the next one where the last one ends (they overlap a fifth, as they settle)
    let [L, kg] = lenOf(sp); const span = across ? hz : hx;
    for (let k = 0; k < 30; k++){
      const [bw, bt] = fishLie(sp), b = bw * L, step = b * 0.8;
      if (used + b > 2 * (span - KAR_GAP) + 1e-9) break;
      const off = -span + KAR_GAP + used + b / 2, flip = (k + layer) % 2 === 1;
      let yaw = (across ? Math.PI / 2 : 0) + (rnd() - 0.5) * 0.16, x = across ? (rnd() - 0.5) * 0.06 : off, z = across ? off : (rnd() - 0.5) * 0.06;
      // too long for its place: a little shorter (never more than 12 %), else the place goes to the next fish
      let s = L, ok = fishFits(dims, x, y, z, yaw, s, b);
      for (let t = 0; !ok && t < 6; t++){ s *= 0.98; ok = fishFits(dims, x, y, z, yaw, s, b * s / L); }
      if (ok && (s < L * 0.88 || y + bt * s > top)) ok = false;
      if (ok){ row.push({sp, x, y:y + bt * s * 0.5, z, yaw, s, flip, kg}); thick = Math.max(thick, bt * s); used += step * s / L; }
      else used += 0.03;
      sp = pick(); [L, kg] = lenOf(sp); }
    if (!row.length){ y += 0.02; layer++; continue; }
    out.push(...row); y += thick * 0.78; layer++;
  }
  return out;
}
// how many of a tub's planned fish show at kg in it (the tub filled to the top at TUB_KG), and the height of the heap
const tubShown = (plan, kg) => Math.min(plan.length, Math.ceil(plan.length * clamp(kg / TUB_KG, 0, 1) - 1e-9));
// a save from before 04.11.2026 may have the yard's bigger hold on an open boat (HOLDUP, +20 % to +70 %): she has no room for more tubs,
// so the steps are paid back at what they cost (her own and the fleet's boats; once, the steps are then gone). Returns the kroner.
function karRefund(){
  let kr = 0; const boats = [S.boat].concat((S.fleet || []).filter(v => v.id !== S.cur).map(v => v.boat).filter(Boolean));
  for (const b of boats){ const V = VESSELS[b.type] || {}; if (!V.kar || !(b.holdLv > 0)) continue; const steps = Math.min(b.holdLv, HOLDUP.length) - karSteps(b.type); if (steps <= 0) continue;
    for (let i = b.holdLv - steps; i < b.holdLv; i++) kr += Math.max(HOLDUP[i].min || 5000, Math.round(V.price * HOLDUP[i].pc / 1000) * 1000);
    b.holdLv = karSteps(b.type); }
  if (kr > 0){ book('verft', kr, 'Tilbake for større lasterom: båten har fiskekar på dekk', 'Back for a bigger hold: the boat has fish tubs on deck');
    log('Båter uten lasterom har nå fiskekar på dekk, 500 kg hvert. Ombyggingen av lasterommet er betalt tilbake: ' + (typeof fmt === 'function' ? fmt(kr, 0) : kr) + ' kr.', 'Boats without a hold now have fish tubs on deck, 500 kg each. The hold rebuild is paid back: ' + (typeof fmt === 'function' ? fmt(kr, 0) : kr) + ' kr.'); }
  return kr;
}
