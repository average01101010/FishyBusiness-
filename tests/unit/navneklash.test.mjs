// No two top-level names in the page's one script (07.11.2026). src/index.html puts js/core/* and js/ui/* into the same <script>, so a
// function of the same name later in the order silently takes the place of the first: the paint shop's regFree (the registration mark,
// b8aaaa50) replaced core/03d-quota.js regFree (the register of fishing rights), and a boat traded in no longer gave its right back. A
// const or let of the same name stops the whole script. The unit tests load the core only and could not see it.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

export default function (t){
  const files = [...readFileSync(join(SRC, 'index.html'), 'utf8').matchAll(/@include\((js\/(?:core|ui)\/[^)]+\.js)\)/g)].map(m => m[1]), seen = {}, dup = [];
  for (const f of files) readFileSync(join(SRC, f), 'utf8').split('\n').forEach((l, i) => {
    const m = l.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/); if (!m) return;
    const n = m[1] || m[2], at = f + ':' + (i + 1); if (seen[n]) dup.push(n + ' (' + seen[n] + ' og ' + at + ')'); else seen[n] = at; });
  t.ok(files.length > 100 && Object.keys(seen).length > 2000, 'filene i sidens skript er lest (' + files.length + ' filer, ' + Object.keys(seen).length + ' navn)');
  t.eq(dup, [], 'ingen to navn på toppnivå er like i kjernen og UI-et');
}
