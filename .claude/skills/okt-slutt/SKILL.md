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
5. **Status til Jonas, tre linjer:** gjort, prøvd hvor, neste. Pluss én linje om noe er svakt, antatt eller venter på et valg fra ham.
