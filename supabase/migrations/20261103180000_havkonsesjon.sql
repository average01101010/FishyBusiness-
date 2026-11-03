-- H1 of docs/planer/havsteget.md (03.11.2026): the ocean permits in the shared register. One permit per group (torsketrål, the
-- ocean-going conventional vessels, ringnot, snow crab), as many as there are in life (Jonas: «tillatelsene må også være realistiske»):
-- conventional 26 (Fiskeridirektoratet 2025), trawl 36 (snl.no 2019), purse seine 69 (21.10.2025), snow crab 34 (worked out from the
-- vessel quotas); HREG in src/js/core/03d-quota.js. A player who buys an ocean vessel takes the permit from an NPC owner with reg_take,
-- as for the closed group's rights, and one NPC ship of the kind leaves the sea for everybody (the counts come with world_get as before,
-- reg). Nothing else changes: reg_take, reg_free, reg_free_counts and world_get read reg_rights as they are.
alter table public.reg_rights drop constraint if exists reg_rights_id_check;
alter table public.reg_rights add constraint reg_rights_id_check
  check (id in ('u7', 'h7', 'h8', 'h9', 'h10', 'h14', 'h20', 'tral', 'konv', 'rnot', 'krab'));
insert into public.reg_rights (id, total) values ('tral', 36), ('konv', 26), ('rnot', 69), ('krab', 34)
  on conflict (id) do nothing;
-- (a player may hold more than one: the n cap of 20 in reg_held is the same for the ocean permits)
delete from public.world_agg where y is not null;   -- the register changed: the shared picture is worked out again at once
