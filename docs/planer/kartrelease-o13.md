# Ø13: ny kartrelease (plan, 11.11.2026)

Steg 33 i `docs/planer/koen.md`. Skrevet med `/planlegg` i Jonas' økt (grenen `ccr-28562daf-g7h9ca`). Ingenting er bygd, og ingen release er startet. Planen stopper ved valgene i kapittel 9 (valg 35 i køen).

## 1. Bestillingen

- Øktplanen (`docs/planer/okter-etter-backloggen.md`, Ø13): det som mangler av G8 (`hgt10`) og G10 (strendene, tangen på skjærene, stupene), ti punkter fra backloggen 10.3 og to fra 10.5, «`/planlegg` først. Bare én kartrelease om gangen».
- Jonas 28.10.2026 om grafikken (`grafikk-natur-og-miljo.md`): «Grafisk overhaling av natur, miljø og omgivelser. Mål: høyest mulig nivå av realisme», og «Kjør på med det du mener er fysisk mulig å få til innenfor prosjektets rammer og potensielle begrensninger.»
- Jonas 05.10.2026 om sjømerkene: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av norge ha også.»
- Ø15 (NPC-flåten) venter på Ø13 fordi N3 og N5 var tenkt som nye vec-lag (`ferry`, `lanes`), og Ø11.8 lar gale sjømerker rettes «i kartreleasen».

## 2. Slik er det i dag (sjekket 11.11.2026)

- **Releasen bygget tar,** er `kart-31` (04.11.2026), pinnet i `tools/map/kart-release.json`. `kart-33` og `kart-34` finnes også, men er laget fra eldre grener samme dag (168 fliser, uten øyene) og brukes ikke. «Den nyeste» er altså ikke den riktige; pinnen gjelder. Neste nummer settes av kjøringen og kan ikke velges.
- **`kart-31` per pakkeslag** (summert fra releasens `manifest.json` i denne økta): 266 fliser, 1 064 pakker, 510,7 MB.

  | Slag | Pakker | MB | Median per flis | Største |
  |---|---|---|---|---|
  | `view` (høyde 25 m, skog, arealdekke, satellittfarge, trær) | 266 | 295,3 | 0,97 | 2,71 |
  | `sim` (maske 25 m, avstand, dybde 50 m) | 266 | 126,1 | 0,53 | 1,12 |
  | `vec` (bygg, veier, bruer, kaier, ferskvann, strender og stup, NPC) | 266 | 79,3 | | |
  | `chart` (kyst, navn, sjømerker) | 266 | 10,0 | | |

  I tillegg kjernen 4,70 MB og `chart0` 0,58 MB (i git, `src/data/map`), og far-pakkene 13 MB for 724 fliser (`kart-ramme.tar.gz`). Bygget med hele kysten er 455 MB kart (535 MB med vec-pakkene, som appen har). Av vec-lagene er ferskvannet størst: 53,6 MB rått av 99,7.
- **Kjøretiden:** `kart-31` tok 45 minutter i alt (`national` 8,5, flisene rundt 16 i tolv deler side om side, `ramme` 13,4, `pack` 19,4). Taket er 6 timer per jobb (`timeout-minutes` er 120 og 240 i workflowen). Det er langt unna.
- **Første oppstart** (Chromium, 20 Mbit/s, CPU 4×, målt 04.11.2026 med `kart-29`): 80,3 MB i alt, hvorav kartet 6,88 MB. Modellene er det meste. En spiller laster kjernen og pakkene rundt båten, ikke kysten.
- **Sjømerkene er ikke en del av `kart-N`.** De er en egen release (`sjomerker-7`, `sjomerker.yml`, noen minutter), og `game.py` legger dem i sjøkartpakkene når bygget settes sammen. Å rette sjømerker trenger derfor ikke `kart.yml`.
- **Det samme gjelder mye annet som er «kartdata»:** flytebryggene, småbåthavnene, vindturbinene, leinettet, strømmen, stedene og mottakene er egne filer i `src/data/`, laget fra den pinnede releasen. De må lages på nytt når `kart-N` endres (`docs/systemer/datarorledninger.md`). Det er den største kostnaden ved en full ny release, ikke timene i Actions.
- **G10 er lenger enn planen og øktplanen sier.** Strendene og rullesteinsfjærene kom i `kart-16` og stupene i fjæra i `kart-18` (`tools/map/shore.py`, laget `shore`, `view3d/17h-shore.js`; `3d-verden.md` 4.11l), og tangen og ruren følger eksponeringen i `terFS`. Statuslinja «G10 delvis … ikke strendene, skjærenes tang og stupene» (29.10.2026) er gammel. Det som står igjen, er skjærene: de 98 056 punktene fra OpenStreetMap (`seamark:type=rock`) brukes av grunnstøtingen, Autonav og kartplotteren, men ingen fil i `src/js/view3d/` leser dem (søkt med `grep` etter `rocksIn` og `marksNear('rocks'`). En spiller kan altså gå på et skjær som ikke synes i 3D. Det trenger ingen kartdata, bare tegning.
- **G8:** tuer, lyng, ur og tang er bygd (4.11j). `hgt10` er ikke bygd. Bakken leses fra Terrarium z13 (Kartverkets 10 m-terreng, 5–8 m per piksel her) innen 3 km fra sjøen, men bare hver fjerde piksel lagres (25 m).
- **Gammel side og ny release:** pakkene har hashen i navnet, og `deploy.yml` laster opp med `rsync --delete-after`. En pakke som ikke lenger står i manifestet, er borte fra serveren etter utrullingen. En spiller med gammel side i minnet som seiler inn i en ny flis, får da 404 (fem forsøk i `mapLoad`, så feil), til stripa «En ny versjon av spillet er klar» kommer (`UPDATE` spør `version.json` hvert tiende minutt). Det har vært slik ved hver release til nå; det er ikke prøvd i en test.

## 3. Hovedgrepet: tillegg til `kart-31`, ikke en ny `kart-N`

Gjennomgangen av punktene (kapittel 4) viser at nesten ingenting av det Ø13 skulle ta, trenger at `kart.yml` kjøres på nytt:

| Det som skulle inn | Trenger `kart.yml`? | Slik planen tar det |
|---|---|---|
| `hgt10` langs sjøen (G8) | Nei, om det legges i et eget pakkeslag | egen release `fin-N`, satt sammen med `kart-31` av `game.py`, slik sjømerkene blir |
| Skjærene i 3D (G10-resten) | Nei | tegning fra dataene som alt er i sjøkartpakkene |
| Sjømerkene (IALA, Bjørnøya, Jan Mayen) | Nei | `sjomerker-8` |
| `ferry` (N3) og `lanes` (N5) | Nei, om de er egne datafiler | `src/data/ferje.json` og `leier.json` fra egne workflower, som `leinett.json` og `vind.json` |
| Svalbards bakke og breer, utenlandsk bakke, kjernens størrelse, `expo2k`, `land1k`, 2 550 m, GEBCO fra CEDA | Ja (eller `ramme`-jobben) | utsettes, kapittel 4 |

Anbefalingen er derfor at Ø13 ikke lager `kart-N+1` nå. Grunnene:

