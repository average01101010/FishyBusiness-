// ===== Fartstid: years at sea, 0 to 40 (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1) =====
// The player's experience is counted as sea time, the thing every fisher knows: «12 år og 143 døgn fartstid». Status only, it opens
// nothing and has no rank names. The years are points on a curve, points(N) = 1 000 000 · (N/40)^2.8: the first year comes on the
// first trip, the fifth in the first week, the tenth after a month, the twentieth after four or five months, the thirtieth after a
// year and the fortieth after two or three for one who plays steadily. Past forty the years go on as stars.
// Earned aboard: each game hour at sea with you aboard, and each landing by the square root of its value (a big boat gives more, not a
// hundred times more). Fish taken with luck counts like any fish. What the crews and the gear do while the game is closed counts a
// quarter («rederierfaring»): sea time is counted only for the one aboard. Time away also builds «uthvilt»: the next hours at sea
// with you aboard give double, up to a cap; it never runs out by waiting. Sea time is never sold, nor anything that raises it.
const FS = {MAX:40, TOP:1e6, EXP:2.8, SEA:80 / 60, LAND:3, AWAY:0.25, REST_H:120, REST_CAP:18 * 60};
let FS_AWAY = false;   // set while the time away is played (ui/08-actions.js catchUp)
function fsNeed(n){ return n <= 0 ? 0 : n <= FS.MAX ? FS.TOP * Math.pow(n / FS.MAX, FS.EXP) : FS.TOP + (n - FS.MAX) * (FS.TOP - fsNeed(FS.MAX - 1)); }
// years, the days into the next one (0–364), the share of it, and the stars past forty
function fsOf(p){
  p = Math.max(0, p || 0); let y = 0; while (y < 400 && p >= fsNeed(y + 1)) y++;
  const a = fsNeed(y), b = fsNeed(y + 1), f = Math.min(1, (p - a) / (b - a));
  return {y, d:Math.min(364, Math.floor(f * 365)), f, star:Math.max(0, y - FS.MAX)};
}
// the start: a game that has been played gets its sea time from what it did (the miles with you aboard, the trips and the landings)
function fsSeed(){
  const st = S.stats || {}, nm = (S.tat && S.tat.nm) || 0, trips = st.trips || 0, rev = Math.max(0, st.revenue || 0);
  return Math.round(FS.SEA * 60 * nm / 6 + (trips ? FS.LAND * Math.sqrt(rev / trips) * trips : 0));
}
function fsState(){ if (!S.fs) S.fs = {p:fsSeed(), rest:0, away:0}; return S.fs; }
function fsText(p, long){ const o = fsOf(p), en = S.lang === 'en';
  const yrs = o.y > FS.MAX ? FS.MAX + ' ' + (en ? 'years' : 'år') + ' ★' + o.star : o.y + ' ' + (en ? (o.y === 1 ? 'year' : 'years') : 'år');
  return long ? yrs + (en ? ' and ' + o.d + ' days at sea' : ' og ' + o.d + ' døgn fartstid') : yrs + (en ? ' at sea' : ' fartstid'); }
// points in: aboard and active they count whole (double while rested), away or by a crew without you a quarter
function fsAdd(pts, aboard){
  const F = fsState(), y0 = fsOf(F.p).y; let g = pts;
  if (FS_AWAY || !aboard){ g *= FS.AWAY; F.away = (F.away || 0) + g; }
  else if (F.rest > 0) g *= 2;
  F.p += g; const y1 = fsOf(F.p).y;
  if (y1 > y0) fsYear(y1);
  return g;
}
function fsYear(y){
  const t = fsText(fsNeed(y));
  log('Du har nå ' + t + '.', 'You now have ' + t + '.');
  if (!FS_AWAY && typeof toast === 'function') toast((S.lang === 'en' ? 'Sea time: ' : 'Fartstid: ') + t);
  if (y % 10 === 0) msg('Kystposten', 'Kystposten gratulerer med ' + y + ' år på havet. Det er ikke mange forunt.', 'The Coast Post congratulates you on ' + y + ' years at sea. Not many get there.');
}
// each game minute: an hour at sea with you aboard counts (rested time is used up only at sea)
function fsMinute(){
  let at = false; eachVessel(() => { if (meAboard() && S.boat.status !== 'port') at = true; });
  if (!at) return;
  const F = fsState(); fsAdd(FS.SEA, !FS_AWAY);
  if (!FS_AWAY && F.rest > 0) F.rest = Math.max(0, F.rest - 1);
}
// a landing: by the square root of its value
function fsLand(total){ return fsAdd(FS.LAND * Math.sqrt(Math.max(0, total || 0)), meAboard()); }
// time away builds rest: two game hours of double sea time for each real hour, up to eighteen
function fsRested(realMs){ const F = fsState(); F.rest = Math.min(FS.REST_CAP, (F.rest || 0) + realMs / 3.6e6 * FS.REST_H); }
