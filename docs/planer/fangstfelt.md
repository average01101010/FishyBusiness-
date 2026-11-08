# Fangstfeltene med navn langs hele kysten (Ø14, plan 07.11.2026)

Plan for steg 31 i `docs/planer/koen.md` (`/planlegg`). Ingenting er bygd. Fasene står i køen som steg 31a–31e. Jonas svarte på valgene 07.11.2026 (kap. 5), og F2, F4 og F5 er lagt om etter svarene; F1 (steg 31a) er klar.

## 1. Hva Jonas ba om

- **Spilltest 1** (`docs/playtest/rapport-1.md`, 30.09.2026): «Fangsten føles for liten, og fangstfeltene betyr lite.» «En spiller som stoler på sirklene, blir skuffet. Kartet bør si at de er hint, eller sirklene bør vekte mer.» Backloggen 10.2 kaller det «De navngitte fangstfeltene finnes bare på Senja».
- **Jonas 06.10.2026:** spillet er nasjonalt. Alt som legges inn, gjelder hele kysten (`CLAUDE.md`).
- **Jonas 28.10.2026:** «Fjern sirklene for fangstfelt langs hele kysten. Bare navn på felt langs hele kysten er ok, men det skal ikke vises som en definert sirkel» (`docs/systemer/kartplotter.md`).
- **Jonas 01.11.2026** (B2): «Kjør på med alt som gjør at du mener vi klarer i simulerer fiskens liv med høyest mulig nøyaktighet.»
- **Jonas 02.11.2026** (etikettene, `docs/planer/kart-etiketter.md`): «Vi må passe på at ikke blir alt for mye info og navn på kartet som overlapper hverandre slik at det bare blir støy.» Valg 2 A: felt- og stedsnavn kommer etter alt spilleren handler og spiller med.
- **Jonas' svar på valgene, 07.11.2026:** «F1, jeg skjønner tanken om at felt har mer fisk men jeg mener vi må være forsiktig med å definere en fast boks eller sirkel der det står mer fisk bare fordi det er et fiskefelt. Ja det skal være mye fisk på feltene men vi må løse dette på en intuitiv måte.» «V2: a» «V3: Ta det mest realistiske» «V4: c, navnet på feltet kan stå men aldri tettheten på fisken.» Hva svarene betyr for fasene, står i kap. 5.
- **Startmeldingen for steg 31** (køen 07.11.2026): navnene finnes alt for hele kysten, så planen handler om vekten et navngitt felt har i spillet utenfor Senja (fangsten, varmekartet, Kystposten og oppdragene), hullene i Øst-Finnmark, tettheten av etiketter på nettbrettet, og hvordan det måles.

## 2. Hva finnes i dag

### 2.1 To slags felt

- **Senjas seks felt** (`GROUNDS` i `core/01-world.js`): Havet nord for Husøy, Utenfor Mefjorden, Vest av Gryllefjord, Malangsgapet, Gisundet nord og Solbergfjorden, med radius 1,6–6,5 km og en vekt per art (`g.sp`). Spillet er kalibrert på dem: `fkAvail` måler hver lokasjon mot Senja-feltenes lokasjoner (`GROUNDS` 0–3, `03f-fiske.js`), og `simday` fisker på dem.
- **Fiskeplassene langs hele kysten** (`tools/npc/felt.py` → `src/data/felt.json`, 128 kB, B2 01.11.2026): 4 684 navn fra Fiskeridirektoratets «Fiskeplasser – redskap», 4 682 etter at de to innen 1,5 km av et Senja-felt er tatt ut (`feltData` i `core/01e-marks.js`). Per felt bare et punkt, navnet, størrelsen (`r`, kvadratroten av arealet: median 1,5 km, p10 0,5, p90 5,0) og slaget redskap (`g`: 2 612 passive, 1 806 aktive, 266 begge).

### 2.2 Hva et navngitt felt gjør

