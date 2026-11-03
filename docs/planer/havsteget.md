# Havsteget: spillerens egne havfiskefartøy (plan, 03.11.2026)

Jonas 03.11.2026: «Fungerer tråling, snurpnot for oss brukerne også?» (svar: nei), så: «Legg en detaljert plan for havsteget».

Fra før (01.11.2026, `bestand-og-flaate.md`): «Havflåten er et element av spillet som skal bygges ganske straks og modellene til båtene er allerede laget, det er dermed viktig at vi klarer å simulere dette med bestander, vandring, uttak, og alt annet på en så realistisk måte som mulig slik at modellen er helt ferdig utviklet når vi starter». Og: «Når en ny bruker registrerer seg i spillet skal 1 NPC-båt forsvinne.»

Planen bygger på `bestand-og-flaate.md` (B1–B4, L1–L3, H1), som er ferdig og rullet ut. Ingenting bygges før Jonas har svart på valgene og sagt «kjør på».

## 1. Hva som finnes i dag

**Ferdig og i bruk:**

- **Båtene:** fem havbåter med full spesifikasjon og Blender-modell (`core/02-species-gear.js`):

  | Type | Båt | Pris |
  |---|---|---|
  | `autoliner` | 45 m | 70 M |
  | `snokrabbe` | 50 m | 60 M |
  | `ringnot38` | 38,5 m, ringnot og snurrevad | 95 M |
  | `bunntral` | frysetråler 60 m | 150 M |
  | `pelagisk` | ringnot og pelagisk trål, 75 m | 250 M |

  Alle har `lock:true` og `cls:'hav'`. Båthandelen viser dem som «kommer» (`ui/phone/10-fartoy.js:40,58,104`), og kjøpet sier nei (`ui/phone/14-act.js:158`).
- **Bestanden og vandringen:**
  - Sluttsedlene per redskap og lengdegruppe (`fiske.json`: garn, line, jukse, snurrevad, teine, trål, not; lengdegruppen 28+).
  - Vandringen for skrei, sild, makrell, sei og snøkrabbe (`MIG`).
  - Flåtetrykket per gruppe, også `tral` og `hav` (`core/03g-trykk.js`).
  - Kvotekjeden for torsk (`codChain` i `core/03d-quota.js`: trålstigen, havfiske 12,81 %, lukket og åpen gruppe).
- **NPC-havflåten** (`core/05d-hav.js`, 4.17 i `npc-trafikk.md`): 248 skip med felt, sesong, leier, tråling og notkast i 3D, levering ved mottak som tar fangsten, og AIS.
- **Holdene:** `frys` og `rsw` er koblet inn (`holdFreezes`, `holdRSW` i `05-vessels.js`). Fryst fisk råtner ikke (`keepK`).
- **3D:** trålen (`TRAWL`, `drawTrawl`) og nota (`SEINE`, `drawSeine`) med alle faser, i `view3d/20-trawl-seine.js`. Modellene har tråldører, nettrull, fiskepose og notens plasser.
- **Lotten:** tabellene for havfiske (§ 6, autoline, garn og snurrevad over 28 m) og snøkrabbe (§ 20) i `core/04-crew.js` `OPPG`.
- **Reglene:** J-161-2026 § 32 (28 m og over fisker ikke torsk, hyse og sei med konvensjonelle redskap innenfor 4 nm) står i `rulesAt` (`core/03e-rules.js:133`). `rules.json` har linjene for 4, 6 og 12 nm og grunnlinja.
- **Lån:** Kystbanken og Innovasjon Norge (`LOANS`), med 80 % lånt og tak etter flåteverdien (`deal()`).

**Finnes ikke:**

