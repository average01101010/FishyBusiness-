"""Fiskeplay (05.11.2026): a Playwright player tries every piece of fishing gear in «Det Store Blå» in different scenarios, for a review
of whether it all works and of the UX, UI and GUI (Jonas: «La en playwright-agent prøve spillet. Den må prøve å fiske med alle redskapene
i ulike scenarioer»). The player taps what a player taps (the dock, its fans, the drawer, the chart's «Sett ut», the jig game's «Rykk»),
reads what stands on the screen, and finds buttons by their text, as a person does. Only the scenario itself is set up by script: the
place and the date, money for the gear, and the hours the gear soaks (stepped with step(), the game's own minute). Each scenario starts
on a fresh page. A picture of each step lands in tests/out/fiskeplay/<format>/<scenario>/NN_<step>.png, and what was seen (the buttons,
the dock's text, the toasts, the deck log, the catch, page errors and where a tap landed on something else) in steps.json beside it.

  python3 tests/fiskeplay.py                 all scenarios, landscape 1280×800, without drawing 3D (fast)
  python3 tests/fiskeplay.py jig line        only the scenarios named
  KYST_FP_FMT=staaende python3 tests/fiskeplay.py      upright 800×1280
  KYST_FP_3D=1 python3 tests/fiskeplay.py jig3d        with 3D (slow under SwiftShader: about 30 s a picture)
"""
import asyncio, json, os, sys, time
from _env import GAME_TUT, boot, OUT
from playwright.async_api import async_playwright

FMT = os.environ.get('KYST_FP_FMT', 'liggende')
W, H = (1280, 800) if FMT == 'liggende' else (800, 1280)
D3 = os.environ.get('KYST_FP_3D') == '1'
URL = GAME_TUT + ('#notut' if D3 else '#notut,no3d')
ROOT = os.path.join(OUT, 'fiskeplay', FMT + ('-3d' if D3 else ''))

# the game's side of the player: toasts are recorded as they come, and FP has the scenario's set-up and the reading of the screen
HOOK = r"""(() => {
  if (window.FP) return;
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.jig-btn')){ const n = document.querySelector('#jigUI .jn'); window.__needle = n && n.style.left; window.__pd = performance.now(); } }, true);
  window.__T = []; const t0 = toast; toast = function(m, ms){ try { window.__T.push({t:S.t, m:String(m)}); } catch (e){} return t0.apply(this, arguments); };
  const vis = e => { if (!e || !e.getClientRects().length) return false; const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false; for (let p = e; p; p = p.parentElement) if (p.hidden) return false; return true; };
  const txt = e => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
  const SEEN = new WeakSet(); for (const x of S.log) SEEN.add(x); for (const x of S.msgs) SEEN.add(x);
  const fresh = a => a.filter(x => x && typeof x === 'object' && !SEEN.has(x) && (SEEN.add(x), true));
  window.FP = {
    vis, txt,
    // the visible buttons in a part of the screen, with their text and whether they can be used
    buttons(sel){ const out = []; for (const r of document.querySelectorAll(sel)) for (const b of r.querySelectorAll('button, [data-pa], [data-dk], [data-sb]')){ if (!vis(b) || (b.tagName !== 'BUTTON' && !b.dataset.pa && !b.dataset.dk)) continue; const t = txt(b); if (!t) continue; out.push((b.disabled || b.getAttribute('aria-disabled') === 'true' || b.classList.contains('off') ? '⊘ ' : '') + t.slice(0, 70)); } return out; },
    // what a player sees and what the game holds: the dock, the drawer, the toasts and the log since last time
    read(){
      const b = S.boat, H0 = S.t / 60, hs = (() => { try { return +hsAt(b.pos, H0).toFixed(1); } catch (e){ return null; } })();
      const dr = document.getElementById('drawer'), drOpen = dr && document.body.classList.contains('drawer') || (dr && vis(dr) && !dr.hidden);
      const T = window.__T.splice(0), L = fresh(S.log).map(x => x[S.lang] || x.no), M = fresh(S.msgs).map(m => m.from + ': ' + (m[S.lang] || m.no));
      const hold = {}; for (const x of S.hold) hold[x.sp] = +((hold[x.sp] || 0) + x.kg).toFixed(1);
      return {time:new Date(EPOCH + S.t * 60000).toISOString().slice(0, 16).replace('T', ' '), st:b.status, port:b.port, type:b.type, rig:rigOf(), cash:Math.round(S.cash),
        hs, energy:Math.round(S.energy), hold, holdKg:Math.round(holdTotal()), cap:Math.round(capHold()), deck:Math.round(deckPending()), gop:b.gop ? (b.gop.kind || b.gop.op || 'op') : null,
        sets:mySets().map(s => [s.kind, s.lk || s.ty || s.pot || s.mesh || '', s.n, +((S.t - s.tSet) / 60).toFixed(1)]),
        dock:FP.buttons('#dock'), fan:vis(document.getElementById('dockFan')) ? FP.buttons('#dockFan') : [], info:txt(document.getElementById('dockInfo')),
        drawer:drOpen ? txt(document.getElementById('drawerTitle')) : null, toasts:T.map(x => x.m), log:L, msgs:M,
        setbar:vis(document.getElementById('setBar')) ? txt(document.getElementById('setBar')) : null,
        sleep:vis(document.getElementById('sleep')), jig:window.JIGG ? JIGG.state().st + (window.jigActive ? ' (on)' : '') : null};
    },
    hudText(){ const e = document.getElementById('hud'); return e ? txt(e) : ''; },
    drawerText(){ const e = document.getElementById('drawerBody'); return e && vis(e) ? txt(e).slice(0, 3000) : ''; },
    // the scenario: a date, money, a vessel, a place
    date(y, m, d, h){ S.t = Math.round((Date.UTC(y, m - 1, d, h) - EPOCH) / 60000); refreshAll(); },
    cash(kr){ S.cash = kr; refreshAll(); },
    async port(id){ const p = portById(id), b = S.boat; await mapNeed(p.p, MAPD.simR); S.plan = null; b.status = 'port'; b.port = id; b.pos = {x:p.p.x, y:p.p.y}; b.v = 0; b.gop = null; b.land = null; if (typeof DOCK !== 'undefined') DOCK.close(); refreshAll(); return p.name; },
    vessel(type){ const b = S.boat; b.type = type; applyVessel(); b.fuel = BOAT.fuelCap; refreshAll(); return {len:VESSELS[type].len, crewMax:BOAT.crewMax, gearMax:BOAT.gearMax, cap:Math.round(capHold())}; },
    async sea(p, hdg){ const b = S.boat; await mapNeed(p, MAPD.simR); S.plan = null; b.status = 'idle'; b.port = null; b.pos = {x:p.x, y:p.y}; b.v = 0; b.gop = null; b.heading = hdg == null ? b.heading || 0 : hdg; if (typeof DOCK !== 'undefined') DOCK.close(); refreshAll(); },
    // a spot at sea within r km of c, between two depths, where sp stands thickest now (or anywhere at that depth when sp is null)
    async spot(c, r, d0, d1, sp){ await mapNeed(c, MAPD.simR); const H0 = S.t / 60; let best = null, bv = -1;
      for (let i = 0; i <= 24; i++) for (let k = 0; k < Math.max(1, i * 8); k++){ const a = k / Math.max(1, i * 8) * 2 * Math.PI, q = {x:c.x + Math.cos(a) * r * i / 24, y:c.y + Math.sin(a) * r * i / 24};
        try { if (isLand(q)) continue; const d = depthF(q); if (!(d >= d0 && d <= d1)) continue; let ok = true; for (let j = 0; j < 8 && ok; j++){ const t = j / 8 * 2 * Math.PI; if (isLand({x:q.x + Math.sin(t) * 0.25, y:q.y - Math.cos(t) * 0.25})) ok = false; } if (!ok) continue;
        const v = sp ? density(sp, q, H0) : 1; if (v > bv){ bv = v; best = q; } } catch (e){ /* a block not loaded: past the sim's reach */ } }
      return best && {x:best.x, y:best.y, depth:Math.round(depthF(best)), dens:sp ? +bv.toFixed(3) : null}; },
    // the minutes go as the game's own clock steps them; the player wakes up when the game puts him to sleep, if awake is set
    // (the manoeuvring model is set aside while minutes are stepped, as the game does when it plays time caught up: catchUp)
    play(min, o){ o = o || {}; let n = 0, slept = 0; const st0 = S.boat.status; if (typeof DYN !== 'undefined') DYN.on = false;
      for (; n < min; n++){ if (o.awake && S.energy < 35){ S.energy = 80; slept++; } step(); if (o.until && o.until()) break; }
      refreshAll(); return {n, slept, from:st0, to:S.boat.status}; },
    near(id){ const s = (S.sets || []).find(x => x.id === id); return s; },
  };
})()"""


