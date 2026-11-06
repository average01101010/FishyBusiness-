# UI 2: telefon stående først (plan 06.11.2026)

> Venter på «kjør på». V1, V2, V4, V5, V6, V7 og V8 er tatt 06.11.2026. V3 er åpnet igjen etter Jonas' innvending mot søyla og står som V3 revidert (kap. 7). Bildene fra Jonas' telefon ligger i `ui-2/`.

## 1. Hva Jonas ba om

- 05.11.2026, om skjermbildene slik de er etter Kystlys: «Jeg mener personlig at det er myyyye å hente her, og har helst lyst til å re-designe hele systemet.»
- 05.11.2026: «Spillet er en pwa-app som sannsynligvis vil spilles mest på telefoner i stående format, men det må også være tilpasset nettbrett og pc ettersom det kan spilles i nettleseren.»
- 05.11.2026: «Spilleren kjører bare en båt samtidig. Om man trykker helt nederst til høyre åpner det seg en telefon med apper. Der finnes en app for rederiet spilleren eier, hvor han eventuelt kan ta styringen over en annen båt i rederiet, men jeg synes ikke menyen inne på appen er intuitiv nok den heller.»
- 05.11.2026, om underskuffene: «Det ligger litt forskjellig, og det vil ikke komme så mye mer. Spillet nærmer seg lansering.»
- 06.11.2026, valgene fra samtalen: V1 A (telefon stående er fasiten), V3 A («Kanskje stable de opp langs siden? Hva tenker du?»), V4 A (en knapp som ikke kan brukes, sier grunnen på seg selv), V5 A (Rederi med flåten først). V2: «Usikker på denne. Kom gjerne med konkrete forslag til hva du tenker.»
- 06.11.2026: «Jeg tenker man kanskje kan fjerne noen av knappene? Autonav kan man feks få tilgang til ved å trykke på mini-mappet, og andre knapper kan sikkert flyttes inn i andre ting eller?»
- 06.11.2026: «Jeg er også litt opptatt av at spillet skal være visuelt pent og at masse knapper og menyer ikke dekker hele bildet, kanskje spesielt under seiling der det ikke skjer så mye annet enn å følge med på naturen.»
- 06.11.2026, etter planen: «Vi må bare huske at mange spillere bruker ekkoloddet på mini-mappet aktivt mens de seiler for å lete etter fisken.» Og om søyla: «en mobilskjerm i stående format er jo smalest langs siden på en måte så knappene vil jo eventuelt være mer i veien på siden». V2 A, V6 A, V7 A, V8 A.

Reglene som gjelder (`CLAUDE.md`): grafikken er nesten det viktigste; alle UI-endringer tas med skjermbilder i stående og liggende før de meldes ferdige; handel bare på de tre handelsstedene; ingen ventetid lagt inn for å selge seg forbi den; patchnotes uten design eller psykologi. Ingen regelverk er berørt, så ingen kilder å sjekke.

## 2. Slik er det i dag

### 2.1 Kystlys (04.11.2026)

`docs/planer/ui-redesign.md`: undersøkelsen (`tests/uiplay.py`, 113 bilder og tellingen `census.json`) ble gjort bare i liggende format, og planen sier selv at stående ikke er undersøkt. Alle fasene U0–U10 ble bygd 04.11.2026. Det som kom inn, var tokenene og lagskalaen i `styles.css`, fire knappetyper, fangstkortene, «Nå»-kortene på telefonen, ordboka, og i knappelinja «høyst seks knapper, Mer og en hero». Grepet «fem steder i skuffen» (V3 A) ble mindre enn planlagt: de 21 sidene står. Informasjonsarkitekturen er altså den samme som før Kystlys; det er den denne planen bygger om.

### 2.2 Statusboksen og minikartet

- `renderHud` i `ui/04-panels-instruments.js` tegner enten hele boksen (dato og klokke, kassa, tilstanden `statusText`, neste hendelse `nextEvent`, fire målere, «nå»-radene, og hele tabellen ved trykk, `S.settings.hudFull`) eller stripa (`S.settings.hudMin`: klokka, tilstanden, varslene for sjø og energi, kassa). Høyden følger innholdet.
- `--gpsTop` og `--hudW` måles fra boksen (`getBoundingClientRect`, hvert 2. sekund), og minikartet (`#miniPlot`, `ui/03e-miniplot.js`) og GPS-stripa (`#gps3d`, `render3d`) legges under den. Når boksen vokser, flytter kartet seg.
- Stående telefon (`styles.css`, `@media (max-width:560px)`): boksen i `zoom:.74` og `max-width:47vw`, minikartet `min(var(--hudW), 20vh)`. Etikettene DIESEL LAST ENERGI SJØ renner sammen i den bredden. Liggende telefon (`max-height:520px`): minikartet er borte, GPS-boksen står under boksen, og minimer-knappen ligger over ordet «Fart».
- Stripa (`hudFold`, minimer-knappen) finnes alt, og Jonas' bilde `tlf-06` viser at skjermen med stripa og minimert kart er den reneste av dem alle.

