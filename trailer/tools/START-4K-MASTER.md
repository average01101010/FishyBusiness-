# Startmelding til Claude-økta på GPU-maskinen: 4K-masteren

Lim dette inn som første melding. Brukeren heter Jonas og skriver norsk. Svar på norsk.

---

Du kjører på den leide GPU-maskinen der grovklipp m2 av traileren til Det Store Blå ble laget 10.11.2026. Nå skal eksporten opp til innstillingene i `trailer/HARNESS.md` («Eksporten, 10.11»): 2160×3840, 60 bilder i sekundet, CRF 13, BT.709, lyd på −14 LUFS senket til 60 %. Verktøyene er oppdatert på grenen `ccr-4e8b2dc2-gu9knw`; ingenting av dette er kjørt på GPU ennå.

1. Hent grenen (`git fetch origin ccr-4e8b2dc2-gu9knw`, flett den inn i grenen du står på) og les `trailer/HARNESS.md` nederst og `trailer/tools/enc.py`. Bygg på nytt hvis `src/` er endret (`KYST_VEC=1 node build.mjs`).
2. **m2 om igjen med riktig farge og lyd, uten ny filming.** `python trailer/tools/assemble.py trailer/audio/music-edit-2.json --jobs 6`. Bildene er de samme, men filmen er nå merket BT.709 og lyden målt. Les lydlinja som skrives ut (ventet: rundt −18,5 LUFS ut). Fortell Jonas hvor `m2.mp4` og `m2-540.mp4` ligger, så han kan se fargene på telefonen mot den gamle.
3. **Prøveklipp i 4K og 60 bilder:** `python trailer/tools/film.py trailer/shots/13-snurper-brua.json --gpu --scale 2 --fps 60 --jpeg 97`. Kontroller og rapporter:
   - at bildene er 2160×3840 og faktisk skarpere enn 1080-utgaven forstørret (se på master, rekke og tekst på skroget i 100 %); spillet kan ha et tak på oppløsningen, og da må det finnes og løftes for filmen uten å endre spillet for spillerne;
   - sekunder per bilde, og størrelsen per bilde;
   - at hoppsjekken er ren. Kameranøklene er i sekunder og skal gi samme bane i 60 som i 30; forspillet (`pre`) regnes i bilder ut fra `--fps`.
   Finner du feil i verktøyene, rett dem og push.
4. **Vent på Jonas' notater til m2 før alt filmes i 4K.** Bildene låses i grovklipp først (1080×1920, 30 bilder). Har han alt godkjent bildene, gå videre.
5. **Alle klippene i klippekartet i 4K:** `JOBS=3 ARGS="--scale 2 --fps 60 --jpeg 97" sh trailer/tools/film-all.sh <klippene i music-edit-2.json>`. Mål først om tre samtidig faktisk er raskere enn ett om gangen på dette kortet, og at bildene er like (samme klipp filmet alene og sammen med to andre skal gi like bilder). Se hvert kontaktark.
6. **Tekstene i 4K:** `python trailer/tools/titles.py --size 2160x3840 --out trailer/out/titles-2160x3840`.
7. **Masteren:** `python trailer/tools/assemble.py trailer/audio/music-edit-2.json --size 2160x3840 --fps 60 --jobs 6`. Klippene ligger på låtas slag avrundet til nærmeste bilde, så 60 bilder treffer slagene bedre enn 30.
8. **Sjekklista før Jonas får fila:**
   - `ffprobe`: 2160×3840, 60/1, `color_space=bt709`, `color_range=tv`, AAC 48 kHz, riktig lengde;
   - ingen hopp mellom to bilder som ikke er et klipp (kjør hoppsjekken på de sammensatte bildene);
   - ingen knapper, menyer eller stedsnavn fra spillet i noe bilde;
   - lyden: `ffmpeg -i <fil> -af ebur128=peak=true -f null -`, rundt −18,5 LUFS og topp under −1,5 dBTP;
   - filstørrelsen (ventet 250–350 MB for 50 s).
9. **Stemmen** kommer fra Jonas som lydfil (ElevenLabs, en venns modell) og legges i `trailer/audio/voice/`. Manuset står i `trailer/script.md`. Én fil per linje, eller klipp ett opptak i linjer med ffmpeg, og før dem inn i klippekartet som `"voice": [{"file": "trailer/audio/voice/1.wav", "at": 1.0}, …]`. `assemble.py --audio-only` gir bare miksen, til lytting. Stemmen skal ligge minst 8 LU over musikken, og musikken senkes aldri bare mens stemmen snakker.
10. Kontaktark og `log.json` i repoet, push til grenen du står på (ikke `main`). Bildene og filmene blir på maskinen. Fortell Jonas hvor masteren ligger og hvordan han henter den uten at en meldingsapp komprimerer den.

Spør Jonas bare om det bare han kan gi: notatene, stemmefila, et valg.
