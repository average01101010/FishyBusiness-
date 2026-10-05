// ===== PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and
// supabase/functions/push-send) =====
// The player turns them on in Settings, on the account card: only signed in, in the app (it has the service worker), and only once
// Jonas has made the VAPID keys (push-send then gives the public key; until then the switch is not shown). The game is played here,
// so the server cannot know what happens in it: when the app goes to the background, pushItems() works out what will happen while it
// is away and when that is in real time (the clock runs on at GAME_RATE while the game is closed, up to CATCHUP_CAP: 08-actions.js),
// and push_plan lays it out on the server; back in the app the plan is cleared, so nothing comes while you play. What is told:
// - gear that has soaked long enough (line 10 h, nets 20 h, pots 40 h: after that the catch falls off, 10-gear.js soakHour)
// - a boat on a route at its harbour
// - the seasons' news on their morning (09c-seasons.js), and the skrei festival the day before
const PUSH = {key:undefined, last:''};
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
  const key = await pushKey(); if (!key) return cloudL('Varslene er ikke satt opp ennå.', 'Notifications are not set up yet.');
  if (await Notification.requestPermission() !== 'granted') return cloudL('Du må tillate varsler for appen. Det gjøres i nettleserens innstillinger for nettstedet.', 'You must allow notifications for the app, in the browser’s settings for the site.');
  try {
    const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:pushB64(key)});
    const j = sub.toJSON(); await cloudRpc('push_sub', {endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth, lang:S.lang || 'no'});
  } catch (e){ console.error(e); return cloudL('Kunne ikke slå på varsler nå. Prøv igjen.', 'Could not turn on notifications now. Try again.'); }
  S.settings.push = true; save(); return null;
}
async function pushOff(){
  S.settings.push = false; save();
  try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub){ await cloudRpc('push_unsub', {endpoint:sub.endpoint}); await sub.unsubscribe(); } } catch (e){ console.error(e); }
}
// what will happen while the app is away: [{at (ISO), tag, title, body}], soonest first, at most 24
function pushItems(now){
  now = now || Date.now();
  const out = [], L2 = (no, en) => S.lang === 'en' ? en : no;
  const add = (T, tag, title, no, en) => { if (T > S.t && T - S.t <= CATCHUP_CAP) out.push({at:new Date(now + (T - S.t) / GAME_RATE * 60000).toISOString(), tag, title, body:L2(no, en)}); };
  // the gear in the sea (the company's, S.sets)
  for (const s of S.sets || []){
    const k = PUSH_SOAK[s.kind]; if (!k || s.lost || s.hauling) continue;
    const v = (S.fleet || []).find(x => x.id === s.vid), nm = v ? vget(v, 'boatName') : S.boatName;
    add(s.tSet + k[0] * 60, 'gear-' + s.id, nm || 'Det Store Blå', k[1], k[2]);
  }
  // a boat on a route, at its harbour at the end (as the route's ETA, 04-panels-instruments.js navOf)
  for (const v of S.fleet || []) withVessel(v, () => {
    const b = S.boat, P = S.plan; if (!P || P.idx >= P.wps.length || b.status === 'port') return;
    const wps = P.wps.slice(P.idx), last = wps[wps.length - 1]; if (!last.port || !portById(last.port)) return;
    let km = 0, a = b.pos, fishH = 0; wps.forEach((q, i) => { km += dist(a, q); a = q; if (i && q.fish > 0) fishH += q.fish; });
    const H0 = P.depAt ? Math.max(S.t / 60, P.depAt / 60) : S.t / 60, T = (H0 + km / ((P.speed || 10) * NM) + fishH) * 60, pn = portById(last.port).name;
    add(T, 'port-' + (v.id || 'b'), S.boatName || 'Det Store Blå', S.boatName + ' er framme i ' + pn + '.', S.boatName + ' is in at ' + pn + '.');
  });
  // the seasons' news on their morning, and the skrei festival the day before
  for (const e of seasonNext(S.t / 60, 6)) if (e.ev !== 'rule' && e.ev !== 'fest') add((e.H + 7) * 60, 'season-' + e.ev, 'Kystradio', e.no + '.', e.en + '.');
  { const F = festDays(yearH(S.t / 60)); add((F.H0 - 14) * 60, 'fest', L2('Skreifestivalen', 'The skrei festival'), 'Skreifestivalen er i morgen. Største torsk fra lørdag til søndag kl. 18 vinner 15 000 kr.', 'The skrei festival is tomorrow. The biggest cod from Saturday to Sunday 18:00 wins NOK 15,000.'); }
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
  pushKey();
  document.addEventListener('visibilitychange', () => pushPlan(document.visibilityState === 'hidden'));
  window.addEventListener('pagehide', () => pushPlan(true));
  pushPlan(false);
}
// the switch on the account card (10f-cloud.js cloudCard): only when it can work
function pushCardRow(){
  if (!pushHas() || !PUSH.key) return '';
  return '<label><span>' + cloudL('Varsler når appen er lukket', 'Notifications while the app is closed') + '</span><input type="checkbox" data-pa="cloudPush"' + (S.settings.push ? ' checked' : '') + '></label>' +
    '<p class="ph-note">' + cloudL('Når redskapet har stått lenge nok, båten er framme, og når sesongene kommer.', 'When the gear has soaked long enough, the boat is in, and when the seasons come.') + '</p>';
}
function pushToggle(){
  if (S.settings.push){ pushOff().then(() => { toast(cloudL('Varsler er slått av.', 'Notifications are off.')); if (PHONE.isOpen()) PHONE.render(); }); return; }
  pushOn().then(err => { toast(err || cloudL('Varsler er på.', 'Notifications are on.')); if (PHONE.isOpen()) PHONE.render(); });
}
