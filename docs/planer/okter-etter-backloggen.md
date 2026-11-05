# Øktene etter backloggen (plan 05.11.2026)

Jonas 05.11.2026: «Vi skal jobbe oss gjennom listen av ting som står i planer, backlogg, antatt svake, feil.» Etter gjennomgangen sa han: «Vi må dele dette opp i håndterbare økter for best resultat tror jeg.» Samme dag valgte han at oppdelingen skal skrives inn her, og at `/okt-slutt` skal få en sjekk av grener som ikke er flettet inn («Ja, kjør på med punkt 1–3 og 5»).

## Slik brukes fila

- **`docs/BACKLOG.md` er fortsatt den ene lista.** Denne fila sier bare hvilke punkter som hører til hvilken økt, i hvilken rekkefølge, og hvilke filer økta skal la være. Punktene står med overskriften de har i backloggen («10.1 «Fire verft i Sverige»»), så de kan finnes med `grep`.
- **En økt begynner som før** (`CLAUDE.md`, `docs/INDEKS.md`, `docs/BACKLOG.md`, systemdokumentet) og leser i tillegg bare sin egen del her.
- **Når økta slutter**, strykes punktene i backloggen som før (`/okt-slutt`), og økta får status i tabellen nederst. Det som ikke ble ferdig, står i backloggen, ikke her.
- **Høyst tre eller fire økter samtidig.** Hver push til `ccr-5e1ba2f4-pusvyd` må flette inn det de andre har pushet (`docs/systemer/publisering.md`), og hver push ruller ut.
- **To økter endrer aldri samme fil i `src/` samtidig.** «Holder seg unna» under hver økt er filene en annen økt eide da planen ble skrevet. Før du begynner: `git fetch origin && git diff --stat origin/ccr-5e1ba2f4-pusvyd...origin/<grenen til økta som kjører>`.

## Øktene som kjører (05.11.2026)

- **Spilltest 3** (`ccr-9c21028c-lptg24`, `docs/planer/spilltest3-valg.md`). Den eier backlogpunktene «Spilltest 3, rettingene og Jonas' valg», «U10, rest», «Garna fisker trolig for lite» og «Kongekrabben stemmer omtrent». Endrede filer: `core/03c-stability.js`, `04-crew.js`, `05-vessels.js`, `06d-drift.js`, `06g-plan2.js`, `07-harbours.js`, `09b-records.js`, `09d-folk.js`, `09e-fartstid.js`, `10-gear.js`, `12-heat.js`, `16b-dyn.js`, `16c-hull.js`, `ui/02-format-state.js`, `03d-setmode.js`, `04-panels-instruments.js`, `05b-work.js`, `05j-catchfeed.js`, `06b-book-tabs.js`, `07-guide.js`, `07c-handbook.js`, `08-actions.js`, `10-gear-ui.js`, `10-rod-acts.js`, `10c-dock.js`, `10e-sound.js`, telefondelene `01`, `02`, `05`, `07`, `12`, `13` og `13b`, og `styles.css`.
- **Havsteget H2, autolineren** (`h2-autoline`, `docs/planer/havsteget-h2-autoline.md`). H2a ble rullet ut 05.11.2026 (c9e651d1); H2b–H2e gjenstår, og H2b startes i en ny økt. Inntil H2e er ute, eier H2 «Havsteget», «Ligge bi i uvær», «Diesel tilbake fra havet», 10.1 «Frys- og RSW-fartøyene lander i kar på 300 kg» (lossingen i H2b) og 10.3 «Fisken, havflåten og Autonav på havet». Planen skal endre `core/02-species-gear.js`, `03-simulation.js`, `03d-quota.js`, `03e-rules.js`, `04-crew.js`, `05-vessels.js`, `06g-plan2.js`, `06h-plan2-engine.js`, `07-harbours.js`, `07f-kar.js`, `09j-kystvakt.js`, `10-gear.js`, `13-work.js`, `ui/05d-plan2.js`, `08-actions.js`, `phone/10-fartoy.js`, `phone/14-act.js`, `view3d/09-landing-deck.js`, `view3d/10-gear.js`, `src/data/fiske.json`, `src/data/rules.json` og Blender-skriptene `tools/boats/al45.py`, `tools/deck/`, `tools/gear/` og `tools/harbour/`.

## Bølge 1: kan starte nå

