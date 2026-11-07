-- The funnel (docs/engasjement.md point 9, Jonas 06.10.2026: «Mål og se»): how many of those who opened the game came to the first
-- catch, the first and the third landing, registered, and came back after 1, 7 and 30 days; in all and by the week they started.
-- Only the players who share usage statistics (they alone have sessions and events). Sums only; for the admin.
--   start  a first session (the envelope and the letter come first in every new game)
--   catch  the milestone «Første fisk over ripa» (the badges, from 07.10.2026) or any landing (before the badges)
--   land1, land3  one and three landings (the game's 'sale' event, one per landing)
--   reg    an account (WorkOS ids begin with user_; a guest's id is Supabase's anonymous uuid until guest_merge moves it)
--   d1, d7, d30  a session begun at least 1, 7 and 30 days after the first, of those whose first is at least that long ago (d1n, d7n, d30n)
create or replace function public.admin_funnel(weeks int default 8) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return (
    with f as (select player_id, min(started_at) t0 from sessions group by player_id),
    e as (select player_id, count(*) filter (where kind = 'sale') sales, bool_or(kind = 'ach' and data ->> 'id' = 'fish') fish
          from events where kind in ('sale', 'ach') group by player_id),
    r as (select f.player_id, f.t0, date_trunc('week', f.t0 at time zone 'Europe/Oslo')::date wk,
            coalesce(e.fish, false) or coalesce(e.sales, 0) > 0 caught, coalesce(e.sales, 0) sales,
            pl.id like 'user\_%' and not pl.guest reg,
            exists (select 1 from sessions x where x.player_id = f.player_id and x.started_at >= f.t0 + interval '1 day') d1,
            exists (select 1 from sessions x where x.player_id = f.player_id and x.started_at >= f.t0 + interval '7 days') d7,
            exists (select 1 from sessions x where x.player_id = f.player_id and x.started_at >= f.t0 + interval '30 days') d30
          from f join players pl on pl.id = f.player_id left join e on e.player_id = f.player_id),
    w as (select wk, count(*) start, count(*) filter (where caught) catch, count(*) filter (where sales >= 1) land1, count(*) filter (where sales >= 3) land3,
            count(*) filter (where reg) reg, count(*) filter (where d1) d1, count(*) filter (where t0 <= now() - interval '1 day') d1n,
            count(*) filter (where d7) d7, count(*) filter (where t0 <= now() - interval '7 days') d7n,
            count(*) filter (where d30) d30, count(*) filter (where t0 <= now() - interval '30 days') d30n
          from r group by wk)
    select jsonb_build_object(
      'all', (select jsonb_build_object('start', coalesce(sum(start), 0), 'catch', coalesce(sum(catch), 0), 'land1', coalesce(sum(land1), 0), 'land3', coalesce(sum(land3), 0),
                'reg', coalesce(sum(reg), 0), 'd1', coalesce(sum(d1), 0), 'd1n', coalesce(sum(d1n), 0), 'd7', coalesce(sum(d7), 0), 'd7n', coalesce(sum(d7n), 0),
                'd30', coalesce(sum(d30), 0), 'd30n', coalesce(sum(d30n), 0)) from w),
      'weeks', coalesce((select jsonb_agg(to_jsonb(x) order by x.wk desc) from (select * from w order by wk desc limit greatest(1, least(coalesce(admin_funnel.weeks, 8), 52))) x), '[]'::jsonb)));
end $$;
revoke all on function public.admin_funnel(int) from public, anon;
grant execute on function public.admin_funnel(int) to authenticated;
