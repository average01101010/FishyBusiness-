"""Runs the tests and sums them up. Only what is needed: while building, the tests for the files you changed; everything only
before publishing.

  python3 tests/run.py changed            the tests that cover the files changed since the last commit (while building)
  python3 tests/run.py smoke test ...     just the tests you name
  python3 tests/run.py full               the whole regression (before publishing)
  python3 tests/run.py full --3d          the same with 3D drawn in every test
  python3 tests/run.py historikk         per test: runs, red, the pattern (OPOOP), from tests/historikk.tsv (in git) and the regressions' copies
  python3 tests/run.py utenfor            the test scripts in tests/ that are in none of the lists (D3, LITE, SOLO), so never run
  node tests/unit/run.mjs                 the unit tests of the core alone (run.py runs them first when src/js/core/ changed)

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
D3 = ['sunshot', 'havshot', 'kaishot', 'signcoast', 'signtest', 'trytest', 'gfxtest', 'benchshot', 'profshot', 'f1test', 'havnshot', 'lifeshot', 'wetshot', 'vindshot', 'treeshot', 'wakeshot', 'anchor3d', 'skytest', 'jigshot', 'naust3dtest', 'pubtest', 'helmjit', 'anchorlight3d', 'saytest', 'yardtest', 'dbg23o', 'trackfollow', 'tral3d', 'seatrytest', 'sitetest', 'coast3d', 'ultratest', 'camtest', 'moortest', 'landtest', 'bunkertest', 'heattest', 'vessel3d', 'unittest', 'sea3d', 'teleport3d', 'lighttest', 'kinotest', 'haultest', 'vectest', 'potshot', 'aurorashot', 'skoddeshot', 'deckshot', 'workshot', 'brotest', 'svalbardtest', 'qdowntest', 'h2dshot', 'hull3d', 'h3dshot']
LITE = ['kotest', 'driftsplan2kyst', 'megletest', 'boostklokke', 'draftlooptest', 'bootgtest', 'skipdrift', 'haillplass', 'colregtest', 'rttest', 'istest', 'lybtest', 'havtur', 'snokrabbetest', 'krabbefabrikktest', 'autolinetest', 'fabrikktest', 'havplantest', 'sonetest', 'uketest', 'kystkarttest', 'havflaate', 'etikett', 'sponsor2test', 'sponsortest', 'markettest', 'nettest', 'itemcardtest', 'kystvakttest', 'lagtest', 'eventtest', 'boktest', 'lotttest', 'skattetest', 'driftsplan2test', 'driftsplan2ui', 'driftsplan2map', 'driftsplan2gui', 'slidertest', 'anchorswing', 'selfcrew', 'crewclip', 'regmarktest', 'dockrow', 'hulltest', 'dyntest', 'crewlifetest', 'crewwalk', 'walktest', 'tabtest', 'navbarshot', 'skiptest', 'synctest', 'installtest', 'looktest', 'hbtest', 'naustclear', 'rectest', 'ptowtest', 'seaworktest', 'hailtest', 'gbtest', 'sharetest', 'friendtest', 'searchtest', 'savestest', 'caretest', 'yardupgtest', 'jigalongtest', 'heatgeartest', 'anchortest', 'plantsaytest', 'cashfxtest', 'autonavtest', 'placetest', 'sidetab', 'guidetest', 'stedertest', 'icestep', 'heatpick', 'peergear', 'turtest', 'posttest', 'merketest', 'fartstidtest', 'maletest', 'climtest', 'sqltest', 'cloudtest', 'errtest', 'guesttest', 'kjoptest', 'regnrtest', 'r4test', 'tutdrift', 'tutfull', 'worldtest', 'pushtest', 'feedbacktest', 'hudtest', 'obstest', 'marktest', 'rorbutest', 'admintest', 'tut', 'starttest', 'seasontest', 'uishots', 'quotatest', 'rulestest', 'npctest', 'havntest', 'keeptest', 'tidetest', 'trip2', 'docktest', 'booktest', 'decktest', 'geartest', 'loretest', 'tattest', 'towtest', 'airtest', 'fleet2test', 'fleet3test', 'opsowntest', 'routetest', 'naustleia',
        'shoptest', 'selltest', 'timetest', 'worktest', 'vesseltest', 'adminbuytest', 'fuelcal', 'bunktest', 'lanterntest', 'streaktest', 'fixtest', 'hailltest', 'harbourtest', 'simday', 'calib', 'kvtest', 'progweek', 'seatest', 'stabtest', 'projtest', 'boottest', 'maptest', 'mig2test', 'charttest', 'helmtest', 'soundtest', 'sleeptest', 'pwatest', 'bktest', 'ordtest', 'kartlegging', 'roetest', 'mannskapshot']
# they measure milliseconds, so they run alone at the end, when nothing else takes the CPU
# driftsplan2test (Ø2 05.11.2026): S9 compares an open run with a closed one, and under load the sim tiles come in between other frames, so
# the catch differs (kg 12 % apart beside another test, 0.3 % alone; 62 OK alone): it runs alone too
# the session hooks and the deny list in .claude/ (Ø17, 06.11.2026): no browser, about a second. On a line of its own, so the sessions
# that add tests to LITE above do not meet it in a merge
LITE += ['hooktest']
# OPP1 (07.11.2026): the knives and the gaff in tiers at the tackle shop
LITE += ['opptest']
SOLO = ['routetest', 'heattest', 'landtest', 'charttest', 'driftsplan2test']
VECB = ['kaishot', 'driftsplan2kyst', 'havshot', 'npctest', 'havntest', 'lybtest', 'havtur', 'vectest', 'svalbardtest', 'lifeshot', 'havnshot', 'havflaate', 'etikett']   # need dist-vec/ with the vec packs; run.py builds it once before them (KYST_VEC_BUILT)
READ = {'selltest', 'hailltest', 'simday', 'calib', 'kvtest', 'progweek', 'seatest'}
# (teleport3d: twelve places since H1b R3, minutes each at 0.3 frames a second in SwiftShader; 900 s reached six, Ø2 05.11.2026)
LONG = {'havplantest': 2400, 'driftsplan2kyst': 1800, 'teleport3d': 3600, 'driftsplan2gui': 1200, 'signcoast': 1800, 'signtest': 1500, 'tut': 3600, 'deckshot': 2400, 'workshot': 1800, 'vessel3d': 4500, 'sea3d': 4500, 'vectest': 1500, 'svalbardtest': 1800, 'havntest': 1500, 'lybtest': 1500, 'havtur': 4800, 'havshot': 3000, 'kinotest': 1500, 'heattest': 3600, 'trackfollow': 3300, 'vindshot': 2400, 'wetshot': 2400, 'treeshot': 1500, 'lifeshot': 2400, 'havnshot': 2400, 'wakeshot': 1500, 'hull3d': 3300}   # SwiftShader can take ~40 s for one 3D screenshot; sea3d takes 27
# not in D3, but they draw 3D all the same (tut.py plays the first trip with the 3D view), so they run in the 3D lane
DRAWS3D = {'tut'}
MUST = {'trip2': ('"st":"port"', 'ender ikke i havn'), 'tut': ('"tut": 0', 'veiledningen er ikke ferdig')}
# which tests cover which file: «changed» runs these for the files in the diff. A file not listed runs trip2; texts and docs run nothing
COVER = {'tests/kartkorridortest.py':['kartkorridortest'], 'tests/legmemotest.py':['legmemotest'], 'tests/bootgtest.py':['bootgtest'], 
  'src/js/ui/phone/14-act.js':['docktest', 'turtest', 'teleport3d', 'adminbuytest', 'opptest'],
  'src/js/ui/phone/13-mannskap-bank-meld.js':['skattetest', 'lotttest', 'boktest', 'skiptest', 'docktest', 'opptest', 'vesseltest'],
  'src/js/ui/phone/12-utstyr-redskap.js':['autolinetest', 'shoptest', 'geartest', 'itemcardtest', 'opptest'], 'src/js/ui/05a-itemcard.js':['itemcardtest', 'shoptest', 'opptest'], 'tests/itemcardtest.py':['itemcardtest'], 'tests/opptest.py':['opptest'], 'tests/nettest.py':['nettest'], 'src/js/ui/phone/13b-nettet.js':['nettest', 'itemcardtest', 'shoptest', 'opptest'], 'src/js/core/10c-pick.js':['nettest'],
  'src/js/ui/phone/11-rederi.js':['boktest', 'fleet3test', 'fleet2test', 'megletest'],
  'src/js/ui/phone/10-fartoy.js':['krabbefabrikktest', 'fabrikktest', 'fleet3test', 'vesseltest', 'adminbuytest', 'havtur', 'markettest', 'opptest'], 'tests/adminbuytest.py':['adminbuytest'],
  'src/js/ui/phone/09-vaer-post-salg-redning.js':['krabbefabrikktest', 'posttest', 'shoptest'],
  'src/js/ui/phone/08-home-papers-merker.js':['kystkarttest', 'merketest', 'docktest', 'kystvakttest', 'sonetest'],
  'src/js/ui/phone/07-patch.js':['docktest'],
  'src/js/ui/phone/06-render.js':['docktest', 'skiptest', 'teleport3d'],
  'src/js/ui/phone/05-rigg-innst-admin.js':['admintest', 'docktest'],
  'src/js/ui/phone/04-kvote.js':['quotatest', 'kystvakttest'],
  'src/js/ui/phone/03-regler.js':['rulestest', 'sonetest'],
  'src/js/ui/phone/02-havn-last-agn-ordre.js':['autolinetest', 'shoptest', 'docktest', 'itemcardtest', 'geartest'],
  'src/js/ui/phone/01-haill-fiske-service.js':['shoptest', 'docktest', 'itemcardtest', 'icestep'],
  'src/js/ui/phone/00-shell.js':['docktest', 'teleport3d'],
  'src/js/view3d/25-controls.js':['helmjit', 'teleport3d', 'benchshot', 'profshot', 'f1test'],
  'src/js/view3d/24-cinema.js':['kinotest', 'wetshot', 'benchshot', 'profshot', 'gfxtest', 'hull3d'], 'tests/gfxtest.py':['gfxtest'],
  'src/js/view3d/23-camera-frame.js':['camtest', 'kinotest', 'havshot'],
  'src/js/view3d/22-docks-air.js':['vectest', 'dbg23o', 'kaishot'], 'tests/kaishot.py':['kaishot'],
  'src/js/view3d/21-rescue-anchor.js':['anchor3d', 'dbg23o'],
  'src/js/view3d/20-trawl-seine.js':['tral3d', 'benchshot', 'f1test'],
  'src/js/view3d/19-wildlife-npc.js':['dbg23o', 'vectest', 'f1test'],
  'src/js/view3d/18-setup.js':['dbg23o', 'teleport3d', 'ultratest', 'f1test', 'qdowntest', 'seatrytest'], 'tests/seatrytest.py':['seatrytest'],
  'src/js/view3d/17-draw.js':['dbg23o', 'ultratest', 'wetshot'],
  'src/js/view3d/17b-inland-water.js':['dbg23o', 'vectest', 'lighttest'],
  'src/js/view3d/16-motion.js':['trackfollow', 'routetest', 'helmjit', 'wetshot', 'hull3d'], 'tests/hull3d.py':['hull3d'],
  'src/js/view3d/15-env-mooring.js':['moortest', 'skytest', 'wetshot'],
  'src/js/view3d/17c-trees.js':['dbg23o', 'treeshot'], 'src/data/trees.b64':['treeshot'],
  'src/js/view3d/17h-shore.js':['dbg23o', 'havnshot'], 'tools/map/shore.py':[],
  'src/js/view3d/17g-marina.js':['dbg23o', 'havnshot'], 'src/data/marina.json':['havnshot'],
  'src/js/view3d/17f-near.js':['dbg23o', 'lifeshot'], 'src/data/naer.b64':['lifeshot'],
  'src/js/view3d/17e-life.js':['dbg23o', 'lifeshot'], 'src/data/dyr.b64':['lifeshot'], 'src/data/fuglefjell.json':['lifeshot'],
  'src/js/view3d/17d-vind.js':['dbg23o', 'vindshot'], 'src/data/vind.b64':['vindshot'], 'src/data/vind.json':['vindshot'],
  'src/js/view3d/14-sea.js':['sea3d', 'seatrytest', 'wakeshot'],
  'src/js/view3d/13-instruments.js':['heattest', 'dbg23o', 'wetshot'],
  'src/js/view3d/12-skiff.js':['dbg23o', 'deckshot', 'wetshot'],
  'src/js/view3d/11-bunker.js':['bunkertest'],
  'src/js/view3d/10-gear.js':['haultest', 'dbg23o'],
  'src/js/view3d/09-landing-deck.js':['landtest', 'deckshot', 'workshot'],
  'src/js/view3d/08-plants.js':['unittest', 'landtest'],
  'src/js/view3d/07-harbour-unit.js':['unittest', 'yardtest', 'signtest'],
  'src/js/view3d/06-buildings-lights.js':['vectest', 'lighttest'],
  'src/js/view3d/05-quays-breakwaters.js':['landtest', 'unittest', 'vectest', 'havnshot'],
  'src/js/view3d/04-vec-packs.js':['vectest', 'sunshot', 'svalbardtest'], 'tests/sunshot.py':['sunshot'], 'tests/svalbardtest.py':['svalbardtest'],
  'src/js/view3d/03-berths-naust.js':['sitetest', 'unittest', 'kaishot'],
  'src/js/view3d/02-mesh-terrain.js':['kaishot', 'landtest', 'teleport3d', 'dbg23o'],
  'src/js/view3d/01-shaders.js':['skytest', 'sea3d', 'lighttest', 'dbg23o', 'wetshot', 'f1test', 'gfxtest', 'sunshot'],
  'src/js/view3d/00-head.js':['dbg23o', 'teleport3d', 'benchshot', 'profshot', 'f1test', 'qdowntest'], 'tests/qdowntest.py':['qdowntest'],
  'supabase/migrations/20261012120000_skippertak.sql':['skiptest'], 'tests/skiptest.py':['skiptest'],
  'src/js/core/09i-look.js':['looktest'], 'src/js/ui/10g-wardrobe.js':['looktest'], 'src/js/ui/05j-catchfeed.js':['uishots'], 'src/js/ui/05k-ordbok.js':['uishots'], 'tools/harbour/garderobe.py':[], 'tools/harbour/garderobe_bilder.py':[], 'tools/harbour/arbeider.py':[], 'tools/harbour/vestarm.py':[], 'tests/unit/sikker.test.mjs':[], 'tests/unit/merker.test.mjs':[], 'src/data/regmerke.json':['regmarktest', 'maletest'], 'tools/regmerke/regmerke.py':[], 'tools/harbour/hender.py':[], 'tests/selfcrew.py':['selfcrew'], 'src/js/core/09f-merker.js':['merketest', 'fartstidtest', 'trip2'], 'src/js/core/09g-turer.js':['autonavtest', 'turtest', 'trip2', 'booktest'], 'src/js/ui/05f-turer.js':['turtest'], 'src/js/core/09h-press.js':['posttest', 'turtest', 'lagtest'], 'src/js/ui/05g-press.js':['posttest'], 'tests/posttest.py':['posttest'], 'supabase/migrations/20261007170000_news.sql':[], 'supabase/migrations/20261007171000_news_get_fix.sql':[], 'supabase/migrations/20261007180000_news_more.sql':[], 'supabase/migrations/20261007190000_news_skrei.sql':[], 'src/data/fyr.json':['turtest'], 'tools/map/fyr.py':[], 'tests/turtest.py':['turtest'], 'src/js/ui/05e-merker.js':['merketest'], 'src/js/core/09m-kystkart.js':['kystkarttest', 'merketest'], 'src/js/ui/05h-kystkart.js':['kystkarttest'], 'tests/kystkarttest.py':['kystkarttest'], 'tests/unit/kystkart.test.mjs':[], 'src/js/core/09n-ukas.js':['uketest'], 'src/js/ui/05i-ukas.js':['uketest'], 'tests/uketest.py':['uketest'], 'tests/unit/ukas.test.mjs':[], 'supabase/migrations/20261103120000_push_ukas.sql':['sqltest'], 'tests/merketest.py':['merketest'], 'src/js/core/09e-fartstid.js':['fartstidtest'], 'tests/fartstidtest.py':['fartstidtest'], 'src/js/ui/10j-paint.js':['maletest', 'regnrtest'], 'tests/maletest.py':['maletest'], 'tests/regnrtest.py':['regnrtest'],
  'src/js/ui/10p-install.js':['installtest'], 'supabase/migrations/20261011120000_sync.sql':['sqltest'], 'supabase/migrations/20261013120000_active.sql':['sqltest', 'synctest'], 'supabase/migrations/20261017120000_turokonomi.sql':['sqltest'], 'supabase/migrations/20261013130000_active_age.sql':['sqltest', 'synctest'], 'src/js/ui/10f-cloud.js':['tabtest', 'synctest', 'cloudtest', 'errtest', 'guesttest', 'pwatest', 'boottest', 'pushtest', 'starttest', 'bootgtest'], 'supabase/migrations/20261006180000_guest.sql':['sqltest'], 'supabase/migrations/20261007090000_livery.sql':['sqltest'], 'supabase/migrations/20261007100000_designs.sql':['sqltest'], 'supabase/migrations/20261007110000_logos.sql':['sqltest'], 'supabase/migrations/20261007120000_names.sql':['sqltest'], 'supabase/migrations/20261007130000_seen.sql':['sqltest'], 'supabase/migrations/20261008120000_pos_world.sql':['sqltest', 'cloudtest'], 'supabase/migrations/20261103120000_route.sql':['sqltest', 'cloudtest'], 'supabase/migrations/20261007140000_ach.sql':['sqltest'], 'supabase/migrations/20261007150000_funnel.sql':['sqltest'], 'supabase/migrations/20261010100000_tut_steps.sql':['sqltest'], 'supabase/migrations/20261010120000_hb.sql':['sqltest'], 'supabase/migrations/20261027120000_tut_time.sql':['sqltest'], 'tests/tutcoast.py':['tutcoast'], 'src/js/ui/10g-push.js':['skiptest', 'pushtest'], 'src/js/ui/10h-world.js':['cloudtest', 'peergear', 'eventtest', 'rttest'], 'tests/rttest.py':['rttest'], 'tools/server/rt/server.mjs':['rttest'], 'tools/server/rt/package.json':['rttest'], 'tools/server/rt/package-lock.json':['rttest'], 'supabase/migrations/20261105160000_rt_ticket.sql':['sqltest'], 'src/js/ui/10i-shop.js':['boostklokke', 'skiptest', 'kjoptest', 'guesttest'], 'supabase/migrations/20261006040000_shop.sql':['sqltest'], 'supabase/migrations/20261006120000_feedback_agent.sql':['sqltest'], 'supabase/migrations/20261006140000_feedback_reward.sql':['sqltest'], 'supabase/migrations/20261006160000_device_data.sql':['sqltest'], 'src/data/climate.json':['climtest'], 'tools/climate/fetch.py':[], 'supabase/functions/shop-checkout/index.ts':['kjoptest'], 'supabase/functions/stripe-webhook/index.ts':['sqltest'], 'supabase/functions/account-delete/index.ts':['cloudtest'], 'supabase/migrations/20261011160000_delete_me2.sql':['sqltest'], 'src/data/loader-land.b64':['boottest'], 'src/data/loader-port.b64':['boottest'], 'src/vendor/authkit.js':['cloudtest'], 'src/admin/index.html':['admintest'], 'src/data/cloud.json':['cloudtest', 'admintest'],
  'src/legal/personvern.html':['cloudtest'], 'supabase/migrations/20261005120000_push.sql':['sqltest'], 'src/legal/vilkar.html':['cloudtest'], 'src/legal/kilder.html':['cloudtest'], 'src/legal/kontakt.html':['cloudtest'], 'src/data/font-archivo.b64':['cloudtest'], 'src/data/font-serif.b64':['cloudtest'], 'src/data/font-serif-i.b64':['cloudtest'], 'src/legal/legal.css':['cloudtest'],
  'supabase/migrations/20261004120000_cloud.sql':['sqltest'], 'supabase/migrations/20261005180000_feedback.sql':['sqltest'], 'supabase/migrations/20261105120000_fb_meta.sql':['sqltest'], 'supabase/migrations/20261105130000_guest_world.sql':['sqltest'], 'supabase/migrations/20261105140000_liv_owned.sql':['sqltest'], 'supabase/migrations/20261105150000_rydd.sql':['sqltest'], 'supabase/migrations/20261005200000_save_sync.sql':['sqltest'], 'supabase/migrations/20261006000000_world_v2.sql':['sqltest'], 'supabase/migrations/20261006010000_feedback_media.sql':['sqltest', 'feedbacktest'], 'supabase/migrations/20261006020000_toplist.sql':['sqltest', 'cloudtest'],  'supabase/migrations/20261006030000_push_rules.sql':['sqltest', 'pushtest'], 'supabase/migrations/20261005220000_presence.sql':['sqltest'], 'src/js/ui/06e-feedback.js':['feedbacktest'],
  'src/js/core/00-proj.js':['projtest', 'trip2'], 'src/js/core/01b-mapdata.js':['maptest', 'boottest', 'trip2', 'dbg23o', 'teleport3d'], 'src/data/flyte.json':['vectest'], 'src/js/core/01c-vec.js':['vectest', 'npctest', 'harbourtest', 'trip2', 'vindshot'], 'src/js/core/01d-coast.js':['routetest', 'charttest', 'maptest', 'trip2', 'npctest', 'helmtest', 'harbourtest', 'seatest', 'moortest'], 'tools/mappack.mjs':[], 'build.mjs':['boottest', 'trip2', 'pwatest', 'vectest', 'errtest'], 'src/js/errtrap.js':['errtest', 'cloudtest', 'boottest'], 'tests/errtest.py':['errtest'], 'supabase/migrations/20261102150000_err_alert.sql':['sqltest'], 'supabase/functions/_shared/report.ts':['sqltest'], 'tools/map/deep.py':['bktest'], 'tests/bktest.py':['bktest'], 'tests/walktest.py':['walktest'], 'src/js/deckcrew.js':['crewwalk', 'crewclip', 'jigshot', 'workshot', 'selfcrew'], 'tests/crewclip.py':['crewclip'], 'tools/deck/pause.py':[], 'src/data/deck-pause.b64':['workshot'], 'tests/crewwalk.py':['crewwalk'], 'src/pwa/sw.js':['pwatest'], 'src/pwa/manifest.webmanifest':['pwatest'], 'src/pwa/favicon.svg':['pwatest'], 'src/pwa/icon-192.png':['pwatest'], 'src/pwa/icon-512.png':['pwatest'], 'src/pwa/icon-maskable-512.png':['pwatest'], 'src/pwa/og-image.jpg':[], 'src/brand/logo.svg':['boottest', 'uketest', 'cloudtest'], 'tools/brand/logo-assets.mjs':[], 'tools/brand/og-photo.jpg':[], 'src/data/map/manifest.json':['trip2', 'maptest', 'harbourtest', 'moortest', 'unittest', 'landtest', 'routetest', 'seatest', 'dbg23o', 'sea3d', 'teleport3d'], 'src/js/core/01-world.js':['trip2', 'harbourtest', 'unittest', 'worldtest', 'draftlooptest', 'legmemotest'], 'tests/draftlooptest.py':['draftlooptest'], 'src/js/core/02-species-gear.js':['selltest', 'shoptest', 'vesseltest', 'fuelcal', 'bktest', 'opptest'], 'tests/fuelcal.py':['fuelcal'], 'src/data/boat-tral60.b64':['tral3d', 'vesseltest', 'brotest'], 'src/data/boat-not75.b64':['tral3d', 'brotest'], 'src/data/boat-al45.b64':['tral3d', 'vesseltest', 'brotest', 'h2dshot'], 'src/data/boat-krabbe50.b64':['tral3d', 'vesseltest', 'brotest'], 'src/data/boat-ringnot38.b64':['vessel3d', 'vesseltest', 'brotest', 'lanterntest'], 'src/data/boat-ringnot38-side.b64':['vesseltest'], 'tools/boats/ringnot38.py':['vessel3d'], 'src/data/boat-kyst21.b64':['tral3d', 'vesseltest'], 'src/data/boat-kyst15.b64':['tral3d', 'vesseltest', 'brotest'], 'src/data/boat-hs11.b64':['tral3d', 'vesseltest', 'brotest'], 'src/js/core/03-simulation.js':['tutfull', 'skattetest', 'lotttest', 'boktest', 'keeptest', 'heattest', 'decktest', 'simday', 'calib', 'vesseltest', 'fuelcal', 'unittest', 'tidetest', 'climtest', 'bktest', 'yardupgtest'], 'src/data/tide.json':['tidetest', 'unittest'], 'src/js/core/07d-rorbu.js':['rorbutest', 'coast3d'], 'src/js/core/07e-havn.js':['kaishot', 'havntest', 'driftsplan2kyst'], 'src/js/core/07f-kar.js':['landtest', 'vesseltest', 'yardupgtest'], 'tests/karshot.py':[], 'tests/karland.py':[], 'tests/landtest.py':['landtest'], 'tests/havntest.py':['havntest'], 'tests/keeptest.py':['keeptest'], 'supabase/migrations/20261023120000_berths.sql':[], 'src/data/rorbuer.json':['rorbutest', 'coast3d', 'placetest'], 'src/data/harbour-rorbu.b64':['coast3d'], 'src/data/harbour-brygge.b64':['vectest'], 'tools/harbour/brygge.py':[],
  'src/js/core/03b-sea.js':['seatest', 'calib', 'simday', 'progweek', 'trip2', 'sea3d'],
  'src/js/core/03d-quota.js':['autolinetest', 'quotatest', 'fleet2test', 'selltest', 'progweek', 'bktest'], 'src/js/core/03e-rules.js':['snokrabbetest', 'autolinetest', 'rulestest', 'sonetest', 'r4test', 'geartest', 'selltest', 'vesseltest', 'trip2', 'bktest'], 'src/data/rules.json':['rulestest', 'sonetest', 'trip2'], 'tools/rules/regler.py':[], 'tools/rules/fetch.py':[], 'tools/rules/look.py':[],
  'src/js/core/03c-stability.js':['stabtest', 'calib', 'simday', 'progweek', 'worktest', 'trip2', 'sea3d', 'hull3d'],
  'src/js/core/04-crew.js':['krabbefabrikktest', 'fabrikktest', 'lotttest', 'skiptest', 'fleet2test', 'opsowntest', 'worktest', 'crewlifetest', 'selfcrew', 'lybtest'], 'src/js/core/05-vessels.js':['tutfull', 'krabbefabrikktest', 'colregtest', 'keeptest', 'autonavtest', 'turtest', 'decktest', 'trip2', 'heattest', 'worktest', 'vectest', 'npctest', 'towtest', 'tattest', 'peergear'], 'src/data/boat-redning.b64':['towtest', 'dbg23o'], 'src/js/core/06-services.js':['posttest', 'turtest', 'fixtest', 'fleet3test', 'opsowntest', 'seasontest'],
  'src/js/core/07-harbours.js':['krabbefabrikktest', 'fabrikktest', 'kotest', 'kaishot', 'naustleia', 'harbourtest', 'landtest', 'bunkertest', 'moortest', 'unittest', 'vectest', 'rorbutest', 'havntest', 'havtur'], 'src/js/core/08-lore.js':['loretest'], 'src/js/core/09-tattoos.js':['tattest'],
  'src/data/deck-mob.b64':['deckshot'], 'tools/deck/mob.py':[], 'tools/boats/glbadd.py':[], 'tools/boats/qa/glbdiff.py':[],
  'src/js/core/06d-plan-felles.js':['skiptest', 'driftsplan2test', 'opsowntest', 'fleet2test', 'geartest', 'skipdrift'], 'src/js/core/06g-plan2.js':['skipdrift', 'driftsplan2test', 'havplantest', 'driftsplan2kyst'], 'src/js/core/06h-plan2-engine.js':['skipdrift', 'driftsplan2test', 'fleet2test', 'havplantest', 'driftsplan2kyst'], 'tests/driftsplan2test.py':['driftsplan2test', 'driftsplan2kyst'], 'tests/driftsplan2kyst.py':['driftsplan2kyst'], 'src/js/ui/05d-plan2.js':['driftsplan2ui', 'driftsplan2test', 'havplantest', 'driftsplan2kyst'], 'src/js/ui/03g-planmap.js':['driftsplan2map'], 'tests/driftsplan2map.py':['driftsplan2map'], 'tests/driftsplan2ui.py':['driftsplan2ui'], 'tests/opsowntest.py':['opsowntest'], 'tests/fleet2test.py':['fleet2test'], 'tests/fleet3test.py':['fleet3test'], 'tests/geartest.py':['geartest'], 'src/js/core/10-gear.js':['haillplass', 'snokrabbetest', 'autolinetest', 'turtest', 'geartest', 'booktest', 'bktest', 'caretest', 'jigalongtest', 'opptest'], 'src/js/core/10b-gearcare.js':['autolinetest', 'geartest', 'caretest', 'docktest', 'seaworktest'], 'tests/seaworktest.py':['seaworktest'], 'src/js/core/11-route.js':['autonavtest', 'routetest', 'obstest'], 'src/js/core/11b-obstacles.js':['obstest', 'routetest'], 'src/js/core/11c-leinett.js':['autonavtest', 'routetest', 'havtur', 'draftlooptest'], 'src/data/leinett.json':['autonavtest', 'routetest'], 'tools/leia/leinett.py':[], 'tools/leia/bake.py':[], 'src/js/core/01e-marks.js':['marktest', 'obstest', 'lighttest'], 'src/js/core/12-heat.js':['heatgeartest', 'heattest', 'heatpick'], 'src/js/core/13-work.js':['worktest', 'decktest', 'opsowntest', 'selfcrew', 'opptest'], 'src/js/core/14-crewlife.js':['worktest', 'fleet2test', 'saytest', 'crewlifetest', 'selfcrew', 'opptest'], 'tests/crewlifetest.py':['crewlifetest'], 'src/js/core/15-energy.js':['boostklokke', 'skipdrift', 'skiptest', 'autonavtest', 'worktest', 'trip2', 'sleeptest', 'rorbutest', 'sitetest', 'bunktest', 'havtur'], 'tests/bunktest.py':['bunktest'],
  'src/js/ui/01-i18n.js':[], 'src/js/ui/02-format-state.js':['tabtest', 'timetest', 'mig2test', 'pwatest', 'cashfxtest', 'errtest', 'roetest'], 'src/js/ui/03-map.js':['colregtest', 'driftsplan2map', 'routetest', 'charttest', 'vectest', 'npctest', 'placetest', 'sidetab', 'vindshot', 'etikett', 'legmemotest'], 'src/js/ui/03a-chart.js':['charttest'], 'src/js/ui/03b-route.js':['autonavtest', 'routetest', 'r4test', 'naustleia'],
  'src/js/ui/03c-heat.js':['heatgeartest', 'heattest', 'heatpick'], 'src/js/ui/03e-miniplot.js':['teleport3d', 'tut', 'colregtest'], 'src/js/ui/03f-search.js':['searchtest'], 'src/js/ui/10k-friends.js':['friendtest'], 'src/js/ui/10l-share.js':['sharetest'], 'src/js/ui/10m-guestbook.js':['gbtest'], 'src/js/ui/10n-hail.js':['hailtest'], 'src/js/ui/10o-ptow.js':['ptowtest'], 'tests/ptowtest.py':['ptowtest'], 'supabase/migrations/20261009260000_tows.sql':['sqltest'], 'tests/hailtest.py':['hailtest'], 'supabase/migrations/20261009240000_hails.sql':['sqltest'], 'tests/gbtest.py':['gbtest'], 'supabase/migrations/20261009220000_guestbook.sql':['sqltest'], 'tests/sharetest.py':['sharetest'], 'supabase/migrations/20261009200000_shared_marks.sql':['sqltest'], 'tests/friendtest.py':['friendtest'], 'tests/kotest.py':['kotest'], 'supabase/migrations/20261107120000_landing_q.sql':['sqltest'], 'supabase/migrations/20261009180000_friends.sql':['sqltest'], 'src/js/ui/03d-setmode.js':['docktest'], 'src/js/ui/04-panels-instruments.js':['heattest', 'hudtest', 'colregtest', 'legmemotest'],
  '.claude/settings.json':['hooktest'], '.claude/hooks/okt-start.sh':['hooktest'], '.claude/hooks/lesevakt.py':['hooktest'], '.claude/hooks/commitvakt.py':['hooktest'],
  'src/js/ui/05-tattoo-art.js':['tattest'], 'src/js/ui/05b-work.js':['worktest', 'sleeptest', 'havtur'], 'src/js/ui/06-logbook.js':['booktest'], 'src/js/ui/06b-book-tabs.js':['booktest'],
  'src/js/ui/07-guide.js':['tutfull', 'shoptest', 'selltest', 'r4test', 'cashfxtest', 'havtur'], 'src/js/ui/07b-first-trip.js':['tut'], 'src/js/ui/07c-handbook.js':['hbtest', 'itemcardtest'], 'src/js/ui/08b-letter.js':['tut'], 'src/data/letter-env-front.b64':['tut'], 'src/data/letter-env-pocket.b64':['tut'], 'src/data/letter-env-inside.b64':['tut'], 'src/data/letter-env-flap.b64':['tut'], 'src/data/letter-paper.b64':['tut'], 'src/data/font-caveat.b64':['tut'], 'src/data/font-rocksalt.b64':['tut'], 'src/js/ui/08-actions.js':['autolinetest', 'lotttest', 'boktest', 'slidertest', 'keeptest', 'cashfxtest', 'sidetab', 'turtest', 'fartstidtest', 'trip2', 'trackfollow', 'r4test', 'docktest', 'booktest', 'shoptest', 'boottest', 'kinotest', 'worldtest'],
  'src/js/ui/09-hand-fishing.js':['hailltest', 'fixtest', 'pubtest'], 'src/js/ui/09b-pub.js':['pubtest'], 'src/js/ui/09c-naust3d.js':['naust3dtest'], 'src/data/naustinne.b64':['naust3dtest'], 'src/js/ui/09c-pubsoc.js':['pubtest', 'lagtest'], 'supabase/migrations/20261030160000_lag_board.sql':[], 'supabase/migrations/20261030170000_bygde.sql':[], 'src/data/pub.b64':['pubtest'], 'src/js/ui/10-rod-acts.js':['docktest', 'tut'], 'src/js/ui/10-gear-ui.js':['autolinetest', 'geartest', 'docktest', 'peergear'],
  'src/js/core/06e-anchor.js':['anchortest', 'anchorswing', 'bunktest', 'tidetest'], 'src/data/strom.json':['tidetest', 'anchortest'], 'tools/strom/strom.py':[], 'tests/tidetest.py':['tidetest'], 'tests/anchortest.py':['anchortest'], 'tools/deck/anker.py':['anchor3d'], 'src/data/deck-anchor.b64':['anchor3d'],
  'tests/trytest.py':['trytest'], 'src/data/port-regions.json':['admintest'], 'tests/markettest.py':['markettest'], 'tests/autolinetest.py':['autolinetest'], 'tests/snokrabbetest.py':['snokrabbetest'], 'src/js/core/10d-snokrabbe.js':['krabbefabrikktest', 'haillplass', 'snokrabbetest', 'geartest'], 'tests/unit/autoline.test.mjs':['autolinetest'], 'tests/fabrikktest.py':['fabrikktest'], 'tests/unit/fabrikk.test.mjs':['fabrikktest'], 'tests/havplantest.py':['havplantest'], 'tests/unit/havplan.test.mjs':['havplantest'], 'tests/sponsortest.py':['sponsortest'], 'tests/sponsor2test.py':['sponsor2test'], 'tests/signtest.py':['signtest'], 'tests/signcoast.py':['signcoast'], 'supabase/migrations/20261102140000_sp_report.sql':['sqltest'], 'supabase/migrations/20261108231000_sp_view_iab.sql':['sqltest'], 'src/js/core/09l-sponsor.js':['sponsortest', 'sponsor2test'], 'src/js/ui/10r-sponsor.js':['sponsortest', 'signtest', 'sponsor2test'], 'src/admin/index.html':['admintest'], 'supabase/migrations/20261102130000_sponsors.sql':['sqltest'], 'src/js/core/09k-market.js':['markettest', 'megletest', 'fleet2test'], 'src/js/ui/10q-buymoment.js':['markettest', 'megletest'], 'src/js/ui/phone/13c-megler.js':['markettest', 'megletest', 'sponsor2test'], 'src/js/ui/10s-broker.js':['megletest'], 'tests/megletest.py':['megletest'], 'supabase/migrations/20261107140000_broker.sql':['sqltest'], 'supabase/migrations/20261107160000_funnel_tier.sql':['sqltest'], 'src/js/view3d/25-controls.js':['trytest'], 'src/js/ui/10c-dock.js':['trytest', 'docktest', 'geartest', 'rorbutest', 'bunktest', 'dockrow', 'roetest'], 'tests/dockrow.py':['dockrow'], 'tests/roetest.py':['roetest'], 'tests/hudtest.py':['hudtest'], 'tests/_env.py':['roetest', 'trip2'], 'tests/tut.py':['tut'], 'src/js/ui/10d-helm.js':['helmtest'], 'src/js/ui/10e-sound.js':['soundtest', 'cashfxtest'], 'src/js/core/16-helm.js':['helmtest', 'naustleia', 'trip2', 'rorbutest', 'worldtest', 'dyntest'], 'src/js/core/16b-dyn.js':['colregtest', 'dyntest', 'helmtest', 'trackfollow', 'trip2', 'autonavtest'], 'src/js/core/16c-hull.js':['hulltest', 'dyntest', 'towtest', 'trip2'], 'tests/hulltest.py':['hulltest'], 'tests/skytest.py':['skytest'], 'tests/skoddeshot.py':['skoddeshot'], 'tests/dyntest.py':['dyntest'], 'src/js/ui/11-boot.js':['savestest', 'trip2', 'boottest', 'worldtest', 'errtest', 'bootgtest'], 'src/data/haul-garn.b64':['haultest'], 'src/data/gear-marks.b64':['haultest', 'dbg23o'], 'src/data/gear-pot.b64':['potshot'], 'src/data/gear-jig.b64':['jigshot', 'vesseltest'], 'tools/gear/juksamaskin.py':['jigshot'], 'tests/jigshot.py':['jigshot'], 'tools/gear/teine.py':['potshot'], 'tools/boats/potplaces.py':['potshot'], 'tools/boats/potplaces.json':['potshot'], 'src/js/core/05c-air.js':['airtest', 'dbg23o'], 'src/data/air.b64':['airtest', 'dbg23o'], 'src/data/fish.b64':['vesseltest', 'dbg23o'], 'src/data/haul-line.b64':['haultest'], 'src/data/gear-autoline.b64':['h2dshot'], 'tools/gear/autoline.py':['h2dshot'], 'src/data/deck-pall.b64':['h2dshot'], 'tools/deck/pall.py':['h2dshot'], 'tools/boats/al45.py':['h2dshot', 'tral3d'], 'tests/h2dshot.py':['h2dshot'], 'src/js/vessel3d.js':['vessel3d', 'dbg23o', 'vesseltest', 'walktest', 'crewclip', 'lanterntest', 'maletest', 'regmarktest'], 'tests/lanterntest.py':['lanterntest'], 'tests/f1test.py':['f1test'], 'tests/profshot.py':['profshot'], 'tests/boktest.py':['boktest'], 'tests/lotttest.py':['lotttest'], 'tests/skattetest.py':['skattetest'], 'tests/anchorlight3d.py':['anchorlight3d'], 'src/data/boat-malo36.b64':['vessel3d', 'vesseltest'], 'src/data/boat-havsjark35.b64':['vessel3d', 'vesseltest'], 'src/data/boat-havsjark35-side.b64':['vesseltest'], 'src/data/boat-skiff59.b64':['vessel3d', 'vesseltest', 'camtest', 'moortest', 'brotest', 'lanterntest'], 'tools/boats/skiff59.py':['vessel3d', 'brotest', 'lanterntest'], 'src/data/boat-skiff59-side.b64':['vesseltest'], 'src/data/boat-snekke23.b64':['vessel3d', 'vesseltest', 'tut'], 'src/data/boat-snekke26.b64':['vessel3d', 'vesseltest', 'jigshot'], 'src/data/boat-plast31.b64':['vessel3d', 'vesseltest', 'walktest', 'brotest', 'lanterntest', 'regmarktest', 'maletest'], 'src/data/boat-plast31-side.b64':['vesseltest'], 'tools/boats/plast31.py':['vessel3d', 'brotest', 'lanterntest'], 'tests/p31shot.py':[], 'src/data/boat-hurtig11.b64':['vessel3d', 'vesseltest', 'jigshot'], 'src/data/boat-hurtig11-side.b64':['vesseltest'], 'tools/boats/hurtig11.py':['vessel3d'], 'src/data/boat-snekke26-side.b64':['vesseltest'], 'tools/boats/snekke26.py':['vessel3d'], 'tools/boats/snekke23.py':['vessel3d', 'brotest', 'lanterntest'], 'src/data/boat-snekke23-side.b64':['vesseltest'], 'src/data/boat-malo36-side.b64':['vesseltest'], 'src/data/worker.b64':['vessel3d', 'camtest', 'landtest', 'dbg23o', 'looktest', 'unittest', 'workshot', 'deckshot'], 'src/data/harbour-unit.b64':['unittest', 'landtest', 'bunkertest', 'moortest'], 'src/data/harbour-unit-y.b64':['yardtest'], 'src/data/harbour-unit-s.b64':['stedertest'], 'tools/harbour/steder.py':['yardtest'], 'tests/yardtest.py':['yardtest'], 'src/styles.css':['docktest', 'uishots', 'navbarshot', 'dockrow', 'roetest', 'hudtest'], 'tests/navbarshot.py':['navbarshot'], 'tests/tabtest.py':['tabtest'], 'src/js/core/06b-coastports.js':['starttest', 'trip2', 'seasontest', 'coast3d', 'havtur'], 'src/js/core/06c-steder.js':['stedertest', 'starttest', 'docktest'], 'src/data/steder.json':['stedertest', 'placetest', 'lybtest'], 'tools/steder/svalbard.py':['lybtest'], 'tests/lybtest.py':['lybtest'], 'tests/havtur.py':['havtur'], 'tests/havshot.py':['havshot'], 'src/js/ui/08c-start.js':['starttest', 'tut'], 'src/js/core/09b-records.js':['rectest', 'uketest', 'trip2'], 'src/js/ui/06c-notebook.js':['rectest'], 'src/js/core/09c-seasons.js':['seasontest', 'trip2', 'eventtest'], 'tests/eventtest.py':['eventtest'], 'supabase/migrations/20261030130000_season_ev.sql':[], 'src/js/core/09d-folk.js':['seasontest', 'trip2', 'plantsaytest'], 'src/js/ui/06d-season-folk.js':['uketest', 'seasontest', 'eventtest', 'lagtest'], 'tests/lagtest.py':['lagtest'], 'src/js/core/09j-kystvakt.js':['kystvakttest', 'trip2'], 'tests/kystvakttest.py':['kystvakttest'], 'tools/boats/kv.py':['kystvakttest'], 'src/data/boat-kv47.b64':['kystvakttest'], 'src/data/boat-kv90.b64':['kystvakttest'], 'tests/kvshot.py':[], 'tests/unit/kvskip.test.mjs':['kystvakttest'], 'supabase/migrations/20261030140000_lag_goal.sql':[], 'supabase/migrations/20261030150000_news_kv.sql':[], 'src/js/ui/06f-fishguide.js':['guidetest'], 'src/js/core/07c-naust.js':['sitetest'], 'src/data/harbour-naust.b64':['sitetest'], 'src/data/harbour-shop.b64':['sitetest'], 'src/data/mottak.json':['starttest'], 'src/data/fiske.json':['simday', 'calib', 'kvtest', 'bktest'], 'tools/npc/fiske.py':[], 'src/js/core/03f-fiske.js':['simday', 'calib', 'kvtest', 'bktest', 'heattest'], 'supabase/migrations/20261102120000_register.sql':['sqltest', 'cloudtest'], 'supabase/migrations/20261103180000_havkonsesjon.sql':['sqltest'], 'src/js/core/03h-is.js':['istest', 'routetest'], 'src/data/is.json':['istest'], 'tools/is/is.py':[], 'tests/istest.py':['istest'], 'tools/tide/eot.py':[], 'src/js/core/03g-trykk.js':['simday', 'calib', 'progweek', 'quotatest', 'kvtest', 'geartest', 'heattest'], 'src/data/felt.json':['charttest', 'marktest', 'simday', 'heattest'], 'src/data/felt-s.b64':['boottest'], 'tools/npc/felt.py':['charttest', 'marktest'], 'tests/unit/felt.test.mjs':[], 'tests/unit/havn.test.mjs':[], 'tests/havnmaal.py':[], 'src/js/core/03j-felt.js':['simday', 'calib', 'kvtest', 'geartest', 'bktest', 'heattest', 'jigalongtest', 'progweek'], 'tests/fiskeplay.py':[], 'src/js/ui/07b-first-trip.js':['tut', 'starttest', 'tutdrift', 'tutfull'], 'tests/tutfull.py':['tutfull'], 'src/index.html':['trip2', 'docktest'], 'tests/deckshot.py':['deckshot'], 'tests/brotest.py':['brotest'], 'tools/deck/fisk.py':['deckshot'], 'tools/deck/rigg.py':['deckshot'], 'tools/deck/kran.py':['deckshot'], 'tools/deck/sikker.py':['deckshot'], 'src/data/deck-fish.b64':['deckshot', 'jigshot', 'decktest'], 'src/data/deck-rig.b64':['deckshot', 'haultest'], 'src/data/deck-crane.b64':['deckshot'], 'src/data/deck-safety.b64':['deckshot'], 'supabase/migrations/20261102130000_gear_owner.sql':['sqltest', 'peergear'], 'tools/npc/senja.py':[], 'src/js/core/05d-hav.js':['havflaate', 'npctest', 'colregtest'], 'src/js/core/05e-sjovei.js':['colregtest', 'npctest', 'autonavtest', 'hudtest', 'havflaate'], 'tests/colregtest.py':['colregtest'], 'tests/unit/sjovei.test.mjs':['colregtest'], 'src/data/havflaate.json':['havflaate'], 'tools/npc/havflaate.py':[], 'tests/havflaate.py':['havflaate'], 'tests/etikett.py':['etikett'], 'src/data/flaate.json':['npctest', 'havntest'], 'tools/npc/flaate.py':[], 'src/js/core/06i-plan2-sno.js':['havplantest', 'driftsplan2test'], 'src/js/core/10e-krabbefabrikk.js':['krabbefabrikktest', 'snokrabbetest'], 'tests/krabbefabrikktest.py':['krabbefabrikktest'], 'tests/unit/krabbefabrikk.test.mjs':['krabbefabrikktest']}
# Ø11.3 (07.11.2026): the collisions are in core/05e-sjovei.js (hulltest 7); and the lanterns' and the anchor light's tests for the file
# Ø11.2 changed (backloggen «lanterntest og anchorlight3d står ikke i COVER»). On a line of their own: the line above is H3b's as well
COVER['src/js/core/05e-sjovei.js'] = COVER['src/js/core/05e-sjovei.js'] + ['hulltest', 'lanterntest', 'anchorlight3d']
# H3d1 (07.11.2026): the snow crab vessel rebuilt (krabbe50.py), her gear (snoteine.py), the snow crab and its clusters (fisk.py), the
# cartons of clusters and the live crab's tub (pall.py); h3dshot looks at them in the game (3D, alone)
for _f, _t in (('src/data/boat-krabbe50.b64', ['h3dshot', 'vessel3d', 'lanterntest', 'regmarktest', 'maletest', 'walktest']), ('tools/boats/krabbe50.py', ['h3dshot', 'brotest', 'lanterntest']),
               ('src/data/boat-krabbe50-side.b64', ['vesseltest']), ('tools/gear/snoteine.py', ['h3dshot']), ('src/data/gear-snoteine.b64', ['h3dshot', 'potshot']), ('tools/gear/vinde.py', ['jigshot']), ('src/data/gear-vinde.b64', ['jigshot', 'vesseltest']),
               ('tests/h3dshot.py', ['h3dshot']), ('tools/fish/fisk.py', ['h3dshot']), ('src/data/fish.b64', ['h3dshot']), ('src/data/deck-pall.b64', ['h3dshot']), ('tools/deck/pall.py', ['h3dshot']),
               ('src/js/view3d/10-gear.js', ['h3dshot', 'potshot']), ('src/js/view3d/09-landing-deck.js', ['h3dshot']), ('src/js/view3d/12-skiff.js', ['h3dshot'])):
    COVER[_f] = list(dict.fromkeys(COVER.get(_f, []) + _t))
# Ø11.6 (07.11.2026): man overboard. mobtest plays it without 3D (the fall in the game's minute, the mark, the Williamson turn, the ladder,
# the rescue, the near miss); mobshot draws the person in the water, the lifebuoy with its smoke and the rescue boat on its davit (3D,
# alone). On lines of their own, so a merge with the sessions that add to the lists above does not meet them
LITE += ['mobtest']
# steg 16 R (09.11.2026): round or gutted per boat, the switch and the landing note
LITE += ['rundshot']
COVER['tests/rundshot.py'] = ['rundshot']
for _f in ('src/js/ui/07-guide.js', 'src/js/ui/08-actions.js', 'src/js/ui/05d-plan2.js'): COVER.setdefault(_f, []).append('rundshot')
D3 += ['mobshot']
COVER['src/js/core/14b-sikkerhet.js'] = ['mobtest', 'seaworktest']
# Ø8b M (08.11.2026): the meals, the cook and where to rest, on screen in both formats
for _f in ('src/js/core/14-crewlife.js', 'src/js/core/15-energy.js', 'src/js/ui/05b-work.js', 'src/js/core/13-work.js'): COVER[_f] = COVER.get(_f, []) + ['mannskapshot']
COVER['tests/mannskapshot.py'] = ['mannskapshot']; COVER['tests/unit/mannskap.test.mjs'] = []   # (crewtest is run by hand: it is in no list)
COVER['src/js/ui/10s-mob.js'] = ['mobtest', 'mobshot']
COVER['tests/mobtest.py'] = ['mobtest']
COVER['tests/mobshot.py'] = ['mobshot']
# Out from the quay with Autonav (08.11.2026): Father's naust with a way out by water (core/07c-naust.js naustWay, ui/03b-route.js leiaTo)
# and the sealed harbours' legs over their own fill (core/07-harbours.js quayLandLeg, read by core/01-world.js legClearMemo). utfrakai
# needs the whole coast in the build. On lines of their own, as above
LITE += ['utfrakai']
VECB += ['utfrakai']
COVER['tests/utfrakai.py'] = ['utfrakai']
for _f in ('src/js/core/07c-naust.js', 'src/js/ui/03b-route.js', 'src/js/core/07-harbours.js', 'src/js/core/01-world.js'):
    COVER[_f] = COVER.get(_f, []) + ['utfrakai']
for _f, _t in (('src/js/view3d/21-rescue-anchor.js', 'mobshot'), ('src/js/deckcrew.js', 'mobshot'), ('src/js/core/04-crew.js', 'mobtest'), ('src/js/core/13-work.js', 'mobtest'), ('src/js/core/05-vessels.js', 'mobtest'), ('src/js/ui/03-map.js', 'mobtest'), ('src/js/ui/10e-sound.js', 'mobtest')):
    COVER[_f] = COVER.get(_f, []) + [_t]
# Kvotemarkedet, the core (KM1, 08.11.2026): pure functions tested in tests/unit/kvotemarked.test.mjs (run first by changed); in the game only
# the free right's two years at the new year (quotaNewYear) and the cap in Kvote → Marked, which quotatest sees. On lines of their own
COVER['src/js/core/03i-kvotemarked.js'] = ['quotatest']
COVER['tests/unit/kvotemarked.test.mjs'] = []

# Turens linje (Ø8b S2, 08.11.2026): the trip's sums in fish() and finishHaul (05-vessels.js, 10-gear.js), the line made by tripSum and
# tripWhy (04-crew.js), on the landing note (07-guide.js portSlip) and in the deck log at the sale (08-actions.js sell). The pure part is in
# tests/unit/turlinje.test.mjs; turlinjetest jigs minute by minute and lands (`--kyst` with the whole coast). On lines of their own
LITE += ['turlinjetest']
COVER['tests/turlinjetest.py'] = ['turlinjetest']
COVER['tests/unit/turlinje.test.mjs'] = []
for _f in ('src/js/core/04-crew.js', 'src/js/core/05-vessels.js', 'src/js/core/10-gear.js', 'src/js/ui/07-guide.js', 'src/js/ui/08-actions.js'):
    COVER[_f] = COVER.get(_f, []) + ['turlinjetest']


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


# A5 (docs/planer/verktoy-fra-game-studios.md, Ø2 05.11.2026): one line per test per run, so «flaky» becomes a number: date, branch,
# commit, test, OK/FEIL/LES, seconds, 3D or not, beside another test or alone, and the first red line. The file is in git with
# merge=union (.gitattributes): the containers are thrown away when a session ends, and a session's runs are where «red once, green
# alone» is seen, so it is committed with the work and the sessions' lines add up when branches are merged. «historikk» also reads the
# regressions' copies from before (docs/regresjon/<date>/historikk.tsv) and counts a line once. KYST_NOHIST=1 leaves it alone
HIST = os.path.join(HERE, 'historikk.tsv')


def history(r):
    if os.environ.get('KYST_NOHIST') == '1': return
    git = lambda *a: subprocess.run(['git'] + list(a), cwd=ROOT, capture_output=True, text=True).stdout.strip()
    first = (r['bad'] or r['why'] or [''])[0].replace('\t', ' ').replace('\n', ' ').strip()[:160]
    try:
        with open(HIST, 'a') as f:
            f.write('\t'.join([time.strftime('%Y-%m-%d %H:%M'), git('rev-parse', '--abbrev-ref', 'HEAD'),
                               git('rev-parse', '--short', 'HEAD') + ('+' if git('status', '--porcelain', '--', 'src', 'tests', 'build.mjs', ':!tests/historikk.tsv') else ''),   # (+: with changes not committed)
                               r['name'], r['status'], '%.0f' % r['dt'], 'lite' if r['lite'] else '3d', 'samtidig' if r.get('beside') else 'alene', first]) + '\n')
    except OSError: pass


def flaky():
    import glob
    lines, seen = [], set()
    for f in sorted(glob.glob(os.path.join(ROOT, 'docs', 'regresjon', '*', 'historikk.tsv'))) + [HIST, os.path.join(HERE, 'out', 'historikk.tsv')]:
        if not os.path.exists(f): continue
        for l in open(f):
            k = '\t'.join(l.rstrip('\n').split('\t')[:7])   # (the first seven columns: the older copies have no more)
            if l.strip() and k not in seen: seen.add(k); lines.append(l)
    rows = sorted(l.rstrip('\n').split('\t') for l in lines)
    by, mix, beside, last = {}, set(), {}, {}
    for r in rows:
        if len(r) < 5: continue
        by.setdefault(r[3], []).append(r[4]); mix.add((r[3], r[2], r[4]))
        if r[4] == 'FEIL':
            if len(r) > 7 and r[7] == 'samtidig': beside[r[3]] = beside.get(r[3], 0) + 1
            if len(r) > 8 and r[8]: last[r[3]] = r[8]
    # «ustabil» only where the same commit was both green and red: a red that turned green after a change is a fix, not a flake
    flak = {n for (n, c, st) in mix if st == 'FEIL' and (n, c, 'OK') in mix}
    print('%-16s %6s %5s  %s' % ('test', 'kjørt', 'røde', 'mønster (O grønn, F rød, L les; eldst først; «ustabil»: grønn og rød på samme commit)'))
    for n, st in sorted(by.items(), key=lambda kv: (-sum(s == 'FEIL' for s in kv[1]) / len(kv[1]), kv[0])):
        print('%-16s %6d %5d  %s%s%s%s' % (n, len(st), sum(s == 'FEIL' for s in st), ''.join({'OK': 'O', 'FEIL': 'F'}.get(s, 'L') for s in st[-40:]),
              '  ustabil' if n in flak else '', ('  (%d av de røde ved siden av en annen test)' % beside[n]) if n in beside else '', ('  siste: ' + last[n][:80]) if n in last else ''))
    if flak: print('\nUstabile: ' + ', '.join(sorted(flak)))


def report(r):
    history(r)
    mode = 'uten 3D' if r['lite'] else 'med 3D'
    print('%-4s %-12s %5.0f s  %s%s' % (r['status'], r['name'], r['dt'], mode, ('  · %d OK' % r['ok']) if r['ok'] else ''), flush=True)
    for l in r['bad']: print('       ' + l[:300])
    for w in r['why']: print('       ' + w)
    if r['status'] == 'LES':
        for l in r['tail']: print('       | ' + l[:200])


# what the unit tests read: the core, the boat models (tests/unit/vessel3d.test.mjs builds every model from src/data/ in Node, 01.11.2026),
# the fishing data (tests/unit/fiske.test.mjs, B1 01.11.2026), and the fishing grounds (tests/unit/felt.test.mjs, Ø14 F1 08.11.2026)
UNIT_SRC = ('src/js/core/', 'tests/unit/', 'src/js/vessel3d.js', 'src/data/boat-', 'src/data/fiske.json', 'tools/npc/fiske.py', 'src/data/rules.json', 'build.mjs', 'src/data/felt', 'tools/npc/felt.py')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    all3d = '--3d' in sys.argv
    if args[:1] == ['historikk']: flaky(); sys.exit(0)
    if args[:1] == ['utenfor']:   # the test scripts in none of the lists (D3, LITE, SOLO): never run (Ø2 05.11.2026)
        known = set(D3 + LITE + SOLO)
        print(' '.join(sorted(f[:-3] for f in os.listdir(HERE) if f.endswith('.py') and not f.startswith('_') and f != 'run.py' and f[:-3] not in known))); sys.exit(0)
    if not args or args[0] not in ('changed', 'smoke', 'full'):
        print(__doc__); sys.exit(2)
    if args[0] == 'changed':
        files, names = changed_tests()
        print('Endrede filer: ' + (', '.join(files) or 'ingen'))
        if not names and not any(f.startswith(UNIT_SRC) for f in files): print('Ingen tester dekker disse endringene. Ingenting å kjøre.'); sys.exit(0)
    else: names = [a.replace('.py', '') for a in args[1:]] if args[0] == 'smoke' else D3 + LITE
    names = list(dict.fromkeys(names))
    # the unit tests of the core (tests/unit/run.mjs, 29.10.2026): Node only, a few seconds, no build. They run first when the core or
    # the unit tests changed, in every full run, and in smoke when «unit» is named
    unit = args[0] == 'full' or (args[0] == 'changed' and any(f.startswith(UNIT_SRC) for f in files)) or 'unit' in names
    names = [n for n in names if n != 'unit']
    unit_bad = False
    if unit:
        t0 = time.time(); u = subprocess.run(['node', os.path.join(HERE, 'unit', 'run.mjs')], cwd=ROOT, capture_output=True, text=True)
        open(os.path.join(LOGS, 'unit.txt'), 'w').write(u.stdout + u.stderr)
        unit_bad = u.returncode != 0
        print('%-4s %-12s %5.0f s  Node      %s' % ('FEIL' if unit_bad else 'OK', 'unit', time.time() - t0, (u.stdout.strip().splitlines() or [''])[-1]), flush=True)
        for l in u.stdout.splitlines():
            if l.startswith('FEIL'): print('       ' + l[:300])
        if not names: sys.exit(1 if unit_bad else 0)
    missing = [n for n in names if not os.path.exists(os.path.join(HERE, n + '.py'))]
    if missing: print('Finner ikke: ' + ', '.join(missing)); sys.exit(2)
    solo = [n for n in names if n in SOLO]
    heavy = [n for n in names if (n in D3 or n in DRAWS3D or all3d) and n not in solo]
    light = [n for n in names if n not in heavy and n not in solo]
    print('Bygg først: node build.mjs. %d tester: %d uten 3D to om gangen, så %d med 3D alene etter hverandre, og %d som måler tid, alene til slutt. Logger: tests/out/logs/' % (len(names), len(light), len(heavy), len(solo)), flush=True)
    # dist-vec/ once for the tests that need the vec packs: each built it itself, and two building at once broke the build (25.10.2026)
    if any(n in VECB for n in names):
        env = dict(os.environ, KYST_VEC='1', KYST_DIST=os.path.join(ROOT, 'dist-vec'))
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=env, capture_output=True, text=True)
        print('dist-vec/ bygd én gang for %s: %s' % (', '.join(n for n in names if n in VECB), 'OK' if r.returncode == 0 else 'FEIL ' + r.stderr[-200:]))
        if r.returncode == 0: os.environ['KYST_VEC_BUILT'] = '1'
    t0 = time.time(); res = []
    with ThreadPoolExecutor(2) as ex:
        for r in ex.map(lambda n: run(n, True), light):
            r['beside'] = len(light) > 1; report(r); res.append(r)
    for n in heavy:
        r = run(n, n not in D3 and not all3d); report(r); res.append(r)
    for n in solo:
        r = run(n, not (all3d or n in D3)); report(r); res.append(r)
    bad = (['unit'] if unit_bad else []) + [r['name'] for r in res if r['status'] == 'FEIL']
    les = [r['name'] for r in res if r['status'] == 'LES']
    print('\n%d OK, %d FEIL, %d å lese, på %.0f s.%s%s' % (sum(r['status'] == 'OK' for r in res), len(bad), len(les), time.time() - t0,
          (' Feil i: ' + ', '.join(bad) + '.') if bad else '', (' Les: ' + ', '.join(les) + '.') if les else ''))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
