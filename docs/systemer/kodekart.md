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

## `src/js/core/01-world.js` (451 linjer)

- **10** one clock for everyone (05.10.2026, the shared world V1)
  - 54 `gridScale(p)`
  - 58 `gridGamma(p)`
  - 76 `farL(kind, p)`
  - 81 `expoFar(p)`
  - 86 `landFracM(x, z)`
  - 91 `landXIn(X, x, z)`
  - 96 `dcCellFar(p)`
  - 103 `b64bytes(s)`
  - 104 `varints(b)`
  - 112 `loadFine()`
  - 120 `loadRoads()`
  - 136 `inHarbour(p)`
  - 143 `legHazard(a, c, sd)`
  - 156 `legHazardMemo(a, c, sd)`
  - 161 `draftHazards()`
  - 171 `legReady(a, c)`
  - 178 `nearestPlace(p)`
  - 182 `groundCheck(a, c)`
  - 198 `runAground(p)`
  - 213 `rocksNear(a, b, r)`
  - 223 `rocksIn(x0, y0, x1, y1)`
  - 231 `rocksAlong(a, b, r)`
  - 245 `coastDist(p)`
  - 246 `coastDistFar(p)`
  - 252 `decodeContours()`
  - 261 `isLand(p)`
  - 269 `isLandFar(p)`
  - 275 `isLandUI(p)`
  - 281 `inHarbourPocket(p)`
  - 287 `harbourNear(x, z)`
  - 293 `qPockets()`
  - 294 `pocketHit(US, QS, x, z)`
  - 301 `pocketsIn(x0, y0, x1, y1)`
  - 310 `legClear(a, b)`
  - 341 `portLabel(p)`
- **357** the harbour unit (02.10.2026)
  - 398 `fillOut(U, lx, lz)`
  - 411 `onUnitGround(p)`
  - 418 `unitCovers(x, z, m)`
  - 426 `bridgeUnderUnit(br, extra)`
  - 431 `portApproach(pt)`

## `src/js/core/01b-mapdata.js` (210 linjer)

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
  - 160 `rcell(L, ix, iy)`
  - 166 `rbil(L, p)`
  - 171 `rbilM(L, x, z)`
  - 176 `mapHasM(L, x0, z0, x1, z1)`
  - 183 `mapVec(pk, name)`
  - 190 `mapViewReady(x0, y0, x1, y1, then, kinds)`
  - 197 `simAreaReady()`
  - 205 `mapDrop(pk)`

## `src/js/core/01c-vec.js` (215 linjer)

THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces

- **1** THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces
  - 23 `inQuad(Q, x, z)`
  - 28 `pierBoxes(out, kind, n, X, Z, src)`
  - 45 `vecDecode(D)`
  - 120 `flyteTile(tx, ty)`
  - 129 `vecFinish(r)`
  - 138 `vecWorker()`
  - 155 `vecInput(pk, inflate)`
  - 163 `vecDecodeHere(pk)`
  - 165 `vecTile(tx, ty)`
  - 174 `vecTilesIn(x0, z0, x1, z1)`
  - 182 `roadsIn(x0, z0, x1, z1)`
  - 195 `bridgesIn(x0, z0, x1, z1)`
  - 197 `vecWant(x0, y0, x1, y1, then)`
  - 205 `vecPrune(pts, R = 60)`

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

## `src/js/core/01e-marks.js` (62 linjer)

