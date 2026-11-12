# Backloggens arkiv: det som er strøket

Flyttet hit fra `docs/BACKLOG.md` 12.11.2026, så backloggen bare har det som er åpent. Nye «Strøket»-avsnitt skrives øverst her (dato, steg, gren, commit). Les med `grep`; fila leses aldri hel.

## Strøket 11.11.2026 (steg 44, Ø5 rest c: M7/M8-resten, gren `ccr-360badbd-1zzqz7`)

- **M7 og M8 står igjen** (02.11.2026): sponsede design i Malerverkstedet, et flagg som vaier (nå en stiv plate), CSV-import av meglerens oppføringer (`tools/broker/import.py`), og at byggene eksporteres med `anchors.sign` (står i skriptene; bpy 4.5.4 finnes ikke for Python 3.13 her). IAB-tersklene er sjekket mot IAB UK og AdExchanger, og utkastet fra juni 2022 ble lest 07.11.2026; målingen og rapporten etter det ble bygd i steg 66 08.11.2026 (over). **Gjort 11.11.2026 i steg 44:** sponsede design i Malerverkstedet (plasseringen `look` på `paint`), flagget som vaier, og byggene eksportert på nytt med `anchors.sign`. CSV-importen er lagt bort til Jonas vil ha meglerbåter igjen (planen 10.6). Det som var antatt, er lukket i økta (`docs/systemer/handel-og-steder.md`, «M7/M8-resten (steg 44)»); Jonas svarte 12.11.2026 på de tre valgene (gratis, merket på skroget, fargene blir).

## Strøket 11.11.2026 (Ø14 F3, feltnavnene i teksten)

- **Pubens rykte og Kystpostens «Tynt fiske» gjelder bare Senja** (funnet 07.11.2026 i Ø14-planen, `docs/planer/fangstfelt.md` 2.2): `rumour` i `ui/09-hand-fishing.js` (linje 13) velger alltid blant Senjas seks felt (`GROUNDS`) med prisen på Husøy, også når båten ligger i Bergen eller Båtsfjord; `newsForDay` i `core/06-services.js` (linje 121) bare blant Senjas fire. Rettes i Ø14 F3 (steg 31c). Sjekk: puben i Bergen nevner et felt nær Bergen. **Rettet 11.11.2026 i Ø14 F3 (steg 31c):** ryktet velger blant fiskeplassene innen 20 km av havna båten ligger i (`rumourAt`), og «Tynt fiske på» blant dem innen 20 km av hjemmehavna.

## Strøket 10.11.2026 (KM3, kvotemarkedet i Kvote-appen, gren `ccr-09c0a3db-nj4fwz`)

- **Kvote-appen sa at båten «hogges»** ved strukturering (`ui/phone/04-kvote.js`): teksten sier nå at båten meldes ut av registeret (kvoteforskriften § 8).
- **`pressPut('kvote', …)` ved strukturering kjørte aldri** (`ui/phone/14-act.js`, kallet sto bak `//` på linja over): det står på egen linje, så Kystposten får saken.
- **Valg 15 (driftskravet):** Jonas 10.11.2026: A, det står av, som i virkeligheten.

## Strøket 10.11.2026 (PR #53, motorrommet fullt igjen, gren `claude/admiring-cray-vqmpdo`, rullet ut i a21990dc)

