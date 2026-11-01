-- The first trip's clock (Onboarding 2, O0, docs/planer/onboarding-2.md, 27.10.2026): the game sends tut_load {r, home, letter, map,
-- naust} once the start's map is in and Father's naust has opened (or was given up: no 3D), and tut_fish {r, home, s, sBoat} at the
-- first fish aboard; tut_step and tut_done carry r, the start's region (ui/08c-start.js REGIONS). All times are real seconds: letter, from
-- the letter's «Ta over» to «Start her»; map, from «Start her» to the map in; naust, from «Start her» to the naust open; s, from the
-- letter's «Ta over» to the first fish; sBoat, from taking over the boat. For the admin: per region and for the whole coast, how many
-- began, got a fish and finished, the median and 90th percentile times, and how many had their first fish within five minutes.
-- Only the players who share usage statistics. Sums only.
create or replace function public.admin_tut_time(weeks int default 8) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(weeks => greatest(1, least(coalesce(admin_tut_time.weeks, 8), 52)));
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_object_agg(r, x) from (
    select case when grouping(g.r) = 1 then 'alle' else g.r end r, jsonb_build_object(
      'started', count(distinct g.player_id) filter (where g.kind = 'tut_step'),
      'fish', count(distinct g.player_id) filter (where g.kind = 'tut_fish'),
      'done', count(distinct g.player_id) filter (where g.kind = 'tut_done'),
      'fishMed', round(percentile_cont(0.5) within group (order by g.s) filter (where g.kind = 'tut_fish')),
      'fishP90', round(percentile_cont(0.9) within group (order by g.s) filter (where g.kind = 'tut_fish')),
      'fish5', count(*) filter (where g.kind = 'tut_fish' and g.s <= 300),
      'fishBoatMed', round(percentile_cont(0.5) within group (order by g.s2) filter (where g.kind = 'tut_fish')),
      'loads', count(*) filter (where g.kind = 'tut_load'),
      'mapMed', round(percentile_cont(0.5) within group (order by g.map) filter (where g.kind = 'tut_load')),
      'mapP90', round(percentile_cont(0.9) within group (order by g.map) filter (where g.kind = 'tut_load')),
      'naustMed', round(percentile_cont(0.5) within group (order by g.naust) filter (where g.kind = 'tut_load')),
      'naustP90', round(percentile_cont(0.9) within group (order by g.naust) filter (where g.kind = 'tut_load')),
      'noRoom', count(*) filter (where g.kind = 'tut_load' and g.naust is null),
      'letterMed', round(percentile_cont(0.5) within group (order by g.letter) filter (where g.kind = 'tut_load'))) x
    from (
      select e.player_id, e.kind, coalesce(e.data ->> 'r', 'ukjent') r,
        case when (e.data ->> 's') ~ '^[0-9.]+$' then (e.data ->> 's')::numeric end s,
        case when (e.data ->> 'sBoat') ~ '^[0-9.]+$' then (e.data ->> 'sBoat')::numeric end s2,
        case when (e.data ->> 'map') ~ '^[0-9.]+$' then (e.data ->> 'map')::numeric end map,
        case when (e.data ->> 'naust') ~ '^[0-9.]+$' then (e.data ->> 'naust')::numeric end naust,
        case when (e.data ->> 'letter') ~ '^[0-9.]+$' then (e.data ->> 'letter')::numeric end letter
      from events e where e.kind in ('tut_step', 'tut_fish', 'tut_load', 'tut_done') and e.ts >= since) g
    group by grouping sets ((g.r), ())) y), '{}'::jsonb);
end $$;
revoke all on function public.admin_tut_time(int) from public, anon;
grant execute on function public.admin_tut_time(int) to authenticated;
