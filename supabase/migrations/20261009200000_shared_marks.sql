-- Shared catch marks (Jonas 09.10.2026: «man burde kunne dele fangstmerker med en venn eller fiskarlaget»; ui/10l-share.js). A player
-- shares one of her own catch marks (where, what it gave: kg an hour on the jig, or kg a line, net or pot with the soak, and how good it
-- was against a fair haul) with her friends or with her harbour's fiskarlag. The others see it on the chart for one game day (4 real
-- hours at the game's 6×), with her player name. At most 5 shares in 4 hours. Only numbers go up, never text, so there is nothing to
-- moderate. A guest cannot share. Nothing of the table is open: only the functions read and write it.
create table if not exists public.shared_marks (
  id bigserial primary key,
  from_id text not null references public.players(id) on delete cascade,
  scope text not null check (scope in ('f', 'l')),
  lag text check (lag is null or lag ~ '^[A-Za-z0-9_-]{1,40}$'),
  x real not null, y real not null,
  kgph smallint not null default 0, g text not null default '' check (g in ('', 'line', 'garn', 'teine')),
  kgu real, soak smallint, q real,
  at timestamptz not null default now()
);
create index if not exists shared_marks_at on public.shared_marks (at desc);
create index if not exists shared_marks_from on public.shared_marks (from_id, at desc);
alter table public.shared_marks enable row level security;
revoke all on public.shared_marks from anon, authenticated;

-- share a mark with my friends ('f') or my fiskarlag ('l'): 'ok', 'max' (5 in 4 hours), 'nolag' (not in a club) or 'no'
create or replace function public.mark_share(scope text, x real, y real, kgph int, g text, kgu real, soak int, q real) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); l text;
begin
  if p is null or is_guest() or not exists (select 1 from players where id = p and not guest) then return 'no'; end if;
  if mark_share.scope not in ('f', 'l') then return 'no'; end if;
  if mark_share.x is null or mark_share.y is null or mark_share.x <> mark_share.x or mark_share.y <> mark_share.y or abs(mark_share.x) > 5000 or abs(mark_share.y) > 5000 then return 'no'; end if;
  if coalesce(mark_share.g, '') not in ('', 'line', 'garn', 'teine') then return 'no'; end if;
  if mark_share.scope = 'l' then
    select port into l from lag_members where player_id = p;
    if l is null then return 'nolag'; end if;
  end if;
  if (select count(*) from shared_marks where from_id = p and at > now() - interval '4 hours') >= 5 then return 'max'; end if;
  insert into shared_marks (from_id, scope, lag, x, y, kgph, g, kgu, soak, q)
  values (p, mark_share.scope, l, mark_share.x, mark_share.y, greatest(0, least(coalesce(mark_share.kgph, 0), 5000)), coalesce(mark_share.g, ''),
          case when mark_share.kgu is null then null else greatest(0, least(mark_share.kgu, 1000)) end,
          case when mark_share.soak is null then null else greatest(0, least(mark_share.soak, 500)) end,
          case when mark_share.q is null then null else greatest(0, least(mark_share.q, 20)) end);
  delete from shared_marks where at < now() - interval '1 day';
  return 'ok';
end $$;

-- the marks shared with me in the last 4 hours: by a friend to her friends, or by a member of my fiskarlag to the club; never my own.
-- [{id, from (player name), scope, x, y, kgph, g, kgu, soak, q, age (s)}], newest first, at most 100
create or replace function public.marks_get() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select pid() as p),
       fr as (select case when f.a = (select p from me) then f.b else f.a end as id from friends f where f.a = (select p from me) or f.b = (select p from me)),
       lg as (select port from lag_members where player_id = (select p from me))
  select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'from', coalesce(nm.name, ''), 'scope', m.scope, 'x', m.x, 'y', m.y, 'kgph', m.kgph, 'g', m.g,
           'kgu', m.kgu, 'soak', m.soak, 'q', m.q, 'age', round(extract(epoch from (now() - m.at))::numeric)) order by m.at desc), '[]'::jsonb)
    from (select * from shared_marks s where s.at > now() - interval '4 hours' and s.from_id <> (select p from me)
            and ((s.scope = 'f' and s.from_id in (select id from fr)) or (s.scope = 'l' and s.lag is not null and s.lag = (select port from lg)))
          order by s.at desc limit 100) m
    left join names nm on nm.player_id = m.from_id and nm.removed_at is null
$$;

revoke all on function public.mark_share(text, real, real, int, text, real, int, real), public.marks_get() from public, anon, authenticated;
grant execute on function public.mark_share(text, real, real, int, text, real, int, real), public.marks_get() to authenticated;
