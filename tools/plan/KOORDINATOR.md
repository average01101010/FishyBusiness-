# Koordinatoren: en kort økt som holder køen ren og gir Jonas neste runde

Jonas starter en ny økt når en runde er ferdig (eller én gang om dagen) og skriver bare:

```
Les tools/plan/KOORDINATOR.md og gjør det den sier.
```

Den erstatter én lang chat som koordinerer alt (09.11.2026: den chatten som satte opp køen, var blitt så lang at det den visste om køen, var gammelt). Koordinatoren bygger ingenting i spillet; den rører bare `docs/planer/koen.md`, `koen-arkiv.md`, `docs/planer/start/` og `docs/spill-dette/`, og pusher bare dokumenter til arbeidsgrenen.

## Hva den gjør, i rekkefølge

1. **Hent og les.** `git fetch origin ccr-5e1ba2f4-pusvyd` og `git checkout -B <grenen din> origin/ccr-5e1ba2f4-pusvyd`. Les `CLAUDE.md`, `docs/planer/koen.md` (hel; den er kort), `docs/planer/start/README.md`, og `git log --since='<forrige koordinator>' --format='%h %ad %s' --date=short origin/ccr-5e1ba2f4-pusvyd` (forrige koordinator står i `koen-arkiv.md`, «Koordinatoren»).
2. **Rydd køen** (det øktene ikke gjør selv, for å slippe konflikter):
   - Rader med `ferdig`, `lagt bort` eller `slått sammen` flyttes til «Ferdige steg» i `koen-arkiv.md`; startmeldingen deres (`docs/planer/start/<steg>.md`) flyttes til «Startmeldingene for ferdige steg» der, og fila slettes.
   - Besvarte valg (strøket med `~~`, eller med Jonas' svar) flyttes til «Besvarte valg» i arkivet, etter at du har sjekket at svaret står i planfila.
   - Linjer under «Øktene som kjører» for et steg som er ferdig, eller en gren som ikke har fått en commit på åtte timer og ikke har en åpen PR, tas bort (nevn den siste for Jonas: den kan ha stoppet).
   - Statuser som henger: et steg som venter på et steg som er ferdig, blir `klar`, med det det fortsatt venter på (filer en økt eier) skrevet inn.
   - Et steg som er `klar` uten `docs/planer/start/<steg>.md`, får fila skrevet fra planen, med formen i `start/README.md`. Den har «Ferdig når» øverst (tre til fem punkter som kan sjekkes, fra planen og Jonas' valg). Klarer du ikke å skrive den hel, står steget som `klar (startmeldingen mangler)` og er ikke med i runden.
3. **Spill dette, samlet** (taket fjernet 12.11.2026, Jonas: «Fjern taket på 7 steg. Det hindrer oss bare i arbeidet»): `python3 tools/plan/venter.py --liste`. Den teller stegene som venter på at Jonas ser på dem (filene i `docs/spill-dette/`) og skriver `docs/spill-dette/SAMLET.md`, sortert etter hvor i spillet det prøves. Tallet stopper ingenting: runden gis som vanlig, og lista følger med i punkt 5.
4. **Velg neste runde.** Høyst fem steg som er `klar`, portstegene først (P1–P6 i «Porten for de første brukerne»), så over lanseringslinja, så under linja (rekkefølgen i køen; under linja bare til det er fem, Jonas 12.11.2026), og som ikke eier de samme filene som hverandre eller som en økt under «Øktene som kjører» (kolonnen «Filer steget eier»; `src/index.html`, `tests/run.py`, `ui/phone/07-patch.js` og `ui/01-i18n.js` deles og flettes). Er det færre enn fem uten konflikt, gi færre. Et steg som venter på Jonas eller på et valg, er ikke med.
5. **Gi Jonas** i økta, kort og på norsk:
   - **Siden sist:** det som er rullet ut (stegene, med én linje hver), og det som ikke gikk (røde kjøringer på Hetzner; fra L1a 10.11.2026 går de til testadressen, og Pages kjører bare på `main`, steg som stoppet).
   - **Spill dette:** filene i `docs/spill-dette/` fra stegene siden sist, samlet fra `docs/spill-dette/SAMLET.md` (punkt 3), sortert etter hvor i spillet det prøves, så han kan ta alt på ett sted i én runde; de nye først. Det han har bekreftet eller sagt noe om, flyttes til `docs/spill-dette/sett.md` med datoen og ordene hans; det han fant, blir steg i køen.
   - **Valg som venter** (bare de åpne, med A/B og anbefaling, som i køen).
   - **Promptene** for runden, én per steg, i denne formen:

     ```
     Les CLAUDE.md, docs/INDEKS.md, docs/BACKLOG.md (i deler), docs/planer/koen.md (hel; raden for steg <N>, «Øktene som kjører» og «Lanseringslinja») og docs/planer/start/<N>.md og docs/planer/start/README.md (halen). Oppgave: <stegets navn>, etter startmeldingen i start/<N>.md, hel og ordrett, med halen. Merk steget pågår (Jonas' økt, grenen din, tid) i raden og legg én linje under «Øktene som kjører» før du begynner; push bare den endringen til arbeidsgrenen. <Hvilke andre økter som kjører samtidig, og hvilke filer de eier som du ikke skal røre.>
     ```
6. **Push** endringene i køen, arkivet og `start/` til arbeidsgrenen (bare dokumenter; ingenting rulles ut), og skriv én linje under «Koordinatoren» nederst i `koen-arkiv.md`: dato og tid, hva som ble ryddet, og hvilke steg runden fikk.

## Det koordinatoren ikke gjør

Den bygger ikke, tester ikke spillet, svarer ikke på valg for Jonas, og flytter ikke steg over eller under lanseringslinja eller inn i porten uten at Jonas har sagt det. Den starter ikke økter selv.