| | Senjas seks felt (`GROUNDS`) | Fiskeplassene (`felt.json`) |
|---|---|---|
| Fangsten (`denSp`, `core/03-simulation.js`) | +0,45 × artens vekt × `exp(−(d/r)²)`, ut til tre radier. For torsk midt på feltet er det omtrent like mye som grunnleddet selv (0,25–0,7 med en vanlig flekk) | Ingenting |
| Skreien (`skreiSpot`) | +0,6 på de tre ytre feltene | Ingenting |
| Flåtetrykket og grunnlinja (`trkCellW`, `trkCell`, `baseAt` i `core/03g-trykk.js`) | Som alle andre ruter | Trykket ×3 (`TRK.groundW`) i 2 km-rutene med midten innen 3 km av feltets punkt; fisken (`BK`) er jevn i lokasjonen. Grunnlinja blir **lavere** på feltet enn like ved (2.3) |
| Varmekartet (`heatSample`, `core/12-heat.js`, via `density`) | Viser bumpen | Viser bare den lavere grunnlinja |
| Kartplotteren (`renderStatic`, `ui/03-map.js`) | Navnet fra `view.z ≥ 0,5`, 11 px | Navnet fra `view.z ≥ 1`, 10 px kursiv, de største først, ett per celle på 110 × 22 px, høyst 80 i bildet |
| Kystposten (`newsForDay`, `core/06-services.js`) | «Tynt fiske på …» hver tredje dag for `GROUNDS` 0–3 | Ingenting |
| Stedet i tekstene (`nearestPlace` i `core/01-world.js`: grunnstøting, sakene i Kystposten `pressStory`, kjentmannen `kjentFind` i `ui/09b-pub.js`; `recPlace` i `core/09b-records.js`: rekordene) | Feltnavnet | Bare havner: «4,2 nm fra Båtsfjord» |
| Puben (`rumour` i `ui/09-hand-fishing.js`) | Ryktet velger alltid blant Senjas seks felt, med prisen på Husøy | **Feil:** også en spiller i Bergen eller Båtsfjord hører om Husøy |
| Oppdragene (`turLetePlace`, `core/09g-turer.js`) | «ved <mottak>» | «ved <mottak>» |
| Første tur | Gisundet nord (`GROUNDS[4]`) | «utenfor <havn>» (`tutFieldNear`, `ui/08c-start.js`) |
| Sluttseddelen | Lokasjonskoden (`fieldCode`) | Lokasjonskoden |

Svaret på startmeldingens spørsmål: **feltet har vekt i fangsten bare på Senja. Utenfor Senja er vekten negativ der flåten fisker hardt**, og navnet brukes bare i kartet.

### 2.3 Målt: grunnlinja for torsk på feltene og like ved (07.11.2026)

Enhetstestenes laster (`tests/unit/run.mjs`), `baseAt(p, 'torsk', H)` den 15. i måneden 2027 kl. 08 UTC, snittet over fiskeplassene innen 25 km mot en rute 4–6 km unna i samme lokasjon og over 3,5 km fra alle felt. Testfila ble kjørt én gang og slettet; den er ikke i repoet.

| Sted | Januar på / utenfor | Mars på / utenfor | Juli på / utenfor |
|---|---|---|---|
| Husøy (fiskeplassene rundt, ikke `GROUNDS`) | 0,82 / 0,92 | 0,82 / 0,92 | 1,00 / 1,00 |
| Henningsvær | 0,97 / 0,99 | **0,68 / 0,85** | 1,00 / 1,00 |
| Røst | 0,94 / 0,98 | 0,77 / 0,90 | 0,99 / 1,00 |
| Bodø | 1,00 / 1,00 | 0,98 / 0,99 | 1,00 / 1,00 |
| Ålesund | 0,99 / 1,00 | 0,98 / 0,99 | 1,00 / 1,00 |
| Bergen | 1,00 / 1,00 | 1,00 / 1,00 | 1,00 / 1,00 |
| Hammerfest | 0,99 / 1,00 | 0,98 / 0,99 | 1,00 / 1,00 |
| Båtsfjord | 0,92 / 0,97 | 0,95 / 0,98 | 0,89 / 0,96 |
| Vardø | 0,95 / 0,98 | 0,96 / 0,99 | 0,91 / 0,97 |

I Lofoten i mars har et navngitt felt 20 % mindre torsk enn sjøen like ved. Der flåten er lett (Bergen, Bodø), merkes det ikke.

### 2.4 Kilden har mer enn vi leser

Fiskeridirektoratets WFS (`FiskeridirWFS_fiskeri`) ble lest 07.11.2026 uten polygonene (bare egenskapene):

