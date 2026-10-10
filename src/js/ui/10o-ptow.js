// ---------- towing between players (Jonas 09.10.2026; supabase/migrations/20261009260000_tows.sql) ----------
// The one who needs help: with the boat broken down (adrift, engine stopped, aground), the Redning app has «Spør andre spillere om slep».
// Players within 30 nm see the ask on the chart and in their messages. When one takes it, she comes; when she has made the line fast,
// this boat follows her (status 'ptow', placed behind her as she reports, carried on along her heading between reports) until she moors,
// and then lies in that harbour. Free for the one towed. If nobody takes the ask in 20 minutes, or the one who took it has not come in
// 20 minutes, the rescue boat is called instead (as the plan said: the rescue boat as the fallback).
// The helper: a red mark «Trenger slep» on the chart (a tap gives the card with «Hjelp»), Autonav there, and «Ta slep» among the boat's
// buttons once she lies still within 150 m. Towing caps the speed and costs fuel as the tow trips do (03-simulation.js speedCap, fuelLph).
// Mooring in a harbour ends it, and the game pays PTOW_PAY when the server allows (once a day for the same player, three a day).
const PTOW_PAY = 25000, PTOW_WAIT = 20 * 60000, PTOW_BACK = 0.05;   // kr; real ms before the rescue boat; km behind the helper
function ptowTowing(){ return !!(S && S.ptowH && S.ptowH.st === 'tow'); }
// the towed boat each game minute: behind where the helper is now, carried on from her last report
function ptowStep(){
  const b = S.boat, t = S.ptow, h = t && t.h; if (!h) return;
  const dt = Math.min(60, Math.max(0, (Date.now() - h.at) / 1000)), km = (h.v || 0) * NM / 3600 * dt * GAME_RATE;
  const hx = h.x + Math.sin(h.hd) * km, hy = h.y - Math.cos(h.hd) * km;
  b.pos = {x:hx - Math.sin(h.hd) * PTOW_BACK, y:hy + Math.cos(h.hd) * PTOW_BACK}; b.heading = h.hd; b.v = h.v || 0;
}
const PTOW = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const cloudOn = () => typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest());
  const distress = () => ['adrift', 'engine', 'aground'].includes(S.boat.status);
  const P = {open:[], busy:false, off:false, at:0, seen:{}, sel:null};
  // the other boat among the players' boats (core/05-vessels.js peerStates), the nearest to where she is said to be: for the line in 3D
  const peerAt = (x, y) => { let best = null, bd = 0.5; for (const n of peerStates()){ const d = dist(n.p, {x, y}); if (d < bd){ bd = d; best = n.id; } } return best; };
  const nm = o => o && o.user ? peerName(o.user) : L('en spiller', 'a player'), bt = o => o && o.boat ? '«' + peerName(o.boat) + '»' : '';
  function rpc(fn, a){ return cloudRpc(fn, a).catch(e => { if (/ 404$/.test(e.message)) P.off = true; throw e; }); }
  // ---- the one who needs help
  function ask(){
    if (!cloudOn() || P.off || !distress()) return;
    rpc('tow_ask', {x:+S.boat.pos.x.toFixed(4), y:+S.boat.pos.y.toFixed(4)}).then(id => {
      if (!id) { toast(L('Fikk ikke sendt spørsmålet.', 'Could not send the ask.')); return; }
      S.ptow = {id:+id, t0:Date.now(), st:'ask'}; save();
      msg('Slep', 'Spørsmålet om slep er sendt til spillere i nærheten. Tar ingen det innen 20 minutter, kommer redningsskøyta.', 'The ask for a tow has gone to players near by. If nobody takes it within 20 minutes, the rescue boat comes.');
      if (typeof PHONE !== 'undefined' && PHONE.isOpen()) PHONE.render();
    }).catch(() => toast(L('Fikk ikke kontakt. Prøv igjen.', 'No connection. Try again.')));
  }
  function giveUp(why){
    const t = S.ptow; if (!t) return; S.ptow = null; rpc('tow_cancel', {id:t.id}).catch(() => {});
    if (S.boat.status === 'ptow'){ S.boat.status = 'adrift'; S.boat.v = 0; }
    if (why === 'rescue'){ msg('Slep', 'Ingen spiller kom i tide. Redningsskøyta er tilkalt.', 'No player came in time. The rescue boat is called.'); rescue(true); }
    save(); if (typeof refreshAll === 'function') refreshAll();
  }
  function onMine(m){
    const t = S.ptow, b = S.boat;
    // gone or called off (by the server, or a newer ask): back to waiting for help the old way
    if (!m || m.role !== 'needer' || m.id !== t.id || m.st === 'cancel'){ S.ptow = null; if (b.status === 'ptow'){ b.status = 'adrift'; b.v = 0; } return; }
    const o = m.other;
    if (m.st === 'ask' && Date.now() - t.t0 > PTOW_WAIT) return giveUp('rescue');
    if (m.st === 'come'){
      if (t.st !== 'come'){ t.st = 'come'; t.took = Date.now(); msg('Slep', nm(o) + ' kommer for å slepe deg' + (o && o.boat ? ' med ' + bt(o) : '') + '.', nm(o) + ' is coming to tow you' + (o && o.boat ? ' with ' + bt(o) : '') + '.'); }
      else if (Date.now() - (t.took || t.t0) > PTOW_WAIT) return giveUp('rescue');
      if (!distress() && b.status !== 'ptow') return giveUp();   // the engine came back by itself
    }
    if (m.st === 'tow' && o && o.x != null){
      if (b.status !== 'ptow'){ if (typeof helmOff === 'function') helmOff(); S.plan = null; b.status = 'ptow'; b.fishUntil = null; t.st = 'tow';
        msg('Slep', nm(o) + ' har tatt deg på slep.', nm(o) + ' has taken you in tow.'); }
      t.pid = peerAt(o.x, o.y) || t.pid;
      t.h = {x:o.x, y:o.y, hd:o.hd || 0, v:(o.age || 0) < 120 ? o.v || 0 : 0, at:Date.now() - Math.min(60, o.age || 0) * 1000};
    }
    if (m.st === 'done' && m.port && portById(m.port)){
      const pt = portById(m.port); S.ptow = null; b.status = 'idle'; dock(pt.id);
      msg('Slep', nm(o) + ' slepte deg inn til ' + pt.name + '. Takk for hjelpen!', nm(o) + ' towed you in to ' + pt.name + '. Thanks for the help!');
      if (typeof refreshAll === 'function') refreshAll();
    }
  }
  // ---- the helper
  function take(o){
    if (!cloudOn() || !o) return;
    rpc('tow_take', {id:o.id}).then(r => {
      if (r !== 'ok'){ toast(r === 'taken' ? L('Noen andre har alt tatt slepet.', 'Someone else has already taken the tow.') : L('Du kan ikke ta dette slepet nå.', 'You cannot take this tow now.')); return; }
      S.ptowH = {id:o.id, st:'come', x:o.x, y:o.y, user:o.user, boat:o.boat}; save(); close();
      msg('Slep', 'Du har tatt slepet for ' + nm(o) + ' ' + bt(o) + '. Gå dit, ligg stille nær båten og trykk «Ta slep».', 'You have taken the tow for ' + nm(o) + ' ' + bt(o) + '. Go there, lie still near the boat and tap «Take the tow».');
      if (typeof leiaTo === 'function'){ if (typeof openPlotter === 'function') openPlotter(); leiaTo({x:o.x, y:o.y}); }
    }).catch(() => toast(L('Fikk ikke kontakt. Prøv igjen.', 'No connection. Try again.')));
  }
  function hook(){
    const H = S.ptowH; if (!H) return;
    rpc('tow_hook', {id:H.id}).then(r => {
      if (r === 'ok'){ H.st = 'tow'; H.pid = peerAt(H.x, H.y); save(); msg('Slep', 'Slepet er festet. Gå til en havn og fortøy, så er jobben gjort. Farten er begrenset mens du sleper.', 'The tow is made fast. Go to a harbour and moor, and the job is done. Your speed is limited while towing.'); if (typeof refreshAll === 'function') refreshAll(); }
      else toast(r === 'far' ? L('Du må ligge nærmere båten.', 'You must lie closer to the boat.') : L('Slepet finnes ikke lenger.', 'The tow is gone.'));
    }).catch(() => toast(L('Fikk ikke kontakt. Prøv igjen.', 'No connection. Try again.')));
  }
  function drop(){
    const H = S.ptowH; if (!H) return; S.ptowH = null; save(); rpc('tow_cancel', {id:H.id}).catch(() => {});
    msg('Slep', 'Du ga fra deg slepet. Andre kan ta det.', 'You gave up the tow. Others can take it.'); if (typeof refreshAll === 'function') refreshAll();
  }
  // moored in a harbour with a tow (core/05-vessels.js dock)
  function docked(pid){
    const H = S.ptowH; if (!H || H.st !== 'tow') return;
    rpc('tow_done', {id:H.id, port:String(pid)}).then(r => {
      S.ptowH = null; save(); if (!r || !r.ok) return;
      const pt = portById(pid), who = nm(H) + ' ' + bt(H);
      if (r.pay){ S.cash += PTOW_PAY; S.stats.revenue += PTOW_PAY; if (typeof achAdd === 'function') achAdd('ptow');
        msg('Slep', 'Du slepte ' + who + ' inn til ' + (pt ? pt.name : 'havn') + '. Belønning ' + kr(PTOW_PAY) + '.', 'You towed ' + who + ' in to ' + (pt ? pt.name : 'harbour') + '. Reward ' + kr(PTOW_PAY) + '.'); }
      else msg('Slep', 'Du slepte ' + who + ' inn til ' + (pt ? pt.name : 'havn') + '. Takk! (Belønningen gis én gang i døgnet for samme spiller, og for tre slep i døgnet.)', 'You towed ' + who + ' in to ' + (pt ? pt.name : 'harbour') + '. Thanks! (The reward is given once a day for the same player, and for three tows a day.)');
      if (typeof refreshAll === 'function') refreshAll();
    }).catch(() => {});
  }
  function onMineH(m){
    const H = S.ptowH; if (!m || m.role !== 'helper' || m.id !== H.id){ if (!m || m.id === H.id){ S.ptowH = null; msg('Slep', 'Slepet ble avlyst.', 'The tow was called off.'); } return; }
    if (m.other && m.other.x != null && (m.other.age || 0) < 180){ H.x = m.other.x; H.y = m.other.y; if (H.st === 'tow' && !H.pid) H.pid = peerAt(H.x, H.y); }
  }
  // the dock's «Ta slep» (ui/10c-dock.js): lying still within 150 m of the boat
  function dockItem(I){
    const H = S.ptowH, b = S.boat; if (!H || H.st !== 'come' || !(b.status === 'idle' || b.status === 'fishing') || (b.v || 0) > 1.5) return null;
    if (dist(b.pos, {x:H.x, y:H.y}) > 0.15) return null;
    return I('ptow', 'hjelp', 'Ta slep', 'Take the tow', {run:hook, pri:true});
  }
  // ---- the polling
  function tick(){
    if (!cloudOn() || P.off || P.busy || (typeof document !== 'undefined' && document.hidden)) return;
    if (S.ptow && S.ptow.id){ P.busy = true; rpc('tow_mine', {}).then(onMine).catch(() => {}).finally(() => { P.busy = false; }); return; }
    if (S.ptowH && S.ptowH.id){ P.busy = true; rpc('tow_mine', {}).then(onMineH).catch(() => {}).finally(() => { P.busy = false; }); return; }
    if (Date.now() - P.at < 30000 || S.boat.status === 'port' || distress()) { if (S.boat.status === 'port') P.open = []; return; }
    P.busy = true; P.at = Date.now();
    rpc('tow_open', {x:+S.boat.pos.x.toFixed(3), y:+S.boat.pos.y.toFixed(3), r:30 * NM}).then(list => {
      P.open = Array.isArray(list) ? list : [];
      for (const o of P.open) if (!P.seen[o.id]){ P.seen[o.id] = 1; const d = dist(S.boat.pos, o);
        msg('Slep', nm(o) + ' ' + bt(o) + ' trenger slep ' + fmt(d / NM, 1) + ' nm unna. Belønning ' + kr(PTOW_PAY) + '. Trykk på merket i kartet for å hjelpe.', nm(o) + ' ' + bt(o) + ' needs a tow ' + fmt(d / NM, 1) + ' nm away. Reward ' + kr(PTOW_PAY) + '. Tap the mark on the chart to help.'); }
      if (typeof renderDyn === 'function' && document.body.classList.contains('vplot')) renderDyn();
    }).catch(() => {}).finally(() => { P.busy = false; });
  }
  // ---- the chart: the asks near, and the card
  function svg(u){
    const g = [], list = P.open.slice(); if (S.ptowH && S.ptowH.st === 'come') list.push({id:S.ptowH.id, x:S.ptowH.x, y:S.ptowH.y, user:S.ptowH.user, boat:S.ptowH.boat, mine:true});
    for (const o of list){ const s = 6 * u;
      g.push('<path d="M' + o.x + ',' + (o.y - s) + 'l' + (s * 0.9) + ',' + (s * 1.5) + 'h' + (-s * 1.8) + 'z" class="ptow' + (o.mine ? ' mine' : '') + '" stroke-width="' + (1.4 * u) + '"/>');
      g.push(txt({x:o.x + 8 * u, y:o.y + 4 * u}, (o.mine ? L('Slep: ', 'Tow: ') : L('Trenger slep: ', 'Needs a tow: ')) + esc(o.boat ? peerName(o.boat) : nm(o)), 'lbl-ptow', 10.5 * u, 'stroke-width="' + (2.5 * u) + '"')); }
    return g.join('');
  }
  const card = (() => { if (typeof document === 'undefined') return null; const c = document.createElement('div'); c.id = 'ptCard'; c.hidden = true; const a = document.getElementById('aisCard'); if (a) a.after(c); return c; })();
  function close(){ P.sel = null; if (card) card.hidden = true; }
  function open(o){
    P.sel = o; const mine = !!o.mine, d = dist(S.boat.pos, o);
    card.innerHTML = '<div class="ai-h"><b>' + (mine ? L('Ditt slep', 'Your tow') : L('Trenger slep', 'Needs a tow')) + '</b><button type="button" data-p="x" aria-label="' + L('Lukk', 'Close') + '">×</button></div>' +
      '<div class="ai-t">' + esc(nm(o)) + ' ' + esc(bt(o)) + ' · ' + fmt(d / NM, 1) + ' nm</div>' +
      '<div class="ai-t">' + (mine ? L('Ligg stille nær båten og trykk «Ta slep».', 'Lie still near the boat and tap «Take the tow».') : L('Belønning ' + kr(PTOW_PAY) + ' når du har slept båten til en havn.', 'Reward ' + kr(PTOW_PAY) + ' when you have towed the boat to a harbour.')) + '</div>' +
      '<div class="pin-b">' + (mine ? '<button type="button" data-p="go">' + L('Rute dit', 'Route there') + '</button><button type="button" data-p="drop">' + L('Gi fra deg', 'Give up') + '</button>'
        : '<button type="button" data-p="take"' + (S.ptowH ? ' disabled' : '') + '>' + L('Hjelp', 'Help') + '</button>') + '</div>';
    card.hidden = false;
    card.onclick = e => { const b = e.target.closest('[data-p]'); if (!b || b.disabled) return; const k = b.dataset.p;
      if (k === 'x') close(); else if (k === 'take') take(o); else if (k === 'drop'){ close(); drop(); } else if (k === 'go'){ close(); leiaTo({x:o.x, y:o.y}); } };
  }
  function tap(mp, rr){
    const list = P.open.slice(); if (S.ptowH && S.ptowH.st === 'come') list.push({id:S.ptowH.id, x:S.ptowH.x, y:S.ptowH.y, user:S.ptowH.user, boat:S.ptowH.boat, mine:true});
    let best = null, bd = rr * 1.2; for (const o of list){ const d = dist(o, mp); if (d < bd){ bd = d; best = o; } }
    if (!best){ if (P.sel) close(); return false; }
    open(best); return true;
  }
  // the Redning app's card (ui/05-phone.js redning)
  function card4phone(){
    if (!cloudOn() || P.off) return '';
    const t = S.ptow;
    if (t){ const left = Math.max(0, Math.ceil((PTOW_WAIT - (Date.now() - (t.st === 'come' ? t.took || t.t0 : t.t0))) / 60000));
      return '<div class="ph-card"><h4>' + L('Slep fra en annen spiller', 'Tow from another player') + '</h4><p>' + (t.st === 'tow' ? L('Du er på slep. Båten følger den som sleper deg til havn.', 'You are under tow. The boat follows the one towing you to harbour.')
        : t.st === 'come' ? L('En spiller er på vei til deg. Kommer hun ikke innen ' + left + ' min, tilkalles redningsskøyta.', 'A player is on the way to you. If she has not come within ' + left + ' min, the rescue boat is called.')
        : L('Venter på at noen tar slepet. Om ' + left + ' min tilkalles redningsskøyta.', 'Waiting for someone to take the tow. In ' + left + ' min the rescue boat is called.')) + '</p>' +
        (t.st !== 'tow' ? '<button class="ph-btn alt" data-pa="ptCancel">' + L('Avbryt spørsmålet', 'Cancel the ask') + '</button>' : '') + '</div>';
    }
    if (!distress()) return '';
    return '<div class="ph-card"><h4>' + L('Spør andre spillere', 'Ask other players') + '</h4><p>' + L('Spillere innenfor 30 nm får se at du trenger slep. Det er gratis for deg. Tar ingen det innen 20 minutter, kommer redningsskøyta.', 'Players within 30 nm see that you need a tow. It is free for you. If nobody takes it within 20 minutes, the rescue boat comes.') +
      '</p><button class="ph-btn p" data-pa="ptAsk">' + L('Spør om slep', 'Ask for a tow') + '</button></div>';
  }
  function act(a){ if (a === 'ptAsk') ask(); else if (a === 'ptCancel') giveUp(); return false; }
  setInterval(tick, 15000);
  return {ask, giveUp, take, hook, drop, docked, dockItem, svg, tap, card4phone, act, tick, _P:P};
})();
