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
  - To spektre, ungt (F = 1 km) og utvokst, som blandes per piksel etter hvor utvokst sjøen er.
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

  Skumtoppene dekker andelen W = 3,84·10⁻⁶·U^3,41 (Monahan og O'Muircheartaigh 1980) der sjøen har hatt 0,2–3 km å bryte på. De sitter på kammene, normalisert med eget standardavvik. Terskelen er tilpasset den målte spredningen: `0,228 + 0,293·z − 0,016·z²`, der z er normalkvantilen. Kanten er like bred som pikselen (`fwidth`), med en svak, myk rand utenfor, og flekkene inni glattes ut før de blir mindre enn et par piksler. Da hakker ikke kanten. Der skummet er for lite til å synes, blir havet hvitere i stedet. Brenningene følger sjøen som når hver strand.
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
    - Nivået som prøves, skrives ned først (`dsb_sea_try`) og slettes når sjøen er laget og konteksten fortsatt lever. Finner en lasting merket igjen, starter den ett nivå ned (`dsb_sea`) og sier fra til skyen. Slik lærer en maskin som krasjer, selv om nettleseren aldri melder at konteksten er mistet.
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
  - **Kelvin-kilen (19,47°):** tverrbølger 2πv²/g lange inne i kilen (faller som 1/√s) og skråbølger med fronter 35° på kursen (k = 1,5·k₀) langs kantene (faller som s^−1/3). De er høyest nær skrogfart (høyde ≈ 0,045·L, maks 0,6 m).
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

## 5.61 Skyene i ekte tid (#352, 19.10.2026)

Skyene på himmelen (`cp` i himmelskyggeleggeren) driver med vinden i skyhøyden, i ekte tid som bølgene: 1,5 ganger vinden ved sjøen (overflatevinden over sjø er rundt to tredjedeler av vinden over friksjonslaget), dreid 15° med klokka (overflatevinden krysser isobarene inn mot lavtrykket), minst 2 m/s, over et skydekke i 1 500 m (`CLD`, `cloudStep` i `view3d.js`). Forskyvningen samles opp bilde for bilde på tiden som virkelig har gått (`uCloudOff`). Før gikk skyene mot vinden i fast fart (forskyvningen var vindretningen ganger tiden siden start, lagt til prøvepunktet), og når vinden dreide noen grader, hoppet hele himmelen. Test: `tests/skytest.py` (3D, rundt 1 min): retning og fart i vind fra vest, og ingen hopp når vinden dreier 30°.

**Funnet, ikke rettet:** havskyggerens vindkastflekker (`Q = P + w*uTime*1.2`) og kattepotene (`ns(P*0.013 + w*uTime*0.5)`) har samme fortegn og driver mot vinden. Rettingen er et fortegn og en fart, men den endrer havet og trenger `sea3d` (15 min) og bilder før og etter.

## Fysikk 4: sjøen og skroget (plan vedtatt 27.10.2026)

Jonas 27.10.2026: «Ytterligere forbedring av vannfysikk og hvordan båten samhandler med vannet. Mål: Vannfysikk med en høy grad av realisme», med et notat om havsimulering og fire videoer fra chillboats.game. Planen står i `docs/planer/fysikk-4-sjo-og-skrog.md`, med gjennomgangen av notatet (det meste stemmer; sanntidsdata, SPH, BEM/Cummins, thrustere, hydroakustikk og kranfysikk tas ut) og bilder av dagens sjø mot videoene (kjølvannet er to tynne prikkerekker, skumtoppene glatte flekker på 5–30 m, kammene runde). Valgene: «1a, 2b, 3a, 4a, 5a, 6a, 7a, 8ok, 9a»: Gerstner-summen forbedres og FFT måles for seg; oppdrift per skrogsnitt i 3D med rull som i dag; skumkart som følger båten; kystnær sjø med shoaling, brytning og refraksjon; strøm og tidevannsstrøm som egen fase (mot anbefalingen); brottsjø sist; skummet først; konsekvensene samlet til slutt. Nettbrettet er en OnePlus Pad 3, nullpunkt 71 bilder/s og 14,1 ms på Høy i fint vær. Fasene (F1–F8) bygges én per økt og dokumenteres her og i `fysikk-og-styring.md` etter hvert.
