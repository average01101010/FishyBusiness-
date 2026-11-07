-- One device plays at a time (Jonas 13.10.2026: «Det skal ikke kunne være mulig å spille på to enheter samtidig … Lagringen mellom
-- enhetene må være 100% bulletproof og oppdatert til enhver tid»). The account has an active device (saves.active_dev):
--   * save_claim: a device that starts the game (or the player chooses «Spill her») takes it. It is told which device had it and how
--     long ago that one was last heard from (prev_age, seconds), so it can wait a moment for that device's last save.
--   * save_beat: the active device says it is there, every few seconds while the game is on the screen; any device is told who has the
--     game now, the revision and the server's time. A device that finds another one active stops playing (ui/10f-cloud.js).
--   * save_put4: as save_put3, and a save from a device that is not the active one is refused (taken), unless it is the hand-over: the
--     device that had the game sends its very last state after the other took it (handoff), only while no save has been made since
--     (base_rev is the newest), and the game stays with the device that took it. An accepted save makes its device the active one.
--   * save_put3 (pages with the code before this) is refused the same way when another device has the game.

alter table public.saves add column if not exists active_dev text;
alter table public.saves add column if not exists active_name text;
alter table public.saves add column if not exists active_at timestamptz;      -- last heard from the active device
alter table public.saves add column if not exists active_since timestamptz;   -- when it took the game

create or replace function public.save_claim(device text, device_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves; dv text := left(regexp_replace(coalesce(save_claim.device, ''), '[^A-Za-z0-9_-]', '', 'g'), 40);
  dn text := left(regexp_replace(coalesce(save_claim.device_name, ''), '[^A-Za-z0-9 ÆØÅæøå._-]', '', 'g'), 24);
begin
  if p is null then raise exception 'not signed in'; end if;
  select * into cur from saves s where s.player_id = p for update;
  if not found then return jsonb_build_object('ok', false, 'now', now()); end if;
  update saves set active_dev = nullif(dv, ''), active_name = nullif(dn, ''), active_at = now(),
    active_since = case when cur.active_dev is distinct from nullif(dv, '') then now() else coalesce(cur.active_since, now()) end
    where player_id = p;
  return jsonb_build_object('ok', true, 'rev', cur.rev, 'now', now(), 'prev_dev', cur.active_dev, 'prev_name', cur.active_name,
    'prev_age', case when cur.active_at is null then null else extract(epoch from now() - cur.active_at) end);
end $$;

create or replace function public.save_beat(device text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves; dv text := left(regexp_replace(coalesce(save_beat.device, ''), '[^A-Za-z0-9_-]', '', 'g'), 40);
begin
  if p is null then raise exception 'not signed in'; end if;
  select * into cur from saves s where s.player_id = p;
  if not found then return 'null'::jsonb; end if;
  if cur.active_dev is null then
    update saves set active_dev = nullif(dv, ''), active_at = now(), active_since = now() where player_id = p;
    cur.active_dev := nullif(dv, ''); cur.active_since := now();
  elsif cur.active_dev = dv then update saves set active_at = now() where player_id = p;
  end if;
  return jsonb_build_object('rev', cur.rev, 'saved_at', cur.saved_at, 'game_t', cur.game_t, 'summary', cur.summary, 'device', cur.device,
    'device_name', cur.device_name, 'updated_at', cur.updated_at, 'active_dev', cur.active_dev, 'active_name', cur.active_name,
    'active_since', cur.active_since, 'now', now());
end $$;

create or replace function public.save_head() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('rev', rev, 'saved_at', saved_at, 'game_t', game_t, 'summary', summary, 'device', device,
    'device_name', device_name, 'device_at', device_at, 'updated_at', updated_at, 'active_dev', active_dev, 'active_name', active_name,
    'active_since', active_since, 'now', now()) from saves where player_id = pid()), 'null'::jsonb)
$$;

