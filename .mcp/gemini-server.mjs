#!/usr/bin/env node
// gemini-reviewer: a local MCP server (stdio) with two tools. ask_gemini lets a
// Claude Code session ask Gemini for a second opinion: visual checks of
// screenshots and clips (UI, UX, GUI and the game's graphics), and
// architecture/performance/aliasing reviews of shaders and water physics.
// generate_game_asset asks Google's image model for a raster image (an
// illustration, a background, a texture, a sketch for an icon) and writes it
// to a file in the repo. Development tooling only; nothing in the game uses it. Registered in .mcp.json; needs GEMINI_API_KEY (runs npm ci itself
// when node_modules/ is missing).
//
// A session where the MCP tool is not loaded can ask from the shell instead:
//   node .mcp/gemini-server.mjs --ask "<question>" [--fps 15] <file> [<file> ...]
//   node .mcp/gemini-server.mjs --image "<description>" --out <path> [--aspect 16:9] [--size 2K] [<reference image> ...]
//
// stdout is the MCP channel (or the answer with --ask): log only to stderr.

import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The only model this server talks to. Checked against ai.models.list() on
// first use (listed as models/gemini-4-hydrogen on 13.11.2026).
const MODEL = 'gemini-4-hydrogen';

// The only image model generate_game_asset talks to (listed as
// models/gemini-3-pro-image, «Nano Banana Pro», on 13.11.2026). Image models
// answer through generateContent with an image part; ai.models.generateImages
// (Imagen) is deprecated in the SDK and refused by this API. They have no free
// quota: the key's project must have billing on.
const IMAGE_MODEL = 'gemini-3-pro-image';
const ASPECTS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
const SIZES = ['1K', '2K'];
// Appended to every image prompt. Text in the game is drawn by the UI in two
// languages, and no real company or organisation name may appear in the game.
const IMAGE_RULES = 'No text, letters, numbers, logos, brand names, flags of organisations, signatures or watermarks anywhere in the image.';
// The game's own fictional brands, which may stand as a word mark on the thing they are (Jonas 14.11.2026: «Du har lov med logo og skrift
// … Skippertak er et fiktivt merke kun i dette spillet»). Only these words, only when the call names the brand; everything else keeps
// IMAGE_RULES. A real company's name never goes here (CLAUDE.md: no real names without a written agreement).
const GAME_BRANDS = ['SKIPPERTAK'];
const brandRules = (brand) => `The only text allowed in the image is the word mark of ${brand}, a fictional brand invented for this game, plus the short variant words named in the prompt, spelled exactly as given. No other text, letters or numbers; no real brand names, real logos or anything resembling a real brand; no flags of organisations, signatures or watermarks.`;
// Where a generated image may never be written: the game data is made by the
// scripts in tools/ (never by hand), and the rest is not ours to fill.
const NO_WRITE = ['src/data', 'src/legal', '.git', '.claude', '.mcp', 'node_modules', 'dist', 'supabase'];
const EXT_OF_MIME = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

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
// Gemini samples a video at 1 frame a second unless videoMetadata.fps says
// otherwise (valid range (0, 24]), and at 1 fps it cannot see stutter, ripples
// or the beat of the swell. 10 is the default here (Jonas 13.11.2026); each
// sampled frame costs tokens, so a long clip is trimmed before it is sent
// rather than sampled faster.
const VIDEO_FPS_DEFAULT = 10;
const VIDEO_FPS_MAX = 24;

let ai = null;
function client() {
  if (ai) return ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in the environment.');
  ai = new GoogleGenAI({ apiKey });
  return ai;
}

