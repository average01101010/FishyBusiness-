// The sender of the push notifications (05.10.2026; supabase/migrations/20261005120000_push.sql, ui/10g-push.js).
//
//   GET  ?key   -> {key}: the VAPID public key, for the game to subscribe with (null until Jonas has set the secrets)
//   POST        -> sends what is due in push_queue to the player's devices, and drops the subscriptions the push service says are gone
//
// pg_cron calls it every five minutes. It needs no caller's token (deployed with verify_jwt off): it only ever sends what the
// players themselves laid out and what is due, so a call from anyone else does no harm. The secrets, set by Jonas only:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (made with «npx web-push generate-vapid-keys»), VAPID_SUBJECT (e.g. https://detstorebla.no)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are given to every Edge Function by Supabase.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PUB = Deno.env.get('VAPID_PUBLIC_KEY') || '', PRIV = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const SUBJ = Deno.env.get('VAPID_SUBJECT') || 'https://detstorebla.no';
const CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type'};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {...CORS, 'Content-Type': 'application/json'}});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, {headers: CORS});
  const url = new URL(req.url);
  if (req.method === 'GET') return json({key: url.searchParams.has('key') && PUB ? PUB : null});
  if (!PUB || !PRIV) return json({ok: false, why: 'no VAPID keys'});
  webpush.setVapidDetails(SUBJ, PUB, PRIV);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth: {persistSession: false}});
  const {data: due, error} = await sb.rpc('push_claim', {lim: 300});
  if (error) return json({ok: false, why: error.message}, 500);
  let sent = 0, gone = 0, failed = 0;
  const players = [...new Set((due || []).map((r: {player_id: string}) => r.player_id))];
  const subs: Record<string, {endpoint: string, p256dh: string, auth: string, fails: number}[]> = {};
  if (players.length){
    const {data} = await sb.from('push_subs').select('endpoint, player_id, p256dh, auth, fails').in('player_id', players);
    for (const s of data || []) (subs[s.player_id] = subs[s.player_id] || []).push(s);
  }
  for (const r of due || []){
    const payload = JSON.stringify({title: r.title, body: r.body, tag: r.tag});
    for (const s of subs[r.player_id] || []){
      try {
        await webpush.sendNotification({endpoint: s.endpoint, keys: {p256dh: s.p256dh, auth: s.auth}}, payload, {TTL: 6 * 3600, urgency: 'normal', topic: r.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32)});
        sent++; await sb.from('push_subs').update({last_ok: new Date().toISOString(), fails: 0}).eq('endpoint', s.endpoint);
      } catch (e){
        const code = (e as {statusCode?: number}).statusCode || 0;
        if (code === 404 || code === 410){ gone++; await sb.from('push_subs').delete().eq('endpoint', s.endpoint); }
        else {   // a service that keeps failing for a day and more: the subscription goes
          failed++; s.fails = (s.fails || 0) + 1;
          if (s.fails > 50) await sb.from('push_subs').delete().eq('endpoint', s.endpoint); else await sb.from('push_subs').update({fails: s.fails}).eq('endpoint', s.endpoint);
        }
      }
    }
  }
  if (Math.random() < 0.02) await sb.rpc('push_tidy');
  return json({ok: true, due: (due || []).length, sent, gone, failed});
});
