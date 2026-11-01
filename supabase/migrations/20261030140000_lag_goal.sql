-- The fiskarlag's week, shared (30.10.2026; docs/planer/oppdrag-2.md F1; Jonas: «dette med fiskarlag må vi satse fullt ut på»). The goal
-- was counted in each player's own game (ui/09c-pubsoc.js: 1 500 kg for each member who has landed, the prize 3 000 kr a member,
-- Jonas 08.10.2026). Now the server counts it, the same for everyone, remembers the week it was reached (lag_hits) and writes the story
-- in Kystposten once (news kind 'lag': the harbour, the kilos and the boats, no names). A member may leave any time, but a switch to
-- another club waits until the game week is over (F-C), so nobody jumps to a club that is nearly there.
alter table public.lag_members add column if not exists w integer;
create table if not exists public.lag_hits (
  port text not null check (port ~ '^[A-Za-z0-9_-]{1,40}$'),
  w integer not null,
  at timestamptz not null default now(),
  kg integer not null default 0,
  n integer not null default 0,
  primary key (port, w)
);
alter table public.lag_hits enable row level security;
revoke all on public.lag_hits from anon, authenticated;
alter table public.news drop constraint if exists news_kind_check;
alter table public.news add constraint news_kind_check check (kind in ('boat', 'name', 'aground', 'rescue', 'salv', 'foto', 'fish', 'fs', 'ach', 'as', 'tur', 'kvote', 'lag'));

-- join the harbour's fiskarlag in game week w (leaving the one before): 'ok', 'wait' when the club was changed this week already, 'no'
drop function if exists public.lag_join(text);
create or replace function public.lag_join(port text, w integer default null) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur lag_members;
begin
  if p is null or is_guest() then return 'no'; end if;
  if lag_join.port is null then delete from lag_members where player_id = p; return 'ok'; end if;
  if lag_join.port !~ '^[A-Za-z0-9_-]{1,40}$' then return 'no'; end if;
  select * into cur from lag_members where player_id = p;
  if cur.player_id is not null and cur.port <> lag_join.port and lag_join.w is not null and cur.w is not null and cur.w = lag_join.w then return 'wait'; end if;
  insert into lag_members (player_id, port, w) values (p, lag_join.port, lag_join.w)
    on conflict (player_id) do update set port = excluded.port, at = now(), w = coalesce(excluded.w, lag_members.w);
  return 'ok';
end $$;

-- my fiskarlag in game week w: {port, n, goal, kg, active, hit, hitAt, members:[{user, kg, me}]}, or {port:null}. The goal is 1 500 kg
-- for each member who has landed this week (at least one). The first call that sees the goal reached writes it down and puts the story
-- in Kystposten at the harbour's place (x, y from the game), once per club and week.
drop function if exists public.lag_get(int);
create or replace function public.lag_get(w integer, x real default null, y real default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); pt text; mem jsonb; tot numeric := 0; act integer := 0; nmem integer := 0; goal integer; hit lag_hits;
begin
  if p is null then raise exception 'not signed in'; end if;
  select m.port into pt from lag_members m where m.player_id = p;
  if pt is null then return jsonb_build_object('port', null); end if;
  with memb as (select m.player_id from lag_members m join players pl on pl.id = m.player_id where m.port = pt and not pl.guest),
       kg as (select l.player_id, sum(l.kg) as kg from landings l where l.player_id in (select player_id from memb)
                and l.gh >= lag_get.w * 168.0 and l.gh < (lag_get.w + 1) * 168.0 group by l.player_id)
  select count(*), coalesce(sum(k.kg), 0), count(*) filter (where coalesce(k.kg, 0) > 0),
         coalesce(jsonb_agg(jsonb_build_object('user', coalesce(nm.name, ''), 'kg', round(coalesce(k.kg, 0)::numeric), 'me', m.player_id = p) order by coalesce(k.kg, 0) desc), '[]'::jsonb)
    into nmem, tot, act, mem
    from (select * from memb limit 60) m left join kg k on k.player_id = m.player_id left join names nm on nm.player_id = m.player_id and nm.removed_at is null;
  goal := 1500 * greatest(1, act);
  select * into hit from lag_hits h where h.port = pt and h.w = lag_get.w;
  if hit.port is null and tot >= goal then
    insert into lag_hits (port, w, kg, n) values (pt, lag_get.w, round(tot), act) on conflict do nothing;
    select * into hit from lag_hits h where h.port = pt and h.w = lag_get.w;
    if x is not null and y is not null and abs(x) <= 5000 and abs(y) <= 5000 then
      insert into news (player_id, gh, kind, x, y, boat, company, d) values (p, lag_get.w * 168.0 + 167.0, 'lag', x, y, '', '', jsonb_build_object('port', pt, 'kg', round(tot), 'n', act));
    end if;
  end if;
  return jsonb_build_object('port', pt, 'n', nmem, 'goal', goal, 'kg', round(tot), 'active', act, 'hit', hit.port is not null,
    'hitAt', case when hit.port is null then null else round(extract(epoch from hit.at))::bigint end, 'members', mem);
end $$;
revoke all on function public.lag_join(text, integer), public.lag_get(integer, real, real) from public, anon, authenticated;
grant execute on function public.lag_join(text, integer), public.lag_get(integer, real, real) to authenticated;