class Player:
    def __init__(self, br, name):
        self.br, self.name = br, name
        self.dir = os.path.join(ROOT, name); os.makedirs(self.dir, exist_ok=True)
        for f in os.listdir(self.dir):
            if f.endswith('.png'): os.remove(os.path.join(self.dir, f))
        self.steps, self.errs, self.n, self.notes = [], [], 0, []

    async def start(self):
        self.ctx = await self.br.new_context(viewport={'width': W, 'height': H}, has_touch=True)
        self.pg = await self.ctx.new_page(); self.cdp = await self.ctx.new_cdp_session(self.pg)
        self.pg.on('pageerror', lambda e: self.errs.append({'at': self.n, 'err': (getattr(e, 'stack', '') or str(e))[:500]}))
        self.pg.on('dialog', lambda d: asyncio.ensure_future(self._dialog(d)))
        t = time.time(); await boot(self.pg, URL); await self.pg.evaluate(HOOK)
        if D3: await self.pg.wait_for_function("G3.isActive()", timeout=120000)
        await self.pg.evaluate("S.mult = 1; S.settings.autoOn = false")
        self.note('boot', 'game started in %.0f s' % (time.time() - t))

    async def _dialog(self, d):
        self.note('dialog', d.message[:300]); await d.accept()

    def note(self, kind, text):
        self.notes.append({'at': self.n, 'kind': kind, 'text': text}); print('   [%s] %s' % (kind, text), flush=True)

    async def js(self, code, *a):
        return await self.pg.evaluate(code, *a)

    async def read(self):
        return await self.js("JSON.stringify(FP.read())")

    async def shot(self, name, note='', drawer=False):
        self.n += 1; f = '%02d_%s.png' % (self.n, name)
        await self.pg.wait_for_timeout(350)
        try: await self.pg.screenshot(path=os.path.join(self.dir, f), timeout=120000)
        except Exception as e: self.note('shot', 'failed %s %s' % (name, e))
        r = json.loads(await self.read())
        if drawer: r['drawerText'] = await self.js("FP.drawerText()")
        r['hud'] = (await self.js("FP.hudText()"))[:400]
        self.steps.append({'f': f, 'note': note, 'seen': r})
        print('  %s %s | %s | dock=%s | info=%s | toasts=%s' % (self.name, f, note[:70], r['dock'], r['info'][:80], r['toasts']), flush=True)
        return r

    # ---- touching the screen as a finger does (CDP touch, as tut.py and uiplay.py): what is on top at that point gets it
    async def tap_xy(self, x, y):
        await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.06)
        await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.3)

    async def drag(self, x0, y0, x1, y1, n=8):
        await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0, 'id': 0}]})
        for i in range(1, n + 1):
            await asyncio.sleep(0.04); await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * i / n, 'y': y0 + (y1 - y0) * i / n, 'id': 0}]})
        await asyncio.sleep(0.05); await self.cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.4)

    # the element's centre after it is scrolled into view, and what the finger would really touch there
    LOCATE = """([sel, text, scope]) => {
      const vis = FP.vis, txt = FP.txt; let el = null;
      if (text != null){ const low = text.toLowerCase(); const cands = [...document.querySelectorAll((scope || 'body') + ' button, ' + (scope || 'body') + ' [data-pa], ' + (scope || 'body') + ' [data-dk]')].filter(e => vis(e) && txt(e).toLowerCase().includes(low));
        cands.sort((a, b) => txt(a).length - txt(b).length); el = cands[0] || null; }
      else el = [...document.querySelectorAll(sel)].find(vis) || null;
      if (!el) return null;
      el.scrollIntoView({block:'center', inline:'center'});
      const q = el.getBoundingClientRect(), x = q.x + q.width / 2, y = q.y + q.height / 2, top = document.elementFromPoint(x, y);
      const hit = top && (top === el || el.contains(top));
      return {x, y, w:q.width, h:q.height, text:txt(el).slice(0, 60), dis:!!(el.disabled || el.getAttribute('aria-disabled') === 'true'), hit, top:hit ? null : top ? (top.id || top.className || top.tagName) + ' «' + txt(top).slice(0, 40) + '»' : 'nothing'};
    }"""

    async def tap(self, sel=None, text=None, scope=None, must=True):
        r = await self.js(self.LOCATE, [sel, text, scope])
        what = sel or ('«%s»' % text)
        if not r:
            if must: self.note('missing', 'no visible %s%s' % (what, (' in ' + scope) if scope else ''))
            return None
        if r['w'] < 40 or r['h'] < 32: self.note('small', '%s is %dx%d px (under 44 px for a finger)' % (r['text'], r['w'], r['h']))
        if not r['hit']: self.note('covered', '%s is covered at its centre by %s' % (r['text'], r['top']))
        await self.tap_xy(r['x'], r['y'])
        return r

    async def dock(self, dk, must=True): return await self.tap('#dock [data-dk="%s"]' % dk, must=must)
    async def fan(self, text, must=True): return await self.tap(text=text, scope='#dockFan', must=must)
    async def drw(self, text, must=True): return await self.tap(text=text, scope='#drawer', must=must)

    async def play(self, minutes, awake=True, until=None):
        r = await self.js("([m, a, u]) => FP.play(m, {awake:a, until:u ? new Function('return (' + u + ')') : null})", [minutes, awake, until])
        if r['slept']: self.note('energy', 'the skipper was too tired %d times while %d minutes went; energy set to 80 (scenario shortcut)' % (r['slept'], r['n']))
        return r

    async def close(self):
        json.dump({'scenario': self.name, 'format': FMT, 'd3': D3, 'steps': self.steps, 'notes': self.notes, 'pageerrors': self.errs},
                  open(os.path.join(self.dir, 'steps.json'), 'w'), ensure_ascii=False, indent=1)
        if self.errs: print('  PAGE ERRORS', self.name, json.dumps(self.errs, ensure_ascii=False)[:1500])
        await self.ctx.close()


SCEN = {}
def scenario(f): SCEN[f.__name__] = f; return f

# ===== the scenarios =====
async def to_sea(pl, near, r, d0, d1, sp, why):
    """Out to a spot at sea (the sail there is skipped: the chart and Autonav are tested by trip2 and autonavtest)."""
    q = await pl.js("async ([n, r, d0, d1, sp]) => { const c = typeof n === 'string' ? portById(n).p : P(n[0], n[1]); return await FP.spot(c, r, d0, d1, sp); }", [near, r, d0, d1, sp])
    if not q: pl.note('setup', 'found no spot %s m deep near %s' % ((d0, d1), near)); return None
    await pl.js("p => FP.sea(p)", q); pl.note('setup', 'out to %s m deep near %s (%s); the sail is skipped' % (q['depth'], near, why))
    return q

