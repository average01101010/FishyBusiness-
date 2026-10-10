-- The paint shop's designs, flags and own registration numbers (07.10.2026; ui/10j-paint.js): bought once for real money and then the player's on every boat and every
-- device. A paid design is a grant like the boosters (the game gives it, ui/10i-shop.js shopGive 'cos') and an entitlement on the account
-- (tm_hello's owned list), which a refund takes away again. Prices are here; the game shows the same (PAINT.DNOK).
insert into public.products (id, kind, name_no, name_en, price_nok, data) values
  ('des_ripe', 'skin', 'Malingsdesign: ripestripe', 'Paint design: sheer stripe', 29, '{"give":"cos","k":"ripe"}'),
  ('des_totone', 'skin', 'Malingsdesign: totone', 'Paint design: two-tone', 29, '{"give":"cos","k":"totone"}'),
  ('des_vann', 'skin', 'Malingsdesign: vannlinjestripe', 'Paint design: boot stripe', 29, '{"give":"cos","k":"vann"}'),
  ('des_stripe', 'skin', 'Malingsdesign: stripefarge', 'Paint design: stripe colour', 29, '{"give":"cos","k":"stripe"}'),
  ('des_lakk', 'skin', 'Malingsdesign: nylakkert', 'Paint design: fresh gloss', 29, '{"give":"cos","k":"lakk"}'),
  ('des_flagg', 'skin', 'Flagg: alle nasjoner og former', 'Flags: all nations and shapes', 19, '{"give":"cos","k":"flagg"}'),
  ('des_reg', 'skin', 'Ønskenummer i registreringsmerket', 'Your own number in the registration mark', 29, '{"give":"cos","k":"reg"}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, data = excluded.data, active = true;

create or replace function public.shop_paid(sid text, pi text) returns boolean
language plpgsql security definer set search_path = public as $$
declare u purchases; d jsonb; k text;
begin
  update purchases set status = 'paid', paid_at = coalesce(paid_at, now()), payment_intent = coalesce(shop_paid.pi, payment_intent)
   where id = shop_paid.sid and status in ('open', 'failed', 'expired') returning * into u;
  if u.id is null then return false; end if;
  select data, kind into d, k from products where id = u.product_id;
  if u.player_id is not null then
    insert into grants (player_id, product_id, purchase_id, data) values (u.player_id, u.product_id, u.id, coalesce(d, '{}') || coalesce(u.data, '{}'))
      on conflict (purchase_id) do nothing;
    if k = 'skin' then
      insert into entitlements (player_id, product_id, source) values (u.player_id, u.product_id, 'stripe:' || u.id) on conflict (player_id, product_id) do nothing;
    end if;
  end if;
  return true;
end $$;

create or replace function public.shop_refund(pi text) returns void
language plpgsql security definer set search_path = public as $$
declare u purchases;
begin
  update purchases set status = 'refunded', refunded_at = now() where payment_intent = shop_refund.pi and status = 'paid' returning * into u;
  if u.id is not null then
    update grants set revoked_at = now() where purchase_id = u.id and done_at is null;
    delete from entitlements where player_id = u.player_id and product_id = u.product_id and source = 'stripe:' || u.id;
  end if;
end $$;

-- a number of one's own choosing in the registration mark («ønskenummer»): one player's per mark, so no two boats in the shared world
-- wear the same (the game also keeps clear of the real vessels' numbers, src/data/regmerke.json); at most ten per player
create table if not exists public.reg_claims (
  mark text primary key check (mark ~ '^[A-ZÆØÅ]{1,2}-[0-9]{1,4}-[A-ZÆØÅ]{1,3}$'),
  player_id text not null references public.players(id) on delete cascade,
  at timestamptz not null default now()
);
alter table public.reg_claims enable row level security;
revoke all on public.reg_claims from anon, authenticated;
create or replace function public.reg_claim(mark text) returns boolean
language plpgsql security definer set search_path = public as $$
declare p text := pid(); o text;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  if reg_claim.mark !~ '^[A-ZÆØÅ]{1,2}-[0-9]{1,4}-[A-ZÆØÅ]{1,3}$' then raise exception 'bad mark'; end if;
  select player_id into o from reg_claims where reg_claims.mark = reg_claim.mark;
  if o is not null then return o = p; end if;
  if (select count(*) from reg_claims where player_id = p) >= 10 then raise exception 'too many'; end if;
  insert into reg_claims (mark, player_id) values (reg_claim.mark, p) on conflict do nothing;
  return (select player_id from reg_claims where reg_claims.mark = reg_claim.mark) = p;
end $$;
revoke all on function public.reg_claim(text) from public, anon;
grant execute on function public.reg_claim(text) to authenticated;
