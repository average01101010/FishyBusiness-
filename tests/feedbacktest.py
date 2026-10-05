"""The feedback app on the phone (05.10.2026, ui/06e-feedback.js; Jonas: «Lag en feedback-app i telefonen hvor brukerne kan komme med
tilbakemeldinger, gjerne sortert etter hva tilbakemeldingen gjelder. La dem også laste opp bilde»), with a stand-in for Supabase
(cloudRpc) and the Storage upload: the app on the home screen, the topics, nothing to send without the cloud, the text kept between
redraws, a large picture made smaller and a second one, a video kept as it is and one over the limit made smaller (05.10.2026), the
sending with what goes with it, a video upload that fails and is sent again, and the list of one's own with the answer. G3.snap (the picture of the game) needs 3D
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
          cloudRpc = async (fn, args) => { RPC.push({fn, args}); if (fn === 'fb_mine') return RPC.some(c => c.fn === 'fb_media_done') ? [{id:7, ts:new Date().toISOString(), topic:'bug', body:'Båten gikk på land ved Gibostad', img:true, nimg:2, vids:2, status:'fixed', reply:'Takk, rettet!'}] : [];
            if (fn === 'fb_send2') return 7; if (fn === 'fb_media_slot') return 'user_test/7-' + (RPC.filter(c => c.fn === 'fb_media_slot').length) + '-abc.' + args.mime.split('/')[1]; return null; };
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
        await pg.wait_for_function("FEEDBACK.draft.imgs.length && !FEEDBACK.draft.imgBusy", timeout=20000); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""(() => { const d = FEEDBACK.draft.imgs[0]; return d ? {w:d.w, h:d.h, jpeg:d.url.startsWith('data:image/jpeg;base64,'), len:d.url.length, shown:document.querySelectorAll('#phone .fb-th img').length, text:document.getElementById('fbBody').value.length} : null; })()""")
        check(r and r['w'] == 1600 and r['h'] == 1067 and r['jpeg'] and r['len'] <= 540000 and r['shown'] == 1 and r['text'] == len('Båten gikk på land ved Gibostad da jeg brukte Autonav.'), 'a picture of 3000 × 2000 is made 1600 × 1067 JPEG under 540 000 characters and shown, and the text is still there', r)
        # 3b. a second picture, and two videos: one kept as it is, one over the limit made smaller (a recording made here, 2 s)
        await pg.evaluate("""(async () => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const g = c.getContext('2d'); g.fillStyle = '#2a6'; g.fillRect(0, 0, 800, 600);
          const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.9));
          const rec = async (bps) => { const cv = document.createElement('canvas'); cv.width = 960; cv.height = 540; const gg = cv.getContext('2d'); const st = cv.captureStream(30);
            const mr = new MediaRecorder(st, {mimeType:'video/webm', videoBitsPerSecond:bps}), parts = []; mr.ondataavailable = e => e.data.size && parts.push(e.data);
            const done = new Promise(r => mr.onstop = r); mr.start(250); const t0 = performance.now();
            await new Promise(r => { const f = () => { const t = performance.now() - t0; for (let i = 0; i < 60; i++){ gg.fillStyle = 'hsl(' + ((i * 47 + t / 3) % 360) + ',70%,' + (30 + (i * 13 + t) % 40) + '%)'; gg.fillRect((i * 131 + t) % 960, (i * 71 + t / 2) % 540, 90, 70); }
              if (t < 2000) requestAnimationFrame(f); else r(); }; f(); });
            mr.stop(); await done; return new Blob(parts, {type:'video/webm'}); };
          const v1 = await rec(6e5), v2 = await rec(8e6); window.__v = {s1:v1.size, s2:v2.size};
          const dt = new DataTransfer(); dt.items.add(new File([blob], 'b.jpg', {type:'image/jpeg'})); dt.items.add(new File([v1], 'opptak1.webm', {type:'video/webm'}));
          FEEDBACK.LIM.vbytes = Math.max(v1.size + 1, Math.round(v2.size * 0.8));
          window.__dt2 = new File([v2], 'opptak2.webm', {type:'video/webm'});
          const inp = document.getElementById('fbFile'); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles:true})); })()""")
        await pg.wait_for_function("FEEDBACK.draft.imgs.length === 2 && FEEDBACK.draft.vids.length === 1 && !FEEDBACK.draft.vBusy", timeout=30000)
        await pg.evaluate("(() => { const dt = new DataTransfer(); dt.items.add(window.__dt2); const inp = document.getElementById('fbFile'); inp.files = dt.files; inp.dispatchEvent(new Event('change', {bubbles:true})); })()")
        await pg.wait_for_function("FEEDBACK.draft.vids.length === 2 && !FEEDBACK.draft.vBusy || !FEEDBACK.draft.vBusy && performance.now() > 1e9", timeout=60000); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""(() => { const D = FEEDBACK.draft; return {imgs:D.imgs.length, vids:D.vids.map(v => ({mime:v.mime, size:v.blob.size, pic:!!v.pic})), src:window.__v, lim:FEEDBACK.LIM.vbytes,
          thumbs:document.querySelectorAll('#phone .fb-th').length, picker:!!document.getElementById('fbFile'), multi:(document.getElementById('fbFile') || {}).multiple}; })()""")
        vv = r['vids']
        check(r['imgs'] == 2 and len(vv) == 2 and vv[0]['size'] == r['src']['s1'] and vv[0]['mime'] == 'video/webm' and vv[1]['size'] < r['lim'] and vv[1]['size'] < r['src']['s2'] and vv[1]['mime'] in ('video/webm', 'video/mp4')
              and r['thumbs'] == 4 and r['picker'] and r['multi'], 'two pictures and two videos: one under the limit kept as it is, one over it played through into a smaller one, all shown as thumbnails', r)
        await pg.screenshot(path='feedback_form.png')
        # 4. send: the text and pictures, then the videos; the first upload fails, and «Send videoen på nytt» sends the videos only
        UP = []
        async def store(route):
            req = route.request; UP.append({'url': req.url, 'method': req.method, 'type': req.headers.get('content-type'), 'upsert': req.headers.get('x-upsert'), 'len': len(req.post_data_buffer or b'')})
            if len(UP) == 1: return await route.fulfill(status=500, body='{"error":"boom"}')
            await route.fulfill(status=200, content_type='application/json', body='{"Key":"x"}')
        await pg.route('**/storage/v1/object/**', store)
        await pg.click('#phone .fb-send'); await pg.wait_for_function("FEEDBACK.draft.err && !FEEDBACK.draft.busy", timeout=20000)
        r1 = await pg.evaluate("""(() => ({err:FEEDBACK.draft.err, fid:FEEDBACK.draft.fid, vids:FEEDBACK.draft.vids.length, btn:document.querySelector('#phone .fb-send').textContent, on:!document.querySelector('#phone .fb-send').disabled,
          body:FEEDBACK.draft.body, sends:RPC.filter(c => c.fn === 'fb_send2').length}))()""")
        await pg.click('#phone .fb-send'); await pg.wait_for_function("RPC.filter(c => c.fn === 'fb_media_done').length === 2 && document.querySelector('#phone .fb-reply')", timeout=20000)
        r = await pg.evaluate("""(() => { const c = RPC.find(c => c.fn === 'fb_send2').args, m = c.meta, sl = RPC.filter(c => c.fn === 'fb_media_slot').map(c => c.args);
          return {topic:c.topic, body:c.body, rating:c.rating, imgs:c.imgs.length, img0:c.imgs[0].slice(0, 23), meta:{version:m.version, view:m.view, pos:m.pos, w:m.w, h:m.h, boat:m.boat, st:m.st, t:m.t, platform:m.platform},
            metaLen:JSON.stringify(m).length, sends:RPC.filter(c => c.fn === 'fb_send2').length, slots:sl, done:RPC.filter(c => c.fn === 'fb_media_done').map(c => c.args.path),
            cleared:FEEDBACK.draft.body === '' && !FEEDBACK.draft.imgs.length && !FEEDBACK.draft.vids.length && !FEEDBACK.draft.fid, reply:document.querySelector('#phone .fb-reply').textContent, st:document.querySelector('#phone .fb-st').textContent,
            list:document.querySelector('#phone .fb-mine').textContent}; })()""")
        m = r['meta']
        check(r1['fid'] == 7 and r1['vids'] == 2 and 'Send videoen på nytt' in r1['btn'] and r1['on'] and r1['body'] == '' and r1['sends'] == 1 and 'videoen kom ikke fram' in r1['err'],
              'a video upload that fails: the text and pictures are in, the form keeps the videos and offers «Send videoen på nytt»', r1)
        check(r['topic'] == 'bug' and r['body'].startswith('Båten gikk') and r['rating'] == 4 and r['imgs'] == 2 and r['img0'] == 'data:image/jpeg;base64,' and m['version'] and m['view'] in ('3d', 'kart') and isinstance(m['pos'], list) and len(m['pos']) == 2
              and m['w'] == 412 and m['boat'] and m['t'] is not None and r['metaLen'] < 4000 and r['sends'] == 1, 'sent once with the topic, text, stars and both pictures, and the version, screen, view, boat and its position with it (under 4000 bytes)', {k: r[k] for k in ('topic', 'rating', 'imgs', 'meta', 'sends')})
        ups = [u for u in UP if u['method'] == 'POST']
        check(len(r['slots']) == 3 and r['slots'][0]['fid'] == 7 and r['slots'][0]['mime'] == 'video/webm' and len(ups) == 3 and all('/storage/v1/object/feedback-media/user_test/7-' in u['url'] for u in ups) and ups[-1]['len'] > 1000
              and all(u['upsert'] == 'false' and u['type'] in ('video/webm', 'video/mp4') for u in ups) and len(r['done']) == 2 and r['done'][0].startswith('user_test/7-2-'),
              'each video gets a name for the feedback, goes up to the private bucket in its own folder (not written over), and is marked done; the one that failed gets a new name', {'slots': r['slots'], 'up': ups, 'done': r['done']})
        check(r['cleared'] and 'Takk, rettet!' in r['reply'] and r['st'] == 'Fikset' and '📷 2' in r['list'] and '🎬 2' in r['list'], 'after sending the form is empty, and «Dine tilbakemeldinger» shows the pictures and videos, its status and the answer', {k: r[k] for k in ('cleared', 'reply', 'st', 'list')})
        await pg.evaluate("document.querySelector('#phone .ph-body, #phone .ph-screen') && (document.querySelector('#phone .ph-body, #phone .ph-screen').scrollTop = 1e6)"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='feedback_sent.png')
        # 5. fits the phone: nothing wider than the screen
        r = await pg.evaluate("""(() => { const w = innerWidth; return [...document.querySelectorAll('#phone .fb *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > w + 1; }).map(e => e.className || e.tagName).slice(0, 5); })()""")
        check(not r, 'on a phone in portrait nothing in the app is wider than the screen', r)
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
