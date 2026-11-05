"""Driftsplan 2 played as a player does it (GUI/UX review, docs/planer/driftsplan-2/03-gui-gjennomgang.md): the state is set up in JS before each
scenario (the boat type, the crew, the gear, the marks, who is aboard), but every step on the plan itself is a real touch through the DevTools
protocol (Input.dispatchTouchEvent) on the middle of an element that is on the screen: the phone and its Driftsplan app, the rows, the
buttons, −/+, the presets, «Velg i kartet …», taps and drags in the chart plotter, «Ferdig», Start, Pause, «Hent redskapet», copy and delete.
An element below the fold is reached the way a finger does it, by a swipe in the panel it lies in. The test counts taps and swipes, from the
closed phone and from «Lag driftsplan» to a plan that runs, for a day plan and a round-the-clock plan, in all three formats.
Screenshots of each important state in 800×1280, 1280×800 and 384×853 go to tests/out/driftsplan2gui/<scenario>-<state>-<format>.png, and
each state is measured in each format: sideways overflow (the page and the panels), the plan bar and card against each other, the pins and
the plotter's own buttons, tap targets under 44×44 CSS px, clipped text, buttons off the screen, and page errors. The measurements go to
tests/out/driftsplan2gui/maalinger.json. Run with KYST_LITE=1 (no 3D, set here when missing); KYST_GUI_ONLY=S03,S04 runs only those scenarios.
Like the other tests it prints OK/FEIL lines and asserts nothing."""
import os
os.environ.setdefault('KYST_LITE', '1')
from _env import GAME, boot
import asyncio, json, time, re
from playwright.async_api import async_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'driftsplan2gui')
os.makedirs(OUT, exist_ok=True)
FMTS = [(800, 1280), (1280, 800), (384, 853)]
DEBUG = os.environ.get('KYST_GUI_DEBUG') == '1'
ONLY = [s.strip() for s in os.environ.get('KYST_GUI_ONLY', '').split(',') if s.strip()]
if 'S04' in ONLY and 'S03' not in ONLY: ONLY.append('S03')   # (the chart works on S03's plan)
NAMES = ['Ole Mikalsen', 'Per Hansen', 'Kari Nilsen', 'Nils Berg', 'Anne Dahl']

# ---- in the page: where an element is (and how far its panel must scroll for it to be whole on the screen), what covers it, the
# measurements of a state, and every toast the game says (the toast function wrapped, so each tap's answer can be read)
GUIJS = r"""(() => {
  if (window.GUI) return;
  const vis = e => { if (!e || !e.isConnected) return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let x = e; x && x.nodeType === 1; x = x.parentElement){ if (x.hidden) return false; const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
  const scroller = e => { for (let x = e.parentElement; x && x !== document.body && x !== document.documentElement; x = x.parentElement){ const cs = getComputedStyle(x); if (/(auto|scroll)/.test(cs.overflowY) && x.scrollHeight > x.clientHeight + 2) return x; } return null; };
  const desc = e => !e || e.nodeType !== 1 ? null : e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).join('.') : '') + (e.dataset && (e.dataset.pa || e.dataset.pm || e.dataset.dk) ? '[' + (e.dataset.pa || e.dataset.pm || e.dataset.dk) + ']' : '');
  const txt = e => ((e && (e.innerText || e.textContent || e.getAttribute && e.getAttribute('aria-label'))) || '').replace(/\s+/g, ' ').trim();
  const toasts = []; { const t0 = window.toast; window.toast = function (m){ toasts.push({t:Date.now(), m:String(m)}); return t0.apply(this, arguments); }; }
  function rootOf(root, rtxt){ if (!root) return document; for (const e of document.querySelectorAll(root)){ if (vis(e) && (!rtxt || txt(e).includes(rtxt))) return e; } return null; }
  function find(sel, t, root, n, rtxt){ const R = rootOf(root, rtxt); if (!R) return null; let k = 0; for (const e of R.querySelectorAll(sel)){ if (!vis(e)) continue; if (t && !txt(e).includes(t)) continue; if (k++ === (n || 0)) return e; } return null; }
  function where(sel, t, root, n, rtxt){
    const e = find(sel, t, root, n, rtxt); if (!e) return null;
    const r = e.getBoundingClientRect(), sc = scroller(e), s = sc ? sc.getBoundingClientRect() : {top:0, bottom:innerHeight, left:0, right:innerWidth};
    const top = Math.max(0, s.top), bot = Math.min(innerHeight, s.bottom), m = 6; let dy = 0;
    // (a finger taps what it can see: the panel is swiped only when less than 36 px of the element, or less than all of a small one, is in view)
    const seen = Math.min(r.bottom, bot) - Math.max(r.top, top);
    if (sc && seen < Math.min(r.height, 36) - 1){ if (r.top < top + m) dy = r.top - (top + m); else if (r.bottom > bot - m) dy = Math.min(r.bottom - (bot - m), r.top - (top + m)); }
    const y0 = Math.max(r.top, top), y1 = Math.min(r.bottom, bot), x0 = Math.max(r.left, 0), x1 = Math.min(r.right, innerWidth), x = (x0 + x1) / 2, y = (y0 + y1) / 2;
    const hit = y1 > y0 && x1 > x0 ? document.elementFromPoint(x, y) : null;
    return {x, y, w:Math.round(r.width), h:Math.round(r.height), dy:Math.round(dy), sc:sc ? {x:(s.left + s.right) / 2, top, bot, st:sc.scrollTop, sh:sc.scrollHeight, ch:sc.clientHeight} : null,
      dis:!!e.disabled, cov:hit && hit !== e && !e.contains(hit) ? desc(hit) : null, txt:txt(e).slice(0, 90), on:e.classList.contains('on')};
  }
  // the camera only (the screenshots in the other formats): the element to the top of its panel
  function frame(sel, t, root){ const e = find(sel, t, root); if (!e) return false; const sc = scroller(e); if (!sc) return true; sc.scrollTop += e.getBoundingClientRect().top - sc.getBoundingClientRect().top - 8; return true; }
  const X = (a, b) => !!(a && b && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1);
  function measure(){
    const W = innerWidth, H = innerHeight, de = document.documentElement, o = {W, H, docOverflow:Math.max(de.scrollWidth, document.body.scrollWidth) > W + 1, panels:[], small:{}, clipped:[], off:[], overlap:[]};
    const roots = ['#drawer', '#pmBar', '#pmCard', '#phone', '#dock'].map(s => document.querySelector(s)).filter(vis);
    for (const R of roots){ for (const c of [R].concat([...R.querySelectorAll('#drawerBody, .ph-card, .dr-row, .dr-pl, .dr-plc, .dr-kv, .pm-kv, .pin-b, .pm-t, .pm-h, table, #phView')])){ if (vis(c) && c.scrollWidth > c.clientWidth + 1 && getComputedStyle(c).overflowX !== 'visible') o.panels.push(desc(c) + ' ' + c.scrollWidth + '>' + c.clientWidth); } }
    for (const R of roots) for (const e of R.querySelectorAll('button, [data-pa], [data-pm], [data-dk], a[href], input, select')){
      if (!vis(e) || e.disabled || (e.parentElement && e.parentElement.closest('button'))) continue; const r = e.getBoundingClientRect();
      if ((r.width < 44 - 0.5 || r.height < 44 - 0.5) && (R.id === 'drawer' || R.id === 'pmBar' || R.id === 'pmCard')){ const k = (e.dataset.pa || e.dataset.pm || e.dataset.dk || desc(e)) + ' «' + txt(e).slice(0, 18) + '» ' + Math.round(r.width) + '×' + Math.round(r.height); o.small[k] = (o.small[k] || 0) + 1; }
      const fixed = R.id === 'pmBar' || R.id === 'pmCard' || R.id === 'dock' || e.id === 'drawerClose';
      if (r.right > W + 1 || r.left < -1 || (fixed && (r.bottom > H + 1 || r.top < -1))) o.off.push(desc(e) + ' «' + txt(e).slice(0, 18) + '» ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
    }
    for (const R of roots) for (const e of R.querySelectorAll('*')){
      if (!e.firstChild || !vis(e)) continue; const cs = getComputedStyle(e);
      if (!(cs.overflowX === 'hidden' || cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis' || cs.whiteSpace === 'nowrap')) continue;
      if (e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && txt(e)) o.clipped.push(desc(e) + ' «' + txt(e).slice(0, 40) + '» ' + e.scrollWidth + '>' + e.clientWidth);
    }
    const R = id => { const e = document.getElementById(id); return vis(e) ? e.getBoundingClientRect() : null; }, bar = R('pmBar'), card = R('pmCard');
    if (X(bar, card)) o.overlap.push('pmBar×pmCard');
    if (bar || card){
      for (const e of document.querySelectorAll('#mapwrap > button, #mapwrap .zoom button, #plotTop, #plotTop button, #ecdisTop, #side, #dock, #dockInfo, #phoneFab, #miniPlot, #compass3d, #setBar, #legend, #aisCard, #pinCard')){
        if (!vis(e) || e.closest('#pmBar,#pmCard,#drawer')) continue; const r = e.getBoundingClientRect(); for (const [n, q] of [['pmBar', bar], ['pmCard', card]]) if (X(q, r)) o.overlap.push(n + '×' + desc(e)); }
      for (const c of document.querySelectorAll('#map g.pm circle')){ const r = c.getBoundingClientRect(), s = c.getAttribute('stroke') === '#ffd95e'; for (const [n, q] of [['pmBar', bar], ['pmCard', card]]) if (X(q, r)) o.overlap.push(n + '×' + (s ? 'valgt nål' : 'nål')); }
    }
    const dr = R('drawer'); if (dr) for (const e of document.querySelectorAll('#catchFeed > *, #toast.on, #dock [data-dk], #dockInfo, #dockFan')){ if (vis(e) && X(dr, e.getBoundingClientRect())) o.overlap.push('drawer×' + desc(e) + (e.dataset && e.dataset.dk ? '' : '')); }
    o.small = Object.entries(o.small).map(([k, v]) => v > 1 ? k + ' (×' + v + ')' : k);
    return o;
  }
  // the screen position of a map point under the chart as it stands, and whether it is clear of the plan's bar and card
  function mapPt(mp, centre){
    if (centre){ view.cx = mp.x; view.cy = mp.y; applyView(); renderDyn(); }
    const pt = svg.createSVGPoint(); pt.x = mp.x; pt.y = mp.y; const q = pt.matrixTransform(svg.getScreenCTM()), c = {left:q.x - 12, right:q.x + 12, top:q.y - 12, bottom:q.y + 12};
    const blocked = ['pmBar', 'pmCard', 'dock', 'plotTop', 'ecdisTop'].some(id => { const e = document.getElementById(id); return vis(e) && X(e.getBoundingClientRect(), c); }) || [...document.querySelectorAll('#mapwrap .zoom button, #side')].some(e => vis(e) && X(e.getBoundingClientRect(), c));
    return {x:q.x, y:q.y, ok:q.x > 20 && q.x < innerWidth - 20 && q.y > 20 && q.y < innerHeight - 20 && !blocked};
  }
  window.GUI = {vis, find, where, frame, measure, mapPt, toasts, txt, desc};
})()"""

