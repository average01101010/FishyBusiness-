# Kartplotteren (2D)

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.10 Sjøkartet i 2D (kystplanen, fase K7, 02.10.2026)

- **Zoom:** fra hele landet (`ZMIN = MAP_H / 1800`, utsnittet 1 800 km høyt) til en havn (`ZMAX = 160`, en halv kilometer). `view.z` er fortsatt målt mot `MAP_H` (Senja-boksen).
- **Kartpakkene får vektorer** (`tools/map/chart.py`, som `region.py` legger ved):

  | Oppføring | Hvor | Innhold |
  |---|---|---|
  | `coast0` | kjernen | land i hele rammen forenklet til 300 m, polygoner over 0,2 km² (10 167 ringer, 294 kB pakket) |
  | `names0` | kjernen | navnene som vises fra hele landet: byer og tettsteder over 20 000 i Norge, over 150 000 i utlandet; hav, fjorder og sund som spenner over 40 km; øyer som spenner over 25 km (115 navn) |
  | `coast1` | `chart`-pakke per flis | land forenklet til 25 m, polygoner over 2 000 m² |
  | `coast2` | `chart`-pakke per flis | land forenklet til 3 m, polygoner over 50 m² |
  | `names` | `chart`-pakke per flis | steder, vann, øyer og topper/nes med rang 0–3, og vinkelen navnet dreies |

  - Vektoroppføringene ligger ved flisens første blokk med antallet som sjette felt, og leses med `mapVec(pk, navn)`.
  - Ringene er pakket som i `vectors.py` (klasse, antall punkter, sikksakk-steg). De ytre ringene og hullene går hver sin vei, så spillet fyller med `nonzero` og overlappende polygoner blir land.
  - Overture deler landet i biter. Spillet streker derfor ringene dobbelt så bredt og fyller over etterpå, så sømmene mellom bitene dekkes og bare stranda beholder streken (halvparten, på sjøsiden).
  - **Rangen:**
    - Steder går etter Overtures klasse og folketall.
    - Vann er stort sett punkter eller linjer langs fjorden i OpenStreetMap (`place=bay`). Det rangeres etter hvor langt det er til land fra punktet (200 m-masken), etter lengden på linja og etter arealet. Navn på -vika, -bukta, -hamna, -pollen og lignende kommer nær inne.
    - En fjord som er tegnet som linje, får navnet dreid langs linja (Malangen, Gisundet, Andfjorden).
    - Innen hver rang står det viktigste først, og spillet beholder den rekkefølgen.
  - Navnene har bokmål, norsk eller nynorsk der Overture har det, ellers første form av hovednavnet («Porsangerfjorden», ikke «Porsáŋgguvuotna»).
  - `names0` går etter avgrensningsboksene uten geometri (geometrien for hele rammen ville vært flere GB). Hvert navn plasseres i boksen der det er lengst fra land (vann) eller sjø (øyer), regnet på 200 m-masken.
- **Tre detaljnivåer etter høyden på utsnittet** (`chartLevel`, `src/js/ui/03a-chart.js`):

  | Nivå | Utsnitt | Kyst | Dybde |
  |---|---|---|---|
  | 0 | over 150 km | `coast0` | grovt: dybdemodellen uten skråningen mot land, høyst 160 000 punkter skalert opp; ingen flispakker hentes |
  | 1 | 8–150 km | `coast1` der flisen har kartpakke, `coast0` ellers | som før: detaljflisene, ellers kjernens land og dybdemodellen |
  | 2 | under 8 km | `coast2` | som nivå 1; landet er bare vektorkysten, med moloene (fra 04.10.2026, 4.19) |

  - På nivå 2 viser kartet det `legClear` regner som land: vektorkysten med moloene, havnelommene og mottakenes fyllinger (4.19). `charttest` krever at minst 99,5 % av punktene i et havneutsnitt stemmer (100 % målt 04.10.2026, mot 99,5–99,8 % med masken).
  - B-splinen for dybden brukes bare der en piksel er finere enn dybdecellene (50 m). Lenger ute gir bilineær like glatt kart for en femtedel av arbeidet.
  - **Tegnetid** i `charttest` (1 280 × 800, CPU strupet 4×): hele landet 0,1 s, regionen 0,35 s, fjorden (20 km) 1,5 s, havna 0,5 s. Fjordnivået er det tyngste: B-splinen med 16 oppslag per piksel. Det er det samme som før K7, og en kandidat for finpussen.
  - Stiene ligger som `Path2D` i km, flisene fra sitt eget hjørne, så tallene holder seg små ved største zoom. Hver flis tegnes innenfor sin rute, så kantene der polygonene er kuttet, ikke blir streket opp.
