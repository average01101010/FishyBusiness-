-- Push notifications that matter, and never too many (05.10.2026; Jonas: «Vi må lage Pushvarsler for ting som gjør at brukerne bare
-- må åpne appen, men vi kan ikke være irriterende. Varselet må ha betydning», then «Vi skal sende 4 pushvarsel i døgnet. kjør på med
-- alle forslagene»; ui/10g-push.js, supabase/functions/push-send).
--
-- The rules, kept here so no game can break them:
-- - at most four messages a player in 24 hours; what is due at once goes as one message;
-- - none between 22 and 08 Norwegian time: what falls due in the night waits for the morning if it still matters;
-- - each item has a time it stops mattering (expires_at, at most 12 hours after it is due); then it is dropped unsent.
-- What the game plans when it goes to the background (kind 'plan') is replaced on each plan; what the server finds (kind 'srv') is not:
-- - the leaderboard: when another player's landing takes them past you in your group this game week (at most one a day), and
-- - the week's result when a game week is over (push_week, hourly by pg_cron), for each player who landed in it.
-- Both only for players who have not turned the leaderboard off (push_subs.top, set by push_prefs) and are not in the game now
-- (presence heard in the last two minutes).

alter table public.push_queue add column if not exists kind text not null default 'plan' check (kind in ('plan', 'srv'));
alter table public.push_queue add column if not exists expires_at timestamptz;
alter table public.push_queue add column if not exists dropped boolean not null default false;
alter table public.push_subs add column if not exists top boolean not null default true;
create table if not exists public.push_state (k text primary key, v bigint not null);
alter table public.push_state enable row level security;
revoke all on public.push_state from anon, authenticated;

-- the game's plan: replaces its own unsent items (not the server's); each item may say when it stops mattering (exp)
create or replace function public.push_plan(items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int := 0;
begin
  if p is null then raise exception 'not signed in'; end if;
  delete from push_queue q where q.player_id = p and q.sent_at is null and q.kind = 'plan';
  if jsonb_typeof(items) <> 'array' or not exists (select 1 from push_subs s where s.player_id = p) then return 0; end if;
  insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at)
    select p, (i ->> 'at')::timestamptz, left(i ->> 'tag', 40), left(i ->> 'title', 80), left(i ->> 'body', 240), 'plan',
           least(coalesce((i ->> 'exp')::timestamptz, (i ->> 'at')::timestamptz + interval '6 hours'), (i ->> 'at')::timestamptz + interval '12 hours')
    from (select i from jsonb_array_elements(items) i limit 24) x
    where (i ->> 'at')::timestamptz between now() - interval '1 minute' and now() + interval '2 days'
      and coalesce(i ->> 'title', '') <> '' and coalesce(i ->> 'body', '') <> '' and coalesce(i ->> 'tag', '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;

-- whether the leaderboard's notifications come (the game's settings)
create or replace function public.push_prefs(top boolean) returns void language sql security definer set search_path = public as $$
  update push_subs s set top = coalesce(push_prefs.top, true) where s.player_id = pid()
$$;

-- what is due now, one message a player: the stale dropped, nothing in the night, at most four a player in 24 hours; several items due
-- at once go as one, each line with its title
create or replace function public.push_claim(lim int default 300) returns table (id bigint, player_id text, tag text, title text, body text)
language plpgsql security definer set search_path = public as $$
declare t time := (coalesce(nullif(current_setting('dsb.clock', true), '')::timestamptz, now()) at time zone 'Europe/Oslo')::time;   -- dsb.clock: the tests' clock
begin
  update push_queue q set sent_at = now(), dropped = true
   where q.sent_at is null and (q.expires_at < now() or (q.expires_at is null and q.send_at < now() - interval '12 hours'));
  -- the server's items for a player who is in the game now: they see it there
  update push_queue q set sent_at = now(), dropped = true
   where q.sent_at is null and q.kind = 'srv' and q.send_at <= now()
     and exists (select 1 from presence pr where pr.player_id = q.player_id and pr.at > now() - interval '2 minutes');
  if t >= '22:00' or t < '08:00' then return; end if;
  return query
  with due as (
    select q.id from push_queue q
     where q.sent_at is null and q.send_at <= now()
       and (select count(distinct q3.sent_at) from push_queue q3 where q3.player_id = q.player_id and q3.sent_at > now() - interval '24 hours' and not q3.dropped) < 4
     order by q.send_at limit lim for update skip locked),
  upd as (update push_queue q set sent_at = now() from due where q.id = due.id returning q.id, q.player_id, q.tag, q.title, q.body, q.send_at)
  select min(u.id), u.player_id,
         case when count(*) = 1 then min(u.tag) else 'dsb-' || min(u.id) end,
         case when count(*) = 1 then min(u.title) else 'Det Store Blå' end,
         case when count(*) = 1 then min(u.body) else left(string_agg(u.title || ': ' || u.body, E'\n' order by u.send_at), 600) end
    from upd u group by u.player_id;
