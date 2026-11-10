# Startmelding til Claude-økta på GPU-maskinen

Lim dette inn som første melding. Brukeren heter Jonas og skriver norsk. Svar på norsk.

---

Du kjører på en leid GPU-maskin (Windows eller Linux) for å lage trailer til spillet Det Store Blå. Brukeren skal gjøre så lite som mulig. Du tar deg av hele prosessen.

1. Les `trailer/PLAN.md`, `trailer/HARNESS.md`, `trailer/shotlist.md`, `trailer/script.md` og `trailer/GPU-MASKIN.md`. Repoets regler står i `CLAUDE.md`. Ingen videoopptak av skjermen: klippene lages av enkeltbilder tatt med `trailer/tools/film.py`.
2. Sjekk at verktøyene virker: `node --version`, `python --version`, `ffmpeg -version`. Installer det som mangler (Playwright: `pip install playwright==1.63.0`, så `python -m playwright install chromium`).
3. Bygg spillet med vektorpakkene: `KYST_VEC=1 node build.mjs` (på Windows PowerShell: `$env:KYST_VEC=1; node build.mjs`).
4. **Test GPU-en først.** Start Chromium uten `--use-angle=swiftshader`, åpne `chrome://gpu` og se at WebGL kjører på det ekte grafikkortet. Mål så sekunder per bilde med `film.py` på `trailer/shots/13-snurper-brua.json` i 1080x1920 uten `--stills`. Rapporter tallene til brukeren. Skriptet `film.py` bruker i dag SwiftShader-flaggene; gjør dem valgfrie (`--gpu`) hvis GPU-en virker.
5. Hent kartet for hele kysten (se `docs/systemer/datarorledninger.md`: `python tools/map/release.py` og `python tools/map/game.py`). Uten det har spillet bare Senja, og klippene fra Lofoten, Finnmark, Bergen og Vardø kan ikke filmes.
6. Film klippene i `trailer/shotlist.md` i rekkefølge, ett om gangen, og lag en JSON-fil per klipp i `trailer/shots/`. Kontroller automatisk: ingen hopp mellom bilder, ingen båt på land, masten klarer Gisundbrua i klipp 12. Se hvert kontaktark selv før du går videre, og rett det som ser feil ut.
7. Legg små kontaktark og `log.json` i repoet og push til grenen du står på (ikke `main`). Selve bildene og videoene blir på maskinen.
8. Når musikken ligger i `trailer/audio/suno/`, analyser tempo og slag, klipp den til rundt 62 sekunder slag mot slag, og sett sammen grovklippet med ffmpeg etter `trailer/shotlist.md`. Teksten på skjermen står i `trailer/script.md`, i Source Serif 4 Display Semibold (`tools/brand/fonts/`).
9. Fortell brukeren hvor grovklippet ligger og hvordan han henter det. Han sender notater med tidskode.

Spør brukeren bare når du trenger noe bare han kan gi: musikkfilene, en nøkkel, eller et valg.
