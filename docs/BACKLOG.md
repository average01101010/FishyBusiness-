# Backlogg: kjente problemer og åpne spørsmål

> Den ene lista over det som gjenstår. Hver økt oppdaterer den som siste handling (`/okt-slutt`): nytt inn under riktig overskrift, det som er rettet flyttes til «Strøket» nederst med dato og commit. Kapittel 10 i overleveringen flyttet hit ordrett 26.10.2026 (`docs/utviklingsplan.md`, fase A3).

## Spillarbeid som venter (26.10.2026)

- **Sikkerhet SK1–SK6** (oppgave #164): Blender-modeller (vest, drakt, leider, livbøye, PLB), risiko, mann over bord, nødstopp, utstyr og kurs, nestenulykker. Ikke begynt.
- **Oppdragsfristene** (tilbakemeldingene #92 og #93, 23.10.2026): for mye fisk for fristen når line og garn ikke kan stå samtidig. Fristen er 2,5 × reisetida (`09g-turer.js`), uten tid for å fiske kiloene. Forslag: frist etter kilo og fisketid i tillegg til reisetida for oppdrag der spilleren fisker selv. Venter på Jonas' valg.
- **Brygger uten `floating=yes`** står som grå kasser (Kristiansand og Hammerfest har flest). Alternativ b fra #94 (kassene med dekke, pæler og utriggere) er ikke bygd.
- **NPC-båter ved flytebrygger tegnet som linje** ligger rundt 0,9 m fra pontongkanten (kaiplassen regnes mot en brygge på 4,2 m).
- **Utviklingsplanen** (`docs/utviklingsplan.md`): E1 (oppdelingen av `view3d.js` og `05-phone.js`), E4 (de røde testene i 10.6), D4 (rutinen får stikkprøver og skjermbilder) og D5 (ukentlig regresjon).

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

## 10.6 Tester som feiler (regresjonen 24.10.2026)

- **Feiler også før D1 (4601b9b):** maptest (fangsten 62,6 mot 69,7 kg og 1–2 minutter ulik med og uten pakker), camtest (Gisundbrua, 0 av 24), bunkertest (mottakene i nærheten fyller ved kaia), charttest (navn i regionen, sømmer i hele landet, tegnetid 3,1 s i fjorden).
- **Feiler også før D2:** geartest (stasjonene ved garn- og linehaling, #75), routetest (båten i 3D stopper 22 m fra siste veipunkt).
- **Ustabile:** worktest og crewwalk (tilfeldig mannskap fra `genCrew`), anchor3d (tidsfølsom; feiler annenhver gang på D2 og D3, besto 3 av 3 før D1).
- **Svak sjekk:** `heattest.console3d` lagrer `SK.cvP`, som ikke males på GLB-skiffen, og sjekker bare `G3.isActive()`.
- Ikke kjørt i siste regresjon (tidsgrensen): heattest, sea3d, teleport3d, lighttest, kinotest, haultest, potshot, aurorashot, penshot, deckshot, workshot, brotest og tut. De dekker ingen filer som ble endret i D2 og D3.

## 10.7 Små ryddejobber

- `S.owned` skrives fortsatt (`03-simulation.js`, `05-phone.js`, `05-vessels.js`), men leses bare av en lagringsmigrering i `11-boot.js`.
- Ikonet `sjomann` i `05-phone.js` brukes ikke (Sjømann-appen ble fjernet 09.10.2026).
- Startbåten er `trebat`. `buildSkiff` bygges fortsatt og er grunnlaget for kitet til håndbåtene (`handKit`), så den kan ikke bare fjernes. På skiffen står sløyebordet og blødekaret (75 % størrelse) tett ved setet, og konsollskjermene er ikke levende (Jonas).

## Strøket 24.10.2026 (løst eller foreldet)

Rettet 24.10.2026 etter gjennomgangen: Senja-flåtens skrog på land ved kaia (`hullDry` i `npcBerths`, Finnsnes hadde to), like havnenavn (`havnLocal` deler ut navnene blant havnene innen 6 km, også reservenavnene etter stedet), starthavna som sluttpunkt (`portByLabel`, og en havn nærmere enn et veipunkt tar trykket i `routeGrab`), driftsplanen uten adgang til torskefisket (varsel med råd om kveiteutstyr i `driftCheck`), utstyret ved båtbytte (merknad i tilbudet og linje i loggen, `swapLeaves`), klærne og kulden (`coldPen` regner med dem om bord), NPC-båtene på strandskråningen i 3D (`npcPits`, 4.16c), NPC-båtenes vei fra kaiplassen til havnemunningen (`coastWay` i `05-vessels.js`: rett der streken er fri for brygger, flytebrygger, merker og land, ellers rett ut fra kaia 25 eller 60 m først, ellers gjennom vannrutene i 25 m-masken (`coastCells`) og rettet ut der bitene er frie, og bare en vei som er fri hele veien; i Tromsø, Bergen, Bodø og Båtsfjord gikk de blokkerte strekene fra 16 til 3, lengste omvei 2,75 ganger den rette), kameraet inn i andre båter (`camFree` sjekker båtene som tegnes nær, `npcNow`, som bokser langs kursen), fartsglideren som fanget sveip (Chromium flytter glideren til fingeren allerede ved berøringen og sender `pointercancel` når sveipet blir rulling; da får glideren verdien tilbake, `rangeTouch` i `08-actions.js`, `slidertest.py`; `pressHold` slippes nå også ved `pointercancel`, så panelet ikke står stille etter en rulling).

Kino-visningen (d0fdfc2) og ristingen i bro-visningen (dc1a5a6, 5.40) fra 04.10; hviletiden i hele timer (regelen fjernet 11.10); kveithaill (fjernet 04.10); fraværsfangsten før dybdedataene (5448b5a, 02.10); bare skiffen med konsoll i 3D (varmen og ekkoloddet vises i det lille kartet for alle båter); sonarens monteringstid (alle verftsjobber tar `YARD_H`); sekkeis på driftsplanen (isen fylles på mottaket); drivstoff i Finnsnes (diesel ved butikk og verft, `docs/handelssteder.md`); § 32 og grunnlinja (håndheves fra R2, 04.10, `03e-rules.js`); minsteprisene etter 21.09 (rundskriv 13/2026, kontrollert); G (136 549 kr fra 1. mai 2026); sertifikatene i Sjømann (fjernet 09.10); heattest-målingen (besto 21.10 med 1,0 s); tester som sovner; dobbel kyst i kartplotteren (4.19); artifacten uten vec (artifacten oppdateres ikke lenger, appen har alltid vec; testbygget `dist/` har ikke vec, bare `npctest`, `havntest` og `vectest` bygger `dist-vec/`).
