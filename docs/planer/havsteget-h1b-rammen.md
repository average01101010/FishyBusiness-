# Havsteget H1b: rammen utvides til havfeltene (plan, 03.11.2026)

Jonas 03.11.2026, valg V4 C i `havsteget.md`: «utvid rammen som første fase i havsteget». Samme dag: «Planlegg H1b av havsteget med /planlegg: utvid spillets ramme til feltene utenfor dagens kart (Bjørnøya, Svalbard-sonen, snøkrabbefeltene øst, Nordsjøen vest), slik at havflåten kan fiske der (V4 C). Ikke bygg noe før jeg har svart på valgene og sagt «kjør på».»

H1b kommer foran H2 (autolineren). Ingenting her er bygd.

## 1. Hva som finnes i dag

**Rammen** (`docs/systemer/kart-og-terreng.md` 4.5, 4.9):

- Spillets ramme er UTM 33 i km: x = (E + 250 km)/1000 og y = (8 050 km − N)/1000 (`natP`/`natLL`, `core/00-proj.js`).
- `MAPB = {x0:0, y0:0, x1:1450, y1:1720}` (`core/01-world.js:58`). Utenfor er det land (`isLand`, linje 207 og 215). Nordkanten y = 0 ligger ved 72,5° N, og vestkanten x = 0 ligger ved 1–2° Ø.

**Der feltene ligger** (regnet med spillets egen `utm33`, 03.11.2026):

| Sted | x | y | γ | k |
|---|---|---|---|---|
| Bjørnøya (74,45° N 19° Ø) | 870 | −216 | 3,9° | 0,9998 |
| Sørkapp (76,5° N) | 789 | −441 | 1,5° | 0,9996 |
| Nordspissen av Svalbard (80,8° N) | 839 | −925 | 4,9° | 0,9997 |
| Hopen | 1 009 | −463 | 9,7° | 1,0004 |
| Sentralbanken (76° N 35° Ø), snøkrabbe | 1 280 | −476 | 19,5° | 1,0030 |
| Smutthullet (73,5° N 37° Ø) | 1 433 | −234 | 21,2° | 1,0053 |
| Vikingbanken (60° N 2° Ø) | 28 | 1 327 | −11,3° | 1,0060 |
| Shetland nord (61° N 1° V) | −109 | 1 181 | −14,1° | 1,0087 |
| Nordsjøen vest (59° N 2° V) | −220 | 1 385 | −14,7° | 1,0111 |
| Russisk sone (72° N 50° Ø), til sammenligning | 1 896 | −284 | 33,7° | 1,0157 |

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

**Origo flyttes ikke.** Lagringene (`kystfiske_v2`), serverens posisjoner og alle data beholder koordinatene sine. Rammen vokser bare til negative x og y.

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
- **Færøysk sone:** egen forskrift for bunnfisk i færøysk fiskerisone (FAOLEX). Gjelder bare om rammen tar med Færøyane (V1).
- **Grensene:** Kartverkets «Norges maritime grenser» ligger alt i `tools/rules/` (`nmg-25833.gml`). Den har grunnlinjene, territorialfarvannet og sonene, også ved Svalbard. Delelinja mot Russland og grensene mot britisk og færøysk sone må sjekkes i fila.

## 3. Fasene

Hver fase er én økt. R1 og R2 rulles ut sammen, fordi en større ramme uten data er land.

### R1 Rammen i koden

- **Hva:**
  - `MAPB` får den nye utstrekningen fra V1.
  - Klemmen mot 0 i `11-route.js:48` blir `MAPB.x0`/`MAPB.y0`. Det samme gjelder alle andre klemmer mot 0 som gjelder posisjon (søk med `grep`).
  - 2D-kartet (`ui/03-map.js:14` og `334`) og miniplotteren følger `MAPB` fra før. Det må sjekkes at de tegner riktig med negative y.
  - `HOME`, `MAP_W` og `MAP_H` beholdes.
  - Utenfor lagene til den nye kjernen kommer (R2), gjelder det som i dag: land.
