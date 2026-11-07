"""The bridge view and the wheelhouse on every boat (Jonas 21.10.2026: «Hodet på skipperen stikker også opp gjennom styrhustaket. Og
vinduene på båten er svarte så man ser ingenting ut når man trykker på bridge-view»): from the eye at the wheel the sea and the sky are
seen through the windows (the dark lining inside the house was whole and hid them), and the one at the wheel has his head under the roof
(the room over his place in the model, vessel3d.js vesselModel). Under way by day at sea, the bridge view of each type; pictures bro_*.png
in tests/out. Prints OK or FEIL."""
from _env import boot, OUT
import asyncio, os, sys, json
from playwright.async_api import async_playwright
from PIL import Image


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra != '' else ''))


SET = """((t) => { const b = S.boat; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4);
  b.type = t; applyVessel(); G3.vesselChanged(); S.equip = {}; S.jobs = []; S.cargo = []; b.gop = null; S.hold = []; S.pgear = newPGear(); b.rig = 'juksa';
  b.status = 'sailing'; b.port = null; b.v = VESSELS[t].vcruise || 8; const p = P(69.532, 17.926); b.pos = {x:p.x, y:p.y}; b.heading = 1.2;
  S.plan = {wps:[{x:b.pos.x + 9, y:b.pos.y, port:null, fish:0}], idx:0, speed:b.v, returning:false}; G3.setHelm(true); })"""

# the room over the one at the wheel: the lowest surface of the model over his place (and a hand's breadth round it), above his waist
# (the chair's seat behind him and the console and the wheel before him are lower)
ROOM = """((t) => { const G = geoOf(t), s = G.skipperAt, m = vesselModel(t); if (!s || !m) return null; const P = m.o.p; let best = 1e9;
  for (let o = 0; o < P.length; o += 9){ const ax = P[o], az = P[o + 2], bx = P[o + 3], bz = P[o + 5], cx = P[o + 6], cz = P[o + 8], d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-9) continue;
    for (const [dx, dz] of [[0, 0], [0.12, 0], [-0.12, 0], [0, 0.12]]){ const x = s[0] + dx, z = s[2] + dz;   // (not forward: the wheel)
      const l0 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l1 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, l2 = 1 - l0 - l1; if (l0 < 0 || l1 < 0 || l2 < 0) continue;
      const y = l0 * P[o + 1] + l1 * P[o + 4] + l2 * P[o + 7]; if (y > s[1] + 1.15 && y < best) best = y; } }
  return {room:best < 1e8 ? +(best - s[1]).toFixed(2) : null, eye:G.eye ? +(G.eye[1] - s[1]).toFixed(2) : null}; })"""


def dark(path):
    """the share of nearly black pixels in the middle of the picture (where the windows are), by day"""
    im = Image.open(path).convert('L'); w, h = im.size; px = list(im.crop((int(w * 0.15), int(h * 0.2), int(w * 0.85), int(h * 0.6))).getdata())
    return round(sum(1 for v in px if v < 30) / len(px), 2)


async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        types = only or await pg.evaluate("Object.keys(VESSELS).filter(t => geoOf(t) && geoOf(t).eye && !geoOf(t).hand)")
        rooms, darks = {}, {}
        for t in types:
            rooms[t] = await pg.evaluate(ROOM, t)
            n0 = await pg.evaluate("G3._debug.kitStat.n")
            await pg.evaluate(SET, t)
            await pg.wait_for_function("([t, n0]) => { const K = G3._debug.kitStat; return K.vt === t && K.n >= n0 + 4; }", arg=[t, n0], timeout=120000)
            await pg.wait_for_timeout(1000)
            f = os.path.join(OUT, f'bro_{t}.png'); await pg.screenshot(path=f); darks[t] = dark(f)
            print('·', t, rooms[t], 'mørk', darks[t], flush=True)
        await pg.evaluate("G3.setHelm(false)")
        # the one at the wheel stands (view3d.js drawDeckCrew, task 'helm'), about 1.8 m in his cap; where the helm is made for sitting (the
        # model's eye under 1.4 m over the place, the snekke's hard top) he sits on a seat at the eye's height less 0.95, and needs a metre over it
        need = lambda r: 1.8 if r['eye'] is None or r['eye'] >= 1.4 else max(0.2, r['eye'] - 0.95) + 1.0
        low = {t: r for t, r in rooms.items() if r and r['room'] is not None and r['room'] < need(r)}
        check(not low, 'den som står ved roret, har hodet under taket i styrhuset på hver båt', low)
        blind = {t: v for t, v in darks.items() if v > 0.55}   # (a lined wheelhouse's ceiling and frames are dark too: 0.1-0.5; a black view 0.8-0.9)
        check(not blind, 'bro-visningen ser ut av vinduene på hver båt (ikke svart)', blind)
        check(not errs, 'ingen sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