### Ø1 Det som ikke kom med, og småfeil i data

- **Tufjord** (`ccr-664fd66b-ftggff`, 4c1c9379, 04.11.2026: «Autonav: havnas vei inn og etappene inne i havna holder seg ut fra land»). Backloggen på den grenen har rettingen under «Strøket 04.11.2026 (Autonav gjennom land ved Tufjord)», men den er aldri flettet inn: `leiaHarbourClr` finnes ikke i arbeidsgrenens `core/11-route.js`. Samme gren nevner at `harbourtest` er rød på Finnsnes-kaia, og at Fosnavåg, Mandal verft og Bøvågen fortsatt har veier inn under 5 m fra land.
- **PR #42** (`fb/auto-2026-11-04-skum-nan`, tilbakemelding #110 og #111): skummet fra de andre båtene ga store hvite firkanter på sjøen (`pow()` med negativt grunntall i `HULLFOAM`). PR-en er åpen og ikke flettet. Flettes når Jonas sier ja.
- 10.1 «Fire verft i Sverige».
- 10.1 «Noen få leibiter i NPC-rutene skjærer et hjørne av land» (rettes i `tools/map/npc.py`).
- **De gamle PR-ene:** innholdet i #33 er alt i arbeidsgrenen, så den kan lukkes. #18 (lav grafikk, 17.10) og #19 (tredje og fjerde mann ved linehaleren, 20.10) endrer `view3d.js` og `05-phone.js`, som ble delt 26.10. De skrives om mot delene eller lukkes, etter Jonas' svar.
- Rettingene i `ccr-6ad35290-gwaj0v` (NPC-båtene rister) og `ccr-33fdcb4a-3yrchx` (GEBCO-jobben) er alt i arbeidsgrenen som 9f064dfc og 168e8a93. Der er det ingenting å gjøre.
- **Filer:** `core/11-route.js`, `core/07-harbours.js` (også i spilltest 3 og H2: endringen er liten, så flett forsiktig), `view3d/01-shaders.js`, `src/data/steder.json`, `tools/steder/`, `tools/map/npc.py`.
- **Ferdig når:** Tufjord og skummet er ute på detstorebla.no, Autonav er prøvd i havn sør, midt og nord (`/stikkprove`), og sjekken i `/okt-slutt` bare viser grener som andre økter jobber på.
- **Startmelding:** «Les `CLAUDE.md`, `docs/INDEKS.md`, `docs/BACKLOG.md` og Ø1 i `docs/planer/okter-etter-backloggen.md`. Oppgave: Ø1. Spilltest 3 og H2 kjører i andre økter; rør ikke filene deres utover det flettingen krever. Avslutt med `/lever` og `/okt-slutt`.»

### Ø2 Testriggen

- Alt i 10.6, og fra «Spillarbeid som venter»: «`vesseltest` rød etter havsteget H1b R4», «`vessel3d` for alle typer går ut på tid i `run.py`», «`deckshot` rød på kranen», «`drifttest` scenario 6 er ustabil», «`quotatest` er rød på kvotesamarbeidet» (bare finne årsaken: `03d-quota.js` hører til H2), «`turtest`, `selfcrew` og `driftsplan2test` S9», «`cloudtest` og `pwatest` røde på grunnbygget», «`cloudtest` var rød én gang», «`teleport3d` og `deckshot` i SwiftShader», «`penshot` rød 28.10.2026», «`driftsplan2ui` er ustabil» og «`anchortest` og `fleet2test` er ustabile».
- Fra 10.7: «`docktest` er rød også alene», «`docktest` kan feile ved siden av en annen test» og «`ordtest` er utdatert».
- Regresjonsloggene fra 03.–05.11 i 10.6 gås gjennom: hver rød får en årsak.
- A5 i `docs/planer/verktoy-fra-game-studios.md`: historikk for ustabile tester i `run.py`.
- **Filer:** `tests/`. **Holder seg unna:** `src/`. Ligger feilen i spillet, skrives den i backloggen med fil og linje, og rettes i økta som eier filen.
- **Ferdig når:** hver test over er grønn, eller har en årsak og en eier i backloggen.
- **Startmelding:** «Les `CLAUDE.md`, `docs/INDEKS.md`, `docs/systemer/testing.md`, `docs/BACKLOG.md` og Ø2 i `docs/planer/okter-etter-backloggen.md`. Oppgave: Ø2. Rett det som er feil i testene; feil i spillet skrives i backloggen, ikke rettes. Spilltest 3 og H2 kjører i andre økter.»

