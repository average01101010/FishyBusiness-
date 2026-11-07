-- The pub's social side (Jonas 08.10.2026: «Har du eventuelle forslag til flere ting spillerne skal kunne gjøre i puben? Kanskje noe som blir
-- et sosialt element»; ui/09c-pubsoc.js). Two things go through the cloud:
--  * greetings between the players in the same harbour tonight: a few preset lines only (k is the line's number, the game has the text),
--    never free text (players from 13 years). A guest cannot send. At most 30 an hour, and the same player once in five minutes.
--  * the fiskarlag: one club per harbour (its id is the harbour's id in the game, so there are no names to write), joined in its pub.
--    lag_get gives the members' player names and what each landed in the game week (the landings already shared for the leaderboard),
--    so the week's shared goal is counted from the members who fished; one who stays away takes nothing from the others.
-- Nothing of the tables is open: only the functions read and write them.
create table if not exists public.pub_greets (
  id bigserial primary key,
  from_id text not null references public.players(id) on delete cascade,
  to_id text not null references public.players(id) on delete cascade,
  k smallint not null check (k between 0 and 15),
  port text not null default '' check (char_length(port) <= 40),
  at timestamptz not null default now()
);
create index if not exists pub_greets_to on public.pub_greets (to_id, at desc);
create index if not exists pub_greets_from on public.pub_greets (from_id, at desc);
alter table public.pub_greets enable row level security;
revoke all on public.pub_greets from anon, authenticated;

create table if not exists public.lag_members (
  player_id text primary key references public.players(id) on delete cascade,
  port text not null check (port ~ '^[A-Za-z0-9_-]{1,40}$'),
  at timestamptz not null default now()
);
create index if not exists lag_members_port on public.lag_members (port);
alter table public.lag_members enable row level security;
revoke all on public.lag_members from anon, authenticated;

-- a greeting to a player in the harbour (to: the id the boats come with from pos_world, k: the line), 'ok', 'wait' or 'no'
create or replace function public.pub_greet(target text, k int, port text) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); t text;
begin
  if p is null or is_guest() then return 'no'; end if;
  if pub_greet.k < 0 or pub_greet.k > 15 then return 'no'; end if;
  select pr.player_id into t from presence pr join players pl on pl.id = pr.player_id
   where left(md5('dsb' || pr.player_id), 10) = pub_greet.target and not pl.guest and pr.at > now() - interval '10 minutes' limit 1;
  if t is null or t = p then return 'no'; end if;
  if (select count(*) from pub_greets where from_id = p and at > now() - interval '1 hour') >= 30 then return 'wait'; end if;
  if exists (select 1 from pub_greets where from_id = p and to_id = t and at > now() - interval '5 minutes') then return 'wait'; end if;
  insert into pub_greets (from_id, to_id, k, port) values (p, t, pub_greet.k, left(coalesce(pub_greet.port, ''), 40));
  delete from pub_greets where at < now() - interval '2 days';
  return 'ok';
end $$;

-- the greetings to me in the last three hours, newest first: [{from (player name), id (as pos_world), k, port, age (s)}]
create or replace function public.pub_greets_get() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('from', coalesce(nm.name, ''), 'id', left(md5('dsb' || g.from_id), 10), 'k', g.k, 'port', g.port,
           'age', round(extract(epoch from (now() - g.at))::numeric)) order by g.at desc), '[]'::jsonb)
    from (select * from pub_greets where to_id = pid() and at > now() - interval '3 hours' order by at desc limit 20) g
    left join names nm on nm.player_id = g.from_id and nm.removed_at is null
$$;

-- join the harbour's fiskarlag (leaving the one before), or leave with port null
create or replace function public.lag_join(port text) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null or is_guest() then return 'no'; end if;
  if lag_join.port is null then delete from lag_members where player_id = p; return 'ok'; end if;
  if lag_join.port !~ '^[A-Za-z0-9_-]{1,40}$' then return 'no'; end if;
  insert into lag_members (player_id, port) values (p, lag_join.port) on conflict (player_id) do update set port = excluded.port, at = now();
  return 'ok';
end $$;

-- my fiskarlag in game week w: {port, members:[{user, kg, me}]} (the members with a name or landings first), or {port:null}
create or replace function public.lag_get(w int) returns jsonb
language sql stable security definer set search_path = public as $$
  with mine as (select port from lag_members where player_id = pid()),
       mem as (select m.player_id, m.port from lag_members m join players pl on pl.id = m.player_id where m.port = (select port from mine) and not pl.guest),
       kg as (select l.player_id, sum(l.kg) as kg from landings l where l.player_id in (select player_id from mem)
                and l.gh >= lag_get.w * 168.0 and l.gh < (lag_get.w + 1) * 168.0 group by l.player_id)
  select case when (select port from mine) is null then jsonb_build_object('port', null)
    else jsonb_build_object('port', (select port from mine), 'n', (select count(*) from mem), 'members', coalesce((
      select jsonb_agg(jsonb_build_object('user', coalesce(nm.name, ''), 'kg', round(coalesce(k.kg, 0)::numeric), 'me', m.player_id = pid()) order by coalesce(k.kg, 0) desc)
        from (select * from mem limit 60) m left join kg k on k.player_id = m.player_id left join names nm on nm.player_id = m.player_id and nm.removed_at is null), '[]'::jsonb)) end
$$;

revoke all on function public.pub_greet(text, int, text), public.pub_greets_get(), public.lag_join(text), public.lag_get(int) from public, anon, authenticated;
grant execute on function public.pub_greet(text, int, text), public.pub_greets_get(), public.lag_join(text), public.lag_get(int) to authenticated;
