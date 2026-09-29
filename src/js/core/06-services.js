// ---------- services behind the phone ----------
function coverage(p){ const d = coastDist(p); return d < 3 ? 4 : d < 8 ? 3 : d < 14 ? 2 : d < 20 ? 1 : 0; }
function msg(from, no, en){ S.msgs.push({t:S.t, from, no, en, read:false}); if (S.msgs.length > 80) S.msgs.shift(); if (hooks.onMsg) hooks.onMsg(); }
function hourly(){
  const H = S.t / 60, b = S.boat, hr = gDate(H).getUTCHours(), bars = coverage(b.pos);
  // gale warning ahead (coast radio on VHF, or text message when there is coverage)
  if ((S.equip.vhf || bars > 0) && (S.lastGale || -1e9) < S.t - 12 * 60){
    let mx = 0, at = 0; for (let k = 1; k <= 12; k++){ const w = fcWind(H + k, H); if (w > mx){ mx = w; at = H + k; } }
    if (mx >= 13.9){ S.lastGale = S.t; const bft = beaufort(mx), kind = mx >= 20.8 ? ['Storm', 'Storm'] : mx >= 17.2 ? ['Sterk kuling', 'Severe gale'] : ['Kuling', 'Gale'];
      msg(S.equip.vhf ? 'Kystradio' : 'Værvarsel', kind[0] + ' ventet fra ' + dirName(windDir(at)) + ' rundt ' + hm(at) + ', ' + Math.round(mx) + ' m/s (styrke ' + bft + ').', kind[1] + ' expected from ' + DIRS.en[Math.round(windDir(at) / 45) % 8] + ' around ' + hm(at) + ', ' + Math.round(mx) + ' m/s (force ' + bft + ').'); }
  }
  // morning tip from the fish plant paying most for cod
  if (hr === 7){ let best = null; for (const q of PORTS) if (q.mottak){ const pr = price(q, 'torsk', H); if (!best || pr > best.pr) best = {q, pr}; }
    if (best && bars + (b.status === 'port' ? 4 : 0) > 0) msg(best.q.name + ' Fisk', 'God morgen! Vi betaler ' + Math.round(best.pr) + ' kr/kg for torsk i dag (A-kvalitet).', 'Good morning! We pay NOK ' + Math.round(best.pr) + '/kg for cod today (grade A).'); }
  // monthly loan payment
  if (S.loan && S.t >= S.loan.next){ const L = S.loan, r = L.rate / 12, int = L.bal * r, pay = Math.min(L.bal + int, L.pay); L.bal = L.bal + int - pay; S.cash -= pay; S.stats.costs += int; L.next += 30 * 24 * 60;
    msg('Kystbanken', 'Terminbeløp ' + Math.round(pay) + ' kr trukket. Restgjeld ' + Math.round(L.bal) + ' kr.', 'Instalment of NOK ' + Math.round(pay) + ' paid. Remaining NOK ' + Math.round(L.bal) + '.'); if (L.bal < 1) S.loan = null; }
  // yard: new vessel ready
  if (S.order && !S.order.told && S.t >= S.order.due){ S.order.told = true; msg('Verftet', 'Den nye båten er klar for overtakelse i Finnsnes.', 'Your new vessel is ready for handover in Finnsnes.'); }
  // engine service due
  if (svcOverdue() > 0 && !S.svcTold){ S.svcTold = true; msg('Verkstedet', 'Motoren har gått ' + Math.round(b.engH) + ' timer og er over tiden for service.', 'The engine has run ' + Math.round(b.engH) + ' hours and is overdue for a service.'); }
}
// other skippers for the leaderboard: deterministic weekly landings driven by season and weather
const SKIPPERS = [['Havørn', 'Husøy', 1.25], ['Mefjordingen', 'Senjahopen', 1.1], ['Grylle', 'Gryllefjord', 1.0], ['Botnværing', 'Botnhamn', 0.8], ['Nordstjerna', 'Husøy', 0.95], ['Senjabas', 'Senjahopen', 1.35], ['Kvitholmen', 'Gryllefjord', 0.7], ['Solbris', 'Finnsnes', 0.45], ['Tindvær', 'Husøy', 0.85], ['Laukvik', 'Gryllefjord', 0.6]];
function weekOf(H){ return Math.floor(H / (24 * 7)); }
function npcWeekKg(i, w){
  let good = 0; for (let d = 0; d < 7; d++){ const H = (w * 7 + d) * 24 + 2; if (windAt(H) < 12) good++; }
  const season = Math.min(1, (seasonal(SPECIES.torsk.av, w * 7 * 24 + 84) + seasonal(SPECIES.torsk.skrei, w * 7 * 24 + 84)) / 3.5) * 0.7 + 0.3;
  return Math.round(SKIPPERS[i][2] * good * 260 * season * (0.6 + 0.8 * h2(w, 900 + i)));
}
function myKg(H0, H1){ return S.sales.filter(x => x.t / 60 >= H0 && x.t / 60 < H1).reduce((a, x) => a + x.kg, 0); }
function toplist(w){
  const rows = SKIPPERS.map((s, i) => ({name:s[0], port:s[1], kg:npcWeekKg(i, w)}));
  rows.push({name:S.company || (S.lang === 'no' ? 'Deg' : 'You'), port:'Finnsnes', kg:Math.round(myKg(w * 168, (w + 1) * 168)), me:true});
  return rows.sort((a, b) => b.kg - a.kg);
}
// local news, generated from the same world everyone plays in
const dayOf2 = t0 => Math.floor(t0 / 60 / 24);
function newsForDay(day){
  const H0 = day * 24, out = [], mo = gDate(H0).getUTCMonth(), dd = gDate(H0).getUTCDate(), L = (no, en) => ({no, en});
  let mx = 0; for (let k = 0; k < 24; k += 2) mx = Math.max(mx, windAt(H0 + k));
  const pick = (arr) => arr[Math.floor(h2(day, 31) * arr.length) % arr.length];
  if (mx >= 20.8) out.push(pick([[L('Storm på kysten', 'Storm on the coast'), L('Vinden nådde ' + Math.round(mx) + ' m/s, og hele sjarkflåten ble liggende i havn.', 'Winds reached ' + Math.round(mx) + ' m/s and the whole small-boat fleet stayed in port.')], [L('Uvær stengte fjordene', 'Storm closes the fjords'), L('Med ' + Math.round(mx) + ' m/s i kastene var det ingen som gikk ut. Fortøyningene ble sjekket to ganger.', 'With gusts of ' + Math.round(mx) + ' m/s nobody went out. Moorings were checked twice.')]]));
  else if (mx >= 13.9) out.push(pick([[L('Kuling stoppet fisket', 'Gale halts fishing'), L('Mange lot båten ligge etter varsel om kuling. Skippere minner om å sjekke prognosen før man går ut.', 'Many stayed in after a gale warning. Skippers urge everyone to check the forecast before heading out.')], [L('Kulingvarsel for Senja', 'Gale warning for Senja'), L('Meteorologene varslet opp mot ' + Math.round(mx) + ' m/s. Småbåter bør holde seg inne.', 'Forecasters warned of up to ' + Math.round(mx) + ' m/s. Small boats should stay in.')], [L('Tungt vær på bankene', 'Heavy weather on the banks'), L('De som var ute, snudde tidlig. Det er fisk å hente når det løyer.', 'Those who went out turned back early. The fish will still be there when it eases.')]]));
  else if (mx < 7 && h2(day, 33) < 0.6) out.push(pick([[L('Blikkstille og godt fiskevær', 'Flat calm and good fishing weather'), L('Små båter kunne gå helt ut på bankene nord for Senja.', 'Small boats could run all the way out to the banks north of Senja.')], [L('Speilblank sjø i Gisundet', 'Mirror-flat Gisundet'), L('Rolig vær ga travle kaier og mange landinger.', 'Calm weather meant busy quays and plenty of landings.')], [L('Fint vær, fulle mottak', 'Fine weather, busy plants'), L('Mottakene melder om god tilførsel etter flere rolige dager.', 'The fish plants report steady supply after several calm days.')]]));
  { const y = yearH(H0), sd = codStopDoy(y), d0 = doyH(H0 + 12), dt = new Date(Date.UTC(y, 0, 1 + sd)), MN = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'], MNe = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dno = dt.getUTCDate() + '. ' + MN[dt.getUTCMonth()], den = dt.getUTCDate() + ' ' + MNe[dt.getUTCMonth()], jun29 = Math.floor((Date.UTC(y, 5, 29) - Date.UTC(y, 0, 1)) / 864e5), jun1 = Math.floor((Date.UTC(y, 5, 1) - Date.UTC(y, 0, 1)) / 864e5);
    if (d0 === sd - 7) out.push([L('Stopp i torskefisket for åpen gruppe om en uke', 'Open-group cod fishing stops in a week'), L('Fiskeridirektoratet stopper fisket på maksimalkvotene i åpen gruppe ' + dno + '. Etter det kan hver båt bare fiske resten av den garanterte kvoten.', 'The Directorate of Fisheries stops fishing on the open group maximum quotas on ' + den + '. After that each boat can only fish the rest of its guaranteed quota.')]);
    if (d0 === sd) out.push([L('Maksimalkvotefisket er stoppet', 'Maximum-quota fishing stopped'), L('Fra i dag gjelder bare de garanterte torskekvotene i åpen gruppe.', 'From today only the guaranteed cod quotas apply in the open group.')]);
    if (d0 === jun29) out.push([L('Ferskfiskordningen er i gang', 'The fresh-fish scheme has started'), L('Fra i dag kan båtene fiske torsk utenom kvoten tilsvarende 20 % av det de lander fersk hver uke.', 'From today boats can fish cod on top of the quota, up to 20% of what they land fresh each week.')]);
    const dec20 = Math.floor((Date.UTC(y, 11, 20) - Date.UTC(y, 0, 1)) / 864e5), apr21 = Math.floor((Date.UTC(y, 3, 21) - Date.UTC(y, 0, 1)) / 864e5);
    if (d0 === dec20) out.push([L('Kveita er fredet fra i dag', 'Halibut closed from today'), L('Fram til og med 20. april er det forbudt å fiske kveite nord for 62° N. Levende kveite skal slippes med én gang.', 'Until 20 April it is forbidden to fish halibut north of 62° N. Live halibut must be released at once.')]);
    if (d0 === apr21) out.push([L('Kveitefisket er åpent igjen', 'Halibut fishing open again'), L('Fredningen er over. Husk minstemålet på 84 cm og at kveite over 200 cm skal slippes.', 'The closed season is over. Remember the 84 cm minimum size and that halibut over 200 cm must be released.')]);
    if (d0 === jun1) out.push([L('Uerfisket åpner for juksa', 'Redfish opens for jigs'), L('Fra 1. juni til 31. august kan båter under 15 meter fiske uer med juksa. Resten av året er uer bare tillatt som bifangst.', 'From 1 June to 31 August boats under 15 m may fish redfish with jigs. The rest of the year redfish is only allowed as bycatch.')]); }
  if (supplyFactor(H0 + 7) >= 1.025) out.push([L('Uværet ga toppris på fisken', 'Bad weather sends fish prices up'), L('Få båter har kommet seg ut, og mottakene betaler godt for fisken som kommer inn.', 'Few boats have made it out, and the plants are paying well for what comes in.')]);
  if (day % 3 === 0 && S && S.stock){ const g = GROUNDS.slice(0, 4).filter(q => stockAt(q.p) < 0.62)[0]; if (g) out.push([L('Tynt fiske på ' + g.name.no.replace(/^./, c => c.toLowerCase()), 'Poor fishing ' + g.name.en.replace(/^./, c => c.toLowerCase())), L('Mange båter har fisket hardt her, og fangstene faller. Flere prøver seg på nye plasser.', 'Many boats have fished hard here and catches are falling. Several are trying new spots.')]); }
  const p1 = avgPrice('torsk', H0, 1), p0 = avgPrice('torsk', H0 - 72, 1), ch = (p1 / p0 - 1) * 100;
  if (Math.abs(ch) > 4) out.push([L('Torskeprisen ' + (ch > 0 ? 'stiger' : 'faller'), 'Cod price ' + (ch > 0 ? 'rises' : 'falls')), L('Snittprisen for torsk hos mottakene er ' + Math.round(p1) + ' kr/kg, ' + (ch > 0 ? 'opp' : 'ned') + ' ' + Math.abs(Math.round(ch)) + ' % på tre dager.', 'The average cod price at the plants is NOK ' + Math.round(p1) + '/kg, ' + (ch > 0 ? 'up' : 'down') + ' ' + Math.abs(Math.round(ch)) + '% in three days.')]);
  const SEAS = [
    [L('Skreia er på vei inn', 'The skrei is coming in'), L('De første skreifangstene er landet. Sesongen tar seg opp utover måneden.', 'The first spawning cod has been landed. The season picks up through the month.')],
    [L('Skreia står på bankene', 'Spawning cod on the banks'), L('Skreisesongen er i gang, og det meldes om god fangst på juksa utenfor Senja.', 'The skrei season is on, with good catches on jigs off Senja.')],
    [L('Travle dager på mottakene', 'Busy days at the fish plants'), L('Mottakene i Husøy og Senjahopen kjører dobbeltskift i høysesongen for skrei.', 'The plants in Husøy and Senjahopen are running double shifts at the peak of the skrei season.')],
    [L('Skreia er på vei ut', 'The skrei is heading out'), L('Fisket avtar etter en god vintersesong. Hysa tar over på bankene.', 'Catches are tapering off after a good winter season. Haddock takes over on the banks.')],
    [L('Rognkjeksen er inne', 'Lumpfish close to shore'), L('Våren gir rognkjeks på grunna og lyse netter på feltet.', 'Spring brings lumpfish to the shallows and light nights on the grounds.')],
    [L('Midnattssol og sei', 'Midnight sun and saithe'), L('Seien står i strømmen ved nesene, og sommerfisket er i gang.', 'Saithe gather in the currents off the headlands and the summer fishery is under way.')],
    [L('Fellesferie på sjøen', 'Holiday season at sea'), L('Mange fritidsbåter i Gisundet. Hold god utkikk.', 'Lots of leisure boats in Gisundet. Keep a good lookout.')],
    [L('Seien står tett i Malangen', 'Saithe packed in Malangen'), L('Sjarkene melder om fine kast med sei på vei inn fjorden.', 'Small boats report good saithe catches at the mouth of the fjord.')],
    [L('Hysa biter på bankene', 'Haddock biting on the banks'), L('Høsten gir hyse på litt dypere vann. Juksamaskinene går varme.', 'Autumn brings haddock in slightly deeper water. The jigging reels are working hard.')],
    [L('Silda er på vei inn', 'Herring moving in'), L('Fiskere melder om sild i fjordene. Hvalen følger ofte etter.', 'Fishermen report herring in the fjords. Whales usually follow.')],
    [L('Hvalen er tilbake', 'The whales are back'), L('Spekkhogger og knølhval er observert på sildefeltene. Hold god avstand og lav fart.', 'Orcas and humpbacks have been seen on the herring grounds. Keep your distance and slow down.')],
    [L('Mørketid og julefiske', 'Polar night and Christmas fishing'), L('Korte dager, men torsken biter. Husk lanterner og god kurs i mørket.', 'Short days, but the cod are biting. Mind your lights and your course in the dark.')]];
  if (day % 5 === 1 || (out.length === 0 && day % 10 === 6)) out.push(SEAS[mo]);
  if (mo === 4 && dd === 1) out.push([L('Fergesambandet er åpnet', 'Summer ferry open'), L('MF Senjasund går igjen mellom Botnhamn og Brensholmen hver halvannen time.', 'MF Senjasund is back on the Botnhamn - Brensholmen route every ninety minutes.')]);
  const w = weekOf(H0); if (gDate(H0).getUTCDay() === 1 && w > 0){ const top = toplist(w - 1)[0]; out.push([L('Ukas toppfisker: ' + top.name, 'Top boat of the week: ' + top.name), L(top.name + ' fra ' + top.port + ' landet ' + top.kg.toLocaleString('nb-NO') + ' kg forrige uke.', top.name + ' from ' + top.port + ' landed ' + top.kg.toLocaleString('en-GB') + ' kg last week.')]); }
  for (const ic of (S && S.incidents || []).filter(x => dayOf2(x.t) === day)) if (ic.k === 'aground') out.push([L('«' + ic.boat + '» gikk på grunn ' + ic.no, '«' + ic.boat + '» ran aground ' + ic.en), L('Skipperen måtte tilkalle redningsskøyta. Ingen kom til skade, men båten er slept til kai og må på verksted.', 'The skipper had to call the rescue boat. Nobody was hurt, but the boat has been towed in and needs repairs.')]);
  const mine = myKg(H0, H0 + 24); if (mine >= 150) out.push([L((S.company || 'Finnsnes-skipper') + ' med fin landing', (S.company || 'Finnsnes skipper') + ' lands a good catch'), L('Det ble levert ' + Math.round(mine) + ' kg i løpet av dagen.', Math.round(mine) + ' kg was landed during the day.')]);
  return out.map(a => ({day, h:a[0], b:a[1]}));
}

