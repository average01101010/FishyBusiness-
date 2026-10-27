# Testing

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## Når de lange testene er nødvendige

Fra `CLAUDE.md` 26.10.2026 (Jonas 07.10.2026, «Spør før hver test»: «Dekker testen en fil jeg har endret, og kan endringen min få den til å feile?» Er svaret nei, kjøres den ikke. En push venter ikke på hele 3D-lista.)

| Test | Tid | Nødvendig når dette endres |
|---|---|---|
| `tut` | 40 min (ett format rundt 25 min) | veiledningen «Første tur», åpningen (brev, startsted) eller knappene den trykker på. Begge formater når tipsene eller knappene endres; ellers ett format med `KYST_TUT_ONE=liggende` eller `staaende` (Jonas 27.10.2026) |
| `tutcoast` | 15 min (`--all` rundt en time) | feltet og miksen for første tur (`tutFieldNear` i `08c-start.js`, `TUTB`/`tutBonus`), reglene (`03e-rules.js`) eller fiskemodellen. Krever hele kysten i bygget, og står ikke i `run.py` sine lister. Kjøres for seg: `python3 tests/tutcoast.py` |
| `heattest` | 30 min | varmekartet, ekkoloddet, sonaren eller fiskemodellen |
| `vessel3d` | 24 min | båtmodellene eller malingen |
| `sea3d` | 15 min | havskyggeren eller sjøtilstanden |
| `trackfollow` | 30 min | styringen, Autonav, rutene eller manøvreringsmodellen (`16b-dyn.js`) |
| `tral3d` | 12 min | trål eller not |
| `vectest` | 11 min | vec-pakkene (bygg, veier, bruer, kaier) |
| `teleport3d` | 8 min | kartlasteren eller 3D-terrenget |
| `kinotest` | 6 min | kameraet |
| `unittest` | 5 min | havner og mottak (kai, kran, truck, tidevann) |
| `coast3d`, `sitetest` | 4–5 min | terrenget, kartdataene eller mottaksregisteret |
| `kjoptest` | 3,5 min | butikken |
| `lighttest`, `ultratest`, `uishots`, `haultest` | 2–3 min | lys, ultra-grafikk, UI-oppsett, haling |

Hvilke tester som dekker hvilke filer, står i `COVER` i `tests/run.py`. Funksjonstestene og triksene står nedenfor (kapittel 11).

## 11. Testing

- **Verktøy:** Playwright med Chromium og SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). Testene finner spillet via `tests/_env.py` (`GAME` med `#notut`, `GAME_TUT` uten).
- **Kjøring** (bare det som er strengt nødvendig, brukerens krav 01.10.2026):
  - Under byggingen: `python3 tests/run.py changed`. Den leser `git diff` og untracked filer, og kjører bare testene i `COVER` for de endrede filene. En test som selv er endret, kjøres. Tekst og dokumentasjon kjører ingenting, og en fil som ikke står i `COVER`, kjører `trip2.py`.
  - `python3 tests/run.py smoke test …` kjører bare de testene du nevner.
  - `python3 tests/run.py full` er hele regresjonen før publisering (rundt en time, over to med alt). `--3d` tegner 3D i alle. Den kjøres med hele kysten i bygget (`release.py`, `game.py`), og hver natt til mandag av regresjonsrutinen (`tools/regresjon/RUTINE.md`, D5 26.10.2026), som bare leverer en PR mot `BACKLOG.md` 10.6 med loggene til det røde under `docs/regresjon/<dato>/`.
  - Testene i `LITE` kjøres med `KYST_LITE=1`, som gir `#no3d` i adressen: G3 er aktiv og alt går som før, men `frame()` tegner ingenting. Det gjorde `shoptest.py` rundt tre ganger raskere (43 s mot 13 s, med de samme 18 OK) og `docktest.py` fra rundt 10 minutter til 61 s. To slike går samtidig, først.
  - Testene i `D3` ser på selve 3D-bildet og går med 3D, én om gangen og uten andre tester ved siden av. Det gjelder også `tut.py` (`DRAWS3D`), som spiller «Første tur» med 3D. SwiftShaders bilder stopper opp under annen last: 03.10.2026 gikk alle 3D-testene som kjørte ved siden av testene uten 3D, ut på tid ved klikk og skjermbilder, men de gikk alene. `vessel3d` (60 skjermbilder) har 1500 s og `sea3d` 1200 s. `routetest` og `heattest` måler millisekunder, og `landtest` følger kranen i 3D bilde for bilde. De går alene til slutt (`SOLO`), ellers forstyrrer de andre testene dem.
  - Loggene havner i `tests/out/logs/`. `boot(pg)` i `_env.py` starter spillet og venter på startskjermen i stedet for faste pauser.
  - Testene henter spillet over HTTP fra en egen server per test (4.6). `KYST_DIST` peker på et annet bygg.
