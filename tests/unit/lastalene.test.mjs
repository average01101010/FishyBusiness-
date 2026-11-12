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
    const m = run(e, kg, h); t.ok(m != null && m <= 60, 'alene om bord, energi ' + e + ', ' + kg + ' kg, kl. ' + h + ': lasta kommer om bord (' + m + ' min)'); }
  // the status line can tell freight from the crew's other work, and landing from loading (ui/04-panels-instruments.js)
  S.jobs = [{kind:'last', crew:true, h:0.1}]; t.ok(K.jobsFreight() && !S.jobs.every(j => j.out), 'bare frakt i køen: statuslinja sier «Lasta er om bord»');
  S.jobs.push({kind:'egn', crew:true, h:1}); t.ok(!K.jobsFreight(), 'frakt og egning sammen: «Mannskapet er ferdig» som før');
}
