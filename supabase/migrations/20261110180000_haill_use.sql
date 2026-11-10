-- Haill from the server counted from the grants (HS2, 10.11.2026; docs/planer/haill-saldo.md; Jonas, valg 16 V7: «A», valg 29 V1: «V1: A»).
-- Until now a grant was «given» when the game had said shop_done, and after that the haill was only a number in the save: a save that
-- went on without it (two devices in conflict, an earlier save taken back, an upload that never arrived, a new game) lost what was
-- paid for. From here a haill grant (data.give = 'haill': bought haill and luksus, the welcome gift reg_luksus, the thank-you fb_haill)
-- means «unused»: it stays on the server until the player switches it on, and the save holds only a copy (ui/10i-shop.js, S.haillSrv).
--
--   grants.used_at       when the haill was switched on (haill_use). Null: still the player's to use.
--   shop_pending()       the open grants as before, and the haill that is delivered and neither used nor taken back, marked held:true
--                        so the game can tell them apart (no confirmation for those: they are only kept here)
--   haill_use(id)        the player's own haill grant, once: true when it was used now, false when it was used before, taken back,
--                        another player's, another kind of grant or not there
--   shop_refund(pi)      takes back a haill that is not used, also after it was delivered; the rest as before
-- Nothing that shares anything with other players (pos_put, pos_world, land_put, the leaderboards, Kystposten) reads grants or used_at.

-- The haill that is delivered when this file is run already counts in the saves' own numbers (S.haillInv), and which of them are used
-- cannot be seen: they all count as used. Only what is granted from then on follows the new rule. Done only when the column is made,
-- so running the file again never takes a haill the server keeps
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'grants' and column_name = 'used_at') then
    alter table public.grants add column used_at timestamptz;
    update public.grants set used_at = done_at where data ->> 'give' = 'haill' and done_at is not null;
  end if;
end $$;
create index if not exists grants_haill_held on public.grants (player_id) where used_at is null and revoked_at is null and done_at is not null;

create or replace function public.shop_pending() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'product', g.product_id, 'data', g.data)
      || case when g.done_at is not null then '{"held":true}'::jsonb else '{}'::jsonb end order by g.id), '[]'::jsonb)
    from grants g where g.player_id = pid() and g.revoked_at is null
     and (g.done_at is null or (g.data ->> 'give' = 'haill' and g.used_at is null))
$$;

-- (a haill switched on with no network before the game could say shop_done is told here first: it is delivered then too)
create or replace function public.haill_use(id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int;
begin
  if p is null then raise exception 'not signed in'; end if;
  update grants g set used_at = now(), done_at = coalesce(g.done_at, now())
   where g.id = haill_use.id and g.player_id = p and g.data ->> 'give' = 'haill' and g.used_at is null and g.revoked_at is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- (as in 20261007100000_designs.sql, with the haill that is not used)
create or replace function public.shop_refund(pi text) returns void
language plpgsql security definer set search_path = public as $$
declare u purchases;
begin
  update purchases set status = 'refunded', refunded_at = now() where payment_intent = shop_refund.pi and status = 'paid' returning * into u;
  if u.id is not null then
    update grants set revoked_at = now() where purchase_id = u.id and (done_at is null or (data ->> 'give' = 'haill' and used_at is null));
    delete from entitlements where player_id = u.player_id and product_id = u.product_id and source = 'stripe:' || u.id;
  end if;
end $$;

revoke all on function public.haill_use(bigint) from public, anon, authenticated;
grant execute on function public.haill_use(bigint) to authenticated;