end $$;

-- the game hour on the shared clock (core/01-world.js: game minute 0 was 5 October 2026 15:00 UTC, six times real time)
create or replace function public.world_gh() returns double precision language sql stable as $$
  select extract(epoch from (now() - timestamptz '2026-10-05 15:00:00+00')) * 6 / 3600
$$;

-- a server item for a player who has the leaderboard on, in their language
create or replace function public.push_srv(pl text, tg text, no_t text, no_b text, en_t text, en_b text, hrs int) returns void
language plpgsql security definer set search_path = public as $$
declare lg text;
begin
  select coalesce(max(s.lang), 'no') into lg from push_subs s where s.player_id = pl and s.top;
  if not exists (select 1 from push_subs s where s.player_id = pl and s.top) then return; end if;
  insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at)
    values (pl, now(), left(tg, 40), left(case when lg like 'en%' then en_t else no_t end, 80), left(case when lg like 'en%' then en_b else no_b end, 240), 'srv', now() + make_interval(hours => hrs));
end $$;

-- after a landing: the players in the same group this game week whom it took the lander past (at most five, one a player a day)
create or replace function public.push_passed(p text, g text, w int) returns void
language plpgsql security definer set search_path = public as $$
declare cap real := case when g = 'lukket' then 60000 else 10000 end; mine real; before real; nm text; r record; rk int;
begin
  if g not in ('open', 'lukket') then return; end if;
  select coalesce(sum(least(l.kg, cap)), 0) into mine from landings l where l.player_id = p and l.acc = g and l.gh >= w * 168.0 and l.gh < (w + 1) * 168.0;
  select coalesce(sum(least(l.kg, cap)), 0) into before from landings l where l.player_id = p and l.acc = g and l.gh >= w * 168.0 and l.gh < (w + 1) * 168.0
     and l.at < now() - interval '2 seconds';
  select nullif(l.boat, '') into nm from landings l where l.player_id = p order by l.id desc limit 1;
  for r in select l.player_id pl, sum(least(l.kg, cap)) kg from landings l
            where l.acc = g and l.gh >= w * 168.0 and l.gh < (w + 1) * 168.0 and l.player_id <> p group by l.player_id
           having sum(least(l.kg, cap)) >= before and sum(least(l.kg, cap)) < mine order by 2 desc limit 5 loop
    if exists (select 1 from push_queue q where q.player_id = r.pl and q.tag like 'top-pass%' and q.send_at > now() - interval '20 hours') then continue; end if;
    select 1 + count(*) into rk from (select l.player_id from landings l where l.acc = g and l.gh >= w * 168.0 and l.gh < (w + 1) * 168.0
                                       group by l.player_id having sum(least(l.kg, cap)) > r.kg) a;
    perform push_srv(r.pl, 'top-pass', 'Topplista',
      coalesce('«' || nm || '»', 'En båt') || ' gikk forbi deg i ' || case when g = 'lukket' then 'lukket' else 'åpen' end || ' gruppe. Du er nå nr. ' || rk || ' i Norge denne uka.',
      'Leaderboard', coalesce('«' || nm || '»', 'A boat') || ' went past you in the ' || case when g = 'lukket' then 'closed' else 'open' end || ' group. You are now no. ' || rk || ' in Norway this week.', 4);
  end loop;
