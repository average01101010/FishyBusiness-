  // ---------- setup ----------
  // What stopped the 3D view, shown with the message so a device it fails on tells why (the user's phone 04.10.2026: «3D-visning
  // støttes ikke» with no more to go on): the step and the error, or the shader's log
  let failWhy = '', stage = '', GPU = '', glWatch = false, GL2 = false;
  // WebGL 2 or 1 (GL2); a device where the start on WebGL 2 failed is kept on WebGL 1 (dsb_gl1) for this version of the way it is set up
  const GL1_KEY = 'dsb_gl1', GL1_VER = 'a';
  // How heavy a sea this device has managed, kept on the device (dsb_sea): 0 the full sea, 1 the far pass's simpler sea for both passes
  // (no sea-state texture in the vertex shader, four wind waves, no ripples), 2 the flat basic sea. On a PC the shaders are compiled by
  // Direct3D's compiler when they are linked, and the full sea can take it so long that the browser restarts the GPU and the page loses
  // its context (Intel Iris Xe, Chrome on Windows, 05.10.2026: «sjø link: ingen logg», then every later try failed and «WebGL-konteksten
  // ble mistet»). A context lost while the shaders are made sets the next level for the next try (the restored context, or a reload);
  // Intel on Direct3D starts at 1. #sealvl=N in the address forces one (the tests).
  // Every Direct3D 11 so far has lost it on the full sea, whatever the maker (Intel Iris Xe in Chrome, NVIDIA GTX 980 in Firefox,
  // 05.10.2026), so Direct3D starts at 1. And as the driver may take the whole GPU process with it before the browser says the context
  // is lost (Firefox: every compile after it fails with no log, isContextLost still false), the level being tried is written down first
  // (SEA_TRY) and cleared when it has worked: a try that never came back puts the next load a level down.
  // (05.11.2026, Jonas: the wake was gone on his Adreno 642L. Every tab of the site shares these marks, and a page that started while
  // another tab was making its shaders took that one's mark for a crash: the sea stepped down for good, 04.11 to the middle sea and 05.11
  // to the old level 1, with no wake, foam or short waves.) A mark now says whose it is and when (SEAID, the time): one under SEA_FRESH
  // old from another page is waited for (seaMarksSettle; gone, it was a start beside this one), and a try that never came back steps
  // down only the second time in a row (SEA_GONE, SEA_MIDGONE; cleared when the sea comes through). A context lost while the shaders
  // are made is seen, and still steps down at once.
  const SEA_KEY = 'dsb_sea', SEA_TRY = 'dsb_sea_try'; let seaLvl = 0, seaBumped = false;
  const SEAID = Math.random().toString(36).slice(2, 10), SEA_GONE = 'dsb_sea_gone', SEA_MIDGONE = 'dsb_sea_midgone', SEA_FRESH = 15000;
  // a mark: 'level:page:time' (the old ones, a bare level, read as from no page and long ago)
  const markRead = k => { let t = null; try { t = localStorage.getItem(k); } catch (e){} if (t === null) return null; const p = t.split(':');
    return p.length >= 3 ? {lvl:+p[0] || 0, id:p[1], at:+p[2] || 0} : {lvl:+t || 0, id:'', at:0}; };
  const markOther = k => { const m = markRead(k); return m && m.id !== SEAID && Math.abs(Date.now() - m.at) < SEA_FRESH ? m : null; };
  let SEAWAIT = false;   // (G3._debug.seaWait, for the test)
  async function seaMarksSettle(){ const t0 = Date.now(); while ((markOther(SEA_TRY) || markOther(SEA_MIDTRY)) && Date.now() - t0 < SEA_FRESH + 2000){ SEAWAIT = true; await new Promise(r => setTimeout(r, 250)); } SEAWAIT = false; }
  // The full sea once more (steg 58, Jonas 07.11.2026: «A», prøv full sjø igjen én gang, den nye målingen avgjør): a device on level 1
  // (dsb_sea) not on Direct3D, put there by the false crashes before 05.11.2026 (Jonas' Adreno 642L 04.11), starts once on the full sea
  // again (SEA_RE), with the fresh marks of other pages waited out first (seaMarksSettle). Only the full sea's two programs are tried
  // (with and without the sea-state texture in the vertex shader), not the far ones: those are below the middle sea. If it links and
  // the context lives, the device stays on level 0 ('r1:ok'); if it does not link, the same start goes on with level 1 as before, and a
  // try that never came back, or a context lost on it, leaves it on level 1 ('r1:no'). The mark is written before the try ('r1:try',
  // with whose and when), so it is one try per device; and every step from 0 to 1 from now on writes 'r1:no', so a device that has
  // failed on the full sea since then never gets one. (No step from 0 to 1 is in the error log 05.11–09.11.2026.)
  const SEA_RE = 'dsb_sea_re', SEA_RE_VER = 'r1'; let seaRe = false;
  const seaReGet = () => { try { const v = localStorage.getItem(SEA_RE) || ''; return v.startsWith(SEA_RE_VER + ':') ? v.slice(SEA_RE_VER.length + 1) : ''; } catch (e){ return 'no'; } };
  const seaReSet = st => { try { localStorage.setItem(SEA_RE, SEA_RE_VER + ':' + st); } catch (e){} };
  const goneGet = k => { try { return +localStorage.getItem(k) || 0; } catch (e){ return 0; } };
  const goneSet = (k, n) => { try { if (n) localStorage.setItem(k, String(n)); else localStorage.removeItem(k); } catch (e){} };
  const seaLvlGet = () => { const m = /sealvl=(\d)/.exec(location.hash); if (m) return Math.min(2, +m[1]); if (/seamid/.test(location.hash)) return 1; let v = 0;
    try { v = +localStorage.getItem(SEA_KEY) || 0; } catch (e){}
    const t = markRead(SEA_TRY);
    if (t && t.lvl + 1 > v){ const n = goneGet(SEA_GONE) + 1;
      if (n >= 2){ v = Math.min(2, t.lvl + 1); seaBumped = true; goneSet(SEA_GONE, 0); try { localStorage.setItem(SEA_KEY, String(v)); } catch (e){} if (t.lvl === 0) seaReSet('no'); }
      else { goneSet(SEA_GONE, n); if (typeof cloudErr === 'function') cloudErr('3D sjønivå ' + t.lvl + ': et forsøk kom ikke tilbake (1 av 2), prøves igjen · ' + GPU, 'view3d init', ''); } }
    const re = seaReGet();
    if (re.startsWith('try')){ const p = re.split(':');   // the try of the full sea once more: another page's right now, or one that never came back
      if (!(p[1] !== SEAID && Math.abs(Date.now() - (+p[2] || 0)) < SEA_FRESH)){ seaReSet('no');
        if (typeof cloudErr === 'function') cloudErr('3D full sjø på nytt: forsøket kom ikke tilbake, blir på sjønivå 1 · ' + GPU, 'view3d init', ''); } }
    else if (v === 1 && !re && !/Direct3D/i.test(GPU)){ seaRe = true; return 0; }
    return Math.min(2, /Direct3D/i.test(GPU) ? Math.max(v, 1) : v); };
  // the sea program that linked on this device when the full one did not, for this version of the sea's shaders (SEA_VER: change it
  // when they change, so every device tries the full sea again); #sealite in the address forces the lite one (the tests)
  const SEA_OK = 'dsb_sea_ok', SEA_VER = 'u2';
  const seaOkGet = () => { if (/sealite/.test(location.hash)) return 'true,true,true'; if (/sealvl=/.test(location.hash)) return null;
    try { const v = localStorage.getItem(SEA_OK) || ''; return v.startsWith(SEA_VER + ':') ? v.slice(SEA_VER.length + 1) : null; } catch (e){ return null; } };
  const seaOkSet = v => { if (/sealvl=|sealite/.test(location.hash)) return; try { if (v) localStorage.setItem(SEA_OK, SEA_VER + ':' + v); else localStorage.removeItem(SEA_OK); } catch (e){} };
  const seaTryMark = on => { if (/sealvl=/.test(location.hash)) return; try { if (on) localStorage.setItem(SEA_TRY, seaLvl + ':' + SEAID + ':' + Date.now()); else localStorage.removeItem(SEA_TRY); } catch (e){} };
  // The middle sea on level 1 (tilbakemelding #106, 01.11.2026: Firefox on a GTX 980, «Havet vises ikke»; Jonas: «Det er viktig at
  // spillet oppleves så likt som mulig uansett hvilken enhet eller nettleser»): level 1 drew the near sea with the far pass's shader, with
  // no short waves, ripples, wake, foam or lanterns on the water, and every Direct3D starts there. It now first tries the lite vertex
  // shader (the four longest wind waves and the swell, the part a driver choked on: Adreno 642L 05.10.2026, «VS alene feil, FS alene
  // ok») with the full fragment shader, and the far pass on the lite vertex shader too. A device that loses its context on it, or its GPU
  // process twice in a row (SEA_MIDTRY left behind), is marked (SEA_MID) and starts on the old level 1 next time, without a level bump.
  // The marks from before 05.11.2026 ('u2:no', some of them a second tab's start taken for a crash) give way to one more try; the new
  // mark is 'u2:no2'. #seamid in the address forces it, #sealvl= and #nomid leave it out (the tests of the old levels).
  const SEA_MID = 'dsb_sea_mid', SEA_MIDTRY = 'dsb_sea_midtry'; let seaMidTry = false;
  const seaMidOn = () => { if (/seamid/.test(location.hash)) return true; if (/sealvl=|nomid/.test(location.hash)) return false;
    try { return localStorage.getItem(SEA_MID) !== SEA_VER + ':no2'; } catch (e){ return true; } };
  const seaMidFailed = why => { seaMidTry = false; if (/seamid/.test(location.hash)) return;
    try { localStorage.setItem(SEA_MID, SEA_VER + ':no2'); localStorage.removeItem(SEA_MIDTRY); } catch (e){} goneSet(SEA_MIDGONE, 0);
    if (typeof cloudErr === 'function') cloudErr('3D mellomsjø feilet (' + why + '), neste start på sjønivå 1 · ' + GPU, 'view3d init', ''); };
  const seaMidMark = on => { seaMidTry = on; if (/seamid/.test(location.hash)) return; try { if (on) localStorage.setItem(SEA_MIDTRY, '1:' + SEAID + ':' + Date.now()); else localStorage.removeItem(SEA_MIDTRY); } catch (e){} };
  // a try of the middle sea that never came back: the second in a row marks it, the first is tried again; the level is not bumped for it
  const seaMidLeft = () => { if (!markRead(SEA_MIDTRY)) return;
    try { localStorage.removeItem(SEA_TRY); localStorage.removeItem(SEA_MIDTRY); } catch (e){}
    const n = goneGet(SEA_MIDGONE) + 1;
    if (n >= 2) seaMidFailed('forsøket kom ikke tilbake to ganger på rad');
    else { goneSet(SEA_MIDGONE, n); if (typeof cloudErr === 'function') cloudErr('3D mellomsjø: et forsøk kom ikke tilbake (1 av 2), prøves igjen · ' + GPU, 'view3d init', ''); } };
  // after a compile or link that failed with no word why: a moment for the browser to notice a lost context, before trying the next
  const glSettle = async () => { await new Promise(r => setTimeout(r, 80)); if (gl.isContextLost()) throw new Error('konteksten er mistet'); };
  const opt = (nm, f) => { try { f(); } catch (e){ console.error(nm, e); } };    // a part the view can do without
  async function init(){
    if (ready) return true; if (failed) return false;
    try {
      stage = 'webgl';
      // the settings the view wants, then plainer ones: some PCs (Adrian, 04.10.2026) give no context with antialiasing or the
      // high-performance GPU asked for, and do with neither
      // WebGL 2 first (docs/planer/grafikk-batmodeller.md F1, valg 1 A, 30.10.2026), WebGL 1 where there is none, where #gl1 is in the
      // address, or where a start on WebGL 2 failed before on this device (GL1_KEY, set below): the same shaders and the same picture
      const ctxTry = o => { try { return (want2 && canvas.getContext('webgl2', o)) || canvas.getContext('webgl', o) || canvas.getContext('experimental-webgl', o); } catch (e){ return null; } };
      let want2 = !/gl1/.test(location.hash) && typeof WebGL2RenderingContext !== 'undefined'; try { if (!/gl2/.test(location.hash) && localStorage.getItem(GL1_KEY) === GL1_VER) want2 = false; } catch (e){}
      gl = ctxTry({antialias:true, alpha:false, powerPreference:'high-performance'}) || ctxTry({antialias:false, alpha:false}) || ctxTry({alpha:false, failIfMajorPerformanceCaveat:false}) || ctxTry(undefined);
      GL2 = !!gl && typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      // WebGL 1's extensions that WebGL 2 has in its core: asked for by name as before (the trees, the near field, the turbines, the
      // 32-bit indices, the derivatives), they answer with the core functions
      if (GL2 && !gl.__x2){ gl.__x2 = true; const ge = gl.getExtension.bind(gl);
        const core = {OES_standard_derivatives:{}, OES_element_index_uint:{}, ANGLE_instanced_arrays:{VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:0x88FE, vertexAttribDivisorANGLE:(i, d) => gl.vertexAttribDivisor(i, d),
          drawArraysInstancedANGLE:(m, f, c, n) => gl.drawArraysInstanced(m, f, c, n), drawElementsInstancedANGLE:(m, c, t, o, n) => gl.drawElementsInstanced(m, c, t, o, n)}};
        gl.getExtension = nm => core[nm] || ge(nm); }
      // none at all: the browser has 3D off for the page, most often after the driver gave up here once (Chrome keeps it off until it is
      // closed and opened again), or for the machine
      if (!gl) throw new Error(S.lang === 'en' ? 'no WebGL context (the browser has turned 3D off, often after a driver error: close the browser fully and open it again)' : 'ingen WebGL-kontekst (nettleseren har slått av 3D, ofte etter en driverfeil: lukk nettleseren helt og åpne den igjen)');
      { const dbg = gl.getExtension('WEBGL_debug_renderer_info'); GPU = String((dbg && gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '').slice(0, 80); }
      // what lives on the GPU and whether the page was out of sight, for the log when the context is lost in play (#171, a phone that
      // loses it 11-17 minutes in): the buffers and textures made and not deleted, counted where the view makes them (rare calls only)
      if (!gl.__n){ gl.__n = true; GLN.b = 0; GLN.t = 0; GLN.t0 = performance.now();
        const cb = gl.createBuffer.bind(gl), db = gl.deleteBuffer.bind(gl), ct = gl.createTexture.bind(gl), dtx = gl.deleteTexture.bind(gl);
        gl.createBuffer = () => { GLN.b++; return cb(); }; gl.deleteBuffer = x => { if (x) GLN.b--; return db(x); };
        gl.createTexture = () => { GLN.t++; return ct(); }; gl.deleteTexture = x => { if (x) GLN.t--; return dtx(x); };
        document.addEventListener('visibilitychange', () => { if (document.hidden) GLN.hid = Date.now(); else GLN.vis = Date.now(); }); }
      if (!glWatch){
        // a lost context: the view stops; lost before it was ready (a phone short of memory, or a GPU process that restarted), it
        // starts again when the browser gives the context back
        glWatch = true; let wasReady = false;
        canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); wasReady = ready; ready = false; failed = true; show(false);
          // (on the middle sea the level stays: the next start leaves the middle sea out)
          if (!wasReady && stage === 'shadere' && seaMidTry){ seaMidFailed('konteksten mistet');
            failWhy = S.lang === 'en' ? 'the graphics driver gave up while starting. Reload the page and the game tries a simpler sea' : 'grafikkdriveren ga opp under oppstarten. Last siden på nytt, så prøver spillet en enklere sjø'; }
          else if (!wasReady && stage === 'shadere' && seaLvl < 2){ try { localStorage.setItem(SEA_KEY, String(seaLvl + 1)); } catch (e2){} if (seaLvl === 0) seaReSet('no');
            failWhy = S.lang === 'en' ? 'the graphics driver gave up while starting. Reload the page and the game tries a simpler sea' : 'grafikkdriveren ga opp under oppstarten. Last siden på nytt, så prøver spillet en enklere sjø';
            if (typeof cloudErr === 'function') cloudErr('3D konteksten mistet i shaderne, sjønivå ' + seaLvl + ' → ' + (seaLvl + 1) + ' · ' + GPU, 'view3d init', ''); }
          else { failWhy = 'WebGL-konteksten ble mistet'; if (wasReady) qmDown('kontekst'); qmAlive(false); if (wasReady && typeof cloudErr === 'function') cloudErr('3D konteksten mistet under spill · ' + GPU + ' · ' + glDiag(), 'view3d', ''); } });
        // lost in play, every buffer, texture and program is gone with it: the game saves and loads the page again, which builds them
        // anew, at most once in ten minutes (sessionStorage), so a driver that keeps failing does not reload the page over and over
        canvas.addEventListener('webglcontextrestored', () => { if (!wasReady){ failed = false; failWhy = ''; show(true); return; }
          let last = 0; try { last = +sessionStorage.getItem('dsb_gl_reload') || 0; } catch (e){}
          if (Date.now() - last > 600000){ try { sessionStorage.setItem('dsb_gl_reload', String(Date.now())); } catch (e){}
            toast(S.lang === 'en' ? 'The 3D view was lost. The game is saved and loads again …' : '3D-visningen ble borte. Spillet lagres og lastes på nytt …');
            if (typeof save === 'function') save(); setTimeout(() => location.reload(), 1500); return; }
          toast(S.lang === 'en' ? 'The 3D view was lost. Reload the page to get it back.' : '3D-visningen ble borte. Last siden på nytt for å få den tilbake.'); });
      }
      if (gl.isContextLost()){ stage = 'webgl'; throw new Error('konteksten er mistet (venter på at nettleseren gir den tilbake)'); }
      if (!gl.getExtension('OES_standard_derivatives')) throw new Error('mangler OES_standard_derivatives');
      UINT = !!gl.getExtension('OES_element_index_uint'); qualSet();   // 32-bit indices: the ultra level's big meshes
      stage = 'shadere';
      PL = program(LIT_VS, LIT_FS, ['aPos', 'aCol'], 'lit'); PT = program(TER_VS, terFS(0), ['aPos', 'aCol', 'aNor', 'aShd', 'aMat', 'aCov'], 'terreng'); PTS = [PT, null, null]; PRGN = program(LITN_VS, LITN_FS, ['aPos', 'aNor', 'aCol'], 'modell'); PRGX = program(TEX_VS, TEX_FS, ['aPos', 'aUV'], 'tekstur'); PRGW = program(WK_VS, WK_FS, ['aPos', 'aW', 'aS'], 'kjølvann');
      WKB = {p:new Float32Array(9000 * 3), w:new Float32Array(9000 * 4), s:new Float32Array(9000), pb:buf(new Float32Array(9000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), wb:buf(new Float32Array(9000 * 4), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), sb:buf(new Float32Array(9000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW)}; // the waves read the sea-state texture in the vertex shader where the GPU can (#novtf in the address tries without)
      SST_VS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 2 && !/novtf/.test(location.hash); SHT_VS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 3;   // (the shoal texture, F4: a third unit, else NOSHT and the sea state keeps its two)
      // The sea is the heaviest program, and a phone's driver may refuse to link it with no word why (Adreno 642L, 05.10.2026: «sjø link:
      // ingen logg fra driveren»): then it tries without the texture in the vertex shader, then with the far pass's simpler waves, and
      // tells the cloud which one it took
      await seaMarksSettle(); seaMidLeft(); seaLvl = seaLvlGet(); seaTryMark(true);
      if (seaBumped && typeof cloudErr === 'function') cloudErr('3D sjønivå ' + seaLvl + ' etter et forsøk som ikke kom tilbake · ' + GPU, 'view3d init', '');
      const seaWhy = []; PS = null;
      // the full sea once more (SEA_RE above): its own two programs; not linked, this start goes on with level 1
      if (seaRe){ seaReSet('try:' + SEAID + ':' + Date.now()); const why = [];
        for (const nosst of [...new Set([!SST_VS, true])]){
          try { PS = program((nosst ? '#define NOSST\n' : SHT_VS ? '' : '#define NOSHT\n') + SEA_VS, SEAF(SEA_FS), ['aXZ'], 'sjø'); SST_VS = !nosst; PS.far = false; PS.lite = false;   // (NOSHT: F4's shoal texture needs a third unit)
            seaOkSet(why.length ? [nosst, false, false].join() : null); seaWhy.push(...why); break; }
          catch (e){ if (gl.isContextLost()) throw e; why.push(e.message); if (/ingen logg/.test(e.message)) await glSettle(); } }
        if (!PS){ seaRe = false; seaReSet('no'); seaLvl = 1; seaTryMark(true);
          if (typeof cloudErr === 'function') cloudErr('3D full sjø på nytt lenket ikke, blir på sjønivå 1 · ' + GPU, 'view3d init', why.join('\n')); } }
      // [no texture in the vertex shader, the far pass's waves, the lite vertex shader]; the one that worked on this device last time with
      // these shaders (SEA_OK) is where it starts, so a phone does not link the ones its driver refused at every start
      let seaTry = (PS || seaLvl >= 2 ? [] : seaLvl === 1 ? [[true, true, false], [true, true, true]] : [[!SST_VS, false, false], [true, false, false], [true, true, false], [true, true, true]])
        .filter((t, i, a) => a.findIndex(u => u.join() === t.join()) === i);
      const seaOk = PS ? null : seaOkGet(); let seaKnown = false;
      if (seaOk === 'basic') { seaTry = []; seaKnown = true; } else if (seaOk){ const k = seaTry.findIndex(t => t.join() === seaOk); if (k > 0){ seaTry = seaTry.slice(k); seaKnown = true; } }
      // the middle sea first on level 1 (seaMidOn above): the lite vertex shader with the full fragment shader; failing, it is marked and
      // the old level 1 follows in the same start, with no word in seaWhy (that list is the old levels' fallbacks)
      if (!PS && seaLvl === 1 && !seaKnown && seaMidOn()){ seaMidMark(true);
        try { PS = program('#define NOSST\n' + SEA_VS_LITE, SEAF(SEA_FS), ['aXZ'], 'sjø middels'); SST_VS = false; PS.far = false; PS.lite = true; PS.mid = true; seaOkSet(null); seaTry = []; }
        catch (e){ if (gl.isContextLost()) throw e; seaMidFailed(String(e.message || e).slice(0, 120)); if (/ingen logg/.test(e.message)) await glSettle(); } }
      for (const [nosst, far, lite] of seaTry){
        try { PS = program((nosst ? '#define NOSST\n' : SHT_VS ? '' : '#define NOSHT\n') + (lite ? SEA_VS_LITE : SEA_VS), SEAF((far ? '#define FAR\n' : '') + SEA_FS), ['aXZ'], 'sjø'); SST_VS = !nosst; PS.far = far; PS.lite = lite;
          if (seaWhy.length || seaKnown) seaOkSet([nosst, far, lite].join()); else seaOkSet(null); break; }
        catch (e){ if (gl.isContextLost()) throw e; seaWhy.push(e.message); if (/ingen logg/.test(e.message)) await glSettle(); }
      }
      let seaDiag = '';
      if (!PS && seaLvl < 2 && !seaKnown){
        // which half the driver will not take, for the report: the sea's vertex shader with a plain fragment shader, and the other way round
        const tryLink = (vs, fs) => { try { program(vs, fs, ['aXZ'], 'prøve'); return 'ok'; } catch (e){ return 'feil'; } };
        seaDiag = ' · VS alene ' + tryLink('#define NOSST\n' + SEA_VS, 'precision highp float;varying vec3 vW;varying vec2 vXZ;void main(){gl_FragColor=vec4(fract(vW*0.01)+vec3(fract(vXZ*0.01),0.0),1.0);}') +
          ', FS alene ' + tryLink(BASIC_VS, SEAF('#define FAR\n' + SEA_FS));
        try { PS = program(BASIC_VS, BASIC_FS, ['aXZ'], 'enkel sjø'); PS.basic = true; SST_VS = false; seaDiag += ', enkel sjø ok'; seaOkSet('basic'); }
        catch (e){ throw new Error(seaWhy.join(' / ') + seaDiag); }
      }
      if (!PS){ PS = program(BASIC_VS, BASIC_FS, ['aXZ'], 'enkel sjø'); PS.basic = true; SST_VS = false; }
      // (the middle sea's far pass on the lite vertex shader as well: the full one is what Direct3D could not take)
      try { PSF = PS.basic || PS.far ? PS : program('#define NOSST\n' + (PS.mid ? SEA_VS_LITE : SEA_VS), SEAF('#define FAR\n' + SEA_FS), ['aXZ'], 'sjø langt'); }
      catch (e){ if (gl.isContextLost()) throw e; seaWhy.push(e.message); PSF = PS; }
      await glSettle(); seaTryMark(false); goneSet(SEA_GONE, 0); if (seaMidTry){ seaMidMark(false); goneSet(SEA_MIDGONE, 0); }   // the sea came through and the context is still there
      if (seaRe){ seaRe = false; seaReSet('ok'); try { localStorage.removeItem(SEA_KEY); } catch (e){}   // the full sea once more came through: level 0 from now on
        if (typeof cloudErr === 'function') cloudErr('3D full sjø på nytt virket, sjønivå 0 · ' + GPU, 'view3d init', ''); }
      if (seaWhy.length && typeof cloudErr === 'function') cloudErr('3D sjø med reserve (' + (SST_VS ? 'vtf' : 'novtf') + (PSF === PS ? ', én sjø' : '') + (PS.lite ? ', lett' : '') + seaDiag + ') · ' + GPU, 'view3d init', seaWhy.join('\n'));
      SSDUMMY = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, SSDUMMY); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])); PK = program(SKY_VS, SKY_FS, ['aP'], 'himmel'); PP = program(PT_VS, PT_FS, ['aPos', 'aA'], 'punkter');
      DYNP = buf(new Float32Array(4000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); DYNA = buf(new Float32Array(4000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      // the ground's heights and the forest (map/, the view packs): until they are in, the land is a flat stand-in
      HG = true;   // the ground comes in packs round the boat as it goes (stream3d); until a pack is in, its land is a stand-in
      stage = 'bygg'; try { BLD = await loadBuildings(); } catch (e){ console.error(e); BLD = null; }
      for (const [nm, f] of [['terreng', buildTerrain], ['kai', buildStatics], ['båt', buildBoat], ['skiff', buildSkiff], ['flagg', buildFlag], ['sjø', buildSea]]){ stage = nm; f(); }
      opt('wild', buildWild); opt('npc', buildNPC); opt('air', buildAir); opt('rescue', buildRescue);
      for (const [nm, f] of [['havn', buildHarbourFittings], ['fortøying', buildMooring], ['mottak', buildPlants], ['folk', buildPlantParts], ['bunkers', buildBunkers]]){ stage = nm; f(); }
      buildLabels();
      ready = true; return true;
    } catch (e){
      // a start that failed on WebGL 2 with the context still there: this device goes on WebGL 1 from now on (until GL1_VER changes),
      // and the page loads again once (at most every ten minutes) to start on it; the cloud is told why
      if (GL2 && gl && !gl.isContextLost()){ let last = 0; try { localStorage.setItem(GL1_KEY, GL1_VER); last = +sessionStorage.getItem('dsb_gl1_reload') || 0; } catch (e2){}
        if (typeof cloudErr === 'function') cloudErr('3D WebGL 2 feilet, tar WebGL 1 · ' + stage + ': ' + String(e && e.message || e).slice(0, 160) + ' · ' + GPU, 'view3d init', String(e && e.stack || ''));
        if (Date.now() - last > 600000 && !/gl2/.test(location.hash)){ try { sessionStorage.setItem('dsb_gl1_reload', String(Date.now())); } catch (e2){} if (typeof save === 'function') save(); setTimeout(() => location.reload(), 300); } }
      console.error(e); failed = true; failWhy = stage + ': ' + String(e && e.message || e).replace(/\s+/g, ' ').slice(0, 160) + (GPU ? ' · ' + GPU : '');
      // to the cloud's error log with the GPU and its limits, so a phone it fails on can be looked into
      if (typeof cloudErr === 'function'){ let lim = ''; try { lim = ['MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_VARYING_VECTORS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS'].map(k => k.replace('MAX_', '').toLowerCase() + '=' + gl.getParameter(gl[k])).join(' '); } catch (e2){} cloudErr('3D ' + failWhy, 'view3d init', lim + '\n' + String(e && e.stack || '')); }
      return false;
    }
  }
  // the crew's words over their heads (Jonas 08.10.2026, tilbakemelding #44: «kommentarer fra mannskap burde komme opp som flytende tekst
  // over hodet ... La gjerne også kommentaren henge 10 sekunder»): the line stands over the one who says it for SAYMS, fading in and out
  // the anchor alarm on screen (G3.anchorAlarm, from hooks.onAnchorAlarm): a red banner for a few seconds, and the masthead light flashing red
  const ANCHAL = {until:0, kind:'', el:null, drawn:0};
  function anchorAlarm3d(kind){ ANCHAL.until = performance.now() + 9000; ANCHAL.kind = kind; }
  const SAYMS = 10000, SAY = {c:null, w:null, b:null, txt:'', t0:0, a:null, el:null};
  // another player's boat says a hail (ui/10n-hail.js): over her, followed as she moves
  function sayBoat(id, txt){ if (!active) return false; SAY.c = SAY.w = null; SAY.b = id; SAY.txt = txt; SAY.t0 = performance.now(); return true; }
  // a hand at the plant (core/09d-folk.js plantSay): over his head when the plant is the one near the eye, else false (the caller toasts it)
  function sayWorker(pid, idx, nm, no, en){ if (!active) return false; const P = PLANTS.find(q => q.id === pid); if (!P) return false; SAY.c = SAY.b = null; SAY.w = {pid, idx}; SAY.txt = nm + ': «' + (S.lang === 'no' ? no : en) + '»'; SAY.t0 = performance.now(); return true; }
  // a moment on deck for a crew member at his place (14-crewlife.js crewSlip through hooks.onCrewFx): 'slip' (a fish over the side, at the
  // rail nearest him) or 'cut' (the hand shaken; the tape after is drawn from c.cut)
  const CFX = new Map();
  function crewFx3d(c, kind, o){ if (!active || !c || typeof CREW3D === 'undefined' || !CREW3D.on()) return false; const a = CREW3D.anchorOf(c.id); if (!a || a.mode !== 'at') return false;
    CFX.set(a.id, {kind, t0:performance.now() / 1000, sp:(o && o.sp) || 'torsk', kg:(o && o.kg) || 3, rail:kind === 'slip' ? CREW3D.railNear(a) : null}); DKN[kind] = (DKN[kind] || 0) + 1; return true; }
  function say3d(c, no, en){ if (!active || !c) return false; SAY.w = SAY.b = null; SAY.c = c; SAY.txt = c.name.split(' ')[0] + ': «' + (S.lang === 'no' ? no : en) + '»'; SAY.t0 = performance.now(); return true; }
  let labelEls = [];
  // (the harbours' names floating over the 3D view are gone, Jonas 13.10.2026: «Fjernes teksten for stedsnavn som flyter i luften»; the
  // layer stays for the crew's lines and the anchor alarm)
  function buildLabels(){ labelsEl.innerHTML = ''; labelEls = []; }
  function resize(){
    const r = wrap.getBoundingClientRect(), dpr = PROF.dpr ? Math.min(window.devicePixelRatio || 1, PROF.dpr) : Math.min(window.devicePixelRatio || 1, QUAL.dpr[QUAL.lvl], QUAL.lvl ? 9 : Math.sqrt(QUAL.px0 / Math.max(1, r.width * r.height)));
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  }

