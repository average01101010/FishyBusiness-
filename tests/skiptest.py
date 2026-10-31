"""Skippertak and Kaiboden (Jonas 12.10.2026): the energy drink for real money only, for you and the crews of the whole fleet, and the
one app with a tab each for haill, trim and Skippertak. Checks:
1. The energy model is locked: ENERGY, RORBU and the crews' fatigue rates as they were before Skippertak (docs/engasjement.md: never
   made harder to sell more). A change here must make rest easier, never harder, and the numbers below are then changed with it.
2. giveSkip: full energy, awake, every crew of the fleet at 0 fatigue, the time in game hours; a second one is added to what is left.
3. While it works the energy is held at 100 % and the crew's fatigue at 0 after hours at sea; the operations plan does not wait for
   the crew to rest; when it runs out the log says so and the energy falls again.
4. «Mest for pengene» is true: the biggest of haill, trim and Skippertak gives the most per krone, and the game's prices agree with
   the migration's.
5. Kaiboden: in the grid where Haill was, Haill and Trim not in the grid, three tabs, PHONE.open('haill') opens on the Haill tab, the
   badge on luxury luck, the turbo and Skippertak Max, a test purchase gives Skippertak. Pictures upright and on its side.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, os, re
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))

LOCK = {'sea': 100 / 24 / 60, 'quay': 100 / 8 / 60, 'warn': 25, 'sleep': 480, 'wake': 60, 'rorbu': 100 / 6 / 60}
MIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'supabase', 'migrations', '20261012120000_skippertak.sql')

async def main():
    sql = open(MIG).read()
    mig = {m.group(1): int(m.group(2)) for m in re.finditer(r"\('(skip(?:_light|_max)?)', 'booster', '[^']*', '[^']*', (\d+)", sql)}
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing']); errs = []
        for tag, W, H in [('staaende', 800, 1280), ('liggende', 1280, 800)]:
            ctx = await br.new_context(viewport={'width': W, 'height': H}, has_touch=True)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg)
            if tag == 'staaende':
                r = await pg.evaluate("""(() => ({sea:ENERGY.sea, quay:ENERGY.quay, warn:ENERGY.warn, sleep:ENERGY.sleep, wake:ENERGY.wake, rorbu:RORBU.rate, kr:RORBU.kr,
                  skip:Object.fromEntries(Object.entries(SKIP).map(([k, X]) => [k, [X.h, X.nok]]))}))()""")
                ok = all(abs(r[k] - v) < 1e-9 for k, v in LOCK.items()) and r['kr'] <= 150
                check(ok, '1. energimodellen er låst (ENERGY, RORBU), rorbua koster ikke mer enn 150 kr', r)
                check(r['skip'] == {'light': [24, 29], 'std': [48, 39], 'max': [96, 49]} and mig == {'skip_light': 29, 'skip': 39, 'skip_max': 49}, '4a. prisene i spillet og i migreringen er like: 1, 2 og 4 døgn for 29, 39 og 49 kr', {'game': r['skip'], 'db': mig})
                r = await pg.evaluate("""(() => { const R = {}; S.energy = 12; S.sleep = {t0:S.t, until:S.t + 480, v:S.cur}; S.drowsy = true;
                  const v2 = {id:'tstv', crew:[{id:'x', fatigue:80}]}; S.fleet = (S.fleet || []).concat([v2]); for (const c of S.crew) c.fatigue = 70;
                  giveSkip('light'); R.e = S.energy; R.sleep = !!S.sleep; R.dr = S.drowsy; R.crew = S.crew.map(c => c.fatigue); R.other = v2.crew[0].fatigue; R.left = Math.round(skipLeft());
                  giveSkip('std'); R.left2 = Math.round(skipLeft()); S.fleet = S.fleet.filter(v => v.id !== 'tstv'); return R; })()""")
                check(r['e'] == 100 and not r['sleep'] and not r['dr'] and all(f == 0 for f in r['crew']) and r['other'] == 0 and r['left'] == 24 and r['left2'] == 72, '2. Skippertak: full energi, vekket, mannskapet på hele flåten uthvilt, 24 t, og neste legges til (72 t)', r)
                r = await pg.evaluate("""(() => { const R = {}, b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; S.crew = S.crew.length ? S.crew : [genCrew()];
                  for (let i = 0; i < 6 * 60; i++) energyMinute(); for (const c of S.crew) c.fatigue = 40; b.status = 'fishing'; crewTick(S.t / 60); b.status = 'idle'; R.e = S.energy; R.fat = S.crew.map(c => c.fatigue);
                  // the operations plan does not wait for the crew to rest (06d-drift.js drRested), however tired they were
                  { const f0 = S.crew.map(c => c.fatigue); for (const c of S.crew) c.fatigue = 90; R.adv = drRested() && !drTired(); S.crew.forEach((c, i) => c.fatigue = f0[i]); }
                  // it runs out: said once, and the energy falls at sea
                  S.skip.until = S.t; const l0 = S.log.length; energyMinute(); R.told = S.log.slice(l0).some(l => /gått ut/.test(l.no)); for (let i = 0; i < 60; i++) energyMinute(); R.after = +S.energy.toFixed(1);
                  return R; })()""")
                check(r['e'] == 100 and all(f == 0 for f in r['fat']) and r['adv'] and r['told'] and 95 < r['after'] < 100, '3. energien holdes på 100 % til sjøs, driftsplanen venter ikke på hvile, utløpet står i loggen og energien faller igjen', r)
                r = await pg.evaluate("""(() => { const per = steps => steps.reduce((a, s, i) => a + (s[0] - (i ? steps[i - 1][0] : 0)) * s[1], 0);
                  const h = ['haill', 'luksus'].map(k => per(HAILL[k].steps) / HAILL[k].nok), t = Object.values(BOOSTS).map(B => (B.x - 1) * B.h / B.nok), s = Object.values(SKIP).map(X => X.h / X.nok);
                  const top = a => a.indexOf(Math.max(...a)) === a.length - 1; return {h, t, s, ok:top(h) && top(t) && top(s)}; })()""")
                check(r['ok'], '4b. «Mest for pengene» stemmer: den største av haill, trim og Skippertak gir mest per krone', r)
            # Kaiboden
            r = await pg.evaluate("""(async () => { S.tut = 0; PHONE.show(true, 'home'); await new Promise(r => setTimeout(r, 300)); const R = {};
              R.grid = ['kaiboden', 'haill', 'trim'].map(a => !!document.querySelector('#phone .ph-app[data-a=' + a + ']'));
              document.querySelector('#phone .ph-app[data-a=kaiboden]').click(); await new Promise(r => setTimeout(r, 300)); R.app1 = PHONE.app;
              R.tabs = [...document.querySelectorAll('#phone .kb-tab')].map(b => b.dataset.a); R.title = (document.querySelector('#phone .ph-top') || {}).textContent;
              document.querySelector('#phone .kb-tab[data-a=skip]').click(); await new Promise(r => setTimeout(r, 300)); R.app2 = PHONE.app;
              R.best = [...document.querySelectorAll('#phone .ph-card h4')].filter(h => h.querySelector('.kb-best')).map(h => h.firstChild.textContent.trim());
              const until0 = S.skip ? S.skip.until : 0; document.querySelector('#phone [data-pa=skipbuy][data-k=max]').click(); await new Promise(r => setTimeout(r, 300)); R.bought = skipOn() && S.skip.until > until0 && S.skip.k === 'max';
              PHONE.show(false); PHONE.open('haill'); await new Promise(r => setTimeout(r, 300)); R.app3 = PHONE.app; R.title3 = (document.querySelector('#phone .ph-top') || {}).textContent; R.bestH = [...document.querySelectorAll('#phone .kb-best')].length;
              document.querySelector('#phone .kb-tab[data-a=trim]').click(); await new Promise(r => setTimeout(r, 300)); R.bestT = [...document.querySelectorAll('#phone .ph-card h4')].filter(h => h.querySelector('.kb-best')).map(h => h.textContent).join(' | ');
              const bx = [...document.querySelectorAll('#phone .kb-tab')].map(b => b.getBoundingClientRect()); R.tabH = Math.round(Math.min(...bx.map(b => b.height))); R.tabRight = Math.round(Math.max(...bx.map(b => b.right))); R.W = innerWidth;
              return R; })()""")
            await pg.screenshot(path='kaiboden_trim_%s.png' % tag)
            await pg.evaluate("(async () => { document.querySelector('#phone .kb-tab[data-a=skip]').click(); })()"); await pg.wait_for_timeout(400); await pg.screenshot(path='kaiboden_skip_%s.png' % tag)
            await pg.evaluate("(async () => { document.querySelector('#phone .kb-tab[data-a=haill]').click(); })()"); await pg.wait_for_timeout(400); await pg.screenshot(path='kaiboden_haill_%s.png' % tag)
            ok = r['grid'] == [True, False, False] and r['app1'] in ('haill', 'trim', 'skip') and r['tabs'] == ['haill', 'trim', 'skip'] and 'Kaiboden' in (r['title'] or '') and r['app2'] == 'skip'
            check(ok, '5a. %s: Kaiboden i rutenettet (ikke Haill og Trim), tre faner, tittel Kaiboden' % tag, r)
            check(r['best'] == ['Skippertak Max'] and r['bought'] and r['app3'] == 'haill' and 'Kaiboden' in (r['title3'] or '') and r['bestH'] == 1 and 'turbotrykk' in r['bestT'].lower(), '5b. %s: «Mest for pengene» på Skippertak Max, luksushaill og turbotrykk; testkjøp gir Skippertak; PHONE.open(\'haill\') åpner Kaiboden på Haill-fanen' % tag, r)
            check(r['tabH'] >= 36 and r['tabRight'] <= r['W'], '5c. %s: fanene er store nok for en finger og innenfor skjermen' % tag, {k: r[k] for k in ('tabH', 'tabRight', 'W')})
            await ctx.close()
        print('sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