# the state before a scenario: the boat at a harbour on Senja, the crew, the gear, the catch marks, who is aboard; the drawer, the phone and
# the chart's plan mode closed. Sea points near home are found as in driftsplan2map.py (for the marks, and the taps in the chart)
SETUP = r"""async (o) => {
  const lang = o.lang || 'no'; S.tut = 0; S.settings.lang = lang; S.lang = lang; DRIFT2 = true;
  if (PLANMAP.isOn()) PLANMAP.close(); DOCK.close(); PHONE.show(false); if (typeof G3 !== 'undefined' && G3.isActive && !G3.isActive() && G3.show) { try { G3.show(true); } catch (e){} }
  const b = S.boat, HP = portById(o.port || 'husoy');
  b.type = o.type || 'sjark'; applyVessel(); b.status = 'port'; b.port = HP.id; b.pos = {...HP.p}; b.land = null; b.gop = null; b.shift = null; b.fueling = null; b.after = null; b.landWait = null; S.shelter = null; S.jobs = [];
  // (a full tank and ice, so a plan does not begin with a move to the bunker quay, and nothing of the last scenario keeps the quay busy)
  b.fuel = BOAT.fuelCap; b.ice = BOAT.iceCap; if (typeof resting === 'function' && resting() && typeof restEnd === 'function') { try { restEnd(); } catch (e){} }
  S.plan = null; S.ops = null; S.draft = []; S.cash = 500000; S.energy = 100; S.hold = []; S.sets = (S.sets || []).filter(s => s.vid !== S.cur);
  S.fleet = S.fleet.filter(v => v.id === S.cur);
  // (ashore = aboard another of your boats, as the game has it: S.me is always a vessel of the fleet, ensureFleet)
  window.GUIASHORE = () => { let v = S.fleet.find(x => x.id !== S.cur && x.gShore); if (!v){ v = newVesselObj('skiff', S.boat.port); v.gShore = true; } S.me = v.id; return v.id; };
  S.me = S.cur;
  S.crew = (o.crew || []).map(n => Object.assign(genCrew(), {bi:false, off:false, name:n, known:[true, true], fatigue:0}));
  S.crew.forEach(c => { delete c.sk; delete c.mate; });
  if (o.sk) setSkipper(S.crew[0].id); if (o.mate) setMate(S.crew[1].id);
  S.equip = S.equip || {}; for (const k of ['linehaler', 'garnhaler', 'teinehaler']) delete S.equip[k]; for (const k of o.equip || []) S.equip[k] = true;
  S.pgear = newPGear(); const pg = S.pgear; pg.kits.n = o.kits == null ? 6 : o.kits;
  for (const lk of ['hyse', 'bank']) if (o[lk]){ const L = pg.lines[lk]; L.n = o[lk]; L.baited = o[lk]; L.bt = {makrell:o[lk]}; }
  if (o.nets) pg.nets.push({id:gid('n'), mesh:180, ty:'bunn', n:o.nets, cond:1, max:0.95});
  if (o.pots) pg.pots.big = o.pots; if (o.bait) pg.bait = {makrell:o.bait};
  b.rig = o.rig || 'juksa';
  for (const v of o.fleet || []) newVesselObj(v, HP.id);
  if (o.ashore) GUIASHORE();
  await mapNeed(HP.p, 14);
  const sea = [], land = []; for (let r = 2.5; r < 12 && sea.length < 6; r += 0.5) for (let a = 0; a < 24 && sea.length < 6; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.5 && sea.every(z => dist(z, q) > 1.2) && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null}) && !ruBlockMsg({p:q, len:BOAT.len, gear:'line', sp:null})) sea.push(q); } catch (e){} }
  for (let r = 0.3; r < 4 && !land.length; r += 0.1) for (let a = 0; a < 24 && !land.length; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (isLand(q) && !inHarbour(q)) land.push(q); } catch (e){} }
  S.marks = []; if (o.marks !== false) S.marks.push({x:sea[0].x, y:sea[0].y, t:S.t - 300, kgph:52, q:1}, {x:sea[2].x, y:sea[2].y, t:S.t - 400, kgph:30, q:1});
  if (o.gmark) S.marks.push({x:sea[1].x, y:sea[1].y, t:S.t - 500, kgph:0, g:o.gmark, kgu:3.2, soak:10, q:1});
  refreshAll(); window.GUISEA = {sea, land}; return {sea, land, home:HP.id};
}"""

# the engine played on, a minute at a time, as driftsplan2ui.py does (the loop let go every ten minutes)
PLAY = r"""async (n) => { for (let i = 0; i < n; i++){ DYN.on = false; step(); if (i % 10 === 9) await new Promise(r => setTimeout(r, 0)); } return {t:driftClock(driftHod(S.t / 60)), on:!!(S.ops && S.ops.on)}; }"""

# the engine's state against what the page shows (read from the drawer as drawn, after its own redraw)
NOWSTATE = r"""() => { const o = S.ops, b = S.boat, pl = S.plan, r = o && o.run, D = document.getElementById('drawerBody');
  const now = D && D.querySelector('.dr-now'), arrow = D && D.querySelector('.dr-ev.now'), evs = D ? [...D.querySelectorAll('.dr-pv .dr-ev')].map(e => e.innerText.replace(/\s+/g, ' ')) : [];
  const h4 = D && D.querySelector('.dr-pv') ? D.querySelector('.dr-pv').parentElement.querySelector('h4').innerText : null;
  return {clock:driftClock(driftHod(S.t / 60)), H:S.t / 60, status:b.status, port:b.port || null, opsK:pl && pl.ops ? pl.opsK || 'tur' : null, gop:b.gop ? b.gop.op : null, land:!!b.land, fishing:b.status === 'fishing',
    noJig:!!(pl && pl.noJig), wait:r && r.wait ? r.wait.k : null, step:r && r.day && r.day.steps[r.i] ? r.day.steps[r.i].k + '@' + (r.day.steps[r.i].t != null ? driftClock(driftHod(r.day.steps[r.i].t)) : '-') : null,
    nowTxt:now ? now.innerText.replace(/\s+/g, ' ') : null, arrow:arrow ? arrow.innerText.replace(/\s+/g, ' ') : null, label:h4, evs, crewFat:S.crew.map(c => Math.round(c.fatigue || 0)), meRest:typeof resting === 'function' ? resting() : null, energy:Math.round(S.energy == null ? 100 : S.energy), hold:Math.round(holdTotal()), log:S.log.filter(e => e.t > S.t - 60 && /plan|Driftsplan|dag|hvile|Hvil|energi/i.test(e.no || '')).slice(-3).map(e => driftClock(driftHod(e.t / 60)) + ' ' + (e.no || '').slice(0, 110))}; }"""


