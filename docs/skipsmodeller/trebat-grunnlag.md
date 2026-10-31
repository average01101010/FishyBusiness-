# Trebåten: byggegrunnlaget for revisjonen (F5)

> Grunnlaget for revisjonen av startbåten `trebat` («Trebåt 23 fot (7,0 m), 8 hk semidiesel»), skriptet `tools/boats/snekke23.py`,
> etter malen i `sulebas-pilot-grunnlag.md` og arbeidsmåten i `sulebas-bygging.md`. Bestilt av Jonas 31.10.2026: «Løft den til samme
> nivå og arbeidsmåte som pilotbåten», «Mål: En mye mer detaljert modell enn vi har i dag», og: «siden dette er starterbåten i spillet
> skal den ikke ha redningsflåte eller redningsbøye og sånne ting, den skal være ganske simpel».
>
> Kildekoder: **R** skriftlig kilde, **J** Jonas' ord, **A** antatt (vanlig mål for typen, vårt valg), **M** målt på modellen.

## 1. Fakta om båten

Det finnes ingen tegning og ingen bilder av denne båten (Jonas 31.10.2026: «Jeg har dessverre ikke tegninger eller noe sånt»). Bildene
Jonas sendte 05.10.2026 av gamle klinkbygde snekker ligger ikke i repoet. Alt under er derfor data fra spillet, Jonas' ord og vanlige
mål for typen.

| Hva | Verdi | Kilde | Følger for modellen |
|---|---|---|---|
| Type | Klinkbygd spissgatter (snekke), åpen, motorkasse midtskips akter, rorkult | J (05.10.2026, `VESSELS.trebat.desc`) | Låst |
| Lengde o.a. | 7,00 m | R (`VESSELS`) | Låst; `vessel3d` krever −6 % til +3 % i båndet −0,3–1,5 m over vannlinja |
| Bredde | 2,26 m | R (`VESSELS`) | Låst; `vessel3d` krever ±5 % |
| Dypgang | 0,62 m (kjølens underkant) | R (`VESSELS`) | Vannlinja z = 0,62 |
| Deplasement | 1,9 t | R (`VESSELS`) | Sjekkes mot volumet under vannlinja (kap. 4.0) |
| Byggeår | 1956 | R (`VESSELS`) | Slitasjenivå 4 (slitt), planlisten 15.2 |
| Maskin | 8 hk semidiesel, én sylinder, 340–850 o/min | R/J | Glødehodemotor med åpent svinghjul, eksosrør opp |
| Fart | 7 kn | J | – |
| Dybde (mal) | rundt 0,90–1,0 m midtskips | R: en 23 fots klinkbygd sjark på FINN oppgir dybde 90 cm, bredde 228 cm | Ripa 1,00 m over sponningen midtskips |
| Lignende båt | Sørlandssnekke 1965, 7,01 m, Marna semidiesel | R (FINN-annonse) | Bekrefter at typen og motoren hører sammen |
| Farge | Ubehandlet gammelt treverk, tjæret bunn, ingen fendere, ikke stevnbånd | J (05.10.2026) | Malingssone 1 på bordene; ingen sone 2, 3 eller 4 (`maletest`) |

## 2. Reglene som gjelder modellen

- Ingen ekte navn, merke eller logo (CLAUDE.md); spillet skriver spillerens navn på navnefeltene (`names`).
- Bare utsiden. På en åpen båt er innsiden av skroget, toftene, dørken og motorkassen utside.
- Ingen kjøpbart utstyr modellert inn (18.10.2026): livbøya, juksa, haleren, kar, stamper og garn settes av spillet på plassene i
  `kit`, `skiff` og `work`. **Jonas 31.10.2026: ingen redningsflåte, ingen redningsbøye, «ganske simpel».** Plassene i `kit.buoys`
  beholdes (spillet bruker dem hvis spilleren kjøper en bøye), men modellen får ingen.
