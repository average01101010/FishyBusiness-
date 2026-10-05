"""The interface on every screen (Jonas 05.10.2026: «vi må uansett optimalisere hele spillets UI for både mobil, nettbrett og pc»).
The main views (in harbour, at sea, the chart plotter, a route, the phone, the deck log, the menu in harbour) in five sizes: a phone
upright and on its side, a tablet upright and on its side, and a PC. For each it takes a picture (tests/out/ui_<view>_<size>.png) and
looks for itself for text that is cut off, controls outside the screen, the big blocks of the interface on top of each other, and
buttons too small for a finger on the touch screens. Prints OK or FEIL per view and size, with what it found."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

SIZES = [('tlf', 390, 844, True), ('tlf-ligg', 844, 390, True), ('brett', 800, 1280, True), ('brett-ligg', 1280, 800, True), ('pc', 1440, 900, False)]
# the blocks that must not lie on each other (each a selector; the first visible match counts)
BLOCKS = ['#ecdisTop', '#plotTop', '#hud', '.zoom', '#instr', '#dock', '#dockInfo', '#dockFan', '#miniPlot', '#compass3d', '#gps3d', '#logbook',
          '#phoneFab', '#camBtn', '#kinoBtn', '#aisCard', '#legend', '#setBar', '.ov.fab', '#showChip', '#rPlay', '#rAuto', '.topbar', 'header']
FIND = """([blocks, touch]) => {
  const vis = e => { if (!e || !e.getClientRects().length) return false; const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const W = innerWidth, H = innerHeight, name = e => e.id ? '#' + e.id : (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : e.tagName.toLowerCase());
  const inModal = !document.getElementById('modal').hidden || !document.getElementById('phone').hidden || !document.getElementById('book').hidden;
  const out = {cut:[], off:[], over:[], small:[]};
  // text cut off: a box narrower than its own text, where the text does not wrap
  for (const e of document.querySelectorAll('#app *')){
    if (!vis(e) || !e.childNodes.length) continue;
    const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) continue;
    const s = getComputedStyle(e); if (s.overflowX === 'visible' && s.textOverflow !== 'ellipsis' && s.whiteSpace !== 'nowrap') continue;
    if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0) out.cut.push(name(e) + ' «' + e.textContent.trim().slice(0, 24) + '» ' + e.clientWidth + '/' + e.scrollWidth);
  }
  // controls outside the screen
  for (const e of document.querySelectorAll('#app button, #app input, #app select, #app a, #phone button, #book button')){
    if (!vis(e)) continue; const r = e.getBoundingClientRect();
    // (the deck log's tab peeks in from the edge on purpose, and what lies in a box that scrolls is reached by scrolling)
    const scrolls = (() => { for (let a = e.parentElement; a; a = a.parentElement){ const s = getComputedStyle(a); if (/(auto|scroll)/.test(s.overflowY + s.overflowX) && (a.scrollHeight > a.clientHeight + 1 || a.scrollWidth > a.clientWidth + 1)) return true; } return false; })();
    if ((r.left < -2 || r.top < -2 || r.right > W + 2 || r.bottom > H + 2) && e.id !== 'logbook' && !scrolls) out.off.push(name(e) + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(','));
    if (touch && (r.width < 32 || r.height < 30) && (e.textContent.trim() || e.querySelector('svg'))) out.small.push(name(e) + ' «' + e.textContent.trim().slice(0, 14) + '» ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  // the big blocks on each other (not under an open phone, book or dialog, which cover the rest on purpose)
  if (!inModal){
    const B = []; for (const sel of blocks){ for (const e of document.querySelectorAll(sel)){ if (vis(e)){ B.push([sel, e.getBoundingClientRect()]); break; } } }
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++){
      const a = B[i][1], b = B[j][1], ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 3 && iy > 3){ const ea = B[i][0], eb = B[j][0]; if (document.querySelector(ea).contains(document.querySelector(eb)) || document.querySelector(eb).contains(document.querySelector(ea))) continue; out.over.push(ea + ' / ' + eb + ' ' + Math.round(ix) + 'x' + Math.round(iy)); }
    }
  }
  return out;
}"""
VIEWS = [
    ('havn', None),
    ('sjo', "(() => { const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0; refreshAll(); })()"),
    ('plotter', "(() => { setBodyView(false); refreshAll(); })()"),
    ('rute', "(() => { const r = document.getElementById('ecRoute'); if (r && r.offsetParent) r.click(); })()"),
    ('telefon', "(() => { setBodyView(true); if (typeof PHONE !== 'undefined') PHONE.show(true, 'home'); else document.getElementById('phoneFab').click(); })()"),
    ('salg', "(() => { PHONE.show(true, 'salg'); })()"),
    ('innst', "(() => { PHONE.show(true, 'innst'); })()"),
    ('bok', "(() => { PHONE.show(false); const l = document.getElementById('logbook'); if (l) l.click(); })()"),
    ('havnmeny', "(() => { const bk = document.getElementById('book'); if (!bk.hidden){ const c = bk.querySelector('[data-close], .bk-close, #bkClose'); if (c) c.click(); else bk.hidden = true; } const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; refreshAll(); const d = document.getElementById('dock'); const first = d && d.querySelector('button'); if (first) first.click(); })()"),
]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        total = 0
        for tag, w, h, touch in SIZES:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=touch and w < 900, device_scale_factor=2 if touch else 1)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME)
            await pg.wait_for_timeout(1500)
            for view, js in VIEWS:
                if js:
                    try: await pg.evaluate(js)
                    except Exception as e: print('FEIL', view, tag, 'kom ikke dit:', str(e)[:120]); continue
                await pg.wait_for_timeout(900)
                r = await pg.evaluate(FIND, [BLOCKS, touch])
                await pg.screenshot(path='ui_%s_%s.png' % (view, tag))
                n = len(r['cut']) + len(r['off']) + len(r['over']) + len(r['small']); total += n
                print(('OK  ' if n == 0 else 'FEIL'), '%-9s %-10s' % (view, tag), '' if n == 0 else json.dumps({k: v[:6] for k, v in r.items() if v}, ensure_ascii=False))
            print('sidefeil', tag, errs[:3])
            await ctx.close()
        print('funn i alt:', total)
        await b.close()

asyncio.run(main())
