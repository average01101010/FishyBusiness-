"""Less noise on the chart (docs/planer/kart-etiketter.md, E1 and E2, 02.11.2026): in the build with the vec packs (dist-vec), at Hammerfest
(Jonas' picture: Rypefjord), Bergen and Tromsø, zoomed in as far as the harbour names show, in landscape and portrait: no two names
on the chart overlap (the text's boxes as drawn, over the static and the AIS layer, the players' names left out as they may stand
over), the fishing boats in port carry no name, and a tap on an icon whose name was left out shows the name for a moment.
Screenshots in tests/out/etikett-<place>-<format>.png.

The ground names (Ø14 F4, docs/planer/fangstfelt.md, 08.11.2026; Jonas 07.11.2026: «navnet på feltet kan stå men aldri tettheten på
fisken»): at view.z 2 and 4 over Bergen, Henningsvær, Bodø and Båtsfjord, on a phone (390 × 844), the tablet both ways (800 × 1280,
1280 × 800) and Pad 3 both ways (915 × 1208, 1293 × 830), how many ground names stand, how much of the screen they cover, and that none
covers another name; under view.z 2 no ground name anywhere, Senja too, and Senja's six names (GROUNDS) never drawn for themselves; the
spawning and nursery grounds after the fishing grounds; a tap on a shortened name gives the whole name and its kind with the source,
and nothing of fish, species or months. Screenshots in tests/out/etikett-felt-<place>-z<z>-<w>x<h>.png."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('KYST_DIST', os.path.join(ROOT, 'dist-vec'))
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK   ' if ok else 'FEIL ') + what, ('' if extra == '' else ' ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]))

PLACES = [('hammerfest', 70.6235, 23.665), ('bergen', 60.398, 5.318), ('tromso', 69.649, 18.96)]
GO = """async ([la, lo]) => { const c = P(la, lo); let q = null;
  for (let r = 0; r <= 60 && !q; r++) for (let a = 0; a < Math.max(1, r * 6); a++){ const t = a / Math.max(1, r * 6) * 2 * Math.PI, p = {x:c.x + Math.cos(t) * r * 0.05, y:c.y + Math.sin(t) * r * 0.05}; if (!isLandFar(p)){ q = p; break; } }
  await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0;
  S.t = Math.round((Date.UTC(2027, 1, 15, 12) - EPOCH) / 6e4); WX_FORCE = {w:5, d:200}; COASTM.k = ''; HAV.k = '';
  if (typeof G3 !== 'undefined' && G3.show) G3.show(false); view.cx = c.x; view.cy = c.y; view.z = MAP_H / 3; applyView(); scheduleStatic(); return q; }"""
# the ground names' views (F4): a place at a given view.z, the boat moved away so its own labels do not count
GOZ = """async ([la, lo, z]) => { const c = P(la, lo); let q = null;
  for (let r = 0; r <= 60 && !q; r++) for (let a = 0; a < Math.max(1, r * 6); a++){ const t = a / Math.max(1, r * 6) * 2 * Math.PI, p = {x:c.x + Math.cos(t) * r * 0.05, y:c.y + Math.sin(t) * r * 0.05}; if (!isLandFar(p)){ q = p; break; } }
  await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:q.x, y:q.y}; S.plan = null; S.draft = []; b.v = 0;
  S.t = Math.round((Date.UTC(2027, 1, 15, 12) - EPOCH) / 6e4); WX_FORCE = {w:5, d:200}; COASTM.k = ''; HAV.k = '';
  if (typeof G3 !== 'undefined' && G3.show) G3.show(false); view.cx = c.x; view.cy = c.y; view.z = z; applyView(); scheduleStatic(); renderStatic(); renderDyn(); return q; }"""
# the ground names drawn (lbl-felt) and every other name, with their boxes on the screen; the share of the screen the ground names cover
FELTM = """(() => { const W = innerWidth, H = innerHeight, F = [], O = [], gn = new Set(GROUNDS.flatMap(g => [g.name.no, g.name.en]));
  for (const e of document.querySelectorAll('#map text')){ const c = e.getAttribute('class') || ''; if (!/lbl-/.test(c) || /lbl-depth/.test(c)) continue;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
    const o = {t:e.textContent, k:e.getAttribute('data-k') || '', b:[r.left, r.top, r.right, r.bottom]}; (/lbl-felt/.test(c) ? F : O).push(o); }
  let area = 0; for (const f of F){ const b = f.b; area += Math.max(0, Math.min(b[2], W) - Math.max(b[0], 0)) * Math.max(0, Math.min(b[3], H) - Math.max(b[1], 0)); }
  const hit = (a, c) => a[0] < c[2] - 2 && a[2] > c[0] + 2 && a[1] < c[3] - 2 && a[3] > c[1] + 2, ov = [];
  for (let i = 0; i < F.length; i++){ for (let j = i + 1; j < F.length; j++) if (hit(F[i].b, F[j].b)) ov.push([F[i].t, F[j].t]); for (const o of O) if (hit(F[i].b, o.b)) ov.push([F[i].t, o.t]); }
  return {n:F.length, f:F.filter(q => q.k === 'f').length, go:F.filter(q => q.k === 'g' || q.k === 'o').length, share:area / (W * H), ov,
    grounds:[...document.querySelectorAll('#map text')].filter(e => gn.has(e.textContent)).length, names:F.slice(0, 6).map(q => q.t)}; })()"""
FELTPLACES = [('bergen', 60.398, 5.318), ('henningsvaer', 68.152, 14.205), ('bodo', 67.283, 14.38), ('batsfjord', 70.634, 29.72)]
FELTVW = [(390, 844), (800, 1280), (1280, 800), (915, 1208), (1293, 830)]
SHOTS = {(390, 844), (800, 1280), (1280, 800)}

async def felt(b, errs):
    tapped = False
    for vw in FELTVW:
        pg = await (await b.new_context(viewport={'width': vw[0], 'height': vw[1]})).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); fm = f'{vw[0]}x{vw[1]}'; low = []
        for name, la, lo in FELTPLACES + [('senja', 69.47, 17.35)]:
            for z in (1, 1.5, 1.95):
                await pg.evaluate(GOZ, [la, lo, z]); m = await pg.evaluate(FELTM); low.append((name, z, m['n'], m['grounds']))
            if name == 'senja':
                for z in (2, 4):
                    await pg.evaluate(GOZ, [la, lo, z]); m = await pg.evaluate(FELTM); low.append((name, z, 0, m['grounds']))
                continue
            for z in (2, 4):
                await pg.evaluate(GOZ, [la, lo, z]); await pg.wait_for_timeout(300); await pg.evaluate("(() => { renderStatic(); renderDyn(); })()")
                m = await pg.evaluate(FELTM)
                print(f'     {name} z{z} {fm}: {m["n"]} feltnavn ({m["f"]} fiskeplasser, {m["go"]} gyte/oppvekst), {m["share"] * 100:.1f} % av skjermen; {", ".join(m["names"])}')
                lim = 0.05
                check(not m['ov'] and m['share'] <= lim and (m['n'] >= 1 or name == 'batsfjord'), f'{name} z{z} ({fm}): feltnavnene overlapper ingen andre navn og dekker høyst {lim * 100:.0f} % av skjermen',
                      {'n': m['n'], 'andel': round(m['share'], 4), 'overlapp': m['ov'][:3]})
                if vw in SHOTS and name in ('bergen', 'batsfjord'): await pg.screenshot(path=os.path.join(ROOT, 'tests', 'out', f'etikett-felt-{name}-z{z}-{fm}.png'))
                if not tapped and vw == (800, 1280):
                    # a tap on a shortened name: the whole name and its kind with the source, nothing of the fish
                    tp = await pg.evaluate("""(() => { if (typeof LBLFELT === "undefined") return null; const q = LBLFELT.find(e => e.box && e.f.n !== e.f.nf); if (!q) return null; const mp = {x:(q.box[0] + q.box[2]) / 2, y:(q.box[1] + q.box[3]) / 2};
                      tapName(mp, 16 / view.px); renderDyn(); const el = [...document.querySelectorAll('.lbl-tapname')].map(e => e.textContent).join(' | ');
                      const r = {n:q.f.n, nf:q.f.nf, k:q.f.k, shown:el}; TAPNAME = null; renderDyn(); return r; })()""")
                    if tp:
                        tapped = True; kind = {'f': 'Fiskeplass', 'g': 'Gyteområde', 'o': 'Oppvekst- og beiteområde'}[tp['k']]
                        bad = [w for w in ('torsk', 'sei', 'hyse', 'januar', 'mars', 'kg', 'tetthet') if w in tp['shown'].lower().split()]
                        check(tp['nf'] in tp['shown'] and kind in tp['shown'] and 'Fiskeridirektoratet' in tp['shown'] and not bad, f'{name} z{z}: et trykk på et kortet feltnavn viser hele navnet og slaget med kilden, ingenting om fisken', tp)
                        await pg.evaluate("(() => { const q = LBLFELT.find(e => e.box && e.f.n !== e.f.nf); tapName({x:(q.box[0] + q.box[2]) / 2, y:(q.box[1] + q.box[3]) / 2}, 16 / view.px); renderDyn(); })()")
                        await pg.screenshot(path=os.path.join(ROOT, 'tests', 'out', f'etikett-felt-trykk-{fm}.png'))
        check(all(q[2] == 0 for q in low), f'{fm}: ingen feltnavn under view.z 2 (Bergen, Henningsvær, Bodø, Båtsfjord, Senja)', [q for q in low if q[2]][:4])
        check(all(q[3] == 0 for q in low), f'{fm}: Senjas seks navn (GROUNDS) tegnes ikke for seg', [q for q in low if q[3]][:4])
        await pg.close()
    check(tapped, 'fant et kortet feltnavn å trykke på')

# the names drawn: every text of a label class with its box on the screen
BOXES = """(() => { const out = []; for (const e of document.querySelectorAll('#map text')){ const c = e.getAttribute('class') || ''; if (!/lbl-/.test(c) || /lbl-depth/.test(c)) continue;
  const r = e.getBoundingClientRect(); if (r.width < 1 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue; out.push({c, t:e.textContent, b:[r.left, r.top, r.right, r.bottom]}); } return out; })()"""

async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game'); return
    if os.environ.get('KYST_VEC_BUILT'): check(True, 'dist-vec/ bygd av run.py før testene')
    else:
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1', KYST_DIST=os.path.join(ROOT, 'dist-vec')), capture_output=True, text=True)
        check(r.returncode == 0, 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    os.makedirs(os.path.join(ROOT, 'tests', 'out'), exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing']); errs = []
        for fmt, vw in (('liggende', (1280, 800)), ('staaende', (800, 1280))):
            pg = await (await b.new_context(viewport={'width': vw[0], 'height': vw[1]})).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg)
            for name, la, lo in PLACES:
                await pg.evaluate(GO, [la, lo])
                try: await pg.wait_for_function("(() => { COASTM.k = ''; npcStates(S.t / 60); const b = S.boat.pos; return mapPacksIn('vec', b.x - 6, b.y - 6, b.x + 6, b.y + 6).every(pk => VEC.tiles.has(pk.tile[0] + ':' + pk.tile[1])); })()", timeout=120000)
                except Exception: pass
                await pg.wait_for_timeout(2500)
                await pg.evaluate("(() => { scheduleStatic(); renderStatic(); renderDyn(); })()")
                await pg.wait_for_timeout(500)
                L = await pg.evaluate(BOXES)
                ov = []
                for i in range(len(L)):
                    for j in range(i + 1, len(L)):
                        a, c = L[i]['b'], L[j]['b']
                        if 'pl' in L[i]['c'].split() or 'pl' in L[j]['c'].split(): continue
                        # (2 px of slack: the boxes are the glyphs' with their outline)
                        if a[0] < c[2] - 2 and a[2] > c[0] + 2 and a[1] < c[3] - 2 and a[3] > c[1] + 2: ov.append((L[i]['t'], L[j]['t']))
                port = await pg.evaluate("(() => { const out = new Set(AISNOW.filter(n => n.st !== 'port' || n.player).map(n => n.name)), names = new Set(AISNOW.filter(n => (n.coast || n.fleet || n.hav) && n.st === 'port' && AISSEL !== n.id && !out.has(n.name)).map(n => n.name)); return {inPort:names.size, named:[...document.querySelectorAll('.lbl-ais')].filter(e => names.has(e.textContent)).length}; })()")
                await pg.screenshot(path=os.path.join(ROOT, 'tests', 'out', f'etikett-{name}-{fmt}.png'))
                check(len(L) >= 5 and not ov, f'{name} ({fmt}): ingen navn i kartet overlapper hverandre', {'navn': len(L), 'overlapp': ov[:4]})
                check(port['named'] == 0, f'{name} ({fmt}): fiskebåtene i havn står uten navn', port)
                if name == 'hammerfest':
                    tp = await pg.evaluate("""(() => { const q = LBLHID[0]; if (!q) return {none:true}; const before = S.draft.length; tapName({x:q.x, y:q.y}, 0.05); renderDyn();
                      const el = document.querySelector('.lbl-tapname'); return {hid:LBLHID.length, n:q.n, shown:el ? el.textContent : null}; })()""")
                    check(tp.get('shown') == tp.get('n') and tp.get('n'), f'hammerfest ({fmt}): et trykk på et ikon uten navn viser navnet', tp)
                    await pg.wait_for_timeout(2800); await pg.evaluate("renderDyn()")
                    gone = await pg.evaluate("!document.querySelector('.lbl-tapname')")
                    check(gone, f'hammerfest ({fmt}): navnet forsvinner igjen etter et par sekunder')
            await pg.close()
        await felt(b, errs)
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
