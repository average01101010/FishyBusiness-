-- One's own number in the registration mark (des_reg, 29 kr; ui/10j-paint.js pntreg and regSet) after the shop's review 07.11.2026
-- (docs/BACKLOG.md). reg_claim in 20261007100000_designs.sql kept every number a player had ever claimed, on every boat, and said
-- «too many» after ten for good, so the player got «Fikk ikke sjekket nummeret» from then on; and the game asked only after the payment,
-- so a number another player held was refused after it had been paid for. Now only the numbers in use count:
--   reg_claim(mark, keep)  keep is the marks the player's other boats wear now (the game sends them). A claim that goes through lets go
--                          of every claim of the player's that no boat wears any more: the boat's previous number, a boat sold, and the
--                          numbers claimed before this. A claim that is refused (another player's number, the limit) lets nothing go.
--                          The limit is ten numbers in use at once, not ten ever.
--   reg_check(mark, keep)  the same answer without claiming anything, for the game to ask before it sends the player to the payment:
--                          'ok' (free, or the player's own), 'taken' (another player's) or 'many' (ten in use already).
-- Without keep (a page from before this, until it updates) nothing is let go and every claim counts, as before. reg_claims is as it was.
drop function if exists public.reg_claim(text);

create or replace function public.reg_check(mark text, keep text[] default null) returns text
language plpgsql stable security definer set search_path = public as $$
declare p text := pid(); o text;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  if reg_check.mark is null or reg_check.mark !~ '^[A-ZÆØÅ]{1,2}-[0-9]{1,4}-[A-ZÆØÅ]{1,3}$' then raise exception 'bad mark'; end if;
  if coalesce(cardinality(reg_check.keep), 0) > 200 then raise exception 'bad keep'; end if;
  select c.player_id into o from reg_claims c where c.mark = reg_check.mark;
  if o is not null then return case when o = p then 'ok' else 'taken' end; end if;
  if (select count(*) from reg_claims c where c.player_id = p and (reg_check.keep is null or c.mark = any(reg_check.keep))) >= 10 then return 'many'; end if;
  return 'ok';
end $$;

create or replace function public.reg_claim(mark text, keep text[] default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare p text := pid(); s text := reg_check(reg_claim.mark, reg_claim.keep);
begin
  if s = 'taken' then return false; end if;
  if s = 'many' then raise exception 'too many'; end if;
  insert into reg_claims (mark, player_id) values (reg_claim.mark, p) on conflict do nothing;
  if (select c.player_id from reg_claims c where c.mark = reg_claim.mark) is distinct from p then return false; end if;   -- another was first
  if reg_claim.keep is not null then
    delete from reg_claims c where c.player_id = p and c.mark <> reg_claim.mark and c.mark <> all(reg_claim.keep);
  end if;
  return true;
end $$;

revoke all on function public.reg_check(text, text[]), public.reg_claim(text, text[]) from public, anon;
grant execute on function public.reg_check(text, text[]), public.reg_claim(text, text[]) to authenticated;
