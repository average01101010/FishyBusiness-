-- Det Store Blå in the cloud (04.10.2026; docs/lansering.md E and F): players, cloud saves, usage measurements, the shop's tables
-- and the admin dashboard's numbers.
--
-- Who is who:
--   * Players sign in with WorkOS (AuthKit), set up as Supabase third-party auth. Their id is the token's `sub` (pid()), a WorkOS
--     user id like 'user_01H…' (not a uuid, so auth.uid() is never called on it).
--   * The admin (Jonas, his demand 04.10.2026: «Dette må ingen andre enn meg ha tilgang til») signs in with Supabase Auth and a
--     TOTP factor, so his token has aal = 'aal2', and his auth user id is the only row in admins. is_admin() asks for both.
--
-- The game never writes the tables directly: every table has row level security with no policy for players, and the game calls
-- the functions below (security definer, each checking pid() and the consent itself). Only the admin's select policies read.
-- The shop's purchases are written by the Stripe webhook with the service role, which bypasses RLS.

create or replace function public.pid() returns text language sql stable set search_path = '' as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

create table if not exists public.admins (user_id uuid primary key, note text);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select case when coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
              then exists (select 1 from public.admins a where a.user_id::text = auth.jwt() ->> 'sub') else false end
$$;

-- ---------- the tables ----------
create table if not exists public.players (
  id text primary key,                          -- WorkOS user id
  created_at timestamptz not null default now(),
  last_seen timestamptz,
  consent boolean,                              -- usage statistics: null not asked, true or false as answered
  consent_at timestamptz,
  birth_year int,                               -- the 13-year limit for consent (personopplysningsloven § 5)
  lang text, tz text, country text, platform text, browser text, pwa boolean,
  home text, boat text, cash bigint, fleet int, fleet_value bigint, streak int, game_days int,  -- the latest state, for the economy panels
  game_admin boolean not null default false    -- the game's Admin app (ui/05-phone.js): set by hand for Jonas's account only
);
-- (05.10.2026, «admin-appen på telefonen skal kun være tilgjengelig på min konto»: no player can set it, the table has no write
-- grant or policy for players; set in the SQL Editor with: update public.players set game_admin = true where id = '<WorkOS user id>')
alter table public.players add column if not exists game_admin boolean not null default false;
create table if not exists public.saves (
  player_id text primary key references public.players(id) on delete cascade,
  data text not null, saved_at timestamptz not null, game_t bigint, bytes int, updated_at timestamptz not null default now()
);
create table if not exists public.sessions (
  id uuid primary key,
  player_id text not null references public.players(id) on delete cascade,
  started_at timestamptz not null default now(), last_beat timestamptz not null default now(), ended_at timestamptz,
  active_s int not null default 0, beats int not null default 0, end_reason text,
  version text, browser text, platform text, pwa boolean, quality text
);
create index if not exists sessions_player on public.sessions (player_id, started_at);
create index if not exists sessions_started on public.sessions (started_at);
create index if not exists sessions_beat on public.sessions (last_beat);
create table if not exists public.events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  session_id uuid references public.sessions(id) on delete cascade,
  player_id text references public.players(id) on delete cascade,
  kind text not null, data jsonb not null default '{}'
);
create index if not exists events_kind on public.events (kind, ts);
create index if not exists events_player on public.events (player_id, ts);
create table if not exists public.errors (           -- also without consent, then with no player
  id bigint generated always as identity primary key, ts timestamptz not null default now(),
  player_id text references public.players(id) on delete set null, session_id uuid,
  msg text not null, src text, stack text, version text, browser text, platform text
);
create index if not exists errors_ts on public.errors (ts);
create table if not exists public.perf (             -- frame rate samples, never with a player
  id bigint generated always as identity primary key, ts timestamptz not null default now(),
  fps real, low real, drops int, quality text, browser text, platform text, version text
);
create table if not exists public.products (
  id text primary key, kind text not null check (kind in ('booster', 'boat', 'skin')),
  name_no text not null, name_en text not null, price_nok int not null, stripe_price text, active boolean not null default true, data jsonb not null default '{}'
);
create table if not exists public.purchases (        -- kept five years for the books (bokføringsloven § 13); a deleted player leaves it anonymous
  id text primary key,                          -- the Stripe Checkout session
  player_id text references public.players(id) on delete set null,
  product_id text references public.products(id),
  amount_nok int, currency text default 'nok',
  status text not null check (status in ('open', 'paid', 'refunded', 'expired', 'failed')),
  created_at timestamptz not null default now(), paid_at timestamptz, refunded_at timestamptz, payment_intent text
);
create table if not exists public.entitlements (
  player_id text not null references public.players(id) on delete cascade, product_id text not null references public.products(id),
  granted_at timestamptz not null default now(), source text, primary key (player_id, product_id)
);

