# Kartlegging: arter, redskap, utstyrsmodeller og båtene i Det Store Blå

Gjennomgang av spillet slik det står på arbeidsgrenen `ccr-5e1ba2f4-pusvyd` (commit `c551b24`, 30.10.2026).
Målet er høyest mulig realisme, og at det blir enklere å lage nye båtmodeller og nytt løst eller
oppgraderbart utstyr. Dokumentet hører sammen med [planlisten for fiskefartøy](planliste-fiskefartoy.md),
og ID-er derfra (for eksempel `FRM-01`) brukes der det passer.

**Slik er det gjort:** lest `CLAUDE.md`, `docs/INDEKS.md`, systemdokumentene for redskap, båter og 3D,
`docs/batplan.md`, `docs/spesifikasjon.md`, planen for lover og regler (grenen
`claude/game-laws-regulations-uu63ec`), `core/02-species-gear.js`, `core/10-gear.js`, 3D-koden for redskap og
dekk (`view3d/09`, `10`, `12`, `13`) og alle Blender-skriptene i `tools/boats`, `tools/gear`, `tools/deck` og
`tools/fish`. Alle båtmodellene og utstyrsmodellene er lest ut av GLB-filene (deler, trekanter, festepunkter).
Spillet er bygd og kjørt, og hver båt er fotografert i spillets egen 3D fra flere vinkler. Utstyrsmodellene er
tegnet med en enkel egen renderer.

---

## 1. Sammendrag

- **Arter:** ni fiskearter og kongekrabbe. Torsken har to bestander (kysttorsk hele året og skrei i
  januar–april). Havfartøyene i spillet er bygd for arter som ikke finnes ennå (sild, makrell, kolmule og
  snøkrabbe).
- **Redskap som kan brukes:** juksa (håndjuksa, juksamaskin og kveitepilk), line (hyseline og bankline), garn
  (torskegarn, flytegarn og blåkveitegarn) og teiner (kongekrabbeteine). Trål, ringnot og autoline finnes bare
  som modeller og animasjoner.
- **Utstyrsmodeller som kan gjenbrukes:** 11 Blender-filer med til sammen rundt 80 deler. Halere, juksamaskin,
  teine med teinehaler og krabbekar, blåse og dregg, kar, sløyebord, stamper, garn, kran, ankre, radar, livbøyer
  og flåter står allerede på festepunkter i båtene. Det fungerer, men bare på de ti kystbåtene.
- **Det som hindrer gjenbruk:**
  - Havbåtene har ingen festepunkter for utstyr.
  - Haleren har ett festepunkt uten retning, og det er alltid på styrbord side.
  - Plassene til juksamaskinene finnes ved å lete i skrogets punkter, og det tegnes høyst tre.
  - Hver ny utstyrstype trenger sin egen tegnekode.
  - Dører, lanterner, ankervinsjer, propeller, ror og annet beslag er skrevet på nytt i hvert båtskript
    (døra finnes i sju utgaver, `underwater` i ti).
- **Kvaliteten på båtene:** profilene og proporsjonene er gode på kystbåtene (målt fra tegninger), men
  overflatene er flate og rene. Modellene har bare punktfarger, ingen teksturer, ingen normal maps og få
  trekanter (7–26 k på båter under 22 m, 14–17 k på havbåtene på 45–75 m). Havbåtene er klart svakest. Den
  største feilen i grafikken er at ingenting har materialstruktur (sveis, plater, antisklimaling, rust i renner).
- **De alvorligste feilene** (kap. 6): snøkrabbefartøyet har tomt teinedekk (M1), og ringnotbåten mangler
  nesten alt ringnotutstyr (M2). Kystbåtene og havbåtene har store, helt flate flater og kasseformede hekker
  (M3, M4). Registreringsmerket blir skjevt eller uleselig (M6). Det spilleren eier, vises ofte ikke i riktig
  antall (D2–D5). Til sammen er 18 modellfeil, 9 feil mellom data og modell og 6 svake løsninger i koden
  ført opp.
- **Viktigste forslag:**
  1. En standard for festepunkter med type, side og størrelse, og et felles register over utstyrsmodeller.
  2. Et felles bibliotek for beslag i Blender-skriptene (`fittings.py`).
  3. En ny pakke med utstyrsmodeller (kap. 4).
  4. Et materialløft med teksturer for detaljer som sveis, rust og plater.
  5. Havbåtene løftes til samme nivå som kystbåtene.

---

## 2. Artene og redskapet som tar dem

### 2.1 Artene i spillet

Kilde: `SPECIES` i `core/02-species-gear.js`. «Mengde» er artens grunnrate (`base`) mot torsken (1,0).
Dybden er der arten står tettest (`dep`).

| Art (nøkkel) | Mengde | Dybde | Typisk størrelse | Minstemål i spillet | Merknad |
|---|---|---|---|---|---|
| Torsk (`torsk`): kysttorsk og skrei | 1,0 | 70 m | 2 kg, skrei 5 kg | 0,8 kg | Skreien kommer i tillegg i januar–april, samlet på gytefeltene |
| Hyse (`hyse`) | 0,55 | 110 m | 1,3 kg | 0,5 kg | Krokfanget over 1,1 kg får 12,8 % tillegg |
| Sei (`sei`) | 0,8 | 45 m | 2 kg | 0,35 kg | Toppen er i januar og mai |
| Lyr (`lyr`) | 0,12 | 40 m | 2,2 kg | 0,5 kg | |
| Lange (`lange`) | 0,18 | 250 m | 4 kg | 0,8 kg | |
| Brosme (`brosme`) | 0,2 | 220 m | 2,2 kg | 0,5 kg | |
| Uer (`uer`) | 0,1 | 200 m | 1 kg | 0,3 kg | Direktefiske bare i juni–august (`uerOpen`) |
| Kveite (`kveite`) | 0,05 | 120 m | 12 kg | 7,2 kg | Fredet 20.12–20.4, slippes over 100 kg i spillet |
| Blåkveite (`blakveite`) | 0,5 | 700 m (eggakanten) | 2 kg | 0,9 kg | Eget bestandslag, nesten ingen på juksa |
| Kongekrabbe (`krabbe`) | 0,6 | 80 m | 1,5 kg | ingen | Bare teiner, leveres levende, mest øst i Finnmark (`kingArea`) |

### 2.2 Redskapene i spillet