let modelNames = null;
async function checkModel(model = MODEL) {
  if (!modelNames) {
    modelNames = (async () => {
      const names = new Set();
      const pager = await client().models.list({ config: { pageSize: 200 } });
      for await (const m of pager) names.add(String(m.name).replace(/^models\//, ''));
      return names;
    })();
    modelNames.catch(() => { modelNames = null; });
  }
  if (!(await modelNames).has(model)) throw new Error(`Model ${model} is not in ai.models.list() for this API key.`);
  return true;
}

// A 429 is one of three things. A limit of 0 (the image models on a free key)
// is not a rate limit and goes straight back. A per-minute limit is waited out
// once, for as long as the API asks, and tried again. A daily limit (the free
// tier gave gemini-4-hydrogen 20 requests a day on 13.11.2026, shared by every
// session on the key) is said plainly, with when it opens again.
async function withRateRetry(model, call) {
  try {
    return await call();
  } catch (e) {
    const m = String(e?.message ?? e);
    if (!/429|RESOURCE_EXHAUSTED/.test(m) || /limit: 0/.test(m)) throw e;
    const d = m.match(/retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/);
    const secs = d ? Math.ceil(Number(d[1])) : 30;
    if (secs > 65) {
      const lim = m.match(/limit: (\d+)[^*"]*?requests per day/i);
      const h = Math.floor(secs / 3600);
      const min = Math.round((secs % 3600) / 60);
      throw new Error(`${model}: the quota on this API key is used up` + (lim ? ` (${lim[1]} requests a day, shared by every session)` : '') +
        `. It opens again in ${h} h ${min} min. Say so in the message to Jonas and carry on without Gemini; do not wait for it.`);
    }
    log(`rate limited (429), waiting ${secs + 1} s and trying once more`);
    await new Promise((r) => setTimeout(r, (secs + 1) * 1000));
    return call();
  }
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
function videoFpsOf(v) {
  if (v === undefined || v === null) return VIDEO_FPS_DEFAULT;
  const n = Number(v);
  if (!(n > 0) || n > VIDEO_FPS_MAX) throw new Error(`videoFps must be above 0 and at most ${VIDEO_FPS_MAX} (got ${v}).`);
  return n;
}

async function collectFiles(filePaths, fps) {
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
    // A file outside the repo goes by its name only: the folders above it are nobody else's business.
    const rel = !relRepo || relRepo.startsWith('..') ? path.basename(abs) : relRepo;

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
      mediaParts.push({ text: `Video: ${rel}` }, { ...createPartFromUri(f.uri, f.mimeType), videoMetadata: { fps } });
      notes.push(`video (uploaded, sampled at ${fps} fps): ${rel}`);
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

async function askGemini({ prompt, filePaths = [], videoFps }) {
  const fps = videoFpsOf(videoFps);
  await checkModel();
  const { mediaParts, textBlocks, notes, uploaded } = await collectFiles(filePaths, fps);
  try {
    const fullPrompt = textBlocks.length ? `${prompt}\n\n## Files\n\n${textBlocks.join('\n\n')}` : prompt;
    const res = await withRateRetry(MODEL, () => client().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [...mediaParts, { text: fullPrompt }] }],
    }));
    const answer = res.text ?? '(empty answer)';
    const tok = res.usageMetadata?.promptTokenCount;
    const cost = tok ? `; ${tok} prompt tokens` : '';
    const head = notes.length ? `[${MODEL}; files: ${notes.join('; ')}${cost}]\n\n` : `[${MODEL}${cost}]\n\n`;
    return head + answer;
  } finally {
    await Promise.all(uploaded.map((name) =>
      client().files.delete({ name }).catch((e) => log('could not delete', name, e.message))));
  }
}

// Where a generated image is allowed to land: inside the repo, outside the
// folders in NO_WRITE, with an image extension, and never on top of a file
// that is already there unless the caller says so.
function outputTarget(outputPath, overwrite) {
  if (!outputPath) throw new Error('outputPath is required.');
  const abs = path.resolve(REPO, outputPath);
  const rel = path.relative(REPO, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`outputPath must be inside the repo (got ${outputPath}).`);
  const relPosix = rel.split(path.sep).join('/');
  const bad = NO_WRITE.find((d) => relPosix === d || relPosix.startsWith(d + '/'));
  if (bad) throw new Error(`outputPath may not be under ${bad}/ (got ${relPosix}). Write to tools/ui/out/ and let a script in tools/ build the game data.`);
  if (path.basename(abs).startsWith('.env')) throw new Error('outputPath may not be an .env file.');
  if (!IMAGE_MIME[path.extname(abs).toLowerCase()]) throw new Error(`outputPath must end in .png, .jpg, .jpeg or .webp (got ${relPosix}).`);
  if (!overwrite && existsSync(abs)) throw new Error(`${relPosix} exists already. Pick another name, or pass overwrite to replace it.`);
  return abs;
}

// Free-tier keys have a limit of 0 on the image models, and the API says so in
// a long 429. Say what it means instead.
function imageError(e) {
  const m = String(e?.message ?? e);
  if (/429|RESOURCE_EXHAUSTED/.test(m) && /free_tier/.test(m) && /limit: 0/.test(m)) {
    return new Error(`${IMAGE_MODEL} has no free quota on this API key (free tier, limit 0). ` +
      'Image generation works once billing is on for the key\'s Google AI project; that is Jonas\' call (real money). Nothing was generated.');
  }
  return e instanceof Error ? e : new Error(m);
}

async function generateGameAsset({ prompt, outputPath, aspectRatio = '1:1', imageSize = '1K', referencePaths = [], overwrite = false, brand = null }) {
  if (brand && !GAME_BRANDS.includes(String(brand).toUpperCase())) throw new Error(`brand must be one of the game's own brands: ${GAME_BRANDS.join(', ')} (got ${brand}).`);
  if (!prompt || !prompt.trim()) throw new Error('prompt is required.');
  if (!ASPECTS.includes(aspectRatio)) throw new Error(`aspectRatio must be one of ${ASPECTS.join(', ')} (got ${aspectRatio}).`);
  if (!SIZES.includes(imageSize)) throw new Error(`imageSize must be one of ${SIZES.join(', ')} (got ${imageSize}).`);
  const abs = outputTarget(outputPath, overwrite);
  // Reference images (a screenshot of the UI as it is, an earlier asset) carry the style better than adjectives do.
  const refs = [];
  const notes = [];
  for (const p of referencePaths) {
    const rabs = resolvePath(p);
    const mimeType = IMAGE_MIME[path.extname(rabs).toLowerCase()];
    if (!mimeType) throw new Error(`reference must be an image (.png .jpg .jpeg .webp): ${p}`);
    let buf;
    try { buf = await readFile(rabs); } catch { throw new Error(`reference not found: ${p}`); }
    if (buf.length > INLINE_IMAGE_MAX) throw new Error(`reference over 15 MB: ${p}`);
    refs.push({ inlineData: { mimeType, data: buf.toString('base64') } });
    notes.push(path.basename(rabs));
  }
  await checkModel(IMAGE_MODEL);
  let res;
  try {
    res = await withRateRetry(IMAGE_MODEL, () => client().models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: 'user', parts: [...refs, { text: `${prompt.trim()}\n\n${brand ? brandRules(String(brand).toUpperCase()) : IMAGE_RULES}` }] }],
      config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio, imageSize } },
    }));
  } catch (e) { throw imageError(e); }
  const cand = res.candidates?.[0];
  const img = (cand?.content?.parts ?? []).find((p) => p.inlineData?.data);
  if (!img) {
    const why = cand?.finishReason || res.promptFeedback?.blockReason || 'no image part in the answer';
    throw new Error(`${IMAGE_MODEL} returned no image (${why}). ${res.text ? 'It said: ' + res.text.slice(0, 300) : ''}`.trim());
  }
  // The model decides the format; the file gets the extension of what it actually is.
  const ext = EXT_OF_MIME[img.inlineData.mimeType];
  let target = abs;
  if (ext && IMAGE_MIME[path.extname(abs).toLowerCase()] !== img.inlineData.mimeType) {
    target = abs.slice(0, -path.extname(abs).length) + ext;
    if (!overwrite && existsSync(target)) throw new Error(`${path.relative(REPO, target)} exists already (the model answered with ${img.inlineData.mimeType}).`);
  }
  const buf = Buffer.from(img.inlineData.data, 'base64');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buf);
  const rel = path.relative(REPO, target).split(path.sep).join('/');
  const ref = notes.length ? `; references: ${notes.join(', ')}` : '';
  return `[${IMAGE_MODEL}; ${aspectRatio}, ${imageSize}${ref}]\n\nSaved ${rel} (${img.inlineData.mimeType}, ${Math.round(buf.length / 1024)} KB). ` +
    'Look at it before it is used (Read the file), and show it to Jonas before it goes into the game.';
}

