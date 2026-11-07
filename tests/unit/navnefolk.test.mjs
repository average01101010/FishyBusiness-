// Named folk on the coast (04-crew.js NAMED_CREW, Jonas 06.11.2026): Tony Hjelmseth stands on the quay in Husøy whenever the boat lies
// there and he is not aboard one of the company's boats; his age follows the clock; his card has his story; his own lines at sea
export default function (t){
  const {NAMED_CREW, namedAge, namedMake, borsTick, newState, NAMED_SAY, EPOCH} = t.K;
  const hourOf = ms => (ms - EPOCH) / 36e5;   // (the clock's hours run from the game's EPOCH, 01-world.js gDate)
  const S = newState(); t.K.set('S', S);
  const tony = NAMED_CREW.find(n => n.nid === 'tony');
  t.ok(!!tony && tony.home[1] === 'husoy' && tony.traits.includes('spokefugl') && tony.traits.includes('lokalkjent'), 'Tony Hjelmseth hører hjemme på Husøy, spøkefugl og lokalkjent');
  // born 10 May 1998: 27 the day before his birthday in 2026, 28 on it
  t.eq(namedAge(tony, hourOf(Date.UTC(2026, 4, 9, 12))), 27, 'dagen før 28-årsdagen er han 27');
  t.eq(namedAge(tony, hourOf(Date.UTC(2026, 4, 10, 12))), 28, 'på 10. mai 2026 er han 28');
  S.t = hourOf(Date.UTC(2026, 10, 6, 12)) * 60;
  const c = namedMake(tony); t.ok(c.id === 'n_tony' && c.age === 28 && c.lv === 'erfaren' && c.story && c.story.length === 2 && c.gear.garn === 4, 'kortet: 28 år, erfaren, historien på norsk og engelsk, garn 4');
  // in Husøy: on the list; away: gone within the hour; aboard: not on the list
  S.boat.status = 'port'; S.boat.port = 'husoy'; S.bors = {pool:[], day:-1};
  borsTick(S.t / 60); t.ok(S.bors.pool.some(x => x.id === 'n_tony'), 'ved kaia i Husøy står han i Mannskapsbørsen');
  const n0 = S.bors.pool.length; borsTick(S.t / 60); t.eq(S.bors.pool.filter(x => x.id === 'n_tony').length, 1, 'og bare én gang');
  S.boat.port = 'botnhamn'; borsTick(S.t / 60); const him = S.bors.pool.find(x => x.id === 'n_tony'); t.ok(him && him.until <= S.t + 60, 'i en annen havn er han borte fra lista innen en time');
  S.t += 61; borsTick(S.t / 60); t.ok(!S.bors.pool.some(x => x.id === 'n_tony'), 'og etter den er han ute');
  S.boat.port = 'husoy'; S.crew = [namedMake(tony)]; borsTick(S.t / 60); t.ok(!S.bors.pool.some(x => x.id === 'n_tony'), 'mønstret på: står ikke på lista');
  S.crew = []; S.fleet = [{id:'v9', crew:[namedMake(tony)]}]; S.cur = 'v1'; borsTick(S.t / 60); t.ok(!S.bors.pool.some(x => x.id === 'n_tony'), 'om bord på en annen av rederiets båter: heller ikke da');
  t.ok(NAMED_SAY.tony && NAMED_SAY.tony.chat.length >= 3 && NAMED_SAY.tony.goodCatch && NAMED_SAY.tony.badCatch, 'han har sine egne replikker');
}
