-- H3a of docs/planer/havsteget-h3-snokrabbe.md (06.11.2026): the snow crab permits in the shared register are 30, not 34
-- (Fiskeridirektoratet, sak 17/2026: «70 fartøy hadde en slik tillatelse i 2024», and from 2025 «fikk 30 fartøy tillatelse til å
-- delta»); HREG.krab in src/js/core/03d-quota.js. A player who holds one keeps it: reg_free_counts gives total less those held.
update public.reg_rights set total = 30 where id = 'krab';
delete from public.world_agg where y is not null;   -- the register changed: the shared picture is worked out again at once
