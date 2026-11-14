"""The fixed sweep of the new people (Folk 2, FB7, steg 125, sixth session; Jonas 14.11.2026, «Valg A»: the step is delivered
against the same scenes, the same moments and the same seed every time, not against the moments a running game happens to show).
What `python3 tests/folk2live.py maal` measures by hand, as a test: every pose drawWorker has is put on the people at the break
places and swept through its round, and the work that has a place of its own (the hauler at the rail, the gutter at his table, the
packer at his crate, the baiter, the mender, the setter, the pots, the quay, the wash) is swept where the game has put the people
themselves, with the events (gaff, bleed, jigup) played again at the moments asked for. One line a group:

  no hand moved more than 5 cm from its point at a real place, and nothing a man holds himself more than 3 cm inside him.

A pose put on the break places that has its real place elsewhere (sett without a rail, gutw without a table) is printed, not held
against the limit. STOPP is the stop list of «Sjette økt» in docs/planer/start/125.md: known, printed with its number, and not
touched in steg 125. Another man's thing in a body is printed (the places' matter: docs/planer/arbeidsceller.md).

  python3 tests/folk2maal.py              the checks (prints OK or FEIL)
  python3 tests/folk2maal.py arbeid kai   only those groups (tvunget, arbeid, garn, juksa, egning, boting, setting, teiner, kai, vask)
"""
from _env import boot, GAME
from lemmer import SET, BOATS, TASKS, frames, check
import asyncio, json, sys
from playwright.async_api import async_playwright

ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
HAND, THING = 5.0, 3.0   # cm: a hand from its point at a real place; a man's own thing inside him
# the work at its own places: scene -> [task, how, t0, t1, n]; how: 's' the ones who have that work, where they stand; 'e' the last
# event of that kind played again; 'l' the packer laying the fish straight (SJOBEIN.test.lay, s since it landed in his crate)
SPILL = [
    ('arbeid', [['haul', 's', 0, 6, 25], ['bleedst', 's', 0, 6, 25], ['gutw', 's', 0, 5.6, 57], ['pack', 's', 0, 8, 81], ['pack', 'l', 0, 2, 41], ['gaff', 'e', 0, 2.4, 49], ['bleed', 'e', 0, 3, 31]]),
    ('garn', [['haul', 's', 0, 6, 25], ['gutw', 's', 0, 5.6, 29]]),
    ('juksa', [['jig', 's', 0, 6, 25], ['gutw', 's', 0, 5.6, 29], ['jigup', 'e', 0, 3, 31]]),
    ('egning', [['egn', 's', 0, 6, 25]]),
    ('boting', [['mend', 's', 0, 6, 25]]),
    ('setting', [['sett', 's', 0, 6, 25]]),
    ('teiner', [['haul', 's', 0, 6, 25], ['tend', 's', 0, 6, 25]]),
    ('kai', [['signal', 's', 0, 6, 25], ['nozzle', 's', 0, 6, 25]]),
    ('vask', [['sweep', 's', 0, 6, 25], ['hose', 's', 0, 6, 25]]),
]
# forced on the break places these say nothing of the real place (no rail, no table, no tub there): printed only
ELSEWHERE = ('sett', 'pick', 'gutw')
# the stop list (docs/planer/start/125.md «Sjette økt»): (group, task) -> why; printed with the number, not held against the limit
STOPP = {}

# one sweep in the page: the hands that were moved (m, [right, left], and when), and every thing more than 1 cm inside a body
SWEEP = """([task, how, t0, t1, n]) => { const C = {}; let ao = [0, 0], at = [0, 0], cnt = 0; const ev = how === 'e';
  for (let k = 0; k < n; k++){ const t = t0 + (t1 - t0) * k / Math.max(1, n - 1), B = {roll:0, pitch:0, T:103.1};
    SJOBEIN.test = how === 'e' ? {...B, t, ev:task} : how === 'l' ? {...B, t:0, lay:t} : how === 's' ? {...B, t, lay:-1} : {...B, task, t};
    LEMMER.log = []; LEMMER.things = []; LEMMER.bodies = []; LEMMER.redraw();
    for (const q of LEMMER.log) if (q.task === task && q.gp && (!ev || q.ev)){ cnt++; for (const i of [0, 1]) if (q.ao[i] > ao[i]){ ao[i] = q.ao[i]; at[i] = +t.toFixed(2); } }
    for (const o of G3._debug.thingClip(0.01)){ if (o.task !== task && !ev) continue; const k3 = (ev ? o.task + '|' : '') + (o.own ? 'egen' : 'annens') + '|' + o.name + '|' + o.part, c = C[k3]; if (!c || o.cm > c[0]) C[k3] = [o.cm, +t.toFixed(2)]; } }
  SJOBEIN.test = null; LEMMER.log = null; LEMMER.things = null; LEMMER.bodies = null;
  return {n:cnt, cm:ao.map(v => +(v * 100).toFixed(1)), da:at, ting:C}; }"""