do $$ declare t text; begin
  foreach t in array array['players', 'saves', 'sessions', 'events', 'errors', 'perf', 'products', 'purchases', 'entitlements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);   -- the rows only through admin_read below
    execute format('drop policy if exists admin_read on public.%I', t);
    execute format('create policy admin_read on public.%I for select to authenticated using (public.is_admin())', t);
  end loop;
end $$;
-- the shop's products are public (active ones)
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated using (active);
grant select on public.products to anon, authenticated;

-- ---------- what the game calls ----------
-- hello: at every start; makes the player row and returns what the game must know (consent asked?, entitlements)
create or replace function public.tm_hello(meta jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare p text := pid(); r public.players;
begin
  if p is null then raise exception 'not signed in'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do update set last_seen = now();
  -- the device and the country only with consent (the privacy page, src/legal/personvern.html): without it the row is the account
  update players set lang = left(meta ->> 'lang', 12), tz = left(meta ->> 'tz', 40), platform = left(meta ->> 'platform', 20),
    browser = left(meta ->> 'browser', 20), pwa = (meta ->> 'pwa')::boolean,
    country = coalesce(left(nullif(current_setting('request.headers', true)::json ->> 'cf-ipcountry', ''), 2), country)
    where id = p and consent is true;
  select * into r from players where id = p;
  return jsonb_build_object('consent', r.consent, 'created', r.created_at, 'birth_year', r.birth_year, 'admin', coalesce(r.game_admin, false),
    'owned', coalesce((select jsonb_agg(product_id) from entitlements where player_id = p), '[]'::jsonb));
end $$;

create or replace function public.tm_consent(yes boolean, birth_year int) returns void language plpgsql security definer set search_path = public as $$
declare p text := pid(); ok boolean;
begin
  if p is null then raise exception 'not signed in'; end if;
  -- under 13 the answer does not count as consent (personopplysningsloven § 5), and the year of birth is kept only with consent
  ok := coalesce(yes, false) and (tm_consent.birth_year is null or tm_consent.birth_year <= extract(year from now())::int - 13);
  update players set consent = ok, consent_at = now(), birth_year = case when ok then coalesce(tm_consent.birth_year, players.birth_year) end
    where id = p;
  -- a no takes back what was gathered under a yes: the sessions and their events, the device, the latest state, the name on errors
  if not ok then
    delete from sessions where player_id = p;
    delete from events where player_id = p;
    update errors set player_id = null, session_id = null where player_id = p;
    update players set lang = null, tz = null, country = null, platform = null, browser = null, pwa = null, home = null, boat = null,
      cash = null, fleet = null, fleet_value = null, streak = null, game_days = null where id = p;
  end if;
end $$;

-- a batch from the game: the session's heartbeat (active seconds since the last batch), the latest state and the events
create or replace function public.tm_batch(sid uuid, meta jsonb, active_s int, evs jsonb, ended boolean, reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); ok boolean; e jsonb; n int := 0;
begin
  if p is null then raise exception 'not signed in'; end if;
  select consent into ok from players where id = p;
  if ok is not true then return; end if;
  insert into sessions (id, player_id, version, browser, platform, pwa, quality)
    values (sid, p, left(meta ->> 'version', 20), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20), (meta ->> 'pwa')::boolean, left(meta ->> 'quality', 12))
    on conflict (id) do nothing;
  update sessions set last_beat = now(), beats = beats + 1, active_s = sessions.active_s + greatest(0, least(coalesce(tm_batch.active_s, 0), 900)),
    ended_at = case when ended then now() else ended_at end, end_reason = case when ended then left(reason, 20) else end_reason end
    where id = sid and player_id = p;
  update players set last_seen = now(), home = left(meta ->> 'home', 30), boat = left(meta ->> 'boat', 20), cash = (meta ->> 'cash')::bigint,
    fleet = (meta ->> 'fleet')::int, fleet_value = (meta ->> 'fleetValue')::bigint, streak = (meta ->> 'streak')::int, game_days = (meta ->> 'gameDays')::int
    where id = p;
  for e in select * from jsonb_array_elements(coalesce(evs, '[]'::jsonb)) loop
    n := n + 1; exit when n > 400;
    insert into events (ts, session_id, player_id, kind, data)
      values (least(now(), greatest(now() - interval '2 days', coalesce(to_timestamp((e ->> 't')::double precision / 1000), now()))),   -- the player's clock, kept within the last two days
            sid, p, left(e ->> 'k', 24), coalesce(e -> 'd', '{}'::jsonb));
  end loop;
end $$;

create or replace function public.tm_error(msg text, src text, stack text, meta jsonb) returns void language plpgsql security definer set search_path = public as $$
declare p text := pid(); ok boolean := false;
begin
  if p is not null then select coalesce(consent, false) into ok from players where id = p; end if;
  insert into errors (player_id, session_id, msg, src, stack, version, browser, platform)
    values (case when ok then p end, case when ok then (meta ->> 'sid')::uuid end, left(msg, 400), left(src, 200), left(stack, 2000),
            left(meta ->> 'version', 20), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20));
