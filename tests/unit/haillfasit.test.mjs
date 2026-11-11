// The server is the truth for haill and everything bought (HS4, 11.11.2026, docs/planer/haill-saldo.md; core/03-simulation.js
// haillFromSrv, srvToT, tToSrv, boostSrv): the haill aboard is the server's unless the server is not told yet; a trim and a Skippertak
// are what the delivered grants give, whatever the save says; and the pub's wheel on the server has the weights of PUB_WHEEL.
import fs from 'node:fs';
export default function (t){
  const K = t.K, H = 60;

  // ---- the haill aboard ----
  const loc = {type:'luksus', t0:900, how:'inv'}, srv = {id:7, type:'haill', t0:500};
  t.eq(K.haillFromSrv(loc, srv, false), {type:'haill', t0:500, how:'srv', id:7}, 'serveren kjenner en annen haill enn lagringen: serverens gjelder');
  t.eq(K.haillFromSrv(loc, null, false), null, 'en haill i lagringen som serveren ikke kjenner, tas bort');
  t.eq(K.haillFromSrv(null, srv, false), {type:'haill', t0:500, how:'srv', id:7}, 'lagringen uten haill om bord får serverens');
  t.eq(K.haillFromSrv({type:'haill', t0:9999, how:'srv', id:7}, srv, false), {type:'haill', t0:500, how:'srv', id:7}, 'minuttet flyttet fram i lagringen: serverens minutt gjelder');
  t.eq(K.haillFromSrv(loc, srv, true), loc, 'aktivert uten nett og serveren ikke fortalt ennå: den gjelder til serveren har svart');
  t.eq(K.haillFromSrv(null, null, true), null, 'ingenting noe sted: ingenting');
  t.eq(K.haillFromSrv(loc, {id:1, type:'kveite', t0:5}, false), null, 'et slag spillet ikke kjenner, gir ingen haill');
  t.eq(K.haillFromSrv(loc, {id:1, type:'haill', t0:NaN}, false), null, 'et minutt som ikke er et tall, gir ingen haill');
  t.eq(K.haillFromSrv(loc, {id:1, type:'haill', t0:'500'}, false), null, 'et minutt som er tekst, gir ingen haill');

  // ---- the server's minute and the game's ----
  t.eq(K.srvToT(500, 800, 123, true), 500, 'på den felles klokka er serverens minutt spillets');
  t.eq(K.srvToT(500, 800, 1000, false), 700, 'uten den felles klokka holdes bare alderen (300 minutter gammel)');
  t.eq(K.tToSrv(700, 800, 1000, false), 500, 'og tilbake igjen');
  t.eq(K.tToSrv(700, 800, 1000, true), 700, 'på den felles klokka sendes minuttet som det er');

  // ---- trim and Skippertak from the grants alone ----
  const pump = at => ({k:'pump', h:24, at}), turbo = at => ({k:'turbo', h:72, at});
  t.eq(K.boostSrv([], false, 100), null, 'ingen grants: ingen trim');
  t.eq(K.boostSrv(null, false, 100), null, 'ingen liste: ingen trim');
  t.eq(K.boostSrv([pump(1000)], false, 1100), {k:'pump', t0:1000, until:1000 + 24 * H}, 'én levert: slutten er levert + timene');
  t.eq(K.boostSrv([pump(1000)], false, 1000 + 24 * H), null, 'slutten er nådd: ingen trim');
  t.eq(K.boostSrv([pump(1300), pump(1000)], false, 1400), {k:'pump', t0:1000, until:1000 + 48 * H}, 'to av samme slag, i feil rekkefølge fra serveren: sortert, lagt sammen');
  t.eq(K.boostSrv([pump(1000), turbo(1300)], false, 1400), {k:'turbo', t0:1300, until:1300 + 72 * H}, 'et annet slag levert etterpå tar plassen');
  t.eq(K.boostSrv([{k:'light', h:24, at:1000}, {k:'max', h:96, at:1200}], true, 1300), {k:'max', t0:1000, until:1000 + 120 * H}, 'Skippertak legges alltid sammen');
  t.eq(K.boostSrv([pump(1000), pump(1000 + 30 * H)], false, 1000 + 31 * H), {k:'pump', t0:1000 + 30 * H, until:1000 + 54 * H}, 'den første gått ut før den andre: bare den andre teller');

  // ---- the wheel on the server (supabase/migrations/20261111140000_haill_srv.sql pub_spin) has the weights of PUB_WHEEL ----
  const W = {}; let tot = 0; for (const [k, w] of K.get('PUB_WHEEL')){ W[k] = (W[k] || 0) + w; tot += w; }
  const sql = fs.readFileSync(new URL('../../supabase/migrations/20261111140000_haill_srv.sql', import.meta.url), 'utf8');
  const m = /when x < (\d+) then 'tom' when x < (\d+) then 'rykte' when x < (\d+) then 'haill' else 'luksus'/.exec(sql);
  t.ok(!!m && /x := random\(\) \* 100;/.test(sql), 'pub_spin trekker et tall under 100 og deler det i tom, rykte, haill og luksus');
  if (m){ const a = +m[1], b = +m[2], c = +m[3], pct = k => W[k] / tot * 100;
    t.eq([a, b - a, c - b, 100 - c], [pct('tom'), pct('rykte'), pct('haill'), pct('luksus')], 'serverens hjul har samme andeler som PUB_WHEEL (tom, rykte, haill, luksus)'); }
  // (game hour 0 is 06:00, and an evening opens at 15:00: the server's pub_spin has the same numbers written out)
  t.eq(K.get('EPOCH_HR'), 6, 'spilltime 0 er klokka 06 (serverens pub_spin regner med 6)');
  t.eq([K.pubEvening(-1), K.pubEvening(9), K.pubEvening(20), K.pubEvening(34)], [-1, 0, 0, 1], 'kvelden regnes som på serveren: floor((H + 6 − 15) / 24)');
  t.eq([K.get('WORLD_T0'), K.get('GAME_RATE')], [Date.UTC(2026, 9, 5, 15, 0, 0), 6], 'serverens game_min bruker WORLD_T0 05.10.2026 15:00 UTC og GAME_RATE 6 (sekunder / 10)');
}
