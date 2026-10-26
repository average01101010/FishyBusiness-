# Kartdataene: rammen, pakkene, rørledningen og kjernen

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.5 Rammen, projeksjonen og presisjonen (kystplanen, fase K2 og K4, 02.10.2026)

Forberedelser til hele kysten (planen står i `docs/kart/`). Fra K4 er spillets ramme den nasjonale UTM 33-rammen (4.7).

- **Projeksjonen** (`core/00-proj.js`, første fil i det felles skriptet, med `'use strict'`):
  - `utm33(lat, lon)` gir `{E, N, gamma, k}` og `utm33inv(E, N)` går tilbake. Krüger/Karney med sjette ordens rekker. Avviket mot PROJ (EPSG:25833) er 0,006 mm fra Utsira til Grense Jakobselv (`projtest.py`, referansen fra `tools/map/projref.py`).
  - `gamma` er meridiankonvergensen: sann kurs = rutenettskurs + γ.
  - `natP`/`natLL` er den nasjonale rammen i km: x = (E + 250 km)/1000, y = (8 050 km − N)/1000. Fra K4 er dette spillets ramme: `P`/`LL` i `01-world.js` er `natP`/`natLL`.
- **`gridKey(ix, iy)`** er nøkkelen for rutenettsceller, med `gridKeyX`/`gridKeyY` tilbake. Den tåler 2²⁰ celler hver vei og negative tall. Strøklengdebufferet, varmekartet, 3D-bitene og kamerakollisjonen bruker den.
- **Den gamle rammen** (`01-world.js`):
  - Senja-dataene og det håndplasserte innholdet er laget i den gamle rammen: flat ved 69,35° N, km fra 69,72° N 16,55° Ø.
  - `LG(x, y)`, `LGa([x, y])` og `LGm([x, z] i meter)` fører dem inn i spillets ramme med den eksakte projeksjonen, og `LGI(p)` fører tilbake.
  - `LGu(o, u)` dreier en retning, og `LGrot(x, y)` er vinkelen rammen dreies med (omtrent −γ).
  - I K2 var dette en ren forskyvning, `FR`, og torturtesten (`#frameshift`, `KYST_SHIFT=1`) flyttet rammen 1 000 km. Begge er borte i K4, fordi spillet nå ligger 810–892 km øst og 311–397 km sør for origo.
- **Oppstartsbarrieren** (`11-boot.js`): klokka og catch-up venter på `SIMREADY`, som settes når kartpakkene båtene trenger er lastet (4.6). `boottest.py` tester det.
- **Presisjon i 3D** (`view3d.js`):
  - Meshene i verden har hjørnene relativt til sitt eget origo `m.o` (`MB().mesh(o)`, `NB().mesh(o)`, `makeMesh`, `unitPatch`, bitene på 1 km og lysene deres). Modellmatrisen `relM(m)` er origo minus øye, regnet i doble tall.
  - Skyggerne regner verden fra gjengivelsesorigoet `RO`, et multiplum av 4 096 m nær øyet som flyttes først etter 40 km. Det gjelder:
    - bølgefasene og gruppefasene (`uGp`), regnet i doble tall per bølge
    - havets origo og sjøtilstandsrutene
    - kjølvannet
    - terrengets teksturkoordinater (`uPO`)
  - Bygg, fin kyst, veier, sjørokk og kjølvannets hekk lagres i Float64.
  - Uten dette blir Float32 6–12 cm grov 1 000 km fra origo, og bølgefasen går i stykker.
- **Bygget** (`build.mjs`) kompilerer hvert skript som helhet med `node:vm`, så et navn som er deklarert i to filer stopper bygget, ikke siden.

## 4.6 Kartdataene i pakker (kystplanen, fase K3, 02.10.2026)

- **Dyp til havs (07.10.2026, for blåkveita):** kjernelaget `deep` er havbunnen fra Terrarium (ETOPO1 til havs) på 1 km celler over hele rammen, i 10 m steg (u8, `dec:'x10'`, opp til 2550 m, 0 = land eller ingen data). `tools/map/deep.py` skriver det inn i kjernepakken i `src/data/map` (navnet og manifestet endres), og `tools/map/game.py` tar den nye kjernen for hele kysten. Kjør `deep.py` på nytt etter at `region.py` har skrevet en ny kjerne. `depthF` bruker laget utenfor kystflisene (`offDepth`), og inne i flisene der flisa har modellens fyllverdi i stedet for Kartverkets dyp og er dypere enn 150 m (`tileDepth`). Blokkbufferen har plass til 16 lag (`gridKey * 16 + id`).

Rasterkartene ligger ikke lenger i siden. Siden gikk fra 9,3 til 6,2 MB, og kartpakkene er 3,3 MB (2,8 MB i K3, før rammen ble 90 × 90 km i K4).

- **Bygget:** `node build.mjs` kaller `writeMap` i `tools/mappack.mjs`.
  - Den leser `src/data/geo-*.b64` og `hgt.b64` og pakker dem ut slik siden gjorde.
  - Fra K4 samples lagene om til den nasjonale rammen (4.7). Cellene telles fra rammens origo, så celle (ix, iy) med størrelse c dekker x i [ix·c, (ix+1)·c). Blokkene på 10 km og flisene på 50 km står dermed likt over hele kysten. For Senja går blokkene fra x 800 til 900 og y 310 til 400 km.
  - Avstanden til land regnes her fra den nye masken, ikke lenger i siden.
  - Pakkene lages bare på nytt når kildene endrer seg: dataene, `mappack.mjs` eller `00-proj.js` (`src` i manifestet). Første bygg tar rundt 4 s ekstra.
  - Hvert lag deles i blokker på 10 × 10 km, som pakkes hver for seg med deflate. 16-bitslagene (dybde og høyde) lagres som rest etter medianprediktoren, slik siden lagret dem før.
  - En pakke har blokkene av ett slag i én flis på 50 × 50 km:
    `'KMP1'`, u32 lengden på hodet, hodet som JSON (`{kind, tile, blocks:[[lag, bx, by, offset, lengde]]}`) og blokkene.
  - Filnavnet har de første 12 hex-tegnene av pakkens SHA-256 og endelsen `.wasm`, fordi artifacten avviser `.bin` (K1). `dist/map/manifest.json` lister lagene og pakkene.
