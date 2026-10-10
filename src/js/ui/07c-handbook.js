// ===== Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026) =====
// A drip is one tip, shown the first time something happens after the first trip: the guide's own box, pointing at the button when
// there is one, with «Skjønner» and «Jeg kan dette» (which puts the rest of its chapter to rest). Nothing stops the game, one drip
// at a time and at least a minute and a half between them, never in the first trip, in a window, in the book, in the jig game or in
// a room. What was skipped or never came stays in the Håndboka app with a dot, and «Vis meg» shows it again, pointing. A game that
// has landed five times when the book arrives has every chapter at rest from the start (the app has them all; nothing drips over an
// old hand). S.hb = {seen:{id:t}, skip:{ch:1}, cur, at}. Each drip sends hb {id, how} to the cloud (seen or skip), for the funnel.
const HB_CH = [[2, 'Tur 2 og 3', 'Trips 2 and 3'], [3, 'Kvelden og natta', 'The evening and the night'], [4, 'Rutinen', 'The routine'], [5, 'Utstyr og båt', 'Gear and boat'], [6, 'Sosialt og økonomi', 'Social and money']];
const HB_GAP = 90000;   // real ms between two drips
function hbState(){
  if (!S.hb){ S.hb = {seen:{}, skip:{}, cur:null, at:0}; if ((S.landN || 0) >= 5) for (const [c] of HB_CH) S.hb.skip[c] = 1; }
  return S.hb;
}
const hbL = (no, en) => S.lang === 'no' ? no : en;
const hbPort = () => S.boat.status === 'port';
const hbSea = () => ['sailing', 'fishing', 'idle'].includes(S.boat.status);
const hbLand = () => S.landN || 0;
const hbTry = f => { try { return !!f(); } catch (e){ return false; } };
// at a place that offers this (core/06c-steder.js portServices): 'mottak', 'butikk', 'verft'; Father's naust is a home
const hbSvc = k => hbTry(() => hbPort() && berthKind(S.boat) !== 'naust' && portServices(portById(S.boat.port), berthKind(S.boat))[k]);
const hbDock = ids => inPlot() ? to3d() : {el:vis([].concat(ids).map(k => '#dock [data-dk=' + k + ']'))};
// the tips: id, chapter, a short name, the text, when it drips (first time true), and where it points while shown
const HB = [
  // 2: trips 2 and 3, the same day
  {id:'rute', ch:2, t:['Egen rute', 'Your own route'], when:() => inPlot() && hbPort() && !S.plan && hbLand() >= 1,
    no:'Tur 2 er din egen. Trykk i kartet der du vil fiske, så legger rutepunktene seg etter hverandre, og kurslista under viser kurs, distanse og tid for hver etappe. Autonav finner leia for deg om du vil.',
    en:'Trip 2 is your own. Tap the chart where you want to fish and the waypoints line up, and the course list below shows course, distance and time for each leg. Autonav finds the fairway for you if you like.'},
  {id:'guide', ch:2, t:['Fiskeguiden', 'The fish guide'], when:() => hbLand() >= 1 && (hbSea() || hbPort()), show:() => phoneApp('guide'),
    no:'Fiskeguiden viser hvor hver art står, på hvilket dyp og når på året. Se i den før du velger felt.', en:'The fish guide shows where each species stands, at what depth and when in the year. Look there before you choose a ground.'},
  {id:'ekko', ch:2, t:['Ekkoloddet', 'The echo sounder'], when:() => inPlot() && hbSea(), show:() => ({el:vis('#heatBox [data-hm]')}),
    no:'Ekkoloddet viser fisken under båten. Trykk på arten for å bytte hva det leter etter.', en:'The echo sounder shows the fish under the boat. Tap the species to change what it looks for.'},
  {id:'tide', ch:2, t:['Flo og fjære', 'The tide'], when:() => inPlot() && hbLand() >= 1, show:() => ({el:vis('#ecTide')}),
    no:'Flo og fjære står her, for stedet båten er. Grunne sund og fjæra ved kaia følger tidevannet.', en:'The tide stands here, for where the boat is. Shallow sounds and the shore by the quay follow it.'},
  {id:'regler', ch:2, t:['Kan jeg fiske her?', 'May I fish here?'], when:() => hbSea() && hbLand() >= 2, show:() => phoneApp('regler'),
    no:'«Kan jeg fiske her?» i Regler-appen svarer for stedet båten er: fjordlinjer, stengte felt og minstemål, med kilden.', en:'«May I fish here?» in the Rules app answers for where the boat is: fjord lines, closed areas and minimum sizes, with the source.'},
  {id:'sesong', ch:2, t:['Sesongen', 'The season'], when:() => hbLand() >= 2, show:() => phoneApp('sesong'),
    no:'Sesong-appen forteller hva som skjer på kysten nå, og når skreien kommer.', en:'The Season app tells what is happening on the coast now, and when the skrei comes.'},
  {id:'post', ch:2, t:['Kystposten', 'The Coast Post'], when:() => hbLand() >= 1 && hbTry(() => pressUnread() > 0), show:() => phoneApp('post'),
    no:'Kystposten kommer med saker fra hele kysten: rekordpriser, de største landingene og årets første skrei.', en:'The Coast Post brings stories from the whole coast: record prices, the biggest landings and the first skrei of the year.'},
  {id:'meld', ch:2, t:['Meldinger', 'Messages'], when:() => hbLand() >= 1 && S.msgs.length > 0, show:() => phoneApp('meld'),
    no:'Meldinger fra mottaket, Salgslaget og folk langs kysten havner her.', en:'Messages from the plant, the sales organisation and people along the coast land here.'},
  // 3: the evening and the night
  {id:'energi', ch:3, t:['Hvile', 'Rest'], when:() => typeof S.energy === 'number' && S.energy < 45 && hbPort(), show:() => hbDock('rest'),
    no:'Du er trøtt. Sov i naustet eller rorbua, så er du uthvilt til morgenturen. En trøtt skipper jobber saktere og døser på vakt.', en:'You are tired. Sleep in the boathouse or the rorbu and you are rested for the morning trip. A tired skipper works slower and dozes on watch.'},
  {id:'kulde', ch:3, t:['Kulda', 'The cold'], when:() => hbSea() && hbTry(() => airTemp(S.t / 60, S.boat.pos) < 0),
    no:'Under null fryser fingrene: sløying og egning går saktere, og kulda står i statusboksen. Klær fra utstyrsbutikken hjelper.', en:'Below zero the fingers freeze: gutting and baiting go slower, and the cold stands in the status box. Clothing from the tackle shop helps.'},
  {id:'diesel', ch:3, t:['Diesel', 'Diesel'], when:() => S.boat.fuel < 0.3 * ((typeof BOAT !== 'undefined' && (BOAT.fuel || BOAT.tank)) || 60),
    no:'Tanken er under en tredel. Diesel fylles på bunkerskaia ved mottak og verft, under Bunkers i menyen. Tom tank, og båten driver.', en:'The tank is under a third. Diesel is filled at the bunker quay at plants and yards, under Bunkers in the menu. An empty tank, and the boat drifts.'},
  {id:'rorbu', ch:3, t:['Rorbua', 'The rorbu'], when:() => hbPort() && hbTry(() => portById(S.boat.port).rorbu && dist(S.boat.pos, portById(S.home || HOME0).p) > 30), show:() => hbDock('rest'),
    no:'Langt hjemmefra kan du leie rorbu for natta: hvil der, så ligger båten trygt ved kaia til i morgen.', en:'Far from home you can rent a rorbu for the night: rest there, and the boat lies safe at the quay until morning.'},
  // 4: the routine, after the third landing
  {id:'drift', ch:4, t:['Driftsplanen', 'The operations plan'], when:() => hbLand() >= 3 && S.crew.length > 0, show:() => phoneApp('drift'),
    no:'Driftsplanen lar mannskapet ta morgenturen mens du sover: velg felt og redskap, så går båten av seg selv.', en:'The operations plan lets the crew take the morning trip while you sleep: choose the ground and the gear, and the boat goes by itself.'},
  {id:'topp', ch:4, t:['Salgslaget og topplista', 'Sales and the top list'], when:() => hbLand() >= 3, show:() => phoneApp('salg'),
    no:'Salgslaget viser prisene i dag, det du har levert, og topplista over kysten denne uka.', en:'The sales organisation shows today’s prices, what you have landed, and the week’s top list along the coast.'},
  {id:'merker', ch:4, t:['Milepæler', 'Milestones'], when:() => hbLand() >= 3, show:() => phoneApp('merker'),
    no:'Milepæler samler alt du har oppnådd, og hvert merke gir en gave fra noen på kysten.', en:'Milestones gather everything you have achieved, and each badge gives a gift from someone on the coast.'},
  {id:'tilbake', ch:4, t:['Si fra', 'Speak up'], when:() => hbLand() >= 3, show:() => phoneApp('tilbake'),
    no:'Noe rart? Si fra i Tilbakemelding, det er lov å være ærlig. Nyttige meldinger takkes med en haill.', en:'Something odd? Say so in Feedback; honesty is welcome. Useful reports are thanked with a luck.'},
  {id:'patch', ch:4, t:['Patchnotes', 'Patch notes'], when:() => hbLand() >= 4, show:() => phoneApp('patch'),
    no:'Patchnotes forteller hva som er nytt i spillet. Prikken på appen betyr at noe er kommet.', en:'Patch notes tell what is new in the game. The dot on the app means something has arrived.'},
  // 5: gear and boat, the first week
  {id:'oppdrag', ch:5, t:['Oppdrag', 'Orders'], when:() => hbLand() >= 4 && hbTry(() => ordState().offers.length > 0), show:() => phoneApp('ordl'),
    no:'Oppdragstavla: turer med god betaling ut fra der du er. Lang tur, god lønn. Med trim går båten fortere, så turen tar kortere tid.', en:'The order board: well-paid trips from where you are. Long trip, good pay. With tuning the boat goes faster, so the trip takes less time.'},
  {id:'butikk', ch:5, t:['Utstyrsbutikken', 'The tackle shop'], when:() => hbSvc('butikk'), show:() => hbDock(['butikk', 'fiskeutstyr']),
    no:'Utstyrsbutikken: line, garn og teiner trenger hver sin haler, og kroker, blåser og agn hører til redskapet. Det som ikke passer båten, kan du ikke kjøpe.', en:'The tackle shop: lines, nets and pots each need their hauler, and hooks, floats and bait belong to the gear. What does not fit the boat cannot be bought.'},
  {id:'verft', ch:5, t:['Verftet', 'The yard'], when:() => hbSvc('verft'), show:() => hbDock(['vedlikehold', 'oppgr', 'batmarked']),
    no:'Verftet: vedlikehold, begroing på skroget, maling og større båter. Jobbene tar ekte tid, og båten ligger der imens.', en:'The yard: maintenance, fouling on the hull, paint and bigger boats. The jobs take real time, and the boat lies there meanwhile.'},
  {id:'neste', ch:5, t:['Neste båt', 'The next boat'], when:() => S.cash >= 150000, show:() => phoneApp('fartoy'),
    no:'Neste båt: Båthandelen på verftet viser hva du har råd til, og hva som følger med av lasterom, køyer og mannskap.', en:'The next boat: the boat dealer at the yard shows what you can afford, and what comes with it in hold, bunks and crew.'},
  // 6: social and money
  {id:'venner', ch:6, t:['Venner', 'Friends'], when:() => hbLand() >= 3 && typeof isGuest === 'function' && !isGuest(), show:() => phoneApp('folk'),
    no:'Venner: del fiskeposisjoner og fangstmerker, og se hvor de er på kysten.', en:'Friends: share fishing positions and catch marks, and see where they are on the coast.'},
  {id:'ais', ch:6, t:['Andre båter', 'Other boats'], when:() => hbLand() >= 4 && hbSea(),
    no:'Båtene rundt deg i kartplotteren er ekte spillere og kystflåten. Trykk på en for å se hvem det er.', en:'The boats around you in the chart plotter are real players and the coastal fleet. Tap one to see who it is.'},
  {id:'pub', ch:6, t:['Puben', 'The pub'], when:() => hbPort() && !!document.querySelector('#dock [data-dk=pub]'), show:() => hbDock('pub'),
    no:'På puben treffer du folk, kjentmannen selger rapporten sin, og du kan spandere en runde på mannskapet.', en:'At the pub you meet people, the old hand sells his report, and you can stand the crew a round.'},
  {id:'rederi', ch:6, t:['Rederiet', 'The company'], when:() => S.cash >= 50000 && hbLand() >= 4, show:() => phoneApp('rederi'),
    no:'Rederi-appen: papirene, økonomien, skatt og lån. Over 50 000 kr i omsetning blir du enkeltpersonforetak med MVA.', en:'The Company app: the papers, the money, tax and loans. Past NOK 50,000 in turnover you become a sole proprietorship with VAT.'},
  {id:'kvote', ch:6, t:['Kvoten', 'The quota'], when:() => hbLand() >= 4, show:() => phoneApp('kvote'),
    no:'Kvote: åpen gruppe har sin egen torskekvote per fartøy, og ferskfiskordningen gir tillegg om høsten.', en:'Quota: the open group has its own cod quota per vessel, and the fresh-fish scheme gives a bonus in the autumn.'}];
