-- B4 of docs/planer/bestand-og-flaate.md (02.11.2026): the balance when players come. One shared register of the closed group on the
-- server, so every player sees the same NPC owners and a right a player buys is gone from the NPCs for everybody; the open group's
-- boats counted from the players who are active; the players' catch per group sent with the world, so the fleet's pressure gives way
-- (03g-trykk.js); and the stock and the year's catch per group made ready on the server, with the switch off until the admin turns it on.
-- Nothing here adds a call per player: it all comes and goes with world_get (every ten minutes) and land_put (each landing), which the
-- game already makes; a right is taken or freed only when a player buys or sells one.
--
--   reg_rights      the rights per quota length the game sells (Fiskeridirektoratet: 1 622 in the cod fishery north of 62° N on
--                   17.10.2025, case document 5/2025 table 8, split as REGN in 03d-quota.js)
--   reg_held        the rights each player holds; a holder with no landing and no purchase in 90 days gives the place back (counted
--                   free; the row stays, so the right comes back to the player who lands again while there is room)
--   world_cfg       the switches: stock_server (the stock and the year's catch from the server instead of each game's seed) and
--                   share_limit (the players' share of a group quota at which the admin is told to turn it on)
--   world_stock     the stock per species and year when stock_server is on (spawning stock, total quota, advice; t)
--   reg_take(rid)   a player buys a right of an NPC owner: refused when no NPC owner is left at that length
--   reg_free(rid)   a player sells or structures a right away
--   world_get       as before, and reg (the NPC owners left per length), open_boats (the players active in the open group this year),
--                   grp (the other players' catch this year per group and species, kg), stock (when the switch is on)
--   admin_share(y)  the players' catch per group and species against the group quota, for the admin's line
--   admin_cfg_set, admin_stock_set   the switch and the stock rows (admin with the second factor)

create table if not exists public.reg_rights (
  id text primary key check (id in ('u7', 'h7', 'h8', 'h9', 'h10', 'h14', 'h20')),
  total int not null check (total >= 0 and total <= 10000)
);
insert into public.reg_rights (id, total) values ('u7', 300), ('h7', 280), ('h8', 230), ('h9', 200), ('h10', 162), ('h14', 291), ('h20', 103)
  on conflict (id) do nothing;
create table if not exists public.reg_held (
  player_id text not null references public.players(id) on delete cascade,
  id text not null references public.reg_rights(id),
  n int not null default 1 check (n >= 1 and n <= 20),
  at timestamptz not null default now(),
  primary key (player_id, id)
);
create table if not exists public.world_cfg (k text primary key check (k in ('stock_server', 'share_limit')), v jsonb not null);
insert into public.world_cfg (k, v) values ('stock_server', 'false'::jsonb), ('share_limit', '0.01'::jsonb) on conflict (k) do nothing;
create table if not exists public.world_stock (
  sp text not null check (sp in ('torsk', 'hyse', 'sei', 'blakveite')),
  y smallint not null check (y >= 2026 and y <= 2200),
  ssb real not null check (ssb > 0), tac real not null check (tac >= 0), adv real not null check (adv >= 0),
  primary key (sp, y)
);
alter table public.reg_rights enable row level security;
alter table public.reg_held enable row level security;
alter table public.world_cfg enable row level security;
alter table public.world_stock enable row level security;
revoke all on public.reg_rights, public.reg_held, public.world_cfg, public.world_stock from anon, authenticated;
-- what world_get needs, kept as the landings come in (5 000 players: world_get is asked 500 times a minute, and reading 200 000 landings
-- each time cost 100-170 ms; the year's sums per player and the shared picture once a minute cost a few):
--   world_year   per year, account, species and player: kg, kg on the quota and the last landing (a trigger on landings)
--   world_agg    per year: the shared picture (the open group's catch per player capped as before, the boats, the open group's active
--                players, the catch per group and species, the register), worked out at most once a minute by whoever asks first
create table if not exists public.world_year (
  y smallint not null, acc text not null, sp text not null, player_id text not null references public.players(id) on delete cascade,
  kg double precision not null default 0, kgq double precision not null default 0, last timestamptz not null default now(),
  primary key (y, acc, sp, player_id)
);
create index if not exists world_year_player on public.world_year (player_id, last desc);
create table if not exists public.world_agg (y smallint primary key, at timestamptz not null, d jsonb not null);
alter table public.world_year enable row level security;
alter table public.world_agg enable row level security;
revoke all on public.world_year, public.world_agg from anon, authenticated;
create or replace function public.world_year_add() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into world_year (y, acc, sp, player_id, kg, kgq, last) values (new.y, new.acc, new.sp, new.player_id, new.kg, new.kgq, new.at)
    on conflict (y, acc, sp, player_id) do update set kg = world_year.kg + excluded.kg, kgq = world_year.kgq + excluded.kgq, last = greatest(world_year.last, excluded.last);
  return null;
end $$;
drop trigger if exists landings_world_year on public.landings;
create trigger landings_world_year after insert on public.landings for each row execute function public.world_year_add();
insert into public.world_year (y, acc, sp, player_id, kg, kgq, last)
  select l.y, l.acc, l.sp, l.player_id, sum(l.kg), sum(l.kgq), max(l.at) from public.landings l group by l.y, l.acc, l.sp, l.player_id
  on conflict (y, acc, sp, player_id) do nothing;
revoke all on function public.world_year_add() from public, anon, authenticated;

-- the rights held by active players, per length: a holder is active with a landing or a purchase in the last 90 days
create or replace function public.reg_active() returns table (id text, n bigint)
language sql stable security definer set search_path = public as $$
  select h.id, sum(h.n)::bigint from reg_held h
   where h.at > now() - interval '90 days' or exists (select 1 from world_year w where w.player_id = h.player_id and w.last > now() - interval '90 days')
   group by h.id
$$;
create or replace function public.reg_free_counts() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(r.id, greatest(0, r.total - coalesce(a.n, 0))), '{}'::jsonb) from reg_rights r left join reg_active() a on a.id = r.id
$$;

create or replace function public.reg_take(rid text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); free int;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where players.id = p) then raise exception 'no player'; end if;
  if not exists (select 1 from reg_rights r where r.id = reg_take.rid) then raise exception 'bad right'; end if;
  perform 1 from reg_rights r where r.id = reg_take.rid for update;   -- one purchase at a time per length
  free := (reg_free_counts() ->> reg_take.rid)::int;
  if free <= 0 then raise exception 'no owner left'; end if;
  insert into reg_held (player_id, id) values (p, reg_take.rid)
    on conflict (player_id, id) do update set n = least(20, reg_held.n + 1), at = now();
  delete from world_agg where y is not null;   -- the register changed: everybody sees it at once (a purchase is rare; the where for pg_safeupdate)
  return reg_free_counts();
end $$;
create or replace function public.reg_free(rid text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  delete from reg_held h where h.player_id = p and h.id = reg_free.rid and h.n <= 1;
  update reg_held h set n = h.n - 1 where h.player_id = p and h.id = reg_free.rid;
  delete from world_agg where y is not null;
  return reg_free_counts();
end $$;

-- the shared picture of a year, at most a minute old (the first to ask after a minute works it out)
create or replace function public.world_agg_get(yy int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r world_agg;
begin
  select * into r from world_agg a where a.y = yy;
  if found and r.at > now() - interval '1 minute' then return r.d; end if;
  insert into world_agg (y, at, d) values (yy, now(), jsonb_build_object(
    'open', (select coalesce(sum(least(w.kgq, 60000)), 0) from world_year w where w.y = yy and w.acc = 'open' and w.sp = 'torsk'),
    'boats', (select count(distinct w.player_id) from world_year w where w.y = yy),
    'open_boats', (select count(distinct w.player_id) from world_year w where w.y = yy and w.acc = 'open' and w.last > now() - interval '90 days'),
    'grp', (select coalesce(jsonb_object_agg(k, kg), '{}'::jsonb) from (select w.acc || ':' || w.sp k, round(sum(least(w.kg, 60000))::numeric) kg from world_year w
              where w.y = yy and w.acc in ('open', 'lukket') and w.sp in ('torsk', 'hyse', 'sei') group by w.acc, w.sp) g),
    'reg', reg_free_counts()))
  on conflict (y) do update set at = excluded.at, d = excluded.d
  returning d into r.d;
  return r.d;
end $$;
revoke all on function public.world_agg_get(integer) from public, anon, authenticated;

-- the world as before (world_v2), with the register, the open group's active players, the others' catch per group and the stock; the
-- year's sums come from the shared picture less the asking player's own (one lookup by key)
create or replace function public.world_get(since bigint, y int, gh double precision) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); g double precision := coalesce(world_get.gh, 0); on_ boolean; A jsonb; mine jsonb; myopen double precision; me boolean;
begin
  if p is null then raise exception 'not signed in'; end if;
  if g <> g or abs(g) > 1e7 then raise exception 'bad time'; end if;
  if world_get.y is null or world_get.y < 2026 or world_get.y > 2200 then raise exception 'bad year'; end if;
  on_ := coalesce((select (v #>> '{}')::boolean from world_cfg where k = 'stock_server'), false);
  A := world_agg_get(world_get.y);
  select coalesce(jsonb_object_agg(w.acc || ':' || w.sp, round(least(w.kg, 60000)::numeric)), '{}'::jsonb), coalesce(sum(least(w.kgq, 60000)) filter (where w.acc = 'open' and w.sp = 'torsk'), 0), count(*) > 0
    into mine, myopen, me from world_year w where w.y = world_get.y and w.player_id = p;
  return jsonb_build_object(
    'open', round(greatest(0, (A ->> 'open')::double precision - myopen)::numeric, 1),
    'boats', greatest(0, (A ->> 'boats')::int - case when me then 1 else 0 end),
    'open_boats', (A ->> 'open_boats')::int,
    'reg', A -> 'reg',
    'grp', (select coalesce(jsonb_object_agg(e.key, greatest(0, e.value::numeric - coalesce((mine ->> e.key)::numeric, 0))), '{}'::jsonb) from jsonb_each_text(A -> 'grp') e),
    'stock', case when on_ then (select coalesce(jsonb_agg(jsonb_build_array(s.sp, s.y, s.ssb, s.tac, s.adv)), '[]'::jsonb) from world_stock s) else null end,
    'mkt', (select coalesce(jsonb_agg(jsonb_build_array(port, sp, round(k::numeric, 1))), '[]'::jsonb) from (
              select port, sp, sum(k) k from (
                select l.port, l.sp, least(sum(l.kg * power(0.97, least(greatest(g - l.gh, 0), 400))), 40000) k from landings l
                 where l.at > now() - interval '1 day' and l.player_id <> p group by l.port, l.sp, l.player_id) a
               group by port, sp having sum(k) >= 1) b),
    'cells', (select coalesce(jsonb_agg(jsonb_build_array(cell, round(k::numeric, 1))), '[]'::jsonb) from (
               select cell, sum(k) k from (
                 select c.cell, least(sum(c.kg * power(0.996, least(greatest(g - c.gh, 0), 2000))), 5000) k from catches c
                  where c.id > coalesce(world_get.since, 0) and c.at > now() - interval '3 days' and c.player_id <> p group by c.cell, c.player_id) a
                group by cell having sum(k) >= 0.5 order by sum(k) desc limit 4000) b),
    'cur', (select coalesce(max(id), 0) from catches));
end $$;

-- the admin's line: the players' catch this year per group and species (t), the players active, the register, and the switches
create or replace function public.admin_share(y int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  return jsonb_build_object(
    'grp', (select coalesce(jsonb_agg(jsonb_build_object('acc', a.acc, 'sp', a.sp, 't', round((a.kg / 1000)::numeric, 1), 'n', a.n) order by a.acc, a.sp), '[]'::jsonb) from (
             select w.acc, w.sp, sum(w.kg) kg, count(*) n from world_year w where w.y = admin_share.y and w.acc in ('open', 'lukket') group by w.acc, w.sp) a),
    'open_boats', (select count(distinct w.player_id) from world_year w where w.y = admin_share.y and w.acc = 'open' and w.last > now() - interval '90 days'),
    'reg', reg_free_counts(), 'reg_total', (select jsonb_object_agg(r.id, r.total) from reg_rights r),
    'cfg', (select jsonb_object_agg(c.k, c.v) from world_cfg c),
    'stock', (select coalesce(jsonb_agg(jsonb_build_object('sp', s.sp, 'y', s.y, 'ssb', s.ssb, 'tac', s.tac, 'adv', s.adv) order by s.sp, s.y), '[]'::jsonb) from world_stock s));
end $$;
create or replace function public.admin_cfg_set(ck text, cv jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  if admin_cfg_set.ck = 'stock_server' and jsonb_typeof(admin_cfg_set.cv) <> 'boolean' then raise exception 'bad value'; end if;
  if admin_cfg_set.ck = 'share_limit' and (jsonb_typeof(admin_cfg_set.cv) <> 'number' or (admin_cfg_set.cv #>> '{}')::numeric not between 0 and 1) then raise exception 'bad value'; end if;
  insert into world_cfg (k, v) values (admin_cfg_set.ck, admin_cfg_set.cv) on conflict (k) do update set v = excluded.v;
end $$;
create or replace function public.admin_stock_set(ssp text, sy int, sssb real, stac real, sadv real) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  insert into world_stock (sp, y, ssb, tac, adv) values (admin_stock_set.ssp, admin_stock_set.sy, admin_stock_set.sssb, admin_stock_set.stac, admin_stock_set.sadv)
    on conflict (sp, y) do update set ssb = excluded.ssb, tac = excluded.tac, adv = excluded.adv;
end $$;

revoke all on function public.reg_active(), public.reg_free_counts() from public, anon, authenticated;
revoke all on function public.reg_take(text), public.reg_free(text), public.world_get(bigint, integer, double precision), public.admin_share(integer),
  public.admin_cfg_set(text, jsonb), public.admin_stock_set(text, integer, real, real, real) from public, anon, authenticated;
grant execute on function public.reg_take(text), public.reg_free(text), public.world_get(bigint, integer, double precision), public.admin_share(integer),
  public.admin_cfg_set(text, jsonb), public.admin_stock_set(text, integer, real, real, real) to authenticated;
