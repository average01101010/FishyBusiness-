-- Hopp over resten av ruta, the purchase (HO3, steg 106, 12.11.2026; docs/planer/hopp.md, docs/systemer/autonav.md 4.12n; Jonas 12.11.2026:
-- «Gjør helt ferdig og rull ut på test med en gang.»). The hop is bought for the real minutes it saves, at the ladder's price (core/06j-hopp.js
-- hopPrice, HOP.steps; Jonas 12.11.2026, A: 75 øre a minute the first hour, 50 øre the next three, 25 øre after, at least 5 kr, no cap). The
-- minutes are whole minutes, so the game's price and this one are the same to the øre (multiples of 0.25 kr). The server works the price
-- out from the minutes the game sends, as it trusts the game's position today; the minutes, the stop and the price are kept on the purchase
-- (shop-checkout), and the grant stripe-webhook makes of it has them. Once paid, the hop is made to the stop in the purchase whatever the
-- weather (Jonas: «uavhengig av været eller andre ting»); when it cannot be made there (the boat was there before the payment came, another
-- route, someone in the water), the grant waits unused and the game offers it from Kaiboden on a later route of at most its minutes.
--
--   hop_price(min)         kr for the real minutes saved (tests/unit/hopp.test.mjs and tests/sqltest.py check it against hopPrice)
--   shop_quote_hop(min)    as shop_quote (signed in, not a guest, the shop open to the account, at most 30 purchases an hour) for the
--                          product 'hopp', at the price for the minutes (1 to 3 360: the longest route the game works out, 14 game days)
--   hop_use(id)            the hop is a grant that is unused until a hop is made with it
--   shop_state()           as in 20261111140000_haill_srv.sql, with the hop grants: delivered by the call (new the first time) and
--                          answered while unused
--   shop_refund(pi)        as in 20261110180000_haill_use.sql, and a hop or a «Ferdig nå» (the yard done now) delivered and not used is
--                          taken back too, as a haill is (the kontroll of HO3: one left after a refund could be used); one used stays
-- Nothing that shares anything with other players reads these.

insert into public.products (id, kind, name_no, name_en, price_nok, data) values
  ('hopp', 'booster', 'Hopp over resten av ruta', 'Skip the rest of the route', 5, '{"give":"hopp"}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, data = excluded.data, active = true;

create or replace function public.hop_price(minutes int) returns int language sql immutable set search_path = '' as $$
  select greatest(5, round(least(greatest(minutes, 0), 60) * 0.75 + least(greatest(minutes - 60, 0), 180) * 0.50 + greatest(minutes - 240, 0) * 0.25))::int
$$;

create or replace function public.shop_quote_hop(minutes int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); r products;
begin
  if p is null then raise exception 'not signed in'; end if;
  if is_guest() then raise exception 'guest'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if shop_closed(p) then raise exception 'closed'; end if;
  if minutes is null or minutes < 1 or minutes > 3360 then raise exception 'bad minutes'; end if;
  select * into r from products where id = 'hopp' and active;
  if r.id is null then raise exception 'no such product'; end if;
  if (select count(*) from purchases where player_id = p and created_at > now() - interval '1 hour') >= 30 then raise exception 'too many'; end if;
  return jsonb_build_object('pid', p, 'id', r.id, 'name_no', r.name_no, 'name_en', r.name_en, 'price_nok', hop_price(minutes), 'data', r.data || jsonb_build_object('min', minutes));
end $$;

create or replace function public.hop_use(id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int;
begin
  if p is null then raise exception 'not signed in'; end if;
  update grants g set used_at = now(), done_at = coalesce(g.done_at, now())
   where g.id = hop_use.id and g.player_id = p and g.data ->> 'give' = 'hopp' and g.used_at is null and g.revoked_at is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- (as in 20261111140000_haill_srv.sql, with 'hopp' among the kinds the call delivers and answers while unused)
create or replace function public.shop_state() returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); fresh bigint[];
begin
  if p is null then raise exception 'not signed in'; end if;
  with u as (update grants g set done_at = now() where g.player_id = p and g.done_at is null and g.revoked_at is null
      and g.data ->> 'give' in ('haill', 'trim', 'skip', 'yard', 'hopp') returning g.id)
    select coalesce(array_agg(u.id), '{}') into fresh from u;
  return jsonb_build_object('v', 4, 't', game_min(),
    'list', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'product', g.product_id, 'data', g.data)
        || case when g.done_at is not null then jsonb_build_object('held', true, 'done_at', g.done_at) else '{}'::jsonb end
        || case when g.id = any(fresh) then '{"new":true}'::jsonb else '{}'::jsonb end order by g.id), '[]'::jsonb)
      from grants g where g.player_id = p and g.revoked_at is null
       and (g.done_at is null
         or (g.data ->> 'give' in ('haill', 'yard', 'hopp') and g.used_at is null)
         or (g.data ->> 'give' in ('trim', 'skip') and g.done_at > now() - interval '90 days'))),
    'on', (select jsonb_build_object('id', g.id, 'type', g.data ->> 'type', 't0', coalesce(g.t0, game_min_at(g.used_at)))
      from grants g where g.player_id = p and g.revoked_at is null and g.data ->> 'give' = 'haill' and g.used_at > now() - interval '7 days'
      order by coalesce(g.t0, game_min_at(g.used_at)) desc, g.id desc limit 1),
    'imp', exists (select 1 from haill_once o where o.player_id = p and o.what = 'import'),
    -- (the designs the account owns: bought, entitlements as tm_hello's owned, or given by a grant alone, a correction from the admin)
    'owned', coalesce((select jsonb_agg(x.id order by x.id) from (select e.product_id id from entitlements e where e.player_id = p
      union select g.product_id from grants g where g.player_id = p and g.revoked_at is null and g.data ->> 'give' = 'cos') x), '[]'::jsonb),
    'pub', (select jsonb_build_object('e', r.e, 'k', r.k) from pub_rounds r where r.player_id = p order by r.e desc limit 1));
end $$;

create or replace function public.shop_refund(pi text) returns void
language plpgsql security definer set search_path = public as $$
declare u purchases;
begin
  update purchases set status = 'refunded', refunded_at = now() where payment_intent = shop_refund.pi and status = 'paid' returning * into u;
  if u.id is not null then
    update grants set revoked_at = now() where purchase_id = u.id and (done_at is null or (data ->> 'give' in ('haill', 'yard', 'hopp') and used_at is null));
    delete from entitlements where player_id = u.player_id and product_id = u.product_id and source = 'stripe:' || u.id;
  end if;
end $$;
revoke all on function public.shop_refund(text) from public, anon, authenticated;
grant execute on function public.shop_refund(text) to service_role;

revoke all on function public.hop_price(int), public.shop_quote_hop(int), public.hop_use(bigint), public.shop_state() from public, anon, authenticated;
grant execute on function public.hop_price(int), public.shop_quote_hop(int), public.hop_use(bigint), public.shop_state() to authenticated;
