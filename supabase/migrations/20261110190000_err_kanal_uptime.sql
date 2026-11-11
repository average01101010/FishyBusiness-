-- L1d, the error alert (steg 77, 10.11.2026, docs/planer/lansering-plan.md; Jonas, valg 16 V4 B: only push, with an alert for down and
-- for a hang; no e-mail, no e-mail service, no new processor). Three things, and nothing a player notices:
--
-- 1. Test or production. The page says which edition it is (meta.ch from <meta name="dsb-channel">, ui/10f-cloud.js cloudMeta: 'test'
--    on test.detstorebla.no, nothing on detstorebla.no), and errors keeps it (errors.ch). tm_error has the same arguments as before, so
--    a page from before this migration, and this migration before the page, both work: the old function never read meta.ch.
--    err_alert goes through the two editions each with its own cursor and its own half hour: production as before (the keys
--    'err_alert_id' and 'err_alert_at' go on), test with «[test]» first in the title, its own tag, and never a push at night (23–07
--    Norwegian time): the cursor waits, so what came in the night is told at seven. The row's channel decides, not the project the
--    migration runs in, so the same file goes in both projects.
-- 2. A hang. The page's watchdog (a Web Worker, ui/11b-watchdog.js) sends «Spillet hang i N s · where» itself while the main thread
--    stands still. That is one of the grave ones (as a black screen or a start that stands still): a push each time, at most one each
--    half hour. «Spillet hang i N s, kom tilbake» (the page answered again) is kept but never pushes by itself.
-- 3. Down. uptime_tick(), every five minutes from pg_cron (dsb-uptime), asks the sites with pg_net: the game's version.json, the
--    real-time relay (GET /rt without a ticket: the relay answers 404 itself, Caddy 502 when it is gone) and the test edition's
--    version.json. pg_net answers after the transaction, so each run reads the answers to the questions the run before asked, and asks
--    again. Two misses in a row: «<site> svarer ikke» to the admin (players.game_admin, with a push subscription); when it answers
--    again: «<site> er oppe igjen». The test edition with «[test]» first and never at night: what happened in the night is told at
--    seven if it still holds. A run with no answer at all in net._http_response (pg_net not running) counts as neither.
--    From the question that fails to the push: 10–20 minutes (two runs, then push-send within five).
--
-- Safe to run twice. Nothing about who in the pushes: sites, messages and counts.

alter table public.errors add column if not exists ch text;

create or replace function public.tm_error(msg text, src text, stack text, meta jsonb) returns void language plpgsql security definer set search_path = public as $$
declare p text := pid(); ok boolean := false; a int := tm_active();
begin
  if (select count(*) from errors where ts > now() - interval '1 minute') >= 30 + a
     or (select count(*) from errors where ts > now() - interval '1 hour') >= 200 + 20 * a then return; end if;
  if p is not null then select coalesce(consent, false) into ok from players where id = p; end if;
  insert into errors (player_id, session_id, msg, src, stack, version, browser, platform, gpu, scr, lvl, ch)
    values (case when ok then p end, case when ok then (meta ->> 'sid')::uuid end, left(msg, 400), left(src, 200), left(stack, 2000),
            left(meta ->> 'version', 20), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20), left(meta ->> 'gpu', 80), left(meta ->> 'scr', 24), tm_num(meta ->> 'lvl', -1, 9)::smallint,
            case when meta ->> 'ch' = 'test' then 'test' end);
end $$;

-- night for the test edition's pushes: 23–07 Norwegian time
create or replace function public.err_night(at timestamptz) returns boolean language sql stable as $$
  select extract(hour from at at time zone 'Europe/Oslo') >= 23 or extract(hour from at at time zone 'Europe/Oslo') < 7
$$;
revoke all on function public.err_night(timestamptz) from public, anon, authenticated;