- **Gradnettet** tegnes i lerretet med et steg som gir minst tre paralleller over utsnittet (fra 10° ned til 15″). Meridianene får omtrent samme avstand på bakken. Breddene står ved venstre kant og lengdene ved nedre kant (`69°20'N`, `17°30'Ø`).
- **Stedsnavnene** står i SVG-en (`chartNamesSvg`):
  - Rang 0 vises alltid og kommer fra `names0` i kjernen, også over flisene. Fra 26.10.2026 (E4) plasseres rang 0 før havneetikettene (`chartNamesSvg(…, 'first')` i `renderStatic`), og en havneetikett som ville dekke et slikt navn, droppes på det nivået (ikonet står; etiketten kommer igjen nærmere inne). Før sto havneetikettene først, og «Kaldfarnes fiskebruk» (18 km bred på 100 km-nivået) tok «Senja» av regionkartet. Rang 1 vises under 140 km, rang 2 under 30 km og rang 3 under 9 km, alle fra flisene. Et flisnavn som `names0` alt har innen 60 km, droppes.
  - Det viktigste kommer først, og et navn som dekker et navn som alt står (eller en havns navn), droppes.
  - Et sted med samme navn som en havn innen 3 km droppes.
  - De håndplasserte navnene og Senja-kysten (`geo-coast.b64`, `COAST_D`) er borte. Havnenavnene og feltnavnene vises først fra `view.z ≥ 0,5`.
- **`charttest.py`** (uten 3D, måler tid, så den kjører alene til slutt), liggende og stående:
  - zoomer fra hele landet via regionen og fjorden til havna og sjekker detaljnivået på hvert trinn
  - sjekker land og sjø i pikslene, byene og fjordnavnene, gradnettet og at havnekartet stemmer med `isLand`
  - drar kartet med én finger og knipser det ut med to (berøring over CDP), forbi den gamle grensen på 0,8
  - måler tegnetiden med CPU strupet 4× (`Emulation.setCPUThrottlingRate`); grensen er 2,5 s på hvert nivå
  - skjermbilder: `chart_land.png`, `chart_region.png`, `chart_harbour.png`, `chart_pinch.png`
- **Ikke ennå:**
  - Kartpakkene finnes bare for Senja-flisene. Ellers tegnes `coast0`, også nær inne, over kjernens land på 200 m.
  - Navnene står vannrett (de gamle fjordnavnene var rotert langs fjorden).
  - `FINE` (den gamle 12,5 m-kysten) brukes fortsatt av plotteren i 3D.

