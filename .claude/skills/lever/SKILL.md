---
name: lever
description: Sjekklista før en endring i spillet pushes til arbeidsgrenen (som ruller ut til detstorebla.no). Brukes som siste steg i hver endring, uansett størrelse.
---

# /lever

Alt under gjøres i rekkefølge. Et punkt som ikke gjelder (for eksempel skjermbilder når ingen UI er endret), sies fra om i rapporten, det hoppes ikke stille over. Reglene står i `CLAUDE.md`; dette er bare rekkefølgen.

1. **Sjekk syntaks og bygg.** `node --check <fil>` for hver JS-fil som er endret, så `node build.mjs`. Med `KYST_VEC=1 KYST_DIST=dist-vec node build.mjs` i tillegg når endringen gjelder vec-pakkene, kaiene, NPC-båtene eller havnene.
2. **Enhetstestene av kjernen** når en fil i `src/js/core/` er endret: `node tests/unit/run.mjs` (noen sekunder, uten bygg og nettleser). En ren funksjon som er ny eller endret (kvoter, regler, projeksjon, stabilitet, fysikk), får en sjekk i `tests/unit/*.test.mjs` i samme commit. `python3 tests/run.py changed` kjører dem selv først. **Se testen feile før den stoles på** (A6, `docs/systemer/testing.md`): en test eller sjekk som skrives eller rettes for en feil, kjøres mot koden før rettingen og skal være rød da; commit-meldingen sier at den ble sett rød, og hvordan.
3. **Testene som dekker filene.** `python3 tests/run.py changed`. Den velger etter `COVER` i `tests/run.py`. En ny fil i `src/` må først inn i `COVER`. Lange 3D-tester kjøres bare når tabellen i `docs/systemer/testing.md` sier de trengs, og i bakgrunnen mens resten gjøres. Les loggen i `tests/out/logs/` én gang; kjør aldri samme test på nytt for å lese den annerledes.
4. **Stikkprøver langs kysten** når rettingen kan gjelde hele landet: `/stikkprove`.
5. **Skjermbilder i begge formater** når UI er endret: 800×1280 og 1280×800, med `KYST_LITE=1` når 3D ikke er med i bildet. Se på bildene før du går videre, og si i rapporten hva de viser.
6. **Patchnotes** når endringen merkes i spillet: ny oppføring øverst i `PATCH` i `src/js/ui/phone/07-patch.js` (neste ledige `pNN`, også mot de åpne PR-ene), eller en linje i den nyeste fra samme dag. Kort, norsk og engelsk. Aldri design, psykologi, ekte penger eller salgsstrategi.
7. **Dokumentasjonen.** Systemdokumentet i `docs/systemer/` får det som er nytt eller endret, med dato og Jonas' valg der det var et valg. `docs/BACKLOG.md`: det som er rettet, flyttes til «Strøket» med dato; nytt som ble oppdaget, legges inn. `python3 tools/docs/kodekart.py` når funksjoner er lagt til eller flyttet.
8. **Commit.** Én commit per endring. Meldingen sier hva som er endret og hvorfor, hvilke tester som gikk, og hvor det er prøvd. Ingen modellnavn i meldingen (commit-vakten i `.claude/hooks/commitvakt.py` nekter en commit med `Claude Opus 5.5`, `claude-sonnet-5-5` eller en Co-Authored-By-linje med Claude; Claude-Session-lenka er grei). `git add` bare filene som hører til endringen (ikke `dist/`, `tests/out/`, `dist-vec/`). Ta med `tests/historikk.tsv` når testene har skrevet linjer i den (historikken for ustabile tester, `docs/systemer/testing.md`).
9. **Push.** `git push -u origin ccr-5e1ba2f4-pusvyd` (fra en egen gren: `git merge-base --is-ancestor origin/ccr-5e1ba2f4-pusvyd HEAD` først, så `git push origin HEAD:ccr-5e1ba2f4-pusvyd`). Ved nettfeil: nytt forsøk etter 2, 4, 8 og 16 sekunder. Arbeidsrutinen (`tools/plan/RUTINE.md`) pusher bare når porten der holder; en økt med Jonas pusher når han har sagt «rull ut» eller «kjør på», eller når startmeldingen fra `docs/planer/koen.md` sier at porten avgjør.
10. **Utrullingen.** Når `src/` er endret: `gh api "repos/average01101010/FishyBusiness-/actions/runs?head_sha=$(git rev-parse HEAD)" --jq '.workflow_runs[] | [.name, .status, .conclusion] | @tsv'` til «Appen på Hetzner» og «Appen på GitHub Pages» er `success`. Er en rød, er det neste oppgave, før noe annet.
11. **Rapporten til Jonas**, kort og på norsk: hva som er endret, hva som er testet og hvor det er prøvd, hva som er svakt eller antatt, og hva som gjenstår. Ingen pynt.
