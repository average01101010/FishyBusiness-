"""Kartlegging i stående (UI 2, U2-0, docs/planer/ui-2-staaende.md, 06.11.2026): the measurements the plan's assumptions rest on,
in a phone upright (390x844) and a tablet upright (800x1280), without 3D. For each state of the boat (in harbour at a plant, at the
naust, idle at sea with and without set gear, by a quay, jigging, sailing, a full hold, a planned departure, a quarrel aboard) it records
the dock's row (the buttons, how many rows they wrap to, the greyed ones, the hero), the fans, the text over the buttons, the status
box and the strip (their height, the next event, the «now» rows), where the little chart lands, the drawer pages' length (the
inventory and the crew pages, for the «Om bord» merge), the phone's home screen and the Rederi app, the tap targets under 44 px, and the
design census of five screens. Then it plays four game hours (idle, jigging, sailing, landing) and samples every five minutes whether the
strip's third line would have something to say. Prints OK per measurement; the figures land in tests/out/kartlegging/<fmt>.json, pictures
beside it. Runs without drawing 3D (KYST_LITE=1 or not: it adds #no3d itself)."""
from _env import GAME_TUT, boot, OUT
import asyncio, json, os
from playwright.async_api import async_playwright

URL = GAME_TUT + '#notut,no3d'
SIZES = [('tlf', 390, 844), ('brett', 800, 1280)]
ROOT = os.path.join(OUT, 'kartlegging'); os.makedirs(ROOT, exist_ok=True)

