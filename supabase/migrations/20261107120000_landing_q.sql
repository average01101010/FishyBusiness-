-- The queue at the fish plants (docs/planer/etter-tonys-test.md K2, Jonas 07.11.2026, V2 A and V3 A: «La det være mulig at det blir kø
-- ved mottakene … Det insentiverer at brukerne sprer seg i landet»). A plant has a few landing places (the game works them out from the
-- quay's length, 1 to 4, and sends the number); a boat that comes with fish asks for one, lands at once when one is free and nobody waits
-- before her, else waits her turn in the order she came. One row per player: where she is, since when, and when her landing started
-- and ends. A landing past its end by three minutes, or a wait not renewed in a minute (a closed page), is gone, so nobody holds a quay
-- from a dead tab. The table is reached through the functions only.
create table if not exists public.landing_q (
  player_id text primary key references public.players(id) on delete cascade,
  port text not null check (char_length(port) <= 40),
  kg real not null default 0,
  since timestamptz not null default now(),
  seen timestamptz not null default now(),
  started timestamptz,
  until timestamptz
);
create index if not exists landing_q_port on public.landing_q (port, since);
alter table public.landing_q enable row level security;

-- the rows that are gone: a landing three minutes past its end, a wait a page stopped renewing a minute ago
create or replace function public.land_sweep() returns void
language sql security definer set search_path = public as $$
  delete from landing_q q where (q.started is not null and q.until < now() - interval '3 minutes') or (q.started is null and q.seen < now() - interval '60 seconds')
$$;

-- ask for a place at the plant (called again every so often while waiting): {go:true, until} when the landing is on (started now, or
-- before), else {go:false, ahead, active, slots, wait_s}. dur_s: the landing's length in real seconds; slots: the plant's places (1-4).
-- Coming to another plant starts the wait anew there.
create or replace function public.land_begin(port text, kg real, dur_s integer, slots integer) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare p text := pid(); me landing_q; n_act int; ahead int; nxt timestamptz;
  sl int := least(greatest(coalesce(land_begin.slots, 1), 1), 4); d int := least(greatest(coalesce(land_begin.dur_s, 60), 10), 86400);
begin
  if p is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from players where id = p) then raise exception 'no player'; end if;
  if land_begin.port is null or length(land_begin.port) > 40 then raise exception 'bad port'; end if;
  perform land_sweep();
  insert into landing_q (player_id, port, kg, since, seen) values (p, land_begin.port, least(greatest(coalesce(land_begin.kg, 0), 0), 1000000), now(), now())
    on conflict (player_id) do update set seen = now(), kg = excluded.kg, port = excluded.port,
      since = case when landing_q.port = excluded.port then landing_q.since else now() end,
      started = case when landing_q.port = excluded.port then landing_q.started else null end,
      until = case when landing_q.port = excluded.port then landing_q.until else null end;
  select * into me from landing_q q where q.player_id = p;
  if me.started is not null then return jsonb_build_object('go', true, 'until', me.until, 'slots', sl); end if;
  select count(*) into n_act from landing_q q where q.port = land_begin.port and q.started is not null;
  select count(*) into ahead from landing_q q where q.port = land_begin.port and q.started is null and q.since < me.since;
  if n_act < sl and ahead = 0 then
    update landing_q q set started = now(), until = now() + make_interval(secs => d) where q.player_id = p;
    return jsonb_build_object('go', true, 'until', now() + make_interval(secs => d), 'slots', sl);
  end if;
  -- the wait, roughly: the first place that frees, and one landing of her own length for each boat ahead
  select min(q.until) into nxt from landing_q q where q.port = land_begin.port and q.started is not null;
  return jsonb_build_object('go', false, 'ahead', ahead, 'active', n_act, 'slots', sl,
    'wait_s', greatest(0, extract(epoch from (coalesce(nxt, now()) - now())))::int + ahead * d);
end $$;

-- the landing is over, or she gave up her place
create or replace function public.land_end() returns void
language sql security definer set search_path = public as $$
  delete from landing_q q where q.player_id = pid()
$$;

-- the queues at some plants now (the ones near by, for «Lever et annet sted»): [{port, active, waiting}], only the plants with anyone
create or replace function public.land_look(ports text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p text := pid(); out jsonb;
begin
  if p is null then raise exception 'not signed in'; end if;
  if land_look.ports is null or array_length(land_look.ports, 1) > 12 then raise exception 'bad ports'; end if;
  perform land_sweep();
  select coalesce(jsonb_agg(jsonb_build_object('port', q.port, 'active', q.active, 'waiting', q.waiting)), '[]'::jsonb) into out
    from (select port, count(*) filter (where started is not null) as active, count(*) filter (where started is null) as waiting
            from landing_q where port = any(land_look.ports) group by port) q;
  return out;
end $$;

revoke all on function public.land_sweep(), public.land_begin(text, real, integer, integer), public.land_end(), public.land_look(text[]) from public, anon;
grant execute on function public.land_begin(text, real, integer, integer), public.land_end(), public.land_look(text[]) to authenticated;
