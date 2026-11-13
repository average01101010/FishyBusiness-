-- Kappløpet Lindesnes–Nordkapp in the cloud (KL3, steg 118, 13.11.2026; docs/planer/kapplop.md KL3, core/09o-kapplop.js, ui/10h-world.js
-- lopSync and lopTop). Jonas 12.11.2026: «Det skal ikke være lov med teleportering, men trim-boost er lovlig», a new board every real
-- week (V3 B: Monday 00:00 Norwegian time), classes by the type's top speed (V4 A), and trim never shown on the board (V7 A).
-- The race is sailed in the game, so the server can only see that a time is possible, not that it is real («Juks: hva serveren kan
-- sjekke»). Nothing is refused and the player is told nothing: an attempt that cannot have been sailed is kept with its flag, is never on
-- the board, and the account gets a mark of the kind 'lop' in cheat_flags (20261110160000_cheat_flags.sql; «Fjern merket» puts the
-- attempts back on the board, and cheat_on works as for the other lists).
--
--   lop_legs        the course: per leg the way (nm, the shortest of the measured routes, KL1a), the least time a task takes (0: a task
--                   that fails counts as done at once, with 60 minutes added), where it begins and ends in the chart's grid (km) and the
--                   radius of the checkpoint there; the last leg ends at the line due north of the cape (tr: its length north)
--   lop_runs        one attempt per row, one open ('run') per account: the class and type, the boat's name, the game minute it cast
--                   off, the legs as they came (times, the place at the end, the track, and for the admin the trim, what was added and
--                   taken off, the tasks), the end (st 'done' or 'dnf', how, the time on the clock, the real week it counts in) and the flag
--   cheat_vt.vmax   the highest top speed of the type without trim (core/09o-kapplop.js lopVcap: the 90 hp outboard, the yard's last
--                   propeller and engine step), and vcls its class (lopCls); tests/unit/juksetabell.test.mjs holds both against the game
--   lop_start(rid, vtype, boat, t0, vid)            the attempt cast off (the class is the type's here, never the call's); rid is the
--                                                   game's id with the game minute it cast off, so a save taken back never repeats one
--   lop_leg(rid, leg, t0, t1, p, pts, d)            a leg over, in order, with the checks below
--   lop_end(rid, st, how, t1, min)                  the attempt over
--   lop_top(wk)                                     the week's top 20 per class, how many, your place, the public id as pos_world
--   admin_lop(days)                                 the admin's tab «Kappløp»: sums, never names (is_admin() with aal2)
-- The checks on each leg (a flag is the first that fails):
--   seq    the leg does not begin where the one before ended, or ends before it begins
--   fast   faster than the way at the type's vmax times the trim the server has delivered to the account (the largest of the grants'
--          trims, any time: a trim adds its hours and may lie unused), less the 10 % margin (lopMinH)
--   start  the track's first point is not at the quay in Lindesnes at the cast-off
--   trk    a point of the track farther from the one before than that speed reaches with 10 % and 5 km («Sitter båten fast?» moves her
--          up to 4 km), or points out of order or outside the leg. The number of points is not checked: the game closed for longer than
--          catchUp plays (14 game days) leaves a hole in an honest track, and a leg over 400 game hours is thinned by the game (lopLegPut);
--          a track left out gives only the line from the start to the end, which the speed check over the leg holds anyway
--   cp     the leg does not end at its checkpoint (within its radius and 1 km) or, the last, at the line
--   hopp   a hop over the route (HO3, a grant 'hopp' used) with the race boat (the grant's boat is the vessel id the attempt was
--          started with) after the leg's start and before its end, a minute inside both: «Nei i løpet»; a hop with another boat of the
--          fleet, to the start or home after the finish is allowed
-- and at the end, a finished time below the least the legs allow (fast), or not all six legs (legs). No time ahead of the world's clock
-- (world_gh() + 24 game hours, as land_put). The game's admin account (game_admin) gets trims without the shop and is never flagged.
-- Guests: their attempts are kept and they see themselves; they are on no one else's board, and a guest's board has only themselves.