### 2.3 Knappelinja

`DOCK` i `ui/10c-dock.js`:

- `items0` velger `portItems` eller `seaItems`. I havn: Hvil (ved naust eller rorbu), Mottak, Butikk, Bygd, Verft, Mannskap, Beholdning. Stille til sjøs: Jukse, Sett ut, Ta opp eller Til blåsa, Fortøy, Ta slep, Auto-nav, prai, anker, Hvil, Ansatte (ved krangel), Mannskap, Beholdning. Jukser: Stopp, Fisk videre eller Stopp og sløy, Jukse selv, Hvil, Mannskap, Beholdning. Underveis: Stopp båten, Auto-nav, Hvil, Mannskap, Beholdning. Redskapsarbeid: Stopp arbeidet. Nød: Hjelp. Avgang planlagt: Kast loss, Avbryt, Beholdning.
- `rowOf` kutter ved seks (`MAXV`), legger resten under «Mer» og Beholdning sist. `render` gjør det første med `pri` til hovedknappen. `infoText` fyller pilla `#dockInfo` over knappene (avgang, verksted, hviling, juksing til, dekket). `rowsUp` måler radene og løfter det som står over (`--dkx`).
- Stående telefon: knappene 44 px, etiketten 9,5 px, `flex-wrap:wrap-reverse`. Fem står på én rad, den sjette går opp alene (`tlf-01`). Viftene (`menuItems`) for Bygd og Verft har fem og brekker også (`tlf-10`, `tlf-11`). «Mer» inneholder Hvil i køya og Mannskap (`tlf-04`).
- Auto-nav (`autoNav`) åpner plotteren med Autonav klar (`leiaArm` i `ui/03b-route.js`). Plotteren har sin egen Autonav-knapp `#rAuto`, og veiledningens Autonav-steg peker på den (`ui/07b-first-trip.js` linje 86, 115 og 163), ikke på knappen i linja. Minikartet er `role="button"` og åpner plotteren (`docs/systemer/ui-og-telefon.md`). «Til blåsa» (`buoyGo`), «Kjør dit» (`goTo`) og Auto-nav som hovedknapp ved full last (spilltest 3, U5) bruker Autonav under.
- Juksekortet (`jigCard`: timer med − og +, artsbrikkene, «Start jukse») fungerer godt på telefonen (`tlf-02`) og er mønsteret for kort i viftene.

### 2.4 Skuffen

`#drawer`: stående et ark fra bunnen på 55 % (`@media (orientation:portrait)`), 88 % for skjemasidene i `TALL` (`dr.classList.toggle('tall', TALL.has(page))`, Driftsplan-gjennomgangen U1 A); liggende 380 px fra høyre, og linja flytter seg til venstre (`body.dk-open`). Sidene er telefonens (`DRAWER` i `ui/phone/11-rederi.js`, 21 sider). I stående stikker boksen halvveis opp bak arket (`tlf-03`). Mannskap-siden (`ui/05b-work.js`) har to like tunge knapper per person, «Gjør til skipper» og «Gjør til styrmann» (`tlf-12`).

### 2.5 Telefonen og Rederi

- `PHONE` i `ui/phone/00-shell.js`: `APPS` er 24 apper med hver sin farge, `IC` er strekikonene. Hjemskjermen `home` i `ui/phone/08-home-papers-merker.js`: klokka, vær og kassa, Neste mål, Første uke, fartstid, «Nå»-kortene (`nowCards`: reglene her, best betalt torsk, rederiet trenger deg), så rutenettet. På telefonen synes tolv apper før rulling (`tlf-05`). Flisene er fargede firkanter på en blågrønn gradient, et annet språk enn glasset og kortene.
- Rederi, `rederi` i `ui/phone/11-rederi.js`: rederikortet (båter, konto, inntekt i dag), regnskapskortet (året, lån, balansen, «Hele regnskapet» og «Til banken»), «Trenger deg» (`alerts` fra `vSummary`), flåten (ett kort per båt med status, posisjon, last, drivstoff, is, mannskap, driftsplan, inntekt, adgang og knappene Følg denne båten, Gå om bord, Gi nytt navn, Selg), og Foretaket. Flåten kommer under bretten. `vboard` i `ui/phone/14-act.js` krever at begge båtene ligger i havn; knappen er `disabled`, og grunnen står som en note under kortet.
- Stående telefon: telefonen fyller skjermen (`#phone` i `@media (max-width:560px)`). Liggende: 62 vw fra høyre.