- **Fiskeplassene** (2 941 passive og 2 101 aktive) har opptil åtte linjer med art, redskapskode og måned fra–til (`fiskeart_N`, `redskap_N`, `fra_N`, `til_N`), i tillegg til navnet. 5 006 av 5 042 har minst én art. 3 423 har en sesong (ikke januar–desember) på minst én linje. Redskapskodene er de samme som i sluttsedlene (`gear_of` i `tools/npc/fiske.py`: 20–29 garn, 30–39 line, 33–34 juksa, 40–49 teine, 50–59 trål, 60–69 snurrevad, 10–19 not).
  - **Artene** (linjer): torsk 2 151, sei 2 080, hyse 979, sild 773, reke 737, lyr 633, breiflabb 480, kveite 471, taskekrabbe 422, lange 375, makrell 323, brosme 297, uer 296. Blåkveite og kongekrabbe én gang hver.
  - **Finnmark** (kommunenumre 20xx og 54xx): bare torsk (100 felt), sei (70) og hyse (42), og ingen lyr, lange, brosme, uer eller kveite.
  - **Alderen:** de fleste er registrert 1988–2012, 314 i 2024–2026, og 58 står med 1899 (ukjent). Status er `A` på alle. Merknadene kan si at et felt ikke brukes lenger (Billefjordjupet: «Regulert bort i 2001»), men de leses ikke (2.6).
- **Gyteområdene** (`gyteomraader`, 1 645, alle med navn, art og måneder: torsk 1 160 linjer, hyse 352, sild 220, sei 159) og **oppvekst- og beiteområdene** (`oppvekst_beiteomraade`, 446 med navn) fra de samme intervjuene. De er ikke i spillet.
- **Gytefeltene for kysttorsk** (`gytefelt_torsk_mb`, 541, Havforskningsinstituttet, uten navn) og de stengte gytefeltene (`kysttorsk_stengte_gytefelt_jan_april`) hører til regelmotoren (Ø10), ikke til navnene.

### 2.5 Hullene langs kysten

Hvert felt er lagt til landsdelen til nærmeste mottak (`mottak.json`), og landsdelene er grovt delt etter breddegrad. Snitt per mottak, så steder med mange mottak (Båtsfjord) teller flere ganger.

| Landsdel | Mottak | Fiskeplasser | Gyteområder | Fiskeplasser innen 10 / 20 km av et mottak | Gyteområder innen 20 km | Nærmeste fiskeplass (median) |
|---|---|---|---|---|---|---|
| Skagerrak og Sørlandet | 14 | 181 | 4 | 9,1 / 21,4 | 0,8 | 3,8 km |
| Vestlandet | 39 | 1 357 | 422 | 15,6 / 52,6 | 15,4 | 2,7 km |
| Møre | 35 | 471 | 148 | 14,6 / 48,2 | 11,7 | 2,1 km |
| Trøndelag og Namdalen | 33 | 582 | 216 | 14,6 / 46,6 | 16,3 | 1,6 km |
| Helgeland og Salten | 29 | 793 | 220 | 22,3 / 72,2 | 16,5 | 1,8 km |
| Lofoten og Vesterålen | 56 | 518 | 264 | 7,6 / 26,8 | 16,3 | 3,1 km |
| Troms med Senja | 43 | 429 | 184 | 7,0 / 24,5 | 10,4 | 3,1 km |
| Vest-Finnmark | 19 | 212 | 100 | 4,8 / 18,9 | 9,2 | 5,1 km |
| Øst-Finnmark (øst for 25,5° Ø) | 42 | 141 | 87 | **2,5 / 8,4** | 6,1 | 5,6 km |

De tynneste: Tana (ingen fiskeplass innen 20 km, nærmeste 24 km unna), Båtsfjord (3–5 innen 20 km, nærmeste Bjørnvika 11 km unna), Bøkfjorden i Sør-Varanger (5, 12 km). Kartet sier noe om hvor fiskerne ble intervjuet, ikke om hvor fisken står.

### 2.6 Navnene

- 246 navn står med store bokstaver («SANDEID», «RØVÆRFJORDEN»), to er koordinater («N 59°29,4' Ø 5°06,3'»), åtte har liten forbokstav («taran», «lKråksundet - Selfjorden»).
- 199 har skråstrek, tall eller parentes («Ytterholla/Porsangerfjorden», «Lonkanfjorden indre 1»). De lengste har 45–50 tegn («Yttersia fra Hæstholman til Eggum til Borgvær»). Medianen er 12 tegn.
- 182 navn står flere steder (Nordfjorden sju ganger). Det er ekte navn og får stå.
- «Brukere», opphav og merknadene leses aldri (B2), og planen endrer ikke det.

### 2.7 Tettheten i kartet

Regelen i dag: ett feltnavn per celle på 110 × 22 px fra `view.z ≥ 1`, høyst 80. Det er ikke målt på telefon eller nettbrett. Grovt regnet: i 390 × 844 er det rundt 130 celler og på Pad 3 (1 293 × 830 liggende og 915 × 1 208 stående i spilltest 2) rundt 440, så taket på 80 nås i tette strøk som Helgeland og Vestlandet. 80 navn à 12 tegn i 10 px er rundt 67 × 10 px hver. `tests/etikett.py` sjekker at navnene ikke overlapper, men ikke hvor mange de er. Ingen test ser på feltnavnene.

