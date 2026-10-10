// ===== Father's naust: setting it to rights and the trophy wall (core/07c-naust.js, core/09b-records.js) =====
// The page «Naustet» opens from the dock when the boat lies at Father's naust, and only there (Jonas 09.10.2026: «Muligheten til å
// oppgradere fars naust skal bare være tilgjengelig om man ligger ved fars naust. Samme med trofeveggen»). Father's notebook and his marks
// on the chart were taken out the same day.
const NOTEBOOK = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const day = t => dayStr(t / 60).replace(/^\S+ /, '');
  const atNaust = () => S.boat.status === 'port' && berthKind(S.boat) === 'naust';
  function page(){
    const h = ['<div class="nb-paper">'];
    if (!atNaust()){ h.push('<p class="nb-lead">' + L('Naustet og trofeveggen er hjemme ved fars naust. Legg til der for å se dem.', 'The naust and the trophy wall are at Father\u2019s naust. Moor there to see them.') + '</p></div>'); return h.join(''); }
    // the naust: set it to rights step by step (core/07c-naust.js)
    h.push('<h3 class="nb-hand nb-h">' + L('Naustet', 'The boathouse') + '</h3><p class="nb-lead">' + L('Naustet trenger en hånd. Snekkeren tar jobben når du ligger i hjemhavna.', 'The boathouse needs a hand. The carpenter does the work while you lie in the home harbour.') + '</p>');
    for (const U of NAUST_UP){ const done = naustHas(U.k), why = done ? null : naustWhy(U.k);
      h.push('<div class="nb-up' + (done ? ' done' : '') + '"><div><b>' + L(U.no, U.en) + '</b><small>' + L(U.d[0], U.d[1]) + '</small></div>' + (done ? '<span class="nb-stamp">✓ ' + L('Gjort', 'Done') + '</span>' :
        '<button class="ph-btn' + (why ? ' alt' : ' p') + '" data-pa="naustbuy" data-k="' + U.k + '"' + (why ? ' disabled title="' + L(why[0], why[1]) + '"' : '') + '>' + kr(U.kr) + '</button>') + '</div>');
    }
    { const w = NAUST_UP.map(U => !naustHas(U.k) && naustWhy(U.k)).find(Boolean); if (w && w[0] !== 'Du har ikke nok penger.') h.push('<p class="ph-note">' + L(w[0], w[1]) + '</p>'); }
    h.push(wall());
    h.push('</div>');
    return h.join('');
  }
  // the trophy wall: the biggest fish landed of each species, the personal records (core/09b-records.js). Also the Rekordfisk tab in the
  // Milepæler app (ui/05-phone.js). Without the wall upgrade the naust has a bare board with nails: the records are kept from the start.
  // app: the Milepæler tab, with its own heading and a pointer to the wall in the naust
  function wall(app){ const h = [], list = recList(), n = list.filter(x => x.rec).length;
    if (app) h.push('<h4>' + L('Rekordfisk', 'Record fish') + '</h4><p class="ph-note">' + L('Den største du har fått av hver art. Trofeveggen henger i fars naust.', 'The biggest you have landed of each species. The trophy wall hangs in Father\u2019s boathouse.') + '</p>');
    else h.push('<h3 class="nb-hand nb-h">' + L('Trofeveggen', 'The trophy wall') + '</h3><p class="nb-lead">' + (naustHas('vegg') ? L('Den største av hver art, med vekt, dato og sted.', 'The biggest of each species, with weight, date and place.') : L('En bar planke med spiker. Rekordene dine telles likevel fra første fisk; snekkeren kan sette opp en vegg.', 'A bare board with nails. Your records count from the first fish all the same; the carpenter can put up a wall.')) + '</p>');
    h.push('<div class="nb-recs">' + list.map(({sp, rec}) => rec
      ? '<div class="nb-rec"><b>' + SPECIES[sp][S.lang] + '</b><span>' + fmt(rec.kg, 1) + ' kg</span><small>' + [rec.at, day(rec.t), rec.boat && '«' + rec.boat + '»', REC_HOW[rec.how] && REC_HOW[rec.how][S.lang === 'no' ? 0 : 1]].filter(Boolean).join(' · ') + '</small></div>'
      : '<div class="nb-rec empty"><b>' + SPECIES[sp][S.lang] + '</b><span>?</span><small>' + L('ikke fanget ennå', 'not caught yet') + '</small></div>').join('') + '</div>' +
      '<p class="ph-note">' + n + ' / ' + list.length + '</p>');
    return h.join('');
  }
  // on the chart: Father's naust, a small house on the shore by the home harbour
  function svg(u, inV){
    const g = [], ns = S.naust && S.naust.o; if (ns && view.z > 2.2){ const x = ns[0] / 1000, y = ns[1] / 1000, s = 4.5 * u; if (inV(x, y)){
      g.push('<path d="M' + (x - s) + ',' + (y + s * 0.8) + 'v' + (-s * 1.1) + 'l' + s + ',' + (-s * 0.9) + 'l' + s + ',' + (s * 0.9) + 'v' + (s * 1.1) + 'z" class="nbh" stroke-width="' + (1.2 * u) + '"/>');
      if (view.z > 3) g.push(txt({x:x + 7 * u, y:y + 4 * u}, S.lang === 'no' ? 'Fars naust' : 'Father\u2019s boathouse', 'lbl-nb', 12 * u, 'stroke-width="' + (2.5 * u) + '"')); } }
    return g.join('');
  }
  return {page, svg, atNaust, wall};
})();
