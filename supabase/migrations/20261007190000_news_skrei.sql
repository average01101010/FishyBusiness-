-- Kystposten: the year's first skrei (07.10.2026, Jonas: «Ta rekordpriser og sesongens første skrei»; core/09h-press.js pressSkrei).
--   news_first  the first cod landings in the 30 game days from a game hour on (the skrei season's first day, 09c-seasons.js), each
--               with its harbour, so the reader's game can take the first north of Stad, the same for everyone. One landing is a
--               player's rows at one time and harbour (as in news_get), at least 30 kg of cod, in the open or the closed group, never a
--               guest's; with the boat's name, and the company's in the closed group.
create or replace function public.news_first(since double precision) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if news_first.since is null or news_first.since <> news_first.since or abs(news_first.since) > 1e7 then raise exception 'bad time'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('gh', a.gh, 'port', a.port, 'kg', round(a.kg::numeric), 'boat', a.boat,
                     'company', case when a.acc = 'lukket' then a.company else '' end, 'me', a.player_id = p) order by a.gh, a.id)
      from (select lx.player_id, lx.gh, lx.port, lx.acc, sum(lx.kg) kg, min(lx.id) id, max(lx.boat) boat, max(lx.company) company
              from landings lx
             where lx.sp = 'torsk' and lx.acc in ('open', 'lukket') and lx.gh >= news_first.since and lx.gh < news_first.since + 720
               and not exists (select 1 from players gp where gp.id = lx.player_id and gp.guest)
             group by lx.player_id, lx.gh, lx.port, lx.acc
            having sum(lx.kg) >= 30
             order by lx.gh, min(lx.id)
             limit 10) a), '[]'::jsonb);
end $$;

revoke all on function public.news_first(double precision) from public, anon;
grant execute on function public.news_first(double precision) to authenticated;
