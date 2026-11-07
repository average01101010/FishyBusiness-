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
- **Havsteget H2, autolineren** (`h2-autoline`, `docs/planer/havsteget-h2-autoline.md`). H2a ble rullet ut 05.11.2026 (c9e651d1); H2b ble rullet ut 05.11.2026 (d5d6b4c); H2c ble rullet ut 05.11.2026 (493c636); H2d1 og H2d2 ble rullet ut sammen 06.11.2026 (b496da28); H2e ble rullet ut 06.11.2026 (377b6c59), og H2 er ferdig. Neste i havsteget er H3 snøkrabbe. Inntil H2e er ute, eier H2 «Havsteget», «Ligge bi i uvær», «Diesel tilbake fra havet», 10.1 «Frys- og RSW-fartøyene lander i kar på 300 kg» (lossingen i H2b) og 10.3 «Fisken, havflåten og Autonav på havet». Planen skal endre `core/02-species-gear.js`, `03-simulation.js`, `03d-quota.js`, `03e-rules.js`, `04-crew.js`, `05-vessels.js`, `06g-plan2.js`, `06h-plan2-engine.js`, `07-harbours.js`, `07f-kar.js`, `09j-kystvakt.js`, `10-gear.js`, `13-work.js`, `ui/05d-plan2.js`, `08-actions.js`, `phone/10-fartoy.js`, `phone/14-act.js`, `view3d/09-landing-deck.js`, `view3d/10-gear.js`, `src/data/fiske.json`, `src/data/rules.json` og Blender-skriptene `tools/boats/al45.py`, `tools/deck/`, `tools/gear/` og `tools/harbour/`.

## Bølge 1: kan starte nå

### Ø1 Det som ikke kom med, og småfeil i data

- **Tufjord** (`ccr-664fd66b-ftggff`, 4c1c9379, 04.11.2026: «Autonav: havnas vei inn og etappene inne i havna holder seg ut fra land»). Backloggen på den grenen har rettingen under «Strøket 04.11.2026 (Autonav gjennom land ved Tufjord)», men den er aldri flettet inn: `leiaHarbourClr` finnes ikke i arbeidsgrenens `core/11-route.js`. Samme gren nevner at `harbourtest` er rød på Finnsnes-kaia, og at Fosnavåg, Mandal verft og Bøvågen fortsatt har veier inn under 5 m fra land.
- ~~**PR #42**~~ (skummet fra de andre båtene ga hvite firkanter på Adreno): flettet 05.11.2026 etter Jonas' ja (BACKLOG «Strøket 05.11.2026 (PR #42 og de gamle PR-ene …)»).
- 10.1 «Fire verft i Sverige».
- 10.1 «Noen få leibiter i NPC-rutene skjærer et hjørne av land» (rettes i `tools/map/npc.py`).
- ~~**De gamle PR-ene**~~ #18, #19 og #33: lukket 05.11.2026 etter Jonas' valg.
- Rettingene i `ccr-6ad35290-gwaj0v` (NPC-båtene rister) og `ccr-33fdcb4a-3yrchx` (GEBCO-jobben) er alt i arbeidsgrenen som 9f064dfc og 168e8a93. Der er det ingenting å gjøre.
- **Filer:** `core/11-route.js`, `core/07-harbours.js` (også i spilltest 3 og H2: endringen er liten, så flett forsiktig), `src/data/steder.json`, `tools/steder/`, `tools/map/npc.py`.
- **Ferdig når:** Tufjord er ute på detstorebla.no, Autonav er prøvd i havn sør, midt og nord (`/stikkprove`), og sjekken i `/okt-slutt` bare viser grener som andre økter jobber på.
- **Startmelding:** «Les `CLAUDE.md`, `docs/INDEKS.md`, `docs/BACKLOG.md` og Ø1 i `docs/planer/okter-etter-backloggen.md`. Oppgave: Ø1. Spilltest 3 og H2 kjører i andre økter; rør ikke filene deres utover det flettingen krever. Avslutt med `/lever` og `/okt-slutt`.»

### Ø2 Testriggen

- Alt i 10.6, og fra «Spillarbeid som venter»: «`vessel3d` for alle typer går ut på tid i `run.py`», «`deckshot` rød på kranen», «`drifttest` scenario 6 er ustabil», «`quotatest` er rød på kvotesamarbeidet» (bare finne årsaken: `03d-quota.js` hører til H2), «`turtest`, `selfcrew` og `driftsplan2test` S9», «`cloudtest` og `pwatest` røde på grunnbygget», «`cloudtest` var rød én gang», «`teleport3d` og `deckshot` i SwiftShader», «`penshot` rød 28.10.2026», «`driftsplan2ui` er ustabil» og «`anchortest` og `fleet2test` er ustabile».
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
- **Venter** (Jonas 05.11.2026: «Vent med båtene»): Ø4 tas når Jonas har bilder eller ber om det. Breisjarken revideres senere (Jonas 05.11.2026: «Denne skal revideres på et senere tidspunkt. La vente»).
- **Trenger:** bildene eller tegningene som står under hver båt.
- **Filer:** `tools/boats/`, `src/data/*.b64`, `docs/skipsmodeller/`. **Holder seg unna:** `tools/boats/al45.py` (H2). `tools/boats/fittings.py` er felles med H2d, så endringer der trenger varsomhet.