async def land(pl, mottak):
    """In to a fish plant and land the catch through Mottak › Lever, as a player does."""
    await pl.js("id => FP.port(id)", mottak); pl.note('setup', 'in at %s (the sail in is skipped)' % mottak)
    await pl.shot('mottak', 'at the fish plant quay with the catch aboard')
    await pl.dock('marked'); await pl.shot('mottak-vifte', 'the plant fan')
    await pl.fan('Lever'); await pl.shot('lever-side', 'the landing page', drawer=True)
    c0 = await pl.js("S.cash")
    r = await pl.tap('#drawer [data-act="sell"]', must=False) or await pl.drw('Lever', must=False)
    await pl.shot('lever-trykket', 'right after the landing button', drawer=True)
    p = await pl.play(240, until="!S.boat.land && S.sales && S.sales.length")
    await pl.shot('levert', 'when the landing is done (%d min)' % p['n'], drawer=True)
    await pl.pg.wait_for_timeout(3000); await pl.shot('sluttseddel', 'the landing note printed out, 3 s later', drawer=True)
    await pl.js("() => { const b = document.getElementById('drawerBody'); const t = [...b.querySelectorAll('td')].find(x => /Inndratt|Sum/.test(x.textContent)); if (t) t.scrollIntoView({block:'center'}); }")
    await pl.shot('sluttseddel-bunn', 'the foot of the landing note: confiscation, fees and the sum', drawer=True)
    sale = await pl.js("JSON.stringify(S.lastSale ? {kr:Math.round(S.lastSale.total || S.lastSale.sum || 0), lines:(S.lastSale.lines || []).map(r => [r.sp, r.g, +(r.kg || 0).toFixed(1), Math.round(r.sum || 0)])} : null)")
    pl.note('sale', 'cash %d -> %d; %s' % (c0, await pl.js("Math.round(S.cash)"), sale))


@scenario
async def jig(pl):
    """A new player's day with the hand jig: the start at Finnsnes, out on a cod spot off Senja on 1 March, the jig's card, a run of hours,
    the jig game («Jukse selv») with a good strike, an early one and none, the bleeding tub, and the landing at a plant."""
    await pl.shot('start', 'the start: in port, before anything is done')
    await pl.dock('butikk'); await pl.shot('butikk-vifte', 'the shop fan')
    await pl.fan('Fiskeutstyr'); await pl.shot('fiskeutstyr', 'the tackle shop page', drawer=True)
    await pl.dock('beh'); await pl.shot('beholdning', 'the inventory', drawer=True)
    await pl.drw('Rigg'); await pl.shot('rigg', 'the rig tab', drawer=True)
    await pl.js("DOCK.close()")
    if not await to_sea(pl, 'husoy', 8, 20, 90, 'torsk', 'a cod spot north of Senja'): return
    await pl.shot('til-sjos', 'at sea, lying still')
    await pl.dock('settut'); await pl.shot('settut-av', 'tapped «Sett ut» rigged for the jig (should say why not)')
    await pl.dock('taopp'); await pl.shot('taopp-av', 'tapped «Ta opp» with no gear in the sea')
    await pl.dock('jukse'); await pl.shot('jukse-kort', 'the jig card')
    await pl.tap('#dockFan [data-dk="fh+"]'); await pl.tap('#dockFan [data-dk="fh+"]'); await pl.shot('jukse-kort-timer', 'two taps on + for hours')
    await pl.fan('Start jukse'); await pl.shot('jukser', 'jigging has started')
    await pl.play(20); await pl.shot('jukser-20min', '20 minutes on')
    # the jig game: wait for a bite and strike in the middle, then too early, then not at all (twice puts it down)
    r = await pl.dock('jigg', must=False)
    if r:
        await pl.shot('jukse-selv', 'the jig game is open')
        lat = 0.35
        for k, how in enumerate(['tidlig', 'midt', 'midt', 'ingen', 'ingen']):
            t0 = time.time()
            # the bite waited for in the page, so the strike can be timed to the needle (a finger reacts in about 0.2 s)
            w = await pl.js("(wait) => new Promise(res => { const t = performance.now(); const f = () => { if (!window.jigActive) return res(-1); if (JIGG.state().st === 'bite'){ window.__bite = performance.now(); return setTimeout(() => { window.__go = performance.now(); res(performance.now() - t); }, wait); } if (performance.now() - t > 70000) return res(-2); requestAnimationFrame(f); }; f(); })", max(0, int((0.7 - lat) * 1000)) if how == 'midt' else 0)
            if w < 0: pl.note('jiggame', 'no bite in %d s (round %d)' % (time.time() - t0, k)); break
            pl.note('jiggame', 'a bite after %.0f s real time' % (time.time() - t0))
            if k == 4: await pl.shot('napp', 'BITE: the needle sweeps')
            if how == 'midt': await pl.tap('#jigUI .jig-btn')
            elif how == 'tidlig': await pl.tap('#jigUI .jig-btn')
            else: await asyncio.sleep(1.8)
            await asyncio.sleep(0.2); g = json.loads(await pl.js("JSON.stringify(Object.assign({needle:window.__needle, after:window.__pd && window.__bite ? +((window.__pd - window.__bite) / 1000).toFixed(2) : null, lat:window.__pd && window.__go ? +((window.__pd - window.__go) / 1000).toFixed(2) : null}, JIGG.state().got))"))
            if how == 'tidlig' and g.get('lat') is not None: lat = g['lat']
            pl.note('jiggame', '%s strike (%.2f s after the bite, the middle is at 0.70): %s' % (how, g.get('after') or -1, g))
            await pl.shot('rykk-' + how, 'after a strike: %s' % how)
        await pl.shot('jukse-selv-slutt', 'after two bites without a strike')
    else:
        pl.note('jiggame', '«Jukse selv» is not on the dock while jigging')
    p = await pl.play(400, until="S.boat.status !== 'fishing' || S.boat.deckStop")
    await pl.shot('jukse-kar', 'later: %d min (status %s)' % (p['n'], p['to']))
    if await pl.js("S.boat.status === 'fishing'"):
        p = await pl.play(400, until="S.boat.status !== 'fishing'"); await pl.shot('jukse-ferdig', 'the jig is done (%d min more)' % p['n'])
    await pl.dock('beh'); await pl.drw('Lasterom'); await pl.shot('lasterom', 'the hold after the day', drawer=True)
    await pl.js("DOCK.close()")
    await land(pl, 'husoy')

async def buttons(pl, where='#drawer'):
    b = await pl.js("s => FP.buttons(s)", where); pl.note('buttons', ' | '.join(b)[:1500]); return b

async def buy(pl, text, scope='#drawer', confirm=True):
    """Tap a buy button by its text; the dear ones ask again in the button («Bekreft · …»), and are confirmed the same way."""
    r = await pl.tap(text=text, scope=scope, must=False)
    if not r: pl.note('buy', 'found no button «%s»' % text); await buttons(pl, scope); return False
    if r['dis']: pl.note('buy', '«%s» is greyed: %s' % (r['text'], (await pl.read())), ); return False
    await asyncio.sleep(0.3)
    if confirm and await pl.tap(text='Bekreft', scope=scope, must=False): pl.note('buy', '«%s» asked to be confirmed, and was' % r['text'])
    rd = json.loads(await pl.read()); pl.note('buy', '«%s» → toasts %s, cash %s' % (r['text'], rd['toasts'], rd['cash']))
    return True

