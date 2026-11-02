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
// the made-up sponsor for the tests and the demo build (never in the game's own data: only with #sptest in the address)
const SP_TEST = [
  {id:-1, kind:'item', target:'garnhaler', data:{model:'Nordlys GH-200', line:'Garnhaler med hydraulisk drift'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}},
  {id:-2, kind:'item', target:'jukse', data:{model:'Nordlys J-3'}, sponsor:{id:-1, name:'Nordlys Utstyr', logo:null, site:'https://example.org/nordlys'}}];
