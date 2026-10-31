// ---------- shared catch marks (Jonas 09.10.2026; supabase/migrations/20261009200000_shared_marks.sql) ----------
// A tap on one of your own catch marks on the chart opens a card with what it gave and «Del med venner» / «Del med fiskarlaget». The
// marks shared with you (by a friend, or by someone in your harbour's fiskarlag) are drawn on the chart as a diamond in the catch's
// colour with the sharer's name, for one game day (4 real hours); a tap gives the card with «Rute hit». The first time one comes, a line
// goes to the messages. At most 5 shares in 4 hours (the server counts). Only the numbers go up, never text. Fetched every minute while
// signed in; a database without the functions (404) is left alone.
const SHARE = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const cloudOn = () => typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest());
  const LIFE = 4 * 3600;   // s: one game day at the game's 6×
  const M = {list:[], at:0, got:0, busy:false, off:false, sel:null};
  const GU = {line:['stamp', 'tub'], garn:['garn', 'net'], teine:['teine', 'pot']};
  const what = m => { const gu = m.g && m.kgu != null && GU[m.g];
    return gu ? fmt(m.kgu, m.kgu < 10 ? 1 : 0) + ' kg/' + gu[S.lang === 'en' ? 1 : 0] + (m.soak ? ' · ' + m.soak + L(' t ståtid', ' h soak') : '') : (m.kgph || 0) + L(' kg/t', ' kg/h'); };
  const col = m => m.q != null ? (m.q >= 1.4 ? '#d7301f' : m.q >= 1 ? '#f08a24' : m.q >= 0.6 ? '#e5c12b' : '#5b8db8') : m.kgph >= 40 ? '#d7301f' : m.kgph >= 20 ? '#f08a24' : m.kgph >= 8 ? '#e5c12b' : '#5b8db8';
  const age = m => (m.age || 0) + (Date.now() - M.got) / 1000;
  const live = () => M.list.filter(m => age(m) < LIFE);
  const who = m => m.from ? peerName(m.from) : L('En spiller', 'A player');
  // game time, as the marks' own clock
  const ago = s => { const m = Math.round(s / 60); return m < 1 ? L('nå', 'now') : m < 60 ? L('for ' + m + ' min siden', m + ' min ago') : L('for ' + Math.round(m / 60) + ' t siden', Math.round(m / 60) + ' h ago'); };
  function fetch(force){
    if (!cloudOn() || M.busy || M.off || (!force && Date.now() - M.at < 60000)) return;
    M.busy = true;
    cloudRpc('marks_get', {}).then(r => { M.list = Array.isArray(r) ? r : []; M.got = M.at = Date.now(); news();
      if (typeof renderDyn === 'function' && document.body.classList.contains('vplot')) renderDyn(); })
      .catch(e => { M.at = Date.now(); if (/ 404$/.test(e.message)) M.off = true; })
      .finally(() => { M.busy = false; });
  }
  // a mark heard for the first time goes to the messages
  function news(){
    const seen = S.shSeen || (S.shSeen = []);
    for (const m of live()){ if (seen.includes(m.id)) continue; seen.push(m.id);
      const from = m.scope === 'l' ? L('Fiskarlaget', 'The fishing club') : 'Venner';
      msg(from, who(m) + ' delte en fangstplass: ' + what(m) + '. Den står i kartet et døgn.', who(m) + ' shared a fishing spot: ' + what(m) + '. It is on the chart for a day.'); }
    while (seen.length > 120) seen.shift();
  }
  // the chart: the marks shared with you, a diamond in the catch's colour with the sharer's name
  function svg(u){
    const g = [];
    for (const m of live()){ const s = 4.6 * u, sel = M.sel && M.sel.k === 's' && M.sel.m.id === m.id;
      g.push('<path d="M' + m.x + ',' + (m.y - s) + 'l' + s + ',' + s + 'l' + (-s) + ',' + s + 'l' + (-s) + ',' + (-s) + 'z" fill="' + col(m) + '" class="shmark' + (sel ? ' sel' : '') + '" stroke-width="' + (1.3 * u) + '"/>');
      if (view.z > 2.2) g.push(txt({x:m.x + 7 * u, y:m.y + 3.5 * u}, esc(who(m)) + ' · ' + esc(what(m)), 'lbl-sh', 9.5 * u, 'stroke-width="' + (2.5 * u) + '"')); }
    return g.join('');
  }
  const card = (() => { const c = document.createElement('div'); c.id = 'shCard'; c.hidden = true; const a = document.getElementById('aisCard'); if (a) a.after(c); return c; })();
  function close(){ M.sel = null; card.hidden = true; if (typeof renderDyn === 'function') renderDyn(); }
  function open(k, m){
    M.sel = {k, m}; if (AISSEL){ AISSEL = null; renderAisCard(); }
    const own = k === 'o', h = ['<div class="ai-h"><b>' + (own ? L('Fangstmerke', 'Catch mark') : esc(who(m)) + L(' delte', ' shared')) + '</b><button type="button" data-s="x" aria-label="' + L('Lukk', 'Close') + '">×</button></div>',
      '<div class="ai-t">' + esc(what(m)) + ' · ' + (own ? ago((S.t - m.t) * 60) : ago(age(m) * GAME_RATE)) + ' · ' + fmt(dist(S.boat.pos, m) / NM, 1) + ' nm</div><div class="pin-b">'];
    if (own){
      if (!cloudOn()) h.push('</div><div class="ai-t">' + L('Logg inn for å dele med venner og fiskarlaget.', 'Sign in to share with friends and the fishing club.') + '</div><div class="pin-b">');
      else for (const [sc, no, en] of [['f', 'Del med venner', 'Share with friends'], ['l', 'Del med fiskarlaget', 'Share with the club']])
        h.push('<button type="button" data-s="' + sc + '"' + ((m.sh || '').includes(sc) ? ' disabled' : '') + '>' + ((m.sh || '').includes(sc) ? L('Delt', 'Shared') : L(no, en)) + '</button>');
    }
    h.push('<button type="button" data-s="go">' + L('Rute hit', 'Route here') + '</button></div>');
    card.innerHTML = h.join(''); card.hidden = false;
    card.onclick = e => { const b = e.target.closest('[data-s]'); if (!b || b.disabled) return; const s = b.dataset.s;
      if (s === 'x'){ close(); return; }
      if (s === 'go'){ close(); addWaypoint({x:m.x, y:m.y}); return; }
      share(m, s, b); };
    if (typeof renderDyn === 'function') renderDyn();
  }
  function share(m, sc, b){
    if (!cloudOn()) return; b.disabled = true;
    cloudRpc('mark_share', {scope:sc, x:+m.x.toFixed(4), y:+m.y.toFixed(4), kgph:Math.round(m.kgph || 0), g:m.g || '', kgu:m.kgu != null ? m.kgu : null, soak:m.soak != null ? Math.round(m.soak) : null, q:m.q != null ? m.q : null})
      .then(r => { if (r === 'ok'){ m.sh = (m.sh || '') + sc; save(); b.textContent = L('Delt', 'Shared');
          toast(sc === 'f' ? L('Delt med vennene dine.', 'Shared with your friends.') : L('Delt med fiskarlaget.', 'Shared with the fishing club.')); return; }
        b.disabled = false;
        toast(r === 'max' ? L('Du har delt fem merker det siste døgnet. Vent litt.', 'You have shared five marks in the last day. Wait a little.')
          : r === 'nolag' ? L('Du er ikke med i et fiskarlag. Bli med på puben.', 'You are not in a fishing club. Join one at the pub.') : L('Merket ble ikke delt.', 'The mark was not shared.')); })
      .catch(() => { b.disabled = false; toast(L('Fikk ikke kontakt. Prøv igjen.', 'No connection. Try again.')); });
  }
  // a tap on the chart (ui/03-map.js): your own live mark, or one shared with you; true when it was one
  function tap(mp, rr){
    let best = null, bd = rr;
    for (const m of S.marks || []){ if (!markLive(m)) continue; const d = dist(m, mp); if (d < bd){ bd = d; best = ['o', m]; } }
    for (const m of live()){ const d = dist(m, mp); if (d < bd){ bd = d; best = ['s', m]; } }
    if (!best){ if (M.sel) close(); return false; }
    open(best[0], best[1]); return true;
  }
  setInterval(() => fetch(false), 20000);
  return {svg, tap, fetch, close, _M:M};
})();