- **Ingen pakke som finnes, endres.** `sim`, `view`, `chart` og `vec` beholder hashene sine. Spillerne henter ingenting på nytt, lagringene møter den samme masken og dybden, og en gammel side får ingen 404 av `fin-N` (den kjenner bare de gamle pakkene, som står der).
- **Ingen avledede data må lages på nytt** (leinettet bakt mot kartet, strømmen, stedene, mottakenes kaier, flytebryggene, småbåthavnene, vindturbinene), og `autonav.yml` mellom alle mottakspar trengs ikke.
- **Rørledningen er ikke helt bestemt** (`kart-29` mot `kart-28`: 2–9 celler forskjellig i 8 av 672 pakker, årsaken ikke funnet). En full kjøring ville gitt simuleringen nye dybder noen steder uten at noen ba om det. Med tillegg rører vi ikke det.
- **Tilbakeveien er én linje:** ta `fin` ut av `kart-release.json`, og bygget er som i dag. Spillet må uansett virke uten `fin`-pakkene (Lav og Middels laster dem ikke).
- **Ø15 slipper å vente.** Ferjene går på tvers av flisene (Bodø–Moskenes er 100 km), og NPC-trafikken regnes bare innen AIS-rekkevidden, så et lag per flis passer dårligere enn én liten fil for landet. Leinettet, som er samme slags data, er 102 kB.

En full `kart-N+1` kommer når havsteget trenger den (kapittel 4, «Utsatt»), og da som én release med alt det utsatte.

## 4. Punkt for punkt

Hvert punkt fra startmeldingen, sjekket mot backloggen og koden 11.11.2026.

### Med nå

| # | Punkt | Status i dag | Hva det krever | Kilde og lisens | Vokser |
|---|---|---|---|---|---|
| 1 | **`hgt10`** (G8) | ikke bygd | nytt `tools/map/fin.py` (leser Terrarium z13 tettere enn i dag; fortegnet fra vektorkysten på 3 m, som gjelder for land og sjø i spillet, 4.19), ny workflow `fin.yml` med `fin.json`, `game.py` og `release.py` (pinnen `fin`), lasteren og 3D (fase K1) | Terrarium (Mapzens terrengfliser på AWS, i Norge Kartverkets DTM 10, CC BY 4.0), samme kilde som i dag | nytt pakkeslag `fin`, bare fastlandets 168 fliser; anslag kapittel 6, måles i K0 |
| 2 | **Skjærene i 3D** (G10-resten, «tangen på skjærene») | ikke tegnet | bare `view3d/` (fase K4); dataene er i sjøkartpakkene | OpenStreetMap (ODbL), alt i bruk | ingenting |
| 3 | **Sjømerkene mot IALA region A** | `sjomerker.py` slår isolert fare, trygt farvann og spesialmerke sammen til én type (`D` for staker, `B` for bøyer), og tar ikke med farge og toppmerke. Lateral- og kardinalmerkene har kategori, og «preferred channel» er ført til riktig side | `sjomerker.py` (egne typer, farge, toppmerke), `sjomerker.yml` → `sjomerker-8`; i spillet `core/01e-marks.js`, `markInto` i 3D og symbolene i kartplotteren (fase K3, etter Ø11.8, som gjør selve kontrollen og eier kartfilene) | OpenStreetMap (ODbL) | sjøkartpakkene, anslag +0,3 MB av 10,0 |
| 4 | **Sjømerker ved Bjørnøya og Jan Mayen** | OpenStreetMap har ingen innen 30 km. Om det finnes lykter der, er ikke sjekket | K3 slår opp Kystverkets data over navigasjonsinnretninger fra Actions (Geonorge er stengt fra øktene). Finnes de åpent, legges de til; finnes det ingen lykter, strykes punktet med kilden | Kystverket (antatt NLOD; **ikke lest**) | ubetydelig |
| 5 | **`ferry` for N3** | Senjas ferje er hardkodet (`NPC_ROUTES.ferry`) | ingen fase i Ø13: N3 (steg 34) lager `tools/npc/ferje.py` → `src/data/ferje.json` med egen workflow (Entur er antatt stengt fra øktene, som Geonorge). Leia fra Overtures `transportation/segment` (ferjeleiene, som alt ligger i indeksen `ov.py` henter) eller Geofabrik-utdraget `sjomerker.yml` alt laster ned | Entur (NLOD), OpenStreetMap (ODbL), som i `npc-flaaten.md` | siden, anslag under 0,2 MB |
| 6 | **`lanes` for N5** | finnes ikke | ingen fase i Ø13: N5 (steg 37) lager `tools/npc/ais.py` og egen workflow → `src/data/leier.json`. Blir HAIS for stort for 6 timer, stopper det bare den workflowen, ikke kartet | Kystverket (NLOD), som i `npc-flaaten.md` | siden, anslag under 0,2 MB |

### Utsatt til en full `kart-N+1` (med havsteget), og hvorfor

| Punkt | Hvorfor ikke nå |
|---|---|
| **Øyenes bakke er GLO-30** (Norsk Polarinstitutts terrengmodell er finere) og **breene på Svalbard** (Polarinstituttets breomriss) | Endrer `view`-pakkene for de 98 øyflisene. Ingen spiller kommer dit før havbåtene, som står etter lanseringen (Jonas 09.11.2026: «Havbåtene kan vente»). Lisensen er ikke lest, og kilden kunne ikke hentes fra en økt. |
| **Bakken utenfor den gamle rammen er grønn** (Grønland, Island, Færøyane, Russland) | Trenger arealdekke i far-pakkene (`ramme`-jobben, Overtures `land_cover` over hele den vide rammen, som er stor og kan ta tid). Samme grunn: ingen er der ennå. |
| **Kjernen er 4,70 MB** (målet 3,5) | Det som gjenstår å prøve (`dc200` regnet ut i spillet, `deep` på 2 km utenfor eggakanten), flytter arbeid til oppstarten på telefonen, der Ø3b–Ø3d nettopp har hentet tid. 1,2 MB er 1,5 % av førstegangsnedlastingen. Tas bare om en måling på telefon viser at det lønner seg. |
| **`expo2k` stemmer bare grovt**, **`land1k` mister øyer og skjær** | Gjelder bare utenfor den gamle rammen og utenfor Svalbard og Jan Mayen (som har detalj). Hører til navigasjonen over åpent hav (H1b R6). |
| **Dybden er kuttet ved 2 550 m** | Står med vilje: ingen fisker dypere. Et bredere lag ville gjort kjernen større. |
| **GEBCO kom fra en kopi** | `deep.py` kan lese CEDAs filer når lenkene legges inn; kontrollen celle for celle gjøres i `gebco.yml` når `deep` uansett lages på nytt. Kopien er sjekket mot tre kjente dyp. |
| **Flisrørledningen er ikke helt bestemt** | Betyr noe først når `kart.yml` kjøres igjen. Årsaken må finnes før den kjøringen (samme flis bygd to ganger og sammenlignet), og står som første punkt i den releasen. |
| **Arealdekket nærmest sjøen** (ESA har ofte ingen klasse 50–100 m fra sjøen) og **ESAs skjøt langs 24° Ø** (G1-resten) | Spillet har alt en regel for begge (anslått blanding, deling etter høyden). En retting i dataene ville endret alle `view`-pakkene (295 MB) for noe spilleren knapt ser. |

