// The number in the registration mark when the game gives one (core/06b-coastports.js regOf; Jonas 07.11.2026: «to ulike spillere skal
// kunne ha samme nummer om de ønsker, men når de tildeles tilfeldige nummer må vi etterstrebe å skape variasjon»). It came from the boat's
// name, the vessel's id and its type, so every player with the same home harbour, boat type and name (an unnamed boat is named after its
// mark, boatUnnamed) wore the same mark. Now it is drawn among the numbers 100–999 no real vessel of the municipality has, once, and then
// it is the boat's. Tried south, in the middle and north.
export default function (t){
  const K = t.K, {REGM, MOTTAK, regOf, portById} = K, S = K.newState(); K.set('S', S);
  S.boatName = 'Havbris'; S.cur = 'v1';
  for (const kom of ['kristiansand', 'bømlo', 'ålesund', 'bodø', 'tromsø', 'hammerfest', 'båtsfjord']){
    const e = REGM.k[kom], m = MOTTAK.m.find(x => x.k === kom && portById('m' + x.id));
    if (!e || !m){ t.ok(false, kom + ': kommunen har merke og en havn'); continue; }
    S.home = 'm' + m.id;
    const r = Array.from({length:60}, () => regOf({type:'sjark'})), ns = r.map(x => x.n), d = new Set(ns).size;
    t.ok(r.every(x => x.f === e[0] && x.k === e[1]), kom + ': bokstavene er kommunens (' + e[0] + '-…-' + e[1] + ')');
    t.ok(ns.every(n => n >= 100 && n <= 999 && !e[2].includes(n)), kom + ': numrene ligger i 100–999, og ingen er en ekte båts');
    t.ok(d >= 50, kom + ': 60 båter av samme type med samme navn og hjemhavn får minst 50 ulike numre (fikk ' + d + ')');
  }
  const b = {type:'sjark'}, n0 = regOf(b).n;
  t.eq([regOf(b).n, regOf(b).n], [n0, n0], 'en båt beholder nummeret den har fått');
}
