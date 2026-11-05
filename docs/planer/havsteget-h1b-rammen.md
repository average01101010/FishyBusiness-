# Havsteget H1b: rammen utvides til havfeltene (plan, 03.11.2026)

Jonas 03.11.2026, valg V4 C i `havsteget.md`: «utvid rammen som første fase i havsteget». Samme dag: «Planlegg H1b av havsteget med /planlegg: utvid spillets ramme til feltene utenfor dagens kart (Bjørnøya, Svalbard-sonen, snøkrabbefeltene øst, Nordsjøen vest), slik at havflåten kan fiske der (V4 C). Ikke bygg noe før jeg har svart på valgene og sagt «kjør på».»

**Valgene tatt 03.11.2026** (Jonas: «V1 B, men vi må løse dette på en smart måte som ikke ødelegger opplevelsen for spillerne, men samtidig er realistisk. V2 B, V3 A, V4 B»):

- **V1 B:** hele havet havflåten fisker i, også Jan Mayen, Island, Grønland og russisk sone. Kap. 3a forklarer hvordan det gjøres uten at spillet blir tyngre for spillerne på kysten.
- **V2 B:** hele Svalbard i detalj.
- **V3 A:** iskanten etter måned.
- **V4 B:** Longyearbyen som havn uten mottak.

H1b kommer foran H2 (autolineren). Ingenting her er bygd. Planen venter på «kjør på».

## 1. Hva som finnes i dag

**Rammen** (`docs/systemer/kart-og-terreng.md` 4.5, 4.9):

- Spillets ramme er UTM 33 i km: x = (E + 250 km)/1000 og y = (8 050 km − N)/1000 (`natP`/`natLL`, `core/00-proj.js`).
- `MAPB = {x0:0, y0:0, x1:1450, y1:1720}` (`core/01-world.js:58`). Utenfor er det land (`isLand`, linje 207 og 215). Nordkanten y = 0 ligger ved 72,5° N, og vestkanten x = 0 ligger ved 1–2° Ø.

**Der feltene ligger** (regnet med spillets egen `utm33`, 03.11.2026). γ er meridiankonvergensen, k er skalafaktoren:

| Sted | x | y | γ | k |
|---|---|---|---|---|
| Bjørnøya (74,45° N 19° Ø) | 870 | −216 | 3,9° | 0,9998 |
| Sørkapp (76,5° N) | 789 | −441 | 1,5° | 0,9996 |
| Nordspissen av Svalbard (80,8° N) | 839 | −925 | 4,9° | 0,9997 |
| Kvitøya (80,1° N 32° Ø) | 1 072 | −890 | 16,8° | 1,0009 |
| Sentralbanken (76° N 35° Ø), snøkrabbe | 1 280 | −476 | 19,5° | 1,0030 |
| Smutthullet (73,5° N 37° Ø) | 1 433 | −234 | 21,2° | 1,0053 |
| Kanin, russisk sone (68,5° N 44° Ø) | 1 898 | 173 | 27,3° | 1,0158 |
| Petsjorahavet (69,5° N 52° Ø) | 2 118 | −93 | 35,2° | 1,0226 |
| Novaja Semlja (74° N 56° Ø) | 1 919 | −585 | 39,9° | 1,0164 |
| Jan Mayen (71° N 8,5° V) | −85 | 8 | −22,3° | 1,0081 |
| Nord-Island (66,5° N 18° V) | −661 | 288 | −30,8° | 1,0241 |
| Reykjavík (64,1° N 22° V) | −971 | 417 | −34,1° | 1,0361 |
| Danmarkstredet (66,5° N 27° V) | −998 | 50 | −39,5° | 1,0372 |
| Øst-Grønland (70° N 22° V) | −585 | −139 | −35,3° | 1,0215 |
| Færøyane (62° N 7° V) | −386 | 980 | −19,6° | 1,0154 |
| Shetland nord (61° N 1° V) | −109 | 1 181 | −14,1° | 1,0087 |
| Vikingbanken (60° N 2° Ø) | 28 | 1 327 | −11,3° | 1,0060 |
| Nordsjøen vest (59° N 2° V) | −220 | 1 385 | −14,7° | 1,0111 |

**Det NPC-havflåten regner som «borte» i dag** (`src/data/havflaate.json`, `tools/npc/havflaate.py:93`, 4.17 i `npc-trafikk.md`). Tallene er summen over månedene for de 12 tyngste hovedområdene per redskap, slik `havflaate.py` velger dem:

| Hovedområde | Midtpunkt | Hva | Andel borte |
|---|---|---|---|
| 20 | 74,6° N 23° Ø, Bjørnøya | trål, line | størst, 26,5 kt |
| 24 | 79° N 36° Ø, nordøst for Svalbard | snøkrabbe | 7,0 kt |
| 15 | 75° N 35° Ø, Sentralbanken | snøkrabbe | 4,9 kt |
| 13 | 73° N 35° Ø, øst i Barentshavet | trål | 4,4 kt |
| 31 | 61,6° N 5,6° V, Shetland og Færøyane | snurrevad, line | 3,3 kt |
| 61 | 65° N 28° V, Island og Grønland | line | 1,6 kt |
| 21 | 77° N 10° Ø, vest av Spitsbergen | line | 0,7 kt |
| 01 | 68,8° N 49,5° Ø, russisk sone | line | 0,7 kt |
| 35 | 69,5° N 9° V, Norskehavet vest | garn | 0,1 kt |
| 23 | 78,6° N 27° Ø, øst av Svalbard | snøkrabbe | lite |

- Det betyr at hele snøkrabbefisket er borte i dag, sammen med 63 % av autolinefisket og 22 % av trålfisket og snurrevaden.
- Med V1 B er ingen av disse borte lenger.

**Det som har fast utstrekning 0–1 450 × 0–1 720:**

- **Kjernen:**
  - `MAPB` (`01-world.js`)
  - klemmen mot 0 i ruteplanleggerens rutenett (`core/11-route.js:48`)
- **Rørledningen:**
  - `national.py` (`NX`, `NY`, `mask200`, `expo`)
  - `pack.py:77` (`ix0=0`, `nx`, `ny`)
  - `deep.py` (`ix0=0`)
  - `chart.py` (`coast0` og stedsnavnene)
  - `k1/national.py`
