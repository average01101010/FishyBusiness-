---
name: okt-slutt
description: Siste handling i hver økt: backloggen og systemdokumentet ajour, alt pushet, og en status på tre linjer, slik at neste økt kan begynne på oppgaven uten å ha vært med.
---

# /okt-slutt

Dokumentene er hukommelsen (`docs/utviklingsplan.md`). En ny økt skal kunne begynne på neste oppgave med bare `CLAUDE.md`, `docs/INDEKS.md`, `docs/BACKLOG.md` og systemdokumentet.

1. **Det som ble avgjort i økta**, med Jonas' ord og dato, står i systemdokumentet i `docs/systemer/` (ikke bare i chatten). Et valg han tok med A/B/C, skrives med alternativet han valgte.
2. **`docs/BACKLOG.md`:** det som er rettet, står under «Strøket» med dato og commit. Nye feil, antakelser og ting som må måles, står under riktig overskrift. Det som ble påbegynt og ikke fullført, står øverst under «Spillarbeid som venter» med hvor langt det kom og hvilke filer som er rørt.
3. **Planfila** i `docs/planer/`, når økta var en fase av en plan: status nederst.
4. **Git:** `git status` er rent (ingen glemte filer, ingen halvferdige endringer uten commit), og `git log origin/ccr-5e1ba2f4-pusvyd..HEAD` er tomt etter `/lever`.
5. **Grener som ikke er flettet inn** (Jonas 05.11.2026, etter at rettingen for Tufjord ble funnet på en egen gren uten å være i arbeidsgrenen, selv om backloggen der sa «Strøket»). Sjekken lister grenene fra siste uke som har commits i `src/` som ikke finnes i arbeidsgrenen. Den tar rundt 25 sekunder:

   ```bash
   python3 .claude/skills/okt-slutt/unmerged.py        # -v viser hver commit med hvor mange av linjene som finnes; --days 14 ser lenger tilbake
   ```

   En commit regnes som flettet når koden den la til i `src/`, finnes i arbeidsgrenen (Ø2 05.11.2026; før så sjekken bare på meldingen og ga sju falske treff for grener som var tatt inn i senere form eller med andre meldinger): minst 70 % av linjene den la til (linjer under 12 tegn telles ikke) står i filen nå, i det arbeidsgrenen har lagt til i filen de siste 30 dagene, eller et annet sted i `src/`; eller alle de nye navnene den innførte (minst to identifikatorer som ikke fantes i `src/` før den), finnes i arbeidsgrenen. 05.11.2026 hadde commitene som var tatt inn i annen form 79–93 % av linjene, og de som ikke var tatt inn 0–18 %. Grener som andre økter jobber på, er ventet (`docs/planer/okter-etter-backloggen.md`, «Øktene som kjører»). Står det noe annet, nevnes grenen i statusen til Jonas, med hva den retter, og om den har en åpen PR. Den flettes ikke uten at han har sagt ja.
6. **Status til Jonas, tre linjer:** gjort, prøvd hvor, neste. Pluss én linje om noe er svakt, antatt eller venter på et valg fra ham, og én linje om grenene fra punkt 5 når den fant noe.
