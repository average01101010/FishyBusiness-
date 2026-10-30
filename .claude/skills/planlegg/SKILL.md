---
name: planlegg
description: Lager en kort plan for en større funksjon med valg, skriver den til docs/planer/, stiller valgene som A/B/C med anbefaling og venter på klarsignal fra Jonas før noe bygges.
---

# /planlegg <funksjonen>

Regelen (`CLAUDE.md`): ved større funksjoner med uklare valg legges en kort plan fram, og ingenting bygges før Jonas sier «kjør på». «Snakk uten å bygge» betyr at ingenting skal bygges, heller ikke planfila om han sier det.

1. **Les** systemdokumentet i `docs/systemer/` for det planen gjelder, `docs/BACKLOG.md`, og reglene som gjelder (`CLAUDE.md`, `docs/engasjement.md` når det gjelder penger eller engasjement, `docs/handelssteder.md` når det gjelder kjøp og steder). Sjekk regelverk mot kildene (Lovdata, Fiskeridirektoratet, Råfisklaget) før det settes i planen, og oppgi kilden.
2. **Skriv** `docs/planer/<navn>.md`:
   - Hva Jonas ba om, med sitat og dato.
   - Hva som finnes i dag, med filnavn og funksjoner (bruk `docs/systemer/kodekart.md` og `grep`, ikke hele filer).
   - Fasene, hver så stor at den passer én økt (som D1–D6 for driftsplanen): hva den bygger, hvilke filer, hvilke tester som dekker dem, hva som må måles.
   - Valgene som A/B/C med én anbefaling hver og én setning om hvorfor. Ikke flere valg enn Jonas trenger å ta.
   - Det som er antatt eller usikkert, ærlig.
   - Hva planen ikke gjør.
3. **Legg fram** planen i chatten i kortform: fasene i rekkefølge, valgene, og hva som er usikkert. Så vent.
4. **Når klarsignalet kommer:** hver fase er sin egen økt. Økta leser planfila, bygger fasen, oppdaterer status nederst i planfila og i systemdokumentet, og avslutter med `/lever` og `/okt-slutt`.
