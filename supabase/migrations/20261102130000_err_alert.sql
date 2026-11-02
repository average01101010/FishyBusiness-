-- The admin told at once (02.11.2026, the error trap; Jonas: «Det er viktig at vi fanger opp så mye potensielle feil som oppstår så fort
-- som mulig»). Until now an error waited in public.errors until the admin opened Teknikk or the feedback routine ran. err_alert(), every
-- ten minutes from pg_cron, looks at the errors since the last look and sends the admin (players.game_admin, with a push subscription)
-- one push when there is:
--   - a message never seen in the last 60 days (digits made # first, so «etter 1282» and the GPU's numbers do not make a new one),
--   - three crashes or more (src 'crash'),
--   - a black screen, a start that stands still, or an error in an Edge Function (src 'fn:…').
-- At most one push each half hour: until then the cursor stays where it was, so nothing in between is missed. The push goes the way
-- the server's other pushes go (push_queue kind 'srv', sent by push-send within five minutes). Nothing about who: messages and counts.
--
--   err_alert()   what is new since push_state 'err_alert_id'; the push; the cursor moved. Returns the pushes queued.

create or replace function public.err_alert() returns int
language plpgsql security definer set search_path = public as $$
declare
  cur bigint; top bigint; last_at bigint; now_s bigint := extract(epoch from now())::bigint;
  nnew int := 0; ncrash int := 0; nbad int := 0; lst text; bad text; body text; n int := 0;
begin
  select max(id) into top from errors;
  if top is null then return 0; end if;
  select v into cur from push_state where k = 'err_alert_id';
  if cur is null then insert into push_state values ('err_alert_id', top) on conflict (k) do nothing; return 0; end if;   -- (the first look starts now)
  if top <= cur then return 0; end if;
  select v into last_at from push_state where k = 'err_alert_at';
  if last_at is not null and now_s - last_at < 1800 then return 0; end if;

  with b as (select e.msg, e.src from errors e where e.id > cur and e.id <= top),
       g as (select regexp_replace(b.msg, '\d+', '#', 'g') m, min(b.msg) msg, count(*) c from b group by 1),
       nw as (select g.* from g where not exists (select 1 from errors o where o.id <= cur and o.ts > now() - interval '60 days'
                                                    and regexp_replace(o.msg, '\d+', '#', 'g') = g.m))
  select (select count(*) from nw),
         (select string_agg('«' || left(x.msg, 70) || '»' || case when x.c > 1 then ' ×' || x.c else '' end, E'\n' order by x.c desc)
            from (select * from nw order by c desc limit 3) x)
    into nnew, lst;
  select count(*) filter (where src = 'crash'),
         count(*) filter (where src like 'fn:%' or msg like '3D svart skjerm%' or msg like 'Oppstarten står fast%' or msg like 'Lagringen feilet%'),
         string_agg(distinct left(msg, 60), ' · ') filter (where src like 'fn:%' or msg like '3D svart skjerm%' or msg like 'Oppstarten står fast%' or msg like 'Lagringen feilet%')
    into ncrash, nbad, bad
    from errors where id > cur and id <= top;

  update push_state set v = top where k = 'err_alert_id';
  if nnew = 0 and ncrash < 3 and nbad = 0 then return 0; end if;

  body := concat_ws(E'\n',
    case when nnew > 0 then nnew || case when nnew = 1 then ' ny feil: ' else ' nye feil: ' end || lst end,
    case when ncrash >= 3 then ncrash || ' krasj siden sist' end,
    case when nbad > 0 and nnew = 0 then 'Alvorlig: ' || bad end);
  insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at)
    select p.id, now(), 'dsb-err', 'Feil i spillet', left(body, 240), 'srv', now() + interval '12 hours'
      from players p where p.game_admin and exists (select 1 from push_subs s where s.player_id = p.id);
  get diagnostics n = row_count;
  insert into push_state values ('err_alert_at', now_s) on conflict (k) do update set v = excluded.v;
  return n;
end $$;
revoke all on function public.err_alert() from public, anon, authenticated;

do $$ begin
  perform cron.unschedule('dsb-err-alert') where exists (select 1 from cron.job where jobname = 'dsb-err-alert');
  perform cron.schedule('dsb-err-alert', '*/10 * * * *', $c$ select public.err_alert(); $c$);
exception when others then raise notice 'pg_cron is not enabled: turn it on under Database → Extensions and run this block again';
end $$;