1. Konsesjoner (tillatelser) og kvotefaktorer. De eneste rettighetene i dag er kysthjemlene u7–h20 (`HJ`, `REGN`, `regTake`).
2. Fangstfunksjoner for trål, not, snurrevad og autoline. `GEAR`, `SELQ`, `RIGS`, `DRF_RIGS` og `S.sets` kjenner bare juksa, line, garn og teiner. `autoHooks` leses bare av databladet.
3. Fartøykvoter for trålgruppen og havfiskeflåten, og kvoter for sild, makrell og snøkrabbe. Hyse og sei har ingen gruppedeling.
4. Reglene for trål: 12 nm-linja, trålfrie felt, maskevidde, sorteringsrist og stenging ved innblanding. Kystvakta har ingen havsjekker.
5. Priser for fryst fisk, sild, makrell og snøkrabbe (de tre siste har ingen pris i det hele tatt), og et salg gjennom Sildelaget.
6. Mottak for havbåtene: `PORTS` sjekker ikke kailengden (`BACKLOG.md` 10.4), og trål- og notmottakene er filtrert bort fra spillerens havner (`06b-coastports.js:47`).
7. Mannskapet i skift og lag. `V.crew {key, teams, rot}` er bare data. Lotten mangler tabeller for trål og ringnot.
8. Det spilleren gjør i 3D: ingen styring av trålen eller nota, og ingen arbeid på dekk på havbåtene.
9. Rammen stopper ved Bjørnøya og 1° Ø, så Svalbard, Nordsjøen vest og snøkrabbefeltene øst kan ikke nås.
10. Et steg i stigen mellom kystbåten 15 m (18 M) og havbåtene (60–250 M).

## 2. Regelverket det bygger på

Kildene er lest av en agent 03.11.2026. Det som er merket «ikke bekreftet», må sjekkes før fasen som bruker det.

**Tillatelsene:**

- **Hjemmelen:** konsesjonsforskriften (forskrift om spesielle tillatelser).
  - Torsketråltillatelse står i § 2-1, seitrål og reketrål er egne tillatelser.
  - Ringnottillatelse står i § 4-1, sildetrål i § 2-20 og loddetrål i § 2-22.
  - Konvensjonelle havfiskefartøy (autoline og garn over 28 m) har egen tillatelse, med garnseitillatelse som tillegg.
  - Snøkrabbe krever egen tillatelse. Den reguleres i en årlig forskrift fra 2025 (regjeringen.no, «Regulering av fangst av snøkrabbe i 2026»).
- **Strukturkvoteordningen** (forskrift 4.3.2005 nr. 193): man kjøper en tillatelse og legger kvotefaktorene til egen båt.
  - Konvensjonelle havfiskefartøy har et eiertak på 10 % av gruppekvoten (§ 12).
  - En ny forskrift er på høring fra 26.03.2026 («Fiskeritillatelser, kvotetak og fordeling av strukturgevinst», fiskeridir.no). Reglene kan altså endre seg.
- **Ringnot:** 69 tillatelser per 21.10.2025. Kvotefaktoren regnes av konsesjonskapasiteten i hl (Fiskeridirektoratets forslag til NVG-regulering 2026).
- **Snurrevad over 28 m:** ingen egen deltakeradgang er funnet. Store snurrevadfartøy fisker trolig på konvensjonell havfisketillatelse eller trål- og seitillatelse. **Ikke bekreftet.**

**Kvotene for 2026** (J-161-2026 §§ 3, 5, 7–9 og 13; gjeldende versjon er J-187-2026):

| Gruppe | Torsk (t) | Hyse (t) | Sei (t) |
|---|---|---|---|
| Torsketrål | 31 785 | 28 665 | 43 397 |
| Seitrål | 750 | 750 | 10 349 |
| Konvensjonelle havfiskefartøy | 10 717 | 8 647 | 6 128 |
| Lukket kystgruppe | 72 945 | 34 837 | 41 785 |
| Åpen gruppe | 9 257 | 3 768 | 7 800 |

