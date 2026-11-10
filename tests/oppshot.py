"""The upgrades one can see on deck (OPP5 of docs/planer/oppgraderinger.md; tools/deck/oppgr.py, view3d/10-gear.js drawUpg, 3D): on
every coastal boat the line setter over the stern at her place (kit.setter), with the tub magazine from the second tier where her deck
has room, the net chute where it fits, and the gaff of her tier leaning at the rail by the hauler; «Prøv på båten» and the hoist take the
setter and the chute; the knife of her tier and the steel glove in the hands is read from what the frame drew.
Pictures opp_*.png in tests/out (landscape 1280x800 and portrait 800x1280). Prints OK or FEIL.
    KYST_OPP=plastsjark,sjark   only those boats"""
from _env import boot, OUT
import asyncio, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra != '' else ''), flush=True)


# the boat lying still at sea with what she has bought; the eye off her quarter, looking at the stern
SET = """((a) => { const [type, eq, rig, yaw, pitch, dist, at] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4);
  b.type = type; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris'; S.equip = Object.assign({}, eq); S.jobs = []; S.cargo = []; b.gop = null; S.plan = null; S.hold = [];
  S.pgear = newPGear(); b.rig = rig; b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600;
  const V = VESSELS[type], c = G3._debug.cam; c.helm = false; c.pitch = pitch; c.yaw = yaw; c.dist = dist || 4.2;
  // (the eye on the place over the stern, or on the gaff at the rail when at is 'gaff': cam.at, a point in the boat's frame)
  const P = (geoOf(type).kit || {}).setter; c.at = at === 'gaff' ? (G3._debug.kitStat.gaff || {}).at || null : P ? [P[0], P[1] + 0.15, P[2] - 0.35] : null; })"""


