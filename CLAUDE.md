# Det Store Blå (Kystfiske)

Et kystfiskespill langs hele norskekysten (det begynte på Senja) som kjører som én selvstendig HTML-side, publisert som artifact. Spillet heter **Det Store Blå** (brukerens valg 04.10.2026, domenet detstorebla.no). Et engelsk navn for lansering i utlandet er ikke valgt ennå, så den engelske utgaven heter også Det Store Blå. Repoet, lagringsnøklene (`kystfiske_v2`) og andre interne navn heter fortsatt kystfiske og skal ikke endres, fordi lagringene da ville forsvinne. Brukeren skriver norsk; svar på norsk. Koden og kommentarene i den er på engelsk.

**Les `docs/OVERLEVERING.md` før du endrer spillet.** Den har visjonen, arbeidsmåten, arkitekturen, alle systemene med tall, regelverket, kjente problemer og flåteplanen. Spesifikasjonen for fiskerisystemet ligger i `docs/spesifikasjon.md`.

## Arbeidsmåte

- **Spillet er nasjonalt** (Jonas 06.10.2026): alt som legges inn eller endres, gjelder hele kysten, ikke bare Senja. Arter, regler, felt, mottak, modeller og data bygges for hele landet fra start. Senja-dataene er bare et eldre, mer detaljert utsnitt.
- **Fart foran finpuss** (brukerens valg 01.10.2026): Endringene skal inn raskt, og finpuss og feilretting gjøres samlet etterpå.
- **Grafikken er nesten det viktigste** (brukerens valg 03.10.2026): Ikke senk kvaliteten med mindre målinger viser at vi absolutt må. Ytelse hentes først uten å endre utseendet (arbeid ut av hovedtråden, mindre søppel, færre tegnekall, smartere oppdeling). Lagging og feil skal heller ikke ødelegge spillopplevelsen.
- Ved større funksjoner med uklare valg: legg fram en kort plan og vent på klarsignal. Enkle endringer bygges rett. «Snakk uten å bygge» betyr at ingenting skal bygges. «Kjør på» betyr bygg, test og lever.
- **Bare de testene som er strengt nødvendige** (brukerens krav 01.10.2026: tid er penger). Under byggingen: `node --check`, bygg, og `python3 tests/run.py changed`. Den kjører bare testene som dekker filene som er endret siden forrige commit (`COVER` i `run.py`), uten 3D. Rene tekst- og dokumentasjonsendringer kjører ingen tester. Én commit per endring.
- **Full regresjon** (`python3 tests/run.py full`, rundt en time, med 3D-testene alene etter de andre) kjøres bare før publisering. Feil som dukker opp da, rettes samlet.
- Kjør aldri samme test to ganger for å lese utskriften på en annen måte. Loggene ligger i `tests/out/logs/`. Lange tester kjøres i bakgrunnen mens arbeidet går videre.
- En ny fil i `src/` legges inn i `COVER` i `run.py` med testen som dekker den.
- **Båtmodeller** (Jonas 06.10.2026): bare utsiden som spillerne ser, ingen innredning, fabrikk eller rom under dekk. Båthandelen viser ikke animasjoner av hva båtene kan gjøre («høyst unødvendig»).
- Patchnotes-appen på telefonen (`PATCH` i `src/js/ui/05-phone.js`, fra 04.10.2026) skal vise det nyeste. Når en endring som merkes i spillet pushes, legg den inn som en ny oppføring øverst eller som en linje i den nyeste, kort og på norsk og engelsk.
- **Patchnotes nevner aldri** taktisk spilldesign, psykologi, ekte penger eller salgsstrategi (Jonas 06.10.2026). Det blir mellom oss. Ingen 💎, priser i kroner for ekte penger, butikk, gaver for å registrere seg, tellinger før registrering eller grunner til hvorfor noe er laget slik. En funksjon som koster ekte penger, beskrives bare ved hva den gjør i spillet, om den nevnes i det hele tatt.
- Vær ærlig om svake tester, antakelser og usikre regler. Sjekk regelverk mot kildene (Lovdata, Fiskeridirektoratet, Råfisklaget) før det bygges inn, og oppgi kilden.
- Brukeren tester på Android-nettbrett, så UI må fungere med berøring i både stående og liggende format.

## Engasjement og inntekt

Spillet skal tjene penger, og Jonas skal kunne leve av det (06.10.2026). Grunnlaget, arbeidslista i rekkefølge og det vi ikke gjør, står i `docs/engasjement.md`. Reglene som gjelder i hver avgjørelse:

