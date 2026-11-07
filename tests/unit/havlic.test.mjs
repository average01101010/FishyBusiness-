// The ocean permits and their quota factors (H1 of docs/planer/havsteget.md, 03.11.2026; core/03d-quota.js HAVLIC): the quota per
// factor 1.00 against J-161-2026 for 2026, the groups' quotas (§ 5) and how they follow the quota chain later, the vessel quota as
// factor × quota per factor, the permit each ocean vessel needs, and the shared register going down and up with one NPC ship of the
// kind leaving the sea (05d-hav.js havHeld).
export default function (t){
  const K = t.K, {HAVLIC, HREG, havQ, havGroup, havF, havLicFor, havLicWhy, havLicTake, licQ, npcReg, regFree, havData, havHeld, yearQuota, EPOCH} = K;
  const S = K.newState(); K.set('S', S);
  const Hy = y => (Date.UTC(y, 2, 15) - EPOCH) / 36e5, t1 = kg => kg / 1000;

  // 2026 as J-161-2026 has it
  const T = havQ({id:'tral'}, Hy(2026)), C = havQ({id:'konv'}, Hy(2026));
  t.ok(t1(T.torsk) === 372 && t1(T.hyse[0]) === 332 && t1(T.sei[0]) === 422, `torsketrål per faktor 1,00 i 2026: ${t1(T.torsk)} t torsk, ${t1(T.hyse[0])} t hyse, ${t1(T.sei[0])} t sei (J-161-2026: 372, 332, 422)`);
  t.ok(t1(C.torsk) === 118 && t1(C.hyse[0]) === 107 && C.sei[0] === Infinity, `konvensjonelt hav per faktor: ${t1(C.torsk)} t torsk, ${t1(C.hyse[0])} t hyse, sei uten fartøykvote (ingen garnseitillatelse)`);
  const R = havQ({id:'rnot'}, Hy(2026)), Kr = havQ({id:'krab'}, Hy(2026));
  t.ok(Math.abs(t1(R.sild) - 342666 * 0.49 / 69) < 1 && R.torsk === 0 && R.hyse[0] === 0, `ringnot: ${Math.round(t1(R.sild))} t NVG-sild per faktor, ingen torsk eller hyse`);
  t.ok(t1(Kr.snokrabbe) === 351, `snøkrabbe: garantert fartøykvote ${t1(Kr.snokrabbe)} t i 2026`);
  const G = havGroup('tral', 2026), GC = havGroup('konv', 2026);
  t.ok(G.torsk === 31785 && G.hyse === 28665 && G.sei === 43397 && GC.torsk === 10717 && GC.hyse === 8647 && GC.sei === 6128, 'gruppekvotene for 2026 som § 5 (torsketrål og konvensjonelt hav, torsk, hyse og sei)');
  // the formula behind the later years gives 2026 back from the quota chain (trawl 32 535 t with the saithe trawlers, conventional 10 717 t)
  const ch = yearQuota(2026).chain, top = 880 + 7000 + Math.max(3000, 0.009 * ch.N) + 500 + 2543 + 450, Rr = ch.N - top - ch.open;
  t.near(Rr * 0.28, 32535.29, 1, 'trålens torsk i kjeden 2026 (torsketrål 31 785 + seitrål 750)');
  t.near(Rr * 0.72 * 0.1281, 10717.12, 1, 'havfiskeflåtens torsk i kjeden 2026 (12,81 %)');
  // later years follow the chain and Norway's quota; snow crab its total quota
  const f27 = havF('tral', 'torsk', 2027), u27 = yearQuota(2027).chain.grp.u11 / yearQuota(2026).chain.grp.u11;
  t.ok(f27 > 0.7 && f27 < 1.5 && Math.abs(f27 / u27 - 1) < 0.1, `torsketrål 2027 følger kvotekjeden: ${f27.toFixed(3)} mot lukket gruppe under 11 m ${u27.toFixed(3)}`);
  t.ok(havF('konv', 'hyse', 2027) === yearQuota(2027).fh && havF('tral', 'sei', 2027) === yearQuota(2027).fs, 'hyse og sei følger Norges kvote');
  // (H3a, V4: the vessel quota worked out of the year's rules, SNOREG; 2027 by Fiskeridirektoratet's proposal, sak 17/2026: (16 594 - 3 300 - 300) / 30)
  t.ok(havQ({id:'krab'}, Hy(2027)).snokrabbe === 433000, `snøkrabbe 2027: ${t1(havQ({id:'krab'}, Hy(2027)).snokrabbe)} t (totalkvoten 16 594 t, forslaget for 2027)`);
  // the vessel quota is the factors times the quota per factor, and licQ gives it for an ocean permit
  const L = licQ({id:'tral', kf:1.5, extra:0.25}, Hy(2026));
  t.ok(t1(L.torsk) === 651 && t1(L.hyse[1]) === 581, `fartøykvoten er faktorene ganger kvoten per faktor: 1,75 × 372 = ${t1(L.torsk)} t torsk`);
  // the permit each ocean vessel needs, and none for a coast boat
  t.ok(havLicFor('bunntral') === 'tral' && havLicFor('autoliner') === 'konv' && havLicFor('pelagisk') === 'rnot' && havLicFor('ringnot38') === 'rnot' && havLicFor('snokrabbe') === 'krab' && havLicFor('sjark') === null,
    'tråleren trenger torsketrål, autolineren konvensjonelt hav, notbåtene ringnot, snøkrabbefartøyet snøkrabbe, sjarken ingen');
  t.ok(Object.values(K.VESSELS).filter(V => V.cls === 'hav').length === Object.keys(K.VESSELS).filter(k => K.VESSELS[k].cls === 'hav' && havLicFor(k)).length, 'hver havbåt har en tillatelse');

  // the prices (V2 B, Jonas: «Prisene må reflektere det virkelige liv»): the hull plus the quota at its value; an average permit
  const vk = K.havValue({id:'konv', kf:K.HAVKF.konv}, Hy(2026)), vt = K.havValue({id:'tral', kf:K.HAVKF.tral}, Hy(2026));
  t.ok(vk > 120e6 && vk < 200e6 && vt > 350e6 && vt < 550e6, `en snittillatelse er verdt ${Math.round(vk / 1e6)} MNOK (konvensjonelt hav, ${K.HAVKF.konv.toFixed(2)} faktorer) og ${Math.round(vt / 1e6)} MNOK (torsketrål, ${K.HAVKF.tral.toFixed(2)})`);
  const pa = K.havPrice('autoliner', Hy(2026)), O = K.havOffer('konv', Hy(2026));
  t.ok(pa === K.VESSELS.autoliner.price + K.havValue(O, Hy(2026)) && pa > K.VESSELS.autoliner.price * 2, `autolineren med ukas tillatelse (${O.kf} faktorer fra ${O.from}): ${Math.round(pa / 1e6)} MNOK, skroget ${K.VESSELS.autoliner.price / 1e6} MNOK`);
  t.ok(K.havOffer('konv', Hy(2026)).kf === K.havOffer('konv', Hy(2026) + 24).kf || Math.floor((Hy(2026) + 6) / 168) !== Math.floor((Hy(2026) + 30) / 168), 'tilbudet er det samme hele uka');
  // the register: a save from before H1 gets the ocean permits full
  S.npcReg = {u7:300, h7:280, h8:230, h9:200, h10:162, h14:291, h20:103};
  const R0 = npcReg(); t.ok(R0.tral === 36 && R0.konv === 26 && R0.rnot === 69 && R0.krab === 30 && R0.h9 === 200, 'en gammel lagring får havtillatelsene i registeret, fulle');
  // blad B first, as for the closed group
  S.fm = {n:0, kr:0, b:false}; const w = havLicWhy('bunntral'); t.ok(w && /blad B/.test(w[0]) && /blad B/.test(w[1]), `uten blad B: «${w && w[0]}»`);
  t.ok(havLicTake('bunntral', Hy(2027)) === null && npcReg().tral === 36, 'uten blad B tas ingen tillatelse');
  S.fm.b = true;
  const D = havData(), tral = D.ships.filter(s => s.lid === 'tral'), held0 = tral.filter(havHeld).length;
  const lic = havLicTake('bunntral', Hy(2027));
  t.ok(lic && lic.id === 'tral' && lic.hav && Math.abs(lic.kf - K.havOffer('tral', Hy(2027)).kf) < 1e-9 && lic.kf >= 0.6 * K.HAVKF.tral - 0.01 && lic.kf <= 1.4 * K.HAVKF.tral + 0.01 && lic.since === 2027 && npcReg().tral === 35, `kjøpet tar tillatelsen fra en NPC-eier (${lic && lic.from}): 35 igjen`);
  const gone = tral.filter(havHeld), others = D.ships.filter(s => s.lid !== 'tral' && havHeld(s));
  t.ok(held0 === 0 && gone.length === 1 && !others.length, `én NPC-tråler er borte fra havet (${gone.map(s => s.name).join(', ')}), ingen andre skip`);
  t.ok(D.meta.byGear.tral >= HREG.tral && D.meta.byGear.not >= HREG.rnot && D.meta.byGear.line + D.meta.byGear.garn + D.meta.byGear.snurrevad >= HREG.konv, 'NPC-havflåten har minst like mange skip som det finnes tillatelser (registeret er som i virkeligheten)');
  t.ok(licQ(lic, Hy(2027)).torsk === Math.round(372 * havF('tral', 'torsk', 2027) * lic.kf * 1000), `den kjøpte tillatelsen gir årets fartøykvote: ${lic.kf} faktorer, ${t1(licQ(lic, Hy(2027)).torsk)} t torsk`);
  regFree('tral'); t.ok(npcReg().tral === 36 && !tral.some(havHeld), 'solgt går tillatelsen tilbake, og tråleren er på havet igjen');
  regFree('tral'); t.ok(npcReg().tral === 36, 'registeret går aldri over antallet tillatelser');
  S.npcReg.krab = 0; const w2 = havLicWhy('snokrabbe'); t.ok(w2 && /ingen/.test(w2[0]) && havLicTake('snokrabbe', Hy(2027)) === null, `tomt register: «${w2 && w2[0]}»`);
}