- **Slagene:**

  | Slag | Lag | Lastes |
  |---|---|---|
  | `core` | `mask` (land, 25 m), `dc` (avstand til land, 100 m), `expo` (eksponering, 500 m) | alltid, før spillet starter |
  | `sim` | `depth` (dybde i halve meter, 50 m) | rundt båtene og redskapene før klokka går |
  | `view` | `hgt` (høyde, 25 m), `forest` (skog, 50 m) | til 3D, etter hvert som de kommer |

  - Det som ser langt, leser bare kjernen: strøklengdestrålene og den lokale flåtens drift og fiske. Derfor ligger 25 m-masken i kjernen. Den er 63 KB for Senja og anslått til rundt 10 MB for hele kysten. K6 kan gi de som ser langt en grovere maske.
  - Planen hadde masken i `sim`. `maptest` viste at strøklengdestrålene da leste pakker langt fra båten.
- **Lasteren** (`core/01b-mapdata.js`):
  - `mapStart` leser manifestet.
  - `mapLoad(pk)` henter en pakke én gang. Den lagres i IndexedDB (`kyst-map`) etter hashen, så en ny publisering bare henter det som er endret.
  - En blokk pakkes ut synkront med fflate (`src/js/lib/fflate.js`, MIT) første gang den leses. Den beholdes så lenge det er plass: `MAPD.budget` er 96 MB, og den som er brukt minst nylig, går først. Høydene er Float32, så 96 MB trengs til hele Senja i 3D. K8 gjør dem til Int16.
  - Lesing:
    - `rcell(L, ix, iy)` gir én celle.
    - `rbil(L, p)` interpolerer bilineært i km, med samme regning som `gridBilinear`.
    - `rbilM(L, x, z)` gjør det samme i meter.
    - `isLand`, `coastDist`, `depthF`, `exposure`, `swellFactor`, `approachPath`, ruta, sjøkartet, terrenget og skogen leser alle gjennom disse.
  - **Leser noe en blokk som ikke er lastet, er det en feil** (`MAPD.miss` telles). Spillet bruker aldri reserveverdier, så resultatet avhenger aldri av hva som tilfeldigvis er lastet.
- **Barrieren:**
  - `simAreaReady()` (`01b-mapdata.js`) krever at `sim`-pakkene er lastet innen `MAPD.simR` (4 km) fra hver båt du eier og 1 km fra midten av hvert redskap i sjøen. Det dekker ekkoloddet, sonaren og plotteren.
  - Mangler noe, bes det om, og `playMinutes` i `08-actions.js` stopper. Minuttene som gjenstår, står i `CATCH_LEFT`. `tick` spiller dem når pakken er kommet, uten å vente i `step()`.
  - `bootMap` i `11-boot.js` laster kjernen og `sim`-pakkene rundt de lagrede båtene, rutene deres, redskapene, havnene og feltene før `bootGame` leser lagringen. 3D laster `view`-pakkene i `init`.
  - Visninger som leser lenger ut, spør først med `mapViewReady` og tegner uten dybde til pakken er kommet: sjøkartet beholder det forrige bildet, og 3D-strandteksturen og plotteren tegner dypt vann. Varmekartet venter.
- **Testene går over HTTP:**
  - `tests/_env.py` starter en egen server for hver test på en ledig port, fordi `file://` ikke kan hente filer. Hver test får dermed sin egen opprinnelse og sin egen `localStorage`.
  - `KYST_DIST=<mappe>` tester et annet bygg enn `dist/`, og bygget skriver dit med samme variabel.
  - `tools/serve.py` serverer `dist/` for manuell testing.
- **`maptest.py`** holder igjen én `sim`-pakke (sletter den i siden og i IndexedDB, og holder svaret med `page.route`). Den sjekker at:
  - klokka stopper før båten kommer innen rekkevidde, og står stille så lenge pakken mangler
  - resten spilles når pakken kommer
  - turen ender nøyaktig som en tur med alt lastet (tid, sted, fangst, penger og logg)
  - ingenting leser fra en pakke som ikke er lastet

  Simuleringen trekker da fra en egen tilfeldighetsgenerator, så det siden trekker selv i mellomtiden, ikke forskyver den.

## 4.7 Over til UTM 33 (kystplanen, fase K4, 02.10.2026)

Dette er den eneste tilsiktede endringen i oppførsel i kartfasen. Spillets ramme er nå UTM sone 33 i km (4.5), og Senja ligger der den ligger på hele kysten.

- **Dataene:**
  - Vektorene (kystpolygonene, den fine kysten, veier, molo og kaier, sjømerker, bruer, dybdekurver og bygg) går punkt for punkt gjennom `LG`/`LGm` når siden lastes. Den eksakte projeksjonen tar rundt 0,5 µs per punkt.
  - Byggene dreies med `LGrot`. Retningene til havneenhetene dreies med `LGu`.
  - Rastrene samples om når bygget kjøres (`tools/mappack.mjs`, 4.6):
    - dybde, høyde (i meter mellom kodene), eksponering: bilineært
    - skog: nærmeste celle
    - avstand til land: regnet på nytt
  - Den omvendte projeksjonen erstattes der av et polynom av femte grad, med avvik rundt 0,1 mm.
  - **Masken** rastreres på nytt fra de fine kystpolygonene (`geo-fine.b64`) i den nye rammen. Der den gamle masken og polygonene er uenige, gjelder den gamle masken (holmer og skjær som polygonene mangler, og noen kaiender, 8 785 celler). Utenfor det gamle kvadratet brukes den gamle maskens nærmeste kantcelle.
  - Mot den gamle masken avviker 0,14 % av cellene, alle langs kysten.
  - Alle havnepunktene ligger i vann.
- **Utstrekningen:**
  - `MAPB` er boksen rundt det gamle kvadratet: x 810,0–892,0 og y 311,4–397,1.
  - Kvadratet er dreid 1,4–3,3°. I de smale trekantene mellom kvadratet og boksen står kantdataene strukket ut.
  - Utenfor `MAPB` er det land (`isLand`).