create or replace function public.save_put4(data text, saved_at timestamptz, game_t bigint, base_rev bigint, force boolean, summary jsonb,
                                            device text, device_name text, handoff boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves; stamp timestamptz; r bigint; dv text := left(regexp_replace(coalesce(save_put4.device, ''), '[^A-Za-z0-9_-]', '', 'g'), 40);
  dn text := left(regexp_replace(coalesce(save_put4.device_name, ''), '[^A-Za-z0-9 ÆØÅæøå._-]', '', 'g'), 24); other boolean;
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(save_put4.data) > 4000000 then raise exception 'save too large'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  select * into cur from saves s where s.player_id = p for update;
  other := found and cur.active_dev is not null and cur.active_dev is distinct from nullif(dv, '');
  -- the cloud has moved on since this device last met it, or another device has the game: never over it without the player's word
  -- (the hand-over excepted: the last state of the device that had the game, while nothing has been saved since)
  if found and not save_put4.force and (cur.rev is distinct from save_put4.base_rev or (other and not save_put4.handoff)) then
    return jsonb_build_object('ok', false, 'moved', cur.device is distinct from nullif(dv, ''), 'taken', other,
      'cloud', jsonb_build_object('rev', cur.rev, 'saved_at', cur.saved_at, 'game_t', cur.game_t, 'summary', cur.summary, 'device', cur.device,
        'device_name', cur.device_name, 'device_at', cur.device_at, 'updated_at', cur.updated_at, 'active_dev', cur.active_dev,
        'active_name', cur.active_name, 'active_since', cur.active_since));
  end if;
  if found and save_put4.force then perform save_keep(p, cur.data, cur.saved_at, cur.game_t, cur.summary, true); end if;
  r := coalesce(cur.rev, 0) + 1;
  insert into saves (player_id, data, saved_at, game_t, bytes, summary, rev, device, device_name, device_at, active_dev, active_name, active_at, active_since)
    values (p, save_put4.data, save_put4.saved_at, save_put4.game_t, length(save_put4.data), save_put4.summary, r, nullif(dv, ''), nullif(dn, ''), now(),
            nullif(dv, ''), nullif(dn, ''), now(), now())
    on conflict (player_id) do update set data = excluded.data, saved_at = excluded.saved_at, game_t = excluded.game_t, bytes = excluded.bytes,
      summary = excluded.summary, rev = excluded.rev, device = excluded.device, device_name = excluded.device_name, device_at = excluded.device_at,
      updated_at = now(),
      -- a save makes its device the active one; the hand-over leaves the game with the device that took it
      active_dev = case when save_put4.handoff and other then saves.active_dev else excluded.active_dev end,
      active_name = case when save_put4.handoff and other then saves.active_name else excluded.active_name end,
      active_at = case when save_put4.handoff and other then saves.active_at else now() end,
      active_since = case when save_put4.handoff and other then saves.active_since
                          when saves.active_dev is distinct from excluded.active_dev then now() else coalesce(saves.active_since, now()) end
    returning saves.saved_at into stamp;
  perform save_keep(p, save_put4.data, save_put4.saved_at, save_put4.game_t, save_put4.summary, false);
  return jsonb_build_object('ok', true, 'rev', r, 'saved_at', stamp, 'updated_at', now());
end $$;

-- the put of the pages from before: also refused when another device has the game
create or replace function public.save_put3(data text, saved_at timestamptz, game_t bigint, base_rev bigint, force boolean, summary jsonb,
                                            device text, device_name text) returns jsonb
language sql security definer set search_path = public as $$
  select public.save_put4(save_put3.data, save_put3.saved_at, save_put3.game_t, save_put3.base_rev, save_put3.force, save_put3.summary,
                          save_put3.device, save_put3.device_name, false)
$$;

revoke all on function public.save_claim(text, text), public.save_beat(text), public.save_put4(text, timestamptz, bigint, bigint, boolean, jsonb, text, text, boolean) from public, anon;
grant execute on function public.save_claim(text, text), public.save_beat(text), public.save_put4(text, timestamptz, bigint, bigint, boolean, jsonb, text, text, boolean) to authenticated;