| Redskap | Varianter | Krever om bord | Kilde i koden |
|---|---|---|---|
| Juksa | Håndjuksa med pilk og fire markkroker (følger båten), juksamaskin (34 000 kr, opptil `jukseMax` per båt), kveiteutstyr med kveitepilk (2 490 kr) | Ingenting. En person passer tre maskiner | `PRICE.gear`, `EQUIP.jukse`, `PRICE.kgear`, `jigTake` |
| Line | Hyseline (600 kroker per stamp), bankline (300 kroker per stamp), sju slag agn | Linehaler (ellers sakte for hånd) | `LINE_KINDS`, `BAITS`, `GEAR.line` |
| Garn | Torskegarn 156, 180 og 200 mm; flytegarn 156 og 180 mm; blåkveitegarn 360 mm | Garnhaler (fra 7,5 m), to om bord | `NETTY`, `NETOPT`, `GEAR.garn` |
| Teiner | Kongekrabbeteine (1,55 × 1,45 × 1,07 m, 40 krabber) | Teinehaler. Krabbekar for å holde krabben levende | `POTS`, `EQUIP.teinehaler`, `EQUIP.krabbekar` |
| Havredskap | Bunntrål, pelagisk trål, ringnot, autoline, snøkrabbeteiner | Låst til havfeltene kommer | Bare modeller og animasjoner (`TRAWL`, `SEINE`) |

Båten rigges for én av juksa, line, garn eller teiner om gangen (`RIGS`, `rigSet`).

### 2.3 Hvilket redskap tar hvilken art

Tallene er fangstevnen mot vanlig juksa (`SELQ` og `jigTake`). Høyere er bedre. Kveitepilken gir kveita
4,8–12,6 ganger vanlig juksa (mest rundt strømstille), og alle andre arter 0,2. Den virker ikke i fredningstida.

| Art | Juksa | Kveitepilk | Torskegarn | Flytegarn | Blåkveitegarn | Hyseline | Bankline | Teine | Beste redskap |
|---|---|---|---|---|---|---|---|---|---|
| Torsk | 1 | 0,2 | 1,0 | 0,5 | 0,2 | 0,7 | 0,8 | 0,01 | Juksa og torskegarn |
| Hyse | 1 | 0,2 | 0,45 | 0,12 | 0,02 | **2,6** | 0,8 | – | Hyseline |
| Sei | 1 | 0,2 | 0,7 | **2,4** | 0,1 | 0,15 | 0,1 | – | Flytegarn, juksa |
| Lyr | 1 | 0,2 | 0,6 | 0,1 | 0 | 0,2 | 0,15 | – | Juksa |
| Lange | 1 | 0,2 | 0,35 | 0 | 0,7 | 0,8 | **2,4** | – | Bankline |
| Brosme | 1 | 0,2 | 0,25 | 0 | 0,4 | 1,0 | **2,8** | 0,01 | Bankline |
| Uer | 1 | 0,2 | 0,3 | 0,1 | 0,2 | 0,3 | 0,4 | – | Juksa (i juni–august) |
| Kveite | 1 | **4,8–12,6** | 0,35 | 0 | 3,5 | 0,6 | 1,8 | – | Kveitepilk, blåkveitegarn |
| Blåkveite | 0,03 | ≈0 | 3,2 | 0 | **5,5** | 2,5 | 5,0 | – | Blåkveitegarn, bankline |
| Kongekrabbe | – | – | – | – | – | – | – | **alt** | Teine |

Agnet styrer arten innenfor linetypen og teinene. Makrell er bra på sei og blåkveite, reke på torsk, sild og
lodde på hyse, blekksprut på lange og brosme, krill på uer, og sei på kveite og krabbe (`BAITS`).

### 2.4 Arter som mangler for det som er bygd

| Fartøy eller plan | Arter det er bygd for | Status |
|---|---|---|
| Ringnot og pelagisk tråler (`pelagisk`) | Sild, makrell, kolmule | Finnes ikke som art |
| Snøkrabbefartøy (`snokrabbe`) | Snøkrabbe | Finnes ikke som art (bare kongekrabbe) |
| Bunntråler (`bunntral`) | Torsk, hyse, sei, uer | Finnes, men trålen fisker ikke |
| Spesifikasjonen, garn | Rognkjeks, breiflabb | Planlagt, ikke bygd |
| Vanlig bifangst på line i nord | Steinbit, flekksteinbit, skate | Ikke med (forslag) |

---

## 3. Utstyrsmodellene som finnes

### 3.1 Løse modeller som kan settes på flere båter

Hver fil er en GLB med deler som spillet henter med `glbPart` eller `kit(f, del)`. «Trek.» er trekanter i
den største delen.

| Fil og skript | Deler | Trek. | Brukes i dag | Kan gjenbrukes på | Kvalitet (sett i bildene) |
|---|---|---|---|---|---|
| `haul-garn` (`tools/gear/haler.py`) | Garnhaler: ramme, skive, avtaker | 1 400 | Båter over 7,5 m, på styrbord rekke | Alle med garnrigg | Middels. Skiva er god. Ramme og renne er flate plater, og hydraulikkmotoren synes nesten ikke |
| `haul-line` (samme) | Linehaler: ramme, skive, avtaker | 1 100 | Båter over 7,5 m | Alle med linerigg | Middels til svak. Blokkete, og føringsrullene er bokser |
| `gear-jig` (`juksamaskin.py`) | Maskin, spole, skive | 3 600 | Alle båter, høyst tre på rekka | Alle | God. Gjenkjennelig form, display og kabel |
| `gear-pot` (`teine.py`) | Teine, luke, teinehaler på davit, skive, krabbekar | 1 600 | Teinerigg, under setting og trekking | Alle med teinerigg | Teina er god. Daviten er tynn og enkel, og krabbekaret har bare 284 trekanter |
| `gear-marks` (`blaase.py`) | Blåse med stake, flagg og radarreflektor, dregg | 560 | Alle sett i sjøen | Alle | Grei på avstand |
| `deck-fish` (`tools/deck/fisk.py`) | Kar 300, 460 og 1000 l, blodvann, is, høtt, kniv, sløyebord i plast, sløyebenk i stål, bøtte | 3 000 | Alle båter | Alle | God |
| `deck-rig` (`rigg.py`) | Stamp, line i rødt og grønt, kroker, garnhaug, garnkant, trekasse, EUR-pall | 7 000 | Rigget båt, dekkslast | Alle | God |
| `deck-crane` (`kran.py`) | Sammenleggbar knekkbomkran i 14 deler, med stillinger | 1 800 | hurtigsjark, sjarkny, kyst15, kyst21 | Alle med kran | **Beste utstyrsmodell.** Ledd, sylindre, slanger og bomstøtte |
| `deck-anchor` (`anker.py`) | Plogankre, Hall-anker, kjettingledd med og uten stag | 1 100 | Alle båter | Alle | God |
| `deck-safety` (`sikker.py`) | Radarkuppel, åpen radar 4 og 6 fot, livbøye med holder, lys og line, flåte 4, 6 og 12 i vugge | 3 200 | De ti kystbåtene | Alle | Flåtene og livbøyene er gode. Radarene er enkle, men riktige i form |
| `deck-pause` (`pause.py`) | Termos, krus, bryne, snus, lighter, sigarett, telefoner, kikkert, matpakke, kosthode, slangetrommel, torskehode | 1 400 | Mannskapet | Alle | God for formålet |
| `fish` (`tools/fish/fisk.py`) | Alle ti artene, 1 m lange | 1 600–2 600 | Fangst, kar, juksa | Alle | Grei. Kantete på nært hold |

