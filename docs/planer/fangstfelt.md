# Fangstfeltene med navn langs hele kysten (Ø14, plan 07.11.2026)

Plan for steg 31 i `docs/planer/koen.md` (`/planlegg`). Ingenting er bygd. Fasene står i køen som steg 31a–31e og venter på valgene i kapittel 5.

## 1. Hva Jonas ba om

- **Spilltest 1** (`docs/playtest/rapport-1.md`, 30.09.2026): «Fangsten føles for liten, og fangstfeltene betyr lite.» «En spiller som stoler på sirklene, blir skuffet. Kartet bør si at de er hint, eller sirklene bør vekte mer.» Backloggen 10.2 kaller det «De navngitte fangstfeltene finnes bare på Senja».
- **Jonas 06.10.2026:** spillet er nasjonalt. Alt som legges inn, gjelder hele kysten (`CLAUDE.md`).
- **Jonas 28.10.2026:** «Fjern sirklene for fangstfelt langs hele kysten. Bare navn på felt langs hele kysten er ok, men det skal ikke vises som en definert sirkel» (`docs/systemer/kartplotter.md`).
- **Jonas 01.11.2026** (B2): «Kjør på med alt som gjør at du mener vi klarer i simulerer fiskens liv med høyest mulig nøyaktighet.»
- **Jonas 02.11.2026** (etikettene, `docs/planer/kart-etiketter.md`): «Vi må passe på at ikke blir alt for mye info og navn på kartet som overlapper hverandre slik at det bare blir støy.» Valg 2 A: felt- og stedsnavn kommer etter alt spilleren handler og spiller med.
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

Én økt hver. Rekkefølgen: dataene først (F1, nesten usynlig), så fisken (F2), så tekstene (F3), så etikettene (F4, kan gå før F2 og F3 når `ui/03-map.js` er ledig). F5 bare om V3 er B, eller om F1 viser at Øst-Finnmark fortsatt er for tynt. Testene under er de som dekker filene etter `COVER` i `tests/run.py`; `python3 tools/plan/tester.py` gir den fulle lista for grenen.

### F1. Fiskeplassene med art, redskap og måneder, og navnene vasket (steg 31a)

- **Bygger:**
  - `felt.py` leser også `fiskeart_1–8`, `redskap_1–8`, `fra_1–8` og `til_1–8`, og skriver per felt artene som spillet kjenner (torsk, hyse, sei, lyr, lange, brosme, uer, kveite, blåkveite, sild, makrell, snøkrabbe, kongekrabbe), hver med månedene som en maske på 12 biter og redskapene som en maske etter `GEAR` i `fiske.py`. Når samme navn innen 3 km slås sammen (`MERGE_KM`), slås linjene sammen. Et felt uten art får ingen linjer.
  - **Navnevasken:** store bokstaver blir vanlig skrift («Røværfjorden»; små ord som «i», «av», «til» og «fra» med liten), stor forbokstav, koordinater ut (feltet får da intet navn og står bare som vekt), og navnet i kartet kortes ved en skråstrek eller etter 28 tegn (hele navnet står i kortet i F4). Hver regel med antallet den rettet, i `felt.py`s utskrift.
  - **Etter V3 A:** gyteområdene og oppvekst- og beiteområdene inn som eget slag (`k`: `f` fiskeplass, `g` gyteområde, `o` oppvekst og beite), med navn, art og måneder. De får aldri vekt og aldri flåtetrykk: `trkAreas` og `trkCellW` tar bare `k = f`, og `feltIn` gir dem ikke til kartet før F4.
  - `feltData` leser de nye feltene (`f.k`, `f.l` med [art, redskap, måneder]). Ingenting annet i spillet endres.
