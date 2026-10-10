-- The shared world V2: one sea, one quota and one market for everyone (05.10.2026; Jonas: «fokuset nå må være å få koblet sammen
-- spillerne i verden med felles tid og alt det andre vi snakket om. Dette er nesten et mmorpg spill»). Each game sends what it sells
-- (one row a species: the plant, the game hour on the shared clock, the game year, the access group, the kilos and the cod counted on
-- the quota), and where its boats took fish from the sea (the 2 × 2 km cells of the game's local stock, core/03-simulation.js). Every
-- ten minutes it asks what the other players have done (ui/10h-world.js): their cod in the open group this year (added to the fleet's
-- catch that decides when the Directorate stops the fishing), what they delivered to each plant in the last real day (it fills the
-- plant and pushes its price down, as your own deliveries do), and the fish they took since the last ask, cell by cell (taken from
-- your sea too). What comes back has decayed with the game hours since, as the game's own market and stock recover. A player's share
-- is capped (60 t of open-group cod a year, 40 t at a plant, 5 t in a cell), so a game sending nonsense cannot stop the season or
-- empty the sea for the others. Nothing is given out about who: only sums. The tables have no policy: only the functions read and
-- write them. A deleted player takes the rows with them (on delete cascade).

create table if not exists public.landings (
  id bigint generated always as identity primary key,
  player_id text not null references public.players(id) on delete cascade,
  at timestamptz not null default now(),
  gh double precision not null,
  y smallint not null,
  port text not null check (char_length(port) <= 40),
  sp text not null check (char_length(sp) <= 16),
  acc text not null default 'none' check (acc in ('open', 'lukket', 'none')),
  kg real not null check (kg >= 0 and kg <= 100000),
  kgq real not null default 0 check (kgq >= 0 and kgq <= 100000)
);
create index if not exists landings_year on public.landings (y, acc, sp);
create index if not exists landings_at on public.landings (at desc);
create index if not exists landings_player on public.landings (player_id, at desc);
alter table public.landings enable row level security;
revoke all on public.landings from anon, authenticated;

create table if not exists public.catches (
  id bigint generated always as identity primary key,
  player_id text not null references public.players(id) on delete cascade,
  at timestamptz not null default now(),
  gh double precision not null,
  cell bigint not null,
  kg real not null check (kg > 0 and kg <= 50000)
);
create index if not exists catches_at on public.catches (at);
create index if not exists catches_player on public.catches (player_id, at desc);
alter table public.catches enable row level security;
revoke all on public.catches from anon, authenticated;

-- one sale: items is [{sp, kg, kgq}] (at most 24 species)
create or replace function public.land_put(gh double precision, y int, port text, acc text, items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); r jsonb;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 or y is null or y < 2026 or y > 2200 then raise exception 'bad time'; end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) > 24 then raise exception 'bad rows'; end if;
  if (select count(*) from landings where player_id = p and at > now() - interval '1 hour') > 400 then raise exception 'too many'; end if;
  for r in select * from jsonb_array_elements(items) loop
    if coalesce((r ->> 'kg')::real, 0) > 0 then
      insert into landings (player_id, gh, y, port, sp, acc, kg, kgq)
        values (p, land_put.gh, land_put.y, left(coalesce(land_put.port, ''), 40), left(coalesce(r ->> 'sp', ''), 16),
                case when land_put.acc in ('open', 'lukket') then land_put.acc else 'none' end,
                least((r ->> 'kg')::real, 100000), least(greatest(coalesce((r ->> 'kgq')::real, 0), 0), 100000));
    end if;
  end loop;
end $$;

-- the fish taken from the sea since the last call: cells is [[cell, kg], …] (at most 600)
create or replace function public.catch_put(gh double precision, cells jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 then raise exception 'bad time'; end if;
  if jsonb_typeof(cells) is distinct from 'array' or jsonb_array_length(cells) > 600 then raise exception 'bad cells'; end if;
  if (select count(*) from catches where player_id = p and at > now() - interval '1 hour') > 6000 then raise exception 'too many'; end if;
  insert into catches (player_id, gh, cell, kg)
    select p, catch_put.gh, (c ->> 0)::bigint, least((c ->> 1)::real, 50000) from jsonb_array_elements(cells) c
     where jsonb_typeof(c) = 'array' and (c ->> 1)::real > 0;
  -- the sea forgets in about a week of game time (a day of real time): what is older than four real days is gone from everyone's
  delete from catches where at < now() - interval '4 days';
end $$;

-- what the other players have done: their open-group cod this year (kg), the boats that have landed this year, what they delivered
-- to each plant in the last real day ([port, species, kg] decayed to game hour gh by 0.97 an hour), and the fish taken since the
-- catch cursor `since` ([cell, kg] decayed by 0.996 an hour; at most the last three real days), with the new cursor
create or replace function public.world_get(since bigint, y int, gh double precision) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); g double precision := coalesce(world_get.gh, 0);
begin
  if p is null then raise exception 'not signed in'; end if;
  if g <> g or abs(g) > 1e7 then raise exception 'bad time'; end if;
  return jsonb_build_object(
    'open', (select coalesce(round(sum(s)::numeric, 1), 0) from (select least(sum(l.kgq), 60000) s from landings l
               where l.y = world_get.y and l.acc = 'open' and l.sp = 'torsk' and l.player_id <> p group by l.player_id) a),
    'boats', (select count(distinct l.player_id) from landings l where l.y = world_get.y and l.player_id <> p),
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

-- for the admin: what the players have landed and taken
create or replace function public.admin_world() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object('landings_day', (select count(*) from landings where at > now() - interval '1 day'),
                            'kg_day', (select coalesce(round(sum(kg)::numeric), 0) from landings where at > now() - interval '1 day'),
                            'players_day', (select count(distinct player_id) from landings where at > now() - interval '1 day'),
                            'cells_day', (select count(distinct cell) from catches where at > now() - interval '1 day'));
end $$;

-- the two new identity sequences come with Supabase's default rights (see 20261004120000_cloud.sql)
revoke all on all sequences in schema public from anon, authenticated;
revoke all on function public.land_put(double precision, int, text, text, jsonb), public.catch_put(double precision, jsonb),
  public.world_get(bigint, int, double precision), public.admin_world() from public, anon, authenticated;
grant execute on function public.land_put(double precision, int, text, text, jsonb), public.catch_put(double precision, jsonb),
  public.world_get(bigint, int, double precision), public.admin_world() to authenticated;
