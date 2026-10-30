"""The seasons as shared events (30.10.2026; core/09c-seasons.js EVENTS, supabase/migrations/20261030130000_season_ev.sql ev_top,
ui/10h-world.js evTop/evCloseTick, ui/06d-season-folk.js): the events' days by year, where a landing falls (the plant's position and
the species), the landing row that carries its event, the opening on the VHF, the Sesong app's board with a mocked cloud, and the closing
with the prize and the badge once the board has come. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        # 1. the days and the areas: Lofotfisket 20.1-10.4 (81 days), the saithe summer the whole coast; a Senja plant is outside Lofoten
        r = await pg.evaluate("""(() => { S.tut = 0; const y = 2028, L = EVENTS.find(e => e.id === 'lofot'), Se = EVENTS.find(e => e.id === 'sei'), D = evDays(L, y), Ds = evDays(Se, y);
          const H = D.H0 + 24 * 22 + 5, now = evNow(H).map(e => e.id), day = evDayN(L, H), q = PORTS.find(x => x.mottak) || PORTS[0], ll = natLL(q.p);
          const lof = natP(68.15, 14.6), inLof = evIn(L, lof), inSea = evIn(Se, q.p), senjaLof = evIn(L, q.p);
          const atSei = evAt(Ds.H0 + 30, q.id, ['sei']), atSeiCod = evAt(Ds.H0 + 30, q.id, ['torsk']), atNone = evAt(D.H0 - 48, q.id, ['torsk']);
          return {days:D.days, sdays:Ds.days, now, day, inLof, inSea, senjaLof, atSei, atSeiCod, atNone, lat:+ll.lat.toFixed(2)}; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['days'] in (81, 82) and r['sdays'] == 83 and r['now'] == ['lofot'] and r['day'] == 23 and r['inLof'] and r['inSea'] and not r['senjaLof'] and r['atSei'] == 'sei' and r['atSeiCod'] == '' and r['atNone'] == ''),
              "the events' days by year, the areas (Lofoten by the box, the saithe summer everywhere), and the event a landing falls in by place, day and species")
        # 2. the landing row carries its event; the opening goes on the VHF once
        r2 = await pg.evaluate("""(() => { const y = 2028, Se = EVENTS.find(e => e.id === 'sei'), Ds = evDays(Se, y), H = Ds.H0 + 30, q = PORTS.find(x => x.mottak) || PORTS[0];
          S.t = H * 60; WSH.rec = true; const Q = wq(); Q.l = []; wshLand(q.id, H, 'open', {sei:120, torsk:30}, 0); const row = Q.l[0];
          S.radio = []; S.seasonSeen = {}; seasonDay(Ds.H0 + 2); seasonDay(Ds.H0 + 3); const vhf = S.radio.map(m => m.no);
          return {ev:row && row.ev, items:row && row.items.length, vhf}; })()""")
        print(json.dumps(r2, ensure_ascii=False))
        print(ok(r2['ev'] == 'sei' and r2['items'] == 2 and len(r2['vhf']) == 1 and 'Seisommeren er i gang' in r2['vhf'][0]), 'the landing row carries its event, and the opening is said once on the VHF')
        # 3. the Sesong app's board with a mocked cloud, and the closing: the prize for second place and the badge, once the board has come
        r3 = await pg.evaluate("""(async () => { const y = 2028, L = EVENTS.find(e => e.id === 'lofot'), D = evDays(L, y); S.t = (D.H0 + 24 * 10) * 60;
          const calls = []; const top = {ev:'lofot', y, kg:412000, n:17, rows:[{rank:1, boat:'Havgull', port:'finnsnes', kg:60000, me:false}, {rank:2, boat:'Min', port:'finnsnes', kg:41000, me:true}], plants:[{port:'finnsnes', kg:200000}], mine:{rank:2, kg:41000}};
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (fn === 'ev_top') return top; return null; }; CLOUD.on = true; CLOUD.user = 'u1'; CLOUD.guest = false;
          for (const k in EVTOP) delete EVTOP[k]; EVTOP.off = false;
          PHONE.show(true); PHONE.open('sesong'); PHONE.render(); await new Promise(r => setTimeout(r, 150)); PHONE.render(); const txt = document.getElementById('phView').innerText;
          const board = /Lofotfisket 2028/.test(txt) && /Dag 11 av 8[12]/.test(txt) && /412,0 tonn levert av 17 båter/.test(txt) && /Du: 41\u00a0000 kg, plass 2/.test(txt) && /Havgull/.test(txt);
          // the closing: the day after the last, the board is asked for, and then the prize and the badge
          S.seasonSeen = {}; S.evPending = []; S.ach = S.ach || {}; S.ach.ev = {}; const cash0 = S.cash, m0 = S.msgs.length; seasonDay(D.H1 + 2); const pending = (S.evPending || []).length;
          evCloseTick(); await new Promise(r => setTimeout(r, 150)); evCloseTick(); const B = S.ach.ev['lofot' + y], said = S.msgs.slice(m0).map(x => x.no).join(' | ');
          PHONE.show(false); return {board, txt:txt.slice(0, 200), pending, badge:B, gain:S.cash - cash0, said, calls:calls.map(c => c[0])}; })()""")
        print(json.dumps(r3, ensure_ascii=False)[:900])
        B = r3.get('badge') or {}
        print(ok(r3['board'] and r3['pending'] == 1 and B.get('badge') and B.get('rank') == 2 and B.get('kg') == 41000 and r3['gain'] == 7500 and 'nummer 2' in r3['said'] and 'Lofotfisker 2028' in r3['said'] and not S_pending(r3)),
              "the Sesong app shows the event's board (day, tonnes, boats, your place, the leader), and the closing pays second place and gives the badge once the board has come")
        print('errors:', errs[:3])
        await b.close()

def S_pending(r):
    return False

asyncio.run(main())
