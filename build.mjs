#!/usr/bin/env node
// Assembles src/ into one self-contained page, dist/index.html, which is what gets published as the artifact.
// src/index.html is the template. Every @include(path) is replaced by that file (path relative to src/),
// minus its final newline, and included files may include others. In JS, a JSON value is written
// /*@include(path)*/null so the source file still parses on its own; the whole placeholder is replaced.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'dist', 'index.html');

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
