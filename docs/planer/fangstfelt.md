# Fangstfeltene med navn langs hele kysten (Ø14, plan 07.11.2026)

Plan for steg 31 i `docs/planer/koen.md` (`/planlegg`). F1, F2 og F4 er bygd 08.11.2026 og F5 11.11.2026 (status under F1, F2, F4 og F5 og i kap. 8); F3 er ikke bygd. Fasene står i køen som steg 31a–31e. Jonas svarte på valgene 07.11.2026 (kap. 5), og F2, F4 og F5 er lagt om etter svarene; 08.11.2026 sa han at Senjas felt skal være som alle de andre (2.8). F3 (steg 31c) er klar.

## 1. Hva Jonas ba om

- **Spilltest 1** (`docs/playtest/rapport-1.md`, 30.09.2026): «Fangsten føles for liten, og fangstfeltene betyr lite.» «En spiller som stoler på sirklene, blir skuffet. Kartet bør si at de er hint, eller sirklene bør vekte mer.» Backloggen 10.2 kaller det «De navngitte fangstfeltene finnes bare på Senja».
- **Jonas 06.10.2026:** spillet er nasjonalt. Alt som legges inn, gjelder hele kysten (`CLAUDE.md`).
- **Jonas 28.10.2026:** «Fjern sirklene for fangstfelt langs hele kysten. Bare navn på felt langs hele kysten er ok, men det skal ikke vises som en definert sirkel» (`docs/systemer/kartplotter.md`).
- **Jonas 01.11.2026** (B2): «Kjør på med alt som gjør at du mener vi klarer i simulerer fiskens liv med høyest mulig nøyaktighet.»
- **Jonas 02.11.2026** (etikettene, `docs/planer/kart-etiketter.md`): «Vi må passe på at ikke blir alt for mye info og navn på kartet som overlapper hverandre slik at det bare blir støy.» Valg 2 A: felt- og stedsnavn kommer etter alt spilleren handler og spiller med.
- **Jonas' svar på valgene, 07.11.2026:** «F1, jeg skjønner tanken om at felt har mer fisk men jeg mener vi må være forsiktig med å definere en fast boks eller sirkel der det står mer fisk bare fordi det er et fiskefelt. Ja det skal være mye fisk på feltene men vi må løse dette på en intuitiv måte.» «V2: a» «V3: Ta det mest realistiske» «V4: c, navnet på feltet kan stå men aldri tettheten på fisken.» Hva svarene betyr for fasene, står i kap. 5.
- **Jonas 08.11.2026:** «Senja sine felt skal fungere akkurat likt som alle de andre fiskefeltene i landet og ikke være en fast sirkel.» Og: «Jeg prøvde å legge enn api.kartverket.no i allowed domains på claude» (verten svarer fra skyen fra 08.11.2026, F5).
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

### 2.8 Fiskeridirektoratets felt der Senjas seks ligger (08.11.2026)

Jonas 08.11.2026: «Senja sine felt skal fungere akkurat likt som alle de andre fiskefeltene i landet og ikke være en fast sirkel.» Det går, fordi kilden har ekte fiskeplasser på de samme stedene (talt fra `felt.json` med enhetstestenes laster, avstand fra midten av Senja-feltet):

| Senjas felt (`GROUNDS`, radius) | Lokasjon | Fiskeridirektoratets felt der |
|---|---|---|
| Havet nord for Husøy (6 km) | 05-30 | 13 felt, blant dem Storflua (3,0 km), Oksefallet (3,2), Nøringskjæret (4,4), Hekkingen (6,7) |
| Utenfor Mefjorden (5,5 km) | 05-30 | 13, blant dem Ytre Mefjorden Sør (0,5 km, r 5,4), Ytre Mefjorden (3,2), Kjølva Nord (3,7), Øyfjorden (3,7) |
| Vest av Gryllefjord (6,5 km) | 05-25 | 10, blant dem Gryllefjorden (2,9 km, r 10,7), Månestua (3,4), Månesodden (4,3) |
| Malangsgapet (4 km) | 05-40 | 6, blant dem Ytre Malangen (2,1 km, r 7,8), Buvik (3,0), Ræva (5,0) |
| Gisundet nord (1,6 km) | 05-41 | 5, blant dem Jakkarneset (1,2 km), Bondjordbukta (1,6), Gisundet (2,6) |
| Solbergfjorden (2,5 km) | 05-41 | 3: Brursteinen (2,2 km), Solbergfjorden Espenes (2,8), Solbergfjorden-humpen (4,1) |

Senjas seks navn er spillets egne («Havet nord for Husøy», «Utenfor Mefjorden», «Vest av Gryllefjord» er beskrivelser, ikke feltnavn). I dag brukes `GROUNDS` i fisket (bumpen i `denSp`, `skreiSpot`), i kartet (fra `view.z ≥ 0,5` med forrang foran fiskeplassene, og `feltData` tar bort fiskeplassene innen 1,5 km), i tekstene (`nearestPlace`, `recPlace`, `rumour`, `newsForDay`, `alumniGround`, første tur «ved Gisundet nord») og som faste punkter for kalibreringen (`fkAvail` måler mot lokasjonene 05-30, 05-25 og 05-40, `MIG.latRef`) og i over 20 tester. Etter Ø14 bruker ingenting i spillet dem som felt (F1–F4); de blir faste punkter for kalibreringen og testene.

## 3. Fasene

Én økt hver. Rekkefølgen: dataene først (F1, nesten usynlig), så fisken (F2), så tekstene (F3), så etikettene (F4, kan gå før F2 og F3 når `ui/03-map.js` er ledig). F4 kan gå før F2 og F3 når F1 er ute. F5 etter F1, når verten `api.kartverket.no` er åpnet i miljøet. Testene under er de som dekker filene etter `COVER` i `tests/run.py`; `python3 tools/plan/tester.py` gir den fulle lista for grenen.

### F1. Fiskeplassene med art, redskap og måneder, og navnene vasket (steg 31a)

- **Bygger:**
  - `felt.py` leser også `fiskeart_1–8`, `redskap_1–8`, `fra_1–8` og `til_1–8`, og skriver per felt artene som spillet kjenner (torsk, hyse, sei, lyr, lange, brosme, uer, kveite, blåkveite, sild, makrell, snøkrabbe, kongekrabbe), hver med månedene som en maske på 12 biter og redskapene som en maske etter `GEAR` i `fiske.py`. Når samme navn innen 3 km slås sammen (`MERGE_KM`), slås linjene sammen. Et felt uten art får ingen linjer.
  - **Navnevasken:** store bokstaver blir vanlig skrift («Røværfjorden»; små ord som «i», «av», «til» og «fra» med liten), stor forbokstav, koordinater ut (feltet får da intet navn og står bare som vekt), og navnet i kartet kortes ved en skråstrek eller etter 28 tegn (hele navnet vises ved trykk i F4). Hver regel med antallet den rettet, i `felt.py`s utskrift.
  - **Formen til F2:** polygonet til hver fiskeplass, forenklet (rundt 100 m) eller som ruter på 500 m; størrelsen avgjør. Gyteområdene og oppvekstområdene trenger bare punktet.
  - **V3 (Jonas: «Ta det mest realistiske»):** gyteområdene og oppvekst- og beiteområdene inn som eget slag (`k`: `f` fiskeplass, `g` gyteområde, `o` oppvekst og beite), med navn, art og måneder. De får aldri vekt og aldri flåtetrykk: `trkAreas` og `trkCellW` tar bare `k = f`, og `feltIn` gir dem ikke til kartet før F4.
  - **Senja som resten** (Jonas 08.11.2026): `feltData` tar ikke lenger bort fiskeplassene innen 1,5 km av `GROUNDS`.
  - `feltData` leser de nye feltene (`f.k`, `f.l` med [art, redskap, måneder]). Ingenting annet i spillet endres.
