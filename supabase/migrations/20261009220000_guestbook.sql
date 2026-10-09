-- The guestbooks (Jonas 09.10.2026: «Gjestebok i pubben er en god ide. Samme med rorbuer. På denne måten kan man også lage
-- milepælsmål om å besøke flest mulig»; ui/10m-guestbook.js). One book in each pub and each rorbu, the place known by its id in the
-- game. A player signs with one tap: her player name and boat name, and optionally one of the game's preset lines (k, the text is in the
-- game), never free text (players from 13 years). Once a day per place. The book shows the last 30 and how many have signed in all.
-- gb_mine gives the places this player has signed, for Kystfareren on any device. A guest cannot sign. Nothing of the table is open.
create table if not exists public.guestbook (
  id bigserial primary key,
  player_id text not null references public.players(id) on delete cascade,
  place text not null check (place ~ '^[A-Za-z0-9_-]{1,40}$'),
  k smallint not null default -1 check (k between -1 and 15),
  boat text not null default '' check (char_length(boat) <= 24),
  at timestamptz not null default now()
);
create index if not exists guestbook_place on public.guestbook (place, at desc);
create index if not exists guestbook_player on public.guestbook (player_id, at desc);
alter table public.guestbook enable row level security;
revoke all on public.guestbook from anon, authenticated;

-- sign the book at a place: 'ok', 'wait' (signed here within a day) or 'no'
create or replace function public.gb_sign(place text, k int) returns text
language plpgsql security definer set search_path = public as $$
declare p text := pid();
begin
  if p is null or is_guest() or not exists (select 1 from players where id = p and not guest) then return 'no'; end if;
  if gb_sign.place is null or gb_sign.place !~ '^[A-Za-z0-9_-]{1,40}$' then return 'no'; end if;
  if gb_sign.k is null or gb_sign.k < -1 or gb_sign.k > 15 then return 'no'; end if;
  if exists (select 1 from guestbook where player_id = p and guestbook.place = gb_sign.place and at > now() - interval '1 day') then return 'wait'; end if;
  if (select count(*) from guestbook where player_id = p and at > now() - interval '1 hour') >= 30 then return 'wait'; end if;
  insert into guestbook (player_id, place, k, boat)
  values (p, gb_sign.place, gb_sign.k, coalesce((select left(regexp_replace(pr.boat, '[<>&"''`\\]', '', 'g'), 24) from presence pr where pr.player_id = p), ''));
  return 'ok';
end $$;

-- a place's book: {n (players who have signed), rows:[{user, boat, k, age (s), me}]} the last 30, newest first
create or replace function public.gb_get(place text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'n', (select count(distinct g.player_id) from guestbook g join players pl on pl.id = g.player_id where g.place = gb_get.place and not pl.guest),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('user', coalesce(nm.name, ''), 'boat', r.boat, 'k', r.k, 'me', r.player_id = pid(),
        'age', round(extract(epoch from (now() - r.at))::numeric)) order by r.at desc)
      from (select g.* from guestbook g join players pl on pl.id = g.player_id where g.place = gb_get.place and not pl.guest order by g.at desc limit 30) r
      left join names nm on nm.player_id = r.player_id and nm.removed_at is null), '[]'::jsonb))
$$;

-- the places I have signed: ["finnsnes", "rb12", ...]
create or replace function public.gb_mine() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(distinct place), '[]'::jsonb) from guestbook where player_id = pid()
$$;

revoke all on function public.gb_sign(text, int), public.gb_get(text), public.gb_mine() from public, anon, authenticated;
grant execute on function public.gb_sign(text, int), public.gb_get(text), public.gb_mine() to authenticated;