@scenario
async def butikker(pl):
    """The three places of trade as they are for gear (Jonas 07.10.2026): the tackle shop, the yard's upgrades, the plant's bait, and the
    crew exchange, with money enough to buy; what each page offers and what it says no to."""
    await pl.js("FP.cash(2000000)")
    await pl.dock('butikk'); await pl.fan('Fiskeutstyr'); await pl.shot('fiskeutstyr', 'Butikk › Fiskeutstyr with 2 MNOK', drawer=True); await buttons(pl)
    await pl.js("DOCK.close()"); await pl.dock('butikk'); await pl.fan('Elektronikk'); await pl.shot('elektronikk', 'Butikk › Elektronikk og haler', drawer=True); await buttons(pl)
    await pl.js("DOCK.close()"); await pl.dock('verft'); await pl.shot('verft-vifte', 'the yard fan'); await pl.fan('Oppgrader'); await pl.shot('oppgrader', 'Verft › Oppgrader', drawer=True); await buttons(pl)
    await pl.js("DOCK.close()"); await pl.dock('bygd'); await pl.fan('Ansatte'); await pl.shot('ansatte', 'Bygd › Ansatte', drawer=True); await buttons(pl)
    await pl.drw('Mannskapsbørs', must=False); await pl.shot('bors', 'the crew exchange', drawer=True); await buttons(pl)
    await pl.js("DOCK.close()"); await pl.js("id => FP.port(id)", 'botnhamn')
    await pl.dock('marked'); await pl.shot('mottak-vifte', 'Botnhamn: the plant fan'); await pl.fan('Agn'); await pl.shot('agn', 'Mottak › Agn', drawer=True); await buttons(pl)
    await pl.js("DOCK.close()"); await pl.dock('marked'); await pl.fan('Is'); await pl.shot('is', 'Mottak › Is', drawer=True); await buttons(pl)

async def card_btn(pl, title, btn, scope='#drawer', must=True):
    """Tap the button «btn» on the card whose heading begins with «title» (a player reads the card, then its button)."""
    ok = await pl.js("""([t, b, sc]) => { for (const e of document.querySelectorAll('[data-fp]')) delete e.dataset.fp;
      const low = t.toLowerCase(), bl = b.toLowerCase();
      for (const c of document.querySelectorAll(sc + ' .ph-card, ' + sc + ' .ic-card, ' + sc + ' [class*=card]')){ const h = c.querySelector('h4, h3, b, .ic-n, .ic-name'); if (!h || !FP.vis(c) || !FP.txt(h).toLowerCase().startsWith(low)) continue;
        const k = [...c.querySelectorAll('button')].find(x => FP.vis(x) && FP.txt(x).toLowerCase().includes(bl)); if (k){ k.dataset.fp = '1'; return FP.txt(k); } }
      return null; }""", [title, btn, scope])
    if not ok:
        if must: pl.note('missing', 'no «%s» on the card «%s»' % (btn, title))
        return None
    return await pl.tap('[data-fp="1"]')

async def buy_card(pl, title, btn, scope='#drawer'):
    r = await card_btn(pl, title, btn, scope)
    if not r: return False
    if r['dis']: pl.note('buy', '«%s» on «%s» is greyed' % (r['text'], title)); return False
    await asyncio.sleep(0.3)
    if await card_btn(pl, title, 'Bekreft', scope, must=False): pl.note('buy', '«%s» on «%s» asked to be confirmed, and was' % (r['text'], title))
    rd = json.loads(await pl.read()); pl.note('buy', '%s › «%s» → toasts %s, cash %s' % (title, r['text'], rd['toasts'], rd['cash']))
    return True

async def shop_haulers(pl, items):
    """Butikk › Elektronikk og haler: buy and fit each item, and let the half hour of fitting go."""
    await pl.js("DOCK.close()"); await pl.dock('butikk'); await pl.fan('Elektronikk')
    for it in items: await buy_card(pl, it, 'Kjøp og monter')
    await pl.shot('haler-kjopt', 'after buying %s' % ', '.join(items), drawer=True)
    pl.note('jobs', await pl.js("JSON.stringify((S.jobs || []).map(j => [j.kind, j.k || '', j.h, j.until != null ? hm(j.until / 60) : null, j.no]))"))
    t0 = await pl.js("hm(S.t / 60)"); info = (json.loads(await pl.read()))['info']
    p = await pl.play(720, until="!(S.jobs && S.jobs.length)"); pl.note('fit', 'bought at %s («%s»); the fitting was done after %d game minutes, at %s' % (t0, info, p['n'], await pl.js("hm(S.t / 60)")))
    await pl.js("DOCK.close()")

async def rig(pl, name):
    await pl.dock('beh'); await pl.drw('Rigg'); await pl.shot('rigg-for', 'the rig tab before re-rigging for %s' % name, drawer=True)
    r = await card_btn(pl, name, 'Rigg om')
    await pl.shot('rigget', 'after «Rigg om» on %s' % name, drawer=True)
    pl.note('rig', 'rigged: %s' % await pl.js("rigOf()")); await pl.js("DOCK.close()")

async def set_out(pl, choice, tag, drag_land=False, minus=0):
    """«Sett ut» from the dock: the fan's choice, the chart's line (dragged over land first when asked, to see it go red), − taps, and «Sett ut»."""
    await pl.dock('settut'); await pl.shot('settut-vifte-' + tag, 'the «Sett ut» fan')
    if not await pl.fan(choice, must=False):
        pl.note('missing', 'no «%s» in the Sett ut fan: %s' % (choice, (json.loads(await pl.read()))['fan'])); return False
    await pl.pg.wait_for_timeout(600); await pl.shot('settut-kart-' + tag, 'the line drawn on the chart')
    if not await pl.js("!!SETM"):
        pl.note('setmode', 'the choice «%s» did not open the chart: %s' % (choice, json.loads(await pl.read())['drawer'])); await pl.js("DOCK.close()"); return False
    if drag_land:
        # the end of the line is the handle: drag it round towards the nearest land
        q = await pl.js("""() => { const p = S.boat.pos; let best = null; for (let a = 0; a < 72; a++){ const t = a / 72 * 2 * Math.PI; for (let r = 0.05; r < 3; r += 0.05){ const q = {x:p.x + Math.sin(t) * r, y:p.y - Math.cos(t) * r}; if (isLand(q)){ if (!best || r < best.r) best = {t, r}; break; } } }
          const e = setEnd(), sv = document.querySelector('#map svg, svg#map, #chart svg') || document.querySelector('svg'); return best && {hdg:best.t, r:best.r, end:e}; }""")
        if q:
            ok = await pl.js("""(h) => { SETM.hdg = h; renderDyn(); renderSetBar(); return setWhy(); }""", q['hdg'])
            pl.note('setmode', 'turned towards land %.2f km away: %s' % (q['r'], ok))
            await pl.shot('settut-land-' + tag, 'the line turned towards land')
            await pl.js("(h) => { SETM.hdg = h + Math.PI; renderDyn(); renderSetBar(); }", q['hdg'])
    for _ in range(minus): await pl.tap('#setBar [data-sb="-"]')
    if minus: await pl.shot('settut-minus-' + tag, '%d taps on −' % minus)
    why = await pl.js("setWhy()")
    if why: pl.note('setmode', 'the line is red: %s' % why)
    await pl.tap('#setBar [data-sb="go"]'); await pl.shot('settut-go-' + tag, 'after «Sett ut»')
    if await pl.js("!!SETM"):
        pl.note('setmode', '«Sett ut» was refused: %s; «Avbryt»' % (json.loads(await pl.read()))['toasts']); await pl.tap('#setBar [data-sb="x"]', must=False)
        if await pl.js("document.body.classList.contains('vplot')"): await pl.tap(text='Lukk', must=False)
        return False
    p = await pl.play(600, until="!S.boat.gop"); await pl.shot('satt-' + tag, 'the gear is out (%d min of setting)' % p['n'])
    return True

