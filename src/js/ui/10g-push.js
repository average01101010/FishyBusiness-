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
// - fangst: gear that has soaked long enough (line 10 h, nets 20 h, pots 40 h: after that the catch falls off, 10-gear.js soakHour);
//   fish in a hold about to drop a grade (the freshness falls as in core/05-vessels.js vesselStep); a boat in at a harbour with fish
// - verft: the yard's work on a boat done (core/06-services.js YARD_KINDS)
// - kvote: the Directorate announcing the stop of the open group's fishing, with what is left of your quota (03d-quota.js qyStep)
// - topp: the server's own, when someone passes you on the leaderboard and the week's result (push_prefs)
// - sesong: the seasons' news on their morning (09c-seasons.js), and the skrei festival the day before
const PUSH = {key:undefined, last:''};
const PUSH_CATS = [['fangst', 'Fangst og båter', 'Catch and boats'], ['verft', 'Verftet', 'The yard'], ['kvote', 'Kvoter', 'Quotas'], ['topp', 'Topplista', 'The leaderboard'], ['sesong', 'Sesonger', 'Seasons']];
const PUSH_AHEAD = 40 * 60 * GAME_RATE;   // game minutes: what happens in the next 40 real hours (the server takes two days)
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
  S.settings.push = true; save(); try { await cloudRpc('push_prefs', {top:pushCat('topp')}); } catch (e){} return null;
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
    cloudL('Havet går videre når appen er lukket. Vi sier fra når garnet har stått lenge nok, når fisken i lasterommet snart blir dårligere, når båten er framme med fangst, og når noen går forbi deg på topplista.', 'The sea goes on while the app is closed. We tell you when the nets have soaked long enough, when the fish in the hold is about to lose quality, when the boat is in with the catch, and when someone passes you on the leaderboard.') +
    '</p><p class="note">' + cloudL('Høyst fire i døgnet, aldri mellom 22 og 08. Du velger bort det du ikke vil ha i Innstillinger.', 'At most four a day, never between 22 and 08. You turn off what you do not want in Settings.') + '</p>' +
    '<div class="btns"><button class="btn" id="paNo" data-close>' + cloudL('Ikke nå', 'Not now') + '</button><button class="btn primary" id="paYes" data-close>' + cloudL('Slå på varsler', 'Turn on notifications') + '</button></div></div>');
  $('paYes').addEventListener('click', () => pushOn().then(err => { toast(err || cloudL('Varsler er på.', 'Notifications are on.')); if (PHONE.isOpen()) PHONE.render(); }));
}
// what will happen while the app is away: [{at, exp (ISO), tag, title, body}], soonest first, at most 24
function pushItems(now){
  now = now || Date.now();
  const out = [], L2 = (no, en) => S.lang === 'en' ? en : no, real = T => now + (T - S.t) / GAME_RATE * 60000;
  // T in game minutes; exp: real hours after it that it still matters
  const add = (cat, T, tag, title, no, en, exp) => { if (!pushCat(cat) || !(T > S.t) || T - S.t > PUSH_AHEAD) return;
    out.push({at:new Date(real(T)).toISOString(), exp:new Date(real(T) + (exp || 6) * 36e5).toISOString(), tag, title, body:L2(no, en)}); };
  const MN = S.lang === 'en' ? ['January','February','March','April','May','June','July','August','September','October','November','December'] : ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
  const dayStr = (y, d) => { const t = new Date(Date.UTC(y, 0, 1 + d)); return t.getUTCDate() + (S.lang === 'en' ? ' ' : '. ') + MN[t.getUTCMonth()]; };
  // the gear in the sea (the company's, S.sets)
  for (const s of S.sets || []){
    const k = PUSH_SOAK[s.kind]; if (!k || s.lost || s.hauling) continue;
    const v = (S.fleet || []).find(x => x.id === s.vid), nm = v ? vget(v, 'boatName') : S.boatName;
    add('fangst', s.tSet + k[0] * 60, 'gear-' + s.id, nm || 'Det Store Blå', k[1], k[2], 6);
  }
  for (const v of (S.fleet && S.fleet.length ? S.fleet : [null])) (v ? withVessel : (vv, f) => f())(v, () => {
    const b = S.boat, nm = S.boatName || 'Det Store Blå', tag = v && v.id || 'b', kg = (S.hold || []).reduce((a, x) => a + x.kg, 0);
    // a boat on a route, in at its harbour at the end (as the route's ETA, 04-panels-instruments.js navOf), when she has fish to land
    const P = S.plan;
    if (P && P.idx < P.wps.length && b.status !== 'port'){
      const wps = P.wps.slice(P.idx), last = wps[wps.length - 1];
      if (last.port && portById(last.port)){
        let km = 0, a = b.pos, fishH = 0; wps.forEach((q, i) => { km += dist(a, q); a = q; if (i && q.fish > 0) fishH += q.fish; });
        const H0 = P.depAt ? Math.max(S.t / 60, P.depAt / 60) : S.t / 60, T = (H0 + km / ((P.speed || 10) * NM) + fishH) * 60, pn = portById(last.port).name;
        if (kg > 1 || fishH > 0) add('fangst', T, 'port-' + tag, nm, nm + ' er framme i ' + pn + (kg > 1 && !fishH ? ' med ' + fmt(kg, 0) + ' kg fisk' : ' med fangsten') + '. Lever mens fisken er fersk.',
          nm + ' is in at ' + pn + (kg > 1 && !fishH ? ' with ' + fmt(kg, 0) + ' kg of fish' : ' with the catch') + '. Land it while the fish is fresh.', 3);
      }
    }
    // fish in the hold about to drop a grade (not while she is on her way in: that is the line above), two game hours before
    if (kg > 20 && !(P && P.idx < P.wps.length)){
      const clean = S.tripBuff && S.tripBuff.hold ? 0.75 : 1; let best = null;
      for (const x of S.hold){ if (x.kg < 20 || SPECIES[x.sp].live) continue;
        const r = (x.bled ? (x.iced ? 0.9 : 3.0) : (x.iced ? 2.2 : 6.0)) * clean, f = x.fresh, nx = f >= 85 ? 85 : f >= 65 ? 65 : f >= 40 ? 40 : f >= 15 ? 15 : null;
        if (nx == null || r <= 0) continue; const T = S.t + (f - nx) / r * 60 - 120;
        if (!best || T < best.T) best = {T, g:grade(f), g2:grade(nx - 0.01)}; }
      if (best) add('fangst', Math.max(S.t + 1, best.T), 'fresh-' + tag, nm, 'Fisken i lasterommet går snart ned fra ' + best.g + '- til ' + best.g2 + '-kvalitet. Lever den nå, så får du bedre betalt.',
        'The fish in the hold will soon drop from grade ' + best.g + ' to ' + best.g2 + '. Land it now and you are paid better.', 2);
    }
    // the yard's work done on her
    const yj = (S.jobs || []).filter(j => YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t);
    if (yj.length){ const T = Math.max(...yj.map(j => j.until)), names = yj.map(j => L2(j.no || '', j.en || j.no || '')).filter(Boolean).slice(0, 3).join(', ');
      add('verft', T, 'yard-' + tag, nm, 'Verftet er ferdig' + (names ? ' med ' + names.toLowerCase() : '') + '. Båten er klar til å gå ut.', 'The yard is done' + (names ? ' with ' + names.toLowerCase() : '') + '. The boat is ready to go out.', 12); }
  });
  // the open group's stop announced, worked out ahead as the game does day by day (03d-quota.js qyStep), with what is left of your quota
  if (access() === 'open') try {
    const H = S.t / 60, y = yearH(H), Y = qyAt(H), last = yearH(H + PUSH_AHEAD / 60) > y ? doyOf(y, 12, 31) : doyH(H + PUSH_AHEAD / 60);
    if (Y.stop == null && Y.free == null){ const C = JSON.parse(JSON.stringify(Y));
      for (let d = C.d + 1; d <= last && C.ann == null; d++){ C.d = d; qyStep(C, y, d); }
      if (C.ann != null && C.stop != null){ const room = codRoom(H) / 1000;
        add('kvote', (hOfDoy(y, C.ann) + 8) * 60, 'quota-stop', 'Fiskeridirektoratet',
          'Fisket på maksimalkvotene i åpen gruppe stoppes ' + dayStr(y, C.stop) + '.' + (room > 0.05 ? ' Du har ' + fmt(room, 1) + ' t torsk igjen å fiske før det.' : ''),
          'Fishing on the maximum quotas in the open group stops on ' + dayStr(y, C.stop) + '.' + (room > 0.05 ? ' You have ' + fmt(room, 1) + ' t of cod left to fish before then.' : ''), 24); }
    }
  } catch (e){ console.warn('push quota', e); }
  // the seasons' news on their morning, and the skrei festival the day before
  for (const e of seasonNext(S.t / 60, 6)) if (e.ev !== 'rule' && e.ev !== 'fest') add('sesong', (e.H + 7) * 60, 'season-' + e.ev, 'Kystradio', e.no + '.', e.en + '.', 12);
  { const F = festDays(yearH(S.t / 60)); add('sesong', (F.H0 - 14) * 60, 'fest', L2('Skreifestivalen', 'The skrei festival'), 'Skreifestivalen er i morgen. Største torsk fra lørdag til søndag kl. 18 vinner 15 000 kr.', 'The skrei festival is tomorrow. The biggest cod from Saturday to Sunday 18:00 wins 15 000 kr.', 12); }
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
    '<p class="ph-note">' + cloudL('Bare det som betyr noe: redskap som har stått lenge nok, fisk som snart blir dårligere, båten framme med fangst, verftet ferdig, kvotestopp, topplista og sesongene. Høyst fire i døgnet, aldri mellom 22 og 08.',
      'Only what matters: gear that has soaked long enough, fish about to lose quality, the boat in with the catch, the yard done, a quota stop, the leaderboard and the seasons. At most four a day, never between 22 and 08.') + '</p>';
}
function pushCatToggle(k){
  S.settings.pushCat = Object.assign({}, S.settings.pushCat); S.settings.pushCat[k] = !pushCat(k); save();
  if (k === 'topp') cloudRpc('push_prefs', {top:pushCat('topp')}).catch(e => console.error(e));
  if (PHONE.isOpen()) PHONE.render();
}
function pushToggle(){
  if (S.settings.push){ pushOff().then(() => { toast(cloudL('Varsler er slått av.', 'Notifications are off.')); if (PHONE.isOpen()) PHONE.render(); }); return; }
  pushOn().then(err => { toast(err || cloudL('Varsler er på.', 'Notifications are on.')); if (PHONE.isOpen()) PHONE.render(); });
}
