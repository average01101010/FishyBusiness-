-- The fiskarlag's notice board (31.10.2026; docs/planer/oppdrag-2.md F2; ui/09c-pubsoc.js lagBoardHtml). Members leave fixed lines for
-- the club (never free text: the line's number, a species, the harbour the fish stood by and the miles from it), with the boat's name.
-- At most three a day each, gone after 48 hours. Read by the club's members in the pub and on the Sesong app's club card.
create table if not exists public.lag_posts (
  id bigserial primary key,
  player_id text not null references public.players(id) on delete cascade,
  port text not null check (port ~ '^[A-Za-z0-9_-]{1,40}$'),
  k integer not null check (k >= 0 and k <= 15),
  sp text check (sp is null or sp ~ '^[a-z]{1,16}$'),
  place text check (place is null or place ~ '^[A-Za-z0-9_-]{1,40}$'),
  nm real,
  boat text not null default '',
  at timestamptz not null default now()
);
create index if not exists lag_posts_port_at on public.lag_posts (port, at desc);
alter table public.lag_posts enable row level security;
revoke all on public.lag_posts from anon, authenticated;

-- a line on my club's board: 'ok', 'wait' (three today already), 'no' (not a member, a guest, a bad line)
create or replace function public.lag_post(k integer, sp text default null, place text default null, nm real default null, boat text default '') returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid(); pt text;
begin
  if p is null or is_guest() then return 'no'; end if;
  if lag_post.k is null or lag_post.k < 0 or lag_post.k > 15 then return 'no'; end if;
  select m.port into pt from lag_members m where m.player_id = p;
  if pt is null then return 'no'; end if;
  if (select count(*) from lag_posts x where x.player_id = p and x.at > now() - interval '24 hours') >= 3 then return 'wait'; end if;
  insert into lag_posts (player_id, port, k, sp, place, nm, boat)
    values (p, pt, lag_post.k, case when lag_post.sp ~ '^[a-z]{1,16}$' then lag_post.sp end, case when lag_post.place ~ '^[A-Za-z0-9_-]{1,40}$' then lag_post.place end,
            case when lag_post.nm is null or lag_post.nm <> lag_post.nm then null else least(greatest(lag_post.nm, 0), 999) end,
            left(btrim(regexp_replace(coalesce(lag_post.boat, ''), '[<>&"''`\\]', '', 'g')), 24));
  delete from lag_posts where at < now() - interval '48 hours';
  return 'ok';
end $$;

-- my club's board, the last 48 hours, newest first: [{user, boat, k, sp, place, nm, age (s), me}]
create or replace function public.lag_board() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('user', coalesce(nm.name, ''), 'boat', x.boat, 'k', x.k, 'sp', x.sp, 'place', x.place, 'nm', x.nm,
           'age', round(extract(epoch from (now() - x.at))::numeric), 'me', x.player_id = pid()) order by x.at desc), '[]'::jsonb)
    from (select * from lag_posts x where x.port = (select m.port from lag_members m where m.player_id = pid()) and x.at > now() - interval '48 hours' order by x.at desc limit 30) x
    left join names nm on nm.player_id = x.player_id and nm.removed_at is null
$$;
revoke all on function public.lag_post(integer, text, text, real, text), public.lag_board() from public, anon, authenticated;
grant execute on function public.lag_post(integer, text, text, real, text), public.lag_board() to authenticated;
