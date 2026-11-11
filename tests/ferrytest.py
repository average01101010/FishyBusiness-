"""The car ferries along the whole coast (Ø15 N3, 11.11.2026; tools/npc/ferje.py -> src/data/ferje.json, core/05b-ferje.js), in the
built game with the whole coast (tools/map/out/game: python3 tools/map/release.py and game.py before node build.mjs). For Halhjem -
Sandvikvåg (south), Bodø - Moskenes and Bognes - Lødingen (the middle), Hansnes - Skåningsbukt in Troms and Hasvik - Øksfjord in
Finnmark (north): a ferry lies at the quay before a departure of the timetable in the file, the same ferry is in the middle of the
leg half-way and at the other quay after the crossing's time, as npcStates gives her to the chart, within AIS range, with the
navigational status of a moored and a power-driven vessel, an AIS card with her made-up name, and the leg on water in the game's own
map (isLand, every 5 m). Every leg of the country is on water. Senja's ferry sails in June and not in November. A picture of the
chart with a ferry under way and her AIS card, in both formats. Prints OK or FEIL."""
import os, sys, asyncio, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from _env import GAME, OUT, boot
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# one crossing: the first departure after 06:00 on Wednesday 17.11.2027 (or the first day after with one) of a pattern that begins
# with the leg between the two quays, read from the file's own timetable (not from the ferries); the boat you follow is laid 2 km to
# the side of where the ferry is to be (beyond the 1 km the NPCs give way within), and npcStates is asked
ONE = """async ([a, b]) => {
  const F = ferjeInit(), s = ferjeFind(a, b); if (!s) return {miss:true};
  WX_FORCE = {w:5, d:200};
  let best = null;
  for (let dd = 0; dd < 7 && !best; dd++) for (const P of s.pats){ const n0 = F.q[P.q[0]].name, n1 = F.q[P.q[1]].name; if (!((n0 === a && n1 === b) || (n0 === b && n1 === a))) continue;
    let m = 0; for (const dt of s.w.t[s.w.d[(2 + dd) % 7]][P.i] || []){ m += dt; if (m >= 360 && (!best || m < best.m)) best = {m:m + dd * 1440, P}; } }
  if (!best) return {nodep:true};
  const {m, P} = best, R = P.R[0], dur = P.tm[0], q0 = F.q[P.q[0]], q1 = F.q[P.q[1]], off = s.L / 2000 + 0.04, T0 = Math.round((Date.UTC(2027, 10, 17) - EPOCH) / 6e4);
  const side = p => { const h = atRoute(R, R.len / 2).hd; return {x:p.x + Math.cos(h) * 2, y:p.y + Math.sin(h) * 2}; };
  const at = (mi, p) => { S.t = T0 + Math.floor(mi); const bt = S.boat; bt.status = 'idle'; bt.port = null; bt.pos = side(p); bt.v = 0; S.plan = null; COASTM.k = '';
    return npcStates((T0 + mi) / 60).filter(n => n.type === 'ferry' && n.id !== 'ferje'); };
  const mid = atRoute(R, R.len / 2).p, out = {from:q0.name, to:q1.name, dep:m, dur, km:+R.len.toFixed(1), L:s.L, k:s.k};
  const A = at(m - 0.5, q0.p), lying = A.filter(n => n.v === 0 && dist(n.p, q0.p) <= off);
  out.before = lying.length; out.far = +Math.max(0, ...A.map(n => dist(n.p, S.boat.pos))).toFixed(2); out.mooredCls = lying.every(n => n.cls === 'moor');
  const B = at(m + dur / 2, mid), under = B.filter(n => n.v > 0 && dist(n.p, mid) < 0.05 && lying.some(q => q.id === n.id));
  out.mid = under.length; out.kn = under.length ? under[0].v : null; out.name = under.length ? under[0].name : null; out.powCls = under.every(n => n.cls === 'pow');
  out.size = under.length ? [under[0].L, under[0].B, under[0].T] : null; out.far = Math.max(out.far, +Math.max(0, ...B.map(n => dist(n.p, S.boat.pos))).toFixed(2));
  if (under.length){ const n = under[0]; out.card = aisInfo(n); out.fish = !!(n.fleet || n.coast); }
  const C = at(m + dur + 0.4, q1.p).find(n => under.length && n.id === under[0].id); out.after = !!(C && C.v === 0 && dist(C.p, q1.p) <= off);
  // between the journeys: ten minutes on, if she has not left again, she still lies there
  const C2 = at(m + dur + 3, q1.p).find(n => under.length && n.id === under[0].id); out.stays = !!(C2 && (C2.v === 0 ? dist(C2.p, q1.p) <= off : true));
  const again = JSON.stringify(at(m + dur / 3, atRoute(R, R.len / 3).p)), again2 = JSON.stringify(at(m + dur / 3, atRoute(R, R.len / 3).p)); out.same = again === again2;
  // the leg on water in the game's own map
  let hit = 0, n = 0; for (let d = 0; d <= R.len; d += 0.005){ const p = atRoute(R, d).p; if (!mapReadyAt(p, 0)) await mapNeed(p, 0.5); n++; if (isLand(p)) hit++; }
  out.land = hit; out.samples = n; return out;
}"""
ALL = """async () => { const F = ferjeInit(), seen = new Set(); let legs = 0, bad = [];
  for (const s of F.s) for (const P of s.pats) for (let j = 0; j < P.R.length; j++){ const k = Math.min(P.q[j], P.q[j + 1]) + '|' + Math.max(P.q[j], P.q[j + 1]); if (seen.has(k) || s.lg) continue; seen.add(k);
    const R = P.R[j]; let hit = 0; for (let d = 0; d <= R.len; d += 0.01){ const p = atRoute(R, d).p; if (!mapReadyAt(p, 0)) await mapNeed(p, 0.5); if (isLand(p)) hit++; }
    legs++; if (hit) bad.push(F.q[P.q[j]].name + ' - ' + F.q[P.q[j + 1]].name + ' ' + hit); }
  return {legs, bad}; }"""
