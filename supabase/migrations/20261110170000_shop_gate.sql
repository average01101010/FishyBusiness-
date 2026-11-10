-- P5 (docs/planer/koen.md «Porten for de første brukerne», steg 101, 10.11.2026): the shop closed for new accounts.
-- Jonas 10.11.2026, with the trailer ready: «Jeg vil bare ikke at nye brukere kommer inn i spillet og får en dårlig opplevelse».
-- The first players from the trailer come before the payment is ready for strangers (Stripe Tax and the VAT, L2; the server as the
-- truth for what is bought, HS2–HS4), so the shop can be closed for every account made after the switch was turned. The accounts
-- that were there keep the shop and all they have bought; nothing is taken from anyone, and the welcome gift is given as before.
--
--   world_cfg.shop_new_from   null: the shop is open to every account (as before this file). A time: accounts made at or after it
--                             get no quote (shop_quote refuses, so shop-checkout answers «unavailable» and nothing can be paid)
--                             and tm_hello tells the game shop:false, which shows «on sale soon» (ui/10i-shop.js shopMode).
--   admin_shop_gate()         the time and how many accounts it holds out, for the admin page (Penger)
--   admin_shop_gate_set(c)    true: closed from now. false: open to all again.
-- The game's admin account (players.game_admin) is never held out.

alter table public.world_cfg drop constraint if exists world_cfg_k_check;
alter table public.world_cfg add constraint world_cfg_k_check check (k in ('stock_server', 'share_limit', 'cheat_on', 'shop_new_from'));
insert into public.world_cfg (k, v) values ('shop_new_from', 'null'::jsonb) on conflict (k) do nothing;

-- is the shop closed for this account? (only inside the definer functions below; a player cannot ask)
create or replace function public.shop_closed(p text) returns boolean language sql stable set search_path = public as $$
  select coalesce((select pl.created_at >= (c.v #>> '{}')::timestamptz and not coalesce(pl.game_admin, false)
    from world_cfg c, players pl where c.k = 'shop_new_from' and jsonb_typeof(c.v) = 'string' and pl.id = shop_closed.p), false) $$;

-- (as in 20261006180000_guest.sql, with the gate)
create or replace function public.shop_quote(product text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); r products;
begin
  if p is null then raise exception 'not signed in'; end if;
  if is_guest() then raise exception 'guest'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if shop_closed(p) then raise exception 'closed'; end if;
  select * into r from products where id = shop_quote.product and active;
  if r.id is null then raise exception 'no such product'; end if;
  if (select count(*) from purchases where player_id = p and created_at > now() - interval '1 hour') >= 30 then raise exception 'too many'; end if;
  return jsonb_build_object('pid', p, 'id', r.id, 'name_no', r.name_no, 'name_en', r.name_en, 'price_nok', r.price_nok, 'data', r.data);
end $$;

-- (as in 20261110150000_reg_gift.sql, with shop: whether this account may buy)
create or replace function public.tm_hello(meta jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare p text := pid(); r public.players;
begin
  if p is null then raise exception 'not signed in'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do update set last_seen = now();
  if not is_guest() then
    insert into grants (player_id, product_id, data) select p, pr.id, pr.data from products pr where pr.id = 'reg_luksus' on conflict do nothing;
  end if;
  -- the device and the country only with consent (the privacy page, src/legal/personvern.html): without it the row is the account
  update players set lang = left(meta ->> 'lang', 12), tz = left(meta ->> 'tz', 40), platform = left(meta ->> 'platform', 20),
    browser = left(meta ->> 'browser', 20), pwa = (meta ->> 'pwa')::boolean,
    country = coalesce(left(nullif(current_setting('request.headers', true)::json ->> 'cf-ipcountry', ''), 2), country)
    where id = p and consent is true;
  select * into r from players where id = p;
  return jsonb_build_object('consent', r.consent, 'created', r.created_at, 'birth_year', r.birth_year, 'admin', coalesce(r.game_admin, false),
    'owned', coalesce((select jsonb_agg(product_id) from entitlements where player_id = p), '[]'::jsonb), 'shop', not shop_closed(p));
end $$;

create or replace function public.admin_shop_gate() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare f timestamptz;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  select (c.v #>> '{}')::timestamptz into f from world_cfg c where c.k = 'shop_new_from' and jsonb_typeof(c.v) = 'string';
  return jsonb_build_object('from', f, 'n', case when f is null then 0 else (select count(*) from players pl where pl.created_at >= f and not coalesce(pl.game_admin, false)) end);
end $$;
create or replace function public.admin_shop_gate_set(closed boolean) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  if closed is null then raise exception 'bad value'; end if;
  insert into world_cfg (k, v) values ('shop_new_from', case when closed then to_jsonb(now()) else 'null'::jsonb end) on conflict (k) do update set v = excluded.v;
  return admin_shop_gate();
end $$;

revoke all on function public.shop_closed(text), public.admin_shop_gate(), public.admin_shop_gate_set(boolean) from public, anon, authenticated;
grant execute on function public.admin_shop_gate(), public.admin_shop_gate_set(boolean) to authenticated;
