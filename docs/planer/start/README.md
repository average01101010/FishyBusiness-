# Startmeldingene

Én fil per steg i køen (`docs/planer/koen.md`), `<steg>.md`, med startmeldingen hel: den skal kunne starte en økt alene. Fra 09.11.2026 (før sto de nederst i køen, som da var 253 KB og ble rørt av hver økt flere ganger; de for ferdige steg står i `docs/planer/koen-arkiv.md`).

- **En økt leser bare sin egen fil**, raden sin i køen, og halen under.
- **Et steg uten fil tas ikke** før fila er skrevet. Økta som avslutter et steg, skriver fila for neste steg på sporet (`/okt-slutt`); koordinatoren eller rutinen skriver den fra planen når steget kommer opp.
- **«Ferdig når» øverst** (Jonas 12.11.2026, `docs/utviklingsplan.md` D10): tre til fem punkter som kan sjekkes (en test som er grønn, et tall som er målt, noe som synes i et skjermbilde, et `grep` uten treff), skrevet fra planen og Jonas' valg, ikke fra hvordan det skal bygges. Den som skriver startmeldingen, skriver dem. Mangler de når en økt begynner, skriver økta dem før den bygger noe og viser dem til Jonas i første melding (uten å vente på svar). Steget er ferdig når alle holder, og `/kontroll` sjekker endringen mot dem.
- **Formen:** «Ferdig når», hva som leses (med `offset` for store filer), hva Jonas har avgjort med hans ord og dato, oppgaven, filene steget eier og hvilke det holder seg unna, testene (med «sett rød først» der en test skrives), skjermbildene og stikkprøvene, og «+ halen». Aldri forkortet med «…», aldri «hele teksten står i svaret til Jonas».
- **Når steget er ferdig,** flyttes fila hit til arkivet av koordinatoren, ikke av økta (så to økter ikke rydder samtidig).

## Halen

**Halen** som avslutter alle startmeldingene (skrives ikke om igjen i hver): «Sjekk «Øktene som kjører» i `docs/planer/koen.md` før du begynner, og hent arbeidsgrenen først. Porten i `tools/plan/RUTINE.md` punkt 6 avgjør utrullingen: holder alt, rull ut selv (punkt 7 og 8); ellers står PR-en til Jonas. Skjermbildene i `docs/okter/<dato>-<steg>/`, sett på, og med i meldingen til Jonas. Steget er ferdig når «Ferdig når»-punktene holder. Ta lukkerunden før du leverer (`CLAUDE.md`, «Økta lukker det den åpner»): alt som er svakt, antatt eller gjenstående, lukkes i økta, feil du finner rettes, og et valg bare Jonas kan ta, stilles ham straks med spørsmålsverktøyet. Har steget endret `src/`, tas `/kontroll` etter lukkerunden. Oppdater status for steget i planfila og i køen, og skriv hel startmelding for neste steg på sporet. Avslutt med `/lever` og `/okt-slutt`.»

## 11–22 og videre

Startmeldingene for Ø8b S3 (13), R (16), H3d2 (25), H3e (26), OPP3 (55), OPP5 (57), KM4–KM5 (63–64) og resten skrives hele av økta som avslutter steget før på samme spor, eller av rutinen når steget kommer opp, fra planens kapittel (tabellen over sier hvilket), med samme form som de ti over: hva som leses, hva som bygges med Jonas' valg sitert, filene, testene (med «sett rød først» der en test skrives), skjermbildene og stikkprøvene, og halen.
