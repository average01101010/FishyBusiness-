#!/usr/bin/env node
// Unit tests for the core (29.10.2026): the pure simulation logic (quotas, rules, stability …) checked in Node in well under a second,
// without a build, a browser or Playwright. The core files cannot be imported one by one (they share one script scope and depend on
// the order in src/index.html), so this assembles js/core/* in the template's order, expands the @include data as build.mjs does, and
// runs the whole core once in a node:vm context with the browser stubbed (no location, so the world clock is off and the game keeps
// its own clock from 0). Each *.test.mjs in this folder gets a context of its own and the core's functions by name.
//
//   node tests/unit/run.mjs            all the tests
//   node tests/unit/run.mjs quota      the files whose name has «quota»
//
// A test file exports `export default function (t){ … }` and uses t.eq, t.near, t.ok, t.throws and t.K (the core's names), and may export
// `stubs` to change the browser it runs in (location, localStorage …) and call t.fresh(stubs) for a second core. It prints one
// OK line per check and a FEIL line for a failure, as the Playwright tests do; the exit code is 1 on any failure. tests/run.py runs this
// first when a file in src/js/core/ or here has changed, and /lever runs it before a push.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..', '..'), SRC = join(ROOT, 'src');

// the same expansion as build.mjs: @include(path) and /*@include(path)*/null, relative to src/
function expand(file, stack = []){
  if (stack.includes(file)) throw new Error('include cycle: ' + [...stack, file].join(' -> '));
  return readFileSync(join(SRC, file), 'utf8').replace(/\/\*@include\(([^)]+)\)\*\/null|@include\(([^)]+)\)/g,
    (_, jsonPath, path) => expand(jsonPath || path, [...stack, file]).replace(/\n$/, ''));
}
// the core files in the template's order (the template is the one place that order is written)
const coreFiles = [...readFileSync(join(SRC, 'index.html'), 'utf8').matchAll(/@include\((js\/core\/[^)]+)\)/g)].map(m => m[1]);
if (!coreFiles.length) throw new Error('no js/core includes in src/index.html');
const CORE = coreFiles.map(f => `// ---- ${f}\n` + expand(f)).join('\n');

// the names a test may ask for: every top-level function, const and let in the core (one shared script scope, so `let S` and the
// functions are reachable by name from a later script in the same context, which is how the game's own files see them)
const NAMES = [...new Set([...CORE.matchAll(/^(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let)\s+([A-Za-z_$][\w$]*))/gm)].map(m => m[1] || m[2]))];

// the browser, as little of it as the core needs to run its top level: no location (so WCLOCK is off), an empty document, a
// localStorage that keeps nothing, timers that never fire, and a Worker that does nothing (the vec and coast workers are made on demand)
function browserStubs(){
  const noop = () => {}, el = () => ({style:{}, classList:{add:noop, remove:noop, toggle:noop, contains:() => false}, setAttribute:noop, getAttribute:() => null,
    addEventListener:noop, removeEventListener:noop, appendChild:noop, querySelector:() => null, querySelectorAll:() => [], getContext:() => null, textContent:'', hidden:true, dataset:{}});
  const store = {}; const storage = {getItem:k => k in store ? store[k] : null, setItem:(k, v) => { store[k] = String(v); }, removeItem:k => { delete store[k]; }, clear:noop, key:() => null, length:0};
  const document = {getElementById:() => null, querySelector:() => null, querySelectorAll:() => [], createElement:el, createElementNS:el, body:el(), documentElement:el(), head:el(),
    addEventListener:noop, removeEventListener:noop, hidden:false, visibilityState:'visible', fonts:{ready:Promise.resolve()}};
  const window = {document, localStorage:storage, sessionStorage:storage, navigator:{userAgent:'node', language:'nb', onLine:true, storage:{}},
    location:undefined, requestAnimationFrame:() => 0, cancelAnimationFrame:noop, setTimeout:() => 0, clearTimeout:noop, setInterval:() => 0, clearInterval:noop,
    addEventListener:noop, removeEventListener:noop, dispatchEvent:noop, matchMedia:() => ({matches:false, addEventListener:noop}),
    Worker:function (){ this.postMessage = noop; this.terminate = noop; }, Image:function (){}, Audio:function (){}, AudioContext:undefined, webkitAudioContext:undefined,
    fetch:() => Promise.reject(new Error('no network in the unit tests')), screen:{width:1280, height:800}, innerWidth:1280, innerHeight:800, devicePixelRatio:1,
    alert:noop, confirm:() => false, open:noop, scrollTo:noop, getComputedStyle:() => ({getPropertyValue:() => ''}), history:{replaceState:noop, pushState:noop}};
  window.window = window; window.self = window;
  return window;
}

