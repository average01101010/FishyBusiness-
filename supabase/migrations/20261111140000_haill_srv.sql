-- The server is the truth for haill and everything bought (HS4, 11.11.2026; docs/planer/haill-saldo.md; Jonas 10.11.2026, valg 29 V3:
-- «Spillere skal ikke kunne redigere sin egen lagring og gi seg selv så mye haill eller andre varer de selv vil. Det må fikses.»).
-- After HS2 and HS3 the server keeps the haill that is bought or given and gives a trim, a Skippertak and the yard done now back to
-- a save without them, but the save was still the truth for what is switched on, and for the haill from the pub and the chapters:
-- whoever wrote in the save had it. From here the save is only a copy of these. The game asks shop_state() at every start with a
-- network and every claim, and writes over the copy with the answer (ui/10i-shop.js shopClaim, srvApply).
--
--   game_min()            the world's minute now, with the constants of src/js/core/01-world.js (WORLD_T0 05.10.2026 15:00 UTC,
--                         GAME_RATE 6): seconds since then / 10. game_min_at(ts) the same for a time
--   pub_spin()            the pub's wheel drawn here: one round per evening by the world clock, 15:00–03:00 game time, the weights
--                         of PUB_WHEEL (core/03-simulation.js: empty 60, rumour 25, haill 12, luksus 3). A haill is a grant,
--                         delivered at once and kept until it is switched on. The 1 000 kroner are still paid in the game (V4 A)
--   ach_haill(ch)         the haill of chapter 2 (ch = 1), one grant per account for good
--   haill_import(inv)     the game's own numbers (S.haillInv, the haill aboard, S.yardCredit) made into grants, once per account,
--                         within a cap: 2 haill, 1 luksus, plus what this server itself delivered into the saves before it kept
--                         them (the grants HS2 and this file count as used when they run); the yard credit only within those;
--                         the haill aboard counts as one of its kind
--   grants_moved          a guest's grants moved to an account (guest_merge) never get past «once per account»: the chapter's
--                         haill and the imported ones are taken back when the account has had its own (or another guest's), and a
--                         pub haill when the account already had a round that evening. Else a row of guests could be merged
--                         into one account, each with its own free haill
--   haill_on(id, t0)      as haill_use(id), with the game minute it was switched on: never later than the server's own minute, so
--                         a haill cannot be made longer (an earlier minute only shortens it: switched on with no network, V1 A)
--   yard_use(id)          the yard done now is a grant that is unused until it finishes a job: the credit is counted here
--   shop_state()          what the game needs to write over its copy: the server's minute, the grants (the open ones; the haill
--                         that is unused; the trim and Skippertak delivered the last 90 days, so a long row of them bought after
--                         each other keeps its end; the yard grants not used), the haill
--                         switched on last with its minute, whether the import is done, the paint designs the account owns (entitlements,
--                         as tm_hello's owned) and the last round at the pub. The open
--                         grants of these kinds are delivered by this call itself (done_at), marked new:true in that answer, so
--                         the end of a trim is the server's from the first moment and no shop_done is needed for them
--   shop_pending()        as after HS3 (20261111120000_shop_back.sql), but a yard grant that is used (yard_use) is no longer
--                         answered, so a page from before HS4 never gives again a credit a page from after it has used
-- haill_use and shop_done are left as they are: a page from before HS4 goes on as after HS3. Only the player's own
-- (authenticated; a guest is an anonymous user and has its pub haill and thank-you haill as grants on the guest, which guest_merge
-- moves). Nothing that shares anything with other players (pos_put, pos_world, land_put, the leaderboards, Kystposten) reads grants,
-- used_at or any of this.

create or replace function public.game_min_at(ts timestamptz) returns double precision language sql immutable set search_path = '' as $$
  select greatest(0, extract(epoch from ts - timestamptz '2026-10-05 15:00:00+00') / 10.0)::double precision
$$;
create or replace function public.game_min() returns double precision language sql stable set search_path = '' as $$
  select public.game_min_at(now())
$$;

-- what the server gives that is not bought: never for sale (not active, so shop_quote refuses them), no price
insert into public.products (id, kind, name_no, name_en, price_nok, active, data) values
  ('pub_haill', 'booster', 'Haill fra puben', 'Luck from the pub', 0, false, '{"give":"haill","type":"haill","pub":true}'),
  ('pub_luksus', 'booster', 'Luksushaill fra puben', 'Luxury luck from the pub', 0, false, '{"give":"haill","type":"luksus","pub":true}'),
  ('ach_haill', 'booster', 'Haill for kapittel 2', 'Luck for chapter 2', 0, false, '{"give":"haill","type":"haill","ach":1}'),
  ('imp_haill', 'booster', 'Haill fra lagringen', 'Luck from the save', 0, false, '{"give":"haill","type":"haill","imp":true}'),
  ('imp_luksus', 'booster', 'Luksushaill fra lagringen', 'Luxury luck from the save', 0, false, '{"give":"haill","type":"luksus","imp":true}'),
  ('imp_takk', 'booster', 'Takk-haill fra lagringen', 'Thank-you luck from the save', 0, false, '{"give":"haill","type":"takk","imp":true}'),
  ('imp_yard', 'booster', 'Ferdig nå fra lagringen', 'Done now from the save', 0, false, '{"give":"yard","imp":true}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, active = false, data = excluded.data;

-- The game minute a haill was switched on. The yard grants delivered when this file is first run are already in the saves' own
-- number (S.yardCredit) or used, and which cannot be seen: they all count as used, as the haill did in HS2. Done only when the
-- column is made, so running the file again never takes a credit the server keeps
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'grants' and column_name = 't0') then
    alter table public.grants add column t0 double precision;
    update public.grants set used_at = done_at where data ->> 'give' = 'yard' and done_at is not null and used_at is null;
  end if;
end $$;

-- one round per evening and player (e: the evening, as pubEvening in core/03-simulation.js)
create table if not exists public.pub_rounds (
  player_id text not null references public.players(id) on delete cascade,
  e int not null,
  k text not null,
  grant_id bigint,
  at timestamptz not null default now(),
  primary key (player_id, e)
);
alter table public.pub_rounds enable row level security;
revoke all on public.pub_rounds from anon, authenticated;

-- what is given once per account for good ('ach1': the haill of chapter 2; 'import': the save's own numbers made into grants)
create table if not exists public.haill_once (
  player_id text not null references public.players(id) on delete cascade,
  what text not null,
  data jsonb,
  at timestamptz not null default now(),
  primary key (player_id, what)
);
alter table public.haill_once enable row level security;
revoke all on public.haill_once from anon, authenticated;

create or replace function public.pub_spin() returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); h double precision := game_min() / 60.0; hr int; ev int; x double precision; kk text; gid bigint; was text;
begin
  if p is null then raise exception 'not signed in'; end if;
  -- (game hour 0 is 06:00 on the clock, EPOCH in core/01-world.js; an evening opens at 15:00 and closes at 03:00)
  hr := ((floor(h + 6)::bigint % 24) + 24) % 24; ev := floor((h + 6 - 15) / 24.0)::int;
  if not (hr >= 15 or hr < 3) then return jsonb_build_object('ok', false, 'why', 'closed', 'e', ev); end if;
  x := random() * 100;
  kk := case when x < 60 then 'tom' when x < 85 then 'rykte' when x < 97 then 'haill' else 'luksus' end;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  insert into pub_rounds (player_id, e, k) values (p, ev, kk) on conflict do nothing;
  if not found then
    select r.k into was from pub_rounds r where r.player_id = p and r.e = ev;
    return jsonb_build_object('ok', false, 'why', 'had', 'e', ev, 'k', was);
  end if;
  if kk in ('haill', 'luksus') then
    insert into grants (player_id, product_id, data, done_at) select p, pr.id, pr.data, now() from products pr where pr.id = 'pub_' || kk returning id into gid;
    update pub_rounds r set grant_id = gid where r.player_id = p and r.e = ev;
  end if;
  return jsonb_build_object('ok', true, 'k', kk, 'e', ev, 'id', gid);
end $$;

create or replace function public.ach_haill(ch int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); gid bigint;
begin
  if p is null then raise exception 'not signed in'; end if;
  if ch is distinct from 1 then return jsonb_build_object('ok', false); end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  insert into haill_once (player_id, what) values (p, 'ach1') on conflict do nothing;
  if not found then return jsonb_build_object('ok', false); end if;
  insert into grants (player_id, product_id, data, done_at) select p, pr.id, pr.data, now() from products pr where pr.id = 'ach_haill' returning id into gid;
  return jsonb_build_object('ok', true, 'id', gid);
end $$;

create or replace function public.haill_import(inv jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int; cap int; out jsonb := '{"ok":true}'::jsonb; ty text; ot text := inv -> 'on' ->> 'type'; ot0 double precision;
  num constant text := '^-?[0-9]+(\.[0-9]+)?$';
begin
  if p is null then raise exception 'not signed in'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  insert into haill_once (player_id, what, data) values (p, 'import', case when length(inv::text) <= 400 then inv end) on conflict do nothing;
  if not found then return jsonb_build_object('ok', false); end if;
  foreach ty in array array['haill', 'luksus', 'takk', 'yard'] loop
    -- (the cap: what the game itself could have given, 2 haill and 1 luksus from the pub and the chapter, and what this server
    -- delivered into the save before it kept them: those grants have used_at = done_at from when HS2's and this file were run)
    select count(*) into cap from grants g where g.player_id = p and g.revoked_at is null and g.used_at is not null and g.used_at = g.done_at
       and g.product_id not like 'imp\_%' and case when ty = 'yard' then g.data ->> 'give' = 'yard' else g.data ->> 'give' = 'haill' and g.data ->> 'type' = ty end;
    cap := cap + case ty when 'haill' then 2 when 'luksus' then 1 else 0 end;
    -- the haill aboard when the save came over: one, as used, with its minute (never later than now), and within the cap of its kind
    if ty = ot and ty <> 'yard' and cap > 0 then
      ot0 := case when (inv -> 'on' ->> 't0') ~ num then (inv -> 'on' ->> 't0')::double precision else game_min() end;
      insert into grants (player_id, product_id, data, done_at, used_at, t0) select p, pr.id, pr.data, now(), now(), least(ot0, game_min()) from products pr where pr.id = 'imp_' || ot;
      out := out || jsonb_build_object('on', ot); cap := cap - 1;
    end if;
    n := case when (inv ->> ty) ~ num then least(floor((inv ->> ty)::numeric), 100000)::int else 0 end;
    n := greatest(0, least(n, cap));
    insert into grants (player_id, product_id, data, done_at) select p, pr.id, pr.data, now() from products pr, generate_series(1, n) where pr.id = 'imp_' || ty;
    out := out || jsonb_build_object(ty, n);
  end loop;
  return out;
end $$;

create or replace function public.haill_on(id bigint, t0 double precision) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int; gm double precision := game_min();
begin
  if p is null then raise exception 'not signed in'; end if;
  update grants g set used_at = now(), done_at = coalesce(g.done_at, now()), t0 = least(coalesce(haill_on.t0, gm), gm)
   where g.id = haill_on.id and g.player_id = p and g.data ->> 'give' = 'haill' and g.used_at is null and g.revoked_at is null;
  get diagnostics n = row_count;
  if n > 0 then return jsonb_build_object('ok', true); end if;
  -- (used before: on another device with no network, V1 A. Gone: taken back, another player's, another kind or not there)
  return jsonb_build_object('ok', false, 'why', case when exists (select 1 from grants g where g.id = haill_on.id and g.player_id = p
    and g.data ->> 'give' = 'haill' and g.used_at is not null and g.revoked_at is null) then 'used' else 'gone' end);
end $$;

create or replace function public.yard_use(id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int;
begin
  if p is null then raise exception 'not signed in'; end if;
  update grants g set used_at = now(), done_at = coalesce(g.done_at, now())
   where g.id = yard_use.id and g.player_id = p and g.data ->> 'give' = 'yard' and g.used_at is null and g.revoked_at is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.shop_state() returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); fresh bigint[];
begin
  if p is null then raise exception 'not signed in'; end if;
  with u as (update grants g set done_at = now() where g.player_id = p and g.done_at is null and g.revoked_at is null
      and g.data ->> 'give' in ('haill', 'trim', 'skip', 'yard') returning g.id)
    select coalesce(array_agg(u.id), '{}') into fresh from u;
  return jsonb_build_object('v', 4, 't', game_min(),
    'list', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'product', g.product_id, 'data', g.data)
        || case when g.done_at is not null then jsonb_build_object('held', true, 'done_at', g.done_at) else '{}'::jsonb end
        || case when g.id = any(fresh) then '{"new":true}'::jsonb else '{}'::jsonb end order by g.id), '[]'::jsonb)
      from grants g where g.player_id = p and g.revoked_at is null
       and (g.done_at is null
         or (g.data ->> 'give' in ('haill', 'yard') and g.used_at is null)
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

create or replace function public.shop_pending() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'product', g.product_id, 'data', g.data)
      || case when g.done_at is not null then jsonb_build_object('held', true, 'done_at', g.done_at) else '{}'::jsonb end order by g.id), '[]'::jsonb)
    from grants g where g.player_id = pid() and g.revoked_at is null
     and (g.done_at is null
       or (g.data ->> 'give' = 'haill' and g.used_at is null)
       or (g.data ->> 'give' in ('trim', 'skip') and g.done_at > now() - interval '7 days')
       or (g.data ->> 'give' = 'yard' and g.used_at is null and g.done_at > now() - interval '1 day'))