### 3.2 Utstyr som er bygd inn i båtmodellene

Dette er «skipets egne systemer» etter Jonas' regel. Det kan ikke flyttes til en annen båt i dag, fordi det er
skrevet inn i hvert båtskript.

| Utstyr | Finnes i | Merknad |
|---|---|---|
| Tråldør, trålpose, trålrull | `tral60`, `not75` (egne deler: `door`, `codend`, `netroll`) | Samme geometri skrevet to ganger |
| Galge og A-ramme, trålvinsjer, nettrommel, hekkslipp | `tral60`, `not75`, `kyst21` | Per skript |
| Kraftblokk-kran, notbinge, snurpedavit | `not75` | Per skript |
| Haleport og halestasjon | `al45`, `hurtig11`, `malo36`, `kyst15` | Skrog (riktig etter regelen) |
| Portal og transportbånd for teiner | `krabbe50` | Per skript |
| Havbåtenes kraner, MOB-båter, radarer, flåter og livbøyer | `al45`, `krabbe50`, `tral60`, `not75` | Bakt inn. Ingen festepunkter for utstyr (`kit` er tom) |
| Lastebom og støttesegl | `havsjark35`, `kyst21` | Per skript |
| Dører (sju utgaver), lanterner (tre utgaver), navnefelt (elleve), ankervinsj og baugrulle, ror og propell (`underwater`, ti utgaver), slitasje (`wear`, fire utgaver) | De fleste skriptene | Samme ting skrevet om igjen, med små forskjeller |
| Påhengsmotor 60 hk | `skiff59` (egen del `outboard`) | Den eneste. Påhengsmotoren på 90 hk har ingen egen modell |

### 3.3 Utstyr som tegnes i koden i stedet for i Blender

- **Håndjuksa (juksavinde)** med ramme, rulle, trommel og sveiv (`view3d/12-skiff.js`).
- **Haler på båter under 7,5 m** (skiff og trebåt): en trommel på en stolpe (`GB.haul`).
- **Reservemodeller** for teine, garnbinge og linestamp når GLB-en mangler (`buildGear`).
- **Lina, garnet, flottørene og snørene** som går over haleren og under setting.

---

## 4. Utstyrsmodeller som mangler

Sortert etter hvor mye de synes og hvor mange båter som kan bruke dem.

### 4.1 Utstyr spilleren bruker i dag (bør lages først)

| Modell | Hvorfor | Brukes på |
|---|---|---|
| **Liten elektrisk line- og teinehaler** for åpne båter | Skiffen og trebåten får i dag en grå trommel på en stolpe | skiff, trebat, snekke |
| **Håndjuksa (juksavinde) med pilk og markkroker** | Tegnes i koden. Det er det første redskapet alle spillere ser | Alle |
| **Kveiteutstyr:** stor kveitepilk, kraftig snøre og gaff | Kjøpes, men synes ikke | Alle |
| **Teinestabel om bord** (teinene surret på dekk) | Teinene vises bare mens de settes eller trekkes. En båt rigget for teiner har tomt dekk i havn | Alle med teinerigg |
| **Flere garnbinger eller garnkasser** | Én garnhaug i ett 1000-literskar uansett om båten har 6 eller 240 garn | snekke og større |
| **Flere stamper og stampestativ** | Høyst åtte stamper tegnes, mens båtene kan ha 33 | sjark og større |
| **Påhengsmotor 90 hk** | Kjøpes (`motor90`), men skiffen viser samme 60 hk-motor | skiff |
| **Antenner som utstyr:** VHF-pisk, AIS- og GPS-sopp | VHF og AIS kjøpes, men synes ikke. De bør stå på et festepunkt som radaren | Alle med styrhus |
| **Skjermer i konsollen:** kartplotter, ekkolodd og CHIRP, sonar | Kjøpt elektronikk synes ikke i bro-visningen | Alle med styrhus |

### 4.2 Påbudt utstyr fra planen for lover og regler (L6a)

- Oppblåsbar redningsvest, båret av mannskapet.
- MOB-båt i vugge med davit (fra 45 m). Bør bli én felles modell som erstatter de innebygde i havbåtene.
- MOB-lys med røyk på brakett, koblet til livbøyen.

### 4.3 Felles beslag som bør bli løse modeller (i dag skrevet inn i hvert skript)

- **Ankervinsj:** to eller tre størrelser.
- **Pullerter og klyss:** doble pullerter, kryssholter, panamaklyss, rullklyss.
- **Lanterner og lyktehus:** typede (`port`, `stbd`, `stern`, `masthead`, `allround`) med farget glass.
- **Lyskaster og arbeidslys.**
- **Dører:** dør med karm, terskel, koøye og hengsel som egen del.
- **Leidere og trapper:** leider med ryggbøyle og trapp med rekkverk.
- **Rekkverk** som moduler: stolpe, vanger, fotlist.
- **Soppventiler, lufterør og eksosrør med regnhatt.**
- **Fendere og fenderlist.**
- **Propeller:** fast og vridbar (CPP) med 4 og 5 blader, nav, navhette og tauvern (`FRM-01`, `FRM-04`).
- **Ror:** flapror og balansert ror med rorhæl og inspeksjonsluke (`FRM-03`).
- **Dyse, thrustertunnel med rist og offeranoder** (`SKR-14`, `SKR-19`).
- **Slingrekjøl og lenseporter med klaff** (`SKR-07`, `SKR-11`).

