"""Runs the tests and sums them up. Only what is needed: while building, the tests for the files you changed; everything only
before publishing.

  python3 tests/run.py changed            the tests that cover the files changed since the last commit (while building)
  python3 tests/run.py smoke test ...     just the tests you name
  python3 tests/run.py full               the whole regression (before publishing)
  python3 tests/run.py full --3d          the same with 3D drawn in every test

The tests that do not look at 3D run with KYST_LITE=1: the game runs as before, but no 3D frame is drawn (#no3d), and that is
most of the time a test takes with SwiftShader. They run two at a time, first. Then the 3D tests (and tut.py, which draws 3D)
run one after the other with nothing beside them: SwiftShader's frames stall under any other load, so a 3D test beside the others
timed out on clicks and screenshots (03.10.2026). The tests that measure milliseconds (SOLO) run alone at the end. Each test's whole output lands in tests/out/logs/<test>.txt.

A test fails on a FEIL line, a Python error, a time-out, page errors, or what that test must end with (trip2 in port, tut.py with
"tut": 0, dbg23o with no output). The tests that print numbers to be read (the calibration, selltest, hailltest) are marked LES,
with their last lines shown."""
import os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LOGS = os.path.join(HERE, 'out', 'logs')
os.makedirs(LOGS, exist_ok=True)

# draw 3D: they look at the 3D view itself (frames, camera, quays, cranes, pumps)
D3 = ['dbg23o', 'trackfollow', 'tral3d', 'seatrytest', 'sitetest', 'coast3d', 'ultratest', 'camtest', 'moortest', 'landtest', 'bunkertest', 'heattest', 'vessel3d', 'unittest', 'sea3d', 'teleport3d', 'lighttest', 'kinotest', 'haultest', 'vectest', 'potshot', 'aurorashot']
LITE = ['climtest', 'sqltest', 'cloudtest', 'kjoptest', 'r4test', 'tutdrift', 'worldtest', 'pushtest', 'feedbacktest', 'hudtest', 'obstest', 'marktest', 'rorbutest', 'admintest', 'tut', 'starttest', 'dreamtest', 'seasontest', 'uishots', 'quotatest', 'rulestest', 'npctest', 'tidetest', 'trip2', 'docktest', 'booktest', 'decktest', 'geartest', 'loretest', 'tattest', 'towtest', 'airtest', 'fleet2test', 'fleet3test', 'opsowntest', 'routetest',
        'shoptest', 'selltest', 'timetest', 'worktest', 'vesseltest', 'streaktest', 'fixtest', 'hailltest', 'harbourtest', 'simday', 'calib', 'kvtest', 'progweek', 'seatest', 'stabtest', 'projtest', 'boottest', 'maptest', 'mig2test', 'charttest', 'helmtest', 'soundtest', 'sleeptest', 'pwatest']
