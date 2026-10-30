# Publisering

> Flyttet ordrett fra `CLAUDE.md` («Publisering») 26.10.2026 (`docs/utviklingsplan.md`, fase A4). Serveren og det som gjenstår før lansering, står i `docs/lansering.md`.

**Spillet publiseres på detstorebla.no** (Jonas 08.10.2026): en push til arbeidsgrenen som endrer `src/` ruller det ut av `.github/workflows/deploy.yml` («Appen på Hetzner», PWA-bygget). Sjekk at kjøringen er grønn med `gh api repos/average01101010/FishyBusiness-/actions/runs`.

**Porter før utrullingen (29.10.2026):** begge workflowene kjører `node tests/unit/run.mjs` rett etter utsjekkingen (enhetstestene av kjernen, sekunder) og `KYST_DIST=dist-pwa python3 tests/run.py smoke boottest` etter bygget (spillet starter, leser en lagring og stepper klokka med hele kystens pakker, uten sidefeil; Playwright 1.63 og Chromium installeres i jobben, rundt et minutt). En rød stopper opplastingen, og det er neste oppgave. Lagringstesten (`savestest.py`, `docs/lansering.md` B7) venter på offentliggjøringen.

**Dataene ut av siden (29.10.2026, Jonas: «Du kan godt lempe på regelen om at siden må være 1 fil, om det gjør opplevelsen for meg og brukerne bedre»):** `build.mjs` tar hvert `<script id="X" type="application/octet-stream">` (båtmodellene, sidebildene, brevet, Senja-byggene `bld`; 65 elementer, 36 MB base64) ut av siden som `data/X-<sha256:12>.bin` (24 MB binært) og lar et tomt element med `data-src` stå igjen; `data/manifest.json` lister filene. `bootData()` i `ui/11-boot.js` henter dem ved siden av kartet (fire forsøk, så `bootFail`), gjør bytene om til base64 med `FileReader` og legger dem i `textContent`, så `glbData`, `letterPic` og `bld`-leseren er uendret. Siden gikk fra 38,6 MB til 6,2 MB (det som er igjen: koden, skriftene, Senja-kysten). Filene har hashen i navnet: tjenestearbeideren (`kyst-data`, cache-first, prunes etter `data/manifest.json`) og Caddy (`immutable` ett år) beholder dem, så en oppdatering henter bare siden og det som er nytt. `KYST_ONE=1 node build.mjs` gir fortsatt én fil med alt i, for artifacten; den bygges ikke av workflowene.

**Byggets versjon:** `build.mjs` skriver `<meta name="dsb-version" content="…">` i siden, de første 12 heksadesimale tegnene av sha256 av siden og kartmanifestet, det samme som tjenestearbeiderens cache-navn (`@V@` i `sw.js`). `cloudMeta()` i `ui/10f-cloud.js` sender den med hendelser og feil, så admin-tabellene (bildetakt per versjon, feil) kan skille byggene; før 29.10.2026 sto det `dev` i alle, fordi ingen skrev metaen. Bygget skriver versjonen i utskriften (`dist/index.html: 38.18 MB, version 8e0adf3dc0c4`).

**Artifacten oppdateres ikke lenger** (Jonas 08.10.2026: «La artifacten stå»). Siden var over 16 MB (23 MB da, 38,6 MB 29.10.2026 før dataene gikk ut av den; nå 6,2 MB med dataene ved siden av), og artifacten tar høyst 16 MB per side, så publiseringen ble avvist. Artifacten https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f står som den var 03.10.2026 og skal ikke slettes. Publiser bare dit hvis brukeren ber om det, og da trengs en lettere utgave (modeller og skrifter ut av siden).

Slik ble artifacten publisert da den ble oppdatert: `dist/index.html` til artifactens URL, slik at lenken beholdes.

Appen for hjemskjermen (PWA, fra 03.10.2026) bygges med `KYST_PWA=1 node build.mjs` til `dist-pwa/`. Den legges ut på GitHub Pages av `.github/workflows/pwa.yml` hver gang en push endrer spillet, bygget eller kart-releasen: https://average01101010.github.io/FishyBusiness-/. Kartdata for hele kysten som ikke får plass i artifacten (256 MB), kommer bare i appen.

- Kartpakkene skal være med som `files`: `map/manifest.json` og hver `map/*.wasm` fra `dist/map/`.
- Navnene har hashen, så en pakke som ikke er endret, har samme navn og trenger ikke sendes på nytt.
- Pakker som ikke lenger står i manifestet, kan fjernes med `null`.
- Med hele kysten (4.13) er det 425 kartfiler og 195 MB. Én publisering tar høyst 255 filer og 64 MB, og en versjon høyst 511 filer og 256 MB. Send derfor de endrede filene i flere publiseringer til samme URL, hver med siden og en bunke filer under 64 MB.

Begrensningen som gjelder: siden må forbli én fil. Alt er innebygd, også skriftene (fra 05.10.2026), bortsett fra kartpakkene i `map/` (fra kystplanens fase K3), som ligger ved siden av siden i samme artifact. Et framtidig PWA-bygg på GitHub Pages kan ha flere filer (manifest, service worker, ikoner, kartsoner), se veikartet «PWA og hele kysten» i `docs/planer/flaateplanen.md`.
