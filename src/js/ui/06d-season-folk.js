// ===== the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js) =====
// Sesong: the season on now, the skrei festival's board around its weekend, what comes next (the seasons and the rules' dates), and a
// calendar of when each kind of fish is best. Folk: Edvard, the plants' managers you sell to (how far to the next step as a regular
// supplier) and Solveig in the shop.
const SEASONAPP = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const MON = [['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']];
  function page(){
    const H = S.t / 60, e = seasonNow(H), y = yearH(H), F = festDays(y), h = ['<div class="ph-c">'], mon = gDate(H).getUTCMonth();
    if (e) h.push('<div class="ph-card sn-now"><small>' + L('Nå', 'Now') + '</small><h4>' + L(e.post[0][0], e.post[0][1]) + '</h4><p>' + L(e.post[1][0], e.post[1][1]) + '</p></div>');
    // the festival from a week before to three days after
    if (H > F.H0 - 24 * 7 && H < F.H1 + 24 * 3){
      const B = festBoard(y), on = H >= F.H0 && H < F.H1, done = H >= F.H1;
      h.push('<div class="ph-card sn-fest"><h4>' + L('Skreifestivalen', 'The skrei festival') + '</h4><p class="ph-note">' + (on ? L('I gang til søndag kl. 18. Største torsk landet av en av båtene dine teller.', 'On until Sunday 18:00. The biggest cod landed by one of your boats counts.') : done ? L('Ferdig. Premiene er delt ut.', 'Over. The prizes are given out.') : L('Lørdag ' + dayStr(F.H0).replace(/^\S+ /, '') + ' til søndag kl. 18. Premier: 15 000, 7 500 og 3 000 kr.', 'Saturday ' + dayStr(F.H0).replace(/^\S+ /, '') + ' to Sunday 18:00. Prizes: NOK 15,000, 7,500 and 3,000.')) + '</p>' +
        '<table class="ph-tbl"><tr><th>#</th><th>' + L('Båt', 'Boat') + '</th><th>kg</th></tr>' + (on || done ? B : B.filter(r => !r.me)).slice(0, 8).map((r, i) => '<tr' + (r.me ? ' class="here"' : '') + '><td>' + (i + 1) + '</td><td>' + r.name + (r.port ? ' <small>' + r.port + '</small>' : '') + '</td><td>' + (on || done || r.me ? fmt(r.kg, 1) : '–') + '</td></tr>').join('') + '</table></div>');
    }
    h.push('<div class="ph-card"><h4>' + L('Kommer', 'Coming') + '</h4>' + seasonNext(H, 8).map(x => '<div class="ph-kv"><span>' + L(x.no, x.en) + '</span><span>' + dayStr(x.H).replace(/^\S+ /, '') + '</span></div>').join('') + '</div>');
    // when each kind is best
    const G = seasonGrid();
    h.push('<div class="ph-card"><h4>' + L('Fiskekalender', 'Fish calendar') + '</h4><div class="sn-grid"><span></span>' + MON[S.lang === 'no' ? 0 : 1].map((m, i) => '<span class="sn-m' + (i === mon ? ' on' : '') + '">' + m.slice(0, 1) + '</span>').join('') +
      Object.entries(G).map(([sp, v]) => '<span class="sn-sp">' + SPECIES[sp][S.lang] + '</span>' + v.map((x, i) => '<i class="' + (i === mon ? 'on' : '') + '" style="background:rgba(30,140,110,' + (0.08 + 0.92 * x).toFixed(2) + ')" title="' + MON[S.lang === 'no' ? 0 : 1][i] + '"></i>').join('')).join('') + '</div>' +
      '<p class="ph-note">' + L('Mørkere farge: mer fisk den måneden. For torsk er skreien med.', 'Darker: more fish that month. For cod, the skrei is included.') + '</p>' +
      '<button class="ph-btn" data-pa="open" data-a="guide">' + L('Hvor skal jeg lete? Åpne Fiskeguiden', 'Where should I look? Open the Fish guide') + '</button></div>');
    h.push('</div>'); return h.join('');
  }
  return {page};
})();
// The regulars at the plants and the shop; Edvard and the app itself are gone (ui/10k-friends.js has the Folk app's place)
const FOLKAPP = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const day = t => dayStr(t / 60).replace(/^\S+ /, '');
  // the plants' and the shop's regulars (core/09d-folk.js): shown in Salgslaget since the Folk app became Venner (Jonas 09.10.2026)
  function page(){
    const F = folkState(), h = [];
    const P = Object.entries(F.plants).sort((a, b) => b[1].kg - a[1].kg);
    if (!P.length) h.push('<div class="ph-card fk"><h4>' + L('Mottakene', 'The plants') + '</h4><p class="ph-note">' + L('Lever fisk, så blir du kjent med folka på mottaket. Faste leverandører får bedre pris: 1 % ekstra etter 2 tonn, 2 % etter 10 og 3 % etter 30 tonn.', 'Land fish and you get to know the people at the plant. Regular suppliers get a better price: 1 % more after 2 tonnes, 2 % after 10 and 3 % after 30.') + '</p></div>');
    for (const [id, x] of P.slice(0, 6)){
      const pt = portById(id), lv = folkLevel(x.kg), nx = FOLK_LV[lv], pr = nx ? (x.kg - (FOLK_LV[lv - 1] || 0)) / (nx - (FOLK_LV[lv - 1] || 0)) : 1, nm = folkPlantName(id);
      h.push('<div class="ph-card fk"><div class="fk-h"><span class="fk-av p">' + nm[0] + '</span><div><h4>' + nm + '</h4><small>' + L('Mottaket i ', 'The plant in ') + (pt ? pt.name : id) + '</small></div></div>' +
        '<div class="ph-kv"><span>' + L('Levert', 'Landed') + '</span><span>' + fmt(x.kg / 1000, 1) + ' t</span></div><div class="ph-kv"><span>' + L('Ekstra på prisen', 'On top of the price') + '</span><span><b>' + lv + ' %</b></span></div>' +
        '<div class="qbar"><i style="width:' + (pr * 100).toFixed(0) + '%"></i></div><small>' + (nx ? L(fmt((nx - x.kg) / 1000, 1) + ' t til neste trinn', fmt((nx - x.kg) / 1000, 1) + ' t to the next step') : L('Du er blant de beste leverandørene her.', 'You are among the best suppliers here.')) + '</small></div>');
    }
    const n = F.shop.n;
    h.push('<div class="ph-card fk"><div class="fk-h"><span class="fk-av s">S</span><div><h4>' + FOLK_NAMES.shop + '</h4><small>' + L('Butikken på kaia', 'The shop on the quay') + '</small></div></div><div class="ph-kv"><span>' + L('Handlet', 'Purchases') + '</span><span>' + n + '</span></div>' +
      '<small>' + (n >= 15 ? L('10 % på isen og gratis kaffe.', '10 % off the ice and free coffee.') : n >= 5 ? L('Gratis kaffe. 10 % på isen fra 15 handler.', 'Free coffee. 10 % off the ice from 15 purchases.') : L('Kaffen er gratis fra 5 handler, og isen 10 % billigere fra 15.', 'Coffee is free from 5 purchases, and ice 10 % cheaper from 15.')) + '</small></div>');
    return h.join('');
  }
  return {page};
})();