-- (the clock as an argument, so the night can be tried; pg_cron calls it with none)
drop function if exists public.err_alert();
create or replace function public.err_alert(at timestamptz default now()) returns int
language plpgsql security definer set search_path = public as $$
declare
  c text; kid text; kat text;
  cur bigint; top bigint; last_at bigint; now_s bigint := extract(epoch from at)::bigint;
  nnew int; ncrash int; nbad int; lst text; bad text; body text; n int; total int := 0;
begin
  foreach c in array array['', 'test'] loop
    kid := 'err_alert_id' || case when c = '' then '' else '_' || c end;
    kat := 'err_alert_at' || case when c = '' then '' else '_' || c end;
    select max(id) into top from errors where coalesce(ch, '') = c;
    if top is null then continue; end if;
    select v into cur from push_state where k = kid;
    if cur is null then insert into push_state values (kid, top) on conflict (k) do nothing; continue; end if;   -- (the first look starts now)
    if top <= cur then continue; end if;
    if c = 'test' and err_night(at) then continue; end if;   -- (the cursor waits: told at seven)
    select v into last_at from push_state where k = kat;
    if last_at is not null and now_s - last_at < 1800 then continue; end if;

    -- (the watchdog's «kom tilbake» is never new by itself: it has where it was in it, and the hang it ends was told already)
    with b as (select e.msg, e.src from errors e where e.id > cur and e.id <= top and coalesce(e.ch, '') = c and e.msg not like 'Spillet hang i %kom tilbake%'),
         g as (select regexp_replace(b.msg, '\d+', '#', 'g') m, min(b.msg) msg, count(*) c from b group by 1),
         nw as (select g.* from g where not exists (select 1 from errors o where o.id <= cur and o.ts > now() - interval '60 days'
                                                      and regexp_replace(o.msg, '\d+', '#', 'g') = g.m))
    select (select count(*) from nw),
           (select string_agg('«' || left(x.msg, 70) || '»' || case when x.c > 1 then ' ×' || x.c else '' end, E'\n' order by x.c desc)
              from (select * from nw order by c desc limit 3) x)
      into nnew, lst;
    select count(*) filter (where e.src = 'crash'),
           count(*) filter (where e.grave),
           string_agg(distinct left(e.msg, 60), ' · ') filter (where e.grave)
      into ncrash, nbad, bad
      from (select o.src, o.msg, (o.src like 'fn:%' or o.msg like '3D svart skjerm%' or o.msg like 'Oppstarten står fast%' or o.msg like 'Lagringen feilet%'
                                  or (o.msg like 'Spillet hang i %' and o.msg not like '%kom tilbake%')) grave
              from errors o where o.id > cur and o.id <= top and coalesce(o.ch, '') = c) e;

    update push_state set v = top where k = kid;
    if nnew = 0 and ncrash < 3 and nbad = 0 then continue; end if;

    body := concat_ws(E'\n',
      case when nnew > 0 then nnew || case when nnew = 1 then ' ny feil: ' else ' nye feil: ' end || lst end,
      case when ncrash >= 3 then ncrash || ' krasj siden sist' end,
      case when nbad > 0 and nnew = 0 then 'Alvorlig: ' || bad end);
    insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at)
      select p.id, now(), case when c = 'test' then 'dsb-err-test' else 'dsb-err' end,
             case when c = 'test' then '[test] Feil i spillet' else 'Feil i spillet' end, left(body, 240), 'srv', now() + interval '12 hours'
        from players p where p.game_admin and exists (select 1 from push_subs s where s.player_id = p.id);
    get diagnostics n = row_count;
    total := total + n;
    insert into push_state values (kat, now_s) on conflict (k) do update set v = excluded.v;
  end loop;
  return total;
end $$;
revoke all on function public.err_alert(timestamptz) from public, anon, authenticated;
-- the test edition's cursor starts here, at what is in the table now: no error had a channel before this, so the first one from the
-- test edition is told (without this the first look would only have started the cursor, and that error would never be told)
insert into public.push_state (k, v) select 'err_alert_id_test', coalesce(max(id), 0) from public.errors on conflict (k) do nothing;

