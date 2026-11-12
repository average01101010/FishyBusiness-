// ===== Kvotemarkedet, the core (KM1 of docs/planer/kvotemarkedet.md; Jonas 07.11.2026: V1 A, V2 A, V3 A, V4 B, V5 A) =====
// Jonas: «planen min er å lage et kvotemarked også der man kan kjøpe og selge kvoter.» What is traded is rights (deltakeradganger) and
// structure quotas, quota factors, never kilos (V1 A; J-187-2026 § 30 forbids moving catch or quantity to another boat): the tonnes follow
// from the year, the factor times the group's quota unit, which is the same for every player (WORLD_SEED and the stock from the server).
// So a sale only moves who fishes; the sum of the quota factors stays (bar the 10 % cut when a right is structured, which goes back to
// the group as in life). One national market (V5 A: no landsdel). The price band, the 2 % step, the durations and the 5 % commission are
// B's (MB in 09k-market.js); the takst is the year's cod quota at the quota price (kpkAt, which lives since KM5, V4 B). The register sells as today (V3 A).
// This file is pure, so the unit tests can run it (tests/unit/kvotemarked.test.mjs): what can be put out (kmWhy), what a buyer may take
// and on which boat (kmBuyWhy), the goods as they travel (kmPack), the seller's side (kmOut) and the buyer's (kmApply), and the free
// right a company keeps without a boat (S.licFree). The server is KM2, the pages KM3, the boat with or without the right KM4.
// Sources (read 07.11 and 08.11.2026; the plan's kap. 2 and 9):
//   deltakerloven § 4 (the right belongs to the owner and one vessel) and § 6 (blad B)
//   Fiskeridirektoratet, «Forslag etter høring» 11.09.2026 (the proposal to the ministry after the hearing of 26.03.2026), its draft of a
//     new regulation on fishing permits: § 5 the three ways (replacement, taking over a vessel for continued fishing, moving the right),
//     § 6 the length rule (unchanged from the hearing: a right under 11, 15 or 21 m quota length on a vessel under that largest length
//     cannot be moved to one at or over it; it codifies the instruction of 7 September 2022 and does not apply to taking over a vessel),
//     § 7 the advance promise for an owner selling without a new vessel, «med en varighet på to år» (kept), and § 8 the operating
//     requirement, which the Directorate dropped for the coastal fleet after the hearing («foreslår å avvente å innføre et driftskrav
//     for tillatelsesgrupper i kystfiskeflåten»; kap. 2.2.2): KM.drift is therefore off, the rule kept and tested for when it comes
//   kvoteforskriften (FOR-2003-11-07-1309) § 9 the same group, § 11 the 10 % cut and 20 years, § 12 the quota cap (5 and 6 times for a
//     specialist; STRUCT in 03d-quota.js) and § 12 third paragraph (a structure quota may be fished with another vessel), kap. 2 § 6
//     (the second quota from the special scheme under 11 m falls away when the right is taken over, replaced or moved)
const KM = {
  freeY:2,        // a right kept without a boat lasts two game years (§ 7: «to år»), then goes back to the register
  drift:false,    // the operating requirement (draft § 8): dropped for the coastal fleet in «Forslag etter høring» 11.09.2026
  driftY:2,       // (when on: catch landed on the right this year or the two before)
  minLeft:1,      // a structure quota with under one game year left cannot be put out
  lens:[11, 15, 21]   // the length rule's limits (§ 6)
};
// the top of each quota length (a right «under 11 m» is under 11, 15 and 21; 14–14.9 m is under 15 and 21)
const KM_TOP = {u7:7, h7:8, h8:9, h9:10, h10:11, h14:15, h20:21};
const kmF = (n, d) => typeof fmt === 'function' ? fmt(n, d) : (+n).toFixed(d);   // (fmt is the UI's; the unit tests run the core alone)
const kmYear = H => yearH(H) + doyH(H) / 365;   // the game year with its fraction (for the years a structure quota has left)
const kmLeft = (s, H) => clamp(s.until - kmYear(H), 0, STRUCT.years);
// the quota factors a good carries: a right its own and the structure quotas that go with it; a structure quota its own
function kmKf(item){ if (!item || !HJ[item.id]) return 0; if (item.kind === 'struct') return +item.kf || 0; return HJ[item.id].kf + (item.st || []).reduce((a, s) => a + s.kf, 0); }
// the year's cod quota on a good, kg (factor × the group's unit for the year: the same for every save with WORLD_SEED)
function kmCod(item, H){ const R = item && HJ[item.id]; if (!R) return 0; return Math.round(kmKf(item) * yearQuota(yearH(H == null ? S.t / 60 : H)).unit[R.grp] * 1000); }
// the takst: a right is the year's cod quota at the quota price (kpkAt); a structure quota the same for its factor, times the years left over 20 (linear:
// the time limit came so the quota could be written off over the period, høringsnotatet 26.03.2026 kap. 6.1; an assumption). A right
// with structure quotas carries them, each at its own takst
function kmTakst(item, H){
  H = H == null ? S.t / 60 : H; const R = item && HJ[item.id]; if (!R) return 0; const unit = yearQuota(yearH(H)).unit[R.grp] * 1000;
  const k = kpkAt(H), st = s => s.kf * unit * k * kmLeft(s, H) / STRUCT.years;
  if (item.kind === 'struct') return Math.round(st(item));
  return structPrice(item.id, H) + Math.round((item.st || []).reduce((a, s) => a + st(s), 0));   // (the own part as the register's price: licQ at kpkAt)
}
// the price band: the start price from 40 % and buy-now up to 160 % of the takst, the next bid 2 % over (B's limits, MB)
// (mbPriceWhy and mbNext in 09k-market.js serve the market as they are)
const kmBounds = mbBounds;
// the quick sale to the register: 90 % of the takst (V3 A: the register is the floor)
const kmQuick = (item, H) => Math.round(kmTakst(item, H) * MB.quick);