### Hører ikke til en kartrelease

- **Mørk stripe langs åsryggen bak Hammerfest:** ligger der nærterrenget går over i mellomnettet (skygge eller farge i skjøten), altså i `view3d/`, ikke i dataene. Blir stående i backloggen. K1 rører nærterrenget og ser på stripa hvis den samme skjøten endres, ellers ikke.
- **G1-resten ellers** (`sea3d` over tidsgrensen, GL-feil 1282 sett én gang ved Bodø, bildetakten med G1 ikke målt på nettbrettet): tester og måling, ingen data.

## 5. `hgt10` i detalj

- **Hva:** høydene på 10 m (eller 12,5 m, se under) i en stripe langs sjøen, så svaberg, skjær og strandberg får formen sin. Bare land og fjære; sjøbunnen i 3D kommer fortsatt fra 25 m-laget.
- **Eget pakkeslag `fin`** per flis, ikke et lag i `view`. Da beholder `view`-pakkene hashen, og kvaliteten kan styre om pakken lastes i det hele tatt.
- **Bare Høy og Ultra laster `fin`.** Lav og Middels (Galaxy A52s og andre vanlige telefoner) henter og pakker ikke ut noe nytt, så minnet og oppstarten der er uendret. Det er slik kravet fra Ø3b–Ø3d holdes, og det måles (kapittel 6), ikke antas. `#fin0` i adressen slår laget av.
- **Bare fastlandet.** Terrarium har ingen fin kilde nord for fastlandet (z11 og z13 ga det samme ved Longyearbyen, 4.9d), og GLO-30 er 30 m. Øyene får ingen `fin`-pakke, og spillet leser 25 m der som i dag.
- **Tre ting K0 måler før noe bygges for kysten:**
  1. Størrelsen på Senjas fliser for stripa på 1 km og på 500 m, med 10 m og med 12,5 m celler. 12,5 m er halvparten av dagens rute, så nettene deler hjørner uten omregning, og laget blir 36 % mindre enn 10 m; kilden er 5–8 m, så begge er ekte data.
  2. Hvor mye av fastlandets fliser stripa dekker, talt fra `kart-31` (`sim`-pakkenes maske), så Senja-tallet kan ganges opp uten en release.
  3. Minnet per blokk og tiden nettet tar: en blokk på 10 km er 2 MB som Int16 på 10 m (1,3 MB på 12,5 m). Kartbufferen er 96 MB.
- **Taket** fra grafikkplanen står: rundt 150 MB for hele kysten. Er 1 km over, tas 500 m. Er 500 m også over, eller viser bildene i K1 ingen forskjell en spiller ser fra båten, bygges ikke laget (valg V1).

### K0: målingen (steg 33a, 11.11.2026)

Målt med prototypen `tools/map/fin.py` (`senja`, `tile`, `gain`, `count`), som leser Terrarium z13 i hver celle i stripa, tar land og sjø fra vektorkysten på 3 m (`coast2` i sjøkartpakkene) og pakker laget som `hgt` (Int16, medianprediktoren, deflate per blokk på 10 km, én `fin`-pakke per flis). Alt ligger i `tools/map/out/fin/`; ingenting i `src/` er rørt. Tallene er størrelsen på pakkene slik en release ville hatt dem.

**Slik laget er kodet i prototypen:** en landcelle i stripa er `hgtEnc(max(h, 0,5))`; en sjøcelle innen 25 m fra stripa (fjæra) er `hgtEnc(min(h, −0,5))`, som i praksis er −1 overalt, fordi Terrarium har sjøen på 0; alle andre celler er 0, som `hgtEnc` aldri gir, og som betyr «ingen fin bakke her, les 25 m-laget». En blokk uten en eneste celle i stripa har ingen oppføring. Rundturen er kontrollert på én blokk i to varianter (pakket, pakket ut med `pack.unmed16`, likt celle for celle).

**Senjas fire fliser** (stripa talt på 25 m-masken: 1 156 km² innen 1 km, 650 km² innen 500 m):

| Variant | 16,6 | 17,6 | 16,7 | 17,7 | Sum MB | Blokker | Celler | Byte per celle | kB per km² |
|---|---|---|---|---|---|---|---|---|---|
| 1 km, 10 m | 0,33 | 1,33 | 1,02 | 0,78 | 3,44 | 66 | 11,61 mill. | 0,297 | 2,98 |
| 1 km, 12,5 m | 0,24 | 0,97 | 0,75 | 0,57 | 2,52 | 66 | 7,42 mill. | 0,340 | 2,18 |
| 500 m, 10 m | 0,23 | 0,93 | 0,73 | 0,51 | 2,40 | 65 | 6,55 mill. | 0,367 | 3,69 |
| 500 m, 12,5 m | 0,17 | 0,68 | 0,54 | 0,37 | 1,76 | 65 | 4,18 mill. | 0,421 | 2,71 |
| 1 km, 10 m, halve meter hele veien | 0,44 | 1,81 | 1,39 | 1,07 | 4,71 | 66 | 11,61 mill. | 0,406 | 4,08 |
| 1 km, 12,5 m, halve meter hele veien | 0,33 | 1,35 | 1,04 | 0,79 | 3,51 | 66 | 7,42 mill. | 0,472 | 3,03 |

**Seks fliser til langs kysten,** laget på samme måte (masken og kysten fra `kart-31`, så `coast.py` trengtes ikke), for å se hvor godt Senja står for resten. kB per km² stripe:

| Flis | Sted | Stripe 1 km, km² | 1 km, 10 m | 1 km, 12,5 m | 500 m, 10 m | 500 m, 12,5 m | Andel av stripa over 10 moh. |
|---|---|---|---|---|---|---|---|
| 16–17, 6–7 | Senja | 1 156 | 2,98 | 2,18 | 3,69 | 2,71 | 89 % |
| 4,29 | Jæren (flat) | 474 | 2,86 | 2,10 | 3,53 | 2,61 | 77 % |
| 4,26 | Bergen | 627 | 3,20 | 2,35 | 3,87 | 2,85 | 91 % |
| 12,14 | Helgeland (øyer og skjær) | 410 | 3,60 | 2,68 | 4,15 | 3,08 | 61 % |
| 14,11 | Bodø | 353 | 3,22 | 2,37 | 3,97 | 2,94 | 82 % |
| 21,3 | Hammerfest | 345 | 2,94 | 2,14 | 3,76 | 2,75 | 94 % |
| 25,2 | Båtsfjord | 124 | 2,88 | 2,11 | 3,73 | 2,75 | 86 % |

Senja står godt for resten: de seks andre ligger fra 4 % under til 23 % over Senjas tall, og alle ti flisene samlet 4 % over. Det er ikke bratthet som koster mest (Jæren og Båtsfjord er like billige som Senja), men mye lav og oppstykket kyst (Helgeland). Ti fliser av 168 er målt, og 3 489 km² av 30 948 km² stripe (11 %); resten er ganget opp.

**Hele fastlandet** (`count`: 168 fliser i `kart-31`, 198 541 km² land i flisene, 141 fliser har stripe). Stripa er 30 948 km² innen 1 km fra sjøen (1 806 blokker av 4 200) og 18 546 km² innen 500 m (1 764 blokker). Anslaget i kapittel 6 var 30 000–50 000 km²:

| Variant | Fra Senja | Fra alle ti flisene | Laveste og høyeste enkeltflis | Mot taket på 150 MB |
|---|---|---|---|---|
| 1 km, 10 m | 92 MB | 96 MB | 89–112 MB | holder |
| 1 km, 12,5 m | 68 MB | 70 MB | 65–83 MB | holder |
| 500 m, 10 m | 69 MB | 71 MB | 65–77 MB | holder |
| 500 m, 12,5 m | 50 MB | 52 MB | 48–57 MB | holder |
| 1 km, 10 m, halve meter | 126 MB | 128 MB | 116–136 MB | holder, med liten margin |
| **1 km, 12,5 m, halve meter** | **94 MB** | **95 MB** | **86–102 MB** | **holder** |

Flisene i `kart-31` har også noe svensk, finsk og russisk kyst (masken skiller ikke land); en release kan klippe dem bort, så tallene er heller for høye enn for lave. 500 m sparer bare en firedel mot 1 km, fordi de dyre cellene er de nær sjøen, og fordi de samme blokkene må med uansett.

**Det laget faktisk gir** (`gain`, 300 000 tilfeldige celler i stripa per flis): høyden i den fine cella mot det spillet har i dag på sitt beste (samme kilde lest i 25 m-cellenes sentre, urundet, bilineært mellom dem).

| Flis | Avvik (rms) | 90 % innen | 99 % innen | Over 1 m | Over 2 m | Innen 100 m fra sjøen (rms, over 1 m) |
|---|---|---|---|---|---|---|
| Senja 17,7 | 0,44 m | 0,56 m | 1,34 m | 2,5 % | 0,3 % | 0,66 m, 2,0 % |
| Jæren 4,29 | 0,58 m | 0,77 m | 2,20 m | 6,2 % | 1,3 % | 0,63 m, 5,5 % |
| Helgeland 12,14 | 0,56 m | 0,77 m | 1,92 m | 5,7 % | 0,9 % | 0,53 m, 3,4 % |
| Hammerfest 21,3 | 0,57 m | 0,69 m | 1,99 m | 4,9 % | 1,0 % | 0,99 m, 13,4 % |

To ting følger av det, og begge må sies ærlig:

1. **Gevinsten i høyde er liten i tall.** I ni av ti celler flytter den fine bakken seg under 0,8 m fra det 25 m-laget alt viser. Det laget gir, er de få prosentene der formen er skarp (kanter, knauser, stup i fjæra) og en strandlinje som følger kysten på 3 m i stedet for 25 m-masken. Om en spiller ser det fra båten, kan bare bildene i K1 svare på; valg V1 (A) sier at laget legges bort om de ikke viser forskjell.
2. **`hgtEnc` runder bort gevinsten over 10 moh.** Kodingen har halve meter opp til 9,75 m og 2 m-trinn over. 2 m-trinn gir en avrundingsfeil på 0,58 m rms, altså like mye som hele gevinsten, og 61–94 % av stripa ligger over 10 moh. Med `hgtEnc` ville `fin` bare vært finere enn 25 m-laget helt nede i fjæra. Laget må derfor kodes i halve meter hele veien (avrunding 0,14 m rms). Det er `dec: 'half'`, som lasteren alt har for dybden, så det trengs ingen ny dekoder. Det koster 37–39 % mer.

10 m og 12,5 m gir samme gevinst (målt på Senja og ved Hammerfest: 0,44 mot 0,44 m og 0,55 mot 0,57 m rms), så de ekstra cellene på 10 m viser ingenting mer.

**Minnet i spillet** (Int16 per blokk på 10 km): 2,00 MB på 10 m (1 000 × 1 000) og 1,28 MB på 12,5 m (800 × 800). Fire blokker rundt båten er 8,0 eller 5,1 MB, ni blokker 18,0 eller 11,5 MB, av kartbufferens 96 MB (`MAPD.budget`). Bare blokker med stripe finnes (43 % av blokkene i fastlandets fliser), så på åpent hav og inne i landet lastes ingenting.

**Kjøretiden:** 21–55 sekunder per flis her (begge rutene, seks varianter, medregnet hentingen av rundt 600 z13-fliser per flis; 6 044 fliser og 324 MB for de ti). Hele fastlandet er godt under en time i én jobb, så `fin.yml` trenger ikke tolv deler.

**K1 bygger: stripa 1 km, ruta 12,5 m, halve meter hele veien (`dec: 'half'`).** Anslag 94 MB for fastlandet (86–102), 1,28 MB per blokk i minnet. Grunnene: 12,5 m viser det samme som 10 m og er 26 % mindre på serveren og 36 % mindre i minnet, og 25 m-cellene deles i 2 × 2; 1 km fordi 500 m bare sparer en firedel og legger skjøten mot 25 m-nettet midt i lia en ser fra båten; halve meter fordi laget ellers ikke gir noe over 10 moh. Laget holder taket på 150 MB i alle variantene, så K1 og K2 går ikke ut på størrelsen. Det som kan stoppe laget, er punkt 1 over: bildene i K1.

### K1: laget i spillet på Senja (steg 33b, 11.11.2026)

Bygd på grenen `claude/zen-curie-qoa35d`, **ikke rullet ut**: bildene viser ingen forskjell en spiller ser fra båten, så steget stoppet for valg V1 (valg 37 i køen).

**Det som er bygd:** `python3 tools/map/fin.py game` skriver Senjas fire pakker (3,51 MB, 66 blokker, som K0 målte) til `src/data/map` og laget `fin` i manifestet; ingen annen oppføring er rørt (kontrollert: de 205 gamle pakkene og de 15 gamle lagene er like). Lasteren har `finH(x, z, h)` (`core/01b-mapdata.js`), og `terrRaw` i 3D leser den ett sted; alt annet i 3D leser bakken gjennom `terrRaw` eller `terrH`, så strendene, stupene, nærfeltet, kaiene og byggene trengte ingen endring. `game.py` tar alt Senjas egne lag og pakker som de er, så et bygg med hele kysten får Senjas `fin` uten endring der.

**Tallene** (PC-en i økta, programvare-GPU, starten ved Finnsnes, `tests/fintest.py` på bygget før og etter):

| | Før | Etter, Lav og Middels | Etter, Høy | Etter, Høy med `#fin0` |
|---|---|---|---|---|
| Kartet hentet over nettet ved starten | 8,59 MB (20 pakker) | 8,59 MB (20) | 9,38 MB (21: `fin` 0,79 MB) | 8,59 MB (20) |
| Kartbufferen (`MAPD.bytes`) | 16,3 MB | 16,3 MB | 22,7 MB (5 blokker `fin`, 6,4 MB) | 16,3 MB |
| JS-minnet | 328–345 MB | 321–356 MB | 339 MB | 356 MB |
| `MAPD.miss` | 0 | 0 | 0 | 0 |

JS-minnet svinger mer fra kjøring til kjøring (±15 MB) enn laget flytter det, så det tallet sier bare at laget ikke synes der. Etter tre flytt på rad (Husøy, Bøvær, Vangshamn) lå 17 blokker `fin` (21,8 MB) i bufferen, innenfor de 96 MB; de går ut etter tur som de andre.