### 4.4 Til havsteget (trengs når trål, not og autoline skal fiskes)

- Trålvinsj og nettrommel som moduler i flere størrelser.
- Tråldører: bunntråldør og pelagisk dør, med rust og slitt sko.
- Bobbins og rockhopper.
- Trål og ringnot som redskap i sjøen.
- Fiskepumpe med sugeslange og slangetrommel.
- Kraftblokk med nottrakt (`RNG-01`, `RNG-15`).
- Snurrevad: tauspoler og vod.
- Snøkrabbeteiner (koniske).

---

## 5. Båtene i spillet

### 5.1 Oversikt

Tallene er lest ut av GLB-filene. `lod0` er nærmodellen og `lod1` avstandsmodellen.

| Type | Skript | Lengde | lod0 / lod1 (trek.) | Fil | Festepunkter for utstyr (`kit`) |
|---|---|---|---|---|---|
| `skiff` | `skiff59.py` | 5,9 m | 11 190 / 990 | 404 KB | bøyer 2, kar 1, garn, stamper, last 1 |
| `trebat` | `snekke23.py` | 7,0 m | 17 906 / 1 416 | 853 KB | bøyer 2, garn, stamper, last 1 |
| `snekke` | `snekke26.py` | 7,9 m | 10 332 / 1 589 | 412 KB | flåte 1, bøyer 2, radar, kar 1, garn, stamper, last 1 |
| `plastsjark` | `plast31.py` | 9,45 m | 6 961 / 2 405 | 319 KB | flåte 1, bøyer 2, radar, garn, stamper, last 2 |
| `sjark` (målestokken) | `havsjark35.py` | 10,57 m | 26 074 / 2 663 | 902 KB | flåte 1, bøyer 2, radar, åpen radar, garn, stamper, last 2 |
| `hurtigsjark` | `hurtig11.py` | 10,99 m | 9 971 / 3 000 | 415 KB | som over, last 1, kran |
| `sjarkny` | `hs11.py` | 10,99 m | 8 009 / 3 431 | 384 KB | som over, last 2, kran |
| `breisjark` | `malo36.py` | 10,99 m | 25 133 / 2 815 | 842 KB | flåte 1, bøyer 2, radar, åpen radar, garn, stamper, last 2 |
| `kyst15` | `kyst15.py` | 14,99 m | 11 110 / 3 670 | 486 KB | flåte 2, bøyer 4, åpen radar, garn, stamper, last 6, kran |
| `kyst21` | `kyst21.py` | 21 m | 10 564 / 3 793 | 457 KB | flåte 2, bøyer 4, åpen radar, garn, stamper, last 5, kran |
| `autoliner` | `al45.py` | 45,4 m | 14 970 / 3 377 | 526 KB | ingen |
| `snokrabbe` | `krabbe50.py` | 50 m | 15 343 / 3 943 | 561 KB | ingen |
| `bunntral` | `tral60.py` | 60,3 m | 13 836 / 5 502 | 653 KB | ingen |
| `pelagisk` | `not75.py` | 75 m | 16 685 / 5 271 | 699 KB | ingen |
| (redningsskøyte, NPC) | `redning.py` | – | 2 129 | 55 KB | – |

### 5.2 Slik er båtene laget

- **Skript, aldri for hånd.** Hver båt er et Python-skript som kjører Blender som modul (`bpy 4.5.4`).
  Linjene er målt fra en tegning eller et bilde (tabeller med kjøl, stevn, ripe, halvbredder og hus), og et
  overlegg sjekker modellen mot tegningen. Felles verktøy ligger i `tools/boats/bpyutil.py`
  (primitiver, skrogflater, baking, eksport).
- **Eksporten** (`export_boat`) skriver `lod0`, glass og `lod1`, eventuelt flere deler (motor, propell,
  rorkult, tråldør). Posisjonene lagres som 16-bits heltall, og normaler og farger som bytes.
- **Fargene er punktfarger.** Det finnes ingen UV-er, teksturer, normal maps eller roughness-kart.
  Alfakanalen er glans, skyggen er bakt med Cycles inn i punktfargen, og slitasjen er en mørking per punkt
  (`TINT`). Malingssonene 1–4 (skrog, stripe, overbygg, dekk) ligger i `_PAINT`, så Malerverkstedet kan male om.
- **Festepunktene** (`anchors` i GLB-ens `extras`) gir spillet øye, ratt, mannskapsplasser, dekk,
  lanterner med type, dører, navnefelt, haleren, arbeidsplassen og utstyrsplassene i `kit`.
- **I spillet** henter `glbModel` og `buildVesselModel` modellen første gang typen vises. NPC-båtene i samme
  størrelse bruker samme modell med fargedrakter (nærmodell innenfor 150–300 m). Navn og registreringsmerke
  tegnes som tekstur på navnefeltene. Utstyret spilleren eier, tegnes på festepunktene
  (`view3d/09-landing-deck.js`, `10-gear.js`).

### 5.3 Slik ser de ut i spillet

Bildene er tatt i spillets egen 3D (bygget fra arbeidsgrenen, Senja, uten mannskap om bord) fra to vinkler per
båt. Lyset skiftet fra kveld til natt underveis, så noen båter er sett i mørke. Skiffen kom ikke med i
bilderunden. Den er vurdert fra sidebildet i Båthandelen. Oversiktsbildet ligger i
[`bilder/baatene-i-spillet-2026-10-30.jpg`](bilder/baatene-i-spillet-2026-10-30.jpg).