class Ctl:
    def __init__(self, pg, cdp):
        self.pg, self.cdp = pg, cdp
        self.taps = self.swipes = 0
        self.nok = self.nfeil = 0
        self.meas, self.texts, self.notes, self.covered, self.errs, self.dialogs = [], {}, [], [], [], []
        self.fmt = FMTS[0]
        self.accept = True
        self.scn = ''

    def check(self, cond, what, extra=''):
        if cond: self.nok += 1
        else: self.nfeil += 1
        print(('OK  ' if cond else 'FEIL') + ' ' + self.scn + ': ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)[:600]) if extra != '' else ''), flush=True)

    def note(self, what, extra=''):
        self.notes.append({'scn': self.scn, 'what': what, 'extra': extra})
        print('  · ' + self.scn + ': ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)[:600]) if extra != '' else ''), flush=True)

    async def js(self, code, arg=None):
        return await self.pg.evaluate(code, arg) if arg is not None else await self.pg.evaluate(code)

    async def tap(self, x, y):
        await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.06)
        await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.3)
        self.taps += 1

    async def drag(self, x0, y0, x1, y1, n=10, hold=0.12):
        await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0, 'id': 0}]}); await asyncio.sleep(0.05)
        for k in range(1, n + 1):
            await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * k / n, 'y': y0 + (y1 - y0) * k / n, 'id': 0}]}); await asyncio.sleep(0.03)
        await asyncio.sleep(hold)
        await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.35)

    async def swipe(self, sc, dy):
        # a finger in the panel moves the content: up by dy (the finger goes the other way); at most 70 % of the panel at a time
        # (the first ~15 px of a touch are the browser's slop and do not scroll, so they are added)
        h = sc['bot'] - sc['top']; d = max(-0.7 * h, min(0.7 * h, dy + (18 if dy > 0 else -18))); mid = (sc['top'] + sc['bot']) / 2
        await self.drag(sc['x'], mid + d / 2, sc['x'], mid - d / 2)
        self.swipes += 1

    async def where(self, sel, txt=None, root='#drawerBody', n=0, rtxt=None):
        return await self.js("a => GUI.where(a[0], a[1], a[2], a[3], a[4])", [sel, txt, root, n, rtxt])

    async def press(self, sel, txt=None, root='#drawerBody', n=0, rtxt=None, must=True, tap_disabled=False, settle=0.15, name=None):
        """Scroll the element whole onto the screen with a finger, then tap its middle. None when it is not found."""
        w, miss, last_st = None, 0, None
        for k in range(16):
            w = await self.where(sel, txt, root, n, rtxt)
            if not w:
                miss += 1
                if miss > 4: break
                await asyncio.sleep(0.3); continue
            if w['dy'] and w['sc']:
                st = w['sc']['st']
                if last_st is not None and abs(st - last_st) < 1 and k > 3: break   # the panel will not scroll further
                last_st = st; await self.swipe(w['sc'], w['dy'])
                if DEBUG: w2 = await self.where(sel, txt, root, n, rtxt); print('    sveip', name or sel, 'dy', w['dy'], 'st', st, '->', w2 and w2['sc'] and w2['sc']['st'], 'sc', w['sc'], flush=True)
                continue
            break
        if not w:
            if must: self.check(False, 'fant ikke ' + (name or sel) + (' «' + txt + '»' if txt else ''))
            return None
        if w['dis'] and not tap_disabled: return w
        if w['cov']: self.covered.append({'scn': self.scn, 'el': name or sel, 'by': w['cov'], 'fmt': '%dx%d' % self.fmt}); self.note('dekket ved trykk: ' + (name or sel), w['cov'])
        await self.tap(w['x'], w['y'])
        if settle: await asyncio.sleep(settle)
        return w

    async def has(self, sel, txt=None, root='#drawerBody'):
        return bool(await self.js("a => !!GUI.find(a[0], a[1], a[2])", [sel, txt, root]))

    async def text(self, root='#drawerBody'):
        return await self.js("s => { const e = document.querySelector(s); return e && GUI.vis(e) ? e.innerText : ''; }", root)

    async def wait(self, cond, sec=20):
        t0 = time.time()
        while time.time() - t0 < sec:
            if await self.js(cond): return True
            await asyncio.sleep(0.1)
        return False

    def mark(self):
        return (self.taps, self.swipes, time.time())

    def since(self, m):
        return {'trykk': self.taps - m[0], 'sveip': self.swipes - m[1], 'sek': round(time.time() - m[2], 1)}

    async def toasts_since(self, t_ms):
        return await self.js("t => GUI.toasts.filter(x => x.t >= t).map(x => x.m)", t_ms)

    async def now_ms(self):
        return await self.js("Date.now()")

    async def set_fmt(self, f):
        self.fmt = f
        await self.pg.set_viewport_size({'width': f[0], 'height': f[1]}); await asyncio.sleep(0.5)

    async def setup(self, **o):
        r = await self.js(SETUP, o)
        await asyncio.sleep(0.3)
        return r

    async def shots(self, state, frame=None, root='#drawerBody', fmts=FMTS):
        """The state in each format: a screenshot, and its measurements; the text of the drawer, the plan bar and the card kept for the report."""
        f0 = self.fmt
        await asyncio.sleep(0.75)   # (the drawer redraws itself at most every 700 ms: the state as the player sees it a moment later)
        for f in fmts:
            if f != self.fmt: await self.pg.set_viewport_size({'width': f[0], 'height': f[1]}); await asyncio.sleep(0.7)
            if frame: await self.js("a => GUI.frame(a[0], a[1], a[2])", [frame[0], frame[1] if len(frame) > 1 else None, root]); await asyncio.sleep(0.25)
            name = '%s-%s-%dx%d.png' % (self.scn, state, f[0], f[1])
            await self.pg.screenshot(path=os.path.join(OUT, name))
            m = await self.js("GUI.measure()"); m.update({'scn': self.scn, 'state': state, 'fmt': '%dx%d' % f, 'png': name})
            self.meas.append(m)
            if m['docOverflow'] or m['panels'] or m['off'] or m['overlap'] or m['clipped']:
                print('  · %s %s %s: overflyt %s panel %s utenfor %s overlapp %s kuttet %s' % (self.scn, state, m['fmt'], m['docOverflow'], m['panels'][:3], m['off'][:3], m['overlap'][:6], m['clipped'][:3]), flush=True)
        if self.fmt != fmts[-1] or len(fmts) > 1:
            await self.pg.set_viewport_size({'width': f0[0], 'height': f0[1]}); await asyncio.sleep(0.6)
        self.texts['%s-%s' % (self.scn, state)] = {k: await self.text(k) for k in ('#drawerBody', '#pmBar', '#pmCard', '#phView')}

    # ---- the ways in, as a player goes
    async def open_phone(self):
        r = await self.js("['phoneFab', 'phoneBtn'].map(id => document.getElementById(id)).filter(e => GUI.vis(e)).map(e => { const q = e.getBoundingClientRect(); return {id:e.id, x:q.x + q.width / 2, y:q.y + q.height / 2}; })[0] || null")
        if not r: self.check(False, 'ingen telefonknapp på skjermen'); return False
        await self.tap(r['x'], r['y'])
        return await self.wait("PHONE.isOpen()", 5)

    async def open_drift(self):
        """The phone, then the Driftsplan app (scrolled to in the phone's grid when it is below the fold): the drawer opens with the page."""
        if not await self.open_phone(): return False
        await self.press('.ph-app[data-a="drift"]', root='#phView', name='Driftsplan-appen')
        ok = await self.wait("DOCK.page === 'drift' && !document.getElementById('drawer').hidden", 5)
        await asyncio.sleep(0.3)
        return ok

    async def map_tap(self, mp, centre=False):
        """A tap on a map point: where it lies on the chart as it stands; centred first (in JS) only when it is off the screen or under a panel."""
        p = await self.js("a => GUI.mapPt(a[0], a[1])", [mp, centre])
        if not p['ok'] and not centre:
            p = await self.js("a => GUI.mapPt(a[0], true)", [mp]); centre = True
        await self.tap(p['x'], p['y'])
        return {'x': p['x'], 'y': p['y'], 'centred': centre}


# ======================================================================================================================================
# the scenarios

async def s01_dagdrift(c, shots=True):
    """A new plan on a sjark with you and two crew, the jig only: from the closed phone to a plan that runs."""
    await c.setup(type='sjark', crew=NAMES[:2])
    m0 = c.mark()
    ok = await c.open_drift()
    intro = await c.has('[data-pa="p2-new"]')
    c.check(ok and intro, 'telefonen → Driftsplan-appen åpner siden med «Lag driftsplan»', c.since(m0))
    if shots: await c.shots('intro')
    m1 = c.mark()
    await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    t = await c.text()
    rows = all(k in t for k in ['Hjem', 'Redskap', 'Plasser', 'Levering', 'Vær', 'Rytme', 'Mannskap'])
    st = await c.where('[data-pa="p2-start"]')
    c.check(rows and st and not st['dis'] and 'Start planen' in st['txt'], 'en ny plan kommer utfylt og klar: dagen, de sju radene og «Start planen»', {'start': st and st['txt'], 'ops': await c.js("({home:S.ops.home, rig:S.ops.rig, places:S.ops.places.map(q => q.k)})")})
    if shots: await c.shots('ny-plan')
    await c.press('[data-pa="p2-start"]', name='Start planen')
    on = await c.wait("S.ops && S.ops.on", 30)
    res = {'fra_telefon': c.since(m0), 'fra_lag': c.since(m1), 'on': on}
    c.check(on, 'Start: planen lages og går', {'fra telefonen': res['fra_telefon'], 'fra Lag driftsplan': res['fra_lag']})
    if shots:
        await c.shots('paa', frame=('.dr-onoff',))
        # the whole page, swiped through from the top to the bottom with the finger (how long the page is)
        w = await c.where('[data-pa="p2-reset"]'); n = 0
        while w and w['dy'] and w['sc'] and n < 14:
            await c.swipe(w['sc'], w['dy']); n += 1; w = await c.where('[data-pa="p2-reset"]')
        c.note('hele siden med planen på: sveip fra toppen til «Slett driftsplanen»', {'sveip': n, 'fmt': '%dx%d' % c.fmt, 'hoyde': w and w['sc'] and w['sc']['sh'], 'synlig': w and w['sc'] and w['sc']['ch']})
        await c.shots('bunn', frame=('.p2-stat',))
    return res


async def s02_ikke_klar(c):
    """You ashore, two crew without a skipper or a mate: «Ikke klar ennå» with the reason, and the way to fix it with taps."""
    await c.setup(type='sjark', crew=NAMES[:2], ashore=True)
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    st = await c.where('.dr-onoff'); t = await c.text()
    reason = re.search(r'skipper og en styrmann', t)
    c.check(st and st['dis'] and 'Ikke klar ennå' in st['txt'] and bool(reason), '«Ikke klar ennå» med grunnen (skipper og styrmann)', {'knapp': st and st['txt']})
    crew_row = await c.where('.dr-rh[data-k="crew"]')
    c.note('Mannskap-raden', crew_row and crew_row['txt'])
    await c.shots('ikke-klar')
    m = c.mark()
    # U13: the reason is the way to what mends it, a tap on it opens the Crew page
    why = await c.where('[data-pa="p2-go"][data-go="mannskap"]')
    await c.js("GUI.opened = []; if (!DOCK.__w){ const o = DOCK.open; DOCK.open = function (a){ GUI.opened.push(a); return o.apply(this, arguments); }; DOCK.__w = true; }")
    if why: await c.press('[data-pa="p2-go"][data-go="mannskap"]', name='grunnen (skipper og styrmann)')
    else:
        await c.press('.dr-rh[data-k="crew"]', name='Mannskap-raden')
        await c.press('[data-pa="p2-crew"]', name='Til Mannskap-siden')
    pg_ok = await c.wait("DOCK.page === 'arbeid'", 3)
    c.check(bool(why) and pg_ok, 'U13: grunnen er en knapp, og et trykk på den åpner Mannskap-siden i samme skuff', {'grunnen': why and why['txt'], 'skuffen viser': await c.js("DOCK.page"), 'DOCK.open kalt med': await c.js("GUI.opened")})
    if not pg_ok:
        # the way a player finds instead: the Crew button in the dock
        await c.shots('til-mannskap-trykket')
        await c.press('[data-dk="arbeid"]', root='#dock', name='Mannskap i dokka')
        c.note('omveien: Mannskap-knappen i dokka', {'skuffen viser': await c.js("DOCK.page")})
    await c.shots('mannskap-siden')
    await c.press('[data-pa="wk-sk"]', root='.wk-p', rtxt='Ole', name='Gjør til skipper (Ole)')
    await c.press('[data-pa="wk-mate"]', root='.wk-p', rtxt='Per', name='Gjør til styrmann (Per)')
    roles = await c.js("({sk:(crewSkipper() || {}).name, mate:(crewMate() || {}).name})")
    # the skipper's own card still offers «Gjør til styrmann»: a tap there would move him
    sk_mate_btn = await c.has('[data-pa="wk-mate"]', None, '.wk-p')
    await c.press('[data-pa="open"][data-a="drift"]', name='Åpne (Driftsplan-linja)')
    back = await c.wait("DOCK.page === 'drift'", 5)
    st2 = await c.where('.dr-onoff')
    c.check(roles == {'sk': 'Ole Mikalsen', 'mate': 'Per Hansen'} and back and st2 and not st2['dis'], 'skipper og styrmann utnevnt med trykk, og tilbake på Driftsplan er Start klar', {'roller': roles, 'trykk': c.since(m), 'knapp': st2 and st2['txt']})
    c.note('skipperens eget kort tilbyr fortsatt «Gjør til styrmann»', sk_mate_btn)
    await c.press('[data-pa="p2-start"]', name='Start planen')
    c.check(await c.wait("S.ops && S.ops.on", 30), 'planen går uten deg om bord', c.since(m))