# they measure milliseconds, so they run alone at the end, when nothing else takes the CPU
SOLO = ['routetest', 'heattest', 'landtest', 'charttest']
READ = {'selltest', 'hailltest', 'simday', 'calib', 'kvtest', 'progweek', 'seatest'}
LONG = {'tut': 1800, 'vessel3d': 2400, 'sea3d': 3000, 'vectest': 1500, 'heattest': 3600}   # SwiftShader can take ~40 s for one 3D screenshot; sea3d takes 27
# not in D3, but they draw 3D all the same (tut.py plays the first trip with the 3D view), so they run in the 3D lane
DRAWS3D = {'tut'}
MUST = {'trip2': ('"st":"port"', 'ender ikke i havn'), 'tut': ('"tut": 0', 'veiledningen er ikke ferdig')}
# which tests cover which file: «changed» runs these for the files in the diff. A file not listed runs trip2; texts and docs run nothing
COVER = {
  'src/js/ui/10f-cloud.js':['cloudtest', 'pwatest', 'boottest', 'pushtest'], 'src/js/ui/10g-push.js':['pushtest'], 'src/js/ui/10h-world.js':['cloudtest'], 'src/js/ui/10i-shop.js':['kjoptest'], 'supabase/migrations/20261006040000_shop.sql':['sqltest'], 'supabase/migrations/20261006120000_feedback_agent.sql':['sqltest'], 'supabase/migrations/20261006140000_feedback_reward.sql':['sqltest'], 'supabase/migrations/20261006160000_device_data.sql':['sqltest'], 'src/data/climate.json':['climtest'], 'tools/climate/fetch.py':[], 'supabase/functions/shop-checkout/index.ts':['kjoptest'], 'supabase/functions/stripe-webhook/index.ts':['sqltest'], 'src/data/loader-land.b64':['boottest'], 'src/data/loader-port.b64':['boottest'], 'src/vendor/authkit.js':['cloudtest'], 'src/admin/index.html':['admintest'], 'src/data/cloud.json':['cloudtest', 'admintest'],
  'src/legal/personvern.html':['cloudtest'], 'supabase/migrations/20261005120000_push.sql':['sqltest'], 'src/legal/vilkar.html':['cloudtest'], 'src/legal/kilder.html':['cloudtest'], 'src/legal/kontakt.html':['cloudtest'], 'src/data/font-archivo.b64':['cloudtest'], 'src/data/font-serif.b64':['cloudtest'], 'src/data/font-serif-i.b64':['cloudtest'], 'src/legal/legal.css':['cloudtest'],
  'supabase/migrations/20261004120000_cloud.sql':['sqltest'], 'supabase/migrations/20261005180000_feedback.sql':['sqltest'], 'supabase/migrations/20261005200000_save_sync.sql':['sqltest'], 'supabase/migrations/20261006000000_world_v2.sql':['sqltest'], 'supabase/migrations/20261006010000_feedback_media.sql':['sqltest', 'feedbacktest'], 'supabase/migrations/20261006020000_toplist.sql':['sqltest', 'cloudtest'],  'supabase/migrations/20261006030000_push_rules.sql':['sqltest', 'pushtest'], 'supabase/migrations/20261005220000_presence.sql':['sqltest'], 'src/js/ui/06e-feedback.js':['feedbacktest'],
  'src/js/core/00-proj.js':['projtest', 'trip2'], 'src/js/core/01b-mapdata.js':['maptest', 'boottest', 'trip2', 'dbg23o', 'teleport3d'], 'src/js/core/01c-vec.js':['vectest', 'npctest', 'harbourtest', 'trip2'], 'src/js/core/01d-coast.js':['routetest', 'charttest', 'maptest', 'trip2', 'npctest', 'helmtest', 'harbourtest', 'seatest', 'moortest'], 'tools/mappack.mjs':[], 'build.mjs':['boottest', 'trip2', 'pwatest', 'vectest'], 'src/pwa/sw.js':['pwatest'], 'src/pwa/manifest.webmanifest':['pwatest'], 'src/data/map/manifest.json':['trip2', 'maptest', 'harbourtest', 'moortest', 'unittest', 'landtest', 'routetest', 'seatest', 'dbg23o', 'sea3d', 'teleport3d'], 'src/js/core/01-world.js':['trip2', 'harbourtest', 'unittest', 'worldtest'], 'src/js/core/02-species-gear.js':['selltest', 'shoptest', 'vesseltest'], 'src/data/boat-tral60.b64':['tral3d', 'vesseltest'], 'src/data/boat-not75.b64':['tral3d'], 'src/js/core/03-simulation.js':['heattest', 'decktest', 'simday', 'calib', 'vesseltest', 'unittest', 'tidetest', 'climtest'], 'src/data/tide.json':['tidetest', 'unittest'], 'src/js/core/07d-rorbu.js':['rorbutest', 'coast3d'], 'src/data/rorbuer.json':['rorbutest', 'coast3d'], 'src/data/harbour-rorbu.b64':['coast3d'],
  'src/js/core/03b-sea.js':['seatest', 'calib', 'simday', 'progweek', 'trip2', 'sea3d'],
  'src/js/core/03d-quota.js':['quotatest', 'fleet2test', 'selltest', 'progweek'], 'src/js/core/03e-rules.js':['rulestest', 'r4test', 'geartest', 'selltest', 'vesseltest', 'trip2'], 'src/data/rules.json':['rulestest', 'trip2'], 'tools/rules/regler.py':[], 'tools/rules/fetch.py':[], 'tools/rules/look.py':[],
  'src/js/core/03c-stability.js':['stabtest', 'calib', 'simday', 'progweek', 'worktest', 'trip2', 'sea3d'],
  'src/js/core/04-crew.js':['fleet2test', 'opsowntest', 'worktest'], 'src/js/core/05-vessels.js':['decktest', 'trip2', 'heattest', 'worktest', 'vectest', 'npctest', 'towtest', 'tattest'], 'src/data/boat-redning.b64':['towtest', 'dbg23o'], 'src/js/core/06-services.js':['fixtest', 'fleet3test', 'opsowntest'],
  'src/js/core/07-harbours.js':['harbourtest', 'landtest', 'bunkertest', 'moortest', 'unittest', 'vectest', 'rorbutest'], 'src/js/core/08-lore.js':['loretest'], 'src/js/core/09-tattoos.js':['tattest'],
  'src/js/core/10-gear.js':['geartest', 'booktest'], 'src/js/core/11-route.js':['routetest', 'obstest'], 'src/js/core/11b-obstacles.js':['obstest', 'routetest'], 'src/js/core/01e-marks.js':['marktest', 'obstest', 'lighttest'], 'src/js/core/12-heat.js':['heattest'], 'src/js/core/13-work.js':['worktest', 'decktest', 'opsowntest'], 'src/js/core/14-crewlife.js':['worktest', 'fleet2test'], 'src/js/core/15-energy.js':['worktest', 'trip2', 'sleeptest', 'rorbutest', 'sitetest'],
  'src/js/ui/01-i18n.js':[], 'src/js/ui/02-format-state.js':['timetest', 'mig2test', 'pwatest'], 'src/js/ui/03-map.js':['routetest', 'charttest', 'vectest', 'npctest'], 'src/js/ui/03a-chart.js':['charttest'], 'src/js/ui/03b-route.js':['routetest', 'r4test'],
  'src/js/ui/03c-heat.js':['heattest'], 'src/js/ui/03e-miniplot.js':['teleport3d', 'tut'], 'src/js/ui/03d-setmode.js':['docktest'], 'src/js/ui/04-panels-instruments.js':['heattest', 'hudtest'],
  'src/js/ui/05-phone.js':['docktest', 'fleet3test', 'shoptest', 'vesseltest', 'teleport3d'], 'src/js/ui/05-tattoo-art.js':['tattest'], 'src/js/ui/05b-work.js':['worktest', 'sleeptest'], 'src/js/ui/06-logbook.js':['booktest'], 'src/js/ui/06b-book-tabs.js':['booktest'],
  'src/js/ui/07-guide.js':['shoptest', 'selltest', 'r4test'], 'src/js/ui/07b-first-trip.js':['tut'], 'src/js/ui/08b-letter.js':['tut'], 'src/data/letter-env-front.b64':['tut'], 'src/data/letter-env-pocket.b64':['tut'], 'src/data/letter-env-inside.b64':['tut'], 'src/data/letter-env-flap.b64':['tut'], 'src/data/letter-paper.b64':['tut'], 'src/data/font-caveat.b64':['tut'], 'src/data/font-rocksalt.b64':['tut'], 'src/js/ui/08-actions.js':['trip2', 'trackfollow', 'r4test', 'docktest', 'booktest', 'shoptest', 'boottest', 'kinotest', 'worldtest'],
  'src/js/ui/09-hand-fishing.js':['hailltest', 'fixtest'], 'src/js/ui/10-rod-acts.js':['docktest', 'tut'], 'src/js/ui/10-gear-ui.js':['geartest', 'docktest'],
  'src/js/ui/10c-dock.js':['docktest', 'geartest', 'rorbutest'], 'src/js/ui/10d-helm.js':['helmtest'], 'src/js/ui/10e-sound.js':['soundtest'], 'src/js/core/16-helm.js':['helmtest', 'trip2', 'rorbutest', 'worldtest'], 'src/js/ui/11-boot.js':['trip2', 'boottest', 'worldtest'], 'src/js/view3d.js':['dbg23o', 'trackfollow', 'tral3d', 'seatrytest', 'sitetest', 'routetest', 'unittest', 'landtest', 'sea3d', 'teleport3d', 'lighttest', 'kinotest', 'haultest', 'vectest', 'ultratest'], 'src/data/haul-garn.b64':['haultest'], 'src/data/gear-marks.b64':['haultest', 'dbg23o'], 'src/data/gear-pot.b64':['potshot'], 'tools/gear/teine.py':['potshot'], 'src/js/core/05c-air.js':['airtest', 'dbg23o'], 'src/data/air.b64':['airtest', 'dbg23o'], 'src/data/fish.b64':['vesseltest', 'dbg23o'], 'src/data/haul-line.b64':['haultest'], 'src/js/vessel3d.js':['vessel3d', 'dbg23o', 'vesseltest'], 'src/data/boat-malo36.b64':['vessel3d', 'vesseltest'], 'src/data/boat-havsjark35.b64':['vessel3d', 'vesseltest'], 'src/data/boat-havsjark35-side.b64':['vesseltest'], 'src/data/boat-skiff59.b64':['vessel3d', 'vesseltest', 'camtest', 'moortest'], 'src/data/boat-skiff59-side.b64':['vesseltest'], 'src/data/boat-snekke23.b64':['vessel3d', 'vesseltest', 'tut'], 'src/data/boat-snekke23-side.b64':['vesseltest'], 'src/data/boat-malo36-side.b64':['vesseltest'], 'src/data/worker.b64':['vessel3d', 'camtest', 'landtest', 'dbg23o'], 'src/data/harbour-unit.b64':['unittest', 'landtest', 'bunkertest', 'moortest'], 'src/styles.css':['docktest', 'uishots'], 'src/js/core/06b-coastports.js':['starttest', 'trip2', 'seasontest', 'coast3d'], 'src/js/ui/08c-start.js':['starttest', 'tut'], 'src/js/core/09b-dream.js':['dreamtest', 'trip2'], 'src/js/ui/06c-notebook.js':['dreamtest'], 'src/js/core/09c-seasons.js':['seasontest', 'trip2'], 'src/js/core/09d-folk.js':['seasontest', 'trip2'], 'src/js/ui/06d-season-folk.js':['seasontest'], 'src/js/core/07c-naust.js':['sitetest'], 'src/data/harbour-naust.b64':['sitetest'], 'src/data/harbour-shop.b64':['sitetest'], 'src/data/mottak.json':['starttest'], 'src/js/ui/07b-first-trip.js':['tut', 'starttest', 'tutdrift'], 'src/index.html':['trip2', 'docktest']}