- **Kvote per kvotefaktor 1,00:**
  - Torsketrål: 372 t torsk, 332 t hyse, 422 t sei.
  - Konvensjonelle havfiskefartøy: 118 t torsk og 107 t hyse, pluss 272 t sei med garnseitillatelse.
  - Fartøykvoten er kvotefaktorene (grunnkvote pluss strukturkvote) ganget med kvoten per faktor.
- **Pelagisk og snøkrabbe:**
  - NVG-sild: totalkvoten er 533 914 t og Norges kvote 342 666 t. Fordelingen er om lag 49 % ringnot, 41 % kyst og 10 % trål.
  - Makrell: foreløpig norsk kvote 52 479 t.
  - Snøkrabbe: 12 336 t for 2026 og 16 594 t for 2027. Garantert fartøykvote 351 t, pluss 82 t levende.

**Hvor de kan fiske** (høstingsforskriften FOR-2021-12-23-3910, lest på Lovdata):

- Trål ikke innenfor 12 nm fra grunnlinjene. Unntakene står i §§ 60–62 (§ 62: stormasket bunntrål mellom 6 og 12 nm for fartøy opp til en størrelse; 1200 BT er **ikke bekreftet**).
- § 56: Jennegga–Malangsgrunnen er trålfri 20.10–20.3.
- § 16: ingen bunntrål innenfor grunnlinjene grunnere enn 170 m i Nordland, Troms og Finnmark.
- § 26: line med maskinell egning ikke innenfor 4 nm, i perioder ikke innenfor 10 nm.
- § 27: krabbeteiner ikke innenfor 4 nm for fartøy over 21,5 m.
- § 58: ikke innenfor 20 nm av Bjørnøya.

**Redskap** (samme forskrift):

- Maskevidde for trål nord for 64° N: 130 mm. Snurrevad: 125 mm.
- Sorteringsrist i stormasket trål nord for 62° N (§ 12).
- Minstemål nord for 62° N (§ 47): torsk 44 cm utenfor 4 nm, hyse 40 cm, sei 45 cm.
- Innblanding: høyst 15 % under minstemål (§ 49). Felt stenges ved mer (§ 50).

**Omsetning:** hvitfisk og snøkrabbe i nord gjennom Råfisklaget, pelagisk gjennom Sildelaget.

**Priser** (omtrentlige):

- Snøkrabbe om lag 120 kr/kg (Råfisklaget 2025).
- Makrell 18–21 kr/kg og sild rundt 11 kr/kg (Sildelaget). Året for tallene er usikkert.
- Fryst torsk og hyse er ikke funnet, fordi Råfisklaget var blokkert. Antatt 40–55 og 25–35 kr/kg.

**Virkelige priser på båter og kvoter:** en ny fabrikktråler kostet om lag 500 MNOK (2023). En torsketrålfaktor er solgt for om lag 180 MNOK (rundt 2019, **ikke bekreftet**). Spillets 60–250 M svarer til brukte skrog uten kvoter.

**Driften (bransjetall, ikke bekreftet):**

- Autoline: opptil 50 000 krok i døgnet (snl.no). Turen er 4–6 uker.
- Snøkrabbe: 200 teiner per lenke og 5–7 døgn ståtid. Tak på 9 000 teiner per båt (HI/UiT).
- Torsketrål: 3–6 timer per hal og 2–20 t per hal. En frysetrålertur kan være rundt 40 døgn med 700–1 200 t rund fisk (islandsk eksempel).
- Ringnot: 2–4 timer per kast og 100–1 000 t per kast.

## 3. Fasene

Hver fase er én økt. Rekkefølgen under følger anbefalingene i valgene (kap. 4).

### H0 Grunnmuren for havbåtene (alle redskap)

- **Hva:**
  - **Mottak:** spillerens havner tar også trål- og notmottakene. `PORTS` får `quayFit` (kailengde og dybde), så en havbåt bare kan legge til der kaia passer, som NPC-skipene.
  - **Priser:** fryst fisk får egen pris (H0 setter nivået etter Råfisklagets statistikk når den kan leses). Sild, makrell og snøkrabbe får priser.
  - **Artene:** sild, makrell og snøkrabbe flyttes fra `npc` til fiskbare arter for havbåtene (ikke for kystbåtene ennå).
  - **Mannskapet:** blir lag med navngitte nøkkelfolk (valg V5).
  - **Kystvakta:** får en hake for havreglene.