async def haul(pl, tag, again=False):
    """«Ta opp» by the buoy, «Trekk» or «Trekk og sett igjen» in its fan, the work as it goes, and the catch."""
    h0 = await pl.js("holdTotal()")
    far = await pl.js("(() => { const s = mySets()[0]; if (!s || nearSet(S.boat.pos, 0.3)) return null; return +(Math.min(dist(S.boat.pos, s.a), dist(S.boat.pos, s.b)) / NM).toFixed(1); })()")
    if far is not None:
        await pl.dock('taopp'); rd = json.loads(await pl.read()); pl.note('haul', '%.1f nm from the buoy: %s; back to it (the sail is skipped)' % (far, rd['toasts']))
        await pl.js("(() => { const s = mySets()[0]; return FP.sea(buoyStandoff(s, dist(S.boat.pos, s.a) < dist(S.boat.pos, s.b) ? s.a : s.b)); })()")
        if not await pl.js("!!nearSet(S.boat.pos, 0.3)"): await pl.js("(() => { const s = mySets()[0]; return FP.sea(s.a); })()")
    r = await pl.dock('taopp'); await pl.shot('taopp-' + tag, 'tapped «Ta opp»')
    if (json.loads(await pl.read()))['fan'] or await pl.js("FP.vis(document.getElementById('dockFan'))"):
        await pl.fan('Trekk og sett igjen' if again else 'Trekk')
    await pl.play(15); await pl.shot('trekker-' + tag, 'hauling, a quarter of an hour in')
    p = await pl.play(900, until="!S.boat.gop"); await pl.shot('trukket-' + tag, 'hauled (%d min)' % p['n'])
    if await pl.js("S.boat.status === 'fishing'"): p2 = await pl.play(600, until="S.boat.status !== 'fishing'"); pl.note('haul', 'the deck work went on %d min after the haul' % p2['n'])
    got = await pl.js("JSON.stringify((() => { const m = S.marks.filter(m => m.g).slice(-1)[0]; const h = {}; for (const x of S.hold) h[x.sp] = +((h[x.sp] || 0) + x.kg).toFixed(1); return {mark:m && {g:m.g, kgu:m.kgu, q:m.q}, hold:h}; })())")
    pl.note('catch', '%s: hold %.0f → %.0f kg; %s' % (tag, h0, await pl.js("holdTotal()"), got))

async def soak(pl, hours, tag, anchor=True):
    """The gear stands: the boat drops anchor by it when the dock offers it (else she drifts), and the hours go."""
    p0 = await pl.js("({x:S.boat.pos.x, y:S.boat.pos.y})")
    if anchor:
        r = await pl.dock('anker', must=False)
        rd = json.loads(await pl.read()); pl.note('anchor', 'Kast anker: %s %s' % ('tapped' if r else 'not on the dock', rd['toasts']))
    p = await pl.play(int(hours * 60))
    d = await pl.js("p => JSON.stringify({km:+dist(p, S.boat.pos).toFixed(2), depth:Math.round(depthF(S.boat.pos)), land:isLand(S.boat.pos), st:S.boat.status, anch:!!S.boat.anch})", p0)
    pl.note('soak', '%.0f h: the boat moved %s' % (hours, d))
    await pl.shot('staar-' + tag, 'after %.0f h of soak' % hours)
    if await pl.js("!!S.boat.anch"):
        await pl.dock('anker', must=False); p = await pl.play(30, until="!S.boat.anch"); pl.note('anchor', 'weighed in %d min' % p['n'])


async def egn_tap(pl, m):
    """«Egn … selv» (m self) or «Egnebua egner …» (m shed): tapped until the job is there, counting the taps that were lost."""
    for k in range(4):
        n0 = await pl.js("JSON.stringify([(S.pgear.shore || []).length, (S.jobs || []).length, S.pgear.lines.hyse.baited, S.pgear.lines.bank.baited])")
        r = await pl.tap('#drawer [data-pa="gregn"][data-m="%s"]' % m, must=False)
        if not r: pl.note('bait', 'no baiting button (%s)' % m); return False
        await asyncio.sleep(0.5)
        n1 = await pl.js("JSON.stringify([(S.pgear.shore || []).length, (S.jobs || []).length, S.pgear.lines.hyse.baited, S.pgear.lines.bank.baited])")
        if n1 != n0: pl.note('bait', '«%s» took on tap %d (%s → %s)' % (r['text'], k + 1, n0, n1)); return True
        pl.note('taplost', 'tap %d on «%s» did nothing (disabled %s, hit %s, top %s)' % (k + 1, r['text'], r['dis'], r['hit'], r['top']))
    return False

@scenario
async def line(pl):
    """Longline on a sjark: the line hauler bought and fitted, the rig changed, tubs of haddock and bank line bought, bait at the plant,
    baiting with a chosen bait, out to a haddock spot off Senja on 1 March, «Sett ut» on the chart (towards land first), a 12 h soak,
    the haul, the bank line with squid deeper, and the landing."""
    await pl.js("FP.cash(1500000)"); v = await pl.js("FP.vessel('sjark')"); pl.note('setup', 'sjark %s, 1.5 MNOK' % v)
    await shop_haulers(pl, ['Linehaler'])
    await rig(pl, 'Line')
    await pl.dock('butikk'); await pl.fan('Fiskeutstyr'); await pl.shot('fiskeutstyr-line', 'the shop with a line hauler aboard', drawer=True); await buttons(pl)
    await buy_card(pl, 'Line', 'hyseline'); await buy_card(pl, 'Line', 'bankline')
    for _ in range(2): await buy_card(pl, 'Blåser', 'blåsesett')
    await pl.shot('kjopt-line', 'four tubs of each line and two buoy sets bought', drawer=True)
    await pl.js("DOCK.close()"); await pl.js("id => FP.port(id)", 'botnhamn')
    await pl.dock('marked'); await pl.fan('Agn'); await pl.shot('agn-line', 'bait with line aboard', drawer=True); await buttons(pl)
    await pl.tap(text='100 kg · 1 400', scope='#drawer'); await pl.tap(text='20 kg · 680', scope='#drawer')
    await pl.shot('agn-kjopt', 'sild 100 kg and squid 20 kg bought', drawer=True)
    await pl.js("DOCK.close()"); await pl.dock('beh'); await pl.drw('Redskap'); await pl.shot('beh-line', 'the inventory with tubs not baited', drawer=True)
    await card_btn(pl, 'Hyseline', 'Egn', must=False); await pl.shot('egn-velger', 'the bait picker', drawer=True)
    await pl.tap(text='Sild og lodde', scope='#drawer', must=False); await pl.shot('egn-sild', 'sild chosen', drawer=True)
    t0 = await pl.js("hm(S.t / 60)"); await egn_tap(pl, 'self'); await pl.shot('egner', 'baiting the haddock line ourselves', drawer=True)
    p = await pl.play(1200, until="S.pgear.lines.hyse.baited >= 4"); pl.note('bait', 'baiting 4 tubs ourselves: started %s, done after %d game min, at %s' % (t0, p['n'], await pl.js("hm(S.t / 60)")))
    await pl.shot('egnet', 'the haddock line baited', drawer=True)
    await card_btn(pl, 'Bankline', 'Egn', must=False); await pl.tap(text='Blekksprut', scope='#drawer', must=False); await pl.shot('egn-blekksprut', 'squid for the bank line', drawer=True)
    t0 = await pl.js("hm(S.t / 60)"); await egn_tap(pl, 'shed'); await pl.shot('egnebu', 'the bank line left at the baiting shed', drawer=True)
    p = await pl.play(1200, until="S.pgear.lines.bank.baited >= 4"); pl.note('bait', 'the baiting shed: left %s, back after %d game min, at %s' % (t0, p['n'], await pl.js("hm(S.t / 60)")))
    await pl.js("DOCK.close()")
    if not await to_sea(pl, 'botnhamn', 10, 40, 140, 'hyse', 'a haddock spot off Senja'): return
    if await set_out(pl, 'hyseline', 'hyse', drag_land=True, minus=1):
        # away from the buoys: «Ta opp» says how far, and «Kjør dit» in the inventory finds the way back
        q = await pl.js("async () => { const p = S.boat.pos; return await FP.spot({x:p.x + 2.5, y:p.y + 1.5}, 1.5, 20, 400, null); }")
        await pl.js("p => FP.sea(p)", q); pl.note('setup', 'moved 3 km off the line to lie there (as if away)'); await soak(pl, 12, 'hyse')
        await pl.dock('taopp'); await pl.shot('taopp-langt', '«Ta opp» 3 km from the buoys')
        await pl.dock('beh'); await pl.drw('Redskap'); await pl.shot('beh-i-sjoen', 'the inventory with the line in the sea', drawer=True); await buttons(pl)
        r = await pl.tap(text='Kjør dit', scope='#drawer', must=False)
        await pl.pg.wait_for_timeout(1500); await pl.shot('kjor-dit', 'after «Kjør dit»: the chart with the way to the buoy')
        await buttons(pl, 'body')
        if await pl.tap(text='Kast loss', must=False):
            p = await pl.play(240, until="S.boat.status === 'idle'"); await pl.shot('ved-blasa', 'at the buoy after %d min (status %s)' % (p['n'], p['to']))
            if p['to'] != 'idle':
                pl.note('nav', 'not at the buoy after %d min: %s' % (p['n'], await pl.js("JSON.stringify({st:S.boat.status, v:+(S.boat.v || 0).toFixed(1), dep:Math.round(depthF(S.boat.pos)), land:isLand(S.boat.pos), hs:+hsAt(S.boat.pos, S.t / 60).toFixed(1)})")))
                await pl.js("(() => { S.plan = null; const s = mySets()[0]; return FP.sea(buoyStandoff(s, s.a)); })()")
            await pl.tap(text='Lukk', must=False); await pl.pg.wait_for_timeout(800); await pl.shot('kart-lukket', 'the chart closed with «Lukk»')
        else:
            pl.note('nav', 'found no «Kast loss» after «Kjør dit»'); await pl.js("(() => { const s = mySets()[0]; return FP.sea(s.a); })()")
        await haul(pl, 'hyse')
        await pl.dock('beh'); await pl.drw('Redskap'); await pl.shot('beh-etter-hyse', 'the inventory after the haul', drawer=True); await pl.js("DOCK.close()")
    if await to_sea(pl, 'botnhamn', 25, 150, 400, 'brosme', 'deeper for tusk and ling'):
        if await set_out(pl, 'bankline', 'bank'):
            await soak(pl, 18, 'bank'); await haul(pl, 'bank')
    await land(pl, 'botnhamn')

