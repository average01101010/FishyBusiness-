"""R4 of the rules plan (05.10.2026): a warning before the mistake. A fishing point where the rules stop the boat is marked in the route
and asked about at «Kast loss»; Autonav goes to the nearest place within 3 km where the boat may fish, and to the place itself when it
is tapped again; the quay says what will be confiscated before «Lever», and the landing then confiscates the same; the first time a
rule concerns the boat at sea, a tip comes in the phone, once. A 16 m boat in Malangen (inside the fjord line: no cod, § 31).
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


SETUP = """(() => { const m = P(69.50, 18.40); window.__m = m; S.boat.status = 'port'; S.boat.port = 'finnsnes'; S.plan = null; S.draft = []; S.jobs = [];
  BOAT.len = 16; RU_WP.clear(); RU_NOW = null; return true; })()"""

ROUTE = """(() => { const m = window.__m; S.draft = [{x:m.x, y:m.y, port:null, fish:2}]; setTab('route'); panelDirty = true; renderPanel();
  const msg = ruWpMsg(S.draft[0]), row = document.querySelector('#panel .wrule');
  doAct({dataset:{act:'start'}, disabled:false}); const md = document.getElementById('modal'), asked = !md.hidden && /Reglene stopper/.test(md.textContent), planBefore = !!S.plan;
  const go = document.getElementById('ruGo'); if (go) go.click();
  return {msg, row:row ? row.textContent : null, asked, planBefore, planAfter:!!S.plan, closed:md.hidden}; })()"""

AUTONAV = """(async () => { S.plan = null; S.boat.status = 'port'; S.boat.port = 'finnsnes'; S.boat.pos = {...portById('finnsnes').p}; S.draft = []; LEIA_RU = null;
  const m = window.__m, c = ruCtx(), q = {p:m, len:c.len, gear:c.gear, sp:c.sp, hand:c.hand}; let o = null;
  // the nearest open sea out from Malangen, 16 ways round, in 0.5 km steps
  for (let r = 0.5; r <= 40 && !o; r += 0.5) for (let i = 0; i < 16 && !o; i++){ const a = i * Math.PI / 8, x = {x:m.x + Math.sin(a) * r, y:m.y - Math.cos(a) * r}; if (!isLandFar(x) && !ruBlockMsg({...q, p:x})) o = x; }
  if (!o) return {err:'no open place within 40 km'};
  // a place 600 m inside the line from the nearest open place: closed, with open sea close by
  const d = dist(o, m), t = {x:o.x + (m.x - o.x) * 0.6 / d, y:o.y + (m.y - o.y) * 0.6 / d}, tBlocked = !!ruBlockMsg({...q, p:t});
  const toasts = []; const T0 = toast; toast = s => { toasts.push(s); return T0(s); };
  await leiaTo(t); const e1 = S.draft[S.draft.length - 1], a = e1 && {x:e1.x, y:e1.y};
  const aOpen = a && !ruBlockMsg({...q, p:a}), aAway = a && dist(a, t);
  S.draft = []; await leiaTo(t); const e2 = S.draft[S.draft.length - 1], bAt = e2 && dist(e2, t);
  toast = T0; return {tBlocked, aOpen, aAway, bAt, toast:toasts[0] || ''}; })()"""

LAND = """(() => { S.plan = null; S.draft = []; const b = S.boat; b.status = 'port'; b.port = 'botnhamn'; b.pos = {...portById('botnhamn').p}; delete b.land;
  const q = quotaState(); q.torsk = 1e9;   // no cod quota left
  S.hold = [{sp:'torsk', cls:1, kg:300, n:60, bled:true, iced:true, hr:0, fresh:92, gut:false, hook:false}, {sp:'hyse', cls:1, kg:100, n:40, bled:true, iced:true, hr:0, fresh:92, gut:false, hook:false}];
  const h = landPage(), d = document.createElement('div'); d.innerHTML = h; const w = d.querySelector('.landwarn'), txt = w ? w.textContent : '';
  const kg = +((txt.match(/ca\\. ([\\d\\s\\u00a0]+) kg/) || [])[1] || '0').replace(/\\D/g, '');
  const C = landConf(S.t / 60, q, access()); sell(); const ls = S.lastSale;
  return {txt, kg, confPreview:Math.round(C.codConf), sold:ls && Math.round(ls.codKg), acc:access(), ffKg:ls && Math.round(ls.ffKg)}; })()"""

TIPS = """(() => { const b = S.boat; b.port = null; b.status = 'idle'; b.pos = {...window.__m}; S.ruSeen = {}; RU_NOW = null; S.tut = 0; const n0 = S.msgs.length;
  ruTips(); const n1 = S.msgs.length, m = S.msgs[S.msgs.length - 1];
  for (let k = 0; k < 8; k++) ruTips();   // one tip a time, each rule once: the others here come, then none
  const n2 = S.msgs.length; ruTips(); const n3 = S.msgs.length, f31 = S.msgs.slice(n0).filter(x => x.from === 'Regler' && /15 m eller mer kan ikke fiske torsk/.test(x.no)).length;
  return {first:n1 - n0, rest:n2 - n1, again:n3 - n2, f31, from:m && m.from, text:m && m.no, seen:Object.keys(S.ruSeen)}; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate(SETUP)
        r = await pg.evaluate(ROUTE)
        check(bool(r['msg']) and 'torsk' in r['msg'] and r['row'] and 'torsk' in r['row'], 'a fishing point in Malangen for a 16 m boat is marked in the route with the reason', r)
        check(r['asked'] and not r['planBefore'] and r['planAfter'] and r['closed'], '«Kast loss» asks first, and «Kast loss likevel» goes', r)
        a = await pg.evaluate(AUTONAV)
        check(a.get('tBlocked') and a.get('aOpen') and 0.1 < (a.get('aAway') or 0) < 3.05 and 'Autonav går til nærmeste' in a.get('toast', ''), 'Autonav takes a closed place to the nearest open one within 3 km, and says so', a)
        check(a.get('bAt') is not None and a['bAt'] < 0.05, 'the same place tapped again: Autonav goes there after all', a)
        l = await pg.evaluate(LAND)
        check('inndratt' in l['txt'] and 'torskekvote' in l['txt'] and l['kg'] > 0, 'the quay says before «Lever» what will be confiscated, and why', l)
        check(l['sold'] is not None and abs(l['kg'] - l['sold']) <= 1, 'the landing confiscates what the quay said (kg)', l)
        t = await pg.evaluate(TIPS)
        check(t['first'] == 1 and t['f31'] == 1 and t['again'] == 0 and t['from'] == 'Regler' and 'f31' in t['seen'], 'the first time a rule concerns the boat at sea a tip comes in the phone, one at a time and each rule once', t)
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
