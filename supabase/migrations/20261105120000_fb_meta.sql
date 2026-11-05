-- Ø6 funn 1 (05.11.2026, docs/planer/sikkerhet-skyen.md): the admin page put a feedback's meta.pos into its HTML as it came, so a
-- player could send HTML there that ran with Jonas's admin session when he opened the feedback. The page now takes only numbers
-- (src/admin/index.html fbMeta); here fb_send keeps pos only as two numbers inside latitude and longitude, and drops it otherwise.
-- Everything else is as in 20261005180000_feedback.sql (fb_send2 calls this one, so it is covered too). create or replace keeps
-- the function's grants.
create or replace function public.fb_send(topic text, body text, rating int, img text, meta jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int; fid bigint; ps jsonb;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  select count(*) into n from feedback f where f.player_id = p and f.ts > now() - interval '1 day';
  if n >= 20 then raise exception 'too many today'; end if;
  if img is not null and img !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$' then raise exception 'bad image'; end if;
  if meta is null or jsonb_typeof(meta) <> 'object' or octet_length(meta::text) > 4000 then meta := '{}'; end if;
  ps := meta -> 'pos';
  if ps is not null then
    meta := meta - 'pos';
    if jsonb_typeof(ps) = 'array' and jsonb_array_length(ps) = 2 and jsonb_typeof(ps -> 0) = 'number' and jsonb_typeof(ps -> 1) = 'number'
       and abs((ps ->> 0)::numeric) <= 90 and abs((ps ->> 1)::numeric) <= 180 then
      meta := meta || jsonb_build_object('pos', ps);
    end if;
  end if;
  insert into feedback (player_id, topic, body, rating, img, meta)
    values (p, fb_send.topic, btrim(fb_send.body), case when fb_send.rating between 1 and 5 then fb_send.rating end, fb_send.img, fb_send.meta)
    returning id into fid;
  return fid;
end $$;
