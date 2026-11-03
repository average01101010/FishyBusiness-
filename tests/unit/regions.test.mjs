// The port regions for the admin's media card (M9): every port's name and part of the coast (03e-rules.js landsdel), in
// src/data/port-regions.json, which build.mjs puts into the admin page. KYST_WRITE=1 writes the file anew; the check is that it is
// whole and matches the core.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const F = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data', 'port-regions.json');
export default function (t){
  const {PORTS, landsdel} = t.K, out = {};
  for (const p of PORTS) out[p.id] = [p.name, landsdel(p.p)];
  if (process.env.KYST_WRITE === '1' || !existsSync(F)) writeFileSync(F, JSON.stringify(out) + '\n');
  const had = JSON.parse(readFileSync(F, 'utf8'));
  t.eq(Object.keys(had).length, PORTS.length, 'alle havnene har landsdel og navn (' + PORTS.length + ')');
  t.ok(PORTS.every(p => had[p.id] && had[p.id][1] === landsdel(p.p)), 'og fila stemmer med kjernen (KYST_WRITE=1 node tests/unit/run.mjs regions skriver den på nytt)');
}
