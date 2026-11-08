// ---------- man overboard on the screen (Ø11.6; the core is core/14b-sikkerhet.js) ----------
// When a hand goes over the side (hooks.onMob 'start'): the alarm (ui/10e-sound.js mobAlarm: the beeps and «O», three long blasts), and
// a red panel at the top with the person, the time in the water against what she can stand, where the MOB mark and the person are
// from the boat (true bearing and metres; the person only while she is seen, mobSeen), the rescue on its way, and the buttons in the
// order of the drill: «MOB» (the mark in the plotter where the boat is now), «Kast livbøya» (when nobody on deck threw it), «Autonav: MOB»
// (the Williamson turn and up to her, or Autonav's own way when the turn would cross land: leiaRoute), and the ways to get her up once
// the boat lies by her (the ladder aft, the lifting sling, the rescue boat from 45 m), greyed with what stands in the way. Steering by
// hand works as always (the helm takes over from Autonav). The chart plotter draws the mark, the line to it, the buoy and the person
// (svg, from ui/03-map.js renderDyn). The calm (ui/10c-dock.js) is kept off while she is in the water. The end shows how it went for a
// while. Between the ticks it tells the core which vessel is followed (MOBF.fol), so a fall happens only on that one.
// Ø11.7: a call on channel 16 from a boat in distress near by (S.sos, hooks.onSos) shows in the same place, orange, with how far off she
// is, the rescue on its way, «Svar: vi kommer» (sosAnswer: the man in the water is then this panel's event, the tow Autonav's way to
// her) and «La være» (another takes it, nothing follows); the chart marks where she called. The Sikkerhet card in the Redning app
// (safetyCard, ui/phone/09-vaer-post-salg-redning.js) lists the near misses (mobSafeRows) and the trips without harm.
const MOBUI = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const U = {el:null, done:null, busy:false, last:'', sounded:null};
  function css(){
    if (document.getElementById('mobCss')) return;
    const s = document.createElement('style'); s.id = 'mobCss';
    s.textContent = '#mobUI{position:fixed;z-index:63;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 96px);width:min(440px,calc(100vw - 16px));box-sizing:border-box;' +
      'padding:10px 12px 12px;border-radius:14px;background:rgba(40,6,8,.9);color:#fff4f2;border:2px solid #ff4b3e;box-shadow:0 8px 28px rgba(0,0,0,.45);font:14px/1.35 var(--sans,system-ui);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
      '#mobUI[hidden]{display:none}#mobUI.ok{background:rgba(8,32,22,.92);border-color:#46c98a}#mobUI.late{background:rgba(36,24,6,.92);border-color:#f0b43a}' +
      '#mobUI.sos{background:rgba(40,22,4,.92);border-color:#ff9f1a}#mobUI.sos .mb-h b{color:#ffc266}#mobUI.sos .mb-k span:nth-child(odd){color:#ffcf8a}#mobUI .mb-n{font-size:12px;color:#ffe0b8;margin-top:6px}' +
      '.sf-l{list-style:none;margin:6px 0 0;padding:0}.sf-l li{padding:7px 0;border-top:1px solid rgba(127,127,127,.25)}.sf-l li:first-child{border-top:0}.sf-l .sf-w{display:block;font-weight:600}.sf-l .sf-d{display:block;font-size:12px;opacity:.75}.sf-l .sf-s{display:block;font-size:12px;margin-top:2px}' +
      '#mobUI .mb-h{display:flex;align-items:center;justify-content:space-between;gap:8px;font:800 17px/1.2 var(--sans,system-ui);letter-spacing:.02em}' +
      '#mobUI .mb-h b{color:#ff7a6e}#mobUI.ok .mb-h b{color:#7ff0b5}#mobUI .mb-t{font:700 16px/1 ui-monospace,Menlo,monospace;padding:3px 8px;border-radius:8px;background:rgba(255,255,255,.12)}' +
      '#mobUI .mb-t.cold{background:#a8231a}#mobUI .mb-s{margin:4px 0 2px;color:#ffd9d4;font-size:13px}#mobUI .mb-k{display:grid;grid-template-columns:auto 1fr;gap:1px 10px;margin:6px 0 8px;font-size:13px}' +
      '#mobUI .mb-k span:nth-child(odd){color:#ffb3aa}#mobUI .mb-b{display:flex;flex-wrap:wrap;gap:6px}#mobUI .mb-b button{flex:1 1 auto;min-height:44px;padding:8px 10px;border-radius:10px;border:0;' +
      'font:700 14px/1.1 var(--sans,system-ui);color:#fff;background:#d8342a;touch-action:manipulation}#mobUI .mb-b button.alt{background:rgba(255,255,255,.16)}#mobUI .mb-b button.go{background:#2f7fd6}' +
      '#mobUI .mb-b button:disabled{opacity:.45}#mobUI .mb-why{flex-basis:100%;font-size:12px;color:#ffc9c2;margin-top:2px}#mobUI .mb-x{background:none;border:0;color:#fff;font:700 18px/1 var(--sans,system-ui);padding:4px 6px}' +
      // (upright under the little chart and the strip, UI 2's zones (styles.css U2-1: --sTop, --mH, --sH), never over the instruments; a phone on
      // its side between the box and the camera buttons)
      '@media (orientation:portrait){#mobUI{top:calc(var(--sTop,8px) + var(--mH,20vh) + var(--sH,62px) + 18px)}}' +
      '@media (orientation:landscape) and (max-height:520px){#mobUI{top:calc(env(safe-area-inset-top,0px) + 8px);width:min(500px,calc(100vw - 2 * (var(--hudW,176px) + 22px)))}#mobUI .mb-b button{min-height:40px;padding:6px 8px}#mobUI .mb-k{margin:4px 0 6px}}';
    document.head.appendChild(s);
  }
  const mine = () => !!(S && S.mob && S.mob.vid === S.cur);
  const here = () => { try { const b = S.boat; return b.status === 'port' ? {p:b.pos, hd:b.heading} : livePose(); } catch (e){ return {p:S.boat.pos, hd:S.boat.heading}; } };
  const frac = () => { try { return liveFrac(); } catch (e){ return 0; } };
  const brg = (a, q) => Math.round(trueDeg(Math.atan2(q.x - a.x, -(q.y - a.y)), a)) % 360;
  const m = (a, q) => Math.round(kmTrue(a, q) * 1000);
  const mmss = min => { const s = Math.max(0, Math.round(min * 60)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  const where = (a, q) => m(a, q) + ' m, ' + String(brg(a, q)).padStart(3, '0') + '°';
  // ---- the actions ----
  function mark(){ if (!mine()) return; mobMark(here().p); save(); draw(true); refreshChart(); }
  function buoy(){ if (!mine()) return; mobThrow(here().p); save(); draw(true); refreshChart(); }
  async function auto(){
    const b = S.boat, M = S.mob; if (!M || U.busy) return;
    if (b.anch){ toast(L('Hiv ankeret først.', 'Weigh the anchor first.')); return; }
    if (b.status === 'engine' || b.status === 'adrift' || b.status === 'aground'){ toast(L('Båten kan ikke manøvrere nå.', 'The boat cannot manoeuvre now.')); return; }
    if (b.gop && typeof gopAbort === 'function') gopAbort(['Halingen er stoppet: mann over bord.', 'Hauling stopped: man overboard.']);
    const r = mobRoute(); if (!r){ toast(L('Sett MOB-merket først.', 'Set the MOB mark first.')); return; }
    let wps = r.wps, kind = r.kind;
    if (!wps && r.to){ U.busy = true; draw(true);
      try { const res = await leiaRoute({x:b.pos.x, y:b.pos.y}, {x:r.to.x, y:r.to.y}, null, null); if (res && res.wps) wps = res.wps.map((q, i) => ({x:q.x, y:q.y, port:null, fish:0, leia:i < res.wps.length - 1})); else toast(L(res && res.why ? res.why[0] : 'Fant ingen vei dit.', res && res.why ? res.why[1] : 'Found no way there.')); }
      catch (e){ console.error(e); toast(L('Fant ingen vei dit.', 'Found no way there.')); }
      U.busy = false; kind = 'leia'; }
    if (!wps || !S.mob) { draw(true); return; }
    if (typeof helmOff === 'function') helmOff();
    if (S.draft && S.draft.length && typeof draftEdit === 'function') draftEdit(() => { S.draft = []; });
    b.fishUntil = null; b.status = 'sailing';
    S.plan = {wps, idx:0, speed:mobSpeed(), full:false, returning:false, unsafe:wps.map(() => false), mob:true};
    log(kind === 'williamson' ? 'Autonav: MOB. Williamson-svingen, så inn til ' + M.name + '.' : 'Autonav: MOB. Kjører inn til ' + M.name + '.', kind === 'williamson' ? 'Autonav: MOB. The Williamson turn, then in to ' + M.name + '.' : 'Autonav: MOB. Running in to ' + M.name + '.', 'nav');
    toast(L('Autonav: MOB', 'Autonav: MOB')); save(); if (typeof refreshAll === 'function') refreshAll(); draw(true);
  }
  function lift(how){ const p = here().p, why = mobLift(how, p, Math.abs(S.boat.v || 0)); if (why) toast(L(why[0], why[1])); else { if (S.plan && S.plan.mob){ S.plan = null; S.boat.status = 'idle'; S.boat.v = 0; } save(); } draw(true); }
  function refreshChart(){ try { if (document.body.classList.contains('vplot')) renderDyn(); } catch (e){} }
  // the call on channel 16 (Ø11.7): answered, the tow gets Autonav's way to her (the man in the water has «Autonav: MOB» in the panel)
  function sosYes(){ const Q = S.sos; if (!Q || Q.ans || Q.vid !== S.cur) return; const r = sosAnswer(); if (!r){ save(); draw(true); refreshChart(); return; }
    if (Q.k === 'eng' && r && r.id != null && typeof turGo === 'function') try { turGo(r.id); } catch (e){ console.warn('sos', e); }
    toast(Q.k === 'eng' ? L('Slepet står i Oppdrag-appen. Autonav går til «' + Q.boat + '».', 'The tow is in the Oppdrag app. Autonav heads for the «' + Q.boat + '».') : L('Vi kommer. MOB-merket er satt der «' + Q.boat + '» meldte.', 'We are coming. The MOB mark is set where the «' + Q.boat + '» reported.'));
    save(); if (typeof refreshAll === 'function') refreshAll(); draw(true); refreshChart(); }
  function sosNo(){ sosDecline(); save(); draw(true); refreshChart(); }
  const sosOn = () => !!(S && S.sos && !S.sos.ans && S.sos.vid === S.cur && S.t < S.sos.until && ['sailing', 'fishing', 'idle'].includes(S.boat.status));
  function bodySos(){
    const Q = S.sos, P = here().p, q = {x:Q.x, y:Q.y}, nmi = kmTrue(P, q) / NM, R = Q.resc, left = Math.max(0, Q.until - S.t - frac()), mob = Q.k === 'mob';
    const h = ['<div class="mb-h"><b>📻 ' + (mob ? 'MAYDAY' : 'PAN-PAN') + ' · VHF 16</b><span class="mb-t" title="' + L('Tid til en annen tar det', 'Time until another takes it') + '">' + mmss(left) + '</span></div>'];
    h.push('<div class="mb-s">«' + esc(Q.boat) + '»: ' + esc(mob ? L('mann over bord, ' + Q.who + ' er i sjøen med vest', 'man overboard, ' + Q.who + ' is in the water in a life jacket') : L('motorstopp, driver mot land i grov sjø', 'engine failure, drifting towards land in a rough sea')) + '</div>');
    const K = [L('Avstand', 'Distance'), fmt(nmi, 1) + ' nm, ' + String(brg(P, q)).padStart(3, '0') + '°', L('Redningen', 'The rescue'), mobWhoR(R, S.lang !== 'no') + ', ' + (R.eta - S.t > 0.5 ? L('framme om ', 'there in ') + Math.ceil(R.eta - S.t) + ' min' : L('framme', 'there'))];
    h.push('<div class="mb-k">' + K.map(esc).map(x => '<span>' + x + '</span>').join('') + '</div>');
    h.push('<div class="mb-b"><button data-mb="sosyes" class="go">' + L('Svar: vi kommer', 'Answer: we are coming') + '</button><button data-mb="sosno" class="alt">' + L('La være', 'Leave it') + '</button></div>');
    h.push('<div class="mb-n">' + esc(L('Lar du det være, tar en annen båt eller redningen det.', 'If you leave it, another boat or the rescue takes it.')) + '</div>');
    return h.join('');
  }
  // ---- the panel ----
  function el(){
    if (U.el) return U.el; css();
    const d = document.createElement('div'); d.id = 'mobUI'; d.hidden = true; d.setAttribute('role', 'alertdialog'); d.setAttribute('aria-live', 'assertive');
    d.addEventListener('click', e => { const q = e.target.closest('[data-mb]'); if (!q || q.disabled) return; const a = q.dataset.mb;
      if (a === 'mark') mark(); else if (a === 'buoy') buoy(); else if (a === 'auto') auto(); else if (a === 'x'){ U.done = null; draw(true); } else if (a === 'sosyes') sosYes(); else if (a === 'sosno') sosNo(); else lift(a); });
    document.body.appendChild(d); return U.el = d;
  }
  const HOWN = {ladder:['Opp leideren akter', 'Up the ladder aft'], sling:['Løftestroppen', 'The lifting sling'], boat:['Sett ut MOB-båten', 'Launch the rescue boat']};
  function body(){
    const M = S.mob, b = S.boat, P = here().p, f = frac(), tIn = S.t + f - M.t0, s = mobSeen(P), pp = mobAt(f), R = M.resc, cold = tIn >= M.lim;
    const h = [];
    h.push('<div class="mb-h"><b>' + L('🆘 MANN OVER BORD', '🆘 MAN OVERBOARD') + '</b><span class="mb-t' + (cold ? ' cold' : '') + '" title="' + L('Tid i sjøen', 'Time in the water') + '">' + mmss(tIn) + '</span></div>');
    h.push('<div class="mb-s">' + esc(M.name) + (M.other ? L(' fra «', ' from the «') + esc(M.other.boat) + '»' : '') + ' · ' + L('sjøen ', 'sea ') + fmt(M.T, 1) + ' °C · ' + (M.st !== 'water' ? L('om bord i MOB-båten', 'aboard the rescue boat') : cold ? L('sterkt nedkjølt, vesten holder ' + mobHim(M) + ' oppe', 'badly chilled, the life jacket keeps ' + mobHim(M, true) + ' up') : L('klarer seg rundt ' + M.lim + ' min', 'lasts about ' + M.lim + ' min')) + '</div>');
    const K = [];
    if (M.st === 'water') K.push(L('Personen', 'The person'), s.p ? L('ser ' + mobHim(M) + ': ', 'in sight: ') + where(P, pp) : L('ser ' + mobHim(M) + ' ikke', 'not in sight'));
    if (M.mark) K.push(L('MOB-merket', 'The MOB mark'), where(P, M.mark));
    if (M.buoy && !M.buoy.held && s.b) K.push(L('Livbøya', 'The lifebuoy'), where(P, M.buoy) + (M.buoy.smoke && S.t - M.buoy.t < MOBK.smoke ? L(', røyker', ', smoking') : ''));
    else if (M.buoy && M.buoy.held) K.push(L('Livbøya', 'The lifebuoy'), L('holder seg i den', 'holding on to it'));
    K.push(L('Redningen', 'The rescue'), (R.k === 'heli' ? L('helikopteret fra ', 'the helicopter from ') : R.org === 'kv' ? L('Kystvakta, ', 'the Coast Guard, ') : L('redningsskøyta fra ', 'the rescue boat from ')) + esc(R.n) + ', ' + (R.eta - S.t - f > 0.5 ? L('framme om ', 'there in ') + Math.ceil(R.eta - S.t - f) + ' min' : L('framme', 'there')));
    if (M.lift){ const LF = M.lift, left = Math.max(0, LF.t1 - S.t - f); K.push(L('Opptaket', 'The lift'), HOWN[LF.how][S.lang === 'no' ? 0 : 1].replace(/^Sett ut |^Launch /, '') + ', ' + mmss(left) + L(' igjen', ' left')); }
    h.push('<div class="mb-k">' + K.map(esc).map((x, i) => '<span>' + x + '</span>').join('') + '</div>');
    const B = [], W = [];
    if (!M.mark) B.push('<button data-mb="mark">' + L('MOB', 'MOB') + '</button>');
    if (!M.buoy && M.st === 'water') B.push('<button data-mb="buoy">' + L('Kast livbøya', 'Throw the lifebuoy') + '</button>');
    if (M.st === 'water' && !M.lift) B.push('<button data-mb="auto" class="go"' + (U.busy ? ' disabled' : '') + '>' + (U.busy ? L('Finner veien …', 'Finding the way …') : (S.plan && S.plan.mob ? L('Autonav: MOB på nytt', 'Autonav: MOB again') : L('Autonav: MOB', 'Autonav: MOB'))) + '</button>');
    for (const o of mobLiftOpts(P, Math.abs(b.v || 0))){ B.push('<button data-mb="' + o.how + '" class="alt"' + (o.why ? ' disabled' : '') + '>' + L(...HOWN[o.how]) + '</button>'); if (o.why && !W.length) W.push(L(o.why[0], o.why[1])); }
    if (W.length) B.push('<div class="mb-why">' + esc(W[0]) + '</div>');
    h.push('<div class="mb-b">' + B.join('') + '</div>');
    return h.join('');
  }
  function bodyDone(){
    const D = U.done, ok = D.out === 'own' && !D.late, him = mobHim({sex:D.sex}), himE = mobHim({sex:D.sex}, true), T = D.other ? (D.out === 'own' ? (ok ? L('Tatt opp i tide', 'Picked up in time') : L('Oppe, men nedkjølt', 'Up, but chilled')) : D.out === 'crew' ? L('«' + D.other + '» tok ' + him + ' opp', 'The «' + D.other + '» picked ' + himE + ' up') : L('Redningen hentet ' + him, 'The rescue took ' + himE)) : ok ? L('Tatt opp i tide', 'Picked up in time') : D.out === 'crew' ? L('Mannskapet tok ' + mobHim({sex:D.sex}) + ' opp', 'The crew picked ' + mobHim({sex:D.sex}, true) + ' up') : L('Redningen hentet ' + mobHim({sex:D.sex}), 'The rescue took ' + mobHim({sex:D.sex}, true));
    return '<div class="mb-h"><b>' + esc(T) + '</b><button class="mb-x" data-mb="x" aria-label="' + L('Lukk', 'Close') + '">✕</button></div><div class="mb-s">' + esc(D.text) + '</div>';
  }
  function draw(force){
    const d = el(), on = mine(), done = U.done && performance.now() < U.done.until, call = !on && sosOn();
    if (!on && !done && !call){ if (!d.hidden) d.hidden = true; return; }
    const html = on ? body() : call ? bodySos() : bodyDone(); d.className = on ? '' : call ? 'sos' : U.done.out === 'own' && !U.done.late ? 'ok' : U.done.days > 0 ? 'late' : 'ok';
    if (force || html !== U.last){ U.last = html; d.innerHTML = html; } d.hidden = false;
  }
  // ---- the core's word ----
  function onMob(k, x){
    if (k === 'start'){ U.done = null; try { if (typeof SND !== 'undefined' && SND.mobAlarm) SND.mobAlarm(); } catch (e){}
      if (typeof PHONE !== 'undefined' && PHONE.isOpen && PHONE.isOpen() && PHONE.close) try { PHONE.close(); } catch (e){}
      if (navigator.vibrate) try { navigator.vibrate([300, 120, 300, 120, 600]); } catch (e){}
      toast(L('Mann over bord! ' + x.name + ' er i sjøen.', 'Man overboard! ' + x.name + ' is in the water.'), 6000); }
    else if (k === 'end'){ const last = (S.log || []).slice(-8).find(l => /er oppe|tok .* opp|Mannskapet snudde|fikk .* opp selv/.test(l.no));
      U.done = Object.assign({}, x, {until:performance.now() + 20000, text:last ? L(last.no, last.en) : '', sex:x.sex || 'm'}); }
    draw(true); refreshChart();
  }
  hooks.onMob = onMob;
  hooks.onSos = (k, Q) => { if (k === 'call'){ if (navigator.vibrate) try { navigator.vibrate([200, 100, 200]); } catch (e){}
      toast(L((Q.k === 'mob' ? 'MAYDAY' : 'PAN-PAN') + ' på kanal 16 fra «' + Q.boat + '».', (Q.k === 'mob' ? 'MAYDAY' : 'PAN-PAN') + ' on channel 16 from the «' + Q.boat + '».'), 6000); }
    draw(true); refreshChart(); };
  // ---- the chart plotter (ui/03-map.js renderDyn): the mark, the line to it, the lifebuoy and the person ----
  function svg(u, bp){
    let call = '';
    if (sosOn()){ const Q = S.sos, r = 8 * u;   // (where she called: an orange ring with her name; your own man overboard is drawn as well)
      call = '<circle cx="' + Q.x + '" cy="' + Q.y + '" r="' + r + '" style="fill:rgba(255,159,26,.25);stroke:#ff9f1a" stroke-width="' + (2.2 * u) + '"/>' + txt({x:Q.x + 11 * u, y:Q.y - 8 * u}, (Q.k === 'mob' ? 'MAYDAY ' : 'PAN-PAN ') + esc(Q.boat), 'lbl-ais pl', 12 * u, 'stroke-width="' + (3 * u) + '" style="fill:#ff9f1a"'); }
    const M = S.mob; if (!M || M.vid !== S.cur) return call;
    const g = [call], f = frac(), s = mobSeen(bp), pp = mobAt(f);
    if (M.mark){ const k = M.mark, r = 9 * u;
      g.push('<line x1="' + bp.x + '" y1="' + bp.y + '" x2="' + k.x + '" y2="' + k.y + '" style="stroke:#ff3b30;fill:none" stroke-width="' + (1.6 * u) + '" stroke-dasharray="' + (5 * u) + ' ' + (4 * u) + '"/>');
      g.push('<circle cx="' + k.x + '" cy="' + k.y + '" r="' + r + '" style="fill:rgba(255,59,48,.25);stroke:#ff3b30" stroke-width="' + (2.2 * u) + '"/><path d="M' + (k.x - r) + ',' + k.y + 'h' + (2 * r) + 'M' + k.x + ',' + (k.y - r) + 'v' + (2 * r) + '" style="stroke:#ff3b30" stroke-width="' + (1.4 * u) + '"/>');
      g.push(txt({x:k.x + 12 * u, y:k.y - 8 * u}, 'MOB ' + mmss(S.t + f - M.t0), 'lbl-ais pl', 12 * u, 'stroke-width="' + (3 * u) + '" style="fill:#ff3b30"')); }
    if (M.buoy && s.b && !M.buoy.held) g.push('<circle cx="' + M.buoy.x + '" cy="' + M.buoy.y + '" r="' + (4.5 * u) + '" style="fill:none;stroke:#ff8a00" stroke-width="' + (2.6 * u) + '"/>');
    if (M.st === 'water' && s.p){ g.push('<circle cx="' + pp.x + '" cy="' + pp.y + '" r="' + (5 * u) + '" style="fill:#ffcc00;stroke:#b3261e" stroke-width="' + (1.6 * u) + '"/>');
      if (M.buoy && M.buoy.held) g.push('<circle cx="' + pp.x + '" cy="' + pp.y + '" r="' + (7.5 * u) + '" style="fill:none;stroke:#ff8a00" stroke-width="' + (2.4 * u) + '"/>');
      g.push(txt({x:pp.x + 9 * u, y:pp.y + 14 * u}, esc(M.name.split(' ')[0]), 'lbl-ais pl', 11 * u, 'stroke-width="' + (3 * u) + '"')); }
    return g.join('');
  }
  // the person's bearing in the boat's own frame (rad, 0 ahead, + to starboard), for the hand who keeps her in sight (deckcrew.js)
  function spot(){ const M = S.mob; if (!M || M.vid !== S.cur || M.st !== 'water') return null; const q = here(), p = mobAt(frac()); let a = Math.atan2(p.x - q.p.x, -(p.y - q.p.y)) - q.hd; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  setInterval(() => { try { if (!S || !S.boat) return; MOBF.fol = S.cur; const on = mine();
    if ((on || sosOn()) && typeof DOCK !== 'undefined' && DOCK.wake) DOCK.wake('mob');
    if (on || sosOn() || (U.el && !U.el.hidden)) draw(false); } catch (e){ console.warn('mob', e); } }, 250);
  // ---- the Sikkerhet card in the Redning app (Ø11.7 SK6): the near misses with the day, the place, what each teaches and its source,
  // and the trips without harm (a count that only grows) ----
  function safetyCard(){
    const rows = mobSafeRows(25), en = S.lang !== 'no', safe = typeof achC === 'function' ? achC('safe') : 0;
    const day = t => { const d = gDate(t / 60), M = typeof MONS !== 'undefined' ? MONS[en ? 'en' : 'no'][d.getUTCMonth()] : String(d.getUTCMonth() + 1); return (en ? M + ' ' + d.getUTCDate() : d.getUTCDate() + '. ' + M) + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
    const where = r => { try { const q = nearestPlace({x:r.x, y:r.y}); return en ? q.en : q.no; } catch (e){ return ''; } };
    const h = ['<div class="ph-card" id="safetyCard"><h4>' + L('Sikkerhet', 'Safety') + '</h4><p>' + L(safe === 1 ? 'Én tur uten skade.' : safe + ' turer uten skade.', safe === 1 ? 'One trip without harm.' : safe + ' trips without harm.') + '</p>'];
    if (!rows.length) h.push('<p class="ph-note">' + L('Ingen nestenulykker ennå. Passeringer for nær, grunt vann forut, sjø over ripa, nødstopp og mann over bord samles her, med hva hver av dem lærer.', 'No near misses yet. Passings too close, shallow water ahead, seas over the rail, emergency stops and man overboard gather here, with what each teaches.') + '</p>');
    else h.push('<ul class="sf-l">' + rows.map(r => { const w = where(r); return '<li data-k="' + r.k + '"><span class="sf-d">' + esc(day(r.t)) + (w ? ', ' + esc(w) : '') + '</span><span class="sf-w">' + esc(r.what[en ? 1 : 0]) + '</span><span class="sf-s">' + esc(r.learn[en ? 1 : 0]) + ' <i>(' + esc(r.learn[en ? 3 : 2]) + ')</i></span></li>'; }).join('') + '</ul>');
    h.push('</div>'); return h.join('');
  }
  return {svg, spot, draw, mark, buoy, auto, lift, safetyCard, sosYes, sosNo, _U:U};
})();
