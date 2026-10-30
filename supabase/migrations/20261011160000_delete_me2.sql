-- «Slett kontoen» with the sign-in too (Jonas 11.10.2026: the account at WorkOS, e-mail and name, must go as well; GDPR art. 17).
-- delete_me2 does what delete_me does and tells which account it was (the token's own sub), so the Edge Function account-delete can
-- remove that user at WorkOS after the database has let go of it. delete_me stays for the game's fallback when the function is not set up.
create or replace function public.delete_me2() returns text language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  delete from errors where player_id = p;
  delete from players where id = p;            -- cascades to saves, sessions, events and entitlements; purchases keep no player
  return p;
end $$;
revoke all on function public.delete_me2() from public, anon;
grant execute on function public.delete_me2() to authenticated;
