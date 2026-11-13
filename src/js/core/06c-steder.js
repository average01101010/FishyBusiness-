// ===== the tackle shops and the yards along the coast: the other two places of trade (07.10.2026) =====
// Jonas 07.10.2026: «Utstyrsbutikken, fiskemottaket og verftet blir egne steder med egen kai», each with its own quay, and the shop and
// the yard «spres utover hele landet på strategiske områder», real where there is data and made up where the plants are far from one
// (docs/handelssteder.md). The places are src/data/steder.json (tools/steder/steder.py): [x, y, the normal's angle, length, depth, kind
// (0 shop, 1 yard), postal town] on a quay face of the vector packs, set down as the coast's plants are (06b-coastports.js): a quay in
// COASTQ, a harbour unit in UNITS (the looks 's' shop and 'y' yard, harbour-unit-s/y; the plant's look until they are drawn) and a harbour
// in PORTS. They carry no firm's name: a place is its town. What each place offers is portServices below.
// (STEDER_D, the places' data, is read in 06b-coastports.js, so the ocean fleet's plants can keep their distance to them)
(() => {
  if (!STEDER_D || !STEDER_D.r) return;
  const used = {}, nearTown = (x, y) => { let best = null, bd = Infinity; for (const q of PORTS) if (q.mottak && !q.sted && q.xy){ const d = Math.hypot(q.xy[0] - x, q.xy[1] - y); if (d < bd){ bd = d; best = q; } } return best ? best.name : ''; };
  for (const r of STEDER_D.r){
    const [x, y, a, len, depth, kind, town] = r, k = kind ? 'verft' : 'utstyrsbutikk';
    // (a place moved to another face keeps the id it had, which saves hold as the boat's port, home and waypoints: steder.json's «was»,
    // tools/steder/lukkflytt.py, 13.11.2026)
    const key = (kind ? 'sv' : 'sb') + Math.round(x * 1000) + '_' + Math.round(y * 1000), id = (STEDER_D.was && STEDER_D.was[key]) || key;
    // a place with no postal town in Kartverket's register (one yard on the Varanger peninsula, 12.11.2026: «Verft verft», against
    // «navn etter stedet»): the town of the nearest plant, whose names come from the same register (06b-coastports.js, before this)
    let name = (town || nearTown(x, y) || (kind ? 'Verft' : 'Butikk')) + ' ' + k;
    // a second one of the same kind in one town: by the side of the first it lies on (the grid's x east, y south)
    if (used[name]){ const f = used[name], dx = x - f[0], dy = y - f[1]; name += Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? ' øst' : ' vest') : (dy > 0 ? ' sør' : ' nord'); for (let n = 2; used[name]; n++) name = name.replace(/ \d+$/, '') + ' ' + n; }
    used[name] = [x, y];
    const nx = Math.cos(a), nz = Math.sin(a), cx = x * 1000, cz = y * 1000, hl = Math.max(8, len / 2), ux = -nz, uz = nx;
    COASTQ[id] = {main:{a:[cx - ux * hl, cz - uz * hl], b:[cx + ux * hl, cz + uz * hl], n:[nx, nz]}};
    // a yard's unit is the big one (UNIT_Y, 01-world.js): the biggest vessels lie on its lift
    const g = kind ? UNIT_Y : UNIT, U = {id, o:[cx, cz], u:[nz, -nx], n:[nx, nz], f:[g.E, -g.B, g.E, -g.B - 4, -g.E, -g.B - 4, -g.E, -g.B], v:kind ? 'y' : 's', coastal:true, sted:true};
    if (kind) U.y = true;
    UNITS[id] = U; UNITA.push(U);
    PORTS.push({id, name, xy:[x, y], shore:[x, y], pier:true, fuel:!!kind, ice:false, mottak:false, pf:1, coast:{x:(cx - nx * 30) / 1000, y:(cz - nz * 30) / 1000},
      p:{x:Math.round(cx + nx * 15) / 1000, y:Math.round(cz + nz * 15) / 1000}, i:PORTS.length, coastal:true, sted:kind ? 'verft' : 'butikk'});
  }
})();
// What a place offers, as {mottak, butikk, verft, bunker}: the plant takes the catch and sells ice, bait and fuel; the tackle shop sells
// gear and electronics; the yard sells and mends boats and sells fuel; Finnsnes has the shop and the boat hall in one. Father's naust
// (berth 'naust') and the rorbuer sell nothing, they are homes (Jonas 07.10.2026).
function portServices(pt, berth){
  if (!pt || pt.rorbu || berth === 'naust') return {};
  // (an ocean fleet's plant is a plant only for an ocean vessel: havOnly, 06b-coastports.js, havsteget H0)
  const s = pt.sted || '', v = {mottak:!!pt.mottak || (!!pt.havOnly && (VESSELS[S && S.boat && S.boat.type] || {}).cls === 'hav'), butikk:/butikk/.test(s), verft:/verft/.test(s)};
  v.bunker = !!pt.fuel && (v.mottak || v.verft);
  return v;
}
// the places of a kind nearest p (km), nearest first: [{pt, d}]; kind is 'mottak', 'butikk' or 'verft'
function placesNear(p, kind, n = 3){
  const out = []; for (const pt of PORTS){ if (!portServices(pt)[kind]) continue; out.push({pt, d:dist(pt.p, p)}); }
  return out.sort((a, b) => a.d - b.d).slice(0, n);
}
