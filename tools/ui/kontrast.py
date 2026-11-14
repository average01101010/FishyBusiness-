"""Measures the contrast of every text in the drawer and the phone's apps (designombyggingen D1, 13.11.2026): each drawer page and each
app, with its tabs, and (D6) the dialogs, the tip and the toast of tools/ui/scener.py (`kontrast.py dialoger` for those only), and for every visible text its colour against the background it really stands on (the fills under it laid over each
other, the opacity of what it is in). Prints each kind of text under 4.5:1 (3:1 from 24 px, or 18.66 px bold) once, with the page it was
first seen on, and the count. `FEIL` lines are the ones to fix; the last line is the sum.

    node build.mjs && KYST_LITE=1 python3 tools/ui/kontrast.py [staaende] [side ...]      (e.g. `kontrast.py bank kvote` for those two only;
                                                                                `staaende` measures in 800 x 1280, without it 1280 x 800)
"""
import os, sys, asyncio, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'tests'))
from _env import boot
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scener import SCENES, SLOW
from playwright.async_api import async_playwright

DRAWER = [('fiske', 'finnsnes'), ('utstyrb', 'finnsnes'), ('service', 'finnsnes'), ('lever', 'botnhamn'), ('is', 'botnhamn'), ('agn', 'botnhamn'), ('oppdrag', 'botnhamn'),
          ('fartoy', 'finnsnes'), ('utstyr', 'finnsnes'), ('maler', 'finnsnes'), ('verksted', 'finnsnes'), ('mannskap', 'finnsnes'), ('bors', 'finnsnes'), ('bank', 'finnsnes'),
          ('havn', 'finnsnes'), ('redskap', 'finnsnes'), ('rigg', 'finnsnes'), ('last', 'finnsnes'), ('beholdning', 'finnsnes'), ('drift', 'finnsnes')]
APPS = ['vaer', 'post', 'naustp', 'meld', 'rederi', 'salg', 'kvote', 'regler', 'ordl', 'nett', 'kaiboden', 'haill', 'sesong', 'guide', 'folk', 'merker', 'redning', 'trim', 'handbok', 'patch', 'tilbake', 'innst']
MEASURE = """(root) => {
  const R = document.querySelector(root); if (!R) return [];
  const P = s => { const m = /rgba?\\(([^)]+)\\)/.exec(s); if (!m) return null; const v = m[1].split(/[ ,\\/]+/).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
  const over = (f, b) => { const a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const out = [], seen = new Set(), W = document.createTreeWalker(R, NodeFilter.SHOW_TEXT);
  for (let n; (n = W.nextNode()); ){
    { const t = n.textContent.trim(), press = n.parentElement && n.parentElement.closest('button,summary,a'); if (!t || (!press && (t.length < 2 || !/[\\p{L}\\p{N}]/u.test(t)))) continue; }   // (stars, dots and arrows alone are ornaments, not text, except on something to press: the «⋯» of a menu)
 const e = n.parentElement; if (!e || seen.has(e) || !e.getClientRects().length) continue; seen.add(e);
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    // the fills under the text, from the element outwards, until one is opaque; a picture or a gradient under it: not measured
    const stack = []; let op = 1, skip = false, base = [11, 23, 32, 1];
    for (let a = e; a; a = a.parentElement){ const s = getComputedStyle(a); op *= +s.opacity;
      if (s.backgroundImage && s.backgroundImage !== 'none'){ skip = true; break; }
      const b = P(s.backgroundColor); if (b && b[3] > 0){ stack.push(b); if (b[3] >= 1) break; } if (a === R) break; }
    if (skip) continue;
    let bg = base; for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg);
    const f0 = P(cs.color); if (!f0) continue; const fg = over([f0[0], f0[1], f0[2], f0[3] * op], bg);
    const L1 = lum(fg), L2 = lum(bg), k = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), big = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), need = big ? 3 : 4.5;
    const dis = e.closest('button:disabled,[aria-disabled=true]');
    if (k < need && !dis){ const nm = x => x ? x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\\s+/).join('.') : '') : '';
      out.push({sel:nm(e.parentElement && e.parentElement.parentElement) + ' > ' + nm(e.parentElement) + ' > ' + nm(e), fg:hex(fg), bg:hex(bg), k:Math.round(k * 10) / 10, px, t:n.textContent.trim().slice(0, 28), inl:e.getAttribute('style') || ''}); }
  }
  return out; }"""
TABS = "[...document.querySelectorAll('%s .ph-sub button')].filter(e => e.offsetParent)"


