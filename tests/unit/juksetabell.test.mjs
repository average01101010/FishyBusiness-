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

  // KL3 (20261113200000_kapplop.sql, steg 118): the race's checks on the server read the type's highest top speed without trim and its
  // class (cheat_vt.vmax, vcls), and the course (lop_legs). A type the table has no vmax for is checked at 60 knots, and a course that
  // differs from LOP would flag honest attempts at the checkpoints: both held against the game here
  const {LOP, lopVcap, lopCls} = t.K, src = f => readFileSync(join(dir, f), 'utf8'), files = readdirSync(dir).sort();
  let vm = null, legs = null;
  for (const f of files){ const s = src(f), m = s.match(/update public\.cheat_vt v set vmax = x\.vmax, vcls = x\.vcls from \(values([\s\S]*?)\) as x/);
    if (m) vm = Object.fromEntries([...m[1].matchAll(/\('([a-z0-9_]+)',\s*([0-9.]+),\s*'([a-z]+)'\)/g)].map(r => [r[1], [+r[2], r[3]]]));
    const g = s.match(/insert into public\.lop_legs \([^)]*\) values([\s\S]*?)on conflict/);
    if (g) legs = [...g[1].matchAll(/\('([a-z]+)',\s*(\d+),\s*([-0-9.,\s]+)\)/g)].map(r => [r[1], +r[2]].concat(r[3].split(',').map(Number))); }
  t.ok(vm && Object.keys(vm).length > 0, 'en migrering setter cheat_vt.vmax og vcls');
  t.eq(Object.keys(VESSELS).filter(k => !vm || !vm[k] || vm[k][0] !== lopVcap(k) || vm[k][1] !== lopCls(VESSELS[k])), [],
    'cheat_vt.vmax er lopVcap og vcls er lopCls for hver båttype; en ny eller endret båt trenger en ny migrering');
  const pts = [LOP.start].concat(LOP.cps), r2 = v => Math.round(v * 100) / 100, want = LOP.legs.map((L, j) => { const a = pts[j], b = LOP.cps[j];
    return ['lnk', j, L.nm, 0, r2(a.p.x), r2(a.p.y), a.r].concat(b ? [r2(b.p.x), r2(b.p.y), b.r] : [r2(LOP.goal.p.x), r2(LOP.goal.p.y), LOP.goal.north]); });
  t.eq(legs, want, 'lop_legs er løypa i LOP: veien per etappe, start og sjekkpunktene med radiusen, og mållinja nord for kappet');
}
