-- The welcome gift from the server, once (HS1, 10.11.2026; docs/planer/haill-saldo.md; Jonas, valg 16 V7: «A»). Until now the game
-- gave the luxury luck itself when a key was on the device (localStorage dsb_reg_gift, set after guest_merge whatever it answered): a
-- player who set the key by hand got a new one at every start, and an account made without a guest first got none. Now the gift is a
-- grant like a purchase: tm_hello makes it the first time an account says hello, a unique index keeps it to one per account for good,
-- and the game gives it from shop_pending like the rest (ui/10i-shop.js shopClaim, data.gift). A guest gets none before registering.

-- the gift as a product: never for sale (not active, so shop_quote refuses it), no price; data is what the game gives
insert into public.products (id, kind, name_no, name_en, price_nok, active, data) values
  ('reg_luksus', 'booster', 'Velkomstgave: luksushaill', 'Welcome gift: luxury luck', 0, false, '{"give":"haill","type":"luksus","gift":true}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, active = false, data = excluded.data;

-- one per account, whatever calls
create unique index if not exists grants_reg_gift on public.grants (player_id) where product_id = 'reg_luksus';

-- the accounts that are here already: who has had the gift from the key cannot be seen (the saves are packed), and the rule is one gift
-- per registration, so they all count as given. An account is a WorkOS sign-in (user_…); a guest is a Supabase anonymous user, whose
-- id is a uuid, and gets the gift when it registers (players.guest is not the mark: it is set first when a guest lands or sails)
insert into public.grants (player_id, product_id, data, done_at)
  select p.id, 'reg_luksus', '{"give":"haill","type":"luksus","gift":true}'::jsonb, now() from public.players p
   where p.id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
on conflict do nothing;

-- tm_hello as in 20261004120000_cloud.sql, with the gift: made here because every start with a sign-in says hello before it asks for
-- what waits (cloudGate, then shopStart). What it answers is unchanged
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
    'owned', coalesce((select jsonb_agg(product_id) from entitlements where player_id = p), '[]'::jsonb));
end $$;
