-- The real-time relay's ticket (Ø16, docs/planer/sanntid-posisjoner.md S2; Jonas «kjør på» 03.11.2026). The game opens a WebSocket
-- to the relay on the Hetzner server (tools/server/rt/server.mjs, wss://detstorebla.no/rt) and shows who it is with a ticket from
-- here. The relay checks it without asking the database: the ticket is signed with a secret only the database (Vault, «rt_secret»)
-- and the relay (/etc/dsb-rt.env on the server) know. It is
--   1.<id>.<guest>.<expiry>.<nonce>.<hmac>
-- id the player's public id, left(md5('dsb' || pid), 10), the same as pos_world gives (never the WorkOS id); guest 1 for a guest
-- (an anonymous sign-in, or a player flagged guest), whose boat the relay shows no one, as pos_world; the expiry 60 s on (epoch
-- seconds); a random nonce, so the relay takes each ticket once; and the HMAC-SHA256 of the rest, as 64 hex characters.
-- There is no way to hide the boat (Jonas 07.10.2026). Nothing of the player goes along: no name, no haill, no money.
-- Without the secret in Vault it refuses ('rt off'), and the game keeps to pos_put and pos_world every 15 s, as before.
--
-- The secret: Jonas puts it in once, in SQL Editor, with the line tools/server/setup.sh prints on the server (it is never in the repo):
--   select vault.create_secret('<64 hex characters>', 'rt_secret', 'Sanntidsreléet (rt_ticket)');
-- and to change it later: select vault.update_secret((select id from vault.secrets where name = 'rt_secret'), '<new>');
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.rt_ticket() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare p text := public.pid(); g boolean; k text; pay text;
begin
  if p is null then raise exception 'not signed in'; end if;
  select pl.guest into g from public.players pl where pl.id = p;
  if not found then raise exception 'no player'; end if;
  select s.decrypted_secret into k from vault.decrypted_secrets s where s.name = 'rt_secret' limit 1;
  if k is null or k !~ '^[0-9a-f]{64,}$' then raise exception 'rt off'; end if;
  pay := '1.' || left(md5('dsb' || p), 10) || '.' || case when coalesce(g, false) or public.is_guest() then '1' else '0' end || '.'
         || (floor(extract(epoch from clock_timestamp()))::bigint + 60)::text || '.' || encode(extensions.gen_random_bytes(8), 'hex');
  return pay || '.' || encode(extensions.hmac(pay, k, 'sha256'), 'hex');
end $$;

revoke all on function public.rt_ticket() from public, anon;
grant execute on function public.rt_ticket() to authenticated;