- **Dataene:**
  - `tools/rules/regler.py:351` og `368`: Svalbard regnes som «far», og statistikkområdene utenfor rammen tas ikke med
  - `tools/npc/havflaate.py:93–94`
- **Bra fra før:**
  - Lasteren (`core/01b-mapdata.js`) har `ix0`/`iy0` per lag, så den tåler lag som begynner i negative celler.
  - `gridKey` tåler negative tall (4.5), og bestanden er glissen (`S.stock`).
  - Serveren har ingen grenser på posisjonene (sjekket i `supabase/migrations`).
- **Ikke laget for disse områdene ennå:**
  - Klimaet (`src/data/climate.json`) har punkter bare langs fastlandet.
  - Tidevannet (`src/data/tide.json`) har punkter per kystflis.
  - Kystflisene velges etter Overtures landegrense `NO` (`national.py:40`). Svalbard kan ha koden `SJ` der, og da faller øyene ut. **Ikke sjekket.**
- **Diesel** kjøpes på fiskemottak og verft (`docs/handelssteder.md`, `fuelPrice` i `core/02-species-gear.js:197`).

**Origo flyttes ikke.** Lagringene (`kystfiske_v2`), serverens posisjoner og alle data beholder koordinatene sine. Rammen vokser bare til negative x og y og østover.

## 2. Regelverket det bygger på

Sjekket med søk 03.11.2026. Lovdata og Fiskeridirektoratets sider kunne ikke leses direkte herfra, så alt under må leses i kilden i R4 før det bygges inn.

- **Fiskevernsonen ved Svalbard:**
  - Grunnforskriften er FOR-1977-06-03-6 (200 nm, sist endret 2001).
  - Torsken reguleres i en egen forskrift for hvert år (for eksempel FOR-2022-12-09-2140 for 2023).
  - Maskevidde og innblanding står i en egen forskrift fra 1994, som FAOLEX oppgir som opphevet. Hva som gjelder nå, er **ikke bekreftet**.
  - Kilde: faolex.fao.org (nor12858), leap.unep.org.
- **Bjørnøya:**
  - Ingen høsting innenfor 20 nm fra Bjørnøyas grunnlinjer, unntatt reketrål og skjellskraping.
  - HI siterer dette som § 56. `havsteget.md` sier § 58 i høstingsforskriften. Paragrafen må sjekkes.
  - Kilde: hi.no, «Svar om videreføring av stengte områder ved Svalbard og Bjørnøya».
- **Snøkrabbe:**
  - Fangsten skjer på norsk kontinentalsokkel, med egen tillatelse.
  - Kvotene for 2026: totalkvote 12 336 t og fartøykvote 351 t, pluss 82 t for levende krabbe. Kvotefleksibiliteten på 10 % er gjeninnført.
  - Fiskeridirektoratet kan stenge perioder og områder. Tidligere var det stengt 1.7–30.11 etter forskriften fra 2014. Om det gjelder i 2026, er **ikke bekreftet**.
  - Kilde: regjeringen.no, «Regulering av fangst av snøkrabbe i 2026», og Fiskeridirektoratets sak 17/2025.
- **Britisk sone (Nordsjøen vest):**
  - Adgangen avtales hvert år mellom Norge og Storbritannia. Forslaget for 2026 er 1 000 t torsk i britisk sone.
  - Gytefeltene er stengt i sesongen.
  - Ingen egen forskrift for 2026 ble funnet.
  - Kilde: Fiskeridirektoratets reguleringsmøte november 2025, foreløpig forslag om torsk i Nordsjøen og Skagerrak i 2026.
- **Færøysk sone:** egen forskrift for bunnfisk i færøysk fiskerisone (FAOLEX).
- **Nytt med V1 B, ikke søkt ennå:**
  - **Russisk sone:** adgangen kommer fra den norsk-russiske fiskerikommisjonen og krever lisens fra russiske myndigheter, søkt gjennom Fiskeridirektoratet.
  - **Islandsk og grønlandsk sone:** adgangen kommer fra de bilaterale avtalene.
  - **Fiskerisonen ved Jan Mayen:** norsk sone.
  - Alt må leses i kilden i R4.
- **Grensene:** Kartverkets «Norges maritime grenser» ligger alt i `tools/rules/` (`nmg-25833.gml`). Den har grunnlinjene, territorialfarvannet og sonene, også ved Svalbard og Jan Mayen. Grensene mot Russland, Island, Grønland, Færøyane og Storbritannia må sjekkes i fila.

## 3a. Slik løses V1 B uten at spillet blir tyngre for spillerne

Rammen blir rundt 3 600 × 2 920 km, som er 4,2 ganger så stor som i dag. Tre ting kunne ødelagt opplevelsen. Her er løsningene.

### Det som lastes

Kjernen lastes alltid og er 2,9 MB i dag. Den skal ikke vokse for den som fisker på kysten.

- **Den gamle kjernen blir som den er:** samme lag og samme størrelse på 0–1 450 × 0–1 720.
- **Et nytt grovt lag over hele den nye rammen lastes også alltid:**
  - land og avstand til land på 1 km, eksponering på 2 km og dybde på 1 km
  - anslått til 0,3–0,6 MB, fordi det meste er åpent hav
- **Landet på 200 m utenfor den gamle rammen** (Svalbard, Island, Færøyane, Grønland, Russland) og detaljflisene lastes bare der det trengs, som `sim`-pakkene i dag:
  - rundt egne båter, av barrieren (`simAreaReady`)
  - rundt det 2D-kartet og 3D-visningen viser
- **Simuleringen avhenger aldri av hva som tilfeldigvis er lastet** (4.6). Strøklengdestrålene og det andre som ser langt, bruker:
  - 200 m-laget innenfor den gamle rammen
  - 1 km-laget utenfor
  
  Hvilket lag som brukes, følger av posisjonen, ikke av lastingen. Begge lagene er alltid lastet, så det er like for alle.

### Avstandene (skalafaktoren k)

I dag regner spillet avstand og fart i rutenett-km. Det gikk an, fordi k er 0,9996–1,0042 langs kysten. Ved Island er k 1,037, og en tur dit ville tatt 4 % for lang tid.