- **Filer:** `core/01-world.js`, `core/11-route.js`, `ui/03-map.js`, `ui/03e-miniplot.js`, `view3d/02-mesh-terrain.js:77`.
- **Tester:**
  - `tests/unit/` får nye sjekker for `utm33` og `utm33inv` fram og tilbake ved 81° N, 6° V og 40° Ø, `gridKey` med negative tall og `isLand` utenfor rammen.
  - `projtest` med referansepunkter fra `projref.py` ute i de nye feltene.
  - `routetest` og `boottest`.
- **Måles:** at Senja og kysten er uendret (`trip2`, `simday`).

### R2 Kjernen for den nye rammen (rørledningen og releasen)

- **Hva:**
  - Rørledningen tar rammen fra én konstant i `frame.py` i stedet for 1450/1720 på seks steder.
  - `national.py`:
    - `mask200` og `dc200` tar med Svalbard, Bjørnøya, Hopen, Shetland og Færøyane, slik nabolandene er med i dag.
    - `expo` regnes på nytt for den nye rammen.
  - **Dybden** til havs (`deep`) kommer fra GEBCO 2025 (15″, fri bruk) i stedet for ETOPO1 gjennom Terrarium, på 1 km som i dag. Der Kartverkets 50 m-modell finnes, gjelder den fortsatt. Trålen og teinene trenger riktig dybde på bankene.
  - `coast0` dekker hele den nye rammen. Fjernhøydene (`far`) dekker Svalbard og Bjørnøya, slik at landet står i 3D sett fra sjøen.
  - Ny release `kart-N` (endre `run` i `kart.json`).
- **Filer:** `tools/map/frame.py`, `national.py`, `deep.py`, `pack.py`, `chart.py`, `game.py`, `.github/workflows/kart.yml`.
- **Tester:**
  - `maptest`, `teleport3d` (to nye steder: Bjørnøya og Sentralbanken) og `charttest`.
  - `tests/unit/` får en sjekk på manifestet, at lagene begynner der rammen begynner.
- **Måles:**
  - Kjernepakken lastes alltid, så størrelsen teller. Den er 2,9 MB i dag. Anslaget er 4–5 MB, men det er ikke målt.
  - Tida for `mask200` i Actions.
  - Hvor lang tid første oppstart tar på nettbrettet.

### R3 Land med detalj der det trengs (V2)

- **Hva:**
  - Detaljfliser (`sim`, `view`, `chart`) for øyene V2 velger, gjennom den samme `coast.py` som kysten.
  - Kystflisene velges også etter Svalbard (`SJ`) hvis Overture skiller den ut.
  - Sjømerker og fyr fra Geofabriks Svalbard-uttrekk. `norway-latest` har trolig ikke Svalbard, og det må sjekkes.
  - Dybden der Kartverket ikke har data: GEBCO, blandet inn som dybdemodellen gjør i dag.
- **Filer:** `tools/map/national.py` (`tiles`), `coast.py`, `sjomerker.py`, `sjomerker.json`, `fyr.py`.
- **Tester:** `marktest` og `coast3d` ved Bjørnøya, og skjermbilder i begge formater.
- **Måles:** releasens størrelse og antallet nye fliser.

### R4 Reglene og sonene

- **Hva:**
  - `rules.json` får sonene utenfor fastlandet:
    - fiskevernsonen ved Svalbard og Svalbards territorialfarvann
    - Bjørnøya 20 nm
    - Smutthullet
    - delelinja mot Russland
    - britisk sone, og færøysk sone hvis V1 tar den med
  - Statistikkområdene utenfor dagens ramme (`stats()` i `regler.py:368`) tas med, så `fiske.json` og `lok` kan brukes der.
  - `rulesAt` sier hva som gjelder i hver sone: torsk i fiskevernsonen etter forskriften for året, Bjørnøya 20 nm stengt, snøkrabbe bare med tillatelse, og britisk sone bare med adgangskvoten.
  - Hvert punkt leses i kilden (Lovdata, Fiskeridirektoratet) før det bygges inn, og kilden oppgis i `kvoter-og-regler.md`.