### 2.6 Testene og målingen

`tests/uishots.py` tar hovedvisningene i fem størrelser (390×844, 844×390, 800×1280, 1280×800, 1440×900) og finner kuttet tekst, knapper utenfor skjermen, blokker oppå hverandre og knapper under 32×30 px. `tests/uiplay.py` spiller hele spillet og skriver tellingen. `docktest.py`, `dockrow`, `hudtest` og `tut.py` i begge formater dekker linja, boksen og veiledningen. `tests/driftsplan2gui.py` er mønsteret for en gjennomgang med ekte berøring i tre formater. Containeren har ingen GPU (3D i SwiftShader brukte ni minutter på elleve bilder) og bare Senja, så bildene med 3D kommer fra Jonas' telefon, og målingene tas uten 3D.

### 2.7 Bildene fra Jonas' telefon (06.11.2026)

| Bilde | Viser | Funn |
|---|---|---|
| `ui-2/tlf-01-sjo-stille-seks-knapper.jpg` | Stille til sjøs | Seks knapper: Beholdning alene på raden over. Sett ut stiplet. Boksen og kartet dekker baugen og masta. |
| `ui-2/tlf-02-sjo-juksekortet.jpg` | Juksekortet | Fungerer: timer, arter, én stor Start. Mønster for kort. |
| `ui-2/tlf-03-sjo-skuffen-beholdning.jpg` | Beholdning i stående | Arket på 88 %, boksen halvdekket bak, linja under arket. |
| `ui-2/tlf-04-sjo-mer-viften.jpg` | «Mer» | Inneholder Hvil i køya og Mannskap: de globale. |
| `ui-2/tlf-05-telefon-hjem.jpg` | Hjemskjermen | Fem kort før appene, tolv apper synlige, fargede fliser. |
| `ui-2/tlf-06-sjo-stripa-minimert.jpg` | Stripa og kartet minimert | Den reneste skjermen: hele båten synlig, to tynne striper. |
| `ui-2/tlf-07-underveis-fem-knapper.jpg` | Underveis 9,5 kn | Fem på én rad. Boksen minimert. |
| `ui-2/tlf-08-havn-fem-knapper.jpg` | I havn | Fem på én rad: Butikk, Bygd, Verft, Mannskap, Beholdning. |
| `ui-2/tlf-09-havn-butikk-viften.jpg` | Butikk | To i vifta: Fiskeutstyr, Elektronikk og haler. |
| `ui-2/tlf-10-havn-bygd-viften.jpg` | Bygd | Fem i vifta, brekker til to rader. |
| `ui-2/tlf-11-havn-verft-viften.jpg` | Verft | Fem i vifta, brekker til to rader. |
| `ui-2/tlf-12-havn-skuffen-mannskap.jpg` | Mannskap-siden | To like tunge knapper per person. |
| `ui-2/tlf-13-havn-skuffen-beholdning.jpg` | Beholdning i havn | «Service i butikken her» som første kort. |
| `ui-2/brett-01-fisker.jpg` … `brett-04-stille.jpg` | Nettbrett liggende | Boksen vokser med neste hendelse, og kartet flytter seg mellom tilstandene. Samme tid står i boksen og i pilla. |

## 3. Prinsippene

1. **Telefon stående er fasiten** (V1 A). Nettbrett og PC arver; der det er plass, får de mer av det samme, aldri noe annet.
2. **Naturen eier skjermen** (Jonas 06.11.2026). UI-et ligger i kantene, i faste soner, og det som ikke trengs nå, er borte. Roen tar bort knapper, aldri instrumenter: under seiling står stripa, minikartet med ekkoloddet, kompasset og én knapp.
3. **Faste soner.** Ingenting flytter seg fordi noe annet vokser. Innholdet varierer, rammen står.
4. **Hvert tall har ett hjem.** Neste hendelse står ett sted.
5. **Kontekst i linja, og så lite globalt som mulig** (V3 revidert). Linja har hovedknappen, høyst tre kontekstuelle og det ene globale, «Om bord», med Telefon ved siden av. Aldri «Mer», aldri to rader.
6. **En knapp som ikke kan brukes nå, sier grunnen på seg selv** (V4 A). En knapp som aldri kan brukes på denne båten, vises ikke.
7. **Kystlys-tokens beholdes** (V2 A, anbefalt): ingen ny palett, ingen ny skrift. Det som endres, er hva som står hvor, og at telefonen får samme språk som resten.
8. **Måles før og etter:** tellingen fra `uiplay.py` og bildene i fem størrelser.

