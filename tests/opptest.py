"""OPP1 of docs/planer/oppgraderinger.md (07.11.2026): the gutting knives and the gaff in three tiers, per boat, at the tackle shop.
An old save without the field is tier 1 and is not filled; the cards in Fiskeutstyr say «Om bord · trinn 1» with the next tier's numbers,
price and button; they are bought only at the shop's quay (at a plant without a shop and at sea the card says why, and the purchase is
refused), tier 2 before 3; a tier is paid and aboard at once and stays after a reload; the gaff's card shows the fish lost over the rail
this week; the knives and the gaff are not in Elektronikk og haler or the web shop. Pictures of the cards in both formats. Prints OK or
FEIL per check."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


CARD = """(k => { const c = document.querySelector('#drawerBody [data-ic=' + k + ']'); if (!c) return null;
  const nb = x => x.replace(/\u00a0|\u202f/g, ' '), q = s => nb((c.querySelector(s) || {}).textContent || '');
  return {name:q('h4'), fx:q('.ic-fx'), price:q('.ic-pr b'), have:[...c.querySelectorAll('.ic-have')].map(e => nb(e.textContent)).join(' | '), note:[...c.querySelectorAll('.ph-note')].map(e => nb(e.textContent)).join(' | '),
    btn:q('[data-pa=equip]'), dis:!!(c.querySelector('[data-pa=equip]') || {}).disabled, more:!!c.querySelector('.ic-more')}; })"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")
        card = lambda k: pg.evaluate("JSON.stringify(" + CARD + "('" + k + "'))")

        # an old save: no knife or gaff in the equipment; after a reload it is still not there, and both are tier 1
        await pg.evaluate("S.cash = 50000; S.boat.type = 'trebat'; applyVessel(); delete S.equip.kniv; delete S.equip.hott; if (S.stats) delete S.stats.lostRail; save()")
        await pg.reload(); await pg.wait_for_function("typeof S !== 'undefined' && S.boat && S.intro === true", timeout=60000); await pg.wait_for_timeout(800)
        r = json.loads(await J("{kn:S.equip.kniv, ho:S.equip.hott, lv:[equipLv('kniv'), equipLv('hott')], x:knifeX(), j:jigSlip(), type:S.boat.type, port:S.boat.port}"))
        check(r.get('kn') is None and r.get('ho') is None and r['lv'] == [1, 1] and r['x'] == 1 and r['j'] == 0.5, 'en gammel lagring uten feltet er trinn 1 på kniv og høtt, og feltet fylles ikke', r)

        # the cards in Fiskeutstyr at the shop's quay in Finnsnes: aboard at tier 1, the next tier's numbers, price and button
        await pg.evaluate("S.boat.status = 'port'; S.boat.berth = 'main'; DOCK.open('fiske')"); await pg.wait_for_timeout(400)
        kn = json.loads(await card('kniv')); ho = json.loads(await card('hott'))
        check(kn and 'Om bord · trinn 1' in kn['have'] and 'trinn 1 / 3' in kn['name'] and 'Kjøp trinn 2' in kn['btn'] and '1 500' in kn['btn'] and not kn['dis'], 'knivkortet: «Om bord · trinn 1», trinn 1 / 3 og «Kjøp trinn 2 · 1 500 kr»', kn)
        check(kn and 'Trinn 2' in kn['fx'] and '330 kg i timen' in kn['fx'] and '+10 %' in kn['fx'] and '30 % færre' in kn['fx'], 'knivkortet regner neste trinn i tall: 330 kg i timen per person (+10 %), 30 % færre feil', kn and kn['fx'])
        check(kn and 'per sløyeplass, 1 om bord' in kn['have'] and 'tid' in kn['note'], 'knivkortet sier prisen per sløyeplass og at det meste kniven gir, er tid', kn)
        check(ho and 'Om bord · trinn 1' in ho['have'] and 'Kjøp trinn 2' in ho['btn'] and '900' in ho['btn'] and '30 % færre fisk over ripa' in ho['fx'] and '40 % glipper' in ho['fx'] and '4 % raskere linetrekk' in ho['fx'], 'høttkortet: trinn 1 om bord, neste trinn i tall og «Kjøp trinn 2 · 900 kr»', ho)
        check(ho and 'Ingen fisk tapt over ripa denne uka' in ho['note'], 'høttkortet sier at ingen fisk er tapt over ripa denne uka', ho and ho['note'])
        check(kn and ho and kn['more'] and ho['more'], 'begge kortene har «Mer» til Håndboka')
        ks = json.loads(await J("[...document.querySelectorAll('#drawerBody .ph-card.ic')].map(c => c.dataset.ic)"))
        check(ks.index('kniv') < ks.index('net') and ks.index('hott') < ks.index('net'), 'kniv og høtt står før redskapen i Fiskeutstyr', ks)

        # tier 3 before tier 2 is refused by the one rule (buyGate), the button offers only the next tier
        r = json.loads(await J("{g3:buyGate('tier', 'kniv', 3), g2:buyGate('tier', 'kniv', 2)}"))
        check(r['g3'] and 'etter trinn 2' in r['g3'][0] and r['g2'] is None, 'trinn 3 uten trinn 2 nektes, trinn 2 går', r)

        # not at the plant in Botnhamn (no shop), and not at sea: the card says why, and the purchase is refused
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('botnhamn'); b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        kn = json.loads(await card('kniv'))
        r = json.loads(await J("{w:buyGear('tier', 'kniv'), kn:S.equip.kniv || 0, cash:S.cash}"))
        check(kn and not kn['btn'] and 'utstyrsbutikkens kai' in kn['note'] and r['w'] and r['kn'] == 0 and r['cash'] == 50000, 'ved mottaket uten butikk: ingen kjøpsknapp, kortet sier «ved utstyrsbutikkens kai», og kjøpet nektes', {'card': kn, 'buy': r})
        await pg.evaluate("DOCK.close(); S.boat.status = 'sailing'")
        r = json.loads(await J("{w:buyGear('tier', 'hott'), ho:S.equip.hott || 0}"))
        check(r['w'] and r['ho'] == 0, 'på sjøen nektes kjøpet', r)

        # back at the quay in Finnsnes: tier 2, then tier 3 of the knife, and the gaff to the top
        await pg.evaluate("const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#drawerBody [data-ic=kniv] [data-pa=equip]').click()"); await pg.wait_for_timeout(400)
        kn = json.loads(await card('kniv'))
        r = json.loads(await J("{kn:S.equip.kniv, cash:S.cash, x:knifeX(), log:S.log[S.log.length - 1].no}"))
        check(r['kn'] == 2 and r['cash'] == 48500 and abs(r['x'] - 1.1) < 1e-9 and 'trinn 2' in r['log'], 'ett trykk kjøper kniv trinn 2 for 1 500 kr, med en linje i loggen', r)
        check(kn and 'Om bord · trinn 2' in kn['have'] and 'Kjøp trinn 3' in kn['btn'] and '4 500' in kn['btn'] and 'Trinn 3' in kn['fx'] and '360 kg' in kn['fx'], 'kortet viser trinn 2 om bord og «Kjøp trinn 3 · 4 500 kr» med neste trinns tall', kn)
        await pg.evaluate("document.querySelector('#drawerBody [data-ic=kniv] [data-pa=equip]').click()"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('#drawerBody [data-ic=hott] [data-pa=equip]').click()"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('#drawerBody [data-ic=hott] [data-pa=equip]').click()"); await pg.wait_for_timeout(400)
        kn = json.loads(await card('kniv')); ho = json.loads(await card('hott'))
        r = json.loads(await J("{kn:S.equip.kniv, ho:S.equip.hott, cash:S.cash, j:jigSlip()}"))
        check(r['kn'] == 3 and r['ho'] == 3 and r['cash'] == 50000 - 1500 - 4500 - 900 - 2900 and abs(r['j'] - 0.3) < 1e-9, 'kniv og høtt kjøpt til trinn 3, betalt trinn for trinn', r)
        check(kn and ho and 'det beste' in kn['have'] and 'det beste' in ho['have'] and not kn['btn'] and not ho['btn'] and 'Øverste trinn' in kn['price'], 'på trinn 3 sier kortet «det beste», uten kjøpsknapp', {'kniv': kn, 'hott': ho})

        # the fish lost over the rail this week stand on the gaff's card (S.stats.lostRail, counted by crewSlip)
        await pg.evaluate("railLost(3.1); railLost(2.4); railLost(3.6); DOCK.close(); DOCK.open('fiske')"); await pg.wait_for_timeout(300)
        ho = json.loads(await card('hott'))
        check(ho and 'Tapt over ripa denne uka: 3 fisk, 9 kg' in ho['note'], 'høttkortet viser fisken tapt over ripa denne uka', ho and ho['note'])

        # the knives and the gaff are not among the electronics and haulers, nor in the web shop's equipment (they have no price there)
        await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
        r = json.loads(await J("{ks:[...document.querySelectorAll('#drawerBody .ph-card.ic')].map(c => c.dataset.ic), txt:document.getElementById('drawerBody').textContent}"))
        check('kniv' not in r['ks'] and 'hott' not in r['ks'] and 'NaN' not in r['txt'] and 'undefined' not in r['txt'], 'ikke under Elektronikk og haler, og ingen NaN eller undefined der', r['ks'])
        await pg.evaluate("DOCK.close()")

        # the tiers are the boat's, saved with her
        await pg.evaluate("save()"); await pg.reload(); await pg.wait_for_function("typeof S !== 'undefined' && S.boat && S.intro === true", timeout=60000); await pg.wait_for_timeout(800)
        r = json.loads(await J("{kn:S.equip.kniv, ho:S.equip.hott, lost:S.stats.lostRail && S.stats.lostRail.n}"))
        check(r['kn'] == 3 and r['ho'] == 3 and r['lost'] == 3, 'trinnene og tellingen står etter en omstart', r)

        # pictures of the cards in both formats: tier 1 knife and tier 2 gaff with the lost fish (back to the start for the picture), once
        # the loading veil after the reload is gone (it showed through behind the drawer)
        await pg.wait_for_function("(() => { const ld = document.getElementById('loader'); return !ld || ld.classList.contains('gone') || ld.hidden || getComputedStyle(ld).opacity === '0' || getComputedStyle(ld).display === 'none'; })()", timeout=60000)
        await pg.wait_for_timeout(1500)
        await pg.evaluate("S.equip.kniv = 1; S.equip.hott = 2; const b = S.boat; b.status = 'port'; b.port = 'finnsnes'; b.berth = 'main'; DOCK.open('fiske')"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('#drawerBody [data-ic=kniv]').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='opp1_kort_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(600)
        await pg.evaluate("DOCK.close(); DOCK.open('fiske')"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('#drawerBody [data-ic=kniv]').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(200)
        fit = json.loads(await J("""(() => { const d = document.getElementById('drawerBody'), r = d.getBoundingClientRect();
          const wide = [...d.querySelectorAll('[data-ic=kniv], [data-ic=kniv] *, [data-ic=hott], [data-ic=hott] *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1; }).length;
          const small = [...d.querySelectorAll('[data-ic=kniv] .ph-btn, [data-ic=hott] .ph-btn')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.height < 30; }).length;
          return {wide, small}; })()"""))
        check(not fit['wide'] and not fit['small'], 'stående: ingenting på kortene stikker ut av skuffen, knappene er store nok', fit)
        await pg.screenshot(path='opp1_kort_staaende.png')

        # ---- OPP4: the page «Båten og utstyret» first under Om bord › Båten, for the boat you follow: one line a ladder with dots (the
        # first is what she has without a purchase), the next step with price, place and numbers, what is full with every dot filled, what
        # does not suit her not there, where it is bought with «Nærmeste» and Autonav, and the fish over the rail and the minutes a tub today
        LAD = """(() => { const d = document.getElementById('drawerBody'), nb = x => (x || '').replace(/\\u00a0|\\u202f/g, ' '), card = d.querySelector('.bu-card'); if (!card) return null;
          const L = {}; for (const e of card.querySelectorAll('.bu-l')) L[e.dataset.lad] = {lv:+e.dataset.lv, max:+e.dataset.max, dots:nb(e.querySelector('.bu-d').textContent), txt:nb(e.textContent), buy:!!e.querySelector('[data-pa=open]')};
          const at = {}; for (const e of card.querySelectorAll('.bu-at')) at[e.dataset.at] = {txt:nb(e.textContent), go:(e.querySelector('[data-pa=goplace]') || {dataset:{}}).dataset.id || null};
          return {first:d.querySelector('.ph-c > .ph-card') === card || d.querySelector('.ph-card') === card, L, at, num:nb((card.querySelector('.bu-num') || {}).textContent), txt:nb(card.textContent)}; })()"""
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(400)
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('finnsnes'); b.type = 'trebat'; applyVessel(); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; S.equip.kniv = 2; S.equip.hott = 3; DOCK.open('beholdning:boat')"); await pg.wait_for_timeout(500)
        r = json.loads(await J(LAD))
        kn, ho = (r or {}).get('L', {}).get('kniv'), (r or {}).get('L', {}).get('hott')
        check(r and r['first'] and kn and kn['dots'] == '●●○' and kn['lv'] == 2 and 'Neste: Sløyekniver i ett stykke og stålhansker · 4 500 kr i butikken' in kn['txt'] and '330 → 360 kg i timen per person ved bordet' in kn['txt'],
              'siden står først under Om bord › Båten: kniven ●●○ med neste trinn, prisen for båten, «i butikken» og kg i timen ved bordet', kn)
        check(ho and ho['dots'] == '●●●' and 'Fullt' in ho['txt'] and not ho['buy'], 'høtten på trinn 3 står med alle prikkene fylt og «Fullt», uten knapp', ho)
        L0 = r['L'] if r else {}
        check(all(k in L0 for k in ('jukse', 'linehaler', 'teinehaler', 'motor', 'tank', 'ekko', 'antigro')) and 'garnhaler' not in L0 and 'hold' not in L0 and 'cabin' not in L0 and 'stab' not in L0 and L0['ekko']['max'] == 2,
              'trebåten har stigene som passer henne; ikke garnhaleren (fra 7,5 m), lasterommet (ett kar, fullt fra start), lugarer, stabilisering eller sonaren', sorted(L0))
        check(L0.get('motor') and '8 hk' in L0['motor']['txt'] and ' kn topp' in L0['motor']['txt'] and 'l/t i marsj' in L0['motor']['txt'] and 'på verftet' in L0['motor']['txt'] and L0['motor']['dots'] == '●○○'
              and L0.get('linehaler') and 'min per stamp →' in L0['linehaler']['txt'], 'motoren i knop og liter i timen på verftet, linehaleren i minutter per stamp', {k: L0.get(k, {}).get('txt') for k in ('motor', 'linehaler')})
        check(r and 'Du er her' in r['at'].get('butikk', {}).get('txt', '') and kn['buy'] and not r['at']['butikk']['go'], 'ved butikkens kai i Finnsnes: «Du er her» og «Til kjøpet» på linja, ingen Autonav', r and r['at'])
        check(r and 'Tapt over ripa denne uka3 fisk, 9 kg' in r['num'] and 'Trekk av en stamp line i dag' in r['num'] and 'min per stamp' in r['num'] and 'NaN' not in r['txt'] and 'undefined' not in r['txt'],
              'tapt over ripa denne uka og minuttene per stamp i dag står som tall', r and r['num'])
        await pg.screenshot(path='opp4_side_liggende.jpg', type='jpeg', quality=60)
        # away from the shop and the yard (the plant in Botnhamn): «Nærmeste» with the distance and Autonav to the nearest of each kind
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('botnhamn'); b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; DOCK.open('beholdning:boat')"); await pg.wait_for_timeout(400)
        r = json.loads(await J(LAD)); nr = json.loads(await J("{b:placesNear(S.boat.pos, 'butikk', 1)[0].pt.id, v:placesNear(S.boat.pos, 'verft', 1)[0].pt.id}"))
        check(r and 'Nærmeste' in r['at']['butikk']['txt'] and ' nm' in r['at']['butikk']['txt'] and r['at']['butikk']['go'] == nr['b'] and r['at']['verft']['go'] == nr['v'] and not r['L']['kniv']['buy'],
              'ved mottaket i Botnhamn: «Nærmeste» butikk og verft med avstanden og Autonav dit, og ingen kjøpsknapp på linjene', {'at': r and r['at'], 'near': nr})
        await pg.screenshot(path='opp4_naermeste_liggende.jpg', type='jpeg', quality=60)
        await pg.evaluate("S.draft = []; const e = document.querySelector('#drawerBody .bu-at[data-at=butikk] [data-pa=goplace]'); if (e) e.click()")
        try: await pg.wait_for_function("S.draft.length > 1 && S.draft[S.draft.length - 1].port === " + json.dumps(nr['b']), timeout=30000)
        except Exception: pass
        r = json.loads(await J("{drawer:document.body.classList.contains('dk-open'), n:S.draft.length, end:S.draft.length ? S.draft[S.draft.length - 1].port || null : null}"))
        check(r['end'] == nr['b'] and r['n'] > 1 and not r['drawer'], '«Autonav dit» lukker skuffen og legger ruta til den nærmeste butikken', r)
        await pg.evaluate("S.draft = []; if (typeof closePlotter === 'function') closePlotter()")
        # portrait: nothing sticks out of the drawer, and the buttons are big enough to tap
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(500)
        await pg.evaluate("if (typeof closePlotter === 'function') closePlotter(); const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; DOCK.close(); DOCK.open('beholdning:boat')"); await pg.wait_for_timeout(500)
        fit = json.loads(await J("""(() => { const d = document.getElementById('drawerBody'), r = d.getBoundingClientRect(), c = d.querySelector('.bu-card'); if (!c) return {wide:0, lines:0};
          return {wide:[...c.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1; }).length, lines:c.querySelectorAll('.bu-l').length}; })()"""))
        check(fit['lines'] >= 7 and not fit['wide'], 'stående: siden har linjene og ingenting stikker ut av skuffen', fit)
        await pg.screenshot(path='opp4_side_staaende.jpg', type='jpeg', quality=60)

        # the confirmation in the button from 10 000 kr (14-act.js, tierKr): the knives at tier 3 on the 14.99 m coastal vessel are 4 500 kr a
        # gutting place, three places, 13 500 kr; the first tap asks, the second buys, and the receipt says the tier
        await pg.evaluate("DOCK.close(); S.boat.type = 'kyst15'; applyVessel(); S.equip.kniv = 2; S.equip.hott = 2; S.cash = 50000; DOCK.open('fiske')"); await pg.wait_for_timeout(400)
        b0 = json.loads(await card('kniv'))
        await pg.evaluate("(e => e && e.click())(document.querySelector('#drawerBody [data-ic=kniv] [data-pa=equip]'))"); await pg.wait_for_timeout(300)
        b1 = json.loads(await card('kniv')); r1 = json.loads(await J("{kn:S.equip.kniv, cash:S.cash, x:!!document.querySelector('#drawerBody [data-ic=kniv] [data-pa=shop0]')}"))
        await pg.evaluate("(e => e && e.click())(document.querySelector('#drawerBody [data-ic=kniv] [data-pa=equip]'))"); await pg.wait_for_timeout(300)
        r2 = json.loads(await J("{kn:S.equip.kniv, cash:S.cash, toast:(document.getElementById('toast') || {}).textContent || ''}"))
        check(b0 and 'Kjøp trinn 3' in b0['btn'] and '13 500' in b0['btn'] and b1 and 'Bekreft' in b1['btn'] and '13 500' in b1['btn'] and r1['x'] and r1['kn'] == 2 and r1['cash'] == 50000,
              'kystbåten på 15 m: kniv trinn 3 for 13 500 kr spør «Bekreft · 13 500 kr» i knappen først, med ✕, og ingenting er kjøpt', {'før': b0 and b0['btn'], 'etter': b1 and b1['btn'], 'r': r1})
        check(r2['kn'] == 3 and r2['cash'] == 50000 - 13500 and 'Kjøpt: Sløyekniver, trinn 3' in r2['toast'].replace(' ', ' ') and 'trinn 3 / 3 om bord' in r2['toast'],
              'det andre trykket kjøper, og kvitteringen sier trinnet: «Kjøpt: Sløyekniver, trinn 3 …» og «trinn 3 / 3 om bord»', r2)
        await pg.evaluate("(e => e && e.click())(document.querySelector('#drawerBody [data-ic=hott] [data-pa=equip]'))"); await pg.wait_for_timeout(300)
        r3 = json.loads(await J("{ho:S.equip.hott, cash:S.cash}"))
        check(r3['ho'] == 3 and r3['cash'] == 50000 - 13500 - 2900, 'høtt trinn 3 for 2 900 kr går i ett trykk (under 10 000 kr)', r3)

        # the trade-in: the knives and the gaff are the boat's (prinsipp 5) and go with her; the new boat has tier 1, and the sheet says so
        await pg.evaluate("""DOCK.close(); S.cash = 5e6; S.order = null; DOCK.open('fartoy'); const dr = document.getElementById('drawerBody'), tap = s => { const e = dr.querySelector(s); if (e) e.click(); return !!e; };
          tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=open]'); tap('[data-pa=mksel][data-k=snekke]')"""); await pg.wait_for_timeout(300)
        note = json.loads(await J("(document.querySelector('#drawerBody [data-swaptier]') || {dataset:{}}).dataset.swaptier || null"))
        await pg.evaluate("(e => e && e.click())(document.querySelector('#drawerBody [data-pa=buy][data-ti=\"1\"]'))"); await pg.wait_for_timeout(500)
        r = json.loads(await J("{type:S.boat.type, kn:S.equip.kniv, ho:S.equip.hott, lv:[equipLv('kniv'), equipLv('hott')], log:S.log.slice(-4).map(x => x.no).join(' | ')}"))
        await pg.evaluate("if (typeof BUYM !== 'undefined' && BUYM.close) BUYM.close(); DOCK.close()")
        check(note == 'kniv,hott' and r['type'] == 'snekke' and r.get('kn') is None and r.get('ho') is None and r['lv'] == [1, 1] and 'Ble med' in r['log'] and 'trinn 3' in r['log'].split('Ble med')[-1],
              'innbyttet: bladet sier at trinnene følger den gamle båten, og den nye står på trinn 1 (loggen sier hva som ble med)', {'note': note, 'r': r})

        check(not errs, 'ingen sidefeil', errs[:3])
        print('sidefeil', errs[:5])
        await b.close()

asyncio.run(main())
