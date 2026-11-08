-- Kvotemarkedet on the server (KM2 of docs/planer/kvotemarkedet.md, 08.11.2026; Jonas 07.11.2026: «V1, a», «V2, a», «V3, a», «V4, anbefalt»,
-- «V5, a»). Rights (hjemler) and structure quotas between players, quota factors and never kilos (V1 A), in one national market (V5 A),
-- in the same auction house as the boats (B, 20261107140000_broker.sql): one table of listings, one set of bids with the money bound,
-- one settlement every minute and one inbox (broker_ledger). Only game money; nothing here touches real money.
--
--   listings.kind   'boat' (B, as before), 'right' or 'struct'; item is the good as the game packs it (kmPack in core/03i-kvotemarked.js):
--                   {kind:'right', id, hl, flen, st, landY, used, y} or {kind:'struct', id, hl, kf, from, until, used, y}, rebuilt here from
--                   the fields it may have, so nothing about who travels with it. A quota listing has no type, no vessel and no yard
--                   (one national market: no distance)
--   quota_ref       the quota lengths the game sells (HJ in core/03d-quota.js) with their quota factors (J-187-2026 § 18), the 2026
--                   quota unit per group (§ 16, REG26.unit) and 260 kr/kg (KPK): the takst the value is held against
--   km_put          put a right or a structure quota out: B's limits (start from 40 %, buy-now up to 160 %, 1, 6, 24 or 72 hours, three
--                   open listings a player shared with the boats, guests neither sell nor bid), and the value the game gives (kmTakst)
--                   inside a band around the takst here (0.3–2.5 times: the later years' unit follows the stock, and KM5 lets the
--                   kr/kg move 0.7–1.4), the same trust B has in vesselValue
--   the settlement  broker_sold gives the buyer the good in the ledger ('right' or 'struct', data.item) and the seller the price less 5 %
--                   ('paid'); a right's place in the register (reg_held) moves from the seller to the buyer; a structure quota is no
--                   place in the register. Unsold and cancelled go 'back' as for the boats. The register sells as today (V3 A): reg_take
--                   and reg_free unchanged, no limit a week
--   broker_ledger.lk  the kind of the listing a row belongs to (set by a trigger). broker_pending(km) hands the quota rows only to a game
--                   that asks for them (KM3), so a game from before KM3 never marks a right it cannot apply as done
--   listings_get    with kind: 'boat' (the default, as before), 'right', 'struct' or 'km' (both); the sold ones per kind
--   km_wish         «Ønsket hjemmel»: a quota length (or any), the kind (or both) and a top price; told by push when one is put out, once
--                   in twelve hours at most (docs/push-plan.md), as «Ønsket båt» (broker_tell). Its own table, so a player can wish for
--                   a boat and a right at the same time
--   admin_km        the admin's line: listings and sales a week per kind and quota length, the median price and the price against the
--                   takst; never who

create table if not exists public.quota_ref (
  id text primary key references public.reg_rights(id),
  grp text not null check (grp in ('u11', 'g11', 'g15', 'g21')),
  hl text not null check (char_length(hl) <= 20),
  kf double precision not null check (kf > 0 and kf < 100),
  unit double precision not null check (unit > 0 and unit < 100),
  kr_kg double precision not null default 260 check (kr_kg > 0 and kr_kg < 10000)
);
insert into public.quota_ref (id, grp, hl, kf, unit) values
  ('u7', 'u11', 'under 7 m', 1.2623, 8.4172), ('h7', 'u11', '7–7,9 m', 1.4918, 8.4172), ('h8', 'u11', '8–8,9 m', 1.7734, 8.4172),
  ('h9', 'u11', '9–9,9 m', 2.1698, 8.4172), ('h10', 'u11', '10–10,9 m', 2.3471, 8.4172), ('h14', 'g11', '14–14,9 m', 5.2289, 7.2662),
  ('h20', 'g15', '20–20,9 m', 10.2540, 6.9986)
