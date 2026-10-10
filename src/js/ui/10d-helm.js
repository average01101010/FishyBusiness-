// ===== THE HELM ON THE SCREEN (core/16-helm.js; the user's wish 03.10.2026) =====
// In 3D with «Manuell styring» on: a throttle on the right (ahead at the top, neutral in the middle where it clicks in, astern at the
// bottom; it stays where it is left) and a joystick on the left (sideways is the rudder; it springs back to the middle when let go).
// Both are nearly see-through until touched, and fade back a little after. Touching them at sea takes the helm. A button over the
// dock offers «Fortøy» when she is slow by a quay, and «Kast loss» when she lies moored.
const HUI = (() => {
  const wrap = $('mapwrap');
  const thr = document.createElement('div'); thr.id = 'helmThr'; thr.innerHTML = '<i class="ht-f">F</i><i class="ht-n">N</i><i class="ht-b">B</i><b class="ht-k"></b>';
  const joy = document.createElement('div'); joy.id = 'helmJoy'; joy.innerHTML = '<i class="hj-l"></i><i class="hj-r"></i><b class="hj-k"></b>';
  const btn = document.createElement('button'); btn.id = 'helmAct'; btn.type = 'button'; btn.hidden = true;
  wrap.append(thr, joy, btn);
  const knob = thr.querySelector('.ht-k'), jk = joy.querySelector('.hj-k');
  const wake = el => { clearTimeout(el._f); el.classList.add('act'); };
  const rest = el => { clearTimeout(el._f); el._f = setTimeout(() => el.classList.remove('act'), 1500); };
  const PAD = 20;
  // the throttle: the knob follows the finger in steps of 5 %, and within 7 % of the middle it is in neutral
  function thrAt(e){ const r = thr.getBoundingClientRect(), y = clamp((e.clientY - r.top - PAD) / (r.height - 2 * PAD), 0, 1); let v = 1 - 2 * y; if (Math.abs(v) < 0.07) v = 0; return Math.round(v * 20) / 20; }
  thr.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!helmTake()) return; thr.setPointerCapture(e.pointerId); wake(thr); S.helm.thr = thrAt(e); show(); });
  thr.addEventListener('pointermove', e => { if (!thr.hasPointerCapture(e.pointerId) || !S.helm) return; S.helm.thr = thrAt(e); show(); });
  const thrUp = e => { if (thr.hasPointerCapture(e.pointerId)) thr.releasePointerCapture(e.pointerId); rest(thr); };
  thr.addEventListener('pointerup', thrUp); thr.addEventListener('pointercancel', thrUp);
  // the joystick: sideways is the rudder, from hard to port to hard to starboard
  function joyAt(e){ const r = joy.getBoundingClientRect(), R = r.width / 2 - 18; return clamp((e.clientX - r.left - r.width / 2) / R, -1, 1); }
  joy.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!helmTake()) return; joy.setPointerCapture(e.pointerId); wake(joy); S.helm.rud = joyAt(e); show(); });
  joy.addEventListener('pointermove', e => { if (!joy.hasPointerCapture(e.pointerId) || !S.helm) return; S.helm.rud = joyAt(e); show(); });
  const joyUp = e => { if (joy.hasPointerCapture(e.pointerId)) joy.releasePointerCapture(e.pointerId); if (S.helm) S.helm.rud = 0; show(); rest(joy); };
  joy.addEventListener('pointerup', joyUp); joy.addEventListener('pointercancel', joyUp);
  btn.addEventListener('click', e => { e.stopPropagation(); const ok = btn.dataset.a === 'moor' ? helmMoor() : helmCast(); if (ok){ save(); if (typeof refreshAll === 'function') refreshAll(); } tick(); });
  // the knobs where the helm is
  function show(){
    const h = S.helm || {thr:0, rud:0}, H = thr.clientHeight || 210;
    knob.style.top = (PAD + (1 - (h.thr + 1) / 2) * (H - 2 * PAD)) + 'px';
    knob.textContent = h.thr > 0 ? Math.round(h.thr * 100) : h.thr < 0 ? 'B' + Math.round(-h.thr * 100) : 'N';
    knob.classList.toggle('astern', h.thr < 0); knob.classList.toggle('ahead', h.thr > 0);
    const R = (joy.clientWidth || 140) / 2 - 18; jk.style.transform = 'translateX(' + (h.rud * R).toFixed(1) + 'px)';
  }
  // every tick: shown in 3D with the setting on, at sea where the hand can take her; the button where it can be used
  function tick(){
    const on = !!(S.settings && S.settings.manual) && document.body.classList.contains('v3d'), b = S.boat;
    document.body.classList.toggle('helm', on && (helmOn() || helmCan()));
    const moor = on && helmMoorable(), cast = on && b.status === 'port' && !portBusy(b) && !(S.plan && S.plan.depAt);
    btn.hidden = !(moor || cast);
    if (moor){ btn.dataset.a = 'moor'; btn.textContent = (moor.kind === 'port' ? (S.lang === 'no' ? 'Fortøy i ' : 'Moor in ') : (S.lang === 'no' ? 'Fortøy ved ' : 'Moor at ')) + moor.name; }
    else if (cast){ btn.dataset.a = 'cast'; btn.textContent = S.lang === 'no' ? 'Kast loss' : 'Cast off'; }
    if (on) show();
  }
  return {tick, show};
})();
