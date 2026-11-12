// Feedback #2 from the test edition (12.11.2026): alone aboard and tired, the parcel for a freight mission was never loaded: the crew's
// job «last» waited for good, since the one aboard would rather rest than take a small job (13-work.js workAssign, restScore).
export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S'), {applyVessel, workAssign, queueJob, jobMinute, cargoMin} = K, b = S.boat;
  K.set('hsWork', () => 0.3); K.set('hsAt', () => 0.3);
  S.lang = 'no'; S.tut = 0; S.crew = []; S.me = S.cur; b.type = 'trebat'; applyVessel();
  const run = (energy, kg, hour) => { S.t = Math.floor(S.t / 1440) * 1440 + hour * 60; b.status = 'port'; b.port = 'frovag'; b.berth = 'main'; b.gop = null; b.land = null; b.iceUntil = 0; b.moorT = S.t - 90; b.castT = null; b.shift = null;
    S.plan = null; S.jobs = []; S.sleep = null; S.rest = null; S.energy = energy; S.mySt = 'pause';
    queueJob({kind:'last', crew:true, h:cargoMin(kg) / 60, no:'Lasting', en:'Loading'}); const j = S.jobs[0];
    for (let m = 1; m <= 240; m++){ S.t++; const A = workAssign(); const me = A.find(p => !p.c); S.mySt = me ? me.st : null; if (jobMinute(j, A)) return m; }
    return null; };
  for (const [e, kg, h] of [[94, 80, 12], [31, 80, 18], [31, 80, 1], [12, 80, 18], [60, 30, 12], [31, 500, 18]]){
    const m = run(e, kg, h); t.ok(m != null && m <= cargoMin(kg) + 1, 'alene om bord, energi ' + e + ', ' + kg + ' kg, kl. ' + h + ': lasta kommer om bord (' + m + ' min)'); }
  // with hands aboard, all worn out: as many as the job has places for go, so it takes the time it was sized for; one asleep on her
  // watch below is never on it, and a hand already on the job is left to it
  const crew = (n, fat) => { S.crew = [...Array(n).keys()].map(() => Object.assign(K.genCrew(), {bi:false, off:false, sleepW:false, fatigue:fat, morale:62, traits:[]})); };
  crew(2, 85); let m3 = run(12, 500, 18); t.ok(m3 != null && m3 <= cargoMin(500) + 2, 'tre utslitte om bord, 500 kg: ferdig på tida jobben er satt til (' + m3 + ' min, cargoMin ' + cargoMin(500) + ')');
  crew(1, 85); S.crew[0].sleepW = true; S.energy = 12; S.mySt = 'pause'; S.jobs = []; queueJob({kind:'last', crew:true, h:0.2}); S.t++;
  let A = workAssign(); t.eq(A.map(p => (p.c ? 'c' : 'me') + ':' + p.st).join(' '), 'me:last', 'den som sover på frivakt, tas ikke; den våkne går');
  crew(1, 10); S.energy = 94; S.mySt = 'pause'; S.jobs = []; queueJob({kind:'last', crew:true, h:1}); S.t++; A = workAssign();
  t.ok(A.some(p => p.st === 'last' && p.why !== 'need'), 'uthvilt mannskap tar jobben av seg selv, som før', A.map(p => p.st + ':' + p.why));
  // loading and landing are told apart on the job (09g-turer.js cargoJob), for the status line
  S.crew = []; S.jobs = []; K.cargoJob(80, 'Lossing av post', 'Landing the mail', true); K.cargoJob(80, 'Lasting av post', 'Loading the mail');
  t.eq(S.jobs.map(j => j.kind + ':' + (j.out ? 1 : 0)).join(' '), 'last:1 last:0', 'lossejobben er merket (out), lastejobben ikke');
  // the status line can tell freight from the crew's other work, and landing from loading (ui/04-panels-instruments.js)
  S.jobs = [{kind:'last', crew:true, h:0.1}]; t.ok(K.jobsFreight(), 'bare frakt i køen: statuslinja sier at det er lasta');
  S.jobs.push({kind:'egn', crew:true, h:1}); t.ok(!K.jobsFreight(), 'frakt og egning sammen: «Mannskapet er ferdig» som før');
}
