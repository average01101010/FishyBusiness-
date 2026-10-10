-- Feedback with several pictures and video (05.10.2026; Jonas: «Litt viktig at spillet tillater skjermbilder og skjermopptak. Dette er
-- essensielt ved logging av feilmeldinger», then «Kjør på med video og flere bilder»; ui/06e-feedback.js).
--
-- Pictures: up to four, made smaller by the game as before. fb_send2 checks them all, keeps the first in feedback.img (as fb_send)
-- and the others in feedback_img. Videos (screen recordings): up to two a feedback and six a day, each at most 50 MB (the free plan's
-- largest file; the game makes a larger recording smaller first). They go to the private Storage bucket feedback-media under the
-- player's own folder: fb_media_slot gives the name for a feedback the player sent in the last hour, the Storage policy lets only that
-- name be uploaded (fb_media_ok), and fb_media_done marks it there. Only the admin (is_admin(), Jonas with TOTP) watches them, through
-- signed links in /admin, and deletes them there. The player may delete their own files, which the game does before the account is
-- deleted (fb_media_list); Storage refuses deletes made in SQL (storage.protect_delete), so a file whose row is gone stays until the
-- admin deletes it, and /admin counts those. The Storage part is skipped where there is no storage schema (the local test database).

create table if not exists public.feedback_img (
  fid bigint not null references public.feedback(id) on delete cascade,
  n smallint not null check (n between 1 and 3),
  img text not null check (char_length(img) <= 700000),
  primary key (fid, n)
);
alter table public.feedback_img enable row level security;
revoke all on public.feedback_img from anon, authenticated;

create table if not exists public.feedback_media (
  id bigint generated always as identity primary key,
  fid bigint not null references public.feedback(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  path text not null unique,
  mime text not null,
  bytes bigint not null check (bytes > 0 and bytes <= 52428800),
  secs real,
  at timestamptz not null default now(),
  done boolean not null default false
);
create index if not exists feedback_media_fid on public.feedback_media (fid);
create index if not exists feedback_media_player on public.feedback_media (player_id, at desc);
alter table public.feedback_media enable row level security;
revoke all on public.feedback_media from anon, authenticated;

-- ---------- the player ----------
-- as fb_send, with up to four pictures
create or replace function public.fb_send2(topic text, body text, rating int, imgs jsonb, meta jsonb) returns bigint
language plpgsql security definer set search_path = public as $$
declare f bigint; i int := 0; x text;
begin
  if imgs is null or jsonb_typeof(imgs) = 'null' then imgs := '[]'; end if;
  if jsonb_typeof(imgs) <> 'array' or jsonb_array_length(imgs) > 4 then raise exception 'bad images'; end if;
  for x in select value #>> '{}' from jsonb_array_elements(imgs) loop
    if x is null or char_length(x) > 700000 or x !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$' then raise exception 'bad image'; end if;
  end loop;
  f := fb_send(topic, body, rating, imgs ->> 0, meta);
  for x in select value #>> '{}' from jsonb_array_elements(imgs) with ordinality e(value, o) where o > 1 order by o loop
    i := i + 1; insert into feedback_img (fid, n, img) values (f, i, x);
  end loop;
  return f;
end $$;

-- the name a video may be uploaded under, for a feedback the player sent in the last hour
create or replace function public.fb_media_slot(fid bigint, mime text, bytes bigint, secs real) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); k int; ext text; pth text;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from feedback fb where fb.id = fb_media_slot.fid and fb.player_id = p and fb.ts > now() - interval '1 hour') then raise exception 'not yours'; end if;
  ext := case fb_media_slot.mime when 'video/mp4' then 'mp4' when 'video/webm' then 'webm' when 'video/quicktime' then 'mov' when 'video/3gpp' then '3gp' end;
  if ext is null then raise exception 'bad type'; end if;
  if fb_media_slot.bytes is null or fb_media_slot.bytes <= 0 or fb_media_slot.bytes > 52428800 then raise exception 'too big'; end if;
  -- a name given out before that never got its file (the upload failed) gives way to the new try
  delete from feedback_media m where m.fid = fb_media_slot.fid and m.player_id = p and not m.done;
  select count(*) into k from feedback_media m where m.fid = fb_media_slot.fid;
  if k >= 2 then raise exception 'two videos at most'; end if;
  if (select count(*) from feedback_media m where m.player_id = p and m.at > now() - interval '1 day') >= 6 then raise exception 'too many today'; end if;
  pth := p || '/' || fb_media_slot.fid || '-' || (k + 1) || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '.' || ext;
  insert into feedback_media (fid, player_id, path, mime, bytes, secs)
    values (fb_media_slot.fid, p, pth, fb_media_slot.mime, fb_media_slot.bytes, least(greatest(coalesce(fb_media_slot.secs, 0), 0), 3600));
  return pth;
end $$;

-- for the Storage policies: a name given out in the last hour and not uploaded yet; a name in the player's own folder
create or replace function public.fb_media_ok(name text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from feedback_media m where m.path = fb_media_ok.name and m.player_id = pid() and not m.done and m.at > now() - interval '1 hour')
$$;
create or replace function public.fb_media_own(name text) returns boolean language sql stable security definer set search_path = public as $$
  select pid() is not null and split_part(fb_media_own.name, '/', 1) = pid()