## 4. Målet: skjermen i stående

### 4.1 Sonene

| Sone | Innhold | Fast |
|---|---|---|
| Toppen | Kompasset som i dag | ja |
| Øverst til venstre | Stripa, tre linjer med fast høyde | ja |
| Under stripa | Minikartet i fast plass (20 vh), eller kartets egen stripe når det er minimert | ja |
| Øverst til høyre | Kamera og Kino som i dag | ja |
| Midten | 3D, urørt | |
| Nederst til venstre | Dekksdagbok-fanen som i dag | ja |
| Nederst i midten | Knappelinja: hovedknappen, høyst tre kontekstuelle og «Om bord» sist, én rad | ja |
| Nederst til høyre | Telefon, som i dag | ja |

### 4.2 Stripa

Stripa er normaltilstanden i stående. Den har tre linjer og fast høyde:

- **Linje 1:** klokka · tilstandsprikken og tilstanden · kassa.
- **Linje 2:** diesel, last, energi og sjø som ikon og tall, farget ved varsel (gult og rødt som i dag, «Full» ved full last).
- **Linje 3:** neste hendelse («Fisket er ferdig 09:01 · om 30 min i ekte tid») eller varselet som gjelder nå (regler ✕ eller !, synkronrulling med rådet, blåsa langt unna med «Kjør dit», kulde), og dekkets kg og minutter under fisket. I havn står stedet der når ingenting er på gang («Ved kaia · Finnsnes», «Ved naustet», rorbuas pris), slik pilla gjør i dag. Til sjøs er linja tom bare mens båten ligger stille uten noe på gang (U2-0: 6 av 48 prøver), og plassen står. «Regler ✓» står ikke der; den er alltid sann og hører til boksen.
- **Trykk på stripa** gir hele boksen som et kort over kartet: målerne som i dag, «nå»-radene og hele tabellen. Et trykk utenfor lukker. Ingenting under flytter seg.
- **Pilla `#dockInfo` går ut.** Det den sa (juksing til, dekket, avgang, verksted, hviling), står på linje 3.
- Nettbrett liggende og PC har plass til hele boksen som i dag; den får fast bredde, og minikartet fast plass under den (antatt, kap. 8, avgjøres i U2-8).

### 4.3 Knappelinja per tilstand

Med V7 A (Auto-nav ut av linja, redskapet som én knapp):

| Tilstand | Hovedknappen | Resten |
|---|---|---|
| Havn ved handelssted | Mottak når det er fisk om bord, Verft når service er forfalt, ellers ingen | Mottak, Butikk, Bygd, Verft (bare de stedet har) |
| Havn ved naustet | Naustet | (Hvil står i søyla) |
| Avgang planlagt | Kast loss | Avbryt |
| Stille til sjøs | Jukse (på en båt rigget for juksa, uten eget redskap nær) | Redskap (vifte: Sett ut, Ta opp, Trekk og sett igjen; bare når settredskap er om bord), Fortøy (kai innen 400 m), Anker |
| Ved egen blåse | Ta opp, eller Til blåsa innen en halv mil | Jukse, Anker |
| Full last | Til mottaket · Botnhamn 3 nm (Autonav dit) | Jukse sier «Lasten er full» |
| Jukser | Jukse selv, Fisk videre eller Stopp og sløy | Stopp |
| Redskapsarbeid | Stopp arbeidet | |
| Underveis | Stopp båten | (roen, 4.5) |
| Slep, nød | Hjelp | |

I alle tilstander står «Om bord» sist i linja (4.4), og Telefon ved siden av. Høyst fem i stående medregnet Om bord. Hvil i køya er kontekstuell: den vises når energien er under varselgrensa, ved anker, og ved naust eller rorbu; ellers ligger den i boksen bak stripa. Prai og «Ta slep» (`ui/10n-hail.js`, `ui/10o-ptow.js`) kommer når en annen spiller er nær, og teller blant de tre; blir det for mange, slås Fortøy og Anker sammen til én knapp «Ligg» med vifte. Auto-nav går ut av linja: minikartet åpner plotteren, der Autonav er en knapp (`#rAuto`). Det som i dag bruker Auto-nav som hovedknapp, får sitt eget navn og kjører Autonav direkte. Viftene for Bygd og Verft får høyst fire på én rad, med fem som to rader på to og tre (ikke fire og én).