- Lanternene på lovlige plasser (kap. 6).
- Det spillet er avhengig av, beholdes: typenavnet `trebat`, sone 1 på bordene, delene `cap`, `prop` og `tiller` (rorkulten, roret og
  flaggstanga svinger sammen om rorhodet), og alle ankrene (`eye`, `skipperAt`, `crewSpots`, `lights`, `hauler`, `filler`, `pole`,
  `exhaust`, `engine`, `skiff` med `tiller`, `prop`, `names` m.fl., `deck`, `work` med `own`, `kit`, `bower`).

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Ombygging eller nytt skript? | **Nytt skript etter `ringnot38.py`** med de samme funksjonsnavnene som spillet og ankrene trenger (`hb`, `zs`, `sec`, `Z_FLOOR`, `anchors`). Skroget i dag er ni løse bånd som overlapper; det kan ikke rettes uten å skrive det om. |
| B2 | Skala uten bilder | Tabellene i meter i skriptet er målestokken; overlegget legges mot en linjetegning tegnet fra de samme tabellene (sjekker at modellen følger tabellene), og volumet sjekkes mot deplasementet. Det er ikke det samme som et foto. |
| B3 | Propellen | I en propellbrønn skåret ut av dødveden mellom indre og ytre akterstevn, som på norske motorsnekker; roret henger på den ytre stevnen. I dag ligger propellen inne i skroget. |
| B4 | Sidelanternene | Beholdes på ripa ved den fremre tofta, men som ekte lyktehus med skjerm. Den hvite løftes til minst 1 m over sidelanternene og flyttes ut av rorkultens sveip (kap. 6.1, runde 6). |
| B5 | «Ganske simpel» | Ingen flåte, bøye, radar, mast eller elektronikk. Detaljen legges i det som hører til en gammel trebåt: bordganger med land, nagler, spant, bunnstokker, kne, tofter, motor, ror og beslag. |

## 4. Båten sone for sone

### 4.0 Målene (tabellene i skriptet)

Rammen: x forover fra akterstevnens akterkant ved kjølen, y til babord, z opp fra kjølens underkant; vannlinja z = 0,62.

| Mål | Verdi | Kilde |
|---|---|---|
| Lengde o.a. (stevntopp til akterstevntopp) | 7,00 m | R |
| Største halvbredde ytterst på bordene | 1,13 m ved x 3,4 | R (2,26) |
| Kjølen under kjølbordet midtskips | 0,22 m | A (gir volumet, `check()`) |
| Ripa over kjølens underkant: akter / midtskips / forut | 1,58 / 1,19 / 1,74 m | A (spring 0,55 forut, 0,39 akter); dybde midtskips 0,97 m |
| Fribord midtskips | 0,57 m | A |
| Sponningen (der kjølbordet møter kjølen) | 0,22 m over kjølens underkant midtskips | A |
| Bordganger | 9 per side, 18 mm bord, 20 mm land | A (vanlig for 23 fot) |
| Spant | bøyde spant hver 0,25 m, 45 × 32 mm | A |
| Motorkasse | x 2,30–3,25, 0,84 m bred, topp 1,20 | uendret |
| Propell | Ø 0,38 m, 3 blad, nav ved x 0,43, z 0,29 | anker `prop` flyttet 1 cm |
| Propellbrønn | x 0,29–0,58, z 0,05–0,52 (4–5 cm klaring) | A |
| Ror | 0,95 m høyt blad, 0,42 m bredt nede | A |

### 4.1 Skrog
Klinkbygd spissgatter: ni bord som alle går fra sponningen i forstevnen til sponningen i akterstevnen, med landene (overlappet) synlige
utvendig og innvendig, bordene slipt flate inn mot stevnene (gangene), kobbernagler i landene og spantene, kjøl, forstevn med
krum forfot, dødved og to akterstevner med propellbrønnen imellom, ripe med skvettlist utvendig og ripebord over.

