// ---------- «Kystlys» U4: the catch as it comes over the rail (docs/planer/ui-redesign.md, 04.11.2026) ----------
// Spilltest 2 and the UI review: the catch, the heart of the game, showed only as «Dekk: 6 kg» in the status line and as the hold's
// figure rising. Each fish that comes aboard (core/05-vessels.js addCatch calls catchFeed) gives a small instrument card at the right,
// over the sea: the species, the weight and what it is worth at the nearest plant today; the same species within a moment shares a card
// (the jig brings several a minute). Over the cards a line with what this spot gives: kg so far and kg an hour, the figure that says why
// one trip differs from the next. Nothing shows while the game plays the time away (catchUp: many fish in one interval are a summary
// at most), while the page is hidden, or under the phone, the book, a dialog or the pub.
const CFEED = (() => {
  let el = null, buf = [], cards = [], last = 0;
  const L = (no, en) => S.lang === 'no' ? no : en;
  const SPC = {torsk:'#d9a35b', hyse:'#7aa6c9', sei:'#7c8f99', lyr:'#9bbf6a', lange:'#c48bb5', brosme:'#8f7a5e', uer:'#e2584f', kveite:'#e7d3a1', blakveite:'#6d86c9', krabbe:'#e0793d', kongekrabbe:'#c4452f', steinbit:'#a39a8a'};
  function mk(){ el = document.createElement('div'); el.id = 'catchFeed'; el.setAttribute('aria-live', 'polite'); document.getElementById('app').appendChild(el); }
  function shown(){
    if (document.hidden || typeof SIMREADY === 'undefined' || !SIMREADY) return false;
    if (typeof PHONE !== 'undefined' && PHONE.isOpen()) return false;
    if (typeof BOOK !== 'undefined' && BOOK.isOpen()) return false;
    const m = document.getElementById('modal'); if (m && !m.hidden) return false;
    return document.body.classList.contains('v3d') && !document.body.classList.contains('in-pub') && !document.body.classList.contains('in-naust');
  }
  function worth(sp, kg){ try { const q = plantsNear(S.boat.pos, 1)[0]; return q ? Math.round(price(q.pt, sp, S.t / 60) * kg) : null; } catch (e){ return null; } }
  function add(sp, kg){ buf.push({sp, kg, t:performance.now()}); }
  function rate(){
    const fs = S.fsess, b = S.boat; if (!fs || b.status !== 'fishing') return '';
    const h = (S.t - fs.t0) / 60; if (h < 0.08) return '';
    return '<div class="cf-rate"><span>' + L('Her', 'Here') + '</span><b>' + fmt(fs.kg, 0) + ' kg</b><span>·</span><b>' + fmt(fs.kg / h, 0) + ' kg/t</b></div>';
  }
  function tick(){
    if (!el) mk();
    const now = performance.now();
    if (buf.length){
      // a burst (the time played away, a fast clock) is a summary card, never a stream
      // by species (spilltest 3, F5: a pot haul said «115 fisk», a net haul named no species): the three largest, the rest in one card
      if (buf.length > 24){ const by = {}; for (const x of buf){ const z = by[x.sp] = by[x.sp] || {sp:x.sp, n:0, kg:0, t:now}; z.n++; z.kg += x.kg; }
        const all = Object.values(by).sort((a, c) => c.kg - a.kg), top = all.slice(0, all.length > 4 ? 3 : 4), rest = all.slice(top.length);
        cards = cards.filter(c => c.sp === null || !by[c.sp]); for (const z of top) cards.push(z);
        if (rest.length) cards.push({sp:null, n:rest.reduce((a, z) => a + z.n, 0), kg:rest.reduce((a, z) => a + z.kg, 0), m:rest.length, t:now}); }
      else for (const x of buf){ const c = cards.find(c => c.sp === x.sp && now - c.t < 1800); if (c){ c.n++; c.kg += x.kg; c.t = now; } else cards.push({sp:x.sp, n:1, kg:x.kg, t:now}); }
      buf = [];
    }
    cards = cards.filter(c => now - c.t < 4200).slice(-4);
    const on = shown(), h = !on ? '' : rate() + cards.map(c => {
      if (!c.sp) return '<div class="cf-c"><i style="background:#8fd3ff"></i><b>' + c.n + ' ' + L('av ' + c.m + ' andre arter', 'of ' + c.m + ' other species') + '</b><span>' + fmt(c.kg, 1) + ' kg</span></div>';
      const v = worth(c.sp, c.kg), nm = spName(c.sp);
      return '<div class="cf-c' + (now - c.t < 400 ? ' new' : '') + '"><i style="background:' + (SPC[c.sp] || '#8fd3ff') + '"></i><b>' + (c.n > 1 ? c.n + ' × ' : '') + nm + '</b><span>' + fmt(c.kg, 1) + ' kg' + (v ? ' · ' + L('ca. ', 'c. ') + kr(v) : '') + '</span></div>';
    }).join('');
    if (h !== last){ last = h; el.innerHTML = h; el.hidden = !h; }
  }
  setInterval(tick, 400);
  return {add, get cards(){ return cards.slice(); }};
})();
function catchFeed(sp, kg){ CFEED.add(sp, kg); }