### Ø5 Butikkene, restene

- 10.7 «M4 står igjen», «M5 står igjen», «M7 og M8 står igjen» og «M9 står igjen» (`docs/planer/butikker-og-sponsorer.md`).
- `anchors.sign` i byggene krever bpy 4.5.4, som ikke finnes for Python 3.13 i skymiljøet.
- **Filer:** `ui/10i-shop.js`, `ui/10r-sponsor.js`, `core/09l-sponsor.js`, `src/admin/`, `tools/broker/`. **Holder seg unna:** `ui/phone/12-utstyr-redskap.js` (spilltest 3).

### Ø6 Sikkerhetsgjennomgangen av skyen (A7)

- A7 i `docs/planer/verktoy-fra-game-studios.md`: én gjennomgang av `supabase/` (tabellene, RLS, funksjonene), `ui/10f-cloud.js`, `ui/10g-push.js`, `ui/10l-share.js`, `ui/10h-world.js` og `src/admin/`. Økta bare leser.
- **«Kjør på» 05.11.2026** (Jonas valgte begge, A7 og hookene).
- Funnene skrives i backloggen 10.1 eller i en egen plan.

### Ø11a Planen for lover, regler og sikkerhet (bare plan)

- `docs/planer/lover-og-regler.md` (L0–L6) og «Sikkerhet SK1–SK6» (oppgave #164) og N8 i `docs/planer/npc-flaaten.md` (sjømannskap: vikeplikt, lys og signaler for NPC-båtene; Jonas 05.11.2026) blir én plan med `/planlegg`, fordi L1 og L3 (vikeplikt, lys og lyd) gjelder både spilleren og NPC-ene, og fordi L6 (vesten, MOB-båten med davit, MOB-lys med røyk) og SK1 (vest, drakt, leider, livbøye, PLB) er de samme modellene. Byggingen er Ø11 i bølge 3.
- **Ferdig 05.11.2026:** `docs/planer/lover-regler-sikkerhet.md`. Øktene Ø11.1–Ø11.9, regelverket sjekket mot Lovdata med paragraf per krav, filene per økt og hvem de ikke kan gå samtidig med (kap. 6), og de nye valgene V7–V11 (kap. 7). **Jonas svarte 05.11.2026:** V7 ingen dagsignaler («Stort sett ingen bruker det på ekte»), V8 A, V9 B, V10 C, V11 C.

## Bølge 2: etter at spilltest 3 er flettet inn

### Ø7 Småfeil i spillet

- 10.1 «Funnet i UI-gjennomgangen 04.11.2026»: (1) veiledningen låser seg på `route2`, (2) sidefeil i `havNear`, (3) håndskriften i dagboka.
- «`paintPlotter` kaster «reading '0'» i `drawSkiff`».
- 10.7: `S.owned`, ikonet `sjomann`, og sløyebordet og konsollskjermene på skiffen (`buildSkiff`).
- «U10, rest», hvis spilltest 3 ikke tok den.
- **Farten til den nye hurtigsjarken** (Jonas 05.11.2026: 12 kn som tegningen): `VESSELS.sjarkny` får `vmax` 12 og `planing` av, og butikkteksten skrives om (`docs/skipsmodeller/sjarkny-grunnlag.md` kap. 9). Venter også på H2, fordi `core/02-species-gear.js` og `ui/phone/10-fartoy.js` er H2s.
- **Filer:** `ui/07b-first-trip.js`, `ui/07-guide.js`, `core/05-vessels.js` (`npcStates`), `ui/06-logbook.js`, `view3d/12-skiff.js`, `ui/phone/`.

### Ø8 Spillbarhet

- 10.2 «Fangsten er uforklart, og den garanterte første turen gir feil forventning»: krever en plan med valg (`/planlegg`).
- 10.2 «Planleggeren viser ikke bølger langs ruta», «Innloggingsbonusen», «Fiske inne i havna i kuling» og «Mannskapet er ikke spilltestet».
- 10.2 «Reglene» bekreftes i neste spilltest og trenger ingen kode. «De navngitte fangstfeltene finnes bare på Senja» er Ø14.

### Ø8b Spillbarhet, byggingen etter Jonas' valg (06.11.2026)

- Planen `docs/planer/spillbarhet-fangst.md` S0 (full last på første tur, V3 C), S1 (linja om første tur i dagboka, V1 A), S2 (turens linje på sluttseddelen og i dagboka, V2 A og V4 A) og S3 (tettheten i havnebassengene målt, V5 A). Hver fase er én økt; S1 kan gå først.
- Mannskapet etter spilltest 4 (backloggen 10.2 og 10.7, `docs/systemer/folk-om-bord.md` 5.19b): M1 (varselet ved 25 % og rorbua for båter uten køyer), M2 (mannskapet lager maten og blir bedre), M3 (faste måltider), M5 («Tom for is» én gang per døgn).
- **Venter på** «kjør på» og på at H3b er rullet ut: H3b (`ccr-2f1306ed-u6tdgs`) holder `core/03-simulation.js`, `04-crew.js`, `05-vessels.js`, `13-work.js`, `14-crewlife.js`, `ui/05b-work.js`, `07-guide.js`, `08-actions.js` og `phone/07-patch.js`.
- **Filer:** `core/03-simulation.js`, `05-vessels.js`, `04-crew.js` (`tripOf`), `10-gear.js` (`finishHaul`), `13-work.js`, `14-crewlife.js`, `15-energy.js`, `ui/05b-work.js`, `07-guide.js` (`portSlip`), `07b-first-trip.js`, `07c-handbook.js`, `08-actions.js` (`sell`), `01-i18n.js`.

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
- «`quotatest` er rød på kvotesamarbeidet»: Ø2 fant at det var testens feil (den leste bare de tre siste logglinjene etter leveringen); rettet i testen 05.11.2026, ingenting å gjøre her.
- **Filer:** `core/03e-rules.js`, `core/03d-quota.js`, `src/data/rules.json`, `tools/rules/`.

### Ø11 Lover, regler og sikkerhet, byggingen

- Ni økter Ø11.1–Ø11.9 etter `docs/planer/lover-regler-sikkerhet.md` (Ø11a): Ø11.1 vikeplikten (L1, N8), Ø11.2 sikt, lys og lyd (L3, N8), Ø11.3 sammenstøt (L2), Ø11.4 utstyrsmodellene i Blender (L6a, SK1), Ø11.5 utstyret og merkingen på båtene (L6b, L4, V6 A), Ø11.6 mann over bord (SK2, SK3), Ø11.7 nødstopp, nestenulykker og havsnød (SK4, SK6, L8), Ø11.8 farvannet (L5), Ø11.9 arbeidsavtalen (L7). Det som overlapper, er de seks første.
- **Filer:** står per økt i planen (kap. 6). De nye reglene ligger i nye filer (`core/05e-sjovei.js`, `core/14b-sikkerhet.js`, `ui/10s-mob.js`), med ett kall i `core/05-vessels.js`, `core/05d-hav.js` og `core/16b-dyn.js`. Ø11 trenger verken `core/03e-rules.js` eller `core/09j-kystvakt.js` (Kystvakta ser ikke på sjøfarten, V1 A), så **Ø11 og Ø10 kan gå samtidig**. Ø11.1–Ø11.3 og Ø11.5 går ikke samtidig med Ø15, Ø9 eller Ø7. Ø11.4 (bare Blender) kan tas før H2 er ferdig hvis Jonas vil.
- **Valgene V7–V11 tatt 05.11.2026** (planen kap. 7). **Venter på** «kjør på»; H2e er rullet ut 06.11.2026.
- **Ø11.4 bygd 06.11.2026** (vesten, MOB-båten med davit og vugge, MOB-lyset med røyk; gren `ccr-d0cfc148-iavi2e`). Igjen: nødstoppen på halerne når H2d er ute (`tools/gear/`). Status i planen kap. 6 og 10.
- **Ø11.5 bygd og rullet ut 06.11.2026** (4d78cde4) (gren `ccr-2f9c820c-pucumq`; Jonas: «Oppgave: Ø11.5 … etter planen», og om de bakte MOB-båtene: «Skjul den gamle»): livbøyene og røyken etter § 7-10, MOB-båten fra 45 m (de bakte skjult på egen båt), vesten på folkene til sjøs på dekk, V6 A (VHF, AIS fra 15 m, brovaktalarm fra 10,67 m følger båten), leideren etter § 63 og kjenningssignalet og navnestørrelsene (L4). Jonas: «Rull ut på det store blå.» Status i planen kap. 6 og 10.
- **Startmelding Ø11.2** (skrevet 06.11.2026 etter Ø11.5): «Les `CLAUDE.md`, `docs/INDEKS.md`, `docs/BACKLOG.md` og Ø11.2 i `docs/planer/lover-regler-sikkerhet.md` (kap. 2, 5.1 og 7, og statusen for Ø11.1 og Ø11.5), og systemdokumentene `docs/systemer/sjofart-og-lover.md`, `docs/systemer/lyd.md` og lanternene i `docs/systemer/3d-baater-og-animasjon.md`. Oppgave: Ø11.2, sikt, lys og lyd (L3, N8), etter planen: 1. Les sjøveisreglene 19–37 og vedlegg I og III ordrett på Lovdata før byggingen, og skriv det som gjelder inn i `sjofart-og-lover.md` med paragraf. 2. Sikten (regel 6 og 19): `visibility`, varselet fra Ø11.1 tidligere i tåke og mørke, sikker fart for Autonav og Driftsplan etter sikten og stoppdistansen, ingen sving babord i tåke for et fartøy forut for tvers, og minste styrefart når et tåkesignal høres forut (19 e). 3. Lydsignalene (32–35): NPC-enes tåkesignaler innen hørevidde, manøversignalene når en NPC viker innen synsvidde, minst fem korte når spilleren har vikeplikt og ikke gjør noe (34 d), hornet med korte og lange støt, egen båt gir tåkesignal selv i tåke, og lyden svakere med avstanden. 4. Lanternene (N8): `drawNPCLights` etter NPC-ens virkelige fart, anker og «ikke under kommando», og blått rundtlys på Kystvaktas skip. Ta lampene i MOB-lyset og bøyelysene om natta (`mobroyk_lamps`, fra Ø11.5) hvis det passer. Dagsignalene er ikke med (V7). Tester: enhetstestene (`sjovei.test.mjs` utvidet), `lanterntest`, `colregtest` i tåke, `soundtest`, `anchorlight3d` alene, skjermbilder i begge formater og `/stikkprove` langs kysten. Sjekk «Øktene som kjører» før du begynner, og flett forsiktig i `core/05-vessels.js` og `core/16b-dyn.js`. Hold deg unna `tools/boats/` (Ø4). Vis meg skjermbildene til slutt, og spør meg før noe rulles ut. Oppdater status for Ø11.2 i planen og i øktplanen. Avslutt med `/lever` og `/okt-slutt`.»

### Ø12 Driftsplan 2, resten

- «Driftsplan 2: GUI-gjennomgangen, det som står igjen», «Driftsplan 2: stikkprøver langs kysten mangler», «Driftsplan 2, del 8 (rydding)» og «`drifttest` scenario 6» (som forsvinner med del 8).
- Del 8: Jonas 05.11.2026: «Ja, rydd bort den gamle».
- **Trenger:** hele kysten i testmiljøet (`tools/map/out/game`; `python3 tools/map/release.py` og `game.py` henter den på om lag ti minutter, prøvd 05.11.2026). H2c (autolineren i Driftsplan 2) er rullet ut 05.11.2026 (493c636), så Ø12 kan tas.

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
- **Valgene tatt 05.11.2026** (`npc-flaaten.md` kap. 7): 2 A, 4 A og rekkefølgen N3, N4, N7, N8 sammen med Ø11a, N5, N6. Valg 1 og 3 var alt avgjort av `bestand-og-flaate.md`. **Venter på** klarsignal.
- **N8 bygges i Ø11.1 og Ø11.2** (`docs/planer/lover-regler-sikkerhet.md`). Ø15 gir bare de nye typene sin klasse etter sjøveisreglene (`colregCls`), lengden og lanternene i modellen. Ø15 går ikke samtidig med Ø11.1–Ø11.3 eller Ø11.5 (`core/05-vessels.js`, `vessel3d.js`).

### Ø17 Hooks og regler fra Game Studios

- A1, A2, A4 og A6 i `docs/planer/verktoy-fra-game-studios.md`.
- Kommer etter Ø2, fordi begge endrer `run.py`. «Kjør på» 05.11.2026.

## Ikke økter

### Spørsmål til Jonas (besvart 05.11.2026)

- Den nye hurtigsjarken (`sjarkny`): **12 kn som tegningen** (Ø7).
- Breisjarken: «Denne skal revideres på et senere tidspunkt. La vente.»
- Båtmodellene og bildene: «Vent med båtene» (Ø4).
- Flybillettene: **behold anslaget** (tre måneder lest, resten trukket mellom dem).
- NPC-flåten: valg 2 A, 4 A og rekkefølgen N3, N4, N7, N8 sammen med Ø11a, N5, N6 (Ø15, venter på klarsignal).
- Verktøyplanen: **«kjør på»** for A7 (Ø6) og A1, A2, A4 og A6 (Ø17).
- Driftsplan 2, del 8: **«Ja, rydd bort den gamle»** (Ø12).
- Ikke spurt: om `disp` for den nye hurtigsjarken skal være 16 t (tegningens lettvekt) i stedet for 15 t (kap. 9 punkt 2 i `sjarkny-grunnlag.md`). Jonas' regel fra kyst15 er at `disp` er den tomme båten.

### Det Jonas måler

- **På nettbrettet:** `#prof` på 642L etter 9b25f0b («Laggen»), og på Pad 3 («Grafikk: båtmodellene på et nytt nivå», 10.5 «Profilen fra F1 på Pad 3», «Skroget i sjøen, dekkslysene og spygattene» i tåke). Formen og falmingen i «Båten i sjøen etter farten». 10.5 «Skyggene på alt og skyskyggene», «Garnet under vann på nettbrettet», «Grafikk G5» og «Bildetakten på nettbrettet».
- **I admin:** Onboarding 2 O6 (to uker), «Økonomi 2 må spilltestes», 10.5 «Oppdragsfristene etter alternativ A» og «Kystvaktas hyppighet og bygdekampens landsdeler».

## Status

| Økt | Status | Gren | Dato |
|---|---|---|---|
| Spilltest 3 | Ferdig og rullet ut 05.11.2026: F1–F7, U1–U12, K1–K3, garna kalibrert etter ERS og Finnmark etter sluttsedlene (10bc93d1). Igjen i backloggen: «U10, rest», «Vest-Finnmark utenom skreien» | `ccr-9c21028c-lptg24` | 05.11.2026 |
| H2 autolineren | Ferdig: H2a (c9e651d1), H2b (d5d6b4c), H2c (493c636), H2d1 og H2d2 (b496da28) og H2e (377b6c59) rullet ut. Neste: H3 snøkrabbe | `ccr-4a897f45-dtssey` (H2e) | 06.11.2026 |
| H3 snøkrabbe | Planlagt 06.11.2026 i `docs/planer/havsteget-h3-snokrabbe.md` (seks økter H3a–H3e). Valgene tatt 06.11.2026 (V1 A, V2 C, V3 B, V4 «det som blir mest riktig», V5 A, V6 B), flettet inn i 784debb5. Neste: H3a | `ccr-016e1586-atu94e` | 06.11.2026 |
| Ø1 Det som ikke kom med | Ferdig: PR #42 flettet, #18, #19 og #33 lukket, Tufjord flettet inn (8f503066), verftene i Sverige tatt ut (ce056730), leibitene rettet i `npc.py` (eb669fe7, ute med neste kartrelease) | `ccr-834c604f-xxnqoy`, `ccr-5e1ba2f4-pusvyd` | 05.11.2026 |
| Ø2 Testriggen | Ferdig: alle punktene grønne eller med årsak og eier i backloggen (10.6 «Ø2 05.11.2026», «Strøket 05.11.2026 (Ø2)»); de 11 rettede uten 3D grønne på d663638a; A5 historikk i `run.py`; grensjekken i `/okt-slutt` ser på koden; tillegget fra den andre Ø2-økta (`ccr-o2-tillegg`) tatt inn som d663638a. Røde med eier: gfxtest (lyden, Ø7), deckshot (kranen, H2), crewclip/dyntest (H6) | `ccr-5e1ba2f4-pusvyd`, `ccr-o2-tillegg` | 05.11.2026 |
| Ø3 Ytelse | Ikke begynt | | |
| Ø4 Båtmodellene | Venter (Jonas: «Vent med båtene») | | |
| Ø5 Butikkene, restene | Ikke begynt | | |
| Ø6 Sikkerhetsgjennomgangen (A7) | Ferdig: 15 funn i `docs/planer/sikkerhet-skyen.md`; rettet samme dag etter Jonas' «kjør på»: 1, 2–4, 5, 8–15 (fire migreringer kjørt av Jonas og bekreftet). Igjen: 6 (haill og penger på serveren) og 7 (innloggingsdomenet hos WorkOS) | `ccr-5e1ba2f4-pusvyd` | 05.11.2026 |
| Ø11a Planen for lover, regler og sikkerhet | Ferdig: `docs/planer/lover-regler-sikkerhet.md` (Ø11.1–Ø11.9, regelverket sjekket mot Lovdata, filene per økt). Valgene V7–V11 tatt samme dag | `claude/plan-lover-regler-sikkerhet-8wr8hy`, `ccr-5e1ba2f4-pusvyd` | 05.11.2026 |
| Ø7 Småfeil | Ferdig og rullet ut 06.11.2026 (525da2b2): 10.1 (1)–(6) (det meste rettet i U0 og nå sjekket; «Lukk telefonen først» på de små tipsene rettet), `paintPlotter` (skiffens skjermer og bildet rundt den), U10 rest, 10.7 `S.owned`, `sjomann` og skiffen. Igjen: hurtigsjarken 12 kn og to ryddejobber i H2s filer (venter på H2), lyden i 10.1 (ikke tatt) | `ccr-3609ceee-8lzhrx` | 06.11.2026 |
| Ø8 Spillbarhet | Ferdig 06.11.2026: planen `docs/planer/spillbarhet-fangst.md` (fangsten forklart, første turs forventning, havna i kuling; V1–V5, venter på valgene), bølgene langs ruta i rutepanelet (`ui/03b-route.js`, prøvd i Bergen, Bodø og Hammerfest i begge formater), innloggingsbonusens tekst (`ui/phone/09-vaer-post-salg-redning.js`), mannskapet spilltestet (`tests/mannskapsplay.py`, `docs/playtest/rapport-4-mannskap.md`; det som bør rettes, i backloggen 10.2, 10.5 og 10.7). Igjen i 10.2: fangsten og havna (planen), mannskapets to rettinger Valgene tatt 06.11.2026 (V1 A, V2 A, V3 C, V4 A, V5 A; R1 A bygd; M1 A, M2 B, M3 faste tider, M4 A, M5 A); byggingen er Ø8b | `ccr-ccfb0017-rmieib` | 06.11.2026 |
| Ø9 Fysikk 4 | Kan starte (spilltest 3 er ute) | | |
| Ø16 Sanntid S2 | Ferdig og rullet ut 06.11.2026 (01c89b6f): reléet (`tools/server/rt`), `rt_ticket()` (HMAC i Postgres, hemmeligheten i Vault), klienten med 5 Hz/1 Hz og interpolasjon 0,5 s bak, `setup.sh`, `Caddyfile`, `deploy.yml`; `rttest` 12 OK, `sqltest` 135 OK. Migreringen, `setup.sh` og hemmeligheten i Vault gjort av Jonas 06.11.2026. Igjen: S3 (lasten) og «Lasten med 5 000 spillere» mot Supabase | `ccr-529a099b-0o66nk` | 05.11.2026 |
| Ø10 Regelmotoren | Venter på H2 | | |
| Ø11 Lover, regler og sikkerhet | Ø11.3 bygd 07.11.2026, ikke rullet ut (sammenstøtene: kontakten, skylda etter sjøloven §§ 161–162 fra vikeplikten før støtet, betalingen med kaskoen, § 164 på VHF og i dagboka; gren `ccr-208d78a1-ruhxll`, `docs/systemer/sjofart-og-lover.md` kap. 5). Ø11.2 bygd og rullet ut 06.11.2026 (f04d4feb; regel 19 i nedsatt sikt, sikker fart og 19 e for Autonav, tåke- og manøversignalene og hornet, lanternene etter det NPC-ene gjør, om dagen i tåke og Kystvaktas blå lys; `docs/systemer/sjofart-og-lover.md` kap. 4). Ø11.5 bygd og rullet ut 06.11.2026 (livbøyene, MOB-båten, vesten, V6 A, leideren, kjenningssignalet; gren `ccr-2f9c820c-pucumq`). Ø11.1 bygd og rullet ut 06.11.2026 (d62153dc; vikeplikten for spilleren, NPC-ene og Autonav, varselet og AIS-statusen, `core/05e-sjovei.js`, `docs/systemer/sjofart-og-lover.md`). Ø11.4 bygd 06.11.2026 (2f00d140) uten nødstoppen på halerne (venter på H2d); modellene er satt på båtene og folkene i Ø11.5. Neste: Ø11.3 sammenstøt | `claude/o11-2-sikring-lys-lyd-bsrlub` (Ø11.2), `ccr-2f9c820c-pucumq` (Ø11.5), `ccr-e5ae7b11-uibmpt` (Ø11.1), `ccr-d0cfc148-iavi2e` (Ø11.4), `ccr-5e1ba2f4-pusvyd` | 06.11.2026 |
| Ø12 Driftsplan 2, resten | Venter på H2 | | |
| Ø13 Ny kartrelease | Ikke begynt | | |
| Ø14 Fangstfelt med navn | Venter på H2 | | |
| Ø15 NPC-flåten | Valgene tatt; venter på klarsignal | | |
| Ø17 Hooks og regler | Ferdig: A1 deny-lista, A2 øktstarten, A4 lesevakten (`.claude/settings.json`, `.claude/hooks/`), A6 i `CLAUDE.md`, `testing.md` og `/lever`, A3 commit-vakten etter «Fiks det du mener er nødvendig», `hooktest` i `run.py` (55 OK); prøvd i Claude Code i samme økt. Funnet: `main` er tom, så en økt fra `main` får hookene først med arbeidsgrenen | `ccr-d22aebce-865bcx` | 06.11.2026 |

- 05.11.2026: planen skrevet etter gjennomgangen av backloggen, planene og grenene. Grenene sjekket samme dag: `ccr-664fd66b-ftggff` og PR #42 har rettinger som ikke er i arbeidsgrenen.
- 05.11.2026: PR #42 flettet inn og PR #18, #19 og #33 lukket (Jonas: «Ja, flett PR #42 og lukk #18, #19 og #33»). `vesseltest` (snøkrabbe) ble rettet i H2a og er tatt ut av Ø2.
- 05.11.2026: Ø1 ferdig. Tufjord-rettingen fra `ccr-664fd66b-ftggff` flettet inn (konflikt med isen i `leiaRoute` løst: isen følger `LEIA_RUN`), prøvd i Tufjord, Kristiansand, Bergen, Bodø, Hammerfest og Båtsfjord. «Land inne i havnene» (grunnsjekken inne i havnene, Fosnavåg, Mandal verft og Bøvågen) står i backloggen 10.5.
- 05.11.2026: Jonas svarte på spørsmålene (over, «Spørsmål til Jonas»). Ø6 startet.
- 05.11.2026: Ø6 ferdig (bare lesing). Funnene i `docs/planer/sikkerhet-skyen.md`. Det alvorligste er en lagret XSS i admin (funn 1) og at landingene stoles på fra klienten (funn 2, kvoten i åpen gruppe kan stenges for alle). Ø16 kan starte; reléet må ikke stole på posisjonen fra klienten mer enn `pos_put` gjør (funn 11).
- 05.11.2026: Ø6 funn 1 (lagret XSS i admin) og 13 rettet etter Jonas' «Rett funn 1 nå» (b5289877). Migreringen `20261105120000_fb_meta.sql` venter på SQL Editor.
- 05.11.2026: migreringen `20261105120000_fb_meta.sql` kjørt av Jonas i SQL Editor og bekreftet. Funn 1 er helt ferdig.
- 05.11.2026: Ø6 funn 2–4 bygd etter Jonas' «Kjør på funn 2–4» (`20261105130000_guest_world.sql`, `sqltest` 129 OK). Migreringen venter på SQL Editor. Turnstile og et tak i ekte tid er ikke bygd (se planen).
- 05.11.2026: migreringen `20261105130000_guest_world.sql` kjørt av Jonas i SQL Editor og bekreftet. Funn 2–4 er ute; det som gjenstår, står i `docs/planer/sikkerhet-skyen.md`.
- 05.11.2026: Ø6 funn 5 og 14 rettet etter Jonas' «Kjør på funn 5 og 14» (acdaf0db). Migreringen `20261105140000_liv_owned.sql` venter på SQL Editor.
- 05.11.2026: migreringen `20261105140000_liv_owned.sql` kjørt av Jonas i SQL Editor og bekreftet. Funn 5 og 14 er ute. Igjen av Ø6: funn 7 (innloggingsdomenet) og ryddejobbene 8–12 og 15.
- 05.11.2026: Ø6 ryddejobbene 8–12 og 15 gjort etter Jonas' «Kjør på ryddejobbene 8–12 og 15» (656da4d2). Migreringen `20261105150000_rydd.sql` venter på SQL Editor; Caddyfile-endringen trer i kraft når `setup.sh` kjøres på serveren.
- 05.11.2026: migreringen `20261105150000_rydd.sql` kjørt av Jonas og bekreftet. Ø6 er ferdig; igjen er funn 6 og 7, og det som står under hvert funn som ikke gjort.
- 05.11.2026: spilltest 3 ferdig og rullet ut (F1–F7, Jonas' valg V1–V8, garna og Finnmark kalibrert). Ø7, Ø8 og Ø9 kan starte.
- 05.11.2026: Ø11a ferdig, bare dokumenter: `docs/planer/lover-regler-sikkerhet.md`.
  - Planen slår sammen L0–L8, SK1–SK6 og N8 i ni økter Ø11.1–Ø11.9.
  - Regelverket er sjekket mot Lovdata: sjøveisreglene, sjøloven, skipssikkerhetsloven, skipsarbeidsloven, forskriftene for fiskefartøy under og over 15 m, kvalifikasjonsforskriften, merkeforskriften, havne- og farvannsloven og fartsforskriftene.
  - Funnet: kommunene regulerer bare fritidsbåter. Næringsfartøy følger de statlige fartsgrensene, som finnes som datasett hos Geonorge. `lsaOf` har feil antall livbøyer for kyst21 og pelagisk.
  - Venter på V7–V11.
- 05.11.2026: Jonas svarte på Ø11a-valgene: «V7: Vi trenger ikke tenke på dagsignaler i spillet. Stort sett ingen bruker det på ekte. V8: A. V9: B. V10: C. V11: C.» Planen er rettet. Ø11 venter på H2 og «kjør på».
- 05.11.2026: Ø16 bygd (S2 og S1 sammen, i `ui/10h-world.js`). Billetten er HMAC i Postgres med hemmeligheten i Vault, ikke JWT-sjekk i reléet (grunnene i `docs/planer/sanntid-posisjoner.md`). Ikke rullet ut: Jonas kjører migreringen `20261105160000_rt_ticket.sql`, `setup.sh` fra grenen og linjen til Vault, og sier ja.
- 06.11.2026: migreringen `20261105160000_rt_ticket.sql` kjørt av Jonas i SQL Editor og bekreftet. Ø16 venter på `setup.sh`, hemmeligheten i Vault og ja.
- 06.11.2026: Jonas kjørte `setup.sh` på serveren og la hemmeligheten i Vault (bekreftet). Ø16 venter bare på ja til utrullingen.
- 06.11.2026: Ø16 rullet ut etter Jonas' «ja, rull ut» (01c89b6f). Igjen: S3 (lasten) og «Lasten med 5 000 spillere» mot Supabase.
- 06.11.2026: Ø7 ferdig og rullet ut (525da2b2). Det meste av 10.1 fra UI-gjennomgangen var rettet i U0 (18d7c37f) uten at backloggen var strøket; det er sjekket og strøket nå, med en sjekk for `havNear` i `hav.test.mjs`. Nytt: «Lukk telefonen først» står ikke fast på de små tipsene, skiffens levende kartplotter kastet og stoppet bildet for alle med skiff (`inMapFrame`), ikonene i knappelinja på linje. Venter på H2: hurtigsjarken 12 kn, `S.owned.push` i `addVessel` og navnet `inFrame` i `view3d/09-landing-deck.js` (backloggen 10.7). Ikke tatt: lyden med tall som ikke er endelige (10.1, sto ikke i bestillingen).
- 06.11.2026: Ø11.4 bygd (Jonas: «Oppgave: Ø11.4, utstyrsmodellene i Blender, uten nødstoppen på halerne»): vesten som seks deler i `worker.b64`, `tools/deck/mob.py` og `deck-mob.b64` med dataelementet i malen, `mobroyk` i `sikker.py`. De gamle delene er byte for byte som før (`glbdiff.py`; skyggen som bakes, er ikke lik fra kjøring til kjøring, derfor `add`). Nødstoppen venter på H2d; Ø11.5 setter utstyret på båtene og folkene.
- 06.11.2026: Ø11.2 bygd og rullet ut i f04d4feb (Jonas: «Oppgave: Ø11.2, sikt, lys og lyd (L3, N8)»): regel 19 d–e, 20–37 og vedlegg I og III lest ordrett først; alt i `core/05e-sjovei.js` uten nye kall i `05-vessels.js` og `16b-dyn.js`, lyden i `ui/10e-sound.js`, hornet i `ui/10n-hail.js` og `ui/10c-dock.js`, lanternene i `view3d/22-docks-air.js` og `24-cinema.js`. Holdt seg unna `vessel3d.js`, `09-landing-deck.js`, `02-species-gear.js`, `10i-shop.js` (Ø11.5) og H3a sine filer, unntatt patchnotatet (`ui/phone/07-patch.js`, som alle øktene legger en linje i).
- 06.11.2026: Ø11.1 bygd og rullet ut i d62153dc (Jonas: «Oppgave: Ø11.1, vikeplikten for spilleren og NPC-ene (L1 og N8)»): `core/05e-sjovei.js` med ett kall i hver av de delte filene, varselet i stripa og plotteren, `docs/systemer/sjofart-og-lover.md`. N8s vikeplikt og AIS-status er dermed bygd; Ø15 gir de nye typene bare klassen. Ø11.2 er neste i Ø11.
- 06.11.2026: Ø11.5 bygd (Jonas: «Oppgave: Ø11.5, utstyret og merkingen på båtene (L6b, L4, SK1, V6 A), etter planen»). Lagt fram før byggingen: de bakte MOB-båtene (alle fire havbåtene fra 45 m har en), Jonas valgte «Skjul den gamle». `ui/02-format-state.js` er ikke rørt (gamle lagringer i `ui/11-boot.js`), og `tools/boats/` er ikke rørt (plassene som mangler, står i `KITADD` og `LADDERS` i `vessel3d.js` til Ø4).
- 06.11.2026: Ø8 ferdig (Jonas: «Oppgave: Ø8 Spillbarhet, i to deler»). Del 1 er bare plan: `docs/planer/spillbarhet-fangst.md` fant at Onboarding 2 O3/O4 alt hadde tatt halve backlogpunktet (én time, halvt lasterom, linja om vanlig fiske på første sluttseddel), så planen handler om turene etterpå (turens linje på sluttseddelen og i dagboka) og havnebassenget (måles før noen regel). Del 2: sjøen på hver etappe i rutepanelet ved tida båten er der (`draftSea`, lagt inn i kortene fra `03b-route.js` gjennom en `MutationObserver`, fordi `07-guide.js` ikke skulle røres; ryddejobb i 10.7), bonusteksten, og mannskapet tre døgn på sjøen i fire scenarioer (det som er for hardt, er skipperen uten køya, ikke mannskapet). `07-patch.js` ble rørt for patchnotatet. Tester: routetest 45 OK (med den nye sjekken, begge formater), streaktest 13, posttest 8, shoptest 21; autonavtest gikk ut på tid samtidig med mannskapskjøringen (også rød 11:30 på H3a-grenen før denne økta), se `run.py changed` i commiten.

- 06.11.2026: Ø17 ferdig (Jonas: «Oppgave: Ø17, hooks og regler … En hook som selv feiler, skal slippe verktøyet gjennom, ikke stoppe økta. Rør ikke src/»). `run.py` fikk `hooktest` på egne linjer (`LITE += […]` og én linje i `COVER`), så øktene som legger tester i `LITE` og `COVER` (U2-3, H3b, Ø11.2), ikke møter den i en fletting. Hvordan hookene virker: `docs/utviklingsplan.md` D7. Senere samme dag A3 commit-vakten (Jonas: «Fiks det du mener er nødvendig»), og `CLAUDE.md` sier nå at backloggen leses i deler.
- 07.11.2026: Ø11.3 bygd (sammenstøt, gren `ccr-208d78a1-ruhxll`): kontakten og skylda i `core/05e-sjovei.js`, ett kall i `core/16b-dyn.js`, ingen i `16c-hull.js` eller `05-vessels.js`. Ikke rullet ut; venter på Jonas. H3b (`ccr-2f1306ed-u6tdgs`) rører `tests/run.py` og `ui/phone/07-patch.js` som Ø11.3; den som fletter sist, tar det.
- 06.11.2026: Jonas svarte på Ø8-valgene: «V1: A, V2: A, V3: C … det er jo dumt å ikke fylle båten», V4 forklart og ført som A, «V5: A», «R1: A», «M1: A - Sørg også for at spillere på båter uten lugarer vet at de må finne en rorbu for å sove», «M2: B … noen av mannskapet må prøve å lage mat i allefall», «M3: Frokost 06:30, Lunsj 12:30, Middag 18:30, Nattmat 00:30», «M4: A», «M5: A». R1 (rutekortene viser varselet) er bygd i samme økt; resten er Ø8b og venter på «kjør på» og på H3b.
