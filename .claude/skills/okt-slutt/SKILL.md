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
5. **Grener som ikke er flettet inn** (Jonas 05.11.2026, etter at rettingen for Tufjord ble funnet på en egen gren uten å være i arbeidsgrenen, selv om backloggen der sa «Strøket»). Sjekken lister grenene fra siste uke som har commits i `src/` som ikke finnes i arbeidsgrenen. Den tar ett–to sekunder:

   ```bash
   A=origin/ccr-5e1ba2f4-pusvyd; git fetch -q --prune origin; since=$(date -d '7 days ago' +%s)
   git log "$A" --since='21 days ago' --format=%s | sort -u > /tmp/arb-subj.txt
   for b in $(git for-each-ref --sort=-committerdate --format='%(refname:short)' refs/remotes/origin); do
     [ "$(git log -1 --format=%ct "$b")" -lt "$since" ] && break
     n=$(git log --right-only --cherry-pick --no-merges --format=%s "$A...$b" -- src | sort -u | comm -23 - /tmp/arb-subj.txt | wc -l)
     [ "$n" -gt 0 ] && echo "$b: $n commit(er) i src/ som ikke er i arbeidsgrenen, siste $(git log -1 --format='%cd «%s»' --date=short "$b")"
   done
   ```

   En commit regnes som flettet når en commit med samme melding finnes i arbeidsgrenen, fordi flere rettinger er tatt inn som nye commits. Grener som andre økter jobber på, er ventet (`docs/planer/okter-etter-backloggen.md`, «Øktene som kjører»). Står det noe annet, nevnes grenen i statusen til Jonas, med hva den retter, og om den har en åpen PR. Den flettes ikke uten at han har sagt ja.
6. **Status til Jonas, tre linjer:** gjort, prøvd hvor, neste. Pluss én linje om noe er svakt, antatt eller venter på et valg fra ham, og én linje om grenene fra punkt 5 når den fant noe.