- **Løsningen:** båtene beveger seg i sann avstand. Fart i rutenettet = sann fart × k(p). `gridScale(p)` regnes per km-rute, som `gridGamma`.
- **Avstandene som vises** (nm i ruta, rekkevidden, drivstoffet) deles på k.
- **På kysten** endres tidene med 0,03 % på Senja og høyst 0,4 % ved Grense Jakobselv. Det er riktigere enn i dag og merkes ikke.
- **I 3D** er verden tegnet i rutenett-meter. UTM bevarer formene, så land og båter ser riktige ut. Ved Island er alt 4 % større i rutenettet, men det ser likt ut, fordi båten også går 4 % fortere i det. Dette må sees på i R7.

### Retningene (γ)

γ er opptil 40° ved Novaja Semlja og Danmarkstredet. Alt som vises som sann retning, går alt gjennom `trueDeg`, og vinden, dønningen og sola dreies med γ (4.7).

- **Det som prøves:** at bølgene, vinden, sola, lyktsektorene og kompasset stemmer ved x −1 000 og 2 100.
- **Projeksjonen** er Krüger av sjette orden og holder seg nøyaktig langt ut over 40° fra midtmeridianen. Det sjekkes mot PROJ med nye punkter i `projref.py`.

### Rammen

- x −1 100 til 2 500 og y −1 250 til 1 720.
- Det tar med Øst-Grønland og Danmarkstredet, Island, Jan Mayen, Svalbard med Kvitøya og hovedområde 24, og russisk sone til Novaja Semlja og Petsjorahavet.

### Landet

Norsk land får detalj, og utenlandsk land får det som nabolandene har i dag:

- **Detaljfliser** (fjæra, sjømerkene, 3D ved kaia): Svalbard (V2 B), Jan Mayen, Bjørnøya og Hopen.
- **Bare land på 200 m, kyst i sjøkartet og fjernhøyder i 3D:** Island, Færøyane, Shetland, Grønland og Russland, som Sverige og Finland i dag. Fisket der skjer uansett utenfor territorialfarvannet.

## 3. Fasene

Hver fase er én økt. R1 og R2 rulles ut sammen, fordi en større ramme uten data er land.

### R1 Rammen og skalafaktoren i koden

- **Hva:**
  - `MAPB` får den nye utstrekningen.
  - Klemmene mot 0 (`11-route.js:48` og andre som gjelder posisjon) blir `MAPB.x0`/`MAPB.y0`.
  - 2D-kartet og miniplotteren tegner riktig med negative koordinater.
  - Det grove laget utenfor den gamle rammen leses av `isLandFar`, `coastDistFar`, `fetchRay` og dybdemodellen (3a).
  - `gridScale(p)` legges inn, og fart og viste avstander bruker den (3a).
  - `HOME`, `MAP_W` og `MAP_H` beholdes.
- **Filer:** `core/00-proj.js`, `core/01-world.js`, `core/01b-mapdata.js`, `core/03b-sea.js`, `core/05-vessels.js` (bevegelsen), `core/11-route.js`, `ui/03-map.js`, `ui/03e-miniplot.js`, `view3d/02-mesh-terrain.js:77`.
- **Tester:**
  - `tests/unit/` får nye sjekker:
    - `utm33` og `utm33inv` fram og tilbake ved Reykjavík, Danmarkstredet, Novaja Semlja og Kvitøya
    - `gridScale` mot k
    - `gridKey` med negative tall
    - `isLand` og strøklengden utenfor den gamle rammen
  - `projtest` med referansepunkter fra `projref.py` i de nye feltene.
  - `routetest`, `boottest` og `maptest`.
- **Måles:**
  - At kysten er så godt som uendret: `trip2` og `simday`, med tidene innen 0,4 %.
  - At ingenting leser en blokk som ikke er lastet (`MAPD.miss`).

### R2 Kjernen for den nye rammen (rørledningen og releasen)

- **Hva:**
  - Rørledningen tar rammen fra én konstant i `frame.py` i stedet for 1450/1720 på seks steder.
  - Det grove laget (land og avstand på 1 km, eksponering på 2 km, dybde på 1 km) over hele den nye rammen legges i kjernen.
  - Landet på 200 m utenfor den gamle rammen blir pakker per 50 km-flis, som lastes etter behov (3a).
  - **Dybden** til havs kommer fra GEBCO 2025 (15″, fri bruk) i stedet for ETOPO1 gjennom Terrarium. Der Kartverkets 50 m-modell finnes, gjelder den fortsatt. Trålen og teinene trenger riktig dybde på bankene.
  - `coast0` dekker hele den nye rammen. Fjernhøydene (`far`) dekker Svalbard, Jan Mayen, Island, Færøyane, Grønlands østkyst og Russland.
  - Ny release `kart-N` (endre `run` i `kart.json`).
- **Filer:** `tools/map/frame.py`, `national.py`, `deep.py`, `pack.py`, `chart.py`, `game.py`, `.github/workflows/kart.yml`.
- **Tester:**
  - `maptest` og `charttest`.
  - `teleport3d` med fire nye steder: Bjørnøya, Sentralbanken, Nord-Island og Petsjorahavet.
  - `tests/unit/` får en sjekk på manifestet, at lagene dekker rammen.
- **Måles:**
  - Kjernen skal være høyst 3,5 MB (2,9 MB i dag).
  - Første oppstart på nettbrettet skal ikke bli merkbart lengre.
  - Tida for kjøringen i Actions.

### R3 Svalbard og Jan Mayen i detalj (V2 B)

- **Hva:**
  - Detaljfliser (`sim`, `view`, `chart`) for Svalbard, Jan Mayen, Bjørnøya og Hopen, gjennom den samme `coast.py` som kysten. Det er anslagsvis 60–70 fliser.
  - Kystflisene velges også etter Svalbard og Jan Mayen (`SJ`) hvis Overture skiller dem ut.
  - **Sentinel-2 og trelaget** (`s2.yml`, `trees.yml`): Svalbard har ingen skog, så trelaget er tomt der. Satellittfargen må tas om sommeren uten snø, og det må sjekkes at mosaikken finnes så langt nord.
  - **Bygg og kaier** i vec-pakkene fra Overture: Longyearbyen, Ny-Ålesund, Barentsburg og Sveagruva.
  - **Sjømerker og fyr** fra Geofabriks Svalbard-uttrekk. `norway-latest` har trolig ikke Svalbard, og det må sjekkes.
  - **Dybden:** Kartverkets 50 m-modell der den finnes, ellers GEBCO.
