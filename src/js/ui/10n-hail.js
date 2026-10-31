// ---------- tuting and the six phrases at sea (Jonas 09.10.2026; supabase/migrations/20261009240000_hails.sql) ----------
// With another player's boat within 1 nm, «Tut» comes among the boat's buttons: the horn sounds here, and on her boat as a horn from
// where you lie, with a line over your boat in 3D and in the messages. The AIS card of a player's boat within 5 nm has six preset
// lines (never free text). The same boat once a minute; the server measures the distance itself. What came in is fetched every 15 s
// while the game is open and signed in (the id after the last one seen, S.hailId), a friend's in green. A badge counts the horns.
const HAIL = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const cloudOn = () => typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest());
  const LINES = [['Godt fiske!', 'Good fishing!'], ['Takk for sist!', 'Good to see you again!'], ['Ses på kaia!', 'See you on the quay!'],
    ['Pass deg for grunna!', 'Mind the shoal!'], ['Trenger du hjelp?', 'Do you need help?'], ['Fin dag på sjøen!', 'A fine day at sea!']];
  const HORN_KM = NM, LINE_KM = 5 * NM;
  const H = {busy:false, off:false, sent:{}};
  const players = () => peerStates();
  const near = km => { let best = null, bd = km; for (const n of players()){ const d = dist(n.p, S.boat.pos); if (d <= bd){ bd = d; best = n; } } return best; };
  const waitOn = (id, k) => H.sent[id + '|' + (k < 0 ? 'h' : 'l')] && Date.now() - H.sent[id + '|' + (k < 0 ? 'h' : 'l')] < 60000;
  function send(n, k){
    if (!cloudOn() || !n) return; const id = String(n.id).slice(1); if (waitOn(id, k)){ toast(L('Vent litt før du hilser på samme båt igjen.', 'Wait a little before hailing the same boat again.')); return; }
    H.sent[id + '|' + (k < 0 ? 'h' : 'l')] = Date.now();
    if (k < 0 && typeof SND !== 'undefined' && SND.horn) SND.horn(1);
    cloudRpc('hail_send', {target:id, k}).then(r => {
      if (r === 'ok'){ if (k < 0){ if (typeof achAdd === 'function') achAdd('horn'); } toast(k < 0 ? L('Du tutet til «' + n.name + '».', 'You sounded the horn at «' + n.name + '».') : L('Sendt til «' + n.name + '»: «' + L(...LINES[k]) + '»', 'Sent to «' + n.name + '»: «' + L(...LINES[k]) + '»')); }
      else toast(r === 'far' ? L('Båten er for langt unna.', 'The boat is too far away.') : r === 'wait' ? L('Vent litt før du hilser igjen.', 'Wait a little before hailing again.') : L('Hilsenen kom ikke fram.', 'The hail did not get through.'));
    }).catch(() => toast(L('Fikk ikke kontakt. Prøv igjen.', 'No connection. Try again.')));
  }
  // what came in: a horn from where she lies, a line over her boat in 3D, and a message
  function fetch(){
    if (!cloudOn() || H.busy || H.off || (typeof document !== 'undefined' && document.hidden)) return;
    H.busy = true;
    cloudRpc('hails_get', {since:S.hailId || 0}).then(list => {
      for (const h of Array.isArray(list) ? list : []){
        S.hailId = Math.max(S.hailId || 0, h.id);
        const who = h.from ? peerName(h.from) : L('En spiller', 'A player'), boat = h.boat ? peerName(h.boat) : '', ln = LINES[h.k];
        const txt = h.k < 0 ? [who + ' tutet' + (boat ? ' fra «' + boat + '»' : '') + '.', who + ' sounded the horn' + (boat ? ' from «' + boat + '»' : '') + '.'] : ln ? [who + ': «' + ln[0] + '»', who + ': «' + ln[1] + '»'] : null;
        if (!txt) continue;
        const n = players().find(q => String(q.id).slice(1) === h.fid);
        if (h.k < 0 && typeof SND !== 'undefined' && SND.horn) SND.horn(n ? Math.max(0.25, 1 - dist(n.p, S.boat.pos) / (2 * NM)) : 0.4);
        if (n && typeof G3 !== 'undefined' && G3.sayBoat) G3.sayBoat(n.id, L(txt[0], txt[1]));
        msg(h.friend ? 'Venner' : L('Sjøen', 'At sea'), txt[0], txt[1]); toast((h.friend ? '❤ ' : '') + L(txt[0], txt[1]));
      }
    }).catch(e => { if (/ 404$/.test(e.message)) H.off = true; }).finally(() => { H.busy = false; });
  }
  // the dock's «Tut» (ui/10c-dock.js), with a player's boat within 1 nm
  function dockItem(I){
    if (!cloudOn() || H.off) return null;
    const n = near(HORN_KM); if (!n) return null;
    return I('tut', 'horn', 'Tut', 'Horn', {run:() => send(n, -1)});
  }
  // the AIS card of a player's boat within 5 nm: the six lines
  function card(n){
    if (!cloudOn() || H.off || !n || !n.player || dist(n.p, S.boat.pos) > LINE_KM) return '';
    return '<div class="hl-lines">' + LINES.map((ln, i) => '<button type="button" data-hl="' + i + '">' + esc(L(ln[0], ln[1])) + '</button>').join('') + '</div>';
  }
  if (typeof document !== 'undefined') document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-hl]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const n = peerStates().find(q => q.id === AISSEL); if (n) send(n, +b.dataset.hl);
  }, true);
  setInterval(fetch, 15000);
  return {send, fetch, dockItem, card, LINES, _H:H};
})();
