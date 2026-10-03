#!/usr/bin/env node
// Assembles src/ into one self-contained page, dist/index.html, which is what gets published as the artifact.
// src/index.html is the template. Every @include(path) is replaced by that file (path relative to src/),
// minus its final newline, and included files may include others. In JS, a JSON value is written
// /*@include(path)*/null so the source file still parses on its own; the whole placeholder is replaced.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
// KYST_DIST: another output folder (to build and test while a test run still reads dist/)
const DIST = process.env.KYST_DIST || join(ROOT, 'dist'), OUT = join(DIST, 'index.html');

function expand(file, stack = []){
  if (stack.includes(file)) throw new Error('include cycle: ' + [...stack, file].join(' -> '));
  const text = readFileSync(join(SRC, file), 'utf8');
  return text.replace(/\/\*@include\(([^)]+)\)\*\/null|@include\(([^)]+)\)/g,
    (_, jsonPath, path) => expand(jsonPath || path, [...stack, file]).replace(/\n$/, ''));
}

const html = expand('index.html');
// every script must compile as a whole: the core and UI files share one script, so a name declared twice at the top level
// (which node --check on each file cannot see) stops the page. Here it stops the build instead.
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)){
  try { new vm.Script(m[1]); }
  catch (e){
    const at = /:(\d+)/.exec(e.stack.split('\n')[0] || '') || [], line = at[1] ? m[1].split('\n')[at[1] - 1] : '';
    console.error('build: a script does not compile: ' + e.message + (line ? '\n  ' + line.trim().slice(0, 160) : '')); process.exit(1);
  }
}
mkdirSync(dirname(OUT), {recursive:true});
writeFileSync(OUT, html);
console.log(`dist/index.html: ${(Buffer.byteLength(html) / 1e6).toFixed(2)} MB`);
// the map's rasters in packs of 10 km blocks, made by the map pipeline (tools/map/region.py, phase K5 of the coast plan) into
// src/data/map/ and fetched by the page from map/. The whole coast (tools/map/game.py: src/data/map with a release's tiles) is taken
// from tools/map/out/game/ when it is there, or from KYST_MAP
const GAMEMAP = join(ROOT, 'tools', 'map', 'out', 'game');
const MAPSRC = process.env.KYST_MAP || (existsSync(join(GAMEMAP, 'manifest.json')) ? GAMEMAP : join(SRC, 'data', 'map')), MAPOUT = join(DIST, 'map');
if (existsSync(MAPOUT)) rmSync(MAPOUT, {recursive:true});
mkdirSync(MAPOUT, {recursive:true});
let mapBytes = 0; const mapFiles = readdirSync(MAPSRC).filter(f => f === 'manifest.json' || f.endsWith('.wasm'));
for (const f of mapFiles){ copyFileSync(join(MAPSRC, f), join(MAPOUT, f)); if (f.endsWith('.wasm')) mapBytes += statSync(join(MAPSRC, f)).size; }
console.log(`dist/map/: ${mapFiles.length - 1} packs, ${(mapBytes / 1e6).toFixed(2)} MB (${MAPSRC === GAMEMAP ? 'the whole coast, tools/map/out/game' : MAPSRC})`);
