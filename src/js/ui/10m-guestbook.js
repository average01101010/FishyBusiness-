// ---------- the guestbooks and Kystfareren (Jonas 09.10.2026; supabase/migrations/20261009220000_guestbook.sql) ----------
// One book in each pub and each rorbu along the coast. You sign with one tap: your player name and boat, and if you like one of the
// preset lines below (never free text: players from 13 years). Once a day per place. The book shows how many have signed and the last 30.
// It opens from the pub (the «Hvem er her» panel), from the village menu and at a rorbu. The places you have signed are kept in S.gb (and
// fetched from the cloud once a session, so another device counts too), and make Kystfareren: a tab in Milepæler with the count by
// part of the coast against all the pubs and rorbuer there, and a long badge with gifts (core/09f-merker.js).
const GBOOK = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const cloudOn = () => typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest());
  const LINES = [['Godt fiske her!', 'Good fishing here!'], ['Takk for husly.', 'Thanks for the shelter.'], ['Fin havn!', 'A fine harbour!'], ['Kommer igjen!', 'I’ll be back!'],
    ['Hilsen fra nord.', 'Greetings from the north.'], ['Hilsen fra sør.', 'Greetings from the south.'], ['Stille og fint i kveld.', 'Calm and fine tonight.'], ['Mye vær i dag.', 'Rough weather today.']];
  const B = {}, G = {mine:false, off:false};
  const mine = () => S.gb || (S.gb = {});
  const signedToday = id => { const t = mine()[id]; return !!t && Date.now() - t < 86400000; };
  const placeName = id => { const p = portById(id); return p ? (p.rorbu ? L('rorbua i ', 'the rorbu at ') + p.name : p.name) : id; };
  function fetch(id, force){
    if (!cloudOn() || G.off || !id) return;
    const e = B[id] || (B[id] = {d:null, at:0, busy:false});
    if (e.busy || (!force && Date.now() - e.at < 60000)) return;
    e.busy = true;
    cloudRpc('gb_get', {place:id}).then(d => { e.d = d; e.at = Date.now(); rerender(); }).catch(err => { e.at = Date.now(); if (/ 404$/.test(err.message)) G.off = true; }).finally(() => { e.busy = false; });
  }
  // the places signed on other devices, once a session
  function sync(){
    if (!cloudOn() || G.mine || G.off) return; G.mine = true;
    cloudRpc('gb_mine', {}).then(r => { if (Array.isArray(r)) for (const id of r) if (!mine()[id]) mine()[id] = 1; if (typeof achCheck === 'function') achCheck(); }).catch(() => { G.mine = false; });
  }
  function rerender(){
    if (typeof PHONE !== 'undefined' && PHONE.isOpen() && (PHONE.app === 'gbook' || PHONE.app === 'merker')) PHONE.render();
    if (typeof PUB3 !== 'undefined' && PUB3.refresh) PUB3.refresh();
  }
  function sign(id, k){
    if (!cloudOn() || !id) return;
    cloudRpc('gb_sign', {place:id, k:k == null ? -1 : k}).then(r => {
      if (r === 'ok' || r === 'wait'){ mine()[id] = Date.now(); save(); if (typeof achCheck === 'function') achCheck(); }
      toast(r === 'ok' ? L('Du har skrevet deg inn i gjesteboka.', 'You have signed the guestbook.') : r === 'wait' ? L('Du har alt skrevet deg inn her i dag.', 'You have already signed here today.') : L('Gjesteboka tok ikke imot.', 'The guestbook did not take it.'));
      fetch(id, true); rerender();
    }).catch(() => toast(L('Fikk ikke kontakt. Prøv igjen.', 'No connection. Try again.')));
  }
  // the book at a place; btn(action, label, disabled) makes a button in the caller's style (the phone or the pub)
  function html(id, btn){
    sync(); fetch(id);
    const e = B[id], d = e && e.d, h = ['<h4>' + L('Gjesteboka', 'The guestbook') + ' · ' + esc(placeName(id)) + '</h4>'];
    if (!cloudOn()){ h.push('<p class="ph-note">' + L('Logg inn for å skrive deg inn i gjesteboka.', 'Sign in to sign the guestbook.') + '</p>'); return h.join(''); }
    if (G.off){ h.push('<p class="ph-note">' + L('Gjestebøkene er ikke klare ennå.', 'The guestbooks are not ready yet.') + '</p>'); return h.join(''); }
    h.push('<p class="ph-note">' + (d ? L(d.n + (d.n === 1 ? ' har' : ' har') + ' skrevet seg inn her.', d.n + ' have signed here.') : L('Henter …', 'Loading …')) + '</p>');
    if (signedToday(id)) h.push('<p class="ph-note"><b>' + L('Du har skrevet deg inn her i dag.', 'You have signed here today.') + '</b></p>');
    else h.push('<p class="ph-note">' + L('Skriv deg inn med en hilsen, eller bare navnet:', 'Sign with a greeting, or just your name:') + '</p><div class="gb-lines">' +
      LINES.map((ln, i) => btn('gbSign:' + i, esc(L(ln[0], ln[1])))).join('') + btn('gbSign:-1', L('Bare navnet', 'Just my name')) + '</div>');
    if (d && d.rows && d.rows.length) h.push('<ul class="gb-rows">' + d.rows.map(r => { const ln = LINES[r.k], m = Math.round((r.age || 0) / 60);
      return '<li><b>' + esc(r.user ? peerName(r.user) : L('En spiller', 'A player')) + '</b>' + (r.boat ? ' <small>«' + esc(peerName(r.boat)) + '»</small>' : '') +
        (ln ? '<br><i>«' + esc(L(ln[0], ln[1])) + '»</i>' : '') + '<br><small>' + (m < 60 ? L(m + ' min siden', m + ' min ago') : m < 2880 ? L(Math.round(m / 60) + ' t siden', Math.round(m / 60) + ' h ago') : L(Math.round(m / 1440) + ' døgn siden', Math.round(m / 1440) + ' days ago')) + '</small></li>'; }).join('') + '</ul>');
    return h.join('');
  }
  // the phone page (from the village menu or a rorbu): the book where the boat lies
  const phoneBtn = (a, label) => { const [k, v] = a.split(':'); return '<button class="ph-btn alt" data-pa="' + k + '" data-k="' + v + '">' + label + '</button>'; };
  function page(){
    const id = S.boat.status === 'port' ? S.boat.port : null;
    return '<div class="ph-c"><div class="ph-card gb">' + (id ? html(id, phoneBtn) : '<p class="ph-note">' + L('Gjesteboka ligger på puben og i rorbuene. Legg til kai for å skrive deg inn.', 'The guestbooks are in the pubs and the rorbuer. Moor to sign one.') + '</p>') + '</div></div>';
  }
  function act(a, d){ if (a === 'gbSign' && S.boat.status === 'port'){ sign(S.boat.port, +d.k); } return false; }
  // ---- Kystfareren: the parts of the coast by where the place lies (natLL), south to north
  const PARTS = [['sor', 'Sør', 'South'], ['vest', 'Vest', 'West'], ['midt', 'Midt', 'Mid'], ['nordl', 'Nordland', 'Nordland'], ['troms', 'Troms', 'Troms'], ['finnm', 'Finnmark', 'Finnmark']];
  function part(p){
    const ll = natLL(p.p || p);
    if (ll.lat >= 69.6 && ll.lon >= 21.8 || ll.lon >= 23.5) return 'finnm';
    if (ll.lat >= 68.35) return 'troms';
    if (ll.lat >= 65.0) return 'nordl';
    if (ll.lat >= 62.3) return 'midt';
    if (ll.lat >= 58.9 && ll.lon < 7.3) return 'vest';
    return 'sor';
  }
  let ALL = null;   // every pub (the harbours with a village) and rorbu, by part, worked out once
  function all(){
    if (ALL) return ALL; ALL = {};
    for (const [k] of PARTS) ALL[k] = 0;
    for (const p of PORTS) if (!p.rorbu) ALL[part(p)]++;
    for (const R of (typeof RORBUER !== 'undefined' ? RORBUER : [])) ALL[part(R)]++;
    return ALL;
  }
  const count = () => Object.keys(mine()).length;
  function kyst(){
    sync();
    const A = all(), got = {}, names = {};
    for (const [k] of PARTS){ got[k] = 0; names[k] = []; }
    for (const id of Object.keys(mine())){ const p = portById(id); if (!p) continue; const k = part(p); got[k]++; names[k].push(p.rorbu ? L('Rorbu ', 'Rorbu ') + p.name : p.name); }
    const tot = Object.values(A).reduce((a, b) => a + b, 0);
    const h = ['<div class="ph-card"><h4>Kystfareren</h4><p class="ph-note">' + L('Skriv deg inn i gjesteboka på pubene og i rorbuene langs kysten. Du har skrevet deg inn ', 'Sign the guestbook in the pubs and the rorbuer along the coast. You have signed ') +
      '<b>' + count() + '</b>' + L(' steder av ', ' places of ') + tot + '.</p></div>'];
    for (const [k, no, en] of PARTS.slice().reverse()){
      h.push('<div class="ph-card"><div class="ph-kv"><span><b>' + L(no, en) + '</b></span><span>' + got[k] + ' / ' + A[k] + '</span></div><div class="ph-bar"><i style="width:' + Math.round(Math.min(1, got[k] / Math.max(1, A[k])) * 100) + '%"></i></div>' +
        (names[k].length ? '<p class="ph-note">✓ ' + names[k].sort().map(esc).join(' · ') + '</p>' : '') + '</div>');
    }
    return h.join('');
  }
  return {html, page, act, sign, kyst, count, part, LINES, _B:B, _G:G};
})();
