"""The haill and the room in the gear (Jonas 06.11.2026, «Mer plass i redskapet»; core/03-simulation.js haillCap, 10-gear.js soakHour).
The haill promises «alt redskapet ditt fanger dobbelt så mye», but a full net or line took no more, so over a long soak the haill gave far
less (6 nets 24 h with luksushaill x1.38, the autoline x1.14, where x3 is promised), and the fish in the pots got none of it. The same
seeded soak of 24 hours with and without the haill, for nets, a line, the autoline and the crab pots, and the haill switched on through
the shop (shopGive) in the middle of a soak: the gear takes more from the hour after, with no reload.
KYST_LITE=1 python3 tests/haillplass.py. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


JS = r"""(() => { const p = GROUNDS[0].p, H0 = (Date.UTC(2028, 2, 8, 6) - EPOCH) / 3.6e6, t0 = S.t, out = {};
  const KINDS = {garn:['garn', {n:6}], line:['line', {lk:'hyse', hooks:1200, n:3, baitW:{makrell:3}}], auto:['line', {lk:'auto', hooks:5000, n:1, baitW:{saury:1, blekksprut:1}}], teine:['teine', {pot:'big', n:20, bait:'makrell'}]};
  const soak = (kind, ex, type, hours, midAt) => { const s = Object.assign({kind, n:1, a:{x:p.x, y:p.y}, b:{x:p.x + 0.3, y:p.y}, tSet:Math.round(H0 * 60), acc:{}, dead:0, dry:true, cond:1}, ex);
    S.haill = type && !midAt ? {type, t0:Math.round(H0 * 60)} : null; S.haillInv = {haill:0, luksus:0}; const per = []; let last = 0;
    for (let h = 1; h <= hours; h++){ S.t = Math.round((H0 + h) * 60); if (midAt && h === midAt){ shopGive({id:'hp' + h, data:{give:'haill', type}}); useHaill(type); }
      soakHour(s, H0 + h); const k = Object.values(s.acc).reduce((q, x) => q + x.kg, 0); per.push(k - last); last = k; }
    S.t = t0; S.haill = null; return {kg:last, per, sp:Object.fromEntries(Object.entries(s.acc).map(([k, v]) => [k, v.kg]))}; };
  for (const k in KINDS){ const [kind, ex] = KINDS[k], a = soak(kind, ex, null, 24);
    out[k] = {none:a.kg, haill:soak(kind, ex, 'haill', 24).kg, luksus:soak(kind, ex, 'luksus', 24).kg, mid:soak(kind, ex, 'luksus', 24, 8).per, ref:a.per, sp0:a.sp, sp3:soak(kind, ex, 'luksus', 24).sp}; }
  return out; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000)
        r = await pg.evaluate(JS)
        for k, v in r.items():
            for typ, x in (('haill', 2), ('luksus', 3)):
                q = v[typ] / max(1e-9, v['none'])
                check(abs(q - x) <= 0.1 * x, f'{k}: 24 t med {typ} gir ×{q:.2f} av lovet ×{x}', {'kg': [round(v['none']), round(v[typ])]})
            after = sum(v['mid'][8:]) / max(1e-9, sum(v['ref'][8:]))
            check(after >= 2.5, f'{k}: luksushaill gitt gjennom butikken midt i ståtida (time 8) gir mer fra timen etter, uten ny innlasting', {'x': round(after, 2)})
        t = r['teine']
        check(t['sp0'].get('torsk', 0) > 0 and abs(t['sp3']['torsk'] / t['sp0']['torsk'] - 3) < 0.15, 'torsken i teinene får luksushailen (×3), som krabben', {'kg': [round(t['sp0'].get('torsk', 0), 1), round(t['sp3'].get('torsk', 0), 1)]})
        print('sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