async def jig_run(pl, hours, tag, tackle=None):
    """The jig card: the hours set with − and +, the tackle chosen, «Start jukse», and the hours played to the end."""
    if not await pl.js("FP.vis(document.getElementById('dockFan'))"): await pl.dock('jukse')
    await pl.shot('jukse-kort-' + tag, 'the jig card')
    cur = await pl.js("S.fishPlanH")
    for _ in range(abs(hours - cur)): await pl.tap('#dockFan [data-dk="fh%s"]' % ('+' if hours > cur else '-'))
    if tackle:
        r = await pl.tap('#dockFan [data-dk="tk-%s"]' % tackle, must=False)
        rd = json.loads(await pl.read()); pl.note('tackle', 'tapped %s: %s, toasts %s, target %s' % (tackle, r and r['text'], rd['toasts'], await pl.js("S.target")))
        await pl.shot('jukse-takkel-' + tag, 'the tackle chosen: %s' % tackle)
        if not await pl.js("FP.vis(document.getElementById('dockFan'))"): await pl.dock('jukse')
    h0 = await pl.js("holdTotal()"); t0 = await pl.js("S.t")
    await pl.tap('#dockFan [data-dk="startfish"]'); await pl.shot('jukser-' + tag, 'jigging started')
    p = await pl.play(hours * 60 + 240, until="S.boat.status !== 'fishing'")
    await pl.shot('jukset-' + tag, 'after the jig (%d min)' % p['n'])
    got = await pl.js("JSON.stringify((() => { const h = {}; for (const x of S.hold) h[x.sp] = +((h[x.sp] || 0) + x.kg).toFixed(1); return h; })())")
    kg = await pl.js("holdTotal()") - h0; mins = (await pl.js("S.t")) - t0
    pl.note('catch', '%s: %.0f kg in %.1f h of jigging (%.0f kg/h); hold %s' % (tag, kg, mins / 60, kg / max(0.1, mins / 60), got))
    return kg


@scenario
async def maskin(pl):
    """Jigging reels and the halibut pilk on a sjark: two reels bought and fitted, the halibut gear, the card in March (the halibut closed)
    and in June, and what the jig takes with each."""
    await pl.js("FP.cash(800000)"); await pl.js("FP.vessel('sjark')")
    await shop_haulers(pl, ['Juksamaskin', 'Juksamaskin'])
    pl.note('equip', 'reels aboard: %s' % await pl.js("S.equip.jukse"))
    await pl.dock('butikk'); await pl.fan('Fiskeutstyr'); await buy_card(pl, 'Kveiteutstyr', 'Kjøp'); await pl.shot('kveiteutstyr', 'the halibut gear bought', drawer=True); await pl.js("DOCK.close()")
    if not await to_sea(pl, 'husoy', 8, 20, 90, 'torsk', 'a cod spot north of Senja in March'): return
    await pl.dock('jukse'); await pl.shot('kort-mars', 'the jig card in March with the halibut gear aboard')
    r = await pl.tap('#dockFan [data-dk="tk-kveite"]', must=False); rd = json.loads(await pl.read()); pl.note('tackle', 'the halibut pilk in March: %s %s' % (r and (r['text'], r['dis']), rd['toasts']))
    await jig_run(pl, 3, 'mars')
    if await pl.js("!!(window.JIGG && JIGG.ok())"): pl.note('jiggame', '«Jukse selv» is offered with reels aboard (it should not be)')
    await pl.js("FP.date(2027, 6, 12, 6)")
    q = await to_sea(pl, 'husoy', 15, 20, 200, 'kveite', 'a halibut spot in June')
    if q: pl.note('setup', 'halibut density there %s' % q['dens'])
    await jig_run(pl, 4, 'juni-kveite', tackle='kveite')
    await pl.js("S.target = 'mix'")
    await jig_run(pl, 3, 'juni-mark', tackle='mark')
    await land(pl, 'husoy')


async def hire(pl, n=1):
    """Bygd › Ansatte › Mannskapsbørs: hire the first n who ask for a berth."""
    await pl.js("DOCK.close()"); await pl.dock('bygd'); await pl.fan('Ansatte'); await pl.drw('Mannskapsbørs', must=False)
    for _ in range(n):
        r = await pl.tap(text='Ansett', scope='#drawer', must=False)
        if not r: break
    await pl.shot('ansatt', 'after hiring', drawer=True)
    pl.note('crew', 'hired: %s; aboard today: %s' % (await pl.js("JSON.stringify(S.crew.map(c => [c.name, c.bi ? 'biyrke' : 'hovedyrke', c.biDays || null]))"), await pl.js("JSON.stringify(crewAboard().map(c => c.name))")))
    await pl.js("DOCK.close()")