## 3. Fasene

Én økt hver. Rekkefølgen: dataene først (F1, nesten usynlig), så fisken (F2), så tekstene (F3), så etikettene (F4, kan gå før F2 og F3 når `ui/03-map.js` er ledig). F4 kan gå før F2 og F3 når F1 er ute. F5 etter F1, når verten `api.kartverket.no` er åpnet i miljøet. Testene under er de som dekker filene etter `COVER` i `tests/run.py`; `python3 tools/plan/tester.py` gir den fulle lista for grenen.

### F1. Fiskeplassene med art, redskap og måneder, og navnene vasket (steg 31a)

- **Bygger:**
  - `felt.py` leser også `fiskeart_1–8`, `redskap_1–8`, `fra_1–8` og `til_1–8`, og skriver per felt artene som spillet kjenner (torsk, hyse, sei, lyr, lange, brosme, uer, kveite, blåkveite, sild, makrell, snøkrabbe, kongekrabbe), hver med månedene som en maske på 12 biter og redskapene som en maske etter `GEAR` i `fiske.py`. Når samme navn innen 3 km slås sammen (`MERGE_KM`), slås linjene sammen. Et felt uten art får ingen linjer.
  - **Navnevasken:** store bokstaver blir vanlig skrift («Røværfjorden»; små ord som «i», «av», «til» og «fra» med liten), stor forbokstav, koordinater ut (feltet får da intet navn og står bare som vekt), og navnet i kartet kortes ved en skråstrek eller etter 28 tegn (hele navnet vises ved trykk i F4). Hver regel med antallet den rettet, i `felt.py`s utskrift.
  - **Formen til F2:** polygonet til hver fiskeplass, forenklet (rundt 100 m) eller som ruter på 500 m; størrelsen avgjør. Gyteområdene og oppvekstområdene trenger bare punktet.
  - **V3 (Jonas: «Ta det mest realistiske»):** gyteområdene og oppvekst- og beiteområdene inn som eget slag (`k`: `f` fiskeplass, `g` gyteområde, `o` oppvekst og beite), med navn, art og måneder. De får aldri vekt og aldri flåtetrykk: `trkAreas` og `trkCellW` tar bare `k = f`, og `feltIn` gir dem ikke til kartet før F4.
  - `feltData` leser de nye feltene (`f.k`, `f.l` med [art, redskap, måneder]). Ingenting annet i spillet endres.
- **Filer:** `tools/npc/felt.py`, `src/data/felt.json`, `core/01e-marks.js` (`feltData`, `feltIn`), `core/03g-trykk.js` (bare filteret på slaget), ny `tests/unit/felt.test.mjs`, `tests/run.py` (`COVER` for `tools/npc/felt.py`), `docs/systemer/fiskerimodellen.md` (5.3c «Feltnavnene»).
- **Tester:** `tests/unit/felt.test.mjs` (ny; antallet per slag, Billefjordjupet har torsk med garn, et kjent sesongfelt har riktige måneder, ingen navn med koordinater eller bare store bokstaver, ingen `g` eller `o` i `trkAreas`; sett rød før `felt.json` er ny), `trykk.test.mjs` (gruppesummene står), `charttest` (`felt.json`), `marktest` (`01e-marks.js`). Fordi trykket flytter seg litt når felt slås sammen og koordinatnavn går ut: `simday` og `heattest`.
- **Måles:** `felt.json` før og etter (128 kB nå; målet under 350 kB med formene; blir den større, legges formene i en egen fil i `data/` som hentes ved oppstart, som modellene i `bootData`), `feltData` i Node og i Chromium (første oppslag), tabellen i 2.5 på nytt med de nye slagene, antallet rettet per vaskeregel.
- **Spilleren ser:** penere navn i kartet. Ingenting annet.

### F2. Fisken står på feltene slik flekkene står i sjøen (steg 31b)

