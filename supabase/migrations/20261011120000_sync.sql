-- Seamless play between devices (Jonas 11.10.2026: «Mange brukere opplever at det blir tull om de hopper mellom ulike enheter»).
-- Until now a save was compared by the time the device itself wrote on it, and a device that had not met the newest cloud save was told
-- apart by that time too. Now the server counts: every accepted save gets the next revision (saves.rev), the save says which device made
-- it (device, a random id the game keeps on the device, and device_name, «iPhone», «Android», «PC», for the dialogs), and:
--   * save_put3 takes base_rev, the revision the game on the device comes from. The cloud having moved on (another device saved) is
--     refused with the cloud's revision, device and summary, and the game asks the player (moved = another device made it). Only a forced
--     save (the player chose this game, or took an earlier one back) writes over it, and the game written over goes to the history.
--   * save_head is the save without the game: the game asks it when it comes back to the foreground, so a device left open learns that
--     another one has been played before it saves anything.
--   * save_get tells the revision, the device and the server's own time of the save (updated_at, one clock for every device).
--   * save_put2 and save_put (pages still running older code) bump the revision too, with no device, so the newer pages notice them.

alter table public.saves add column if not exists rev bigint not null default 0;
alter table public.saves add column if not exists device text;
alter table public.saves add column if not exists device_name text;
alter table public.saves add column if not exists device_at timestamptz;

create or replace function public.save_put3(data text, saved_at timestamptz, game_t bigint, base_rev bigint, force boolean, summary jsonb,
                                            device text, device_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves; stamp timestamptz; r bigint; dv text := left(regexp_replace(coalesce(save_put3.device, ''), '[^A-Za-z0-9_-]', '', 'g'), 40);
  dn text := left(regexp_replace(coalesce(save_put3.device_name, ''), '[^A-Za-z0-9 ÆØÅæøå._-]', '', 'g'), 24);
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(save_put3.data) > 4000000 then raise exception 'save too large'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  select * into cur from saves s where s.player_id = p;
  -- the cloud has moved on since this device last met it: never over it without the player's word
  if found and cur.rev is distinct from save_put3.base_rev and not save_put3.force then
    return jsonb_build_object('ok', false, 'moved', cur.device is distinct from nullif(dv, ''),
      'cloud', jsonb_build_object('rev', cur.rev, 'saved_at', cur.saved_at, 'game_t', cur.game_t, 'summary', cur.summary, 'device', cur.device,
        'device_name', cur.device_name, 'device_at', cur.device_at, 'updated_at', cur.updated_at));
  end if;
  if found and save_put3.force then perform save_keep(p, cur.data, cur.saved_at, cur.game_t, cur.summary, true); end if;
  r := coalesce(cur.rev, 0) + 1;
  insert into saves (player_id, data, saved_at, game_t, bytes, summary, rev, device, device_name, device_at)
    values (p, save_put3.data, save_put3.saved_at, save_put3.game_t, length(save_put3.data), save_put3.summary, r, nullif(dv, ''), nullif(dn, ''), now())
    on conflict (player_id) do update set data = excluded.data, saved_at = excluded.saved_at, game_t = excluded.game_t, bytes = excluded.bytes,
      summary = excluded.summary, rev = excluded.rev, device = excluded.device, device_name = excluded.device_name, device_at = excluded.device_at, updated_at = now()
    returning saves.saved_at into stamp;
  perform save_keep(p, save_put3.data, save_put3.saved_at, save_put3.game_t, save_put3.summary, false);
  return jsonb_build_object('ok', true, 'rev', r, 'saved_at', stamp, 'updated_at', now());
end $$;

-- the save without the game: the revision, who made it and when
create or replace function public.save_head() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('rev', rev, 'saved_at', saved_at, 'game_t', game_t, 'summary', summary, 'device', device,
    'device_name', device_name, 'device_at', device_at, 'updated_at', updated_at) from saves where player_id = pid()), 'null'::jsonb)
$$;
create or replace function public.save_get() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('data', data, 'saved_at', saved_at, 'game_t', game_t, 'summary', summary, 'rev', rev, 'device', device,
    'device_name', device_name, 'updated_at', updated_at) from saves where player_id = pid()), 'null'::jsonb)
$$;

-- the older puts bump the revision (and leave no device), so a page with the newer code sees that the cloud has moved
create or replace function public.save_put2(data text, saved_at timestamptz, game_t bigint, base timestamptz, force boolean, summary jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves; stamp timestamptz;
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(save_put2.data) > 4000000 then raise exception 'save too large'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  select * into cur from saves s where s.player_id = p;
  if found and cur.saved_at is distinct from save_put2.base and not force then
    return jsonb_build_object('ok', false, 'cloud', jsonb_build_object('saved_at', cur.saved_at, 'game_t', cur.game_t, 'summary', cur.summary));
  end if;
  if found and force then perform save_keep(p, cur.data, cur.saved_at, cur.game_t, cur.summary, true); end if;
  insert into saves (player_id, data, saved_at, game_t, bytes, summary, rev)
    values (p, save_put2.data, save_put2.saved_at, save_put2.game_t, length(save_put2.data), save_put2.summary, 1)
    on conflict (player_id) do update set data = excluded.data, saved_at = excluded.saved_at, game_t = excluded.game_t, bytes = excluded.bytes,
      summary = excluded.summary, rev = saves.rev + 1, device = null, device_name = null, device_at = null, updated_at = now()
    returning saves.saved_at into stamp;
  perform save_keep(p, save_put2.data, save_put2.saved_at, save_put2.game_t, save_put2.summary, false);
  return jsonb_build_object('ok', true, 'saved_at', stamp);
end $$;
create or replace function public.save_put(data text, saved_at timestamptz, game_t bigint, force boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves;
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(data) > 4000000 then raise exception 'save too large'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  select * into cur from saves where player_id = p;
  if found and (cur.saved_at > save_put.saved_at or cur.summary is not null) and not force then
    return jsonb_build_object('ok', false, 'cloud', jsonb_build_object('saved_at', cur.saved_at, 'game_t', cur.game_t));
  end if;
  if found then perform save_keep(p, cur.data, cur.saved_at, cur.game_t, cur.summary, force or cur.summary is not null); end if;
  insert into saves (player_id, data, saved_at, game_t, bytes, rev) values (p, save_put.data, save_put.saved_at, save_put.game_t, length(save_put.data), 1)
    on conflict (player_id) do update set data = excluded.data, saved_at = excluded.saved_at, game_t = excluded.game_t, bytes = excluded.bytes,
      rev = saves.rev + 1, device = null, device_name = null, device_at = null, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.save_put3(text, timestamptz, bigint, bigint, boolean, jsonb, text, text), public.save_head() from public, anon;
grant execute on function public.save_put3(text, timestamptz, bigint, bigint, boolean, jsonb, text, text), public.save_head() to authenticated;
revoke all on function public.save_put2(text, timestamptz, bigint, timestamptz, boolean, jsonb), public.save_put(text, timestamptz, bigint, boolean), public.save_get() from public, anon;
grant execute on function public.save_put2(text, timestamptz, bigint, timestamptz, boolean, jsonb), public.save_put(text, timestamptz, bigint, boolean), public.save_get() to authenticated;
