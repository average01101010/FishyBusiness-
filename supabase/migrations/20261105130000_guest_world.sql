-- Ø6 funn 2 og 3 (05.11.2026, docs/planer/sikkerhet-skyen.md; Jonas: «Kjør på funn 2–4»). A guest is an anonymous sign-in that
-- anyone can make again and again, so until now one person could land made-up cod as many guests and close the open group's quota for
-- every player (world_year → world_agg_get → core/03d-quota.js wshOpen), press the prices at a plant (world_get mkt) and empty the
-- grounds (world_get cells). Now what a guest does counts for the guest alone until the account is made:
--   * world_year_add leaves a guest's landings out of the year's sums (the open group's quota, the boats, the groups' catch);
--   * world_get leaves the guests' landings out of the plants' market and their catch out of the cells;
--   * ev_top leaves them out of the season's event list, as world_top, bygde_top and push_week already did (a guest sees its own);
--   * guest_merge brings the guest's landings into world_year for the account when it is made (before, they went with the guest's
--     row, ON DELETE CASCADE, and the account's quota use was missing from the world);
--   * catch_put marks the player as a guest like land_put, pos_put and gear_put do, so a guest that only fishes is known.
-- And for everyone (funn 2c):
--   * land_put takes no landing ahead of the shared clock (world_gh(), with 24 game hours, 4 real hours, to spare; none of the 706
--     landings in the database was ahead), and works the game year out of gh itself (EPOCH 1 March 2027 06:00 UTC, yearH in
--     core/03-simulation.js) instead of trusting the y it is sent; a sale for a year that has not come cannot be sent;
--   * the plant and the species are cleaned to [A-Za-z0-9ÆØÅæøå_-] and [a-z0-9_] (every one in the database already is; the plants in
--     Østfold have Ø in their ids, mottak.json ØF50, ØF55, ØF56, so the plant keeps ÆØÅ).
-- The per-player caps stay as they were: 60 t of the open group's cod a player and year (world_agg_get), 10 t open and 60 t closed
-- a landing on the leaderboards. A registered account can still send made-up landings: what is left is in sikkerhet-skyen.md.

create or replace function public.world_year_add() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- a guest's landing is the guest's alone until the account is made (guest_merge brings it in then)
  if is_guest() or exists (select 1 from players pl where pl.id = new.player_id and pl.guest) then return null; end if;
  insert into world_year (y, acc, sp, player_id, kg, kgq, last) values (new.y, new.acc, new.sp, new.player_id, new.kg, new.kgq, new.at)
    on conflict (y, acc, sp, player_id) do update set kg = world_year.kg + excluded.kg, kgq = world_year.kgq + excluded.kgq, last = greatest(world_year.last, excluded.last);
  return null;
end $$;

-- the guests' landings that were already counted come out of the year's sums (world_agg_get works them out again within a minute)
delete from world_year w using players pl where pl.id = w.player_id and pl.guest;

create or replace function public.land_put(gh double precision, y integer, port text, acc text, items jsonb, boat text default '', company text default '', ev text default '', reg text default '')
returns void language plpgsql security definer set search_path = public as $$
declare p text := pid(); r jsonb; e text := left(regexp_replace(coalesce(land_put.ev, ''), '[^a-z0-9_]', '', 'g'), 16);
  rg text := case when land_put.reg in ('nord', 'midt', 'vest', 'sor') then land_put.reg else '' end;
  pt text := left(regexp_replace(coalesce(land_put.port, ''), '[^A-Za-z0-9ÆØÅæøå_-]', '', 'g'), 40); yy int;
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

