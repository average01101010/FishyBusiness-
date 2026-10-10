-- The leaderboards (05.10.2026; Jonas: «Lag en toppliste for åpen gruppe, der spillere ikke er registrert med rederi, men med
-- båtnavn», «Lag en toppliste for lukket gruppe også, der rederinavn og fartøynavn vil synes for alle», «alle topplistene [skal] være
-- nasjonale lister … Det er snakk om Norges beste båt om du ligger øverst»; ui/05-phone.js, Salgslaget → Toppliste). Each sale now
-- carries the name of the boat that landed it and, in the closed group, the company's name (both empty when the player has turned off
-- «Vis båten min for andre spillere», shown as unknown). world_top(w, grp) ranks the players of the whole coast by what they landed
-- in the open or the closed group in game week w (game hours w·168 to (w+1)·168 on the shared clock, as weekOf in
-- core/06-services.js): the boat's latest name (and the company's in the closed group), the plant they delivered most to, and the
-- kilos, each landing counted at most 10 t in the open group (the largest open-group hold is 6.5 t) and 60 t in the closed, top 20,
-- with the caller's own rank. Only these names and sums go out, never an account. Names lose anything that could make markup in
-- another player's game (here and in pos_put; the game strips the same, core/05-vessels.js peerName).

alter table public.landings add column if not exists boat text not null default '' check (char_length(boat) <= 24);
alter table public.landings add column if not exists company text not null default '' check (char_length(company) <= 40);
create index if not exists landings_closed_gh on public.landings (gh) where acc = 'lukket';
create index if not exists landings_open_gh on public.landings (gh) where acc = 'open';

-- land_put with the boat's name (an old game without it sends none)
drop function if exists public.land_put(double precision, int, text, text, jsonb);
drop function if exists public.land_put(double precision, int, text, text, jsonb, text);
create or replace function public.land_put(gh double precision, y int, port text, acc text, items jsonb, boat text default '', company text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); r jsonb;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 or y is null or y < 2026 or y > 2200 then raise exception 'bad time'; end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) > 24 then raise exception 'bad rows'; end if;
  if (select count(*) from landings where player_id = p and at > now() - interval '1 hour') > 400 then raise exception 'too many'; end if;
  for r in select * from jsonb_array_elements(items) loop
    if coalesce((r ->> 'kg')::real, 0) > 0 then
      insert into landings (player_id, gh, y, port, sp, acc, kg, kgq, boat, company)
        values (p, land_put.gh, land_put.y, left(coalesce(land_put.port, ''), 40), left(coalesce(r ->> 'sp', ''), 16),
                case when land_put.acc in ('open', 'lukket') then land_put.acc else 'none' end,
                least((r ->> 'kg')::real, 100000), least(greatest(coalesce((r ->> 'kgq')::real, 0), 0), 100000),
                left(btrim(regexp_replace(coalesce(land_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24),
                left(btrim(regexp_replace(coalesce(land_put.company, ''), '[<>&"''`\\]', '', 'g')), 40));
    end if;
  end loop;
end $$;

-- pos_put as before (20261005220000_presence.sql), but a boat's name loses anything that could make markup in another player's game
create or replace function public.pos_put(x real, y real, hd real, v real, st text, boat text, vtype text) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if x is null or y is null or x <> x or y <> y or abs(x) > 5000 or abs(y) > 5000 then raise exception 'bad position'; end if;
  insert into presence (player_id, boat, vtype, x, y, hd, v, st, at)
    values (p, left(btrim(regexp_replace(coalesce(pos_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24), left(regexp_replace(coalesce(pos_put.vtype, ''), '[^a-z0-9_]', '', 'g'), 24),
            pos_put.x, pos_put.y, coalesce(pos_put.hd, 0), least(greatest(coalesce(pos_put.v, 0), 0), 60), left(regexp_replace(coalesce(pos_put.st, ''), '[^a-z]', '', 'g'), 16), now())
    on conflict (player_id) do update set boat = excluded.boat, vtype = excluded.vtype, x = excluded.x, y = excluded.y, hd = excluded.hd,
      v = excluded.v, st = excluded.st, at = excluded.at;
end $$;
-- names already stored
update public.presence set boat = regexp_replace(boat, '[<>&"''`\\]', '', 'g') where boat ~ '[<>&"''`\\]';

drop function if exists public.world_top(int);
create or replace function public.world_top(w int, grp text default 'open') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); g text := case when world_top.grp = 'lukket' then 'lukket' else 'open' end; cap real := case when world_top.grp = 'lukket' then 60000 else 10000 end;
begin
  if p is null then raise exception 'not signed in'; end if;
  if w is null or w < 0 or w > 100000 then raise exception 'bad week'; end if;
  return (
    with l as (select * from landings x where x.acc = g and x.gh >= world_top.w * 168.0 and x.gh < (world_top.w + 1) * 168.0),
    t as (select l.player_id, sum(least(l.kg, cap)) kg, (array_agg(l.boat order by l.id desc))[1] boat, (array_agg(l.company order by l.id desc))[1] company from l group by l.player_id),
    pt as (select distinct on (player_id) player_id, port from (select l.player_id, l.port, sum(l.kg) k from l group by l.player_id, l.port) a order by player_id, k desc),
    r as (select t.*, pt.port, rank() over (order by t.kg desc) rk from t left join pt using (player_id))
    select jsonb_build_object(
      'grp', g,
      'rows', coalesce((select jsonb_agg(jsonb_build_object('rank', rk, 'boat', boat, 'company', case when g = 'lukket' then company else '' end, 'port', port, 'kg', round(kg::numeric), 'me', player_id = p) order by rk, kg desc)
                        from (select * from r order by rk limit 20) a), '[]'::jsonb),
      'mine', (select jsonb_build_object('rank', rk, 'kg', round(kg::numeric)) from r where player_id = p),
      'n', (select count(*) from t)));
end $$;

revoke all on function public.land_put(double precision, int, text, text, jsonb, text, text), public.world_top(int, text) from public, anon, authenticated;
grant execute on function public.land_put(double precision, int, text, text, jsonb, text, text), public.world_top(int, text) to authenticated;