async def s03_line(c):
    """Line: the rig chosen, a field from the own marks, the kind toggle, + up to the tubs the boat owns, the soak."""
    await c.setup(type='sjark', crew=NAMES[:2], equip=['linehaler'], hyse=4, bank=10, kits=6, rig='line', gmark='line')
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="rig"]', name='Redskap-raden')
    await c.shots('redskap', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-rig"][data-g="juksa"]', name='Bare juksa')
    r1 = await c.js("S.ops.rig")
    await c.press('[data-pa="p2-rig"][data-g="line"]', name='Line')
    await c.press('[data-pa="p2-jig"][data-v="1"]', name='Jukse i tillegg: Ja')
    rv = await c.where('.dr-rh[data-k="rig"]')
    c.check(r1 == 'juksa' and await c.js("S.ops.rig") == 'line' and rv and 'hyseline' in rv['txt'] and 'bankline' in rv['txt'], 'Redskap-raden: juksa og line velges med trykk, raden sier stampene per type', rv and rv['txt'])
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden')
    await c.press('[data-pa="p2-add"][data-k="felt"]', name='+ Felt for line')
    sug = await c.has('[data-pa="p2-addp"]')
    await c.shots('forslag', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-addp"]', name='forslaget (eget fangstmerke)')
    P = await c.js("S.ops.places.map(q => ({k:q.k, n:q.n, soak:q.soak, lk:q.lk}))")
    c.check(sug and any(q['k'] == 'felt' for q in P), 'et felt fra eget fangstmerke legges til med ett trykk', P)
    lk0 = await c.js("(S.ops.places.find(q => q.k === 'felt') || {}).lk")
    await c.press('.dr-pl [data-pa="p2-plk"]', name='linetype-bryteren')
    lk1 = await c.js("(S.ops.places.find(q => q.k === 'felt') || {}).lk")
    t0 = await c.now_ms()
    for k in range(14): await c.press('.dr-pl [data-pa="p2-pn"][data-d="1"]', name='+ stamper', settle=0.05)
    f = await c.js("(() => { const q = S.ops.places.find(q => q.k === 'felt'); return {n:q.n, lk:q.lk, own:p2Units('line', q.lk)}; })()")
    ts = await c.toasts_since(t0)
    c.check(lk0 != lk1 and f['n'] == f['own'] and any('ikke flere' in x for x in ts), 'typebryteren bytter linetype; + stopper ved stampene båten eier, og sier fra', {'lk': [lk0, lk1], 'felt': f, 'toast': ts[-1:] if ts else None, 'antall_toast': len(ts)})
    s0 = await c.js("S.ops.places.find(q => q.k === 'felt').soak")
    await c.press('.dr-pl [data-pa="p2-ps"][data-d="1"]', name='+ ståtid'); await c.press('.dr-pl [data-pa="p2-ps"][data-d="1"]', name='+ ståtid')
    await c.press('.dr-pl [data-pa="p2-ps"][data-d="-1"]', name='− ståtid')
    s1 = await c.js("S.ops.places.find(q => q.k === 'felt').soak")
    c.check(s1 == s0 + 1, 'ståtida går i steg på 1 t for line', [s0, s1])
    # the order: the field first
    i0 = await c.js("S.ops.places.map(q => q.k).join(',')")
    await c.press('.dr-pl [data-pa="p2-pup"]:not([disabled])', name='↑ (feltet først)')
    i1 = await c.js("S.ops.places.map(q => q.k).join(',')")
    c.check(i0 != i1, 'rekkefølgen endres med ↑', [i0, i1])
    await c.shots('plasser', frame=('.dr-row.on',))


async def s04_kart(c):
    """The chart: «Velg i kartet …», a pin tapped, the card's buttons, land refused, a pin dragged, a jig place, ↑/↓, Fjern, the day's length, Ferdig."""
    sea = (await c.js("window.GUISEA"))['sea']; land = (await c.js("window.GUISEA"))['land']
    m = c.mark()
    await c.press('[data-pa="p2-map"]', name='Velg i kartet …')
    on = await c.wait("PLANMAP.isOn() && !document.getElementById('pmBar').hidden", 5); await asyncio.sleep(0.6)
    c.check(on, '«Velg i kartet …» åpner kartplotteren i planmodus')
    await c.shots('kart', root=None)
    # the field from S03 is on the chart as it was fitted: tap its pin where it lies
    f = await c.js("(() => { const q = S.ops.places.find(q => q.k === 'felt'); return {x:q.x, y:q.y}; })()")
    tp = await c.map_tap(f)
    card = await c.text('#pmCard')
    c.check('Felt 1' in card, 'et trykk på nåla åpner kortet', {'kort': card[:120], 'sentrert': tp['centred']})
    await c.shots('kort-felt', root=None)
    n0 = await c.js("S.ops.places.find(q => q.k === 'felt').n")
    await c.press('[data-pm="n"][data-d="-1"]', root='#pmCard', name='kort − stamper')
    s0 = await c.js("S.ops.places.find(q => q.k === 'felt').soak")
    await c.press('[data-pm="s"][data-d="1"]', root='#pmCard', name='kort + ståtid')
    n1, s1 = await c.js("[S.ops.places.find(q => q.k === 'felt').n, S.ops.places.find(q => q.k === 'felt').soak]")
    c.check(n1 == n0 - 1 and s1 == s0 + 1, 'kortets − og + virker', [n0, n1, s0, s1])
    t0 = await c.now_ms(); tries = 0
    while tries < 24 and await c.js("S.ops.places.find(q => q.k === 'felt').hdg == null"):
        await c.press('[data-pm="h"][data-d="15"]', root='#pmCard', name='kort ↷'); tries += 1
    hd = await c.js("S.ops.places.find(q => q.k === 'felt').hdg")
    card2 = await c.text('#pmCard'); ts = await c.toasts_since(t0)
    c.check(hd is not None and '°' in card2, 'lenkeretningen settes med ↷ (avvist retning sies med toast)', {'trykk': tries, 'avvist': len(ts), 'kort': card2[:160]})
    await c.shots('kort-retning', root=None)
    await c.press('[data-pm="h0"]', root='#pmCard', name='kort «fri»')
    c.check(await c.js("S.ops.places.find(q => q.k === 'felt').hdg == null"), '«fri» tar retningen bort igjen')
    # land: refused with a toast
    t0 = await c.now_ms(); np0 = await c.js("S.ops.places.length")
    await c.map_tap(land[0]); ts = await c.toasts_since(t0)
    c.check(await c.js("S.ops.places.length") == np0 and any('land' in x.lower() for x in ts), 'et trykk på land avvises med toast', ts)
    await c.shots('land-avvist', root=None)
    # a new field in the sea (the tool is Felt)
    t0 = await c.now_ms()
    await c.map_tap(sea[3]); P = await c.js("S.ops.places.map(q => ({k:q.k, n:q.n, lk:q.lk}))"); ts = await c.toasts_since(t0)
    c.check(len(P) == np0 + 1 and P[-1]['k'] == 'felt', 'et trykk i sjøen legger til et felt', {'plasser': P, 'toast': ts})
    # the pin dragged
    q = await c.js("(() => { const q = S.ops.places[S.ops.places.length - 1]; return {x:q.x, y:q.y}; })()")
    p0 = await c.js("a => GUI.mapPt(a, false)", q)
    if not p0['ok']: p0 = await c.js("a => GUI.mapPt(a, true)", q)
    await c.drag(p0['x'], p0['y'], p0['x'] - 90, p0['y'] - 50); c.taps += 1
    q2 = await c.js("(() => { const q = S.ops.places[S.ops.places.length - 1]; return {x:q.x, y:q.y}; })()")
    moved = abs(q2['x'] - q['x']) > 0.05 or abs(q2['y'] - q['y']) > 0.05
    c.check(moved, 'nåla dras til et nytt sted', [q, q2])
    # a jig place
    await c.press('[data-pm="tool"][data-k="juks"]', root='#pmBar', name='Juksplass')
    np1 = await c.js("S.ops.places.length")
    await c.map_tap(sea[4]); P = await c.js("S.ops.places.map(q => q.k)")
    c.check(len(P) == np1 + 1 and P[-1] == 'juks', 'Juksplass og et trykk i sjøen legger til en juksplass', P)
    await c.shots('kort-juks', root=None)
    await c.press('[data-pm="up"]', root='#pmCard', name='kort ↑')
    P2 = await c.js("S.ops.places.map(q => q.k)")
    await c.press('[data-pm="dn"]', root='#pmCard', name='kort ↓')
    P3 = await c.js("S.ops.places.map(q => q.k)")
    c.check(P2 != P and P3 == P, 'kortets ↑ og ↓ flytter plassen i rekkefølgen', [P, P2, P3])
    day = await c.text('#pmBar')
    dm = re.search(r'Dagen blir ([\d,]+) t(, hjemme kl\. \d\d:\d\d)?', day)
    c.check(bool(dm), 'lista viser dagens lengde etter endringene', day.split('\n')[-1] if day else None)
    await c.press('[data-pm="del"]', root='#pmCard', name='kort Fjern')
    c.check(await c.js("S.ops.places.length") == np1, 'Fjern tar bort plassen (uten å spørre)')
    c.note('trykk og sveip i kartet', c.since(m))
    # the way back that is not «Ferdig»: the plotter's own «3D» button (hidden in plan mode, so «Ferdig» is the one way out)
    pc = await c.where('#plotClose', root=None)
    c.note('plotterens egen 3D-knapp i planmodus', {'synlig': bool(pc)} if not pc else {'synlig': True, 'dekket': pc['cov'], 'w': pc['w'], 'h': pc['h']})
    await c.press('[data-pm="done"]', root='#pmBar', name='Ferdig')
    back = await c.wait("!PLANMAP.isOn() && DOCK.page === 'drift'", 5)
    t = await c.text()
    c.check(back and ('felt' in t and 'juksplass' in t), '«Ferdig» går tilbake til Driftsplan-siden med plassene', {'rad': (await c.where('.dr-rh[data-k="places"]') or {}).get('txt')})
    await c.shots('etter-kart', frame=('.dr-row.on',))


async def s05_garn(c):
    await c.setup(type='sjark', crew=NAMES[:2], equip=['garnhaler'], nets=12, rig='garn', gmark='garn')
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    rv = await c.where('.dr-rh[data-k="rig"]')
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden')
    await c.press('[data-pa="p2-add"][data-k="felt"]', name='+ Felt for garn')
    await c.press('[data-pa="p2-addp"]', name='forslaget')
    f0 = await c.js("(() => { const q = S.ops.places.find(q => q.k === 'felt'); return q && {n:q.n, soak:q.soak}; })()")
    await c.press('.dr-pl [data-pa="p2-ps"][data-d="1"]', name='+ ståtid')
    f1 = await c.js("(() => { const q = S.ops.places.find(q => q.k === 'felt'); return q && {n:q.n, soak:q.soak}; })()")
    c.check(rv and 'Garn' in rv['txt'] and f0 and f1 and f1['soak'] == f0['soak'] + 6, 'garn: raden sier garna, et felt fra merket, ståtida i steg på 6 t', {'rad': rv and rv['txt'], 'felt': [f0, f1]})
    await c.shots('plasser', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-start"]', name='Start planen')
    c.check(await c.wait("S.ops && S.ops.on", 30), 'garnplanen starter')


async def s06_teiner(c):
    await c.setup(type='sjark', crew=NAMES[:2], equip=['teinehaler'], pots=20, rig='teiner', gmark='teine')
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden')
    await c.press('[data-pa="p2-add"][data-k="felt"]', name='+ Felt for teiner')
    await c.press('[data-pa="p2-addp"]', name='forslaget')
    f = await c.js("(() => { const q = S.ops.places.find(q => q.k === 'felt'); return q && {n:q.n, soak:q.soak}; })()")
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden (lukk)')
    t = await c.text()
    agn = re.search(r'[Aa]gn', t)
    c.check(f and f['soak'] == 48 and bool(agn), 'teiner: et felt med 48 t ståtid, og dagen nevner agnet', {'felt': f, 'agn': agn and t[max(0, agn.start() - 60):agn.end() + 60]})
    await c.shots('dagen', frame=('.dr-pv',))


async def s07_uten_haler(c):
    await c.setup(type='sjark', crew=NAMES[:2], hyse=4, kits=0, rig='juksa', gmark='line')
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="rig"]', name='Redskap-raden')
    d = {}
    for g in ['line', 'garn', 'teiner']: d[g] = await c.where('[data-pa="p2-rig"][data-g="%s"]' % g)
    c.check(all(d[g] and d[g]['dis'] for g in d), 'uten haler er line, garn og teiner låst, med grunnen på knappen', {g: d[g] and d[g]['txt'] for g in d})
    t0 = await c.now_ms()
    await c.press('[data-pa="p2-rig"][data-g="line"]', tap_disabled=True, name='Line (låst)')
    ts = await c.toasts_since(t0)
    c.note('et trykk på en låst rigg', {'rig': await c.js("S.ops.rig"), 'toast': ts})
    await c.shots('laast', frame=('.dr-row.on',))
    # the hauler fitted (state), no buoy sets: line can be chosen, a field added, and the page says what is missing
    await c.js("S.equip.linehaler = true")
    await asyncio.sleep(0.9)
    await c.press('[data-pa="p2-rig"][data-g="line"]', name='Line')
    # U13: «Legg ut minst ett felt» is the way to the Plasser row
    gp = await c.press('[data-pa="p2-go"][data-go="places"]', name='grunnen (minst ett felt)', must=False)
    c.check(gp is not None and await c.has('.dr-row.on .dr-rh[data-k="places"]'), 'U13: grunnen «Legg ut minst ett felt» åpner Plasser-raden', None)
    if not await c.has('.dr-row.on .dr-rh[data-k="places"]'): await c.press('.dr-rh[data-k="places"]', name='Plasser-raden')
    await c.press('[data-pa="p2-add"][data-k="felt"]', name='+ Felt for line')
    await c.press('[data-pa="p2-addp"]', name='forslaget')
    await c.press('.dr-pl [data-pa="p2-pup"]:not([disabled])', name='↑ (feltet først, så lina settes straks)')
    t = await c.text(); st = await c.where('.dr-onoff')
    kit = 'blåsesett' in t
    way = await c.where('[data-pa="goplace"], [data-pa="open"][data-a="fiske"]')
    c.check(kit and st and st['dis'] and bool(way), 'U9: uten blåsesett er Start låst, med grunnen og veien til utstyrsbutikken', {'start': st and st['txt'], 'start_låst': st and st['dis'], 'veien': way and way['txt']})
    c.note('Start uten blåsesett', {'knapp': st and st['txt'], 'låst': st and st['dis']})
    await c.shots('uten-blaasesett', frame=('.dr-onoff',))
    # started anyway: what the page says when the line cannot be set
    if st and not st['dis']:
        await c.press('[data-pa="p2-start"]', name='Start planen (uten blåsesett)')
        await c.wait("S.ops && S.ops.on", 30)
        tr = []
        for h in range(5):
            await c.js(PLAY, 60); await asyncio.sleep(0.8); s = await c.js(NOWSTATE)
            tr.append([s['clock'], s['status'], s['step'], s['nowTxt']])
            print('    %s %-8s %-6s %-12s vent=%-6s steg=%-12s | %s' % (s['clock'], s['status'], s['opsK'], s['port'], s['wait'], s['step'], s['nowTxt']), flush=True)
        t = await c.text()
        warn = re.findall(r'Kunne ikke sette[^\n]*', t)
        c.note('planen startet uten blåsesett, fem timer etter', {'nå': tr[-1], 'advarsel': warn[:1], 'sett i sjøen': await c.js("mySets().length"), 'logg': await c.js("S.log.slice(-4).map(e => e.no)")})
        await c.shots('uten-blaasesett-etter', frame=('.dr-onoff',))


async def s08_levering(c):
    await c.setup(type='sjark', crew=NAMES[:2])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="land"]', name='Levering-raden')
    await c.shots('aapen', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-land-port"]', n=1, name='et valgt mottak (nr. 2)')
    v1 = (await c.where('.dr-rh[data-k="land"]'))['txt']; o1 = await c.js("({...S.ops.land})")
    await c.press('[data-pa="p2-land-when"][data-v="trip"]', name='Hver tur')
    v2 = (await c.where('.dr-rh[data-k="land"]'))['txt']
    await c.press('[data-pa="p2-land-when"][data-v="days"]', name='Hvert N. døgn')
    for k in range(7): await c.press('[data-pa="p2-land-days"][data-d="1"]', name='+ døgn', settle=0.05)
    o3 = await c.js("({...S.ops.land})"); v3 = (await c.where('.dr-rh[data-k="land"]'))['txt']
    await c.shots('hvert-n', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-land-mode"]', name='Nærmeste mottak')
    await c.press('[data-pa="p2-land-when"][data-v="full"]', name='Når lasten er full')
    o4 = await c.js("({...S.ops.land})")
    c.check(o1['mode'] == 'port' and o1['port'] and o3['when'] == 'days' and o3['days'] == 7 and o4 == {'mode': 'near', 'port': None, 'when': 'full', 'days': 7}, 'levering: valgt mottak, hver tur, hvert N. døgn (2–7) og tilbake til nærmeste og full last', {'rad': [v1, v2, v3], 'land': [o1, o3, o4]})


async def s09_vaer(c):
    await c.setup(type='sjark', crew=NAMES[:2])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="wx"]', name='Vær-raden')
    W = {}
    for k in ['safe', 'tough', 'normal']:
        await c.press('[data-pa="p2-wx-preset"][data-v="%s"]' % k, name='forhåndsvalg ' + k); W[k] = await c.js("({...S.ops.wx})")
    t0 = await c.now_ms()
    for k in range(10): await c.press('[data-pa="p2-wx-w"][data-d="1"]', name='+ vind', settle=0.05)
    for k in range(8): await c.press('[data-pa="p2-wx-h"][data-d="1"]', name='+ sjø', settle=0.05)
    top = await c.js("({...S.ops.wx, wmax:Math.round(BOAT.risk[2] || 20), hmax:Math.round(BOAT.risk[1] * 0.95 * 10) / 10})"); ts = await c.toasts_since(t0)
    on_preset = await c.js("[...document.querySelectorAll('#drawerBody [data-pa=\"p2-wx-preset\"].on')].length")
    c.check(W['safe'] == {'wind': 10, 'hs': 1.5} and top['wind'] == top['wmax'] and top['hs'] == top['hmax'], 'vær: forhåndsvalgene, og + stopper ved båtens grenser', {'valg': W, 'topp': top, 'toast_ved_grensen': ts})
    c.check(W['tough']['wind'] <= top['wmax'], '«Tøff» holder seg innenfor vinden + stopper ved (båtens grense)', {'Tøff': W['tough'], 'grense': top['wmax']})
    rv = await c.where('.dr-rh[data-k="wx"]')
    c.note('Vær-raden ved grensen', {'rad': rv and rv['txt'], 'forhåndsvalg_markert': on_preset})
    await c.shots('grense', frame=('.dr-row.on',))


async def s10_rytme_sjark(c):
    await c.setup(type='sjark', crew=NAMES[:2])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="rhythm"]', name='Rytme-raden')
    w = await c.where('[data-pa="p2-rhythm"][data-v="watch"]'); mu = await c.where('[data-pa="p2-rhythm"][data-v="multi"]')
    c.check(w and w['dis'] and 'fire om bord' in w['txt'] and mu and not mu['dis'], 'sjark med deg og to: døgndrift låst med grunn, flerdøgnstur åpen (køyer)', {'døgn': w and w['txt'], 'fler': mu and mu['txt']})
    await c.shots('laast', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-rhythm"][data-v="multi"]', name='Turer over flere døgn')
    days0 = await c.js("S.ops.days")
    await c.press('[data-pa="p2-days"][data-d="1"]', name='+ døgn')
    d0 = await c.js("S.ops.dep")
    await c.press('[data-pa="p2-dep"][data-d="1"]', name='+ ut kl.')
    o = await c.js("({rhythm:S.ops.rhythm, days:S.ops.days, dep:S.ops.dep})")
    rv = (await c.where('.dr-rh[data-k="rhythm"]'))['txt']
    c.check(o['rhythm'] == 'multi' and o['days'] == days0 + 1 and o['dep'] == d0 + 0.5, 'flerdøgnstur: døgn og avgang med −/+', {'ops': o, 'rad': rv})
    await c.shots('flerdogn', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-start"]', name='Start planen')
    c.check(await c.wait("S.ops && S.ops.on", 30), 'flerdøgnsturen starter')


async def s11_dogndrift(c, shots=True, play=True):
    """kyst15 with you and three crew (four hands, six bunks): round the clock from «Lag driftsplan» to a plan that runs."""
    await c.setup(type='kyst15', crew=NAMES[:3])
    m0 = c.mark()
    await c.open_drift()
    m1 = c.mark()
    await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="rhythm"]', name='Rytme-raden')
    w = await c.where('[data-pa="p2-rhythm"][data-v="watch"]')
    c.check(w and not w['dis'], 'døgndrift er åpen med fire om bord og seks køyer', w and w['txt'])
    await c.press('[data-pa="p2-rhythm"][data-v="watch"]', name='Døgndrift')
    if shots: await c.shots('valgt', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-start"]', name='Start planen')
    on = await c.wait("S.ops && S.ops.on", 30)
    c.check(on and await c.js("S.ops.rhythm") == 'watch', 'døgndriften starter', {'fra telefonen': c.since(m0), 'fra Lag driftsplan': c.since(m1)})
    res = {'fra_telefon': c.since(m0), 'fra_lag': c.since(m1), 'on': on}
    if play:
        trace = []
        for h in range(16):
            await c.js(PLAY, 60); await asyncio.sleep(0.85)
            s = await c.js(NOWSTATE); trace.append(s)
            print('    %s %-8s %-6s %-6s gop=%-4s vent=%-5s energi=%3s slit=%s hvil=%-5s steg=%-12s | %s | ← %s' % (s['clock'], s['status'], s['opsK'], s['port'], s['gop'], s['wait'], s['energy'], s['crewFat'], s['meRest'], s['step'], s['nowTxt'], s['arrow']), flush=True)
            if shots and h == 3: await c.shots('i-gang', frame=('.dr-now',))
        c.check(any(s['status'] != 'port' for s in trace), 'døgndriften går ut og fisker', [s['status'] for s in trace])
        if shots: await c.shots('kveld', frame=('.dr-pv',))
        res['trace'] = trace
    return res


async def s12_faa_koyer(c):
    await c.setup(type='breisjark', crew=NAMES[:4])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="rhythm"]', name='Rytme-raden')
    w = await c.where('[data-pa="p2-rhythm"][data-v="watch"]')
    c.check(w and w['dis'] and 'køyer til alle' in w['txt'], 'fem om bord og fire køyer: døgndrift låst med «køyer til alle (4 av 5)»', w and w['txt'])
    await c.shots('laast', frame=('.dr-row.on',))
    # you go ashore with a skipper and a mate appointed: four aboard, four bunks, and it opens
    await c.js("GUIASHORE(); setSkipper(S.crew[0].id); setMate(S.crew[1].id)"); await asyncio.sleep(0.9)
    w2 = await c.where('[data-pa="p2-rhythm"][data-v="watch"]')
    c.check(w2 and not w2['dis'], 'med deg i land er de fire om bord med fire køyer, og døgndrift åpner', w2 and w2['txt'])


async def s13_uten_koyer(c):
    await c.setup(type='snekke', crew=NAMES[:2])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="rhythm"]', name='Rytme-raden')
    w = await c.where('[data-pa="p2-rhythm"][data-v="watch"]'); mu = await c.where('[data-pa="p2-rhythm"][data-v="multi"]')
    c.check(w and w['dis'] and mu and mu['dis'] and 'køyer' in mu['txt'], 'snekke uten køyer: døgndrift og flerdøgnstur låst', {'døgn': w and w['txt'], 'fler': mu and mu['txt']})
    c.note('grunnen på døgndrift for en båt som verken har køyer eller plass til fire', w and w['txt'])
    await c.shots('rytme', frame=('.dr-row.on',))
    await c.press('.dr-rh[data-k="home"]', name='Hjem-raden')
    t = await c.text()
    c.check('hviler dårlig' in t and 'sover godt' in t, 'Hjem-raden skiller mellom der mannskapet sover godt og dårlig', None)
    await c.shots('hjem', frame=('.dr-row.on',))


async def s14_en_mann(c):
    await c.setup(type='trebat', crew=NAMES[:1])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    r1 = (await c.where('.dr-rh[data-k="crew"]'))['txt']
    await c.js("GUIASHORE()"); await asyncio.sleep(0.9)
    r2 = (await c.where('.dr-rh[data-k="crew"]'))['txt']
    await c.press('.dr-rh[data-k="crew"]', name='Mannskap-raden')
    t = await c.text(); st = await c.where('.dr-onoff')
    c.check('Du er skipper' in r1 and 'bare med deg' in r2 and 'bare én i mannskapet' in t, 'én-manns båt: «Du er skipper» om bord, «Går bare med deg om bord» i land', {'om bord': r1, 'i land': r2, 'start': st and st['txt']})
    await c.shots('i-land', frame=('.dr-onoff',))
    # only you, no crew at all, aboard
    await c.setup(type='trebat', crew=[])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    r3 = (await c.where('.dr-rh[data-k="crew"]'))['txt']; st = await c.where('.dr-onoff')
    await c.press('[data-pa="p2-start"]', name='Start planen')
    c.check('Du er skipper' in r3 and await c.wait("S.ops && S.ops.on", 30), 'bare deg, uten mannskap: «Du er skipper», og planen starter', {'rad': r3, 'start': st and st['txt']})
    dock = await c.js("DOCK.text()")
    c.note('dokka uten mannskap, med planen på', dock)


async def s15_stor_bat(c):
    await c.setup(type='autoliner', crew=NAMES[:4], equip=['linehaler'], bank=20, rig='line')
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="home"]', name='Hjem-raden')
    a = await c.where('[data-pa="p2-anchor"][data-v="1"]')
    await c.press('[data-pa="p2-anchor"][data-v="1"]', name='Til ankers nær havna')
    rv = (await c.where('.dr-rh[data-k="home"]'))['txt']
    c.check(a and await c.js("S.ops.anchor") is True and 'til ankers' in rv, 'stor båt (45 m): «Til ankers nær havna» velges, og raden sier det', rv)
    await c.shots('til-ankers', frame=('[data-pa="p2-anchor"]',))