**Målt i spillernes bygg (12.11.2026, engangsrunden mot testutgaven, versjon `97b13cec726d`, `tests/fintest.py` gjennom en proxy på 127.0.0.1):** Høy ved Finnsnes gir 15 blokker `fin` (19,2 MB) etter starten, og kartbufferen 41 MB. Senja-bygget over ga 5, fordi det mangler kartdataene rundt Senja: i hele kystens bygg leser broene, innsjøene, lysene og dyrelivet opptil 25 km unna bakken gjennom `finH` og pakker ut blokkene sine (sett med kallstakken til `mapBlock`). Lav, Middels og `#fin0` henter fortsatt ingenting, og ingen blokk telles som `MAPD.miss`. Jonas 12.11.2026: «A: Behold, K2 avgjør». Tallet går inn i K2s valg mellom Høy og bare Ultra, sammen med målingen hans på nettbrettet (`docs/spill-dette/33b.md`).

**Tiden per nett** (`G3._debug.meshBench`, medianen av sju, to kjøringer hver): høydene i nærnettet (256 × 256 over 6 km) 37 → 40–41 ms, i finnettet (256 × 256 over 1 km) 75–77 → 79–82 ms. Det er hele nettet, som bygges i tidsbiter over mange bilder; per bilde er det ikke målbart. Regnet per nett er nærnettet 3,5 ms dyrere, altså litt over grensa på 3 ms i startmeldingen. Laget er ikke trappet ned til bare Ultra, fordi steget stoppet; bygges laget likevel, tas det valget i K2 etter Jonas' måling på nettbrettet.

**Fin mot spillets 25 m-lag** (flisa 17,7, 400 000 celler i stripa): middel 0,07 m, rms 0,81 m, 90 % innen 0,88 m, 5,4 % over 1 m og 1,3 % over 2 m. Under 5 moh. er avviket størst (rms 2,1 m, middel +0,7 m): det er der 25 m-cellene blir dratt ned av sjøcella ved siden av.

**Bildene** (`tests/finshot.py`; `docs/okter/2026-11-11-33b/`, 32 bilder og åtte side om side): Husøy, Finnsnes, Bøvær og Vangshamn, fra båten 70 m fra land og fra 160 m ut over havna, i 1280×800 og 800×1280, med laget og med `#fin0`, samme klokkeslett (18. juni kl. 12), klar himmel og frø. **Jeg ser ingen forskjell i bakken på noen av dem.** Det som skiller bildene, er sjøen, måkene og en båt som har drevet noen meter mellom kjøringene. Grunnen er den K0 pekte på: strandlinja følger alt kysten på 3 m (`coastSdIf` i `terrRaw`, fra 12.10.2026), fjæra er en egen profil, og landet bak flytter seg under en meter i ni av ti celler. Det er ikke prøvd i motlys eller med snø, der små former synes best; bildene er tatt slik startmeldingen ba om.

**Det som ble funnet underveis:** `fintest` var rød to ganger for en ekte feil: på «auto» tegnes 3D på Høy bak startskjermen i over ti sekunder, så pakken ble hentet før spilleren hadde valgt Lav. Rettet: «auto» må ha holdt Høy i 30 s, et valgt nivå leses før laget spørres, og blokkene slippes med en gang nivået faller under Høy.

## 6. Størrelsen før og etter, og telefonene

| | Før (`kart-31`) | Etter | Hvordan det måles |
|---|---|---|---|
| `sim`, `view`, `vec` | 126,1 / 295,3 / 79,3 MB | uendret, byte for byte | `manifest.json` før og etter (K2 sammenligner hashene) |
| `chart` | 10,0 MB | anslag 10,3 MB (`sjomerker-8`) | K3 |
| `fin` (nytt) | 0 | **målt 94 MB på serveren** (86–102; 1 km, 12,5 m, halve meter; K0 11.11.2026, ti fliser ganget opp); tak 150 | K0, kapittel 5; K2 måler releasen |
| Kjernen, `chart0`, far-pakkene | 4,70 / 0,58 / 13 MB | uendret | |
| Siden | rundt 6 MB | + anslag 0,2–0,4 MB når N3 og N5 legger inn `ferje.json` og `leier.json` | i de stegene |
| Førstegangsnedlastingen, Lav og Middels | 80,3 MB (målt 04.11.2026) | uendret (ingen `fin`); **målt i K1 på Senja-bygget: kartet 8,59 MB før og etter, kartbufferen 16,3 MB før og etter** | K1: `tests/fintest.py` med nettverksloggen, før og etter |
| Førstegangsnedlastingen, Høy og Ultra | 80,3 MB | + `fin` for flisene rundt båten: 0,3–1,4 MB per flis på Senja, største flis på fastlandet rundt 2,5 MB (4,25, Bergen nord); én til fire fliser | K1 |
| Minnet i 3D, Høy | **målt i K1: kartbufferen 16,3 MB ved Finnsnes** | + 4–9 blokker `fin` à 1,28 MB: 5,1–11,5 MB av kartbufferens 96 (regnet i K0); **målt på testutgaven 12.11.2026: 15 blokker, 19,2 MB, bufferen 41 MB** (broer, innsjøer, lys og dyreliv opptil 25 km unna, K1 over) | K1: `MAPD.bytes` og JS-minnet etter starten, som i Ø3d |

K0 har målt (kapittel 5, «K0: målingen»); anslaget under er det planen sto med før. Anslaget for `fin` var grovt med vilje: jeg kjenner ikke hvor stor del av `view` som er høydene (manifestet har bare pakkene, ikke lagene), og ikke hvor mye land som ligger innen 1 km fra sjøen. Regnestykket er land i stripa (anslag 30 000–50 000 km²) × 10 000 celler per km² × 0,2–0,5 byte per celle etter prediktoren og deflate. Derfor måler K0 før noe annet.

**Telefonene:** det eneste som kan gjøre vanlige telefoner tregere, er at `fin` lastes der. Regelen i K1 er at Lav og Middels ikke gjør det, og `boottest` og `first3d` skal vise samme tall før og etter på de nivåene. På Høy måler Jonas med `#fps` og `#prof` på nettbrettet (nullpunktet 71 bilder/s ved Finnsnes) før K2 lager laget for kysten. Koster det mer enn 3 ms, trappes det etter `QUAL` (bare Ultra, eller kortere rekkevidde).

## 7. Slik kjøres det