| Båt | Helhet | Det som er bra | Det som trekker ned (se 6.1) |
|---|---|---|---|
| `trebat` (snekke23) | **God** | Klinkbord, slitt tre, tofter, motorkasse, rorkult, lanterner og livbøye. Slitasjen er overbevisende | Håndjuksa tegnes i koden |
| `snekke` (snekke26) | **God** | Støpte klinkbord, marineblått bånd, hardtopp, cockpit med kar og bord, badeleider | M13, M17 |
| `plastsjark` (plast31) | **Svak** | Riktig profil og fargebånd, lenseporter, lanterner på riktig side | M10, M13. Lavest detalj av alle (6 961 trek.) |
| `sjark` (havsjark35) | **God** (målestokken) | Spring og striper, rigg med vaiere, lastebom, styrhus | M5, M6, M14. Redskapsrommet akter er en glatt kasse |
| `hurtigsjark` (hurtig11) | **Middels** | Gjenkjennelig knekkspantskrog, fartsstriper, mast med stag, kran på riktig plass | M3, M11. Takvisiret er en tykk massiv plate |
| `sjarkny` (hs11) | **Middels** | Styrhus med interiør, dører, kran, sløyebord | M3, M6, M14 |
| `breisjark` (malo36) | **Middels til god** | Rigg, galge, ly og styrhus med panoramavinduer | M3. Store flate sider og skanse |
| `kyst15` | **Svak til middels** | Shelterdekk, halestasjon, anker i klyss | M3, M4, M5, M6, M14 |
| `kyst21` | **God karakter, middels detalj** | Rundgatt, teakstyrhus, skorstein, master og bom i 70-tallsfarger | M12, M16, M6 |
| `autoliner` (al45) | **Svak** | Riktige hovedmål og plassering av overbygg | M3, M4, M6, M8, M14 |
| `snokrabbe` (krabbe50) | **Svak** | Portal og MOB-båt | **M1**, M3, M4, M14 |
| `bunntral` (tral60) | **Middels** | Hekkslipp, galge, A-ramme, nettrommel, tråldører og MOB-båt er på plass | M7, M9, M3, M6 |
| `pelagisk` (not75) | **Svak** | Notbinge, trålrull og overbygg midtskips | **M2**, M3, M6, M8, M9 |
| `skiff` (skiff59) | God (fra sidebildet) | Bygd etter GA, egen påhengsmotor | D6 (samme motor for 60 og 90 hk) |

**Samlet:** de åpne småbåtene og havsjarken holder et godt nivå. Sjarkene på 10–11 m og kystbåtene er
gjenkjennelige, men flate. Havbåtene er langt under nivået i planlisten og i referansebildene (Sulebas,
Trønderhav, Quantus).

---

## 6. Feil, svake løsninger og ting å unngå

Katalogen under er det Jonas ba om: feil og dårlige løsninger, så de ikke gjentas i nye modeller.
**Alvor:** H = synlig feil eller brudd med virkeligheten · M = svekker realismen tydelig · L = detalj.

### 6.1 Feil i modellene

Funnet i bildene fra spillet og i skriptene. «T» betyr tolket fra bildet, ikke bekreftet i koden.

| # | Funn | Alvor | Båter | Tiltak (planliste-ID) |
|---|---|---|---|---|
| M1 | Teinedekket på snøkrabbefartøyet er tomt, uten en eneste teine, på en båt med plass til 7 000 | H | snokrabbe | Stabler av koniske snøkrabbeteiner (TEI-01) |
| M2 | Ringnotbåten mangler nesten alt ringnotutstyr: nottrakt, hengende kraftblokk (bare en gul klump på en tynn bom), sidehaler, pumpe og sugeslange, notgjerde | H | pelagisk | Løftes etter Sulebas-eksemplet (RNG-01–15) |
| M3 | Store, helt flate skrogsider og vegger uten plateskjøter, lister, lenseporter eller beslag | M | kyst15, sjarkny, breisjark, hurtigsjark, autoliner, snokrabbe, bunntral, pelagisk | SKR-09–11, SKR-16, SKR-22 og materialløftet |
| M4 | Kasseform: rett hekk med skarpe hjørner og et flatt, tomt speil | M | kyst15, autoliner, snokrabbe | Avrundede hjørner, og speil med navn, lys, leider og fendere (SKR-05, IDN-02) |
| M5 | Støttesegl som stiv, ensfarget plate uten form, som også står oppe i havn | M | sjark, kyst15 | Seil med bue, kanter og lik, som kan rulles (SJK-11) |
| M6 | Registreringsmerket blir skjevt (ser kursivt ut) på båter med skrå stevn, fordi feltet følger skrogets linjer (skriften er rett Arial Narrow). På de store båtene er det lite og nesten uleselig, og lys tekst på mørkt skrog blir svak i skumring | M | skjevt: sjark, hurtigsjark, snekke. Lite: kyst15, autoliner, bunntral, pelagisk | Loddrette bokstaver og bokstavhøyde etter forskriften. Sjekk lesbarheten i skumring (IDN-01) |
| M7 | Bulben stikker opp av vannet som en spiss, rød kjegle foran baugen | M | bunntral | Rundere bulb, og sjekk vannlinja mot dypgangen (SKR-04) |
| M8 | Mastene er glatte svarte rør (ringnotbåten) eller en massiv kile (formasta på autolineren) | M | pelagisk, autoliner | Mast med plattformer, rå, leidere, lanterner og antenner (MST-01, MST-02) |
| M9 | Tråldørene er flate plater med striper | M | bunntral, pelagisk | Krum dør med ramme, sko, sjakler og slitasje (PTR-04, BTR-03) |
| M10 | Plastsjarkens styrhus har matte sidevinduer som ser ut som plater, og et tykt, flatt tak | M | plastsjark | Glass med karm og refleks, takskjerm (OVB-03, OVB-05) |
| M11 | Mørke, utflytende flekker på skrogsiden, trolig bakt skygge på store trekanter (T) | M | hurtigsjark | Flere punkter der skyggen bakes, eller skyggen som tekstur |
| M12 | Stålskrogene er helt glatte, uten buler, sveis eller plateskjøter, også på 1978-båten | M | kyst21, havbåtene | SKR-09, EPO-02 |
| M13 | Baugrulle og anker er en grå kloss foran stevnen | L | snekke, plastsjark | Stevnbeslag og baugrulle fra biblioteket (FOR-07) |
| M14 | Dekkene er tomme ovenfra: ingen tau, fendere eller kasser når båten ikke fisker | M | sjark, sjarkny, kyst15, havbåtene | DKS-12, OVB-13 |
| M15 | Undervannsskroget er forenklet. Propellbladene er flate plater uten vridning, og ingen har CPP-nav. Bare havsjark35 og malo36 har anoder, og bare hs11 har slingrekjøl. 8 av 14 skript har ikke lenseporter | M | alle | FRM-01–04, SKR-07, SKR-11, SKR-19 |
| M16 | Den samme moderne knekkbomkranen står på 1978-båten som på de nye | L | kyst21 | Krantype eller lastebom etter båtens år (KRN-09, EPO) |
| M17 | Flåtebeholderen på hardtoppen virker stor for snekka (T) | L | snekke | Sjekk mot målene for en firemannsflåte |
| M18 | Utstyret: linehaleren og teinedaviten er blokkete og tynne, krabbekaret svært enkelt (284 trekanter), fiskene kantete på nært hold | L | utstyr | Løftes når de flyttes til de nye festepunktene (U4) |
| M19 | De akterste topplanternene står for lavt over den forre: 2,0 m på snøkrabbefartøyet og 0,9 m på autolineren. COLREG vedlegg I 2(a)(ii) krever minst 4,5 m når båten fører to (påbudt fra 50 m, regel 23(a)(ii)). Funnet og rettet 30.10.2026 | M | snokrabbe, autoliner | Akterste mast eller stang høy nok, og regelen sjekket for hver ny havbåt (MST-04) |
| M20 | Kjølen på 15-meteren hang løst under skroget akter (en kasse fra 0 til 0,9 m under et skrog som går opp til 1,3 m), og propellbladene gikk gjennom den. Funnet og rettet 30.10.2026: dødved opp til skroget, propellåpning over en sko | M | kyst15 | Se undervannsskroget fra siden og nedenfra i kontrollbildene; propellen skal ha klaring i en åpning (FRM-01, SKR-07) |

