-- The paint shop (06.10.2026; ui/10j-paint.js): a boat's paint goes along with her position, so the other players see her as she is
-- painted. liv is a short code the game writes ('h:kobolt'; later the design, the flag, the registration mark and the logo), kept to
-- letters, digits and a few separators and to 160 characters, and handed on as it is. The old seven-argument pos_put goes: a game that
-- does not send liv still calls this one (liv has a default).
alter table public.presence add column if not exists liv text not null default '';

drop function if exists public.pos_put(real, real, real, real, text, text, text);
create or replace function public.pos_put(x real, y real, hd real, v real, st text, boat text, vtype text, liv text default '') returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if x is null or y is null or x <> x or y <> y or abs(x) > 5000 or abs(y) > 5000 then raise exception 'bad position'; end if;
  insert into presence (player_id, boat, vtype, x, y, hd, v, st, liv, at)
    values (p, left(btrim(regexp_replace(coalesce(pos_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24), left(regexp_replace(coalesce(pos_put.vtype, ''), '[^a-z0-9_]', '', 'g'), 24),
            pos_put.x, pos_put.y, coalesce(pos_put.hd, 0), least(greatest(coalesce(pos_put.v, 0), 0), 60), left(regexp_replace(coalesce(pos_put.st, ''), '[^a-z]', '', 'g'), 16),
            left(regexp_replace(coalesce(pos_put.liv, ''), '[^A-Za-z0-9:;,._=-]', '', 'g'), 160), now())
    on conflict (player_id) do update set boat = excluded.boat, vtype = excluded.vtype, x = excluded.x, y = excluded.y, hd = excluded.hd,
      v = excluded.v, st = excluded.st, liv = excluded.liv, at = excluded.at;
end $$;

create or replace function public.pos_near(x real, y real, r real) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', left(md5('dsb' || q.player_id), 10), 'boat', q.boat, 'vtype', q.vtype, 'x', q.x, 'y', q.y,
           'hd', q.hd, 'v', q.v, 'st', q.st, 'liv', q.liv, 'age', round(extract(epoch from (now() - q.at))::numeric, 1)) order by q.d), '[]'::jsonb)
    from (select pr.*, (pr.x - pos_near.x) ^ 2 + (pr.y - pos_near.y) ^ 2 as d from presence pr
          where pr.player_id is distinct from pid() and pr.at > now() - interval '2 minutes'
            and abs(pr.x - pos_near.x) <= least(greatest(pos_near.r, 1), 80) and abs(pr.y - pos_near.y) <= least(greatest(pos_near.r, 1), 80)
          order by d limit 40) q
$$;

revoke all on function public.pos_put(real, real, real, real, text, text, text, text), public.pos_near(real, real, real) from public, anon;
grant execute on function public.pos_put(real, real, real, real, text, text, text, text), public.pos_near(real, real, real) to authenticated;
