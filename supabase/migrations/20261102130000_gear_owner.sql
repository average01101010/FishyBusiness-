-- Whose gear it is (Jonas 02.11.2026: «Trenger ikke å vises navn i kartet, men at man eventuelt kan trykke på fiskeredskapet for mer å få
-- opp info om hvem som eier redskapet»): gear_near2 is gear_near (20261007200000_gear.sql) with the owner's player name (unless the admin
-- took it away) and the boat name the owner last reported (presence), so a tap on a buoy in the chart can say whose it is. The chart
-- itself shows no names. gear_near stays for the games that have not been updated.
create or replace function public.gear_near2(x real, y real, r real) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(q.kind, q.x1, q.y1, q.x2, q.y2, coalesce(q.uname, ''), coalesce(q.boat, '')) order by q.d), '[]'::jsonb)
    from (select g.*, nm.name as uname, pr.boat, (g.x1 - gear_near2.x) ^ 2 + (g.y1 - gear_near2.y) ^ 2 as d
          from gear_sets g join players pl on pl.id = g.player_id
            left join names nm on nm.player_id = g.player_id and nm.removed_at is null
            left join presence pr on pr.player_id = g.player_id
          where g.player_id is distinct from pid() and not pl.guest and g.at > now() - interval '14 days'
            and abs(g.x1 - gear_near2.x) <= least(greatest(gear_near2.r, 1), 60) and abs(g.y1 - gear_near2.y) <= least(greatest(gear_near2.r, 1), 60)
          order by d limit 300) q
$$;
revoke all on function public.gear_near2(real, real, real) from public, anon, authenticated;
grant execute on function public.gear_near2(real, real, real) to authenticated;
