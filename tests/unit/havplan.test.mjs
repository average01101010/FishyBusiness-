// Havsteget H2c (docs/planer/havsteget-h2-autoline.md, 05.11.2026): the ocean vessel's day on Driftsplan 2 (core/06g-plan2.js
// planDayAuto) and the reasons a trip ends (p2AutoEnd), on a state made here: the autoline in a loop on the fields (set, the soak, hauled
// and set again at once by the machine), the bait and the lenker that limit it, and the trip's end (the hold, the bait, the fuel, the
// provisions, the days, the gear fetched) with the strings hauled home to the magazines and nothing set.
export default function (t){
  const K = t.K, {planDayAuto, p2AutoEnd, p2AutoH, DRP2, EPOCH, newState} = K;
  if (!('fmt' in globalThis)) globalThis.fmt = (x, d) => x.toFixed(d).replace('.', ',');   // (the UI's, ui/02-format-state.js)
  K.set('S', newState());
  const A = p2AutoH(), H0 = (Date.UTC(2027, 2, 9, 6) - EPOCH) / 36e5;
  t.near(A.set, 5000 / (3 * 3600), 1e-9, 'en lenke settes på ' + (A.set * 60).toFixed(0) + ' min (3 krok i sekundet)');
  t.near(A.haul, 2, 1e-9, 'en lenke trekkes på 2 t (2 500 krok i timen)');
  t.ok(A.bait === 85, 'en lenke tar 85 kg agn (om lag 17 g per krok)');
  // the fields 10 km apart, the boat at the first, no plant known (the legs are straight with a fifth on)
  const F = [{id:'f1', k:'felt', x:500, y:300, n:4, soak:6, lk:'auto'}, {id:'f2', k:'felt', x:510, y:300, n:4, soak:6, lk:'auto'}];
  const o = (over) => Object.assign({places:F.map(q => ({...q})), rig:'line', land:{mode:'near', port:null, when:'full', days:42}, legs:{}, M:null, home:null, wx:{wind:18, hs:5}}, over || {});
  const st = (over) => Object.assign({H:H0, at:{p:{x:500, y:300}, port:null}, hold:0, cap:400000, sets:[], crew:[], me:{aboard:false, energy:100}, v:11, lag:14,
    auto:{n:8, bait:30000}, left:{fuel:20, prov:40, hold:30, home:{days:0.3}}, tripD:2, lost:[]}, over || {});
  const ks = d => d.steps.map(s => s.k + (s.again ? '+' : '') + (s.reset ? 'r' : ''));
  // the loop: both fields set, the first hauled when its soak is up and set again at once, the second after it
  { const d = planDayAuto(o(), H0, st()), k = ks(d);
    t.ok(k[0] === 'avgang' && k[1] === 'lagvakt', 'dagen begynner med avgangen og lagenes vakter (' + k.slice(0, 2) + ')');
    t.ok(k.filter(x => x === 'sett').length === 2 && k.includes('trekkr') && k.includes('sett+'), 'begge feltene settes, trekkes og settes ut igjen med én gang (' + k.join(' ') + ')');
    const tr = d.steps.filter(s => s.k === 'trekk');
    t.ok(tr.every(s => s.t >= s.due - 1e-9), 'ingen lenke trekkes før ståtida er ute');
    t.ok(tr.every(s => s.soakH >= 6 - 1e-6), 'ståtida er minst 6 t på hvert drag (' + tr.map(s => s.soakH.toFixed(1)).join(', ') + ')');
    t.ok(!k.includes('lever') && !k.includes('hjem') && d.auto, 'ute på havet: ingen vei til mottaket eller hjem, dagen ender ved redskapet');
    const s1 = d.steps.find(s => s.k === 'sett'), t1 = d.steps.find(s => s.k === 'trekk');
    t.near(s1.h, 4 * A.set, 1e-9, 'fire lenker settes på ' + (s1.h * 60).toFixed(0) + ' min');
    t.near(t1.h, 4 * A.haul, 1e-9, 'fire lenker trekkes på 8 t'); }
  // the lenker and the bait limit it
  { const d = planDayAuto(o(), H0, st({auto:{n:4, bait:30000}})), k = ks(d);
    t.ok(k.filter(x => x === 'sett').length === 1 && d.skipped.some(x => x.id === 'f2' && /ingen lenker/.test(x.no)), 'fire lenker på magasinene: felt 2 venter, «ingen lenker igjen» (' + k.join(' ') + ')'); }
  { const d = planDayAuto(o(), H0, st({auto:{n:8, bait:85 * 8}})), k = ks(d);
    t.ok(k.filter(x => x === 'sett').length === 2 && !k.includes('sett+') && k.filter(x => x === 'trekk').length === 2, 'agn til én runde: begge feltene settes, trekkes inn på magasinene og settes ikke igjen (' + k.join(' ') + ')'); }
  // the trip's end: the reasons, in order, and at port none for the bait (it is bought at the plant)
  { const e = (ov, oo) => p2AutoEnd(o(oo), st(ov));
    t.ok(e() === null, 'alt i orden: turen går videre');
    t.ok(/95 % full/.test((e({hold:380000}) || [''])[0]), 'lasten 95 % full: turen er over (' + (e({hold:380000}) || [''])[0] + ')');
    t.ok(e({hold:370000}) === null, 'lasten 92 %: videre');
    t.ok(/agnet/.test((e({auto:{n:0, bait:600}}) || [''])[0]), 'agn til mindre enn en runde (8 lenker × 85 kg) ute på havet: turen er over');
    t.ok(e({auto:{n:8, bait:0}, at:{p:{x:0, y:0}, port:'x'}, left:null}) === null, 'i havn uten agn: ingen grunn til å avslutte, agnet kjøpes på mottaket');
    t.ok(/drivstoffet/.test((e({left:{fuel:0.8, prov:40, home:{days:0.3}}}) || [''])[0]), 'drivstoffet rekker under et døgn til før det trengs for å gå inn: turen er over');
    t.ok(/provianten/.test((e({left:{fuel:20, prov:1.2, home:{days:0.5}}}) || [''])[0]), 'provianten rekker 1,2 døgn og veien inn tar et halvt: turen er over');
    t.ok(e({tripD:41}, {land:{mode:'near', when:'days', days:42}}) === null && /42 døgn/.test((e({tripD:42.1}, {land:{mode:'near', when:'days', days:42}}) || [''])[0]), 'turer på høyst 42 døgn: videre etter 41, over etter 42');
    t.ok(/hentes/.test((e({}, {fetch:true}) || [''])[0]), '«Hent redskapet»: turen er over'); }
  // at the end the strings are hauled home whatever the hour, nothing is set, and with a plant known she goes there to land
  { const sets = [{fid:'f1', kind:'line', n:4, tSet:H0 * 60 - 120, x:500, y:300}, {fid:'f2', kind:'line', n:4, tSet:H0 * 60 - 60, x:510, y:300}];
    const d = planDayAuto(o(), H0, st({hold:380000, sets})), k = ks(d);
    t.ok(k.filter(x => x === 'trekk').length === 2 && !k.some(x => x.startsWith('sett')), 'lasten full: begge lenkene trekkes inn på magasinene, ingenting settes (' + k.join(' ') + ')');
    t.ok(d.steps.filter(s => s.k === 'trekk').every(s => s.t >= s.due - 1e-9), 'også da står lenkene ståtida ut');
    t.ok(/turen er over: lasten/.test(d.why[0]), 'dagen sier hvorfor: «' + d.why[0] + '»'); }
  t.ok(DRP2.hav.wx.normal.wind === 18 && DRP2.hav.wx.normal.hs === 5, 'arbeidsgrensen «Vanlig» for havbåten er 18 m/s og 5 m');

  // ===== the snow crab vessel on Driftsplan 2 (H3c, 06i-plan2-sno.js): the strings, the loop, the trip's end, the close season, the
  // quota, the drift ice and the losses
  {
    const {planDaySno, p2SnoLenke, p2SnoSeason, p2SnoEnd, SNOC, SNOI, POTS, DRP2, natP, seaIceAt, snoIceOf, snoIceHour, hsAt} = K, D = DRP2.sno;
    const keep = {}; for (const [n, f] of [['isLand', () => false], ['depthF', () => 300], ['legClear', () => true], ['ruBlockMsg', () => null], ['inHarbour', () => false]]){ keep[n] = K.get(n); K.set(n, f); }
    const Hd = (y, m, d, h = 6) => (Date.UTC(y, m - 1, d, h) - EPOCH) / 36e5, A = {set:SNOC.lenke * POTS.sno.set / 60, haul:SNOC.lenke * POTS.sno.haul / 60, bait:SNOC.lenke * POTS.sno.bait};
    const sent = natP(74.8, 34.6), sent2 = natP(74.9, 35.4);
    const field = (id, p, n, soakD) => ({id, k:'felt', x:p.x, y:p.y, n, soak:soakD * 24, hdg:null});
    const oS = over => Object.assign({places:[field('f1', sent, 10, 7), field('f2', sent2, 6, 7)], rig:'teiner', land:{mode:'near', port:null, when:'days', days:20}, legs:{}, M:null, home:null, wx:{wind:18, hs:5}}, over || {});
    const stS = (H, over, zo) => { const o = Object.assign({H, at:{p:{x:sent.x, y:sent.y}, port:null}, hold:0, cap:500000, sets:[], crew:[], me:{aboard:false, energy:100}, v:11, lag:22, left:{fuel:20, prov:20, home:{days:0.6}}, tripD:3, lost:[]}, over || {});
      o.sno = Object.assign({pots:8000, bait:20000, live:false, tank:0, tankCap:40000, age:null, q:400000, extraLeft:0, season:p2SnoSeason(H, 16), nL:16}, zo || {}); return o; };
    const lenkeSet = (q, k, tSetH) => { const L = p2SnoLenke(q, k); return {fid:L.fid, kind:'teine', n:200, tSet:Math.round(tSetH * 60), x:(L.a.x + L.b.x) / 2, y:(L.a.y + L.b.y) / 2, a:L.a, b:L.b}; };
    const ks = d => d.steps.map(s => s.k + (s.again ? '+' : '') + (s.k === 'trekk' && !s.reset ? '!' : ''));
    // the strings of a field: side by side 2 km apart, eight in a row, the rows 6.5 km apart, 5 km each
    { const q = field('f1', sent, 10, 7), L = [...Array(10).keys()].map(k => p2SnoLenke(q, k));
      t.near(Math.hypot(L[0].b.x - L[0].a.x, L[0].b.y - L[0].a.y), 5, 1e-9, 'en lenke er 5 km (200 teiner med 25 m mellom)');
      t.near(Math.hypot(L[1].a.x - L[0].a.x, L[1].a.y - L[0].a.y), D.col, 1e-9, 'lenkene står ' + D.col + ' km fra hverandre');
      t.near(Math.hypot(L[8].a.x - L[0].a.x, L[8].a.y - L[0].a.y), D.row, 1e-9, 'åtte i rekka, og den niende i neste rekke ' + D.row + ' km bak');
      t.ok(new Set(L.map(x => x.fid)).size === 10 && L[3].fid === 'f1#3', 'hver lenke har sin egen id på feltet (' + L[3].fid + ')'); }
    // the season (J-237-2025 § 5): open from 1 December to 30 June, the last string in by the margin and the hauls
    { const sJ = p2SnoSeason(Hd(2027, 1, 15), 40), sA = p2SnoSeason(Hd(2027, 8, 10), 40), sD = p2SnoSeason(Hd(2027, 12, 3), 40);
      t.ok(sJ.open && Math.abs(sJ.close - Hd(2027, 7, 1, 0)) < 1e-6, 'januar er åpent, og fredningen begynner 1. juli');
      const back = (sJ.close - sJ.inBy) / 24; t.ok(back > D.margin + 40 * A.haul / 24 - 0.01 && back < 10, 'med 40 lenker må de være på vei inn ' + back.toFixed(1) + ' døgn før 1. juli');
      t.ok(!sA.open && Math.abs(sA.openAt - Hd(2027, 12, 1, 0)) < 1e-6, 'august er fredet, og det åpner 1. desember');
      t.ok(sD.open && Math.abs(sD.close - Hd(2028, 7, 1, 0)) < 1e-6, 'desember er åpent, og stengingen er 1. juli året etter'); }
    // the loop at sea in January: what stands is hauled when its soak is up (never before), set out again at once, in the order they fall due
    const H0 = Hd(2027, 1, 20);
    { const o = oS(), F = o.places, sets = []; for (let k = 0; k < 10; k++) sets.push(lenkeSet(F[0], k, H0 - 7 * 24 + k * 3)); for (let k = 0; k < 6; k++) sets.push(lenkeSet(F[1], k, H0 - 3 * 24 + k * 3));
      const d = planDaySno(o, H0, stS(H0, {sets})), k = ks(d), tr = d.steps.filter(s => s.k === 'trekk');
      t.ok(d.sno && d.auto && k[0] === 'avgang' && k[1] === 'lagvakt', 'dagen er snøkrabbefartøyets, med lagenes vakter (' + k.slice(0, 2) + ')');
      t.ok(tr.length >= 5 && tr.every(s => s.t >= s.due - 1e-9) && tr.every(s => s.soakH >= 7 * 24 - 1e-6), 'lenkene trekkes når ståtida på 7 døgn er ute, aldri før (' + tr.length + ' trekk, ' + tr.map(s => (s.soakH / 24).toFixed(1)).slice(0, 4).join(', ') + ' døgn)');
      t.ok(tr.every((s, i) => i === 0 || s.due >= tr[i - 1].due - 1e-9), 'i den rekkefølgen ståtida går ut');
      t.ok(tr.every(s => s.reset) && k.filter(x => x === 'sett+').length === tr.length, 'hver lenke settes ut igjen med én gang');
      t.ok(tr.every(s => s.pid === 'f1') && !k.includes('lever') && !k.includes('hjem'), 'felt 2 står (ståtida er ikke ute), og dagen ender ute ved lenkene');
      t.ok(d.skipped.some(x => x.id === 'f2' && /6 lenker står til ståtida er ute/.test(x.no)), 'dagen sier at seks lenker står på felt 2: «' + (d.skipped.find(x => x.id === 'f2') || {no:''}).no + '»');
      t.near(tr[0].h, A.haul, 1e-9, 'en lenke trekkes på ' + A.haul.toFixed(1) + ' t (50 s per teine)'); }
    // she does not lie idle for days: strings that have stood five days of a week's soak (the way back from the plant) are hauled now,
    // the longest-standing first, and set out again; with two hours to the next she waits for it
    { const o = oS(), sets = []; for (let k = 0; k < 10; k++) sets.push(lenkeSet(o.places[0], k, H0 - 5 * 24 + k * 0.1));
      const d = planDaySno(o, H0, stS(H0, {sets})), tr = d.steps.filter(s => s.k === 'trekk');
      t.ok(tr.length >= 5 && tr.every(s => s.now && s.due == null && s.reset) && tr[0].ln === 0 && !d.steps.some(s => s.k === 'vent'), 'lenkene har stått fem døgn: de eldste trekkes nå i stedet for å vente to døgn (' + tr.length + ' trekk, ' + tr.map(s => (s.soakH / 24).toFixed(1)).slice(0, 3).join(', ') + ' døgn)');
      const s2 = [lenkeSet(o.places[0], 0, H0 - 7 * 24 + 2)], d2 = planDaySno(oS({places:[field('f1', sent, 1, 7)]}), H0, stS(H0, {sets:s2}));
      t.ok(d2.steps.some(s => s.k === 'vent') && d2.steps.find(s => s.k === 'trekk' && !s.now), 'med to timer igjen av ståtida venter skipet ved lenka'); }
    // the empty fields are set as far as the pots go; the rest stays aboard
    { const d = planDaySno(oS(), H0, stS(H0, {}, {pots:1000})), k = ks(d);
      t.ok(k.filter(x => x === 'sett').length === 5 && d.skipped.some(x => x.id === 'f1' && /5 lenker står om bord/.test(x.no)), '1 000 teiner om bord: fem lenker settes, resten «står om bord» (' + d.skipped.map(x => x.no).join(' | ') + ')'); }
    // the trip's end, frozen: the provisions short: the strings stand while she lands, but one that would pass 18 days before she is back is tended first
    { const o = oS(), F = o.places, sets = []; for (let k = 0; k < 10; k++) sets.push(lenkeSet(F[0], k, H0 - (k === 0 ? 17 : 4) * 24));
      const e = p2SnoEnd(o, stS(H0, {left:{fuel:20, prov:1.2, home:{days:0.6}}}));
      t.ok(e && !e.all && /provianten/.test(e.why[0]), 'provianten rekker ikke: turen er over, lenkene står (' + (e && e.why[0]) + ')');
      const BF = K.PORTS.find(p => p.name === 'Båtsfjord'); o.M = BF.id;
      const d = planDaySno(o, H0, stS(H0, {sets, left:{fuel:20, prov:1.2, home:{days:0.6}}})), k = ks(d), tr = d.steps.filter(s => s.k === 'trekk');
      t.ok(tr.length === 1 && tr[0].ln === 0 && k[k.length - 1] === 'lever', 'lenka som har stått 17 døgn, trekkes før skipet går til mottaket (§ 18); de andre står (' + k.join(' ') + ')'); }
    // live: the tanks full, or the oldest crab six days in them
    { const o = oS();
      t.ok(/tankene er fulle/.test((p2SnoEnd(o, stS(H0, {}, {live:true, tank:38500})) || {why:['']}).why[0]), 'levende: tankene 96 % fulle: turen er over');
      t.ok(p2SnoEnd(o, stS(H0, {}, {live:true, tank:30000, age:5})) === null, 'levende: tankene 75 % og den eldste krabben fem døgn: videre');
      t.ok(/eldste krabben/.test((p2SnoEnd(o, stS(H0, {}, {live:true, tank:20000, age:6.2})) || {why:['']}).why[0]), 'levende: den eldste krabben over ' + D.age + ' døgn i tankene: turen er over');
      t.ok(/20 døgn/.test((p2SnoEnd(o, stS(H0, {tripD:20.2})) || {why:['']}).why[0]) && p2SnoEnd(o, stS(H0, {tripD:19})) === null, 'fryst: turen er over etter 20 døgn'); }
    // the close season: late in June nothing is set (it would stand past 1 July), and from the hour they must come in, every string is
    // hauled now, then to the plant; in August with nothing in the sea she waits in port until 1 December, out in time to set
    { const o = oS(), Hj = Hd(2027, 6, 22), sJ = p2SnoSeason(Hj, 16);
      const d1 = planDaySno(o, Hj, stS(Hj)); t.ok(!ks(d1).some(x => x.startsWith('sett')) && d1.skipped.some(x => /fredningen/.test(x.no)), '22. juni: ingen lenker settes, de ville stått over fristen før 1. juli (' + (d1.skipped[0] || {no:''}).no + ')');
      const Hk = sJ.inBy + 1, sets = []; for (let k = 0; k < 10; k++) sets.push(lenkeSet(o.places[0], k, Hk - 2 * 24));
      const d2 = planDaySno(o, Hk, stS(Hk, {sets})), tr = d2.steps.filter(s => s.k === 'trekk');
      t.ok(tr.length === 10 && tr.every(s => !s.reset) && !ks(d2).some(x => x.startsWith('sett')), 'etter fristen trekkes alle ti lenkene inn med teinene om bord, også de som har stått to døgn');
      const Ha = Hd(2027, 8, 10), BF = K.PORTS.find(p => p.name === 'Båtsfjord');
      const d3 = planDaySno(oS({M:BF.id, home:BF.id}), Ha, stS(Ha, {at:{p:BF.p, port:BF.id}}));
      t.ok(!d3.steps.length && d3.idleUntil > Ha && d3.idleUntil <= Ha + 24 + 1e-6 && /fredningen/.test(d3.why[0]), 'august i havn: ingenting å gjøre, planen ser på det igjen om et døgn (' + d3.why[0].slice(0, 50) + ' …)');
      const Hn = Hd(2027, 11, 30, 12), d4 = planDaySno(oS({M:BF.id, home:BF.id}), Hn, stS(Hn, {at:{p:BF.p, port:BF.id}}));
      t.ok(!d4.steps.length && d4.idleUntil < Hd(2027, 12, 1, 0) && d4.idleUntil > Hn, '30. november: skipet går i tide til å sette 1. desember (kl. ' + ((d4.idleUntil % 24 + 24) % 24).toFixed(1) + ')'); }
    // the quota: short of a string, nothing is set and what stands comes in; used up, every string comes in now
    { const o = oS(), sets = []; for (let k = 0; k < 4; k++) sets.push(lenkeSet(o.places[0], k, H0 - 7 * 24 - k));
      const d1 = planDaySno(o, H0, stS(H0, {sets}, {q:5500})), tr1 = d1.steps.filter(s => s.k === 'trekk');
      t.ok(tr1.length && tr1.every(s => !s.reset) && !ks(d1).includes('sett'), 'kvoten rekker fire lenker til: det som står, trekkes inn, ingenting settes ut igjen');
      const e = p2SnoEnd(o, stS(H0, {sets}, {q:300, extraLeft:110000})); t.ok(e && e.all && /kvoten for 2027 er tatt; tilleggskvoten \(110 t\) kan bare tas med levende krabbe/.test(e.why[0]), 'kvoten tatt: alle lenkene inn, og planen sier at tilleggskvoten bare kan tas levende'); }
    // the drift ice (V3 B): nothing set where the ice edge (4/10) comes within the soak; a string the edge comes near is taken in early and
    // not set again; one under the ice is not hauled
    { const st77 = natP(77.25, 35.0), sb = natP(76.5, 33.0), Hm = Hd(2027, 3, 10);
      t.ok(seaIceAt(st77, Hm) >= SNOI.set && seaIceAt(sb, Hd(2027, 2, 1)) < SNOI.set, 'isen i middelet for 1991–2020: ' + seaIceAt(st77, Hm).toFixed(0) + ' % ved 77,25° N i mars, ' + seaIceAt(sb, Hd(2027, 2, 1)).toFixed(0) + ' % på Storbanken ved 76,5° N 1. februar');
      const o1 = oS({places:[field('f1', st77, 4, 7)]}), d1 = planDaySno(o1, Hm, stS(Hm));
      t.ok(!ks(d1).includes('sett') && d1.skipped.some(x => /drivisen kommer/.test(x.no)), 'i isen ved 77,25° N i mars settes ingenting: «' + (d1.skipped[0] || {no:''}).no + '»');
      // Storbanken at 76.5° N: the ice edge passes it in March; set late in February, the strings are taken in before it comes
      const Hf = Hd(2027, 2, 20), o2 = oS({places:[field('f1', sb, 4, 7)]}); let ih = null; for (let h = Hf; h < Hf + 60 * 24; h += 12) if (snoIceOf(p2SnoLenke(o2.places[0], 0).a, p2SnoLenke(o2.places[0], 0).b, h) >= SNOI.near){ ih = h; break; }
      t.ok(ih != null, 'iskanten (4/10) kommer over Storbanken ved 76,5° N ' + (ih ? new Date(EPOCH + ih * 36e5).toISOString().slice(0, 10) : 'aldri'));
      if (ih){ const sets = [0, 1, 2, 3].map(k => lenkeSet(o2.places[0], k, ih - 4 * 24 + k * 0.5)), Hq = ih - 1.5 * 24;
        const d2 = planDaySno(o2, Hq, stS(Hq, {sets})), tr = d2.steps.filter(s => s.k === 'trekk');
        t.ok(tr.length >= 3 && tr.every(s => !s.reset && s.soakH < 7 * 24) && !ks(d2).some(x => x.startsWith('sett')), 'før iskanten kommer, tas lenkene inn med teinene om bord, før ståtida er ute (' + tr.map(s => (s.soakH / 24).toFixed(1)).join(', ') + ' døgn)'); }
      const Hu = Hd(2027, 4, 15), su = [lenkeSet(o1.places[0], 0, Hu - 8 * 24)], d3 = planDaySno(o1, Hu, stS(Hu, {sets:su}));
      t.ok(!d3.steps.some(s => s.k === 'trekk') && d3.skipped.some(x => /under drivisen/.test(x.no)), 'en lenke under drivisen (' + Math.round(snoIceOf(su[0].a, su[0].b, Hu)) + ' %) trekkes ikke: «' + (d3.skipped[0] || {no:''}).no + '»'); }
    // the drift ice over a string in the sea (gearHour): the buoy lines cut, or the string dragged with the ice; nothing under 2/10
    { const R0 = Math.random; let a = 1; Math.random = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
      const mk = p => { const L = p2SnoLenke(field('f1', p, 1, 7), 0); return {id:'x', vid:K.get('S').cur, kind:'teine', pot:'sno', n:200, a:{...L.a}, b:{...L.b}, tSet:0, acc:{}, warn:0, cond:1, heavy:true}; };
      const run = (p, H, hrs) => { const sx = mk(p), a0 = {...sx.a}; let lost = null; for (let h = 0; h < hrs && !lost; h++) if (snoIceHour(sx, H + h)) lost = h; return {lost, moved:Math.hypot(sx.a.x - a0.x, sx.a.y - a0.y)}; };
      const S0 = K.get('S'); S0.sets = []; S0.gearLog = []; S0.fleet = S0.fleet || []; if (!('coordStr' in globalThis)) globalThis.coordStr = () => '?';   // (the UI's, ui/02-format-state.js)
      const z = run(sent, Hd(2027, 2, 1), 24 * 60); t.ok(z.lost == null && z.moved === 0, 'Sentralbanken (' + seaIceAt(sent, Hd(2027, 2, 1)).toFixed(0) + ' %): ingenting skjer med lenka på 60 døgn');
      // the losses at the ice's mean, a week at a time (many strings): about 1 % a week at the edge, more in closer ice
      const wk = (p, H) => { let n = 0, m = 0; for (let i = 0; i < 300; i++){ const r = run(p, H, 7 * 24); if (r.lost != null) n++; else m += r.moved; } return {pct:100 * n / 300, km:m / Math.max(1, 300 - n)}; };
      const w40 = wk(natP(76.5, 33.0), Hd(2027, 4, 1)), w75 = wk(natP(77.5, 34.0), Hd(2027, 3, 15));
      t.ok(w40.pct > 0.2 && w40.pct < 4, 'ved iskanten (' + seaIceAt(natP(76.5, 33.0), Hd(2027, 4, 1)).toFixed(0) + ' %) går ' + w40.pct.toFixed(1) + ' % av lenkene tapt på en uke, og de andre flyttes ' + w40.km.toFixed(1) + ' km');
      t.ok(w75.pct > w40.pct && w75.pct < 25 && w75.km > w40.km, 'i tett is (' + seaIceAt(natP(77.5, 34.0), Hd(2027, 3, 15)).toFixed(0) + ' %) mer: ' + w75.pct.toFixed(1) + ' % tapt på en uke, ' + w75.km.toFixed(1) + ' km dratt');
      Math.random = R0; }
    // the weather's losses together with the ice (H3b set SNOC.lossF): a season of 40 strings at Sentralbanken, December to June, every hour
    // (the open sea's waves, hsOpen: no map in the unit tests, and the bank is 300 km from land)
    { let E = 0, n = 0; for (let H = Hd(2026, 12, 1, 0); H < Hd(2027, 7, 1, 0); H++){ const hs = K.hsOpen(H, sent); E += (0.0002 + 0.008 * K.sstep(2.5, 5, hs) * 0.8 * 0.8) * 0.35 * SNOC.lossF; n++; }
      const lost = 40 * E; t.ok(lost > 0.15 && lost < 0.6, 'været tar ' + lost.toFixed(2) + ' lenker av 40 på en sesong på Sentralbanken (SNOC.lossF ' + SNOC.lossF + '), og drivisen resten der den kommer'); }
    // (found in the season run: before EPOCH the game's minutes are negative, and the pump at work read as free, so the plan cast off
    // with the tank empty; seen red before the fix: portBusy gave 0)
    { const S0 = K.get('S'), t0 = S0.t; S0.t = -30000; const b = {fueling:{until:-29940}}; t.ok(K.portBusy(b) === -29940, 'kaia er opptatt mens pumpa går, også før EPOCH (negative minutter): ' + K.portBusy(b));
      S0.t = 5000; t.ok(K.portBusy({fueling:{until:5060}}) === 5060 && K.portBusy({}) === 0 && K.portBusy({after:'fuel'}) === 5000, 'og som før etter EPOCH'); S0.t = t0; }
    // the fuel kept for the way in follows the speed she goes it: on the plan at full speed (851 l an hour on the snow crab vessel against
    // 400 at cruise); the season ran dry on the way in before (H3c)
    { const S0 = K.get('S'), b = S0.boat, keepB = {type:b.type, status:b.status, port:b.port, pos:b.pos, fuel:b.fuel, trip:b.trip}, keepP = S0.plan;
      b.type = 'snokrabbe'; K.applyVessel(); const B = K.get('BOAT'); b.status = 'sailing'; b.port = null; b.pos = natP(74.8, 34.0); b.fuel = 100000; b.trip = {t0:0, fuelL:0, iceKg:0, baitKr:0, seaM:0};
      S0.plan = null; const r0 = K.tripLeft(b), home = r0.home; S0.plan = {ops:true, speed:B.vmax, wps:[], idx:0}; const r1 = K.tripLeft(b);
      const keep0 = (b.fuel - r0.fuel * (B.plantLph * 24 + 1300)), keep1 = (b.fuel - r1.fuel * (B.plantLph * 24 + 1300));
      t.ok(home && keep1 > keep0 * 1.5 && keep1 < keep0 * 2.5, 'reserven for veien inn til ' + (home ? home.pt.name : '?') + ': ' + Math.round(keep0) + ' l i marsjfart, ' + Math.round(keep1) + ' l i full fart på planen');
      S0.plan = keepP; Object.assign(b, keepB); K.applyVessel(); }
    for (const nm in keep) K.set(nm, keep[nm]);
  }
}