### 6.2 Feil mellom data og modell

| # | Funn | Alvor | Hvor |
|---|---|---|---|
| D1 | Kongekrabbeteina er 1,55 × 1,45 × 1,07 m i dataene (`POTS`, plassregnestykket), men 1,4 × 1,4 × 0,65 m i modellen | M | `core/10-gear.js`, `tools/gear/teine.py` |
| D2 | Båtene kan ha opptil 8 juksamaskiner (`jukseMax`), men høyst 3 tegnes (`Math.min(3, …)`) | M | `view3d/13-instruments.js` |
| D3 | Båtene kan ha opptil 33 stamper, men høyst 8 tegnes (4 under 8 m) | M | `drawLineTubs` |
| D4 | Garnet vises som én garnhaug i ett 1000-literskar, uansett om det er 6 eller 240 garn | M | `drawRigRest`, `drawNetTub` |
| D5 | Teinene om bord vises ikke når båten er rigget for teiner, bare under setting og trekking | M | `drawPots` er eneste sted teinene tegnes |
| D6 | Påhengsmotoren på 90 hk har ingen egen modell | L | `EQUIP.motor90`, `skiff59.py` |
| D7 | VHF, AIS, kartplotter, CHIRP og sonar kjøpes, men synes ikke (radaren gjør det) | M | `EQUIP` |
| D8 | Testen `vessel3d.py` setter et tak på 120 000 punkter (rundt 40 000 trekanter), mens båtplanen (B17) sier 80 000–250 000 trekanter. Planen kan ikke følges uten at testen endres | M | `tests/vessel3d.py`, `docs/batplan.md` |
| D9 | Havbåtene har ingen festepunkter for utstyr (`kit` er tom). Alt er bakt inn, så det kan ikke oppgraderes eller byttes | H (for framtida) | `al45`, `krabbe50`, `tral60`, `not75` |

### 6.3 Svake løsninger i koden og rørledningen

| # | Funn | Følge | Bedre løsning |
|---|---|---|---|
| K1 | Haleren har ett festepunkt `[x, y, z]` uten retning eller side, og koden antar styrbord | Haler på babord eller to haleplasser (`stations.hauler` = 2) kan ikke vises riktig | Typede plasser med retning og side (kap. 7) |
| K2 | Plassene til juksamaskinene finnes ved å lete gjennom skrogets punkter etter ripa (`jigRail`) | Avhenger av mesh-tettheten, gir rare plasser og bare tre | Faste festepunkter `rail` i modellen |
| K3 | Hver utstyrstype har egen tegnekode (`drawSafety`, `drawCrane`, `drawCargo`, `drawRigRest` …) | En ny type utstyr krever kode i 3D-motoren | Ett register over modeller og plasser, og én tegnefunksjon |
| K4 | Beslag skrevet på nytt i hvert båtskript (dør ×7, `underwater` ×10, navnefelt ×11, `wear` ×4) | Ulik kvalitet, feil rettes ett sted av gangen, nye båter tar lang tid | `tools/boats/fittings.py` |
| K5 | Bare punktfarger: slitasje, rust og skygge følger punktene | Store flater uten punkter blir rene og flate, og slitasjen blir flekkete | Teksturer for detaljene (kap. 7.4) |
| K6 | Testbudsjettet styrer detaljnivået (se D8) | Modellene holdes enkle av en test, ikke av ytelsen | Mål ytelsen på nettbrettet og sett budsjettet etter det |

### 6.4 Huskeregler for nye modeller

Reglene under kommer av funnene over. De bør inn i `/blender`-skillen og i båtplanens huskeregel (`docs/batplan.md`
del 7).

1. **Mål og data skal stemme.** Et mål som står i dataene (teina, haleren, båtens lengde og bredde), skal være
   det samme i modellen, og en test sjekker det.
2. **Det som kjøpes, skal synes,** med mindre det står på lista over det som oppbevares inne (planen for lover og
   regler, L6).
3. **Antallet i dataene skal synes.** Har båten 30 teiner eller 8 juksamaskiner, vises 30 teiner (i stabel) og 8
   maskiner, eller en regel som er skrevet ned for hvordan mange vises.
4. **Plasser er festepunkter, aldri søk i skroget.** Alt utstyr står på en typet plass med side og retning.
5. **Beslag hentes fra biblioteket.** Dører, lanterner, pullerter, leidere, propeller, ror og navnefelt skrives
   ikke på nytt i et båtskript.
6. **Sjekk formen mot foto, ikke bare mot tegning.** Tegningen gir målene, men bildet viser hvordan tingen ser ut,
   hva den er laget av og hvordan den er slitt.
7. **Ingen store flater uten detalj.** Del opp lange skrogsider og vegger med plateskjøter, lister, lenseporter,
   beslag og slitasje, også på havbåtene.
8. **Undervannsskroget er like viktig** som det over vannet: propell med nav, ror med hæl, anoder, dyse og
   thrustertunnel med rist.
9. **Havbåtene følger samme standard** som kystbåtene: plasser for utstyr, typede lanterner, navnefelt, soner
   og slitasje.
10. **Budsjettet settes av målinger,** ikke av en gammel grense i en test.
11. **Se modellen i spillet** i dagslys, i skumring og om natta, fra drone og fra dekk, før den leveres. Ta med
    kontrollbildene fra åtte vinkler.
