// The Edge Functions' errors in the game's error list (02.11.2026, the error trap; Jonas: «Det er viktig at vi fanger opp så mye
// potensielle feil som oppstår så fort som mulig»). Until now a function that threw or answered 5xx was only in Supabase's own logs,
// which nobody reads: the payment, the push and the deleting of an account could fail for everyone without a word. serveReported wraps
// a function's handler: a throw is written to public.errors (src 'fn:<name>', platform 'server') and answered 500; an answer of 500 or
// more is written too, with the start of its body. fnErr writes one by hand. Writing an error never stops the answer.
import { createClient } from 'npm:@supabase/supabase-js@2';

export async function fnErr(fn: string, msg: string, stack = ''): Promise<void> {
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth: {persistSession: false}});
    await sb.from('errors').insert({msg: ('fn ' + fn + ': ' + msg).slice(0, 400), src: 'fn:' + fn, stack: String(stack || '').slice(0, 2000), version: 'fn', platform: 'server'});
  } catch (_e) { /* the error list is not there: the answer goes all the same */ }
}

export function serveReported(fn: string, handler: (req: Request) => Response | Promise<Response>): void {
  Deno.serve(async (req) => {
    try {
      const r = await handler(req);
      if (r.status >= 500){ let t = ''; try { t = (await r.clone().text()).slice(0, 200); } catch (_e) { /* no body */ } await fnErr(fn, 'svar ' + r.status + (t ? ' ' + t : '')); }
      return r;
    } catch (e) {
      const err = e as Error;
      await fnErr(fn, (err && err.message) || String(e), err && err.stack);
      return new Response(JSON.stringify({error: 'internal'}), {status: 500, headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}});
    }
  });
}
