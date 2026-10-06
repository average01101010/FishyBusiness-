// The feedback agent's door (06.10.2026; supabase/migrations/20261006120000_feedback_agent.sql, tools/feedback/, docs/OVERLEVERING.md 4.22).
//
//   POST {op:'list', lim}                          -> agent_feedback(lim): the new feedback without who wrote it, and what was noted before
//   POST {op:'imgs', fid}                          -> the pictures of one feedback (JPEG data URLs)
//   POST {op:'note', fid, note, score, st, reply}  -> the agent's note, weight and suggested status and reply (Jonas sends the reply)
//   POST {op:'run', report, prs, n}                -> the run's report (Markdown) and the pull requests it opened
//
// Only with «Authorization: Bearer <FEEDBACK_AGENT_TOKEN>». Jonas makes the token (a long random password) and sets it here as a secret
// and in the Claude Code environment; it never goes through a chat. Deployed with verify_jwt off, since the token is our own. It calls
// only the agent_* functions, so with the token nothing else in the database can be read or changed: no player, save or purchase.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are given to every Edge Function by Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN = Deno.env.get('FEEDBACK_AGENT_TOKEN') || '';
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {'Content-Type': 'application/json'}});
const enc = new TextEncoder();

// compare the hashes, so the time taken says nothing about how much of the token was right
async function same(a: string, b: string){
  const [x, y] = await Promise.all([a, b].map(s => crypto.subtle.digest('SHA-256', enc.encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ok: false, why: 'POST only'}, 405);
  if (TOKEN.length < 32) return json({ok: false, why: 'FEEDBACK_AGENT_TOKEN is not set (32 characters or more)'}, 503);
  const got = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!got || !(await same(got, TOKEN))) return json({ok: false, why: 'no'}, 401);
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ok: false, why: 'bad json'}, 400); }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth: {persistSession: false}});
  const call = async (fn: string, args: Record<string, unknown>) => {
    const {data, error} = await sb.rpc(fn, args);
    if (error){ console.error(fn, error.message); return json({ok: false, why: error.message}, 400); }
    return json({ok: true, data});
  };
  const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : null, str = (v: unknown) => typeof v === 'string' ? v : null;
  switch (b.op){
    case 'list': return call('agent_feedback', {lim: Math.max(1, Math.min(100, num(b.lim) || 40))});
    case 'imgs': return call('agent_feedback_imgs', {fid: num(b.fid)});
    case 'note': return call('agent_note', {fid: num(b.fid), note: str(b.note), score: num(b.score), st: str(b.st), reply: str(b.reply)});
    case 'run': return call('agent_run', {report: str(b.report) || '(tom)', prs: Array.isArray(b.prs) ? b.prs : [], n: num(b.n) || 0});
    default: return json({ok: false, why: 'unknown op'}, 400);
  }
});