create table if not exists public.lop_legs (
  course text not null, leg int not null, nm real not null, task_min real not null default 0,
  fx real not null, fy real not null, fr real not null,
  tx real not null, ty real not null, tr real not null,
  primary key (course, leg));
insert into public.lop_legs (course, leg, nm, task_min, fx, fy, fr, tx, ty, tr) values
  ('lnk', 0, 194, 0, 287.15, 1590.02, 4, 217.83, 1315.37, 5),
  ('lnk', 1, 157, 0, 217.83, 1315.37, 5, 294.69, 1091.97, 5),
  ('lnk', 2, 210, 0, 294.69, 1091.97, 5, 571.86, 851.63, 5),
  ('lnk', 3, 175, 0, 571.86, 851.63, 5, 723.28, 586.94, 5),
  ('lnk', 4, 192, 0, 723.28, 586.94, 5, 903.6, 318.18, 6),
  ('lnk', 5, 181, 0, 903.6, 318.18, 6, 1136.68, 119.25, 40)
  on conflict (course, leg) do update set nm = excluded.nm, task_min = excluded.task_min, fx = excluded.fx, fy = excluded.fy, fr = excluded.fr,
    tx = excluded.tx, ty = excluded.ty, tr = excluded.tr;

create table if not exists public.lop_runs (
  id bigint generated always as identity primary key,
  player_id text not null references public.players (id) on delete cascade,
  course text not null default 'lnk',
  rid text not null,
  cls text not null, vtype text not null, boat text not null default '', vid text not null default '',
  t0 double precision not null,
  legs jsonb not null default '[]'::jsonb,
  st text not null default 'run' check (st in ('run', 'done', 'dnf')), how text,
  t1 double precision, min double precision, week text,
  flag jsonb,
  at timestamptz not null default now(), done_at timestamptz,
  unique (player_id, rid));
create unique index if not exists lop_runs_open on public.lop_runs (player_id) where st = 'run';
create index if not exists lop_runs_week on public.lop_runs (course, week) where st = 'done';
create index if not exists lop_runs_at on public.lop_runs (at desc);
alter table public.lop_legs enable row level security;
alter table public.lop_runs enable row level security;
revoke all on public.lop_legs, public.lop_runs from public, anon, authenticated;

alter table public.cheat_vt add column if not exists vmax real;
alter table public.cheat_vt add column if not exists vcls text;
update public.cheat_vt v set vmax = x.vmax, vcls = x.vcls from (values
  ('skiff', 30, 'rask'), ('trebat', 8.5, 'sakte'), ('snekke', 9.8, 'sakte'), ('plastsjark', 10.4, 'sakte'), ('sjark', 12.2, 'middels'),
  ('hurtigsjark', 30.7, 'rask'), ('sjarkny', 14.6, 'middels'), ('breisjark', 12.8, 'middels'), ('kyst15', 14, 'middels'),
  ('kyst21', 13.4, 'middels'), ('snokrabbe', 14.4, 'hav'), ('autoliner', 13.9, 'hav'), ('bunntral', 16, 'hav'),
  ('pelagisk', 18.1, 'hav'), ('ringnot38', 13.9, 'hav')
  ) as x (vtype, vmax, vcls) where v.vtype = x.vtype;

-- the race's mark lives with the others
alter table public.cheat_flags drop constraint if exists cheat_flags_kind_check;
alter table public.cheat_flags add constraint cheat_flags_kind_check check (kind in ('cash', 'land', 'lop'));

-- the real time of a game minute on the shared clock (core/09o-kapplop.js lopMs: six game minutes a real minute from 5 October 2026
-- 15:00 UTC, as world_gh), and the real week it counts in (lopWeek: the ISO week of Monday 00:00 Norwegian time)
create or replace function public.lop_real(t double precision) returns timestamptz language sql immutable set search_path = '' as $$
  select timestamptz '2026-10-05 15:00:00+00' + make_interval(secs => t * 10) $$;