### 4.4 Det globale: «Om bord» og Telefon

Planen foreslo først en søyle ved høyre kant med Telefon, Beholdning, Mannskap og Hvil (V3 A). Jonas' innvending (06.11.2026) er riktig: i stående er bredden det knappe, og når kameraet er nær, fyller båten bredden (`tlf-07`), så en søyle legger seg over skroget. Det som taler for søyla, er at den dekker under halvparten av det en rad nummer to dekker, og at roen tar den bort; men den er et nytt element der linja alt finnes. Derfor, V3 revidert (anbefalt A):

- **Beholdning blir «Om bord»** og får Mannskap som femte fane ved siden av Redskap, Rigg, Lasterom og Båten. Alt som er om bord, er ett sted. Prikken for krangel og driftsplan flyttes til Om bord-knappen.
- **Hvil i køya blir kontekstuell** (4.3) i stedet for global.
- **Linja får da ett globalt element,** Om bord sist, og Telefon ved siden av som i dag. Det gir høyst fem på raden i stående, og ingen søyle.
- I liggende som i dag, med linja til venstre for skuffen når den er åpen (`body.dk-open`). Kamera og Kino øverst til høyre står.

### 4.5 Roen under seiling

Under seiling, og ellers når ingen har rørt skjermen på åtte sekunder, glir knappene ut: linja unntatt hovedknappen, Om bord, Telefon og dagbokfanen. Instrumentene står: stripa, minikartet med ekkoloddet (Jonas 06.11.2026: spillerne leter etter fisken i det mens de seiler) og kompasset. Kamera og Kino går ut med knappene. Et trykk hvor som helst henter alt tilbake. Et varsel (kuling, regler ✕, full last, framme) bryter roen. Kino (`#kinoBtn`, `#kinoHud` «Skjul», `view3d/24-cinema.js`) gjør noe av dette for hånd i dag, og roen bygger på den. Roen slår aldri inn i første tur (`tutOn`). Valget V8 sier hvor langt den går.

### 4.6 Telefonen

- **Rederi (V5 A), flåten først.** Ett kort per båt: navnet og typen, tilstanden med prikk, neste hendelse med nedtelling, last og diesel som to striper, båtens egne varsler («Trenger deg») som linjer på kortet, og hovedknappen «Ta roret» når begge ligger i havn. Ellers «Følg» som hovedknapp og «Ta roret» med grunnen i seg («Begge må ligge i havn»). Gi nytt navn og Selg bak ⋯ på kortet. Under flåten rederikortet (båter, konto, inntekt i dag), så regnskapet som én linje med lenke: «Regnskap 2027: −1 023 kr før skatt › Bank». Foretaket sist som i dag. «Gå om bord» heter «Ta roret»; regelen om havn står (spillets regel, ikke UI-ets).
- **Hjemskjermen (V6).** Flisene får instrumentspråket: samme strekikoner som linja, én glassflate, én aksent. Grupperingen etter V6. «Nå»-kortene står, men Neste mål, Første uke og fartstid blir én rad på to kort, så appene kommer over bretten.
- **Liggende** som i dag.

## 5. Fasene

Hver fase passer én økt og slutter med `/lever` og `/okt-slutt`, med skjermbilder i 390×844, 800×1280 og 1280×800.