async def show(pg, t, eq, rig='juksa', yaw=-0.75, pitch=0.42, dist=None, at=None):
    n0 = await pg.evaluate("G3._debug.kitStat.n")
    await pg.evaluate(SET, [t, eq, rig, yaw, pitch, dist, at])
    await pg.wait_for_function("([t, n0]) => { const K = G3._debug.kitStat; return K.vt === t && K.n >= n0 + 4; }", arg=[t, n0], timeout=180000)
    return await pg.evaluate("(() => { const K = G3._debug.kitStat; return {stern:K.stern, gaff:K.gaff}; })()")


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        miss = await pg.evaluate("['kniv2', 'kniv3', 'hott2', 'hott3', 'setter', 'setter_mag', 'setter_ben', 'renne'].filter(n => !G3._debug.kitPart('upg', n))")
        check(not miss, 'alle delene i oppgraderingene fra Blender er med (deck-upg)', miss)
        boats = await pg.evaluate("Object.keys(VESSELS).filter(t => VESSELS[t].cls !== 'hav' && equipFits('linesetter', t))")
        if os.environ.get('KYST_OPP'): boats = [t for t in boats if t in os.environ['KYST_OPP'].split(',')]
        print('båter:', len(boats), boats, flush=True)
        for t in boats:
            place = await pg.evaluate("t => (geoOf(t).kit || {}).setter || null", t)
            if t == 'kyst15' and not place:
                # (her stern is the shelter deck's closed wall: the place comes with the opening in the stern, OB12)
                r = await show(pg, t, {'linehaler': True, 'linesetter': True, 'hott': 2}, 'line')
                check(r['stern'] is None and r['gaff'] and r['gaff']['lv'] == 2, t + ': ingen plass over hekken ennå (lukket hekk, OB12), så ingenting tegnes der; stålhøtten ved ripa', r)
                continue
            check(bool(place), t + ': har plassen over hekken (kit.setter)', place)
            if not place: continue
            mag_room = place[4] != 0
            # nothing bought: nothing over the stern, the gaff she has at the rail
            r = await show(pg, t, {})
            check(r['stern'] is None and r['gaff'] and r['gaff']['lv'] == 1, t + ': uten kjøp står ingenting over hekken, og høtten om bord står ved ripa', r)
            # the line setter with the long gaff
            r = await show(pg, t, {'linehaler': True, 'linesetter': True, 'hott': 3}, 'line')
            check(r['stern'] and r['stern']['k'] == 'linesetter' and not r['stern']['mag'] and r['gaff'] and r['gaff']['lv'] == 3, t + ': linesetteren over hekken og den lange høtten ved ripa', r)
            await pg.screenshot(path=os.path.join(OUT, 'opp_%s_setter.png' % t))
            # the second tier: the magazine where the deck has room
            r = await show(pg, t, {'linehaler': True, 'linesetter': True, 'linesetterLv': 2, 'hott': 2}, 'line')
            check(r['stern'] and r['stern']['k'] == 'linesetter' and r['stern']['mag'] == mag_room and r['gaff'] and r['gaff']['lv'] == 2,
                  t + (': stampemagasinet på trinn 2 og stålhøtten' if mag_room else ': trinn 2 uten magasin (ikke plass på dekket) og stålhøtten'), r)
            if mag_room:
                await show(pg, t, {'linehaler': True, 'linesetter': True, 'linesetterLv': 2, 'hott': 2}, 'line', yaw=2.45, pitch=0.62, dist=4.6)
                await pg.screenshot(path=os.path.join(OUT, 'opp_%s_mag.png' % t))
            await show(pg, t, {'linehaler': True, 'linesetter': True, 'linesetterLv': 2, 'hott': 2}, 'line', yaw=-1.9 if (r['gaff'] or {'at': [1]})['at'][0] > 0 else 1.9, pitch=0.5, dist=3.2, at='gaff')
            await pg.screenshot(path=os.path.join(OUT, 'opp_%s_hott.png' % t))
            # the net chute, where it fits; rigged for nets she has the chute, rigged for line the setter
            if await pg.evaluate("t => equipFits('garnrenne', t)", t):
                both = {'linehaler': True, 'linesetter': True, 'linesetterLv': 2, 'garnhaler': True, 'garnrenne': True}
                r = await show(pg, t, both, 'garn')
                check(r['stern'] and r['stern']['k'] == 'garnrenne', t + ': garnrenna over hekken når hun er rigget for garn', r)
                await pg.screenshot(path=os.path.join(OUT, 'opp_%s_renne.png' % t))
                r = await show(pg, t, both, 'line')
                check(r['stern'] and r['stern']['k'] == 'linesetter', t + ': linesetteren når hun er rigget for line og har begge', r)
            else:
                r = await show(pg, t, {'garnhaler': True, 'garnrenne': True}, 'garn')
                check(r['stern'] is None, t + ': garnrenna passer ikke og tegnes ikke', r)
        # the knife of her tier and the steel glove in the hands at the gutting table, and the fish lost over the rail meeting the sea
        # with a splash (14-crewlife.js crewSlip through hooks.onCrewFx 'slip'); on one decked boat with a crew
        t = 'plastsjark'
        if t in boats:
            async def gut(lv):
                await show(pg, t, {'kniv': lv} if lv > 1 else {})
                await pg.evaluate("""(() => { const b = S.boat; S.settings.gut = true; S.settings.ice = true; S.me = S.cur; S.rest = null; S.meal = null; b.ice = 300;
                  S.crew = [genCrew(), genCrew()].map(c => Object.assign(c, {bi:false, off:false, fatigue:5, morale:70, job:null, traits:[]}));
                  addCatch('torsk', tubCap(), null, true); b.deckStop = true; b.deckEnd = S.t + 60; S.mult = 1; CREW3D.reset();
                  const G = geoOf(b.type), W = G.work, c = G3._debug.cam; c.at = W ? [W.table[0], G.deck.y + 1.0, W.table[2]] : null; c.dist = 3.4; c.yaw = W && W.table[0] < 0 ? 1.9 : -1.9; c.pitch = 0.35; })()""")
                try: await pg.wait_for_function("CREW3D.agents().some(a => a.mode === 'at' && a.task === 'gut')", timeout=240000)
                except Exception: pass
                n0 = await pg.evaluate("G3._debug.dk.n.glove || 0"); k0 = await pg.evaluate("G3._debug.kitStat.n")
                try: await pg.wait_for_function("k0 => G3._debug.kitStat.n >= k0 + 6", arg=k0, timeout=240000)
                except Exception: pass
                return await pg.evaluate("n0 => ({glove:(G3._debug.dk.n.glove || 0) - n0, gut:CREW3D.agents().filter(a => a.task === 'gut').length, lv:equipLv('kniv'), part:!!G3._debug.kitPart('upg', 'kniv' + equipLv('kniv'))})", n0)
            g1 = await gut(1)
            check(g1['gut'] > 0 and g1['glove'] == 0 and g1['lv'] == 1, t + ': med knivene om bord sløyes det uten stålhanske', g1)
            g3 = await gut(3)
            check(g3['gut'] > 0 and g3['glove'] > 0 and g3['lv'] == 3 and g3['part'], t + ': på trinn 3 sløyes det med kniven i ett stykke og stålhanske på den andre handa', g3)
            await pg.screenshot(path=os.path.join(OUT, 'opp_%s_kniv3.png' % t))
            # a fish over the rail: the hand's moment on deck, and the splash where it meets the sea
            s0 = await pg.evaluate("G3._debug.dk.n.splash || 0")
            took = False
            for _ in range(40):
                took = await pg.evaluate("(() => { for (const c of S.crew) if (hooks.onCrewFx(c, 'slip', {sp:'torsk', kg:3.2})) return true; return false; })()")
                if took: break
                await pg.wait_for_timeout(3000)
            try: await pg.wait_for_function("s0 => (G3._debug.dk.n.splash || 0) > s0", arg=s0, timeout=240000)
            except Exception: pass
            sp = await pg.evaluate("s0 => ({splash:(G3._debug.dk.n.splash || 0) - s0, slip:G3._debug.dk.n.slip || 0})", s0)
            check(took and sp['splash'] == 1 and sp['slip'] >= 1, t + ': fisken som glipper over ripa, treffer sjøen med et plask', [took, sp])
        check(not errs, 'ingen sidefeil', errs)
        await br.close()

asyncio.run(main())
