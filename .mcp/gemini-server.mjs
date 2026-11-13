#!/usr/bin/env node
// gemini-reviewer: a local MCP server (stdio) with one tool, ask_gemini, so a
// Claude Code session can ask Gemini for a second opinion: visual checks of
// screenshots and clips, and architecture/performance/aliasing reviews of
// shaders and water physics. Development tooling only; nothing in the game
// uses it. Registered in .mcp.json; needs GEMINI_API_KEY (runs npm ci itself
// when node_modules/ is missing).
//
// stdout is the MCP channel: log only to stderr.

import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The only model this server talks to. Checked against ai.models.list() on
// first use (listed as models/gemini-4-hydrogen on 13.11.2026).
const MODEL = 'gemini-4-hydrogen';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const log = (...a) => console.error('[gemini-reviewer]', ...a);

// A fresh cloud container has no node_modules/: install from the lockfile once,
// with npm's output on stderr so it stays off the MCP channel.
if (!existsSync(path.join(REPO, 'node_modules', '@google', 'genai'))) {
  log('node_modules missing, running npm ci');
  const r = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: REPO, stdio: ['ignore', 2, 2] });
  if (r.status !== 0) log('npm ci failed with status', r.status);
}

const { GoogleGenAI, createPartFromUri } = await import('@google/genai');
const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = await import('zod');

const IMAGE_MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const VIDEO_MIME = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };

// Inline data shares the ~20 MB request cap; larger images go through the Files API.
const INLINE_IMAGE_MAX = 15 * 1024 * 1024;
// Big source files (view3d parts, the map loader) are cut, with a note, so one
// file cannot fill the context.
const TEXT_MAX = 400 * 1024;
const VIDEO_READY_TIMEOUT_MS = 5 * 60 * 1000;

let ai = null;
function client() {
  if (ai) return ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in the environment.');
  ai = new GoogleGenAI({ apiKey });
  return ai;
}

let modelChecked = null;
async function checkModel() {
  if (modelChecked) return modelChecked;
  modelChecked = (async () => {
    const pager = await client().models.list({ config: { pageSize: 200 } });
    for await (const m of pager) {
      if (m.name === `models/${MODEL}` || m.name === MODEL) return true;
    }
    throw new Error(`Model ${MODEL} is not in ai.models.list() for this API key.`);
  })();
  modelChecked.catch(() => { modelChecked = null; });
  return modelChecked;
}

function resolvePath(p) {
  return path.isAbsolute(p) ? p : path.resolve(REPO, p);
}

async function waitForActive(file) {
  const t0 = Date.now();
  let f = file;
  while (f.state === 'PROCESSING') {
    if (Date.now() - t0 > VIDEO_READY_TIMEOUT_MS) throw new Error(`${f.name} still processing after 5 min`);
    await new Promise((r) => setTimeout(r, 2000));
    f = await client().files.get({ name: f.name });
  }
  if (f.state === 'FAILED') throw new Error(`${f.name} failed processing on the server`);
  return f;
}

async function uploadFile(abs, mimeType) {
  const up = await client().files.upload({ file: abs, config: { mimeType, displayName: path.basename(abs) } });
  return waitForActive(up);
}

// Turns the file list into Gemini parts. Returns the parts, the text blocks
// for the prompt, notes for the caller, and the uploaded files to delete after.
async function collectFiles(filePaths) {
  const mediaParts = [];
  const textBlocks = [];
  const notes = [];
  const uploaded = [];
  for (const p of filePaths) {
    const abs = resolvePath(p);
    let st;
    try { st = await stat(abs); } catch { notes.push(`skipped (not found): ${p}`); continue; }
    if (!st.isFile()) { notes.push(`skipped (not a file): ${p}`); continue; }
    const ext = path.extname(abs).toLowerCase();
    const relRepo = path.relative(REPO, abs);
    const rel = !relRepo || relRepo.startsWith('..') ? abs : relRepo;

    if (IMAGE_MIME[ext]) {
      const mimeType = IMAGE_MIME[ext];
      if (st.size <= INLINE_IMAGE_MAX) {
        const data = (await readFile(abs)).toString('base64');
        mediaParts.push({ text: `Image: ${rel}` }, { inlineData: { mimeType, data } });
      } else {
        const f = await uploadFile(abs, mimeType);
        uploaded.push(f.name);
        mediaParts.push({ text: `Image: ${rel}` }, createPartFromUri(f.uri, f.mimeType));
      }
      notes.push(`image: ${rel}`);
    } else if (VIDEO_MIME[ext]) {
      const f = await uploadFile(abs, VIDEO_MIME[ext]);
      uploaded.push(f.name);
      mediaParts.push({ text: `Video: ${rel}` }, createPartFromUri(f.uri, f.mimeType));
      notes.push(`video (uploaded): ${rel}`);
    } else {
      const buf = await readFile(abs);
      if (buf.subarray(0, 8192).includes(0)) { notes.push(`skipped (binary): ${rel}`); continue; }
      let text = buf.toString('utf8');
      let cut = '';
      if (buf.length > TEXT_MAX) {
        text = buf.subarray(0, TEXT_MAX).toString('utf8');
        cut = `\n[... cut: ${buf.length} bytes, first ${TEXT_MAX} shown]`;
      }
      textBlocks.push(`### ${rel}\n\`\`\`\n${text}${cut}\n\`\`\``);
      notes.push(`text: ${rel}${cut ? ' (cut)' : ''}`);
    }
  }
  return { mediaParts, textBlocks, notes, uploaded };
}

async function askGemini({ prompt, filePaths = [] }) {
  await checkModel();
  const { mediaParts, textBlocks, notes, uploaded } = await collectFiles(filePaths);
  try {
    const fullPrompt = textBlocks.length ? `${prompt}\n\n## Files\n\n${textBlocks.join('\n\n')}` : prompt;
    const res = await client().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [...mediaParts, { text: fullPrompt }] }],
    });
    const answer = res.text ?? '(empty answer)';
    const head = notes.length ? `[${MODEL}; files: ${notes.join('; ')}]\n\n` : `[${MODEL}]\n\n`;
    return head + answer;
  } finally {
    for (const name of uploaded) {
      client().files.delete({ name }).catch((e) => log('could not delete', name, e.message));
    }
  }
}

const server = new McpServer({ name: 'gemini-reviewer', version: '1.0.0' });

server.registerTool(
  'ask_gemini',
  {
    title: 'Ask Gemini',
    description:
      `Ask Google Gemini (${MODEL}) for a second opinion. Attach files by path (relative to the repo root or absolute): ` +
      'images (.png .jpg .jpeg .webp) are sent inline, videos (.mp4 .webm .mov) are uploaded, ' +
      'other files are read as UTF-8 text and put in the prompt under their path.',
    inputSchema: {
      prompt: z.string().describe('The question or review request.'),
      filePaths: z.array(z.string()).optional().describe('Files to attach. Missing files are skipped and reported.'),
    },
  },
  async (args) => {
    try {
      return { content: [{ type: 'text', text: await askGemini(args) }] };
    } catch (e) {
      log(e);
      return { isError: true, content: [{ type: 'text', text: `ask_gemini failed: ${e.message}` }] };
    }
  },
);

await server.connect(new StdioServerTransport());
log(`ready (${MODEL})`);
