# Havsteget H2: autolineren (plan, 05.11.2026)

Jonas 05.11.2026: «Start neste steg, H2 i en ny økt». Valget av båt er V1 A i `havsteget.md` (03.11.2026: «Ja, du kan gjerne lage autolineren først»), og V2 B og V3 A gjelder: «Prisene må reflektere det virkelige liv, og tillatelsene må også være realitiske. Husk: vi lager en simulering av fiskerinæringen i norge». V6 A gjelder også her: fisket går automatisk med valg, og hånda på rattet når man vil.

Planen bygger på H0 (mottakene og prisene for sjøfryst fisk), H1 (tillatelsen `konv` med kvotefaktorer, 5.5b i `kvoter-og-regler.md`) og H1b (rammen, sonene i 5.28b, å ligge bi i 4.12j i `autonav.md`).

## 1. Hva som finnes i dag

**Båten** (`core/02-species-gear.js` `VESSELS.autoliner`): 45,4 m, last 400 t i frys (`hold:{kind:'frys'}`), 14 om bord (`crew.key` seks nøkkelfolk, lagene dekk 4 og fabrikk 4, `rot:2`), `autoHooks:40000`, sløyemaskin 2 500 kg i timen, `rigs:['line']`, `gearMax.stamp:0`, `land:'tub'`, `lock:true`. Prisen er skroget (70 M) pluss tillatelsen til selgerens verdi (`havPrice`, om lag 155 MNOK for en snitt-tillatelse). Kjøpet (`ui/phone/14-act.js` `buy`) sjekker alt `havLicWhy` (blad B, en tillatelse igjen i registeret) og tar tillatelsen (`havLicTake`); bare `lock` stopper det.

**Lina** (`core/10-gear.js`): kystlina i stamper (hyse 600 krok, bank 300), egnet i land eller om bord for hånd (`egnSelf`, 560 krok i timen), satt og trukket som ett sett `S.sets` mellom to blåser (`startSet`, `startHaul`, `gearOpMinute`), fangsten per time i sjøen (`soakHour`: `30 · q · krok/100 · SELQ · tetthet · agn · ståtid`). `autoHooks` leses bare av databladet (`ui/phone/10-fartoy.js:88`).

**Frysing:** `holdFreezes()` (`05-vessels.js:1043`) gjør at fisken som ises, fryses i stedet; arbeidet gjøres av dekkslaget (`workTeam('sloy')`, `workTeam('is')`) med sløyemaskinen. Fryst fisk råtner ikke (`keepK`) og selges til sedlenes pris for sjøfryst (`marketPrice(sp, H, fz)`, `pmF`). Ingen omregning fra rund vekt til produktvekt.

**Landingen** (`07-harbours.js` `landPlan`): kar på 300 kg, ett kranløft (2,5 min) per kar. 400 t blir 1 334 løft og over 55 timer (BACKLOG 10.1).

**Kvotene:** `access()` (`03-simulation.js:29`) gir `'lukket'` for hele rederiet når det har en kysthjemmel, `'open'` eller `'none'`. Havtillatelsen gir fartøykvoten `havQ` (118 t torsk og 107 t hyse per faktor, sei ingen), men landingene går ennå mot rederiets kystkvote.

**Reglene:** J-161-2026 § 32 tredje ledd (28 m og over ikke innenfor 4 nm, `03e-rules.js:265`), sonene utenfor kysten (5.28b), Kystvakta om bord for kystredskap (`09j-kystvakt.js`). Høstingsforskriften § 26 (line med maskinell egning) finnes ikke.

**Lotten:** § 6 havfiske (autoline, garn og snurrevad over 28 m) etter lengde står i `OPPG.hav` (`04-crew.js:89`) og velges for line over 28 m (`fisheryOf`).

**Driftsplan 2** (`core/06g-plan2.js`, `06h-plan2-engine.js`): line i stamper med ståtid 4–30 t og faste arbeidstider per stamp; går til kai i uvær, også med havfartøy (BACKLOG 10.2), og har ingen arbeidsgrenser for havfartøy.

**NPC-autolinerne** (`05d-hav.js`) setter og drar line på feltene og i 3D; spillerens båt har ingen slik visning.

**Tallene å kalibrere mot** (`src/data/fiske.json`, sedlene 2024–2025, line og lengdegruppe 28+, alle felt): om lag **40 000 t i året** (torsk 14 500, hyse 8 200, brosme 8 200, lange 6 300, blåkveite 2 000, resten under 400), jevnt over året (2 000–4 300 t i måneden). Registeret har **21 aktive** autolinere over 28 m, så om lag **1 900 t rund vekt per båt i året**, rundt 160 t i måneden. Med 40 000 krok i døgnet og 300 fiskedøgn blir det om lag **160 kg per 1 000 krok** i snitt.