- **Fliser (03.10.2026, etter spilltesten):** Bakgrunnen (dybde, fjære og land) tegnes nå i fliser på 256 × 256 piksler (`CT`, `chartTile`, `chartCompose`, `chartWork`). Kyst, gradnett og fjordlinje ligger på et eget lerret over (`CT.vec`).
  - En ny flis kommer først grovt (¼ oppløsning) med en gang. Så tegnes den fint, 8 ms per bilde, fra midten og ut.
  - Når kartet dras, tegnes flisene som finnes der de nå er (`chartPan`), så det blir aldri mørke felt.
  - Mangler pakkene, tegnes flisene fra kjernen (`prov`) og på nytt når pakkene kommer (`chartCame`).
  - Kom pakkene en annen vei enn plotterens egen bestilling (simuleringen, 3D, det lille kartet, `mapPreload`), hørte `chartCame` aldri om dem, og plotteren, som åpner på samme zoom hver gang (`PLOT_KM`), viste kjerneflisene til spilleren zoomet langt ut (01.11.2026, flere spillere). `chartCompose` ser nå selv etter: en `prov`-flis der pakkene den ventet på er inne, merkes `stale` og tegnes på nytt først i køen (`chartWork`); den gamle står til den nye er klar.
  - Fjæra leses bilineært fra masken med kantutjevning.
  - Kystlinja forenkles etter pikselstørrelsen (`pathStep`) og strekes som tre hårstreker under fyllet. En bred strek kostet 0,7 s rundt hele landet med CPU strupet 4×.
  - Dybden nær inne regnes med B-spline i hver 4. piksel og interpoleres imellom.
  - **Tidene med CPU strupet 4× (`charttest`):** første bilde 0,06–0,36 s og alt fint innen 1,6 s, mot 1,5–2,6 s før.

## 5.43 Kartplotteren laster raskere (tilbakemelding #55, 09.10.2026)

Målt først i Playwright, med CPU-en strupet 4× og nettet strupet til 10 Mbit/s og 40 ms. Måleskriptet ligger ikke i repoet.
- Første åpning av en region (120 km høy) tok 32–35 s. Det meste var ikke nedlastingen (38 pakker, rett under 0,9 MB den største), men hovedtråden:
  - Hver pakke som kom, tegnet hele kartet på nytt, også kysten (`chartVectors`, 130–350 ms i regionen i programvare).
  - Regellaget tegnet hele kartet på nytt hvert 60. ms til alle blokkene var regnet ut.
- **Endret** (`ui/03-map.js`):
  - Pakkene hentes seks om gangen, de under bildet først og nærmest midten først (`CHQ`, `chartWant`, `chartPump`).
  - En pakke i margen tegner ingenting på nytt. En dybdepakke (`sim`) tegner bare flisene som ventet på den (`t.wait`). En kartpakke (kysten) tegner hele bildet, høyst hvert 400. ms.
  - Regellaget tegnes over en lagret kopi av kysten og rutenettet (`CT.cb`, `chartVectors(V, true)`), så kysten tegnes ikke på nytt for hver runde.
  - Flisene får 16 ms per bilde når kartet ligger i ro (8 ms mens det flyttes).
  - Linja «Laster sjøkart · n av m» øverst i kartet (`#chload`) viser hvor langt hentingen er kommet.
  - En rute (`routeChanged`) henter pakkene langs seg til enheten (IndexedDB) én om gangen når kartet ikke henter noe annet (`chartWarm`). De holdes ikke i minnet.
- **Etter endringen**, samme måling:
  - Det synlige bildet hadde alle pakkene sine etter 21–26 s, mot 25–26 s før.
  - Kysten ble tegnet 10 ganger, mot 46.
  - Hele regionen var ferdig etter 30–45 s. Variasjonen fra kjøring til kjøring er stor, så forskjellen fra før er usikker. Seks pakker om gangen kan gjøre selve nedlastingen litt tregere enn alt på én gang.
- **Rettet samme dag (video fra Jonas):** Når kartet ble dratt, sto landet igjen mens navnene og båtene fulgte fingeren. `chartCompose` stemplet bildet med visningen slik den var *nå* (`view`), ikke visningen bildet var tegnet for. Regellagets nye runde (`chartVectors(V, true)`, fra endringen over) tegnet derfor et bilde av den gamle visningen og viste det som om det var den nye.
  - Nå får `V` visningen den ble laget for (`V.cx`, `V.cy`, `V.z`), bildet stemples med den, og `followChart` flytter det dit visningen er nå.
  - Regellagets runde tegner bare når visningen er den samme, og ellers ikke mens en finger er nede.
  - Under et langt drag eller en klyping tegnes kartet på nytt når bildet har flyttet seg en sjuendedel av skjermen eller blitt skalert en sjettedel, høyst hvert 350. ms. Det som ligger utenfor bildet, har kartets bakgrunnsfarge (`#mapwrap[data-cbg]`), ikke den mørke.