- **Jonas' svar (V1, 07.11.2026):** «… vi må være forsiktig med å definere en fast boks eller sirkel der det står mer fisk bare fordi det er et fiskefelt. Ja det skal være mye fisk på feltene men vi må løse dette på en intuitiv måte.» Derfor ingen fast vekt over et område. Feltet er stedet der fisken *pleier* å stå, og det merkes gjennom det spillet alt har: de gode flekkene som flytter seg, stimene, dybden og kantene.
- **Bygger** (med V2 A):
  - **Flekkene kommer oftere til feltet i sesong.** De gode flekkene (`hotspot`: mønsteret på 3,5 km som glir 0,7–1,7 km i døgnet og toner over 120 timer) står som i dag. På en fiskeplass som har arten i måneden (et felt uten art: juksaartene hele året), løftes flekkens verdi mot det beste med feltets *trekk* for perioden: et tall mellom 0 og rundt 0,6 som trekkes på nytt hver 120. time for hvert felt og toner over som flekkene selv. I én periode står det en sterk flekk på feltet, i neste en svak, eller den ligger på kanten. Over sesongen står det mye fisk på feltet, men ikke det samme hver dag, og spilleren finner den med ekkoloddet og varmekartet som før.
  - **Formen er feltets egen:** polygonet fra Fiskeridirektoratet (forenklet i F1), mykt i kanten (rundt 0,5 km), og bare der dybden passer arten (`depthFactor`). Ingen sirkel rundt et punkt og ingen fast boks: innenfor feltets omriss følger fisken flekkens eget mønster.
  - **Summen per lokasjon står:** løftet regnes som snitt over lokasjonens sjø per art og måned (`feltWl`), og tettheten deles på det. Lokasjonen har like mye fisk som før, så `fkAvail` og kalibreringen mellom stedene står; fisken flyttes bare innen lokasjonen.
  - **Flåten følger fisken:** `trkCell` legger både trykket og fisken (`b`) med feltets snittløft for måneden i stedet for dagens `trkCellW` (×3 på trykket alene). Andelen som tas, er da den samme på og utenfor feltet, og grunnlinja blir nøytral.
  - **Senjas seks felt følger samme regel** (det følger av svaret, og av at spillet er nasjonalt): sirkelbumpen i `denSp` (+0,45 × `exp(−(d/r)²)`) og feltleddet i `skreiSpot` går ut, og feltene får formen fra radiusen, myknet etter bunnen, og artene fra `g.sp`, hele året. `simday` skal holde seg innen ±10 % på de fire stedene, ellers justeres `k` som i B2 og B3. Første turs flekk (`tutBonus`) er ikke et felt og står.
  - **Ikke med:** gyteområdene og oppvekstområdene (bare navn), og ingen vekt etter redskap.
- **Filer:** ny `core/03j-felt.js` (trekket per felt og periode, formen, `feltWl`; én linje i `src/index.html` etter `03g-trykk.js`), `core/03-simulation.js` (`hotspot`, `denPlace`, `denSp`, `skreiSpot`), `core/03g-trykk.js` (`trkAreas`, `trkCellW`, `trkCell`), `tests/run.py` (`COVER`), `tests/unit/felt.test.mjs`, `tests/fiskeplay.py` (scenarioet `felt`), `ui/phone/07-patch.js`, `docs/systemer/fiskerimodellen.md` (5.3, 5.3c, 5.3d).
- **Tester:**
  - `felt.test.mjs` utvidet: summen per lokasjon 1 ± 1 % for torsk i mars og juli på fem lokasjoner; snittet over en sesong høyere på feltet enn i sjøen like ved, og likt utenfor sesongen; trekket skifter mellom periodene uten hopp (ikke raskere enn flekkene i dag); ingen kant (tettheten over feltets omriss endrer seg jevnt, ingen sprang over 10 % per 100 m); grunnlinja på feltet minst 0,97 av den like ved (i dag 0,68 mot 0,85 ved Henningsvær i mars: rød før rettingen).
  - `trykk.test.mjs`, `vandring.test.mjs`, `simday`, `calib`, `kvtest`, `geartest`, `bktest`, `heattest`, `jigalongtest`, `progweek`, og `fasit.py` i bakgrunnen (treffet mot 2025 ikke under rundt 85 % av taket). Hele kysten trengs.
- **Måles:**
  - `fiskeplay.py felt`: én person med håndjuksa tre timer om dagen i ti dager på et felt i sesong og tre timer 4–6 km unna i samme lokasjon, ved Henningsvær i mars, Bodø i mars, Bergen i mars, Hammerfest i januar og Båtsfjord i april. Målet: over de ti dagene gir feltet 1,5–2 ganger så mye, og feltet er best de fleste dagene, men ikke alle (60–85 %). Utenfor sesongen innen ±20 %. Tallene er startverdier som skrus etter spilltest.
  - Tiden: `density` høyst 1 µs mer per kall (18–19 µs nå), `trkCell` høyst 2 µs mer første gang i en ny time.
  - Tabellen i 2.3 på nytt, og `simday` før og etter (Senja-feltene).
