// The sea legs (FB4, steg 120, 13.11.2026; deckcrew.js seaLegs, seaKnee, SJOBEIN): each foot on the deck where the deck is under it,
// the knee on the high side more bent, the hips to the high side, the torso between plumb and the deck's normal and behind it (a
// spring), the feet wider in a sea, the hips moving less up and down than the deck, the hand to the rail and the foot put out.
// The deck here is a plane through the point he stands on, tilted by a roll and a pitch as view3d/00-head.js model() tilts the boat;
// his feet are level offsets from that point (to his right and ahead), as drawWorker places them.
export const scripts = ['js/figpose.js', 'js/deckcrew.js'];
export default function (t){
  const {seaLegs, seaState, seaKnee, SJOBEIN:C} = t.K, deg = Math.PI / 180;
  // the deck's normal for a roll and a pitch (model()'s Y column with no yaw), and its slopes for one heading h aboard
  const slopes = (roll, pitch, h) => { const n = [-Math.sin(roll) * Math.cos(0) + 0, Math.cos(pitch) * Math.cos(roll), Math.sin(pitch) * Math.cos(roll)], F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)];
    return {n, F, R, sr:-(n[0] * R[0] + n[2] * R[1]) / n[1], sf:-(n[0] * F[0] + n[2] * F[1]) / n[1]}; };
  // how far a sole is from the deck's plane: the foot at (right, ahead) level offsets and height fy over the point he stands on
  const off = (S, r, a, fy) => { const p = [S.R[0] * r + S.F[0] * a, fy, S.R[1] * r + S.F[1] * a]; return Math.abs(p[0] * S.n[0] + p[1] * S.n[1] + p[2] * S.n[2]); };
  const stand = (roll, pitch, h, more) => { const S = slopes(roll, pitch, h), s = seaState(), o = seaLegs(s, Object.assign({sr:S.sr, sf:S.sf, y:0, hs:0}, more || {})); return {S, s, o}; };

  // 1. the feet on the deck: at 0, 8 and 15° of roll and 0 and 5° of pitch, facing four ways, each sole within 1 cm of the deck
  let worst = 0, old = 0;
  for (const roll of [0, 8, 15, -8, -15]) for (const pitch of [0, 5, -5]) for (const h of [0, 0.7, Math.PI / 2, 2.4, -1.9]){ const {S, o} = stand(roll * deg, pitch * deg, h);
    for (const i of [0, 1]){ worst = Math.max(worst, off(S, o.fr[i], o.fa[i], o.fy[i])); old = Math.max(old, off(S, i ? 0.12 : -0.12, 0, 0)); } }
  t.ok(worst < 0.01, 'hver fot er innen 1 cm av dekket ved 0, 8 og 15° rulling og 0 og 5° stamping (verst ' + (worst * 1000).toFixed(2) + ' mm)');
  t.ok(old > 0.015, 'uten sjøbeina (begge føttene på én høyde) er feilen over 1,5 cm (verst ' + (old * 1000).toFixed(1) + ' mm)');
  { const {S, o} = stand(8 * deg, 0, 0), flat = Math.max(off(S, -0.12, 0, 0), off(S, 0.12, 0, 0)); t.near(flat, 0.0167, 0.002, 'ved 8° rulling sto føttene rundt 1,7 cm feil før'); t.ok(Math.abs(o.fy[1] - o.fy[0]) > 0.03, 'ved 8° står den ene foten over 3 cm høyere enn den andre'); }

  // 2. the body answers: at 8° of roll the knee on the high side is more bent, the hips are to the high side, the torso between plumb
  // and the normal
  for (const sign of [1, -1]){ const {S, o} = stand(8 * deg * sign, 0, 0), hi = S.sr > 0 ? 1 : 0, lo = 1 - hi, nrm = -Math.atan(S.sr);   // (the normal's lean to his right)
    t.ok(o.fy[hi] > o.fy[lo], 'rulling ' + 8 * sign + '°: foten på den høye siden står høyest');
    t.ok(o.kneeDeg[hi] > o.kneeDeg[lo] + 3, 'rulling ' + 8 * sign + '°: kneet på den høye siden er mer bøyd (' + o.kneeDeg[hi].toFixed(1) + '° mot ' + o.kneeDeg[lo].toFixed(1) + '°)');
    t.ok((hi ? o.hipR : -o.hipR) > 0.015, 'rulling ' + 8 * sign + '°: hofta er flyttet mot den høye siden (' + (o.hipR * 100).toFixed(1) + ' cm)');
    t.ok(o.leanR * nrm > 0 && Math.abs(o.leanR) < Math.abs(nrm) && Math.abs(o.leanR) > 0.02, 'rulling ' + 8 * sign + '°: overkroppen ligger mellom loddrett og dekkets normal (' + (o.leanR / deg).toFixed(1) + '° av ' + (nrm / deg).toFixed(1) + '°)'); }
  { const {o} = stand(0, 5 * deg, 0); t.ok(Math.abs(o.leanF) > 0.01 && Math.abs(o.leanR) < 1e-9, 'stamping 5° med ansiktet forover: overkroppen lener seg langskips, ikke tverrskips'); }
  { const {o} = stand(40 * deg, 0, 0); t.ok(Math.abs(o.leanR) <= C.LEANMAX + 1e-9 && Math.abs(o.hipR) <= C.HIPMAX + 1e-9, 'leningen og hofta stopper på grensene (12° og 6 cm)'); }
  // (the spring: the deck goes to 8° at once; the torso is behind it at first, passes it a little and settles)
  { const S = slopes(8 * deg, 0, 0), s = seaState(); seaLegs(s, {sr:0, sf:0, y:0, hs:0}); let first = 0, peak = 0, o;
    for (let i = 0; i < 300; i++){ o = seaLegs(s, {sr:S.sr, sf:0, y:0, hs:0, dt:1 / 60}); if (i === 5) first = Math.abs(o.leanR); peak = Math.max(peak, Math.abs(o.leanR)); }
    const end = Math.abs(o.leanR); t.ok(first < end * 0.5, 'fjæra: 0,1 s etter at dekket har lagt seg over, er overkroppen under halvveis (' + (first / end * 100).toFixed(0) + ' %)');
    t.ok(peak > end * 1.01 && peak < end * 1.3, 'fjæra: den svinger litt forbi og faller til ro (topp ' + (peak / end * 100).toFixed(0) + ' %)'); t.near(end, C.LEAN * 8 * deg, 0.004, 'fjæra: den ender på 30 % av 8°'); }
  // (wider in a sea)
  { const a = stand(0, 0, 0).o, b = stand(0, 0, 0, {hs:2}).o, wa = a.fr[1] - a.fr[0], wb = b.fr[1] - b.fr[0]; t.near(wa, 0.24, 1e-9, 'i stille sjø står føttene 24 cm fra hverandre, som før');
    t.ok(wb > wa + 0.05, 'ved Hs 2 m står føttene bredere enn i stille sjø (' + (wb * 100).toFixed(1) + ' cm mot ' + (wa * 100).toFixed(1) + ' cm)'); t.ok(b.hipY < -0.01, 'og hofta er litt lavere (knærne klare)'); }
  // (the heave: a chop lifts the deck 4 cm each way once a second, and the hips' acceleration is less than the deck's; a swell of 40 cm
  // each way every four seconds is more than the legs reach, and lifts all of him without the knees adding to it)
  { const dt = 1 / 120, rmsAcc = A => { let q = 0, n = 0; for (let i = 1; i + 1 < A.length; i++){ const a = (A[i + 1] - 2 * A[i] + A[i - 1]) / (dt * dt); q += a * a; n++; } return Math.sqrt(q / n); };
    const run = (amp, per) => { const s = seaState(), Y = [], H = []; for (let i = 0; i < 120 * 24; i++){ const y = amp * Math.sin(2 * Math.PI * i * dt / per), o = seaLegs(s, {sr:0, sf:0, y, hs:0, dt:i ? dt : undefined}); if (i >= 120 * 12){ Y.push(y); H.push(y + 0.92 + o.hipY); } }
      const rel = H.map((h, i) => h - Y[i] - 0.92); return {ad:rmsAcc(Y), ah:rmsAcc(H), lo:Math.min(...rel), hi:Math.max(...rel)}; };
    const a = run(0.04, 1), b = run(0.4, 4);
    t.ok(a.ah < a.ad * 0.7, 'hofta akselererer mindre opp og ned enn dekket (krapp sjø, 4 cm hver vei på 1 s: ' + a.ah.toFixed(2) + ' mot ' + a.ad.toFixed(2) + ' m/s², ' + (a.ah / a.ad * 100).toFixed(0) + ' %)');
    t.ok(b.ah < b.ad * 1.05, 'en dønning på 40 cm hver vei på 4 s løfter hele mannen, og knærne legger ikke til (' + (b.ah / b.ad * 100).toFixed(0) + ' %)');
    for (const r of [a, b]) t.ok(r.lo >= -C.HIPDN - 1e-9 && r.hi <= C.HIPUP + 1e-9, 'hofta holder seg innenfor det beina rekker (' + (r.lo * 100).toFixed(1) + ' til ' + (r.hi * 100).toFixed(1) + ' cm)'); }
  t.ok(seaKnee(0.84, 0.80) > 0.05 && Math.abs(seaKnee(0.84, 0.84)) < 1e-12 && seaKnee(0.84, 0.86) <= 0, 'seaKnee: et kortere bein er et kne lenger fram, samme lengde ingenting');

  // 4. the hand to the rail over GRAB, let go when she has lain still HOLD seconds; a step over STEP, taken back; walking neither
  { const s = seaState(), rail = [0.4, 0.2, 1.0], at = (rollDeg, n, more) => { const S = slopes(rollDeg * deg, 0, 0); let o; for (let i = 0; i < n; i++) o = seaLegs(s, Object.assign({sr:S.sr, sf:S.sf, y:0, hs:0, dt:1 / 30, rail}, more || {})); return o; };
    seaLegs(s, {sr:0, sf:0, y:0, hs:0, rail});
    t.eq(at(6, 60).grab, 0, 'rekka: ved 6° rulling henger hånda fritt');
    let o = at(10, 60); t.ok(o.grab > 0.99 && o.gh === 0 && o.step === 0, 'rekka: over 8° tar han rekka med hånda på den siden (høyre), uten støttesteg');
    o = at(13, 60); t.ok(o.step > 0.99 && o.grab > 0.99, 'støttesteget: over 12° settes en fot ut');
    { const S = slopes(13 * deg, 0, 0), low = S.sr > 0 ? 0 : 1; t.eq(o.stFoot, low, 'støttesteget: det er foten på den lave siden'); t.ok(Math.abs(o.fr[low]) > 0.12 + C.STEPLEN * 0.9, 'støttesteget: den står ' + (Math.abs(o.fr[low]) * 100).toFixed(0) + ' cm ute');
      t.ok(off(S, o.fr[low], o.fa[low], o.fy[low]) < 0.01 && o.lift[low] === 0, 'støttesteget: foten står på dekket der også'); }
    o = at(10, 60); t.ok(o.step > 0.99, 'støttesteget: foten står til rullingen er under 8,6° (15 hundredels radian)');
    o = at(2, 20); t.ok(o.grab > 0.99, 'rekka: han holder ennå et halvt sekund etter at hun har lagt seg'); o = at(2, 90); t.ok(o.grab === 0 && o.step === 0, 'rekka: og slipper, og foten er tatt inn');
    o = at(13, 60, {rail:null}); t.ok(o.grab === 0 && o.step > 0.99, 'uten rekke innen rekkevidde: støttesteget, ingen hånd');
    o = at(2, 90); o = at(13, 60, {rail:[0.4, 0.2, 1.0], stepOk:() => false}); t.ok(o.step === 0 && o.grab > 0.99, 'er det noe i veien for foten, tas ikke steget');
    o = at(2, 90); o = at(13, 60, {rail:[1.4, 0.2, 1.0]}); t.eq(o.grab, 0, 'en rekke 1,4 m unna er utenfor rekkevidde');
    o = at(2, 90); o = at(13, 60, {walk:true}); t.ok(o.grab === 0 && o.step === 0, 'i gange: verken hånd til rekka eller støttesteg');
    o = at(2, 90); o = at(13, 60, {hand:1, rail:[0.4, 0, 1.0]}); t.ok(o.grab > 0.99 && o.gh === 1, 'er bare venstre hånd ledig (kaffekoppen i høyre), er det den som tar rekka foran ham');
    o = at(2, 90); o = at(13, 60, {hand:1}); t.eq(o.grab, 0, 'men ikke en rekke på høyre side (armen går ikke på tvers av kroppen)'); }
  // (no room to the sides: he stands square to the deck, the hips over the feet as the deck has them, and the feet stay; half the room:
  // half of each)
  { const S = slopes(8 * deg, 0, 0), o = stand(8 * deg, 0, 0, {hs:2.5, room:{r:[0, 0], f:[1, 1], w:[0, 1]}}).o;
    t.near(o.leanR, -Math.atan(S.sr), 1e-9, 'uten rom til siden står overkroppen vinkelrett på dekket'); t.ok(o.hipR === 0 && Math.abs(o.sqR / o.sqU + S.sr) < 1e-9 && Math.abs(Math.hypot(o.sqR, o.sqU, o.sqF) - 1) < 1e-12, 'og hofta rett over føttene slik dekket har dem (langs dekkets normal)');
    t.ok(Math.abs(o.fr[0]) === 0.12 && o.fr[1] > 0.18, 'og en fot uten rom står der den sto'); { const q = stand(8 * deg, 0, 0, {room:{r:[0, 0], f:[1, 1], w:[0, 0]}}).o; t.ok(Math.abs(q.kneeDeg[0] - q.kneeDeg[1]) < 3, 'og knærne er like (' + q.kneeDeg.map(v => v.toFixed(1)).join(' og ') + '°)'); }
    const h = stand(8 * deg, 0, 0, {room:{r:[0.5, 0.5], f:[1, 1], w:[1, 1]}}).o, f = stand(8 * deg, 0, 0).o; t.near(h.leanR, (f.leanR - Math.atan(S.sr)) / 2, 1e-9, 'med halve rommet: halvveis mellom de to'); t.ok(f.sqR === 0 && f.sqU === 1, 'med alt rommet står han loddrett over føttene'); }
  // (after a long gap he is put straight into the pose: nothing swings in from zero)
  { const S = slopes(8 * deg, 0, 0), s = seaState(); seaLegs(s, {sr:0, sf:0, y:0, hs:0}); const o = seaLegs(s, {sr:S.sr, sf:0, y:3, hs:0, dt:2}); t.near(Math.abs(o.leanR), C.LEAN * Math.atan(Math.abs(S.sr)), 1e-9, 'etter en pause på over et halvt sekund settes han rett i stillingen'); t.near(o.hipY, -C.CROUCH * o.k, 1e-9, 'og hofta står i ro over dekket (bare senket som sjøen krever)'); }
}
