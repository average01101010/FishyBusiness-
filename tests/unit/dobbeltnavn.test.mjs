// No two files of the page declare the same top-level function. Every classic <script> of the page shares one global scope, so the later
// declaration silently takes the earlier one's place: deckcrew.js's seaState() (the crew's sea legs) replaced the core's seaState(hs), and
// the Vær app said «0,1 m · undefined» (found in D5, 13.11.2026; the core's is seaCode now). The files are the template's own includes
// (src/index.html); a declaration is a `function name(` at the start of a line, which the pieces inside one function (ui/phone/, view3d/)
// do not have.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export default function (t){
  const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
  const files = [...fs.readFileSync(path.join(src, 'index.html'), 'utf8').matchAll(/@include\((js\/[^)]+\.js)\)/g)].map(m => m[1]).filter(f => !f.startsWith('js/lib/'));
  const seen = new Map(), dup = [];
  for (const f of files){ const names = new Set([...fs.readFileSync(path.join(src, f), 'utf8').matchAll(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]));
    for (const n of names){ if (seen.has(n)) dup.push(n + ': ' + seen.get(n) + ' and ' + f); else seen.set(n, f); } }
  t.ok(files.length > 100 && seen.size > 1000, 'the template\'s files are read: ' + files.length + ' files, ' + seen.size + ' top-level functions');
  t.eq(dup.join('; '), '', 'no top-level function is declared in two files');
}
