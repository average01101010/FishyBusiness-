-- Boat sales between players at Kystmegleren (B1–B8 in docs/planer/etter-tonys-test.md; Jonas 07.11.2026: «Her må vi bygge salg mellom
-- spillere, med en liten kommisjon til skipsmegleren … båtene som ligger til salgs hos skipsmegleren skal utelukkende være båter andre
-- brukere selger … quicksell … EAFC/FIFA»; V4 A 5 % commission, V5 A the right follows the boat, V6 A quicksell 90 % in the game).
--
-- The auction house of EAFC: a player puts a boat out with a start price, an optional buy-now price and a time (1, 6, 24 or 72 real
-- hours); others bid from anywhere, the next bid at least 2 % over the last; the highest bid when the time runs out wins, buy-now ends
-- it at once. The money in a bid is bound here: the game keeps the cash in its save, so every krone the broker binds, gives back or pays
-- out, and every boat it hands over, is one row in the broker's ledger (broker_ledger, the grants pattern), which the game applies once
-- and marks done. An outbid bid is released at once. listing_settle (pg_cron every minute, and lazily from the reads) closes the
-- listings whose time is out: the winner gets the boat in the ledger, the seller the price less 5 %, a boat nobody bid on goes back.
-- Limits against cheating with a second account (B2): the start price at least 40 % and buy-now at most 160 % of the boat's value as the
-- game works it out (vesselValue), the hull part of that value held against the type's new price here (broker_types), at most three
-- open listings a player, guests neither sell nor bid, and a bid larger than twice the cash in the player's last save (plus a margin)
-- is refused. Delivery to a yard near the buyer costs 2 % of the price, bound with the bid (B3). The right (hjemmel) follows the boat
-- (B8), and its place in the register of rights (reg_held) moves from the seller to the buyer.

-- the types that can be sold between players (the open group and the coastal fleet; the ocean vessels are sold at the yard only), with
-- their new price from VESSELS (core/02-species-gear.js) to hold the game's value against
create table if not exists public.broker_types (type text primary key, price bigint not null, cls text not null check (cls in ('open', 'kyst')));
insert into public.broker_types (type, price, cls) values
  ('skiff', 95000, 'open'), ('trebat', 45000, 'open'), ('snekke', 245000, 'open'), ('plastsjark', 850000, 'open'), ('sjark', 1150000, 'open'),
  ('hurtigsjark', 4900000, 'open'), ('sjarkny', 10500000, 'open'), ('breisjark', 9000000, 'open'), ('kyst15', 18000000, 'kyst'), ('kyst21', 9000000, 'kyst')
on conflict (type) do update set price = excluded.price, cls = excluded.cls;
alter table public.broker_types enable row level security;
revoke all on public.broker_types from anon, authenticated;

create table if not exists public.listings (
  id bigint generated always as identity primary key,
  seller text references public.players(id) on delete set null,
  seller_name text not null default '' check (char_length(seller_name) <= 40),
  vid text not null check (char_length(vid) <= 16),
  type text not null references public.broker_types(type),
  name text not null check (char_length(name) <= 30),
  vessel jsonb not null check (octet_length(vessel::text) <= 24000),
  value bigint not null check (value > 0),
  lic_kr bigint not null default 0,
  start_kr bigint not null,
  buynow bigint,
  hours int not null check (hours in (1, 6, 24, 72)),
  port text not null check (char_length(port) <= 40),
  x real not null, y real not null,
  created_at timestamptz not null default now(),
  until timestamptz not null,
  state text not null default 'open' check (state in ('open', 'sold', 'unsold', 'cancelled')),
  top_kr bigint, top_player text, bids_n int not null default 0,
  price bigint, buyer text, settled_at timestamptz
);
create index if not exists listings_open on public.listings (until) where state = 'open';
create index if not exists listings_seller on public.listings (seller) where state = 'open';
create unique index if not exists listings_one on public.listings (seller, vid) where state = 'open';
create index if not exists listings_sold on public.listings (settled_at desc) where state = 'sold';
alter table public.listings enable row level security;