HOOK = r"""(() => {
  if (window.K) return;
  const vis = e => { if (!e || !e.getClientRects().length) return false; const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity !== 0; };
  const R = r => r ? {x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height)} : null;
  const txt = e => e ? (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim() : '';
  const btns = sel => [...document.querySelectorAll(sel)].filter(vis).map(b => { const r = b.getBoundingClientRect(), l = b.querySelector('.dk-l'), i = b.querySelector('.dk-i');
    return {id:b.dataset.dk, lbl:txt(l || b).slice(0, 30), off:b.classList.contains('off'), hero:b.classList.contains('hero'), pri:b.classList.contains('pri'), top:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height), iw:i ? Math.round(i.getBoundingClientRect().width) : null, fs:getComputedStyle(l || b).fontSize}; });
  window.K = {
    vis, txt, R,
    measure(){
      const dock = btns('#dock .dk-b'), fanEl = document.getElementById('dockFan'), fan = vis(fanEl) ? btns('#dockFan .dk-b') : [];
      const info = document.getElementById('dockInfo'), hud = document.getElementById('hud'), mp = document.getElementById('miniPlot'), g3 = document.getElementById('gps3d');
      let nx = null; try { const e = nextEvent(); if (e) nx = {txt:e.txt, min:Math.round(e.t - S.t)}; } catch (e){}
      const rowsOf = a => { const t = a.map(b => b.top).sort((x, y) => x - y); let n = 0, last = -1e9; for (const v of t){ if (v - last > 30) n++; last = v; } return n; };
      return {status:S.boat.status, st:statusText(), dock, rows:rowsOf(dock), fan, fanRows:rowsOf(fan), info:info.hidden ? '' : txt(info),
        hud:{min:!!S.settings.hudMin, full:!!S.settings.hudFull, r:R(hud.getBoundingClientRect()), text:txt(hud).slice(0, 400)}, nx, now:[...document.querySelectorAll('#hud .hnow .row')].map(r => txt(r).slice(0, 60)),
        map:{r:R(mp.getBoundingClientRect()), vis:vis(mp)}, gps3d:vis(g3) ? R(g3.getBoundingClientRect()) : null, W:innerWidth, H:innerHeight};
    },
    // the strip and the box for one state: the box's height, the strip's height, and the same figures
    both(){ const keep = S.settings.hudMin; S.settings.hudMin = false; S.settings.hudFull = false; renderHud(); const box = K.measure(); S.settings.hudMin = true; renderHud(); const strip = K.measure(); S.settings.hudMin = keep; renderHud(); return {box, strip}; },
    small(){ const out = []; for (const b of document.querySelectorAll('#dock button, #dockFan button, #hud button, #gps3d button, #plotMin, #logbook, #phoneFab, #camBtn, #kinoBtn')){ if (!vis(b)) continue; const r = b.getBoundingClientRect(); if (r.width < 44 || r.height < 44) out.push((b.id || b.dataset.dk || b.className) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); } return out; },
    census(){
      const C = {size:{}, fam:{}, color:{}, bg:{}, radius:{}, btn:{}}, add = (o, k) => o[k] = (o[k] || 0) + 1;
      for (const e of document.querySelectorAll('body *')){ if (!vis(e)) continue;
        const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); const s = getComputedStyle(e);
        if (own){ add(C.size, s.fontSize); add(C.fam, s.fontFamily.split(',')[0]); add(C.color, s.color); }
        if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') add(C.bg, s.backgroundColor);
        if (s.borderRadius !== '0px') add(C.radius, s.borderRadius);
        if (e.tagName === 'BUTTON') add(C.btn, [s.fontSize, s.fontWeight, s.borderRadius, s.backgroundColor].join(' ')); }
      return C; },
    drawer(page){ DOCK.open(page); const b = document.getElementById('drawerBody'), d = document.getElementById('drawer'), tabs = [...document.querySelectorAll('#drawerTabs button')].filter(vis);
      const out = {page, r:R(d.getBoundingClientRect()), share:+(d.getBoundingClientRect().height / innerHeight).toFixed(2), tabs:[]};
      const one = () => ({name:txt(document.querySelector('#drawerTabs button.on') || tabs[0]).slice(0, 20), client:b.clientHeight, scroll:b.scrollHeight, screens:+(b.scrollHeight / Math.max(1, b.clientHeight)).toFixed(1), btns:[...b.querySelectorAll('button')].filter(vis).length, big:[...b.querySelectorAll('.ph-btn, .c-btn')].filter(vis).length});
      if (!tabs.length) out.tabs.push(one()); else for (const t of tabs){ t.click(); out.tabs.push(one()); }
      DOCK.close(); return out; },
    phoneHome(){ const v = document.getElementById('phView'), apps = [...document.querySelectorAll('.ph-app')].filter(vis), grid = document.querySelector('.ph-grid');
      const inView = apps.filter(a => a.getBoundingClientRect().bottom <= innerHeight).length, cards = [...document.querySelectorAll('.ph-homescr > *')].filter(e => e !== grid && vis(e)).length;
      return {apps:apps.length, inView, cardsAbove:cards, gridTop:grid ? Math.round(grid.getBoundingClientRect().top) : null, H:innerHeight, scroll:v.scrollHeight, client:v.clientHeight, screens:+(v.scrollHeight / Math.max(1, v.clientHeight)).toFixed(1)}; },
    phoneRederi(){ const v = document.getElementById('phView'), h4 = [...document.querySelectorAll('#phView h4')].find(h => /Flåten|The fleet/.test(txt(h)));
      const top = h4 ? h4.getBoundingClientRect().top - v.getBoundingClientRect().top + v.scrollTop : null;
      return {scroll:v.scrollHeight, client:v.clientHeight, screens:+(v.scrollHeight / Math.max(1, v.clientHeight)).toFixed(1), fleetTop:top == null ? null : Math.round(top), fleetScreens:top == null ? null : +(top / Math.max(1, v.clientHeight)).toFixed(2), btns:[...v.querySelectorAll('.ph-btn')].filter(vis).map(b => txt(b).slice(0, 24))}; },
    // the sample for the strip's third line: the next event, the «now» rows, the text over the buttons
    sample(){ S.settings.hudMin = false; renderHud(); renderActs(); let nx = null; try { nx = nextEvent(); } catch (e){}
      const info = document.getElementById('dockInfo'); const now = document.querySelectorAll('#hud .hnow .row').length;
      return {t:S.t, hm:hm(S.t / 60), st:S.boat.status, nx:nx ? nx.txt : null, now, info:info.hidden ? '' : txt(info).slice(0, 50), n:document.querySelectorAll('#dock .dk-b').length}; },
    play(min){ if (typeof DYN !== 'undefined') DYN.on = false; for (let i = 0; i < min; i++){ if (S.energy < 35) S.energy = 80; step(); } refreshAll(); return S.boat.status; },
    async port(id){ const p = portById(id), b = S.boat; await mapNeed(p.p, MAPD.simR); S.plan = null; b.status = 'port'; b.port = id; b.pos = {x:p.p.x, y:p.p.y}; b.v = 0; b.gop = null; b.land = null; b.fishUntil = null; DOCK.close(); refreshAll(); return {berth:berthKind(b), home:atHome(b), sv:portServices(p, berthKind(b))}; },
    async sea(p){ const b = S.boat; await mapNeed(p, MAPD.simR); S.plan = null; b.status = 'idle'; b.port = null; b.pos = {x:p.x, y:p.y}; b.v = 0; b.gop = null; b.fishUntil = null; DOCK.close(); refreshAll(); return {depth:Math.round(depthF(p)), moor:moorAll(p, 0.4).length}; },
    // a spot at sea within 400 m of a harbour's quay, for «Fortøy»
    quaySpot(id){ const p = portById(id).p; for (const d of [0.2, 0.3, 0.38]) for (let k = 0; k < 16; k++){ const a = k / 16 * 2 * Math.PI, q = {x:p.x + Math.sin(a) * d, y:p.y - Math.cos(a) * d}; try { if (!isLand(q) && depthF(q) > 2 && moorAll(q, 0.4).length) return q; } catch (e){} } return null; },
    line(){ S.equip.linehaler = true; S.boat.rig = 'line'; S.pgear.lines.hyse.n = 2; S.pgear.lines.hyse.baited = 2; btOf(S.pgear.lines.hyse); S.pgear.kits.n = 2; refreshAll(); return setChoices(true).length; },
    crew(n){ S.crew = ['Trond Eriksen', 'Roger Bakke', 'Kari Nilsen'].slice(0, n).map(nm => Object.assign(genCrew(), {bi:false, off:false, name:nm, known:[true, true], fatigue:0})); refreshAll(); return S.crew.length; },
    fill(){ let room = capHold() - holdTotal() - 2; while (room > 4){ addCatch('torsk', 4, 2, true); room -= 4; } S.boat.deckStop = false; if (typeof DYN !== 'undefined') DYN.on = false; for (let i = 0; i < 600 && deckPending() > 1; i++) step(); refreshAll(); return Math.round(holdTotal()) + '/' + Math.round(capHold()) + ' (dekk ' + Math.round(deckPending()) + ')'; },
    empty(){ S.hold = []; refreshAll(); },
    sail(id){ const p = portById(id).p, b = S.boat; S.plan = {wps:[{x:p.x, y:p.y, port:id}], idx:0, speed:8}; b.status = 'sailing'; b.v = 8; refreshAll(); return statusText(); },
    depart(id){ const p = portById(id).p; S.plan = {wps:[{x:p.x, y:p.y, port:id}], idx:0, speed:8, depAt:S.t + 90}; refreshAll(); return statusText(); },
  };
})()"""

