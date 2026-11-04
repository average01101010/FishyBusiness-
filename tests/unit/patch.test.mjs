// The patch notes (ui/phone/07-patch.js): every entry is [id, date, no, en, lines] and every line is a pair of strings. A missing comma
// between two lines turns them into an index (`[a, b] [c, d]` is `[a, b][d]`, undefined), and patch() then threw when the app opened
// (the error list 04.11.2026: TypeError reading '0' at 07-patch.js from patch).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export default function (t){
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'js', 'ui', 'phone', '07-patch.js'), 'utf8');
  const a = src.indexOf('const PATCH = ['), b = src.indexOf('const patchNew', a);
  t.ok(a >= 0 && b > a, 'PATCH står i 07-patch.js');
  const PATCH = vm.runInNewContext(src.slice(a + 'const PATCH = '.length, b).trim().replace(/;$/, ''));
  const bad = [];
  for (const p of PATCH){
    if (!Array.isArray(p) || p.length !== 5 || !Array.isArray(p[4]) || !p[4].length) { bad.push(String(p && p[0])); continue; }
    p[4].forEach((l, i) => { if (!Array.isArray(l) || l.length !== 2 || typeof l[0] !== 'string' || typeof l[1] !== 'string') bad.push(p[0] + ' linje ' + i); });
  }
  t.eq(bad, [], 'hver patchnote har id, dato, tittel på to språk og linjer som er par av tekster');
  const ids = PATCH.map(p => p[0]);
  t.eq(ids.filter((id, i) => ids.indexOf(id) !== i), [], 'ingen id er brukt to ganger');
}
