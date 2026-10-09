// ---------- the pub's social side (ui/09b-pub.js; supabase/migrations/20261009120000_pub.sql) ----------
// Who is in the harbour tonight (the other players' boats lying here, from the shared positions), greetings between them (a few preset
// lines, never free text: players from 13 years), the harbour's fiskarlag with a shared goal for the game week (counted from the members
// who fished, so one who stays away takes nothing from the others), and the week's quiz on the chalkboard (game money and a badge).
const PUBSOC = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  const cloudOn = () => typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && !(typeof isGuest === 'function' && isGuest());
  const btn = (q, label, dis, cls) => '<button data-q="' + q + '"' + (dis ? ' disabled' : '') + (cls ? ' class="' + cls + '"' : '') + '>' + label + '</button>';
  const H_ = () => S.t / 60, wk = () => weekOf(H_());

  // ---------- who is here tonight: the players' boats lying in this harbour ----------
  function here(){
    const pt = portById(S.boat.port); if (!pt || typeof peerStates !== 'function') return [];
    return peerStates().filter(n => n.st === 'port' && dist(n.p, pt.p) < 2).map(n => ({id:n.id.slice(1), user:n.user, boat:n.name}));
  }
  const GREET = [['Skål!', 'Cheers!'], ['God fangst i dag?', 'Good catch today?'], ['Takk for sist!', 'Good to see you again!'], ['Lykke til i morra!', 'Good luck tomorrow!'],
    ['Godt levert!', 'Well landed!'], ['Ses på feltet!', 'See you on the grounds!']];
  const G = {got:[], at:0, busy:false, sent:{}};
  function greetFetch(cb){
    if (!cloudOn() || G.busy || Date.now() - G.at < 20000) return; G.busy = true;
    cloudRpc('pub_greets_get', {}).then(r => { G.got = Array.isArray(r) ? r : []; G.at = Date.now(); seen(); if (cb) cb(); }).catch(() => { G.at = Date.now(); }).finally(() => { G.busy = false; });
  }
  // a greeting heard for the first time goes to the messages too
  function seen(){
    const P = S.pubSoc || (S.pubSoc = {}), last = P.gAt || 0; let top = last;
    for (const g of G.got){ const at = Date.now() - (g.age || 0) * 1000; if (at <= last + 1000) continue; top = Math.max(top, at);
      const ln = GREET[g.k]; if (!ln) continue; const who = g.from ? peerName(g.from) : L('En spiller', 'A player');
      msg('Puben', who + ': «' + ln[0] + '»', who + ': «' + ln[1] + '»'); }
    P.gAt = top;
  }
  function whoHtml(){
    const H = here(), pt = portById(S.boat.port), h = [];
    if (!H.length) h.push('<p>' + L('Ingen andre spillere ligger i havna i kveld. Folka ved bordene er fra bygda.', 'No other players lie in the harbour tonight. The people at the tables are from the bygd.') + '</p>');
    else {
      h.push('<p>' + L('Spillere med båten i ' + (pt ? pt.name : 'havna') + ' i kveld:', 'Players with their boat in ' + (pt ? pt.name : 'the harbour') + ' tonight:') + '</p><ul class="pb-who">');
      for (const p of H){
        const nm = p.user ? esc(p.user) : L('Ukjent', 'Unknown'), wait = G.sent[p.id] && Date.now() - G.sent[p.id] < 300000;
        h.push('<li><b>' + nm + '</b> <small>«' + esc(p.boat) + '»</small>' + (cloudOn() ? '<div class="pb-gr">' + GREET.map((g, i) => btn('g:' + p.id + ':' + i, esc(L(g[0], g[1])), wait)).join('') + '</div>' : '') + '</li>');
      }
      h.push('</ul>');
      if (!cloudOn()) h.push('<p class="pb-why">' + L('Logg inn for å hilse på de andre.', 'Sign in to greet the others.') + '</p>');
    }
    if (G.got.length){
      h.push('<h5>' + L('Hilsener til deg', 'Greetings to you') + '</h5><ul class="pb-got">' + G.got.slice(0, 8).map(g => { const ln = GREET[g.k]; if (!ln) return ''; const m = Math.round((g.age || 0) / 60);
        return '<li><b>' + esc(g.from ? peerName(g.from) : L('En spiller', 'A player')) + '</b>: «' + esc(L(ln[0], ln[1])) + '» <small>' + (m < 1 ? L('nå', 'now') : L(m + ' min siden', m + ' min ago')) + '</small></li>'; }).join('') + '</ul>');
    }
    return h.join('');
  }
  function greet(id, k){
    if (!cloudOn() || !GREET[k]) return; G.sent[id] = Date.now();
    cloudRpc('pub_greet', {target:id, k, port:String(S.boat.port || '')}).then(r => { toast(r === 'ok' ? L('Hilsenen er sendt.', 'Greeting sent.') : r === 'wait' ? L('Vent litt før du hilser igjen.', 'Wait a little before greeting again.') : L('Hilsenen kom ikke fram.', 'The greeting did not get through.')); })
      .catch(() => toast(L('Hilsenen kom ikke fram.', 'The greeting did not get through.')));
  }

  // ---------- the harbour's fiskarlag ----------
  const LAG_PER = 1500, LAG_PAY = 3000;
  const LG = {d:null, at:0, busy:false, err:false};
  function lagFetch(cb){
    if (!cloudOn() || LG.busy || Date.now() - LG.at < 30000) return; LG.busy = true;
    cloudRpc('lag_get', {w:wk()}).then(d => { LG.d = d; LG.err = false; }).catch(() => { LG.err = true; }).finally(() => { LG.at = Date.now(); LG.busy = false; if (cb) cb(); });
  }
  // the week's goal: 1 500 kg for each member who has landed this week (at least one)
  const lagGoal = d => { const act = (d.members || []).filter(m => m.kg > 0).length; return LAG_PER * Math.max(1, act); };
  const lagSum = d => (d.members || []).reduce((a, m) => a + (m.kg || 0), 0);
  function lagHtml(){
    const pt = portById(S.boat.port), nm = pt ? pt.name : '', h = [];
    h.push('<p>' + L('Fiskarlaget i ' + nm + ' samler fiskerne som hører til her. Hver uke har laget et felles mål: 1 500 kg for hver som har levert. Når laget når det, får alle som er med ' + kr(LAG_PAY) + '. Den som ikke har fisket, trekker ikke målet opp.',
      'The fishing club of ' + nm + ' gathers the fishers who belong here. Every week the club has a shared goal: 1,500 kg for each who has landed. When the club reaches it, everyone in it gets ' + kr(LAG_PAY) + '. One who has not fished does not raise the goal.') + '</p>');
    if (!cloudOn()) return h.join('') + '<p class="pb-why">' + L('Fiskarlaget krever at du er logget inn.', 'The fishing club needs you to be signed in.') + '</p>';
    const d = LG.d;
    if (!d) return h.join('') + '<p class="pb-why">' + (LG.err ? L('Fikk ikke kontakt med laget nå.', 'Could not reach the club now.') : L('Henter laget …', 'Fetching the club …')) + '</p>';
    if (!d.port) return h.join('') + '<div class="pb-bt">' + btn('lagjoin', L('Bli med i fiskarlaget', 'Join the fishing club'), false, 'pri') + '</div>';
    if (d.port !== S.boat.port){ const q = portById(d.port);
      return h.join('') + '<p>' + L('Du er med i fiskarlaget i ' + (q ? q.name : d.port) + '.', 'You are in the fishing club of ' + (q ? q.name : d.port) + '.') + '</p><div class="pb-bt">' + btn('lagjoin', L('Bytt til laget her', 'Switch to the club here'), false, 'pri') + '</div>'; }
    const goal = lagGoal(d), sum = lagSum(d), pc = Math.min(100, Math.round(sum / goal * 100)), w = wk(), P = S.pubSoc || {};
    h.push('<div class="pb-goal"><div style="width:' + pc + '%"></div></div><p><b>' + fmt(sum, 0) + ' / ' + fmt(goal, 0) + ' kg</b> ' + L('denne uka', 'this week') + '</p>');
    if (sum >= goal) h.push(P.lagW === w ? '<p class="pb-why">' + L('Ukas mål er nådd, og du har fått din del. Nytt mål neste uke.', 'This week\'s goal is reached and you have had your share. A new goal next week.') + '</p>' : '<div class="pb-bt">' + btn('lagpay', L('Hent din del', 'Collect your share') + ' · ' + kr(LAG_PAY), false, 'pri') + '</div>');
    h.push('<ul class="pb-who">' + (d.members || []).map(m => '<li>' + (m.me ? '<b>' + L('Deg', 'You') + '</b>' : esc(m.user ? peerName(m.user) : L('Ukjent', 'Unknown'))) + ' · ' + fmt(m.kg, 0) + ' kg</li>').join('') + '</ul>');
    h.push('<div class="pb-bt">' + btn('lagleave', L('Gå ut av laget', 'Leave the club')) + '</div>');
    return h.join('');
  }
  function lagJoin(port){
    cloudRpc('lag_join', {port}).then(r => { if (r !== 'ok') toast(L('Det gikk ikke nå.', 'That did not work now.')); LG.at = 0; lagFetch(() => { if (PUB3.panel === 'lag') PUB3.openSpot('lag'); }); })
      .catch(() => toast(L('Det gikk ikke nå.', 'That did not work now.')));
  }
  function lagPay(){
    const d = LG.d, w = wk(), P = S.pubSoc || (S.pubSoc = {}); if (!d || !d.port || P.lagW === w || lagSum(d) < lagGoal(d)) return;
    P.lagW = w; S.cash += LAG_PAY; if (typeof achAdd === 'function'){ achAdd('lag'); if (typeof achCheck === 'function') achCheck(); }
    msg('Fiskarlaget', L('Laget nådde ukas mål. Du fikk ' + kr(LAG_PAY) + '.', 'The club reached the week\'s goal. You got ' + kr(LAG_PAY) + '.'), 'The club reached the week\'s goal. You got ' + kr(LAG_PAY) + '.'); save();
  }

  // ---------- the week's quiz: five questions from the bank, the same for everyone in a game week ----------
  // [question, [three answers], the right one's index], each in Norwegian and English
  const QUIZ = [
    [['Hvor gyter mesteparten av skreien?', 'Where does most of the skrei spawn?'], [['Lofoten', 'Lofoten'], ['Oslofjorden', 'The Oslofjord'], ['Skagerrak', 'Skagerrak']], 0],
    [['Hva er skrei?', 'What is skrei?'], [['Kjønnsmoden torsk som vandrer fra Barentshavet for å gyte', 'Mature cod that migrates from the Barents Sea to spawn'], ['Ung sei langs land', 'Young saithe near the shore'], ['Tørket hyse', 'Dried haddock']], 0],
    [['Hvilken fisk er verdens største flatfisk?', 'Which fish is the world\'s largest flatfish?'], [['Rødspette', 'Plaice'], ['Kveite', 'Atlantic halibut'], ['Flyndre', 'Flounder']], 1],
    [['Hvilken farge har lanternen på styrbord side?', 'What colour is the starboard sidelight?'], [['Rød', 'Red'], ['Grønn', 'Green'], ['Hvit', 'White']], 1],
    [['Hvilken farge har lanternen på babord side?', 'What colour is the port sidelight?'], [['Rød', 'Red'], ['Grønn', 'Green'], ['Gul', 'Yellow']], 0],
    [['Hvor langt er en nautisk mil?', 'How long is a nautical mile?'], [['1 609 meter', '1,609 metres'], ['1 852 meter', '1,852 metres'], ['2 000 meter', '2,000 metres']], 1],
    [['Hva er en knop?', 'What is a knot?'], [['Én nautisk mil i timen', 'One nautical mile an hour'], ['Én kilometer i timen', 'One kilometre an hour'], ['Én meter i sekundet', 'One metre a second']], 0],
    [['Hva kalles dokumentet som fylles ut når fisken leveres?', 'What is the document filled in when the fish is landed?'], [['Sluttseddel', 'Landing note (sluttseddel)'], ['Fangstdagbok', 'Catch log'], ['Kvotebrev', 'Quota letter']], 0],
    [['Hvem selger førstehåndsfisken fra Nordmøre til Finnmark?', 'Who sells the first-hand fish from Nordmøre to Finnmark?'], [['Norges Råfisklag', 'Norges Råfisklag'], ['Kystverket', 'The Coastal Administration'], ['Havforskningsinstituttet', 'The Institute of Marine Research']], 0],
    [['Hvem fastsetter reguleringene for fisket i Norge?', 'Who sets the rules for fishing in Norway?'], [['Kystverket', 'The Coastal Administration'], ['Fiskeridirektoratet', 'The Directorate of Fisheries'], ['Sjøfartsdirektoratet', 'The Maritime Authority']], 1],
    [['Hva betyr blad B i fiskermanntallet?', 'What does sheet B in the fishermen\'s register mean?'], [['Fiske som hovedyrke', 'Fishing as the main occupation'], ['Fiske som biyrke', 'Fishing on the side'], ['Fritidsfisker', 'Recreational fisher']], 0],
    [['Hvordan kjenner du igjen en hyse?', 'How do you tell a haddock?'], [['En svart flekk over brystfinnen', 'A black spot above the pectoral fin'], ['Rød farge', 'A red colour'], ['Ingen sidelinje', 'No lateral line']], 0],
    [['Hva er tørrfisk?', 'What is stockfish (tørrfisk)?'], [['Torsk tørket på hjell uten salt', 'Cod dried on racks without salt'], ['Saltet og tørket torsk', 'Salted and dried cod'], ['Røkt laks', 'Smoked salmon']], 0],
    [['Hva er klippfisk?', 'What is klippfisk?'], [['Saltet og tørket torsk', 'Salted and dried cod'], ['Fersk sei', 'Fresh saithe'], ['Torsk tørket uten salt', 'Cod dried without salt']], 0],
    [['Hvordan kom kongekrabben til Barentshavet?', 'How did the red king crab come to the Barents Sea?'], [['Sovjetiske forskere satte den ut på 1960-tallet', 'Soviet scientists released it in the 1960s'], ['Den fulgte Golfstrømmen fra Karibia', 'It followed the Gulf Stream from the Caribbean'], ['Den kom med ballastvann fra Japan i 2000', 'It came in ballast water from Japan in 2000']], 0],
    [['Hvor står blåkveita?', 'Where is Greenland halibut found?'], [['Dypt, langs eggakanten', 'Deep, along the continental slope'], ['I fjæra', 'On the foreshore'], ['I elvene', 'In the rivers']], 0],
    [['Hva er en juksa?', 'What is a juksa?'], [['Et snøre med pilk og kroker som rykkes opp og ned', 'A line with a jig and hooks worked up and down'], ['Et garn med store masker', 'A net with a wide mesh'], ['En teine for krabbe', 'A pot for crab']], 0],
    [['Hva var en rorbu?', 'What was a rorbu?'], [['Et hus der tilreisende fiskere bodde under fisket', 'A house where visiting fishers lived during the season'], ['Et lager for salt', 'A store for salt'], ['Et fyr', 'A lighthouse']], 0],
    [['Hva er bifangst?', 'What is bycatch?'], [['Fisk av andre arter enn den du fisker etter', 'Fish of other species than the one you fish for'], ['Fisk under minstemål', 'Fish under the minimum size'], ['Fisk som selges direkte', 'Fish sold directly']], 0],
    [['Hva står AIS for?', 'What does AIS stand for?'], [['Automatic Identification System', 'Automatic Identification System'], ['Arctic Ice Service', 'Arctic Ice Service'], ['Anchor Information Signal', 'Anchor Information Signal']], 0],
    [['Hvor mye vind er liten kuling?', 'How much wind is a strong breeze (liten kuling)?'], [['22–27 knop', '22–27 knots'], ['8–12 knop', '8–12 knots'], ['48–55 knop', '48–55 knots']], 0],
    [['Hvilken styrke på Beaufort-skalaen er storm?', 'Which Beaufort force is a storm?'], [['6', '6'], ['8', '8'], ['10', '10']], 2],
    [['Hvilket år fikk Norge sin økonomiske sone på 200 nautiske mil?', 'In which year did Norway get its 200 nautical mile economic zone?'], [['1977', '1977'], ['1952', '1952'], ['1994', '1994']], 0],
    [['Hvem har ansvaret for fyr og sjømerker langs kysten?', 'Who looks after the lighthouses and sea marks?'], [['Kystverket', 'The Coastal Administration'], ['Forsvaret', 'The Armed Forces'], ['Kommunen', 'The municipality']], 0],
    [['Hva er mareld?', 'What is mareld?'], [['Plankton som lyser i sjøen', 'Plankton that glows in the sea'], ['Nordlys over havet', 'Northern lights over the sea'], ['Varme fra havbunnen', 'Heat from the sea floor']], 0],
    [['Hvilken familie hører seien til?', 'Which family does the saithe belong to?'], [['Torskefamilien', 'The cod family'], ['Laksefamilien', 'The salmon family'], ['Sildefamilien', 'The herring family']], 0],
    [['Hvilken side er babord?', 'Which side is port?'], [['Venstre når du ser forover', 'Left when looking forward'], ['Høyre når du ser forover', 'Right when looking forward'], ['Akterenden', 'The stern']], 0],
    [['Hva kalles torsken som holder seg langs kysten hele året?', 'What is the cod that stays along the coast all year called?'], [['Kysttorsk', 'Coastal cod'], ['Skrei', 'Skrei'], ['Polartorsk', 'Polar cod']], 0],
    [['Hva bruker steinbiten de kraftige tennene til?', 'What does the wolffish use its strong teeth for?'], [['Å knuse skjell og kråkeboller', 'To crush shells and sea urchins'], ['Å grave huler', 'To dig burrows'], ['Å jage sild', 'To chase herring']], 0],
    [['Hvilken farge har uer?', 'What colour is the redfish (uer)?'], [['Rød', 'Red'], ['Grønn', 'Green'], ['Svart', 'Black']], 0]
  ];
  const QUIZ_N = 5, QUIZ_PAY = 400;
  function quizSet(w){
    // the same five for everyone in the week: a shuffle seeded by the week
    let s = (w * 2654435761) >>> 0; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296, ix = QUIZ.map((_, i) => i);
    for (let i = ix.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [ix[i], ix[j]] = [ix[j], ix[i]]; }
    return ix.slice(0, QUIZ_N);
  }
  function quizState(){ const w = wk(), P = S.pubSoc || (S.pubSoc = {}); if (!P.quiz || P.quiz.w !== w) P.quiz = {w, a:[]}; return P.quiz; }
  function quizHtml(){
    const Q = quizState(), set = quizSet(Q.w), i = Q.a.length, right = Q.a.filter((a, k) => a === QUIZ[set[k]][2]).length;
    if (i >= QUIZ_N) return '<p>' + L('Du har tatt ukas quiz: ' + right + ' av ' + QUIZ_N + ' riktige, og fikk ' + kr(right * QUIZ_PAY) + '.', 'You have done this week\'s quiz: ' + right + ' of ' + QUIZ_N + ' right, and got ' + kr(right * QUIZ_PAY) + '.') + '</p><p class="pb-why">' + L('Ny quiz neste uke.', 'A new quiz next week.') + '</p>' +
      set.map((qi, k) => { const q = QUIZ[qi], ok = Q.a[k] === q[2]; return '<p class="pb-qa">' + (ok ? '✔ ' : '✘ ') + esc(L(...q[0])) + ' <small>' + esc(L(...q[1][q[2]])) + '</small></p>'; }).join('');
    const q = QUIZ[set[i]];
    return '<p class="pb-why">' + L('Spørsmål ' + (i + 1) + ' av ' + QUIZ_N + ' · ' + kr(QUIZ_PAY) + ' for hvert riktige svar', 'Question ' + (i + 1) + ' of ' + QUIZ_N + ' · ' + kr(QUIZ_PAY) + ' for each right answer') + '</p><p class="pb-say">' + esc(L(...q[0])) + '</p>' +
      '<div class="pb-qs">' + q[1].map((a, k) => btn('qz:' + k, esc(L(...a)))).join('') + '</div>';
  }
  function quizAnswer(k){
    const Q = quizState(), set = quizSet(Q.w), i = Q.a.length; if (i >= QUIZ_N) return;
    const q = QUIZ[set[i]], ok = k === q[2]; Q.a.push(k);
    if (ok){ S.cash += QUIZ_PAY; }
    toast(ok ? L('Riktig! +' + kr(QUIZ_PAY), 'Right! +' + kr(QUIZ_PAY)) : L('Feil. Riktig svar: ', 'Wrong. The answer: ') + L(...q[1][q[2]]));
    if (Q.a.length >= QUIZ_N){ const right = Q.a.filter((a, j) => a === QUIZ[set[j]][2]).length;
      if (right === QUIZ_N && typeof achAdd === 'function'){ achAdd('quiz'); if (typeof achCheck === 'function') achCheck(); }
      msg('Puben', L('Ukas quiz: ' + right + ' av ' + QUIZ_N + ' riktige.', 'This week\'s quiz: ' + right + ' of ' + QUIZ_N + ' right.'), 'This week\'s quiz: ' + right + ' of ' + QUIZ_N + ' right.'); }
    save();
  }

  // the buttons in the pub's panels that are the social side's: true when one was handled
  function act(q){
    if (q.startsWith('g:')){ const [, id, k] = q.split(':'); greet(id, +k); return true; }
    if (q === 'lagjoin'){ lagJoin(String(S.boat.port || '')); return true; }
    if (q === 'lagleave'){ lagJoin(null); return true; }
    if (q === 'lagpay'){ lagPay(); return true; }
    if (q.startsWith('qz:')){ quizAnswer(+q.slice(3)); return true; }
    return false;
  }
  function enter(){ greetFetch(); LG.at = 0; lagFetch(); }
  return {here, whoHtml, greetFetch, lagHtml, lagFetch, quizHtml, act, enter, GREET, QUIZ, quizSet, _lg:LG, _g:G};
})();
