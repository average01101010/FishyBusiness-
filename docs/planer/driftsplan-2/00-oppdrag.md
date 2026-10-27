# Driftsplan 2: oppdraget (Jonas 26.10.2026)

Dette er oppdragsbeskrivelsen for en fullstendig redesign av driftsplan-systemet. Den leses av økta som skal gjøre revisjonen og designet, og av hver økt som bygger en del etterpå. Den er skrevet av hovedøkta 26.10.2026 ut fra Jonas' bestilling, dokumentene og koden, og sier *hva* som skal oppnås og *hvordan arbeidet skal gå*, ikke *hvordan løsningen skal se ut*. Løsningen er den nye øktas jobb, med nye øyne.

## 1. Bestillingen

Jonas 26.10.2026, ordrett:

> Jeg skal kjøre en fullstendig redesign av "Driftsplan"-systemet i spillet i en ny økt slik at modellen kan se på den med nye øyne, fordi den har aldri vært bra nok eller fungert slik den burde så langt. Den må være nøye i arbeidet slik at alle funksjoner fungerer som de skal og teste at det faktisk fungerer som tiltenkt.
>
> Tanken er som følger: Man skal kunne legge opp en arbeidsdag så realistisk som mulig for hvordan en fiskebåt gjør det i praksis. Båten skal altså på automatikk kunne gå ut til en eller flere valgte plasser, fiske med valgt utstyr som båten er rigget for, levere fisken til nærmeste eller valgt fiskemottak. Man skal kunne sette et tidspunkt for når på døgnet båten skal gå ut og sette grenseverdier for vær som eventuelt stopper driftsplanen slik at båten går ut i dårlige forhold.
>
> Det burde komme opp et vindu med kartplotteren der man velger hvor man ønsker å sette ut valgt utstyr og eventuelt hvordan man ønsker å fordele fiskeredskapet som garn og liner oppdelt i flere lenker på flere steder. Man skal også kunne velge hvor man eventuelt vil bruke juksa når andre fiskeredskaper er satt ut for å utnytte døgnet til å fiske så mye som mulig. Man må også velge hvor lenge fiskeredskap som garn, liner, teiner skal stå i sjøen etter at de er satt ut.
>
> Hvordan en plan legges opp må også ta høyde for energien til mannskap og bruker. Det skal ikke være mulig å fiske om man er tom for energi, da må båten eventuelt drive døgndrift med minimum 4 mannskap ombord fordelt på 2 skift.
>
> Driftsplanen kan også gjerne ha litt statistikk om fangst, inntekt, arter og slikt nederst som oppdateres daglig etter leveringer på fiskemottak.
>
> Driftsplanen må også fungere for brukere som har flere fartøy slik at de kan drifte flere båter samtidig når de har startet rederi.
>
> Det er veldig viktig at dette fungerer sømløst og etter intensjonen da det er en essensiell del av gameplayet videre i spillet.

Som krav, slik de skal prøves til slutt:

| Krav | Innhold |
|---|---|
| R1 | En arbeidsdag legges opp slik en fiskebåt gjør det: ut til én eller flere valgte plasser, fiske med det redskapet båten er rigget for, levere, hjem. |
| R2 | Avgangstidspunkt på døgnet velges av spilleren. |
| R3 | Grenser for vær (vind og sjø) som stopper planen, så båten ikke går ut i dårlige forhold, og som tar båten i le hvis været kommer underveis. |
| R4 | Plassene velges i et vindu med kartplotteren: hvor redskapet settes, og hvordan garn og line fordeles i flere lenker på flere plasser. |
| R5 | Juksplasser som brukes mens annet redskap står i sjøen, så døgnet utnyttes. |
| R6 | Ståtid per redskap (garn, line, teiner) velges av spilleren. |
| R7 | Levering til nærmeste mottak eller et valgt mottak. |
| R8 | Energien til mannskap og spiller styrer: ingen fisker tom for energi. Døgndrift krever minst fire i mannskapet fordelt på to skift. |
| R9 | Statistikk nederst (fangst, inntekt, arter, turer) som oppdateres etter hver levering. |
| R10 | Flere fartøy driftes samtidig, hver med sin plan, når spilleren har rederi. |
| R0 | Alt dette virker sømløst og etter intensjonen, også når spillet er lukket (den felles klokka), og uten å ødelegge det som alt virker. |

