// The start of a new game and the first chapter's reward (core/05-vessels.js newState, core/09f-merker.js achChapter; Jonas 09.11.2026):
// a new game starts with 2 000 kr (down from 15 000), and the first chapter of «Første uke på sjøen» pays 5 000 kr in place of the
// pennant that went; no pennant goes into the paint code others read.
export default function (t){
  const K = t.K; const S = K.newState(); K.set('S', S);
  t.eq(S.cash, 2000, 'et nytt spill starter med 2 000 kr');
  t.eq([K.achKr(), K.achKr(true)], ['5 000 kr', 'NOK 5,000'], 'belønningen for kapittel 1 som tekst på norsk og engelsk');
  K.set('pressPut', () => {});   // (the paper's article wants the cloud's company data, not here)
  const c0 = S.cash; K.achChapter(0);
  t.eq(S.cash - c0, 5000, 'kapittel 1 setter inn 5 000 kr på kontoen');
  t.ok(S.msgs.some(m => m.from === 'Kystposten' && /5 000 kr er satt inn/.test(m.no)), 'Kystposten sier at pengene er satt inn', S.msgs.map(m => m.no));
  const c1 = S.cash; K.achChapter(2);
  t.eq(S.cash - c1, 0, 'kapittel 3 gir ingen penger, bare skrogfargen');
}
