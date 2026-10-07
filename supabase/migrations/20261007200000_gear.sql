-- Other players' gear in the sea (tilbakemelding #35, 07.10.2026: «Jeg ønsker at man skal kunne se andre spillere sine garn, liner og
-- teiner i havet slik at man ikke setter på tvers av hverandre. Det trenger ikke å stå i kartet hvem som eier utstyret, bare at det vises»).
-- Each game sends the sets it has standing (the two buoys and the kind: garn, line or teine; ui/10h-world.js), written over, when they
-- change and now and then; each game asks for the other players' sets near its boat and draws them in the chart and the buoys in 3D.
-- Nothing of the owner goes out: no id, no name, only the kind and the two buoys. A guest's gear is not given out (as the guest's boat),
-- and a deleted player takes theirs with them. The table has no policy: only the functions read and write it.
create table if not exists public.gear_sets (
  player_id text not null references public.players(id) on delete cascade,
  sid text not null check (char_length(sid) <= 16),
  kind text not null check (kind in ('garn', 'line', 'teine')),
  x1 real not null, y1 real not null, x2 real not null, y2 real not null,
  at timestamptz not null default now(),
  primary key (player_id, sid)
);
create index if not exists gear_sets_xy on public.gear_sets (x1, y1);
alter table public.gear_sets enable row level security;
revoke all on public.gear_sets from anon, authenticated;

-- my sets standing now: [[sid, kind, x1, y1, x2, y2], ...], at most 60, written over what there was
create or replace function public.gear_put(sets jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if sets is null or jsonb_typeof(sets) <> 'array' then raise exception 'bad sets'; end if;
  if jsonb_array_length(sets) > 60 then raise exception 'too many sets'; end if;
  delete from gear_sets where player_id = p;
  insert into gear_sets (player_id, sid, kind, x1, y1, x2, y2, at)
    select p, left(regexp_replace(coalesce(e->>0, ''), '[^A-Za-z0-9_-]', '', 'g'), 16), e->>1, (e->>2)::real, (e->>3)::real, (e->>4)::real, (e->>5)::real, now()
      from jsonb_array_elements(sets) e
     where jsonb_typeof(e) = 'array' and jsonb_array_length(e) = 6 and (e->>1) in ('garn', 'line', 'teine')
       and jsonb_typeof(e->2) = 'number' and jsonb_typeof(e->3) = 'number' and jsonb_typeof(e->4) = 'number' and jsonb_typeof(e->5) = 'number'
       and abs((e->>2)::real) <= 5000 and abs((e->>3)::real) <= 5000 and abs((e->>4)::real) <= 5000 and abs((e->>5)::real) <= 5000
       and char_length(regexp_replace(coalesce(e->>0, ''), '[^A-Za-z0-9_-]', '', 'g')) > 0
    on conflict (player_id, sid) do nothing;
  if is_guest() then update players set guest = true where id = p and not guest; end if;
end $$;

-- the other players' sets within r km of (x, y) (their first buoy), nearest first: [[kind, x1, y1, x2, y2], ...], no guests and
-- nothing of the owner; sets not renewed for fourteen days are left out
create or replace function public.gear_near(x real, y real, r real) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(q.kind, q.x1, q.y1, q.x2, q.y2) order by q.d), '[]'::jsonb)
    from (select g.*, (g.x1 - gear_near.x) ^ 2 + (g.y1 - gear_near.y) ^ 2 as d
          from gear_sets g join players pl on pl.id = g.player_id
          where g.player_id is distinct from pid() and not pl.guest and g.at > now() - interval '14 days'
            and abs(g.x1 - gear_near.x) <= least(greatest(gear_near.r, 1), 60) and abs(g.y1 - gear_near.y) <= least(greatest(gear_near.r, 1), 60)
          order by d limit 300) q
$$;

revoke all on function public.gear_put(jsonb), public.gear_near(real, real, real) from public, anon, authenticated;
grant execute on function public.gear_put(jsonb), public.gear_near(real, real, real) to authenticated;
