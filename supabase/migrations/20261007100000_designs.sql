-- The paint shop's designs (07.10.2026; ui/10j-paint.js): bought once for real money and then the player's on every boat and every
-- device. A paid design is a grant like the boosters (the game gives it, ui/10i-shop.js shopGive 'cos') and an entitlement on the account
-- (tm_hello's owned list), which a refund takes away again. Prices are here; the game shows the same (PAINT.DNOK).
insert into public.products (id, kind, name_no, name_en, price_nok, data) values
  ('des_ripe', 'skin', 'Malingsdesign: ripestripe', 'Paint design: sheer stripe', 29, '{"give":"cos","k":"ripe"}'),
  ('des_totone', 'skin', 'Malingsdesign: totone', 'Paint design: two-tone', 29, '{"give":"cos","k":"totone"}'),
  ('des_vann', 'skin', 'Malingsdesign: vannlinjestripe', 'Paint design: boot stripe', 29, '{"give":"cos","k":"vann"}'),
  ('des_stripe', 'skin', 'Malingsdesign: stripefarge', 'Paint design: stripe colour', 29, '{"give":"cos","k":"stripe"}'),
  ('des_lakk', 'skin', 'Malingsdesign: nylakkert', 'Paint design: fresh gloss', 29, '{"give":"cos","k":"lakk"}')
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