end $$;

create or replace function public.tm_perf(fps real, low real, drops int, meta jsonb) returns void language sql security definer set search_path = public as $$
  insert into perf (fps, low, drops, quality, browser, platform, version)
    values (least(fps, 240), least(low, 240), least(drops, 100000), left(meta ->> 'quality', 12), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20), left(meta ->> 'version', 20))
$$;

-- the cloud save: the newest wins; a save older than the one in the cloud is refused and the cloud's comes back
create or replace function public.save_get() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('data', data, 'saved_at', saved_at, 'game_t', game_t) from saves where player_id = pid()), 'null'::jsonb)
$$;
create or replace function public.save_put(data text, saved_at timestamptz, game_t bigint, force boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves;
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(data) > 4000000 then raise exception 'save too large'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  select * into cur from saves where player_id = p;
  if found and cur.saved_at > save_put.saved_at and not force then
    return jsonb_build_object('ok', false, 'cloud', jsonb_build_object('saved_at', cur.saved_at, 'game_t', cur.game_t));
  end if;
  insert into saves (player_id, data, saved_at, game_t, bytes) values (p, save_put.data, save_put.saved_at, save_put.game_t, length(save_put.data))
    on conflict (player_id) do update set data = excluded.data, saved_at = excluded.saved_at, game_t = excluded.game_t, bytes = excluded.bytes, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- «slett kontoen» (GDPR art. 17): everything about the player goes; the purchases stay without a name for the books
create or replace function public.delete_me() returns void language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  delete from errors where player_id = p;
  delete from players where id = p;            -- cascades to saves, sessions, events and entitlements; purchases keep no player
end $$;

revoke all on function public.tm_hello(jsonb), public.tm_consent(boolean, int), public.tm_batch(uuid, jsonb, int, jsonb, boolean, text),
  public.tm_error(text, text, text, jsonb), public.tm_perf(real, real, int, jsonb), public.save_get(), public.save_put(text, timestamptz, bigint, boolean),
  public.delete_me() from public;
grant execute on function public.tm_hello(jsonb), public.tm_consent(boolean, int), public.tm_batch(uuid, jsonb, int, jsonb, boolean, text),
  public.save_get(), public.save_put(text, timestamptz, bigint, boolean), public.delete_me() to authenticated;
grant execute on function public.tm_error(text, text, text, jsonb), public.tm_perf(real, real, int, jsonb) to anon, authenticated;

-- ---------- the admin dashboard's numbers (one call, all panels) ----------
create or replace function public.gini(xs numeric[]) returns numeric language sql immutable set search_path = '' as $$
  with v as (select x, row_number() over (order by x) i, count(*) over () n, sum(x) over () s from unnest(xs) x where x is not null and x >= 0)
  select case when max(n) > 1 and max(s) > 0 then round(((2 * sum(i * x)) / (max(n) * max(s)) - (max(n) + 1.0) / max(n))::numeric, 3) else null end from v
$$;

create or replace function public.admin_dashboard(days int default 30) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(days, 400))); zone text := 'Europe/Oslo'; out jsonb;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  with s as (select * from sessions where started_at >= since),
       days_per as (select player_id, count(distinct (started_at at time zone zone)::date) d from s group by player_id),
       last as (select player_id, max(last_beat) lb from sessions group by player_id),
       wk as (select player_id,
                     sum(active_s) filter (where started_at >= now() - interval '7 days') a7,
                     sum(active_s) filter (where started_at < now() - interval '7 days' and started_at >= now() - interval '14 days') a14
              from sessions where started_at >= now() - interval '14 days' group by player_id),
       pay as (select * from purchases where created_at >= since)
  select jsonb_build_object(
    'generated', now(), 'days', days,
    'overview', jsonb_build_object(
      'players', (select count(*) from players),
      'consented', (select count(*) from players where consent),
      'active_window', (select count(distinct player_id) from s),
      'dau', (select count(distinct player_id) from sessions where last_beat >= now() - interval '1 day'),
      'wau', (select count(distinct player_id) from sessions where last_beat >= now() - interval '7 days'),
      'mau', (select count(distinct player_id) from sessions where last_beat >= now() - interval '30 days'),
      'active_now', (select count(distinct player_id) from sessions where last_beat >= now() - interval '2 minutes' and ended_at is null),
      'play_total_h', (select round(coalesce(sum(active_s), 0) / 3600.0, 1) from sessions),
      'sessions', (select count(*) from s), 'sessions_ended', (select count(*) from s where ended_at is not null),
      'avg_min', (select round(avg(active_s) / 60.0, 1) from s where active_s > 0),
      'median_min', (select round((percentile_cont(0.5) within group (order by active_s) / 60.0)::numeric, 1) from s where active_s > 0),
      'return_ratio', (select round(avg(case when d >= 2 then 1.0 else 0 end), 3) from days_per),
      'streak_avg', (select round(avg(streak), 1) from players where streak is not null),
      'pwa_share', (select round(avg(case when pwa then 1.0 else 0 end), 3) from players where pwa is not null)),
    'daily', coalesce((select jsonb_agg(x order by x ->> 'day') from (
        select jsonb_build_object('day', d, 'hours', round(sum(active_s) / 3600.0, 2), 'sessions', count(*), 'players', count(distinct player_id),
               'browsers', (select jsonb_object_agg(b, c) from (select coalesce(browser, '?') b, count(*) c from s s2 where (s2.started_at at time zone zone)::date = q.d group by 1) bb)) x
        from (select *, (started_at at time zone zone)::date d from s) q group by d) t), '[]'),
    'heatmap', coalesce((select jsonb_agg(jsonb_build_object('dow', dw, 'hour', hr, 'sessions', c, 'hours', h)) from (
        select extract(isodow from started_at at time zone zone)::int dw, extract(hour from started_at at time zone zone)::int hr, count(*) c, round(sum(active_s) / 3600.0, 2) h
        from s group by 1, 2) t), '[]'),
    'months', coalesce((select jsonb_object_agg(m, h) from (select to_char(started_at at time zone zone, 'YYYY-MM') m, round(sum(active_s) / 3600.0, 1) h from sessions group by 1) t), '{}'),
    'churn', coalesce((select jsonb_agg(x order by (x ->> 'index')::int desc) from (
        select jsonb_build_object('player', left(l.player_id, 14), 'days_since', round(extract(epoch from now() - l.lb) / 86400.0, 1),
               'min_7d', round(coalesce(w.a7, 0) / 60.0), 'min_prev_7d', round(coalesce(w.a14, 0) / 60.0),
               'index', least(100, round(100 * (0.6 * least(1, extract(epoch from now() - l.lb) / 86400.0 / 14)
                                     + 0.4 * case when coalesce(w.a14, 0) > 0 then greatest(0, 1 - coalesce(w.a7, 0)::numeric / w.a14) else 0 end)))) x
        from last l left join wk w using (player_id) order by l.lb desc limit 200) t), '[]'),
    'rage', jsonb_build_object(
      'share', (select round(avg(case when end_reason = 'rage' then 1.0 else 0 end), 3) from s where ended_at is not null),
      'after', coalesce((select jsonb_object_agg(coalesce(k, '?'), c) from (select data ->> 'after' k, count(*) c from events where kind = 'rage' and ts >= since group by 1) t), '{}'),
      'where', coalesce((select jsonb_agg(jsonb_build_object('x', round((data ->> 'x')::numeric), 'y', round((data ->> 'y')::numeric), 'n', c)) from (
          select data, count(*) over (partition by round((data ->> 'x')::numeric), round((data ->> 'y')::numeric)) c from events where kind = 'rage' and ts >= since limit 500) t), '[]')),
    'features', coalesce((select jsonb_object_agg(coalesce(k, '?'), c) from (select coalesce(data ->> 'app', kind) k, count(*) c from events where ts >= since and kind in ('app', 'action') group by 1 order by 2 desc limit 40) t), '{}'),
    'gear', coalesce((select jsonb_object_agg(coalesce(k, '?'), c) from (select data ->> 'gear' k, count(*) c from events where ts >= since and kind = 'gear' group by 1) t), '{}'),
    'boats', coalesce((select jsonb_object_agg(coalesce(boat, '?'), c) from (select boat, count(*) c from players group by 1) t), '{}'),
    'groundings', jsonb_build_object(
      'count', (select count(*) from events where ts >= since and kind = 'aground'),
      'by_boat', coalesce((select jsonb_object_agg(coalesce(k, '?'), c) from (select data ->> 'boat' k, count(*) c from events where ts >= since and kind = 'aground' group by 1) t), '{}'),
      'where', coalesce((select jsonb_agg(jsonb_build_object('x', data ->> 'x', 'y', data ->> 'y', 'v', data ->> 'v')) from (select data from events where ts >= since and kind = 'aground' order by ts desc limit 300) t), '[]')),
    'trips', jsonb_build_object(
      'count', (select count(*) from events where ts >= since and kind = 'sale'),
      'avg_trip_min', (select round(avg((data ->> 'tripMin')::numeric)) from events where ts >= since and kind = 'sale'),
      'avg_kr', (select round(avg((data ->> 'kr')::numeric)) from events where ts >= since and kind = 'sale'),
      'ports', coalesce((select jsonb_object_agg(coalesce(k, '?'), c) from (select data ->> 'port' k, count(*) c from events where ts >= since and kind = 'sale' group by 1 order by 2 desc limit 20) t), '{}'),
      'fields', coalesce((select jsonb_object_agg(coalesce(k, '?'), c) from (select data ->> 'field' k, count(*) c from events where ts >= since and kind = 'sale' group by 1 order by 2 desc limit 20) t), '{}')),
    'economy', jsonb_build_object(
      'gini_cash', (select gini(array_agg(cash::numeric)) from players where cash is not null),
      'gini_fleet', (select gini(array_agg(fleet_value::numeric)) from players where fleet_value is not null),
      'cash_p50', (select percentile_cont(0.5) within group (order by cash) from players where cash is not null),
      'cash_p90', (select percentile_cont(0.9) within group (order by cash) from players where cash is not null)),
    'money', jsonb_build_object(
      'revenue_nok', (select coalesce(sum(amount_nok), 0) from pay where status = 'paid'),
      'payers', (select count(distinct player_id) from pay where status = 'paid'),
      'arpu', (select round(coalesce(sum(amount_nok), 0)::numeric / nullif((select count(distinct player_id) from s), 0), 2) from pay where status = 'paid'),
      'conversion', (select round(count(distinct player_id)::numeric / nullif((select count(distinct player_id) from s), 0), 4) from pay where status = 'paid'),
      'repurchase', (select round(avg(case when c >= 2 then 1.0 else 0 end), 3) from (select player_id, count(*) c from purchases where status = 'paid' group by 1) t),
      'ttfp_days', (select round((percentile_cont(0.5) within group (order by extract(epoch from f.first - p.created_at) / 86400.0))::numeric, 1)
                    from (select player_id, min(paid_at) first from purchases where status = 'paid' group by 1) f join players p on p.id = f.player_id),
      'refund_rate', (select round(avg(case when status = 'refunded' then 1.0 else 0 end), 4) from pay where status in ('paid', 'refunded')),
      'abandon_rate', (select round(avg(case when status in ('open', 'expired') then 1.0 else 0 end), 4) from pay),
      'boosters', coalesce((select jsonb_object_agg(pr.id, c) from (select product_id, count(*) c from pay where status = 'paid' group by 1) t join products pr on pr.id = t.product_id where pr.kind = 'booster'), '{}'),
      'log', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'player', left(player_id, 14), 'product', product_id, 'nok', amount_nok, 'status', status, 'at', created_at) order by created_at desc) from (select * from purchases order by created_at desc limit 50) t), '[]')),
    'tech', jsonb_build_object(
      'errors', coalesce((select jsonb_agg(x) from (select jsonb_build_object('msg', msg, 'n', count(*), 'last', max(ts), 'versions', array_agg(distinct version)) x from errors where ts >= since group by msg order by count(*) desc limit 30) t), '[]'),
      'fps', coalesce((select jsonb_agg(x) from (select jsonb_build_object('platform', platform, 'quality', quality, 'fps', round(avg(fps)::numeric, 1), 'low', round(avg(low)::numeric, 1), 'drops', round(avg(drops)::numeric, 1), 'n', count(*)) x from perf where ts >= since group by platform, quality) t), '[]'),
      'browsers', coalesce((select jsonb_object_agg(coalesce(browser, '?'), c) from (select browser, count(*) c from s group by 1) t), '{}'),
      'platforms', coalesce((select jsonb_object_agg(coalesce(platform, '?'), c) from (select platform, count(*) c from s group by 1) t), '{}')),
    'geo', jsonb_build_object(
      'countries', coalesce((select jsonb_object_agg(coalesce(country, '?'), c) from (select country, count(*) c from players group by 1) t), '{}'),
      'timezones', coalesce((select jsonb_object_agg(coalesce(tz, '?'), c) from (select tz, count(*) c from players group by 1 order by 2 desc limit 20) t), '{}'),
      'homes', coalesce((select jsonb_object_agg(coalesce(home, '?'), c) from (select home, count(*) c from players group by 1 order by 2 desc limit 30) t), '{}'))
  ) into out;
  return out;