async def main():
    # (`staaende`, D5: the same in 800 x 1280; the big phone and the drawer's sheet have other columns and widths standing)
    tall = 'staaende' in sys.argv; only = [a for a in sys.argv[1:] if not a.startswith('-') and a != 'staaende']; found = {}; errs = []; shut = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 1280} if tall else {'width': 1280, 'height': 800}); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # (FN1: a yard job running, so «Arbeid på båten» and «Ferdig nå» are measured on the pages that make jobs and in Om bord)
        await pg.evaluate("S.cash = 500000; S.boat.status = 'port'; S.crew = S.crew || []; S.jobs = []; queueJob({kind:'hull', h:6, no:'Skrogrens på slipp', en:'Hull cleaning on the slip'}); renderActs()"); await pg.wait_for_timeout(400)
        # with something aboard (the independent check 13.11.2026: the first run measured an empty boat): a tired hand, a licence
        try: await pg.evaluate("S.crew = [genCrew()].map(c => Object.assign(c, {bi:false, off:false, fatigue:78})); S.lic = S.lic || {id:'u7', since:2026}; renderActs()")
        except Exception as e: print('tilstand:', str(e)[:100])

        async def measure(root, where):
            for x in await pg.evaluate(MEASURE, root):
                key = (x['sel'], x['fg'], x['bg'])
                if key in found: found[key]['n'] += 1
                else: x['n'] = 1; x['where'] = where; found[key] = x

        async def page(root, where):
            await measure(root, where)
            try: k = await pg.evaluate("(" + TABS % root + ").length")
            except Exception: k = 0
            for i in range(1, min(k, 8)):
                try: await pg.evaluate("(() => { const t = " + TABS % root + "; if (t[%d]) t[%d].click(); })()" % (i, i)); await pg.wait_for_timeout(250); await measure(root, where + ' fane ' + str(i + 1))
                except Exception: pass
        for name, port in DRAWER:
            if only and name not in only: continue
            try: await pg.evaluate("(() => { const b = S.boat, q = portById('%s'); if (b.port !== q.id){ b.port = q.id; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; } DOCK.open('%s'); })()" % (port, name)); await pg.wait_for_timeout(300)
            except Exception as e: print('kunne ikke åpne', name, str(e)[:80]); continue
            await page('#drawer', 'skuff ' + name)
        if not only or 'arbeid' in only:
            # the menus that open on a press: the «⋯» on a hand's card, and the choices of the operations plan's wizard
            try:
                await pg.evaluate("DOCK.open('arbeid')"); await pg.wait_for_timeout(300); await page('#drawer', 'skuff arbeid')
                await pg.evaluate("DOCK.open('arbeid')"); await pg.wait_for_timeout(300); await pg.evaluate("(() => { const m = document.querySelector('#drawer .wk-more'); if (m) m.click(); })()"); await pg.wait_for_timeout(200); await measure('#drawer', 'skuff arbeid, ⋯ åpen')
                await pg.evaluate("DOCK.open('drift'); (() => { const b = [...document.querySelectorAll('#drawer .ph-btn.p')][0]; if (b) b.click(); })()"); await pg.wait_for_timeout(400); await measure('#drawer', 'skuff drift, veiviseren')
                for i in range(3):
                    await pg.evaluate("(() => { const r = document.querySelectorAll('#drawer .dr-row, #drawer .dr-big')[%d]; if (r) r.click(); })()" % i); await pg.wait_for_timeout(250); await measure('#drawer', 'skuff drift, veiviseren %d' % (i + 1))
            except Exception as e: print('arbeid/drift:', str(e)[:100])
        await pg.evaluate("DOCK.close()")
        for a in APPS:
            if only and a not in only: continue
            try: await pg.evaluate("PHONE.show(true); PHONE.open('%s')" % a); await pg.wait_for_timeout(300)
            except Exception as e: print('kunne ikke åpne', a, str(e)[:80]); continue
            await page('#phView', 'app ' + a)
            if a == 'naustp':   # (the naust's list as it is at Father's naust, with the steps and the trophy wall)
                try: await pg.evaluate("(() => { const b = S.boat; S._kb = [b.port, b.berth]; b.port = S.home || b.port; b.berth = 'naust'; PHONE.open('naustp'); })()"); await pg.wait_for_timeout(300); await measure('#phView', 'app naustp, ved naustet')
                except Exception as e: print('naustp:', str(e)[:100])
                await pg.evaluate("(() => { if (S._kb){ S.boat.port = S._kb[0]; S.boat.berth = S._kb[1]; delete S._kb; } })()")
            if a == 'rederi':
                await pg.evaluate("(() => { const d = document.querySelector('#phView details.fl-more'); if (d) d.open = true; })()"); await pg.wait_for_timeout(150); await measure('#phView', 'app rederi, ⋯ åpen')
            if a == 'nett':
                await pg.evaluate("(() => { const b = document.querySelector('#phone [data-pa=sub][data-s=megler]'); if (b) b.click(); })()"); await pg.wait_for_timeout(300); await page('#phView', 'app nett, megleren')
        # D6: the dialogs, the tip and the toast (tools/ui/scener.py), each opened, measured and closed
        await pg.evaluate("PHONE.show(false)")
        for name, op, root, cl in SCENES:
            if only and name not in only and 'dialoger' not in only: continue
            try:
                await pg.evaluate(op); await pg.wait_for_timeout(SLOW.get(name, 350))
                if not await pg.evaluate("(r) => { const e = document.querySelector(r); return !!e && e.getClientRects().length > 0; }", root): print('FEIL åpnet ikke', name); shut.append(name)
                else: await measure(root, name)
            except Exception as e: print('FEIL kunne ikke åpne', name, str(e)[:100]); shut.append(name)
            try: await pg.evaluate(cl)
            except Exception: pass
        await b.close()
    rows = sorted(found.values(), key=lambda x: (x['where'], x['k']))
    for x in rows: print('FEIL %-22s %4.1f  %s på %s  %2d px  ×%-3d %s  «%s»%s' % (x['where'], x['k'], x['fg'], x['bg'], x['px'], x['n'], x['sel'], x['t'], '  [style: ' + x['inl'][:60] + ']' if x['inl'] else ''))
    print('sidefeil', errs[:5]); print(('OK  ' if not rows and not shut else 'FEIL') + ' %d slags tekst under kravet' % len(rows) + (', %d scener åpnet ikke (%s)' % (len(shut), ', '.join(shut)) if shut else ''))   # (a scene that did not open is not measured, so it is not a pass)

asyncio.run(main())
