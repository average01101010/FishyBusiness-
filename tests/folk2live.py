"""The people in the white room, a session that stays open (steg 125; Jonas 14.11.2026: «Bygg de fire små nå»). The game is started
once, with the new people in the white room (G3._debug.studio) and the eye on one man alone (G3._debug.camOn); pictures of a pose at
a moment that is asked for, and numbers changed while it runs, then take seconds instead of minutes. Not in run.py.

  python3 tests/folk2live.py serve &          build (stops if the build fails), start the game, wait for orders (two hours at most)
  python3 tests/folk2live.py shot kaffe-slurk royk-trekk coffee:1.2 ...     pictures: a moment's name (MOMENT) or task:t
        [--who 0] [--face 0.5] [--dist 2.6] [--pitch 0.1] [--alle] [--scene pause|arbeid|garn]    and one sheet of them all
  python3 tests/folk2live.py js "HOLDT.cup.tip = 0.9"      a number changed in the running game (HOLDT, LEMMER, SJOBEIN are the page's own)
  python3 tests/folk2live.py maal pack:0:2.6:27 gutw ...     a pose swept over its round (task[:t0:t1:n], 0 to 6 s in 25 steps when not
        said), measured without a picture (seconds): how far each hand was moved from its point (the arm short of it or pushed out of the body; cm, [right, left],
        and when), how far a hand that was not moved is from its grip (bom), and every thing more than 1 cm
        inside a body (G3._debug.thingClip) with the moment it was worst. [--roll 8]: the deck heeled. [--scene arbeid --spill]: nobody is put in the pose, the ones
        who have that work are measured at their own places (the gutter at his table).
  python3 tests/folk2live.py ledd pack:0.4 ...     the arms' joints at a moment, in his own frame [ahead, up, to his right] (m)
  python3 tests/folk2live.py reload           build again and load the page again (after a change in src/)
  python3 tests/folk2live.py quit

The pictures are tests/out/live/<name>.png and tests/out/live/ark.jpg (the sheet, in the order asked for)."""
import asyncio, json, os, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
LIVE = os.path.join(HERE, 'out', 'live'); CMD = os.path.join(LIVE, 'cmd.json'); RES = os.path.join(LIVE, 'res.json')
# a pose at a moment of its round: [task, t] (t is the man's own clock, view3d/08-plants.js tOf; SJOBEIN.test.t)
MOMENT = {'kaffe-slurk': ['coffee', 3.14], 'kaffe-paa-vei': ['coffee', 2.5], 'kaffe-nede': ['coffee', 0.0], 'royk-trekk': ['smoke', 1.96], 'royk-nede': ['smoke', 0.0],
          'mat-bit': ['lunch', 2.86], 'snus-leppa': ['snus', 8.16], 'snus-boks': ['snus', 4.0], 'kulde-blaas': ['cold', 6.4], 'kulde-slaa': ['cold', 1.5], 'kulde-gni': ['cold', 4.5],
          'kost-fram': ['sweep', 0.714], 'kost-bak': ['sweep', 2.142], 'juksa-napp': ['jig', 0.604], 'juksa-nede': ['jig', 0.0], 'kasse-nede': ['stack', 3.366], 'kasse-oppe': ['stack', 1.122],
          'spade-is': ['pack', 0.4], 'spade-sving': ['pack', 1.1], 'spade-tipp': ['pack', 1.7], 'is-sving': ['ice', 1.1], 'kikkert': ['binoc', 0.0], 'baering': ['carry', 0.0], 'senking': ['stow', 0.0],
          'hotte': ['gaff', 0.0], 'mobil': ['phone', 0.0], 'lene': ['lean', 0.0], 'kors': ['back', 0.0], 'sitte': ['sit', 0.0], 'prat': ['chat', 1.4], 'bryne': ['knife', 0.3], 'boting': ['mend', 0.5],
          'kveil': ['coil', 0.5], 'egning': ['egn', 1.0], 'spyling': ['hose', 0.0], 'sloying-hent': ['gutw', 0.4], 'sloying-snitt': ['gutw', 2.2], 'sloying-slo': ['gutw', 3.2], 'sloying-kast': ['gutw', 4.6]}


