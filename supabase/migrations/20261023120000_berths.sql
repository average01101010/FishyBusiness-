-- The berths in the coast's harbours (src/js/core/07e-havn.js; Jonas 23.10.2026: «Serveren holder rede på hvem som ligger hvor, så to
-- spillere aldri får samme plass»). A berth a player's boat lies at, or holds as her operations plan's home, is that player's; nobody
-- else gets it. The slot is the berth's key from the map data (the harbour, the quay face or the dock side, and where along it), the same
-- in every game. Its place and the boat's size go with it, so the other games keep their own boats and the harbour's off it. A claim not
-- renewed in 30 days lapses (a game no longer played). At most 30 per player: a company's fleet and the homes of its plans.
create table if not exists public.berths (
  slot text primary key,
  hid text not null,
  player_id text not null references public.players(id) on delete cascade,
  vessel text not null default '',
  x real not null,
  y real not null,
  hd real not null default 0,
  len real not null default 10,
  beam real not null default 3,
  at timestamptz not null default now()
);
create index if not exists berths_hid on public.berths (hid);
create index if not exists berths_player on public.berths (player_id);
alter table public.berths enable row level security;
-- (no policies: the table is reached through the functions only)

-- the berths held in a harbour, the caller's own marked
create or replace function public.berth_get(hid text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('slot', b.slot, 'x', b.x, 'y', b.y, 'hd', b.hd, 'len', b.len, 'beam', b.beam,
           'mine', b.player_id = pid())), '[]'::jsonb)
    from berths b where b.hid = berth_get.hid and b.at > now() - interval '30 days'
$$;

-- take a berth: 'ok' when it was free, lapsed or the caller's already (renewed), 'taken' when another player holds it, 'full' at 30
create or replace function public.berth_put(slot text, hid text, vessel text, x real, y real, hd real, len real, beam real) returns text
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare p text := pid(); o text;
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if berth_put.slot is null or length(berth_put.slot) > 120 or berth_put.hid is null or length(berth_put.hid) > 40 then raise exception 'bad slot'; end if;
  if berth_put.x is null or berth_put.y is null or berth_put.x <> berth_put.x or berth_put.y <> berth_put.y or abs(berth_put.x) > 5000 or abs(berth_put.y) > 5000 then raise exception 'bad position'; end if;
  select b.player_id into o from berths b where b.slot = berth_put.slot and b.at > now() - interval '30 days';
  if o is not null and o <> p then return 'taken'; end if;
  if o is null and (select count(*) from berths b where b.player_id = p and b.at > now() - interval '30 days') >= 30 then return 'full'; end if;
  insert into berths (slot, hid, player_id, vessel, x, y, hd, len, beam, at)
    values (berth_put.slot, berth_put.hid, p, left(regexp_replace(coalesce(berth_put.vessel, ''), '[^A-Za-z0-9_-]', '', 'g'), 24), berth_put.x, berth_put.y,
            coalesce(berth_put.hd, 0), least(greatest(coalesce(berth_put.len, 10), 2), 120), least(greatest(coalesce(berth_put.beam, 3), 1), 30), now())
    on conflict (slot) do update set hid = excluded.hid, player_id = excluded.player_id, vessel = excluded.vessel, x = excluded.x, y = excluded.y,
      hd = excluded.hd, len = excluded.len, beam = excluded.beam, at = excluded.at;
  return 'ok';
end $$;

-- give a berth up (only the caller's own)
create or replace function public.berth_free(slot text) returns void
language sql security definer set search_path = public as $$
  delete from berths b where b.slot = berth_free.slot and b.player_id = pid()
$$;

revoke all on function public.berth_get(text), public.berth_put(text, text, text, real, real, real, real, real), public.berth_free(text) from public, anon;
grant execute on function public.berth_get(text), public.berth_put(text, text, text, real, real, real, real, real), public.berth_free(text) to authenticated;
