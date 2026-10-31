-- Tuting and the six phrases at sea (Jonas 09.10.2026: «man burde kunne hilse på andre ved passering ved tuting» and «støtter å kunne dele
-- noen faste fraser»; ui/10n-hail.js). A player sounds the horn at another player's boat within 1 nm, or sends one of six preset lines
-- (k 0 to 5, the text is in the game) to a boat within 5 nm; never free text. Both boats must have reported in the last two minutes, and
-- the server measures the distance between them. The same boat once a minute, at most 60 an hour. The other player fetches what came in
-- the last ten minutes. A guest cannot send. Nothing of the table is open: only the functions read and write it.
create table if not exists public.hails (
  id bigserial primary key,
  from_id text not null references public.players(id) on delete cascade,
  to_id text not null references public.players(id) on delete cascade,
  k smallint not null check (k between -1 and 5),
  at timestamptz not null default now()
);
create index if not exists hails_to on public.hails (to_id, id desc);
create index if not exists hails_from on public.hails (from_id, at desc);
alter table public.hails enable row level security;
revoke all on public.hails from anon, authenticated;

-- the horn (k -1, within 1 nm) or a line (k 0..5, within 5 nm) to the boat with the hashed id: 'ok', 'far', 'wait' or 'no'
create or replace function public.hail_send(target text, k int) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); t text; a presence; b presence; d real;
begin
  if p is null or is_guest() or not exists (select 1 from players where id = p and not guest) then return 'no'; end if;
  if hail_send.k is null or hail_send.k < -1 or hail_send.k > 5 then return 'no'; end if;
  select pl.id into t from players pl where left(md5('dsb' || pl.id), 10) = hail_send.target and not pl.guest limit 1;
  if t is null or t = p then return 'no'; end if;
  select * into a from presence where player_id = p and at > now() - interval '2 minutes';
  select * into b from presence where player_id = t and at > now() - interval '2 minutes';
  if a.player_id is null or b.player_id is null then return 'far'; end if;
  d := sqrt((a.x - b.x) ^ 2 + (a.y - b.y) ^ 2);   -- km
  if d > (case when hail_send.k = -1 then 1.852 else 9.26 end) * 1.1 then return 'far'; end if;
  if exists (select 1 from hails where from_id = p and to_id = t and at > now() - interval '1 minute') then return 'wait'; end if;
  if (select count(*) from hails where from_id = p and at > now() - interval '1 hour') >= 60 then return 'wait'; end if;
  insert into hails (from_id, to_id, k) values (p, t, hail_send.k);
  delete from hails where at < now() - interval '1 day';
  return 'ok';
end $$;

-- what came to me after the id `since` in the last ten minutes, oldest first: [{id, from (player name), fid (hashed id), boat, k, friend, age}]
create or replace function public.hails_get(since bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', h.id, 'from', coalesce(nm.name, ''), 'fid', left(md5('dsb' || h.from_id), 10), 'boat', coalesce(pr.boat, ''), 'k', h.k,
           'friend', exists (select 1 from friends f where f.a = least(h.from_id, h.to_id) and f.b = greatest(h.from_id, h.to_id)),
           'age', round(extract(epoch from (now() - h.at))::numeric)) order by h.id), '[]'::jsonb)
    from (select * from hails where to_id = pid() and id > coalesce(hails_get.since, 0) and at > now() - interval '10 minutes' order by id limit 30) h
    left join names nm on nm.player_id = h.from_id and nm.removed_at is null
    left join presence pr on pr.player_id = h.from_id
$$;

revoke all on function public.hail_send(text, int), public.hails_get(bigint) from public, anon, authenticated;
grant execute on function public.hail_send(text, int), public.hails_get(bigint) to authenticated;
