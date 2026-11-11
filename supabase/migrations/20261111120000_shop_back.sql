-- Trim, Skippertak and the yard done now given again to a save that went on without them (HS3, 11.11.2026; docs/planer/haill-saldo.md;
-- Jonas 10.11.2026, valg 29 V2: «Jeg mener at dette burde vi fikse med en gang, så snart som mulig fordi jeg vurderer å ta inn flere
-- spillere til early access/ beta-testing, og da må alt dette med fungere som det skal»).
-- These three are used when they are delivered, so after shop_done they were only in the save: a save that went on without them (two
-- devices in conflict, an earlier save taken back, an upload that never arrived, a new game) lost what was paid for. From here
-- shop_pending also answers the ones delivered the last 7 days and not taken back, marked held:true as the haill the server keeps, and
-- every delivered grant carries done_at. The game gives one again only when its id is not in the save (S.shopGiven), with only the
-- time that is left counted from done_at (ui/10i-shop.js shopBack), so nothing is given twice and nothing made longer.
--
--   shop_pending()   the open grants, the haill that is delivered and not used (HS2, 20261110180000_haill_use.sql), and the trim,
--                    Skippertak and yard grants (data.give 'trim', 'skip', 'yard') delivered the last 7 days; the delivered ones
--                    with held:true and done_at. Only the player's own, never one that is taken back
-- A page from before this (HS2) skips a held grant that is not haill, so it gives nothing again and nothing twice. Nothing else is
-- changed: no column, no data, and nothing that shares anything with other players reads the grants.

create or replace function public.shop_pending() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'product', g.product_id, 'data', g.data)
      || case when g.done_at is not null then jsonb_build_object('held', true, 'done_at', g.done_at) else '{}'::jsonb end order by g.id), '[]'::jsonb)
    from grants g where g.player_id = pid() and g.revoked_at is null
     and (g.done_at is null
       or (g.data ->> 'give' = 'haill' and g.used_at is null)
       or (g.data ->> 'give' in ('trim', 'skip', 'yard') and g.done_at > now() - interval '7 days'))
$$;