- **Filer:** `tools/rules/regler.py`, `src/data/rules.json`, `core/03e-rules.js`, `ui/phone` (Regler-appen).
- **Tester:** `rulestest` og `tests/unit/` (rules), med et punkt i hver sone og et på hver side av hver grense.

### R5 Hav, vær og is

- **Hva:**
  - **Klimaet:** nye punkter i `climate.json` for Bjørnøya, Hopen, Longyearbyen, Sentralbanken, Smutthullet, Vikingbanken og Shetland (`klima.yml`, Open-Meteo og ERA5 som i dag).
  - **Tidevannet:** punkter ved Svalbard fra Kartverket (`tidevann.yml`). Ute i åpent hav brukes nærmeste punkt.
  - **Isen** etter V3.
  - **Lyset:** sola, mørketida og midnattssola ved 80° N sjekkes (`sun` etter posisjon), og nordlyset.
  - **Dekningen:** telefonens dekning er null langt til havs (`coverage`). Sjekkes.
- **Filer:** `tools/klima/`, `tools/tide/`, `core/03-simulation.js` (tidevann, sol), `core/03b-sea.js`, og en ny fil `core/03h-is.js` hvis V3 er A eller C.
- **Tester:** `tidetest`, `seatest`, en sjekk av sola i `tests/unit/` (ingen egen soltest finnes), og en enhetstest for isen.

### R6 Fisken og havflåten på de nye feltene

- **Hva:**
  - **Fisken:** `fiske.json` har alt landingene per hovedområde for 28 m og over. Fordelingen og vandringen (`MIG.snokrabbe`, skreien, seien, makrellen) får regne der.
  - **Havflåten:** `havflaate.py` kjøres på nytt med den nye rammen. Feltene som var «borte», blir felt med leier: rett ut fra siste farledsnode over åpent hav, slik feltene i dag.
  - Turene går fra og til mottakene på fastlandet (V4). AIS og kartplotteren viser skipene der.
  - **Navigasjonen:** Autonav og ruteplanleggeren over åpent hav, 400–900 km. Rutenettet i `11-route.js` må ikke bli for stort (`N = nx * ny`). Over åpent hav skal ruta bli rette strekk.
- **Filer:** `tools/npc/havflaate.py`, `src/data/havflaate.json`, `core/03f-fiske.js`, `core/05d-hav.js`, `core/11-route.js`.
- **Tester:** `tests/unit/flaate.test.mjs` (ingen felt borte i rammen), `npctest`, `autonavtest`, og en ny rute i `routes.json` fra Hammerfest til Bjørnøya.
- **Måles:**
  - Hvor mange felt som fortsatt er borte. Etter V1 A: Island og Grønland og russisk sone.
  - At `havNear` ikke blir tyngre.

### R7 Stikkprøver, spilltest og utrulling

- **Hva:**
  - Seilas fra Båtsfjord til Sentralbanken, Hammerfest til Bjørnøya, Tromsø til Sørkapp, Ålesund til Shetland og Måløy til Vikingbanken, med kart, 3D, regler, vær og is.
  - Skjermbilder i begge formater.
  - Full regresjon med hele kysten (`/regresjon`) og utrulling.
- **Tester:** `/stikkprove`, `/regresjon`.

## 4. Valgene

**V1 Hvor langt rammen går**
- **A (anbefalt): x −500 til 1 600 og y −1 000 til 1 720.** Det tar med Svalbard helt i nord, Bjørnøya, snøkrabbefeltene i fiskevernsonen og i norsk sone øst til delelinja, Smutthullet, og Nordsjøen vest til Shetland og Færøyane. Island, Grønland, Jan Mayen og russisk sone er fortsatt «borte». Det er de fire stedene Jonas nevnte, med god margin, og γ holder seg under 22° på de østligste feltene.
- **B: også Jan Mayen, Island og russisk sone** (x −1 400 til 2 500). Da er alt havflåten fisker, med, men rammen blir rundt fire ganger så stor som i dag. γ blir opptil 35°, k blir 1,02, og kjernen blir tyngre for alle.