- **γ** (`gridGamma(p)`, per km-rute):
  - Simuleringen og 3D regner i rutenettet: kurs, strøklengdestrålene, bølgene og dønningen i 3D, drift og skipsbevegelsene.
  - Det som kommer inn som sann retning, dreies med −γ: vinden og dønningen inn i strøklengden og 3D, solens og månens asimut, og lyktsektorene.
  - Det mannskapet leser, vises som sann retning med `trueDeg(r, p)`: COG, HDG, peiling til WPT, kurs i ruta, «Ny kurs» i loggen, navigasjonsloggen og kursen når redskap settes.
  - Vindretningen i teksten er sann, slik den alltid var.
- **Fisken:** støyfeltene (patcher, stimer, døgnvariasjon) og dybdemodellen regnes i nasjonale km. Feltene har de samme statistiske egenskapene, men ligger andre steder:
  - hyse i februar: snittet over havet 0,169 mot 0,178 (−5 %), og den beste prosenten 0,495 mot 0,557
  - snittet tar også med de smale trekantene i hjørnene av boksen, så det er 9 % flere sjøceller
  - `geartest` måler nå linefisket på de åtte beste hysestedene i stedet for det ene beste, fordi ett sted alene svinger fra 50 til 110 kg per balje
- **Krabbeområdet** var et belte fra 35 til 75 km sør for 69,72° N. Fra 04.10.2026 er det kongekrabbens utbredelse (`kingArea`, se «Kongekrabbe» under redskapene). **Fiskerifeltene** (`fieldCode`) og offshore-strøklengden utenfor kartet (`offMapFetch`) regner fortsatt i gamle km gjennom `LGI`.
- **Bestanden** er glissen: `S.stock` og `S.cstk` holder bare 2 km-rutene under 1, med `gridKey` i den nasjonale rammen (`stkGet`, `stkSet`, `stockFill`). `stockHour` går over disse rutene og naboene deres.
- **Lagringen v2:**
  - Nøkkelen er `kystfiske_v2`. Et spill i `kystfiske_proto_v1` (v1) leses én gang og flyttes over med `migrateV2`, og v1-lagringen blir stående.
  - `migrateV2` sender alle punkter `{x, y}` i lagringen gjennom `LG`. Det gjelder båt, plan, kladd, spor, merker, navigasjonslogg, redskap i sjøen, driftsplan og veiledningen.
  - Kursen til båtene dreies med rammen.
  - Bestandsrutenettene på 40 × 42 i den gamle rammen blir glisne nasjonale ruter. Der to gamle ruter havner i samme nye, brukes den laveste verdien.
  - Lagringen får `v:2` og `frame:'utm33'`. Oppstarten sjekker deretter, som før, at ingenting ligger på land.
  - `mig2test.py` lager et v1-spill av et v2-spill med `LGI` og leser det inn igjen. Alle posisjonene (23, i sju slags felt) havner innenfor 1 m, kursen og bestanden følger med, og v1-lagringen er urørt.
- **Testene:** `routes.json` er regnet om til den nasjonale rammen. Testene sender fortsatt gamle km gjennom `LG()` i siden. `KYST_SHIFT` er borte.

## 4.8 Kartrørledningen (kystplanen, fase K5, 02.10.2026)

Kartdataene lages i `tools/map/` (i git, uten dataene). Mellomlageret ligger i `tools/map/cache/` og resultatene i `tools/map/out/`, og ingen av dem er i git.

- **Kildene:**

  | Kilde | Hva | Status |
  |---|---|---|
  | Overture 2026-09-23.1 | land (OSM-kysten), arealdekke (skog), bygg, veier, kaier, landegrenser | åpen |
  | Terrarium | z13 (Kartverkets 10 m-terreng i Norge), z11 grovere | åpen |
  | Geonorge | dybde 50 m (`bathymetry50m`) og DTM10 | stengt fra miljøet |
  | Overpass | sjømerker med lyktsektorer, skjær | stengt |
  | Tidevannet (`api.sehavniva.no`) | | stengt |

  - Terrariums sjøbunn duger ikke som dybde. Ved z13 er sjøen 0, og de grove nivåene (z8–z9) har bare 0,3 i korrelasjon med Kartverkets dybde rundt Senja.
- **Filene:**
  - `ov.py`: filliste, indeks over radgruppene som berører Norge (`python3 tools/map/ov.py index`), og `features(type, boks, kolonner)` med HTTP-delhenting og mellomlager per radgruppe.
  - `frame.py`: den nasjonale rammen (pyproj EPSG:25833), den gamle Senja-rammen og regioner i hele 10 km-blokker.
  - `terrain.py`: Terrarium, samplet bilineært i lat/lon.
  - `legacy.py`: de gamle Senja-rastrene (dybde, eksponering), dekodet av `readSenja` i `tools/mappack.mjs`.
  - `pack.py`: kartpakkene (formatet i 4.6), `write` for en region, `write_tiles` for kystflisene, og `read_layer` for sjekker.
- **Senja** (`python3 tools/map/region.py senja`) skriver `src/data/map/`, som er i git (3,9 MB). `node build.mjs` kopierer den til `dist/map/`.
  - **Maske 25 m** fra Overture-land. Inne i det gamle kvadratet avviker den fra K4-masken i 0,43 % av cellene, og 97 % av dem ligger i kystlinja. Utenfor kvadratet ligger nå ekte data i stedet for strukket kant.
  - **Avstand til land** (100 m) er euklidsk.
  - **Terreng 25 m** fra Terrarium z13 (før z11). Det er over 0 på land og under 0 på sjøen etter masken.
  - **Skog 50 m** fra Overture (ESA WorldCover): 25 % av ruta mot 0,2 % før. Det gir rundt 20 % flere trær i 3D.
  - **Dybde og eksponering** kommer som før fra de gamle Senja-rastrene.
  - Bygget tar 30 s med varmt mellomlager.
- **Fyllingen av polygonene** (`fill` i `region.py`):
  - En celle er land når sentrum ligger inne. Fyllingen er partall/oddetall per polygon, så hull blir hull, og den er sjekket mot punkt-i-polygon.
  - PILs fylling tok med hver celle en kant rørte, så landet vokste opptil én celle. På 200 m-masken var det opptil 200 m, og i Gisundet stengte det testruta.
