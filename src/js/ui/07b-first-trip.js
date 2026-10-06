// ---------- «Første tur»: the guided first trip every new player goes through ----------
// A new game, also after a reset, starts with S.tut = {v:2, m:{}, catch:true, pAt}: the milestones reached (m, game minute), whether
// the first catch is still guaranteed (core: fish(), risk(), the jig game), and when the player last got further (real ms). It cannot be
// skipped (Jonas 05.10.2026: «Spillere skal ikke kunne hoppe over tutorial»; the skip button after 20 minutes without progress is gone). The step shown is the first one not yet done, and «done» is read from
// the game state as well as the milestones, so the guide survives reloads and surprises. Saves from before it are not sent through.
// While it runs, a dimmed layer with a hole and a pulsing ring shows where to tap (z-index 61–62, over the phone), with the tip above.
const tutOn = () => !!(S.tut && S.tut.v === 2);
const tutNew = () => ({v:2, m:{}, catch:true, pAt:Date.now(), ...(S && S.tutStart ? S.tutStart : {})});   // a start along the coast brings its patch and plant (ui/08c-start.js)
const tutField = () => tutFieldAt();   // Gisundet nord, or near a start along the coast (core: the skrei patch while the catch is guaranteed)
// where the first catch is landed: Botnhamn from Finnsnes, the start's own plant elsewhere (ui/08c-start.js); the field's name for the tips
const tutLand = () => (S.tut && S.tut.land) || 'botnhamn', tutLandN = () => (portById(tutLand()) || {name:'Botnhamn'}).name;
const tutAt = () => S.tut && S.tut.f && S.tut.f.at ? S.tut.f.at : {no:'ved Gisundet nord', en:'at North Gisundet'};
const tutHome = () => portById((S.home) || 'finnsnes') || PORTS[0];
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
const phoneTarget = () => inPlot() ? {el:vis('#ecClose'), no:'Trykk «Lukk» for å gå tilbake til 3D først.', en:'Tap «Close» to go back to 3D first.'} : {el:vis(['#phoneFab', '#phoneBtn'])};
// open a page in the dock's drawer: the button, then the item in its fan (ui/10c-dock.js)
function dockApp(menu, item, page, inner){
  if (DOCK.page === page) return {el:inner ? vis(inner) : null, scroll:true};
  if (inPlot()) return {el:vis('#ecClose'), no:'Trykk «Lukk» for å gå tilbake til 3D først.', en:'Tap «Close» to go back to 3D first.'};
  return {el:DOCK.menuOpen === menu ? vis('#dockFan [data-dk=' + item + ']') : vis('#dock [data-dk=' + menu + ']')};
}
function phoneApp(app, inner){
  if (!PHONE.isOpen()) return phoneTarget();
  if (PHONE.app !== app) return {el:vis(PHONE.app === 'home' ? '#phone [data-a="' + app + '"]' : '#phone .ph-nav [data-pa=home], #phone .ph-nav [data-pa=back]'), scroll:PHONE.app === 'home'};
  return {el:inner ? vis(inner) : null, scroll:true};
}
const TSTEPS = [
  {id:'shop', done:() => S.boat.gear && S.boat.ice >= 149,
    tip:() => { const b = S.boat, open = DOCK.page === 'fiske';
      if (open && !b.gear) return {el:vis('#drawerBody [data-pa=shop][data-k=jig]'), scroll:true, no:'Solveig har ei juksa til deg som far betalte for. Trykk på knappen for håndjuksa, og en gang til for å bekrefte.', en:'Solveig has a jig for you that Father paid for. Tap the hand jig button, and once more to confirm.'};
      if (open) return {el:vis('#drawerBody [data-pa=shop][data-k=ice][data-fill]'), scroll:true, no:'Fyll isen: far betalte for 150 kg også, og gutten i butikken bærer sekkene ned til båten. Is holder fisken fersk og gir bedre pris.', en:'Fill up with ice: Father paid for 150 kg too, and the boy from the shop carries the bags down to the boat. Ice keeps the fish fresh and gets a better price.'};
      const t0 = dockApp('verft', 'fiskeutstyr', 'fiske', null);
      return {...t0, no:'Båten ligger ved fars gamle naust. Utstyrsbutikken er et steinkast unna, og Solveig der har noe til deg. Gå bort dit: trykk Verft og så Fiskeutstyr.', en:'The boat lies at Father’s old boathouse. The tackle shop is a stone’s throw away, and Solveig there has something for you. Walk over: tap Yard and then Tackle.'}; }},
  {id:'gps', done:() => inPlot() || !!S.plan || S.boat.status !== 'port',
    tip:() => PHONE.isOpen() ? {el:vis('#phone .ph-nav [data-pa=close]'), no:'Lukk telefonen. Nå skal du planlegge turen.', en:'Close the phone. Now you plan the trip.'} : DOCK.page ? {el:vis('#drawerClose'), no:'Lukk Fiskeutstyr. Nå skal du planlegge turen.', en:'Close the tackle shop. Now you plan the trip.'} : {el:vis('#miniPlot'), no:'Trykk på GPS-en for å åpne kartplotteren.', en:'Tap the GPS to open the chart plotter.'}},
  {id:'route1', live:true, view:() => [tutHome().p, tutField().p], done:() => tutFieldWp(S.draft) >= 0 || (S.plan && tutFieldWp(S.plan.wps) >= 0) || S.boat.status === 'fishing',
    tip:() => { if (!inPlot()) return {el:vis('#miniPlot'), no:'Åpne kartplotteren igjen.', en:'Open the chart plotter again.'};
      const g = tutField();
      if (LEIA_ARM || LEIA_BUSY) return {map:{p:g.p, r:g.r}, no:'Trykk i kartet innenfor ringen ' + tutAt().no + '. Der står fisken nå.', en:'Tap the chart inside the ring ' + tutAt().en + '. That is where the fish are.'};
      return {el:vis('#rAuto'), no:'Fisken står ' + tutAt().no + '. Trykk «Autonav», og så i ringen der, så finner båten en trygg vei. Du kan også sette punktene selv.', en:'The fish are ' + tutAt().en + '. Tap «Autonav», then inside the ring there, and the boat finds a safe way. You can also set the points yourself.'}; }},
  {id:'fish2', live:true, done:() => tutFieldFish() >= 2 || S.boat.status === 'fishing',
    tip:() => { const k = tutFieldWp(S.draft); if (k < 0) return {no:'Legg et punkt innenfor ringen igjen.', en:'Put a point inside the ring again.'};
      if (window.innerWidth <= 700) document.body.classList.add('drawer');
      return {el:vis('#panel .wpc[data-i="' + k + '"] [data-act=fp]'), scroll:true, no:'Gi punktet minst 2 timer fisketid med +. Båten fisker der til tida er ute.', en:'Give the point at least 2 hours of fishing time with +. The boat fishes there until the time is up.'}; }},
  {id:'cast1', done:() => !!S.plan || ['unmooring', 'sailing', 'fishing'].includes(S.boat.status),
    tip:() => { const e = estimate();
      if (e.bad >= 0) return {el:vis(['#rUndo', '#panel [data-act=clear]']), no:'Etappe ' + legName(e.bad) + ' krysser land. Trykk angre, og bruk «Autonav», eller dra punktet ut på sjøen.', en:'Leg ' + legName(e.bad) + ' crosses land. Tap undo and use «Autonav», or drag the point out to sea.'};
      if (e.fuel > S.boat.fuel) return {el:vis('#panel [data-act=clear]'), no:'Turen bruker mer drivstoff enn du har. Gjør ruta kortere.', en:'The trip needs more fuel than you have. Make the route shorter.'};
      return {el:vis('#panel .rbar [data-act=start]'), no:'Trykk «Kast loss». Båten kjører selv ut til feltet.', en:'Tap «Cast off». The boat runs out to the grounds on its own.'}; }},
  // on the way out: the «Next» chip, then the wait until the boat is at the grounds (it waits there for the luck, core/05-vessels.js)
  {id:'chip', ok:true, done:() => false,
    tip:() => ({el:vis('#hud .st.nx'), no:'Båten kjører selv ut til feltet. Brikka «Neste» viser hva som skjer og når, også hvor lenge det er i ekte tid. Du kan gjøre andre ting imens.', en:'The boat runs out to the grounds on its own. The «Next» chip shows what happens next and when, also how long that is in real time. You can do other things meanwhile.'})},
  {id:'sail', done:() => !!S.boat.tutWait || S.boat.status === 'fishing' || holdTotal() > 1,
    tip:() => ({el:vis('#hud .st.nx'), no:'Båten er på vei ut til feltet ' + tutAt().no + '.', en:'The boat is on its way out to the grounds ' + tutAt().en + '.', small:true})},
  // just before the first fishing (Jonas 05.10.2026: «Spilleren burde introduseres for "fiskelykke" og haill-appen like før han skal
  // fiske første gangen»): what the luck is, then the Luck app, then where the luck aboard shows
  {id:'luck', ok:true, done:() => false,
    tip:() => ({no:'Fremme på feltet! Før du fisker: fiskelykke. Hvor mye som biter, kommer an på hvor tett fisken står, redskapet, været, årstida og fiskelykka. Fiskerne langs kysten har alltid hatt troen på haill, lykke på havet. Haill gir deg mer fiskelykke en stund.',
      en:'At the grounds! Before you fish: luck. How much bites depends on how dense the fish stand, the gear, the weather, the season and your luck. Fishermen along the coast have always believed in haill, luck at sea. Haill gives you more luck for a while.'})},
  {id:'haill', done:() => !!(S.haill && S.haill.type === 'luksus'),
    tip:() => { const got = S.haillInv && S.haillInv.luksus > 0, t0 = phoneApp('haill', got ? '#phone [data-pa=haillon][data-k=luksus]' : '#phone [data-pa=haillbuy][data-k=luksus]');
      if (got) return {...t0, no:'Haillen ligger i beholdningen. Trykk «Aktiver luksushaill». Haill blir aldri aktivert av seg selv, så du velger når den skal virke.', en:'The luck is in store. Tap «Switch on luxury luck». Luck is never switched on by itself, so you choose when it works.'};
      return {...t0, no:'Båten venter på feltet til du har hentet haillen. Åpne Haill-appen og hent en gratis luksushaill. Den gir +200 % fiskelykke det første døgnet, og så blekner den.', en:'The boat waits on the grounds until you have fetched the luck. Open the Luck app and fetch a free luxury luck. It gives +200% luck for the first day, and then it fades.'}; }},
  {id:'luckhud', ok:true, done:() => false,
    tip:() => { const r = vis('#hud .haill'); return {el:r ? r.closest('.row') || r : vis('#hud'), no:'Her i statusboksen ser du haillen om bord og hvor mye fiskelykke den gir nå. Den blekner trinn for trinn over fire døgn. Ny haill får du i Haill-appen, eller med litt flaks på puben.',
      en:'Here in the status box you see the luck aboard and how much it gives now. It fades stage by stage over four days. New luck comes from the Luck app, or with a bit of fortune at the pub.'}; }},
  {id:'fish', done:() => S.tut.m.jigOn || (S.fsess && S.t - S.fsess.t0 >= 20 && S.t - (S.tut.m.luckhud || 0) >= 20) || (S.tut.m.cast1 && S.boat.status === 'idle' && holdTotal() > 1 && !S.boat.tutWait),
    tip:() => { if (S.boat.status !== 'fishing') return {no:'Båten er på vei ut. Den begynner å fiske når den er fremme.', en:'The boat is on its way out. It starts fishing when it gets there.', small:true};
      if (inPlot()) return {el:vis('#ecClose'), no:'Nå fisker juksa. Trykk «Lukk» for å se fisket i 3D.', en:'The jig is fishing now. Tap «Close» to watch in 3D.'};
      return {el:vis('#dock [data-act=jigg]'), no:'Nå fisker juksa for deg. Trykk «Jukse selv» for å jukse selv: når det napper, trykk «Rykk» mens nåla er midt på. Knappen blir rød når det napper, og midt på gir to fisk på kroken.', en:'The jig fishes for you now. Tap «Jig yourself» to jig yourself: when it bites, tap «Strike» as the needle is in the middle. The button turns red when it bites, and the middle gives two fish on the hooks.'}; }},
  {id:'deck', ok:true, done:() => false,
    tip:() => ({el:vis(['#dockInfo', '#hud']), no:'Fisken blør i bløggekaret idet den kommer over ripa. Så blir den sløyd og iset. Isen holder kvaliteten oppe, og kvaliteten gir prisen.', en:'The fish is bled in the tub as it comes over the rail. Then it is gutted and iced. The ice keeps the quality up, and the quality sets the price.'})},
  {id:'full', done:() => holdTotal() >= capHold() - 1 || (S.boat.status === 'idle' && holdTotal() > 1 && !S.boat.fishUntil && !S.boat.tutWait) || !!S.lastSale,
    tip:() => ({el:vis('#hud'), no:'Lasterommet fylles. Når det er fullt, går du til ' + tutLandN() + ' og leverer.', en:'The hold is filling up. When it is full, you go to ' + tutLandN() + ' and land the catch.', small:true})},
  {id:'route2', live:true, view:() => [S.boat.pos, portById(tutLand()).p], done:() => draftEnds(tutLand()) || planEnds(tutLand()) || (S.boat.status === 'port' && S.boat.port === tutLand()),
    tip:() => { if (!inPlot()) return {el:vis('#miniPlot'), no:tutLand() === 'botnhamn' ? 'Lasten er full! Åpne kartplotteren. Finnsnes har ikke fiskemottak, så fisken skal til Botnhamn.' : 'Lasten er full! Åpne kartplotteren. Fisken skal inn til mottaket i ' + tutLandN() + '.', en:tutLand() === 'botnhamn' ? 'The hold is full! Open the chart plotter. Finnsnes has no fish plant, so the catch goes to Botnhamn.' : 'The hold is full! Open the chart plotter. The catch goes to the plant at ' + tutLandN() + '.'};
      if (LEIA_ARM || LEIA_BUSY) return {map:{p:portById(tutLand()).p, r:0.5}, no:'Trykk på ' + tutLandN() + ' i kartet.', en:'Tap ' + tutLandN() + ' on the chart.'};
      return {el:vis('#rAuto'), no:'Trykk «Autonav», og så på ' + tutLandN() + ' i kartet. Båten finner en trygg vei dit.', en:'Tap «Autonav», then ' + tutLandN() + ' on the chart. The boat finds a safe way there.'}; }},
  {id:'cast2', done:() => (planEnds(tutLand()) && S.boat.status !== 'idle') || (S.boat.status === 'port' && S.boat.port === tutLand()),
    tip:() => { const e = estimate(); if (e.bad >= 0) return {el:vis(['#rUndo', '#panel [data-act=clear]']), no:'Etappe ' + legName(e.bad) + ' krysser land. Trykk angre, og bruk «Autonav».', en:'Leg ' + legName(e.bad) + ' crosses land. Tap undo and use «Autonav».'};
      return {el:vis('#panel .rbar [data-act=start]'), no:'Trykk «Kast loss».', en:'Tap «Cast off».'}; }},
  // on the way in to the plant, a look round the game (Jonas 05.10.2026: «En god anledning til å ta en dypere gjennomgang i tutorialen er
  // jo når brukeren har fisket og er på tur til nærmeste fiskemottak … statusfanen, dekksdagboken, appene, kamera, innstillinger,
  // værsystemer»). Each page is read and «Skjønner» goes on; the boat sails on meanwhile and waits at the quay if it gets there first.
  {id:'tour', ok:true, done:() => false,
    tip:() => ({no:'Båten går selv til ' + tutLandN() + '. Mens den går, viser jeg deg rundt i spillet.', en:'The boat sails to ' + tutLandN() + ' on its own. While it goes, let me show you round the game.'})},
  {id:'hud', ok:true, done:() => false,
    tip:() => inPlot() ? {el:vis('#ecClose'), noOk:true, no:'Trykk «Lukk» for å gå tilbake til 3D først.', en:'Tap «Close» to go back to 3D first.'} :
      {el:vis('#hud'), no:'Statusboksen: klokka og dagen, hva båten gjør, pengene, drivstoffet, lasten og energien din. Trykk «–» for å gjøre den til en tynn stripe, og «+» for å åpne den igjen.', en:'The status box: the clock and the day, what the boat is doing, your money, the fuel, the hold and your energy. Tap «–» to fold it to a thin strip, and «+» to open it again.'}},
  {id:'book', done:() => false,
    tip:() => ({el:vis('#logbook') || (inPlot() ? vis('#ecClose') : null), no:'Dekksdagboka: alt som skjer om bord blir skrevet her, med fangst, salg, sesonger, hendelser og utstyr. Trykk på den og bla litt. Lukk den når du er ferdig.', en:'The deck log: everything that happens aboard is written here, with catches, sales, seasons, events and gear. Tap it and leaf through. Close it when you are done.'})},
  {id:'cam', done:() => typeof G3 === 'undefined' || !!G3.failWhy || G3.isHelm(),
    tip:() => inPlot() ? {el:vis('#ecClose'), no:'Trykk «Lukk» for å gå tilbake til 3D først.', en:'Tap «Close» to go back to 3D first.'} :
      {el:vis('#camBtn'), no:'Kameraet: dra med fingeren for å se deg rundt båten, og knip for å zoome. Trykk kameraknappen for å stå på broa.', en:'The camera: drag a finger to look round the boat, and pinch to zoom. Tap the camera button to stand on the bridge.'}},
  {id:'cam2', done:() => typeof G3 === 'undefined' || !!G3.failWhy || !G3.isHelm(),
    tip:() => ({el:vis('#camBtn'), no:'Nå ser du fra broa, slik skipperen ser det. Trykk kameraknappen igjen for å gå tilbake. Knappen ved siden av gir kinovisning, der kameraet filmer båten av seg selv.', en:'Now you see from the bridge, as the skipper does. Tap the camera button again to go back. The button next to it gives the cinema view, where the camera films the boat on its own.'})},
  {id:'apps', ok:true, done:() => false,
    tip:() => { const t0 = phoneApp('home', '#phone .ph-grid'); if (!(PHONE.isOpen() && PHONE.app === 'home')) return {...t0, noOk:true, no:'Åpne telefonen.', en:'Open the phone.'};
      return {...t0, no:'Telefonen har appene dine: vær, meldinger, Kystposten, rederiet, Salgslaget, kvoten, reglene, haillen og flere. Øverst står neste mål.', en:'The phone has your apps: weather, messages, the Coast Post, the company, the sales organisation, the quota, the rules, the luck and more. The next goal is at the top.'}; }},
  {id:'vaer', ok:true, done:() => false,
    tip:() => { const t0 = phoneApp('vaer', '#phone .ph-c .ph-card'); if (!(PHONE.isOpen() && PHONE.app === 'vaer')) return {...t0, noOk:true, no:'Åpne Vær-appen.', en:'Open the Weather app.'};
      return {...t0, no:'Været: vind, bølger, dønning, sikt og tidevann der du er, og varselet for de neste 48 timene med fargene for hva båten din tåler. Bølgene blir høyere der vinden har lang vei over åpent hav. Sjekk varselet før du går ut.', en:'The weather: wind, waves, swell, visibility and the tide where you are, and the forecast for the next 48 hours, coloured for what your boat can take. The waves grow where the wind has a long way over open sea. Check the forecast before you go out.'}; }},
  {id:'innst', ok:true, done:() => false,
    tip:() => { const t0 = phoneApp('innst', '#phone .ph-c .ph-card'); if (!(PHONE.isOpen() && PHONE.app === 'innst')) return {...t0, noOk:true, no:'Åpne Innstillinger.', en:'Open Settings.'};
      return {...t0, no:'Innstillingene: språk, grafikken i 3D (Auto går ned når bildet hakker), lyd og musikk, statusboksene, hjemsted og kontoen din. Det du endrer, lagres med en gang.', en:'Settings: language, the 3D graphics (Auto steps down when the picture stutters), sound and music, the status boxes, your home port and your account. What you change is kept at once.'}; }},
  {id:'land', done:() => !!S.boat.land || !!(S.lastSale && S.lastSale.port === tutLand()),
    tip:() => { if (!(S.boat.status === 'port' && S.boat.port === tutLand())) return {el:vis('#hud .st.nx'), no:'Båten er på vei til ' + tutLandN() + '.', en:'The boat is on its way to ' + tutLandN() + '.', small:true};
      if (inPlot()) return {el:vis('#ecClose'), no:'Fremme! Trykk «Lukk» og lever i 3D.', en:'Arrived! Tap «Close» and land the catch in 3D.'};
      return {...dockApp('marked', 'lever', 'lever', '#drawerBody [data-act=sell]'), no:'Fremme i ' + tutLandN() + '. Trykk Marked, så Lever, og «Lever» for å levere fisken.', en:'Arrived at ' + tutLandN() + '. Tap Market, then Land, and «Land» to land the catch.'}; }},
  // done of itself when there is no landing note here to show (the boat has left the plant), so the guide can never hang on it
  {id:'slip', ok:true, done:() => !S.boat.land && !(S.lastSale && S.lastSale.port === S.boat.port),
    tip:() => { if (S.boat.land) return {el:vis('#hud .st.nx'), no:'Kranen løfter fisken på land. Sluttseddelen kommer når lossingen er ferdig.', en:'The crane lifts the catch ashore. The landing note comes when the landing is done.', small:true, noOk:true};
      if (DOCK.page !== 'lever' || !vis('#drawerBody .slipt')) return {okText:['Vis sluttseddelen', 'Show the landing note'], okAct:() => { DOCK.open('lever'); setTimeout(() => { tutScrollSlip(); if (!vis('#drawerBody .slipt')) tutMark('slip'); }, 350); }, no:'Fisken er levert. Sluttseddelen viser hva du fikk betalt.', en:'The catch is landed. The landing note shows what you were paid.'};
      return {el:vis('#drawerBody .slipt'), no:'Her er prisen per kilo for hver størrelse og kvalitet, og innloggingsbonusen din. Hver dag du åpner spillet, gir 1 % mer på fisken.', en:'Here is the price per kilo for each size and grade, and your login bonus. Each day you open the game adds 1 % on the fish.'}; }},
  {id:'goal', ok:true, done:() => false,
    tip:() => { if (!(PHONE.isOpen() && PHONE.app === 'home')) return {okText:['Vis neste mål', 'Show the next goal'], okAct:() => PHONE.open('home'), no:'Godt levert! Nå kan du spare til neste steg.', en:'Well landed! Now you can save up for the next step.'};
      return {el:vis('#phone .ph-goal'), okText:['Ferdig', 'Done'], no:'Neste mål er en juksamaskin. Den fisker like mye som to håndjukser. Målene står her og øverst i Båthandel under Verft. God tur!', en:'The next goal is a jigging machine. It fishes as much as two hand jigs. The goals are here and at the top of the boat market in the yard. Good fishing!'}; }}
];
// adrift (Jonas 05.10.2026: «Båten stoppet midt i ruta og nå kommer jeg ingen vei fordi jeg er låst i tutorialen og kan ikke lage ny rute
// til botnhamn»): «Stopp» stops the route as well, and the guide waited for a boat that would never come. Lying still at sea without a
// route on the way out to the grounds ('out') or in to the plant ('in'), the guide leads to a new route there and «Kast loss», whatever
// step it is on, and lets the chart and the cast-off through.
function tutAdrift(){
  if (!tutOn()) return null; const b = S.boat, m = S.tut.m;
  if (b.status !== 'idle' || S.plan || b.tutWait || b.land) return null;
  if (m.cast2 && !m.land) return 'in';
  if (m.cast1 && !m.luck && !m.haill && !m.fish && holdTotal() <= 1) return 'out';
  return null;
}
const tutDriftReady = d => d === 'in' ? draftEnds(tutLand()) : tutFieldFish() >= 2 && tutFieldWp(S.draft) >= 0;
function tutDriftTip(d){
  const into = d === 'in', where = into ? {no:'til ' + tutLandN(), en:'to ' + tutLandN()} : {no:'ut til feltet ' + tutAt().no, en:'out to the grounds ' + tutAt().en};
  if (!inPlot()) return {el:vis('#miniPlot'), noOk:true, no:'Båten ligger stille. Åpne kartplotteren og lag ruta ' + where.no + ' på nytt.', en:'The boat lies still. Open the chart plotter and make the route ' + where.en + ' again.'};
  if (tutDriftReady(d)){ const e = estimate();
    if (e.bad >= 0) return {el:vis(['#rUndo', '#panel [data-act=clear]']), noOk:true, no:'Etappe ' + legName(e.bad) + ' krysser land. Trykk angre, og bruk «Autonav».', en:'Leg ' + legName(e.bad) + ' crosses land. Tap undo and use «Autonav».'};
    return {el:vis('#panel .rbar [data-act=start]'), noOk:true, no:'Trykk «Kast loss».', en:'Tap «Cast off».'}; }
  if (!into){ const k = tutFieldWp(S.draft);
    if (k >= 0){ if (window.innerWidth <= 700) document.body.classList.add('drawer'); return {el:vis('#panel .wpc[data-i="' + k + '"] [data-act=fp]'), scroll:true, noOk:true, no:'Gi punktet minst 2 timer fisketid med +.', en:'Give the point at least 2 hours of fishing time with +.'}; } }
  const g = into ? {p:portById(tutLand()).p, r:0.5} : {p:tutField().p, r:tutField().r};
  if (LEIA_ARM || LEIA_BUSY) return {map:g, noOk:true, no:into ? 'Trykk på ' + tutLandN() + ' i kartet.' : 'Trykk i kartet innenfor ringen ' + tutAt().no + '.', en:into ? 'Tap ' + tutLandN() + ' on the chart.' : 'Tap the chart inside the ring ' + tutAt().en + '.'};
  return {el:vis('#rAuto'), noOk:true, no:'Trykk «Autonav», og så på ' + (into ? tutLandN() : 'ringen ' + tutAt().no) + ' i kartet. Båten finner en trygg vei.', en:'Tap «Autonav», then ' + (into ? tutLandN() : 'the ring ' + tutAt().en) + ' on the chart. The boat finds a safe way.'};
}
let tutCur = null;
// a small tip only tells what is going on (the boat is on its way, the hold is filling): it goes after nine seconds, or at a tap on it,
// and comes back when the text changes (a player 05.10.2026: «Den teksten der går ikke bort, den e litt irriterende»)
const TUTSM = {txt:'', t0:0, hid:false};
// the step's tip; when it points at something outside the phone while the phone is open, close the phone first
function tutTip(st){
  const drift = tutAdrift(), T0 = drift ? tutDriftTip(drift) : st.tip() || {};
  if (PHONE.isOpen() && ((T0.el && !T0.el.closest('#phone')) || T0.map)) return {el:vis('#phone .ph-nav [data-pa=close]'), no:'Lukk telefonen først.', en:'Close the phone first.'};
  return T0;
}
// where the guide points: the hole in the dimmed layer and the ring, round a button or round a place on the chart
// scroll a button into view, and clear of the sticky bar at the foot of its list (the route's «Tøm»/«Kast loss», .btns.rbar), which
// would otherwise lie over it and take the tap
function tutReveal(el){
  el.scrollIntoView({block:'nearest'});
  const bar = !el.closest('.rbar') && [...document.querySelectorAll('.btns.rbar')].find(b => b.offsetParent && b.parentElement.contains(el)); if (!bar) return;
  const over = el.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 8; if (over <= 0) return;
  for (let p = el.parentElement; p; p = p.parentElement) if (p.scrollHeight > p.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(p).overflowY)){ p.scrollTop += over; return; }
}
function tutRect(T0){
  if (T0.el){ if (T0.scroll) tutReveal(T0.el); const q = T0.el.getBoundingClientRect(); return {R:{x:q.left - 6, y:q.top - 6, w:q.width + 12, h:q.height + 12}, round:false}; }
  if (T0.map && inPlot()){ const c = mapToClient(T0.map.p), rp = Math.max(28, T0.map.r * view.px); return {R:{x:c.x - rp, y:c.y - rp, w:rp * 2, h:rp * 2}, round:true}; }
  return {R:null, round:false};
}
function tutStep(){
  if (!tutOn()) return null;
  // a step done for good settles the live ones before it (a route is only a draft until the boat casts off)
  for (let i = 0; i < TSTEPS.length; i++){ const st = TSTEPS[i]; if (S.tut.m[st.id]) continue; if (TSTEPS.slice(i + 1).some(q => S.tut.m[q.id])){ S.tut.m[st.id] = S.tut.m[st.id] || S.t || 1; continue; } if (st.done()){ if (!st.live){ for (const q of TSTEPS){ if (q === st) break; if (!S.tut.m[q.id]) S.tut.m[q.id] = S.t || 1; } tutMark(st.id); } continue; } return st; }
  return null;
}
function tutFinish(){ S.tut = 0; log('Første tur er fullført. Nå er du din egen skipper.', 'The first trip is done. Now you are your own skipper.'); save(); tutUpdate(); if (typeof refreshAll === 'function') refreshAll(); if (typeof pushAsk === 'function') setTimeout(pushAsk, 3000); }
function tutScrollSlip(){ const v = $('drawerBody'), t = v && v.querySelector('.slipt'); if (t) v.scrollTop = Math.max(0, t.offsetTop - 60); }
// what the guide lets the player do on each step; the rest waits until the first trip is done
const TUT_ALLOW = {start:['cast1', 'cast2'], waypoint:['route1', 'fish2', 'route2'], sell:['land']};
function tutAllow(what){
  if (!tutOn()) return true;
  const st = tutStep(), id = st ? st.id : '', L = (no, en) => S.lang === 'no' ? no : en;
  const drift = tutAdrift();
  if (drift && (what === 'waypoint' || what === 'start')){
    if (what === 'start' && !tutDriftReady(drift)){ toast(drift === 'in' ? L('Ruta skal ende i ' + tutLandN() + '.', 'The route should end at ' + tutLandN() + '.') : L('Ruta må ha et punkt i ringen ' + tutAt().no + ' med minst 2 timer fisketid.', 'The route needs a point in the ring ' + tutAt().en + ' with at least 2 hours of fishing.')); return false; }
    return true;
  }
  if (!TUT_ALLOW[what]) return false;
  if (TUT_ALLOW[what].includes(id)){
    if (what === 'start' && id === 'cast1' && !(tutFieldFish() >= 2 && tutFieldWp(S.draft) >= 0)){ toast(L('Ruta må ha et punkt i ringen ' + tutAt().no + ' med minst 2 timer fisketid.', 'The route needs a point in the ring ' + tutAt().en + ' with at least 2 hours of fishing.')); return false; }
    if (what === 'start' && id === 'cast2' && !draftEnds(tutLand())){ toast(L('Ruta skal ende i ' + tutLandN() + '.', 'The route should end at ' + tutLandN() + '.')); return false; }
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
  if (tutOn() && BOOK.isOpen()){ const st = tutStep(); if (st && st.id === 'book') tutMark('book'); }
  if (!tutOn() || !$('modal').hidden || BOOK.isOpen()){ hide(); return; }
  const st = tutStep(); if (!st){ tutFinish(); return; }
  tutView(st);
  if (window.jigActive) tutMark('jigOn');
  const T0 = tutTip(st), txt = S.lang === 'no' ? T0.no : T0.en; tutCur = {st, T0};
  if (JIG_OPEN()){ hide(); return; }   // the jig game has its own controls on screen
  if (T0.small){ if (TUTSM.txt !== txt){ TUTSM.txt = txt; TUTSM.t0 = Date.now(); TUTSM.hid = false; } if (TUTSM.hid || Date.now() - TUTSM.t0 > 9000){ hide(); return; } }
  if ($('tipText').textContent !== txt) $('tipText').textContent = txt || '';
  const ok = (st.ok && !T0.noOk) || T0.okAct; $('tipOk').hidden = !ok;
  $('tipOk').textContent = T0.okText ? (S.lang === 'no' ? T0.okText[0] : T0.okText[1]) : (S.lang === 'no' ? 'Skjønner' : 'Got it');
  $('tipSkip').hidden = true;   // no skipping: every step is done (Jonas 05.10.2026)
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
const JIG_OPEN = () => !!window.jigActive && !$('jigUI').hidden;
$('tip').addEventListener('click', e => { if (!e.target.closest('#tipOk') && tutCur && tutCur.T0.small){ TUTSM.hid = true; tutUpdate(); } });
$('tipOk').onclick = () => { if (!tutCur) return; const {st, T0} = tutCur; if (T0.okAct){ T0.okAct(); tutUpdate(); return; } if (st.id === 'goal'){ tutMark('goal'); tutFinish(); return; } tutMark(st.id); tutUpdate(); };