- **Stikkprøver:** Bergen, Bodø og Båtsfjord (`/stikkprove`): et felt i sesong og ett utenfor, kg i timen over noen dager, og varmekartet.
- **Skjermbilder:** varmekartet over et felt i sesong to dager med ulik flekk, i 800 × 1280 og 1280 × 800: fisken følger flekkene, ingen kant og ingen sirkel.
- **Patchnote:** kort, uten psykologi, for eksempel «Fisken står oftere på fiskeplassene langs kysten i den tida fiskerne har fisket der (Fiskeridirektoratets kart), men ikke hver dag.»

### F3. Feltnavnene i teksten (steg 31c)

- **Bygger:**
  - `nearestPlace` og `recPlace`: en fiskeplass (`k = f`) innen sin egen radius, høyst 1,5 nm, vinner over en havn lenger unna: «på Bjørnvika» i grunnstøtingen, i Kystposten og i rekordene.
  - **Puben** (`rumour`): ryktet velger blant fiskeplassene innen 20 km av havna båten ligger i, i sesong, etter tetthet × prisen ved nærmeste mottak. På Senja er de seks feltene med som før. Retter feilen i 2.2 (Husøy i Bergen).
  - **Kystposten** (`newsForDay`): «Tynt fiske på …» for feltene nær hjemmehavna, ikke bare Senjas fire, og én sak når et felt nær hjemmehavna går inn i sesongen («Skreien er kommet til …»), høyst én slik sak i uka. Ingen push.
  - **Kjentmannen** (`kjentFind`) og **leteoppdraget** (`turLetePlace`) sier feltets navn når punktet ligger på et felt.
  - Tekstene sier hva folk sier og hva som har skjedd, som i dag, og aldri tall for hvor mye fisk det står på et felt (V4).
- **Filer:** `core/01-world.js` (`nearestPlace`), `core/09b-records.js` (`recPlace`), `core/06-services.js` (`newsForDay`), `ui/09-hand-fishing.js` (`rumour`), `ui/09b-pub.js` (`kjentFind`), `core/09g-turer.js` (`turLetePlace`), `ui/phone/07-patch.js`.
- **Tester:** `worldtest`, `trip2`, `harbourtest` (`01-world.js`), `rectest`, `uketest`, `posttest`, `turtest`, `fixtest`, `seasontest`, `pubtest`, `hailltest`, `tests/unit/turer.test.mjs`, og en ny sjekk i `felt.test.mjs`: `nearestPlace` på Bjørnvika gir feltet, og ryktet i Bergen nevner et felt nær Bergen (sett rød først).
- **Stikkprøver:** puben og Kystpostens lokale fane i Bergen, Bodø og Båtsfjord.
- **Skjermbilder:** Kystposten og pubens rykte i 800 × 1280 og 1280 × 800.

### F4. Feltnavnene i kartet: bare navnet, og først når du er nær (steg 31d)

- **Jonas' svar (V4, 07.11.2026):** «c, navnet på feltet kan stå men aldri tettheten på fisken.»
- **Bygger:**
  - Feltnavnene vises først fra `view.z ≥ 2` (i dag 1), de største først, som nå. Ingen merking av feltene i sesong, ingen farge eller styrke etter fisken, og ingenting i navnet eller ved trykk som sier hvor mye fisk det står der.
  - Navnene fra F1 (vasket, kortet ved skråstrek eller etter 28 tegn) og gyteområdenes og oppvekstområdenes navn (V3) med lavest prioritet, i samme skrift.
  - Et trykk på et navn som er kortet eller tatt ut for plassens skyld, viser hele navnet og hva slags sted det er («Fiskeplass», «Gyteområde», «Oppvekst- og beiteområde», med kilden), slik de andre navnene gjør (`LBLHID`). Ingen arter, måneder eller tall.
  - Taket og cellene settes etter målingen under: nok navn til å finne fram, aldri så tett at det blir støy (Jonas 02.11.2026).
- **Måles:** en ny sjekk i `tests/etikett.py`: hvor mange feltnavn som står, hvor stor del av skjermen de dekker, og at ingen overlapper et annet navn, ved `view.z` 2 og 4 over Bergen, Henningsvær, Bodø og Båtsfjord, i 390 × 844, 800 × 1280, 1280 × 800, 915 × 1208 og 1293 × 830 (Pad 3 i spilltest 2); og at ingen feltnavn står under `view.z` 2 (rød før rettingen).
- **Filer:** `ui/03-map.js` (feltnavnene i `renderStatic` og trykket), `tests/etikett.py`, `tests/charttest.py`, `ui/01-i18n.js` om ordene for slagene trengs der.
- **Tester:** `etikett`, `charttest`, `placetest`, `routetest` (`03-map.js`).
- **Skjermbilder:** Bergen og Båtsfjord ved `view.z` 2 og 4 i 390 × 844, 800 × 1280 og 1280 × 800, og et trykk på et kortet navn.
- **Står igjen til Jonas:** se tettheten på Pad 3 (backloggen 10.5 «Feltnavnene (B2)»).

