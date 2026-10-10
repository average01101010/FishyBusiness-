// ---------- Merker: what the player sees of «Første uke på sjøen» and the long badges (core/09f-merker.js) ----------
// A milestone shows as a short banner at the top with its gift (it does not take taps: the game goes on under it); a finished
// chapter as a card with its reward; a played game's first check as one card with all it was ticked for. The phone's Merker app has
// the week's chapters (the open ones with their milestones and gifts, the next one's titles locked), the long badges with the sea
// time, and the tattoos, the record fish and the old ways (the Milepæler app since 09.10.2026). The home screen's chip shows the week's count and the nearest milestone.
const AL = (no, en) => S.lang === 'en' ? en : no;
const ACHQ = [];
let ACHQ_ON = false;
function achShow(fresh){
  if (!achLive()) return;
  const items = fresh.filter(f => f.a || f.long), chs = fresh.filter(f => f.ch != null);
  // many at once (a played game, or a chapter opening with several taken): one card
  if (items.length >= 3){ achCard(AL('Første uke på sjøen', 'The first week at sea'), AL('Dette har du allerede gjort, og gavene ligger klare:', 'This you have already done, and the gifts are ready:'), items); }
  else for (const f of items) ACHQ.push(f);
  for (const c of chs) achChapterCard(c.ch);
  achPump();
}
function achPump(){
  if (ACHQ_ON || !ACHQ.length) return; ACHQ_ON = true;
  const f = ACHQ.shift(); let el = document.getElementById('achPop');
  if (!el){ el = document.createElement('div'); el.id = 'achPop'; el.className = 'achpop'; document.body.appendChild(el); }
  const name = f.a ? AL(f.a.n[0], f.a.n[1]) : AL(f.long.n[0], f.long.n[1]) + ' · ' + achTierTxt(f.long, f.tier);
  const gift = f.g ? AL(f.g.t[0], f.g.t[1]) : AL('En gave venter på kaia etter første tur.', 'A gift waits on the quay after the first trip.');
  el.className = 'achpop on t' + (f.g ? f.g.tier : 0);
  el.innerHTML = '<b>' + (f.a ? '✓ ' : '★ ') + name + '</b><span>' + gift + '</span>';
  setTimeout(() => { el.className = 'achpop'; setTimeout(() => { ACHQ_ON = false; achPump(); }, 450); }, 4800);
}
const achGiftTxt = id => { const g = S.ach && S.ach.g[id]; return g && g[0] ? AL(g[0], g[1]) : ''; };
const achTierTxt = (L0, i) => L0.unit === 'kr' ? kr(L0.tiers[i]) : fmt(L0.tiers[i], 0) + (L0.unit ? ' ' + (L0.unit === 'år' ? AL('år', 'years') : L0.unit) : '');
// a card that waits for the screen to be free (no other dialog, the first trip over)
function achWhenFree(f){ const go = () => { const m = document.getElementById('modal'); if ((typeof tutOn === 'function' && tutOn()) || (m && !m.hidden)){ setTimeout(go, 4000); return; } f(); }; setTimeout(go, 1500); }
function achCard(title, lead, items){
  achWhenFree(() => { modal('<div class="ob achc"><h2>' + title + '</h2><p>' + lead + '</p><ul class="ach-list">' +
    items.map(f => '<li><b>' + (f.a ? AL(f.a.n[0], f.a.n[1]) : AL(f.long.n[0], f.long.n[1]) + ' · ' + achTierTxt(f.long, f.tier)) + '</b>' + (f.g ? '<span>' + AL(f.g.t[0], f.g.t[1]) + '</span>' : '') + '</li>').join('') + '</ul>' +
    '<div class="btns"><button class="btn" data-close>' + AL('Videre', 'Carry on') + '</button><button class="btn primary" data-close id="achOpen">' + AL('Åpne Merker', 'Open Badges') + '</button></div></div>');
    document.getElementById('achOpen').addEventListener('click', () => { PHONE.show(true); PHONE.open('merker'); }); });
}
function achChapterCard(ch){
  const rew = [AL('Vimpelen er din. Den henger i masta på båter med mast, og andre spillere ser den.', 'The pennant is yours. It flies from the mast of a boat with a mast, and other players see it.'),
    AL('Vimpelen blir lengre, og en haill ligger om bord.', 'The pennant grows longer, and a luck is aboard.'),
    AL('Vimpelen blir enda lengre, og skrogfargen «Kystfisker» er din i Malerverkstedet. Merkene går videre, uten slutt.', 'The pennant grows longer still, and the hull colour «Kystfisker» is yours in the paint shop. The badges go on, without end.')][ch];
  const next = ch + 1 < ACH_CH.length ? '<p class="ph-note">' + AL('Neste kapittel: «' + ACH_CH[ch + 1][0] + '».', 'Next chapter: «' + ACH_CH[ch + 1][1] + '».') + '</p>' : '';
  achWhenFree(() => { modal('<div class="ob achc"><p class="reg-from">' + AL('Kapittel ' + (ch + 1) + ' fullført', 'Chapter ' + (ch + 1) + ' complete') + '</p><h2>' + AL(ACH_CH[ch][0], ACH_CH[ch][1]) + '</h2><div class="ach-pen p' + (ch + 1) + '"></div><p>' + rew + '</p>' + next +
    '<div class="btns"><button class="btn primary" data-close id="achOpen">' + AL('Åpne Merker', 'Open Badges') + '</button></div></div>');
    document.getElementById('achOpen').addEventListener('click', () => { PHONE.show(true); PHONE.open('merker'); }); });
}
// ---- the Merker app's pages (ui/05-phone.js merker) ----
function achWeek(){
  achState(); const h = [], nD = ACH.filter(a => achDone(a.id)).length;
  h.push('<div class="ph-card"><h4>' + AL('Første uke på sjøen', 'The first week at sea') + '</h4><div class="ph-big">' + nD + ' / ' + ACH.length + '</div><p class="ph-note">' +
    AL('Tre kapitler med sju milepæler. Hver gir en gave, og hvert kapittel sin egen belønning. Fem av sju åpner neste kapittel. Ingenting går ut på dato.', 'Three chapters of seven milestones. Each gives a gift, and each chapter its own reward. Five of seven open the next chapter. Nothing runs out.') + '</p></div>');
  for (let ch = 0; ch < ACH_CH.length; ch++){
    const list = achInCh(ch), n = achNDone(ch), open = achOpen(ch), done = !!(S.ach && S.ach.ch[ch]);
    const rew = [AL('Vimpel i masta', 'A pennant at the mast'), AL('Lengre vimpel og en haill', 'A longer pennant and a luck'), AL('Enda lengre vimpel og skrogfargen «Kystfisker»', 'A longer pennant still and the hull colour «Kystfisker»')][ch];
    h.push('<div class="ph-card ach-ch' + (open ? '' : ' locked') + '"><h4>' + AL('Kapittel ', 'Chapter ') + (ch + 1) + ' · ' + AL(ACH_CH[ch][0], ACH_CH[ch][1]) + (done ? ' ✓' : '') + '</h4>' +
      (open ? '<span class="gb fsbar"><i style="width:' + Math.round(n / list.length * 100) + '%"></i></span><p class="ph-note">' + n + ' / ' + list.length + ' · ' + AL('Belønning: ', 'Reward: ') + rew + '</p>'
        : '<p class="ph-note">' + AL('Åpnes når fem av sju i kapittelet før er tatt.', 'Opens when five of seven in the chapter before are taken.') + '</p>'));
    for (const a of list){
      const d = achDone(a.id), hide = a.hid && !d;
      if (!open){ h.push('<div class="ach-it lock"><span class="ck">·</span><b>' + (hide ? '???' : AL(a.n[0], a.n[1])) + '</b></div>'); continue; }
      const r = a.p(), num = Array.isArray(r) && !d ? '<small>' + (r[1] >= 1000 ? fmt(Math.min(r[0], r[1]), 0) + ' / ' + fmt(r[1], 0) : Math.min(r[0], r[1]) + ' / ' + r[1]) + '</small><span class="gb"><i style="width:' + Math.round(achProg(a) * 100) + '%"></i></span>' : '';
      h.push('<div class="ach-it' + (d ? ' done' : '') + '"><span class="ck">' + (d ? '✓' : '○') + '</span><div><b>' + (hide ? '???' : AL(a.n[0], a.n[1])) + '</b>' +
        (hide ? '<small>' + AL(a.h[0], a.h[1]) + '</small>' : '') + num + (d && achGiftTxt(a.id) ? '<small class="gift">' + achGiftTxt(a.id) + '</small>' : '') + '</div></div>');
    }
    h.push('</div>');
  }
  return h.join('');
}
function achLong(){
  achState(); const h = ['<div class="ph-card"><h4>' + AL('Merker', 'Badges') + '</h4><p class="ph-note">' + AL('Merkene går videre så lenge du fisker. Hvert trinn gir en gave.', 'The badges go on as long as you fish. Each step gives a gift.') + '</p></div>'];
  for (const L0 of ACHL){
    const got = (S.ach.l || {})[L0.id] || 0, v = L0.v(), nx = L0.tiers[got], prev = got ? L0.tiers[got - 1] : 0;
    const pc = nx == null ? 1 : clamp((v - prev) / (nx - prev), 0, 1), val = L0.unit === 'kr' ? kr(v) : fmt(v, L0.unit === 't' ? 1 : 0) + (L0.unit ? ' ' + (L0.unit === 'år' ? AL('år', 'years') : L0.unit) : '');
    h.push('<div class="ph-card ach-l"><h4>' + AL(L0.n[0], L0.n[1]) + ' <span class="stars">' + '★'.repeat(got) + '<i>' + '★'.repeat(L0.tiers.length - got) + '</i></span></h4>' +
      '<span class="gb"><i style="width:' + Math.round(pc * 100) + '%"></i></span><p class="ph-note">' + val + (nx != null ? ' · ' + AL('neste: ', 'next: ') + achTierTxt(L0, got) : ' · ' + AL('alle trinn tatt', 'every step taken')) + '</p></div>');
  }
  return h.join('');
}
// the home screen's chip while the week is on: the count and the nearest milestone
function achChip(){
  achState(); if (S.ach.ch[2]) return '';
  const nD = ACH.filter(a => achDone(a.id)).length; let best = null;
  for (let ch = 0; ch < ACH_CH.length; ch++){ if (!achOpen(ch)) break; for (const a of achInCh(ch)){ if (achDone(a.id) || a.hid) continue; const p = achProg(a); if (!best || p > best.p) best = {a, p}; } }
  return '<button class="ph-goal ph-ach" data-pa="open" data-a="merker"><span>' + AL('Første uke: ', 'First week: ') + '<b>' + nD + ' / ' + ACH.length + '</b></span><small>' + (best ? AL('Neste: ', 'Next: ') + AL(best.a.n[0], best.a.n[1]) : AL('Se Merker', 'See Badges')) + '</small><span class="gb"><i style="width:' + Math.round((best ? best.p : 1) * 100) + '%"></i></span></button>';
}
