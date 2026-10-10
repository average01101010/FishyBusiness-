-- The shared world V3: players see each other (05.10.2026; Jonas: «Ja, fokuset nå må være å få koblet sammen spillerne i verden med
-- felles tid … Dette er nesten et mmorpg spill», and earlier: the players shall see each other, with a way to turn it off in Settings).
-- Each game sends where the boat it follows is (in the game's frame, km), its heading and speed, what it is doing, its name and type,
-- every 15 seconds while it is open and the player has not turned it off (ui/10h-world.js); one row per player, written over. Each
-- game asks for the boats within its AIS range that have been heard in the last two minutes, and shows them as AIS targets and boats
-- in 3D. Nothing else of the other player is given out: no account, no e-mail, only the boat. The table has no policy: only the
-- functions read and write it. A deleted player takes the row with them (on delete cascade).

create table if not exists public.presence (
  player_id text primary key references public.players(id) on delete cascade,
  boat text not null default '' check (char_length(boat) <= 24),
  vtype text not null default '' check (char_length(vtype) <= 24),
  x real not null, y real not null, hd real not null default 0, v real not null default 0,
  st text not null default '' check (char_length(st) <= 16),
  at timestamptz not null default now()
);
create index if not exists presence_at on public.presence (at desc);
alter table public.presence enable row level security;
revoke all on public.presence from anon, authenticated;

-- where my boat is now (at most one row per player, written over)
create or replace function public.pos_put(x real, y real, hd real, v real, st text, boat text, vtype text) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if x is null or y is null or x <> x or y <> y or abs(x) > 5000 or abs(y) > 5000 then raise exception 'bad position'; end if;
  insert into presence (player_id, boat, vtype, x, y, hd, v, st, at)
    values (p, left(coalesce(pos_put.boat, ''), 24), left(coalesce(pos_put.vtype, ''), 24), pos_put.x, pos_put.y, coalesce(pos_put.hd, 0),
            least(greatest(coalesce(pos_put.v, 0), 0), 60), left(coalesce(pos_put.st, ''), 16), now())
    on conflict (player_id) do update set boat = excluded.boat, vtype = excluded.vtype, x = excluded.x, y = excluded.y, hd = excluded.hd,
      v = excluded.v, st = excluded.st, at = excluded.at;
end $$;

-- hidden from the others (the setting «Vis båten min for andre spillere» turned off)
create or replace function public.pos_off() returns void language sql security definer set search_path = public as $$
  delete from presence where player_id = pid()
$$;

-- the other players' boats within r km of (x, y) heard in the last two minutes, nearest first (the player's own is left out); the id
-- is a hash of the player, stable for the 3D view, and never the account
create or replace function public.pos_near(x real, y real, r real) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', left(md5('dsb' || q.player_id), 10), 'boat', q.boat, 'vtype', q.vtype, 'x', q.x, 'y', q.y,
           'hd', q.hd, 'v', q.v, 'st', q.st, 'age', round(extract(epoch from (now() - q.at))::numeric, 1)) order by q.d), '[]'::jsonb)
    from (select pr.*, (pr.x - pos_near.x) ^ 2 + (pr.y - pos_near.y) ^ 2 as d from presence pr
          where pr.player_id is distinct from pid() and pr.at > now() - interval '2 minutes'
            and abs(pr.x - pos_near.x) <= least(greatest(pos_near.r, 1), 80) and abs(pr.y - pos_near.y) <= least(greatest(pos_near.r, 1), 80)
          order by d limit 40) q
$$;

-- for the admin: how many are out on the water now
create or replace function public.admin_presence() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object('now', (select count(*) from presence where at > now() - interval '2 minutes'),
                            'hour', (select count(*) from presence where at > now() - interval '1 hour'));
end $$;

revoke all on function public.pos_put(real, real, real, real, text, text, text), public.pos_off(), public.pos_near(real, real, real), public.admin_presence() from public, anon, authenticated;
grant execute on function public.pos_put(real, real, real, real, text, text, text), public.pos_off(), public.pos_near(real, real, real), public.admin_presence() to authenticated;