async def s16_hjem(c):
    await c.setup(type='sjark', crew=NAMES[:2])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="home"]', name='Hjem-raden')
    opts = await c.js("[...document.querySelectorAll('#drawerBody [data-pa=\"p2-home\"]')].map(e => ({id:e.dataset.p, t:e.innerText.replace(/\\s+/g, ' ')}))")
    await c.shots('liste', frame=('.dr-row.on',))
    kinds = {}
    for o in opts:
        k = re.search(r'\(([^)]+)\)', o['t']); k = k.group(1) if k else '?'
        if k in kinds: continue
        await c.press('[data-pa="p2-home"][data-p="%s"]' % o['id'], name='hjem: ' + k)
        kinds[k] = {'id': o['id'], 'valgt': await c.js("S.ops.home") == o['id'], 'rad': (await c.where('.dr-rh[data-k="home"]'))['txt'], 'tekst': o['t']}
    c.check(all(v['valgt'] for v in kinds.values()) and {'rorbu', 'fiskemottak', 'naustet'} <= set(kinds), 'Hjem: naust, rorbu og mottakskai velges med trykk', kinds)
    c.note('hjem-typene i lista', [o['t'] for o in opts])


async def s17_i_drift(c):
    """A line and jig plan on a sjark with you aboard, started and played on: «Nå» and «I dag» against the engine, the statistics after a
    day, Pause, «Hent redskapet», a stop with the button that fixes it, and whether an opened «Mer» survives the page's own redraw."""
    await c.setup(type='sjark', crew=NAMES[:2], equip=['linehaler'], hyse=4, kits=6, rig='line', gmark='line', bait=40)
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden')
    await c.press('[data-pa="p2-add"][data-k="felt"]', name='+ Felt for line')
    await c.press('[data-pa="p2-addp"]', name='forslaget')
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden (lukk)')
    await c.press('[data-pa="p2-start"]', name='Start planen')
    on = await c.wait("S.ops && S.ops.on", 30)
    c.check(on, 'line- og juksplanen starter')
    trace, bad = [], []
    for h in range(26):
        await c.js(PLAY, 60); await asyncio.sleep(0.85)
        s = await c.js(NOWSTATE); trace.append(s)
        print('    %s %-8s %-6s %-12s gop=%-4s fisk=%-5s vent=%-6s energi=%3s slit=%s hvil=%-5s steg=%-12s | %s | ← %s' % (s['clock'], s['status'], s['opsK'], s['port'], s['gop'], s['fishing'], s['wait'], s['energy'], s['crewFat'], s['meRest'], s['step'], s['nowTxt'], s['arrow']), flush=True)
        for x in s['log']: print('        logg ' + x, flush=True)
        if trace[-2:-1] and trace[-2]['step'] != s['step'] and s['evs']: print('        dagen nå: ' + ' | '.join(s['evs'][:9]), flush=True)
        nt = s['nowTxt'] or ''
        # what the page says against what the boat does
        if s['gop'] and not re.search(r'Setter|Trekker', nt): bad.append([s['clock'], 'redskap i arbeid', nt])
        if s['fishing'] and not s['gop'] and not re.search(r'Jukser|Venter ved', nt): bad.append([s['clock'], 'fisker', nt])
        if s['status'] == 'port' and not s['land'] and re.search(r'På vei|Jukser|Setter|Trekker', nt): bad.append([s['clock'], 'i havn', nt])
        if s['status'] in ('sailing', 'auto', 'route') and re.search(r'Klar|Hviler', nt): bad.append([s['clock'], 'på vei', nt])
        if h == 2: await c.shots('naa-idag', frame=('.dr-now',))
        if h == 8: await c.shots('ettermiddag', frame=('.dr-pv',))
        if h == 16: await c.shots('natt', frame=('.dr-pv',))
    c.check(not bad, '«Nå» stemmer med det båten gjør, time for time i 26 t', bad[:6])
    # a day plan goes out in the morning: no departures in the evening and the night (the home here is a rorbu, as a new plan picks it)
    deps = await c.js("S.log.filter(e => e.t > S.t - 26 * 60 && /^Gikk ut på driftsplanen/.test(e.no || '')).map(e => driftClock(driftHod(e.t / 60)))")
    night = [d for d in deps if int(d[:2]) >= 20 or int(d[:2]) < 4]
    c.check(not night, 'dagdrift: ingen avganger mellom kl. 20 og 04 (hjem er en rorbu)', {'avganger': deps, 'hjem': await c.js("S.ops.home + ' rorbu=' + isRorbu(S.ops.home)")})
    c.check(any(s['arrow'] for s in trace), '«I dag» har pila «←» på steget båten er på', [s['arrow'] for s in trace][:8])
    # the statistics after a day
    sw = await c.where('.p2-stat')
    t = await c.text()
    stat = re.search(r'Levert\s+(\S+ kg)\s+(\S+ kg)\s+(\S+ kg)', t.replace('\xa0', ' '))
    c.check(sw is not None and stat is not None, 'statistikken etter et døgn', stat and stat.group(0))
    await c.shots('statistikk', frame=('.p2-stat',))
    # «Mer» on a long note, then the page redraws itself as the game goes on
    await c.press('.dr-rh[data-k="rig"]', name='Redskap-raden')
    f = await c.press('.dr-rb .ph-note.fold', must=False, name='«Mer» på Redskap-notatet')
    o1 = await c.js("!!document.querySelector('#drawerBody .dr-rb .ph-note.fold.open')")
    await c.js(PLAY, 5); await asyncio.sleep(1.6)
    o2 = await c.js("!!document.querySelector('#drawerBody .dr-rb .ph-note.fold.open')")
    rowo = await c.js("!!document.querySelector('#drawerBody .dr-row.on')")
    c.note('«Mer» åpnet, så tegner siden seg på nytt', {'fant_mer': bool(f), 'åpen': o1, 'åpen_etter': o2, 'raden_fortsatt_åpen': rowo})
    await c.press('.dr-rh[data-k="rig"]', name='Redskap-raden (lukk)')
    # a stop: the reason and the button that fixes it
    await c.js("S.ops.on = false; S.ops.stop = {t:S.t, k:'closed', no:'Felt 1 er stengt (test).', en:'Field 1 is closed (test).', fix:'places'}"); await asyncio.sleep(0.9)
    fx = await c.where('[data-pa="p2-fix"]')
    await c.shots('stoppet', frame=('.dr-onoff',))
    await c.press('[data-pa="p2-fix"]', name='Endre plassene')
    c.check(fx and await c.has('.dr-row.on .dr-rh[data-k="places"]'), 'stoppet plan: grunnen og knappen som åpner Plasser', fx and fx['txt'])
    return trace


