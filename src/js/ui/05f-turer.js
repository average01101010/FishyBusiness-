// ---------- Turoppdrag in the Oppdrag app (core/09g-turer.js): the board made from where the boat is, and the missions taken ----------
// Each card says what it is, how far, about how long it takes to sail in real time, what it pays and by when. «Kjør dit» finds the way
// as Autonav does and sets off (from the quay too); the chart rings the places the missions go to.
const turEsc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const TUR_CLS = {kort:['Kort', 'Short'], mid:['Middels', 'Medium'], lang:['Lang', 'Long'], sesong:['Sesong', 'Season']};
const TUR_KIND = {best:['Bestilling', 'Order'], frakt:['Frakt', 'Freight'], garn:['Hjelp på sjøen', 'Help at sea'], sesong:['Sesongflytting', 'Following the season']};
function turCard(m, act){
  const L0 = (no, en) => S.lang === 'en' ? en : no, w = turWhat(m), kv0 = (k, v) => '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>';
  let extra = '';
  if (m.k === 'best' && act){ const o = ordState().active.find(x => x.tur === m.id); if (o) extra = kv0(L0('Levert', 'Delivered'), fmt(o.kg - o.left, 0) + ' / ' + fmt(o.kg, 0) + ' kg'); }
  if (m.k === 'best') extra += kv0(L0('Kvalitet', 'Quality'), QN[m.q][S.lang === 'en' ? 'en' : 'no']);
  if (m.k === 'sesong') extra = kv0(L0('Levert der', 'Landed there'), fmt(m.got || 0, 0) + ' / ' + fmt(m.kg, 0) + ' kg') + kv0(L0('Mottak innen', 'Plants within'), TUR.sesongR + ' km');
  if (m.k === 'frakt') extra = kv0(L0('Hentes i', 'Picked up at'), portById(m.from).name + (act ? ' · ' + (m.stage === 'go' ? L0('om bord', 'aboard') : L0('venter på kaia', 'waits on the quay')) : ''));
  if (m.k === 'garn') extra = kv0(L0('Sist sett', 'Last seen'), coordStr(m.p)) + kv0(L0('Om bord', 'Aboard'), m.kind === 'garn' ? L0('to til å trekke garn', 'two to haul nets') : L0('én kan trekke lina', 'one can haul the line'));
  const desc = {best:['Mottaket betaler ' + kr(m.pay) + ' i bonus for turen, i tillegg til fisken.', 'The plant pays a bonus of ' + kr(m.pay) + ' for the trip, on top of the fish.'],
    frakt:['Lasta tar plass i lasterommet til den er levert.', 'The freight takes room in the hold until it is delivered.'],
    garn:['Fisken i redskapet er din. Eieren betaler finnerlønn når det er trukket.', 'The fish in the gear is yours. The owner pays a finder\'s fee when it is hauled.'],
    sesong:['Fisken står der nå. Lever ved mottakene der innen fristen.', 'The fish is there now. Land at the plants there before the deadline.']}[m.k];
  return '<div class="ph-card tur ' + m.cls + '"><div class="tur-h"><span class="tur-c">' + L0(TUR_CLS[m.cls][0], TUR_CLS[m.cls][1]) + '</span><small>' + L0(TUR_KIND[m.k][0], TUR_KIND[m.k][1]) + '</small></div>' +
    '<h4>' + turEsc(L0(w[0], w[1])) + '</h4><p class="ph-note">' + L0(desc[0], desc[1]) + '</p>' +
    kv0(L0('Avstand', 'Distance'), fmt(m.nm, 0) + ' nm') + kv0(L0('Seiling', 'Sailing'), L0('ca. ', 'about ') + turDur(m.h)) + extra +
    kv0(L0('Belønning', 'Reward'), kr(m.pay)) + (act ? kv0(L0('Frist', 'Deadline'), dayStr(m.due / 60) + ' ' + hm(m.due / 60) + ' · ' + inReal(m.due - S.t)) : kv0(L0('Tid til rådighet', 'Time allowed'), L0('ca. ', 'about ') + turDur(m.hTot))) +
    '<div class="tur-b">' + (act ? '<button class="ph-btn p" data-pa="turgo" data-id="' + m.id + '">' + L0('Kjør dit', 'Go there') + '</button><button class="ph-btn" data-pa="turdrop" data-id="' + m.id + '">' + L0('Gi fra deg', 'Give up') + '</button>'
      : '<button class="ph-btn p" data-pa="turtake" data-id="' + m.id + '">' + L0('Ta oppdraget', 'Take the mission') + '</button>') + '</div></div>';
}
function turPage(){
  const T = turEnsure(), L0 = (no, en) => S.lang === 'en' ? en : no, h = [];
  if (T.act.length){ h.push('<h4 class="tur-sec">' + L0('Dine oppdrag', 'Your missions') + '</h4>'); for (const m of T.act) h.push(turCard(m, true)); }
  h.push('<h4 class="tur-sec">' + L0('Tavla', 'The board') + '</h4><p class="ph-note tur-n">' + L0('Laget fra der båten er nå. Ny tavle hver morgen, og når du har flyttet deg et stykke.', 'Made from where the boat is now. A new board every morning, and when you have moved a good way.') + '</p>');
  if (!T.board.length) h.push('<div class="ph-card"><p class="ph-note">' + L0('Ingen oppdrag passer båten akkurat nå. Se innom igjen senere.', 'No mission suits the boat just now. Look in again later.') + '</p></div>');
  for (const m of T.board) h.push(turCard(m, false));
  const old = T.done.slice(0, 6);
  if (old.length) h.push('<h4 class="tur-sec">' + L0('Tidligere', 'Earlier') + '</h4><div class="ph-card">' + old.map(d => '<div class="kv"><span>' + turEsc(L0(d.what[0], d.what[1])) + '</span><b>' + (d.ok ? kr(d.pay) : '<span class="r2">' + L0('ikke fullført', 'not done') + '</span>') + '</b></div>').join('') + '</div>');
  return h.join('');
}
// «Kjør dit»: the way there as Autonav finds it (to the pick-up first for freight), and off she goes, from the quay too
async function turGo(id){
  const T = turState(), m = T.act.find(x => x.id === id), b = S.boat; if (!m) return;
  const L0 = (no, en) => S.lang === 'en' ? en : no;
  if (!['idle', 'port'].includes(b.status) || (S.plan && S.plan.depAt)){ toast(L0('Båten er opptatt. Stopp det den holder på med først.', 'The boat is busy. Stop what it is doing first.')); return; }
  if (!meAboard() && !crewAboard().length){ toast(L0('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; }
  const toPort = m.k === 'frakt' && m.stage === 'pick' ? m.from : m.k === 'garn' ? null : m.to, q = toPort ? portById(toPort) : null;
  const end = q ? q.p : {x:m.p.x + 0.12, y:m.p.y}, aPort = b.status === 'port' ? b.port : null;
  if (q && aPort === toPort){ toast(L0('Du er allerede der.', 'You are there already.')); return; }
  toast(L0('Finner veien …', 'Finding the way …'));
  let res; try { res = await leiaRoute({x:b.pos.x, y:b.pos.y}, end, aPort, toPort); } catch (e){ console.error(e); res = {why:['Fant ingen vei dit.', 'Found no way there.']}; }
  if (res.why){ toast(L0(res.why[0], res.why[1])); return; }
  if (!['idle', 'port'].includes(b.status)) return;   // something else started while the way was found
  if (S.draft && S.draft.length) S.draft = [];
  const wps = res.wps.map((p, i) => i === res.wps.length - 1 ? {x:q ? q.p.x : p.x, y:q ? q.p.y : p.y, port:toPort, fish:0} : {x:p.x, y:p.y, port:null, fish:0, leia:true});
  S.plan = {wps, idx:0, speed:S.draftSpeed || BOAT.vcruise || 6, returning:false};
  if (b.status === 'port') depart(); else { b.status = 'sailing'; turDepart(); }
  save(); if (typeof refreshAll === 'function') refreshAll();
}
// the chart: a ring where each mission goes (and where freight waits), with its name when the chart is close enough
function turSvg(u, inV){
  const T = S.turer; if (!T || !T.act.length) return '';
  const g = [];
  for (const m of T.act){ const p = m.k === 'frakt' && m.stage === 'pick' ? portById(m.from).p : m.p; if (!p || !inV(p.x, p.y)) continue;
    g.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (11 * u) + '" class="turmk" stroke-width="' + (2 * u) + '" stroke-dasharray="' + (4 * u) + ' ' + (3 * u) + '"/>');
    if (view.z > 0.8){ const w = turWhat(m); g.push(txt({x:p.x + 13 * u, y:p.y - 9 * u}, turEsc(S.lang === 'en' ? w[1] : w[0]), 'lbl-tur', 10.5 * u, 'stroke-width="' + (2.5 * u) + '"')); } }
  return g.join('');
}
