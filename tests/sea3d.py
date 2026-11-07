from _env import GAME, GAME_TUT, boot
# The sea in 3D (view3d.js): the local sea from the sea-state textures, smooth through every change of wind and place, whitecaps as
# Monahan and O'Muircheartaigh (1980) give them, calm in the lee, spindrift and haze in a storm, and the same without vertex textures.
# Pictures: sea3d_bf.png (Beaufort 0-11 on the Husøy ground), sea3d_lee.png (windward, lee, harbour and sound in a gale) and
# sea3d_wake.png (the wake of a planing skiff, a sjark and a 21 m coaster at speed).
import asyncio, json, os, sys, time
# each check is printed as soon as its part is done, line by line (07.11.2026, F3: on a slow machine the run passed run.py's
# 3000 s in the wake pictures, and every check line, printed at the end, was lost)
sys.stdout.reconfigure(line_buffering=True)
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

ok = lambda c: 'OK  ' if c else 'FEIL'
T0 = time.time()
stage = lambda s: print('· %4.0f s  %s' % (time.time() - T0, s), flush=True)   # progress, so a run that runs out of time shows where it was
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
BF = [(0, 0.2), (1, 1.0), (2, 2.5), (3, 4.4), (4, 6.7), (5, 9.4), (6, 12.3), (7, 15.5), (8, 19), (9, 22.6), (10, 26.5), (11, 30.6)]
SETUP = "S.t = Math.round((Date.UTC(2027, 3, 10, 13) - EPOCH) / 6e4); WX_FORCE = {w:5, d:315}; S.mult = 0.00001; const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0; b.heading = 2.2;"
# the wave amplitudes at the boat, as the shaders make them from the textures and uniforms
AMPS = """(() => { const D = G3._debug, WV = D.WV, S = D.ssAt(D.bv.x, D.bv.z), ren = 1 / Math.sqrt(Math.max(1 - 2 * S[2] * (1 - S[2]) * (1 - WV.dot), 0.05));
  return WV.list.map(c => c.swell ? S[1] * c.wo : S[0] * (S[2] * c.wo + (1 - S[2]) * c.wy) * ren); })()"""
# the share of the sea above the whitecap threshold, from the shader's own formula (FOAM.capAt in 14-sea.js, the same as WCAPS in
# 01-shaders.js since F3: the compression of the surface 1 - J, the crest and the grain), sampled on a grid round the boat. The
# breaking crests are the share WCAP.k of Monahan's cover (capK), so share is the crests' share over that, for Monahan's; the rest is
# the foam the crests leave in the map, which the drawn share (foamRendered) has too
FOAM = """async (U) => {
  WX_FORCE = {w:U, d:315}; G3._debug.WV.init = false; await new Promise(r => setTimeout(r, 2500));
  const D = G3._debug, t = 37.3; let hit = 0, n = 0, jlo = 0;
  for (const [ox, oz] of [[0, 0], [400, 0], [0, 400], [-400, -400]]) for (let j = 0; j < 150; j++) for (let i = 0; i < 150; i++){
    const x = D.bv.x + ox + (i - 75) * 1.9 + 0.37 * j, z = D.bv.z + oz + (j - 75) * 1.9, F = D.foam.capAt(x, z, t, 1, U);
    if (F.fv > F.th){ hit++; if (F.J < 0.5) jlo++; } n++; }
  const kk = D.foam.capK || 1;
  return {U, share:+(hit / n * 100 / kk).toFixed(2), crests:+(hit / n * 100).toFixed(2), jUnderHalf:+(jlo / Math.max(1, hit) * 100).toFixed(1), monahan:+(3.84e-4 * Math.pow(U, 3.41)).toFixed(2)};
}"""