const hbById = id => HB.find(t => t.id === id);
// the drip to show now: the one under way, else the first whose moment has come
function hbPick(){
  const H = hbState();
  if (H.cur){ const t = hbById(H.cur); if (t && (!H.seen[t.id] || H.force)) return t; H.cur = null; H.force = 0; }
  if (Date.now() - (H.at || 0) < HB_GAP) return null;
  const t = HB.find(x => !H.seen[x.id] && !H.skip[x.ch] && hbTry(x.when)); if (!t) return null;
  H.cur = t.id; H.at = Date.now(); return t;
}
function hbEv(id, how){ if (typeof cloudEv === 'function') cloudEv('hb', {id, how}); }
function hbDone(id){ const H = hbState(); if (!H.seen[id]) hbEv(id, 'seen'); H.seen[id] = S.t || 1; H.cur = null; H.force = 0; H.at = Date.now(); save(); }
function hbSkip(ch, id){ const H = hbState(); H.skip[ch] = 1; if (id){ H.seen[id] = S.t || 1; hbEv(id, 'skip'); } H.cur = null; H.force = 0; H.at = Date.now(); save(); }
// the tips whose moment has come and that have not been seen: the dot on the app
function hbReady(){ const H = hbState(); return HB.filter(x => !H.seen[x.id] && !H.skip[x.ch] && hbTry(x.when)).length; }
// the drip's box, drawn by the guide's code (tipPlace in 07b-first-trip.js); true when something is shown
function hbUpdate(){
  if (typeof NAUST3D !== 'undefined' && NAUST3D.isOpen()) return false;
  if (typeof PUB3D !== 'undefined' && PUB3D.isOpen && PUB3D.isOpen()) return false;
  const t = hbPick(); if (!t) return false;
  let T0 = {}; if (t.show){ try { T0 = t.show() || {}; } catch (e){ T0 = {}; } }
  if (PHONE.isOpen() && T0.el && !T0.el.closest('#phone')) T0 = {el:vis('#phone .ph-nav [data-pa=close]'), no:'Lukk telefonen først.', en:'Close the phone first.'};
  const txt = T0.no ? hbL(T0.no, T0.en) : hbL(t.no, t.en);
  T0 = Object.assign({}, T0, {nodim:true, okAct:() => hbDone(t.id), alt:[hbL('Jeg kan dette', 'I know this'), 'I know this'], altAct:() => hbSkip(t.ch, t.id)});
  tutCur = {st:{id:'hb:' + t.id, ok:true}, T0};
  tipPlace(txt, T0, {ok:!T0.no});   // an instruction on the way (close the phone first) has no «Skjønner»
  return true;
}
// the app: every tip by chapter, a dot by what is not seen, «Vis meg» (points again), and the chapter's drips on or off
const HBUI = (() => {
  let q = '';
  const esc = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  function list(){
    const H = hbState(), f = q.trim().toLowerCase(), h = [];
    for (const [c, no, en] of HB_CH){
      const tips = HB.filter(t => t.ch === c && (!f || (hbL(t.t[0], t.t[1]) + ' ' + hbL(t.no, t.en)).toLowerCase().includes(f))); if (!tips.length) continue;
      const n = HB.filter(t => t.ch === c && H.seen[t.id]).length, all = HB.filter(t => t.ch === c).length;
      h.push('<div class="hb-ch"><b>' + esc(hbL(no, en)) + ' <small>' + n + ' / ' + all + '</small></b><button class="ph-btn sm" data-pa="hbskip" data-ch="' + c + '">' + (H.skip[c] ? esc(hbL('Vis tipsene', 'Show the tips')) : esc(hbL('Jeg kan dette', 'I know this'))) + '</button></div>');
      for (const t of tips) h.push('<div class="ph-card hb-t' + (H.seen[t.id] ? ' seen' : '') + '"><h4>' + (H.seen[t.id] ? '' : '<span class="hb-dot"></span>') + esc(hbL(t.t[0], t.t[1])) + '</h4><p>' + esc(hbL(t.no, t.en)) + '</p>' +
        (t.show ? '<button class="ph-btn" data-pa="hbshow" data-id="' + t.id + '">' + esc(hbL('Vis meg', 'Show me')) + '</button>' : '') + '</div>');
    }
    return h.join('') || '<p class="ph-note">' + esc(hbL('Ingen tips passer søket.', 'No tip matches the search.')) + '</p>';
  }
  function page(){
    const H = hbState(), n = Object.keys(H.seen).length;
    return '<div class="ph-c"><p class="ph-note">' + esc(hbL('Alt veiledningen har å si etter første tur, kapittel for kapittel. Tipsene kommer av seg selv første gang noe skjer; her kan du lese dem igjen og la dem peke.', 'Everything the guide has to say after the first trip, chapter by chapter. The tips come by themselves the first time something happens; here you can read them again and let them point.')) + ' ' + n + ' / ' + HB.length + '</p>' +
      '<input id="hbQ" type="search" placeholder="' + esc(hbL('Søk i Håndboka', 'Search the handbook')) + '" value="' + esc(q) + '" autocomplete="off"><div class="hb-list">' + list() + '</div></div>';
  }
  // «Vis meg»: close the phone and let the tip point until «Skjønner»
  function show(id){ const H = hbState(); if (!hbById(id)) return; H.cur = id; H.force = 1; H.at = 0; PHONE.show(false); tutUpdate(); }
  function toggle(ch){ const H = hbState(); if (H.skip[ch]) delete H.skip[ch]; else H.skip[ch] = 1; H.at = Date.now(); save(); }
  return {page, list, show, toggle, set q(v){ q = v || ''; }, get q(){ return q; }};
})();