create table if not exists public.bids (
  id bigint generated always as identity primary key,
  listing bigint not null references public.listings(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  kr bigint not null check (kr > 0),
  fee bigint not null default 0,
  deliver text check (char_length(deliver) <= 40),
  at timestamptz not null default now(),
  state text not null default 'held' check (state in ('held', 'released', 'won'))
);
create index if not exists bids_listing on public.bids (listing, kr desc);
create index if not exists bids_held on public.bids (player_id) where state = 'held';
alter table public.bids enable row level security;

-- the broker's ledger: kr < 0 is money bound (a bid, a purchase), kr > 0 money given back or paid out; 'boat' hands the winner the
-- boat (data.vessel, data.port), 'paid' tells the seller she is sold (data.vid), 'back' that she is his again (unsold or cancelled)
create table if not exists public.broker_ledger (
  id bigint generated always as identity primary key,
  player_id text not null references public.players(id) on delete cascade,
  kind text not null check (kind in ('bid', 'release', 'buy', 'paid', 'boat', 'back')),
  listing bigint references public.listings(id) on delete set null,
  kr bigint not null default 0,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists broker_ledger_open on public.broker_ledger (player_id) where done_at is null;
create index if not exists broker_ledger_done on public.broker_ledger (player_id, done_at) where done_at is not null;
alter table public.broker_ledger enable row level security;

-- «Ønsket båt» (B5): a group and a top price; a boat that suits it is told by push when it is put out (once in twelve hours at most)
create table if not exists public.broker_wish (
  player_id text primary key references public.players(id) on delete cascade,
  cls text check (cls in ('open', 'kyst')),
  max_kr bigint not null,
  at timestamptz not null default now(),
  told_at timestamptz
);
alter table public.broker_wish enable row level security;
revoke all on public.listings, public.bids, public.broker_ledger, public.broker_wish from anon, authenticated;

-- a signed-in player who is not a guest (guests can look, not trade)
create or replace function public.broker_who() returns text
language plpgsql stable security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if is_guest() then raise exception 'guest'; end if;
  return p;
end $$;

-- what a player may bind: refused when the bids held with this one would be more than twice the cash in the last save and a million
-- (the save can be minutes old, so the margin is wide; it stops a bid of millions from a save that has thousands)
create or replace function public.broker_cash_ok(p text, add_kr bigint) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare c bigint; held bigint;
begin
  select nullif(s.summary->>'cash', '')::numeric::bigint into c from saves s where s.player_id = p;
  if c is null then return true; end if;
  select coalesce(sum(b.kr + b.fee), 0) into held from bids b where b.player_id = p and b.state = 'held';
  return held + add_kr <= 2 * greatest(c, 0) + 1000000;
exception when others then return true;
end $$;

-- the right in the register of rights moves with the boat (B8): the seller's place to the buyer
create or replace function public.broker_reg_move(fr text, tu text, rid text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if fr is null or tu is null or rid is null or fr = tu then return; end if;
  if not exists (select 1 from reg_held h where h.player_id = fr and h.id = rid) then return; end if;
  delete from reg_held h where h.player_id = fr and h.id = rid and h.n <= 1;
  update reg_held h set n = h.n - 1 where h.player_id = fr and h.id = rid;
  insert into reg_held (player_id, id) values (tu, rid) on conflict (player_id, id) do update set n = least(20, reg_held.n + 1), at = now();
  delete from world_agg where y is not null;
exception when others then return;   -- the register must never stop a sale
end $$;

-- a listing sold: the boat to the buyer (at the yard near him when he paid for delivery), the price less 5 % to the seller
create or replace function public.broker_sold(l listings, who text, kr bigint, deliver text) returns void
language plpgsql security definer set search_path = public as $$
declare net bigint := round(kr * 0.95);
begin
  update listings set state = 'sold', price = kr, buyer = who, settled_at = now() where id = l.id;
  insert into broker_ledger (player_id, kind, listing, kr, data) values
    (who, 'boat', l.id, 0, jsonb_build_object('vessel', l.vessel, 'from', l.port, 'port', coalesce(deliver, l.port), 'price', kr, 'name', l.name, 'type', l.type));
  if l.seller is not null then
    insert into broker_ledger (player_id, kind, listing, kr, data) values
      (l.seller, 'paid', l.id, net, jsonb_build_object('vid', l.vid, 'price', kr, 'comm', kr - net, 'name', l.name));
    perform broker_reg_move(l.seller, who, l.vessel->'lic'->>'id');
  end if;
end $$;

-- the listings whose time is out: sold to the highest bid, or back to the seller; a listing whose seller deleted his account is called
-- off and the bid in it released. Returns how many were closed. Run every minute by pg_cron, and by the reads, so nothing waits for it.
create or replace function public.listing_settle() returns int
language plpgsql security definer set search_path = public as $$
declare l listings; b bids; n int := 0;
begin
  for l in select * from listings where state = 'open' and (until <= now() or seller is null) order by until for update skip locked loop
    select * into b from bids where listing = l.id and state = 'held' order by kr desc limit 1;
    if l.seller is null then
      update listings set state = 'cancelled', settled_at = now() where id = l.id;
      if b.id is not null then update bids set state = 'released' where id = b.id;
        insert into broker_ledger (player_id, kind, listing, kr, data) values (b.player_id, 'release', l.id, b.kr + b.fee, jsonb_build_object('name', l.name, 'why', 'gone')); end if;
    elsif b.id is not null then
      update bids set state = 'won' where id = b.id;
      perform broker_sold(l, b.player_id, b.kr, b.deliver);
    else
      update listings set state = 'unsold', settled_at = now() where id = l.id;
      insert into broker_ledger (player_id, kind, listing, kr, data) values (l.seller, 'back', l.id, 0, jsonb_build_object('vid', l.vid, 'name', l.name, 'why', 'unsold'));
    end if;
    n := n + 1;
  end loop;
  -- the old: ledger rows applied 90 days ago, listings closed 120 days ago (the sold ones are the price anchor for 30 days)
  delete from broker_ledger g where g.done_at < now() - interval '90 days';
  delete from listings x where x.state <> 'open' and x.settled_at < now() - interval '120 days';
  return n;
end $$;

-- the wish's push: to the players whose wish she suits, not the seller, not those in the game now, once in twelve hours
create or replace function public.broker_tell(l listings) returns void
language plpgsql security definer set search_path = public as $$
declare w record; at_ text := left(regexp_replace(coalesce(l.vessel->>'at', ''), '[^[:alnum:] æøåÆØÅ.-]', '', 'g'), 40);
begin
  for w in select bw.player_id, coalesce((select max(s.lang) from push_subs s where s.player_id = bw.player_id), 'no') lg from broker_wish bw join broker_types t on t.type = l.type
            where bw.player_id <> coalesce(l.seller, '') and (bw.cls is null or bw.cls = t.cls) and least(l.start_kr, coalesce(l.buynow, l.start_kr)) <= bw.max_kr
              and (bw.told_at is null or bw.told_at < now() - interval '12 hours')
              and exists (select 1 from push_subs s where s.player_id = bw.player_id)
              and not exists (select 1 from presence pr where pr.player_id = bw.player_id and pr.at > now() - interval '2 minutes') loop
    insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at) values (w.player_id, now(), 'mkt-wish', 'Kystmegleren',
      case when w.lg like 'en%' then 'A boat that suits your wish is for sale: «' || l.name || '»' || case when at_ <> '' then ' at the yard in ' || at_ else '' end || '.'
           else 'En båt som passer ønsket ditt, er til salgs: «' || l.name || '»' || case when at_ <> '' then ' ved verftet i ' || at_ else '' end || '.' end,
      'srv', now() + interval '12 hours');
    update broker_wish set told_at = now() where player_id = w.player_id;
  end loop;
exception when others then return;   -- a push must never stop a listing
end $$;

-- put a boat out (B1): vid is the boat's id in the seller's save, vessel what goes with her (the game's mbPack), value the game's
-- vesselValue and lic_kr the right's part of it, hours 1, 6, 24 or 72, port and x, y the yard where she lies. {id, until}
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
  if exists (select 1 from listings ls where ls.seller = p and ls.vid = listing_put.vid and ls.state = 'open') then raise exception 'listed'; end if;
  insert into listings (seller, seller_name, vid, type, name, vessel, value, lic_kr, start_kr, buynow, hours, port, x, y, until)
    values (p, left(regexp_replace(coalesce(listing_put.seller_name, ''), '[<>&"]', '', 'g'), 40), listing_put.vid, t.type, nm, listing_put.vessel, listing_put.value,
            coalesce(listing_put.lic_kr, 0), listing_put.start_kr, listing_put.buynow, listing_put.hours, listing_put.port, listing_put.x, listing_put.y,
            now() + make_interval(hours => listing_put.hours))
    returning * into l;
  perform broker_tell(l);
  return jsonb_build_object('id', l.id, 'until', l.until);
end $$;

-- a bid (B2): at least the start price, the next at least 2 % over the highest; under buy-now (that is listing_buy); not on your own boat,
-- and not when you hold the highest bid already. deliver: the yard to deliver her to, for 2 % more (bound with the bid). The bid it
-- beats is released at once. {ok, top_kr, next, until}
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
  fee := case when listing_bid.deliver is not null and listing_bid.deliver <> l.port then round(listing_bid.kr * 0.02)::bigint else 0 end;
  if not broker_cash_ok(p, listing_bid.kr + fee) then raise exception 'cash'; end if;
  for o in update bids set state = 'released' where listing = l.id and state = 'held' returning * loop
    insert into broker_ledger (player_id, kind, listing, kr, data) values (o.player_id, 'release', l.id, o.kr + o.fee, jsonb_build_object('name', l.name, 'why', 'outbid', 'by', listing_bid.kr));
  end loop;
  insert into bids (listing, player_id, kr, fee, deliver) values (l.id, p, listing_bid.kr, fee, case when fee > 0 then listing_bid.deliver end);
  insert into broker_ledger (player_id, kind, listing, kr, data) values (p, 'bid', l.id, -(listing_bid.kr + fee), jsonb_build_object('name', l.name, 'bid', listing_bid.kr, 'fee', fee));
  update listings set top_kr = listing_bid.kr, top_player = p, bids_n = bids_n + 1 where id = l.id;
  return jsonb_build_object('ok', true, 'top_kr', listing_bid.kr, 'next', ceil(listing_bid.kr * 1.02)::bigint, 'until', l.until, 'fee', fee);
end $$;

-- «Kjøp nå»: the buy-now price ends the listing at once; the highest bid is released, the boat and the money as at the end
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
  fee := case when listing_buy.deliver is not null and listing_buy.deliver <> l.port then round(l.buynow * 0.02)::bigint else 0 end;
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

-- the seller takes her back before anyone has bid (as in EAFC, a listing with a bid cannot be withdrawn)
create or replace function public.listing_cancel(lid bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := broker_who(); l listings;
begin
  select * into l from listings where id = listing_cancel.lid for update;
  if l.id is null or l.seller is distinct from p then raise exception 'not yours'; end if;
  if l.state <> 'open' then raise exception 'gone'; end if;
  if l.bids_n > 0 then raise exception 'bids'; end if;
  update listings set state = 'cancelled', settled_at = now() where id = l.id;
  insert into broker_ledger (player_id, kind, listing, kr, data) values (p, 'back', l.id, 0, jsonb_build_object('vid', l.vid, 'name', l.name, 'why', 'cancelled'));
  return jsonb_build_object('ok', true);
end $$;

-- what is for sale (B5): the open listings, nearest x, y first (r km, null for the whole coast), at most 200, with what the player has
-- in them (mine, top_me); the player's own listings also when closed in the last day; the bids he holds; and what sold in the last 30
-- days (type, price, yard; never who). Guests may look.
create or replace function public.listings_get(x real default null, y real default null, r real default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); out jsonb;
begin
  if p is null then raise exception 'not signed in'; end if;
  perform listing_settle();
  select jsonb_build_object(
    'now', now(),
    'list', coalesce((select jsonb_agg(z.j order by z.d) from (
        select jsonb_build_object('id', l.id, 'type', l.type, 'name', l.name, 'vessel', l.vessel - 'pgear', 'value', l.value, 'lic_kr', l.lic_kr, 'start', l.start_kr,
          'buynow', l.buynow, 'top', l.top_kr, 'bids', l.bids_n, 'port', l.port, 'x', l.x, 'y', l.y, 'at', l.created_at, 'until', l.until, 'seller', l.seller_name,
          'mine', l.seller = p, 'top_me', l.top_player = p) j,
          case when listings_get.x is null or listings_get.y is null then 0 else sqrt(power(l.x - listings_get.x, 2) + power(l.y - listings_get.y, 2)) end d
        from listings l where l.state = 'open' and l.until > now()
          and (listings_get.r is null or listings_get.x is null or listings_get.y is null or sqrt(power(l.x - listings_get.x, 2) + power(l.y - listings_get.y, 2)) <= listings_get.r)
        order by d limit 200) z), '[]'::jsonb),
    'mine', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'vid', l.vid, 'name', l.name, 'state', l.state, 'start', l.start_kr, 'buynow', l.buynow, 'top', l.top_kr,
          'bids', l.bids_n, 'until', l.until, 'price', l.price, 'port', l.port) order by l.created_at desc)
        from listings l where l.seller = p and (l.state = 'open' or l.settled_at > now() - interval '1 day')), '[]'::jsonb),
    'bids', coalesce((select jsonb_agg(jsonb_build_object('listing', b.listing, 'kr', b.kr, 'fee', b.fee, 'top', l.top_kr, 'until', l.until, 'name', l.name, 'state', l.state))
        from bids b join listings l on l.id = b.listing where b.player_id = p and b.state = 'held'), '[]'::jsonb),
    'sold', coalesce((select jsonb_agg(jsonb_build_object('type', s.type, 'price', s.price, 'port', s.port, 'at', s.settled_at) order by s.settled_at desc)
        from (select * from listings l where l.state = 'sold' and l.settled_at > now() - interval '30 days' order by l.settled_at desc limit 12) s), '[]'::jsonb)
  ) into out;
  return out;