- **Terrenget i sjøen** er sjøbunnen fra dybdelaget. Terrarium har sjøen på 0 ved z13. Det ga −0,5 m overalt, som 3D tok for grunner og tegnet skum på (66 % mot 12 % i `sea3d`).
- **Den nye kysten i Gisundet:** OSM fra 2026 har et 40 m smalt landstykke ved 69,3075° N 17,984° Ø, der den gamle kysten hadde vann. Testrute 4 (`tests/routes.json`) har fått vendepunktet sitt flyttet 150 m vest.
- **Vannet foran kaiene** (`inHarbourPocket` i `01-world.js`):
  - Havneenhetens basseng og 50 m ut fra designerens kaifront (`QUAYS`, bare Finnsnes har ingen enhet) er vann, både i `isLand` og i terrenget i 3D.
  - **Finnsnes:** OSM-kysten fra 2026 ligger 30–45 m ute foran kaifronten designeren tegnet etter flyfoto 29.09.2026. Det kan være en ny utfylling eller en kai som ikke er på bildene. **Bør sjekkes på stedet eller mot nyere bilder.** Inntil videre gjelder designerens kai, og vannet foran den.
- **Hele kysten** (`national.py`, `coast.py`) går i trinn, som hver lagrer resultatet sitt:
  1. `national.py mask200`: land over hele rammen (1 450 × 1 720 km) på 200 m, også Sverige, Finland, Russland og Danmark, slik at strålene ser ut mot havet.
  2. `national.py tiles`: 50 km-flisene med norsk sjø innen 20 km fra land eller norsk land innen 3 km fra sjøen. Norges land og sjø kommer fra Overtures landegrenser.
  3. `national.py expo`: eksponeringen på 500 m. 48 stråler på 200 m-masken, og eksponeringen = 0,585 × middelet av åpen andel innen 10 km + 1,009 × andelen stråler som er åpne ut til 150 km. Modellen er tilpasset de gamle Senja-rastrene: korrelasjon 0,95 (testet på halvparten), og feilen er 0,125 på en skala fra 0 til 1.
  4. `coast.py`: lett utgave per flis med maske 25 m, avstand 100 m, terreng 25 m (z13 i blokkene innen 3 km fra sjøen, z11 ellers), skog, eksponering og dybde.
     - Dybden er Kartverkets inne i det gamle Senja-kvadratet. Ellers er den spillets egen dybdemodell, med støyen overført bit for bit, til Geonorge er åpen.
     - Pakkene havner i `out/national/lite/`, med kjerne per flis.
     - Spillet tar dem i bruk i K6–K8: lasteren må kunne laste kjernen per flis, og ha faste verdier for blokker uten pakke (innland og åpent hav).

## 4.8b Kartdataene for hele kysten i GitHub Actions og releaser (02.10.2026)

Jonas valgte 02.10.2026 å la GitHub bygge og lagre de nasjonale kartdataene. Git har bare koden og Senja-pakkene.

- **`.github/workflows/kart.yml`** kjører rørledningen på GitHubs maskiner, der nettet er åpent. Repoet er offentlig, så det er gratis.
  - **`national`:** Overtures indeks og de nasjonale trinnene (land på 200 m, kystflisene, eksponeringen, fjernhøydene).
  - **`tiles`:** flisene fordelt på `parts` deler (12) side om side, med `coast.py cache k n`.
  - **`pack`:** pakkene for alle flisene (`coast.py lite`) og releasen `kart-<kjøringsnummer>` med `kart-lite.tar.gz` og `manifest.json`.
- **Start:** en push som endrer `tools/map/kart.json`, på en hvilken som helst gren (endre `run` for å bygge på nytt), eller for hånd fra Actions-fanen når fila ligger på `main`.
- **`python3 tools/map/release.py [tag]`** henter den nyeste (eller den nevnte) releasen og pakker den ut i `tools/map/out/release/<tag>/lite`. Nedlastingen fra GitHub virker fra skymiljøet.
- **Første kjøring** (02.10.2026, 21 minutter): releasen `kart-1` med 168 fliser og 672 pakker, 217,7 MB. Det er flere filer enn én artifactversjon kan ha (511), så pakkene må slås sammen før den lette utgaven publiseres (K11).
- **Ikke ennå:** Bygget tar ikke pakkene fra releasen ennå. Det kommer med den lette artifacten og PWA-en i K11. Geonorge (dybde 50 m, DTM10) og Overpass kan nå kjøres i workflowen, men rørledningen bruker dem ikke ennå.

- **Ekte havbunn (03.10.2026):** `.github/workflows/dybde.yml` henter dybdemodellen «Dybdedata – terrengmodeller 50 meters grid» (Kartverket, CC BY 4.0) fra Geonorges WCS. Den brukes for hver kystflis (`tools/map/dybde.py`, `dybde.json`).
  - **Tjenesten:** `https://wms.geonorge.no/skwms1/wms.dtm2`, coverage `bathymetry50m`, EPSG:25833. Den skaleres til spillets 1 000 × 1 000 celler.
  - **Lagringen:** desimeter. 0 betyr at det ikke finnes data.
  - **Releasen:** `dybde-2`, alle 168 flisene, 86 MB.
  - **I rørledningen:** `coast.py` bruker dybden (`kartverket()`), og dybdemodellen der Kartverket ikke har data, blandet over 250 m i kanten. Inne i Senja-ruta står de gamle dataene, som er fra samme kilde (korrelasjon 1,0, medianavvik 0,1 m).
  - **Kartdataene:** `kart.yml` henter releasen som `kart.json` peker på (`depth`). `kart-3` ble 250 MB, over grensen for en artifact. Derfor rundes dybden i `kart-4` av grovere på dypt vann (`qdepth`: ½ m til 20 m, 1 m til 60 m, 2 m til 150 m og 5 m dypere).
  - **Høydereferansen** er ikke sjekket. Den er antatt å være den samme som i Senja-dataene, siden tallene stemmer.

## 4.9 Kjernen for hele kysten (kystplanen, fase K6, 02.10.2026)

- **Den nasjonale kjernen** ligger i `core`-pakken og lastes alltid. Den er 2,9 MB og lages av `national.py core_layers()`, som `region.py` legger ved:

  | Lag | Innhold |
  |---|---|
  | `land200` | land på 200 m over hele rammen (Norge med naboland, til 1 750 km sør), fra Overture |
  | `dc200` | avstanden til land på 200 m, i 100 m-steg til 25,5 km (u8) |
  | `expo` | eksponeringen på 500 m (4.8). Utenfor kystflisene er åpen sjø 255. Den erstatter de gamle Senja-rastrene, også på Senja: feltene utenfor ble litt mindre åpne (0,93/0,82/0,91 mot 0,95/0,90/1,00) og fjordfeltene litt mer (0,31–0,40 mot 0,23–0,28). |

  Lagene står i blokker på 50 km (`n` per lag i manifestet).
