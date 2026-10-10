// The shop's webhook (05.10.2026; supabase/migrations/20261006040000_shop.sql, functions/shop-checkout).
//
//   POST (from Stripe, signed) -> books what happened to a purchase:
//     checkout.session.completed (paid at once) and checkout.session.async_payment_succeeded: paid, and the grant for the game
//     checkout.session.async_payment_failed: failed; checkout.session.expired: expired
//     charge.refunded (in full): refunded, and a grant the game has not given yet is taken back
//
// Every event is checked against the signing secret before anything is done, and booking it twice changes nothing (shop_paid books a
// purchase once, and makes one grant per purchase), so Stripe may send an event again. Deployed with verify_jwt off: Stripe has no
// Supabase token. The secrets, set by Jonas only: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (whsec_…, from the endpoint in Stripe).
import Stripe from 'npm:stripe@23.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SK = Deno.env.get('STRIPE_SECRET_KEY') || '', WH = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const stripe = new Stripe(SK || 'sk_unset', {httpClient: Stripe.createFetchHttpClient()});
const crypto = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', {status: 405});
  if (!WH) return new Response('not set up', {status: 503});
  const sig = req.headers.get('stripe-signature') || '', raw = await req.text();
  let ev: Stripe.Event;
  try { ev = await stripe.webhooks.constructEventAsync(raw, sig, WH, undefined, crypto); }
  catch (_e){ return new Response('bad signature', {status: 400}); }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth: {persistSession: false}});
  const pi = (x: unknown) => typeof x === 'string' ? x : (x && typeof x === 'object' && 'id' in x ? String((x as {id: string}).id) : null);
  let r: {error: {message: string} | null} = {error: null};
  switch (ev.type){
    case 'checkout.session.completed': {
      const s = ev.data.object as Stripe.Checkout.Session;
      if (s.payment_status === 'paid' || s.payment_status === 'no_payment_required') r = await db.rpc('shop_paid', {sid: s.id, pi: pi(s.payment_intent)});
      break; }
    case 'checkout.session.async_payment_succeeded': {
      const s = ev.data.object as Stripe.Checkout.Session; r = await db.rpc('shop_paid', {sid: s.id, pi: pi(s.payment_intent)}); break; }
    case 'checkout.session.async_payment_failed': {
      const s = ev.data.object as Stripe.Checkout.Session; r = await db.rpc('shop_ended', {sid: s.id, st: 'failed'}); break; }
    case 'checkout.session.expired': {
      const s = ev.data.object as Stripe.Checkout.Session; r = await db.rpc('shop_ended', {sid: s.id, st: 'expired'}); break; }
    case 'charge.refunded': {
      const c = ev.data.object as Stripe.Charge; if (c.refunded && c.payment_intent) r = await db.rpc('shop_refund', {pi: pi(c.payment_intent)}); break; }
  }
  // a database error makes Stripe send the event again later
  if (r.error) return new Response('db: ' + r.error.message, {status: 500});
  return new Response(JSON.stringify({received: true}), {headers: {'Content-Type': 'application/json'}});
});