SENJA = """() => { const at = (mo, d, h, mi) => { S.t = Math.round((Date.UTC(2027, mo, d, h, mi) - EPOCH) / 6e4); const n = npcStates(S.t / 60).filter(q => q.id === 'ferje'); return n.length ? {name:n[0].name, v:n[0].v, L:n[0].L, type:n[0].type} : null; };
  const p = NPCR.ferry.pts[0]; S.boat.pos = {x:p.x + 1.5, y:p.y}; WX_FORCE = {w:5, d:200};
  return {june:at(5, 16, 7, 10), night:at(5, 16, 3, 0), nov:at(10, 17, 12, 0), others:npcStates(S.t / 60).filter(n => n.type === 'ferry' && n.id !== 'ferje').length}; }"""
# the chart with a ferry under way off Halhjem and her AIS card
SHOT = """() => { const F = ferjeInit(), s = ferjeFind('Halhjem', 'Sandvikvåg'), hq = F.q.find(q => q.name === 'Halhjem'); WX_FORCE = {w:5, d:200};
  S.t = Math.round((Date.UTC(2027, 10, 17, 10, 11) - EPOCH) / 6e4); const bt = S.boat; bt.status = 'idle'; bt.port = null; bt.pos = {x:hq.p.x - 2.2, y:hq.p.y + 3.2}; bt.v = 0; S.plan = null; S.equip.ais = true; S.equip.plotter = true;
  const n = npcStates(S.t / 60).filter(q => q.type === 'ferry' && q.v > 0).sort((a, b) => dist(a.p, bt.pos) - dist(b.p, bt.pos))[0]; if (!n) return null;
  if (typeof PHONE !== 'undefined') PHONE.show(false); openPlotter(); view.cx = (n.p.x + bt.pos.x) / 2; view.cy = (n.p.y + bt.pos.y) / 2; view.z = clamp(MAP_H / 9, ZMIN, ZMAX); applyView(); renderStatic(); renderDyn(); AISSEL = n.id; renderDyn(); renderAisCard();
  return {name:n.name, v:n.v, card:!document.getElementById('aisCard').hidden, text:document.getElementById('aisCard').textContent.slice(0, 200)}; }"""


