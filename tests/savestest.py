"""Every real save starts (Jonas 08.10.2026, after a player's cloud save could not start: «mask block 105,20 is not loaded»): each save in
tests/saves/ (tools/saves/fetch.py, not in git) is put on a fresh device, the game is opened, and it must come up without the error card,
let two game hours go by without a page error, and still hold its boat. Without saves the test says so and passes nothing."""
from _env import GAME
import asyncio, json, os, glob
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
DIR = os.path.join(os.path.dirname(__file__), 'saves')

async def one(br, path):
    raw = open(path).read()
    ctx = await br.new_context(viewport={'width': 1000, 'height': 760})
    await ctx.add_init_script("if (!sessionStorage.getItem('st_put')){ sessionStorage.setItem('st_put', '1'); localStorage.clear(); localStorage.setItem('kystfiske_v2', " + json.dumps(raw) + "); }")
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.set_default_timeout(150000)
    await pg.goto(GAME)
    try:
        await pg.wait_for_function("(typeof SIMREADY !== 'undefined' && SIMREADY) || /Spillet startet ikke|The game did not start|Kartet lastet ikke/.test((document.getElementById('modal') || {}).innerText || '')", timeout=150000)
    except Exception as e:
        errs.append('timeout: ' + str(e)[:120])
    st = await pg.evaluate("({failed:/Spillet startet ikke|The game did not start|Kartet lastet ikke/.test((document.getElementById('modal') || {}).innerText || ''), msg:((document.getElementById('modal') || {}).innerText || '').slice(0, 200), ready:typeof SIMREADY !== 'undefined' && SIMREADY, t:typeof S !== 'undefined' && S ? S.t : null})")
    if st['ready'] and not st['failed']:
        st['after'] = await pg.evaluate("(() => { try { catchUp(2 * 3600e3 / GAME_RATE); } catch (e){ return {err:String(e)}; } return {t:S.t, boat:!!(S.boat && S.boat.pos && isFinite(S.boat.pos.x))}; })()")
    await ctx.close()
    return st, errs

async def main():
    files = sorted(glob.glob(os.path.join(DIR, '*.json')))
    if not files:
        print('no saves in tests/saves (python3 tools/saves/fetch.py, with SUPABASE_SERVICE_ROLE_KEY)'); print('errors: []'); return
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        for f in files:
            st, errs = await one(br, f)
            a = st.get('after') or {}
            good = st['ready'] and not st['failed'] and not a.get('err') and a.get('boat') and (a.get('t') or 0) > (st['t'] or 0) and not errs
            print(ok(good), 'the save starts, plays two game hours and keeps its boat:', os.path.basename(f), json.dumps({'st': st, 'errs': errs[:2]}, ensure_ascii=False)[:400])
        await br.close()
    print('errors: []')

asyncio.run(main())