12. **Tekst og merker står loddrett.** Registreringsmerke, navn og hjemhavn følger skrogets linjer i høyden, men
    bokstavene skjeves aldri med stevnen. Bokstavhøyden følger forskriften og lengden.
13. **Båten skal se ut som det den gjør.** En teinebåt har teiner på dekk, en ringnotbåt har kraftblokk,
    nottrakt og notgjerde, og en tråler har tunge dører. Sjekk typemodulen i planlisten før modellen leveres.
14. **Lanternene følger COLREG også i høyden.** To topplanterner står minst 4,5 m over hverandre, med den akterste
    høyest, og den forreste minst like høyt over skroget som båten er bred (vedlegg I 2(a)). Radarer og antenner står
    under eller ved siden av lanternen, aldri foran den i samme høyde.

---

## 7. Forslag: utstyrsbibliotek og festepunkter

Målet er at en ny utstyrsmodell kan lages én gang og vises på alle båter den passer på, uten ny kode i 3D-motoren,
og at en ny båt får alt utstyret gratis ved å ha de riktige plassene.

### 7.1 Typede festepunkter i båtmodellene

Erstatt de løse nøklene (`hauler`, `kit.radar`, `kit.garn` …) med en liste over plasser:

```json
"slots": [
  {"id": "haler1", "type": "haler", "side": "SB", "at": [2.04, 2.07, 0.20], "dir": [1, 0, 0], "up": [0, 1, 0],
   "mount": "rekke", "size": "M", "clear": [0.8, 2.0, 0.8]},
  {"id": "jig1", "type": "juksa", "side": "SB", "at": [2.1, 1.9, 1.5], "dir": [1, 0, 0], "mount": "rekke", "size": "S"},
  {"id": "ant1", "type": "antenne", "at": [0.3, 5.1, -1.0], "mount": "mast", "size": "S"},
  {"id": "kons1", "type": "skjerm", "at": [0.0, 1.6, -2.4], "dir": [0, 0, -1], "mount": "konsoll", "n": 3}
]
```

- **type:** haler, juksa, teinestabel, garnbinge, stamper, kar, flåte, bøye, radar, radarA, antenne, skjerm,
  lyskaster, kran, davit, motor, last.
- **side og dir** gir babord og styrbord og hvilken vei utstyret vender ut. Da kan haleren stå på babord og
  daviten vende riktig.
- **mount** (rekke, dekk, tak, mast, vegg, konsoll) avgjør hvilke modeller som kan stå der.
- **size** (S, M, L) velger variant etter båtstørrelse.
- **clear** er en boks som må være fri, så testen kan sjekke at utstyret ikke går gjennom skroget.

### 7.2 Kontrakt for en utstyrsmodell

Hver løse modell følger de samme reglene:

- Origo er i festepunktet (foten på dekk, klemma på rekka, foten av masta).
- Aksene er spillets: x ut fra senterlinja, y opp, z akter.
- Delene som beveger seg, har egne origo i dreiepunktet (skive, spole, bom).
- `extras` har `mount`, `size`, `footprint`, banen redskapet går (`path`), lysene og plassene til folk
  (`stand`).
- Det finnes `lod0` og `lod1`, og en enkel variant for NPC-båtene.
- Testen `kitcheck` (ny) leser alle modellene og sjekker kontrakten.

### 7.3 Register over modeller (data, ikke kode)

Én tabell i `core/` som kobler det spilleren eier til modell og plass:

```js
const GEARMODELS = {
  linehaler:  {glb: 'haul-line',  part: 'frame', slot: 'haler',  moving: ['sheave', 'stripper']},
  garnhaler:  {glb: 'haul-garn',  part: 'frame', slot: 'haler',  moving: ['sheave', 'stripper']},
  teinehaler: {glb: 'gear-pot',   part: 'davit', slot: 'haler',  moving: ['davitskive']},
  jukse:      {glb: 'gear-jig',   part: 'maskin', slot: 'juksa', count: 'S.equip.jukse', moving: ['spole', 'skive']},
  radar:      {glb: 'deck-safety', part: 'radome', slot: 'radar'},
  vhf:        {glb: 'deck-elec',  part: 'vhf_pisk', slot: 'antenne'},
  plotter:    {glb: 'deck-elec',  part: 'skjerm12', slot: 'skjerm'}
};
```

Et nytt kjøpbart utstyr blir da tre ting: modellen, én linje i `GEARMODELS` og `EQUIP`, og plassene i båtene som
skal kunne ha det. `buyGate` og `equipFits` kan lese det samme registeret, så butikken bare selger det båten har
plass til.

### 7.4 Felles beslag og materialer i Blender-skriptene

- **`tools/boats/fittings.py`:** dør, lanterne, pullert, klyss, leider (med og uten ryggbøyle), rekkverk,
  ankervinsj, baugrulle, lyskaster, soppventil, eksos, navnefelt, propeller (FP og CPP), ror, dyse,
  thrustertunnel med rist, offeranode, slingrekjøl, lenseport, dypgangsmerker og skrogsymboler. Hver funksjon
  tar mål og returnerer objekter og festepunkter. Båtskriptene kaller dem i stedet for å skrive egne.
- **`wear()` og `tint_obj()`** flyttes til `bpyutil.py` (de finnes i fire utgaver).
- **Materialløft:** et lite sett teksturer som deles av alle båtene: plater med sveis, antisklidekk,
  tårepletter, gitter, rust i renner, groe ved vannlinja. Det krever UV-er i eksporten og en skygger i
  `view3d` som blander punktfarge med tekstur. Dette er det største enkeltløftet for realismen, og bør prøves
  på én båt før det rulles ut.

---

## 8. Prioritert arbeidsliste

Rekkefølgen følger arbeidsmåten i `CLAUDE.md`: én økt per oppgave, en plan og «kjør på» før de store fasene.
Økt-tallene er grove anslag.

