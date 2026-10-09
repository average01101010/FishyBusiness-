// ---------- Venner: friends between players (Jonas 09.10.2026; supabase/migrations/20261009180000_friends.sql) ----------
// The Folk app became Venner: your 6-character friend code, a field for someone else's, the requests to you with yes and no, your
// friends with where their boat is now or was last seen, and the requests you have sent. A friend is added by her code, by tapping
// her boat on the chart (the AIS card) or in the pub. A friend's boat is marked green on the chart wherever it is, and while her game is
// closed it stays where it was last seen, faded, with the time. Nobody can hide the boat from a friend (Jonas: «Det skal ikke være mulig
// å slå av posisjon»), but either can end the friendship. Guests and players without the cloud get a line on how to sign in. Fetched
// every minute while signed in, and at once when the app opens or something is sent; a database without the functions (404) is left alone.
const FRIENDS = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const cloudOn = () => typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest());
  const F = {d:null, at:0, busy:false, off:false, code:null, rm:null, sent:{}};
  const ONLINE = 120;   // s: a report this fresh means the game is open (the boats report every 15 s)
  const nm = f => f.user ? peerName(f.user) : L('Ukjent spiller', 'Unknown player');
  const list = () => F.d && Array.isArray(F.d.friends) ? F.d.friends : [];
  const is = hid => list().some(f => f.id === hid);
  const asked = hid => !!(F.d && (F.d.out || []).some(r => r.id === hid)) || (F.sent[hid] && Date.now() - F.sent[hid] < 600000);
  const askedMe = hid => !!(F.d && (F.d.in || []).some(r => r.id === hid));
  function rerender(){
    if (typeof PHONE !== 'undefined' && PHONE.isOpen() && PHONE.app === 'folk' && !(document.activeElement && document.activeElement.id === 'frCode')) PHONE.render();
    if (typeof renderDyn === 'function' && document.body.classList.contains('vplot')) renderDyn();
  }
  function fetch(force){
    if (!cloudOn() || F.busy || F.off || (!force && Date.now() - F.at < 60000)) return;
    F.busy = true;
    (F.code ? Promise.resolve(F.code) : cloudRpc('friend_code', {})).then(c => { F.code = c || F.code; return cloudRpc('friends_get', {}); })
      .then(d => { F.d = d && typeof d === 'object' ? d : {friends:[], in:[], out:[]}; F.at = Date.now(); news(); rerender(); })
      .catch(e => { F.at = Date.now(); if (/ 404$/.test(e.message)) F.off = true; })
      .finally(() => { F.busy = false; });
  }
  // a request heard for the first time goes to the messages (once per player, kept in the save)
  function news(){
    const seen = S.frSeen || (S.frSeen = {});
    for (const r of (F.d.in || [])) if (!seen[r.id]){ seen[r.id] = 1; const who = nm(r);
      msg('Venner', who + ' vil bli venn med deg. Svar i Venner-appen.', who + ' wants to be your friend. Answer in the Friends app.'); }
  }
  function rpc(name, args, after){
    if (!cloudOn()) return;
    cloudRpc(name, args).then(r => { after(r); fetch(true); }).catch(() => toast(L('Fikk ikke kontakt. Prøv igjen.', 'No connection. Try again.')));
  }
  // ask by code or by the hashed id from the boat (pos_world) or the pub
  function ask(target){
    target = String(target || '').trim(); if (!target) return;
    F.sent[target] = Date.now();
    rpc('friend_ask', {target}, r => toast(r === 'ok' ? L('Venneforespørselen er sendt.', 'Friend request sent.') : r === 'friends' ? L('Dere er venner nå.', 'You are friends now.')
      : r === 'already' ? L('Dere er allerede venner.', 'You are already friends.') : r === 'full' ? L('Du har 100 venner. Fjern en for å legge til flere.', 'You have 100 friends. Remove one to add more.')
      : r === 'wait' ? L('Du har sendt mange forespørsler. Vent litt.', 'You have sent many requests. Wait a little.') : L('Fant ingen spiller med den koden.', 'No player with that code.')));
  }
  // the chart: a friend whose game is closed, where her boat was last seen (the open ones come with the other players, ringed in green)
  function svg(u, live){
    if (!F.d) return '';
    const g = [], on = new Set((live || []).filter(n => n.player).map(n => String(n.id).slice(1)));
    for (const f of list()){
      if (f.x == null || on.has(f.id)) continue;
      const lbl = esc(peerName(f.boat || '')) + ' · ' + esc(ago(f.age));
      g.push('<circle cx="' + f.x + '" cy="' + f.y + '" r="' + (5 * u) + '" class="ais player friend off" stroke-width="' + (1.4 * u) + '"/>');
      if (view.z > 1.2) g.push(txt({x:f.x + 8 * u, y:f.y - 6 * u}, lbl, 'lbl-ais pl fr off', 10 * u, 'stroke-width="' + (3 * u) + '"'));
    }
    return g.join('');
  }
  function ago(s){
    if (s == null) return L('aldri sett', 'never seen');
    const m = Math.round(s / 60), h = Math.round(s / 3600), d = Math.round(s / 86400);
    return s < ONLINE ? L('nå', 'now') : m < 60 ? L('for ' + m + ' min siden', m + ' min ago') : h < 36 ? L('for ' + h + ' t siden', h + ' h ago') : L('for ' + d + ' døgn siden', d + ' days ago');
  }
  function where(f){
    if (f.x == null) return '';
    const p = {x:f.x, y:f.y}; let best = null, bd = 1e9;
    for (const q of PORTS){ const d = dist(q.p, p); if (d < bd){ bd = d; best = q; } }
    const off = dist(S.boat.pos, p) / NM;
    return (best ? (bd < 2 ? L('ved ', 'at ') : L('nær ', 'near ')) + best.name : '') + ' · ' + fmt(off, off < 10 ? 1 : 0) + ' nm ' + L('fra deg', 'from you');
  }
  const stTxt = f => f.age != null && f.age < ONLINE ? (f.st === 'port' ? L('I havn nå', 'In port now') : f.st === 'fishing' ? L('Fisker nå', 'Fishing now') : L('På sjøen nå', 'At sea now')) : L('Sist sett ', 'Last seen ') + ago(f.age);
  const btn = (a, label, cls, extra) => '<button class="ph-btn' + (cls ? ' ' + cls : '') + '" data-pa="' + a + '"' + (extra || '') + '>' + label + '</button>';
  function page(){
    fetch(false);
    const h = ['<div class="ph-c">'];
    if (!cloudOn()){
      h.push('<div class="ph-card"><h4>' + L('Venner', 'Friends') + '</h4><p class="ph-note">' + L('Logg inn med en konto under Innstillinger for å få venner. Venner ser båten til hverandre i kartet, uansett hvor langt unna dere er.', 'Sign in with an account under Settings to have friends. Friends see each other’s boat on the chart, however far apart you are.') + '</p></div></div>');
      return h.join('');
    }
    if (F.off){ h.push('<div class="ph-card"><h4>' + L('Venner', 'Friends') + '</h4><p class="ph-note">' + L('Venner er ikke klare på serveren ennå. Prøv igjen senere.', 'Friends are not ready on the server yet. Try again later.') + '</p></div></div>'); return h.join(''); }
    const d = F.d || {friends:[], in:[], out:[]};
    h.push('<div class="ph-card fr-code"><h4>' + L('Din vennekode', 'Your friend code') + '</h4><div class="ph-big fr-big">' + esc(F.code || (F.d ? '–' : '…')) + '</div>' +
      '<p class="ph-note">' + L('Gi koden til en venn. Du kan også trykke på båten til en spiller i kartet, eller legge til folk i puben.', 'Give the code to a friend. You can also tap a player’s boat on the chart, or add people in the pub.') + '</p>' +
      '<div class="fr-add"><input id="frCode" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="' + L('Kode', 'Code') + '">' + btn('frAdd', L('Legg til', 'Add'), 'p') + '</div></div>');
    if ((d.in || []).length){
      h.push('<h4 class="fr-h">' + L('Vil bli venn med deg', 'Want to be your friend') + '</h4>');
      for (const r of d.in) h.push('<div class="ph-card fr"><div class="fr-row"><b>' + esc(nm(r)) + '</b><span>' + btn('frYes', L('Godta', 'Accept'), 'p', ' data-id="' + esc(r.id) + '"') + btn('frNo', L('Avslå', 'Decline'), 'alt', ' data-id="' + esc(r.id) + '"') + '</span></div></div>');
    }
    h.push('<h4 class="fr-h">' + L('Venner', 'Friends') + (d.friends.length ? ' (' + d.friends.length + ')' : '') + '</h4>');
    if (!d.friends.length) h.push('<p class="ph-note">' + (F.d ? L('Ingen venner ennå. Del koden din, eller trykk på en spillerbåt i kartet.', 'No friends yet. Share your code, or tap a player’s boat on the chart.') : L('Henter …', 'Loading …')) + '</p>');
    for (const f of d.friends){
      const on = f.age != null && f.age < ONLINE, rm = F.rm === f.id;
      h.push('<div class="ph-card fr' + (on ? ' on' : '') + '"><div class="fr-row"><b><i class="fr-dot"></i>' + esc(nm(f)) + '</b><small>' + (f.boat ? '«' + esc(peerName(f.boat)) + '»' : '') + '</small></div>' +
        '<p class="ph-note">' + stTxt(f) + (f.x != null ? ' · ' + esc(where(f)) : '') + '</p><div class="ph-btncol">' +
        (f.x != null ? btn('frShow', L('Vis i kartet', 'Show on the chart'), '', ' data-id="' + esc(f.id) + '"') : '') +
        btn('frRm', rm ? L('Trykk igjen for å fjerne', 'Tap again to remove') : L('Fjern venn', 'Remove friend'), rm ? 'red' : 'alt', ' data-id="' + esc(f.id) + '"') + '</div></div>');
    }
    if ((d.out || []).length){
      h.push('<h4 class="fr-h">' + L('Venter på svar', 'Waiting for an answer') + '</h4>');
      for (const r of d.out) h.push('<div class="ph-card fr"><div class="fr-row"><b>' + esc(nm(r)) + '</b><span>' + btn('frUndo', L('Angre', 'Withdraw'), 'alt', ' data-id="' + esc(r.id) + '"') + '</span></div></div>');
    }
    h.push('</div>');
    return h.join('');
  }
  function act(a, d){
    if (a === 'frAdd'){ const el = document.getElementById('frCode'), c = el ? el.value.trim().toUpperCase() : '';
      if (!/^[A-Z0-9]{6}$/.test(c)){ toast(L('Koden har seks tegn.', 'The code has six characters.')); return false; }
      if (c === F.code){ toast(L('Det er din egen kode.', 'That is your own code.')); return false; }
      ask(c); if (el) el.value = ''; return false; }
    if (a === 'frYes' || a === 'frNo'){ const yes = a === 'frYes'; rpc('friend_answer', {target:d.id, yes}, r => toast(r === 'ok' ? (yes ? L('Dere er venner nå.', 'You are friends now.') : L('Forespørselen er avslått.', 'Request declined.')) : L('Forespørselen finnes ikke lenger.', 'The request is gone.'))); return false; }
    if (a === 'frRm'){ if (F.rm !== d.id){ F.rm = d.id; return true; } F.rm = null; rpc('friend_remove', {target:d.id}, () => toast(L('Vennen er fjernet.', 'Friend removed.'))); return false; }
    if (a === 'frUndo'){ delete F.sent[d.id]; rpc('friend_remove', {target:d.id}, () => toast(L('Forespørselen er trukket tilbake.', 'Request withdrawn.'))); return false; }
    if (a === 'frShow'){ const f = list().find(x => x.id === d.id); if (!f || f.x == null) return false;
      PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); openPlotter(); view.cx = f.x; view.cy = f.y; view.z = clamp(MAP_H / 12, ZMIN, ZMAX);
      const live = AISNOW.find(n => n.player && n.id === 'p' + f.id); if (live) AISSEL = live.id; applyView(); scheduleStatic(); if (live) renderAisCard(); return false; }
    return false;
  }
  // a button for a player's boat or a player in the pub: add, asked, or friends already
  function chip(hid){
    if (!cloudOn() || F.off || !hid) return '';
    if (is(hid)) return '<span class="fr-chip">' + L('Venn', 'Friend') + '</span>';
    if (asked(hid)) return '<span class="fr-chip">' + L('Forespørsel sendt', 'Request sent') + '</span>';
    return '<button type="button" class="ph-btn fr-ask" data-fr="' + esc(hid) + '">' + (askedMe(hid) ? L('Godta venneforespørsel', 'Accept friend request') : L('Legg til som venn', 'Add as friend')) + '</button>';
  }
  if (typeof document !== 'undefined') document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-fr]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); ask(b.dataset.fr); b.outerHTML = '<span class="fr-chip">' + L('Forespørsel sendt', 'Request sent') + '</span>';
  }, true);
  setInterval(() => fetch(false), 20000);
  return {page, act, svg, chip, is, fetch, ask, count:() => list().length, _F:F};
})();
