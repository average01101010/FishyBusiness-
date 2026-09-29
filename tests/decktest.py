from _env import GAME
# Deck work (G): the catch is bled at once and lies in the bleeding tub; gutting (about 300 kg an hour a person) and icing (about 800)
# take hands and time. Alone you cannot gut while you fish or steer: fishing stops when the tub is full, and by default the catch is seen
# to before you leave the grounds. With two aboard, one steers or fishes while the other works the deck.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{
          S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 5, 9, 8) - EPOCH) / 6e4); S.settings.autoOn = false; S.settings.gut = true; S.settings.ice = true; S.settings.deckFirst = true;
          const R = {}, b = S.boat, g = GROUNDS[0].p, kgOf = f => Math.round(S.hold.filter(f).reduce((a, x) => a + x.kg, 0) * 10) / 10;
          const reset = (crew) => { S.crew = crew; S.hold = []; b.ice = 150; b.fuel = 90; b.status = 'fishing'; b.pos = {...g}; b.fishUntil = S.t + 600; b.deckStop = false; b.deckEnd = null; S.plan = null; S.facc = {}; S.fnext = {}; };
          // alone: the catch goes into the tub, bled, round, not iced
          reset([]); addCatch('torsk', 30, null, true); R.caught = {tub:kgOf(x => !x.gut && !x.iced), bled:S.hold.every(x => x.bled)};
          // below the tub's 60 kg nothing stops; over it, fishing stops for the deck work
          step(); R.below = b.deckStop; addCatch('torsk', 35, null, true); const fu0 = b.fishUntil; step(); R.stopped = b.deckStop;
          const p0 = kgOf(x => x.gut); for (let i = 0; i < 10; i++) step(); R.gutRate = Math.round((kgOf(x => x.gut) - p0) / 10 * 10) / 10;
          for (let i = 0; i < 40 && b.deckStop; i++) step(); R.done = {stop:b.deckStop, pending:Math.round(deckPending()), gutIced:kgOf(x => x.gut && x.iced), extended:b.fishUntil - fu0};
          // alone and under way: nothing gets done on deck
          reset([]); addCatch('sei', 40, null, true); b.status = 'sailing'; S.plan = {wps:[{x:g.x + 3, y:g.y, port:null, fish:0}], idx:0, speed:8, returning:false};
          for (let i = 0; i < 20; i++) step(); R.aloneSailing = Math.round(deckPending());
          // two aboard and under way: one steers, one guts
          const mate = Object.assign(genCrew(), {bi:false, off:false}); reset([mate]); addCatch('sei', 40, null, true); b.status = 'sailing'; S.plan = {wps:[{x:g.x + 3, y:g.y, port:null, fish:0}], idx:0, speed:8, returning:false};
          const q0 = kgOf(x => x.gut); for (let i = 0; i < 5; i++) step(); R.twoSailing = Math.round((kgOf(x => x.gut) - q0) * 10) / 10;
          // two aboard and fishing: one at the deck, fishing goes at half the hands; the tub does not stop them
          reset([mate]); addCatch('sei', 20, null, true); R.twoFishingHands = deckHands(); R.twoFishingStop = b.deckStop;
          // alone at the end of fishing: the catch is seen to before leaving
          reset([]); addCatch('torsk', 25, null, true); b.fishUntil = S.t + 1; S.plan = {wps:[{x:g.x, y:g.y, port:null, fish:1}, {x:g.x + 3, y:g.y, port:null, fish:0}], idx:1, speed:8, returning:false};
          step(); step(); R.endStay = {status:b.status, stop:b.deckStop}; for (let i = 0; i < 20 && b.status === 'fishing'; i++) step(); R.endLeave = {status:b.status, pending:Math.round(deckPending())};
          // quality: fish left in the tub loses about three times as fast as iced fish
          reset([]); addCatch('torsk', 5, null, true); addCatch('hyse', 5, null, true); moveKg(S.hold.find(x => x.sp === 'hyse'), 5, {iced:true, gut:true}); b.status = 'sailing'; S.hold.forEach(x => x.fresh = 100);
          for (let i = 0; i < 180; i++){ for (const x of S.hold){ const rr = x.bled ? (x.iced ? 0.9 : 3.0) : (x.iced ? 2.2 : 6.0); x.fresh -= rr / 60; } }
          R.fresh = S.hold.map(x => [x.sp, Math.round(x.fresh)]);
          // the Stop and gut button while fishing, and Fish on
          reset([]); addCatch('torsk', 10, null, true); renderActs(); R.btn = document.getElementById('actbar').innerText; doAct({dataset:{act:'deckstop'}, disabled:false}); R.btnStop = b.deckStop;
          for (let i = 0; i < 5; i++) step(); R.afterBtn = {stop:b.deckStop, pending:Math.round(deckPending())};
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['caught']['tub'] == 30 and r['caught']['bled']), 'the catch is bled at once and lies in the tub, round and not iced')
        print(ok(r['below'] is False and r['stopped'] is True), 'alone, fishing stops when the 60 kg tub is full')
        print(ok(4.5 <= r['gutRate'] <= 5.5), 'one person guts about 5 kg a minute (300 kg an hour)')
        print(ok(not r['done']['stop'] and r['done']['pending'] == 0 and r['done']['gutIced'] >= 64 and r['done']['extended'] >= 15), 'when the tub is empty fishing goes on, and the fishing time is made up')
        print(ok(r['aloneSailing'] == 40), 'alone under way nothing gets gutted')
        print(ok(3 <= r['twoSailing'] <= 40), 'two aboard under way: one steers, the other guts (about 25 kg in five minutes, more or less with the crew\'s form)')
        print(ok(r['twoFishingHands'] == 1 and r['twoFishingStop'] is False), 'two aboard fishing: one works the deck, fishing does not stop')
        print(ok(r['endStay']['status'] == 'fishing' and r['endStay']['stop'] and r['endLeave']['status'] == 'sailing' and r['endLeave']['pending'] == 0), 'alone, the catch is seen to before she leaves the grounds')
        f = dict(r['fresh']); print(ok(f['hyse'] - f['torsk'] >= 5), 'fish left in the tub loses quality faster than iced fish')
        print(ok('Stopp og sløy' in r['btn'] and r['btnStop'] and r['afterBtn']['pending'] == 0 and not r['afterBtn']['stop']), 'the Stop and gut button stops fishing, and fishing goes on when the tub is empty')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