-- ---------- down ----------
create table if not exists public.uptime (
  site text primary key,
  url text not null,
  label text not null,
  test boolean not null default false,     -- «[test]» first, and never a push at night
  ok_below int not null default 300,       -- an answer with a status under this is «up» (the relay answers 404 without a ticket)
  req bigint,                              -- pg_net's id of the question asked last
  miss int not null default 0,             -- misses in a row
  down boolean not null default false,     -- two misses in a row
  told boolean not null default false,     -- the admin has been told it is down
  since timestamptz,                       -- when it went down
  seen timestamptz                         -- the last answer that was «up»
);
alter table public.uptime enable row level security;
revoke all on table public.uptime from anon, authenticated;
insert into public.uptime (site, url, label, test, ok_below) values
  ('prod', 'https://detstorebla.no/version.json', 'detstorebla.no', false, 300),
  ('rt', 'https://detstorebla.no/rt', 'Sanntidsreléet på detstorebla.no', false, 500),
  ('test', 'https://test.detstorebla.no/version.json', 'test.detstorebla.no', true, 300)
on conflict (site) do nothing;

create or replace function public.uptime_tick(at timestamptz default now()) returns int
language plpgsql security definer set search_path = public as $$
declare u record; r record; up boolean; quiet boolean; n int; total int := 0; mins int;
begin
  for u in select * from uptime order by site loop
    -- the answer to the question the run before asked
    if u.req is not null then
      select status_code, timed_out, error_msg into r from net._http_response where id = u.req;
      if found then
        up := r.status_code is not null and r.status_code >= 200 and r.status_code < u.ok_below and r.timed_out is not true;
        if up then update uptime set miss = 0, down = false, seen = at where site = u.site;
        else update uptime set miss = miss + 1, down = (miss + 1 >= 2), since = case when miss + 1 >= 2 and not down then at else since end where site = u.site;
        end if;
      end if;
    end if;
    select * into u from uptime where site = u.site;
    quiet := u.test and err_night(at);
    if not quiet and u.down <> u.told then
      mins := greatest(1, round(extract(epoch from at - coalesce(u.since, at)) / 60))::int;
      insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at)
        select p.id, now(), 'dsb-up-' || u.site,
               case when u.test then '[test] ' else '' end || u.label || case when u.down then ' svarer ikke' else ' er oppe igjen' end,
               case when u.down then 'To spørringer på rad uten svar' || case when mins > 12 then ' (nede i ' || mins || ' min)' else '' end || '.'
                    else 'Svarer igjen etter ' || mins || ' min.' end,
               'srv', now() + interval '12 hours'
          from players p where p.game_admin and exists (select 1 from push_subs s where s.player_id = p.id);
      get diagnostics n = row_count; total := total + n;
      update uptime set told = u.down where site = u.site;
    end if;
    -- and the next question (sent by pg_net after this transaction)
    update uptime set req = net.http_get(url := u.url, timeout_milliseconds := 10000) where site = u.site;
  end loop;
  return total;
end $$;
revoke all on function public.uptime_tick(timestamptz) from public, anon, authenticated;

do $$ begin
  perform cron.unschedule('dsb-err-alert') where exists (select 1 from cron.job where jobname = 'dsb-err-alert');
  perform cron.schedule('dsb-err-alert', '*/10 * * * *', $c$ select public.err_alert(); $c$);
  perform cron.unschedule('dsb-uptime') where exists (select 1 from cron.job where jobname = 'dsb-uptime');
  perform cron.schedule('dsb-uptime', '*/5 * * * *', $c$ select public.uptime_tick(); $c$);
exception when others then raise notice 'pg_cron is not enabled: turn it on (and pg_net) under Database → Extensions and run this block again';
end $$;