- **Regresjon:**
  - `trip2.py`: hel tur via kartplotter, avgang, 3D, fiske og havn.
  - `tut.py`: veiledningen «Første tur», spilt gjennom med berøring som en spiller, liggende og stående, med tre omlastinger. Skal ende med `"tut": 0`.
  - `dbg23o.py`: ingen WebGL-feil.
- **Funksjonstester**, blant andre:
  - **`seatest.py` (uten 3D):**
    - strøklengderoser og at `exposure()` er uendret
    - le og lo ved 11 m/s, WMO-høydene og jevnheten
    - at vinden dreier gjennom lavtrykkene
    - sjøgang, «krapp» og tekstene i Vær og vær-appen
  - **`stabtest.py` (uten 3D):**
    - GM og egenperioder per båttype
    - teiner på dekk og fangst i rommet
    - resonans
    - at arbeidet kjenner kurs og fart
    - varslene
  - **Fra 03.10.2026:**
    - `helmtest.py` (uten 3D): manuell styring med musa som finger, med «Kast loss», gass, ratt, nøytral, overtakelse fra rute, land og «Fortøy»
    - `sleeptest.py` (uten 3D): søvn på den felles klokka, «Våkn opp», oppvåkning når du kommer tilbake, brovaktsalarmen med ACK og døsigheten
    - `soundtest.py` (uten 3D): lydlagene følger båten. Den sjekker ikke hvordan det låter.
    - `lighttest.py` (3D): lysene om natta, «Lav» og fyrkjeglene
    - `kinotest.py` (3D): kino-opptakene, «Skjul» og avslutning
    - `haultest.py` (3D): halerne fra Blender, skiva og mannskapet
    - `charttest.py`: tidsmåler også første bilde og drar kartet et halvt utsnitt
      - Tegnetiden er beste av to malinger med CPU strupet 4x; fjorden stående ligger på 3,0 s mot grensen 2,5 s (rasterflisene i `chartRaster`, `BACKLOG.md` 10.6). Lyngen måles inne i alpene (69,3 N 20,3 E), og fjordnavnene slik pakkene plasserer dem uten havn i veien (E4, 26.10.2026).
  - **`sea3d.py` (3D):**
    - ingen hopp fra stille til orkan, ved brå vindendring eller når det nære kartet bygges på nytt
    - skumdekket mot Monahan, både regnet ut og tegnet
    - sjørokk og dis, le mot lo og havn, og `#novtf`
    - kjølvannet for skiff, sjark og kyst21
    - bildene `sea3d_bf.png`, `sea3d_lee.png` og `sea3d_wake.png`
  - `selltest.py`: salg, kvote, ferskfisk og sløying.
  - `simday.py` og `kvtest.py`: kalibrering av fangst.
  - `ordtest.py`: bestillinger, klær og kulde.
  - `streaktest.py`: innloggingsbonusen, med flyttet dato.
  - `fixtest.py`: feilrettingene etter spilltest 1 (haleren, pubkvelden, pubhjulet).
  - `timetest.py`: tidstekstene, nedtelling i ekte tid og «Neste»-brikka.
  - `shoptest.py`: Fiskeutstyr, sekkeis og isrenne, «Neste mål», sluttseddelen som summerer seg, og A8–A13.
  - `booktest.py`: dekksdagboka med faner, med ekte data (to salg gjennom `sell()`, en line satt og trukket med spillets egne steg). Fanene, kryss over det som er over, hendelser med samme prosent som `weekDev`, tellestreker, sluttseddelen som summerer seg og netto, gamle salg uten linjer, blaing innenfor fanen, oppdragslista, Papirer og lenken fra Salgslaget.
  - `docktest.py`: knappelinja, viftene, skuffen og «Sett ut» med berøring, liggende og stående. Knappene i havn og på sjøen, grå knapper som sier hvorfor, kjøp i skuffen, de ti appene, linjelengden i kartet (±2 px), dra i enden, setting langs linja, avbrutt setting, og «Ta opp» 50 m fra blåsa.
  - `camtest.py`: kameraet holdes utenfor kaier, kraner og bropilarer.
  - `routetest.py`: rute-editoren med berøring (WP-navn, kort, angre, dra, sett inn, A12) og «Følg leia».
    - K9 (Finnsnes–Tromsø, Bodø–Reine, Bergen–Florø) trenger hele kysten i bygget (`python3 tools/map/release.py`, `python3 tools/map/game.py`, så `node build.mjs`): med bare kjernen går Bodø–Reine på 200 m-celler og får to etapper som `isLand` avviser (E4, 26.10.2026). K9-linja i loggen skriver de dårlige etappene med posisjon, dybde og skjær. Regresjonen kjøres derfor med hele kysten.
  - `heattest.py`: fiskemodellen og varmekartet. Bestanden (nedtrekk på fire ruter, gjenvekst helt tilbake), hotspotene som trekker, stimene, skreiflekken på første tur, radius per trinn, varmen ved båten = 30·Σdensity, av og på, artsvalget, avlesningen, ettergløden, sonaren som utstyr, konsollen i 3D og ytelsen med CPU-en struping fire ganger (`Emulation.setCPUThrottlingRate`, en stand-in for nettbrettet). Skjermbilder i `tests/out/heat_*.png`.
  - `hailltest.py` og `luck2.py`: haill og pub.
  - `crewtest.py`: mannskap.
  - `motion2.py`: båtbevegelse, frakoblet med 60 bilder i sekundet.
  - `berthtest.py`: kaiplasser og trykk i kartplotteren.
  - `fleet1test.py` og `fleet1mig.py`: flåtemodell og migrering.
  - `moortest.py`: fortøyning og mottakene i 3D. Liggeplass i alle havner, å legge til med tauene og å kaste loss.
  - `harbourtest.py`: havnene. Mottak, is og drivstoff per havn. De ekte kaiene: alle båttyper ligger langs kaifronten i sjøen i 3D-kystlinja, og ruta inn og ut av hver havn går fri av land.
  - `tattest.py`: tatoveringene. Nautiske mil og trygge turer bare med deg om bord, grunnstøting og slep, alle kravene, de låste og appen.
  - `loretest.py`: overtroen. Fredagsavreise, at samme fortelling ikke gjentas, omdøping, mastemynt, fortellinger på sjøen og på puben, uendret humør og appen «Sjømann».
  - `worktest.py`: arbeid om bord (5.19). Den sjekker at mannskapet fordeler arbeidet selv (ingen kjeder, de gamle kjedene blir vaner), hvem som står hvor og hvorfor, sløyefarten per person, styrmannen, at det samme svaret kommer hver gang innen et minutt og at dekket ikke stokkes om, innsatsen og samholdet, roret og halingen som alltid får folk, krabbesortering, læring etter alder og trivsel, måltider og brødskiver, mat mot trivsel, 14-timersregelen og natt ved kai, replikker og avstanden mellom dem, energien til sjøs og ved kai, søvn alene (driver) og med mannskap (turen går videre), og menyen «Mannskap» liggende og stående med knapper på minst 44 px.
  - `selfcrew.py`: mannskapet som styrer seg selv (5.19), uten 3D, på havsjarken med to, kystbåten 14,99 m med fire og autolineren med ti. Linetrekket får folk ved haleren, bløggingen, bordet og isen, ingen tar pause mens fisken venter, og under fart styrer du eller styrmannen. Feilene kommer med et fast frø (`window.CREW_SEED`) og blir like hver gang, de slitne gjør flere, og et kutt senker innsatsen. På dekk: kaffen legges bort før arbeidet, haleren haler til avløseren er der, en hånd på døra før de går inn, og den slitne går i et langsommere tempo.
  - `decktest.py`: arbeidet på dekk. Bløggekaret, sløyefart, stopp når karet er fullt, én mann mot to, «ta unna før du går» og kvalitetstapet.
  - `geartest.py`: redskap i sjøen. Den har 27 sjekker:
    - kjøp i Redskap-appen etter plassen om bord
    - to om bord for garn, og grensene innenfor fjordlinja
    - strengen mellom blåsene
    - ståtidskurvene for line, garn og teiner, og maskevidden
    - trekking inn i dekksarbeidet
    - krabbesortering med gebyr og trekk
    - tap i storm og melding til Kystvakten
    - påminnelser, slitasje, bøting og egning
    - driftsplanens stasjoner
    - lagring, blåser i kartet og 3D
    - kalibreringen

    `Math.random` er seedet, så kjøringene gjentar seg.
  - `bunkertest.py`: bunkringen. Forhaling til bunkerskaia og tilbake, pumpefart og betaling, avgang som venter, Finnsnes, og i 3D stasjonene, forhalingen og telleren.
  - `landtest.py`: leveringen. Lossetid, kasser og kar, avgang som venter, isrenna, og i 3D at kroken står over lasten på dekk og over losseplassen og at trucken rekker siste tur.
  - `unittest.py`: havneenheten i de åtte havnene. Den sjekker minst 5 m vann langs fronten ved laveste lavvann, at havbunnen i bassenget ikke er over laveste vann i 3D, at truckens hjørner er minst 1 m innenfor dekket langs hele ruta, liggeplassene, mottaket og bunkersstasjonen, og at ingen brygge står på kaia. Bilder: `unit_<havn>.png`.
  - `fleet3test.py`: fase 3. Varsler, båtvelgeren, inntekt per båt og service per båt.
  - `fleet2test.py`: fase 2. Levering med og uten adgang, to båter på driftsplan i en simulert uke, knappene i Fartøy-appen, nybygg til flåten, og lagring med to båter. Skriver `OK` eller `FEIL` per sjekk.
  - `vesseltest.py`: fartøystigen. Ingen valg etter typenavn i `src/js`, fullt datablad og fornuftige forhold for hver type, utstyr som passer, de fem tilbudene, fjordlinja for 21 m, Båthandel liggende og stående (faner, kort med sideriss, havbåtene låst, knapper på 44 px), innbytte til 8,9-metersjarken, og progresjonen: blad B ved tiende landingsdag, migrering, innbyttet som innfrir lånet, inngangen med toppfinansiering, «Neste mål», banken, papirene og salg som innfrir lån.
  - `vessel3d.py` (3D): hver modell på sjøen fra siden, baugen, akter og rattet (`tests/out/vessel_<type>_*.png`, se på dem), punkter mot budsjettet, lengden innenfor 8 %, visningen i Båthandel, og NPC-båtene (modell per båt, skalering, punkter per utgave og et bilde ved siden av en båt som fisker). `python3 tests/vessel3d.py npc` kjører bare NPC-delen.
  - `progweek.py` (LES): boten som spiller fram til første båt i lukket gruppe (V8). Les dagen og turen for blad B og inngangen i hvert tempo.
  - `opsowntest.py`: driftsplan med deg om bord. Turen er din, torsken går på kvoten, ingenting blir inndratt, ingen kveiteomlegging og ikke noe skippertillegg. Skipperen alene gir de gamle reglene. Sjekker også at lagrede planturer rettes ved oppstart. Velger selv en rolig dag, fordi planen blir på land i for mye sjø.