| Fase | Bygger | Filer | Tester |
|---|---|---|---|
| **U2-0** Kartlegging i stående | `uishots.py` og `uiplay.py` i 390×844 og 800×1280, tellingen før; lista over alle datapunkt og handlinger i tre bøtter (sanntid, ett trykk, bakmeny); inventaret av linja per tilstand og telefonens apper og sider. Skrives til `ui-2/kartlegging.md`. Bare dokumenter og tester. | `tests/`, `docs/planer/ui-2/` | – |
| **U2-1** Stripa og sonene | Stripa med tre linjer og fast høyde som normal i stående; boksen som kort ved trykk; minikartet i fast plass uten `--gpsTop` fra boksens høyde; `#dockInfo` ut og innholdet på linje 3; veiledningens mål holdes i live (linje 3 har klassen `st nx`, dekk-steget peker dit i stedet for på `#dockInfo`, `#miniPlot` står; U2-0 K13); minimer-knappene og målerknappen til 44 px (K7) | `ui/04-panels-instruments.js`, `ui/03e-miniplot.js`, `ui/10c-dock.js` (`infoText`), `ui/07b-first-trip.js` (dekk-steget, linje 109), `styles.css` | `hudtest`, `dockrow`, `uishots`, `tut.py` i begge formater |
| **U2-2** Om bord | Beholdning blir Om bord med Mannskap som fane, prikken flyttet; Mannskap-knappen ut av linja; Hvil kontekstuell; Om bord sist i alle tilstander. (Ved V3 B: søyla i stedet, `src/index.html` og `styles.css`.) | `ui/10c-dock.js`, `ui/phone/11-rederi.js` (`DRAWER`, sidene `beholdning` og `arbeid`), `styles.css` | `docktest`, `dockrow`, `worktest`, `uishots` |
| **U2-3** Knappelinja | Reglene i 4.3: Auto-nav ut, Redskap som én knapp med vifte, hovedknappen med mål («Til mottaket · 3 nm»), grunnen på knappen (`data-why` tegnet under etiketten, ikke stiplet ring), det som aldri gjelder båten skjult, ingen «Mer» og ingen to rader i stående, viftene på høyst fire per rad | `ui/10c-dock.js`, `styles.css`, `ui/07b-first-trip.js` bare om et steg peker på linja | `docktest`, `dockrow`, `tut.py` i begge formater, fisketestene som trykker i linja (`fiskeplay`, `geartest`) |
| **U2-4** Roen | 4.5 etter V8 | `ui/10c-dock.js`, `styles.css`, `view3d/24-cinema.js`, `ui/02-format-state.js` (toast bryter roen) | `tut.py` (roen må ikke slå inn), `hbtest`, `uishots` |
| **U2-5** Rederi | 4.6 etter V5 A | `ui/phone/11-rederi.js`, `ui/phone/14-act.js` (`vboard`, `vfollow`), `styles.css` | `fleet2test`, telefontestene, `uishots` |
| **U2-6** Hjemskjermen | 4.6 etter V6, ikonene og flisene | `ui/phone/00-shell.js`, `ui/phone/08-home-papers-merker.js`, `styles.css` | telefontestene, `uishots` |
| **U2-7** Skuffen og sidene | Ett ark på 88 % for alle sider i stående, stripa synlig over arket; Mannskap-siden med én hovedknapp per person og resten bak ⋯; samme regel på sidene med flere like tunge knapper (U2-0 lister dem) | `styles.css`, `ui/10c-dock.js` (`TALL`), `ui/05b-work.js` | `dockrow`, `driftsplan2gui`, `worktest` |
| **U2-8** Nettbrett og PC arver | De fem størrelsene: hele boksen der det er plass, søyla i liggende, viftene; det som ser rart ut på 1440×900 | `styles.css` | `uishots` i alle fem |
| **U2-9** Måling etter og regresjon | Tellingen etter, patchnotes, `/regresjon`, fletting inn i arbeidsgrenen | | `/regresjon` |

Rekkefølgen U2-0 → U2-1 → U2-2 → U2-3 er ryggraden: stripa før Om bord, Om bord før linja mister Mannskap og Hvil. U2-4 til U2-7 kan tas i den rekkefølgen Jonas vil etter U2-3. U2-8 etter alt i `src/`, U2-9 sist.

## 6. Filene og hvem fasene ikke går samtidig med

- **Ø7 Småfeil** eier `ui/07b-first-trip.js`, `ui/07-guide.js`, `ui/06-logbook.js`, `view3d/12-skiff.js` og `ui/phone/`. U2-3 rører `07b` bare om et steg peker på linja; U2-5 og U2-6 rører telefondelene. Før U2-3, U2-5 og U2-6 begynner: `git fetch origin && git diff --stat origin/ccr-5e1ba2f4-pusvyd...origin/<Ø7-grenen>`, og vent eller flett.
- **H2d og H2e** eier `ui/phone/10-fartoy.js`, `ui/phone/14-act.js`, `ui/08-actions.js` og `ui/05d-plan2.js`. U2-5 rører `14-act.js` (`vboard`, `vfollow`): holdes til etter H2e, eller endringen holdes i `11-rederi.js` alene (knappene og teksten) med handlingene som de er.
- **Ø3 Ytelse** eier `view3d/02`, `04`, `06`, `17` og `18`, `ui/11-boot.js`. U2-4 rører bare `view3d/24-cinema.js`.
- **Ø9 Fysikk** og **Ø16 Sanntid** rører ingen av filene her.
- Alle fasene rører `styles.css`. To UI 2-økter går derfor aldri samtidig.

## 7. Valgene

**Tatt 06.11.2026:** V1 A (telefon stående er fasiten), V2 A (Kystlys strammet inn), V4 A (grunnen på knappen), V5 A (Rederi med flåten først), V6 A (hjemskjermen i grupper), V7 A (Auto-nav ut, Redskap som én knapp), V8 A (roen automatisk, med instrumentene stående).

