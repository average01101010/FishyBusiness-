// ===== Kystposten: the coast's paper (07.10.2026) =====
// Jonas: «båtnavn eller rederiene til andre brukere må komme offentlig i avisen. Det må også være varselprikk på appen og varsel i
// spillet. Jeg ønsker at spillere skal kunne trykke på en nyhetssak å lese litt mer», «Uhell burde havne i avisen. Det er realistisk»,
// no other players' lighthouse pictures, a national front page and a local tab.
// A story is made where it happens (pressPut): a kind, where (km), the boat's name (and the company's in the closed group, as on the
// leaderboard) and a few numbers and keys. It is the player's own at once (S.press.own) and goes to the cloud for the others (ui/10h-
// world.js pressSend; supabase/migrations/20261007170000_news.sql), never from a guest and never with anything of haill. The others'
// stories and the biggest landings of the last day come down (PRESS.remote, PRESS.land). The words are written here (pressStory) in
// the same way for one's own and the others': a headline, an ingress and a body to read on, with the place names the reader's game
// knows. Kinds:
//   boat     a boat bought (used, a new build ordered, or with a place in the closed group)   name     a boat named
//   aground  run aground                rescue   towed in by the rescue service              salv     a boat with engine trouble saved
//   foto     a lighthouse picture (the picture only in one's own paper)                         fish     a big fish
//   fs       ten, twenty ... years of sea time      ach   a badge chapter done      as   a company made a limited company (AS)
//   tur      a long trip or the season's move done (turoppdrag, 09g-turer.js)          kvote    a structure quota bought
// The week's top boats come from the shared leaderboard (ui/10h-world.js worldTop), and the day's biggest landing tells its lander in
// the game (and by push when away: supabase/migrations/20261007180000_news_more.sql push_paper).
const PRESS = {R:150, keep:40, remote:[], land:[], at:0, told:{}, toldAt:0};
const PRESS_KINDS = ['boat', 'name', 'aground', 'rescue', 'salv', 'foto', 'fish', 'fs', 'ach', 'as', 'tur', 'kvote'];
function pressState(){ const P = S.press || (S.press = {own:[], seen:0, n:0, q:[]}); P.q = P.q || []; return P; }
const pressCompany = () => (typeof access === 'function' && access() === 'lukket') ? String(S.company || '').slice(0, 40) : '';
// a story of the player's own; loc holds what stays on this device (a picture's id)
function pressPut(kind, d, loc){
  if (typeof PRESS === 'undefined' || !PRESS_KINDS.includes(kind) || !S || !S.boat || !S.boat.pos) return null;
  if (typeof tutOn === 'function' && tutOn()) return null;   // not in «Første tur»
  const P = pressState(), b = S.boat, it = {id:'o' + (++P.n), t:S.t, kind, d:d || {}, x:+b.pos.x.toFixed(3), y:+b.pos.y.toFixed(3),
    boat:String(S.boatName || '').slice(0, 24), company:kind === 'as' ? String(S.company || '').slice(0, 40) : pressCompany(), me:true, ...(loc || {})};
  P.own.push(it); while (P.own.length > PRESS.keep) P.own.shift();
  P.q.push(it.id); while (P.q.length > 20) P.q.shift();
  // the paper never stops what made the story (a grounding, a purchase): its words and its word in the game are tried
  try { if (typeof pressFlush === 'function') pressFlush(); if (typeof pressNotify === 'function') pressNotify(pressStory(it)); } catch (e){ console.warn('press', e); }
  return it;
}
// ---- the words ----
const pressHome = () => { const q = portById(S.home || '') || portById('finnsnes') || PORTS[0]; return q ? q.p : S.boat.pos; };
const pressPort = id => { const q = id && portById(id); return q ? q.name : null; };
const pressFyr = i => typeof FYR !== 'undefined' && FYR && FYR[i] ? FYR[i] : null;
function pressWho(it){ const b = it.boat ? '«' + it.boat + '»' : null;
  if (it.company && b) return [it.company + ' med ' + b, it.company + ' with ' + b];
  if (b) return [b, b];
  return it.company ? [it.company, it.company] : ['En båt', 'A boat']; }
