-- The first trip's steps (docs/onboarding.md point 6, Jonas 09.10.2026): the game sends tut_step {id, s, settled} when a step of the
-- guided first trip is done (s: real seconds since the step before; settled: marked done by a later step, no time of its own) and
-- tut_done {s} when the trip is finished (s: real seconds from the start). For the admin's funnel: how many players reached each step
-- (of those who started the guide), the median seconds on it, and the whole trip's median; the step ids come in the game's order
-- (src/js/ui/07b-first-trip.js TSTEPS), the admin page orders them. Only the players who share usage statistics. Sums only.
create or replace function public.admin_tut(weeks int default 8) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(weeks => greatest(1, least(coalesce(admin_tut.weeks, 8), 52)));
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object(
    'started', (select count(distinct player_id) from events where kind = 'tut_step' and ts >= since),
    'steps', coalesce((select jsonb_object_agg(id, jsonb_build_object('n', n, 'med', med, 'settled', settled)) from (
        select data ->> 'id' id, count(distinct player_id) n,
          round(percentile_cont(0.5) within group (order by (data ->> 's')::numeric) filter (where (data ->> 'settled') is distinct from 'true' and (data ->> 's') ~ '^[0-9.]+$')) med,
          count(*) filter (where data ->> 'settled' = 'true') settled
        from events where kind = 'tut_step' and data ? 'id' and ts >= since group by 1) x), '{}'::jsonb),
    'done', (select count(distinct player_id) from events where kind = 'tut_done' and ts >= since),
    'doneMed', (select round(percentile_cont(0.5) within group (order by (data ->> 's')::numeric)) from events where kind = 'tut_done' and (data ->> 's') ~ '^[0-9.]+$' and ts >= since));
end $$;
revoke all on function public.admin_tut(int) from public, anon;
grant execute on function public.admin_tut(int) to authenticated;
