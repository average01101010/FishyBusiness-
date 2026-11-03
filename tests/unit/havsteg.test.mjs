// The ocean step's groundwork (H0 of docs/planer/havsteget.md, 03.11.2026): which plants take an ocean vessel (06b-coastports.js
// portWhy: the quay's length and depth, the gear groups it takes in, or a fifth from 28 m and over), and the prices of fish frozen at
// herring, mackerel and snow crab from the landing notes for 2025 (frozen fish is paid as fresh, as agreed: priser-og-salg.md).
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const P = K.PORTS.filter(p => p.mottak && p.mk && p.mk.q), V = K.VESSELS;
  t.ok(P.length > 150 && P.every(p => p.mk.gear && p.mk.big != null && p.mk.q.length === 2), `${P.length} mottak har redskapsandeler, andelen fra 28 m og over og kaia (lengde, dybde)`);
  // every coast boat may still use every plant
  t.ok(Object.keys(V).filter(k => V[k].cls !== 'hav').every(k => P.every(p => K.portFits(p, k))), 'kystbåtene kan bruke alle mottakene som før');
  // the ocean vessels: only where the quay fits and the plant takes the gear
  const n = k => P.filter(p => K.portFits(p, k)).length, cnt = Object.fromEntries(['autoliner', 'snokrabbe', 'bunntral', 'pelagisk', 'ringnot38'].map(k => [k, n(k)]));
  t.ok(Object.values(cnt).every(v => v > 0) && cnt.pelagisk < cnt.ringnot38 && Object.values(cnt).every(v => v < P.length), `mottak som tar havbåtene: ${JSON.stringify(cnt)} av ${P.length}`);
  const bad = [];
  for (const p of P) for (const k of ['autoliner', 'bunntral', 'pelagisk']){ if (!K.portFits(p, k)) continue; const T = V[k];
    if (p.mk.q[0] * 0.9 < T.len + 2 || (p.mk.q[1] > 0 ? p.mk.q[1] : K.QUAY_DEPTH_UNKNOWN) < T.draft + 0.5 || !(T.mottak.some(g => (p.mk.gear[g] || 0) >= 0.05) || p.mk.big >= 0.2)) bad.push(p.name + ' ' + k); }
  t.ok(!bad.length, 'hvert mottak som tar en havbåt, har kai lang og dyp nok og tar redskapet', bad.slice(0, 4));
  const short = P.find(p => p.mk.q[0] < 40), w = short && K.portWhy(short, 'bunntral');
  t.ok(w && /for kort/.test(w[0]) && /too short/.test(w[1]), `en kort kai sier hvorfor på norsk og engelsk: «${w && w[0]}»`);
  // the ocean fleet's own plants (havOnly): harbours where only an ocean vessel lands, not plants for the coast's boats
  const HO = K.PORTS.filter(p => p.havOnly), ho = k => HO.filter(p => K.portFits(p, k)).map(p => p.name);
  t.ok(HO.length >= 8 && HO.every(p => !p.mottak && p.havMottak && p.mk && p.mk.big >= 0.2) && HO.every(p => !K.portFits(p, 'sjark')), `${HO.length} mottak bare for havflåten (ikke mottak for kystbåtene): ${HO.map(p => p.name).join(', ')}`);
  t.ok(ho('pelagisk').length + ho('ringnot38').length > 0, `ringnot og pelagisk tar imot ved ${[...new Set(ho('pelagisk').concat(ho('ringnot38')))].join(', ')}`);
  t.ok(!K.CUSTOMERS.some(c => HO.some(p => p.id === c.port)), 'mottakene bare for havflåten legger ikke ut bestillinger');
  const unk = P.find(p => p.mk.q[1] === 0 && p.mk.q[0] > 90), wu = unk && K.portWhy(unk, 'autoliner');
  t.ok(wu && /ikke kjent/.test(wu[0]), `ukjent dybde i registeret (0) regnes som ${K.QUAY_DEPTH_UNKNOWN} m og sies som ukjent: ${unk && unk.name}, «${wu && wu[0]}»`);
  // prices: the ocean species from the notes
  const pt = P[0], H = (Date.UTC(2027, 2, 15) - K.EPOCH) / 36e5;
  const pr = sp => K.clsPrice(pt, sp, K.SPECIES[sp].ref, H, false);
  const sild = pr('sild'), mak = K.clsPrice(pt, 'makrell', 0, (Date.UTC(2027, 8, 15) - K.EPOCH) / 36e5, false), sk = pr('snokrabbe');
  t.ok(sild > 10 && sild < 15 && mak > 35 && mak < 50 && sk > 110 && sk < 160, `sild ${sild}, makrell i september ${mak}, snøkrabbe ${sk} kr/kg (sluttsedlene 2025)`);
}
