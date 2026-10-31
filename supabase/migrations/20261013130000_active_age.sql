-- The world goes on with the screen off (Jonas 13.10.2026: «dette er et online-spill som skal fungere mens skjermen er av også»): the
-- beat and the head also tell how long ago the active device was last heard from (active_age, seconds), so a device opened again while
-- the one that had the game is silent (its screen off, closed) takes the game back by itself, the time away played to the world's clock,
-- instead of standing paused behind a device that is not running.
create or replace function public.save_beat(device text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); cur public.saves; dv text := left(regexp_replace(coalesce(save_beat.device, ''), '[^A-Za-z0-9_-]', '', 'g'), 40);
begin
  if p is null then raise exception 'not signed in'; end if;
  select * into cur from saves s where s.player_id = p;
  if not found then return 'null'::jsonb; end if;
  if cur.active_dev is null then
    update saves set active_dev = nullif(dv, ''), active_at = now(), active_since = now() where player_id = p;
    cur.active_dev := nullif(dv, ''); cur.active_since := now(); cur.active_at := now();
  elsif cur.active_dev = dv then update saves set active_at = now() where player_id = p;
  end if;
  return jsonb_build_object('rev', cur.rev, 'saved_at', cur.saved_at, 'game_t', cur.game_t, 'summary', cur.summary, 'device', cur.device,
    'device_name', cur.device_name, 'updated_at', cur.updated_at, 'active_dev', cur.active_dev, 'active_name', cur.active_name,
    'active_since', cur.active_since, 'active_age', case when cur.active_at is null then null else extract(epoch from now() - cur.active_at) end, 'now', now());
end $$;

create or replace function public.save_head() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('rev', rev, 'saved_at', saved_at, 'game_t', game_t, 'summary', summary, 'device', device,
    'device_name', device_name, 'device_at', device_at, 'updated_at', updated_at, 'active_dev', active_dev, 'active_name', active_name,
    'active_since', active_since, 'active_age', case when active_at is null then null else extract(epoch from now() - active_at) end, 'now', now())
    from saves where player_id = pid()), 'null'::jsonb)
$$;
