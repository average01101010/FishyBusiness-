"""The burn (schema v2, docs/batplan.md del 4): every boat burns her lph at cruising speed at her design load, within the mass term's
margin, and the range in the sheet follows from the tank and the burn. Prints the table and OK/FEIL lines. No 3D."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const b = S.boat, keep = {type:b.type, fuel:b.fuel, ice:b.ice, hold:S.hold, foul:b.foul, eng:b.engLv, trim:b.trim}, out = {};
          for (const k in VESSELS){ const V = VESSELS[k]; b.type = k; b.engLv = 0; delete b.trim; b.foul = 0; applyVessel();
            // the design load of boatTons0: a quarter of the hold, half the tank, one person
            S.hold = [{sp:'torsk', cls:1, kg:V.holdCap * 0.25, n:Math.round(V.holdCap / 16), bled:true, iced:false, hr:0, fresh:95, gut:true, hook:true}]; b.ice = 0; b.fuel = BOAT.fuelCap / 2;
            const at = fuelLph(V.vcruise, 0), top = fuelLph(V.vmax, 0), slow = fuelLph(Math.max(2, V.vcruise * 0.5), 0);
            out[k] = {lph:V.lph, at:+at.toFixed(2), top:+top.toFixed(1), slow:+slow.toFixed(2), range:V.range, nm:Math.round(V.fuelCap / at * V.vcruise), lhp:+(V.lph / V.hp).toFixed(3), planing:V.planing}; }
          Object.assign(b, {type:keep.type, fuel:keep.fuel, ice:keep.ice, foul:keep.foul, engLv:keep.eng}); if (keep.trim) b.trim = keep.trim; S.hold = keep.hold; applyVessel(); return out; })()""")
        print('%-12s %7s %8s %8s %8s %7s %7s %7s' % ('type', 'lph', 'at cruise', 'at top', 'at half', 'range', 'nm now', 'l/hp.h'))
        bad = []
        for k, v in r.items():
            print('%-12s %7.1f %8.2f %8.1f %8.2f %7d %7d %7.3f' % (k, v['lph'], v['at'], v['top'], v['slow'], v['range'], v['nm'], v['lhp']))
            if abs(v['at'] - v['lph']) > v['lph'] * 0.03 + 0.05: bad.append(k + ': burns ' + str(v['at']) + ' not ' + str(v['lph']))
            if not (v['top'] > v['at'] and v['slow'] < v['at']): bad.append(k + ': the curve does not rise with speed')
            if abs(v['nm'] - v['range']) > v['range'] * 0.05 + 5: bad.append(k + ': range ' + str(v['nm']) + ' not ' + str(v['range']))
        print(ok(not bad), 'every boat burns her lph at cruising speed, more at top speed and less at half, and the range follows', bad[:5])
        print('errors:', errs)
        await br.close()

asyncio.run(main())
