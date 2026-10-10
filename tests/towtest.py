from _env import GAME, boot
# The rescue boat as a process (plan E3, 05.10.2026): called out from the nearest rescue station, it musters, comes at 25 knots by the
# fairway, makes fast and tows you at 6 knots to the nearest harbour. Checks the speeds, the ways (never over land), the cost and the
# catch, a boat on the rocks, the tow to the end (no fast forward: one clock for everyone) and the status text.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

RUN = """async (mode) => {
  S.tut = 0; S.cash = 1e6; S.member = false; S.settings.autoOn = false; S.free = {tow:1, rep:1};   // the first tow and repair are free (core/09f-merker.js; merketest) S.t = Math.round((Date.UTC(2027, 5, 9, 8) - EPOCH) / 6e4);
  const b = S.boat, q = portById('finnsnes'), lq = LGI(q.p), W = LG(lq.x - 1.5, lq.y + 0.3);
  b.status = 'idle'; b.port = null; b.pos = {...W}; S.plan = null; S.hold = [{sp:'torsk', kg:120, fresh:10, bled:true, iced:true, c:1, g:'A'}];
  if (mode === 'aground'){ let p = null; for (let r = 0.05; r < 2 && !p; r += 0.05) for (let k = 0; k < 24 && !p; k++){ const a = k / 24 * 6.283, c = {x:W.x + Math.sin(a) * r, y:W.y - Math.cos(a) * r}; if (isLand(c)) p = c; } runAground(p); }
  const cash0 = S.cash, R = {mode};
  rescue(mode !== 'mayday');
  R.start = {st:b.status, ph:b.tow && b.tow.ph, paid:cash0 - S.cash, hold:Math.round(holdTotal()), base:b.tow && b.tow.base, port:b.tow && b.tow.port, txt:statusText()};
  R.ais = npcStates(S.t / 60).filter(n => n.rs).map(n => n.name);   // the rescue boat on the AIS while she is out
  for (let i = 0; i < 200 && !(b.tow.P1 && b.tow.P2); i++) await new Promise(r => setTimeout(r, 50));
  const t = b.tow; R.ways = {p1:t.P1 ? t.P1.length : 0, p2:t.P2 ? t.P2.length : 0};
  // the ways sampled every 20 m: no point on land (a boat on the rocks is pulled off over the first 100 m)
  // (the harbour's own point at the quay may lie in a land cell of the 25 m mask: 60 m at the harbour ends are left out)
  const landOn = (P, s0, s1) => { const Rt = prepRoute(P); let n = 0; for (let s = s0; s <= Rt.len - s1; s += 0.02) if (isLand(atRoute(Rt, s).p)) n++; return n; };
  R.land = [landOn(t.P1, 0.06, 0), landOn(t.P2, mode === 'aground' ? 0.1 : 0, 0.06)];
  if (mode === 'fast'){ for (let i = 0; i < 1440 && b.tow; i++) step(); R.fast = !b.tow; R.end = {st:b.status, port:b.port, tow:!!b.tow}; return R; }   // the tow on the clock (no fast forward in the game: one clock for everyone)
  const ph = {}, gap = []; let n = 0, dr = 0, ds = 0;
  while (b.tow && n < 2000){ const th = b.tow.ph, r0 = b.tow.r, s0 = b.tow.s; ph[th] = (ph[th] || 0) + 1; const pz = towPose(0); if (th === 'tow') gap.push(dist(pz.r.p, pz.b.p));
    if (n === 12) R.mid = statusText(); step(); n++; if (b.tow){ dr = Math.max(dr, b.tow.r - r0); ds = Math.max(ds, b.tow.s - s0); } }
  R.ph = ph; R.come = +(dr / NM * 60).toFixed(2); R.tow = +(ds / NM * 60).toFixed(2); R.gap = gap.length ? +Math.max(...gap).toFixed(3) : 0; R.mins = n;
  R.end = {st:b.status, port:b.port, tow:!!b.tow, hold:Math.round(holdTotal()), log:S.log.slice(-3).map(e => e.no).join(' | '), ais:npcStates(S.t / 60).filter(n => n.rs).length};
  return R; }"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width':900, 'height':900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        tow = await pg.evaluate(RUN, 'tow'); print('tow:', json.dumps(tow, ensure_ascii=False))
        s, e = tow['start'], tow['end']
        print(ok(s['st'] == 'tow' and s['ph'] == 'muster' and s['paid'] == await pg.evaluate('PRICE.tow') and s['hold'] == 120 and s['base'] == 'Finnsnes' and 'redningsskøyta' in s['txt'].lower()),
              'a tow: the boat waits for the rescue boat from Finnsnes, the tow is paid at the call and the catch kept', s)
        print(ok(tow['ways']['p1'] >= 2 and tow['ways']['p2'] >= 2 and tow['land'] == [0, 0]), 'the rescue boat comes and tows by the fairway, never over land', tow['ways'], tow['land'])
        print(ok(tow['ph'].get('muster', 0) >= 10 and tow['ph'].get('hook', 0) == 5 and 24 <= tow['come'] <= 25.5 and 5.8 <= tow['tow'] <= 6.2), 'it musters for 10 min, comes at 25 knots, makes fast in 5 min and tows at 6 knots', tow['ph'], tow['come'], tow['tow'])
        print(ok(0.04 <= tow['gap'] <= 0.0605 and tow['mid'] in ('Redningsskøyta er på vei', 'Slepet settes', 'Under slep, 6 kn')), 'under tow the rescue boat is 60 m of tow line ahead, and the status says what happens', tow['gap'], tow['mid'])
        print(ok(e['st'] == 'port' and e['port'] == 'finnsnes' and not e['tow'] and e['hold'] == 120 and 'Slept inn til' in e['log']), 'towed in and moored in Finnsnes with the catch', e)
        print(ok(len(tow['ais']) == 1 and 'Finnsnes' in tow['ais'][0] and e['ais'] == 0), 'the rescue boat is on the AIS while she is out for you, and not after', tow['ais'], e['ais'])
        # the stations along the whole coast (tilbakemelding #18): the nearest sails, and no plant is far from one
        nat = await pg.evaluate("""() => { const B = rescueBases(), C = PORTS.filter(q => q.coastal), far = C.map(q => Math.min(...B.map(r => dist(r.p, q.p)))).sort((a, b) => a - b);
          const at = (a, b) => { const c = natP(a, b), r = rescueBase(c); return Math.round(dist(r.p, c)); };
          return {n:B.length, max:Math.round(far[far.length - 1]), p90:Math.round(far[Math.floor(far.length * 0.9)]), bergen:at(60.3, 5.0), lofoten:at(68.1, 13.3), kirkenes:at(69.8, 30.2), finnmark:at(70.9, 27.5),
            missing:RSTATIONS.filter(r => !B.some(x => x.st === r[0])).map(r => r[0])}; }""")
        print(ok(nat['n'] >= 34 and nat['p90'] <= 60 and nat['max'] <= 110 and max(nat['bergen'], nat['lofoten'], nat['kirkenes'], nat['finnmark']) <= 45),
              'rescue stations along the whole coast: the nearest one sails (within 45 km of Bergen, Lofoten, Kirkenes and Finnmark), and nine in ten plants have one within 60 km', nat)
        md = await pg.evaluate(RUN, 'mayday'); print('mayday:', json.dumps(md, ensure_ascii=False)[:600])
        print(ok(md['start']['hold'] == 0 and md['start']['paid'] == await pg.evaluate('PRICE.rescue') and md['end']['st'] == 'port' and 'mistet 120 kg' in md['end']['log']), 'a distress call: the catch is lost at once, and the boat is towed in all the same')
        ag = await pg.evaluate(RUN, 'aground'); print('aground:', json.dumps(ag, ensure_ascii=False)[:600])
        print(ok(ag['start']['st'] == 'tow' and ag['land'] == [0, 0] and ag['end']['st'] == 'port' and not ag['end']['tow']), 'on the rocks: pulled off to the water and towed in', ag['land'], ag['end'])
        fa = await pg.evaluate(RUN, 'fast'); print('fast:', json.dumps(fa, ensure_ascii=False)[:400])
        print(ok(fa['fast'] and fa['end']['st'] == 'port' and not fa['end']['tow']), 'the tow takes you to the harbour on the clock (there is no fast forward)')
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