end $$;

-- the ledger: what the game is to apply, and that it has (the grants pattern: shop_pending and shop_done)
create or replace function public.broker_pending() returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  perform listing_settle();
  return coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'kind', g.kind, 'listing', g.listing, 'kr', g.kr, 'data', g.data) order by g.id)
    from broker_ledger g where g.player_id = p and g.done_at is null), '[]'::jsonb);
end $$;
create or replace function public.broker_done(ids bigint[]) returns void
language sql security definer set search_path = public as $$
  update broker_ledger set done_at = now() where player_id = pid() and id = any(broker_done.ids) and done_at is null
$$;

-- the wish: a group (null for both) and a top price; max_kr null or 0 takes it away
create or replace function public.broker_wish_set(cls text, max_kr bigint) returns void
language plpgsql security definer set search_path = public as $$
declare p text := broker_who();
begin
  if broker_wish_set.max_kr is null or broker_wish_set.max_kr <= 0 then delete from broker_wish where player_id = p; return; end if;
  if broker_wish_set.cls is not null and broker_wish_set.cls not in ('open', 'kyst') then raise exception 'bad group'; end if;
  insert into broker_wish (player_id, cls, max_kr) values (p, broker_wish_set.cls, least(broker_wish_set.max_kr, 1000000000))
    on conflict (player_id) do update set cls = excluded.cls, max_kr = excluded.max_kr, at = now();
