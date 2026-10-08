// ===== PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and
// supabase/functions/push-send) =====
// The player turns them on in Settings, on the account card: only signed in, in the app (it has the service worker), and only once
// Jonas has made the VAPID keys (push-send then gives the public key; until then the switch is not shown). The game is played here,
// so the server cannot know what happens in it: when the app goes to the background, pushItems() works out what will happen while it
// is away and when that is in real time (the clock runs on at GAME_RATE while the game is closed, up to CATCHUP_CAP: 08-actions.js),
// and push_plan lays it out on the server; back in the app the plan is cleared, so nothing comes while you play. Only what matters
// (Jonas 05.10.2026: «Varselet må ha betydning», «Vi skal sende 4 pushvarsel i døgnet»), each in a group the player may turn off
// (S.settings.pushCat), and each with the time it stops mattering (exp); the server sends at most four a day, none between 22 and
// 08, and what is due at once as one (supabase/migrations/20261006030000_push_rules.sql). What is told:
// Rules from Jonas 07.10.2026 (docs/push-plan.md): everything tied to the work of the boat, and nothing else. There is no quiet night
// (fishers keep watch at night; a phone's own sleep mode quiets it), no choice of how many (the server's cap follows how much she plays:
// 20261008000000_push_ops.sql push_cap), and the first one comes five minutes after the app was closed at the earliest. What is told:
// - drift: the boat in at her harbour or at the end of her route and waiting, the hold full, the skipper rested, the yard's or the fitting's
//   work done, gear that has soaked long enough (line 10 h, nets 20 h, pots 40 h: 10-gear.js soakHour), fish about to drop a grade, a gale
//   or high waves on the way while the boat is out or gear is in the sea, a skipper or a crew getting tired, a crew about to break the
//   rest rule, and an engine overdue for service
// - uke: the server's one message a week, Norway's best fisher (push_week). No news from Kystposten, no seasons, no quota, no leaderboard.
const PUSH = {key:undefined, last:''};
const PUSH_CATS = [['drift', 'Båten og driften', 'The boat and the work'], ['uke', 'Ukas beste fisker', 'The week\'s best fisher']];
const PUSH_AHEAD = 40 * 60 * GAME_RATE;   // game minutes: what happens in the next 40 real hours (the server takes two days)
const PUSH_WX = 36;                       // game hours ahead for the weather (the forecast does not reach further)
const pushCat = k => !S.settings.pushCat || S.settings.pushCat[k] !== false;
const PUSH_SOAK = {
  line:[10, 'Lina har stått i 10 timer. Nå er det tid for å dra den.', 'The line has soaked for 10 hours. Time to haul it.'],
  garn:[20, 'Garnene har stått i 20 timer. Drar du dem før døgnet er gått, er fisken best.', 'The nets have soaked for 20 hours. Haul them within the day and the fish is at its best.'],
  teine:[40, 'Teinene har stått i 40 timer. Etter to døgn begynner krabben å dø.', 'The pots have soaked for 40 hours. After two days the crabs start to die.']
};
const pushFn = () => CLOUD_CFG.supabaseUrl.replace(/\/$/, '') + '/functions/v1/push-send';
function pushHas(){ return !!(CLOUD.on && CLOUD.user && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window); }
// the VAPID public key from push-send (null: not set up yet)
async function pushKey(){
  if (PUSH.key !== undefined) return PUSH.key;
  try { const r = await fetch(pushFn() + '?key=1'); PUSH.key = r.ok ? ((await r.json()).key || null) : null; } catch (e){ return null; }
  return PUSH.key;
}
const pushB64 = s => { const b = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
// turn on: ask the browser, subscribe with the key, tell the server; null when it went well, else the reason to show
async function pushOn(){
  if (!pushHas()) return cloudL('Varsler virker bare i appen når du er logget inn.', 'Notifications only work in the app while signed in.');
  if (PUSH.key === null) return cloudL('Varslene er ikke satt opp ennå.', 'Notifications are not set up yet.');
  // the browser's question first, while the tap still counts (Safari asks only from a tap, and an await before it can lose it)
  const perm = Notification.permission === 'granted' ? 'granted' : Notification.requestPermission();
  const key = await pushKey(); if (!key) return cloudL('Varslene er ikke satt opp ennå.', 'Notifications are not set up yet.');
  if (await perm !== 'granted') return cloudL('Du må tillate varsler for appen. Det gjøres i nettleserens innstillinger for nettstedet.', 'You must allow notifications for the app, in the browser’s settings for the site.');
  try {
    const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:pushB64(key)});
    const j = sub.toJSON(); await cloudRpc('push_sub', {endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth, lang:S.lang || 'no'});
  } catch (e){ console.error(e); return cloudL('Kunne ikke slå på varsler nå. Prøv igjen.', 'Could not turn on notifications now. Try again.'); }
  S.settings.push = true; save(); try { await cloudRpc('push_prefs', {top:pushCat('uke')}); } catch (e){} return null;
}
async function pushOff(){
  S.settings.push = false; save();
  try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub){ await cloudRpc('push_unsub', {endpoint:sub.endpoint}); await sub.unsubscribe(); } } catch (e){ console.error(e); }
}
// On for new players (Jonas 05.10.2026: «jeg ønsker at varsler skal være på by default for nye brukere»). No page may send
// notifications before the player has said yes to the browser's own question, so where the browser already allows them the game turns
// them on by itself (pushAuto), and else it asks when the first trip is done and after a landing (pushAsk): at most three times, a day
// apart, and never again once the player has said no in the browser or turned them off in Settings (S.settings.push false).
const PUSH_ASKS = 3;
const pushUndecided = () => S.settings.push === undefined && pushHas() && !!PUSH.key;
function pushAuto(){
  if (pushUndecided() && Notification.permission === 'granted') pushOn().then(err => { if (err) console.warn(err); });
}
function pushAsk(){
  if (!pushUndecided() || Notification.permission !== 'default' || tutOn() || !S.boatName) return;
  const a = S.settings.pushAsk || {n:0, at:0}, m = $('modal');
  if (a.n >= PUSH_ASKS || Date.now() - a.at < 20 * 36e5 || !m || !m.hidden) return;
  S.settings.pushAsk = {n:a.n + 1, at:Date.now()}; save();
  modal('<div class="ob"><h2>' + cloudL('Vil du ha beskjed?', 'Shall we let you know?') + '</h2><p>' +
    cloudL('Havet går videre når appen er lukket. Vi sier fra når båten er framme, når lasten er full, når mannskapet blir sliten, når garnet har stått lenge nok og når det blåser opp mens du er ute.', 'The sea goes on while the app is closed. We tell you when the boat is in, when the hold is full, when the crew gets tired, when the nets have soaked long enough and when it blows up while you are out.') +
    '</p><p class="note">' + cloudL('Det første kommer tidligst fem minutter etter at du har lukket appen. Du kan slå det av i Innstillinger.', 'The first one comes five minutes after you close the app at the earliest. You can turn it off in Settings.') + '</p>' +
    '<div class="btns"><button class="btn" id="paNo" data-close>' + cloudL('Ikke nå', 'Not now') + '</button><button class="btn primary" id="paYes" data-close>' + cloudL('Slå på varsler', 'Turn on notifications') + '</button></div></div>');
  $('paYes').addEventListener('click', () => pushOn().then(err => { toast(err || cloudL('Varsler er på.', 'Notifications are on.')); if (PHONE.isOpen()) PHONE.render(); }));
}
// what will happen while the app is away: [{at, exp (ISO), tag, title, body, pri}], soonest first, at most 24; pri 0 matters most
function pushItems(now){
  now = now || Date.now();
  const out = [], L2 = (no, en) => S.lang === 'en' ? en : no, real = T => now + (T - S.t) / GAME_RATE * 60000;
  // T in game minutes (from now on); exp: real hours after it that it still matters
  const add = (T, tag, title, no, en, exp, pri) => { if (!pushCat('drift') || !(T >= S.t) || T - S.t > PUSH_AHEAD) return;
    out.push({at:new Date(real(T)).toISOString(), exp:new Date(real(T) + (exp || 6) * 36e5).toISOString(), tag, title, body:L2(no, en), pri:pri == null ? 3 : pri}); };
  const company = S.company || S.boatName || 'Det Store Blå';
  // the gear in the sea (the company's, S.sets)
  for (const s of S.sets || []){
    const k = PUSH_SOAK[s.kind]; if (!k || s.lost || s.hauling) continue;
    const v = (S.fleet || []).find(x => x.id === s.vid), nm = v ? vget(v, 'boatName') : S.boatName;
    add(s.tSet + k[0] * 60, 'gear-' + s.id, nm || company, k[1], k[2], 6, 2);
  }
  for (const v of (S.fleet && S.fleet.length ? S.fleet : [null])) (v ? withVessel : (vv, f) => f())(v, () => {
    const b = S.boat, nm = S.boatName || 'Det Store Blå', tag = v && v.id || 'b', kg = (S.hold || []).reduce((a, x) => a + x.kg, 0), out_ = b.status !== 'port';
    // a boat on a route, at the end of it (as the route's ETA, 04-panels-instruments.js navOf): at a harbour, a shop or a yard, or out at sea
    const P = S.plan;
    if (P && P.idx < P.wps.length && out_){
      const wps = P.wps.slice(P.idx), last = wps[wps.length - 1], pt = last.port && portById(last.port);
      let km = 0, a = b.pos, fishH = 0; wps.forEach((q, i) => { km += dist(a, q); a = q; if (i && q.fish > 0) fishH += q.fish; });
      const H0 = P.depAt ? Math.max(S.t / 60, P.depAt / 60) : S.t / 60, T = (H0 + km / ((P.speed || 10) * NM) + fishH) * 60;
      if (pt){
        const sv = portServices(pt), here = pt.name;
        if (sv.mottak && (kg > 1 || fishH > 0)) add(T, 'port-' + tag, nm, nm + ' er framme i ' + here + (kg > 1 && !fishH ? ' med ' + fmt(kg, 0) + ' kg fisk' : ' med fangsten') + '. Lever mens fisken er fersk.',
          nm + ' is in at ' + here + (kg > 1 && !fishH ? ' with ' + fmt(kg, 0) + ' kg of fish' : ' with the catch') + '. Land it while the fish is fresh.', 12, 1);
        else add(T, 'port-' + tag, nm, nm + ' er framme i ' + here + ' og venter på deg.', nm + ' is in at ' + here + ' and waits for you.', 12, 1);
      } else add(T, 'end-' + tag, nm, nm + ' er ferdig med ruta og venter på ordre.', nm + ' has finished the route and waits for orders.', 12, 1);
    }
    // the hold full, while jigging (the session's catch so far gives the rate), before the fishing time is out
    if (b.status === 'fishing' && S.fsess && typeof rigJig === 'function' && rigJig() && S.t - S.fsess.t0 >= 20 && S.fsess.kg > 0){
      const rate = S.fsess.kg / ((S.t - S.fsess.t0) / 60), left = capHold() - kg;
      if (left > 1 && rate > 1){ const T = S.t + left / rate * 60; if (b.fishUntil == null || T < b.fishUntil) add(T, 'full-' + tag, nm, 'Lasten på ' + nm + ' er full. Tid for å gå inn.', 'The hold on ' + nm + ' is full. Time to head in.', 6, 1); }
    }
    // fish in the hold about to drop a grade (not while she is on her way in: that is the line above), two game hours before
    if (kg > 20 && !(P && P.idx < P.wps.length)){
      const clean = S.tripBuff && S.tripBuff.hold ? 0.75 : 1; let best = null;
      for (const x of S.hold){ if (x.kg < 20 || SPECIES[x.sp].live) continue;
        const r = (x.bled ? (x.iced ? 0.9 : 3.0) : (x.iced ? 2.2 : 6.0)) * clean, f = x.fresh, nx = f >= 85 ? 85 : f >= 65 ? 65 : f >= 40 ? 40 : f >= 15 ? 15 : null;
        if (nx == null || r <= 0) continue; const T = S.t + (f - nx) / r * 60 - 120;
        if (!best || T < best.T) best = {T, g:grade(f), g2:grade(nx - 0.01)}; }
      if (best) add(Math.max(S.t, best.T), 'fresh-' + tag, nm, 'Fisken i lasterommet går snart ned fra ' + best.g + '- til ' + best.g2 + '-kvalitet. Lever den nå, så får du bedre betalt.',
        'The fish in the hold will soon drop from grade ' + best.g + ' to ' + best.g2 + '. Land it now and you are paid better.', 2, 2);
    }
    // the yard's and the fitting's work done on her
    const yj = (S.jobs || []).filter(j => YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t);
    if (yj.length){ const T = Math.max(...yj.map(j => j.until)), fitOnly = yj.every(j => j.kind === 'fit'), names = yj.map(j => L2(j.no || '', j.en || j.no || '')).filter(Boolean).slice(0, 3).join(', ');
      add(T, 'yard-' + tag, nm, (fitOnly ? 'Monteringen er ferdig' : 'Verftet er ferdig') + (names ? ' med ' + names.toLowerCase() : '') + '. Båten er klar til å gå ut.', (fitOnly ? 'The fitting is done' : 'The yard is done') + (names ? ' with ' + names.toLowerCase() : '') + '. The boat is ready to go out.', 12, 2); }
    // a crew getting tired, and one about to break the rest rule (core/04-crew.js, 14-crewlife.js): while she is out
    if (out_ && S.crew && S.crew.length){
      let tired = null, gap = null;
      for (const c of S.crew){
        if (typeof crewAboard === 'function' && !crewAboard().some(x => x.id === c.id)) continue;
        if (c.fatigue != null && c.fatigue < 70) tired = Math.min(tired == null ? 1e18 : tired, S.t + (70 - c.fatigue) / 4 * 60); else if (c.fatigue != null) tired = S.t;
        const r = typeof restLog === 'function' ? restLog(c) : null; if (r){ let w = 0; for (let i = r.length - 1; i >= 0 && !r[i]; i--) w++; if (w < REST.gap) gap = Math.min(gap == null ? 1e18 : gap, S.t + (REST.gap - w) * 60); else gap = S.t; }
      }
      if (tired != null) add(tired, 'crew-' + tag, nm, 'Mannskapet på ' + nm + ' begynner å bli sliten. Gå inn til kai og la dem hvile.', 'The crew of ' + nm + ' is getting tired. Head in to the quay and let them rest.', 6, 1);
      if (gap != null) add(gap, 'rest-' + tag, nm, 'Mannskapet har jobbet i 14 timer i strekk. Neste time bryter hviletidsreglene.', 'The crew has worked for 14 hours straight. The next hour breaks the rest rule.', 6, 1);
    }
    // an engine overdue for service, while she is out: the risk of a stop grows with every hour (core/05-vessels.js risk)
    if (out_ && typeof svcOverdue === 'function' && svcOverdue() > 0) add(S.t + 60, 'svc-' + tag, nm, 'Motoren på ' + nm + ' er over tid for service. Faren for motorstopp øker på sjøen.', 'The engine on ' + nm + ' is overdue for service. The risk of a stop grows at sea.', 3, 2);
    // a gale or high waves on the way (the boat's own limits, riskLevel) while she is out or her gear is in the sea; two game hours before
    const spots = []; if (out_) spots.push(P && P.wps.length ? P.wps[P.wps.length - 1] : b.pos); for (const s of mySets()) if (s.vid === (v ? v.id : S.cur)){ spots.push(s.a); }
    if (spots.length){
      const H0 = S.t / 60; let hit = null;
      for (let h = 1; h <= PUSH_WX && !hit; h++) for (const q of spots){ const W = windAt(H0 + h), hs = hsAt(q, H0 + h), lvl = riskLevel(W, hs); if (lvl > 0){ hit = {h, W, hs, lvl}; break; } }
      if (hit){ const bf = beaufort(hit.W), wave = fmt(hit.hs, 1); add(Math.max(S.t, (H0 + hit.h - 2) * 60), 'wx-' + tag, nm, (hit.lvl > 1 ? 'Storm' : 'Kuling') + ' på vei: vindstyrke ' + bf + ' og bølger på ' + wave + ' m. ' + nm + ' ligger ute' + (mySets().length ? ', og redskapet står i sjøen' : '') + '.',
        (hit.lvl > 1 ? 'A storm' : 'A gale') + ' is coming: force ' + bf + ' and waves of ' + wave + ' m. ' + nm + ' is out' + (mySets().length ? ' and the gear is in the sea' : '') + '.', 6, 1); }
    }
  });
  // the skipper: rested in the naust or the rorbu, or getting tired at sea (core/15-energy.js)
  if (S.energy != null && typeof restRate === 'function'){
    const b = myBoat(), nm = S.boatName || 'Det Store Blå', rr = restRate(b);
    if (resting() && rr > 0 && S.energy < 99) add(S.t + (100 - S.energy) / rr, 'rested', nm, 'Du er uthvilt. ' + nm + ' er klar til å gå ut.', 'You are rested. ' + nm + ' is ready to go out.', 12, 3);
    else if (!resting() && rr <= 0 && S.energy > ENERGY.warn && !energyOff()) add(S.t + (S.energy - ENERGY.warn) / ENERGY.sea, 'tired', nm, 'Du er sliten (25 %). Arbeidet går tregere. Ta inn til naustet eller en rorbu for å hvile.', 'You are tired (25 %). Your work slows. Head in to the boathouse or a rorbu to rest.', 6, 1);
  }
  return out.sort((x, y) => x.at < y.at ? -1 : 1).slice(0, 24);
}
// away: lay out what is coming; back: clear it (only sent when it changed)
function pushPlan(away){
  if (!S.settings.push || !pushHas()) return;
  const items = away ? pushItems() : [], sig = JSON.stringify(items);
  if (sig === PUSH.last) return; PUSH.last = sig;
  cloudRpc('push_plan', {items}, {keep:true}).catch(e => { PUSH.last = ''; console.error(e); });
}
function pushStart(){
  if (!pushHas()) return;
  pushKey().then(pushAuto);
  document.addEventListener('visibilitychange', () => pushPlan(document.visibilityState === 'hidden'));
  window.addEventListener('pagehide', () => pushPlan(true));
  pushPlan(false);
}
// the switch on the account card (10f-cloud.js cloudCard): only when it can work; when on, what to be told about
function pushCardRow(){
  if (!pushHas() || !PUSH.key) return '';
  return '<label><span>' + cloudL('Varsler når appen er lukket', 'Notifications while the app is closed') + '</span><input type="checkbox" data-pa="cloudPush"' + (S.settings.push ? ' checked' : '') + '></label>' +
    (S.settings.push ? PUSH_CATS.map(([k, no, en]) => '<label class="sub"><span>' + cloudL(no, en) + '</span><input type="checkbox" data-pa="cloudPushCat" data-k="' + k + '"' + (pushCat(k) ? ' checked' : '') + '></label>').join('') : '') +
    '<p class="ph-note">' + cloudL('Bare det som har med driften å gjøre: båten framme, full last, mannskapet, redskap som har stått lenge, verftet og monteringen ferdig, kuling mens du er ute og uthvilt. Dessuten ett varsel i uka om Norges beste fisker. Det første kommer tidligst fem minutter etter at du har lukket appen.',
      'Only what has to do with the work: the boat in, a full hold, the crew, gear that has soaked long, the yard and the fitting done, a gale while you are out and rested. And one message a week about Norway\'s best fisher. The first one comes five minutes after you close the app at the earliest.') + '</p>';
}
function pushCatToggle(k){
  S.settings.pushCat = Object.assign({}, S.settings.pushCat); S.settings.pushCat[k] = !pushCat(k); save();
  if (k === 'uke') cloudRpc('push_prefs', {top:pushCat('uke')}).catch(e => console.error(e));
  if (PHONE.isOpen()) PHONE.render();
}
function pushToggle(){
  if (S.settings.push){ pushOff().then(() => { toast(cloudL('Varsler er slått av.', 'Notifications are off.')); if (PHONE.isOpen()) PHONE.render(); }); return; }
  pushOn().then(err => { toast(err || cloudL('Varsler er på.', 'Notifications are on.')); if (PHONE.isOpen()) PHONE.render(); });
}
