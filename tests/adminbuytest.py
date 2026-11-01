"""the admin takes any vessel into the fleet for free, the locked ocean fleet too, from the boat market's sheet (Jonas 30.10.2026:
«La meg som admin kunne kjøpe båter gratis, selv fra havflåten. Jeg må kunne teste dem»); a player without the flag sees no button"""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot
from playwright.async_api import async_playwright

def ok(c): return 'OK  ' if c else 'FEIL'

SHEET = """((admin) => { window.__adm = window.__adm || adminOk; adminOk = admin ? window.__adm : () => false; const dr = () => document.getElementById('drawerBody'), tap = sel => { const e = dr().querySelector(sel); if (e) e.click(); return !!e; };
  DOCK.open('fartoy'); tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=hav]'); tap('[data-pa=mksel][data-k=ringnot38]');
  const btn = dr().querySelector('[data-pa=adminbuy][data-k=ringnot38]'); return {btn:!!btn}; })"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 1100, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r0 = await pg.evaluate(SHEET, False)
        print(ok(not r0['btn']), 'a player who is not admin sees no free button', r0)
        r1 = await pg.evaluate(SHEET, True)
        print(ok(r1['btn']), 'the admin sees the free button on a locked ocean vessel', r1)
        r = await pg.evaluate("""(() => { const c0 = S.cash, n0 = S.fleet.length, debt0 = (S.loans || []).length;
          document.getElementById('drawerBody').querySelector('[data-pa=adminbuy][data-k=ringnot38]').click();
          return {cash:S.cash - c0, fleet:S.fleet.length - n0, loans:(S.loans || []).length - debt0, type:S.boat.type, len:BOAT.len, port:!!S.boat.port, name:S.boatName}; })()""")
        print(ok(r['cash'] == 0 and r['loans'] == 0 and r['fleet'] == 1 and r['type'] == 'ringnot38' and abs(r['len'] - 38.55) < 0.01 and r['port']), 'she is in the fleet for free, in port and followed', r)
        await pg.wait_for_timeout(1500)
        s = await pg.evaluate("""(() => { const b = S.boat, p = b.pos; b.status = 'sailing'; b.port = null; b.v = 8; b.heading = 1.0;
          S.plan = {wps:[{x:p.x + 3, y:p.y, port:null, fish:0}], idx:0, speed:8, returning:false}; return true; })()""")
        await pg.wait_for_timeout(3000)
        print(ok(not errs), 'no page errors', errs[:3])
        await br.close()
asyncio.run(main())
