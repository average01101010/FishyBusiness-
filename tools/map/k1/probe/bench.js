// Kystfiske målebenk: runs inside game.html when the address has «bench». It plays the game as it is today on this device and
// reports start-up time, memory, the frame rate in port, at sea and in a gale, and how long a 72-hour catch-up takes.
(function(){
  if (!/bench/.test(location.hash)) return;
  const R = {stage:'start'}, sleep = ms => new Promise(r => setTimeout(r, ms));
  const mem = () => performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null;
  const out = (k, v) => { R[k] = v; try { parent.postMessage({kystBench:JSON.parse(JSON.stringify(R))}, '*'); } catch (e) {} try { localStorage.setItem('kyst-bench', JSON.stringify(R)); } catch (e) {} };
  async function until(f, ms){ const t = performance.now(); for (;;){ try { if (f()) return true; } catch (e) {} if (performance.now() - t > ms) return false; await sleep(100); } }
  function frames(ms){
    return new Promise(res => {
      const iv = []; let last = 0; const t0 = performance.now();
      function f(t){ if (last) iv.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else done(); }
      function done(){
        iv.sort((a, b) => a - b); const sum = iv.reduce((a, b) => a + b, 0) || 1;
        res({fps:+(iv.length / sum * 1000).toFixed(1), p50:+(iv[iv.length >> 1] || 0).toFixed(1), p95:+(iv[Math.floor(iv.length * 0.95)] || 0).toFixed(1), slow:iv.filter(x => x > 50).length, n:iv.length});
      }
      requestAnimationFrame(f);
    });
  }
  window.addEventListener('error', e => out('error', String(e.message || e)));
  window.addEventListener('load', async () => {
    try {
      out('stage', 'boot');
      const ob = await until(() => { const b = document.getElementById('obGo'); return b && b.offsetParent; }, 90000);
      out('bootMs', Math.round(performance.now()));
      if (ob) document.getElementById('obGo').click();
      await until(() => S.intro === true && document.getElementById('modal').hidden, 30000);
      out('memBoot', mem());
      out('stage', '3d');
      out('g3', await until(() => G3.isActive(), 60000)); out('g3Ms', Math.round(performance.now()));
      await sleep(5000);
      out('stage', 'havn'); out('fpsPort', await frames(8000)); out('memPort', mem());
      const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0;
      WX_FORCE = {w:9, d:315}; await sleep(5000);
      out('stage', 'sjø'); out('fpsSea', await frames(8000));
      WX_FORCE = {w:20, d:315}; await sleep(5000);
      out('stage', 'kuling'); out('fpsGale', await frames(8000)); out('memSea', mem());
      WX_FORCE = null;
      out('stage', 'catchup'); await sleep(300);
      const t0 = performance.now(); for (let i = 0; i < 4320; i++) step(); out('catchUpMs', Math.round(performance.now() - t0));
      out('memEnd', mem());
      out('stage', 'ferdig');
    } catch (e) { out('error', String(e && e.stack || e)); out('stage', 'feil'); }
  });
})();