// ---- standing operations plan: a hired skipper runs a saved route on set days, lands the catch and restocks ----
const OPS_DAYS_NO = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'], OPS_DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
function opsSkipper(){ return S.ops && S.crew.find(c => c.id === S.ops.skipper) || null; }
function autoRestock(){
  const b = S.boat, fp = fuelPrice(); let l = BOAT.fuelCap - b.fuel; if (l > 0.5 && S.cash > 0){ l = Math.min(l, S.cash / fp); b.fuel += l; S.cash -= l * fp; S.stats.costs += l * fp; }
  if (S.settings.ice !== false){ const kg = Math.max(0, BOAT.iceCap - b.ice), c = kg * PRICE.ice; if (kg > 0 && c <= S.cash){ b.ice += kg; S.cash -= c; S.stats.costs += c; } }
  if (!b.gear && PRICE.gear <= S.cash){ b.gear = true; S.cash -= PRICE.gear; S.stats.costs += PRICE.gear; }
}
function opsStep(H){
  const o = S.ops, b = S.boat; if (!o || !o.on || !o.wps || !o.wps.length) return;
  const g = gDate(H), day = Math.floor((H + 6) / 24), wd = (g.getUTCDay() + 6) % 7, hod = g.getUTCHours() + g.getUTCMinutes() / 60;
  if (b.status !== 'port' || S.plan || o.last === day || !o.days[wd] || hod < o.dep || hod > o.dep + 2) return;
  const sk = opsSkipper(); o.last = day;
  if (!sk){ msg('Driftsplan', 'Driftsplanen står: ingen skipper er satt. Velg en skipper i Mannskap-appen.', 'The operations plan is idle: no skipper is set. Choose one in the Crew app.'); return; }
  if (b.port !== o.home){ msg(sk.name, 'Båten ligger ikke i ' + portById(o.home).name + ', så jeg går ikke ut på den faste planen i dag.', 'The boat is not in ' + portById(o.home).name + ', so I am not running the plan today.'); return; }
  if (S.jobs && S.jobs.length){ msg(sk.name, 'Verkstedet jobber på båten, så jeg venter til i morgen.', 'The yard is working on the boat, so I will wait until tomorrow.'); return; }
  let wmax = 0, hmax = 0; const dur = o.hours || 8; for (let k = 0; k <= dur; k += 1){ wmax = Math.max(wmax, windAt(H + k)); hmax = Math.max(hmax, hsOpen(H + k)); }
  if (wmax > o.maxWind || hmax > BOAT.risk[1] * 0.85){ msg(sk.name, 'Blir på land i dag. Varselet gir ' + fmt(wmax, 0) + ' m/s og ' + fmt(hmax, 1) + ' m sjø, over grensa på ' + o.maxWind + ' m/s.', 'Staying ashore today. The forecast gives ' + fmt(wmax, 0) + ' m/s and ' + fmt(hmax, 1) + ' m seas, above the ' + o.maxWind + ' m/s limit.'); log(sk.name + ' ble på land på grunn av været.', sk.name + ' stayed ashore because of the weather.'); return; }
  autoRestock();
  // a hired skipper fishes cod, haddock and saithe only in the closed group; elsewhere he goes for halibut when the boat has the gear
  if (!S.lic && b.kgear && !kveiteClosed(H)) S.target = 'kveite';
  S.plan = {wps:o.wps.map(w => ({...w})), idx:0, speed:o.speed, returning:false, depAt:null, ops:true, unsafe:[]};
  log(sk.name + ' gikk ut på fast driftsplan.', sk.name + ' went out on the standing plan.');
  depart();
}
function opsLanded(pid){
  const o = S.ops, sk = opsSkipper(); if (!o) return;
  const port = portById(pid), kg = holdTotal(); let total = 0;
  if (port.mottak && kg > 0.5){ const c0 = S.cash; sell(); total = S.cash - c0; }
  autoRestock();
  const extra = Math.round(Math.max(0, total) * 0.05); if (extra > 0){ S.cash -= extra; S.stats.costs += extra; }
  msg(sk ? sk.name : 'Driftsplan', 'Driftsrapport: ' + (kg > 0.5 ? fmt(kg, 0) + ' kg levert i ' + port.name + ', ' + kr(Math.round(total)) + ' etter lott' + (extra ? ', skippertillegg ' + kr(extra) : '') + '.' : 'ingen fangst å levere.') + ' Båten er fylt opp og klar.',
    'Operations report: ' + (kg > 0.5 ? fmt(kg, 0) + ' kg landed at ' + port.name + ', ' + kr(Math.round(total)) + ' after shares' + (extra ? ', skipper bonus ' + kr(extra) : '') + '.' : 'no catch to land.') + ' The boat is fuelled and ready.');
}
function depart(){
  const b = S.boat;
  // without you aboard, the vessel needs crew of its own
  if (!meAboard() && !crewAboard().length){ S.plan = null; log('Båten har ikke mannskap og kan ikke gå ut uten deg om bord.', 'The boat has no crew and cannot go out without you aboard.'); return false; }
  S.tripOwner = !(S.plan && S.plan.ops) && meAboard();
  if (b.status === 'port'){ S.stats.trips++; log('Kastet loss fra ' + portById(b.port).name + '.', 'Cast off from ' + portById(b.port).name + '.'); }
  if (access() === 'none' && !(S.plan && S.plan.ops) && !(S.target === 'kveite' && b.kgear)) log('Båten har ikke adgang til å fiske torsk, hyse og sei. De kan bare være bifangst, høyst 10 % av landingen.', 'The boat has no access to fish cod, haddock and saithe. They can only be bycatch, at most 10% of the landing.');
  S.tripBuff = Object.assign({}, S.prep || {}); S.prep = {};
  if (S.plan) S.plan.depAt = null; b.status = 'sailing'; b.port = null;
  return true;
}
// jobs: yard service, fitting equipment, preparing gear
const PREP = {
  jig:{h:1, cost:250, no:'Rigge nye pilker og sjekke snøret', en:'Rig new jigs and check the line', fx:{no:'+15 % fangst neste tur', en:'+15% catch next trip'}},
  reels:{h:2, cost:600, no:'Skifte kroker og søkk på juksamaskinene', en:'Replace hooks and sinkers on the reels', fx:{no:'+10 % fangst neste tur', en:'+10% catch next trip'}, need:() => S.equip.jukse > 0},
  hold:{h:1, cost:150, no:'Vaske og desinfisere lasterommet', en:'Wash and disinfect the hold', fx:{no:'fisken holder seg bedre neste tur', en:'the fish keeps better next trip'}}
};
function finishJob(j){
  const b = S.boat;
  if (j.kind === 'svc'){ b.svcAt = b.engH || 0; S.svcTold = false; log('Service på motoren er ferdig.', 'The engine service is done.'); }
  else if (j.kind === 'fit'){ const E = EQUIP[j.k]; if (E.multi) S.equip[j.k] = (S.equip[j.k] || 0) + 1; else S.equip[j.k] = true; applyVessel(); log('Montert: ' + E.name.no + '.', 'Fitted: ' + E.name.en + '.'); if (hooks.onEquip) hooks.onEquip(); }
  else if (j.kind === 'repair'){ log('Skroget er reparert.', 'The hull is repaired.'); }
  else if (j.kind === 'prep'){ S.prep = S.prep || {}; S.prep[j.k] = true; log('Ferdig: ' + PREP[j.k].no + '.', 'Done: ' + PREP[j.k].en + '.'); }
  msg(j.kind === 'prep' ? (S.lang === 'no' ? 'Kaia' : 'The quay') : 'Verkstedet', (j.no || '') + ' er ferdig.', (j.en || '') + ' is done.');
}
function queueJob(j){ S.jobs = S.jobs || []; if (S.jobs.length >= 6) return false; S.jobs.push(j); if (S.jobs.length === 1 && S.boat.status === 'port') j.until = S.t + j.h * 60; return true; }
function jobsDone(){ return S.jobs && S.jobs.length ? S.jobs[S.jobs.length - 1].until || null : null; }

function startReturn(auto, W){
  const b = S.boat, tr = S.trail.slice().reverse(), wps = [];
  for (const t of tr){
    if (!t.port && dist(t, b.pos) < 0.01) continue;
    wps.push({x:t.x, y:t.y, port:t.port || null, fish:0});
    if (t.port) break;
  }
  if (!wps.length || !wps[wps.length - 1].port){ const np = nearestPort(b.pos); wps.push({x:np.p.x, y:np.p.y, port:np.id, fish:0}); }
  S.plan = {wps, idx:0, speed:S.plan ? S.plan.speed : S.draftSpeed, returning:true};
  b.fishUntil = null;
  if (b.status === 'engine') b.prev = 'sailing'; else b.status = 'sailing';
  if (auto) log('Vinden økte til ' + W.toFixed(1).replace('.', ',') + ' m/s. Båten går hjem samme vei.', 'Wind rose to ' + W.toFixed(1) + ' m/s. Heading home the same way.');
  else log('Returnerer samme vei.', 'Returning the same way.');
}
// ===== CORE END =====

