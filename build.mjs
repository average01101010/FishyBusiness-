#!/usr/bin/env node
// Assembles src/ into one self-contained page, dist/index.html, which is what gets published as the artifact.
// src/index.html is the template. Every @include(path) is replaced by that file (path relative to src/),
// minus its final newline, and included files may include others. In JS, a JSON value is written
// /*@include(path)*/null so the source file still parses on its own; the whole placeholder is replaced. /*@text(path)*/null puts the file
// in as a string literal instead (B2, 01.11.2026: fiske.json is read with JSON.parse the first time the fishing needs it; as an object
// literal its 366 kB cost 51 ms at startup in Chromium, 73 ms with the CPU slowed four times).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { brotliCompressSync, gzipSync, constants as ZC } from 'node:zlib';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
// KYST_DIST: another output folder (to build and test while a test run still reads dist/)
// KYST_PWA=1: the app for the home screen (P1 of the PWA plan, 03.10.2026) in dist-pwa/: the same page with a manifest, a service
// worker (src/pwa/sw.js) and the icons, for GitHub Pages (.github/workflows/pwa.yml). The artifact (dist/) has none of them.
// KYST_VEC: whether the coast's 'vec' packs (buildings, roads, bridges, piers and quays per tile, kart-5 on; 35 MB for the whole coast)
// go with the map: in the app always, in the artifact only with KYST_VEC=1 (it has 256 MB a version, and the map is near that), where
// Senja's embedded buildings and roads stand alone as before
// KYST_ONE=1: the page as one file with the models inside it, as the artifact had it. Otherwise (29.10.2026, Jonas: «Du kan godt lempe
// på regelen om at siden må være 1 fil, om det gjør opplevelsen for meg og brukerne bedre») the models, the pictures and Senja's
// buildings (src/data/*.b64, 36 MB of base64 in <script type="application/octet-stream"> elements) go out of the page as binary files
// in data/, named by their hash like the map packs, fetched by the page at boot (ui/11-boot.js bootData) and cached by the service
// worker. The page falls from 38 MB to 6 MB, a build changes only the files it changed, and a model is downloaded once.
const PWA = process.env.KYST_PWA === '1', VECP = PWA || process.env.KYST_VEC === '1', ONE = process.env.KYST_ONE === '1';
const DIST = process.env.KYST_DIST || join(ROOT, PWA ? 'dist-pwa' : 'dist'), OUT = join(DIST, 'index.html');

