-- Guests (06.10.2026; Jonas: a new player meets the envelope and the first trip without signing in, and is asked to register in
-- «fiskermanntallet» after the third landing). A guest is a Supabase anonymous sign-in: the token's sub is a uuid and its claim
-- is_anonymous is true, so pid() is the guest's id like any player's, and the guest is in the shared world like everyone else.
-- Registering is a WorkOS sign-in. Before it the game asks guest_claim() for a one-time code (as the guest), keeps it on the device,
-- and after the sign-in calls guest_merge(code) (as the account): everything the guest had moves to the account, and the guest is gone.
-- The anonymous auth user itself is left to Supabase (it has nothing in it); the admin (aal2, admins) can never be a guest.

create or replace function public.is_guest() returns boolean language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

create table if not exists public.guest_links (
  code text primary key,
  guest_id text not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.guest_links enable row level security;   -- no policy: only the functions below touch it
revoke all on public.guest_links from anon, authenticated;

-- the guest asks for a code to take along to the sign-in (one at a time; it lasts a week)
create or replace function public.guest_claim() returns text language plpgsql security definer set search_path = public as $$
declare p text := pid(); c text;
begin
  if p is null or not is_guest() then raise exception 'not a guest'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  delete from guest_links where guest_id = p or created_at < now() - interval '7 days';
  c := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into guest_links (code, guest_id) values (c, p);
  return c;
end $$;

-- the account takes over what the guest had. The save: the account's own stays if it has one (the game then sees both and lets
-- the player choose, cloudSync), else the guest's moves. The rest moves as it is; the consent goes along if the account has none.
create or replace function public.guest_merge(code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare p text := pid(); g text; gp players; moved boolean := false;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  select guest_id into g from guest_links l where l.code = guest_merge.code and l.created_at > now() - interval '7 days';
  if g is null then return jsonb_build_object('merged', false); end if;
  delete from guest_links where guest_id = g;
  if g = p then return jsonb_build_object('merged', false); end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do update set last_seen = now();
  select * into gp from players where id = g;
  update players set consent = gp.consent, consent_at = gp.consent_at, birth_year = gp.birth_year where id = p and consent is null and gp.consent is not null;
  if not exists (select 1 from saves where player_id = p) then update saves set player_id = p where player_id = g; moved := found; end if;
  delete from saves where player_id = g;
  update save_hist set player_id = p where player_id = g;
  update sessions set player_id = p where player_id = g;
  update events set player_id = p where player_id = g;
  update errors set player_id = p where player_id = g;
  update feedback set player_id = p where player_id = g;
  update feedback_media set player_id = p where player_id = g;
  update landings set player_id = p where player_id = g;
  update catches set player_id = p where player_id = g;
  update push_subs set player_id = p where player_id = g;
  update push_queue set player_id = p where player_id = g;
  update grants set player_id = p where player_id = g;
  delete from presence where player_id = g;
  delete from players where id = g;
  return jsonb_build_object('merged', true, 'save', moved);
end $$;

-- real money only on an account: a purchase must be tied to someone who can sign in again (the receipt, the grants on other devices)
create or replace function public.shop_quote(product text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); r products;
begin
  if p is null then raise exception 'not signed in'; end if;
  if is_guest() then raise exception 'guest'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  select * into r from products where id = shop_quote.product and active;
  if r.id is null then raise exception 'no such product'; end if;
  if (select count(*) from purchases where player_id = p and created_at > now() - interval '1 hour') >= 30 then raise exception 'too many'; end if;
  return jsonb_build_object('pid', p, 'id', r.id, 'name_no', r.name_no, 'name_en', r.name_en, 'price_nok', r.price_nok, 'data', r.data);
end $$;

revoke all on function public.is_guest(), public.guest_claim(), public.guest_merge(text) from public;
grant execute on function public.is_guest(), public.guest_claim(), public.guest_merge(text) to authenticated;
