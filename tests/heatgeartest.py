"""The sounder and the catch figures (Jonas 21.10.2026, tilbakemelding #79): the sounder's picture is the fish that stand there, the same
whatever the boat is rigged for, and nothing works out a catch from the fish in the sea; the figures the game shows come from what was
taken aboard: a hauled set marks kg per tub, net or pot with its soak, a jig session kg an hour, each coloured against a usual haul."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """async () => {
  const R = {}; S.tut = 0; const b = S.boat; b.type = 'sjark'; applyVessel();
  const H0 = (Date.UTC(2028, 2, 10, 6) - EPOCH) / 3.6e6; S.t = Math.round(H0 * 60);
  // a cod ground in March, with Greenland halibut and halibut in the cell too
  const G = GROUNDS[2].p; await mapNeed(G, 4); b.status = 'idle'; b.pos = {...G}; b.port = null;
  const v = Float64Array.from(heatSample(G, H0)); v[4] = 50; v[0] = 10; v[9] = 2;
  // the picture is the fish that stand there whatever the boat is rigged for: the same value on every rig, the Greenland halibut with it
  S.pgear = newPGear(); S.pgear.nets.push({id:'n1', mesh:156, n:10, cond:1}); S.pgear.lines.hyse.n = 4;
  R.pic = {}; for (const rg of ['juksa', 'garn', 'line', 'teiner']){ b.rig = rg; R.pic[rg] = +heatShown(v, 'all').toFixed(3); } b.rig = 'juksa';
  R.pic.fish = +heatValue(v, 'all').toFixed(3); R.pic.bk = +heatValue(v, 'blakveite').toFixed(3);
  // no catch worked out from the fish in the sea is left to show anywhere
  R.gone = ['heatGearCtx', 'heatGearKg', 'heatGearInfo'].filter(n => typeof window[n] === 'function');
  // marks: a hauled set says per unit with the soak; a jig session says kg an hour, both from the catch aboard
  S.marks = []; const s = {id:'mk', vid:S.cur, kind:'line', lk:'hyse', n:4, hooks:2400, a:{...G}, b:{x:G.x + 0.5, y:G.y}, tSet:S.t - 12 * 60, acc:{}, dead:0, lost:null, cond:1};
  S.sets.push(s); const g = {op:'haul', kind:'line', sid:'mk', n:4, done:4, kg:240, soak:12, rel:0, dead:0}; try { finishHaul(g, S.t / 60); } catch (e){ R.haulErr = String(e); }
  R.mark = S.marks[S.marks.length - 1] || null;
  S.fsess = {x:G.x, y:G.y, t0:S.t - 120, kg:80}; endFishing(); R.jigMark = S.marks[S.marks.length - 1];
  return R; }"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 760}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(300000)
        r = await pg.evaluate(JS)
        print('heatgear:', json.dumps(r, ensure_ascii=False))
        pv = r['pic']
        print(ok(len({pv[k] for k in ('juksa', 'garn', 'line', 'teiner')}) == 1 and pv['juksa'] == pv['fish'] and pv['fish'] >= pv['bk'] >= 50),
              'the sounder shows the fish that stand there, the Greenland halibut too, the same on the jig, nets, line and pots (#79)', pv)
        print(ok(not r['gone']), 'nothing is left that works out a catch from the fish in the sea', r['gone'])
        m, j = r['mark'] or {}, r['jigMark'] or {}
        print(ok(m.get('g') == 'line' and abs(m.get('kgu', 0) - 60) < 0.01 and m.get('soak') == 12 and m.get('q', 0) > 0 and not r.get('haulErr')), 'a hauled line marks 60 kg a tub with its 12 h soak, coloured against a usual haul for 12 h', m, r.get('haulErr'))
        print(ok(j.get('kgph') == 40 and j.get('q', 0) > 0), 'a jig session marks the kg an hour taken aboard, coloured against the rig', j)
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