- **Motorrommet fullt igjen ga ingen redning** (tilbakemelding #117): **rettet og rullet ut 10.11.2026** (flettet i 9f9ee9c5 med Jonas' ja, ute med a21990dc, Hetzner og Pages grønne): `hullMinute` i `core/16c-hull.js` stopper motoren og ringer etter skøyta hver gang motorrommet er fullt under veis, ikke bare når `d.flood` er nytt (5.x i `fysikk-og-styring.md`). `hulltest` 30 OK (sett rød før rettingen i PR-en), towtest, trip2 og docktest OK.

## Strøket 09.11.2026 (Ø8b M5, «Tom for is» én gang og så én gang per døgn, gren `ccr-2fe3f16c-xpzvdg`)

- **«Tom for is. Fangsten ises ikke.» hver andre time** (spilltest 4, 06.11.2026; Jonas valgte M5 A samme dag): **rettet 09.11.2026** (steg 8b Ø8b M5, gren `ccr-2fe3f16c-xpzvdg`): én linje når isen tar slutt, så én per døgn så lenge den er tom (`iceOut` i `core/05-vessels.js`); `mannskapsplay.py utenkokk` gir 3 linjer på tre døgn, mot 12–15. Antatt i byggingen (står i `folk-om-bord.md` 5.19b): tom-perioden er over når dekket har iset det det kan og minst 5 % av isrommet (minst 1 kg) står igjen, så ismaskinens drypp på en havbåt ikke starter den på nytt hvert minutt; med fryserom kommer meldingen aldri (før kunne den komme når fryserne var fulle for minuttet).

## Strøket 08.11.2026 (UI 2, U2-8: nettbrett og PC arver, gren `ccr-510fd7d5-2eum2h`)

- ~~**Skuffen i kartplotteren (2D) i stående ligger litt over stripa** (UI 2, U2-7, 08.11.2026): i 3D-visningen står stripa over arket, men i kartplotteren (`body.vplot`, uten knappelinja) står stripa på 54–114 px og arket fra 12 % (101 px på telefonen), så arket dekker stripas nederste 13 px, slik skjemasidene gjorde før U2-7. Skuffen åpnes sjelden fra plotteren. Rettes i U2-8 med plotterens egne mål.~~ Rettet i U2-8: arket starter under stripa (`--ecH` + 8 + 60 + 6 px), `hudtest` sjekker det på 390×844, 412×915 og 800×1280.

## Strøket 08.11.2026 (UI 2, U2-7: skuffen og sidene, gren `ccr-b4ccfe0e-t6qjnp`)

- ~~**Ansatte-siden (`mannskap`) åpner på 55 % i stående** med 4,6 skjermer innhold på telefonen (UI 2, U2-0, 06.11.2026): den står ikke i `TALL` i `ui/10c-dock.js`. Tas i U2-7 (ett ark for alle sider), eller legges i `TALL` før det. Fra U2-2 nås den også fra kortet Ansatte på fanen Mannskap i Om bord.~~ Gjort 08.11.2026 i U2-7: alle sidene står på samme ark i stående; Ansatte har 3,8 skjermer innhold på telefonen (`docs/systemer/ui-og-telefon.md`, «UI 2, U2-7»).
## Strøket 08.11.2026 (KM2, kvotemarkedet på serveren, gren `claude/km2-kvotemarkedet-migrering-3pat3t`)

- **`sqltest` ventet 34 snøkrabbetillatelser** (funnet 07.11.2026): sjekken venter nå 30, som `20261106120000_snokrabbe_30.sql` setter (338e176). Sett rød før og grønn etter; `sqltest` 146 OK.

## Strøket 08.11.2026 (KM1, kvotemarkedet i kjernen, gren `ccr-5588e999-w5pry1`, rullet ut i bdb092d3)

- **Kvotetaket for strukturkvote var for lavt** (3 og 4 ganger): nå 5 og 6 etter kvoteforskriften § 12 (`STRUCT.cap`), sett rød i `kvotemarked.test.mjs` og `quotatest`.
- **Hver strukturering tok to eiere ut av registeret** (`structIn` kalte `regTake`, og kjøpet i `14-act.js` gjorde det igjen): `structIn` tar ingen nå. Funnet i KM1, sett rød i enhetstesten.

## Strøket 08.11.2026 (Ø12 C, ryddingen av den gamle driftsplanen, gren `ccr-864d9913-u29rne`)

- ~~**Driftsplan 2, del 8 (rydding)**~~ Gjort 08.11.2026 i Ø12 C (3eb0e01, 99ac9d6): (27.10.2026; **Jonas 05.11.2026: «Ja, rydd bort den gamle»**, tas i Ø12 etter H2c, når autolineren er i Driftsplan 2): delene 1–7 er bygd og bryteren på (7f817c3). Del 8 fjerner `core/06d-drift.js` og `ui/05c-drift.js`, bytter `drifttest.py`/`driftuitest.py` ut med `driftsplan2test.py`/`driftsplan2ui.py`/`driftsplan2map.py`, og flytter `tutdrift.py` og `opsowntest.py` over; til da setter de gamle testene `DRIFT2 = false`. `DRIFTCTX` på rutepanelet (`07-guide.js`, `03-map.js`, `08-actions.js`) hører til den gamle siden og går samme vei. Oppdraget, kravene R0–R10 og scenariene står i `docs/planer/driftsplan-2/00-oppdrag.md`, status i `02-design.md`. Går foran sikkerheten SK1–SK6.

## Strøket 08.11.2026 (vrak i lasterommet, PR #50, gren `claude/admiring-cray-klfggd`)

- **Lasterommet viste 0 kr for vrak** (tilbakemelding #118 og trolig #115): `valueEst` (`ui/07-guide.js`) ganget med `GM.V` = 0, mens `sell()`, `landWarn` og mannskapets anslag betaler 1 kr/kg. Rettet 08.11.2026; sjekken (409 kg sei og 38 kg torsk som vrak, summen i `panelHold()`) var rød på commiten før (0 kr) og grønn etter (447 kr). At fangsten råtner mens spillet er lukket, står med vilje (Jonas 08.11.2026, `docs/systemer/priser-og-salg.md`).

## Strøket 08.11.2026 (ut fra kaia med Autonav, gren `ccr-4946b87f-2gakv1`, rullet ut i 98a182bc)

- **Første tur kom ikke fra kaia fordi Autonav ikke fant vei** (Jonas 08.11.2026: «Noen spillere opplever å ikke kunne forlate kaien ved første oppdrag fordi Autonav ikke fungerer», «Dette er svært alvorlig»): alle 162 startsteder prøvd med det spilleren gjør på `route1` og «Kast loss», ved testklokka og verdens klokke og fire tidevannsfaser. Averøy (naustet i en bukt stengt bak en tange) og Sleneset (naustet i en lagune med et utløp på 12 m) ga «Fant ingen trygg rute dit.» ved alle tidevann; Fosnavåg 17.09.2027 ga en første etappe over fyllingen (grå «Kast loss») og en time senere et felt Autonav ikke nådde selv fra mottakskaia. Rettet: naustet plasseres der båten kommer seg ut på vann (`naustWay`, versjon 3; gamle naust uten vei ut flyttes én gang), Autonav går fra naustet via havna når søket ikke finner vei, og feltet på første tur må kunne nås fra havna. Alt i `docs/systemer/autonav.md` 4.12m. Test `utfrakai` (ny, hele kysten, sett rød før).
- **«Kast loss» grå fra mottakskaia i Ålesund, Fosnavåg, Laukvik og Vengsøy** (funnet i samme sveip): de forseglede havnenes vei ut går over egen fylling med vilje (`approachPath` `pt.free`), men rutepanelets landsjekk (`legClear`) kjente ikke til det, så hver Autonav-rute ut hadde første etappe «over land». Rettet med `quayLandLeg` (`core/07-harbours.js`) i `legClearMemo`. Test `utfrakai` del 2 (sett rød før).

## Strøket 07.11.2026 (Ø3a ytelse, det som kan måles her, gren `ccr-7538447c-xt5b4p`)

- **`charttest` tegnetiden i fjordutsnittet** (02.11.2026: 2,7 s mot grensen 2,5 s; SOLO-linja i 10.6: 3,0 s stående): `chartRasterJob` (`ui/03-map.js`) spør kartet én gang per kolonne, rad eller celle (`inFrame`, flisa, `deep` per 25 m-celle, B-splinens radsummer), og `rcell` (`core/01b-mapdata.js`) leser en celle i blokka den har fra før uten divisjonene. charttest med hele kysten, CPU 4×, hele kartet fint: stående fjorden 2 508 → 824 ms, regionen 2 041 → 1 632, havna 1 270 → 906; liggende fjorden 2 136 → 1 033, regionen 2 021 → 1 698, havna 1 935 → 1 088. Pikslene byte for byte like i 48 utsnitt (`docs/systemer/kartplotter.md` 5.44b). «Hele landet»s første bilde liggende (671 ms mot 0,6 s) er fortsatt rødt, men av regellaget (10.6, «charttest, hele landet»).
- **Minikartet bygget hele `coast0` i full oppløsning** når utsnittet var lite og kartpakkene ikke inne («Førstegangsstarten, resten» (b) og (c)): `chartPath0In` (`ui/03a-chart.js`) lager stien av ringene som når inn i en boks rundt utsnittet, med sidene som kan krysse den som de var. 600 × 600 med 4 m per piksel, CPU 4×, kaldt: Bergen 7 343 → 154 ms, Svalbard 4 008 → 123, Bergen flyttet 7 214 → 144. 4 piksler av 360 000 med høyst 2/255 ved Bergen flyttet, ellers byte for byte likt.
- **`boot` til første 3D-bilde** («Førstegangsstarten, resten» (d)): `first3d` har fått `letter_s` og `read_s` (`docs/systemer/publisering.md`).
- **Bølgekartet over fjernterrenget** (10.3) og **NPC-modellenes byggetid** (10.5) er målt på nytt; tallene står i punktene selv og i `docs/systemer/3d-verden.md` 4.11o. `fetchRay` slår opp lagene én gang per stråle (samme verdier, om lag 13 % raskere varmt).
- **Ikke gjort, til Ø3c (køen, steg 21b):** `KHR_parallel_shader_compile` og 3D forberedt mens brevet leses (`view3d/01-shaders.js`, F3), terrengnettene ved første 3D-bilde (`view3d/03-berths-naust.js`), NPC-typene i tidsbiter, `GLBM` som typede tabeller (F2, H3d1), regellaget over hele landet (Ø11.6, Ø10). Laggen (2)–(4) ble tatt i Ø3b (steg 46) 10.11.2026 (`docs/systemer/3d-verden.md` 4.11r); før det: båtenes tegnedeler i SwiftShader med hele kysten var 0,5–1,2 ms (egen båt) og 4–5 ms (flåten og tingene) per bilde, men der tar et bilde 22–44 s.

## Strøket 08.11.2026 (Jonas' svar A på leveringen på en flerdøgnstur, gren `ccr-2040aa61-qgig5a`)

- **Levering hvert N. døgn på en flerdøgnstur** (spørsmål fra Ø12 A+B): Jonas 08.11.2026: «Svar på valget: A». Når N er like lang som turen, leverer båten turens siste dag, før hun går hjem (`p2LandsToday`, `p2TripLast` i `core/06g-plan2.js`, 154372dc og d048761b). En tur på tre døgn med levering hvert 3. døgn leverer nå dag 3 og 6, ikke dag 1 og 4 (`driftsplan2kyst` M: 1 707 kg dag 3 i Forsøl, så hjem). Når N ikke er turens lengde: Jonas 08.11.2026, valg 14: «Svar på valg: A»: alltid turens siste dag, og hvert N. døgn fra turens første dag når N er kortere (c87ed5c5, Levering-raden og patchnotatet i 9d608c4b; M2 i `driftsplan2kyst`).

## Strøket 07.11.2026 (Ø12 A+B, Driftsplan 2 langs kysten, gren `ccr-2040aa61-qgig5a`)

- **Driftsplan 2: stikkprøver langs kysten mangler** (27.10.2026): prøvd i Bergen (Bøvågen), Bodø og Hammerfest (Forsøl) med hele kysten og vec-pakkene: en hel plan lagd fra siden, startet og spilt ett døgn i hver by (satt, juksa, trukket, levert, hjem), rorbu og havneplass som hjem i to døgn, hjem-lista (U14), Pause med anker der det går og driving der det er for dypt. Feilen som fantes, var Drift-siden som veltet ved Hammerfest (under). `tests/driftsplan2kyst.py`.
- **Driftsplan 2: GUI-gjennomgangen, det som sto igjen og kunne prøves her:** havneplass som hjem (`havnOptions` utenfor Senja), planer utenfor Senja og stikkprøvene for F2, U14 og Pause med anker; skuffen over 3D-sjøen (bildene i `docs/okter/2026-11-07-o12ab/`); garn, teiner og flerdøgnstur over flere døgn med ekte stengt felt (Borgundfjorden), kvote og vær, lukket spill og push i samme kjøring (G, T, M i `driftsplan2kyst`). Nettbrettet står igjen (over).
- **Drift-siden veltet ved Hammerfest** (funnet 07.11.2026): hjem-lista leste landet ved en havn 15–25 km unna på en kartblokk som ikke var lastet (`MAPD.simR` er 4 km), og kastet. `havnOptions` hopper over en slik havn til kartet er inne (`core/07e-havn.js`).
- **«Feltet er åpent igjen» kom neste dag** (funnet 07.11.2026): push-varselet for et stengt felt sto på planens neste titt (i morgen), ikke på åpningsdagen. Ventingen har nå `open`, og push bruker den (`06h-plan2-engine.js`, `ui/10g-push.js`).
- **Stopp-varselet for Driftsplan 2** (funnet 07.11.2026): «har stoppet» og «stopper: felt N er stengt etter reglene fra i dag» gjaldt bare den gamle planen (v3). Nå v4 også (`ui/10g-push.js`).
- **`driftsplan2test` S19 rød på arbeidsgrenen** (07.11.2026): testens feil. `D2.boat` lot kaiskiftet (`b.shift`), fyllingen og lossekøen fra scenarioet før stå mens `D2.reset` satte klokka tilbake, og planen ventet på kaiskiftet i to døgn. Rettet i testen (62 OK).
- **`driftsplan2ui` hang på værets frø:** testen spiller til lina står (opptil 20 t) siden Ø2 05.11.2026 (d663638a), ikke et fast antall steg.
- **`driftsplan2test` tar rundt 35 min:** 85–127 s siden Ø2 05.11.2026 (`tests/historikk.tsv`); målet fra 05.11 var før Ø2 holdt løkka.

## Strøket 07.11.2026 (Ø8b S1: første tur i dekksdagboka, gren `ccr-dc24762d-iyuakj`, rullet ut i 91cc422a)

- Linja om vanlig fiske etter første tur sto bare på første sluttseddel, som forlater skuffen fire spilltimer etter salget. Nå står den også i dekksdagboka (Drift) med samme N (`tutNormKg` i `ui/07b-first-trip.js`, 4310a20f; V1 A i `docs/planer/spillbarhet-fangst.md`). Resten av punktet «Fangsten er uforklart» (S0, S2, S3) står over i 10.2.

## Strøket 07.11.2026 (Ø10 Skagerrak i regelmotoren, gren `ccr-68a96e99-8x1jh1`, PR #49, rullet ut i f4e2a8c0)

- ~~**Regelmotoren mangler Skagerrak**~~ (funnet 27.10.2026 i Onboarding 2): `rulesAt` stenger torsk for norske fartøy utenfor grunnlinjen i Skagerrak øst for linja Lindesnes–Hanstholm (`skag`, FOR-2025-12-19-2805 § 1, lest på Lovdata 07.11.2026; 2023-forskriften FOR-2022-12-16-2281 sa det samme), med unntaket for juksa under 11 m på blad B 1.4–30.6, høyst 3 tonn (`skag4`, § 4), og 5 % bifangst for andre arter (`skag5`, § 5). Flata er ICES 3.a.20 fra Fiskeridirektoratet, bygd inn av `tools/rules/regler.py --skag`. 2026-forskriften er lest (52 tonn norsk kvote, § 2). Første tur leser regelen (`tutSkagOut` tatt ut), og Kystvakta tar den med (`KV_REF.skag`). Commitene 3024043a, 39820d6f og f4dd4df2. Det som står igjen, står i «Regelmotoren sør for 62° N, det som står igjen etter Ø10».

## Strøket 07.11.2026 (OPP4, gren `plan/2026-11-07-opp4`)
- ~~Bekreftelsen i knappen gjelder ikke trinnene~~ (OPP1): `14-act.js` spør `tierKr` for et trinn, og kortet i Fiskeutstyr viser «Bekreft · 13 500 kr» for kniv trinn 3 på kystbåtene (741215ba).
- ~~Kvitteringen sier «Kjøpt: Sløyekniver» uten trinnet~~: «Kjøpt: Sløyekniver, trinn 3: …» og «trinn 3 / 3 om bord» (741215ba).
- ~~Innbytte på verftet beholder knivtrinnet~~: kniv og høtt blir med den gamle båten (prinsipp 5), den nye står på trinn 1, loggen og båtbladet sier det (741215ba).
- ~~Salg mellom spillere gjør trinn 3 til trinn 2~~: `mbPack`/`mbUnpack` tar trinnet som tall (dce739d7).
- ~~`10-fartoy.js` lister «Sløyekniver» uten trinnet~~, ~~totalen for tapt over ripa uten side~~, ~~resten av Håndboka kap. 8 for siden~~ (`lex_oppgrad`): siden «Båten og utstyret» (9bb7663c).

## Strøket 07.11.2026 (minikartet på telefon liggende, gren `ccr-fc7a11b2-nl5jor`, rullet ut i 8d9d1d76)

- ~~Telefon liggende hadde ikke noe minikart, og kartets «–» sto alene under statusboksen~~ (Jonas: «Telefon liggende må jo ha minikartet på samme måte som stående, nettbrett og pc, hvis ikke er jo spillet ubrukelig … Fiks det asap! Og det skal være likt i alle formater. Kart øverst, statusboksen under uten pluss og minus»): telefonen liggende (høyst 520 px høy) er nå som telefonen stående, med kartet øverst og stripa under, og et trykk gir kortet. Den store GPS-boksen er borte overalt (foten på minikartet sier det samme).

## Strøket 07.11.2026 (stripa, kartet og lasteikonet i liggende, gren `ccr-fc7a11b2-nl5jor`, rullet ut i 4f5f6d91)

- Jonas med bilder fra nettbrettet: plusset på den foldede statusboksen sto oppå sjøtallet, minustegnet på den hele boksen sto på motsatt side av kartets, lasteikonet (kassen) var det samme som Om bord, og kartet sto under boksen i liggende (B 06.11.2026 var bygd bare for stående). Nå: ingen «+» eller «–» på statusboksen, et trykk folder den sammen og ut; en fisk som lasteikon; kartet øverst også på nettbrett liggende og PC (`docs/systemer/ui-og-telefon.md`, under U2-6).
- **Pages-publiseringen hang to ganger samme dag** (GitHubs `deploy-pages` ga opp etter 10 min for c62047f0, kjøring 436; byggejobben med enhetstestene og boottest var grønn, og neste kjøring 437 publiserte). Hetzner (detstorebla.no) var grønn begge gangene. Følg med; startes for hånd med `workflow_dispatch` på `pwa.yml` om den blir stående.
## Strøket 07.11.2026 (havsteget H3d1, gren `ccr-287cbb81-whkbel`, rullet ut 08.11.2026 i 00a46c3e)

- Teinedekket på snøkrabbefartøyet var tomt (M1 i `kartlegging-spillet.md`): 70 stableplasser i modellen, og spillet tegner teinene om bord fra `potsAboard()` (leste `pots.big`, fartøyet bærer `pots.sno`). 5ab3abd9.
- Den forreste topplanterna sto 16,5 m fra baugen (M21(2)): masta på styrhustaket, 11,4 m fra stevnen (vedlegg I 3(a)). `krabbe50.py`.
- MOB-båten bakt inn i `krabbe50` (`MOBCUT`), bøyene og flåtene fra `KITADD`, konsollen fra `HELM_KIT`: modellens egne plasser og egen pult.
- En kam av innfoldede stasjoner på babord baug (`pchip` bufret på `id(tab)`): rettet i e7687c78, med kontroll av sidene i `check()`.

## Strøket 07.11.2026 (UI 2, U2-4: Roen, gren `ccr-fc7a11b2-nl5jor`, rullet ut i c62047f0)

- U2-4 i `docs/planer/ui-2-staaende.md` (4.5, V8 A): roen bygd, med `roetest.py` og `ro0` for de andre testene. U2-0 hadde «roen» som ikke målt (lest i koden, `ui-2/kartlegging.md`); den er nå målt i `roetest`.

## Strøket 06.11.2026 (havsteget H3b, gren `ccr-2f1306ed-u6tdgs`, ikke rullet ut)

- **Prisen for snøkrabbe** var prisen for fryste klør i 2025, og levende krabbe hadde ingen pris (H3, funnet i planen): nå klør og levende per måned fra sedlene 2024–2026, levende etter størrelse med Råfisklagets minstepriser som gulv, død krabbe 1 kr/kg (5.69 i `redskap.md`).
- **Omregningsfaktoren for klør** (1,49 fra 2026, 1,61 før; H3a): i spillet per år (`snoUh`), og krabben deles og fryses som klør i stedet for hel.
- **Kvote › Mine kvoter viste torskekvoten for snøkrabbetillatelsen** (funnet i H3b): kortet viser nå fartøykvoten med fleksen og tilleggskvoten for snøkrabbe.
- **Lagene-kortet sa «bytter ved hver levering … etter § 6»** også på snøkrabbefartøyet: sier nå fem uker på og § 20 der det gjelder.

## Strøket 07.11.2026 (trackfollow rød siden full fart, gren `ccr-f981c5f0-ezb7x7`)

- ~~«She keeps to the line … and never goes back along it» rød (back 205,7 m, 00:32)~~: et ekte hopp, ikke målingen. Et tregt bilde mellom to tikk der manøvreringsmodellen skulle ta båten (rett etter kast loss, og etter tid hentet inn med minuttsteget) satte henne tilbake: ved kast loss kjørte 3D-følgeren hele bildetiden i ett steg, 207 m ut fra kaia (197 m tilbake), og etter innhentingen flyttet `updateBoat` henne over 900 m til minuttstegets framskriving, opptil et spillminutt foran der modellen startet (177–196 m tilbake). Gjenskapt med tikket holdt og 22 s stans. Nå står hun til modellen tar henne (`dynSoon`, `view3d/16-motion.js`), simuleringen er da `b.pos` uten framskriving, og følgeren går aldri foran simuleringen. `trackfollow` 1b og 2a gjenskaper begge overgangene (røde før rettingen: 187 og 203 m; `fysikk-og-styring.md` 5.58). Rød med 78 målinger og grønn med 158 var lengre SwiftShader-stans, ikke farten: båten i testen er trebåten (7 kn), og «21–24» var m/s på skjermen.
- ~~«Stopp underway: she slacks off gradually» rød (8,4 m/s per s)~~: målingen. Farten fra 3D-båtens siste bilde ble delt på tiden for modellens siste tikk, så fire tikks avslakking havnet i ett. Modellen slakket av med 2,3 m/s per sekund på skjermen (0,064 m/s² i spilltid). Nå måles modellens fart ved hvert tikk, og et «Stopp» utenom modellen blir også rødt. Grensen står (5.58).

## Strøket 07.11.2026 (B, båtsalg mellom spillere hos Kystmegleren, gren `ccr-2cfcfb0c-tfhulm`, rullet ut i 98c7befa)

- ~~B, båtsalg mellom spillere hos Kystmegleren~~ (Jonas: «Oppgave: B, båtsalg mellom spillere hos Kystmegleren etter EAFC-mønsteret», V4 A, V5 A, V6 A; «Kjør migreringen på nytt, så ruller vi ut»): serveren (`supabase/migrations/20261107140000_broker.sql`, kjørt av Jonas i SQL-editoren og sjekket), spillet (`core/09k-market.js` uten NPC-oppføringer, `ui/10s-broker.js`, `ui/phone/13c-megler.js`, Rederi, verftet, Nettet, låsen i `depart`, «Selg nå» til 90 %), patchnotes og testene. Systemet i `docs/systemer/handel-og-steder.md` («B Båtsalg mellom spillere»). **Gjenstår:** prøvd mot den ekte serveren med to kontoer (bud, overbydd, oppgjøret etter en time); det som er antatt og ikke gjort, står under «Spillarbeid som venter».
- ~~M4 står igjen: V3 B (en oppføring trekkes for alle når én spiller kjøper)~~: oppføringene er spillernes og ligger på serveren (`listings`), og en solgt båt er borte for alle. Prøveturen ved kaia og bildene fra showroomet gjaldt NPC-oppføringene, som er tatt ut (B5).
- ~~M5 står igjen: innbyttebåten liggende ved verftets kai med «Til salgs»~~: innbyttebåten legges ikke ut igjen (B5: bare spillernes båter).

## Strøket 07.11.2026 (Neste mål og «Trenger deg», gren `ccr-bc0543eb-umtheg`)

- ~~«Neste mål» forsvinner ikke når målene er nådd~~ (Jonas 07.11.2026, med en autoliner, to sjarker og 93 millioner: «Første juksamaskin», så «Gammel tresnekke med hjemmel under 7 m»): stigen er flåtens, steg som er passert hoppes over, juksamaskinen bare til en båt som kan ha den, og med et havfiskefartøy i flåten er stigen ferdig og Neste mål borte når selskapet er et AS. Det siste steget er det billigste havfiskefartøyet som kan kjøpes, ikke «Havfiske, kommer» (`baater.md`, «Stigen er flåtens»).
- ~~«Rederiet trenger deg» for en torskekvote som er nesten fisket~~ (Jonas 07.11.2026: «hva trenger den meg til?»): kvoten står som en dempet linje på båtens kort i Rederi og teller ikke i «Trenger deg» eller på ikonet (`ui-og-telefon.md`, U2-5).
- **Antatt:** At «Stift Rederi AS» blir stående som Neste mål for et ENK med havfiskefartøy, er med vilje (et ekte valg med skatten). Om en kvote som er helt fisket opp bør bli et varsel igjen når driftsplanen fortsatt leverer torsk som inndras, er ikke avgjort.

## Strøket 07.11.2026 (rederilogoen på ringnotbåten, gren `ccr-3d7890ec-9bzzlc`)

- ~~Rederilogoen vises ikke på skroget til kystnotbåten 38,55 m~~ (`ringnot38`, funnet i gjennomgangen av butikken 07.11.2026, «Venter på Jonas»): `logoStrips('ringnot38')` var null fordi skrogets blå også går langs rekkverket og listene på overbygget, så `sideStrip` tok toppen fra styrhuset midtskips. Nå står logoen på det blå båndet mellom den hvite stripa og skansekledningen, på hver side midt i den strekningen nærmest midtskips der det ikke er koøyer, utløp eller lister rundt (`sideStrip(…, band)`, `stripBare`; `baater.md`, Rederilogo). De 14 andre typene er uendret, og modellen er ikke rørt. `maletest` krever nå plass til logoen og merket på alle typene (sett rød før: `"nostrip": ["ringnot38"]`), og `tests/unit/vessel3d.test.mjs` sjekker logoen, merket og kallesignalet på alle typene i Node. Ringnotbåten er låst for spillerne ennå, så rettingen merkes først når hun åpnes (H6).

## Strøket 07.11.2026 (Ø11.3 sammenstøt, gren `ccr-208d78a1-ruhxll`, rullet ut i 21ec10d3)

- L2 «sammenstøt mellom båter» i «Lover og regler på sjøen» (sjøloven kap. 8): kontakten, skylda etter §§ 161 og 162, betalingen og § 164 (`docs/systemer/sjofart-og-lover.md` kap. 5).
- 10.6 «`lanterntest` og `anchorlight3d` står ikke i `COVER` for filene Ø11.2 endret»: lagt inn for `core/05e-sjovei.js` på en egen linje etter `COVER` i `tests/run.py` (sammen med `hulltest`), så linja H3b også endrer, står urørt.

## Strøket 07.11.2026 (køen ved mottakene, K1–K4 og K6, gren `ccr-a9ff699b-re4zwf`)

- ~~Mottakene tar alle som kommer, samtidig~~: losseplasser etter kailengden (1–4), køen på serveren (`landing_q`, `land_begin`/`land_end`/`land_look`), «Kø · 2 foran · ca. 11 min» på stripa, Lever-siden med «Gå ut av køen» og «Lever et annet sted» (`havner-og-mottak.md`, «Køen ved mottakene»). Gjenstår: K5 (NPC-flåten tar plasser i sesongen), push «Din tur ved kaia», de andres lossing i 3D.
- **Antatt:** 25 m kai per plass, ventetida regnet som første ledige plass pluss én egen lossing per båt foran, en venting som ikke fornyes på ett minutt er borte. Justeres når flere spillere leverer samtidig.

## Strøket 07.11.2026 (UI 2, U2-6: Hjemskjermen, gren `ccr-67e5a499-sxgchb`, rullet ut i 533b8e29)

- K8 (hjemskjermen hadde sju kort før appene; på nettbrett stående synes seks av 22 apper, på telefonen tolv) fra `docs/planer/ui-2/kartlegging.md` kap. 4: Neste mål og Første uke (fartstiden etter den første uka) er én rad på to kort, og appene står i gruppene Drift, Handel og regler, Deg, Verden og System, fire på rad, på én glassflate med linjas strekikoner og merkene i én aksent. Apper synlige uten å rulle, av 22: telefonen 390×844 9 → 14, 412×915 12 → 18, nettbrett og PC 3 → 8 (målt med alle appene, merker og tre «Nå»-kort). Liggende telefon 0 → 0 (står i 10.5).
## Strøket 06.11.2026 (Tonys spilltest, gren `ccr-a9ff699b-re4zwf`)

Tony Hjelmseth prøvde spillet hos Jonas på iPhone (trebåt, Senjahopen, tilbakemeldingene #115 og #116 er hans). Jonas' liste etterpå, punkt for punkt:

- ~~Nivået i bløggekaret og sløyestatusen synes ikke under fisket~~: en femte måler på stripa (kg av karet, gul fra halvfullt, rød fra 90 %), og linje 3 sier «Sløyer 37 kg · 2 min» eller «Kar 42/60 kg»; kortet deler i «å sløye» og «sløyd og venter på is» (`ui-og-telefon.md`, «Etter Tonys spilltest»).
- ~~«HER» i fangstboksen over telefonknappen~~: bare kg/t.
- ~~Lang tid til sluttseddelen~~: `LANDING.note` 5 → 2, `wash` 6 → 3 (`havner-og-mottak.md`).
- ~~Ingen forklaring på hvorfor et todelt brukernavn ikke godtas~~: `nameWhy` under feltet mens det skrives, med forslag.
- ~~Eksosen blinker og blir grå skiver på iPhone~~: tones inn og ut, seks trinn, høyst 320 piksler (`3d-baater-og-animasjon.md`). Ikke sett på iPhone her.
- ~~Får automatisk håndjukse mer enn «Jukse selv»?~~ Nei: snittet var likt (din del ble tatt ut av den automatiske fangsten og kom via nappene), god spilling ga opp til 2×. Nå `SELF = 5`.
- ~~Venner-appen vises ikke etter registrering~~: ute så snart spilleren er registrert, og når en forespørsel kommer.
- ~~Skipperen klonet seg i trebåten~~: `DECKACT.me` holder rekkefiskeren borte, og `workAssign` holder spilleren ved rekka mens han jukser selv.
- ~~Nettet: layout~~: bokmerkene som rader, båten inne i rammen, brikkene venstrestilt.
- ~~Kjøpsbekreftelse~~: kvittering for alle kjøp (hva, pris, antall om bord, montering ferdig kl.), monteringstida på utstyrskortet og i Nettets fane.
- ~~Tony Hjelmseth som NPC~~: mannskap å ansette på kaia i Husøy, med historie og egne replikker (`folk-om-bord.md` 5.6d).
- ~~Varsel ved ny versjon~~: `version.json` og stripa «Oppdater nå» (`publisering.md`).
- ~~Registrering tidlig?~~ Åpningskortet forteller gjesten at spillet lagres i nettleseren og at registreringen kommer etter første levering.
- Svart i økta (ikke kode): mottak opptatt av en annen spiller, Autonav etter søk, salg av båt og utstyret, bruktsalg mellom spillere, vann i båten, staur/blåse/dregg, rund eller sløyd levering.

## Strøket 06.11.2026 (trimfarten, gren `ccr-dfa1209c-7vgp4x`)

- ~~Trim gir ingen fart i Autonav og ved roret~~ (TonyHjelmseth, «Legoy», trebåt, kjøpte «Økt turbotrykk» 18:49 og fikk ingen økning): manøvreringsmodellen hadde bare båttypens motor siden Fysikk 1 (19.10.2026), så trim, større motor og 90-hesteren ga fart bare på papiret og med spillet lukket. Rettet med `dynCalOf` (`fysikk-og-styring.md` 5.58, «Båtens egen motor»), sjekk i `tests/unit/trimfart.test.mjs`.
- ~~Rutefarten fulgte ikke trimmen~~: en rute satt på den gamle toppfarten eller marsjfarten fikk ingenting av trimmen før glidebryteren ble flyttet. `trimSet`/`trimEnd` skalerer rutefarten (`fysikk-og-styring.md` 5.58).
- ~~Rederilogoen kunne ikke kjøpes~~: `des_logo` manglet i `SHOP_PRODUCT` (kassen fikk et tomt produkt, «Kunne ikke åpne betalingen»), og malerverkstedet viste 29 kr der databasen tar 49. Sjekken `tests/unit/butikk.test.mjs` sammenligner hvert produkt spillet selger med migreringene.
- ~~Haill ga ikke mer av bifangsten i teinene~~ (torsk, brosme): `luck(sp)` manglet (`haill-pub-og-bonus.md` 5.10).

## Strøket 06.11.2026 (Ø11.2 sikt, lys og lyd, gren `claude/o11-2-sikring-lys-lyd-bsrlub`, rullet ut i f04d4feb)

- L3 «sikt, lyd og dagsignaler» i «Lover og regler på sjøen» (dagsignalene er ikke med, V7) og N8s lanterner og lydsignaler i «NPC-flåten for hele landet»: regel 19 d–e for båtene som ikke ser hverandre i nedsatt sikt, sikker fart og minste styrefart for Autonav gjennom `sjvAuto` og `sjvSail`, tåkesignalene (regel 35) for alle innen hørevidde og egen båt, manøversignalene (34 a) og fem korte (34 d), hornet med signalene i knappelinja, lanternene på NPC-ene etter det de gjør og innenfor sektorene, om dagen i tåke (20 c) og med Kystvaktas blå rundtlys (kap. II 53 d). Regel 19 d–e, 20–37 og vedlegg I og III lest ordrett på Lovdata 06.11.2026. Alt står i `docs/systemer/sjofart-og-lover.md` kap. 4 og `docs/systemer/lyd.md` 5.25b.
- 10.1 «Lyden tar imot tall som ikke er endelige»: et øre som er NaN høres om bord, og `set` og `place` i `ui/10e-sound.js` hopper over et tall som ikke er endelig. Sjekken i `soundtest` er grønn.
## Strøket 06.11.2026 (Ø8 Spillbarhet, gren `ccr-ccfb0017-rmieib`)

- 10.2 «Planleggeren viser ikke bølger langs ruta»: hvert rutekort viser sjøen på etappen ved tida båten er der (`draftSea`/`routeSeaDraw` i `ui/03b-route.js`), rød over `BOAT.risk[0]` med én linje under kortene; prøvd i Bergen, Bodø og Hammerfest i begge formater (`docs/systemer/autonav.md` 5.15).
- 10.6 «`autonavtest` henger i steg 9 (Havøysund) med hele kysten i bygget» (lagt inn tidligere samme dag): grønn på arbeidsgrenen 731e4792 med hele kysten, 25 OK på 27 s i `run.py changed`. Rettet av en annen økt mellom 554a5ae4 og 731e4792; ikke undersøkt hvilken commit.
- 10.4 «Sjøen langs ruta er spillets egen sjø, ikke varselet»: Jonas valgte varselet (R1 A, 06.11.2026); kortene bruker `hsAtFc`, sett rødt i `routetest` med avgang om 30 timer før byttet og grønt etter.
- 10.2 «Innloggingsbonusen»: teksten i Salg-appen sier ekte kalenderdager og «Neste prosent · i morgen, fra midnatt» (`ui/phone/09-vaer-post-salg-redning.js`; `haill-pub-og-bonus.md` 5.9).
- 10.2 «Mannskapet er ikke spilltestet»: spilt i `tests/mannskapsplay.py`, rapporten i `docs/playtest/rapport-4-mannskap.md`; det som bør endres, står i 10.2 og 10.5. M1, M2 og M3 bygd 08.11.2026 (Ø8b M).

## Strøket 06.11.2026 (Ø17 hooks og regler fra Game Studios, gren `ccr-d22aebce-865bcx`)

- ~~Verktøy fra Claude Code Game Studios: A1, A2, A4 og A6~~: deny-lista i `.claude/settings.json` (A1), øktstarten `.claude/hooks/okt-start.sh` (A2), lesevakten `.claude/hooks/lesevakt.py` (A4) regelen «se testen feile før den stoles på» i `CLAUDE.md`, `docs/systemer/testing.md` og `/lever` (A6), og senere samme dag commit-vakten `.claude/hooks/commitvakt.py` (A3, Jonas: «Fiks det du mener er nødvendig»). `tests/hooktest.py` (55 OK) i `LITE` og `COVER`; sett rød før hookene fantes (10 FEIL) og med hookene ødelagt med vilje. Prøvd i Claude Code i samme økt: lesevakten og alle deny-reglene slo til, den vanlige pushen gikk. Det som står igjen: «Verktøy fra Claude Code Game Studios, det som står igjen etter Ø17» over.

## Strøket 06.11.2026 (havsteget H3a, gren `ccr-1c785ad6-0di8o1`, rullet ut i 8982db93)

- **Tre av havflåtens snøkrabbefelt var ulovlige for et norsk fartøy** (h24 i russisk sone, h15 på russisk sokkel i Smutthullet, h03 innenfor 12 nm): `tools/npc/havflaate.py` setter snøkrabbefeltene bare der et norsk fartøy kan fange snøkrabbe (`sno_rules`), og `hav.test.mjs` sjekker alle 12 mot `rulesAt`.
- **Registeret hadde 34 snøkrabbetillatelser og en kvotefaktor på 0,6–1,4:** nå 30 (sak 17/2026) og ingen kvotefaktor (`HAVLIC.krab.flat`); migreringen er kjørt av Jonas i SQL Editor 06.11.2026.
- **`HPK.snokrabbe` (712 kr/kg) uten kilde:** tillatelsen prises etter driften (V6 B, `snoLicValue`).

## Strøket 06.11.2026 (Ø11.5 utstyret og merkingen på båtene, gren `ccr-2f9c820c-pucumq`)

- **`lsaOf` har feil antall livbøyer fra 15 m** (funnet i Ø11a 05.11.2026): kyst21 (21 m) får 4, FOR-2000-06-13-660 § 7-10 sier 3 under 24 m; pelagisk (75 m) får 6, paragrafen sier 8 fra 75 m. Røyk på bøyene (minst to, én under 24 m) finnes ikke. `core/02-species-gear.js` linje 247.  **Rettet i Ø11.5:** 3, 4, 6 og 8 bøyer fra 15 m, røyk på én under 24 m og to fra 24 m, MOB-båt fra 45 m (`lsaOf`, `tests/unit/sikker.test.mjs`).
- **Ø11.5 må ta ut eller skjule MOB-båtene som er bakt inn i skrogene (Ø11.4, 06.11.2026):** `al45.py` (H2), `tral60.py` og `ringnot38.py` har en enkel oransje MOB-båt med davit modellert inn i skroget (en ring med lokk og en stang). Den nye `deck-mob` skal stå på `K.mob` i stedet; to båter på samme plass vil synes. **Gjort i Ø11.5** (Jonas: «Skjul den gamle»): alle fire havbåtene fra 45 m hadde en; på egen båt tas den ut når modellen lages (`MOBCUT`, `mobCut`), og den nye står på `kit.mob`. ringnot38 (38,55 m) trenger ingen og beholder sin.
- **`deckshot` med `KYST_DECK` krasjer på slutten (funnet i Ø11.4, 06.11.2026):** `KYST_DECK=kyst15,kyst21 python3 tests/deckshot.py` tar bildene og sjekkene for de to båtene, men ender med `KeyError: ('hurtigsjark', 'fiske')`, fordi kranlista `CR` (linje 98–100) tar alle båtene med kran og ikke bare de valgte. Samme i utgangspunktet (110e4b7f). Rettes ved å filtrere `CR` med `boats`. **Rettet i Ø11.5:** `CR` og kassene tar bare båtene som er valgt.

## Strøket 06.11.2026 (Ø11.1 vikeplikten for spilleren og NPC-ene, gren `ccr-e5ae7b11-uibmpt`, rullet ut i d62153dc)

- L1 «vikeplikt og varsel (sjøveisreglene 13–18)» i «Lover og regler på sjøen» og N8s vikeplikt og AIS-status i «NPC-flåten for hele landet»: `core/05e-sjovei.js` med `colregCls`, `colregSit` og vikingen for NPC-ene og Autonav, varselet i stripa, boksen, kartplotteren og minikartet, AIS-statusen og nestenulykkene (`S.nearMiss`) til Ø11.7. Sjøveisreglene 1–18 og 19 a–c lest ordrett 06.11.2026. Prøvd i `colregtest` (Senja) og i Bergen, Bodø og Hammerfest. Alt står i `docs/systemer/sjofart-og-lover.md`.

## Strøket 06.11.2026 (Ø7 Småfeil i spillet, gren `ccr-3609ceee-8lzhrx`)

- **10.1 (1) Veiledningen låste seg på `route2`** når skuffen «Beholdning» fra fiskesteget lå over «Autonav» (UI-gjennomgangen 04.11.2026: ringen trykket 900 ganger): rettet i U0 (18d7c37f, `tutTip` lukker en skuff som dekker målet). **«Lukk telefonen først» sto fast** over telefonen også når steget bare var et lite tips uten noe å gjøre (seilingen ut, timen på feltet, veien inn): rettet i Ø7, et lite tips mister bare ringen med telefonen åpen og går av seg selv (`opning-og-veiledning.md`). Prøvd med `tut.py` i begge formater og et eget løp som åpner skuffen på dekkssteget og over kartplotteren på `route2` og telefonen på små tips: `route2` ferdig på 4 runder, alle stegene i rekkefølge, `"tut": 0`, ingen sidefeil.
- **10.1 (2) Sidefeil i `havNear` under seilingen til Botnhamn («reading 'x'»):** rettet i U0 04.11.2026 (18d7c37f): et skip som var skjult i en havn uten kjent kaiplass ett minutt før, gir ingen fart i stedet for å lese `P.p` (`core/05d-hav.js`, ikke `05-vessels.js`). Prøvd i Ø7 langs kysten (`npcStates` minutt for minutt i sju døgn ved Botnhamn, Kristiansand, Bergen, Ålesund, Bodø, Tromsø, Hammerfest og Båtsfjord): 0 feil i 80 640 kall; i 13 av minuttene ville den gamle linja ha kastet (6 ved Botnhamn, 7 ved Ålesund), ingen andre steder. Ny sjekk i `tests/unit/hav.test.mjs` (60 skip et halvt minutt etter avgang), rød med den gamle linja.
- **10.1 (3) Dagbokas håndskrift:** `.bk-et`, `.bk-gt`, `.bk-sn`, `.hw` og `.lg td` har Caveat, som siden har innebygd (U0, 18d7c37f); ingenting i `src/` ber lenger om Segoe Print, Bradley Hand eller Comic Sans. Sjekket i Ø7: skriften er lastet (`document.fonts.check('16px Caveat')`), skjermbilder av dagboka i 1280 × 800 og 800 × 1280.
- **10.1 (4)–(6), sjekket i Ø7:** (4) «Start på nytt» er tatt bort fra havnesiden og står bare i rødt i Innstillinger, med `confirm` (U0). (5) Lever-siden til sjøs sier «Du er ikke i havn. Fisken leveres på et fiskemottak.» med nærmeste mottak og «Autonav dit» over (U0); havnesiden har fortsatt «Prislisten under» med prislista under. (6) «Kjøp (test, ingen betaling)» er ikke en feil: `shopMode` gir den bare utenfor detstorebla.no eller for admin, og en spiller ser «Kjøp · kr» eller «Snart i salg». Skjermbilder i begge formater.
- **U10, rest (spilltest 3): ikonet i en knapp med to linjer sto en linje høyere enn naboene.** Knappene henger nå fra toppen av raden, og ved siden av hovedknappen starter de andre 8 px lavere, så ikonføttene og tekstene står på linje; `rowsUp` regner radene fra margkanten, og statusfeltet og viften står minst 10 px over den høyeste knappen (`ui-og-telefon.md`). Målt i 1280 × 800, 800 × 1280 og 390 × 844 på norsk og engelsk, også med «Fish on» som hovedknapp ved «Rest in the bunk» på to linjer: før 12 px mellom ikonføttene, nå 0; tekstene går ikke i hverandre.
- **`paintPlotter` kastet «reading '0'» i `drawSkiff`:** i G3-skopet er `inFrame` hendenes ramme (`view3d/09-landing-deck.js`), som skygget for verdens `inFrame(p)`, så skiffens levende kartplotter kastet hvert halve sekund når modellen med `skiff.scr` var nær kameraet. Det skjedde i spillet for alle med skiff, både ved båtbytte og når en lagring med skiffen ble lastet: kastet stoppet resten av bildet (kaia, karene, de andre båtene og snøen manglet), og skjermene sto svarte. Kjernen har nå `inMapFrame`, som `paintPlotter` bruker (`3d-baater-og-animasjon.md`). Prøvd i 3D i begge formater: før 3–21 sidefeil på 8 s, nå 0, og konsollen viser kartplotteren og målerne.
- **10.7 `S.owned`:** blir stående som merket for migreringen i `11-boot.js` (en lagring begynt etter 04.10.2026 har `['trebat']` fra `newState`, så en skiff kjøpt på verftet blir stående); kjøpet i telefonen legger ikke lenger til i lista, og det samme i `addVessel` står i 10.7 til H2 er ferdig. `boottest` 4 OK.
- **10.7 ikonet `sjomann`:** tatt bort (`ui/phone/00-shell.js`).
- **10.7 skiffen (`buildSkiff`):** sløyebordet og blødekaret sto ikke lenger ved setet: skiffrevisjonen 31.10.2026 la sløyebordet over babord ripe ved konsollen og blødekaret på dørken akter om det (`skiff-grunnlag.md`, rad 8), sett i 3D i Ø7. Skjermene var døde fordi `paintPlotter` kastet (over); nå lever de. `buildSkiff` blir, siden `handKit` bygger på den.

## Strøket 06.11.2026 (UI 2, U2-5: Rederi, gren `ccr-91234803-y9yb7j`)

- K9 (Rederi: flåten begynte 0,8 skjermer ned på telefonen og 1,1 på nettbrettet, bak regnskapet og to knapper) fra `docs/planer/ui-2/kartlegging.md` kap. 4: flåten står først i Rederi-appen med ett kort per båt, «Ta roret» som hovedknapp når begge ligger i havn og ellers grå med grunnen, regnskapet som én linje med «Bank ›» under flåten, ingen knapper over flåten. Målt med `kartlegging.py`: telefonen 1,0 skjermer og flåten 0,08 skjermer ned, nettbrettet 1,5 og 0,11 (`docs/systemer/ui-og-telefon.md`, «UI 2, U2-5»).

## Strøket 06.11.2026 (UI 2, U2-1: stripa og de faste sonene, gren `ccr-aee4fa08-paslvj`)

- K4 (boksen vokste 47 px mellom havn og underveis og minikartet flyttet seg), K5 (pilla sa det boksen sa), K6 (tredje linje tom i havn), K7 (minimer-knappene 32×30, målerknappen 31 px) og K13 (veiledningens mål) fra `docs/planer/ui-2/kartlegging.md`: stripa med tre linjer og fast høyde er normalen i stående, boksen er et kort ved trykk, minikartet står fast, pilla `#dockInfo` er borte og linje 3 sier det den sa, dekk-steget peker på `#hud .st.nx`, `hmin`, `plotMin` og målerknappen er 44 px (`docs/systemer/ui-og-telefon.md`, «UI 2, U2-1»). K12 står igjen (10.1, Ø7).

- ~~**Stripa på Jonas' telefon med 3D** (UI 2, U2-1, 06.11.2026): stripa er 73 vw bred og 60 px høy på en 390 px telefon, minikartet 37 vw under den; målt uten 3D i containeren. Ses på telefonen: om bredden dekker for mye av himmelen og landet, hvordan den tomme tredje linja ser ut mens båten ligger stille, og om «…» på lange stedsnavn («Fremme i Kristiansund N 07:34 · …») er greit. I liggende nettbrett og PC er boksens reserverte høyde 196 px (`styles.css`, `--bH`), som gir tom plass under «Kulde» i havn; U2-8 avgjør.~~ Sett 06.11.2026 kveld: for bred (det dobbelte av den gamle boksen). Jonas valgte B: 47 vw, like bred som minikartet, og kartet øverst; bygd og rullet ut samme kveld.
## Strøket 06.11.2026 (UI 2, U2-3: Knappelinja, gren `claude/u2-3-knappelinja-felp6h`)

- K1 (resten: «Mer» sto til sjøs i stående), K2 (viftene Bygd og Verft brakk til fire og én) og K3 (en til tre grå knapper til sjøs uten grunn før trykket) fra `docs/planer/ui-2/kartlegging.md` kap. 4, og 10.1 «Mer» til sjøs i stående etter U2-2: Auto-nav er ute av linja, redskapet er én knapp «Redskap» med vifte bare når båten har settredskap, grunnen står under etiketten på det som ikke kan brukes nå og det som aldri gjelder båten vises ikke, hovedknappen står først, viftene står i rader på høyst fire (fem som to og tre, seks som tre og tre). Målt med `kartlegging.py` i 22 tilstander: ingen «Mer», én rad, høyst fem, Om bord sist (`docs/systemer/ui-og-telefon.md`, «UI 2, U2-3»). «Mer» står igjen bare som vakt etter «Ligg» (Fortøy og Anker slått sammen) når Prai og Ta slep gjør raden for lang.
- 10.7 **«under Beholdning»** i `ui/07c-handbook.js` (dryppet `beh` heter «Om bord», kap. 5 sier «Om bord › Redskap» og «Om bord › Rigg»), `core/10-gear.js` (`rigWrong`, tapt redskap), `ui/10r-sponsor.js` og `ui/05d-plan2.js` sier «under Om bord», norsk og engelsk. Kaibodens kort «Beholdning» står. Ingen gren som gikk, hadde rørt filene (H3 har ikke rørt `05d-plan2.js`).
- 10.7 **`tests/kartlegging.py`, «havn-naust»** måler nå naustets kai (`K.naust`: `S.home = 'vangshamn'`, naustet funnet og `dock(id, 'naust')`, `berthKind` gir `naust`): raden Hvil · Naustet · Om bord. Nye tilstander: Redskap- og Sett ut-vifta, ved egen blåse 50 m, 600 m og 2 km, til ankers, full last fylt til kapasiteten (`K.fill` lå 4 kg under før, så Auto-nav/Til mottaket ble aldri målt).

## Strøket 06.11.2026 (UI 2, U2-2: Om bord, gren `ccr-5cc88064-l54ouc`)

- K1 (seks knapper til sjøs brakk til to rader på telefonen, Beholdning alene øverst) fra `docs/planer/ui-2/kartlegging.md` kap. 4: aldri to rader i stående nå (høyst fem, målt i 17 tilstander med `kartlegging.py`), Om bord sist i alle tilstander, Mannskap og Hvil ute av linja som globale, prikken for krangel og driftsplan på Om bord (`docs/systemer/ui-og-telefon.md`, «UI 2, U2-2»). Resten av K1 («Mer» står til sjøs) og K3 er U2-3 (Auto-nav ut, redskapet som én knapp, grunnen på knappen); K2 (viftene) U2-3; K10 og K11 (Ansatte-siden 55 %, to like tunge knapper per person) U2-7.

## Strøket 06.11.2026 (Ø16 sanntidsreléet, rullet ut i 01c89b6f)

- **Sanntidsreléet (S2 i `docs/planer/sanntid-posisjoner.md`, grenen `ccr-529a099b-0o66nk`)**: reléet `tools/server/rt/server.mjs`, billetten `rt_ticket()`, klienten med 5 Hz/1 Hz og interpolasjon 0,5 s bak i `ui/10h-world.js`, `setup.sh`, `Caddyfile` og `deploy.yml`; `rttest` 12 OK, `sqltest` 135 OK. Migreringen, `setup.sh` og hemmeligheten i Vault gjort av Jonas 06.11.2026, rullet ut samme natt etter hans ja. Det som må måles (ekte nett, lasten S3), står i 10.5.

## Strøket 05.11.2026 (Finnmark kalibrert mot sluttsedlene)

- **Vest- og Øst-Finnmark hadde for lite torsk, mest skrei:** `COD_AREA` i `core/03f-fiske.js` etter kilo per sjarkdag i sedlene 2025–2026 (`fiskerimodellen.md`).

## Strøket 05.11.2026 (garna kalibrert etter ERS)

- **Garna fisket for lite i skreisesongen:** rettet med en skreifaktor på torsken i bunngarn og høyere metning per garn (`redskap.md`, Kalibrering). Utenfor sesongen var de riktige og er uendret for torsken.

## Strøket 06.11.2026 (havsteget H2e, gren `ccr-4a897f45-dtssey`, rullet ut i 377b6c59)

- Kystvakta spurte ikke om minstemål eller merking, og så bare på midten av hvert sett (5.30): på en havbåt sjekker havsjekken posisjonen langs hele lina, merkingen, fartøykvoten, bifangsten og en stikkprøve mot minstemålene (5.30b i `kvoter-og-regler.md`).
- Båthandelen viste bare skrogets pris ved kjøpsknappene for autolineren (57,4 og 70 MNOK mot 202,8 og 215,4 MNOK betalt), med «Uten hjemmel … bifangst» under, og fanen Havfiske sa at båtene ikke kunne kjøpes (`baater.md`).
- Havbåten bunkret med kystbåtenes 90 l/min, så 180 m³ tok over et døgn (`PUMP.hav`, `havner-og-mottak.md`).
- En havbåt kunne ikke losse ved et havmottak (`havOnly`, Avaldsnes): `startLanding` og Lever-siden spurte bare `pt.mottak` (`plantFor`, `havner-og-mottak.md`). Feilen var der fra H0.
- Når du sovnet om bord på havbåten, sa loggen og søvnskjermen at båten drev, mens lagene arbeidet videre (`folk-om-bord.md`).
- Båtens egen kran ved lossingen var bare sett i Vannareid: `h2dshot` del 8 ved mottakene i Båtsfjord, Tromsø, Ålesund og Bergen.

## Strøket 06.11.2026 (havsteget H2d2, gren `ccr-29346d8a-qz1f9z`, rullet ut i b496da28)

- Autolineren satte lina uten noe over hekken (H2d1): settingen har nå lina med egnede kroker ned slisken, stengene, dreggene og blåsene over hekken (5.67 i `redskap.md`).
- Lagene på vakt på autolineren sto på de gamle plassene og delvis oppi haleren, og ingen gaffet fisken (H2d1): gafferen og den ved krokrenseren står i haleplassen, resten er inne, og fisken gaffes inn og sklir i renna.
- Lossingens pall hang i lufta ved kaikranens tupp nesten 4 m fra luka, fordi kaikranen ikke når luka på en autoliner (H2d1): pallene kommer opp fra rommet gjennom luka på båtens egen kran, med lossegjengen ved den.

## Strøket 05.11.2026 (havsteget H2d1, gren `ccr-87bd2cf3-hnz2ak`, rullet ut 06.11.2026 i b496da28)

- Lossingen på paller hadde en enkel pall (`PM.palF`) og ingen luke (H2b): Blender-pallen med film på pallegaffelen og lasteluka med lokk er i H2d1 (5.66 i `redskap.md`).
- Sidefeilen «map: mask block 94,18 has no pack» på autolinefeltet nord for Loppa i 3D (`groundStep` i `view3d/17-draw.js` leste landmasken der simuleringsruta manglet maskeblokka): faller nå tilbake til landandelen (`3d-verden.md`).

## Strøket 05.11.2026 (havsteget H2c, gren `ccr-94300c4c-ssnrxm`, rullet ut i 493c636)

- **10.2 Ligge bi i uvær, Driftsplan 2:** havfartøyene på planen gikk til kai i uvær med planens kystgrenser. Nå arbeider de under planens grenser, venter ved lina over dem og ligger bi over sine egne (`plan2Wx`, `plan2WorkStop`, `05-vessels.js`).
- **H2b: Driftsplan 2 kjente ikke lagene:** planen krevde utnevnt skipper og styrmann i `S.crew`, som havbåten ikke har. Nå går planen med lagene uten deg om bord (`plan2CrewWhy`, `plan2Check`, `plan2WatchTick`).
- **Hjem er mottaket:** `plan2LegOk` sa at leia mellom to like steder gikk over grunt vann («Leia mellom Vannareid og Vannareid går over grunt vann»), så en plan med hjem ved mottaket kunne ikke lages. Gjaldt kystbåtene også.
- **Lossemeldingen sa «i dag»** om en sluttseddel to døgn fram (`mottakWhen` regnet dagen fra lossingens slutt, ikke fra nå).
- **`plan2State` opprettet en tur** (`tripOf`) når siden regnet planen, så åpent og lukket spill kunne få ulike turer; `driftsplan2test` S9 (lukket spill midt i) var rød to ganger med den og grønn etter rettingen (S9 ligger nær grensen: 1,8 % på kr mot 3 %).

## Strøket 05.11.2026 (spilltest 3, Jonas' valg V1–V8)

- U1, U2, U4, U8, U12 og K3 bygd etter valgene (`docs/systemer/rettelser.md`). K2 (lina under kalibreringen) rettet etter ERS. K1 og «Lofoten i mars er tynn etter B2–B4» (10.5): ikke hevet, fordi kildene viser at Lofoten er tynn også i den ekte verden (`docs/systemer/fiskerimodellen.md`).

## Strøket 05.11.2026 (spilltest 3: F1–F7, U3, U5–U7, U9–U11, gren `ccr-9c21028c-lptg24`)

- F1–F7 og U3, U5, U6, U7, U9, U10, U11 fra `docs/playtest/rapport-3-redskap.md` er rettet (658bc77..3031f15, flettet inn og rullet ut 05.11.2026 etter Jonas' ja); hva og hvor står i `docs/systemer/rettelser.md`. U1, U2, U4, U8, U12 og K1–K3 venter på valgene i `docs/planer/spilltest3-valg.md`.
## Strøket 05.11.2026 (Ø6 funn 2–5 og 8–15, sikkerhetsgjennomgangen)

- **Funn 2–4** (068b7660, `supabase/migrations/20261105130000_guest_world.sql`, kjørt av Jonas): gjestenes landinger og fangst teller ikke i kvoten for åpen gruppe, markedet, cellene og sesongtoppen før kontoen er registrert, og `guest_merge` tar dem med; `land_put` avviser landinger foran den felles klokka, regner året selv og renser havn (med ÆØÅ for Østfold) og art. `sqltest`.
- **Funn 5 og 14** (acdaf0db, `20261105140000_liv_owned.sql`, kjørt av Jonas): butikken er stengt, aldri gratis, på spillets egne sider uten skyen (`pubHost()`); `pos_put` deler betalte malingsdesign bare når kontoen eier dem; `#seed` virker bare på en lokal testserver. `kjoptest`, `sqltest`, prøvd med detstorebla.no pekt til testserveren.
- **Funn 8–12 og 15** (656da4d2 og 8a36df67, `20261105150000_rydd.sql`, kjørt av Jonas): autofix-PR-er som viser til en tilbakemelding, venter på Jonas; tak på `tm_error` og `tm_perf` som vokser med de aktive spillerne, og på en hendelses data; en gjests kaiplass viker for en konto; delte fangstmerker uten haill; `anon` kan bare kjøre `sp_now`, `tm_error` og `tm_perf`; fire tabeller stengt; CSP i admin-siden; Caddyfile og `setup.sh` strammet inn. `sqltest` 133 OK, `sharetest`, `admintest`.

## Strøket 05.11.2026 (Ø6 funn 1 og 13, b5289877)

- **Lagret XSS i admin** (funn 1 i `docs/planer/sikkerhet-skyen.md`): `fbMeta` satte tilbakemeldingens `meta.pos` rett inn i HTML-en. Nå bare to endelige tall. Prøvd i Chromium mot admin i demo-modus: før rettingen kjørte skriptet, etter ikke; 800×1280 og 1280×800, ingen sidefeil. `sqltest` 127 OK med en ny sjekk av `pos`, `admintest` 4 OK. Databasen hadde ingen tilbakemelding med annet enn tall i `pos` (113 lest). Migreringen `20261105120000_fb_meta.sql`, som renser `pos` i `fb_send`, kjørte Jonas i SQL Editor samme kveld; bekreftet i databasen (ny kropp, `authenticated` kan kalle den, `anon` ikke).
- **Funn 13:** tittelen i `daily()` escapes, og agentens PR-lenker blir lenker bare til `https://github.com/`.

## Strøket 05.11.2026 (Ø2 Testriggen, `docs/planer/okter-etter-backloggen.md`)

Ø2 rettet testene, ikke spillet. Hver linje under er testens feil eller tid i testen; det som er spillets, står i 10.1 og 10.7.

- **`penshot` rød 28.10.2026 («GL errors» 1282):** kom ikke igjen. Testen skiller nå GL-feil fra starten og fra vimplene (`getError` gir den første siden forrige kall, fra alt som er tegnet); begge 0 og 4 OK i Ø2.
- **`maptest` var en tidsrace:** testen holder nå spillets `tick` for hele turen og spiller resten av `CATCH_LEFT` selv, slik `tick()` gjør; 5 OK. Bare i de 1,5 s pakken holdes tilbake slippes løkka (sammenslått 05.11.2026), så sjekken «klokka står mens pakken er borte» prøver `tick()` selv og ikke holder av seg selv.
- **`vessel3d` går ut på tid i `run.py`:** grensen er 4 500 s i `LONG` (rundt 60 minutter alene i skyen).
- **`drifttest` scenario 6 var ustabil:** `DT.run` stepper selv, men slapp løkka hvert 120. minutt, og spillets `tick()` spilte ekstra minutter etter veggklokka imens. Nå holder testen løkka (`TAB.held`) mens den stepper; 15 OK to ganger på rad. (Den gamle planen tas ut i Ø12 del 8, og testen med den.)
- **`quotatest` var rød på kvotesamarbeidet (`paid: False`):** testens feil. Kvotepartneren får betalt («… fikk 4 851 kr for torsken på kvoten hans»), men linja står nå femte fra slutten av leveringen (lotten, mannskapets replikk og ferskfisklinja kommer etter), og testen leste bare de tre siste. Nå leser den alle linjene fra leveringen; 17 OK. Ingenting å rette i `03d-quota.js` (planfila sa Ø10).
- **`turtest`, `selfcrew` og `driftsplan2test` S9:** turtest (27 OK) og selfcrew (18 OK) grønne to om gangen med frø. S9 var rød ved siden av en annen test (kg 1 393 mot 1 221) og grønn alene (62 OK, 0,3 % fra hverandre): den sammenligner en åpen kjøring med en lukket, og under last kommer simflisene inn mellom andre bilder. `driftsplan2test` går nå alene (`SOLO` i `run.py`). Om fangsten bør avhenge av når flisene kommer, står i 10.1.
- **`cloudtest` røde på grunnbygget (3 linjer):** testens feil. «nothing is sent» og «with the WorkOS token» falt på `sp_now`, sponsorlista som med vilje hentes uten konto (`ui/10r-sponsor.js`, M7 02.11.2026); «a server without the looks yet» fikk et ekstra `pos_put` med `lk` fra spillets egen `worldTick` ved siden av testens. Nå er `sp_now` unntatt, og flere kall med `lk` før det uten tåles; 33 OK. `pwatest` var rettet 04.11.
- **`cloudtest` rød én gang (to `save_put2`, 30.10.2026):** ikke sett igjen; trolig samme slags kappløp med spillets egne kall. Historikken (`run.py historikk`) teller den nå.
- **`driftsplan2ui`, `anchortest` og `fleet2test` var ustabile uten frø:** grønne med frø i parkjøringen 05.11.2026 (22, 9 og 16 OK). Følges i historikken.
- **`docktest` rød også alene (13 FEIL på viftene):** testen trykket på `#obGo` etter 1,5 s fast, og modalen «Båten etter far» ble liggende over dokka (`elementFromPoint` ga `#modal`). Nå starter den med `boot(pg)`; 96 OK. Det samme forklarer trolig «kan feile ved siden av en annen test» (30.10). Vifta ventes nå på (inntil 4 s) i stedet for 200–250 ms fast (sammenslått 05.11.2026), for «kan feile ved siden av en annen test».
- **`ordtest` var utdatert:** skrevet om mot oppdragene. Bestillingen tas under Bygd, Oppdrag i dokka (som `booktest`), leveres ved mottaket, en frist som går ut koster ry, og varmedressen kjøpes i Elektronikk og haler; 7 OK, i `LITE`.
- **`tabtest`, `crewwalk`, `boottest`, `fleet2test`, `streaktest` røde på `BrokenPipeError`/`ConnectionResetError`:** testserverens egen traceback når siden lastes på nytt mens en pakke er på vei. `_env.py` tier om dem nå; tabtest 17 OK.
- **`kjoptest` rød på «a cancelled payment» og tidsavbrudd i steg 2:** to kappløp. Oppstartens egen `shopStart` kunne svare «ikke klar» etter testens «klar», og toasten «Kjøpet ble avbrutt» ble byttet ut før testen så på den. Nå venter testen på oppstartens svar og samler alle toastene; 7 OK.
- **`synctest` «the tablet takes the game back by itself»** (rød i regresjonene 05.11, fra den andre Ø2-økta, `ccr-o2-tillegg`): telefonen hadde lagret etter at den tok spillet, så nettbrettet tar den lagringen, og `cloudTake` laster den med en omlasting av siden. Testen ventet 30 s uten å tåle omlastingen og var rød på `held: true, gate: true` med `active_name` riktig. Nå venter den inntil 120 s gjennom omlastingen og den nye starten. Alt OK.
- **`driftsplan2ui` «Hent redskapet»** (`ccr-o2-tillegg`): rød én gang i økta på det gamle bygget fordi juksingen går over timen sin mens karet er fullt og dekket står (40 min ved middag), så lina sto ikke i sjøen innen 720 steg. Fristen er nå 1 200 steg, og testen holder spillets løkke (`TAB.held`) som `drifttest`. 22 OK.
- **`teleport3d` på et bygg uten øyene** (`ccr-o2-tillegg`): steder uten fjernpakke i bygget gir `HOPP` i stedet for rødt (over, «`teleport3d` og `deckshot` i SwiftShader»).
- **`deckshot` kan kjøres for noen båter** (`KYST_DECK=…`, `ccr-o2-tillegg`) og skriver kranens stilling per scene; årsaken til den røde kranen står under «Spillarbeid som venter».
- **`run.py utenfor`** lister testskriptene som ikke står i noen liste (10.7).
- **Grensjekken i `/okt-slutt` punkt 5 ga sju falske treff:** `.claude/skills/okt-slutt/unmerged.py` ser nå på koden (linjene commiten la til, eller de nye navnene den innførte), ikke bare meldingen. 05.11.2026 gir den bare spilltest 3 (`ccr-9c21028c-lptg24`).
- **A5 historikk for ustabile tester** (`docs/planer/verktoy-fra-game-studios.md`): `run.py` skriver `tests/historikk.tsv`, i git med `merge=union`, så øktenes kjøringer blir tatt vare på og legges sammen ved fletting (sammenslått fra de to Ø2-øktene 05.11.2026), med om testen gikk ved siden av en annen og første røde linje. `python3 tests/run.py historikk` viser kjørt, røde, mønsteret, hvor mange av de røde som kom ved siden av en annen test, og «ustabil» bare når samme commit var både grønn og rød (`docs/systemer/testing.md`).
- **`gfxtest` «a camera that is not a number is sent once»** (sammenslått 05.11.2026): så lenge kameraet er NaN, står bildene nesten stille under SwiftShader (ett bilde på 118 s i en av kjøringene), så 30 s fast var ikke nok. NaN settes nå på nytt hver runde til spillet har sett det (`GFX.nan`), kameraet settes tilbake med en gang, og testen venter inntil 120 s og så 30 s til etter at kameraet er tilbake. Testen skriver hvor lang tid det tok. `cloudtest` slipper bare gjennom en `sp_now` uten token og uten innhold; en som bar spillerens token, ville telle.

## Strøket 05.11.2026 (PR #42 og de gamle PR-ene, Ø1 i `docs/planer/okter-etter-backloggen.md`)

- **Fire verft i Sverige** (10.1): de fire verftene ved Strømstad («Verft verft») er tatt ut av `steder.json`, og `steder.py` dropper steder sør for 59,2° N uten norsk poststed (ce056730). Unntakene i `soner.test.mjs` og `sonetest.py` er fjernet, `port-regions.json` skrevet på nytt. Ett verft uten poststed står igjen på Varangerhalvøya (i Norge) og heter «Verft verft».
- **Noen få leibiter i NPC-rutene skjærer et hjørne av land** (10.1): rettet i `tools/map/npc.py` (eb669fe7, `npc-trafikk.md` 4.16). Bygd fra spillpakkene: etapper over 25 m-masken Tromsø 13 → 0, Bergen 32 → 0, Bodø 29 → 1, Hammerfest 6 → 0. Kommer ut med neste kartrelease (Ø13); til da har pakkene de gamle leiene.
- **Hvite firkanter på sjøen bak de andre båtene på Adreno** (tilbakemelding #110 og #111): PR #42 (`fb/auto-2026-11-04-skum-nan`) er flettet inn etter Jonas' ja (5.20e i `vaer-og-hav.md`). Porten stoppet den 04.11.2026 fordi `f1test` og `gfxtest` var røde med rettingen. På arbeidsgrenen 05.11.2026 var `f1test` grønn med rettingen. `gfxtest` var rød én gang med rettingen og grønn én gang uten, og så grønn i begge byggene: meldingen «3D NaN i kameraet» kom etter et halvt sekund i begge. Sjekken er tidsavhengig (se 10.6). Skyggeleggerfila var ikke endret i arbeidsgrenen siden PR-økta kjørte `skytest`, `sea3d`, `lighttest`, `dbg23o`, `wetshot` og `sunshot`, så de er ikke kjørt på nytt. **Må ses:** kjølvannet bak de andre båtene på et Adreno-nettbrett; PR-økta så et lyst, rett avgrenset bånd bak båten i SwiftShader i stående format.
- PR #18 (lav grafikk høyst rundt full HD) og #19 (tredje og fjerde mann ved linehaleren) er lukket etter Jonas' valg 05.11.2026. De endret `view3d.js` og `05-phone.js`, som ble delt 26.10.2026. PR #33 er lukket fordi innholdet alt var i arbeidsgrenen.

## Strøket 05.11.2026 (havsteget H2b, gren `ccr-99204901-f1vpx2`, rullet ut i d5d6b4c)

- Krokbytte om bord (fra H2a-lista): mannskapet bytter om lag 5 % av bruket i døgnet idet lina kommer inn (4d67201, 0f1e8ee).
- Frysebåtene landet i kar på 300 kg (10.1, over 1 300 løft for en full båt): de lander nå på paller på om lag 1 t, 10 t i timen (4d67201). RSW-båtene står igjen i 10.1.
- Havlandingene i lukket gruppes lotteoppgjør med enkeltfolk: havbåten har nå to anonyme skift som deler etter § 6 (640bd64).

## Strøket 05.11.2026 (havsteget H2a, h2-autoline)

- En setting som ble stoppet halvveis (`gopAbort`), mistet det som ikke var satt ennå: stamper, garn eller teiner og agnet. Nå kommer det om bord igjen (`gearUnset`).
- `vesseltest` «no code branches on a vessel type name» (arten snøkrabbe, `sp === 'snokrabbe'`): testen skiller nå arten fra båttypen.

## Strøket 05.11.2026 (havsteget H1b R8, h1b-r8, rullet ut 05.11.2026)

- Autonav fant ingen rute fra Tromsø til Isfjorden utenom mars–mai, og ingen fra Bergen til havet vest for Shetland (`lnetExit`, 4.12h i `autonav.md`).
- Rutepanelet sa ikke fra når dieselen rakk ut til havs, men ikke tilbake (4.12i).
- Kuling langt ute: den første kaia med rute ble tatt, ikke den korteste (Sentralbanken 481 → 319 nm).
- Kompasslinja i stående format: tallene løp inn i hverandre (4.11n i `3d-verden.md`).
- Kuling langt til havs: båtene løp opptil 676 nm til nærmeste kai; nå ligger havfartøyene og båtene langt fra kai bi (Jonas: «Mange av de større havfiskebåtene er laget for å kunne være ute i orkan … du får ta en vurdering»; 4.12j).
- towtest: slep ved Svalbard fra Tromsø; nå Kystvakten fra Longyearbyen (Jonas).
- «3D ved store γ og k» fra planens kap. 5: prøvd i R8 (havshot), ingen feil (4.11n).

## Strøket 05.11.2026 (Driftsplan 2: U11 og U4, gren `ccr-3d7eb5bf-vgz41n`)
- U11: din egen hvile på planen startet ikke av seg selv ved rorbu eller naust, og avgangen ventet på «Hvil i naustet …» også mens spillet var lukket (0ff92d4). U4: Pause lot båten fiske videre og viste «I dag ←» (71d32f0). Testet med `driftsplan2test` (S1–S19 og S9 grønne), `driftsplan2ui`, `driftsplan2gui` (95 OK; de 4 røde er U6 og U7) og enhetstestene (1031 OK), bare rundt Senja.

## Strøket 05.11.2026 (Driftsplan 2: valgene etter GUI-gjennomgangen, gren `ccr-5e1ba2f4-pusvyd`)
- U9 (start uten blåsesett), U13 (grunnene som veier), U1, U7, U6, P1, P2, Pause ankrer der det går, U8, U14, P7, U2, U3, U5, U10, U12, P3, P4, P5 og P6. Testet med `driftsplan2gui` (99 OK; S16 rød på naustet i Finnsnes, rettet og grønn alene), `driftsplan2test` (62 OK), `driftsplan2ui` (22 OK), `driftsplan2map`, `worktest`, `dockrow`, `navbarshot`, `uishots` og enhetstestene (1063 OK), bare rundt Senja.

## Strøket 05.11.2026 (Driftsplan 2: GUI-gjennomgangen, F1–F7, gren `ccr-3d7eb5bf-vgz41n`)
- F2: dagdrift med rorbu som hjem gikk ut igjen hvert kvarter hele natta (cda7ca73). F7: negative timer og «i kveld» om en trekking neste morgen i dagen (1ab22044). F1: «Til Mannskap-siden» ble stående på Driftsplan (19e5c83e). F3 og F4: fangstlista og dokka over skuffen (3e2985b1). F5 og F6: «Tøff» over båtens grense og norske ord i den engelske utgaven (2163b9ab). Testet med `driftsplan2gui` (94 OK; de 4 røde er U6 og U7), `driftsplan2test` (58 OK), `driftsplan2ui` (19 OK), `driftsplan2map` (10 OK), `dockrow`, `navbarshot`, `uishots` og enhetstestene (1026 OK), bare rundt Senja.

## Strøket 05.11.2026 (havsteget H1b R7, h1b-r7, rullet ut 05.11.2026)
- **Autonav over en holme på Sunnmøre** (CI «Autonav langs hele kysten» rød etter utrullingen av R6 og R7, paret mM416 → mM2187): `legRuns` leser nå `isLand` på det åpne havet (4.12g i `autonav.md`). Alle 301 parene grønne lokalt; Tromsø–Isfjorden 3,4 s mot 2,9 s uten rettingen, her i skyen.
- **`routetest` rød siden R6:** testen leste havrutene (`hav` i `routes.json`) som en tegnet rute. Rettet i testen; 43 OK.
- **Ingen havn, verft eller butikk på Svalbard:** Longyearbyen har nå verft (diesel) og utstyrsbutikk etter regelen i `docs/handelssteder.md`, havna har ledige plasser, og mannskapet flyr til og fra Tromsø med billett og reisetid (`lybtest`).
- **Kuling ved Svalbard sendte båten hele veien tilbake til fastlandet:** nærmeste kai er nå i Longyearbyen.

## Strøket 05.11.2026 (havsteget H1b R6, h1b-r6, rullet ut 05.11.2026 med R7)
- **Autonav over åpent hav var svært treg** (funnet under R5): 80 km nord for Finnmark tok 2,3 s og 400 km 8,8 s for ett rett strekk; nå 0,1 og 0,3 s (4.12g i `autonav.md`).
- **Isen gjaldt ikke NPC-havflåten**: nå stenger den felt og leia går rundt (4.17b i `npc-trafikk.md`).
- **NPC-havflåten regnet 14 av 164 felt som borte**: nå ingen (192 feltpunkter).
- `havflaate.py` leste GEBCO-dybden (`deep`, `u8p` fra R2) som rene bytes; nå gjennom `pack.read_layer`.

## Strøket 04.11.2026 (3D-nivået og porten, PR #44 og #45)
- Auto senker 3D-nivået på en enhet som har tapt konteksten, krasjet eller hengt i 3D (Jonas: «3d nivå skal senkes automatisk om det må det»), PR #45, `qdowntest`.
- Porten for automatiske rettinger (`tools/autofix/gate.py`) teller ikke lenger rettingens egne skjermbilder i `docs/pr/<gren>/` som 1998 linjer (Jonas: «porten for automatiske rettinger skal slippe gjennom skjermbilder»), PR #44.

## Strøket 04.11.2026 (havsteget H1b R5, ccr-h1b-r5-is, rullet ut d008df9)

- `klima.yml` og `tidevann.yml` har fått vakten mot gjentatte releaser (`tools/ci/seen.py`), som `is.yml` og `dybde.yml`. Utrullingen av R5 startet dem på nytt og lager `klima-9` og `tide-9`, som ikke brukes (`src/data` har `klima-8` og `tide-8`); den neste kjøringen lager én release med merket, og deretter stopper de.

## Strøket 04.11.2026 (båtnavnet, ccr-bf5ccf26-rci1bj)

- Båtnavnet i en stygg skrift og tilsynelatende tilfeldig plassert, over registreringsmerket på trebåten: nå i blokkbokstaver på styrhustakets kant foran og på hekken med hjemmehavnen under, svart eller hvitt etter kontrasten, aldri i baugen (`baater.md` 4.23, `tests/unit/navn.test.mjs`).

## Strøket 04.11.2026 (fiskekar på dekk, `docs/planer/fiskekar-dekk.md`)

- Båtene uten lasterom hadde ett lite kar for hele kapasiteten (snekka) eller ingen (trebåten). Fyllingen hoppet i lag på seks, isen gikk gjennom karveggen nede, og fisken var like lang uansett art. Karene forsvant fra dekk når lossingen startet. Nå: hvite kar på 500 kg etter kapasiteten, fisk for fisk uten clipping, og karene løftes i land med stropp.
- Iskassa dukket opp ved pakkeren når han begynte å ise. Nå står den fast på dekk.
- Bløggekaret sto tvers over båten fra sløyebordet, og på skiffen og trebåten sto fiskeren inne i det. Fisken i det lå utenfor karveggen. Nå står det ved bordet, og fisken ligger i blodvannet i karets mål.

### Nytt 04.11.2026
- Ingen figur om bord hekter stroppen på karet ved lossing (krokene trekkes ut til hjørnene mens kroken senkes). Ikke målt at folkene aldri kommer borti karene i alle stillinger.
- `turtest` (rutetavla på liten tank) var rød én gang og grønn ved ny kjøring. Den avhenger trolig av klokka.

## Strøket 04.11.2026 (havsteget H1b R3, ccr-h1b-r3-svalbard, rullet ut d75e7b4)

- `kart.yml` og `gebco.yml` startet når en sammenslåing i arbeidsgrenen endret filene deres (10.7): `tools/ci/seen.py` stopper nå en kjøring når releasen alt er laget av de samme filene (`kart.yml`, `gebco.yml`, `s2.yml`, `dybde.yml`, `sjomerker.yml`; 4.9d).
- Bakken på Svalbard, Bjørnøya, Hopen og Jan Mayen var grønn som på fastlandet (10.3): satellittfargen og arealdekket (4.9d).

## Strøket 03.11.2026 (havsteget H1b R1, ccr-f23363d4-rx3fvy, rullet ut 04.11.2026 sammen med R2)

- `harbourtest` rød på Finnsnes: testen forventet båten en halv bredde fra den gamle kaifronten, men kaia bygges ut til båten (`quayOut`). Testen er rettet (80a772e).
- `vesseltest` rød på `03d-quota.js:301`: `sp === 'snokrabbe'` sammenlignet en art med samme navn som en båttype. Det er nå et oppslag i tabellen `HAVF_SP` (6e116a2).
- `sidetab` rød i liggende format: lista ble målt mens den fortsatt gled ut. Testen venter nå til den står stille (943aa46).
- `autonavtest`, `npctest` og `havflaate` er grønne med hele kysten (kart-28). De er bare røde uten den, som `testing.md` sier.

## Strøket 04.11.2026 (Autonav gjennom land ved Tufjord)

- Laget på `ccr-664fd66b-ftggff` (4c1c9379) og aldri flettet inn; flettet inn i arbeidsgrenen 05.11.2026 i Ø1 (8f503066). Isen i `leiaRoute` (havsteget H1b) følger nå `LEIA_RUN` som tidevannskreditten. Stikkprøve etter flettingen (veien inn, nærmeste avstand til land mer enn 120 m fra havnepunktet): Tufjord 22–25 m, Kristiansand 28–134 m, Bergen 24–100 m, Bodø 23–25 m, Hammerfest 41–75 m, Båtsfjord 85–113 m; en rute mellom to havner på hvert sted uten land, nærmeste avstand inne i havnene 16–49 m (Bergen verft–Florvåg verft 16 m, havnas egne punkter).

- Båten seilte i 3D oppå fjæra på vei inn til Tufjord (video fra Jonas): havnas vei inn (`approachPath`) gikk 1 m fra kystlinja. Nå holder veien inn seg ut fra land der det er plass, og utrettingen og strammingen holder 20 m fra land inne i havnene (`docs/systemer/autonav.md` 4.12k). Over alle 372 havnene: under 5 m fra land 111 → 3 havner, 0,95 % lengre veier inn, ingen havn mistet veien.
- Tidevannskreditten (og frisonene for hindringene) ble liggende igjen etter to Autonav-ruter som overlappet (`LEIA_RUN`, `autonavtest` 9a).
- `harbourtest` var rød på «every coastal vessel type lies alongside each quay face» (Finnsnes-kaia) da rettingen ble laget 04.11.2026. Etter flettingen 05.11.2026 er den grønn (11 OK); rettingen av testen (80a772e) kom inn i mellomtiden.

## Strøket 03.11.2026 (havflåten og havsteget H0, ccr-6829f3d4-kl3gp4, rullet ut 595de50)

- Nota og snurrevaden i 3D for havflåten (ad65c37), levering ved mottaket som tar fangsten (50ba30a, 836aafa), garnet og lina under vann (3064ac9), havfiskefartøyene jukser ikke (08125db).
- Havsteget H0: mottakene for havbåtene, prisene for havartene og sjøfryst fisk, havmottak i Rypefjord og Fiskarstrand øst (08d8f20, 3899559, 4f5fa88).

## Strøket 03.11.2026 (hakking, tilbakemelding #106-#109)

- **Hakking ved høy bildefrekvens** (#106): bildeklokka `frameClock` og `WALLF`/`wallNow` er inne igjen (`view3d/24-cinema.js`, `core/01-world.js`). Skumfeilen fra 02.11 var det første bildet etter at 3D vises eller slippes (`show`, `hold`): det ble målt fra kallet rett før, en brøkdel av et millisekund, og snittet `FPS.v` startet på tusenvis og brukte et minutt på å komme ned under SwiftShader. Første bilde teller nå som 1/60 s (`lastF = 0`). `#rawclock` satte `WALLF` på feil skala (uten `FCLK.off`), nå står den av der. Skum ved 21/30 m/s: 10,2/46,0 % mot 8,0/48,5 % på grunngrenen (samme måling). Ikke prøvd i ekte Firefox på 240 Hz.
- **Firefox og Opera på Android hakker** (#107-#109, 27-35 fps også på 3D-nivå 0): et kort på innlastingen anbefaler Chrome eller appen fra Chrome (`BRWTIP` i `ui/10p-install.js`, én gang i døgnet, `#brwtip` viser det overalt). Følg med på `brwtip_show`/`brwtip_go` og bildetakten for `opera`/`firefox` i telemetrien.

## Strøket 03.11.2026 (Oppdrag 2: K2 Kystkartet og U1 Ukas fangst)

- K2 Kystkartet bygd: fanen i Milepæler, laget i sjøkartet (av som standard, går av ved rute og 3D, Jonas: «Det blir bare støy») og trinnene i `ACHL` (5.58 i `samlinger-og-kultur.md`).
- U1 Ukas fangst bygd: søndagskortet, bildet, Sesong-appen og pushen søndag kveld (5.59 i `haill-pub-og-bonus.md`).
- Røde i `run.py changed` som ikke kommer av endringene: `autonavtest`, `npctest`, `etikett`, `vectest` og `routetest` krever hele kysten i `tools/map/out/game` (finnes ikke i økt-containeren); `sidetab` («land a tap slides the list off») var rød også før; `charttest` er tegnetiden over.
- Måles: `uke_card` og `uke_share` (andel som deler), og om pushen søndag 19:00 åpnes oftere enn mandagspushen gjorde.

## Strøket 02.11.2026 (lasteskjermen)

- Kortene («Båten etter far», «Mens du var borte») og meldingene (kystradioen, folk på land, «Laster 3D-terreng …») kom opp oppå «Laster kysten …». Nå venter de til lasteskjermen er borte (`loaderGone`, `body.booting`).

## Strøket 01.11.2026 (tilbakemelding #106 og kartplotteren)

- **Havet nær båten glatt på Windows** (#106): mellomsjøen på nivå 1 (`docs/systemer/vaer-og-hav.md`). Står igjen: ikke prøvd på ekte Direct3D; følg med på «3D mellomsjø feilet» i feilloggen.
- **Kartplotteren uten kart til spilleren zoomet ut**: `chartCompose` tegner foreløpige fliser på nytt når pakkene er inne, uansett hvordan de kom (`docs/systemer/kartplotter.md`).

## Strøket 01.11.2026 (tilbakemelding #105, hendene)

- **Mannskapets hender var speilvendt** (tilbakemelding #105): tomlene pekte utover på rekka. Rettet i `handMeshes` ved å bytte `hL_`/`hR_` (se `docs/systemer/folk-om-bord.md`). Står igjen: `tools/harbour/hender.py` bør få tommelen på −x på høyre hånd neste gang hendene bygges i Blender, og byttet tas bort samtidig.

## Strøket 01.11.2026 (L1, båtene ved ekte kaier, b3fd4d0 og b0b0135)

- **NPC-båtene lå i fjæra og på strandskråningen** (Jonas' bilder fra Finnsnes 01.11.2026; Senja-flåten uten graving, kystflåten med `npcPits`): en båt ligger bare ved en kai som står i 3D (`quayReal`), flytebrygge og bøye bare under 11 m og bare inne i havna, enhetenes kai åpen utenom plassene (`faceReserved`), og båter uten plass vises ikke i havn. `npc-trafikk.md` 4.16b-L1. Målt i Finnsnes, Tromsø, Bodø, Bergen og Båtsfjord.
- **`unitNear` på 60 m rundt enhetens midtpunkt** holdt hele mottakskaia fri for NPC-båter; nå bare blokka, bassenget og de to plassene (`unitHit`).

## Strøket 30.10.2026 (målingen av oppdragene, sesongflyttingen i etapper)

- **Sesongene var bare nyheter** (gap-analysen punkt 7, A2): felles tavle per hendelse med `ev_top`, landinger merket med hendelsen, merke og premie ved avslutning (`EVENTS` i `09c-seasons.js`, `evTop`/`evCloseTick` i `10h-world.js`, kortet i `06d-season-folk.js`). `eventtest`.
- **Oppdragene var alene** (gap-analysen 3.5): andres spørsmål om slep står som kort øverst på tavla med «Hjelp» (`turAskCards` i `05f-turer.js`, `pttake`/`ptgo`/`ptdrop` i `14-act.js`). `ptowtest`.
- **Ingenting skjedde underveis i oppdragene** (gap-analysen 3.2): ett middels eller langt oppdrag får én hendelse fra simuleringen (mottaket ringer etter mer, tips på VHF fra fiskemodellen, varselet skjerpet med havnetid som ikke teller) (`turEventRoll`, `turEventFire` i `09g-turer.js`). `turtest` sjekk 17.
- **Oppdragene uten avsender og hukommelse** (gap-analysen 3.1): bestillingene kommer fra bestyreren på mottaket, som sier noe når de tas og leveres og husker hvor mange, og fra tredje legger hun ei bestilling til båten (`turManager`, `turManagerSays`, `turAsk` i `09g-turer.js`). `turtest` sjekk 16.
- **Terskelen inn på oppdragene** (4 av 14, «turte ikke», gap-analysen 3.3): det første oppdraget legges klart etter første levering, litt post til nabohavna med ei uke på seg og ingenting tapt om den går ut (`turFirst` i `09g-turer.js`, kortet i `05f-turer.js`, drypp i `07c-handbook.js`). `turtest` sjekk 15. Les av i hendelsene: andel med `tur_take first` som tar et oppdrag til innen sju dager.
- **Sesongflyttingen gikk ut på tid uten utfall** (7 av 11, gap-analysen 3.4): nå tre etapper med en tredel av belønningen hver, det betalte beholdes når uka er ute, og oppdraget står som «delvis» (`turStages`, `turSesongStage` i `09g-turer.js`, kortet i `05f-turer.js`). `turtest` sjekk 6 utvidet.

- **Oppdragshendelsene kunne ikke skilles** (gap-analysen punkt 3.7): `tur_fail` sa ikke om oppdraget ble gitt fra seg eller gikk ut på tid, tavla sett ble ikke målt, og et `tur_take` kunne ikke kobles til sitt `tur_done`. Nå `tur_show`, `id`, `allow`, `frac` og `how` (`09g-turer.js`, `05f-turer.js`), og admin-tabellen viser dem (`20261030120000_tur_how.sql`, må kjøres). `turtest` sjekk 14. Grenen `claude/quest-mechanics-engagement-u12mlw`.

## Strøket 28.10.2026 (skatten for AS med forskudd fra før terminene)

- **CapteinAdrian ble trukket 795 941 kr i forskuddsskatt** (67 226 kr 1. april og 728 715 kr 1. juli i spillåret 2027) etter reglene før 27.10.2026: 22 % AS-skatt av 3,62 millioner kroner i overskudd så langt i året. Regnestykket var riktig etter de gamle reglene. Gjennomgangen fant en feil i de nye: forskuddet et AS hadde betalt før terminene, ble ikke regnet med ved årsskiftet, så selskapet ville betalt årets skatt én gang til i februar og april, og skattekontoen satte av for mye. Rettet i `txClose`, `taxOwed`, selskapets terminer og `taxPlan`; `skattetest` har tilfellet.
- **Gjennomgangen av ENK-fasen og overgangen til AS** (Jonas: «Om noe er urealistisk eller feil må vi gjøre opp for oss»): fire feil rettet, og ett oppgjør. (1) Stiftelsen delte året; en skattefri omdanning virker fra 1. januar, så hele året er nå selskapets, og ENK-forskuddet regnes med. (2) Dager på fiske telte bare båter ute ved midnatt; nå teller hver dag du er ute, og årets leveringsdager legges til. (3) Båtenes skattemessige verdi var 70 % av prisen; nå hele prisen (kvoten er utenfor), og gamle verdier løftes. (4) Skjermingsfradraget for ENK trakk ikke fra gjelden; nå gjør det det, og rentene på gjelden over eiendelene legges tilbake i personinntekten. Oppgjøret (`taxFix`): AS som fikk forskuddet trukket i inntektsåret etter de gamle reglene, får rentegodtgjørelse (3,5 % fra trekkdato til 15. mars året etter); CapteinAdrian får rundt 20 000 kr. Beløpet for 2027 var riktig: med virkning fra 1. januar er 22 % av hele årets overskudd selskapets skatt. Dagene på fiske (2) og skjermingen (4) gjelder ikke et AS. Den større avskrivningen (3) får han automatisk, fordi 2027 ikke er avsluttet ennå; oppgjøret 20. oktober 2028 betaler tilbake det han har betalt for mye. `skattetest` har alle.

## Strøket 27.10.2026 (Driftsplan 2, 7f817c3)

Revisjonens funn (`docs/planer/driftsplan-2/01-revisjon.md`) er løst med den nye planen: planen uten dag («Neste tur» som ikke stemte med det som skjedde), motoren som improviserte med feil konstanter og søkte asynkront i `catchUp` («Grunt vann forut», tre feil og stopp), siden som viste noe annet enn motoren gjorde, plassvalget som ble avbrutt av en ny tegning av siden (#95), ståtida som ikke ble holdt, den sovende vakta som ble regnet som i land («Rune har fri, så båten venter»), og statistikken uten dag og mottak. Alt sammen i `core/06g-plan2.js`, `core/06h-plan2-engine.js`, `ui/05d-plan2.js` og `ui/03g-planmap.js`; `docs/systemer/driftsplan.md` «Driftsplan 2» del 1–7.

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
- **kinotest** (rakk 2 av 5 opptakstyper, 29.10.2026): testen venter nå på at opptaksnummeret skifter (inntil 10 s) og leser regiens egen logg (`G3._debug.kinoLog`); med den nye regien 01.11.2026 gikk den gjennom 33 opptak og 10 slag i SwiftShader, alle sjekker OK.

## Strøket 24.10.2026 (løst eller foreldet)

Rettet 24.10.2026 etter gjennomgangen: Senja-flåtens skrog på land ved kaia (`hullDry` i `npcBerths`, Finnsnes hadde to), like havnenavn (`havnLocal` deler ut navnene blant havnene innen 6 km, også reservenavnene etter stedet), starthavna som sluttpunkt (`portByLabel`, og en havn nærmere enn et veipunkt tar trykket i `routeGrab`), driftsplanen uten adgang til torskefisket (varsel med råd om kveiteutstyr i `driftCheck`), utstyret ved båtbytte (merknad i tilbudet og linje i loggen, `swapLeaves`), klærne og kulden (`coldPen` regner med dem om bord), NPC-båtene på strandskråningen i 3D (`npcPits`, 4.16c), NPC-båtenes vei fra kaiplassen til havnemunningen (`coastWay` i `05-vessels.js`: rett der streken er fri for brygger, flytebrygger, merker og land, ellers rett ut fra kaia 25 eller 60 m først, ellers gjennom vannrutene i 25 m-masken (`coastCells`) og rettet ut der bitene er frie, og bare en vei som er fri hele veien; i Tromsø, Bergen, Bodø og Båtsfjord gikk de blokkerte strekene fra 16 til 3, lengste omvei 2,75 ganger den rette), kameraet inn i andre båter (`camFree` sjekker båtene som tegnes nær, `npcNow`, som bokser langs kursen), fartsglideren som fanget sveip (Chromium flytter glideren til fingeren allerede ved berøringen og sender `pointercancel` når sveipet blir rulling; da får glideren verdien tilbake, `rangeTouch` i `08-actions.js`, `slidertest.py`; `pressHold` slippes nå også ved `pointercancel`, så panelet ikke står stille etter en rulling).

Kino-visningen (d0fdfc2) og ristingen i bro-visningen (dc1a5a6, 5.40) fra 04.10; hviletiden i hele timer (regelen fjernet 11.10); kveithaill (fjernet 04.10); fraværsfangsten før dybdedataene (5448b5a, 02.10); bare skiffen med konsoll i 3D (varmen og ekkoloddet vises i det lille kartet for alle båter); sonarens monteringstid (alle verftsjobber tar `YARD_H`); sekkeis på driftsplanen (isen fylles på mottaket); drivstoff i Finnsnes (diesel ved butikk og verft, `docs/handelssteder.md`); § 32 og grunnlinja (håndheves fra R2, 04.10, `03e-rules.js`); minsteprisene etter 21.09 (rundskriv 13/2026, kontrollert); G (136 549 kr fra 1. mai 2026); sertifikatene i Sjømann (fjernet 09.10); heattest-målingen (besto 21.10 med 1,0 s); tester som sovner; dobbel kyst i kartplotteren (4.19); artifacten uten vec (artifacten oppdateres ikke lenger, appen har alltid vec; testbygget `dist/` har ikke vec, bare `npctest`, `havntest` og `vectest` bygger `dist-vec/`).
- 12.11.2026 (steg 89 OB11 runde 3, Jonas' økt, `claude/ob11-r3-breisjark`): **`vesseltest` rød etter HS3** lukket: sjekken «a bigger engine helps the sjark …» venter nå at skiffen tar trim som alle båter (Jonas 11.11.2026: «Trim-boost skal fungere på alle båter …») og fortsatt ikke større motor; rød før rettingen (`'skiff': (24, 24, 48, 24)`), grønn etter.
- 12.11.2026 (steg 89 OB11 runde 3): **`worktest` rød** («asleep the screen is black with a countdown …») lukket: alene og sovende til sjøs tar brovaktsalarmen skjermen («Trykk ACK for å kvittere») før testen leste nedtellingen; testen leser nå nedtellingen når han sovner og godtar alarmen etterpå. Spillet var riktig. Rød før, grønn etter.