$$;
-- the upload went through
create or replace function public.fb_media_done(path text) returns void language sql security definer set search_path = public as $$
  update feedback_media m set done = true where m.path = fb_media_done.path and m.player_id = pid()
$$;
-- the player's own files, for deleting them before the account
create or replace function public.fb_media_list() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(m.path), '[]'::jsonb) from feedback_media m where m.player_id = pid()
$$;

-- the player's own feedback, now with how many pictures and videos
create or replace function public.fb_mine() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'ts', ts, 'topic', topic, 'body', left(body, 300), 'img', img is not null,
           'nimg', (img is not null)::int + (select count(*) from feedback_img i where i.fid = f.id),
           'vids', (select count(*) from feedback_media m where m.fid = f.id and m.done), 'status', status, 'reply', reply) order by ts desc), '[]'::jsonb)
    from (select * from feedback where player_id = pid() order by ts desc limit 30) f
$$;

-- ---------- the admin (/admin) ----------
-- the files in the bucket whose row is gone (the admin deletes them through Storage)
create or replace function public.admin_media_orphans() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if to_regclass('storage.objects') is null then return '[]'::jsonb; end if;
  return (select coalesce(jsonb_agg(o.name), '[]'::jsonb) from storage.objects o where o.bucket_id = 'feedback-media'
            and not exists (select 1 from feedback_media m where m.path = o.name));
end $$;
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
               'meta', meta, 'status', status, 'reply', reply) order by ts desc), '[]'::jsonb)
             from (select * from feedback f where (topic_f is null or f.topic = topic_f) and (status_f is null or f.status = status_f)
                   order by ts desc limit greatest(1, least(lim, 500))) r),
    'topics', (select coalesce(jsonb_object_agg(topic, n), '{}'::jsonb) from (select topic, count(*) n from feedback group by topic) t),
    'status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb) from (select status, count(*) n from feedback group by status) s),
    'rating', (select round(avg(rating)::numeric, 2) from feedback where rating is not null and ts > now() - interval '30 days'),
    'mb', (select round((coalesce(sum(char_length(img)), 0) + (select coalesce(sum(char_length(i.img)), 0) from feedback_img i)) / 1048576.0, 1) from feedback),
    'vmb', (select round(coalesce(sum(bytes), 0) / 1048576.0, 1) from feedback_media where done),
    'orphans', jsonb_array_length(admin_media_orphans()));
end $$;
-- every picture of one feedback
create or replace function public.admin_feedback_imgs(fid bigint) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return (select coalesce(jsonb_agg(x.img order by x.n), '[]'::jsonb) from (
    select 0 n, f.img from feedback f where f.id = admin_feedback_imgs.fid and f.img is not null
    union all select i.n, i.img from feedback_img i where i.fid = admin_feedback_imgs.fid) x);
end $$;
-- a video the admin has deleted from Storage
create or replace function public.admin_media_gone(path text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  delete from feedback_media m where m.path = admin_media_gone.path;
end $$;

revoke all on function public.fb_send2(text, text, int, jsonb, jsonb), public.fb_media_slot(bigint, text, bigint, real), public.fb_media_ok(text),
  public.fb_media_own(text), public.fb_media_done(text), public.fb_media_list(), public.admin_feedback_imgs(bigint), public.admin_media_orphans(),
  public.admin_media_gone(text) from public, anon, authenticated;
grant execute on function public.fb_send2(text, text, int, jsonb, jsonb), public.fb_media_slot(bigint, text, bigint, real), public.fb_media_ok(text),
  public.fb_media_own(text), public.fb_media_done(text), public.fb_media_list(), public.admin_feedback_imgs(bigint), public.admin_media_orphans(),
  public.admin_media_gone(text) to authenticated;
-- the new identity sequence comes with Supabase's default rights (see 20261004120000_cloud.sql)
revoke all on all sequences in schema public from anon, authenticated;

-- ---------- Storage: the private bucket and who may do what in it ----------
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('feedback-media', 'feedback-media', false, 52428800, array['video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp'])
      on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
    execute 'drop policy if exists "dsb feedback media upload" on storage.objects';
    execute $p$create policy "dsb feedback media upload" on storage.objects for insert to authenticated
      with check (bucket_id = 'feedback-media' and public.fb_media_ok(name))$p$;
    execute 'drop policy if exists "dsb feedback media read" on storage.objects';
    execute $p$create policy "dsb feedback media read" on storage.objects for select to authenticated
      using (bucket_id = 'feedback-media' and (public.fb_media_own(name) or public.is_admin()))$p$;
    execute 'drop policy if exists "dsb feedback media delete" on storage.objects';
    execute $p$create policy "dsb feedback media delete" on storage.objects for delete to authenticated
      using (bucket_id = 'feedback-media' and (public.fb_media_own(name) or public.is_admin()))$p$;
  end if;
end $$;
