-- The missions' measurement (30.10.2026, docs/research/oppdrag-gap-analyse.md): of 52 missions taken 5.–29.10.2026, 22 were done and
-- 13 failed, and the failures could not be told apart (given up, the deadline, the drifting boat ashore). From 30.10.2026 the game sends
-- tur_show when a board is seen, and tur_fail says how it ended (data->>'how': drop, due, ashore, rescue, other); tur_take, tur_done
-- and tur_fail carry the mission's id and frac, the share of the time allowed that was used. The admin's table shows them apart.
create or replace function public.admin_tur_share(days integer default 14) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(r order by r.tur desc) from (
    select e.player_id as player, max(p.boat) as boat,
      sum(case when e.kind = 'tur_done' then coalesce((e.data->>'pay')::bigint, 0) else 0 end) as tur,
      sum(case when e.kind = 'sale' then coalesce((e.data->>'kr')::bigint, 0) else 0 end) as fish,
      count(*) filter (where e.kind = 'tur_show') as shown,
      count(*) filter (where e.kind = 'tur_take') as taken,
      count(*) filter (where e.kind = 'tur_done') as done,
      count(*) filter (where e.kind = 'tur_fail' and e.data->>'how' = 'drop') as dropped,
      count(*) filter (where e.kind = 'tur_fail' and e.data->>'how' = 'due') as due,
      count(*) filter (where e.kind = 'tur_fail' and coalesce(e.data->>'how', 'other') not in ('drop', 'due')) as failed,
      round(avg((e.data->>'frac')::numeric) filter (where e.kind = 'tur_done' and e.data ? 'frac'), 2) as frac
    from events e left join players p on p.id = e.player_id
    where e.kind in ('tur_show', 'tur_take', 'tur_done', 'tur_fail', 'sale') and e.ts > now() - make_interval(days => days)
    group by e.player_id) r), '[]'::jsonb);
end $$;