### Ø3 Ytelse

- «Laggen 04.11.2026», det som står igjen: (2) grafikkortet på 642L, (3) båtene bruker 14 ms JS per bilde, (4) hvem som leser Senja-flisene langt unna, og hvilken commit i havsteget som gjorde det verre.
- «Førstegangsstarten, resten» (frysen etter «Start»).
- 10.1 «3D på Galaxy A52s (Adreno 642L, oppgave #171)».
- «`charttest` tegnetiden i fjordutsnittet».
- 10.3 «Bølgekartet over fjernterrenget (`SSL.w`) bruker mer prosessortid enn før».
- 10.5 «NPC-modellenes byggetid med CPU-struping».
- Grafikken er nesten det viktigste (`CLAUDE.md`): ytelse hentes uten å endre utseendet, med måling før og etter.
- **Trenger:** Jonas' `#prof` fra 642L etter 9b25f0b.
- **Filer:** `view3d/02`, `04`, `06`, `17` og `18`, `ui/11-boot.js`, `core/01b-mapdata.js`, `core/01c-vec.js`. **Holder seg unna:** `view3d/09` og `10` (H2).

### Ø4 Båtmodellene, én båt per økt

- «Godkjenningsgrensen for båtmodellene (Jonas 01.11.2026): ingenting under 75/100», og det som står igjen under hver «… revidert» i «Spillarbeid som venter».
- «Skrogenes volum mot `disp`», «Rattet dreier bare på håndbåtene», «Skipsmodellene etter kartleggingen» (D3 og resten av `docs/batplan.md` del 10), 10.5 «Båtmodellene».
- **Rekkefølge:** Jonas velger. Uten valg tas trebåten først, fordi den er startbåten og den flest ser, og så den som er nærmest 75 (plastsjarken, 66).
- **Trenger:** bildene eller tegningene som står under hver båt, og svaret om farten til hurtigsjarken (`sjarkny`) og tegningen bak breisjarken.
- **Filer:** `tools/boats/`, `src/data/*.b64`, `docs/skipsmodeller/`. **Holder seg unna:** `tools/boats/al45.py` (H2). `tools/boats/fittings.py` er felles med H2d, så endringer der trenger varsomhet.

### Ø5 Butikkene, restene

- 10.7 «M4 står igjen», «M5 står igjen», «M7 og M8 står igjen» og «M9 står igjen» (`docs/planer/butikker-og-sponsorer.md`).
- `anchors.sign` i byggene krever bpy 4.5.4, som ikke finnes for Python 3.13 i skymiljøet.
- **Filer:** `ui/10i-shop.js`, `ui/10r-sponsor.js`, `core/09l-sponsor.js`, `src/admin/`, `tools/broker/`. **Holder seg unna:** `ui/phone/12-utstyr-redskap.js` (spilltest 3).

### Ø6 Sikkerhetsgjennomgangen av skyen (A7)

- A7 i `docs/planer/verktoy-fra-game-studios.md`: én gjennomgang av `supabase/` (tabellene, RLS, funksjonene), `ui/10f-cloud.js`, `ui/10g-push.js`, `ui/10l-share.js`, `ui/10h-world.js` og `src/admin/`. Økta bare leser.
- **Venter på Jonas' «kjør på»** (verktøyplanen, 28.10.2026).
- Funnene skrives i backloggen 10.1 eller i en egen plan.

### Ø11a Planen for lover, regler og sikkerhet (bare plan)

- `docs/planer/lover-og-regler.md` (L0–L6) og «Sikkerhet SK1–SK6» (oppgave #164) blir én plan med `/planlegg`, fordi L6 (vesten, MOB-båten med davit, MOB-lys med røyk) og SK1 (vest, drakt, leider, livbøye, PLB) er de samme modellene. Byggingen er Ø11 i bølge 3.

## Bølge 2: etter at spilltest 3 er flettet inn

### Ø7 Småfeil i spillet

- 10.1 «Funnet i UI-gjennomgangen 04.11.2026»: (1) veiledningen låser seg på `route2`, (2) sidefeil i `havNear`, (3) håndskriften i dagboka.
- «`paintPlotter` kaster «reading '0'» i `drawSkiff`».
- 10.7: `S.owned`, ikonet `sjomann`, og sløyebordet og konsollskjermene på skiffen (`buildSkiff`).
- «U10, rest», hvis spilltest 3 ikke tok den.
- **Filer:** `ui/07b-first-trip.js`, `ui/07-guide.js`, `core/05-vessels.js` (`npcStates`), `ui/06-logbook.js`, `view3d/12-skiff.js`, `ui/phone/`.

### Ø8 Spillbarhet

- 10.2 «Fangsten er uforklart, og den garanterte første turen gir feil forventning»: krever en plan med valg (`/planlegg`).
- 10.2 «Planleggeren viser ikke bølger langs ruta», «Innloggingsbonusen», «Fiske inne i havna i kuling» og «Mannskapet er ikke spilltestet».
- 10.2 «Reglene» bekreftes i neste spilltest og trenger ingen kode. «De navngitte fangstfeltene finnes bare på Senja» er Ø14.

### Ø9 Fysikk 4, én fase per økt

- Rekkefølgen etter `docs/planer/fysikk-4-sjo-og-skrog.md`: F2, F3, F4 sammen med «Sjøen ved Bleik», F5, F8 (to økter), F6, F7.
- Først måles «Båten i sjøen etter farten» (1)–(2) på nettbrettet.
- **Filer:** `core/16b-dyn.js` og `core/16c-hull.js` (endret i spilltest 3), `view3d/01-shaders.js`, `15-env-mooring.js`, `16-motion.js`.

### Ø16 Sanntid S2, reléet

- `docs/planer/sanntid-posisjoner.md`: steg 1 er bygd (03.11.2026). Neste er reléet på Hetzner (S2), som bare sender når mottakernes gjetning blir feil. Jonas har alt valgt veien («kjør på», 03.11.2026).
- 10.5 «Lasten med 5 000 spillere må prøves mot Supabase» hører hit.
- Etter Ø6, fordi reléet er en ny vei inn til serveren.
- **Filer:** `tools/server/`, `ui/10h-world.js`, `ui/10f-cloud.js`, `supabase/`.

## Bølge 3: etter H2

### Ø10 Regelmotoren

- «Regelmotoren mangler Skagerrak» (FOR-2022-12-16-2281 §§ 1 og 4; 2026-forskriften er ikke lest).
- «`quotatest` er rød på kvotesamarbeidet»: rettes her etter årsaken Ø2 fant.
- **Filer:** `core/03e-rules.js`, `core/03d-quota.js`, `src/data/rules.json`, `tools/rules/`.

### Ø11 Lover, regler og sikkerhet, byggingen

- 4–6 økter etter planen fra Ø11a.
- **Filer:** `core/09j-kystvakt.js`, `core/03e-rules.js` og Blender-skriptene.

### Ø12 Driftsplan 2, resten

- «Driftsplan 2: GUI-gjennomgangen, det som står igjen», «Driftsplan 2: stikkprøver langs kysten mangler», «Driftsplan 2, del 8 (rydding)» og «`drifttest` scenario 6» (som forsvinner med del 8).
- **Trenger:** hele kysten i testmiljøet (`tools/map/out/game`), og at Jonas har prøvd den nye planen. Kommer etter H2c (autolineren i Driftsplan 2).

## Bølge 4: store løp, ett om gangen

### Ø13 Ny kartrelease

- `docs/planer/grafikk-natur-og-miljo.md`: det som mangler av G8 (`hgt10`) og G10 (strendene, tangen på skjærene, stupene).
- Fra 10.3: «Kjernen er 4,70 MB», «Bakken utenfor den gamle rammen er grønn», «Ingen sjømerker ved Bjørnøya og Jan Mayen», «Øyenes bakke er GLO-30», «Breene på Svalbard», «Flisrørledningen er ikke helt bestemt», «`expo2k`», «`land1k` mister øyer og skjær», «Dybden er kuttet ved 2 550 m» og «GEBCO kom fra en kopi».
- Fra 10.5: «Mørk stripe langs åsryggen bak Hammerfest» og «Grafikk G1 (arealdekket, 28.10.2026), det som står igjen».
- `/planlegg` først. Bare én kartrelease om gangen (`docs/systemer/datarorledninger.md`).

### Ø14 Fangstfelt med navn langs hele kysten

- 10.2 «De navngitte fangstfeltene finnes bare på Senja» og 10.5 «Feltnavnene (B2)».
- **Filer:** `src/data/felt.json`, `tools/npc/`, `core/03f-fiske.js`. Kommer etter H2 (`fiske.json`).

### Ø15 NPC-flåten

- «NPC-flåten for hele landet» (N1–N8, `docs/planer/npc-flaaten.md`, fem valg), L3 i «NPC-båtene ved ekte kaier», «Liggeplassene etter L1», «Brygger uten `floating=yes`», «NPC-båter ved flytebrygger tegnet som linje» og 10.3 «NPC-kystflåten ved Longyearbyen».
- **Venter på** Jonas' valg og klarsignal.

### Ø17 Hooks og regler fra Game Studios

- A1, A2, A4 og A6 i `docs/planer/verktoy-fra-game-studios.md`.
- Kommer etter Ø2, fordi begge endrer `run.py`. **Venter på** «kjør på».

## Ikke økter

### Spørsmål til Jonas

- Den nye hurtigsjarken (`sjarkny`): 25 kn og planende som i dataene, eller 12 kn som på tegningen?
- Breisjarken: tegningen bak skriptet ligger ikke i repoet.
- Bildene av båtene som står under hver «… revidert».
- Tallene til flybillettene (H1b R8).
- De fem valgene i NPC-flåten (`docs/planer/npc-flaaten.md`).
- «Kjør på» for verktøyplanen (A7, og så A1, A2, A4 og A6).
- Har du prøvd Driftsplan 2 nok til at del 8 kan tas?
- PR #42: skal den flettes? PR #18 og #19: skrives om, eller lukkes?

### Det Jonas måler

- **På nettbrettet:** `#prof` på 642L etter 9b25f0b («Laggen»), og på Pad 3 («Grafikk: båtmodellene på et nytt nivå», 10.5 «Profilen fra F1 på Pad 3», «Skroget i sjøen, dekkslysene og spygattene» i tåke). Formen og falmingen i «Båten i sjøen etter farten». 10.5 «Skyggene på alt og skyskyggene», «Garnet under vann på nettbrettet», «Grafikk G5» og «Bildetakten på nettbrettet».
- **I admin:** Onboarding 2 O6 (to uker), «Økonomi 2 må spilltestes», 10.5 «Oppdragsfristene etter alternativ A» og «Kystvaktas hyppighet og bygdekampens landsdeler».

## Status

| Økt | Status | Gren | Dato |
|---|---|---|---|
| Spilltest 3 | Kjører | `ccr-9c21028c-lptg24` | 05.11.2026 |
| H2 autolineren | H2a rullet ut (c9e651d1); H2b–H2e gjenstår | `h2-autoline` | 05.11.2026 |
| Ø1 Det som ikke kom med | Ikke begynt | | |
| Ø2 Testriggen | Ikke begynt | | |
| Ø3 Ytelse | Ikke begynt | | |
| Ø4 Båtmodellene | Ikke begynt | | |
| Ø5 Butikkene, restene | Ikke begynt | | |
| Ø6 Sikkerhetsgjennomgangen (A7) | Venter på «kjør på» | | |
| Ø11a Planen for lover, regler og sikkerhet | Ikke begynt | | |
| Ø7 Småfeil | Venter på spilltest 3 | | |
| Ø8 Spillbarhet | Venter på spilltest 3 | | |
| Ø9 Fysikk 4 | Venter på spilltest 3 | | |
| Ø16 Sanntid S2 | Venter på Ø6 | | |
| Ø10 Regelmotoren | Venter på H2 | | |
| Ø11 Lover, regler og sikkerhet | Venter på Ø11a og H2 | | |
| Ø12 Driftsplan 2, resten | Venter på H2 | | |
| Ø13 Ny kartrelease | Ikke begynt | | |
| Ø14 Fangstfelt med navn | Venter på H2 | | |
| Ø15 NPC-flåten | Venter på valgene | | |
| Ø17 Hooks og regler | Venter på Ø2 og «kjør på» | | |

- 05.11.2026: planen skrevet etter gjennomgangen av backloggen, planene og grenene. Grenene sjekket samme dag: `ccr-664fd66b-ftggff` og PR #42 har rettinger som ikke er i arbeidsgrenen.
