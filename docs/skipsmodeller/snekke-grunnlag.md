# Plastsnekka: byggegrunnlaget for revisjonen (F5)

> Grunnlaget for revisjonen av `snekke` («Plastsnekke 26 fot, 30 hk diesel»), skriptet `tools/boats/snekke26.py`, etter malen i
> `sulebas-pilot-grunnlag.md` og arbeidsmåten i `sulebas-bygging.md` (kap. 7, 11 og 12). Bestilt av Jonas 01.11.2026: «Løft den til samme
> nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene trebat og skiff», og: «Jeg har dessverre ikke noen bilder for hånden
> så du får gjøre jobben etter beste evne.»
>
> Kildekoder: **R** skriftlig kilde (spillets data), **P** lest av Jonas' bilder 13.10.2026 av det første skriptet (bildene ligger ikke i
> repoet, bare tabellene), **J** Jonas' ord, **A** antatt (vanlig for typen, vårt valg), **M** målt på modellen.

## 1. Fakta om båten

| Hva | Verdi | Kilde | Følger for modellen |
|---|---|---|---|
| Type | Plastsnekke med støpt klinkmønster, ruff forut, vindskjerm med hardtopp over styreplassen, åpen cockpit akter | R (`VESSELS.snekke.desc`), P | Låst |
| Forbilde | En norsk familiesnekke på 26 fot fra slutten av 70- og 80-tallet (navnet står bare i skriptets kommentar, ikke i spillet), 7,86 × 2,70 m | P | Tabellene for ripa, stevnen og halvbreddene ved ripa |
| Lengde o.a. | 7,90 m | R | `vessel3d`: −6 % til +3 % i båndet −0,3–1,5 m over vannlinja |
| Bredde | 2,70 m | R | ±5 % |
| Dypgang | 1,20 m med kjølen | R | Kjølens underkant 1,20 m under vannlinja |
| Deplasement | 3,0 t | R | `check()`: volumet under vannlinja |
| Maskin | 30 hk innenbords diesel, 7 kn marsj, 8 kn maks | R | Aksel gjennom kjølens akterkant, tre-blads propell i brønn foran roret, våt eksos i speilet |
| Byggeår | 1994 | R | Gelcoat litt gulnet i flekker, slitt der folk står (B16) |
| Standard om bord | Kartplotter og VHF (`std`) | R | Del av båten: plotteren i dashbordet, VHF-en under hardtoppen |
| Farger | Hvitt skrog, marineblått bånd under ripa, rødt bunnstoff, mørk vannlinjestripe | P | Sone 1 skrog, sone 2 båndet (nytt), sone 3 overbygg, sone 4 dekk |

## 2. Reglene som gjelder modellen

- Ingen ekte navn, merke eller logo (CLAUDE.md); heller ikke i GLB-ens `name` (det sier «Plastsnekke 26 fot»).
- Bare utsiden; det som synes gjennom vinduene i ruffen er mørkt (ingen innredning), cockpiten og styreplassen er utside.
- Ingen kjøpbart utstyr modellert inn: haleren, karene, stampene, garnet, livbøyene, flåten og radaren settes av spillet på plassene
  (`hauler`, `work`, `kit`). Plotteren og VHF-en er standard på båten og er en del av den.