### 4.2 Innsiden
Spant, bunnstokker over kjølen, kjølsvin, dørk av løse bord med glipper, tre tofter på tofteveger med kne, fordekk med
baugband under, akterdekk (sittetofta) med hekkne, tollepinner og årer, sløyebordet over babord ripe, fars presenning.

### 4.3 Maskin og styring
Motorkasse av bord med lokk og hengsler, sylinderen med kjøleribber og glødehodet opp gjennom et ekte hull i lokket, smørekopp,
eksosrør med lyddemper opp langs styrbord side, svinghjulet akter for kassen, gir- og gasshendel ved skipperen. Ror med beslag,
rorhode med rorkult og flaggstang.

## 5. Gjennomgang før endring: avvikslista (31.10.2026)

Dagens modell rendret fra tolv vinkler (`scratchpad/t23/shots.py`, bildene `before_*.png`): 17 906 trekanter nær, 1 416 fjern.
Kravlista B1–B22 (`docs/batplan.md` del 10), planlisten og M-punktene (`kartlegging-spillet.md` kap. 6) gjennomgått.

| # | Avvik | Hvor | Alvor | Tiltak |
|---|---|---|---|---|
| A1 | **Skroget er ni løse bånd**, hvert med egne punkter; hvert bord går 1,2 % av omkretsen inn over det neste, så to flater ligger nesten i samme plan i hele overlappet (regelen «aldri to flater i samme plan») | `hull()` | H | Én glatt flate i ett rutenett, landene som en trapp i flaten (kap. 4.1) |
| A2 | **Vannlinja er firkantede flekker**: slim og tang er valgt per flate, så grensen går i trapper på 13 cm | `paint_mat` | H | Skjær skroget langs vannlinja (`bisect`), slim og tang som hjørnefarge |
| A3 | **Propellen ligger inne i skroget** (x 0,42 der skroget er 0,35 m bredt, blad 0,20 m); ingen propellbrønn, ingen aksel | `PROP`, `keel_stem` | H | Dødved med ekte hull for propellbrønnen (B3) |
| A4 | Roret er en tykk plate med rette kanter og ingen beslag, hengt løst bak den skrå stevnen | `rudder()` | M | Ror av bord med jernbeslag, rorhjerter og tapper, rorhode |
| A5 | Kjølen er 25 bokser med åpne ender i skjøtene; stevnen seks bjelker med synlige knekker; akterstevnen én bjelke | `keel_stem` | M | Kjøl, stevner og dødved som sammenhengende profiler med avrundet forkant |
| A6 | Ingen nagler, ingen ganger (bordene slutter like tykke i stevnen), ingen bunnstokker eller kjølsvin | – | M | SKR-09 for tre: nagler, ganger; bunnstokker og kjølsvin |
| A7 | **Den hvite rundtlysende står 0,84 m over sidelanternene**; COLREG vedlegg I 2(d) krever minst 1 m når den føres sammen med sidelanterner | `LAMP_W` | M | Staken høyere |
| A8 | Sidelanternene er bokser uten skjerm innenbords | `lantern_geo` | L | Lyktehus med tak, glass og skjerm (LYS-02) |
| A9 | Flaggstanga står 0,1 m til babord for rorhodet, skjev | `tiller_part` | L | I rorhodet |
| A10 | Rustrennene er tynne trekanter lagt 2 mm utenfor skroget | `deck_gear` | L | Som hjørnefarge (`wear`) |
| A11 | Motoren er en sylinder og en klump; ingen lyddemper; ingen hendler utover én | `engine` | M | Sylinder med ribber, glødehode, blåselampeholder, smørekopper, lyddemper |
| A12 | Ingen ripebord med skjøter, skvettlista er sekskantede rør med 7 cm mellomrom | `keel_stem` | L | Skvettlist som halvrund list langs flaten |
| A13 | Fjernmodellen har ingen kjøl og stevn som stemmer med nærmodellen | `build(False)` | L | Samme profiler, færre snitt |
| A14 | Ingen lensepumpe, ingen baugband og hekkne | – | L | Legges inn (SJK-08, de faste delene av en trebåt; ikke kjøpbart) |
| A15 | Trekanter: 17 906 nær er langt under det taket tillater (300 000) og det planen anslår for båter under 12 m (80 000) | – | – | Mål for revisjonen: 80 000–150 000 |