// a story as the paper prints it: {key, t (game minutes), kind, h, ing, body (pairs no/en), img, x, y, me, big}, or null when its
// keys are not ones this game knows
function pressStory(it){
  const where = (it.x != null && it.y != null) ? nearestPlace({x:it.x, y:it.y}) : {no:'langs kysten', en:'along the coast'}, w = pressWho(it), d = it.d || {};
  const s = {key:(it.me ? 'o' : 'r') + it.id, t:it.t != null ? it.t : Math.round((it.gh || 0) * 60), kind:it.kind, x:it.x, y:it.y, me:!!it.me, img:null, body:[], big:false};
  const P2 = (no, en) => [no, en];
  if (it.kind === 'boat'){ const V = VESSELS[d.type]; if (!V) return null; const vn = V.name.no.split(' (')[0], ve = V.name.en.split(' (')[0];
    s.h = d.nb ? P2('Nybygg bestilt: ' + vn.toLowerCase(), 'New build ordered: ' + ve.toLowerCase()) : d.lic ? P2('Kjøper båt med kvote', 'Buys a boat with a quota') : P2('Ny båt til ' + w[0], 'A new boat for ' + w[1]);
    s.ing = d.nb ? P2(w[0] + ' har bestilt en ny ' + vn.toLowerCase() + ' fra verftet. Hun skal være klar om 45 døgn.', w[1] + ' has ordered a new ' + ve.toLowerCase() + ' from the yard. She is due in 45 days.')
      : P2(w[0] + ' har kjøpt en ' + vn.toLowerCase() + (d.lic ? ' med plass i lukket gruppe' : '') + '.', w[1] + ' has bought a ' + ve.toLowerCase() + (d.lic ? ' with a place in the closed group' : '') + '.');
    s.body.push(P2('Båten er ' + fmt(V.len, 1) + ' meter lang, tar ' + fmt(V.holdCap, 0) + ' kg i lasterommet og går ' + fmt(V.vcruise || 0, 0) + ' knop i marsjfart.', 'She is ' + fmt(V.len, 1) + ' metres long, takes ' + fmt(V.holdCap, 0) + ' kg in the hold and cruises at ' + fmt(V.vcruise || 0, 0) + ' knots.'));
    if (d.price > 0) s.body.push(P2('Prisen skal ha ligget rundt ' + kr(Math.round(d.price / 10000) * 10000) + '.', 'The price is said to have been about ' + kr(Math.round(d.price / 10000) * 10000) + '.'));
    s.body.push(P2('Kystposten ønsker lykke til og god fangst.', 'Kystposten wishes good luck and good catches.'));
    s.img = typeof vesselSVG === 'function' ? {svg:d.type} : null; s.big = d.price >= 1e6; }
  else if (it.kind === 'name'){ if (!it.boat) return null;
    s.h = P2('Båtdåp: «' + it.boat + '»', 'Christening: the «' + it.boat + '»');
    s.ing = P2((it.company ? it.company + ' har' : 'En skipper har') + ' døpt båten sin «' + it.boat + '». Navnet er malt på skroget.', (it.company ? it.company + ' has' : 'A skipper has') + ' named the boat the «' + it.boat + '». The name is painted on the hull.');
    s.body.push(P2('Etter gammel skikk skåles det for båten og havet når hun får navn. Mange mener det bringer ulykke å døpe om en båt uten en ordentlig dåp.', 'By old custom, the boat and the sea are toasted when she gets her name. Many hold it is bad luck to rename a boat without a proper christening.')); }
  else if (it.kind === 'aground'){
    s.h = P2(w[0] + ' gikk på grunn', w[1] + ' ran aground'); s.big = true;
    s.ing = P2(w[0] + ' gikk på grunn ' + where.no + '. Skroget ble skadet, men ingen ble skadet om bord.', w[1] + ' ran aground ' + where.en + '. The hull was damaged, but nobody aboard was hurt.');
    s.body.push(P2('Båten må på verftet før hun kan fiske igjen.', 'The boat must go to the yard before she can fish again.'),
      P2('Kystposten minner om å følge med på sjøkartet og ekkoloddet i trange farvann, særlig i mørket.', 'Kystposten reminds skippers to watch the chart and the echo sounder in narrow waters, above all in the dark.')); }
  else if (it.kind === 'rescue'){ const port = pressPort(d.port), base = pressPort(d.base);
    s.h = P2('Redningsskøyta slepte ' + w[0] + ' inn' + (port ? ' til ' + port : ''), 'The rescue boat towed ' + w[1] + ' in' + (port ? ' to ' + port : '')); s.big = true;
    s.ing = P2('Redningsskøyta' + (base ? ' fra ' + base : '') + ' rykket ut og tok ' + w[0] + ' på slep ' + where.no + '.', 'The rescue boat' + (base ? ' from ' + base : '') + ' turned out and took ' + w[1] + ' in tow ' + where.en + '.');
    s.body.push(P2('Båten ble levert trygt ved kai' + (port ? ' i ' + port : '') + '.', 'The boat was brought safely to the quay' + (port ? ' at ' + port : '') + '.'),
      P2('Redningsselskapet minner om å sjekke diesel og værmelding før man går ut.', 'The rescue service reminds skippers to check the diesel and the forecast before going out.')); }
  else if (it.kind === 'salv'){ const tw = typeof TUR_BOATS !== 'undefined' && TUR_BOATS[d.towed] || null, port = pressPort(d.port); if (!tw) return null;
    s.h = P2(w[0] + ' berget «' + tw + '»', w[1] + ' saved the «' + tw + '»'); s.big = true;
    s.ing = P2('«' + tw + '» hadde motorstopp og drev mot land ' + where.no + '. ' + w[0] + ' tok henne på slep' + (port ? ' inn til ' + port : '') + '.', 'The «' + tw + '» had engine trouble and drifted toward land ' + where.en + '. ' + w[1] + ' took her in tow' + (port ? ' to ' + port : '') + '.');
    if (d.pay > 0) s.body.push(P2('Bergelønnen ble ' + kr(d.pay) + ', avtalt med eierens forsikring' + (d.val > 0 ? ' etter båtens verdi på ' + kr(d.val) : '') + '.', 'The salvage reward was ' + kr(d.pay) + ', agreed with the owner\'s insurer' + (d.val > 0 ? ' by the boat\'s value of ' + kr(d.val) : '') + '.'));
    s.body.push(P2('Etter sjøloven har den som berger en båt i fare krav på bergelønn, men bare når bergingen lykkes.', 'Under the Maritime Code, whoever saves a boat in danger is owed a salvage reward, but only when the salvage succeeds.')); }
  else if (it.kind === 'foto'){ const f = pressFyr(d.fyr); if (!f) return null; const nm = /fyr/i.test(f[3]) ? f[3] : f[3] + ' fyr', L = typeof TUR_LYS !== 'undefined' && TUR_LYS[d.lys];
    s.h = P2(nm + (L ? ' ' + L.no : ''), nm + (L ? ' ' + L.en : ''));
    s.ing = P2('Foto: ' + w[0] + '.', 'Photo: ' + w[1] + '.');
    const fw = nearestPlace({x:f[0], y:f[1]});
    s.body.push(P2('Fyret står ' + fw.no + ', og lyset står ' + fmt(f[2], 0) + ' meter over havet.', 'The lighthouse stands ' + fw.en + ', and its light is ' + fmt(f[2], 0) + ' metres over the sea.'),
      P2('Kystposten tar gjerne imot flere bilder fra fyrene langs kysten.', 'Kystposten is glad of more pictures from the lighthouses along the coast.'));
    if (it.me && it.img != null) s.img = {foto:it.img}; }
  else if (it.kind === 'fish'){ const sp = SPECIES[d.sp]; if (!sp || !(d.kg > 0)) return null;
    s.h = P2('Storfisk: ' + sp.no.toLowerCase() + ' på ' + fmt(d.kg, 0) + ' kg', 'Big fish: a ' + sp.en.toLowerCase() + ' of ' + fmt(d.kg, 0) + ' kg'); s.big = true;
    s.ing = P2(w[0] + ' fikk en ' + sp.no.toLowerCase() + ' på ' + fmt(d.kg, 0) + ' kg på juksa ' + where.no + '.', w[1] + ' landed a ' + sp.en.toLowerCase() + ' of ' + fmt(d.kg, 0) + ' kg on the jig ' + where.en + '.');
    s.body.push(P2('Det er ikke hver dag en slik fisk kommer over ripa. Den ble veid på kaia.', 'It is not every day a fish like that comes over the rail. It was weighed on the quay.'), P2('Kystposten gratulerer.', 'Congratulations from Kystposten.')); }
  else if (it.kind === 'fs'){ if (!(d.y > 0)) return null;
    s.h = P2(fmt(d.y, 0) + ' år på havet', fmt(d.y, 0) + ' years at sea');
    s.ing = P2('Kystposten gratulerer ' + w[0] + ' med ' + fmt(d.y, 0) + ' år fartstid.', 'Kystposten congratulates ' + w[1] + ' on ' + fmt(d.y, 0) + ' years of sea time.');
    s.body.push(P2('Fartstid er tida en sjømann har vært om bord. Det er ikke mange forunt å nå ' + fmt(d.y, 0) + ' år.', 'Sea time is the time a seaman has spent aboard. Not many reach ' + fmt(d.y, 0) + ' years.')); }
  else if (it.kind === 'ach'){ const ch = typeof ACH_CH !== 'undefined' && ACH_CH[d.ch]; if (!ch) return null;
    s.h = P2(w[0] + ' fullførte «' + ch[0] + '»', w[1] + ' completed «' + ch[1] + '»');
    s.ing = P2(w[0] + ' har fullført kapittelet «' + ch[0] + '» og fører den norske vimpelen.', w[1] + ' has completed the chapter «' + ch[1] + '» and flies the Norwegian pennant.');
    s.body.push(P2('Vimpelen blir lengre for hvert kapittel. Se etter den i masta.', 'The pennant grows longer with each chapter. Look for it at the mast.')); }
  else if (it.kind === 'as'){ if (!it.company) return null;
    s.h = P2('Nytt aksjeselskap: ' + it.company, 'New limited company: ' + it.company);
    s.ing = P2(it.company + ' er registrert som aksjeselskap' + (it.boat ? ' og driver «' + it.boat + '»' : '') + '.', it.company + ' is registered as a limited company' + (it.boat ? ' and runs the «' + it.boat + '»' : '') + '.');
    s.body.push(P2('Rederiet har skilt driften fra skipperens egen økonomi.', 'The company has parted the business from the skipper\'s own money.')); }
  else if (it.kind === 'tur'){ const port = pressPort(d.to), sp = SPECIES[d.sp];
    if (d.k === 'sesong'){ if (!port || !sp || !(d.kg > 0)) return null;
      s.h = P2('Sesongfiske: ' + w[0] + ' leverte ' + fmt(d.kg, 0) + ' kg i ' + port, 'Following the season: ' + w[1] + ' landed ' + fmt(d.kg, 0) + ' kg at ' + port);
      s.ing = P2(w[0] + ' fulgte ' + sp.no.toLowerCase() + 'en og leverte ' + fmt(d.kg, 0) + ' kg ved mottakene rundt ' + port + '.', w[1] + ' followed the ' + sp.en.toLowerCase() + ' and landed ' + fmt(d.kg, 0) + ' kg at the plants round ' + port + '.');
      s.body.push(P2('Mange følger fisken langs kysten gjennom året, slik fiskere alltid har gjort.', 'Many follow the fish along the coast through the year, as fishers always have.')); s.big = true; }
    else if (d.k === 'best'){ if (!port || !sp) return null;
      s.h = P2(w[0] + ' kom med ' + sp.no.toLowerCase() + ' til ' + port, w[1] + ' brought ' + sp.en.toLowerCase() + ' to ' + port);
      s.ing = P2('Mottaket i ' + port + ' hadde bestilt ' + fmt(d.kg || 0, 0) + ' kg ' + sp.no.toLowerCase() + ', og ' + w[0] + ' leverte' + (d.nm > 0 ? ' etter ' + fmt(d.nm, 0) + ' nautiske mil' : '') + '.', 'The plant at ' + port + ' had ordered ' + fmt(d.kg || 0, 0) + ' kg of ' + sp.en.toLowerCase() + ', and ' + w[1] + ' delivered' + (d.nm > 0 ? ' after ' + fmt(d.nm, 0) + ' nautical miles' : '') + '.'); }
    else if (d.k === 'frakt'){ if (!port) return null;
      s.h = P2(w[0] + ' fraktet varer til ' + port, w[1] + ' carried goods to ' + port);
      s.ing = P2(w[0] + ' kom til ' + port + ' med ' + fmt(d.kg || 0, 0) + ' kg last' + (pressPort(d.from) ? ' fra ' + pressPort(d.from) : '') + '.', w[1] + ' came to ' + port + ' with ' + fmt(d.kg || 0, 0) + ' kg of freight' + (pressPort(d.from) ? ' from ' + pressPort(d.from) : '') + '.'); }
    else return null;
    s.body.push(P2('Turen var på rundt ' + fmt(d.nm || 0, 0) + ' nautiske mil.', 'The trip was about ' + fmt(d.nm || 0, 0) + ' nautical miles.')); }
  else if (it.kind === 'kvote'){ if (!(d.kf > 0)) return null;
    s.h = P2(w[0] + ' kjøper strukturkvote', w[1] + ' buys a structure quota');
    s.ing = P2(w[0] + ' har kjøpt strukturkvote og får kvotefaktor ' + fmt(d.kf / 10000, 2) + ' mer i 20 år.', w[1] + ' has bought a structure quota and gets ' + fmt(d.kf / 10000, 2) + ' more in quota factor for 20 years.');
    s.body.push(P2('Strukturkvote betyr at en annen båt tas ut av fisket, og kvoten følger med til kjøperen, med et trekk.', 'A structure quota means another boat leaves the fishery, and its quota goes to the buyer, less a cut.')); s.big = true; }
  else return null;
  return s;
}
// the week's top boats in the open and the closed group, from the shared leaderboard (ui/10h-world.js worldTop: it fetches as asked)
function pressTop(){
  const out = [], wk = typeof weekOf === 'function' ? weekOf(S.t / 60) - 1 : -1; if (wk < 0 || typeof worldTop !== 'function') return out;
  for (const g of ['open', 'lukket']){ const e = worldTop(wk, g), rows = e && e.data && e.data.rows || []; if (!rows.length) continue;
    const a = rows[0], w = pressWho(a), q = pressPort(a.port), gn = g === 'lukket' ? ['lukket', 'closed'] : ['åpen', 'open'];
    out.push({key:'w' + wk + g, t:Math.min(S.t, (wk + 1) * 168 * 60), kind:'top', x:null, y:null, me:!!a.me, big:true, img:null,
      h:['Ukas toppfisker i ' + gn[0] + ' gruppe: ' + w[0], 'Top boat of the week in the ' + gn[1] + ' group: ' + w[1]],
      ing:[w[0] + ' landet ' + fmt(a.kg, 0) + ' kg forrige uke' + (q ? ', mest til ' + q : '') + '.', w[1] + ' landed ' + fmt(a.kg, 0) + ' kg last week' + (q ? ', mostly at ' + q : '') + '.'],
      body:[rows.length > 1 ? ['Bak fulgte ' + rows.slice(1, 3).map(r => pressWho(r)[0] + ' med ' + fmt(r.kg, 0) + ' kg').join(' og ') + '.', 'Behind came ' + rows.slice(1, 3).map(r => pressWho(r)[1] + ' with ' + fmt(r.kg, 0) + ' kg').join(' and ') + '.'] : null,
        ['Hele topplista for kysten står i Salgslaget.', 'The whole leaderboard for the coast is in the Sales app.']].filter(Boolean)}); }
  return out;
}
// the biggest landings of the last day: along the whole coast, and near home
function pressLand(local){
  const home = pressHome(), out = [], L = PRESS.land.filter(l => portById(l.port) && (!local || dist(portById(l.port).p, home) <= PRESS.R));
  if (!L.length) return out;
  const a = L[0], q = portById(a.port), sp = SPECIES[a.sp], w = pressWho(a), rest = L.slice(1, 4);
  out.push({key:'l' + (local ? 'L' : 'N') + a.gh + a.port, t:Math.round(a.gh * 60), kind:'land', x:q.p.x, y:q.p.y, me:!!a.me, big:!local, img:null,
    h:[(local ? 'Største landing i distriktet: ' : 'Dagens største landing: ') + fmt(a.kg, 0) + ' kg', (local ? 'Biggest landing in the district: ' : 'The day\'s biggest landing: ') + fmt(a.kg, 0) + ' kg'],
    ing:[w[0] + ' leverte ' + fmt(a.kg, 0) + ' kg' + (sp ? ', mest ' + sp.no.toLowerCase() + ',' : '') + ' til ' + q.name + '.', w[1] + ' landed ' + fmt(a.kg, 0) + ' kg' + (sp ? ', mostly ' + sp.en.toLowerCase() + ',' : '') + ' at ' + q.name + '.'],
    body:rest.length ? [['Også store landinger det siste døgnet: ' + rest.map(l => pressWho(l)[0] + ' med ' + fmt(l.kg, 0) + ' kg til ' + portById(l.port).name).join(', ') + '.', 'Other big landings in the last day: ' + rest.map(l => pressWho(l)[1] + ' with ' + fmt(l.kg, 0) + ' kg at ' + portById(l.port).name).join(', ') + '.']] : []});
  return out;
}
// the paper: the front page (the whole coast) or the local tab (within 150 km of home), newest first; the player's own stories with the
// others', the landings, and the day's news of 06-services.js newsForDay (the quota and regulation news on the front page, the rest local)
function pressList(local){
  const P = pressState(), home = pressHome(), near = s => s.x != null && dist({x:s.x, y:s.y}, home) <= PRESS.R, out = [];
  const seen = new Set();
  for (const it of P.own){ const s = pressStory(it); if (s && (!local || near(s))){ out.push(s); seen.add(it.kind + '|' + Math.round(it.t / 6)); } }
  for (const it of PRESS.remote){ if (it.me && seen.has(it.kind + '|' + Math.round(it.gh * 10))) continue; const s = pressStory(it); if (s && (!local || near(s))) out.push(s); }
  for (const s of pressLand(local)) out.push(s);
  const top = local ? [] : pressTop(); for (const s of top) out.push(s);
  const day = Math.floor(S.t / 1440);
  for (let dd = day; dd >= Math.max(0, day - 6); dd--) newsForDay(dd).forEach((a, i) => { if (top.length && /^Ukas toppfisker/.test(a.h.no)) return;   // the shared leaderboard's, not the local fleet's
    if (!!a.nat === !local || (!local && dd === day && !a.nat && i < 2))
    out.push({key:'g' + dd + '_' + i + (local ? 'L' : 'N'), t:Math.min(dd * 1440 + 6 * 60, S.t), kind:'gen', me:false, big:false, img:a.img != null ? {foto:a.img} : null, h:[a.h.no, a.h.en], ing:[a.b.no, a.b.en], body:[]}); });
  return out.sort((a, b) => Math.floor(b.t / 1440) - Math.floor(a.t / 1440) || (b.kind !== 'gen') - (a.kind !== 'gen') || b.t - a.t);
}
// unread: stories newer than when the paper was last opened (the day's general news counts once a day)
function pressUnread(){ const P = pressState(); return pressList(false).concat(pressList(true)).filter((s, i, a) => s.kind !== 'gen' && s.t > P.seen && a.findIndex(x => x.key === s.key) === i).length; }
function pressSeen(){ pressState().seen = S.t; }
