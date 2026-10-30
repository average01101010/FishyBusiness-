// ===== the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js) =====
// Sesong: the season on now, the skrei festival's board around its weekend, what comes next (the seasons and the rules' dates), and a
// calendar of when each kind of fish is best. Folk: Edvard, the plants' managers you sell to (how far to the next step as a regular
// supplier) and Solveig in the shop.
const SEASONAPP = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en;
  const MON = [['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']];
  // the village contest (docs/planer/oppdrag-2.md F3; ui/10h-world.js bygdeTop): which plant in your part of the coast got most landed
  // this week, your own plant's place and the three above it. No prize: the honour, and Kystposten on Sunday evening
  function bygdeCard(H){
    if (typeof bygdeTop !== 'function' || typeof landsdel !== 'function' || typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user) return '';
    const q = portById(S.boat.port) || portById(S.home || ''); if (!q) return ''; const reg = landsdel(q.p), rn = L(LANDSDEL[reg][0], LANDSDEL[reg][1]), w = weekOf(H), t = bygdeTop(w), d = t && t.data && t.data[reg];
    const head = '<div class="ph-card"><h4>' + L('Bygdekampen i ' + rn, 'The village contest in ' + rn) + '</h4>';
    if (!t || t.err || !t.data) return head + '<p class="ph-note">' + (t && t.err ? L('Tavla er ikke å få tak i nå.', 'The board cannot be reached now.') : L('Henter tavla …', 'Fetching the board …')) + '</p></div>';
    if (!d || !d.rows || !d.rows.length) return head + '<p class="ph-note">' + L('Ingen leveringer i ' + rn + ' denne uka ennå. Hvert mottak teller alt som leveres til det, og det med mest står øverst søndag kveld.', 'No landings in ' + rn + ' this week yet. Every plant counts all that is landed to it, and the one with most stands top on Sunday evening.') + '</p></div>';
    const pn = id => portById(id) ? portById(id).name : id, mine = d.mine, rows = mine && mine.rank > 4 ? d.rows.slice(0, 3).concat(d.rows.filter(r => r.port === mine.port)) : d.rows.slice(0, 4);
    return head + '<p class="ph-note">' + L('Mottakene i ' + rn + ' etter det som er levert denne uka. ', 'The plants of ' + rn + ' by what was landed this week. ') + (mine ? L('Ditt mottak, ' + pn(mine.port) + ', er nummer ' + mine.rank + ' av ' + (d.n || d.rows.length) + '.', 'Your plant, ' + pn(mine.port) + ', is number ' + mine.rank + ' of ' + (d.n || d.rows.length) + '.') : L('Lever, så teller mottaket ditt.', 'Land, and your plant counts.')) + '</p>' +
      '<table class="ph-tbl"><tr><th>#</th><th>' + L('Mottak', 'Plant') + '</th><th>kg</th><th>' + L('båter', 'boats') + '</th></tr>' + rows.map(r => '<tr' + (r.me ? ' class="here"' : '') + '><td>' + r.rank + '</td><td>' + pn(r.port) + '</td><td>' + fmt(r.kg, 0) + '</td><td>' + (r.n || 0) + '</td></tr>').join('') + '</table></div>';
  }
  function page(){
    const H = S.t / 60, e = seasonNow(H), y = yearH(H), F = festDays(y), h = ['<div class="ph-c">'], mon = gDate(H).getUTCMonth();
    // the shared events (core/09c-seasons.js EVENTS): the board for everyone, from a week before to two weeks after
    for (const ev of EVENTS){ const D = evDays(ev, y); if (!(H > D.H0 - 24 * 7 && H < D.H1 + 24 * 14)) continue;
      const on = H >= D.H0 && H < D.H1, over = H >= D.H1, t = typeof evTop === 'function' ? evTop(ev.id, y) : null, d = t && t.data, B = evBadges()[ev.id + y];
      const name = L(ev.no, ev.en) + ' ' + y, pl = d && d.plants && d.plants[0], plName = pl && portById(pl.port) ? portById(pl.port).name : (pl ? pl.port : '');
      h.push('<div class="ph-card sn-fest"><h4>' + name + '</h4><p class="ph-note">' + (on ? L('Dag ' + evDayN(ev, H) + ' av ' + D.days + '. ', 'Day ' + evDayN(ev, H) + ' of ' + D.days + '. ') : over ? L('Over. ', 'Over. ') : L('Begynner ' + dayStr(D.H0).replace(/^\S+ /, '') + '. ', 'Begins ' + dayStr(D.H0).replace(/^\S+ /, '') + '. ')) +
        L('Alt som leveres i ' + ev.area[0] + ' teller', 'Everything landed in ' + ev.area[1] + ' counts') + ' (' + ev.sp.map(s => SPECIES[s] ? SPECIES[s][S.lang === 'en' ? 'en' : 'no'].toLowerCase() : s).join(', ') + '). ' +
        L('Tre fulle lastrom av båten din (' + fmt(evBadgeNeed(BOAT.holdCap), 0) + ' kg) gir merket «' + ev.badge[0] + ' ' + y + '». De tre beste får ' + EV_PRIZE.map(p => fmt(p, 0)).join(', ') + ' kr.', 'Three full holds of your boat (' + fmt(evBadgeNeed(BOAT.holdCap), 0) + ' kg) give the badge «' + ev.badge[1] + ' ' + y + '». The top three get ' + EV_PRIZE.map(p => fmt(p, 0)).join(', ') + ' kr.') + '</p>' +
        (d ? '<p>' + L(fmt(d.kg / 1000, 1) + ' tonn levert av ' + d.n + ' båter.', fmt(d.kg / 1000, 1) + ' tonnes landed by ' + d.n + ' boats.') + (d.mine ? ' ' + L('Du: ' + fmt(d.mine.kg, 0) + ' kg, plass ' + d.mine.rank + '.', 'You: ' + fmt(d.mine.kg, 0) + ' kg, place ' + d.mine.rank + '.') : ' ' + L('Du har ikke levert der ennå.', 'You have not landed there yet.')) + (plName ? ' ' + L(plName + ' leder med ' + fmt(pl.kg / 1000, 1) + ' tonn.', plName + ' leads with ' + fmt(pl.kg / 1000, 1) + ' tonnes.') : '') + '</p>' +
          (d.rows && d.rows.length ? '<table class="ph-tbl"><tr><th>#</th><th>' + L('Båt', 'Boat') + '</th><th>kg</th></tr>' + d.rows.slice(0, 8).map(r => '<tr' + (r.me ? ' class="here"' : '') + '><td>' + r.rank + '</td><td>' + (r.boat || '–') + (r.port && portById(r.port) ? ' <small>' + portById(r.port).name + '</small>' : '') + '</td><td>' + fmt(r.kg, 0) + '</td></tr>').join('') + '</table>' : '<p class="ph-note">' + L('Ingen båter har levert der ennå.', 'No boats have landed there yet.') + '</p>')
          : t && t.err ? '<p class="ph-note">' + L('Tavla er ikke å få tak i nå.', 'The board cannot be reached now.') + '</p>' : t ? '<p class="ph-note">' + L('Henter tavla …', 'Fetching the board …') + '</p>' : '<p class="ph-note">' + L('Tavla trenger nett og innlogging.', 'The board needs the net and a sign-in.') + '</p>') +
        (B && B.badge ? '<p><b>' + L('Merket «' + ev.badge[0] + ' ' + y + '» er ditt', 'The badge «' + ev.badge[1] + ' ' + y + '» is yours') + (B.rank ? ' · ' + L('nummer ', 'number ') + B.rank : '') + '</b></p>' : '') + '</div>'); }
    // the fiskarlag's week (ui/09c-pubsoc.js PUBSOC.lagCard; docs/planer/oppdrag-2.md F1)
    if (typeof PUBSOC !== 'undefined' && PUBSOC.lagCard) h.push(PUBSOC.lagCard());
    h.push(bygdeCard(H));
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
