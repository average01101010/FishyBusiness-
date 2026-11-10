-- HS5 (docs/planer/haill-saldo.md, steg 99, 10.11.2026): the kroner and the landings checked on the server, and the cheaters out of
-- the leaderboards. Jonas 10.11.2026: «Spillere skal ikke kunne redigere sin egen lagring og gi seg selv så mye haill eller andre
-- varer de selv vil. Det må fikses.» The money stays in the game (V4 A): the whole economy is computed there, also while the game is
-- closed, so the server cannot compute it. What the server can do is see when a save or a landing cannot be real, and keep it from
-- hurting the others. Nothing is refused and nothing is deleted: the save and the landing are taken as before, and the player is told
-- nothing.
--
--   cheat_flags     one open mark per account and kind ('cash' or 'land'): how much over, how many times, the numbers behind it.
--                   «Fjern merket» sets cleared_at (the account is in again), «La stå» sets kept_at (seen, stays out).
--   cheat_vt        the hold and the price of each vessel type, from VESSELS in core/02-species-gear.js (10.11.2026)
--   cheat_sp        the highest price a species can fetch per kg, from SPECIES (pm, pmF) (10.11.2026)
--   cheat_bucket    what the fleet can still have caught, in holds: fills with one hold per real hour (six game hours), holds 8 at the
--                   start and at most 21 days' worth, so the time a game catches up after days away goes through
--   world_cfg.cheat_on   the switch: off, a mark is only written; on, an open mark keeps the account out of world_top, bygde_top,
--                   ev_top, the fiskarlag's goal (lag_get), «Ukas beste fisker» (push_week) and the open group's sum (world_agg_get).
--                   The account still sees itself. Off until Jonas has seen the numbers (docs/planer/haill-saldo.md, HS5).
--
-- The limits are set from the saves and landings that were in the database 10.11.2026 (38 saves, 100 kept saves, 803 landing rows in
-- 120 calls), so that none of them gets a mark: the largest real rise between two kept saves was 163 959 kr (the slack is 300 000),
-- or 155 343 kr above the highest cash before it (90 pairs of saves, the game's admin account apart); the largest real landing was
-- 1.08 holds of the boat's type for a player and 4.0 for the game's admin account (the bucket starts at 8), and the most in six real
-- hours 6.0 holds for a player and 9.9 for the admin account (8 + 6 = 14).
-- The type and the size of the fleet are the game's word (the save's summary, presence, tm_hello), so the check catches the one who
-- writes in a million, not the one who cheats a little.

create table if not exists public.cheat_flags (
  id bigint generated always as identity primary key,
  player_id text not null references public.players (id) on delete cascade,
  kind text not null check (kind in ('cash', 'land')),
  over bigint not null default 0,          -- kr ('cash') or kg ('land') above what the server can explain; the largest seen
  n integer not null default 1,            -- how many times while the mark was open
  data jsonb not null default '{}'::jsonb, -- the numbers of the latest one
  at timestamptz not null default now(), last_at timestamptz not null default now(),
  cleared_at timestamptz, kept_at timestamptz);
create unique index if not exists cheat_flags_open on public.cheat_flags (player_id, kind) where cleared_at is null;
create index if not exists cheat_flags_at on public.cheat_flags (last_at desc);
create table if not exists public.cheat_vt (vtype text primary key, hold real not null, price bigint not null);
create table if not exists public.cheat_sp (sp text primary key, kr real not null);
create table if not exists public.cheat_bucket (player_id text primary key references public.players (id) on delete cascade, holds real not null, at timestamptz not null default now());
alter table public.cheat_flags enable row level security;
alter table public.cheat_vt enable row level security;
alter table public.cheat_sp enable row level security;
alter table public.cheat_bucket enable row level security;
revoke all on public.cheat_flags, public.cheat_vt, public.cheat_sp, public.cheat_bucket from public, anon, authenticated;

insert into public.cheat_vt (vtype, hold, price) values
  ('skiff', 500, 95000), ('trebat', 500, 45000), ('snekke', 1000, 245000), ('plastsjark', 3500, 850000), ('sjark', 6500, 1150000),
  ('hurtigsjark', 5000, 4900000), ('sjarkny', 7000, 10500000), ('breisjark', 10000, 9000000), ('kyst15', 28000, 18000000),
  ('kyst21', 55000, 9000000), ('snokrabbe', 500000, 60000000), ('autoliner', 400000, 70000000), ('bunntral', 800000, 150000000),
  ('pelagisk', 2000000, 250000000), ('ringnot38', 400000, 95000000)
  on conflict (vtype) do update set hold = excluded.hold, price = excluded.price;
