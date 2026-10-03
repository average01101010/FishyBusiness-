# Kystfiske

Et kystfiskespill fra Senja som kjører som én selvstendig HTML-side, publisert som artifact. Brukeren skriver norsk; svar på norsk. Koden og kommentarene i den er på engelsk.

**Les `docs/OVERLEVERING.md` før du endrer spillet.** Den har visjonen, arbeidsmåten, arkitekturen, alle systemene med tall, regelverket, kjente problemer og flåteplanen. Spesifikasjonen for fiskerisystemet ligger i `docs/spesifikasjon.md`.

## Arbeidsmåte

- **Fart foran finpuss** (brukerens valg 01.10.2026): Endringene skal inn raskt, og finpuss og feilretting gjøres samlet etterpå.
- **Grafikken er nesten det viktigste** (brukerens valg 03.10.2026): Ikke senk kvaliteten med mindre målinger viser at vi absolutt må. Ytelse hentes først uten å endre utseendet (arbeid ut av hovedtråden, mindre søppel, færre tegnekall, smartere oppdeling). Lagging og feil skal heller ikke ødelegge spillopplevelsen.
- Ved større funksjoner med uklare valg: legg fram en kort plan og vent på klarsignal. Enkle endringer bygges rett. «Snakk uten å bygge» betyr at ingenting skal bygges. «Kjør på» betyr bygg, test og lever.
- **Bare de testene som er strengt nødvendige** (brukerens krav 01.10.2026: tid er penger). Under byggingen: `node --check`, bygg, og `python3 tests/run.py changed`. Den kjører bare testene som dekker filene som er endret siden forrige commit (`COVER` i `run.py`), uten 3D. Rene tekst- og dokumentasjonsendringer kjører ingen tester. Én commit per endring.
- **Full regresjon** (`python3 tests/run.py full`, rundt 10 minutter) kjøres bare før publisering. Feil som dukker opp da, rettes samlet.
- Kjør aldri samme test to ganger for å lese utskriften på en annen måte. Loggene ligger i `tests/out/logs/`. Lange tester kjøres i bakgrunnen mens arbeidet går videre.
- En ny fil i `src/` legges inn i `COVER` i `run.py` med testen som dekker den.
- Vær ærlig om svake tester, antakelser og usikre regler. Sjekk regelverk mot kildene (Lovdata, Fiskeridirektoratet, Råfisklaget) før det bygges inn, og oppgi kilden.
- Brukeren tester på Android-nettbrett, så UI må fungere med berøring i både stående og liggende format.

## Bygg og sjekk

- `node build.mjs` setter sammen `src/` til `dist/index.html` og kopierer kartpakkene fra `src/data/map/` til `dist/map/`. Kartpakkene lages av kartrørledningen: `python3 tools/map/region.py senja` (Overture og Terrarium over nettet, med mellomlager i `tools/map/cache/`). Se 4.6–4.8 i overleveringen. `dist/` er ikke i git. Med `KYST_DIST=<mappe>` bygges det dit i stedet.
- De nasjonale kartdataene bygges av `.github/workflows/kart.yml` (startes ved å endre `tools/map/kart.json`) og ligger som releaser `kart-N`. De hentes med `python3 tools/map/release.py`. Se 4.8b i overleveringen.
- Hele kysten i bygget: `python3 tools/map/release.py` og så `python3 tools/map/game.py` lager `tools/map/out/game/` (ikke i git). `node build.mjs` tar den når den finnes, ellers bare Senja fra `src/data/map`. Se 4.13.
- Tidevannet langs kysten hentes fra Kartverket av `.github/workflows/tidevann.yml` (startes ved å endre `tools/tide/tide.json`) og ligger som releaser `tide-N`. Den nyeste kopieres til `src/data/tide.json`. Se 4.14.
- `node --check <fil>` på hver JS-fil du endrer, og bygg etterpå.
- Filene i `src/` kan ikke åpnes direkte i nettleseren. Test alltid `dist/index.html`, og over HTTP, fordi spillet henter `map/` (`python3 tools/serve.py`). `file://` virker ikke lenger.
- `docs/OVERLEVERING.md` kaller spillfila `kystfiske-prototype.html`. Her er det `dist/index.html`, bygget fra `src/`.

## Tester

- Playwright-skript i Python i `tests/`. De tester `dist/index.html` over HTTP, med en egen server per test som `_env.py` starter, så bygg først. `KYST_DIST=<mappe>` tester et annet bygg. Skjermbilder havner i `tests/out/`.
- Oppsett: `pip install playwright==1.56.0`. Nettleseren ligger allerede i `/opt/pw-browsers`.
- Kjør helst med `tests/run.py` (se over). Den kjører testene som ikke ser på 3D uten å tegne 3D (`KYST_LITE=1`, `#no3d` i adressen: spillet går som før, men ingen 3D-bilder tegnes), to om gangen, og 3D-testene etter hverandre ved siden av. Den oppsummerer OK, FEIL, sidefeil og det testen skal ende med, og viser siste linjer for testene som skriver ut tall som må leses (kalibreringen, `selltest.py`, `hailltest.py`). En enkelt test kan kjøres med `python3 tests/<navn>.py`, med 3D, eller med `KYST_LITE=1` foran uten. Skriptene skriver ut verdier og feil i stedet for å bruke assert, så les utskriften.
- Nye tester: start spillet med `await boot(pg)` fra `_env.py` i stedet for faste pauser, og legg testen i `D3` eller `LITE` i `run.py`. Trykk i 3D sendes som CDP-berøring (`Input.dispatchTouchEvent`), slik `tut.py` og `docktest.py` gjør, fordi Playwrights `tap` venter på et stille bilde.
- Hvilke tester som dekker hvilke filer, står i `COVER` i `run.py`. Det som må stemme: `trip2.py` ender med `"st":"port"`, `tut.py` (hele «Første tur» med berøring, liggende og stående) med `"tut": 0`, `dbg23o.py` skriver ingenting, alle sjekklinjer starter med `OK`, og sidefeil er `[]`. `run.py` sjekker dette selv.
- Berøring og drag i kartet trenger `--disable-gpu-compositing` i Chromium. Kjør aldri flere 3D-tester samtidig.
- Funksjonstestene og triksene for testing står i kapittel 11 i overleveringen.