- Lanternene på lovlige plasser (kap. 6).
- Det spillet er avhengig av beholdes: typenavnet `snekke`, sone 1, 3 og 4 (`maletest`), og alle ankrene (`bower`, `eye`, `skipperAt`, `hp`,
  `fov`, `crewSpots`, `lights`, `doors`, `names`, `deck`, `gw`, `stern`, `bow`, `side`, `beam`, `pl`, `rl`, `open`, `hand`, `pole`, `hauler`,
  `filler`, `kit` med `raft`, `buoys`, `radar`, `tubs`, `garn`, `stamps`, `cargo`). Nytt: `work` (båtens eget sløyebord).

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Ombygging eller nytt skript? | **Nytt skript etter `ringnot38.py`/`skiff59.py`.** Skroget i dag er to løse rutenett og et speil, kjølen en egen kropp hengt under det, og formen gir 10,5 t (uten kjølen) mot 3,0 t. Det kan ikke rettes uten å skrives om. Tabellene for ripa, stevnen og bredden ved ripa (lest av Jonas' bilder) beholdes. |
| B2 | Skala uten bilder | Tabellene i meter er målestokken. `check()` regner modellen mot `VESSELS` og lanternereglene; overlegget mot linjene fra tabellene (`lines.png`) sjekker at modellen følger sine egne mål. Det er ikke et foto. |
| B3 | Vannlinjebredden | Den gamle tabellen hadde 2,52 m i vannlinja mot 2,70 m største bredde; det gir en knekk i kimmingen ved 3,0 t. Vannlinjebredden kan ikke leses av et sidebilde (den var antatt). Ny: 2,32 m (86 %, vanlig for en rundbunnet snekke med utfall). |
| B4 | Styreplassen | Skipperen står på cockpitdørken under hardtoppen (1,98 m takhøyde), ikke på et opphøyd gulv i ripehøyde med hodet i taket; konsollen på styrbord mot skottet, sete bak ham, døra til ruffen babord for midten. |
| B5 | Arbeidsflyten | Båten får eget sløyebord over babord ripe (`work.own`); spillets bord sto klemt akter mellom karene (før-bildet `sn26_for_dekk`). |
| B6 | Malingssone 2 | Det mørke båndet blir sone 2, så Malerverkstedet kan tilby stripefargen (`designFits('stripe')`), som skiffens vannlinjestripe. |

## 4. Gjennomgang før endring: avvikslista (01.11.2026)

Dagens modell rendret fra K1–K7 og nærbilder (`scratchpad/sn/shots.py`, `for_*.png`): 10 332 trekanter nær, 1 589 fjern, 412 KB.
Spillet viser Blender-modellen (`glbHas('snekke')` sann, `buildVesselModel(..).glb`, 10 332 trekanter), ikke reserven. Før-bildene fra
spillet i begge formater: `tests/out/sn26_for_*.png` (`tests/sn26shot.py`: utenfra K1 og K2, broa, dekket under fiske, natt). Kravlista
B1–B22 (`docs/batplan.md` del 10), planlisten og M-punktene (`kartlegging-spillet.md` kap. 6) er gått gjennom.

| # | Avvik | Hvor | Alvor | Tiltak |
|---|---|---|---|---|
| A1 | **Formen gir 10,5 t under vannlinja (uten kjølen) mot 3,0 t i dataene**: snittene er fulle og runde helt ned til 0,94 m under vannlinja på midten | `curve`, `KEEL` | H | Ny kropp: grunnere (0,41 m under vannlinja på midten), hul kjølrot (vinglass), rund kimming under vannlinja, kjølen ned til 1,20 m (`check()`) |
| A2 | **Skroget er ikke én flate**: to rutenett per side som ikke deler punkter i kjøllinja, et eget speil, og kjølen en egen kropp hengt under skroget (fra −0,2 m) med åpne ender | `build_hull`, `fittings` | H | Ett nett: kjølen, sidene, speilet, ripa, cockpiten, skottet, sidedekkene, ruffen og fordekket deler punkter |
| A3 | **Propellen og roret henger løst** bak kjølen; ingen propellbrønn, ingen sko, ingen rorstamme; roret er en tykk plate | `fittings` | H | Kjølens akterkant som skarp kant med aksel og lager, propellen (`F.propeller`) i brønnen mellom kjølen og roret, bronsesko til rorets hæl, profilror (`F.foil_rudder`) med stamme og lager |
| A4 | **Åpninger er ikke hull**: vinduene i ruffen er svarte flater lagt utenpå, døra er en planke foran veggen, lukene er bokser oppå | `decks` | H | Ekte hull med lysning, glass, ramme og mørkt bak: vinduene, nedgangen, forluka, motorluka i dørken, lensportene, eksosen, lensepumpens utløp |
| A5 | **Styreplassen**: skipperen står på et gulv i ripehøyde med hodet inntil taket; øyet ser over vindskjermen og ikke noe ratt; plotteren er en stor svart plate i synsfeltet (før-bildet `sn26_for_bro`) | `helm`, ankrene | H | Styreplassen på dørken, konsoll med dashbord, ratt (`F.helm_wheel`), enspak, plotter og motorpanel som vender mot skipperen, kompass, VHF over hodet, styrestol |
| A6 | Vindskjermen svever: vingene ender i lufta og sidepanelet er en skjev femkant | `helm` | M | Vingene ned til ruffens hjørne og ut til sida, dørhusets sider på ripa, U-skinne, stolper, hardtopp på stolper med fotplater |
| A7 | Sidelanternene er bokser uten skjerm (LYS-02); akterlanterna er en hvit sylinder uten sektor | `lantern_geo` | M | `F.side_lantern` med skjerm på en plate på ruffsida, `F.stern_lantern` (135°) på flaggstanga, `F.allround_lantern` på masta |
| A8 | Baugrulla og ankeret er en grå kloss (M13) | `fittings` | L | `F.bow_roller` med kinn, rulle og sikringsbolt; ankeret er spillets |
| A9 | Pullertene er bokser | `fittings` | L | `F.cleat` |
| A10 | Arbeidsflyten: spillets sløyebord og blødekar står akter, sløyebordet midt i gangen bak karet | spillets standardplasser | M | Båtens eget sløyebord over babord ripe ved haleren, blødekaret ved fiskeren, fangstkaret akter (B5) |
| A11 | Vannlinjestripa og bunnstoffet går vannrett (planlisten kap. 29) | `levels` | M | Skjæres i flaten på skrå plan som stiger 12 mm/m forover |
| A12 | Ingen slitasje (B16) | – | M | Hjørnefarge: gulnet gelcoat i flekker, skitt over vannlinjestripa, slim og grønske ved vannlinja, sot under eksosen, rennestripe under lensepumpa, slitt dørk |
| A13 | Malingssone 2 mangler (båndet er sone 0, B14) | `colours` | L | Båndet i sone 2 (B6) |
| A14 | Ingen anoder, ingen ekkoloddgiver, ingen sjøvannsinntak (SKR-19, M15) | – | L | Anoder på kjølen og speilet, akselanode, giver og rist |
| A15 | Trekanter: 10 332 nær, langt under det båter under 12 m får (80 000) | – | – | Mål: 80 000–150 000 |

**Det som er bra og beholdes:** proporsjonene (lengde, bredde, ripa med spring, utfallet i baugen), klinkmønsteret, fargene, ruffen med
tre vinduer og rundet front, hardtoppen med mast, rekkene, badeleideren, flaggstanga og plassene for utstyret.

### 4.1 Kravlista B1–B22 (før → mål)

| Punkt | Før | Mål | Merknad |
|---|---|---|---|
| B1 målte linjer | ½ | ½ | Ingen tegning; tabellene fra bildene, `check()` mot dataene, overlegg mot linjene fra tabellene |
| B2 skrog, kjøl, propellåpning, ror, propell | ½ | ✓ | A1–A3 |
| B3 fendere, ripkapp, skandekk, spygatt | ½ | ✓ | Båndet, teakkapp på ripa, fotlist, lensporter |
| B4 overbygg, dører | ½ | ✓ | Nedgangen som ekte dør i skottet (`doors`) |
| B5 styrhusinteriør | ½ | ✓ | A5 |
| B6 arbeidsdekket | ½ | ✓ | Motorluka, sløyebordet; karene er spillets |
| B7 mast, antenner | ½ | ✓ | Mast i tabernakel, VHF-pisk, GPS, horn |
| B8 lanterner | ½ | ✓ | A7 |
| B9 anker, pullerter | ½ | ✓ | A8, A9 |
| B10 redningsutstyr | IR | IR | Flåte og livbøyer er spillets (`kit`) |
| B11 eksos, tanker | ✗ | ✓ | Våt eksos, påfylling og lufting av tanken, lensepumpeutløp |
| B12 navnefelt | ✓ | ✓ | Baugene og speilet, mellom lensportene og toppen |
| B13 flaggstang | ✓ | ✓ | |
| B14 malingssoner | ½ (1, 3, 4) | ✓ | A13 |
| B15 ankrene | ✓ | ✓ | Alle beholdes, `work` nytt |
| B16 slitasje | ✗ | ✓ | A12 |
| B17 LOD | ½ | ✓ | `lodm` når `lod0` > 40 000 |
| B18–B22 | ✓ | ✓ | |

### 4.2 Planlisten (punktene som gjelder en plastsnekke; de andre er IR)

SKR-01, -02, -03, -05, -06 ✓ før og etter. SKR-07 kjøl ½ → ✓. SKR-08 propellåpning ✗ → ✓. SKR-09 (GRP: støpte klinkbord) ✓. SKR-11
spygatt ✗ → ✓. SKR-12 utløp ✗ → ✓. SKR-16 slitelister ½ → ✓. SKR-19 anoder ✗ → ✓. DKS-02 dekksbelegg ½ → ✓. DKS-03 luker ½ → ✓.
DKS-07 dør ½ → ✓. OVB-03 vinduer ½ → ✓. OVB-04 visker ✗ → ✓. OVB-12 konsoll ½ → ✓. MST-05, -06, -08 ✗ → ✓. FOR-04 ½ → ✓. FOR-07 ½ (M13) → ✓.
FRM-01, -03, -04 ½/✗ → ✓. FRM-06 eksos ✗ → ✓. FRM-07 ½ → ✓. LYS-02, -03 ½ → ✓. LYS-07 arbeidslys ✗ → ✓. SJK-05 eksos ✗ → ✓. SJK-06 mast ½ →
✓. SJK-10 arbeidsdekk ½ → ✓. MAT-02 fargegrenser med spring ✗ → ✓. SLT-02, -04, -05 ✗ → ✓. MAN-01, -05, -07 ✓.

### 4.3 M-punktene som gjelder snekka

M6 (registreringsmerket skjevt på skrå stevn): spillets `markStrips`, ikke modellen; sjekkes i `regmarktest`. M13 (baugrulla): A8.
M17 (flåtebeholderen virker stor på hardtoppen): den er spillets (`kit.raft`), ikke modellens; plassen er flyttet så den står klar av masta.

## 5. Målene (tabellene i skriptet)

Rammen: x forover fra speilets fot (speilets topp ved x = 0, foten 0,10 m forut: speilet heller akterover), y til babord, z opp fra kjølens
underkant; vannlinja z = 1,20; spillets origo x = 3,95.

| Mål | Verdi | Kilde |
|---|---|---|
| Ripa (`SHEER`) | 2,20 akter, 2,16 laveste ved 2,5 m, 2,56 ved stevnen (fribord 1,00 / 0,96 / 1,36) | P |
| Halvbredde ved ripa (`BS`) | 1,35 største (2,70 m), avrundet akter til 62 % ved speilet | P, R |
| Halvbredde i vannlinja (`BW`) | 1,16 største (2,32 m) | A (B3) |
| Stevnen (`KB` forut) | i vannlinja ved 7,36 m, raket og rundet opp til 7,90 m | P |
| Kjølen (`KB` akter) | underkant 1,20 m under vannlinja ved 1,4–3,0 m, litt drag forover, akterkant ved 1,05 m | R (dypgangen), A |
| Kjølroten (`ZROOT`) | 0,44 m under vannlinja på midten, opp til speilets fot 0,08 m under vannlinja | A (`check()`) |
| Klinkbord | 7, hvert 22 mm ut i underkanten | P (det første skriptet) |
| Cockpitdørken | 0,38 m over vannlinja, fra speilet til skottet ved 3,75 m | A |
| Ruffen | 3,75–6,75 m, topp 2,76 (1,56 over vannlinja) | P |
| Hardtoppen | 2,20–3,62 m, underkant 3,56 (1,98 over dørken) | P (høyden), A |
| Propellen | Ø 0,42 m, tre blad, sentrum 0,64 m under vannlinja ved 0,80 m | A (30 hk ved 2:1) |

## 6. Lanternene

Sjøveisreglene (FOR-1975-12-01-5) slik de står i `docs/batplan.md` del 11. Båten er 7,9 m, under 12 m: regel 23 (d)(i), én hvit
rundtlysende og sidelanterner (spillet tenner også akterlanterna, `lanterns()`). Vedlegg I 2(d): den rundtlysende minst 1 m over
sidelanternene (her 2,18 m). Vedlegg I 2(g): sidelanternene høyst tre firedeler så høyt over skroget som den hvite (0,37 mot 1,97 m).
Sidelanternene sitter på ruffsidene mellom første og andre vindu, med skjerm innenbords (LYS-02), og ruffen skjermer dem mot den andre
sida. Den hvite står på masta på hardtoppen, 3,0 m fra flaggstanga og over den, så spillet gir vimpel (båten har mast, `mastTop`).
Typer i ankrene: `allround`, `port`, `stbd`, `stern`, `work` (arbeidslyset under hardtoppen, ikke en lanterne).

## 6.1 Kritikksløyfen (01.11.2026)

Verktøyene i økta sin kladdemappe (`scratchpad/sn/`): `shots.py` (K1–K7 og nærbilder), `lines.py` (spantriss og profil fra tabellene,
volumet), `clip.py` (klasjsjekken), `snekke26.py check` og eksporten.

| Runde | Hva | Funnet | Rettet |
|---|---|---|---|
| 0 | Volumet av det gamle skroget | 10,5 t uten kjølen mot 3,0 t | Ny kropp (A1) |
| 1 | `lines.py` på de nye tabellene | 5,0 t; for dyp og full kropp | Kjølroten høyere, hulere spant: 3,4 t, men en knekk i kimmingen i vannlinja |
| 2 | Spantrisset | Knekken kommer av vannlinjebredden 2,52 m nær største bredde | Vannlinjebredden 2,32 m (B3), rund kimming under vannlinja, smalere kjøl: 3,58 t |
| 3 | Første rendring | Hovedformen, kjølen, brønnen, roret på skoen, hullene, dørhuset, rattet riktig; dashbordet like mørkt som skjermene | Dashbordet lyst, skjermene i mørke rammer |
| 4 | Klasjsjekken | 503 punkter: fotlista sank 1,7 cm ned i skrogkanten (366), kompasshuset gjennom skottet inn i ruffen (6), tanklufterens rør gjennom sida (12); resten var hullenes egne foringer | Fotlista på dekket, kompasset på dashbordet, lufteren som hette utenpå: 0 |

| 5 | Eksport og spillet (`sn26shot.py`, `vessel3d`, `brotest`, `lanterntest`, `regmarktest`, `vesseltest`, `maletest`, `walktest`) | 51 267 trekanter; alle grønne. Broa: dashbordet med kompass, målere og plotter synes, utsynet gjennom vindskjermen; dekket: sløyebordet over babord ripe med fisken på, blødekaret ved fiskeren; `walktest` finner alle plassene | – |
| 6 | Tettere skrog (stasjon hver 3,5 cm, 18 rader i bunnen) og nattbildet K6 | Klinkbordene og stevnen jevnere; K6 fra styrbord baug viser bare den grønne og den hvite (den røde og akterlanterna skjermet bort, som de skal), om babord den røde på ruffsida; klasjsjekken 0 | 68 057 trekanter, GLB 4,3 MB |

## 6.2 Arbeidet om bord (plassene)

Fiskeren står ved styrbord ripe ved haleren (2,05 m fra speilet, under hardtoppens akterkant), med skipperen ved rattet like forut for seg.
Blødekaret (`work.tub`, 75 %) står på dørken rett akter for ham, så fisken går fra ripa rett i karet. Sløyebordet er båtens eget, over
babord ripe tvers av haleren (`work.table`, `own`, `top` 0,86 m over dørken), med ytterkanten 3 cm utenfor ripa så avfallet går i sjøen;
den som sløyer står på dørken innenfor det. Den sløyde fisken går i fangstkaret med is akter på senterlinja (`kit.tubs`, 300 l). Garnkaret,
stampene og lasten står forut i cockpiten til babord, klar av stolen og blødekaret. Motorluka i dørken er flush, så karene kan stå på den.

## 6.3 Testene (01.11.2026)

Grønne på den endelige modellen: `vessel3d snekke` (punkter nær og middels innenfor taket, skroget 8,04 × 2,73 m), `brotest snekke`
(1,98 m over plassen, øyet 1,65, utsyn), `lanterntest`, `regmarktest` for snekka (merket på jevn maling, 0,75 m fra ankeret), `vesseltest`,
`maletest` (sone 3 og 4 som før, nå også sone 2), `walktest` (alle plassene). `regmarktest` er rød for `ringnot38`, som på utgangspunktet.

## 7. Det som ikke kan måles

- **Deplasementet:** skroget gir 3,58 t under vannlinja mot 3,0 t i `VESSELS` (19 % over; 3,0 t gir vannlinja 4 cm lavere). Grunnere blir
  bunnen flat. Dataene er ikke endret: ingen kilde sier noe annet.
- **Alt under vann og alt på tvers:** kjølen, roret, propellen, vannlinjebredden og alt inni (konsollen, dørken, lukene) er antatt for typen;
  bare ripa, stevnen og bredden ved ripa er lest av bilder (av det første skriptet, bildene er ikke her).

## 8. Bilder som ville gjort resultatet bedre

Et bilde rett fra siden av en 26 fots plastsnekke av typen med kjent lengde (annonse eller brosjyre), helst på land så kjølen, roret og
propellen synes; et rett akterfra (speilet, roret, eksosen); et rett forfra (utfallet og stevnen); et inn i cockpiten og styreplassen
(konsollen, døra, lukene); og helst produsentens tegning (linjer og generalarrangement).

## Endringslogg

- 01.11.2026: første versjon, gjennomgangen før endring og de første rundene.