| Fase | Innhold | Økter | Gir |
|---|---|---|---|
| **U1 Festepunktene** | Typede plasser (`slots`, kap. 7.1) i de ti kystbåtene, registeret `GEARMODELS` (7.3) og én tegnefunksjon for utstyr på plassene. Haleren får side og retning, juksamaskinene faste plasser. Ny test som sjekker at hver båt har plassene riggene og utstyret krever, og at ingenting går gjennom skroget | 2 | Grunnmuren for alt nytt utstyr |
| **U2 Det som vises skal stemme med dataene** | D1–D5: teina med riktige mål, alle juksamaskinene (opptil `jukseMax`), stampestativ, flere garnbinger, teinestabel om bord når båten er rigget for teiner | 1–2 | Spilleren ser det hun eier |
| **U3 Felles beslag** | `tools/boats/fittings.py` (kap. 7.4) med dør, lanterne, pullert, leider, rekkverk, ankervinsj, propell, ror, anoder, thrustertunnel, navnefelt og slitasje. Prøves først på `hs11.py` (tynnest skript), så tas resten etter hvert som de endres | 2–3 | Nye båter går raskere, og feil rettes ett sted |
| **U4 Nye utstyrsmodeller** | Liten haler, juksavinde, kveiteutstyr, påhengsmotor 90 hk, antennesett (VHF, AIS, GPS), skjermer i konsollen, L6a (vest, MOB-båt med davit, MOB-lys) | 2–3 | Alt som kjøpes, synes |
| **U5 Materialløftet** | UV-er i eksporten, et felles teksturatlas (plater og sveis, antisklidekk, tårepletter, gitter, rust, groe) og blanding i skyggeren. Prøves på `kyst21` (gammel stålbåt, mest å vinne), måles på nettbrettet før det rulles ut | 2–4 | Det største løftet i grafikken |
| **U6 Havbåtene** | `al45`, `krabbe50`, `tral60` og `not75` løftes etter planlisten (SKR, OVB, MST, RNG, PTR, BTR) og får plassene fra U1. Trål, not og pumpe blir felles moduler | 4–6 | Havsteget får båter på nivå med kystbåtene |
| **U7 Undervannsskroget** | Propell, ror, rorhæl, anoder, tauvern og thrustere fra `fittings.py` på alle båtene, sett i dokk-scenen | 1–2 | Realisme i dokk, klart vann og krenging |

**Før U5 og U6 må budsjettet avklares** (D8): mål bildetiden på nettbrettet med en tyngre modell, og sett
grensen i `vessel3d.py` etter det.

### 8.1 Utført 30.10.2026 («Kjør på»)

| Hva | Funn som er rettet | Hvor |
|---|---|---|
| Felles beslag (U3, del av U7) | Propell med vridde, skjeve blad og CPP-nav, anoder, thrustertunnel med rist, dypgangsmerker, thruster- og bulbmerker, sveisesømmer, lenseporter, piskeantenner, radomer, GPS-sopper, lyskastere, leidere med bur, notgjerde, kraftblokk, nottrakt, sidehaler, slangetrommel og støtteseil av duk | `tools/boats/fittings.py` |
| Ringnotbåten | M2 (kraftblokk på bom, nottrakt, sidehaler, pumpe og sugeslange, notgjerde), M8 (hvite master med plattformer, rå, leider og antenner), M3, M12, M15 | `not75.py` |
| Tråleren | M7 (bulben under vann og rundere), M9 (krumme dører med stivere, sko og slitasje), M3, M15 | `tral60.py` |
| Snøkrabbefartøyet | M1 (stabler av koniske teiner på teinedekket, tegnet av spillet etter antallet om bord), M8 (radarer på egne plattformer, GPS, pisker, satellittkuppel, lyskastere, leider), M19, M3, M4 (avrundede hekkhjørner, klyss, leider), M15, M14 (pullerter) | `krabbe50.py`, `kit.pots` |
| Autolineren | M8 (platemasta med lettehull, plattform med rekkverk, fiskelanterner rødt over hvitt, leider, lyskastere), M19, M3, M15 | `al45.py` |
| Kyst15 | M4 (avrundede hekkhjørner i skrogets farger, fender, klyss, redningsleider), M5 (seil av duk med bue, sømmer, kantbånd og forsterkninger), M15 (felles propell, anoder, baugthruster), M20 (kjølen som dødved, propellåpning) | `kyst15.py` |
| Havsjark35 | M5 (seil av duk) | `havsjark35.py` |
| Teina (D1) | 1,55 × 1,45 × 1,07 m som i dataene. Daviten er hevet til 2,8 m så den høye teina går klar av rekka | `tools/gear/teine.py` |
| Snøkrabbeteina (TEI-01, ny) | Konisk teine 1,3 m nederst, 0,7 m øverst og 0,62 m høy, med inngang ovenfra og agnboks; stables tolv i høyden med 0,16 m mellom | `teine.py` (`kon`, `kontopp`, `konlag`, `konlag11`) |
| Juksamaskinene (D2) | Alle vises, opptil `jukseMax`: styrbord rekke først, så babord, der maskinen er snudd utover | `view3d/13-instruments.js` |
| Teinene om bord (D5) | Vises når båten er rigget for teiner og ikke fisker: i stabler på modellens plasser (`kit.pots`) eller ved haleren, to i høyden under 12 m og tre ellers | `view3d/10-gear.js`, `09-landing-deck.js` |

Står igjen: D3 (stampene), D4 (garnbingene), D6, D7, M6 (registreringsmerket), M10, M11, M13, M16–M18, U1 (typede plasser og
`GEARMODELS`), U4 (liten haler, juksavinde, påhengsmotor), U5 (materialløftet), støtteseilet rullet inn i havn (M5, trenger at
seilet blir en egen del som spillet kan skjule), og propell, anoder og thrustere på resten av kystbåtene (U7).

---

## 9. Kilder i koden

- Arter og båter: `src/js/core/02-species-gear.js` (`SPECIES`, `VESSELS`, `EQUIP`, `equipFits`, `lsaOf`).
- Redskap: `src/js/core/10-gear.js` (`GEAR`, `LINE_KINDS`, `POTS`, `NETTY`, `SELQ`, `BAITS`, `RIGS`, `jigTake`),
  `src/js/core/03-simulation.js` (`targetF`, `kveiteClosed`, `uerOpen`).
- 3D: `src/js/vessel3d.js`, `src/js/view3d/09-landing-deck.js`, `10-gear.js`, `12-skiff.js`, `13-instruments.js`.
- Modellene: `tools/boats/*.py`, `tools/gear/*.py`, `tools/deck/*.py`, `tools/fish/fisk.py`, `src/data/*.b64`.
- Planer: `docs/batplan.md` (Blender-løftet B1–B22), `docs/systemer/redskap.md` (5.62 dekksutstyret),
  `docs/planer/lover-og-regler.md` (L6, på grenen `claude/game-laws-regulations-uu63ec`).