## Slik er koden satt sammen

- `src/index.html` er malen. `@include(sti)` byttes ut med filen, og i JS skrives JSON-data som `/*@include(sti)*/null`.
- Alle filene i `src/js/core/` og `src/js/ui/` havner i samme `<script>`, i rekkefølgen malen viser. De deler globalt skop, så en ny fil må legges inn i malen på riktig plass.
- `'use strict'` står øverst i `src/js/core/00-proj.js` (projeksjonen) og gjelder hele det første skriptet. Den filen må derfor alltid komme først.
- `src/js/vessel3d.js` ligger i et eget `<script>` før `view3d.js`. Den har byggesettet for båtmodellene (`SPEC3D`, `buildVesselModel`, `geoOf`, `vesselSVG`, `npcKit`) og trenger ingen WebGL. Den bruker kjernens globale navn (for eksempel `sstep`) og kan ikke deklarere dem på nytt.
- `src/js/view3d.js` ligger i et eget `<script>` og eksponerer `G3`.
- Ingen kode skal velge etter båttypens navn (`=== 'sjark'`). Bruk feltene i `VESSELS`, og `vesseltest.py` passer på det.
- Detaljerte båtmodeller lages i Blender med skript i `tools/boats/` (`pip install bpy==4.5.4`, så for eksempel `python3 tools/boats/malo36.py`, `havsjark35.py` eller `skiff59.py`). Felles kode, også eksporten, ligger i `tools/boats/bpyutil.py`. De skriver GLB og sidebilde som base64 til `src/data/boat-*.b64`, som `src/index.html` legger i egne dataelementer (`<script id="glb-TYPE">` og `pic-TYPE`, som ikke kjøres). `vessel3d.js` leser dem først når typen trengs (`glbData`). En ny modell trenger to slike linjer i malen. Referansetegningene legges ikke i repoet, bare målene. Kontrollbildene havner i `tools/boats/out/` (ikke i git). Folkene (`tools/harbour/arbeider.py`, `src/data/worker.b64`) og havneenheten (`tools/harbour/kaimottak.py`) lages på samme måte, med bildene i `tools/harbour/out/`. Se 5.13 i overleveringen.
- `src/data/` inneholder komprimerte kartdata. Filene redigeres ikke for hånd.
- Spillets ramme er UTM sone 33 i km (fra kystplanens fase K4): x = (E + 250 km)/1000 østover, y = (8 050 km − N)/1000 sørover (`natP`/`natLL` i `00-proj.js`). Rutenettsnord er ikke sann nord: sann kurs = rutenettskurs + γ (`gridGamma(p)`, `trueDeg`). Det som vises, er sann retning. Det som regnes og tegnes, går i rutenettet.
- Senja-dataene og det håndplasserte innholdet (havner, kaier, felt, ruter, flåten) står i den gamle rammen i km (flat ved 69,35° N fra 69,72° N 16,55° Ø) og føres inn med `LG`/`LGa`/`LGm` (`01-world.js`). Nytt innhold kan skrives på samme måte eller i lat/lon med `P(lat, lon)`. Testene gjør det samme, og `tests/routes.json` er i den nasjonale rammen. Se 4.7 i overleveringen.
- Rasterkartene (land, dybde, avstand til land, eksponering, høyde, skog) leses bare gjennom lasteren i `src/js/core/01b-mapdata.js` (`rcell`, `rbil`, `rbilM`), aldri som tabeller. En blokk som ikke er lastet, gir en feil og ingen reserveverdi. Det som leser langt fra båtene, kan bare lese kjernen. Se 4.6 i overleveringen.

## Begrensninger

- Siden må forbli én fil. Den eneste eksterne ressursen er Google Fonts, og alt annet er innebygd, bortsett fra kartpakkene i `map/` (fra kystplanens fase K3), som ligger ved siden av siden i samme artifact. Et framtidig PWA-bygg på GitHub Pages kan ha flere filer (manifest, service worker, ikoner, kartsoner), se veikartet «PWA og hele kysten» i overleveringen.
- Tallene i spesifikasjonen og overleveringen er startverdier som justeres i spilltesting.

## Publisering

Publiser `dist/index.html` til artifacten https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f med dens URL, slik at lenken beholdes. Gjør det bare når brukeren ber om det.

- Kartpakkene skal være med som `files`: `map/manifest.json` og hver `map/*.wasm` fra `dist/map/`.
- Navnene har hashen, så en pakke som ikke er endret, har samme navn og trenger ikke sendes på nytt.
- Pakker som ikke lenger står i manifestet, kan fjernes med `null`.
- Med hele kysten (4.13) er det 425 kartfiler og 195 MB. Én publisering tar høyst 255 filer og 64 MB, og en versjon høyst 511 filer og 256 MB. Send derfor de endrede filene i flere publiseringer til samme URL, hver med siden og en bunke filer under 64 MB.
