"""A landing note paid (Jonas 08.10.2026: «ka-ching», «+(inntekt)» in green, counted over to the account): sell() rings the register
(SND.cash), a green amount rises from the cash bar, and the cash in the bar counts up from what it was to what it is, then shows the
cash as it is. A page a test drives shows the sum at once (navigator.webdriver) unless CASHFX.force is set; here it is."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(async () => {
          const R = {}; CASHFX.force = true; S.tut = 0; S.crew = []; S.quota = null;
          const rings = [], coins = []; SND.cash = k => rings.push(Math.round(k)); SND.coin = u => coins.push(+u.toFixed(2));
          const g = 0; S.t = Math.round((Date.UTC(2028, 2, 10, 7) - EPOCH) / 6e4); S.hold = []; S.facc = {}; S.fnext = {}; S.settings.gut = false;
          S.boat.status = 'fishing'; S.boat.pos = {...GROUNDS[g].p}; S.boat.fishUntil = S.t + 480; S.boat.gear = true; S.equip.jukse = 0; S.boat.ice = 150;
          for (let i = 0; i < 480 && S.boat.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); deckMinute(); } S.fsess = {x:GROUNDS[g].p.x, y:GROUNDS[g].p.y};
          S.t += 120; S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p};
          const c0 = S.cash; renderClock(); sell(); const gain = S.cash - c0;
          R.gain = Math.round(gain); R.rings = rings.slice(); R.first = $('cash').textContent; R.want0 = kr(c0);
          const f = document.querySelector('.cashfx'); R.float = f ? {txt:f.textContent, col:getComputedStyle(f).color} : null; R.cls = $('cash').classList.contains('cashup');
          await new Promise(r => setTimeout(r, CASHFX.dur / 2)); R.mid = $('cash').textContent; R.midOn = CASHFX.on;
          await new Promise(r => setTimeout(r, CASHFX.dur / 2 + 400)); R.end = $('cash').textContent; R.want1 = kr(S.cash); R.on = CASHFX.on; R.cls2 = $('cash').classList.contains('cashup');
          R.coins = coins.length; R.coinsRise = coins.length > 3 && coins[coins.length - 1] > coins[0];
          // a second fx while one runs continues from the shown sum; no amount, no fx
          rings.length = 0; cashFx(0); R.zero = rings.length;
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        m = lambda t: int(''.join(ch for ch in t if ch.isdigit()) or 0)
        print(ok(r['gain'] > 100 and r['rings'] == [r['gain']] and r['zero'] == 0), 'selling rings the register once, with the sum, and no ring for nothing', (r['gain'], r['rings']))
        print(ok(r['float'] and r['float']['txt'].startswith('+') and str(r['gain'])[:2] in r['float']['txt'].replace(' ', '').replace('\xa0', '') and r['float']['col'] == 'rgb(61, 220, 132)'), 'the amount rises in green with a plus', r['float'])
        print(ok(r['first'] == r['want0'] and r['cls'] and r['midOn'] and m(r['want0']) < m(r['mid']) < m(r['want1']) and r['end'] == r['want1'] and not r['on'] and not r['cls2']),
              'the cash bar counts up from the old sum to the new, through the middle, and ends on the real cash', (r['first'], r['mid'], r['end'], r['want1']))
        print(ok(r['coins'] > 3 and r['coinsRise']), 'the count ticks on the way, higher towards the end', r['coins'])
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
