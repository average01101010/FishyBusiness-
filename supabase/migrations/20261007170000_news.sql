-- Kystposten as the coast's shared paper (Jonas 07.10.2026: «båtnavn eller rederiene til andre brukere må komme offentlig i avisen»,
-- «Uhell burde havne i avisen. Det er realistisk», no other players' lighthouse pictures, a national front page and a local tab;
-- core/09h-press.js, ui/05g-press.js). A story is one of a fixed set of kinds, where it happened and the boat's name (and the company's
-- in the closed group, as on the leaderboard), with a few numbers and short keys (a harbour's id, a species, a boat type): the game
-- never sends free text to the paper, and the reader's game writes the words and finds the place names. Never a haill, never a guest,
-- never an account. The admin can take a story away.
--   news_put  a story of the caller's own (at most 12 an hour, two of a kind in ten minutes)
--   news_get  the stories of the last week of game time along the whole coast (60) and near a place (40), and the biggest landings of
--             the last game day (30), with the boat's name and the company's in the closed group
create table if not exists public.news (
  id bigserial primary key,
  player_id text not null references public.players(id) on delete cascade,
  at timestamptz not null default now(),
  gh double precision not null,
  kind text not null check (kind in ('boat', 'name', 'aground', 'rescue', 'salv', 'foto', 'fish', 'fs', 'ach', 'as')),
  x real not null,
  y real not null,
  boat text not null default '' check (char_length(boat) <= 24),
  company text not null default '' check (char_length(company) <= 40),
  d jsonb not null default '{}'::jsonb,
  removed_at timestamptz
);
create index if not exists news_gh on public.news (gh desc);
create index if not exists news_player on public.news (player_id, at desc);
alter table public.news enable row level security;
revoke all on public.news from anon, authenticated;

create or replace function public.news_put(kind text, gh double precision, x real, y real, boat text default '', company text default '', d jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); clean jsonb := '{}'::jsonb; k text; v jsonb;
  keys text[] := case news_put.kind
    when 'boat' then array['type', 'nb', 'lic', 'price']
    when 'name' then array['type']
    when 'aground' then array['type']
    when 'rescue' then array['base', 'port', 'type']
    when 'salv' then array['towed', 'port', 'pay', 'val']
    when 'foto' then array['fyr', 'lys']
    when 'fish' then array['sp', 'kg']
    when 'fs' then array['y']
    when 'ach' then array['ch']
    when 'as' then array['type']
    else null end;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  if keys is null then raise exception 'bad kind'; end if;
  if news_put.gh is null or news_put.gh <> news_put.gh or abs(news_put.gh) > 1e7 or news_put.x is null or news_put.y is null or abs(news_put.x) > 5000 or abs(news_put.y) > 5000 then raise exception 'bad place'; end if;
  if jsonb_typeof(news_put.d) is distinct from 'object' or length(news_put.d::text) > 400 then raise exception 'bad data'; end if;
  if (select count(*) from news n where n.player_id = p and n.at > now() - interval '1 hour') >= 12 then raise exception 'too many'; end if;
  if (select count(*) from news n where n.player_id = p and n.kind = news_put.kind and n.at > now() - interval '10 minutes') >= 2 then return; end if;
  -- only the kind's own keys: numbers, and keys of letters and digits (an id the game knows), nothing else
  for k, v in select * from jsonb_each(news_put.d) loop
    if k = any(keys) then
      if jsonb_typeof(v) = 'number' then clean := clean || jsonb_build_object(k, least(greatest((v #>> '{}')::double precision, -1e9), 1e9));
      elsif jsonb_typeof(v) = 'string' and (v #>> '{}') ~ '^[A-Za-z0-9_-]{1,24}$' then clean := clean || jsonb_build_object(k, v #>> '{}');
      end if;
    end if;
  end loop;
  insert into news (player_id, gh, kind, x, y, boat, company, d)
    values (p, news_put.gh, news_put.kind, news_put.x, news_put.y,
            left(btrim(regexp_replace(coalesce(news_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24),
            left(btrim(regexp_replace(coalesce(news_put.company, ''), '[<>&"''`\\]', '', 'g')), 40), clean);
end $$;

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

-- the admin: the latest stories with who sent them, and taking one away
create or replace function public.admin_news(lim int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', n.id, 'at', n.at, 'kind', n.kind, 'boat', n.boat, 'company', n.company, 'd', n.d, 'removed', n.removed_at is not null,
                     'user', coalesce((select nm.name from names nm where nm.player_id = n.player_id), '')) order by n.at desc)
                   from (select * from news order by at desc limit least(greatest(coalesce(admin_news.lim, 100), 1), 500)) n), '[]'::jsonb);
end $$;
create or replace function public.admin_news_remove(id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update news set removed_at = now() where news.id = admin_news_remove.id and removed_at is null;
  return found;
end $$;

revoke all on function public.news_put(text, double precision, real, real, text, text, jsonb), public.news_get(double precision, real, real, real),
  public.admin_news(int), public.admin_news_remove(bigint) from public, anon;
grant execute on function public.news_put(text, double precision, real, real, text, text, jsonb), public.news_get(double precision, real, real, real),
  public.admin_news(int), public.admin_news_remove(bigint) to authenticated;