- **Filer:** `tools/map/national.py` (`tiles`), `coast.py`, `vectors.py`, `sjomerker.py`, `sjomerker.json`, `fyr.py`, `tools/s2/`, `tools/trees/`.
- **Tester:** `marktest`, `coast3d` og `vectest` ved Longyearbyen og Bjørnøya, og skjermbilder i begge formater.
- **Måles:**
  - Releasens størrelse og antallet nye fliser (anslått til rundt 30 % større).
  - At Pages og Hetzner tar det.

### R4 Reglene og sonene

- **Hva:**
  - `rules.json` får sonene:
    - fiskevernsonen ved Svalbard og Svalbards territorialfarvann
    - Bjørnøya 20 nm
    - fiskerisonen ved Jan Mayen
    - Smutthullet og Smottet
    - russisk, islandsk, grønlandsk, færøysk og britisk sone
  - Statistikkområdene utenfor dagens ramme (`stats()` i `regler.py:368`) tas med, så `fiske.json` og `lok` kan brukes der.
  - `rulesAt` sier hva som gjelder i hver sone. **Forslaget til hvordan det blir realistisk uten å bli tungt:**
    - **Norske soner** (fiskevernsonen og Jan Mayen): fiske med havtillatelsen og fartøykvoten, etter forskriften for året. Bjørnøya 20 nm er stengt.
    - **Utenlandske soner:**
      - Fisket skjer på Norges kvote i sonen fra avtalen (kvoten for sonen i J-meldingen). Den er et tak for hele gruppa, felles for alle spillerne og NPC-ene, som gruppekvotene i dag.
      - Russisk sone krever i tillegg en **lisens**. Spilleren søker om den i Papirer-appen, og den kommer etter en ekte behandlingstid hvis tallet finnes i kilden. Den koster ikke penger og kan ikke kjøpes fort for ekte penger (CLAUDE.md: «Friction for Flow»).
      - Utenfor kvoten og lisensen sier Regler-appen og varselet før feil fra, som for kysten.
  - Hvert punkt leses i kilden (Lovdata, Fiskeridirektoratet, avtalene med Russland, Island, Grønland, Færøyane og Storbritannia) før det bygges inn, og kilden oppgis i `kvoter-og-regler.md`. Det som ikke kan bekreftes, stenges heller enn å gjettes.
- **Filer:** `tools/rules/regler.py`, `src/data/rules.json`, `core/03e-rules.js`, `core/03d-quota.js`, `ui/phone` (Regler-appen og Papirer-appen), og en ny migrering hvis sonekvotene skal telles på serveren.
- **Tester:** `rulestest`, `quotatest` og `tests/unit/` (rules), med et punkt i hver sone og et på hver side av hver grense.

### R5 Hav, vær og is (V3 A)

- **Hva:**
  - **Klimaet:** nye punkter i `climate.json` for Bjørnøya, Hopen, Longyearbyen, Kvitøya, Sentralbanken, Smutthullet, Petsjorahavet, Jan Mayen, Nord-Island, Danmarkstredet, Færøyane, Vikingbanken og Shetland (`klima.yml`, Open-Meteo og ERA5 som i dag).
  - **Tidevannet:** punkter ved Svalbard og Jan Mayen fra Kartverket (`tidevann.yml`). Ute i åpent hav og ved utenlandske kyster brukes nærmeste punkt, eller en global tidevannsmodell hvis en fri kilde finnes.
  - **Isen (V3 A):**
    - Iskonsentrasjonen etter måned, som middel for 1991–2020 fra OSI SAF eller Meteorologisk institutt, på 10 km.
    - Den lages som en ny datafil `src/data/is.json`, med eget verktøy og egen workflow.
    - Over en grense (anslått til 40 % konsentrasjon) er sjøen stengt for båter uten isklasse. Autonav seiler rundt.
    - Grensen glir mellom månedene, så den flytter seg dag for dag og ikke i hopp.
    - Gjelder Barentshavet, rundt Svalbard og Danmarkstredet.
  - **Lyset:** sola, mørketida, midnattssola og nordlyset ved 80° N sjekkes.
  - **Dekningen:** telefonens dekning er null langt til havs (`coverage`). Sjekkes.
- **Filer:** `tools/klima/`, `tools/tide/`, nytt verktøy `tools/is/`, `core/03-simulation.js` (tidevann, sol), `core/03b-sea.js`, ny fil `core/03h-is.js` (og i `COVER` i `run.py`), `core/11-route.js`.
- **Tester:**
  - `tidetest` og `seatest`.
  - En enhetstest for isen: stengt i mars ved Kong Karls land, åpent i september, ingen hopp mellom dagene.
  - En sjekk av sola i `tests/unit/`.

### R6 Fisken og havflåten på de nye feltene

- **Hva:**
  - **Fisken:** `fiske.json` har alt landingene per hovedområde for 28 m og over. Fordelingen og vandringen (`MIG.snokrabbe`, skreien, seien, makrellen, sild og lodde) får regne der.
  - **Havflåten:** `havflaate.py` kjøres på nytt med den nye rammen. Alle feltene som var «borte», blir felt med leier over åpent hav, slik feltene i dag.
  - Isen stenger felt og tvinger fram omveier for NPC-ene også.
  - **Navigasjonen:** Autonav og ruteplanleggeren over åpent hav, 400–1 500 km. Rutenettet i `11-route.js` må ikke bli for stort (`N = nx * ny`). Over åpent hav skal ruta bli rette strekk, sjekket mot 1 km-laget, og ellers den fine sjekken nær land.
- **Filer:** `tools/npc/havflaate.py`, `src/data/havflaate.json`, `core/03f-fiske.js`, `core/05d-hav.js`, `core/11-route.js`.
- **Tester:**
  - `tests/unit/flaate.test.mjs`: ingen felt borte.
  - `npctest` og `autonavtest`.
  - Nye ruter i `routes.json`: Hammerfest til Bjørnøya, Tromsø til Longyearbyen, Båtsfjord til Petsjorahavet og Ålesund til Nord-Island.
- **Måles:** at `havNear` og AIS ikke blir tyngre, og at en rute på 1 500 km planlegges på under 1 s på nettbrettet.

### R7 Longyearbyen som havn (V4 B)

