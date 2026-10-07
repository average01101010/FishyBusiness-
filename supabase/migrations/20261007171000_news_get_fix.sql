-- news_get with its column names made plain (07.10.2026: "gh" and the alias "x" were ambiguous with its parameters)
create or replace function public.news_get(gh double precision, x real, y real, r real default 150) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if news_get.gh is null or news_get.gh <> news_get.gh or abs(news_get.gh) > 1e7 then raise exception 'bad time'; end if;
  return (
    with n as (select * from news s where s.removed_at is null and s.gh > news_get.gh - 168 and s.gh <= news_get.gh + 1),
    pick as ((select n.id from n order by n.gh desc limit 60)
             union (select n.id from n where news_get.x is not null and (n.x - news_get.x) ^ 2 + (n.y - news_get.y) ^ 2 <= least(greatest(coalesce(news_get.r, 150), 10), 400) ^ 2 order by n.gh desc limit 40)),
    l as (select lx.* from landings lx where lx.gh > news_get.gh - 24 and lx.gh <= news_get.gh + 1
            and (lx.player_id = p or not exists (select 1 from players gp where gp.id = lx.player_id and gp.guest))),
    -- one landing is a player's rows at one time and harbour
    lg as (select l.player_id, l.gh, l.port, l.acc, sum(l.kg) kg, (array_agg(l.sp order by l.kg desc))[1] sp, max(l.boat) boat, max(l.company) company from l group by l.player_id, l.gh, l.port, l.acc)
    select jsonb_build_object(
      'news', coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'gh', n.gh, 'kind', n.kind, 'x', n.x, 'y', n.y, 'boat', n.boat, 'company', n.company, 'd', n.d, 'me', n.player_id = p) order by n.gh desc)
                        from n where n.id in (select pick.id from pick)), '[]'::jsonb),
      'land', coalesce((select jsonb_agg(jsonb_build_object('gh', a.gh, 'port', a.port, 'acc', a.acc, 'kg', round(a.kg::numeric), 'sp', a.sp, 'boat', a.boat, 'company', case when a.acc = 'lukket' then a.company else '' end, 'me', a.player_id = p) order by a.kg desc)
                        from (select * from lg order by lg.kg desc limit 30) a), '[]'::jsonb)));
end $$;
