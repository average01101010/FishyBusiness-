-- The thank-you for feedback that helps the game (06.10.2026; Jonas: «Jeg tenker de skal få 12 spilltimer med 100% "haill" i
-- belønning om tilbakemeldingen er av verdi for utviklingen av spillet. Haillet skal ikke gradvis miste effekt når man får det i
-- belønning på denne måten, det skal vare 12timer, så ferdig»; docs/OVERLEVERING.md 4.22).
--
-- When the admin sets a feedback to «Kommer» (planned) or «Fikset» (fixed), the player gets one takk-haill (core/03-simulation.js
-- HAILL.takk: +100 % luck for 12 game hours, then gone) as a grant, the same way as a purchase (ui/10i-shop.js shopClaim takes it into
-- the Haill app's store), and a push notification if they have them on. Once per feedback, whatever the status is set to later.
-- The product is never for sale: it is not active, so shop_quote refuses it.

insert into public.products (id, kind, name_no, name_en, price_nok, data, active) values
  ('fb_haill', 'booster', 'Takk-haill: 12 timer med fullt haill', 'Thank-you luck: 12 hours of full luck', 0, '{"give":"haill","type":"takk","reward":true}', false)
on conflict (id) do update set name_no = excluded.name_no, name_en = excluded.name_en, price_nok = excluded.price_nok, data = excluded.data, active = false;

alter table public.feedback add column if not exists rewarded_at timestamptz;

-- the status and the answer, as before; «Kommer» or «Fikset» the first time gives the thank-you
create or replace function public.admin_feedback_set(fid bigint, st text, answer text) returns void language plpgsql security definer set search_path = public as $$
declare p text; r timestamptz; lg text;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update feedback set status = st, reply = nullif(btrim(answer), ''), handled_at = now() where id = fid returning player_id, rewarded_at into p, r;
  if p is null or r is not null or st not in ('planned', 'fixed') then return; end if;
  insert into grants (player_id, product_id, data) values (p, 'fb_haill', '{"give":"haill","type":"takk","reward":true}'::jsonb || jsonb_build_object('fid', fid));
  update feedback set rewarded_at = now() where id = fid;
  -- a push notification to the devices the player has them on for (in their language), within the four a day (push-send)
  if exists (select 1 from push_subs s where s.player_id = p) then
    select coalesce(max(s.lang), 'no') into lg from push_subs s where s.player_id = p;
    insert into push_queue (player_id, send_at, tag, title, body, kind, expires_at) values (p, now(), 'dsb-takk-' || fid,
      case when lg like 'en%' then 'Thank you for your feedback' else 'Takk for tilbakemeldingen' end,
      case when lg like 'en%' then 'It helped us make the game better. 12 hours of full luck are waiting in the Luck app.'
           else 'Den hjalp oss å gjøre spillet bedre. 12 timer med fullt haill venter i Haill-appen.' end, 'srv', now() + interval '24 hours');
  end if;
end $$;

-- the player's own feedback, now with whether it earned the thank-you
create or replace function public.fb_mine() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ts', ts, 'topic', topic, 'body', left(body, 300), 'img', img is not null,
           'nimg', (img is not null)::int + (select count(*) from feedback_img i where i.fid = f.id),
           'vids', (select count(*) from feedback_media m where m.fid = f.id and m.done), 'status', status, 'reply', reply,
           'rewarded', rewarded_at is not null) order by ts desc), '[]'::jsonb)
    from (select * from feedback where player_id = pid() order by ts desc limit 30) f
$$;

-- admin_feedback as in 20261006120000_feedback_agent.sql, with whether the player has had the thank-you
create or replace function public.admin_feedback(lim int default 100, topic_f text default null, status_f text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object(
    'rows', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ts', ts, 'player', player_id, 'topic', topic, 'rating', rating, 'body', body,
               'img', img is not null, 'kb', coalesce(char_length(img), 0) / 1365,
               'nimg', (img is not null)::int + (select count(*) from feedback_img i where i.fid = r.id),
               'vids', (select coalesce(jsonb_agg(jsonb_build_object('path', m.path, 'mime', m.mime, 'mb', round(m.bytes / 1048576.0, 1), 'secs', round(m.secs::numeric), 'done', m.done) order by m.id), '[]'::jsonb)
                        from feedback_media m where m.fid = r.id),
               'meta', meta, 'status', status, 'reply', reply, 'rewarded', rewarded_at is not null,
               'ai', case when ai_at is null then null else jsonb_build_object('note', ai_note, 'score', ai_score, 'status', ai_status, 'reply', ai_reply, 'at', ai_at) end) order by ts desc), '[]'::jsonb)
             from (select * from feedback f where (topic_f is null or f.topic = topic_f) and (status_f is null or f.status = status_f)
                   order by ts desc limit greatest(1, least(lim, 500))) r),
    'topics', (select coalesce(jsonb_object_agg(topic, n), '{}'::jsonb) from (select topic, count(*) n from feedback group by topic) t),
    'status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from feedback group by status) s),
    'rating', (select round(avg(rating)::numeric, 2) from feedback where rating is not null and ts > now() - interval '30 days'),
    'mb', (select round((coalesce(sum(char_length(img)), 0) + (select coalesce(sum(char_length(i.img)), 0) from feedback_img i)) / 1048576.0, 1) from feedback),
    'vmb', (select round(coalesce(sum(bytes), 0) / 1048576.0, 1) from feedback_media where done),
    'orphans', jsonb_array_length(admin_media_orphans()));
end $$;

revoke all on function public.admin_feedback_set(bigint, text, text), public.fb_mine() from public, anon, authenticated;
grant execute on function public.admin_feedback_set(bigint, text, text), public.fb_mine() to authenticated;
revoke all on all sequences in schema public from anon, authenticated;