// ---- the free right (V2 A, § 7): a right in the company without a boat, at most two game years, then back to the register ----
// S.licFree = [{id, flen, st, landY, used, y, H0, until}]. kmFree(H) lets the ones whose time is up go: called at the new year, and by a
// page before it lists them (KM3), never by the checks below, which only read (so an index a page holds still points at the same right)
const kmFreeList = () => S.licFree || (S.licFree = []);
function kmFree(H){
  H = H == null ? S.t / 60 : H; const F = kmFreeList();
  for (const f of F.slice()) if (!(H < f.until)){
    if (typeof kmState === 'function' && kmState().out[kmFreeKey(f)]) continue;   // (KM3: out in the quota market: it goes when that sale is over, or to the buyer)
    F.splice(F.indexOf(f), 1); if (!HJ[f.id]) continue; regFree(f.id);
    msg('Fiskeridirektoratet', 'Tilsagnet om hjemmelen ' + HJ[f.id].hl + ' har gått ut etter to år uten båt. Hjemmelen er tilbake i registeret' + ((f.st || []).length ? ', og strukturkvotene som fulgte den, er fordelt tilbake til gruppen.' : '.'),
      'The promise of the ' + HJ[f.id].hl + ' quota length right has run out after two years without a boat. The right is back in the register' + ((f.st || []).length ? ', and its structure quotas have gone back to the group.' : '.'));
  }
  return F;
}
// (H0 is part of the seller's key for a free right, kmFreeKey in 09k-market.js: two of the same quota length never share an hour; KM3)
function kmFreeAdd(item, H){ const F = kmFreeList(); let h0 = H; while (F.some(f => f.id === item.id && Math.round(f.H0 || 0) === Math.round(h0))) h0 += 1;
  F.push({id:item.id, flen:item.flen || 0, st:(item.st || []).map(s => ({...s})), landY:item.landY, used:item.used || null, y:item.y, H0:h0, until:H + KM.freeY * 8760}); return F[F.length - 1]; }