- **Filer:** `tools/npc/felt.py`, `src/data/felt.json`, `core/01e-marks.js` (`feltData`, `feltIn`), `core/03g-trykk.js` (bare filteret på slaget), ny `tests/unit/felt.test.mjs`, `tests/run.py` (`COVER` for `tools/npc/felt.py`), `docs/systemer/fiskerimodellen.md` (5.3c «Feltnavnene»).
- **Tester:** `tests/unit/felt.test.mjs` (ny; antallet per slag, Billefjordjupet har torsk med garn, et kjent sesongfelt har riktige måneder, ingen navn med koordinater eller bare store bokstaver, ingen `g` eller `o` i `trkAreas`; sett rød før `felt.json` er ny), `trykk.test.mjs` (gruppesummene står), `charttest` (`felt.json`), `marktest` (`01e-marks.js`). Fordi trykket flytter seg litt når felt slås sammen og koordinatnavn går ut: `simday` og `heattest`.
- **Måles:** `felt.json` før og etter (128 kB nå; målet under 200 kB), `feltData` i Node og i Chromium (første oppslag), tabellen i 2.5 på nytt med de nye slagene, antallet rettet per vaskeregel.
- **Spilleren ser:** penere navn i kartet. Ingenting annet.

### F2. Fisken samles på feltene, og flåten følger samme vekt (steg 31b)

- **Bygger** (med V1 A og V2 A):
  - **Feltvekten** `feltW(q, sp, H)` i en ny `core/03i-felt.js`: 1 + (W − 1) × summen av `exp(−(d/r)²)` over fiskeplassene i nærheten som har arten i måneden (et felt uten art teller for juksaartene hele året), høyst W. `r` er feltets størrelse, minst 0,5 km. W = 3 etter V1 A. Myk kant, ingen sirkel (Jonas 28.10.2026), og ingen trapper i varmekartet.
  - **Summen per lokasjon står:** `feltWl(l, sp, måned)` er snittet av vekten over lokasjonens sjø (regnet én gang per lokasjon, art og måned på et rutenett på 1 km), og fisken ganges med `feltW / feltWl`. Lokasjonen har like mye fisk som før, så `fkAvail` og kalibreringen mot Senja står; fisken flyttes bare innen lokasjonen, til feltene. En lokasjon uten felt er uendret.
  - **`denSp`** ganger tettheten med vekten. `denPlace` finner feltene nær punktet én gang (`q.fl`), så hvert kall bare slår opp art og måned.
  - **Flåten følger samme vekt:** `trkCell` legger både trykket (`f`) og fisken (`b`) med `feltW / feltWl` i stedet for dagens `trkCellW` (×3 på trykket alene). Da er andelen som tas (`u = f / b`) den samme på og utenfor feltet, og grunnlinja er nøytral. De aktive feltene tar fortsatt havflåtens trykk i hovedområdet (`gwa`).
  - **Senjas seks felt** står som de er (bumpen, `skreiSpot`, Kystposten), og teller som felt i `feltWl` med artene i `g.sp` hele året, så de ikke mister fisk til fiskeplassene rundt.
- **Filer:** ny `core/03i-felt.js` (og én linje i `src/index.html` etter `03g-trykk.js`), `core/03-simulation.js` (`denPlace`, `denSp`), `core/03g-trykk.js` (`trkAreas`, `trkCellW`, `trkCell`), `tests/run.py` (`COVER` for den nye fila), `tests/unit/felt.test.mjs`, `tests/fiskeplay.py` (scenarioet `felt`), `ui/phone/07-patch.js`, `docs/systemer/fiskerimodellen.md` (5.3c og 5.3d).
- **Tester:**
  - `tests/unit/felt.test.mjs` utvidet: summen av vekten over en lokasjon er 1 ± 1 % for torsk i mars og juli på fem lokasjoner; vekten på et felt i sesong er rundt W og utenfor sesongen 1; grunnlinja på feltet er minst 0,97 av den like ved (i dag 0,68 mot 0,85 ved Henningsvær i mars: rød før rettingen).
  - `trykk.test.mjs` (gruppesummene), `vandring.test.mjs`.
  - `simday` (±10 % på de fire stedene, ellers `k` justert som i B2 og B3), `calib`, `kvtest`, `geartest`, `bktest`, `heattest`, `jigalongtest`, `progweek`. `fasit.py` (27 min, i bakgrunnen): treffet mot 2025 skal ikke bli dårligere enn rundt 85 % av taket.
