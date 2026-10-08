-- All active players on the chart, whatever the distance (Jonas 08.10.2026: «ser andre aktive spillere på kartet uavhengig av avstand»;
-- ui/10h-world.js). pos_near gave the boats within 80 km at most and 40 of them. pos_world gives every registered player who has
-- reported the boat in the last two minutes (the nearest 300 if there are more), nearest first. The boats within r km (25 as the game
-- asks) carry the paint (liv), as before, as the 3D view draws them; the far ones go without it, which keeps the answer small.
-- Nothing else changes: no guests, the owner's player name unless the admin took it away, and nobody can hide the boat. pos_near stays for
-- the games that have not been updated.
create or replace function public.pos_world(x real, y real, r real default 25) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', left(md5('dsb' || q.player_id), 10), 'boat', q.boat, 'vtype', q.vtype, 'x', q.x, 'y', q.y,
           'hd', q.hd, 'v', q.v, 'st', q.st, 'liv', case when q.d <= least(greatest(pos_world.r, 1), 80) ^ 2 then q.liv else '' end,
           'user', coalesce(q.uname, ''), 'fs', round(q.pfs::numeric),
           'age', round(extract(epoch from (now() - q.at))::numeric, 1)) order by q.d), '[]'::jsonb)
    from (select pr.*, pl.fs as pfs, nm.name as uname, (pr.x - pos_world.x) ^ 2 + (pr.y - pos_world.y) ^ 2 as d
          from presence pr join players pl on pl.id = pr.player_id left join names nm on nm.player_id = pr.player_id and nm.removed_at is null
          where pr.player_id is distinct from pid() and not pl.guest and pr.at > now() - interval '2 minutes'
          order by d limit 300) q
$$;
revoke all on function public.pos_world(real, real, real) from public, anon;
grant execute on function public.pos_world(real, real, real) to authenticated;
