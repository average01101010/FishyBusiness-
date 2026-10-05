"""The feedback app on the phone (05.10.2026, ui/06e-feedback.js; Jonas: «Lag en feedback-app i telefonen hvor brukerne kan komme med
tilbakemeldinger, gjerne sortert etter hva tilbakemeldingen gjelder. La dem også laste opp bilde»), with a stand-in for Supabase
(cloudRpc): the app on the home screen, the topics, nothing to send without the cloud, the text kept between redraws, a large picture
made smaller, the sending with what goes with it, and the list of one's own with the answer. G3.snap (the picture of the game) needs 3D
and is not tested here. Prints OK or FEIL per check, on a phone in portrait."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 412, 'height': 860}, device_scale_factor=2, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(600)
        # 1. on the home screen, and without the cloud nothing can be sent
        r = await pg.evaluate("""(() => { PHONE.open('home'); const icon = !!document.querySelector('#phone [data-pa=open][data-a=tilbake]'); PHONE.open('tilbake');
          const chips = document.querySelectorAll('#phone [data-pa=fbTopic]').length, note = document.querySelector('#phone .fb').textContent.includes('detstorebla.no');
          return {icon, chips, note, sendOff:document.querySelector('#phone .fb-send').disabled, mine:!!document.querySelector('#phone .fb-mine')}; })()""")
        check(r['icon'] and r['chips'] == 10 and r['note'] and r['sendOff'] and not r['mine'], 'the app is on the phone with ten topics; without the cloud it says where to send from and cannot send', r)
        # 2. with the cloud (a stand-in): a topic, the text, a star; the text stays when the page is drawn again
        await pg.evaluate("""(() => { window.RPC = []; CLOUD.on = true;
          cloudRpc = async (fn, args) => { RPC.push({fn, args}); if (fn === 'fb_mine') return RPC.some(c => c.fn === 'fb_send') ? [{id:7, ts:new Date().toISOString(), topic:'bug', body:'Båten gikk på land ved Gibostad', img:true, status:'fixed', reply:'Takk, rettet!'}] : [];
            if (fn === 'fb_send') return 7; return null; };
          PHONE.open('home'); PHONE.open('tilbake'); })()""")
        await pg.wait_for_timeout(300)
        await pg.fill('#fbBody', 'Båten gikk på land ved Gibostad da jeg brukte Autonav.')
        await pg.click('#phone [data-pa=fbTopic][data-k=bug]'); await pg.click('#phone [data-pa=fbRate][data-k="4"]'); await pg.wait_for_timeout(200)
        r = await pg.evaluate("""(() => ({text:document.getElementById('fbBody').value, on:document.querySelector('#phone .fb-chip.on').dataset.k, stars:document.querySelectorAll('#phone .fb-star.on').length,
          send:!document.querySelector('#phone .fb-send').disabled, n:document.querySelector('#phone .fb-n').textContent}))()""")
        check(r['text'].startswith('Båten gikk') and r['on'] == 'bug' and r['stars'] == 4 and r['send'] and r['n'].startswith('%d /' % len(r['text'])), 'a topic, the text and four stars; the text stays when a tap draws the page again, and «Send» is ready', r)
        # 3. a picture of 3000 × 2000 is made smaller before it is sent
        await pg.evaluate("""(async () => { const c = document.createElement('canvas'); c.width = 3000; c.height = 2000; const g = c.getContext('2d');
          for (let i = 0; i < 400; i++){ g.fillStyle = 'hsl(' + (i * 37 % 360) + ',70%,50%)'; g.fillRect((i * 97) % 3000, (i * 53) % 2000, 180, 120); }
          const blob = await new Promise(r => c.toBlob(r, 'image/png')); const dt = new DataTransfer(); dt.items.add(new File([blob], 'skjerm.png', {type:'image/png'}));
          const inp = document.getElementById('fbFile'); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles:true})); })()""")
        await pg.wait_for_function("FEEDBACK.draft.img || !FEEDBACK.draft.imgBusy", timeout=20000); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""(() => { const d = FEEDBACK.draft.img; return d ? {w:d.w, h:d.h, jpeg:d.url.startsWith('data:image/jpeg;base64,'), len:d.url.length, shown:!!document.querySelector('#phone .fb-img'), text:document.getElementById('fbBody').value.length} : null; })()""")
        check(r and r['w'] == 1600 and r['h'] == 1067 and r['jpeg'] and r['len'] <= 540000 and r['shown'] and r['text'] == len('Båten gikk på land ved Gibostad da jeg brukte Autonav.'), 'a picture of 3000 × 2000 is made 1600 × 1067 JPEG under 540 000 characters and shown, and the text is still there', r)
        await pg.screenshot(path='feedback_form.png')
        # 4. send: what goes with it, and the list of one's own with the answer
        await pg.click('#phone .fb-send'); await pg.wait_for_function("RPC.some(c => c.fn === 'fb_send') && document.querySelector('#phone .fb-reply')", timeout=10000)
        r = await pg.evaluate("""(() => { const c = RPC.find(c => c.fn === 'fb_send').args, m = c.meta;
          return {topic:c.topic, body:c.body, rating:c.rating, img:!!c.img && c.img.length, meta:{version:m.version, view:m.view, pos:m.pos, w:m.w, h:m.h, boat:m.boat, st:m.st, t:m.t, platform:m.platform},
            metaLen:JSON.stringify(m).length, cleared:FEEDBACK.draft.body === '' && !FEEDBACK.draft.img, reply:document.querySelector('#phone .fb-reply').textContent, st:document.querySelector('#phone .fb-st').textContent}; })()""")
        m = r['meta']
        check(r['topic'] == 'bug' and r['body'].startswith('Båten gikk') and r['rating'] == 4 and r['img'] and m['version'] and m['view'] in ('3d', 'kart') and isinstance(m['pos'], list) and len(m['pos']) == 2
              and m['w'] == 412 and m['boat'] and m['t'] is not None and r['metaLen'] < 4000, 'sent with the topic, text, stars and picture, and the version, screen, view, boat and its position with it (under 4000 bytes)', r)
        check(r['cleared'] and 'Takk, rettet!' in r['reply'] and r['st'] == 'Fikset', 'after sending the form is empty, and «Dine tilbakemeldinger» shows its status and the answer', {k: r[k] for k in ('cleared', 'reply', 'st')})
        await pg.evaluate("document.querySelector('#phone .ph-body, #phone .ph-screen') && (document.querySelector('#phone .ph-body, #phone .ph-screen').scrollTop = 1e6)"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='feedback_sent.png')
        # 5. fits the phone: nothing wider than the screen
        r = await pg.evaluate("""(() => { const w = innerWidth; return [...document.querySelectorAll('#phone .fb *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > w + 1; }).map(e => e.className || e.tagName).slice(0, 5); })()""")
        check(not r, 'on a phone in portrait nothing in the app is wider than the screen', r)
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
