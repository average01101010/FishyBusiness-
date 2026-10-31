# Kodekart

Seksjonene og funksjonene i hver kildefil, med linjenummer, i rekkefølgen malen setter dem sammen i (`src/index.html`). Lages av `python3 tools/docs/kodekart.py` og skrives på nytt av `/lever`, så linjenumrene kan være litt gamle; navnene og rekkefølgen stemmer. Slå opp her og bruk `grep` i stedet for å lese en stor fil hel.

## `src/js/core/00-proj.js` (65 linjer)

- **2** CORE START
- **4** PROJECTION: UTM zone 33 (ETRS89, EPSG:25833)
  - 30 `utm33(lat, lon)`
  - 45 `utm33inv(E, N)`
  - 60 `natP(lat, lon)`
  - 61 `natLL(p)`

## `src/js/core/01-world.js` (390 linjer)

- **4** one clock for everyone (05.10.2026, the shared world V1)
  - 44 `gridGamma(p)`
  - 59 `b64bytes(s)`
  - 60 `varints(b)`
  - 68 `loadFine()`
  - 76 `loadRoads()`
  - 92 `inHarbour(p)`
  - 99 `legHazard(a, c, sd)`
  - 109 `legHazardMemo(a, c, sd)`
  - 114 `draftHazards()`
  - 124 `legReady(a, c)`
  - 131 `nearestPlace(p)`
  - 135 `groundCheck(a, c)`
  - 146 `runAground(p)`
  - 161 `rocksNear(a, b, r)`
  - 171 `rocksIn(x0, y0, x1, y1)`
  - 184 `coastDist(p)`
  - 185 `coastDistFar(p)`
  - 191 `decodeContours()`
  - 200 `isLand(p)`
  - 208 `isLandFar(p)`
  - 214 `isLandUI(p)`
  - 220 `inHarbourPocket(p)`
  - 226 `harbourNear(x, z)`
  - 232 `qPockets()`
  - 233 `pocketHit(US, QS, x, z)`
  - 240 `pocketsIn(x0, y0, x1, y1)`
  - 249 `legClear(a, b)`
  - 280 `portLabel(p)`
- **296** the harbour unit (02.10.2026)
  - 337 `fillOut(U, lx, lz)`
  - 350 `onUnitGround(p)`
  - 357 `unitCovers(x, z, m)`
  - 365 `bridgeUnderUnit(br, extra)`
  - 370 `portApproach(pt)`

## `src/js/core/01b-mapdata.js` (202 linjer)

MAP DATA (phase K3 of the coast plan): the rasters in 10 km blocks, fetched in packs from map/

- **1** MAP DATA (phase K3 of the coast plan): the rasters in 10 km blocks, fetched in packs from map/
  - 22 `mapOnReady(f)`
- **23** IndexedDB, by content
  - 24 `mapIdb()`
  - 28 `idbDo(mode, f)`
  - 29 `mapFetch(pk)`
- **47** the manifest and the packs
  - 48 `mapStart(base)`
  - 64 `mapLoad(pk)`
  - 75 `mapPackOf(L, bx, by)`
  - 76 `mapPacksIn(kind, x0, y0, x1, y1)`
  - 84 `mapSimPacks(p, r)`
  - 85 `mapReadyAt(p, r)`
  - 87 `mapSimAt(p)`
  - 88 `mapViewAt(p)`
  - 91 `mapKindIn(kind, p, memo)`
  - 93 `mapNeed(p, r)`
  - 99 `mapPreload(pts, kinds, onProgress)`
  - 116 `mapLoadKind(kind)`
- **117** blocks
  - 118 `med16(raw, n)`
  - 123 `mapDecode(L, raw)`
  - 135 `mapBlock(L, bx, by)`
  - 147 `mapHasBlock(L, bx, by)`
  - 150 `mapBlockKnown(L, bx, by)`
  - 152 `rcell(L, ix, iy)`
  - 158 `rbil(L, p)`
  - 163 `rbilM(L, x, z)`
  - 168 `mapHasM(L, x0, z0, x1, z1)`
  - 175 `mapVec(pk, name)`
  - 182 `mapViewReady(x0, y0, x1, y1, then, kinds)`
  - 189 `simAreaReady()`
  - 197 `mapDrop(pk)`

## `src/js/core/01c-vec.js` (214 linjer)

THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces

- **1** THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces
  - 23 `inQuad(Q, x, z)`
  - 28 `pierBoxes(out, kind, n, X, Z, src)`
  - 45 `vecDecode(D)`
  - 120 `flyteTile(tx, ty)`
  - 129 `vecFinish(r)`
  - 137 `vecWorker()`
  - 154 `vecInput(pk, inflate)`
  - 162 `vecDecodeHere(pk)`
  - 164 `vecTile(tx, ty)`
  - 173 `vecTilesIn(x0, z0, x1, z1)`
  - 181 `roadsIn(x0, z0, x1, z1)`
  - 194 `bridgesIn(x0, z0, x1, z1)`
  - 196 `vecWant(x0, y0, x1, y1, then)`
  - 204 `vecPrune(pts, R = 60)`

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

## `src/js/core/01e-marks.js` (33 linjer)

