-- Ø6 funn 5 (05.11.2026, docs/planer/sikkerhet-skyen.md; Jonas: «Kjør på funn 5 og 14»). The paint goes to the other players with the
-- position (liv, vessel3d.js livStr). The designs that cost real money were shown to everyone whatever the game sent: a design taken
-- free (#nocloud on the game's site gave the shop's test buys, now closed in ui/10i-shop.js shopMode) or put into the save by hand
-- was seen by all. Now pos_put keeps a paid part only when the account owns the design (entitlements, written by shop_paid when Stripe
-- says it is paid, taken away by shop_refund):
--   r ripe, t totone, v vann, s stripe, g lakk  -> des_ripe, des_totone, des_vann, des_stripe, des_lakk
--   f a flag (any but Norway's rectangle, which the game never sends) -> des_flagg; f:LOGO.<shape> (the house flag) -> des_logo
--   l the company's logo -> des_logo
-- The rest is free and stays: h, o, d (the colours, paid in the game's kroner), m (the registration mark; choosing the number is
-- des_reg, held by reg_claim) and p (the week's pennants). The player's own boat is drawn from the save, so the player still sees
-- what was put on it; only the others see the boat without what is not owned. Everything else is as in 20261103120000_route.sql.
create or replace function public.pos_put(x real, y real, hd real, v real, st text, boat text, vtype text, liv text default '', fs real default null,
                                          lk text default '', ck text default '', rt text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); lv text := left(regexp_replace(coalesce(pos_put.liv, ''), '[^A-Za-z0-9:;,._=-]', '', 'g'), 160); own text[];
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if pos_put.x is null or pos_put.y is null or pos_put.x <> pos_put.x or pos_put.y <> pos_put.y or abs(pos_put.x) > 5000 or abs(pos_put.y) > 5000 then raise exception 'bad position'; end if;
  -- the paid designs only when the account owns them
  if lv ~ '(^|;)[rtvsgfl]:' then
    select coalesce(array_agg(e.product_id), '{}') into own from entitlements e where e.player_id = p and e.product_id like 'des\_%';
    select coalesce(string_agg(u.x, ';' order by u.o), '') into lv from unnest(string_to_array(lv, ';')) with ordinality u(x, o)
     where case split_part(u.x, ':', 1)
             when 'r' then 'des_ripe' = any(own) when 't' then 'des_totone' = any(own) when 'v' then 'des_vann' = any(own)
             when 's' then 'des_stripe' = any(own) when 'g' then 'des_lakk' = any(own)
             when 'f' then (case when split_part(u.x, ':', 2) like 'LOGO.%' then 'des_logo' else 'des_flagg' end) = any(own)
             when 'l' then 'des_logo' = any(own)
             else true end;
  end if;
  insert into presence (player_id, boat, vtype, x, y, hd, v, st, liv, lk, ck, rt, at)
    values (p, left(btrim(regexp_replace(coalesce(pos_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24), left(regexp_replace(coalesce(pos_put.vtype, ''), '[^a-z0-9_]', '', 'g'), 24),
            pos_put.x, pos_put.y, coalesce(pos_put.hd, 0), least(greatest(coalesce(pos_put.v, 0), 0), 60), left(regexp_replace(coalesce(pos_put.st, ''), '[^a-z]', '', 'g'), 16),
            lv,
            left(regexp_replace(coalesce(pos_put.lk, ''), '[^a-z0-9.;-]', '', 'g'), 64), left(regexp_replace(coalesce(pos_put.ck, ''), '[^a-z0-9.;-]', '', 'g'), 300),
            left(regexp_replace(coalesce(pos_put.rt, ''), '[^0-9.,;-]', '', 'g'), 640), now())
    on conflict (player_id) do update set boat = excluded.boat, vtype = excluded.vtype, x = excluded.x, y = excluded.y, hd = excluded.hd,
      v = excluded.v, st = excluded.st, liv = excluded.liv, lk = excluded.lk, ck = excluded.ck, rt = excluded.rt, at = excluded.at;
  if is_guest() then update players set guest = true where id = p and not guest; end if;
  if pos_put.fs is not null and pos_put.fs = pos_put.fs and pos_put.fs >= 0 then
    update players pl set fs = greatest(pl.fs, least(pos_put.fs, case when pl.fs_at is null then 65000 else pl.fs + 5000 * extract(epoch from now() - pl.fs_at) / 3600 end)),
      fs_at = now() where pl.id = p;
  end if;
end $$;