async def s17b_hent(c):
    """The field first in the list, so the line goes out at the start of the day: Pause with the line in the sea, and «Hent redskapet»."""
    await c.setup(type='sjark', crew=NAMES[:2], equip=['linehaler'], hyse=4, kits=6, rig='line', gmark='line', bait=40)
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden')
    await c.press('[data-pa="p2-add"][data-k="felt"]', name='+ Felt for line')
    await c.press('[data-pa="p2-addp"]', name='forslaget')
    await c.press('.dr-pl [data-pa="p2-pup"]:not([disabled])', name='↑ (feltet først)')
    await c.press('.dr-rh[data-k="places"]', name='Plasser-raden (lukk)')
    await c.press('[data-pa="p2-start"]', name='Start planen')
    await c.wait("S.ops && S.ops.on", 30)
    n = 0
    while n < 40 and await c.js("!mySets().length"):
        await c.js(PLAY, 30); n += 1
    await c.js(PLAY, 30); await asyncio.sleep(0.9)
    c.note('lina i sjøen etter', {'min': n * 30 + 30, 'nå': (await c.js(NOWSTATE))['nowTxt']})
    # pause, and the gear in the sea: «Hent redskapet»
    await c.press('[data-pa="p2-pause"]', name='Pause')
    off = await c.js("!S.ops.on")
    sets = await c.js("mySets().length")
    fb = await c.where('[data-pa="p2-fetch"]')
    c.check(off and sets > 0 and fb is not None, 'Pause slår planen av; redskap i sjøen gir «Hent redskapet»', {'i sjøen': sets, 'knapp': fb and fb['txt']})
    await asyncio.sleep(0.9)
    ps = await c.js(NOWSTATE)
    c.note('etter Pause: hva båten gjør og hva siden viser', {'status': ps['status'], 'tur': ps['opsK'], 'nå-linja': ps['nowTxt'], 'pila': ps['arrow'], 'overskrift': ps['label']})
    c.check(ps['status'] in ('idle', 'port') and not ps['opsK'] and 'pause' in (ps['nowTxt'] or '').lower() and not ps['arrow'], 'U4: Pause stopper båten der den er, og siden sier det (ikke «I dag ←»)', {'status': ps['status'], 'tur': ps['opsK'], 'nå-linja': ps['nowTxt'], 'pila': ps['arrow'], 'overskrift': ps['label']})
    await c.shots('pause', frame=('.dr-onoff',))
    if fb:
        await c.press('[data-pa="p2-fetch"]', name='Hent redskapet')
        await c.wait("S.ops.on", 20)
        fetch_on = await c.js("!!S.ops.fetch")
        await c.shots('henter', frame=('.dr-now',))
        n = 0
        while n < 30 and await c.js("S.ops.on"):
            await c.js(PLAY, 60); n += 1
        await asyncio.sleep(0.9)
        r = await c.js("({sets:mySets().length, on:S.ops.on, fetch:S.ops.fetch, port:S.boat.port})")
        c.check(fetch_on and r['sets'] == 0 and not r['on'], '«Hent redskapet» henter lina og slår planen av', {'timer': n, **r})
        await c.shots('hentet', frame=('.dr-onoff',))


