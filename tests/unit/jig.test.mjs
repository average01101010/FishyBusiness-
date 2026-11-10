// Only a boat rigged for the jig can jig (Jonas 03.11.2026: «En havfiskebåt skal ikke kunne fiske med juksa»): vesselJigs in 10-gear.js
// reads VESSELS rigs; the ocean vessels have no juksa there.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const anchorsOf = file => { const b = Buffer.from(readFileSync(join(ROOT, 'src', 'data', file), 'utf8').trim(), 'base64'), n = b.readUInt32LE(12);
  return JSON.parse(b.subarray(20, 20 + n).toString('utf8')).scenes[0].extras.anchors; };
export default function (t){
  const K = t.K, V = K.VESSELS, hav = Object.keys(V).filter(k => V[k].cls === 'hav'), kyst = Object.keys(V).filter(k => V[k].cls !== 'hav');
  t.ok(hav.length >= 5 && hav.every(k => !K.vesselJigs(k)), `havfiskefartøyene jukser ikke: ${hav.join(', ')}`);
  t.ok(kyst.every(k => K.vesselJigs(k)), `kyst- og åpne båter jukser: ${kyst.join(', ')}`);

  // the reels one person tends (OPP2, V1 A, Jonas 07.11.2026: «A»): 3, 4 and 5 by the boat's tier (EQUIP.jukseLv), never more fish a reel.
  // Alone with every reel the boat takes: the effort is the reels tended times JIG.machine, and the tier only counts where she has room
  if (typeof K.jigPer !== 'function'){ t.ok(false, 'kjernen har jigPer'); return; }
  const S = K.newState(); K.set('S', S); const wt = K.workTeam; K.set('workTeam', () => ({n:1, sum:1, eff:1, crew:[], me:true}));
  const rows = [];
  for (const k of kyst){ Object.assign(K.BOAT, V[k]); S.boat.type = k; S.boat.gear = true; S.plan = null;
    const got = [1, 2, 3].map(lv => { S.equip = {jukse:V[k].jukseMax}; if (lv > 1) S.equip.jukseLv = lv; return [K.jigPer(), K.fishEffort()]; });
    const want = [3, 4, 5].map(per => { const fit = K.equipFits('jukseLv', k), p = fit ? per : 3, jk = Math.min(V[k].jukseMax, p); return [p, (1 - Math.ceil(jk / p) >= 0 ? Math.max(0, 1 - Math.ceil(jk / p)) * 2 : 0) + jk * K.JIG.machine]; });
    rows.push(k + ' ' + V[k].jukseMax + ': ' + got.map(g => g[1]).join('/'));
    t.eq(got, want, `${k} (plass til ${V[k].jukseMax} maskiner), alene: maskiner per person og innsats per trinn`); }
  t.note('innsats alene med alle maskinene, trinn 1/2/3: ' + rows.join(', '));
  K.set('workTeam', wt);

  // ---- no more reels than the rails have places for (valg 31 A, Jonas 10.11.2026: «Valg A»): the used hurtigsjark's model has three
  // jigging places (anchors.jigZ, OB9), so she takes three; reels over that went ashore and were paid back (ui/11-boot.js) ----
  { const A = anchorsOf('boat-hurtig11.b64'), n = (A.jigZ || []).length;
    t.ok(n >= 3 && V.hurtigsjark.jukseMax <= n, 'hurtigsjark: plass til ' + V.hurtigsjark.jukseMax + ' juksamaskiner, ' + n + ' juksaplasser i modellen'); }
  // (the same for the new hurtigsjark, OB10: four places on her starboard rail; her port side is the deckhouse, the bench and the crane)
  { const A = anchorsOf('boat-hs11.b64'), n = (A.jigZ || []).length;
    t.ok(n >= 4 && V.sjarkny.jukseMax <= n, 'sjarkny: plass til ' + V.sjarkny.jukseMax + ' juksamaskiner, ' + n + ' juksaplasser i modellen'); }
}