- **Detaljflisene** (`sim`) har nå `mask` (25 m), `dc` (100 m) og `depth` (50 m). `mapSimAt(p)` sier om flisen til p har detalj, og `mapViewAt(p)` det samme for terreng og skog.
- **Leserne:**
  - `isLand`, `coastDist` og `depthF` bruker detaljen der flisene har den, og pakken må da være lastet (barrieren). Ellers bruker de kjernen: land på 200 m og dybdemodellen (`depthModel`, med eksponering og `coastDistFar`).
  - `isLandFar` og `coastDistFar` leser bare kjernen. Det gjør det som ser langt:
    - strøklengdestrålene og -rutene (`fetchRay`, `fetchAt`, `fetchCell`)
    - den lokale flåtens drift
    - fisket på de kjente feltene
    - dybdemodellen
  - `isLandUI` er for skjermene: et trykk i kartet og ruteredigeringen. Den bruker detaljen hvis pakken er lastet. Ellers bruker den kjernen og ber om pakken.
- **Strøklengden:** strålene går på kjernen, stopper på 200 m-land, og får havets 600 km der de går ut av rammen. `offMapFetch` (Andøya, Kvaløya) er borte. Fra feltet nord for Husøy er strøklengden mot vest nå 530 km (før 257), fordi strålene ser havet utenfor Andøya.
- **Rammen:**
  - `MAPB` er hele rammen (0–1 450 × 0–1 720 km), og du kan seile overalt.
  - `HOME` er Senja-boksen. Den brukes til startutsnittet, målet for zoom i 2D (`MAP_W`, `MAP_H`) og de vide meshene i 3D (det fjerne terrenget og sjøtilstanden), til K8.
- **Utenfor detaljflisene:**
  - Sjøkartet tegner land fra kjernen og dybden fra modellen, med kysten fra `coast0` over (4.10).
  - 3D bruker fjernhøydene på 200 m fra K8 (4.11), og en flat stedfortreder fra kjernen til de er lastet.
- **Rettet etter regresjonen** (02.10.2026):
  - **Moloene** er land i 25 m-masken. De ligger i Overtures `base/infrastructure` (klasse `breakwater`, OSMs `man_made=breakwater`) og ikke i kystlinja. Fyllingen etter cellesentrum mistet dem som var smalere enn en celle, og ruta gikk rett gjennom moloen på Husøy. De fylles nå med en halv celle ekstra bredde (93 moloer i Senja-flisene).
  - **Strøklengden nær land:** 200 m-kjernen ser ikke moloene eller de smale sundene, og Husøy havn ligger i en 200 m-landcelle. Feltet tok da havet utenfor for havna (1,6 m sjø inne i havna i NNV 11 m/s). Innen `FETCH.near` (1 km) fra kjernens land går strålenes første `FETCH.fine` (1,5 km) på 25 m-masken (`fetchFine`, `fetchHere`), og kjernens stråler går videre derfra.
    - Det gjelder bare der flisens detalj er lastet. Den er alltid lastet rundt båtene og redskapen (barrieren), som er der simuleringen spør etter sjøen, så simuleringen blir lik uansett hva annet som er lastet.
  - **Dybden utenfor det gamle Senja-kvadratet:** Senja-flisene går utenfor kvadratet, og der ble Kartverket-rasteret lest med kanten dratt bortover (lyseblå striper i kartet vest for Senja). Der brukes nå dybdemodellen, slik `coast.py` gjør for kystflisene.
  - `seatest` forventer den nye eksponeringssummen (19 452,4477, 2,0 % over den gamle). Endringen kom med den nasjonale eksponeringen i K6 og er tilsiktet.
- **Ikke ennå:**
  - Autoruta («Følg leia», nå Autonav) leste 100 m-avstanden over hele `dc`-laget. Det er løst med vinduet i K9 (4.12).
  - Detaljflisene for hele kysten (`out/national/lite`) er ikke i git, og bygget bruker dem ikke ennå.

## 4.12c Sjømerker langs hele kysten (05.10.2026)

Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av norge ha også. Dette er ikke en senja-simulator».

- **Kilden** er OpenStreetMaps seamark-tagger (OpenSeaMap; i Norge for det meste fra Kystverkets data), hentet med Overpass. Overpass er stengt for skyøkta, men åpen i Actions.
  - `tools/map/sjomerker.py fetch` henter i ni bånd langs kysten og gjør dem om til den nasjonale rammen (km), i formatet til `src/data/seamarks.json`:
    - **lykter** `[x, y, høyde m, rekkevidde nm, rytme (+ på, − av, sekunder), sektorer [[fra°, til°, farge]], 'M'|'m', navn]`. Sektorene er sanne peilinger fra sjøen mot lykta, som OpenSeaMap har dem. Rytmen kommer fra `sequence`, ellers fra karakter og periode (Fl, LFl, Oc, Iso, Q, VQ, F).
    - **merker** `[x, y, type, kategori]`: M fyr, m lykt, P påle, D stake (fare eller spesialmerke), L lateralstake, B bøye, C kardinalbøye, S kardinalstake, K varde. Kategorien er port/starb eller north/east/south/west.
    - **skjær** `[x, y]` (`seamark:type=rock`).
  - `.github/workflows/sjomerker.yml` startes av en endring i `tools/map/sjomerker.json` eller `sjomerker.py`, og legger `sjomerker.json.gz` i releasen `sjomerker-N`.
  - **Kilden i Actions** er Geofabriks `norway-latest.osm.pbf` (1,4 GB), filtrert med osmium (`sjomerker.py pbf`). Overpass ga 504 på det første båndet langs kysten, og beholdes som reserve (`fetch`).
  - **`sjomerker-2`** (05.10.2026) har 7 809 lykter, 23 878 merker og 98 056 skjær, 1,16 MB komprimert. Merkene fordeler seg slik:
    - 13 520 staker (D)
    - 3 267 lateralstaker (L)
    - 2 338 lykter (m)
    - 2 227 bøyer (B)
    - 2 046 påler (P)
    - 331 kardinalbøyer (C)
    - 82 varder (K)
    - 67 fyr (M)

    Sjøkartpakkene vokste fra 9,6 til 10,8 MB.
