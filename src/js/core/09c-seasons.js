// ===== the seasons as events (05.10.2026; Jonas chose it from the list of what makes people play on, 5) =====
// Each season begins on a day of its own each year (a few days either way, the same for everyone): the coast radio says it over the
// VHF (a message from Kystradio), Kystposten writes about it (seasonNews, in newsForDay), and the talk at the pub is of it (seasonTalk).
// The phone's Sesong app shows what is on now, what comes, and when each kind of fish is best (from SPECIES' months).
// The dates the rules set (halibut closed, redfish open, the fresh-fish scheme) are listed in the calendar too; their news is in
// 06-services.js.
// Skreifestivalen: the second weekend of March, Saturday 00:00 to Sunday 18:00, the biggest cod landed by one of your boats against
// the skippers of the coast. 15 000, 7 500 and 3 000 kr for the three biggest; the result comes on Sunday evening (seasonDay).
// A big fish on the record list (09b-records.js) can win it.
const SEASON_EV = [
  {id:'skrei', m:1, d:20, j:6, vhf:['Skreien er kommet. De første båtene melder god skrei på juksa langs kysten.', 'The skrei has come. The first boats report good spawning cod on the jig along the coast.'],
    post:[['Skreien er her', 'The skrei is here'], ['Årets første skreifangster er landet. Mottakene gjør klar til høysesong, og prisene for stor torsk er gode.', 'The year’s first skrei catches have been landed. The plants are getting ready for the high season, and prices for big cod are good.']],
    pub:['Alle snakker om skreien. Gamlekarene sier den står tettest på kanten mot djupet.', 'Everyone talks about the skrei. The old hands say it stands thickest on the edge of the deep.']},
  {id:'skreitopp', m:3, d:1, j:4, vhf:['Toppen av skreisesongen. Mye båter på feltene, hold god utkikk.', 'The peak of the skrei season. Many boats on the grounds, keep a good lookout.'],
    post:[['Høysesong på feltene', 'High season on the grounds'], ['Skreisesongen er på topp. Mottakene går i skift, og det er trangt på kaiene.', 'The skrei season is at its peak. The plants run shifts, and the quays are crowded.']],
    pub:['Puben er full av folk fra feltene. Det skrytes av skrei på over 20 kilo.', 'The pub is full of people from the grounds. They boast of skrei over 20 kilos.']},
  {id:'skreiut', m:4, d:10, j:5, vhf:['Skreien trekker ut. Hysa og vårtorsken tar over.', 'The skrei is moving out. Haddock and spring cod take over.'],
    post:[['Skreisesongen går mot slutten', 'The skrei season draws to a close'], ['Fangstene av skrei avtar. Mange båter går over til hyse.', 'Skrei catches are falling off. Many boats turn to haddock.']],
    pub:['Praten går om hvor godt sesongen ble, og om hysa.', 'The talk is of how good the season was, and of the haddock.']},
  {id:'lodde', m:4, d:25, j:6, vhf:['Loddetorsken er inne i Finnmark. Torsken følger lodda inn mot land.', 'The capelin cod is in off Finnmark. The cod follow the capelin in towards land.'],
    post:[['Vårtorsk i Finnmark', 'Spring cod in Finnmark'], ['Lodda gyter langs Finnmarkskysten, og torsken følger etter inn på grunt vann. Båtene i øst fyller lasten.', 'The capelin spawn along the Finnmark coast, and the cod follow into shallow water. The boats in the east fill their holds.']],
    pub:['Noen snakker om å ta turen østover etter loddetorsken.', 'Some talk of heading east after the capelin cod.']},
  {id:'sei', m:6, d:10, j:6, vhf:['Seien står i strømmen ved nesene. Godt sommerfiske meldt.', 'The saithe stands in the current off the headlands. Good summer fishing reported.'],
    post:[['Seisommeren er i gang', 'The saithe summer is on'], ['Seien er inne, og i midnattssola kan det fiskes hele døgnet. Best i strømmen på flo og fjære.', 'The saithe is in, and in the midnight sun you can fish round the clock. Best in the current as the tide runs.']],
    pub:['Sommerpraten: sei i strømmen og turister i fjorden.', 'Summer talk: saithe in the current and tourists in the fjord.']},
  {id:'hyse', m:9, d:5, j:6, vhf:['Hysa biter på bankene. Høstfisket er i gang.', 'The haddock bite on the banks. The autumn fishing is on.'],
    post:[['Høsthyse på bankene', 'Autumn haddock on the banks'], ['Hysa står litt dypere om høsten. Juksamaskinene går varme.', 'The haddock stands a little deeper in autumn. The jigging reels are working hard.']],
    pub:['Folk diskuterer hyseprisen og hvor dypt det lønner seg å gå.', 'People argue about the haddock price and how deep it pays to go.']},
  {id:'sild', m:11, d:10, j:7, vhf:['Silda og hvalen er i fjordene. Hold avstand til hval og lav fart.', 'Herring and whales are in the fjords. Keep clear of whales and slow down.'],
    post:[['Hvalen er tilbake', 'The whales are back'], ['Silda har gått inn i fjordene i nord, og spekkhogger og knølhval følger etter. Torsken står ofte under silda.', 'The herring has come into the northern fjords, and orcas and humpbacks follow. The cod often stand under the herring.']],
    pub:['Noen har sett spekkhogger i fjorden. Alle har en hvalhistorie.', 'Someone saw orcas in the fjord. Everyone has a whale story.']},
  {id:'jul', m:12, d:15, j:0, vhf:['Mørketid og julefiske. Husk lanterner og god kurs i mørket.', 'Polar night and Christmas fishing. Mind your lights and your course in the dark.'],
    post:[['Julefisket', 'The Christmas fishing'], ['Torsken biter i mørketida, og mottakene betaler godt for fersk fisk før jul.', 'The cod bite in the polar night, and the plants pay well for fresh fish before Christmas.']],
    pub:['Juleølet er kommet. Praten går om skreien som kommer etter nyttår.', 'The Christmas beer is in. The talk is of the skrei coming after New Year.']}
];
// the rules' own dates (their news is in 06-services.js), for the calendar
const SEASON_FIXED = [[4, 21, ['Kveitefisket åpner', 'Halibut fishing opens']], [6, 1, ['Uer på juksa (til 31. august)', 'Redfish on the jig (to 31 August)']], [6, 29, ['Ferskfiskordningen starter', 'The fresh-fish scheme starts']], [12, 20, ['Kveita fredet (til 20. april)', 'Halibut closed (to 20 April)']]];
// the day of the year an event begins in year y
const seasonDoy = (e, y) => doyOf(y, e.m, e.d) + Math.round((h2(y, 7700 + SEASON_EV.indexOf(e)) - 0.5) * 2 * e.j);
// the season on now: the last event begun (from last year's when none has this year)
// ===== the seasons as shared events (30.10.2026; docs/forslag.md A2, point 7 of docs/research/oppdrag-gap-analyse.md) =====
// Lofotfisket, Finnmarksfisket, Seisommeren and Krabbehøsten: everything landed inside the area in the days counts on one board for
// everyone (supabase/migrations/20261030130000_season_ev.sql ev_top; the game marks each landing with its event, wshLand). The
// areas are boxes in lat/lon, near the statistical areas 00 (Vestfjorden), 03/04 (Finnmark), the whole coast, and east of 26° E for the
// crab (the quota area). The same days and areas for all, on the shared clock. Nobody has to win: over the badge's kilos you have been
// part of it (EV_BADGE), and the top three get the festival's prizes. The board, the prizes and the badge need the cloud; without it
// the event is only the words. The pennant with the year on the boat is for later (the livery's p: is the week's pennant).
const EVENTS = [
  {id:'lofot', no:'Lofotfisket', en:'The Lofoten fishery', from:[1, 20], to:[4, 10], box:{lat0:67.2, lat1:68.7, lon0:12.0, lon1:16.2}, sp:['torsk'], badge:['Lofotfisker', 'Lofoten fisher'], kg:1000},
  {id:'finnmark', no:'Finnmarksfisket', en:'The Finnmark fishery', from:[4, 25], to:[6, 15], box:{lat0:69.5, lat1:71.5, lon0:21.5, lon1:31.5}, sp:['torsk'], badge:['Finnmarksfisker', 'Finnmark fisher'], kg:1000},
  {id:'sei', no:'Seisommeren', en:'The saithe summer', from:[6, 10], to:[8, 31], box:null, sp:['sei'], badge:['Seifisker', 'Saithe fisher'], kg:1000},
  {id:'krabbe', no:'Krabbehøsten', en:'The crab autumn', from:[9, 1], to:[11, 30], box:{lat0:69.5, lat1:71.5, lon0:26.0, lon1:31.5}, sp:['krabbe'], badge:['Krabbefisker', 'Crab fisher'], kg:300}
];
const EV_PRIZE = [15000, 7500, 3000];
const evDays = (e, y) => { const H0 = Math.round((Date.UTC(y, e.from[0] - 1, e.from[1]) - EPOCH) / 36e5), H1 = Math.round((Date.UTC(y, e.to[0] - 1, e.to[1] + 1) - EPOCH) / 36e5); return {y, H0, H1, days:Math.round((H1 - H0) / 24)}; };
const evOn = (e, H) => { const D = evDays(e, yearH(H)); return H >= D.H0 && H < D.H1 ? D : null; };
const evNow = H => EVENTS.filter(e => evOn(e, H));
const evDayN = (e, H) => { const D = evOn(e, H); return D ? Math.floor((H - D.H0) / 24) + 1 : 0; };
// whether a place lies in the event's area (the plant's position in lat/lon)
function evIn(e, p){ if (!e.box || !p) return !!p; let ll = null; try { ll = natLL(p); } catch (x){ return false; } return !!ll && ll.lat >= e.box.lat0 && ll.lat <= e.box.lat1 && ll.lon >= e.box.lon0 && ll.lon <= e.box.lon1; }
// the event a landing falls in: active now, the species one of its own, the plant inside its area (the id, or '')
function evAt(H, port, sps){ const q = typeof portById === 'function' ? portById(port) : null; if (!q) return '';
  for (const e of evNow(H)) if (evIn(e, q.p) && (!sps || sps.some(sp => e.sp.includes(sp)))) return e.id; return ''; }
