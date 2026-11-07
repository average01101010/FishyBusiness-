-- The feedback agent (06.10.2026; Jonas: «koble deg opp mot detstorebla.no/admin slik at du kan hente ut alt av tilbakemeldinger 4
-- ganger i døgnet og gjøre eventuelle tiltak», then «Ja, du kan kjøre det slik ... kl. 06-12-18-00»; tools/feedback/, docs/OVERLEVERING.md 4.22).
--
-- A Claude Code routine reads the new feedback four times a day through the Edge Function feedback-agent, which holds its own token
-- (FEEDBACK_AGENT_TOKEN, set by Jonas) and calls only the agent_* functions below, as service_role. The agent sees the text, the
-- topic, the rating, the pictures and the game's own meta (a fixed list of keys), never who wrote it: each player is a short code that
-- only holds within one reading, so it can tell when one player writes several times, and the play time comes as a band. E-mail
-- addresses and phone numbers in the text are masked. The agent writes a note, a weight, a suggested status and a suggested reply on
-- each feedback, and a report for each run; it never answers a player itself. Jonas sees them in /admin (the Agent tab and under
-- each feedback) and sends a reply with one tap. Nothing here is open to players or to the admin's own login.

alter table public.feedback add column if not exists ai_note text check (ai_note is null or char_length(ai_note) <= 4000);
alter table public.feedback add column if not exists ai_reply text check (ai_reply is null or char_length(ai_reply) <= 2000);
alter table public.feedback add column if not exists ai_status text check (ai_status is null or ai_status in ('new', 'seen', 'fixed', 'planned', 'no'));
alter table public.feedback add column if not exists ai_score real;
alter table public.feedback add column if not exists ai_at timestamptz;
create index if not exists feedback_ai_new on public.feedback (ts) where ai_at is null;

create table if not exists public.agent_runs (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  n int not null default 0,                     -- how many feedbacks the run went through
  report text not null check (char_length(report) between 1 and 60000),
  prs jsonb not null default '[]'               -- the pull requests it opened: [{url, title}]
);
alter table public.agent_runs enable row level security;
revoke all on public.agent_runs from anon, authenticated;

-- e-mail addresses and Norwegian phone numbers out of a text
create or replace function public.agent_scrub(t text) returns text language sql immutable set search_path = '' as $$
  select regexp_replace(regexp_replace(t, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[e-post]', 'g'),
                        '(\+47[ ]?)?\m(\d{2}[ ]?\d{2}[ ]?\d{2}[ ]?\d{2}|\d{3}[ ]?\d{2}[ ]?\d{3})\M', '[nummer]', 'g')
$$;

-- the agent's reading: what it has not been through yet, oldest first, and what it noted before (to put the same things together)
create or replace function public.agent_feedback(lim int default 40) returns jsonb language plpgsql security definer set search_path = public as $$
declare s text := md5(random()::text || clock_timestamp()::text);
begin
  return jsonb_build_object(
    'rows', (select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'ts', f.ts, 'topic', f.topic, 'rating', f.rating, 'body', agent_scrub(f.body),
               'who', left(md5(f.player_id || s), 6),
               'played', (select case when h is null then null when h < 1 then '<1 t' when h < 5 then '1-5 t' when h < 20 then '5-20 t' when h < 100 then '20-100 t' else '100+ t' end
                          from (select sum(x.active_s) / 3600.0 h from sessions x where x.player_id = f.player_id) q),
               'earlier', (select count(*) from feedback g where g.player_id = f.player_id and g.ts < f.ts),
               'nimg', (f.img is not null)::int + (select count(*) from feedback_img i where i.fid = f.id),
               'nvid', (select count(*) from feedback_media m where m.fid = f.id and m.done),
               'meta', (select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) from jsonb_each(f.meta) e(k, v)
                        where k in ('version', 'platform', 'browser', 'pwa', 'quality', 'w', 'h', 'dpr', 'view', 'lvl', 'fps', 'boat', 'st', 'port', 'pos', 't', 'tut', 'energy')),
               'status', f.status, 'replied', f.reply is not null) order by f.ts), '[]'::jsonb)
             from (select * from feedback where ai_at is null order by ts limit greatest(1, least(lim, 100))) f),
    'left', (select count(*) from feedback where ai_at is null),
    'noted', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ts', ts, 'topic', topic, 'note', ai_note, 'score', ai_score, 'status', status)
               order by ai_score desc nulls last), '[]'::jsonb)
             from (select * from feedback where ai_at is not null and ts > now() - interval '60 days' and status not in ('fixed', 'no')
                   order by ai_score desc nulls last limit 150) n),
    'last_run', (select jsonb_build_object('ts', ts, 'report', left(report, 6000)) from agent_runs order by ts desc limit 1));
end $$;

-- every picture of one feedback (as admin_feedback_imgs)
create or replace function public.agent_feedback_imgs(fid bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x.img order by x.n), '[]'::jsonb) from (
    select 0 n, f.img from feedback f where f.id = agent_feedback_imgs.fid and f.img is not null
    union all select i.n, i.img from feedback_img i where i.fid = agent_feedback_imgs.fid) x
$$;

-- the agent's note on one feedback: what it is, how much it weighs, and the status and reply it suggests (Jonas decides)
create or replace function public.agent_note(fid bigint, note text, score real, st text, reply text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if agent_note.st is not null and agent_note.st not in ('new', 'seen', 'fixed', 'planned', 'no') then raise exception 'bad status'; end if;
  update feedback set ai_note = left(nullif(btrim(agent_note.note), ''), 4000), ai_score = agent_note.score, ai_status = agent_note.st,
         ai_reply = left(nullif(btrim(agent_note.reply), ''), 2000), ai_at = now() where id = agent_note.fid;
  if not found then raise exception 'no feedback %', fid; end if;
end $$;

-- the run's report (Markdown) and the pull requests it opened
create or replace function public.agent_run(report text, prs jsonb, n int) returns bigint language plpgsql security definer set search_path = public as $$
declare rid bigint;
begin
  if prs is null or jsonb_typeof(prs) <> 'array' then prs := '[]'; end if;
  insert into agent_runs (report, prs, n) values (left(agent_run.report, 60000), agent_run.prs, coalesce(agent_run.n, 0)) returning id into rid;
  delete from agent_runs where ts < now() - interval '1 year';
  return rid;
end $$;

-- ---------- the admin (/admin) ----------
create or replace function public.admin_agent_runs(lim int default 30) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ts', ts, 'n', n, 'report', report, 'prs', prs) order by ts desc), '[]'::jsonb)
            from (select * from agent_runs order by ts desc limit greatest(1, least(lim, 200))) r);
end $$;

-- admin_feedback as in 20261006010000_feedback_media.sql, with the agent's note, weight, status and reply
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
               'meta', meta, 'status', status, 'reply', reply,
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

revoke all on function public.agent_scrub(text), public.agent_feedback(int), public.agent_feedback_imgs(bigint), public.agent_note(bigint, text, real, text, text),
  public.agent_run(text, jsonb, int), public.admin_agent_runs(int) from public, anon, authenticated;
grant execute on function public.agent_scrub(text), public.agent_feedback(int), public.agent_feedback_imgs(bigint), public.agent_note(bigint, text, real, text, text),
  public.agent_run(text, jsonb, int) to service_role;
grant execute on function public.admin_agent_runs(int) to authenticated;
revoke all on all sequences in schema public from anon, authenticated;