// The source map (02.11.2026, the error trap js/errtrap.js): every JS file starts with a mark /*@@src <file>:1@@*/, and after a file
// included inside a JS file the parent's place is marked again (/*@@src <parent>:<line>@@*/). At the end (srcMarks) the marks are
// taken out and become a table of the page's lines: from page line L on, the code is <file> from line N. The table goes last in the
// page (DSB_SRCMAP), so it moves no line, and the cloud (ui/10f-cloud.js srcMapStr) turns «index.html:41234:17» in an error's stack
// into «ui/10f-cloud.js:248:17» before it is sent: the error list then points at the file and line to fix.
const MARK = (f, l) => `/*@@src ${f}:${l}@@*/`;
function expand(file, stack = []){
  if (stack.includes(file)) throw new Error('include cycle: ' + [...stack, file].join(' -> '));
  const text = readFileSync(join(SRC, file), 'utf8'), js = file.endsWith('.js');
  // (@text puts a file in as one line, so the lines after it are where they were)
  const out = text.replace(/\/\*@text\(([^)]+)\)\*\/null/g, (_, path) => JSON.stringify(readFileSync(join(SRC, path), 'utf8').replace(/\n$/, '')).replace(/<\//g, '<\\/'))
    .replace(/\/\*@include\(([^)]+)\)\*\/null|@include\(([^)]+)\)/g,
    (_, jsonPath, path, at, whole) => expand(jsonPath || path, [...stack, file]).replace(/\n$/, '') + (js ? MARK(file, whole.slice(0, at).split('\n').length) : ''));
  return js ? MARK(file, 1) + out : out;
}
function srcMarks(page){
  const lines = page.split('\n'), files = [], m = [];
  for (let i = 0; i < lines.length; i++){
    if (!lines[i].includes('/*@@src ')) continue;
    let last = null;
    lines[i] = lines[i].replace(/\/\*@@src ([^@]+?):(\d+)@@\*\//g, (_, f, l) => { last = [f, +l]; return ''; });
    let k = files.indexOf(last[0]); if (k < 0){ k = files.length; files.push(last[0]); }
    m.push(i + 1, k, last[1]);   // (the last mark on a line: a file that ends there and its parent going on)
  }
  return {page:lines.join('\n'), map:{f:files.map(f => f.replace(/^js\//, '')), m}};
}

// KYST_DEMO=1 (M9, docs/planer/butikker-og-sponsorer.md 4.6): the demo build for a prospective partner, with the made-up test sponsor
// «Nordlys Utstyr» on from the start (as #sptest), so every format can be shown on the tablet. Never the game's own build; put it in a
// folder of its own (KYST_DIST=dist-demo)
const DEMO = process.env.KYST_DEMO === '1';
const html = expand('index.html').replace('/*@demo*/false', DEMO ? 'true' : 'false');
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
// the data elements out of the page: each <script id="X" type="application/octet-stream" …>base64</script> becomes an empty element
// with data-src="data/X-<hash>.bin" and the bytes go to that file; data/manifest.json lists them for the service worker's pruning
const DATAOUT = join(DIST, 'data'); if (existsSync(DATAOUT)) rmSync(DATAOUT, {recursive:true});
let dataFiles = [], dataBytes = 0;
if (!ONE){
  mkdirSync(DATAOUT, {recursive:true});
  page = page.replace(/<script id="([^"]+)" type="application\/octet-stream"([^>]*)>([^<]*)<\/script>/g, (m, id, attrs, b64) => {
    const bytes = Buffer.from(b64.trim(), 'base64'), file = id + '-' + createHash('sha256').update(bytes).digest('hex').slice(0, 12) + '.bin';
    writeFileSync(join(DATAOUT, file), bytes); dataFiles.push({id, file, bytes:bytes.length}); dataBytes += bytes.length;
    // the app's files also compressed beside them (04.11.2026): Caddy serves an octet-stream as it is (its encode compresses only text,
    // JSON, wasm and the like), so the 66 MB went over the net uncompressed; with «file_server { precompressed br gzip }»
    // (tools/server/Caddyfile) the browser gets X.bin.br (19 MB in all) or X.bin.gz (24 MB) and sees X.bin. About 9 s in a build.
    if (PWA){ writeFileSync(join(DATAOUT, file + '.br'), brotliCompressSync(bytes, {params:{[ZC.BROTLI_PARAM_QUALITY]:9, [ZC.BROTLI_PARAM_SIZE_HINT]:bytes.length}}));
      writeFileSync(join(DATAOUT, file + '.gz'), gzipSync(bytes, {level:9})); }
    return `<script id="${id}" type="application/octet-stream"${attrs} data-src="data/${file}" data-b="${bytes.length}"></script>`;
  });
  writeFileSync(join(DATAOUT, 'manifest.json'), JSON.stringify({v:1, files:dataFiles}));
}
if (PWA){
  // the manifest and the icon in the head; the service worker registered once the page has loaded, and the storage asked to be kept
  const head = '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#0b1622"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="icon" href="icon-192.png" sizes="192x192"><link rel="apple-touch-icon" href="icon-192.png"><meta name="mobile-web-app-capable" content="yes">';
  const reg = '<script>if (\'serviceWorker\' in navigator) addEventListener(\'load\', () => navigator.serviceWorker.register(\'sw.js\').catch(e => console.warn(\'sw\', e)));' +
    'if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});</script>';
  const h = page.indexOf('</head>'), b = page.lastIndexOf('</body>');
  if (h < 0 || b < 0) { console.error('build: no </head> or </body> for the app'); process.exit(1); }
  page = page.slice(0, h) + head + page.slice(h, b) + reg + page.slice(b);
}
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
// the build's version (29.10.2026): the first 12 hex of the sha256 of the page and the map's manifest, the same the service worker's
// cache name has (@V@ in src/pwa/sw.js), written into the page as <meta name="dsb-version"> so the telemetry (ui/10f-cloud.js cloudMeta)
// and the admin's tables tell the builds apart; until now every build reported 'dev'
const ver = createHash('sha256').update(page).update(JSON.stringify(mapMan)).update(JSON.stringify(dataFiles)).digest('hex').slice(0, 12);
page = page.replace('</head>', `<meta name="dsb-version" content="${ver}">\n</head>`);
// and beside the page, for an open game to ask whether a newer build is out (ui/10p-install.js UPDATE; Jonas 06.11.2026)
writeFileSync(join(DIST, 'version.json'), JSON.stringify({v:ver, at:new Date().toISOString()}));
{ const sm = srcMarks(page), b = sm.page.lastIndexOf('</body>');
  if (b < 0){ console.error('build: no </body> for the source map'); process.exit(1); }
  page = sm.page.slice(0, b) + '<script>window.DSB_SRCMAP=' + JSON.stringify(sm.map) + ';</script>' + sm.page.slice(b); }
writeFileSync(OUT, page);
console.log(`${basename(DIST)}/index.html: ${(Buffer.byteLength(page) / 1e6).toFixed(2)} MB, version ${ver}`);
console.log(`${basename(DIST)}/map/: ${mapFiles.length - 1} packs, ${(mapBytes / 1e6).toFixed(2)} MB (${MAPSRC === GAMEMAP ? 'the whole coast, tools/map/out/game' : MAPSRC})`);
if (!ONE) console.log(`${basename(DIST)}/data/: ${dataFiles.length} files, ${(dataBytes / 1e6).toFixed(2)} MB (the models, the pictures and Senja's buildings; KYST_ONE=1 keeps them in the page)`);
// the app's own files: the manifest, the icons, and the service worker with the build's version (the page and the map's manifest)
if (PWA){
  const P = join(SRC, 'pwa');
  for (const f of readdirSync(P)){ if (f === 'sw.js') writeFileSync(join(DIST, f), readFileSync(join(P, f), 'utf8').replace('@V@', ver)); else copyFileSync(join(P, f), join(DIST, f)); }
  console.log(`dist-pwa/: the app's files (service worker ${ver})`);
}
// the admin dashboard (docs/lansering.md E): its own page at /admin/, with the cloud's public address and key (src/data/cloud.json)
// put in; the app and a local build both get it (the dashboard asks for the admin's sign-in with a second factor before any number)
{ const A = join(SRC, 'admin');
  if (existsSync(A)){ mkdirSync(join(DIST, 'admin'), {recursive:true});
    const cfg = readFileSync(join(SRC, 'data', 'cloud.json'), 'utf8').trim();
    // the ports' names and parts of the coast for the media card (src/data/port-regions.json, written by tests/unit/regions.test.mjs)
    const reg = existsSync(join(SRC, 'data', 'port-regions.json')) ? readFileSync(join(SRC, 'data', 'port-regions.json'), 'utf8').trim() : 'null';
    let page = readFileSync(join(A, 'index.html'), 'utf8').replace('/*@cloud*/null', cfg).replace('/*@regions*/null', reg);
    // a strict CSP for the admin page (Ø6 funn 15, 05.11.2026): only its own script, by its hash, runs; it talks only to Supabase.
    // Text from the players that slipped past esc() could then not run with the admin's session (funn 1). Images and the TOTP code
    // are data: URLs, the feedback videos are signed URLs from Supabase's storage. frame-ancestors cannot be set in a meta tag; the
    // Caddyfile sends it (tools/server/Caddyfile).
    const js = page.match(/<script>([\s\S]*?)<\/script>/), sb = (() => { try { return new URL(JSON.parse(cfg).supabaseUrl).origin; } catch (e){ return ''; } })();
    if (js && (page.match(/<script/g) || []).length === 1){
      const h = createHash('sha256').update(js[1], 'utf8').digest('base64');
      const csp = "default-src 'none'; script-src 'sha256-" + h + "'; style-src 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src blob:" + (sb ? ' ' + sb : '') +
        "; connect-src" + (sb ? ' ' + sb : " 'none'") + "; base-uri 'none'; form-action 'none'";
      page = page.replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="noindex, nofollow">\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">');
    } else console.warn('admin: not one inline script, so no CSP');
    writeFileSync(join(DIST, 'admin', 'index.html'), page); } }
// the privacy and terms pages (docs/lansering.md D) next to the game, as the sign-in and the consent link them (personvern.html,
// vilkar.html), each with the shared style put in
// and the logo (src/brand/logo.svg, in the ink's colour) in the header
{ const L = join(SRC, 'legal');
  if (existsSync(L)){ const css = '<style>\n' + readFileSync(join(L, 'legal.css'), 'utf8') + '</style>', logo = readFileSync(join(SRC, 'brand', 'logo.svg'), 'utf8').trim();
    for (const f of readdirSync(L).filter(f => f.endsWith('.html'))) writeFileSync(join(DIST, f), readFileSync(join(L, f), 'utf8').replace('<!--@css-->', css).replace('<!--@logo-->', logo)); } }