STATES = [
  # name, set-up (JS, may be async), what to open before measuring (a dock button to click, or null)
  ('havn-mottak', "K.port('finnsnes')", None),
  ('havn-mottak-fisk', "(async () => { await K.port('finnsnes'); return K.fill(); })()", None),
  ('havn-mottak-mannskap', "(async () => { K.empty(); K.crew(2); await K.port('finnsnes'); return S.crew.length; })()", None),
  ('havn-vifte-bygd', "K.port('finnsnes')", 'bygd'),
  ('havn-vifte-verft', "K.port('finnsnes')", 'verft'),
  ('havn-vifte-marked', "K.port('finnsnes')", 'marked'),
  ('havn-naust', "K.port('vangshamn')", None),
  ('havn-avgang', "(async () => { await K.port('finnsnes'); return K.depart('botnhamn'); })()", None),
  ('sjo-stille', "K.sea(GROUNDS[0].p)", None),
  ('sjo-stille-uten-mannskap', "(async () => { K.crew(0); return K.sea(GROUNDS[0].p); })()", None),
  ('sjo-jukse-vifte', "K.sea(GROUNDS[0].p)", 'jukse'),
  ('sjo-line', "(async () => { K.crew(2); const r = await K.sea(GROUNDS[0].p); return [r, K.line()]; })()", None),
  ('sjo-line-settut', "K.sea(GROUNDS[0].p)", 'settut'),
  ('sjo-ved-kai', "(async () => { S.boat.rig = 'jukse'; const q = K.quaySpot('finnsnes'); if (!q) return 'no quay spot'; return K.sea(q); })()", None),
  ('sjo-full-last', "(async () => { const r = await K.sea(GROUNDS[0].p); return [r, K.fill()]; })()", None),
  ('sjo-krangel', "(async () => { K.empty(); const r = await K.sea(GROUNDS[0].p); S.cevt = S.cevt || {a:S.crew[0] && S.crew[0].id, b:S.crew[1] && S.crew[1].id, t:S.t}; refreshAll(); return r; })()", None),
  ('underveis', "(async () => { S.cevt = null; await K.sea(GROUNDS[0].p); return K.sail('botnhamn'); })()", None),
]