- **Hva:**
  - **Havna:** Longyearbyen blir havn for spillerens båter, med kai og liggeplass etter `quayFit`, og ly.
  - **Ikke mottak:** man kan ikke levere fisk der.
  - **Verft og utstyrsbutikk** (Jonas 03.11.2026: «Ja, longyearbyen må ha verft og utstyrsbutikk, på denne måten er spillerne dekket mot det meste»). Diesel kjøpes på verftet, som langs kysten, så handelsstedene trenger ikke noe unntak. Verftet og butikken plasseres etter regelen i `docs/handelssteder.md` (minst 1,5 km fra hverandre, i ly, ved kai) og heter etter stedet.
  - **Mannskapsbytte:** mannskapet reiser med fly til og fra fastlandet. Det tar en ekte reisetid og har en billettpris fra kilde.
  - **I 3D:** kaia og byggene fra vec-pakkene (R3).
  - **Navnet** er stedsnavnet, ikke et firma.
- **Filer:** `core/06b-coastports.js`, `core/07-harbours.js`, `core/04-crew.js`, `src/data/steder.json` (`tools/steder/steder.py`), `docs/handelssteder.md`.
- **Tester:** `havntest`, `docktest`, `crewlifetest`, og en tur fra Tromsø til Longyearbyen med mannskapsbytte.

### R8 Stikkprøver, spilltest og utrulling

- **Hva:**
  - Seilas fra Båtsfjord til Sentralbanken og Petsjorahavet, Hammerfest til Bjørnøya, Tromsø til Longyearbyen, Ålesund til Nord-Island og Færøyane, og Måløy til Vikingbanken og Shetland.
  - På hver: kart, 3D (bølgene, sola og kompasset ved store γ), regler, vær, is og drivstoff.
  - Skjermbilder i begge formater.
  - Full regresjon med hele kysten (`/regresjon`) og utrulling.
- **Tester:** `/stikkprove`, `/regresjon`.

## 4. Valgene

- **V1 Hvor langt rammen går.** Valgt **B**: også Jan Mayen, Island, Grønland og russisk sone. Løses som i kap. 3a. Det som ble anbefalt (A), var x −500 til 1 600 og y −1 000 til 1 720.
- **V2 Land med detalj.** Valgt **B**: hele Svalbard i detalj, sammen med Jan Mayen, Bjørnøya og Hopen.
- **V3 Isen i Barentshavet.** Valgt **A**: iskanten etter måned, fra klimatologien. En daglig iskant (C) kan komme senere oppå den.
- **V4 Havner utenfor fastlandet.** Valgt **B**: Longyearbyen som havn uten mottak, med verft (diesel) og utstyrsbutikk (Jonas 03.11.2026, svar på spørsmålet om bunkring: «Ja, så lenge det blir så realistisk som mulig»).

## 5. Antatt eller usikkert

- **Regelverket i kap. 2** er funnet med søk, ikke lest i Lovdata.
  - Paragrafen for Bjørnøya: § 56 eller § 58.
  - Hvilke forskrifter som gjelder i fiskevernsonen i 2026.
  - Om snøkrabbe fortsatt har en stengt periode.
  - Ingen forskrift for britisk sone 2026 er funnet.
  - Avtalene med Russland, Island og Grønland er ikke søkt ennå.
- **Den russiske lisensen:** behandlingstida og hvordan den søkes i dag, er ikke funnet. Finnes ingen kilde, foreslås det at lisensen kommer med havtillatelsen uten ventetid, heller enn en oppdiktet ventetid.
- **Skalafaktoren (3a)** endrer tidene langs kysten litt, høyst 0,4 %. Tester med faste tider kan trenge nye tall. Det er en tilsiktet endring.
- **3D ved store γ og k:** dette er regnet riktig etter 4.7, men aldri prøvd ved 40° og 4 %.
- **Svalbard i Overture:** om Svalbard og Jan Mayen har landkoden `NO` eller `SJ` i Overture, avgjør om flisvalget finner øyene. Om Geofabriks Norge-uttrekk har med Svalbard, avgjør hvor sjømerkene kommer fra.
- **Dybden ved Svalbard:** Kartverkets 50 m-modell dekker trolig ikke Svalbard. GEBCO (rundt 460 m nord–sør) er grov for skjærene.
- **Størrelsen:** det grove laget (0,3–0,6 MB) og releasen med Svalbard (rundt 30 % større) er anslag. De måles i R2 og R3.
- **Isen:** kildene (OSI SAF og Meteorologisk institutts iskart) og lisensen deres er ikke lest. Grensen på 40 % er et anslag. Ingen av havbåtene har isklasse i dataene.
- **Tidevannet:** om `api.sehavniva.no` gir punkter på Svalbard og Jan Mayen, er ikke sjekket. Det er heller ikke sjekket om det finnes en fri global tidevannsmodell.
- **Sentinel-2 så langt nord** (snø, skyer, lav sol) er ikke prøvd.
- **Flybilletten og reisetida** for mannskapet mellom Longyearbyen og Tromsø trenger en kilde.

## 6. Hva planen ikke gjør

- Ingen mottak på Svalbard eller i utlandet. Longyearbyen er havn uten mottak, med verft og utstyrsbutikk (V4 B), og ingen butikker eller verft i utlandet.
- Ingen detaljfliser for utenlandsk land: Island, Færøyane, Grønland, Russland og Shetland får det nabolandene har i dag.
- Ingen nye arter eller redskap. Det kommer i H2–H6.
- Ingen daglig iskant (V3 C) ennå.
- Origo flyttes ikke, og lagringene endres ikke.
- Ingen ekte firma-, fartøy- eller rederinavn (CLAUDE.md).

## 7. Status

