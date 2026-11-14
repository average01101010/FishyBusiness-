"""Folk 2, FB6 (steg 124): the new skinned figure in the wardrobe behind #folk2, beside today's. Checks that the game reads
src/data/folk2.b64; that every look the wardrobe can make (the bodies, hats, hairstyles, jackets, beards and shoes of looktest) builds
a figure of the new body with no part missing, painted by the look's zones; that the shader's skinning gives the same points as the
processor's (figSkin, which tests/unit/figpose.test.mjs holds to kropp.py's numbers) on WebGL 2 and on WebGL 1, with all 58 bones in
one draw call and with the palette of 37 a device with 128 vertex uniform vectors gets (each corner's point is drawn into a pixel
of its own as two bytes a coordinate and read back); that the wardrobe shows both figures in portrait and landscape, in the rest
pose, standing and with a grip in each hand, with and without gloves; and that nothing of it is there without #folk2.
Pictures in docs/okter/<KYST_OKT or 2026-11-13-124>/ (garderobe_<format>_<pose>.png). Prints OK or FEIL per check, the page errors last."""
from _env import GAME, boot, HERE
import asyncio, json, os
from playwright.async_api import async_playwright

PICS = os.path.join(os.path.dirname(HERE), 'docs', 'okter', os.environ.get('KYST_OKT', '2026-11-13-124'))


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


# the shader's points read back: every corner of a figure drawn as a point into its own pixel, three passes (x, y, z), the coordinate
# as 16 bits in two bytes over -1..3 m; compared with figSkin on the processor. kind: 'webgl2' (GLSL ES 3.00) or 'webgl' (1.00), the
# same figGL source turned into 3.00 as view3d's glsl3 does it (attribute -> in, varying -> out and in, gl_FragColor -> an out colour).
PROBE = """async ([kind, look, pose, grips, pal]) => {
  const cv = document.createElement('canvas'), gl = cv.getContext(kind, {antialias:false, preserveDrawingBuffer:true}); if (!gl) return {no:kind};
  const M0 = figMesh(look), sk = figSkelOf(M0.sex), X = glbLoad('folk2').ex, P = figPoses(sk)[pose], L = Object.assign({}, P.local);
  if (grips){ figGrip(X, M0.sex, grips[0], L, 'R'); figGrip(X, M0.sex, grips[1], L, 'L'); }
  const M = figPose(sk, L, P.root, {ground:true}).M, maxV = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), nb = pal || figPalette(maxV, 16), D = figDraws(M0, nb);
  const W = 256, n = M0.cnt, H = Math.ceil(n / W); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
  let vs = figGL(nb) + 'attribute vec3 aP;attribute float aI;uniform vec3 uAx;uniform vec2 uWH;varying vec2 vV;void main(){float v=(dot(figP(aP),uAx)+1.0)/4.0*65535.0;float hi=floor(v/256.0);vV=vec2(hi,floor(v-hi*256.0+0.5))/255.0;' +
    'float x=mod(aI,uWH.x),y=floor(aI/uWH.x);gl_Position=vec4((x+0.5)/uWH.x*2.0-1.0,(y+0.5)/uWH.y*2.0-1.0,0.0,1.0);gl_PointSize=1.0;}';
  let fs = 'precision mediump float;varying vec2 vV;void main(){gl_FragColor=vec4(vV,0.0,1.0);}';
  if (kind === 'webgl2'){ vs = '#version 300 es\\n' + vs.replace(/\\battribute\\b/g, 'in').replace(/\\bvarying\\b/g, 'out'); fs = '#version 300 es\\nprecision mediump float;out vec4 oC;in vec2 vV;void main(){oC=vec4(vV,0.0,1.0);}'; }
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); ['aP', 'aJ', 'aW', 'aI'].forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return {link:gl.getProgramInfoLog(p), maxV, nb};
  gl.useProgram(p); gl.uniform2f(gl.getUniformLocation(p, 'uWH'), W, H); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  const at = (i, a, k, type, norm) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, k, type, norm, 0, 0); };
  const got = new Float64Array(n * 3), cpu = new Float32Array(n * 3); let base = 0;
  const bases = D.map(d => { const b = base; base += d.cnt; return b; });
  for (let ax = 0; ax < 3; ax++){
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform3f(gl.getUniformLocation(p, 'uAx'), ax === 0 ? 1 : 0, ax === 1 ? 1 : 0, ax === 2 ? 1 : 0);
    D.forEach((d, q) => { const I = new Float32Array(d.cnt); for (let i = 0; i < d.cnt; i++) I[i] = bases[q] + i;
      gl.uniform4fv(gl.getUniformLocation(p, 'uB'), figPal(M, d.bones)); at(0, d.p, 3, gl.FLOAT, false); at(1, d.j, 4, gl.UNSIGNED_BYTE, false); at(2, d.w, 4, gl.UNSIGNED_BYTE, true); at(3, I, 1, gl.FLOAT, false); gl.drawArrays(gl.POINTS, 0, d.cnt); });
    const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    for (let i = 0; i < n; i++) got[i * 3 + ax] = (px[i * 4] * 256 + px[i * 4 + 1]) / 65535 * 4 - 1;
  }
  D.forEach((d, q) => cpu.set(figSkin(d.p, null, d.j, d.w, figPal(M, d.bones)).p, bases[q] * 3));
  let worst = 0, sum = 0, moved = 0; for (let i = 0; i < n; i++){ const e = Math.hypot(got[i * 3] - cpu[i * 3], got[i * 3 + 1] - cpu[i * 3 + 1], got[i * 3 + 2] - cpu[i * 3 + 2]); worst = Math.max(worst, e); sum += e; }
  // (and how far the pose moved the corners from the rest pose, so a shader that bent nothing would not pass)
  D.forEach((d, q) => { for (let i = 0; i < d.cnt; i++) moved = Math.max(moved, Math.hypot(cpu[(bases[q] + i) * 3] - d.p[i * 3], cpu[(bases[q] + i) * 3 + 1] - d.p[i * 3 + 1], cpu[(bases[q] + i) * 3 + 2] - d.p[i * 3 + 2])); });
  const err = gl.getError(), ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
  return {kind, n, draws:D.length, nb, maxV, worst_mm:+(worst * 1000).toFixed(3), mean_mm:+(sum / n * 1000).toFixed(4), moved_m:+moved.toFixed(3), err};
}"""