async def run(b, tag, W, H):
    out = os.path.join(ROOT, tag); os.makedirs(out, exist_ok=True)
    ctx = await b.new_context(viewport={'width': W, 'height': H}, has_touch=True, is_mobile=W < 600, device_scale_factor=2)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    await boot(pg, URL); await pg.evaluate(HOOK); await pg.evaluate("S.mult = 1; S.settings.hudMin = false; S.settings.hudFull = false; S.settings.plotMin = false; renderHud()")
    await pg.wait_for_timeout(800)
    R = {'size': [W, H], 'states': {}, 'errs': errs}
    ok = 0; bad = 0
    for name, setup, menu in STATES:
        try:
            r = await pg.evaluate(setup); await pg.wait_for_timeout(250)
            if menu: await pg.evaluate("m => { const e = document.querySelector('#dock .dk-b[data-dk=\"' + m + '\"]'); if (e) e.click(); }", menu); await pg.wait_for_timeout(400)
            m = await pg.evaluate("K.both()"); m['setup'] = r; m['small'] = await pg.evaluate("K.small()")
            await pg.screenshot(path=os.path.join(out, name + '.png'))
            if menu: await pg.evaluate("DOCK.menu(null); DOCK.close()")
            R['states'][name] = m; ok += 1
            d = m['box']
            print('OK  %-6s %-24s %-14s linja %d knapper på %d rad(er), grå %d, hero %s%s | boks %d px, stripe %d px, neste: %s, nå-rader %d | info: %s' % (
                tag, name, d['st'][:14], len(d['dock']), d['rows'], sum(1 for x in d['dock'] if x['off']), next((x['lbl'] for x in d['dock'] if x['hero']), '–'),
                (' | vifte %d på %d rad(er)' % (len(d['fan']), d['fanRows'])) if d['fan'] else '', d['hud']['r']['h'], m['strip']['hud']['r']['h'], (d['nx'] or {}).get('txt', '–'), len(d['now']), d['info'][:40]), flush=True)
        except Exception as e:
            bad += 1; print('FEIL', tag, name, str(e)[:200], flush=True)
    # the drawer pages for the «Om bord» merge, and the crew page
    try:
        await pg.evaluate("(async () => { K.crew(2); await K.port('finnsnes'); })()"); await pg.wait_for_timeout(300)
        R['drawer'] = {}
        for p in ['beholdning', 'arbeid', 'mannskap']:
            R['drawer'][p] = await pg.evaluate("p => K.drawer(p)", p); await pg.wait_for_timeout(200)
            print('OK  %-6s skuff %-12s %.0f %% av høyden, faner: %s' % (tag, p, R['drawer'][p]['share'] * 100, ', '.join('%s %.1f skjermer %d knapper' % (t['name'], t['screens'], t['btns']) for t in R['drawer'][p]['tabs'])), flush=True)
            await pg.screenshot(path=os.path.join(out, 'skuff-' + p + '.png'))
    except Exception as e: print('FEIL', tag, 'skuff', str(e)[:200])
    # the phone's home screen and the Rederi app
    try:
        await pg.evaluate("K.crew(2); refreshAll()")
        await pg.evaluate("PHONE.show(true, 'home')"); await pg.wait_for_timeout(700); h = await pg.evaluate("K.phoneHome()"); await pg.screenshot(path=os.path.join(out, 'telefon-hjem.png'))
        await pg.evaluate("PHONE.show(true, 'rederi')"); await pg.wait_for_timeout(700); rd = await pg.evaluate("K.phoneRederi()"); await pg.screenshot(path=os.path.join(out, 'telefon-rederi.png'))
        await pg.evaluate("PHONE.show(false)"); R['phone'] = {'home': h, 'rederi': rd}
        h, rd = R['phone']['home'], R['phone']['rederi']
        print('OK  %-6s telefon hjem: %d av %d apper synlige, %d kort over rutenettet (toppen på %d px av %d) | Rederi: %.1f skjermer, flåten begynner %.2f skjermer ned, knapper: %s' % (tag, h['inView'], h['apps'], h['cardsAbove'], h['gridTop'] or -1, h['H'], rd['screens'], rd['fleetScreens'] or -1, ', '.join(rd['btns'][:8])), flush=True)
    except Exception as e: print('FEIL', tag, 'telefon', str(e)[:200])
    # the census of five screens
    try:
        C = {}
        for name, js in [('havn', "K.port('finnsnes')"), ('sjo', "K.sea(GROUNDS[0].p)"), ('skuff', "(async () => { await K.port('finnsnes'); DOCK.open('beholdning'); })()"), ('telefon', "(async () => { DOCK.close(); PHONE.show(true, 'home'); })()")]:
            await pg.evaluate(js); await pg.wait_for_timeout(300); c = await pg.evaluate("K.census()")
            for k, o in c.items():
                for v, n in o.items(): C.setdefault(k, {}); C[k][v] = C[k].get(v, 0) + n
        await pg.evaluate("PHONE.show(false); DOCK.close()")
        R['census'] = {k: len(v) for k, v in C.items()}; R['censusSizes'] = sorted(C['size'].keys(), key=lambda s: float(s[:-2]))
        print('OK  %-6s telling (fire skjermer): %d skriftstørrelser (%s), %d tekstfarger, %d bakgrunner, %d radier, %d knappestiler' % (tag, R['census']['size'], ' '.join(R['censusSizes']), R['census']['color'], R['census']['bg'], R['census']['radius'], R['census']['btn']), flush=True)
    except Exception as e: print('FEIL', tag, 'telling', str(e)[:200])
    # four game hours: idle at the grounds, jigging, sailing home, the landing; a sample every five minutes
    try:
        await pg.evaluate("(async () => { K.empty(); K.crew(2); S.boat.rig = 'jukse'; await K.sea(GROUNDS[0].p); })()"); await pg.wait_for_timeout(300)
        S = []
        for i in range(6): S.append(await pg.evaluate("K.sample()")); await pg.evaluate("K.play(5)")
        await pg.evaluate("(() => { const e = document.querySelector('#dock .dk-b[data-dk=jukse]'); if (e) e.click(); })()"); await pg.wait_for_timeout(300)
        await pg.evaluate("(() => { const e = document.querySelector('[data-dk=startfish]'); if (e) e.click(); })()"); await pg.wait_for_timeout(300)
        for i in range(24): S.append(await pg.evaluate("K.sample()")); await pg.evaluate("K.play(5)")
        await pg.evaluate("(() => { const e = document.querySelector('#dock .dk-b[data-dk=stopfish]'); if (e) e.click(); })()"); await pg.wait_for_timeout(300)
        await pg.evaluate("K.sail('botnhamn')")
        for i in range(18): S.append(await pg.evaluate("K.sample()")); await pg.evaluate("K.play(5)")
        R['timeline'] = S
        n = len(S); nx = sum(1 for s in S if s['nx']); now = sum(1 for s in S if s['now']); info = sum(1 for s in S if s['info']); anyl = sum(1 for s in S if s['nx'] or s['now'] or s['info'])
        sts = {}
        for s in S: sts[s['st']] = sts.get(s['st'], 0) + 1
        print('OK  %-6s tidslinje %d prøver (%s): neste hendelse i %d, nå-rader i %d, tekst over knappene i %d, noe på tredje linje i %d (%.0f %%)' % (tag, n, ', '.join('%s %d' % kv for kv in sts.items()), nx, now, info, anyl, anyl * 100 / max(1, n)), flush=True)
    except Exception as e: print('FEIL', tag, 'tidslinje', str(e)[:200])
    json.dump(R, open(os.path.join(ROOT, tag + '.json'), 'w'), ensure_ascii=False, indent=1)
    print('sidefeil', tag, errs[:3])
    await ctx.close()
    return bad


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        bad = 0
        for tag, W, H in SIZES: bad += await run(b, tag, W, H)
        await b.close()
        print('OK  kartleggingen ferdig' if not bad else 'FEIL %d tilstander' % bad)

asyncio.run(main())