on conflict (id) do update set grp = excluded.grp, hl = excluded.hl, kf = excluded.kf, unit = excluded.unit;   -- (kr_kg is KM5's to move)
alter table public.quota_ref enable row level security;
revoke all on public.quota_ref from anon, authenticated;

alter table public.listings add column if not exists kind text not null default 'boat';
alter table public.listings add column if not exists item jsonb;
alter table public.listings add column if not exists ref_kr bigint;
alter table public.listings alter column type drop not null;
alter table public.listings alter column x drop not null;
alter table public.listings alter column y drop not null;
alter table public.listings alter column vessel set default '{}'::jsonb;
do $$ begin
  alter table public.listings add constraint listings_kind_check check (kind in ('boat', 'right', 'struct')
    and (kind = 'boat') = (type is not null) and (kind = 'boat' or (item is not null and octet_length(item::text) <= 4000)));
exception when duplicate_object then null;
end $$;
create index if not exists listings_kind_open on public.listings (kind, until) where state = 'open';
create index if not exists listings_kind_sold on public.listings (kind, settled_at desc) where state = 'sold';

alter table public.broker_ledger drop constraint if exists broker_ledger_kind_check;
alter table public.broker_ledger add constraint broker_ledger_kind_check check (kind in ('bid', 'release', 'buy', 'paid', 'boat', 'back', 'right', 'struct'));
alter table public.broker_ledger add column if not exists lk text not null default 'boat' check (lk in ('boat', 'right', 'struct'));
create or replace function public.broker_ledger_lk() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.listing is not null then new.lk := coalesce((select l.kind from listings l where l.id = new.listing), 'boat'); end if;
  return new;
end $$;
drop trigger if exists broker_ledger_lk on public.broker_ledger;
create trigger broker_ledger_lk before insert on public.broker_ledger for each row execute function public.broker_ledger_lk();

create table if not exists public.km_wish (
  player_id text primary key references public.players(id) on delete cascade,
  rid text references public.quota_ref(id),
  kind text check (kind in ('right', 'struct')),
  max_kr bigint not null check (max_kr > 0),
  at timestamptz not null default now(),
  told_at timestamptz
);
alter table public.km_wish enable row level security;
revoke all on public.km_wish from anon, authenticated;

-- the game year on the shared clock (yearH of world_gh(), as land_put works it out): the server's, never what a call says
create or replace function public.km_year() returns int
language sql stable set search_path = public as $$
  select extract(year from timestamp '2027-03-01 06:00' + make_interval(secs => world_gh() * 3600))::int
$$;
-- a number in a JSON value within [lo, hi], or null
create or replace function public.km_num(j jsonb, lo numeric, hi numeric) returns numeric
language sql immutable set search_path = public as $$
  select case when jsonb_typeof(j) = 'number' and (j #>> '{}')::numeric between lo and hi then (j #>> '{}')::numeric end
$$;
-- the good, rebuilt from the fields it may have (anything else, a name or a player, stays out); 'bad item' when it is not one. A
-- structure quota is only in the groups from 11 m (kvoteforskriften § 9) and in the right's own group, at most the right's factor
-- less 10 % (§ 11, STRUCT.cut), at most 20 years; what a right carries within the cap (§ 12, STRUCT.cap: 5 times in all for 11–14.99 m,
-- 6 from 15 m, so 4 and 5 times its own on top). y is the game year it was packed in: the shared clock's, or the one before or after
-- (a game a little behind or ahead at the new year)
create or replace function public.km_item(item jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare k text; r quota_ref; q quota_ref; s jsonb; st jsonb := '[]'::jsonb; ex numeric := 0; y numeric; fr numeric; un numeric; kf numeric; fl numeric;
        ly numeric; u jsonb; used jsonb := null;
begin
  if jsonb_typeof(item) is distinct from 'object' or octet_length(item::text) > 4000 then raise exception 'bad item'; end if;
  k := item->>'kind'; select * into r from quota_ref where id = item->>'id';
  if r.id is null or k is null or k not in ('right', 'struct') then raise exception 'bad item'; end if;
  y := km_num(item->'y', km_year() - 1, km_year() + 1); if y is null or y <> trunc(y) then raise exception 'bad item'; end if;
  u := item->'used';
  if jsonb_typeof(u) = 'object' then
    used := jsonb_build_object('torsk', coalesce(km_num(u->'torsk', 0, 1e7), 0), 'hyse', coalesce(km_num(u->'hyse', 0, 1e7), 0), 'sei', coalesce(km_num(u->'sei', 0, 1e7), 0));
  elsif u is not null and jsonb_typeof(u) <> 'null' then raise exception 'bad item'; end if;
  if k = 'struct' then
    kf := km_num(item->'kf', 0, r.kf::numeric * 0.9 + 0.0001); fr := km_num(item->'from', 2000, 2300); un := km_num(item->'until', 2000, 2300);
    if r.grp = 'u11' or kf is null or kf <= 0 or fr is null or un is null or un <= fr or un - fr > 20 or fr <> trunc(fr) or un <> trunc(un) then raise exception 'bad item'; end if;
    return jsonb_build_object('kind', 'struct', 'id', r.id, 'hl', r.hl, 'kf', kf, 'from', fr, 'until', un, 'used', used, 'y', y);
  end if;
  fl := coalesce(km_num(item->'flen', 0, 60), case when item->'flen' is null or jsonb_typeof(item->'flen') = 'null' then 0 end);
  if fl is null then raise exception 'bad item'; end if;
  ly := km_num(item->'landY', 2000, 2300);
  if item->'landY' is not null and jsonb_typeof(item->'landY') <> 'null' and ly is null then raise exception 'bad item'; end if;
  if item->'st' is not null and jsonb_typeof(item->'st') not in ('array', 'null') then raise exception 'bad item'; end if;
  if jsonb_typeof(item->'st') = 'array' then
    if jsonb_array_length(item->'st') > 20 or (jsonb_array_length(item->'st') > 0 and r.grp = 'u11') then raise exception 'bad item'; end if;
    for s in select * from jsonb_array_elements(item->'st') loop
      select * into q from quota_ref where id = s->>'id';
      kf := km_num(s->'kf', 0, coalesce(q.kf, 0)::numeric * 0.9 + 0.0001); fr := km_num(s->'from', 2000, 2300); un := km_num(s->'until', 2000, 2300);
      if q.id is null or q.grp <> r.grp or kf is null or kf <= 0 or fr is null or un is null or un <= fr or un - fr > 20 or fr <> trunc(fr) or un <> trunc(un) then raise exception 'bad item'; end if;
      ex := ex + kf; st := st || jsonb_build_array(jsonb_build_object('id', q.id, 'kf', kf, 'from', fr, 'until', un));
    end loop;
    if ex > (case when r.grp = 'g11' then 4 else 5 end) * r.kf + 0.0001 then raise exception 'bad item'; end if;
  end if;
  return jsonb_build_object('kind', 'right', 'id', r.id, 'hl', r.hl, 'flen', fl, 'st', st, 'landY', ly, 'used', used, 'y', y);
end $$;
-- the takst of a good (a clean one, from km_item) at the 2026 unit and kr_kg: a right is its factor times the unit times kr_kg, with
-- its structure quotas; a structure quota the same for its factor times the years left over 20 (linear, as kmTakst). The game counts
-- the years left from the day in the year, and its year may be the shared clock's or one off (km_item), so the band takes them from a
-- year less than the later of the two (lo) to the whole of the earlier (hi). {kr, lo, hi}
create or replace function public.km_band(item jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r quota_ref; q quota_ref; s jsonb; y0 numeric := least((item->>'y')::numeric, km_year()); y1 numeric := greatest((item->>'y')::numeric, km_year());
        hi double precision := 0; lo double precision := 0;
begin
  select * into r from quota_ref where id = item->>'id'; if r.id is null then return null; end if;
  if item->>'kind' = 'right' then
    hi := r.kf * r.unit * 1000 * r.kr_kg; lo := hi;
    for s in select * from jsonb_array_elements(coalesce(item->'st', '[]'::jsonb)) loop
      select * into q from quota_ref where id = s->>'id';
      hi := hi + (s->>'kf')::double precision * q.unit * 1000 * q.kr_kg * least(20, greatest(0, (s->>'until')::numeric - y0)) / 20;
      lo := lo + (s->>'kf')::double precision * q.unit * 1000 * q.kr_kg * least(20, greatest(0, (s->>'until')::numeric - y1 - 1)) / 20;
    end loop;
  else
    hi := (item->>'kf')::double precision * r.unit * 1000 * r.kr_kg * least(20, greatest(0, (item->>'until')::numeric - y0)) / 20;
    lo := (item->>'kf')::double precision * r.unit * 1000 * r.kr_kg * least(20, greatest(0, (item->>'until')::numeric - y1 - 1)) / 20;
  end if;
  return jsonb_build_object('kr', round(hi)::bigint, 'lo', floor(lo * 0.3)::bigint, 'hi', ceil(hi * 2.5)::bigint);
end $$;

-- «Ønsket hjemmel»: to the players whose wish the good suits, not the seller, not those in the game now, once in twelve hours
create or replace function public.km_tell(l listings) returns void
language plpgsql security definer set search_path = public as $$
declare w record; lo bigint := least(l.start_kr, coalesce(l.buynow, l.start_kr)); hl text := coalesce(l.item->>'hl', '');
begin
  for w in select kw.player_id, coalesce((select max(s.lang) from push_subs s where s.player_id = kw.player_id), 'no') lg from km_wish kw
            where kw.player_id <> coalesce(l.seller, '') and (kw.rid is null or kw.rid = l.item->>'id') and (kw.kind is null or kw.kind = l.kind) and lo <= kw.max_kr
              and (kw.told_at is null or kw.told_at < now() - interval '12 hours')
              and exists (select 1 from push_subs s where s.player_id = kw.player_id)
              and not exists (select 1 from presence pr where pr.player_id = kw.player_id and pr.at > now() - interval '2 minutes') loop
    insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at) values (w.player_id, now(), 'km-wish', 'Kvotemarkedet',
      case when w.lg like 'en%' then case when l.kind = 'right' then 'A right of ' || hl || ' quota length that suits your wish is for sale.'
                                          else 'A structure quota of ' || hl || ' quota length that suits your wish is for sale.' end
           else case when l.kind = 'right' then 'En hjemmel ' || hl || ' som passer ønsket ditt, er til salgs.'
                     else 'En strukturkvote ' || hl || ' som passer ønsket ditt, er til salgs.' end end,
      'srv', now() + interval '12 hours');
    update km_wish set told_at = now() where player_id = w.player_id;
  end loop;
exception when others then return;   -- a push must never stop a listing
end $$;

-- put a right or a structure quota out. vid is the seller's own key for the good (the boat's id for her right, the boat's id and '/' and
-- something for one of her structure quotas, or a key for a right without a boat), seen by the seller alone; item the game's kmPack,
-- value its kmTakst. A right cannot be put out while her boat, the right or one of its structure quotas is out (the right carries them),
-- nor a structure quota while the boat or the right it sits on is. {id, until, item}
create or replace function public.km_put(vid text, item jsonb, value bigint, start_kr bigint, buynow bigint, hours int, seller_name text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare p text := broker_who(); it jsonb; b jsonb; k text; base text; l listings;
begin
  if km_put.vid is null or km_put.vid = '' or length(km_put.vid) > 16 then raise exception 'bad ref'; end if;
  it := km_item(km_put.item); k := it->>'kind';
  if k = 'struct' and (it->>'until')::numeric - greatest((it->>'y')::numeric, km_year()) < 1 then raise exception 'short'; end if;   -- (KM.minLeft: a year on the shared clock)
  if km_put.hours is null or km_put.hours not in (1, 6, 24, 72) then raise exception 'bad hours'; end if;
  b := km_band(it);
  if km_put.value is null or km_put.value <= 0 or km_put.value < (b->>'lo')::bigint or km_put.value > (b->>'hi')::bigint then raise exception 'bad value'; end if;
  if km_put.start_kr is null or km_put.start_kr < ceil(km_put.value * 0.4) or km_put.start_kr > floor(km_put.value * 1.6) then raise exception 'start'; end if;
  if km_put.buynow is not null and (km_put.buynow <= km_put.start_kr or km_put.buynow > floor(km_put.value * 1.6)) then raise exception 'buynow'; end if;
  perform 1 from players where id = p for update;   -- one listing at a time per player, so the count holds
  if (select count(*) from listings ls where ls.seller = p and ls.state = 'open') >= 3 then raise exception 'too many'; end if;
  base := split_part(km_put.vid, '/', 1);
  if exists (select 1 from listings ls where ls.seller = p and ls.state = 'open'
               and (ls.vid = km_put.vid or ls.vid = base or (k = 'right' and split_part(ls.vid, '/', 1) = base))) then raise exception 'listed'; end if;
  insert into listings (seller, seller_name, vid, kind, type, name, vessel, item, value, ref_kr, lic_kr, start_kr, buynow, hours, port, x, y, until)
    values (p, left(regexp_replace(coalesce(km_put.seller_name, ''), '[<>&"]', '', 'g'), 40), km_put.vid, k, null,
            case when k = 'right' then 'Hjemmel ' else 'Strukturkvote ' end || (it->>'hl'), '{}'::jsonb, it, km_put.value, (b->>'kr')::bigint, 0,
            km_put.start_kr, km_put.buynow, km_put.hours, '', null, null, now() + make_interval(hours => km_put.hours))
    returning * into l;
  perform km_tell(l);
  return jsonb_build_object('id', l.id, 'until', l.until, 'item', it);
end $$;

-- B's listing_put as it was, except that a boat cannot be put out while her right or one of her structure quotas is (KM2)
create or replace function public.listing_put(vid text, vessel jsonb, value bigint, lic_kr bigint, start_kr bigint, buynow bigint, hours int, port text, x real, y real, seller_name text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare p text := broker_who(); t broker_types; nm text := left(coalesce(vessel->>'name', ''), 30); l listings;
begin
  select * into t from broker_types where type = listing_put.vessel->>'type';
  if t.type is null then raise exception 'bad type'; end if;
  if listing_put.vid is null or length(listing_put.vid) > 16 or nm = '' then raise exception 'bad boat'; end if;
  if jsonb_typeof(listing_put.vessel) <> 'object' or octet_length(listing_put.vessel::text) > 24000 then raise exception 'bad boat'; end if;
  if listing_put.hours is null or listing_put.hours not in (1, 6, 24, 72) then raise exception 'bad hours'; end if;
  if listing_put.port is null or length(listing_put.port) > 40 or listing_put.x is null or listing_put.y is null then raise exception 'bad port'; end if;
  -- the value: the hull's part never over the type's new price (vesselValue gives 70 % of it and half the 90 hp outboard), the right's
  -- part within what any right in the game is worth
  if listing_put.value is null or listing_put.value <= 0 or coalesce(listing_put.lic_kr, 0) < 0 or coalesce(listing_put.lic_kr, 0) > 200000000
     or listing_put.value - coalesce(listing_put.lic_kr, 0) > t.price + 100000 then raise exception 'bad value'; end if;
  if listing_put.start_kr is null or listing_put.start_kr < ceil(listing_put.value * 0.4) or listing_put.start_kr > floor(listing_put.value * 1.6) then raise exception 'start'; end if;
  if listing_put.buynow is not null and (listing_put.buynow <= listing_put.start_kr or listing_put.buynow > floor(listing_put.value * 1.6)) then raise exception 'buynow'; end if;
  perform 1 from players where id = p for update;   -- one listing at a time per player, so the count holds
  if (select count(*) from listings ls where ls.seller = p and ls.state = 'open') >= 3 then raise exception 'too many'; end if;
  if exists (select 1 from listings ls where ls.seller = p and split_part(ls.vid, '/', 1) = listing_put.vid and ls.state = 'open') then raise exception 'listed'; end if;
  insert into listings (seller, seller_name, vid, type, name, vessel, value, lic_kr, start_kr, buynow, hours, port, x, y, until)
    values (p, left(regexp_replace(coalesce(listing_put.seller_name, ''), '[<>&"]', '', 'g'), 40), listing_put.vid, t.type, nm, listing_put.vessel, listing_put.value,
            coalesce(listing_put.lic_kr, 0), listing_put.start_kr, listing_put.buynow, listing_put.hours, listing_put.port, listing_put.x, listing_put.y,
            now() + make_interval(hours => listing_put.hours))
    returning * into l;
  perform broker_tell(l);
  return jsonb_build_object('id', l.id, 'until', l.until);
end $$;

-- a listing sold: a boat to the buyer (at the yard near him when he paid for delivery), a right or a structure quota to the buyer's inbox
-- (he chose where it goes when he bid: kmApply in the game); the price less 5 % to the seller; a right's place in the register moves
create or replace function public.broker_sold(l listings, who text, kr bigint, deliver text) returns void
language plpgsql security definer set search_path = public as $$
declare net bigint := round(kr * 0.95);
begin
  update listings set state = 'sold', price = kr, buyer = who, settled_at = now() where id = l.id;
  if l.kind = 'boat' then
    insert into broker_ledger (player_id, kind, listing, kr, data) values
      (who, 'boat', l.id, 0, jsonb_build_object('vessel', l.vessel, 'from', l.port, 'port', coalesce(deliver, l.port), 'price', kr, 'name', l.name, 'type', l.type));
  else
    insert into broker_ledger (player_id, kind, listing, kr, data) values (who, l.kind, l.id, 0, jsonb_build_object('item', l.item, 'price', kr, 'name', l.name));
  end if;
  if l.seller is not null then
    insert into broker_ledger (player_id, kind, listing, kr, data) values
      (l.seller, 'paid', l.id, net, jsonb_build_object('vid', l.vid, 'price', kr, 'comm', kr - net, 'name', l.name) || case when l.kind = 'boat' then '{}'::jsonb else jsonb_build_object('item', l.item) end);
    perform broker_reg_move(l.seller, who, case l.kind when 'boat' then l.vessel->'lic'->>'id' when 'right' then l.item->>'id' end);
  end if;
end $$;

-- a bid (B2) as before; the delivery fee only for a boat (a quota has no yard)
create or replace function public.listing_bid(lid bigint, kr bigint, deliver text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := broker_who(); l listings; o bids; mn bigint; fee bigint;
begin
  perform listing_settle();
  select * into l from listings where id = listing_bid.lid for update;
  if l.id is null or l.state <> 'open' or l.until <= now() then raise exception 'gone'; end if;
  if l.seller = p then raise exception 'own'; end if;
  if l.top_player = p then raise exception 'top'; end if;
  if (select count(*) from bids b where b.player_id = p and b.at > now() - interval '1 minute') >= 20 then raise exception 'too many'; end if;
  mn := case when l.top_kr is null then l.start_kr else ceil(l.top_kr * 1.02)::bigint end;
  if listing_bid.kr is null or listing_bid.kr < mn then raise exception 'low %', mn; end if;
  if l.buynow is not null and listing_bid.kr >= l.buynow then raise exception 'buynow'; end if;
  if listing_bid.deliver is not null and length(listing_bid.deliver) > 40 then raise exception 'bad port'; end if;
  fee := case when l.kind = 'boat' and listing_bid.deliver is not null and listing_bid.deliver <> l.port then round(listing_bid.kr * 0.02)::bigint else 0 end;
  if not broker_cash_ok(p, listing_bid.kr + fee) then raise exception 'cash'; end if;
  for o in update bids set state = 'released' where listing = l.id and state = 'held' returning * loop
    insert into broker_ledger (player_id, kind, listing, kr, data) values (o.player_id, 'release', l.id, o.kr + o.fee, jsonb_build_object('name', l.name, 'why', 'outbid', 'by', listing_bid.kr));
  end loop;
  insert into bids (listing, player_id, kr, fee, deliver) values (l.id, p, listing_bid.kr, fee, case when fee > 0 then listing_bid.deliver end);
  insert into broker_ledger (player_id, kind, listing, kr, data) values (p, 'bid', l.id, -(listing_bid.kr + fee), jsonb_build_object('name', l.name, 'bid', listing_bid.kr, 'fee', fee));
  update listings set top_kr = listing_bid.kr, top_player = p, bids_n = bids_n + 1 where id = l.id;
  return jsonb_build_object('ok', true, 'top_kr', listing_bid.kr, 'next', ceil(listing_bid.kr * 1.02)::bigint, 'until', l.until, 'fee', fee);
end $$;

-- «Kjøp nå» as before; the delivery fee only for a boat
create or replace function public.listing_buy(lid bigint, deliver text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := broker_who(); l listings; o bids; fee bigint;
begin
  perform listing_settle();
  select * into l from listings where id = listing_buy.lid for update;
  if l.id is null or l.state <> 'open' or l.until <= now() then raise exception 'gone'; end if;
  if l.seller = p then raise exception 'own'; end if;
  if l.buynow is null then raise exception 'no buynow'; end if;
  if listing_buy.deliver is not null and length(listing_buy.deliver) > 40 then raise exception 'bad port'; end if;
  fee := case when l.kind = 'boat' and listing_buy.deliver is not null and listing_buy.deliver <> l.port then round(l.buynow * 0.02)::bigint else 0 end;
  if not broker_cash_ok(p, l.buynow + fee) then raise exception 'cash'; end if;
  for o in update bids set state = 'released' where listing = l.id and state = 'held' returning * loop
    insert into broker_ledger (player_id, kind, listing, kr, data) values (o.player_id, 'release', l.id, o.kr + o.fee, jsonb_build_object('name', l.name, 'why', 'bought'));
  end loop;
  insert into bids (listing, player_id, kr, fee, deliver, state) values (l.id, p, l.buynow, fee, case when fee > 0 then listing_buy.deliver end, 'won');
  insert into broker_ledger (player_id, kind, listing, kr, data) values (p, 'buy', l.id, -(l.buynow + fee), jsonb_build_object('name', l.name, 'price', l.buynow, 'fee', fee));
  update listings set bids_n = bids_n + 1, top_kr = l.buynow, top_player = p where id = l.id;
  perform broker_sold(l, p, l.buynow, case when fee > 0 then listing_buy.deliver end);
  return jsonb_build_object('ok', true, 'price', l.buynow, 'fee', fee);
end $$;

-- what is for sale (B5), per kind: 'boat' as before (nearest x, y first, within r km), 'right', 'struct' or 'km' (both; one national
-- market, the ones ending first first), at most 200; the player's own of that kind, also closed in the last day; the bids he holds of
-- every kind (the money bound is the same); what of that kind sold in the last 30 days (never who). Guests may look.
drop function if exists public.listings_get(real, real, real);
create or replace function public.listings_get(x real default null, y real default null, r real default null, kind text default 'boat') returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); out jsonb; ks text[];
begin
  if p is null then raise exception 'not signed in'; end if;
  ks := case coalesce(listings_get.kind, 'boat') when 'boat' then array['boat'] when 'right' then array['right'] when 'struct' then array['struct'] when 'km' then array['right', 'struct'] end;
  if ks is null then raise exception 'bad kind'; end if;
  perform listing_settle();
  select jsonb_build_object(
    'now', now(),
    'list', coalesce((select jsonb_agg(z.j order by z.d, z.u) from (
        select jsonb_build_object('id', l.id, 'type', l.type, 'name', l.name, 'vessel', l.vessel - 'pgear', 'value', l.value, 'lic_kr', l.lic_kr, 'start', l.start_kr,
          'buynow', l.buynow, 'top', l.top_kr, 'bids', l.bids_n, 'port', l.port, 'x', l.x, 'y', l.y, 'at', l.created_at, 'until', l.until, 'seller', l.seller_name,
          'mine', l.seller = p, 'top_me', l.top_player = p, 'kind', l.kind) || case when l.kind = 'boat' then '{}'::jsonb else jsonb_build_object('item', l.item) end j,
          case when l.kind <> 'boat' or listings_get.x is null or listings_get.y is null then 0 else sqrt(power(l.x - listings_get.x, 2) + power(l.y - listings_get.y, 2)) end d,
          l.until u
        from listings l where l.state = 'open' and l.until > now() and l.kind = any(ks)
          and (l.kind <> 'boat' or listings_get.r is null or listings_get.x is null or listings_get.y is null
               or sqrt(power(l.x - listings_get.x, 2) + power(l.y - listings_get.y, 2)) <= listings_get.r)
        order by d, l.until limit 200) z), '[]'::jsonb),
    'mine', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'vid', l.vid, 'name', l.name, 'state', l.state, 'start', l.start_kr, 'buynow', l.buynow, 'top', l.top_kr,
          'bids', l.bids_n, 'until', l.until, 'price', l.price, 'port', l.port, 'kind', l.kind) || case when l.kind = 'boat' then '{}'::jsonb else jsonb_build_object('item', l.item) end
          order by l.created_at desc)
        from listings l where l.seller = p and l.kind = any(ks) and (l.state = 'open' or l.settled_at > now() - interval '1 day')), '[]'::jsonb),
    'bids', coalesce((select jsonb_agg(jsonb_build_object('listing', b.listing, 'kr', b.kr, 'fee', b.fee, 'top', l.top_kr, 'until', l.until, 'name', l.name, 'state', l.state, 'kind', l.kind))
        from bids b join listings l on l.id = b.listing where b.player_id = p and b.state = 'held'), '[]'::jsonb),
    'sold', coalesce((select jsonb_agg(jsonb_build_object('type', s.type, 'price', s.price, 'port', s.port, 'at', s.settled_at, 'kind', s.kind)
          || case when s.kind = 'boat' then '{}'::jsonb else jsonb_build_object('id', s.item->>'id', 'value', s.value) end order by s.settled_at desc)
        from (select * from listings l where l.state = 'sold' and l.kind = any(ks) and l.settled_at > now() - interval '30 days' order by l.settled_at desc
              limit case when 'boat' = any(ks) then 12 else 30 end) s), '[]'::jsonb)
  ) into out;
  return out;
end $$;

-- the ledger as before (the grants pattern), with the kind of the listing each row belongs to (lk); the quota rows only when the game
-- asks for them (km: KM3 and later), so a game from before KM3 leaves them for one that can apply them
drop function if exists public.broker_pending();
create or replace function public.broker_pending(km boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  perform listing_settle();
  return coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'kind', g.kind, 'listing', g.listing, 'kr', g.kr, 'data', g.data, 'lk', g.lk) order by g.id)
    from broker_ledger g where g.player_id = p and g.done_at is null and (coalesce(broker_pending.km, false) or g.lk = 'boat')), '[]'::jsonb);
