# Filmoppsettet (harness): teknisk logg

*Startet 30.10.2026. Her står hvordan `tools/film.py` styrer spillet, hva som er prøvd, og hva som gjenstår. Planen står i `PLAN.md` del 4.*

## Slik virker det

- **Ingen filmkode i `src/`.** Spillet bygges som vanlig (`node build.mjs` → `dist/`), serveres over HTTP av `film.py` selv på en ledig port, og styres gjennom det spillet alt eksponerer: `S` (tilstanden), `G3` og `G3._debug` (3D-visningen), `P(lat, lon)`, `isLandFar`, `coastDistFar`, `mapNeed`, `applyVessel`, `EPOCH`.
- **Adressen** er `index.html#seed=1,notut`: fast frø, ingen veiledning. Ikke `#qfix`, fordi den låser kvaliteten til «Høy»; kvaliteten settes i stedet med `S.settings.q3d`. På localhost går spillet på egen klokke (`WCLOCK.on` er usann), så `S.t` kan settes fritt.
- **Klokka** er Playwrights egen (`page.clock`): den går i sanntid under oppstart og lasting, pauses rett før første bilde (`pause_at`), og stepper så `1000/fps` ms per bilde (`run_for`). `Date`, `performance.now`, timere og `requestAnimationFrame` følger med, så spillets egen `frame()` tegner nøyaktig ett bilde per steg. Ingen endring i spillet trengs.
- **Klippet** er en JSON-fil i `shots/`: `when` (ISO, UTC) → `S.t`; `boat` → `S.boat.type` + `applyVessel()`; `place` (lat, lon, `clear` km fra land) → nærmeste sjøcelle, som `tests/teleport3d.py`; `heading` i grader; `speed` i knop gir `status:'sailing'` og en plan med ett veipunkt rett fram; `quality`; `pre` sekunder forspill (kjølvann, lasting); `load_s` sekunder sanntid til terreng og modeller før klokka fryses; `dur`; `cam`.
- **Kameraet:**
  - `orbit`: nøkkelpunkter i tid med `yaw`, `pitch` (grader), `dist` (m) og `fov`, interpolert med myk kurve, skrevet inn i spillets jaktkamera (`G3._debug.cam`) hvert bilde. Kameraet er relativt til båten, så det følger henne. Spillets egen kollisjonsløsning (løft over kai og bru, trekk inn langs linja) virker fortsatt.
  - `intro`: spillets egen vei ut av fars naust (`G3.intro(sek)`).
  - Et fritt kamera (øye og sikt i verden, for faste standpunkter fra land) finnes ikke ennå og krever en liten tilføyelse i spillet (`G3.film`), i egen PR.
- **UI skjules** med `body.kino-clean` pluss en innsatt stil som også tar kinoknappene, kameraknappen, tips og modaler.
- **Ut:** `control-m1/<klipp>-<størrelse>/f0000.png …` (nøkkelbildene ved 0, 25, 50, 75 og 100 %, eller alle med `--all`), `kontaktark.jpg`, og `log.json` med per nøkkelbilde: øyets høyde over land og sjø (`up`), fri linje til båten (`free`, 1 er helt fri), avstand (`d`), brennvidde, kvalitetsnivå og bilderate.

## Prøvd

| Dato | Hva | Resultat |
|---|---|---|
| 30.10 | Skjermbilder med spillet i sanntid, SwiftShader | rundt 45 s per bilde i 540×960, over 60 s i 1080×1920. For tregt til klipp. |
| 30.10 | Første kjøring av `film.py` på klipp 13 | `G3.cam` finnes ikke utenfra; kameraet ligger på `G3._debug.cam`. Rettet. |

## Gjenstår

- Måle sekunder per bilde med frossen klokke (kjører).
- Fritt kamera (`G3.film`) i egen PR, for klippene fra land og naustdøra med egen bane.
- Kontrollene: skrog mot land per bilde, mast mot bru (`G3.mastTop`, `G3.bridgeInto`), hopp mellom bilder, lastet-før-start.
- Hele kysten i `dist/map/` i skyen (kartpakkene fra GitHub-releasen).
- Lydrendering med `OfflineAudioContext` (vei B i `PLAN.md` del 5), først når bildene er låst.
- `assemble_rough.py`: klippene satt sammen med ffmpeg på klippekartet.
