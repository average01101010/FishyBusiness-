-- Sponsors and their placements (M6, docs/planer/butikker-og-sponsorer.md 4 and 5; CLAUDE.md: a real name, logo or product comes into the
-- game only with a written agreement, only through these rows, and marked as a partnership). A new agreement is a row here, no deploy.
-- sponsors: the partner (name, kind, logo, site, the agreement's dates and reference); sponsor_placements: where it shows
-- (kind 'item' with target an EQUIP key, 'sign' a place id or region, 'event', 'press', 'look', 'broker', 'gift', 'link'; data: the
-- model's name and what the card says, never numbers that change the game). sp_now() gives what is active now, to anyone (the list is
-- public, as the sources page is); the admin's functions add, change and switch off.
create table if not exists public.sponsors (
  id bigint generated always as identity primary key,
  name text not null check (length(name) between 1 and 60),
  kind text not null default 'founding' check (kind in ('founding', 'vare', 'sted', 'sesong', 'megler')),
  logo_url text check (logo_url is null or logo_url ~ '^https://'),
  site_url text check (site_url is null or site_url ~ '^https://'),
  agreement text not null check (length(agreement) between 3 and 200),   -- where the written agreement is (a reference, never the text)
  from_at timestamptz not null default now(),
  to_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.sponsor_placements (
  id bigint generated always as identity primary key,
  sponsor_id bigint not null references public.sponsors(id) on delete cascade,
  kind text not null check (kind in ('item', 'sign', 'event', 'press', 'look', 'broker', 'gift', 'link')),
  target text not null check (target ~ '^[A-Za-z0-9_:-]{1,40}$'),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and length(data::text) <= 2000),
  from_at timestamptz not null default now(),
  to_at timestamptz,
  active boolean not null default true
);
create index if not exists sponsor_placements_sponsor on public.sponsor_placements (sponsor_id);
alter table public.sponsors enable row level security;
alter table public.sponsor_placements enable row level security;
drop policy if exists admin_read on public.sponsors;
create policy admin_read on public.sponsors for select to authenticated using (public.is_admin());
drop policy if exists admin_read on public.sponsor_placements;
create policy admin_read on public.sponsor_placements for select to authenticated using (public.is_admin());

-- what is active now: the placements with their sponsor's name, logo and site
create or replace function public.sp_now() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'target', p.target, 'data', p.data,
    'sponsor', jsonb_build_object('id', s.id, 'name', s.name, 'logo', s.logo_url, 'site', s.site_url)) order by p.id), '[]'::jsonb)
  from sponsor_placements p join sponsors s on s.id = p.sponsor_id
  where s.active and p.active and s.from_at <= now() and (s.to_at is null or s.to_at > now()) and p.from_at <= now() and (p.to_at is null or p.to_at > now())
$$;
revoke all on function public.sp_now() from public;
grant execute on function public.sp_now() to anon, authenticated;

-- the admin's view: every sponsor with its placements, active or not
create or replace function public.sp_admin_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'kind', s.kind, 'logo', s.logo_url, 'site', s.site_url, 'agreement', s.agreement,
      'from', s.from_at, 'to', s.to_at, 'active', s.active,
      'placements', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'target', p.target, 'data', p.data, 'from', p.from_at, 'to', p.to_at, 'active', p.active) order by p.id)
        from sponsor_placements p where p.sponsor_id = s.id), '[]'::jsonb)) order by s.id) from sponsors s), '[]'::jsonb);
end $$;

-- add a sponsor (no id) or change one; an agreement reference is required
create or replace function public.sp_admin_put(id bigint, name text, kind text, logo text, site text, agreement text, to_at timestamptz default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare r bigint;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if sp_admin_put.id is null then
    insert into sponsors (name, kind, logo_url, site_url, agreement, to_at) values (btrim(sp_admin_put.name), sp_admin_put.kind, nullif(btrim(coalesce(logo, '')), ''), nullif(btrim(coalesce(site, '')), ''), btrim(sp_admin_put.agreement), sp_admin_put.to_at) returning sponsors.id into r;
  else
    update sponsors s set name = btrim(sp_admin_put.name), kind = sp_admin_put.kind, logo_url = nullif(btrim(coalesce(logo, '')), ''), site_url = nullif(btrim(coalesce(site, '')), ''), agreement = btrim(sp_admin_put.agreement), to_at = sp_admin_put.to_at
      where s.id = sp_admin_put.id returning s.id into r;
  end if;
  return r;
end $$;

-- add a placement to a sponsor
create or replace function public.sp_admin_place(sponsor bigint, kind text, target text, data jsonb default '{}'::jsonb, to_at timestamptz default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare r bigint;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  insert into sponsor_placements (sponsor_id, kind, target, data, to_at) values (sponsor, sp_admin_place.kind, sp_admin_place.target, coalesce(sp_admin_place.data, '{}'::jsonb), sp_admin_place.to_at) returning id into r;
  return r;
end $$;

-- switch a sponsor ('s') or a placement ('p') on or off
create or replace function public.sp_admin_on(what text, id bigint, on_ boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if what = 's' then update sponsors s set active = on_ where s.id = sp_admin_on.id;
  elsif what = 'p' then update sponsor_placements p set active = on_ where p.id = sp_admin_on.id;
  else raise exception 'bad what'; end if;
end $$;

revoke all on function public.sp_admin_list(), public.sp_admin_put(bigint, text, text, text, text, text, timestamptz), public.sp_admin_place(bigint, text, text, jsonb, timestamptz), public.sp_admin_on(text, bigint, boolean) from public, anon;
grant execute on function public.sp_admin_list(), public.sp_admin_put(bigint, text, text, text, text, text, timestamptz), public.sp_admin_place(bigint, text, text, jsonb, timestamptz), public.sp_admin_on(text, bigint, boolean) to authenticated;
