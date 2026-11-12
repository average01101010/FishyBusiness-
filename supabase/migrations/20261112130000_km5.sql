-- KM5, the quota price that lives (docs/planer/kvotemarkedet.md, steg 64; Jonas 07.11.2026, V4 B; 12.11.2026: «Trinnet med en gang»,
-- «Uten årstiden»). Only game money; nothing here touches real money. Idempotent (create or replace).
--
--   km_band      the band a listing's value (the game's kmTakst) is held in: 0.3 to 4.5 times the takst at the 2026 unit and 260 kr/kg
--                (it was 2.5). The game's takst is the year's quota unit times the quota price (kpkAt, 0.7–1.4 × 260 kr/kg); the unit
--                follows the stock, and over 400 seeds × the years 2027–2060 the highest unit against 2026 was 3.153 times (20–20,9 m),
--                so the highest kmTakst is 4.41 times the 2026 takst; the lowest 0.788 × 0.7 = 0.55, inside 0.3 (worked out with the
--                game's own functions, the numbers in the plan's status for KM5)
--   km_week      Kystposten's «Kvoteprisen denne uka»: the quota sales of one game week (wk = floor(game hour / 168), as weekOf in the
--                game), their number per kind and the median price against the takst. Numbers only, never who or which listing
--   admin_km5    the admin's Kvotemarkedet card, besides admin_km: the measuring events per week (km_put, km_bid, km_buy, km_quick,
--                km_view, km_wish, km_move, km_reg, mb_put by its lic), the hours to the first bid per week and kind, and per group
--                what players bought from players against what they bought from the register. Sums only, never who

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
  return jsonb_build_object('kr', round(hi)::bigint, 'lo', floor(lo * 0.3)::bigint, 'hi', ceil(hi * 4.5)::bigint);
end $$;

-- the quota sales settled in game week wk (a game hour is ten real minutes: world_gh). The week asked for must be this one or one of
-- the 60 before. {wk, n, right, struct, med}: med is the median of price over the takst the seller's game gave (value), null without a sale
create or replace function public.km_week(wk int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare g double precision := world_gh(); a timestamptz; b timestamptz; r jsonb;
begin
  if km_week.wk is null or km_week.wk > floor(g / 168) or km_week.wk < floor(g / 168) - 60 then raise exception 'bad week'; end if;
  a := now() - make_interval(secs => (g - km_week.wk * 168) * 600); b := now() - make_interval(secs => greatest(0, g - (km_week.wk + 1) * 168) * 600);
  select jsonb_build_object('wk', km_week.wk, 'n', count(*), 'right', count(*) filter (where l.kind = 'right'), 'struct', count(*) filter (where l.kind = 'struct'),
      'med', round((percentile_cont(0.5) within group (order by l.price::double precision / l.value))::numeric, 3))
    into r from listings l where l.kind in ('right', 'struct') and l.state = 'sold' and l.settled_at >= a and l.settled_at < b and l.value > 0;
  return r;
end $$;

create or replace function public.admin_km5(weeks int default 8) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t0 timestamptz := now() - make_interval(weeks => greatest(1, least(coalesce(admin_km5.weeks, 8), 52)));
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object(
    -- the events the game sends (cloudEv), per week and kind, with the field that splits them (a quota good's kind, a move's to, a boat's right)
    'ev', (select coalesce(jsonb_agg(jsonb_build_object('wk', e.wk, 'k', e.kind, 'sub', e.sub, 'n', e.n, 'pc', e.pc) order by e.wk desc, e.kind, e.sub), '[]'::jsonb) from (
      select date_trunc('week', ev.ts at time zone 'Europe/Oslo')::date wk, ev.kind,
        left(coalesce(ev.data->>'kind', ev.data->>'to', ev.data->>'lic', ''), 12) sub, count(*) n,
        round((percentile_cont(0.5) within group (order by (ev.data->>'pc')::double precision) filter (where jsonb_typeof(ev.data->'pc') = 'number'))::numeric) pc
      from events ev where ev.ts > t0 and ev.kind in ('km_put', 'km_bid', 'km_buy', 'km_quick', 'km_view', 'km_wish', 'km_move', 'km_reg', 'mb_put')
      group by 1, 2, 3) e),
    -- the hours from a quota listing put out to its first bid (or a buy-now, which is a bid too), and how many got none
    'bid', (select coalesce(jsonb_agg(jsonb_build_object('wk', x.wk, 'kind', x.kind, 'n', x.n, 'none', x.none, 'h', x.h) order by x.wk desc, x.kind), '[]'::jsonb) from (
      select date_trunc('week', l.created_at at time zone 'Europe/Oslo')::date wk, l.kind, count(*) n, count(*) filter (where f.at is null) none,
        round((percentile_cont(0.5) within group (order by extract(epoch from f.at - l.created_at) / 3600) filter (where f.at is not null))::numeric, 1) h
      from listings l left join lateral (select min(bd.at) at from bids bd where bd.listing = l.id) f on true
      where l.kind in ('right', 'struct') and l.created_at > t0 and l.state <> 'open' group by 1, 2) x),
    -- per group: bought from players (the market) against bought from the register (km_reg)
    'grp', (select coalesce(jsonb_agg(jsonb_build_object('grp', g.grp, 'players', g.p, 'register', g.r) order by g.grp), '[]'::jsonb) from (
      select q.grp, (select count(*) from listings l where l.kind in ('right', 'struct') and l.state = 'sold' and l.settled_at > t0 and l.item->>'id' in (select id from quota_ref q2 where q2.grp = q.grp)) p,
        (select count(*) from events ev where ev.kind = 'km_reg' and ev.ts > t0 and ev.data->>'id' in (select id from quota_ref q2 where q2.grp = q.grp)) r
      from (select distinct grp from quota_ref) q) g));
end $$;

revoke all on function public.km_band(jsonb), public.km_week(int), public.admin_km5(int) from public, anon, authenticated;
grant execute on function public.km_week(int), public.admin_km5(int) to authenticated;
