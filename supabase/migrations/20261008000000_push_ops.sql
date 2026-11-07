-- Push notifications tied to the work of the boat (08.10.2026; Jonas 07.10.2026, docs/push-plan.md):
-- - the night is no quieter than the day (fishers keep watch at night, and a phone's own sleep mode quiets it);
-- - what the game lays out (kind 'plan': the boat arrived, the hold full, rested, gear soaked, the yard done, a gale on the way, a tired
--   crew) goes out at the earliest five minutes after the app was closed, and as many a day as the player's use of the game allows:
--   6 as the ground, 12 with two sessions a day over the last three days, 24 with four, and 2 when the last five were not answered by
--   an opening of the app within half an hour (push_cap);
-- - the world sends one message a week: Norway's best fisher of the week (push_week), no other world news, and the leaderboard's
--   «passed you» message is gone (push_passed does nothing); Kystposten sends none.

alter table public.push_queue add column if not exists pri smallint not null default 3;

-- the game's plan: replaces its own unsent items; each item says when (at), how much it matters (pri 0 most) and when it stops mattering (exp);
-- nothing is sent sooner than five minutes from now, which is when the app was closed
create or replace function public.push_plan(items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int := 0;
begin
  if p is null then raise exception 'not signed in'; end if;
  delete from push_queue q where q.player_id = p and q.sent_at is null and q.kind = 'plan';
  if jsonb_typeof(items) <> 'array' or not exists (select 1 from push_subs s where s.player_id = p) then return 0; end if;
  insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at, pri)
    select p, greatest((i ->> 'at')::timestamptz, now() + interval '5 minutes'), left(i ->> 'tag', 40), left(i ->> 'title', 80), left(i ->> 'body', 240), 'plan',
           least(coalesce((i ->> 'exp')::timestamptz, (i ->> 'at')::timestamptz + interval '6 hours'), (i ->> 'at')::timestamptz + interval '12 hours'),
           least(greatest(coalesce((i ->> 'pri')::int, 3), 0), 5)
    from (select i from jsonb_array_elements(items) i limit 24) x
    where (i ->> 'at')::timestamptz between now() - interval '1 minute' and now() + interval '2 days'
      and coalesce(i ->> 'title', '') <> '' and coalesce(i ->> 'body', '') <> '' and coalesce(i ->> 'tag', '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;

-- how many messages the game may send a player in 24 hours: from how much she plays (sessions over three days), and fewer if she did not
-- answer the last five (no session within half an hour after each)
create or replace function public.push_cap(pl text) returns int
language sql stable security definer set search_path = public as $$
  with last5 as (select distinct q.sent_at at from push_queue q where q.player_id = pl and q.kind = 'plan' and q.sent_at is not null and not q.dropped order by 1 desc limit 5),
       s3 as (select count(*) n from sessions se where se.player_id = pl and se.started_at > now() - interval '72 hours')
  select case
    -- the last five unanswered (no session within half an hour after each) and none since the last: two a day until she opens the app again
    when (select count(*) = 5 and count(*) filter (where not exists (select 1 from sessions se where se.player_id = pl and se.started_at >= l.at and se.started_at < l.at + interval '30 minutes')) = 5
                 and not exists (select 1 from sessions se where se.player_id = pl and se.started_at > (select max(at) from last5)) from last5 l) then 2
    when (select n from s3) >= 12 then 24
    when (select n from s3) >= 6 then 12
    else 6 end
$$;

-- what is due now, one message a player: the stale dropped, no quiet hours, the plan's messages up to the player's cap in 24 hours (the
-- weekly message is outside it); several items due at once go as one, the most important first
create or replace function public.push_claim(lim int default 300) returns table (id bigint, player_id text, tag text, title text, body text)
language plpgsql security definer set search_path = public as $$
begin
  update push_queue q set sent_at = now(), dropped = true
   where q.sent_at is null and (q.expires_at < now() or (q.expires_at is null and q.send_at < now() - interval '12 hours'));
  return query
  with due as (
    select q.id from push_queue q
     where q.sent_at is null and q.send_at <= now()
       and (q.kind = 'srv' or (select count(distinct q3.sent_at) from push_queue q3 where q3.player_id = q.player_id and q3.kind = 'plan' and q3.sent_at > now() - interval '24 hours' and not q3.dropped) < push_cap(q.player_id))
     order by q.send_at limit lim for update skip locked),
  upd as (update push_queue q set sent_at = now() from due where q.id = due.id returning q.id, q.player_id, q.tag, q.title, q.body, q.send_at, q.pri)
  select min(u.id), u.player_id,
         case when count(*) = 1 then min(u.tag) else 'dsb-' || min(u.id) end,
         case when count(*) = 1 then min(u.title) else 'Det Store Blå' end,
         case when count(*) = 1 then min(u.body) else left(string_agg(u.title || ': ' || u.body, E'\n' order by u.pri, u.send_at), 600) end
    from upd u group by u.player_id;
end $$;

-- the leaderboard's «passed you» is gone (Jonas 07.10.2026: no world news but the week's best fisher)
create or replace function public.push_passed(p text, g text, w int) returns void language plpgsql security definer set search_path = public as $$
begin return; end $$;

-- Kystposten sends no push (Jonas 07.10.2026): the paper is read in the game; the hourly job is taken down and the function does nothing
create or replace function public.push_paper() returns int language plpgsql security definer set search_path = public as $$
begin return 0; end $$;
do $$ begin
  perform cron.unschedule('dsb-push-paper') where exists (select 1 from cron.job where jobname = 'dsb-push-paper');
exception when others then raise notice 'pg_cron is not enabled: nothing to take down';
end $$;

-- once a week (Monday from 08:00 Norwegian time, checked every hour by pg_cron): Norway's best fisher of the last seven days, in the open and
-- the closed group, to everyone who has the weekly message on (push_subs.top, from push_prefs). Guests are left out. force: not waiting
-- for the day, for the tests
drop function if exists public.push_week(int);
create or replace function public.push_week(force boolean default false) returns int
language plpgsql security definer set search_path = public as $$
declare t timestamp := (coalesce(nullif(current_setting('dsb.clock', true), '')::timestamptz, now()) at time zone 'Europe/Oslo'); wk bigint := extract(isoyear from t)::bigint * 100 + extract(week from t)::bigint;
        done bigint; o record; c record; no_t text := 'Norges beste fisker'; no_b text := ''; en_b text := ''; n int := 0; p text;
begin
  if not force then
    if extract(isodow from t) <> 1 or t::time < '08:00' then return 0; end if;
    select v into done from push_state where k = 'weekly';
    if done is not null and done >= wk then return 0; end if;
  end if;
  select x.boat, x.kg into o from (select (array_agg(l.boat order by l.id desc))[1] boat, sum(least(l.kg, 10000)) kg from landings l join players pl on pl.id = l.player_id
      where l.acc = 'open' and l.at > now() - interval '7 days' and not coalesce(pl.guest, false) group by l.player_id order by 2 desc limit 1) x;
  select x.boat, x.kg into c from (select (array_agg(l.boat order by l.id desc))[1] boat, sum(least(l.kg, 60000)) kg from landings l join players pl on pl.id = l.player_id
      where l.acc = 'lukket' and l.at > now() - interval '7 days' and not coalesce(pl.guest, false) group by l.player_id order by 2 desc limit 1) x;
  if not force then insert into push_state values ('weekly', wk) on conflict (k) do update set v = excluded.v; end if;
  if o.kg is null and c.kg is null then return 0; end if;
  if o.kg is not null then
    no_b := 'Ukas beste fisker i åpen gruppe er «' || coalesce(nullif(o.boat, ''), 'en båt') || '» med ' || replace(round((o.kg / 1000)::numeric, 1)::text, '.', ',') || ' t.';
    en_b := 'The week''s best fisher in the open group is «' || coalesce(nullif(o.boat, ''), 'a boat') || '» with ' || round((o.kg / 1000)::numeric, 1)::text || ' t.';
  end if;
  if c.kg is not null then
    no_b := btrim(no_b || ' I lukket gruppe: «' || coalesce(nullif(c.boat, ''), 'en båt') || '» med ' || replace(round((c.kg / 1000)::numeric, 1)::text, '.', ',') || ' t.');
    en_b := btrim(en_b || ' In the closed group: «' || coalesce(nullif(c.boat, ''), 'a boat') || '» with ' || round((c.kg / 1000)::numeric, 1)::text || ' t.');
  end if;
  for p in select distinct s.player_id from push_subs s where s.top loop
    perform push_srv(p, 'top-week', no_t, no_b, 'Norway''s best fisher', en_b, 36);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.push_cap(text), public.push_week(boolean), public.push_passed(text, text, int) from public, anon, authenticated;
grant execute on function public.push_week(boolean) to service_role;