- **Filer:** `tools/npc/felt.py`, `src/data/felt.json`, `core/01e-marks.js` (`feltData`, `feltIn`), `core/03g-trykk.js` (bare filteret på slaget), ny `tests/unit/felt.test.mjs`, `tests/run.py` (`COVER` for `tools/npc/felt.py`), `docs/systemer/fiskerimodellen.md` (5.3c «Feltnavnene»).
- **Tester:** `tests/unit/felt.test.mjs` (ny; antallet per slag, Billefjordjupet har torsk med garn, et kjent sesongfelt har riktige måneder, ingen navn med koordinater eller bare store bokstaver, ingen `g` eller `o` i `trkAreas`; sett rød før `felt.json` er ny), `trykk.test.mjs` (gruppesummene står), `charttest` (`felt.json`), `marktest` (`01e-marks.js`). Fordi trykket flytter seg litt når felt slås sammen og koordinatnavn går ut: `simday` og `heattest`.
- **Måles:** `felt.json` før og etter (128 kB nå; målet under 350 kB med formene; blir den større, legges formene i en egen fil i `data/` som hentes ved oppstart, som modellene i `bootData`), `feltData` i Node og i Chromium (første oppslag), tabellen i 2.5 på nytt med de nye slagene, antallet rettet per vaskeregel.
- **Spilleren ser:** penere navn i kartet. Ingenting annet.
- **Status (08.11.2026, Jonas' økt, gren `ccr-6e53b4c0-qs2mg1`): bygd.** Det som ble gjort og målt:
  - **Kilden lest på nytt** fra WFS-en 08.11.2026 (de fire lagene til `tools/npc/cache/`): 2 101 aktive og 2 940 passive fiskeplasser med navn, 1 645 gyteområder og 446 oppvekst- og beiteområder; 1 299, 2 373, 1 437 og 413 av dem har minst én art spillet kjenner.
  - **Etter sammenslåingen** (samme navn og slag innen 3 km): 6 763 felt, 4 683 fiskeplasser (`f`), 1 635 gyteområder (`g`) og 445 oppvekst- og beiteområder (`o`). 5 255 har arter spillet kjenner; 2 349 fiskeplasser har en sesong (en linje som ikke er hele året; planens 3 423 var før sammenslåingen og med alle arter).
  - **Linjene:** `[art, redskapsbiter, månedsbiter]` per felt (formatet øverst i `felt.py` og i `docs/systemer/fiskerimodellen.md` 5.3c). Kongekrabbe er `krabbe` (spillets nøkkel). En linje uten måneder er hele året; fra–til går rundt nyttår.
  - **Navnevasken, antallet per regel:** HTML-tegn 1, store bokstaver 338 (kompasspunkt og romertall står med store bokstaver: «Karmøy SV»), løst tegn foran 1, liten forbokstav 16, understrek 31, koordinater 4 (står uten navn), kortet ved skråstrek 157 (ikke ved «v/»), kortet etter 28 tegn 137 (uten lite ord sist). 287 felt har et kortere navn i kartet enn i `nf`.
  - **Formene:** Douglas-Peucker til 100 m gir 70 844 punkter. Som JSON i `felt.json` 445 kB (fila ville vært 766 kB mot målet på 350), og ruter på 500 m ville vært 269 679 ruter (de store trål- og notfeltene), så polygonene vant, men i en egen fil: `src/data/felt-s.b64`, varint, **157 kB** binært (209 kB base64), som bygget gjør til `data/felt-s-<hash>.bin` og `bootDataLate` henter som modellene. `feltShape(f)` gir ringene i km, `[]` for `g` og `o`, `null` mens fila er på vei og `false` for godt når den ikke kom eller ikke passer. 30 små fiskeplasser har ingen form igjen etter forenklingen; punktet ligger inne i formen for 4 611 av 4 653 med form, og nær den for alle utenom én.
  - **`felt.json`:** 128 kB → **321 kB** (punktene 44, navnene 120, linjene 124). `feltData` leser den på 5 ms i Node og 4,1 ms i Chromium (første lesing); `feltShape` dekoder formene på 5,8 ms første gang (Chromium).
  - **Senja som resten:** Ytre Mefjorden Sør og Jakkarneset er med igjen (de var innen 1,5 km av `GROUNDS`). Kartet tegner Senjas seks navn for seg til F4.
  - **Trykket:** `trkAreas` teller 18 342 ruter på felt med filteret, 21 217 uten (gyte- og oppvekstområdene ville gitt 2 875 ruter flåtetrykk ×3). `simday` før og etter (bygget uten og med F1, bare Senja): Husøy mars 500 / 500 kg, Gryllefjord mars 500 / 500, Husøy juli 500 / 500, Malangsgapet mai 368 / 369, Husøy mars med to juksamaskiner 500 / 500 (artene innen noen kilo). `heattest` 66 OK. `progweek` (hele kysten, bygget uten og med F1): netto etter 56 dager 227 681 / 227 434 kr, 17 / 17 turer; `calib` flytter seg bare i enkeltceller (torsk i november 6,4 → 6,9 kg i timen på beste felt, resten innen 0,5).
  - **Tabellen i 2.5 på nytt** med de nye slagene. Inndelingen i landsdeler er gjort på nytt etter breddegrad (og 25,5° Ø for Øst-Finnmark) og stemmer ikke helt med den i 2.5 (antall mottak per landsdel avviker), så «før» er regnet med den samme inndelingen fra fila før F1. Fiskeplassene innen 10 og 20 km er de samme før og etter (unntatt i Vest-Finnmark, der «Kågen_vest» og «Kågen vest» ble ett felt etter vasken); det nye er gyte- og oppvekstområdene, som kommer i kartet med F4. Tana: 1 fiskeplass innen 20 km, men gyteområdet Indre Tana 3,3 km fra mottaket og 4 gyte- og oppvekstområder innen 20 km; Båtsfjord: 4 fiskeplasser og 1 gyteområde innen 20 km; Sør-Varanger (Bøkfjorden): 5 og 6.

    Før F1:

    | Landsdel | Mottak | Fiskeplasser | Gyteområder | Oppvekst og beite | Fiskeplasser innen 10 / 20 km av et mottak | Gyte- og oppvekstområder innen 20 km | Alle navn innen 20 km | Nærmeste fiskeplass (median) |
    |---|---|---|---|---|---|---|---|---|
    | Skagerrak og Sørlandet | 21 | 465 | 0 | 0 | 17,3 / 45,6 | 0,0 | 45,6 | 1,7 km |
    | Vestlandet | 32 | 1073 | 0 | 0 | 11,6 / 43,6 | 0,0 | 43,6 | 3,1 km |
    | Møre | 35 | 471 | 0 | 0 | 14,6 / 48,2 | 0,0 | 48,2 | 2,1 km |
    | Trøndelag og Namdalen | 34 | 609 | 0 | 0 | 14,4 / 46,6 | 0,0 | 46,6 | 1,6 km |
    | Helgeland og Salten | 37 | 829 | 0 | 0 | 18,2 / 58,3 | 0,0 | 58,3 | 2,0 km |
    | Lofoten og Vesterålen | 52 | 528 | 0 | 0 | 8,1 / 29,2 | 0,0 | 29,2 | 3,2 km |
    | Troms med Senja | 33 | 262 | 0 | 0 | 7,0 / 23,7 | 0,0 | 23,7 | 3,3 km |
    | Vest-Finnmark | 24 | 306 | 0 | 0 | 5,5 / 20,8 | 0,0 | 20,8 | 4,5 km |
    | Øst-Finnmark | 42 | 141 | 0 | 0 | 2,5 / 8,4 | 0,0 | 8,4 | 5,6 km |

    Etter F1:

    | Landsdel | Mottak | Fiskeplasser | Gyteområder | Oppvekst og beite | Fiskeplasser innen 10 / 20 km av et mottak | Gyte- og oppvekstområder innen 20 km | Alle navn innen 20 km | Nærmeste fiskeplass (median) |
    |---|---|---|---|---|---|---|---|---|
    | Skagerrak og Sørlandet | 21 | 465 | 56 | 11 | 17,3 / 45,6 | 6,9 | 52,5 | 1,7 km |
    | Vestlandet | 32 | 1073 | 370 | 103 | 11,6 / 43,6 | 17,7 | 60,9 | 3,1 km |
    | Møre | 35 | 471 | 147 | 6 | 14,6 / 48,2 | 11,8 | 60,0 | 2,1 km |
    | Trøndelag og Namdalen | 34 | 609 | 231 | 3 | 14,4 / 46,6 | 16,3 | 62,9 | 1,6 km |
    | Helgeland og Salten | 37 | 829 | 229 | 62 | 18,2 / 58,3 | 18,3 | 76,6 | 2,0 km |
    | Lofoten og Vesterålen | 52 | 528 | 264 | 180 | 8,1 / 29,2 | 29,7 | 59,0 | 3,2 km |
    | Troms med Senja | 33 | 262 | 129 | 43 | 7,0 / 23,7 | 14,2 | 37,8 | 3,3 km |
    | Vest-Finnmark | 24 | 305 | 123 | 25 | 5,4 / 20,7 | 10,9 | 31,6 | 4,5 km |
    | Øst-Finnmark | 42 | 141 | 86 | 12 | 2,5 / 8,4 | 6,9 | 15,4 | 5,6 km |

  - **Stikkprøver av navnene** (`/stikkprove`, kartet ved `view.z` 2 og 4 i begge formater, `docs/okter/2026-11-08-31a/`): **Bergen** 50 feltnavn i bildet liggende og 29 stående, alle i vanlig skrift («Hauglandsosen», «Kolltveitosen», «Bakarvågneset - Signalneset…» for «Bakarvågneset - Signalneset, Askøy øst»); **Bodø** 60 og 39 («Landegodfjorden Midt», «Kalvøygrunnen Tomasgrunnen»); **Båtsfjord** 11 og 3 («Bjørnvika», «Båtsfjordfeltet», «Finnskallen»), like tynt som før, til F4 og F5. Ingen navn i store bokstaver eller med koordinater noe sted.
  - **Tester:** `felt.test.mjs` (ny, 23 sjekker; sett rød mot den gamle `felt.json` med 11 FEIL, og sjekkene for trykket røde med `03g-trykk.js` fra før F1: «trkAreas teller bare fiskeplassene» 21 217 mot 18 342, og ruta ved gyteområdet Kobbneset fikk vekt 3; sjekken for kompasspunktene, fra gjennomgangen, rød med 8 navn som «Karmøy Sv» før rettingen), alle enhetstestene (2 234 OK), `charttest`, `marktest` (med hele kysten), `boottest`, `simday`, `heattest`, og det `tester.py` gir.

### F2. Fisken står på feltene slik flekkene står i sjøen (steg 31b)

- **Jonas' svar (V1, 07.11.2026):** «… vi må være forsiktig med å definere en fast boks eller sirkel der det står mer fisk bare fordi det er et fiskefelt. Ja det skal være mye fisk på feltene men vi må løse dette på en intuitiv måte.» Derfor ingen fast vekt over et område. Feltet er stedet der fisken *pleier* å stå, og det merkes gjennom det spillet alt har: de gode flekkene som flytter seg, stimene, dybden og kantene.
- **Bygger** (med V2 A):
  - **Flekkene kommer oftere til feltet i sesong.** De gode flekkene (`hotspot`: mønsteret på 3,5 km som glir 0,7–1,7 km i døgnet og toner over 120 timer) står som i dag. På en fiskeplass som har arten i måneden (et felt uten art: juksaartene hele året), løftes flekkens verdi mot det beste med feltets *trekk* for perioden: et tall mellom 0 og rundt 0,6 som trekkes på nytt hver 120. time for hvert felt og toner over som flekkene selv. I én periode står det en sterk flekk på feltet, i neste en svak, eller den ligger på kanten. Over sesongen står det mye fisk på feltet, men ikke det samme hver dag, og spilleren finner den med ekkoloddet og varmekartet som før.
  - **Formen er feltets egen:** polygonet fra Fiskeridirektoratet (forenklet i F1), mykt i kanten (rundt 0,5 km), og bare der dybden passer arten (`depthFactor`). Ingen sirkel rundt et punkt og ingen fast boks: innenfor feltets omriss følger fisken flekkens eget mønster.
  - **Summen per lokasjon står:** løftet regnes som snitt over lokasjonens sjø per art og måned (`feltWl`), og tettheten deles på det. Lokasjonen har like mye fisk som før, så `fkAvail` og kalibreringen mellom stedene står; fisken flyttes bare innen lokasjonen.
  - **Flåten følger fisken:** `trkCell` legger både trykket og fisken (`b`) med feltets snittløft for måneden i stedet for dagens `trkCellW` (×3 på trykket alene). Andelen som tas, er da den samme på og utenfor feltet, og grunnlinja blir nøytral.
  - **Senjas felt er som alle de andre** (Jonas 08.11.2026: «Senja sine felt skal fungere akkurat likt som alle de andre fiskefeltene i landet og ikke være en fast sirkel.»): sirkelbumpen i `denSp` (+0,45 × `exp(−(d/r)²)`), feltleddet i `skreiSpot` og artsvektene `g.sp` går ut. Fiskeridirektoratets fiskeplasser på de samme stedene (2.8) gjør jobben med sin egen form, sine arter og måneder, som overalt ellers. Kalibreringens faste punkter står, men som punkter og lokasjonskoder, ikke som felt: lokasjonene `fkAvail` måler mot (05-30, 05-25, 05-40), `MIG.latRef` og de fire stedene i `simday`. `simday` skal holde seg innen ±10 %, ellers justeres `k` som i B2 og B3. Første turs flekk (`tutBonus`) er ikke et felt og står.
  - **Ikke med:** gyteområdene og oppvekstområdene (bare navn), og ingen vekt etter redskap.
- **Filer:** ny `core/03j-felt.js` (trekket per felt og periode, formen, `feltWl`; én linje i `src/index.html` etter `03g-trykk.js`), `core/03-simulation.js` (`hotspot`, `denPlace`, `denSp`, `skreiSpot`), `core/03f-fiske.js` (de faste punktene for Senja-forholdet og `MIG.latRef` uten `GROUNDS`), `core/03g-trykk.js` (`trkAreas`, `trkCellW`, `trkCell`), `tests/run.py` (`COVER`), `tests/unit/felt.test.mjs`, `tests/fiskeplay.py` (scenarioet `felt`), `ui/phone/07-patch.js`, `docs/systemer/fiskerimodellen.md` (5.3, 5.3c, 5.3d).
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
- **Status (08.11.2026, Jonas' økt, gren `claude/o14-f2-fiske-flate-nv6aqz`): bygd og rullet ut i c199ab8a.** Slik det ble (detaljene i `docs/systemer/fiskerimodellen.md` 5.3c-F2):
  - **`core/03j-felt.js`:** masken er feltets form mykt i kanten (±0,5 km, på 250 m-noder per 2 km-blokk), trekket 0–0,6 per felt og 120. time fra feltets egen fase, sesongen mellom midtmånedene, dybden fra `depthFactor`. Løftet er `n → 1 − P (1 − n)` i `hotspot`, `P = Π (1 − trekk × maske × sesong × dybde)`. Lokasjonens snitt av det forventede løftet (`feltWl`) regnes i lukket form over sjøen fra kjernens fjernlag (likt for alle), vektet med eksponering, helling, dybde og for torsken skreiplassene etter måneden (uten det siste lå Båtsfjord i mars 1,1 % over i 30 års snitt; med det 0,9999). `felt-s` hentes i `dataEarly`.
  - **Flåten følger fisken:** `trkCell` legger kystflåtens trykk og fisken med rutas løft (`feltCellW`); havflåten har ×3 på de aktive feltene som før.
  - **Senja som resten:** sirkelbumpen i `denSp`, feltleddet i `skreiSpot` og `g.sp` er ute; `FK.ref` (05-30, 05-25, 05-40) og `FK.latRef` (69,528) i `03f-fiske.js` står for `GROUNDS` i kalibreringen.
  - **Jonas om `k`** (da simday falt på Senja): «Sirkelene som var rundt senja var fra når vi startet å utvikle dette spillet i en tidlig fase, dermed ble det bestemt at ettersom spillet har vokst enormt mye siden da så skal senja ha samme vilkår som resten av verden vi har skapt. Det betyr at vi må fjerne sirkelene og gjøre fisket som var det så realistisk som mulig i henhold til den informasjonen vi har, og på samme måte som vi har gjort det for resten av kysten.» Lest som: `k` justeres ikke for å holde på sirklenes ekstra fisk.
  - **Målt** (bygget med hele kysten, før og etter):
    - `fiskeplay.py felt` (15 felt ved Henningsvær, Bodø, Bergen, Hammerfest og Båtsfjord; forventet fangst med håndjuksa 8–11 i ti dager): feltet gir **1,56 ganger** så mye som 4–6 km unna (median; uten F2 1,26), og er **best 75 %** av dagene (uten F2 60 %). F2 alene løfter feltet 1,29 ganger (median, 1,1–2,6). Utenfor sesongen gir F2 ingenting (forholdet mellom stedene er det samme som uten F2; medianen 1,21 er stedenes egen forskjell).
    - **Summen per lokasjon på det ekte kartet** (Chromium, torsk): Henningsvær 1,013, Båtsfjord (april) 1,011, Husøy 1,006, Bodø 1,002, Bergen 1,001 (snittet regnes fra fjernlagene, så det er likt for alle; løftet leser flisene). `fasit.py` i utvalget før og etter: torsk 0,617 → 0,610, de andre artene innen 0,006 (den fulle testen utenfor dataene er ikke kjørt).
    - **Gjennomgangen** (`/code-review`): `felt-s` i `dataEarly` stopper ikke lenger oppstarten om fila ikke kommer (feltene blir sirkler); `feltAt` spør etter formene til de er inne, så sirklene viker med én gang. Ikke rettet, med grunn: `feltLoc`s kostnad første gang (backloggen), fjernlagene i snittet (likt for alle), og `geartest`s nye målepunkter (begrunnet i commiten).
    - **Tiden** (Chromium): `density` 5,65 → 6,21 µs per kall ved Husøy (+0,6), `trkCell` første gang i en ny time 3,3 → 3,55 µs per rute (+0,25). `feltLoc` første gang per lokasjon 13–170 ms (maskene og den første kompileringen), 7–60 ms ellers; Senja er tyngst fordi feltene står tett. Det kommer én gang per lokasjon og økt, første gang fisken spørres der.
    - **simday** (500 kg er lasterommet): 500 / 500 / 500 / 369 → 500 / 495 / 344 / 196 (Husøy mars, Gryllefjord mars, Husøy juli, Malangsgapet mai). Forventet fangst over åtte timer på punktene: Husøy mars 1 359 → 919 kg torsk, Gryllefjord mars 991 → 635, Husøy juli 153 → 88 torsk og 261 → 133 sei, Malangsgapet mai 241 → 112 sei. `calib`: «best-ground» (punktene) faller 30–45 %, «top-10 % sea» rundt Senja står nesten (torsk i februar 33,9 → 25,8, mars 29,6 → 25,2, sei innen 2 %).
    - **progweek** (netto etter 56 dager, de tre løpene): 227 681 → 163 860 kr (17 → 12 turer), 234 248 → 233 381 (21 → 21), 301 018 → 281 641 (39 → 39). Det første løpet fisker på Senja-punktene.
    - **geartest:** målingene som sto midt i Senjas sirkler, er lagt om: linene på de åtte beste hysepunktene innen to radier av de seks gamle feltene, garnene på de fire beste torskepunktene på 30–150 m innen det gamle feltet vest av Gryllefjord. Gammelt bygg med de nye målingene 86 kg per stamp (67 % hyse) og 90 kg per garn, nytt 68 (69 %) og 61 (ERS-medianen 72); før omleggingen ga det nye bygget 45 % hyse og 50 kg per garn.
    - **Grunnlinja (2.3 på nytt), torsk den 15. kl. 08, på feltene / like ved, januar · mars · juli:** Husøy 0,88 / 0,89 · 0,88 / 0,88 · 1,00 / 1,00; Henningsvær 0,98 / 0,98 · **0,75 / 0,75** · 1,00 / 1,00; Røst 0,97 / 0,98 · 0,89 / 0,89 · 1,00 / 1,00; Bodø 1,00 / 1,00 · 0,99 / 0,99 · 1,00 / 1,00; Ålesund 0,99 / 0,99 · 0,99 / 0,99 · 1,00 / 1,00; Bergen 1,00 overalt; Hammerfest 1,00 / 1,00 · 0,99 / 0,99 · 1,00 / 1,00; Båtsfjord 0,96 / 0,97 · 0,98 / 0,98 · 0,95 / 0,95; Vardø 0,98 / 0,98 · 0,98 / 0,98 · 0,96 / 0,96. (Med samme laster før F2: Husøy 0,80 / 0,91 i mars, Henningsvær 0,68 / 0,82, Røst 0,76 / 0,90, Båtsfjord 0,88 / 0,94 i juli.)
  - **Tester:** `felt.test.mjs` utvidet (grunnlinja ved Henningsvær, Røst og Båtsfjord, summen per lokasjon på fem steder i mars og juli, sesongen på Gryllefjorden, trekket uten hopp, ingen kant over 34 felt); sett rød mot koden før F2 (`git stash`): Henningsvær 0,681 mot 0,823 og Røst 0,764 mot 0,900, og sjekkene for løftet uten `FELTW`; kantsjekken rød (16,4 % per 100 m) med kanten satt til 20 m. `run.py smoke` med det `tester.py` gir: alt grønt etter omleggingen av geartest; simday, calib, kvtest og progweek er tall (over).
  - **Stikkprøver** (`/stikkprove`): Bergen (3 felt: 0,94–1,83 ganger, F2 alene 1,12–1,42), Bodø (3 felt: 0,99–2,89, F2 alene 1,26–1,54) og Båtsfjord/Berlevåg (3 felt: 0,98–4,57, F2 alene 1,14–2,59). (Varmekartet ved Bergen og Bodø ble tatt, men fiskekartets dybdefarger dekker varmen i den zoomen; tallene over er stikkprøven.)
  - **Skjermbilder:** varmekartet over Berlevågfeltet i april to dager med ulik flekk (trekket 0,42 og 0,13), i 1280 × 800 og 800 × 1280: flekkene står mykt, uten kant og uten sirkel (sirkelen er sonarens rekkevidde).

### F3. Feltnavnene i teksten (steg 31c)

- **Bygger:**
  - `nearestPlace` og `recPlace`: en fiskeplass (`k = f`) innen sin egen radius, høyst 1,5 nm, vinner over en havn lenger unna: «på Bjørnvika» i grunnstøtingen, i Kystposten og i rekordene.
  - **Puben** (`rumour`): ryktet velger blant fiskeplassene innen 20 km av havna båten ligger i, i sesong, etter tetthet × prisen ved nærmeste mottak. På Senja er de seks feltene med som før. Retter feilen i 2.2 (Husøy i Bergen).
  - **Kystposten** (`newsForDay`): «Tynt fiske på …» for feltene nær hjemmehavna, ikke bare Senjas fire, og én sak når et felt nær hjemmehavna går inn i sesongen («Skreien er kommet til …»), høyst én slik sak i uka. Ingen push.
  - **Kjentmannen** (`kjentFind`) og **leteoppdraget** (`turLetePlace`) sier feltets navn når punktet ligger på et felt.
  - **Senjas seks navn ut av tekstene** (Jonas 08.11.2026): `nearestPlace`, `recPlace`, `rumour`, `newsForDay` og `alumniGround` bruker fiskeplassene på Senja som overalt ellers, og første tur på Senja sier stedet slik starter langs resten av kysten gjør (nærmeste fiskeplass eller «utenfor <havn>»), ikke «ved Gisundet nord». Flekken og ringen står der de står.
  - Tekstene sier hva folk sier og hva som har skjedd, som i dag, og aldri tall for hvor mye fisk det står på et felt (V4).
- **Filer:** `core/01-world.js` (`nearestPlace`), `core/09b-records.js` (`recPlace`), `core/06-services.js` (`newsForDay`), `core/14-crewlife.js` (`alumniGround`), `ui/09-hand-fishing.js` (`rumour`), `ui/09b-pub.js` (`kjentFind`), `core/09g-turer.js` (`turLetePlace`), `ui/07b-first-trip.js` (`tutAt`), `ui/phone/07-patch.js`.
- **Tester:** `worldtest`, `trip2`, `harbourtest` (`01-world.js`), `rectest`, `uketest`, `posttest`, `turtest`, `fixtest`, `seasontest`, `pubtest`, `hailltest`, `tests/unit/turer.test.mjs`, `tut.py` (ett format, første tur på Senja), og en ny sjekk i `felt.test.mjs`: `nearestPlace` på Bjørnvika gir feltet, ryktet i Bergen nevner et felt nær Bergen, og ingen tekst bruker `GROUNDS`-navnene (sett rød først).
- **Stikkprøver:** puben og Kystpostens lokale fane i Bergen, Bodø og Båtsfjord.
- **Skjermbilder:** Kystposten og pubens rykte i 800 × 1280 og 1280 × 800.
- **Status (11.11.2026, Jonas' økt, gren `ccr-cb5d0d6b-itetzc`): bygd.** Slik det ble (detaljene i `docs/systemer/fiskerimodellen.md` 5.3c-F3):
  - **Hjelperne** (`core/01-world.js`): `feltNameAt(p)` gir fiskeplassen med navn der punktet ligger inne (`feltAt`, masken over 0,5; av flere den minste), ellers den nærmeste med omrisset innen 1,5 nm. `placeAt(p)` velger mellom den og nærmeste havn: feltet vinner når punktet ligger på det eller når omrisset er nærmere enn havna, men aldri innen en halv nautisk mil av en havn (en grunnstøting ved kaia er «ved Husøy»). `feltNear(p, R)` gir fiskeplassene med navn innen R km, med et punkt inne i hver. `feltName(f)` er kartets navn, eller hele navnet der kartet kortet det med «…». `feltPa(n)` setter «på» foran navnet, unntatt for de 225 navnene som er beskrivelser («Sør av Vallosen», «Utenfor Tubåen», `FELT_DESC`): de står alene med liten forbokstav («godt med sei sør av Vallosen»), og ingenting ligger «ved» en beskrivelse (da står havna). `feltLawful(sp, p, H)` spør `rulesAt` om arten kan fiskes der da (en liten båt med juksa).
  - **`nearestPlace` og `recPlace`** bruker `placeAt`: «på Makkaur-sandfjorden», «ved Ytre Medhuvskallen», ellers «4,9 nm fra Oldervik» som før. Utstyrsbutikkene og verftene langs kysten (`06c-steder.js`) er ikke lenger «nærmeste havn» (før: «4,4 nm fra Kongsfjord utstyrsbutikk»). Kjentmannen (`kjentFind`) og Kystpostens saker (`pressStory`) får navnet gjennom `nearestPlace`, så `ui/09b-pub.js` er ikke rørt.
  - **Puben:** `rumourAt(pt, H)` i `core/06-services.js` (så den kan enhetstestes) velger blant fiskeplassene innen 20 km av havna, artene feltet har i måneden (`g.sm`, bare spillerens arter, og bare de reglene åpner for der og da, `feltLawful`: ikke kveite i fredningen eller uer utenom sommeren), etter `density` i et punkt inne i feltet × prisen ved havnas mottak (det nærmeste der havna ikke har et). `rumour` i `ui/09-hand-fishing.js` skriver bare setningen. Kartet rundt feltene hentes når puben vises (`rumourNeed`, kalt fra `PUBW.why`; `MAPD.simR` er 4 km, så uten det ville bare feltene like ved havna vært med); et felt som ikke er lastet ennå, er ikke med, og en henting som feilet, prøves igjen etter et halvt minutt.
  - **Kystposten:** «Tynt fiske på <felt>» hver tredje dag for fiskeplassen innen 20 km av hjemmehavna der bestanden står lavest under 0,62 (juksaarten feltet har i måneden; før bare torsk på Senjas fire). Sesongsaken: feltene innen 20 km som går inn i sesongen for en art denne måneden (månedens bit satt, forrige måneds ikke; `feltSeasonIn`; bare arter reglene åpner for den dagen, så kveita ved Bodø, som fiskerne oppga fra april, ikke annonseres 1. april mens den er fredet), de nærmeste først, én den 1., 8., 15. og 22., altså høyst én i uka og fire i måneden. «Skreia er kommet til …» for torsk i januar–april nord for 62° N (avisa skriver «Skreia» ellers også, så ikke «Skreien» som i planen), ellers «Sesongen for hyse er i gang på …». Brødteksten sier at det pleier å fiskes der fra denne måneden, med Fiskeridirektoratets kart som kilde, og ingen tall (V4). Ingen push.
  - **Leteoppdraget** (`turLetePlace`): «på <felt>» når midten av området ligger på et felt, ellers mottaket som før.
  - **`alumniGround`:** nærmeste fiskeplass med navn innen 40 km av hjemmehavna (minst 1,5 km ute, et punkt inne i formen), langs hele kysten. Før var det bare Senjas seks, så en tidligere matros fra Bodø eller Bergen aldri syntes på AIS. Plassen lagres med `gv = 1`; en fra før F3 finnes på nytt.
  - **Første tur** (`tutAt`): det starten ga («utenfor <havn>», som alle starter langs kysten og på Senja får av `chooseStart`), og for et spill uten det: fiskeplassen flekken ligger på, ellers «utenfor <hjemmehavna>». «Ved Gisundet nord» er ute. Tipsene i første tur er ellers ikke endret (de er trakten; feltnavn i dem bør Jonas avgjøre). Flekken og ringen (`tutBonus`, `TUT_FIELD`) står.
  - **Gjennomgangen** (`/code-review`, ni funn; alle rettet unntatt det siste): `natLL` fikk to tall i stedet for et punkt, så «Skreia er kommet til …» aldri ville kommet (sjekken sett rød med feilen satt inn igjen); `alumniGround` lagret plassen før formene var inne; sesongsaken og ryktet spurte ikke reglene; `rumourNeed` prøvde aldri igjen etter en feilet henting; `newsForDay` regnet feltlista og bestanden på nytt for hver lesing (nå husket: `FELT_NEAR`, `NEWS_THIN`); `turLetePlace` og `placeAt` hadde ulik regel nær en havn; beskrivelser som navn («på Sør av Vallosen»); første turs tips fikk «på <felt>» langs hele kysten (tatt tilbake, se over). Ikke rettet: et felt som heter det samme som havna («Tynt fiske på Husøy») leses som havna.
  - **Ryktet der ingen felt er i sesong:** ved Båtsfjord i mars har de fire feltene innen 20 km bare sommermåneder, og den som betalte runden og fikk «Rykte», fikk «Ingen hadde noe å fortelle». Da tas juksaartene (torsk, sei, hyse, lyr) på feltene uansett måned; tettheten kjenner sesongen selv. Funnet i stikkprøven.
  - **Godværssaken** i Kystposten sa «Speilblank sjø i Gisundet» for alle hjemmehavner (sett i Bodø i stikkprøven); den sier nå «Speilblank sjø ved <hjemmehavna>».
  - **Tester 11.11.2026:** `node tests/unit/run.mjs` 3 130 OK (ny `feltnavn.test.mjs` med 38 sjekker, sett rød mot koden før F3 med `git stash` av `src/`: 9 røde; Skreia-sjekken sett rød med `natLL`-feilen satt inn igjen). `run.py smoke`: `worldtest`, `trip2`, `harbourtest`, `posttest`, `turtest`, `fixtest`, `seasontest`, `rectest`, `uketest`, `crewlifetest`, `pubtest` og `tut` (liggende) grønne, `hailltest` er tall. Ikke kjørt, med grunn: de andre `tester.py` foreslo (`draftlooptest`, `legmemotest`, `utfrakai`, `fleet3test`, `opsowntest`, `autonavtest`, `booktest`, `worktest`, `fleet2test`, `saytest`, `selfcrew`, `opptest`, `mannskapshot`, `starttest`, `tutdrift`, `tutfull`, `docktest`, `unittest`) dekker filene, men ingen av dem leser stedsnavn, ryktet, avisa eller de tidligere matrosenes plass. `tut` er kjørt før rettingene etter gjennomgangen; `tutAt` gir etter dem samme tekst som før F3 for alle starter (det starten ga).
  - **Stikkprøver** (bygget med hele kysten, `kart-31`; 3. mars og 12. august 2027 kl. 19): **Bøvågen ved Bergen** (107 felt innen 20 km, alle lastet): «godt med torsk på Nordra Revet» og «sei på Nappane», 12 sesongsaker i året. **Bodø** (41 felt): «sei på Langgrunnen» begge dager, 20–21 sesongsaker, «Skreia er kommet til Vagøya nord» 1. februar. **Båtsfjord** (4 felt): «torsk på Finnskallen» i mars (uten sesongfelt, se over) og «torsk på Makkaur-sandfjorden» i august, 4 sesongsaker («Skreia er kommet til Makkaur-sandfjorden» 1. april). **Husøy** (39 felt): «torsk på Askebåen» og «sei på Årnesbakken», 23–24 sesongsaker. Ingen av Senjas seks gamle navn noe sted, den tidligere matrosens plass ligger i sjø på et felt alle fire steder (2,0–18,2 km fra havna), og ingen sidefeil.
  - **Skjermbilder** (`docs/okter/2026-11-11-31c/`): Kystpostens lokale fane og pubens rykte i Bodø, 1280 × 800 og 800 × 1280.
  - **Avvik fra planen:** Senjas seks er ikke «med som før» i ryktet (startmeldingen og Jonas 08.11.2026 gjelder: de er ikke i noen tekst). Sjekken ligger i en ny `tests/unit/feltnavn.test.mjs`, ikke i `felt.test.mjs`, som oppfølgingen av 31e eide samtidig.
  - **Funnet, ikke rettet (backloggen):** 161 av 4 675 fiskeplasser har samme ring to ganger i `felt-s.b64` (Bjørnvika ved Båtsfjord er én av dem). Med partallsregelen i `feltSd` er da ingenting inne i feltet: F2 løfter ikke fisken der, og teksten sier «ved Bjørnvika», ikke «på». Rettes i `tools/npc/felt.py` (like ringer slås sammen) eller i `feltSd`; begge filene var andres i denne økta.

### F4. Feltnavnene i kartet: bare navnet, og først når du er nær (steg 31d)

- **Jonas' svar (V4, 07.11.2026):** «c, navnet på feltet kan stå men aldri tettheten på fisken.»
- **Bygger:**
  - Feltnavnene vises først fra `view.z ≥ 2` (i dag 1), de største først, som nå. Ingen merking av feltene i sesong, ingen farge eller styrke etter fisken, og ingenting i navnet eller ved trykk som sier hvor mye fisk det står der.
  - Navnene fra F1 (vasket, kortet ved skråstrek eller etter 28 tegn) og gyteområdenes og oppvekstområdenes navn (V3) med lavest prioritet, i samme skrift.
  - **Senjas seks navn tegnes ikke lenger for seg** (i dag fra `view.z ≥ 0,5` med forrang og større skrift; Jonas 08.11.2026): fiskeplassene på Senja følger samme regel som resten av kysten.
  - Et trykk på et navn som er kortet eller tatt ut for plassens skyld, viser hele navnet og hva slags sted det er («Fiskeplass», «Gyteområde», «Oppvekst- og beiteområde», med kilden), slik de andre navnene gjør (`LBLHID`). Ingen arter, måneder eller tall.
  - Taket og cellene settes etter målingen under: nok navn til å finne fram, aldri så tett at det blir støy (Jonas 02.11.2026).
- **Måles:** en ny sjekk i `tests/etikett.py`: hvor mange feltnavn som står, hvor stor del av skjermen de dekker, og at ingen overlapper et annet navn, ved `view.z` 2 og 4 over Bergen, Henningsvær, Bodø og Båtsfjord, i 390 × 844, 800 × 1280, 1280 × 800, 915 × 1208 og 1293 × 830 (Pad 3 i spilltest 2); og at ingen feltnavn står under `view.z` 2, heller ikke på Senja (rød før rettingen).
- **Filer:** `ui/03-map.js` (feltnavnene i `renderStatic` og trykket), `tests/etikett.py`, `tests/charttest.py`, `ui/01-i18n.js` om ordene for slagene trengs der.
- **Tester:** `etikett`, `charttest`, `placetest`, `routetest` (`03-map.js`).
- **Skjermbilder:** Bergen og Båtsfjord ved `view.z` 2 og 4 i 390 × 844, 800 × 1280 og 1280 × 800, og et trykk på et kortet navn.
- **Står igjen til Jonas:** se tettheten på Pad 3 (backloggen 10.5 «Feltnavnene (B2)»).
- **Status (08.11.2026, Jonas' økt, gren `claude/o14-f4-feltnavnene-kart-htpg70`): bygd.** Det som ble gjort og målt:
  - **I kartet** (`renderStatic` i `ui/03-map.js`, `docs/systemer/kartplotter.md` 5.47b): feltnavnene fra `view.z ≥ 2`, fiskeplassene de største først og så gyte- og oppvekstområdene i samme skrift (`feltIn(…, true)` i `core/01e-marks.js`, utvidet med `all`); Senjas seks navn tegnes ikke lenger for seg; de fire fiskeplassene uten navn tegnes ikke. Ingen merking etter sesong eller fisk.
  - **Taket etter målingen:** cellene på 110 × 22 px står, og taket på 80 er nå også høyst ett navn per 13 000 kvadratpiksler (`FELT_PX`). Uten det sto det 35 navn over 6,0 % av skjermen på en telefon (390 × 844) ved Bodø med gyte- og oppvekstområdene med; med det 24 over 4,7 %. Feltnavnets boks går fra 8 px over punktet (før 5), fordi stedsnavnene over henger nedstrekene under sin egen boks: «Kolltveitosen» lå under «Knappskog» i Bergen og «Heggedal» under «Stormolla» ved Henningsvær i liggende format, også før F4.
  - **Trykket:** et trykk på et feltnavn, eller innen 10 px av et felt som ikke fikk plass, viser hele navnet og slaget med kilden («Bakarvågneset - Signalneset, Askøy øst», «Fiskeplass · Fiskeridirektoratet»). Ingen arter, måneder eller tall.
  - **Målt** (`tests/etikett.py`, `dist-vec` med hele kysten, kart-31): feltnavn i bildet og del av skjermen, ved `view.z` 2 / 4. Ingen overlapper et annet navn noe sted.

    | Sted | 390 × 844 | 800 × 1280 | 1280 × 800 | 915 × 1208 (Pad 3) | 1293 × 830 (Pad 3) |
    |---|---|---|---|---|---|
    | Bergen | 24 (4,0 %) / 3 | 45 (2,5 %) / 4 | 63 (4,1 %) / 22 | 55 (3,1 %) / 7 | 69 (4,2 %) / 22 |
    | Henningsvær | 21 (4,9 %) / 9 | 28 (2,2 %) / 15 | 61 (4,3 %) / 27 | 33 (2,1 %) / 17 | 59 (4,1 %) / 27 |
    | Bodø | 24 (4,7 %) / 16 | 50 (2,8 %) / 25 | 74 (4,5 %) / 35 | 57 (3,0 %) / 29 | 74 (4,4 %) / 37 |
    | Båtsfjord | 3 (0,6 %) / 0 | 3 (0,2 %) / 0 | 14 (0,8 %) / 3 | 6 (0,3 %) / 1 | 14 (0,8 %) / 3 |

    Før F4 (bare fiskeplassene, ved `view.z` 2): Bergen 18, 29, 50, 40, 49; Henningsvær 17, 20, 47, 23, 47; Bodø 27, 39, 60, 45, 58; Båtsfjord 3, 3, 11, 6, 11. Under `view.z` 2 sto det opptil 80 feltnavn (Bergen og Henningsvær ved `view.z` 1) og Senjas seks navn overalt fra 0,5; nå ingen.
  - **Stikkprøvene** (Bergen, Henningsvær, Bodø, Båtsfjord, i fem formater): Båtsfjord er like tynn som før (3–14 navn ved `view.z` 2), og gyte- og oppvekstområdene gir 0–3 til der; F5 (Kartverkets navn) er neste steg for hullet. Skjermbildene i `docs/okter/2026-11-08-31d/`.
  - **Tester:** `etikett.py` (de nye sjekkene sett røde mot koden før F4: feltnavn under `view.z` 2 i alle fem formater, Senjas seks navn tegnet, ingen trykk på feltnavn, og overlappene over), `felt.test.mjs` (ny sjekk for `feltIn` med `all`, sett rød uten endringen i `01e-marks.js`), alle enhetstestene, `charttest`, `placetest`, `routetest`.

### F5. Kartverkets stedsnavn i sjøen der Fiskeridirektoratet har lite (steg 31e)

- **Jonas' svar (V3, 07.11.2026):** «Ta det mest realistiske.» Det mest realistiske er navnene som finnes i de offentlige kildene, og bare dem: Fiskeridirektoratets fiskeplasser, gyteområder og oppvekst- og beiteområder (F1), og Kartverkets stedsnavn for banker, grunner og fiskeplasser i sjøen der Fiskeridirektoratet har lite (her). Ingen navn diktes opp, og der ingen kilde har et navn, står det ikke noe.
- **Bygger:** `felt.py` henter sjønavnene fra Kartverkets stedsnavn-API (Sentralt stedsnavnregister) for strekningene der dekningen etter F1 er tynnest, først Øst- og Vest-Finnmark, som eget slag (`k = s`). Bare navn: aldri vekt og aldri flåtetrykk. Et navn som alt står i kartet (`chartNamesSvg`) eller blant feltene innen 1 km, tas ikke med to ganger.
- **Verten** `api.kartverket.no` er åpen i miljøet fra 08.11.2026 (Jonas la den til; svarte 200).
- **Sjekket 08.11.2026:** API-et (`/stedsnavn/v1/`) har typene «Fiskeplass i sjø», «Banke i sjø», «Grunne i sjø», «Egg i sjø» og «Havdyp» (og «Båe i sjø» og «Skjær i sjø», som er fare for sjøfarten, ikke fiskeplasser, og ikke tas med). Filteret `navneobjekttype` virker ikke i spørringen (samme treff for alle typer), så navnene hentes per kommune (`knr`, 500 per side) og sorteres etter typen i svaret. Berlevåg ga 15 grunner, Båtsfjord 5 grunner og havdypet Leira (blåkveitefeltet); ingen «Fiskeplass i sjø» i noen av dem. Lisensen sto ikke i API-et og sjekkes før noe tas inn.
- **Filer:** `tools/npc/felt.py`, `src/data/felt.json`, `tests/unit/felt.test.mjs`.
- **Tester:** `felt.test.mjs`, `charttest`.
- **Måles:** tabellen i 2.5 på nytt.
- **Bygd 11.11.2026** (Jonas' økt, gren `ccr-2c3acb2e-1xxdth`):
  - **Hentingen:** typefilteret virker likevel, på `/sted` (ikke `/navn`) og med typens kode (`navneobjekttype=grunneISjø`, ikke «Grunne i sjø», som gir 0 treff), så `felt.py` henter hele fylket per type (`fnr=56`, 500 per side) i stedet for per kommune. API-et gir høyst 5 000 treff per spørring; `felt.py` stopper om en type i et fylke går over. Svarene mellomlagres i `tools/npc/cache/` i 20 dager, som WFS-lagene.
  - **Det som ble tatt inn (Finnmark, `KV_FYLKER = ['56']`):** 882 aktive steder: 732 med i `felt.json` som `k = s` (715 «Grunne i sjø», 9 «Fiskeplass i sjø», 5 «Havdyp», 2 «Banke i sjø», 1 «Egg i sjø»). Ute: 60 fordi et felt alt har navnet innen 3 km, 80 fordi samme sjønavn står to ganger innen 1 km (en grunne er ofte registrert som flere punkter), 1 fordi et annet sjønavn står på samme sted (innen 150 m), og 9 uten godkjent eller vedtatt navn (bare historisk eller foreslått).
  - **Dobbeltnavn strengere enn startmeldingen** (etter gjennomgangen av koden, som fant 19 dobbeltnavn i første utgave): mot feltene er grensa 3 km, ikke 1 (`KV_FELT_KM`, som `MERGE_KM`: samme navn innen 3 km er ett felt, og feltets punkt er midten av polygonet, ofte over 1 km fra Kartverkets punkt: «Kobbøygrunnen» 1,18 km, «Ryggen» 1,99 km, «Grunnskallen» 2,79 km). Navnene sammenlignes uten bestemt endelse og bindestrek (`name_key`: «Ytre Stabbegrunnen» er «Ytre Stabbegrunn», «Peder Hansa-skallen» er «Peder Hansaskallen»), og mot feltets hele navn, kartets korte navn og hver del av et navn med skråstrek («Storklakken» mot «Storklakken/Mellafjorden»). Mellom sjønavnene er grensa 1 km.
  - **Sjønavnene står sist i fila**, etter alle feltene, så et felts nummer er det samme med og uten dem: `03j-felt.js` trekker feltets fase fra nummeret (`h2(f.i, …)`), og med sjønavnene flettet inn etter posisjon flyttet alle fasene seg (F2-sjekken «ingen kant» gikk fra 7,4 til 10,2 % per 100 m, over grensa på 10). Der et sted har flere navn, tas det norske hovednavnet, ellers det samiske eller kvenske (de ni fiskeplassene ved Bugøynes har kvenske navn: «Pelkeplassen», «Pikku-Skitsi»). «Båe i sjø» og «Skjær i sjø» er ikke med; «Klakk i sjø» (2 i Finnmark, begge «Klakken»; 30 i Troms) er ikke blant de fem typene planen sjekket, og er ikke tatt med.
  - **Bare navn og punkt:** `g` er `-`, `r` er 0, `l` er `[]`, og 0 ringer i `felt-s.b64` (antallet der følger `felt.json`). Aldri vekt (`03j-felt.js` bygger bare av `k = f`) og aldri trykk (`trkAreas`, `trkCellW`). I kartet kommer de sist, etter fiskeplassene og gyte- og oppvekstområdene, og bare der det er plass (`feltIn` med `all` sorterer etter `r`).
  - **Lisensen:** Kartverkets gratis produkter, også Sentralt stedsnavnregister, er lisensiert CC BY 4.0 (Kartverkets «Vilkår for bruk» og Geonorges metadata for stedsnavnene, funnet ved nettsøk 11.11.2026; sidene på `kartverket.no` og `geonorge.no` er stengt fra øktas miljø og ble ikke lest direkte, og den nøyaktige ordlyden Kartverket vil ha i krediteringen er derfor ikke sjekket). CC BY krever at kilden navngis: `meta.src` i `felt.json` sier «Kartverket, Sentralt stedsnavnregister … CC BY 4.0», kartet har «© Kartverket» nederst fra før, og boblen ved trykk på et sjønavn sier «Stedsnavn i sjøen · Kartverket» (to linjer i `ui/03-map.js`, `FELT_KIND` og `tapName`: uten dem ville boblen sagt «Fiskeplass · Fiskeridirektoratet» for Kartverkets navn).
  - **Dobbeltnavn mot kartet (`chartNamesSvg`):** kartets egne navn er byer, fjorder, sund og øyer fra Overture (`tools/map/chart.py`), ikke grunner, banker eller dyp, så generatoren sammenligner bare med feltene. I kartet står et sjønavn aldri oppå et annet navn (`over` i `03-map.js`); skjermbildene ved Båtsfjord, Tana og Hammerfest viser ingen navn to ganger.
  - **Fiskeridirektoratets lag ble hentet på nytt samtidig** (`felt.py` henter alltid alle lagene): 4 675 fiskeplasser mot 4 683 den 08.11.2026 (29 felt ut eller endret og 21 inn, alle sett i Rogaland: «Vigdel» og «Tananger» ute, «Feistein» og «Ølberg» inne, «Botne» med nye måneder), 1 635 gyteområder og 445 oppvekstområder som før.
  - **Tabellen i 2.5 på nytt** (samme inndeling som etter F1; Vest-Finnmark er mottakene nord for 69,95° N og vest for 25,5° Ø, som gir de 24 mottakene; fiskeplassene per landsdel teller litt annerledes enn i F1-tabellen, 287 mot 305, fordi grensa ikke er helt den samme):

    | Landsdel | Mottak | Fiskeplasser innen 10 / 20 km | Gyte- og oppvekstområder innen 20 km | Sjønavn (`s`) innen 10 / 20 km | Alle navn innen 20 km før → etter F5 | Nærmeste navn (median) før → etter |
    |---|---|---|---|---|---|---|
    | Vest-Finnmark | 24 | 5,3 / 20,3 | 10,8 | 11,0 / 41,0 | 31,1 → 72,1 | 1,9 → 1,8 km |
    | Øst-Finnmark | 42 | 2,5 / 8,4 | 6,9 | 6,6 / 17,1 | 15,4 → 32,5 | 5,2 → 1,9 km |

    De tynneste: **Båtsfjord** 10 sjønavn innen 20 km av mottakene (før 3–5 fiskeplasser og 1 gyteområde; nærmeste er Skarberggrunnen 9–11 km ut, så selve fjorden er like tom som før: ingen kilde har et navn der); **Tana** 2–5 (Sivlesáttu og Sáttoboldni innerst, Seigrunnen ute; nærmeste 14–15 km fra mottakene); **Kirkenes** 6, **Bugøynes** 12–13, **Vadsø** 12, **Berlevåg** 15, **Mehamn** 44, **Honningsvåg** 29–30, **Havøysund** 92–96. Øst-Finnmark har 227 av sjønavnene og Vest-Finnmark 505.
  - **Stikkprøvene i kartet** (`view.z` 2 og 4, 800×1280 og 1280×800, `docs/okter/2026-11-11-31e/`): **Båtsfjord** 9 feltnavn stående og 20 liggende ved `view.z` 2 (6 av dem sjønavn: Skarberggrunnen, Veidnesgrunnen, Lønfallet, Grønøygrunnen), mot 3–14 før; **Tana** 5 og 11 (2–3 sjønavn); **Hammerfest** 43 og 74 (30 og 36 sjønavn; 2,9 og 5,0 % av skjermen, som er taket fra F4: tett, men lesbart i bildet); **Bodø** 50 og 74 og **Bergen** 45 og 63, uten sjønavn og som før F5. Ingen navn oppå hverandre noe sted, ingen sidefeil.
  - **Tester:** `felt.test.mjs` (9 nye sjekker: slaget finnes, kilden og lisensen i `meta.src`, alle i Finnmark så lenge bare fylke 56 hentes, Leira, Seigrunnen og Skarberggrunnen ved Båtsfjord, bare navn og punkt, 0 ringer, ingen dobbeltnavn (felt innen 3 km, sjønavn innen 1 km), ingen to sjønavn på samme sted, ingen feltvekt ved et sjønavn i en lokasjon; **sett rød**: 8 FEIL mot `felt.json` fra før F5; dobbeltnavn-sjekken rød med 19 navn og samme-sted-sjekken med 2 mot første utgave av dataene; trykksjekkene røde med filteret i `03g-trykk.js` åpnet for `s`, også den gamle «trkAreas teller bare fiskeplassene», som nå dekker `s`), og testene i commit-meldingen. Stikkprøvene over målte overlappet med `etikett.py`s egen måling (`FELTM`).
  - **Det som står igjen:** resten av kysten (Troms har 1 010 grunner i registeret og er nest tynnest; `KV_FYLKER` er ett tall å utvide, men tettheten i kartet bør ses på nettbrettet først), og den nøyaktige krediteringsteksten fra Kartverkets vilkår.
- **Oppfølging samme dag** (Jonas 11.11.2026: «Legg til troms også. Om kartplotteren blir rotete må det være sånn at navnene først kommer opp om man zoomer svært langt inn. Gjør gjerne også sånn at man kan zoome inn litt. Gjør gjerne også sånn at når man zoomer langt ut så vises ikke fiskemottak, verft, utstyrbutikker, rorbuer og naust på kartet, slik at disse bare vises når man starter å zoome litt nærmere inn og det blir aktuelt å se sånt.»):
  - **Troms er med** (`KV_FYLKER = ['56', '55']`): 2 818 aktive steder i de to fylkene, 2 402 med (2 353 grunner, 19 havdyp, 17 fiskeplasser, 11 banker, 2 egger; 1 670 av dem i Troms). Ute: 96 fordi et felt har navnet innen 3 km, 264 doble innen 1 km, 16 på samme sted som et annet, 40 uten godkjent navn. `felt.json` er 384 kB (før 342; over målet på 350 kB fra F1, og fila ligger i siden: se backloggen).
  - **Sjønavnene kommer først langt inne:** med 36 av 74 navn ved Hammerfest ved `view.z` 2 var kartet for tett, så slaget `s` tegnes først fra `view.z` 6 (`FELT_S_Z` i `ui/03-map.js`, rundt 17 km av kysten i høyden). Fiskeplassene og gyte- og oppvekstområdene står fra `view.z` 2 som før F5. Målt: Hammerfest `view.z` 2: 13 feltnavn stående og 38 liggende, ingen sjønavn; `view.z` 6: 10 og 14 sjønavn. Tromsø `view.z` 6: 16 og 14 sjønavn (Finnvikgrunnen, Strandgrunnen, Skognesgrunnen). Båtsfjord `view.z` 2 er dermed tilbake på 3 og 14 navn, og sjønavnene der (Skarberggrunnen, Veidnesgrunnen) kommer når du zoomer inn ute ved kysten. Bodø og Bergen som før.
  - **Tabellen med Troms** (alle navn innen 20 km av et mottak, før F5 → nå; Troms er mottakene mellom 68,4 og 69,95° N, og «Vest-Finnmark» etter breddegrad tar med Nord-Troms, som nå har sjønavn): Troms 40,0 → 99,7 (nærmeste navn 3,1 → 1,8 km), Vest-Finnmark 31,1 → 98,4, Øst-Finnmark 15,4 → 32,5.
  - **Zoom og steder** står i `docs/systemer/kartplotter.md` («Zoom og steder, 11.11.2026»).
  - **Tester:** `felt.test.mjs` (Troms-sjekken ny; den avslørte at breddegradssjekken fra F5 kalte `natLL` feil og aldri regnet noe, rettet), `charttest` med fem nye sjekker (sett rød uten endringen i `03-map.js`). Skjermbildene i `docs/okter/2026-11-11-31e-b/`.

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
- Senjas seks felt er som alle de andre: Jonas 08.11.2026: «Senja sine felt skal fungere akkurat likt som alle de andre fiskefeltene i landet og ikke være en fast sirkel.» `GROUNDS` blir bare faste punkter for kalibreringen og testene (2.8, F1–F4); `simday` holdes.
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
- **Kartverket** gir lite i Øst-Finnmark (rundt 5–15 navn per kommune) og nesten bare grunner. Lisensen er CC BY 4.0 (sjekket ved nettsøk 11.11.2026, F5); den nøyaktige krediteringsteksten i Kartverkets vilkår er ikke lest, fordi `kartverket.no` er stengt fra øktas miljø.

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

- 11.11.2026: **F3 bygd** (Jonas' økt, gren `ccr-cb5d0d6b-itetzc`): feltnavnene i teksten langs hele kysten (stedet i grunnstøtingen, Kystposten, rekordene, kjentmannen og leteoppdraget; pubens rykte fra feltene nær havna; «Tynt fiske på» og sesongsaken for feltene nær hjemmehavna; de tidligere matrosene på AIS langs hele kysten; første tur uten «Gisundet nord»). Senjas seks navn er ikke i noen tekst. Tallene under F3. Med det er F1–F5 bygd.
- 11.11.2026: **F5 bygd** (Jonas' økt, gren `ccr-2c3acb2e-1xxdth`): 732 av Kartverkets stedsnavn i sjøen i Finnmark som eget slag (`k = s`), bare navn og punkt, CC BY 4.0. Alle navn innen 20 km av et mottak i Øst-Finnmark 15,4 → 32,5 og i Vest-Finnmark 31,1 → 72,1. Tallene under F5.
- 08.11.2026: **F2 bygd og rullet ut i c199ab8a** (Jonas' økt, gren `claude/o14-f2-fiske-flate-nv6aqz`): fisken på fiskeplassene i sesong, i feltets form og uten kant, summen per lokasjon som før, flåten følger fisken, Senjas sirkler ute (Jonas: Senja på samme vilkår som resten, `k` står). Tallene under F2. F3 (31c) er klar.
- 08.11.2026: **F4 bygd og rullet ut i bcd65760** (Jonas' økt, gren `claude/o14-f4-feltnavnene-kart-htpg70`): feltnavnene fra `view.z ≥ 2`, gyte- og oppvekstområdene med lavest prioritet, Senjas seks navn ikke lenger for seg, taket etter skjermflaten og trykket med hele navnet og slaget. Tallene under F4. Står igjen til Jonas: tettheten på Pad 3.
- 08.11.2026: **F1 bygd** (Jonas' økt, gren `ccr-6e53b4c0-qs2mg1`): art, redskap og måneder per felt, gyte- og oppvekstområdene som egne slag, navnevasken, formene i en egen fil (`felt-s.b64`, 157 kB), og Senjas fiskeplasser som resten. Tallene under F1. F2 (31b), F4 (31d) og F5 (31e) er klare; startmeldingene er rettet etter formatet.
- 07.11.2026: planen skrevet (Jonas' økt, gren `ccr-5a96a95a-wu5hvn`; bare dokumenter). Målingene i 2.3, 2.4 og 2.5 ble gjort i økta (enhetstestenes laster og WFS-en uten polygoner); ingenting i `src/` eller `tests/` er endret. Fasene står i køen som 31a–31e med `venter på valg`. Venter på V1–V4.
- 08.11.2026: Jonas: «Senja sine felt skal fungere akkurat likt som alle de andre fiskefeltene i landet og ikke være en fast sirkel.» Skrevet inn i 2.8, F1–F4 og kap. 5: `GROUNDS` mister alt det gjør som felt (fisken, kartet, tekstene), og Fiskeridirektoratets fiskeplasser på de samme stedene tar over. Jonas la `api.kartverket.no` til i miljøet; F5 venter bare på F1. Sjekket Kartverkets API (F5).
- 07.11.2026: **Jonas svarte på valgene** (kap. 5). F2 er lagt om etter V1 (ingen fast boks eller sirkel: feltet trekker de gode flekkene i sin egen form og sesong, Senjas felt med), F4 etter V4 C, og F5 tas (V3). F1 (31a) er klar; F2 og F4 venter på F1, F3 på F2, og F5 på F1 og verten `api.kartverket.no` i miljøet.
