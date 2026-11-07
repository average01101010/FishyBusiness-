-- Towing between players (Jonas 09.10.2026: «man burde kunne slepe andre og belønnes for det», the reward «Kanskje 25000?»; ui/10o-ptow.js).
-- A player whose boat has broken down asks for a tow at her place. Players within 30 nm see the ask; the first to take it sails there,
-- makes the line fast within 200 m (the server measures it between the two boats' reports) and tows her to a harbour. When the helper
-- moors, the tow is done: the towed boat lies in that harbour, and the helper is paid by the game (not by the other player) when the
-- server allows it: at most one paid tow of the same player a day and three paid tows a day, so two friends cannot farm it. An ask
-- nobody takes in 20 minutes, or a helper who has not come in 20 minutes, is left to the rescue boat (the game calls it). A guest can
-- neither ask nor help. Nothing of the table is open: only the functions read and write it.
create table if not exists public.tows (
  id bigserial primary key,
  needer text not null references public.players(id) on delete cascade,
  helper text references public.players(id) on delete set null,
  x real not null, y real not null,
  st text not null default 'ask' check (st in ('ask', 'come', 'tow', 'done', 'cancel')),
  port text check (port is null or port ~ '^[A-Za-z0-9_-]{1,40}$'),
  paid boolean not null default false,
  at timestamptz not null default now(),
  upd timestamptz not null default now()
);
create index if not exists tows_open on public.tows (st, at desc);
create index if not exists tows_needer on public.tows (needer, id desc);
create index if not exists tows_helper on public.tows (helper, id desc);
alter table public.tows enable row level security;
revoke all on public.tows from anon, authenticated;

create or replace function public.tow_player_ok() returns text
language sql stable security definer set search_path = public as $$
  select case when pid() is null or is_guest() or not exists (select 1 from players where id = pid() and not guest) then null else pid() end
$$;

-- ask for a tow where the boat lies: the tow's id (an earlier open ask of mine is cancelled), or null
create or replace function public.tow_ask(x real, y real) returns bigint
language plpgsql security definer set search_path = public as $$
declare p text := tow_player_ok(); i bigint;
begin
  if p is null or tow_ask.x is null or tow_ask.y is null or abs(tow_ask.x) > 5000 or abs(tow_ask.y) > 5000 then return null; end if;
  update tows set st = 'cancel', upd = now() where needer = p and st in ('ask', 'come', 'tow');
  insert into tows (needer, x, y) values (p, tow_ask.x, tow_ask.y) returning id into i;
  delete from tows where upd < now() - interval '2 days';
  return i;
end $$;

-- the open asks within r km of (x, y) that are not mine, nearest first: [{id, user, boat, x, y, age}]
create or replace function public.tow_open(x real, y real, r real) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'user', coalesce(nm.name, ''), 'boat', coalesce(pr.boat, ''), 'x', t.x, 'y', t.y,
           'age', round(extract(epoch from (now() - t.at))::numeric)) order by (t.x - tow_open.x) ^ 2 + (t.y - tow_open.y) ^ 2), '[]'::jsonb)
    from tows t left join names nm on nm.player_id = t.needer and nm.removed_at is null left join presence pr on pr.player_id = t.needer
   where t.st = 'ask' and t.needer is distinct from pid() and t.at > now() - interval '20 minutes'
     and (t.x - tow_open.x) ^ 2 + (t.y - tow_open.y) ^ 2 <= least(greatest(tow_open.r, 1), 60) ^ 2
$$;