- **Måles:**
  - `fiskeplay.py felt`: én person med håndjuksa i tre timer på et navngitt felt i sesong mot tre timer 4–6 km unna i samme lokasjon, ved Henningsvær i mars, Bodø i mars, Bergen i mars, Hammerfest i januar og Båtsfjord i april. Målet med V1 A: feltet gir minst 1,5 ganger så mye i sesong, og utenfor sesongen er det innen ±20 %.
  - Tiden: `density` høyst 1 µs mer per kall (18–19 µs nå), `trkCell` høyst 2 µs mer første gang i en ny time.
  - Tabellen i 2.3 på nytt.
- **Stikkprøver:** Bergen, Bodø og Båtsfjord (`/stikkprove`): et felt i sesong og ett utenfor sesong, kg i timen og varmekartet.
- **Skjermbilder:** varmekartet over et felt i sesong i 800 × 1280 og 1280 × 800: fisken tettere på feltet, ingen kant og ingen sirkel.
- **Patchnote:** kort, uten psykologi, for eksempel «Fiskeplassene langs kysten har fisk når fiskerne har hatt det der: artene og månedene fra Fiskeridirektoratets kart.»

### F3. Feltnavnene i teksten (steg 31c)

- **Bygger:**
  - `nearestPlace` og `recPlace`: en fiskeplass (`k = f`) innen sin egen radius, høyst 1,5 nm, vinner over en havn lenger unna: «på Bjørnvika» i grunnstøtingen, i Kystposten og i rekordene.
  - **Puben** (`rumour`): ryktet velger blant fiskeplassene innen 20 km av havna båten ligger i, i sesong, etter tetthet × prisen ved nærmeste mottak. På Senja er de seks feltene med som før. Retter feilen i 2.2 (Husøy i Bergen).
  - **Kystposten** (`newsForDay`): «Tynt fiske på …» for feltene nær hjemmehavna, ikke bare Senjas fire, og én sak når et felt nær hjemmehavna går inn i sesongen («Skreien er kommet til …»), høyst én slik sak i uka. Ingen push.
  - **Kjentmannen** (`kjentFind`) og **leteoppdraget** (`turLetePlace`) sier feltets navn når punktet ligger på et felt.
- **Filer:** `core/01-world.js` (`nearestPlace`), `core/09b-records.js` (`recPlace`), `core/06-services.js` (`newsForDay`), `ui/09-hand-fishing.js` (`rumour`), `ui/09b-pub.js` (`kjentFind`), `core/09g-turer.js` (`turLetePlace`), `ui/phone/07-patch.js`.
- **Tester:** `worldtest`, `trip2`, `harbourtest` (`01-world.js`), `rectest`, `uketest`, `posttest`, `turtest`, `fixtest`, `seasontest`, `pubtest`, `hailltest`, `tests/unit/turer.test.mjs`, og en ny sjekk i `felt.test.mjs`: `nearestPlace` på Bjørnvika gir feltet, og ryktet i Bergen nevner et felt nær Bergen (sett rød først).
- **Stikkprøver:** puben og Kystpostens lokale fane i Bergen, Bodø og Båtsfjord.
- **Skjermbilder:** Kystposten og pubens rykte i 800 × 1280 og 1280 × 800.

### F4. Etikettene på telefon og nettbrett (steg 31d)

- **Måles først:** en ny sjekk i `tests/etikett.py`: hvor mange feltnavn som står i bildet, hvor stor del av skjermen de dekker, og at ingen overlapper et annet navn, ved `view.z` 1, 2 og 4 over Bergen, Henningsvær, Bodø og Båtsfjord, i 390 × 844, 800 × 1280, 1280 × 800, 915 × 1208 og 1293 × 830 (Pad 3 i spilltest 2).
- **Bygger** (med V4 A):
  - Feltene i sesong for artene redskapet om bord tar, først; så de største. Taket og cellene settes etter målingen, per skjermflate i stedet for et fast tall (for eksempel ett navn per 25 000 px² og celler på 150 × 40 px). Feltene i sesong litt sterkere (`fill-opacity` i SVG-en; `styles.css` røres ikke, UI 2 eier den).
  - **Et trykk på navnet** viser et kort kort: «Fiskeplass for torsk og sei (garn, juksa), januar–april. Kilde: Fiskeridirektoratet.» Det lange navnet står der hele.
  - Gyteområdene og oppvekstområdene (V3 A) kommer inn sist i prioriteten, og kortet sier «Gyteområde for torsk, januar–april».