- **Svakt:**
  - Testmaskinen tegner lerretet i programvare. Der koster `drawImage` og kysten langt mer enn på et nettbrett med GPU, så tallene sier lite om nettbrettet.
  - Fliser i en Web Worker og lagring av ferdige fliser er ikke gjort:
    - `chartRaster` leser kartpakkene gjennom globale lesere, så en Worker måtte fått sine egne kopier av pakkene.
    - Flisene er knyttet til zoomen, som varierer fritt, så lagrede fliser ville sjelden blitt brukt igjen.

## 5.44 Bunnen i den lille kartplotteren (Jonas 09.10.2026)

«Ser så tomt ut når man ikke kan se bunnen i den.» `miniBg` (`ui/03e-miniplot.js`) tegnet 64 × 64 punkter i to blåtoner etter sikker dybde. Nå bruker den den store kartplotterens `chartRaster`, når pakkene er lastet (`dok`):
- Den tegner dybden i kartfargene og dybdelinjene, med høyst 560 punkter i bredden, skalert opp.
- Dybdetall (`miniSoundings`) står omtrent hver 70. CSS-piksel i et rutenett som ligger fast i kartet, slik som `soundingsSvg`.
- Før pakkene har kommet, brukes det gamle grove bildet.
- Det koster rundt 150 ms per bakgrunn i testmaskinen. Bakgrunnen tegnes bare når båten har flyttet seg en femtedel av radien, eller hvert 20. sekund.
- **I tidsbiter** (05.11.2026, laggen 04.11 i backloggen; Jonas: «Det største som står igjen er minikartets bakgrunn i 3D»). En bakgrunn var 70–255 ms i ett strekk på en PC hver gang båten hadde flyttet seg en femdel av radien (3–4 ganger så lenge på telefonen). Raden i `chartRaster` trenger raden over (kanten mot sikker dybde, `prev`/`left`), så radene deles ikke opp, men spres over bildene:
  - `chartRasterJob` (`ui/03-map.js`) setter opp `chartRaster` og gir et steg som gjør én rad i det grove B-spline-gitteret, én bilderad eller 16 rader med dybdelinjer per kall. `chartRaster` kjører stegene ferdig med én gang, så det store kartet (flisene, `chartWhole`) er som før. Med `scr` gjenbrukes tabellene (`VV`, `SV`, `MK`, `CK`, `G` osv.) mellom kallene; minikartet har sine egne (`MINIP.scr`), det store kartet lager nye som før.
  - `miniBg` lager en jobb (`MINIP.job`, `miniGen`: rastret, så kysten og dybdetallene) som tegner på et eget lerret (`MINIP.bg2`). `miniFrame` gir den en bit hvert bilde (15 % av bildet, 4–20 ms; har den stått over 4 s, inntil 30 % og 60 ms), og når den er ferdig, byttes lerretene (`miniStep`). Til da tegnes den gamle bakgrunnen forskjøvet etter båten; den er dobbelt så stor som boksen, så den dekker boksen til båten er en hel radius fra midten av den. Den første bakgrunnen, en ny størrelse, radius eller natt og et hopp over en radius tegnes med én gang som før. Er båten mer enn en radius fra den gamle mens jobben går, gjøres den ferdig med én gang.
  - Som generator ble hele `chartRaster` rundt 13 % tregere (målt med 16 bilder, varmet opp: 788–816 → 899–922 ms), fordi løkkene ble dårligere optimert; med radene som vanlige funksjoner er den som før (gammelt 789–898, nytt 831–877 ms, samme støy), og charttest gir de samme tegnetidene i begge byggene. Bare `miniGen` er en generator rundt stegene.
  - Bildet er det samme: `chartRasterJob` gir de samme bytene som `chartRaster` i det gamle bygget (sjekket med hash for fire steder, dag, natt og fiskekart, også med tabellene gjenbrukt). `MINIP.n2` teller bakgrunnene som er byttet inn.
  - Målt på PC med hele kysten (kart-31), sjarkny med fullt pådrag i 150 s, 800 × 1280, uten 3D-tegning (`#no3d`: i SwiftShader kom det bare et bilde hvert tredje sekund med 3D, og sidens tidtakere sultet, så båten hoppet et spillminutt om gangen og bakgrunnen ble tegnet med én gang), `tick` og `miniPaint` drevet fra bildene. Tallene er hvert sammenhengende kall i minikartet (`miniPaint` og bitene):

  | Sted | Over 50 ms før → etter | Over 100 ms | Lengste |
  |---|---|---|---|
  | Skjervøy (69,96° N 20,02° Ø) | 45 → 1 | 26 → 0 | 235 → 78 ms (fiskeekkoet, `heatDrawInto`; den lengste biten er 45 ms) |
  | Bodø (67,29° N 14,30° Ø) | 40 → 0 | 18 → 0 | 255 → 23 ms (med den endelige koden; 33 ms med generatoren) |
  | Stavanger (58,98° N 5,55° Ø) | 23 → 0 | 19 → 0 | 231 → 29 ms |
  | Kristiansand (58,05° N 8,05° Ø) | 32 → 0 | 24 → 0 | 220 → 24 ms |

  Skjervøy, Stavanger og Kristiansand er målt med `chartRaster` som generator (samme oppdeling og samme bilder, før radene ble vanlige funksjoner). Det som står igjen over 20 ms, er en rad der en kartblokk pakkes ut første gang (`mapBlock`), og fiskeekkoets bilde (`heatDrawInto` → `heatShown`, 78 ms én gang ved Skjervøy).