end $$;
revoke all on function public.admin_dashboard(int) from public;
grant execute on function public.admin_dashboard(int) to authenticated;

-- ---------- keep it no longer than needed: raw measurements 13 months (docs/lansering.md E) ----------
do $$ begin
  create extension if not exists pg_cron;
  perform cron.schedule('dsb-retention', '17 3 * * *', $c$
    delete from public.events where ts < now() - interval '13 months';
    delete from public.sessions where started_at < now() - interval '13 months';
    delete from public.errors where ts < now() - interval '13 months';
    delete from public.perf where ts < now() - interval '13 months';
  $c$);
exception when others then raise notice 'pg_cron is not enabled: turn it on under Database → Extensions and run this block again';
end $$;

-- ---------- Supabase's default privileges ----------
-- New tables, sequences and functions in public come with every right for anon and authenticated. The tables above take theirs
-- back one by one; this takes back the rest. TRUNCATE is not stopped by row level security, so the admin list is closed outright
-- (is_admin() reads it as its owner), and anon keeps only the two anonymous reports.
revoke all on public.admins from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon;
revoke execute on function public.pid(), public.is_admin(), public.gini(numeric[]) from public;
grant execute on function public.pid(), public.is_admin(), public.gini(numeric[]) to authenticated;
grant execute on function public.tm_error(text, text, text, jsonb), public.tm_perf(real, real, int, jsonb) to anon;
