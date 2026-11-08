# Kodekart

Seksjonene og funksjonene i hver kildefil, med linjenummer, i rekkefølgen malen setter dem sammen i (`src/index.html`). Lages av `python3 tools/docs/kodekart.py` og skrives på nytt av `/lever`, så linjenumrene kan være litt gamle; navnene og rekkefølgen stemmer. Slå opp her og bruk `grep` i stedet for å lese en stor fil hel.

## `src/js/errtrap.js` (60 linjer)

THE ERROR TRAP (02.11.2026; Jonas: «det viktigste er at vi klarer å fange opp så mange feil automatisk som mulig slik at vi

- **1** THE ERROR TRAP (02.11.2026; Jonas: «det viktigste er at vi klarer å fange opp så mange feil automatisk som mulig slik at vi

## `src/js/core/00-proj.js` (65 linjer)

- **2** CORE START
- **4** PROJECTION: UTM zone 33 (ETRS89, EPSG:25833)
  - 30 `utm33(lat, lon)`
  - 45 `utm33inv(E, N)`
  - 60 `natP(lat, lon)`
  - 61 `natLL(p)`

## `src/js/core/01-world.js` (481 linjer)

- **10** one clock for everyone (05.10.2026, the shared world V1)
  - 59 `gridScale(p)`
  - 63 `gridGamma(p)`
  - 81 `farL(kind, p)`
  - 89 `expoFar(p)`
  - 94 `landFracM(x, z)`
  - 99 `landXIn(X, x, z)`
  - 104 `dcCellFar(p)`
  - 111 `b64bytes(s)`
  - 112 `varints(b)`
  - 120 `loadFine()`
  - 128 `loadRoads()`
  - 144 `inHarbour(p)`
  - 151 `legHazard(a, c, sd)`
  - 164 `legHazardMemo(a, c, sd)`
  - 169 `draftHazards()`
  - 184 `legReady(a, c)`
  - 193 `nearestPlace(p)`
  - 197 `groundCheck(a, c)`
  - 214 `runAground(p)`
  - 229 `rocksNear(a, b, r)`
  - 239 `rocksIn(x0, y0, x1, y1)`
  - 247 `rocksAlong(a, b, r)`
  - 261 `coastDist(p)`
  - 262 `coastDistFar(p)`
  - 268 `decodeContours()`
  - 277 `isLand(p)`
  - 285 `isLandFar(p)`
  - 291 `isLandUI(p)`
  - 297 `inHarbourPocket(p)`
  - 303 `harbourNear(x, z)`
  - 309 `qPockets()`
  - 310 `pocketHit(US, QS, x, z)`
  - 317 `pocketsIn(x0, y0, x1, y1)`
  - 326 `legClear(a, b)`
  - 340 `legClearMemo(a, b)`
  - 371 `portLabel(p)`
- **387** the harbour unit (02.10.2026)
  - 428 `fillOut(U, lx, lz)`
  - 441 `onUnitGround(p)`
  - 448 `unitCovers(x, z, m)`
  - 456 `bridgeUnderUnit(br, extra)`
  - 461 `portApproach(pt)`

## `src/js/core/01b-mapdata.js` (215 linjer)

MAP DATA (phase K3 of the coast plan): the rasters in 10 km blocks, fetched in packs from map/

- **1** MAP DATA (phase K3 of the coast plan): the rasters in 10 km blocks, fetched in packs from map/
  - 22 `mapOnReady(f)`
- **23** IndexedDB, by content
  - 24 `mapIdb()`
  - 28 `idbDo(mode, f)`
  - 29 `mapFetch(pk)`
- **47** the manifest and the packs
  - 48 `mapStart(base)`
  - 65 `mapLoad(pk)`
  - 76 `mapPackOf(L, bx, by)`
  - 77 `mapPacksIn(kind, x0, y0, x1, y1)`
  - 85 `mapSimPacks(p, r)`
  - 86 `mapReadyAt(p, r)`
  - 88 `mapSimAt(p)`
  - 89 `mapViewAt(p)`
  - 92 `mapKindIn(kind, p, memo)`
  - 94 `mapNeed(p, r)`
  - 100 `mapPreload(pts, kinds, onProgress)`
  - 117 `mapLoadKind(kind)`
- **118** blocks
  - 119 `med16(raw, n)`
  - 125 `med8(raw, n)`
  - 130 `mapDecode(L, raw)`
  - 143 `mapBlock(L, bx, by)`
  - 155 `mapHasBlock(L, bx, by)`
  - 158 `mapBlockKnown(L, bx, by)`
  - 161 `rcell(L, ix, iy)`
  - 169 `rbil(L, p)`
  - 174 `rbilM(L, x, z)`
  - 179 `mapHasM(L, x0, z0, x1, z1)`
  - 186 `mapVec(pk, name)`
  - 193 `mapViewReady(x0, y0, x1, y1, then, kinds)`
  - 200 `simAreaReady()`
  - 210 `mapDrop(pk)`

## `src/js/core/01c-vec.js` (223 linjer)

THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces

- **1** THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces
  - 25 `inQuad(Q, x, z)`
  - 30 `pierBoxes(out, kind, n, X, Z, src)`
  - 47 `vecDecode(D)`
  - 122 `flyteTile(tx, ty)`
  - 131 `vecFinish(r)`
  - 140 `vecWorker()`
  - 157 `vecInput(pk, inflate)`
  - 165 `vecDecodeHere(pk)`
  - 167 `vecTile(tx, ty)`
  - 176 `vecTilesIn(x0, z0, x1, z1)`
  - 184 `roadsIn(x0, z0, x1, z1)`
  - 197 `bridgesIn(x0, z0, x1, z1)`
  - 199 `vecWant(x0, y0, x1, y1, then)`
  - 207 `vecPrune(pts, R = 60)`

## `src/js/core/01d-coast.js` (148 linjer)

THE COAST AS THE TRUTH FOR LAND AND SEA (04.10.2026; the user: «Jeg vil ha bort det som er i magenta», the land is to follow

- **1** THE COAST AS THE TRUTH FOR LAND AND SEA (04.10.2026; the user: «Jeg vil ha bort det som er i magenta», the land is to follow
  - 15 `coastBuild(b, T, CC, COX, COY)`
  - 51 `coastQuery(I, x, y)`
  - 68 `coastDistQ(I, x, y, cap)`
  - 83 `coastIndexAt(p, ask = true)`
  - 93 `coastSegHit(a, b)`
  - 118 `coastAt(p)`
  - 120 `coastAtIf(p)`
  - 122 `coastSdIf(p, cap)`
  - 124 `coastDistM(p, cap)`
  - 126 `coastWorker()`
  - 136 `coastDone(pk, r)`
  - 137 `coastBuildHere(pk)`
  - 138 `coastEnsure(pk)`

## `src/js/core/01e-marks.js` (101 linjer)

THE SEA MARKS ALONG THE WHOLE COAST (05.10.2026; Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av

- **1** THE SEA MARKS ALONG THE WHOLE COAST (05.10.2026; Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av
  - 11 `marksAdd(pk)`
  - 21 `marksRocksIn(x0, y0, x1, y1)`
  - 26 `marksNear(kind, x, y, R)`
- **34** THE NAMES OF THE FISHING GROUNDS ALONG THE WHOLE COAST (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026)
  - 53 `feltData()`
  - 67 `feltIn(x0, y0, x1, y1)`
  - 76 `feltShapesFrom(bytes)`
  - 89 `feltShape(f)`

## `src/js/core/02-species-gear.js` (400 linjer)

Placeholder prices (NOK/kg, grade A) – to be tuned

- **93** vessels, equipment, crew
  - 230 `fuelWeek(w)`
  - 232 `fuelPrice(H = S.t / 60, pid = S.boat && S.boat.port, diesel = BOAT.die…)`
  - 317 `equipFits(k, type)`
- **318** the upgrades in tiers (OPP1 of docs/planer/oppgraderinger.md, 07.11.2026)
  - 322 `upgSum(...p)`
  - 327 `equipLv(k, eq = S.equip, type = S.boat && S.boat.type)`
  - 331 `equipTier(k, eq, type)`
  - 335 `tierUnits(k, lv, type = S.boat && S.boat.type, eq = S.equip)`
  - 341 `tierKr(k, lv, type = S.boat && S.boat.type, eq = S.equip)`
  - 346 `equipKr(k, eq = S.equip, type = S.boat && S.boat.type)`
  - 352 `knifeX(eq, type)`
  - 353 `hookX(f, eq, type)`
  - 356 `jigSlip(eq, type)`
  - 359 `fuelBase(v, vmax, planing)`
  - 360 `fuelKOf(V)`
  - 362 `vesselDerive(V)`
  - 375 `reqOf(V)`
  - 381 `reqFill(eq, type)`
  - 393 `lsaOf(V)`

## `src/js/core/03-simulation.js` (1272 linjer)

fleet: each vessel keeps its own state; the company holds the rest. The simulation steps through the vessels one at a

- **1** fleet: each vessel keeps its own state; the company holds the rest. The simulation steps through the vessels one at a
  - 4 `curVessel()`
  - 5 `storeVessel(v)`
  - 6 `bindVessel(v)`
  - 7 `ensureFleet()`
  - 8 `withVessel(v, fn)`
  - 11 `onVessel(v, fn)`
  - 12 `eachVessel(fn)`
  - 14 `vget(v, k)`
  - 15 `vesselById(id)`
- **16** fleet rules (deltakerforskriften, J-30-2026): the company can have one vessel in the open group, and none there if it owns a
  - 18 `openVesselId()`
  - 20 `wpStop(w)`
  - 21 `meAboard()`
  - 24 `noCrewText()`
  - 29 `access()`
  - 31 `vesselValue(v)`
  - 34 `newVesselObj(type, pid, lic)`
- **46** the yard's rebuilds, per boat (S.boat; the user's list 04.10.2026): a bigger hold in three steps, the last doubling it (more
  - 97 `trimRescale(v0)`
  - 106 `trimSet(k)`
  - 112 `trimWords(k, how)`
  - 117 `trimEnd()`
  - 118 `powerX(b)`
  - 120 `applyVessel()`
  - 143 `speedPin()`
  - 157 `jigPer(eq, type)`
  - 158 `effortOf(people, jk, hand, per = jigPer()`
  - 159 `fishEffort()`
  - 167 `jigMeShare()`
  - 176 `hash(n)`
  - 177 `h2(a, b)`
  - 178 `vn(t, s)`
  - 179 `sstep(a, b, x)`
  - 180 `seasonal(arr, H)`
  - 200 `wxTrack()`
  - 211 `wxMeasure(p)`
  - 219 `wxPlace(p)`
  - 227 `wxLowShape(k, m)`
  - 234 `stormsNear(H, p)`
  - 246 `wxWindF(H, p)`
  - 247 `windAt(H, p)`
  - 257 `windDir(H, p)`
  - 268 `exposure(p)`
  - 270 `fcErr(H, now, seed)`
  - 271 `fcWind(H, now, p)`
  - 273 `beaufort(W)`
  - 288 `climW(p)`
  - 294 `climV(key, H, p)`
  - 295 `climDiff(key, H, p)`
  - 296 `climRatio(key, H, p)`
  - 297 `airTemp(H, p)`
  - 299 `precipAt(H, p)`
  - 300 `cloudAt(H, p)`
  - 301 `visibility(H, p)`
  - 303 `seaTemp(H, p)`
- **304** snow and the seasons on land (V2 and V3 of the weather plan; Jonas 09.10.2026: «vi må bygge ferdig værsystemene og årstidene»).
  - 316 `wxDay(d, p)`
  - 323 `seasonAt(H, p)`
  - 350 `snowLineAt(H, p)`
  - 357 `snowAt(H, z, p)`
  - 364 `obsAt(p)`
  - 365 `eqToHor(ra, dec, d, ob)`
  - 371 `sunEq(d)`
  - 375 `moonEq(d)`
  - 380 `sunAt(H, p)`
  - 381 `moonAt(H, p)`
  - 388 `moonName(mo)`
  - 390 `sunTimes(H, p)`
  - 398 `flagUp(H, p)`
- **403** tide: harmonic prediction per place (phase K10 of the coast plan)
  - 416 `tidePlace(p)`
  - 425 `tideH(H, p)`
  - 433 `tideEvents(H0, hours, p)`
  - 441 `auroraAt(H, p)`
  - 444 `riskLevel(W, hs)`
- **447** weight (the user's list 04.10.2026: «mer last og vekt betyr mindre fart ... viktig at ikke dette blir urealistisk»): what she
  - 452 `boatTons()`
  - 453 `boatTons0()`
  - 454 `loadF()`
- **455** fouling: weed and barnacles on the hull (S.boat.foul, 0 to 1) slow her up to 15 % and cost up to 25 % more fuel; it grows in
  - 459 `foulHour(H)`
  - 463 `fuelUse(b, l)`
  - 464 `fuelAdd(b, l, kr0)`
  - 465 `fuelLph(v, W)`
  - 466 `speedCap(hs, cb = 1)`
  - 469 `noise2(x, y, s)`
  - 475 `slopeAt(p)`
  - 483 `hotField(sp, p, H, k)`
  - 487 `hotspot(sp, p, H)`
  - 496 `schField(sp, p, H, k, si, v)`
  - 500 `school(sp, p, H)`
  - 507 `schoolHeading(sp, p, H)`
  - 516 `fieldCode(p)`
  - 518 `skreiSpot(p, d = depthF(p)`
  - 523 `gauss(u1, u2)`
  - 525 `sampleFish(sp, p, H)`
  - 530 `clsOf(sp, kg)`
  - 533 `kveiteClosed(H)`
  - 536 `targetF(sp, H, pilk)`
  - 541 `uerOpen(H)`
  - 545 `denPlace(p)`
  - 551 `denTime(H)`
  - 559 `denSp(sp, q, H, T)`
  - 573 `density(sp, p, H)`
  - 580 `eggaArea(p, d, H, E)`
  - 606 `tutBonus(sp, p)`
  - 618 `stockIdx(p)`
  - 620 `stockW(p)`
  - 625 `stockFill(v)`
  - 630 `stockAt(p, sp, H)`
  - 638 `takeStock(p, kg, sp, npc)`
- **645** the shared world V2 (05.10.2026; ui/10h-world.js, supabase/migrations/20261006000000_world_v2.sql): one sea, one quota and one
  - 651 `wq()`
  - 652 `wshOpen(y)`
  - 653 `wshSat(pid, sp, H)`
  - 654 `wshTake(k, kg)`
  - 656 `wshLand(port, H, acc, kgSp, codQ)`
  - 665 `initStock()`
  - 666 `stockHour(H)`
  - 691 `depthFactor(sp, d, k = 1)`
  - 696 `depthF(p)`
  - 702 `depthHas(p)`
  - 711 `deepAt(p)`
  - 716 `offDepth(p)`
  - 719 `tileDepth(p, d)`
  - 726 `depthWater(p)`
  - 738 `depthAt(p)`
  - 739 `depthModel(p)`
  - 740 `grade(f)`
- **741** How the catch keeps (D3 of the operations plan, Jonas 23.10.2026, svar 15a: calibrated against the sources)
  - 751 `keepDay(f)`
  - 752 `keepF(day)`
  - 755 `keepK(x, rrs)`
  - 757 `keepHours(f, f2, k)`
  - 759 `supplyFactor(H)`
  - 766 `weekOfH(H)`
  - 767 `weekDev(sp, H)`
  - 773 `marketPrice(sp, H, fz)`
  - 775 `clsPrice(port, sp, c, H, hook, fz)`
  - 781 `price(port, sp, H)`
  - 783 `avgPrice(sp, H, days)`
- **784** quotas north of 62° N: the regulation and the year's figures are in 03d-quota.js
  - 785 `doyH(H)`
  - 786 `yearH(H)`
  - 787 `quotaState()`
  - 805 `licValue(l)`
- **822** the books (Økonomi 2, Ø1, 27.10.2026, docs/planer/okonomi/02-design.md)
  - 844 `bookMigrate()`
  - 852 `bookAll(parts, no, en, vid)`
  - 866 `bookResult(y)`
- **868** the bank's accounts (Økonomi 2, Ø3, 27.10.2026; Jonas: «Automatisk skatteavsetning, rente på sparekonto, kassakreditt med
  - 877 `bankS()`
  - 885 `bankMove(k, kr0, no, en)`
  - 888 `bankAfterIncome(inKr)`
  - 896 `taxPay(kr0, no, en)`
  - 899 `bankRelease()`
  - 903 `bankDay(H)`
  - 936 `taxOf(P, form, days, skj = 0, carry = 0)`
  - 946 `saldoOf(v)`
  - 957 `skjOf(frac, ri = 1)`
  - 961 `txInit(H, adv)`
  - 963 `yearFrac(H)`
  - 965 `txProfit(H)`
  - 968 `txNow(H = S.t / 60)`
  - 974 `taxOwed(H = S.t / 60)`
  - 979 `enkAdv(H)`
  - 985 `taxPlan(H = S.t / 60)`
  - 998 `asBase(y)`
  - 1002 `txClose(H)`
  - 1018 `taxDayMark(H)`
  - 1024 `taxFix(H)`
  - 1041 `taxTick(H)`
  - 1079 `foundAS()`
  - 1092 `mvaCheck(total)`
  - 1101 `trekkOf(total, len)`
  - 1106 `fmInit()`
  - 1108 `fmLand(total)`
  - 1117 `takeLoan(amount, months, k)`
  - 1121 `payDown(x)`
  - 1127 `deal(price, ti, inn)`
  - 1134 `finance(x, months)`
  - 1137 `lenGroup()`
  - 1138 `codLimits(H)`
  - 1141 `codOpen(H)`
  - 1142 `codLimitNow(H)`
- **1143** haill: luck from the quay. Fresh goods: full effect for two days, fading to nothing on day seven. Sold for real money only (test mode now) or won at the pub.
  - 1161 `haillBoost()`
  - 1162 `haillLeft()`
  - 1163 `haillStage()`
  - 1165 `haillF()`
  - 1166 `luck(sp)`
  - 1170 `haillCap()`
  - 1172 `giveHaill(type, how)`
  - 1173 `useHaill(type)`
  - 1179 `pubEvening(H)`
  - 1180 `pubOpen(H)`
  - 1183 `capHold()`
  - 1185 `cargoRoom()`
  - 1187 `cargoMin(kg)`
- **1188** the daily login bonus: each real calendar day you open the game adds a point to a bonus on the fish price; each day
  - 1191 `streakState()`
  - 1192 `streakPct()`
  - 1193 `streakTouch()`
- **1204** cold: effective temperature from air temperature and wind, plus wet from rain, snow and spray. Cold, wet hands fish worse;
  - 1208 `effTemp(H)`
  - 1209 `coldPen(H, hs)`
- **1216** orders from buyers and customers: species, amount, quality, deadline and a price premium; reputation builds with each buyer
  - 1231 `gradeOk(g, q)`
  - 1232 `ordState()`
  - 1235 `custNear(c)`
  - 1240 `repOf(id)`
  - 1242 `bkOrderable(H)`
  - 1244 `bkPlant(id)`
  - 1245 `custSp(c)`
  - 1246 `spCatchable(sp, H)`
  - 1248 `ordersTick(H)`

## `src/js/core/03b-sea.js` (162 linjer)

SEA: fetch, wind sea, swell

- **1** SEA: fetch, wind sea, swell
  - 11 `fetchRay(x, y, dx, dy)`
  - 30 `fetchAt(p, from)`
  - 37 `fetchCell(ix, iy, k)`
  - 48 `fetchSector(p, k)`
  - 62 `fetchFine(p, from)`
  - 72 `fetchHere(p, from)`
  - 73 `fetchField(p, from)`
  - 83 `hsWMO(U)`
  - 88 `hsWind(U, F)`
  - 90 `fetchCap(U)`
  - 91 `tpWind(U, F)`
  - 95 `wdAt(H, p)`
  - 96 `weAt(H, p)`
  - 105 `swellOpen(H, p)`
  - 114 `swellFactor(p)`
  - 116 `hsParts(p, H)`
  - 121 `hsAt(p, H)`
  - 126 `hsOpen(H, p)`
  - 128 `fcHsOpen(H, now, p)`
  - 129 `hsAtFc(p, H, now)`
  - 135 `seaState(hs)`
  - 138 `seaHere(p, H)`
  - 148 `seaDirOf(rel)`
  - 155 `seaPartsNear(p, H)`
  - 157 `seaDirF(p, H, head)`

## `src/js/core/03c-stability.js` (216 linjer)

STABILITY: hydrostatics, the boat's motions in a sea, and what they do to the work aboard

- **1** STABILITY: hydrostatics, the boat's motions in a sea, and what they do to the work aboard
  - 11 `hullOf(type)`
  - 21 `stabLoad(b = S.boat)`
  - 28 `stabOf(type = S.boat.type, load = stabLoad()`
  - 41 `motionAt(p, H, head, kn, St = stabOf()`
  - 55 `windHeel(St, U)`
  - 58 `stabState(M)`
  - 67 `boatHead(H, b = S.boat)`
  - 69 `motionHere(H, b = S.boat)`
  - 76 `hsWork(p, H)`
  - 80 `stabTick(H)`
- **96** THE HULL IN THE SEA: buoyancy per section (Fysikk 4 F2, 07.11.2026; docs/planer/fysikk-4-sjo-og-skrog.md, Jonas' choice 2B)
  - 106 `hullSections(type, zb, zs)`
  - 136 `secArea(H, i, h)`
  - 141 `secBreadth(H, i, h)`
  - 148 `hullRest(H, D)`
  - 171 `hullX(R)`
  - 186 `hullStep(H, R, X, eta, deta, dt, o)`

## `src/js/core/03d-quota.js` (456 linjer)

Quotas for cod, haddock and saithe north of 62° N. The regulation as it stood from 1 October 2026 (J-187-2026, fiskeridir.no)

- **1** Quotas for cod, haddock and saithe north of 62° N. The regulation as it stood from 1 October 2026 (J-187-2026, fiskeridir.no)
  - 20 `norQuota(sp, tac)`
  - 30 `codChain(N)`
  - 37 `tacOf(sp, y)`
  - 40 `yearQuota(y)`
- **54** the closed group: quota lengths the game sells, with J-187-2026's quota factors and quantities (§§ 16, 18, 19). Cod is a fixed
  - 71 `licQ(l, H, len)`
  - 83 `sellerCod(id, H)`
  - 89 `openUsedSave(q)`
  - 91 `openUsedLoad()`
  - 92 `freshQuota()`
  - 93 `licStart(lic)`
- **94** the stocks and the total quotas year by year. History and the advice for 2027 from the Institute of Marine Research (hi.no,
  - 136 `kystAt(T, y)`
  - 137 `kystF(lat, H)`
  - 144 `stockYear(sp, y)`
  - 161 `ssbAt(sp, H)`
  - 162 `stockF(sp, H)`
- **164** the open group's season. About 2 100 boats fish the group quota down a day at a time (more in the skrei season and on days
  - 175 `qyOf(y)`
  - 182 `qyBoats(Y, y)`
  - 183 `qyStep(Y, y, d)`
  - 201 `quotaNewYear(y)`
  - 204 `qyAt(H)`
  - 206 `codStopDoy(y)`
  - 207 `openMaxAdd(H)`
  - 212 `ffPlan(y)`
  - 220 `ffPct(H)`
- **222** the closed group's register: a fixed number of rights (1 622 in the cod fishery north of 62° N on 17.10.2025, case document
  - 240 `npcReg()`
  - 242 `regSend(fn, id)`
  - 247 `regTake(id)`
  - 249 `regFree(id)`
  - 251 `regSeller(id, H)`
- **253** structure quotas (forskrift om spesielle kvoteordninger for kystfiskeflåten, J-244-2025): quota lengths 11–27.99 m may buy a
  - 257 `structRoom(l, id)`
  - 259 `structPrice(id, H)`
  - 260 `structIn(l, id, H)`
  - 261 `licExtra(l)`
  - 263 `structExpire(l, y)`
- **264** the special scheme for quota lengths under 11 m (kap. 2, from 2025): an owner with two such boats, both owned since the year
  - 266 `twoOK(la, lb, y)`
- **267** quota cooperation (J-187-2026 § 31): two closed-group boats under 11 m with different owners; both owners aboard, the passive
  - 271 `coopOffer(H)`
  - 272 `coopOK(l, y)`
- **274** the ocean permits (H1 of docs/planer/havsteget.md, 03.11.2026). Jonas' choices the same day: V1 A (the autoliner first), V2 B
- **296** the snow crab's regulation year by year, as data (V4 of docs/planer/havsteget-h3-snokrabbe.md, Jonas 06.11.2026: «Gjør det som blir
  - 315 `snoQuota(H)`
  - 317 `snoRoom(H)`
  - 320 `snoFlexNewYear(q, y)`
  - 326 `snoYear(y)`
  - 341 `havLicFor(type)`
  - 343 `havF(id, sp, y)`
  - 354 `havGroup(id, y)`
  - 357 `havQ(l, H)`
  - 365 `havLicWhy(type)`
  - 372 `havOffer(id, H)`
  - 375 `havValue(l, H)`
  - 389 `snoLicValue(y)`
  - 395 `havPrice(type, H)`
  - 397 `havLicTake(type, H)`
- **401** ling and tusk for vessels of 28 m and over (H2a of docs/planer/havsteget-h2-autoline.md, 05.11.2026). J-128-2026 (2026) and the
  - 409 `lbStop(y)`
  - 413 `lbShare(sp, H)`
  - 415 `lbNews(H)`
- **421** Greenland halibut (blåkveite) for vessels under 28 m (J-241-2025, the regulation for 2026; docs/blakveite.md 2-3, 07.10.2026)
  - 429 `bkSeason(y)`
  - 432 `bkOpen(H)`
  - 438 `bkDirect(H, len)`
  - 440 `bkState(H)`
  - 443 `bkAllow(H, bk, all)`
  - 448 `bkLanded(H, bk, all)`
  - 450 `bkNews(H)`

## `src/js/core/03e-rules.js` (498 linjer)

The rules along the coast (R2 of the rules plan, 05.10.2026). rulesAt() takes a place, a time, the boat's length, the gear and the

  - 31 `ruPip(rings, x, y)`
  - 32 `ruIn(P, x, y)`
  - 38 `ruBlock(bx, by)`
  - 56 `ruBits(p)`
  - 73 `ruSeaBlock(bx, by)`
  - 87 `ruSea(p)`
  - 91 `ruShelf(p)`
  - 96 `ruSkag(p, b = ruBits(p)`
  - 102 `zoneLic(c)`
  - 103 `zoneLicApply(c)`
  - 107 `insideFjord(p)`
  - 108 `insideBaseline(p)`
  - 110 `blDist(p)`
  - 116 `ruHom(p)`
  - 122 `landsdel(p)`
  - 123 `ruLok(p)`
  - 125 `ruZone(p)`
  - 126 `ruAt(id, p)`
  - 128 `ruLineName(ref)`
  - 143 `kcQuota(ll)`
  - 160 `ruSeaRules(c, q, ll, md, add)`
  - 233 `rulesAt(q)`
  - 398 `f26In(f, ll)`
  - 403 `ruBlockMsg(q)`
  - 405 `ruMinSize(sp, p)`
  - 419 `fjordLimits(p, H)`
  - 446 `ruCtx()`
  - 450 `ruNow()`
  - 456 `ruLayerBlock(bx, by, q, budget)`
  - 468 `ruWpQ(w)`
  - 473 `ruWpMsg(w)`
  - 480 `ruOpenNear(p, q, maxKm)`
  - 489 `ruTips()`

## `src/js/core/03f-fiske.js` (386 linjer)

The fishing along the coast as it really was, and where the fish is from it (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026).

  - 33 `fkData()`
  - 39 `fkIndex(fs)`
  - 46 `fkCell(sp, area, m, gear, lg)`
- **54** the location of a 2 km cell (ruLok kept per cell, plan 5b: looked up per cell and hour, not per point)
  - 56 `lokCands(bx, by)`
  - 63 `lokOfCell(p)`
- **71** the migrations (MIG): HI's descriptions, as curves of time and place
- **120** where the fish swim: the heading of the schools and of the good patches, by species, season and place
  - 129 `migOffshore(lat, lon)`
  - 137 `migHeading(sp, lat, lon, mf)`
  - 153 `migNode(si, sp, ix, iy, k, T, mw, kind)`
  - 161 `migDir(sp, p, k, T, mw, kind)`
  - 168 `mfOfH(H)`
- **170** the fish up and down in the water: by night most species rise from the bottom (HI; the diel vertical migration)
  - 176 `cellNight(c, H)`
  - 180 `vertZ(sp, night)`
  - 187 `gearVertF(sp, key, p, H)`
  - 195 `biteF(sp, p, H)`
- **201** the field from the notes: per species a Float32Array of locations × 12 months against Senja (NaN: no figure)
  - 203 `fkNeighbours()`
  - 211 `fkBuild()`
  - 294 `fkMonth(H)`
  - 296 `fkAt(a, l, T)`
  - 298 `skreiFront(lat, H, T)`
  - 304 `skreiPulse(c, H, T)`
  - 316 `fkAvail(sp, q, T)`
  - 354 `areaF(sp, p, H)`
  - 360 `skreiShare(p, H)`
  - 367 `skreiFlow(K, H)`
- **374** the sea's warmth: the fish go deeper when the surface is warmer than they like (B4, 02.11.2026)
  - 381 `tempDepthK(sp, c, H)`

## `src/js/core/03g-trykk.js` (207 linjer)

The fleet's pressure and the stock's baseline (B3 of docs/planer/bestand-og-flaate.md, 02.11.2026). The whole Norwegian fleet takes

  - 50 `trkAreas()`
  - 65 `trkCellW(c)`
  - 72 `trkSkreiMonths(D)`
  - 80 `trykkYear(sp, y)`
  - 136 `trkBiomass(sp, y, notes)`
  - 143 `trykkOpenScale(H)`
  - 152 `trkPlayersF(sp, y, Y)`
  - 162 `trkMonth(h)`
  - 168 `trkCell(c, H)`
  - 193 `fleetF(sp, p, H)`
  - 194 `fleetU(sp, p, H)`
  - 196 `baseAt(p, sp, H)`
  - 202 `skreiLeft(H)`

## `src/js/core/03h-is.js` (71 linjer)

---------- the sea ice by month (Havsteget H1b R5, V3 A; Jonas 03.11.2026: «iskanten etter måned») ----------

- **1** the sea ice by month (Havsteget H1b R5, V3 A; Jonas 03.11.2026: «iskanten etter måned»)
  - 25 `seaIceMonth(H)`
  - 30 `seaIceCell(A, p)`
  - 36 `seaIceAt(p, H)`
  - 58 `seaIceLim(V)`
  - 60 `seaIceShut(p, H, V)`
  - 62 `seaIceOnLeg(a, b, H, V)`

## `src/js/core/04-crew.js` (561 linjer)

crew: people with skills, habits and moods

- **1** crew: people with skills, habits and moods
  - 9 `crewHome()`
  - 31 `pickW(pairs)`
  - 32 `crewAge()`
  - 34 `skreiSeason(H)`
  - 35 `crewDerive(c)`
  - 36 `genCrew()`
  - 51 `deckSkills(ex)`
  - 53 `crewUpgrade(c)`
- **54** the share system of the coastal fleet (Økonomi 2, Ø2, 27.10.2026; docs/planer/okonomi/02-design.md)
  - 107 `lotMigrate(c)`
  - 117 `oppgPct(T, n, len)`
  - 129 `lottFishery(b = S.boat)`
  - 132 `lottM(n, len, fishery = 'juksa')`
  - 143 `tripOf(b = S.boat)`
  - 144 `tripAdd(b, k, kr0)`
  - 145 `tripCost(b = S.boat)`
- **148** the trip's limits on an ocean vessel (H2b of docs/planer/havsteget-h2-autoline.md, 05.11.2026). The fuel, the bait, the hooks for
  - 154 `tripHome(b = S.boat)`
  - 159 `tripLeft(b = S.boat)`
  - 176 `tripHour()`
- **186** the ocean vessel's crew as anonymous teams (H2b of docs/planer/havsteget-h2-autoline.md, V3 A; Jonas 05.11.2026: the teams
  - 199 `lagOf()`
  - 209 `lagPeople()`
  - 226 `lagOnDeck(H, under)`
  - 231 `lagMeal()`
  - 234 `lagLanded(kr)`
- **248** the provisions of an ocean vessel (H2b; Jonas 05.11.2026: «Fylles ved avgang»): the ship's chandler fills the stores aboard when she
  - 257 `provOf(b = S.boat)`
  - 258 `provFill()`
  - 264 `provMinute()`
  - 266 `crewHireWhy()`
  - 269 `lottParty()`
  - 279 `lottSplit(D)`
  - 283 `payMates()`
  - 288 `weekKr(len)`
  - 289 `lotWeek(c, H = S.t / 60)`
  - 294 `crewAboard(H, all)`
  - 297 `biDaysTxt(c)`
  - 300 `crewBiOff(H)`
  - 302 `crewEff(c, H, hs, g = 'juksa')`
- **309** what lifts or drags a person's effort just now, besides what they can and who they are (Jonas 23.10.2026: «dette skal være dynamisk
  - 315 `crewDrive(c, H, hs)`
  - 336 `crewEffort(c, H, hs)`
- **343** samhold: how the crew aboard pull together (Jonas 23.10.2026: «Samhold ja, men det må gjøres intuitivt»), 0-100 per vessel (S.team,
  - 348 `crewTeam()`
  - 353 `teamHour(H, on, hs, food)`
  - 372 `teamLine()`
  - 380 `teamEff(team, me = true, g = 'juksa')`
  - 382 `compat(a, b)`
  - 395 `crewById(id)`
  - 398 `holdNet()`
  - 407 `crewSettle(c)`
  - 416 `crewQuit(c, why, whyEn)`
- **418** Named folk on the coast (Jonas 06.11.2026): real people who have asked to be in the game, as crew to hire at their home quay
  - 428 `namedAge(n, H)`
  - 429 `namedMake(n)`
  - 434 `namedTaken(nid)`
  - 435 `namedTick(B)`
  - 444 `borsTick(H)`
  - 453 `crewRumour()`
  - 455 `crewTick(H)`
  - 523 `codRoom(H)`
- **525** the crew fly to and from Svalbard (H1b R7, 05.11.2026; docs/planer/havsteget-h1b-rammen.md V4 B)
  - 539 `flyIn(c)`
  - 548 `flyOut(c)`
  - 556 `flyTick()`

## `src/js/core/05-vessels.js` (1312 linjer)

---------- other vessels (deterministic, so every player sees the same traffic) ----------

- **1** other vessels (deterministic, so every player sees the same traffic)
  - 4 `prepRoute(r)`
  - 5 `atRoute(R, s)`
  - 24 `hashStr(t)`
  - 26 `berthSlot(q, key, big)`
  - 39 `berthShift(p, key, big)`
  - 47 `fleetBerth(i)`
  - 52 `fleetState(i, H)`
  - 61 `fleetState0(i, H)`
- **89** the NPC traffic along the coast (part 5 of the coast-wide plan, 03.10.2026; the user: full traffic along the coast, but only
  - 105 `coastWay(b, moored, m0)`
  - 129 `coastCells(a, z)`
  - 145 `coastWayAt(w, u, back)`
- **152** One national coastal fleet (L2/N1 of docs/planer/bestand-og-flaate.md, 02.11.2026)
  - 161 `flaateData()`
  - 167 `flaateApply(t)`
  - 188 `openDone(day0)`
  - 193 `heldShare(lg)`
  - 199 `coastGround(G, dI, i, H)`
  - 204 `coastState(b, H, hod = hodOf(H)`
- **250** where a coast boat lies at home (Jonas 18.10.2026: «npc-båter mange plasser er plassert i landmassen når de ligger ved kai»;
  - 262 `unitHit(x, z, r)`
  - 270 `dockInHarbour(x, z)`
  - 276 `moorBlocked(x, z, r)`
  - 285 `moorFree(p, hd, L, B, others)`
  - 304 `docksIn(x0, z0, x1, z1)`
  - 305 `dockFree(d, others, placed)`
  - 322 `moorAround(h, p)`
  - 328 `moorHarbour(h)`
  - 411 `moorKey(h)`
  - 414 `moorStill(h)`
  - 415 `coastMoor(b)`
  - 427 `seaward(p, c)`
  - 429 `coastSpot(gr, dI, i)`
  - 432 `coastCast(b, gr, dI, i, kc, Hc, spot)`
- **446** The coast boats' own gear in the sea (Jonas 02.11.2026: «Garn, liner og annet utstyr skal være synlig og vises i kartplotteren»)
  - 455 `coastGearKind(b)`
  - 461 `coastSet(b, k, pI, i, H)`
  - 470 `coastNear(H, only)`
  - 494 `npcStates(H, only)`
  - 546 `peerName(s)`
  - 561 `peerRouteStr(p, wps, idx)`
  - 571 `peerRoute(s)`
  - 577 `routeWalk(p, R, d, hd0)`
  - 584 `ptPred(q, w, t)`
  - 599 `ptPose(T, now)`
  - 607 `ptTake(q, now)`
  - 621 `peerStates()`
  - 636 `newState()`
  - 647 `log(no, en, k)`
  - 649 `navHour()`
  - 665 `nearestPort(p)`
  - 667 `nearestYard(p)`
  - 669 `step()`
  - 687 `vesselStep(H)`
  - 786 `plantFuel(b)`
  - 789 `sailV(H, hs)`
  - 801 `sail(H, W, hs)`
  - 831 `sailWaiting()`
  - 832 `sailReplan(pl, b, gp)`
  - 860 `iceWhy(p, tried)`
  - 862 `sailStop(pl, b, why)`
  - 870 `haltPlan(need)`
  - 880 `arrive(w)`
  - 898 `unstuckWhy()`
  - 904 `unstuckSpot()`
  - 911 `unstuck()`
  - 925 `dock(pid, berth)`
  - 952 `catchFactors(H, W, hs)`
  - 962 `fish(H, W, hs)`
  - 1034 `endFishing(why)`
  - 1050 `addCatch(sp, kg, cls, hook, opt)`
- **1068** work on deck: gutting and icing take hands and time
  - 1084 `deckHands()`
  - 1087 `deckPending()`
  - 1088 `deckEta(hands)`
  - 1093 `moveKg(x, kg, patch)`
  - 1101 `iceMinute()`
  - 1103 `deckMinute()`
- **1127** lying to in a storm (H1b R8, 05.11.2026)
  - 1144 `quayFar(b)`
  - 1148 `lieTo(W, hs)`
  - 1155 `lieToStep(W, hs)`
  - 1165 `risk(W, hs)`
  - 1193 `hullRepair()`
  - 1196 `svcOverdue()`
- **1197** the rescue boat (plan E3, 05.10.2026)
  - 1223 `rescueBases()`
  - 1232 `rescueBase(p)`
  - 1239 `rescueAis(H)`
  - 1243 `rescue(keepCatch)`
  - 1267 `towSea(p)`
  - 1272 `towRoutes(b)`
  - 1283 `towStep(H)`
  - 1295 `towDone(t)`
  - 1301 `towPose(frac)`

## `src/js/core/05c-air.js` (64 linjer)

---------- aircraft over the coast (plan E4, 05.10.2026) ----------

- **1** aircraft over the coast (plan E4, 05.10.2026)
  - 35 `airLegs()`
  - 47 `airStates(H, p, km)`

## `src/js/core/05d-hav.js` (265 linjer)

The ocean fleet as NPCs (H1 of docs/planer/bestand-og-flaate.md, 02.11.2026)

- **1** The ocean fleet as NPCs (H1 of docs/planer/bestand-og-flaate.md, 02.11.2026)
  - 25 `havHeld(s)`
  - 26 `havData()`
  - 46 `havTrip(s, k)`
  - 47 `havTrip0(s, k)`
  - 56 `havOpen(g, d)`
  - 69 `havIceClear(a, b, H)`
  - 70 `havIceWay(a, b, H)`
  - 91 `havWay(s, gi, pi, H0)`
  - 104 `havWay0(s, gi, pi, key)`
  - 120 `havLeg(a, b)`
  - 134 `havBerth(s, pi, H)`
  - 143 `havV(s, tr)`
  - 147 `havVisitors(pi, H)`
  - 161 `havLand(s, tr)`
  - 162 `havLand0(s, tr)`
  - 171 `havFish(s, k, u, g)`
  - 212 `havState(s, H, near)`
  - 237 `havNear(H, only)`

## `src/js/core/05e-sjovei.js` (1014 linjer)

---------- the rules of the road: who gives way, and the NPCs and Autonav that do (Ø11.1, docs/systemer/sjofart-og-lover.md) ----------

- **1** the rules of the road: who gives way, and the NPCs and Autonav that do (Ø11.1, docs/systemer/sjofart-og-lover.md)
  - 54 `colregLim(La, Lb)`
  - 60 `colregCls(n)`
  - 73 `colregHav(s, A)`
  - 81 `colregOwnCls(b)`
  - 90 `colregAisSt(n)`
  - 111 `colregSit(a, b, o = {})`
  - 142 `sjvNeed(R, hd, sg, want, mover, gs = 1)`
  - 153 `sjvSide(R, hd, mover, want, gs)`
  - 163 `sjvSide19(rel, ov)`
- **165** the manoeuvre laid over the shared course (npc-flåten 4 A): a fixed direction off the track, ramped at the turn's rate, held,
  - 168 `sjvOffAt(E, H)`
  - 176 `sjvPhase(E, H)`
  - 182 `sjvLagAt(E, H)`
  - 187 `sjvPose(n, E, H)`
  - 208 `sjvLive()`
  - 210 `sjvOwn()`
  - 226 `sjvNarrow(n, H)`
  - 235 `sjvRoom(n, nx, ny, k)`
  - 248 `sjvRoomOn(n, E, H)`
  - 261 `sjvRoomOwn(a, nx, ny, k)`
  - 269 `sjvStart(n, R, H, mover, why, own, id)`
- **280** Ø11.2: the sight, the lanterns and the sound signals (pure; sjvEval and the views use them)
  - 284 `sjvLampNm(k, L)`
  - 295 `sjvLightNm(D0, vis)`
  - 302 `sjvSeenKm(L, vis, dark)`
  - 304 `sjvHearNm(L)`
  - 309 `sjvFogPat(c, v, L)`
  - 318 `sjvManPat(side, slow)`
  - 323 `sjvLanternSt(n)`
  - 325 `sjvMinKn()`
  - 328 `sjvSafeMs(dM)`
  - 334 `sjvVisAt(H, p)`
  - 335 `sjvDark(H, p)`
  - 339 `sjvSig(id, pat, p, L, own)`
  - 347 `sjvFogSigs(H, list, A, gs, vis, dark)`
  - 365 `sjvCapV()`
- **371** one look: the encounters round the boat you follow (at most once a game tenth of a minute, a real second)
  - 372 `sjvEval(H, list)`
  - 492 `sjvNearMiss(n, R, clr)`
  - 502 `colregNpc(H, out, only)`
  - 516 `sjvTrack(list)`
- **518** Autonav
  - 522 `sjvFresh(model)`
  - 532 `sjvAuto(d, h, ds, T)`
  - 547 `sjvSail(pl, b, left)`
  - 564 `sjvCreep(pl, b, L, v)`
- **573** the warning's words (the strip, the box and the card, the chart plotter)
  - 575 `sjvSay(W, how)`
  - 612 `sjvWhen(W)`
  - 614 `sjvWarn()`
- **616** Ø11.3: collisions (sjøloven kap. 8, LOV-1994-06-24-39 §§ 161-164, read on Lovdata 06.11.2026)
  - 641 `sjvHullPts(X, Z, psi, L, B)`
  - 645 `sjvInPoly(P, x, z)`
  - 652 `sjvSat(A, B)`
  - 673 `sjvSatC(A, cx, cz, r)`
  - 682 `sjvMass(n)`
  - 683 `sjvOwnMass(b = S.boat)`
  - 686 `sjvKnEq(kn, mA, mB)`
  - 688 `sjvValue(L)`
  - 693 `sjvMatOf(n)`
  - 696 `sjvOtherCost(kn, L, mat, P)`
  - 706 `sjvOwnLoss(b, c)`
  - 712 `sjvCpa(a, b, gs)`
  - 717 `sjvTrailAdd(id, e)`
  - 735 `sjvFault(T, X)`
  - 802 `sjvFaultWord(w, no)`
  - 813 `sjvFaultSay(F, name, lang)`
  - 824 `sjvSettle(b, F, c, oth, name)`
  - 835 `sjvPaySay(M, F, name, lang)`
  - 843 `sjvKr(x, no)`
  - 845 `sjvFrom()`
  - 849 `sjvTo()`
  - 856 `sjvVhf(n, rec)`
  - 870 `sjvStandBy(n, H)`
  - 881 `sjvBlow(n, kn, E, H, pre)`
- **913** the manoeuvring model's steps (16b-dyn.js dynContact, by hand and on Autonav)
  - 916 `sjvClock()`
  - 923 `sjvNear(H, X, Z)`
  - 942 `sjvImpulse(d, P, I, ve, vz, m2, gs)`
  - 953 `sjvTouch(b, d, P)`
- **986** the look's sweep (sjvEval), when the model does not have her
  - 989 `sjvSweep(n, A, H, gs, on)`

## `src/js/core/06-services.js` (280 linjer)

---------- services behind the phone ----------

- **1** services behind the phone
  - 9 `coverage(p)`
  - 15 `msg(from, no, en)`
  - 18 `radio(no, en)`
  - 19 `radioForecast(H)`
  - 32 `hourly()`
  - 62 `skipPort(i)`
  - 66 `weekOf(H)`
  - 67 `npcWeekKg(i, w)`
  - 72 `myKg(H0, H1)`
  - 73 `toplist(w)`
  - 82 `newsForDay(day)`
- **149** standing operations plan: a hired skipper runs a saved route on set days, lands the catch and restocks
  - 151 `autoRestock()`
  - 160 `depart()`
  - 187 `finishJob(j)`
  - 215 `fitHours(k)`
  - 218 `jobOk(j)`
  - 223 `queueJob(j)`
  - 226 `jobsDone()`
  - 232 `shelterReturn(W, hsOver)`
  - 258 `startReturn(auto, W, home, hsOver, opsKeep)`
- **278** CORE END

## `src/js/core/06b-coastports.js` (166 linjer)

the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan)

- **1** the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan)
- **19** the registration mark (Malerverkstedet, 07.10.2026): the county's letters, a serial number and the municipality's letters,
  - 30 `regLetters(pt)`
  - 36 `regUsed(f, k, n)`
  - 37 `regOf(b)`
  - 43 `regDraw(e)`
  - 56 `callFree(p, n)`
  - 57 `callOf(b)`
  - 137 `plantsNear(p, n = 10)`
- **143** the ocean vessels at the plants (H0 of docs/planer/havsteget.md, 03.11.2026)
  - 150 `portWhy(pt, type)`

## `src/js/core/06c-steder.js` (44 linjer)

the tackle shops and the yards along the coast: the other two places of trade (07.10.2026)

- **1** the tackle shops and the yards along the coast: the other two places of trade (07.10.2026)
  - 32 `portServices(pt, berth)`
  - 40 `placesNear(p, kind, n = 3)`

## `src/js/core/06d-drift.js` (564 linjer)

Drift: the standing operations plan, per vessel. Made anew 23.10.2026 (Jonas: «en fullstendig redesign av driftsplan-systemet …

- **1** Drift: the standing operations plan, per vessel. Made anew 23.10.2026 (Jonas: «en fullstendig redesign av driftsplan-systemet …
  - 39 `driftNew(over)`
  - 45 `driftOps()`
  - 53 `opsSkipper()`
- **55** what the plan maker reckons a place gives: only what the player knows (Jonas 09.10.2026: the plan shows no expected catch; where the
  - 59 `planMark(p, g)`
  - 60 `planJigRate(p)`
  - 61 `planGearKg(kind, p, soak)`
  - 66 `planUnits(kind)`
  - 74 `planRestOk(pid)`
- **76** the places: H home (the anchorage of a big boat, or the port), Q the home quay, M the plant, A where a long trip rests, F:id a field, J:id a jig place
  - 77 `drP(o, k)`
  - 86 `drOrder(o)`
  - 92 `drMid(o)`
- **94** the legs between the places, found along the fairways (11-route.js leiaRoute) and kept in o.legs: {w [[x, y] …] the points before
  - 101 `drLeg(o, a, ap, b, bp)`
  - 108 `drLegPut(o, key, r, a, b)`
  - 114 `drFetch(o, pairs, vid)`
  - 124 `drLegsStale(o)`
- **126** making the plan: the plant, the anchorages and the legs. Async; cb(err) when done. The plan can be switched on once it is made.
  - 129 `driftMake(o, cb)`
- **164** the check: errors keep the plan from being switched on, warnings only inform
  - 165 `driftCheck(o)`
  - 208 `driftCrewWhy(o, quiet)`
- **219** the crew: rested, and had enough
  - 220 `drFat()`
  - 221 `drRested()`
  - 222 `drTired()`
  - 227 `driftRoles(o)`
  - 234 `driftWatch(H)`
- **242** the weather the plan allows, while it runs (05-vessels.js turns back over it)
  - 243 `driftWx()`
  - 245 `driftWxAhead(o, H, dur, pts)`
- **254** the trip: from where the boat is, the gear that is due, the jig places in turn, and the landing at the plant.
  - 257 `drSetOf(o, f)`
  - 258 `drTrip(o, H, budget, dry)`
  - 321 `drHere(o)`
  - 329 `drGoWps(o, k)`
- **337** the engine: each minute, on each vessel (05-vessels.js vesselStep)
  - 340 `drWait(o, k, no, en, hold)`
  - 346 `drStop(o, k, no, en, fix)`
  - 351 `driftFail(o, no, en)`
  - 357 `driftResume(o)`
  - 358 `opsStep(H)`
  - 373 `drSea(o, H)`
  - 383 `driftDecide(o, H)`
  - 433 `drGoTo(o, H, k, kind)`
  - 440 `drWxWait(o, wx)`
  - 446 `drNeed(o, need)`
  - 452 `drGo(o, H, budget)`
  - 468 `drDepart(o, wps, kind, noJig)`
  - 478 `drRulesWhy(o, H, placesOnly)`
  - 487 `opsLanded(pid, k)`
  - 499 `driftStock()`
  - 500 `opsReport(pid, kg, total, landed)`
- **511** what the plan is doing, in a few words: the page's «Nå» and the company's fleet list ([no, en])
  - 512 `driftNow(o)`
- **531** the trip as a timeline for the page: the one under way from where she is now, or the next one from where it starts.
  - 533 `driftSketch(o)`
- **557** the plan to another vessel of the company: the answers, made again there
  - 558 `driftCopy(vid)`

## `src/js/core/06g-plan2.js` (459 linjer)

Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.

- **1** Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.
  - 25 `p2When(H, H0)`
  - 35 `p2MeRate(pid, anchor)`
  - 46 `p2MeRestH(e, rate)`
  - 51 `p2Units(kind, lk)`
  - 58 `p2Left(o, q)`
  - 60 `p2LineKind(o)`
  - 79 `plan2New(over)`
  - 89 `plan2Ops()`
- **103** the places: a point, a port, or a key ('H' home, 'Q' the home quay, 'M' the plant, 'A' the rest anchorage)
  - 104 `plan2P(o, k)`
  - 113 `plan2LegH(o, a, ap, b, bp, v)`
- **120** the state the day is reckoned from: where she lies, the hold, the gear in the sea and aboard, the crew, you. Tests pass their own
  - 121 `plan2State(o)`
  - 139 `plan2StateOf(o)`
  - 140 `plan2RestOk(pid)`
  - 142 `plan2Ready(kind, st, lk)`
  - 146 `plan2NextDep(o, H, from)`
  - 156 `plan2Watch(H)`
  - 157 `plan2Roles(st)`
- **163** the ocean vessel's day (H2c of docs/planer/havsteget-h2-autoline.md, 05.11.2026): the autoline in a loop on the fields, round the
  - 171 `p2AutoEnd(o, st)`
  - 181 `planDayAuto(o, H0, st)`
- **233** the day. H0: the hour the day begins (the departure). Returns {t0, steps:[{t, k, …}], end, why:[no, en], skipped:[{id, no, en}]}.
  - 237 `p2TripLen(o)`
  - 238 `p2TripLast(o, dayIndex)`
  - 243 `p2LandsToday(o, dayIndex)`
  - 249 `planDay(o, H0, st)`
- **365** the day as text: [[clock, no, en], …], one line a step, the skipped places and the reason last
  - 366 `planDayText(o, day)`
- **400** the check: errors keep the plan from being switched on, warnings only inform (as driftCheck; the rhythm's rules from Jonas 26.10.2026)
  - 404 `plan2WatchWhy(st, aboard, short)`
  - 414 `p2Kits()`
  - 415 `plan2Check(o, st)`

## `src/js/core/06h-plan2-engine.js` (543 linjer)

Driftsplan 2, part 2: the engine (26.10.2026, docs/planer/driftsplan-2/02-design.md chapter 2). It follows the day that planDay

- **1** Driftsplan 2, part 2: the engine (26.10.2026, docs/planer/driftsplan-2/02-design.md chapter 2). It follows the day that planDay
  - 8 `plan2Key(o)`
  - 11 `plan2Here(o)`
  - 21 `plan2TideMin()`
  - 22 `plan2LegOk(o, a, ap, b, bp)`
- **30** making the plan: the plant, the anchorages, the legs and the shelter ports. Async; cb(err) when done
  - 31 `plan2Make(o, cb)`
- **75** what the plan says, waits for and stops at
  - 80 `plan2ActWhy(w, why)`
  - 82 `plan2Abort(o)`
  - 85 `plan2Wait(o, k, no, en, until, open)`
  - 91 `plan2Stop(o, k, no, en, fix)`
  - 101 `plan2Pause(o)`
  - 110 `plan2Start(o)`
  - 115 `plan2Resume(o)`
  - 117 `plan2CrewWhy(o)`
  - 127 `plan2Wx()`
  - 132 `plan2WxAhead(o, H, dur, pts, L)`
  - 141 `plan2WxWait(o, wx, H)`
  - 148 `plan2WxFirstOk(o, H, dur, pts)`
- **149** shelter without a search (part 3): back the way she came to the last place or port she passed, and from a place the kept leg to its
  - 152 `plan2Shelter(W, hsOver)`
  - 175 `plan2Cut(o, why)`
  - 187 `plan2RulesWhy(o, H, placesOnly)`
  - 194 `plan2RulesOpenAt(o, H)`
- **195** the engine: each minute, on each vessel (06d-drift.js opsStep hands over with DRIFT2 on)
  - 197 `plan2Step(H)`
  - 213 `plan2Decide(o, H)`
  - 244 `plan2MeRest(o, H)`
  - 256 `plan2SkipGiven()`
  - 267 `p2DayEnd(d)`
  - 269 `plan2Boundary(o, H)`
  - 288 `plan2Spent(o, H)`
  - 297 `plan2NewDay(o, H)`
  - 309 `plan2CostDay(o, r)`
  - 312 `plan2Caught(o, tr)`
  - 313 `plan2StatDay(o, d)`
- **314** a trip: the steps from i0 to the next port call, as waypoints on the kept legs
  - 315 `plan2Trip(o, D, i0)`
  - 368 `plan2Go(o, H, i0)`
  - 414 `plan2Sea(o, H)`
  - 462 `plan2WorkStop(o, H, W, hs)`
  - 473 `plan2WorkWait(o, H, wx, pts, port)`
  - 484 `plan2Landed(pid, k)`
  - 493 `plan2Report(pid, kg, total, landed)`
  - 505 `plan2Bait(o, s)`
  - 523 `plan2Egn(o, s)`
  - 530 `plan2WatchTick(H)`

## `src/js/core/06i-plan2-sno.js` (230 linjer)

Driftsplan 2 for the snow crab vessel (H3c of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026)

- **1** Driftsplan 2 for the snow crab vessel (H3c of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026)
  - 33 `p2SnoLenke(q, k)`
  - 41 `p2SnoFit(q, k)`
  - 54 `p2SnoSeason(H, nL)`
  - 61 `p2SnoQLeft(H, live)`
  - 68 `p2SnoState(o, st)`
  - 75 `p2SnoEnd(o, st)`
  - 91 `planDaySno(o, H0, st)`
  - 199 `p2SnoText(o, s, pl, kl, at)`
  - 211 `p2SnoCheck(o, st, ER, Wn)`

## `src/js/core/06e-anchor.js` (180 linjer)

Anchor (Jonas 08.10.2026: «alle båter skal ha mulighet til å ligge på anker … kai skal være standard … risiko forbundet med å

- **1** Anchor (Jonas 08.10.2026: «alle båter skal ha mulighet til å ligge på anker … kai skal være standard … risiko forbundet med å
  - 14 `anchorSpot(p, boatType)`
  - 23 `anchorLoad(W, hs, expo)`
  - 25 `anchorForecast(p, H, hours, spot)`
  - 32 `anchorAlarm(kind, n)`
  - 36 `anchorAwake()`
- **37** the current: the tide's stream and the wind's drift (the first current in the game; so far only the anchored boat feels it)
  - 45 `curAt(p, H)`
- **61** the ground tackle and how she lies to it
  - 67 `anchorGear(type)`
  - 73 `anchorReach(out, h, a)`
  - 81 `anchorForce(type, p, H)`
  - 91 `dropAnchor(auto)`
  - 106 `weighAnchor(silent)`
  - 113 `anchorUpIn()`
  - 118 `anchorSwing(H)`
  - 142 `anchorTick(H, W, hs)`
  - 171 `driftAnchorage(pid)`

## `src/js/core/07f-kar.js` (101 linjer)

the fish tubs (docs/planer/fiskekar-dekk.md, Jonas 04.11.2026)

- **1** the fish tubs (docs/planer/fiskekar-dekk.md, Jonas 04.11.2026)
  - 8 `karN(type, lv)`
  - 10 `karSteps(type)`
  - 16 `tubLoads(hold, n)`
- **30** packing a tub: where each fish lies (Jonas: «fisken gradvis fyller karret opp og ser realistisk ut, uten clipping»)
  - 47 `karIn(dims, y)`
  - 50 `inRR(x, z, hx, hz, r, g)`
  - 53 `fishCorners(x, z, yaw, L, b)`
  - 56 `fishFits(dims, x, y, z, yaw, L, b)`
  - 59 `tubPack(dims, spec, seed)`
  - 92 `karRefund()`

## `src/js/core/07-harbours.js` (640 linjer)

harbours: quays, berths and mooring

- **1** harbours: quays, berths and mooring
  - 27 `unitsAt(x, z)`
  - 32 `unitDredge(p, d)`
  - 42 `quayFace(pid, kind)`
- **73** the NPC boats' berths at the quays of the map data (part 4 of the coast-wide plan; the user's wish 03.10.2026: the quays made
- **82** L1 (01.11.2026; Jonas: «Båtene skal benytte seg av de ekte kaiene vi har laget modeller av og som vi har plassert rundt om i
  - 90 `quayReal(f)`
  - 105 `faceReserved(f)`
  - 119 `quayFree(f)`
  - 134 `quayOut(f, a, L)`
  - 154 `hullDry(p, hd, L, B)`
  - 159 `npcBerths(group, p, boats, R = 0.6)`
  - 199 `apprClr(q)`
  - 200 `clearLine(a, b)`
  - 203 `quayLand(q)`
  - 204 `quayLandLine(a, b)`
  - 211 `quayLandLeg(a, b)`
  - 225 `approachPath(pt)`
  - 282 `exitWps(pt, to)`
  - 283 `entryWps(pt, from)`
  - 293 `berthPose(pid, type, kind = 'main')`
- **325** the way in to a berth and out of it (the user's list 04.10.2026: «legge til og fra kai uten å gå gjennom landmasse og
  - 330 `berthBlocked(p, m = 2)`
  - 339 `berthClear(a, b, m)`
  - 340 `berthPath(from, bp)`
- **365** landing the catch
  - 388 `landFreeze()`
  - 394 `landPlan(type, kg, hold)`
  - 413 `landState(L, t)`
  - 422 `mottakOpen(H)`
  - 424 `mottakNext(H)`
  - 428 `mottakWhen(H, no, from)`
- **434** The queue at the plant (docs/planer/etter-tonys-test.md K1–K4, K6; Jonas 07.11.2026, V2 A and V3 A)
  - 445 `landSlots(pt)`
  - 446 `landQueueOn()`
  - 448 `landQueueAsk(force)`
  - 468 `landQueueGo()`
  - 475 `landQueueEnd()`
  - 481 `landLook(pts)`
  - 487 `startLanding(ops)`
  - 501 `landStart(pt, lp, kg, ops)`
  - 513 `finishLanding()`
  - 522 `iceChute(kg)`
- **524** the bunker quay: moving along the harbour and filling fuel
  - 537 `quayPos(b)`
  - 552 `portBusy(b)`
  - 553 `startShift(to, after)`
  - 563 `startFueling(ops)`
  - 576 `quayMinute()`
  - 593 `buyIce(kg, free)`
- **603** the tackle shop on the quay, in every harbour: hand jig, ice and halibut gear
  - 609 `shopBuy(k, kg, free)`

## `src/js/core/07c-naust.js` (225 linjer)

Father's naust by the home harbour, and the shop on the Finnsnes quay: where the 3D view sets them (05.10.2026)

- **1** Father's naust by the home harbour, and the shop on the Finnsnes quay: where the 3D view sets them (05.10.2026)
  - 17 `shoreSpot(cx, cz, r0, r1, o)`
  - 51 `naustClash(x, z, ux, uz, nx, nz, withBld)`
  - 69 `naustVecOk(cx, cz)`
  - 86 `naustWay(from, pid)`
  - 124 `naustFind(pid)`
  - 141 `naustWayOk(n, pid)`
  - 143 `naustSite()`
  - 160 `naustFace(pid)`
  - 170 `shopNearFind(n)`
  - 176 `shopNear()`
  - 184 `naustTarget(pt, r)`
  - 190 `shopSite()`
- **194** the naust as a home (05.10.2026; Jonas chose it from the list, 4): set it to rights step by step
  - 209 `naustRest(b)`
  - 211 `naustWhy(k)`
  - 219 `naustBuy(k)`

## `src/js/core/07d-rorbu.js` (82 linjer)

the rorbuer along the coast: a cheap bed ashore and a quay to lie at (05.10.2026)

- **1** the rorbuer along the coast: a cheap bed ashore and a quay to lie at (05.10.2026)
  - 24 `rorbuIn(x0, y0, x1, y1)`
  - 33 `rorbuSite(R)`
  - 55 `rorbuFace(pid)`
  - 61 `rorbuTarget(pt, r)`
  - 74 `rorbuSoon(p, r)`

## `src/js/core/07e-havn.js` (271 linjer)

A berth in the coast's harbours for the player's boats (Jonas 23.10.2026: «Båten burde som oftest ligge til en skikkelig kai

- **1** A berth in the coast's harbours for the player's boats (Jonas 23.10.2026: «Båten burde som oftest ligge til en skikkelig kai
  - 19 `isBerth(id)`
  - 21 `havnStore()`
  - 22 `havnPlace(id)`
  - 37 `havnTown(p)`
  - 49 `havnSide(p, T, force)`
  - 53 `havnName(p, side)`
  - 58 `havnLocal(t, hi)`
  - 74 `havnsNear(p, r)`
  - 85 `havnNm(H)`
  - 94 `havnTaken(H, vid)`
  - 108 `havnSlabs(cx, cz, R)`
  - 113 `havnOnSlab(S0, x, z)`
  - 119 `havnHullFree(p, hd, L, B, d, others, piers, slabs)`
  - 135 `havnBerths(H, type, vid, n)`
  - 174 `havnMoor(h)`
  - 177 `havnPlaceOf(H, b, type)`
  - 187 `havnPrune(keep)`
  - 194 `havnFace(pid)`
  - 196 `havnFind(p, r, type)`
  - 202 `havnTapNear(pt, r)`
  - 207 `havnOptions(p, r, type)`
- **212** held: the berth is the vessel's while she lies there, or while it is her plan's home (06d-drift.js o.home)
  - 213 `havnHold(id)`
  - 217 `havnFree(id)`
  - 225 `havnMinute()`
  - 233 `havnBlocked(x, z, r)`
- **238** the server (D: «Serveren holder rede på hvem som ligger hvor»): what the others hold in a harbour, asked at most every two minutes;
  - 241 `havnCloud()`
  - 242 `havnAsk(hid)`
  - 251 `havnPut(id, s)`
  - 259 `havnRenew()`
  - 260 `havnDrop(id)`
  - 261 `havnMoved(id)`

## `src/js/core/08-lore.js` (67 linjer)

the old ways at sea: superstition as lore

- **1** the old ways at sea: superstition as lore
  - 21 `loreTeller()`
  - 23 `hearLore(id, from, no, en)`
  - 31 `loreDepart()`
  - 38 `loreTurnBack()`
  - 39 `loreWater()`
  - 40 `loreRename(nm)`
  - 41 `loreNewBoat(nm)`
  - 43 `loreHour()`
  - 55 `lorePub()`

## `src/js/core/09-tattoos.js` (43 linjer)

sailors' tattoos: rewards that come by themselves

- **1** sailors' tattoos: rewards that come by themselves
  - 20 `tatCounts()`
  - 28 `tatAdd(k, n)`
  - 29 `tatTripStart()`
  - 30 `tatTripEnd(pid)`
  - 36 `tatLanding(pid)`
  - 38 `checkTattoos()`

## `src/js/core/09b-records.js` (44 linjer)

Personal records: the biggest fish you have landed of each species (Jonas 09.10.2026: «Nå kjører vi kun på største fisk man har

- **1** Personal records: the biggest fish you have landed of each species (Jonas 09.10.2026: «Nå kjører vi kun på største fisk man har
  - 9 `recState()`
  - 18 `recPlace(p)`
  - 22 `recCatch(sp, kg, how)`

## `src/js/core/09c-seasons.js` (161 linjer)

the seasons as events (05.10.2026; Jonas chose it from the list of what makes people play on, 5)

- **1** the seasons as events (05.10.2026; Jonas chose it from the list of what makes people play on, 5)
- **41** the seasons as shared events (30.10.2026; docs/forslag.md A2, point 7 of docs/research/oppdrag-gap-analyse.md)
  - 66 `evIn(e, p)`
  - 69 `evAt(H, port, sps)`
  - 74 `evClose(e, y, top)`
  - 84 `seasonNow(H)`
  - 90 `seasonNext(H, n = 8)`
  - 100 `festDays(y)`
  - 106 `festField(y)`
  - 110 `festCatch(sp, kg)`
  - 116 `festBoard(y)`
  - 123 `seasonDay(H)`
  - 142 `seasonNews(day)`
  - 151 `seasonTalk(H)`
  - 153 `seasonGrid()`

## `src/js/core/09d-folk.js` (164 linjer)

the people on the quay (05.10.2026; Jonas chose it from the list of what makes people play on, 7)

- **1** the people on the quay (05.10.2026; Jonas chose it from the list of what makes people play on, 7)
  - 25 `folkState()`
  - 37 `folkPf(id)`
  - 39 `folkSold(id, kg)`
- **47** the plant's hands comment on the landing (Jonas 08.10.2026: «arbeiderne på fiskemottakene kommenterer fangsten vår med tekst over
  - 109 `plantLine(pt, ls, rnd)`
  - 131 `plantSay(pt, ls)`
  - 141 `folkShop()`
  - 148 `folkPort(H)`

## `src/js/core/09e-fartstid.js` (56 linjer)

Fartstid: years at sea, 0 to 40 (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1)

- **1** Fartstid: years at sea, 0 to 40 (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1)
  - 12 `fsNeed(n)`
  - 14 `fsOf(p)`
  - 20 `fsSeed()`
  - 24 `fsState()`
  - 25 `fsText(p, long)`
  - 29 `fsAdd(pts, aboard)`
  - 37 `fsYear(y)`
  - 46 `fsMinute()`
  - 53 `fsLand(total)`
  - 55 `fsRested(realMs)`

## `src/js/core/09f-merker.js` (215 linjer)

Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)

- **1** Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)
  - 22 `achVisits()`
  - 23 `achVisitPort(pid)`
  - 87 `achState()`
  - 103 `achAdd(k, n)`
  - 104 `achSale(total, sps)`
  - 105 `achCatch(sp, cls)`
  - 107 `achMinute()`
  - 117 `achTripEnd(bad)`
- **119** the gifts: what fits the player now, in three tiers (seven in ten common, two good, one rare), bigger in later chapters
  - 121 `achPool(scale)`
  - 145 `achDraw(key, scale)`
  - 153 `achGive(key, scale, title)`
- **162** checking: each milestone in an open chapter, the chapters' own rewards, and the long badges
  - 164 `achCheck(quiet)`
  - 192 `achChapter(ch)`
  - 202 `achSeed()`
- **213** the first tow and the first repair are free (core/05-vessels.js rescue, hullRepair)
  - 214 `freeFirst(k)`

## `src/js/core/09g-turer.js` (985 linjer)

Turoppdrag: missions from where the boat is (07.10.2026; docs/engasjement.md point 4)

- **1** Turoppdrag: missions from where the boat is (07.10.2026; docs/engasjement.md point 4)
  - 84 `turState()`
  - 90 `turRebase(T)`
  - 104 `turV()`
  - 105 `turRange()`
  - 110 `turCap()`
  - 114 `turOwn()`
  - 125 `turRate()`
  - 127 `turWeek()`
  - 131 `turSlow()`
  - 133 `turFinal(m)`
  - 135 `turSpOk(sp)`
  - 139 `turForm()`
  - 141 `turClass(hGame)`
  - 146 `turFishH(kg, sp)`
  - 162 `turCan(a, b, hGame, back, fc = true)`
- **172** the quotas: what is left to land of a species (kg; Infinity where nothing limits it)
  - 178 `turRoom(sp, H)`
- **186** the offers
  - 187 `turPlants()`
  - 192 `turMe()`
  - 198 `turOrder(cand, me)`
  - 200 `turBest(o, cls, used, me = turMe()`
  - 207 `turBestAt(o, q, h, cls, me)`
  - 221 `turFrakt(o, cls, used, me = turMe()`
- **234** something happens under way
  - 237 `turEventRoll(m)`
  - 243 `turTipAt(m)`
  - 250 `turEventFire(m, b)`
- **269** the search: where does the species stand
  - 272 `turLeteSamples(c, sp, H)`
  - 280 `turLeteQs(c, sp, samples)`
  - 297 `turLete(o, cls, me = turMe()`
  - 319 `turLeteMinute(m, b)`
  - 331 `turLetePlace(p)`
  - 337 `turLeteAnswer(id, qi, opt)`
- **354** the people: who sends a mission, and what they remember
  - 359 `turManagerSays(m, n)`
  - 369 `turAsk(T = turState()`
- **383** the chain: three links for a manager who knows the boat (docs/planer/oppdrag-2.md K1, Jonas 30.10.2026 «Ja»)
  - 393 `turChainNext(prev)`
  - 414 `turChainEnd(m, ok)`
- **423** the first mission
  - 426 `turFirst(o)`
  - 441 `turFirstEnsure(T = turState()`
  - 452 `turGarn(o)`
  - 470 `turValue(L)`
  - 475 `turSlep(o, cls)`
  - 495 `turNpcs()`
  - 507 `turMinute()`
  - 536 `turStuck(T, b)`
  - 545 `turProveMinute(m, b)`
  - 569 `turSesong(o)`
  - 590 `turStages(m)`
  - 597 `turSesongStage(m)`
- **610** survey fishing for Havforskningsinstituttet
  - 615 `turProve(o, cls)`
  - 642 `turProveFish(m)`
  - 653 `turProveDone(m)`
  - 660 `turEkkoSaw(m)`
- **668** a picture of a lighthouse for Kystposten
  - 678 `turLysNext(m, from)`
  - 679 `turFoto(o, cls, near = null)`
  - 700 `turFotoAt()`
  - 703 `turFotoTake(m, seen, img)`
  - 723 `turMake()`
  - 749 `turEnsure(force)`
  - 770 `turWay()`
  - 777 `turDetour(m, way = turWay()`
- **789** taking, doing and finishing
  - 790 `turTake(id)`
  - 818 `turDrop(id)`
  - 823 `cargoJob(kg, no, en)`
  - 824 `turLoad(m)`
  - 833 `turSpawn(m)`
  - 852 `turEnd(m, ok, why, how)`
  - 870 `turPayOut(m, from, no, en, part)`
  - 878 `turDock(pid)`
  - 892 `turSale(pid, bySp)`
  - 905 `turHauled(s)`
  - 909 `turHour()`
  - 928 `turWhat(m)`
- **940** the trip as it starts: when it will be there, and a word from the crew (or the memory of Father, alone aboard)
  - 954 `turSay(who, no, en, k)`
  - 959 `turDepart()`
  - 979 `turMechanic()`

## `src/js/core/09h-press.js` (233 linjer)

Kystposten: the coast's paper (07.10.2026)

- **1** Kystposten: the coast's paper (07.10.2026)
  - 21 `pressState()`
  - 24 `pressPut(kind, d, loc)`
- **35** the words
  - 39 `pressWho(it)`
  - 45 `pressStory(it)`
  - 132 `pressTop()`
  - 144 `pressBygde()`
  - 157 `pressLand(local)`
- **167** the market: a record price, the highest in a year (Jonas 07.10.2026: «Ta rekordpriser»)
  - 172 `pressIx(sp, d)`
  - 173 `pressHigh(sp, d)`
  - 174 `pressRecords(d)`
  - 175 `pressPrice(sp, d)`
  - 190 `pressDay(H)`
- **194** the year's first skrei: the first cod landing north of Stad (62° N) after the skrei season begins (09c-seasons.js), from the
  - 196 `pressSkreiH(y)`
  - 198 `pressSkrei()`
  - 209 `pressList(local)`
  - 231 `pressUnread()`
  - 232 `pressSeen()`

## `src/js/core/09i-look.js` (111 linjer)

looks: how the people of the game look (Jonas 10.10.2026: character customisation, and the crew in the same clothes so nobody looks alike)

- **1** looks: how the people of the game look (Jonas 10.10.2026: character customisation, and the crew in the same clothes so nobody looks alike)
  - 31 `lookDefault()`
  - 33 `lookClean(l)`
  - 45 `lookKit(l)`
- **56** the crew's looks: drawn from the id, by age and sex
  - 57 `lookHash(s)`
  - 58 `lookRng(seed)`
  - 59 `lookPick(r, pairs)`
  - 61 `lookFromSeed(seed, sex, age, job)`
  - 81 `lookAllCrew()`
  - 83 `lookOf(c)`
  - 99 `lookQuay(id, i)`
  - 106 `lookFromKey(s)`

## `src/js/core/09j-kystvakt.js` (203 linjer)

Kystvakta: the inspection at the quay or on the field (Oppdrag 2 V1, 30.10.2026; docs/planer/oppdrag-2.md, docs/systemer/kvoter-og-regler.md 5.30)

- **1** Kystvakta: the inspection at the quay or on the field (Oppdrag 2 V1, 30.10.2026; docs/planer/oppdrag-2.md, docs/systemer/kvoter-og-regler.md 5.30)
- **10** the check at sea aboard an ocean vessel (H2e of docs/planer/havsteget-h2-autoline.md, 06.11.2026): the inspectors come over by the
  - 21 `kvCmKg(sp, cm)`
  - 22 `kvMinCm(sp, p)`
  - 25 `kvSampleFish(g, sp, w, p)`
  - 28 `kvHaulKeep(g, s)`
  - 33 `kvMix(ms, p, gear, most)`
  - 47 `kvAlong(a, b)`
  - 52 `kvMarks(s)`
  - 53 `kvHavCheck(b, sets, H, len, add, most)`
  - 85 `kvState()`
  - 88 `kvReady()`
  - 98 `kvHour()`
  - 106 `kvArrive()`
  - 115 `kvSide(b)`
  - 116 `kvMinute()`
  - 122 `kvNpcs()`
  - 125 `kvSums(sets, inside)`
  - 127 `kvMostSp(sets)`
  - 132 `kvCheck(b)`
  - 159 `kvWhat(r)`
  - 171 `kvWhatHav(r)`
  - 184 `kvFinish()`

## `src/js/core/10-gear.js` (887 linjer)

passive gear: nets, line and pots that stand in the sea while the boat is away

- **1** passive gear: nets, line and pots that stand in the sea while the boat is away
  - 23 `autoL(pg)`
  - 35 `autoRoom()`
  - 102 `kingArea(p)`
  - 108 `newPGear()`
- **109** bait (the user's list 04.10.2026): five kinds, each good for its own. Krabbe is the cheapest and fair on everything; reke is for
  - 134 `jigTake(sp, H, tackle)`
  - 139 `baitMixF(w, sp)`
  - 141 `baitOf(pg)`
  - 143 `btOf(L0)`
  - 145 `baitPick(pg, kg)`
  - 147 `baitFromHold(sp, kg)`
  - 160 `setLog(s, no, en, k)`
  - 161 `mySets(vid)`
  - 164 `hasHauler(kind)`
  - 169 `haulerX(kind, eq = S.equip, type)`
  - 170 `setterX(kind, eq = S.equip, type)`
- **175** the rig: a boat is rigged for one kind of fishing at a time. Jigging needs a hand jig or reels; line and pots
  - 181 `rigGuess()`
  - 187 `rigOf()`
  - 196 `gearReserve()`
  - 200 `rigHas(r)`
  - 203 `rigWrong(kind)`
  - 205 `haulerNoFit(kind)`
  - 212 `rigBlock(r)`
  - 223 `rigSet(r)`
- **225** what the vessel owns: aboard, ashore (baiting, mending) and in the sea
  - 226 `ownedUnits(kind)`
  - 233 `gearRoom(kind)`
- **235** buying (in port)
  - 238 `buyGate(what, spec, lv)`
  - 262 `tierGate(k, lv)`
  - 281 `tierBuy(k, lv)`
  - 291 `buyGear(what, spec, n)`
  - 326 `joinNets(id1, id2)`
  - 327 `splitNets(id, n)`
- **329** rules for setting at a place
  - 331 `segDist(p, a, b)`
  - 332 `nearSet(p, km)`
  - 333 `gearRules(kind, spec, p)`
  - 367 `setGeom(p, hdg, km)`
  - 374 `setGeomExact(p, hdg, km)`
- **376** the work at sea: status stays 'fishing' with b.gop, so deck work, rest rules, auto-return and the tub pause work as before
  - 377 `gopUnitMin(g, H, hs)`
  - 402 `startSet(kind, spec, fishAfter, hdg)`
  - 425 `startHaul(sid, reset, fishAfter)`
  - 444 `endLines(op, kind, d)`
  - 447 `thiefOf(s)`
  - 457 `haulSlow(g)`
  - 462 `gearOpMinute(H, W, hs)`
  - 486 `finishSet(g, H)`
  - 498 `gopEnd(g)`
  - 500 `gopAfter(b = S.boat)`
  - 504 `gearUnset(s, n)`
  - 514 `gopAbort(why)`
  - 534 `gearBack(s, n, cond, W)`
  - 541 `wearNets(s, g)`
  - 550 `haulUnit(g, H, SL)`
  - 568 `landFish(sp, kg, key, mesh, p, H, hook, fresh, g)`
  - 584 `netLen(w)`
  - 585 `retain(sp, key, mesh, w)`
  - 592 `sampleSel(sp, key, mesh, p, H)`
  - 595 `landCrabs(g, n, kg)`
  - 606 `finishHaul(g, H)`
- **642** a station on a route or the standing plan: haul what stands here and set it again, or set new gear if nothing stands here.
  - 645 `cycleSpec(kind, want, n)`
  - 659 `gearCycle(w, fishAfter)`
  - 677 `opsGearNeeds(o)`
  - 687 `opsGearAfter()`
- **693** in the sea, every hour: catch, losses, weather and deadlines (company level)
  - 694 `soakHour(s, H)`
  - 728 `gearHour(H)`
  - 762 `reportLost(sid)`
  - 770 `netMended(l)`
- **771** in port: baiting at the shed or by the crew, mending by the crew or at the net loft in Finnsnes
  - 777 `egnOrder(lk, n, bait)`
  - 791 `egnHands()`
  - 800 `egnSelf(lk, n, bait)`
  - 821 `stripSelf(lk, bait, n, then)`
  - 835 `mendSelf(nid)`
  - 846 `botOrder(nid)`
  - 857 `gearJob(j)`
  - 869 `gearJobCancel(j)`
  - 876 `shoreTick()`

## `src/js/core/10b-gearcare.js` (273 linjer)

gear care: wear, mending, hooks, jig tackle, and the tackle shop's service and buy-back (Jonas 08.10.2026)

- **1** gear care: wear, mending, hooks, jig tackle, and the tackle shop's service and buy-back (Jonas 08.10.2026)
  - 22 `careInit(pg)`
  - 34 `careHands(g)`
- **36** the catch factors of worn gear
  - 39 `jigKind()`
  - 40 `jigQ()`
  - 42 `jigWear()`
  - 44 `jigKr(k)`
  - 47 `jigSetsKr(pg = S.pgear, b = S.boat)`
- **50** wear in one haul (what the string looks like when it comes back): used by finishHaul and a stopped haul
  - 51 `wearOf(s, g)`
  - 66 `careBack(s, n, W)`
- **75** buying (the tackle shop): hooks in packs and spare jig sets
  - 76 `careBuy(what, spec, n)`
- **89** the autoline's hooks changed aboard (H2b of docs/planer/havsteget-h2-autoline.md, 05.11.2026; HI report 2024-11: about 5 % of the
  - 97 `autoFixHour()`
  - 101 `autoFixSpend()`
- **114** the crew's work in port (and the shop's, in half the time for a fee): hooks, line, pots, jig tackle, nets
  - 115 `hooksNeed(lk)`
  - 120 `seaWork()`
  - 124 `careWhy()`
  - 125 `careShopWhy()`
  - 128 `careQuote(what, key, shop)`
  - 141 `careGate(shop)`
  - 143 `careQueue(j, fee)`
  - 144 `hooksJob(lk, shop)`
  - 154 `lineFix(lk, shop)`
  - 162 `potFix(shop)`
  - 171 `netShop(nid)`
  - 181 `jigJob(k)`
  - 189 `jigChoose(k)`
  - 191 `careJobDone(j)`
  - 200 `careJobCancel(j)`
- **208** the shop buys gear back: a quarter of the new price times the condition (never above it)
  - 209 `sellValue(what, key, n)`
  - 220 `sellGear(what, key, n)`
- **234** upkeep by the crew when the boat lies in port with nothing else to do: once an hour, one job at a time, from what is in the store
  - 236 `careTick()`
- **258** what the crew says about the gear (Jonas 09.10.2026: «Tidvis kan mannskapet komme med kommentarer tilknyttet dette som feks å kommentere
  - 261 `gearTalk()`

## `src/js/core/10c-pick.js` (62 linjer)

Bestilt til henting (M2 in docs/planer/butikker-og-sponsorer.md, 10.2b, V12 A; Jonas 30.10.2026)

- **1** Bestilt til henting (M2 in docs/planer/butikker-og-sponsorer.md, 10.2b, V12 A; Jonas 30.10.2026)
  - 11 `pickState()`
  - 13 `pickKr(o)`
  - 28 `pickName(o)`
  - 46 `pickAdd(port, w, k, s, n)`
  - 59 `pickDrop(id)`

## `src/js/core/10d-snokrabbe.js` (192 linjer)

the snow crab (H3a of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026)

- **1** the snow crab (H3a of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026)
- **59** the drift ice over the strings (H3c, V3 B; Jonas 06.11.2026). Sources, read 06.11.2026 unless said: HI 2023-51 (Humborstad et al.):
  - 77 `snoIceOf(a, b, H)`
  - 80 `snoIceHour(s, H)`
  - 98 `snoField()`
  - 119 `snoArea(p, H)`
  - 128 `snoW(cw, soft)`
  - 129 `snoCrab(m)`
  - 138 `snoPts(s)`
  - 141 `snoSoak(s, H)`
  - 156 `landSno(g, n)`
  - 171 `snoHaulDone(g, s)`
  - 181 `snoSoftAt(p)`
  - 186 `snoTend(s, a, mid)`

## `src/js/core/10e-krabbefabrikk.js` (126 linjer)

the snow crab aboard: the factory for the clusters and the live crab in the tanks (H3b of docs/planer/havsteget-h3-snokrabbe.md,

- **1** the snow crab aboard: the factory for the clusters and the live crab in the tanks (H3b of docs/planer/havsteget-h3-snokrabbe.md,
  - 37 `snoUh(H)`
- **40** live or frozen, a choice for the trip (S.boat.snoMode: 'frys', the default, or 'lev'); only a vessel with tanks can go live
  - 43 `snoSetMode(m)`
- **49** the tanks
  - 61 `snoDayF(x, H, rho, T, flow)`
  - 64 `snoDeadLot(hr)`
  - 67 `snoTankHour(H)`
- **75** the stowing of a crab the sorting kept (landSno, 10d-snokrabbe.js): the dead to the freezer round, a live trip's crab into the
  - 77 `snoStow(c, k)`
- **85** the prices (kr/kg round weight). SNOP: the clusters (SPECIES pm) and the live crab (pmL) by month are the landing notes' (beløp for
  - 96 `snoPrice(port, x, H)`
- **101** the quota at a landing (landConf and sell, ui/08-actions.js): the live crab first on the extra quota (J-237-2025 § 4: «til
  - 104 `snoLandQ(H, q)`
- **110** the landing of the live crab: pumped from the tanks into tubs on deck and lifted ashore with the crane, KARLV.kg of crab a tub and a
- **114** the trip of a snow crab vessel (tripLeft, 04-crew.js): the bait for the pots at the trip's pace (a pot baited at each setting, half
  - 117 `snoTrip(R, b, d)`

## `src/js/core/09k-market.js` (194 linjer)

Kystmegleren: boat sales between players (B1–B8 in docs/planer/etter-tonys-test.md; Jonas 07.11.2026, V4 A, V5 A, V6 A)

- **1** Kystmegleren: boat sales between players (B1–B8 in docs/planer/etter-tonys-test.md; Jonas 07.11.2026, V4 A, V5 A, V6 A)
  - 14 `mktState()`
  - 21 `mbYardNear(pos)`
  - 23 `mbBounds(value)`
  - 24 `mbPriceWhy(value, start, buynow)`
  - 38 `mbOpsOn(v)`
  - 41 `mbWhy(v)`
  - 55 `mbPack(v, yard)`
  - 65 `mbCond(P)`
  - 68 `mbUnpack(P, port)`
  - 85 `mbLock(v, r, o, yard)`
  - 92 `mbBuyWhy(L, kr0)`
  - 101 `mbWishHits(list)`
- **103** the quick sale (B4): to the broker for 90 % of her value, at once, from anywhere she lies in port; the loans are paid first
  - 104 `mbQuickWhy(v)`
  - 108 `mbDrop(v)`
  - 115 `mbQuickSell(vid)`
- **125** the ledger (broker_pending): every krone bound, given back or paid, every boat handed over, applied once (S.mkt.mb.done keeps
  - 129 `mbApply(rows)`
- **174** delivery (10.2b «Få henne levert»): a skipper from the yard sails a boat of yours that nobody is aboard to the port you choose, for
  - 178 `mktDelWhy(v, to)`
  - 179 `mktDeliver(vid, to)`
  - 185 `mktHour(H)`

## `src/js/core/09l-sponsor.js` (31 linjer)

Sponsorer (M6 in docs/planer/butikker-og-sponsorer.md 4 and 5; CLAUDE.md: a real name, logo or product only with a written

- **1** Sponsorer (M6 in docs/planer/butikker-og-sponsorer.md 4 and 5; CLAUDE.md: a real name, logo or product only with a written
  - 9 `spSet(rows)`
  - 16 `spOf(kind, target)`
  - 18 `spSponsors()`
  - 20 `spUrl(site)`

## `src/js/core/09m-kystkart.js` (38 linjer)

Kystkartet: the collection for the whole coast (docs/planer/oppdrag-2.md K2, docs/engasjement.md arbeidslista 7)

- **1** Kystkartet: the collection for the whole coast (docs/planer/oppdrag-2.md K2, docs/engasjement.md arbeidslista 7)
  - 9 `kkState()`
  - 18 `kkHomAt(p)`
  - 20 `kkFish(p)`
  - 21 `kkMarks(K)`
  - 23 `kkFyr(fi)`
  - 26 `kkPlantsHad()`
  - 31 `kkCount()`
  - 37 `kkMinute()`

## `src/js/core/09n-ukas.js` (41 linjer)

Ukas fangst: the Sunday card (docs/planer/oppdrag-2.md U1, docs/engasjement.md arbeidslista 6; Jonas 30.10.2026: «10. Ja.»)

- **1** Ukas fangst: the Sunday card (docs/planer/oppdrag-2.md U1, docs/engasjement.md arbeidslista 6; Jonas 30.10.2026: «10. Ja.»)
  - 10 `ukeState()`
  - 12 `ukeBig(sp, kg)`
  - 15 `ukeSum(w)`
  - 34 `ukeDue()`
  - 40 `ukeLast()`

## `src/js/core/11-route.js` (664 linjer)

---------- Autonav (once «Følg leia»): a route along the fairway ----------

- **1** Autonav (once «Følg leia»): a route along the fairway
  - 39 `leiaTideCredit(a, b)`
  - 53 `leiaIceSet(a, b)`
  - 61 `leiaIceLeg(p, q)`
  - 75 `legLandIn(p, q, L, s0, s1)`
  - 79 `legNearPt(pt, z)`
  - 91 `legRunsWalk(W, ms)`
  - 102 `legRunsW(p, q, z)`
  - 104 `legRuns(p, q, z)`
  - 110 `legRunsAsync(p, q, z)`
  - 116 `legIdx(runs, L, n, last)`
  - 126 `leiaGrid(x0, y0, x1, y1, c, mask)`
  - 133 `leiaRocks(G)`
  - 142 `leiaShore(G, p)`
  - 152 `leiaCost(G, v, sd)`
  - 170 `leiaNearCell(G, p, sd, km = 1, free)`
  - 177 `leiaHeap()`
  - 185 `leiaSlice(st, t0, at)`
  - 188 `leiaSearch(G, s, t, sd, st)`
  - 219 `leiaFind(from, to, sd, st)`
  - 233 `leiaFind1(from, to, sd, st, pad, c0)`
  - 286 `leiaCorridor(pp, R, c, sd, st)`
  - 302 `leiaCorridor1(pp, bb, R, c, sd, st, first, last)`
  - 321 `leiaHarbourClr(pt, ports)`
  - 327 `leiaPortsBy(p, q)`
  - 331 `leiaLegOk(p, q, sd, margin)`
  - 358 `leiaLegOkL(p, q, sd, margin, tick)`
  - 366 `leiaLegFail(p, q, tick, endP, endQ, strict)`
  - 383 `rockOnLeg(a, b, r)`
  - 392 `leiaMend(P, sd, st, strict)`
  - 433 `leiaStraighten(P, sd, margin, st)`
  - 461 `leiaPull(P, sd, st)`
  - 495 `leiaRoute(a, b, aPort, bPort, opt)`
  - 521 `leiaLane(p, goal, km)`
  - 552 `leiaPocket(p, sd)`
  - 569 `leiaPocketOut(e, sd, st)`
  - 579 `leiaRoute0(a, b, aPort, bPort, pocket, opt0)`

## `src/js/core/11b-obstacles.js` (226 linjer)

WHAT A ROUTE MUST NOT SAIL THROUGH (Jonas 05.10.2026: «autoruter aldri skal gå gjennom 3d elementer eller landmasse», along

- **1** WHAT A ROUTE MUST NOT SAIL THROUGH (Jonas 05.10.2026: «autoruter aldri skal gå gjennom 3d elementer eller landmasse», along
  - 25 `obsBridge(br)`
  - 47 `obsIndex()`
  - 84 `obsDist(o, ax, az, bx, bz)`
  - 100 `obsCounts(o, air)`
  - 106 `obsSegHit(a, b, clr)`
  - 128 `obsRock(a, b)`
  - 134 `obsSafe(a, b, ref)`
  - 144 `obsWays(o, a, b)`
  - 179 `obsDetour(a, b, depth = 3, ref)`
  - 193 `obsRoute(a, wps)`
  - 200 `obsLoad(pts, ms = 4000)`
  - 215 `obsSail(pl, b)`

## `src/js/core/11c-leinett.js` (155 linjer)

---------- The fairway network (step 2 of the coast-wide Autonav, 08.10.2026) ----------

- **1** The fairway network (step 2 of the coast-wide Autonav, 08.10.2026)
  - 26 `lnetNear(p, km, max)`
  - 32 `lnetAhead(p, q, km, max, skip)`
  - 38 `lnetPath(srcs, dsts)`
  - 53 `lnetLoad(P)`
  - 64 `lnetAccess(p, i, sd, st, straight)`
  - 84 `lnetDists(srcs)`
  - 90 `lnetExit(A, end, sd, st)`
  - 117 `lnetRoute(from, to, sd, st)`

## `src/js/core/12-heat.js` (128 linjer)

---------- the echo-sounder heat map: how much fish there is around the boat ----------

- **1** the echo-sounder heat map: how much fish there is around the boat
  - 15 `heatTier()`
  - 22 `heatSpecies()`
  - 35 `heatSample(p, H)`
  - 45 `heatValue(v, sp)`
- **47** a usual haul, for the catch marks and the plan
  - 57 `heatSoakShare(kind, T)`
  - 62 `heatRigFactor()`
  - 67 `heatReset()`
  - 70 `heatTick()`
  - 105 `heatWork()`
  - 124 `heatAt(p)`
  - 127 `schoolDrift(sp, p, H)`

## `src/js/core/13-work.js` (357 linjer)

work aboard: stations, and how the crew share them

- **1** work aboard: stations, and how the crew share them
  - 49 `catchGut()`
  - 50 `catchIce()`
- **51** the mate (Jonas 23.10.2026: «vi må kunne definere 1 fra mannskapet til å være styrmann ombord»): one of the crew, the same one
  - 54 `setMate(id)`
- **57** the skipper (Jonas 23.10.2026: «når jeg/brukeren ikke er ombord må det utnevnes en skipper og en styrmann ombord»): one of the crew,
  - 60 `setSkipper(id)`
- **63** what a person is used to: minutes at each station (c.hab), fading by a fifth a month. The station with most of them, once it is
  - 66 `crewRole(c)`
  - 68 `habSeed(c)`
- **69** how good a person is at a station's work (1-5): you are a skipper who knows every job on deck
  - 70 `stSkill(c, k, ctx, sk)`
  - 87 `workScore(p, k, ctx, need, sk)`
  - 99 `restScore(p)`
  - 110 `workWhy(p, k, ctx, sk)`
  - 121 `stPlaces(st, ctx)`
  - 131 `workCtx(as)`
- **142** the crew's own jobs as stations: where they may be worked (in port, or at sea while she goes or lies still: seaWork), how many can
  - 144 `jobsOpen(as)`
  - 145 `jobPlaces(j)`
  - 156 `jobCoop(j, n)`
  - 160 `jobW(j)`
  - 166 `jobRate(j, A)`
  - 173 `jobMinute(j, A)`
  - 183 `jobWait(j)`
  - 188 `workAssign(as)`
- **263** what a person does on a break (Jonas 23.10.2026: «La det også stå hva de gjør når de ikke har en aktiv arbeidsoppgave som feks: lener
  - 279 `crewVice(c)`
  - 281 `idleEnv()`
  - 289 `idleWeights(p, ctx, E, mates)`
  - 311 `idleAssign(P, ctx)`
  - 325 `idleText(p)`
  - 331 `workDoing(p)`
  - 337 `workTeam(st, g, as)`
  - 343 `workMinute()`

## `src/js/core/14-crewlife.js` (466 linjer)

life aboard: learning, meals, the rest rule and what the crew says

- **1** life aboard: learning, meals, the rest rule and what the crew says
- **3** learning: an hour on a station trains that skill. The young, the eager and the content learn fastest, and it gets
  - 6 `ageLearn(a)`
  - 13 `stationSkill(st)`
  - 30 `learnHour(c)`
- **40** meals (Ø8b M3, Jonas 06.11.2026: «Frokost 06:30, Lunsj 12:30, Middag 18:30, Nattmat 00:30», and «Mannskapet står ikke nødvendigvis
  - 51 `mealState()`
  - 52 `foodScore()`
  - 55 `nextMealAt(t)`
  - 61 `mealDue()`
  - 64 `crewAsleep(p, A)`
  - 68 `mealAwake(A)`
  - 73 `cookPick(P)`
  - 78 `mealMinute(A)`
  - 97 `serveMeal(q, cook, me, dish)`
- **109** what the crew says: lines driven by the situation and by each person's ways. [no, en, trait the line suits]
  - 226 `dialectAt(p)`
  - 227 `dialectOf(c)`
  - 231 `dialectText(key, text)`
  - 235 `crewDialect(c, text)`
  - 265 `crewSay(c, sit, vars)`
  - 287 `vitalsTalk(on)`
  - 297 `sayHour(H, on, hs)`
- **317** advice from those who know (Jonas 23.10.2026: «de kan gjerne ta initiativ og komme med kommentarer knyttet til driften om de vet
  - 321 `crewAdvice(H, on, W, fs)`
  - 335 `adviceGround(H)`
- **348** mistakes on deck (Jonas 23.10.2026: «Ja, det kan de godt gjøre. Det skaper realisme»): now and then a fish slips over the side, the
  - 352 `crewRand()`
  - 357 `crewSlip(team)`
  - 377 `railLost(kg)`
  - 385 `railWeek(id = S.cur)`
- **387** Del 2 of «mannskap med liv» (docs/mannskap-plan.md; Jonas 17.10.2026): each person's life beside the work
  - 393 `crewLife(c)`
  - 404 `lifeStory(c, no, en)`
  - 406 `lifeEarn(c, sum)`
  - 408 `lifeOff(c, days, no, en, sno, sen)`
  - 410 `lifeDay(c, H)`
  - 426 `lifeInjury(c, hs)`
  - 429 `lifeOffTick(c)`
  - 432 `lifeDepart(c)`
  - 443 `alumniGround(a)`
  - 445 `alumniStates(H)`
  - 452 `lifeHail(H)`
  - 459 `alumniReturn(B)`

## `src/js/core/14b-sikkerhet.js` (361 linjer)

Ø11.6: man overboard (SK2 the risk, SK3 the event; docs/planer/lover-regler-sikkerhet.md kap. 6, docs/systemer/sjofart-og-lover.md kap. 6)

- **1** Ø11.6: man overboard (SK2 the risk, SK3 the event; docs/planer/lover-regler-sikkerhet.md kap. 6, docs/systemer/sjofart-og-lover.md kap. 6)
- **48** pure: the sea, the rate, the time in the water, the sight
  - 50 `mobSeaX(W, hs, r)`
  - 52 `mobSeaF(x)`
  - 55 `mobIcing(T, W, sst)`
  - 57 `mobRate(w, o)`
  - 58 `mobLimMin(T)`
  - 59 `mobAbleMin(T)`
  - 62 `mobSightKm(o)`
  - 70 `mobLee(H, p, k)`
  - 78 `mobRnd(k)`
- **80** who is on deck (core/13-work.js workAssign, every call; the minute's own call, as undefined, is kept)
  - 82 `mobDeck(P, as)`
  - 88 `mobWeight(p)`
  - 97 `mobOnDeck()`
  - 102 `mobState(H, W, hs)`
- **109** when the game is open, on the boat she follows, and she can do something
  - 110 `mobLive()`
  - 112 `mobCan()`
- **119** the minute (core/05-vessels.js risk): the event going on, or the dice
  - 120 `mobRisk(W, hs)`
  - 135 `mobNear(q, on, o)`
  - 141 `mobRec(r)`
- **143** the rescue: the rescue boat from the nearest station, or the helicopter when it is there sooner
  - 144 `mobRescue(p)`
- **158** the fall
  - 159 `mobStart(q, on, o)`
  - 177 `mobVhf(M)`
- **187** where she is, and what is seen (live: at fraction f of the minute)
  - 188 `mobAt(f)`
  - 191 `mobAlong()`
  - 194 `mobSightOf(p, buoyOnly)`
  - 202 `mobSeen(pos)`
- **205** the player's actions (ui/10s-mob.js): the MOB mark, the lifebuoy, Autonav: MOB, the lift
  - 206 `mobMark(pos)`
  - 212 `mobThrow(pos)`
  - 220 `mobTarget()`
  - 229 `mobRoute()`
  - 249 `mobLiftOpts(pos, kn)`
  - 260 `mobLift(how, pos, kn)`
  - 274 `mobLiftHolds()`
- **280** the minute of the event
  - 281 `mobStep()`
  - 303 `mobAway()`
- **311** the end: who got her up, the sick leave (V8 A), the report after § 475 and § 47, the badge
  - 312 `mobEnd(out, how)`
  - 342 `withVesselId(vid, fn)`
  - 348 `mobReport(M, tIn, out, how, days)`
  - 355 `mobCrewHour()`

## `src/js/core/15-energy.js` (185 linjer)

your own energy: a day at sea empties it, a night ashore fills it

- **1** your own energy: a day at sea empties it, a night ashore fills it
  - 14 `alarmAck()`
  - 39 `restRate(b)`
  - 45 `restStart()`
  - 59 `restEnd(quiet)`
  - 65 `restMinute()`
  - 80 `rorbuTip(p)`
  - 84 `restTip(b)`
- **94** Skippertak (Jonas 12.10.2026): an energy drink, for real money only (never for the game's kroner), in three sizes
  - 107 `fleetCrews()`
  - 108 `giveSkip(k)`
  - 122 `energyMinute()`
  - 146 `fallAsleep(v, doze)`
  - 160 `wakeUp()`
  - 166 `wakeEarly(back)`
  - 178 `sleepDrift(H)`

## `src/js/core/16-helm.js` (74 linjer)

MANUAL HELM (the user's wish 03.10.2026)

- **1** MANUAL HELM (the user's wish 03.10.2026)
  - 11 `helmOn()`
  - 13 `simRate()`
  - 14 `helmCan()`
  - 16 `helmTake()`
  - 26 `helmOff()`
  - 29 `helmStep(dt)`
  - 36 `helmPose(frac)`
  - 45 `moorAll(p, r)`
  - 57 `helmMoorable()`
  - 61 `helmMoor()`
  - 63 `helmCast()`
  - 69 `helmCastDone(pid, kind)`

## `src/js/core/16b-dyn.js` (596 linjer)

HOW THE BOAT MOVES: a manoeuvring model (Fysikk 1; Jonas 18.10.2026)

- **1** HOW THE BOAT MOVES: a manoeuvring model (Fysikk 1; Jonas 18.10.2026)
  - 27 `dynPar(V)`
  - 52 `dynInt(P, s, thr, rud, h, capF, E)`
  - 87 `dynMove(s, h)`
  - 94 `dynThrEq(P, u, capF)`
- **95** the calibration: measured on the model itself, once a vessel
  - 96 `dynTurn(P, V, u0 = V.vcruise * KN_MS)`
  - 107 `dynAccel(P)`
  - 113 `dynStops(P)`
  - 118 `dynCal(key, sx = 1)`
  - 137 `dynCalEng(base, sx, ck)`
  - 142 `dynCalOf(b = S.boat)`
  - 144 `dynCalRun(key, V, P, sx)`
  - 161 `dynStopDist(cal, v)`
  - 165 `dynVStop(cal, d)`
- **166** the wind and the sea on her this tick (Fysikk 2)
  - 179 `dynEnv(b, d, cal, H, dtG = 0)`
- **206** contact: the hull against the piers, the breakwaters and the harbour units' quays (Fysikk 2)
  - 215 `dynObsNear(X, Y, R)`
  - 222 `dynInside(O, x, z)`
  - 233 `dynContact(b, d, P, O)`
- **260** with no way on: she drifts (Fysikk 2)
  - 266 `dynDrift(type, p, H)`
  - 288 `gearBuoyNear(p)`
  - 290 `gearLieCrew()`
  - 292 `gearWatch(b)`
  - 300 `lieDrift(H)`
- **339** the state, in step with the boat the rest of the game reads
  - 340 `dynState(b)`
  - 351 `dynWrite(b, d)`
  - 356 `dynCan()`
  - 361 `dynLive()`
  - 366 `dynPose()`
  - 373 `dynRest()`
  - 374 `dynLivePose(frac)`
  - 376 `dynHaltNeed()`
- **377** the tick
  - 378 `dynTick(dt)`
  - 391 `dynMinute(H, W)`
- **398** by hand (16-helm.js): the throttle and the rudder into the model
  - 399 `dynHelm(d, dtG)`
- **420** the line she follows: out from the quay, the route's waypoints as the chart plotter draws them, to the harbour she ends in
  - 422 `dynLineBuild(pl, dep)`
  - 442 `dynLineAt(T, s)`
  - 448 `dynSeg(T, s)`
  - 449 `dynSegHd(T, i)`
  - 450 `dynLineProj(T, x, z, s0, back = 30)`
  - 460 `dynLineHd(T, s, r0)`
  - 467 `dynGroundAhead(T, s, look)`
- **476** the autopilot
  - 477 `dynAuto(d, dtG)`
  - 595 `dynTrackView()`

## `src/js/core/16c-hull.js` (146 linjer)

---- Fysikk 3: what the blows and the groundings do to the hull (Jonas 18.10.2026: «kollisjoner og grunnstøting skal få

- **1** Fysikk 3: what the blows and the groundings do to the hull (Jonas 18.10.2026: «kollisjoner og grunnstøting skal få
  - 21 `hullD(b = S.boat)`
  - 23 `hullOld(b = S.boat)`
  - 26 `hullSync(b = S.boat)`
  - 28 `hullLeak(b = S.boat)`
  - 35 `hullHit(kn, E, what, b = S.boat)`
  - 45 `hullSay(r)`
  - 52 `bedRock(p)`
  - 60 `hullGround(p, kn, b = S.boat)`
  - 69 `hullMinute()`
  - 86 `hullCost(b = S.boat, d = b.dmg || {})`
- **93** the hull insurance (kasko)
  - 98 `kaskoSign(b = S.boat)`
  - 104 `kaskoEnd(b = S.boat)`
  - 106 `kaskoHour()`
  - 112 `hullLeft(b = S.boat)`
  - 119 `hullBill(b = S.boat)`
  - 125 `hullOrder(auto, b = S.boat)`
  - 140 `hullMended(j, b = S.boat)`

## `src/js/ui/01-i18n.js` (120 linjer)

the logo (src/brand/logo.svg, the user's anchor of 03.11.2026), filled with currentColor: the sign-in's gate (ui/10f-cloud.js) and the

- **4** i18n
  - 117 `t(k, ...a)`

## `src/js/ui/02-format-state.js` (233 linjer)

---------- formatting ----------

- **1** formatting
  - 3 `dayKey(d)`
  - 4 `dayNum(k)`
  - 7 `holdFmt()`
  - 12 `fmt(n, d = 0)`
  - 13 `kr(n)`
  - 20 `cashFx(delta)`
  - 43 `realMin(gameMin)`
  - 44 `realDur(gameMin)`
  - 52 `inReal(gameMin)`
  - 54 `gameDur(gameMin)`
  - 57 `durBoth(gameMin)`
  - 59 `whenTxt(T)`
  - 60 `dur(h)`
  - 64 `hm(H)`
  - 65 `dayStr(H)`
  - 66 `clockStr(H)`
  - 67 `coordStr(p)`
  - 73 `dirName(deg)`
- **76** persistence
  - 88 `tabMark()`
  - 89 `tabMine()`
  - 95 `tabLose()`
  - 111 `saveJson(o)`
  - 129 `save()`
  - 132 `saveStoreKb()`
  - 135 `migrateV2(o)`
  - 147 `load()`
- **167** UI state
  - 178 `booting()`
  - 179 `loaderGone()`
  - 188 `toastPlace(el)`
  - 194 `toastClear()`
  - 195 `toast(msg, ms)`
  - 211 `saveCode()`
  - 219 `codeRead(code)`
  - 227 `loadCode(code)`

## `src/js/ui/03a-chart.js` (226 linjer)

THE CHART'S VECTORS (phase K7 of the coast plan): the coast by level of detail, the graticule and the place names

- **1** THE CHART'S VECTORS (phase K7 of the coast plan): the coast by level of detail, the graticule and the place names
  - 12 `vReader(b)`
  - 21 `vecPath(v, sc, tol, keep)`
  - 41 `chartPath0(px, out)`
  - 55 `chartRings0(v)`
  - 66 `chartPath0In(out, box)`
  - 111 `vecPathsIn(v, sc, r)`
  - 123 `chartPathsIn(pk, r)`
  - 124 `chartPath(pk, lv, px)`
  - 127 `chartCoast(ctx, x0, y0, kx, ky, W, H, dpr, fish)`
  - 162 `fmtDM(v, pos, neg)`
  - 166 `chartGrid(ctx, x0, y0, kx, ky, W, H, dpr, fish)`
- **187** the place names
  - 190 `chartNamesOf(pk, entry, sc, ox, oy)`
  - 203 `chartNamesSvg(vx0, vy0, vx1, vy1, u, taken, part)`

## `src/js/ui/03-map.js` (848 linjer)

---------- map ----------

- **1** map
  - 2 `followChart()`
  - 11 `applyView()`
  - 24 `toMap(cx, cy)`
  - 26 `txt(p, s, cls, size, extra = '')`
  - 32 `plotCol(d)`
  - 33 `cssRGB(name)`
- **34** chart painted at screen resolution for the current view (crisp at any zoom, like a real chart plotter)
  - 44 `chartView(scale)`
  - 50 `paintChart(scale)`
  - 65 `chartPan()`
  - 71 `chartWhole(V)`
  - 77 `chartCompose(V, tiles, budget)`
  - 111 `chartWork()`
  - 122 `chartFlush()`
  - 128 `chartTile(V, i, j, q)`
  - 144 `chartWant(V)`
  - 152 `chartPump()`
  - 162 `chartLoadLine()`
  - 168 `chartWarm(wps)`
  - 175 `chartWarmNext()`
  - 179 `chartCame(pk)`
  - 194 `ruLayerCanvas(A)`
  - 203 `chartVectors(V, again)`
  - 262 `chartRaster(d, PW, PH, x0, y0, pkx, pky, V, st)`
  - 269 `chartRasterJob(d, PW, PH, x0, y0, pkx, pky, V, st, scr)`
  - 392 `scheduleChart()`
  - 395 `renderBase()`
  - 409 `updateMapButtons()`
  - 421 `tapName(mp, rr)`
  - 426 `renderStatic()`
  - 527 `portIcon(p, s, u)`
  - 548 `anchorPath(x, y, s, u)`
  - 556 `soundingsSvg(vx0, vy0, vx1, vy1, u, taken)`
  - 575 `scheduleStatic()`
  - 580 `aisTrack(id, H)`
  - 585 `aisInfo(n)`
  - 604 `sjvChartSvg(u, bp)`
  - 614 `renderAisCard()`
  - 615 `renderDyn()`
  - 701 `pinAdd(mp)`
  - 706 `pinOpen(id, fresh)`
  - 726 `pinKb()`
  - 757 `ptrUp(e)`
  - 787 `unzoom()`
  - 794 `portByLabel(pt)`
  - 799 `addWaypoint(pt)`

## `src/js/ui/03b-route.js` (281 linjer)

---------- the route editor: waypoint names, a timeline for the list, undo and redo, moving and inserting points ----------

- **1** the route editor: waypoint names, a timeline for the list, undo and redo, moving and inserting points
  - 6 `wpTag(w)`
  - 14 `draftTimeline()`
- **22** history: every change to the draft can be undone and redone, 100 steps per vessel; it is not saved
  - 25 `draftEdit(fn)`
  - 30 `draftUndo()`
  - 31 `draftRedo()`
  - 32 `draftForget(all)`
  - 35 `routeChanged()`
- **37** the floating undo and redo buttons over the zoom buttons on the chart
  - 39 `renderRouteTools()`
  - 57 `routePlayMode()`
  - 65 `routePause()`
  - 71 `routePlay()`
  - 76 `routeUndoRedo(redo)`
- **78** moving a point with a finger, and inserting one on a leg with its «+» handle
  - 83 `legEnds(i)`
  - 85 `insHandles()`
  - 90 `routeGrab(mp)`
  - 101 `routeDragMove(g, mp)`
  - 106 `routeDragCancel(g)`
  - 107 `routeDragEnd(g)`
  - 119 `routeFocus(i)`
  - 125 `mapToClient(p)`
- **127** «Autonav» (the button in the chart plotter, and the dock's Auto-nav): the next tap on the chart is where to go, and the route
  - 130 `leiaArm(on)`
  - 136 `leiaTo(pt, buoy, act)`
  - 205 `deepNear(p, maxKm)`
  - 215 `leiaStops()`
  - 220 `leiaCompare()`
- **237** the sea along the route (Ø8, 06.11.2026): the wave height on each leg at the minute the boat is there, as the local forecast gives it
  - 245 `draftSea(tl)`
  - 258 `routeSeaWatch()`
  - 263 `routeSeaDraw()`

## `src/js/ui/03g-planmap.js` (120 linjer)

Driftsplan 2, part 6: the chart plotter in plan mode (docs/planer/driftsplan-2/02-design.md 4.2). «Velg i kartet …» on the

- **1** Driftsplan 2, part 6: the chart plotter in plan mode (docs/planer/driftsplan-2/02-design.md 4.2). «Velg i kartet …» on the
- **86** the chart: a tap adds a place or opens a pin's card; a pin dragged moves (03-map.js pointer handlers)

## `src/js/ui/03c-heat.js` (133 linjer)

---------- the heat map on the chart plotter (cells: core/12-heat.js) ----------

- **1** the heat map on the chart plotter (cells: core/12-heat.js)
  - 29 `heatIndex(v, steps)`
  - 39 `heatImage()`
  - 59 `heatPaint(force)`
  - 83 `heatDrawInto(g, p, ox, oy, k, plain)`
- **88** the box with the instrument, its range, the species and the scale
  - 93 `heatReadout()`
  - 104 `heatBar(steps)`
  - 113 `heatBox(on)`

## `src/js/ui/03d-setmode.js` (92 linjer)

---------- «Sett ut»: draw the gear on the chart as a line out from the boat, as long as the gear is, and confirm ----------

- **1** «Sett ut»: draw the gear on the chart as a line out from the boat, as long as the gear is, and confirm
  - 9 `setEnd()`
  - 10 `setLabelNow()`
  - 19 `setWhy()`
  - 30 `setWarn()`
  - 36 `setModeStart(c)`
  - 47 `setModeFrame()`
  - 54 `setSvg(u)`
  - 65 `setAim(mp)`
  - 66 `setCount(d)`
  - 67 `renderSetBar()`
  - 81 `setModeEnd(go, stay)`

## `src/js/ui/03e-miniplot.js` (152 linjer)

---------- the little chart in 3D (the user's wish 02.10.2026) ----------

- **1** the little chart in 3D (the user's wish 02.10.2026)
  - 11 `miniRadius()`
  - 18 `miniBg(c, R, k, W, H, dpr)`
  - 64 `miniStep(until)`
  - 71 `miniFrame(t)`
  - 77 `miniSoundings(g, x0, y0, k, BW, BH, dpr, night)`
  - 91 `miniPaint()`
  - 134 `miniSjv(ctx, X, Y, p, dpr)`

## `src/js/ui/03f-search.js` (118 linjer)

Search in the chart plotter (Jonas 09.10.2026: «Kan du bygge inn en søke-knapp i kartplotteren slik at man kan søke opp plasser?

- **1** Search in the chart plotter (Jonas 09.10.2026: «Kan du bygge inn en søke-knapp i kartplotteren slik at man kan søke opp plasser?
  - 9 `srchKind(p)`
  - 16 `srchItems()`
  - 31 `srchPos(s)`
  - 39 `srchFind(q)`
  - 50 `srchEsc(s)`
  - 53 `srchFetch()`
  - 59 `srchRender()`
  - 68 `srchOpen(on)`
  - 85 `srchGo(it)`
  - 89 `srchCard()`
  - 113 `srchSvg(u)`

## `src/js/ui/04-panels-instruments.js` (338 linjer)

---------- estimates ----------

- **1** estimates
  - 2 `estimate()`
- **11** panels
  - 13 `renderTabs()`
  - 16 `setTab(k)`
  - 19 `statusText()`
  - 35 `nextEvent()`
  - 53 `setHtml(el, h)`
  - 72 `hudFigures()`
  - 95 `hudShortEv(txt)`
  - 96 `hudLine3(how)`
  - 130 `hullWarn(b)`
  - 139 `hudGoYard()`
  - 148 `renderHud()`
  - 215 `liveFrac()`
  - 216 `livePose(frac)`
  - 239 `vnoise2(x, y, s)`
  - 245 `microBottom(p, d)`
- **247** instruments: GPS and echo sounder
  - 322 `hudCardOpen(on)`
  - 329 `hudClasses(stripOn, cardOn)`
  - 333 `hudFold(which)`

## `src/js/ui/05-tattoo-art.js` (169 linjer)

---------- sailors' tattoos: the flash and the seated sailor they go on ----------

- **1** sailors' tattoos: the flash and the seated sailor they go on

## `src/js/ui/05a-itemcard.js` (156 linjer)

The item card (M1 in docs/planer/butikker-og-sponsorer.md, 30.10.2026)

- **1** The item card (M1 in docs/planer/butikker-og-sponsorer.md, 30.10.2026)
- **7** the pictures: 64 × 40, a light sea line under the things that float or stand on deck
- **76** what each thing does, in numbers from the code ([no, en]); the long story is in the Håndboka (ITEM_HB)
  - 116 `icTierLine(k, lv)`
  - 144 `itemCard(o)`

## `src/js/ui/phone/00-shell.js` (69 linjer)

---------- the phone ----------

- **1** the phone
  - 68 `setBadge()`

## `src/js/ui/phone/01-haill-fiske-service.js` (112 linjer)

--- workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port

- **1** workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port
  - 2 `haill()`
- **23** the tackle shop on the quay: a purchase takes two taps, the second one confirms the price
  - 30 `fiske()`
  - 43 `service()`
  - 64 `iceCard()`
  - 72 `verksted()`

## `src/js/ui/phone/02-havn-last-agn-ordre.js` (52 linjer)

the old tabs live on as phone apps

  - 2 `havn()`
  - 3 `last()`
- **4** the pages of the dock's drawer (ui/10c-dock.js): the market, the village and the yard in port, the inventory everywhere
  - 5 `lever()`
  - 6 `isApp()`
  - 8 `agn()`
  - 35 `oppdrag()`
  - 36 `ordl()`
  - 41 `ordlBest(tabs)`

## `src/js/ui/phone/03-regler.js` (63 linjer)

the Regler app (R3 of the rules plan, 05.10.2026): «Her og nå» answers «can I fish here?» for your boat, gear and target where she is,

  - 8 `ruList(r)`
  - 11 `ruWhere(p)`
  - 19 `ruGrid(p, len, H, hand)`
  - 23 `ruChk()`
  - 25 `ruHere()`
  - 31 `ruCheck()`
  - 46 `ruLearn()`
  - 57 `regler()`

## `src/js/ui/phone/04-kvote.js` (71 linjer)

the Kvote app: your quotas, the open group's season, the stocks, and the market for rights (core/03d-quota.js)

  - 2 `kvote()`
  - 8 `kvOpen(H)`
  - 25 `kvStock(H)`
  - 43 `kvMkt(H)`

## `src/js/ui/phone/05-rigg-innst-admin.js` (91 linjer)

the rig: one kind of fishing at a time, changed here aboard (under Beholdning) when none of the boat's gear is in the sea

  - 2 `rigg()`
  - 14 `beholdning()`
  - 26 `crewTab()`
  - 33 `logg()`
  - 34 `innst()`
  - 72 `admin()`

## `src/js/ui/phone/06-render.js` (67 linjer)

  - 1 `show(on, a)`
  - 2 `status()`
  - 8 `tickHome()`
  - 14 `render()`
  - 18 `shell(a)`
  - 20 `page(a)`
  - 21 `dact(cur, a, d)`
- **27** Trim: more speed for the boat you are aboard for a while (core BOOSTS; Jonas 05.10.2026: sold for real money, the time in game
  - 32 `trim()`
- **48** Skippertak (core/15-energy.js SKIP): an energy drink for real money only, for you and the crews of the whole fleet
  - 52 `skipApp()`

## `src/js/ui/phone/07-patch.js` (1340 linjer)

--- the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened

- **1** the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened
  - 1333 `patch()`

## `src/js/ui/phone/08-home-papers-merker.js` (124 linjer)

the home screen (UI 2, U2-6; Jonas 06.11.2026, V6 A and V2 A in docs/planer/ui-2-staaende.md): the clock, the weather and the cash,

  - 5 `home()`
  - 24 `nowCards(na)`
  - 44 `nearHint(kind)`
- **48** the seaman's life: the tattoos you have earned, and the old ways at sea you have heard of
  - 49 `tattoos()`
  - 67 `papBladB()`
  - 72 `papPermit()`
  - 78 `papZlic()`
  - 83 `papKv()`
  - 89 `papBiz()`
  - 95 `fsChip()`
  - 97 `fsCard()`
  - 104 `merker()`
  - 116 `lore()`

## `src/js/ui/phone/09-vaer-post-salg-redning.js` (152 linjer)

--- weather

- **1** weather
  - 2 `sunTimesOld(H)`
  - 3 `vaer()`
- **26** newspaper
  - 28 `post()`
- **34** sales organisation
  - 38 `salg(s)`
- **133** rescue
  - 134 `redning()`
- **151** vessels: my vessel overview and the market

## `src/js/ui/phone/10-fartoy.js` (326 linjer)

  - 14 `goals()`
  - 39 `goalsCard()`
- **44** «Båten og utstyret» (OPP4 of docs/planer/oppgraderinger.md, 07.11.2026; Jonas: «én side for båten og utstyret»: «enig»): every
  - 58 `haulNow(kind)`
  - 62 `haulNow0(kind)`
  - 73 `tierLad(k, pg, fxOf)`
  - 79 `oneLad(k, base, pg, fx, nm)`
  - 132 `ladders()`
  - 148 `kitCard()`
  - 149 `kitCard0()`
- **178** the boat market: tabs for the open group, boats with a closed-group right, the coastal fleet over 11 m and the ocean fleet;
  - 187 `mkCard(k, O)`
  - 191 `market()`
  - 218 `specSecs(k, O)`
  - 242 `sheet(k, O)`
  - 290 `fartoy(tab0)`
- **325** the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)

## `src/js/ui/phone/11-rederi.js` (85 linjer)

  - 6 `selRow()`
  - 8 `vSummary()`
  - 45 `rederi()`
- **84** equipment

## `src/js/ui/phone/12-utstyr-redskap.js` (238 linjer)

the yard's upgrades (hold, engine, the antifouling coat and the outboard) or the shop's (electronics, haulers, the jigging machine and the clothes)

  - 2 `utstyr(mode)`
- **63** gear: in the sea, aboard (baiting and mending), and the shop
- **64** gear care (core/10b-gearcare.js): the condition of the gear aboard, and what the crew can do about it in port
- **69** a line kind as it stands (Jonas 20.10.2026, tilbakemelding #74: «hva båten har slags fiskeredskaper ombord og hva disse eventuelt er
  - 73 `lineCard(lk, o)`
  - 98 `egnChooser(lk, o)`
  - 124 `autoCard()`
  - 136 `careAboard(inPort, p)`
  - 163 `redskap(tab0)`

## `src/js/ui/phone/13-mannskap-bank-meld.js` (182 linjer)

--- crew

- **1** crew
  - 4 `candidates()`
- **5** the crew, person by person
  - 9 `traitChips(c, all)`
  - 11 `lifeHtml(c)`
  - 16 `personCard(c, cand)`
  - 23 `bors()`
  - 38 `mannskap()`
- **64** bank (Økonomi 2, Ø1): two tabs, the accounts with the statement, and the year's accounts (core/03-simulation.js book, ACCT)
  - 71 `ledger()`
  - 82 `accounts()`
  - 105 `bank()`
- **155** messages
  - 156 `meld()`
- **163** actions
  - 170 `switchVessel(k)`

## `src/js/ui/phone/13b-nettet.js` (148 linjer)

Nettet and the tackle shop on the quay (M2 in docs/planer/butikker-og-sponsorer.md, Jonas 30.10.2026)

- **1** Nettet and the tackle shop on the quay (M2 in docs/planer/butikker-og-sponsorer.md, Jonas 30.10.2026)
- **6** the keeper: a name per shop (Finnsnes keeps Solveig, who met you on the first trip), a line by what is going on, in the dialect
  - 9 `shopMem(pt)`
  - 11 `shopBought(no, en)`
  - 12 `keeperLine(pt)`
- **26** what the boat needs now, from her own state: each a chip that takes you to its card
  - 27 `buyList()`
  - 42 `shopTop(cur)`
- **54** fetching a reservation: the same purchase as over the counter; null when it went, else why not (a string)
  - 58 `equipTry(k)`
  - 60 `equipBuy(k)`
  - 84 `clothBuy(k)`
  - 91 `pickTake(o)`
- **103** the Net: the bookmarks, and the web shop
  - 105 `nett()`
  - 117 `netShop()`

## `src/js/ui/phone/13c-megler.js` (181 linjer)

Kystmegleren: boats players sell to each other (B1–B8 in docs/planer/etter-tonys-test.md, Jonas 07.11.2026; EAFC's auction house)

- **1** Kystmegleren: boats players sell to each other (B1–B8 in docs/planer/etter-tonys-test.md, Jonas 07.11.2026; EAFC's auction house)
  - 19 `mbLeftTxt(ms)`
  - 27 `mgNear(Q)`
  - 29 `mgCard(Q)`
  - 48 `mgOwnRow(v, quick)`
  - 66 `mbForm(v)`
  - 81 `megler()`
  - 104 `mgWishCard()`
  - 113 `mgSheet(Q)`
  - 147 `mgHere()`
  - 155 `mgAfter(key, okNo, okEn)`
  - 157 `mgAct(a, d)`

## `src/js/ui/phone/14-act.js` (320 linjer)

  - 2 `act(a, d)`
- **8** the receipt after a buy for kroner (Jonas 06.11.2026, Tony's test: «Det skal ikke være tvil om et kjøp er gjennomført»): one
  - 13 `ownedTxt(w, s)`
  - 28 `receipt(nm, w, s)`
  - 38 `act0(a, d)`

## `src/js/ui/05b-work.js` (159 linjer)

the Mannskap page in the drawer (once «Arbeid»): the samhold on top, «På dekk nå» as chips of who stands where, and one card per

- **1** the Mannskap page in the drawer (once «Arbeid»): the samhold on top, «På dekk nå» as chips of who stands where, and one card per
- **33** «På dekk nå» (Jonas 23.10.2026: brikker): who stands where, nothing to tap, and in one line what waits on deck
  - 115 `lagCardHtml()`
  - 129 `energyUi()`

## `src/js/ui/05c-drift.js` (266 linjer)

the Drift app: the operations plan of a vessel (core/06d-drift.js) on one screen (23.10.2026, Jonas: «så intuitivt som mulig»).

- **1** the Drift app: the operations plan of a vessel (core/06d-drift.js) on one screen (23.10.2026, Jonas: «så intuitivt som mulig»).
- **23** Hjem: where she lies and the crew sleep
- **43** Fiske: the rig, and the jig beside it
- **56** Plasser: the fields and the jig places, with the player's own numbers there (never what the sea holds)
- **91** Vær
- **94** Rytme
- **104** Mannskap: you are the skipper aboard; without you a skipper and a mate
- **119** the top: Start or Pause, and now
- **134** I dag: the trip as a timeline, with where she is now
- **140** the last seven days, landed per day
- **169** a place picked in the chart plotter (core DRIFTCTX.spot: 'F+' a new field, 'J+' a new jig place, 'F:id' / 'J:id' one moved)
- **221** actions (data-pa="dr-…"); true when something changed
  - 257 `driftSvg(u)`

## `src/js/ui/05d-plan2.js` (410 linjer)

Driftsplan 2, part 5: the page (docs/planer/driftsplan-2/02-design.md 4.1). The day first («I dag» with where she is now, or the

- **1** Driftsplan 2, part 5: the page (docs/planer/driftsplan-2/02-design.md 4.1). The day first («I dag» with where she is now, or the
- **26** Nå: the step she is on and when it ends, what she waits for and until when, or why she stopped
- **50** the day: today's as the engine follows it (with «← nå»), or the next as planDay reckons it from the answers
- **79** Hjem (GUI review U14 A, 05.11.2026): the naust first, then the rorbuer nearest the places, then the rest; no yard (it is no home);
- **113** Redskap
- **127** Plasser: the list in the order she works them
- **178** Levering
- **217** Vær
- **232** Rytme
- **246** Mannskap
- **269** the top: Start or Pause, Nå, and the button that fixes a stop
- **287** the statistics (R9): today, the last seven days, and all
- **304** the page
  - 404 `plan2Copy(vid)`

## `src/js/ui/05e-merker.js` (86 linjer)

---------- Merker: what the player sees of «Første uke på sjøen» and the long badges (core/09f-merker.js) ----------

- **1** Merker: what the player sees of «Første uke på sjøen» and the long badges (core/09f-merker.js)
  - 9 `achShow(fresh)`
  - 18 `achPump()`
  - 31 `achWhenFree(f)`
  - 32 `achCard(title, lead, items)`
  - 38 `achChapterCard(ch)`
- **47** the Merker app's pages (ui/05-phone.js merker)
  - 48 `achWeek()`
  - 69 `achLong()`
  - 80 `achChip()`

## `src/js/ui/05f-turer.js` (183 linjer)

---------- Turoppdrag in the Oppdrag app (core/09g-turer.js): the board made from where the boat is, and the missions taken ----------

- **1** Turoppdrag in the Oppdrag app (core/09g-turer.js): the board made from where the boat is, and the missions taken
  - 7 `turCard(m, act, det)`
  - 52 `turAskCards()`
  - 67 `turPage()`
  - 86 `turGo(id)`
  - 109 `turSvg(u, inV)`
- **123** the measuring board (Havforskningsinstituttet's sample, core turProveFish): each fish lies with its snout against the board's
  - 128 `turMeasure(id)`
- **164** the lighthouse picture: the shutter shows within 3 km of the lighthouse while the 3D view is up; without it the card's button
  - 168 `turFotoKeep(id, img)`
  - 169 `turFotoSrc(id)`
  - 170 `turFotoUi()`
  - 174 `turFotoShoot(id)`

## `src/js/ui/05g-press.js` (78 linjer)

---------- Kystposten on the phone (core/09h-press.js): the front page and the local tab, a story to read on, the unread count on

- **1** Kystposten on the phone (core/09h-press.js): the front page and the local tab, a story to read on, the unread count on
  - 8 `pressImg(s, small)`
  - 15 `pressPage(local)`
  - 28 `pressArticle(s)`
  - 34 `pressFind(key)`
  - 36 `pressNotify(s)`
  - 43 `pressFlush()`
  - 54 `pressFetch(force)`
  - 69 `pressSkreiFetch()`
  - 77 `pressStart()`

## `src/js/ui/05h-kystkart.js` (91 linjer)

---------- Kystkartet: the collection on one chart (core/09m-kystkart.js; docs/planer/oppdrag-2.md K2) ----------

- **1** Kystkartet: the collection on one chart (core/09m-kystkart.js; docs/planer/oppdrag-2.md K2)
  - 10 `kkGeo()`
  - 24 `kkChartSvg()`
  - 37 `kkRows(c)`
  - 45 `kkTab()`
- **60** the same marks over the chart plotter (03-map.js renderStatic)
  - 61 `kkSvg(u, inV)`
  - 75 `kkBar()`
  - 84 `kkChart(on)`

## `src/js/ui/05i-ukas.js` (122 linjer)

---------- Ukas fangst: the Sunday card (core/09n-ukas.js; docs/planer/oppdrag-2.md U1) ----------

- **1** Ukas fangst: the Sunday card (core/09n-ukas.js; docs/planer/oppdrag-2.md U1)
  - 13 `ukeLag(w)`
  - 21 `ukeEvents(w)`
  - 29 `ukeLines(w)`
  - 51 `ukeDates(w)`
  - 53 `ukeHtml(w)`
  - 60 `ukeShow(w)`
  - 64 `ukeBind(w)`
  - 65 `ukeRedraw()`
  - 70 `ukeTick()`
  - 79 `ukeSesongCard(H)`
- **85** the picture: the card drawn on a canvas, 1080 x 1350, shared as a file or saved
  - 86 `ukeCanvas(w)`
  - 108 `ukeLogo()`
  - 112 `ukeShare(w)`

## `src/js/ui/05j-catchfeed.js` (56 linjer)

---------- «Kystlys» U4: the catch as it comes over the rail (docs/planer/ui-redesign.md, 04.11.2026) ----------

- **1** «Kystlys» U4: the catch as it comes over the rail (docs/planer/ui-redesign.md, 04.11.2026)
  - 54 `catchFeed(sp, kg)`
  - 55 `catchRec(sp, kg)`

## `src/js/ui/05k-ordbok.js` (74 linjer)

---------- Ordboka: the trade's words explained where they stand (UI-redesign U10, grep 6) ----------

- **1** Ordboka: the trade's words explained where they stand (UI-redesign U10, grep 6)
  - 30 `ordbok(root)`
  - 46 `ordTip(el, head, text)`

## `src/js/ui/06-logbook.js` (115 linjer)

---------- deck log ----------

- **1** deck log
  - 7 `longDate(day)`

## `src/js/ui/06b-book-tabs.js` (173 linjer)

---------- the deck log's other tabs: seasons, events, gear and sales ----------

- **1** the deck log's other tabs: seasons, events, gear and sales
  - 11 `bkPages(items, per, head, empty)`
- **20** seasons: this year's rules and the months each species fetches more or less than usual
  - 21 `bookSeasons()`
- **44** events: what moved the prices these last four weeks, and the rules that changed
  - 45 `bookEvents()`
- **71** gear: every set that has stood in the sea, with the hours as tally marks
  - 80 `bookGear()`
- **96** sales: the landing notes, one to a page
  - 107 `bookSales()`
  - 149 `gearLogEntry(s)`
  - 155 `bkSplit(items, now, per, head, headNow, emptyOver, emptyNow)`
  - 161 `bookTabPages(t, spread)`

## `src/js/ui/06c-notebook.js` (44 linjer)

Father's naust: setting it to rights and the trophy wall (core/07c-naust.js, core/09b-records.js)

- **1** Father's naust: setting it to rights and the trophy wall (core/07c-naust.js, core/09b-records.js)

## `src/js/ui/06d-season-folk.js` (78 linjer)

the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js)

- **1** the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js)

## `src/js/ui/06e-feedback.js` (258 linjer)

Tilbakemelding: the players' feedback on the phone (05.10.2026)

- **1** Tilbakemelding: the players' feedback on the phone (05.10.2026)

## `src/js/ui/06f-fishguide.js` (170 linjer)

the phone's Fiskeguide app (08.10.2026; Jonas: «en intuitiv app til telefonen der spillere kan gå inn å lese kjapt om hvor de burde

- **1** the phone's Fiskeguide app (08.10.2026; Jonas: «en intuitiv app til telefonen der spillere kan gå inn å lese kjapt om hvor de burde
- **74** the gear (20.10.2026: read from the model, as it fishes): how much each takes of the species against the plain jig (1). The jig
- **100** the month view
- **116** the year view
- **124** the species card

## `src/js/ui/07-guide.js` (440 linjer)

  - 1 `renderClock()`
  - 10 `mottakShut()`
  - 11 `chartMode()`
  - 13 `chartNight()`
  - 15 `echoSettings()`
  - 24 `chartSettings()`
  - 37 `panelRoute()`
  - 125 `echoSvg()`
  - 144 `panelFish()`
  - 167 `valueEst(sp, g)`
  - 168 `panelHold()`
  - 188 `fcChart()`
  - 203 `panelWx()`
  - 235 `landText(short)`
  - 248 `deckText(short)`
  - 268 `quayText(short)`
  - 274 `panelPort()`
  - 308 `portSlip()`
  - 382 `landWarn(p)`
  - 396 `landQText(short)`
  - 404 `landQOthers()`
  - 413 `landPage()`
  - 429 `panelLog()`
  - 434 `renderPanel()`
  - 438 `panelBusy()`

## `src/js/ui/07b-first-trip.js` (321 linjer)

---------- «Første tur»: the guided first trip every new player goes through ----------

- **1** «Første tur»: the guided first trip every new player goes through
  - 16 `tutEv(k, settle)`
  - 21 `tutLoadEv(room)`
  - 24 `tutFishEv()`
  - 26 `tutMark(k)`
  - 27 `tutSettle(k)`
  - 33 `tutFieldWp(list)`
  - 42 `dockApp(menu, item, page, inner)`
  - 47 `phoneApp(app, inner)`
  - 59 `tutNaustTry()`
  - 66 `tutIntroGo()`
  - 145 `tutAdrift()`
  - 153 `tutDriftTip(d)`
  - 167 `tutStartWhy()`
  - 180 `tutTip(st)`
  - 203 `tutReveal(el)`
  - 209 `tutRect(T0)`
  - 215 `tutStep()`
  - 227 `tutNormKg()`
  - 233 `tutNormLog()`
  - 238 `tutFinish()`
  - 239 `tutScrollSlip()`
  - 242 `tutAllow(what)`
  - 260 `tutView(st)`
  - 267 `tutUpdate()`
  - 290 `tipPlace(txt, T0, o)`
  - 315 `tipToast()`

## `src/js/ui/07c-handbook.js` (270 linjer)

Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)

- **1** Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)
  - 10 `hbState()`
  - 200 `hbPick()`
  - 208 `hbEv(id, how)`
  - 209 `hbDone(id)`
  - 210 `hbSkip(ch, id)`
  - 212 `hbReady()`
- **214** what the phone shows (Onboarding 2, O5, V7 A, 27.10.2026)
  - 220 `appShown(id)`
  - 227 `appUnlock(id)`
  - 229 `appSeen(id)`
  - 230 `hbUpdate()`

## `src/js/ui/10g-wardrobe.js` (133 linjer)

Garderoben: the player changes how his figure looks (Jonas 10.10.2026)

- **1** Garderoben: the player changes how his figure looks (Jonas 10.10.2026)
- **14** the right-hand side: what the current tab offers
- **50** the little renderer

## `src/js/ui/08-actions.js` (455 linjer)

actions

  - 6 `doAct(el)`
  - 78 `panelInput(e)`
  - 84 `panelChange(e)`
  - 107 `landConf(H, q, acc)`
  - 145 `sell()`
- **271** modal
  - 273 `modal(html)`
  - 282 `boatUnnamed()`
  - 283 `boatChristen(nm)`
  - 285 `showIntro(namesOnly)`
- **303** «Mens du var borte» (Jonas 07.10.2026: «en følelse av instant-belønning»)
  - 308 `awayStart(mins, realMs)`
  - 309 `awayEnd()`
  - 310 `showAway(A)`
- **337** time
  - 343 `playMinutes(n, away)`
  - 347 `catchUp(realMs)`
  - 358 `tick()`
  - 395 `deliverOrder()`
- **405** chrome
  - 406 `applyLang()`
- **419** screens: full-screen 3D, or the chart plotter for route planning
  - 420 `setBodyView(v3d)`
  - 425 `openPlotter()`
  - 430 `plotSetRender()`
  - 434 `plotSetOpen(on)`
  - 447 `kinoUi()`

## `src/js/ui/08b-letter.js` (127 linjer)

---------- the opening: the letter from Father ----------

- **1** the opening: the letter from Father
  - 28 `letterPic(k)`
  - 32 `letterSound(kind)`
  - 44 `showLetter(done)`

## `src/js/ui/08c-start.js` (174 linjer)

«Hvor står fars naust?»: where a new game starts (05.10.2026)

- **1** «Hvor står fars naust?»: where a new game starts (05.10.2026)
  - 23 `startInfo(pt)`
  - 45 `startSeaMax(q, H0)`
  - 47 `startRing(pt)`
  - 48 `startWx(pt, H0)`
  - 56 `showStart(done)`
  - 118 `tutMixAt(q, H, len, land)`
  - 129 `tutFieldNear(pt, land, skip)`
  - 152 `chooseStart(pt, onProgress)`

## `src/js/ui/09-hand-fishing.js` (59 linjer)

---------- fishing by hand: jig, strike on the bite, reel without snapping the line ----------

- **1** fishing by hand: jig, strike on the bite, reel without snapping the line

## `src/js/ui/09b-pub.js` (366 linjer)

---------- the pub in 3D: a stool at the bar, seen in first person (Jonas 08.10.2026) ----------

- **1** the pub in 3D: a stool at the bar, seen in first person (Jonas 08.10.2026)
- **15** the model: the GLB as it is (positions as 16-bit, colours as bytes), straight into the GPU
- **89** matrices (column-major)
- **101** a frame
- **145** what can be tapped
- **171** the panels
- **221** the bartender: the evening's talk in the place's dialect, and a round for the crew
- **246** the old hand at the bar with the echo sounder's news (tilbakemelding #58; Jonas 09.10.2026: «i puben 1 gang per spilldøgn»)
- **294** the notice board: Kystposten, the week's best, the trips
- **305** the round table: the hands looking for a berth (the crew exchange)
- **312** the top bar
- **325** open and close

## `src/js/ui/09c-naust3d.js` (303 linjer)

---------- Father's naust in 3D: the trophy wall with the biggest fish of each species (Jonas 09.10.2026) ----------

- **1** Father's naust in 3D: the trophy wall with the biggest fish of each species (Jonas 09.10.2026)
- **18** the model, as the pub reads it
- **91** matrices (column-major)
- **104** a frame
- **162** what can be tapped
- **198** the panels
- **250** the top bar, open and close

## `src/js/ui/09c-pubsoc.js` (243 linjer)

---------- the pub's social side (ui/09b-pub.js; supabase/migrations/20261009120000_pub.sql) ----------

- **1** the pub's social side (ui/09b-pub.js; supabase/migrations/20261009120000_pub.sql)
- **11** who is here tonight: the players' boats lying in this harbour
- **57** the harbour's fiskarlag
- **73** the club's notice board: fixed lines, never free text (F2, 20261030160000_lag_board.sql)
- **155** the week's quiz: five questions from the bank, the same for everyone in a game week

## `src/js/ui/10-rod-acts.js` (105 linjer)

---------- the jig game: jigging by hand yourself, and the buttons and hooks around it ----------

- **1** the jig game: jigging by hand yourself, and the buttons and hooks around it
  - 103 `refreshAll()`

## `src/js/ui/10-gear-ui.js` (240 linjer)

passive gear on screen: the action bar, the fish panel, the chart and the route

- **1** passive gear on screen: the action bar, the fish panel, the chart and the route
  - 8 `setState(s)`
- **15** the bait as the player sees it (Jonas 20.10.2026, after tilbakemelding #74: «det må gjøres mer intuitivt hva båten har slags
  - 27 `tubState(lk)`
  - 36 `tubsHtml(lk)`
  - 44 `tubWords(st)`
  - 49 `tubLegend(lk)`
  - 56 `setBaitTxt(s)`
  - 62 `setWhat(s)`
  - 69 `setLabel(s, short)`
  - 76 `setChoices(all)`
  - 98 `gopText()`
  - 106 `gearActs(LS)`
  - 127 `jigSets()`
  - 137 `gearPanel()`
  - 158 `gearSvg(u)`
  - 184 `otherGearHit(p, r)`
  - 185 `otherGearCard(s)`
  - 193 `gearHit(p, r)`
  - 195 `buoyStandoff(s, e)`
  - 200 `gearTap(hit)`
  - 212 `wpActOptions(w)`
  - 218 `wpActLabel(a)`
  - 224 `wpActCycle(w)`
  - 229 `gearDoAct(act, el)`

## `src/js/ui/10c-dock.js` (578 linjer)

---------- the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side ----------

- **1** the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side
- **412** the drawer
- **484** the calm (UI 2, U2-4, 07.11.2026; docs/planer/ui-2-staaende.md 4.5, Jonas' V8 A 06.11.2026)
  - 551 `renderActs()`
  - 564 `showroomTick()`

## `src/js/ui/10d-helm.js` (51 linjer)

THE HELM ON THE SCREEN (core/16-helm.js; the user's wish 03.10.2026)

- **1** THE HELM ON THE SCREEN (core/16-helm.js; the user's wish 03.10.2026)

## `src/js/ui/10e-sound.js` (392 linjer)

SOUND (the user's wish 03.10.2026)

- **1** SOUND (the user's wish 03.10.2026)
- **85** inside Father's naust (Jonas 09.10.2026: «Kjør på med lyd i naustet»; ui/09c-naust3d.js)
- **144** the music (Jonas 05.10.2026: «rolig ambient instrumentaler som svak stemning i bakgrunnen. Må kunne skrus av i innstillinger»)
- **312** the whistle and the bell (Ø11.2; sjøveisreglene FOR-1975-12-01-5 rules 32-35 and vedlegg III, read 06.11.2026)

## `src/js/ui/10f-cloud.js` (964 linjer)

THE CLOUD (04.10.2026; docs/lansering.md E and F)

- **1** THE CLOUD (04.10.2026; docs/lansering.md E and F)
  - 10 `cloudOn()`
  - 18 `adminOk()`
  - 20 `pubHost()`
  - 24 `cloudS()`
  - 30 `cloudGpu()`
  - 37 `cloudDev()`
  - 44 `cloudMeta()`
- **58** talking to Supabase
  - 59 `cloudToken()`
- **60** guests (06.10.2026; Jonas: «nye brukere ikke trenger å logge inn til å starte med», the account after the third landing)
  - 66 `guestGet()`
  - 67 `guestAuth(path, body)`
  - 75 `guestToken()`
  - 83 `guestStart()`
  - 89 `cloudRpc(fn, args, opt)`
- **101** the gate: before the game starts
  - 102 `cloudGateShow(html)`
  - 110 `cloudGateHide()`
  - 114 `worldSync()`
  - 119 `cloudGate()`
- **189** after the start: hooks, measurements, the save
  - 190 `cloudStart()`
  - 215 `cloudAsk()`
  - 225 `cloudConsent(yes, by)`
  - 231 `cloudBegin()`
  - 241 `cloudEv(k, d)`
  - 242 `cloudFlush(end)`
- **251** the errors (04.10.2026; caught everywhere since 02.11.2026, js/errtrap.js)
  - 262 `srcMapStr(s)`
  - 275 `errNoise(msg)`
  - 280 `cloudErr(msg, src, stack, kind)`
  - 291 `errSend(e)`
  - 295 `errQueue()`
  - 296 `errKeep(list)`
  - 300 `errFlush()`
  - 324 `errStart()`
- **333** a page that stops or stands still while it is on the screen
  - 340 `aliveRead()`
  - 341 `aliveBeat(gone)`
  - 352 `aliveCheck()`
  - 376 `hangWatch()`
- **390** the save between devices (05.10.2026; supabase/migrations/20261005200000_save_sync.sql)
  - 397 `syncGet()`
  - 398 `syncSet(rev, at, rv, sq)`
  - 404 `deviceId()`
  - 408 `deviceName()`
  - 413 `cloudStatus(s)`
  - 414 `cloudStatusText()`
  - 423 `saveSum(o)`
  - 427 `sumText(m)`
  - 434 `cloudChoose(here, cloud, when, box)`
  - 449 `cloudKeptNote(where)`
  - 454 `cloudTake(cs)`
  - 460 `cloudSync(cs)`
  - 491 `cloudSaveSoon(closing, manual)`
  - 530 `cloudSoon(ms)`
- **531** one device at a time (13.10.2026, supabase/migrations/20261013120000_active.sql)
  - 541 `cloudFp()`
  - 542 `cloudClaim(wait)`
  - 555 `cloudBeat()`
  - 571 `cloudWake()`
  - 577 `cloudPassed(h)`
  - 592 `cloudHeldShow(h)`
  - 601 `cloudPlayHere()`
  - 611 `cloudCheckHead()`
  - 620 `cloudConflict(cl, moved)`
  - 650 `cloudHist()`
  - 655 `cloudRestore(id)`
- **666** what is measured: the game's own functions, wrapped once they are all defined
  - 667 `cloudHooks()`
- **690** the account card in Settings
  - 691 `cloudCard()`
  - 715 `histRows()`
  - 727 `cloudAccountDel()`
  - 738 `cloudMediaDel()`
  - 744 `cloudAct(a, d)`
- **778** registering, for a guest: in the game's own words, never a wall before the third landing
  - 787 `guestHave()`
  - 793 `guestAsk(why)`
  - 819 `nameWhy(v)`
  - 836 `namesKept()`
  - 837 `namesKeep(o)`
  - 839 `namesApply()`
  - 847 `nameTake(n, quiet)`
  - 857 `nameCheck()`
  - 872 `nameSuggest()`
  - 881 `nameAsk(why, reason)`
  - 906 `guestOpenAsk()`
  - 914 `nameNudge(force)`
  - 927 `guestNudge(step)`
  - 939 `guestLogin(src)`
  - 945 `guestRegister(signIn)`
  - 957 `guestGift()`

## `src/js/ui/10g-push.js` (218 linjer)

PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and

- **1** PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and
  - 30 `pushHas()`
  - 32 `pushKey()`
  - 39 `pushOn()`
  - 53 `pushOff()`
  - 63 `pushAuto()`
  - 66 `pushAsk()`
  - 78 `pushItems(now)`
  - 186 `pushPlan(away)`
  - 194 `pushStart()`
  - 202 `pushCardRow()`
  - 209 `pushCatToggle(k)`
  - 214 `pushToggle()`

## `src/js/ui/10h-world.js` (320 linjer)

---------- the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql) ----------

- **1** the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql)
  - 14 `worldSig()`
  - 15 `worldTick()`
  - 55 `gearSync(now)`
  - 73 `peerLogo(hid, ver)`
- **83** the shared world V2 (05.10.2026; core/03-simulation.js WSH): one sea, one quota and one market. Every ten minutes, and soon
  - 92 `worldShare()`
- **117** the leaderboards (05.10.2026; Salgslaget → Toppliste; supabase/migrations/20261006020000_toplist.sql): the players of the whole
  - 122 `worldTop(w, grp)`
  - 136 `bygdeTop(w)`
  - 149 `evTop(ev, y)`
  - 160 `evCloseTick()`
- **166** the real-time relay (Ø16, S2 in docs/planer/sanntid-posisjoner.md, 05.11.2026; Jonas «kjør på» 03.11.2026: «like smooth som når
  - 183 `rtUrl()`
  - 190 `rtWant()`
  - 191 `rtTick()`
  - 199 `rtRetry(ms)`
  - 200 `rtClose(code, ms)`
  - 201 `rtOpen()`
  - 218 `rtSend(now)`
  - 232 `rtClock(T, p)`
  - 233 `rtRecv(data)`
  - 254 `rtVel(B, i)`
  - 260 `rtPose(id)`
  - 273 `rtTurn(B)`
  - 307 `worldStart()`

## `src/js/ui/10i-shop.js` (140 linjer)

THE SHOP (05.10.2026; supabase/migrations/20261006040000_shop.sql, supabase/functions/shop-checkout and stripe-webhook)

- **1** THE SHOP (05.10.2026; supabase/migrations/20261006040000_shop.sql, supabase/functions/shop-checkout and stripe-webhook)
  - 17 `shopMode()`
  - 23 `realKr(nok)`
  - 25 `shopLabel(nok)`
  - 30 `shopWhat(k)`
  - 40 `payBuy(k, give)`
  - 48 `shopFine()`
  - 51 `shopGo(k)`
  - 68 `shopGive(g)`
  - 91 `shopThanks(rc)`
  - 104 `shopClaim()`
  - 127 `shopStart()`

## `src/js/ui/10j-paint.js` (215 linjer)

THE PAINT SHOP (Malerverkstedet; Jonas 06.10.2026, docs/engasjement.md): a button of its own under Verft. Your own boat lies

- **1** THE PAINT SHOP (Malerverkstedet; Jonas 06.10.2026, docs/engasjement.md): a button of its own under Verft. Your own boat lies
  - 180 `logoSet(L)`
  - 188 `logoCheck()`
  - 196 `giveCos(k)`
  - 210 `regSet(n)`

## `src/js/ui/10q-buymoment.js` (36 linjer)

The moment a boat is bought (M5 in docs/planer/butikker-og-sponsorer.md): the top and the end of the purchase

- **1** The moment a boat is bought (M5 in docs/planer/butikker-og-sponsorer.md): the top and the end of the purchase

## `src/js/ui/10r-sponsor.js` (54 linjer)

Sponsorer in the game (M6, core/09l-sponsor.js): the list from the cloud, the sponsored item card, the link out and the

- **1** Sponsorer in the game (M6, core/09l-sponsor.js): the list from the cloud, the sponsored item card, the link out and the

## `src/js/ui/10s-broker.js` (108 linjer)

Kystmegleren and the cloud (B1–B8 in docs/planer/etter-tonys-test.md, supabase/migrations/20261107140000_broker.sql)

- **1** Kystmegleren and the cloud (B1–B8 in docs/planer/etter-tonys-test.md, supabase/migrations/20261107140000_broker.sql)

## `src/js/ui/10s-mob.js` (136 linjer)

---------- man overboard on the screen (Ø11.6; the core is core/14b-sikkerhet.js) ----------

- **1** man overboard on the screen (Ø11.6; the core is core/14b-sikkerhet.js)
- **39** the actions
- **63** the panel
- **104** the core's word
- **115** the chart plotter (ui/03-map.js renderDyn): the mark, the line to it, the lifebuoy and the person

## `src/js/ui/10k-friends.js` (134 linjer)

---------- Venner: friends between players (Jonas 09.10.2026; supabase/migrations/20261009180000_friends.sql) ----------

- **1** Venner: friends between players (Jonas 09.10.2026; supabase/migrations/20261009180000_friends.sql)

## `src/js/ui/10l-share.js` (89 linjer)

---------- shared catch marks (Jonas 09.10.2026; supabase/migrations/20261009200000_shared_marks.sql) ----------

- **1** shared catch marks (Jonas 09.10.2026; supabase/migrations/20261009200000_shared_marks.sql)

## `src/js/ui/10m-guestbook.js` (98 linjer)

---------- the guestbooks and Kystfareren (Jonas 09.10.2026; supabase/migrations/20261009220000_guestbook.sql) ----------

- **1** the guestbooks and Kystfareren (Jonas 09.10.2026; supabase/migrations/20261009220000_guestbook.sql)
- **62** Kystfareren: the parts of the coast by where the place lies (natLL), south to north

## `src/js/ui/10n-hail.js` (83 linjer)

---------- tuting and the six phrases at sea (Jonas 09.10.2026; supabase/migrations/20261009240000_hails.sql) ----------

- **1** tuting and the six phrases at sea (Jonas 09.10.2026; supabase/migrations/20261009240000_hails.sql)

## `src/js/ui/10o-ptow.js` (170 linjer)

---------- towing between players (Jonas 09.10.2026; supabase/migrations/20261009260000_tows.sql) ----------

- **1** towing between players (Jonas 09.10.2026; supabase/migrations/20261009260000_tows.sql)
  - 12 `ptowTowing()`
  - 14 `ptowStep()`
- **29** the one who needs help
- **68** the helper
- **111** the polling
- **125** the chart: the asks near, and the card

## `src/js/ui/10p-install.js` (134 linjer)

put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)

- **1** put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)
- **70** a new build is out: «Oppdater nå» (Jonas 06.11.2026: «Varsel ved oppdatering for å kjøre refresh på appen»)
- **104** the browser card on the loading screen (Jonas 03.11.2026, after tilbakemelding #107-#109)

## `src/js/ui/11-boot.js` (375 linjer)

---------- boot ----------

- **1** boot
  - 13 `bootStep(next)`
  - 14 `bootAway()`
  - 15 `bootGate(on)`
  - 17 `bootInfo()`
  - 19 `bootDone()`
  - 58 `bootgWrite()`
  - 60 `bootgOk()`
  - 63 `bootgArm()`
  - 72 `bootgNote(s)`
  - 81 `bootgIn()`
  - 88 `bootgOut()`
  - 91 `bootgClear(over)`
  - 93 `bootgReport()`
  - 102 `bootgRescue()`
  - 104 `bootgSafe()`
  - 115 `bootgSay()`
  - 116 `bootMap()`
  - 141 `boot3dAsk()`
  - 146 `boot3dShown()`
  - 156 `boot3dSend()`
  - 157 `modelsReady()`
  - 158 `dataEls()`
  - 159 `dataEarly()`
  - 169 `dataGet(el, opt)`
  - 183 `bootData()`
  - 190 `bootDataLate()`
  - 205 `modelsLabel()`
  - 212 `bootMapLoad()`
  - 240 `bootGame()`
  - 357 `bootFail(e)`

## `src/js/vessel3d.js` (1650 linjer)

- **2** VESSEL MODELS
  - 7 `VB()`
- **60** palette (rgb and gloss)
- **69** the hull: lofted from stations (s = 0 at the transom or stern post, 1 at the stem)
  - 75 `hullShape(H)`
  - 120 `hullBuild(o, hs, lod)`
  - 153 `hullCap(hs)`
- **160** fittings
  - 162 `wallWin(o, gb, A0, B0, A1, B1, sill, top, nwin, wallC, frameC, mull)`
  - 174 `partHouse(o, gb, p, y0, hs)`
  - 196 `partMast(o, p, base)`
  - 205 `partExhaust(o, p, base)`
  - 207 `partRails(o, hs, p)`
  - 212 `partGallows(o, hs, p)`
  - 216 `partHauler(o, hs, p)`
  - 221 `partDavit(o, hs, p)`
  - 226 `partTubs(o, hs, p)`
  - 235 `partPots(o, hs, p)`
  - 238 `partRaft(o, p, base)`
  - 239 `partFenders(o, hs, p)`
  - 241 `partEngineBox(o, hs, p)`
  - 242 `partThwart(o, hs, p)`
  - 244 `partTiller(o, hs, p)`
  - 245 `partJukse(o, hs, p)`
  - 247 `partPort(o, hs, p)`
  - 249 `partDrum(o, hs, p)`
  - 252 `partShelter(o, hs, p)`
  - 257 `partBlock(o, gb, p, y0, hs)`
  - 262 `partFunnel(o, p, base)`
  - 263 `partGantry(o, hs, p)`
  - 266 `partRamp(o, hs, p)`
  - 267 `partDoors(o, hs, p)`
  - 268 `partCrane(o, hs, p)`
  - 269 `partBlockP(o, hs, p)`
  - 270 `partNetBin(o, hs, p)`
- **272** one spec per type: the hull and the fittings. The skiff is hand-built in view3d.js
- **361** detailed models from GLB files (tools/boats, built in Blender from the yards' drawings)
  - 375 `glbParse(b64)`
  - 414 `glbLoad(type)`
  - 421 `glbPart(type, name)`
  - 423 `glbPeek(G, name)`
  - 426 `glbPaint(part, liv)`
  - 434 `glbZones(type)`
  - 441 `glbModel(type, lod, liv, own)`
- **468** the life-saving gear's places that the models from 45 m do not have yet (Ø11.5, 06.11.2026; until Ø4 revises them and gives them
- **491** the ladder aft (FOR-2013-11-22-1404 § 63, read on Lovdata 06.11.2026: «På fartøyets aktre del skal det være montert fast leider med
  - 517 `mobCut(o, boxes)`
  - 526 `vesselSpec(type)`
  - 527 `buildVesselModel(type, lod, liv, own)`
  - 568 `vesselGeo(type, hs, sp, house, anch)`
  - 580 `vesselModel(type)`
  - 581 `geoOf(type)`
- **585** the paint shop (ui/10j-paint.js; Jonas 06.10.2026): the hull colours a player can paint their own boat in, in VC's scale. A boat's
  - 604 `modelLiv(L)`
  - 611 `hullLiv(b)`
  - 612 `livKey(liv)`
  - 614 `livGeo(liv)`
  - 619 `livStr(b)`
  - 631 `livPen(s)`
  - 633 `livMark(s)`
  - 634 `livParse(s)`
- **639** paint designs (Malerverkstedet): a stripe under the sheer (ripe), a second colour on the lower topsides (totone), a stripe at the
  - 643 `topsides(type)`
  - 661 `designLines(TS, liv)`
  - 670 `glbDesign(type, part, liv)`
  - 704 `designFits(type, k)`
  - 711 `kitLiv(liv)`
- **713** flags (Malerverkstedet, 07.10.2026): the ensign at the stern as a picture, so any nation and shape can fly. Each flag is drawn here
- **762** the company logo (Malerverkstedet, 07.10.2026): made here from a sign, initials and two colours, or the player's own picture
  - 773 `logoCanvas(cv, L, img)`
  - 789 `logoStrips(type)`
  - 810 `stripBare(type, st)`
  - 825 `logoStr(L)`
  - 826 `logoParse(s)`
  - 830 `flagCanvas(cv, code, shape, logo)`
  - 842 `flagOf(L)`
- **843** the boat's name on her hull (Jonas 07.10.2026: «Pass på at båtnavnet vises godt på skroget på alle båtene»): a strip on each side
  - 852 `hullTris(type)`
  - 869 `sideStrip(type, frac, hMax, aspect, drop, band)`
  - 909 `nameStrips(type)`
  - 945 `stripProud(type, st)`
  - 968 `stripPaint(type, st)`
  - 989 `markStrips(type)`
  - 997 `stripSearch(type, lh, first0, fr, PAINT, avoid)`
  - 1022 `callStrips(type)`
  - 1028 `callRGB(type, liv)`
  - 1031 `anchorLen(bw)`
  - 1034 `markRGB(type, liv)`
  - 1042 `hullRGB(type, liv)`
- **1052** where the name is painted (Jonas 04.11.2026: «Det som er mest vanlig er at navnet på båten skrives i blokkbokstaver på kanten av
  - 1063 `facingTris(P, dir, keep)`
  - 1078 `rayZ(T, x, y, dir, za, zb)`
  - 1089 `crossStrip(T, xa, xb, y0, y1, z0, zw, dir, off)`
  - 1100 `crossPaint(T, xa, xb, y0, y1, dir, za, zb)`
  - 1111 `halfWidth(T, y, z0, zw, dir, wmax)`
  - 1122 `houseFront(type, P, Gl, V)`
  - 1158 `transom(type, P, V)`
  - 1193 `namePlaces(type)`
  - 1211 `placeRGB(type, p, liv)`
  - 1219 `nameInkLight(rgb)`
  - 1223 `npcKit(L, B)`
  - 1226 `npcModel(type, lod, liv)`
  - 1228 `personVB(B, x, y, z, seated, hands, suit, kit)`
- **1240** people from tools/harbour/arbeider.py: one body in parts, posed at its joints and painted per kit
  - 1259 `vestKit(K)`
  - 1274 `wkPart(name, kit)`
  - 1284 `wkPut(B, o, ax, s, at)`
  - 1294 `wkLimb(B, o, A, E, r)`
  - 1301 `figureVB(B, x, y, z, seated, hands, kit)`
  - 1323 `vesselSVG(type, w, h)`
- **1361** the deck map: where people can walk on each type (the crew plan, docs/mannskap-plan.md)
  - 1368 `deckMap(type)`
  - 1513 `deckPass(M, k, q)`
  - 1518 `passLine(M, A, B)`
  - 1520 `linkPass(M, k, q)`
  - 1524 `deckComp(M)`
  - 1533 `deckPath(M, a, b)`
- **1564** the lanterns after Sjøveisreglene (FOR-1975-12-01-5, rules 22–30, read on Lovdata 17.10.2026; docs/batplan.md del 11)
  - 1577 `lanterns(G, V, st)`
  - 1611 `deckPoints(type)`

## `src/js/deckcrew.js` (504 linjer)

- **2** CREW3D: the people aboard as agents who walk the deck (docs/mannskap-plan.md, del 1; Jonas 17.10.2026: no teleporting)
  - 14 `crewSim(src)`
- **37** the kit on the deck, out of the walking map
- **88** where the work is on this deck: [x, z, heading, task] in the boat's frame (the heading as the view draws it: 0 forward, +pi/2 to starboard)
- **139** what the game says: everyone's station this minute, and the boat's state
- **207** a free person: something to do for a while, by the weather, the hour and their nature
- **213** no limb through a wall, the rail or anything else (Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger,
- **304** the work at its place, clear of everything: at the rail the hands go to the rail's own top (a step back when it is close), at the
- **319** a cell of one's own: the goals already given are taken, and a new one at least SEP from them (the nearest free cell within a metre)
- **331** the agents follow the people aboard
- **448** the body on its way, clear of everything: the shoulders and the chest and back as upright lines; one that would go through a wall
- **468** no way over the deck between two parts of it (fore and aft of the house on the big boats): through the house, out of sight for
  - 498 `npcCrewCtx(n, G)`

## `src/js/view3d/00-head.js` (159 linjer)

- **2** 3D VIEW (plain WebGL, no dependencies)
  - 45 `qualSet()`
  - 64 `qmDown(why)`
  - 72 `qmAlive(on)`
  - 77 `qmCrashCheck()`
  - 85 `qmFrame(rdt, now)`
  - 91 `qualTick(dt, fps, now)`
- **131** math
  - 132 `persp(fovy, asp, n, f)`
  - 133 `viewDir(f, up)`
  - 140 `mul(a, b)`
  - 141 `model(px, py, pz, yaw, pitch, roll)`
- **149** noise
  - 150 `vn2(x, y, s)`
  - 154 `vnh(a, b, s)`
  - 155 `fbm(x, y, o, s)`
  - 156 `ridged(x, y)`
  - 157 `rng(seed)`

## `src/js/view3d/01-shaders.js` (649 linjer)

---------- shaders ----------

- **1** shaders
- **183** the foam map (Fysikk 4, F1): the foam the boat and the sea leave in the water
- **253** the boat's own foam, when she has way on
- **261** the whitecaps, as the sea shader finds them (WCAPS, F3): where the waves break, the compression of the surface over the
  - 559 `cloudStep(dt)`
  - 566 `skyFrame(u, Hh, tn, bv)`
  - 581 `glsl3(src, fs)`
  - 589 `compile(type, src, nm)`
  - 596 `program(vs, fs, attrs, nm = '?')`
  - 604 `buf(data, target, usage)`
  - 609 `airSet(u, terr)`
  - 624 `sunT0()`
  - 631 `attr(loc, b, size)`
  - 647 `upload(pos, col, idx)`

## `src/js/view3d/02-mesh-terrain.js` (99 linjer)

---------- mesh builder ----------

- **1** mesh builder
  - 2 `MB()`
- **45** terrain
  - 76 `terrRaw(x, z, dil)`

## `src/js/view3d/03-berths-naust.js` (420 linjer)

---------- The water at the berths the company holds in the coast's harbours (core/07e-havn.js) ----------

- **1** The water at the berths the company holds in the coast's harbours (core/07e-havn.js)
  - 8 `berthPits()`
  - 34 `npcPits()`
  - 52 `berthPit(x, z, h)`
- **67** Father's naust and the Finnsnes shop (tools/harbour/naust.py, butikk.py; where: core/07c-naust.js)
  - 84 `rorbuNow()`
  - 90 `sitesNow()`
  - 125 `siteLift(F, o, u, nn)`
  - 135 `siteTerr(x, z, h)`
  - 152 `onSite(x, z)`
  - 162 `tileIn(kind, tx, ty)`
  - 163 `tileH(L, kind, x, z)`
  - 170 `terrH(x, z)`
  - 179 `unitTerr(x, z, h0)`
  - 204 `terrCoarse(x, z, dil)`
  - 214 `forestAt(x, z)`
  - 226 `forestCell(one, LF, ct, c, r)`
  - 233 `coverAt(x, z, cv, ck, k)`
  - 258 `satRead(L, x, z)`
  - 267 `satAt(x, z, cv, o)`
  - 275 `covBlk(LC, bx, by)`
  - 279 `coverRing(LC, ix, iz)`
  - 289 `coverClass(x, z)`
  - 304 `runAll(g)`
  - 306 `sliceRun(J, end)`
  - 307 `meshBegin(x0, z0, sx, sz, n, hf)`
  - 311 `meshRows(B, until)`
  - 327 `gridIdx(n)`
  - 350 `meshEnd(B)`
  - 351 `makeMesh(x0, z0, sx, sz, n, hf)`
  - 352 `freeMesh(m)`
  - 354 `nearSurf(M, x, z)`
  - 364 `unitPatch(U, M)`
  - 389 `buildPatches()`
  - 398 `buildTerrain()`
  - 407 `stream3d()`

## `src/js/view3d/04-vec-packs.js` (378 linjer)

---------- the coast's packs (01c-vec.js, part 4 of the coast-wide plan): buildings, roads, bridges, piers and breakwaters ----------

- **1** the coast's packs (01c-vec.js, part 4 of the coast-wide plan): buildings, roads, bridges, piers and breakwaters
  - 8 `tileStatics()`
  - 37 `tileStep()`
  - 57 `drawTileStatics(TM, eye)`
  - 68 `meshTask(kind, cur, x0, z0, span, n, hf, done)`
  - 87 `meshStep()`
  - 105 `recolorAll(sn)`
  - 106 `recolorStep()`
  - 111 `staleMesh(kind)`
  - 112 `staleOver(pk)`
  - 124 `updateFar()`
  - 135 `meshH(m, x, z)`
  - 140 `shadeH(x, z, dd)`
  - 142 `shSeed(m, old)`
  - 151 `updateShadows()`
  - 190 `sunGridStep(key, d)`
  - 223 `sgUpload(J)`
  - 231 `updateMid()`
  - 236 `updateNear()`
  - 240 `nearWanted()`
  - 250 `fineWanted()`
  - 272 `recolor(m, snow)`
- **366** the breakwaters' armour stones: a mesh a breakwater, drawn only within STONE_R of the eye (beyond it a stone is less than a
  - 370 `stonesOf(list, build)`
  - 375 `drawStones(list, TM, eye)`

## `src/js/view3d/05-quays-breakwaters.js` (337 linjer)

---------- villages and quays ----------

- **1** villages and quays
  - 10 `fyrInto(m, f)`
  - 25 `markInto(m, mk, tag)`
  - 39 `marksStatics()`
  - 49 `buildStatics()`
  - 88 `pierInto(m, q, tag)`
  - 109 `pierPiles(m, q)`
  - 117 `fitAdd(tag, f)`
  - 118 `fitDrop(tag)`
  - 119 `drawFits(eye, VP)`
  - 131 `seaOff(cx, cz, nx, nz, L, ax, az)`
  - 134 `quayFit(m, x, z, ax, az, nx, nz, L)`
  - 149 `slabInto(m, pts, tag, cut)`
  - 168 `bridgeInto(m, br, tag)`
- **209** breakwaters (the user's wish 03.10.2026: they shelter the boats at the quays, and should look it)
  - 217 `rockInto(m, x, y, z, sx, sy, sz, seed, k)`
  - 232 `moundTop(x, z)`
  - 241 `moundInto(m, pts, seed, unit, tag, sm)`
- **305** harbour fittings along the berth faces: tyres hung on chains, a timber fender beam, the yellow edge and bollards
  - 307 `obox(nb, c, u, n, len, wid, y0, h, k)`
  - 313 `buildHarbourFittings()`

## `src/js/view3d/06-buildings-lights.js` (405 linjer)

---------- real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor ----------

- **1** real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor
  - 6 `bldCells(key)`
  - 14 `vecBldIn(t, key)`
  - 18 `loadBuildings()`
  - 39 `onQuayStrip(x, z)`
  - 48 `bldNear(x, z, r)`
  - 55 `bldOnUnit(B, i)`
  - 67 `buildChunk(key, detail)`
- **104** details: chimney, windows, doors (only close to the boat)
  - 148 `addTrees(m, key, srcs, snowy, c)`
  - 183 `addRoads(m, key, snowy)`
  - 204 `freeChunk(c)`
  - 205 `updateChunks(maxBuilds)`
  - 222 `drawBuildings(TM)`
  - 241 `lightY(L, x, z)`
  - 242 `lightOn(L, t)`
  - 243 `drawSeaLights(VP, eye, t, near)`
- **258** lights that light up round them at night (the user's wish 03.10.2026)
  - 263 `pickLights(eye, t)`
  - 288 `plSet(u)`
  - 293 `drawBeams(VP, eye, t)`
  - 344 `workLights(type, G)`
  - 361 `airGlow()`
  - 362 `drawWorkCones(VP, eye, t, BMrel, VG)`
  - 398 `drawChunkLights(VP, eye)`

## `src/js/view3d/07-harbour-unit.js` (223 linjer)

---------- the harbour unit (tools/harbour/kaimottak.py): quay, fish plant, crane, forklift, ice silo and bunker station in one ----------

- **1** the harbour unit (tools/harbour/kaimottak.py): quay, fish plant, crane, forklift, ice silo and bunker station in one
  - 8 `unitModel(v)`
  - 20 `onUnit(x, z, m)`
  - 24 `craneGeo(P, q)`
  - 32 `drawUnitParts(P, eye, q, st, k, ch, T)`
- **46** the yard's ship lift (tools/harbour/steder.py; Jonas 07.10.2026: «dock eller slipvogn som kan tørrlegge alle båtene»)
  - 54 `liftStep(dt, b)`
  - 67 `drawYardLift(U, eye, M, UM)`
  - 76 `drawUnits(eye, VP, near, far, skip)`
  - 95 `siteSnow(P, snow)`
  - 109 `siteModel(k)`
  - 119 `drawSites(eye, VP, near, far)`
- **128** sponsors' signs (M7, docs/planer/butikker-og-sponsorer.md F2 and 4.4)
  - 150 `signTex(sp)`
  - 164 `signSeen(M, F, VP, eye)`
  - 176 `drawSigns(eye, VP)`
  - 205 `signOcc(VP)`
  - 222 `signTake()`

## `src/js/view3d/08-plants.js` (469 linjer)

---------- fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay ----------

- **1** fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay
  - 3 `plantLayout(pt)`
  - 13 `buildPlants()`
  - 23 `buildPlantParts()`
  - 58 `roundAt(R, T)`
  - 69 `plantRounds(P)`
  - 83 `workLow(st, T, idx)`
  - 108 `workTurn(st, eye, T, idx)`
  - 119 `drawShovel(G, B, tip, full, c, box, top)`
  - 128 `drawWorker(P, st, eye, T, idx)`
- **216** the work on deck, step by step (Jonas 20.10.2026: «Alle deler av arbeidsprosessene må ha egne animasjoner»); the places the
- **317** the breaks (Jonas 23.10.2026: «Husk at vi må ha animasjoner for alle handlinger og aktiviteter»; core/13-work.js idleAssign)
- **419** the props of the deck work (the poses above): the fish in the hands and on the table, the guts over the rail, the crate and the

## `src/js/view3d/09-landing-deck.js` (805 linjer)

---------- landing the catch ----------

- **1** landing the catch
  - 23 `deckSlots(kind)`
  - 36 `fkRun(P, back, Q)`
  - 55 `legAt(g, w)`
  - 64 `landLoad(L, j)`
  - 82 `drawLiveTub(KL, M, K, j)`
  - 86 `hatchOpenK()`
  - 89 `landOff(L)`
  - 93 `landBack(L)`
  - 102 `shipQuay(P, BMrel, eye, VG)`
  - 108 `shipAim(C, x, z, hook)`
  - 110 `shipPark(C)`
  - 114 `landScene(P, T, BMrel, eye)`
  - 219 `follow(P, key, st, T, v)`
  - 227 `drawPlant(P, eye, VP, T, BMrel)`
  - 274 `plantsCoast(eye)`
  - 282 `nearestPlant(eye)`
- **284** work on deck: the bleeding tub and the gutting table on the after deck; whoever works the deck guts or ices there
  - 286 `deckActivity()`
- **295** the deck kit (the user's wish 19.10.2026, tools/deck/*.py): the fish tubs, the gaff and the knife, the gutting table and
  - 299 `kit(f, nm)`
  - 302 `kitX(f)`
- **304** the hands in their grips (tools/harbour/hender.py): the meshes once for all the figures (the glove is the same on every look),
  - 312 `handMeshes()`
  - 325 `handFrame(z0, sp, side)`
  - 334 `handSpecs(st, F, R, hands)`
  - 380 `toolM(A, dir)`
  - 388 `dkEvent(kind, at, sp, kg, o)`
  - 394 `dkFor(who, p, task)`
  - 402 `dkEv(e, BMrel, G)`
  - 404 `catchQ()`
  - 409 `dkTick()`
  - 422 `dkBloodDraw(VP)`
  - 431 `rigAt(G, kind, d)`
  - 435 `drawNetTub(BMrel, at, fill, ry)`
  - 441 `drawLineTubs(BMrel, at, n, baited, green, ry, fill)`
  - 452 `jobTubs(j)`
  - 456 `drawMendNet(BMrel, G, d, R)`
  - 470 `drawRigRest(BMrel, G, d)`
- **483** the kit on the model's places (G.kit, from the boat's model; tools/deck): the life-saving gear the rules ask for (V.lsa,
  - 489 `boyeCanvas(txt)`
  - 495 `boyeTex()`
  - 502 `ladderMesh(L)`
  - 510 `boyeQ()`
  - 511 `drawSafety(BMrel, G, VP, t)`
  - 552 `cargoUnits(G)`
  - 553 `drawCargo(BMrel, G, hide)`
  - 568 `crFrames(X, Q, BMrel, p)`
  - 577 `crLink(X, a2)`
  - 580 `drawCrane(BMrel, G, VP, t, d)`
- **635** the fish tubs on an open boat's deck (core/07f-kar.js, docs/planer/fiskekar-dekk.md, Jonas 04.11.2026)
  - 646 `karPlan(key, spec, kg, dims)`
  - 654 `karSpec()`
  - 656 `drawKarLoad(M, load, key, washed)`
  - 675 `karPlaces(vt)`
  - 679 `drawCatchTubs(BMrel, vt, skip, washed)`
  - 685 `karTop(vt, i)`
  - 688 `karFilling(vt)`
- **689** the ice box (tools/deck/fisk.py iskasse, the 300 l tub in blue): it stands on deck at its place (the model's kit.iskasse, under
  - 692 `iceBoxAt(vt)`
  - 697 `iceBoxTop(vt)`
  - 701 `drawIceBox(BMrel, vt, shovelIn)`
  - 712 `shaftM(A, B)`
- **716** the sling (tools/deck/fisk.py slynge_*): the master link on the crane's hook at H (eye-relative, its top), a strap from the ring
  - 718 `drawSling(H, M, swing, k)`
- **736** the bleeding tub (Jonas 04.11.2026: «se at blodet og fisken fyller karet på en ordentlig måte»): the 300 l tub at the model's
  - 740 `drawBleedTub(BMrel, W, d, ux, uz, KT, KW)`
  - 758 `dkTub(G)`
  - 759 `drawDeck(BMrel, eye, VP, t, DK)`

## `src/js/view3d/10-gear.js` (548 linjer)

---------- passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling ----------

- **1** passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling
  - 3 `buildGear()`
- **44** the autoline's marks over the stern (H2d2, 06.11.2026)
  - 49 `aMarks(a, b, n, zc)`
  - 62 `aMarksOf(s, zc, key)`
  - 68 `autoMarks(BMrel, eye, t)`
  - 89 `aLive(M, m, t)`
  - 90 `aMarksPush(L, M, filt)`
  - 92 `drawGearSea(eye, t, VP, H)`
  - 129 `drawAutoDrops(eye, t)`
  - 159 `underProf(s, kind)`
  - 177 `drawGearUnder(VP, eye)`
  - 232 `drawSetting(BMrel, t, g, G, stack, x0)`
  - 254 `drawAutoSet(BMrel, t, g, G)`
  - 268 `haulFish(g)`
  - 278 `haulModel(kind)`
  - 287 `gopHauls()`
  - 301 `potDeck(G, HP, sx, d, pw, vt, ph)`
  - 308 `drawPotStacks(BMrel, K, n)`
  - 316 `stackTop(K, i, d)`
  - 322 `potsAboard()`
  - 323 `drawPotsAboard(BMrel, G, d, n)`
  - 339 `tankAt(x, z, d, vt)`
  - 357 `drawPots(BMrel, t, g, G, HP, sx, d, skiff, seg)`
  - 416 `drawCrabTank(BMrel, G, d, sx, HP)`
  - 425 `autoPort(G)`
  - 430 `aCleanS(HM, L)`
  - 432 `drawAutoSlides(BMrel)`
  - 439 `drawHaulRest(BMrel, G, d, VP)`
  - 460 `snoHauler(BMrel, G, VP, a)`
  - 462 `drawGearOp(BMrel, eye, VP, t)`

## `src/js/view3d/11-bunker.js` (65 linjer)

---------- bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle ----------

- **1** bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle
  - 3 `buildBunkers()`
  - 31 `nearestBunker(eye)`
  - 32 `drawBunker(B, eye, VP, T, BMrel)`

## `src/js/view3d/12-skiff.js` (420 linjer)

---------- boat ----------

- **1** boat
- **3** the starter boat: a 19 ft centre-console skiff, modelled in detail
  - 86 `NB()`
  - 95 `seaLook(l, helm)`
  - 99 `lookMesh(look)`
  - 106 `nSetup(VP)`
  - 112 `wearOn(t)`
  - 113 `wearOff()`
  - 121 `wetTick(key, M, sv, len, beam, top, spd)`
  - 132 `lifeOn(key, M, sv, type, age, keep, spd, G)`
  - 140 `lifeOff()`
  - 143 `drawN(m, M)`
  - 145 `texStrip(Pb, Pt)`
  - 146 `texQuad(P0, P1, P2, P3)`
  - 147 `mkTex()`
  - 148 `upTex(t, cv)`
  - 149 `drawTexQuad(q, tex, M, VP, lit, nrm)`
- **157** the open boats worked by hand: one kit per type
  - 165 `refreshPeople(K)`
  - 176 `useHand(t)`
  - 182 `handKit(t)`
  - 203 `buildSkiff()`

## `src/js/view3d/13-instruments.js` (514 linjer)

---------- the skiff's live instruments ----------

- **1** the skiff's live instruments
  - 11 `engineOn()`
  - 12 `paintPlotter()`
  - 64 `dial(g, cx, cy, r, v0, v1, v, a0, a1, ticks, labels, title, redFr…)`
  - 75 `paintGauges(dt)`
  - 91 `paintVhf()`
  - 103 `placeQ(t)`
  - 104 `drawNames(t, M, VP, liv, nm, port)`
  - 114 `markCanvas(cv, txt, light)`
  - 120 `markTex(t, liv)`
  - 128 `imgOf(src)`
  - 129 `curLogo()`
  - 130 `logoTexOf(L, img)`
  - 138 `logoQ(t)`
  - 139 `drawLogo(t, M, VP, L, img)`
  - 142 `markQ(t)`
  - 143 `drawMark(t, M, VP, liv)`
  - 147 `callQ(t)`
  - 148 `drawCall(t, M, VP, liv)`
  - 152 `nameCanvas(cv, nm, light)`
  - 167 `nameTex(nm, light, aspect, mark)`
  - 175 `drawNPCNames(kit, VP)`
  - 187 `paintHand()`
  - 196 `limbM(A, B, r)`
  - 199 `drawSkiff(BMrel, VP, dt, showSkipper, showCrew)`
  - 338 `drawSkiffGlass(BMrel, VP)`
  - 348 `jigRail(t, G)`
  - 369 `drawJigRail(BMrel, VP, t, G, dt)`
  - 402 `drawGlass(m, BMrel, VP)`
  - 421 `drawDrops(m, BMrel, VP, t)`
  - 432 `buildBoat()`
  - 458 `buildFlag()`
  - 470 `flagTex()`
  - 485 `penTex()`
  - 498 `mastTop(G)`
  - 502 `updateFlag(t, appW)`

## `src/js/view3d/14-sea.js` (413 linjer)

---------- sea ----------

- **1** sea
  - 3 `buildPatch()`
  - 11 `buildSea()`
- **21** the waves: wind sea and swell from the sea model (03b-sea.js)
  - 35 `specW(L0)`
  - 42 `spreadSd(f, ia)`
  - 43 `updateWaves(dt, H)`
- **76** the near field: the short sea rides with the boat
  - 85 `nfStep()`
- **96** the boat's own waves (the uniforms of WAKE_GLSL)
  - 103 `wakeTrack(x, z, fx, fz, ds)`
  - 122 `wakeTU(u, ox, oz)`
  - 123 `updateWake()`
  - 149 `wakeHFast(x, z)`
- **162** the foam map: the foam the boat and the sea leave in the water (Fysikk 4, F1, 27.10.2026)
  - 175 `foamFree()`
  - 176 `foamInit()`
  - 192 `wavePh()`
  - 199 `foamStep(dt, t)`
  - 267 `foamNPC(qx, qz, Dx, Dz, gx, gz)`
  - 307 `foamBind(u)`
- **338** the sea state over the near terrain and the whole map
  - 345 `ssLevel(n, unit)`
  - 347 `ssRect(L)`
  - 348 `ssWork(L, until)`
  - 371 `ssStep(rdt)`
  - 373 `ssBlend(L)`
  - 375 `ssTex(L, x, z, out)`
  - 382 `ssAt(x, z)`
  - 392 `seaQ(S, ren)`
  - 393 `seaDisp(x, z, t, S, fade)`
  - 404 `seaFade(x, z)`
  - 405 `seaH(x, z, t)`
  - 411 `seaHFast(x, z, t)`

## `src/js/view3d/15-env-mooring.js` (158 linjer)

---------- environment ----------

- **1** environment
  - 3 `pal(el)`
  - 12 `wetSet(H)`
  - 25 `computeEnv(H)`
- **71** mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off)
  - 75 `buildMooring()`
  - 77 `berthNow()`
  - 83 `approach(F, bp, u0, du0)`
  - 94 `pathM(pts)`
  - 99 `pathAt(M, s)`
  - 100 `lieAlongside(dt, bp)`
  - 103 `moorStep(dt, bp, at = dt)`
  - 135 `drawMooring(BMrel, eye, VP, t)`

## `src/js/view3d/16-motion.js` (318 linjer)

---------- boat motion ----------

- **1** boat motion
  - 2 `currentFrac()`
  - 3 `predict(frac)`
- **11** along the route (Jonas 06.10.2026: «båten strengt må følge rutestreken som lages i kartplotteren», «Svingingen kan være
  - 24 `trkBuild(pl, dep)`
  - 51 `trkAt(T, s)`
  - 57 `trkProj(T, x, z, s0, back = 30)`
  - 67 `trkOn()`
  - 83 `trkHaltNeed()`
  - 88 `trkStep(dt, pr)`
  - 130 `dynSoon()`
  - 133 `dynFollow(dt)`
  - 141 `updateBoat(dt, t, frac, rdt)`
- **238** the hull in the sea: buoyancy per section (Fysikk 4 F2, 07.11.2026; docs/planer/fysikk-4-sjo-og-skrog.md, Jonas' choice 2B)
  - 254 `hullSea(G, Bs, t, tf, dt)`
  - 276 `hullMove(dt, b)`
  - 294 `slamLog(v)`
- **303** particles
  - 307 `spawn(x, y, z, vx, vy, vz, life, g)`
  - 309 `drawPts(n, mode, VP, col, size, round, off, mx)`

## `src/js/view3d/17-draw.js` (207 linjer)

---------- drawing ----------

- **1** drawing
  - 2 `litSetup(VP)`
  - 8 `drawLit(m, M, hole)`
  - 17 `terProg(q)`
  - 25 `drawTerrain(TM, eye, VP, near)`
  - 50 `buildGround()`
  - 60 `maskOr(J, x, z)`
  - 61 `groundStep()`
  - 98 `buildLandMask()`
  - 121 `lmStep()`
  - 158 `seaRing(u, eye, y, R, Hl)`
  - 168 `drawSea(VP, eye, t, far, drop)`

## `src/js/view3d/17b-inland-water.js` (152 linjer)

---------- the fresh water: lakes, ponds, rivers, streams and waterfalls (G2 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the fresh water: lakes, ponds, rivers, streams and waterfalls (G2 of docs/planer/grafikk-natur-og-miljo.md)
  - 26 `waterData(tx, ty)`
  - 42 `waterMesh(P, A)`
  - 82 `waterNear(W, ex, ez)`
  - 110 `freeWater(m)`
  - 114 `updateWater(eye)`
  - 131 `staleWater(pk)`
  - 135 `drawWater(VP, eye)`

## `src/js/view3d/17c-trees.js` (103 linjer)

---------- the trees (G4 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the trees (G4 of docs/planer/grafikk-natur-og-miljo.md)
  - 12 `treeExt()`
  - 14 `treeModels()`
  - 39 `treeSpecies(needle, x, z, y, h, r)`
  - 47 `treeChunk(c, key, occ, snowy)`
  - 55 `treePlant(c)`
  - 73 `treeFree(c)`
  - 75 `treeSeasonU()`
  - 79 `drawTrees(VP, eye)`

## `src/js/view3d/17d-vind.js` (96 linjer)

---------- the wind turbines and the power lines over the sea (G7 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the wind turbines and the power lines over the sea (G7 of docs/planer/grafikk-natur-og-miljo.md)
  - 11 `vindModels()`
  - 37 `vdGround(x, z, now)`
  - 43 `vdSpan(s, now)`
  - 51 `vdBuild(eye, now)`
  - 71 `drawVind(VP, eye, dt, far)`

## `src/js/view3d/17e-life.js` (174 linjer)

---------- life in the landscape (G9 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** life in the landscape (G9 of docs/planer/grafikk-natur-og-miljo.md)
  - 13 `lifeModels()`
  - 26 `lifeCls(x, z)`
  - 34 `lifeGrid(eye, g, R, salt, f)`
  - 38 `lifeBuild(eye, now)`
  - 99 `roadAt(xs, zs, cum, s)`
  - 103 `drawLife(eye, t, VP)`
  - 146 `lifePts(VP, eye, t, far)`

## `src/js/view3d/17f-near.js` (92 linjer)

---------- the near field on land (G8 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the near field on land (G8 of docs/planer/grafikk-natur-og-miljo.md)
  - 12 `nearModels()`
  - 33 `nearSquare(i, j)`
  - 61 `drawNear(VP, eye, t)`
  - 62 `drawNear0(VP, eye, t)`

## `src/js/view3d/17g-marina.js` (61 linjer)

---------- the small-boat harbours (G10 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the small-boat harbours (G10 of docs/planer/grafikk-natur-og-miljo.md)
  - 9 `marinaModels()`
  - 27 `marinaBuild(eye, now)`
  - 49 `drawMarinas(eye, t, VP)`

## `src/js/view3d/17h-shore.js` (93 linjer)

---------- the beaches, the shingle and the cliffs by the sea (G10 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the beaches, the shingle and the cliffs by the sea (G10 of docs/planer/grafikk-natur-og-miljo.md)
  - 8 `shoreData(tx, ty)`
  - 71 `updateShore(eye)`
  - 86 `staleShore(pk)`
  - 87 `drawShore(VP)`

## `src/js/view3d/18-setup.js` (213 linjer)

---------- setup ----------

- **1** setup
  - 30 `seaMarksSettle()`
  - 71 `init()`
  - 191 `anchorAlarm3d(kind)`
  - 194 `sayBoat(id, txt)`
  - 196 `sayWorker(pid, idx, nm, no, en)`
  - 200 `crewFx3d(c, kind, o)`
  - 202 `say3d(c, no, en)`
  - 206 `buildLabels()`
  - 207 `resize()`

## `src/js/view3d/19-wildlife-npc.js` (200 linjer)

---------- wildlife ----------

- **1** wildlife
  - 2 `bodyLoft(m, L, R, prof, col, belly, y0)`
  - 6 `buildWild()`
  - 33 `wildSpawn(t)`
  - 47 `blow(x, y, z)`
  - 48 `drawWild(eye, t, dt, M0)`
  - 102 `drawBlows(VP, eye, dt)`
- **112** other vessels
  - 113 `shipHull(m, L, B, D, F, hull, bottom, deck)`
  - 120 `windows(m, x0, x1, y, z, h, col, sideX)`
  - 121 `buildNPC()`
  - 151 `pvm(t, liv)`
  - 165 `pvmHull(t, liv, tier)`
  - 176 `ownTier(t, M)`
  - 184 `personMesh(kind, look, key)`
  - 196 `people()`

## `src/js/view3d/20-trawl-seine.js` (395 linjer)

---------- the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved

- **1** the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved
  - 8 `trawlKit(t)`
  - 15 `ropeKit()`
  - 22 `alongM(A, d)`
  - 29 `trawlState(now)`
  - 38 `drawTrawl(t, A, BMrel, now, stO)`
- **63** the purse seine (tools/boats/not75.py; Jonas 06.10.2026: «Denne kan både bruke ringnot og trål og trenger dermed
  - 69 `seineState(now)`
  - 79 `drawSeine(t, A, BMrel, VP, now, stO)`
  - 120 `drawDeckCrew(BMrel, eye, VP, t, G)`
  - 184 `spHold(f)`
  - 187 `deckWork(G)`
  - 195 `drawHelmKit(BMrel, eye, G)`
  - 207 `sailOf(t)`
  - 208 `drawSail(t, M, set)`
  - 212 `drawHatch(t, G, M, k)`
  - 219 `shipCraneOf(t)`
  - 220 `shipCraneAim(C, pose)`
  - 227 `drawShipCrane(t, G, M, pose)`
  - 237 `drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named)`
  - 264 `npcMesh(n, lod)`
  - 276 `seineAnch(G)`
  - 286 `npcClock(Hf)`
  - 294 `npcHead(n, t)`
  - 309 `npcFollow(n, t)`
  - 323 `npcPhase(id)`
  - 324 `drawNPC(eye, t, H, VP)`
  - 374 `npcCrewDraw(n, K, eye, t)`

## `src/js/view3d/21-rescue-anchor.js` (255 linjer)

---------- the rescue boat (tools/boats/redning.py) and its tow line, where core/05-vessels.js towPose says ----------

- **1** the rescue boat (tools/boats/redning.py) and its tow line, where core/05-vessels.js towPose says
  - 4 `drawTowLine(BMrel, VP)`
- **14** the boat's own anchor (tools/deck/anker.py, core/06e-anchor.js; Jonas 21.10.2026)
  - 27 `frameM(o, z, up, s)`
  - 29 `drawMany(m, Ms)`
  - 31 `ancMesh(bw)`
  - 36 `ancStow(F, P, bw, L)`
  - 47 `rodePts(A, F, Lr, n)`
  - 60 `rodeDraw(pts, dm, rope, wy, Lr, CH, M)`
  - 82 `ancSplash(x, y, z, n, up)`
  - 85 `drawNPCAnchor(n, K)`
  - 89 `drawAnchor(BMrel, eye, VP, t)`
- **137** man overboard (Ø11.6, core/14b-sikkerhet.js): the person in the water, the lifebuoy with its light and its smoke, and the
  - 147 `mobKitBack()`
  - 149 `mobLook(M)`
  - 154 `drawMob(BMrel, eye, VP, t)`
  - 216 `drawMobLights(VP, t)`
  - 226 `buildRescue()`
  - 232 `drawRescue(BMrel, eye, VP, t)`
  - 247 `drawRescueLights(VP, t)`

## `src/js/view3d/22-docks-air.js` (254 linjer)

---------- the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py) ----------

- **1** the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py)
  - 5 `buildDocks()`
  - 14 `quayFill()`
  - 25 `drawDocks(eye, t, VP)`
- **80** the floating docks among the packs' piers (01c-vec.js flyteTile, tools/harbour/brygge.py; tilbakemelding #94)
  - 93 `floatFree(k)`
  - 94 `floatJob(t, FD, solid)`
  - 145 `drawFloats(eye, t, VP)`
- **163** aircraft (tools/air/fly.py) where core/05c-air.js airStates puts them, within about 15 km of the eye
  - 165 `buildAir()`
  - 170 `drawAir(eye, t, H, VP)`
  - 184 `drawAirLights(VP, t)`
  - 194 `drawNPCGlass(VP)`
- **195** the lanterns in thick weather (Ø11.2; sjøveisreglene rule 20 c and vedlegg I, read 06.11.2026)
  - 201 `lanternFog()`
  - 202 `lampFade(d, kind, L, LF)`
  - 211 `lampArc(M, lp, lk)`
  - 224 `lampsMore(L3, st, len)`
  - 232 `drawNPCLights(VP)`

## `src/js/view3d/23-camera-frame.js` (104 linjer)

---------- the chase camera stays out of solid things ----------

- **1** the chase camera stays out of solid things
  - 7 `camSolid(x, z, sx, sz, ry, y0, y1, tag)`
  - 14 `camBuildings(key)`
  - 22 `camBld(B, idx, tag)`
  - 33 `camDropTag(tag)`
  - 36 `camFree(o, e)`
  - 59 `camInside(x, y, z)`
  - 66 `compassStrip(W, H, dpr)`
  - 81 `compassDraw(az, p)`
- **94** frame
  - 98 `fpsEl()`

## `src/js/view3d/24-cinema.js` (722 linjer)

---------- cinema (the user's wish 03.10.2026; a director of fourteen shots 01.11.2026) ----------

- **1** cinema (the user's wish 03.10.2026; a director of fourteen shots 01.11.2026)
  - 24 `kinoLand()`
  - 31 `kinoSight(a, b)`
  - 36 `kinoWant(K, t, B)`
  - 82 `kinoOk(K, t)`
  - 92 `kinoMake(type, t, land)`
  - 112 `kinoNext(t, want, why)`
  - 130 `kinoCam(t, rdt)`
  - 155 `introStart(sec)`
- **161** the picture watched (02.11.2026; Jonas: «Det er viktig at vi fanger opp så mye potensielle feil som oppstår så fort som
  - 180 `gfxErr(msg, ctx)`
  - 185 `glReport(e, tag)`
  - 187 `glProbe(tag)`
  - 194 `gfxStart(now)`
  - 202 `gfxJudge(px, day, vis)`
  - 209 `gfxPix(j)`
  - 216 `gfxNaN(eye, VPn)`
  - 226 `gfxEnd(now, eye, VPn, W, Hh)`
  - 268 `frameClock(raw)`
  - 277 `frame()`
  - 282 `frame0()`
  - 474 `snapTake()`
  - 479 `drawRoute(VP, eye)`
  - 491 `driftSpray(VP, eye, dt, t, col)`
  - 506 `drawSmoke(VP, eye, BM, dt)`
  - 547 `scupperWater(VP, eye, BM, dt, t, col)`
  - 574 `drawEffects(VP, eye, BM, dt, t)`
  - 704 `updateLabels(VP, eye, W, Hh)`

## `src/js/view3d/25-controls.js` (224 linjer)

---------- controls ----------

- **1** controls
  - 19 `paintView(on)`
  - 24 `paintAim(C, yawW)`
  - 35 `tryView(k)`
  - 36 `hoist(k)`
  - 38 `tryEq()`
  - 44 `liftY(k)`
  - 48 `showroom(type)`
  - 57 `show(on, auto)`
  - 73 `bench(ks, ns)`
- **91** the profile (#prof, F1)
  - 101 `pqInit()`
  - 109 `pqPoll()`
  - 118 `profBegin(rdt, j0)`
  - 121 `profMark(k)`
  - 125 `profEnd()`
  - 135 `prof(sets)`