**Det som er bra og beholdes:** proporsjonene (lengde, bredde, spring), slitasjen som hjørnefarge (`wear`), presenningen, sløyebordet,
toftene og plassene for folk og utstyr.

### 5.1 Kravlista B1–B22 (før → mål)

| Punkt | Før | Mål | Merknad |
|---|---|---|---|
| B1 målte linjer, kontroll mot tegningen | ✗ (tabeller uten kilde) | ½ | Ingen tegning finnes; tabellene får kilde, volumkontroll mot deplasementet og overlegg mot linjetegningen fra tabellene |
| B2 bordganger, kjøl, propellåpning, ror, propell | ½ | ✓ | A1, A3, A4, A5 |
| B3 slingrekjøl, fendere, ripkapp, skandekk, spygatt | ½ | ✓ | Skvettlist og ripebord; ingen fendere (J), ingen slingrekjøl og spygatt på en åpen trebåt (IR) |
| B4 overbygg, dører | IR | IR | Åpen båt |
| B5 styrhusinteriør | IR | IR | Rorkult |
| B6 arbeidsdekket | ✓ | ✓ | Sløyebordet; karene settes av spillet |
| B7 master, rigg | IR | IR | Ingen mast (penshot: ingen vimpel) |
| B8 lanterner som geometri, lovlige plasser, typede | ½ | ✓ | A7, A8 |
| B9 ankerspill, anker, pullerter | ½ | ✓ | Pullerten på fordekket, dreggen (`bower`) tegnes av spillet |
| B10 redningsutstyr | IR | IR | Jonas 31.10.2026: ingen flåte eller bøye i modellen |
| B11 eksos, ventilasjon, tanker | ½ | ✓ | Lyddemper og rør (A11) |
| B12 navnefelt | ✓ | ✓ | `names` på baugbordene, følger den nye flaten |
| B13 flaggstang | ½ | ✓ | A9 |
| B14 malingssoner | ✓ (sone 1) | ✓ | Bare sone 1 (`maletest`) |
| B15 ankrene | ✓ | ✓ | Alle beholdes |
| B16 slitasje som hjørnefarge | ✓ | ✓ | Mer: grått i solsida, sot ved eksosen, slitt ripe |
| B17 LOD | ½ (lod0, lod1) | ✓ | `lodm` lages av eksporten når lod0 > 40 000 |
| B18 sidebildet | ✓ | ✓ | Samme vinkel |
| B19 kontrollbilder | ✓ | ✓ | |
| B20 ingen ekte navn | ✓ | ✓ | |
| B21 tester grønne | ✓ | ✓ | |
| B22 én commit | – | ✓ | |

### 5.2 Planlisten (punktene som gjelder en åpen trebåt)