- 03.11.2026: planen er skrevet etter Jonas' bestilling.
- 03.11.2026: valgene er tatt: V1 B, V2 B, V3 A og V4 B. Planen er skrevet om med kap. 3a (slik V1 B løses), R7 Longyearbyen og R8 stikkprøvene.
- 03.11.2026: Jonas: Longyearbyen får verft og utstyrsbutikk (diesel på verftet), og «Kjør på». «Husk at alt som antas å være svakt skal du først prøve å løse, og om du ikke får det til skal det føres opp på listen.»
- 03.11.2026: **R1 bygd** (gren `ccr-f23363d4-rx3fvy`, ikke rullet ut; R1 rulles ut sammen med R2). Se 4.9b i `docs/systemer/kart-og-terreng.md`.
  - **Rammen:** `MAPB` er x −1 100 til 2 500 og y −1 250 til 1 720. Origo er der det var.
  - **Leserne for det som ser langt** (`farL`): kjernens 200 m- og 500 m-lag i den gamle rammen, og de grove lagene `land1k`, `dc1k` (0,5 km-steg) og `expo2k` utenfor, når R2 har laget dem. Hvilket lag som brukes, følger av posisjonen.
  - **Uten data** er det land for båtene, åpent hav for strøklengdestrålene, sjø i 3D og «utenfor kartet» på skjermene, som utenfor rammen før. Spillet er derfor likt som i dag til R2 kommer.
  - **Klemmene mot 0** i ruteplanleggeren og `deepAt` følger nå lagenes utstrekning.
  - **Skalafaktoren:** `gridScale(p)` (k per km-rute) og `kmTrue(a, b)`. Den gjelder i:
    - bevegelsen: seilasen, rorstyringen, manøvreringsmodellen, havflåten (`havV`) og driften uten motor
    - farten som vises (AIS)
    - avstandene som vises (plotteren, ruta, navigasjonen)
    - tidene i driftsplanen og turoppdragene
  - **Tester:** ny `tests/unit/rammen.test.mjs` (51 sjekker), med PROJ-punkter ute i havfeltene i `tests/proj_ref.json` (`projref.py`). 670 OK i alle enhetstestene.
  - **Neste:** R2 (kjernen og releasen) i en ny økt.
- 04.11.2026: **R2 bygd** (samme gren). Se 4.9c i `docs/systemer/kart-og-terreng.md`.
  - **Rammene** står ett sted, i `tools/map/frame.py` (`FRAME`, `OLD`, `WIDE`).
  - **Kjernen** har `land1k`, `dc1k`, `expo2k` og `deep` over hele rammen.
    - `deep` kommer fra GEBCO 2025, gjennom en ny workflow `gebco.yml` og releasen `gebco-3`, med Kartverkets 50 m der den finnes.
    - Den gamle kjernen har de samme verdiene. `dc200` og `expo` er kodet `u8p` og sjekket mot SHA-256 av de gamle bytene.
    - `coast0` over hele rammen ligger i en egen pakke (`chart0`), som lastes etter starten.
  - **Landet på 200 m og fjernhøydene** for 724 fliser utenfor den gamle rammen ligger i releasens `kart-ramme.tar.gz` og lastes etter behov.
  - **Releasen:** `kart-game.tar.gz` har samme format, så arbeidsgrenen tåler den nye releasen. `release.py` pinnes med `tools/map/kart-release.json`.
  - **Målt:**
    - Kjernen er 4,70 MB (3,62 før). Målet på 3,5 MB er ikke nådd, og tiltakene står i backloggen.
    - Den vide rammen tar rundt 5 minutter lokalt og fjernhøydene rundt 3 minutter. Tida i Actions står i 4.9c.
  - **Neste:** full regresjon med hele kysten, så utrulling av R1 og R2 når Jonas sier ja. Deretter R3.
- 04.11.2026: **R1 og R2 rullet ut** (Jonas: «Rull ut nå»; sammenslått i arbeidsgrenen 792e679, Hetzner og Pages grønne). Full regresjon med hele kysten først (BACKLOG 10.6). Pushen startet også `gebco.yml` (lagde `gebco-4`, som ikke brukes; `kart.json` peker på `gebco-3`) og `kart.yml` (stoppet, `kart-release.json` peker på `kart-29`).
  - **Neste:** R3 (Svalbard og øyene: satellittfargen eller arealdekket, så bakken ikke er grønn) eller R4 (sonene og reglene utenfor kysten), i en ny økt.
- 04.11.2026: **R3 bygd** (gren `ccr-h1b-r3-svalbard`). Se 4.9d i `docs/systemer/kart-og-terreng.md`.
  - **Flisene:** 98 (92 for Svalbard med Bjørnøya og Hopen, 6 for Jan Mayen) gjennom den samme `coast.py`, med Overtures bygg, veier og kaier og sjømerkene fra Geofabriks Norge-uttrekk (det har Svalbard med).
  - **Bakken** fra Copernicus GLO-30 (Terrarium er grov der), satellittfargen fra Sentinel-2 (`s2-12`) med breene fra snøen, ingen trær. Bakken er ikke grønn lenger.
  - **Dybden:** Kartverkets 50 m dekker 77 av 98 fliser (`dybde-7`), ellers GEBCO.
  - **Vakten** mot gjentatte datareleaser ved sammenslåing (`tools/ci/seen.py`).
  - **Testene:** Jonas 04.11.2026: «Ta kun de testene du mener er relevante». De som dekker kartet er grønne (svalbardtest, teleport3d, vectest, coast3d, landtest, routetest, marktest, boottest, trip2 og flere; BACKLOG 10.6).
- 04.11.2026: **R3 rullet ut** (Jonas: «Rull ut nå»; sammenslått i arbeidsgrenen d75e7b4, `kart-release.json` peker på `kart-31`, Hetzner og Pages grønne). Datajobbene startet ikke på nytt ved sammenslåingen (`seen.py`).
  - **Neste:** R4 (sonene og reglene) i en ny økt.
