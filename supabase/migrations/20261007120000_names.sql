-- The player's name (Jonas 07.10.2026; ui/10f-cloud.js): chosen when registering, together with naming the boat, optional. It is shown
-- to the other players beside the boat (the AIS card), so it is unique (case does not matter), short and plain. The admin can take an
-- offensive one away with a reason the player reads in the game; that name cannot be had again, and choosing a new one costs nothing.
create table if not exists public.names (
  player_id text primary key references public.players(id) on delete cascade,
  name text not null check (name ~ '^[A-Za-zÆØÅæøå0-9_.-]{3,20}$'),
  at timestamptz not null default now(),
  removed_at timestamptz,
  reason text check (char_length(reason) <= 300)
);
create unique index if not exists names_lower on public.names (lower(name));
create table if not exists public.names_banned (name text primary key, at timestamptz not null default now());
alter table public.names enable row level security;
alter table public.names_banned enable row level security;
revoke all on public.names, public.names_banned from anon, authenticated;

-- is a name free (a guest may ask, so the letter can say it before registering)
create or replace function public.name_free(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select name_free.name ~ '^[A-Za-zÆØÅæøå0-9_.-]{3,20}$'
    and not exists (select 1 from names n where lower(n.name) = lower(name_free.name) and n.player_id is distinct from pid())
    and not exists (select 1 from names_banned b where b.name = lower(name_free.name))
$$;

-- take a name (an account, not a guest): 'ok', 'taken' or 'bad'
create or replace function public.name_claim(name text) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  if name_claim.name !~ '^[A-Za-zÆØÅæøå0-9_.-]{3,20}$' then return 'bad'; end if;
  if exists (select 1 from names_banned b where b.name = lower(name_claim.name)) then return 'taken'; end if;
  if exists (select 1 from names n where lower(n.name) = lower(name_claim.name) and n.player_id <> p) then return 'taken'; end if;
  insert into names (player_id, name) values (p, name_claim.name)
    on conflict (player_id) do update set name = excluded.name, at = now(), removed_at = null, reason = null;
  return 'ok';
exception when unique_violation then return 'taken';
end $$;

-- the player's own: the name, and why it was taken away if it was
create or replace function public.name_mine() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', n.name, 'removed', n.removed_at is not null, 'reason', n.reason) from names n where n.player_id = pid()
$$;

-- the admin: the names, newest first, and taking one away with the reason the player will read (the name is barred for good)
create or replace function public.admin_names(lim int default 200) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('who', left(md5('dsb' || n.player_id), 10), 'name', n.name, 'at', n.at, 'removed', n.removed_at, 'reason', n.reason) order by n.at desc)
    from (select * from names order by at desc limit least(greatest(coalesce(lim, 200), 1), 1000)) n), '[]'::jsonb);
end $$;
create or replace function public.admin_name_remove(who text, reason text) returns boolean
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update names set removed_at = now(), reason = left(coalesce(admin_name_remove.reason, ''), 300) where left(md5('dsb' || player_id), 10) = admin_name_remove.who returning name into nm;
  if nm is null then return false; end if;
  insert into names_banned (name) values (lower(nm)) on conflict do nothing;
  return true;
end $$;

revoke all on function public.name_free(text), public.name_claim(text), public.name_mine(), public.admin_names(int), public.admin_name_remove(text, text) from public, anon;
grant execute on function public.name_free(text), public.name_claim(text), public.name_mine(), public.admin_names(int), public.admin_name_remove(text, text) to authenticated;