| ID | Før | Mål |
|---|---|---|
| SKR-01 proporsjoner | ✓ | ✓ |
| SKR-02 spring | ✓ | ✓ |
| SKR-03 stevn | ½ (knekker) | ✓ |
| SKR-05 hekk (spissgatt) | ½ | ✓ |
| SKR-06 spantform | ✓ | ✓ |
| SKR-07 kjøl | ½ | ✓ |
| SKR-08 skeg og propellåpning | ✗ | ✓ |
| SKR-09 bord, nagler, ganger | ½ | ✓ |
| SKR-16 slitelister | ½ | ✓ |
| SKR-18 tre | ✓ | ✓ |
| FOR-04 pullert | ✓ | ✓ |
| FOR-07 stevnbeslag | IR (J: ikke stevnbånd) | IR |
| FRM-01 propell | ½ (flate blad) | ✓ (`F.propeller`, fast stigning) |
| FRM-03 ror | ½ | ✓ |
| FRM-04 aksel | ✗ | ✓ |
| FRM-06 eksos | ½ | ✓ |
| FRM-07 bunnstoff og vannlinje | ½ (A2) | ✓ |
| LYS-02 sidelanterner med skjerm | ½ | ✓ |
| SJK-08 dekksutstyr (presenning, lensepumpe) | ½ | ✓ |
| SJK-09 klassisk snekke | ✓ | ✓ |
| MAT-11 tre, gråbleket | ✓ | ✓ |
| SLT-02, -04, -05 rennestriper, vekst, sot | ½ | ✓ |
| MAN-07 skala mot figuren | ✓ | ✓ (`brotest`) |

## 6. Lanternene

Sjøveisreglene (FOR-1975-12-01-5) slik de står i `docs/batplan.md` del 11. Båten er 7,00 m lang og går høyst 7 kn; unntaket for fartøy
**under** 7 m gjelder ikke, så regel 23 (d)(i) for fartøy under 12 m: én hvit rundtlysende og sidelanterner. Vedlegg I 2(d): når den
rundtlysende føres sammen med sidelanterner, skal den stå minst 1 m høyere enn dem (R, COLREG-teksten; ikke lest på Lovdata i denne
økta). Vedlegg I 2(g): sidelanternene høyst tre firedeler så høyt over skroget som den hvite. Typer i ankrene: `allround`, `port`, `stbd`.

## 6.1 Kritikksløyfen (31.10.2026)

Verktøyene: `shots.py` (tolv vinkler, ortografisk fra begge sider, forfra og akterfra, skrått, ovenfra, inni, under, og nærbilder av
baug og hekk), `overlay.py` (linjene fra tabellene over den ortografiske siderendringen, 152 px/m), `clipcheck.py` (hvert punkt i
innredningen og utstyret mot bordenes innside, langs normalen i snittet; listene og naglene utenpå er unntatt), `snekke23.py check` og
eksporten. Det finnes ikke noe foto å legge over (kap. 7).

| Runde | Hva | Funnet | Rettet |
|---|---|---|---|
| 0 | `check()` på tabellene | Deplasementet 3,26 t mot 1,9 t (arvet: det gamle skroget hadde samme form) | Kjølen 22 cm under kjølbordet, mer reising og slakkere kimming (`SEC_P`): 2,11 t. Lenger ned blir bunnen en skarp V; avviket står (kap. 7) |
| 1 | Første rendring, overlegg, klasjsjekk | Overlegget ligger på linjene (ripe, sponning, stevner, kjøl, brønn). Bunnstokkene stikker ut gjennom bunnen (firkantede i en V); klasjsjekken: 5 028 punkter | Bunnstokkene følger bordenes innside |
| 2 | Klasjsjekken skrevet om | Den første målte bredden vannrett ved samme høyde, som gir falske treff der bunnen er nesten flat; med avstand langs normalen: 2 758, så 323 ekte | – |
| 3 | 323 punkter | Spantenes smale kant gjennom bordene i akterskipet (sida smalner), bunnstokkene og akterste tofte målt midt på i stedet for i den smale enden, dekkskanten og innvegret der sida har utfall | Spantene satt inn etter hvor fort sida smalner, alt målt i den smale enden, innvegret lagt langs skrogets helling, endene av innvegret og spantenes hæl klar av det vridde kjølbordet: 0 |
| 4 | Eksporten | GLB 6,1 MB, fjernmodellen 7 394 trekanter (ryggen med 470 punkter) | 161 stasjoner, fjernmodellen med grov rygg og uten hogg: 5,4 MB, fjern 2 694 |
| 5 | Nærbilder av baug og hekk | Skvettlista slutter firkantet; ripebordet stopper før stevnene | Skvettlista smalner mot endene; baugband og hekkbord 2 mm over ripebordet (aldri i samme plan) |
| 6 | Rorkultens sveip | Spillet svinger rorkulten 0,3 × 2,4 rad = 41° hver vei (`13-instruments.js`); hele akterdekket ligger i sveipet, så den hvite lykta på akterdekket ville bli truffet | Staken flyttet til babord ripe forut for akterste tofte (1,6 m fra rorhodet, rorkulten er 1,15 m), surret til innvegret og ripa |
| 7 | `vessel3d trebat` | Middelsmodellen 127 206 punkter mot 120 000: rorkulten med roret og propellen tegnes oppå `lodm` | `lodm` på 36 500 trekanter for denne båten (`bpyutil.LODM_TRIS` satt i skriptet) |
| 8 | `regmarktest` | Bordkantene i landene og naglene (sone 0) telles som noe som stikker ut under registreringsmerket, og trekker sone 1-andelen ned | Bordkantene og naglene i sone 1: malingen går over dem som over bordene |
| 9 | I spillet, begge formater | Navnet på baugen, rorkulten og flagget, livbøya og karet (spillets), røyken fra eksosen, utsynet fra skipperens plass: som før | – |