@scenario
async def garn(pl):
    """Nets on a sjark: the net hauler, the rig, cod nets, floating nets and Greenland halibut nets; out alone first (nets need two),
    a hand hired, the cod nets set and hauled after a night with «Trekk og sett igjen», the floating nets for saithe, the halibut nets deep."""
    await pl.js("FP.cash(1500000)"); await pl.js("FP.vessel('sjark')")
    await shop_haulers(pl, ['Garnhaler'])
    await rig(pl, 'Garn')
    await pl.dock('butikk'); await pl.fan('Fiskeutstyr'); await pl.shot('fiskeutstyr-garn', 'the shop with a net hauler aboard', drawer=True); await buttons(pl)
    await buy_card(pl, 'Garn', 'Torskegarn 180'); await buy_card(pl, 'Garn', 'Flytegarn 156'); await buy_card(pl, 'Garn', 'Blåkveitegarn 360')
    for _ in range(3): await buy_card(pl, 'Blåser', 'blåsesett')
    await pl.shot('kjopt-garn', 'nets and buoy sets bought', drawer=True)
    pl.note('nets', await pl.js("JSON.stringify(S.pgear.nets.map(l => [l.ty || 'bunn', l.mesh, l.n]))")); await pl.js("DOCK.close()")
    if not await to_sea(pl, 'gryllefjord', 10, 30, 120, 'torsk', 'a cod spot off Gryllefjord in March'): return
    await pl.dock('settut'); await pl.shot('settut-vifte-alene', 'the «Sett ut» fan, alone aboard'); await buttons(pl, '#dockFan')
    if await pl.tap(text='180', scope='#dockFan', must=False):
        await pl.pg.wait_for_timeout(500); await pl.shot('settut-alene', 'the chart line, alone aboard'); pl.note('setmode', 'alone: %s' % await pl.js("SETM ? setWhy() : 'no set mode'"))
        await pl.tap('#setBar [data-sb="x"]', must=False)
    await pl.js("id => FP.port(id)", 'gryllefjord'); await hire(pl, 1)
    if not await to_sea(pl, 'gryllefjord', 10, 30, 120, 'torsk', 'back out with a hand aboard'): return
    if await set_out(pl, '180', 'torsk'):
        await soak(pl, 18, 'torsk'); await haul(pl, 'torsk', again=True)
        await pl.dock('beh'); await pl.drw('Redskap'); await pl.shot('beh-garn-slitt', 'the nets after a haul (wear)', drawer=True); await pl.js("DOCK.close()")
        await soak(pl, 12, 'torsk2'); await haul(pl, 'torsk2')
    if await to_sea(pl, 'gryllefjord', 15, 30, 150, 'sei', 'a saithe spot'):
        if await set_out(pl, 'flytegarn', 'flyt'): await soak(pl, 12, 'flyt'); await haul(pl, 'flyt')
    if await to_sea(pl, 'gryllefjord', 40, 400, 1200, 'blakveite', 'the edge for Greenland halibut'):
        if await set_out(pl, 'blåkveite', 'blakveite'): await soak(pl, 24, 'blakveite'); await haul(pl, 'blakveite')
    await land(pl, 'gryllefjord')


@scenario
async def teiner(pl):
    """King crab pots in West Finnmark in September: the pot hauler and the live crab tank at a yard, pots at a tackle shop, bait at the
    plant, the pots set and hauled after a day, a second string left 60 hours, and the crab landed alive (and dead)."""
    await pl.js("FP.date(2027, 9, 6, 6)"); await pl.js("FP.cash(1500000)"); await pl.js("FP.vessel('sjark')")
    nm = await pl.js("id => FP.port(id)", 'sb1111959_156917'); pl.note('setup', 'at %s' % nm)
    await shop_haulers(pl, ['Teinehaler', 'Krabbekar'])
    await rig(pl, 'Teiner')
    await pl.dock('butikk'); await pl.fan('Fiskeutstyr'); await pl.shot('fiskeutstyr-teiner', 'the shop with a pot hauler aboard', drawer=True); await buttons(pl)
    for _ in range(4):
        if not await buy_card(pl, 'Krabbeteiner', 'teine'): break
    for _ in range(2): await buy_card(pl, 'Blåser', 'blåsesett')
    await pl.shot('kjopt-teiner', 'pots bought', drawer=True); pl.note('pots', 'aboard: %s' % await pl.js("S.pgear.pots.big"))
    await pl.js("DOCK.close()"); await pl.js("id => FP.port(id)", 'mTF70')
    await pl.dock('marked'); await pl.fan('Agn'); await pl.shot('agn-teiner', 'bait for pots at Havøysund', drawer=True); await buttons(pl)
    await pl.tap(text='100 kg · 1 200', scope='#drawer', must=False); await pl.shot('agn-teiner-kjopt', 'saithe for bait', drawer=True)
    await pl.js("DOCK.close()")
    if not await to_sea(pl, [71.0, 24.75], 12, 40, 150, None, 'a king crab ground off Havøysund'): return
    await set_out(pl, 'teine', 'krabbe')
    await soak(pl, 24, 'krabbe'); await haul(pl, 'krabbe', again=True)
    await soak(pl, 60, 'krabbe60'); await haul(pl, 'krabbe60')
    await land(pl, 'mTF70')
    sale = await pl.js("JSON.stringify(S.lastSale && {crabDead:S.lastSale.crabDead, lines:(S.lastSale.lines || []).filter(r => r.sp === 'krabbe').map(r => [r.c, r.g, +(r.kg || 0).toFixed(1), Math.round(r.sum || 0)])})")
    pl.note('sale', 'the crab on the note: %s' % sale)


@scenario
async def senjateiner(pl):
    """Pots where there is hardly any king crab (Senja, HI: 0-0.01 a pot): does the player learn why the pots come up empty?"""
    await pl.js("FP.date(2027, 9, 6, 6)"); await pl.js("FP.cash(800000)"); await pl.js("FP.vessel('sjark')")
    await shop_haulers(pl, ['Teinehaler'])
    await rig(pl, 'Teiner')
    await pl.dock('butikk'); await pl.fan('Fiskeutstyr'); await buy_card(pl, 'Krabbeteiner', 'teine'); await buy_card(pl, 'Blåser', 'blåsesett'); await pl.js("DOCK.close()")
    await pl.js("id => FP.port(id)", 'botnhamn'); await pl.dock('marked'); await pl.fan('Agn'); await pl.tap(text='20 kg · 240', scope='#drawer', must=False); await pl.js("DOCK.close()")
    if not await to_sea(pl, 'botnhamn', 10, 40, 150, None, 'a pot spot off Senja'): return
    await set_out(pl, 'teine', 'senja'); await soak(pl, 24, 'senja'); await haul(pl, 'senja')
    await land(pl, 'botnhamn')