**Åpent:**

- **V3 revidert, det globale.** Jonas valgte først A, søyla, og spurte så om den ikke er mer i veien i stående (kap. 4.4).
  - **A «Om bord» i linja** (anbefalt): Beholdning og Mannskap slås sammen til Om bord med fem faner, Hvil blir kontekstuell, og linja har ett globalt element sist. Ingen søyle, høyst fem på raden, og færre knapper, som Jonas ba om.
  - **B Søyla** som planlagt: Telefon, Beholdning, Mannskap og Hvil ved høyre kant. Dekker mindre enn en rad nummer to, og roen tar den bort, men den ligger over skroget når kameraet er nær.
  - **C To globale i linja:** Beholdning og Mannskap sist i linja som i dag, Hvil kontekstuell. Enklest, men seks på raden til sjøs med Fortøy og Anker.

**Slik var valgene stilt:**

- **V2 Omfang.** Jonas ba om konkrete forslag.
  - **A «Kystlys strammet inn»** (anbefalt): samme tokens, skrifter og flater. Det som endres: telefonens fliser får glass og strekikoner som linja; magenta brukes bare til hovedknappen og det som er aktivt; de stiplede rammene (pilla, knappene som ikke kan brukes) går ut; krem står bare i veiledningen. Lite arbeid, lav risiko, og problemene Jonas peker på er strukturelle, ikke fargene.
  - **B «Instrument overalt»:** mørkt glass også i skuffen og telefonens apper. Hver side må tegnes om, og lange tekstsider på mørkt leses dårligere. Kystlys V1 B, som Jonas sa nei til.
  - **C «Ny hud»:** ny palett og skrift. Hele tellingen gjøres om, og ingenting i bildene tyder på at det er fargene som er feil.
- **V6 Hjemskjermen.**
  - **A Grupper med overskrifter** (anbefalt): Drift (Rederi, Driftsplan, Oppdrag, Nettet), Handel og regler (Salgslaget, Kvote, Regler, Kaiboden), Deg (Milepæler, Garderoben, Venner, Sesong, Fiskeguide, Håndboka), Verden (Vær, Kystposten, Meldinger, Redning), System (Patchnotes, Tilbakemelding, Innstillinger, Admin). Spilleren finner Kvote og Regler uten å rulle etter dem.
  - **B Rutenettet som nå**, bare med nye fliser og ikoner.
  - **C En dokk** med de fire mest brukte nederst og resten bak «Alle apper».
