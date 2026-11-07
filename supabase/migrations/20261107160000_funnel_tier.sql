-- The funnel with the upgrades (OPP4 of docs/planer/oppgraderinger.md, 07.11.2026; docs/engasjement.md «Mål og se»): one number more,
-- the share who bought at least one tier within their first seven days. A tier is the game's shop_buy {w:'equip', k, lv} (the knives and
-- the gaff from OPP1, ui/phone/13b-nettet.js equipBuy; the deck gear's tiers from OPP2) or the yard's upg {k, lv} (the propeller,
-- OPP3); a buy without lv (a VHF, a jigging reel) is not a tier. Everything else is 20261007150000_funnel.sql as it was.
--   tier    bought a tier within seven days of the first session, of all who started (the week not over counts as far as it has come)
--   tier7   the same, of those whose first session is at least seven days ago (tier7n): the share that can be compared before and after
-- Only the players who share usage statistics (they alone have sessions and events). Sums only; for the admin.
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
            exists (select 1 from sessions x where x.player_id = f.player_id and x.started_at >= f.t0 + interval '30 days') d30,
            exists (select 1 from events x where x.player_id = f.player_id and x.kind in ('shop_buy', 'upg') and x.ts < f.t0 + interval '7 days'
              and x.data ? 'lv' and (x.kind = 'upg' or x.data ->> 'w' = 'equip')) tier
          from f join players pl on pl.id = f.player_id left join e on e.player_id = f.player_id),
    w as (select wk, count(*) start, count(*) filter (where caught) catch, count(*) filter (where sales >= 1) land1, count(*) filter (where sales >= 3) land3,
            count(*) filter (where reg) reg, count(*) filter (where d1) d1, count(*) filter (where t0 <= now() - interval '1 day') d1n,
            count(*) filter (where d7) d7, count(*) filter (where t0 <= now() - interval '7 days') d7n,
            count(*) filter (where d30) d30, count(*) filter (where t0 <= now() - interval '30 days') d30n,
            count(*) filter (where tier) tier, count(*) filter (where tier and t0 <= now() - interval '7 days') tier7, count(*) filter (where t0 <= now() - interval '7 days') tier7n
          from r group by wk)
    select jsonb_build_object(
      'all', (select jsonb_build_object('start', coalesce(sum(start), 0), 'catch', coalesce(sum(catch), 0), 'land1', coalesce(sum(land1), 0), 'land3', coalesce(sum(land3), 0),
                'reg', coalesce(sum(reg), 0), 'd1', coalesce(sum(d1), 0), 'd1n', coalesce(sum(d1n), 0), 'd7', coalesce(sum(d7), 0), 'd7n', coalesce(sum(d7n), 0),
                'd30', coalesce(sum(d30), 0), 'd30n', coalesce(sum(d30n), 0), 'tier', coalesce(sum(tier), 0), 'tier7', coalesce(sum(tier7), 0), 'tier7n', coalesce(sum(tier7n), 0)) from w),
      'weeks', coalesce((select jsonb_agg(to_jsonb(x) order by x.wk desc) from (select * from w order by wk desc limit greatest(1, least(coalesce(admin_funnel.weeks, 8), 52))) x), '[]'::jsonb)));
end $$;
revoke all on function public.admin_funnel(int) from public, anon;
grant execute on function public.admin_funnel(int) to authenticated;