### F5. Kartverkets stedsnavn i sjøen der Fiskeridirektoratet har lite (steg 31e)

- **Jonas' svar (V3, 07.11.2026):** «Ta det mest realistiske.» Det mest realistiske er navnene som finnes i de offentlige kildene, og bare dem: Fiskeridirektoratets fiskeplasser, gyteområder og oppvekst- og beiteområder (F1), og Kartverkets stedsnavn for banker, grunner og fiskeplasser i sjøen der Fiskeridirektoratet har lite (her). Ingen navn diktes opp, og der ingen kilde har et navn, står det ikke noe.
- **Bygger:** `felt.py` henter sjønavnene fra Kartverkets stedsnavn-API (Sentralt stedsnavnregister) for strekningene der dekningen etter F1 er tynnest, først Øst- og Vest-Finnmark, som eget slag (`k = s`). Bare navn: aldri vekt og aldri flåtetrykk. Et navn som alt står i kartet (`chartNamesSvg`) eller blant feltene innen 1 km, tas ikke med to ganger.
- **Krever:** verten `api.kartverket.no` åpnet i miljøet (svarte 403 herfra 07.11.2026; Jonas legger den til i miljøets nettverksinnstillinger, eller økta som tar steget, ber om det), og lisensen og navneobjekttypene for sjøen sjekket før noe tas inn.
- **Filer:** `tools/npc/felt.py`, `src/data/felt.json`, `tests/unit/felt.test.mjs`.
- **Tester:** `felt.test.mjs`, `charttest`.
- **Måles:** tabellen i 2.5 på nytt.

## 4. Slik måles det, samlet

1. **Dekningen:** tabellen i 2.5 (fiskeplasser og alle navn innen 10 og 20 km av hvert mottak per landsdel), før og etter F1 og F5.
2. **Grunnlinja på og utenfor feltene:** tabellen i 2.3, som sjekk i `felt.test.mjs` fra F2.
3. **Fisken på feltet mot like ved:** `fiskeplay.py felt` på fem steder over ti dager, i og utenfor sesong, og hvor mange av dagene feltet var best (F2).
4. **At resten står:** `simday`, `calib`, `progweek` og `fasit.py` før og etter F2; summen per lokasjon i enhetstesten.
5. **Tiden:** `density` og `trkCell` i µs (F2), `feltData` i ms (F1).
6. **Etikettene:** antall, del av skjermen og overlapp per format ved `view.z` 2 og 4 (F4), og Jonas på Pad 3.

## 5. Valgene (Jonas svarte 07.11.2026)

**V1. Hvor sterkt et felt trekker fisken** (F2). Jonas: «F1, jeg skjønner tanken om at felt har mer fisk men jeg mener vi må være forsiktig med å definere en fast boks eller sirkel der det står mer fisk bare fordi det er et fiskefelt. Ja det skal være mye fisk på feltene men vi må løse dette på en intuitiv måte.» «F1» er lest som V1, fordi svaret gjelder fisken på feltet og de andre svarene er V2–V4. Ingen av A–C ble valgt slik de sto. F2 er lagt om: feltet trekker de gode flekkene som alt flytter seg i spillet, i feltets egen form og sesong, i stedet for en fast vekt over et område. Flåten følger fisken (det som var riktig i A), og Senjas seks felt følger samme regel. Alternativene var A (×3 for fisken og flåten), B (×2) og C (ingen vekt).

**V2. Hvilke felt teller, og når** (F1, F2). Jonas: «V2: a.» Artene og månedene fiskerne oppga til Fiskeridirektoratet; et felt uten art teller for juksaartene hele året. (B var alle arter hele året.)

**V3. Hullet i Øst-Finnmark** (F1, F5). Jonas: «Ta det mest realistiske.» Lest som B: alle navnene de offentlige kildene har (Fiskeridirektoratets fiskeplasser, gyteområder og oppvekst- og beiteområder i F1, Kartverkets sjønavn i F5), ingen diktede navn, og ingenting der ingen kilde har et navn. Bare fiskeplassene gir vekt. (A var bare Fiskeridirektoratets lag, C å la hullet stå.)