Rederi-appen har også fått regnskap med lånene (tilbakemelding #9): resultat, hvert lån (restgjeld, rente, terminbeløp, neste trekk, betalte renter i `L.intPaid`, telles fra 09.10.2026) og en balanse med flåtens verdi (`vesselValue`), konto, gjeld og egenkapital.

## 5.45 Søk i kartplotteren (Jonas 09.10.2026)

`ui/03f-search.js`. Forstørrelsesglasset (`#zsearch`) over båtknappen åpner et søkefelt (`#srch`).
- **Hva som finnes:**
  - Spillets steder: mottak, verft, butikker, rorbuer og naustet.
  - Sjøkartets navn: tettsteder, fjorder/sund/bukter, øyer, topper/nes. Det gjelder kjernens `names0` overalt og kartpakkenes `names` per flis.
  - En posisjon i desimalgrader («70.99 24.87»).
- Mens feltet er åpent, hentes alle kartpakkene (`chart`) for kysten, tre om gangen. Listen sier hvor langt den har kommet.
- **Rekkefølge:**
  1. Navnet selv. Det gjelder også med bestemt form, så «mefjord» finner Mefjorden.
  2. Navnet begynner på det som er skrevet.
  3. Et ord i navnet begynner på det.
  4. Navnet inneholder det.
  
  Innenfor hvert trinn kommer spillets steder foran kartnavnene, og nærmeste foran.
- **Valgt sted:** kartet går dit, med en ring (`srchSvg`) og et kort med «Autonav hit» og «Lagre merke».
  - «Autonav hit» går til stedets kai. For et tettsted eller en øy går den til nærmeste kai innen 4 km, ellers til punktet (`leiaTo`).
- Test: `tests/searchtest.py`.
- Svakt: like navn langs kysten skilles bare ved avstanden fra båten og typen.

## 5.46 Veiene blinket i kartplotteren (video fra Jonas 09.10.2026)

Tromsøyas gater kom og gikk i kartplotteren. `vecPrune` slapp vec-flisene som lå langt fra punktene den fikk. Båten ber om det med bare sin egen posisjon (`05-vessels.js`, 120 km), og 3D-visningen med øyet. Med båten på vei mot Båtsfjord ble flisene under kartet sluppet. Kartet ba om dem igjen (`vecWant`), de kom, og så ble de sluppet på nytt.

Nå tar `vecPrune` alltid med midten av kartplotteren når den er åpen. Kontroll: med kartet over Tromsø og båten ved Båtsfjord sto 3 666 veier igjen etter en runde med `vecPrune`, mot 0 uten. Det er målt med `KYST_VEC=1`, fordi vec-pakkene bare er med i bygget da.

- **Fangstfeltene uten sirkel** (Jonas 28.10.2026: «Fjern sirklene for fangstfelt langs hele kysten. Bare navn på felt langs hele kysten er ok, men det skal ikke vises som en definert sirkel»): `renderStatic` i `ui/03-map.js` tegner bare feltets navn (fra `view.z ≥ 0,5`). Fisket bruker feltene som før.

## 5.47 Mindre støy i kartet: navnene med prioritet og navnet ved trykk (E1–E2, Jonas 02.11.2026)

Jonas, med et bilde fra Hammerfest: «Vi må passe på at ikke blir alt for mye info og navn på kartet som overlapper hverandre slik at det bare blir støy.» Valgene 1A, 2A og 3A i `docs/planer/kart-etiketter.md`.

- **Én runde for navnene (E1, `renderStatic` i `ui/03-map.js`):** navnene samles (`lbl`) og settes i prioritetsrekkefølge:
  0. stedsnavnene av rang 0 (de største øyene, byene og fjordene), som før: de er få, og de er det man finner fram etter. Uten dem forsvant «Senja» under et mottaksnavn i regionkartet (`charttest`). Det er et avvik fra 2A, der stedsnavnene kom etter havnene.
  1. handelsstedene (mottak, butikk, verft, naust)
  2. dine merker og fangstmerkene
  3. rorbuene
  4. havnene
  5. de navngitte feltene
  6. dybdetallene og resten av stedsnavnene

  Et navn som ville dekke et annet, tegnes ikke. Ikonet står, og navnet går i `LBLHID`.
- **Havnene (3A):** en havn får ikke navn når et handelssted innen 1 km har samme stedsnavn først, eller når en havn med samme navn står innen 1,5 km.
- **AIS-navnene (`renderDyn`, 1A):** fiskebåtene (kystflåten, Senja-flåten og havflåten) får navn bare når de er ute, ikke i havn, og bare når kartet er under 4 km høyt. Navnene viker for alt det statiske laget satte (`LBLBOX`) og for hverandre. Spillerne og den valgte båten får alltid navn.
- **Navnet ved trykk (E2, `tapName`):** et trykk på et ikon som står uten navn, viser navnet i en mørk boble i 2,5 sekunder. Trykket gjør ellers det det gjorde før (ruta). Trykk på en båt gir AIS-kortet, og trykk på en annens redskap gir redskapskortet.
- **Test:** `tests/etikett.py` (med vec-pakkene): Hammerfest, Bergen og Tromsø i begge formater. Ingen navn overlapper, fiskebåtene i havn står uten navn, og trykket viser navnet og tar det bort igjen.
- **Større ikoner som viser hva stedet er** (Jonas 02.11.2026: «Kan du gjøre iconer litt større slik at de er lettere å se for brukerne? Lag det gjerne også slik at ikonene er relevante for hva de står for»): handelsstedene er 19 px tvers over nær inne (før 12,5), havnene 15 px (før 10) og rorbuene 16 px (før 11).
  - Mottaket: fisk med øye på blå sirkel.
  - Butikken: krok med øye og mothake på oransje firkant.
  - Verftet: båt på slipp med styrehus på grønn sirkel.
  - Naustet: brunt naust med de brede portene.
  - Havna: anker (`anchorPath`) på grønnblå sirkel.
  - Rorbua: rødt hus med dør på tre pæler.
  - Navnene står ett ikon og 5 px til høyre for ikonet.