1. **Workflowen `fin.yml`** (ny, fase K2) startes av `tools/map/fin.json`, med `tools/ci/seen.py` som de andre, og fordeler fastlandets 168 fliser på tolv deler side om side, som `kart.yml`s flisjobber. Den henter de samme z13-flisene som flisjobbene gjør i dag (de leser alt z13 innen 3 km fra sjøen), så anslaget er 15–30 minutter per del, langt under 6 timer. Resultatet er releasen `fin-N` med pakkene og et manifestutdrag. `kart.yml` røres ikke.
2. **Bygget:** `kart-release.json` får `"fin": "fin-N"` ved siden av `"release": "kart-31"`. `release.py` henter den, `game.py` legger pakkene inn i manifestet. `deploy.yml` følger alt `kart-release.json`, så workflowen trenger ingen endring.
3. **Testutgaven først:** pushen som setter pinnen, går til `test.detstorebla.no`. Der står den minst seks timer (slippregelen), Jonas ser på bildene og måler på nettbrettet, og stikkprøvene tas på testadressen.
4. **Slippet** som vanlig (`tools/release/slipp.py`, om natta, eller «slipp nå»). **Det slippes ikke før steg 102 er ferdig** (linja øverst i køen).
5. **Gammel side:** `fin-N` legger bare til pakker, så ingen gammel side spør etter noe som er borte. `sjomerker-8` (K3) bytter sjøkartpakkene, som hver sjømerkerelease har gjort; K3 skriver derfor først testen for det (en pakke som gir 404 fordi manifestet er nytt) og retter spillet: ved 404 på en pakke hentes manifestet på nytt, og er det et annet, kommer oppdateringsstripa straks i stedet for etter opptil ti minutter. Den samme rettingen er forutsetningen for en full `kart-N+1` senere.
6. **Tilbakeveien:** pinnen `fin` tas ut (eller settes til forrige), og bygget er som før; `sjomerker` kan pinnes til `sjomerker-7` på samme måte (i dag tar `release.py` alltid den nyeste, så K3 legger pinnen til). Releasene slettes ikke. For spillerne er det et vanlig slipp tilbake.
7. **Én om gangen** gjelder fortsatt: K2 og K3 kjører ikke workflowene sine samtidig med en annen kartjobb, og ingen annen økt endrer `kart-release.json` mens en av dem er på testadressen.

## 8. Fasene

Én økt hver. Skjermbildene tas før og etter på de samme stedene, med samme klokkeslett og vær (frø), i 800×1280 og 1280×800, og legges i `docs/okter/<dato>-<steg>/`.

### K0 (steg 33a). Målingen, ingenting i spillet

- **Gjør:** prototypen `tools/map/fin.py` for Senjas fliser (ingen pakker i `src/data/map` endres); størrelsene for 1 km og 500 m, 10 m og 12,5 m; tellingen av stripa for fastlandet fra `kart-31`; minnet per blokk. Sjekker om Entur og Kystverkets navigasjonsdata kan nås fra en økt eller bare fra Actions (ett kall hver), og leser lisensene. Skriver tallene inn i kapittel 6 og sier hvilken variant K1 bygger, eller at laget ikke holder taket.
- **Filer:** ny `tools/map/fin.py`, `docs/planer/kartrelease-o13.md`.
- **Tester:** ingen (ingen kode i spillet, ingen UI). Skriptet skriver tallene.
- **Skjermbilder:** ingen.
- **Ferdig 11.11.2026.** Tallene står i kapittel 5 («K0: målingen»). K1 bygger 1 km, 12,5 m, halve meter.

### K1 (steg 33b). `hgt10` i spillet, på Senja

- **Varianten (K0):** stripa 1 km, ruta 12,5 m (n = 800 per blokk), Int16 med `dec: 'half'` (ikke `hgt`), 0 = «ingen fin bakke, les 25 m», blokker uten stripe finnes ikke. Senjas pakker skrives av `fin.py` selv (den lager alt KMP1-pakkene; en ny kommando legger de fire pakkene og laget `fin` inn i manifestet i `src/data/map`), ikke av `tools/mappack.mjs`; `game.py` slipper `fin` gjennom først i K2, så K1 testes med Senja-bygget.
- **Gjør:** lasteren kjenner pakkeslaget `fin` og laget (`core/01b-mapdata.js`), finbakken og nærterrenget leser det der det finnes og 25 m ellers (`view3d/02-mesh-terrain.js`, `04-vec-packs.js`), strendene, stupene, nærfeltet, kaiene og byggene står på den nye bakken (`17h-shore.js`, `17f-near.js`, `05-quays-breakwaters.js`, `06-buildings-lights.js` leser bakken gjennom samme funksjon; sjekkes, endres bare om de ikke gjør det). Lav og Middels laster ikke `fin`; `#fin0`. Senjas `fin`-pakker lages lokalt av `fin.py` og legges i `src/data/map` gjennom `tools/mappack.mjs` eller `game.py` (K0 sier hvilken).
- **Filer:** `tools/map/fin.py`, `core/01b-mapdata.js`, `view3d/02-mesh-terrain.js`, `view3d/04-vec-packs.js`, `src/data/map/`, `tests/unit/` (ny `fin.test.mjs`), `tests/run.py` (`COVER`), patchnotatet.
- **Tester:** ny enhetstest for lesingen (`rbilM` på `fin` der det finnes og 25 m ellers, og at en blokk uten `fin` ikke telles som `MAPD.miss`), **sett rød først** mot koden før lasteren kjenner laget. `maptest`, `landtest`, `terrshot`, `boottest`, `first3d` (minnet og oppstarten på Lav og Middels skal være like før og etter), og `havnshot` for Finnsnes.
- **Måles:** `MAPD.bytes` og JS-minnet på Høy før og etter, tiden per nærnett (CDP-profilen fra terrengnettene i tidsbiter, 05.11.2026), og Jonas' `#fps` og `#prof` på nettbrettet ved Finnsnes.
- **Skjermbilder:** svaberg og fjære fra båten og fra kaia på fire steder på Senja (Husøy, Finnsnes, Bøvær, Vangshamn), før og etter, begge formater.
- **Stikkprøver:** ingen ennå (dataene finnes bare for Senja). Svaret til Jonas sier det.
- **Stopper** for valg V1 om bildene ikke viser en forskjell som er verdt størrelsen.

### K2 (steg 33c). `fin-N` for hele kysten, og utrullingen

- **Gjør:** `fin.yml`, `fin.json`, pinnen i `kart-release.json`, `release.py` og `game.py`; kjører workflowen, sammenligner manifestet (alle gamle pakker byte-like), ruller ut til testadressen.
- **Filer:** ny `.github/workflows/fin.yml`, `tools/map/fin.json`, `fin.py`, `release.py`, `game.py`, `kart-release.json`, `docs/systemer/datarorledninger.md`, `kart-og-terreng.md`, `3d-verden.md`.
- **Tester:** `teleport3d` (budsjettet på 96 MB holder etter seks steder), `coast3d`, `svalbardtest` (øyene uten `fin` er som før), `havnshot`, `boottest`.
- **Skjermbilder:** før og etter i begge formater ved Bergen, Bodø og Hammerfest (de samme utsnittene som `havnshot`), og ett ved Longyearbyen som skal være likt.
- **Stikkprøver** (`/stikkprove`): Bergen (sør), Bodø (midt), Hammerfest eller Båtsfjord (nord): pakken kommer, bakken er finere, båten ligger riktig ved kaia, ingen sprekk mellom nettene. Longyearbyen og Jan Mayen: ingen `fin`, ingen feil, samme bilde.

### K3 (steg 33d). Sjømerkene, etter Ø11.8 (steg 19)