async def scene_set(pg, t, scene, kinds=()):
    await pg.evaluate("G3._debug.studio(false)"); await pg.evaluate(SET, [t, scene, 1, -0.9, 0.3, 6]); await frames(pg, t, 2)
    try:
        await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
        # (the events that are played again must have been played once, and the gear that gives them is not drawn in the white room)
        if kinds: n0 = await pg.evaluate("G3._debug.dk.n"); await pg.wait_for_function("([K, n0]) => K.every(k => G3._debug.dk.n[k] > (n0[k] || 0))", arg=[list(kinds), n0], timeout=300000)
    except Exception: pass
    await pg.evaluate("G3._debug.studio(true)"); await pg.evaluate("LEMMER.log = []"); await frames(pg, t, 1); await pg.evaluate("LEMMER.log = null")


async def sweep(pg, t, sw, tries=1):
    """One sweep; one whose people or whose event is not there yet is waited for (the walk to the places, the first fish)."""
    r = None
    for k in range(tries):
        r = await pg.evaluate(SWEEP, sw)
        if r['n'] or k == tries - 1: break
        await pg.wait_for_timeout(5000); await frames(pg, t, 1)
    return r


def verdict(group, rows, hands=True):
    """One line a group: the worst hand and the worst own thing over the limits; the stop list and others' things printed."""
    bad = []; worst = [0, '']; own = [0, '']; stop = []; oth = {}
    for task, how, r in rows:
        nm = task + {'e': '*', 'l': ' (legger)'}.get(how, '')
        if not r['n']: bad.append('%s: ikke sett' % nm); continue
        h = max(r['cm']); st = STOPP.get((group, task))
        if hands:
            if st and h > HAND: stop.append('%s %s cm (%s)' % (nm, r['cm'], st))
            elif h > HAND: bad.append('%s: hånda flyttet %s cm ved t %s' % (nm, r['cm'], r['da']))
            if h > worst[0] and not st: worst = [h, nm]
        for k, (cm, at) in r['ting'].items():
            if '|egen|' in k or k.startswith('egen|'):
                if cm > THING: bad.append('%s: %s %.1f cm ved t %s' % (nm, k, cm, at))
                if cm > own[0]: own = [cm, nm + ' ' + k.split('|')[-2]]
            elif cm >= THING: oth[nm + ' ' + k] = max(oth.get(nm + ' ' + k, 0), cm)
    check(not bad, '%s: ingen hånd flyttet mer enn %g cm, ingen egen ting mer enn %g cm inn i ham (verste hånd %.1f cm %s; verste egen ting %.1f cm %s; %d feiinger)' % (group, HAND, THING, worst[0], worst[1], own[0], own[1], len(rows)), bad if bad else '')
    if stop: print('     stopplista (%s): %s' % (group, '; '.join(stop)), flush=True)
    if oth: print('     andres ting i en kropp, 3 cm og over (%s): %s' % (group, json.dumps(dict(sorted(oth.items(), key=lambda q: -q[1])[:8]), ensure_ascii=False)), flush=True)


async def main():
    want = sys.argv[1:]
    async with async_playwright() as p:
        br = await p.chromium.launch(args=ARGS)
        pg = await br.new_page(viewport={'width': 320, 'height': 240}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ('' if ',folk2' in GAME else ',folk2')); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
        t = (await pg.evaluate(BOATS))[1]
        if not want or 'tvunget' in want:
            await scene_set(pg, t, 'pause'); rows = []; info = []
            for task in [k for k in TASKS if k not in ('sitmat', 'sitkaffe')] + ['gutw']:   # (the two are 'lunch' and 'coffee' seated: drawn under those names)
                r = await sweep(pg, t, [task, 'f', 0, 6, 25])
                if task in ELSEWHERE: info.append('%s %s' % (task, r['cm'])); r = dict(r, cm=[0, 0])   # (its things are still his own: held against the limit)
                rows.append((task, 'f', r))
            verdict('tvunget (alle stillingene på pauseplassene)', rows)
            print('     uten ekte plass her, bare opplysning (cm [høyre, venstre]): ' + '; '.join(info), flush=True)
        for scene, sws in SPILL:
            if want and scene not in want: continue
            await scene_set(pg, t, scene, [sw[0] for sw in sws if sw[1] == 'e']); rows = []
            for sw in sws: rows.append((sw[0], sw[1], await sweep(pg, t, sw, 12)))
            verdict(scene, rows)
            print('     %s: %s' % (scene, '; '.join('%s%s %s' % (a, {'e': '*', 'l': ' (legger)'}.get(b, ''), r['cm']) for a, b, r in rows)), flush=True)
        gerr = await pg.evaluate("G3._debug.glErr()"); check(gerr == 0, 'ingen GL-feil', gerr); check(not errs, 'ingen sidefeil', errs[:3])
        await br.close()

if __name__ == '__main__':
    asyncio.run(main())