// one fresh core per test file. The core runs as the body of one ordinary function in Node's own realm (a node:vm context makes every
// global lookup go through an interceptor, which made PIERBOX in 07-harbours.js take 13 s instead of 0.1), with the browser's names as
// parameters that shadow Node's globals. The core's top-level functions, consts and lets are then locals of that function, and a direct
// eval appended inside the same body hands them out by name (and `set` assigns to them, so a test can do set('S', newState())).
const PARAMS = ['Math', 'window', 'self', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location', 'requestAnimationFrame', 'cancelAnimationFrame',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'matchMedia', 'Worker', 'Image', 'Audio',
  'AudioContext', 'webkitAudioContext', 'fetch', 'screen', 'innerWidth', 'innerHeight', 'devicePixelRatio', 'alert', 'confirm', 'open', 'scrollTo', 'getComputedStyle', 'history'];
const EXPORTER = `\nconst __K = {set:(n, v) => { __K.__v = v; eval(n + ' = __K.__v'); }, get:n => eval(n)};
for (const n of ${JSON.stringify(NAMES)}) { try { __K[n] = eval(n); } catch (e) {} }
return __K;`;
let coreFn;
// `stubs` from a test file (export const stubs = {location:{hash:'#seed=5', hostname:'localhost'}}) replace the defaults by name. Math is a
// copy of its own (Object.create(Math)) so a core that replaces Math.random (#seed) does not touch the harness's or the next test's
function fresh(stubs){
  coreFn = coreFn || new Function(...PARAMS, CORE + EXPORTER);
  const w = Object.assign(browserStubs(), stubs || {}); w.Math = Object.create(Math);
  return {K:coreFn(...PARAMS.map(p => w[p]))};
}

function harness(name, K){
  const out = [];
  let fails = 0;
  const say = (ok, msg, got) => { out.push((ok ? 'OK ' : 'FEIL ') + name + ': ' + msg + (ok || got === undefined ? '' : ' (fikk ' + fmt(got) + ')')); if (!ok) fails++; };
  const fmt = v => { try { return typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : JSON.stringify(v); } catch (e){ return String(v); } };
  return {
    K, out, get fails(){ return fails; },
    ok:(c, msg) => say(!!c, msg, c),
    eq:(a, b, msg) => say(JSON.stringify(a) === JSON.stringify(b), msg + ' = ' + fmt(b), a),
    near:(a, b, tol, msg) => say(typeof a === 'number' && Math.abs(a - b) <= tol, msg + ' ≈ ' + fmt(b) + ' ±' + fmt(tol), a),
    throws:(fn, msg) => { let t = false; try { fn(); } catch (e){ t = true; } say(t, msg + ' kaster'); },
    note:msg => out.push('   ' + name + ': ' + msg)
  };
}

const want = process.argv.slice(2);
const files = readdirSync(HERE).filter(f => f.endsWith('.test.mjs') && (!want.length || want.some(w => f.includes(w)))).sort();
if (!files.length){ console.error('ingen testfiler' + (want.length ? ' som passer ' + want.join(', ') : '') + ' i tests/unit/'); process.exit(2); }
const t0 = performance.now();
let fails = 0, checks = 0;
for (const f of files){
  const name = basename(f, '.test.mjs');
  const mod = await import(pathToFileURL(join(HERE, f)).href);
  const {K} = fresh(mod.stubs), t = harness(name, K);
  t.fresh = stubs => fresh(stubs).K;   // another core, for a test that compares two runs
  try { mod.default(t); }
  catch (e){ t.out.push('FEIL ' + name + ': ' + (e && e.stack || e)); fails++; }
  for (const line of t.out) console.log(line);
  fails += t.fails; checks += t.out.filter(l => l.startsWith('OK ')).length;
}
console.log(`\n${checks} OK, ${fails} FEIL i ${files.length} fil${files.length === 1 ? '' : 'er'}, på ${Math.round(performance.now() - t0)} ms (kjernen ${(CORE.length / 1e6).toFixed(2)} MB, ${NAMES.length} navn)`);
process.exit(fails ? 1 : 0);