// ---- why it cannot be put out (a word), or null. src = {v, kind:'right'|'struct'|'two', i} for a boat's, {free:i} for a free right ----
//   gone, none (no right), hav (the ocean permits are sold with the vessel at the yard), two (the second quota from the special scheme
//   falls away, kap. 2 § 6), listed, sea, busy (landing), drift (no catch landed on it this year or the two before, when KM.drift is on),
//   coop (in a quota cooperation this year), short (a structure quota with under a year left)
function kmWhy(src, H){
  H = H == null ? S.t / 60 : H; const y = yearH(H);
  if (!src) return 'gone';
  if (src.free != null){ const f = kmFreeList()[src.free]; if (!f || !HJ[f.id] || !(H < f.until)) return 'gone'; if (KM.drift && !(f.landY >= y - KM.driftY)) return 'drift'; return null; }
  const v = src.v; if (!v || !S.fleet.includes(v)) return 'gone';
  const l = vget(v, 'lic'), b = vget(v, 'boat'); if (!l) return 'none'; if (l.hav || !HJ[l.id]) return 'hav';
  if (src.kind === 'two') return l.two ? 'two' : 'none';
  if (b.sale) return 'listed'; if (b.status !== 'port') return 'sea'; if (b.land || b.landQ) return 'busy';
  if (src.kind === 'struct'){ const s = (l.st || [])[src.i]; if (!s) return 'gone'; return kmLeft(s, H) < KM.minLeft ? 'short' : null; }
  if (src.kind !== 'right') return 'gone';
  if (KM.drift && !(l.landY >= y - KM.driftY)) return 'drift';
  if (l.coop && l.coop.y === y) return 'coop';
  return null;
}
// ---- the good as it travels (to the server and the buyer): nothing about who. A right takes its structure quotas and this year's catch on
// it (the buyer starts the year with it, § 29); the second quota from the special scheme is not in it (kap. 2 § 6). flen: the largest
// length of the boat it leaves (the length rule). A structure quota takes its share of the boat's catch this year, by its factor ----
function kmPack(src, H){
  H = H == null ? S.t / 60 : H; const y = yearH(H), cp = st => (st || []).map(s => ({id:s.id, kf:s.kf, from:s.from, until:s.until}));
  if (src && src.free != null){ const f = kmFreeList()[src.free]; if (!f || !HJ[f.id]) return null; return {kind:'right', id:f.id, hl:HJ[f.id].hl, flen:f.flen, st:cp(f.st), landY:f.landY, used:f.y === y && f.used ? f.used : {torsk:0, hyse:0, sei:0}, y}; }
  const v = src && src.v, l = v && vget(v, 'lic'); if (!l || !HJ[l.id]) return null;
  const q = vget(v, 'quota'), u = q && q.y === y ? {torsk:Math.round(q.torsk || 0), hyse:Math.round(q.hyse || 0), sei:Math.round(q.sei || 0)} : {torsk:0, hyse:0, sei:0};
  if (src.kind === 'struct'){ const s = (l.st || [])[src.i]; if (!s) return null; return {kind:'struct', id:s.id, hl:HJ[s.id].hl, kf:s.kf, from:s.from, until:s.until, used:kmShare(u, l, s), y}; }
  return {kind:'right', id:l.id, hl:HJ[l.id].hl, flen:(VESSELS[vget(v, 'boat').type] || {}).len || 0, st:cp(l.st), landY:l.landY, used:u, y};
}
// a structure quota's share of the boat's catch this year, by its factor
function kmShare(u, l, s){ const f = s.kf / (HJ[l.id].kf + (l.extra || 0)); return {torsk:Math.round((u.torsk || 0) * f), hyse:Math.round((u.hyse || 0) * f), sei:Math.round((u.sei || 0) * f)}; }
// ---- the seller's side: the right or the structure quota leaves the boat (or the free right the company). The boat stays in the company
// without the right; what she fished on it goes with it, so her quota starts afresh. Returns what fell away (the second quota) ----
function kmOut(src, H){
  H = H == null ? S.t / 60 : H;
  if (src && src.free != null){ const F = kmFreeList(); if (!F[src.free]) return null; F.splice(src.free, 1); return {two:null}; }
  const v = src && src.v, l = v && vget(v, 'lic'); if (!l) return null;
  if (src.kind === 'struct'){ const s = (l.st || [])[src.i]; if (!s) return null;
    // (its share of the catch goes with it to the buyer, kmPack, so it comes off this boat's: the same kilos are never counted twice)
    withVessel(v, () => { const q = quotaState(), d = kmShare(q, l, s); q.torsk = Math.max(0, q.torsk - d.torsk); q.hyse = Math.max(0, q.hyse - d.hyse); q.sei = Math.max(0, q.sei - d.sei); });
    l.st.splice(src.i, 1); licExtra(l); return {two:null}; }
  const two = l.two || null;
  // (without a right in the company she may be the open-group boat again: the owner's open-group catch this year follows her, § 29)
  withVessel(v, () => { S.lic = null; freshQuota(); if (openVesselId() === v.id) openUsedLoad(); });
  return {two};
}
// ---- the buyer's side. to = {v, how}: put (the right on a boat without one: she joins the closed group), struct (structured onto a boat
// with a right in the same group: its factor less 10 % for 20 years, its structure quotas as they are; a structure quota as it is, its
// years running on), or free (kept in the company without a boat, two years; KM4). Fiskeridirektoratet approves at the settlement and
// sends word (no waiting for the case work: Friction for Flow). Returns the quota factor the boat got, or null ----
function kmApply(item, to, H){
  H = H == null ? S.t / 60 : H; const y = yearH(H); if (!item || !HJ[item.id] || !to) return null;
  const used = item.used ? (item.y === y ? item.used : {torsk:0, hyse:0, sei:0}) : null;   // (a right packed last year carries nothing fished this year; null: unknown, as from the register)
  if (to.how === 'free'){ if (item.kind !== 'right') return null; kmFreeAdd(item, H); return 0; }
  const v = to.v; if (!v || !S.fleet.includes(v)) return null; const nm = vget(v, 'boatName');
  if (to.how === 'put'){
    if (item.kind !== 'right' || vget(v, 'lic')) return null;
    const ov = openVesselId(); if (ov) openUsedSave(vget(vesselById(ov), 'quota'));   // (the open group's catch follows the owner, § 29, as at the yard)
    const lic = {id:item.id, hl:HJ[item.id].hl, kpk:kpkAt(H), since:y, from:'', st:(item.st || []).map(s => ({...s}))}; if (item.landY != null) lic.landY = item.landY; licExtra(lic);
    const fished = withVessel(v, () => { S.lic = lic; const q = freshQuota();
      if (used){ q.torsk = used.torsk || 0; q.hyse = used.hyse || 0; q.sei = used.sei || 0; } else q.torsk = Math.round(licQ(lic, H).torsk * sellerCod(lic.id, H));
      q.seller = q.torsk; return q.torsk; });
    msg('Fiskeridirektoratet', 'Hjemmelen ' + HJ[item.id].hl + ' er flyttet til «' + nm + '», som nå er i lukket gruppe. Fartøykvoten for torsk i år er ' + kmF(kmCod(item, H) / 1000, 2) + ' tonn, og ' + kmF(fished / 1000, 2) + ' tonn av den er fisket (§ 29).',
      'The ' + HJ[item.id].hl + ' quota length right has been moved to the «' + nm + '», which is now in the closed group. The vessel quota for cod this year is ' + kmF(kmCod(item, H) / 1000, 2) + ' t, and ' + kmF(fished / 1000, 2) + ' t of it is fished (§ 29).');
    return kmKf(item);
  }
  if (to.how !== 'struct') return null;
  const l = vget(v, 'lic'); if (!l || kmStructWhy(l, item)) return null;
  const add = item.kind === 'struct' ? [{id:item.id, kf:item.kf, from:item.from, until:item.until}]
    : [{id:item.id, kf:HJ[item.id].kf * (1 - STRUCT.cut), from:y, until:y + STRUCT.years}].concat((item.st || []).map(s => ({...s})));
  l.st = (l.st || []).concat(add); licExtra(l);
  if (used) withVessel(v, () => { const q = quotaState(); q.torsk += used.torsk || 0; q.hyse += used.hyse || 0; q.sei += used.sei || 0; });   // (what the seller fished on it this year)
  const k = add.reduce((a, s) => a + s.kf, 0);
  msg('Fiskeridirektoratet', 'Strukturkvoten er tildelt «' + nm + '»: kvotefaktor ' + kmF(k, 4) + ' (' + HJ[item.id].hl + ')' + (item.kind === 'struct' ? ', med ' + kmF(kmLeft(item, H), 1) + ' år igjen.' : ', i 20 år. Fartøyet den kom fra, er meldt ut av registeret.'),
    'The structure quota is granted to the «' + nm + '»: quota factor ' + kmF(k, 4) + ' (' + HJ[item.id].hl + ')' + (item.kind === 'struct' ? ', with ' + kmF(kmLeft(item, H), 1) + ' years left.' : ', for 20 years. The vessel it came from is struck off the register.'));
  return k;
}
// the factors structuring adds (a right less 10 %, its structure quotas as they are; a structure quota as it is), and whether they fit
const kmAddKf = item => item.kind === 'struct' ? +item.kf || 0 : HJ[item.id].kf * (1 - STRUCT.cut) + (item.st || []).reduce((a, s) => a + s.kf, 0);
function kmStructWhy(l, item){
  const A = l && HJ[l.id]; if (!A || l.hav) return 'nolic';
  if (A.grp === 'u11' || A.grp !== HJ[item.id].grp) return 'group';   // (§ 9: quota lengths 11–27.99 m, in the same group)
  return structFits(l, kmAddKf(item)) ? null : 'cap';
}
// the length rule (§ 6): a right under 11, 15 or 21 m quota length that belongs to a boat under that largest length cannot be moved to a
// boat at or over it
function kmLenWhy(item, len){ const top = KM_TOP[item.id]; for (const T of KM.lens) if (top <= T && (item.flen || 0) < T && len >= T) return T; return 0; }
// ---- why the buyer cannot take it (a word), or null. to = {v, how}; kr0 what the bid binds:
//   gone, own, bladb (deltakerloven § 6), how (a structure quota is only structured; a right is put on a boat or structured), boat, type
//   (an ocean vessel), listed, haslic (put on a boat that has a right), len (the length rule), nolic, group, cap (structuring), cash
function kmBuyWhy(item, to, kr0){
  if (!item || !HJ[item.id]) return 'gone'; if (item.mine) return 'own'; if (!bladB()) return 'bladb';
  const how = to && to.how; if (how !== 'put' && how !== 'struct') return 'how'; if (item.kind === 'struct' && how !== 'struct') return 'how';
  const v = to.v; if (!v || !S.fleet.includes(v)) return 'boat'; const b = vget(v, 'boat'), V = VESSELS[b.type]; if (!V || V.cls === 'hav') return 'type'; if (b.sale) return 'listed';
  if (how === 'put'){ if (vget(v, 'lic')) return 'haslic'; if (kmLenWhy(item, V.len)) return 'len'; }
  else { const w = kmStructWhy(vget(v, 'lic'), item); if (w) return w; }
  if (kr0 != null && spendable() < kr0) return 'cash';
  return null;
}
