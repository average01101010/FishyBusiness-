-- The cloud save without lost games (05.10.2026; Jonas: «Har plutselig mistet progresjon og fått denne båten igjen. Hvorfor?»).
-- Until now the newest save by the clock won (save_put), and every save is stamped with the time it was made. A device with an old game
-- left open (a phone in the background) saved it every three minutes, so it was always «newest», and the next start on the tablet pulled
-- it over the game played there. Now:
--   * save_put2 takes the cloud revision the game on the device comes from (base: the saved_at of the cloud save it last pulled or put).
--     When the cloud has moved on since (another device saved), it is refused, and the game asks the player which to keep, with what each
--     is (save summaries: day, money, boat). Only a «keep this one» (force) writes over it.
--   * the history: the last ten saves per player are kept (one each half hour, and always the one a forced save replaces), so a game can
--     be taken back from the settings (save_hist_list, save_hist_get). They go with the account (on delete cascade).
-- save_put (the old one, for pages still running the old code) keeps working, but does not write over a save from the new code unless
-- forced, and then keeps it; otherwise it keeps a copy of what it replaces once each half hour.

alter table public.saves add column if not exists summary jsonb;
create table if not exists public.save_hist (
  id bigint generated always as identity primary key,
  player_id text not null references public.players(id) on delete cascade,
  saved_at timestamptz not null, game_t bigint, summary jsonb not null default '{}',
  data text not null, created_at timestamptz not null default now()
);
create index if not exists save_hist_player on public.save_hist (player_id, created_at desc);
alter table public.save_hist enable row level security;
revoke all on public.save_hist from anon, authenticated;

-- a copy into the history: always (keep = true) or at most one each half hour; the ten newest are kept
create or replace function public.save_keep(p text, d text, sa timestamptz, gt bigint, sm jsonb, keep boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if keep or not exists (select 1 from save_hist h where h.player_id = p and h.created_at > now() - interval '30 minutes') then
    insert into save_hist (player_id, saved_at, game_t, summary, data) values (p, sa, gt, coalesce(sm, '{}'::jsonb), d);
  end if;
  delete from save_hist h where h.player_id = p and h.id not in (select h2.id from save_hist h2 where h2.player_id = p order by h2.created_at desc, h2.id desc limit 10);
end $$;

create or replace function public.save_put2(data text, saved_at timestamptz, game_t bigint, base timestamptz, force boolean, summary jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves; stamp timestamptz;
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(save_put2.data) > 4000000 then raise exception 'save too large'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  select * into cur from saves s where s.player_id = p;
  -- the cloud has moved on since this device last met it: never over it without the player's word
  if found and cur.saved_at is distinct from save_put2.base and not force then
    return jsonb_build_object('ok', false, 'cloud', jsonb_build_object('saved_at', cur.saved_at, 'game_t', cur.game_t, 'summary', cur.summary));
  end if;
  -- a forced save (the player chose this game, or took an earlier one back): the game written over can be taken back
  if found and force then perform save_keep(p, cur.data, cur.saved_at, cur.game_t, cur.summary, true); end if;
  insert into saves (player_id, data, saved_at, game_t, bytes, summary)
    values (p, save_put2.data, save_put2.saved_at, save_put2.game_t, length(save_put2.data), save_put2.summary)
    on conflict (player_id) do update set data = excluded.data, saved_at = excluded.saved_at, game_t = excluded.game_t, bytes = excluded.bytes,
      summary = excluded.summary, updated_at = now()
    returning saves.saved_at into stamp;
  perform save_keep(p, save_put2.data, save_put2.saved_at, save_put2.game_t, save_put2.summary, false);
  return jsonb_build_object('ok', true, 'saved_at', stamp);
end $$;

-- the old put: as before (the newest by the clock), but never over a save from save_put2 unless forced
create or replace function public.save_put(data text, saved_at timestamptz, game_t bigint, force boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves;
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(data) > 4000000 then raise exception 'save too large'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  select * into cur from saves where player_id = p;
  -- a save made by the new code (it has a summary) is never written over from here without the player's word: an old page left open
  -- on another device is exactly what lost Jonas's game
  if found and (cur.saved_at > save_put.saved_at or cur.summary is not null) and not force then
    return jsonb_build_object('ok', false, 'cloud', jsonb_build_object('saved_at', cur.saved_at, 'game_t', cur.game_t));
  end if;
  if found then perform save_keep(p, cur.data, cur.saved_at, cur.game_t, cur.summary, force or cur.summary is not null); end if;
  insert into saves (player_id, data, saved_at, game_t, bytes) values (p, save_put.data, save_put.saved_at, save_put.game_t, length(save_put.data))
    on conflict (player_id) do update set data = excluded.data, saved_at = excluded.saved_at, game_t = excluded.game_t, bytes = excluded.bytes, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.save_get() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('data', data, 'saved_at', saved_at, 'game_t', game_t, 'summary', summary) from saves where player_id = pid()), 'null'::jsonb)
$$;
-- the history, newest first, without the games themselves; and one of them
create or replace function public.save_hist_list() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'saved_at', saved_at, 'game_t', game_t, 'summary', summary, 'at', created_at) order by created_at desc, id desc), '[]'::jsonb)
    from save_hist where player_id = pid()
$$;
create or replace function public.save_hist_get(hid bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('data', data, 'saved_at', saved_at, 'game_t', game_t, 'summary', summary) from save_hist where id = hid and player_id = pid()), 'null'::jsonb)
$$;

revoke all on function public.save_keep(text, text, timestamptz, bigint, jsonb, boolean), public.save_put2(text, timestamptz, bigint, timestamptz, boolean, jsonb),
  public.save_hist_list(), public.save_hist_get(bigint) from public, anon, authenticated;
grant execute on function public.save_put2(text, timestamptz, bigint, timestamptz, boolean, jsonb), public.save_hist_list(), public.save_hist_get(bigint) to authenticated;
revoke all on function public.save_put(text, timestamptz, bigint, boolean), public.save_get() from public, anon;
grant execute on function public.save_put(text, timestamptz, bigint, boolean), public.save_get() to authenticated;
