# Startmelding til Claude-økta på GPU-maskinen

Lim dette inn som første melding. Brukeren heter Jonas og skriver norsk. Svar på norsk.

---

Du kjører på en leid GPU-maskin (Windows eller Linux) for å lage trailer til spillet Det Store Blå. Brukeren skal gjøre så lite som mulig. Du tar deg av hele prosessen.

1. Les `trailer/PLAN.md`, `trailer/HARNESS.md`, `trailer/shotlist.md`, `trailer/script.md` og `trailer/GPU-MASKIN.md`. Repoets regler står i `CLAUDE.md`. Ingen videoopptak av skjermen: klippene lages av enkeltbilder tatt med `trailer/tools/film.py`.
2. Sjekk at verktøyene virker: `node --version`, `python --version`, `ffmpeg -version`. Installer det som mangler (Playwright: `pip install playwright==1.63.0`, så `python -m playwright install chromium`).
3. Bygg spillet med vektorpakkene: `KYST_VEC=1 node build.mjs` (på Windows PowerShell: `$env:KYST_VEC=1; node build.mjs`).
4. **Test GPU-en først.** Maskinen er Windows med NVIDIA RTX PRO 6000 Blackwell Server Edition. I Chrome her ga detstorebla.no feilen «3D-visning støttes ikke på denne enheten (shadere: sjø middels VS: konteksten er mistet · ANGLE (NVIDIA, NVIDIA RTX PRO 6000 Blackwell Server Edition) Direct3D)». WebGL-konteksten ble altså mistet under kompileringen av sjøskyggeren. Finn ut hvordan Playwrights Chromium kan tegne spillets 3D på dette kortet. Prøv i denne rekkefølgen, og mål sekunder per bilde med `film.py` på `trailer/shots/13-snurper-brua.json` i 1080x1920 uten `--stills`:
   - `chrome://gpu` i Playwrights Chromium, og se hva WebGL rapporterer.
   - ANGLE-backendene `--use-angle=d3d11`, `--use-angle=vulkan` og `--use-angle=gl`.
   - `--disable-gpu-watchdog` og `--in-process-gpu`.
   - Siste NVIDIA-driver (`nvidia-smi` viser versjonen). Serverkort kjører ofte i et driverløp som ikke er laget for grafikk; si fra til brukeren hvis driveren må byttes, siden den bare Xesktop eller brukeren kan bytte.
   - Hvis ingenting gir stabil GPU-tegning: mål SwiftShader på CPU-en (antall kjerner med `Get-CimInstance Win32_Processor`) og rapporter tallene.
   `film.py` bruker i dag SwiftShader-flaggene; gjør dem valgfrie (`--angle d3d11|vulkan|gl|swiftshader`). Rapporter funnene til brukeren i få linjer.
5. Hent kartet for hele kysten (se `docs/systemer/datarorledninger.md`: `python tools/map/release.py` og `python tools/map/game.py`). Uten det har spillet bare Senja, og klippene fra Lofoten, Finnmark, Bergen og Vardø kan ikke filmes.
6. Film klippene i `trailer/shotlist.md` i rekkefølge, ett om gangen, og lag en JSON-fil per klipp i `trailer/shots/`. Kontroller automatisk: ingen hopp mellom bilder, ingen båt på land, masten klarer Gisundbrua i klipp 12. Se hvert kontaktark selv før du går videre, og rett det som ser feil ut.
7. Legg små kontaktark og `log.json` i repoet og push til grenen du står på (ikke `main`). Selve bildene og videoene blir på maskinen.
8. Når musikken ligger i `trailer/audio/suno/`, analyser tempo og slag, klipp den til rundt 62 sekunder slag mot slag, og sett sammen grovklippet med ffmpeg etter `trailer/shotlist.md`. Teksten på skjermen står i `trailer/script.md`, i Source Serif 4 Display Semibold (`tools/brand/fonts/`).
9. Fortell brukeren hvor grovklippet ligger og hvordan han henter det. Han sender notater med tidskode.

Spør brukeren bare når du trenger noe bare han kan gi: musikkfilene, en nøkkel, eller et valg.