# a pose swept over its round and measured where it stands (LEMMER.redraw draws nothing): the hands from their grips, and things in bodies
MAAL = """([SW, spill, roll]) => { const out = {};
  for (const [task, t0, t1, n] of SW){ const C = {}, d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); let ao = [0, 0], at = [0, 0], ms = 0, cnt = 0;
    for (let k = 0; k < n; k++){ const t = t0 + (t1 - t0) * k / Math.max(1, n - 1); SJOBEIN.test = spill ? {roll, pitch:0, T:103.1, t} : {roll, pitch:0, T:103.1, task, t}; LEMMER.log = []; LEMMER.things = []; LEMMER.bodies = []; LEMMER.redraw();
      for (const q of LEMMER.log) if (q.task === task && q.gp){ cnt++; for (const i of [0, 1]){ if (q.ao[i] > ao[i]){ ao[i] = q.ao[i]; at[i] = +t.toFixed(2); } if (q.ao[i] <= 1e-4) ms = Math.max(ms, d3(q.gp[i], q.tg[i])); } }
      for (const o of G3._debug.thingClip(0.01)){ if (o.task !== task) continue; const k3 = (o.own ? 'egen' : 'annens') + '|' + o.name + '|' + o.part, c = C[k3]; if (!c || o.cm > c[0]) C[k3] = [o.cm, +t.toFixed(2)]; } }
    out[task] = {n:cnt, flyttet_cm:ao.map(v => +(v * 100).toFixed(1)), da:at, bom_cm:+(ms * 100).toFixed(1), ting:C}; }
  SJOBEIN.test = null; LEMMER.log = null; LEMMER.things = null; LEMMER.bodies = null; return out; }"""
LEDD = """(MOMS) => { const out = {};
  for (const [task, t] of MOMS){ SJOBEIN.test = {roll:0, pitch:0, T:103.1, task, t}; LEMMER.log = []; LEMMER.redraw(); const q = LEMMER.log.filter(e => e.task === task && e.wr).pop(); LEMMER.log = null; if (!q){ out[task + ':' + t] = null; continue; }
    const F = [Math.sin(q.h), -Math.cos(q.h)], R = [Math.cos(q.h), Math.sin(q.h)], b = p => { const x = p[0] - q.at[0], y = p[1] - q.at[1], z = p[2] - q.at[2]; return [x * F[0] + z * F[1], y, x * R[0] + z * R[1]].map(v => +v.toFixed(2)); };
    out[task + ':' + t] = {hvem:q.idx, h:+q.h.toFixed(2), boy:+q.b.toFixed(2), vri:+q.t.toFixed(2), hand:[b(q.gp[0]), b(q.gp[1])], haandledd:[b(q.wr[0]), b(q.wr[1])], albue:[b(q.el[0]), b(q.el[1])], skulder:[b(q.sh[0]), b(q.sh[1])], fra_grep_cm:(q.fo || []).map(v => +(v * 100).toFixed(1))}; }
  SJOBEIN.test = null; return out; }"""


def build():
    """The build first: a session or a picture of a build that failed is of the old one (seen 14.11.2026)."""
    r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0 or 'does not compile' in (r.stdout + r.stderr): print('BYGGET FEILET:\n' + (r.stdout + r.stderr)[-600:], flush=True); return False
    print((r.stdout.strip().split('\n') or [''])[-3][:120], flush=True); return True


async def serve():
    sys.path.insert(0, HERE)
    if not build(): sys.exit(1)
    from playwright.async_api import async_playwright
    from _env import boot, GAME
    from lemmer import SET, BOATS, frames
    os.makedirs(LIVE, exist_ok=True)
    for f in (CMD, RES):
        if os.path.exists(f): os.remove(f)
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 640, 'height': 480}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("if (window.name !== 'folk2live' && location.protocol !== 'about:') { try { localStorage.clear(); } catch (e) {} window.name = 'folk2live'; }")
        st = {'scene': None, 't': None}
        async def start(scene='pause'):
            await pg.goto('about:blank')   # (the same address again is no new page: the old game would go on)
            await pg.evaluate("window.name = ''")   # (and the save the first start left is cleared, else there is no first screen to press: seen 14.11.2026)
            await boot(pg, GAME + ',folk2'); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
            st['t'] = (await pg.evaluate(BOATS))[1]; await scene_set(scene)
        async def scene_set(scene):
            await pg.evaluate("G3._debug.studio(false)"); await pg.evaluate(SET, [st['t'], scene, 1, -0.9, 0.3, 6]); await frames(pg, st['t'], 2)
            try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
            except Exception: pass
            await pg.evaluate("G3._debug.studio(true)"); st['scene'] = scene
        await start(); print('klar', flush=True); t_end = time.time() + 7100
        while time.time() < t_end:
            if not os.path.exists(CMD): await asyncio.sleep(0.2); continue
            try: c = json.load(open(CMD))
            except Exception: await asyncio.sleep(0.1); continue
            os.remove(CMD); out = {'ok': True}; t0 = time.time()
            try:
                if c['op'] == 'quit': json.dump(out, open(RES, 'w')); break
                elif c['op'] == 'js': out['value'] = await pg.evaluate(c['code'])
                elif c['op'] in ('maal', 'ledd'):
                    if c.get('scene') and c['scene'] != st['scene']: await scene_set(c['scene'])
                    await pg.evaluate("LEMMER.log = []"); await frames(pg, st['t'], 1)   # (LEMMER.redraw is made by a frame drawn with the log on)
                    out['value'] = await pg.evaluate(MAAL if c['op'] == 'maal' else LEDD, [c['arg'], bool(c.get('spill')), c.get('roll', 0) * 3.14159265 / 180] if c['op'] == 'maal' else c['arg'])
                elif c['op'] == 'reload':
                    if not build(): out = {'ok': False, 'err': 'bygget feilet'}
                    else: await start(st['scene'] or 'pause')
                elif c['op'] == 'shot':
                    if c.get('scene') and c['scene'] != st['scene']: await scene_set(c['scene'])
                    await pg.evaluate("([w, d, p, f, s]) => G3._debug.camOn(w, d, p, f, s)", [c.get('who', 0), c.get('dist', 2.6), c.get('pitch', 0.1), c.get('face', 0.5), not c.get('alle')])
                    out['shots'] = []
                    for name, task, t in c['shots']:
                        await pg.evaluate("([task, t]) => { SJOBEIN.test = {roll:0, pitch:0, T:103.1, task, t}; }", [task, t]); await frames(pg, st['t'], 2)
                        f = os.path.join(LIVE, name + '.png'); await pg.screenshot(path=f, timeout=400000); out['shots'].append(f)
                    await pg.evaluate("SJOBEIN.test = null")
                out['gl'] = await pg.evaluate("G3._debug.glErr()"); out['feil'] = errs[:3]; del errs[:]
            except Exception as e: out = {'ok': False, 'err': str(e)[:400]}
            out['s'] = round(time.time() - t0, 1); json.dump(out, open(RES, 'w'))
        await br.close()


