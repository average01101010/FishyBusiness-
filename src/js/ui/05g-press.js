// ---------- Kystposten on the phone (core/09h-press.js): the front page and the local tab, a story to read on, the unread count on
// the app, a word in the game when one comes, and the stories to and from the cloud (supabase/migrations/20261007170000_news.sql) ----------
const PRESS_KIND = {boat:['Båtkjøp', 'Boats'], name:['Båtdåp', 'Christening'], aground:['Ulykke', 'Accident'], rescue:['Redning', 'Rescue'], salv:['Berging', 'Salvage'],
  foto:['Fyr', 'Lighthouses'], fish:['Fangst', 'Catch'], fs:['Folk', 'People'], ach:['Folk', 'People'], as:['Næring', 'Business'], tur:['Fiske', 'Fishing'], kvote:['Næring', 'Business'], top:['Toppliste', 'Leaderboard'], land:['Landing', 'Landings'], gen:['Nyheter', 'News']};
const pressL = (s, k) => s[k][S.lang === 'en' ? 1 : 0];
function pressImg(s, small){
  if (!s.img) return '';
  if (s.img.foto != null){ const src = typeof turFotoSrc === 'function' ? turFotoSrc(s.img.foto) : null; return src ? '<img class="ph-foto" alt="" src="' + src + '">' : ''; }
  if (s.img.svg && !small && typeof vesselSVG === 'function'){ try { return '<div class="pa-boat">' + vesselSVG(s.img.svg, 300, 110) + '</div>'; } catch (e){ return ''; } }
  return '';
}
// the list: a day's stories under its date, each a button to read it
function pressPage(local){
  const L0 = (no, en) => S.lang === 'en' ? en : no, list = pressList(local), h = [], hp = portById(S.home || '') || null;
  if (local) h.push('<p class="ph-note pa-loc">' + L0('Saker innen 150 km fra ', 'Stories within 150 km of ') + turEsc(hp ? hp.name : L0('hjemhavna', 'home')) + '.</p>');
  if (!list.length) h.push('<div class="ph-art"><p>' + L0('Ingen nyheter ennå.', 'No news yet.') + '</p></div>');
  let day = null;
  for (const s of list.slice(0, 60)){
    const d = Math.floor(s.t / 1440); if (d !== day){ day = d; h.push('<div class="pa-day">' + dayStr(d * 24) + '</div>'); }
    const ing = pressL(s, 'ing'), short = ing.length > 150 ? ing.slice(0, 140).replace(/\s+\S*$/, '') + ' …' : ing;
    h.push('<button class="ph-art pa-btn' + (s.me ? ' pa-me' : '') + (s.big ? ' pa-big' : '') + '" data-pa="art" data-k="' + turEsc(s.key) + '"><span class="pa-kick">' + pressL(PRESS_KIND, s.kind) + (s.me ? ' · ' + L0('Om deg', 'About you') : '') + '</span>' +
      '<h4>' + turEsc(pressL(s, 'h')) + '</h4>' + (s.img && s.img.foto != null ? pressImg(s, true) : '') + '<p>' + turEsc(short) + '</p><span class="pa-more">' + L0('Les mer ›', 'Read more ›') + '</span></button>');
  }
  return h.join('');
}
function pressArticle(s){
  const L0 = (no, en) => S.lang === 'en' ? en : no;
  return '<div class="pa-art"><button class="ph-btn pa-back" data-pa="artback">‹ ' + L0('Tilbake', 'Back') + '</button><span class="pa-kick">' + pressL(PRESS_KIND, s.kind) + ' · ' + dayStr(s.t / 60) + '</span>' +
    '<h3>' + turEsc(pressL(s, 'h')) + '</h3>' + pressImg(s, false) + '<p class="pa-ing">' + turEsc(pressL(s, 'ing')) + '</p>' + s.body.map(b => '<p>' + turEsc(b[S.lang === 'en' ? 1 : 0]) + '</p>').join('') + '</div>';
}
function pressFind(key){ return pressList(false).concat(pressList(true)).find(x => x.key === key) || null; }
// a word in the game: one's own story as it is printed, and now and then one of the others' (a big one, or one near home)
function pressNotify(s){
  if (!s || typeof toast !== 'function') return; const now = Date.now();
  if (!s.me && now - PRESS.toldAt < 180000) return; PRESS.toldAt = now;
  setTimeout(() => toast('Kystposten: ' + pressL(s, 'h')), s.me ? 4000 : 0);
  if (typeof PHONE !== 'undefined' && PHONE.status) PHONE.status();
}
// to the cloud: the queue of one's own stories (a guest's stay at home); a refused one (400) is dropped
async function pressFlush(){
  const P = pressState(); if (!P.q.length || PRESS.sending || typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user) return;
  if (isGuest()){ P.q = []; return; }
  PRESS.sending = true;
  try { while (P.q.length){ const it = P.own.find(x => x.id === P.q[0]);
      if (it){ try { await cloudRpc('news_put', {kind:it.kind, gh:+(it.t / 60).toFixed(2), x:it.x, y:it.y, boat:it.boat, company:it.company, d:it.d}); } catch (e){ if (!/ 400$/.test(e.message)) throw e; } }
      P.q.shift(); } }
  catch (e){} finally { PRESS.sending = false; }
}
// from the cloud: the others' stories of the last week and the biggest landings of the last day, every three minutes and when the paper
// is opened; a new one that is big or near home is told in the game
async function pressFetch(force){
  if (typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user || PRESS.busy || PRESS.off || (!force && Date.now() - PRESS.at < 60000)) return;
  PRESS.busy = true;
  try { const hp = pressHome(), r = await cloudRpc('news_get', {gh:+(S.t / 60).toFixed(2), x:hp.x, y:hp.y, r:PRESS.R});
    if (r){ const first = !PRESS.at, old = new Set(PRESS.remote.map(x => x.id)); PRESS.remote = r.news || []; PRESS.land = r.land || []; PRESS.at = Date.now();
      // the day's biggest landing is one's own: told once
      const L0 = PRESS.land[0]; if (L0 && L0.me && !PRESS.told['l' + L0.gh]){ PRESS.told['l' + L0.gh] = 1; const s = pressLand(false)[0]; if (s){ s.me = true; pressNotify(s); } }
      if (!first) for (const it of PRESS.remote){ if (old.has(it.id) || it.me) continue; const s = pressStory(it); if (s && (s.big || (s.x != null && dist({x:s.x, y:s.y}, hp) <= PRESS.R))){ pressNotify(s); break; } }
      if (typeof PHONE !== 'undefined' && PHONE.isOpen() && PHONE.app === 'post') PHONE.render(); } }
  catch (e){ if (/ 404$/.test(e.message)) PRESS.off = true; }
  finally { PRESS.busy = false; }
}
function pressStart(){ setTimeout(() => { pressFetch(true); pressFlush(); }, 8000); setInterval(() => pressFetch(false), 180000); setInterval(pressFlush, 120000); }