- **Haill for ekte penger beholdes** og er trolig hovedproduktet. Luksushaill gis bare som gave ved registrering og som takk for tilbakemelding.
- **Krokene er ekte.** Kjernesløyfen (napp, rykk, varierende fangst, været), metasløyfen (båtstigen, Neste mål, papirer, mannskap, samlinger) og den sosiale sløyfen (felles verden, topplista, sesonger) styrkes i alt nytt. Hver ny funksjon skal svare på: hva gir den spilleren å gjøre nå, i dag og denne uka?
- **Friction for Flow: betaling korter ned ekte avstander, aldri oppdiktede.** Friksjonen er simuleringens egen (avstand, vær, ståtid, slitasje, hviletid, verftstid). Det vi selger (haill, trim, «Ferdig nå», kosmetikk), letter en friksjon som finnes av en annen grunn enn salget. Vi legger aldri inn ventetid, energi eller trøtthet for å selge oss forbi den, og forlenger aldri en ventetid for å selge mer. Ventetid for ekte penger skal være kortere enn en vanlig pause mellom økter.
- **Innholdet legges der betalingen blir fristende av seg selv** (Jonas' eksempel: turoppdrag ut fra der spilleren er, lange turer med god belønning, som gjør trim attraktivt). Turen skal være verdt å ta uten trim, og belønningen stå i forhold til turen uten trim.
- **Alt kan nås uten å betale.** Hvert oppdrag, hver belønning og hvert mål er mulig og morsomt å nå med tid og dyktighet; betaling er fart og bekvemmelighet. Balanser med hyppige belønninger og synlig progresjon for den som ikke betaler.
- **Endowed progress:** nye ting starter aldri på null. Kort, samlinger og stiger viser det som alt er oppnådd, og første steg er lett.
- **Variabel belønning kommer fra sjøen, ikke fra lommeboka.** Sjeldne hendelser er tilfeldige og gratis. Ingen tilfeldig utfall for ekte penger: ingen loot boxes, gacha, pakker med ukjent innhold eller pity-systemer. Det vi selger, er kjent på forhånd.
- **Pris i kroner med 💎**, ingen fiktiv valuta, ingen pakker som skjuler prisen, ingen nedtelling i butikken. Sesongting kan fortjenes eller kjøpes igjen senere.
- **Ingen straff for fravær.** Innloggingsbonusen tærer, den nulles ikke. Ingen push om tapt bonus eller tapt plass. Push er hendelser i verden, høyst 4 i døgnet, ingenting 22–08.
- **Sosialt er additivt.** Topplister, fiskarlag og felles mål gjør aldri at én spillers fravær skader andre. Verving uten spam. Ingen reklame.
- **Haill gir plass på topplista, men synes aldri** (Jonas 06.10.2026). Den som kjøper, er med på topplista med alt de har levert. At noen har brukt haill, vises aldri for andre: ingen felt om haill i det som deles (posisjon, landinger, topplista, AIS, Kystposten).
- **Kosmetikk er varig og synlig for andre.** Det du kjøper, er ditt.
- **Gjester kan ikke kjøpe.** Butikken åpner ved registrering. 13-årsgrensen for samtykke står.
- **Mål og se.** Hver engasjementsendring skal kunne leses av i trakten i admin-dashbordet (konvolutt → første fangst → første levering → tredje levering → registrert → dag 1/7/30) før neste vurderes.

## Bygg og sjekk

- `node build.mjs` setter sammen `src/` til `dist/index.html` og kopierer kartpakkene fra `src/data/map/` til `dist/map/`. Kartpakkene lages av kartrørledningen: `python3 tools/map/region.py senja` (Overture og Terrarium over nettet, med mellomlager i `tools/map/cache/`). Se 4.6–4.8 i overleveringen. `dist/` er ikke i git. Med `KYST_DIST=<mappe>` bygges det dit i stedet.
- De nasjonale kartdataene bygges av `.github/workflows/kart.yml` (startes ved å endre `tools/map/kart.json`) og ligger som releaser `kart-N`. De hentes med `python3 tools/map/release.py`. Se 4.8b i overleveringen.
- Hele kysten i bygget: `python3 tools/map/release.py` og så `python3 tools/map/game.py` lager `tools/map/out/game/` (ikke i git). `node build.mjs` tar den når den finnes, ellers bare Senja fra `src/data/map`. Se 4.13.
- Bygg, veier, bruer, brygger, moloer og kaifronter for hele kysten ligger i `vec`-pakker per flis (fra `kart-5`, `core/01c-vec.js`). De kommer alltid i appen, men i artifacten bare med `KYST_VEC=1`, fordi de ikke får plass under 256 MB. Inne i Senja-ruta gjelder de innebygde dataene. Se 4.15. Fra `kart-6` har vec-pakkene også NPC-trafikken langs kysten (`tools/map/npc.py`), som spillet bare regner innenfor AIS-rekkevidden. Se 4.16.
- Tidevannet langs kysten hentes fra Kartverket av `.github/workflows/tidevann.yml` (startes ved å endre `tools/tide/tide.json`) og ligger som releaser `tide-N`. Den nyeste kopieres til `src/data/tide.json`. Se 4.14.
- Reglenes kartdata (grunnlinja, fjordsonene, Fiskeridirektoratets reguleringslag og statistikkområdene) lages av `tools/rules/fetch.py` og `tools/rules/regler.py` til `src/data/rules.json`, og av `.github/workflows/regler.yml` som releaser `regler-N` (startes ved å endre `tools/rules/regler.json`, og hver mandag). `tools/rules/look.py` tegner kontrollbilder. Se 4.17.
- Fiskemottakene langs kysten (Fiskeridirektoratets kjøperregister og sluttsedler, Råfisklagets mottakskart, kaia fra vec-pakkene) lages av `tools/mottak/mottak.py` til `src/data/mottak.json`, og av `.github/workflows/mottak.yml` som releaser `mottak-N` (den 3. hver måned, og når skriptet endres). Se 4.18.
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
- Detaljerte båtmodeller lages i Blender med skript i `tools/boats/` (`pip install bpy==4.5.4`, så for eksempel `python3 tools/boats/malo36.py`, `havsjark35.py`, `skiff59.py` eller `snekke23.py`, startbåten). Felles kode, også eksporten, ligger i `tools/boats/bpyutil.py`. De skriver GLB og sidebilde som base64 til `src/data/boat-*.b64`, som `src/index.html` legger i egne dataelementer (`<script id="glb-TYPE">` og `pic-TYPE`, som ikke kjøres). `vessel3d.js` leser dem først når typen trengs (`glbData`). En ny modell trenger to slike linjer i malen. Referansetegningene legges ikke i repoet, bare målene. Kontrollbildene havner i `tools/boats/out/` (ikke i git). Folkene (`tools/harbour/arbeider.py`, `src/data/worker.b64`) og havneenheten (`tools/harbour/kaimottak.py`) lages på samme måte, med bildene i `tools/harbour/out/`. Fiskeslagene og krabben (`tools/fish/fisk.py`, `src/data/fish.b64`) og måkene (`tools/wild/maake.py`) også. Papiret i åpningsscenen (`tools/opening/brev.py`, `src/data/letter-*.b64`), naustet (`tools/harbour/naust.py`) og butikken på Finnsnes (`tools/harbour/butikk.py`) også. Se 5.13 i overleveringen.
- `src/data/` inneholder komprimerte kartdata. Filene redigeres ikke for hånd.
- Spillets ramme er UTM sone 33 i km (fra kystplanens fase K4): x = (E + 250 km)/1000 østover, y = (8 050 km − N)/1000 sørover (`natP`/`natLL` i `00-proj.js`). Rutenettsnord er ikke sann nord: sann kurs = rutenettskurs + γ (`gridGamma(p)`, `trueDeg`). Det som vises, er sann retning. Det som regnes og tegnes, går i rutenettet.
- Senja-dataene og det håndplasserte innholdet (havner, kaier, felt, ruter, flåten) står i den gamle rammen i km (flat ved 69,35° N fra 69,72° N 16,55° Ø) og føres inn med `LG`/`LGa`/`LGm` (`01-world.js`). Nytt innhold kan skrives på samme måte eller i lat/lon med `P(lat, lon)`. Testene gjør det samme, og `tests/routes.json` er i den nasjonale rammen. Se 4.7 i overleveringen.
- Rasterkartene (land, dybde, avstand til land, eksponering, høyde, skog) leses bare gjennom lasteren i `src/js/core/01b-mapdata.js` (`rcell`, `rbil`, `rbilM`), aldri som tabeller. En blokk som ikke er lastet, gir en feil og ingen reserveverdi. Det som leser langt fra båtene, kan bare lese kjernen. Se 4.6 i overleveringen.

## Begrensninger

- Siden må forbli én fil. Alt er innebygd, også skriftene (fra 05.10.2026), bortsett fra kartpakkene i `map/` (fra kystplanens fase K3), som ligger ved siden av siden i samme artifact. Et framtidig PWA-bygg på GitHub Pages kan ha flere filer (manifest, service worker, ikoner, kartsoner), se veikartet «PWA og hele kysten» i overleveringen.
- Tallene i spesifikasjonen og overleveringen er startverdier som justeres i spilltesting.

## Publisering

Publiser `dist/index.html` til artifacten https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f med dens URL, slik at lenken beholdes. Gjør det bare når brukeren ber om det.

Appen for hjemskjermen (PWA, fra 03.10.2026) bygges med `KYST_PWA=1 node build.mjs` til `dist-pwa/`. Den legges ut på GitHub Pages av `.github/workflows/pwa.yml` hver gang en push endrer spillet, bygget eller kart-releasen: https://average01101010.github.io/FishyBusiness-/. Kartdata for hele kysten som ikke får plass i artifacten (256 MB), kommer bare i appen.

- Kartpakkene skal være med som `files`: `map/manifest.json` og hver `map/*.wasm` fra `dist/map/`.
- Navnene har hashen, så en pakke som ikke er endret, har samme navn og trenger ikke sendes på nytt.
- Pakker som ikke lenger står i manifestet, kan fjernes med `null`.
- Med hele kysten (4.13) er det 425 kartfiler og 195 MB. Én publisering tar høyst 255 filer og 64 MB, og en versjon høyst 511 filer og 256 MB. Send derfor de endrede filene i flere publiseringer til samme URL, hver med siden og en bunke filer under 64 MB.