async def s18_kopier_slett(c):
    await c.setup(type='sjark', crew=NAMES[:2], fleet=['sjark'])
    await c.open_drift(); await c.press('[data-pa="p2-new"]', name='Lag driftsplan')
    t0 = await c.now_ms()
    await c.press('[data-pa="p2-copy"]', name='kopier-knappen')
    ts = await c.toasts_since(t0)
    cp = await c.js("(() => { const v = S.fleet.find(v => v.id !== S.cur); const o = v && vget(v, 'ops'); return o ? {v:o.v, on:o.on, places:o.places.length} : null; })()")
    c.check(cp and cp['v'] == 4 and not cp['on'], 'kopier til en annen båt med ett trykk, og toasten sier det', {'kopi': cp, 'toast': ts})
    await c.shots('kopier', frame=('[data-pa="p2-reset"]',))
    # P7: the game's own dialog, with the boat's name and what becomes of the gear in the sea
    d0 = len(c.dialogs)
    await c.press('[data-pa="p2-reset"]', name='Slett driftsplanen')
    await asyncio.sleep(0.3)
    box = await c.text(root='#modal')
    await c.shots('slett-dialog', frame=('#modal .box',))
    await c.press('[data-close]', root='#modal', name='Behold planen')
    await asyncio.sleep(0.3)
    kept = await c.js("!!S.ops") and await c.js("document.getElementById('modal').hidden")
    await c.press('[data-pa="p2-reset"]', name='Slett driftsplanen')
    await c.press('#p2Del', root='#modal', name='Slett planen')
    await asyncio.sleep(0.4)
    gone = await c.js("!S.ops") and await c.has('[data-pa="p2-new"]')
    named = bool(box) and await c.js("S.boatName") in box and ('i sjøen' in box)
    c.check(kept and gone and named and len(c.dialogs) == d0, 'P7: Slett spør i spillets egen dialog med båtens navn og redskapet i sjøen: «Behold» beholder planen, «Slett» sletter den', {'dialog': (box or '')[:200], 'nettleserdialoger': len(c.dialogs) - d0})


async def s19_rederi(c):
    await c.setup(type='sjark', crew=NAMES[:2], ashore=True, sk=True, mate=True)
    # a plan that has stopped (state): the dot on the Crew button, the phone's home and the Rederi app
    await c.js("S.ops = PLAN2UI.fresh(); S.ops.on = false; S.ops.stop = {t:S.t, k:'closed', no:'Felt 1 er stengt (test).', en:'Field 1 is closed (test).', fix:'places'}; refreshAll()"); await asyncio.sleep(0.8)
    dot = await c.js("!!document.querySelector('#dock [data-dk=\"arbeid\"] .dk-dot')")
    c.check(dot, 'prikken på Mannskap-knappen når planen har stoppet')
    await c.shots('prikk', fmts=FMTS)
    await c.open_phone(); await asyncio.sleep(0.4)
    home = await c.text('#phView')
    c.note('telefonens hjem', re.findall(r'Rederiet\s*\n?\s*Trenger deg[^\n]*', home))
    await c.press('.ph-app[data-a="rederi"]', root='#phView', name='Rederi-appen')
    await asyncio.sleep(0.5)
    t = await c.text('#phView')
    c.check('Driftsplanen har stoppet' in t, 'Rederi-siden sier at driftsplanen har stoppet', re.findall(r'Driftsplanen[^\n]*', t)[:3])
    await c.shots('rederi', root='#phView', frame=('h4', 'Trenger deg'))
    # the alert's «Åpne» opens the plan
    r = await c.press('[data-pa="goto"][data-a="drift"]', root='#phView', must=False, name='«Åpne» på varselet')
    ok = await c.wait("DOCK.page === 'drift'", 4)
    c.check(r and ok, 'varselets «Åpne» på Rederi-siden går til planen', {'skuff': await c.js("DOCK.page"), 'telefon': await c.js("PHONE.isOpen()")})
    await c.press('#drawerClose', root=None, must=False, name='lukk skuffen')
    if await c.js("PHONE.isOpen()"): await c.press('[data-pa="close"]', root='#phone', must=False, name='lukk telefonen')
    await asyncio.sleep(0.5)
    # the Crew page from the dock: the plan's line says it has stopped, «Åpne» goes there
    await c.press('[data-dk="arbeid"]', root='#dock', name='Mannskap i dokka')
    await c.wait("DOCK.page === 'arbeid'", 5)
    ln = await c.where('.dr-line')
    await c.press('[data-pa="open"][data-a="drift"]', name='Åpne (Driftsplan-linja)')
    c.check(ln and 'Stoppet' in ln['txt'] and await c.wait("DOCK.page === 'drift'", 5), 'Mannskap-siden: linja sier «Stoppet» og «Åpne» går til planen', ln and ln['txt'])


