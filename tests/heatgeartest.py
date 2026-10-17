"""The map in the gear's own unit (08.10.2026): the jig keeps kg an hour (the rig's own figure in the sounder's box), nets, line tubs and
pots show the kilos one unit gives over 24 h, coloured against a usual haul; the figure agrees with the gear's own soak (soakHour); the
catch marks say kg per tub, net or pot with the soak, and a jig mark is coloured against the rig."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """async () => {
  const R = {}; S.tut = 0; const b = S.boat; b.type = 'sjark'; applyVessel();
  const H0 = (Date.UTC(2028, 2, 10, 6) - EPOCH) / 3.6e6; S.t = Math.round(H0 * 60);
  const dry = (kind, extra, p, h) => { const s = Object.assign({kind, n:1, a:{x:p.x - 0.1, y:p.y}, b:{x:p.x + 0.1, y:p.y}, tSet:S.t, acc:{}, dead:0, dry:true, cond:1}, extra), t0 = S.t;
    for (let k = 1; k <= h; k++){ S.t = t0 + k * 60; soakHour(s, S.t / 60); } S.t = t0; return Object.values(s.acc).reduce((a, x) => a + x.kg, 0); };
  // a cod ground in March and a crab place in August
  const G = GROUNDS[2].p; await mapNeed(G, 4); b.status = 'idle'; b.pos = {...G}; b.port = null;
  const v = heatSample(G, H0);
  b.rig = 'juksa'; R.jig = heatGearCtx() === null;
  S.pgear = newPGear(); S.pgear.nets.push({id:'n1', mesh:156, n:10, cond:1}); b.rig = 'garn'; const cg = heatGearCtx();
  R.garn = {map:+heatGearKg(v, 'all', cg).toFixed(1), soak:+dry('garn', {mesh:156}, G, 24).toFixed(1)};
  S.pgear.lines.hyse.n = 4; b.rig = 'line'; const cl = heatGearCtx();
  R.line = {map:+heatGearKg(v, 'all', cl).toFixed(1), soak:+dry('line', {lk:'hyse', hooks:600, baitW:{makrell:1}}, G, 24).toFixed(1), unit:cl.unit[0]};
  const C = P(70.5, 31.0); await mapNeed(C, 4); const Hc = (Date.UTC(2028, 7, 15, 6) - EPOCH) / 3.6e6, vc = heatSample(C, Hc); b.rig = 'teiner'; const ct = heatGearCtx();
  S.t = Math.round(Hc * 60); R.teine = {map:+heatGearKg(vc, 'all', ct).toFixed(1), soak:+dry('teine', {pot:'big', bait:'makrell'}, C, 24).toFixed(1)}; S.t = Math.round(H0 * 60);
  // the colours: a usual haul is green, twice that is higher on the scale
  HEATGC = cg; const half = heatIndex(10, false), usual = heatIndex(heatGearVal(v, 'all') / heatGearVal(v, 'all') * 20, false); R.colourUp = usual > half;
  // the sounder's box: the figure where the boat is
  HEATC.cs = 0.1; HEATC.cells.set(heatKey(Math.floor(G.x / 0.1), Math.floor(G.y / 0.1)), {x:G.x, y:G.y, v, t:S.t, h:0, seen:S.t, near:0});
  b.rig = 'garn'; R.infoGarn = heatGearInfo(); b.rig = 'juksa'; R.infoJig = heatGearInfo();
  // marks: a hauled set says per unit with the soak; a jig session is coloured against the rig
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
        near = lambda a, b: b > 0 and 0.5 <= a / b <= 1.8
        print(ok(r['jig']), 'rigged for the jig the map keeps kg an hour (no gear context)')
        print(ok(near(r['garn']['map'], r['garn']['soak'])), 'nets: the map says about what a net takes in 24 h there', r['garn'])
        print(ok(near(r['line']['map'], r['line']['soak']) and r['line']['unit'] == 'stamp'), 'line: the map says about what a tub takes in 24 h there', r['line'])
        print(ok(r['teine']['map'] > 0 and r['teine']['map'] <= 60.5 and near(r['teine']['map'], r['teine']['soak'])), 'pots: the map says about what a pot takes in 24 h, never more than a full pot', r['teine'])
        print(ok(r['colourUp']), 'a usual haul sits higher on the colours than half of one')
        print(ok(r['infoGarn'] and 'per garn etter 24 t' in r['infoGarn']['no'] and r['infoJig'] and 'kg/t med riggen din' in r['infoJig']['no']), "the sounder's box: kg per net after 24 h, or kg an hour with your rig", r['infoGarn'], r['infoJig'])
        m, j = r['mark'] or {}, r['jigMark'] or {}
        print(ok(m.get('g') == 'line' and abs(m.get('kgu', 0) - 60) < 0.01 and m.get('soak') == 12 and m.get('q', 0) > 0 and not r.get('haulErr')), 'a hauled line marks 60 kg a tub with its 12 h soak, coloured against a usual haul for 12 h', m, r.get('haulErr'))
        print(ok(j.get('kgph') == 40 and j.get('q', 0) > 0), 'a jig mark keeps kg an hour and is coloured against the rig', j)
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
