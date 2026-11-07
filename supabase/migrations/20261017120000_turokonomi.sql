-- The missions' economy (Jonas 17.10.2026, tilbakemelding #72): «Vi må også forsikre oss at spillere ikke kan jukse på noen måte».
-- The save lives in the player's browser and can be edited there; the server cannot stop that, but it can see it. Each time a save comes
-- in, the cash in its summary is held against the one before: a rise the logged landings (event 'sale', kr) and missions (event
-- 'tur_done', pay, from 17.10.2026) cannot account for is flagged for the admin (cash_flags). Nothing is refused and nothing is taken
-- from anyone (Jonas: the flag is shown in admin only). Only players who consent to the statistics send events, so only they are weighed.
create table if not exists public.cash_flags (
  id bigserial primary key, player_id text not null, at timestamptz not null default now(),
  cash0 bigint, cash1 bigint, delta bigint, explained bigint, game_dt bigint, note text);
alter table public.cash_flags enable row level security;
create index if not exists cash_flags_at on public.cash_flags (at desc);

create or replace function public.saves_cash_check() returns trigger language plpgsql security definer set search_path = public as $$
declare c0 bigint; c1 bigint; d bigint; ex bigint; ok boolean;
begin
  c0 := nullif(old.summary->>'cash', '')::bigint; c1 := nullif(new.summary->>'cash', '')::bigint;
  if c0 is null or c1 is null then return new; end if;
  d := c1 - c0; if d < 300000 then return new; end if;
  select coalesce(consent, false) into ok from players where id = new.player_id; if not coalesce(ok, false) then return new; end if;
  select coalesce(sum(case when kind = 'sale' then coalesce((data->>'kr')::bigint, 0) when kind = 'tur_done' then coalesce((data->>'pay')::bigint, 0) else 0 end), 0)
    into ex from events where player_id = new.player_id and kind in ('sale', 'tur_done') and ts > coalesce(old.updated_at, now() - interval '1 day') - interval '10 minutes';
  -- other income the events do not carry (a boat or quota sold, a loan, insurance) is why the margin is wide
  if d > greatest(300000, 2 * ex + 200000) then
    insert into cash_flags (player_id, cash0, cash1, delta, explained, game_dt, note)
      values (new.player_id, c0, c1, d, ex, coalesce(new.game_t, 0) - coalesce(old.game_t, 0), 'cash rose more than the logged landings and missions');
  end if;
  return new;
exception when others then return new;   -- a check must never stop a save
end $$;
drop trigger if exists saves_cash_check on public.saves;
create trigger saves_cash_check before update on public.saves for each row execute function public.saves_cash_check();

-- the admin: the flags, and the missions' share of each player's income (the brake is meant to keep it near 30 %)
create or replace function public.admin_cash_flags(lim integer default 100) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(to_jsonb(f) order by f.at desc) from (select * from cash_flags order by at desc limit lim) f), '[]'::jsonb);
end $$;
create or replace function public.admin_tur_share(days integer default 14) returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  return coalesce((select jsonb_agg(r order by r.tur desc) from (
    select e.player_id as player, max(p.boat) as boat,
      sum(case when e.kind = 'tur_done' then coalesce((e.data->>'pay')::bigint, 0) else 0 end) as tur,
      sum(case when e.kind = 'sale' then coalesce((e.data->>'kr')::bigint, 0) else 0 end) as fish,
      count(*) filter (where e.kind = 'tur_done') as done, count(*) filter (where e.kind = 'tur_fail') as failed
    from events e left join players p on p.id = e.player_id
    where e.kind in ('tur_done', 'tur_fail', 'sale') and e.ts > now() - make_interval(days => days)
    group by e.player_id) r), '[]'::jsonb);
end $$;