end $$;

-- «Ønsket hjemmel»: a quota length (null for any), a kind (null for both) and a top price; max_kr null or 0 takes it away
create or replace function public.km_wish_set(rid text, kind text, max_kr bigint) returns void
language plpgsql security definer set search_path = public as $$
declare p text := broker_who();
begin
  if km_wish_set.max_kr is null or km_wish_set.max_kr <= 0 then delete from km_wish where player_id = p; return; end if;
  if km_wish_set.rid is not null and not exists (select 1 from quota_ref q where q.id = km_wish_set.rid) then raise exception 'bad right'; end if;
  if km_wish_set.kind is not null and km_wish_set.kind not in ('right', 'struct') then raise exception 'bad kind'; end if;
  insert into km_wish (player_id, rid, kind, max_kr) values (p, km_wish_set.rid, km_wish_set.kind, least(km_wish_set.max_kr, 1000000000))
    on conflict (player_id) do update set rid = excluded.rid, kind = excluded.kind, max_kr = excluded.max_kr, at = now(),
      told_at = case when (km_wish.rid, km_wish.kind) is not distinct from (excluded.rid, excluded.kind) and excluded.max_kr <= km_wish.max_kr then km_wish.told_at end;   -- (a new wish may be told at once)
end $$;

-- the admin's line: per week (the week a listing closed, or was put out while open), kind and quota length (the type for a boat): put
-- out, sold, unsold, cancelled, the median price, and the median price against the game's takst (value) and against the takst here
-- (ref_kr, 2026 and kr_kg). Sums only, never who; the closed listings are kept 120 days
create or replace function public.admin_km(weeks int default 8) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('wk', a.wk, 'kind', a.kind, 'id', a.id, 'put', a.put, 'sold', a.sold, 'unsold', a.unsold, 'cancelled', a.cancelled,
      'median', a.med, 'vs_takst', a.vt, 'vs_ref', a.vr) order by a.wk desc, a.kind, a.id) from (
    select date_trunc('week', coalesce(l.settled_at, l.created_at) at time zone 'Europe/Oslo')::date wk, l.kind, coalesce(l.item->>'id', l.type) id, count(*) put,
      count(*) filter (where l.state = 'sold') sold, count(*) filter (where l.state = 'unsold') unsold, count(*) filter (where l.state = 'cancelled') cancelled,
      round((percentile_cont(0.5) within group (order by l.price) filter (where l.state = 'sold'))::numeric) med,
      round((percentile_cont(0.5) within group (order by l.price::double precision / l.value) filter (where l.state = 'sold'))::numeric, 3) vt,
      round((percentile_cont(0.5) within group (order by l.price::double precision / nullif(l.ref_kr, 0)) filter (where l.state = 'sold' and l.ref_kr > 0))::numeric, 3) vr
    from listings l where coalesce(l.settled_at, l.created_at) > now() - make_interval(weeks => greatest(1, least(coalesce(admin_km.weeks, 8), 52)))
    group by 1, 2, 3) a), '[]'::jsonb);
end $$;

revoke all on function public.km_year(), public.km_num(jsonb, numeric, numeric), public.km_item(jsonb), public.km_band(jsonb), public.km_tell(listings), public.broker_ledger_lk(),
  public.km_put(text, jsonb, bigint, bigint, bigint, int, text), public.listing_put(text, jsonb, bigint, bigint, bigint, bigint, int, text, real, real, text),
  public.broker_sold(listings, text, bigint, text), public.listing_bid(bigint, bigint, text), public.listing_buy(bigint, text),
  public.listings_get(real, real, real, text), public.broker_pending(boolean), public.km_wish_set(text, text, bigint), public.admin_km(int)
  from public, anon, authenticated;
grant execute on function public.km_put(text, jsonb, bigint, bigint, bigint, int, text), public.listing_put(text, jsonb, bigint, bigint, bigint, bigint, int, text, real, real, text),
  public.listing_bid(bigint, bigint, text), public.listing_buy(bigint, text), public.listings_get(real, real, real, text), public.broker_pending(boolean),
  public.km_wish_set(text, text, bigint), public.admin_km(int) to authenticated;