**V4. Etikettene** (F4). Jonas: «c, navnet på feltet kan stå men aldri tettheten på fisken.» Feltnavnene først fra `view.z ≥ 2`, og ingenting i navnet, fargen eller ved trykk som sier hvor mye fisk det står. (A var feltene i sesong først og et kort med arter og måneder, B som i dag.)

**Avgjort i planen** (Jonas kan si fra):
- Senjas seks felt følger samme regel som resten av kysten (F2), som en følge av V1; `simday` holdes.
- Vekten følger art og måned, ikke redskap: `density` er den ene kilden for fisk og vet ikke om redskap (`SELQ` og `gearVertF` tar det etterpå). Redskapet brukes bare i havflåtens trykk på de aktive feltene, som i dag.
- Tekstene i F3 bruker bare fiskeplassene og sier aldri tall for tettheten.
- «Brukere» og merknadene leses aldri.

## 6. Det som er antatt eller usikkert

- **Alderen på dataene:** de fleste feltene er registrert 1988–2012, og noen beskriver et fiske som er borte (merknaden «Regulert bort i 2001»). Planen leser ikke merknadene, og regelmotoren avgjør hva som er stengt.
- **«Januar–desember»** kan like gjerne bety at sesongen ikke ble oppgitt som at feltet brukes hele året (5 141 linjer har januar–desember, 1 209 har ingen måned).
- **Dekningen** viser hvor fiskerne ble intervjuet (opphav: fiskarlag, lokale fiskere), ikke hvor fisken står. Lokasjoner uten felt mister ingenting med F2, men i en lokasjon med felt får sjøen utenfor dem litt mindre, like mye som feltene får mer, fordelt på resten av lokasjonen.
- **Styrken** (trekket opp til rundt 0,6, målet 1,5–2 ganger over sesongen, og feltet best 60–85 % av dagene) er et anslag til det er målt og spilt; dagens ×3 i `TRK.groundW` var også et anslag (backloggen 10.5 «B3 må ses i spillet»).
- **Senjas felt i samme regel** kan flytte `simday`. Blir det mer enn ±10 %, justeres `k`, og det endrer fangsten litt langs hele kysten.
- **Formene** kan gjøre `felt.json` større enn i dag; F1 måler og velger mellom forenklede polygoner og ruter på 500 m.
- **Finnmarks felt** har bare torsk, sei og hyse; kveita, lyren og de dype artene får ingen feltvekt der.
- **Tabellen i 2.5** er grovt delt etter breddegrad og regnet per mottak, så steder med mange mottak teller mer.
- **Tettheten i 2.7** er regnet, ikke målt, og ingenting er sett på Pad 3.
- **Kartverket** er ikke sjekket herfra (403), verken lisensen eller om navneobjekttypene for sjøen har fiskeplasser; F5 krever verten.

## 7. Det planen ikke gjør

- Ingen sirkler eller flater i kartet (Jonas 28.10.2026), og ingen fast boks eller sirkel med mer fisk i sjøen (Jonas 07.11.2026).
- Viser aldri hvor mye fisk det står på et felt, i kartet, i navnet eller ved trykk (V4).
- Gyteområdene, oppvekstområdene og Kartverkets navn gir ingen vekt i fisket.
- Endrer ikke forholdet mellom lokasjonene (`fkAvail`, sluttsedlene), bare hvor fisken står innen lokasjonen.
- Ingen nye arter, redskap eller felt utenfor rammen, og ingen feltoppdrag (Oppdrag 2 kan bruke feltene senere).
- Bruker ikke Havforskningsinstituttets gytefelt for kysttorsk i fisket, og endrer ingen regler; de stengte gytefeltene hører til Ø10.
- Rører ikke havflåtens felt utover at fisken følger samme vekt.
- Ingen push.

## 8. Status

- 07.11.2026: planen skrevet (Jonas' økt, gren `ccr-5a96a95a-wu5hvn`; bare dokumenter). Målingene i 2.3, 2.4 og 2.5 ble gjort i økta (enhetstestenes laster og WFS-en uten polygoner); ingenting i `src/` eller `tests/` er endret. Fasene står i køen som 31a–31e med `venter på valg`. Venter på V1–V4.
- 07.11.2026: **Jonas svarte på valgene** (kap. 5). F2 er lagt om etter V1 (ingen fast boks eller sirkel: feltet trekker de gode flekkene i sin egen form og sesong, Senjas felt med), F4 etter V4 C, og F5 tas (V3). F1 (31a) er klar; F2 og F4 venter på F1, F3 på F2, og F5 på F1 og verten `api.kartverket.no` i miljøet.
