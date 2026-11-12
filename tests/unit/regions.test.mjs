// The port regions for the admin's media card (M9): every port's name, part of the coast (03e-rules.js landsdel) and county (fylke), in
// src/data/port-regions.json as {id: [name, landsdel, fylke]}, which build.mjs puts into the admin page. The counties are not in the
// game's data: tools/regions/fylke.py asks Kartverket for each port's point (steg 28) and keeps them in tools/regions/fylke.json.
// KYST_WRITE=1 writes tools/regions/havner.json (the points fylke.py asks for) and port-regions.json anew; the check is that the file is
// whole, matches the core, and that every port has a county.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const F = join(ROOT, 'src', 'data', 'port-regions.json'), FY = join(ROOT, 'tools', 'regions', 'fylke.json'), PTS = join(ROOT, 'tools', 'regions', 'havner.json');
// the counties since 01.01.2024 (Kartverket, ws.geonorge.no/kommuneinfo/v1/fylker), and Svalbard, which is in none
const FYLKER = ['Agder', 'Akershus', 'Buskerud', 'Finnmark', 'Innlandet', 'Møre og Romsdal', 'Nordland', 'Oslo', 'Rogaland', 'Telemark', 'Troms', 'Trøndelag', 'Vestfold', 'Vestland', 'Østfold', 'Svalbard'];
export default function (t){
  const {PORTS, landsdel, LL} = t.K, write = process.env.KYST_WRITE === '1' || !existsSync(F);
  const fy = existsSync(FY) ? JSON.parse(readFileSync(FY, 'utf8')) : {}, r5 = v => Math.round(v * 1e5) / 1e5, out = {}, pts = {};
  for (const p of PORTS){ const ll = LL(p.p); pts[p.id] = [r5(ll.lat), r5(ll.lon)]; out[p.id] = [p.name, landsdel(p.p), fy[p.id] ? fy[p.id].fylke : null]; }
  if (write){ writeFileSync(PTS, JSON.stringify(pts) + '\n'); writeFileSync(F, JSON.stringify(out) + '\n'); }
  const had = JSON.parse(readFileSync(F, 'utf8'));
  t.eq(Object.keys(had).length, PORTS.length, 'alle havnene har landsdel og navn (' + PORTS.length + ')');
  t.ok(PORTS.every(p => had[p.id] && had[p.id][1] === landsdel(p.p)), 'og fila stemmer med kjernen (KYST_WRITE=1 node tests/unit/run.mjs regions skriver den på nytt)');
  const noF = PORTS.filter(p => !had[p.id] || !FYLKER.includes(had[p.id][2])).map(p => p.id);
  t.ok(!noF.length, 'alle havnene har fylke fra Kartverket (python3 tools/regions/fylke.py)' + (noF.length ? ': mangler ' + noF.slice(0, 8).join(', ') + (noF.length > 8 ? ' og ' + (noF.length - 8) + ' til' : '') : ''));
  // the point each county was asked for is where the port is now (a port moved in the core is asked again)
  const moved = PORTS.filter(p => fy[p.id] && (Math.abs(fy[p.id].lat - pts[p.id][0]) > 1e-4 || Math.abs(fy[p.id].lon - pts[p.id][1]) > 1e-4)).map(p => p.id);
  t.ok(!moved.length, 'fylket er slått opp der havna ligger nå' + (moved.length ? ': flyttet ' + moved.slice(0, 8).join(', ') : ''));
  // the county agrees with the part of the coast: the ports in Nordland, Troms, Finnmark and Svalbard are all in the north (the north
  // begins at 65° N in landsdel, so two ports of Trøndelag by Leka are in it too, and stay so: the parts of the coast are left as they are)
  const odd = PORTS.filter(p => had[p.id] && ['Nordland', 'Troms', 'Finnmark', 'Svalbard'].includes(had[p.id][2]) && had[p.id][1] !== 'nord').map(p => p.id + ' ' + had[p.id][2] + '/' + had[p.id][1]);
  t.ok(!odd.length, 'havnene i Nordland, Troms, Finnmark og Svalbard er alle nord' + (odd.length ? ': ' + odd.slice(0, 6).join(', ') : ''));
  const known = {finnsnes:'Troms', vangshamn:'Troms', husoy:'Troms'}, bad = Object.entries(known).filter(([id, f]) => !had[id] || had[id][2] !== f);
  t.ok(!bad.length, 'stikkprøve: Finnsnes, Vangshamn og Husøy ligger i Troms' + (bad.length ? ': ' + JSON.stringify(bad.map(([id]) => had[id])) : ''));
}
