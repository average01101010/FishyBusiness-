"""Autonav from Father's naust (tilbakemelding #20): the route starts at the naust's berth, not at the plant's harbour point, the chart
plotter draws the boat there, and when the lines are in she sails from there. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def ok(c): return 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader'])
        pg = await br.new_page(viewport={'width': 1200, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = json.loads(await pg.evaluate("""(async () => { const F = portById('finnsnes'), b = S.boat; await mapNeed(F.p, MAPD.simR); S.home = 'finnsnes'; S.naust = null; naustSite();
          S.plan = null; S.draft = []; dock('finnsnes', 'naust'); const q = typeof quayPos === 'function' ? quayPos(b) : berthPose('finnsnes', b.type, 'naust'), R = {kind:berthKind(b), naustD:Math.round(dist(q, F.p) * 1000)};
          openPlotter(); renderDyn(); const g = LG(56.3, 49.4); await leiaTo(g);
          R.n = S.draft.length; R.first = S.draft.length ? Math.round(dist(S.draft[0], q) * 1000) : null;
          R.nearPlant = S.draft.slice(0, -1).filter(w => dist(w, F.p) < 0.05 && dist(w, q) > 0.05).length;
          R.legOk = S.draft.length ? legClear(q, S.draft[0]) : false;
          S.plan = {wps:S.draft.map(w => Object.assign({}, w)), idx:0, speed:6, returning:false}; S.draft = [];
          depart(); R.st0 = b.status; for (let i = 0; i < 30 && b.status !== 'sailing'; i++) step();
          R.st1 = b.status; R.from = Math.round(dist(b.pos, q) * 1000); return JSON.stringify(R); })()"""))
        print(json.dumps(r))
        print(ok(r['kind'] == 'naust' and r['naustD'] > 30), 'the boat lies at Father\'s naust, away from the harbour point', r['naustD'])
        print(ok(r['n'] > 0 and r['nearPlant'] == 0 and r['first'] < 200 and r['legOk']), 'Autonav from the naust starts at its berth, not by the plant', (r['n'], r['first'], r['nearPlant'], r['legOk']))
        print(ok(r['st1'] == 'sailing' and r['from'] < 30), 'when the lines are in, she sails from the naust', (r['st0'], r['st1'], r['from']))
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