- 04.11.2026: **R4 bygd** (gren `ccr-h1b-r4-soner`, ikke rullet ut). Se 5.28b i `docs/systemer/kvoter-og-regler.md`.
  - **Sonene** i `rules.json`:
    - Norges egne er lest rett fra Kartverket.
    - Nabolandenes og det internasjonale farvannet er lagd ved å dele havet langs Kartverkets linjer og Fiskeridirektoratets «Sjøgrenser», som har 200 nm-linjene til Russland, Island, Grønland, Færøyane og Storbritannia.
    - Smutthullet er beregnet til 68 700 km², mot oppgitte rundt 67 000.
    - Svalbards forbud er med: § 58 og de sårbare økosystemene.
    - Det samme gjelder lokasjonene i hele rammen.
  - **Kildene:**
    - J-meldingene er lest direkte på fiskeridir.no: J-248-2025, J-247-2025, J-161-2026, J-61-2026, J-133-2026, J-94-2026, J-177-2026, J-237-2025 og J-193-2026.
    - § 58 er lest på Lovdata, og der står Bjørnøya. Den gamle paragrafen § 56 står fortsatt hos Fiskeridirektoratet og HI.
    - Ikke lest: protokollen med Russland for 2026 og Smutthullavtalen, fordi regjeringen.no var stengt.
  - **Svarene på kap. 5:**
    - Paragrafen for Bjørnøya er § 58.
    - Snøkrabben er stengt 1.7–30.11 i 2026 (J-237-2025 § 5).
    - Britisk sone har en egen forskrift for 2026 (J-225-2025, endret ved J-69, J-118 og J-177).
    - Ingen islandsk adgang er funnet for 2026, så sonen er stengt.
    - Den russiske lisensen søkes på Fiskeridirektoratets skjema FD-54, uten oppgitt behandlingstid. Den gis derfor med en gang i Papirer-appen og følger havtillatelsen.
  - **Regelmotoren:** `ruSea` og `ruSeaRules`, lisensene (`zoneLic`, Kvote → Papirer), Regler-appen (sonen og «Havet utenfor kysten») og snøkrabben (`sk0`–`sk4`).
  - **Tester:**
    - `tests/unit/soner.test.mjs` har 101 sjekker: et punkt i hver sone, 21 grenser med 2 km på hver side, alle 372 havnene og reglene.
    - `sonetest` (nettleseren og skjermbildene) er ny.
    - Disse er grønne: `rulestest`, `r4test`, `kystvakttest`, `trip2`, `bktest` og `geartest`.
    - `quotatest` feiler bare på den kjente «paid False» (BACKLOG 10.6).
  - **Ikke gjort:** tellingen mot Norges kvote i utenlandske soner. Taket står som data (`ZQ`) og telles når det kan fiskes der (R6, H2). Se BACKLOG.
  - **Neste:** Jonas sier ja til utrulling, så R5 (hav, vær og is).
- 04.11.2026: **R4 rullet ut** (Jonas: «Rull ut»). Arbeidsgrenen med kjølvannet til de andre båtene er flettet inn først. Etter flettingen er enhetstestene (965 OK), `sonetest` og `rulestest` grønne.
  - **Neste:** R5 (hav, vær og is) i en ny økt.
- 04.11.2026: **R5 bygd** (gren `ccr-h1b-r5-is`, ikke rullet ut). Se 5.20f i `docs/systemer/vaer-og-hav.md`.
  - **Isen:** OSI SAF OSI-450-a, månedsmidlene 1991–2020, i `src/data/is.json` (releasen `is-3`, `tools/is/is.py`, `is.yml`), 25 km og 1 %-trinn. Grensen er 40 % (nedre kant av åpen drivis hos WMO). Kanten glir dag for dag. Autonav, seilasen og rorstyringen stopper ved isen; kartplotteren og Vær-appen viser den. Ingen båt har isklasse ennå.
  - **Lisensen:** produktsiden sier CC BY 4.0, filene sier gratis bruk med «Copyright EUMETSAT». Det siste står i Vær-appen.
  - **Klimaet:** 13 nye punkter på havet (`klima.yml`).
  - **Tidevannet:** Kartverket svarte for Longyearbyen, Ny-Ålesund og Jan Mayen; resten av Svalbard, Bjørnøya, Hopen, det åpne havet og de utenlandske kystene kommer fra EOT20 (CC BY), 306 punkter (`tide-8`). EOT20 stemmer med Kartverket der de møtes.
  - **Lyset ved 80° N** er sjekket i `tests/unit/sol.test.mjs`. Rettet: nordlyset leste skyene der båten er.
  - **Dekningen** på Svalbard og Jan Mayen følger bosetningene.
  - **Svarene på kap. 5:** isen og lisensen er lest i dataene selv; grensen på 40 % er funnet hos WMO via Canadian Ice Service. `api.sehavniva.no` og Kartverket gir bare tre steder på Svalbard og Jan Mayen, og EOT20 er den frie globale modellen.
  - **Neste:** Jonas sier ja til utrulling, så R6 (fisken og havflåten på de nye feltene).
- 04.11.2026: **R5 rullet ut** (Jonas: «Ja»). Arbeidsgrenen med UI-redesignet, Kelvin-mønsteret og 3D-nivået er flettet inn først; etter flettingen er enhetstestene (1 019 OK), `trip2` og `istest` grønne.
  - **Neste:** R6 (fisken og havflåten på de nye feltene, og Autonav over åpent hav, som er for treg i dag).
- 05.11.2026: **R6 bygd** (gren `h1b-r6`, ikke rullet ut). Se 4.12g i `docs/systemer/autonav.md`, 4.17b i `npc-trafikk.md` og 5.3c-R6 i `fiskerimodellen.md`.
  - **Navigasjonen:** bare stykkene av en etappe som ligger nær land eller over grunt vann, sjekkes fint (`legRuns`); rette strekk over åpent hav; ut fra leinettet til en ende langt ute (`lnetExit`); grovsøket over havet laster ingen pakker. Hammerfest–Bjørnøya 0,5–0,8 s, Båtsfjord–Petsjorahavet 0,13 s, Ålesund–Nord-Island 0,3–0,4 s, Tromsø–Isfjorden 2,1–2,4 s (rundt 1 s er veien ut av Tromsø), rundt isen i mars 0,8 s, alt her i skyen. Kystrutene er de samme som før og 2–3 ganger raskere. Funnet underveis: `unitDredge` gikk gjennom alle 370 havneenhetene for hver dybdeavlesning.
  - **Fisken:** havflåtens sedler per hovedområde der kystflåten ikke har tall; silda i Norskehavet om sommeren, snøkrabben øst for 25° Ø, loddetorsken bare langs kysten.
  - **Havflåten:** `havflaate.py` på nytt med den vide rammen: 192 feltpunkter, ingen borte (før 14 av 164). Dybden i verktøyet var feil etter R2 (`u8p`) og er rettet. Isen stenger felt og leia går rundt den (`havOpen`, `havIceWay`). `havNear` er lettere enn før.
  - **Tester:** enhetstestene 1 027 OK (`hav` og `vandring` nye sjekker; «ingen felt borte» står i `hav.test.mjs`, ikke i `flaate.test.mjs` som planen sa, fordi `flaate` er kystflåten), `autonavtest` 24 OK (de fire havrutene i `routes.json`), `routetest` 43 OK, `istest` 6 OK, `havflaate` 9 OK, `npctest` 19 OK, `obstest` 8 OK, `trip2` i havn, `worldtest` 7 OK.
  - **Neste:** Jonas sier ja til utrulling, så R7 (Longyearbyen som havn).
