"""The car ferries along the whole coast (Ø15 N3, 11.11.2026; tools/npc/ferje.py -> src/data/ferje.json, core/05b-ferje.js), in the
built game with the whole coast (tools/map/out/game: python3 tools/map/release.py and game.py before node build.mjs). For Halhjem -
Sandvikvåg (south), Bodø - Moskenes and Bognes - Lødingen (the middle), Hansnes - Skåningsbukt in Troms and Hasvik - Øksfjord in
Finnmark (north): a ferry lies at the quay before a departure of the timetable in the file, the same ferry is in the middle of the
leg half-way and at the other quay after the crossing's time, as npcStates gives her to the chart, within AIS range, with the
navigational status of a moored and a power-driven vessel, an AIS card with her made-up name, and the leg on water in the game's own
map (isLand, every 5 m). Every leg of the country is on water. Senja's ferry sails in June and not in November. A picture of the
chart with a ferry under way and her AIS card, in both formats.
N4 (12.11.2026): the express boats Tromsø - Harstad, Bergen - Sogn and one in the Trondheimsfjord at every call of a journey at its
time and under way between; the coastal route's ships at Tromsø, Bodø and Ålesund when the timetable says, northbound and
southbound, with their AIS card (call sign, owner, size, all from the ship); every leg of the coastal route on water; and pictures of
the chart with the coastal ship and an express boat under way and their AIS cards, in both formats. Prints OK or FEIL."""
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
  const {m, P} = best, R = P.R[0], dur = P.tm[0], q0 = F.q[P.q[0]], q1 = F.q[P.q[1]], off = s.L / 2000 + 0.04 + 3 * (s.L + 15) / 1000, T0 = Math.round((Date.UTC(2027, 10, 17) - EPOCH) / 6e4);
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
  for (const s of F.s.concat(F.k ? [{pats:[F.k.P]}] : [])) for (const P of s.pats) for (let j = 0; j < P.R.length; j++){ const k = Math.min(P.q[j], P.q[j + 1]) + '|' + Math.max(P.q[j], P.q[j + 1]); if (seen.has(k) || s.lg) continue; seen.add(k);
    const R = P.R[j]; let hit = 0; for (let d = 0; d <= R.len; d += 0.01){ const p = atRoute(R, d).p; if (!mapReadyAt(p, 0)) await mapNeed(p, 0.5); if (isLand(p)) hit++; }
    legs++; if (hit) bad.push(F.q[P.q[j]].name + ' - ' + F.q[P.q[j + 1]].name + ' ' + hit); }
  return {legs, bad}; }"""
SENJA = """() => { const at = (mo, d, h, mi) => { S.t = Math.round((Date.UTC(2027, mo, d, h, mi) - EPOCH) / 6e4); const n = npcStates(S.t / 60).filter(q => q.id === 'ferje'); return n.length ? {name:n[0].name, v:n[0].v, L:n[0].L, type:n[0].type, card:aisInfo(n[0])} : null; };
  const p = NPCR.ferry.pts[0]; S.boat.pos = {x:p.x + 1.5, y:p.y}; WX_FORCE = {w:5, d:200};
  return {june:at(5, 16, 7, 10), night:at(5, 16, 3, 0), nov:at(10, 17, 12, 0), others:npcStates(S.t / 60).filter(n => n.type === 'ferry' && n.id !== 'ferje').length}; }"""
# an express boat calling at a and b (y 1): the journey with the most calls, its first departure after 06:00 on Wednesday 17.11.2027 or
# a day after; at each call (a minute after the arrival) she lies at the quay, half-way between two she is under way, as npcStates
# gives her with the boat you follow 2 km to the side
EXP = """async ([a, b]) => {
  const F = ferjeInit(), s = F.s.find(s => s.y === 1 && s.key.split('|').includes(a) && s.key.split('|').includes(b)); if (!s) return {miss:true};
  WX_FORCE = {w:5, d:200};
  const P = s.pats.filter(P => P.q.some(q => F.q[q].name === a) && P.q.some(q => F.q[q].name === b)).sort((x, y) => y.q.length - x.q.length)[0]; if (!P) return {miss:true};
  let m0 = -1; for (let dd = 0; dd < 7 && m0 < 0; dd++){ let m = 0; for (const dt of (s.w || s.s).t[(s.w || s.s).d[(2 + dd) % 7]][P.i] || []){ m += dt; if (m >= 360){ m0 = m + dd * 1440; break; } } }
  if (m0 < 0) return {nodep:true};
  const T0 = Math.round((Date.UTC(2027, 10, 17) - EPOCH) / 6e4), off = s.L / 2000 + 0.04 + 3 * (s.L + 15) / 1000;
  const at = (mi, p) => { S.t = T0 + Math.floor(mi); const bt = S.boat; bt.status = 'idle'; bt.port = null; bt.pos = {x:p.x + 1.4, y:p.y + 1.4}; bt.v = 0; S.plan = null; COASTM.k = '';
    return npcStates((T0 + mi) / 60).filter(n => n.type === 'ferry' && n.ex === 1); };
  const R0 = P.R[0], m1 = atRoute(R0, R0.len / 2).p, go = at(m0 + P.tm[0] / 2, m1).filter(n => n.v > 0 && dist(n.p, m1) < 0.3), id = go.length ? go[0].id : null, out = {calls:P.q.map(q => F.q[q].name), at:0, under:0, kn:[], dep:m0, land:0};
  for (let j = 1; j < P.q.length; j++){ const dep = j > 1 ? P.tm[2 * j - 3] : 0, arr = P.tm[2 * j - 2], R = P.R[j - 1], mid = atRoute(R, R.len / 2).p;
    const u = at(m0 + (dep + arr) / 2, mid).find(n => n.id === id); if (u && u.v > 0 && dist(u.p, mid) < 0.3){ out.under++; out.kn.push(u.v); if (!out.card){ out.card = aisInfo(u); out.name = u.name; out.cls = u.cls; } }
    // at the call: half-way through her stay, or (a call with no stay in the timetable) at the arrival, by the quay
    const qj = F.q[P.q[j]], lv = j < P.q.length - 1 ? P.tm[2 * j - 1] : arr + 2, c = at(m0 + (lv - arr >= 1 ? (arr + lv) / 2 : arr), qj.p).find(n => n.id === id);
    if (c && dist(c.p, qj.p) <= off + 0.1 && (c.v === 0 || lv - arr < 1)){ out.at++; if (!out.mcls && c.v === 0) out.mcls = c.cls; }
    for (let d = 0; d <= R.len; d += 0.005){ const p = atRoute(R, d).p; if (!mapReadyAt(p, 0)) await mapNeed(p, 0.5); if (isLand(p)) out.land++; } }
  return out;
}"""
# the coastal route's ships at a call: northbound (nth 0) and southbound (nth 1), on Wednesday 17.11.2027 counted from that day's
# departure from Bergen; half-way through the time at the quay one ship lies there, moored, and twenty minutes before the arrival she is
# under way towards it; her AIS card
KYST = """async ([name, nth]) => {
  const F = ferjeInit(), K = F.k; if (!K) return {miss:true}; WX_FORCE = {w:5, d:200};
  let i = -1; for (let k = 0, c = nth; k < K.P.q.length; k++) if (F.q[K.P.q[k]].name === name && c-- === 0){ i = k; break; }
  if (i < 0) return {miss:true};
  const arr = K.P.tm[2 * i - 2], lv = K.P.tm[2 * i - 1], T0 = Math.round((Date.UTC(2027, 10, 17) - EPOCH) / 6e4) + K.dep, q = F.q[K.P.q[i]];
  const at = mi => { S.t = T0 + Math.floor(mi); const bt = S.boat; bt.status = 'idle'; bt.port = null; bt.pos = {x:q.p.x + 1.5, y:q.p.y + 1.5}; bt.v = 0; S.plan = null; COASTM.k = '';
    return npcStates((T0 + mi) / 60).filter(n => n.type === 'coastal'); };
  const A = at((arr + lv) / 2), lie = A.filter(n => n.v === 0 && dist(n.p, q.p) < 0.4), B = at(arr - 20).filter(n => n.v > 0 && dist(n.p, q.p) < 15);
  const hh = m => String(Math.floor(m % 1440 / 60)).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
  return {when:hh(K.dep + arr) + '–' + hh(K.dep + lv), lie:lie.length, name:lie.length ? lie[0].name : null, cls:lie.length ? lie[0].cls : null, card:lie.length ? aisInfo(lie[0]) : '', coming:B.length, kn:B.length ? B[0].v : null, L:lie.length ? lie[0].L : null, B:lie.length ? lie[0].B : null, cs:lie.length ? lie[0].cs : null};
}"""
# the chart with the coastal ship (between Finnsnes and Tromsø, northbound) or an express boat (off Tromsø) under way and her AIS card
SHOT2 = """(kind) => { const F = ferjeInit(); WX_FORCE = {w:5, d:200}; const bt = S.boat;
  let T, pick;
  if (kind === 'kyst'){ const K = F.k, i = K.P.q.findIndex(q => F.q[q].name === 'Tromsø'); T = Math.round((Date.UTC(2027, 10, 17) - EPOCH) / 6e4) + K.dep + K.P.tm[2 * i - 2] - 50; pick = n => n.type === 'coastal' && n.v > 0; bt.pos = {x:F.q[K.P.q[i]].p.x - 6, y:F.q[K.P.q[i]].p.y + 6}; }
  else { const tq = F.q.find(q => q.name === 'Tromsø'); T = Math.round((Date.UTC(2027, 10, 17, 15, 40) - EPOCH) / 6e4); pick = n => n.type === 'ferry' && n.ex === 1 && n.v > 0; bt.pos = {x:tq.p.x + 0.5, y:tq.p.y + 1}; }
  for (let k = 0; k < 600; k += 5){ S.t = T + k; bt.status = 'idle'; bt.port = null; bt.v = 0; S.plan = null; S.equip.ais = true; S.equip.plotter = true; COASTM.k = '';
    const n = npcStates(S.t / 60).filter(pick).sort((a, b) => dist(a.p, bt.pos) - dist(b.p, bt.pos))[0]; if (!n) continue;
    bt.pos = {x:n.p.x - 1.2, y:n.p.y + 1.6};
    if (typeof PHONE !== 'undefined') PHONE.show(false); openPlotter(); view.cx = (n.p.x + bt.pos.x) / 2; view.cy = (n.p.y + bt.pos.y) / 2; view.z = clamp(MAP_H / 9, ZMIN, ZMAX); applyView(); renderStatic(); renderDyn(); AISSEL = n.id; renderDyn(); renderAisCard();
    return {name:n.name, v:n.v, card:!document.getElementById('aisCard').hidden, text:document.getElementById('aisCard').textContent.slice(0, 260)}; }
  return null; }"""
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
            sz = ('%.1f × %.1f m' % (r['size'][0], r['size'][1])).replace('.', ',') if r['size'] else '?'
            check(r['name'] and r['name'].startswith('MF ') and r['name'] in card and sz in card and 'Senja' not in card and 'Rederi' not in card and not r['fish'] and r['size'][0] == r['L'], '%s: oppdiktet navn, AIS-kortet med størrelsen fra klassen og uten rederi, og hun tar ikke fisk (ingen fiskebåt)' % nm, (r['name'], sz))
        for a, c, where in (('Tromsø Prostneset', 'Harstad', 'nord'), ('Strandkaien', 'Sogndal', 'sør, Bergen–Sogn'), ('Trondheim', 'Vanvikan', 'midt, Trondheimsfjorden')):
            r = await pg.evaluate(EXP, [a, c]); nm = 'hurtigbåten %s–%s (%s)' % (a, c, where)
            if r.get('miss') or r.get('nodep'):
                check(False, nm + ': sambandet og en avgang finnes i fila', r); continue
            n = len(r['calls']) - 1; card = r.get('card') or ''
            check(r['at'] == n and r['under'] == n and r.get('mcls') == 'moor' and r.get('cls') == 'pow', '%s: ved hver kai til rutetida og under fart mellom dem, avgang %02d:%02d' % (nm, r['dep'] % 1440 // 60, r['dep'] % 60), '%d anløp (%s), ved kai %d, under fart %d, %s kn' % (n + 1, ' – '.join(r['calls']), r['at'], r['under'], r['kn']))
            check(r['kn'] and all(12 <= v <= 40 for v in r['kn']), '%s: farten rutetida gir, er en hurtigbåts (12–40 kn)' % nm, r['kn'])
            check(r['land'] == 0, '%s: alle leggene på vann i spillets kart (hver 5. m)' % nm, r['land'])
            check(r.get('name', '').startswith('MS ') and 'Hurtigbåt' in card and r['name'] in card, '%s: oppdiktet «MS …»-navn og «Hurtigbåt» på AIS-kortet' % nm, r.get('name'))
        for name, where in (('Tromsø', 'nord'), ('Bodø', 'midt'), ('Ålesund', 'sør')):
            for nth, dr in ((0, 'nordgående'), (1, 'sørgående')):
                r = await pg.evaluate(KYST, [name, nth]); card = r.pop('card', '')
                if r.get('miss'):
                    check(False, 'kystruta anløper %s %s' % (name, dr)); continue
                sz = ('%.1f × %.1f m' % (r['L'] or 0, r['B'] or 0)).replace('.', ',')
                check(r['lie'] == 1 and r['cls'] == 'moor' and r['coming'] >= 1 and 8 <= (r['kn'] or 0) <= 22, 'kystruta %s ligger ved %s (%s) %s, og er under fart på vei inn tjue minutter før' % (dr, name, where, r['when']), r)
                check(r['name'] and r['name'].startswith('MS ') and r['cs'] in card and 'Kystruta AS' in card and sz in card and 'Passasjerskip' in card, 'kystruta ved %s: AIS-kortet leser kallesignal, eier og mål fra skipet (%s, %s, %s)' % (name, r['name'], r['cs'], sz))
        r = await pg.evaluate(ALL)
        check(r['legs'] > 400 and not r['bad'], 'alle leggene i landet, også hurtigbåtenes og kystrutas, holder seg på vann i spillets kart (hver 10. m)', (r['legs'], r['bad'][:6]))
        r = await pg.evaluate(SENJA)
        jc = (r['june'] or {}).pop('card', ''); (r['night'] or {}).pop('card', '')
        check(r['june'] and r['june']['name'] == 'MF Senjasund' and r['june']['v'] == 12 and r['june']['L'] == 49.9 and r['night'] and r['night']['v'] == 0 and r['nov'] is None and 'LMSB' in jc and '49,9 × 12,4 m' in jc and '3,1 m' in jc,
              'Senjas ferje: «MF Senjasund» går i juni (12 kn kl. 07:10), ligger ved kai om natta, går ikke i november, og AIS-kortet er som før', r)
        for name, vp in (('liggende', {'width': 1280, 'height': 800}), ('staaende', {'width': 800, 'height': 1280})):
            await pg.set_viewport_size(vp); await asyncio.sleep(0.5)
            r = await pg.evaluate(SHOT); await asyncio.sleep(1.2)
            await pg.screenshot(path=os.path.join(OUT, 'ferry-kart-%s.png' % name))
            check(bool(r) and r['card'] and r['name'] in r['text'], 'kartet %s: en ferje under fart med AIS-kortet åpent (ferry-kart-%s.png)' % (name, name), r)
            for kind in ('kyst', 'hurtig'):
                r = await pg.evaluate(SHOT2, kind); await asyncio.sleep(1.2)
                await pg.screenshot(path=os.path.join(OUT, '%s-kart-%s.png' % (kind, name)))
                check(bool(r) and r['card'] and r['name'] in r['text'], 'kartet %s: %s under fart med AIS-kortet åpent (%s-kart-%s.png)' % (name, 'kystruteskipet' if kind == 'kyst' else 'en hurtigbåt', kind, name), r)
        print('sidefeil:', errs)
        await b.close()

asyncio.run(main())
