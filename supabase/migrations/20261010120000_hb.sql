-- Håndboka's drips (docs/onboarding.md 3 and 6, 10.10.2026): the game sends hb {id, how} when a tip of chapters 2–6 is read («Skjønner»,
-- how = seen) or its chapter put to rest from it («Jeg kan dette», how = skip; ui/07c-handbook.js). For the admin's funnel: per tip,
-- how many players read it and how many skipped from it, of those who share usage statistics. Sums only.
create or replace function public.admin_hb(weeks int default 8) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(weeks => greatest(1, least(coalesce(admin_hb.weeks, 8), 52)));
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object(
    'players', (select count(distinct player_id) from events where kind = 'hb' and ts >= since),
    'tips', coalesce((select jsonb_object_agg(id, jsonb_build_object('seen', seen, 'skip', skip)) from (
        select data ->> 'id' id, count(distinct player_id) filter (where data ->> 'how' = 'seen') seen, count(distinct player_id) filter (where data ->> 'how' = 'skip') skip
        from events where kind = 'hb' and data ? 'id' and ts >= since group by 1) x), '{}'::jsonb));
end $$;
revoke all on function public.admin_hb(int) from public, anon;
grant execute on function public.admin_hb(int) to authenticated;
