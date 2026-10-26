# Kodekart

Seksjonene og funksjonene i hver kildefil, med linjenummer, i rekkefølgen malen setter dem sammen i (`src/index.html`). Lages av `python3 tools/docs/kodekart.py` og skrives på nytt av `/lever`, så linjenumrene kan være litt gamle; navnene og rekkefølgen stemmer. Slå opp her og bruk `grep` i stedet for å lese en stor fil hel.

## `src/js/core/00-proj.js` (65 linjer)

- **2** CORE START
- **4** PROJECTION: UTM zone 33 (ETRS89, EPSG:25833)
  - 30 `utm33(lat, lon)`
  - 45 `utm33inv(E, N)`
  - 60 `natP(lat, lon)`
  - 61 `natLL(p)`

## `src/js/core/01-world.js` (385 linjer)

- **4** one clock for everyone (05.10.2026, the shared world V1)
  - 39 `gridGamma(p)`
  - 54 `b64bytes(s)`
  - 55 `varints(b)`
  - 63 `loadFine()`
  - 71 `loadRoads()`
  - 87 `inHarbour(p)`
  - 94 `legHazard(a, c, sd)`
  - 104 `legHazardMemo(a, c, sd)`
  - 109 `draftHazards()`
  - 119 `legReady(a, c)`
  - 126 `nearestPlace(p)`
  - 130 `groundCheck(a, c)`
  - 141 `runAground(p)`
  - 156 `rocksNear(a, b, r)`
  - 166 `rocksIn(x0, y0, x1, y1)`
  - 179 `coastDist(p)`
  - 180 `coastDistFar(p)`
  - 186 `decodeContours()`
  - 195 `isLand(p)`
  - 203 `isLandFar(p)`
  - 209 `isLandUI(p)`
  - 215 `inHarbourPocket(p)`
  - 221 `harbourNear(x, z)`
  - 227 `qPockets()`
  - 228 `pocketHit(US, QS, x, z)`
  - 235 `pocketsIn(x0, y0, x1, y1)`
  - 244 `legClear(a, b)`
  - 275 `portLabel(p)`
- **291** the harbour unit (02.10.2026)
  - 332 `fillOut(U, lx, lz)`
  - 345 `onUnitGround(p)`
  - 352 `unitCovers(x, z, m)`
  - 360 `bridgeUnderUnit(br, extra)`
  - 365 `portApproach(pt)`

## `src/js/core/01b-mapdata.js` (198 linjer)

MAP DATA (phase K3 of the coast plan): the rasters in 10 km blocks, fetched in packs from map/

- **1** MAP DATA (phase K3 of the coast plan): the rasters in 10 km blocks, fetched in packs from map/
  - 22 `mapOnReady(f)`
- **23** IndexedDB, by content
  - 24 `mapIdb()`
  - 28 `idbDo(mode, f)`
  - 29 `mapFetch(pk)`
- **44** the manifest and the packs
  - 45 `mapStart(base)`
  - 61 `mapLoad(pk)`
  - 72 `mapPackOf(L, bx, by)`
  - 73 `mapPacksIn(kind, x0, y0, x1, y1)`
  - 81 `mapSimPacks(p, r)`
  - 82 `mapReadyAt(p, r)`
  - 84 `mapSimAt(p)`
  - 85 `mapViewAt(p)`
  - 88 `mapKindIn(kind, p, memo)`
  - 90 `mapNeed(p, r)`
  - 96 `mapPreload(pts, kinds, onProgress)`
  - 113 `mapLoadKind(kind)`
- **114** blocks
  - 115 `med16(raw, n)`
  - 120 `mapDecode(L, raw)`
  - 131 `mapBlock(L, bx, by)`
  - 143 `mapHasBlock(L, bx, by)`
  - 146 `mapBlockKnown(L, bx, by)`
  - 148 `rcell(L, ix, iy)`
  - 154 `rbil(L, p)`
  - 159 `rbilM(L, x, z)`
  - 164 `mapHasM(L, x0, z0, x1, z1)`
  - 171 `mapVec(pk, name)`
  - 178 `mapViewReady(x0, y0, x1, y1, then, kinds)`
  - 185 `simAreaReady()`
  - 193 `mapDrop(pk)`

## `src/js/core/01c-vec.js` (211 linjer)

THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces

- **1** THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces
  - 23 `inQuad(Q, x, z)`
  - 28 `pierBoxes(out, kind, n, X, Z, src)`
  - 45 `vecDecode(D)`
  - 117 `flyteTile(tx, ty)`
  - 126 `vecFinish(r)`
  - 134 `vecWorker()`
  - 151 `vecInput(pk, inflate)`
  - 159 `vecDecodeHere(pk)`
  - 161 `vecTile(tx, ty)`
  - 170 `vecTilesIn(x0, z0, x1, z1)`
  - 178 `roadsIn(x0, z0, x1, z1)`
  - 191 `bridgesIn(x0, z0, x1, z1)`
  - 193 `vecWant(x0, y0, x1, y1, then)`
  - 201 `vecPrune(pts, R = 60)`

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

## `src/js/core/02-species-gear.js` (220 linjer)

Placeholder prices (NOK/kg, grade A) – to be tuned

- **59** vessels, equipment, crew
  - 165 `fuelWeek(w)`
  - 167 `fuelPrice(H = S.t / 60, pid = S.boat && S.boat.port, diesel = BOAT.die…)`
  - 194 `equipFits(k, type)`
  - 197 `fuelBase(v, vmax, planing)`
  - 198 `fuelKOf(V)`
  - 200 `vesselDerive(V)`
  - 214 `lsaOf(V)`

## `src/js/core/03-simulation.js` (969 linjer)

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
  - 409 `fuelLph(v, W)`
  - 410 `speedCap(hs, cb = 1)`
  - 413 `noise2(x, y, s)`
  - 419 `slopeAt(p)`
  - 424 `hotField(sp, p, H, k)`
  - 428 `hotspot(sp, p, H)`
  - 435 `school(sp, p, H)`
  - 440 `schoolHeading(sp)`
  - 445 `fieldCode(p)`
  - 447 `skreiSpot(p, d = depthF(p)`
  - 452 `gauss(u1, u2)`
  - 454 `sampleFish(sp, p, H)`
  - 459 `clsOf(sp, kg)`
  - 462 `kveiteClosed(H)`
  - 465 `targetF(sp, H, pilk)`
  - 470 `uerOpen(H)`
  - 474 `denPlace(p)`
  - 480 `denTime(H)`
  - 487 `denSp(sp, q, H, T)`
  - 500 `density(sp, p, H)`
  - 507 `eggaArea(p, d, H, E)`
  - 526 `tutBonus(sp, p)`
  - 538 `stockIdx(p)`
  - 540 `stockW(p)`
  - 545 `stockFill(v)`
  - 548 `stockAt(p, sp)`
  - 555 `takeStock(p, kg, sp, npc)`
- **561** the shared world V2 (05.10.2026; ui/10h-world.js, supabase/migrations/20261006000000_world_v2.sql): one sea, one quota and one
  - 567 `wq()`
  - 568 `wshOpen(y)`
  - 569 `wshSat(pid, sp, H)`
  - 570 `wshTake(k, kg)`
  - 572 `wshLand(port, H, acc, kgSp, codQ)`
  - 577 `initStock()`
  - 585 `stockHour(H)`
  - 607 `depthFactor(sp, d)`
  - 612 `depthF(p)`
  - 618 `depthHas(p)`
  - 627 `deepAt(p)`
  - 632 `offDepth(p)`
  - 635 `tileDepth(p, d)`
  - 642 `depthWater(p)`
  - 654 `depthAt(p)`
  - 655 `depthModel(p)`
  - 656 `grade(f)`
- **657** How the catch keeps (D3 of the operations plan, Jonas 23.10.2026, svar 15a: calibrated against the sources)
  - 667 `keepDay(f)`
  - 668 `keepF(day)`
  - 671 `keepK(x, rrs)`
  - 673 `keepHours(f, f2, k)`
  - 675 `supplyFactor(H)`
  - 682 `weekOfH(H)`
  - 683 `weekDev(sp, H)`
  - 689 `marketPrice(sp, H)`
  - 691 `clsPrice(port, sp, c, H, hook)`
  - 697 `price(port, sp, H)`
  - 699 `avgPrice(sp, H, days)`
