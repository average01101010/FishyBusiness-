"""Kvotemarkedet: rights and structure quotas players sell to each other, in Kvote → Marked (KM3 of docs/planer/kvotemarkedet.md;
core/03i-kvotemarked.js, core/09k-market.js mbKm, ui/10t-kvotemarked.js, ui/phone/04b-kvotemarked.js; the server is
supabase/migrations/20261108230000_kvotemarked.sql, checked on PostgreSQL by sqltest). No 3D; the cloud is stubbed with a small server in
the page that keeps the same rules (km_put's limits and keys, the 2 % steps, the ledger with lk, the quota rows only with km:true).
Without the cloud the market has the register and nothing from players. With it: «Legg ut» (the limits, the lock, withdrawn), the others'
rights and structure quotas on cards, the choice of boat, a bid that binds the money, outbid, «Kjøp nå» with the right put on a boat and
structured onto one, a structure quota at the settlement, the cap, blad B, a structure quota that waits for a boat, your own right sold
(the boat with the same id stays), the free right (kept, put on a boat, its two years), «Selg nå til registeret», the wish and a guest.
Pictures in 1280×800, 800×1280 and 390×844 (kvotemarked_*.png). Prints OK or FEIL per check."""
from _env import boot, OUT
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:700]) if extra != '' else ''))


# (the rows of tabs, .ph-sub, scroll sideways by design, so a tab past the edge is not sticking out)
FIT = """(() => { const d = document.querySelector('%s'); if (!d) return ['none']; const r = d.getBoundingClientRect();
  return [...d.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > r.right + 1 && !e.closest('svg') && !e.closest('.ph-sub'); }).map(e => e.tagName + '.' + e.className).slice(0, 5); })()"""

# the server in the page: the rules of the migration, kept small (the listings with kind and item, the bids, the ledger with lk)
FAKE = """(() => { const F = {me:'me', L:[], led:[], seq:1, lseq:60, calls:[], wish:null, guest:false};
  const iso = ms => new Date(ms).toISOString();
  const pub = l => ({id:l.id, type:null, name:l.name, vessel:{}, value:l.value, lic_kr:0, start:l.start, buynow:l.buynow, top:l.top, bids:l.bids, port:'', x:null, y:null, at:l.at, until:l.until, seller:l.seller_name,
    mine:l.seller === F.me, top_me:l.top_player === F.me, kind:l.kind, item:l.item});
  const led = (player, kind, l, kr, data) => F.led.push({id:F.seq++, player, kind, listing:l.id, kr, lk:l.kind, data:Object.assign({name:l.name}, data || {})});
  const free = (l, why, by) => { if (l.top_player) led(l.top_player, 'release', l, l.top, {why, by}); };
  const sold = (l, who, kr) => { l.state = 'sold'; l.price = kr; led(who, l.kind, l, 0, {item:l.item, price:kr}); led(l.seller, 'paid', l, Math.round(kr * 0.95), {vid:l.vid, price:kr, comm:kr - Math.round(kr * 0.95), item:l.item}); };
  const nm = it => (it.kind === 'right' ? 'Hjemmel ' : 'Strukturkvote ') + it.hl;
  F.rpc = async (fn, a) => { F.calls.push([fn, JSON.parse(JSON.stringify(a || {}))]);
    if (F.guest && /^(km_put|listing_bid|listing_buy)/.test(fn)) throw new Error('guest');
    if (fn === 'listings_get'){ const km = a.kind === 'km', ks = km ? ['right', 'struct'] : ['boat'];
      return {now:iso(Date.now()), list:F.L.filter(l => l.state === 'open' && ks.includes(l.kind)).map(pub),
        mine:F.L.filter(l => l.seller === F.me && ks.includes(l.kind)).map(l => ({id:l.id, vid:l.vid, name:l.name, state:l.state, start:l.start, buynow:l.buynow, top:l.top, bids:l.bids, until:l.until, port:'', kind:l.kind, item:l.item})),
        bids:F.L.filter(l => l.state === 'open' && l.top_player === F.me).map(l => ({listing:l.id, kr:l.top, fee:0, top:l.top, until:l.until, name:l.name, state:l.state, kind:l.kind})),
        sold:F.L.filter(l => l.state === 'sold' && ks.includes(l.kind)).map(l => ({kind:l.kind, id:l.item.id, price:l.price, value:l.value, at:iso(Date.now())}))}; }
    if (fn === 'km_put'){ const it = a.item; if (!a.vid || a.vid.length > 16) throw new Error('bad ref'); if (!it || !['right', 'struct'].includes(it.kind) || !HJ[it.id]) throw new Error('bad item');
      if (![1, 6, 24, 72].includes(a.hours)) throw new Error('bad hours'); if (!(a.value > 0)) throw new Error('bad value');
      if (a.start_kr < Math.ceil(a.value * 0.4) || a.start_kr > Math.floor(a.value * 1.6)) throw new Error('start');
      if (a.buynow != null && (a.buynow <= a.start_kr || a.buynow > Math.floor(a.value * 1.6))) throw new Error('buynow');
      if (F.L.filter(l => l.seller === F.me && l.state === 'open').length >= 3) throw new Error('too many');
      const base = a.vid.split('/')[0]; if (F.L.some(l => l.seller === F.me && l.state === 'open' && (l.vid === a.vid || l.vid === base || (it.kind === 'right' && l.vid.split('/')[0] === base)))) throw new Error('listed');
      const l = {id:++F.lseq, seller:F.me, seller_name:a.seller_name, vid:a.vid, kind:it.kind, item:it, name:nm(it), value:a.value, start:a.start_kr, buynow:a.buynow, hours:a.hours, top:null, top_player:null, bids:0,
        at:iso(Date.now()), until:iso(Date.now() + a.hours * 3600e3), state:'open'}; F.L.push(l); return {id:l.id, until:l.until, item:it}; }
    if (fn === 'listing_bid'){ const l = F.L.find(x => x.id === +a.lid); if (!l || l.state !== 'open') throw new Error('gone'); if (l.seller === F.me) throw new Error('own'); if (l.top_player === F.me) throw new Error('top');
      const mn = l.top == null ? l.start : Math.ceil(l.top * 1.02); if (a.kr < mn) throw new Error('low ' + mn); if (l.buynow && a.kr >= l.buynow) throw new Error('buynow');
      free(l, 'outbid', a.kr); l.top = a.kr; l.top_player = F.me; l.bids++; led(F.me, 'bid', l, -a.kr, {bid:a.kr, fee:0}); return {ok:true, top_kr:a.kr}; }
    if (fn === 'listing_buy'){ const l = F.L.find(x => x.id === +a.lid); if (!l || l.state !== 'open') throw new Error('gone'); if (!l.buynow) throw new Error('no buynow');
      free(l, 'bought'); led(F.me, 'buy', l, -l.buynow, {price:l.buynow, fee:0}); l.bids++; sold(l, F.me, l.buynow); return {ok:true, price:l.buynow, fee:0}; }
    if (fn === 'listing_cancel'){ const l = F.L.find(x => x.id === +a.lid); if (!l || l.seller !== F.me) throw new Error('not yours'); if (l.bids) throw new Error('bids'); l.state = 'cancelled'; led(F.me, 'back', l, 0, {vid:l.vid, why:'cancelled'}); return {ok:true}; }
    // (the quota rows only for a game that asks for them, as the migration)
    if (fn === 'broker_pending') return F.led.filter(r => r.player === F.me && !r.done && (a.km === true || r.lk === 'boat')).map(r => ({id:r.id, kind:r.kind, listing:r.listing, kr:r.kr, data:r.data, lk:r.lk}));
    if (fn === 'broker_done'){ for (const r of F.led) if (r.player === F.me && a.ids.includes(r.id)) r.done = true; return null; }
    if (fn === 'km_wish_set'){ F.wish = a; return null; }
    return null; };
  // another player puts a right or a structure quota out
  F.other = (it, o) => { o = o || {}; const value = kmTakst(it), l = {id:++F.lseq, seller:'other', seller_name:o.seller || 'Nordkyn Fiskeri', vid:'v9', kind:it.kind, item:it, name:nm(it), value, start:o.start || Math.round(value * 0.8), buynow:o.buynow === null ? null : o.buynow || Math.round(value * 1.2),
    top:null, top_player:null, bids:0, at:iso(Date.now()), until:iso(Date.now() + (o.hours || 24) * 3600e3), state:'open'}; F.L.push(l); return l.id; };
  F.otherBid = (lid, kr) => { const l = F.L.find(x => x.id === lid); free(l, 'outbid', kr); l.top = kr; l.top_player = 'other'; l.bids++; };
  F.settle = lid => { const l = F.L.find(x => x.id === lid); if (l.top_player) sold(l, l.top_player, l.top); else { l.state = 'unsold'; led(l.seller, 'back', l, 0, {vid:l.vid, why:'unsold'}); } };
  return F; })()"""

