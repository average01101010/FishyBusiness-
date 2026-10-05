-- Feedback from the players (05.10.2026, Jonas: «Lag en feedback-app i telefonen hvor brukerne kan komme med tilbakemeldinger, gjerne
-- sortert etter hva tilbakemeldingen gjelder. La dem også laste opp bilde»; ui/05h-feedback.js).
--
-- A player writes what it is about (topic), the text, how happy they are (1-5, optional) and may add one picture, which the game has
-- made smaller first (a JPEG data URL, at most 1600 px and about 400 kB). The game adds where and how it was played (meta: version,
-- browser, platform, quality, frame rate, boat, position and game time), so a bug can be found again. As the rest of the cloud the
-- table has no policy for players: fb_send writes and fb_mine reads the player's own (without the pictures), and only the admin
-- (is_admin(), Jonas with TOTP) reads them all, sets their status and answers; the answer is shown to the player in the app.
-- A deleted player takes their feedback with them (on delete cascade); otherwise it is kept for two years.

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  player_id text not null references public.players(id) on delete cascade,
  topic text not null check (topic in ('bug', 'ui', 'perf', 'fish', 'econ', 'boat', 'world', 'tut', 'idea', 'other')),
  rating smallint check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 4000),
  img text check (img is null or char_length(img) <= 700000),
  meta jsonb not null default '{}',
  status text not null default 'new' check (status in ('new', 'seen', 'fixed', 'planned', 'no')),
  reply text check (reply is null or char_length(reply) <= 2000),
  handled_at timestamptz
);
create index if not exists feedback_ts on public.feedback (ts desc);
create index if not exists feedback_player on public.feedback (player_id, ts desc);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;

-- ---------- the player ----------
create or replace function public.fb_send(topic text, body text, rating int, img text, meta jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int; fid bigint;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  select count(*) into n from feedback f where f.player_id = p and f.ts > now() - interval '1 day';
  if n >= 20 then raise exception 'too many today'; end if;
  if img is not null and img !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$' then raise exception 'bad image'; end if;
  if meta is null or jsonb_typeof(meta) <> 'object' or octet_length(meta::text) > 4000 then meta := '{}'; end if;
  insert into feedback (player_id, topic, body, rating, img, meta)
    values (p, fb_send.topic, btrim(fb_send.body), case when fb_send.rating between 1 and 5 then fb_send.rating end, fb_send.img, fb_send.meta)
    returning id into fid;
  return fid;
end $$;

-- the player's own, newest first, without the pictures: what they wrote, its status and the answer
create or replace function public.fb_mine() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ts', ts, 'topic', topic, 'body', left(body, 300), 'img', img is not null,
           'status', status, 'reply', reply) order by ts desc), '[]'::jsonb)
    from (select * from feedback where player_id = pid() order by ts desc limit 30) f
$$;

-- ---------- the admin (/admin) ----------
create or replace function public.admin_feedback(lim int default 100, topic_f text default null, status_f text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return jsonb_build_object(
    'rows', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ts', ts, 'player', player_id, 'topic', topic, 'rating', rating, 'body', body,
               'img', img is not null, 'kb', coalesce(char_length(img), 0) / 1365, 'meta', meta, 'status', status, 'reply', reply) order by ts desc), '[]'::jsonb)
             from (select * from feedback f where (topic_f is null or f.topic = topic_f) and (status_f is null or f.status = status_f)
                   order by ts desc limit greatest(1, least(lim, 500))) r),
    'topics', (select coalesce(jsonb_object_agg(topic, n), '{}'::jsonb) from (select topic, count(*) n from feedback group by topic) t),
    'status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from feedback group by status) s),
    'rating', (select round(avg(rating)::numeric, 2) from feedback where rating is not null and ts > now() - interval '30 days'),
    'mb', (select round(coalesce(sum(char_length(img)), 0) / 1048576.0, 1) from feedback));
end $$;
create or replace function public.admin_feedback_img(fid bigint) returns text language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return (select img from feedback where id = fid);
end $$;
create or replace function public.admin_feedback_set(fid bigint, st text, answer text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update feedback set status = st, reply = nullif(btrim(answer), ''), handled_at = now() where id = fid;
end $$;

revoke all on function public.fb_send(text, text, int, text, jsonb), public.fb_mine(), public.admin_feedback(int, text, text),
  public.admin_feedback_img(bigint), public.admin_feedback_set(bigint, text, text) from public, anon, authenticated;
grant execute on function public.fb_send(text, text, int, text, jsonb), public.fb_mine(), public.admin_feedback(int, text, text),
  public.admin_feedback_img(bigint), public.admin_feedback_set(bigint, text, text) to authenticated;

-- ---------- kept for two years (personvern.html) ----------
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule('dsb-feedback') where exists (select 1 from cron.job where jobname = 'dsb-feedback');
  perform cron.schedule('dsb-feedback', '23 3 * * *', $c$ delete from public.feedback where ts < now() - interval '2 years'; $c$);
exception when others then raise notice 'pg_cron is not enabled: turn it on under Database → Extensions and run this block again';
end $$;