end $$;

-- the cash check on the saves (20261017120000_turokonomi.sql) also counts what the broker paid out (released bids, sold boats)
create or replace function public.saves_cash_check() returns trigger language plpgsql security definer set search_path = public as $$
declare c0 bigint; c1 bigint; d bigint; ex bigint; br bigint; ok boolean;
begin
  c0 := nullif(old.summary->>'cash', '')::bigint; c1 := nullif(new.summary->>'cash', '')::bigint;
  if c0 is null or c1 is null then return new; end if;
  d := c1 - c0; if d < 300000 then return new; end if;
  select coalesce(consent, false) into ok from players where id = new.player_id; if not coalesce(ok, false) then return new; end if;
  select coalesce(sum(case when kind = 'sale' then coalesce((data->>'kr')::bigint, 0) when kind = 'tur_done' then coalesce((data->>'pay')::bigint, 0) else 0 end), 0)
    into ex from events where player_id = new.player_id and kind in ('sale', 'tur_done') and ts > coalesce(old.updated_at, now() - interval '1 day') - interval '10 minutes';
  select coalesce(sum(g.kr), 0) into br from broker_ledger g where g.player_id = new.player_id and g.kr > 0 and g.done_at > coalesce(old.updated_at, now() - interval '1 day') - interval '10 minutes';
  ex := ex + br;
  -- other income the events do not carry (a boat or quota sold, a loan, insurance) is why the margin is wide
  if d > greatest(300000, 2 * ex + 200000) then
    insert into cash_flags (player_id, cash0, cash1, delta, explained, game_dt, note)
      values (new.player_id, c0, c1, d, ex, coalesce(new.game_t, 0) - coalesce(old.game_t, 0), 'cash rose more than the logged landings and missions');
  end if;
  return new;
