-- Ukas fangst (docs/planer/oppdrag-2.md U1, Jonas 30.10.2026: «10. Ja.»): the world's one message a week becomes the week's catch, on
-- Sunday evening. To each who has the weekly message on: her own week (what she landed the last seven days and her place in her group)
-- with Norway's best fisher of the week after it; to one who landed nothing, only the best fisher, as before. Still one message a week
-- from the world (docs/push-plan.md), from Sunday 19:00 Norwegian time (pg_cron asks every hour), the last seven real days of the
-- landings, guests left out. Replaces push_week of 20261008000000_push_ops.sql; the switch «Ukas beste fisker» (push_subs.top) still
-- turns it off. force: not waiting for the day, for the tests.
create or replace function public.push_week(force boolean default false) returns int
language plpgsql security definer set search_path = public as $$
declare t timestamp := (coalesce(nullif(current_setting('dsb.clock', true), '')::timestamptz, now()) at time zone 'Europe/Oslo'); wk bigint := extract(isoyear from t)::bigint * 100 + extract(week from t)::bigint;
        done bigint; o record; c record; me record; best_no text := ''; best_en text := ''; no_b text; en_b text; n int := 0; p text;
begin
  if not force then
    if extract(isodow from t) <> 7 or t::time < '19:00' then return 0; end if;
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
    best_no := 'Ukas beste fisker i åpen gruppe er «' || coalesce(nullif(o.boat, ''), 'en båt') || '» med ' || replace(round((o.kg / 1000)::numeric, 1)::text, '.', ',') || ' t.';
    best_en := 'The week''s best fisher in the open group is «' || coalesce(nullif(o.boat, ''), 'a boat') || '» with ' || round((o.kg / 1000)::numeric, 1)::text || ' t.';
  end if;
  if c.kg is not null then
    best_no := btrim(best_no || ' I lukket gruppe: «' || coalesce(nullif(c.boat, ''), 'en båt') || '» med ' || replace(round((c.kg / 1000)::numeric, 1)::text, '.', ',') || ' t.');
    best_en := btrim(best_en || ' In the closed group: «' || coalesce(nullif(c.boat, ''), 'a boat') || '» with ' || round((c.kg / 1000)::numeric, 1)::text || ' t.');
  end if;
  for p in select distinct s.player_id from push_subs s where s.top loop
    -- her own week: the kilos in the group she last landed in, and her place among all who landed in that group (ties share a place)
    me := null;
    with l as (select x.player_id, x.acc, x.kg, x.id from landings x join players pl on pl.id = x.player_id
                 where x.at > now() - interval '7 days' and not coalesce(pl.guest, false)),
         g as (select l.acc from l where l.player_id = p order by l.id desc limit 1),
         s as (select l.player_id, sum(least(l.kg, case when l.acc = 'lukket' then 60000 else 10000 end)) kg from l where l.acc = (select acc from g) group by l.player_id),
         r as (select s.player_id, s.kg, rank() over (order by s.kg desc) rk, count(*) over () n from s)
    select r.kg, r.rk, r.n, (select acc from g) acc into me from r where r.player_id = p;
    if me.kg is not null and me.kg > 0 then
      no_b := 'Du leverte ' || replace(round((me.kg / 1000)::numeric, 1)::text, '.', ',') || ' t, plass ' || me.rk || ' av ' || me.n || ' i ' || case when me.acc = 'lukket' then 'lukket' else 'åpen' end || ' gruppe. ' || best_no;
      en_b := 'You landed ' || round((me.kg / 1000)::numeric, 1)::text || ' t, place ' || me.rk || ' of ' || me.n || ' in the ' || case when me.acc = 'lukket' then 'closed' else 'open' end || ' group. ' || best_en;
      perform push_srv(p, 'top-week', 'Ukas fangst', no_b, 'The week''s catch', en_b, 36);
    else
      perform push_srv(p, 'top-week', 'Norges beste fisker', best_no, 'Norway''s best fisher', best_en, 36);
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.push_week(boolean) from public, anon, authenticated;
grant execute on function public.push_week(boolean) to service_role;