SHOW = """(sel => { const t = document.getElementById('toast'); if (t) t.classList.remove('on'); const e = document.querySelector(sel); if (e) e.scrollIntoView({block:'start'}); return !!e; })"""
# Kvote → Marked on a tab, drawn
TAB = """(tab => { PHONE.show(true); PHONE.open('kvote'); PHONE.dact('kvote', 'sub', {s:'mkt'}); PHONE.dact('kvote', 'kmsel', {}); PHONE.dact('kvote', 'kmput0', {}); PHONE.dact('kvote', 'kmtab', {s:tab}); PHONE.render(); })"""


async def shot(pg, sel, name):
    await pg.evaluate(SHOW + "(%s)" % json.dumps(sel)); await pg.wait_for_timeout(150); await pg.screenshot(path=os.path.join(OUT, name))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await boot(pg)
        await pg.evaluate("window.FAKE = " + FAKE)
        # the company: you aboard the first boat, «Havbris» (14.99 m) with a right 14–14,9 m, «Tomas» (14.99 m) without, blad B, money
        await pg.evaluate("""(() => { S.tut = 0; S.cash = 9e7; S.boat.status = 'port'; S.sales = S.sales.length >= 3 ? S.sales : [{}, {}, {}]; S.fm = Object.assign(S.fm || {}, {b:true}); const y = yearH(S.t / 60);
          const mk = (name, lic) => { const v = newVesselObj('kyst15', S.boat.port, lic); vget(v, 'boat').status = 'port'; v.boatName = name; return v.id; };
          const l = {id:'h14', hl:HJ.h14.hl, since:y - 2, landY:y}; licExtra(l); window._hav = mk('Havbris', l); window._tom = mk('Tomas', null); window._y = y; window._takst = kmTakst({kind:'right', id:'h14'}); save(); })()""")

        # 1. without the cloud: the common quota on top, the register as before, nothing from players, and the form says it needs the net
        await pg.evaluate(TAB + "('reg')"); await pg.wait_for_timeout(250)
        r1 = await pg.evaluate("""(() => { const t = document.querySelector('#phone').textContent, keep = S.lic; S.lic = vget(vesselById(_hav), 'lic'); PHONE.render(); const t2 = document.querySelector('#phone').textContent; S.lic = keep; PHONE.render();
          return {common:!!document.querySelector('#phone .kx-common'), grp:/Gruppekvote, torsk/.test(t) && /Tonn per faktor/.test(t), own:(t.match(/Spillerne eier ([\\d\\s ]+) av de ([\\d\\s ]+) hjemlene/) || []).slice(1),
            tabs:[...document.querySelectorAll('#phone .kx-tabs button')].map(b => b.textContent), reg:/Deltakeradganger i lukket gruppe/.test(t), hogg:/hogger/.test(t2), ut:/meldes ut av registeret/.test(t2), strukt:/Kjøp og strukturer hjemmel/.test(t2)}; })()""")
        check(r1['common'] and r1['grp'] and len(r1['own']) == 2 and r1['tabs'][:3] == ['Registeret', 'Hjemler', 'Strukturkvoter'] and r1['tabs'][3].startswith('Dine') and r1['tabs'][4] == 'Solgt' and r1['reg'] and not r1['hogg'] and r1['ut'] and r1['strukt'],
              'Kvote → Marked er Kvotemarkedet: den felles kvoten øverst, fanene, og Registeret som før («meldes ut av registeret», ikke «hogger»)', r1)
        await pg.evaluate(TAB + "('hjem')"); await pg.wait_for_timeout(150)
        e0 = await pg.evaluate("(() => { const t = document.querySelector('#phone').textContent; return {empty:!!document.querySelector('#phone .kx-empty'), nett:/trenger nett og innlogging/.test(t), reg:/Registeret selger til taksten/.test(t), cards:document.querySelectorAll('#phone .kx-card').length}; })()")
        check(e0['empty'] and e0['nett'] and e0['reg'] and e0['cards'] == 0, 'uten skyen: ingen hjemler fra spillere (ingen NPC-oppføringer), og siden sier at registeret selger til taksten', e0)
        await pg.evaluate(TAB + "('dine')"); await pg.wait_for_timeout(150)
        f0 = await pg.evaluate("""(() => { const own = document.querySelector('#phone .kx-own'), b = document.querySelector('#phone [data-pa=kmput][data-k=' + _hav + ']'); const t = own ? own.textContent : ''; if (b) b.click();
          const go = document.querySelector('#phone [data-pa=kmputgo]'); return {own:/«Havbris»/.test(t) && /Hjemmel 14–14,9 m/.test(t), tom:/«Tomas»/.test(t), form:!!document.querySelector('#phone .kx-form'), dis:go && go.disabled, why:go && go.dataset.why}; })()""")
        check(f0['own'] and not f0['tom'] and f0['form'] and f0['dis'] and 'nett' in (f0['why'] or ''), 'Dine viser hjemmelen på «Havbris» (ikke båten uten); skjemaet åpner uten skyen, men «Legg ut» er grått og sier at markedet trenger nett', f0)

        # 2. the cloud on (stubbed): «Legg ut»
        await pg.evaluate("(() => { window._real = cloudRpc; window.cloudRpc = FAKE.rpc; CLOUD.on = true; CLOUD.user = {id:'me', email:'me@x.no'}; CLOUD.guest = false; MBC._st.off = false; MBC._st.at = 0; KMC._st.at = 0; PHONE.render(); })()"); await pg.wait_for_timeout(250)
        fm = await pg.evaluate("""(() => { const f = document.querySelector('#phone .kx-form'), t = f ? f.textContent : '';
          return {form:!!f, start:+document.getElementById('kmStart').value, buy:+document.getElementById('kmBuy').value, hrs:[...document.querySelectorAll('#phone .mb-hrs .chip-b')].map(b => b.innerText), kf:/Kvotefaktor5,2289/.test(t), torsk:/Årets kvote, torsk[\\d,]+ t/.test(t),
            hyse:/Hyse \\(garantert\\)/.test(t) && /Sei \\(garantert\\)/.test(t), landet:/Landet på den i år/.test(t), takst:t.includes(kr(_takst)), pct:/40 %/.test(t) && /160 %/.test(t), comm:/5 %/.test(t), fdir:/Fiskeridirektoratet godkjenner ved oppgjøret/.test(t),
            kai:/ligger til kai til salget er over/.test(t), quick:(document.querySelector('#phone [data-pa=kmquick]') || {}).textContent, go:!document.querySelector('#phone [data-pa=kmputgo]').disabled}; })()""")
        check(fm['form'] and fm['hrs'] == ['1 time', '6 timer', '1 døgn', '3 døgn'] and fm['kf'] and fm['torsk'] and fm['hyse'] and fm['landet'] and fm['takst'] and fm['pct'] and fm['comm'] and fm['fdir'] and fm['kai'] and fm['go']
              and '90 %' in (fm['quick'] or '') and 'registeret' in (fm['quick'] or ''), '«Legg ut»: varen med kvotefaktor, årets kvote og taksten, grensene 40 % og 160 %, varigheten, 5 %, og «Selg nå til registeret · 90 %»', fm)
        await shot(pg, '#phone .kx-form', 'kvotemarked_leggut_liggende.png'); fit_form = await pg.evaluate(FIT % '#phone')
        lo = await pg.evaluate("""(async () => { document.getElementById('kmStart').value = Math.floor(_takst * 0.39); document.querySelector('#phone [data-pa=kmputgo]').click(); await new Promise(r => setTimeout(r, 200));
          return {msg:document.querySelector('#phone .kx-form').textContent.includes('mellom 40 % og 160 %'), calls:FAKE.calls.filter(c => c[0] === 'km_put').length}; })()""")
        check(lo['msg'] and lo['calls'] == 0, 'en startpris under 40 % av taksten avvises før noe sendes', lo)
        put = await pg.evaluate("""(async () => { const v = vesselById(_hav); document.querySelector('#phone [data-pa=mbhrs][data-h="6"]').click(); await new Promise(r => setTimeout(r, 80));
          document.getElementById('kmStart').value = Math.round(_takst); document.getElementById('kmBuy').value = Math.round(_takst * 1.5); document.querySelector('#phone [data-pa=kmputgo]').click(); await new Promise(r => setTimeout(r, 400));
          const c = FAKE.calls.find(x => x[0] === 'km_put'), s = mbSale(v), dep = withVessel(v, () => { S.plan = {wps:[{x:0, y:0}], idx:0}; return depart(); }), t = document.querySelector('#phone').textContent;
          PHONE.open('rederi'); PHONE.render(); const rd = document.querySelector('#phone').textContent;
          return {call:c && {vid:c[1].vid, kind:c[1].item.kind, id:c[1].item.id, flen:c[1].item.flen, y:c[1].item.y, value:c[1].value, start:c[1].start_kr, buynow:c[1].buynow, hours:c[1].hours}, takst:_takst, km:s && s.km, lid:s && s.lid, dep, why:kmPutWhy({v, kind:'right'}), megler:mbWhy(v),
            dine:/Ute i Kvotemarkedet/.test(t) && !!t.match(/Slutter om/), form:/kx-form/.test(document.querySelector('#phone').innerHTML), rederi:/Hjemmelen hennes ligger ute i Kvotemarkedet/.test(rd) && !/Kystmegleren: /.test(rd), lic:!!vget(v, 'lic')}; })()""")
        c = put['call'] or {}
        check(c.get('vid') == await pg.evaluate("_hav") and c.get('kind') == 'right' and c.get('id') == 'h14' and c.get('value') == put['takst'] and c.get('start') == round(put['takst']) and c.get('buynow') == round(put['takst'] * 1.5) and c.get('hours') == 6
              and put['km'] == 'right' and put['lid'] == 61 and put['dep'] is False and put['why'] == 'listed' and put['megler'] == 'listed' and put['dine'] and put['rederi'] and put['lic'],
              'lagt ut for 6 timer: serveren får nøkkelen (båtens id), varen fra kmPack, taksten og prisene; hjemmelen er låst, båten går ikke ut, og Rederi sier hvorfor', put)
        await pg.evaluate(TAB + "('dine')"); await pg.wait_for_timeout(200)
        await shot(pg, '#phone .kx-own', 'kvotemarked_dine_liggende.png')
        cn = await pg.evaluate("""(async () => { document.querySelector('#phone [data-pa=kmcancel]').click(); await new Promise(r => setTimeout(r, 400)); const v = vesselById(_hav);
          return {sale:mbSale(v), out:Object.keys(kmState().out).length, state:FAKE.L[0].state, lic:!!vget(v, 'lic'), pend:FAKE.calls.filter(c => c[0] === 'broker_pending').map(c => c[1].km)}; })()""")
        check(cn['sale'] is None and cn['out'] == 0 and cn['state'] == 'cancelled' and cn['lic'] and cn['pend'] and all(k is True for k in cn['pend']),
              'trukket fra salg: låsen er av og hjemmelen din igjen; innboksen hentes med km:true hver gang', cn)

        # 3. the other players' goods: the cards, the sheet, the choice of boat, the bid
        await pg.evaluate("""(() => { const y = _y, r = used => ({kind:'right', id:'h14', hl:HJ.h14.hl, flen:14.99, st:[], landY:y, used:{torsk:used, hyse:1500, sei:0}, y});
          window._r1 = FAKE.other(r(20000)); window._r2 = FAKE.other(r(0), {hours:72}); window._s1 = FAKE.other({kind:'struct', id:'h14', hl:HJ.h14.hl, kf:4.7, from:y - 8, until:y + 12, used:{torsk:0, hyse:0, sei:0}, y}, {buynow:null});
          window._s2 = FAKE.other({kind:'struct', id:'h14', hl:HJ.h14.hl, kf:4.5, from:y - 3, until:y + 17, used:{torsk:0, hyse:0, sei:0}, y}); KMC._st.at = 0; })()""")
        await pg.evaluate(TAB + "('hjem')"); await pg.wait_for_timeout(400)
        ls = await pg.evaluate("""(() => { const C = [...document.querySelectorAll('#phone .kx-card')]; return {ids:C.map(c => +c.dataset.id), txt:C.map(c => c.textContent.replace(/\\s+/g, ' '))}; })()""")
        check(sorted(ls['ids']) == sorted([await pg.evaluate("_r1"), await pg.evaluate("_r2")]) and all('Kvotefaktor 5,2289' in t and 'torsk i år' in t and 'Landet i år' in t and 'takst' in t and 'Kjøp nå' in t and 'Slutter om' in t for t in ls['txt']) and any('20,0 t' in t for t in ls['txt']),
              'Hjemler: kortene viser hjemmelslengde, kvotefaktor, årets torsk, landet i år, taksten, pris, «Kjøp nå» og tid igjen', ls)
        await shot(pg, '#phone .kx-card', 'kvotemarked_hjemler_liggende.png'); fit_list = await pg.evaluate(FIT % '#phone')
        await pg.evaluate("document.querySelector('#phone .kx-card[data-id=\"' + _r1 + '\"]').click()"); await pg.wait_for_timeout(350)
        sh = await pg.evaluate("""(() => { const t = document.querySelector('#phone').textContent, inp = document.getElementById('kmBid'), C = [...document.querySelectorAll('#phone .kx-to .chip-b')].map(b => ({v:b.dataset.v, how:b.dataset.how, dis:b.disabled, on:b.classList.contains('on'), t:b.textContent}));
          return {sheet:!!document.querySelector('#phone .kx-sheet'), min:inp && +inp.min, start:Math.round(_takst * 0.8), fakta:/Hjemmelslengde/.test(t) && /Årets kvote, torsk/.test(t) && /Hyse \\(garantert\\)/.test(t) && /uten tidsgrense/.test(t), landet:/torsk 20,0 t/.test(t), takst:t.includes(kr(_takst)),
            fdir:/Fiskeridirektoratet godkjenner ved oppgjøret/.test(t), bn:!!document.querySelector('#phone [data-pa=kmbuy]'), C}; })()""")
        tom = await pg.evaluate("_tom"); hav = await pg.evaluate("_hav")
        cT = next((x for x in sh['C'] if x['v'] == tom), {}); cH = next((x for x in sh['C'] if x['v'] == hav), {})
        check(sh['sheet'] and sh['min'] == sh['start'] and sh['fakta'] and sh['landet'] and sh['takst'] and sh['fdir'] and sh['bn'] and cT.get('how') == 'put' and not cT.get('dis') and 'Sett på «Tomas»' in cT.get('t', '')
              and cH.get('how') == 'struct' and not cH.get('dis') and 'Strukturer inn på «Havbris»' in cH.get('t', '') and '−10 %' in cH.get('t', '') and 'tak 5×' in cH.get('t', ''),
              'oppføringen: fakta om hjemmelen, det som er landet på den, taksten, og valget av båt: sett på «Tomas», eller strukturer inn på «Havbris» med −10 % og taket vist', sh)
        await shot(pg, '#phone .kx-sheet', 'kvotemarked_kort_liggende.png'); await shot(pg, '#phone .kx-auc', 'kvotemarked_valg_liggende.png'); fit_sheet = await pg.evaluate(FIT % '#phone')
        low = await pg.evaluate("(async () => { document.getElementById('kmBid').value = Math.round(_takst * 0.7); document.querySelector('#phone [data-pa=kmbid]').click(); await new Promise(r => setTimeout(r, 250)); return {msg:document.querySelector('#phone .kx-auc').textContent, calls:FAKE.calls.filter(c => c[0] === 'listing_bid').length}; })()")
        check('minst' in low['msg'] and low['calls'] == 0, 'et bud under startprisen sier hva som trengs, og sendes ikke', low)
        bid = await pg.evaluate("""(async () => { const c0 = S.cash, k = Math.round(_takst * 0.8); document.querySelector('#phone .kx-to [data-v=' + _tom + '][data-how=put]').click(); await new Promise(r => setTimeout(r, 80));
          document.getElementById('kmBid').value = k; document.querySelector('#phone [data-pa=kmbid]').click(); await new Promise(r => setTimeout(r, 450));
          const c = FAKE.calls.filter(x => x[0] === 'listing_bid').pop(); return {paid:c0 - S.cash, k, call:c && c[1], top:/høyeste budet/.test(document.querySelector('#phone .kx-auc').textContent), to:kmState().to[_r1], held:mktState().mb.held[_r1]}; })()""")
        check(bid['call'] and bid['call']['kr'] == bid['k'] and bid['call']['deliver'] is None and round(bid['paid']) == bid['k'] and bid['top'] and bid['to'] and bid['to']['vid'] == tom and bid['to']['how'] == 'put' and bid['held'],
              'budet binder pengene, og valget av båt huskes med budet i lagringen', bid)
        ob = await pg.evaluate("(async () => { const c0 = S.cash; FAKE.otherBid(_r1, Math.round(_takst * 0.9)); await MBC.sync(); await KMC.load(true); const m = S.msgs[S.msgs.length - 1]; return {back:S.cash - c0, from:m && m.from, msg:m && m.no, held:mktState().mb.held[_r1] || null}; })()")
        check(round(ob['back']) == bid['k'] and ob['from'] == 'Kvotemarkedet' and 'overbydd' in (ob['msg'] or '') and ob['held'] is None, 'overbydd: pengene er tilbake med en gang, og Kvotemarkedet sier det i Meldinger', ob)
        # «Kjøp nå», put on «Tomas»: she joins the closed group and starts the year with what the seller fished (§ 29); the register is the server's
        bn = await pg.evaluate("""(async () => { const c0 = S.cash, v = vesselById(_tom); PHONE.render(); await new Promise(r => setTimeout(r, 100)); document.querySelector('#phone .kx-to [data-v=' + _tom + '][data-how=put]').click(); await new Promise(r => setTimeout(r, 80));
          document.querySelector('#phone [data-pa=kmbuy]').click(); await new Promise(r => setTimeout(r, 600)); const l = vget(v, 'lic'), m = S.msgs.filter(x => x.from === 'Fiskeridirektoratet').pop();
          return {paid:c0 - S.cash, bn:Math.round(_takst * 1.2), lic:l && l.id, torsk:Math.round(vget(v, 'quota').torsk), msg:m && m.no, reg:FAKE.calls.filter(c => /^reg_/.test(c[0])).length, done:FAKE.led.filter(r => r.player === 'me' && !r.done).length, tab:document.querySelector('#phone .kx-tabs .on').textContent}; })()""")
        check(round(bn['paid']) == bn['bn'] and bn['lic'] == 'h14' and bn['torsk'] == 20000 and 'flyttet til «Tomas»' in (bn['msg'] or '') and bn['reg'] == 0 and bn['done'] == 0,
              '«Kjøp nå»: hjemmelen er satt på «Tomas», som starter året med selgerens 20 tonn (§ 29); Fiskeridirektoratet sender melding, og spillet rører ikke registeret', bn)

        # 4. structured onto «Havbris», and a structure quota at the settlement
        st = await pg.evaluate("""(async () => { const v = vesselById(_hav); PHONE.dact('kvote', 'kmsel', {id:String(_r2)}); PHONE.render(); await new Promise(r => setTimeout(r, 300)); document.querySelector('#phone .kx-to [data-v=' + _hav + '][data-how=struct]').click(); await new Promise(r => setTimeout(r, 80));
          document.querySelector('#phone [data-pa=kmbuy]').click(); await new Promise(r => setTimeout(r, 600)); const l = vget(v, 'lic'); return {st:l.st, kf:HJ.h14.kf * 0.9, y:_y, extra:l.extra, msg:S.msgs.filter(x => x.from === 'Fiskeridirektoratet').pop().no}; })()""")
        check(len(st['st'] or []) == 1 and abs(st['st'][0]['kf'] - st['kf']) < 1e-9 and st['st'][0]['until'] == st['y'] + 20 and 'Strukturkvoten er tildelt «Havbris»' in st['msg'], 'strukturert inn på «Havbris»: kvotefaktoren minus 10 % i 20 år', st)
        await pg.evaluate(TAB + "('st')"); await pg.wait_for_timeout(350)
        sq = await pg.evaluate("""(async () => { const C = [...document.querySelectorAll('#phone .kx-card')].map(c => c.textContent.replace(/\\s+/g, ' ')); document.querySelector('#phone .kx-card[data-id="' + _s1 + '"]').click(); await new Promise(r => setTimeout(r, 300));
          const t = document.querySelector('#phone').textContent, ch = [...document.querySelectorAll('#phone .kx-to .chip-b')].map(b => ({v:b.dataset.v, how:b.dataset.how, dis:b.disabled, t:b.textContent}));
          document.querySelector('#phone .kx-to [data-v=' + _hav + ']').click(); await new Promise(r => setTimeout(r, 80)); const k = +document.getElementById('kmBid').min; document.getElementById('kmBid').value = k; document.querySelector('#phone [data-pa=kmbid]').click(); await new Promise(r => setTimeout(r, 450));
          const c0 = S.cash; FAKE.settle(_s1); await MBC.sync(); const l = vget(vesselById(_hav), 'lic');
          return {C, igjen:/År igjen11,\\d \\(til /.test(t), ch, st:l.st, paid:c0 - S.cash, bn:!!document.querySelector('#phone [data-pa=kmbuy]')}; })()""")
        me = await pg.evaluate("S.me")
        check(len(sq['C']) == 2 and all('år igjen' in t and 'Strukturkvote 14–14,9 m' in t for t in sq['C']) and sq['igjen'] and all(x['how'] == 'struct' for x in sq['ch']) and next(x for x in sq['ch'] if x['v'] == me)['dis']
              and len(sq['st']) == 2 and sq['st'][1]['kf'] == 4.7 and sq['st'][1]['until'] == st['y'] + 12 and round(sq['paid']) == 0,
              'Strukturkvoter: kortet viser årene som er igjen; den kan bare struktureres (ikke på en båt uten hjemmel), og ved oppgjøret flyttes den uten ny avkorting', sq)

        # 5. the cap, blad B, and a structure quota that waits for a boat
        cap = await pg.evaluate("""(async () => { const lh = vget(vesselById(_hav), 'lic'), keep = lh.st.slice(); while (structFits(lh, 4.5)){ lh.st.push({id:'h14', kf:4.5, from:_y, until:_y + 20}); licExtra(lh); }
          PHONE.dact('kvote', 'kmsel', {id:String(_s2)}); PHONE.render(); await new Promise(r => setTimeout(r, 300)); const ch = [...document.querySelectorAll('#phone .kx-to .chip-b')].map(b => ({v:b.dataset.v, dis:b.disabled, t:b.textContent}));
          S.fm.b = false; PHONE.render(); const t = document.querySelector('#phone .kx-auc').textContent, bb = {txt:/blad B/.test(t), bid:!!document.querySelector('#phone [data-pa=kmbid]')}; S.fm.b = true; PHONE.render(); window._keep = keep; return {ch, bb, kf:HJ.h14.kf + lh.extra, tak:HJ.h14.kf * 5}; })()""")
        capH = next(x for x in cap['ch'] if x['v'] == hav)
        check(capH['dis'] and 'Over kvotetaket' in capH['t'] and cap['kf'] <= cap['tak'] and cap['bb']['txt'] and not cap['bb']['bid'], 'kvotetaket (5 ganger egen kvote) stenger valget av båten som er full, og uten blad B kan ingen by', cap)
        wt = await pg.evaluate("""(async () => { document.querySelector('#phone .kx-to [data-v=' + _tom + ']').click(); await new Promise(r => setTimeout(r, 80)); document.querySelector('#phone [data-pa=kmbuy]').click(); await new Promise(r => setTimeout(r, 100));
          return 0; })()""")
        # (the buy went through at once in the stub; to make the boat full before the settlement, bid on a new one instead)
        wt = await pg.evaluate("""(async () => { await new Promise(r => setTimeout(r, 500)); const lt = vget(vesselById(_tom), 'lic'), n0 = (lt.st || []).length;
          const s3 = FAKE.other({kind:'struct', id:'h14', hl:HJ.h14.hl, kf:4.4, from:_y - 1, until:_y + 19, used:{torsk:0, hyse:0, sei:0}, y:_y}, {buynow:null}); await KMC.load(true);
          const r = await KMC.bid(s3, KMC.byId(s3).start, {v:vesselById(_tom), how:'struct'}); const full = lt.st.slice(); while (structFits(lt, 4.4)){ lt.st.push({id:'h14', kf:4.4, from:_y, until:_y + 20}); licExtra(lt); }
          const nmsg = S.msgs.length; FAKE.settle(s3); await MBC.sync(); await MBC.sync(); const row = Object.keys(kmState().wait)[0], pend = FAKE.led.filter(x => x.player === 'me' && !x.done).map(x => x.kind);
          const lh = vget(vesselById(_hav), 'lic'); lh.st = _keep; licExtra(lh);   // (room on «Havbris» again)
          return {n0, ok:r.ok, row:!!row, pend, msgs:S.msgs.length - nmsg, msg:S.msgs[S.msgs.length - 1].no, st:lt.st.length - full.length}; })()""")
        await pg.evaluate(TAB + "('dine')"); await pg.wait_for_timeout(300)
        wt2 = await pg.evaluate("""(async () => { const card = document.querySelector('#phone .kx-wait'), t = card ? card.textContent : '', tab = document.querySelector('#phone .kx-tabs .on').textContent; const lh = vget(vesselById(_hav), 'lic'), n0 = lh.st.length;
          document.querySelector('#phone .kx-wait [data-v=' + _hav + ']').click(); await new Promise(r => setTimeout(r, 80)); document.querySelector('#phone [data-pa=kmtake]').click(); await new Promise(r => setTimeout(r, 500));
          return {card:!!card, venter:/Venter på en båt/.test(t), tab, got:lh.st.length - n0, kf:lh.st[lh.st.length - 1].kf, wait:Object.keys(kmState().wait).length, pend:FAKE.led.filter(x => x.player === 'me' && !x.done).length}; })()""")
        check(wt['n0'] == 1 and wt['ok'] and wt['row'] and wt['pend'] == ['struct'] and wt['msgs'] == 1 and 'kan ikke ta strukturkvoten' in wt['msg'] and wt2['card'] and wt2['venter'] and '· 1' in wt2['tab'] and wt2['got'] == 1 and wt2['kf'] == 4.4 and wt2['wait'] == 0 and wt2['pend'] == 0,
              'en strukturkvote som ikke kan struktureres ved oppgjøret, holdes igjen (ikke broker_done, én melding) til du velger en båt som kan ta den i Dine', [wt, wt2])

        # 6. your own right sold: the price less 5 %, and the boat with the same id stays in the fleet without the right
        sd = await pg.evaluate("""(async () => { const v = vesselById(_tom), lt = vget(v, 'lic'); lt.st = []; licExtra(lt); const it = kmPack({v, kind:'right'}), val = kmTakst(it), n0 = S.fleet.length; const r = await KMC.put({v, kind:'right'}, Math.round(val), null, 1);
          const lid = mbSale(v).lid; FAKE.otherBid(lid, Math.round(val * 1.1)); FAKE.settle(lid); const c0 = S.cash; await MBC.sync(); const m = S.msgs.filter(x => x.from === 'Kvotemarkedet').pop();
          return {ok:r.ok, key:FAKE.L.find(l => l.id === lid).vid, there:S.fleet.includes(v) && S.fleet.length === n0, lic:vget(v, 'lic'), sale:mbSale(v), got:S.cash - c0, net:Math.round(Math.round(val * 1.1) * 0.95), msg:m && m.no, reg:FAKE.calls.filter(c => /^reg_/.test(c[0])).length}; })()""")
        check(sd['ok'] and sd['key'] == tom and sd['there'] and sd['lic'] is None and sd['sale'] is None and round(sd['got']) == sd['net'] and '5 %' in (sd['msg'] or '') and sd['reg'] == 0,
              'din hjemmel solgt: du får prisen minus 5 %, hjemmelen er ute av «Tomas», og båten med samme id er fortsatt i rederiet (serveren flytter plassen i registeret)', sd)

        # 7. the free right: a right won that cannot be put where it was to go is kept in the company; put on a boat from Dine; its two years
        fr = await pg.evaluate("""(async () => { const y = _y, r3 = FAKE.other({kind:'right', id:'h14', hl:HJ.h14.hl, flen:14.99, st:[], landY:y, used:{torsk:0, hyse:0, sei:0}, y}, {buynow:null}); await KMC.load(true); const v = vesselById(_tom);
          await KMC.bid(r3, KMC.byId(r3).start, {v, how:'put'}); const l = {id:'h10', hl:HJ.h10.hl, since:y, landY:y}; licExtra(l); withVessel(v, () => { S.lic = l; freshQuota(); });   // («Tomas» got another right meanwhile)
          FAKE.settle(r3); await MBC.sync(); const m = S.msgs.filter(x => x.from === 'Fiskeridirektoratet').pop(); return {free:kmFreeList().map(f => f.id), tom:vget(v, 'lic').id, msg:m && m.no, pend:FAKE.led.filter(x => x.player === 'me' && !x.done).length}; })()""")
        check(fr['free'] == ['h14'] and fr['tom'] == 'h10' and 'ledig hjemmel' in (fr['msg'] or '') and fr['pend'] == 0, 'en hjemmel som ikke lenger kan settes der den skulle, blir en ledig hjemmel i rederiet, med melding', fr)
        await pg.evaluate("(() => { const v = newVesselObj('kyst15', S.boat.port, null); vget(v, 'boat').status = 'port'; v.boatName = 'Ledig'; window._led = v.id; })()")
        await pg.evaluate(TAB + "('dine')"); await pg.wait_for_timeout(300)
        await shot(pg, '#phone .kx-free', 'kvotemarked_ledig_liggende.png')
        fr2 = await pg.evaluate("""(async () => { const card = document.querySelector('#phone .kx-free'), t = card ? card.textContent : ''; card.querySelector('[data-v=' + _led + '][data-how=put]').click(); await new Promise(r => setTimeout(r, 80));
          document.querySelector('#phone [data-pa=kmfree]').click(); await new Promise(r => setTimeout(r, 300)); const v = vesselById(_led);
          return {card:!!card, frist:/Tilsagnet gjelder til/.test(t), legg:!!card.querySelector('[data-pa=kmput]'), lic:(vget(v, 'lic') || {}).id, free:kmFreeList().length}; })()""")
        check(fr2['card'] and fr2['frist'] and fr2['legg'] and fr2['lic'] == 'h14' and fr2['free'] == 0, 'Dine viser den ledige hjemmelen med fristen; den kan legges ut, eller settes på en båt uten hjemmel («Ledig»)', fr2)
        # «Selg nå til registeret · 90 %» from the form, and a free right whose two years are up when the page is drawn
        qs = await pg.evaluate("""(async () => { const v = vesselById(_led), it = kmPack({v, kind:'right'}), want = kmQuick(it), c0 = S.cash, n0 = FAKE.calls.filter(c => c[0] === 'reg_free').length; PHONE.dact('kvote', 'kmput', {k:v.id}); PHONE.render(); await new Promise(r => setTimeout(r, 150));
          document.querySelector('#phone [data-pa=kmquick]').click(); await new Promise(r => setTimeout(r, 300));
          return {got:S.cash - c0, want, pc:want / kmTakst(it), lic:vget(v, 'lic'), there:S.fleet.includes(v), reg:FAKE.calls.filter(c => c[0] === 'reg_free').map(c => c[1].rid).slice(n0)}; })()""")
        check(round(qs['got']) == qs['want'] and abs(qs['pc'] - 0.9) < 0.001 and qs['lic'] is None and qs['there'] and qs['reg'] == ['h14'], '«Selg nå til registeret»: 90 % av taksten med en gang, hjemmelen går tilbake til registeret, og båten blir i rederiet', qs)
        ex = await pg.evaluate("""(async () => { const H = S.t / 60; kmApply({kind:'right', id:'h9', hl:HJ.h9.hl, flen:9, st:[], y:_y, used:null}, {how:'free'}, H - 17521); const n = kmFreeList().length; PHONE.render(); await new Promise(r => setTimeout(r, 100));
          const m = S.msgs.filter(x => x.from === 'Fiskeridirektoratet').pop(); return {n, left:kmFreeList().length, msg:m && m.no}; })()""")
        check(ex['n'] == 1 and ex['left'] == 0 and 'har gått ut etter to år' in (ex['msg'] or ''), 'en ledig hjemmel som har stått i to år, går tilbake til registeret når lista vises (kmFree)', ex)

        # 8. the wish, sold last month, and a guest
        ws = await pg.evaluate("""(async () => { PHONE.dact('kvote', 'kmput0', {}); PHONE.dact('kvote', 'kmtab', {s:'dine'}); PHONE.render(); await new Promise(r => setTimeout(r, 100)); const d = document.querySelector('#phone .kx-wish'); if (d && d.tagName === 'DETAILS') d.open = true;
          document.getElementById('kmWishR').value = 'h14'; document.getElementById('kmWishK').value = 'right'; document.getElementById('kmWishMax').value = 30000000; document.querySelector('#phone [data-pa=kmwish]').click(); await new Promise(r => setTimeout(r, 150));
          window._r4 = FAKE.other({kind:'right', id:'h14', hl:HJ.h14.hl, flen:14.99, st:[], landY:_y, used:{torsk:0, hyse:0, sei:0}, y:_y}); await KMC.load(true); const m = S.msgs[S.msgs.length - 1];
          PHONE.dact('kvote', 'kmtab', {s:'solgt'}); PHONE.render(); const sold = document.querySelector('#phone .kx-sold'); return {wish:FAKE.wish, msg:m && m.no, sold:sold ? sold.textContent : ''}; })()""")
        check(ws['wish'] == {'rid': 'h14', 'kind': 'right', 'max_kr': 30000000} and 'passer ønsket' in (ws['msg'] or '') and 'Hjemmel 14–14,9 m' in ws['sold'] and 'Strukturkvote 14–14,9 m' in ws['sold'] and '% av taksten' in ws['sold'],
              '«Ønsket hjemmel» lagres på serveren (for push) og varsles i Meldinger; «Solgt» viser salgene med prisen mot taksten, aldri hvem', ws)
        gs = await pg.evaluate("(async () => { CLOUD.guest = true; PHONE.dact('kvote', 'kmsel', {id:String(_r4)}); PHONE.render(); await new Promise(r => setTimeout(r, 150)); const t = document.querySelector('#phone .kx-auc').textContent; CLOUD.guest = false; return {reg:/Registrer deg/.test(t), bid:!!document.querySelector('#phone [data-pa=kmbid]')}; })()")
        check(gs['reg'] and not gs['bid'], 'en gjest ser oppføringen, men må registrere seg for å by', gs)

        # 8b. along the coast (/stikkprove): the company's boat at Bergen, Bodø and Hammerfest buys a right and puts it on a boat there.
        # (The market does not use the position: one national market, V5 A. The map for these places is not in this build; the ports are.)
        for place in ['Bergen', 'Bodø', 'Hammerfest']:
            sp = await pg.evaluate("""(async place => { const q = PORTS.find(p => new RegExp('^' + place, 'i').test(p.name)) || PORTS.find(p => new RegExp(place, 'i').test(p.name)); if (!q) return {port:null};
              S.boat.port = q.id; S.boat.pos = {x:q.p.x, y:q.p.y}; S.boat.status = 'port'; const v = newVesselObj('kyst15', q.id, null); vget(v, 'boat').status = 'port'; v.boatName = place;
              const lid = FAKE.other({kind:'right', id:'h14', hl:HJ.h14.hl, flen:14.99, st:[], landY:_y, used:{torsk:7000, hyse:0, sei:0}, y:_y}); await KMC.load(true); const c0 = S.cash, Q = KMC.byId(lid);
              PHONE.dact('kvote', 'kmsel', {id:String(lid)}); PHONE.render(); await new Promise(r => setTimeout(r, 200)); const chip = document.querySelector('#phone .kx-to [data-v=' + v.id + '][data-how=put]'); const dis = !chip || chip.disabled; if (chip) chip.click(); await new Promise(r => setTimeout(r, 80));
              document.querySelector('#phone [data-pa=kmbuy]').click(); await new Promise(r => setTimeout(r, 600)); const l = vget(v, 'lic');
              return {port:q.name, lat:+natLL(q.p).lat.toFixed(2), chip:!dis, paid:Math.round(c0 - S.cash), bn:Q.buynow, lic:l && l.id, torsk:Math.round(vget(v, 'quota').torsk), kvote:Math.round(withVessel(v, () => licQ(S.lic).torsk))}; })(%s)""" % json.dumps(place))
            check(sp.get('port') and sp['chip'] and sp['paid'] == sp['bn'] and sp['lic'] == 'h14' and sp['torsk'] == 7000 and sp['kvote'] > 30000, 'stikkprøve %s: hjemmelen kjøpt og satt på en båt der' % place, sp)

        # 9. the pictures standing up and on a phone: the list, the card, the choice of boat, «Legg ut»
        fits = [fit_form, fit_list, fit_sheet]
        for w, h, tag in [(800, 1280, 'staaende'), (390, 844, 'telefon')]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(300)
            await pg.evaluate(TAB + "('hjem')"); await pg.wait_for_timeout(300)
            await shot(pg, '#phone .kx-common', 'kvotemarked_hjemler_%s.png' % tag); fits.append(await pg.evaluate(FIT % '#phone'))
            await pg.evaluate("(() => { PHONE.dact('kvote', 'kmsel', {id:String(_r4)}); PHONE.render(); })()"); await pg.wait_for_timeout(300)
            await shot(pg, '#phone .kx-sheet', 'kvotemarked_kort_%s.png' % tag); await shot(pg, '#phone .kx-auc', 'kvotemarked_valg_%s.png' % tag); fits.append(await pg.evaluate(FIT % '#phone'))
            await pg.evaluate("(() => { PHONE.dact('kvote', 'kmput', {k:_hav}); PHONE.render(); })()"); await pg.wait_for_timeout(300)
            await shot(pg, '#phone .kx-form', 'kvotemarked_leggut_%s.png' % tag); fits.append(await pg.evaluate(FIT % '#phone'))
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        check(all(not f for f in fits), 'ingenting stikker ut av telefonen i 1280×800, 800×1280 eller 390×844', fits)
        await pg.evaluate("(() => { PHONE.show(false); window.cloudRpc = window._real; CLOUD.on = false; CLOUD.user = null; })()")
        print('sidefeil', errs)
        await br.close()


asyncio.run(main())