exception when others then return new;   -- a check must never stop a save
end $$;

revoke all on function public.broker_who(), public.broker_cash_ok(text, bigint), public.broker_reg_move(text, text, text), public.broker_sold(listings, text, bigint, text),
  public.listing_settle(), public.broker_tell(listings), public.listing_put(text, jsonb, bigint, bigint, bigint, bigint, int, text, real, real, text),
  public.listing_bid(bigint, bigint, text), public.listing_buy(bigint, text), public.listing_cancel(bigint), public.listings_get(real, real, real),
  public.broker_pending(), public.broker_done(bigint[]), public.broker_wish_set(text, bigint) from public, anon, authenticated;
grant execute on function public.listing_put(text, jsonb, bigint, bigint, bigint, bigint, int, text, real, real, text), public.listing_bid(bigint, bigint, text),
  public.listing_buy(bigint, text), public.listing_cancel(bigint), public.listings_get(real, real, real), public.broker_pending(), public.broker_done(bigint[]),
  public.broker_wish_set(text, bigint) to authenticated;
grant execute on function public.listing_settle() to service_role;

do $$ begin
  perform cron.unschedule('dsb-broker') where exists (select 1 from cron.job where jobname = 'dsb-broker');
  perform cron.schedule('dsb-broker', '* * * * *', $c$ select public.listing_settle(); $c$);
exception when others then raise notice 'pg_cron is not enabled: turn it on under Database → Extensions and run this block again';
end $$;
