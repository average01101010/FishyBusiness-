// The app's icons, the favicon and the sharing picture from the logo (src/brand/logo.svg, the user's anchor of 03.11.2026: «Bruk logoen
// slik den er nå, så kan vi eventuelt endre den senere»). The logo was traced from the user's picture with potrace (one path, filled with
// currentColor); to change it, replace src/brand/logo.svg and run this again. It replaces the Blender sjark of tools/brand/logo.py as
// the icon (the user's choice 03.11.2026); the sjark lives on as the photo half of the sharing picture (tools/brand/og-photo.jpg, cut
// from the old og-image.jpg) and behind the loading screen.
//
//   node tools/brand/logo-assets.mjs   -> src/pwa/icon-192.png, icon-512.png, icon-maskable-512.png, favicon.svg, og-image.jpg
//
// Uses the Playwright and Chromium that are already there (the tests' own); the type on the sharing picture is the game's Archivo.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..', '..'), PWA = join(ROOT, 'src', 'pwa');
const NAVY = '#16314c', WHITE = '#f5f8fc';   // the logo's own navy (from the user's picture) and the loading screen's white
const svg = readFileSync(join(ROOT, 'src', 'brand', 'logo.svg'), 'utf8').trim();
const [, vw, vh] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg).map(Number);
const pathD = /\sd="([^"]+)"/.exec(svg)[1];

// the favicon: the white anchor on a rounded navy square, as an SVG of its own (the logo's path scaled into a 64 x 64 box)
{ const S = 64, h = S * 0.84, k = h / vh, w = vw * k, x = (S - w) / 2, y = (S - h) / 2;
  writeFileSync(join(PWA, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" rx="12" fill="${NAVY}"/>` +
    `<path fill="${WHITE}" fill-rule="evenodd" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(5)})" d="${pathD}"/></svg>\n`); }

const font = readFileSync(join(ROOT, 'src', 'data', 'font-archivo.b64'), 'utf8').trim();
const photo = readFileSync(join(HERE, 'og-photo.jpg')).toString('base64');
const logo = color => svg.replace('<svg ', `<svg style="color:${color};height:100%;width:auto;display:block" `);
const browser = await chromium.launch();
async function shot(w, h, body, file, type = 'png'){
  const p = await browser.newPage({viewport:{width:w, height:h}, deviceScaleFactor:1});
  await p.setContent(`<!doctype html><html><head><style>@font-face{font-family:Archivo;font-weight:400 700;font-stretch:75% 125%;src:url(data:font/woff2;base64,${font})}
    html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}</style></head><body>${body}</body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({path:join(PWA, file), type, ...(type === 'jpeg' ? {quality:88} : {})});
  await p.close(); console.log('src/pwa/' + file);
}
// the icons: the white anchor on navy, full bleed (the launcher rounds the corners); the maskable one with the anchor inside the safe
// circle (80 % of the side), so a round or squircle mask never cuts the flukes
const icon = (s, frac) => `<div style="width:${s}px;height:${s}px;background:${NAVY};display:flex;align-items:center;justify-content:center">` +
  `<div style="height:${Math.round(s * frac)}px">${logo(WHITE)}</div></div>`;
await shot(192, 192, icon(192, 0.8), 'icon-192.png');
await shot(512, 512, icon(512, 0.8), 'icon-512.png');
await shot(512, 512, icon(512, 0.62), 'icon-maskable-512.png');
// the sharing picture (1200 x 630): the anchor and the line on navy to the left, the sjark at the blue hour to the right, blended
await shot(1200, 630, `<div style="position:relative;width:1200px;height:630px;background:${NAVY};font-family:Archivo,sans-serif">
  <div style="position:absolute;right:0;top:0;width:610px;height:630px;background:url(data:image/jpeg;base64,${photo}) center/cover"></div>
  <div style="position:absolute;left:589px;top:0;width:230px;height:630px;background:linear-gradient(90deg,${NAVY},rgba(22,49,76,.75) 30%,rgba(22,49,76,0))"></div>
  <div style="position:absolute;left:0;top:0;width:640px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px">
    <div style="height:440px">${logo(WHITE)}</div>
    <div style="color:rgba(238,244,251,.88);font:600 19px/1 Archivo;letter-spacing:.3em;text-transform:uppercase">Kystfiske langs norskekysten</div>
  </div></div>`, 'og-image.jpg', 'jpeg');
await browser.close();
