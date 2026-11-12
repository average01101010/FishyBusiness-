// The quota price that lives (KM5, steg 64; docs/planer/kvotemarkedet.md, V4 B, Jonas 07.11.2026: «V4, anbefalt»): kpkAt(H) is
// 260 kr/kg × the cod price against the normal for the time of year (2026's mean) × the quota outlook (next year's advice from 26 June,
// the total quota from 17 October, against this year's), smoothed over four game weeks and held within 0.7–1.4 times. It is a pure function
// of the clock and the same for every save (WORLD_SEED and the server's stock, nothing from the player's own). And kmTakst, structPrice,
// licValue, the offers and the ocean permits follow it, while a right bought keeps the price it was bought at (l.kpk).
export default function (t){
  const K = t.K, WORLD_SEED = K.get('WORLD_SEED'), {newState, ensureFleet, HJ, KPK, EPOCH, LIC_OFFERS, licQ, licValue, structPrice, kmTakst, havValue, yearH} = K;
  t.ok(WORLD_SEED === 20270301, 'WORLD_SEED fra kjernen (' + WORLD_SEED + '; den står etter WORLD_T0 på samme linje, så den hentes med get)');
  t.ok(typeof K.kpkAt === 'function', 'kpkAt finnes');
  if (typeof K.kpkAt !== 'function') return;
  const {kpkAt, kpkCodIx, kpkOut} = K;
  const mk = (qseed, cash) => { const S = newState(); S.qseed = qseed; S.cash = cash; K.set('S', S); ensureFleet(); return S; };
  const Hd = (y, m, d, h) => (Date.UTC(y, m - 1, d, h == null ? 12 : h) - EPOCH) / 36e5;
  let S = mk(WORLD_SEED, 1e5);

  // ---- the limits: 0.7 and 1.4 × 260, whole kroner, every day of eight years
  let lo = Infinity, hi = -Infinity, bad = 0, n = 0;
  for (let H = Hd(2026, 1, 1); H < Hd(2034, 1, 1); H += 24){ const v = kpkAt(H); n++; if (!(v >= 0.7 * KPK && v <= 1.4 * KPK) || v !== Math.round(v)) bad++; lo = Math.min(lo, v); hi = Math.max(hi, v); }
  t.eq(bad, 0, 'kvoteprisen er hele kroner mellom ' + 0.7 * KPK + ' og ' + 1.4 * KPK + ' kr/kg hver dag 2026–2033 (' + n + ' dager: ' + lo + '–' + hi + ')');
  t.ok(hi - lo >= 10, 'og den flytter seg (spennet er ' + (hi - lo) + ' kr/kg)');
  // the limits hold when the raw index goes far outside them (a stock from the server with a collapse or a boom)
  { const W = K.get('WSH'), keep = W.stock, y = yearH(Hd(2030, 3, 1));
    W.stock = [['torsk', y, 300000, 285000, 285000], ['torsk', y + 1, 900000, 900000, 900000]];
    const up = kpkAt(Hd(y, 12, 1)); W.stock = [['torsk', y, 300000, 285000, 285000], ['torsk', y + 1, 60000, 50000, 50000]];
    const dn = kpkAt(Hd(y, 12, 1)); W.stock = keep;
    t.eq(up, Math.round(1.4 * KPK), 'en totalkvote som tredobles, gir taket: ' + up + ' kr/kg'); t.eq(dn, Math.round(0.7 * KPK), 'en som faller til en sjettedel, gir gulvet: ' + dn + ' kr/kg');
    t.ok(kpkAt(Hd(y, 12, 1)) !== up, 'og serverens bestand tas bort igjen (hurtigbufferen følger den)'); }

  // ---- the smoothing: the mean of the last 28 days' raw index, at noon each calendar day
  { const H = Hd(2028, 8, 9, 15), y = yearH(H), D = Hd(2028, 8, 9, 12); let s = 0;
    for (let k = 0; k < 28; k++) s += kpkCodIx(D - 24 * k);
    t.eq(kpkAt(H), Math.round(KPK * Math.min(1.4, Math.max(0.7, s / 28 * kpkOut(D, y)))), 'torskeprisen glattet over de 28 siste dagene, ganget med dagens kvoteutsikt');
    t.eq(kpkAt(Hd(2028, 8, 9, 1)), kpkAt(Hd(2028, 8, 9, 23)), 'samme pris hele døgnet'); }
  // a step in the outlook comes in the day it is known (Jonas 12.11.2026: «Trinnet med en gang»; smoothed, the price could be seen
  // coming for four weeks, and the register's 90 % buy-back left a sure gain of about 10 % after a good advice)
  { const y = 2028, a = Hd(y, 6, 25), b = Hd(y, 6, 26), c = Hd(y, 7, 24), o0 = kpkOut(a, y), o1 = kpkOut(b, y);
    t.ok(o0 === 1 && o1 !== 1, `kvoterådet for ${y + 1} virker fra 26. juni: utsikten ${o0} den 25., ${o1.toFixed(3)} den 26.`);
    const ka = kpkAt(a), kb = kpkAt(b), want = ka * o1;
    t.ok(Math.abs(kb - Math.min(1.4 * KPK, want)) <= 2 && kpkAt(c) !== ka, `trinnet kommer samme dag: ${ka} kr/kg den 25., ${kb} den 26. (${ka} × ${o1.toFixed(3)} = ${want.toFixed(0)})`); }
  // the advice and the total quota only from the dates they are known
  { const y = 2029, Q = K.stockYear('torsk', y + 1, WORLD_SEED), Q0 = K.stockYear('torsk', y, WORLD_SEED), L = K.kpkLukket;
    t.near(kpkOut(Hd(y, 6, 26), y), L(Q.adv) / L(Q0.tac), 1e-9, 'fra 26. juni: neste års råd mot årets totalkvote (lukket gruppes torsk i kvotekjeden)');
    t.near(kpkOut(Hd(y, 10, 16), y), L(Q.adv) / L(Q0.tac), 1e-9, 'til og med 16. oktober');
    t.near(kpkOut(Hd(y, 10, 17), y), L(Q.tac) / L(Q0.tac), 1e-9, 'fra 17. oktober: neste års totalkvote');
    t.eq(kpkOut(Hd(y, 3, 1), y), 1, 'fra nyttår til 26. juni: ingen utsikt (1)');
    t.eq(kpkOut(Hd(y - 1, 12, 20), y), 1, 'og en dag fra året før regnes mot det nye årets kvote, som da er kjent (1)'); }
  // the cod price against the normal for the time of year: the season itself does not move the takst
  { const sk = Hd(2028, 2, 15), su = Hd(2028, 5, 15), ix = H => 1 + K.weekDev('torsk', H);
    t.near(kpkCodIx(sk) / kpkCodIx(su), ix(sk) / ix(su), 1e-9, 'torskeprisen regnes mot normalen for årstiden: vinter mot vår er bare ukeavviket (' + (ix(sk) / ix(su)).toFixed(3) + ')'); }

  // ---- the same for every save: WORLD_SEED and the server's stock, nothing from the player's own
  { const H = Hd(2029, 11, 3), a = kpkAt(H); S = mk(WORLD_SEED, 9e7); S.fleet.length = 0; S.home = 'bodo'; const b = kpkAt(H); S = mk(12345, 1); const c = kpkAt(H);
    t.ok(a === b && b === c, `samme kvotepris i to lagringer med WORLD_SEED (${a} og ${b}), og i en lagring med et annet frø (${c})`); }
  S = mk(WORLD_SEED, 1e5);

  // ---- what follows it
  const H = S.t / 60, k = kpkAt(H);
  t.eq(structPrice('h14', H), Math.round(licQ({id:'h14'}, H).torsk * k), 'structPrice er årets torskekvote × kpkAt (' + k + ' kr/kg)');
  t.eq(kmTakst({kind:'right', id:'h14'}, H), structPrice('h14', H), 'kmTakst for en hjemmel er det samme');
  { const s = {kind:'struct', id:'h14', kf:HJ.h14.kf * 0.9, from:yearH(H), until:yearH(H) + 20};
    t.near(kmTakst(s, H) / kmTakst({kind:'right', id:'h14'}, H), 0.9 * (20 - K.doyH(H) / 365) / 20, 1e-4, 'og en strukturkvote følger den med faktoren og årene'); }
  { const l = {id:'h9', hl:HJ.h9.hl, kpk:200, since:2025};
    t.eq(licValue(l), Math.round(licQ(l).torsk * k), 'licValue er hjemmelens torskekvote × kvoteprisen nå');
    t.eq(l.kpk, 200, 'en hjemmel som alt er kjøpt, beholder l.kpk (det den ble kjøpt for)'); }
  { const O = LIC_OFFERS[0]; t.eq(O.kpk, k, 'tilbudene i Båthandel har kvoteprisen nå (O.kpk ' + O.kpk + ')'); t.eq(licValue(O), Math.round(O.cod * k), 'og prisen deres følger den'); }
  // two times with different prices: the values move with it, the quota the same (inside one year)
  { const y = yearH(H) + 1, a = Hd(y, 2, 1), b = Hd(y, 6, 1), ka = kpkAt(a), kb = kpkAt(b), l = {id:'h14'};
    t.ok(ka !== kb, `to tider i ${y} med ulik pris: ${ka} og ${kb} kr/kg`);
    t.eq(licValue(l, b) - Math.round(licQ(l, b).torsk * kb), 0, 'licValue(l, H) tar prisen for H');
    t.near(structPrice('h14', b) / structPrice('h14', a), kb / ka, 1e-4, 'structPrice følger forholdet mellom prisene');
    const va = havValue({id:'konv', kf:3}, a), vb = havValue({id:'konv', kf:3}, b);
    t.near(vb / va, kb / ka, 0.01, `havflåtens tillatelser følger samme indeks (${Math.round(va / 1e6)} og ${Math.round(vb / 1e6)} MNOK)`); }
  // the new year: the quota and the price change together (the outlook was the coming year's quota), so the value hardly jumps
  { const y = 2029, a = Hd(y - 1, 12, 31, 23), b = Hd(y, 1, 1, 1), va = structPrice('h10', a), vb = structPrice('h10', b);
    t.ok(Math.abs(vb / va - 1) < 0.03, `ved nyttår ${y}: en hjemmel 10–10,9 m er verdt ${Math.round(va / 1e3)} og ${Math.round(vb / 1e3)} tusen (kvoten og prisen bytter sammen)`); }
}