async def sheet(tiles, path, cols):
    ims = [Image.open(f).convert('RGB').resize((400, 250)) for f, _ in tiles]; rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (cols * 400, rows * 250), 'white')
    for i, (im, (_, lab)) in enumerate(zip(ims, tiles)):
        d = ImageDraw.Draw(im); d.rectangle([0, 0, 400, 24], fill=(0, 0, 0)); d.text((8, 3), lab, font=FONT, fill='white'); sh.paste(im, ((i % cols) * 400, (i // cols) * 250))
    sh.save(path)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 500})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SETUP)
        # (600 s: under SwiftShader the wide sea field's two sectors took 225 s before H1b R2 and up to about 450 s after, the rays now
        # running on over the wide frame; fetchAt itself costs the same warm, about 25 % more in the 3D page, 04.11.2026)
        # (07.11.2026, F3: over 600 s on the working branch; the sea state is worked a slice a frame, so the frames are made cheap meanwhile
        # with a small window, and it came up in 235 s)
        await pg.set_viewport_size({'width': 320, 'height': 200})
        await pg.wait_for_function("G3.isActive() && G3._debug.SSL.w.on && G3._debug.SSL.n.on", timeout=900000)
        await pg.set_viewport_size({'width': 800, 'height': 500}); await pg.wait_for_timeout(3000)
        stage('the sea is up'); R = {}
        calm = await pg.evaluate("({drift:G3._debug.drift, fog:G3._debug.env.fogD})")   # 5 m/s since the start: no spindrift, no haze
        # 1. the wind from calm to hurricane in steps of 0.1 m/s, the waves snapped to each: no wave may jump
        R['ramp'] = await pg.evaluate("""(() => { const D = G3._debug, H = S.t / 60; let prev = null, jump = 0, hjump = 0, at = 0;
          for (let U = 0.3; U <= 34; U += 0.1){ WX_FORCE = {w:U, d:315}; D.WV.init = false; D.waves(1 / 30, H); const a = """ + AMPS + """, hsq = Math.sqrt(8 * a.reduce((x, y) => x + y * y, 0));
            if (prev){ const j = Math.max(...a.map((v, i) => Math.abs(v - prev.a[i]))); if (j > jump){ jump = j; at = U; } hjump = Math.max(hjump, Math.abs(hsq - prev.h)); } prev = {a, h:hsq}; }
          return {maxWave:+jump.toFixed(4), at:+at.toFixed(1), maxHs:+hjump.toFixed(4)}; })()""")
        # 2. a sudden change from 5 to 25 m/s: the sea follows over seconds, a frame at a time
        R['sudden'] = await pg.evaluate("""(() => { const D = G3._debug, H = S.t / 60; WX_FORCE = {w:5, d:315}; D.WV.init = false; D.waves(1 / 30, H); WX_FORCE = {w:25, d:200};
          let pw = D.WV.W, ph = Math.sqrt(8 * """ + AMPS + """.reduce((x, y) => x + y * y, 0)), dW = 0, dH = 0, dD = 0, pd = D.WV.dir;
          for (let i = 0; i < 300; i++){ D.waves(1 / 30, H); const h = Math.sqrt(8 * """ + AMPS + """.reduce((x, y) => x + y * y, 0)); dW = Math.max(dW, Math.abs(D.WV.W - pw)); dH = Math.max(dH, Math.abs(h - ph)); dD = Math.max(dD, Math.abs(D.WV.dir - pd)); pw = D.WV.W; ph = h; pd = D.WV.dir; }
          return {perFrameWind:+dW.toFixed(3), perFrameHs:+dH.toFixed(3), perFrameDirDeg:+(dD * 180 / Math.PI).toFixed(3), reached:+D.WV.W.toFixed(1)}; })()""")
        # 3. sailing 3 km: the near map is rebuilt on the way, and the sea at a fixed spot must not jump meanwhile
        await pg.evaluate("WX_FORCE = {w:12, d:200}; G3._debug.WV.init = false; window.__P = {x:G3._debug.bv.x, z:G3._debug.bv.z}; window.__x0 = G3._debug.NEARM.x0;")
        # the sea-state map is worked out a slice per frame: wait till the forced wind's map stands still (under load it takes more than 2 s)
        # (with SwiftShader a frame can take more than the half second between two looks, so the values only count as still when frames
        # have passed between them and neither map has a sector left to work out; it once broke off before the new wind's map was in)
        await pg.evaluate("window.__sf = 0; (function L(){ window.__sf++; requestAnimationFrame(L); })()")
        prev = None
        for _ in range(120):
            await pg.wait_for_timeout(500); s = await pg.evaluate("(() => { const D = G3._debug, s = D.ssAt(__P.x, __P.z); return [s[0], s[1], window.__sf, !D.SSL.n.job && !D.SSL.w.job]; })()")
            if prev and abs(s[0] - prev[0]) + abs(s[1] - prev[1]) < 1e-4 and s[2] - prev[2] >= 3 and s[3] and prev[3]: break
            if not prev or s[2] - prev[2] >= 3: prev = s
        trace = []
        for k in range(40):
            await pg.evaluate(f"(() => {{ const g = GROUNDS[0].p; S.boat.pos = {{x:g.x + {k} * 0.075, y:g.y}}; }})()"); await pg.wait_for_timeout(450)
            trace.append(await pg.evaluate("(() => { const D = G3._debug, s = D.ssAt(__P.x, __P.z); return [D.SSL.n.on, +s[0].toFixed(3), +s[1].toFixed(3), D.NEARM.x0]; })()"))
        moved = len(set(t[3] for t in trace)) > 1
        jumps = [abs(trace[i][1] - trace[i - 1][1]) + abs(trace[i][2] - trace[i - 1][2]) for i in range(1, len(trace))]
        R['rebuild'] = {'nearMoved': moved, 'alwaysNear': all(t[0] for t in trace), 'maxStep': round(max(jumps), 3), 'at': trace[0][1:3]}
        await pg.evaluate("(() => { const g = GROUNDS[0].p; S.boat.pos = {x:g.x, y:g.y}; })()"); await pg.wait_for_timeout(3000)
        stage('ramp, sudden wind and rebuild done')
        # 4. whitecaps: the share above the shader's threshold against Monahan, and the rendered foam in a gale and a storm
        R['foam'] = [await pg.evaluate(FOAM, U) for U in [8, 12, 17, 25]]
        await pg.evaluate("(()=>{const c = G3._debug.cam; c.helm = false; c.dist = 150; c.pitch = 1.3; c.yaw = 0; G3._debug.seaDbg = true; })()")
        rend = []
        for U in [21, 30]:
            await pg.evaluate(f"WX_FORCE = {{w:{U}, d:315}}; G3._debug.WV.init = false;"); await pg.wait_for_timeout(2500); fr = []
            for k in range(4):   # four headings, so four patches of sea
                await pg.evaluate(f"G3._debug.cam.yaw = {k} * 1.5708"); await pg.wait_for_timeout(1500)
                await pg.screenshot(path='sea3d_foam.png', clip={'x': 300, 'y': 10, 'width': 480, 'height': 150})
                h = Image.open('sea3d_foam.png').convert('L').histogram(); fr.append(sum(h[128:]) / sum(h))
            rend.append({'U': U, 'share': round(sum(fr) / 4 * 100, 2), 'monahan': round(3.84e-4 * U ** 3.41, 2)})
        R['foamRendered'] = rend
        await pg.evaluate("G3._debug.seaDbg = false;")
        stage('foam done')
        print(ok(R['ramp']['maxWave'] < 0.05 and R['ramp']['maxHs'] < 0.08), 'from calm to hurricane in steps of 0.1 m/s no wave changes by more than 5 cm, and the height by less than 8 cm: no jumps between the Beaufort forces')
        print(ok(R['sudden']['perFrameWind'] < 0.2 and R['sudden']['perFrameHs'] < 0.08 and R['sudden']['perFrameDirDeg'] < 0.5 and R['sudden']['reached'] > 23), 'a sudden change of wind (5 to 25 m/s, SW to S) reaches the sea over some seconds, a little each frame')
        print(ok(R['rebuild']['nearMoved'] and R['rebuild']['alwaysNear'] and R['rebuild']['maxStep'] < 0.05), 'sailing 3 km the near sea map is rebuilt, and the sea at a fixed spot does not jump meanwhile')
        print(ok(all(0.5 <= f['share'] / f['monahan'] <= 2 for f in R['foam'])), 'the whitecap threshold gives Monahan\'s cover within a factor of two (8-25 m/s)')
        print(ok(all(0.5 <= f['share'] / f['monahan'] <= 2 for f in R['foamRendered'])), 'and so does the drawn foam in a strong gale and a storm')
        # 5. spindrift from a gale, haze from a strong gale
        await pg.evaluate("(()=>{const c = G3._debug.cam; c.dist = 34; c.pitch = 0.2; c.yaw = 2.6; })()")
        await pg.evaluate("WX_FORCE = {w:28, d:315}; G3._debug.WV.init = false;"); await pg.wait_for_timeout(3000)
        storm = await pg.evaluate("({drift:G3._debug.drift, fog:G3._debug.env.fogD})")
        R['air'] = {'calm': calm, 'storm': storm}
        print(ok(storm['drift'] > 60 and calm['drift'] == 0 and storm['fog'] > calm['fog'] * 1.5), 'spindrift flies in a storm and not in a fresh breeze, and the spray hazes the view')
        # 6. pictures: every Beaufort force, then windward, lee, harbour and sound in a gale
        tiles = []
        for n, U in BF:
            await pg.evaluate(f"WX_FORCE = {{w:{U}, d:315}}; G3._debug.WV.init = false;"); await pg.wait_for_timeout(3000)
            f = f'sea3d_bf{n}.png'; await pg.screenshot(path=f); tiles.append((f, f'Beaufort {n} · {U} m/s'))
        await sheet(tiles, 'sea3d_bf.png', 3); stage('Beaufort pictures done')
        tiles, lee = [], {}
        for key, name, setup in [('wind', 'Husøy-feltet, NV 17 m/s', "const g = GROUNDS[0].p; S.boat.pos = {x:g.x, y:g.y};"), ('lee', 'Husøy-feltet, S 17 m/s', "const g = GROUNDS[0].p; S.boat.pos = {x:g.x, y:g.y}; WX_FORCE.d = 180;"),
                                 ('harbour', 'Ved Botnhamn, NV 17 m/s', "S.boat.pos = LG(53.30, 23.20);"), ('sound', 'Gisundet, NV 17 m/s', "S.boat.pos = LG(57.25, 44.35);")]:
            kb = await pg.evaluate("G3._debug.SSL.n.k.join()")
            await pg.evaluate("WX_FORCE = {w:17, d:315}; " + setup + " G3._debug.WV.init = false;")
            # (the boat does not move between the windward and the lee picture, so wait for the fetch of the new wind's sectors too: both
            # textures done and showing the same sectors, and for the lee other sectors than before; 04.11.2026, the rays now run on over
            # the wide frame and a fixed 5 s was too short under SwiftShader)
            await pg.wait_for_function("G3._debug.SSL.n.on && Math.abs(G3._debug.bv.x / 1000 - S.boat.pos.x) < 0.05", timeout=180000); await pg.wait_for_timeout(1500)
            await pg.wait_for_function("(([kb, lee]) => { const N = G3._debug.SSL.n, W = G3._debug.SSL.w; return !N.job && !W.job && !N.fresh && N.k.join() === W.k.join() && (!lee || N.k.join() !== kb); })", arg=[kb, key == 'lee'], timeout=600000); await pg.wait_for_timeout(3000)
            s = await pg.evaluate("(()=>{ const D = G3._debug; return D.ssAt(D.bv.x, D.bv.z).map(v => +v.toFixed(2)); })()"); lee[key] = s
            f = f'sea3d_{key}.png'; await pg.screenshot(path=f); tiles.append((f, f'{name} · vindsjø {s[0]:.1f} m, dønning {s[1]:.1f} m'))
        await sheet(tiles, 'sea3d_lee.png', 2); stage('lee pictures done')
        R['lee'] = lee
        L = R['lee']
        print(ok(L['wind'][0] > 4 and L['lee'][0] < 0.3 * L['wind'][0] and L['harbour'][0] < 0.2 * L['wind'][0] and L['harbour'][1] < 0.3), 'in a gale from NW the ground off Husøy has the full sea, the lee from the south a fraction, the harbour almost none')
        # 8. the boat's own waves at speed: a planing skiff, a sjark near hull speed and a 21 m coaster, on a calm sea, seen from astern
        tiles, wake = [], {}
        for vt, kn in [('skiff', 18), ('sjark', 8.5), ('kyst21', 10)]:
            await pg.evaluate(f"""(() => {{ WX_FORCE = {{w:3, d:315}}; S.mult = 1; const b = S.boat, g = GROUNDS[0].p; b.type = '{vt}'; applyVessel(); G3.vesselChanged();
              b.pos = {{x:g.x, y:g.y}}; b.heading = 0; S.plan = {{wps:[{{x:g.x, y:g.y - 6, port:null, fish:0}}], idx:0, speed:{kn}, returning:false}}; b.status = 'sailing'; b.port = null; b.v = {kn};
              const D = G3._debug; D.bv.init = false; D.WV.init = false; const c = D.cam; c.helm = false; c.dist = 46; c.pitch = 0.42; c.yaw = 0; }})()""")
            await pg.wait_for_timeout(9000)
            wake[vt] = await pg.evaluate("""(() => { const D = G3._debug, K = D.WK, bv = D.bv, fx = Math.sin(bv.head), fz = -Math.cos(bv.head), L = K.u2[0];
              const lam = 2 * Math.PI / K.u1[0]; return {kn:+K.kn.toFixed(2), Fr:+K.Fr.toFixed(2), on:K.u3[3], A:+K.u1[1].toFixed(2), trans:+K.u1[2].toFixed(2), bow:+K.u2[1].toFixed(2), lam:+lam.toFixed(1), reach:Math.round(K.u1[3]), trail:D.TRAIL.length}; })()""")
            f = f'sea3d_wake_{vt}.png'; await pg.screenshot(path=f); tiles.append((f, f'{vt} {kn} kn · Fr {wake[vt]["Fr"]} · bølgelengde {wake[vt]["lam"]} m'))
        await sheet(tiles, 'sea3d_wake.png', 3); stage('wake pictures done')
        R['wake'] = wake
        W = R['wake']
        print(ok(all(W[k]['on'] == 1 for k in W) and W['skiff']['trans'] < 0.1 and W['sjark']['trans'] > 0.9 and W['kyst21']['trans'] > 0.9), 'a planing skiff leaves divergent waves only; the displacement hulls also the transverse waves behind the stern')
        print(ok(all(abs(W[k]['lam'] - 2 * 3.14159 * (W[k]['kn'] * 0.5144) ** 2 / 9.81) < 0.3 for k in W) and abs(W['sjark']['kn'] - 8.5) < 1 and 0.2 < W['sjark']['A'] < 0.6 and 0.05 < W['skiff']['A'] < 0.3), 'the wake waves are 2 pi v^2 / g long, highest near hull speed and lower for the planing skiff')
        await pg.evaluate("(() => { S.mult = 0.00001; const b = S.boat; b.type = 'skiff'; applyVessel(); G3.vesselChanged(); b.status = 'idle'; S.plan = null; b.v = 0; })()")
        # 9. the hull's motions (03c-stability.js): a skiff and a 21 m coaster lying beam-on in the same sea, 40 s of motion each, and then
        # let go from 7 degrees of heel in the calm of Finnsnes: the free roll swings at the hull's own period (the forced roll in a
        # sea follows the waves, so its period says little about the hull)
        R['motion'] = await pg.evaluate("""(() => { const D = G3._debug, out = {}; S.mult = 0.00001;
          const zc = rec => { const m = rec.reduce((a, v) => a + v, 0) / rec.length; let z = 0; for (let i = 1; i < rec.length; i++) if ((rec[i - 1] - m) * (rec[i] - m) < 0) z++; return {m, z}; };
          for (const vt of ['skiff', 'kyst21']){ const b = S.boat, g = GROUNDS[0].p; b.type = vt; applyVessel(); G3.vesselChanged(); b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0; S.plan = null; b.v = 0;
            WX_FORCE = {w:9, d:270}; D.bv.init = false; D.WV.init = false; const rec = []; let t = 100;
            for (let i = 0; i < 1500; i++){ t += 1 / 30; D.waves(1 / 30, S.t / 60); D.stepBoat(1 / 30, t, 0); if (i > 300) rec.push(D.bv.roll); }
            const q = zc(rec), rms = Math.sqrt(rec.reduce((a, v) => a + (v - q.m) ** 2, 0) / rec.length);
            const fp = PORTS[0].p; b.pos = {x:fp.x, y:fp.y}; WX_FORCE = {w:0.3, d:270}; D.bv.init = false; D.WV.init = false; t = 300;
            for (let i = 0; i < 60; i++){ t += 1 / 30; D.waves(1 / 30, S.t / 60); D.stepBoat(1 / 30, t, 0); }
            D.bv.roll = 0.12; D.bv.vr = 0; const fr = [];
            for (let i = 0; i < 600; i++){ t += 1 / 30; D.waves(1 / 30, S.t / 60); D.stepBoat(1 / 30, t, 0); fr.push(D.bv.roll); }
            const f = zc(fr);
            out[vt] = {rmsDeg:Math.round(rms * 1800 / Math.PI) / 10, free:Math.round(2 * fr.length / 30 / Math.max(1, f.z) * 10) / 10, Tr:Math.round(stabOf(vt).Tr * 10) / 10, ok:rec.every(Number.isFinite) && fr.every(Number.isFinite)}; }
          WX_FORCE = null; const b = S.boat; b.type = 'skiff'; applyVessel(); G3.vesselChanged(); return out; })()""")
        stage('motion done')
        Mo = R['motion']
        print(ok(Mo['skiff']['ok'] and Mo['kyst21']['ok'] and Mo['kyst21']['rmsDeg'] > 0.1 and all(abs(Mo[v]['free'] / Mo[v]['Tr'] - 1) < 0.25 for v in Mo) and Mo['kyst21']['free'] > 2 * Mo['skiff']['free']), 'in 3D the hull rolls as an oscillator: let go from a heel each swings at its own roll period, the 21 m coaster much slower than the skiff')
        await pg.close()   # the first page is done; left open it keeps drawing 3D and starves the second page's sea-state work in a slow browser
        # 7. a GPU with no textures in the vertex shader: the same page, the waves from the values at the boat
        pg2 = await b.new_page(viewport={'width': 640, 'height': 400}); errs2 = []; pg2.on('pageerror', lambda e: errs2.append(str(e)))
        await boot(pg2, GAME_TUT + '#notut,novtf'); await pg2.evaluate(SETUP)
        await pg2.wait_for_function("G3.isActive() && G3._debug.SSL.w.on", timeout=300000); await pg2.wait_for_timeout(2000)
        R['novtf'] = await pg2.evaluate("({vtf:G3._debug.sstVS, y:+G3._debug.seaH(G3._debug.bv.x, G3._debug.bv.z, 3).toFixed(3)})"); R['novtfErrors'] = errs2[:3]
        await pg2.close()
        # 8. the lighter seas a device steps down to when its driver lost the context making the full one (#sealvl, as dsb_sea): 1 the far
        # pass's sea for both passes, 2 the flat basic sea; both draw with no GL errors (pictures sea_lvl1.png, sea_lvl2.png)
        R['lvl'] = {}
        for lv in (1, 2):
            pl = await b.new_page(viewport={'width': 640, 'height': 400}); el = []; pl.on('pageerror', lambda e: el.append(str(e)))
            await boot(pl, GAME_TUT + '#notut,sealvl=%d' % lv); await pl.evaluate(SETUP)
            await pl.wait_for_function("G3.isActive()", timeout=300000); await pl.wait_for_timeout(2500)
            R['lvl'][lv] = await pl.evaluate("({lvl:G3._debug.seaLvl, basic:G3._debug.seaBasic, one:G3._debug.seaOne, gl:G3._debug.glErr(), fps:G3._debug.fps > 0})"); R['lvl'][lv]['errs'] = el[:2]
            await pl.screenshot(path='sea_lvl%d.png' % lv); await pl.close()
        # the lite sea (#sealite): the four longest wind waves and the swell in the geometry, the last try before the flat sea (sea_lite.png)
        pl = await b.new_page(viewport={'width': 640, 'height': 400}); el = []; pl.on('pageerror', lambda e: el.append(str(e)))
        await boot(pl, GAME_TUT + '#notut,sealite'); await pl.evaluate(SETUP)
        await pl.wait_for_function("G3.isActive()", timeout=300000); await pl.wait_for_timeout(2500)
        R['lite'] = await pl.evaluate("({lite:G3._debug.seaLite, basic:G3._debug.seaBasic, one:G3._debug.seaOne, gl:G3._debug.glErr(), fps:G3._debug.fps > 0})"); R['lite']['errs'] = el[:2]
        await pl.screenshot(path='sea_lite.png'); await pl.close()
        # the middle sea on level 1 (#seamid, tilbakemelding #106): the lite vertex shader with the full fragment shader, its own far pass,
        # drawn with no GL errors (sea_mid.png)
        pl = await b.new_page(viewport={'width': 640, 'height': 400}); el = []; pl.on('pageerror', lambda e: el.append(str(e)))
        await boot(pl, GAME_TUT + '#notut,seamid'); await pl.evaluate(SETUP)
        await pl.wait_for_function("G3.isActive()", timeout=300000); await pl.wait_for_timeout(2500)
        R['mid'] = await pl.evaluate("({lvl:G3._debug.seaLvl, mid:G3._debug.seaMid, lite:G3._debug.seaLite, basic:G3._debug.seaBasic, one:G3._debug.seaOne, gl:G3._debug.glErr(), fps:G3._debug.fps > 0})"); R['mid']['errs'] = el[:2]
        await pl.screenshot(path='sea_mid.png'); await pl.close()
        print(json.dumps(R, ensure_ascii=False))
        print(ok(R['novtf']['vtf'] is False and not R['novtfErrors']), 'without textures in the vertex shader (#novtf) the sea is drawn from the values at the boat, with no errors')
        V = R['lvl']
        M = R['mid']; print(ok(M['lvl'] == 1 and M['mid'] and M['lite'] and not M['one'] and not M['basic'] and M['gl'] == 0 and M['fps'] and not M['errs']), 'the middle sea on level 1 (the lite vertex shader, the full fragment shader and its own far pass) is drawn with no GL errors', M)
        T = R['lite']; print(ok(T['lite'] and T['one'] and not T['basic'] and T['gl'] == 0 and T['fps'] and not T['errs']), 'the lite sea, the last try before the flat sea, is drawn with no GL errors', T)
        print(ok(V[1]['lvl'] == 1 and V[1]['one'] and not V[1]['basic'] and V[2]['lvl'] == 2 and V[2]['basic'] and all(V[k]['gl'] == 0 and V[k]['fps'] and not V[k]['errs'] for k in V)), 'a device that lost the context on the full sea steps down: the simpler sea for both passes, then the flat sea, both drawn with no GL errors', V)
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