- 05.11.2026: **R7 bygd** (gren `h1b-r7` fra `h1b-r6`, ikke rullet ut). Se 5.32b i `docs/systemer/handel-og-steder.md` og 5.6b i `folk-om-bord.md`.
  - **Havna:** Longyearbyen verft (diesel) og Longyearbyen utstyrsbutikk, 2,4 km fra hverandre, plassert av `tools/steder/svalbard.py` etter regelen i `docs/handelssteder.md`; ingen mottak. Vec-pakkene gir tre havner med ledige plasser for sjark og 15 m-båt. I kuling ved Svalbard går Autonav nå inn til Longyearbyen i stedet for tilbake til fastlandet.
  - **Mannskapet** flyr Tromsø–Longyearbyen: 3 t 25 min, billetten fra SAS' lavpriskalender for juli, november og desember (resten trukket mellom dem), betalt av rederiet. Svaret på kap. 5 om flybilletten: kilden er SAS, men bare tre måneder er lest (sas.no er stengt herfra); resten står i BACKLOG 10.3.
  - **Tester:** enhetstestene (med `fly.test.mjs`; `port-regions.json` skrevet på nytt med de to nye stedene), `lybtest` (ny: stedene, havna, turen fra Tromsø på 63 timer med kuling ved Isfjorden, mannskapsbyttet), `lybshot` (ny: bildene i begge formater), `stedertest`, `placetest`, `crewlifetest`, `lotttest`, `docktest` og `havntest`.
  - **3D ved store γ (kap. 3a):** ikke sett på særskilt i R7; bildene ved Longyearbyen viser byggene og kaiene. Det står for R8.
  - **Neste:** Jonas sier ja til utrulling (R6 og R7 sammen), så R8 (stikkprøvene, spilltesten og utrullingen).
- 05.11.2026: **R6 og R7 rullet ut sammen** (Jonas: «Rull ut»). Arbeidsgrenen hadde ingenting nytt etter R6, så grenen ble skjøvet rett på.
  - **Neste:** R8 (stikkprøvene, spilltesten og utrullingen) i en ny økt.
- 05.11.2026: **R8 bygd** (gren `h1b-r8`, ikke rullet ut). Se 4.12h og 4.12i i `docs/systemer/autonav.md` og 4.11n i `3d-verden.md`.
  - **Seilasene** (`tests/havtur.py`, ny, 68 OK): Båtsfjord–Sentralbanken, Båtsfjord–Petsjorahavet, Hammerfest–Bjørnøya, Tromsø–Isfjorden, Ålesund–Nord-Island, Ålesund–Færøyane, Måløy–Vikingbanken og Måløy–Shetland, planlagt og seilt i juli med kyst15 på den felles klokka uten påfylling. Kartet (sjø med dybde, ingen etappe på grunn eller i isen), sonen og lisensen, klimapunktene og været i januar og juli, isen i mars og september, rekkevidden for alle båttypene og forbruket (innenfor 3 % av overslaget i rutepanelet).
  - **Rettet:**
    - Autonav fant ingen rute fra Tromsø til Isfjorden utenom mars–mai, og ingen fra Bergen til havet vest for Shetland hele året (`lnetExit`, 4.12h). Stikkprøvene: Tromsø, Bodø, Bergen, Trondheim, Kristiansand, Hammerfest og Vadsø mot havet i januar, juli og oktober.
    - Rutepanelet varsler når dieselen rekker ut, men ikke tilbake til nærmeste bunkring (en sjark til Sentralbanken).
    - I kuling langt ute tok Autonav den første kaia etter luftlinja som hadde en rute (Sentralbanken: Longyearbyen 481 nm); nå tas den korteste (Gamvik 319 nm).
    - Kompasslinja over 3D-bildet i stående format: tallene løp inn i hverandre (hele kysten).
    - Slep ved Svalbard kom fra Tromsø, 850 km unna (towtest rød siden R7). Jonas 05.11.2026: «Kystvakten skal slepe båter ved svalbard»; nå fra Longyearbyen.
  - **3D ved store γ** (`tests/havshot.py`, ny): kompasset viser solas og vindens sanne retning innen 0,6° ved Petsjorahavet (γ +31°) og Nord-Island (γ −31°, k 1,024), og ved Bjørnøya i stående format; bildene i begge formater viser sola under kompasset. Målestokken ved Island (k opptil 1,037): ingen endring, begrunnet i 4.11n.
  - **Regresjonen:** alle 138 uten 3D (122 grønne; det røde er kjent eller ustabilt, se BACKLOG 10.6), og de 3D-testene som dekker endringene: camtest, dbg23o, havshot, tut (liggende); kinotest gikk ut på tid i rekka og ble kjørt alene.
  - **Ikke løst:** flybilletten for tolv måneder (SAS stenger Actions, BACKLOG 10.3); flybilletten venter på tallene fra Jonas.
  - **Ligge bi** (Jonas 05.11.2026: «Mange av de større havfiskebåtene er laget for å kunne være ute i orkan … du får ta en vurdering»): havfartøyene ligger ute til 24–26 m/s og 6,5–8,5 m sjø og ligger bi over det; de andre ligger bi når kaia er over 8 timer unna (4.12j i `autonav.md`).
  - **Neste:** Jonas sier ja til utrulling. Deretter H2 i havsteget (`docs/planer/havsteget.md`).
- 05.11.2026: **R8 rullet ut** (Jonas: «Kjør ut når du er klar», etter vurderingen av å ligge bi i uvær). Arbeidsgrenen med Driftsplan 2 del 2 er flettet inn først; etter flettingen er enhetstestene (1 063 OK), trip2, havtur, docktest, autonavtest, lybtest, towtest og driftsplan2test (alene) grønne. H1b er ferdig.
  - **Neste:** H2 i havsteget (`docs/planer/havsteget.md`) i en ny økt, og flybillettene når Jonas har tallene.
- 05.11.2026: flybilletten: Jonas valgte å beholde anslaget (tre måneder lest, resten trukket mellom dem; BACKLOG 10.3).
