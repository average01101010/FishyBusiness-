// HS5 (supabase/migrations/20261110160000_cheat_flags.sql, docs/planer/haill-saldo.md): the server checks a landing against the hold
// of the boat's type and a save against the price of it, from two small tables in the database (cheat_vt, cheat_sp) copied from
// VESSELS and SPECIES. A type the table does not have counts as 500 kg, so a new or changed boat that is not in the table would give
// honest players a mark. This reads the last migration that fills each table and holds it against the game: every type with its hold
// and price, no species priced above what the table says, and nocatch on the species the game never reports a catch for.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export default function (t){
  const {VESSELS, SPECIES} = t.K, dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'migrations');
  const last = table => { let rows = null;
    for (const f of readdirSync(dir).sort()){ const m = readFileSync(join(dir, f), 'utf8').match(new RegExp('insert into public\\.' + table + ' \\([^)]*\\) values([\\s\\S]*?)on conflict'));
      if (m) rows = [...m[1].matchAll(/\('([a-z0-9_]+)',\s*([0-9.]+)(?:,\s*([0-9.]+|true|false))?\)/g)].map(r => [r[1], +r[2], r[3] == null ? null : r[3] === 'true' ? true : r[3] === 'false' ? false : +r[3]]); }
    return rows; };
  const vt = last('cheat_vt'), sp = last('cheat_sp');
  t.ok(vt && vt.length > 0 && sp && sp.length > 0, 'migreringene fyller cheat_vt og cheat_sp');
  const V = Object.fromEntries((vt || []).map(r => [r[0], r]));
  const off = Object.keys(VESSELS).filter(k => !V[k] || V[k][1] !== VESSELS[k].holdCap || V[k][2] !== VESSELS[k].price);
  t.eq(off, [], 'cheat_vt har hver båttype i VESSELS med lasten (holdCap) og prisen; en ny eller endret båt trenger en ny migrering');
  const P = Object.fromEntries((sp || []).map(r => [r[0], r[1]]));
  const top = s => Math.max(...[].concat(s.pm || [], s.pmF || [], s.pmL || []).filter(x => typeof x === 'number'));
  const low = Object.keys(SPECIES).filter(k => !(P[k] >= top(SPECIES[k])));
  t.eq(low, [], 'cheat_sp har hver art i SPECIES med minst den høyeste prisen arten kan få (pm, pmF, pmL)');
  // the game reports no catch (catch_put) for a species with a stock layer of its own (takeStock: stk or shell)
  const N = Object.fromEntries((sp || []).map(r => [r[0], r[2]]));
  t.eq(Object.keys(SPECIES).filter(k => N[k] !== !!(SPECIES[k].stk || SPECIES[k].shell)), [], 'cheat_sp.nocatch er satt for artene spillet ikke melder fangst for (stk eller shell), og bare dem');
}