Spillernes egne ord om dagens plan (tilbakemeldingene, anonymt): #57 (09.10.2026) ville ha flere jukseplasser i rekkefølge, og visste ikke om mannskapet la seg eller gikk ut igjen etter første levering, og mente de skulle vente ved mottaket om det var stengt. #95 (24.10.2026): «Velg i kartet» lagde en rute i stedet for å velge plassen, «dette må løses på en bedre og mer intuitiv måte som er enklere å forstå». Begge er rettet i det små, men de sier noe om hvor skoen trykker: det er uklart hva planen kommer til å gjøre, og plassvalget i kartet er tungvint.

## 2. Det som finnes i dag

Les `docs/systemer/driftsplan.md` (5.7) først. Kort:

- **Kjernen:** `src/js/core/06d-drift.js` (557 linjer): `S.ops` v3 per båt (`VKEYS` i `03-simulation.js`), `driftNew`, `driftCheck`, `driftMake` (leiene mellom hjem, mottak og plassene, async), `drTrip` (turen lages når båten er ledig), `opsStep`/`driftDecide` (hvert spillminutt fra `vesselStep` i `05-vessels.js`), `drStop`/`drWait`, `driftRoles`/`driftWatch` (vakter 2+2), `opsReport` (dagstallene). Konstantene `DRP` (dag høyst 14 t, slitne ved 72, uthvilt ved 25, høyst 8 felt og 6 juksplasser, flerdøgnsturer 2–7 døgn, anker fra 24 m) og `DRW` (vær: safe 10 m/s og 1,5 m, normal 13 og 2,5, tough 16 og 3,5, aldri over det båten tåler).
- **Siden:** `src/js/ui/05c-drift.js` (265 linjer), `DRIFTUI`: radene Hjem, Fiske, Plasser, Levering, Vær, Rytme, Mannskap; «Neste tur»-tidslinja; de siste sju døgnene som søyler; plassvalg i kartplotteren via `DRIFTCTX` og «Bruk plassen» (`03-map.js` `addWaypoint`, `07-guide.js` `panelRoute`); kopiering til en annen båt. Rederi-skjermen (`src/js/ui/phone/11-rederi.js`) viser «Nå» per båt. Mannskap-menyen (`ui/05b-work.js`, `13-work.js`: `setSkipper`, `setMate`).
- **Det planen lener seg på, og som skal brukes videre, ikke lages på nytt:** Autonav og leiene (`leiaRoute`, `docs/systemer/autonav.md`), redskapssyklusen (`gearCycle`, `cycleSpec` i `10-gear.js`, `docs/systemer/redskap.md`), regelmotoren (`ruBlockMsg`, kvoter, fjordlinjer, åpen gruppe krever eier om bord for torsk, hyse og sei; `docs/systemer/kvoter-og-regler.md`), været og varselet (`windAt`, `driftWxAhead`, `anchorForecast`, `shelterReturn`; `docs/systemer/vaer-og-hav.md`), mannskapet, trøttheten og energien (`04-crew.js`, `14-crewlife.js`, `15-energy.js`: `ENERGY = {sea:100 % på 24 t, quay:100 % på 8 t, warn:25, dim:15, sleep:480 min, wake:60}`; `docs/systemer/folk-om-bord.md`), ferskheten og lasterommene (D3, `keepF`, `holdFreezes`; `docs/systemer/priser-og-salg.md` og `redskap.md`), liggeplassene i havnene (`07e-havn.js`, 4.16c i `npc-trafikk.md`), ankringen (`06e-anchor.js`), push for stopp (`10g-push.js`), og «Mens du var borte» og `catchUp` (`ui/08-actions.js`; `docs/systemer/skyen-og-felles-verden.md` 4.20 og 4.24: fravær spilles minutt for minutt opp til `CATCHUP_CAP`, mer enn to uker hoppes over).
- **Tester i dag** (`COVER` i `tests/run.py`): `drifttest.py` (motoren: juksedag med levering, hjemtur og hvile, line på samme tur, garn over et døgn, skipper og styrmann, én-manns båt, overtakelse, stengt felt, torskekvote, 2+2, flerdøgnstur, gamle planer), `driftuitest.py` (siden), `tutdrift.py`, `opsowntest.py` (eierskap og kvote med og uten deg), `fleet2test.py` (to båter på plan samtidig), `fleet3test.py` (varsel om stopp), `anchortest.py`, `geartest.py`, `skiptest.py`.
- **Jonas' tidligere svar (23.10.2026)** som dagens plan bygger på, og som gjelder til han sier noe annet: skipper og styrmann må være utnevnt og om bord når han ikke er med (svar 3); planen går alle dager (6a); felt med antall og ståtid (8); været aldri over det båten tåler (9a); én-manns båt går bare med ham om bord (13a); én redskapstype om gangen pluss juksa (14a); anker fra 24 m (C); ingen forventet fangst vises, bare spillerens egne tall (09.10 og 23.10). **Ett av dem er nå overstyrt av bestillingen:** «levering alltid på nærmeste mottak» (4b) blir «nærmeste eller valgt» (R7). Der bestillingen og et gammelt svar strider, gjelder bestillingen; der designet vil endre et gammelt svar av andre grunner, stilles det som et valg til Jonas.
- **Historikken:** planen er laget på nytt to ganger (09.10 «fem spørsmål», 23.10 D1–D6). Begge gangene ble den forenklet. Jonas sier nå at den aldri har vært bra nok. Revisjonen skal finne ut *hvorfor*, før designet begynner: er det modellen (hva en plan er), motoren (hva den gjør minutt for minutt), eller siden (hva spilleren forstår og får til)?

