-- Ø6 ryddejobbene 9, 10 og 12 (05.11.2026, docs/planer/sikkerhet-skyen.md; Jonas: «Kjør på ryddejobbene 8–12 og 15»).
--
-- Funn 9: what could be written without a sign-in, or in any size, had no ceiling and could fill the database (500 MB on the free plan)
-- and wake Jonas with «new errors» (err_alert). The ceilings are far above what the game sends today (05.11.2026: at most 3 errors
-- and 3 frame rate samples a minute, 20 errors and 1 283 samples a day, the largest event 469 bytes, the longest feedback 627
-- characters), and the hourly ones grow with the players seen in the last hour, so a bigger game is not cut off:
--   * tm_error keeps at most 30 + the active players a minute and 200 + 20 per active player an hour; past that it drops, quietly;
--   * tm_perf keeps at most 500 + 60 per active player an hour;
--   * tm_batch keeps an event's data only up to 4 000 bytes (a larger one is kept as {}).
-- (A feedback's text and topic already had their limits in the table: body 1–4 000 characters and the topics, 20261005180000_feedback.sql;
-- the review said otherwise, wrongly.)
-- Funn 10: a guest is not seen by the other players (pos_world, pos_near), so a guest's berth no longer holds a place from an account:
-- berth_put lets an account take a berth a guest holds, and berth_get does not show the guests' berths to the accounts. The 30 berths a
-- player (a company's fleet and its plans' homes, Jonas 23.10.2026) stay.
-- Funn 12: the rights as the migrations meant them. Supabase gives anon the right to run every new function, past «revoke … from
-- public»; it is taken from those that never were for anon (all of them check pid() or is_admin(), so none was a hole), and new
-- functions no longer get it by default. tm_error, tm_perf and sp_now stay open to anon on purpose. The four tables reached only
-- through functions lose the rights anon and authenticated had on them (RLS without a policy held them shut). world_gh gets a fixed
-- search_path.

-- ---------- funn 9 ----------
create or replace function public.tm_active() returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from players where last_seen > now() - interval '1 hour'
$$;
revoke all on function public.tm_active() from public, anon, authenticated;

create or replace function public.tm_error(msg text, src text, stack text, meta jsonb) returns void language plpgsql security definer set search_path = public as $$
declare p text := pid(); ok boolean := false; a int := tm_active();
begin
  if (select count(*) from errors where ts > now() - interval '1 minute') >= 30 + a
     or (select count(*) from errors where ts > now() - interval '1 hour') >= 200 + 20 * a then return; end if;
  if p is not null then select coalesce(consent, false) into ok from players where id = p; end if;
  insert into errors (player_id, session_id, msg, src, stack, version, browser, platform, gpu, scr, lvl)
    values (case when ok then p end, case when ok then (meta ->> 'sid')::uuid end, left(msg, 400), left(src, 200), left(stack, 2000),
            left(meta ->> 'version', 20), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20), left(meta ->> 'gpu', 80), left(meta ->> 'scr', 24), tm_num(meta ->> 'lvl', -1, 9)::smallint);
end $$;

create or replace function public.tm_perf(fps real, low real, drops int, meta jsonb) returns void language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from perf where ts > now() - interval '1 hour') >= 500 + 60 * tm_active() then return; end if;
  insert into perf (fps, low, drops, quality, browser, platform, version, gpu, cores, mem, scr, lvl, view)
    values (least(fps, 240), least(low, 240), least(drops, 100000), left(meta ->> 'quality', 12), left(meta ->> 'browser', 20), left(meta ->> 'platform', 20), left(meta ->> 'version', 20),
            left(meta ->> 'gpu', 80), tm_num(meta ->> 'cores', 0, 256)::smallint, tm_num(meta ->> 'mem', 0, 64), left(meta ->> 'scr', 24), tm_num(meta ->> 'lvl', -1, 9)::smallint, left(meta ->> 'view', 8));
end $$;

create or replace function public.tm_batch(sid uuid, meta jsonb, active_s integer, evs jsonb, ended boolean, reason text) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); ok boolean; e jsonb; n int := 0; d jsonb;
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
    d := coalesce(e -> 'd', '{}'::jsonb); if octet_length(d::text) > 4000 then d := '{}'::jsonb; end if;
    insert into events (ts, session_id, player_id, kind, data)
      values (least(now(), greatest(now() - interval '2 days', coalesce(to_timestamp((e ->> 't')::double precision / 1000), now()))),
            sid, p, left(e ->> 'k', 24), d);
  end loop;
end $$;

-- ---------- funn 10 ----------
create or replace function public.berth_get(hid text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('slot', b.slot, 'x', b.x, 'y', b.y, 'hd', b.hd, 'len', b.len, 'beam', b.beam,
           'mine', b.player_id = pid())), '[]'::jsonb)
    from berths b where b.hid = berth_get.hid and b.at > now() - interval '30 days'
      -- an account does not see the guests' berths: a guest's boat is not seen by the others, and its place gives way (berth_put)
      and (b.player_id = pid() or is_guest() or not exists (select 1 from players pl where pl.id = b.player_id and pl.guest))
$$;

create or replace function public.berth_put(slot text, hid text, vessel text, x real, y real, hd real, len real, beam real) returns text
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare p text := pid(); o text; og boolean;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if berth_put.slot is null or length(berth_put.slot) > 120 or berth_put.hid is null or length(berth_put.hid) > 40 then raise exception 'bad slot'; end if;
  if berth_put.x is null or berth_put.y is null or berth_put.x <> berth_put.x or berth_put.y <> berth_put.y or abs(berth_put.x) > 5000 or abs(berth_put.y) > 5000 then raise exception 'bad position'; end if;
  if is_guest() then update players set guest = true where id = p and not guest; end if;
  select b.player_id, coalesce(pl.guest, false) into o, og from berths b left join players pl on pl.id = b.player_id
   where b.slot = berth_put.slot and b.at > now() - interval '30 days';
  -- a guest's berth gives way to an account; an account's never to anyone else
  if o is not null and o <> p and not (og and not is_guest()) then return 'taken'; end if;
  if (o is null or o <> p) and (select count(*) from berths b where b.player_id = p and b.at > now() - interval '30 days') >= 30 then return 'full'; end if;
  insert into berths (slot, hid, player_id, vessel, x, y, hd, len, beam, at)
    values (berth_put.slot, berth_put.hid, p, left(regexp_replace(coalesce(berth_put.vessel, ''), '[^A-Za-z0-9_-]', '', 'g'), 24), berth_put.x, berth_put.y,
            coalesce(berth_put.hd, 0), least(greatest(coalesce(berth_put.len, 10), 2), 120), least(greatest(coalesce(berth_put.beam, 3), 1), 30), now())
    on conflict (slot) do update set hid = excluded.hid, player_id = excluded.player_id, vessel = excluded.vessel, x = excluded.x, y = excluded.y,
      hd = excluded.hd, len = excluded.len, beam = excluded.beam, at = excluded.at;
  return 'ok';
end $$;

-- ---------- funn 12 ----------
-- (from public too: three of them had the right through PUBLIC, not through anon; authenticated has its own grant on each)
revoke execute on function public.admin_cash_flags(int), public.admin_tur_share(int), public.guest_claim(), public.guest_merge(text),
  public.push_plan(jsonb) from public, anon;
revoke all on function public.saves_cash_check() from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon;
revoke all on table public.berths, public.cash_flags, public.sponsors, public.sponsor_placements from anon, authenticated;
alter function public.world_gh() set search_path = '';
