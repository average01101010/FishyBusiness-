-- Seen by the others (Jonas 07.10.2026: «Det skal ikke være mulig å skjule båten sin posisjon for andre spillere, det er et krav»;
-- ui/10h-world.js). Every registered player's boat is in the shared world, and the AIS card shows the owner's player name and sea time.
-- A guest is not seen by the others, neither on the AIS nor on the leaderboards, but sees their own boat and place on them. The sea time the game
-- reports is held to what the real time allows, so a changed game cannot show forty years the next minute.
-- pos_off goes: there is no hiding the boat (an old game that still calls it gets a 404 and carries on).
alter table public.players add column if not exists guest boolean not null default false;
alter table public.players add column if not exists fs real not null default 0;
alter table public.players add column if not exists fs_at timestamptz;

drop function if exists public.pos_off();

-- a guest is marked on putting up the boat (pos_put) or a landing, so the lists can leave her out for the others (a guest's id becomes an
-- account's only through guest_merge, which moves everything to the account and deletes the guest)
create or replace function public.guest_mark() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if is_guest() then update players set guest = true where id = new.player_id and not guest; end if;
  return new;
end $$;
drop trigger if exists landings_guest on public.landings;
create trigger landings_guest after insert on public.landings for each row execute function public.guest_mark();
revoke all on function public.guest_mark() from public, anon, authenticated;
-- the guests from before: Supabase's anonymous ids are uuids, WorkOS's accounts start with user_
update public.players set guest = true where not guest and id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- where my boat is, and my sea time in points (core/09e-fartstid.js). The first report may be up to fifteen years (a game played before
-- sea time was counted gets it from what it did); after that it grows by at most 5 000 points a real hour since the last (an hour at
-- sea gives 480, a big landing a few thousand). What is above waits on the server's side and comes as the hours pass.
drop function if exists public.pos_put(real, real, real, real, text, text, text, text);
create or replace function public.pos_put(x real, y real, hd real, v real, st text, boat text, vtype text, liv text default '', fs real default null) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if pos_put.x is null or pos_put.y is null or pos_put.x <> pos_put.x or pos_put.y <> pos_put.y or abs(pos_put.x) > 5000 or abs(pos_put.y) > 5000 then raise exception 'bad position'; end if;
  insert into presence (player_id, boat, vtype, x, y, hd, v, st, liv, at)
    values (p, left(btrim(regexp_replace(coalesce(pos_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24), left(regexp_replace(coalesce(pos_put.vtype, ''), '[^a-z0-9_]', '', 'g'), 24),
            pos_put.x, pos_put.y, coalesce(pos_put.hd, 0), least(greatest(coalesce(pos_put.v, 0), 0), 60), left(regexp_replace(coalesce(pos_put.st, ''), '[^a-z]', '', 'g'), 16),
            left(regexp_replace(coalesce(pos_put.liv, ''), '[^A-Za-z0-9:;,._=-]', '', 'g'), 160), now())
    on conflict (player_id) do update set boat = excluded.boat, vtype = excluded.vtype, x = excluded.x, y = excluded.y, hd = excluded.hd,
      v = excluded.v, st = excluded.st, liv = excluded.liv, at = excluded.at;
  if is_guest() then update players set guest = true where id = p and not guest; end if;
  if pos_put.fs is not null and pos_put.fs = pos_put.fs and pos_put.fs >= 0 then
    update players pl set fs = greatest(pl.fs, least(pos_put.fs, case when pl.fs_at is null then 65000 else pl.fs + 5000 * extract(epoch from now() - pl.fs_at) / 3600 end)),
      fs_at = now() where pl.id = p;
  end if;
end $$;

-- the other players' boats within r km, nearest first: no guests, and with the owner's player name (unless the admin took it away)
-- and sea time in points
create or replace function public.pos_near(x real, y real, r real) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', left(md5('dsb' || q.player_id), 10), 'boat', q.boat, 'vtype', q.vtype, 'x', q.x, 'y', q.y,
           'hd', q.hd, 'v', q.v, 'st', q.st, 'liv', q.liv, 'user', coalesce(q.uname, ''), 'fs', round(q.pfs::numeric),
           'age', round(extract(epoch from (now() - q.at))::numeric, 1)) order by q.d), '[]'::jsonb)
    from (select pr.*, pl.fs as pfs, nm.name as uname, (pr.x - pos_near.x) ^ 2 + (pr.y - pos_near.y) ^ 2 as d
          from presence pr join players pl on pl.id = pr.player_id left join names nm on nm.player_id = pr.player_id and nm.removed_at is null
          where pr.player_id is distinct from pid() and not pl.guest and pr.at > now() - interval '2 minutes'
            and abs(pr.x - pos_near.x) <= least(greatest(pos_near.r, 1), 80) and abs(pr.y - pos_near.y) <= least(greatest(pos_near.r, 1), 80)
          order by d limit 40) q
$$;

-- the leaderboards without the guests, except the caller, and with each player's name
create or replace function public.world_top(w int, grp text default 'open') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); g text := case when world_top.grp = 'lukket' then 'lukket' else 'open' end; cap real := case when world_top.grp = 'lukket' then 60000 else 10000 end;
begin
  if p is null then raise exception 'not signed in'; end if;
  if w is null or w < 0 or w > 100000 then raise exception 'bad week'; end if;
  return (
    with l as (select x.* from landings x where x.acc = g and x.gh >= world_top.w * 168.0 and x.gh < (world_top.w + 1) * 168.0
                 and (x.player_id = p or not exists (select 1 from players gp where gp.id = x.player_id and gp.guest))),
    t as (select l.player_id, sum(least(l.kg, cap)) kg, (array_agg(l.boat order by l.id desc))[1] boat, (array_agg(l.company order by l.id desc))[1] company from l group by l.player_id),
    pt as (select distinct on (player_id) player_id, port from (select l.player_id, l.port, sum(l.kg) k from l group by l.player_id, l.port) a order by player_id, k desc),
    r as (select t.*, pt.port, rank() over (order by t.kg desc) rk from t left join pt using (player_id))
    select jsonb_build_object(
      'grp', g,
      'rows', coalesce((select jsonb_agg(jsonb_build_object('rank', rk, 'boat', boat, 'company', case when g = 'lukket' then company else '' end, 'port', port, 'kg', round(kg::numeric), 'me', player_id = p,
                          'user', coalesce((select nm.name from names nm where nm.player_id = a.player_id and nm.removed_at is null), '')) order by rk, kg desc)
                        from (select * from r order by rk limit 20) a), '[]'::jsonb),
      'mine', (select jsonb_build_object('rank', rk, 'kg', round(kg::numeric)) from r where player_id = p),
      'n', (select count(*) from t)));
end $$;

revoke all on function public.pos_put(real, real, real, real, text, text, text, text, real), public.pos_near(real, real, real), public.world_top(int, text) from public, anon;
grant execute on function public.pos_put(real, real, real, real, text, text, text, text, real), public.pos_near(real, real, real), public.world_top(int, text) to authenticated;
