---
name: regresjon
description: Kjører hele regresjonen før publisering og én gang i uka, sorterer det røde mot det som er kjent rødt i backloggen, retter det som er vårt og skriver resten ned.
---

# /regresjon

Full regresjon tar rundt en time, med 3D-testene alene etter de andre, og over to timer med alt. Den kjøres bare før publisering og som ukentlig sjekk (`docs/utviklingsplan.md`, D5: en planlagt økt natt til mandag følger `tools/regresjon/RUTINE.md` og leverer bare en PR mot backloggen; hovedøkta retter). Feil som dukker opp, rettes samlet.

1. **Hele kysten først:** `pip install requests && python3 tools/map/release.py && python3 tools/map/game.py` (den nyeste `kart-N`-releasen, rundt 255 MB, til `tools/map/out/game/`), fordi `routetest` K9 og alt som leser pakkene utenfor Senja trenger den (E4, 26.10.2026). **Bygg** så begge: `node build.mjs` og `KYST_VEC=1 KYST_DIST=dist-vec node build.mjs` (`run.py` bygger `dist-vec/` selv for `npctest`, `havntest` og `vectest`, men bygget avslører syntaksfeil først).
2. **Start i bakgrunnen** med den lengste tidsgrensen verktøyet har: `python3 tests/run.py full > <scratchpad>/full.log 2>&1`. Arbeid videre imens. Kjør aldri flere 3D-tester ved siden av; `run.py` ordner rekkefølgen.
3. **Les resultatet én gang:** `grep -E "^(OK|FEIL|LES)|OK, " <scratchpad>/full.log`, og `tests/out/logs/<test>.txt` for de røde. Ble kjøringen stoppet av tidsgrensen, kjøres de som manglet med `smoke`, de med 3D én og én.
4. **Sorter:**
   - **Kjent rødt:** står i `docs/BACKLOG.md` under testene som feiler, med samme linje. Noteres, ikke mer.
   - **Ustabilt:** feiler på tid eller tilfeldighet (tilfeldig mannskap, SwiftShader under last). Kjør den én gang til, alene. Testene kjører med frø (`seed=1` fra `_env.py`, 29.10.2026), så det samme kastet kommer igjen: rød to ganger med samme frø er en feil i koden eller i testen, ikke uflaks; `KYST_SEED=2` viser om et annet kast går. Grønn andre gang: skriv «ustabil» med grunn i backloggen, og gjør testen robust om det kan gjøres i testen selv. Rød igjen: ekte.
   - **Nytt rødt:** sjekk om det feiler på forrige commit også (`git stash` eller `git worktree`). Gjør det ikke det, er det vårt: rett det. Gjør det det, skriv det i backloggen med commiten det feiler fra.
5. **Rettingene** går som vanlige endringer med `/lever`, én commit hver. Aldri hopp over, slå av eller myk opp en test for å bli grønn.
6. **Backloggen** får datoen, hva som var rødt, hva som ble rettet og hva som står igjen, under «Tester som feiler».