- **I kartpakkene:**
  - `tools/map/release.py` henter den nyeste `sjomerker-N` sammen med kartreleasen.
  - `tools/map/game.py` (`marks_by_tile`) legger hver flis' merker inn i flisas sjøkartpakke som oppføringen `marks` (JSON, raw deflate, ved flisas første blokk).
  - Sjøkartpakkene er med i artifacten, så sjømerkene er det også. En ny release endrer bare sjøkartpakkene.
- **I spillet** (`core/01e-marks.js`):
  - `marksAdd` leser en flis' merker når pakkens kyst bygges (`coastDone`). Det skjer rundt alle båter og sett (simuleringens sperre), over kartplotterens vindu, langs Autonav-veien og rundt 3D-visningen.
  - Inne i Senjas gamle rute gjelder de innebygde `SEAMARKS`.
  - `marksNear(kind, x, y, R)` gir lyktene, merkene eller skjærene fra `SEAMARKS` og flisene innen R km.
  - `rocksIn` tar med flisenes skjær per 1 km-celle (`marksRocksIn`). Dermed teller de for grunnstøting og for Autonav (`leiaRocks` bruker nå `rocksIn` over rutenettets boks).
  - Kartplotteren tegner lykter og merker fra `marksNear`.
  - Hindringene for rutene (`11b-obstacles.js`) tar med merkene, og indeksen bygges på nytt når `MARKS.ver` endres.
  - **3D:** `markInto` bygger et merke som før. Kystens merker får et nett per flis (`marksStatics`) når flisas terreng er lastet. Lyktene blinker etter `lightLP`: Senjas fase er som før etter rekkefølgen, og kystens etter posisjonen. De tegnes fra `marksNear` rundt øyet (sektorlys innen 50 km, lys som lyser opp innen 5 km og fyrstråler innen 26 km).
  - **Lysets høyde** (07.10.2026, `lightY`): høyden i dataene er lysets høyde over havet, så lyset tegnes der, men aldri lavere enn 4 m over terrenget. Før ble høyden lagt oppå bakken, og et fyr på en knaus hadde lyset langt over tårnet.
  - **Fyrene** (07.10.2026): de 134 fyrene i `src/data/fyr.json` (se 4.26) får et rundt tårn i 3D (`fyrInto`): hvitt med rødt bånd under gangen, mørk gang med rekkverk, lanterne og rødt tak. Lanternen står der lyset er, så tårnet er så høyt som det trengs over terrenget (høyst 40 m). Der et fyr fra registeret står, tegnes ikke kassetårnet til merket `M`.
- **Testene** er `tests/marktest.py` (Tromsø: flisas merker lest, sektorer og rytme, ingen inne i Senja-ruta, skjær i `rocksIn`, hindringene og kartplotteren) og `tests/coast3d.py` (lyktene utenfor Tromsø om natta).

## 4.13 Hele kysten i bygget (03.10.2026)

- **Releasen i spillets format** (`coast.py game`, `kart-2` og senere): per flis `sim` (maske 25 m med moloene, avstand 100 m, dybde 50 m), `view` (terreng 25 m, skog 50 m) og `chart` (kyst på 25 m og 3 m, stedsnavn), slik `region.py` lager Senja. `kart-1` var i K5-formatet (maske og avstand i en kjerne per flis, ingen sjøkart) og brukes ikke av bygget.
  - Moloene (`region.breakwaters`) er nå med for hele kysten.
  - Flisjobbene i workflowen lager kysten og navnene per flis (`chart_tile`, mellomlagret i `out/national/chart/`), og pakkejobben skriver `kart-game.tar.gz`.
- **`tools/map/game.py`** setter sammen pakkene til bygget i `tools/map/out/game/` (ikke i git):
  - kjernen og fjernhøydene fra `src/data/map` (`region.py`)
  - Senjas fliser derfra også, men blokk for blokk sammen med releasens: Senja-regionen begynner på y 310 km, flisene på 300, så raden 300–310 kommer fra releasen
  - alle andre fliser fra releasen
  - de små pakkene slått sammen, så artifacten holder seg under 511 filer per versjon: fjernhøydene 4 × 4 fliser per fil og sjøkartet 2 × 2. En sammenslått pakke har `tiles` i manifestet.
  - Lagene for flisene dekker hele rammen (releasens utstrekning).
- **`python3 tools/map/release.py`** henter den nyeste releasen (`game/`), og `python3 tools/map/game.py` setter sammen. `node build.mjs` tar `tools/map/out/game/` når den finnes, ellers `src/data/map` (bare Senja), eller det `KYST_MAP` peker på. Den skriver ut hvilken.
- **Lasteren** (`01b-mapdata.js`):
  - En sammenslått pakke føres under hver av flisene sine som en egen pakke (`of`) som lastes gjennom den.
  - `mapHasM` hopper over blokker i fliser uten pakke (innlandet, åpent hav), så 3D ikke venter på dem.
  - Sjøkartets mellomlager er per pakke og flis (`chartPath`, navnene).
- **Bygget for hele kysten** (`kart-2`): 168 fliser med detalj, 424 kartpakker og manifestet. Det er 195 MB kart pluss en side på 6,2 MB.

  | Slag | Pakker | MB |
  |---|---|---|
  | `sim` | 168 | 60,8 |
  | `view` | 168 | 113,6 |
  | `chart` | 62 | 12,1 |
  | `far` | 25 | 5,2 |
  | `core` | 1 | 3,3 |

  En spiller laster bare pakkene rundt båten (og kjernen), og de lagres i IndexedDB.
- **Rettet etter regresjonen med hele kysten:**
  - Telefonens dekning (`coverage`) leste den detaljerte avstanden til land, som krever at pakken er lastet. Den bruker nå kjernens (`coastDistFar`): det er kilometre, og en skjerm skal aldri vente på en pakke.
  - Testene som flytter båten rett til et sted (`teleport3d`, `tidetest`, endepunktene i `routetest`), laster nå detaljpakkene der først, slik barrieren gjør før en båt kommer dit. En båt som seiler, kommer aldri inn i en flis som ikke er lastet, fordi barrieren laster 4 km rundt den før klokka går.
  - Kartblokkene fyller nå hele budsjettet (96 MB) etter seks steder, og det eldste går ut. `teleport3d` sjekker at budsjettet holder.