- **Triks:**
  - Testmaskinen gir få bilder i sekundet, og `dt` begrenses til 0,1 s. Test dynamikk frakoblet med `G3._debug.stepBoat`.
  - Spillet lagrer seg selv når siden lukkes. For å teste gamle lagrede spill: legg dem inn med `context.add_init_script` i en ny nettleserøkt.
  - Nyttige verktøy: `G3._debug` (cam, bv, SK, TRAIL, stepBoat, eye, camInside, camFree), `ROD._strike/_prog`, `PUBW.open`, `PHONE.open(app)`, `mapToClient(p)`, `leiaRoute(a, b, aPort, bPort)`, `tutStep()`, `tutRect()`.
  - Berøring og drag i kartet: send `Input.dispatchTouchEvent` via CDP, og start Chromium med `--disable-gpu-compositing`. Med SwiftShader-komposisjon tegner plotteren rundt ett bilde i sekundet, og hvert fingerflytt venter på et bilde.
  - Kjør ikke mange 3D-tester samtidig. Da kan klikk og skjermbilder gå ut på tid.
  - Chrome skriver localStorage til disk med forsinkelse, og en file://-side som lastes på nytt med en gang, kan lese gamle verdier. Skal en test sende noe over en omlasting (datoforskyvning, en lagring), bruk `window.name`, som `streaktest.py` gjør.
  - Klikk telefonknapper med `document.querySelector('[data-pa=...]').click()`. Sidene i skuffen ligger i `#drawerBody`.
  - Playwrights `tap` venter på et stille bilde, og 3D blir aldri stille. Bruk CDP-berøring som i `tut.py` og `docktest.py`.
  - Test effekter med bestanden nullstilt (`S.stock = initStock()`) mellom kjøringer, ellers tømmer den første kjøringen feltet.
  - **Det samme hver gang** (E4, 26.10.2026): mannskap fra `genCrew` og alt annet som trekker `Math.random`, får et frø *inne i* `evaluate`-blokken (mulberry32, som `caretest.py`, `worktest.py` og `crewwalk.py`), fordi spillets egen løkke trekker tall mellom blokkene. To nye spill har hver sin `S.qseed`, som gytebestanden per år er nøklet på: sett `S.qseed` før en tur som skal sammenlignes (`maptest.py`). Gi testmannskapet `traits:[]` når trekkene ikke er det som testes (en sjøsyk mann står over rekka også under fart).
  - **Fryse spillet uten å stanse modellen:** `SIMREADY = false` stanser også manøvreringsmodellen (`dynCan`), så en test som stepper selv, bruker `TAB.held = true` (det `tick()` sjekker først), kaller `dynTick(dt)` og `step()` som `tick()` gjør, og setter `TAB.held = false; lastWall = Date.now()` etterpå (`routetest.py`, `camtest.py`). En båt som ligger stille til sjøs, driver med vinden (`lieDrift`, rundt 20 m i minuttet): sett `b.drv = null` og hold løkka når posisjonen skal stå.
  - **Vent på tilstand, ikke på runder:** SwiftShader lar hovedtråden stå stille i opptil et minutt nå og da; spillklokka tar igjen flere minutter på ett tikk, mens det som trekkes per bilde i 3D henger etter. En test som venter på noe, bryter på tilstanden og regner fristen fra spillets egne tider (`60 / simRate()` s per spillminutt) med romslig margin, og skriver et spor ved feil (`anchor3d.py`).