## 3. Det som ikke kan rokkes

- **Én felles klokke (MMO).** Planen går når spillet er lukket. Det som skjer, spilles mot den felles klokka når spillet åpnes (`catchUp`). Designet må være deterministisk og billig å spille av: sju døgns fravær skal spilles av på få sekunder på et nettbrett, og gi det samme som om spillet hadde stått åpent. Mål det.
- **Nasjonalt.** Alt virker langs hele kysten, med pakkene (`dist-vec`) der det trengs. Stikkprøver sør, midt og nord (`/stikkprove`).
- **Reglene og handelsstedene** fra `CLAUDE.md`: regelmotoren bestemmer hvor og hva som kan fiskes; levering, is og agn bare på mottak; kjøp følger `buyGate`; ingen ekte firmanavn.
- **Lagringene til spillerne.** Det finnes spillere med flere hundre spilldager og planer i gang (`S.ops` v3, og eldre). Ingen mister redskap i sjøen, mannskap, fangst eller penger. En plan som ikke kan føres over, slås av med en tydelig melding på plansiden og i Rederi, ikke stille.
- **Det som alt virker** (Jonas 24.10.2026: «Vi må bare passe på at vi ikke ødelegger noe vi allerede har laget som fungerer bra»): Autonav, redskapssyklusen, regelmotoren, ferskheten, liggeplassene, ankringen, mannskapet. Planen bruker dem; den bygger dem ikke om.
- **Grafikken og UI-et:** berøring på nettbrett og telefon, stående og liggende, skjermbilder av alt nytt i 800×1280 og 1280×800 (og 384×853 for telefonen, fordi spillerne som meldte #57 og #95, spilte på telefon).
- **Patchnotes** uten design, psykologi eller penger. Ingen forventet fangst i planen.

## 4. Slik skal arbeidet gå

Arbeidet går i økter etter `docs/utviklingsplan.md`: én økt per fase eller del, `/lever` og `/okt-slutt` til slutt i hver, alt skrevet ned i `docs/planer/driftsplan-2/` og `docs/systemer/driftsplan.md` samme dag. Hver økt leser `CLAUDE.md`, `docs/INDEKS.md`, `docs/BACKLOG.md` og denne fila, så dokumentene for det delen gjelder.

**Fase 0: Revisjonen (ingen kode).** Spill dagens plan i testmiljøet, ikke bare les koden: en sjark med line og juksa i tre spilldøgn fra Finnsnes, en båt med garn i to døgn, en større båt med fire i mannskapet i døgndrift, og to båter på plan samtidig; med spillet «lukket» (`catchUp`) i ett av døgnene. Skriv `01-revisjon.md`: for hvert krav R0–R10, hva som virker, hva som ikke virker og hvorfor (modellen, motoren eller siden), med det du målte. Ta med det spillerne sa (#57, #95) og det `docs/BACKLOG.md` har om planen. Ingen forslag til løsning her, bare funn. Jonas leser den.

**Fase 1: Designet (ingen kode).** `02-design.md`, med `/planlegg` som ramme:
- Hva en plan *er* (modellen): dagen, plassene, redskapet fordelt i lenker, juksplassene, ståtidene, avgangen, værgrensene, leveringen, rytmen, mannskapet. Hva som lagres, hvordan v3 og eldre føres over.
- Hva planen *gjør* (motoren): dagen som en plan av hendelser med tidspunkter, ikke bare «hva nå» hvert minutt; hva som skjer når noe går annerledes (været, trøtthet, full last, stengt felt, kvote, du tar over), og hvordan det spilles av når spillet har vært lukket.
- Hva spilleren *ser og gjør* (siden og kartvinduet, R4): hvordan plassene og lenkene velges i kartplotteren, hvordan planen viser hva den kommer til å gjøre («i morgen går båten kl. 05, setter … , jukser ved …, trekker …, leverer på …»), hvordan stopp og venting vises, og statistikken (R9). Skisser som tekst eller enkel ASCII er nok; skjermbildene kommer i byggingen.
- Energien og skiftene (R8) som regler med tall, og hvor tallene kommer fra.
- Flere fartøy (R10): det som er likt og det som er ulikt når spilleren er om bord på én av dem.
- **Valgene til Jonas** som A/B/C med én anbefaling hver, ikke flere enn han trenger å ta. Minst disse må stilles: om planen skal være én fast dag som gjentas eller en uke med ulike dager; hva som skjer med redskap i sjøen når planen settes på pause; om spilleren skal kunne velge mottak per plan eller per dag; hvor kartvinduet skal åpnes fra; hva som skjer med gamle planer; og om det gamle svaret 14a (én redskapstype om gangen) skal stå når lenkene kan fordeles på flere plasser.
- **Testplanen:** scenariene i kapittel 5 som akseptansekriterier, hver med hva som måles og hva som skal stå i loggen, og hvilke som dekkes av én felles ny test (`driftsplan2test.py` eller flere, i `LITE`), hvilke som trenger 3D, og hva Jonas skal prøve selv på nettbrettet.
- **Delene** (fase 2 og utover), hver så stor at den passer én økt, i avhengighetsrekkefølge, med scenariene hver del skal gjøre grønne, og med det som blir stående rødt underveis (en halvbygd plan skal ikke rulles ut til spillerne: delene bygges bak en bryter eller på en måte som lar dagens plan gå til den nye er hel; designet sier hvordan).

Legg designet fram i chatten i kortform og vent på klarsignal. Ingen spillkode før Jonas har svart.

**Fase 2 og utover: Byggingen,** én del per økt, med denne fila og `02-design.md` som grunnlag. Hver økt: les designet og statusen nederst i det, bygg delen, gjør scenariene grønne, skjermbilder i begge formater av alt nytt, `docs/systemer/driftsplan.md` oppdatert for delen (det gamle 5.7 skrives om etter hvert, ikke slettes før den nye planen er hel), status nederst i `02-design.md`, `/lever`, `/okt-slutt`. Én commit per del.

**Til slutt:** hele scenariolista grønn, `/regresjon` (med hele kysten i bygget), patchnotes (én oppføring som sier hva spilleren kan nå, ikke hvorfor), `docs/systemer/driftsplan.md` skrevet om til den nye planen, og en liste til Jonas over det han skal prøve selv på nettbrettet, med forventet utfall for hvert punkt.

## 5. Scenariene som skal være grønne til slutt

Hvert scenario kjøres i testmiljøet med spillklokka framskyndet (`S.t`, `vesselStep`, `catchUp`), skriver en logg med tidspunkter («05:00 kastet loss», «06:10 satte 2 stamper ved F1», …) og sjekker tall. Designet kan dele dem opp eller legge til, men ikke ta bort.

| Nr | Scenario | Dette skal stemme |
|---|---|---|
| S1 | **Dagsdrift med line og juksa.** Sjark, avgang 05:00, to linefelt med 2 stamper hver, ståtid 6 t, én juksplass, levering nærmeste mottak, hjem på naustet. Tre døgn. | Hver dag: ut ved avgangstida (eller senere av en grunn som står i loggen), line satt på begge felt, juksa i ståtida, line trukket, levert, hjem, hvilt. Fangst og penger i statistikken. Dag 2 og 3 lik dag 1 der forholdene er like. |
| S2 | **Garn i lenker på flere plasser.** Garnbåt, 18 garn fordelt 6+6+6 på tre plasser, ståtid 24 t. Tre døgn. | Dag 1 settes alle tre lenkene. Dag 2 trekkes og settes de på nytt i rekkefølge, fangsten leveres. Ingen lenke står lenger enn ståtida pluss den slakken designet oppgir. |
| S3 | **Teiner med lang ståtid.** 40 teiner på to plasser, ståtid 48 t, juksa imellom. Fire døgn. | Teinene står 48 t, trekkes og settes igjen; dagene imellom brukes til juksa og levering. Agn kjøpes på mottaket når det trengs (`buyGate`). |
| S4 | **Været.** Grense 10 m/s og 1,5 m. Dag 1: varselet over grensa ved avgang. Dag 2: fint ved avgang, kuling fra kl. 11. | Dag 1 venter båten og går når det roer seg, eller hopper over dagen med en melding som sier hvorfor. Dag 2 går båten i le eller hjem når grensa brytes, redskapet i sjøen tas når været tillater det, planen fortsetter selv. |
| S5 | **Energi og hvile.** Spilleren om bord med energi 0 ved avgang. Så mannskapet slitne midt på dagen. | Ingen går ut eller fisker tom for energi: planen venter til det er hvilt, og sier det. Slitent mannskap avslutter dagen, redskap som skal trekkes, trekkes likevel. |
| S6 | **Døgndrift og skift.** Båt med styrhus og køyer. Tre i mannskapet: døgndrift skal avvises med grunn. Fire: døgndrift går. 48 t. | Med fire går to skift (6 t om gangen eller det designet velger), båten leverer når lasten er full og går ut igjen, ingen i mannskapet går under grensa for utmattelse, og loggen viser hvem som er på vakt når. |
| S7 | **Levering: nærmeste eller valgt.** Samme plan to ganger: nærmeste mottak, og et valgt mottak lenger unna. | Båten leverer der planen sier. Ferskheten (D3) og lastens størrelse styrer når den leverer underveis. Statistikken skiller mottakene. |
| S8 | **Reglene.** Et felt inne i et stengt område; torskekvoten oppbrukt; åpen gruppe uten eieren om bord. | Planen stopper med riktig grunn og hva som løser det, og går videre av seg selv når det er løst. Ingen ulovlig fangst. |
| S9 | **Lukket spill (catch-up).** S1 der spillet er «lukket» i 30 t midt i, og én gang i 9 døgn. | Etter åpning har planen gjort det samme som om spillet sto åpent (fangst, penger, redskap i sjøen, hvile), innenfor den toleransen designet oppgir, og avspillingen av 9 døgn tar under 10 s i testmiljøet. «Mens du var borte» viser turene. |
| S10 | **To båter.** Rederi med to båter på hver sin plan (S1 og S2), spilleren om bord på den ene. | Begge går sin plan samtidig, med hvert sitt mannskap, leverer og hviler uavhengig. Rederi viser riktig «Nå» for begge. Den spilleren er om bord på, følger reglene for eier om bord. |
| S11 | **Du tar over.** Midt i S1 tar spilleren roret, seiler et stykke, og gir båten tilbake. | Planen venter mens du styrer, redskapet i sjøen står, og planen fortsetter fra der båten er, med riktig neste steg. |
| S12 | **Gamle lagringer.** En lagring med `S.ops` v3 i gang, og én fra før v3. | Begge åpner uten feil. Redskap i sjøen, mannskap, fangst og penger er som før. Planen er ført over, eller slått av med en melding som sier hva spilleren må gjøre. |
| S13 | **Siden og kartvinduet, med berøring.** Lag en hel plan fra null med ekte trykk (CDP) i 384×853, 800×1280 og 1280×800: plasser, lenker, ståtid, juksplasser, avgang, vær, mottak. Start den. | Alt kan gjøres med fingeren uten å lete. Skjermbildene ses på. Planen som startes, er den som ble lagt. |
| S14 | **Statistikken.** Etter S1 og S2. | Fangst, inntekt, arter og turer per døgn og samlet, oppdatert etter hver levering, bevart over dagene og i lagringen. |

Testene for scenariene er de nødvendige testene for dette arbeidet (Jonas 26.10.2026: «Den må være nøye i arbeidet slik at alle funksjoner fungerer som de skal og teste at det faktisk fungerer som tiltenkt»). De skal gå uten 3D (`LITE`) der de kan, og 3D-testene fra tabellen i `docs/systemer/testing.md` kjøres bare når 3D er endret.

## 6. Det Jonas gjør

- Leser revisjonen (fase 0) og svarer på valgene i designet (fase 1) med A/B/C.
- Prøver planen på nettbrettet når delene som gjelder siden er ute, og melder tilbake i korte punkter.
- Trenger ikke lese koden.

## Status

- 26.10.2026: oppdraget skrevet av hovedøkta. Venter på at Jonas starter økta for fase 0 og 1.
- 26.10.2026: fase 0 og 1 gjort i én økt (`01-revisjon.md`, `02-design.md`, loggene og skriptene i `revisjon/`). Venter på Jonas' svar på valgene 1–7 i designet og «kjør på». Ingen spillkode.
- 27.10.2026: Jonas svarte på valgene og sa «kjør på» (svarene står i `02-design.md` kapittel 5). Delene 1–7 bygd og slått på samme dag (commit 7f817c3 på `ccr-b4896e99-t1nayv`): modellen og dagen, motoren, lukket spill, siden, kartvinduet, flåten og bryteren. Stikkprøvene langs kysten mangler (testmiljøet har bare Senja) og står i backloggen; del 8 (rydding) venter til Jonas har prøvd den nye planen.