- **Kameraet ved kaia** (`view3d.js`): ved lavvann ligger en båt ved kaia rundt 3 m under kaikanten, og en løfting på 57° var ikke nok til å se over kanten (`camtest`, Botnhamn, med tidevannet fra K10). Kameraet kan nå løftes nesten rett ned over båten (1,45 rad).

## 4.19 Vektorkysten gjelder (04.10.2026)

Jonas: «Jeg vil ha bort det som er i magenta», og vannlinja skal være nøyaktig nok til at skjær og moloer stemmer. Fra nå er vektorkysten (`coast2`) fasiten for land og sjø i hele spillet, ikke 25 m-masken.

- **Dataene** (`tools/map/chart.py`, `coast2`):
  - Overtures landbiter slås sammen per flis (`unary_union`) før de forenkles til 3 m. Før ble hver bit forenklet for seg, og sømmene mellom dem ble glipper på opptil 3 m, som en landsjekk ville sett som vann.
  - Skjær ned til 4 m² beholdes (før 50 m²).
  - Moloene (`base/infrastructure`, klasse `breakwater`) utenfor landet kommer som egne ringer: klasse 2 (ytre) og 3 (hull). Flater brukes som de er tegnet, og linjer blir 12 m brede, som er et anslag. Mange moloer ligger allerede i OSM-kysten, for eksempel i Botnhamn, rundt 8 m brede. Masken gjorde dem 25 m brede.
  - Senjas kartpakker er bygget på nytt med `region.py senja`. Hele kysten bygges av `kart.yml` (`run` 8 i `kart.json`), og mellomlageret heter nå `coast2u-*`.
  - En flis med ny `coast2` har 504 ringer der den før hadde 1 060.
- **Kystindeksen** (`core/01d-coast.js`, `COAST`):
  - Hver kartflis får en indeks når pakken kommer (`coastEnsure`), laget i en worker (`coastBuild`). Flisa deles i ruter på 100 m. Hver rute har vindingstallet i hjørnet, med land og moloer talt hver for seg etter nonzero-regelen, og kantene som berører den.
  - Svaret i en rute med kanter regnes eksakt ved å telle kantene en krysser på vei fra hjørnet, ned langs rutas venstre side og bort til punktet. Hjørnene ligger utenfor hele meter (`COX`, `COY`), der punktene i dataene ligger.
  - `coastAt(p)` gir 1 (land), 2 (molo), 0 (sjø) eller −1 (ingen fin kyst). `coastDistM(p)` gir avstanden til kysten innen 100 m. `coastSegHit(a, b)` sier om en rett strekning krysser kysten.
  - **Målt for Senjas fire fliser:** 1,4 s i workeren til sammen, og 200 000 `isLand` på 73 ms (0,4 µs hver).
  - **Barrieren:** kartpakkene lastes rundt båtene, og indeksen er en del av `mapReadyAt`, `mapNeed`, oppstarten og autonav (`leiaFind1`). Simuleringen leser derfor aldri en flis uten indeks (`maptest`). Skjermene kan tegne ruter over fliser ingen har bedt om. Der gjelder masken til indeksen er klar (`COAST.soft` teller det).
- **Landsjekkene:**
  - `isLand` bruker indeksen der flisa har kartpakke, ellers masken. Havnelommene og mottakenes fyllinger gjelder som før.
  - Moloene er 8–12 m brede, og prøvene i `legClear` (hver 40. m), `groundCheck` (20 m), `clearLine` og `leiaLegOk` (8 m) og rorhjelpen (10 m) kunne gå rett over dem. Alle sjekker nå også strekningen med `coastSegHit`. Søkene i `approachPath` og `berthPath` gjør det mellom nabocellene, og en celle er land der `isLand` sier det om midten.
  - **Dybden** (`depthWater` i `03-simulation.js`): dybdelaget har 0 på maskens land. Nå regnes dybden bare av vanncellene, så vannet rett ved kysten har dybden til sine egne celler i stedet for å gå mot 0, ellers ville båter gått på grunn i vann kartet viser. Der alle fire cellene er land, brukes vanncellene to ruter ut. Der det ikke er noen, er dybden 2 m, som er et anslag for et sund masken tettet.
- **Kartplotteren:** masken tegnes ikke lenger som fjære (`chartRaster`). Landet er bare vektorkysten, med moloene. Bare mottakenes fyllinger males i rasteret, i samme farge som landet.
  - Piksler dypt inne i maskens land (cellen og de fire naboene), og der den indekserte kysten sier land (`coastAtIf`), males i landfargen uten at dybden regnes. Land fikk B-splinen for dybden og gjorde fjordnivået tregere.
  - **Tegnetiden i `charttest`** varierer mye i testmiljøet, også på nivået for hele landet, som ikke er endret: 0,49–0,74 s for første bilde med både gammel og ny kode, og fjordnivået 1,5–2,9 s, mot grensene 0,6 og 2,5 s. Bør måles på nettbrettet.
