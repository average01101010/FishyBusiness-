-- Bygdekampen, the village contest (31.10.2026; docs/planer/oppdrag-2.md F3; ui/06d-season-folk.js bygdeCard, core/09h-press.js pressBygde).
-- Which plant got most landed this game week, in each of four parts of the coast (core/03e-rules.js landsdel: nord, midt, vest, sor, sent
-- by the game with each landing). No prize: the honour, the Sesong app's card and Kystposten on Sunday evening.
alter table public.landings add column if not exists reg text not null default '' check (reg in ('', 'nord', 'midt', 'vest', 'sor'));

drop function if exists public.land_put(double precision, int, text, text, jsonb, text, text, text);   -- the overload without reg (the call would be ambiguous)
create or replace function public.land_put(gh double precision, y int, port text, acc text, items jsonb, boat text default '', company text default '', ev text default '', reg text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); r jsonb; e text := left(regexp_replace(coalesce(land_put.ev, ''), '[^a-z0-9_]', '', 'g'), 16);
  rg text := case when land_put.reg in ('nord', 'midt', 'vest', 'sor') then land_put.reg else '' end;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if gh is null or gh <> gh or abs(gh) > 1e7 or y is null or y < 2026 or y > 2200 then raise exception 'bad time'; end if;
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) > 24 then raise exception 'bad rows'; end if;
  if (select count(*) from landings where player_id = p and at > now() - interval '1 hour') > 400 then raise exception 'too many'; end if;
  for r in select * from jsonb_array_elements(items) loop
    if coalesce((r ->> 'kg')::real, 0) > 0 then
      insert into landings (player_id, gh, y, port, sp, acc, kg, kgq, boat, company, ev, reg)
        values (p, land_put.gh, land_put.y, left(coalesce(land_put.port, ''), 40), left(coalesce(r ->> 'sp', ''), 16),
                case when land_put.acc in ('open', 'lukket') then land_put.acc else 'none' end,
                least((r ->> 'kg')::real, 100000), least(greatest(coalesce((r ->> 'kgq')::real, 0), 0), 100000),
                left(btrim(regexp_replace(coalesce(land_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24),
                left(btrim(regexp_replace(coalesce(land_put.company, ''), '[<>&"''`\\]', '', 'g')), 40), e, rg);
    end if;
  end loop;
end $$;
revoke all on function public.land_put(double precision, int, text, text, jsonb, text, text, text, text) from public, anon;
grant execute on function public.land_put(double precision, int, text, text, jsonb, text, text, text, text) to authenticated;

-- the contest's board for game week w: for each part of the coast the plants ranked by what was landed to them (each landing counted at
-- most 60 t, guests' landings aside), the boats that landed there, and the caller's own plant (where they landed most) with its place
create or replace function public.bygde_top(w integer) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if w is null or w < 0 or w > 100000 then raise exception 'bad week'; end if;
  return (
    with l as (select x.* from landings x where x.reg <> '' and x.acc in ('open', 'lukket') and x.gh >= bygde_top.w * 168.0 and x.gh < (bygde_top.w + 1) * 168.0
                 and (x.player_id = p or not exists (select 1 from players gp where gp.id = x.player_id and gp.guest))),
    pl as (select l.reg, l.port, sum(least(l.kg, 60000)) kg, count(distinct l.player_id) n, coalesce(sum(least(l.kg, 60000)) filter (where l.player_id = p), 0) mykg from l group by l.reg, l.port),
    r as (select pl.*, rank() over (partition by pl.reg order by pl.kg desc) rk from pl)
    select coalesce(jsonb_object_agg(z.reg, z.js), '{}'::jsonb) from (
      select r1.reg, jsonb_build_object(
        'rows', (select jsonb_agg(jsonb_build_object('port', q.port, 'kg', round(q.kg::numeric), 'n', q.n, 'me', q.mykg > 0, 'rank', q.rk) order by q.rk) from (select * from r r2 where r2.reg = r1.reg order by r2.rk limit 10) q),
        'mine', (select jsonb_build_object('port', r3.port, 'kg', round(r3.mykg::numeric), 'rank', r3.rk) from r r3 where r3.reg = r1.reg and r3.mykg > 0 order by r3.mykg desc limit 1),
        'n', (select count(*) from r r4 where r4.reg = r1.reg)) js
      from (select distinct reg from r) r1) z);
end $$;
revoke all on function public.bygde_top(integer) from public, anon, authenticated;
grant execute on function public.bygde_top(integer) to authenticated;