- **Gjør:** det Ø11.8 fant galt mot IALA region A, rettes i `sjomerker.py`; isolert fare, trygt farvann og spesialmerke som egne typer med farge og toppmerke; Bjørnøya og Jan Mayen fra Kystverket om kilden er åpen; pinnen for `sjomerker` i `kart-release.json`; gammel side som møter et nytt manifest (kapittel 7 punkt 5).
- **Filer:** `tools/map/sjomerker.py`, `sjomerker.json`, `release.py`, `game.py`, `core/01e-marks.js`, `core/01b-mapdata.js` (404 → manifestet på nytt), `ui/10p-install.js`, `view3d/` (`markInto`), `ui/03-map.js` eller `03a-chart.js` (symbolene; etter Ø11.8), `tests/marktest.py`, `tests/maptest.py`.
- **Tester:** `marktest` utvidet med ett merke av hver nye type (**sett rød først** mot `sjomerker-7`), ny sjekk i `maptest` for 404 med nytt manifest (**sett rød først**: i dag kommer stripa ikke), `coast3d`, `charttest`.
- **Skjermbilder:** kartplotteren og 3D ved ett kardinalmerke, ett lateralmerke og ett isolert faremerke, før og etter, begge formater.
- **Stikkprøver:** Oslofjorden eller Kristiansand, Bergen, Bodø, Tromsø og Hammerfest (de samme som Ø11.8), pluss Longyearbyen, Bjørnøya og Jan Mayen.

### K4 (steg 33e). Skjærene i 3D

- **Gjør:** skjærene fra `marksNear('rocks', …)` som lave berg med tang og rur etter eksponeringen, tørre ved lavvann og overskylt ved høyvann, og brenning over dem i sjø; trinnvis etter `QUAL`, av-bryter i adressen. Først sjekkes det at de virkelig ikke tegnes (denne planen fant dem bare ikke med `grep`).
- **Filer:** ny `view3d/17i-rocks.js` (inn i malen), `view3d/17-draw.js` (ett kall), `tests/run.py`, patchnotatet.
- **Tester:** ny sjekk i `coast3d` (skjærene i bildet der `rocksIn` har dem; **sett rød først**), `hulltest` (grunnstøtingen er uendret).
- **Skjermbilder:** tre skjær ved lavvann og høyvann, før og etter, begge formater.
- **Stikkprøver:** Bergen, Bodø, Hammerfest; Senja har sine egne innebygde skjær og prøves for seg.
- **Uavhengig av K0–K3** og kan tas når som helst etter linja.

Rekkefølgen: K0, K1, K2; K3 når Ø11.8 er ferdig; K4 når det passer. N3 (steg 34) venter ikke på noen av dem om V2 blir A.

## 9. Valgene (valg 35 i køen)

**Besvart 11.11.2026.** Jonas: «V1: A V2: A V3: A». (V1 endte med at laget ble lagt bort: K1s bilder viste ingen forskjell, og Jonas svarte «V37: A» samme dag; se «Status».) Altså: `hgt10` bygges om K0 holder taket og K1s bilder viser forskjell (økta velger stripa og ruta); Ø13 er tillegg til `kart-31` uten ny `kart-N`, og N3 er klar; det utsatte venter på én full `kart-N+1` når havsteget nærmer seg.

**V1. `hgt10`: er finere bakke langs sjøen verdt størrelsen?**
- **A (anbefalt):** Ja, om K0 viser at laget holder taket på 150 MB på serveren, og K1s bilder fra Senja viser en forskjell fra båten. Økta velger 1 km eller 500 m og 10 eller 12,5 m etter tallene. Bare Høy og Ultra laster det.
- B: Bare 500 m uansett, for å holde størrelsen nede.
- C: Dropp `hgt10`. K0–K2 går ut, og Ø13 blir sjømerkene og skjærene.
- *Hvorfor A:* fjæra er det spilleren ser hele tiden fra båten, og kostnaden treffer ikke telefonene som sliter.

**V2. Én stor release, to mindre, eller tillegg?**
- **A (anbefalt):** Tillegg til `kart-31`: `fin-N`, `sjomerker-8` og egne datafiler for ferjene og leiene. Ingen ny `kart-N` nå. N3 (steg 34) blir klar med en gang.
- B: Én stor `kart-N+1` med alt, også det utsatte. Alle pakkene får nye hasher, de åtte avledede datasettene lages på nytt, og N3 venter på den.
- C: To: én `kart-N+1` nå med `hgt10` og vec-lagene `ferry` og `lanes`, og én for havsteget senere.
- *Hvorfor A:* ingenting spillerne har, endres, tilbakeveien er én linje, og NPC-flåten slipper å vente på kartet.

**V3. Det utsatte (Svalbards bakke og breer, utenlandsk bakke, kjernens størrelse, `expo2k`, `land1k`, GEBCO fra CEDA)?**
- **A (anbefalt):** Utsett til én full `kart-N+1` når havsteget nærmer seg, og finn årsaken til at rørledningen ikke er helt bestemt først.
- B: Ta Svalbards bakke og breer nå, som en egen fase, fordi havbåtenes trailer kan filmes der.
- *Hvorfor A:* «Havbåtene kan vente» (Jonas 09.11.2026), og ingen spiller er der før de har en havbåt.

## 10. Antatt og usikkert

- **Størrelsen på `fin`** er målt i K0 (11.11.2026): 94 MB for fastlandet i varianten K1 bygger, fra ti fliser av 168 ganget opp med stripa talt på 25 m-masken. De ti lå innen −4 % til +23 % av Senja per km². Det som ikke er målt: de 158 andre flisene, og om flisene med utenlandsk kyst skal med.
- **Fjæra i `fin` er bare fortegnet.** Terrarium har sjøen på 0 langs kysten, så sjøcellene inntil land blir −0,5 m alle sammen. Laget gir strandlinja, ikke bunnen i fjæra; den kommer fortsatt fra dybdelaget.
- **Gevinsten er målt mot 25 m-laget på sitt beste** (urundet). Spillets 25 m-lag har selv 2 m-trinn over 10 moh., så forskjellen i spillet kan være noe større enn tabellen i kapittel 5 sier. Det er ikke målt.
- **At skjærene ikke tegnes i 3D,** er funnet med `grep`, ikke sett i spillet. K4 sjekker først.
- **Entur og Kystverkets navigasjonsdata, prøvd fra en økt i K0 (11.11.2026):**
  - **Entur:** `api.entur.io` og `developer.entur.org` er stengt (nettverksproxyen svarer 403 på tilkoblingen). Men den nasjonale rutedatafila (GTFS, `rb_norway-aggregated-gtfs.zip` i Enturs åpne bøtte på `storage.googleapis.com`) svarer 200 herfra: 543 MB, sist endret 11.11.2026. N3 (steg 34) kan altså trolig hente rutetidene fra en økt, uten egen workflow for den delen; fila er ikke lastet ned eller åpnet, bare spurt etter med ett kall. Lisensen (NLOD, etter `npc-flaaten.md`) er **ikke lest**: siden den står på, er stengt herfra.
  - **Kystverket:** `services.kystverket.no` og `kystinfo.no` er stengt (403), og Geonorge (`kartkatalog.geonorge.no`) og `data.norge.no` også. Navigasjonsinnretningene kan bare hentes fra Actions, og lisensen er **ikke lest**. K3 (steg 33d) må lese den fra Actions eller få den av Jonas før dataene tas inn. Om Bjørnøya og Jan Mayen har lykter i det hele tatt, vet jeg fortsatt ikke.
  - Geofabrik er ikke prøvd (startmeldingen ba om ett kall hver for Entur og Kystverket).