- **3D** (`view3d.js`):
  - `stream3d` laster kartpakkene innen 14 km og bygger indeksen. Når den kommer, bygges terrengnettene over flisa på nytt.
  - **Fjæra, én profil for alt (12.10.2026, tilbakemelding #61; avløser 1:1-rampa og den svart-hvite landmasken):** sjøkartets kystlinje (`coast2`, `coastSdIf` = signert avstand, + på land) bestemmer hvor bakken møter sjøen, for nettene, fysikken, kuttet i terrengskyggeren og skummet i havskyggeren. På linja og innover er bakken minst `COAST3.top` = 2,0 m (over høyeste astronomiske tidevann langs kysten, 1,75 m i Øst-Finnmark, med rom for teksturens byte og blandingen ved linja; linja er omtrent middel høyvann). Utover faller fjæra 1:3 (`COAST3.g`; moloenes steinfylling 1:1,5, `gMole`, der nærmeste kant er en molos, `COAST.mole` fra `coastDistQ`, i tekstur og nett likt) ned til `COAST3.deep` = −2,5 m, og så flisenes bunn, holdt under −2,5 m. Vannlinja er der tidevannet treffer rampa: på linja ved flo, (2,0 − tidevann) × 3 m utenfor ved fjære, med tang og rur (`recolor`, `TER_FS`) tørrlagt imellom. `terrRaw(x, z, dil)`: de grove nettene (12–47 m) er flate på 1,7 m fra linja og én celle ut før rampa, så en trekant over linja aldri dupper under vann innenfor den (sjøen bet seg inn i tagger på opptil en halv celle); det fine nettet (4 m) bærer rampa selv, og havnelappene (`unitPatch`) legges på det fine nettets profil der det dekker dem (ellers nærnettets) og bygges om når det flytter seg. `terrH` (båt og kamera) spør uten `dil` og får rampa rett fra linja. Fargene: sandbåndet i `TER_FS` ligger nå bare på fjæras øvre del (1,2–2,1 m, ikke 1–3,6 m) og strandblandingen i `recolor` over de nederste 3,5 m (ikke 6), så flatt land ved kaiene ikke blir blekt (symptom 4 i #61).
  - **Fjæreteksturen** (`buildLandMask`, `lmStep`; 2048 × 2048 over nærnettet, 4096 på ultra, 1,5–6 m per piksel; LUMINANCE, høyde = r × 8 − 4 m, ingen mipmap, LINEAR): fjæras egen høyde etter profilen, tegnet med canvas: sjøen svart (−4 m), kystringene strøket bredest først i trinn på en halv meter høyde (landringene 1:3, moloringene klasse 2/3 1:1,5; `chartPathsIn` i `03a-chart.js` henter bare ringene som berører vinduet, en hel flis hadde 184 000 punkter ved Frøya), alle i høydens rekkefølge så nærmeste strand vinner der to møtes, og landet fylt over dem på 2,0 m, så rampa ligger på sjøsiden alene (mottakenes fyllinger får sin egen rampe, 1:1,6 som `unitTerr`, under landfyllet). Så bassengene og lommene foran kaiene som dypt vann (−4) og kaiblokkene og fyllingene som land én piksel bredere enn de er, så kuttet aldri biter i et dekk. Størrelsen holdes under `MAX_TEXTURE_SIZE`. Tegnes noen strøk per bilde (`LMSLICE` = 9 ms, fra `updateNear`); teksturen i bruk (`LMTEX`, `LRECT`) står til den nye er ferdig. `G3._debug.maskMs` gir byggetiden, `G3._debug.landMask` lerretet.
  - **Kuttet og skummet:** terrengskyggeren (`TER_FS`) kaster bakke mellom 3,5 m under og 4 m over tidevannet der teksturen ligger under tidevannet minus oppskyllet (`uLand`, `uTideY` holdt under linja, `uSwash` = halve bølgehøyden, høyst `COAST3.swash` = 0,8 m, så bakken møter vannet også i bølgedalene; én vanlig `texture2D`, ingen mip-bias: likt på SwiftShader, Adreno, Mali og Apple). Havskyggeren (`SEA_FS`) leser dybden over fjæra fra samme tekstur (`uLandS` på enhet 6, `uLRect`, `uLSOn`): skumbeltet (`band`, bredde 0,3 m + 1,4 × bølgehøyde i dybde) ligger på vannlinja og flytter seg med tidevannet, og det grunne grønnskjæret med. Utenfor rampa (under −3,9 m) brukes høydekartet `HTEX` som før, bortsett fra der det viser det grove nettets flate celle ved linja (bunn over 1 m): den er ingen grunne og regnes 3 m dyp. Uten tekstur (fliser uten kartpakke) møter bakken sjøen der den er.
  - **Kjente begrensninger:** et naturlig sund smalere enn 2 × (1,7 − tidevann) × 3 m (19 m ved −1,5 m) tørrlegges i 3D selv om kartet viser vann der, og Autonav seiler det. Utenfor det fine nettet (500 m fra båten) står den flate cella på 2,0 m til kuttet, så ved fjære ender landet i en kant på opptil 3,5 m over vannet der, ikke i en rampe. Ved flisegrensene (indeksen søker bare i egen flis) kan nettets rampe mangle en stripe der teksturen har den. Rorbuenes og naustenes kaier (`SITES`) er ikke i teksturen. Agentgjennomgangen 12.10.2026 (sju motbevis, to alternativer, fullstendighetskritikk) ligger til grunn for 2,0 m, moloenes helning i nettet, havnelappene på det fine nettet, oppskyllet og fargene. Innsjøer som er hull i `coast2`, lavere enn tidevannet + 4 m, kuttes som sjø (som før).
  - **Det fine terrenget rundt båten** (`FINEM`, `fineWanted`): 1 024 m med rundt 4 m mellom punktene (768 m på lav kvalitet), der nærnettet har 12–47 m. Nærnettet har et hull under det. Ellers ble en 8 m bred molo, som ved Hamnskjæret i Botnhamn, flekkete eller borte.
  - **Moloene:** de som ligger i OSM-kysten, blir terreng. De som er tegnet som molo (Senjas `PIERS` type 1 og vec-pakkenes `molos`), bygges som før som steinfyllinger, som på Husøy.
  - **Kontrollbilder** (`probe/coast3d.py` i kladdemappa): Botnhamn, Husøy og Senjahopen før og etter.
  - **Historikk #61 (12.10.2026):** første retting ga nettene flat grunn én celle ut og kuttet mot en svart-hvit maske lest fra en mip. Lest fra en grovere mip på avstand kuttet den tynt land og åsene bak, og 1:1-rampa (3 m bred) sto igjen som en brun strek i vannet ved fjære (tang-båndet −0,6…1,5 m på bakke over vannet; sjøen er ugjennomsiktig og tegnes sist, så alt mørkt «i vannet» er bakke over vannflata), med skummet fra høydekartet ved siden av. Feilsøking: `tests/shore_edge.py` (nær, ovenfra, foam-debug og 1 km, ved fjære og flo, flere steder, før/etter med `TAG` og `KYST_DIST`), `tests/shore_tex.py` (teksturen målt mot `coastSdIf`: rampa, vannlinja, byggetid), `tests/shore_probe.py`, `shore_havoy.py`, `shore_mask.py`, `shore_cmp.py`, `shore_top.py`, `shore_foam.py`.
