-- Kystposten: the coast guard's remark (31.10.2026; docs/planer/oppdrag-2.md V1, core/09j-kystvakt.js kvFinish). A story of kind 'kv'
-- carries the harbour and the rules' codes joined with '-' (f33a-byc), never the catch or the texts; the game reads the codes as their sources.
alter table public.news drop constraint if exists news_kind_check;
alter table public.news add constraint news_kind_check check (kind in ('boat', 'name', 'aground', 'rescue', 'salv', 'foto', 'fish', 'fs', 'ach', 'as', 'tur', 'kvote', 'lag', 'kv'));

create or replace function public.news_put(kind text, gh double precision, x real, y real, boat text default '', company text default '', d jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare p text := pid(); clean jsonb := '{}'::jsonb; k text; v jsonb;
  keys text[] := case news_put.kind
    when 'boat' then array['type', 'nb', 'lic', 'price']
    when 'name' then array['type']
    when 'aground' then array['type']
    when 'rescue' then array['base', 'port', 'type']
    when 'salv' then array['towed', 'port', 'pay', 'val']
    when 'foto' then array['fyr', 'lys']
    when 'fish' then array['sp', 'kg']
    when 'fs' then array['y']
    when 'ach' then array['ch']
    when 'as' then array['type']
    when 'tur' then array['k', 'to', 'from', 'sp', 'kg', 'nm']
    when 'kvote' then array['kf', 'type']
    when 'kv' then array['port', 'k']
    else null end;
begin
  if p is null or is_guest() then raise exception 'not signed in'; end if;
  if keys is null then raise exception 'bad kind'; end if;
  if news_put.gh is null or news_put.gh <> news_put.gh or abs(news_put.gh) > 1e7 or news_put.x is null or news_put.y is null or abs(news_put.x) > 5000 or abs(news_put.y) > 5000 then raise exception 'bad place'; end if;
  if jsonb_typeof(news_put.d) is distinct from 'object' or length(news_put.d::text) > 400 then raise exception 'bad data'; end if;
  if (select count(*) from news n where n.player_id = p and n.at > now() - interval '1 hour') >= 12 then raise exception 'too many'; end if;
  if (select count(*) from news n where n.player_id = p and n.kind = news_put.kind and n.at > now() - interval '10 minutes') >= 2 then return; end if;
  for k, v in select * from jsonb_each(news_put.d) loop
    if k = any(keys) then
      if jsonb_typeof(v) = 'number' then clean := clean || jsonb_build_object(k, least(greatest((v #>> '{}')::double precision, -1e9), 1e9));
      elsif jsonb_typeof(v) = 'string' and (v #>> '{}') ~ '^[A-Za-z0-9_-]{1,24}$' then clean := clean || jsonb_build_object(k, v #>> '{}');
      end if;
    end if;
  end loop;
  insert into news (player_id, gh, kind, x, y, boat, company, d)
    values (p, news_put.gh, news_put.kind, news_put.x, news_put.y,
            left(btrim(regexp_replace(coalesce(news_put.boat, ''), '[<>&"''`\\]', '', 'g')), 24),
            left(btrim(regexp_replace(coalesce(news_put.company, ''), '[<>&"''`\\]', '', 'g')), 40), clean);
end $$;

revoke all on function public.news_put(text, double precision, real, real, text, text, jsonb) from public, anon;
grant execute on function public.news_put(text, double precision, real, real, text, text, jsonb) to authenticated;