-- take an ask: 'ok', 'taken' or 'no'
create or replace function public.tow_take(id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare p text := tow_player_ok(); n int;
begin
  if p is null then return 'no'; end if;
  if exists (select 1 from tows where helper = p and st in ('come', 'tow')) then return 'no'; end if;
  update tows set helper = p, st = 'come', upd = now() where tows.id = tow_take.id and st = 'ask' and needer <> p and at > now() - interval '20 minutes';
  get diagnostics n = row_count;
  return case when n = 1 then 'ok' else 'taken' end;
end $$;

-- make the line fast, the two boats within 200 m by their reports of the last two minutes: 'ok', 'far' or 'no'
create or replace function public.tow_hook(id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare p text := tow_player_ok(); t tows; a presence; b presence;
begin
  if p is null then return 'no'; end if;
  select * into t from tows where tows.id = tow_hook.id and helper = p and st = 'come';
  if t.id is null then return 'no'; end if;
  select * into a from presence where player_id = p and at > now() - interval '2 minutes';
  select * into b from presence where player_id = t.needer and at > now() - interval '2 minutes';
  if a.player_id is null then return 'far'; end if;
  -- the towed boat may have gone quiet (her game closed): then the place she asked from counts
  if sqrt((a.x - coalesce(b.x, t.x)) ^ 2 + (a.y - coalesce(b.y, t.y)) ^ 2) > 0.2 then return 'far'; end if;
  update tows set st = 'tow', upd = now() where tows.id = t.id;
  return 'ok';
end $$;

-- the helper has moored in a harbour: the tow is done there; {ok, pay} (pay: the game pays the helper)
create or replace function public.tow_done(id bigint, port text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := tow_player_ok(); t tows; pay boolean;
begin
  if p is null or tow_done.port is null or tow_done.port !~ '^[A-Za-z0-9_-]{1,40}$' then return jsonb_build_object('ok', false); end if;
  select * into t from tows where tows.id = tow_done.id and helper = p and st = 'tow';
  if t.id is null then return jsonb_build_object('ok', false); end if;
  pay := not exists (select 1 from tows where helper = p and needer = t.needer and paid and upd > now() - interval '1 day')
     and (select count(*) from tows where helper = p and paid and upd > now() - interval '1 day') < 3;
  update tows set st = 'done', port = tow_done.port, paid = pay, upd = now() where tows.id = t.id;
  return jsonb_build_object('ok', true, 'pay', pay);
end $$;

-- give up: the needer cancels her ask; a helper hands it back to the others
create or replace function public.tow_cancel(id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare p text := tow_player_ok();
begin
  if p is null then return 'no'; end if;
  update tows set st = 'cancel', upd = now() where tows.id = tow_cancel.id and needer = p and st in ('ask', 'come', 'tow');
  update tows set st = 'ask', helper = null, upd = now() where tows.id = tow_cancel.id and helper = p and st in ('come', 'tow');
  return 'ok';
end $$;

-- my tow, as the one towed (the newest of the last day) or as the helper: {id, role, st, port, other:{user, boat, x, y, hd, v, age}, age, upd}
create or replace function public.tow_mine() returns jsonb
language sql stable security definer set search_path = public as $$
  with t as (select * from tows where (needer = pid() or (helper = pid() and st in ('come', 'tow'))) and upd > now() - interval '1 day' order by id desc limit 1),
       o as (select case when t.needer = pid() then t.helper else t.needer end as oid from t)
  select case when not exists (select 1 from t) then null else jsonb_build_object(
    'id', t.id, 'role', case when t.needer = pid() then 'needer' else 'helper' end, 'st', t.st, 'port', t.port, 'x', t.x, 'y', t.y,
    'age', round(extract(epoch from (now() - t.at))::numeric), 'upd', round(extract(epoch from (now() - t.upd))::numeric),
    'other', (select jsonb_build_object('user', coalesce(nm.name, ''), 'boat', coalesce(pr.boat, ''), 'x', pr.x, 'y', pr.y, 'hd', pr.hd, 'v', pr.v,
                'age', round(extract(epoch from (now() - pr.at))::numeric)) from o left join presence pr on pr.player_id = o.oid
                left join names nm on nm.player_id = o.oid and nm.removed_at is null where o.oid is not null)) end
  from t
$$;

revoke all on function public.tow_player_ok() from public, anon, authenticated;
revoke all on function public.tow_ask(real, real), public.tow_open(real, real, real), public.tow_take(bigint), public.tow_hook(bigint), public.tow_done(bigint, text), public.tow_cancel(bigint), public.tow_mine() from public, anon, authenticated;
grant execute on function public.tow_ask(real, real), public.tow_open(real, real, real), public.tow_take(bigint), public.tow_hook(bigint), public.tow_done(bigint, text), public.tow_cancel(bigint), public.tow_mine() to authenticated;