- **Filer:** `ui/03-map.js` (feltnavnene i `renderStatic` og trykket), `tests/etikett.py`, `tests/charttest.py`, `ui/01-i18n.js` om kortets ord trengs der.
- **Tester:** `etikett` (ny sjekk, sett rød mot dagens 80 der målingen sier for tett), `charttest`, `placetest`, `routetest` (`03-map.js`).
- **Skjermbilder:** Bergen og Båtsfjord ved `view.z` 1 og 2 i 390 × 844, 800 × 1280 og 1280 × 800, og kortet.
- **Står igjen til Jonas:** se tettheten på Pad 3 (backloggen 10.5 «Feltnavnene (B2)»).

### F5. Øst-Finnmark med Kartverkets stedsnavn (steg 31e, bare om V3 er B, eller om F1 viser færre enn 10 navn innen 20 km av mottakene i Båtsfjord)

- **Bygger:** `felt.py` henter sjønavn (banker, grunner og fiskeplasser i sjøen) fra Kartverkets stedsnavn-API der dekningen er tynnest, som eget slag (`k = s`), bare navn, aldri vekt og aldri flåtetrykk.
- **Krever:** verten `api.kartverket.no` åpnet i miljøet (svarte 403 herfra 07.11.2026), og lisensen sjekket før noe tas inn. At navneobjekttypene for sjøen dekker fiskeplasser, er ikke sjekket.
- **Filer:** `tools/npc/felt.py`, `src/data/felt.json`, `tests/unit/felt.test.mjs`.
- **Tester:** `felt.test.mjs`, `charttest`.
- **Måles:** tabellen i 2.5 på nytt.

## 4. Slik måles det, samlet

1. **Dekningen:** tabellen i 2.5 (fiskeplasser og alle navn innen 10 og 20 km av hvert mottak per landsdel), før og etter F1 og F5.
2. **Grunnlinja på og utenfor feltene:** tabellen i 2.3, som sjekk i `felt.test.mjs` fra F2.
3. **Fisken på feltet mot like ved:** `fiskeplay.py felt` på fem steder, i og utenfor sesong (F2).
4. **At resten står:** `simday`, `calib`, `progweek` og `fasit.py` før og etter F2; summen per lokasjon i enhetstesten.
5. **Tiden:** `density` og `trkCell` i µs (F2), `feltData` i ms (F1).
6. **Etikettene:** antall, del av skjermen og overlapp per format og zoom (F4), og Jonas på Pad 3.

## 5. Valgene

**V1. Hvor sterkt et felt trekker fisken** (F2)
- **A (anbefalt):** ×3 på feltet, det samme som flåtens trykk der i dag, og fisken og flåten følger samme vekt. Et felt i sesong gir rundt tre ganger så mye fisk som sjøen like ved i samme lokasjon, grunnlinja er den samme på og utenfor, og summen per lokasjon står, så kalibreringen står. Hvorfor: flåten fisker der fisken står; i dag tar den tre ganger så mye på feltet uten at fisken står tettere der, og det er det som gjør feltet dårligere.
- B: ×2 for begge. Mildere: spilleren som stoler på feltet, får rundt det dobbelte.
- C: ingen vekt i fisket. Flåtens ×3 tas bort, så feltet blir nøytralt, og navnene er bare navn.

**V2. Hvilke felt teller, og når** (F1 og F2)
- **A (anbefalt):** artene og månedene fiskerne oppga til Fiskeridirektoratet (3 423 felt har en sesong); et felt uten art teller for juksaartene hele året. Hvorfor: et skreifelt i januar–april er ikke et torskefelt i juli, og «feltet er i sesong nå» er noe å gjøre i dag og denne uka.
- B: alle felt for alle arter hele året. Enklere, men et rekefelt blir et torskefelt, og sesongen forsvinner.

