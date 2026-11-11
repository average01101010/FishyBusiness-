"""Kystmegleren: boat sales between players (core/09k-market.js, ui/10s-broker.js, ui/phone/13c-megler.js; the server is
supabase/migrations/20261107140000_broker.sql, checked on PostgreSQL by sqltest). No 3D; the cloud is stubbed with a small server in the
page that keeps the same rules (the limits, the 2 % steps, the ledger). Without the cloud the broker is empty and says the yard sells new
at full price. With it: «Legg ut til salgs» from Rederi (the limits, 1 t, 6 t, 1 døgn, 3 døgn), the boat locked at the nearest yard,
withdrawn, the other players' boats in the list with the right marked on the card, a bid that binds the money (with 2 % for delivery),
outbid and the money back, «Kjøp nå» and the boat in the fleet with the delivery, your own boat sold (the price less 5 %, the loans first)
and unsold back, «Selg nå» for 90 %, the wish, a guest, and a server without the broker. Pictures in both formats of the listing form, the
bids and the card (megle_*.png). Prints OK or FEIL per check."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''))


FIT = """(() => { const d = document.querySelector('%s'); if (!d) return ['none']; const r = d.getBoundingClientRect();
  return [...d.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1 && !e.closest('svg'); }).map(e => e.tagName + '.' + e.className).slice(0, 5); })()"""

# the server in the page: the rules of the migration, kept small (listings, bids, the ledger), and «the others» to bid and sell
FAKE = """(() => { const F = {me:'me', L:[], led:[], seq:1, lseq:40, calls:[], wish:null, down:false, gone:false};
  const iso = ms => new Date(ms).toISOString(), types = {skiff:95000, trebat:45000, snekke:245000, plastsjark:850000, sjark:1150000, hurtigsjark:4900000, sjarkny:10500000, breisjark:9000000, kyst15:18000000, kyst21:9000000};
  const pub = l => ({id:l.id, type:l.type, name:l.name, vessel:Object.fromEntries(Object.entries(l.vessel).filter(([k]) => k !== 'pgear')), value:l.value, lic_kr:l.lic_kr, start:l.start, buynow:l.buynow, top:l.top, bids:l.bids,
    port:l.port, x:l.x, y:l.y, at:l.at, until:l.until, seller:l.seller_name, mine:l.seller === F.me, top_me:l.top_player === F.me});
  const led = (player, kind, l, kr, data) => F.led.push({id:F.seq++, player, kind, listing:l.id, kr, data:Object.assign({name:l.name}, data || {})});
  const free = (l, why, by) => { if (l.top_player){ led(l.top_player, 'release', l, l.top + (l.fee || 0), {why, by}); } };
  const sold = (l, who, kr, to) => { l.state = 'sold'; l.price = kr; led(who, 'boat', l, 0, {vessel:l.vessel, from:l.port, port:to || l.port, price:kr, type:l.type}); led(l.seller, 'paid', l, Math.round(kr * 0.95), {vid:l.vid, price:kr, comm:kr - Math.round(kr * 0.95)}); };
  F.rpc = async (fn, a) => { F.calls.push([fn, JSON.parse(JSON.stringify(a || {}))]);
    if (F.gone) throw new Error(fn + ' 404'); if (F.down) throw new Error(fn + ' 500');
    if (F.guest && /^listing_(put|bid|buy)/.test(fn)) throw new Error('guest');
    if (fn === 'listings_get') return {now:iso(Date.now()), list:F.L.filter(l => l.state === 'open').map(pub), mine:F.L.filter(l => l.seller === F.me).map(l => ({id:l.id, vid:l.vid, name:l.name, state:l.state, start:l.start, buynow:l.buynow, top:l.top, bids:l.bids, until:l.until, port:l.port})),
      bids:F.L.filter(l => l.state === 'open' && l.top_player === F.me).map(l => ({listing:l.id, kr:l.top, fee:l.fee || 0, top:l.top, until:l.until, name:l.name, state:l.state})), sold:F.L.filter(l => l.state === 'sold').map(l => ({type:l.type, price:l.price, port:l.port}))};
    if (fn === 'listing_put'){ const t = a.vessel && types[a.vessel.type]; if (!t) throw new Error('bad type'); if (![1, 6, 24, 72].includes(a.hours)) throw new Error('bad hours');
      if (a.value - (a.lic_kr || 0) > t + 100000) throw new Error('bad value'); if (a.start_kr < Math.ceil(a.value * 0.4) || a.start_kr > Math.floor(a.value * 1.6)) throw new Error('start');
      if (a.buynow != null && (a.buynow <= a.start_kr || a.buynow > Math.floor(a.value * 1.6))) throw new Error('buynow');
      if (F.L.filter(l => l.seller === F.me && l.state === 'open').length >= 3) throw new Error('too many');
      const l = {id:++F.lseq, seller:F.me, seller_name:a.seller_name, vid:a.vid, type:a.vessel.type, name:a.vessel.name, vessel:a.vessel, value:a.value, lic_kr:a.lic_kr, start:a.start_kr, buynow:a.buynow, hours:a.hours,
        top:null, top_player:null, bids:0, port:a.port, x:a.x, y:a.y, at:iso(Date.now()), until:iso(Date.now() + a.hours * 3600e3), state:'open'}; F.L.push(l); return {id:l.id, until:l.until}; }
    if (fn === 'listing_bid'){ const l = F.L.find(x => x.id === a.lid); if (!l || l.state !== 'open') throw new Error('gone'); if (l.seller === F.me) throw new Error('own'); if (l.top_player === F.me) throw new Error('top');
      const mn = l.top == null ? l.start : Math.ceil(l.top * 1.02); if (a.kr < mn) throw new Error('low ' + mn); if (l.buynow && a.kr >= l.buynow) throw new Error('buynow');
      const fee = a.deliver && a.deliver !== l.port ? Math.round(a.kr * 0.02) : 0; free(l, 'outbid', a.kr);
      l.top = a.kr; l.fee = fee; l.deliver = fee ? a.deliver : null; l.top_player = F.me; l.bids++; led(F.me, 'bid', l, -(a.kr + fee), {bid:a.kr, fee}); return {ok:true, top_kr:a.kr}; }
    if (fn === 'listing_buy'){ const l = F.L.find(x => x.id === a.lid); if (!l || l.state !== 'open') throw new Error('gone'); if (!l.buynow) throw new Error('no buynow');
      const fee = a.deliver && a.deliver !== l.port ? Math.round(l.buynow * 0.02) : 0; free(l, 'bought'); led(F.me, 'buy', l, -(l.buynow + fee), {price:l.buynow, fee}); l.bids++; sold(l, F.me, l.buynow, fee ? a.deliver : null); return {ok:true, price:l.buynow, fee}; }
    if (fn === 'listing_cancel'){ const l = F.L.find(x => x.id === +a.lid); if (!l || l.seller !== F.me) throw new Error('not yours'); if (l.bids) throw new Error('bids'); l.state = 'cancelled'; led(F.me, 'back', l, 0, {vid:l.vid, why:'cancelled'}); return {ok:true}; }
    if (fn === 'broker_pending') return F.led.filter(r => r.player === F.me && !r.done).map(r => ({id:r.id, kind:r.kind, listing:r.listing, kr:r.kr, data:r.data}));
    if (fn === 'broker_done'){ for (const r of F.led) if (r.player === F.me && a.ids.includes(r.id)) r.done = true; return null; }
    if (fn === 'broker_wish_set'){ F.wish = a; return null; }
    return null; };
  // another player puts a boat out
  F.other = o => { const p = portById(o.port), l = {id:++F.lseq, seller:'other', seller_name:o.seller || 'Nordkyn Fiskeri', vid:'v9', type:o.type, name:o.name, vessel:Object.assign({type:o.type, name:o.name, built:2009, engH:4200, svcAt:4000, foul:0.1, equip:{vhf:true, plotter:true}, lic:null, at:mbPlace(p)}, o.vessel || {}),
    value:o.value, lic_kr:o.lic_kr || 0, start:o.start, buynow:o.buynow || null, top:null, top_player:null, bids:0, port:o.port, x:p.p.x, y:p.p.y, at:new Date().toISOString(), until:new Date(Date.now() + (o.hours || 24) * 3600e3).toISOString(), state:'open'}; F.L.push(l); return l.id; };
  // another player bids (over you, if you held it)
  F.otherBid = (lid, kr) => { const l = F.L.find(x => x.id === lid); free(l, 'outbid', kr); l.top = kr; l.fee = 0; l.top_player = 'other'; l.bids++; };
  // the time is out: sold to the highest bid, or back
  F.settle = lid => { const l = F.L.find(x => x.id === lid); if (l.top_player) sold(l, l.top_player, l.top, l.deliver); else { l.state = 'unsold'; led(l.seller, 'back', l, 0, {vid:l.vid, why:'unsold'}); } };
  return F; })()"""


SHOW = """(sel => { const t = document.getElementById('toast'); if (t) t.classList.remove('on'); const e = document.querySelector(sel); if (e) e.scrollIntoView({block:'start'}); return !!e; })"""


async def shot(pg, sel, path):
    await pg.evaluate(SHOW + "(%s)" % json.dumps(sel)); await pg.wait_for_timeout(150); await pg.screenshot(path=path)


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await boot(pg)
        await pg.evaluate("window.FAKE = " + FAKE)
        # the fleet: you aboard the first boat at Finnsnes, a second boat (a sjark) in port, money, three landing notes, blad B
        await pg.evaluate("""(() => { S.tut = 0; S.cash = 3e7; S.boat.status = 'port'; S.sales = S.sales.length >= 3 ? S.sales : [{}, {}, {}]; S.fm = Object.assign(S.fm || {}, {b:true});
          const v = newVesselObj('sjark', S.boat.port); vget(v, 'boat').status = 'port'; v.boatName = 'Havbris'; v.equip.vhf = true; window._v2 = v.id; save(); })()""")

        # 1. without the cloud: no boats, and the yard sells new ones at full price
        await pg.evaluate("PHONE.show(true); PHONE.open('nett')"); await pg.wait_for_timeout(250)
        tile = await pg.evaluate("(document.querySelector('#phone .net-tile[data-s=megler]') || {}).innerText || ''")
        await pg.evaluate("document.querySelector('#phone .net-tile[data-s=megler]').click()"); await pg.wait_for_timeout(250)
        e0 = await pg.evaluate("(() => { const t = document.querySelector('#phone .ph-c').innerText; return {t:t.slice(0, 400), empty:!!document.querySelector('#phone .mb-empty'), cards:document.querySelectorAll('#phone .mg-card').length, npc:typeof mktListings}; })()")
        check('Kystmegleren' in tile and e0['empty'] and 'Ingen båter til salgs nå.' in e0['t'] and 'Verftet selger nye til full pris.' in e0['t'] and e0['cards'] == 0 and e0['npc'] == 'undefined',
              'uten båter fra spillerne er Kystmegleren tom og sier at verftet selger nye til full pris (ingen NPC-oppføringer)', e0)
        await shot(pg, '#phone .mb-empty', 'megle_tom_liggende.png')
        f0 = await pg.evaluate("""(() => { document.querySelector('#phone [data-pa=mbput][data-id=' + _v2 + ']').click(); const b = document.querySelector('#phone [data-pa=mbputgo]');
          return {form:!!document.querySelector('#phone .mb-form'), dis:b && b.disabled, why:b && b.dataset.why}; })()""")
        check(f0['form'] and f0['dis'] and 'nett' in (f0['why'] or ''), 'skjemaet åpner også uten skyen, men «Legg ut» er grått og sier at megleren trenger nett', f0)

        # 2. the cloud on (stubbed): put her out from Rederi
        await pg.evaluate("(() => { window._real = cloudRpc; window.cloudRpc = FAKE.rpc; CLOUD.on = true; CLOUD.user = {id:'me', email:'me@x.no'}; CLOUD.guest = false; MBC._st.off = false; MBC._st.at = 0; PHONE.dact('nett', 'mbput0', {}); })()")
        await pg.evaluate("PHONE.open('rederi')"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#phone [data-pa=mbput][data-id=' + _v2 + ']').click()"); await pg.wait_for_timeout(300)
        fm = await pg.evaluate("""(() => { const f = document.querySelector('#phone .mb-form'), t = f ? f.innerText : '';
          return {app:PHONE.app, form:!!f, val:vesselValue(vesselById(_v2)), start:+document.getElementById('mbStart').value, buy:+document.getElementById('mbBuy').value, hrs:[...document.querySelectorAll('#phone .mb-hrs .chip-b')].map(b => b.innerText),
            on:(document.querySelector('#phone .mb-hrs .chip-b.on') || {}).innerText, quick:/Selg nå/.test(t), pct:/40 %/.test(t) && /160 %/.test(t), comm:/5 %/.test(t)}; })()""")
        check(fm['form'] and fm['app'] == 'nett' and fm['hrs'] == ['1 time', '6 timer', '1 døgn', '3 døgn'] and fm['on'] == '1 døgn' and fm['pct'] and fm['comm'] and fm['quick'] and fm['start'] >= fm['val'] * 0.4 and fm['buy'] <= fm['val'] * 1.6,
              '«Legg ut til salgs» fra Rederi: verdien, grensene 40 % og 160 %, startpris, «Kjøp nå», 1 t, 6 t, 1 døgn og 3 døgn, kommisjonen og «Selg nå»', fm)
        await shot(pg, '#phone .mb-form .vsec', 'megle_skjema_liggende.png')
        fitf = await pg.evaluate(FIT % '#phone')
        # a start price under 40 % is refused here, as on the server
        lo = await pg.evaluate("""(async () => { document.getElementById('mbStart').value = Math.floor(vesselValue(vesselById(_v2)) * 0.39); document.querySelector('#phone [data-pa=mbputgo]').click(); await new Promise(r => setTimeout(r, 150));
          return {msg:(document.querySelector('#phone .mb-form') || {}).innerText.includes('mellom 40 % og 160 %'), calls:FAKE.calls.filter(c => c[0] === 'listing_put').length}; })()""")
        check(lo['msg'] and lo['calls'] == 0, 'en startpris under 40 % avvises før noe sendes', lo)
        put = await pg.evaluate("""(async () => { const v = vesselById(_v2), val = vesselValue(v), port0 = vget(v, 'boat').port;
          document.querySelector('#phone [data-pa=mbhrs][data-h="6"]').click(); await new Promise(r => setTimeout(r, 50));
          document.getElementById('mbStart').value = Math.round(val); document.getElementById('mbBuy').value = Math.round(val * 1.5); document.querySelector('#phone [data-pa=mbputgo]').click(); await new Promise(r => setTimeout(r, 300));
          const c = FAKE.calls.find(x => x[0] === 'listing_put'), s = mbSale(v), b = vget(v, 'boat'), y = portById(b.port);
          const dep = withVessel(v, () => { S.plan = {wps:[{x:0, y:0}], idx:0}; return depart(); });
          return {call:c && {hours:c[1].hours, start:c[1].start_kr, buynow:c[1].buynow, value:c[1].value, type:c[1].vessel.type, name:c[1].vessel.name, port:c[1].port}, val, sale:s, yard:!!(y && portServices(y).verft), port:b.port, port0, dep, form:!!document.querySelector('#phone .mb-form')}; })()""")
        check(put['call'] and put['call']['hours'] == 6 and put['call']['start'] == round(put['val']) and put['call']['buynow'] == round(put['val'] * 1.5) and put['call']['type'] == 'sjark' and put['call']['name'] == 'Havbris'
              and put['sale'] and put['sale']['lid'] == 41 and put['yard'] and put['call']['port'] == put['port'] and put['dep'] is False and not put['form'],
              'lagt ut for 6 timer: serveren får båten, verdien og prisene, hun ligger ved nærmeste verft og kan ikke gå ut', put)
        await pg.evaluate("PHONE.open('rederi')"); await pg.wait_for_timeout(200)
        rd = await pg.evaluate("(() => { const t = document.querySelector('#phone .ph-c').innerText; return {sale:/Til salgs hos Kystmegleren/.test(t), left:/Slutter om/.test(t), cancel:!!document.querySelector('#phone [data-pa=mbcancel]'), board:(document.querySelector('#phone [data-pa=vboard][data-id=' + _v2 + ']') || {}).disabled}; })()")
        check(rd['sale'] and rd['left'] and rd['cancel'] and rd['board'], 'Rederi viser at hun ligger til salgs, hvor lenge, og «Trekk fra salg» så lenge ingen har budt; «Ta roret» er grått', rd)
        cn = await pg.evaluate("(async () => { document.querySelector('#phone [data-pa=mbcancel]').click(); await new Promise(r => setTimeout(r, 300)); return {sale:mbSale(vesselById(_v2)), state:FAKE.L[0].state}; })()")
        check(cn['sale'] is None and cn['state'] == 'cancelled', 'trukket fra salg er hun din igjen og låst opp', cn)

        # 3. the other players' boats: the list, the card with the right marked, the auction
        far = await pg.evaluate("""(() => { const Y = PORTS.filter(p => portServices(p).verft), here = mbYardNear(S.boat.pos), f = Y.filter(p => dist(p.p, S.boat.pos) / NM > 40).sort((a, b) => dist(a.p, S.boat.pos) - dist(b.p, S.boat.pos))[0];
          window._far = f.id; window._kL = FAKE.other({type:'kyst15', name:'Nordkyn', port:f.id, value:9000000 + 2000000, lic_kr:2000000, start:8000000, buynow:12000000, vessel:{lic:{id:'h14', hl:'14–14,9 m'}}, hours:72});
          window._sL = FAKE.other({type:'snekke', name:'Ternen', port:f.id, value:170000, start:120000, buynow:null, seller:'Sørøy Rederi', hours:1});
          MBC._st.at = 0; PHONE.open('nett'); return {far:f.name, near:here.name}; })()""")
        await pg.evaluate("(() => { const bk = document.querySelector('#phone .mkback[data-s=home]'); if (bk) bk.click(); document.querySelector('#phone .net-tile[data-s=megler]').click(); })()"); await pg.wait_for_timeout(400)
        await pg.evaluate("(() => { PHONE.render(); })()"); await pg.wait_for_timeout(100)
        ls = await pg.evaluate("""(() => { const C = [...document.querySelectorAll('#phone .mg-card')]; return {ids:C.map(c => +c.dataset.id), lic:C.map(c => !!c.querySelector('.mb-lic')), txt:C.map(c => c.textContent.replace(/\\s+/g, ' ')),
          tile:null, empty:!!document.querySelector('#phone .mb-empty')}; })()""")
        check(sorted(ls['ids']) == sorted([42, 43]) and not ls['empty'] and any('Hjemmel' in t and '14–14,9 m' in t for t in ls['txt']) and ls['lic'].count(True) == 1
              and any('Kjøp nå' in t and 'slutter om' in t for t in ls['txt']), 'lista viser de andres båter; kortet til kystbåten sier at hjemmelen følger båten, og «Kjøp nå» og tida som er igjen', ls)
        await shot(pg, '#phone .mg-card', 'megle_liste_liggende.png')
        fitl = await pg.evaluate(FIT % '#phone')
        # her page: the auction, the bid from the start price, delivery to the yard near you for 2 %
        await pg.evaluate("document.querySelector('#phone .mg-card[data-id=\"' + _kL + '\"]').click()"); await pg.wait_for_timeout(300)
        sh = await pg.evaluate("""(() => { const t = document.querySelector('#phone .mg-sheet').textContent, inp = document.getElementById('mbBid');
          return {auc:!!document.querySelector('#phone .mb-auc'), min:inp && +inp.min, val:inp && +inp.value, left:/Slutter om/.test(t), bn:/Kjøp nå/.test(t), lic:/Hjemmelslengde/.test(t) && /deltakerloven/.test(t), to:[...document.querySelectorAll('#phone .mb-to .chip-b')].map(b => b.innerText), tilstand:/Tilstand/.test(t), folger:/Følger med/.test(t)}; })()""")
        check(sh['auc'] and sh['min'] == 8000000 and sh['val'] == 8000000 and sh['left'] and sh['bn'] and sh['lic'] and len(sh['to']) == 2 and '+2 %' in sh['to'][1] and sh['tilstand'] and sh['folger'],
              'oppføringen: auksjonen med tida igjen, første bud fra startprisen, «Kjøp nå», hjemmelen merket med lovhenvisningen, Tilstand og Følger med, og valget hent selv eller lever for 2 %', sh)
        low = await pg.evaluate("(async () => { document.getElementById('mbBid').value = 7900000; document.querySelector('#phone [data-pa=mbbid]').click(); await new Promise(r => setTimeout(r, 200)); return {msg:document.querySelector('#phone .mb-auc').innerText, calls:FAKE.calls.filter(c => c[0] === 'listing_bid').length}; })()")
        check('minst' in low['msg'] and low['calls'] == 0, 'et bud under startprisen sier hva som trengs, og sendes ikke', low)
        bid = await pg.evaluate("""(async () => { const c0 = S.cash; document.querySelector('#phone [data-pa=mbto][data-s=near]').click(); await new Promise(r => setTimeout(r, 50));
          document.getElementById('mbBid').value = 8000000; document.querySelector('#phone [data-pa=mbbid]').click(); await new Promise(r => setTimeout(r, 400));
          const c = FAKE.calls.filter(x => x[0] === 'listing_bid').pop(); return {paid:c0 - S.cash, call:c && c[1], top:/høyeste budet/.test(document.querySelector('#phone .mb-auc').innerText), held:mktState().mb.held}; })()""")
        check(bid['call'] and bid['call']['kr'] == 8000000 and bid['call']['deliver'] and round(bid['paid']) == 8160000 and bid['top'],
              'budet binder pengene hos megleren: 8 000 000 og 2 % for levering trekkes, og siden sier at du har det høyeste budet', bid)
        await shot(pg, '#phone .mb-auc', 'megle_bud_liggende.png')
        fitb = await pg.evaluate(FIT % '#phone')
        # outbid by another: the money back at once, and a message
        ob = await pg.evaluate("(async () => { const c0 = S.cash; FAKE.otherBid(_kL, 8200000); await MBC.sync(); await MBC.load(true); const m = S.msgs[S.msgs.length - 1]; return {back:S.cash - c0, msg:m && m.no, next:+(document.getElementById('mbBid') || {}).min}; })()")
        check(round(ob['back']) == 8160000 and 'overbydd' in (ob['msg'] or '') and ob['next'] == 8364000, 'overbydd: pengene er tilbake med en gang, en melding sier det, og neste bud er 2 % over (8 364 000)', ob)
        # «Kjøp nå» with delivery: the boat in the fleet, sailed by the broker's skipper to the yard near you
        bn = await pg.evaluate("""(async () => { const c0 = S.cash, n0 = S.fleet.length; document.querySelector('#phone [data-pa=mbbuy]').click(); await new Promise(r => setTimeout(r, 500));
          const v = S.fleet[S.fleet.length - 1], D = (mktState().del || []).find(d => d.vid === v.id), m = S.msgs[S.msgs.length - 1];
          return {paid:c0 - S.cash, n:S.fleet.length - n0, name:v.boatName, type:vget(v, 'boat').type, port:vget(v, 'boat').port, lic:v.lic && v.lic.id, del:D && {from:D.from, to:D.to, kr:D.kr}, near:mbYardNear(vget(vesselById(S.me), 'boat').pos).id, msg:m && m.no, moment:!!document.getElementById('buyMoment') || null}; })()""")
        await pg.wait_for_timeout(300)
        bm = await pg.evaluate("!!document.getElementById('buyMoment')")
        check(round(bn['paid']) == 12240000 and bn['n'] == 1 and bn['name'] == 'Nordkyn' and bn['type'] == 'kyst15' and bn['lic'] == 'h14' and bn['del'] and bn['del']['to'] == bn['near'] and bn['del']['kr'] == 0 and 'Du kjøpte' in (bn['msg'] or '') and bm,
              '«Kjøp nå» med levering: 12 000 000 og 2 %, hun er i flåten med hjemmelen, en skipper seiler henne til verftet nær deg, og kjøpsøyeblikket vises', bn)
        await pg.evaluate("(() => { const e = document.querySelector('#buyMoment .bm-skip'); if (e) e.click(); })()")

        # 4. your own boat sold: the price less 5 %, the loans first, and she leaves the fleet
        sd = await pg.evaluate("""(async () => { const v = vesselById(_v2), val = vesselValue(v); const r = await MBC.put(v.id, Math.round(val), null, 1); const lid = mbSale(v).lid;
          FAKE.otherBid(lid, Math.round(val * 1.1)); FAKE.settle(lid); S.loan = {bal:200000, rate:0.069, pay:2000, next:S.t}; const c0 = S.cash; await MBC.sync();
          const m = S.msgs[S.msgs.length - 1]; return {ok:r.ok, gone:!vesselById(_v2), got:S.cash - c0, net:Math.round(Math.round(val * 1.1) * 0.95) - 200000, loan:S.loan, msg:m && m.no}; })()""")
        check(sd['ok'] and sd['gone'] and round(sd['got']) == sd['net'] and not sd['loan'] and '5 %' in (sd['msg'] or ''), 'solgt: hun er borte fra flåten, lånet innfris først, og du får prisen minus 5 %', sd)
        # unsold: back to you
        us = await pg.evaluate("""(async () => { const v = newVesselObj('snekke', S.boat.port); vget(v, 'boat').status = 'port'; v.boatName = 'Skarven'; const r = await MBC.put(v.id, Math.round(vesselValue(v)), null, 24);
          const lid = mbSale(v).lid; FAKE.settle(lid); await MBC.sync(); window._v3 = v.id; return {ok:r.ok, sale:mbSale(v), there:!!vesselById(v.id), msg:S.msgs[S.msgs.length - 1].no}; })()""")
        check(us['ok'] and us['sale'] is None and us['there'] and 'ikke solgt' in us['msg'], 'usolgt: hun er din igjen og kan seile', us)
        # «Selg nå» for 90 %, from Rederi (with the confirm)
        qs = await pg.evaluate("""(async () => { const v = vesselById(_v3), val = vesselValue(v), c0 = S.cash; PHONE.open('rederi'); await new Promise(r => setTimeout(r, 100));
          const b = document.querySelector('#phone [data-pa=vsell][data-id=' + v.id + ']'), label = b && b.textContent; b.click(); await new Promise(r => setTimeout(r, 300));
          return {label, got:S.cash - c0, want:Math.round(val * 0.9), gone:!vesselById(_v3)}; })()""")
        check(qs['label'] and 'Selg nå' in qs['label'] and round(qs['got']) == qs['want'] and qs['gone'], '«Selg nå» i Rederi: megleren kjøper henne med en gang for 90 % av verdien', qs)

        # 5. the wish: saved on the server, and a boat that suits it is told in Meldinger
        ws = await pg.evaluate("""(async () => { PHONE.open('nett'); const bk = document.querySelector('#phone .mkback[data-s=home]'); if (bk) bk.click(); document.querySelector('#phone .net-tile[data-s=megler]').click(); await new Promise(r => setTimeout(r, 100));
          const d = document.querySelector('#phone .mg-wish'); if (d && d.tagName === 'DETAILS') d.open = true; document.getElementById('mgWishC').value = 'open'; document.getElementById('mgWishMax').value = 500000; document.querySelector('#phone [data-pa=mgwish]').click();
          await new Promise(r => setTimeout(r, 100)); FAKE.other({type:'plastsjark', name:'Måsøy', port:_far, value:600000, start:300000}); await MBC.load(true); const m = S.msgs[S.msgs.length - 1];
          return {wish:FAKE.wish, msg:m && m.no, tile:null}; })()""")
        check(ws['wish'] == {'cls': 'open', 'max_kr': 500000} and 'passer ønsket' in (ws['msg'] or '') and 'Måsøy' in (ws['msg'] or ''), '«Ønsket båt» lagres på serveren (for push), og en båt som passer, varsles i Meldinger', ws)
        # a guest can look, not trade
        gs = await pg.evaluate("(async () => { CLOUD.guest = true; PHONE.dact('nett', 'mgsel', {id:String(_sL)}); await new Promise(r => setTimeout(r, 100)); const t = document.querySelector('#phone .mb-auc').innerText; CLOUD.guest = false; return {reg:/Registrer deg/.test(t), bid:!!document.querySelector('#phone [data-pa=mbbid]')}; })()")
        check(gs['reg'] and not gs['bid'], 'en gjest ser oppføringen, men må registrere seg for å by', gs)

        # 6. standing up: the pictures of the form, the list and the bids
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(300)
        await pg.evaluate("(async () => { await MBC.bid(_sL, 120000, null); PHONE.dact('nett', 'mgsel', {id:String(_sL)}); })()"); await pg.wait_for_timeout(300)
        await shot(pg, '#phone .mb-auc', 'megle_bud_staaende.png'); fit2 = await pg.evaluate(FIT % '#phone')
        await pg.evaluate("(() => { PHONE.dact('nett', 'mgsel', {}); })()"); await pg.wait_for_timeout(200)
        await shot(pg, '#phone .mg-card', 'megle_liste_staaende.png'); fit3 = await pg.evaluate(FIT % '#phone')
        await pg.evaluate("(() => { const v = newVesselObj('plastsjark', S.boat.port); vget(v, 'boat').status = 'port'; v.boatName = 'Sjøblomst'; PHONE.dact('nett', 'mbput', {id:v.id}); })()"); await pg.wait_for_timeout(200)
        await shot(pg, '#phone .mb-form .vsec', 'megle_skjema_staaende.png'); fit4 = await pg.evaluate(FIT % '#phone')
        check(not fitf and not fitl and not fitb and not fit2 and not fit3 and not fit4, 'ingenting stikker ut av telefonen, liggende og stående', [fitf, fitl, fitb, fit2, fit3, fit4])
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.evaluate("(() => { PHONE.dact('nett', 'mbput0', {}); PHONE.show(false); })()")

        # 7. at the yard where she lies: «Båter til salgs her»
        hr = await pg.evaluate("""(async () => { const q = portById(_far); S.boat.port = _far; S.boat.pos = {x:q.p.x, y:q.p.y}; S.boat.status = 'port'; S.boat.berth = 'main'; MBC._st.at = 0; await MBC.load(true); renderActs(); DOCK.open('fartoy'); await new Promise(r => setTimeout(r, 300));
          const c = document.querySelector('#drawerBody .mg-here'); return c ? {cards:[...c.querySelectorAll('.mg-card')].map(x => +x.dataset.id), sell:/Selg en båt/.test(c.textContent)} : null; })()""")
        check(hr and _in(hr['cards'], 43), 'verftet der hun ligger, viser henne under «Båter til salgs her»', hr)
        await shot(pg, '#drawerBody .mg-here', 'megle_verft_liggende.png')
        await pg.evaluate("DOCK.close()")

        # 7b. KM4: the boat with or without her right (V2 A). «Flytt hjemmelen til …» in Rederi, the free right, the choice in «Legg ut til
        # salgs», the card that says which it is, the right back when the server says no, and the same choice at the yard's trade-in
        await pg.evaluate("""(() => { const y = yearH(S.t / 60), L = {id:'h10', hl:HJ.h10.hl, kpk:260, since:y - 2, from:'Ola, Husøy', st:[{id:'h10', kf:0.4, from:y - 1, until:y + 19}]}; licExtra(L);
          const a = newVesselObj('sjark', S.boat.port, L); vget(a, 'boat').status = 'port'; a.boatName = 'Hjemla'; a.quota = {y, torsk:3200, hyse:0, sei:0};
          const b = newVesselObj('sjark', S.boat.port); vget(b, 'boat').status = 'port'; b.boatName = 'Tomla'; window._a = a.id; window._b = b.id; S.licFree = []; save(); PHONE.show(true); PHONE.open('rederi'); })()"""); await pg.wait_for_timeout(250)
        mv = await pg.evaluate("""(async () => { const q = s => document.querySelector('#phone ' + s), has = id => !!q('[data-pa=mbmv][data-id=' + id + ']'); const R = {a:has(_a), b:has(_b)};
          q('[data-pa=mbmv][data-id=' + _a + ']').click(); await new Promise(r => setTimeout(r, 150)); const sh = q('.mb-move');
          R.sheet = !!sh; R.txt = sh ? sh.innerText.replace(/\\s+/g, ' ').slice(0, 500) : ''; R.to = [...document.querySelectorAll('#phone [data-pa=mbmvgo]')].map(e => [e.dataset.to === _b ? 'b' : e.dataset.to === 'free' ? 'free' : vget(vesselById(e.dataset.to), 'boatName'), e.disabled, e.dataset.why || '']); return R; })()""")
        check(mv['a'] and not mv['b'] and mv['sheet'] and 'Strukturkvoter som følger den' in mv['txt'] and ['b', False, ''] in mv['to'] and ['free', False, ''] in mv['to'] and any(t[0] == 'Nordkyn' and t[1] and 'har alt en hjemmel' in t[2] for t in mv['to']),
              'Rederi «⋯»: «Flytt hjemmelen til …» på båten med hjemmel; arket viser hjemmelen, strukturkvoten, de andre båtene med grunnen når det ikke går, og ledig hjemmel', mv)
        await shot(pg, '#phone .mb-move', 'km4_flytt_liggende.png'); fk1 = await pg.evaluate(FIT % '#phone')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(250); await shot(pg, '#phone .mb-move', 'km4_flytt_staaende.png'); fk2 = await pg.evaluate(FIT % '#phone')
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(200)
        m2 = await pg.evaluate("""(async () => { const q = s => document.querySelector('#phone ' + s), w = () => new Promise(r => setTimeout(r, 150)), R = {};
          q('[data-pa=mbmvgo][data-to=' + _b + ']').click(); await w(); const lb = vget(vesselById(_b), 'lic');
          R.moved = !vget(vesselById(_a), 'lic') && lb && lb.id === 'h10' && lb.st.length === 1 && lb.since === yearH(S.t / 60) - 2 && vget(vesselById(_b), 'quota').torsk === 3200; R.msg = S.msgs[S.msgs.length - 1].no; R.sheet = !!q('.mb-move');
          q('[data-pa=mbmv][data-id=' + _b + ']').click(); await w(); q('[data-pa=mbmvgo][data-to=free]').click(); await w();
          R.free = S.licFree.length === 1 && !vget(vesselById(_b), 'lic') && S.licFree[0].st.length === 1 && S.licFree[0].used.torsk === 3200; R.card = (q('.fl-free') || {}).innerText || ''; R.msg2 = S.msgs[S.msgs.length - 1].no; return R; })()""")
        check(m2['moved'] and 'flyttet til' in m2['msg'] and not m2['sheet'] and m2['free'] and 'Ledige hjemler' in m2['card'] and 'to år' in m2['msg2'],
              'flyttet til en annen egen båt med strukturkvoten, kjøpsåret og årets fangst; så til ledig hjemmel, som står under flåten i Rederi', m2)
        await shot(pg, '#phone .fl-free', 'km4_ledig_liggende.png')
        m3 = await pg.evaluate("""(async () => { const q = s => document.querySelector('#phone ' + s), w = () => new Promise(r => setTimeout(r, 150)); q('.fl-free [data-pa=mbmv]').click(); await w(); const sh = !!q('.mb-move'), free = !!q('[data-pa=mbmvgo][data-to=free]');
          q('[data-pa=mbmvgo][data-to=' + _a + ']').click(); await w(); const la = vget(vesselById(_a), 'lic'); return {sh, free, back:!!la && la.id === 'h10' && la.since === yearH(S.t / 60) - 2 && S.licFree.length === 0 && vget(vesselById(_a), 'quota').torsk === 3200}; })()""")
        check(m3['sh'] and not m3['free'] and m3['back'], 'og fra ledig hjemmel tilbake til en båt, uten tap', m3)
        # «Legg ut til salgs»: the choice, the value with and without the right
        await pg.evaluate("document.querySelector('#phone [data-pa=mbput][data-id=' + _a + ']').click()"); await pg.wait_for_timeout(300)
        fo = await pg.evaluate("""(async () => { const q = s => document.querySelector('#phone ' + s), w = () => new Promise(r => setTimeout(r, 120)), v = vesselById(_a), R = {full:mbValue(v), lic:mbLicKr(v)};
          R.chips = [...document.querySelectorAll('#phone .mb-lich .chip-b')].map(e => [e.innerText.split('\\n')[0], e.classList.contains('on')]); R.start0 = +document.getElementById('mbStart').value;
          q('[data-pa=mblic][data-s=keep]').click(); await w(); R.keep = [...document.querySelectorAll('#phone .mb-keep .chip-b')].map(e => [e.innerText.replace(/\\s+/g, ' '), e.classList.contains('on'), e.disabled]);
          R.start1 = +document.getElementById('mbStart').value; R.txt = q('.mb-form').innerText.replace(/\\s+/g, ' '); return R; })()""")
        check(fo['chips'] == [['Hjemmelen følger med', True], ['Uten hjemmel', False]] and fo['lic'] > 0 and fo['start1'] < fo['start0'] and fo['start1'] <= fo['full'] - fo['lic'] + 25000 and any('Ledig hjemmel' in k[0] and k[1] for k in fo['keep'])
              and any('Tomla' in k[0] and not k[2] for k in fo['keep']) and any('Nordkyn' in k[0] and k[2] and 'har alt en hjemmel' in k[0] for k in fo['keep']) and 'Verdien hennes uten hjemmel' in fo['txt'] and 'selges uten hjemmel' in fo['txt'],
              '«Legg ut til salgs»: «Hjemmelen følger med» eller «Uten hjemmel»; uten er verdien skroget, og hjemmelen går til ledig hjemmel eller en egen båt som kan ta den', fo)
        await shot(pg, '#phone .mb-licsel', 'km4_valg_liggende.png'); fk3 = await pg.evaluate(FIT % '#phone')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(250); await shot(pg, '#phone .mb-licsel', 'km4_valg_staaende.png'); fk4 = await pg.evaluate(FIT % '#phone')
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(200)
        # the server says no: the right is back on her, and nothing is left as a free right
        dn = await pg.evaluate("""(async () => { const v = vesselById(_a), m0 = S.msgs.length; FAKE.down = true; const r = await MBC.put(v.id, Math.round(mbValue(v) - mbLicKr(v)), null, 24, {free:true}); FAKE.down = false;
          const l = vget(v, 'lic'); return {err:r.err, lic:!!l && l.id === 'h10' && l.st.length === 1, free:S.licFree.length, sale:mbSale(v), msgs:S.msgs.length - m0, q:vget(v, 'quota').torsk}; })()""")
        check(dn['err'] == 'srv' and dn['lic'] and dn['free'] == 0 and dn['sale'] is None and dn['msgs'] == 0 and dn['q'] == 3200, 'sier serveren nei, er hjemmelen tilbake på båten og ingenting er flyttet', dn)
        pk = await pg.evaluate("""(async () => { const v = vesselById(_a), q = s => document.querySelector('#phone ' + s), n0 = FAKE.calls.length; document.querySelector('#phone [data-pa=mbkeep][data-s=free]').click(); await new Promise(r => setTimeout(r, 100));
          document.getElementById('mbBuy').value = ''; q('[data-pa=mbputgo]').click(); await new Promise(r => setTimeout(r, 350));
          const c = FAKE.calls.slice(n0).find(x => x[0] === 'listing_put'), s = mbSale(v); PHONE.open('rederi'); await new Promise(r => setTimeout(r, 150));
          return {call:c && {lic:c[1].vessel.lic, quota:c[1].vessel.quota, lic_kr:c[1].lic_kr, value:c[1].value}, hull:vesselValue(v), kept:s && s.kept, free:S.licFree.length, noLic:!vget(v, 'lic'), row:/Til salgs hos Kystmegleren uten hjemmel/.test(q('.ph-c').innerText), lid:s && s.lid}; })()""")
        check(pk['call'] and pk['call']['lic'] is None and pk['call']['quota'] is None and pk['call']['lic_kr'] == 0 and pk['call']['value'] == pk['hull'] and pk['kept'] and pk['kept'].get('free') and pk['free'] == 1 and pk['noLic'] and pk['row'],
              'lagt ut uten hjemmel: hjemmelen er ledig hjemmel før serveren spørres, pakka har ingen hjemmel, verdien er skroget, og Rederi sier «uten hjemmel»', pk)
        # the card: every boat says which it is, also for the buyer
        cd = await pg.evaluate("""(async () => { window._nL = FAKE.other({type:'kyst15', name:'Havørn', port:_far, value:9000000, start:6000000, vessel:{lic:null}}); window._wL = FAKE.other({type:'kyst15', name:'Lomvi', port:_far, value:11000000, lic_kr:2000000, start:8000000, vessel:{lic:{id:'h14', hl:'14–14,9 m'}}});
          MBC._st.at = 0; await MBC.load(true); PHONE.open('nett'); const bk = document.querySelector('#phone .mkback[data-s=home]'); if (bk) bk.click(); document.querySelector('#phone .net-tile[data-s=megler]').click(); await new Promise(r => setTimeout(r, 300));
          const C = id => (document.querySelector('#phone .mg-card[data-id="' + id + '"]') || {}).innerText || ''; const R = {no:C(_nL), yes:C(_wL)};
          document.querySelector('#phone .mg-card[data-id="' + _nL + '"]').click(); await new Promise(r => setTimeout(r, 250)); R.sheet = document.querySelector('#phone .mg-sheet').innerText.replace(/\\s+/g, ' '); PHONE.dact('nett', 'mgsel', {}); return R; })()""")
        check('UTEN HJEMMEL' in cd['no'].upper() and 'HJEMMEL FØLGER MED' in cd['yes'].upper() and '14–14,9 m' in cd['yes'] and 'selges uten hjemmel' in cd['sheet'] and 'bifangst' in cd['sheet'],
              'kortet sier «Uten hjemmel» eller «Hjemmel følger med», også for kjøperen, og oppføringen sier hva det betyr', cd)
        await pg.wait_for_timeout(200); await pg.evaluate("(() => { const e = document.querySelector('#phone .mg-card[data-id=\"' + _nL + '\"]'); if (e) e.scrollIntoView({block:'start'}); })()")
        await shot(pg, '#phone .mg-card[data-id="%s"]' % await pg.evaluate("_nL"), 'km4_kort_liggende.png'); fk5 = await pg.evaluate(FIT % '#phone')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(250); await shot(pg, '#phone .mg-card[data-id="%s"]' % await pg.evaluate("_nL"), 'km4_kort_staaende.png'); fk6 = await pg.evaluate(FIT % '#phone')
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(200)
        # withdrawn: the toast says the right can be put back; and it is, from the free rights
        wd = await pg.evaluate("""(async () => { const v = vesselById(_a); await MBC.cancel(mbSale(v).lid); const src = {free:0}, r = mbMove(src, {v}); return {sale:mbSale(v), ok:r.ok, lic:!!vget(v, 'lic'), free:S.licFree.length}; })()""")
        check(wd['sale'] is None and wd['ok'] and wd['lic'] and wd['free'] == 0, 'trukket fra salg: hjemmelen settes tilbake på henne fra ledig hjemmel', wd)
        # the yard's trade-in: the same choice. Following the boat with the right at the yard, a plastic sjark with her traded in
        ti = await pg.evaluate("""(async () => { PHONE.show(false); const v = vesselById(_a), w = () => new Promise(r => setTimeout(r, 150)); storeVessel(curVessel()); bindVessel(v); S.boat.berth = 'main'; renderActs();
          const full = mbValue(v), lk = mbLicKr(v), R = {full, lk}; DOCK.open('fartoy:marked'); await w(); const dr = document.getElementById('drawerBody'), tap = s => { const e = dr.querySelector(s); if (e) e.click(); return !!e; };
          tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=open]'); await w(); tap('[data-pa=mksel][data-k=plastsjark]'); await w();
          R.row = (dr.querySelector('.ti-lic') || {}).innerText || ''; R.on0 = (dr.querySelector('.ti-lic .chip-b.on') || {}).innerText || ''; tap('[data-pa=mbti][data-s=keep]'); await w(); R.on1 = (dr.querySelector('.ti-lic .chip-b.on') || {}).innerText || '';
          const c0 = S.cash, d0 = debt(); R.buy = tap('[data-pa=buy][data-ti="1"]'); await w();
          R.type = S.boat.type; R.lic = S.lic; R.free = S.licFree.length; R.f = S.licFree[0] && {id:S.licFree[0].id, st:S.licFree[0].st.length, used:S.licFree[0].used.torsk}; R.paid = Math.round(c0 - S.cash); R.price = VESSELS.plastsjark.price; R.debt = debt() - d0; R.log = S.log.slice(-6).filter(l => /ledig hjemmel|Overtok/.test(l.no)).map(l => l.no.slice(0, 60)).join(' | ');
          const e = document.querySelector('#buyMoment .bm-skip'); if (e) e.click(); DOCK.close(); return R; })()""")
        ti['row'] = ti['row'][:60]; ti['on0'] = ti['on0'][:30]; ti['on1'] = ti['on1'][:30]
        check('Hjemmelen ved innbytte'.upper() in ti['row'].upper() and 'Følger innbyttebåten' in ti['on0'] and 'Behold som ledig hjemmel' in ti['on1'] and ti['buy'] and ti['type'] == 'plastsjark' and ti['lic'] is None and ti['free'] == 1 and ti['f'] == {'id': 'h10', 'st': 1, 'used': 3200}
              and abs(ti['paid'] - (ti['price'] - (ti['full'] - ti['lk']))) <= 2 and 'ledig hjemmel' in ti['log'],
              'innbytte på verftet: «Følger innbyttebåten» eller «Behold som ledig hjemmel»; beholdt er innbyttet skroget, og hjemmelen står ledig i rederiet med strukturkvoten og fangsten', ti)
        await pg.evaluate("""(async () => { S.lic = S.licFree.length ? null : S.lic; const f = S.licFree[0]; if (f) mbMove({free:0}, {v:curVessel()}); DOCK.open('fartoy:marked'); await new Promise(r => setTimeout(r, 150));
          const dr = document.getElementById('drawerBody'), tap = s => { const e = dr.querySelector(s); if (e) e.click(); }; tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=open]'); await new Promise(r => setTimeout(r, 100)); tap('[data-pa=mksel][data-k=snekke]'); })()"""); await pg.wait_for_timeout(250)
        await shot(pg, '#drawerBody .ti-lic', 'km4_innbytte_liggende.png'); fk7 = await pg.evaluate(FIT % '#drawerBody')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(300); await shot(pg, '#drawerBody .ti-lic', 'km4_innbytte_staaende.png'); fk8 = await pg.evaluate(FIT % '#drawerBody')
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(200)
        check(not any([fk1, fk2, fk3, fk4, fk5, fk6, fk7, fk8]), 'KM4: ingenting stikker ut, liggende og stående', [fk1, fk2, fk3, fk4, fk5, fk6, fk7, fk8])
        await pg.evaluate("(() => { DOCK.close(); const me = vesselById(S.me); if (me && me.id !== S.cur){ storeVessel(curVessel()); bindVessel(me); } })()")

        # 8. the server without the broker (404): as without the cloud, and no more asking
        gn = await pg.evaluate("(async () => { FAKE.gone = true; MBC._st.at = 0; await MBC.load(true); const off = !MBC.on(); FAKE.gone = false; return {off}; })()")
        check(gn['off'], 'en server uten megleren (404): Kystmegleren slår seg av for økta', gn)
        await pg.evaluate("(() => { window.cloudRpc = window._real; CLOUD.on = false; CLOUD.user = null; })()")
        print('sidefeil', errs)
        await br.close()


def _in(a, x):
    return x in (a or [])


asyncio.run(main())
