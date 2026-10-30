-- Venner (Jonas 09.10.2026: «Man burde kunne legge hverandre til som venn»; ui/10k-friends.js, the Venner app). A player asks another,
-- found by tapping her boat on the chart, in the pub, or by her 6-character friend code; the other accepts or says no. Friends see each
-- other's boat wherever it is, also where it was last seen while the game is closed. Nobody can hide the boat from a friend (Jonas:
-- «Det skal ikke være mulig å slå av posisjon»), but either can end the friendship.
-- Guests cannot have friends. At most 100 friends and 20 requests an hour. The players are known to the game only by the same hashed id
-- as pos_world (left(md5('dsb' || id), 10)) and their player name; nothing of the tables is open, only the functions read and write them.
create table if not exists public.friend_codes (
  player_id text primary key references public.players(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$')
);
alter table public.friend_codes enable row level security;
revoke all on public.friend_codes from anon, authenticated;

-- a friendship once, with the smaller id first
create table if not exists public.friends (
  a text not null references public.players(id) on delete cascade,
  b text not null references public.players(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);
create index if not exists friends_b on public.friends (b);
alter table public.friends enable row level security;
revoke all on public.friends from anon, authenticated;

create table if not exists public.friend_req (
  from_id text not null references public.players(id) on delete cascade,
  to_id text not null references public.players(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (from_id, to_id)
);
create index if not exists friend_req_to on public.friend_req (to_id);
alter table public.friend_req enable row level security;
revoke all on public.friend_req from anon, authenticated;

-- the player behind a hashed id (10 hex, as pos_world gives) or a friend code (6 characters); null for a guest or no one
create or replace function public.friend_who(t text) returns text
language sql stable security definer set search_path = public as $$
  select case when t ~ '^[0-9a-f]{10}$' then (select id from players where left(md5('dsb' || id), 10) = t and not guest limit 1)
              when upper(t) ~ '^[A-HJ-NP-Z2-9]{6}$' then (select c.player_id from friend_codes c join players pl on pl.id = c.player_id where c.code = upper(t) and not pl.guest)
              else null end
$$;

-- my friend code, made the first time
create or replace function public.friend_code() returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); c text; n int := 0;
begin
  if p is null or is_guest() or not exists (select 1 from players where id = p and not guest) then return null; end if;
  select code into c from friend_codes where player_id = p;
  while c is null and n < 20 loop
    c := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6));
    begin insert into friend_codes (player_id, code) values (p, c); exception when unique_violation then c := null; end;
    n := n + 1;
  end loop;
  return c;
end $$;

-- ask a player (hashed id or code): 'ok' (asked), 'friends' (she had asked me, so now we are), 'already', 'full', 'wait' or 'no'
create or replace function public.friend_ask(target text) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); t text;
begin
  if p is null or is_guest() or not exists (select 1 from players where id = p and not guest) then return 'no'; end if;
  t := friend_who(target);
  if t is null or t = p then return 'no'; end if;
  if exists (select 1 from friends where a = least(p, t) and b = greatest(p, t)) then return 'already'; end if;
  if (select count(*) from friends where a = p or b = p) >= 100 then return 'full'; end if;
  if exists (select 1 from friend_req where from_id = t and to_id = p) then
    delete from friend_req where (from_id = t and to_id = p) or (from_id = p and to_id = t);
    insert into friends (a, b) values (least(p, t), greatest(p, t)) on conflict do nothing;
    return 'friends';
  end if;
  if (select count(*) from friend_req where from_id = p and at > now() - interval '1 hour') >= 20 then return 'wait'; end if;
  insert into friend_req (from_id, to_id) values (p, t) on conflict (from_id, to_id) do update set at = now();
  return 'ok';
end $$;

-- answer a request from the hashed id: yes makes us friends, no throws it away
create or replace function public.friend_answer(target text, yes boolean) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); t text;
begin
  if p is null or is_guest() or not exists (select 1 from players where id = p and not guest) then return 'no'; end if;
  t := friend_who(target);
  if t is null or not exists (select 1 from friend_req where from_id = t and to_id = p) then return 'no'; end if;
  delete from friend_req where (from_id = t and to_id = p) or (from_id = p and to_id = t);
  if yes then insert into friends (a, b) values (least(p, t), greatest(p, t)) on conflict do nothing; end if;
  return 'ok';
end $$;

-- end a friendship, or take back a request I sent
create or replace function public.friend_remove(target text) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); t text;
begin
  if p is null then return 'no'; end if;
  t := friend_who(target);
  if t is null then return 'no'; end if;
  delete from friends where a = least(p, t) and b = greatest(p, t);
  delete from friend_req where from_id = p and to_id = t;
  return 'ok';
end $$;

-- my code, my friends with where their boat is or was last (age in seconds since the report, null if never), the requests to me and
-- the ones I have sent: {code, friends:[{id, user, boat, vtype, x, y, hd, st, age}], in:[{id, user, age}], out:[{id, user}]}
create or replace function public.friends_get() returns jsonb
language sql stable security definer set search_path = public as $$
  with me as (select pid() as p),
       fr as (select case when f.a = (select p from me) then f.b else f.a end as id from friends f where f.a = (select p from me) or f.b = (select p from me))
  select jsonb_build_object(
    'code', (select code from friend_codes where player_id = (select p from me)),
    'friends', coalesce((select jsonb_agg(jsonb_build_object('id', left(md5('dsb' || fr.id), 10), 'user', coalesce(nm.name, ''),
        'boat', coalesce(pr.boat, ''), 'vtype', coalesce(pr.vtype, ''), 'x', pr.x, 'y', pr.y, 'hd', pr.hd, 'st', coalesce(pr.st, ''),
        'age', case when pr.at is null then null else round(extract(epoch from (now() - pr.at))::numeric) end) order by pr.at desc nulls last)
      from fr left join presence pr on pr.player_id = fr.id left join names nm on nm.player_id = fr.id and nm.removed_at is null), '[]'::jsonb),
    'in', coalesce((select jsonb_agg(jsonb_build_object('id', left(md5('dsb' || r.from_id), 10), 'user', coalesce(nm.name, ''),
        'age', round(extract(epoch from (now() - r.at))::numeric)) order by r.at desc)
      from (select * from friend_req where to_id = (select p from me) order by at desc limit 30) r left join names nm on nm.player_id = r.from_id and nm.removed_at is null), '[]'::jsonb),
    'out', coalesce((select jsonb_agg(jsonb_build_object('id', left(md5('dsb' || r.to_id), 10), 'user', coalesce(nm.name, '')) order by r.at desc)
      from (select * from friend_req where from_id = (select p from me) order by at desc limit 30) r left join names nm on nm.player_id = r.to_id and nm.removed_at is null), '[]'::jsonb))
$$;

revoke all on function public.friend_who(text) from public, anon, authenticated;
revoke all on function public.friend_code(), public.friend_ask(text), public.friend_answer(text, boolean), public.friend_remove(text), public.friends_get() from public, anon, authenticated;
grant execute on function public.friend_code(), public.friend_ask(text), public.friend_answer(text, boolean), public.friend_remove(text), public.friends_get() to authenticated;
