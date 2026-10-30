-- The seasons as shared events (30.10.2026; docs/forslag.md A2 «Lofotfisket og årshjulet», ordered by Jonas 30.10.2026 as point 7 of
-- docs/research/oppdrag-gap-analyse.md): Lofotfisket (20.1–10.4, Vestfjorden and Lofoten), Finnmarksfisket (25.4–15.6), Seisommeren
-- (10.6–31.8, the whole coast) and Krabbehøsten (1.9–30.11, east of 26° E). Everything landed inside the event's area in its days counts
-- on one board for everyone: per boat, per plant and in all. Nobody has to win; having been part of it is what gives the badge.
-- The events, their days and their areas are the game's own (core/09c-seasons.js EVENTS, the same for everyone on the shared clock);
-- the game marks each landing with the event it falls in (ev, from the plant's position), and this board sums them. A landing's event
-- is as trusted as its kilos: the save lives in the player's browser, and the server sees it rather than stops it (as 20261017120000).
alter table public.landings add column if not exists ev text not null default '' check (char_length(ev) <= 16);
create index if not exists landings_ev on public.landings (ev, y) where ev <> '';

-- land_put with the landing's event (an old game without it sends none)
drop function if exists public.land_put(double precision, int, text, text, jsonb, text, text);
create or replace function public.land_put(gh double precision, y int, port text, acc text, items jsonb, boat text default '', company text default '', ev text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); r jsonb; e text := left(regexp_replace(coalesce(land_put.ev, ''), '[^a-z0-9_]', '', 'g'), 16);
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 or y is null or y < 2026 or y > 2200 then raise exception 'bad time'; end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) > 24 then raise exception 'bad rows'; end if;
  if (select count(*) from landings where player_id = p and at > now() - interval '1 hour') > 400 then raise exception 'too many'; end if;
  for r in select * from jsonb_array_elements(items) loop
    if coalesce((r ->> 'kg')::real, 0) > 0 then
      insert into landings (player_id, gh, y, port, sp, acc, kg, kgq, boat, company, ev)
        values (p, land_put.gh, land_put.y, left(coalesce(land_put.port, ''), 40), left(coalesce(r ->> 'sp', ''), 16),
                case when land_put.acc in ('open', 'lukket') then land_put.acc else 'none' end,
                least((r ->> 'kg')::real, 100000), least(greatest(coalesce((r ->> 'kgq')::real, 0), 0), 100000),
                left(btrim(regexp_replace(coalesce(land_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24),
                left(btrim(regexp_replace(coalesce(land_put.company, ''), '[<>&"''`\\]', '', 'g')), 40), e);
    end if;
  end loop;
end $$;

-- the event's board: the boats (top 50, each landing counted at most 60 t), the plants (top 10), the total, and the caller's own place
create or replace function public.ev_top(ev text, y int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); e text := left(regexp_replace(coalesce(ev_top.ev, ''), '[^a-z0-9_]', '', 'g'), 16);
begin
  if p is null then raise exception 'not signed in'; end if;
  if y is null or y < 2026 or y > 2200 or e = '' then raise exception 'bad event'; end if;
  return (
    with l as (select * from landings x where x.ev = e and x.y = ev_top.y and x.acc in ('open', 'lukket')),
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

revoke all on function public.land_put(double precision, int, text, text, jsonb, text, text, text), public.ev_top(text, int) from public, anon, authenticated;
grant execute on function public.land_put(double precision, int, text, text, jsonb, text, text, text), public.ev_top(text, int) to authenticated;