- **700** quotas north of 62° N: the regulation and the year's figures are in 03d-quota.js
  - 701 `doyH(H)`
  - 702 `yearH(H)`
  - 703 `quotaState()`
  - 721 `licValue(l)`
  - 749 `taxOf(P, form, days)`
  - 759 `txInit(H)`
  - 761 `txProfit(H)`
  - 765 `taxTick(H)`
  - 787 `foundAS()`
  - 795 `mvaCheck(total)`
  - 804 `trekkOf(total, len)`
  - 809 `fmInit()`
  - 811 `fmLand(total)`
  - 820 `takeLoan(amount, months, k)`
  - 824 `payDown(x)`
  - 830 `deal(price, ti, inn)`
  - 837 `finance(x, months)`
  - 838 `lenGroup()`
  - 839 `codLimits(H)`
  - 842 `codOpen(H)`
  - 843 `codLimitNow(H)`
- **844** haill: luck from the quay. Fresh goods: full effect for two days, fading to nothing on day seven. Sold for real money only (test mode now) or won at the pub.
  - 862 `haillBoost()`
  - 863 `haillLeft()`
  - 864 `haillStage()`
  - 866 `haillF()`
  - 867 `luck(sp)`
  - 869 `giveHaill(type, how)`
  - 870 `useHaill(type)`
  - 876 `pubEvening(H)`
  - 877 `pubOpen(H)`
  - 880 `capHold()`
  - 882 `cargoRoom()`
  - 884 `cargoMin(kg)`
- **885** the daily login bonus: each real calendar day you open the game adds a point to a bonus on the fish price; each day
  - 888 `streakState()`
  - 889 `streakPct()`
  - 890 `streakTouch()`
- **901** cold: effective temperature from air temperature and wind, plus wet from rain, snow and spray. Cold, wet hands fish worse;
  - 905 `effTemp(H)`
  - 906 `coldPen(H, hs)`
- **913** orders from buyers and customers: species, amount, quality, deadline and a price premium; reputation builds with each buyer
  - 928 `gradeOk(g, q)`
  - 929 `ordState()`
  - 932 `custNear(c)`
  - 937 `repOf(id)`
  - 939 `bkOrderable(H)`
  - 941 `bkPlant(id)`
  - 942 `custSp(c)`
  - 943 `spCatchable(sp, H)`
  - 945 `ordersTick(H)`

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

## `src/js/core/03e-rules.js` (265 linjer)

The rules along the coast (R2 of the rules plan, 05.10.2026). rulesAt() takes a place, a time, the boat's length, the gear and the

  - 28 `ruPip(rings, x, y)`
  - 29 `ruIn(P, x, y)`
  - 34 `ruBlock(bx, by)`
  - 52 `ruBits(p)`
  - 55 `insideFjord(p)`
  - 56 `insideBaseline(p)`
  - 58 `blDist(p)`
  - 64 `ruHom(p)`
  - 65 `ruLok(p)`
  - 67 `ruZone(p)`
  - 68 `ruAt(id, p)`
  - 70 `ruLineName(ref)`
  - 84 `kcQuota(ll)`
  - 88 `rulesAt(q)`
  - 184 `ruBlockMsg(q)`
  - 186 `ruMinSize(sp, p)`
  - 199 `fjordLimits(p, H)`
  - 213 `ruCtx()`
  - 217 `ruNow()`
  - 223 `ruLayerBlock(bx, by, q, budget)`
  - 235 `ruWpQ(w)`
  - 240 `ruWpMsg(w)`
  - 247 `ruOpenNear(p, q, maxKm)`
  - 256 `ruTips()`

## `src/js/core/04-crew.js` (262 linjer)

crew: people with skills, habits and moods

- **1** crew: people with skills, habits and moods
  - 9 `crewHome()`
  - 31 `pickW(pairs)`
  - 32 `crewAge()`
  - 34 `skreiSeason(H)`
  - 35 `crewDerive(c)`
  - 36 `genCrew()`
  - 49 `deckSkills(ex)`
  - 51 `crewUpgrade(c)`
  - 60 `payHyre()`
  - 64 `crewAboard(H, all)`
  - 65 `crewEff(c, H, hs, g = 'juksa')`
- **72** what lifts or drags a person's effort just now, besides what they can and who they are (Jonas 23.10.2026: «dette skal være dynamisk
  - 78 `crewDrive(c, H, hs)`
  - 99 `crewEffort(c, H, hs)`