async def main():
    os.makedirs(PICS, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1280, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'garderobe' in m.text else None)
        await boot(pg, GAME + ',folk2'); await pg.wait_for_function("glbHas('folk2') && glbHas('worker')", timeout=120000)
        # 1. the game reads the file: the skeleton, the two skins, the parts by the old names
        a = await pg.evaluate("""(() => { const G = glbLoad('folk2'), W = glbLoad('worker'), miss = Object.keys(W.parts).filter(n => !(n in G.parts));
          return {flag:FOLK2, bones:G.sk && G.sk.bones.length, skins:G.sk && G.sk.skins.map(s => s.name), parts:Object.keys(G.ex.parts).length, miss, el:!!document.getElementById('glb-folk2'), format:G.ex.format.slice(0, 7)}; })()""")
        check(a['flag'] and a['bones'] == 58 and a['skins'] == ['folk_m', 'folk_f'] and a['parts'] == 84 and not a['miss'] and a['el'], 'the game reads folk2.b64: 58 bones, two skins, 84 parts, every part of worker.b64 by its name', a)
        # 2. every look of looktest builds a figure of the new body, nothing missing, the hair's hat version under a hat
        b = await pg.evaluate("""(() => { let n = 0, bad = [], lo = 1e9, hi = 0; for (const sx of ['m', 'f']) for (const h of LOOK_HAT) for (const hs of LOOK_HAIR) for (const tp of LOOK_TOP){
            const sh = LOOK_SHOE[n % LOOK_SHOE.length][0], bd = sx === 'm' ? LOOK_BEARD[n % LOOK_BEARD.length][0] : 'none';
            for (const v of [0, 1]) for (const bare of [false, true]){ const l = Object.assign(lookDefault(), {b:sx, ht:h[0], hs:hs[0], tp:tp[0], bd, sh}); if (v) l.v = 1; const M = figMesh(l, {bare}); n++;
              if (!M || M.miss.length || !(M.cnt > 12000)) bad.push([sx, h[0], hs[0], tp[0], v, bare, M && M.miss, M && M.cnt]); else { lo = Math.min(lo, M.cnt / 3); hi = Math.max(hi, M.cnt / 3); }
              if (M && !!v !== M.parts.some(q => /^vest/.test(q[0]))) bad.push(['vest', sx, tp[0], v]);
              if (M && M.parts.some(q => /^body/.test(q[0])) && M.parts.filter(q => /^body/.test(q[0])).reduce((s, q) => s + q[2], 0) > 9000) bad.push(['skin under clothes', sx]); } }
          return {n, bad:bad.slice(0, 5), lo, hi}; })()""")
        check(b['n'] == 2 * 8 * 10 * 5 * 4 and not b['bad'], 'every combination of body, hat, hairstyle and jacket (beards and shoes in turn), with and without the vest and the gloves, builds a new figure with no part missing', b)
        # 3. the paint: the zones take the look's colours on the new parts; the eyes (zone 0) keep theirs
        c = await pg.evaluate("""(() => { const l = Object.assign(lookDefault(), {s:5, hc:7, ht:'beanie', hk:4, sc:15, tk:2, lg:9, hs:'long', bd:'full'}), K = lookKit(l), G = glbLoad('folk2');
          const col = (n, z) => { const o = G.parts[n], q = figPart(n, l, 'm'); for (let i = 0; i < o.zone.length; i++) if (o.zone[i] === z && o.ao[i] > 0.3) return [q.c[i * 4] / o.ao[i], q.c[i * 4 + 1] / o.ao[i], q.c[i * 4 + 2] / o.ao[i]]; return null; };
          const eq = (a, b) => a && b && Math.abs(a[0] - b[0]) < 0.02 && Math.abs(a[1] - b[1]) < 0.02 && Math.abs(a[2] - b[2]) < 0.02;
          const o = G.parts.body, q = figPart('body', l, 'm'); let eyes = 0, same = 0; for (let i = 0; i < o.zone.length; i++) if (o.zone[i] === 0){ eyes++; if (q.c[i * 4] === o.c[i * 4] && q.c[i * 4 + 2] === o.c[i * 4 + 2]) same++; }
          return {skin:eq(col('body', 4), LOOK_SKIN[5]), brows:eq(col('body', 5), LOOK_HAIR_C[7]), hair:eq(col(K.hairP, 5), LOOK_HAIR_C[7]), beard:eq(col('b_full', 5), LOOK_HAIR_C[7]), hat:eq(col('beanie', 6), LOOK_COL[4]), shoe:eq(col('boot', 7), LOOK_COL[15]),
            top:eq(col('sweater', 1), LOOK_COL[2]), sleeve:eq(col('uarm', 1), LOOK_COL[2]), legs:eq(col('thigh', 3), LOOK_COL[9]), eyes, same}; })()""")
        check(all(c[k] for k in ('skin', 'brows', 'hair', 'beard', 'hat', 'shoe', 'top', 'sleeve', 'legs')) and c['eyes'] > 0 and c['eyes'] == c['same'], 'the zones take the look on the new parts (skin, eyebrows, hair, beard, hat, shoes, jacket, sleeves, trousers); the eyes keep their own colour', c)
        # 4. the shader against the processor, on both contexts, with all the bones and with the small palette
        look_f = {'b': 'f', 's': 2, 'hs': 'pony', 'hc': 4, 'bd': 'none', 'ht': 'bobble', 'hk': 4, 'tp': 'parka', 'tk': 4, 'lg': 0, 'sh': 'sneaker', 'sc': 10}
        look_m = {'b': 'm', 's': 2, 'hs': 'short', 'hc': 2, 'bd': 'short', 'ht': 'beanie', 'hk': 4, 'tp': 'oilskin', 'tk': 2, 'lg': 2, 'sh': 'boot', 'sc': 9, 'v': 1}
        res = {}
        for kind in ('webgl2', 'webgl'):
            for look, pose, grips, pal in ((look_m, 'stå', None, 0), (look_f, 'dyp knebøy', ['grip', 'grip'], 0), (look_m, 'vridd', ['pinch', 'hook'], 0), (look_f, 'dyp knebøy', ['grip', 'grip'], 37), (look_m, 'armene opp', ['grip', 'pinch'], 20)):
                r = await pg.evaluate(PROBE, [kind, look, pose, grips, pal]); res[(kind, pose, pal)] = r
                check(r.get('worst_mm') is not None and r['worst_mm'] < 1.0 and r['moved_m'] > 0.02 and r['err'] == 0 and (r['draws'] > 1) == (r['nb'] < 58), '%s, %s%s, %s: every corner the shader bends is within 1 mm of the processor\'s' % (kind, pose, ' with grips' if grips else '', ('a palette of %d bones' % pal) if pal else 'the device\'s palette'), r)
        w2 = [res[k]['worst_mm'] for k in res if k[0] == 'webgl2']; w1 = [res[k]['worst_mm'] for k in res if k[0] == 'webgl']
        print('skinning, largest difference shader to processor (mm): WebGL 2 %s, WebGL 1 %s; vertex uniform vectors here: %s and %s' % (w2, w1, res[('webgl2', 'stå', 0)].get('maxV'), res[('webgl', 'stå', 0)].get('maxV')))
        # 5. the wardrobe: both figures in view, portrait and landscape, three poses, with and without gloves
        for W, H, tag in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
            await pg.set_viewport_size({'width': W, 'height': H}); await pg.wait_for_timeout(300)
            await pg.evaluate("(() => { S.look = lookDefault(); WARD.open(); })()"); await pg.wait_for_timeout(600)
            f = await pg.evaluate("(() => { const q = WARD.folk2(), r = document.querySelector('.wd-cv').getBoundingClientRect(); return Object.assign({cv:[Math.round(r.width), Math.round(r.height)], btn:[...document.querySelectorAll('.wd-vb button')].map(b => [b.dataset.wd, Math.round(b.getBoundingClientRect().width), Math.round(b.getBoundingClientRect().height), Math.round(b.getBoundingClientRect().left), Math.round(b.getBoundingClientRect().right)]), overflowX:document.documentElement.scrollWidth > innerWidth, info:document.querySelector('.wd-n2i').textContent}, q); })()")
            inview = all(x[3] >= 0 and x[4] <= W and x[1] >= 44 and x[2] >= 44 for x in f['btn'])
            check(f['prog'] and f['draws'] >= 1 and f['tris'] > 5000 and f['tris'] < 7400 and [x[0] for x in f['btn']] == ['turn', 'zoom', 'turn', 'pose2', 'bare2'] and inview and not f['overflowX'], tag + ': the wardrobe has the new figure, its two buttons in view and big enough for a finger', f)
            for pose, name in (('stå', 'staa'), ('hvile', 'hvile'), ('grep', 'grep')):
                await pg.evaluate("WARD.setFolk2(%s, 0)" % json.dumps(pose)); await pg.wait_for_timeout(400)
                px = await pg.evaluate("""(() => { const cv = document.querySelector('.wd-cv'), g = cv.getContext('webgl'), w = cv.width, h = cv.height, a = new Uint8Array(4 * w * h); g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, a);
                  let l = 0, r = 0, hash = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const i = (y * w + x) * 4; if (a[i + 3] > 0){ if (x < w / 2) l++; else { r++; hash = (hash * 31 + a[i] + x * 7 + y * 13) >>> 0; } } } return {l, r, of:w * h, hash, ms:WARD.folk2().ms}; })()""")
                res[(tag, pose)] = px
                check(px['l'] > 2000 and px['r'] > 2000, '%s, %s: today\'s figure is drawn to the left and the new one to the right' % (tag, pose), px)
                await pg.screenshot(path=os.path.join(PICS, 'garderobe_%s_%s.png' % (tag, name)))
            hs = {res[(tag, q)]['hash'] for q in ('stå', 'hvile', 'grep')}
            check(len(hs) == 3, tag + ': the three poses are three different pictures of the new figure', sorted(hs))
            # without gloves, and the face; a woman in other clothes
            await pg.evaluate("WARD.setFolk2('grep', 1)"); await pg.wait_for_timeout(400); await pg.screenshot(path=os.path.join(PICS, 'garderobe_%s_grep_uten_hansker.png' % tag))
            g = await pg.evaluate("WARD.folk2()"); check(g['bare'] == 1 and g['tris'] != f['tris'], tag + ': without gloves the hands of the skin are drawn instead', g)
            await pg.evaluate("(() => { WARD.setFolk2('stå', 0); document.querySelector('.wd-vb button[data-wd=zoom]').click(); })()"); await pg.wait_for_timeout(400); await pg.screenshot(path=os.path.join(PICS, 'garderobe_%s_ansikt.png' % tag))
            await pg.evaluate("document.querySelector('.wd-vb button[data-wd=zoom]').click()")
            await pg.evaluate("WARD.setLook(%s)" % json.dumps(look_f)); await pg.wait_for_timeout(500)
            h = await pg.evaluate("WARD.folk2()"); check(h['sex'] == 'f' and h['tris'] > 5000, tag + ': a woman\'s look gives the woman\'s body', h)
            await pg.screenshot(path=os.path.join(PICS, 'garderobe_%s_kvinne.png' % tag))
            await pg.evaluate("WARD.setFolk2('grep', 0)"); await pg.wait_for_timeout(400); await pg.screenshot(path=os.path.join(PICS, 'garderobe_%s_kvinne_grep.png' % tag))
            # the pose button itself steps on
            await pg.evaluate("WARD.setFolk2('stå', 0)"); await pg.click('.wd-vb button[data-wd=pose2]'); await pg.wait_for_timeout(200)
            i = await pg.evaluate("WARD.folk2().pose"); check(i == 'hvile', tag + ': the pose button steps to the next pose', i)
            await pg.evaluate("WARD.close()")
        print('the new figure\'s draw in the wardrobe here (SwiftShader, not a tablet), ms:', {('%s %s' % k): round(v['ms'], 1) for k, v in res.items() if isinstance(k[1], str) and 'ms' in v})
        # 6. the small palette in the wardrobe itself (#folk2pal=37: what a device with 128 vertex uniform vectors gets): more draw calls, the same picture
        pics = {}
        for pal in (0, 37):
            c2 = await br.new_context(viewport={'width': 1280, 'height': 800}); pg2 = await c2.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))          # (a context of its own: a new game, so the start screen)
            await boot(pg2, GAME + ',folk2' + (',folk2pal=%d' % pal if pal else '')); await pg2.wait_for_function("glbHas('folk2') && glbHas('worker')", timeout=120000)
            await pg2.evaluate("(() => { S.look = lookDefault(); WARD.open(); })()"); await pg2.wait_for_timeout(600); await pg2.evaluate("WARD.setFolk2('grep', 0)"); await pg2.wait_for_timeout(500)
            pics[pal] = await pg2.evaluate("""(() => { const cv = document.querySelector('.wd-cv'), g = cv.getContext('webgl'), w = cv.width, h = cv.height, a = new Uint8Array(4 * w * h); g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, a); return {q:WARD.folk2(), px:Array.from(a.filter((v, i) => i % 97 === 0))}; })()""")
            await c2.close()
        diff = sum(1 for x, y in zip(pics[0]['px'], pics[37]['px']) if abs(x - y) > 2)
        check(pics[0]['q']['draws'] == 1 and pics[37]['q']['draws'] > 1 and pics[37]['q']['pal'] == 37 and diff <= len(pics[0]['px']) * 0.001, 'a palette of 37 bones draws the figure in more calls and the same picture', {'draws': [pics[0]['q']['draws'], pics[37]['q']['draws']], 'differ': diff, 'of': len(pics[0]['px'])})
        # 7. without #folk2 nothing of it is there: the wardrobe as before
        c3 = await br.new_context(viewport={'width': 1280, 'height': 800}); pg3 = await c3.new_page(); pg3.on('pageerror', lambda e: errs.append(str(e))); await boot(pg3); await pg3.wait_for_function("glbHas('worker')", timeout=120000)
        await pg3.evaluate("(() => { S.look = lookDefault(); WARD.open(); })()"); await pg3.wait_for_timeout(600)
        z = await pg3.evaluate("({flag:FOLK2, q:WARD.folk2(), btn:[...document.querySelectorAll('.wd-vb button')].map(b => b.dataset.wd), lab:!!document.querySelector('.wd-n2')})")
        check(z['flag'] is False and z['q'] is None and z['btn'] == ['turn', 'zoom', 'turn'] and not z['lab'], 'without #folk2 the wardrobe is as before: one figure, three buttons', z)
        await pg3.screenshot(path=os.path.join(PICS, 'garderobe_liggende_uten_merket.png'))
        print('page errors:', errs)
        await br.close()

asyncio.run(main())