insert into public.cheat_sp (sp, kr) values
  ('torsk', 66.5), ('hyse', 47.8), ('sei', 26.9), ('lyr', 27.9), ('lange', 15.7), ('brosme', 14), ('uer', 19), ('kveite', 100.9),
  ('blakveite', 62), ('krabbe', 610), ('sild', 12.8), ('makrell', 48.2), ('snokrabbe', 110.7)
  on conflict (sp) do update set kr = excluded.kr;

-- the switch lives with the other two
alter table public.world_cfg drop constraint if exists world_cfg_k_check;
alter table public.world_cfg add constraint world_cfg_k_check check (k in ('stock_server', 'share_limit', 'cheat_on'));
insert into public.world_cfg (k, v) values ('cheat_on', 'false'::jsonb) on conflict (k) do nothing;

create or replace function public.cheat_on() returns boolean language sql stable set search_path = public as $$
  select coalesce((select (c.v #>> '{}')::boolean from world_cfg c where c.k = 'cheat_on'), false) $$;
-- is this account out of what the others see? (only inside the definer functions below; a player cannot ask)
create or replace function public.cheat_out(q text) returns boolean language sql stable set search_path = public as $$
  select cheat_on() and exists (select 1 from cheat_flags f where f.player_id = q and f.cleared_at is null) $$;

create or replace function public.cheat_flag(p text, k text, ov bigint, d jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into cheat_flags (player_id, kind, over, data) values (p, k, greatest(ov, 0), coalesce(d, '{}'::jsonb))
    on conflict (player_id, kind) where cleared_at is null
    do update set over = greatest(cheat_flags.over, excluded.over), n = cheat_flags.n + 1, data = excluded.data, last_at = now();
end $$;

-- ---------- the kroner: every save (save_put … save_put4 all end in this update), against the save before ----------
-- The rise in summary.cash from the highest cash the account has had in a save (the one before and the kept ones, so a save taken
-- back from the settings is never a rise) may not be more than 300 000 kr + the landings since the save before at twice the highest
-- price of the species + what the broker and the quota market have paid out + 30 kr per kg of hold and real hour (one hold an hour)
-- + the fleet's value when a boat went (sold or traded in). A fleet that grew counts 5 % of its price as money that must have been
-- there (the least a buyer brings, core/03-simulation.js), so a boat bought with money written in between two saves shows too.
-- The game's admin account (game_admin) has money from the Admin app and is not checked.
create or replace function public.saves_cheat_check() returns trigger language plpgsql security definer set search_path = public as $$
declare c0 bigint; c1 bigint; hi bigint; hrs double precision; cap double precision; land double precision; led bigint; sale bigint := 0; eq bigint := 0;
  t0 text; t1 text; n0 int; n1 int; p0 bigint; p1 bigint; h1 real; pl players; allow double precision; ov bigint;
begin
  c0 := nullif(old.summary ->> 'cash', '')::bigint; c1 := nullif(new.summary ->> 'cash', '')::bigint;
  if c0 is null or c1 is null or new.player_id is distinct from old.player_id then return null; end if;
  select * into pl from players where id = new.player_id;
  if coalesce(pl.game_admin, false) then return null; end if;
  select max(nullif(h.summary ->> 'cash', '')::bigint) into hi from save_hist h where h.player_id = new.player_id;
  c0 := greatest(c0, coalesce(hi, c0));
  t0 := old.summary ->> 'type'; t1 := new.summary ->> 'type';
  n0 := least(greatest(coalesce(nullif(old.summary ->> 'fleet', '')::int, 1), 1), 40); n1 := least(greatest(coalesce(nullif(new.summary ->> 'fleet', '')::int, 1), 1), 40);
  select coalesce((select v.price from cheat_vt v where v.vtype = t0), 0), coalesce((select v.price from cheat_vt v where v.vtype = t1), 0),
         greatest(coalesce((select v.hold from cheat_vt v where v.vtype = t1), 0), 500) into p0, p1, h1;
  if p1 * n1 > p0 * n0 then eq := round((p1 * n1 - p0 * n0) * 0.05); end if;
  if c1 - c0 + eq <= 300000 then return null; end if;
  hrs := least(greatest(extract(epoch from (now() - coalesce(old.updated_at, now()))) / 3600.0, 0), 21 * 24);
  cap := h1 * n1 * 30.0 * hrs;
  select coalesce(sum(l.kg * 2 * coalesce((select s.kr from cheat_sp s where s.sp = l.sp), 150)), 0) into land
    from landings l where l.player_id = new.player_id and l.at > coalesce(old.updated_at, now()) - interval '15 minutes';
  -- a payout is in the game before broker_done says so: every row not yet done, and the ones done since the save before
  select coalesce(sum(g.kr), 0) into led from broker_ledger g where g.player_id = new.player_id and g.kr > 0
     and (g.done_at is null or g.done_at > coalesce(old.updated_at, now()) - interval '15 minutes');
  if n1 < n0 or t1 is distinct from t0 then sale := greatest(coalesce(pl.fleet_value, 0), p0 * n0); end if;
  allow := 300000 + land + led + cap + sale;
  ov := round(c1 - c0 + eq - allow);
  if ov > 0 then
    perform cheat_flag(new.player_id, 'cash', ov, jsonb_build_object('cash0', c0, 'cash1', c1, 'hours', round(hrs::numeric, 2), 'land', round(land), 'ledger', led,
      'cap', round(cap), 'sale', sale, 'equity', eq, 'type0', left(coalesce(t0, ''), 16), 'type1', left(coalesce(t1, ''), 16), 'fleet0', n0, 'fleet1', n1));
  end if;
  return null;
exception when others then return null;   -- a check must never stop a save
end $$;
drop trigger if exists saves_cheat_check on public.saves;
create trigger saves_cheat_check after update of summary on public.saves for each row execute function public.saves_cheat_check();

-- ---------- the landings: what the fleet can have caught, and what the account has said it caught ----------
-- cap is one hold of the fleet: the largest hold the server has heard of for the account (presence.vtype, the save's type; never
-- under 500 kg) times the boats in the save; with more than one boat (their types are not known here) 8.5 kg per 1 000 kr of the
-- fleet's value when that is more (the most hold per krone of any type but the wooden boat). The bucket holds 8 holds at the
-- start and fills with one an hour up to 21 days' worth; a landing above what is in it is marked ('why':'fleet'). And the landings
-- of the last four days (not the last hour: the catches of a landing come up right after it) may not be more than three times the
-- catch the account has reported in those days plus six holds ('why':'catch'). Called by land_put before the rows go in.
create or replace function public.cheat_land(p text, kg double precision) returns void
language plpgsql security definer set search_path = public as $$
declare cap double precision; b cheat_bucket; have double precision; need double precision; lprev double precision; c4 double precision; last_l timestamptz; born timestamptz;
begin
  if kg is null or not (kg > 0) then return; end if;
  select greatest(coalesce((select v.hold from cheat_vt v where v.vtype = pr.vtype), 0), coalesce((select v.hold from cheat_vt v where v.vtype = s.summary ->> 'type'), 0), 500)
           * least(greatest(coalesce(nullif(s.summary ->> 'fleet', '')::int, 1), 1), 40),
         case when coalesce(nullif(s.summary ->> 'fleet', '')::int, 1) > 1 then coalesce(pl.fleet_value, 0) * 0.0085 else 0 end, pl.created_at
    into cap, need, born
    from players pl left join presence pr on pr.player_id = pl.id left join saves s on s.player_id = pl.id where pl.id = p;
  cap := greatest(coalesce(cap, 500), coalesce(need, 0), 500);
  select * into b from cheat_bucket c where c.player_id = p for update;
  if found then have := least(8 + 21 * 24, b.holds + extract(epoch from (now() - b.at)) / 3600.0);
  else
    select max(l.at) into last_l from landings l where l.player_id = p;
    have := 8 + least(21 * 24, greatest(extract(epoch from (now() - coalesce(last_l, born, now()))) / 3600.0, 0));
  end if;
  need := kg / cap;
  if need > have then
    perform cheat_flag(p, 'land', round((need - have) * cap)::bigint, jsonb_build_object('why', 'fleet', 'kg', round(kg), 'hold', round(cap), 'had', round(have::numeric, 2)));
    have := 0;
  else have := have - need; end if;
  insert into cheat_bucket (player_id, holds, at) values (p, have, now()) on conflict (player_id) do update set holds = excluded.holds, at = excluded.at;
  select coalesce(sum(l.kg), 0) into lprev from landings l where l.player_id = p and l.at > now() - interval '4 days' and l.at < now() - interval '1 hour';
  if lprev > 6 * cap then
    select coalesce(sum(c.kg), 0) into c4 from catches c where c.player_id = p and c.at > now() - interval '4 days';
    if lprev > 3 * c4 + 6 * cap then
      perform cheat_flag(p, 'land', round(lprev - 3 * c4 - 6 * cap)::bigint, jsonb_build_object('why', 'catch', 'landed4d', round(lprev), 'caught4d', round(c4), 'hold', round(cap)));
    end if;
  end if;
end $$;

-- land_put as in 20261105130000_guest_world.sql, with the check before the rows (which never stops the landing)
create or replace function public.land_put(gh double precision, y int, port text, acc text, items jsonb, boat text default '', company text default '', ev text default '', reg text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); r jsonb; e text := left(regexp_replace(coalesce(land_put.ev, ''), '[^a-z0-9_]', '', 'g'), 16);
  rg text := case when land_put.reg in ('nord', 'midt', 'vest', 'sor') then land_put.reg else '' end;
  pt text := left(regexp_replace(coalesce(land_put.port, ''), '[^A-Za-z0-9ÆØÅæøå_-]', '', 'g'), 40); yy int; tot double precision;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 then raise exception 'bad time'; end if;
  if gh > world_gh() + 24 then raise exception 'ahead of the clock'; end if;
  -- the game year of the landing, as yearH(gh) in the game: never what the call says
  yy := extract(year from timestamp '2027-03-01 06:00' + make_interval(secs => gh * 3600))::int;
  if yy < 2026 or yy > 2200 then raise exception 'bad time'; end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) > 24 then raise exception 'bad rows'; end if;
  if (select count(*) from landings where player_id = p and at > now() - interval '1 hour') > 400 then raise exception 'too many'; end if;
  begin
    select sum(least((i ->> 'kg')::real, 100000)) into tot from jsonb_array_elements(items) i where coalesce((i ->> 'kg')::real, 0) > 0;
    perform cheat_land(p, tot);
  exception when others then null;   -- a check must never stop a landing
  end;
  for r in select * from jsonb_array_elements(items) loop
    if coalesce((r ->> 'kg')::real, 0) > 0 then
      insert into landings (player_id, gh, y, port, sp, acc, kg, kgq, boat, company, ev, reg)
        values (p, land_put.gh, yy, pt, left(regexp_replace(coalesce(r ->> 'sp', ''), '[^a-z0-9_]', '', 'g'), 16),
                case when land_put.acc in ('open', 'lukket') then land_put.acc else 'none' end,
                least((r ->> 'kg')::real, 100000), least(greatest(coalesce((r ->> 'kgq')::real, 0), 0), 100000),
                left(btrim(regexp_replace(coalesce(land_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24),
                left(btrim(regexp_replace(coalesce(land_put.company, ''), '[<>&"''`\\]', '', 'g')), 40), e, rg);
    end if;
  end loop;
end $$;

-- a guest's mark goes with the landings to the account (guest_merge moves the landings; the guest's row and its marks go)
create or replace function public.cheat_follow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    update cheat_flags set player_id = new.player_id where player_id = old.player_id and cleared_at is null;
  exception when unique_violation then null;   -- the account has an open mark of that kind already
  end;
  return null;
end $$;
drop trigger if exists landings_cheat_follow on public.landings;
create trigger landings_cheat_follow after update of player_id on public.landings for each row
  when (old.player_id is distinct from new.player_id) execute function public.cheat_follow();

-- ---------- the leaderboards and the sums: an account with an open mark is out for the others, and sees itself ----------
-- (each as it was 10.11.2026, read from the database, with one more condition)
create or replace function public.world_top(w int, grp text default 'open') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); g text := case when world_top.grp = 'lukket' then 'lukket' else 'open' end; cap real := case when world_top.grp = 'lukket' then 60000 else 10000 end;
begin
  if p is null then raise exception 'not signed in'; end if;
  if w is null or w < 0 or w > 100000 then raise exception 'bad week'; end if;
  return (
    with l as (select x.* from landings x where x.acc = g and x.gh >= world_top.w * 168.0 and x.gh < (world_top.w + 1) * 168.0
                 and (x.player_id = p or (not exists (select 1 from players gp where gp.id = x.player_id and gp.guest) and not cheat_out(x.player_id)))),
    t as (select l.player_id, sum(least(l.kg, cap)) kg, (array_agg(l.boat order by l.id desc))[1] boat, (array_agg(l.company order by l.id desc))[1] company from l group by l.player_id),
    pt as (select distinct on (player_id) player_id, port from (select l.player_id, l.port, sum(l.kg) k from l group by l.player_id, l.port) a order by player_id, k desc),
    r as (select t.*, pt.port, rank() over (order by t.kg desc) rk from t left join pt using (player_id))
    select jsonb_build_object(
      'grp', g,
      'rows', coalesce((select jsonb_agg(jsonb_build_object('rank', rk, 'boat', boat, 'company', case when g = 'lukket' then company else '' end, 'port', port, 'kg', round(kg::numeric), 'me', player_id = p,
                          'user', coalesce((select nm.name from names nm where nm.player_id = a.player_id and nm.removed_at is null), '')) order by rk, kg desc)
                        from (select * from r order by rk limit 20) a), '[]'::jsonb),
      'mine', (select jsonb_build_object('rank', rk, 'kg', round(kg::numeric)) from r where player_id = p),
      'n', (select count(*) from t)));
end $$;

create or replace function public.bygde_top(w int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if w is null or w < 0 or w > 100000 then raise exception 'bad week'; end if;
  return (
    with l as (select x.* from landings x where x.reg <> '' and x.acc in ('open', 'lukket') and x.gh >= bygde_top.w * 168.0 and x.gh < (bygde_top.w + 1) * 168.0
                 and (x.player_id = p or (not exists (select 1 from players gp where gp.id = x.player_id and gp.guest) and not cheat_out(x.player_id)))),
    pl as (select l.reg, l.port, sum(least(l.kg, 60000)) kg, count(distinct l.player_id) n, coalesce(sum(least(l.kg, 60000)) filter (where l.player_id = p), 0) mykg from l group by l.reg, l.port),
    r as (select pl.*, rank() over (partition by pl.reg order by pl.kg desc) rk from pl)
    select coalesce(jsonb_object_agg(z.reg, z.js), '{}'::jsonb) from (
      select r1.reg, jsonb_build_object(
        'rows', (select jsonb_agg(jsonb_build_object('port', q.port, 'kg', round(q.kg::numeric), 'n', q.n, 'me', q.mykg > 0, 'rank', q.rk) order by q.rk) from (select * from r r2 where r2.reg = r1.reg order by r2.rk limit 10) q),
        'mine', (select jsonb_build_object('port', r3.port, 'kg', round(r3.mykg::numeric), 'rank', r3.rk) from r r3 where r3.reg = r1.reg and r3.mykg > 0 order by r3.mykg desc limit 1),
        'n', (select count(*) from r r4 where r4.reg = r1.reg)) js
      from (select distinct reg from r) r1) z);
end $$;

create or replace function public.ev_top(ev text, y int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); e text := left(regexp_replace(coalesce(ev_top.ev, ''), '[^a-z0-9_]', '', 'g'), 16);
begin
  if p is null then raise exception 'not signed in'; end if;
  if y is null or y < 2026 or y > 2200 or e = '' then raise exception 'bad event'; end if;
  return (
    with l as (select * from landings x where x.ev = e and x.y = ev_top.y and x.acc in ('open', 'lukket')
                 and (x.player_id = p or (not exists (select 1 from players gp where gp.id = x.player_id and gp.guest) and not cheat_out(x.player_id)))),
    t as (select l.player_id, sum(least(l.kg, 60000)) kg, (array_agg(l.boat order by l.id desc))[1] boat from l group by l.player_id),
    pt as (select distinct on (player_id) player_id, port from (select l.player_id, l.port, sum(l.kg) k from l group by l.player_id, l.port) a order by player_id, k desc),
    r as (select t.*, pt.port, rank() over (order by t.kg desc) rk from t left join pt using (player_id)),
    pl as (select l.port, sum(least(l.kg, 60000)) kg from l group by l.port)
    select jsonb_build_object(
      'ev', e, 'y', ev_top.y,
      'kg', coalesce((select round(sum(kg)::numeric) from t), 0),
      'n', (select count(*) from t),
      'rows', coalesce((select jsonb_agg(jsonb_build_object('rank', rk, 'boat', boat, 'port', port, 'kg', round(kg::numeric), 'me', player_id = p) order by rk, kg desc) from (select * from r order by rk limit 50) a), '[]'::jsonb),
      'plants', coalesce((select jsonb_agg(jsonb_build_object('port', port, 'kg', round(kg::numeric)) order by kg desc) from (select * from pl order by kg desc limit 10) b), '[]'::jsonb),
      'mine', (select jsonb_build_object('rank', rk, 'kg', round(kg::numeric)) from r where player_id = p)));
end $$;

-- the fiskarlag: a marked member's kilos are not in the goal or in the list the others see; the member sees the own kilos, but the
-- goal is reached (lag_hits, the story in Kystposten) only on the kilos of the members without a mark
create or replace function public.lag_get(w int, x real default null, y real default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); pt text; mem jsonb; tot numeric := 0; act integer := 0; nmem integer := 0; goal integer; hit lag_hits; ctot numeric := 0; cact integer := 0;
begin
  if p is null then raise exception 'not signed in'; end if;
  select m.port into pt from lag_members m where m.player_id = p;
  if pt is null then return jsonb_build_object('port', null); end if;
  with memb as (select m.player_id from lag_members m join players pl on pl.id = m.player_id where m.port = pt and not pl.guest),
       kg as (select l.player_id, sum(l.kg) as kg from landings l where l.player_id in (select player_id from memb)
                and l.gh >= lag_get.w * 168.0 and l.gh < (lag_get.w + 1) * 168.0 group by l.player_id),
       mm as (select m.player_id, case when bad.b and m.player_id <> p then 0 else coalesce(k.kg, 0) end as kg, case when bad.b then 0 else coalesce(k.kg, 0) end as ckg
                from (select * from memb limit 60) m left join kg k on k.player_id = m.player_id, lateral (select cheat_out(m.player_id) b) bad)
  select count(*), coalesce(sum(m.kg), 0), count(*) filter (where m.kg > 0), coalesce(sum(m.ckg), 0), count(*) filter (where m.ckg > 0),
         coalesce(jsonb_agg(jsonb_build_object('user', coalesce(nm.name, ''), 'kg', round(m.kg::numeric), 'me', m.player_id = p) order by m.kg desc), '[]'::jsonb)
    into nmem, tot, act, ctot, cact, mem
    from mm m left join names nm on nm.player_id = m.player_id and nm.removed_at is null;
  goal := 1500 * greatest(1, act);
  select * into hit from lag_hits h where h.port = pt and h.w = lag_get.w;
  if hit.port is null and ctot >= 1500 * greatest(1, cact) then
    insert into lag_hits (port, w, kg, n) values (pt, lag_get.w, round(ctot), cact) on conflict do nothing;
    select * into hit from lag_hits h where h.port = pt and h.w = lag_get.w;
    if x is not null and y is not null and abs(x) <= 5000 and abs(y) <= 5000 then
      insert into news (player_id, gh, kind, x, y, boat, company, d) values (p, lag_get.w * 168.0 + 167.0, 'lag', x, y, '', '', jsonb_build_object('port', pt, 'kg', round(ctot), 'n', cact));
    end if;
  end if;
  return jsonb_build_object('port', pt, 'n', nmem, 'goal', goal, 'kg', round(tot), 'active', act, 'hit', hit.port is not null,
    'hitAt', case when hit.port is null then null else round(extract(epoch from hit.at))::bigint end, 'members', mem);
end $$;

create or replace function public.push_week(force boolean default false) returns integer
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
      where l.acc = 'open' and l.at > now() - interval '7 days' and not coalesce(pl.guest, false) and not cheat_out(l.player_id) group by l.player_id order by 2 desc limit 1) x;
  select x.boat, x.kg into c from (select (array_agg(l.boat order by l.id desc))[1] boat, sum(least(l.kg, 60000)) kg from landings l join players pl on pl.id = l.player_id
      where l.acc = 'lukket' and l.at > now() - interval '7 days' and not coalesce(pl.guest, false) and not cheat_out(l.player_id) group by l.player_id order by 2 desc limit 1) x;
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
    me := null;
    with l as (select x.player_id, x.acc, x.kg, x.id from landings x join players pl on pl.id = x.player_id
                 where x.at > now() - interval '7 days' and not coalesce(pl.guest, false) and (x.player_id = p or not cheat_out(x.player_id))),
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

-- the open group's sum and the groups' catch: without the marked accounts (the count of boats in the world is as before)
create or replace function public.world_agg_get(yy int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r world_agg;
begin
  select * into r from world_agg a where a.y = yy;
  if found and r.at > now() - interval '1 minute' then return r.d; end if;
  insert into world_agg (y, at, d) values (yy, now(), jsonb_build_object(
    'open', (select coalesce(sum(least(w.kgq, 60000)), 0) from world_year w where w.y = yy and w.acc = 'open' and w.sp = 'torsk' and not cheat_out(w.player_id)),
    'boats', (select count(distinct w.player_id) from world_year w where w.y = yy),
    'open_boats', (select count(distinct w.player_id) from world_year w where w.y = yy and w.acc = 'open' and w.last > now() - interval '90 days' and not cheat_out(w.player_id)),
    'grp', (select coalesce(jsonb_object_agg(k, kg), '{}'::jsonb) from (select w.acc || ':' || w.sp k, round(sum(least(w.kg, 60000))::numeric) kg from world_year w
              where w.y = yy and w.acc in ('open', 'lukket') and w.sp in ('torsk', 'hyse', 'sei') and not cheat_out(w.player_id) group by w.acc, w.sp) g),
    'reg', reg_free_counts()))
  on conflict (y) do update set at = excluded.at, d = excluded.d
  returning d into r.d;
  return r.d;
end $$;

-- ---------- admin: the marks, «Fjern merket», «La stå» and the switch (is_admin() with aal2 only) ----------
create or replace function public.admin_cheat_list(lim int default 200) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  return jsonb_build_object('on', cheat_on(),
    'open', (select count(distinct f.player_id) from cheat_flags f where f.cleared_at is null),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'who', left(md5('dsb' || f.player_id), 10),
        'name', coalesce((select nm.name from names nm where nm.player_id = f.player_id and nm.removed_at is null), ''),
        'boat', coalesce((select pr.boat from presence pr where pr.player_id = f.player_id), ''),
        'guest', coalesce((select pl.guest from players pl where pl.id = f.player_id), false),
        'kind', f.kind, 'over', f.over, 'n', f.n, 'at', f.at, 'last', f.last_at, 'cleared', f.cleared_at, 'kept', f.kept_at, 'data', f.data) order by f.last_at desc)
      from (select * from cheat_flags order by last_at desc limit least(greatest(coalesce(lim, 200), 1), 1000)) f), '[]'::jsonb));
end $$;
create or replace function public.admin_cheat_clear(fid bigint) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update cheat_flags set cleared_at = now() where id = fid and cleared_at is null;
  return found;
end $$;
create or replace function public.admin_cheat_keep(fid bigint) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update cheat_flags set kept_at = now() where id = fid and cleared_at is null;
  return found;
end $$;
create or replace function public.admin_cfg_set(ck text, cv jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  if admin_cfg_set.ck in ('stock_server', 'cheat_on') and jsonb_typeof(admin_cfg_set.cv) <> 'boolean' then raise exception 'bad value'; end if;
  if admin_cfg_set.ck = 'share_limit' and (jsonb_typeof(admin_cfg_set.cv) <> 'number' or (admin_cfg_set.cv #>> '{}')::numeric not between 0 and 1) then raise exception 'bad value'; end if;
  insert into world_cfg (k, v) values (admin_cfg_set.ck, admin_cfg_set.cv) on conflict (k) do update set v = excluded.v;
end $$;

revoke all on function public.cheat_on(), public.cheat_out(text), public.cheat_flag(text, text, bigint, jsonb), public.saves_cheat_check(),
  public.cheat_land(text, double precision), public.cheat_follow(), public.admin_cheat_list(int), public.admin_cheat_clear(bigint),
  public.admin_cheat_keep(bigint) from public, anon, authenticated;
grant execute on function public.admin_cheat_list(int), public.admin_cheat_clear(bigint), public.admin_cheat_keep(bigint) to authenticated;