def changed_tests():
    git = lambda *a: subprocess.run(['git'] + list(a), cwd=ROOT, capture_output=True, text=True).stdout.split()
    files = sorted(set(git('diff', '--name-only', 'HEAD') + git('ls-files', '--others', '--exclude-standard')))
    out = []
    for f in files:
        if f in COVER: out += COVER[f]
        elif f.startswith('tests/') and f.endswith('.py') and os.path.basename(f)[:-3] in D3 + LITE: out.append(os.path.basename(f)[:-3])
        elif f.startswith('src/'): out.append('trip2')
    return files, list(dict.fromkeys(out))


ERRS = re.compile(r'^\s*(?:errors|sidefeil|page ?errors?)\s*:?\s*(\[.*\])\s*$', re.I)


def run(name, lite):
    env = dict(os.environ, KYST_LITE='1' if lite else '0', PYTHONUNBUFFERED='1')
    t0 = time.time(); log = os.path.join(LOGS, name + '.txt')
    try:
        p = subprocess.run([sys.executable, os.path.join(HERE, name + '.py')], cwd=ROOT, env=env, capture_output=True, text=True, timeout=LONG.get(name, 900))
        out, code = p.stdout + p.stderr, p.returncode
    except subprocess.TimeoutExpired as e:
        out, code = (e.stdout or b'').decode() if isinstance(e.stdout, bytes) else (e.stdout or ''), 'tid'
    dt = time.time() - t0
    open(log, 'w').write(out)
    lines = out.splitlines()
    ok = sum(1 for l in lines if l.startswith('OK'))
    bad = [l for l in lines if l.startswith('FEIL') or l.startswith('FAIL')]
    why = []
    if code == 'tid': why.append('gikk ut på tid')
    elif code != 0: why.append('avsluttet med kode ' + str(code))
    if 'Traceback' in out: why.append('Python-feil: ' + next((l for l in reversed(lines) if l.strip()), '')[:200])
    for l in lines:
        m = ERRS.match(l)
        if not m and name in ('trip2', 'tut'): m = re.match(r'^\s*(\[.*\])\s*$', l)   # they print the page errors as a bare list
        if m and m.group(1).strip() != '[]': why.append('sidefeil: ' + m.group(1)[:200])
    if name in MUST and MUST[name][0] not in out: why.append(MUST[name][1])
    if name == 'dbg23o' and out.strip(): why.append('dbg23o skrev ut noe')
    status = 'FEIL' if bad or why else ('LES' if name in READ and not ok else 'OK')
    return {'name':name, 'lite':lite, 'dt':dt, 'ok':ok, 'bad':bad, 'why':why, 'status':status, 'tail':lines[-12:]}


