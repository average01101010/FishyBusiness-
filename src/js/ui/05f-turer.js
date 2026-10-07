// ---------- Turoppdrag in the Oppdrag app (core/09g-turer.js): the board made from where the boat is, and the missions taken ----------
// Each card says what it is, how far, about how long it takes to sail in real time, what it pays and by when. «Kjør dit» finds the way
// as Autonav does and sets off (from the quay too); the chart rings the places the missions go to.
const turEsc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const TUR_CLS = {kort:['Kort', 'Short'], mid:['Middels', 'Medium'], lang:['Lang', 'Long'], sesong:['Sesong', 'Season']};
const TUR_KIND = {best:['Bestilling', 'Order'], frakt:['Frakt', 'Freight'], garn:['Hjelp på sjøen', 'Help at sea'], slep:['Hjelp på sjøen', 'Help at sea'], sesong:['Sesongflytting', 'Following the season'], prove:['Havforskningsinstituttet', 'Marine research'], foto:['Kystposten', 'Kystposten']};
function turCard(m, act){
  const L0 = (no, en) => S.lang === 'en' ? en : no, w = turWhat(m), kv0 = (k, v) => '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>';
  let extra = '';
  if (m.k === 'best' && act){ const o = ordState().active.find(x => x.tur === m.id); if (o) extra = kv0(L0('Levert', 'Delivered'), fmt(o.kg - o.left, 0) + ' / ' + fmt(o.kg, 0) + ' kg'); }
  if (m.k === 'best') extra += kv0(L0('Kvalitet', 'Quality'), QN[m.q][S.lang === 'en' ? 'en' : 'no']);
  if (m.k === 'sesong') extra = kv0(L0('Levert der', 'Landed there'), fmt(m.got || 0, 0) + ' / ' + fmt(m.kg, 0) + ' kg') + kv0(L0('Mottak innen', 'Plants within'), TUR.sesongR + ' km');
  if (m.k === 'frakt') extra = kv0(L0('Hentes i', 'Picked up at'), portById(m.from).name + (act ? ' · ' + (m.stage === 'go' ? L0('om bord', 'aboard') : L0('venter på kaia', 'waits on the quay')) : ''));
  if (m.k === 'slep'){ let cd = null; try { cd = coastDistFar(m.p); } catch (e){}
    extra = kv0(L0('Båten', 'The boat'), '«' + turEsc(m.boat) + '», ' + fmt(m.L, 1) + ' m · ' + kr(m.value)) + kv0(L0(m.stage === 'tow' ? 'På slep til' : 'Driver ved', m.stage === 'tow' ? 'In tow to' : 'Drifting at'), m.stage === 'tow' ? turEsc(portById(m.to).name) : coordStr(m.p)) +
      (m.stage !== 'tow' && cd != null ? kv0(L0('Til land', 'To land'), fmt(cd, 1) + ' km') : ''); }
  if (m.k === 'prove' && m.kind === 'stasjon') extra = kv0(L0('Stasjon', 'Station'), coordStr(m.p)) + kv0(L0('Fisket der', 'Fished there'), turMinR((m.min || 0) / 60) + ' / ' + turMinR(m.need / 60) + ' min') + (m.stage === 'measure' ? kv0(L0('Målt', 'Measured'), ((m.meas || []).length) + ' / 10') : '');
  if (m.k === 'prove' && m.kind === 'ekko') extra = kv0(L0('Linja', 'The line'), L0('punkt ', 'point ') + Math.min(3, (m.at || 0) + 1) + L0(' av 3', ' of 3') + ' · ' + coordStr(m.pts[Math.min(2, m.at || 0)])) + kv0(L0('Fart', 'Speed'), L0('høyst ', 'at most ') + TUR.ekkoMax + L0(' knop', ' knots'));
  if (m.k === 'foto'){ const t = act && m.lys ? turLysNext(m, S.t / 60) : null;
    extra = kv0(L0('Fyret', 'The lighthouse'), turEsc(turFyrName(m)) + ' · ' + coordStr(m.fyr)) + kv0(L0('Lys', 'Light'), m.lys ? L0(TUR_LYS[m.lys].no, TUR_LYS[m.lys].en) + (t != null && t > S.t / 60 + 0.1 ? ' · ' + L0('ca. kl. ', 'about ') + hm(t) : '') : L0('når som helst', 'any time')); }
  if (m.k === 'garn') extra = kv0(L0('Sist sett', 'Last seen'), coordStr(m.p)) + kv0(L0('Om bord', 'Aboard'), m.kind === 'garn' ? L0('to til å trekke garn', 'two to haul nets') : L0('én kan trekke lina', 'one can haul the line'));
  const desc = {best:['Mottaket betaler ' + kr(m.pay) + ' i bonus for turen, i tillegg til fisken.', 'The plant pays a bonus of ' + kr(m.pay) + ' for the trip, on top of the fish.'],
    frakt:['Lasta tar plass i lasterommet til den er levert.', 'The freight takes room in the hold until it is delivered.'],
    garn:['Fisken i redskapet er din. Eieren betaler finnerlønn når det er trukket.', 'The fish in the gear is yours. The owner pays a finder\'s fee when it is hauled.'],
    sesong:['Fisken står der nå. Lever ved mottakene der innen fristen.', 'The fish is there now. Land at the plants there before the deadline.'],
    prove:m.kind === 'ekko' ? ['Havforskningsinstituttet vil ha en ekkoloddlinje herfra. Kjør gjennom de tre punktene i rekkefølge, høyst 8 knop. Instituttet betaler for tida.', 'The Institute of Marine Research wants an echo line from here. Run through the three points in order, at 8 knots at most. The institute pays for the time.']
      : ['Havforskningsinstituttet vil ha prøver herfra, slik Kystreferanseflåten tar dem langs hele kysten. Fisk ved stasjonen en stund og mål ti fisk på målebrettet. Instituttet betaler for tida og litt til for nøyaktige mål, og fangsten er din.', 'The Institute of Marine Research wants samples from here, as the coastal reference fleet takes them along the whole coast. Fish at the station a while and measure ten fish on the board. The institute pays for the time and a little more for careful measuring, and the catch is yours.'],
    foto:['Kystposten vil ha et bilde av fyret til avisa. Gå innen 3 km, snu kameraet mot fyret og trykk på utløseren.', 'Kystposten wants a picture of the lighthouse for the paper. Go within 3 km, turn the camera to the lighthouse and press the shutter.'],
    slep:['Motorstopp, og hun driver mot land. Legg deg stille ved siden av henne, så går slepet over (høyst 5,5 knop). Ingen avtale på forhånd: berger du henne, har du krav på bergelønn etter sjøloven, etter båtens verdi, faren og tiden. Driver hun på land først, blir det ingen.', 'Engine trouble, and she is drifting toward land. Lie still beside her and the tow line goes over (5.5 knots at most). No agreement beforehand: if you save her, you are owed a salvage reward under the Maritime Code, by the boat\'s value, the danger and the time. If she drifts ashore first, there is none.']}[m.k];
  return '<div class="ph-card tur ' + m.cls + '"><div class="tur-h"><span class="tur-c">' + L0(TUR_CLS[m.cls][0], TUR_CLS[m.cls][1]) + '</span><small>' + L0(TUR_KIND[m.k][0], TUR_KIND[m.k][1]) + '</small></div>' +
    '<h4>' + turEsc(L0(w[0], w[1])) + '</h4><p class="ph-note">' + L0(desc[0], desc[1]) + '</p>' +
    kv0(L0('Avstand', 'Distance'), fmt(m.nm, 0) + ' nm') + kv0(L0('Seiling', 'Sailing'), L0('ca. ', 'about ') + turDur(m.h)) + extra +
    kv0(m.k === 'slep' ? L0('Bergelønn', 'Salvage') : L0('Belønning', 'Reward'), m.k === 'slep' && m.stage !== 'tow' ? kr(m.payLo) + ' – ' + kr(m.payHi) : kr(m.k === 'slep' ? turSalvage(m, m.danger || 0) : m.pay) + (m.k === 'prove' && m.bonusMax ? L0(' + inntil ', ' + up to ') + kr(m.bonusMax) : '')) + (act ? kv0(L0('Frist', 'Deadline'), dayStr(m.due / 60) + ' ' + hm(m.due / 60) + ' · ' + inReal(m.due - S.t)) : kv0(L0('Tid til rådighet', 'Time allowed'), L0('ca. ', 'about ') + turDur(m.hTot))) +
    '<div class="tur-b">' + (act ? (m.k === 'prove' && m.stage === 'measure' ? '<button class="ph-btn p" data-pa="turmeas" data-id="' + m.id + '">' + L0('Mål fisken', 'Measure the fish') + '</button>' : '') +
      (m.k === 'foto' && !turG3() && dist(S.boat.pos, m.fyr) <= TUR.fotoR ? '<button class="ph-btn p" data-pa="turfoto" data-id="' + m.id + '">' + L0('Ta bilde', 'Take the picture') + '</button>' : '') +
      (m.k === 'prove' && m.stage === 'measure' ? '' : '<button class="ph-btn' + (m.k === 'foto' && dist(S.boat.pos, m.fyr) <= TUR.fotoR ? '' : ' p') + '" data-pa="turgo" data-id="' + m.id + '">' + L0('Kjør dit', 'Go there') + '</button>') + '<button class="ph-btn" data-pa="turdrop" data-id="' + m.id + '">' + L0('Gi fra deg', 'Give up') + '</button>'
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
  const sea = m.k === 'garn' || m.k === 'prove' || m.k === 'foto' || (m.k === 'slep' && m.stage !== 'tow'), ekko = m.k === 'prove' && m.kind === 'ekko';
  const toPort = m.k === 'frakt' && m.stage === 'pick' ? m.from : sea ? null : m.to, q = toPort ? portById(toPort) : null;
  const end = q ? q.p : ekko ? m.pts[m.at || 0] : m.k === 'prove' || m.k === 'foto' ? m.p : {x:m.p.x + (m.k === 'slep' ? 0.06 : 0.12), y:m.p.y}, aPort = b.status === 'port' ? b.port : null;
  if (q && aPort === toPort){ toast(L0('Du er allerede der.', 'You are there already.')); return; }
  toast(L0('Finner veien …', 'Finding the way …'));
  let res; try { res = await leiaRoute({x:b.pos.x, y:b.pos.y}, end, aPort, toPort); } catch (e){ console.error(e); res = {why:['Fant ingen vei dit.', 'Found no way there.']}; }
  if (res.why){ toast(L0(res.why[0], res.why[1])); return; }
  if (!['idle', 'port'].includes(b.status)) return;   // something else started while the way was found
  if (S.draft && S.draft.length) S.draft = [];
  // at a station she starts fishing as she comes (the time it still needs); an echo line goes on through its other points
  const fishH = m.k === 'prove' && m.kind === 'stasjon' ? Math.round(((m.need - (m.min || 0)) / 60 + 0.1) * 10) / 10 : 0;
  const wps = res.wps.map((p, i) => i === res.wps.length - 1 ? {x:q ? q.p.x : p.x, y:q ? q.p.y : p.y, port:toPort, fish:fishH} : {x:p.x, y:p.y, port:null, fish:0, leia:true});
  if (ekko) for (let k = (m.at || 0) + 1; k < m.pts.length; k++) wps.push({x:m.pts[k].x, y:m.pts[k].y, port:null, fish:0});
  S.plan = {wps, idx:0, speed:S.draftSpeed || BOAT.vcruise || 6, returning:false};
  if (b.status === 'port') depart(); else { b.status = 'sailing'; turDepart(); }
  save(); if (typeof refreshAll === 'function') refreshAll();
}
// the chart: a ring where each mission goes (and where freight waits), with its name when the chart is close enough
function turSvg(u, inV){
  const T = S.turer; if (!T || !T.act.length) return '';
  const g = [];
  for (const m of T.act){ const ekko = m.k === 'prove' && m.kind === 'ekko';
    if (ekko && m.at < 3) g.push('<polyline points="' + m.pts.slice(m.at).map(q => q.x + ',' + q.y).join(' ') + '" class="turmk" fill="none" stroke-width="' + (1.5 * u) + '" stroke-dasharray="' + (2 * u) + ' ' + (3 * u) + '"/>');
    const p = m.k === 'frakt' && m.stage === 'pick' ? portById(m.from).p : m.k === 'slep' && m.stage === 'tow' ? portById(m.to).p : ekko ? m.pts[Math.min(2, m.at || 0)] : m.k === 'foto' ? m.fyr : m.p; if (!p || !inV(p.x, p.y)) continue;
    g.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (11 * u) + '" class="turmk" stroke-width="' + (2 * u) + '" stroke-dasharray="' + (4 * u) + ' ' + (3 * u) + '"/>');
    if (view.z > 0.8){ const w = turWhat(m); g.push(txt({x:p.x + 13 * u, y:p.y - 9 * u}, turEsc(S.lang === 'en' ? w[1] : w[0]), 'lbl-tur', 10.5 * u, 'stroke-width="' + (2.5 * u) + '"')); } }
  return g.join('');
}
// ---- the measuring board (Havforskningsinstituttet's sample, core turProveFish): each fish lies with its snout against the board's
// stop, and the board shows the 24 cm round the tail. Tap where the tail ends; the length is read in whole centimetres, total length
// (the reference fleet measures the whole catch so). The fish's colour by species, a forked tail where it has one.
const TUR_FISHC = {torsk:'#8b7d55', hyse:'#7f8892', sei:'#4f5e5b', lange:'#7a6b4b', brosme:'#8d6c3e', kveite:'#6b5b47', blakveite:'#3f3b37', uer:'#c2553d', steinbit:'#6f7375', makrell:'#3f7290', lysing:'#8e9599', breiflabb:'#6a5a44'};
const TUR_FORK = ['sei', 'makrell', 'hyse', 'sild', 'lysing'];
function turMeasure(id){
  const m = ((S.turer && S.turer.act) || []).find(x => x.id === id); if (!m || m.stage !== 'measure') return;
  turProveFish(m);
  let el = $('turMeas'); if (!el){ el = document.createElement('div'); el.id = 'turMeas'; document.body.appendChild(el); }
  const L0 = (no, en) => S.lang === 'en' ? en : no, PX = 15;
  let read = null, fb = null;
  const close = () => { el.hidden = true; el.innerHTML = ''; };
  const draw = () => {
    const i = m.meas.length;
    if (i >= m.fish.length){
      const err = m.fish.reduce((a, f, k) => a + Math.abs(m.meas[k] - f.cm), 0) / m.fish.length;
      el.innerHTML = '<div class="tm-box"><h4>' + L0('Ti fisk er målt', 'Ten fish measured') + '</h4><p>' + L0('I snitt ', 'On average ') + fmt(err, 1) + L0(' cm fra riktig lengde.', ' cm from the right length.') + '</p><div class="tm-b"><button class="ph-btn p" data-x="send">' + L0('Send til instituttet', 'Send to the institute') + '</button></div></div>';
      el.querySelector('[data-x=send]').onclick = () => { turProveDone(m); close(); save(); if (typeof refreshAll === 'function') refreshAll(); };
      el.hidden = false; return;
    }
    const f = m.fish[i], x = cm => (cm - f.c0) * PX, tip = x(f.cm), y0 = 104, pd = tip - 36, col = TUR_FISHC[f.sp] || '#7a7f80', fork = TUR_FORK.includes(f.sp);
    let tk = '';
    for (let c = f.c0; c <= f.c0 + 24; c++){ const X = x(c), big = c % 5 === 0; tk += '<line x1="' + X + '" y1="40" x2="' + X + '" y2="' + (big ? 62 : 52) + '" stroke="#2b2416" stroke-width="' + (big ? 1.6 : 1) + '"/>' + (big ? '<text x="' + X + '" y="34" font-size="12" text-anchor="middle" fill="#2b2416">' + c + '</text>' : ''); }
    const tail = fork ? ' L' + tip + ',' + (y0 - 30) + ' L' + (tip - 15) + ',' + y0 + ' L' + tip + ',' + (y0 + 30) : ' L' + (tip - 4) + ',' + (y0 - 28) + ' Q' + (tip + 4) + ',' + y0 + ' ' + (tip - 4) + ',' + (y0 + 28);
    const fish = '<path d="M-20,' + (y0 - 36) + ' C' + (pd * 0.55) + ',' + (y0 - 36) + ' ' + (pd - 34) + ',' + (y0 - 10) + ' ' + pd + ',' + (y0 - 8) + tail + ' L' + pd + ',' + (y0 + 8) + ' C' + (pd - 34) + ',' + (y0 + 10) + ' ' + (pd * 0.55) + ',' + (y0 + 36) + ' -20,' + (y0 + 36) + ' Z" fill="' + col + '" stroke="rgba(0,0,0,.45)" stroke-width="1"/>' +
      '<path d="M-20,' + (y0 + 4) + ' C' + (pd * 0.5) + ',' + (y0 + 2) + ' ' + (pd - 20) + ',' + y0 + ' ' + pd + ',' + y0 + '" stroke="rgba(255,255,255,.35)" stroke-width="1.4" fill="none"/>';
    const mk = read != null ? '<line x1="' + x(read) + '" y1="38" x2="' + x(read) + '" y2="148" stroke="#d0281e" stroke-width="2"/>' : '';
    el.innerHTML = '<div class="tm-box"><h4>' + L0('Målebrettet · fisk ', 'The board · fish ') + (i + 1) + L0(' av 10', ' of 10') + '</h4><p>' + spName(f.sp) + '. ' + L0('Trykk der halen slutter.', 'Tap where the tail ends.') + '</p>' +
      '<svg class="tm-svg" viewBox="0 0 360 150"><rect x="0" y="0" width="360" height="150" fill="#e9d9a8"/><rect x="0" y="0" width="360" height="64" fill="#f3e6bd"/>' + fish + tk + mk + '</svg>' +
      '<div class="tm-r">' + (fb || (read != null ? L0('Lest: ', 'Read: ') + read + ' cm' : '&nbsp;')) + '</div>' +
      '<div class="tm-b"><button class="ph-btn" data-x="later">' + L0('Senere', 'Later') + '</button><button class="ph-btn p" data-x="ok"' + (read == null || fb ? ' disabled' : '') + '>' + L0('Registrer', 'Record') + '</button></div></div>';
    const sv = el.querySelector('svg');
    sv.onpointerdown = e => { if (fb) return; const r = sv.getBoundingClientRect(); read = Math.round(f.c0 + (e.clientX - r.left) / r.width * 360 / PX); draw(); };
    el.querySelector('[data-x=later]').onclick = close;
    el.querySelector('[data-x=ok]').onclick = () => { if (read == null) return; const d = Math.abs(read - f.cm);
      fb = d <= 0.5 ? L0('Riktig: ', 'Right: ') + Math.round(f.cm) + ' cm' : L0('Du leste ', 'You read ') + read + L0(' cm, riktig er ', ' cm, the right length is ') + Math.round(f.cm) + ' cm';
      m.meas.push(read); save(); draw(); setTimeout(() => { fb = null; read = null; draw(); }, 1100); };
    el.hidden = false;
  };
  draw();
}
// ---- the lighthouse picture: the shutter shows within 3 km of the lighthouse while the 3D view is up; without it the card's button
// takes it by the distance alone. The pictures are kept on this device (a few, for Kystposten), not in the save
const turG3 = () => typeof G3 !== 'undefined' && G3.isActive && G3.isActive() && !!G3.seen;
const TUR_FOTO_KEY = 'kystfiske_v2_foto';
function turFotoKeep(id, img){ try { const a = JSON.parse(localStorage.getItem(TUR_FOTO_KEY) || '[]').filter(x => x.id !== id); a.push({id, img}); while (a.length > 6) a.shift(); localStorage.setItem(TUR_FOTO_KEY, JSON.stringify(a)); } catch (e){} }
function turFotoSrc(id){ try { const x = JSON.parse(localStorage.getItem(TUR_FOTO_KEY) || '[]').find(q => q.id === id); return x ? x.img : null; } catch (e){ return null; } }
function turFotoUi(){
  const btn = $('fotoBtn'); if (!btn) return;
  const on = turG3() && !!turFotoAt(); if (btn.hidden === on) btn.hidden = !on;
}
async function turFotoShoot(id){
  const T = S.turer, m = T && T.act.find(x => (id == null || x.id === id) && x.k === 'foto' && x.vid === S.cur && dist(S.boat.pos, x.fyr) <= TUR.fotoR); if (!m) return;
  let seen = null, img = null;
  if (turG3()){ seen = G3.seen(m.fyr.x, m.fyr.y, m.fyr.h);
    if (seen && seen.front && seen.clear){ const fl = $('fotoFlash'); if (fl){ fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); } try { img = await G3.snap(720); } catch (e){ console.error(e); } } }
  const why = turFotoTake(m, seen, img);
  toast(why || (S.lang === 'en' ? 'The picture is sent to Kystposten.' : 'Bildet er sendt til Kystposten.'));
  if (!why){ save(); if (typeof refreshAll === 'function') refreshAll(); }
}