create or replace function public.catch_put(gh double precision, cells jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 then raise exception 'bad time'; end if;
  if jsonb_typeof(cells) is distinct from 'array' or jsonb_array_length(cells) > 600 then raise exception 'bad cells'; end if;
  if (select count(*) from catches where player_id = p and at > now() - interval '1 hour') > 6000 then raise exception 'too many'; end if;
  if is_guest() then update players set guest = true where id = p and not guest; end if;
  insert into catches (player_id, gh, cell, kg)
    select p, catch_put.gh, (c ->> 0)::bigint, least((c ->> 1)::real, 50000) from jsonb_array_elements(cells) c
     where jsonb_typeof(c) = 'array' and (c ->> 1)::real > 0;
  delete from catches where at < now() - interval '4 days';
end $$;

create or replace function public.world_get(since bigint, y integer, gh double precision) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); g double precision := coalesce(world_get.gh, 0); on_ boolean; A jsonb; mine jsonb; myopen double precision; me boolean;
begin
  if p is null then raise exception 'not signed in'; end if;
  if g <> g or abs(g) > 1e7 then raise exception 'bad time'; end if;
  if world_get.y is null or world_get.y < 2026 or world_get.y > 2200 then raise exception 'bad year'; end if;
  on_ := coalesce((select (v #>> '{}')::boolean from world_cfg where k = 'stock_server'), false);
  A := world_agg_get(world_get.y);
  select coalesce(jsonb_object_agg(w.acc || ':' || w.sp, round(least(w.kg, 60000)::numeric)), '{}'::jsonb), coalesce(sum(least(w.kgq, 60000)) filter (where w.acc = 'open' and w.sp = 'torsk'), 0), count(*) > 0
    into mine, myopen, me from world_year w where w.y = world_get.y and w.player_id = p;
  return jsonb_build_object(
    'open', round(greatest(0, (A ->> 'open')::double precision - myopen)::numeric, 1),
    'boats', greatest(0, (A ->> 'boats')::int - case when me then 1 else 0 end),
    'open_boats', (A ->> 'open_boats')::int,
    'reg', A -> 'reg',
    'grp', (select coalesce(jsonb_object_agg(e.key, greatest(0, e.value::numeric - coalesce((mine ->> e.key)::numeric, 0))), '{}'::jsonb) from jsonb_each_text(A -> 'grp') e),
    'stock', case when on_ then (select coalesce(jsonb_agg(jsonb_build_array(s.sp, s.y, s.ssb, s.tac, s.adv)), '[]'::jsonb) from world_stock s) else null end,
    'mkt', (select coalesce(jsonb_agg(jsonb_build_array(port, sp, round(k::numeric, 1))), '[]'::jsonb) from (
              select port, sp, sum(k) k from (
                select l.port, l.sp, least(sum(l.kg * power(0.97, least(greatest(g - l.gh, 0), 400))), 40000) k from landings l
                 where l.at > now() - interval '1 day' and l.player_id <> p
                   and not exists (select 1 from players gp where gp.id = l.player_id and gp.guest)
                 group by l.port, l.sp, l.player_id) a
               group by port, sp having sum(k) >= 1) b),
    'cells', (select coalesce(jsonb_agg(jsonb_build_array(cell, round(k::numeric, 1))), '[]'::jsonb) from (
               select cell, sum(k) k from (
                 select c.cell, least(sum(c.kg * power(0.996, least(greatest(g - c.gh, 0), 2000))), 5000) k from catches c
                  where c.id > coalesce(world_get.since, 0) and c.at > now() - interval '3 days' and c.player_id <> p
                    and not exists (select 1 from players gp where gp.id = c.player_id and gp.guest)
                  group by c.cell, c.player_id) a
                group by cell having sum(k) >= 0.5 order by sum(k) desc limit 4000) b),
    'cur', (select coalesce(max(id), 0) from catches));
end $$;

create or replace function public.ev_top(ev text, y integer) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); e text := left(regexp_replace(coalesce(ev_top.ev, ''), '[^a-z0-9_]', '', 'g'), 16);
begin
  if p is null then raise exception 'not signed in'; end if;
  if y is null or y < 2026 or y > 2200 or e = '' then raise exception 'bad event'; end if;
  return (
    with l as (select * from landings x where x.ev = e and x.y = ev_top.y and x.acc in ('open', 'lukket')
                 and (x.player_id = p or not exists (select 1 from players gp where gp.id = x.player_id and gp.guest))),
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

create or replace function public.guest_merge(code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); g text; gp players; moved boolean := false;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  select guest_id into g from guest_links l where l.code = guest_merge.code and l.created_at > now() - interval '7 days';
  if g is null then return jsonb_build_object('merged', false); end if;
  delete from guest_links where guest_id = g;
  if g = p then return jsonb_build_object('merged', false); end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do update set last_seen = now();
  select * into gp from players where id = g;
  update players set consent = gp.consent, consent_at = gp.consent_at, birth_year = gp.birth_year where id = p and consent is null and gp.consent is not null;
  if not exists (select 1 from saves where player_id = p) then update saves set player_id = p where player_id = g; moved := found; end if;
  delete from saves where player_id = g;
  update save_hist set player_id = p where player_id = g;
  update sessions set player_id = p where player_id = g;
  update events set player_id = p where player_id = g;
  update errors set player_id = p where player_id = g;
  update feedback set player_id = p where player_id = g;
  update feedback_media set player_id = p where player_id = g;
  -- the guest's landings were the guest's alone (world_year_add): with the account they count in the shared world
  delete from world_year where player_id = g;
  insert into world_year (y, acc, sp, player_id, kg, kgq, last)
    select l.y, l.acc, l.sp, p, sum(l.kg), sum(l.kgq), max(l.at) from landings l where l.player_id = g group by l.y, l.acc, l.sp
    on conflict (y, acc, sp, player_id) do update set kg = world_year.kg + excluded.kg, kgq = world_year.kgq + excluded.kgq, last = greatest(world_year.last, excluded.last);
  update landings set player_id = p where player_id = g;
  update catches set player_id = p where player_id = g;
  update push_subs set player_id = p where player_id = g;
  update push_queue set player_id = p where player_id = g;
  update grants set player_id = p where player_id = g;
  delete from presence where player_id = g;
  delete from players where id = g;
  return jsonb_build_object('merged', true, 'save', moved);
end $$;
