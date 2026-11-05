"""The zones off the coast (H1b R4, 04.11.2026; core/03e-rules.js ruSea, ruSeaRules, zoneLic; ui/phone/03-regler.js «Hvor du er» and
«Lær mer»; ui/phone/08-home-papers-merker.js papZlic; src/data/rules.json sea and shelf from tools/rules/regler.py seas()): the zone at a
point in each zone in the page, the answers in a few of them, a licence applied for with the button in Kvote → Papirer, the Regler app at
Svalbard, the rule layer far out, and the time the zones take. Screenshots of the licence card and the Regler app in both formats.
tests/unit/soner.test.mjs checks each border and every rule; this checks that the page has them. Prints OK or FEIL per check."""
from _env import GAME, OUT, boot
import os
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

Z = {'no': [70.5, 15], 'sv': [76, 20], 'svt': [78.2, 15.0], 'jm': [71, -5], 'smh': [73.9, 36.8], 'smt': [66.4, -3.3], 'ru': [70.5, 40], 'is': [67.2, -18],
     'gl': [70, -19], 'fo': [63, -6], 'gb': [59.5, -0.5], 'xx': [61.5, 19.5]}

JS = r"""(async () => { const out = {}, Z = __Z__, H = (Date.UTC(2027, 0, 15, 12) - EPOCH) / 36e5;
  out.n = RU.sea.length; out.zones = {}; for (const c in Z) out.zones[c] = ruSea(P(...Z[c]));
  const q = (c, o) => rulesAt({p:P(...Z[c]), H, len:o.len || 45, gear:o.gear || 'juksa', sp:o.sp || null, hav:o.hav || null});
  const ks = r => r.items.map(i => i.v + ':' + i.k);
  out.r = {svCod:ks(q('sv', {sp:'torsk'})), bj:ks(rulesAt({p:P(74.3, 18.6), H, len:12, gear:'juksa', sp:'torsk'})), jm:ks(q('jm', {sp:'torsk'})), ru:ks(q('ru', {sp:'torsk'})), is:ks(q('is', {sp:'torsk'}))};
  out.coast = PORTS.filter(q => !['', 'no', 'sv', 'svt'].includes(ruSea(q.p))).map(q => q.name);
  // the speed: 400 points spread over the wide frame, each in a new 10 km block, then 300 full answers in the Barents Sea
  let t0 = performance.now(); for (let i = 0; i < 400; i++) ruSea({x:-1000 + (i * 7919 % 3400), y:-1200 + (i * 104729 % 2800)}); out.tSea = Math.round(performance.now() - t0);
  t0 = performance.now(); for (let i = 0; i < 300; i++) rulesAt({p:{x:1300 + i * 0.05, y:-200}, len:40, sp:'torsk', gear:'line'}); out.tRules = Math.round(performance.now() - t0);
  // the rule layer far out: the Icelandic zone is red for every boat
  const pi = P(...Z.is), bx = Math.floor(pi.x / 10), by = Math.floor(pi.y / 10), A = ruLayerBlock(bx, by, {len:12, gear:'juksa', sp:null, hand:false});
  out.layerIs = A.reduce((a, x) => a + (x === 2 ? 1 : 0), 0);
  // the licence for the Russian zone from the button in Kvote → Papirer
  PHONE.show(true); PHONE.open('kvote'); PHONE.render(); (b => b && b.click())(document.querySelector('.ph-sub button[data-s="mine"]')); await new Promise(r => setTimeout(r, 150));
  const btn = document.querySelector('#phView button[data-pa="zlic"][data-k="ru"]'); out.btn = !!btn; out.before = zoneLic('ru');
  if (btn) btn.click(); await new Promise(r => setTimeout(r, 150)); PHONE.render(); await new Promise(r => setTimeout(r, 100));
  out.after = zoneLic('ru'); out.card = /Lisenser for andre lands soner/.test(document.getElementById('phView').innerText) && /Russlands økonomiske sone\s+Gitt/.test(document.getElementById('phView').innerText);
  out.ru2 = ks(q('ru', {sp:'torsk'}));
  return out; })()"""

HERE_JS = r"""(async () => { const b = S.boat; b.pos = P(76, 20); b.status = 'sailing'; b.port = null; RU_NOW = null;
  PHONE.show(true); PHONE.open('regler'); PHONE.render(); (b => b && b.click())(document.querySelector('.ph-sub button[data-s="her"]')); await new Promise(r => setTimeout(r, 200));
  const t = document.getElementById('phView').innerText; return {zone:/Fiskevernsonen ved Svalbard/.test(t), rule:/torsk og hyse på kvotene/.test(t)}; })()"""

SCROLL = "[...document.querySelectorAll('#phView .papc')].find(c => /Lisenser for andre lands/.test(c.textContent)).scrollIntoView({block:'center'})"
SCROLL2 = "(c => c && c.scrollIntoView())([...document.querySelectorAll('#phView .ph-card')].find(c => /Hvor du er/.test(c.textContent)))"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 800, 'height': 1280})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        r = await pg.evaluate(JS.replace('__Z__', json.dumps(Z)))
        print(json.dumps(r, ensure_ascii=False)[:900])
        print(ok(r['n'] >= 15 and all(r['zones'][c] == c for c in Z)), 'the page knows the zones off the coast, a point in each', r['zones'])
        print(ok(not r['coast']), 'every harbour is under the coast\'s rules (or at Svalbard)', r['coast'])
        rr = r['r']
        print(ok('ok:sv1' in rr['svCod'] and 'no:sv58' in rr['bj'] and 'no:jm0' in rr['jm'] and 'no:ru0' in rr['ru'] and 'no:is0' in rr['is']),
              'Svalbard: cod on the quota, Bjørnøya closed (§ 58); Jan Mayen: no cod; the Russian zone needs a licence; Iceland closed', rr)
        print(ok(r['layerIs'] > 1500), 'the rule layer is red in the Icelandic zone', r['layerIs'])
        print(ok(r['tSea'] < 3000 and r['tRules'] < 400), 'speed: 400 points in new 10 km blocks over the wide frame, 300 full answers in the Barents Sea (ms)', r['tSea'], r['tRules'])
        print(ok(r['btn'] and not r['before'] and r['after'] and r['card'] and 'warn:ru1' in r['ru2']), 'the licence for the Russian zone from the button in Kvote → Papirer opens the zone for cod on the quota', r['ru2'])
        await pg.evaluate(SCROLL); await pg.wait_for_timeout(150); await pg.screenshot(path=os.path.join(OUT, 'sone-lisens-staaende.png'))
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.evaluate("PHONE.render()"); await pg.wait_for_timeout(200); await pg.evaluate(SCROLL); await pg.wait_for_timeout(150)
        await pg.screenshot(path=os.path.join(OUT, 'sone-lisens-liggende.png'))
        h = await pg.evaluate(HERE_JS)
        print(ok(h['zone'] and h['rule']), 'the Regler app at Svalbard names the zone and what holds there', h)
        await pg.evaluate(SCROLL2); await pg.wait_for_timeout(150); await pg.screenshot(path=os.path.join(OUT, 'sone-regler-liggende.png'))
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.evaluate("PHONE.render()"); await pg.wait_for_timeout(200); await pg.evaluate(SCROLL2); await pg.wait_for_timeout(150)
        await pg.screenshot(path=os.path.join(OUT, 'sone-regler-staaende.png'))
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
