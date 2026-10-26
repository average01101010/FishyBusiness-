# Backlogg: kjente problemer og åpne spørsmål

> Den ene lista over det som gjenstår. Hver økt oppdaterer den som siste handling (`/okt-slutt`): nytt inn under riktig overskrift, det som er rettet flyttes til «Strøket» nederst med dato og commit. Kapittel 10 i overleveringen flyttet hit ordrett 26.10.2026 (`docs/utviklingsplan.md`, fase A3).

## Spillarbeid som venter (26.10.2026)

- **Driftsplan 2** (Jonas 26.10.2026): fullstendig redesign av driftsplanen med nye øyne. Oppdraget, kravene R0–R10 og scenariene S1–S14 står i `docs/planer/driftsplan-2/00-oppdrag.md`. Fase 0 (revisjon) og 1 (design) først, uten kode; så én del per økt. Går foran sikkerheten SK1–SK6.
- **Sikkerhet SK1–SK6** (oppgave #164): Blender-modeller (vest, drakt, leider, livbøye, PLB), risiko, mann over bord, nødstopp, utstyr og kurs, nestenulykker. Ikke begynt.
- **Brygger uten `floating=yes`** står som grå kasser (Kristiansand og Hammerfest har flest). Alternativ b fra #94 (kassene med dekke, pæler og utriggere) er ikke bygd.
- **NPC-båter ved flytebrygger tegnet som linje** ligger rundt 0,9 m fra pontongkanten (kaiplassen regnes mot en brygge på 4,2 m).
- **Utviklingsplanen** (`docs/utviklingsplan.md`): E1 (oppdelingen av `view3d.js` og `05-phone.js`), E4 (de røde testene i 10.6: gjort 26.10.2026 så nær som tegnetiden i charttest, en ytelsesoppgave), D4 (rutinen får stikkprøver og skjermbilder) og D5 (ukentlig regresjon).

## 10. Kjente problemer og åpne spørsmål

Gjennomgått punkt for punkt mot koden, git-loggen og feilloggen 24.10.2026. Det som var løst, er strøket (lista nederst). Resten er sortert: feil som skal rettes, spillbarhet, anslag, valg, det som må måles, testene og små ryddejobber.

## 10.1 Feil som skal rettes

- **Noen få leibiter i NPC-rutene skjærer et hjørne av land** (`gr.pts` fra `npc.py` brukes som de er). Målt mot vektorkysten 24.10.2026: 5 av 119 leibiter rundt Tromsø, hver med rundt 10 m (ett målepunkt). Rettes best i `npc.py`.
- **3D på Galaxy A52s (Adreno 642L, oppgave #171):** 3D starter nå med en enklere sjø (6ce4f50, 2c349cd), men konteksten mistes under spill (feilloggen: fire ganger, 11–17 minutter ut i økta og én gang etter 83, på alle kvalitetsnivåer, sist 23.10.2026). Spillet lagrer og laster siden på nytt da. Fra 24.10.2026 skriver feilloggen også om siden var skjult og hvor lenge, hvor lenge 3D har gått, levende buffere og teksturer, kvalitetsnivå, terrengbiter og JS-minne (`glDiag`, `GLN` i `view3d.js`). En seiling på 30 km i testmiljøet ga ingen lekkasje (1 000–1 076 buffere og 15 teksturer hele veien), men JS-minnet var 347 MB.

## 10.2 Spillbarhet (fra spilltestene og egne notater)

- **Fangsten er uforklart, og den garanterte første turen gir feil forventning** (spilltest 2): full last på første tur (`03-simulation.js`, påfyllingen i `05-vessels.js`), nå også med luksushaill. Etter første levering sier ingenting at turen var ekstra god eller hva vanlig fiske gir. Varmekartet, ekkoloddet, fangstmerkene og Fiskeguiden viser nå hvor fisken er.
- **Planleggeren viser ikke bølger langs ruta**, bare «her» og på åpent hav i Vær-fanen.
- **Innloggingsbonusen** sier «Hver dag du åpner spillet gir 1 % til», men ikke at det er ekte dager eller når neste prosent kommer (kjernen regner riktig med kalenderdager).
- **De navngitte fangstfeltene finnes bare på Senja** (spilltest 1: «fangstfeltene har liten vekt»). Resten av kysten har varmekartet og ekkoloddet.
- **Reglene** ble lagt der spilleren er i R4 (05.10.2026: røde linjer i rutekortene, sperre ved «Kast loss», regelrad i statusboksen, førstegangstips). Bekreftes i neste spilltest.
- **Fiske inne i havna i kuling** har ingen egen regel (`inHarbour` brukes ikke av fisket).
- **Mannskapet er ikke spilltestet:** du våkner med 60 % (`ENERGY.wake`); uten noen med kokk ≥ 3 blir det tørre brødskiver hvert 6. time, som gir −6 i trivselen; båter uten bysse får matpakke (−3). Følg med på om det blir for hardt.

## 10.3 Anslag og antakelser (tall uten sikker kilde)

- **Penger og stigen:** kvoteprisen 260 kr/kg (`KPK`, ett salg i 2025 på rundt 270 kr/kg; ingen kilde publiserer kvotepriser), Innovasjon Norges vilkår (15 %, 8,9 %, 10 år, ikke funnet), havbåtenes priser og vekt, snøkrabbekonsesjonen (bare en tekst), blad B som forenkling av deltakerloven § 6.
- **Kvotemodellen (04.10.2026):** totalkvoten for 2027 (HIs råd med inntil 8 % over; sjekk igjen etter fiskerikommisjonen), tredjelandsandelen 13,455 % (regnet ut fra § 2 for 2026), bestandsmodellen fra 2028 (seiens gytebestand mangler), flåtemodellen i åpen gruppe (trekkes nå per år, halvparten av årene stopper mellom tidlig april og midten av mai; 2025 er ikke sjekket), fordelingen av de 1 622 hjemlene på lengdene, min lesning av J-244-2025 (ingen avkorting under 11 m), NPC-eierens andel på 50 % i kvotesamarbeid, og at strukturgevinst etter «modell X» ikke går tilbake.
- **Priser:** minsteprisene for de andre artene følger rundskriv 13/2026 og gjelder til 13.12.2026; ny liste må hentes da. Kvitlange under 0,7 kg har fri pris i rundskrivet, spillet bruker 4,30 kr/kg rund. Fryst fisk betales etter minsteprisen (lik fersk) og tas imot på alle mottak (D3; i virkeligheten fryselager og auksjon).
- **Redskap:** kongekrabbe (fangst per teine, hvor lenge krabben lever om bord, teineprisene, prisen under 0,8 kg, månedsprisene mellom de kjente, linjene for kvoteområdet), hvilke havner som har egnebu og hva egning koster (`egnPort`, «not checked»), sonarens pris (150 000 kr). Kvotetillegg for landegnet line er ikke bekreftet og ikke bygget inn.
- **Arbeid og fisk:** sløying 300 kg og ising 800 kg per person og time (`DECK`, skaleres nå med innsats og ferdighet), ublødd fisk holder dobbelt så dårlig (spillets regel, D3).
- **Kart og havner:** dybden ved en kaifront er fra 50 m-rutenettet og grov, ukjent dybde regnes som 3 m (`QUAY_DEPTH_UNKNOWN`); kystkantene som regnes som kai, er funnet med en regel, så en steinfylling som ikke er kartlagt som molo, kan bli kai; dønningen (`swellFactor`, eksponeringen på 500 m) ser ikke moloene; NPC-flåten følger kaiplassene, ikke Fiskeridirektoratets register.
- **Havet og været:** skumtoppene er støyflekker på kammene (dekningen følger Monahan og O'Muircheartaigh), Kelvin-mønsteret har én retning for skråbølgene, vinden har ingen le bak fjellene, og grunnretningen (225° pluss støy) er ikke sjekket mot seklima.met.no.
- **Havner for havbåtene:** `quayFit` sjekker kailengde og dybde for NPC-båtene og spillerens liggeplasser (4.16c), men mottakene, butikkene og verftene i `PORTS` har ingen slik sjekk. Det trengs når havsteget kommer.

## 10.4 Valg (står med vilje)

- **Turen går videre når du sover:** med mannskap om bord tar styrmannen eller den mest sjøvante roret. Det følger regelen om én felles klokke.
- **Kranen er ikke med i kamerahindringene** (`camSolid`/`camFree` i `view3d.js`; kaier, bruer, fyr, siloer, bygninger og båtene i nærheten er med). Søyla er rundt 1 m tykk og står 2 m fra landingsplassen, så som hindring ville den dratt følgekameraet helt inn hver gang den kom mellom båten og kameraet under levering. Bommen svinger (vurdert 24.10.2026).
- **Tempo 1:6** (`GAME_RATE`): farten ser høy ut i 3D, men de korte bølgene følger båten med 5/6 av farten, så vannet passerer skroget i ekte fart (Jonas 19.10.2026).
- **Lån:** et nytt lån legges til restgjelda og betales over nye 10 eller 15 år (120 måneder ved båtkjøp, 180 ved strukturkjøp og kjøp med hjemmel). Lånet innfris ved salg og innbytte.
- **Båtmodellene viser bare utsiden** (Jonas 06.10.2026): ingen innredning, og fra rattet på Malo ses konsollen og en enkel stol.
- **Fingrene på flytebryggene er ikke i bruk:** båtene ligger langs bryggene, slik havnas egne båter gjør (4.16c).
- **Riggen:** trekking sjekker ikke riggen, men utsetting gjør det, og omrigging er sperret så lenge redskap står i sjøen. Blandet redskap kan bare komme fra lagringer fra før 07.10.2026, og det er ufarlig.

## 10.5 Må måles eller ses i spillet

- **Bildetakten på nettbrettet** etter endringene i havskyggeren og med bygg i tette byer. Telemetrien `tm_perf` (`10f-cloud.js`) sender bildetakten, men ikke posisjonen, så tette byer kan ikke skilles ut i dashbordet.
- **NPC-modellenes byggetid med CPU-struping:** tallet 5–11 ms er fra før Blender-modellene og må måles på nytt.
- **Båtmodellene:** formen under vannlinja er anslått på Malo og havsjarken, havsjarkens ballastkjøl er en egen kropp, og stytteseglet står alltid, også i havn. Om Maloens tynne rekkverk og vaiere (7–24 mm) flimrer, må ses i spillet.
- **Lagringen:** spillet lagrer hvert 5. sekund, når siden lukkes og når fanen skjules. At Chrome skriver localStorage til disk litt etter, er nettleserens oppførsel; det er ikke målt på nettbrettet.
- **Oppdragsfristene etter alternativ A** (26.10.2026): hvor lang tid spillerne bruker på bestillingene mot fristen, og om flere går ut på tid eller blir ferdige (`tur_done`/`tur_fail` i admin), før marginen 1,5 og taket på en spilluke justeres.

## 10.6 Tester som feiler (regresjonen 24.10.2026, gjennomgått i E4 26.10.2026)

E4 (`docs/utviklingsplan.md`) tok de røde testene én om gangen 26.10.2026, i to økter. Åtte av ni er grønne (se «Strøket 26.10.2026»). Det som står igjen:

- **charttest, tegnetiden (SOLO):** fjorden stående tegnes på 3,0 s med CPU strupet 4x (liggende 1,6 s, grensen fra 02.10 er 2,5 s; beste av to målinger). Profilen: alt er rasterflisene (`chartFlush` → `chartTile` → `chartRaster`, per-piksel B-spline over dybden; stående er 915 × 1162 piksler), vektorene (kyst, gradnett, navn) tar 15 ms. En ytelsesoppgave, ikke en testretting: enten en raskere `chartRaster` (flisene i en worker, eller grovere dybde der linjene ikke synes) eller en måling på nettbrettet før grensen flyttes. Sjekken står som den er.
- **routetest K9 Bodø–Reine krever hele kysten i bygget:** med bare kjernen (200 m-celler) skjærer `leiaRoute` to hjørner av land med rundt 100 m (ved Bodø 67,2873° N 14,3641° Ø og ved 67,4385° N 14,0021° Ø); med hele kysten (100 m-celler, `release.py` + `game.py`, slik appen bygges) er den grønn. Regresjonen må kjøres med hele kysten (`testing.md`). Planleggerens landsjekk på 200 m-celler er fortsatt svak, men ingen spiller får kjernebygget.
- **Svak sjekk:** `heattest.console3d` lagrer `SK.cvP`, som ikke males på GLB-skiffen, og sjekker bare `G3.isActive()`.
- **Svake bilder:** `anchor3d_lying.png` og `anchor3d_up.png` viser skrogsiden av kyst15 (kameraet står ved siden, `c.yaw = 3.9`), ikke baugen med ankeret og kjettingen. Sjekkene leser `G3._debug.anc3`, så testen er grønn uansett; bildene bør flyttes til baugen om Jonas vil se ankeret.
- **Ytelse sett i testene (ikke rettet):** med SwiftShader står hovedtråden stille i opptil et minutt nå og da (ingen bilder, ingen `evaluate`); spillklokka tar igjen tiden (`tick` spiller 4–5 minutter på ett tikk), mens 3D-ting som trekkes per bilde (ankerkjettingen `ANC3.Lg`) henger etter. Testene tåler det nå; om det også skjer på nettbrettet, er det en lagg Jonas vil merke.
- Ikke kjørt i siste regresjon (tidsgrensen): heattest, sea3d, teleport3d, lighttest, kinotest, haultest, potshot, aurorashot, penshot, deckshot, workshot, brotest og tut. De dekker ingen filer som ble endret i D2 og D3.

## 10.7 Små ryddejobber

- `S.owned` skrives fortsatt (`03-simulation.js`, `05-phone.js`, `05-vessels.js`), men leses bare av en lagringsmigrering i `11-boot.js`.
- Ikonet `sjomann` i `05-phone.js` brukes ikke (Sjømann-appen ble fjernet 09.10.2026).
- Startbåten er `trebat`. `buildSkiff` bygges fortsatt og er grunnlaget for kitet til håndbåtene (`handKit`), så den kan ikke bare fjernes. På skiffen står sløyebordet og blødekaret (75 % størrelse) tett ved setet, og konsollskjermene er ikke levende (Jonas).

## Strøket 26.10.2026 (oppdragsfristene, alternativ A)

- **Oppdragsfristene** (tilbakemeldingene #92 og #93, 23.10.2026): bestillingene får fisketida for kiloene i fristen i tillegg til 2,5 × seilingstida + 30 spilltimer (`turFishH`/`turBestH` i `09g-turer.js`: det raskeste redskapet spilleren eier, etter modellens vanlige fangst, × 1,5, høyst en spilluke). Ikke mindre fisk, belønningen uendret. Prøvd ved Finnsnes, Bergen, Bodø og Hammerfest. Tallene står i `docs/systemer/oppdrag-og-kystposten.md` (4.26, Fristen). Commit «Trip missions: an order's deadline includes the hours its kilos take» (26.10.2026).

## Strøket 26.10.2026 (E4, de røde testene)

- **routetest, Autonav Bodø–Reine** (andre økt): grønn med hele kysten i bygget (43 OK); i kjernebygget var det planleggeren på 200 m-celler (10.6). Ingen kodeendring.
- **charttest, Lyngen og navnene i regionen** (andre økt): Lyngen-punktet lå på kystlinjens egen strek, som pikselrutenettet stående traff; nå måles inne i Lyngsalpene. «Senja» forsvant fordi den 18 km lange etiketten «Kaldfarnes fiskebruk» sto først og boksene berørte hverandre akkurat på grensen; rang 0 «vises alltid» (`kartplotter.md`), så **spillet er rettet:** rang 0 plasseres før havneetikettene i `renderStatic`, og en havneetikett som ville dekke et slikt navn, droppes på det nivået. Fjordnavnene (rang 1) sjekkes slik pakkene plasserer dem uten havn i veien (Malangen møter Botnhamn og Vangshamn liggende, etter regelen). Tegnetiden måles som beste av to. fad44f5. Tegnetiden stående står igjen (10.6).

- **worktest og crewwalk** (ustabile): frø for `Math.random` inne i hver `evaluate`-blokk (mønsteret fra `caretest.py`), og mannskapet i crewwalk uten trekk: en sjøsyk mann (`sjosyk`) står over rekka i sjø over 1,2 m også under fart (`13-work.js idleWeights`, med vilje), og testen antok at alle går inn. c1f6427, 3bbbb7d.
- **anchor3d** (tidsfølsom): ventet et fast antall runder; nå venter den på tilstanden (rode ute, anker oppe og stuet) med frister fra kjernens egne tider (`ANCH.pay`, `anchorUpIn()`, `simRate()`) og romslig margin for stoppene i SwiftShader. Skriver spor ved feil. 00d858f.
- **geartest** (stasjonene ved haling, #75): testen ventet regelen fra 20.10; spillet følger 23.10 («fisken som kommer over ripa, bløgges» først, `folk-om-bord.md`). Garn med tre om bord: bløgging, haling, haling; line med to: bløgging, haling. 77d79cb.
- **routetest** (22 m fra siste veipunkt): testen satte `SIMREADY = false`, som også stanser manøvreringsmodellen (`dynCan`), og leste avstanden to spillminutter etter stoppet, da båten hadde drevet av punktet (`lieDrift`, Fysikk 2). Nå holdes spillets løkke med `TAB.held`, `dynTick` går per bilde, og avstanden leses idet ruta slutter: 0,3–0,4 m, 7° sving, 18 m drift etterpå. 999eb8b. (Bodø–Reine står igjen, 10.6.)
- **camtest** (Gisundbrua 0 av 24): båten driver med vinden rundt 24 m per spillminutt mens den ligger stille (`lieDrift`), og klokka tar igjen flere minutter om gangen i SwiftShader, så den var 100 m unna brua før sveipet. Testen holder løkka (`TAB.held`) under sveipet. 2 av 24 nå. 716a07e.
- **maptest** (62,6 mot 69,7 kg): to nye spill har hver sin `S.qseed` (`newState` uten felles klokke), og gytebestanden per år for torsk, hyse og sei (`stockF`, `ssbAt` i `03d-quota.js`) er nøklet på den. Pakkeholdingen var uskyldig: klokka sto, hvert minutt etterpå var likt. Testen låser `S.qseed`. 7287963.
- **bunkertest** (mottakene i nærheten): hvert kystmottak har havneenheten med landings- og bunkersplass siden 05.10.2026 (`havner-og-mottak.md`), så stasjonen står ved bunkersplassen; testen ventet «ved kaia». 7abb8f6.

## Strøket 24.10.2026 (løst eller foreldet)

Rettet 24.10.2026 etter gjennomgangen: Senja-flåtens skrog på land ved kaia (`hullDry` i `npcBerths`, Finnsnes hadde to), like havnenavn (`havnLocal` deler ut navnene blant havnene innen 6 km, også reservenavnene etter stedet), starthavna som sluttpunkt (`portByLabel`, og en havn nærmere enn et veipunkt tar trykket i `routeGrab`), driftsplanen uten adgang til torskefisket (varsel med råd om kveiteutstyr i `driftCheck`), utstyret ved båtbytte (merknad i tilbudet og linje i loggen, `swapLeaves`), klærne og kulden (`coldPen` regner med dem om bord), NPC-båtene på strandskråningen i 3D (`npcPits`, 4.16c), NPC-båtenes vei fra kaiplassen til havnemunningen (`coastWay` i `05-vessels.js`: rett der streken er fri for brygger, flytebrygger, merker og land, ellers rett ut fra kaia 25 eller 60 m først, ellers gjennom vannrutene i 25 m-masken (`coastCells`) og rettet ut der bitene er frie, og bare en vei som er fri hele veien; i Tromsø, Bergen, Bodø og Båtsfjord gikk de blokkerte strekene fra 16 til 3, lengste omvei 2,75 ganger den rette), kameraet inn i andre båter (`camFree` sjekker båtene som tegnes nær, `npcNow`, som bokser langs kursen), fartsglideren som fanget sveip (Chromium flytter glideren til fingeren allerede ved berøringen og sender `pointercancel` når sveipet blir rulling; da får glideren verdien tilbake, `rangeTouch` i `08-actions.js`, `slidertest.py`; `pressHold` slippes nå også ved `pointercancel`, så panelet ikke står stille etter en rulling).

Kino-visningen (d0fdfc2) og ristingen i bro-visningen (dc1a5a6, 5.40) fra 04.10; hviletiden i hele timer (regelen fjernet 11.10); kveithaill (fjernet 04.10); fraværsfangsten før dybdedataene (5448b5a, 02.10); bare skiffen med konsoll i 3D (varmen og ekkoloddet vises i det lille kartet for alle båter); sonarens monteringstid (alle verftsjobber tar `YARD_H`); sekkeis på driftsplanen (isen fylles på mottaket); drivstoff i Finnsnes (diesel ved butikk og verft, `docs/handelssteder.md`); § 32 og grunnlinja (håndheves fra R2, 04.10, `03e-rules.js`); minsteprisene etter 21.09 (rundskriv 13/2026, kontrollert); G (136 549 kr fra 1. mai 2026); sertifikatene i Sjømann (fjernet 09.10); heattest-målingen (besto 21.10 med 1,0 s); tester som sovner; dobbel kyst i kartplotteren (4.19); artifacten uten vec (artifacten oppdateres ikke lenger, appen har alltid vec; testbygget `dist/` har ikke vec, bare `npctest`, `havntest` og `vectest` bygger `dist-vec/`).
