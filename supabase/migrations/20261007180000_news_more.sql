-- Kystposten, more (07.10.2026; core/09h-press.js): two more kinds of story, and a notification when you are in the paper.
--   tur    a long trip or the season's move done (the mission's kind, the harbour, the species, the kilos and the miles)
--   kvote  a structure quota bought (its quota factor in ten-thousandths, and the boat's type)
--   push_paper  hourly (pg_cron): when a game day (four real hours) is over, the player with the day's biggest landing along the coast
--               hears that they are in the paper, by the push rules (push_srv: the leaderboard's notifications on, not while in the
--               game, at most four a day, none at night). Only the last day over: an older one is old news.
alter table public.news drop constraint if exists news_kind_check;
alter table public.news add constraint news_kind_check check (kind in ('boat', 'name', 'aground', 'rescue', 'salv', 'foto', 'fish', 'fs', 'ach', 'as', 'tur', 'kvote'));

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
    when 'tur' then array['k', 'to', 'from', 'sp', 'kg', 'nm']
    when 'kvote' then array['kf', 'type']
    else null end;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  if keys is null then raise exception 'bad kind'; end if;
  if news_put.gh is null or news_put.gh <> news_put.gh or abs(news_put.gh) > 1e7 or news_put.x is null or news_put.y is null or abs(news_put.x) > 5000 or abs(news_put.y) > 5000 then raise exception 'bad place'; end if;
  if jsonb_typeof(news_put.d) is distinct from 'object' or length(news_put.d::text) > 400 then raise exception 'bad data'; end if;
  if (select count(*) from news n where n.player_id = p and n.at > now() - interval '1 hour') >= 12 then raise exception 'too many'; end if;
  if (select count(*) from news n where n.player_id = p and n.kind = news_put.kind and n.at > now() - interval '10 minutes') >= 2 then return; end if;
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

create or replace function public.push_paper() returns int
language plpgsql security definer set search_path = public as $$
declare cur int := floor(world_gh() / 24)::int; dd int; done bigint; r record;
begin
  select v into done from push_state where k = 'paper';
  if done is null then insert into push_state values ('paper', cur - 1) on conflict (k) do nothing; return 0; end if;
  if done >= cur - 1 then return 0; end if;
  dd := cur - 1;
  update push_state set v = dd where k = 'paper';
  select a.player_id, a.kg into r from (
    select lx.player_id, sum(lx.kg) kg from landings lx
     where lx.gh >= dd * 24.0 and lx.gh < (dd + 1) * 24.0 and not exists (select 1 from players gp where gp.id = lx.player_id and gp.guest)
     group by lx.player_id, lx.gh, lx.port) a
   order by a.kg desc limit 1;
  if not found or r.kg < 200 then return 0; end if;
  perform push_srv(r.player_id, 'paper-day', 'Kystposten',
    'Landingen din på ' || round(r.kg)::text || ' kg er dagens største langs kysten. Du står i avisa.',
    'Kystposten', 'Your landing of ' || round(r.kg)::text || ' kg is the biggest along the coast today. You are in the paper.', 6);
  return 1;
end $$;

revoke all on function public.news_put(text, double precision, real, real, text, text, jsonb) from public, anon;
grant execute on function public.news_put(text, double precision, real, real, text, text, jsonb) to authenticated;
revoke all on function public.push_paper() from public, anon, authenticated;
grant execute on function public.push_paper() to service_role;

do $$ begin
  perform cron.unschedule('dsb-push-paper') where exists (select 1 from cron.job where jobname = 'dsb-push-paper');
  perform cron.schedule('dsb-push-paper', '9 * * * *', $c$ select public.push_paper(); $c$);
exception when others then raise notice 'pg_cron is not enabled: turn it on under Database → Extensions and run this block again';
end $$;
