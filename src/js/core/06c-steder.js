// ===== the tackle shops and the yards along the coast: the other two places of trade (07.10.2026) =====
// Jonas 07.10.2026: «Utstyrsbutikken, fiskemottaket og verftet blir egne steder med egen kai», each with its own quay, and the shop and
// the yard «spres utover hele landet på strategiske områder», real where there is data and made up where the plants are far from one
// (docs/handelssteder.md). The places are src/data/steder.json (tools/steder/steder.py): [x, y, the normal's angle, length, depth, kind
// (0 shop, 1 yard), postal town] on a quay face of the vector packs, set down as the coast's plants are (06b-coastports.js): a quay in
// COASTQ, a harbour unit in UNITS (the looks 's' shop and 'y' yard, harbour-unit-s/y; the plant's look until they are drawn) and a harbour
// in PORTS. They carry no firm's name: a place is its town. What each place offers is portServices below.
const STEDER_D = /*@include(data/steder.json)*/null;
(() => {
  if (!STEDER_D || !STEDER_D.r) return;
  const used = {};
  for (const r of STEDER_D.r){
    const [x, y, a, len, depth, kind, town] = r, k = kind ? 'verft' : 'utstyrsbutikk';
    const id = (kind ? 'sv' : 'sb') + Math.round(x * 1000) + '_' + Math.round(y * 1000);
    let name = (town || (kind ? 'Verft' : 'Butikk')) + ' ' + k;
    // a second one of the same kind in one town: by the side of the first it lies on (the grid's x east, y south)
    if (used[name]){ const f = used[name], dx = x - f[0], dy = y - f[1]; name += Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? ' øst' : ' vest') : (dy > 0 ? ' sør' : ' nord'); for (let n = 2; used[name]; n++) name = name.replace(/ \d+$/, '') + ' ' + n; }
    used[name] = [x, y];
    const nx = Math.cos(a), nz = Math.sin(a), cx = x * 1000, cz = y * 1000, hl = Math.max(8, len / 2), ux = -nz, uz = nx;
    COASTQ[id] = {main:{a:[cx - ux * hl, cz - uz * hl], b:[cx + ux * hl, cz + uz * hl], n:[nx, nz]}};
    const U = {id, o:[cx, cz], u:[nz, -nx], n:[nx, nz], f:[27.4, -24.4, 27.4, -28.4, -27.4, -28.4, -27.4, -24.4], v:kind ? 'y' : 's', coastal:true, sted:true};
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
  const s = pt.sted || '', v = {mottak:!!pt.mottak, butikk:/butikk/.test(s), verft:/verft/.test(s)};
  v.bunker = !!pt.fuel && (v.mottak || v.verft);
  return v;
}
// the places of a kind nearest p (km), nearest first: [{pt, d}]; kind is 'mottak', 'butikk' or 'verft'
function placesNear(p, kind, n = 3){
  const out = []; for (const pt of PORTS){ if (!portServices(pt)[kind]) continue; out.push({pt, d:dist(pt.p, p)}); }
  return out.sort((a, b) => a.d - b.d).slice(0, n);
}
