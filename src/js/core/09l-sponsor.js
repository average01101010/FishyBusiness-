// ===== Sponsorer (M6 in docs/planer/butikker-og-sponsorer.md 4 and 5; CLAUDE.md: a real name, logo or product only with a written
// agreement, only from the database, and marked as a partnership) =====
// The list of what is active now comes from the cloud (sp_now(), ui/10r-sponsor.js) at start and every hour; without the cloud (the
// artifact, the tests) there are none, except the made-up test sponsor «Nordlys Utstyr» when the address asks for it (#sptest), so the
// formats can be seen and tested. A placement: {id, kind, target, data, sponsor:{id, name, logo, site}}; kind 'item' with target an EQUIP
// key and data {model, line}. Nothing here changes a number in the game: a sponsored item is the same EQUIP item with a name on it (V5).
const SPN = {list:[], at:0};
const SP_KINDS = ['item', 'sign', 'event', 'press', 'look', 'broker', 'gift', 'link'];
function spSet(rows){
  SPN.list = (Array.isArray(rows) ? rows : []).filter(r => r && SP_KINDS.includes(r.kind) && typeof r.target === 'string' && r.sponsor && typeof r.sponsor.name === 'string' && r.sponsor.name.trim())
    .map(r => ({id:r.id, kind:r.kind, target:r.target, data:r.data && typeof r.data === 'object' ? r.data : {},
      sponsor:{id:r.sponsor.id, name:String(r.sponsor.name).slice(0, 60), logo:/^https:\/\//.test(r.sponsor.logo || '') ? r.sponsor.logo : null, site:/^https:\/\//.test(r.sponsor.site || '') ? r.sponsor.site : null}}));
  SPN.at = Date.now(); return SPN.list.length;
}
// the placement of a kind on a target, or null
function spOf(kind, target){ return SPN.list.find(r => r.kind === kind && r.target === target) || null; }
// the sponsors with something active, once each, with what they are on
function spSponsors(){ const M = new Map(); for (const r of SPN.list){ const m = M.get(r.sponsor.name) || {name:r.sponsor.name, site:r.sponsor.site, on:[]}; m.on.push(r); M.set(r.sponsor.name, m); } return [...M.values()]; }
// a link out to a sponsor's own page: marked where it came from, never anything about the player
function spUrl(site){ if (!/^https:\/\//.test(site || '')) return null; try { const u = new URL(site); u.searchParams.set('fra', 'detstorebla'); return u.toString(); } catch (e){ return null; } }
// ---- a partner's paint design (M8 F5, steg 44 11.11.2026): a placement 'look' on 'paint' is a whole paint for the boat, free, marked
// «Samarbeid» and looks only (Malerverkstedet, ui/10j-paint.js). data: {name, name_en, hull, house, deck, ripe, totone, vann, stripe: a
// colour of the paint shop's own palette (vessel3d.js HULLPAL, so nothing else can be painted on a boat), lakk:1, and the mark on the
// hull midships: the sponsor's logo (logo_url), else a made one {sym, txt, c1, c2}}. The boat wears it as b.liv.sp = the placement's id,
// over her own paint: when the agreement ends the placement is gone from the list, and she is in her own paint again. The others see
// it from 'x:<id>' in her paint code (vessel3d.js livStr), read against the same list, so only a design that is active can be shown. ----
// the paint a design gives, in b.liv's own form; with the type, only what her model can wear (the zones and the designs, as the paint
// shop's own choices: vessel3d.js glbZones, designFits). (Without vessel3d.js, in the core's unit tests, the palette is not known.)
function spPaintLiv(r, type){
  const D = (r && r.data) || {}, L = {d:{}}, fit = k => !type || typeof designFits !== 'function' || designFits(type, k), zone = z => !type || typeof glbZones !== 'function' || !!glbZones(type)[z];
  const ok = k => typeof k === 'string' && (typeof HULLPAL === 'undefined' ? /^[a-z]{2,12}$/.test(k) : HULLPAL.some(x => x[0] === k && x[3] && x[4] !== 'ach'));
  if (ok(D.hull)) L.hull = D.hull; if (ok(D.house) && zone(3)) L.house = D.house; if (ok(D.deck) && zone(4)) L.deck = D.deck;
  for (const k of ['ripe', 'totone', 'vann', 'stripe']) if (ok(D[k]) && fit(k)) L.d[k] = D[k];
  if (D.lakk && fit('lakk')) L.d.lakk = 1;
  return L;
}
// a design must paint something (a colour of the palette) to be one: data with none is not offered and not worn
const spPaintAny = r => { const L = spPaintLiv(r); return !!(L.hull || L.house || L.deck || Object.keys(L.d).length); };
const spPaints = () => SPN.list.filter(r => r.kind === 'look' && r.target === 'paint' && spPaintAny(r));
const spPaintOf = id => (id == null || id === '' || isNaN(+id) ? null : spPaints().find(r => r.id === +id)) || null;
// the design a paint wears (b.liv, or the one tried in the paint shop), while its agreement is active; else null
const spWorn = L => L && L.sp != null ? spPaintOf(L.sp) : null;
// the design in another player's paint code
const spPaintIn = s => { const m = /(?:^|;)x:(-?\d{1,12})(?:;|$)/.exec(String(s || '')); return m ? spPaintOf(m[1]) : null; };
// its mark on the hull: the sponsor's picture {kind:'u', url}, else the made one, else none
function spPaintLogo(r){
  if (!r) return null; if (r.sponsor.logo) return {kind:'u', url:r.sponsor.logo};
  const D = r.data || {}; return typeof D.sym === 'string' && D.sym ? {kind:'g', sym:D.sym, txt:String(D.txt || '').slice(0, 3), c1:D.c1, c2:D.c2} : null;
}
// the made-up sponsor for the tests and the demo build (never in the game's own data: only with #sptest in the address)
const SP_TEST = [
  {id:-1, kind:'item', target:'garnhaler', data:{model:'Nordlys GH-200', line:'Garnhaler med hydraulisk drift'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-2, kind:'item', target:'jukse', data:{model:'Nordlys J-3'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-4, kind:'press', target:'kystposten', data:{h:'Nordlys Utstyr: haler og redskap til kystflåten', text:'Garnhalere, linehalere og juksamaskiner, levert og montert langs hele kysten. Se utvalget hos oss.'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-5, kind:'look', target:'top', data:{name:'Nordlys arbeidsjakke', tp:'oilskin', tk:2}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-6, kind:'event', target:'lofot', data:{prize:'en garnhaler til vinneren'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-7, kind:'gift', target:'welcome', data:{item:'olje', text:'En oljehyre til deg som er ny på kysten.'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-8, kind:'broker', target:'b1', data:{type:'sjark', year:1996, price:1290000, port:'finnsnes', name:'Nordlys I', hours:8400, line:'Godt vedlikeholdt sjark, ny motor 2019.', featured:true, url:'https://example.org/nordlys/sjark'}, sponsor:{id:-2, name:'Nordlys Båtmegling', logo:null, site:'https://example.org/megling'}},
  {id:-9, kind:'look', target:'paint', data:{name:'Nordlys-drakten', name_en:'The Nordlys livery', hull:'petrol', house:'hvit', ripe:'gul', vann:'hvit', sym:'stjerne', txt:'NU', c1:'petrol', c2:'gul'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-3, kind:'sign', target:'all', data:{flag:true}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}}];
