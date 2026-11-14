-- Steg 44 (M7/M8-resten, docs/planer/butikker-og-sponsorer.md; Jonas 12.11.2026 om et sponset malingsdesign når avtalen slutter:
-- «Fargene blir»): a partner's paint design (a placement look on paint) is worn by a boat as 'x:<id>' in her paint code (vessel3d.js
-- livStr). While the agreement is active the others read it from sp_now(); when it has ended the mark goes, but the colours stay on
-- her, and the others must still be able to paint her so. sp_paint gives the colours (and the design's own name) of the designs asked
-- for, active or not, and nothing else: no sponsor, no logo, no link. At most 20 at a time. To anyone, as sp_now: they are shown in the
-- game to everyone near her. Idempotent (create or replace).
create or replace function public.sp_paint(ids bigint[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(p.id::text, (select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) from jsonb_each(p.data) e
      where e.key in ('name', 'name_en', 'hull', 'house', 'deck', 'ripe', 'totone', 'vann', 'stripe', 'lakk'))), '{}'::jsonb)
  from sponsor_placements p
  where p.kind = 'look' and p.target = 'paint' and p.from_at <= now() and p.id = any((coalesce(sp_paint.ids, '{}'::bigint[]))[1:20])
$$;
revoke all on function public.sp_paint(bigint[]) from public;
grant execute on function public.sp_paint(bigint[]) to anon, authenticated;
