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
}
