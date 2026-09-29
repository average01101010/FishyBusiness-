// ===== sailors' tattoos: rewards that come by themselves =====
// Each has its old meaning (sources: the US Navy's history pages on sailors' tattoos, One Ocean Expedition on the swallow, The
// Bermudian on vintage sailor tattoos). They count only what you do yourself, aboard. Four need waters beyond Senja and stay locked
// until the game reaches them. Earned tattoos are kept in S.tattoos (id: game minute); the counters are in S.tat. The drawings are in
// ui/05-tattoo-art.js.
const TATS = [
  {id:'svale1', n:['Svale', 'Swallow'], m:['Én svale for hver 5000 nautiske mil til sjøs. Svalen finner alltid veien hjem.', 'One swallow for every 5,000 nautical miles at sea. The swallow always finds its way home.'], r:['5000 nautiske mil med deg om bord', '5,000 nautical miles with you aboard'], p:c => [c.nm, 5000]},
  {id:'svale2', n:['Svale nummer to', 'Second swallow'], m:['Den andre svalen: 10 000 nautiske mil.', 'The second swallow: 10,000 nautical miles.'], r:['10 000 nautiske mil med deg om bord', '10,000 nautical miles with you aboard'], p:c => [c.nm, 10000]},
  {id:'stjerne', n:['Nautisk stjerne', 'Nautical star'], m:['Stjernen som alltid viser veien hjem.', 'The star that always shows the way home.'], r:['100 turer hjem uten grunnstøting eller slep', '100 trips home without running aground or a tow'], p:c => [c.safe, 100]},
  {id:'tau', n:['Tau rundt håndleddet', 'Rope round the wrist'], m:['Merket til den som har jobbet som dekkshand.', 'The mark of one who has worked as a deckhand.'], r:['100 timer eget arbeid på dekk: sløying, ising og fiske for hånd', '100 hours of your own work on deck: gutting, icing and fishing by hand'], p:c => [Math.floor(c.deck / 60), 100]},
  {id:'ankere', n:['Kryssede ankere', 'Crossed anchors'], m:['Mellom tommel og pekefinger: rangen som båtsmann.', 'Between thumb and forefinger: the rank of boatswain.'], r:['50 turer som skipper med fullt mannskap', '50 trips as skipper with a full crew'], p:c => [c.full, 50]},
  {id:'harpun', n:['Harpun', 'Harpoon'], m:['For hvalfangst, eller for å høre til en fiskeriflåte.', 'For whaling, or for belonging to a fishing fleet.'], r:['Et rederi med tre båter', 'A company with three vessels'], p:c => [c.fleet, 3]},
  {id:'grishane', n:['Gris og hane', 'Pig and rooster'], m:['På fotbladene, mot drukning. Grisen og hanen sto i trekasser om bord, og kassene fløt når skuta gikk ned.', 'On the feet, against drowning. The pig and the rooster travelled in wooden crates, and the crates floated when the ship went down.'], r:['Reddet etter grunnstøting, motorstopp eller drift', 'Rescued after running aground, an engine failure or drifting'], p:c => [c.rescued, 1]},
  {id:'rose', n:['Kniv gjennom rose', 'Dagger through a rose'], m:['For lojalitet.', 'For loyalty.'], r:['Samme mann om bord i ett år, eller 50 leveranser til samme mottak', 'The same hand aboard for a year, or 50 landings at the same plant'], p:c => [Math.max(Math.floor(c.tenure / 365 * 50), c.plant), 50]},
  {id:'anker', lock:true, n:['Anker', 'Anchor'], m:['For å ha krysset Atlanterhavet.', 'For having crossed the Atlantic.'], r:['Krever farvann utenfor Senja', 'Needs waters beyond Senja']},
  {id:'skilpadde', lock:true, n:['Skilpadde', 'Turtle'], m:['For å ha krysset ekvator.', 'For having crossed the equator.'], r:['Krever farvann utenfor Senja', 'Needs waters beyond Senja']},
  {id:'hula', lock:true, n:['Hulajente', 'Hula girl'], m:['For å ha vært på Hawaii.', 'For having been to Hawaii.'], r:['Krever farvann utenfor Senja', 'Needs waters beyond Senja']},
  {id:'neptun', lock:true, n:['Kong Neptun', 'King Neptune'], m:['For linjedåpen, når man krysser ekvator.', 'For the line-crossing ceremony at the equator.'], r:['Krever farvann utenfor Senja', 'Needs waters beyond Senja']}
];
function tatCounts(){
  const c = S.tat || {}, H = S.t / 60;
  // loyalty: the longest-serving hand in the fleet (days), and the most landings at one plant
  let tenure = 0; for (const v of S.fleet || []) for (const m of (vget(v, 'crew') || [])) tenure = Math.max(tenure, (S.t - (m.hiredT || S.t)) / 1440);
  const plant = Math.max(0, ...Object.values(c.plant || {}));
  return {nm:c.nm || 0, safe:c.safe || 0, deck:S.deckMe || 0, full:c.full || 0, fleet:(S.fleet || []).length, rescued:c.rescued || 0, tenure, plant};
}
// the counters, kept as things happen
function tatAdd(k, n){ S.tat = S.tat || {}; S.tat[k] = (S.tat[k] || 0) + n; }
function tatTripStart(){ const b = S.boat; b.tripMe = !!S.tripOwner; b.tripBad = false; }
function tatTripEnd(pid){
  const b = S.boat; if (!b.tripMe) return; b.tripMe = false;
  if (!b.tripBad) tatAdd('safe', 1);
  if (BOAT.crewMax >= 1 && crewAboard().length >= BOAT.crewMax) tatAdd('full', 1);
  checkTattoos();
}
function tatLanding(pid){ if (!meAboard()) return; S.tat = S.tat || {}; S.tat.plant = S.tat.plant || {}; S.tat.plant[pid] = (S.tat.plant[pid] || 0) + 1; }
// hand them out: a message, and the tattoo shows on the figure in the Seaman app
function checkTattoos(){
  S.tattoos = S.tattoos || {}; const c = tatCounts();
  for (const T of TATS){ if (T.lock || S.tattoos[T.id]) continue; const [have, need] = T.p(c); if (have < need) continue;
    S.tattoos[T.id] = S.t; msg('Sjømann', 'Du har gjort deg fortjent til en ny tatovering: ' + T.n[0].toLowerCase() + '. ' + T.m[0] + ' Se den i Sjømann-appen.', 'You have earned a new tattoo: ' + T.n[1].toLowerCase() + '. ' + T.m[1] + ' See it in the Seaman app.'); }
}