**V3. Hullet i Øst-Finnmark** (F1 og F5)
- **A (anbefalt):** gyteområdene (1 645) og oppvekst- og beiteområdene (446) fra samme WFS inn som navn, uten vekt og uten flåtetrykk. Øst-Finnmark går fra 8,4 til rundt 14,5 navn innen 20 km av et mottak (før sammenslåing). Hvorfor: samme eier, samme lisens og de samme intervjuene, og alle har navn; de får ikke vekt fordi noen gytefelt er stengt i gytetida (regelmotoren, Ø10).
- B: A, og Kartverkets stedsnavn for banker, grunner og fiskeplasser i sjøen der det fortsatt er tynt (F5). Krever at `api.kartverket.no` åpnes i miljøet.
- C: la hullet stå. Varmekartet og ekkoloddet virker uten navn.

**V4. Etikettene** (F4)
- **A (anbefalt):** feltene i sesong for redskapet om bord først, så de største; tettheten etter skjermflaten slik F4 måler den; et trykk på navnet viser artene, redskapet og månedene med kilden. Hvorfor: da blir navnene et verktøy i stedet for støy (Jonas 02.11.2026).
- B: som i dag; bare målt og taket justert.
- C: feltnavnene først fra `view.z ≥ 2`.

**Avgjort i planen** (Jonas kan si fra):
- Senjas seks felt står som de er, og teller som felt i snittet per lokasjon (F2).
- Vekten følger art og måned, ikke redskap: `density` er den ene kilden for fisk og vet ikke om redskap (det tar `SELQ` og `gearVertF` etterpå). Redskapet brukes i kortet (F4) og i havflåtens trykk på de aktive feltene, som i dag.
- Tekstene i F3 bruker bare fiskeplassene, ikke gyteområdene.
- «Brukere» og merknadene leses aldri.

## 6. Det som er antatt eller usikkert

- **Alderen på dataene:** de fleste feltene er registrert 1988–2012, og noen beskriver et fiske som er borte (merknaden «Regulert bort i 2001»). Planen leser ikke merknadene, og regelmotoren avgjør hva som er stengt.
- **«Januar–desember»** kan like gjerne bety at sesongen ikke ble oppgitt som at feltet brukes hele året (5 141 linjer har januar–desember, 1 209 har ingen måned).
- **Dekningen** viser hvor fiskerne ble intervjuet (opphav: fiskarlag, lokale fiskere), ikke hvor fisken står. Lokasjoner uten felt mister ingenting med F2, men i en lokasjon med felt får sjøen utenfor dem litt mindre: 1 / (1 + (W − 1) × a), der a er andelen av lokasjonens sjø som er felt.
- **×3** er et anslag, som `TRK.groundW` er i dag (backloggen 10.5 «B3 må ses i spillet»).
- **Finnmarks felt** har bare torsk, sei og hyse; kveita, lyren og de dype artene får ingen feltvekt der.
- **Tabellen i 2.5** er grovt delt etter breddegrad og regnet per mottak, så steder med mange mottak teller mer.
- **Tettheten i 2.7** er regnet, ikke målt, og ingenting er sett på Pad 3.
- **Kartverket** er ikke sjekket herfra (403).

## 7. Det planen ikke gjør

- Ingen sirkler eller flater i kartet (Jonas 28.10.2026).
- Endrer ikke forholdet mellom lokasjonene (`fkAvail`, sluttsedlene), bare hvor fisken står innen lokasjonen.
- Ingen nye arter, redskap eller felt utenfor rammen, og ingen feltoppdrag (Oppdrag 2 kan bruke feltene senere).
- Bruker ikke Havforskningsinstituttets gytefelt for kysttorsk i fisket, og endrer ingen regler; de stengte gytefeltene hører til Ø10.
- Rører ikke havflåtens felt utover at fisken følger samme vekt.
- Ingen push.

## 8. Status

- 07.11.2026: planen skrevet (Jonas' økt, gren `ccr-5a96a95a-wu5hvn`; bare dokumenter). Målingene i 2.3, 2.4 og 2.5 ble gjort i økta (enhetstestenes laster og WFS-en uten polygoner); ingenting i `src/` eller `tests/` er endret. Fasene står i køen som 31a–31e med `venter på valg`. Venter på V1–V4.
