  // ---------- setup ----------
  // What stopped the 3D view, shown with the message so a device it fails on tells why (the user's phone 04.10.2026: «3D-visning
  // støttes ikke» with no more to go on): the step and the error, or the shader's log
  let failWhy = '', stage = '', GPU = '', glWatch = false;
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
  const SEA_KEY = 'dsb_sea', SEA_TRY = 'dsb_sea_try'; let seaLvl = 0, seaBumped = false;
  const seaLvlGet = () => { const m = /sealvl=(\d)/.exec(location.hash); if (m) return Math.min(2, +m[1]); let v = 0, t = null;
    try { v = +localStorage.getItem(SEA_KEY) || 0; t = localStorage.getItem(SEA_TRY); } catch (e){}
    if (t !== null && +t + 1 > v){ v = Math.min(2, +t + 1); seaBumped = true; try { localStorage.setItem(SEA_KEY, String(v)); } catch (e){} }
    return Math.min(2, /Direct3D/i.test(GPU) ? Math.max(v, 1) : v); };
  // the sea program that linked on this device when the full one did not, for this version of the sea's shaders (SEA_VER: change it
  // when they change, so every device tries the full sea again); #sealite in the address forces the lite one (the tests)
  const SEA_OK = 'dsb_sea_ok', SEA_VER = 'u1';
  const seaOkGet = () => { if (/sealite/.test(location.hash)) return 'true,true,true'; if (/sealvl=/.test(location.hash)) return null;
    try { const v = localStorage.getItem(SEA_OK) || ''; return v.startsWith(SEA_VER + ':') ? v.slice(SEA_VER.length + 1) : null; } catch (e){ return null; } };
  const seaOkSet = v => { if (/sealvl=|sealite/.test(location.hash)) return; try { if (v) localStorage.setItem(SEA_OK, SEA_VER + ':' + v); else localStorage.removeItem(SEA_OK); } catch (e){} };
  const seaTryMark = on => { if (/sealvl=/.test(location.hash)) return; try { if (on) localStorage.setItem(SEA_TRY, String(seaLvl)); else localStorage.removeItem(SEA_TRY); } catch (e){} };
  // after a compile or link that failed with no word why: a moment for the browser to notice a lost context, before trying the next
  const glSettle = async () => { await new Promise(r => setTimeout(r, 80)); if (gl.isContextLost()) throw new Error('konteksten er mistet'); };
  const opt = (nm, f) => { try { f(); } catch (e){ console.error(nm, e); } };    // a part the view can do without
  async function init(){
    if (ready) return true; if (failed) return false;
    try {
      stage = 'webgl';
      // the settings the view wants, then plainer ones: some PCs (Adrian, 04.10.2026) give no context with antialiasing or the
      // high-performance GPU asked for, and do with neither
      const ctxTry = o => { try { return canvas.getContext('webgl', o) || canvas.getContext('experimental-webgl', o); } catch (e){ return null; } };
      gl = ctxTry({antialias:true, alpha:false, powerPreference:'high-performance'}) || ctxTry({antialias:false, alpha:false}) || ctxTry({alpha:false, failIfMajorPerformanceCaveat:false}) || ctxTry(undefined);
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
          if (!wasReady && stage === 'shadere' && seaLvl < 2){ try { localStorage.setItem(SEA_KEY, String(seaLvl + 1)); } catch (e2){}
            failWhy = S.lang === 'en' ? 'the graphics driver gave up while starting. Reload the page and the game tries a simpler sea' : 'grafikkdriveren ga opp under oppstarten. Last siden på nytt, så prøver spillet en enklere sjø';
            if (typeof cloudErr === 'function') cloudErr('3D konteksten mistet i shaderne, sjønivå ' + seaLvl + ' → ' + (seaLvl + 1) + ' · ' + GPU, 'view3d init', ''); }
          else { failWhy = 'WebGL-konteksten ble mistet'; if (wasReady && typeof cloudErr === 'function') cloudErr('3D konteksten mistet under spill · ' + GPU + ' · ' + glDiag(), 'view3d', ''); } });
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
      PL = program(LIT_VS, LIT_FS, ['aPos', 'aCol'], 'lit'); PT = program(TER_VS, terFS(0), ['aPos', 'aCol', 'aNor', 'aShd', 'aMat'], 'terreng'); PTS = [PT, null, null]; PRGN = program(LITN_VS, LITN_FS, ['aPos', 'aNor', 'aCol'], 'modell'); PRGX = program(TEX_VS, TEX_FS, ['aPos', 'aUV'], 'tekstur'); PRGW = program(WK_VS, WK_FS, ['aPos', 'aW', 'aS'], 'kjølvann');
      WKB = {p:new Float32Array(9000 * 3), w:new Float32Array(9000 * 4), s:new Float32Array(9000), pb:buf(new Float32Array(9000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), wb:buf(new Float32Array(9000 * 4), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), sb:buf(new Float32Array(9000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW)}; // the waves read the sea-state texture in the vertex shader where the GPU can (#novtf in the address tries without)
      SST_VS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 2 && !/novtf/.test(location.hash);
      // The sea is the heaviest program, and a phone's driver may refuse to link it with no word why (Adreno 642L, 05.10.2026: «sjø link:
      // ingen logg fra driveren»): then it tries without the texture in the vertex shader, then with the far pass's simpler waves, and
      // tells the cloud which one it took
      seaLvl = seaLvlGet(); seaTryMark(true);
      if (seaBumped && typeof cloudErr === 'function') cloudErr('3D sjønivå ' + seaLvl + ' etter et forsøk som ikke kom tilbake · ' + GPU, 'view3d init', '');
      // [no texture in the vertex shader, the far pass's waves, the lite vertex shader]; the one that worked on this device last time with
      // these shaders (SEA_OK) is where it starts, so a phone does not link the ones its driver refused at every start
      let seaTry = (seaLvl >= 2 ? [] : seaLvl === 1 ? [[true, true, false], [true, true, true]] : [[!SST_VS, false, false], [true, false, false], [true, true, false], [true, true, true]])
        .filter((t, i, a) => a.findIndex(u => u.join() === t.join()) === i);
      const seaWhy = [], seaOk = seaOkGet(); let seaKnown = false;
      if (seaOk === 'basic') { seaTry = []; seaKnown = true; } else if (seaOk){ const k = seaTry.findIndex(t => t.join() === seaOk); if (k > 0){ seaTry = seaTry.slice(k); seaKnown = true; } }
      PS = null;
      for (const [nosst, far, lite] of seaTry){
        try { PS = program((nosst ? '#define NOSST\n' : '') + (lite ? SEA_VS_LITE : SEA_VS), SEAF((far ? '#define FAR\n' : '') + SEA_FS), ['aXZ'], 'sjø'); SST_VS = !nosst; PS.far = far; PS.lite = lite;
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
      try { PSF = PS.basic || PS.far ? PS : program('#define NOSST\n' + SEA_VS, SEAF('#define FAR\n' + SEA_FS), ['aXZ'], 'sjø langt'); }
      catch (e){ if (gl.isContextLost()) throw e; seaWhy.push(e.message); PSF = PS; }
      await glSettle(); seaTryMark(false);   // the sea came through and the context is still there
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
    const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, QUAL.dpr[QUAL.lvl]);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  }