async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py, så node build.mjs)'); return
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        ais = await pg.evaluate("AIS_KM")
        for a, c, where in (('Halhjem', 'Sandvikvåg', 'sør'), ('Bodø', 'Moskenes', 'midt'), ('Bognes', 'Lødingen', 'midt'), ('Hansnes', 'Skåningsbukt', 'nord, Troms'), ('Hasvik', 'Øksfjord', 'nord, Finnmark')):
            r = await pg.evaluate(ONE, [a, c]); nm = '%s–%s (%s)' % (a, c, where)
            if r.get('miss') or r.get('nodep'):
                check(False, nm + ': sambandet og en avgang finnes i fila', r); continue
            hh = '%02d:%02d' % (r['dep'] % 1440 // 60, r['dep'] % 60)
            check(r['before'] >= 1 and r['mooredCls'], '%s: en ferje ligger fortøyd ved %s før avgangen %s' % (nm, r['from'], hh), r['before'])
            check(r['mid'] == 1 and r['powCls'] and r['kn'] and 4 < r['kn'] < 26, '%s: avgangen stemmer med rutetida: den samme ferja er midt i leia midtveis, under fart' % nm, '%s, %s kn, %s km på %s min' % (r['name'], r['kn'], r['km'], r['dur']))
            check(r['after'] and r['stays'], '%s: hun ligger ved %s etter overfartstida, og blir liggende mellom turene' % (nm, r['to']))
            check(r['land'] == 0 and r['samples'] > 50, '%s: leia holder seg på vann i spillets kart' % nm, '%d punkter, %d på land' % (r['samples'], r['land']))
            check(r['far'] <= ais and r['same'], '%s: ferjene vises bare innen AIS-rekkevidden, og samme klokke gir samme sted' % nm, r['far'])
            card = r.get('card') or ''
            check(r['name'] and r['name'].startswith('MF ') and r['name'] in card and not r['fish'] and r['size'] and r['size'][0] == r['L'], '%s: oppdiktet navn, AIS-kort, størrelsen fra klassen, og hun tar ikke fisk (ingen fiskebåt)' % nm, (r['name'], r['size']))
        r = await pg.evaluate(ALL)
        check(r['legs'] > 250 and not r['bad'], 'alle leggene i landet holder seg på vann i spillets kart (hver 10. m)', (r['legs'], r['bad'][:6]))
        r = await pg.evaluate(SENJA)
        check(r['june'] and r['june']['name'] == 'MF Senjasund' and r['june']['v'] == 12 and r['june']['L'] == 49.9 and r['night'] and r['night']['v'] == 0 and r['nov'] is None,
              'Senjas ferje: «MF Senjasund» går i juni (12 kn kl. 07:10), ligger ved kai om natta, og går ikke i november', r)
        for name, vp in (('liggende', {'width': 1280, 'height': 800}), ('staaende', {'width': 800, 'height': 1280})):
            await pg.set_viewport_size(vp); await asyncio.sleep(0.5)
            r = await pg.evaluate(SHOT); await asyncio.sleep(1.2)
            await pg.screenshot(path=os.path.join(OUT, 'ferry-kart-%s.png' % name))
            check(bool(r) and r['card'] and r['name'] in r['text'], 'kartet %s: en ferje under fart med AIS-kortet åpent (ferry-kart-%s.png)' % (name, name), r)
        print('sidefeil:', errs)
        await b.close()

asyncio.run(main())