def send(c, wait=900):
    os.makedirs(LIVE, exist_ok=True)
    if os.path.exists(RES): os.remove(RES)
    json.dump(c, open(CMD + '.tmp', 'w')); os.replace(CMD + '.tmp', CMD); t0 = time.time()
    while time.time() - t0 < wait:
        if os.path.exists(RES):
            time.sleep(0.05)
            try: return json.load(open(RES))
            except Exception: pass
        time.sleep(0.2)
    return {'ok': False, 'err': 'ikke noe svar (går «serve»?)'}


def main():
    a = sys.argv[1:]
    if not a or a[0] == 'serve': asyncio.run(serve()); return
    if a[0] in ('quit', 'reload'): print(json.dumps(send({'op': a[0]}), ensure_ascii=False)); return
    if a[0] == 'js': print(json.dumps(send({'op': 'js', 'code': a[1]}), ensure_ascii=False)); return
    if a[0] in ('maal', 'ledd'):
        c = {'op': a[0], 'arg': []}; i = 1
        while i < len(a):
            if a[i] == '--scene': i += 1; c['scene'] = a[i]
            elif a[i] == '--roll': i += 1; c['roll'] = float(a[i])   # (the deck heeled, degrees: the sea legs)
            elif a[i] == '--spill': c['spill'] = True   # (nobody is put in the pose: those who have that work, at their own places)
            else:
                q = a[i].split(':')
                if a[0] == 'maal': c['arg'].append([q[0], float(q[1]) if len(q) > 1 else 0, float(q[2]) if len(q) > 2 else 6, int(q[3]) if len(q) > 3 else 25])
                else: c['arg'].append(MOMENT[a[i]] if a[i] in MOMENT else [q[0], float(q[1]) if len(q) > 1 else 0])
            i += 1
        r = send(c)
        for k, v in (r.get('value') or {}).items(): print(k, json.dumps(v, ensure_ascii=False))
        if not r.get('ok'): print(json.dumps(r, ensure_ascii=False))
        return
    if a[0] == 'shot':
        c = {'op': 'shot', 'shots': []}; i = 1
        while i < len(a):
            x = a[i]
            if x == '--alle': c['alle'] = True
            elif x in ('--who', '--face', '--dist', '--pitch', '--scene'): i += 1; c[x[2:]] = a[i] if x == '--scene' else float(a[i]) if x != '--who' else int(a[i]) if a[i].isdigit() else a[i]   # (--who: his number, or his work: gutw)
            elif x in MOMENT: c['shots'].append([x] + MOMENT[x])
            elif ':' in x: task, t = x.split(':'); c['shots'].append(['%s-%s' % (task, t), task, float(t)])
            else: print('ukjent øyeblikk:', x, '(finnes:', ' '.join(sorted(MOMENT)), ')'); return
            i += 1
        r = send(c); print(json.dumps({k: v for k, v in r.items() if k != 'shots'}, ensure_ascii=False))
        if r.get('shots'):
            from PIL import Image
            n = len(r['shots']); cols = min(4, n); rows = (n + cols - 1) // cols; sheet = Image.new('RGB', (480 * cols, 360 * rows), 'white')
            for k, f in enumerate(r['shots']): sheet.paste(Image.open(f).convert('RGB').resize((480, 360)), ((k % cols) * 480, (k // cols) * 360))
            sheet.save(os.path.join(LIVE, 'ark.jpg'), quality=88); print(os.path.join(LIVE, 'ark.jpg'), [os.path.basename(f)[:-4] for f in r['shots']])
main()