THE SEA MARKS ALONG THE WHOLE COAST (05.10.2026; Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av

- **1** THE SEA MARKS ALONG THE WHOLE COAST (05.10.2026; Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av
  - 11 `marksAdd(pk)`
  - 21 `marksRocksIn(x0, y0, x1, y1)`
  - 26 `marksNear(kind, x, y, R)`

## `src/js/core/02-species-gear.js` (230 linjer)

Placeholder prices (NOK/kg, grade A) – to be tuned

- **59** vessels, equipment, crew
  - 175 `fuelWeek(w)`
  - 177 `fuelPrice(H = S.t / 60, pid = S.boat && S.boat.port, diesel = BOAT.die…)`
  - 204 `equipFits(k, type)`
  - 207 `fuelBase(v, vmax, planing)`
  - 208 `fuelKOf(V)`
  - 210 `vesselDerive(V)`
  - 224 `lsaOf(V)`

## `src/js/core/03-simulation.js` (1197 linjer)

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
  - 24 `access()`
  - 26 `vesselValue(v)`
  - 29 `newVesselObj(type, pid, lic)`
- **41** the yard's rebuilds, per boat (S.boat; the user's list 04.10.2026): a bigger hold in three steps, the last doubling it (more
  - 86 `powerX(b)`
  - 88 `applyVessel()`
  - 106 `effortOf(people, jk, hand)`
  - 107 `fishEffort()`
  - 115 `jigMeShare()`
  - 124 `hash(n)`
  - 125 `h2(a, b)`
  - 126 `vn(t, s)`
  - 127 `sstep(a, b, x)`
  - 128 `seasonal(arr, H)`
  - 148 `wxTrack()`
  - 159 `wxMeasure(p)`
  - 167 `wxPlace(p)`
  - 175 `wxLowShape(k, m)`
  - 182 `stormsNear(H, p)`
  - 194 `wxWindF(H, p)`
  - 195 `windAt(H, p)`
  - 205 `windDir(H, p)`
  - 216 `exposure(p)`
  - 218 `fcErr(H, now, seed)`
  - 219 `fcWind(H, now, p)`
  - 221 `beaufort(W)`
  - 236 `climW(p)`
  - 242 `climV(key, H, p)`
  - 243 `climDiff(key, H, p)`
  - 244 `climRatio(key, H, p)`
  - 245 `airTemp(H, p)`
  - 247 `precipAt(H, p)`
  - 248 `cloudAt(H, p)`
  - 249 `visibility(H, p)`
  - 251 `seaTemp(H, p)`
- **252** snow and the seasons on land (V2 and V3 of the weather plan; Jonas 09.10.2026: «vi må bygge ferdig værsystemene og årstidene»).
  - 264 `wxDay(d, p)`
  - 271 `seasonAt(H, p)`
  - 298 `snowLineAt(H, p)`
  - 305 `snowAt(H, z, p)`
  - 312 `obsAt(p)`
  - 313 `eqToHor(ra, dec, d, ob)`
  - 319 `sunEq(d)`
  - 323 `moonEq(d)`
  - 328 `sunAt(H, p)`
  - 329 `moonAt(H, p)`
  - 336 `moonName(mo)`
  - 338 `sunTimes(H, p)`
  - 346 `flagUp(H, p)`
- **351** tide: harmonic prediction per place (phase K10 of the coast plan)
  - 364 `tidePlace(p)`
  - 373 `tideH(H, p)`
  - 381 `tideEvents(H0, hours, p)`
  - 389 `auroraAt(H, p)`
  - 392 `riskLevel(W, hs)`
- **395** weight (the user's list 04.10.2026: «mer last og vekt betyr mindre fart ... viktig at ikke dette blir urealistisk»): what she
  - 400 `boatTons()`
  - 401 `boatTons0()`
  - 402 `loadF()`
- **403** fouling: weed and barnacles on the hull (S.boat.foul, 0 to 1) slow her up to 15 % and cost up to 25 % more fuel; it grows in
  - 407 `foulHour(H)`
  - 411 `fuelUse(b, l)`
  - 412 `fuelAdd(b, l, kr0)`
  - 413 `fuelLph(v, W)`
  - 414 `speedCap(hs, cb = 1)`
  - 417 `noise2(x, y, s)`
  - 423 `slopeAt(p)`
  - 428 `hotField(sp, p, H, k)`
  - 432 `hotspot(sp, p, H)`
  - 439 `school(sp, p, H)`
  - 444 `schoolHeading(sp)`
  - 449 `fieldCode(p)`
  - 451 `skreiSpot(p, d = depthF(p)`
  - 456 `gauss(u1, u2)`
  - 458 `sampleFish(sp, p, H)`
  - 463 `clsOf(sp, kg)`
  - 466 `kveiteClosed(H)`
  - 469 `targetF(sp, H, pilk)`
  - 474 `uerOpen(H)`
  - 478 `denPlace(p)`
  - 484 `denTime(H)`
  - 491 `denSp(sp, q, H, T)`
  - 504 `density(sp, p, H)`
  - 511 `eggaArea(p, d, H, E)`
  - 537 `tutBonus(sp, p)`
  - 549 `stockIdx(p)`
  - 551 `stockW(p)`
  - 556 `stockFill(v)`
  - 559 `stockAt(p, sp)`
  - 566 `takeStock(p, kg, sp, npc)`
- **572** the shared world V2 (05.10.2026; ui/10h-world.js, supabase/migrations/20261006000000_world_v2.sql): one sea, one quota and one
  - 578 `wq()`
  - 579 `wshOpen(y)`
  - 580 `wshSat(pid, sp, H)`
  - 581 `wshTake(k, kg)`
  - 583 `wshLand(port, H, acc, kgSp, codQ)`
  - 590 `initStock()`
  - 598 `stockHour(H)`
  - 620 `depthFactor(sp, d)`
  - 625 `depthF(p)`
  - 631 `depthHas(p)`
  - 640 `deepAt(p)`
  - 645 `offDepth(p)`
  - 648 `tileDepth(p, d)`
  - 655 `depthWater(p)`
  - 667 `depthAt(p)`
  - 668 `depthModel(p)`
  - 669 `grade(f)`
- **670** How the catch keeps (D3 of the operations plan, Jonas 23.10.2026, svar 15a: calibrated against the sources)
  - 680 `keepDay(f)`
  - 681 `keepF(day)`
  - 684 `keepK(x, rrs)`
  - 686 `keepHours(f, f2, k)`
  - 688 `supplyFactor(H)`
  - 695 `weekOfH(H)`
  - 696 `weekDev(sp, H)`
  - 702 `marketPrice(sp, H)`
  - 704 `clsPrice(port, sp, c, H, hook)`
  - 710 `price(port, sp, H)`
  - 712 `avgPrice(sp, H, days)`
- **713** quotas north of 62° N: the regulation and the year's figures are in 03d-quota.js
  - 714 `doyH(H)`
  - 715 `yearH(H)`
  - 716 `quotaState()`
  - 734 `licValue(l)`
- **751** the books (Økonomi 2, Ø1, 27.10.2026, docs/planer/okonomi/02-design.md)
  - 773 `bookMigrate()`
  - 781 `bookAll(parts, no, en, vid)`
  - 795 `bookResult(y)`
- **797** the bank's accounts (Økonomi 2, Ø3, 27.10.2026; Jonas: «Automatisk skatteavsetning, rente på sparekonto, kassakreditt med
  - 806 `bankS()`
  - 814 `bankMove(k, kr0, no, en)`
  - 817 `bankAfterIncome(inKr)`
  - 825 `taxPay(kr0, no, en)`
  - 828 `bankRelease()`
  - 832 `bankDay(H)`
  - 865 `taxOf(P, form, days, skj = 0, carry = 0)`
  - 875 `saldoOf(v)`
  - 886 `skjOf(frac, ri = 1)`
  - 890 `txInit(H, adv)`
  - 892 `yearFrac(H)`
  - 894 `txProfit(H)`
  - 897 `txNow(H = S.t / 60)`
  - 903 `taxOwed(H = S.t / 60)`
  - 908 `enkAdv(H)`
  - 914 `taxPlan(H = S.t / 60)`
  - 927 `asBase(y)`
  - 931 `txClose(H)`
  - 947 `taxDayMark(H)`
  - 953 `taxFix(H)`
  - 970 `taxTick(H)`
  - 1008 `foundAS()`
  - 1021 `mvaCheck(total)`
  - 1030 `trekkOf(total, len)`
  - 1035 `fmInit()`
  - 1037 `fmLand(total)`
  - 1046 `takeLoan(amount, months, k)`
  - 1050 `payDown(x)`
  - 1056 `deal(price, ti, inn)`
  - 1063 `finance(x, months)`
  - 1066 `lenGroup()`
  - 1067 `codLimits(H)`
  - 1070 `codOpen(H)`
  - 1071 `codLimitNow(H)`
- **1072** haill: luck from the quay. Fresh goods: full effect for two days, fading to nothing on day seven. Sold for real money only (test mode now) or won at the pub.
  - 1090 `haillBoost()`
  - 1091 `haillLeft()`
  - 1092 `haillStage()`
  - 1094 `haillF()`
  - 1095 `luck(sp)`
  - 1097 `giveHaill(type, how)`
  - 1098 `useHaill(type)`
  - 1104 `pubEvening(H)`
  - 1105 `pubOpen(H)`
  - 1108 `capHold()`
  - 1110 `cargoRoom()`
  - 1112 `cargoMin(kg)`
- **1113** the daily login bonus: each real calendar day you open the game adds a point to a bonus on the fish price; each day
  - 1116 `streakState()`
  - 1117 `streakPct()`
  - 1118 `streakTouch()`
- **1129** cold: effective temperature from air temperature and wind, plus wet from rain, snow and spray. Cold, wet hands fish worse;
  - 1133 `effTemp(H)`
  - 1134 `coldPen(H, hs)`
- **1141** orders from buyers and customers: species, amount, quality, deadline and a price premium; reputation builds with each buyer
  - 1156 `gradeOk(g, q)`
  - 1157 `ordState()`
  - 1160 `custNear(c)`
  - 1165 `repOf(id)`
  - 1167 `bkOrderable(H)`
  - 1169 `bkPlant(id)`
  - 1170 `custSp(c)`
  - 1171 `spCatchable(sp, H)`
  - 1173 `ordersTick(H)`

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

## `src/js/core/03c-stability.js` (90 linjer)

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
  - 78 `stabTick(H)`

## `src/js/core/03d-quota.js` (255 linjer)

Quotas for cod, haddock and saithe north of 62° N. The regulation as it stood from 1 October 2026 (J-161-2026, fiskeridir.no)

- **1** Quotas for cod, haddock and saithe north of 62° N. The regulation as it stood from 1 October 2026 (J-161-2026, fiskeridir.no)
  - 20 `norQuota(sp, tac)`
  - 30 `codChain(N)`
  - 37 `tacOf(sp, y)`
  - 40 `yearQuota(y)`
- **54** the closed group: quota lengths the game sells, with J-161-2026's quota factors and quantities (§§ 16, 18, 19). Cod is a fixed
  - 71 `licQ(l, H, len)`
  - 82 `sellerCod(id, H)`
  - 88 `openUsedSave(q)`
  - 90 `openUsedLoad()`
  - 91 `freshQuota()`
  - 92 `licStart(lic)`
- **93** the stocks and the total quotas year by year. History and the advice for 2027 from the Institute of Marine Research (hi.no,
  - 117 `stockYear(sp, y)`
  - 132 `ssbAt(sp, H)`
  - 133 `stockF(sp, H)`
- **135** the open group's season. About 2 100 boats fish the group quota down a day at a time (more in the skrei season and on days
  - 146 `qyOf(y)`
  - 151 `qyStep(Y, y, d)`
  - 168 `quotaNewYear(y)`
  - 171 `qyAt(H)`
  - 173 `codStopDoy(y)`
  - 174 `openMaxAdd(H)`
  - 179 `ffPlan(y)`
  - 187 `ffPct(H)`
- **189** the closed group's register: a fixed number of rights (1 622 in the cod fishery north of 62° N on 17.10.2025, case document
  - 194 `npcReg()`
  - 195 `regTake(id)`
  - 197 `regSeller(id, H)`
- **199** structure quotas (forskrift om spesielle kvoteordninger for kystfiskeflåten, J-244-2025): quota lengths 11–27.99 m may buy a
  - 203 `structRoom(l, id)`
  - 205 `structPrice(id, H)`
  - 206 `structIn(l, id, H)`
  - 207 `licExtra(l)`
  - 209 `structExpire(l, y)`
- **210** the special scheme for quota lengths under 11 m (kap. 2, from 2025): an owner with two such boats, both owned since the year
  - 212 `twoOK(la, lb, y)`
- **213** quota cooperation (J-161-2026 § 31): two closed-group boats under 11 m with different owners; both owners aboard, the passive
  - 217 `coopOffer(H)`
  - 218 `coopOK(l, y)`
- **220** Greenland halibut (blåkveite) for vessels under 28 m (J-241-2025, the regulation for 2026; docs/blakveite.md 2-3, 07.10.2026)
  - 228 `bkSeason(y)`
  - 231 `bkOpen(H)`
  - 237 `bkDirect(H, len)`
  - 239 `bkState(H)`
  - 242 `bkAllow(H, bk, all)`
  - 247 `bkLanded(H, bk, all)`
  - 249 `bkNews(H)`

## `src/js/core/03e-rules.js` (271 linjer)

The rules along the coast (R2 of the rules plan, 05.10.2026). rulesAt() takes a place, a time, the boat's length, the gear and the

  - 28 `ruPip(rings, x, y)`
  - 29 `ruIn(P, x, y)`
  - 34 `ruBlock(bx, by)`
  - 52 `ruBits(p)`
  - 55 `insideFjord(p)`
  - 56 `insideBaseline(p)`
  - 58 `blDist(p)`
  - 64 `ruHom(p)`
  - 70 `landsdel(p)`
  - 71 `ruLok(p)`
  - 73 `ruZone(p)`
  - 74 `ruAt(id, p)`
  - 76 `ruLineName(ref)`
  - 90 `kcQuota(ll)`
  - 94 `rulesAt(q)`
  - 190 `ruBlockMsg(q)`
  - 192 `ruMinSize(sp, p)`
  - 205 `fjordLimits(p, H)`
  - 219 `ruCtx()`
  - 223 `ruNow()`
  - 229 `ruLayerBlock(bx, by, q, budget)`
  - 241 `ruWpQ(w)`
  - 246 `ruWpMsg(w)`
  - 253 `ruOpenNear(p, q, maxKm)`
  - 262 `ruTips()`

## `src/js/core/04-crew.js` (368 linjer)

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
  - 173 `crewEff(c, H, hs, g = 'juksa')`
- **180** what lifts or drags a person's effort just now, besides what they can and who they are (Jonas 23.10.2026: «dette skal være dynamisk
  - 186 `crewDrive(c, H, hs)`
  - 207 `crewEffort(c, H, hs)`
- **214** samhold: how the crew aboard pull together (Jonas 23.10.2026: «Samhold ja, men det må gjøres intuitivt»), 0-100 per vessel (S.team,
  - 219 `crewTeam()`
  - 224 `teamHour(H, on, hs, food)`
  - 243 `teamLine()`
  - 251 `teamEff(team, me = true, g = 'juksa')`
  - 253 `compat(a, b)`
  - 266 `crewById(id)`
  - 269 `holdNet()`
  - 278 `crewSettle(c)`
  - 287 `crewQuit(c, why, whyEn)`
  - 290 `borsTick(H)`
  - 298 `crewRumour()`
  - 300 `crewTick(H)`
  - 366 `codRoom(H)`

## `src/js/core/05-vessels.js` (973 linjer)

---------- other vessels (deterministic, so every player sees the same traffic) ----------

- **1** other vessels (deterministic, so every player sees the same traffic)
  - 4 `prepRoute(r)`
  - 5 `atRoute(R, s)`
  - 24 `hashStr(t)`
  - 26 `berthSlot(q, key, big)`
  - 39 `berthShift(p, key, big)`
  - 45 `fleetState(i, H)`
  - 56 `fleetState0(i, H)`
- **84** the NPC traffic along the coast (part 5 of the coast-wide plan, 03.10.2026; the user: full traffic along the coast, but only
  - 100 `coastWay(b, moored, m0)`
  - 123 `coastCells(a, z)`
  - 139 `coastWayAt(w, u, back)`
  - 146 `coastState(b, H, hod = hodOf(H)`
- **171** where a coast boat lies at home (Jonas 18.10.2026: «npc-båter mange plasser er plassert i landmassen når de ligger ved kai»;
  - 181 `moorBlocked(x, z, r)`
  - 190 `moorFree(p, hd, L, B, others)`
  - 209 `docksIn(x0, z0, x1, z1)`
  - 210 `dockFree(d, others, placed)`
  - 227 `moorAround(h, p)`
  - 230 `moorHarbour(h)`
  - 288 `coastMoor(b)`
  - 298 `seaward(p, c)`
  - 300 `coastSpot(gr, dI, i)`
  - 303 `coastCast(b, gr, dI, i, kc, Hc, spot)`
  - 318 `coastNear(H, only)`
  - 339 `npcStates(H, only)`
  - 387 `peerName(s)`
  - 388 `peerStates()`
  - 401 `newState()`
  - 412 `log(no, en, k)`
  - 414 `navHour()`
  - 421 `nearestPort(p)`
  - 423 `nearestYard(p)`
  - 425 `step()`
  - 443 `vesselStep(H)`
  - 523 `sailV(H, hs)`
  - 535 `sail(H, W, hs)`
  - 561 `sailReplan(pl, b, gp)`
  - 586 `sailStop(pl, b, why)`
  - 594 `haltPlan(need)`
  - 604 `arrive(w)`
  - 622 `unstuckWhy()`
  - 628 `unstuckSpot()`
  - 635 `unstuck()`
  - 649 `dock(pid, berth)`
  - 674 `catchFactors(H, W, hs)`
  - 684 `fish(H, W, hs)`
  - 755 `endFishing(why)`
  - 770 `addCatch(sp, kg, cls, hook, opt)`
- **783** work on deck: gutting and icing take hands and time
  - 796 `deckHands()`
  - 799 `deckPending()`
  - 800 `deckEta(hands)`
  - 805 `moveKg(x, kg, patch)`
  - 813 `iceMinute()`
  - 815 `deckMinute()`
  - 833 `risk(W, hs)`
  - 860 `hullRepair()`
  - 863 `svcOverdue()`
- **864** the rescue boat (plan E3, 05.10.2026)
  - 884 `rescueBases()`
  - 893 `rescueBase(p)`
  - 900 `rescueAis(H)`
  - 904 `rescue(keepCatch)`
  - 928 `towSea(p)`
  - 933 `towRoutes(b)`
  - 944 `towStep(H)`
  - 956 `towDone(t)`
  - 962 `towPose(frac)`

## `src/js/core/05c-air.js` (64 linjer)

---------- aircraft over the coast (plan E4, 05.10.2026) ----------

- **1** aircraft over the coast (plan E4, 05.10.2026)
  - 35 `airLegs()`
  - 47 `airStates(H, p, km)`

## `src/js/core/06-services.js` (252 linjer)

---------- services behind the phone ----------

- **1** services behind the phone
  - 3 `coverage(p)`
  - 4 `msg(from, no, en)`
  - 7 `radio(no, en)`
  - 8 `radioForecast(H)`
  - 21 `hourly()`
  - 51 `skipPort(i)`
  - 55 `weekOf(H)`
  - 56 `npcWeekKg(i, w)`
  - 61 `myKg(H0, H1)`
  - 62 `toplist(w)`
  - 71 `newsForDay(day)`
- **138** standing operations plan: a hired skipper runs a saved route on set days, lands the catch and restocks
  - 140 `autoRestock()`
  - 149 `depart()`
  - 171 `finishJob(j)`
  - 194 `fitHours(k)`
  - 197 `jobOk(j)`
  - 202 `queueJob(j)`
  - 205 `jobsDone()`
  - 211 `shelterReturn(W, hsOver)`
  - 230 `startReturn(auto, W, home, hsOver, opsKeep)`
- **250** CORE END

## `src/js/core/06b-coastports.js` (100 linjer)

the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan)

- **1** the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan)
- **18** the registration mark (Malerverkstedet, 07.10.2026): the county's letters, a serial number and the municipality's letters,
  - 27 `regLetters(pt)`
  - 33 `regUsed(f, k, n)`
  - 34 `regOf(b)`
  - 94 `plantsNear(p, n = 10)`

## `src/js/core/06c-steder.js` (43 linjer)

the tackle shops and the yards along the coast: the other two places of trade (07.10.2026)

- **1** the tackle shops and the yards along the coast: the other two places of trade (07.10.2026)
  - 32 `portServices(pt, berth)`
  - 39 `placesNear(p, kind, n = 3)`

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

## `src/js/core/06g-plan2.js` (279 linjer)

Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.

- **1** Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.
  - 24 `p2Units(kind, lk)`
  - 30 `p2Left(o, q)`
  - 32 `p2LineKind(o)`
  - 38 `plan2New(over)`
  - 46 `plan2Ops()`
- **54** the places: a point, a port, or a key ('H' home, 'Q' the home quay, 'M' the plant, 'A' the rest anchorage)
  - 55 `plan2P(o, k)`
  - 64 `plan2LegH(o, a, ap, b, bp, v)`
- **71** the state the day is reckoned from: where she lies, the hold, the gear in the sea and aboard, the crew, you. Tests pass their own
  - 72 `plan2State(o)`
  - 85 `plan2RestOk(pid)`
  - 87 `plan2Ready(kind, st, lk)`
  - 89 `plan2NextDep(o, H, from)`
  - 97 `plan2Watch(H)`
  - 98 `plan2Roles(st)`
- **104** the day. H0: the hour the day begins (the departure). Returns {t0, steps:[{t, k, …}], end, why:[no, en], skipped:[{id, no, en}]}.
  - 107 `planDay(o, H0, st)`
- **215** the day as text: [[clock, no, en], …], one line a step, the skipped places and the reason last
  - 216 `planDayText(o, day)`
- **241** the check: errors keep the plan from being switched on, warnings only inform (as driftCheck; the rhythm's rules from Jonas 26.10.2026)
  - 242 `plan2Check(o, st)`

## `src/js/core/06h-plan2-engine.js` (371 linjer)

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
  - 88 `plan2Resume(o)`
  - 90 `plan2CrewWhy(o)`
  - 100 `plan2Wx()`
  - 101 `plan2WxAhead(o, H, dur, pts)`
  - 109 `plan2WxWait(o, wx, H)`
  - 116 `plan2WxFirstOk(o, H, dur, pts)`
- **117** shelter without a search (part 3): back the way she came to the last place or port she passed, and from a place the kept leg to its
  - 120 `plan2Shelter(W, hsOver)`
  - 143 `plan2Cut(o, why)`
  - 155 `plan2RulesWhy(o, H, placesOnly)`
  - 162 `plan2RulesOpenAt(o, H)`
- **163** the engine: each minute, on each vessel (06d-drift.js opsStep hands over with DRIFT2 on)
  - 165 `plan2Step(H)`
  - 179 `plan2Decide(o, H)`
  - 204 `plan2Boundary(o, H)`
  - 217 `plan2NewDay(o, H)`
  - 229 `plan2CostDay(o, r)`
  - 230 `plan2StatDay(o, d)`
- **231** a trip: the steps from i0 to the next port call, as waypoints on the kept legs
  - 232 `plan2Trip(o, D, i0)`
  - 260 `plan2Go(o, H, i0)`
  - 300 `plan2Sea(o, H)`
  - 320 `plan2Landed(pid, k)`
  - 328 `plan2Report(pid, kg, total, landed)`
  - 340 `plan2Bait(o)`
  - 351 `plan2Egn(o, s)`
  - 358 `plan2WatchTick(H)`

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

## `src/js/core/07-harbours.js` (403 linjer)

harbours: quays, berths and mooring

- **1** harbours: quays, berths and mooring
  - 24 `unitDredge(p, d)`
  - 34 `quayFace(pid, kind)`
- **65** the NPC boats' berths at the quays of the map data (part 4 of the coast-wide plan; the user's wish 03.10.2026: the quays made
  - 74 `quayFree(f)`
  - 86 `hullDry(p, hd, L, B)`
  - 91 `npcBerths(group, p, boats, R = 0.6)`
  - 123 `clearLine(a, b)`
  - 126 `quayLand(q)`
  - 127 `quayLandLine(a, b)`
  - 128 `approachPath(pt)`
  - 168 `exitWps(pt, to)`
  - 169 `entryWps(pt, from)`
  - 179 `berthPose(pid, type, kind = 'main')`
- **207** the way in to a berth and out of it (the user's list 04.10.2026: «legge til og fra kai uten å gå gjennom landmasse og
  - 212 `berthBlocked(p, m = 2)`
  - 221 `berthClear(a, b, m)`
  - 222 `berthPath(from, bp)`
- **247** landing the catch
  - 253 `landPlan(type, kg)`
  - 258 `landState(L, t)`
  - 267 `mottakOpen(H)`
  - 269 `mottakNext(H)`
  - 271 `mottakWhen(H, no)`
  - 277 `startLanding(ops)`
  - 288 `finishLanding()`
  - 295 `iceChute(kg)`
- **297** the bunker quay: moving along the harbour and filling fuel
  - 307 `quayPos(b)`
  - 316 `portBusy(b)`
  - 317 `startShift(to, after)`
  - 327 `startFueling(ops)`
  - 340 `quayMinute()`
  - 356 `buyIce(kg, free)`
- **366** the tackle shop on the quay, in every harbour: hand jig, ice and halibut gear
  - 372 `shopBuy(k, kg, free)`

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

## `src/js/core/07e-havn.js` (265 linjer)

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
  - 168 `havnMoor(h)`
  - 171 `havnPlaceOf(H, b, type)`
  - 181 `havnPrune(keep)`
  - 188 `havnFace(pid)`
  - 190 `havnFind(p, r, type)`
  - 196 `havnTapNear(pt, r)`
  - 201 `havnOptions(p, r, type)`
- **206** held: the berth is the vessel's while she lies there, or while it is her plan's home (06d-drift.js o.home)
  - 207 `havnHold(id)`
  - 211 `havnFree(id)`
  - 219 `havnMinute()`
  - 227 `havnBlocked(x, z, r)`
- **232** the server (D: «Serveren holder rede på hvem som ligger hvor»): what the others hold in a harbour, asked at most every two minutes;
  - 235 `havnCloud()`
  - 236 `havnAsk(hid)`
  - 245 `havnPut(id, s)`
  - 253 `havnRenew()`
  - 254 `havnDrop(id)`
  - 255 `havnMoved(id)`

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

## `src/js/core/09b-records.js` (40 linjer)

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

## `src/js/core/09d-folk.js` (149 linjer)

the people on the quay (05.10.2026; Jonas chose it from the list of what makes people play on, 7)

- **1** the people on the quay (05.10.2026; Jonas chose it from the list of what makes people play on, 7)
  - 25 `folkState()`
  - 29 `folkPf(id)`
  - 31 `folkSold(id, kg)`
- **39** the plant's hands comment on the landing (Jonas 08.10.2026: «arbeiderne på fiskemottakene kommenterer fangsten vår med tekst over
  - 98 `plantLine(pt, ls, rnd)`
  - 116 `plantSay(pt, ls)`
  - 126 `folkShop()`
  - 133 `folkPort(H)`

## `src/js/core/09e-fartstid.js` (54 linjer)

Fartstid: years at sea, 0 to 40 (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1)

- **1** Fartstid: years at sea, 0 to 40 (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1)
  - 12 `fsNeed(n)`
  - 14 `fsOf(p)`
  - 20 `fsSeed()`
  - 24 `fsState()`
  - 25 `fsText(p, long)`
  - 29 `fsAdd(pts, aboard)`
  - 37 `fsYear(y)`
  - 44 `fsMinute()`
  - 51 `fsLand(total)`
  - 53 `fsRested(realMs)`

## `src/js/core/09f-merker.js` (210 linjer)

Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)

- **1** Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)
  - 22 `achVisits()`
  - 23 `achVisitPort(pid)`
  - 83 `achState()`
  - 99 `achAdd(k, n)`
  - 100 `achSale(total, sps)`
  - 101 `achCatch(sp, cls)`
  - 103 `achMinute()`
  - 112 `achTripEnd(bad)`
- **114** the gifts: what fits the player now, in three tiers (seven in ten common, two good, one rare), bigger in later chapters
  - 116 `achPool(scale)`
  - 140 `achDraw(key, scale)`
  - 148 `achGive(key, scale, title)`
- **157** checking: each milestone in an open chapter, the chapters' own rewards, and the long badges
  - 159 `achCheck(quiet)`
  - 187 `achChapter(ch)`
  - 197 `achSeed()`
- **208** the first tow and the first repair are free (core/05-vessels.js rescue, hullRepair)
  - 209 `freeFirst(k)`

## `src/js/core/09g-turer.js` (984 linjer)

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
  - 722 `turMake()`
  - 748 `turEnsure(force)`
  - 769 `turWay()`
  - 776 `turDetour(m, way = turWay()`
- **788** taking, doing and finishing
  - 789 `turTake(id)`
  - 817 `turDrop(id)`
  - 822 `cargoJob(kg, no, en)`
  - 823 `turLoad(m)`
  - 832 `turSpawn(m)`
  - 851 `turEnd(m, ok, why, how)`
  - 869 `turPayOut(m, from, no, en, part)`
  - 877 `turDock(pid)`
  - 891 `turSale(pid, bySp)`
  - 904 `turHauled(s)`
  - 908 `turHour()`
  - 927 `turWhat(m)`
- **939** the trip as it starts: when it will be there, and a word from the crew (or the memory of Father, alone aboard)
  - 953 `turSay(who, no, en, k)`
  - 958 `turDepart()`
  - 978 `turMechanic()`

## `src/js/core/09h-press.js` (228 linjer)

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
  - 226 `pressUnread()`
  - 227 `pressSeen()`

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

## `src/js/core/10-gear.js` (698 linjer)

passive gear: nets, line and pots that stand in the sea while the boat is away

- **1** passive gear: nets, line and pots that stand in the sea while the boat is away
  - 49 `kingArea(p)`
  - 55 `newPGear()`
- **56** bait (the user's list 04.10.2026): five kinds, each good for its own. Krabbe is the cheapest and fair on everything; reke is for
  - 76 `jigTake(sp, H, tackle)`
  - 81 `baitMixF(w, sp)`
  - 83 `baitOf(pg)`
  - 85 `btOf(L0)`
  - 87 `baitPick(pg, kg)`
  - 89 `baitFromHold(sp, kg)`
  - 101 `setLog(s, no, en, k)`
  - 102 `mySets(vid)`
  - 103 `hasHauler(kind)`
- **105** the rig: a boat is rigged for one kind of fishing at a time. Jigging needs a hand jig or reels; line and pots
  - 111 `rigGuess()`
  - 116 `rigOf()`
  - 122 `gearReserve()`
  - 126 `rigHas(r)`
  - 129 `rigWrong(kind)`
  - 131 `rigBlock(r)`
  - 142 `rigSet(r)`
- **144** what the vessel owns: aboard, ashore (baiting, mending) and in the sea
  - 145 `ownedUnits(kind)`
  - 152 `gearRoom(kind)`
- **154** buying (in port)
  - 157 `buyGate(what, spec)`
  - 169 `buyGear(what, spec, n)`
  - 199 `joinNets(id1, id2)`
  - 200 `splitNets(id, n)`
- **202** rules for setting at a place
  - 204 `segDist(p, a, b)`
  - 205 `nearSet(p, km)`
  - 206 `gearRules(kind, spec, p)`
  - 234 `setGeom(p, hdg, km)`
  - 241 `setGeomExact(p, hdg, km)`
- **243** the work at sea: status stays 'fishing' with b.gop, so deck work, rest rules, auto-return and the tub pause work as before
  - 244 `gopUnitMin(g, H, hs)`
  - 258 `startSet(kind, spec, fishAfter, hdg)`
  - 279 `startHaul(sid, reset, fishAfter)`
  - 298 `endLines(op, kind, d)`
  - 301 `thiefOf(s)`
  - 311 `haulSlow(g)`
  - 316 `gearOpMinute(H, W, hs)`
  - 334 `finishSet(g, H)`
  - 344 `gopEnd(g)`
  - 346 `gopAbort(why)`
  - 364 `gearBack(s, n, cond, W)`
  - 371 `wearNets(s, g)`
  - 380 `haulUnit(g, H, SL)`
  - 397 `landFish(sp, kg, key, mesh, p, H, hook, fresh, g)`
  - 411 `netLen(w)`
  - 412 `retain(sp, key, mesh, w)`
  - 418 `sampleSel(sp, key, mesh, p, H)`
  - 421 `landCrabs(g, n, kg)`
  - 432 `finishHaul(g, H)`
- **466** a station on a route or the standing plan: haul what stands here and set it again, or set new gear if nothing stands here.
  - 469 `cycleSpec(kind, want, n)`
  - 482 `gearCycle(w, fishAfter)`
  - 498 `opsGearNeeds(o)`
  - 508 `opsGearAfter()`
- **514** in the sea, every hour: catch, losses, weather and deadlines (company level)
  - 515 `soakHour(s, H)`
  - 542 `gearHour(H)`
  - 573 `reportLost(sid)`
  - 581 `netMended(l)`
- **582** in port: baiting at the shed or by the crew, mending by the crew or at the net loft in Finnsnes
  - 588 `egnOrder(lk, n, bait)`
  - 602 `egnHands()`
  - 611 `egnSelf(lk, n, bait)`
  - 632 `stripSelf(lk, bait, n, then)`
  - 646 `mendSelf(nid)`
  - 657 `botOrder(nid)`
  - 668 `gearJob(j)`
  - 680 `gearJobCancel(j)`
  - 687 `shoreTick()`

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

## `src/js/core/11-route.js` (496 linjer)

---------- Autonav (once «Følg leia»): a route along the fairway ----------

- **1** Autonav (once «Følg leia»): a route along the fairway
  - 34 `leiaTideCredit(a, b)`
  - 47 `leiaGrid(x0, y0, x1, y1, c, mask)`
  - 54 `leiaRocks(G)`
  - 63 `leiaShore(G, p)`
  - 73 `leiaCost(G, v, sd)`
  - 89 `leiaNearCell(G, p, sd, km = 1, free)`
  - 96 `leiaHeap()`
  - 104 `leiaSlice(st, t0, at)`
  - 107 `leiaSearch(G, s, t, sd, st)`
  - 136 `leiaFind(from, to, sd, st)`
  - 150 `leiaFind1(from, to, sd, st, pad, c0)`
  - 177 `leiaCorridor(pp, R, c, sd, st)`
  - 193 `leiaCorridor1(pp, bb, R, c, sd, st, first, last)`
  - 208 `leiaLegOk(p, q, sd, margin)`
  - 227 `leiaLegFail(p, q, tick, endP, endQ, strict)`
  - 242 `rockOnLeg(a, b, r)`
  - 251 `leiaMend(P, sd, st, strict)`
  - 292 `leiaStraighten(P, sd, margin, st)`
  - 319 `leiaPull(P, sd, st)`
  - 340 `leiaRoute(a, b, aPort, bPort, opt)`
  - 355 `leiaLane(p, goal, km)`
  - 386 `leiaPocket(p, sd)`
  - 403 `leiaPocketOut(e, sd, st)`
  - 413 `leiaRoute0(a, b, aPort, bPort, pocket, opt0)`

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

## `src/js/core/11c-leinett.js` (98 linjer)

---------- The fairway network (step 2 of the coast-wide Autonav, 08.10.2026) ----------

- **1** The fairway network (step 2 of the coast-wide Autonav, 08.10.2026)
  - 26 `lnetNear(p, km, max)`
  - 32 `lnetAhead(p, q, km, max, skip)`
  - 38 `lnetPath(srcs, dsts)`
  - 53 `lnetLoad(P)`
  - 61 `lnetAccess(p, i, sd, st, straight)`
  - 76 `lnetRoute(from, to, sd, st)`

## `src/js/core/12-heat.js` (127 linjer)

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
  - 104 `heatWork()`
  - 123 `heatAt(p)`
  - 126 `schoolDrift(sp)`

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

## `src/js/core/16b-dyn.js` (514 linjer)

HOW THE BOAT MOVES: a manoeuvring model (Fysikk 1; Jonas 18.10.2026)

- **1** HOW THE BOAT MOVES: a manoeuvring model (Fysikk 1; Jonas 18.10.2026)
  - 27 `dynPar(V)`
  - 52 `dynInt(P, s, thr, rud, h, capF, E)`
  - 87 `dynMove(s, h)`
  - 93 `dynThrEq(P, u, capF)`
- **94** the calibration: measured on the model itself, once a vessel
  - 95 `dynTurn(P, V, u0 = V.vcruise * KN_MS)`
  - 106 `dynAccel(P)`
  - 112 `dynStops(P)`
  - 116 `dynCal(key)`
  - 140 `dynStopDist(cal, v)`
  - 144 `dynVStop(cal, d)`
- **145** the wind and the sea on her this tick (Fysikk 2)
  - 158 `dynEnv(b, d, cal, H, dtG = 0)`
- **185** contact: the hull against the piers, the breakwaters and the harbour units' quays (Fysikk 2)
  - 194 `dynObsNear(X, Y, R)`
  - 201 `dynInside(O, x, z)`
  - 212 `dynContact(b, d, P, O)`
- **238** with no way on: she drifts (Fysikk 2)
  - 244 `dynDrift(type, p, H)`
  - 262 `lieDrift(H)`
- **285** the state, in step with the boat the rest of the game reads
  - 286 `dynState(b)`
  - 297 `dynWrite(b, d)`
  - 302 `dynCan()`
  - 307 `dynLive()`
  - 312 `dynPose()`
  - 319 `dynRest()`
  - 320 `dynLivePose(frac)`
  - 322 `dynHaltNeed()`
- **323** the tick
  - 324 `dynTick(dt)`
  - 337 `dynMinute(H, W)`
- **344** by hand (16-helm.js): the throttle and the rudder into the model
  - 345 `dynHelm(d, dtG)`
- **363** the line she follows: out from the quay, the route's waypoints as the chart plotter draws them, to the harbour she ends in
  - 365 `dynLineBuild(pl, dep)`
  - 385 `dynLineAt(T, s)`
  - 391 `dynSeg(T, s)`
  - 392 `dynSegHd(T, i)`
  - 393 `dynLineProj(T, x, z, s0, back = 30)`
  - 403 `dynLineHd(T, s, r0)`
  - 410 `dynGroundAhead(T, s, look)`
- **419** the autopilot
  - 420 `dynAuto(d, dtG)`
  - 513 `dynTrackView()`

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

## `src/js/ui/01-i18n.js` (113 linjer)

---------- i18n ----------

- **1** i18n
  - 110 `t(k, ...a)`

## `src/js/ui/02-format-state.js` (169 linjer)

---------- formatting ----------

- **1** formatting
  - 3 `dayKey(d)`
  - 4 `dayNum(k)`
  - 5 `fmt(n, d = 0)`
  - 6 `kr(n)`
  - 13 `cashFx(delta)`
  - 36 `realMin(gameMin)`
  - 37 `realDur(gameMin)`
  - 43 `inReal(gameMin)`
  - 45 `whenTxt(T)`
  - 46 `dur(h)`
  - 50 `hm(H)`
  - 51 `dayStr(H)`
  - 52 `clockStr(H)`
  - 53 `coordStr(p)`
  - 59 `dirName(deg)`
- **62** persistence
  - 74 `tabMark()`
  - 75 `tabMine()`
  - 81 `tabLose()`
  - 91 `save()`
  - 94 `migrateV2(o)`
  - 106 `load()`
- **126** UI state
  - 135 `toast(msg, ms)`
  - 147 `saveCode()`
  - 155 `codeRead(code)`
  - 163 `loadCode(code)`

## `src/js/ui/03a-chart.js` (147 linjer)

THE CHART'S VECTORS (phase K7 of the coast plan): the coast by level of detail, the graticule and the place names

- **1** THE CHART'S VECTORS (phase K7 of the coast plan): the coast by level of detail, the graticule and the place names
  - 12 `vReader(b)`
  - 20 `vecPath(v, sc, tol)`
  - 34 `chartPath0(px)`
  - 39 `vecPathsIn(v, sc, r)`
  - 51 `chartPathsIn(pk, r)`
  - 52 `chartPath(pk, lv, px)`
  - 55 `chartCoast(ctx, x0, y0, kx, ky, W, H, dpr, fish)`
  - 83 `fmtDM(v, pos, neg)`
  - 87 `chartGrid(ctx, x0, y0, kx, ky, W, H, dpr, fish)`
- **108** the place names
  - 111 `chartNamesOf(pk, entry, sc, ox, oy)`
  - 124 `chartNamesSvg(vx0, vy0, vx1, vy1, u, taken, part)`

## `src/js/ui/03-map.js` (699 linjer)

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
  - 107 `chartWork()`
  - 118 `chartFlush()`
  - 124 `chartTile(V, i, j, q)`
  - 140 `chartWant(V)`
  - 148 `chartPump()`
  - 158 `chartLoadLine()`
  - 164 `chartWarm(wps)`
  - 171 `chartWarmNext()`
  - 175 `chartCame(pk)`
  - 190 `ruLayerCanvas(A)`
  - 199 `chartVectors(V, again)`
  - 235 `chartRaster(d, PW, PH, x0, y0, pkx, pky, V, st)`
  - 322 `scheduleChart()`
  - 325 `renderBase()`
  - 339 `updateMapButtons()`
  - 350 `renderStatic()`
  - 418 `portIcon(p, s, u)`
  - 433 `soundingsSvg(vx0, vy0, vx1, vy1, u, taken)`
  - 452 `scheduleStatic()`
  - 457 `aisTrack(id, H)`
  - 460 `aisInfo(n)`
  - 473 `renderAisCard()`
  - 474 `renderDyn()`
  - 552 `pinAdd(mp)`
  - 557 `pinOpen(id, fresh)`
  - 577 `pinKb()`
  - 608 `ptrUp(e)`
  - 638 `unzoom()`
  - 645 `portByLabel(pt)`
  - 650 `addWaypoint(pt)`

## `src/js/ui/03b-route.js` (219 linjer)

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
  - 188 `deepNear(p, maxKm)`
  - 198 `leiaStops()`
  - 203 `leiaCompare()`

## `src/js/ui/03g-planmap.js` (113 linjer)

Driftsplan 2, part 6: the chart plotter in plan mode (docs/planer/driftsplan-2/02-design.md 4.2). «Velg i kartet …» on the

- **1** Driftsplan 2, part 6: the chart plotter in plan mode (docs/planer/driftsplan-2/02-design.md 4.2). «Velg i kartet …» on the
- **81** the chart: a tap adds a place or opens a pin's card; a pin dragged moves (03-map.js pointer handlers)

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

## `src/js/ui/03d-setmode.js` (84 linjer)

---------- «Sett ut»: draw the gear on the chart as a line out from the boat, as long as the gear is, and confirm ----------

- **1** «Sett ut»: draw the gear on the chart as a line out from the boat, as long as the gear is, and confirm
  - 9 `setEnd()`
  - 10 `setLabelNow()`
  - 19 `setWhy()`
  - 28 `setModeStart(c)`
  - 39 `setModeFrame()`
  - 46 `setSvg(u)`
  - 57 `setAim(mp)`
  - 58 `setCount(d)`
  - 59 `renderSetBar()`
  - 73 `setModeEnd(go, stay)`

## `src/js/ui/03e-miniplot.js` (92 linjer)

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

## `src/js/ui/04-panels-instruments.js` (193 linjer)

---------- estimates ----------

- **1** estimates
  - 2 `estimate()`
- **11** panels
  - 13 `renderTabs()`
  - 16 `setTab(k)`
  - 19 `statusText()`
  - 32 `nextEvent()`
  - 50 `setHtml(el, h)`
  - 52 `renderHud()`
  - 90 `liveFrac()`
  - 91 `livePose(frac)`
  - 112 `vnoise2(x, y, s)`
  - 118 `microBottom(p, d)`
- **120** instruments: GPS and echo sounder
  - 182 `hudClasses()`
  - 188 `hudFold(which)`

## `src/js/ui/05-tattoo-art.js` (169 linjer)

---------- sailors' tattoos: the flash and the seated sailor they go on ----------

- **1** sailors' tattoos: the flash and the seated sailor they go on

## `src/js/ui/phone/00-shell.js` (59 linjer)

---------- the phone ----------

- **1** the phone
  - 58 `setBadge()`

## `src/js/ui/phone/01-haill-fiske-service.js` (112 linjer)

--- workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port

- **1** workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port
  - 2 `haill()`
- **23** the tackle shop on the quay: a purchase takes two taps, the second one confirms the price
  - 28 `fiske()`
  - 41 `service()`
  - 62 `iceCard()`
  - 72 `verksted()`

## `src/js/ui/phone/02-havn-last-agn-ordre.js` (48 linjer)

the old tabs live on as phone apps

  - 2 `havn()`
  - 3 `last()`
- **4** the pages of the dock's drawer (ui/10c-dock.js): the market, the village and the yard in port, the inventory everywhere
  - 5 `lever()`
  - 6 `isApp()`
  - 8 `agn()`
  - 31 `oppdrag()`
  - 32 `ordl()`
  - 37 `ordlBest(tabs)`

## `src/js/ui/phone/03-regler.js` (60 linjer)

the Regler app (R3 of the rules plan, 05.10.2026): «Her og nå» answers «can I fish here?» for your boat, gear and target where she is,

  - 8 `ruList(r)`
  - 11 `ruWhere(p)`
  - 17 `ruGrid(p, len, H, hand)`
  - 21 `ruChk()`
  - 23 `ruHere()`
  - 29 `ruCheck()`
  - 44 `ruLearn()`
  - 54 `regler()`

## `src/js/ui/phone/04-kvote.js` (64 linjer)

the Kvote app: your quotas, the open group's season, the stocks, and the market for rights (core/03d-quota.js)

  - 2 `kvote()`
  - 8 `kvOpen(H)`
  - 25 `kvStock(H)`
  - 43 `kvMkt(H)`

## `src/js/ui/phone/05-rigg-innst-admin.js` (78 linjer)

the rig: one kind of fishing at a time, changed here aboard (under Beholdning) when none of the boat's gear is in the sea

  - 2 `rigg()`
  - 13 `beholdning()`
  - 20 `logg()`
  - 21 `innst()`
  - 59 `admin()`

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

## `src/js/ui/phone/07-patch.js` (803 linjer)

--- the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened

- **1** the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened
  - 796 `patch()`

## `src/js/ui/phone/08-home-papers-merker.js` (93 linjer)

  - 1 `home()`
  - 20 `nearHint(kind)`
- **24** the seaman's life: the tattoos you have earned, and the old ways at sea you have heard of
  - 25 `tattoos()`
  - 43 `papBladB()`
  - 48 `papPermit()`
  - 53 `papKv()`
  - 59 `papBiz()`
  - 65 `fsChip()`
  - 67 `fsCard()`
  - 74 `merker()`
  - 85 `lore()`

## `src/js/ui/phone/09-vaer-post-salg-redning.js` (139 linjer)

--- weather

- **1** weather
  - 2 `sunTimesOld(H)`
  - 3 `vaer()`
- **22** newspaper
  - 24 `post()`
- **30** sales organisation
  - 34 `salg(s)`
- **120** rescue
  - 121 `redning()`
- **138** vessels: my vessel overview and the market

## `src/js/ui/phone/10-fartoy.js` (145 linjer)

  - 10 `goals()`
  - 25 `goalsCard()`
- **30** the boat market: tabs for the open group, boats with a closed-group right, the coastal fleet over 11 m and the ocean fleet;
  - 39 `mkCard(k, O)`
  - 43 `market()`
  - 67 `specSecs(k, O)`
  - 91 `sheet(k, O)`
  - 124 `fartoy(tab0)`
- **144** the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)

## `src/js/ui/phone/11-rederi.js` (70 linjer)

  - 6 `selRow()`
  - 8 `vSummary()`
  - 32 `rederi()`
- **69** equipment

## `src/js/ui/phone/12-utstyr-redskap.js` (162 linjer)

the yard's upgrades (hold, engine, the antifouling coat and the outboard) or the shop's (electronics, haulers, the jigging machine and the clothes)

  - 2 `utstyr(mode)`
- **34** gear: in the sea, aboard (baiting and mending), and the shop
- **35** gear care (core/10b-gearcare.js): the condition of the gear aboard, and what the crew can do about it in port
- **40** a line kind as it stands (Jonas 20.10.2026, tilbakemelding #74: «hva båten har slags fiskeredskaper ombord og hva disse eventuelt er
  - 44 `lineCard(lk, o)`
  - 69 `egnChooser(lk, o)`
  - 93 `careAboard(inPort, p)`
  - 117 `redskap(tab0)`

## `src/js/ui/phone/13-mannskap-bank-meld.js` (175 linjer)

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

## `src/js/ui/phone/14-act.js` (255 linjer)

  - 2 `act(a, d)`
  - 8 `act0(a, d)`

## `src/js/ui/05b-work.js` (136 linjer)

the Mannskap page in the drawer (once «Arbeid»): the samhold on top, «På dekk nå» as chips of who stands where, and one card per

- **1** the Mannskap page in the drawer (once «Arbeid»): the samhold on top, «På dekk nå» as chips of who stands where, and one card per
- **31** «På dekk nå» (Jonas 23.10.2026: brikker): who stands where, nothing to tap, and in one line what waits on deck
  - 110 `energyUi()`

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

## `src/js/ui/05d-plan2.js` (304 linjer)

Driftsplan 2, part 5: the page (docs/planer/driftsplan-2/02-design.md 4.1). The day first («I dag» with where she is now, or the

- **1** Driftsplan 2, part 5: the page (docs/planer/driftsplan-2/02-design.md 4.1). The day first («I dag» with where she is now, or the
- **22** Nå: the step she is on and when it ends, what she waits for and until when, or why she stopped
- **43** the day: today's as the engine follows it (with «← nå»), or the next as planDay reckons it from the answers
- **66** Hjem
- **83** Redskap
- **93** Plasser: the list in the order she works them
- **133** Levering
- **148** Vær
- **157** Rytme
- **168** Mannskap
- **180** the top: Start or Pause, Nå, and the button that fixes a stop
- **198** the statistics (R9): today, the last seven days, and all
- **213** the page
  - 298 `plan2Copy(vid)`

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

## `src/js/ui/05g-press.js` (75 linjer)

---------- Kystposten on the phone (core/09h-press.js): the front page and the local tab, a story to read on, the unread count on

- **1** Kystposten on the phone (core/09h-press.js): the front page and the local tab, a story to read on, the unread count on
  - 6 `pressImg(s, small)`
  - 13 `pressPage(local)`
  - 26 `pressArticle(s)`
  - 31 `pressFind(key)`
  - 33 `pressNotify(s)`
  - 40 `pressFlush()`
  - 51 `pressFetch(force)`
  - 66 `pressSkreiFetch()`
  - 74 `pressStart()`

## `src/js/ui/06-logbook.js` (115 linjer)

---------- deck log ----------

- **1** deck log
  - 7 `longDate(day)`

## `src/js/ui/06b-book-tabs.js` (161 linjer)

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
  - 153 `bookTabPages(t)`

## `src/js/ui/06c-notebook.js` (44 linjer)

Father's naust: setting it to rights and the trophy wall (core/07c-naust.js, core/09b-records.js)

- **1** Father's naust: setting it to rights and the trophy wall (core/07c-naust.js, core/09b-records.js)

## `src/js/ui/06d-season-folk.js` (76 linjer)

the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js)

- **1** the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js)

## `src/js/ui/06e-feedback.js` (252 linjer)

Tilbakemelding: the players' feedback on the phone (05.10.2026)

- **1** Tilbakemelding: the players' feedback on the phone (05.10.2026)

## `src/js/ui/06f-fishguide.js` (170 linjer)

the phone's Fiskeguide app (08.10.2026; Jonas: «en intuitiv app til telefonen der spillere kan gå inn å lese kjapt om hvor de burde

- **1** the phone's Fiskeguide app (08.10.2026; Jonas: «en intuitiv app til telefonen der spillere kan gå inn å lese kjapt om hvor de burde
- **74** the gear (20.10.2026: read from the model, as it fishes): how much each takes of the species against the plain jig (1). The jig
- **100** the month view
- **116** the year view
- **124** the species card

## `src/js/ui/07-guide.js` (379 linjer)

  - 1 `renderClock()`
  - 10 `mottakShut()`
  - 11 `chartMode()`
  - 13 `chartNight()`
  - 15 `echoSettings()`
  - 24 `chartSettings()`
  - 32 `panelRoute()`
  - 114 `echoSvg()`
  - 132 `panelFish()`
  - 154 `valueEst(sp, g)`
  - 155 `panelHold()`
  - 171 `fcChart()`
  - 186 `panelWx()`
  - 218 `landText(short)`
  - 227 `deckText(short)`
  - 242 `quayText(short)`
  - 248 `panelPort()`
  - 280 `portSlip()`
  - 342 `landWarn(p)`
  - 355 `landPage()`
  - 368 `panelLog()`
  - 373 `renderPanel()`
  - 377 `panelBusy()`

## `src/js/ui/07b-first-trip.js` (280 linjer)

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
  - 188 `tutReveal(el)`
  - 194 `tutRect(T0)`
  - 200 `tutStep()`
  - 206 `tutFinish()`
  - 207 `tutScrollSlip()`
  - 210 `tutAllow(what)`
  - 228 `tutView(st)`
  - 235 `tutUpdate()`
  - 258 `tipPlace(txt, T0, o)`

## `src/js/ui/07c-handbook.js` (191 linjer)

Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)

- **1** Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)
  - 10 `hbState()`
  - 126 `hbPick()`
  - 134 `hbEv(id, how)`
  - 135 `hbDone(id)`
  - 136 `hbSkip(ch, id)`
  - 138 `hbReady()`
- **140** what the phone shows (Onboarding 2, O5, V7 A, 27.10.2026)
  - 146 `appShown(id)`
  - 150 `appUnlock(id)`
  - 152 `appSeen(id)`
  - 153 `hbUpdate()`

## `src/js/ui/10g-wardrobe.js` (125 linjer)

Garderoben: the player changes how his figure looks (Jonas 10.10.2026)

- **1** Garderoben: the player changes how his figure looks (Jonas 10.10.2026)
- **14** the right-hand side: what the current tab offers
- **43** the little renderer

## `src/js/ui/08-actions.js` (414 linjer)

actions

  - 6 `doAct(el)`
  - 72 `panelInput(e)`
  - 77 `panelChange(e)`
  - 100 `landConf(H, q, acc)`
  - 128 `sell()`
- **235** modal
  - 237 `modal(html)`
  - 246 `boatUnnamed()`
  - 247 `boatChristen(nm)`
  - 249 `showIntro(namesOnly)`
- **264** «Mens du var borte» (Jonas 07.10.2026: «en følelse av instant-belønning»)
  - 269 `awayStart(mins, realMs)`
  - 270 `awayEnd()`
  - 271 `showAway(A)`
- **298** time
  - 303 `playMinutes(n)`
  - 307 `catchUp(realMs)`
  - 318 `tick()`
  - 355 `deliverOrder()`
- **365** chrome
  - 366 `applyLang()`
- **379** screens: full-screen 3D, or the chart plotter for route planning
  - 380 `setBodyView(v3d)`
  - 384 `openPlotter()`
  - 389 `plotSetRender()`
  - 393 `plotSetOpen(on)`
  - 406 `kinoUi()`

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

## `src/js/ui/10-rod-acts.js` (88 linjer)

---------- the jig game: jigging by hand yourself, and the buttons and hooks around it ----------

- **1** the jig game: jigging by hand yourself, and the buttons and hooks around it
  - 86 `refreshAll()`

## `src/js/ui/10-gear-ui.js` (208 linjer)

passive gear on screen: the action bar, the fish panel, the chart and the route

- **1** passive gear on screen: the action bar, the fish panel, the chart and the route
  - 5 `setState(s)`
- **12** the bait as the player sees it (Jonas 20.10.2026, after tilbakemelding #74: «det må gjøres mer intuitivt hva båten har slags
  - 24 `tubState(lk)`
  - 33 `tubsHtml(lk)`
  - 41 `tubWords(st)`
  - 46 `tubLegend(lk)`
  - 53 `setBaitTxt(s)`
  - 59 `setWhat(s)`
  - 66 `setLabel(s, short)`
  - 73 `setChoices(all)`
  - 87 `gopText()`
  - 95 `gearActs(LS)`
  - 116 `jigSets()`
  - 126 `gearPanel()`
  - 145 `gearSvg(u)`
  - 161 `gearHit(p, r)`
  - 163 `buoyStandoff(s, e)`
  - 168 `gearTap(hit)`
  - 180 `wpActOptions(w)`
  - 186 `wpActLabel(a)`
  - 192 `wpActCycle(w)`
  - 197 `gearDoAct(act, el)`

## `src/js/ui/10c-dock.js` (333 linjer)

---------- the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side ----------

- **1** the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side
- **281** the drawer
  - 323 `renderActs()`

## `src/js/ui/10d-helm.js` (49 linjer)

THE HELM ON THE SCREEN (core/16-helm.js; the user's wish 03.10.2026)

- **1** THE HELM ON THE SCREEN (core/16-helm.js; the user's wish 03.10.2026)

## `src/js/ui/10e-sound.js` (311 linjer)

SOUND (the user's wish 03.10.2026)

- **1** SOUND (the user's wish 03.10.2026)
- **82** inside Father's naust (Jonas 09.10.2026: «Kjør på med lyd i naustet»; ui/09c-naust3d.js)
- **141** the music (Jonas 05.10.2026: «rolig ambient instrumentaler som svak stemning i bakgrunnen. Må kunne skrus av i innstillinger»)

## `src/js/ui/10f-cloud.js` (800 linjer)

THE CLOUD (04.10.2026; docs/lansering.md E and F)

- **1** THE CLOUD (04.10.2026; docs/lansering.md E and F)
  - 10 `cloudOn()`
  - 18 `adminOk()`
  - 22 `cloudS()`
  - 28 `cloudGpu()`
  - 35 `cloudDev()`
  - 41 `cloudMeta()`
- **54** talking to Supabase
  - 55 `cloudToken()`
- **56** guests (06.10.2026; Jonas: «nye brukere ikke trenger å logge inn til å starte med», the account after the third landing)
  - 62 `guestGet()`
  - 63 `guestAuth(path, body)`
  - 71 `guestToken()`
  - 79 `guestStart()`
  - 85 `cloudRpc(fn, args, opt)`
- **97** the gate: before the game starts
  - 98 `cloudGateShow(html)`
  - 105 `cloudGateHide()`
  - 109 `worldSync()`
  - 114 `cloudGate()`
- **182** after the start: hooks, measurements, the save
  - 183 `cloudStart()`
  - 210 `cloudAsk()`
  - 220 `cloudConsent(yes, by)`
  - 226 `cloudBegin()`
  - 234 `cloudEv(k, d)`
  - 235 `cloudFlush(end)`
  - 244 `cloudErr(msg, src, stack)`
- **252** the save between devices (05.10.2026; supabase/migrations/20261005200000_save_sync.sql)
  - 259 `syncGet()`
  - 260 `syncSet(rev, at, rv, sq)`
  - 266 `deviceId()`
  - 270 `deviceName()`
  - 275 `cloudStatus(s)`
  - 276 `cloudStatusText()`
  - 285 `saveSum(o)`
  - 289 `sumText(m)`
  - 296 `cloudChoose(here, cloud, when, box)`
  - 311 `cloudKeptNote(where)`
  - 316 `cloudTake(cs)`
  - 322 `cloudSync(cs)`
  - 346 `cloudSaveSoon(closing, manual)`
  - 385 `cloudSoon(ms)`
- **386** one device at a time (13.10.2026, supabase/migrations/20261013120000_active.sql)
  - 396 `cloudFp()`
  - 397 `cloudClaim(wait)`
  - 410 `cloudBeat()`
  - 426 `cloudWake()`
  - 432 `cloudPassed(h)`
  - 447 `cloudHeldShow(h)`
  - 456 `cloudPlayHere()`
  - 466 `cloudCheckHead()`
  - 475 `cloudConflict(cl, moved)`
  - 505 `cloudHist()`
  - 510 `cloudRestore(id)`
- **521** what is measured: the game's own functions, wrapped once they are all defined
  - 522 `cloudHooks()`
- **545** the account card in Settings
  - 546 `cloudCard()`
  - 570 `histRows()`
  - 582 `cloudAccountDel()`
  - 593 `cloudMediaDel()`
  - 599 `cloudAct(a, d)`
- **633** registering, for a guest: in the game's own words, never a wall before the third landing
  - 642 `guestHave()`
  - 648 `guestAsk(why)`
  - 672 `namesKept()`
  - 673 `namesKeep(o)`
  - 675 `namesApply()`
  - 683 `nameTake(n, quiet)`
  - 693 `nameCheck()`
  - 708 `nameSuggest()`
  - 717 `nameAsk(why, reason)`
  - 742 `guestOpenAsk()`
  - 750 `nameNudge(force)`
  - 763 `guestNudge(step)`
  - 775 `guestLogin(src)`
  - 781 `guestRegister(signIn)`
  - 793 `guestGift()`

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

## `src/js/ui/10h-world.js` (157 linjer)

---------- the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql) ----------

- **1** the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql)
  - 11 `worldTick()`
  - 42 `gearSync(now)`
  - 58 `peerLogo(hid, ver)`
- **68** the shared world V2 (05.10.2026; core/03-simulation.js WSH): one sea, one quota and one market. Every ten minutes, and soon
  - 77 `worldShare()`
- **99** the leaderboards (05.10.2026; Salgslaget → Toppliste; supabase/migrations/20261006020000_toplist.sql): the players of the whole
  - 104 `worldTop(w, grp)`
  - 118 `bygdeTop(w)`
  - 131 `evTop(ev, y)`
  - 142 `evCloseTick()`
  - 148 `worldStart()`

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

## `src/js/ui/10p-install.js` (69 linjer)

put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)

- **1** put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)

## `src/js/ui/11-boot.js` (166 linjer)

---------- boot ----------

- **1** boot
  - 7 `bootMap()`
  - 14 `bootData()`
  - 28 `bootMapLoad()`
  - 47 `bootGame()`
  - 150 `bootFail(e)`

## `src/js/vessel3d.js` (1278 linjer)

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
  - 372 `glbParse(b64)`
  - 393 `glbLoad(type)`
  - 398 `glbPart(type, name)`
  - 401 `glbPaint(part, liv)`
  - 409 `glbZones(type)`
  - 416 `glbModel(type, lod, liv)`
  - 441 `vesselSpec(type)`
  - 442 `buildVesselModel(type, lod, liv)`
  - 483 `vesselGeo(type, hs, sp, house, anch)`
  - 495 `vesselModel(type)`
  - 496 `geoOf(type)`
- **500** the paint shop (ui/10j-paint.js; Jonas 06.10.2026): the hull colours a player can paint their own boat in, in VC's scale. A boat's
  - 519 `modelLiv(L)`
  - 526 `hullLiv(b)`
  - 527 `livKey(liv)`
  - 529 `livGeo(liv)`
  - 534 `livStr(b)`
  - 546 `livPen(s)`
  - 548 `livMark(s)`
  - 549 `livParse(s)`
- **554** paint designs (Malerverkstedet): a stripe under the sheer (ripe), a second colour on the lower topsides (totone), a stripe at the
  - 558 `topsides(type)`
  - 576 `designLines(TS, liv)`
  - 585 `glbDesign(type, part, liv)`
  - 619 `designFits(type, k)`
  - 626 `kitLiv(liv)`
- **628** flags (Malerverkstedet, 07.10.2026): the ensign at the stern as a picture, so any nation and shape can fly. Each flag is drawn here
- **677** the company logo (Malerverkstedet, 07.10.2026): made here from a sign, initials and two colours, or the player's own picture
  - 688 `logoCanvas(cv, L, img)`
  - 699 `logoStrips(type)`
  - 701 `logoStr(L)`
  - 702 `logoParse(s)`
  - 706 `flagCanvas(cv, code, shape, logo)`
  - 718 `flagOf(L)`
- **719** the boat's name on her hull (Jonas 07.10.2026: «Pass på at båtnavnet vises godt på skroget på alle båtene»): a strip on each side
  - 728 `hullTris(type)`
  - 742 `sideStrip(type, frac, hMax, aspect, drop)`
  - 774 `nameStrips(type)`
  - 810 `stripProud(type, st)`
  - 833 `stripPaint(type, st)`
  - 854 `markStrips(type)`
  - 874 `anchorLen(bw)`
  - 877 `markRGB(type, liv)`
  - 885 `hullRGB(type, liv)`
  - 895 `npcKit(L, B)`
  - 898 `npcModel(type, lod, liv)`
  - 900 `personVB(B, x, y, z, seated, hands, suit, kit)`
- **912** people from tools/harbour/arbeider.py: one body in parts, posed at its joints and painted per kit
  - 925 `wkPart(name, kit)`
  - 935 `wkPut(B, o, ax, s, at)`
  - 945 `wkLimb(B, o, A, E, r)`
  - 952 `figureVB(B, x, y, z, seated, hands, kit)`
  - 974 `vesselSVG(type, w, h)`
- **1012** the deck map: where people can walk on each type (the crew plan, docs/mannskap-plan.md)
  - 1019 `deckMap(type)`
  - 1148 `deckPass(M, k, q)`
  - 1153 `passLine(M, A, B)`
  - 1155 `linkPass(M, k, q)`
  - 1159 `deckComp(M)`
  - 1168 `deckPath(M, a, b)`
- **1199** the lanterns after Sjøveisreglene (FOR-1975-12-01-5, rules 22–30, read on Lovdata 17.10.2026; docs/batplan.md del 11)
  - 1212 `lanterns(G, V, st)`
  - 1242 `deckPoints(type)`

## `src/js/deckcrew.js` (471 linjer)

- **2** CREW3D: the people aboard as agents who walk the deck (docs/mannskap-plan.md, del 1; Jonas 17.10.2026: no teleporting)
  - 14 `crewSim(src)`
- **37** the kit on the deck, out of the walking map
- **82** where the work is on this deck: [x, z, heading, task] in the boat's frame (the heading as the view draws it: 0 forward, +pi/2 to starboard)
- **125** what the game says: everyone's station this minute, and the boat's state
- **175** a free person: something to do for a while, by the weather, the hour and their nature
- **181** no limb through a wall, the rail or anything else (Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger,
- **273** the work at its place, clear of everything: at the rail the hands go to the rail's own top (a step back when it is close), at the
- **288** a cell of one's own: the goals already given are taken, and a new one at least SEP from them (the nearest free cell within a metre)
- **300** the agents follow the people aboard
- **415** the body on its way, clear of everything: the shoulders and the chest and back as upright lines; one that would go through a wall
- **435** no way over the deck between two parts of it (fore and aft of the house on the big boats): through the house, out of sight for
  - 465 `npcCrewCtx(n, G)`

## `src/js/view3d/00-head.js` (119 linjer)

- **2** 3D VIEW (plain WebGL, no dependencies)
  - 43 `qualSet()`
  - 53 `qualTick(dt, fps, now)`
- **91** math
  - 92 `persp(fovy, asp, n, f)`
  - 93 `viewDir(f, up)`
  - 100 `mul(a, b)`
  - 101 `model(px, py, pz, yaw, pitch, roll)`
- **109** noise
  - 110 `vn2(x, y, s)`
  - 115 `fbm(x, y, o, s)`
  - 116 `ridged(x, y)`
  - 117 `rng(seed)`

## `src/js/view3d/01-shaders.js` (491 linjer)

---------- shaders ----------

- **1** shaders
- **103** the foam map (Fysikk 4, F1): the foam the boat and the sea leave in the water
- **135** the boat's own foam, when she has way on
- **153** the whitecaps, as the sea shader finds them: the crest in standard deviations plus the mottle, over Monahan's threshold
  - 422 `cloudStep(dt)`
  - 428 `skyFrame(u, Hh, tn, bv)`
  - 443 `glsl3(src, fs)`
  - 451 `compile(type, src, nm)`
  - 458 `program(vs, fs, attrs, nm = '?')`
  - 466 `buf(data, target, usage)`
  - 471 `airSet(u, terr)`
  - 476 `attr(loc, b, size)`
  - 489 `upload(pos, col, idx)`

## `src/js/view3d/02-mesh-terrain.js` (94 linjer)

---------- mesh builder ----------

- **1** mesh builder
  - 2 `MB()`
- **45** terrain
  - 76 `terrRaw(x, z, dil)`

## `src/js/view3d/03-berths-naust.js` (370 linjer)

---------- The water at the berths the company holds in the coast's harbours (core/07e-havn.js) ----------

- **1** The water at the berths the company holds in the coast's harbours (core/07e-havn.js)
  - 8 `berthPits()`
  - 27 `npcPits()`
  - 47 `berthPit(x, z, h)`
- **55** Father's naust and the Finnsnes shop (tools/harbour/naust.py, butikk.py; where: core/07c-naust.js)
  - 72 `rorbuNow()`
  - 78 `sitesNow()`
  - 105 `siteTerr(x, z, h)`
  - 127 `onSite(x, z)`
  - 137 `tileIn(kind, tx, ty)`
  - 138 `tileH(L, kind, x, z)`
  - 145 `terrH(x, z)`
  - 154 `unitTerr(x, z, h0)`
  - 179 `terrCoarse(x, z, dil)`
  - 189 `forestAt(x, z)`
  - 207 `coverAt(x, z, cv, ck, k)`
  - 232 `satRead(L, x, z)`
  - 241 `satAt(x, z, cv, o)`
  - 249 `covBlk(LC, bx, by)`
  - 253 `coverRing(LC, ix, iz)`
  - 263 `coverClass(x, z)`
  - 273 `meshBegin(x0, z0, sx, sz, n, hf)`
  - 277 `meshRows(B, until)`
  - 289 `meshEnd(B)`
  - 301 `makeMesh(x0, z0, sx, sz, n, hf)`
  - 302 `freeMesh(m)`
  - 304 `nearSurf(M, x, z)`
  - 314 `unitPatch(U, M)`
  - 339 `buildPatches()`
  - 348 `buildTerrain()`
  - 357 `stream3d()`

## `src/js/view3d/04-vec-packs.js` (283 linjer)

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
  - 151 `updateMid()`
  - 156 `updateNear()`
  - 159 `nearWanted()`
  - 169 `fineWanted()`
  - 188 `recolor(m, snow)`
- **271** the breakwaters' armour stones: a mesh a breakwater, drawn only within STONE_R of the eye (beyond it a stone is less than a
  - 275 `stonesOf(list, build)`
  - 280 `drawStones(list, TM, eye)`

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

## `src/js/view3d/06-buildings-lights.js` (309 linjer)

---------- real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor ----------

- **1** real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor
  - 6 `bldCells(key)`
  - 14 `vecBldIn(t, key)`
  - 18 `loadBuildings()`
  - 39 `onQuayStrip(x, z)`
  - 44 `bldOnUnit(B, i)`
  - 55 `buildChunk(key, detail)`
- **92** details: chimney, windows, doors (only close to the boat)
  - 136 `addTrees(m, key, srcs, snowy, c)`
  - 168 `addRoads(m, key, snowy)`
  - 189 `freeChunk(c)`
  - 190 `updateChunks(maxBuilds)`
  - 207 `drawBuildings(TM)`
  - 226 `lightY(L, x, z)`
  - 227 `lightOn(L, t)`
  - 228 `drawSeaLights(VP, eye, t, near)`
- **243** lights that light up round them at night (the user's wish 03.10.2026)
  - 248 `pickLights(eye, t)`
  - 269 `plSet(u)`
  - 274 `drawBeams(VP, eye, t)`
  - 302 `drawChunkLights(VP, eye)`

## `src/js/view3d/07-harbour-unit.js` (128 linjer)

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

## `src/js/view3d/08-plants.js` (456 linjer)

---------- fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay ----------

- **1** fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay
  - 3 `plantLayout(pt)`
  - 13 `buildPlants()`
  - 23 `buildPlantParts()`
  - 53 `roundAt(R, T)`
  - 64 `plantRounds(P)`
  - 78 `workLow(st, T, idx)`
  - 103 `workTurn(st, eye, T, idx)`
  - 111 `drawWorker(P, st, eye, T, idx)`
- **198** the work on deck, step by step (Jonas 20.10.2026: «Alle deler av arbeidsprosessene må ha egne animasjoner»); the places the
- **296** the breaks (Jonas 23.10.2026: «Husk at vi må ha animasjoner for alle handlinger og aktiviteter»; core/13-work.js idleAssign)
- **397** the props of the deck work (the poses above): the fish in the hands and on the table, the guts over the rail, the crate and the

## `src/js/view3d/09-landing-deck.js` (508 linjer)

---------- landing the catch ----------

- **1** landing the catch
  - 16 `deckSlots(kind)`
  - 23 `fkRun(P)`
  - 38 `legAt(g, w)`
  - 47 `landScene(P, T, BMrel, eye)`
  - 90 `follow(P, key, st, T, v)`
  - 98 `drawPlant(P, eye, VP, T, BMrel)`
  - 131 `plantsCoast(eye)`
  - 139 `nearestPlant(eye)`
- **141** work on deck: the bleeding tub and the gutting table on the after deck; whoever works the deck guts or ices there
  - 143 `deckActivity()`
- **152** the deck kit (the user's wish 19.10.2026, tools/deck/*.py): the fish tubs, the gaff and the knife, the gutting table and
  - 156 `kit(f, nm)`
  - 159 `kitX(f)`
- **161** the hands in their grips (tools/harbour/hender.py): the meshes once for all the figures (the glove is the same on every look),
  - 164 `handMeshes()`
  - 176 `handFrame(z0, sp, side)`
  - 185 `handSpecs(st, F, R, hands)`
  - 231 `toolM(A, dir)`
  - 238 `dkEvent(kind, at, sp, kg, o)`
  - 244 `dkFor(who, p, task)`
  - 252 `dkEv(e, BMrel, G)`
  - 254 `catchQ()`
  - 259 `dkTick()`
  - 270 `dkBloodDraw(VP)`
  - 279 `rigAt(G, kind, d)`
  - 283 `drawNetTub(BMrel, at, fill, ry)`
  - 289 `drawLineTubs(BMrel, at, n, baited, green, ry, fill)`
  - 300 `jobTubs(j)`
  - 304 `drawMendNet(BMrel, G, d, R)`
  - 318 `drawRigRest(BMrel, G, d)`
- **331** the kit on the model's places (G.kit, from the boat's model; tools/deck): the life-saving gear the rules ask for (V.lsa,
  - 337 `boyeCanvas(txt)`
  - 343 `boyeTex()`
  - 348 `boyeQ()`
  - 349 `drawSafety(BMrel, G, VP, t)`
  - 370 `cargoUnits(G)`
  - 371 `drawCargo(BMrel, G, hide)`
  - 386 `crFrames(X, Q, BMrel, p)`
  - 395 `crLink(X, a2)`
  - 398 `drawCrane(BMrel, G, VP, t, d)`
  - 454 `dkTub(G)`
  - 455 `drawDeck(BMrel, eye, VP, t, DK)`

## `src/js/view3d/10-gear.js` (288 linjer)

---------- passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling ----------

- **1** passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling
  - 3 `buildGear()`
  - 30 `drawGearSea(eye, t, VP, H)`
  - 52 `drawSetting(BMrel, t, g, G, stack, x0)`
  - 69 `haulFish(g)`
  - 78 `haulModel(kind)`
  - 87 `gopHauls()`
  - 101 `potDeck(G, HP, sx, d, pw, vt, ph)`
  - 108 `drawPotStacks(BMrel, K, n)`
  - 116 `stackTop(K, i, d)`
  - 120 `drawPotsAboard(BMrel, G, d, n)`
  - 136 `tankAt(x, z, d, vt)`
  - 154 `drawPots(BMrel, t, g, G, HP, sx, d, skiff, seg)`
  - 212 `drawCrabTank(BMrel, G, d, sx, HP)`
  - 219 `drawGearOp(BMrel, eye, VP, t)`

## `src/js/view3d/11-bunker.js` (65 linjer)

---------- bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle ----------

- **1** bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle
  - 3 `buildBunkers()`
  - 31 `nearestBunker(eye)`
  - 32 `drawBunker(B, eye, VP, T, BMrel)`

## `src/js/view3d/12-skiff.js` (354 linjer)

---------- boat ----------

- **1** boat
- **3** the starter boat: a 19 ft centre-console skiff, modelled in detail
  - 54 `NB()`
  - 62 `lookMesh(look)`
  - 69 `nSetup(VP)`
  - 75 `wearOn(t)`
  - 76 `wearOff()`
  - 77 `drawN(m, M)`
  - 79 `texStrip(Pb, Pt)`
  - 80 `texQuad(P0, P1, P2, P3)`
  - 81 `mkTex()`
  - 82 `upTex(t, cv)`
  - 83 `drawTexQuad(q, tex, M, VP, lit, nrm)`
- **91** the open boats worked by hand: one kit per type
  - 99 `refreshPeople(K)`
  - 110 `useHand(t)`
  - 116 `handKit(t)`
  - 137 `buildSkiff()`

## `src/js/view3d/13-instruments.js` (483 linjer)

---------- the skiff's live instruments ----------

- **1** the skiff's live instruments
  - 11 `engineOn()`
  - 12 `paintPlotter()`
  - 58 `dial(g, cx, cy, r, v0, v1, v, a0, a1, ticks, labels, title, redFr…)`
  - 69 `paintGauges(dt)`
  - 85 `paintVhf()`
  - 95 `paintName(t, liv)`
  - 102 `markCanvas(cv, txt, light)`
  - 108 `markTex(t, liv)`
  - 116 `imgOf(src)`
  - 117 `curLogo()`
  - 118 `logoTexOf(L, img)`
  - 126 `logoQ(t)`
  - 127 `drawLogo(t, M, VP, L, img)`
  - 130 `markQ(t)`
  - 131 `drawMark(t, M, VP, liv)`
  - 132 `nameCanvas(cv, nm, light)`
  - 141 `nameTex(nm, light, mark)`
  - 149 `drawNPCNames(kit, VP)`
  - 164 `nameQ(t)`
  - 166 `paintHand()`
  - 175 `limbM(A, B, r)`
  - 178 `drawSkiff(BMrel, VP, dt, showSkipper, showCrew)`
  - 312 `drawSkiffGlass(BMrel, VP)`
  - 317 `jigRail(t, G)`
  - 338 `drawJigRail(BMrel, VP, t, G, dt)`
  - 371 `drawGlass(m, BMrel, VP)`
  - 390 `drawDrops(m, BMrel, VP, t)`
  - 401 `buildBoat()`
  - 427 `buildFlag()`
  - 439 `flagTex()`
  - 454 `penTex()`
  - 467 `mastTop(G)`
  - 471 `updateFlag(t, appW)`

## `src/js/view3d/14-sea.js` (300 linjer)

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
  - 122 `wakeHFast(x, z)`
- **131** the foam map: the foam the boat and the sea leave in the water (Fysikk 4, F1, 27.10.2026)
  - 144 `foamFree()`
  - 145 `foamInit()`
  - 161 `wavePh()`
  - 168 `foamStep(dt, t)`
  - 220 `foamBind(u)`
- **227** the sea state over the near terrain and the whole map
  - 234 `ssLevel(n, unit)`
  - 236 `ssRect(L)`
  - 237 `ssWork(L, until)`
  - 260 `ssStep(rdt)`
  - 262 `ssBlend(L)`
  - 264 `ssTex(L, x, z, out)`
  - 271 `ssAt(x, z)`
  - 280 `seaDisp(x, z, t, S, fade)`
  - 291 `seaFade(x, z)`
  - 292 `seaH(x, z, t)`
  - 298 `seaHFast(x, z, t)`

## `src/js/view3d/15-env-mooring.js` (147 linjer)

---------- environment ----------

- **1** environment
  - 3 `pal(el)`
  - 12 `wetSet(H)`
  - 24 `computeEnv(H)`
- **60** mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off)
  - 64 `buildMooring()`
  - 66 `berthNow()`
  - 72 `approach(F, bp, u0, du0)`
  - 83 `pathM(pts)`
  - 88 `pathAt(M, s)`
  - 89 `lieAlongside(dt, bp)`
  - 92 `moorStep(dt, bp, at = dt)`
  - 124 `drawMooring(BMrel, eye, VP, t)`

## `src/js/view3d/16-motion.js` (225 linjer)

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
- **210** particles
  - 214 `spawn(x, y, z, vx, vy, vz, life, g)`
  - 216 `drawPts(n, mode, VP, col, size, round, off, mx)`

## `src/js/view3d/17-draw.js` (186 linjer)

---------- drawing ----------

- **1** drawing
  - 2 `litSetup(VP)`
  - 8 `drawLit(m, M, hole)`
  - 17 `terProg(q)`
  - 25 `drawTerrain(TM, eye, VP, near)`
  - 46 `buildGround()`
  - 81 `buildLandMask()`
  - 104 `lmStep()`
  - 137 `seaRing(u, eye, y, R, Hl)`
  - 147 `drawSea(VP, eye, t, far, drop)`

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

## `src/js/view3d/18-setup.js` (165 linjer)

---------- setup ----------

- **1** setup
  - 32 `init()`
  - 143 `anchorAlarm3d(kind)`
  - 146 `sayBoat(id, txt)`
  - 148 `sayWorker(pid, idx, nm, no, en)`
  - 152 `crewFx3d(c, kind, o)`
  - 154 `say3d(c, no, en)`
  - 158 `buildLabels()`
  - 159 `resize()`

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

## `src/js/view3d/20-trawl-seine.js` (275 linjer)

---------- the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved

- **1** the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved
  - 8 `trawlKit(t)`
  - 16 `alongM(A, d)`
  - 23 `trawlState(now)`
  - 32 `drawTrawl(t, A, BMrel, now)`
- **57** the purse seine (tools/boats/not75.py; Jonas 06.10.2026: «Denne kan både bruke ringnot og trål og trenger dermed
  - 63 `seineState(now)`
  - 69 `drawSeine(t, A, BMrel, VP, now)`
  - 108 `drawDeckCrew(BMrel, eye, VP, t, G)`
  - 167 `spHold(f)`
  - 170 `deckWork(G)`
  - 178 `drawHelmKit(BMrel, eye, G)`
  - 187 `drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named)`
  - 212 `npcMesh(n, lod)`
  - 221 `drawNPC(eye, t, H, VP)`
  - 254 `npcCrewDraw(n, K, eye, t)`

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

## `src/js/view3d/22-docks-air.js` (172 linjer)

---------- the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py) ----------

- **1** the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py)
  - 5 `buildDocks()`
  - 11 `drawDocks(eye, t, VP)`
- **43** the floating docks among the packs' piers (01c-vec.js flyteTile, tools/harbour/brygge.py; tilbakemelding #94)
  - 56 `floatFree(k)`
  - 57 `floatJob(t, FD, solid)`
  - 108 `drawFloats(eye, t, VP)`
- **126** aircraft (tools/air/fly.py) where core/05c-air.js airStates puts them, within about 15 km of the eye
  - 128 `buildAir()`
  - 133 `drawAir(eye, t, H, VP)`
  - 147 `drawAirLights(VP, t)`
  - 157 `drawNPCGlass(VP)`
  - 158 `drawNPCLights(VP)`

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

## `src/js/view3d/24-cinema.js` (421 linjer)

---------- cinema (the user's wish 03.10.2026) ----------

- **1** cinema (the user's wish 03.10.2026)
  - 8 `kinoWant(K, t)`
  - 19 `kinoNext(t)`
  - 38 `kinoCam(t, rdt)`
  - 58 `introStart(sec)`
  - 64 `frame()`
  - 66 `frame0()`
  - 242 `snapTake()`
  - 247 `drawRoute(VP, eye)`
  - 259 `driftSpray(VP, eye, dt, t, col)`
  - 274 `drawSmoke(VP, eye, BM, dt)`
  - 301 `drawEffects(VP, eye, BM, dt, t)`
  - 403 `updateLabels(VP, eye, W, Hh)`

## `src/js/view3d/25-controls.js` (187 linjer)

---------- controls ----------

- **1** controls
  - 18 `paintView(on)`
  - 23 `paintAim(C, yawW)`
  - 30 `showroom(type)`
  - 39 `show(on, auto)`
  - 54 `bench(ks, ns)`
- **72** the profile (#prof, F1)
  - 82 `pqInit()`
  - 90 `pqPoll()`
  - 99 `profBegin(rdt, j0)`
  - 102 `profMark(k)`
  - 106 `profEnd()`
  - 116 `prof(sets)`
