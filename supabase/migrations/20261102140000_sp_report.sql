-- The sponsors' report (M7, docs/planer/butikker-og-sponsorer.md 4.4): per placement and week, from the game's own events (sp_view
-- {pl, imp, sec} every ten minutes per player, sp_click and sp_buy {pl}), only from players who share statistics: unique players, seen
-- views (a second in a row on at least 1.5 % of the screen within 55°), seconds seen, clicks out and purchases. For the admin only.
create index if not exists events_sp on public.events (kind, ts) where kind in ('sp_view', 'sp_click', 'sp_buy');
create or replace function public.admin_sp_report(days int default 90) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((with a as (
      select date_trunc('week', e.ts) wk, (e.data ->> 'pl')::bigint pl, count(distinct e.player_id) players,
        coalesce(sum(least(greatest(coalesce((e.data ->> 'imp')::numeric, 0), 0), 600)) filter (where e.kind = 'sp_view'), 0) imp,
        coalesce(sum(least(greatest(coalesce((e.data ->> 'sec')::numeric, 0), 0), 600)) filter (where e.kind = 'sp_view'), 0) sec,
        count(*) filter (where e.kind = 'sp_click') clicks, count(*) filter (where e.kind = 'sp_buy') buys
      from events e
      where e.kind in ('sp_view', 'sp_click', 'sp_buy') and e.ts > now() - make_interval(days => greatest(1, least(admin_sp_report.days, 400))) and (e.data ->> 'pl') ~ '^[0-9]{1,12}$'
      group by 1, 2)
    select jsonb_agg(jsonb_build_object('week', to_char(a.wk, 'IYYY-"W"IW'), 'pl', a.pl, 'sponsor', coalesce(s.name, '?'), 'kind', coalesce(p.kind || ':' || p.target, '?'),
      'players', a.players, 'imp', a.imp, 'sec', a.sec, 'clicks', a.clicks, 'buys', a.buys) order by a.wk desc, a.pl)
    from a left join sponsor_placements p on p.id = a.pl left join sponsors s on s.id = p.sponsor_id), '[]'::jsonb);
end $$;
revoke all on function public.admin_sp_report(int) from public, anon;
grant execute on function public.admin_sp_report(int) to authenticated;