- **106** samhold: how the crew aboard pull together (Jonas 23.10.2026: «Samhold ja, men det må gjøres intuitivt»), 0-100 per vessel (S.team,
  - 111 `crewTeam()`
  - 116 `teamHour(H, on, hs, food)`
  - 135 `teamLine()`
  - 143 `teamEff(team, me = true, g = 'juksa')`
  - 145 `compat(a, b)`
  - 158 `crewById(id)`
  - 161 `holdNet()`
  - 170 `crewSettle(c)`
  - 180 `crewQuit(c, why, whyEn)`
  - 183 `borsTick(H)`
  - 191 `crewRumour()`
  - 193 `crewTick(H)`
  - 260 `codRoom(H)`

## `src/js/core/05-vessels.js` (968 linjer)

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
  - 385 `peerName(s)`
  - 386 `peerStates()`
  - 399 `newState()`
  - 410 `log(no, en, k)`
  - 412 `navHour()`
  - 419 `nearestPort(p)`
  - 421 `nearestYard(p)`
  - 423 `step()`
  - 440 `vesselStep(H)`
  - 519 `sailV(H, hs)`
  - 531 `sail(H, W, hs)`
  - 557 `sailReplan(pl, b, gp)`
  - 582 `sailStop(pl, b, why)`
  - 590 `haltPlan(need)`
  - 600 `arrive(w)`
  - 619 `unstuckWhy()`
  - 625 `unstuckSpot()`
  - 632 `unstuck()`
  - 646 `dock(pid, berth)`
  - 671 `catchFactors(H, W, hs)`
  - 681 `fish(H, W, hs)`
  - 750 `endFishing(why)`
  - 765 `addCatch(sp, kg, cls, hook, opt)`
- **778** work on deck: gutting and icing take hands and time
  - 791 `deckHands()`
  - 794 `deckPending()`
  - 795 `deckEta(hands)`
  - 800 `moveKg(x, kg, patch)`
  - 808 `iceMinute()`
  - 810 `deckMinute()`
  - 828 `risk(W, hs)`
  - 855 `hullRepair()`
  - 858 `svcOverdue()`
- **859** the rescue boat (plan E3, 05.10.2026)
  - 879 `rescueBases()`
  - 888 `rescueBase(p)`
  - 895 `rescueAis(H)`
  - 899 `rescue(keepCatch)`
  - 923 `towSea(p)`
  - 928 `towRoutes(b)`
  - 939 `towStep(H)`
  - 951 `towDone(t)`
  - 957 `towPose(frac)`

## `src/js/core/05c-air.js` (64 linjer)

---------- aircraft over the coast (plan E4, 05.10.2026) ----------

- **1** aircraft over the coast (plan E4, 05.10.2026)
  - 35 `airLegs()`
  - 47 `airStates(H, p, km)`

## `src/js/core/06-services.js` (250 linjer)

---------- services behind the phone ----------

- **1** services behind the phone
  - 3 `coverage(p)`
  - 4 `msg(from, no, en)`
  - 7 `radio(no, en)`
  - 8 `radioForecast(H)`
  - 21 `hourly()`
  - 50 `skipPort(i)`
  - 54 `weekOf(H)`
  - 55 `npcWeekKg(i, w)`
  - 60 `myKg(H0, H1)`
  - 61 `toplist(w)`
  - 70 `newsForDay(day)`
- **137** standing operations plan: a hired skipper runs a saved route on set days, lands the catch and restocks
  - 139 `autoRestock()`
  - 148 `depart()`
  - 170 `finishJob(j)`
  - 193 `fitHours(k)`
  - 196 `jobOk(j)`
  - 201 `queueJob(j)`
  - 204 `jobsDone()`
  - 210 `shelterReturn(W, hsOver)`
  - 229 `startReturn(auto, W, home, hsOver, opsKeep)`
- **248** CORE END

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

## `src/js/core/06d-drift.js` (558 linjer)

Drift: the standing operations plan, per vessel. Made anew 23.10.2026 (Jonas: «en fullstendig redesign av driftsplan-systemet …

- **1** Drift: the standing operations plan, per vessel. Made anew 23.10.2026 (Jonas: «en fullstendig redesign av driftsplan-systemet …
  - 39 `driftNew(over)`
  - 45 `driftOps()`
  - 52 `opsSkipper()`
- **54** what the plan maker reckons a place gives: only what the player knows (Jonas 09.10.2026: the plan shows no expected catch; where the
  - 58 `planMark(p, g)`
  - 59 `planJigRate(p)`
  - 60 `planGearKg(kind, p, soak)`
  - 65 `planUnits(kind)`
  - 73 `planRestOk(pid)`
- **75** the places: H home (the anchorage of a big boat, or the port), Q the home quay, M the plant, A where a long trip rests, F:id a field, J:id a jig place
  - 76 `drP(o, k)`
  - 85 `drOrder(o)`
  - 91 `drMid(o)`
- **93** the legs between the places, found along the fairways (11-route.js leiaRoute) and kept in o.legs: {w [[x, y] …] the points before
  - 100 `drLeg(o, a, ap, b, bp)`
  - 107 `drLegPut(o, key, r, a, b)`
  - 113 `drFetch(o, pairs, vid)`
  - 123 `drLegsStale(o)`
- **125** making the plan: the plant, the anchorages and the legs. Async; cb(err) when done. The plan can be switched on once it is made.
  - 128 `driftMake(o, cb)`
- **163** the check: errors keep the plan from being switched on, warnings only inform
  - 164 `driftCheck(o)`
  - 207 `driftCrewWhy(o, quiet)`
- **218** the crew: rested, and had enough
  - 219 `drFat()`
  - 220 `drRested()`
  - 221 `drTired()`
  - 226 `driftRoles(o)`
  - 233 `driftWatch(H)`
- **240** the weather the plan allows, while it runs (05-vessels.js turns back over it)
  - 241 `driftWx()`
  - 243 `driftWxAhead(o, H, dur, pts)`
- **252** the trip: from where the boat is, the gear that is due, the jig places in turn, and the landing at the plant.
  - 255 `drSetOf(o, f)`
  - 256 `drTrip(o, H, budget, dry)`
  - 319 `drHere(o)`
  - 327 `drGoWps(o, k)`
- **335** the engine: each minute, on each vessel (05-vessels.js vesselStep)
  - 338 `drWait(o, k, no, en, hold)`
  - 344 `drStop(o, k, no, en, fix)`
  - 349 `driftFail(o, no, en)`
  - 355 `driftResume(o)`
  - 356 `opsStep(H)`
  - 370 `drSea(o, H)`
  - 380 `driftDecide(o, H)`
  - 430 `drGoTo(o, H, k, kind)`
  - 437 `drWxWait(o, wx)`
  - 443 `drNeed(o, need)`
  - 449 `drGo(o, H, budget)`
  - 465 `drDepart(o, wps, kind, noJig)`
  - 475 `drRulesWhy(o, H, placesOnly)`
  - 483 `opsLanded(pid, k)`
  - 494 `driftStock()`
  - 495 `opsReport(pid, kg, total, landed)`
- **505** what the plan is doing, in a few words: the page's «Nå» and the company's fleet list ([no, en])
  - 506 `driftNow(o)`
- **525** the trip as a timeline for the page: the one under way from where she is now, or the next one from where it starts.
  - 527 `driftSketch(o)`
- **551** the plan to another vessel of the company: the answers, made again there
  - 552 `driftCopy(vid)`

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

## `src/js/core/09c-seasons.js` (113 linjer)

the seasons as events (05.10.2026; Jonas chose it from the list of what makes people play on, 5)

- **1** the seasons as events (05.10.2026; Jonas chose it from the list of what makes people play on, 5)
  - 41 `seasonNow(H)`
  - 47 `seasonNext(H, n = 8)`
  - 57 `festDays(y)`
  - 63 `festField(y)`
  - 67 `festCatch(sp, kg)`
  - 73 `festBoard(y)`
  - 80 `seasonDay(H)`
  - 94 `seasonNews(day)`
  - 103 `seasonTalk(H)`
  - 105 `seasonGrid()`

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

## `src/js/core/09f-merker.js` (206 linjer)

Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)

- **1** Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3)
  - 22 `achVisits()`
  - 23 `achVisitPort(pid)`
  - 79 `achState()`
  - 95 `achAdd(k, n)`
  - 96 `achSale(total, sps)`
  - 97 `achCatch(sp, cls)`
  - 99 `achMinute()`
  - 108 `achTripEnd(bad)`
- **110** the gifts: what fits the player now, in three tiers (seven in ten common, two good, one rare), bigger in later chapters
  - 112 `achPool(scale)`
  - 136 `achDraw(key, scale)`
  - 144 `achGive(key, scale, title)`
- **153** checking: each milestone in an open chapter, the chapters' own rewards, and the long badges
  - 155 `achCheck(quiet)`
  - 183 `achChapter(ch)`
  - 193 `achSeed()`
- **204** the first tow and the first repair are free (core/05-vessels.js rescue, hullRepair)
  - 205 `freeFirst(k)`

## `src/js/core/09g-turer.js` (661 linjer)

Turoppdrag: missions from where the boat is (07.10.2026; docs/engasjement.md point 4)

- **1** Turoppdrag: missions from where the boat is (07.10.2026; docs/engasjement.md point 4)
  - 51 `turState()`
  - 57 `turRebase(T)`
  - 71 `turV()`
  - 72 `turRange()`
  - 77 `turCap()`
  - 81 `turOwn()`
  - 92 `turRate()`
  - 94 `turWeek()`
  - 98 `turSlow()`
  - 100 `turFinal(m)`
  - 102 `turSpOk(sp)`
  - 106 `turForm()`
  - 108 `turClass(hGame)`
  - 113 `turCan(a, b, hGame, back, fc = true)`
- **123** the quotas: what is left to land of a species (kg; Infinity where nothing limits it)
  - 129 `turRoom(sp, H)`
- **137** the offers
  - 138 `turPlants()`
  - 143 `turMe()`
  - 149 `turOrder(cand, me)`
  - 151 `turBest(o, cls, used, me = turMe()`
  - 167 `turFrakt(o, cls, used, me = turMe()`
  - 181 `turGarn(o)`
  - 199 `turValue(L)`
  - 204 `turSlep(o, cls)`
  - 224 `turNpcs()`
  - 236 `turMinute()`
  - 263 `turStuck(T, b)`
  - 271 `turProveMinute(m, b)`
  - 295 `turSesong(o)`
- **314** survey fishing for Havforskningsinstituttet
  - 319 `turProve(o, cls)`
  - 346 `turProveFish(m)`
  - 357 `turProveDone(m)`
  - 364 `turEkkoSaw(m)`
- **372** a picture of a lighthouse for Kystposten
  - 382 `turLysNext(m, from)`
  - 383 `turFoto(o, cls)`
  - 404 `turFotoAt()`
  - 407 `turFotoTake(m, seen, img)`
  - 426 `turMake()`
  - 452 `turEnsure(force)`
  - 471 `turWay()`
  - 478 `turDetour(m, way = turWay()`
- **490** taking, doing and finishing
  - 491 `turTake(id)`
  - 513 `turDrop(id)`
  - 518 `cargoJob(kg, no, en)`
  - 519 `turLoad(m)`
  - 528 `turSpawn(m)`
  - 544 `turEnd(m, ok, why)`
  - 555 `turPayOut(m, from, no, en)`
  - 562 `turDock(pid)`
  - 575 `turSale(pid, bySp)`
  - 586 `turHauled(s)`
  - 590 `turHour()`
  - 605 `turWhat(m)`
- **616** the trip as it starts: when it will be there, and a word from the crew (or the memory of Father, alone aboard)
  - 630 `turSay(who, no, en, k)`
  - 635 `turDepart()`
  - 655 `turMechanic()`

## `src/js/core/09h-press.js` (202 linjer)

Kystposten: the coast's paper (07.10.2026)

- **1** Kystposten: the coast's paper (07.10.2026)
  - 21 `pressState()`
  - 24 `pressPut(kind, d, loc)`
- **35** the words
  - 39 `pressWho(it)`
  - 45 `pressStory(it)`
  - 120 `pressTop()`
  - 132 `pressLand(local)`
- **142** the market: a record price, the highest in a year (Jonas 07.10.2026: «Ta rekordpriser»)
  - 147 `pressIx(sp, d)`
  - 148 `pressHigh(sp, d)`
  - 149 `pressRecords(d)`
  - 150 `pressPrice(sp, d)`
  - 165 `pressDay(H)`
- **169** the year's first skrei: the first cod landing north of Stad (62° N) after the skrei season begins (09c-seasons.js), from the
  - 171 `pressSkreiH(y)`
  - 173 `pressSkrei()`
  - 184 `pressList(local)`
  - 200 `pressUnread()`
  - 201 `pressSeen()`

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

## `src/js/core/10-gear.js` (696 linjer)

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
  - 571 `reportLost(sid)`
  - 579 `netMended(l)`
- **580** in port: baiting at the shed or by the crew, mending by the crew or at the net loft in Finnsnes
  - 586 `egnOrder(lk, n, bait)`
  - 600 `egnHands()`
  - 609 `egnSelf(lk, n, bait)`
  - 630 `stripSelf(lk, bait, n, then)`
  - 644 `mendSelf(nid)`
  - 655 `botOrder(nid)`
  - 666 `gearJob(j)`
  - 678 `gearJobCancel(j)`
  - 685 `shoreTick()`

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

## `src/js/core/11b-obstacles.js` (219 linjer)

WHAT A ROUTE MUST NOT SAIL THROUGH (Jonas 05.10.2026: «autoruter aldri skal gå gjennom 3d elementer eller landmasse», along

- **1** WHAT A ROUTE MUST NOT SAIL THROUGH (Jonas 05.10.2026: «autoruter aldri skal gå gjennom 3d elementer eller landmasse», along
  - 23 `obsBridge(br)`
  - 45 `obsIndex()`
  - 77 `obsDist(o, ax, az, bx, bz)`
  - 93 `obsCounts(o, air)`
  - 99 `obsSegHit(a, b, clr)`
  - 121 `obsRock(a, b)`
  - 127 `obsSafe(a, b, ref)`
  - 137 `obsWays(o, a, b)`
  - 172 `obsDetour(a, b, depth = 3, ref)`
  - 186 `obsRoute(a, wps)`
  - 193 `obsLoad(pts, ms = 4000)`
  - 208 `obsSail(pl, b)`

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

## `src/js/core/15-energy.js` (156 linjer)

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
  - 120 `fallAsleep(v, doze)`
  - 131 `wakeUp()`
  - 137 `wakeEarly(back)`
  - 149 `sleepDrift(H)`

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

## `src/js/ui/03a-chart.js` (144 linjer)

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
  - 121 `chartNamesSvg(vx0, vy0, vx1, vy1, u, taken)`

## `src/js/ui/03-map.js` (689 linjer)

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
  - 412 `portIcon(p, s, u)`
  - 427 `soundingsSvg(vx0, vy0, vx1, vy1, u, taken)`
  - 446 `scheduleStatic()`
  - 451 `aisTrack(id, H)`
  - 454 `aisInfo(n)`
  - 467 `renderAisCard()`
  - 468 `renderDyn()`
  - 545 `pinAdd(mp)`
  - 550 `pinOpen(id, fresh)`
  - 570 `pinKb()`
  - 600 `ptrUp(e)`
  - 628 `unzoom()`
  - 635 `portByLabel(pt)`
  - 640 `addWaypoint(pt)`

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

## `src/js/ui/04-panels-instruments.js` (191 linjer)

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
  - 88 `liveFrac()`
  - 89 `livePose(frac)`
  - 110 `vnoise2(x, y, s)`
  - 116 `microBottom(p, d)`
- **118** instruments: GPS and echo sounder
  - 180 `hudClasses()`
  - 186 `hudFold(which)`

## `src/js/ui/05-tattoo-art.js` (169 linjer)

---------- sailors' tattoos: the flash and the seated sailor they go on ----------

- **1** sailors' tattoos: the flash and the seated sailor they go on

## `src/js/ui/05-phone.js` (2119 linjer)

---------- the phone ----------

- **1** the phone
- **57** workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port
- **79** the tackle shop on the quay: a purchase takes two taps, the second one confirms the price
- **171** the pages of the dock's drawer (ui/10c-dock.js): the market, the village and the yard in port, the inventory everywhere
- **440** Trim: more speed for the boat you are aboard for a while (core BOOSTS; Jonas 05.10.2026: sold for real money, the time in game
- **459** Skippertak (core/15-energy.js SKIP): an energy drink for real money only, for you and the crews of the whole fleet
- **478** the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened
- **1215** the seaman's life: the tattoos you have earned, and the old ways at sea you have heard of
- **1278** weather
- **1299** newspaper
- **1307** sales organisation
- **1397** rescue
- **1415** vessels: my vessel overview and the market
- **1445** the boat market: tabs for the open group, boats with a closed-group right, the coastal fleet over 11 m and the ocean fleet;
- **1557** the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)
- **1624** equipment
- **1658** gear: in the sea, aboard (baiting and mending), and the shop
- **1659** gear care (core/10b-gearcare.js): the condition of the gear aboard, and what the crew can do about it in port
- **1664** a line kind as it stands (Jonas 20.10.2026, tilbakemelding #74: «hva båten har slags fiskeredskaper ombord og hva disse eventuelt er
- **1786** crew
- **1790** the crew, person by person
- **1843** bank
- **1861** messages
- **1869** actions

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

## `src/js/ui/05f-turer.js` (148 linjer)

---------- Turoppdrag in the Oppdrag app (core/09g-turer.js): the board made from where the boat is, and the missions taken ----------

- **1** Turoppdrag in the Oppdrag app (core/09g-turer.js): the board made from where the boat is, and the missions taken
  - 7 `turCard(m, act, det)`
  - 40 `turPage()`
  - 55 `turGo(id)`
  - 78 `turSvg(u, inV)`
- **88** the measuring board (Havforskningsinstituttet's sample, core turProveFish): each fish lies with its snout against the board's
  - 93 `turMeasure(id)`
- **129** the lighthouse picture: the shutter shows within 3 km of the lighthouse while the 3D view is up; without it the card's button
  - 133 `turFotoKeep(id, img)`
  - 134 `turFotoSrc(id)`
  - 135 `turFotoUi()`
  - 139 `turFotoShoot(id)`

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

## `src/js/ui/06b-book-tabs.js` (158 linjer)

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
  - 146 `gearLogEntry(s)`
  - 150 `bookTabPages(t)`

## `src/js/ui/06c-notebook.js` (44 linjer)

Father's naust: setting it to rights and the trophy wall (core/07c-naust.js, core/09b-records.js)

- **1** Father's naust: setting it to rights and the trophy wall (core/07c-naust.js, core/09b-records.js)

## `src/js/ui/06d-season-folk.js` (50 linjer)

the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js)

- **1** the phone's Sesong and Folk apps (05.10.2026; the rules are in core/09c-seasons.js and core/09d-folk.js)

## `src/js/ui/06e-feedback.js` (252 linjer)

Tilbakemelding: the players' feedback on the phone (05.10.2026)

- **1** Tilbakemelding: the players' feedback on the phone (05.10.2026)

## `src/js/ui/06f-fishguide.js` (168 linjer)

the phone's Fiskeguide app (08.10.2026; Jonas: «en intuitiv app til telefonen der spillere kan gå inn å lese kjapt om hvor de burde

- **1** the phone's Fiskeguide app (08.10.2026; Jonas: «en intuitiv app til telefonen der spillere kan gå inn å lese kjapt om hvor de burde
- **74** the gear (20.10.2026: read from the model, as it fishes): how much each takes of the species against the plain jig (1). The jig
- **100** the month view
- **116** the year view
- **124** the species card

## `src/js/ui/07-guide.js` (353 linjer)

  - 1 `renderClock()`
  - 10 `mottakShut()`
  - 11 `chartMode()`
  - 13 `chartNight()`
  - 15 `echoSettings()`
  - 24 `chartSettings()`
  - 32 `panelRoute()`
  - 113 `echoSvg()`
  - 131 `panelFish()`
  - 153 `valueEst(sp, g)`
  - 154 `panelHold()`
  - 170 `fcChart()`
  - 185 `panelWx()`
  - 217 `landText(short)`
  - 226 `deckText(short)`
  - 241 `quayText(short)`
  - 247 `panelPort()`
  - 279 `portSlip()`
  - 316 `landWarn(p)`
  - 329 `landPage()`
  - 342 `panelLog()`
  - 347 `renderPanel()`
  - 351 `panelBusy()`

## `src/js/ui/07b-first-trip.js` (316 linjer)

---------- «Første tur»: the guided first trip every new player goes through ----------

- **1** «Første tur»: the guided first trip every new player goes through
  - 16 `tutEv(k, settle)`
  - 17 `tutMark(k)`
  - 18 `tutSettle(k)`
  - 24 `tutFieldWp(list)`
  - 33 `dockApp(menu, item, page, inner)`
  - 38 `phoneApp(app, inner)`
  - 50 `tutNaustTry()`
  - 57 `tutIntroGo()`
  - 195 `tutAdrift()`
  - 203 `tutDriftTip(d)`
  - 220 `tutTip(st)`
  - 228 `tutReveal(el)`
  - 234 `tutRect(T0)`
  - 240 `tutStep()`
  - 246 `tutFinish()`
  - 247 `tutScrollSlip()`
  - 250 `tutAllow(what)`
  - 268 `tutView(st)`
  - 275 `tutUpdate()`
  - 294 `tipPlace(txt, T0, o)`

## `src/js/ui/07c-handbook.js` (135 linjer)

Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)

- **1** Håndboka: chapters 2–6 of the on-boarding as drips, and the app that keeps every tip (docs/onboarding.md 3–4, Jonas 09–10.10.2026)
  - 10 `hbState()`
  - 84 `hbPick()`
  - 92 `hbEv(id, how)`
  - 93 `hbDone(id)`
  - 94 `hbSkip(ch, id)`
  - 96 `hbReady()`
  - 98 `hbUpdate()`

## `src/js/ui/10g-wardrobe.js` (125 linjer)

Garderoben: the player changes how his figure looks (Jonas 10.10.2026)

- **1** Garderoben: the player changes how his figure looks (Jonas 10.10.2026)
- **14** the right-hand side: what the current tab offers
- **43** the little renderer

## `src/js/ui/08-actions.js` (411 linjer)

actions

  - 6 `doAct(el)`
  - 72 `panelInput(e)`
  - 77 `panelChange(e)`
  - 100 `landConf(H, q, acc)`
  - 128 `sell()`
- **232** modal
  - 234 `modal(html)`
  - 243 `boatUnnamed()`
  - 244 `boatChristen(nm)`
  - 246 `showIntro(namesOnly)`
- **261** «Mens du var borte» (Jonas 07.10.2026: «en følelse av instant-belønning»)
  - 266 `awayStart(mins, realMs)`
  - 267 `awayEnd()`
  - 268 `showAway(A)`
- **295** time
  - 300 `playMinutes(n)`
  - 304 `catchUp(realMs)`
  - 315 `tick()`
  - 352 `deliverOrder()`
- **362** chrome
  - 363 `applyLang()`
- **376** screens: full-screen 3D, or the chart plotter for route planning
  - 377 `setBodyView(v3d)`
  - 381 `openPlotter()`
  - 386 `plotSetRender()`
  - 390 `plotSetOpen(on)`
  - 403 `kinoUi()`

## `src/js/ui/08b-letter.js` (126 linjer)

---------- the opening: the letter from Father ----------

- **1** the opening: the letter from Father
  - 28 `letterPic(k)`
  - 32 `letterSound(kind)`
  - 44 `showLetter(done)`

## `src/js/ui/08c-start.js` (135 linjer)

«Hvor står fars naust?»: where a new game starts (05.10.2026)

- **1** «Hvor står fars naust?»: where a new game starts (05.10.2026)
  - 23 `startInfo(pt)`
  - 45 `startSeaMax(q, H0)`
  - 47 `startRing(pt)`
  - 48 `startWx(pt, H0)`
  - 56 `showStart(done)`
  - 107 `tutFieldNear(pt)`
  - 120 `chooseStart(pt, onProgress)`

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

## `src/js/ui/09c-pubsoc.js` (168 linjer)

---------- the pub's social side (ui/09b-pub.js; supabase/migrations/20261009120000_pub.sql) ----------

- **1** the pub's social side (ui/09b-pub.js; supabase/migrations/20261009120000_pub.sql)
- **11** who is here tonight: the players' boats lying in this harbour
- **57** the harbour's fiskarlag
- **94** the week's quiz: five questions from the bank, the same for everyone in a game week

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

## `src/js/ui/10c-dock.js` (332 linjer)

---------- the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side ----------

- **1** the dock: round buttons along the bottom that follow what the boat is doing, and the drawer at the side
- **280** the drawer
  - 322 `renderActs()`

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

## `src/js/ui/10g-push.js` (201 linjer)

PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and

- **1** PUSH NOTIFICATIONS (05.10.2026, the list's 9: «Push-varsler i appen»; supabase/migrations/20261005120000_push.sql and
  - 30 `pushHas()`
  - 32 `pushKey()`
  - 39 `pushOn()`
  - 53 `pushOff()`
  - 63 `pushAuto()`
  - 66 `pushAsk()`
  - 78 `pushItems(now)`
  - 169 `pushPlan(away)`
  - 177 `pushStart()`
  - 185 `pushCardRow()`
  - 192 `pushCatToggle(k)`
  - 197 `pushToggle()`

## `src/js/ui/10h-world.js` (123 linjer)

---------- the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql) ----------

- **1** the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql)
  - 11 `worldTick()`
  - 42 `gearSync(now)`
  - 58 `peerLogo(hid, ver)`
- **68** the shared world V2 (05.10.2026; core/03-simulation.js WSH): one sea, one quota and one market. Every ten minutes, and soon
  - 77 `worldShare()`
- **99** the leaderboards (05.10.2026; Salgslaget → Toppliste; supabase/migrations/20261006020000_toplist.sql): the players of the whole
  - 104 `worldTop(w, grp)`
  - 115 `worldStart()`

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

## `src/js/ui/10o-ptow.js` (169 linjer)

---------- towing between players (Jonas 09.10.2026; supabase/migrations/20261009260000_tows.sql) ----------

- **1** towing between players (Jonas 09.10.2026; supabase/migrations/20261009260000_tows.sql)
  - 11 `ptowTowing()`
  - 13 `ptowStep()`
- **28** the one who needs help
- **67** the helper
- **110** the polling
- **124** the chart: the asks near, and the card

## `src/js/ui/10p-install.js` (69 linjer)

put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)

- **1** put the game on the home screen (Jonas 11.10.2026: «Det er viktig at brukerne laster ned spillet»)

## `src/js/ui/11-boot.js` (148 linjer)

---------- boot ----------

- **1** boot
  - 7 `bootMap()`
  - 10 `bootMapLoad()`
  - 29 `bootGame()`
  - 132 `bootFail(e)`

## `src/js/vessel3d.js` (1264 linjer)

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
- **354** detailed models from GLB files (tools/boats, built in Blender from the yards' drawings)
  - 363 `glbParse(b64)`
  - 384 `glbLoad(type)`
  - 389 `glbPart(type, name)`
  - 392 `glbPaint(part, liv)`
  - 400 `glbZones(type)`
  - 405 `glbModel(type, lod, liv)`
  - 430 `vesselSpec(type)`
  - 431 `buildVesselModel(type, lod, liv)`
  - 471 `vesselGeo(type, hs, sp, house, anch)`
  - 483 `vesselModel(type)`
  - 484 `geoOf(type)`
- **488** the paint shop (ui/10j-paint.js; Jonas 06.10.2026): the hull colours a player can paint their own boat in, in VC's scale. A boat's
  - 507 `modelLiv(L)`
  - 514 `hullLiv(b)`
  - 515 `livKey(liv)`
  - 517 `livGeo(liv)`
  - 522 `livStr(b)`
  - 534 `livPen(s)`
  - 536 `livMark(s)`
  - 537 `livParse(s)`
- **542** paint designs (Malerverkstedet): a stripe under the sheer (ripe), a second colour on the lower topsides (totone), a stripe at the
  - 546 `topsides(type)`
  - 564 `designLines(TS, liv)`
  - 573 `glbDesign(type, part, liv)`
  - 607 `designFits(type, k)`
  - 614 `kitLiv(liv)`
- **616** flags (Malerverkstedet, 07.10.2026): the ensign at the stern as a picture, so any nation and shape can fly. Each flag is drawn here
- **665** the company logo (Malerverkstedet, 07.10.2026): made here from a sign, initials and two colours, or the player's own picture
  - 676 `logoCanvas(cv, L, img)`
  - 687 `logoStrips(type)`
  - 689 `logoStr(L)`
  - 690 `logoParse(s)`
  - 694 `flagCanvas(cv, code, shape, logo)`
  - 706 `flagOf(L)`
- **707** the boat's name on her hull (Jonas 07.10.2026: «Pass på at båtnavnet vises godt på skroget på alle båtene»): a strip on each side
  - 716 `hullTris(type)`
  - 730 `sideStrip(type, frac, hMax, aspect, drop)`
  - 762 `nameStrips(type)`
  - 798 `stripProud(type, st)`
  - 821 `stripPaint(type, st)`
  - 842 `markStrips(type)`
  - 862 `anchorLen(bw)`
  - 865 `markRGB(type, liv)`
  - 873 `hullRGB(type, liv)`
  - 883 `npcKit(L, B)`
  - 886 `npcModel(type, lod, liv)`
  - 888 `personVB(B, x, y, z, seated, hands, suit, kit)`
- **900** people from tools/harbour/arbeider.py: one body in parts, posed at its joints and painted per kit
  - 913 `wkPart(name, kit)`
  - 923 `wkPut(B, o, ax, s, at)`
  - 933 `wkLimb(B, o, A, E, r)`
  - 940 `figureVB(B, x, y, z, seated, hands, kit)`
  - 962 `vesselSVG(type, w, h)`
- **1000** the deck map: where people can walk on each type (the crew plan, docs/mannskap-plan.md)
  - 1007 `deckMap(type)`
  - 1136 `deckPass(M, k, q)`
  - 1141 `passLine(M, A, B)`
  - 1143 `linkPass(M, k, q)`
  - 1147 `deckComp(M)`
  - 1156 `deckPath(M, a, b)`
- **1187** the lanterns after Sjøveisreglene (FOR-1975-12-01-5, rules 22–30, read on Lovdata 17.10.2026; docs/batplan.md del 11)
  - 1200 `lanterns(G, V, st)`
  - 1228 `deckPoints(type)`

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

## `src/js/view3d.js` (6036 linjer)

- **2** 3D VIEW (plain WebGL, no dependencies)
  - 27 `qualSet()`
  - 29 `qualTick(dt, fps, now)`
- **60** math
  - 61 `persp(fovy, asp, n, f)`
  - 62 `viewDir(f, up)`
  - 69 `mul(a, b)`
  - 70 `model(px, py, pz, yaw, pitch, roll)`
- **78** noise
  - 79 `vn2(x, y, s)`
  - 84 `fbm(x, y, o, s)`
  - 85 `ridged(x, y)`
  - 86 `rng(seed)`
- **88** shaders
  - 362 `cloudStep(dt)`
  - 368 `skyFrame(u, Hh, tn, bv)`
  - 380 `compile(type, src, nm)`
  - 386 `program(vs, fs, attrs, nm = '?')`
  - 394 `buf(data, target, usage)`
  - 395 `attr(loc, b, size)`
  - 404 `upload(pos, col, idx)`
- **406** mesh builder
  - 407 `MB()`
- **450** terrain
  - 478 `terrRaw(x, z, dil)`
- **496** The water at the berths the company holds in the coast's harbours (core/07e-havn.js)
  - 503 `berthPits()`
  - 522 `npcPits()`
  - 542 `berthPit(x, z, h)`
- **550** Father's naust and the Finnsnes shop (tools/harbour/naust.py, butikk.py; where: core/07c-naust.js)
  - 567 `rorbuNow()`
  - 573 `sitesNow()`
  - 600 `siteTerr(x, z, h)`
  - 622 `onSite(x, z)`
  - 632 `tileIn(kind, tx, ty)`
  - 633 `tileH(L, kind, x, z)`
  - 640 `terrH(x, z)`
  - 649 `unitTerr(x, z, h0)`
  - 674 `terrCoarse(x, z, dil)`
  - 684 `forestAt(x, z)`
  - 698 `meshBegin(x0, z0, sx, sz, n, hf)`
  - 702 `meshRows(B, until)`
  - 714 `meshEnd(B)`
  - 726 `makeMesh(x0, z0, sx, sz, n, hf)`
  - 727 `freeMesh(m)`
  - 729 `nearSurf(M, x, z)`
  - 739 `unitPatch(U, M)`
  - 764 `buildPatches()`
  - 773 `buildTerrain()`
  - 782 `stream3d()`
- **795** the coast's packs (01c-vec.js, part 4 of the coast-wide plan): buildings, roads, bridges, piers and breakwaters
  - 802 `tileStatics()`
  - 831 `tileStep()`
  - 851 `drawTileStatics(TM, eye)`
  - 858 `meshTask(kind, cur, x0, z0, span, n, hf, done)`
  - 869 `meshStep()`
  - 876 `staleMesh(kind)`
  - 877 `staleOver(pk)`
  - 888 `updateFar()`
  - 899 `meshH(m, x, z)`
  - 904 `shadeH(x, z, dd)`
  - 906 `shSeed(m, old)`
  - 915 `updateShadows()`
  - 944 `updateMid()`
  - 949 `updateNear()`
  - 952 `nearWanted()`
  - 962 `fineWanted()`
  - 969 `recolor(m, snow)`
- **1000** the breakwaters' armour stones: a mesh a breakwater, drawn only within STONE_R of the eye (beyond it a stone is less than a
  - 1004 `stonesOf(list, build)`
  - 1009 `drawStones(list, TM, eye)`
- **1012** villages and quays
  - 1021 `fyrInto(m, f)`
  - 1036 `markInto(m, mk, tag)`
  - 1050 `marksStatics()`
  - 1060 `buildStatics()`
  - 1099 `pierInto(m, q, tag)`
  - 1112 `slabInto(m, pts, tag, cut)`
  - 1128 `bridgeInto(m, br, tag)`
- **1169** breakwaters (the user's wish 03.10.2026: they shelter the boats at the quays, and should look it)
  - 1177 `rockInto(m, x, y, z, sx, sy, sz, seed, k)`
  - 1192 `moundTop(x, z)`
  - 1201 `moundInto(m, pts, seed, unit, tag, sm)`
- **1265** harbour fittings along the berth faces: tyres hung on chains, a timber fender beam, the yellow edge and bollards
  - 1267 `obox(nb, c, u, n, len, wid, y0, h, k)`
  - 1273 `buildHarbourFittings()`
- **1297** real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor
  - 1302 `bldCells(key)`
  - 1310 `vecBldIn(t, key)`
  - 1314 `loadBuildings()`
  - 1335 `onQuayStrip(x, z)`
  - 1340 `bldOnUnit(B, i)`
  - 1351 `buildChunk(key, detail)`
- **1386** details: chimney, windows, doors (only close to the boat)
  - 1429 `addTrees(m, key, srcs, snowy)`
  - 1455 `addRoads(m, key, snowy)`
  - 1476 `freeChunk(c)`
  - 1477 `updateChunks(maxBuilds)`
  - 1494 `drawBuildings(TM)`
  - 1513 `lightY(L, x, z)`
  - 1514 `lightOn(L, t)`
  - 1515 `drawSeaLights(VP, eye, t, near)`
- **1530** lights that light up round them at night (the user's wish 03.10.2026)
  - 1535 `pickLights(eye, t)`
  - 1556 `plSet(u)`
  - 1561 `drawBeams(VP, eye, t)`
  - 1589 `drawChunkLights(VP, eye)`
- **1596** the harbour unit (tools/harbour/kaimottak.py): quay, fish plant, crane, forklift, ice silo and bunker station in one
  - 1603 `unitModel(v)`
  - 1615 `onUnit(x, z, m)`
  - 1619 `craneGeo(P, q)`
  - 1627 `drawUnitParts(P, eye, q, st, k, ch, T)`
- **1641** the yard's ship lift (tools/harbour/steder.py; Jonas 07.10.2026: «dock eller slipvogn som kan tørrlegge alle båtene»)
  - 1649 `liftStep(dt, b)`
  - 1662 `drawYardLift(U, eye, M, UM)`
  - 1671 `drawUnits(eye, VP, near, far, skip)`
  - 1690 `siteSnow(P, snow)`
  - 1704 `siteModel(k)`
  - 1714 `drawSites(eye, VP, near, far)`
- **1723** fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay
  - 1725 `plantLayout(pt)`
  - 1735 `buildPlants()`
  - 1745 `buildPlantParts()`
  - 1775 `roundAt(R, T)`
  - 1786 `plantRounds(P)`
  - 1800 `workLow(st, T, idx)`
  - 1825 `workTurn(st, eye, T, idx)`
  - 1833 `drawWorker(P, st, eye, T, idx)`
- **1920** the work on deck, step by step (Jonas 20.10.2026: «Alle deler av arbeidsprosessene må ha egne animasjoner»); the places the
- **2018** the breaks (Jonas 23.10.2026: «Husk at vi må ha animasjoner for alle handlinger og aktiviteter»; core/13-work.js idleAssign)
- **2119** the props of the deck work (the poses above): the fish in the hands and on the table, the guts over the rail, the crate and the
- **2178** landing the catch
  - 2193 `deckSlots(kind)`
  - 2200 `fkRun(P)`
  - 2215 `legAt(g, w)`
  - 2224 `landScene(P, T, BMrel, eye)`
  - 2267 `follow(P, key, st, T, v)`
  - 2275 `drawPlant(P, eye, VP, T, BMrel)`
  - 2308 `plantsCoast(eye)`
  - 2316 `nearestPlant(eye)`
- **2318** work on deck: the bleeding tub and the gutting table on the after deck; whoever works the deck guts or ices there
  - 2320 `deckActivity()`
- **2329** the deck kit (the user's wish 19.10.2026, tools/deck/*.py): the fish tubs, the gaff and the knife, the gutting table and
  - 2333 `kit(f, nm)`
  - 2336 `kitX(f)`
- **2338** the hands in their grips (tools/harbour/hender.py): the meshes once for all the figures (the glove is the same on every look),
  - 2341 `handMeshes()`
  - 2353 `handFrame(z0, sp, side)`
  - 2362 `handSpecs(st, F, R, hands)`
  - 2408 `toolM(A, dir)`
  - 2415 `dkEvent(kind, at, sp, kg, o)`
  - 2421 `dkFor(who, p, task)`
  - 2429 `dkEv(e, BMrel, G)`
  - 2431 `catchQ()`
  - 2436 `dkTick()`
  - 2447 `dkBloodDraw(VP)`
  - 2456 `rigAt(G, kind, d)`
  - 2460 `drawNetTub(BMrel, at, fill, ry)`
  - 2466 `drawLineTubs(BMrel, at, n, baited, green, ry, fill)`
  - 2477 `jobTubs(j)`
  - 2481 `drawMendNet(BMrel, G, d, R)`
  - 2495 `drawRigRest(BMrel, G, d)`
- **2507** the kit on the model's places (G.kit, from the boat's model; tools/deck): the life-saving gear the rules ask for (V.lsa,
  - 2513 `boyeCanvas(txt)`
  - 2519 `boyeTex()`
  - 2524 `boyeQ()`
  - 2525 `drawSafety(BMrel, G, VP, t)`
  - 2546 `cargoUnits(G)`
  - 2547 `drawCargo(BMrel, G, hide)`
  - 2562 `crFrames(X, Q, BMrel, p)`
  - 2571 `crLink(X, a2)`
  - 2574 `drawCrane(BMrel, G, VP, t, d)`
  - 2630 `dkTub(G)`
  - 2631 `drawDeck(BMrel, eye, VP, t, DK)`
- **2684** passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling
  - 2686 `buildGear()`
  - 2712 `drawGearSea(eye, t, VP, H)`
  - 2734 `drawSetting(BMrel, t, g, G, stack, x0)`
  - 2751 `haulFish(g)`
  - 2760 `haulModel(kind)`
  - 2769 `gopHauls()`
  - 2781 `potDeck(G, HP, sx, d, pw, vt)`
  - 2793 `tankAt(x, z, d, vt)`
  - 2811 `drawPots(BMrel, t, g, G, HP, sx, d, skiff, seg)`
  - 2867 `drawCrabTank(BMrel, G, d, sx, HP)`
  - 2874 `drawGearOp(BMrel, eye, VP, t)`
- **2943** bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle
  - 2945 `buildBunkers()`
  - 2973 `nearestBunker(eye)`
  - 2974 `drawBunker(B, eye, VP, T, BMrel)`
- **3007** boat
- **3009** the starter boat: a 19 ft centre-console skiff, modelled in detail
  - 3058 `NB()`
  - 3066 `lookMesh(look)`
  - 3073 `nSetup(VP)`
  - 3079 `wearOn(t)`
  - 3080 `wearOff()`
  - 3081 `drawN(m, M)`
  - 3083 `texStrip(Pb, Pt)`
  - 3084 `texQuad(P0, P1, P2, P3)`
  - 3085 `mkTex()`
  - 3086 `upTex(t, cv)`
  - 3087 `drawTexQuad(q, tex, M, VP, lit, nrm)`
- **3095** the open boats worked by hand: one kit per type
  - 3103 `refreshPeople(K)`
  - 3114 `useHand(t)`
  - 3120 `handKit(t)`
  - 3141 `buildSkiff()`
- **3352** the skiff's live instruments
  - 3362 `engineOn()`
  - 3363 `paintPlotter()`
  - 3409 `dial(g, cx, cy, r, v0, v1, v, a0, a1, ticks, labels, title, redFr…)`
  - 3420 `paintGauges(dt)`
  - 3436 `paintVhf()`
  - 3446 `paintName(t, liv)`
  - 3453 `markCanvas(cv, txt, light)`
  - 3459 `markTex(t, liv)`
  - 3467 `imgOf(src)`
  - 3468 `curLogo()`
  - 3469 `logoTexOf(L, img)`
  - 3477 `logoQ(t)`
  - 3478 `drawLogo(t, M, VP, L, img)`
  - 3481 `markQ(t)`
  - 3482 `drawMark(t, M, VP, liv)`
  - 3483 `nameCanvas(cv, nm, light)`
  - 3492 `nameTex(nm, light, mark)`
  - 3500 `drawNPCNames(kit, VP)`
  - 3515 `nameQ(t)`
  - 3517 `paintHand()`
  - 3526 `limbM(A, B, r)`
  - 3529 `drawSkiff(BMrel, VP, dt, showSkipper, showCrew)`
  - 3663 `drawSkiffGlass(BMrel, VP)`
  - 3668 `jigRail(t, G)`
  - 3685 `drawJigRail(BMrel, VP, t, G, dt)`
  - 3716 `drawGlass(m, BMrel, VP)`
  - 3722 `buildBoat()`
  - 3748 `buildFlag()`
  - 3760 `flagTex()`
  - 3775 `penTex()`
  - 3788 `mastTop(G)`
  - 3792 `updateFlag(t, appW)`
- **3804** sea
  - 3806 `buildPatch()`
  - 3814 `buildSea()`
- **3823** the waves: wind sea and swell from the sea model (03b-sea.js)
  - 3829 `specW(L0)`
  - 3830 `updateWaves(dt, H)`
- **3856** the near field: the short sea rides with the boat
  - 3865 `nfStep()`
- **3876** the boat's own waves (the uniforms of WAKE_GLSL)
  - 3881 `updateWake()`
  - 3894 `wakeHFast(x, z)`
- **3902** the sea state over the near terrain and the whole map
  - 3909 `ssLevel(n, unit)`
  - 3911 `ssRect(L)`
  - 3912 `ssWork(L, until)`
  - 3935 `ssStep(rdt)`
  - 3937 `ssBlend(L)`
  - 3939 `ssTex(L, x, z, out)`
  - 3946 `ssAt(x, z)`
  - 3955 `seaDisp(x, z, t, S, fade)`
  - 3966 `seaFade(x, z)`
  - 3967 `seaH(x, z, t)`
  - 3973 `seaHFast(x, z, t)`
- **3975** environment
  - 3977 `pal(el)`
  - 3982 `computeEnv(H)`
- **4011** mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off)
  - 4015 `buildMooring()`
  - 4017 `berthNow()`
  - 4023 `approach(F, bp, u0, du0)`
  - 4034 `pathM(pts)`
  - 4039 `pathAt(M, s)`
  - 4040 `lieAlongside(dt, bp)`
  - 4043 `moorStep(dt, bp, at = dt)`
  - 4075 `drawMooring(BMrel, eye, VP, t)`
- **4098** boat motion
  - 4099 `currentFrac()`
  - 4100 `predict(frac)`
- **4108** along the route (Jonas 06.10.2026: «båten strengt må følge rutestreken som lages i kartplotteren», «Svingingen kan være
  - 4121 `trkBuild(pl, dep)`
  - 4148 `trkAt(T, s)`
  - 4154 `trkProj(T, x, z, s0, back = 30)`
  - 4164 `trkOn()`
  - 4180 `trkHaltNeed()`
  - 4185 `trkStep(dt, pr)`
  - 4221 `dynFollow(dt)`
  - 4229 `updateBoat(dt, t, frac, rdt)`
- **4307** particles
  - 4311 `spawn(x, y, z, vx, vy, vz, life, g)`
  - 4313 `drawPts(n, mode, VP, col, size, round, off, mx)`
- **4322** drawing
  - 4323 `litSetup(VP)`
  - 4329 `drawLit(m, M, hole)`
  - 4338 `terProg(q)`
  - 4346 `drawTerrain(TM, eye, VP, near)`
  - 4366 `buildGround()`
  - 4401 `buildLandMask()`
  - 4424 `lmStep()`
  - 4457 `seaRing(u, eye, y, R, Hl)`
  - 4467 `drawSea(VP, eye, t, far, drop)`
- **4507** setup
  - 4536 `init()`
  - 4632 `anchorAlarm3d(kind)`
  - 4635 `sayBoat(id, txt)`
  - 4637 `sayWorker(pid, idx, nm, no, en)`
  - 4641 `crewFx3d(c, kind, o)`
  - 4643 `say3d(c, no, en)`
  - 4647 `buildLabels()`
  - 4648 `resize()`
- **4654** wildlife
  - 4655 `bodyLoft(m, L, R, prof, col, belly, y0)`
  - 4659 `buildWild()`
  - 4686 `wildSpawn(t)`
  - 4700 `blow(x, y, z)`
  - 4701 `drawWild(eye, t, dt, M0)`
  - 4755 `drawBlows(VP, eye, dt)`
- **4765** other vessels
  - 4766 `shipHull(m, L, B, D, F, hull, bottom, deck)`
  - 4773 `windows(m, x0, x1, y, z, h, col, sideX)`
  - 4774 `buildNPC()`
  - 4804 `pvm(t, liv)`
  - 4819 `personMesh(kind, look, key)`
  - 4831 `people()`
- **4835** the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved
  - 4842 `trawlKit(t)`
  - 4850 `alongM(A, d)`
  - 4857 `trawlState(now)`
  - 4866 `drawTrawl(t, A, BMrel, now)`
- **4891** the purse seine (tools/boats/not75.py; Jonas 06.10.2026: «Denne kan både bruke ringnot og trål og trenger dermed
  - 4897 `seineState(now)`
  - 4903 `drawSeine(t, A, BMrel, VP, now)`
  - 4942 `drawDeckCrew(BMrel, eye, VP, t, G)`
  - 5001 `spHold(f)`
  - 5004 `deckWork(G)`
  - 5012 `drawHelmKit(BMrel, eye, G)`
  - 5021 `drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named)`
  - 5043 `npcMesh(n, lod)`
  - 5052 `drawNPC(eye, t, H, VP)`
  - 5085 `npcCrewDraw(n, K, eye, t)`
- **5106** the rescue boat (tools/boats/redning.py) and its tow line, where core/05-vessels.js towPose says
  - 5109 `drawTowLine(BMrel, VP)`
- **5119** the boat's own anchor (tools/deck/anker.py, core/06e-anchor.js; Jonas 21.10.2026)
  - 5132 `frameM(o, z, up, s)`
  - 5134 `drawMany(m, Ms)`
  - 5136 `ancMesh(bw)`
  - 5141 `ancStow(F, P, bw, L)`
  - 5152 `rodePts(A, F, Lr, n)`
  - 5165 `rodeDraw(pts, dm, rope, wy, Lr, CH, M)`
  - 5187 `ancSplash(x, y, z, n, up)`
  - 5190 `drawNPCAnchor(n, K)`
  - 5194 `drawAnchor(BMrel, eye, VP, t)`
  - 5243 `buildRescue()`
  - 5249 `drawRescue(BMrel, eye, VP, t)`
  - 5263 `drawRescueLights(VP, t)`
- **5270** the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py)
  - 5274 `buildDocks()`
  - 5280 `drawDocks(eye, t, VP)`
- **5312** the floating docks among the packs' piers (01c-vec.js flyteTile, tools/harbour/brygge.py; tilbakemelding #94)
  - 5325 `floatFree(k)`
  - 5326 `floatJob(t, FD, solid)`
  - 5377 `drawFloats(eye, t, VP)`
- **5395** aircraft (tools/air/fly.py) where core/05c-air.js airStates puts them, within about 15 km of the eye
  - 5397 `buildAir()`
  - 5402 `drawAir(eye, t, H, VP)`
  - 5416 `drawAirLights(VP, t)`
  - 5426 `drawNPCGlass(VP)`
  - 5427 `drawNPCLights(VP)`
- **5441** the chase camera stays out of solid things
  - 5447 `camSolid(x, z, sx, sz, ry, y0, y1, tag)`
  - 5454 `camBuildings(key)`
  - 5462 `camBld(B, idx, tag)`
  - 5473 `camDropTag(tag)`
  - 5476 `camFree(o, e)`
  - 5499 `camInside(x, y, z)`
  - 5506 `compassStrip(W, H, dpr)`
  - 5518 `compassDraw(az, p)`
- **5531** frame
  - 5535 `fpsEl()`
- **5541** cinema (the user's wish 03.10.2026)
  - 5548 `kinoWant(K, t)`
  - 5559 `kinoNext(t)`
  - 5578 `kinoCam(t, rdt)`
  - 5598 `introStart(sec)`
  - 5603 `frame()`
  - 5605 `frame0()`
  - 5775 `snapTake()`
  - 5780 `drawRoute(VP, eye)`
  - 5792 `driftSpray(VP, eye, dt, t, col)`
  - 5807 `drawSmoke(VP, eye, BM, dt)`
  - 5834 `drawEffects(VP, eye, BM, dt, t)`
  - 5935 `updateLabels(VP, eye, W, Hh)`
- **5953** controls
  - 5970 `paintView(on)`
  - 5975 `paintAim(C, yawW)`
  - 5982 `showroom(type)`
  - 5991 `show(on, auto)`