- **Filer:** `06b-coastports.js`, `07-harbours.js`, `02-species-gear.js`, `03-simulation.js` (`sell`, `grade`), `04-crew.js`, `08-actions.js`.
- **Tester:** enhetstester for priser og kaipassing, `havntest`, `selltest`, `starttest`.
- **Måles:** at kystspillet er uendret (`simday`, `progweek`).

### H1 Tillatelsene og kvotefaktorene

- **Hva:**
  - **Objektet:** en tillatelse (torsketrål, konvensjonell havfisketillatelse, ringnot, snøkrabbe) med kvotefaktor. Fartøykvoten er faktor × kvote per faktor fra J-meldingen for året.
  - **Registeret:** tillatelsene ligger i et begrenset register på serveren, som hjemlene (`reg_take`, `reg_free`). Når en spiller kjøper en tillatelse, forsvinner ett NPC-havskip av samme slag (Jonas' regel; `havflaate.json`, `heldShare`).
  - **Papirappen** viser tillatelsene. Båthandelen låser opp en havbåt når spilleren eier tillatelsen den trenger.
  - **Kvotene:** dagens fartøykvote for kysten, `twoOK` og samfiske utvides til havgruppene. Hyse og sei får gruppedeling.
- **Filer:** `03d-quota.js`, `03-simulation.js` (`LIC_OFFERS`), `ui/phone/08-home-papers-merker.js`, `10-fartoy.js`, `14-act.js`, `05d-hav.js`, ny migrering `supabase/migrations/…_havkonsesjon.sql`.
- **Tester:** enhetstester for kvoten per faktor mot J-tabellen og for at registeret går ned og opp, `sqltest`, `quotatest`, `kjoptest`.
- **Måles:** serverkallene med 5 000 spillere (`bestand-og-flaate.md` 5b). Kjøp av tillatelse er sjeldent, men fartøykvoten må gå gjennom samme sammendrag som `world_get`.

### H2 Første havbåt: autolineren (eller den Jonas velger i V1)

- **Hva:**
  - **Linesettet:** autolinerens line som et sett av mange stamper, egnet av egnemaskinen (`autoHooks`). Opptil 40 000–50 000 krok i døgnet.
  - **Drift:** setting og drag døgnet rundt i to vakter, frysing om bord og turer på uker.
  - **Regler:** § 32 og § 26 (4 og 10 nm).
  - **Lott:** § 6 (havfiske).
  - **Driftsplan:** får autoline.
  - **Fangst:** `soakHour` med en egen faktor for autoline, kalibrert mot sluttsedlene for line 28+ (`fiske.json`).
- **Filer:** `10-gear.js` (`GEAR`, `SELQ`, `RIGS`), `06d-drift.js`, `ui/05c-drift.js`, `09j-kystvakt.js`, `04-crew.js`, `view3d/10-gear.js` (setting og drag fra en stor båt).
- **Tester:** ny `tests/unit/autoline.test.mjs` (fangst per 1000 krok mot sedlene), ny `havtur.py` (en hel tur: kjøp, ut, sett, dra, frys, lever ved mottak som tar konvensjonelt), `drifttest`, `geartest`.
- **Måles:** kg per 1000 krok og per tur mot sedlene for line 28+. Lotten per uke (`progweek`).

### H3 Snøkrabbe

- **Hva:**
  - **Teiner:** lenker på 200 teiner, ståtid 5–7 døgn, tak på 9 000 teiner.
  - **Fangst og regler:** fartøykvote, levende eller fryst krabbe, og § 27 (4 nm, og 6 nm i Finnmark om vinteren).
  - **Felt:** bare de feltene som er innenfor rammen (valg V4).
  - Bygger på teinesystemet som finnes.
- **Filer:** `10-gear.js`, `02-species-gear.js` (snøkrabbe), `03f-fiske.js` (`MIG.snokrabbe`), `09j-kystvakt.js`.
- **Tester:** enhetstest for fangst per teine, `potshot`, `havtur.py`.
- **Måles:** fangst per teine mot HI (1–5 krabber) og per tur.

### H4 Tråleren

- **Hva:**
  - **Redskap og fangst:** trålen er spillerens første aktive redskap. «Sett ut» skyter trålen (3D-fasene finnes), og båten sleper med 3–4 knop langs en linje spilleren legger i kartet. «Hal» tar den inn. Fangsten per hal kommer av tettheten langs slepet og trålens åpning, kalibrert mot sedlene for trål 28+.
  - **Regler:** 12 nm-linja med unntakene, trålfrie felt (§ 56), 170 m-regelen (§ 16), 130 mm og sorteringsrist som utstyr, og innblanding under minstemål med stenging (§§ 49–50).
  - **Om bord:** fabrikken: sløying og frysing i timen etter båtens kapasitet, og lotten for trål.
  - **3D:** spillerens tråler i 3D med `drawTrawl` fra spillets egen tilstand, slik NPC-ene gjør det (`NPCTOW`).
- **Filer:** ny `core/10c-trawl.js`, `03e-rules.js` og `rules.json` (trållinjer og felt fra Fiskeridirektoratets kartdata, `tools/rules/`), `09j-kystvakt.js`, `view3d/20-trawl-seine.js`, `ui/08-actions.js`, `10c-dock.js`.
- **Tester:** ny `tests/unit/trawl.test.mjs` (fangst per hal mot sedlene, innblanding, linjene), ny `tralspill.py` (en hel trålertur), `rulestest`, `kystvakttest`, `tral3d`.
- **Måles:** tonn per hal og per tur mot sedlene og det islandske eksemplet. At slepet ikke krysser land eller linjer.

### H5 Not: ringnot, snurpenot og pelagisk trål

- **Hva:**
  - **Leting:** sonaren og ekkoloddet viser sild- og makrellstimene, som finnes i `MIG` og stimene i B2.
  - **Kastet:** spilleren kaster rundt stimen (3D-fasene finnes), snurper, haler og pumper i RSW-tanken. Fangsten i et kast kommer av stimens størrelse, fra 100 til over 1 000 t.
  - **Salg:** gjennom Sildelaget, med pris etter art og kvalitet. Valg V6 avgjør om det blir auksjon eller fast pris.
  - **Kvoter og regler:** ringnotkvoter etter kapasitetsfaktoren og pelagisk trål innenfor 12 nm (§ 60).
- **Filer:** ny `core/10d-seine.js`, `03f-fiske.js` (stimene), `03-simulation.js` (salget), `view3d/20-trawl-seine.js`, `13-instruments.js` (sonaren).
- **Tester:** ny `tests/unit/seine.test.mjs`, ny `notspill.py`, `tral3d`.
- **Måles:** tonn per kast og kast per tur mot Sildelagets statistikk.

### H6 Snurrevad (fly-shooting) på kystnotbåten 38 m

- **Hva:** kastet slik NPC-ene har det i 3D. Fangsten kalibreres mot sedlene for snurrevad. Tillatelsen avgjøres i V3.
- **Filer:** `10d-seine.js`, `rules.json` (maskevidde, kvadratmasket pose).
- **Tester:** enhetstest, `notspill.py`.

### H7 Mannskapet i skift

- **Hva:**
  - Havbåtene går med to mannskap som bytter (`V.crew.rot`).
  - Lagene (dekk, fabrikk) er grupper med et navngitt lag med nøkkelfolk (skipper, styrmann, maskinsjef, kokk, bas), ikke 25 enkeltpersoner (valg V5).
  - Hviletid og vakter etter båten.
  - Lotten for trål og ringnot etter hyreavtalene. **Ikke bekreftet**; H7 sjekker avtalene først.
  - De ledige går på dekk i 3D (`deckcrew.js`), men bare de navngitte.
- **Filer:** `04-crew.js`, `14-crewlife.js`, `deckcrew.js`, `ui/phone` (Mannskap-appen).
- **Tester:** `crewlifetest`, `selfcrew`, `crewclip`.

### H8 Stigen og økonomien

- **Hva:**
  - Et steg mellom kystbåten 15 m og havbåtene (valg V2).
  - «Neste mål» viser veien til den første tillatelsen.
  - Prisene på båter og tillatelser settes etter valg V2.
  - Lånene får et rederilån for havbåtene.
- **Filer:** `03-simulation.js` (`LIC_OFFERS`, `LOANS`), `10-fartoy.js`, `progweek.py`.
- **Tester:** `progweek`, `kjoptest`, `turtest`.
- **Måles:** antall uker fra start til første havbåt uten å betale med ekte penger, og at ingenting kan kjøpes for ekte penger forbi en tillatelse (CLAUDE.md: «Alt kan nås uten å betale»).

### H9 Stikkprøver og spilltest

- **Hva:**
  - En havtur med hver båttype fra Båtsfjord, Hammerfest, Tromsø, Ålesund og Bergen: mottak, kai, regler og kvoter.
  - Skjermbilder i begge formater av alt i 3D.
  - Full regresjon og utrulling.

**Utenfor planen, som egen avgjørelse:** å utvide rammen til Bjørnøya, Svalbard og Nordsjøen vest. Det hører til kartplanen og krever en ny kartrelease.

## 4. Valgene

Hvert valg har en anbefaling og én setning om hvorfor.

**V1 Hvilken havbåt først**
- **A (anbefalt): autolineren.** Line finnes alt, så den første havturen kommer raskest og lærer oss frysing, skift, havmottak og tillatelser før de vanskelige redskapene.
- **B: tråleren.** Den er mest ikonisk, men alt er nytt på én gang (aktivt redskap, trålregler, fabrikk).
- **C: snøkrabbe.** Den bygger på teinene, men de fleste feltene er utenfor rammen.

**V2 Prisene og veien dit**
- **A (anbefalt): spillets nivå.** Dagens priser på 60–250 M inkluderer en tillatelse med én kvotefaktor. Flere faktorer kjøpes som strukturkvote. Et nytt mellomsteg (snurrevad- eller autoline-båt på rundt 28–35 m til 25–40 M) fyller hullet. Da kan havbåten nås på uker eller måneder uten å betale, slik reglene krever.
- **B: ekte nivå,** med hundrevis av MNOK for kvotene. Det er realistisk, men nesten ingen spiller kommer dit.
- **C: båten til spillets pris, og kvoten leies** per år av en NPC-reder. Det er realistisk og lett å komme i gang, men spilleren eier aldri kvoten.

**V3 Tillatelsene**
- **A (anbefalt): som i virkeligheten, forenklet.** Én tillatelse per gruppe (torsketrål, konvensjonelt hav, ringnot, snøkrabbe) med kvotefaktor. Et begrenset register der ett NPC-skip forsvinner når en spiller kjøper, slik Jonas har bestemt for kysten. Snurrevad 28+ under konvensjonelt hav til vi har funnet regelen.
- **B: en «havlisens» per redskap** uten faktorer og strukturkvote.
- **C: ingen tillatelse,** bare båten.

**V4 Hvor havbåtene fisker før rammen utvides**
- **A (anbefalt): innenfor dagens ramme.** Finnmarkskysten, Tromsøflaket, eggakanten, Vestfjorden og vest av Møre. Felt utenfor rammen (Bjørnøya, Svalbard, snøkrabbe øst) er «borte» også for spilleren: turen går dit og kommer tilbake med fangst etter sedlene, uten at den spilles.
- **B: vent med havsteget** til rammen er utvidet (ny kartrelease først).
- **C: utvid rammen som første fase** i havsteget.

**V5 Mannskapet på en havbåt**
- **A (anbefalt): lag med navngitte nøkkelfolk.** Skipper, styrmann, maskinsjef, kokk og bas er personer med liv. Dekk og fabrikk er lag med antall, ferdighet og lott. Dette holder ytelsen og appen håndterlig og gir likevel folk å bry seg om.
- **B: alle om bord som enkeltpersoner,** opptil 30. Det er tungt i appen og i 3D.

**V6 Hvordan spilleren fisker med trål og not**
- **A (anbefalt): automatisk med valg, og hånda på rattet når man vil.** Spilleren legger slepet eller velger stimen og trykker «Sett ut», og båten gjør resten, også i driftsplanen og når appen er lukket. Den som vil, styrer slepet og kastet selv.
- **B: bare aktiv styring.** Det er morsomt én gang og tungt den tiende, og passer dårlig med den felles klokka.

## 5. Antatt eller usikkert

- Driftstallene per hal og per kast er bransjetall, ikke målt. Hver fase kalibrerer mot sluttsedlene for sitt redskap og 28+ før den meldes ferdig.
- Fryst torsk og hyse er ikke prissatt fra kilde, fordi Råfisklaget var blokkert i nettet her. H0 henter tallene.
- Regelen for snurrevad over 28 m er ikke funnet.
- Den nye forskriften om kvotetak (høring 2026) kan endre strukturreglene.
- J-161-2026 er erstattet av J-187-2026, og paragrafnumrene må sjekkes der.
- Lotten for trål og ringnot (hyreavtalene) er ikke lest.
- Ytelse: en spillers tråler som sleper, er en ny bevegelse per minutt i kjernen og på serveren (posisjon og fangst). Det må måles mot kravet om 5 000 spillere i H1 og H4.
- Det er usikkert om fem nye redskap gjør grunnspillet for kysten tynnere. Engasjementsregelen sier havsteget er legitimt «så lenge grunnspillet føles komplett».

## 6. Hva planen ikke gjør

- Ingen utvidet ramme (Bjørnøya, Svalbard, Nordsjøen vest). Det er kartplanen.
- Ingen reketrål, loddetrål, kolmule, tobis, industritrål eller garnseitillatelse.
- Ingen ekte fartøynavn, rederier eller firmanavn (CLAUDE.md).
- Ingenting av havsteget selges for ekte penger. Tillatelser og kvoter kan bare kjøpes for penger tjent i spillet.
- Ingen fabrikk eller rom under dekk i modellene (CLAUDE.md: bare utsiden).

## 7. Status

- 03.11.2026: planen er skrevet etter Jonas' bestilling. Den venter på valgene V1–V6 og «kjør på».
- 03.11.2026: **H0 bygd** (Jonas: «Start H0 - Grunnmuren»; gren `ccr-6829f3d4-kl3gp4`).
  - **Mottakene:** mottaksdataene har sild, makrell, snøkrabbe og andelen fra 28 m og over. Havnene kjenner redskap, andel og kai.
  - **Havmottak:** 11 nye havner bare for havflåten.
  - **Regelen:** et havfiskefartøy legger til og leverer bare der kaia passer og mottaket tar redskapet.
  - **Prisene:** sild, makrell og snøkrabbe har fått prisene fra sedlene for 2025.
  - **Ikke gjort:**
    - Egen pris for fryst fisk er et spørsmål til Jonas, fordi det brøt en avtale.
    - Mannskapet som lag er flyttet til H7 (valg V5).
    - Kystvaktas havsjekker er flyttet til H1.
    - Rypefjord og Fiskarstrand øst venter på at butikken og verftet flyttes.
  - Se 4.18c i `havner-og-mottak.md`. Neste: H1, som venter på valgene V1–V6.