// --image: one image from the shell, no MCP.
const im0 = process.argv.indexOf('--image');
if (im0 > 0) {
  const rest = process.argv.slice(im0 + 1);
  const prompt = rest.shift();
  const opt = (flag) => { const i = rest.indexOf(flag); return i >= 0 ? rest.splice(i, 2)[1] : undefined; };
  const outputPath = opt('--out');
  const aspectRatio = opt('--aspect');
  const imageSize = opt('--size');
  const brand = opt('--brand');
  const oi = rest.indexOf('--overwrite');
  const overwrite = oi >= 0 ? (rest.splice(oi, 1), true) : false;
  try {
    console.log(await generateGameAsset({ prompt, outputPath, aspectRatio, imageSize, referencePaths: rest, overwrite, brand }));
    process.exit(0);
  } catch (e) {
    log(e.message);
    process.exit(1);
  }
}

// --ask: one question from the shell, the answer on stdout, no MCP.
const ai0 = process.argv.indexOf('--ask');
if (ai0 > 0) {
  const rest = process.argv.slice(ai0 + 1);
  const prompt = rest.shift();
  let videoFps;
  const fi = rest.indexOf('--fps');
  if (fi >= 0) videoFps = rest.splice(fi, 2)[1];
  if (!prompt) { log('usage: --ask "<question>" [--fps N] <file> ...'); process.exit(2); }
  try {
    console.log(await askGemini({ prompt, filePaths: rest, videoFps }));
    process.exit(0);
  } catch (e) {
    log(e);
    process.exit(1);
  }
}