## 2. Regelverket

Lest 05.11.2026 (kilde og hva som ikke ble lest, står ved hvert punkt):

**Hvor autolineren kan sette** (høstingsforskriften FOR-2021-12-23-3910, lest på Lovdata):

- **§ 26**: «Det er forbudt for fartøy over 21,35 meter som fisker med liner og som har maskinelt egningsutstyr om bord, å sette line innenfor 4 nautiske mil fra grunnlinjene langs norskekysten fra grensen mot Sverige til grensen mot Russland.»
  - Innenfor **10 nm** 1.9–31.12 i to felt utenfor Finnmark og Troms, og 1.9–30.4 i ett felt utenfor Nordland. Feltene er gitt med koordinater; de legges inn i `rules.json` fra teksten.
  - Gjelder ikke fløytline etter hyse. Uendret siden 1.3.2022.
  - Merk: grensen er **21,35 m**, ikke 28 m. Den rammer altså også en kystbåt med egnemaskin, men ingen kystbåt i spillet har egnemaskin.
- **§ 18 røkting**: bunnsatte liner for torsk, hyse og sei minst hver andre dag; liner for blåkveite, lange og brosme minst hver andre dag. Spillet har i dag 2 døgn for blåkveite og 4 døgn for kveite og breiflabb.
- **§ 66 merking** (minst ett vak med registreringsmerket) er bare lest som sammendrag.

**Kvotene** (J-187-2026, gjeldende fra 26.10.2026, erstatter J-161-2026, lest på fiskeridir.no):

- **§ 32 andre ledd**: «Det er forbudt for fartøy på eller over 28 meter største lengde å fiske torsk, hyse og sei med konvensjonelle redskap innenfor 4 nautiske mil av grunnlinjen nord for 62° N», med unntak for hyse og sei i område 06 og 07 og for område 00 i skreisesongen. Spillet viser til J-161-2026 § 32 tredje ledd; henvisningene oppdateres i H2a.
- **§ 13**: 118 t torsk og 107 t hyse per kvotefaktor 1,0, som i spillet. Sei (272 t) bare med garnseitillatelse.
- **§ 5**: gruppa har 10 717 t torsk, 8 647 t hyse og 6 128 t sei, «hvorav 500 tonn sei avsettes til bifangst».
- **§ 14**: «Det er ikke adgang til å ha bifangst av torsk eller hyse ut over fartøykvotene», og sei som bifangst opptil 25 eller 50 %.
- §§ 33–39 er bare lest som sammendrag.

**Lange og brosme** (J-128-2026, gjeldende 3.8–31.12.2026):

- Fartøy på 28 m og over kan lande inntil 5 516 t brosme og 3 202 t lange (§ 3).
- **Direktefisket er stoppet** for 28 m og over: lange fra 22.1.2026 (§ 9), brosme fra 6.8.2026 (§ 6). Etterpå er bare bifangst lov: inntil **35 % lange** og **15 % brosme** i fangsten og ved landing.
- Det betyr at sedlene for 2024–2025 (der lange og brosme er 36 % av autolinernes fangst) ikke passer 2026. Spillet starter i 2027, og reguleringen for 2027 finnes ikke ennå. H2a regner med gruppekvoten og stoppen når den er tatt (som et felt som stenges), og med bifangstgrensene etter stoppen.
- Blåkveitestoppen J-108-2026 gjelder bare under 28 m.

**Ikke lest:** hyreavtalen for konvensjonell havfiskeflåte (fiskebat.no og fiskarlaget.no kan ikke nås fra miljøet her; spillet bruker § 6 i oppgjørsavtalen som før), reglene for lange og brosme i EU- og britisk sone (J-177-2026 ikke åpnet), Fiskeridirektoratets omregningsfaktorer.

## 3. Fasene

H2 er for stor for én økt. Den deles i fire, hver én økt med `/lever`:

### H2a Lina, egnemaskinen og fangsten