end $$;

-- land_put as before (20261006020000_toplist.sql), then the leaderboard's notifications
create or replace function public.land_put(gh double precision, y int, port text, acc text, items jsonb, boat text default '', company text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); r jsonb; a text := case when land_put.acc in ('open', 'lukket') then land_put.acc else 'none' end;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 or y is null or y < 2026 or y > 2200 then raise exception 'bad time'; end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) > 24 then raise exception 'bad rows'; end if;
  if (select count(*) from landings where player_id = p and at > now() - interval '1 hour') > 400 then raise exception 'too many'; end if;
  for r in select * from jsonb_array_elements(items) loop
    if coalesce((r ->> 'kg')::real, 0) > 0 then
      insert into landings (player_id, gh, y, port, sp, acc, kg, kgq, boat, company)
        values (p, land_put.gh, land_put.y, left(coalesce(land_put.port, ''), 40), left(coalesce(r ->> 'sp', ''), 16), a,
                least((r ->> 'kg')::real, 100000), least(greatest(coalesce((r ->> 'kgq')::real, 0), 0), 100000),
                left(btrim(regexp_replace(coalesce(land_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24),
                left(btrim(regexp_replace(coalesce(land_put.company, ''), '[<>&"''`\\]', '', 'g')), 40));
    end if;
  end loop;
  begin perform push_passed(p, a, floor(land_put.gh / 168)::int); exception when others then null; end;   -- a notification never stops a sale
end $$;

-- hourly: when a game week is over, each player who landed in it hears where they ended, in each group
-- (only_week: that week, without the state, for the tests)
create or replace function public.push_week(only_week int default null) returns int
language plpgsql security definer set search_path = public as $$
declare cur int := floor(world_gh() / 168)::int; w int; done bigint; n int := 0; r record;
begin
  if only_week is not null then w := only_week;
  else
    select v into done from push_state where k = 'week';
    if done is null then insert into push_state values ('week', cur - 1) on conflict (k) do nothing; return 0; end if;
    if done >= cur - 1 then return 0; end if;
    w := cur - 1;
  end if;
  for r in with t as (select l.player_id, l.acc, sum(least(l.kg, case when l.acc = 'lukket' then 60000 else 10000 end)) kg from landings l
                       where l.acc in ('open', 'lukket') and l.gh >= w * 168.0 and l.gh < (w + 1) * 168.0 group by l.player_id, l.acc)
           select t.*, rank() over (partition by t.acc order by t.kg desc) rk, count(*) over (partition by t.acc) nn from t loop
    perform push_srv(r.player_id, 'top-week', 'Uka er over',
      'Du ble nr. ' || r.rk || ' av ' || r.nn || ' i ' || case when r.acc = 'lukket' then 'lukket' else 'åpen' end || ' gruppe med ' || round(r.kg)::text || ' kg.' || case when r.rk = 1 then ' Norges beste båt!' else '' end,
      'The week is over', 'You came no. ' || r.rk || ' of ' || r.nn || ' in the ' || case when r.acc = 'lukket' then 'closed' else 'open' end || ' group with ' || round(r.kg) || ' kg.' || case when r.rk = 1 then ' Norway''s best boat!' else '' end, 12);
    n := n + 1;
  end loop;
  if only_week is null then update push_state set v = w where k = 'week'; end if;
  return n;
end $$;

revoke all on function public.push_prefs(boolean), public.push_srv(text, text, text, text, text, text, int), public.push_passed(text, text, int),
  public.push_week(int), public.world_gh() from public, anon, authenticated;
grant execute on function public.push_prefs(boolean) to authenticated;
grant execute on function public.push_week(int) to service_role;

do $$ begin
  perform cron.unschedule('dsb-push-week') where exists (select 1 from cron.job where jobname = 'dsb-push-week');
  perform cron.schedule('dsb-push-week', '7 * * * *', $c$ select public.push_week(); $c$);
exception when others then raise notice 'pg_cron is not enabled: turn it on under Database → Extensions and run this block again';
end $$;
