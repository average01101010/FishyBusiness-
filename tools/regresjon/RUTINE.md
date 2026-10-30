# Regresjonsrutinen (D5)

En planlagt Claude Code-økt (`Ukentlig regresjon`, `trig_013Aut9VYSRkSPkQjUh17A36`, første kjøring natt til mandag 02.11.2026) kjører dette natt til mandag kl. 02.17 (Oslo-tid), hver gang i en ny økt. Den har ingen koblinger (Supabase og lignende) og trenger ingen; repoet får den med `add_repo`. Den ble satt opp 26.10.2026 etter utviklingsplanen (`docs/utviklingsplan.md`, D5): hele regresjonen går én gang i uka på arbeidsgrenen, og det røde skrives i backloggen med loggene, slik at hovedøkta kan rette samlet. Rutinen retter ingenting selv.

## Absolutte regler

- **Ingen kodeendringer.** Rutinen endrer bare `docs/BACKLOG.md` (kapittel 10.6) og legger logger under `docs/regresjon/<dato>/`. Den retter ingen test og ingen fil i `src/`, og hopper aldri over, slår av eller myker opp en sjekk.
- **Aldri push til `ccr-5e1ba2f4-pusvyd` eller `main`.** Resultatet går i én PR mot `ccr-5e1ba2f4-pusvyd`, som Jonas eller hovedøkta ser på. Rutinen merger og godkjenner ingen PR.
- **Ikke endre** `.github/`, `supabase/`, `src/`, `tools/` eller `CLAUDE.md`. Ingen nøkler eller hemmeligheter i loggene som legges inn (loggene inneholder bare testenes utskrift; sjekk at ingen URL med token er med).

## Hver kjøring

1. **Repoet:** koble til med `add_repo` (eier `average01101010`, repo `FishyBusiness-`, `access: push`) og klon slik svaret sier. Lag grenen `regresjon/ÅÅÅÅ-MM-DD` fra `origin/ccr-5e1ba2f4-pusvyd`. Les `CLAUDE.md`, `docs/INDEKS.md`, `docs/systemer/testing.md` og `docs/BACKLOG.md` 10.6 (det som er kjent rødt).
2. **Verktøy:** `pip install playwright==1.63.0` (den som passer nettleseren i `/opt/pw-browsers`; `launch` sier fra om revisjonen ikke passer) og `pip install requests`.
3. **Hele kysten og byggene:** `python3 tools/map/release.py && python3 tools/map/game.py`, så `node build.mjs` og `KYST_VEC=1 KYST_DIST=dist-vec node build.mjs`. Feiler et bygg, er det en sak for PR-en, og rutinen stopper der.
4. **Regresjonen:** `python3 tests/run.py full > <scratchpad>/full.log 2>&1` i bakgrunnen med den lengste tidsgrensen verktøyet har (2 timer), og vent. Kjør aldri andre tester ved siden av. Ble den stoppet av tidsgrensen, kjøres de som manglet med `python3 tests/run.py smoke <test> ...`, 3D-testene én og én.
5. **Les resultatet én gang:** `grep -E "^(OK|FEIL|LES)|OK, " <scratchpad>/full.log`, og `tests/out/logs/<test>.txt` for de røde. Sorter:
   - **Kjent rødt:** står alt i `BACKLOG.md` 10.6 med samme sjekk. Noteres med «fortsatt rødt».
   - **Ustabilt:** feiler på tid eller tilfeldighet. Kjør den én gang til, alene. Testene kjører med frø (`seed=1` fra `_env.py`, 29.10.2026), så det samme kastet kommer igjen: rød to ganger med samme frø er en feil i koden eller i testen, ikke uflaks; `KYST_SEED=2` viser om et annet kast går. Grønn andre gang: «ustabil» med grunn. Rød igjen: ekte.
   - **Nytt rødt:** skriv sjekklinja som feiler, og hvilke commits som har kommet siden forrige regresjon (`git log --oneline <forrige dato>..` på arbeidsgrenen) som rører filene testen dekker (`COVER` i `tests/run.py`). Ikke rett.
6. **Loggene:** kopier `tests/out/logs/<test>.txt` for hver rød test til `docs/regresjon/<ÅÅÅÅ-MM-DD>/<test>.txt`, og `full.log` som `docs/regresjon/<ÅÅÅÅ-MM-DD>/full.txt`. Ingen skjermbilder i git.
7. **Backloggen:** oppdater `docs/BACKLOG.md` 10.6 med datoen, antall OK og FEIL, lista over det røde (kjent, ustabilt, nytt) med lenke til loggene (`docs/regresjon/<dato>/<test>.txt`), og det som ble grønt siden sist (flyttes til «Strøket» med datoen).
8. **PR:** én commit, én PR mot `ccr-5e1ba2f4-pusvyd` med tittelen «Regresjon ÅÅÅÅ-MM-DD: N OK, M FEIL» og en beskrivelse på norsk: det nye røde først, så det ustabile, så det kjente, med lenkene. Ingen kodeendringer.
9. **Avslutt** med to eller tre linjer i økta: antall OK og FEIL, det nye røde, og PR-lenken. Det vises i varselet på telefonen til Jonas.