- **Hva:**
  - **Linesystemet:** autolineren har ikke stamper. Lina ligger på magasin (stativer) i rommet under dekk, og egnemaskinen egner hver krok når lina går ut. Om bord: `pg.auto = {hooks, cond, bent}` med `autoHooks` krok, satt i **lenker** (for eksempel 6 000–8 000 krok, 1,3 m mellom krokene, 8–10 km) mellom to blåser. Ny `GEAR.auto` (eller `line` med `lk:'auto'`; avgjøres i koden) med egen fart: setting i 7–9 knop, draget 3 000–4 000 krok i timen gjennom haleporten.
  - **Agnet:** frossent agn (makrell, sild, blekksprut) kjøpt på mottaket, om lag 1 kg per 100 krok (antatt), ført i frysen og trukket fra lasten. Uten agn ingen setting.
  - **Fangsten:** `soakHour` med en egen faktor for autoline, kalibrert så en snittbåt tar om lag 160 kg per 1 000 krok over året, med artsfordelingen fra sedlene (torsk og hyse på bankene, lange og brosme på kanten, blåkveite på dypet).
  - **Reglene ved setting:** § 26 (maskinell egning innenfor 4 eller 10 nm), § 32 tredje ledd og sonene; varsel før feil (Regler-appen, `rulesAt` med redskapet `auto`).
  - **Kvoten:** landingene fra en havbåt går mot fartøyets egen kvote fra tillatelsen (`havQ`), ikke mot kystkvoten; `access()` får `'konv'` for fartøyet. Lange og brosme etter J-128-2026 (gruppekvote for 28 m og over, direktefisket stoppes når den er tatt, så bifangst inntil 35 % lange og 15 % brosme), valg V5.
  - **Kjøpet:** `lock` tas av autolineren, så den kan kjøpes med tillatelsen (blad B og pengene kreves som før).
- **Filer:** `core/10-gear.js`, `core/02-species-gear.js`, `core/03-simulation.js` (`access`), `core/03d-quota.js`, `core/03e-rules.js`, `ui/08-actions.js` (Sett ut / Trekk), `ui/phone/10-fartoy.js`.
- **Tester:** ny `tests/unit/autoline.test.mjs` (kg per 1 000 krok mot sedlene per art og sesong, § 26-linjene, kvoten per fartøy), `geartest`, `rulestest`, `quotatest`, `kjoptest`.
- **Måles:** kg per 1 000 krok og per døgn på fem felt (Finnmark, Tromsøflaket, Eggakanten, Møre, Nordsjøen) mot sedlene.

### H2b Drift om bord: frysing, vakter og turen på uker

- **Hva:**
  - **Fabrikken:** sløying, hodekapping og frysing i timen etter båtens utstyr (sløyemaskinen 2,5 t/t, fryseriet 20–30 t produkt i døgnet, antatt) og fabrikklaget. Det som ikke rekker å fryses, venter i bløggekaret, og draget går saktere (`haulSlow`), som på kystbåtene.
  - **Vektene:** lasten regnes i produktvekt etter Fiskeridirektoratets omregningsfaktorer, kvoten i rund vekt (valg V2).
  - **To vakter:** dekkslaget og fabrikklaget går seks og seks (`rot:2`) som anonyme lag med antall og ferdighet; nøkkelfolkene som personer kommer i H7 (valg V3).
  - **Turen:** proviant, drivstoff (300 m³), agn og lastrom setter lengden; varsler når noe går mot slutten. Mannskapet bytter i land (flyr hjem fra havn, slik Longyearbyen gjør).
  - **Lotten:** § 6 for autoline over 28 m med turoppgjøret som finnes.
  - **Landingen:** fryst fisk losses på paller (valg V1).
- **Filer:** `core/05-vessels.js` (`holdFreezes`, arbeidet om bord), `core/13-work.js`, `core/04-crew.js`, `core/07-harbours.js` (`landPlan`), `core/03-simulation.js` (`sell`).
- **Tester:** enhetstester for omregningen og fabrikkfarten, `selltest`, `crewlifetest`, `trip2`.
- **Måles:** tonn produkt per døgn og per tur, lotten per uke (`progweek`).

### H2c Autoline i Driftsplan 2, været og ligge bi

- **Hva:**
  - **Autoline som driftsform:** feltet får en sløyfe: sett lenkene, la dem stå 3–8 t, dra dem og sett igjen, døgnet rundt i vaktene, til lasten, agnet, drivstoffet eller planen sier stopp; så mottaket.
  - **Havfartøyenes værgrenser:** arbeidsgrensen for fisket (setting og drag stopper ved vind eller sjø over en grense under `risk`, antatt rundt 18–20 m/s og 5 m) og ligge bi over den (som 4.12j) i stedet for å gå til kai (BACKLOG 10.2).
  - **Den felles klokka:** sløyfen spilles også når appen er lukket (`catchUp`).
- **Filer:** `core/06g-plan2.js`, `core/06h-plan2-engine.js`, `ui/05d-plan2.js`, `core/05-vessels.js` (`lieTo`).
- **Tester:** `driftsplan2test` (nytt scenario: en uke med autoline), `driftsplan2ui`, alene.
- **Måles:** at en uke i planen gir det samme som en uke spilt for hånd (innenfor 15 %).

### H2d 3D, Kystvakta på havet, hele turen og stikkprøvene

