"""OPP1 of docs/planer/oppgraderinger.md (07.11.2026): the gutting knives and the gaff in three tiers, per boat, at the tackle shop.
An old save without the field is tier 1 and is not filled; the cards in Fiskeutstyr say «Om bord · trinn 1» with the next tier's numbers,
price and button; they are bought only at the shop's quay (at a plant without a shop and at sea the card says why, and the purchase is
refused), tier 2 before 3; a tier is paid and aboard at once and stays after a reload; the gaff's card shows the fish lost over the rail
this week; the knives and the gaff are not in Elektronikk og haler or the web shop. Pictures of the cards in both formats. Prints OK or
FEIL per check.

OPP2 (07.11.2026): the deck gear in tiers. On the plastsjark (room for four reels) with a line hauler and four reels at Finnsnes: the
cards in Fiskeutstyr for the reels, the jig sets and the line hauler (not the net hauler, which she has not bought); the hauler's tier
confirms in the button and costs half its price; the reels' tier is 12 000 kr a reel and tier 3 is refused where one person tends all
four; the line setter is offered under Elektronikk og haler once the hauler is aboard, the net chute says it needs a net hauler; what is
aboard says the tiers; the web shop still has the haulers. Pictures of the cards at tiers 1, 2 and 3 and of «aboard» in both formats."""
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
          const L = {}; for (const e of card.querySelectorAll('.bu-l')) L[e.dataset.lad] = {lv:+e.dataset.lv, max:+e.dataset.max, dots:nb(e.querySelector('.bu-d').textContent), gain:nb((e.querySelector('.bu-tx small') || {}).textContent),
            pr:nb((e.querySelector('.bu-pr') || {}).textContent), buy:!!e.querySelector('button.bu-pr[data-pa=open]'), pic:!!e.querySelector('.bu-ic svg'), txt:nb(e.textContent)};
          const at = {}; for (const e of card.querySelectorAll('.bu-at')) at[e.dataset.at] = {txt:nb(e.textContent), go:(e.querySelector('[data-pa=goplace]') || {dataset:{}}).dataset.id || null};
          const order = []; for (let e = card.querySelector('.bu-at[data-at=butikk]'); e && (e = e.nextElementSibling) && e.classList.contains('bu-l');) order.push(e.dataset.lad);
          return {first:d.querySelector('.ph-card') === card, L, at, order, num:nb((card.querySelector('.bu-num') || {}).textContent), sum:nb((card.querySelector('.bu-sum') || {}).textContent), q:!!card.querySelector('.bu-q[data-hbid=lex_oppgrad]'), txt:nb(card.textContent)}; })()"""
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(400)
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('finnsnes'); b.type = 'trebat'; applyVessel(); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; S.equip.kniv = 2; S.equip.hott = 3; DOCK.open('beholdning:boat')"); await pg.wait_for_timeout(500)
        r = json.loads(await J(LAD))
        kn, ho = (r or {}).get('L', {}).get('kniv'), (r or {}).get('L', {}).get('hott')
        check(r and r['first'] and kn and kn['dots'] == '●●○' and kn['lv'] == 2 and kn['gain'] == '330 → 360 kg/t ved bordet' and kn['pr'] == '4 500 kr' and kn['pic'],
              'siden står først under Om bord › Båten: kniven med bilde, ●●○, gevinsten i egne tall (330 → 360 kg/t ved bordet) og prisen 4 500 kr', kn)
        check(ho and ho['dots'] == '●●●' and ho['pr'] == '✓' and not ho['buy'] and 'Lang høtt' in ho['gain'], 'høtten på trinn 3 står med alle prikkene fylt og en hake, uten knapp', ho)
        L0 = r['L'] if r else {}
        # (OB1, Jonas 09.11.2026: no pots on the wooden boat, so no pot hauler either)
        check(all(k in L0 for k in ('jukse', 'linehaler', 'motor', 'tank', 'ekko', 'antigro')) and 'teinehaler' not in L0 and 'garnhaler' not in L0 and 'hold' not in L0 and 'cabin' not in L0 and 'stab' not in L0 and L0['ekko']['max'] == 2,
              'trebåten har stigene som passer henne; ikke teinehaleren (ingen teiner, OB1), garnhaleren (fra 7,5 m), lasterommet (ett kar, fullt fra start), lugarer, stabilisering eller sonaren', sorted(L0))
        check(L0.get('motor') and ' kn, +' in L0['motor']['gain'] and L0['motor']['gain'].endswith(' diesel') and '→' in L0['motor']['gain'] and L0['motor']['dots'] == '●○○' and L0.get('linehaler') and L0['linehaler']['gain'].endswith('min/stamp') and '→' in L0['linehaler']['gain'],
              'motoren i knop og hva den koster i diesel, linehaleren i minutter per stamp, nå og med neste trinn', {k: L0.get(k, {}).get('gain') for k in ('motor', 'linehaler')})
        od = (r or {}).get('order') or []
        check(od and od[-1] == 'hott' and 'kniv' in od and 'jukse' in od and od.index('kniv') < od.index('jukse') and r['sum'].endswith('trinn') and r['q'],
              'det som kan kjøpes, står først med det billigste øverst, og det fulle sist; summen av trinnene og «?» til Håndboka', {'order': r and r['order'], 'sum': r and r['sum']})
        check(r and 'Du er her' in r['at'].get('butikk', {}).get('txt', '') and kn['buy'] and not r['at']['butikk']['go'], 'ved butikkens kai i Finnsnes: «Du er her», og prisen er knappen til kjøpet; ingen Autonav', r and r['at'])
        check(r and '3 fisk' in r['num'] and 'tapt over ripa denne uka' in r['num'] and 'per stamp line i dag' in r['num'] and ' min' in r['num'] and 'NaN' not in r['txt'] and 'undefined' not in r['txt'],
              'tapt over ripa denne uka og minuttene per stamp i dag står som tall', r and r['num'])
        await pg.screenshot(path='opp4_side_liggende.jpg', type='jpeg', quality=60)
        # away from the shop and the yard (the plant in Botnhamn): «Nærmeste» with the distance and Autonav to the nearest of each kind
        await pg.evaluate("DOCK.close(); const b = S.boat, q = portById('botnhamn'); b.port = 'botnhamn'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; DOCK.open('beholdning:boat')"); await pg.wait_for_timeout(400)
        r = json.loads(await J(LAD)); nr = json.loads(await J("{b:placesNear(S.boat.pos, 'butikk', 1)[0].pt.id, v:placesNear(S.boat.pos, 'verft', 1)[0].pt.id}"))
        check(r and 'Nærmeste' in r['at']['butikk']['txt'] and ' nm' in r['at']['butikk']['txt'] and r['at']['butikk']['go'] == nr['b'] and r['at']['verft']['go'] == nr['v'] and not r['L']['kniv']['buy'] and r['L']['kniv']['pr'] == '4 500 kr',
              'ved mottaket i Botnhamn: «Nærmeste» butikk og verft med avstanden og Autonav dit; prisen står, men er ingen knapp', {'at': r and r['at'], 'near': nr})
        await pg.screenshot(path='opp4_naermeste_liggende.jpg', type='jpeg', quality=60)
        await pg.evaluate("S.draft = []; const e = document.querySelector('#drawerBody .bu-at[data-at=butikk] [data-pa=goplace]'); if (e) e.click()")
        try: await pg.wait_for_function("S.draft.length > 1 && S.draft[S.draft.length - 1].port === " + json.dumps(nr['b']), timeout=30000)
        except Exception: pass
        r = json.loads(await J("{drawer:document.body.classList.contains('dk-open'), n:S.draft.length, end:S.draft.length ? S.draft[S.draft.length - 1].port || null : null}"))
        check(r['end'] == nr['b'] and r['n'] > 1 and not r['drawer'], '«Autonav dit» lukker skuffen og legger ruta til den nærmeste butikken', r)
        await pg.evaluate("S.draft = []; if (typeof closePlotter === 'function') closePlotter()")
        # portrait: nothing sticks out of the drawer, and the price buttons are big enough to tap
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(500)
        await pg.evaluate("if (typeof closePlotter === 'function') closePlotter(); const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; DOCK.close(); DOCK.open('beholdning:boat')"); await pg.wait_for_timeout(500)
        fit = json.loads(await J("""(() => { const d = document.getElementById('drawerBody'), r = d.getBoundingClientRect(), c = d.querySelector('.bu-card'); if (!c) return {wide:0, lines:0, small:0};
          return {wide:[...c.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1; }).length, lines:c.querySelectorAll('.bu-l').length,
            small:[...c.querySelectorAll('button.bu-pr, .bu-q, .bu-at .ph-btn')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.height < 30 || q.width < 30); }).length}; })()"""))
        check(fit['lines'] >= 7 and not fit['wide'] and not fit['small'], 'stående: siden har linjene, ingenting stikker ut av skuffen, og knappene er store nok', fit)
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

        await opp2(pg, J, card)

        check(not errs, 'ingen sidefeil', errs[:3])
        print('sidefeil', errs[:5])
        await b.close()

async def opp2(pg, J, card):
    # the plastsjark at the shop's quay in Finnsnes, with a line hauler and four reels; the save is as the game makes it
    await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(400)
    await pg.evaluate("""DOCK.close(); const b = S.boat, q = portById('finnsnes'); b.type = 'plastsjark'; b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; b.gear = true;
      S.equip = {jukse:4, linehaler:true, plotter:true, vhf:true}; S.jobs = []; S.cash = 500000; applyVessel(); DOCK.open('fiske')"""); await pg.wait_for_timeout(400)
    jl = json.loads(await card('jukseLv')); lh = json.loads(await card('linehalerLv')); js = json.loads(await card('juksesett'))
    gh = json.loads(await card('garnhalerLv')); ls = json.loads(await card('linesetterLv'))
    check(jl and 'Om bord · trinn 1' in jl['have'] and 'Kjøp trinn 2' in jl['btn'] and '48 000' in jl['btn'] and '12 000 kr per maskin, 4 om bord' in jl['have'] and 'passer 4 maskiner (3 før)' in jl['fx'] and 'samme fangst per maskin' in jl['fx'],
      'juksamaskinene: trinn 1 om bord, «Kjøp trinn 2 · 48 000 kr» for fire maskiner, én person passer 4 (3 før), samme fangst per maskin', jl)
    check(lh and 'Linehaler' in lh['name'] and 'Om bord · trinn 1: linehaleren' in lh['have'] and 'Kjøp trinn 2' in lh['btn'] and '34 000' in lh['btn'] and '19,3 min mot 21,4 (−10 %)' in lh['fx'],
      'linehaleren: trinn 1 om bord, «Kjøp trinn 2 · 34 000 kr», en stamp hyseline på 19,3 min mot 21,4 (−10 %)', lh)
    check(js and 'Kjøp trinn 2' in js['btn'] and '175' in js['btn'] and 'slites 50 % saktere' in js['fx'], 'juksasettene: «Kjøp trinn 2 · 175 kr» (halve prisen for settet om bord), slites 50 % saktere', js)
    check(gh is None and ls is None, 'garnhaleren og linesetteren har ingen trinnkort før de er kjøpt', {'garnhaler': gh, 'linesetter': ls})
    check(all(c and c['more'] for c in (jl, lh, js)), 'trinnkortene har «Mer» til Håndboka')

    # the hauler's tier confirms in the button (from 10 000 kr), the second tap buys it, at once and without fitting
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=linehalerLv] [data-pa=equip]').click()"); await pg.wait_for_timeout(300)
    lh = json.loads(await card('linehalerLv')); r = json.loads(await J("{lh:S.equip.linehalerLv || 1, cash:S.cash}"))
    check(lh and 'Bekreft' in lh['btn'] and '34 000' in lh['btn'] and r['lh'] == 1 and r['cash'] == 500000, 'første trykk på linehalerens trinn ber om bekreftelse i knappen, ingenting er kjøpt', {'card': lh and lh['btn'], 'r': r})
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=linehalerLv] [data-pa=equip]').click()"); await pg.wait_for_timeout(300)
    lh = json.loads(await card('linehalerLv')); r = json.loads(await J("{lh:S.equip.linehalerLv, h:S.equip.linehaler, cash:S.cash, fit:(S.jobs || []).length, x:haulerX('line'), log:S.log[S.log.length - 1].no}"))
    check(r['lh'] == 2 and r['h'] is True and r['cash'] == 466000 and r['fit'] == 0 and abs(r['x'] - 0.1) < 1e-9 and 'trinn 2' in r['log'], 'andre trykk kjøper trinn 2 for 34 000 kr, med en gang og uten montering', r)
    check(lh and 'Om bord · trinn 2' in lh['have'] and 'Kjøp trinn 3' in lh['btn'] and '68 000' in lh['btn'] and '17,1 min mot 21,4 (−20 %)' in lh['fx'], 'kortet viser trinn 2 om bord og «Kjøp trinn 3 · 68 000 kr» med 17,1 min', lh)

    # the reels' tier confirms in the button too (48 000 kr for four: tierKr, 14-act.js), then tier 3 is refused on a boat with room for four
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=jukseLv] [data-pa=equip]').click()"); await pg.wait_for_timeout(300)
    jl = json.loads(await card('jukseLv')); check(jl and 'Bekreft' in jl['btn'] and '48 000' in jl['btn'], 'første trykk på juksamaskinenes trinn ber om bekreftelse (48 000 kr)', jl and jl['btn'])
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=jukseLv] [data-pa=equip]').click()"); await pg.wait_for_timeout(300)
    jl = json.loads(await card('jukseLv')); r = json.loads(await J("{lv:S.equip.jukseLv, n:S.equip.jukse, cash:S.cash, per:jigPer(), kr:equipKr('jukse')}"))
    check(r['lv'] == 2 and r['n'] == 4 and r['cash'] == 466000 - 48000 and r['per'] == 4 and r['kr'] == 46000, 'juksamaskinene på trinn 2 for 48 000 kr: én person passer 4, en ny maskin koster 46 000 kr', r)
    check(jl and not jl['btn'] and 'gir ingenting mer her' in jl['note'], 'trinn 3 nektes på plastsjarken (plass til fire): kortet sier hvorfor', jl and jl['note'])

    # Elektronikk og haler: the line setter once the line hauler is aboard, the net chute says it needs the net hauler, aboard with tiers
    await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
    ls = json.loads(await card('linesetter')); gr = json.loads(await card('garnrenne'))
    ab = await pg.evaluate("(document.querySelector('#drawerBody .ic-aboard') || {}).textContent || ''")
    check(ls and 'Kjøp og monter' in ls['btn'] and '24 000' in ls['price'] and 'krever linehaler' in ls['fx'] and '3,4 min mot 4,3 (−20 %)' in ls['fx'], 'linesetteren selges under Elektronikk og haler: 24 000 kr, setter en stamp på 3,4 min mot 4,3', ls)
    check(gr and not gr['btn'] and 'krever garnhaler' in gr['note'].lower() and '0,6 min mot 0,8' in gr['fx'], 'garnrenna uten garnhaler: ingen kjøpsknapp, kortet sier at den krever garnhaler', gr)
    check('Linehaler (trinn 2)' in ab and 'Juksamaskin × 4 (trinn 2)' in ab and 'Trinnene kjøpes under Fiskeutstyr' in ab, '«Om bord» sier trinnene og hvor de kjøpes', ab)
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=linesetter] [data-pa=equip]').click()"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=linesetter] [data-pa=equip]').click()"); await pg.wait_for_timeout(300)
    r = json.loads(await J("{job:(S.jobs || []).some(j => j.kind === 'fit' && j.k === 'linesetter'), cash:S.cash}"))
    check(r['job'] and r['cash'] == 466000 - 48000 - 24000, 'linesetteren kjøpes og monteres i butikken (24 000 kr)', r)
    await pg.evaluate("for (const j of (S.jobs || []).filter(j => j.kind === 'fit')) finishJob(j); S.jobs = []; DOCK.open('fiske')"); await pg.wait_for_timeout(300)
    ls = json.loads(await card('linesetterLv')); r = json.loads(await J("{ls:S.equip.linesetter, x:setterX('line')}"))
    check(r['ls'] is True and abs(r['x'] - 0.2) < 1e-9 and ls and 'Om bord · trinn 1' in ls['have'] and 'Kjøp trinn 2' in ls['btn'] and '22 000' in ls['btn'] and '2,8 min mot 4,3 (−35 %)' in ls['fx'], 'montert: linesetteren har trinnkort i Fiskeutstyr, «Kjøp trinn 2 · 22 000 kr», 2,8 min mot 4,3', {'r': r, 'card': ls})

    # the web shop's equipment still has the haulers (the tiers are bought at the counter)
    await pg.evaluate("DOCK.close(); PHONE.show(true); PHONE.open('home'); document.querySelector('#phone .ph-app[data-a=nett]').click(); document.querySelector('#phone .net-tile[data-s=shop]').click()"); await pg.wait_for_timeout(300)
    await pg.evaluate("const e = document.querySelector('#phone [data-pa=nettab][data-s=eq]'); if (e) e.click()"); await pg.wait_for_timeout(300)
    r = json.loads(await J("{ks:[...document.querySelectorAll('#phone .ph-card.ic')].map(c => c.dataset.ic), txt:document.getElementById('phone').textContent}"))
    check('garnhaler' in r['ks'] and 'teinehaler' in r['ks'] and not any(k in r['ks'] for k in ('jukseLv', 'juksesett', 'linehalerLv', 'garnhalerLv')) and 'NaN' not in r['txt'] and 'undefined' not in r['txt'], 'nettbutikken har halerne, ikke trinnene, og ingen NaN eller undefined', r['ks'])
    await pg.evaluate("PHONE.show(false)")

    # pictures: the havsjark (room for five reels) with the hauler cards at tiers 1, 2 and 3 and the reels at tier 2, then «aboard»
    await pg.evaluate("""const b = S.boat; b.type = 'sjark'; S.equip = {jukse:5, jukseLv:2, linehaler:true, garnhaler:true, garnhalerLv:2, teinehaler:true, teinehalerLv:3, linesetter:true, linesetterLv:2, garnrenne:true, plotter:true, vhf:true, kniv:2, hott:3, juksesett:2}; S.jobs = []; applyVessel(); DOCK.open('fiske')"""); await pg.wait_for_timeout(400)
    cs = {k: json.loads(await card(k)) for k in ('linehalerLv', 'garnhalerLv', 'teinehalerLv', 'jukseLv', 'linesetterLv', 'juksesett')}
    check(cs['linehalerLv'] and 'trinn 1 / 3' in cs['linehalerLv']['name'] and cs['garnhalerLv'] and 'trinn 2 / 3' in cs['garnhalerLv']['name'] and '3,2 min mot 4,0 (−20 %)' in cs['garnhalerLv']['fx'] and '95 000' in cs['garnhalerLv']['btn']
      and cs['teinehalerLv'] and 'det beste' in cs['teinehalerLv']['have'] and '0,96 min mot 1,2' in cs['teinehalerLv']['fx'] and cs['jukseLv'] and 'Kjøp trinn 3' in cs['jukseLv']['btn'] and '120 000' in cs['jukseLv']['btn']
      and cs['linesetterLv'] and 'det beste' in cs['linesetterLv']['have'] and cs['juksesett'] and 'det beste' in cs['juksesett']['have'], 'havsjarken: halerne på trinn 1, 2 og 3, juksamaskinene «Kjøp trinn 3 · 120 000 kr» for fem, linesetteren og juksasettene på øverste trinn', cs)
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=jukseLv]').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(200)
    await pg.screenshot(path='opp2_kort_liggende.png')
    await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
    await pg.evaluate("const e = document.querySelector('#drawerBody .ic-aboard'); if (e) e.scrollIntoView({block:'center'})"); await pg.wait_for_timeout(200)
    await pg.screenshot(path='opp2_ombord_liggende.png')
    await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(600)
    await pg.evaluate("DOCK.close(); DOCK.open('fiske')"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=jukseLv]').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(200)
    fit = json.loads(await J("""(() => { const d = document.getElementById('drawerBody'), r = d.getBoundingClientRect(), K = ['jukseLv', 'juksesett', 'linehalerLv', 'garnhalerLv', 'teinehalerLv', 'linesetterLv'].map(k => '[data-ic=' + k + ']');
      const wide = [...d.querySelectorAll(K.map(k => k + ', ' + k + ' *').join(', '))].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1; }).length;
      const small = [...d.querySelectorAll(K.map(k => k + ' .ph-btn').join(', '))].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.height < 30; }).length;
      return {wide, small}; })()"""))
    check(not fit['wide'] and not fit['small'], 'stående: ingenting på trinnkortene stikker ut av skuffen, knappene er store nok', fit)
    await pg.screenshot(path='opp2_kort_staaende.png')
    await pg.evaluate("document.querySelector('#drawerBody [data-ic=garnhalerLv]').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(200)
    await pg.screenshot(path='opp2_kort2_staaende.png')
    await pg.evaluate("DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
    await pg.evaluate("const e = document.querySelector('#drawerBody .ic-aboard'); if (e) e.scrollIntoView({block:'center'})"); await pg.wait_for_timeout(200)
    await pg.screenshot(path='opp2_ombord_staaende.png')
    await pg.evaluate("DOCK.close()")


asyncio.run(main())