- **V7 Færre knapper til sjøs.**
  - **A Auto-nav ut av linja og redskapet som én knapp** (anbefalt, Jonas' forslag): minikartet og plotteren gir Autonav, og «Til mottaket», «Til blåsa» og «Kjør dit» kjører den direkte. Sett ut, Ta opp og Trekk og sett igjen i én vifte, bare når settredskap er om bord. Stille til sjøs blir to til fire knapper i stedet for seks.
  - **B Bare Auto-nav ut.** Sett ut og Ta opp står med grunnen (V4 A).
  - **C Som i dag,** bare med grunnen på knappene.
- **V8 Roen under seiling.**
  - **A Automatisk** (anbefalt): etter åtte sekunder uten berøring, under seiling og ellers, med varslene som bryter den. Naturen får skjermen av seg selv.
  - **B Bare under seiling,** automatisk der, aldri ellers.
  - **C Bare Kino for hånd** som i dag, men med stripa i stedet for ingenting.

## 8. Antatt eller usikkert

- Stripa med fast høyde på tre linjer: U2-0 målte at linja har noe å si i 42 av 48 prøver til sjøs, og alltid i havn når stedet står der. Tom bare mens båten ligger stille uten noe på gang. Hvordan den tomme linja ser ut, ses på telefonen i U2-1.
- At minikartet åpner plotteren, står i `docs/systemer/ui-og-telefon.md`; U2-1 sjekker at trykket virker også når kartet er minimert.
- Veiledningens Autonav-steg peker på `#rAuto` i plotteren, ikke på linjas Auto-nav (U2-0 K13, `ui/07b-first-trip.js`). Men fire steg peker på boksens neste-linje (`#hud .st.nx`), ett på pilla (`#dockInfo`) og tre på minikartet, så U2-1 holder de målene i live, og `tut.py` i begge formater er porten.
- Hovedknappen «Til mottaket · 3 nm» trenger nærmeste mottak med rute: `plantsNear`, `goplace` og `goTo` finnes. Avstanden på knappen er luftlinje; ruta regnes når knappen trykkes.
- «Ta roret» krever at begge båtene ligger i havn (`vboard`). Det er spillets regel og står; UI-et sier den på knappen.
- Roen må ikke skjule et varsel eller slå inn i første tur. Hva som bryter roen, prøves i `tut.py` og `hbtest`.
- Containeren har ingen GPU og bare Senja. Bildene med 3D kommer fra Jonas' telefon; målingene tas uten 3D, der bakgrunnen er svart.
- Nettbrett liggende får trolig beholde hele boksen. Det avgjøres i U2-8 med bilder.
- Målet for tellingen fra Kystlys (høyst 10 skriftstørrelser, 25 bakgrunner, 6 radier) står. U2-0 sier hvor vi er.

## 9. Det planen ikke gjør

- Ingen nye funksjoner, og ingen endring i regler, priser, fangst eller økonomi. Alt som flyttes, gjør det samme som før.
- 3D, kartet og plotterens innhold er urørt.
- Slår ikke sammen de 21 skuffesidene (Kystlys V3 A, som ble liggende). Det kan bli en egen plan etter lansering.
- Ingen nye apper. Appene får ny plass og nye ikoner, ikke nytt innhold.
- Veiledningens tekster endres bare der de peker på noe som er flyttet.
- Ingen ny palett eller skrift (V2 A), med mindre Jonas velger B eller C.

## 10. Status

- 06.11.2026: planen skrevet etter samtalen 05.–06.11.2026 og bildene fra Jonas' telefon (`ui-2/`). Ingenting bygd.
- 06.11.2026, **U2-0 ferdig** (`ui-2/kartlegging.md`, `tests/kartlegging.py`, `uishots` i fem størrelser, `uiplay` i stående kjører): inventaret i tre bøtter (kap. 1 der), 17 tilstander målt i 390×844 og 800×1280, funnene K1–K15. Det som endret planen: linje 3 får stedet i havn og er tom bare når båten ligger stille uten noe på gang (4.2); U2-1 holder veiledningens mål i live (`#hud .st.nx`, `#dockInfo`, `#miniPlot`) og tar minimer-knappene til 44 px; viftene høyst fire per rad; Ansatte-siden inn i ett ark (U2-7). Bekreftet: fem på raden holder på telefonen, seks brekker; Om bord som fane gir ingen lengre side; pilla sier aldri noe boksen ikke sier. Ikke målt: full last, egen blåse, roen (lest i koden). `uishots` fant 0 i fem størrelser, så den ser ikke det strukturelle.
- 06.11.2026: Jonas svarte V2 A, V6 A, V7 A, V8 A, og la til to ting: ekkoloddet i minikartet brukes aktivt under seiling, så roen tar bort knapper og aldri instrumenter (4.5); og søyla ved siden kan være mer i veien i stående, så V3 er åpnet igjen som V3 revidert med «Om bord» i linja som anbefaling (4.4, kap. 7). Venter på V3 revidert og «kjør på». U2-0 kjøres som en Playwright-runde i stående før byggingen (Jonas' spørsmål 06.11.2026), med oppdraget: mål og finn, ikke tegn om.
- 06.11.2026, **U2-1 ferdig** (`ui/04-panels-instruments.js`, `ui/10c-dock.js`, `ui/07b-first-trip.js`, `styles.css`; `docs/systemer/ui-og-telefon.md`, «UI 2, U2-1»): stripa med tre linjer og fast høyde er normalen i stående (60 px telefon, 62 px nettbrett), boksen kommer som et kort ved trykk og lukkes utenfor, minikartet står fast (topp 106 px på telefonen i alle tilstander, 76 på nettbrettet), pilla `#dockInfo` er borte og det den sa står på linje 3, dekk-steget peker på `#hud .st.nx`, `hmin`, `plotMin` og målerknappen er 44 px. Nettbrett liggende og PC: hele boksen med fast bredde 270 px og reserve 196 px, kartet under reserven; «–» folder til den samme stripa. Avvik fra 4.2: stripa er 73 vw bred på telefonen (ikke boksens 47 vw) for at neste hendelse og dekkets kg skal stå på én linje; minikartet er 37 vw (som før, 144 px) under en bredere stripe. Linje 3 prioriterer varselet foran neste hendelse, og arbeidet som pågår og stedet i havn kommer etter. Testet: `hudtest` (skrevet om, 15 OK), `docktest`, `dockrow`, `uishots` i fem størrelser (0 funn), `kartlegging` (målt etter), `tut.py` i begge formater og `run.py changed`. Ikke gjort: K12 (tips og toast samtidig i plotteren, backloggen 10.1, Ø7). Neste: U2-2 Om bord.
