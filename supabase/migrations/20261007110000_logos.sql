-- The company logo (Malerverkstedet, 07.10.2026; ui/10j-paint.js): a player's own picture on the hull and on the house flag, seen by
-- everyone near. Jonas: «spillere kan laste opp hva de vil, men la meg eventuelt kunne fjerne det i admin-dashboard om det er støtende,
-- samtidig som jeg gir en forklaring på hvorfor. Spilleren skal dermed kunne velge et nytt bilde gratis.» The picture is small (the
-- game makes it 256 × 256 and at most about 45 kB as text), one per player; a new one replaces it. A logo the admin has taken away is
-- not handed to anyone, and the player is told why (logo_mine) and may upload another at no cost (the purchase is theirs).
create table if not exists public.logos (
  player_id text primary key references public.players(id) on delete cascade,
  img text not null check (char_length(img) <= 60000 and img ~ '^data:image/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$'),
  ver int not null default 1,
  at timestamptz not null default now(),
  removed_at timestamptz,
  reason text check (char_length(reason) <= 300),
  day date not null default current_date,      -- the uploads today, at most 30
  n int not null default 1
);
alter table public.logos enable row level security;
revoke all on public.logos from anon, authenticated;

-- the player puts up their picture (an account that owns the logo; at most 30 a day)
create or replace function public.logo_put(img text) returns int
language plpgsql security definer set search_path = public as $$
declare p text := pid(); v int;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  if not exists (select 1 from entitlements where player_id = p and product_id = 'des_logo') and not is_admin() then raise exception 'not owned'; end if;
  if char_length(logo_put.img) > 60000 or logo_put.img !~ '^data:image/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$' then raise exception 'bad image'; end if;
  if exists (select 1 from logos where player_id = p and day = current_date and n >= 30) then raise exception 'too many'; end if;
  insert into logos (player_id, img) values (p, logo_put.img)
    on conflict (player_id) do update set img = excluded.img, ver = logos.ver + 1, at = now(), removed_at = null, reason = null,
      n = case when logos.day = current_date then logos.n + 1 else 1 end, day = current_date
    returning ver into v;
  return v;
end $$;

-- another player's picture by the id the shared world gives (pos_near's id); nothing once it is taken away
create or replace function public.logo_get(hid text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('img', l.img, 'ver', l.ver) from logos l where left(md5('dsb' || l.player_id), 10) = logo_get.hid and l.removed_at is null limit 1
$$;

-- the player's own: the version, and why it was taken away if it was
create or replace function public.logo_mine() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('ver', l.ver, 'removed', l.removed_at is not null, 'reason', l.reason) from logos l where l.player_id = pid()
$$;

-- the admin: the pictures, newest first, and taking one away with the reason the player will read
create or replace function public.admin_logos(lim int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('who', left(md5('dsb' || l.player_id), 10), 'img', l.img, 'ver', l.ver, 'at', l.at, 'removed', l.removed_at, 'reason', l.reason) order by l.at desc)
    from (select * from logos order by at desc limit least(greatest(coalesce(lim, 100), 1), 500)) l), '[]'::jsonb);
end $$;
create or replace function public.admin_logo_remove(who text, reason text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update logos set removed_at = now(), reason = left(coalesce(admin_logo_remove.reason, ''), 300) where left(md5('dsb' || player_id), 10) = admin_logo_remove.who;
  return found;
end $$;

insert into public.products (id, kind, name_no, name_en, price_nok, data) values
  ('des_logo', 'skin', 'Rederilogo på skroget og i flagget', 'Company logo on the hull and the flag', 49, '{"give":"cos","k":"logo"}')
on conflict (id) do update set kind = excluded.kind, name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, data = excluded.data, active = true;

revoke all on function public.logo_put(text), public.logo_get(text), public.logo_mine(), public.admin_logos(int), public.admin_logo_remove(text, text) from public, anon;
grant execute on function public.logo_put(text), public.logo_get(text), public.logo_mine(), public.admin_logos(int), public.admin_logo_remove(text, text) to authenticated;
