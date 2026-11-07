"""The draft's legs checked for land once, not at every frame (core/01-world.js legClearMemo, ui/03-map.js renderDyn,
ui/04-panels-instruments.js estimate; 07.11.2026: a route Bodø–Husøy of 37 legs was some 8 500 isLand a frame, five frames a second,
on a phone). A draft of several legs off Senja is drawn ten times and its estimate made ten times, with legClear wrapped to count the
legs it really works out. Before: every leg every time. After: each leg once, the same answers as legClear itself, and worked out again
when the map under it changes (a tile's fine coast indexed, COAST.built). Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:600])
    if not c: bad.append(msg)

READY = "typeof SIMREADY !== 'undefined' && SIMREADY === true"
# a draft from the grounds off Senja: eight points round the ground, some legs over land on purpose (the answers must be the same)
RUN = """(() => { const b = S.boat, g = GROUNDS[2].p; S.tut = 0; S.plan = null; b.status = 'idle'; b.port = null; b.pos = {...g};
  S.draft = [0, 1, 2, 3, 4, 5, 6, 7].map(k => ({x:g.x + 6 * Math.cos(k * Math.PI / 4), y:g.y + 6 * Math.sin(k * Math.PI / 4), port:null, fish:0}));
  const lc0 = legClear; let n = 0; legClear = function(a, c){ n++; return lc0(a, c); };
  const legs = S.draft.length, t0 = performance.now();
  try {
    for (let i = 0; i < 10; i++){ renderDyn(); estimate(); }
    const tAll = performance.now() - t0, nAll = n;
    // the answers, as drawn, against legClear itself
    let a = draftOrigin(), same = 0; for (const w of S.draft){ const m = typeof legClearMemo === 'function' ? legClearMemo(a, w) : lc0(a, w); if (m === lc0(a, w)) same++; a = w; }
    // the map changes under it (a tile's fine coast indexed): worked out again once
    const n0 = n; COAST.built++; renderDyn(); const nAfter = n - n0;
    return {legs, calls:nAll, ms:Math.round(tAll), same, again:nAfter, memo:typeof legClearMemo === 'function'};
  } finally { legClear = lc0; } })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.wait_for_function(READY, timeout=120000)
        r = await pg.evaluate(RUN)
        print(json.dumps(r))
        check(r['legs'] == 8 and r['calls'] <= r['legs'], 'ten drawings and ten estimates of an eight-leg draft work out each leg once (before: every leg every time)', r)
        check(r['same'] == r['legs'], 'the remembered answers are the ones legClear gives', r)
        check(r['again'] == r['legs'], 'when the map under it changes (a fine coast indexed), each leg is worked out again once', r)
        check(not errs, 'no page errors', errs[:4])
        await b.close()
    print('røde:', bad if bad else 'ingen')

asyncio.run(main())
