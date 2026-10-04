// ---------- fishing by hand: jig, strike on the bite, reel without snapping the line ----------
window.PUBW = (() => {
  const el = document.createElement('div'); el.id = 'pubUI'; el.hidden = true; document.getElementById('mapwrap').appendChild(el);
  const L = (no, en) => S.lang === 'no' ? no : en, tot = PUB_WHEEL.reduce((a, w) => a + w[1], 0);
  const COL = {tom:'#56636d', kveit:'#2f8f83', rykte:'#b0772b', haill:'#3fa34d', luksus:'#d4af37'}, LAB = {tom:'–', kveit:'Kveithaill', rykte:'Rykte', haill:'Haill', luksus:'★'};
  let a0 = 0, spinning = false;
  const segs = PUB_WHEEL.map(([k, w]) => { const s0 = a0; a0 += w / tot * 360; return {k, s0, s1:a0}; });
  const arc = (s0, s1, r) => { const p = a => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r], A = p(s0), B = p(s1); return 'M0,0 L' + A[0].toFixed(2) + ',' + A[1].toFixed(2) + ' A' + r + ',' + r + ' 0 ' + (s1 - s0 > 180 ? 1 : 0) + ',1 ' + B[0].toFixed(2) + ',' + B[1].toFixed(2) + ' Z'; };
  const wheel = '<svg viewBox="-110 -110 220 220" class="pubw"><g class="pubrot">' + segs.map(g => { const m = (g.s0 + g.s1) / 2, tx = Math.sin(m * Math.PI / 180) * 64, ty = -Math.cos(m * Math.PI / 180) * 64;
    return '<path d="' + arc(g.s0, g.s1, 100) + '" fill="' + COL[g.k] + '" stroke="#1d2328" stroke-width="1.5"/>' + (g.s1 - g.s0 > 5 ? '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" transform="rotate(' + m.toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ')" text-anchor="middle" dominant-baseline="middle">' + LAB[g.k] + '</text>' : ''); }).join('') +
    '<circle r="14" fill="#1d2328"/></g><path d="M0,-112 L-9,-96 L9,-96 Z" fill="#fff" stroke="#1d2328"/></svg>';
  const EMPTY = [['Du gikk hjem tomhendt, men med en god historie.', 'You went home empty-handed, but with a good story.'], ['Praten gikk om kvoter og vær. Ingen haill i kveld.', 'The talk was about quotas and weather. No luck tonight.'], ['Noen sang Nordlandsbåten. Du gikk hjem før siste vers.', 'Someone sang Nordlandsbåten. You left before the last verse.'], ['Bartenderen mente haillen var utsolgt for i kveld.', 'The bartender reckoned the luck was sold out for tonight.'], ['Du tapte en armbryting mot en fra Husøy. Det var verdt tusenlappen.', 'You lost an arm-wrestle to someone from Husøy. Worth the thousand.']];
  function rumour(){ const H = S.t / 60; let best = null, bv = 0; for (const g of GROUNDS) for (const sp of ['torsk', 'sei', 'hyse', 'kveite']){ const v = density(sp, g.p, H) * price(portById('husoy'), sp, H); if (v > bv){ bv = v; best = [g, sp]; } }
    return best ? [L('Kjentfolk på puben sa det var godt med ' + SPECIES[best[1]].no.toLowerCase() + ' på ' + best[0].name.no + ' i dag.', 'Locals at the pub said there was good ' + SPECIES[best[1]].en.toLowerCase() + ' at ' + best[0].name.en + ' today.'), best[0]] : [L('Ingen hadde noe å fortelle i kveld.', 'Nobody had anything to tell tonight.'), null]; }
  const cost = () => PUB_COST;
  // the odds come from the wheel itself, including the evenings you go home with nothing
  const pct = k => PUB_WHEEL.filter(w => w[0] === k).reduce((a, w) => a + w[1], 0) / tot * 100, pf = v => fmt(v, v % 1 ? 1 : 0) + ' %';
  const odds = () => L('Sjansene per runde: tomhendt ' + pf(pct('tom')) + ', rykte ' + pf(pct('rykte')) + ', haill ' + pf(pct('haill')) + ', luksushaill ' + pf(pct('luksus')) + '. Én runde per kveld, 15:00–03:00.',
    'Chances per round: empty-handed ' + pf(pct('tom')) + ', rumour ' + pf(pct('rykte')) + ', luck ' + pf(pct('haill')) + ', luxury luck ' + pf(pct('luksus')) + '. One round per evening, 15:00–03:00.');
  function why(H){ if (S.boat.status !== 'port') return L('Puben er bare åpen når båten ligger i havn.', 'The pub is only open while the boat is in port.');
    if (!pubOpen(H)) return L('Puben åpner klokka 15.', 'The pub opens at 15:00.');
    if (S.pubE === pubEvening(H)) return L('Du har tatt kveldens runde. Neste runde i morgen kveld.', 'You have had tonight\'s round. Next round tomorrow evening.');
    if (S.cash < cost()) return L('Du har ikke nok penger til en runde.', 'You do not have enough money for a round.'); return ''; }
  function render(msg){
    const H = S.t / 60, can = S.boat.status === 'port' && pubOpen(H) && S.pubE !== pubEvening(H) && S.cash >= cost();
    // after a reload the round is already decided: show what came of it
    if (!msg && !spinning && S.pubLast && S.pubLast.e === pubEvening(H) && S.pubE === S.pubLast.e) msg = S.pubLast.m;
    el.innerHTML = '<div class="pubbox"><h3>🍺 ' + L('Puben i ', 'The pub in ') + (portById(S.boat.port) || {}).name + '</h3>' + wheel +
      '<p class="pubmsg">' + (msg || L('Spander en runde og hør hva folk har å si. Kanskje går du hjem med haill.', 'Buy a round and hear what people say. Maybe you go home with some luck.')) + '</p>' +
      '<div class="pubbtns"><button class="pri" data-p="spin"' + (can && !spinning ? '' : ' disabled') + '>' + L('Spander en runde', 'Buy a round') + ' · ' + kr(PUB_COST) + '</button><button data-p="close">' + L('Gå hjem', 'Go home') + '</button></div>' +
      (!can && !spinning && why(H) ? '<p class="pubwhy">' + why(H) + '</p>' : '') + '<p class="pubodds">' + odds() + '</p></div>';
  }
  function spin(){
    const H = S.t / 60, c = cost(); if (spinning || S.boat.status !== 'port' || !pubOpen(H) || S.pubE === pubEvening(H) || S.cash < c) return;
    let r = Math.random() * tot, seg = segs[0]; for (const g of segs){ r -= (g.s1 - g.s0) / 360 * tot; if (r <= 0){ seg = g; break; } }
    // the round is paid, drawn and saved before the wheel turns, so closing the app mid-spin loses nothing
    S.cash -= c; S.stats.costs += c; S.pubE = pubEvening(H);
    let m;
    if (seg.k === 'haill' || seg.k === 'luksus'){ giveHaill(seg.k, 'pub'); m = L('Du vant ', 'You won ') + HAILL[seg.k][S.lang].toLowerCase() + '! ' + L('Den ligger i Haill-appen til du aktiverer den.', 'It waits in the Luck app until you switch it on.'); msg('Puben', L('Du gikk hjem med ', 'You went home with ') + HAILL[seg.k][S.lang].toLowerCase() + '.', 'You went home with ' + HAILL[seg.k].en.toLowerCase() + '.'); }
    else if (seg.k === 'rykte'){ const cr = crewRumour(), t0 = cr || rumour()[0]; m = t0; msg('Puben', t0, t0); }
    else { const st = Math.random() < 0.6 ? lorePub() : null; m = st ? st[S.lang === 'no' ? 0 : 1] : EMPTY[Math.floor(Math.random() * EMPTY.length)][S.lang === 'no' ? 0 : 1]; }   // an old story instead of an empty evening
    S.pubLast = {e:S.pubE, k:seg.k, m}; spinning = true; save(); render(L('Hjulet snurrer …', 'The wheel is spinning …'));
    const at = seg.s0 + (seg.s1 - seg.s0) * (0.2 + 0.6 * Math.random()), rot = 360 * 5 + (360 - at);
    const g = el.querySelector('.pubrot'); g.style.transition = 'none'; g.style.transform = 'rotate(0deg)'; void g.getBoundingClientRect();
    g.style.transition = 'transform 4.2s cubic-bezier(0.15, 0.85, 0.2, 1)'; g.style.transform = 'rotate(' + rot + 'deg)';
    setTimeout(() => { spinning = false;
      render(m); const keep = g.style.transform; setTimeout(() => { const g2 = el.querySelector('.pubrot'); if (g2){ g2.style.transition = 'none'; g2.style.transform = keep; } }, 0);
      if (typeof renderActs === 'function') renderActs(); if (typeof renderHud === 'function') renderHud(); }, 4400);
  }
  el.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b || b.disabled) return; if (b.dataset.p === 'spin') spin(); else if (!spinning){ el.hidden = true; if (typeof renderActs === 'function') renderActs(); } });
  return {open(){ render(); el.hidden = false; }, _segs:segs};
})();