$$;

-- (guest_merge, 20261105130000_guest_world.sql, moves every grant of the guest to the account, and the guest's rows in haill_once
-- and pub_rounds go with the guest: without this the «once» would be once per guest)
create or replace function public.grants_moved() returns trigger
language plpgsql security definer set search_path = public as $$
declare ev int;
begin
  if new.revoked_at is not null then return new; end if;
  if new.product_id = 'ach_haill' then
    insert into haill_once (player_id, what, data) values (new.player_id, 'ach1', jsonb_build_object('from', old.player_id)) on conflict do nothing;
    if not found then new.revoked_at := now(); end if;
  elsif new.product_id like 'imp\_%' then
    insert into haill_once (player_id, what, data) values (new.player_id, 'import', jsonb_build_object('from', old.player_id)) on conflict do nothing;
    if not found and not exists (select 1 from haill_once o where o.player_id = new.player_id and o.what = 'import' and o.data ->> 'from' = old.player_id) then new.revoked_at := now(); end if;
  elsif new.product_id like 'pub\_%' then
    select r.e into ev from pub_rounds r where r.player_id = old.player_id and r.grant_id = new.id;
    if ev is not null then
      insert into pub_rounds (player_id, e, k, grant_id) values (new.player_id, ev, coalesce(new.data ->> 'type', 'haill'), new.id) on conflict do nothing;
      if not found then new.revoked_at := now(); end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists grants_moved on public.grants;
create trigger grants_moved before update of player_id on public.grants
  for each row when (old.player_id is distinct from new.player_id) execute function public.grants_moved();
revoke all on function public.grants_moved() from public, anon, authenticated;

revoke all on function public.game_min(), public.game_min_at(timestamptz), public.pub_spin(), public.ach_haill(int), public.haill_import(jsonb),
  public.haill_on(bigint, double precision), public.yard_use(bigint), public.shop_state() from public, anon, authenticated;
grant execute on function public.pub_spin(), public.ach_haill(int), public.haill_import(jsonb), public.haill_on(bigint, double precision),
  public.yard_use(bigint), public.shop_state() to authenticated;
