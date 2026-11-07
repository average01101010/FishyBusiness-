# Vær, hav, tidevann og sol

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.14 Tidevann per sted og sol etter posisjon (kystplanen, fase K10, 03.10.2026)

- **Tidevannet** (`core/03-simulation.js`):
  - `tools/tide/fetch.py` henter Kartverkets tidevannsvarsel (Se havnivå, `vannstand.kartverket.no`, CC BY 4.0). Det er timevis over sjøkartnull for et år fra 1.10.2026, i et punkt på sjøen per kystflis (`tools/tide/points.json`, 143 punkter 0,4–3 km fra land).
  - Skriptet tilpasser spillets harmoniske konstanter med minste kvadraters metode. Konstantene er middelvann over sjøkartnull og amplitude og fase for M2, S2, N2, K2, K1 og O1, med de samme astronomiske argumentene som `tideH`. Nodalfaktorene ligger i årets tilpasning.
  - Kartverket er stengt fra skymiljøet. Derfor kjører `.github/workflows/tidevann.yml` skriptet og legger resultatet som releasen `tide-<kjøring>`. Den startes av en endring i `tools/tide/tide.json`. `api.sehavniva.no` svarte ikke fra GitHub, så den nye adressen prøves først.
  - Resultatet ligger i `src/data/tide.json` (138 punkter, fra `tide-2`). Restavviket er 7–13 cm, fra tidevannskomponentene spillet ikke har (M4, P1, Q1 og andre).
  - `tidePlace(p)` blander de tre nærmeste punktene etter omvendt kvadrat av avstanden, som komplekse tall så fasene går jevnt over.
  - `tideH(H, p)`, `tideZC(p)`, `tideCD(H, p)` og `tideEvents(H0, timer, p)` gjelder der `p` er, ellers der båten du følger er (`herePos`). Uten tabellen brukes Senjas gamle konstanter overalt. Det var Tromsøs: M2 0,86 m.
  - **Målt** (`tidetest.py`):

    | Sted | Tidevannsforskjell over 15 dager i mars 2027 | Middelvann over sjøkartnull | M2 |
    |---|---|---|---|
    | Hvaler | 0,30 m | 0,57 m | 0,12 m |
    | Bergen | 1,27 m | 0,89 m | 0,42 m |
    | Bodø | 2,58 m | 1,68 m | 0,85 m |
    | Senja (Husøy) | 1,98 m | 1,36 m | 0,66 m, før 0,86 m |
    | Kirkenes | 2,96 m | 2,06 m | 1,06 m |

    Ved Egersund er M2 bare 3–6 cm (amfidromepunktet). Høyvannet kommer rundt 1,4 timer senere på yttersida av Senja enn med Tromsøs konstanter.
  - Havneenhetene mudres i forhold til middelvann der de ligger (`unitDredge` bruker `tideZC(p)`). `unittest` regner det laveste vannet per enhet.
- **Sola og månen:** `sunAt(H, p)`, `moonAt(H, p)` og `sunTimes(H, p)` regner der `p` er, ellers der båten er (`obsAt`, i 5 km-ruter). 3D-lyset, SOL i navigasjonslinja, været på telefonen, nordlyset og overtroen følger dermed båten.
  - Midtsommer har Senja, Bodø og Kirkenes midnattssol, og dagen er 19,2 timer i Bergen og 18,7 på Hvaler.
  - Midtvinter har Senja og Kirkenes mørketid, og dagen er 1,6 timer i Bodø, 5,8 i Bergen og 6,3 på Hvaler.
  - Sola regner lysbrytningen to ganger nær horisonten (`sunAt` legger den til høyden, og `sunTimes` bruker −0,83°). Dagene blir derfor noen minutter for lange. Det er gammelt og er ikke rettet.