## 6.2 Kravlista etter revisjonen

B1 ½ (ingen tegning; `check()` mot tabellene og dataene), B2 ✓, B3 ✓ (skvettlist, ripebord; ingen fendere etter Jonas), B6 ✓, B8 ✓,
B9 ✓, B11 ✓, B12 ✓, B13 ✓, B14 ✓ (sone 1), B15 ✓, B16 ✓, B17 ✓ (`lod0`, `lodm`, `lod1`), B18 ✓, B19 ✓, B20 ✓, B21 og B22: se
testene og commiten. A1–A15 i kap. 5 er rettet, så nær som A15 (budsjettet), som er brukt: 81 616 trekanter nær.

## 6.3 Testene (31.10.2026)

Grønne: `vessel3d trebat` (252 054 punkter nær, 116 703 middels), `brotest trebat`, `lanterntest`, `regmarktest` (trebåten), `penshot`,
`walktest`, `jigshot`, `potshot`, `haultest`. Røde som også er røde på utgangspunktet (860c982, kjørt på samme maskin): `vesseltest`
(«skiff: no GLB»), `regmarktest` (`ringnot38`), `deckshot` (skiffen; gikk dessuten ut på tid etter 50 min). Røde uten bekreftet
utgangspunkt: `maletest` (firmalogoen, ikke trebåten) og `anchor3d` («weighed: comes up under the bow»), som feiler på samme måte for
kyst15, som ikke er endret; trebåten slipper og legger ankeret riktig.

## 7. Det som ikke kan måles

- **Deplasementet:** skroget gir 2,11 t under vannlinja mot 1,9 t i `VESSELS` (11 % over). Dataene er ikke endret: ingen kilde sier
  noe annet, og spillets fysikk er stilt etter 1,9 t.
- **Alt.** Uten tegning eller bilde av akkurat denne båten er ingen mål målt; de er lest av spillets data (lengde, bredde, dypgang,
  deplasement) og ellers vanlige mål for typen. Overlegget sjekker bare at modellen følger sine egne tabeller.
- Bilder som ville gjort resultatet bedre: et bilde rett fra siden av en 23 fots klinkbygd motorsnekke med kjent lengde (en
  museumsbåt eller en annonse), et rett akterfra eller forfra, og et ovenfra inn i båten (tofter, motorkasse, dørk). Helst
  linjetegningen av en Sørlandssnekke eller en Risør-snekke av den størrelsen.

## Endringslogg

- 31.10.2026: første versjon, gjennomgangen før endring.
- 31.10.2026: kritikksløyfens runder (6.1), kravlista etter (6.2), deplasementet (kap. 7).
