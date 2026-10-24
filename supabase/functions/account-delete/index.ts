// «Slett kontoen» with the sign-in too (11.10.2026; supabase/migrations/20261011160000_delete_me2.sql, ui/10f-cloud.js cloudAct('cloudDel')).
//
//   GET   -> {ready}: whether the WorkOS key is set, so the game knows this route works
//   POST  -> {ok, workos}: everything about the signed-in player goes from the database (delete_me2, asked with the player's own token,
//            so only the player's own account can go), and then the user at WorkOS (e-mail, name, the sign-in itself)
//
// The id of the WorkOS user comes from the database (the verified token's sub), never from the request. Guests (anonymous Supabase
// users, no WorkOS account) only lose the database rows. Without the key nothing is touched (503), and the game falls back to the
// database deletion alone. A WorkOS error after the database deletion answers 502: the game says "try again", and asking again is fine
// (the database has nothing left, the token still names the user). Deployed with verify_jwt off: the database checks the token.
// The secret, set by Jonas only: WORKOS_API_KEY (the Production key, sk_live_… under API Keys in WorkOS). SUPABASE_URL and
// SUPABASE_ANON_KEY are given to every Edge Function by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';

const KEY = Deno.env.get('WORKOS_API_KEY') || '';
const CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info'};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {...CORS, 'Content-Type': 'application/json'}});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, {headers: CORS});
  if (req.method === 'GET') return json({ready: !!KEY});
  if (req.method !== 'POST') return json({error: 'method'}, 405);
  if (!KEY) return json({error: 'not set up'}, 503);
  const auth = req.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/.test(auth)) return json({error: 'not signed in'}, 401);
  const user = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {global: {headers: {Authorization: auth}}, auth: {persistSession: false}});
  const {data: id, error} = await user.rpc('delete_me2');
  if (error || typeof id !== 'string' || !id){ console.error('delete_me2', error && error.message); return json({error: 'unavailable'}, 400); }
  if (!/^user_[A-Za-z0-9]+$/.test(id)) return json({ok: true, workos: false});   // a guest: no account at WorkOS
  const r = await fetch('https://api.workos.com/user_management/users/' + id, {method: 'DELETE', headers: {Authorization: 'Bearer ' + KEY}});
  if (r.ok || r.status === 404) return json({ok: true, workos: true});
  console.error('workos delete', r.status);
  return json({error: 'workos'}, 502);
});
