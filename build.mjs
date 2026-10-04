#!/usr/bin/env node
// Assembles src/ into one self-contained page, dist/index.html, which is what gets published as the artifact.
// src/index.html is the template. Every @include(path) is replaced by that file (path relative to src/),
// minus its final newline, and included files may include others. In JS, a JSON value is written
// /*@include(path)*/null so the source file still parses on its own; the whole placeholder is replaced.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
// KYST_DIST: another output folder (to build and test while a test run still reads dist/)
// KYST_PWA=1: the app for the home screen (P1 of the PWA plan, 03.10.2026) in dist-pwa/: the same page with a manifest, a service
// worker (src/pwa/sw.js) and the icons, for GitHub Pages (.github/workflows/pwa.yml). The artifact (dist/) has none of them.
// KYST_VEC: whether the coast's 'vec' packs (buildings, roads, bridges, piers and quays per tile, kart-5 on; 35 MB for the whole coast)
// go with the map: in the app always, in the artifact only with KYST_VEC=1 (it has 256 MB a version, and the map is near that), where
// Senja's embedded buildings and roads stand alone as before
const PWA = process.env.KYST_PWA === '1', VECP = PWA || process.env.KYST_VEC === '1';
const DIST = process.env.KYST_DIST || join(ROOT, PWA ? 'dist-pwa' : 'dist'), OUT = join(DIST, 'index.html');

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
let page = html;
if (PWA){
  // the manifest and the icon in the head; the service worker registered once the page has loaded, and the storage asked to be kept
  const head = '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#0b1622"><link rel="apple-touch-icon" href="icon-192.png"><meta name="mobile-web-app-capable" content="yes">';
  const reg = '<script>if (\'serviceWorker\' in navigator) addEventListener(\'load\', () => navigator.serviceWorker.register(\'sw.js\').catch(e => console.warn(\'sw\', e)));' +
    'if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});</script>';
  const h = page.indexOf('</head>'), b = page.lastIndexOf('</body>');
  if (h < 0 || b < 0) { console.error('build: no </head> or </body> for the app'); process.exit(1); }
  page = page.slice(0, h) + head + page.slice(h, b) + reg + page.slice(b);
}
writeFileSync(OUT, page);
console.log(`${basename(DIST)}/index.html: ${(Buffer.byteLength(page) / 1e6).toFixed(2)} MB`);
// the map's rasters in packs of 10 km blocks, made by the map pipeline (tools/map/region.py, phase K5 of the coast plan) into
// src/data/map/ and fetched by the page from map/. The whole coast (tools/map/game.py: src/data/map with a release's tiles) is taken
// from tools/map/out/game/ when it is there, or from KYST_MAP
const GAMEMAP = join(ROOT, 'tools', 'map', 'out', 'game');
const MAPSRC = process.env.KYST_MAP || (existsSync(join(GAMEMAP, 'manifest.json')) ? GAMEMAP : join(SRC, 'data', 'map')), MAPOUT = join(DIST, 'map');
if (existsSync(MAPOUT)) rmSync(MAPOUT, {recursive:true});
mkdirSync(MAPOUT, {recursive:true});
let mapBytes = 0; const mapFiles = readdirSync(MAPSRC).filter(f => f.endsWith('.wasm') && (VECP || !f.startsWith('vec-')));
for (const f of mapFiles){ copyFileSync(join(MAPSRC, f), join(MAPOUT, f)); mapBytes += statSync(join(MAPSRC, f)).size; }
const mapMan = JSON.parse(readFileSync(join(MAPSRC, 'manifest.json'), 'utf8')); if (!VECP) mapMan.packs = mapMan.packs.filter(p => p.kind !== 'vec');
writeFileSync(join(MAPOUT, 'manifest.json'), JSON.stringify(mapMan)); mapFiles.push('manifest.json');
console.log(`${basename(DIST)}/map/: ${mapFiles.length - 1} packs, ${(mapBytes / 1e6).toFixed(2)} MB (${MAPSRC === GAMEMAP ? 'the whole coast, tools/map/out/game' : MAPSRC})`);
// the app's own files: the manifest, the icons, and the service worker with the build's version (the page and the map's manifest)
if (PWA){
  const P = join(SRC, 'pwa'), ver = createHash('sha256').update(page).update(readFileSync(join(MAPOUT, 'manifest.json'))).digest('hex').slice(0, 12);
  for (const f of readdirSync(P)){ if (f === 'sw.js') writeFileSync(join(DIST, f), readFileSync(join(P, f), 'utf8').replace('@V@', ver)); else copyFileSync(join(P, f), join(DIST, f)); }
  console.log(`dist-pwa/: the app's files (service worker ${ver})`);
}
// the admin dashboard (docs/lansering.md E): its own page at /admin/, with the cloud's public address and key (src/data/cloud.json)
// put in; the app and a local build both get it (the dashboard asks for the admin's sign-in with a second factor before any number)
{ const A = join(SRC, 'admin');
  if (existsSync(A)){ mkdirSync(join(DIST, 'admin'), {recursive:true});
    const cfg = readFileSync(join(SRC, 'data', 'cloud.json'), 'utf8').trim();
    writeFileSync(join(DIST, 'admin', 'index.html'), readFileSync(join(A, 'index.html'), 'utf8').replace('/*@cloud*/null', cfg)); } }
// the privacy and terms pages (docs/lansering.md D) next to the game, as the sign-in and the consent link them (personvern.html,
// vilkar.html), each with the shared style put in
{ const L = join(SRC, 'legal');
  if (existsSync(L)){ const css = '<style>\n' + readFileSync(join(L, 'legal.css'), 'utf8') + '</style>';
    for (const f of readdirSync(L).filter(f => f.endsWith('.html'))) writeFileSync(join(DIST, f), readFileSync(join(L, f), 'utf8').replace('<!--@css-->', css)); } }
