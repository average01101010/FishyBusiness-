-- The device behind the frame rate and the errors, and the agent's view of them (06.10.2026; Jonas: «Ja, vi må samle inn så mye
-- viktig data vi kan og analysere for å optimalisere spillet for så mange enheter som mulig»; docs/OVERLEVERING.md 4.22).
--
-- The frame rate samples (perf, never with a player) and the error reports (errors, with a player only with a yes to statistics) get
-- the device: the graphics chip as WebGL names it (gpu), the processor cores and memory the browser tells (cores, mem; Chrome rounds
-- the memory to a few steps), the screen (scr: css width x height @ pixel ratio), the 3D level the game runs at (lvl) and the view
-- (view: 3d or kart). None of it says who someone is; ui/10f-cloud.js cloudDev sends it.
-- agent_tech() is the feedback agent's view of them (service_role only, through the Edge Function feedback-agent): the errors of the
-- last days put together by message, how many sessions and players they hit (a count, never who), and the frame rate by device;
-- admin_devices() is the same for /admin (Teknikk).

alter table public.perf add column if not exists gpu text;
alter table public.perf add column if not exists cores smallint;
alter table public.perf add column if not exists mem real;
alter table public.perf add column if not exists scr text;
alter table public.perf add column if not exists lvl smallint;
alter table public.perf add column if not exists view text;
alter table public.errors add column if not exists gpu text;
alter table public.errors add column if not exists scr text;
alter table public.errors add column if not exists lvl smallint;
create index if not exists perf_ts on public.perf (ts);

create or replace function public.tm_num(v text, lo real, hi real) returns real language sql immutable set search_path = '' as $$
  select case when v ~ '^-?[0-9]+(\.[0-9]+)?$' then greatest(lo, least(hi, v::real)) end
$$;

create or replace function public.tm_perf(fps real, low real, drops int, meta jsonb) returns void language sql security definer set search_path = public as $$
  insert into perf (fps, low, drops, quality, browser, platform, version, gpu, cores, mem, scr, lvl, view)
    values (least(fps, 240), least(low, 240), least(drops, 100000), left(meta ->> 'quality', 12), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20), left(meta ->> 'version', 20),
            left(meta ->> 'gpu', 80), tm_num(meta ->> 'cores', 0, 256)::smallint, tm_num(meta ->> 'mem', 0, 64), left(meta ->> 'scr', 24), tm_num(meta ->> 'lvl', -1, 9)::smallint, left(meta ->> 'view', 8))
$$;

create or replace function public.tm_error(msg text, src text, stack text, meta jsonb) returns void language plpgsql security definer set search_path = public as $$
declare p text := pid(); ok boolean := false;
begin
  if p is not null then select coalesce(consent, false) into ok from players where id = p; end if;
  insert into errors (player_id, session_id, msg, src, stack, version, browser, platform, gpu, scr, lvl)
    values (case when ok then p end, case when ok then (meta ->> 'sid')::uuid end, left(msg, 400), left(src, 200), left(stack, 2000),
            left(meta ->> 'version', 20), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20), left(meta ->> 'gpu', 80), left(meta ->> 'scr', 24), tm_num(meta ->> 'lvl', -1, 9)::smallint);
end $$;

-- the frame rate by device, the errors put together, the sessions that ended in a rage quit, for the last `days` days
create or replace function public.tech_view(days int) returns jsonb language sql stable security definer set search_path = public as $$
  with since as (select now() - make_interval(days => greatest(1, least(days, 90))) t),
  e as (select * from errors where ts >= (select t from since)),
  p as (select * from perf where ts >= (select t from since))
  select jsonb_build_object(
    'days', greatest(1, least(days, 90)),
    'errors', coalesce((select jsonb_agg(x order by (x ->> 'n')::int desc) from (
        select jsonb_build_object('msg', msg, 'src', max(src), 'n', count(*), 'sessions', count(distinct session_id), 'players', count(distinct player_id),
          'first', min(ts), 'last', max(ts), 'versions', (select jsonb_agg(distinct v) from unnest(array_agg(version)) v),
          'platforms', (select jsonb_object_agg(k, c) from (select coalesce(platform, '?') k, count(*) c from e e2 where e2.msg = e.msg group by 1) z),
          'browsers', (select jsonb_object_agg(k, c) from (select coalesce(browser, '?') k, count(*) c from e e2 where e2.msg = e.msg group by 1) z),
          'gpus', (select jsonb_agg(k) from (select gpu k from e e2 where e2.msg = e.msg and gpu is not null group by 1 order by count(*) desc limit 5) z),
          'stack', left(max(stack), 1500)) x
        from e group by msg order by count(*) desc limit 40) q), '[]'::jsonb),
    'fps_device', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('platform', platform, 'browser', browser, 'gpu', coalesce(gpu, '?'), 'n', count(*), 'fps', round(avg(fps)::numeric, 1), 'low', round(avg(low)::numeric, 1),
          'drops', round(avg(drops)::numeric, 1), 'lvl', round(avg(lvl)::numeric, 1), 'cores', max(cores), 'mem', max(mem), 'scr', max(scr)) x
        from p group by platform, browser, gpu order by count(*) desc limit 40) q), '[]'::jsonb),
    'fps_version', coalesce((select jsonb_agg(x) from (
        select jsonb_build_object('version', version, 'n', count(*), 'fps', round(avg(fps)::numeric, 1), 'low', round(avg(low)::numeric, 1), 'slow', round(avg(case when fps < 20 then 1.0 else 0 end), 3)) x
        from p group by version order by max(ts) desc limit 8) q), '[]'::jsonb),
    'sessions', (select jsonb_build_object('n', count(*), 'rage', count(*) filter (where end_reason = 'rage'), 'avg_min', round(avg(active_s) / 60.0, 1))
        from sessions where started_at >= (select t from since)))
$$;

create or replace function public.agent_tech(days int default 7) returns jsonb language sql stable security definer set search_path = public as $$
  select tech_view(days)
$$;
create or replace function public.admin_devices(days int default 30) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return tech_view(days);
end $$;

revoke all on function public.tm_num(text, real, real), public.tech_view(int), public.agent_tech(int), public.admin_devices(int) from public, anon, authenticated;
grant execute on function public.agent_tech(int) to service_role;
grant execute on function public.admin_devices(int) to authenticated;
grant execute on function public.tm_error(text, text, text, jsonb), public.tm_perf(real, real, int, jsonb) to anon, authenticated;
