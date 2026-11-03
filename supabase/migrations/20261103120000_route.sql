-- The route goes along with the position (Jonas 03.11.2026, docs/planer/sanntid-posisjoner.md step 1): a boat under way on the chart
-- plotter's route sends the waypoints ahead of her (up to the first stop: a fishing ground, a set, the end), so the other players' games
-- work out where she is from the route itself, every frame, with no jump and no lag, instead of guessing along her heading for the 15 s
-- between reports. It is the points as «x,y;x,y;…» in the game's frame (km, four decimals), up to 24 of them, kept to digits, the full
-- stop, the comma, the semicolon and the minus, at most 640 characters. Like the paint, only the near boats (within r km) carry it in
-- pos_world, which keeps the answer small. It says nothing about the player that her position does not.
-- The eleven-argument pos_put goes: a game that does not send rt still calls this one (it has a default).
alter table public.presence add column if not exists rt text not null default '';

drop function if exists public.pos_put(real, real, real, real, text, text, text, text, real, text, text);
create or replace function public.pos_put(x real, y real, hd real, v real, st text, boat text, vtype text, liv text default '', fs real default null,
                                          lk text default '', ck text default '', rt text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if pos_put.x is null or pos_put.y is null or pos_put.x <> pos_put.x or pos_put.y <> pos_put.y or abs(pos_put.x) > 5000 or abs(pos_put.y) > 5000 then raise exception 'bad position'; end if;
  insert into presence (player_id, boat, vtype, x, y, hd, v, st, liv, lk, ck, rt, at)
    values (p, left(btrim(regexp_replace(coalesce(pos_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24), left(regexp_replace(coalesce(pos_put.vtype, ''), '[^a-z0-9_]', '', 'g'), 24),
            pos_put.x, pos_put.y, coalesce(pos_put.hd, 0), least(greatest(coalesce(pos_put.v, 0), 0), 60), left(regexp_replace(coalesce(pos_put.st, ''), '[^a-z]', '', 'g'), 16),
            left(regexp_replace(coalesce(pos_put.liv, ''), '[^A-Za-z0-9:;,._=-]', '', 'g'), 160),
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

-- every active player (20261010140000_look.sql), now with the route on the near boats
create or replace function public.pos_world(x real, y real, r real default 25) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', left(md5('dsb' || q.player_id), 10), 'boat', q.boat, 'vtype', q.vtype, 'x', q.x, 'y', q.y,
           'hd', q.hd, 'v', q.v, 'st', q.st, 'liv', case when q.d <= least(greatest(pos_world.r, 1), 80) ^ 2 then q.liv else '' end,
           'lk', case when q.d <= least(greatest(pos_world.r, 1), 80) ^ 2 then q.lk else '' end,
           'ck', case when q.d <= least(greatest(pos_world.r, 1), 80) ^ 2 then q.ck else '' end,
           'rt', case when q.d <= least(greatest(pos_world.r, 1), 80) ^ 2 then q.rt else '' end,
           'user', coalesce(q.uname, ''), 'fs', round(q.pfs::numeric),
           'age', round(extract(epoch from (now() - q.at))::numeric, 1)) order by q.d), '[]'::jsonb)
    from (select pr.*, pl.fs as pfs, nm.name as uname, (pr.x - pos_world.x) ^ 2 + (pr.y - pos_world.y) ^ 2 as d
          from presence pr join players pl on pl.id = pr.player_id left join names nm on nm.player_id = pr.player_id and nm.removed_at is null
          where pr.player_id is distinct from pid() and not pl.guest and pr.at > now() - interval '2 minutes'
          order by d limit 300) q
$$;

-- the boats within r km for the games that still ask for them, with the route
create or replace function public.pos_near(x real, y real, r real) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', left(md5('dsb' || q.player_id), 10), 'boat', q.boat, 'vtype', q.vtype, 'x', q.x, 'y', q.y,
           'hd', q.hd, 'v', q.v, 'st', q.st, 'liv', q.liv, 'lk', q.lk, 'ck', q.ck, 'rt', q.rt, 'user', coalesce(q.uname, ''), 'fs', round(q.pfs::numeric),
           'age', round(extract(epoch from (now() - q.at))::numeric, 1)) order by q.d), '[]'::jsonb)
    from (select pr.*, pl.fs as pfs, nm.name as uname, (pr.x - pos_near.x) ^ 2 + (pr.y - pos_near.y) ^ 2 as d
          from presence pr join players pl on pl.id = pr.player_id left join names nm on nm.player_id = pr.player_id and nm.removed_at is null
          where pr.player_id is distinct from pid() and not pl.guest and pr.at > now() - interval '2 minutes'
            and abs(pr.x - pos_near.x) <= least(greatest(pos_near.r, 1), 80) and abs(pr.y - pos_near.y) <= least(greatest(pos_near.r, 1), 80)
          order by d limit 40) q
$$;

revoke all on function public.pos_put(real, real, real, real, text, text, text, text, real, text, text, text) from public, anon;
grant execute on function public.pos_put(real, real, real, real, text, text, text, text, real, text, text, text) to authenticated;
revoke all on function public.pos_world(real, real, real), public.pos_near(real, real, real) from public, anon;
grant execute on function public.pos_world(real, real, real), public.pos_near(real, real, real) to authenticated;