const server = new McpServer({ name: 'gemini-reviewer', version: '1.0.0' });

server.registerTool(
  'ask_gemini',
  {
    title: 'Ask Gemini',
    description:
      `Ask Google Gemini (${MODEL}) for a second opinion. Attach files by path (relative to the repo root or absolute): ` +
      'images (.png .jpg .jpeg .webp) are sent inline, videos (.mp4 .webm .mov) are uploaded and sampled at ' +
      `videoFps frames a second (default ${VIDEO_FPS_DEFAULT}; without it Gemini sees 1 frame a second and misses motion), ` +
      'other files are read as UTF-8 text and put in the prompt under their path.',
    inputSchema: {
      prompt: z.string().describe('The question or review request.'),
      filePaths: z.array(z.string()).optional().describe('Files to attach. Missing files are skipped and reported.'),
      videoFps: z.number().gt(0).max(VIDEO_FPS_MAX).optional().describe(
        `Frames a second Gemini samples from attached videos, above 0 and at most ${VIDEO_FPS_MAX} (default ${VIDEO_FPS_DEFAULT}). ` +
        'Raise it towards 15-24 for fast motion (ripples, stutter, frame pacing); every frame costs tokens, so trim long clips first.'),
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

server.registerTool(
  'generate_game_asset',
  {
    title: 'Generate game asset',
    description:
      `Generate one raster image with Google's image model (${IMAGE_MODEL}) and save it in the repo: an illustration, a background, ` +
      'a panel or paper texture, or a sketch for an icon that is then drawn as SVG. Not for icons, buttons and HUD parts themselves: ' +
      'those are CSS and SVG in this game. Every prompt gets "no text, no logos" added. The file is a draft until Jonas has seen it; ' +
      'write it under tools/ui/out/ (not in git), never under src/data/. Needs billing on the API key (the image models have no free quota).',
    inputSchema: {
      prompt: z.string().describe('Exact visual description: the motif, the framing, the light, the palette (the game\'s own colours), the background.'),
      outputPath: z.string().describe('Where to save it, relative to the repo root, e.g. tools/ui/out/ekkolodd-skisse.png. Folders are created.'),
      aspectRatio: z.enum(ASPECTS).default('1:1').describe('Aspect ratio.'),
      imageSize: z.enum(SIZES).default('1K').describe('1K (default) or 2K on the long side.'),
      referencePaths: z.array(z.string()).optional().describe(
        'Images that show the style to match: a screenshot of the game\'s UI as it is, or an earlier asset. Prefer this over style adjectives.'),
      overwrite: z.boolean().default(false).describe('Replace the file when it exists already.'),
      brand: z.enum(GAME_BRANDS).optional().describe('Only for a fictional brand of the game itself (GAME_BRANDS): its word mark may then stand on the product; all other text stays forbidden.'),
    },
  },
  async (args) => {
    try {
      return { content: [{ type: 'text', text: await generateGameAsset(args) }] };
    } catch (e) {
      log(e);
      return { isError: true, content: [{ type: 'text', text: `generate_game_asset failed: ${e.message}` }] };
    }
  },
);

await server.connect(new StdioServerTransport());
log(`ready (${MODEL})`);
