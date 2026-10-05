-- The shop (05.10.2026; Jonas: «hele spillet skal være free-to-play, men med betalte boostere i form av haill-appen og trim-appen og
-- betaling for å hoppe over verkstedtid», «Ja til Managed Payments, kjør på med butikken»). The game asks the Edge Function
-- shop-checkout for a Stripe Checkout page (Stripe as the merchant of record: Managed Payments), the player pays there, and the Edge
-- Function stripe-webhook books it: the purchase is paid and a grant waits for the game, which gives it (ui/10i-shop.js) and says it is
-- done. Prices are here, not in the game: the game only shows them. A grant is never given twice (one per purchase, and the game keeps
-- the ids it has given); a refund takes back a grant the game has not given yet.

-- what is for sale (kind booster; data: what the game gives)
insert into public.products (id, kind, name_no, name_en, price_nok, data) values
  ('haill', 'booster', 'Haill', 'Luck', 29, '{"give":"haill","type":"haill"}'),
  ('luksus', 'booster', 'Luksushaill', 'Luxury luck', 59, '{"give":"haill","type":"luksus"}'),
  ('trim_pump', 'booster', 'Trim: justert dieselpumpe (+50 % fart i 24 timer)', 'Tuning: tuned injection pump (+50% speed for 24 hours)', 29, '{"give":"trim","k":"pump"}'),
  ('trim_ic', 'booster', 'Trim: ladeluftkjøling (+75 % fart i 48 timer)', 'Tuning: charge air cooling (+75% speed for 48 hours)', 39, '{"give":"trim","k":"ic"}'),
  ('trim_turbo', 'booster', 'Trim: økt turbotrykk (dobbel fart i 72 timer)', 'Tuning: higher boost pressure (double speed for 72 hours)', 49, '{"give":"trim","k":"turbo"}'),
  ('verft_na', 'booster', 'Verftet ferdig nå', 'The yard done now', 19, '{"give":"yard"}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, data = excluded.data, active = true;

-- what the purchase is for (the boat a trim or the yard is for)
alter table public.purchases add column if not exists data jsonb not null default '{}';

-- what the game is to give: one per paid purchase; done when the game has given it, revoked when refunded before that
create table if not exists public.grants (
  id bigint generated always as identity primary key,
  player_id text not null references public.players(id) on delete cascade,
  product_id text not null references public.products(id),
  purchase_id text unique references public.purchases(id) on delete set null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  done_at timestamptz,
  revoked_at timestamptz
);
create index if not exists grants_open on public.grants (player_id) where done_at is null and revoked_at is null;
alter table public.grants enable row level security;
revoke all on public.grants from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- the product a signed-in player wants to buy, for shop-checkout (called with the player's own token); at most 30 open checkouts an hour
create or replace function public.shop_quote(product text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); r products;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  select * into r from products where id = shop_quote.product and active;
  if r.id is null then raise exception 'no such product'; end if;
  if (select count(*) from purchases where player_id = p and created_at > now() - interval '1 hour') >= 30 then raise exception 'too many'; end if;
  return jsonb_build_object('pid', p, 'id', r.id, 'name_no', r.name_no, 'name_en', r.name_en, 'price_nok', r.price_nok, 'data', r.data);
end $$;

-- the webhook (service role): a Checkout Session paid. Books the purchase and makes its grant, once whatever Stripe sends again
create or replace function public.shop_paid(sid text, pi text) returns boolean
language plpgsql security definer set search_path = public as $$
declare u purchases; d jsonb;
begin
  update purchases set status = 'paid', paid_at = coalesce(paid_at, now()), payment_intent = coalesce(shop_paid.pi, payment_intent)
   where id = shop_paid.sid and status in ('open', 'failed', 'expired') returning * into u;
  if u.id is null then return false; end if;
  select data into d from products where id = u.product_id;
  if u.player_id is not null then
    insert into grants (player_id, product_id, purchase_id, data) values (u.player_id, u.product_id, u.id, coalesce(d, '{}') || coalesce(u.data, '{}'))
      on conflict (purchase_id) do nothing;
  end if;
  return true;
end $$;

-- the webhook: a Checkout Session that ended without payment (expired, failed)
create or replace function public.shop_ended(sid text, st text) returns void
language sql security definer set search_path = public as $$
  update purchases set status = case when shop_ended.st = 'failed' then 'failed' else 'expired' end where id = shop_ended.sid and status = 'open'
$$;

-- the webhook: a payment refunded in full; a grant the game has not given yet is taken back
create or replace function public.shop_refund(pi text) returns void
language plpgsql security definer set search_path = public as $$
declare u purchases;
begin
  update purchases set status = 'refunded', refunded_at = now() where payment_intent = shop_refund.pi and status = 'paid' returning * into u;
  if u.id is not null then update grants set revoked_at = now() where purchase_id = u.id and done_at is null; end if;
end $$;

-- the game: what it has to give, and that it has given it
create or replace function public.shop_pending() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'product', g.product_id, 'data', g.data) order by g.id), '[]'::jsonb)
    from grants g where g.player_id = pid() and g.done_at is null and g.revoked_at is null
$$;
create or replace function public.shop_done(ids bigint[]) returns void
language sql security definer set search_path = public as $$
  update grants set done_at = now() where player_id = pid() and id = any(shop_done.ids) and done_at is null
$$;

revoke all on function public.shop_quote(text), public.shop_paid(text, text), public.shop_ended(text, text), public.shop_refund(text),
  public.shop_pending(), public.shop_done(bigint[]) from public, anon, authenticated;
grant execute on function public.shop_quote(text), public.shop_pending(), public.shop_done(bigint[]) to authenticated;
grant execute on function public.shop_paid(text, text), public.shop_ended(text, text), public.shop_refund(text) to service_role;