def report(r):
    mode = 'uten 3D' if r['lite'] else 'med 3D'
    print('%-4s %-12s %5.0f s  %s%s' % (r['status'], r['name'], r['dt'], mode, ('  · %d OK' % r['ok']) if r['ok'] else ''), flush=True)
    for l in r['bad']: print('       ' + l[:300])
    for w in r['why']: print('       ' + w)
    if r['status'] == 'LES':
        for l in r['tail']: print('       | ' + l[:200])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    all3d = '--3d' in sys.argv
    if not args or args[0] not in ('changed', 'smoke', 'full'):
        print(__doc__); sys.exit(2)
    if args[0] == 'changed':
        files, names = changed_tests()
        print('Endrede filer: ' + (', '.join(files) or 'ingen'))
        if not names: print('Ingen tester dekker disse endringene. Ingenting å kjøre.'); sys.exit(0)
    else: names = [a.replace('.py', '') for a in args[1:]] if args[0] == 'smoke' else D3 + LITE
    names = list(dict.fromkeys(names))
    missing = [n for n in names if not os.path.exists(os.path.join(HERE, n + '.py'))]
    if missing: print('Finner ikke: ' + ', '.join(missing)); sys.exit(2)
    solo = [n for n in names if n in SOLO]
    heavy = [n for n in names if (n in D3 or n in DRAWS3D or all3d) and n not in solo]
    light = [n for n in names if n not in heavy and n not in solo]
    print('Bygg først: node build.mjs. %d tester: %d uten 3D to om gangen, så %d med 3D alene etter hverandre, og %d som måler tid, alene til slutt. Logger: tests/out/logs/' % (len(names), len(light), len(heavy), len(solo)), flush=True)
    t0 = time.time(); res = []
    with ThreadPoolExecutor(2) as ex:
        for r in ex.map(lambda n: run(n, True), light):
            report(r); res.append(r)
    for n in heavy:
        r = run(n, n not in D3 and not all3d); report(r); res.append(r)
    for n in solo:
        r = run(n, not (all3d or n in D3)); report(r); res.append(r)
    bad = [r['name'] for r in res if r['status'] == 'FEIL']
    les = [r['name'] for r in res if r['status'] == 'LES']
    print('\n%d OK, %d FEIL, %d å lese, på %.0f s.%s%s' % (sum(r['status'] == 'OK' for r in res), len(bad), len(les), time.time() - t0,
          (' Feil i: ' + ', '.join(bad) + '.') if bad else '', (' Les: ' + ', '.join(les) + '.') if les else ''))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
