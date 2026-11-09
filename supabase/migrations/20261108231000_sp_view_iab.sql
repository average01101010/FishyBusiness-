-- The sponsors' report after IAB/MRC Intrinsic In-Game Advertising Measurement Guidelines 2.0 (steg 66; docs/planer/butikker-og-sponsorer.md
-- 4.4 and 10.6, docs/sponsor/mediekort.md). The game sends sp_view {pl, imp, re, sec, m, u} per placement when something has changed (ui/
-- 10r-sponsor.js SPM): imp is 1 once a session (3.2 note 3), re the later seconds in a row, sec every second the banner met the pixel, size
-- and angle rules (also before the threshold, 3.2.10.3), m that it was drawn within 150 m and measured (WebGL 2), u that it was drawn there
-- undetermined (WebGL 1, no occlusion query). Per session (events.session_id) and placement there is one rendered impression, in one of
-- three buckets that exclude each other (3.2.10.2): viewable (imp in the session), not viewable (measured, no imp), undetermined. The rows
-- before steg 66 (sp_view {pl, imp, sec}) fall in the same way: a session with imp is viewable, however many imps it had.
-- Per week (the week of the session's first row) and placement: unique players, the rendered impressions in each bucket, the measured
-- share (measured / rendered) and the viewable share (viewable / measured), re-views, seconds seen, the median and mean seconds of a
-- viewable session, clicks out and purchases (our own numbers: the guidelines do not cover them, 1). For the admin only. Idempotent.
create or replace function public.admin_sp_report(days int default 90) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((with ev as (
      select e.*, (e.data ->> 'pl')::bigint pl from events e
      where e.kind in ('sp_view', 'sp_click', 'sp_buy') and e.ts > now() - make_interval(days => greatest(1, least(admin_sp_report.days, 400))) and (e.data ->> 'pl') ~ '^[0-9]{1,12}$'),
    s as (   -- one row per session and placement
      select min(ev.ts) t0, ev.pl, min(ev.player_id) player_id,
        sum(least(greatest(coalesce((ev.data ->> 'imp')::numeric, 0), 0), 600)) imp,
        sum(least(greatest(coalesce((ev.data ->> 're')::numeric, 0), 0), 600)) re,
        sum(least(greatest(coalesce((ev.data ->> 'sec')::numeric, 0), 0), 600)) sec,
        bool_or(coalesce((ev.data ->> 'm')::numeric, 0) > 0 or (ev.data ->> 'm') is null) meas,   -- (a row before steg 66 was measured: it was sent only after the occlusion query said seen, which WebGL 1 never did)
        bool_or(coalesce((ev.data ->> 'u')::numeric, 0) > 0) und
      from ev where ev.kind = 'sp_view' group by ev.pl, ev.session_id, case when ev.session_id is null then ev.id end),   -- (a row without a session is a session of its own)
    b as (
      select date_trunc('week', s.t0) wk, s.pl, count(distinct s.player_id) players,
        count(*) filter (where s.imp > 0) v, count(*) filter (where s.imp = 0 and s.meas) nv, count(*) filter (where s.imp = 0 and not s.meas and s.und) ud,
        sum(s.re) re, sum(s.sec) sec,
        percentile_cont(0.5) within group (order by s.sec) filter (where s.imp > 0) med, avg(s.sec) filter (where s.imp > 0) mean
      from s group by 1, 2),
    k as (
      select date_trunc('week', ev.ts) wk, ev.pl, count(distinct ev.player_id) players, count(*) filter (where ev.kind = 'sp_click') clicks, count(*) filter (where ev.kind = 'sp_buy') buys
      from ev where ev.kind in ('sp_click', 'sp_buy') group by 1, 2),
    a as (
      select coalesce(b.wk, k.wk) wk, coalesce(b.pl, k.pl) pl, greatest(coalesce(b.players, 0), coalesce(k.players, 0)) players,
        coalesce(b.v, 0) v, coalesce(b.nv, 0) nv, coalesce(b.ud, 0) ud, coalesce(b.re, 0) re, coalesce(b.sec, 0) sec, b.med, b.mean,
        coalesce(k.clicks, 0) clicks, coalesce(k.buys, 0) buys
      from b full join k on k.wk = b.wk and k.pl = b.pl)
    select jsonb_agg(jsonb_build_object('week', to_char(a.wk, 'IYYY-"W"IW'), 'pl', a.pl, 'sponsor', coalesce(s2.name, '?'), 'kind', coalesce(p.kind || ':' || p.target, '?'),
      'players', a.players, 'imp', a.v, 'nonview', a.nv, 'undet', a.ud, 'rendered', a.v + a.nv + a.ud,
      'measured', case when a.v + a.nv + a.ud > 0 then round((a.v + a.nv)::numeric / (a.v + a.nv + a.ud), 3) end,
      'viewable', case when a.v + a.nv > 0 then round(a.v::numeric / (a.v + a.nv), 3) end,
      're', a.re, 'sec', round(a.sec, 1), 'med', round(a.med::numeric, 1), 'mean', round(a.mean, 1), 'clicks', a.clicks, 'buys', a.buys) order by a.wk desc, a.pl)
    from a left join sponsor_placements p on p.id = a.pl left join sponsors s2 on s2.id = p.sponsor_id), '[]'::jsonb);
end $$;
revoke all on function public.admin_sp_report(int) from public, anon;
grant execute on function public.admin_sp_report(int) to authenticated;
