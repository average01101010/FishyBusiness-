// Feedback #4 from the test edition (12.11.2026): alone aboard an open boat on the fishing ground with the energy low (25 %), the jig
// took nothing and «Jukse selv» was gone: the one aboard would rather rest than jig (13-work.js workAssign, restScore), so nobody stood
// at the rail, the catch was 0, and the jig game's button asks for your share at the rail (jigMeShare), which was then 0 too. A break
// at sea gives no rest (15-energy.js restRate: only the bunk does), and your energy has its own rule: slower under 25 %, asleep at 0.
export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), W = K.get('window'), {applyVessel, workAssign, jigMeShare, fishEffort} = K, b = S.boat;
  K.set('hsWork', () => 0.3); K.set('hsAt', () => 0.3);
  S.lang = 'no'; S.tut = 0; S.crew = []; S.me = S.cur; b.type = 'trebat'; applyVessel();
  const sea = (energy, prev) => { b.status = 'fishing'; b.port = null; b.gop = null; b.deckStop = false; b.gear = true; b.anch = false;
    S.plan = null; S.jobs = []; S.sleep = null; S.rest = null; S.energy = energy; S.mySt = prev; S.equip = Object.assign({}, S.equip, {jukse:0}); W.jigActive = false; };
  const meSt = () => { const A = workAssign(); const me = A.find(p => !p.c); return me ? me.st : null; };
  // alone: at the rail whatever the energy, as long as you are awake, and whatever you did the minute before
  for (const [e, prev] of [[94, 'fiske'], [40, 'ror'], [25, 'pause'], [25, 'ror'], [18, 'pause'], [3, 'pause']]){
    sea(e, prev); let st = null; for (let m = 0; m < 30; m++){ S.t++; st = meSt(); S.mySt = st; }
    t.eq(st, 'fiske', 'alene om bord, energi ' + e + ', fra ' + prev + ': står ved rekka og jukser');
    t.ok(jigMeShare() > 0 && fishEffort() > 0, 'alene, energi ' + e + ': juksa fisker (andel ' + jigMeShare().toFixed(2) + ', innsats ' + fishEffort().toFixed(2) + ')'); }
  // asleep (energy 0): nobody at the rail, as 15-energy.js says
  sea(0, 'fiske'); S.sleep = {until:S.t + 480}; S.t++; t.eq(meSt(), null, 'alene og sovnet: ikke på dekk');
  // stopped to gut: the table and the ice as before, not the rail
  sea(25, 'pause'); b.deckStop = true; S.t++; t.ok(meSt() !== 'fiske', 'stoppet for å sløye: ikke ved rekka', meSt());
  // with a hand aboard, the tired skipper may still take a breather (the crew fish); «Jukse selv» puts you at the rail (window.jigActive)
  sea(25, 'pause'); S.crew = [Object.assign(K.genCrew(), {bi:false, off:false, sleepW:false, fatigue:10, morale:62, traits:[]})];
  S.t++; const A = workAssign(); t.ok(A.some(p => p.c && p.st === 'fiske'), 'med mannskap: mannskapet jukser', A.map(p => p.st));
  t.ok(K.jigMeCan() > 0 && !W.jigActive, 'med mannskap, du på pause: knappen «Jukse selv» ser din andel ved rekka (' + K.jigMeCan().toFixed(2) + ') og slår ikke på juksingen');
  W.jigActive = true; S.t++; t.eq(meSt(), 'fiske', 'med mannskap og «Jukse selv» på: du står ved rekka'); t.ok(jigMeShare() > 0, 'med mannskap og «Jukse selv» på: din andel er over 0');
  W.jigActive = false; S.crew = [];
}
