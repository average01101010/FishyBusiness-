// The ocean fleet as NPCs (H1 of docs/planer/bestand-og-flaate.md, tools/npc/havflaate.py -> src/data/havflaate.json, 05d-hav.js):
// the register's vessels of 28 m and over, each her own model, the seasons and grounds of her gear, the ways along the fairways, and
// the fishing on the ground by her gear.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const D = K.havData(); t.ok(D && D.meta && D.ships, 'havflaate.json leses');
  const M = D.meta;
  t.ok(D.ships.length === M.n && M.n >= 0.95 * M.active, `${M.n} av registerets ${M.active} aktive fartøy på 28 m og over har en hjemmehavn`);
  t.ok(D.ships.every(s => K.VESSELS[s.vtype] && s.L >= 28 && s.C > 0), 'hvert fartøy er sin egen modell (VESSELS), 28 m og over');
  t.ok(M.byGear.tral > 80 && M.byGear.not > 50, `trålere ${M.byGear.tral}, ringnot ${M.byGear.not}, snurrevad ${M.byGear.snurrevad}, autoline ${M.byGear.line}, snøkrabbe ${M.byGear.teine}, garn ${M.byGear.garn}`);

  // the seasons: where the trips of a gear go in a month (the share of the trips by main area)
  const where = (g, mon) => { const c = {}; let n = 0, home = 0;
    for (const s of D.ships) if (s.g === g) for (let k = 0; k < 400; k++){ const d0 = k * s.C - s.ph + s.port; if (new Date(K.EPOCH + d0 * 864e5).getUTCMonth() !== mon) continue;
      const tr = K.havTrip(s, k); if (!tr){ home++; continue; } n++; c[tr.e[0]] = (c[tr.e[0]] || 0) + 1; }
    for (const k in c) c[k] = Math.round(c[k] / n * 100) / 100; return {n, home, c}; };
  const tf = where('tral', 1);
  t.ok((tf.c.h04 || 0) + (tf.c.h12 || 0) + (tf.c.h05 || 0) > 0.5, `trålerne i februar er mest på Tromsøflaket, Finnmarkskysten og i Lofoten/Vesterålen (h04, h12, h05): ${JSON.stringify(tf.c)}`);
  const ns = where('not', 8), no = where('not', 10), nj = where('not', 5);
  t.ok((ns.c.h42 || 0) + (ns.c.h30 || 0) + (ns.c.h37 || 0) > 0.5, `ringnot i september mest på makrellen vest i havet (h42, h30, h37): ${JSON.stringify(ns.c)}`);
  t.ok((no.c.h04 || 0) > 0.5, `ringnot i november mest på silda utenfor Troms og Vesterålen (h04): ${JSON.stringify(no.c)}`);
  t.ok(nj.home / Math.max(1, nj.home + nj.n) > no.home / Math.max(1, no.home + no.n), `ringnotflåten ligger mer i havn i juni (${nj.home} av ${nj.home + nj.n}) enn i november (${no.home} av ${no.home + no.n})`);
  const sk = where('teine', 2), skIn = Object.entries(sk.c).filter(([code]) => D.g.teine.find(e => e[0] === code && e[1] != null)).reduce((a, [, v]) => a + v, 0);
  t.ok(sk.n > 0 && skIn < 0.5, `snøkrabbefartøyene er det meste borte (øst i Barentshavet, utenfor rammen): ${JSON.stringify(sk.c)}`);

  // the ways: from the plant along the fairways to the ground, and the trip's states in order
  const s = D.ships.find(q => q.g === 'tral'); let k = 0, tr = null; while (!(tr = K.havTrip(s, k)) || tr.e[1] == null) k++;
  const W = K.havWay(s, tr.gi), pl = D.p[s.pi];
  t.ok(W.R.len > 5 && Math.hypot(W.R.pts[0].x - pl[1], W.R.pts[0].y - pl[2]) < 0.01, `leia fra mottaket til feltet ${tr.e[0]} er ${Math.round(W.R.len)} km`);
  const H0 = (k * s.C - s.ph) * 24, st = []; for (let h = 0; h < s.C * 24; h += 2){ const a = K.havState(s, H0 + h); if (st[st.length - 1] !== a.st) st.push(a.st); }
  t.ok(st.join(',').includes('out,fishing,in'), `en tur: ${st.join(' → ')}`);
  // the gear on the ground: a trawler tows within the ground's radius; an autoliner's lines and the pot vessels' lenker are in the sea
  const g0 = {x:500, y:300}; let far = 0, tow = 0;
  for (let u = 0; u < 60; u += 0.25){ const f = K.havFish(s, 1, u, g0); if (Math.hypot(f.p.x - g0.x, f.p.y - g0.y) > K.HAVG.tral.r * 1.5) far++; if (f.trawl) tow++; }
  t.ok(far === 0 && tow > 150, `tråleren tråler ${Math.round(tow / 240 * 100)} % av tida og holder seg innen ${K.HAVG.tral.r} km av feltet`);
  const al = D.ships.find(q => q.g === 'line'), fl = K.havFish(al, 1, 30, g0), pt = D.ships.find(q => q.g === 'teine'), fp = K.havFish(pt, 1, 7, g0);
  t.ok(fl.set.length >= 1 && fl.set.every(q => q.k === 'line' && Math.hypot(q.a.x - q.b.x, q.a.y - q.b.y) <= 10.1), `autolineren har ${fl.set.length} liner i sjøen (høyst 10 km)`);
  t.ok(fp.set.length === 6 && fp.set.every(q => q.k === 'teine'), `snøkrabbefartøyet har ${fp.set.length} teinelenker i sjøen`);
  // the seines by the clock (drawn in 3D by view3d drawSeine): the purse seine shot, pursed, hauled and pumped; the Danish seine shot and hauled
  const ns0 = D.ships.find(q => q.g === 'not'), sv0 = D.ships.find(q => q.g === 'snurrevad'), seq = (q, C) => { const m = []; for (let u = 0; u < C; u += 0.05){ const f = K.havFish(q, 1, u, g0); const x = f.seine ? f.seine.m : '-'; if (m[m.length - 1] !== x) m.push(x); } return m.join(','); };
  const sp = seq(ns0, 6), sd = seq(sv0, 3), f1 = K.havFish(ns0, 1, 3.2, g0).seine, f2 = K.havFish(sv0, 1, 2, g0).seine;
  t.ok(sp === '-,shoot,purse,haul,pump' && sd === '-,shoot,haul', `notkastet etter klokka: ringnot ${sp}; snurrevad ${sd}`);
  t.ok(f1.purse && f1.R === 120 && f1.k > 0.5 && f1.k < 0.7 && !f2.purse && f2.R === 500, `ringen: ringnot ${f1.R} m (k ${f1.k.toFixed(2)}), snurrevad ${f2.R} m`);
  // landing (03.11.2026): a ground's catch goes to the nearest plant along the fairways that takes the gear and has a quay for her
  const MO = new Map((K.MOTTAK && K.MOTTAK.m || []).map(m => [m.id, m])), want = {tral:'Trål', not:'Not'};
  let nL = 0, bad = []; for (const g in D.g) for (const e of D.g[g]){ if (e[5] == null) continue; nL++; const m = MO.get(D.p[e[5]][0]), V = K.VESSELS[D.kind[g]];
    if (m && !((m.gear || {})[want[g] || 'Konvensjonelle'] >= 0.05 && m.q[3] * 0.9 >= V.len + 2 && m.q[4] >= V.draft + 0.5)) bad.push(g + ' ' + e[0] + ' ' + m.id); }
  t.ok(nL >= 100 && !bad.length, `${nL} felt har et mottak for fangsten som tar redskapet og har kai for skipet` + (MO.size ? '' : ' (mottakene ikke lest)'), bad.slice(0, 4));
  // a trip that lands away from home: out, fishing, in to that plant, at its quay some hours, and home; the clock alone
  let LS = null, Lk = 0, Ltr = null;
  for (const q of D.ships){ for (let k = 0; k < 60 && !LS; k++){ const r = K.havTrip(q, k); if (r && r.e[1] != null && K.havLand(q, r)){ LS = q; Lk = k; Ltr = r; } } if (LS) break; }
  if (LS){ const H1 = (Lk * LS.C - LS.ph) * 24, seq2 = []; let atP = null;
    for (let h = 0; h < LS.C * 24; h += 0.5){ const a = K.havState(LS, H1 + h), tag = a.st + (a.lev ? ':' + a.lev : ''); if (seq2[seq2.length - 1] !== tag) seq2.push(tag); if (a.lev === 'go') atP = a; }
    const Ld = K.havLand(LS, Ltr), pl = D.p[Ld.pi], end = Ld.Wd.RR.pts[Ld.Wd.RR.pts.length - 1], hm = Ld.Wh.R.pts[Ld.Wh.R.pts.length - 1], home = D.p[LS.pi];
    t.ok(seq2.join(',').includes('out,fishing,in:go,port:land,in'), `en tur med levering ved ${pl[0]} (hjemme ${home[0]}): ${seq2.join(' → ')}`);
    t.ok(Math.hypot(end.x - pl[1], end.y - pl[2]) < 0.01 && Math.hypot(hm.x - home[1], hm.y - home[2]) < 0.01 && LS.land >= 4 && LS.land <= 8, `leia ender ved leveringsmottaket, hjemturen ved hjemmemottaket, ${LS.land.toFixed(1)} timer ved kai`);
    // the visitors at the plant: she is among those lying there while she lands, and not before she comes
    let inV = 0, before = 0; for (let h = 0; h < LS.C * 24; h += 0.5){ const a = K.havState(LS, H1 + h, {x:-1e6, y:-1e6}), v = K.havVisitors(Ld.pi, H1 + h).includes(LS); if (a.lev === 'land' && v) inV++; if (a.lev !== 'land' && v) before++; }
    t.ok(inV > 0 && before === 0, `ved leveringsmottaket står hun blant de besøkende bare mens hun leverer (${inV} halvtimer)`);
    const share = D.ships.reduce((a, q) => { for (let k = 0; k < 30; k++){ const r = K.havTrip(q, k); if (r && r.e[1] != null){ a.n++; if (K.havLand(q, r)) a.l++; } } return a; }, {n:0, l:0});
    t.ok(share.l > share.n * 0.2, `${share.l} av ${share.n} turer leverer ved et annet mottak enn hjemmemottaket`);
  } else t.ok(false, 'en tur som leverer borte finnes');
  // the clock alone: the same hour gives the same place
  const a = K.havState(s, H0 + 30), b = K.havState(s, H0 + 30); t.ok(a.p.x === b.p.x && a.p.y === b.p.y, 'samme tid gir samme sted');
}
