// ---------- «Første tur»: the guided first trip every new player goes through ----------
// A new game, also after a reset, starts with S.tut = {v:2, m:{}, catch:true, pAt}: the milestones reached (m, game minute), whether
// the first catch is still guaranteed (core: fish(), risk(), the rod), and when the player last got further (real ms, for the skip
// button, which only shows after 20 minutes without progress). The step shown is the first one not yet done, and «done» is read from
// the game state as well as the milestones, so the guide survives reloads and surprises. Saves from before it are not sent through.
// While it runs, a dimmed layer with a hole and a pulsing ring shows where to tap (z-index 61–62, over the phone), with the tip above.
const tutOn = () => !!(S.tut && S.tut.v === 2);
const tutNew = () => ({v:2, m:{}, catch:true, pAt:Date.now()});
const TUT_SKIP_MS = 20 * 60 * 1000;
const tutField = () => GROUNDS[TUT_FIELD];   // Gisundet nord (core: the skrei patch while the catch is guaranteed)
function tutMark(k){ if (!tutOn() || S.tut.m[k]) return; S.tut.m[k] = S.t || 1; S.tut.pAt = Date.now(); save(); }
// free the first time: the hand jig, the ice (the first fill, up to 150 kg) and one luxury luck
const tutFree = k => tutOn() && !S.tut.m['free_' + k];
// the waypoint inside the ring at Gisundet nord, in the draft or the plan
function tutFieldWp(list){ const g = tutField(); return (list || []).findIndex(w => !w.port && dist(w, g.p) <= g.r); }
const tutFieldFish = () => { const d = tutFieldWp(S.draft), p = S.plan ? tutFieldWp(S.plan.wps) : -1; return Math.max(d >= 0 ? S.draft[d].fish || 0 : 0, p >= 0 ? S.plan.wps[p].fish || 0 : 0); };
const vis = sel => { for (const s of [].concat(sel)){ const el = document.querySelector(s); if (el && el.offsetParent !== null && !el.hidden){ const r = el.getBoundingClientRect(); if (r.width && r.height) return el; } } return null; };
const inPlot = () => document.body.classList.contains('vplot');
const planEnds = id => !!(S.plan && S.plan.wps.length && S.plan.wps[S.plan.wps.length - 1].port === id);
const draftEnds = id => !!(S.draft.length && S.draft[S.draft.length - 1].port === id);
// open the phone: the button on the chart in 3D; from the plotter, back to 3D first
const phoneTarget = () => inPlot() ? {el:vis('#ecClose'), no:'Gå tilbake til 3D først.', en:'Go back to 3D first.'} : {el:vis(['#phoneFab', '#phoneBtn'])};
function phoneApp(app, inner){
  if (!PHONE.isOpen()) return phoneTarget();
  if (PHONE.app !== app) return {el:vis(PHONE.app === 'home' ? '#phone [data-a="' + app + '"]' : '#phone .ph-nav [data-pa=home], #phone .ph-nav [data-pa=back]'), scroll:PHONE.app === 'home'};
  return {el:inner ? vis(inner) : null, scroll:true};
}
const TSTEPS = [
  {id:'shop', done:() => S.boat.gear && S.boat.ice >= 149,
    tip:() => { const b = S.boat, open = PHONE.isOpen() && PHONE.app === 'fiske';
      if (open && !b.gear) return {el:vis('#phone [data-pa=shop][data-k=jig]'), scroll:true, no:'Trykk på knappen for håndjuksa, og en gang til for å bekrefte. Den er gratis denne gangen.', en:'Tap the hand jig button, and once more to confirm. It is free this time.'};
      if (open) return {el:vis('#phone [data-pa=shop][data-k=ice][data-fill]'), scroll:true, no:'Fyll isen: 150 kg er også gratis denne gangen. Is holder fisken fersk og gir bedre pris.', en:'Fill up with ice: 150 kg is free this time too. Ice keeps the fish fresh and gets a better price.'};
      const t0 = !PHONE.isOpen() && !inPlot() ? {el:vis('#actbar [data-ui=fiske]')} : phoneApp('fiske', null);
      return {...t0, no:'Velkommen om bord! Først trenger du utstyr. Åpne Fiskeutstyr: håndjuksa og 150 kg is er gratis denne gangen.', en:'Welcome aboard! First you need gear. Open the tackle shop: a hand jig and 150 kg of ice are free this time.'}; }},
  {id:'gps', done:() => inPlot() || !!S.plan || S.boat.status !== 'port',
    tip:() => PHONE.isOpen() ? {el:vis('#phone .ph-nav [data-pa=close]'), no:'Lukk telefonen. Nå skal du planlegge turen.', en:'Close the phone. Now you plan the trip.'} : {el:vis('#gpsBtn'), no:'Trykk på GPS-en for å åpne kartplotteren.', en:'Tap the GPS to open the chart plotter.'}},
  {id:'route1', live:true, view:() => [PORTS[0].p, tutField().p], done:() => tutFieldWp(S.draft) >= 0 || (S.plan && tutFieldWp(S.plan.wps) >= 0) || S.boat.status === 'fishing',
    tip:() => { if (!inPlot()) return {el:vis('#gpsBtn'), no:'Åpne kartplotteren igjen.', en:'Open the chart plotter again.'};
      const g = tutField();
      if (LEIA_ARM || LEIA_BUSY) return {map:{p:g.p, r:g.r}, no:'Trykk i kartet innenfor ringen ved Gisundet nord. Der står fisken nå.', en:'Tap the chart inside the ring at North Gisundet. That is where the fish are.'};
      return {el:vis(['#rLeia', '#panel [data-act=leia]']), no:'Fisken står i Gisundet nord. Trykk «Følg leia», og så i ringen der, så finner båten en trygg vei. Du kan også sette punktene selv.', en:'The fish are at North Gisundet. Tap «Follow the fairway», then inside the ring there, and the boat finds a safe way. You can also set the points yourself.'}; }},
  {id:'fish2', live:true, done:() => tutFieldFish() >= 2 || S.boat.status === 'fishing',
    tip:() => { const k = tutFieldWp(S.draft); if (k < 0) return {no:'Legg et punkt innenfor ringen igjen.', en:'Put a point inside the ring again.'};
      if (window.innerWidth <= 700) document.body.classList.add('drawer');
      return {el:vis('#panel .wpc[data-i="' + k + '"] [data-act=fp]'), scroll:true, no:'Gi punktet minst 2 timer fisketid med +. Båten fisker der til tida er ute.', en:'Give the point at least 2 hours of fishing time with +. The boat fishes there until the time is up.'}; }},
  {id:'cast1', done:() => !!S.plan || ['unmooring', 'sailing', 'fishing'].includes(S.boat.status),
    tip:() => { const e = estimate();
      if (e.bad >= 0) return {el:vis(['#rUndo', '#panel [data-act=clear]']), no:'Etappe ' + legName(e.bad) + ' krysser land. Trykk angre, og bruk «Følg leia», eller dra punktet ut på sjøen.', en:'Leg ' + legName(e.bad) + ' crosses land. Tap undo and use «Follow the fairway», or drag the point out to sea.'};
      if (e.fuel > S.boat.fuel) return {el:vis('#panel [data-act=clear]'), no:'Turen bruker mer drivstoff enn du har. Gjør ruta kortere.', en:'The trip needs more fuel than you have. Make the route shorter.'};
      return {el:vis('#panel .rbar [data-act=start]'), no:'Trykk «Kast loss». Båten kjører selv ut til feltet.', en:'Tap «Cast off». The boat runs out to the grounds on its own.'}; }},
  {id:'haill', done:() => !!(S.haill && S.haill.type === 'luksus'),
    tip:() => { const t0 = phoneApp('haill', '#phone [data-pa=haillbuy][data-k=luksus]');
      return {...t0, no:(S.boat.tutWait ? 'Båten venter på feltet til du har hentet haillen. ' : 'Mens båten går ut: ') + 'Åpne Haill-appen og hent en gratis luksushaill. Den gir bedre fiskelykke i sju døgn.', en:(S.boat.tutWait ? 'The boat waits on the grounds until you have fetched the luck. ' : 'While the boat heads out: ') + 'Open the Luck app and fetch a free luxury luck. It brings better fishing for seven days.'}; }},
  {id:'fish', done:() => S.tut.m.rodOn || (S.fsess && S.t - S.fsess.t0 >= 20) || (S.tut.m.cast1 && S.boat.status === 'idle' && holdTotal() > 1 && !S.boat.tutWait),
    tip:() => { if (S.boat.status !== 'fishing') return {no:'Båten er på vei ut. Den begynner å fiske når den er fremme.', en:'The boat is on its way out. It starts fishing when it gets there.', small:true};
      if (inPlot()) return {el:vis('#ecClose'), no:'Nå fisker juksa. Gå tilbake til 3D for å se fisket.', en:'The jig is fishing now. Go back to 3D to watch.'};
      return {el:vis('#actbar [data-act=rod]'), no:'Nå fisker juksa for deg. Trykk «Fisk selv» for å prøve stanga også: trykk «Trekk!» når det napper, og hold «Sveiv».', en:'The jig fishes for you now. Tap «Fish yourself» to try the rod too: tap «Strike!» when it bites, and hold «Reel».'}; }},
  {id:'deck', ok:true, done:() => false,
    tip:() => ({el:vis(['#actbar .stp', '#hud']), no:'Fisken blør i bløggekaret idet den kommer over ripa. Så blir den sløyd og iset. Isen holder kvaliteten oppe, og kvaliteten gir prisen.', en:'The fish is bled in the tub as it comes over the rail. Then it is gutted and iced. The ice keeps the quality up, and the quality sets the price.'})},
  {id:'full', done:() => holdTotal() >= capHold() - 1 || (S.boat.status === 'idle' && holdTotal() > 1 && !S.boat.fishUntil && !S.boat.tutWait) || !!S.lastSale,
    tip:() => ({el:vis('#hud'), no:'Lasterommet fylles. Når det er fullt, går du til Botnhamn og leverer.', en:'The hold is filling up. When it is full, you go to Botnhamn and land the catch.', small:true})},
  {id:'route2', live:true, view:() => [S.boat.pos, portById('botnhamn').p], done:() => draftEnds('botnhamn') || planEnds('botnhamn') || (S.boat.status === 'port' && S.boat.port === 'botnhamn'),
    tip:() => { if (!inPlot()) return {el:vis('#gpsBtn'), no:'Lasten er full! Åpne kartplotteren. Finnsnes har ikke fiskemottak, så fisken skal til Botnhamn.', en:'The hold is full! Open the chart plotter. Finnsnes has no fish plant, so the catch goes to Botnhamn.'};
      if (LEIA_ARM || LEIA_BUSY) return {map:{p:portById('botnhamn').p, r:0.5}, no:'Trykk på Botnhamn i kartet.', en:'Tap Botnhamn on the chart.'};
      return {el:vis(['#rLeia', '#panel [data-act=leia]']), no:'Trykk «Følg leia», og så på Botnhamn i kartet. Båten finner en trygg vei dit.', en:'Tap «Follow the fairway», then Botnhamn on the chart. The boat finds a safe way there.'}; }},
  {id:'cast2', done:() => (planEnds('botnhamn') && S.boat.status !== 'idle') || (S.boat.status === 'port' && S.boat.port === 'botnhamn'),
    tip:() => { const e = estimate(); if (e.bad >= 0) return {el:vis(['#rUndo', '#panel [data-act=clear]']), no:'Etappe ' + legName(e.bad) + ' krysser land. Trykk angre, og bruk «Følg leia».', en:'Leg ' + legName(e.bad) + ' crosses land. Tap undo and use «Follow the fairway».'};
      return {el:vis('#panel .rbar [data-act=start]'), no:'Trykk «Kast loss».', en:'Tap «Cast off».'}; }},
  {id:'chip', ok:true, done:() => S.boat.status === 'port' && S.boat.port === 'botnhamn',
    tip:() => ({el:vis('#hud .st.nx'), no:'Brikka «Neste» viser hva som skjer og når, også hvor lenge det er i ekte tid. Båten kjører selv, så du kan gjøre andre ting imens.', en:'The «Next» chip shows what happens next and when, also how long that is in real time. The boat runs on its own, so you can do other things meanwhile.'})},
  {id:'land', done:() => !!S.boat.land || !!(S.lastSale && S.lastSale.port === 'botnhamn'),
    tip:() => { if (!(S.boat.status === 'port' && S.boat.port === 'botnhamn')) return {el:vis('#hud .st.nx'), no:'Båten er på vei til Botnhamn.', en:'The boat is on its way to Botnhamn.', small:true};
      return inPlot() ? {el:vis('#ecClose'), no:'Fremme! Gå tilbake til 3D for å levere.', en:'Arrived! Go back to 3D to land the catch.'} : {el:vis('#actbar [data-act=sell]'), no:'Fremme i Botnhamn. Trykk «Lever» for å levere fisken.', en:'Arrived at Botnhamn. Tap «Land» to land the catch.'}; }},
  {id:'slip', ok:true, done:() => false,
    tip:() => { if (S.boat.land) return {el:vis('#hud .st.nx'), no:'Kranen løfter fisken på land. Sluttseddelen kommer når lossingen er ferdig.', en:'The crane lifts the catch ashore. The landing note comes when the landing is done.', small:true, noOk:true};
      if (!(PHONE.isOpen() && PHONE.app === 'havn')) return {okText:['Vis sluttseddelen', 'Show the landing note'], okAct:() => { PHONE.open('havn'); setTimeout(tutScrollSlip, 350); }, no:'Fisken er levert. Sluttseddelen viser hva du fikk betalt.', en:'The catch is landed. The landing note shows what you were paid.'};
      return {el:vis('#phone .slipt'), no:'Her er prisen per kilo for hver størrelse og kvalitet, og innloggingsbonusen din. Hver dag du åpner spillet, gir 1 % mer på fisken.', en:'Here is the price per kilo for each size and grade, and your login bonus. Each day you open the game adds 1 % on the fish.'}; }},
  {id:'goal', ok:true, done:() => false,
    tip:() => { if (!(PHONE.isOpen() && PHONE.app === 'home')) return {okText:['Vis neste mål', 'Show the next goal'], okAct:() => PHONE.open('home'), no:'Godt levert! Nå kan du spare til neste steg.', en:'Well landed! Now you can save up for the next step.'};
      return {el:vis('#phone .ph-goal'), okText:['Ferdig', 'Done'], no:'Neste mål er en juksamaskin. Den fisker like mye som to håndjukser. Målene står her og øverst i Fartøy. God tur!', en:'The next goal is a jigging machine. It fishes as much as two hand jigs. The goals are here and at the top of Vessels. Good fishing!'}; }}
];
let tutCur = null;
// the step's tip; when it points at something outside the phone while the phone is open, close the phone first
function tutTip(st){
  const T0 = st.tip() || {};
  if (PHONE.isOpen() && ((T0.el && !T0.el.closest('#phone')) || T0.map)) return {el:vis('#phone .ph-nav [data-pa=close]'), no:'Lukk telefonen først.', en:'Close the phone first.'};
  return T0;
}
// where the guide points: the hole in the dimmed layer and the ring, round a button or round a place on the chart
function tutRect(T0){
  if (T0.el){ if (T0.scroll) T0.el.scrollIntoView({block:'nearest'}); const q = T0.el.getBoundingClientRect(); return {R:{x:q.left - 6, y:q.top - 6, w:q.width + 12, h:q.height + 12}, round:false}; }
  if (T0.map && inPlot()){ const c = mapToClient(T0.map.p), rp = Math.max(28, T0.map.r * view.px); return {R:{x:c.x - rp, y:c.y - rp, w:rp * 2, h:rp * 2}, round:true}; }
  return {R:null, round:false};
}
function tutStep(){
  if (!tutOn()) return null;
  // a step done for good settles the live ones before it (a route is only a draft until the boat casts off)
  for (const st of TSTEPS){ if (S.tut.m[st.id]) continue; if (st.done()){ if (!st.live){ for (const q of TSTEPS){ if (q === st) break; if (!S.tut.m[q.id]) S.tut.m[q.id] = S.t || 1; } tutMark(st.id); } continue; } return st; }
  return null;
}
function tutFinish(){ S.tut = 0; log('Første tur er fullført. Nå er du din egen skipper.', 'The first trip is done. Now you are your own skipper.'); save(); tutUpdate(); if (typeof refreshAll === 'function') refreshAll(); }
function tutScrollSlip(){ const v = $('phView'), t = v && v.querySelector('.slipt'); if (t) v.scrollTop = Math.max(0, t.offsetTop - 60); }
// what the guide lets the player do on each step; the rest waits until the first trip is done
const TUT_ALLOW = {start:['cast1', 'cast2'], waypoint:['route1', 'fish2', 'route2'], sell:['land']};
function tutAllow(what){
  if (!tutOn()) return true;
  const st = tutStep(), id = st ? st.id : '', L = (no, en) => S.lang === 'no' ? no : en;
  if (!TUT_ALLOW[what]) return false;
  if (TUT_ALLOW[what].includes(id)){
    if (what === 'start' && id === 'cast1' && !(tutFieldFish() >= 2 && tutFieldWp(S.draft) >= 0)){ toast(L('Ruta må ha et punkt i ringen ved Gisundet nord med minst 2 timer fisketid.', 'The route needs a point in the ring at North Gisundet with at least 2 hours of fishing.')); return false; }
    if (what === 'start' && id === 'cast2' && !draftEnds('botnhamn')){ toast(L('Ruta skal ende i Botnhamn.', 'The route should end at Botnhamn.')); return false; }
    return true;
  }
  const t = st && tutTip(st); toast(L('Følg veiledningen først: ', 'Follow the guide first: ') + (t ? L(t.no, t.en) : ''));
  return false;
}
// the view that shows what a route step needs, once per step
function tutView(st){
  if (!st.view || S.tut.m['view_' + st.id] || !inPlot()) return;
  const [a, c] = st.view(), r = svg.getBoundingClientRect(); if (!r.width) return;
  view.cx = (a.x + c.x) / 2; view.cy = (a.y + c.y) / 2;
  const span = Math.max(Math.abs(a.x - c.x) * r.height / r.width, Math.abs(a.y - c.y), 2) * 1.5; view.z = clamp(MAP_H / span, 0.8, 160);
  applyView(); scheduleStatic(); renderDyn(); S.tut.m['view_' + st.id] = 1;
}
function tutUpdate(){
  const tip = $('tip'), dim = $('tutDim'), ring = $('tutRing'), hide = () => { tip.hidden = true; dim.hidden = true; ring.hidden = true; tutCur = null; };
  if (!tutOn() || !$('modal').hidden || BOOK.isOpen()){ hide(); return; }
  const st = tutStep(); if (!st){ tutFinish(); return; }
  tutView(st);
  if (window.rodActive) tutMark('rodOn');
  const T0 = tutTip(st), txt = S.lang === 'no' ? T0.no : T0.en; tutCur = {st, T0};
  if (ROD_OPEN()){ hide(); return; }   // the rod has its own controls on screen
  if ($('tipText').textContent !== txt) $('tipText').textContent = txt || '';
  const ok = (st.ok && !T0.noOk) || T0.okAct; $('tipOk').hidden = !ok;
  $('tipOk').textContent = T0.okText ? (S.lang === 'no' ? T0.okText[0] : T0.okText[1]) : (S.lang === 'no' ? 'Skjønner' : 'Got it');
  $('tipSkip').hidden = Date.now() - (S.tut.pAt || Date.now()) < TUT_SKIP_MS; $('tipSkip').textContent = S.lang === 'no' ? 'Hopp over veiledningen' : 'Skip the guide';
  tip.hidden = false; tip.classList.toggle('small', !!T0.small);
  const {R, round} = tutRect(T0);
  const place = (el, cls) => { el.hidden = !R; if (!R) return; el.style.left = R.x + 'px'; el.style.top = R.y + 'px'; el.style.width = R.w + 'px'; el.style.height = R.h + 'px'; el.classList.toggle('round', round); };
  place(dim); place(ring); if (T0.small && R) dim.hidden = true;
  const tw = tip.offsetWidth, th = tip.offsetHeight, ar = tip.querySelector('.tip-arrow'), vw = window.innerWidth, vh = window.innerHeight;
  if (!R){ tip.style.left = Math.max(8, (vw - tw) / 2) + 'px'; tip.style.top = '72px'; ar.style.display = 'none'; return; }
  const above = R.y > th + 24 && (R.y + R.h > vh * 0.45), x = clamp(R.x + R.w / 2 - tw / 2, 8, vw - tw - 8), y = above ? R.y - th - 12 : Math.min(vh - th - 8, R.y + R.h + 12);
  tip.style.left = x + 'px'; tip.style.top = y + 'px'; ar.style.display = '';
  ar.style.left = clamp(R.x + R.w / 2 - x - 7, 12, tw - 26) + 'px'; ar.style.top = above ? (th - 7) + 'px' : '-7px';
}
const ROD_OPEN = () => !!window.rodActive && !$('rodUI').hidden;
$('tipOk').onclick = () => { if (!tutCur) return; const {st, T0} = tutCur; if (T0.okAct){ T0.okAct(); tutUpdate(); return; } if (st.id === 'goal'){ tutMark('goal'); tutFinish(); return; } tutMark(st.id); tutUpdate(); };
$('tipSkip').onclick = () => { if (confirm(S.lang === 'no' ? 'Hoppe over resten av veiledningen?' : 'Skip the rest of the guide?')){ if (S.tut) S.tut.catch = false; tutFinish(); } };
