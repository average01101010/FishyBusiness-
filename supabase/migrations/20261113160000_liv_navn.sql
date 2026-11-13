-- TP2 (steg 109, docs/planer/tilpasning.md; Jonas 12.11.2026, V4 B «Tre skrifter og farge», V2 A 29 kr). The paint goes to the
-- other players with the position (liv, vessel3d.js livStr). Three things here:
--   1. Room: pos_put keeps 320 characters of it, not 160. The longest code the game made before was 151 (seven colours, gloss, the house
--      flag, the mark and a made logo); the name's lettering ('n:a.oksblod') and the home port ('k:m1234') would not fit beside a
--      partner's design. A game from before reads only the parts it knows, so a longer code does it no harm.
--   2. The paid parts by a table: liv_paid says which letter of the code needs which product, so a new paid part is only a row. The
--      flag ('f') stays as it was: a nation's flag is des_flagg, the house flag (f:LOGO.<shape>) des_logo.
--   3. The product des_navn (the name's lettering and ink, 'n:'), 29 kr, a paint shop thing like the designs (skin: an entitlement).
-- The home port ('k:') and everything else not in the table is free and stays. Everything else is as in 20261105140000_liv_owned.sql.
-- Run on the test project first by hand (Jonas), in production just before the release that carries the code.

create table if not exists public.liv_paid (k text primary key check (k ~ '^[a-z]$'), product text not null);
alter table public.liv_paid enable row level security;   -- (no policies: only pos_put, security definer, reads it)
revoke all on table public.liv_paid from anon, authenticated;
insert into public.liv_paid (k, product) values
  ('r', 'des_ripe'), ('t', 'des_totone'), ('v', 'des_vann'), ('s', 'des_stripe'), ('g', 'des_lakk'), ('l', 'des_logo'), ('n', 'des_navn')
on conflict (k) do update set product = excluded.product;

insert into public.products (id, kind, name_no, name_en, price_nok, data) values
  ('des_navn', 'skin', 'Navnet: skrift og farge', 'The name: lettering and colour', 29, '{"give":"cos","k":"navn"}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, data = excluded.data, active = true;

create or replace function public.pos_put(x real, y real, hd real, v real, st text, boat text, vtype text, liv text default '', fs real default null,
                                          lk text default '', ck text default '', rt text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); lv text := left(regexp_replace(coalesce(pos_put.liv, ''), '[^A-Za-z0-9:;,._=-]', '', 'g'), 320); own text[];
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if pos_put.x is null or pos_put.y is null or pos_put.x <> pos_put.x or pos_put.y <> pos_put.y or abs(pos_put.x) > 5000 or abs(pos_put.y) > 5000 then raise exception 'bad position'; end if;
  -- the paid parts only when the account owns them (liv_paid; the flag by its kind)
  if lv ~ '(^|;)f:' or exists (select 1 from liv_paid q where lv ~ ('(^|;)' || q.k || ':')) then
    select coalesce(array_agg(e.product_id), '{}') into own from entitlements e where e.player_id = p and e.product_id like 'des\_%';
    select coalesce(string_agg(u.x, ';' order by u.o), '') into lv from unnest(string_to_array(lv, ';')) with ordinality u(x, o)
     where case when split_part(u.x, ':', 1) = 'f' then (case when split_part(u.x, ':', 2) like 'LOGO.%' then 'des_logo' else 'des_flagg' end) = any(own)
                else not exists (select 1 from liv_paid q where q.k = split_part(u.x, ':', 1) and not (q.product = any(own))) end;
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
