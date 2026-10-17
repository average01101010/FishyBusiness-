// The shop's checkout (05.10.2026; supabase/migrations/20261006040000_shop.sql, ui/10i-shop.js).
//
//   GET          -> {ready}: whether the shop is set up (the Stripe key is there), so the game knows to sell
//   POST {product, boat, lang, back}
//                -> {url}: a Stripe Checkout page for one product, for the signed-in player whose token comes with the call
//
// The price and the name come from the database (shop_quote, asked with the player's own token, so only a signed-in player gets a
// page), never from the game. The company sells, and Stripe takes the payment (Jonas 05.10.2026: «Nei til managed payments. Vi kan
// eventuelt aktivere dette når vi går internasjonalt»): STRIPE_MANAGED=1 makes Stripe the merchant of record (Managed Payments: tax,
// fraud, disputes, refunds and receipts are Stripe's), STRIPE_TAX=1 lets Stripe Tax add the VAT once the company is registered. The
// game's buy button comes straight here; the line under it, and the line by Stripe's pay button (custom_text), say the delivery is at
// once and the right of withdrawal then ends (ui/10i-shop.js shopFine).
// The purchase is written as open here; the webhook (stripe-webhook) books it when it is paid.
// Deployed with verify_jwt off: the database checks the player's token. The secrets, set by Jonas only:
//   STRIPE_SECRET_KEY (sk_test_… in the sandbox, a restricted rk_live_… live); STRIPE_MANAGED and STRIPE_TAX (1 to turn on, off if not set)
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are given to every Edge Function by Supabase.
import Stripe from 'npm:stripe@23.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SK = Deno.env.get('STRIPE_SECRET_KEY') || '';
const MANAGED = Deno.env.get('STRIPE_MANAGED') === '1', TAX = Deno.env.get('STRIPE_TAX') === '1';
const SITES = ['https://detstorebla.no', 'https://www.detstorebla.no', 'https://average01101010.github.io'];
const TAX_CODE = 'txcd_10201001';   // Video Games, downloaded, not a subscription, with limited rights (also eligible for Managed Payments)
const CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info'};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {status, headers: {...CORS, 'Content-Type': 'application/json'}});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, {headers: CORS});
  if (req.method === 'GET') return json({ready: !!SK});
  if (req.method !== 'POST') return json({error: 'method'}, 405);
  if (!SK) return json({error: 'the shop is not set up yet'}, 503);
  const auth = req.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/.test(auth)) return json({error: 'not signed in'}, 401);
  let body: {product?: string, boat?: string, lang?: string, back?: string} = {};
  try { body = await req.json(); } catch (_e){ return json({error: 'bad request'}, 400); }
  const product = String(body.product || '').slice(0, 40), boat = String(body.boat || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40), en = body.lang === 'en';
  // back to the page the player came from, if it is one of the game's (the app at detstorebla.no, or the PWA on GitHub Pages)
  let back = SITES[0] + '/';
  try { const u = new URL(String(body.back || '')); if (SITES.includes(u.origin)) back = u.origin + u.pathname; } catch (_e){ /* the main site */ }

  const URL_ = Deno.env.get('SUPABASE_URL')!;
  const user = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, {global: {headers: {Authorization: auth}}, auth: {persistSession: false}});
  const {data: q, error} = await user.rpc('shop_quote', {product});
  if (error || !q){ if (error) console.error('shop_quote', error.message); return json({error: 'unavailable'}, 400); }

  const stripe = new Stripe(SK, {httpClient: Stripe.createFetchHttpClient()});
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: [{quantity: 1, price_data: {currency: 'nok', unit_amount: q.price_nok * 100, tax_behavior: 'inclusive',
      product_data: {name: en ? q.name_en : q.name_no, tax_code: TAX_CODE, metadata: {product: q.id}}}}],
    client_reference_id: q.pid,
    metadata: {product: q.id, boat},
    payment_intent_data: {metadata: {product: q.id}},
    locale: en ? 'en' : 'nb',
    // the right of withdrawal ends when the digital content is delivered at once (angrerettloven § 22 n); said before the player pays
    custom_text: {submit: {message: en ? 'It is delivered in the game at once. By paying you ask for that, and the right of withdrawal then ends.'
                                        : 'Det leveres i spillet med én gang. Når du betaler, ber du om det, og angreretten faller da bort.'}},
    success_url: back + '?kjop={CHECKOUT_SESSION_ID}',
    cancel_url: back + '?kjop=avbrutt',
  };
  if (MANAGED) params.managed_payments = {enabled: true}; else if (TAX) params.automatic_tax = {enabled: true};
  let s: Stripe.Checkout.Session;
  try { s = await stripe.checkout.sessions.create(params); }
  // what went wrong stays in the function's log; the player is told only that the payment is not available (no keys or ids shown)
  catch (e){ console.error('stripe', (e as Error).message); return json({error: 'unavailable'}, 502); }

  const admin = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth: {persistSession: false}});
  const {error: e2} = await admin.from('purchases').insert({id: s.id, player_id: q.pid, product_id: q.id, amount_nok: q.price_nok, currency: 'nok', status: 'open', data: boat ? {boat} : {}});
  if (e2){ console.error('purchases', e2.message); return json({error: 'unavailable'}, 500); }
  return json({url: s.url});
});
