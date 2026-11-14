-- The haill a save has is kept when it is brought over to the server (HS4, valg 36; Jonas 12.11.2026, asked before the release that
-- brings HS4 to the players: «La alle spillere som har haill beholde det.»). 20261111140000_haill_srv.sql capped the import at 2 haill
-- and 1 luksus from the save's own numbers (the pub and the chapter), plus what the server had delivered into the save; a player who
-- had saved more from the pub would have lost the rest, once and for good. Now every haill, luksus and thank-you haill in the save is
-- brought over, up to 1 000 of a kind (a bound no honest save reaches: the pub gives at most one an evening, and the game has had some
-- 230 game evenings by now). The yard done now («Ferdig nå») credits stay as they were: only those the server itself delivered.
-- Everything else in haill_import is as in 20261111140000_haill_srv.sql: once per account, the haill aboard as used and never later
-- than the server's minute. Nothing else is changed. tests/sqltest.py HS4.

create or replace function public.haill_import(inv jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int; cap int; out jsonb := '{"ok":true}'::jsonb; ty text; ot text := inv -> 'on' ->> 'type'; ot0 double precision;
  num constant text := '^-?[0-9]+(\.[0-9]+)?$';
begin
  if p is null then raise exception 'not signed in'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  insert into haill_once (player_id, what, data) values (p, 'import', case when length(inv::text) <= 400 then inv end) on conflict do nothing;
  if not found then return jsonb_build_object('ok', false); end if;
  foreach ty in array array['haill', 'luksus', 'takk', 'yard'] loop
    -- (the haill of every kind the save has is kept, up to 1 000 of a kind, a bound only a number written into the save can reach;
    -- the yard credit as before: only what this server delivered into the save before it kept them, used_at = done_at)
    select count(*) into cap from grants g where g.player_id = p and g.revoked_at is null and g.used_at is not null and g.used_at = g.done_at
       and g.product_id not like 'imp\_%' and case when ty = 'yard' then g.data ->> 'give' = 'yard' else g.data ->> 'give' = 'haill' and g.data ->> 'type' = ty end;
    cap := case when ty = 'yard' then cap else 1000 end;
    -- the haill aboard when the save came over: one, as used, with its minute (never later than now), and within the cap of its kind
    if ty = ot and ty <> 'yard' and cap > 0 then
      ot0 := case when (inv -> 'on' ->> 't0') ~ num then (inv -> 'on' ->> 't0')::double precision else game_min() end;
      insert into grants (player_id, product_id, data, done_at, used_at, t0) select p, pr.id, pr.data, now(), now(), least(ot0, game_min()) from products pr where pr.id = 'imp_' || ot;
      out := out || jsonb_build_object('on', ot); cap := cap - 1;
    end if;
    n := case when (inv ->> ty) ~ num then least(floor((inv ->> ty)::numeric), 100000)::int else 0 end;
    n := greatest(0, least(n, cap));
    insert into grants (player_id, product_id, data, done_at) select p, pr.id, pr.data, now() from products pr, generate_series(1, n) where pr.id = 'imp_' || ty;
    out := out || jsonb_build_object(ty, n);
  end loop;
  return out;
end $$;

revoke all on function public.haill_import(jsonb) from public, anon, authenticated;
grant execute on function public.haill_import(jsonb) to authenticated;
