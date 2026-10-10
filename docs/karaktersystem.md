# Karaktersystem og garderobe (plan, 10.10.2026)

Status: plan, ikke bygget. Venter på klarsignal og svar på spørsmålene nederst (CLAUDE.md: større funksjoner med uklare valg).

## Ønsket (Jonas 10.10.2026)
- Spilleren kan endre utseende på figuren sin: hatter, luer, hår, jakker, bukser, sko.
- Alle plagg kan også brukes av mannskapet, slik at ingen mannskap ser like ut. I dag ser alle ut som i en oransje fangedrakt.

## Slik er det i dag
- Én kropp i én GLB (`src/data/worker.b64`, 241 KB, laget av `tools/harbour/arbeider.py`) i deler: torso (eller genser), hode, hatt, overarm, underarm, lår, legg, støvel, hånd.
- Fargen er maling i to soner (1 jakke, 3 bukser). `WKIT` i `vessel3d.js` har tre kits: `hw` (havnearbeider), `skipper`, `crew`. Alt mannskap bruker `crew`, derfor lik oransje dress, lik lue, samme hår, samme hud.
- Figurene tegnes ledd for ledd (`drawWorker`, `figureVB` i `view3d.js`). Delene bygges én gang per kit og bufres (`WKPC`, `wkMeshes`).
- Mannskapet (`genCrew` i `core/04-crew.js`) har navn, alder, kjønn, hjemsted og egenskaper, men ikke noe utseende.

## Anbefalt oppbygging
**Et utseende (`look`) er en liten tallkode**, ikke en modell: kropp (mann/kvinne), hudtone, hårfarge, og for hver plass (hår, hatt, jakke, bukser, sko, eventuelt skjegg) et plagg-id og en fargevalg. Det lagres som en kort streng, `S.look` for spilleren og `c.look` for hvert mannskap, og tas med i skylagringen.

**Plagg er katalogdata**: `{id, plass, del, soner, farger, kilde, pris}`. Kilde er `start` (gratis), `fortjent` (merker og milepæler), `kjøp` eller `sesong`. Samme katalog brukes av spilleren og av mannskapet.

**Ytelse (grafikken er nesten det viktigste):** et plagg legges inn i kroppsdelen det sitter på når figuren bygges (genser blir en del av torsoen, støvel av foten), og resultatet bufres per utseende. Antall tegnekall per figur blir som i dag (ni deler). Bufferet holdes lite med en enkel LRU, fordi bare de figurene som er synlige trengs.

**Blender:** ny `tools/harbour/garderobe.py` etter mønsteret fra `arbeider.py`, med skjult kropp under plagget og egne dataelementer per plass som leses først når de trengs (som båtmodellene). Første runde:
- Hår: kort, middels, langt, hestehale, flette, skallet, pluss skjegg i to former.
- Hodeplagg: skipperlue, toppluen, flat sixpence, sydvest, hjelm, skyggelue, ingen.
- Jakker: oljehyre, ullgenser, fleece, regnjakke, dunjakke, flytedress.
- Bukser: oljebukse med seler, arbeidsbukse, jeans, ullbukse.
- Sko: gummistøvel, kort støvel, sko, joggesko.
- Alle farger velges fra en palett på 8–12, slik at ett plagg gir mange utseender.
- Ingen merker, logoer eller firmanavn. Plaggene heter oljehyre, ullgenser og så videre (CLAUDE.md: ingen ekte firmanavn).

## Mannskapet
- Utseendet trekkes ved mønstring ut fra en fast frøverdi (id), slik at samme person alltid ser lik ut, også etter lagring.
- Alder og kjønn styrer: grått hår over 50, skallet oftere hos eldre menn, skjegg bare hos menn, yngre i joggesko og fleece, eldre i ull og oljehyre.
- Ingen to om bord får samme utseende (kontroll mot de andre i båten og i flåten).
- Oljehyre finnes i flere farger. Oransje er ett valg blant mange, ikke standard.
- Valg for Jonas: skal spilleren også kunne kle mannskapet selv fra sin egen garderobe?

## Redigeringen (UI)
- En Garderobe-app eller et speil i naustet og i rorbua, med en dreibar 3D-figur i forhåndsvisning (gjenbruker `figureVB`).
- Plassvelger (hår, hatt, jakke, bukser, sko), plaggliste og fargepalett. Berøring, stående og liggende, med skjermbilde av begge før den meldes ferdig.
- Åpningen: et enkelt valg av kropp, hudtone og hår ved registreringen. Nye ting starter aldri på null: spilleren får et gratis grunnutvalg (endowed progress).

## Penger og regler (fra `docs/engasjement.md`)
- Kosmetikk er varig og synlig. Den som kjøper, eier det. Pris i kroner med 💎, ingen pakker med ukjent innhold, ingen tilfeldighet for ekte penger.
- Et bredt gratisutvalg og plagg som fortjenes (første skrei, milepæler, sesonger), slik at en spiller som ikke betaler også har et variert utseende.
- Gjester kan lage et grunnutseende, men ikke kjøpe. At noen har betalt, vises aldri annet enn som selve plagget.
- Ingen effekt på spillet fra kjøpt kosmetikk. Arbeidstøy som er gratis kan ha reell nytte (varme klær mot kuldestraffen, flytedress mot sikkerhetsplanen SK1–SK6).
- Patchnotes nevner funksjonen ved hva den gjør, aldri pris eller salg.

## Faser (størrelse: S liten, M middels, L stor)
1. **Fundament og mannskapsvariasjon (M).** Utseendekoden, bufring per utseende, fargepalett, hud og hår i flere farger, ulike eksisterende hatter, og mønstring som gir hvert mannskap sitt utseende. Uten nye modeller. Løser «alle ser like ut» med en gang.
2. **Garderoben i Blender (L).** Plaggene over, eksport og lasting ved behov.
3. **Redigering og lagring (M).** UI, `S.look`, `S.wardrobe`, skylagring, kontroll mot gamle lagringer.
4. **Mannskapet bruker hele katalogen (S).** Utvalget utvides, ev. at spilleren kler dem.
5. **Butikk, fortjent og sesong (M).** Kosmetikkhandel for 💎, belønninger fra merker, trakt i admin.
6. **Synlighet for andre (S–M).** Utseendekoden følger med posisjonen (`pos_put`), så andre ser figuren om bord. Ingen felt om betaling.

## Tester
- Ny utseendetest: samme frø gir samme utseende, ingen like i en båt, lagring og lasting, gammel lagring uten utseende.
- Skjermbilder av figurene i 3D og av editoren i begge formater.
- 3D-testene som berører figurene (`vessel3d` 24 min, `unittest`, `worktest`) etter spørsmålet i CLAUDE.md om hver enkelt.

## Spørsmål til Jonas
1. Hvor skal spilleren se figuren sin: bare i editoren, naustet og puben, eller også på dekk i 3D (og dermed for andre spillere)?
2. En kropp med mann og kvinne, eller flere kroppsformer?
3. Skal kosmetikk selges for �Erfra første runde, eller først gratis og så butikk?
4. Skal spilleren kunne kle mannskapet selv?
