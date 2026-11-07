-- Push notifications (05.10.2026, the list's 9: «Push-varsler i appen», chosen by the player in Settings; ui/10g-push.js).
-- The game is played in the browser, so the server does not know what happens in it. When the app goes to the background, the game
-- works out what will happen while it is away (gear that has soaked long enough, the boat at its harbour, the skrei coming) and when
-- that is in real time, and lays it out here with push_plan; when it comes back it clears what was not sent. The Edge Function
-- push-send (supabase/functions/push-send) runs every five minutes from pg_cron and sends what is due, signed with the VAPID keys,
-- which only Jonas makes and keeps as the function's secrets (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT). Without them it
-- sends nothing, and the game does not offer the switch.
--
-- The endpoints are the browsers' own push services only (Google, Mozilla, Microsoft, Apple), so the function never posts anywhere a
-- player chooses. A deleted player takes their subscriptions and queue with them (on delete cascade).

create table if not exists public.push_subs (
  endpoint text primary key,
  player_id text not null references public.players(id) on delete cascade,
  p256dh text not null, auth text not null, lang text,
  created_at timestamptz not null default now(), last_ok timestamptz, fails int not null default 0
);
create index if not exists push_subs_player on public.push_subs (player_id);
create table if not exists public.push_queue (
  id bigint generated always as identity primary key,
  player_id text not null references public.players(id) on delete cascade,
  send_at timestamptz not null, tag text not null, title text not null, body text not null,
  sent_at timestamptz
);
create index if not exists push_queue_due on public.push_queue (send_at) where sent_at is null;
create index if not exists push_queue_player on public.push_queue (player_id);
alter table public.push_subs enable row level security;
alter table public.push_queue enable row level security;
revoke all on public.push_subs, public.push_queue from anon, authenticated;

-- ---------- the game ----------
create or replace function public.push_sub(endpoint text, p256dh text, auth text, lang text) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  if length(push_sub.endpoint) > 800 or push_sub.endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com|web\.push\.apple\.com|[a-z0-9.-]+\.push\.apple\.com)/' then
    raise exception 'not a push service';
  end if;
  if length(push_sub.p256dh) > 200 or length(push_sub.auth) > 100 then raise exception 'bad keys'; end if;
  insert into players (id, last_seen) values (p, now()) on conflict (id) do nothing;
  insert into push_subs (endpoint, player_id, p256dh, auth, lang) values (push_sub.endpoint, p, push_sub.p256dh, push_sub.auth, left(push_sub.lang, 5))
    on conflict on constraint push_subs_pkey do update set player_id = excluded.player_id, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang, fails = 0;
end $$;

create or replace function public.push_unsub(endpoint text) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null then raise exception 'not signed in'; end if;
  delete from push_subs s where s.endpoint = push_unsub.endpoint and s.player_id = p;
  if not exists (select 1 from push_subs s where s.player_id = p) then delete from push_queue q where q.player_id = p and q.sent_at is null; end if;
end $$;

-- what is coming: [{at (ISO time), tag, title, body}], at most 24, within two days; replaces what was laid out before and not sent
create or replace function public.push_plan(items jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare p text := pid(); n int := 0;
begin
  if p is null then raise exception 'not signed in'; end if;
  delete from push_queue q where q.player_id = p and q.sent_at is null;
  if jsonb_typeof(items) <> 'array' or not exists (select 1 from push_subs s where s.player_id = p) then return 0; end if;
  insert into push_queue (player_id, send_at, tag, title, body)
    select p, (i ->> 'at')::timestamptz, left(i ->> 'tag', 40), left(i ->> 'title', 80), left(i ->> 'body', 240)
    from (select i from jsonb_array_elements(items) i limit 24) x
    where (i ->> 'at')::timestamptz between now() - interval '1 minute' and now() + interval '2 days'
      and coalesce(i ->> 'title', '') <> '' and coalesce(i ->> 'body', '') <> '' and coalesce(i ->> 'tag', '') <> '';
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- the sender (the Edge Function, with the service role) ----------
-- takes what is due and marks it sent in one go, so two runs at once never send the same twice
create or replace function public.push_claim(lim int default 300) returns table (id bigint, player_id text, tag text, title text, body text)
language sql security definer set search_path = public as $$
  update push_queue q set sent_at = now()
  where q.id in (select q2.id from push_queue q2 where q2.sent_at is null and q2.send_at <= now() order by q2.send_at limit lim for update skip locked)
  returning q.id, q.player_id, q.tag, q.title, q.body
$$;
-- the sent rows older than a week go
create or replace function public.push_tidy() returns void language sql security definer set search_path = public as $$
  delete from push_queue where sent_at < now() - interval '7 days'
$$;

revoke all on function public.push_sub(text, text, text, text), public.push_unsub(text), public.push_plan(jsonb), public.push_claim(int), public.push_tidy() from public, anon, authenticated;
grant execute on function public.push_sub(text, text, text, text), public.push_unsub(text), public.push_plan(jsonb) to authenticated;
grant execute on function public.push_claim(int), public.push_tidy() to service_role;

-- ---------- every five minutes: pg_cron calls the function (it only sends what is due, so a call from anyone else does no harm) ----------
do $$ begin
  create extension if not exists pg_net with schema extensions;
  create extension if not exists pg_cron with schema pg_catalog;
  perform cron.unschedule('push-send') where exists (select 1 from cron.job where jobname = 'push-send');
  perform cron.schedule('push-send', '*/5 * * * *', $c$
    select net.http_post(url := 'https://xcqbqzrsgycpeoyclakm.supabase.co/functions/v1/push-send', headers := '{"Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 20000)
  $c$);
exception when others then raise notice 'pg_net or pg_cron is not enabled: turn them on under Database → Extensions and run this block again';
end $$;