- **Ferjeleiene i Overture** (`transportation/segment` med vannveier): typen hentes alt, men `vectors.py` leser bare veiene. At ferjeleiene ligger der med nok dekning, er ikke sjekket; Geofabrik-utdraget (`route=ferry`) er reserven.
- **Gammel side ved ny release** er lest fra koden (`rsync --delete-after`, `mapLoad`), ikke prøvd. K3 skriver testen.
- **Fortegnet fra vektorkysten:** at `fin` kan klippes mot kysten på 3 m uten sprekk mot 25 m-nettet utenfor stripa, er en antakelse til K1 har bilder.
- **Tidene i Actions** for `fin.yml` var anslått fra `kart-31`s flisjobber; K0 målte 21–55 sekunder per flis i en økt (kapittel 5), så hele fastlandet er under en time.
- **Første oppstart** (80,3 MB) er fra 04.11.2026 og kan ha endret seg med modellene siden; K1 måler på nytt før og etter.
- **`trees.yml` har laget ti releaser** (`trees-2` til `trees-11`, den siste ved slippet 11.11.2026) uten at `trees.json` er endret i innhold; den mangler trolig vakten `seen.py`. Sett i releaselista i denne økta, ikke undersøkt. Hører hjemme i backloggen 10.7.

## 11. Det planen ikke gjør

- Ingen ny `kart-N` (om V2 blir A), ingen ny Overture-utgave, ingen endring i `sim`-pakkene, masken eller dybden.
- Ikke oppdrettsanlegg, ortofoto eller FKB (Jonas 28.10.2026 og lisensene), og ingen ekte firmanavn i noen data.
- Ikke N3 og N5 selv: de er Ø15 (steg 34 og 37). Planen sier bare hvor dataene deres skal ligge.
- Ikke kontrollen av sjømerkene mot IALA: den er Ø11.8 (steg 19). K3 retter det den finner.
- Ikke stripa bak Hammerfest, og ikke detaljteksturer eller ur ved foten av stup (4.11b).

## 12. Til backloggen (ikke skrevet dit av denne økta, som bare rører `docs/planer/`)

- G10: «strendene og stupene» er bygd (`kart-16`, `kart-18`); statusen i øktplanen og grafikkplanen er rettet her, backloggen 10.5 bør følge.
- `kart-33` og `kart-34` er releaser fra gamle grener og nyere enn den pinnede; `release.py` uten pinnen ville tatt feil release.
- `trees.yml` uten `seen.py` (kapittel 10).
- Gammel side og ny release gir 404 på pakker til oppdateringsstripa kommer (kapittel 2), rettes i K3.

## Status

- 11.11.2026: planen skrevet (Jonas' økt, grenen `ccr-28562daf-g7h9ca`). Venter på valg 35 (V1–V3). Fasene K0–K4 står i køen som 33a–33e etter lanseringslinja; startmeldingen for K0 i `docs/planer/start/33a.md`.
- 11.11.2026: **Jonas svarte på valg 35:** «V1: A V2: A V3: A». K0 (33a), K4 (33e) og N3 (steg 34) er klare; K1 venter på K0, K2 på K1, K3 på Ø11.8.
- 11.11.2026: **K4 (steg 33e) bygd** (Jonas' økt, grenen `ccr-6f2117ea-fknkro`). Sjekket først i spillet at skjærene ikke ble tegnet (bilder ved Bergen, Bodø og Senja: bare sjø der skjæret ligger). Ny del `view3d/17i-rocks.js`: lave berg der `rocksIn` har dem, formen fra posisjonen, tang og rur etter eksponeringen, tørre ved fjære og overskylt ved flo, brenning i sjø, trinnvis etter `QUAL`, `#rocks0` av. Ingen kartdata og ingenting i `core/` er endret. Det som er svakt, står i backloggen («Ø13 K4») og i `docs/systemer/3d-verden.md` 4.11l. K0–K3 er ikke rørt.
- 11.11.2026: **K0 ferdig** (steg 33a, Jonas' økt, grenen `ccr-950ce757-f9pptn`): `tools/map/fin.py` og målingen i kapittel 5. Alle fire variantene holder taket (50–96 MB med `hgtEnc`). K1 bygger 1 km, 12,5 m, halve meter hele veien (94 MB for fastlandet, 1,28 MB per blokk i minnet), fordi `hgtEnc` runder bort gevinsten over 10 moh. Gevinsten i høyde er liten i tall (0,44–0,58 m rms mot 25 m-laget), så bildene i K1 avgjør om laget bygges for kysten. Entur: rutedatafila nås fra en økt, API-et og lisenssiden ikke; Kystverket: stengt. K1 (33b) er klar, startmeldingen i `docs/planer/start/33b.md`.
- 11.11.2026: **K1 bygd, stoppet for valg V1** (steg 33b, Jonas' økt, grenen `claude/zen-curie-qoa35d`; ikke rullet ut). Laget virker (lasteren, `finH`, `terrRaw`, bare Høy og Ultra, `#fin0`), Lav og Middels er like før og etter (8,59 MB hentet, 16,3 MB i kartbufferen), Høy får 0,79 MB og 6,4 MB til ved Finnsnes, og nærnettet koster 3,5 ms mer per nett. **Bildene fra de fire stedene viser ingen forskjell fra båten.** Tallene og bildene står i kapittel 5 («K1: laget i spillet på Senja»). K2 venter på Jonas' svar (valg 37 i køen): legge laget bort, eller bygge kysten likevel.
- 11.11.2026: **Jonas svarte på valg 37: «V37: A».** `hgt10` legges bort. K1 (33b) og K2 (33c) er `lagt bort` i køen, grenen `claude/zen-curie-qoa35d` flettes ikke (koden, Senjas fire pakker, `tests/fintest.py` og `finshot.py` står der om laget tas opp igjen), og ingenting er rullet ut eller må ryddes. Ø13 er fra nå sjømerkene (K3, etter Ø11.8) og skjærene (K4). Taket på 150 MB og målingene i kapittel 5 står som grunnlag om spørsmålet kommer opp på nytt, for eksempel med en variant der fjæra selv tar formen fra den fine bakken.
- 11.11.2026: **Jonas snudde samme kveld:** «Vent, vi tar det med alikevell. jeg synes forskjellen er merkbar» (etter å ha sett bildene side om side). `hgt10` bygges altså (valg 37 endte som B): K1 rulles ut til testutgaven, Jonas måler `#fps` og `#prof` på nettbrettet ved Finnsnes (`docs/spill-dette/33b.md`), og K2 (33c) lager laget for kysten etter målingen. Nærnettet kostet 3,5 ms mer per nett på PC-en; om laget skal trappes til bare Ultra, avgjøres av målingen på nettbrettet, i K2.
- 11.11.2026: **K1 rullet ut til testutgaven** (c45bc54, versjon `fffca9a60cd8`; «Appen på Hetzner» grønn). Manifestet der har laget `fin` og Senjas fire pakker ved siden av hele kysten (1032 pakker), så `game.py` tok dem som de er, og pakken for Finnsnes svarer (0,79 MB). K2 (33c) venter på Jonas' måling på nettbrettet; startmeldingen står i `start/33c.md`.