**V2 Land med detalj**
- **A (anbefalt): detaljfliser bare for Bjørnøya og Hopen.** Spitsbergen og øyene utenfor Nordsjøen får land på 200 m, kyst i sjøkartet og fjernhøyder i 3D. Fisket skjer flere nautiske mil fra land, så det er bare de små øyene som ligger midt i feltene, som trenger fjæra og sjømerkene.
- **B: hele Svalbard i detalj.** Det gir anslagsvis 60 nye fliser og rundt 30 % større release, med fjorder, Longyearbyen og alt i 3D.
- **C: bare kjernen overalt.** Bjørnøya blir da en klump på 200 m.

**V3 Isen i Barentshavet**
- **A (anbefalt): iskanten etter måned, fra klimatologien** (iskonsentrasjonen 1991–2020 fra OSI SAF eller Meteorologisk institutt). Båtene seiler ikke inn i tett is, og snøkrabbefeltene i nord stenger seg selv om vinteren. Det er ekte, gratis og den samme for alle spillerne.
- **B: ingen is.** Det er enklest, men da kan man fiske ved Kong Karls land i mars.
- **C: dagens iskart hver dag** fra en workflow, som tidevannet. Det er mest ekte, men det er mer arbeid, og kan komme senere oppå A.

**V4 Havner utenfor fastlandet**
- **A (anbefalt): ingen nye havner i H1b.** Turene går fra og til mottakene på fastlandet, som de gjør for NPC-flåten og i virkeligheten.
- **B: Longyearbyen som havn uten mottak** (drivstoff, ly og mannskapsbytte).

## 5. Antatt eller usikkert

- **Regelverket i kap. 2** er funnet med søk, ikke lest i Lovdata.
  - Paragrafen for Bjørnøya: § 56 eller § 58.
  - Hvilke forskrifter som gjelder i fiskevernsonen i 2026.
  - Om snøkrabbe fortsatt har en stengt periode.
  - Ingen forskrift for britisk sone 2026 er funnet.
- **Avstand i rutenettet:** spillet regner avstand og fart i rutenett-km, uten skalafaktoren k. Det gir 0,5 % for lang avstand ved Smutthullet og 1,1 % i Nordsjøen vest, mot 0,4 % ved Grense Jakobselv i dag. For en tur på tre døgn er det opptil 45 minutter. Planen retter det ikke, fordi det ville endre tidene langs hele kysten. Det tas opp igjen hvis spilltesten merker det.
- **Svalbard i Overture:** om Svalbard har landkoden `NO` eller `SJ` i Overture, avgjør om flisvalget finner øyene. Om Geofabriks Norge-uttrekk har med Svalbard, avgjør hvor sjømerkene kommer fra.
- **Dybden ved Svalbard:** Kartverkets 50 m-modell dekker trolig ikke Svalbard. GEBCO (rundt 460 m nord–sør) er grov for skjærene ved Bjørnøya.
- **Kjernens størrelse** er bare et anslag (4–5 MB mot 2,9 MB) og må måles i R2.
- **Kildene for isen** (OSI SAF og Meteorologisk institutts iskart) og lisensen deres er ikke lest.
- **Tidevannet:** om `api.sehavniva.no` gir punkter på Svalbard, er ikke sjekket.
- **3D ved store γ:** ved Smutthullet er γ 21°, slik at bølgene, vinden og sola dreies mye mellom rutenett og sann retning. Dette er regnet riktig i dag (4.7), men er aldri prøvd så langt ute.

## 6. Hva planen ikke gjør

- Ingen fiske i Island, Grønland, Jan Mayen eller russisk sone (med V1 A).
- Ingen mottak eller handelssteder på Svalbard eller i utlandet (V4 A). Regelen i `docs/handelssteder.md` står.
- Ingen nye arter eller redskap. Det kommer i H2–H6.
- Origo flyttes ikke, og lagringene endres ikke.
- Ingen ekte firma-, fartøy- eller rederinavn (CLAUDE.md).

## 7. Status

- 03.11.2026: planen er skrevet etter Jonas' bestilling. Den venter på valgene V1–V4 og «kjør på».
