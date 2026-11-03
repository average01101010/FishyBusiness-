// ---------- Ukas fangst: the Sunday card (core/09n-ukas.js; docs/planer/oppdrag-2.md U1) ----------
// The card comes by itself when it is due and the screen is free (not during the first trip, not over another dialog), once a week; the
// Sesong app has the week so far and the last card. From the cloud, when signed in: the place on the leaderboard (world_top), the
// fiskarlag's week with the neighbours in the harbour (lag_get) and the shared season's board (ev_top). «Del som bilde» draws the card
// on a picture and hands it to the phone's share sheet (or saves it where sharing files is not offered).
const UKC = {lag:{}, open:null};
const UL = (no, en) => S.lang === 'en' ? en : no;
const ukeCloud = () => typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest());
const ukeGrp = () => { try { return access() === 'lukket' ? 'lukket' : 'open'; } catch (e){ return 'open'; } };
const ukeEsc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const ukeT = kg => kg >= 1000 ? fmt(kg / 1000, 1) + ' ' + UL('tonn', 'tonnes') : fmt(kg, 0) + ' kg';
// the fiskarlag's week w (lag_get with the week), fetched once a minute at most
function ukeLag(w){
  if (!ukeCloud()) return null;
  const e = UKC.lag[w] || (UKC.lag[w] = {at:0, data:null, busy:false, err:false});
  if (!e.busy && Date.now() - e.at > 60000){ e.busy = true; const p = S.boat.pos;
    cloudRpc('lag_get', {w, x:+p.x.toFixed(3), y:+p.y.toFixed(3)}).then(d => { e.data = d; e.err = false; }).catch(() => { e.err = true; }).finally(() => { e.busy = false; e.at = Date.now(); ukeRedraw(); }); }
  return e;
}
// the shared events that ran some of week w, with the player's place on each board
function ukeEvents(w){
  if (typeof EVENTS === 'undefined' || typeof evTop !== 'function') return [];
  const H0 = w * 168, H1 = H0 + 168, out = [];
  for (const e of EVENTS){ const D = evDays(e, yearH(H0 + 84)); if (D.H1 <= H0 || D.H0 >= H1) continue; const t = evTop(e.id, D.y); out.push({e, y:D.y, t}); }
  return out;
}
const UKE_DAYS = [['mandag', 'Monday'], ['tirsdag', 'Tuesday'], ['onsdag', 'Wednesday'], ['torsdag', 'Thursday'], ['fredag', 'Friday'], ['lørdag', 'Saturday'], ['søndag', 'Sunday']];
// the card's lines: [label, text] in order; the cloud's lines only when they have come
function ukeLines(w){
  const s = ukeSum(w), L = [], spN = sp => SPECIES[sp] ? UL(SPECIES[sp].no, SPECIES[sp].en).toLowerCase() : sp;
  L.push(['', '<b class="uk-big">' + ukeT(s.kg) + '</b> ' + UL('levert', 'landed') + ' · ' + kr(s.kr) + ' · ' + s.n + ' ' + UL(s.n === 1 ? 'levering' : 'leveringer', s.n === 1 ? 'landing' : 'landings')]);
  if (s.best >= 0) L.push([UL('Beste dag', 'Best day'), UL(UKE_DAYS[s.best][0], UKE_DAYS[s.best][1]) + ', ' + ukeT(s.bestKg)]);
  if (s.big) L.push([UL('Største fisk', 'Biggest fish'), spN(s.big.sp) + UL(' på ', ' of ') + fmt(s.big.kg, 1) + ' kg']);
  if (s.sp.length) L.push([UL('Fangsten', 'The catch'), s.sp.slice(0, 3).map(([sp, k]) => spN(sp) + ' ' + ukeT(k)).join(', ')]);
  if (s.ports.length) L.push([UL('Levert til', 'Landed at'), s.ports.slice(0, 3).map(([p]) => ukeEsc((portById(p) || {}).name || p)).join(', ') + (s.ports.length > 3 ? UL(' og ', ' and ') + (s.ports.length - 3) + UL(' til', ' more') : '')]);
  const kk = [s.kk.mottak ? s.kk.mottak + UL(s.kk.mottak === 1 ? ' nytt mottak' : ' nye mottak', s.kk.mottak === 1 ? ' new plant' : ' new plants') : '', s.kk.omr ? s.kk.omr + UL(s.kk.omr === 1 ? ' nytt område' : ' nye områder', s.kk.omr === 1 ? ' new area' : ' new areas') : '', s.kk.fyr ? s.kk.fyr + UL(s.kk.fyr === 1 ? ' nytt fyr' : ' nye fyr', s.kk.fyr === 1 ? ' new lighthouse' : ' new lighthouses') : ''].filter(Boolean);
  if (kk.length) L.push([UL('Kystkartet', 'The coast map'), kk.join(', ')]);
  if (ukeCloud()){
    const top = typeof worldTop === 'function' ? worldTop(w, ukeGrp()) : null, m = top && top.data && top.data.mine;
    if (m) L.push([UL('Topplista', 'The leaderboard'), UL('plass ', 'place ') + m.rank + UL(' av ', ' of ') + (top.data.n || '?') + ' ' + (ukeGrp() === 'lukket' ? UL('i lukket gruppe', 'in the closed group') : UL('i åpen gruppe', 'in the open group'))]);
    const lg = ukeLag(w), d = lg && lg.data;
    if (d && d.port){ const nm = (portById(d.port) || {}).name || d.port, goal = d.goal || 0, act = d.active != null ? d.active : (d.members || []).filter(x => x.kg > 0).length;
      L.push([UL('Fiskarlaget i ' + ukeEsc(nm), 'The fishing club of ' + ukeEsc(nm)), ukeT(d.kg || 0) + (goal ? UL(' av ', ' of ') + ukeT(goal) : '') + ', ' + act + UL(' båter leverte', ' boats landed') + (d.hit || (goal && d.kg >= goal) ? UL('. Målet ble nådd.', '. The goal was reached.') : '.')]);
      const nb = (d.members || []).filter(x => !x.me && x.kg > 0).slice(0, 3);
      if (nb.length) L.push([UL('Naboene', 'The neighbours'), nb.map(x => ukeEsc(x.user ? peerName(x.user) : UL('en båt', 'a boat')) + ' ' + ukeT(x.kg)).join(', ')]); }
    for (const v of ukeEvents(w)){ const dm = v.t && v.t.data && v.t.data.mine; if (dm) L.push([UL(v.e.no, v.e.en) + ' ' + v.y, UL('nummer ', 'number ') + dm.rank + UL(' med ', ' with ') + ukeT(dm.kg)]); }
  }
  return L;
}
// the week's dates: Monday to Sunday
function ukeDates(w){ const a = gDate(w * 168), b = gDate(w * 168 + 156), mo = S.lang === 'en' ? MONS.en : MONS.no;
  return a.getUTCMonth() === b.getUTCMonth() ? a.getUTCDate() + '.–' + b.getUTCDate() + '. ' + mo[b.getUTCMonth()] : a.getUTCDate() + '. ' + mo[a.getUTCMonth()] + '–' + b.getUTCDate() + '. ' + mo[b.getUTCMonth()]; }
