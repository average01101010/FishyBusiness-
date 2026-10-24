-- The badges' funnel (Jonas 07.10.2026; core/09f-merker.js, the admin's «Merker» tab): how many players reached each milestone of
-- «Første uke på sjøen» and finished each chapter, from the game's own events (so only the players who share usage statistics), against
-- how many started the game. Sums only; for the admin.
create or replace function public.admin_ach() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object(
    'ms', coalesce((select jsonb_object_agg(id, n) from (select data ->> 'id' id, count(distinct player_id) n from events where kind = 'ach' and data ? 'id' group by 1) x), '{}'::jsonb),
    'ch', coalesce((select jsonb_object_agg(ch, n) from (select data ->> 'ch' ch, count(distinct player_id) n from events where kind = 'ach_ch' and data ? 'ch' group by 1) x), '{}'::jsonb),
    'players', (select count(distinct player_id) from events where kind = 'start'));
end $$;
revoke all on function public.admin_ach() from public, anon;
grant execute on function public.admin_ach() to authenticated;