THE SEA MARKS ALONG THE WHOLE COAST (05.10.2026; Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av

- **1** THE SEA MARKS ALONG THE WHOLE COAST (05.10.2026; Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av
  - 11 `marksAdd(pk)`
  - 21 `marksRocksIn(x0, y0, x1, y1)`
  - 26 `marksNear(kind, x, y, R)`
- **34** THE NAMES OF THE FISHING GROUNDS ALONG THE WHOLE COAST (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026)
  - 43 `feltData()`
  - 56 `feltIn(x0, y0, x1, y1)`

## `src/js/core/02-species-gear.js` (250 linjer)

Placeholder prices (NOK/kg, grade A) – to be tuned

- **78** vessels, equipment, crew
  - 195 `fuelWeek(w)`
  - 197 `fuelPrice(H = S.t / 60, pid = S.boat && S.boat.port, diesel = BOAT.die…)`
  - 224 `equipFits(k, type)`
  - 227 `fuelBase(v, vmax, planing)`
  - 228 `fuelKOf(V)`
  - 230 `vesselDerive(V)`
  - 244 `lsaOf(V)`

## `src/js/core/03-simulation.js` (1220 linjer)

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
  - 91 `powerX(b)`
  - 93 `applyVessel()`
  - 114 `effortOf(people, jk, hand)`
  - 115 `fishEffort()`
  - 123 `jigMeShare()`
  - 132 `hash(n)`
  - 133 `h2(a, b)`
  - 134 `vn(t, s)`
  - 135 `sstep(a, b, x)`
  - 136 `seasonal(arr, H)`
  - 156 `wxTrack()`
  - 167 `wxMeasure(p)`
  - 175 `wxPlace(p)`
  - 183 `wxLowShape(k, m)`
  - 190 `stormsNear(H, p)`
  - 202 `wxWindF(H, p)`
  - 203 `windAt(H, p)`
  - 213 `windDir(H, p)`
  - 224 `exposure(p)`
  - 226 `fcErr(H, now, seed)`
  - 227 `fcWind(H, now, p)`
  - 229 `beaufort(W)`
  - 244 `climW(p)`
  - 250 `climV(key, H, p)`
  - 251 `climDiff(key, H, p)`
  - 252 `climRatio(key, H, p)`
  - 253 `airTemp(H, p)`
  - 255 `precipAt(H, p)`
  - 256 `cloudAt(H, p)`
  - 257 `visibility(H, p)`
  - 259 `seaTemp(H, p)`
- **260** snow and the seasons on land (V2 and V3 of the weather plan; Jonas 09.10.2026: «vi må bygge ferdig værsystemene og årstidene»).
  - 272 `wxDay(d, p)`
  - 279 `seasonAt(H, p)`
  - 306 `snowLineAt(H, p)`
  - 313 `snowAt(H, z, p)`
  - 320 `obsAt(p)`
  - 321 `eqToHor(ra, dec, d, ob)`
  - 327 `sunEq(d)`
  - 331 `moonEq(d)`
  - 336 `sunAt(H, p)`
  - 337 `moonAt(H, p)`
  - 344 `moonName(mo)`
  - 346 `sunTimes(H, p)`
  - 354 `flagUp(H, p)`
- **359** tide: harmonic prediction per place (phase K10 of the coast plan)
  - 372 `tidePlace(p)`
  - 381 `tideH(H, p)`
  - 389 `tideEvents(H0, hours, p)`
  - 397 `auroraAt(H, p)`
  - 400 `riskLevel(W, hs)`
- **403** weight (the user's list 04.10.2026: «mer last og vekt betyr mindre fart ... viktig at ikke dette blir urealistisk»): what she
  - 408 `boatTons()`
  - 409 `boatTons0()`
  - 410 `loadF()`
- **411** fouling: weed and barnacles on the hull (S.boat.foul, 0 to 1) slow her up to 15 % and cost up to 25 % more fuel; it grows in
  - 415 `foulHour(H)`
  - 419 `fuelUse(b, l)`
  - 420 `fuelAdd(b, l, kr0)`
  - 421 `fuelLph(v, W)`
  - 422 `speedCap(hs, cb = 1)`
  - 425 `noise2(x, y, s)`
  - 431 `slopeAt(p)`
  - 439 `hotField(sp, p, H, k)`
  - 443 `hotspot(sp, p, H)`
  - 452 `schField(sp, p, H, k, si, v)`
  - 456 `school(sp, p, H)`
  - 463 `schoolHeading(sp, p, H)`
  - 472 `fieldCode(p)`
  - 474 `skreiSpot(p, d = depthF(p)`
  - 479 `gauss(u1, u2)`
  - 481 `sampleFish(sp, p, H)`
  - 486 `clsOf(sp, kg)`
  - 489 `kveiteClosed(H)`
  - 492 `targetF(sp, H, pilk)`
  - 497 `uerOpen(H)`
  - 501 `denPlace(p)`
  - 507 `denTime(H)`
  - 515 `denSp(sp, q, H, T)`
  - 529 `density(sp, p, H)`
  - 536 `eggaArea(p, d, H, E)`
  - 562 `tutBonus(sp, p)`
  - 574 `stockIdx(p)`
  - 576 `stockW(p)`
  - 581 `stockFill(v)`
  - 586 `stockAt(p, sp, H)`
  - 594 `takeStock(p, kg, sp, npc)`
- **600** the shared world V2 (05.10.2026; ui/10h-world.js, supabase/migrations/20261006000000_world_v2.sql): one sea, one quota and one
  - 606 `wq()`
  - 607 `wshOpen(y)`
  - 608 `wshSat(pid, sp, H)`
  - 609 `wshTake(k, kg)`
  - 611 `wshLand(port, H, acc, kgSp, codQ)`
  - 620 `initStock()`
  - 621 `stockHour(H)`
  - 643 `depthFactor(sp, d, k = 1)`
  - 648 `depthF(p)`
  - 654 `depthHas(p)`
  - 663 `deepAt(p)`
  - 668 `offDepth(p)`
  - 671 `tileDepth(p, d)`
  - 678 `depthWater(p)`
  - 690 `depthAt(p)`
  - 691 `depthModel(p)`
  - 692 `grade(f)`
- **693** How the catch keeps (D3 of the operations plan, Jonas 23.10.2026, svar 15a: calibrated against the sources)
  - 703 `keepDay(f)`
  - 704 `keepF(day)`
  - 707 `keepK(x, rrs)`
  - 709 `keepHours(f, f2, k)`
  - 711 `supplyFactor(H)`
  - 718 `weekOfH(H)`
  - 719 `weekDev(sp, H)`
  - 725 `marketPrice(sp, H, fz)`
  - 727 `clsPrice(port, sp, c, H, hook, fz)`
  - 733 `price(port, sp, H)`
  - 735 `avgPrice(sp, H, days)`
- **736** quotas north of 62° N: the regulation and the year's figures are in 03d-quota.js
  - 737 `doyH(H)`
  - 738 `yearH(H)`
  - 739 `quotaState()`
  - 757 `licValue(l)`
- **774** the books (Økonomi 2, Ø1, 27.10.2026, docs/planer/okonomi/02-design.md)
  - 796 `bookMigrate()`
  - 804 `bookAll(parts, no, en, vid)`
  - 818 `bookResult(y)`
- **820** the bank's accounts (Økonomi 2, Ø3, 27.10.2026; Jonas: «Automatisk skatteavsetning, rente på sparekonto, kassakreditt med
  - 829 `bankS()`
  - 837 `bankMove(k, kr0, no, en)`
  - 840 `bankAfterIncome(inKr)`
  - 848 `taxPay(kr0, no, en)`
  - 851 `bankRelease()`
  - 855 `bankDay(H)`
  - 888 `taxOf(P, form, days, skj = 0, carry = 0)`
  - 898 `saldoOf(v)`
  - 909 `skjOf(frac, ri = 1)`
  - 913 `txInit(H, adv)`
  - 915 `yearFrac(H)`
  - 917 `txProfit(H)`
  - 920 `txNow(H = S.t / 60)`
  - 926 `taxOwed(H = S.t / 60)`
  - 931 `enkAdv(H)`
  - 937 `taxPlan(H = S.t / 60)`
  - 950 `asBase(y)`
  - 954 `txClose(H)`
  - 970 `taxDayMark(H)`
  - 976 `taxFix(H)`
  - 993 `taxTick(H)`
  - 1031 `foundAS()`
  - 1044 `mvaCheck(total)`
  - 1053 `trekkOf(total, len)`
  - 1058 `fmInit()`
  - 1060 `fmLand(total)`
  - 1069 `takeLoan(amount, months, k)`
  - 1073 `payDown(x)`
  - 1079 `deal(price, ti, inn)`
  - 1086 `finance(x, months)`
  - 1089 `lenGroup()`
  - 1090 `codLimits(H)`
  - 1093 `codOpen(H)`
  - 1094 `codLimitNow(H)`
- **1095** haill: luck from the quay. Fresh goods: full effect for two days, fading to nothing on day seven. Sold for real money only (test mode now) or won at the pub.
  - 1113 `haillBoost()`
  - 1114 `haillLeft()`
  - 1115 `haillStage()`
  - 1117 `haillF()`
  - 1118 `luck(sp)`
  - 1120 `giveHaill(type, how)`
  - 1121 `useHaill(type)`
  - 1127 `pubEvening(H)`
  - 1128 `pubOpen(H)`
  - 1131 `capHold()`
  - 1133 `cargoRoom()`
  - 1135 `cargoMin(kg)`
- **1136** the daily login bonus: each real calendar day you open the game adds a point to a bonus on the fish price; each day
  - 1139 `streakState()`
  - 1140 `streakPct()`
  - 1141 `streakTouch()`
- **1152** cold: effective temperature from air temperature and wind, plus wet from rain, snow and spray. Cold, wet hands fish worse;
  - 1156 `effTemp(H)`
  - 1157 `coldPen(H, hs)`
- **1164** orders from buyers and customers: species, amount, quality, deadline and a price premium; reputation builds with each buyer
  - 1179 `gradeOk(g, q)`
  - 1180 `ordState()`
  - 1183 `custNear(c)`
  - 1188 `repOf(id)`
  - 1190 `bkOrderable(H)`
  - 1192 `bkPlant(id)`
  - 1193 `custSp(c)`
  - 1194 `spCatchable(sp, H)`
  - 1196 `ordersTick(H)`

## `src/js/core/03b-sea.js` (156 linjer)

SEA: fetch, wind sea, swell

- **1** SEA: fetch, wind sea, swell
  - 11 `fetchRay(x, y, dx, dy)`
  - 24 `fetchAt(p, from)`
  - 31 `fetchCell(ix, iy, k)`
  - 42 `fetchSector(p, k)`
  - 56 `fetchFine(p, from)`
  - 66 `fetchHere(p, from)`
  - 67 `fetchField(p, from)`
  - 77 `hsWMO(U)`
  - 82 `hsWind(U, F)`
  - 84 `fetchCap(U)`
  - 85 `tpWind(U, F)`
  - 89 `wdAt(H, p)`
  - 90 `weAt(H, p)`
  - 99 `swellOpen(H, p)`
  - 108 `swellFactor(p)`
  - 110 `hsParts(p, H)`
  - 115 `hsAt(p, H)`
  - 120 `hsOpen(H, p)`
  - 122 `fcHsOpen(H, now, p)`
  - 123 `hsAtFc(p, H, now)`
  - 129 `seaState(hs)`
  - 132 `seaHere(p, H)`
  - 142 `seaDirOf(rel)`
  - 149 `seaPartsNear(p, H)`
  - 151 `seaDirF(p, H, head)`

## `src/js/core/03c-stability.js` (95 linjer)

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

## `src/js/core/03d-quota.js` (370 linjer)

Quotas for cod, haddock and saithe north of 62° N. The regulation as it stood from 1 October 2026 (J-161-2026, fiskeridir.no)

- **1** Quotas for cod, haddock and saithe north of 62° N. The regulation as it stood from 1 October 2026 (J-161-2026, fiskeridir.no)
  - 20 `norQuota(sp, tac)`
  - 30 `codChain(N)`
  - 37 `tacOf(sp, y)`
  - 40 `yearQuota(y)`
- **54** the closed group: quota lengths the game sells, with J-161-2026's quota factors and quantities (§§ 16, 18, 19). Cod is a fixed
  - 71 `licQ(l, H, len)`
  - 83 `sellerCod(id, H)`
  - 89 `openUsedSave(q)`
  - 91 `openUsedLoad()`
  - 92 `freshQuota()`
  - 93 `licStart(lic)`
- **94** the stocks and the total quotas year by year. History and the advice for 2027 from the Institute of Marine Research (hi.no,
  - 127 `kystAt(T, y)`
  - 128 `kystF(lat, H)`
  - 135 `stockYear(sp, y)`
  - 152 `ssbAt(sp, H)`
  - 153 `stockF(sp, H)`
- **155** the open group's season. About 2 100 boats fish the group quota down a day at a time (more in the skrei season and on days
  - 166 `qyOf(y)`
  - 173 `qyBoats(Y, y)`
  - 174 `qyStep(Y, y, d)`
  - 192 `quotaNewYear(y)`
  - 195 `qyAt(H)`
  - 197 `codStopDoy(y)`
  - 198 `openMaxAdd(H)`
  - 203 `ffPlan(y)`
  - 211 `ffPct(H)`
- **213** the closed group's register: a fixed number of rights (1 622 in the cod fishery north of 62° N on 17.10.2025, case document
  - 229 `npcReg()`
  - 231 `regSend(fn, id)`
  - 236 `regTake(id)`
  - 238 `regFree(id)`
  - 240 `regSeller(id, H)`
- **242** structure quotas (forskrift om spesielle kvoteordninger for kystfiskeflåten, J-244-2025): quota lengths 11–27.99 m may buy a
  - 246 `structRoom(l, id)`
  - 248 `structPrice(id, H)`
  - 249 `structIn(l, id, H)`
  - 250 `licExtra(l)`
  - 252 `structExpire(l, y)`
- **253** the special scheme for quota lengths under 11 m (kap. 2, from 2025): an owner with two such boats, both owned since the year
  - 255 `twoOK(la, lb, y)`
- **256** quota cooperation (J-161-2026 § 31): two closed-group boats under 11 m with different owners; both owners aboard, the passive
  - 260 `coopOffer(H)`
  - 261 `coopOK(l, y)`
- **263** the ocean permits (H1 of docs/planer/havsteget.md, 03.11.2026). Jonas' choices the same day: V1 A (the autoliner first), V2 B
  - 294 `havLicFor(type)`
  - 296 `havF(id, sp, y)`
  - 307 `havGroup(id, y)`
  - 310 `havQ(l, H)`
  - 317 `havLicWhy(type)`
  - 324 `havOffer(id, H)`
  - 327 `havValue(l, H)`
  - 329 `havPrice(type, H)`
  - 331 `havLicTake(type, H)`
- **335** Greenland halibut (blåkveite) for vessels under 28 m (J-241-2025, the regulation for 2026; docs/blakveite.md 2-3, 07.10.2026)
  - 343 `bkSeason(y)`
  - 346 `bkOpen(H)`
  - 352 `bkDirect(H, len)`
  - 354 `bkState(H)`
  - 357 `bkAllow(H, bk, all)`
  - 362 `bkLanded(H, bk, all)`
  - 364 `bkNews(H)`

## `src/js/core/03e-rules.js` (426 linjer)

The rules along the coast (R2 of the rules plan, 05.10.2026). rulesAt() takes a place, a time, the boat's length, the gear and the

  - 29 `ruPip(rings, x, y)`
  - 30 `ruIn(P, x, y)`
  - 35 `ruBlock(bx, by)`
  - 53 `ruBits(p)`
  - 70 `ruSeaBlock(bx, by)`
  - 84 `ruSea(p)`
  - 88 `ruShelf(p)`
  - 94 `zoneLic(c)`
  - 95 `zoneLicApply(c)`
  - 99 `insideFjord(p)`
  - 100 `insideBaseline(p)`
  - 102 `blDist(p)`
  - 108 `ruHom(p)`
  - 114 `landsdel(p)`
  - 115 `ruLok(p)`
  - 117 `ruZone(p)`
  - 118 `ruAt(id, p)`
  - 120 `ruLineName(ref)`
  - 134 `kcQuota(ll)`
  - 151 `ruSeaRules(c, q, ll, md, add)`
  - 224 `rulesAt(q)`
  - 335 `ruBlockMsg(q)`
  - 337 `ruMinSize(sp, p)`
  - 350 `fjordLimits(p, H)`
  - 374 `ruCtx()`
  - 378 `ruNow()`
  - 384 `ruLayerBlock(bx, by, q, budget)`
  - 396 `ruWpQ(w)`
  - 401 `ruWpMsg(w)`
  - 408 `ruOpenNear(p, q, maxKm)`
  - 417 `ruTips()`

## `src/js/core/03f-fiske.js` (380 linjer)

The fishing along the coast as it really was, and where the fish is from it (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026).

  - 33 `fkData()`
  - 39 `fkIndex(fs)`
  - 46 `fkCell(sp, area, m, gear, lg)`
- **54** the location of a 2 km cell (ruLok kept per cell, plan 5b: looked up per cell and hour, not per point)
  - 56 `lokCands(bx, by)`
  - 63 `lokOfCell(p)`
- **71** the migrations (MIG): HI's descriptions, as curves of time and place
- **122** where the fish swim: the heading of the schools and of the good patches, by species, season and place
  - 131 `migOffshore(lat, lon)`
  - 139 `migHeading(sp, lat, lon, mf)`
  - 155 `migNode(si, sp, ix, iy, k, T, mw, kind)`
  - 163 `migDir(sp, p, k, T, mw, kind)`
  - 170 `mfOfH(H)`
- **172** the fish up and down in the water: by night most species rise from the bottom (HI; the diel vertical migration)
  - 178 `cellNight(c, H)`
  - 182 `vertZ(sp, night)`
  - 189 `gearVertF(sp, key, p, H)`
  - 197 `biteF(sp, p, H)`
- **203** the field from the notes: per species a Float32Array of locations × 12 months against Senja (NaN: no figure)
  - 205 `fkNeighbours()`
  - 213 `fkBuild()`
  - 296 `fkMonth(H)`
  - 298 `fkAt(a, l, T)`
  - 300 `skreiFront(lat, H, T)`
  - 306 `skreiPulse(c, H, T)`
  - 312 `fkAvail(sp, q, T)`
  - 348 `areaF(sp, p, H)`
  - 354 `skreiShare(p, H)`
  - 361 `skreiFlow(K, H)`
- **368** the sea's warmth: the fish go deeper when the surface is warmer than they like (B4, 02.11.2026)
  - 375 `tempDepthK(sp, c, H)`

## `src/js/core/03g-trykk.js` (206 linjer)

The fleet's pressure and the stock's baseline (B3 of docs/planer/bestand-og-flaate.md, 02.11.2026). The whole Norwegian fleet takes

  - 49 `trkAreas()`
  - 64 `trkCellW(c)`
  - 71 `trkSkreiMonths(D)`
  - 79 `trykkYear(sp, y)`
  - 135 `trkBiomass(sp, y, notes)`
  - 142 `trykkOpenScale(H)`
  - 151 `trkPlayersF(sp, y, Y)`
  - 161 `trkMonth(h)`
  - 167 `trkCell(c, H)`
  - 192 `fleetF(sp, p, H)`
  - 193 `fleetU(sp, p, H)`
  - 195 `baseAt(p, sp, H)`
  - 201 `skreiLeft(H)`

## `src/js/core/03h-is.js` (58 linjer)

---------- the sea ice by month (Havsteget H1b R5, V3 A; Jonas 03.11.2026: «iskanten etter måned») ----------

- **1** the sea ice by month (Havsteget H1b R5, V3 A; Jonas 03.11.2026: «iskanten etter måned»)
  - 24 `seaIceMonth(H)`
  - 29 `seaIceCell(A, p)`
  - 35 `seaIceAt(p, H)`
  - 46 `seaIceShut(p, H, V)`
  - 51 `seaIceOnLeg(a, b, H, V)`

## `src/js/core/04-crew.js` (412 linjer)

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
  - 150 `lottParty()`
  - 157 `lottSplit(D)`
  - 161 `payMates()`
  - 166 `weekKr(len)`
  - 167 `lotWeek(c, H = S.t / 60)`
  - 172 `crewAboard(H, all)`
  - 175 `biDaysTxt(c)`
  - 178 `crewBiOff(H)`
  - 180 `crewEff(c, H, hs, g = 'juksa')`
- **187** what lifts or drags a person's effort just now, besides what they can and who they are (Jonas 23.10.2026: «dette skal være dynamisk
  - 193 `crewDrive(c, H, hs)`
  - 214 `crewEffort(c, H, hs)`
- **221** samhold: how the crew aboard pull together (Jonas 23.10.2026: «Samhold ja, men det må gjøres intuitivt»), 0-100 per vessel (S.team,
  - 226 `crewTeam()`
  - 231 `teamHour(H, on, hs, food)`
  - 250 `teamLine()`
  - 258 `teamEff(team, me = true, g = 'juksa')`
  - 260 `compat(a, b)`
  - 273 `crewById(id)`
  - 276 `holdNet()`
  - 285 `crewSettle(c)`
  - 294 `crewQuit(c, why, whyEn)`
  - 297 `borsTick(H)`
  - 305 `crewRumour()`
  - 307 `crewTick(H)`
  - 374 `codRoom(H)`
- **376** the crew fly to and from Svalbard (H1b R7, 05.11.2026; docs/planer/havsteget-h1b-rammen.md V4 B)
  - 390 `flyIn(c)`
  - 399 `flyOut(c)`
  - 407 `flyTick()`

## `src/js/core/05-vessels.js` (1210 linjer)

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
  - 405 `coastMoor(b)`
  - 416 `seaward(p, c)`
  - 418 `coastSpot(gr, dI, i)`
  - 421 `coastCast(b, gr, dI, i, kc, Hc, spot)`
- **435** The coast boats' own gear in the sea (Jonas 02.11.2026: «Garn, liner og annet utstyr skal være synlig og vises i kartplotteren»)
  - 444 `coastGearKind(b)`
  - 450 `coastSet(b, k, pI, i, H)`
  - 459 `coastNear(H, only)`
  - 483 `npcStates(H, only)`
  - 534 `peerName(s)`
  - 549 `peerRouteStr(p, wps, idx)`
  - 559 `peerRoute(s)`
  - 565 `routeWalk(p, R, d, hd0)`
  - 572 `ptPred(q, w, t)`
  - 587 `ptPose(T, now)`
  - 595 `ptTake(q, now)`
  - 609 `peerStates()`
  - 624 `newState()`
  - 635 `log(no, en, k)`
  - 637 `navHour()`
  - 644 `nearestPort(p)`
  - 646 `nearestYard(p)`
  - 648 `step()`
  - 666 `vesselStep(H)`
  - 747 `sailV(H, hs)`
  - 759 `sail(H, W, hs)`
  - 788 `sailWaiting()`
  - 789 `sailReplan(pl, b, gp)`
  - 817 `iceWhy(p, tried)`
  - 819 `sailStop(pl, b, why)`
  - 827 `haltPlan(need)`
  - 837 `arrive(w)`
  - 855 `unstuckWhy()`
  - 861 `unstuckSpot()`
  - 868 `unstuck()`
  - 882 `dock(pid, berth)`
  - 909 `catchFactors(H, W, hs)`
  - 919 `fish(H, W, hs)`
  - 991 `endFishing(why)`
  - 1006 `addCatch(sp, kg, cls, hook, opt)`
- **1020** work on deck: gutting and icing take hands and time
  - 1033 `deckHands()`
  - 1036 `deckPending()`
  - 1037 `deckEta(hands)`
  - 1042 `moveKg(x, kg, patch)`
  - 1050 `iceMinute()`
  - 1052 `deckMinute()`
  - 1070 `risk(W, hs)`
  - 1097 `hullRepair()`
  - 1100 `svcOverdue()`
- **1101** the rescue boat (plan E3, 05.10.2026)
  - 1121 `rescueBases()`
  - 1130 `rescueBase(p)`
  - 1137 `rescueAis(H)`
  - 1141 `rescue(keepCatch)`
  - 1165 `towSea(p)`
  - 1170 `towRoutes(b)`
  - 1181 `towStep(H)`
  - 1193 `towDone(t)`
  - 1199 `towPose(frac)`

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

## `src/js/core/06-services.js` (263 linjer)

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
  - 182 `finishJob(j)`
  - 205 `fitHours(k)`
  - 208 `jobOk(j)`
  - 213 `queueJob(j)`
  - 216 `jobsDone()`
  - 222 `shelterReturn(W, hsOver)`
  - 241 `startReturn(auto, W, home, hsOver, opsKeep)`
- **261** CORE END

## `src/js/core/06b-coastports.js` (140 linjer)

the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan)

- **1** the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan)
- **19** the registration mark (Malerverkstedet, 07.10.2026): the county's letters, a serial number and the municipality's letters,
  - 28 `regLetters(pt)`
  - 34 `regUsed(f, k, n)`
  - 35 `regOf(b)`
  - 115 `plantsNear(p, n = 10)`
- **121** the ocean vessels at the plants (H0 of docs/planer/havsteget.md, 03.11.2026)
  - 128 `portWhy(pt, type)`

## `src/js/core/06c-steder.js` (44 linjer)

the tackle shops and the yards along the coast: the other two places of trade (07.10.2026)

- **1** the tackle shops and the yards along the coast: the other two places of trade (07.10.2026)
  - 32 `portServices(pt, berth)`
  - 40 `placesNear(p, kind, n = 3)`

## `src/js/core/06d-drift.js` (563 linjer)

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
  - 486 `opsLanded(pid, k)`
  - 498 `driftStock()`
  - 499 `opsReport(pid, kg, total, landed)`
- **510** what the plan is doing, in a few words: the page's «Nå» and the company's fleet list ([no, en])
  - 511 `driftNow(o)`
- **530** the trip as a timeline for the page: the one under way from where she is now, or the next one from where it starts.
  - 532 `driftSketch(o)`
- **556** the plan to another vessel of the company: the answers, made again there
  - 557 `driftCopy(vid)`

## `src/js/core/06g-plan2.js` (326 linjer)

Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.

- **1** Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.
  - 20 `p2When(H, H0)`
  - 30 `p2MeRate(pid, anchor)`
  - 41 `p2MeRestH(e, rate)`
  - 46 `p2Units(kind, lk)`
  - 52 `p2Left(o, q)`
  - 54 `p2LineKind(o)`
  - 60 `plan2New(over)`
  - 68 `plan2Ops()`
- **76** the places: a point, a port, or a key ('H' home, 'Q' the home quay, 'M' the plant, 'A' the rest anchorage)
  - 77 `plan2P(o, k)`
  - 86 `plan2LegH(o, a, ap, b, bp, v)`
- **93** the state the day is reckoned from: where she lies, the hold, the gear in the sea and aboard, the crew, you. Tests pass their own
  - 94 `plan2State(o)`
  - 107 `plan2RestOk(pid)`
  - 109 `plan2Ready(kind, st, lk)`
  - 111 `plan2NextDep(o, H, from)`
  - 119 `plan2Watch(H)`
  - 120 `plan2Roles(st)`
- **126** the day. H0: the hour the day begins (the departure). Returns {t0, steps:[{t, k, …}], end, why:[no, en], skipped:[{id, no, en}]}.
  - 129 `planDay(o, H0, st)`
- **241** the day as text: [[clock, no, en], …], one line a step, the skipped places and the reason last
  - 242 `planDayText(o, day)`
- **272** the check: errors keep the plan from being switched on, warnings only inform (as driftCheck; the rhythm's rules from Jonas 26.10.2026)
  - 276 `plan2WatchWhy(st, aboard, short)`
  - 286 `p2Kits()`
  - 287 `plan2Check(o, st)`

## `src/js/core/06h-plan2-engine.js` (423 linjer)

Driftsplan 2, part 2: the engine (26.10.2026, docs/planer/driftsplan-2/02-design.md chapter 2). It follows the day that planDay

- **1** Driftsplan 2, part 2: the engine (26.10.2026, docs/planer/driftsplan-2/02-design.md chapter 2). It follows the day that planDay
  - 8 `plan2Key(o)`
  - 11 `plan2Here(o)`
  - 21 `plan2TideMin()`
  - 22 `plan2LegOk(o, a, ap, b, bp)`
- **29** making the plan: the plant, the anchorages, the legs and the shelter ports. Async; cb(err) when done
  - 30 `plan2Make(o, cb)`
- **71** what the plan says, waits for and stops at
  - 74 `plan2ActWhy(w, why)`
  - 76 `plan2Abort(o)`
  - 77 `plan2Wait(o, k, no, en, until)`
  - 83 `plan2Stop(o, k, no, en, fix)`
  - 93 `plan2Pause(o)`
  - 102 `plan2Start(o)`
  - 107 `plan2Resume(o)`
  - 109 `plan2CrewWhy(o)`
  - 119 `plan2Wx()`
  - 120 `plan2WxAhead(o, H, dur, pts)`
  - 128 `plan2WxWait(o, wx, H)`
  - 135 `plan2WxFirstOk(o, H, dur, pts)`
- **136** shelter without a search (part 3): back the way she came to the last place or port she passed, and from a place the kept leg to its
  - 139 `plan2Shelter(W, hsOver)`
  - 162 `plan2Cut(o, why)`
  - 174 `plan2RulesWhy(o, H, placesOnly)`
  - 181 `plan2RulesOpenAt(o, H)`
- **182** the engine: each minute, on each vessel (06d-drift.js opsStep hands over with DRIFT2 on)
  - 184 `plan2Step(H)`
  - 199 `plan2Decide(o, H)`
  - 227 `plan2MeRest(o, H)`
  - 235 `plan2Boundary(o, H)`
  - 254 `plan2Spent(o, H)`
  - 263 `plan2NewDay(o, H)`
  - 275 `plan2CostDay(o, r)`
  - 278 `plan2Caught(o, tr)`
  - 279 `plan2StatDay(o, d)`
- **280** a trip: the steps from i0 to the next port call, as waypoints on the kept legs
  - 281 `plan2Trip(o, D, i0)`
  - 309 `plan2Go(o, H, i0)`
  - 351 `plan2Sea(o, H)`
  - 371 `plan2Landed(pid, k)`
  - 380 `plan2Report(pid, kg, total, landed)`
  - 392 `plan2Bait(o)`
  - 403 `plan2Egn(o, s)`
  - 410 `plan2WatchTick(H)`

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

## `src/js/core/07f-kar.js` (100 linjer)

the fish tubs (docs/planer/fiskekar-dekk.md, Jonas 04.11.2026)

- **1** the fish tubs (docs/planer/fiskekar-dekk.md, Jonas 04.11.2026)
  - 8 `karN(type, lv)`
  - 10 `karSteps(type)`
  - 15 `tubLoads(hold, n)`
- **29** packing a tub: where each fish lies (Jonas: «fisken gradvis fyller karret opp og ser realistisk ut, uten clipping»)
  - 46 `karIn(dims, y)`
  - 49 `inRR(x, z, hx, hz, r, g)`
  - 52 `fishCorners(x, z, yaw, L, b)`
  - 55 `fishFits(dims, x, y, z, yaw, L, b)`
  - 58 `tubPack(dims, spec, seed)`
  - 91 `karRefund()`

## `src/js/core/07-harbours.js` (491 linjer)

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
  - 194 `clearLine(a, b)`
  - 197 `quayLand(q)`
  - 198 `quayLandLine(a, b)`
  - 199 `approachPath(pt)`
  - 239 `exitWps(pt, to)`
  - 240 `entryWps(pt, from)`
  - 250 `berthPose(pid, type, kind = 'main')`
- **282** the way in to a berth and out of it (the user's list 04.10.2026: «legge til og fra kai uten å gå gjennom landmasse og
  - 287 `berthBlocked(p, m = 2)`
  - 296 `berthClear(a, b, m)`
  - 297 `berthPath(from, bp)`
- **322** landing the catch
  - 334 `landPlan(type, kg, hold)`
  - 344 `landState(L, t)`
  - 353 `mottakOpen(H)`
  - 355 `mottakNext(H)`
  - 357 `mottakWhen(H, no)`
  - 363 `startLanding(ops)`
  - 374 `finishLanding()`
  - 381 `iceChute(kg)`
- **383** the bunker quay: moving along the harbour and filling fuel
  - 393 `quayPos(b)`
  - 404 `portBusy(b)`
  - 405 `startShift(to, after)`
  - 415 `startFueling(ops)`
  - 428 `quayMinute()`
  - 444 `buyIce(kg, free)`
- **454** the tackle shop on the quay, in every harbour: hand jig, ice and halibut gear
  - 460 `shopBuy(k, kg, free)`

## `src/js/core/07c-naust.js` (168 linjer)

Father's naust by the home harbour, and the shop on the Finnsnes quay: where the 3D view sets them (05.10.2026)

- **1** Father's naust by the home harbour, and the shop on the Finnsnes quay: where the 3D view sets them (05.10.2026)
  - 17 `shoreSpot(cx, cz, r0, r1, o)`
  - 50 `naustClash(x, z, ux, uz, nx, nz, withBld)`
  - 68 `naustVecOk(cx, cz)`
  - 75 `naustFind(pid)`
  - 91 `naustSite()`
  - 103 `naustFace(pid)`
  - 113 `shopNearFind(n)`
  - 119 `shopNear()`
  - 127 `naustTarget(pt, r)`
  - 133 `shopSite()`
- **137** the naust as a home (05.10.2026; Jonas chose it from the list, 4): set it to rights step by step
  - 152 `naustRest(b)`
  - 154 `naustWhy(k)`
  - 162 `naustBuy(k)`

## `src/js/core/07d-rorbu.js` (82 linjer)

the rorbuer along the coast: a cheap bed ashore and a quay to lie at (05.10.2026)

- **1** the rorbuer along the coast: a cheap bed ashore and a quay to lie at (05.10.2026)
  - 24 `rorbuIn(x0, y0, x1, y1)`
  - 33 `rorbuSite(R)`
  - 55 `rorbuFace(pid)`
  - 61 `rorbuTarget(pt, r)`
  - 74 `rorbuSoon(p, r)`

## `src/js/core/07e-havn.js` (267 linjer)

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
  - 170 `havnMoor(h)`
  - 173 `havnPlaceOf(H, b, type)`
  - 183 `havnPrune(keep)`
  - 190 `havnFace(pid)`
  - 192 `havnFind(p, r, type)`
  - 198 `havnTapNear(pt, r)`
  - 203 `havnOptions(p, r, type)`
- **208** held: the berth is the vessel's while she lies there, or while it is her plan's home (06d-drift.js o.home)
  - 209 `havnHold(id)`
  - 213 `havnFree(id)`
  - 221 `havnMinute()`
  - 229 `havnBlocked(x, z, r)`
- **234** the server (D: «Serveren holder rede på hvem som ligger hvor»): what the others hold in a harbour, asked at most every two minutes;
  - 237 `havnCloud()`
  - 238 `havnAsk(hid)`
  - 247 `havnPut(id, s)`
  - 255 `havnRenew()`
  - 256 `havnDrop(id)`
  - 257 `havnMoved(id)`

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

## `src/js/core/09d-folk.js` (157 linjer)

the people on the quay (05.10.2026; Jonas chose it from the list of what makes people play on, 7)

- **1** the people on the quay (05.10.2026; Jonas chose it from the list of what makes people play on, 7)
  - 25 `folkState()`
  - 37 `folkPf(id)`
  - 39 `folkSold(id, kg)`
- **47** the plant's hands comment on the landing (Jonas 08.10.2026: «arbeiderne på fiskemottakene kommenterer fangsten vår med tekst over
  - 106 `plantLine(pt, ls, rnd)`
  - 124 `plantSay(pt, ls)`
  - 134 `folkShop()`
  - 141 `folkPort(H)`

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

## `src/js/core/09f-merker.js` (214 linjer)

Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)

- **1** Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)
  - 22 `achVisits()`
  - 23 `achVisitPort(pid)`
  - 86 `achState()`
  - 102 `achAdd(k, n)`
  - 103 `achSale(total, sps)`
  - 104 `achCatch(sp, cls)`
  - 106 `achMinute()`
  - 116 `achTripEnd(bad)`
- **118** the gifts: what fits the player now, in three tiers (seven in ten common, two good, one rare), bigger in later chapters
  - 120 `achPool(scale)`
  - 144 `achDraw(key, scale)`
  - 152 `achGive(key, scale, title)`
- **161** checking: each milestone in an open chapter, the chapters' own rewards, and the long badges
  - 163 `achCheck(quiet)`
  - 191 `achChapter(ch)`
  - 201 `achSeed()`
- **212** the first tow and the first repair are free (core/05-vessels.js rescue, hullRepair)
  - 213 `freeFirst(k)`

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

## `src/js/core/09j-kystvakt.js` (102 linjer)

Kystvakta: the inspection at the quay or on the field (Oppdrag 2 V1, 30.10.2026; docs/planer/oppdrag-2.md, docs/systemer/kvoter-og-regler.md 5.30)

- **1** Kystvakta: the inspection at the quay or on the field (Oppdrag 2 V1, 30.10.2026; docs/planer/oppdrag-2.md, docs/systemer/kvoter-og-regler.md 5.30)
  - 10 `kvState()`
  - 13 `kvReady()`
  - 23 `kvHour()`
  - 29 `kvArrive()`
  - 36 `kvSide(b)`
  - 37 `kvMinute()`
  - 43 `kvNpcs()`
  - 46 `kvSums(sets, inside)`
  - 48 `kvMostSp(sets)`
  - 53 `kvCheck(b)`
  - 75 `kvWhat(r)`
  - 85 `kvFinish()`

## `src/js/core/10-gear.js` (725 linjer)

passive gear: nets, line and pots that stand in the sea while the boat is away

- **1** passive gear: nets, line and pots that stand in the sea while the boat is away
  - 54 `kingArea(p)`
  - 60 `newPGear()`
- **61** bait (the user's list 04.10.2026): five kinds, each good for its own. Krabbe is the cheapest and fair on everything; reke is for
  - 81 `jigTake(sp, H, tackle)`
  - 86 `baitMixF(w, sp)`
  - 88 `baitOf(pg)`
  - 90 `btOf(L0)`
  - 92 `baitPick(pg, kg)`
  - 94 `baitFromHold(sp, kg)`
  - 106 `setLog(s, no, en, k)`
  - 107 `mySets(vid)`
  - 108 `hasHauler(kind)`
- **110** the rig: a boat is rigged for one kind of fishing at a time. Jigging needs a hand jig or reels; line and pots
  - 116 `rigGuess()`
  - 121 `rigOf()`
  - 130 `gearReserve()`
  - 134 `rigHas(r)`
  - 137 `rigWrong(kind)`
  - 139 `haulerNoFit(kind)`
  - 146 `rigBlock(r)`
  - 157 `rigSet(r)`
- **159** what the vessel owns: aboard, ashore (baiting, mending) and in the sea
  - 160 `ownedUnits(kind)`
  - 167 `gearRoom(kind)`
- **169** buying (in port)
  - 172 `buyGate(what, spec)`
  - 185 `buyGear(what, spec, n)`
  - 215 `joinNets(id1, id2)`
  - 216 `splitNets(id, n)`
- **218** rules for setting at a place
  - 220 `segDist(p, a, b)`
  - 221 `nearSet(p, km)`
  - 222 `gearRules(kind, spec, p)`
  - 250 `setGeom(p, hdg, km)`
  - 257 `setGeomExact(p, hdg, km)`
- **259** the work at sea: status stays 'fishing' with b.gop, so deck work, rest rules, auto-return and the tub pause work as before
  - 260 `gopUnitMin(g, H, hs)`
  - 274 `startSet(kind, spec, fishAfter, hdg)`
  - 295 `startHaul(sid, reset, fishAfter)`
  - 314 `endLines(op, kind, d)`
  - 317 `thiefOf(s)`
  - 327 `haulSlow(g)`
  - 332 `gearOpMinute(H, W, hs)`
  - 353 `finishSet(g, H)`
  - 363 `gopEnd(g)`
  - 368 `gopDone()`
  - 372 `gopAbort(why)`
  - 390 `gearBack(s, n, cond, W)`
  - 397 `wearNets(s, g)`
  - 406 `haulUnit(g, H, SL)`
  - 423 `landFish(sp, kg, key, mesh, p, H, hook, fresh, g)`
  - 437 `netLen(w)`
  - 438 `retain(sp, key, mesh, w)`
  - 444 `sampleSel(sp, key, mesh, p, H)`
  - 447 `landCrabs(g, n, kg)`
  - 458 `finishHaul(g, H)`
- **492** a station on a route or the standing plan: haul what stands here and set it again, or set new gear if nothing stands here.
  - 495 `cycleSpec(kind, want, n)`
  - 508 `gearCycle(w, fishAfter)`
  - 524 `opsGearNeeds(o)`
  - 534 `opsGearAfter()`
- **540** in the sea, every hour: catch, losses, weather and deadlines (company level)
  - 541 `soakHour(s, H)`
  - 569 `gearHour(H)`
  - 600 `reportLost(sid)`
  - 608 `netMended(l)`
- **609** in port: baiting at the shed or by the crew, mending by the crew or at the net loft in Finnsnes
  - 615 `egnOrder(lk, n, bait)`
  - 629 `egnHands()`
  - 638 `egnSelf(lk, n, bait)`
  - 659 `stripSelf(lk, bait, n, then)`
  - 673 `mendSelf(nid)`
  - 684 `botOrder(nid)`
  - 695 `gearJob(j)`
  - 707 `gearJobCancel(j)`
  - 714 `shoreTick()`

## `src/js/core/10b-gearcare.js` (244 linjer)

gear care: wear, mending, hooks, jig tackle, and the tackle shop's service and buy-back (Jonas 08.10.2026)

- **1** gear care: wear, mending, hooks, jig tackle, and the tackle shop's service and buy-back (Jonas 08.10.2026)
  - 22 `careInit(pg)`
  - 34 `careHands(g)`
- **36** the catch factors of worn gear
  - 39 `jigKind()`
  - 40 `jigQ()`
  - 41 `jigWear()`
- **43** wear in one haul (what the string looks like when it comes back): used by finishHaul and a stopped haul
  - 44 `wearOf(s, g)`
  - 58 `careBack(s, n, W)`
- **67** buying (the tackle shop): hooks in packs and spare jig sets
  - 68 `careBuy(what, spec, n)`
- **85** the crew's work in port (and the shop's, in half the time for a fee): hooks, line, pots, jig tackle, nets
  - 86 `hooksNeed(lk)`
  - 91 `seaWork()`
  - 95 `careWhy()`
  - 96 `careShopWhy()`
  - 99 `careQuote(what, key, shop)`
  - 112 `careGate(shop)`
  - 114 `careQueue(j, fee)`
  - 115 `hooksJob(lk, shop)`
  - 125 `lineFix(lk, shop)`
  - 133 `potFix(shop)`
  - 142 `netShop(nid)`
  - 152 `jigJob(k)`
  - 160 `jigChoose(k)`
  - 162 `careJobDone(j)`
  - 171 `careJobCancel(j)`
- **179** the shop buys gear back: a quarter of the new price times the condition (never above it)
  - 180 `sellValue(what, key, n)`
  - 191 `sellGear(what, key, n)`
- **205** upkeep by the crew when the boat lies in port with nothing else to do: once an hour, one job at a time, from what is in the store
  - 207 `careTick()`
- **229** what the crew says about the gear (Jonas 09.10.2026: «Tidvis kan mannskapet komme med kommentarer tilknyttet dette som feks å kommentere
  - 232 `gearTalk()`

## `src/js/core/10c-pick.js` (61 linjer)

Bestilt til henting (M2 in docs/planer/butikker-og-sponsorer.md, 10.2b, V12 A; Jonas 30.10.2026)

- **1** Bestilt til henting (M2 in docs/planer/butikker-og-sponsorer.md, 10.2b, V12 A; Jonas 30.10.2026)
  - 11 `pickState()`
  - 13 `pickKr(o)`
  - 28 `pickName(o)`
  - 45 `pickAdd(port, w, k, s, n)`
  - 58 `pickDrop(id)`

## `src/js/core/09k-market.js` (173 linjer)

Bruktmarkedet (M4 in docs/planer/butikker-og-sponsorer.md, 3.3, 10.2, 10.2b; V3 A, V9 A, V10 A, V11 A; Jonas 30.10.2026)

- **1** Bruktmarkedet (M4 in docs/planer/butikker-og-sponsorer.md, 3.3, 10.2, 10.2b; V3 A, V9 A, V10 A, V11 A; Jonas 30.10.2026)
  - 21 `mktRnd(key)`
  - 22 `mktState()`
  - 26 `mktFair(k, y, c, ex)`
  - 30 `mktMake(w, i)`
  - 54 `mktAll(H)`
  - 60 `mktListings(H)`
  - 62 `mktSold(H)`
  - 63 `mktById(id, H)`
  - 66 `mktAsk(L, H)`
  - 69 `mktPrice(L, H)`
  - 76 `mktBid(id, kr)`
  - 88 `mktTakstSays(L)`
  - 90 `mktWishHits(H)`
  - 93 `mktTakeOver(L, b, eq)`
- **98** your own boat at the broker (commission, 3.3 «Legg ut til salgs»): listed from anywhere at her market value; she must lie in port
  - 103 `mktOwnValue(v)`
  - 108 `mktOwn(vid)`
  - 110 `mktOwnWhy(v)`
  - 111 `mktListOwn(vid)`
  - 115 `mktUnlist(vid)`
- **116** delivery (10.2b «Få henne levert»): a skipper from the yard sails a boat of yours that nobody is aboard to the port you choose, for
  - 119 `mktDelWhy(v, to)`
  - 120 `mktDeliver(vid, to)`
  - 126 `mktHour(H)`
- **142** the boat you traded in (M5, B2): she lies at the yard and is bought by a fisherman, who puts her out again a week or two later at
  - 144 `mktTradeIn(type, engH, port, old)`
  - 145 `mktTiListing(r)`
  - 158 `mktBrokerListings(H)`
  - 172 `mktEvery(H)`

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

## `src/js/core/11-route.js` (626 linjer)

---------- Autonav (once «Følg leia»): a route along the fairway ----------

- **1** Autonav (once «Følg leia»): a route along the fairway
  - 34 `leiaTideCredit(a, b)`
  - 47 `leiaIceSet(a, b)`
  - 55 `leiaIceLeg(p, q)`
  - 69 `legLandIn(p, q, L, s0, s1)`
  - 73 `legNearPt(pt, z)`
  - 85 `legRunsWalk(W, ms)`
  - 93 `legRunsW(p, q, z)`
  - 95 `legRuns(p, q, z)`
  - 101 `legRunsAsync(p, q, z)`
  - 107 `legIdx(runs, L, n, last)`
  - 117 `leiaGrid(x0, y0, x1, y1, c, mask)`
  - 124 `leiaRocks(G)`
  - 133 `leiaShore(G, p)`
  - 143 `leiaCost(G, v, sd)`
  - 161 `leiaNearCell(G, p, sd, km = 1, free)`
  - 168 `leiaHeap()`
  - 176 `leiaSlice(st, t0, at)`
  - 179 `leiaSearch(G, s, t, sd, st)`
  - 210 `leiaFind(from, to, sd, st)`
  - 224 `leiaFind1(from, to, sd, st, pad, c0)`
  - 277 `leiaCorridor(pp, R, c, sd, st)`
  - 293 `leiaCorridor1(pp, bb, R, c, sd, st, first, last)`
  - 312 `leiaLegOk(p, q, sd, margin)`
  - 335 `leiaLegOkL(p, q, sd, margin, tick)`
  - 343 `leiaLegFail(p, q, tick, endP, endQ, strict)`
  - 360 `rockOnLeg(a, b, r)`
  - 369 `leiaMend(P, sd, st, strict)`
  - 410 `leiaStraighten(P, sd, margin, st)`
  - 438 `leiaPull(P, sd, st)`
  - 464 `leiaRoute(a, b, aPort, bPort, opt)`
  - 483 `leiaLane(p, goal, km)`
  - 514 `leiaPocket(p, sd)`
  - 531 `leiaPocketOut(e, sd, st)`
  - 541 `leiaRoute0(a, b, aPort, bPort, pocket, opt0)`

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

## `src/js/core/11c-leinett.js` (147 linjer)

---------- The fairway network (step 2 of the coast-wide Autonav, 08.10.2026) ----------

- **1** The fairway network (step 2 of the coast-wide Autonav, 08.10.2026)
  - 26 `lnetNear(p, km, max)`
  - 32 `lnetAhead(p, q, km, max, skip)`
  - 38 `lnetPath(srcs, dsts)`
  - 53 `lnetLoad(P)`
  - 64 `lnetAccess(p, i, sd, st, straight)`
  - 84 `lnetDists(srcs)`
  - 90 `lnetExit(A, end, sd, st)`
  - 109 `lnetRoute(from, to, sd, st)`

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

## `src/js/core/13-work.js` (343 linjer)

work aboard: stations, and how the crew share them

- **1** work aboard: stations, and how the crew share them
  - 44 `catchGut()`
  - 45 `catchIce()`
- **46** the mate (Jonas 23.10.2026: «vi må kunne definere 1 fra mannskapet til å være styrmann ombord»): one of the crew, the same one
  - 49 `setMate(id)`
- **52** the skipper (Jonas 23.10.2026: «når jeg/brukeren ikke er ombord må det utnevnes en skipper og en styrmann ombord»): one of the crew,
  - 55 `setSkipper(id)`
- **58** what a person is used to: minutes at each station (c.hab), fading by a fifth a month. The station with most of them, once it is
  - 61 `crewRole(c)`
  - 63 `habSeed(c)`
- **64** how good a person is at a station's work (1-5): you are a skipper who knows every job on deck
  - 65 `stSkill(c, k, ctx, sk)`
  - 82 `workScore(p, k, ctx, need, sk)`
  - 94 `restScore(p)`
  - 105 `workWhy(p, k, ctx, sk)`
  - 116 `stPlaces(st, ctx)`
  - 126 `workCtx(as)`
- **137** the crew's own jobs as stations: where they may be worked (in port, or at sea while she goes or lies still: seaWork), how many can
  - 139 `jobsOpen(as)`
  - 140 `jobPlaces(j)`
  - 151 `jobCoop(j, n)`
  - 155 `jobW(j)`
  - 161 `jobRate(j, A)`
  - 168 `jobMinute(j, A)`
  - 178 `jobWait(j)`
  - 183 `workAssign(as)`
- **250** what a person does on a break (Jonas 23.10.2026: «La det også stå hva de gjør når de ikke har en aktiv arbeidsoppgave som feks: lener
  - 266 `crewVice(c)`
  - 268 `idleEnv()`
  - 276 `idleWeights(p, ctx, E, mates)`
  - 298 `idleAssign(P, ctx)`
  - 312 `idleText(p)`
  - 318 `workDoing(p)`
  - 323 `workTeam(st, g, as)`
  - 329 `workMinute()`

## `src/js/core/14-crewlife.js` (380 linjer)

life aboard: learning, meals, the rest rule and what the crew says

- **1** life aboard: learning, meals, the rest rule and what the crew says
- **3** learning: an hour on a station trains that skill. The young, the eager and the content learn fastest, and it gets
  - 6 `ageLearn(a)`
  - 13 `stationSkill(st)`
  - 26 `learnHour(c)`
- **36** meals: one every 6 hours at sea, cooked in 30 minutes by whoever stands at Kokk; the dish is as good as the cook.
  - 41 `mealState()`
  - 42 `foodScore()`
  - 43 `mealDue()`
  - 45 `mealMinute(A)`
  - 59 `serveMeal(q, cook, me, dish)`
- **71** what the crew says: lines driven by the situation and by each person's ways. [no, en, trait the line suits]
  - 188 `dialectAt(p)`
  - 189 `dialectOf(c)`
  - 193 `dialectText(key, text)`
  - 197 `crewDialect(c, text)`
  - 200 `crewSay(c, sit, vars)`
  - 218 `vitalsTalk(on)`
  - 228 `sayHour(H, on, hs)`
- **248** advice from those who know (Jonas 23.10.2026: «de kan gjerne ta initiativ og komme med kommentarer knyttet til driften om de vet
  - 252 `crewAdvice(H, on, W, fs)`
  - 266 `adviceGround(H)`
- **279** mistakes on deck (Jonas 23.10.2026: «Ja, det kan de godt gjøre. Det skaper realisme»): now and then a fish slips over the side, the
  - 283 `crewRand()`
  - 284 `crewSlip(team)`
- **301** Del 2 of «mannskap med liv» (docs/mannskap-plan.md; Jonas 17.10.2026): each person's life beside the work
  - 307 `crewLife(c)`
  - 318 `lifeStory(c, no, en)`
  - 320 `lifeEarn(c, sum)`
  - 322 `lifeOff(c, days, no, en, sno, sen)`
  - 324 `lifeDay(c, H)`
  - 340 `lifeInjury(c, hs)`
  - 343 `lifeOffTick(c)`
  - 346 `lifeDepart(c)`
  - 357 `alumniGround(a)`
  - 359 `alumniStates(H)`
  - 366 `lifeHail(H)`
  - 373 `alumniReturn(B)`

## `src/js/core/15-energy.js` (160 linjer)

your own energy: a day at sea empties it, a night ashore fills it

- **1** your own energy: a day at sea empties it, a night ashore fills it
  - 14 `alarmAck()`
  - 39 `restRate(b)`
  - 45 `restStart()`
  - 59 `restEnd(quiet)`
  - 65 `restMinute()`
- **77** Skippertak (Jonas 12.10.2026): an energy drink, for real money only (never for the game's kroner), in three sizes
  - 90 `fleetCrews()`
  - 91 `giveSkip(k)`
  - 102 `energyMinute()`
  - 124 `fallAsleep(v, doze)`
  - 135 `wakeUp()`
  - 141 `wakeEarly(back)`
  - 153 `sleepDrift(H)`

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

## `src/js/core/16b-dyn.js` (574 linjer)

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
  - 117 `dynCal(key)`
  - 141 `dynStopDist(cal, v)`
  - 145 `dynVStop(cal, d)`
- **146** the wind and the sea on her this tick (Fysikk 2)
  - 159 `dynEnv(b, d, cal, H, dtG = 0)`
- **186** contact: the hull against the piers, the breakwaters and the harbour units' quays (Fysikk 2)
  - 195 `dynObsNear(X, Y, R)`
  - 202 `dynInside(O, x, z)`
  - 213 `dynContact(b, d, P, O)`
- **239** with no way on: she drifts (Fysikk 2)
  - 245 `dynDrift(type, p, H)`
  - 267 `gearBuoyNear(p)`
  - 269 `gearLieCrew()`
  - 271 `gearWatch(b)`
  - 279 `lieDrift(H)`
- **318** the state, in step with the boat the rest of the game reads
  - 319 `dynState(b)`
  - 330 `dynWrite(b, d)`
  - 335 `dynCan()`
  - 340 `dynLive()`
  - 345 `dynPose()`
  - 352 `dynRest()`
  - 353 `dynLivePose(frac)`
  - 355 `dynHaltNeed()`
- **356** the tick
  - 357 `dynTick(dt)`
  - 370 `dynMinute(H, W)`
- **377** by hand (16-helm.js): the throttle and the rudder into the model
  - 378 `dynHelm(d, dtG)`
- **399** the line she follows: out from the quay, the route's waypoints as the chart plotter draws them, to the harbour she ends in
  - 401 `dynLineBuild(pl, dep)`
  - 421 `dynLineAt(T, s)`
  - 427 `dynSeg(T, s)`
  - 428 `dynSegHd(T, i)`
  - 429 `dynLineProj(T, x, z, s0, back = 30)`
  - 439 `dynLineHd(T, s, r0)`
  - 446 `dynGroundAhead(T, s, look)`
- **455** the autopilot
  - 456 `dynAuto(d, dtG)`
  - 573 `dynTrackView()`

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

## `src/js/ui/01-i18n.js` (116 linjer)

the logo (src/brand/logo.svg, the user's anchor of 03.11.2026), filled with currentColor: the sign-in's gate (ui/10f-cloud.js) and the

- **4** i18n
  - 113 `t(k, ...a)`

## `src/js/ui/02-format-state.js` (223 linjer)

---------- formatting ----------

- **1** formatting
  - 3 `dayKey(d)`
  - 4 `dayNum(k)`
  - 5 `fmt(n, d = 0)`
  - 6 `kr(n)`
  - 13 `cashFx(delta)`
  - 36 `realMin(gameMin)`
  - 37 `realDur(gameMin)`
  - 45 `inReal(gameMin)`
  - 47 `gameDur(gameMin)`
  - 50 `durBoth(gameMin)`
  - 52 `whenTxt(T)`
  - 53 `dur(h)`
  - 57 `hm(H)`
  - 58 `dayStr(H)`
  - 59 `clockStr(H)`
  - 60 `coordStr(p)`
  - 66 `dirName(deg)`
- **69** persistence
  - 81 `tabMark()`
  - 82 `tabMine()`
  - 88 `tabLose()`
  - 104 `saveJson(o)`
  - 122 `save()`
  - 125 `saveStoreKb()`
  - 128 `migrateV2(o)`
  - 140 `load()`
- **160** UI state
  - 171 `booting()`
  - 172 `loaderGone()`
  - 181 `toastPlace(el)`
  - 187 `toastClear()`
  - 188 `toast(msg, ms)`
  - 201 `saveCode()`
  - 209 `codeRead(code)`
  - 217 `loadCode(code)`

## `src/js/ui/03a-chart.js` (157 linjer)

THE CHART'S VECTORS (phase K7 of the coast plan): the coast by level of detail, the graticule and the place names

- **1** THE CHART'S VECTORS (phase K7 of the coast plan): the coast by level of detail, the graticule and the place names
  - 12 `vReader(b)`
  - 21 `vecPath(v, sc, tol, keep)`
  - 41 `chartPath0(px, out)`
  - 48 `vecPathsIn(v, sc, r)`
  - 60 `chartPathsIn(pk, r)`
  - 61 `chartPath(pk, lv, px)`
  - 64 `chartCoast(ctx, x0, y0, kx, ky, W, H, dpr, fish)`
  - 93 `fmtDM(v, pos, neg)`
  - 97 `chartGrid(ctx, x0, y0, kx, ky, W, H, dpr, fish)`
- **118** the place names
  - 121 `chartNamesOf(pk, entry, sc, ox, oy)`
  - 134 `chartNamesSvg(vx0, vy0, vx1, vy1, u, taken, part)`

## `src/js/ui/03-map.js` (787 linjer)

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
  - 261 `chartRaster(d, PW, PH, x0, y0, pkx, pky, V, st)`
  - 348 `scheduleChart()`
  - 351 `renderBase()`
  - 365 `updateMapButtons()`
  - 377 `tapName(mp, rr)`
  - 382 `renderStatic()`
  - 483 `portIcon(p, s, u)`
  - 504 `anchorPath(x, y, s, u)`
  - 512 `soundingsSvg(vx0, vy0, vx1, vy1, u, taken)`
  - 531 `scheduleStatic()`
  - 536 `aisTrack(id, H)`
  - 541 `aisInfo(n)`
  - 555 `renderAisCard()`
  - 556 `renderDyn()`
  - 640 `pinAdd(mp)`
  - 645 `pinOpen(id, fresh)`
  - 665 `pinKb()`
  - 696 `ptrUp(e)`
  - 726 `unzoom()`
  - 733 `portByLabel(pt)`
  - 738 `addWaypoint(pt)`

## `src/js/ui/03b-route.js` (221 linjer)

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
  - 56 `routePlayMode()`
  - 64 `routePause()`
  - 70 `routePlay()`
  - 75 `routeUndoRedo(redo)`
- **77** moving a point with a finger, and inserting one on a leg with its «+» handle
  - 82 `legEnds(i)`
  - 84 `insHandles()`
  - 89 `routeGrab(mp)`
  - 100 `routeDragMove(g, mp)`
  - 105 `routeDragCancel(g)`
  - 106 `routeDragEnd(g)`
  - 118 `routeFocus(i)`
  - 124 `mapToClient(p)`
- **126** «Autonav» (the button in the chart plotter, and the dock's Auto-nav): the next tap on the chart is where to go, and the route
  - 129 `leiaArm(on)`
  - 135 `leiaTo(pt, buoy, act)`
  - 190 `deepNear(p, maxKm)`
  - 200 `leiaStops()`
  - 205 `leiaCompare()`

## `src/js/ui/03g-planmap.js` (117 linjer)

Driftsplan 2, part 6: the chart plotter in plan mode (docs/planer/driftsplan-2/02-design.md 4.2). «Velg i kartet …» on the

- **1** Driftsplan 2, part 6: the chart plotter in plan mode (docs/planer/driftsplan-2/02-design.md 4.2). «Velg i kartet …» on the
- **85** the chart: a tap adds a place or opens a pin's card; a pin dragged moves (03-map.js pointer handlers)

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

## `src/js/ui/03e-miniplot.js` (100 linjer)

---------- the little chart in 3D (the user's wish 02.10.2026) ----------

- **1** the little chart in 3D (the user's wish 02.10.2026)
  - 11 `miniRadius()`
  - 14 `miniBg(c, R, k, W, H, dpr)`
  - 44 `miniSoundings(g, x0, y0, k, BW, BH, dpr, night)`
  - 58 `miniPaint()`

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

## `src/js/ui/04-panels-instruments.js` (214 linjer)

---------- estimates ----------

- **1** estimates
  - 2 `estimate()`
- **11** panels
  - 13 `renderTabs()`
  - 16 `setTab(k)`
  - 19 `statusText()`
  - 33 `nextEvent()`
  - 51 `setHtml(el, h)`
  - 53 `renderHud()`
  - 109 `liveFrac()`
  - 110 `livePose(frac)`
  - 133 `vnoise2(x, y, s)`
  - 139 `microBottom(p, d)`
- **141** instruments: GPS and echo sounder
  - 203 `hudClasses()`
  - 209 `hudFold(which)`

## `src/js/ui/05-tattoo-art.js` (169 linjer)

---------- sailors' tattoos: the flash and the seated sailor they go on ----------

- **1** sailors' tattoos: the flash and the seated sailor they go on

## `src/js/ui/05a-itemcard.js` (117 linjer)

The item card (M1 in docs/planer/butikker-og-sponsorer.md, 30.10.2026)

- **1** The item card (M1 in docs/planer/butikker-og-sponsorer.md, 30.10.2026)
- **7** the pictures: 64 × 40, a light sea line under the things that float or stand on deck
- **63** what each thing does, in numbers from the code ([no, en]); the long story is in the Håndboka (ITEM_HB)
  - 105 `itemCard(o)`

## `src/js/ui/phone/00-shell.js` (60 linjer)

---------- the phone ----------

- **1** the phone
  - 59 `setBadge()`

## `src/js/ui/phone/01-haill-fiske-service.js` (112 linjer)

--- workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port

- **1** workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port
  - 2 `haill()`
- **23** the tackle shop on the quay: a purchase takes two taps, the second one confirms the price
  - 30 `fiske()`
  - 43 `service()`
  - 64 `iceCard()`
  - 72 `verksted()`

## `src/js/ui/phone/02-havn-last-agn-ordre.js` (49 linjer)

the old tabs live on as phone apps

  - 2 `havn()`
  - 3 `last()`
- **4** the pages of the dock's drawer (ui/10c-dock.js): the market, the village and the yard in port, the inventory everywhere
  - 5 `lever()`
  - 6 `isApp()`
  - 8 `agn()`
  - 32 `oppdrag()`
  - 33 `ordl()`
  - 38 `ordlBest(tabs)`

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

## `src/js/ui/phone/05-rigg-innst-admin.js` (80 linjer)

the rig: one kind of fishing at a time, changed here aboard (under Beholdning) when none of the boat's gear is in the sea

  - 2 `rigg()`
  - 13 `beholdning()`
  - 22 `logg()`
  - 23 `innst()`
  - 61 `admin()`

## `src/js/ui/phone/06-render.js` (65 linjer)

  - 1 `show(on, a)`
  - 2 `status()`
  - 8 `tickHome()`
  - 14 `render()`
  - 18 `shell(a)`
  - 20 `page(a)`
  - 21 `dact(cur, a, d)`
- **27** Trim: more speed for the boat you are aboard for a while (core BOOSTS; Jonas 05.10.2026: sold for real money, the time in game
  - 32 `trim()`
- **46** Skippertak (core/15-energy.js SKIP): an energy drink for real money only, for you and the crews of the whole fleet
  - 50 `skipApp()`

## `src/js/ui/phone/07-patch.js` (1103 linjer)

--- the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened

- **1** the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened
  - 1096 `patch()`

## `src/js/ui/phone/08-home-papers-merker.js` (112 linjer)

  - 1 `home()`
  - 12 `nowCards(na)`
  - 32 `nearHint(kind)`
- **36** the seaman's life: the tattoos you have earned, and the old ways at sea you have heard of
  - 37 `tattoos()`
  - 55 `papBladB()`
  - 60 `papPermit()`
  - 66 `papZlic()`
  - 71 `papKv()`
  - 77 `papBiz()`
  - 83 `fsChip()`
  - 85 `fsCard()`
  - 92 `merker()`
  - 104 `lore()`

## `src/js/ui/phone/09-vaer-post-salg-redning.js` (144 linjer)

--- weather

- **1** weather
  - 2 `sunTimesOld(H)`
  - 3 `vaer()`
- **26** newspaper
  - 28 `post()`
- **34** sales organisation
  - 38 `salg(s)`
- **125** rescue
  - 126 `redning()`
- **143** vessels: my vessel overview and the market

## `src/js/ui/phone/10-fartoy.js` (155 linjer)

  - 10 `goals()`
  - 25 `goalsCard()`
- **30** the boat market: tabs for the open group, boats with a closed-group right, the coastal fleet over 11 m and the ocean fleet;
  - 39 `mkCard(k, O)`
  - 43 `market()`
  - 69 `specSecs(k, O)`
  - 93 `sheet(k, O)`
  - 134 `fartoy(tab0)`
- **154** the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)

## `src/js/ui/phone/11-rederi.js` (70 linjer)

  - 6 `selRow()`
  - 8 `vSummary()`
  - 32 `rederi()`
- **69** equipment

## `src/js/ui/phone/12-utstyr-redskap.js` (184 linjer)

the yard's upgrades (hold, engine, the antifouling coat and the outboard) or the shop's (electronics, haulers, the jigging machine and the clothes)

  - 2 `utstyr(mode)`
- **52** gear: in the sea, aboard (baiting and mending), and the shop
- **53** gear care (core/10b-gearcare.js): the condition of the gear aboard, and what the crew can do about it in port
- **58** a line kind as it stands (Jonas 20.10.2026, tilbakemelding #74: «hva båten har slags fiskeredskaper ombord og hva disse eventuelt er
  - 62 `lineCard(lk, o)`
  - 87 `egnChooser(lk, o)`
  - 111 `careAboard(inPort, p)`
  - 135 `redskap(tab0)`

## `src/js/ui/phone/13-mannskap-bank-meld.js` (177 linjer)

--- crew

- **1** crew
  - 4 `candidates()`
- **5** the crew, person by person
  - 9 `traitChips(c, all)`
  - 11 `lifeHtml(c)`
  - 16 `personCard(c, cand)`
  - 23 `bors()`
  - 38 `mannskap()`
- **63** bank (Økonomi 2, Ø1): two tabs, the accounts with the statement, and the year's accounts (core/03-simulation.js book, ACCT)
  - 70 `ledger()`
  - 81 `accounts()`
  - 104 `bank()`
- **154** messages
  - 155 `meld()`
- **162** actions
  - 165 `switchVessel(k)`

## `src/js/ui/phone/13b-nettet.js` (136 linjer)

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
  - 74 `clothBuy(k)`
  - 81 `pickTake(o)`
- **93** the Net: the bookmarks, and the web shop
  - 95 `nett()`
  - 107 `netShop()`

## `src/js/ui/phone/13c-megler.js` (156 linjer)

Kystmegleren: the used boats in the Net app and at the yard's quay (M4, docs/planer/butikker-og-sponsorer.md 3.3, 10.2, 10.2b)

- **1** Kystmegleren: the used boats in the Net app and at the yard's quay (M4, docs/planer/butikker-og-sponsorer.md 3.3, 10.2, 10.2b)
  - 9 `mgSays(Q)`
  - 30 `mgCard(Q)`
  - 37 `mgGoal(Q)`
  - 41 `mgOwnRow(v)`
  - 51 `megler()`
  - 69 `mgWishCard()`
  - 78 `mgSheet(Q)`
  - 115 `mgHere()`
  - 122 `mgAct(a, d)`

## `src/js/ui/phone/14-act.js` (284 linjer)

  - 2 `act(a, d)`
  - 8 `act0(a, d)`

## `src/js/ui/05b-work.js` (137 linjer)

the Mannskap page in the drawer (once «Arbeid»): the samhold on top, «På dekk nå» as chips of who stands where, and one card per

- **1** the Mannskap page in the drawer (once «Arbeid»): the samhold on top, «På dekk nå» as chips of who stands where, and one card per
- **31** «På dekk nå» (Jonas 23.10.2026: brikker): who stands where, nothing to tap, and in one line what waits on deck
  - 111 `energyUi()`

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

## `src/js/ui/05d-plan2.js` (356 linjer)

Driftsplan 2, part 5: the page (docs/planer/driftsplan-2/02-design.md 4.1). The day first («I dag» with where she is now, or the

- **1** Driftsplan 2, part 5: the page (docs/planer/driftsplan-2/02-design.md 4.1). The day first («I dag» with where she is now, or the
- **26** Nå: the step she is on and when it ends, what she waits for and until when, or why she stopped
- **49** the day: today's as the engine follows it (with «← nå»), or the next as planDay reckons it from the answers
- **78** Hjem (GUI review U14 A, 05.11.2026): the naust first, then the rorbuer nearest the places, then the rest; no yard (it is no home);
- **108** Redskap
- **118** Plasser: the list in the order she works them
- **160** Levering
- **175** Vær
- **186** Rytme
- **198** Mannskap
- **219** the top: Start or Pause, Nå, and the button that fixes a stop
- **237** the statistics (R9): today, the last seven days, and all
- **254** the page
  - 350 `plan2Copy(vid)`

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

## `src/js/ui/05j-catchfeed.js` (55 linjer)

---------- «Kystlys» U4: the catch as it comes over the rail (docs/planer/ui-redesign.md, 04.11.2026) ----------

- **1** «Kystlys» U4: the catch as it comes over the rail (docs/planer/ui-redesign.md, 04.11.2026)
  - 53 `catchFeed(sp, kg)`
  - 54 `catchRec(sp, kg)`

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

## `src/js/ui/07-guide.js` (400 linjer)

  - 1 `renderClock()`
  - 10 `mottakShut()`
  - 11 `chartMode()`
  - 13 `chartNight()`
  - 15 `echoSettings()`
  - 24 `chartSettings()`
  - 32 `panelRoute()`
  - 114 `echoSvg()`
  - 133 `panelFish()`
  - 155 `valueEst(sp, g)`
  - 156 `panelHold()`
  - 172 `fcChart()`
  - 187 `panelWx()`
  - 219 `landText(short)`
  - 232 `deckText(short)`
  - 247 `quayText(short)`
  - 253 `panelPort()`
  - 287 `portSlip()`
  - 361 `landWarn(p)`
  - 374 `landPage()`
  - 389 `panelLog()`
  - 394 `renderPanel()`
  - 398 `panelBusy()`

## `src/js/ui/07b-first-trip.js` (296 linjer)

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
  - 195 `tutReveal(el)`
  - 201 `tutRect(T0)`
  - 207 `tutStep()`
  - 213 `tutFinish()`
  - 214 `tutScrollSlip()`
  - 217 `tutAllow(what)`
  - 235 `tutView(st)`
  - 242 `tutUpdate()`
  - 265 `tipPlace(txt, T0, o)`
  - 290 `tipToast()`

## `src/js/ui/07c-handbook.js` (240 linjer)

Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)

- **1** Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)
  - 10 `hbState()`
  - 173 `hbPick()`
  - 181 `hbEv(id, how)`
  - 182 `hbDone(id)`
  - 183 `hbSkip(ch, id)`
  - 185 `hbReady()`
- **187** what the phone shows (Onboarding 2, O5, V7 A, 27.10.2026)
  - 193 `appShown(id)`
  - 197 `appUnlock(id)`
  - 199 `appSeen(id)`
  - 200 `hbUpdate()`

## `src/js/ui/10g-wardrobe.js` (133 linjer)

Garderoben: the player changes how his figure looks (Jonas 10.10.2026)

- **1** Garderoben: the player changes how his figure looks (Jonas 10.10.2026)
- **14** the right-hand side: what the current tab offers
- **50** the little renderer

## `src/js/ui/08-actions.js` (430 linjer)

actions

  - 6 `doAct(el)`
  - 75 `panelInput(e)`
  - 80 `panelChange(e)`
  - 103 `landConf(H, q, acc)`
  - 131 `sell()`
- **249** modal
  - 251 `modal(html)`
  - 260 `boatUnnamed()`
  - 261 `boatChristen(nm)`
  - 263 `showIntro(namesOnly)`
- **278** «Mens du var borte» (Jonas 07.10.2026: «en følelse av instant-belønning»)
  - 283 `awayStart(mins, realMs)`
  - 284 `awayEnd()`
  - 285 `showAway(A)`
- **312** time
  - 318 `playMinutes(n, away)`
  - 322 `catchUp(realMs)`
  - 333 `tick()`
  - 370 `deliverOrder()`
- **380** chrome
  - 381 `applyLang()`
- **394** screens: full-screen 3D, or the chart plotter for route planning
  - 395 `setBodyView(v3d)`
  - 400 `openPlotter()`
  - 405 `plotSetRender()`
  - 409 `plotSetOpen(on)`
  - 422 `kinoUi()`

## `src/js/ui/08b-letter.js` (127 linjer)

---------- the opening: the letter from Father ----------

- **1** the opening: the letter from Father
  - 28 `letterPic(k)`
  - 32 `letterSound(kind)`
  - 44 `showLetter(done)`

## `src/js/ui/08c-start.js` (167 linjer)

«Hvor står fars naust?»: where a new game starts (05.10.2026)

- **1** «Hvor står fars naust?»: where a new game starts (05.10.2026)
  - 23 `startInfo(pt)`
  - 45 `startSeaMax(q, H0)`
  - 47 `startRing(pt)`
  - 48 `startWx(pt, H0)`
  - 56 `showStart(done)`
  - 119 `tutMixAt(q, H, len, land)`
  - 129 `tutFieldNear(pt, land)`
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

## `src/js/ui/10-rod-acts.js` (96 linjer)

---------- the jig game: jigging by hand yourself, and the buttons and hooks around it ----------

- **1** the jig game: jigging by hand yourself, and the buttons and hooks around it
  - 94 `refreshAll()`

## `src/js/ui/10-gear-ui.js` (230 linjer)

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
  - 90 `gopText()`
  - 98 `gearActs(LS)`
  - 119 `jigSets()`
  - 129 `gearPanel()`
  - 148 `gearSvg(u)`
  - 174 `otherGearHit(p, r)`
  - 175 `otherGearCard(s)`
  - 183 `gearHit(p, r)`
  - 185 `buoyStandoff(s, e)`
  - 190 `gearTap(hit)`
  - 202 `wpActOptions(w)`
  - 208 `wpActLabel(a)`
  - 214 `wpActCycle(w)`
  - 219 `gearDoAct(act, el)`

## `src/js/ui/10c-dock.js` (402 linjer)

---------- the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side ----------

- **1** the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side
- **306** the drawer
  - 375 `renderActs()`
  - 388 `showroomTick()`

## `src/js/ui/10d-helm.js` (51 linjer)

THE HELM ON THE SCREEN (core/16-helm.js; the user's wish 03.10.2026)

- **1** THE HELM ON THE SCREEN (core/16-helm.js; the user's wish 03.10.2026)

## `src/js/ui/10e-sound.js` (319 linjer)

SOUND (the user's wish 03.10.2026)

- **1** SOUND (the user's wish 03.10.2026)
- **82** inside Father's naust (Jonas 09.10.2026: «Kjør på med lyd i naustet»; ui/09c-naust3d.js)
- **141** the music (Jonas 05.10.2026: «rolig ambient instrumentaler som svak stemning i bakgrunnen. Må kunne skrus av i innstillinger»)

## `src/js/ui/10f-cloud.js` (934 linjer)

THE CLOUD (04.10.2026; docs/lansering.md E and F)

- **1** THE CLOUD (04.10.2026; docs/lansering.md E and F)
  - 10 `cloudOn()`
  - 18 `adminOk()`
  - 22 `cloudS()`
  - 28 `cloudGpu()`
  - 35 `cloudDev()`
  - 42 `cloudMeta()`
- **56** talking to Supabase
  - 57 `cloudToken()`
- **58** guests (06.10.2026; Jonas: «nye brukere ikke trenger å logge inn til å starte med», the account after the third landing)
  - 64 `guestGet()`
  - 65 `guestAuth(path, body)`
  - 73 `guestToken()`
  - 81 `guestStart()`
  - 87 `cloudRpc(fn, args, opt)`
- **99** the gate: before the game starts
  - 100 `cloudGateShow(html)`
  - 108 `cloudGateHide()`
  - 112 `worldSync()`
  - 117 `cloudGate()`
- **185** after the start: hooks, measurements, the save
  - 186 `cloudStart()`
  - 211 `cloudAsk()`
  - 221 `cloudConsent(yes, by)`
  - 227 `cloudBegin()`
  - 237 `cloudEv(k, d)`
  - 238 `cloudFlush(end)`
- **247** the errors (04.10.2026; caught everywhere since 02.11.2026, js/errtrap.js)
  - 258 `srcMapStr(s)`
  - 271 `errNoise(msg)`
  - 276 `cloudErr(msg, src, stack, kind)`
  - 287 `errSend(e)`
  - 291 `errQueue()`
  - 292 `errKeep(list)`
  - 296 `errFlush()`
  - 320 `errStart()`
- **329** a page that stops or stands still while it is on the screen
  - 336 `aliveRead()`
  - 337 `aliveBeat(gone)`
  - 348 `aliveCheck()`
  - 372 `hangWatch()`
- **386** the save between devices (05.10.2026; supabase/migrations/20261005200000_save_sync.sql)
  - 393 `syncGet()`
  - 394 `syncSet(rev, at, rv, sq)`
  - 400 `deviceId()`
  - 404 `deviceName()`
  - 409 `cloudStatus(s)`
  - 410 `cloudStatusText()`
  - 419 `saveSum(o)`
  - 423 `sumText(m)`
  - 430 `cloudChoose(here, cloud, when, box)`
  - 445 `cloudKeptNote(where)`
  - 450 `cloudTake(cs)`
  - 456 `cloudSync(cs)`
  - 480 `cloudSaveSoon(closing, manual)`
  - 519 `cloudSoon(ms)`
- **520** one device at a time (13.10.2026, supabase/migrations/20261013120000_active.sql)
  - 530 `cloudFp()`
  - 531 `cloudClaim(wait)`
  - 544 `cloudBeat()`
  - 560 `cloudWake()`
  - 566 `cloudPassed(h)`
  - 581 `cloudHeldShow(h)`
  - 590 `cloudPlayHere()`
  - 600 `cloudCheckHead()`
  - 609 `cloudConflict(cl, moved)`
  - 639 `cloudHist()`
  - 644 `cloudRestore(id)`
- **655** what is measured: the game's own functions, wrapped once they are all defined
  - 656 `cloudHooks()`
- **679** the account card in Settings
  - 680 `cloudCard()`
  - 704 `histRows()`
  - 716 `cloudAccountDel()`
  - 727 `cloudMediaDel()`
  - 733 `cloudAct(a, d)`
- **767** registering, for a guest: in the game's own words, never a wall before the third landing
  - 776 `guestHave()`
  - 782 `guestAsk(why)`
  - 806 `namesKept()`
  - 807 `namesKeep(o)`
  - 809 `namesApply()`
  - 817 `nameTake(n, quiet)`
  - 827 `nameCheck()`
  - 842 `nameSuggest()`
  - 851 `nameAsk(why, reason)`
  - 876 `guestOpenAsk()`
  - 884 `nameNudge(force)`
  - 897 `guestNudge(step)`
  - 909 `guestLogin(src)`
  - 915 `guestRegister(signIn)`
  - 927 `guestGift()`

## `src/js/ui/10g-push.js` (206 linjer)

PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and

- **1** PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and
  - 30 `pushHas()`
  - 32 `pushKey()`
  - 39 `pushOn()`
  - 53 `pushOff()`
  - 63 `pushAuto()`
  - 66 `pushAsk()`
  - 78 `pushItems(now)`
  - 174 `pushPlan(away)`
  - 182 `pushStart()`
  - 190 `pushCardRow()`
  - 197 `pushCatToggle(k)`
  - 202 `pushToggle()`

## `src/js/ui/10h-world.js` (176 linjer)

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
  - 166 `worldStart()`

## `src/js/ui/10i-shop.js` (113 linjer)

THE SHOP (05.10.2026; supabase/migrations/20261006040000_shop.sql, supabase/functions/shop-checkout and stripe-webhook)

- **1** THE SHOP (05.10.2026; supabase/migrations/20261006040000_shop.sql, supabase/functions/shop-checkout and stripe-webhook)
  - 16 `shopMode()`
  - 22 `realKr(nok)`
  - 24 `shopLabel(nok)`
  - 29 `shopWhat(k)`
  - 39 `payBuy(k, give)`
  - 47 `shopFine()`
  - 50 `shopGo(k)`
  - 66 `shopGive(g)`
  - 78 `shopClaim()`
  - 100 `shopStart()`

## `src/js/ui/10j-paint.js` (216 linjer)

THE PAINT SHOP (Malerverkstedet; Jonas 06.10.2026, docs/engasjement.md): a button of its own under Verft. Your own boat lies

- **1** THE PAINT SHOP (Malerverkstedet; Jonas 06.10.2026, docs/engasjement.md): a button of its own under Verft. Your own boat lies
  - 179 `logoSet(L)`
  - 187 `logoCheck()`
  - 195 `giveCos(k)`
  - 207 `regSet(n)`

## `src/js/ui/10q-buymoment.js` (36 linjer)

The moment a boat is bought (M5 in docs/planer/butikker-og-sponsorer.md): the top and the end of the purchase

- **1** The moment a boat is bought (M5 in docs/planer/butikker-og-sponsorer.md): the top and the end of the purchase

## `src/js/ui/10r-sponsor.js` (54 linjer)

Sponsorer in the game (M6, core/09l-sponsor.js): the list from the cloud, the sponsored item card, the link out and the

- **1** Sponsorer in the game (M6, core/09l-sponsor.js): the list from the cloud, the sponsored item card, the link out and the

## `src/js/ui/10k-friends.js` (133 linjer)

---------- Venner: friends between players (Jonas 09.10.2026; supabase/migrations/20261009180000_friends.sql) ----------

- **1** Venner: friends between players (Jonas 09.10.2026; supabase/migrations/20261009180000_friends.sql)

## `src/js/ui/10l-share.js` (85 linjer)

---------- shared catch marks (Jonas 09.10.2026; supabase/migrations/20261009200000_shared_marks.sql) ----------

- **1** shared catch marks (Jonas 09.10.2026; supabase/migrations/20261009200000_shared_marks.sql)

## `src/js/ui/10m-guestbook.js` (98 linjer)

---------- the guestbooks and Kystfareren (Jonas 09.10.2026; supabase/migrations/20261009220000_guestbook.sql) ----------

- **1** the guestbooks and Kystfareren (Jonas 09.10.2026; supabase/migrations/20261009220000_guestbook.sql)
- **62** Kystfareren: the parts of the coast by where the place lies (natLL), south to north

## `src/js/ui/10n-hail.js` (61 linjer)

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

## `src/js/ui/10p-install.js` (100 linjer)

put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)

- **1** put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)
- **70** the browser card on the loading screen (Jonas 03.11.2026, after tilbakemelding #107-#109)

## `src/js/ui/11-boot.js` (261 linjer)

---------- boot ----------

- **1** boot
  - 13 `bootStep(next)`
  - 14 `bootAway()`
  - 15 `bootGate(on)`
  - 17 `bootInfo()`
  - 19 `bootDone()`
  - 30 `bootMap()`
  - 52 `boot3dAsk()`
  - 54 `boot3dShown()`
  - 63 `boot3dSend()`
  - 64 `modelsReady()`
  - 65 `dataEls()`
  - 66 `dataEarly()`
  - 76 `dataGet(el, opt)`
  - 89 `bootData()`
  - 96 `bootDataLate()`
  - 111 `modelsLabel()`
  - 118 `bootMapLoad()`
  - 139 `bootGame()`
  - 244 `bootFail(e)`

## `src/js/vessel3d.js` (1475 linjer)

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
  - 399 `glbLoad(type)`
  - 406 `glbPart(type, name)`
  - 409 `glbPaint(part, liv)`
  - 417 `glbZones(type)`
  - 424 `glbModel(type, lod, liv)`
  - 449 `vesselSpec(type)`
  - 450 `buildVesselModel(type, lod, liv)`
  - 491 `vesselGeo(type, hs, sp, house, anch)`
  - 503 `vesselModel(type)`
  - 504 `geoOf(type)`
- **508** the paint shop (ui/10j-paint.js; Jonas 06.10.2026): the hull colours a player can paint their own boat in, in VC's scale. A boat's
  - 527 `modelLiv(L)`
  - 534 `hullLiv(b)`
  - 535 `livKey(liv)`
  - 537 `livGeo(liv)`
  - 542 `livStr(b)`
  - 554 `livPen(s)`
  - 556 `livMark(s)`
  - 557 `livParse(s)`
- **562** paint designs (Malerverkstedet): a stripe under the sheer (ripe), a second colour on the lower topsides (totone), a stripe at the
  - 566 `topsides(type)`
  - 584 `designLines(TS, liv)`
  - 593 `glbDesign(type, part, liv)`
  - 627 `designFits(type, k)`
  - 634 `kitLiv(liv)`
- **636** flags (Malerverkstedet, 07.10.2026): the ensign at the stern as a picture, so any nation and shape can fly. Each flag is drawn here
- **685** the company logo (Malerverkstedet, 07.10.2026): made here from a sign, initials and two colours, or the player's own picture
  - 696 `logoCanvas(cv, L, img)`
  - 707 `logoStrips(type)`
  - 709 `logoStr(L)`
  - 710 `logoParse(s)`
  - 714 `flagCanvas(cv, code, shape, logo)`
  - 726 `flagOf(L)`
- **727** the boat's name on her hull (Jonas 07.10.2026: «Pass på at båtnavnet vises godt på skroget på alle båtene»): a strip on each side
  - 736 `hullTris(type)`
  - 750 `sideStrip(type, frac, hMax, aspect, drop)`
  - 782 `nameStrips(type)`
  - 818 `stripProud(type, st)`
  - 841 `stripPaint(type, st)`
  - 862 `markStrips(type)`
  - 884 `anchorLen(bw)`
  - 887 `markRGB(type, liv)`
  - 895 `hullRGB(type, liv)`
- **905** where the name is painted (Jonas 04.11.2026: «Det som er mest vanlig er at navnet på båten skrives i blokkbokstaver på kanten av
  - 916 `facingTris(P, dir, keep)`
  - 931 `rayZ(T, x, y, dir, za, zb)`
  - 942 `crossStrip(T, xa, xb, y0, y1, z0, zw, dir, off)`
  - 953 `crossPaint(T, xa, xb, y0, y1, dir, za, zb)`
  - 964 `halfWidth(T, y, z0, zw, dir, wmax)`
  - 975 `houseFront(type, P, Gl, V)`
  - 1008 `transom(type, P, V)`
  - 1039 `namePlaces(type)`
  - 1057 `placeRGB(type, p, liv)`
  - 1065 `nameInkLight(rgb)`
  - 1069 `npcKit(L, B)`
  - 1072 `npcModel(type, lod, liv)`
  - 1074 `personVB(B, x, y, z, seated, hands, suit, kit)`
- **1086** people from tools/harbour/arbeider.py: one body in parts, posed at its joints and painted per kit
  - 1099 `wkPart(name, kit)`
  - 1109 `wkPut(B, o, ax, s, at)`
  - 1119 `wkLimb(B, o, A, E, r)`
  - 1126 `figureVB(B, x, y, z, seated, hands, kit)`
  - 1148 `vesselSVG(type, w, h)`
- **1186** the deck map: where people can walk on each type (the crew plan, docs/mannskap-plan.md)
  - 1193 `deckMap(type)`
  - 1338 `deckPass(M, k, q)`
  - 1343 `passLine(M, A, B)`
  - 1345 `linkPass(M, k, q)`
  - 1349 `deckComp(M)`
  - 1358 `deckPath(M, a, b)`
- **1389** the lanterns after Sjøveisreglene (FOR-1975-12-01-5, rules 22–30, read on Lovdata 17.10.2026; docs/batplan.md del 11)
  - 1402 `lanterns(G, V, st)`
  - 1436 `deckPoints(type)`

## `src/js/deckcrew.js` (473 linjer)

- **2** CREW3D: the people aboard as agents who walk the deck (docs/mannskap-plan.md, del 1; Jonas 17.10.2026: no teleporting)
  - 14 `crewSim(src)`
- **37** the kit on the deck, out of the walking map
- **85** where the work is on this deck: [x, z, heading, task] in the boat's frame (the heading as the view draws it: 0 forward, +pi/2 to starboard)
- **128** what the game says: everyone's station this minute, and the boat's state
- **178** a free person: something to do for a while, by the weather, the hour and their nature
- **184** no limb through a wall, the rail or anything else (Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger,
- **275** the work at its place, clear of everything: at the rail the hands go to the rail's own top (a step back when it is close), at the
- **290** a cell of one's own: the goals already given are taken, and a new one at least SEP from them (the nearest free cell within a metre)
- **302** the agents follow the people aboard
- **417** the body on its way, clear of everything: the shoulders and the chest and back as upright lines; one that would go through a wall
- **437** no way over the deck between two parts of it (fore and aft of the house on the big boats): through the house, out of sight for
  - 467 `npcCrewCtx(n, G)`

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
  - 155 `fbm(x, y, o, s)`
  - 156 `ridged(x, y)`
  - 157 `rng(seed)`

## `src/js/view3d/01-shaders.js` (600 linjer)

---------- shaders ----------

- **1** shaders
- **156** the foam map (Fysikk 4, F1): the foam the boat and the sea leave in the water
- **222** the boat's own foam, when she has way on
- **230** the whitecaps, as the sea shader finds them: the crest in standard deviations plus the mottle, over Monahan's threshold
  - 510 `cloudStep(dt)`
  - 517 `skyFrame(u, Hh, tn, bv)`
  - 532 `glsl3(src, fs)`
  - 540 `compile(type, src, nm)`
  - 547 `program(vs, fs, attrs, nm = '?')`
  - 555 `buf(data, target, usage)`
  - 560 `airSet(u, terr)`
  - 575 `sunT0()`
  - 582 `attr(loc, b, size)`
  - 598 `upload(pos, col, idx)`

## `src/js/view3d/02-mesh-terrain.js` (99 linjer)

---------- mesh builder ----------

- **1** mesh builder
  - 2 `MB()`
- **45** terrain
  - 76 `terrRaw(x, z, dil)`

## `src/js/view3d/03-berths-naust.js` (395 linjer)

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
  - 232 `coverAt(x, z, cv, ck, k)`
  - 257 `satRead(L, x, z)`
  - 266 `satAt(x, z, cv, o)`
  - 274 `covBlk(LC, bx, by)`
  - 278 `coverRing(LC, ix, iz)`
  - 288 `coverClass(x, z)`
  - 298 `meshBegin(x0, z0, sx, sz, n, hf)`
  - 302 `meshRows(B, until)`
  - 314 `meshEnd(B)`
  - 326 `makeMesh(x0, z0, sx, sz, n, hf)`
  - 327 `freeMesh(m)`
  - 329 `nearSurf(M, x, z)`
  - 339 `unitPatch(U, M)`
  - 364 `buildPatches()`
  - 373 `buildTerrain()`
  - 382 `stream3d()`

## `src/js/view3d/04-vec-packs.js` (341 linjer)

---------- the coast's packs (01c-vec.js, part 4 of the coast-wide plan): buildings, roads, bridges, piers and breakwaters ----------

- **1** the coast's packs (01c-vec.js, part 4 of the coast-wide plan): buildings, roads, bridges, piers and breakwaters
  - 8 `tileStatics()`
  - 37 `tileStep()`
  - 57 `drawTileStatics(TM, eye)`
  - 64 `meshTask(kind, cur, x0, z0, span, n, hf, done)`
  - 75 `meshStep()`
  - 82 `staleMesh(kind)`
  - 83 `staleOver(pk)`
  - 95 `updateFar()`
  - 106 `meshH(m, x, z)`
  - 111 `shadeH(x, z, dd)`
  - 113 `shSeed(m, old)`
  - 122 `updateShadows()`
  - 161 `sunGridStep(key, d)`
  - 194 `sgUpload(J)`
  - 202 `updateMid()`
  - 207 `updateNear()`
  - 210 `nearWanted()`
  - 220 `fineWanted()`
  - 239 `recolor(m, snow)`
- **329** the breakwaters' armour stones: a mesh a breakwater, drawn only within STONE_R of the eye (beyond it a stone is less than a
  - 333 `stonesOf(list, build)`
  - 338 `drawStones(list, TM, eye)`

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

## `src/js/view3d/08-plants.js` (462 linjer)

---------- fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay ----------

- **1** fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay
  - 3 `plantLayout(pt)`
  - 13 `buildPlants()`
  - 23 `buildPlantParts()`
  - 53 `roundAt(R, T)`
  - 64 `plantRounds(P)`
  - 78 `workLow(st, T, idx)`
  - 103 `workTurn(st, eye, T, idx)`
  - 114 `drawShovel(G, B, tip, full, c, box, top)`
  - 123 `drawWorker(P, st, eye, T, idx)`
- **210** the work on deck, step by step (Jonas 20.10.2026: «Alle deler av arbeidsprosessene må ha egne animasjoner»); the places the
- **311** the breaks (Jonas 23.10.2026: «Husk at vi må ha animasjoner for alle handlinger og aktiviteter»; core/13-work.js idleAssign)
- **412** the props of the deck work (the poses above): the fish in the hands and on the table, the guts over the rail, the crate and the

## `src/js/view3d/09-landing-deck.js` (682 linjer)

---------- landing the catch ----------

- **1** landing the catch
  - 21 `deckSlots(kind)`
  - 29 `fkRun(P, back)`
  - 48 `legAt(g, w)`
  - 57 `landLoad(L, j)`
  - 66 `landOff(L)`
  - 70 `landBack(L)`
  - 75 `landScene(P, T, BMrel, eye)`
  - 138 `follow(P, key, st, T, v)`
  - 146 `drawPlant(P, eye, VP, T, BMrel)`
  - 184 `plantsCoast(eye)`
  - 192 `nearestPlant(eye)`
- **194** work on deck: the bleeding tub and the gutting table on the after deck; whoever works the deck guts or ices there
  - 196 `deckActivity()`
- **205** the deck kit (the user's wish 19.10.2026, tools/deck/*.py): the fish tubs, the gaff and the knife, the gutting table and
  - 209 `kit(f, nm)`
  - 212 `kitX(f)`
- **214** the hands in their grips (tools/harbour/hender.py): the meshes once for all the figures (the glove is the same on every look),
  - 222 `handMeshes()`
  - 235 `handFrame(z0, sp, side)`
  - 244 `handSpecs(st, F, R, hands)`
  - 290 `toolM(A, dir)`
  - 297 `dkEvent(kind, at, sp, kg, o)`
  - 303 `dkFor(who, p, task)`
  - 311 `dkEv(e, BMrel, G)`
  - 313 `catchQ()`
  - 318 `dkTick()`
  - 329 `dkBloodDraw(VP)`
  - 338 `rigAt(G, kind, d)`
  - 342 `drawNetTub(BMrel, at, fill, ry)`
  - 348 `drawLineTubs(BMrel, at, n, baited, green, ry, fill)`
  - 359 `jobTubs(j)`
  - 363 `drawMendNet(BMrel, G, d, R)`
  - 377 `drawRigRest(BMrel, G, d)`
- **390** the kit on the model's places (G.kit, from the boat's model; tools/deck): the life-saving gear the rules ask for (V.lsa,
  - 396 `boyeCanvas(txt)`
  - 402 `boyeTex()`
  - 407 `boyeQ()`
  - 408 `drawSafety(BMrel, G, VP, t)`
  - 429 `cargoUnits(G)`
  - 430 `drawCargo(BMrel, G, hide)`
  - 445 `crFrames(X, Q, BMrel, p)`
  - 454 `crLink(X, a2)`
  - 457 `drawCrane(BMrel, G, VP, t, d)`
- **512** the fish tubs on an open boat's deck (core/07f-kar.js, docs/planer/fiskekar-dekk.md, Jonas 04.11.2026)
  - 523 `karPlan(key, spec, kg, dims)`
  - 531 `karSpec()`
  - 533 `drawKarLoad(M, load, key, washed)`
  - 552 `karPlaces(vt)`
  - 556 `drawCatchTubs(BMrel, vt, skip, washed)`
  - 562 `karTop(vt, i)`
  - 565 `karFilling(vt)`
- **566** the ice box (tools/deck/fisk.py iskasse, the 300 l tub in blue): it stands on deck at its place (the model's kit.iskasse, under
  - 569 `iceBoxAt(vt)`
  - 574 `iceBoxTop(vt)`
  - 578 `drawIceBox(BMrel, vt, shovelIn)`
  - 589 `shaftM(A, B)`
- **593** the sling (tools/deck/fisk.py slynge_*): the master link on the crane's hook at H (eye-relative, its top), a strap from the ring
  - 595 `drawSling(H, M, swing, k)`
- **613** the bleeding tub (Jonas 04.11.2026: «se at blodet og fisken fyller karet på en ordentlig måte»): the 300 l tub at the model's
  - 617 `drawBleedTub(BMrel, W, d, ux, uz, KT, KW)`
  - 635 `dkTub(G)`
  - 636 `drawDeck(BMrel, eye, VP, t, DK)`

## `src/js/view3d/10-gear.js` (381 linjer)

---------- passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling ----------

- **1** passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling
  - 3 `buildGear()`
  - 30 `drawGearSea(eye, t, VP, H)`
  - 54 `underProf(s, kind)`
  - 72 `drawGearUnder(VP, eye)`
  - 127 `drawSetting(BMrel, t, g, G, stack, x0)`
  - 144 `haulFish(g)`
  - 153 `haulModel(kind)`
  - 162 `gopHauls()`
  - 176 `potDeck(G, HP, sx, d, pw, vt, ph)`
  - 183 `drawPotStacks(BMrel, K, n)`
  - 191 `stackTop(K, i, d)`
  - 195 `drawPotsAboard(BMrel, G, d, n)`
  - 211 `tankAt(x, z, d, vt)`
  - 229 `drawPots(BMrel, t, g, G, HP, sx, d, skiff, seg)`
  - 287 `drawCrabTank(BMrel, G, d, sx, HP)`
  - 297 `drawHaulRest(BMrel, G, d, VP)`
  - 312 `drawGearOp(BMrel, eye, VP, t)`

## `src/js/view3d/11-bunker.js` (65 linjer)

---------- bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle ----------

- **1** bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle
  - 3 `buildBunkers()`
  - 31 `nearestBunker(eye)`
  - 32 `drawBunker(B, eye, VP, T, BMrel)`

## `src/js/view3d/12-skiff.js` (415 linjer)

---------- boat ----------

- **1** boat
- **3** the starter boat: a 19 ft centre-console skiff, modelled in detail
  - 86 `NB()`
  - 94 `lookMesh(look)`
  - 101 `nSetup(VP)`
  - 107 `wearOn(t)`
  - 108 `wearOff()`
  - 116 `wetTick(key, M, sv, len, beam, top, spd)`
  - 127 `lifeOn(key, M, sv, type, age, keep, spd, G)`
  - 135 `lifeOff()`
  - 138 `drawN(m, M)`
  - 140 `texStrip(Pb, Pt)`
  - 141 `texQuad(P0, P1, P2, P3)`
  - 142 `mkTex()`
  - 143 `upTex(t, cv)`
  - 144 `drawTexQuad(q, tex, M, VP, lit, nrm)`
- **152** the open boats worked by hand: one kit per type
  - 160 `refreshPeople(K)`
  - 171 `useHand(t)`
  - 177 `handKit(t)`
  - 198 `buildSkiff()`

## `src/js/view3d/13-instruments.js` (506 linjer)

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
  - 146 `nameCanvas(cv, nm, light)`
  - 161 `nameTex(nm, light, aspect, mark)`
  - 169 `drawNPCNames(kit, VP)`
  - 181 `paintHand()`
  - 190 `limbM(A, B, r)`
  - 193 `drawSkiff(BMrel, VP, dt, showSkipper, showCrew)`
  - 330 `drawSkiffGlass(BMrel, VP)`
  - 340 `jigRail(t, G)`
  - 361 `drawJigRail(BMrel, VP, t, G, dt)`
  - 394 `drawGlass(m, BMrel, VP)`
  - 413 `drawDrops(m, BMrel, VP, t)`
  - 424 `buildBoat()`
  - 450 `buildFlag()`
  - 462 `flagTex()`
  - 477 `penTex()`
  - 490 `mastTop(G)`
  - 494 `updateFlag(t, appW)`

## `src/js/view3d/14-sea.js` (357 linjer)

---------- sea ----------

- **1** sea
  - 3 `buildPatch()`
  - 11 `buildSea()`
- **21** the waves: wind sea and swell from the sea model (03b-sea.js)
  - 27 `specW(L0)`
  - 28 `updateWaves(dt, H)`
- **54** the near field: the short sea rides with the boat
  - 63 `nfStep()`
- **74** the boat's own waves (the uniforms of WAKE_GLSL)
  - 81 `wakeTrack(x, z, fx, fz, ds)`
  - 100 `wakeTU(u, ox, oz)`
  - 101 `updateWake()`
  - 127 `wakeHFast(x, z)`
- **140** the foam map: the foam the boat and the sea leave in the water (Fysikk 4, F1, 27.10.2026)
  - 153 `foamFree()`
  - 154 `foamInit()`
  - 170 `wavePh()`
  - 177 `foamStep(dt, t)`
  - 237 `foamNPC(qx, qz, Dx, Dz, gx, gz)`
  - 277 `foamBind(u)`
- **284** the sea state over the near terrain and the whole map
  - 291 `ssLevel(n, unit)`
  - 293 `ssRect(L)`
  - 294 `ssWork(L, until)`
  - 317 `ssStep(rdt)`
  - 319 `ssBlend(L)`
  - 321 `ssTex(L, x, z, out)`
  - 328 `ssAt(x, z)`
  - 337 `seaDisp(x, z, t, S, fade)`
  - 348 `seaFade(x, z)`
  - 349 `seaH(x, z, t)`
  - 355 `seaHFast(x, z, t)`

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

## `src/js/view3d/16-motion.js` (233 linjer)

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
  - 124 `dynFollow(dt)`
  - 132 `updateBoat(dt, t, frac, rdt)`
- **218** particles
  - 222 `spawn(x, y, z, vx, vy, vz, life, g)`
  - 224 `drawPts(n, mode, VP, col, size, round, off, mx)`

## `src/js/view3d/17-draw.js` (190 linjer)

---------- drawing ----------

- **1** drawing
  - 2 `litSetup(VP)`
  - 8 `drawLit(m, M, hole)`
  - 17 `terProg(q)`
  - 25 `drawTerrain(TM, eye, VP, near)`
  - 46 `buildGround()`
  - 81 `buildLandMask()`
  - 104 `lmStep()`
  - 141 `seaRing(u, eye, y, R, Hl)`
  - 151 `drawSea(VP, eye, t, far, drop)`

## `src/js/view3d/17b-inland-water.js` (148 linjer)

---------- the fresh water: lakes, ponds, rivers, streams and waterfalls (G2 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the fresh water: lakes, ponds, rivers, streams and waterfalls (G2 of docs/planer/grafikk-natur-og-miljo.md)
  - 26 `waterData(tx, ty)`
  - 42 `waterMesh(P, A)`
  - 44 `waterTile(tx, ty)`
  - 80 `waterNear(W, ex, ez)`
  - 108 `freeWater(m)`
  - 111 `updateWater(eye)`
  - 127 `staleWater(pk)`
  - 131 `drawWater(VP, eye)`

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

## `src/js/view3d/17h-shore.js` (85 linjer)

---------- the beaches, the shingle and the cliffs by the sea (G10 of docs/planer/grafikk-natur-og-miljo.md) ----------

- **1** the beaches, the shingle and the cliffs by the sea (G10 of docs/planer/grafikk-natur-og-miljo.md)
  - 8 `shoreData(tx, ty)`
  - 26 `shoreTile(tx, ty)`
  - 67 `updateShore(eye)`
  - 78 `staleShore(pk)`
  - 79 `drawShore(VP)`

## `src/js/view3d/18-setup.js` (191 linjer)

---------- setup ----------

- **1** setup
  - 49 `init()`
  - 169 `anchorAlarm3d(kind)`
  - 172 `sayBoat(id, txt)`
  - 174 `sayWorker(pid, idx, nm, no, en)`
  - 178 `crewFx3d(c, kind, o)`
  - 180 `say3d(c, no, en)`
  - 184 `buildLabels()`
  - 185 `resize()`

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

## `src/js/view3d/20-trawl-seine.js` (366 linjer)

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
  - 209 `drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named)`
  - 235 `npcMesh(n, lod)`
  - 247 `seineAnch(G)`
  - 257 `npcClock(Hf)`
  - 265 `npcHead(n, t)`
  - 280 `npcFollow(n, t)`
  - 294 `npcPhase(id)`
  - 295 `drawNPC(eye, t, H, VP)`
  - 345 `npcCrewDraw(n, K, eye, t)`

## `src/js/view3d/21-rescue-anchor.js` (165 linjer)

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
  - 138 `buildRescue()`
  - 144 `drawRescue(BMrel, eye, VP, t)`
  - 158 `drawRescueLights(VP, t)`

## `src/js/view3d/22-docks-air.js` (209 linjer)

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
  - 195 `drawNPCLights(VP)`

## `src/js/view3d/23-camera-frame.js` (101 linjer)

---------- the chase camera stays out of solid things ----------

- **1** the chase camera stays out of solid things
  - 7 `camSolid(x, z, sx, sz, ry, y0, y1, tag)`
  - 14 `camBuildings(key)`
  - 22 `camBld(B, idx, tag)`
  - 33 `camDropTag(tag)`
  - 36 `camFree(o, e)`
  - 59 `camInside(x, y, z)`
  - 66 `compassStrip(W, H, dpr)`
  - 78 `compassDraw(az, p)`
- **91** frame
  - 95 `fpsEl()`

## `src/js/view3d/24-cinema.js` (694 linjer)

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
  - 475 `snapTake()`
  - 480 `drawRoute(VP, eye)`
  - 492 `driftSpray(VP, eye, dt, t, col)`
  - 507 `drawSmoke(VP, eye, BM, dt)`
  - 540 `scupperWater(VP, eye, BM, dt, t, col)`
  - 566 `drawEffects(VP, eye, BM, dt, t)`
  - 676 `updateLabels(VP, eye, W, Hh)`

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