function ukeHtml(w){
  return '<div class="ob ukc" id="ukeCard"><p class="reg-from">' + UL('Ukas fangst', 'The week\'s catch') + ' · ' + ukeDates(w) + '</p><h2>' + ukeEsc(S.boatName || UL('Båten din', 'Your boat')) + '</h2>' +
    '<dl class="uk-l">' + ukeLines(w).map(([k, v]) => (k ? '<dt>' + k + '</dt>' : '') + '<dd' + (k ? '' : ' class="uk-top"') + '>' + v + '</dd>').join('') + '</dl>' +
    (ukeCloud() ? '' : '<p class="ph-note">' + UL('Logg inn for å se plassen din på topplista og fiskarlagets uke.', 'Sign in to see your place on the leaderboard and the fishing club\'s week.') + '</p>') +
    '<div class="btns"><button class="btn" data-close>' + UL('Lukk', 'Close') + '</button><button class="btn primary" id="ukeShare">' + UL('Del som bilde', 'Share as a picture') + '</button></div></div>';
}
// the card in the dialog; drawn again when the cloud's numbers come
function ukeShow(w){
  UKC.open = w; modal(ukeHtml(w)); ukeBind(w);
  if (typeof cloudEv === 'function') cloudEv('uke_card', {w, kg:ukeSum(w).kg});
}
function ukeBind(w){ const b = document.getElementById('ukeShare'); if (b) b.onclick = () => ukeShare(w); }
function ukeRedraw(){
  const el = document.getElementById('ukeCard'), m = $('modal'); if (el && m && !m.hidden && UKC.open != null){ el.outerHTML = ukeHtml(UKC.open); m.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => { m.hidden = true; }; }); ukeBind(UKC.open); }
  if (typeof PHONE !== 'undefined' && PHONE.isOpen() && PHONE.app === 'sesong') PHONE.render();
}
// when due and the screen is free: once (S.uke.seen); not in the automated tests unless they ask (window.__ukeOn)
function ukeTick(){
  if (!S || typeof ukeDue !== 'function') return;
  if (typeof NOTUT !== 'undefined' && NOTUT && !window.__ukeOn) return;
  if (typeof tutOn === 'function' && tutOn()) return;
  const m = $('modal'); if (m && !m.hidden) return;
  const w = ukeDue(); if (w == null) return;
  ukeState().seen = w; ukeShow(w); setTimeout(ukeRedraw, 2500); save();
}
// the Sesong app: the week so far, and the last card
function ukeSesongCard(H){
  const w = weekOf(H), s = ukeSum(w), lw = ukeLast(), ls = lw >= 0 && lw !== w ? ukeSum(lw) : null;
  return '<div class="ph-card"><h4>' + UL('Ukas fangst', 'The week\'s catch') + '</h4><p>' + (s.kg > 0 ? UL('Så langt denne uka: ', 'So far this week: ') + '<b>' + ukeT(s.kg) + '</b>, ' + kr(s.kr) + '.' : UL('Ingenting levert denne uka ennå.', 'Nothing landed this week yet.')) + '</p>' +
    '<p class="ph-note">' + UL('Kortet med uka kommer søndag kveld.', 'The card with the week comes on Sunday evening.') + '</p>' +
    (lw === w && s.kg > 0 ? '<button class="ph-btn p" data-pa="ukecard" data-w="' + w + '">' + UL('Se ukas kort', 'See the week\'s card') + '</button>' : ls && ls.kg > 0 ? '<button class="ph-btn" data-pa="ukecard" data-w="' + lw + '">' + UL('Se kortet for forrige uke', 'See last week\'s card') + '</button>' : '') + '</div>';
}
// ---- the picture: the card drawn on a canvas, 1080 x 1350, shared as a file or saved ----
function ukeCanvas(w){
  const cv = document.createElement('canvas'), W = 1080, H = 1350; cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0d2a3d'); bg.addColorStop(1, '#123f57'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const font = (wt, px) => wt + ' ' + px + 'px ' + (getComputedStyle(document.body).getPropertyValue('--sans') || 'sans-serif');
  const strip = h => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  const wrap = (t, x, y, maxW, lh) => { const words = t.split(' '); let line = ''; for (const wd of words){ const tt = line ? line + ' ' + wd : wd; if (g.measureText(tt).width > maxW && line){ g.fillText(line, x, y); y += lh; line = wd; } else line = tt; } if (line) g.fillText(line, x, y); return y + lh; };
  g.fillStyle = '#c9a227'; g.font = font(700, 34); g.fillText(UL('UKAS FANGST', 'THE WEEK\'S CATCH') + ' · ' + ukeDates(w).toUpperCase(), 80, 120);
  g.fillStyle = '#ffffff'; g.font = font(700, 72); let y = wrap(S.boatName || UL('Båten din', 'Your boat'), 80, 210, W - 160, 80);
  y += 20;
  for (const [k, v] of ukeLines(w)){
    if (!k){ g.fillStyle = '#ffffff'; g.font = font(700, 54); y = wrap(strip(v), 80, y + 20, W - 160, 64) + 16; continue; }
    if (y > H - 170) break;
    g.fillStyle = '#8fc7e4'; g.font = font(600, 30); g.fillText(strip(k).toUpperCase(), 80, y); y += 44;
    g.fillStyle = '#e7f4ee'; g.font = font(500, 40); y = wrap(strip(v), 80, y, W - 160, 50) + 22;
  }
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = font(600, 30); g.fillText('Det Store Blå · detstorebla.no', 80, H - 70);
  return cv;
}
function ukeShare(w){
  const cv = ukeCanvas(w), name = 'ukas-fangst-' + w + '.png';
  cv.toBlob(async b => { if (!b) return;
    if (typeof cloudEv === 'function') cloudEv('uke_share', {w});
    try { const f = new File([b], name, {type:'image/png'});
      if (navigator.canShare && navigator.canShare({files:[f]})){ await navigator.share({files:[f], title:UL('Ukas fangst', 'The week\'s catch')}); return; } } catch (e){ if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast(UL('Bildet er lagret.', 'The picture is saved.')); }, 'image/png');
}
setInterval(() => { try { if (typeof SIMREADY !== 'undefined' && SIMREADY) ukeTick(); } catch (e){ console.warn('uke', e); } }, 15000);