create or replace function public.lop_wk(ts timestamptz) returns text language sql stable set search_path = '' as $$
  select to_char(ts at time zone 'Europe/Oslo', 'IYYY-"W"IW') $$;
-- the largest trim the server has delivered to the account (core/03-simulation.js BOOSTS: pump 1.5, ic 1.75, turbo 2), 1 without
create or replace function public.lop_trim(p text) returns double precision language sql stable set search_path = public as $$
  select greatest(1, coalesce((select max(case g.data ->> 'k' when 'pump' then 1.5 when 'ic' then 1.75 when 'turbo' then 2 else 1 end)
    from grants g where g.player_id = p and g.data ->> 'give' = 'trim'), 1)) $$;

create or replace function public.lop_start(rid text, vtype text, boat text, t0 double precision, vid text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
declare me text := pid(); id_ text := left(regexp_replace(coalesce(lop_start.rid, ''), '[^a-z0-9_-]', '', 'g'), 24);
  vt text := left(regexp_replace(coalesce(lop_start.vtype, ''), '[^a-z0-9_]', '', 'g'), 24); c text;
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = me) then raise exception 'no player'; end if;
  if id_ = '' then raise exception 'bad attempt'; end if;
  if t0 is null or t0 <> t0 or abs(t0) > 1e9 then raise exception 'bad time'; end if;
  if t0 > world_gh() * 60 + 1440 then raise exception 'ahead of the clock'; end if;
  select v.vcls into c from cheat_vt v where v.vtype = vt;
  if c is null then raise exception 'bad type'; end if;
  if exists (select 1 from lop_runs r where r.player_id = me and r.rid = id_) then return jsonb_build_object('ok', true); end if;
  if (select count(*) from lop_runs r where r.player_id = me and r.at > now() - interval '1 hour') >= 30 then raise exception 'too many'; end if;
  -- one open attempt per account: one the game no longer has (a save taken back, another device) is broken off
  update lop_runs r set st = 'dnf', how = 'ny', done_at = now() where r.player_id = me and r.st = 'run';
  insert into lop_runs (player_id, rid, cls, vtype, boat, t0, vid)
    values (me, id_, c, vt, left(btrim(regexp_replace(coalesce(lop_start.boat, ''), '[<>&"''`\\]', '', 'g')), 24), lop_start.t0,
            left(regexp_replace(coalesce(lop_start.vid, ''), '[^A-Za-z0-9_-]', '', 'g'), 24));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lop_leg(rid text, leg int, t0 double precision, t1 double precision, p jsonb, pts jsonb, d jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me text := pid(); r lop_runs; g lop_legs; n int; vc double precision; trx double precision; mh double precision; fl jsonb := null; ov int := 0;
  pv double precision; ex double precision; ey double precision; ax double precision; ay double precision; at_ double precision;
  bx double precision; by_ double precision; bt double precision; q jsonb; i int := 0; cnt int; spd double precision;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into r from lop_runs x where x.player_id = me and x.rid = lop_leg.rid;
  if r.id is null then raise exception 'no attempt'; end if;
  n := jsonb_array_length(r.legs);
  if lop_leg.leg is not null and lop_leg.leg < n then return jsonb_build_object('ok', true); end if;   -- (sent before)
  if r.st <> 'run' then raise exception 'attempt over'; end if;
  if lop_leg.leg is distinct from n then raise exception 'out of order'; end if;
  select * into g from lop_legs x where x.course = r.course and x.leg = n;
  if g.leg is null then raise exception 'no such leg'; end if;
  if t0 is null or t1 is null or t0 <> t0 or t1 <> t1 or abs(t0) > 1e9 or abs(t1) > 1e9 then raise exception 'bad time'; end if;
  if t1 > world_gh() * 60 + 1440 then raise exception 'ahead of the clock'; end if;
  if jsonb_typeof(p) is distinct from 'array' or jsonb_array_length(p) <> 2 or jsonb_typeof(p -> 0) <> 'number' or jsonb_typeof(p -> 1) <> 'number' then raise exception 'bad place'; end if;
  if jsonb_typeof(pts) is distinct from 'array' or jsonb_array_length(pts) > 400 then raise exception 'bad track'; end if;
  for q in select * from jsonb_array_elements(pts) loop
    if jsonb_typeof(q) <> 'array' or jsonb_array_length(q) <> 3 or jsonb_typeof(q -> 0) <> 'number' or jsonb_typeof(q -> 1) <> 'number' or jsonb_typeof(q -> 2) <> 'number' then raise exception 'bad track'; end if;
  end loop;
  if jsonb_typeof(d) is distinct from 'object' or length(d::text) > 2000 then d := '{}'::jsonb; end if;
  ex := (p ->> 0)::double precision; ey := (p ->> 1)::double precision;
  vc := coalesce((select v.vmax from cheat_vt v where v.vtype = r.vtype), 60);
  trx := lop_trim(me); spd := vc * trx * 1.852;   -- km an hour
  -- seq: where the leg before ended
  pv := case when n = 0 then r.t0 else (r.legs -> (n - 1) ->> 't1')::double precision end;
  if abs(t0 - pv) > 0.5 or t1 <= t0 then fl := jsonb_build_object('k', 'seq', 'leg', n, 'from', pv, 't0', t0, 't1', t1); end if;
  -- fast: the leg in less than the way at that speed allows (lopMinH)
  mh := g.nm / (vc * trx) * 0.9 + g.task_min / 60;
  if fl is null and (t1 - t0) / 60 < mh then ov := ceil((mh - (t1 - t0) / 60) * 60)::int;
    fl := jsonb_build_object('k', 'fast', 'leg', n, 'h', round(((t1 - t0) / 60)::numeric, 2), 'min_h', round(mh::numeric, 2), 'vmax', vc, 'trim', trx); end if;
  -- the track: from where the leg began (the cast-off for the first, the end of the one before) through the points to where it ended
  if n = 0 then
    if jsonb_array_length(pts) = 0 or abs((pts -> 0 ->> 0)::double precision - t0) > 0.5
       or sqrt(power((pts -> 0 ->> 1)::double precision - g.fx, 2) + power((pts -> 0 ->> 2)::double precision - g.fy, 2)) > g.fr + 1 then
      if fl is null then fl := jsonb_build_object('k', 'start', 'leg', n); end if;
    end if;
    at_ := t0; ax := coalesce((pts -> 0 ->> 1)::double precision, g.fx); ay := coalesce((pts -> 0 ->> 2)::double precision, g.fy);
  else
    at_ := t0; ax := (r.legs -> (n - 1) -> 'p' ->> 0)::double precision; ay := (r.legs -> (n - 1) -> 'p' ->> 1)::double precision;
  end if;
  cnt := jsonb_array_length(pts);
  i := 0;
  while fl is null and i <= cnt loop
    if i < cnt then bt := (pts -> i ->> 0)::double precision; bx := (pts -> i ->> 1)::double precision; by_ := (pts -> i ->> 2)::double precision;
    else bt := t1; bx := ex; by_ := ey; end if;
    if bt < at_ or bt > t1 or (n > 0 and i < cnt and bt <= t0) then fl := jsonb_build_object('k', 'trk', 'leg', n, 'at', bt);
    elsif sqrt(power(bx - ax, 2) + power(by_ - ay, 2)) > spd * (bt - at_) / 60 * 1.1 + 5 then
      fl := jsonb_build_object('k', 'trk', 'leg', n, 'at', bt, 'km', round(sqrt(power(bx - ax, 2) + power(by_ - ay, 2))::numeric, 1), 'h', round(((bt - at_) / 60)::numeric, 2)); end if;
    at_ := bt; ax := bx; ay := by_; i := i + 1;
  end loop;
  -- cp: the end at its checkpoint, or over the line north of the cape
  if fl is null then
    if n < (select count(*) - 1 from lop_legs x where x.course = r.course) then
      if sqrt(power(ex - g.tx, 2) + power(ey - g.ty, 2)) > g.tr + 1 then fl := jsonb_build_object('k', 'cp', 'leg', n); end if;
    elsif abs(ex - g.tx) > 3 or ey < g.ty - g.tr - 1 or ey > g.ty + 1 then fl := jsonb_build_object('k', 'cp', 'leg', n); end if;
  end if;
  -- hopp: a hop made between the leg's start and its end
  if fl is null and exists (select 1 from grants h where h.player_id = me and h.data ->> 'give' = 'hopp' and h.used_at is not null and r.vid <> ''
                              and h.data ->> 'boat' = r.vid
                              and h.used_at > lop_real(lop_leg.t0) + interval '1 minute' and h.used_at < lop_real(lop_leg.t1) - interval '1 minute') then
    fl := jsonb_build_object('k', 'hopp', 'leg', n); end if;
  if coalesce((select pl.game_admin from players pl where pl.id = me), false) then fl := null; end if;
  update lop_runs x set legs = x.legs || jsonb_build_array(jsonb_build_object('t0', lop_leg.t0, 't1', lop_leg.t1, 'p', lop_leg.p, 'pts', lop_leg.pts, 'd', lop_leg.d)),
    flag = coalesce(x.flag, fl) where x.id = r.id;
  if fl is not null then perform cheat_flag(me, 'lop', ov, fl || jsonb_build_object('rid', r.rid, 'vtype', r.vtype)); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lop_end(rid text, st text, how text, t1 double precision, min double precision) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me text := pid(); r lop_runs; n int; nl int; fl jsonb := null; least_ double precision; vc double precision; trx double precision;
  hw text := left(regexp_replace(coalesce(lop_end.how, ''), '[^a-z]', '', 'g'), 12);
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into r from lop_runs x where x.player_id = me and x.rid = lop_end.rid;
  if r.id is null then raise exception 'no attempt'; end if;
  if r.st <> 'run' then return jsonb_build_object('ok', true); end if;   -- (ended before)
  if lop_end.st not in ('done', 'dnf') then raise exception 'bad end'; end if;
  if t1 is null or t1 <> t1 or abs(t1) > 1e9 or min is null or min <> min or min < 0 or min > 1e7 then raise exception 'bad time'; end if;
  if t1 > world_gh() * 60 + 1440 then raise exception 'ahead of the clock'; end if;
  n := jsonb_array_length(r.legs); nl := (select count(*) from lop_legs x where x.course = r.course);
  if lop_end.st = 'done' then
    vc := coalesce((select v.vmax from cheat_vt v where v.vtype = r.vtype), 60); trx := lop_trim(me);
    least_ := (select sum(x.nm / (vc * trx) * 0.9 * 60 + x.task_min) from lop_legs x where x.course = r.course);
    if n <> nl then fl := jsonb_build_object('k', 'legs', 'legs', n);
    elsif abs(t1 - (r.legs -> (n - 1) ->> 't1')::double precision) > 0.5 then fl := jsonb_build_object('k', 'seq', 't1', t1);
    elsif min < least_ - 0.5 then fl := jsonb_build_object('k', 'fast', 'min', round(min::numeric), 'least', round(least_::numeric)); end if;
    if coalesce((select pl.game_admin from players pl where pl.id = me), false) then fl := null; end if;
  end if;
  update lop_runs x set st = lop_end.st, how = hw, t1 = lop_end.t1, min = round(lop_end.min::numeric, 1), week = lop_wk(lop_real(lop_end.t1)),
    done_at = now(), flag = coalesce(x.flag, fl) where x.id = r.id;
  if fl is not null then perform cheat_flag(me, 'lop', greatest(0, round(coalesce(least_, 0) - min))::bigint, fl || jsonb_build_object('rid', r.rid, 'vtype', r.vtype)); end if;
  return jsonb_build_object('ok', true);
end $$;

-- the week's board (wk 'YYYY-Www', this week when left out): per class the best finished time of each account that week, ranked, the
-- top 20, how many, and your place. Never a flagged attempt; a guest and an account out by cheat_on only for themselves
create or replace function public.lop_top(wk text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me text := pid(); w text := case when lop_top.wk ~ '^[0-9]{4}-W[0-9]{2}$' then lop_top.wk else lop_wk(now()) end; g boolean := is_guest(); co boolean := cheat_on();
begin
  if me is null then raise exception 'not signed in'; end if;
  return (
    with l as (select x.* from lop_runs x where x.course = 'lnk' and x.st = 'done' and x.week = w and x.flag is null
                 and (x.player_id = me or (not g and not exists (select 1 from players gp where gp.id = x.player_id and gp.guest)
                      and not (co and exists (select 1 from cheat_flags cf where cf.player_id = x.player_id and cf.cleared_at is null))))),
    b as (select distinct on (l.player_id, l.cls) l.* from l order by l.player_id, l.cls, l.min, l.id),
    r as (select b.*, rank() over (partition by b.cls order by b.min) rk from b),
    c as (select distinct cls from r)
    select jsonb_build_object('wk', w, 'cls', coalesce(jsonb_object_agg(c.cls, jsonb_build_object(
      'rows', (select jsonb_agg(jsonb_build_object('rank', a.rk, 'boat', a.boat, 'type', a.vtype, 'min', round(a.min::numeric),
                 'user', coalesce((select nm.name from names nm where nm.player_id = a.player_id and nm.removed_at is null), ''),
                 'me', a.player_id = me, 'id', left(md5('dsb' || a.player_id), 10)) order by a.rk, a.min)
               from (select * from r r2 where r2.cls = c.cls order by r2.rk, r2.min limit 20) a),
      'n', (select count(*) from r r3 where r3.cls = c.cls),
      'mine', (select jsonb_build_object('rank', r4.rk, 'min', round(r4.min::numeric), 'boat', r4.boat) from r r4 where r4.cls = c.cls and r4.player_id = me))), '{}'::jsonb))
    from c);
end $$;

-- the admin's tab «Kappløp»: the attempts of the last days as sums, never names (who has a mark is in «Juks», admin_cheat_list)
create or replace function public.admin_lop(days int default 28) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare dd int := least(greatest(coalesce(days, 28), 1), 365); since timestamptz := now() - make_interval(days => least(greatest(coalesce(days, 28), 1), 365));
begin
  if not is_admin() then raise exception 'admin only'; end if;
  return (
    with r as (select x.*, exists (select 1 from jsonb_array_elements(x.legs) e where (e -> 'd' ->> 'tr') = '1') trim_on,
                 exists (select 1 from grants h where h.player_id = x.player_id and h.data ->> 'give' = 'hopp' and h.used_at is not null
                           and h.data ->> 'boat' = x.vid and h.used_at between lop_real(x.t0) - interval '6 hours' and lop_real(x.t0)) hop_in
               from lop_runs x where x.at >= since)
    select jsonb_build_object('days', dd,
      'reg', (select count(*) from events e where e.kind = 'lop_start' and e.ts >= since),
      'started', (select count(*) from r), 'run', (select count(*) from r where st = 'run'),
      'done', (select count(*) from r where st = 'done'), 'dnf', (select count(*) from r where st = 'dnf'),
      'why', coalesce((select jsonb_object_agg(coalesce(nullif(how, ''), '?'), k) from (select how, count(*) k from r where st = 'dnf' group by how) a), '{}'::jsonb),
      'cls', coalesce((select jsonb_object_agg(cls, jsonb_build_object('n', k, 'avg', av)) from (select cls, count(*) k, round(avg(min)::numeric) av from r where st = 'done' and flag is null group by cls) a), '{}'::jsonb),
      'trim', (select round(100.0 * count(*) filter (where trim_on) / nullif(count(*) filter (where jsonb_array_length(legs) > 0), 0)) from r),
      'hop', (select round(100.0 * count(*) filter (where hop_in) / nullif(count(*), 0)) from r),
      'flag', (select count(*) from r where flag is not null),
      'flags', coalesce((select jsonb_object_agg(k, c) from (select flag ->> 'k' k, count(*) c from r where flag is not null group by 1) a), '{}'::jsonb),
      'weeks', coalesce((select jsonb_object_agg(week, c) from (select week, count(*) c from r where st = 'done' and flag is null group by week) a), '{}'::jsonb)));
end $$;

-- «Fjern merket» on a race mark puts the account's flagged attempts back on the board (the admin has judged the time sailed); the rest as
-- in 20261110160000_cheat_flags.sql
create or replace function public.admin_cheat_clear(fid bigint) returns boolean
language plpgsql security definer set search_path = public as $$
declare f cheat_flags;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update cheat_flags set cleared_at = now() where id = fid and cleared_at is null returning * into f;
  if f.id is null then return false; end if;
  -- the account starts afresh: the same kroner or the same landings do not write the mark again
  if f.kind = 'cash' then delete from cheat_cash where player_id = f.player_id;
  elsif f.kind = 'land' then delete from cheat_bucket where player_id = f.player_id;
  elsif f.kind = 'lop' then update lop_runs set flag = null where player_id = f.player_id and flag is not null; end if;
  return true;
end $$;

-- Kystposten: the race's stories (KL4 writes them: the leader of each class each day, an attempt finished, the week's result) carry k,
-- the class, the time, the leg, the place and the week; never trim
alter table public.news drop constraint if exists news_kind_check;
alter table public.news add constraint news_kind_check check (kind in ('boat', 'name', 'aground', 'rescue', 'salv', 'foto', 'fish', 'fs', 'ach', 'as', 'tur', 'kvote', 'lag', 'kv', 'sos', 'lop'));

create or replace function public.news_put(kind text, gh double precision, x real, y real, boat text default '', company text default '', d jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); clean jsonb := '{}'::jsonb; k text; v jsonb;
  keys text[] := case news_put.kind
    when 'boat' then array['type', 'nb', 'lic', 'price']
    when 'name' then array['type']
    when 'aground' then array['type']
    when 'rescue' then array['base', 'port', 'type']
    when 'salv' then array['towed', 'port', 'pay', 'val', 'sos']
    when 'foto' then array['fyr', 'lys']
    when 'fish' then array['sp', 'kg']
    when 'fs' then array['y']
    when 'ach' then array['ch']
    when 'as' then array['type']
    when 'tur' then array['k', 'to', 'from', 'sp', 'kg', 'nm']
    when 'kvote' then array['kf', 'type']
    when 'kv' then array['port', 'k']
    when 'sos' then array['k', 'b', 'min']
    when 'lop' then array['k', 'cls', 'min', 'leg', 'rank', 'wk']
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

revoke all on function public.lop_real(double precision), public.lop_wk(timestamptz), public.lop_trim(text) from public, anon, authenticated;
revoke all on function public.lop_start(text, text, text, double precision, text), public.lop_leg(text, int, double precision, double precision, jsonb, jsonb, jsonb),
  public.lop_end(text, text, text, double precision, double precision), public.lop_top(text), public.admin_lop(int),
  public.admin_cheat_clear(bigint), public.news_put(text, double precision, real, real, text, text, jsonb) from public, anon;
grant execute on function public.lop_start(text, text, text, double precision, text), public.lop_leg(text, int, double precision, double precision, jsonb, jsonb, jsonb),
  public.lop_end(text, text, text, double precision, double precision), public.lop_top(text), public.admin_lop(int),
  public.admin_cheat_clear(bigint), public.news_put(text, double precision, real, real, text, text, jsonb) to authenticated;