async def s20_engelsk(c):
    await c.setup(type='sjark', crew=NAMES[:2], equip=['linehaler'], hyse=4, bank=10, kits=6, rig='line', gmark='line', lang='en')
    await c.open_drift()
    await c.press('[data-pa="p2-new"]', name='Make a plan')
    await c.shots('ny', frame=('.dr-onoff',))
    await c.press('.dr-rh[data-k="places"]', name='Places')
    await c.press('[data-pa="p2-add"][data-k="felt"]', name='+ Field')
    await c.press('[data-pa="p2-addp"]', name='suggestion')
    await c.shots('plasser', frame=('.dr-row.on',))
    await c.press('[data-pa="p2-map"]', name='Choose in the chart …')
    await c.wait("PLANMAP.isOn()", 5); await asyncio.sleep(0.5)
    f = await c.js("(() => { const q = S.ops.places.find(q => q.k === 'felt'); return {x:q.x, y:q.y}; })()")
    await c.map_tap(f)
    await c.shots('kort', root=None)
    texts = {k: v for k, v in c.texts.items() if k.startswith(c.scn)}
    names = set(w for n in await c.js("PORTS.map(p => p.name).concat(S.crew.map(c => c.name), [S.boatName])") for w in re.split(r'[\s,()«»]+', n) if w)
    nor = set()
    for k, v in texts.items():
        for part in v.values():
            for w in re.findall(r"[A-Za-zÆØÅæøå]*[ÆØÅæøå][A-Za-zÆØÅæøå]*|\b(?:[Hh]yseline|[Bb]ankline|stamper?|felt|juksplass|og|kl|Ståtid|Lenka|fri|hjem|Juksa|Dagen|nm fra)\b|\b\d+ t\b", part):
                if w not in names: nor.add(w)
    c.check(not nor, 'engelsk: ingen norske ord på siden, i lista og på kortet', sorted(nor)[:40])
    await c.press('[data-pm="done"]', root='#pmBar', name='Done')


SCN = [('S01', 's01-dagdrift', s01_dagdrift), ('S02', 's02-ikke-klar', s02_ikke_klar), ('S03', 's03-line', s03_line), ('S04', 's04-kart', s04_kart),
       ('S05', 's05-garn', s05_garn), ('S06', 's06-teiner', s06_teiner), ('S07', 's07-uten-haler', s07_uten_haler), ('S08', 's08-levering', s08_levering),
       ('S09', 's09-vaer', s09_vaer), ('S10', 's10-flerdogn', s10_rytme_sjark), ('S11', 's11-dogndrift', s11_dogndrift), ('S12', 's12-faa-koyer', s12_faa_koyer),
       ('S13', 's13-uten-koyer', s13_uten_koyer), ('S14', 's14-en-mann', s14_en_mann), ('S15', 's15-stor-bat', s15_stor_bat), ('S16', 's16-hjem', s16_hjem),
       ('S17', 's17-i-drift', s17_i_drift), ('S17b', 's17b-hent', s17b_hent), ('S18', 's18-kopier-slett', s18_kopier_slett), ('S19', 's19-rederi', s19_rederi), ('S20', 's20-engelsk', s20_engelsk)]


async def main():
    T0 = time.time()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        ctx = await b.new_context(viewport={'width': FMTS[0][0], 'height': FMTS[0][1]}, has_touch=True)
        pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
        c = Ctl(pg, cdp)
        pg.on('pageerror', lambda e: c.errs.append({'scn': c.scn, 'type': 'pageerror', 'msg': str(e)[:300]}))
        pg.on('console', lambda m: c.errs.append({'scn': c.scn, 'type': 'console.error', 'msg': m.text[:300]}) if m.type == 'error' else None)
        def dlg(d):
            c.dialogs.append({'scn': c.scn, 'msg': d.message, 'svar': 'ja' if c.accept else 'avbryt'})
            asyncio.ensure_future(d.accept() if c.accept else d.dismiss())
        pg.on('dialog', dlg)
        await boot(pg)
        await pg.evaluate(GUIJS)
        counts = {}
        for sid, scn, fn in SCN:
            if ONLY and sid not in ONLY: continue
            c.scn = scn; t = time.time()
            try:
                r = await fn(c)
                if sid in ('S01', 'S11'): counts[sid + ' 800x1280'] = r
            except Exception as e:
                c.check(False, 'scenarioet stoppet: ' + repr(e)[:300])
            print('  (%s: %.0f s)' % (scn, time.time() - t), flush=True)
        # the taps to a running plan in the two other formats (no screenshots)
        if not ONLY or 'S01' in ONLY or 'S11' in ONLY:
            for f in FMTS[1:]:
                await c.set_fmt(f)
                for sid, scn, fn in [('S01', 's01-dagdrift', s01_dagdrift), ('S11', 's11-dogndrift', s11_dogndrift)]:
                    if ONLY and sid not in ONLY: continue
                    c.scn = scn + '-%dx%d' % f
                    try:
                        r = await (fn(c, shots=False) if sid == 'S01' else fn(c, shots=False, play=False))
                        counts['%s %dx%d' % (sid, f[0], f[1])] = r
                    except Exception as e:
                        c.check(False, 'scenarioet stoppet: ' + repr(e)[:300])
            await c.set_fmt(FMTS[0])
        print('\nTrykk til en plan som går:')
        for k, v in counts.items(): print('  %-18s fra telefonen %s · fra «Lag driftsplan» %s' % (k, v.get('fra_telefon'), v.get('fra_lag')))
        # the measurements, per format: one line each (the details are in maalinger.json)
        c.scn = 'maalinger'
        print('\nMålinger per format (tilstander med funn / alle):')
        for f in FMTS:
            fm = '%dx%d' % f; M = [m for m in c.meas if m['fmt'] == fm]
            if not M: continue
            def where(pred):
                return sorted({m['scn'] + '/' + m['state'] for m in M if pred(m)})
            small = sorted({re.sub(r' \(×\d+\)$', '', x) for m in M for x in m['small']})
            ov = lambda m, pat: [x for x in m['overlap'] if re.search(pat, x)]
            print('  %-9s tilstander %d · sideveis overflyt %d · panel over kanten %d · overlapp %d · kuttet tekst %d · knapper utenfor %d · små trykkflater (ulike) %d' % (fm, len(M), len(where(lambda m: m['docOverflow'])), len(where(lambda m: m['panels'])), len(where(lambda m: m['overlap'])), len(where(lambda m: m['clipped'])), len(where(lambda m: m['off'])), len(small)))
            c.check(not where(lambda m: m['docOverflow'] or m['panels']), fm + ': ingen sideveis overflyt på siden eller i panelene', where(lambda m: m['docOverflow'] or m['panels']))
            c.check(not where(lambda m: ov(m, r'^pmBar×pmCard')), fm + ': planlista og kortet dekker ikke hverandre', where(lambda m: ov(m, r'^pmBar×pmCard')))
            c.check(not where(lambda m: ov(m, r'valgt nål')), fm + ': kortet dekker ikke den valgte nåla', where(lambda m: ov(m, r'valgt nål')))
            c.check(not where(lambda m: ov(m, r'^pm(Bar|Card)×(?!div#ecdisTop|nål|valgt)')), fm + ': planlista og kortet dekker ikke plotterens egne knapper', sorted({x for m in M for x in ov(m, r'^pm(Bar|Card)×(?!div#ecdisTop|nål|valgt)')}))
            c.check(not where(lambda m: ov(m, r'^drawer×(div\.cf|button\.dk)')), fm + ': skuffen er ikke dekket av fangstlista eller dokka', {'tilstander': where(lambda m: ov(m, r'^drawer×(div\.cf|button\.dk)')), 'hva': sorted({x for m in M for x in ov(m, r'^drawer×(div\.cf|button\.dk)')})})
            c.check(not where(lambda m: m['clipped']), fm + ': ingen kuttet tekst', sorted({x for m in M for x in m['clipped']})[:8])
            c.check(not where(lambda m: m['off']), fm + ': ingen knapper utenfor skjermen', sorted({x for m in M for x in m['off']})[:8])
            c.check(not small, fm + ': trykkflatene er minst 44 × 44 px (docs/planer/ui-redesign.md)', small)
        known = [e for e in c.errs if not ('401' in e['msg'] and e['type'] == 'console.error')]
        print('\ndekkede trykk:', len(c.covered), c.covered[:6])
        print('dialoger:', c.dialogs)
        print('konsollfeil fra skyen (401, ventet uten innlogging):', sum(1 for e in c.errs if '401' in e['msg']))
        with open(os.path.join(OUT, 'maalinger.json'), 'w') as fh:
            json.dump({'meas': c.meas, 'counts': counts, 'notes': c.notes, 'covered': c.covered, 'errs': c.errs, 'dialogs': c.dialogs, 'texts': c.texts}, fh, ensure_ascii=False, indent=1)
        c.check(not known, 'ingen sidefeil (pageerror/console.error, utenom skyens 401)', known[:4])
        print('\nOK %d · FEIL %d · %.0f s' % (c.nok, c.nfeil, time.time() - T0))
        print('sidefeil:', [e for e in known][:6])
        await b.close()

asyncio.run(main())