- **Hva:**
  - **3D:** lina går ut over hekken og kommer inn gjennom haleporten på styrbord, med blåsene, slik NPC-autolinerne viser det (`view3d/10-gear.js`, `20-trawl-seine.js`).
  - **Kystvakta:** havsjekk om bord (posisjon mot § 26 og § 32, fangst og fartøykvote, minstemål og innblanding, bifangst).
  - **Hele turen** i `tests/havtur.py`: kjøp med tillatelse, ut fra en havn, sett, dra, frys, lever ved et mottak som tar konvensjonelt.
  - **Stikkprøvene:** turen fra Båtsfjord, Tromsø, Ålesund og Bergen; skjermbilder i begge formater.
  - Patchnotes.
- **Tester:** `havtur`, `kystvakttest`, `haultest`, og 3D-testen for redskapet alene.

## 4. Valgene

**V1 Hvordan fryst fisk losses**
- **A (anbefalt): på paller,** som fryst fisk losses i virkeligheten: om lag 1 t per løft og 25–40 t i timen (antatt; sjekkes mot et kjølelager), så 300 t tar et døgn. Kystbåtene og karene er som før.
- **B: kar på 300 kg som i dag.** Over 1 300 løft og to døgn for en full båt.
- **C: bare tiden,** uten løft i 3D.

**V2 Hva lasten måles i**
- **A (anbefalt): produktvekt i rommet, rund vekt på kvoten,** med Fiskeridirektoratets omregningsfaktorer. Slik regnes det i virkeligheten, og da betyr 400 t lasterom det samme som på båten.
- **B: rund vekt overalt som i dag.** Enklere, men lastrommet blir fullt for tidlig og prisen per kg passer ikke sedlene for sjøfryst.

**V3 Mannskapet i H2**
- **A (anbefalt): lagene som finnes** (nøkkelfolk, dekk 4 og fabrikk 4, to vakter) som anonyme lag med antall og ferdighet; navngitte nøkkelfolk med liv kommer i H7. Da kommer den første havturen raskere.
- **B: ta H7 inn i H2,** så nøkkelfolkene er personer fra første tur.

**V4 Rekkefølgen**
- **A (anbefalt): H2a–H2d som fire økter med utrulling etter hver,** så autolineren kan kjøpes og fiske etter H2a (for hånd), og planen og 3D kommer etter.
- **B: alt i én utrulling** etter H2d.

**V5 Lange og brosme i spillets år (fra 2027)**
- **A (anbefalt): som reguleringen for 2026:** gruppekvoten for 28 m og over, direktefisket stoppes når den er tatt (i 2026 i januar for lange og august for brosme), deretter bare bifangst. Autolineren må da leve av torsk, hyse og blåkveite store deler av året, som i virkeligheten nå.
- **B: som sedlene for 2024–2025,** der lange og brosme er over en tredel av fangsten hele året. Mer å fiske, men ikke slik reglene er i dag.

## 5. Antatt eller usikkert

- Med V5 A blir fangsten per 1 000 krok lavere enn 160 kg det meste av året, fordi lange og brosme i sedlene ble tatt før stoppene. Kalibreringen gjøres da mot torsk, hyse og blåkveite i sedlene, med lange og brosme som bifangst.
- Lenkenes lengde, krokavstanden, farten i setting og drag, agnet per krok og fryseriets kapasitet er bransjetall eller antakelser, ikke lest hos et rederi. Fangsten kalibreres mot sedlene, så det er tiden og arbeidet som er usikkert, ikke tonnene i året.
- Sedlene sier ikke hvor mye som er tatt i hvilken sone utenfor norsk økonomisk sone; fordelingen på felt følger hovedområdene i `fiske.json`.
- Omregningsfaktorene (V2) må hentes fra Fiskeridirektoratet; ikke lest ennå.
- Lossefarten for fryst på paller (V1) er ikke lest.
- Arbeidsgrensene for fisket med havfartøy er en vurdering, som grensene for å ligge bi.
- Lotten i § 6 står i spillet fra før; om hyreavtalen for 2026 er endret, er ikke sjekket (se kap. 2).

## 6. Hva planen ikke gjør

- Ikke garn eller snurrevad på konvensjonell havfisketillatelse (de hører til tillatelsen, men kommer med egne båter senere).
- Ikke garnseitillatelse, strukturkvote eller eiertak (H8).
- Ikke navngitte nøkkelfolk med liv (H7, om ikke V3 B).
- Ingen innredning, fabrikk eller rom under dekk i modellen (CLAUDE.md).
- Ingenting selges for ekte penger.

## 7. Status

- 05.11.2026: planen skrevet på grenen `h2-autoline`. Venter på valgene V1–V5 og «kjør på».