const evBadges = () => (S.ach && S.ach.ev) || {};
// the closing (seasonDay the day after, then evCloseTick when the board has come): the prizes to the top three and the badge to
// everyone over the kilos, told by Kystposten; without the cloud only the words
function evClose(e, y, top){
  const k = e.id + y, A = S.ach || (S.ach = {}); A.ev = A.ev || {}; if (A.ev[k]) return;
  const me = top && top.mine, kg = me ? me.kg || 0 : 0, rk = me ? me.rank : null, name = (S.lang === 'en' ? e.en : e.no) + ' ' + y;
  A.ev[k] = {kg:Math.round(kg), rank:rk, badge:kg >= e.kg, t:S.t};
  if (rk && rk <= 3){ const p = EV_PRIZE[rk - 1]; book('annet', p, 'Premie, ' + e.no + ' ' + y, 'Prize, ' + e.en + ' ' + y);
    msg('Kystposten', (rk === 1 ? 'Du vant ' : 'Du ble nummer ' + rk + ' i ') + e.no + ' ' + y + ' med ' + fmt(kg, 0) + ' kg. Premien er ' + kr(p) + '.', (rk === 1 ? 'You won ' : 'You came ' + ['', 'second', 'third'][rk - 1] + ' in ') + e.en + ' ' + y + ' with ' + fmt(kg, 0) + ' kg. The prize is ' + kr(p) + '.'); }
  if (kg >= e.kg) msg('Kystposten', e.no + ' ' + y + ' er over. Du leverte ' + fmt(kg, 0) + ' kg der' + (rk ? ', som nummer ' + rk + ' av ' + (top.n || rk) : '') + '. Merket «' + e.badge[0] + ' ' + y + '» er ditt.', e.en + ' ' + y + ' is over. You landed ' + fmt(kg, 0) + ' kg there' + (rk ? ', ' + rk + ' of ' + (top.n || rk) : '') + '. The badge «' + e.badge[1] + ' ' + y + '» is yours.');
  else if (top && top.rows && top.rows.length) msg('Kystposten', e.no + ' ' + y + ' er over: ' + fmt(top.kg || 0, 0) + ' kg levert av ' + (top.n || 0) + ' båter. «' + (top.rows[0].boat || '–') + '» leverte mest.', e.en + ' ' + y + ' is over: ' + fmt(top.kg || 0, 0) + ' kg landed by ' + (top.n || 0) + ' boats. «' + (top.rows[0].boat || '–') + '» landed most.');
  if (typeof cloudEv === 'function') cloudEv('ev_close', {ev:e.id, y, kg:Math.round(kg), rank:rk});
}
function seasonNow(H){
  const y = yearH(H), d = doyH(H); let best = null;
  for (const yy of [y - 1, y]) for (const e of SEASON_EV){ const dd = seasonDoy(e, yy) + (yy < y ? -365 : 0); if (dd <= d && (!best || dd > best.dd)) best = {e, dd}; }
  return best && best.e;
}
// the next events from H: [{H (hour it begins), no, en, ev}] for the calendar, the festival and the rules' dates with them
function seasonNext(H, n = 8){
  const y = yearH(H), out = [], dayH = (yy, doy) => Math.round((Date.UTC(yy, 0, 1) + doy * 864e5 - EPOCH) / 36e5);
  for (const yy of [y, y + 1]){
    for (const e of SEASON_EV) out.push({H:dayH(yy, seasonDoy(e, yy)), no:e.post[0][0], en:e.post[0][1], ev:e.id});
    for (const [m, d, t] of SEASON_FIXED) out.push({H:dayH(yy, doyOf(yy, m, d)), no:t[0], en:t[1], ev:'rule'});
    const F = festDays(yy); out.push({H:F.H0, no:'Skreifestivalen', en:'The skrei festival', ev:'fest'});
  }
  return out.filter(x => x.H + 24 > H).sort((a, b) => a.H - b.H).slice(0, n);
}
// the skrei festival: the second Saturday in March 00:00 to the Sunday 18:00 (game hours)
function festDays(y){
  const m1 = new Date(Date.UTC(y, 2, 1)), sat = 1 + ((6 - m1.getUTCDay() + 7) % 7) + 7, t0 = Date.UTC(y, 2, sat);
  return {y, H0:Math.round((t0 - EPOCH) / 36e5), H1:Math.round((t0 - EPOCH) / 36e5) + 42};
}
const festOn = H => { const F = festDays(yearH(H)); return H >= F.H0 && H < F.H1 ? F : null; };
// the coast's other entries: their biggest cod, the same for everyone in a year
function festField(y){
  return SKIPPERS.slice(0, 7).map((s, i) => ({name:s[0], port:skipPort(i), kg:Math.round((14 + 13 * h2(y, 7800 + i) + (h2(y, 7820 + i) < 0.15 ? 9 : 0)) * 10) / 10}));
}
// a cod landed by one of your boats during the festival (addCatch)
function festCatch(sp, kg){
  if (sp !== 'torsk') return; const F = festOn(S.t / 60); if (!F) return;
  if (!S.fest || S.fest.y !== F.y) S.fest = {y:F.y, best:0};
  if (kg > S.fest.best){ S.fest.best = Math.round(kg * 10) / 10; S.fest.boat = S.boatName || ''; S.fest.t = S.t; }
}
// the board: everyone's biggest, yours with them
function festBoard(y){
  const rows = festField(y), me = S.fest && S.fest.y === y ? S.fest.best : 0;
  if (me > 0) rows.push({name:S.company || S.fest.boat || (S.lang === 'no' ? 'Deg' : 'You'), port:(portById(S.home || HOME0) || {}).name || '', kg:me, me:true});
  return rows.sort((a, b) => b.kg - a.kg);
}
const FEST_PRIZE = [15000, 7500, 3000];
// once a day (step): the events that begin today on the VHF, and the festival's result on its Sunday evening
function seasonDay(H){
  const y = yearH(H), d = doyH(H); S.seasonSeen = S.seasonSeen || {};
  for (const e of SEASON_EV){ const k = e.id + y; if (seasonDoy(e, y) !== d || S.seasonSeen[k]) continue; S.seasonSeen[k] = 1; radio(e.vhf[0], e.vhf[1]); }
  // the shared events: the opening on the VHF, and the closing the day after the last (the board is fetched first, ui/10h-world.js evCloseTick)
  for (const e of EVENTS){ const D = evDays(e, y), k = 'ev' + e.id + y;
    if (H >= D.H0 && H < D.H0 + 24 && !S.seasonSeen[k]){ S.seasonSeen[k] = 1; const mn = typeof MONS !== 'undefined' ? [MONS.no[e.to[0] - 1], MONS.en[e.to[0] - 1]] : ['', ''];
      radio(e.no + ' er i gang. Alt som leveres i området fram til ' + e.to[1] + '. ' + mn[0] + ', teller på tavla. Se Sesong-appen.', e.en + ' is on. Everything landed in the area until ' + e.to[1] + ' ' + mn[1] + ' counts on the board. See the Sesong app.'); }
    if (H >= D.H1 && H < D.H1 + 24 * 14 && !S.seasonSeen[k + 'x']){ S.seasonSeen[k + 'x'] = 1; S.evPending = (S.evPending || []).concat([{id:e.id, y}]); } }
  const F = festDays(y), kf = 'fest' + y;
  if (H >= F.H0 - 24 * 3 && H < F.H0 && !S.seasonSeen[kf + 'a']){ S.seasonSeen[kf + 'a'] = 1; msg('Kystposten', 'Skreifestivalen er neste helg. Største torsk landet fra lørdag til søndag kl. 18 vinner 15 000 kr.', 'The skrei festival is next weekend. The biggest cod landed from Saturday to Sunday 18:00 wins NOK 15,000.'); }
  if (H >= F.H1 && !S.seasonSeen[kf]){
    S.seasonSeen[kf] = 1; const B = festBoard(y), i = B.findIndex(r => r.me), w = B[0];
    if (i >= 0 && i < 3){ const p = FEST_PRIZE[i]; book('annet', p, 'Premie fra festivalen', 'Festival prize');
      msg('Skreifestivalen', (i === 0 ? 'Du vant Skreifestivalen' : 'Du ble nummer ' + (i + 1) + ' i Skreifestivalen') + ' med en torsk på ' + fmt(B[i].kg, 1) + ' kg. Premien er ' + fmt(p, 0) + ' kr.', (i === 0 ? 'You won the skrei festival' : 'You came ' + ['', 'second', 'third'][i] + ' in the skrei festival') + ' with a cod of ' + fmt(B[i].kg, 1) + ' kg. The prize is NOK ' + fmt(p, 0) + '.');
      log('Premie fra Skreifestivalen: ' + fmt(p, 0) + ' kr.', 'Prize from the skrei festival: NOK ' + fmt(p, 0) + '.'); }
    else msg('Skreifestivalen', w.name + ' fra ' + w.port + ' vant med en torsk på ' + fmt(w.kg, 1) + ' kg.' + (i >= 0 ? ' Din største var ' + fmt(B[i].kg, 1) + ' kg, nummer ' + (i + 1) + '.' : ''), w.name + ' from ' + w.port + ' won with a cod of ' + fmt(w.kg, 1) + ' kg.' + (i >= 0 ? ' Your biggest was ' + fmt(B[i].kg, 1) + ' kg, number ' + (i + 1) + '.' : ''));
  }
}
// Kystposten on day (newsForDay): the season that begins, and the festival
function seasonNews(day){
  const H0 = day * 24, y = yearH(H0), d = doyH(H0 + 12), out = [], L = (no, en) => ({no, en});
  for (const e of SEASON_EV) if (seasonDoy(e, y) === d) out.push([L(e.post[0][0], e.post[0][1]), L(e.post[1][0], e.post[1][1])]);
  const F = festDays(y), fd = Math.floor(F.H0 / 24);
  if (day === fd - 5) out.push([L('Skreifestivalen til helgen', 'The skrei festival this weekend'), L('Største torsk landet fra lørdag til søndag kl. 18 vinner 15 000 kr. Andreplass gir 7 500 og tredjeplass 3 000.', 'The biggest cod landed from Saturday to Sunday 18:00 wins NOK 15,000. Second place gets 7,500 and third 3,000.')]);
  if (day === fd + 2){ const w = festBoard(y)[0]; out.push([L('Skreifestivalen: ' + w.name + ' vant', 'The skrei festival: ' + w.name + ' won'), L(w.name + (w.port ? ' fra ' + w.port : '') + ' landet den største torsken, ' + fmt(w.kg, 1) + ' kg.', w.name + (w.port ? ' from ' + w.port : '') + ' landed the biggest cod, ' + fmt(w.kg, 1) + ' kg.')]); }
  return out;
}
// what they talk about at the pub
function seasonTalk(H){ const e = seasonNow(H), F = festOn(H); return F ? ['Skreifestivalen er i gang. Alle vil ha den største torsken.', 'The skrei festival is on. Everyone wants the biggest cod.'] : e ? e.pub : null; }
// how good each kind of fish is each month (0-1), from SPECIES' months (av, and skrei for cod), for the calendar
function seasonGrid(){
  const out = {};
  for (const sp of ['torsk', 'hyse', 'sei', 'lange', 'brosme', 'uer', 'kveite', 'blakveite']){
    const S0 = SPECIES[sp], v = S0.av.map((a, i) => a + (sp === 'torsk' ? (S0.skrei[i] || 0) : 0)), mx = Math.max(...v);
    out[sp] = v.map(x => mx ? x / mx : 0);
  }
  return out;
}