@scenario
async def kanter(pl):
    """The edges: what the game says no to and how. The start boat (7 m) and nets, line bought without a hauler, the ocean vessels in the
    boat market, a storm with nets in the sea (the loss and its report), and the hold full while jigging."""
    await pl.js("FP.cash(5000000)")
    await pl.dock('beh'); await pl.drw('Rigg'); await pl.shot('rigg-trebat', 'the start boat\'s rig tab: what it can be rigged for', drawer=True); await pl.js("DOCK.close()")
    await pl.dock('butikk'); await pl.fan('Elektronikk'); await pl.shot('haler-trebat', 'haulers for the start boat (does the net hauler fit?)', drawer=True)
    pl.note('fit', 'Elektronikk og haler, the end of the page: %s' % (await pl.js("FP.drawerText()"))[-400:]); await pl.js("DOCK.close()")
    await pl.dock('verft'); await pl.fan('Båthandel'); await pl.shot('bathandel', 'the boat market', drawer=True)
    txt = await pl.js("FP.drawerText()"); pl.note('market', 'ocean vessels in the market: %s' % ', '.join(w for w in ['autoline', 'Autoline', 'snøkrabbe', 'Snøkrabbe', 'tråler', 'Tråler', 'ringnot', 'Ringnot', 'kommer', 'Kommer'] if w in txt))
    await pl.js("() => { const e = [...document.querySelectorAll('#drawer *')].find(x => /tråler|Tråler/.test(x.textContent) && x.children.length < 3); if (e) e.scrollIntoView({block:'center'}); }")
    await pl.shot('bathandel-hav', 'the ocean vessels in the market', drawer=True); await pl.js("DOCK.close()")
    # the storm: a sjark with nets in the sea in a gale, the loss forced as geartest does, then what the player is told
    await pl.js("FP.vessel('sjark')"); await shop_haulers(pl, ['Garnhaler']); await rig(pl, 'Garn')
    await pl.dock('butikk'); await pl.fan('Fiskeutstyr'); await buy_card(pl, 'Garn', 'Torskegarn 156'); await buy_card(pl, 'Blåser', 'blåsesett'); await pl.js("DOCK.close()")
    # a hand with fishing as a side job (biyrke) hired on a day he does not work: what does «Sett ut» say?
    pl.note('crew', 'the exchange: %s' % await pl.js("JSON.stringify(PHONE.candidates().map(x => [x.name, !!x.bi, x.biDays || null]))"))
    bi = await pl.js("JSON.stringify((() => { const wd = (gDate(S.t / 60).getUTCDay() + 6) % 7; const c = PHONE.candidates().find(x => x.bi && x.biDays && !x.biDays[wd]); return c ? {name:c.name, days:c.biDays} : null; })())")
    pl.note('crew', 'a side-job hand not working today in the exchange: %s' % bi)
    bi = json.loads(bi)
    if bi:
        await pl.js("DOCK.close()"); await pl.dock('bygd'); await pl.fan('Ansatte'); await pl.drw('Mannskapsbørs', must=False)
        await pl.shot('bors-biyrke', 'the exchange: %s works only some days' % bi['name'], drawer=True)
        await card_btn(pl, bi['name'].split(' ')[0], 'Ansett', must=False)
        pl.note('crew', 'hired %s; aboard today: %s' % (bi['name'], await pl.js("JSON.stringify(crewAboard().map(c => c.name))"))); await pl.js("DOCK.close()")
        if await to_sea(pl, 'husoy', 8, 30, 100, 'torsk', 'nets with the side-job hand'):
            await pl.dock('settut'); await pl.tap(text='156', scope='#dockFan', must=False); await pl.pg.wait_for_timeout(500)
            pl.note('crew', 'Sett ut with %s hired but ashore today: %s' % (bi['name'], await pl.js("SETM ? setWhy() : 'no set mode'")))
            await pl.shot('settut-biyrke', 'Sett ut with the side-job hand hired (ashore today)'); await pl.tap('#setBar [data-sb="x"]', must=False)
            await pl.js("id => FP.port(id)", 'finnsnes')
    await hire(pl, 1)
    if await to_sea(pl, 'husoy', 8, 30, 100, 'torsk', 'nets before a gale'):
        await set_out(pl, '156', 'storm')
        if not await pl.js("mySets().length"):
            pl.note('crew', 'the nets did not go out: %s; one more hand hired' % await pl.js("JSON.stringify(crewAboard().map(c => c.name))"))
            await pl.js("id => FP.port(id)", 'husoy'); await hire(pl, 1); await to_sea(pl, 'husoy', 8, 30, 100, 'torsk', 'nets before a gale, again'); await set_out(pl, '156', 'storm2')
        if await pl.js("mySets().length"):
            await pl.js("id => FP.port(id)", 'husoy')
            r = await pl.js("""(() => { const s = mySets()[0]; const r0 = Math.random; Math.random = () => 0; for (let i = 0; i < 3; i++) gearHour(S.t / 60); Math.random = r0; refreshAll(); return JSON.stringify({lost:s.lost, heavy:s.heavy, n:mySets().length}); })()""")
            pl.note('storm', 'the gale forced on the nets (Math.random = 0 in gearHour, as geartest): %s' % r)
            await pl.shot('storm-tapt', 'after the gale: what the player is told')
            await pl.js("PHONE.open('meld')"); await pl.shot('meldinger', 'the messages app after the loss'); await pl.js("PHONE.show(false)")
            await pl.dock('beh'); await pl.drw('Redskap'); await pl.shot('beh-tapt', 'the inventory: the lost nets', drawer=True); await buttons(pl)
            if await pl.tap(text='Meld', scope='#drawer', must=False): await pl.shot('meldt', 'after reporting the loss', drawer=True)
            await pl.js("DOCK.close()")
    # the hold full while jigging
    await pl.js("FP.vessel('trebat')")
    if await to_sea(pl, 'husoy', 8, 20, 90, 'torsk', 'jig with the hold nearly full'):
        await pl.js("(() => { let room = capHold() - holdTotal() - 15; while (room > 4){ addCatch('torsk', 4, 2, true); room -= 4; } S.boat.deckStop = false; refreshAll(); })()")
        pl.note('setup', 'the hold filled to 15 kg short with 4 kg cod (as if caught)')
        await jig_run(pl, 3, 'full')
        rd = json.loads(await pl.read()); pl.note('full', 'hold %s/%s kg' % (rd['holdKg'], rd['cap']))


@scenario
async def kysten(pl):
    """The jig along the coast in skrei time (5 March): Lofoten (Henningsvær), the west coast (Bøvågen, north of Bergen) and West Finnmark
    (Gjesvær), three hours each on the best cod spot near the plant, and the landing at each."""
    await pl.js("FP.date(2027, 3, 5, 7)")
    for pid, near, tag in [('mN522', 'mN522', 'lofoten'), ('mH85', 'mH85', 'vestlandet'), ('mF343', 'mF343', 'finnmark')]:
        await pl.js("id => FP.port(id)", pid)
        if not await to_sea(pl, near, 12, 20, 120, 'torsk', 'cod near %s' % tag): continue
        await jig_run(pl, 3, tag)
        await land(pl, pid)
        await pl.js("FP.date(2027, 3, 5, 7)")


@scenario
async def jig3d(pl):
    """With 3D (KYST_FP_3D=1): the jig and the jig game seen in 3D, a line set and hauled with the deck work. Few pictures (30 s each)."""
    await pl.shot('havn-3d', 'in port in 3D')
    if not await to_sea(pl, 'husoy', 8, 20, 90, 'torsk', 'a cod spot'): return
    await pl.pg.wait_for_timeout(4000); await pl.shot('sjo-3d', 'at sea in 3D')
    await pl.dock('jukse'); await pl.tap('#dockFan [data-dk="startfish"]'); await pl.pg.wait_for_timeout(5000); await pl.shot('jukser-3d', 'jigging in 3D')
    if await pl.dock('jigg', must=False):
        t0 = time.time()
        while time.time() - t0 < 90 and await pl.js("JIGG.state().st") != 'bite': await asyncio.sleep(0.2)
        await pl.shot('napp-3d', 'a bite in 3D')
    await pl.js("S.equip.linehaler = true; S.boat.rig = 'line'; S.pgear.lines.hyse.n = 2; S.pgear.lines.hyse.baited = 2; btOf(S.pgear.lines.hyse); S.pgear.kits.n = 1; S.boat.status = 'idle'; S.boat.fishUntil = null; JIGG.stop(); refreshAll()")
    pl.note('setup', 'a line hauler and two baited tubs given (the buying is tested without 3D)')
    if await set_out(pl, 'hyseline', '3d'):
        await soak(pl, 10, '3d', anchor=False)
        await pl.dock('taopp'); await pl.play(20); await pl.pg.wait_for_timeout(5000); await pl.shot('trekker-3d', 'hauling the line in 3D')
        await pl.play(30); await pl.pg.wait_for_timeout(5000); await pl.shot('dekk-3d', 'the deck work in 3D')

#SCENARIOS#

async def main():
    names = [a for a in sys.argv[1:] if not a.startswith('-')] or [k for k in SCEN if not k.endswith('3d')]
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        summary = {}
        for nm in names:
            print('== scenario', nm, FMT, '3D' if D3 else 'no3d', flush=True); t = time.time()
            pl = Player(br, nm)
            try:
                await pl.start(); await SCEN[nm](pl)
            except Exception as e:
                import traceback; pl.note('crash', traceback.format_exc()[-1500:])
                try: await pl.shot('crash', 'the scenario stopped here')
                except Exception: pass
            summary[nm] = {'s': round(time.time() - t), 'shots': pl.n, 'pageerrors': len(pl.errs), 'notes': len(pl.notes)}
            await pl.close()
        print(json.dumps(summary, indent=1))
        await br.close()

if __name__ == '__main__':
    asyncio.run(main())