- **Nordlyset** (06.10.2026, Jonas' liste: «realistiske draperier med stråler, farger etter høyde og bevegelse»):
  - **Når:** `auroraAt(H, p)` krever at sola står minst 7° under horisonten, at det er klart, og at aktiviteten (en langsom støy som av og til stiger til en storm) er høy nok der båten er. Nordlysovalen ligger over Nord-Norge de fleste aktive netter, så fra 67° N og nordover holder litt aktivitet. Lenger sør trengs sterkere netter: ved Oslo er det bare de sterkeste (`need`, lineært fra 67° N til 59,5° N). `aurorashot` teller 99 av 113 mørke, klare prøvetider med nordlys på Senja og 17 ved Oslo.
  - **Slik ser det ut** (himmelskyggeren i `view3d.js`): tre gardiner langs den magnetiske øst-vest-retningen (12° fra rutenettet). Hver er et loddrett lag fra en skarp underkant 100 km oppe til rundt 300 km, og strålen fra øyet møter laget der den krysser det (to steg langs folden, så laget er sammenhengende i alle høyder).
    - Gardinens linje folder seg og driver langs buen. Strålene står langs feltlinjene og flimrer, og lyset pulserer langsomt.
    - Fargene: grønt (oksygen, 557,7 nm) fra underkanten, rødt (630 nm) høyt oppe, og en lilla kant under når det er sterkt.
    - Et lag sett på skrå er lysere enn et sett rett forfra (lengre vei gjennom laget), og rett over hodet blir det en krone (taket er 4×).
    - Svakt nordlys er en lav bue i nord. Sterkere nordlys kommer sørover og opp over hodet.
  - **Test:** `aurorashot` tar bilder fra broa mot nord en klar januarnatt i tre styrker og uten. Den sjekker at himmelen blir grønnere jo sterkere natta er, at det tegnes uten GL-feil, og forskjellen mellom Senja og Oslo.
- **Grunnstøting i sør** (`tidetest.py`): over samme grunne (1,0 m i kartet) ved høyvann går en båt med 1,8 m dypgang på grunn på Hvaler (1,66 m vann), men flyter i Bodø (3,15 m).

## 5.20 Vær og hav (02.10.2026)

**Lavtrykk som flytter seg (V4, 09.10.2026;** Jonas: «vi må bygge ferdig værsystemene og årstidene før vi starter med å tenke på hvor nye spillere skal starte»):
- Før V4 var vinden den samme langs hele kysten i samme time. Nå har hvert lavtrykk et eget spor langs kysten: en linje utenfor kysten fra Lindesnes rundt Stad, forbi Helgeland, Lofoten og Troms til Nordkapp og Vardø (`WX_TRACK`).
- `wxPlace(p)` måler et sted langs sporet (s, km fra Lindesnes) og på tvers av det (c, + ut mot havet), lagret per rute på 5 km.
- Lavtrykk k går med 38–68 km/t og passerer et sted ved timen det passerte Senja før, flyttet med (s − s_Senja)/fart. En storm topper derfor rundt 40 t før i Færder, 32 t før i Bergen, 6,5 t før i Bodø, 6,5 t etter i Hammerfest og 13,5 t etter i Vardø.
- Styrken avhenger av hvor nær sporet stedet er (sporet ligger fra 120 km inne i landet til 400 km ute) og hvor langs kysten lavtrykket er dypest (`wxLowShape`). Den er skalert så snittet ved Senja er som før: `seatest` måler vindsummen over to år til 0,2 % over den gamle.
- Bakgrunnsværet (støyen i vinden og retningen) flytter seg også nordover, med 45 km/t (`WX_SYN`).
- Vinden dreier med klokka (S → SV → NV) på høyre side av sporet og mot klokka (S → Ø → N) på venstre side (Buys Ballot).
- Stedets egen vindstyrke følger den sterkeste vinden i `climate.json` mot Senja (`wmax`), dempet: (forholdet)^0,2, innenfor 0,92–1,12.
- `windAt`, `windDir`, `weAt`, `wdAt`, `swellOpen`, `hsOpen`, `fcWind`, `fcHsOpen` og `hsAtFc` tar et sted `p` (ellers båten). Driftsplanen ser vinden langs hele ruten, og ankeret, push-varslene, NPC-flåten, stabiliteten og 3D bruker stedet der det skjer.
- Måling, andel timer over 11 m/s i januar: Senja 29 %, Bergen 35 %, Bodø 35 %, Vardø 38 %, Hammerfest 34 %. Det tar 5 µs per kall uten mellomlager.

**Startlista etter været (09.10.2026;** Jonas: «Alle skal kunne gå ut, fiske og levere sin første fisk på fiskemottaket»):
- `startWx(pt, H)` i `ui/08c-start.js` sjekker hvert sted i «Hvor står fars naust?» de neste seks spilltimene (0, 2, 4 og 6 t), omtrent den ekte timen første tur tar.
- Sjekken gjelder det lunest vannet 2 km ut fra havna, åtte retninger. Der leter `tutFieldNear` etter feltet etterpå, og felt over grensen trekkes ned. Fra Vangshamn gjelder den også veien til Botnhamn.
- Grensen er startbåtens forsiktige sjø (`risk[0]`, 1,2 m for trebåten). Et sted er aldri åpent i vind over båtens faregrense (`risk[3]`, 14,5 m/s).
- Bølgene leses fra den nasjonale kjernen, så hele kysten kan sjekkes før kartet er lastet. Det tar 0,7 s første gang og 0,15 s etterpå for 162 steder (Chromium på PC).
- Steder over grensen står grått med «Uvær nå · åpner igjen ca. …» (eller «Uvær de neste to døgnene»), kan ikke velges og er ikke med i «Best akkurat nå». Er hele kysten stengt, vises alle. Det er ikke sett i målingene.
- Under første tur (`S.tut`) snur båten ikke av seg selv for været (`05-vessels.js`).
- Måling med lavtrykkene i V4:
  - i snitt 141 av 162 steder åpne
  - i de verste stormtimene i februar 2028 (28–30 m/s ved Senja) 14–62 åpne, da i sør eller i nord der stormen ikke var
  - skanning av to år, hver tredje time (5 840 tidspunkter): lista var aldri tom. Det verste var 4 åpne steder (19.03.2028 kl. 18), færre enn 20 åpne på 26 tidspunkter, og 60 eller flere på 5 627.

**Snø og årstider (V2 og V3, 09.10.2026):**
- `seasonAt(H, p)` regner dag for dag fra 1. august for en rute på 20 km. Hver dag har middeltemperaturen og nedbøren fra `airTemp` og `precipAt` (fire ganger i døgnet), og nedbøren i mm fra månedsnormalen i `climate.json`.
- **Snø (V2)** regnes for hver 100. meter opp til 1 500 m:
  - lufta kjølner 0,65 °C per 100 m, og nedbøren øker 4 % per 100 m
  - nedbøren faller som snø under 0,5 °C og blandet opp til 1,5 °C, og 65 % av den blir liggende
  - snøen smelter med 4 mm per graddøgn, og raskere i regn
  - `snowLineAt` gir høyden der 20 mm vann ligger som snø. `view3d.js` bruker den i stedet for den faste tabellen (`SNOWLINE`, nå bare reserve) og legger snøen flekkete rundt grensen.
  - Måling midt i måneden, mm vann ved sjøen / 300 m / 800 m:
    - Senja: 235 / 424 / 663 i januar, 0 ved sjøen fra juni
    - Bergen: nesten aldri snø ved sjøen, men 285 mm på 300 m i februar
    - Vardø: 68 / 111 / 177 i januar
- **Årstider (V3):**
  - Bjørka får løv når temperatursummen over 5 °C siden mars når rundt 60: i mai i Bergen og Kristiansund, i juni i Bodø og på Senja.
  - Gresset grønnes med løvet og holder litt grønt gjennom en mild vinter uten snø.
  - Løvet gulner når tidagerssnittet faller under 9 °C etter midtsommer og faller to uker senere.
  - `view3d.js` blander gresset fra halmfarget til grønt (`grassNow`), og bjørka er naken, grønn eller gul (`treeSeason`).

**Klima etter sted (V1, 06.10.2026;** Jonas: «Vi skal jo ikke ha ekte live-vær, men vi må kunne simulere været langs hele kysten på en god måte, med variasjoner fra sted til sted»):
- `src/data/climate.json` har månedsmidler for 19 punkter fra Færder til Kirkenes: lufttemperatur, nedbør, snø, sterkeste vind, andel kulingdager og skydekke fra ERA5 2006–2020, og sjøtemperatur fra Open-Meteos marine data 2023–2025. Dataene hentes av `tools/climate/fetch.py` i `.github/workflows/klima.yml` (startes ved å endre `tools/climate/klima.json`) og ligger som releaser `klima-N`.
- Spillets eget vær er uendret, men flyttes med hvor stedet avviker fra Senja, der spillet er kalibrert. Lufta og sjøen flyttes med forskjellen i temperatur, nedbøren med forholdet i månedsnedbør, og skydekket med forskjellen. Ved Senja er alt nøyaktig som før.
- Mellom punktene vektes de tre nærmeste med 1/d², lagret per rute på 5 km (`climW`).
- `airTemp`, `precipAt`, `cloudAt`, `visibility` og `seaTemp` tar et valgfritt sted `p` og bruker ellers båten. Begroingen på redskap regner sjøtemperaturen der redskapet står, og Vær-appen viser sjøtemperaturen der båten er.
- Bodø, Tromsø og Kirkenes ligger ute på sjøen fra `klima-2`. I `klima-1` var rutene deres mest land, med altfor kalde vintre (Tromsø −8,1 °C i januar mot −4,1 °C nå).
- **Test:** `climtest`.

Brukerens ønske: havet skal se ut og oppføre seg slik Beaufort-skalaen beskriver det, og vindretningen mot land skal telle (le og lo). Kjølvann, hekkbølge og baugbølge skal være realistiske. Overgangene skal være jevne.

Brukerens valg:
- Både spillet og 3D følger vindretning og le.
- Dønningen er et eget system.
- Vinden dreier med lavtrykkene.
- Det åpne havet følger WMO.
- Dønningen holder feltene ute omtrent like grove som før.

**Kjernen** (`core/03b-sea.js`, etter `03-simulation.js`):

- **Vinden** (`windAt`) er uendret i styrke, med samme kontrollsum som før.
  - Lavtrykkene ligger i `stormsNear(H)`.
  - `windDir` dreier med klokka gjennom hvert lavtrykk, fra S foran det, via SV på toppen, til V/NV bak kaldfronten (Buys Ballots lov), vektet etter lavtrykkets andel av vinden.
  - `WX_FORCE = {w, d}` holder været fast i tester.
- **Strøklengde** `fetchAt(p, fra)`:
  - Sju stråler, −45…+45°, mot vinden. Effektiv strøklengde etter Saville (SPM 1984): Σ F·cos²α / Σ cos α.
  - `fetchRay` slår opp de fjerne lagene (`FARL`) én gang per stråle og bruker stegets landlag igjen for landet, i stedet for `farL` to ganger og `isLandFar` per steg (Ø3a, 07.11.2026): det samme laget og de samme tallene (`tests/unit/fetchray.test.mjs` mot den gamle måten), om lag 13 % raskere varmt. Målingen av bølgekartet over fjernterrenget står i `3d-verden.md` 4.11o.
  - Strålene marsjerer med `coastDist` (steg `max(25 m, 0,92·d − 70 m)`) og stopper på 25 m-masken.
  - Utenfor kartet:
    - åpent Norskehav mot N og NV (600 km)
    - Andøya rundt 16 km over Andfjorden mot V
    - 15 km mot S og Ø, og ved Kvaløya
  - `fetchField` gir roten av strøklengden fra en buffer i 200 m-ruter og 10°-sektorer: bilineær mellom rutene (ruter på land teller ikke) og lineær mellom sektorene, så den aldri hopper.
  - Kostnaden er rundt 5 µs uten buffer og 0,5 µs med, i Chromium på PC.
- **Vindsjø:** JONSWAP (Hasselmann m.fl. 1973) med U i m/s og F i meter:
  - `Hs = 0,0016·U·√(F/g)` og `Tp = 0,286·(U/g)·(gF/U²)^(1/3)`
  - Den vokser aldri over WMOs sannsynlige høyde for åpent hav per Beaufort-styrke: 0 / 0,1 / 0,2 / 0,6 / 1 / 2 / 3 / 4 / 5,5 / 7 / 9 / 11,5 / 14 m (`WMO`, `hsWMO`, interpolert mellom midtfartene). Tabellen er gjengitt av NOAA og Hong Kong Observatory.
  - Vinden sjøen svarer på er `weAt(H) = 0,6·W(H) + 0,4·W(H−3)`.
- **Dønning** (`swellOpen`) kommer fra VNV (300° ± 25°) med periode 9–14 s. Den har to deler:
  - en grunndønning etter årstid (`SWELL`) × støy (0,1–1,9)
  - en restdønning etter lavtrykkene: maks av `hsWMO(we(H−k))·e^(−k/24)` for k = 6–36 t, bare for vind fra vestlig halvdel

  Inn mot land dempes den med `EXPO^1,5` (`swellFactor`). `exposure()` er uendret, fordi den styrer fisk og dybde.
- **Bølgehøyden:**
  - `hsAt(p, H) = max(0,05; √(vindsjø² + dønning²))` (`hsParts` gir delene).
  - `hsOpen(H) = √(hsWMO² + dønning²)`.
  - Varselet `hsAtFc` regner det lokale varselet i «Vær» gjennom den samme sjøen med varselvinden.
  - Minne for siste kall gjør de 26 kallene billige.
- **Kalibrering:** Dønningen er satt så snittet gjennom året på de tre ytre feltene er 92–94 % av før.

  | | Før | Nå |
  |---|---|---|
  | Snitt Hs, Husøy / Mefjorden / Gryllefjord | 1,78 / 1,66 / 1,91 m | 1,68 / 1,53 / 1,77 m |
  | Skiffen «trygt» om dagen ved Husøy, vinter / vår–høst / sommer | 12 / 24 / 72 % | 10 / 17 / 63 % |

  - Fjordfeltene er uendret, der er vinden grensen.
  - `progweek`: blad B dag 22 som før, 37 turer mot 44 på 56 dager, men 296 kg og 10 140 kr per tur mot 281 kg og 8 766 kr. Nettoen etter 56 dager er 379 301 kr mot 388 726 kr. Med 15 % egenkapital kommer inngangen nå litt etter dag 56.
  - `simday` er innenfor ±3 %.
- **Sjøgang og tekst:**
  - `seaState(hs)` gir Douglas-skalaen (WMO-kode 3700) med met.no sine navn: havblikk, småkruset sjø, smul sjø, svak sjø, moderat sjø, røff sjø, veldig røff sjø, opprørt hav, veldig opprørt hav, ekstremt opprørt hav (`SEAN`).
  - `seaHere` legger til «krapp» når vindsjøen er brattere enn 1/25 av bølgelengden og større enn dønningen.
  - `BFS` beskriver havet ved hver Beaufort-styrke (etter SNL «Beauforts vindskala»).
  - Vær-panelet og vær-appen viser sjøgangen, vindsjøen og dønningen med retning og periode, og teksten for vindstyrken.

**Havet i 3D** (`view3d.js`):

- **Sjøtilstandskart:**
  - To teksturer: n (32² over det nære terrenget) og w (128² over hele kartet).
  - Kanalene R og G er roten av strøklengden for de to 10°-sektorene rundt vinden, og B er dønningsfaktoren.
  - De bygges stykkevis, 1,5–25 ms per bilde etter hvor tregt bildet går, og holdes per sektor.
  - Den viste teksturen står til den nye er klar, så sjøen aldri faller tilbake til det grove kartet.
  - `ssAt(x, z)` leser det samme på CPU-en.
- **Bølgene:**
  - 10 komponenter for vindsjøen, 96–6,4 m.
  - To spektre, ungt (F = 1 km) og utvokst, som blandes per piksel etter hvor utvokst sjøen er. Fra F3 (5.20g) er de JONSWAP (γ 3,3), retningene spredt etter bølgealderen og brattheten Q felles for vindbølgene.
  - 3 dønningskomponenter (L = 1,56·T², ×0,8 / 1 / 1,25) fra dønningens egen retning.
  - Amplituden settes per sted fra teksturen, både i verteksskyggeren og i fragmentskyggeren.
  - Uten teksturer i verteksskyggeren, eller med `#novtf`, gjelder verdien ved båten.
  - Når en bølge dreier eller blir lengre, holdes fasen fast der båten er.
- **`seaH`** følger det som tegnes:
  - lokale høyder, bølgegrupper (`grp`), dempingen av korte bølger (`att`) og fadingen mot kanten
  - Gerstner-forskyvningen opphevet med to steg tilbake
  - `seaHFast` (uten opphevingen) til kjølvannet
- **Beaufort-trekk:**

  | Styrke | Utseende |
  |---|---|
  | 0 | Speilblankt |
  | 1 | Kattepoter (krusninger i flekker) |
  | 2 | Blanke småbølger |
  | 3 og over | Skumtopper (se under) |
  | 7 | Skumstriper fra 13,9 m/s |
  | 8 | Sjørokk fra 17,2 m/s (partikler) |
  | 9 | Dis av sjørokk, bare i 3D. Sikten blir 15 km ved 24,5, 4 km ved 28,5 og 1 km ved 32,7 m/s. |
  | 10 | Hvitt hav fra 24,5 m/s |

  Skumtoppene dekker andelen W = 3,84·10⁻⁶·U^3,41 (Monahan og O'Muircheartaigh 1980) der sjøen har hatt 0,2–3 km å bryte på. Fra F3 (07.11.2026) lages de i nærpassen der bølgene bryter, etter Jacobi-determinanten, med hale og drift i skumkartet (5.20g); det som står videre i dette avsnittet, gjelder fjernpassen. De sitter på kammene, normalisert med eget standardavvik. Terskelen er tilpasset den målte spredningen: `0,228 + 0,293·z − 0,016·z²`, der z er normalkvantilen. Kanten er like bred som pikselen (`fwidth`), med en svak, myk rand utenfor, og flekkene inni glattes ut før de blir mindre enn et par piksler. Da hakker ikke kanten. Der skummet er for lite til å synes, blir havet hvitere i stedet. Brenningene følger sjøen som når hver strand.
  **Brenningene og grunnene langs land** (Jonas 28.10.2026: «Hvorfor skummet noen meter ut fra selve vannkanten?»): nærmest land kommer dybden fra strandteksturen (`buildLandMask`, rundt 18 m ut fra linja), lenger ute fra nærnettets høyder (23 m ruter). En rute som krysser linja, blander landets høyde med bunnen og ga en falsk grunne 30–60 m ut fra all kyst, med skum og turkis. Utenfor strandteksturen er det nå bare en grunne der alle fire nabopunktene i nettet (±1,5 rute) ligger under vann; ellers regnes dybden som minst 5 m, så det turkise slutter der strandteksturens gjør, uten egen kant (`SEA_FS` i `01-shaders.js`). Prøvd ved Reine, Bergen, Bodø og Hammerfest (`docs/pr/ccr-1d00422f-gjapvb/brenning/`): feilen fantes alle fire stedene og er borte. I stille vær er det lite skum ved selve strandkanten, fordi båndet der er like bredt som bølgehøyden tilsier.
- **Jevne overganger:**
  - Vind, høyde og dønning glir mot nye verdier med tidskonstant 4 s, retningen over 12 s.
  - Alle trekk har myke overganger.
  - `sea3d.py` måler at ingen bølge endrer seg mer enn 1,7 cm når vinden økes i steg på 0,1 m/s fra stille til orkan.
- **Ytelse:**
  - Det flate havet tegnes som ringer rundt det som tegnes nærmere, uten `discard` og uten piksler som tegnes to ganger.
  - Fjernpassen bruker en egen variant med de fire lengste bølgene.
  - `#fps` i adressen viser bildetakten.
  - **Når 3D ikke starter** (Jonas' telefon 04.10.2026, Galaxy A52s): meldingen «3D-visning støttes ikke» sier nå også hvilket steg og hvilken feil som stoppet det (`failWhy`, `G3.failWhy`): WebGL-konteksten, en shader med loggen sin, et byggesteg eller en mistet kontekst. Dyr, NPC-båter, fly og redningsskøyta stopper ikke 3D om de feiler (`opt`).
  - **Shaderne på telefoner** (05.10.2026): pikselskyggerne ber om høy presisjon bare der telefonen har det (`FS_HP`), en mistet kontekst før 3D er i gang prøver igjen (`glWatch`), og feilen går til skyen (`cloudErr`, med GPU og grenser). Jonas' Adreno 642L kompilerte alt, men lenket ikke sjøen, og driveren ga ingen logg. Sjøen prøver derfor i rekkefølge: med sjøtilstandsteksturen i hjørneskyggeren, uten den, og med fjernsjøens enklere bølger. Pikselskyggeren har sine egne kopier av bølgetabellene (`SEAF`: `uFWa`, `uFWb`, `uFGp`), fordi samme uniform-tabell i begge skyggerne var det eneste sjøen hadde som ingen annen skygger hadde. Lenkes ingen av dem, prøves hver halvdel alene for rapporten (VS alene, FS alene), og en enkel flat sjø med litt krusning, himmel og solglitter tar over (`BASIC_VS`/`BASIC_FS`, `PS.basic`). Skyen får vite hvilken sjø som ble brukt («3D sjø med reserve»). Prøvd ved å tvinge lenkingen til å feile i Chromium.
  - **Windows med Direct3D 11** (05.10.2026): den fulle sjøen tok med seg GPU-prosessen både på Intel Iris Xe i Chrome (Adrian) og på NVIDIA GTX 980 i Firefox, med «sjø link: ingen logg fra driveren». Etter det feilet hver kompilering uten logg, mens `isContextLost()` ennå sa nei, og Chrome slo så av WebGL for siden («ingen WebGL-kontekst» til nettleseren startes på nytt). Derfor:
    - Direct3D (alle merker, `GPU` fra `RENDERER`) starter på sjønivå 1 (fjernsjøens bølger og ingen tekstur i hjørneskyggeren).
    - **Mellomsjøen på nivå 1** (tilbakemelding #106, 01.11.2026, GTX 980 i Firefox: «Havet vises ikke»; Jonas: «Det er viktig at spillet oppleves så likt som mulig uansett hvilken enhet eller nettleser»): nivå 1 tegnet havet nær båten med fjernpassets skygger, uten korte bølger, krusninger, kjølvann, skum og lanternelys, og så var det for alle på Windows. Nivå 1 prøver nå først den lette hjørneskyggeren (`SEA_VS_LITE`) med den fulle pikselskyggeren (`PS.mid`), og fjernpasset også på den lette. Mister en maskin konteksten eller GPU-prosessen på den (`dsb_sea_midtry` igjen ved neste lasting), merkes den (`dsb_sea_mid`) og starter på det gamle nivå 1, uten å gå et nivå ned, og skyen får beskjed («3D mellomsjø feilet»). `#seamid` tvinger mellomsjøen (og nivå 1), `#sealvl=` og `#nomid` lar den være. Skummet er med (`foamInit`). Ikke prøvd på en ekte Direct3D-maskin: følg med på «mellomsjø feilet» i feilloggen.
    - Nivået som prøves, skrives ned først (`dsb_sea_try`) og slettes når sjøen er laget og konteksten fortsatt lever. Finner en lasting merket igjen, starter den ett nivå ned (`dsb_sea`) og sier fra til skyen. Slik lærer en maskin som krasjer, selv om nettleseren aldri melder at konteksten er mistet.
    - **To ganger på rad, og ikke en annen fanes oppstart** (05.11.2026, Jonas: kjølvannet var borte i 25 knop). Feilrapportene fra Jonas' Adreno 642L viste at sjøen hadde trappet ned to ganger på «forsøket kom ikke tilbake»: 04.11 fra full sjø til mellomsjøen, og 05.11 fra mellomsjøen til det gamle nivå 1, uten kjølvann, skum og korte bølger. Merkene ligger i `localStorage`, som alle faner på nettstedet deler. En fane som startet mens en annen fane laget skyggeleggerne, eller en side som ble lukket eller lastet på nytt midt i oppstarten, så merket og trodde det var et krasj. Nå:
      - Merket sier hvem og når (`nivå:side:tid`, `SEAID`). Et merke under 15 s gammelt fra en annen side ventes ut før 3D starter (`seaMarksSettle`, høyst 17 s). Forsvinner det, var det en oppstart ved siden av, og det telles ikke.
      - Et forsøk som ikke kom tilbake, trapper ned først andre gang på rad (`dsb_sea_gone`, `dsb_sea_midgone`). Første gang prøves samme sjø igjen og skyen får «(1 av 2)». Tellerne nulles når sjøen kommer gjennom. En kontekst som mistes mens skyggeleggerne lages, ses og trapper ned med én gang, som før.
      - Mellomsjøen merkes nå av med `u2:no2`. De gamle merkene (`u2:no`, som Jonas' telefon fikk 05.11) gir ett nytt forsøk. Nivået (`dsb_sea`) er ikke nullstilt: en telefon som gikk fra full sjø til nivå 1 på et falskt krasj, står der til valget om å prøve den fulle sjøen igjen er tatt.
      - Testen er `tests/seatrytest.py` (9 OK). `G3._debug.seaWait` sier om oppstarten venter på en annen side.
    - Etter en feil uten logg venter `glSettle` 80 ms og ser om konteksten er mistet, før neste forsøk.
    - Uten WebGL-kontekst forteller feilteksten at nettleseren må lukkes helt og åpnes igjen.
    - Gir nettleseren ingen kontekst med kantutjevning og den kraftige GPU-en, prøver spillet enklere innstillinger før 3D gir opp: uten kantutjevning, så uten krav (`ctxTry`, #218, Adrians PC).
  - **Mistet kontekst under spill** (#218, 05.10.2026): bufrene, teksturene og programmene forsvinner med konteksten. Når nettleseren gir den tilbake, lagres spillet og siden lastes på nytt, høyst én gang hvert tiende minutt (`dsb_gl_reload` i sessionStorage), så en driver som faller igjen og igjen ikke laster siden om og om igjen. Ellers står meldingen om å laste på nytt. Feilen går til skyen. `seatrytest` sjekker det med `WEBGL_lose_context`.
    - Test: `tests/seatrytest.py` (D3).
  - **Bølgeløkkene skrevet ut** (05.10.2026, etter feilloggen): Adreno 642L lenket fortsatt ingen sjø, og hjørneskyggeren alene feilte. Den var den eneste skyggeren i spillet som slo opp i uniform-tabeller med en løkkevariabel. Løkkene over de 13 bølgene er derfor skrevet ut med faste indekser i både hjørne- og pikselskyggeren (`SEA_VS_WAVE`, `SEA_WAVE(W, i)`). Bølgene er de samme.
    - Før den flate sjøen prøves en lett hjørneskygger med de fire lengste vindbølgene og dønningen, uten kjølvann i geometrien (`SEA_VS_LITE`, `PS.lite`, `#sealite` i adressen tvinger den).
    - Varianten som virket når den fulle ikke gjorde det, huskes på enheten for denne utgaven av skyggerne (`dsb_sea_ok`, `SEA_VER`), så telefonen ikke lenker de som feilet ved hver start. Endres skyggerne, endres `SEA_VER`, og alle prøver den fulle sjøen igjen.
    - Test: `tests/sea3d.py` (den lette sjøen tegnes uten GL-feil).
- **Båtens egne bølger** (`WAKE_GLSL`, `updateWake`). Fartsregimet følger Froude-tallet Fr = v/√(gL) med lengden fra `VESSELS` og simuleringens fart gjennom vannet.
  - **Kelvin-kilen (19,47°), etter stasjonær fase (Jonas 04.11.2026: «jeg synes ikke det virker så bra i dag»):** i et punkt s bak kilden og q ut fra sporet, inne i kilen (s² > 8q²), kommer to bølger: en tverrbølge og en skråbølge, med retning θ fra kursen gitt av tan θ = (s ∓ √(s² − 8q²))/4q og fase k₀·secθ·(s + q·tanθ). Kammene buer seg som i sjøen, tverrbølgenes buer bøyer seg bakover og møter skråbølgene, og langs armene smelter de to sammen og bygger seg opp (spissene, holdt endelige: (s²/(d² + 0,35s²))^¼). Utenfor kilen dør mønsteret ut over en bølgelengde eller så. Tverrbølgene faller som 1/√s, skråbølgene som s^−1/3; skråbølger som står brattere enn rundt 55° på kursen tones bort (de ble for korte og flimret). Før var tverrbølgene rette kammer rett på tvers med en hard kant og skråbølgene rette streker i fast 35° i et bånd langs armen, regnet hver for seg, så spissene aldri bygget seg opp. Høyden er som før høyest nær skrogfart (≈ 0,045·L, maks 0,6 m).
  - **Rekkevidden:** rundt 18 skroglengder, 60–350 m (før 40–120 m). Mønsteret følger sporet, så en sving korter det mindre: 3·√(6R) + 20 m (før √(6R) + 8).
  - **Nær båten i hennes egen retning** (Jonas 04.11.2026, med bilde av en tråler i sving: «kelvinmønsteret i baugen fulgte ikke båten nøyaktig nok»): mønsteret ble regnet langs sporet hekken har gått helt inntil båten, og baugbølgen ble ført fram langs sporets første stykke. I sving slår hekken ut og sporet peker en annen vei enn baugen, så baugbølgen sto ut ved siden av stevnen. Nå ligger mønsteret i båtens kurs nær skroget og går over til sporet fra en halv til to skroglengder og 10 m akter, og baugbølgen regnes alltid i båtens egen retning (`s0`, `q0` i `wakeH`). Bilder før og etter: `docs/pr/ccr-d8829db0-ldggvz/kelvin_foer_etter.png` (sjarken i 8,5 knop rett fram og i sving). I SwiftShader står armene som tynne, lyse linjer fra lav vinkel; skråbølgenes kammer langs armene står nesten parallelt med armen, men hvor harde de er, må ses på nettbrettet.
  - **Planende skrog (Fr > 1):** bare skråbølger, flatt hvitt propellvann og hanekam bak påhengsmotoren.
  - **Lange og korte bølger:** de lange løfter havet, de korte gir bare skygge.
  - **I sving:** det rette mønsteret stopper der det går mer enn noen meter fra sporet, og skumstripa (`TRAIL`) fortsetter.
  - **Skumstripa** (Jonas 04.10.2026):
    - Hekkbølgene (de to Kelvin-armene) blekner gradvis og er borte etter 10 s, rundt 115 m ved 23 kn. Før varte de 18 s, 210 m.
    - Hvert hjørne ligger på bølgene der det står. Med én høyde på tvers ble den ene armen mer skjult av bølgene enn den andre, og babord så kortere ut.
    - Propellstrømmen viser bare skumboblene, og de er borte etter 6 s: «kun vise boblepartiklene». Det lyse båndet under dem er fjernet.
    - Stripene på armene står stille bak båten (Jonas 21.10.2026, #90), der havets egne skråbølger er: fasen er 1,5·k₀(0,816·s + 0,577·q) fra hekken, som i `wakeH`. Før hang de i punktene i `TRAIL` og gled bakover langs armene med båtens fart på skjermen, som er `GAME_RATE` ganger farten gjennom vannet bølgene regnes for. Skummet brytes opp i vannets eget sted.
  - **Baugbølgen:** klatrer opp i stevnen og løper akterover i 25° (høyde ≈ 0,12·v²/2g, maks 0,6 m).
  - **Brytning:** baugbølgen og hekkbølgen brekker hvitt når de blir bratte.
  - **Sprøyten:** kommer når baugen stuper ned i en sjø (og litt hele tida i krapp sjø når hun planer), og blåser med vinden. Den kastes ut fra vannlinja der baugbølgen forlater skroget, 8–30 % av lengden akter for stevnen, som fin dusj (myke punkter, 700 i alt), og har med seg 90 % av båtens fart på skjermen: den vifter ut ved siden av baugen og faller akter for den (Jonas 21.10.2026, #90: kastet fra stevnen uten fart hang den igjen i lufta som runde klatter bak båten).

**Ikke løst her:** fisket inne i havna i kuling (spilltest r2 «knekk» A). Havna blir roligere, slik den er i virkeligheten, så det trenger en egen regel. Bildetakten på nettbrettet er ikke målt. SwiftShader går rundt 2 bilder/s og kan ikke skille.

**Kilder:**
- WMO-tabellen over Beaufort og bølgehøyde (NOAA WPC, Hong Kong Observatory)
- Hasselmann m.fl. 1973 (JONSWAP)
- Shore Protection Manual 1984 / CEM (effektiv strøklengde)
- Monahan og O'Muircheartaigh 1980 (skumtopper)
- SNL «Beauforts vindskala», «frisk bris», «liten kuling»
- met.no / SNL «sjøgang» (Douglas-skalaen)

## 5.20b Nærfeltet: den korte sjøen i båtens ramme (19.10.2026)

**Problemet:** verden går 6× (`GAME_RATE`), bølgene går i ekte tid (det ser riktig ut), men båten flytter seg 6× fortere over bølgefeltet enn den gjør gjennom sjøen. Den korte sjøen (vindsjøkomponent 4–9, bølgelengder 6–27 m), krusningene og skumflekkene strøk forbi skroget seks ganger for fort, og baug- og hekkbølgen møtte dem feil. Jonas 18.10.2026: samspillet mellom sjø og fartøy skal være så realistisk som mulig; valget ble å la verden gå 6×, bølgene i ekte tid og den korte sjøen i båtens ramme.

**Løsningen** (`view3d.js`, `NF`, `nfStep`): den korte sjøen, krusningene og skummet flyttes med båten med andelen R = 1 − 1/`simRate()` (5/6 ved 6×) av båtens forflytning per bilde, som faseforskyvning per bølgekomponent (`uNFp`, med Gerstner-forskyvningen `uNFg`) og som posisjonsforskyvning `uNFD` for krusninger og skum. Forskyvningene regnes eksakt og modulo 2π, så ingen presisjon tapes over lange turer (`uNFD` brytes ved 65 536 m når båten ligger stille). De lange bølgene (0–3) og dønningen (10–12) står fast i verden. CPU-speilet `seaDisp`/`seaH` bruker de samme forskyvningene, så hiv, bøyer og NPC-er stemmer med det som tegnes. Et hopp over 300 m (teleport) tas ikke med. `#nf0` i adressen slår nærfeltet av (`G3._debug.nf`). Kontrollbilder fra kino- og brovisningen med og uten (11 m/s fralandsvind vest av Senja) viste skroget riktig i sjøen begge veier.

**Ikke løst her:** skummet i kjølvannet og baugbølgen var alt i båtens ramme. Resten av fysikkplanen (manøvreringsmodell, bølgekrefter, skade) står i 5.58.

## 5.20d Skummet i vannet, båtens bølger i sving og revers, og skumtopper i le (Jonas 29.10.2026, Bleik)

Jonas sendte bilder fra Bleik: propellskummet drev som en rett strek rett gjennom moloen, båtens bølger svingte ikke med skummet, og det var skarpe flekker i vannet langs land og på grunnene.

- **Skummet ligger i vannet** (`foamStep` i `14-sea.js`, `FOAM_FS`): kjølvannets skum (r, g i skumkartet) lå i nærfeltets ramme (5.20b), som følger båten med 5/6 av farten, så hele sporet gled med i hver sving. Nå flyttes det hele teksler hvert bilde (`uShiftG`) så det ligger fast i vannet der båten var, og vannet driver med strømmen (`curAt`: tidevannsstrømmen og vinddriften, langs land nær land) i spillets tempo. Skum på land (strandteksturen, `buildLandMask`) slettes. Skumtoppene (b, a) ligger som før i nærfeltets ramme. Levetiden er 14 s (et spor på rundt 150 m i full fart i spillets 6x).
- **Bølgene følger sporet** (`WAKE_GLSL`, `wakeTrack`): kilden (hekken forover, baugen akterover, ut fra båtens egen vei mellom bildene) husker veien sin, og Kelvin-mønsteret regnes langs de sju bitene av den (`uWkT`, `uWkS`) i stedet for langs en rett linje bak hekken. Farten er manøvreringsmodellens når båten styres for hånd, også bakover.
- **Skumtopper etter vindstrekningen der du er** (`FETCHG` i `01-shaders.js`): tilstanden til sjøen kjenner vindstrekningen på 190 m-ruter, så et havnebasseng fikk havets. Seks blikk opp mot vinden i strandteksturen (30-960 m) gir strekningen, og den minste av de to gjelder, både i sjøskyggeren og i skumkartet.
- **Det turkise uten kant:** der strandteksturen slutter, gikk dybden brått over til nettets; nå glir den over mellom -4 og -1,5 m.
- `tests/wakeshot.py` kjører båten for hånd utenfor Bleik (forover, hard sving, revers) og tar bilder ovenfra; kvaliteten holdes på Høy (`#qfix`), fordi skumkartet er av på Lav.

## 5.20e Båten i sjøen etter farten: planing, sprøytevinger, tørr hekk og turkis kjølvann (Jonas 04.11.2026, referansevideo)

Jonas sendte en video ovenfra av en sportsfiskebåt i planingsfart (rundt 25 knop) og ba om at den ble brukt til å gjøre spillet bedre, med at «ikke alle båtene er kjappe, så hvor fort båten går må tas i betraktning». Analysen av videoen: baugen er tørr; sprøyten starter midtskips og kastes flatt ut av knekken og sprutlistene som to hvite vinger; vannet slipper rent fra hekken og etterlater en mørk renne midt bak, mellom de hvite stripene fra hjørnene og propellene, som slår sammen til en hanekam noen bredder bak; kjølvannet er smalt; og boblene lyser turkist under overflaten der skummet på toppen er tynt.

Alt styres av Froude-tallet Fr = v/√(gL) (lengden fra `VESSELS`, farten gjennom vannet) og av `planing`, så en sjark i 7 knop og en tråler i 13 er som før:

- **Hvor langt hun er oppe på planet** (`WK.pf` i `updateWake`, `pf` i `FOAM_FS`): 0 under Fr 0,6 og 1 over 1,2, bare for typer med `planing`. En deplasementsbåt får 0 i alle farter.
- **Kjølvannets vinkel** (`WAKE_GLSL`, `wakeHFast`): skråbølgenes kam ligger i 19,47° til Fr ≈ 0,55 og trekker seg inn som 0,2/Fr over det (Rabaud og Moisy 2013, α = 1/(2√(2π)·Fr)): rundt 9° ved Fr 1,25. Sakte båter er som før.
- **Tørr baug og sprøyterot** (`FOAM_FS`): vasken langs skutesida starter ved roten, 6 % av lengden akter for stevnen i ro og 40 % på planet. Baugbølgen (`Ab`, `uWk3.x`) tones ned med 85 % av `pf`.
- **Sprøytevingene** (`FOAM_FS`): hinnen lander rundt en båtbredde ut fra skroget, så skummet ligger som to hvite vinger med mørkere vann mellom dem og vasken bak hekken (ujevn kant, lagt der hinnen har nådd landingslinja). Et første forsøk med skum fra skroget helt ut til en kant som åpnet seg 18° ble ett bredt, hvitt felt, fordi skumkartet holder på alt det sveipet legger igjen. `drawEffects` (`24-cinema.js`) kaster samtidig en tynn, flat sprøytehinne fra roten (90 punkter i sekundet ved full planing, en tredel av farten ut til sidene, borte på et halvt sekund), også i stille vann. Før kom sprøyten på planet bare i krapp sjø.
- **Smalere vask på planet:** vasken langs skutesida og bak hekken var flere meter bred for planende skrog (`pl`), og i skumkartet ble det ett bredt, hvitt felt bak båten (også før denne endringen). Bredden for planing tones ned med 80 % av `pf`, så vingene og renna synes.
- **Tørr hekk** (`tv`, Fr 0,45–0,9, alle skrog): en mørk renne en halv båtbredde bred midt bak hekken, rundt tre bredder lang, som lukker seg i en hvit hanekam. Skummet under akterskipet tones ned, så renna ikke fylles av det som lå der. En deplasementsbåt når knapt Fr 0,45 og får nesten ingenting.
- **Trim og løft** (`16-motion.js`): fra Fr, ikke knop. Planende: opp mot 6° ved puklen (Fr 0,5–0,7), ned mot 3° på planet, løftet 1,5 % av lengden. Deplasement: 1° baug opp og litt nedsynking (squat) nær skrogfart (Fr 0,35–0,45). Før fikk en 60 m tråler i 13 knop 2–3° trim.
- **Turkis under skummet** (`SEA_FS`): der kjølvannets skum er tynnet (eldre enn et halvt til fire sekunder og ikke hvitt på toppen), blandes vannet mot turkis med styrke etter mengden; det melkehvite er svakere enn før.

Kontrollbilder ovenfra: `docs/pr/ccr-d8829db0-ldggvz/` (`andre_baater.png`: hurtigsjarken i 25 og kyst15 i 10 knop forbi en skiff som ligger stille, med falmetiden satt til 300 s og 4 m per bilde for at SwiftShader skal vise sporet; `foer_etter_planing.png`: den nye hurtigsjarken i 25 knop før og etter; `sakte_baater.png`: hurtigsjarken i 12 knop, kyst15 i 10 og trebåten i 6, som ikke får noe av det nye). Bildene er tatt i SwiftShader, der et bilde varer sekunder og sveipet legger igjen lange strekk av gangen; falmingen og formen nær båten må ses på nettbrettet.

- **De andre båtene får kjølvann** (04.11.2026, `foamNPC` i `14-sea.js`, `hullFoam` i `FOAM_FS`): før seilte flåten, kystruta, ferja og de andre spillerne uten kjølvann i det hele tatt. Nå legger de seks nærmeste med fart (over 1,5 knop, ikke i havn eller under fiske, innenfor skumkartet) skum i kartet etter samme regnestykke som din båt: lengde og bredde fra `n.L`/`n.B` (kystruta 35 m og ferja 70 m når de mangler), farten gjennom vannet fra `n.v`, og `planing` fra typen modellen deres tegnes som (`npcType`). Origo regnes midtskips. Hver sveipes fra der den var forrige bilde (`NPF`). Kelvin-armene og sprøyten i lufta får de ikke. Hver båt tegnes i et eget pass etter skumkartets (`NPCF_VS`/`NPCF_FS`, samme `HULLFOAM` som din båt) over et lite rektangel rundt veien den har gått siden forrige bilde, med MAX-blanding, så et hav uten båter nær koster ingenting. Første forsøk regnet de seks skrogene i skumkartets eget pass for hver texel; da ble SwiftShader så treg at `wakeshot` gikk ut på tid (skjermbildet), også uten båter i nærheten. Med MAX-blanding beholder mengden og fødselen ganger mengden hver sin største verdi, som ligger nær regelen i `FOAM_FS` (det sterkeste nå vinner). Av med `#npcfoam0`, og der MAX-blanding mangler (WebGL 1 uten `EXT_blend_minmax`, `G3._debug.npcFoam.why`).
  - **Hvite firkanter på Adreno** (tilbakemelding #110 og #111, PR #42, flettet 05.11.2026): `HULLFOAM` brukte `pow(x, 2.0)` der `x` kan være negativ (vingene og hanekammen bak hekken). Det er udefinert i GLSL, og Adreno gir NaN, som `NPCF_FS` skrev rett i skumkartet over hele rektangelet rundt båten. Nå brukes `hfSq(x) = x*x` der, og `NPCF_FS` klemmer verdien til 0–1 og gjør NaN om til 0 før den skrives. Kjølvannet har samme form. SwiftShader gir ikke NaN her, så firkantene kunne ikke vises i testene, og rettingen er ikke sett på et Adreno-nettbrett.
- **Tynnere vask bak en deplasementsbåt** (04.11.2026): med våt hekk og uten planing er båndet bak hekken 0,45 sterkt i stedet for 0,7, og skummet under akterskipet 0,3 i stedet for 0,5. Det falmer tidligere og blir flekkete i stedet for jevnt hvitt (kyst15 i 10 knop la et jevnt felt på flere hundre meter).

**Ikke gjort:** tvillingpropeller som to egne striper (nesten alle båtene i spillet har én propell, så de to stripene fra hekkens hjørner er det som synes); renna som en forsenkning i geometrien (sjøens rutenett er 2–4 m og for grovt); sprøyten i lufta og Kelvin-armene fra de andre båtene.

## 5.20c Skumkartet: skummet som blir liggende i sjøen (Fysikk 4, F1, 27.10.2026)

Jonas 27.10.2026 (`docs/planer/fysikk-4-sjo-og-skrog.md`, valg 3A og 7A): kjølvannet og skummet først. Før var skummet bare det hvert bilde selv laget: skumtoppene over terskelen og kjølvannets brytning ved skroget, og sporet to tynne striper (`TRAIL`) som var borte etter 10 s. I sjøen blir skum liggende: vasken et skrog legger fra seg er hvit i titalls sekunder og hundrevis av meter, og skummet fra en kam ligger igjen og drar ut i striper med vinden (videoene fra chillboats.game).

**Kartet** (`view3d/14-sea.js` `FOAM`, `foamInit`, `foamStep`, `foamBind`; skyggerne `FOAM_VS`/`FOAM_FS` i `01-shaders.js`):
- To teksturer (RGBA8, ping-pong) over 600 m rundt båten, 1024 × 1024 texler (0,59 m) på Høy og Ultra, 512 under. Kartet ligger i nærfeltets ramme (`Pb = P − NF.D`, 5.20b: vannet den korte sjøen og skumflekkene følger), så sporet legges igjen i båtens ekte fart gjennom vannet, ikke skjermens 6×, og blir liggende der når hun stopper.
- Hver texel: kjølvannets skum (mengde, fødsel · mengde) i r og g, skumtoppenes i b og a. Fødselen lagres ganget med mengden, fordi sjøskyggerens bilineære oppslag ellers blander fødselen i et smalt spor med nullen i tomme naboer, så kanten ble «eldgammel» og sporet usynlig (funnet 27.10.2026 med tellingen i `G3._debug.foam.log`). Fødselen er en andel av et vindu fra kartets `t0` (kjølvannet 160 s, skumtoppene 32 s), rullet 128/255 av vinduet når bildets tid passerer 0,95 av det, så en fødsel alltid er en hel texelverdi; eldre skum faller bort ved rullingen. Alderen regnes når det tegnes: mengde · e^(−alder/τ), τ 20 s for kjølvannet og 3,5 s for skumtoppene (3–7 s etter vinden fra F3, 5.20g).
- Hvert bilde (`foamStep`, etter `updateWake`): det gamle kartet tegnes inn i det nye flyttet med de hele texlene vinduet har gått (ingenting slører, 8 bit holder), og `FOAM_FS` legger inn skummet som lages nå, der det lages: vasken langs skroget (skrogets omriss av `VESSELS`-målene og `GEO`, sveipet langs veien hun kom siden forrige bilde, så et tregt bilde ikke gir hull), vannet hekken etterlater (en båtbredde, 6 m bak), hekkbølgen som bryter langs Kelvin-armene og baugbølgen (`wakeH`, samme terskler som sjøskyggeren), og skumtoppene (samme kam, støy og Monahan-terskel som sjøskyggeren, bare kammene godt over terskelen; fra F3 kammene som bryter, etter Jacobi-determinanten, 5.20g). Nytt skum over gammelt: det som er sterkest nå, vinner og fødes på nytt.
- Sjøskyggeren leser kartet med ett oppslag (enhet 7) i nærpassen: kjølvannets skum tett ved skroget, brutt opp i bobler og striper av støy som ligger stille i vannet (`n1`, `n2` av `Pb`) etter hvert som det tynnes; skumtoppenes skum som halen en kam legger igjen etter at kammen selv (som skyggeren tegner som før) er forbi, dratt ut langs vinden (`n3`); vannet under tynt skum melkeaktig av bobler.
- Når kartet er på, tegnes ikke de gamle stripene i `drawEffects` (`WKB`); boblene fra propellen er som før. `SEA_VER` ble `u2`, så alle enheter prøver den fulle sjøen på nytt.
- **Av:** `#foam0` i adressen (sammenligning; skjult, som `#nf0`), den lette og den enkle sjøen, lavt kvalitetsnivå (fjernskyggeren tegner den nære sjøen der), og når ingen rammebuffer kan lages (`FOAM.why`, til skyen som «3D skumkart av»). Ved et hopp over 300 m (teleport, innhenting) og ved kartets første bilde nullstilles kartet.
- **Kostnad:** passet er 1024² texler med 10 bølger per texel for skumtoppene, rundt en firedel av sjøskyggeren; CPU-tiden i `foamStep` er 0,1–0,4 ms. Ikke målt på nettbrettet ennå: Jonas måler med `#fps` i samme vær som nullpunktet (71 bilder/s, kapittel 10 i planen), og tallet føres inn her.

**Testing:** Playwrights `screenshot` under SwiftShader fryser siden i 1–2 minutter; båten hopper kilometer når den våkner, og kartet nullstilles som ved teleport, så bildene viste aldri sporet. Bilder av kartet tas med spillets eget `G3.snap(w)` (ingen frys), og kartet leses tilbake med `readPixels` på `FOAM.fb[FOAM.r]` (`G3._debug.foam`). Under SwiftShader varer et bilde 2–20 s, så sveipet legger hele strekningen fra forrige bilde inn med samme fødsel, og bildene kan ikke vise selve falmingen (sporet ender tvert der et langt bilde begynte). Falmingen er regnet, ikke sett: mengden er e^(−alder/24 s), tett hvitt i 0–15 s, tynt ved 30 s, borte ved 45 s (tonen i vannet litt lenger), som gir 330–370 m bak skiffen i 18 knop og 150–175 m bak sjarken i 8,5 (målene i planen: 300 og 150). Tilbakelesing 27.10.2026: kartet beholder sporet når båten stopper (6 491 texler og full linje 0–250 m to sekunder etter stopp), og rullingen av vinduet kaster bare skum eldre enn 80 s. Jonas ser falmingen på nettbrettet.

**Ikke gjort i F1:** NPC-båtene lager ikke skum i kartet; sprøyten legger ikke inn skum der den lander; brytning med Jacobi-determinanten og kalibreringen av skumtoppene (F3, 5.20g).

## 5.20g Brytningen og spekteret (Fysikk 4, F3, 07.11.2026)

Jonas' valg 27.10.2026 (1A, `docs/planer/fysikk-4-sjo-og-skrog.md`): Gerstner-summen forbedres i stedet for FFT. Før F3 satt skumtoppene som glatte, hvite flekker på 5–10 m (20–30 m i kuling) på de høyeste kammene og forsvant med kammen, og sjøen i kuling så ut som glatte åser (kap. 9 i planen). Nå bryter bølgene der overflaten presses sammen, skummet blir liggende bak kammen og driver med vinden, og spekteret er JONSWAP med retningsspredning etter bølgealderen. Filene: `view3d/01-shaders.js` (`WCAP`, `WCAPS`, `qOf`, `SEA_WAVE`, `SEA_FS`, `FOAM_FS`) og `view3d/14-sea.js` (`specW`, `spreadSd`, `WOFF`, `seaQ`, `FOAM.capAt`, `foamStep`).

- **Brytningen etter Jacobi-determinanten:** Gerstner-forskyvningen presser overflaten sammen ved kammen; J (determinanten av forskyvningens Jacobi-matrise) faller mot 0 der kammen blir spiss (J ≤ 0 er en kam som slår over). For en sum av Gerstner-bølger er J analytisk, tre summer per bølge i pikselskyggeren (`jxx`, `jxz`, sporet), J = (1 − jxx)(1 − jzz) − jxz². Skummet lages der sammenpressingen 1 − J, regnet i standardavvik av sin egen spredning (`capJ`), pluss de korte bølgenes egen sammenpressing (bølge 4–9, 6–27 m, så skummet samler seg på de korte kammene oppå de lange og ikke over hele bredden av en lang kam, som ga flekker på 15–20 m i første forsøk), litt av kammens høyde (de store kammene i bølgegruppene bryter først) og skummets korn, går over terskelen. Terskelen følger brattheten: i ung, bratt sjø bryter en kam ved høyere J enn i utvokst sjø. På Husøy-feltet (utvokst sjø) faller J aldri under 0,78 i 8–25 m/s, så terskelen er relativ, slik planen sa: andelen er Monahans.
- **Kalibrert mot Monahan** (W = 3,84·10⁻⁶·U^3,41, Monahan og O'Muircheartaigh 1980): terskelen er tilpasset den målte spredningen av verdien gjennom normalkvantilen z av andelen (`capTh`: −0,0044 + 0,3562·z − 0,0083·z², avvik ±0,02 over 8–25 m/s), og kammene som bryter, er andelen `WCAP.k` = 0,7 av Monahans dekning; resten er skummet de legger igjen (halen under). Målt med skumkartet simulert i 30 bilder/s (CPU, skyggerens egen formel for å legge og tegne, tre felt på 60 × 60 m, 6 s): tegnet hvitt 0,66 % ved 8 m/s (Monahan 0,46, 1,4×), 2,2 % ved 12 (1,84, 1,2×), 7,4 % ved 17 (6,03, 1,2×) og 30 % ved 25 (22,5, 1,35×); kammene alene 0,36 / 1,44 / 3,1 / 16,7 %. Før F3 var dekningen satt rett på Monahan for kammen alene, uten hale. Tegnet i SwiftShader (`seaDbg`, skummet alene ovenfra fra 150 m, andelen over 0,5 i fire retninger, som `sea3d`): 0,95 / 1,24 / 3,8 / 8,5 / 15,2 / 35,2 % ved 8 / 12 / 17 / 21 / 25 / 30 m/s, det er 0,63–0,84 av Monahan fra 12 m/s (før F3, samme måling: 0,81 / 0,78 / 6,7 / 4,4 / 17,5 / 49,4 %, 0,35–1,18 av Monahan); ved 8 m/s teller knappene og kompasset i utsnittet med (rundt 0,4 %). SwiftShader tegner et bilde hvert 1–3 s, så halen legges i hopp og blir for kort; nettbrettet ligger nærmere simuleringen.
- **Skummets utseende** (kap. 9 i planen): kanten der kammen bryter nå, er skarp (like bred som pikselen); kammen løper videre, og skummet den la i skumkartet (F1, kanal b og a), blir liggende bak som en hale av tråder i 0,3–3 m korn som strekker seg langs vinden og tynnes ut med alderen (færre tråder, ikke gråere). Levetiden følger bruddets størrelse (skum fra store brudd varer lenger, Callaghan, Deane og Stokes 2013): τ = 3 s i frisk bris til 7 s fra liten kuling og over (`FOAM.tau[1]`, før 3,5 s i all vind), så de små kammene ved 8 m/s legger korte haler. Kornet (`capGrain`) er tre oktaver støy på 3,3, 1,1 og 0,35 m; den fineste tones bort der en piksel er større enn rundt 0,1 m. Før var støyen 3–8 m og kammens høyde det som avgjorde, så flekkene ble glatte og like store i all vind.
- **Skummet driver med vinden:** skumtoppenes skum i kartet flyttes med vinddriften på vannet, 3,5 % av vinden i ekte tid (som bølgene), i hele teksler (`FOAM.Cw`, `uShiftC`), og kornet i halen tegnes i rammen det driver i (`uFoamCw`).
- **Sjørokk fra kammer som bryter, fra Beaufort 7** (13,9 m/s; før jevnt fra 17,2 m/s, partiklene i `driftSpray`): et tynt slør av sprut som vinden river av kammen, lagt noen meter le for kammer som brøt det siste sekundet (to oppslag i skumkartet 2 og 4,5 m opp mot vinden), med striper som farer med vinden. Partiklene i lufta (`driftSpray` i `24-cinema.js`) er som før, fra Beaufort 8: fila var F2s mens F3 ble bygd. `FOAM.capAt` gir det som trengs for å kaste dem fra kammene som bryter (backloggen).
- **Spekteret: JONSWAP** (Hasselmann m.fl. 1973; γ = 3,3, σ 0,07 under toppen og 0,09 over) i stedet for den log-normale toppen (0,75 bred i ln L) med et gulv på 0,06 for de korte bølgene (`specW`). Hver komponent bærer energien i sitt eget bånd, a = √(2·S(ω)·Δω), Δω fra naboene, regnet i logaritmer så en topp langt fra komponentene aldri går til null. Bak toppen gir ω⁻⁵-halen hver komponent samme helning (k·a), slik den korte sjøen er; gulvet ga de korte bølgene opptil fem ganger for stor helning i en utvokst sjø og for lite energi i båndet 10–40 m. Ved 12 m/s utvokst er bølgene på 20–40 m nå 2–3 ganger høyere enn før.
- **Retningsspredningen** cos^2s(θ/2) per komponent etter Hasselmann m.fl. 1980 (JONSWAP-målingene): s = 6,97·(f/fp)^4,06 under 1,05·fp og 9,77·(f/fp)^μ over, μ = −2,33 − 1,45·(U/cp − 1,17), standardavviket √(2/(s + 1)) (Kuik m.fl. 1988), og hver komponent ligger på sin plass i spredningen (`WOFF`, nå i standardavvik, ±1,25 rad på det meste). Bølgealderen U/cp er fra toppen båtens egen strøklengde gir (`WV.ia`), og glir som sjøen. **Avvik fra planen:** planen sa «ung sjø smalere»; både Hasselmann (μ blir mer negativ når U/cp vokser) og Mitsuyasu m.fl. 1975 (s_max = 11,5·(U/cp)^−2,5) gir *bredere* spredning i ung sjø, og bølgene nær toppen holder seg nærmest vinden. Spillet følger kildene. Ved 12 m/s utvokst ligger bølgene nå 0–72° fra vinden (de korte mest), før 0–64° i fast mønster.
- **Brattheten Q etter bølgealderen:** én Q for alle vindbølgene på et sted (`qOf`, `seaQ`), satt så den samlede sammenpressingen Σ Q·k·a aldri går over grensen: 0,85 i ung sjø i frisk vind (nær kammen som slår over) og 0,6 av det i utvokst sjø, som er rundere. Før hadde hver bølge sin egen Q = 0,07/(k·a) (høyst 0,7 i sum) i all sjø. `seaH` på CPU regner det samme, så skroget og bøyene stemmer med det som tegnes.
- **Vindkastene og kattepotene driver med vinden** (5.61, funnet 19.10.2026): vindkastflekkene gikk mot vinden i 1,2 m/s, kattepotene mot vinden i 38 m/s (0,5/0,013). Nå går begge med vinden, vindkastene i 1,2 m/s og kattepotene i 2 m/s.
- **Fjernpassen** (sjøen utenfor det nære terrenget) beholder kammens høyde og 3–8 m-støyen, som planen sa; den har bare de fire lengste bølgene.
- **Følgen for skroget (målt, ikke rettet):** med JONSWAP har båndet 15–40 m 2–3 ganger mer energi, og det er der rulleperiodene til de små båtene ligger (trebåten 2,9 s ≈ 13 m, sjarken 4,2 s ≈ 27 m). Rullingen i 3D (`16-motion.js`, bølgehellingen over vannlinjeplanet, Ikeda; ikke endret) tvers av sjøen i 50 s, RMS / største utslag: trebåten 2,9°/7° → 4,2°/11° ved 8 m/s, 3,4°/11° → 5,4°/12,5° ved 12 og 6,7°/20° → 7,6°/21° ved 17; sjarken 4,7°/13° → 5,7°/13°, 4,1°/10° → 9,0°/21° og 6,7°/16° → 14,6°/29°. Sjarken i 3,8 m sjø (12 m/s) ruller altså rundt 18° signifikant mot 8° før (målet 19.10.2026 i `fysikk-og-styring.md` var 10°, kjernens `motionAt` sier 6°). Det er rimelig for en båt på 10 m tvers av en så krapp sjø, men rulledempingen bør ses på med den nye sjøen; den hører til F2 (steg 14), som bygges samtidig, og står i backloggen. Fra et lavt kamera skjuler kammene også en liten båt oftere i 3–9 m sjø (skjermbildene).
- **Skyggerne:** sjøens pikselskygger 19 343 → 22 072 tegn (+14 %), hjørneskyggeren 7 765 → 7 885, skumkartets 13 332 → 15 313. Summen Σ k·w for Q kommer som én uniform (`uSeaK`, satt i `foamBind` og `foamStep`), ikke 20 oppslag per piksel. Hver bølge står nå på sin egen linje i kilden, så den lengste linja i alle skyggerne gikk ned fra 11 833 til 8 479 tegn (skumkartets; sjøens fra 8 126 til 7 527, hjørneskyggerens fra 6 787 til 3 198). Ingen nye uniform-tabeller og ingen løkker over dem (Adreno 642L, 5.20). `SEA_VER` er ikke endret (`18-setup.js` var Ø3a sin mens F3 ble bygd, og valget om å la telefonene som ble satt ned, prøve den fulle sjøen igjen, venter på Jonas), så en enhet som har lært at den fulle sjøen ikke lenkes, beholder sin lettere sjø.
- **Bildetakten** (SwiftShader, 800 × 500, Høy, på Husøy-feltet, `G3.prof` med GPU-tidtakeren): den nære sjøens GPU-tid per bilde 501 → 484 ms ved 12 m/s og 505 → 523 ms ved 25 m/s (−3 og +4 %, innenfor det SwiftShader varierer), oppdateringen med skumkartets pass 285 → 288 og 271 → 275 ms, fjernsjøen 22 → 21 ms. Første forsøk, med Σ k·w summert i hver piksel i stedet for som uniform, var 518 og 577 ms (+3 og +14 %). SwiftShader sier ingenting om nettbrettets tall, bare forholdet; Jonas måler med `#fps` mot nullpunktet (71 bilder/s, kap. 10 i planen).
- **Av:** `#foam0` slår av skumkartet som før (da er det bare kammene som bryter, uten hale og sjørokk); det nye spekteret og brytningen har ingen egen bryter.

**Ikke gjort i F3:** to komponenter til mellom 6 og 20 m (bildene krevde det ikke: JONSWAP-halen ga båndet 10–40 m energien det manglet); sjørokkpartiklene fra kammene som bryter (`24-cinema.js`); målingen på nettbrettet (Jonas, `#fps` mot nullpunktet).

## 5.61 Skyene i ekte tid (#352, 19.10.2026)

Skyene på himmelen (`cp` i himmelskyggeleggeren) driver med vinden i skyhøyden, i ekte tid som bølgene: 1,5 ganger vinden ved sjøen (overflatevinden over sjø er rundt to tredjedeler av vinden over friksjonslaget), dreid 15° med klokka (overflatevinden krysser isobarene inn mot lavtrykket), minst 2 m/s, over et skydekke i 1 500 m (`CLD`, `cloudStep` i `view3d.js`). Forskyvningen samles opp bilde for bilde på tiden som virkelig har gått (`uCloudOff`). Før gikk skyene mot vinden i fast fart (forskyvningen var vindretningen ganger tiden siden start, lagt til prøvepunktet), og når vinden dreide noen grader, hoppet hele himmelen. Test: `tests/skytest.py` (3D, rundt 1 min): retning og fart i vind fra vest, og ingen hopp når vinden dreier 30°.

**Funnet 19.10.2026, rettet i F3 07.11.2026 (5.20g):** havskyggerens vindkastflekker (`Q = P + w*uTime*1.2`) og kattepotene (`ns(P*0.013 + w*uTime*0.5)`) drev mot vinden, kattepotene i 38 m/s. Nå går vindkastene med vinden i 1,2 m/s og kattepotene i 2 m/s.

## Fysikk 4: sjøen og skroget (plan vedtatt 27.10.2026)

Jonas 27.10.2026: «Ytterligere forbedring av vannfysikk og hvordan båten samhandler med vannet. Mål: Vannfysikk med en høy grad av realisme», med et notat om havsimulering og fire videoer fra chillboats.game. Planen står i `docs/planer/fysikk-4-sjo-og-skrog.md`, med gjennomgangen av notatet (det meste stemmer; sanntidsdata, SPH, BEM/Cummins, thrustere, hydroakustikk og kranfysikk tas ut) og bilder av dagens sjø mot videoene (kjølvannet er to tynne prikkerekker, skumtoppene glatte flekker på 5–30 m, kammene runde). Valgene: «1a, 2b, 3a, 4a, 5a, 6a, 7a, 8ok, 9a»: Gerstner-summen forbedres og FFT måles for seg; oppdrift per skrogsnitt i 3D med rull som i dag; skumkart som følger båten; kystnær sjø med shoaling, brytning og refraksjon; strøm og tidevannsstrøm som egen fase (mot anbefalingen); brottsjø sist; skummet først; konsekvensene samlet til slutt. Nettbrettet er en OnePlus Pad 3, nullpunkt 71 bilder/s og 14,1 ms på Høy i fint vær. Fasene (F1–F8) bygges én per økt og dokumenteres her og i `fysikk-og-styring.md` etter hvert.

- **Det mørke beltet langs land rettet 29.10.2026** (Jonas' bilder fra Bleik): regelen om 5 m ved linja (der en av de grove cellene rundt var land) laget et mørkt belte en grov celle bredt rundt hver holme og molo, trappete som cellene, og de grove grunnene utenfor ble en lys ring. Nå gir fjærekartet (`uLandS`) dybden helt ned til 4 m der det finnes, og dybden er minst 4 m utenfor det; de grove høydene teller bare dypere enn det. Det turkise toner da jevnt ut fra fjæra. Bilde før og etter i `docs/pr/ccr-1d00422f-gjapvb/g10/grunt_for_etter.png`.

## 5.20f Havet langt nord: klimaet, tidevannet, isen, lyset og dekningen (Havsteget H1b R5, 04.11.2026)

Jonas 04.11.2026: «Kjør på med r5 i ny økt». Planen er R5 i `docs/planer/havsteget-h1b-rammen.md` (V3 A: iskanten etter måned).

**Isen** (`core/03h-is.js`, `src/data/is.json`, `tools/is/is.py`, `.github/workflows/is.yml`, releasen `is-N`):
- **Kilden:** EUMETSAT OSI SAF, global sea ice concentration climate data record v3 (OSI-450-a, 25 km, doi:10.15770/EUM_SAF_OSI_0013), hentet fra MET Norways THREDDS-tjener i Actions. Månedsmidlene for hver måned 1991–2020 (30 filer per måned) er midlet per kalendermåned.
- **Lisensen:** produktsiden sier «Licensed under CC BY 4.0 by EUMETSAT» (funnet med søk; siden kunne ikke åpnes herfra). Filene selv har en annen tekst, som står i `is.json` (`license`): bruken er gratis for alle, og «Copyright EUMETSAT» skal stå under det som vises. Det står derfor i iskortet i Vær-appen.
- **Formatet:** spillets ramme i ruter på 25 km (144 × 119), konsentrasjonen i hele prosent, kodet med lengdekoding per måned (rundt 40–60 kB). Land og kystceller (en 25 km-celle ved land er delvis land og ga Isfjorden 30–40 % is om sommeren) får verdien fra de fire nærmeste cellene i åpent hav, så fjordene har isen utenfor. Østersjøen og Bottenviken er satt til 0 (ikke en del av planen, og ikke til å nå fra kysten).
- **I tid:** månedsmiddelet står midt i måneden, og mellom to midtpunkter går konsentrasjonen lineært. Kanten flytter seg litt hver dag og hopper aldri ved månedsskiftet (høyst 1,7 prosentpoeng per dag). I rommet er den bilineær mellom rutene.
- **Grensen:** 40 % (`SEA_ICE_LIM`). WMOs isnomenklatur (WMO-No. 259) har «svært åpen drivis» på 1–3/10 og «åpen drivis» på 4–6/10. Grensen er nedre kant av åpen drivis. Tallene er funnet med søk i Canadian Ice Service' sider som gjengir WMO; WMO-dokumentet selv er ikke lest. Ved 10 %-trinn sto hele felt på nøyaktig 40 % og krysset grensen samme dag, derfor 1 %.
- **Isklassen** (H3c, 06.–07.11.2026, V3 B i `docs/planer/havsteget-h3-snokrabbe.md`; Jonas 06.11.2026: «V3: B»): `VESSELS[...].iceClass` er en grense for konsentrasjonen klassen tåler (`ICE_CLS`, `seaIceLim`), ikke fri gange som før: 1C 60 %, 1B 70 %, 1A 80 %; uten klasse 40 % som før. Bare snøkrabbefartøyet har isklasse (1C, antatt for et 50 m fartøy fra 2001: Frøyanes har Ice 1B, Polarbris ICE-C, Prestfjord Ice 1B; Polar Pioneer, Arctic Pioneer og Kvitungen har ingen oppgitt, søkeutdrag). Ingen kilde gir en grense i prosent for et fiskefartøy: fra 1.1.2026 følger fiskefartøy fra 24 m bare kapittel 9-1 og 11-1 i polarkoden og trenger ikke Polar Ship Certificate (søkeutdrag). Tallene er regnet med polarkodens POLARIS (RIO = 3 · åpent vann + Σ C · RIV ≥ 0 for vanlig drift) i middels tykk førsteårsis under 1 m, slik isen er ved kanten i Barentshavet: RIV −2 for IC gir 6/10, −1 for IB om lag 7/10; risikoverdiene er slik vi husker tabellen i MSC.1/Circ.1519, ikke lest i kilden (kap. 5 i planen). Autonav (`leiaIceSet` med `lim`), seilasen (`groundCheck`), kartplotteren (isen tegnes også for en båt med isklasse, og kanten ved hennes grense) og iskortet i Vær-appen følger grensen. Redskapet tåler mindre is enn skroget: snøkrabbelenkene har egne grenser (`SNOI`, 5.69 i `redskap.md`). NPC-flåten (`05d-hav.js`) bruker fortsatt 40 % for alle, også snøkrabbefartøyene (backloggen).
- **Det som stenger:**
  - Autonav (`11-route.js`): cellene og beina med isen over grensen ved planleggingen og ved antatt framkomst (rett linje i marsjfart pluss en tredjedel og 4 t, høyst 10 døgn), og vannet ved kanten er litt dyrere (opptil +2 per km), så veien holder seg unna. Et mål i isen avvises med grunnen (`Målet ligger i drivisen (n/10)`).
  - Seilasen (`groundCheck`, `01-world.js`): hver 50 m. Punktet merkes `ice`, og båten stopper og finner en vei rundt (`sailReplan`) i stedet for å gå på grunn. Fant den ingen, ligger den stille med grunnen i loggen.
  - Rorstyringen (`16b-dyn.js`): båten stopper ved kanten og går ikke på grunn.
  - En båt som alt ligger i isen (isen kom over henne), får gå mot tynnere is, aldri lenger inn. Autonav lar henne gå gjennom is opp til det hun ligger i.
- **Det som vises:** drivisen i kartplotteren (hvit der den stenger, svak der det er litt is), og et iskort i Vær-appen når det er is der båten er.
- **Målt** (`is-2`, midt i måneden, mars/september): Kong Karls land 90/0 %, Hopen 60/0, Storfjorden 80/0, Petsjorahavet 80/0, Øst-Grønland ved 70° N 70/0, Danmarkstredet 66,5° N 27° V 10/0, Bjørnøya 10/0, Isfjorden 10/0. Ingen av spillets 372 havner har is noen måned.
- **Tester:** `tests/unit/is.test.mjs` (stengt i mars ved Kong Karls land, åpent i september, ingen hopp mellom dagene, havnene åpne, isklassen, seilasen og Autonavs sjekker) og `tests/istest.py` (Autonav rundt isen, et mål i isen, isklassen, kartplotteren og Vær-appen).

**Klimaet** (`klima-8`): 13 nye punkter i `tools/climate/klima.json` (Bjørnøya, Hopen, Longyearbyen, Kvitøya, Sentralbanken, Smutthullet, Petsjorahavet, Jan Mayen, Nord-Island, Danmarkstredet, Færøyane, Vikingbanken og Shetland), ute på sjøen ved øyene. `fetch.py` beholder punktene som alt står i `src/data/climate.json` og henter bare de nye. Under isen har marine-API-et ingen sjøtemperatur; da får månedene med is frysepunktet for sjøvann (−1,8 °C). I `klima-8` hadde alle punktene sjøtemperatur hele året (Hopen −1,9 °C i april, Kvitøya −1,5 °C i mai), så regelen ble ikke brukt. Lufta i mars: Hopen −9 °C, Kvitøya −15 °C, Longyearbyen −13 °C, Petsjorahavet −7 °C, Shetland 6 °C. Longyearbyens rute har lite vind (sterkeste vind 5 m/s i snitt), fordi ERA5-ruta ligger over fjorden og fjellene.

**Tidevannet:**
- Kartverket (`tools/tide/points.json`, 18 nye punkter) svarte for Longyearbyen, Ny-Ålesund og to punkter ved Jan Mayen. Resten av Svalbard, Bjørnøya og Hopen svarte «data not good enough» eller «no sea level data». `fetch.py` beholder de gamle punktene og henter bare de nye.
- Åpent hav og utenlandske kyster: den globale modellen EOT20 (Hart-Davis mfl. 2021, DGFI-TUM, SEANOE doi:10.17882/79489, CC BY; nord for 66° N fylt fra FES2014b av forfatterne) i `tools/tide/eot.py`. For et gitter på 150 km over rammen, mer enn 60 km fra et Kartverket-punkt, spås et år time for time med nodalfaktorene, og spillets konstanter tilpasses som for Kartverkets. Middelvann over sjøkartnull er årets laveste vann. Releasen `tide-8` har 449 punkter (143 fra Kartverket, 306 fra EOT20). Der modellen og Kartverket møtes, stemmer M2 innen 0,03–0,16 m og fasene innen 1–14° (Ny-Ålesund M2 0,41 mot 0,44 m), så omregningen til spillets argumenter er riktig. Kvitsjøen og Mezenbukta får opptil 7 m forskjell, Østersjøen nesten ingenting.

**Lyset ved 80° N** (`tests/unit/sol.test.mjs`): midnattssol 21. juni (sola 13,5° oppe ved midnatt) og mørketid 21. desember. I Longyearbyen kommer mørketida og midnattssola innen noen dager av almanakken (sola opp 21. oktober og 20. februar, mørketid 31. oktober og 10. februar, midnattssol 25. april og 19. august, ikke 14. april og 29. august). Sola står i sør (sann retning) når den står høyest, også ved Kvitøya der γ er 17°. Nordlyset kan komme i mørketida i Longyearbyen (`need` er 0 nord for 67° N) og aldri i midnattssola. Rettet: `auroraAt` leste skyene der båten er, ikke der nordlyset sees.

**Dekningen** (`coverage`, `core/06-services.js`): uendret langs fastlandet (ingen streker 20 km eller mer fra land). På Svalbard, Bjørnøya, Hopen og Jan Mayen går strekene etter avstanden til bosetningene (Longyearbyen, Barentsburg, Ny-Ålesund, Svea, og stasjonen på Jan Mayen med kortere rekkevidde), ikke til kysten, fordi det meste av øygruppa ikke har mobilnett. Et anslag, se BACKLOG 10.3.

**Testene for R5** (04.11.2026, hele kysten med `kart-31`): enhetstestene 1 016 OK (`is` og `sol` nye), `istest` 5 OK, `tidetest` 10 OK, `seatest` 14 OK, `routetest` 43 OK, `trip2` ender i havn uten sidefeil. `climtest` var rød bare på at punktene er 32 og ikke 19 (Senja er nøyaktig som før); testen er rettet, men ikke kjørt på nytt. `autonavtest` ga 8 OK før den ble stoppet etter 15 minutter. Stikkprøvene langs kysten: ingen av de 372 havnene har is noen måned, tidevannet er som før ved Hvaler, Bergen, Bodø, Senja og Kirkenes, og dekningen langs fastlandet er uendret.

