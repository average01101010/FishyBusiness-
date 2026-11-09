# Plastsjarken: byggegrunnlaget for revisjonen (F5)

> Grunnlaget for revisjonen av `plastsjark` («Plastsjark 31 fot (9,45 m), 100 hk»), skriptet `tools/boats/plast31.py`, etter malen i
> `sulebas-pilot-grunnlag.md` og arbeidsmåten i `sulebas-bygging.md` (kap. 7, 11, 12 og 13). Bestilt av Jonas 01.11.2026: «Løft den til samme
> nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene trebat, skiff og snekke». Ingen bilder fulgte med bestillingen.
>
> Kildekoder: **R** skriftlig kilde (spillets data, registrene og bruktannonsene slik det første skriptet leste dem 17.10.2026), **S** søk
> 01.11.2026 (bare søkeresultatenes utdrag av finn.no-annonser; selve sidene var stengt for økta), **J** Jonas' ord, **A** antatt (vanlig
> for typen, vårt valg), **M** målt på modellen.

## 1. Fakta om båten

| Hva | Verdi | Kilde | Følger for modellen |
|---|---|---|---|
| Type | Plastsjark med styrhus forut over ruffen med to køyer, åpent arbeidsdekk akter med lasterom, full kjøl (OB7, 09.11.2026: før styrhus akter) | J (valg 22 B, kap. 10), R (`VESSELS.plastsjark.desc`) | Låst |
| Forbilde | Viksund 31 Sjark, bygd fra rundt 1978 (navnet står bare i skriptets kommentar og her, ikke i spillet) | R | – |
| Lengde o.a. | 9,45 m (registrene og annonsene: 9,26–9,45) | R, S | `vessel3d`: −6 % til +3 % i båndet −0,3–1,5 m over vannlinja |
| Bredde | 3,30 m (annonsene oftest 3,05, ellers 3,10–3,20) | R, S | ±5 %. Se kap. 7: kildene sier heller 3,05–3,20 |
| Dypgang | 1,35 m med kjølen (1,2–1,5 etter lasten) | R | Kjølens underkant 1,35 m under vannlinja |
| Deplasement | 6 t (annonsene: 5–11 t, trolig 7–8 t i drift med ballast) | R, S | `check()`: volumet under vannlinja |
| Maskin | 100 hk diesel, 7,5 kn marsj, 8,5 maks (annonsene: 68–200 hk, 7–8 kn) | R, S | Aksel ut gjennom kjølens akterkant, tre-blads propell i brønn foran roret, tørr eksos opp gjennom taket |
| Byggeår | 1992 | R | Gelcoaten gulnet i flekker, slitt der folk står (B16) |
| Standard om bord | Kartplotter og VHF (`std`) | R | Del av båten: plotteren i konsollen, VHF-en under taket |
| Farger | Hvitt skrog, marineblå stripe under ripa, svart vannlinjestripe, rødt bunnstoff, kremhvitt styrhus, grønt dekk | R (det første skriptets valg) | Sone 1 skrog, 2 stripe, 3 overbygg, 4 dekk |

## 2. Reglene som gjelder modellen

- Ingen ekte navn, merke eller logo (CLAUDE.md); heller ikke i GLB-ens `name` (det sier «Plastsjark 31 fot»).
- Bare utsiden; gjennom vinduene i styrhuset synes konsollen, rattet, stolen og benken (det er utside), ruffen er mørk.
- Ingen kjøpbart utstyr modellert inn: haleren, karene, stampene, garnet, livbøyene, flåten og radaren settes av spillet på plassene
  (`hauler`, `work`, `kit`). Plotteren og VHF-en er standard og del av båten.
- Lanternene på lovlige plasser (kap. 6).
- Det spillet er avhengig av beholdes: typenavnet `plastsjark`, sone 1–4 (`maletest`), og alle ankrene (`bower`, `eye`, `skipperAt`, `hp`, `fov`,
  `crewSpots`, `lights`, `doors`, `names`, `work`, `hatch`, `bunk`, `exhaust`, `deck`, `gw`, `stern`, `bow`, `side`, `beam`, `pl`, `rl`, `open`,
  `hand`, `pole`, `hauler`, `filler`, `kit` med `raft`, `buoys`, `radar`, `garn`, `stamps`, `cargo`).

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Ombygging eller nytt skript? | **Nytt skript etter `snekke26.py`/`ringnot38.py`.** Snittene er en superellipse fra kjølens underkant til ripa (en kasse ned til 1,35 m under vannlinja: 21,9 t mot 6 t), kjølen en egen kropp inni skroget, propellen inne i skroget og skroget, speilet, dekket og ruffen løse stykker. Det kan ikke rettes uten å skrives om. Ripa, bredden ved ripa, stevnen og planen for dekket (styrhus, arbeidsdekk, ruff) beholdes. |
| B2 | Skala uten bilder | Tabellene i meter er målestokken; `check()` regner modellen mot `VESSELS` og lanternereglene, `tools/boats/qa/lines.py` tegner spantrisset og profilen fra tabellene. Det er ikke et foto. |
| B3 | Vannlinjebredden | 2,80 m (85 % av største bredde, vanlig for en rundbunnet sjark med utfall); den kan ikke leses av noe bilde (kap. 7). |
| B4 | Planen for dekket | **Endret i OB7 (09.11.2026, Jonas: «Forut», kap. 10): styrhuset forut, arbeidsdekket akter.** Før: beholdes som i spillet og batplanen: styrhus akter, arbeidsdekk midtskips, ruff forut. Søket 01.11.2026 fant annonser som tyder på styrhus midtskips og arbeidsdekk akter på noen Viksund 31 («glass skyvedør ut til bakdekk», «stort lasterom akter»), men utdragene er usikre, så det er ikke endret (kap. 8, spørsmål til Jonas). |
| B5 | Styreplassen | Skipperen står på dørken til styrbord bak rattet (0,42 m), konsollen under frontvinduene med dashbordet som skrår opp forover og skjermene vendt opp og akterover mot ham, stolen bak ham, benken og kokeplata til babord. |
| B6 | Arbeidsflyten | Fiskeren ved haleren på styrbord ripe, blødekaret rett akter for ham, båtens eget sløyebord over babord ripe tvers av ham (`work.own`), lasteromsluka mellom dem (fisken sløyes og ises i rommet). |

## 4. Gjennomgang før endring: avvikslista (01.11.2026)

Spillet viser Blender-modellen (`glbHas('plastsjark')` sann, `buildVesselModel(..).glb`, 7 077 trekanter, ankrene og fire typede lys), ikke
byggesettets reserve. Før-bildene fra spillet i begge formater: `tests/out/p31_for_*.png` (`tests/p31shot.py`: utenfra K1 og K2, broa, dekket
under fiske, natt). Dagens modell rendret fra K1–K7 og nærbilder: `tools/boats/out/qa/p31for_*.png` (`shots.py`). Kravlista B1–B22
(`docs/batplan.md` del 10), planlisten og M-punktene (`kartlegging-spillet.md` kap. 6) er gått gjennom, og det arvede skriptet linje for linje.

| # | Avvik | Hvor | Alvor | Tiltak |
|---|---|---|---|---|
| A1 | **Formen gir 21,9 t under vannlinja mot 6 t i dataene** (`stubcheck.py --volume curve`): snittet er en superellipse fra kjølens underkant (q 2,2–2,5), så skroget er nesten fullt bredt helt ned til 1,35 m under vannlinja | `curve`, `QS` | H | Ny kropp: kjølrot 0,53 m under vannlinja midtskips, hul kjølrot (vinglass), rund kimming, utfall over vannlinja; kjølen som avsmalnende dødved ned til 1,35 m |
| A2 | **Skroget er ikke én flate**: to rutenett per side som ikke deler punkter i kjøllinja, et eget speil, en egen kjøl hengt inni skroget (to flater i samme rom), dekket, skansekledningen og ruffen som løse firkanter | `build_hull`, `fittings`, `decks` | H | Ett nett: kjølen, sidene, speilet, kappen, innsida av skansekledningen, dekket, ruffen og forskipet deler punkter |
| A3 | **Propellen ligger inne i skroget**: navet ved x 0,48–0,66 og z 0,5 der skroget går ned til z 0,55, så bladene går gjennom bunnen; ingen propellbrønn, ingen sko, ingen rorstamme; roret en 8 cm tykk plate bak skroget | `fittings` | H | Kjølens akterkant med lager, propellen (`F.propeller`, Ø 0,54) i brønnen mellom kjølen og roret, bronsesko til rorets hæl, profilror (`F.foil_rudder`) med stamme og lager |
| A4 | **Åpninger er ikke hull**: lensportene er mørke flater på skansekledningen, koøyene sylindre utenpå ruffen, nedgangen og styrhusdøra plater foran veggen, lasteromsluka en kasse oppå dekket | `decks`, `door` | H | Ekte hull med lysning: koøyene med ring og glass, nedgangen med teakdør, forluka med ramme og lokk, lensportene gjennom skansekledningen med klaff, lasteromsluka med karm og lokk, kjølevannsutløpet, lensepumpens utløp |
| A5 | **Styreplassen**: skipperen står i rattet (rattets senter ved x 2,96, øyet ved 2,85, rattet r 0,2) og i stolen (setet 2,55–3,0); fra broa synes verken ratt eller instrumenter (før-bildet `p31_for_bro`), bare kanten av konsollen | `wheelhouse`, ankrene | H | Rattet 0,42 m forut for øyet, stolen bak ham, `hp` −0,30 så dashbordet er i synsfeltet (`check()`) |
| A6 | **Skjermene i konsollen lener toppen mot skipperen og vender ned** (planet lent feil vei; `nrm` snudde bare flaten), samme feil som skiffen hadde | `wheelhouse` | M | Dashbordet skrår opp forover; plotteren, ekkoloddet og motorpanelet flush i det og vendt opp og akterover |
| A7 | **M10**: sidevinduene er glass rett på veggens plan uten lysning, karmene er klosser, taket en 10 cm hvit kant med en 4 cm bue og ingen dryppkant | `wheelhouse` | M | Vinduer med gummikarm, lysning inn til glasset, tynnere takkant med dryppkant, visir over fronten, viskere på frontrutene |
| A8 | Sidelanternene er svarte kasser med en farget kloss utenpå, uten skjerm (LYS-02); akterlanterna er et rundtlys på egen stake | `wheelhouse`, `fittings` | M | `F.side_lantern` med skjerm på en plate under takkanten, `F.stern_lantern` (135°) på flaggstanga, `F.allround_lantern` på masta |
| A9 | **M13**: baugrulla og ankeret er en grå kloss med en sylinder; ankervinsjen en kasse og en sylinder | `fittings` | L | `F.bow_roller`, vinsj med gypsy, varpkopp og motorhus |
| A10 | Pullertene er en stolpe med en tverrpinne | `fittings` | L | `F.cleat` |
| A11 | Fargegrensene går vannrett (planlisten kap. 29) | `levels` | M | Skjæres i flaten på skrå plan som stiger 12 mm/m forover |
| A12 | Ingen anoder, ingen ekkoloddgiver, ingen sjøvannsinntak, ingen utløp (SKR-12, SKR-19, M15) | – | L | Anoder på kjølen og speilet, akselanode, giver og rist, kjølevanns- og lensepumpeutløp i ekte hull |
| A13 | Arbeidsflyten: spillets blødekar står på dekket akter for sløyebordet, og sløyebordet (båtens eget, stål på bein) står på styrbord rett akter for haleren, så fiskeren og den som sløyer står i veien for hverandre | `TABLE`, `work` | M | B6 |
| A14 | Trekanter: 6 961 nær, 2 405 fjern, 319 KB, ingen `lodm` | – | – | Mål: 80 000–150 000 nær, `lodm` 40 000 |

**Det som er bra og beholdes:** proporsjonene (lengde, bredde, ripa med spring, utfallet i baugen), planen for dekket (styrhus akter, arbeidsdekk,
ruff), fargene og malingssonene, styrhusets form med lent front, dør forut om babord og vinduer rundt, masta med plattformen for radaren og
eksosrøret, pulpiten, plassene for utstyret og navnefeltene.

### 4.1 Kravlista B1–B22 (før → mål)

| Punkt | Før | Mål | Merknad |
|---|---|---|---|
| B1 målte linjer | ½ | ½ | Ingen tegning; registermålene, `check()` mot dataene, spantrisset fra tabellene |
| B2 skrog, kjøl, propellåpning, ror, propell | ✗ | ✓ | A1–A3 |
| B3 fendere, ripkapp, skandekk, spygatt | ½ | ✓ | Kapp på skansekledningen, lensporter med klaff, fendere stuet på dekk |
| B4 overbygg, dører | ½ | ✓ | Styrhusdøra med karm, terskel, vindu og hengsler; nedgangen som ekte hull (`doors`) |
| B5 styrhusinteriør | ½ | ✓ | A5, A6 |
| B6 arbeidsdekket | ½ | ✓ | Lasteromsluka med karm, eget sløyebord (A13) |
| B7 mast, antenner | ½ | ✓ | Mast i tabernakel, saling, VHF-pisk, GPS, horn, lyskaster, arbeidslys |
| B8 lanterner | ½ | ✓ | A8 |
| B9 anker, pullerter | ½ | ✓ | A9, A10 |
| B10 redningsutstyr | IR | IR | Flåte og livbøyer er spillets (`kit`) |
| B11 eksos, tanker | ½ | ✓ | Tørr eksos med regnhatt og stag, påfylling og lufting, utløp |
| B12 navnefelt | ✓ | ✓ | Baugene og speilet |
| B13 flaggstang | ✓ | ✓ | |
| B14 malingssoner | ✓ (1–4) | ✓ | |
| B15 ankrene | ✓ | ✓ | Alle beholdes |
| B16 slitasje | ½ | ✓ | Mer: grime over vannlinjestripa, rennestriper under lensportene og utløpene, slitt dekk der de arbeider |
| B17 LOD | ½ | ✓ | `lodm` når `lod0` > 40 000 |
| B18–B22 | ✓ | ✓ | |

### 4.2 Planlisten (punktene som gjelder en plastsjark; de andre er IR)

SKR-01, -02, -03, -05 ✓ før og etter. SKR-06 spantform ✗ (kasse) → ✓. SKR-07 kjøl ✗ → ✓. SKR-08 propellåpning ✗ → ✓. SKR-10 skansekledning ½ → ✓.
SKR-11 lensporter ½ → ✓. SKR-12 utløp ✗ → ✓. SKR-19 anoder ✗ → ✓. DKS-03 luker ½ → ✓. DKS-07 dører ½ → ✓. OVB-03 vinduer ½ (M10) → ✓. OVB-04
visker ✗ → ✓. OVB-05 takskjerm ½ → ✓. OVB-09 eksos ✓. OVB-12 konsoll ½ → ✓. MST-05, -06, -08 ✗ → ✓. FOR-01 vinsj ½ → ✓. FOR-04 ½ → ✓.
FOR-07 ✗ (M13) → ✓. FRM-01, -03, -04 ✗ → ✓. FRM-07 ½ → ✓. LYS-02, -03 ½ → ✓. LYS-07, -08 ½ → ✓. SJK-02, -05, -06 ✓. SJK-10 ½ → ✓. MAT-02 ✗ → ✓.
SLT-02, -04, -05 ½ → ✓. MAN-01, -05, -07 ✓.

### 4.3 M-punktene som gjelder plastsjarken

M10 (matte sidevinduer, tykt flatt tak): A7. M13 (baugrulle og anker som en grå kloss): A9. M15 (undervannsskroget): A3, A12. D8 (volumet): A1.

## 5. Målene (tabellene i skriptet)

Rammen: x forover fra speilets topp (foten 0,10 m forut: speilet heller akterover), y til babord, z opp fra kjølens underkant; vannlinja
z = 1,35; spillets origo x = 4,725.

| Mål | Verdi | Kilde |
|---|---|---|
| Ripa (`SHEER`) | 2,45 akter, 2,42 laveste ved 2 m, 2,98 ved stevnen (fribord 1,10 / 1,07 / 1,63) | R (det første skriptet) |
| Halvbredde ved ripa (`BS`) | 1,65 største (3,30 m), 1,42 ved speilet | R |
| Halvbredde i vannlinja (`BW`) | 1,40 største (2,80 m) | A (B3) |
| Stevnen (`KB` forut) | i vannlinja ved 8,68 m, rundt opp til 9,45 m | R (det første skriptet), A |
| Kjølen (`KB` akter) | underkant 1,35 m under vannlinja ved 1,6–3,5 m, litt drag forover, akterkant ved 1,30 m, halv bredde 0,08 nede og 0,15 ved roten | R (dypgangen), A |
| Kjølroten (`ZROOT`) | 0,53 m under vannlinja midtskips, opp til speilets fot 0,07 m under vannlinja | A (`check()`) |
| Dekket | 0,55 m under ripa (skansekledningen), 4 cm bue | R |
| Styrhuset | 0,95–3,75 m, halv bredde 1,28, karm 0,95 og vinduets overkant 1,72 over dørken, 1,98 under taket | R |
| Ruffen | 6,40–8,55 m, 0,78 m over dekket | R |
| Propellen | Ø 0,54 m, tre blad, sentrum 0,75 m under vannlinja ved 0,88 m | A (100 hk ved rundt 2,5:1) |

## 6. Lanternene

Sjøveisreglene (FOR-1975-12-01-5) slik de står i `docs/batplan.md` del 11. Båten er 9,45 m, under 12 m: regel 23 (d)(i), én hvit rundtlysende og
sidelanterner (spillet tenner også akterlanterna, `lanterns()`). Vedlegg I 2(d): den rundtlysende minst 1 m over sidelanternene (her 2,81 m).
Vedlegg I 2(g): sidelanternene høyst tre firedeler så høyt over skroget som den hvite (1,29 mot 3,08 m). Sidelanternene sitter på en plate på
styrhussidene over den forreste stolpen, under takkanten, med skjerm innenbords (LYS-02). Den hvite står på mastetoppen, 1,9 m fra flaggstanga
og over den, så spillet gir vimpel (båten har mast, `mastTop`). Typer i ankrene: `allround`, `port`, `stbd`, `stern`, `work` (arbeidslysene under
takkanten, ikke lanterner).

## 6.1 Kritikksløyfen (01.11.2026)

Verktøyene ligger i `tools/boats/qa/`: `shots.py` (K1–K7 og nærbilder), `lines.py` (spantriss og profil fra tabellene, volumet; nytt, generalisert
fra `lines_snekke26.py`), `clip_plast31.py` (klasjsjekken), `plast31.py check` og eksporten.

| Runde | Hva | Funnet | Rettet |
|---|---|---|---|
| 0 | Volumet av det gamle skroget (`stubcheck.py --volume curve`, `lines.py`) | 21,9 t mot 6 t; snittet er en superellipse fra kjølens underkant | Ny kropp (A1) |
| 1 | `lines.py` på de nye tabellene | 7,9 t; flat bunn med en knekk i kimmingen i vannlinja og kjølen som en tynn finne | Under vannlinja en kubisk kurve som møter vannlinja langs utfallets helning; kjølen avsmalnende mot roten |
| 2 | `lines.py` | 7,6 t | Vannlinjebredden 2,80 m (85 %), kjølroten høyere: 6,64 t (11 % over) |
| 3 | Første bygg og rendring (`shots.py` r1) | 78 283 trekanter; skroget, kjølen, brønnen, roret, hullene og konsollen sitter; styrhuset står høyt og kasseaktig (Jonas midt i økta: «den minst estetisk pene modellen … frie tøyler til å skape en pen båt») | Mer spring forut, teak scueringslist, stripa bredere; dørken i styrhuset senket 0,30 m under dekket (hull i dekket, foring, trinn ved døra), så huset står lavere; svart vindusbånd |
| 4 | Klasjsjekken | 1 768: scueringslista telt som dekk utenfor skroget (1 698, meningen), lensportenes hengselstang og klaff utenpå (70), kjettingrøret gjennom baugen (10), trinnet og dørken i det nedsenkede styrhuset (32) | Sjekken kjenner lista, lensportene og det nedsenkede huset; vinsjen og røret 6 cm akterover: 0 |
| 5 | `vessel3d`s grense for fjernmodellen (12 000 punkter) | 6 499 trekanter fjern (19 500 punkter) | Færre rader i kjølen, bunnen og ved lista, ingen pullerter, karmer eller dørbeslag i `build(False)`: 3 783 |
| 6 | I spillet (`p31shot.py`, `TAG=r1`) | Modellen vises (76 751 trekanter, alle ankre, seks typede lys); fra broa synes kompasset, men dashbordet var like mørkt som skjermene | Dashbordet lyst, skjermene i mørke rammer |
| 7 | Nærbilde av hekken | Innsida av speilet og dekket lå i samme plan som speilets utside (grå flekk på speilet) | Dekket og innsida begynner 6 cm forut (`TT`), speilets topp har egen teakkapp |
| 8 | Hekken og takkanten | Speilet bredt og flatt som en kasse; takkanten hvit og tykk | Hekken avrundet i plan inn til 72 % av bredden; takkanten marineblå som stripa, kappen i teak, eksosen rustfri med svart topp; sløyebordet smalere (0,65 m) |
| 9 | Testene (`vessel3d`, `brotest`, `lanterntest`, `regmarktest`, `vesseltest`, `maletest`, `walktest`) | `maletest`: navnet og registreringsmerket lå oppå hverandre på baugen (merket 0,71–1,28 m over vannet) | Navnefeltene under merket, x 6,6–7,75 |
| 10 | Etter-bildene fra spillet | En mann sto oppå styrhustaket: spillets dekkskart (`deckMap`) krever 1,85 m over en dekkscelle, så dekket under visiret (1,65 m med den senkede dørken) falt ut, og taket ble knyttet til dekket via lasteromslokket (1,5 m opp, 0,3 m bort); døra, påfyllingen og plassen akter havnet på taket | Visiret 4 cm forbi fronten, luka 0,22 m forover, blødekaret og plassen akter flyttet (den smale gangen akter for huset er ikke dekk i kartet): alle plassene på dekket |

## 6.1b Testene (01.11.2026)

Grønne på den endelige modellen: `vessel3d plastsjark` (230 265 punkter nær, 119 997 middels mot 120 000, skroget 9,45 × 3,34 m, alle plassene),
`brotest plastsjark` (1,96 m over plassen, øyet 1,65), `lanterntest`, `regmarktest` for plastsjarken (merket på jevn maling, 0,55 m fra stevnen),
`vesseltest`, `maletest` (sone 1–4; navnet og merket ligger ikke oppå hverandre), `walktest` (alle plassene, 0 veier gjennom huset). Rød som var
rød før: `regmarktest` for `ringnot38` (også rød mot bygget fra før endringen, `KYST_DIST`). Plassene på dekket sjekket med `qa/deckpoints.py`
(alle i dekkets høyde). Skjermbilder fra spillet i begge formater, før og etter: `tests/out/p31_for_*.png`, `p31_etter_*.png` (utenfra, akter,
broa, dekket under fiske, natt K6); K6 fra begge sider i Blender (`tools/boats/out/qa/p31etter_K6.png`, `_K6p.png`).

## 6.2 Arbeidet om bord (plassene)

Fiskeren står ved haleren på styrbord ripe (5,95 m fra speilet, like akter for ruffen) med ansiktet utover. Blødekaret (`work.tub`) står på
dekket rett akter for ham, så fisken går fra ripa rett i karet. Sløyebordet er båtens eget, i stål tvers over babord ripe (4,95–5,75 m,
`work.table`, `own`, `top` 0,90 m over dekket), med ytterkanten 3 cm utenfor ripa så avfallet går i sjøen; den som sløyer står på dekket
innenfor det. Lasteromsluka ligger midt mellom dem, så den sløyde fisken går rett ned i rommet på is (`hold.kind` `rom`). Garnkaret, stampene og
den første lasten står på lukelokket, den andre lasten på akterdekket. Skipperen står ved rattet i styrhuset med døra forut om babord rett ut
på arbeidsdekket, og ser fiskeren gjennom frontrutene.

## 7. Det som ikke kan måles

- **Deplasementet:** skroget gir 6,63 t under vannlinja mot 6 t i `VESSELS` (11 % over; 6 t gir vannlinja 3 cm lavere). Grunnere blir bunnen
  flat. Annonsene nevner 5–11 t, trolig 7–8 t i drift; dataene er ikke endret.
- **Bredden:** registrene og annonsene sier oftest 3,05 m (3,10–3,20 på noen), spillet har 3,30. Ikke endret: det første skriptet leste 3,05–3,30, og
  ingen kilde i økta kunne åpnes og leses i sin helhet.
- **Alt under vann og alt på tvers:** kjølen, roret, propellen, vannlinjebredden og alt inni (konsollen, benken, lukene) er antatt for typen.

## 8. Spørsmål til Jonas og bilder som ville gjort resultatet bedre

- **Hvor står styrhuset?** Besvart 09.11.2026 (OB7, kap. 10): forut. Før: spillet og batplanen har styrhus akter og arbeidsdekk midtskips. Utdrag av annonser for Viksund 31 nevner «glass
  skyvedør ut til bakdekk» og «stort lasterom akter», som tyder på styrhus midtskips og arbeidsdekket akter på noen av dem. Modellen følger
  spillet til et bilde avgjør det.
- **Bilder:** et rett fra siden av en Viksund 31 Sjark med kjent lengde (annonse eller brosjyre), helst på land så kjølen, roret og propellen
  synes; et rett akterfra (speilet, roret); et rett forfra (utfallet og stevnen); et inn i styrhuset (konsollen, døra) og et ovenfra over
  arbeidsdekket (luka, haleren); og helst produsentens tegning.

## 9. Selvvurdering (01.11.2026, etter Jonas' spørsmål)

**Karakter: 66 av 100.** Skroget, kjølen, propellbrønnen, hullene, lanternene, testene og dokumentasjonen holder nivået fra de andre
revisjonene, og båten er klart penere enn før. Det som trekker ned:

- **Ingen overlegg.** Kritikksløyfen krever overlegg; uten foto skulle den ortografiske rendringen vært lagt over profilen fra `qa/lines.py`
  (slik trebåten og skiffen gjorde mot linjene fra tabellene). Det ble ikke gjort.
- **Spillets krav ble funnet av testene og etter-bildene, ikke slått opp først.** `sulebas-bygging.md` kap. 11 sier at spillet stiller krav
  som må slås opp før overbygget formes. Dekkskartets 1,85 m og koblingen til taket (runde 10) og navnet mot registreringsmerket (runde 9)
  kostet to ekstra runder med tester og bilder (rundt to timer).
- **Et avvik i rendringen ble bortforklart.** De grå strekene på speilet i runde 1 og 2 ble skrevet bort som støy i slitasjen; i runde 3 viste
  de seg å være to flater i samme plan, den feilen regelen i kap. 7 er laget for.
- **Regelen om én SwiftShader-side om gangen ble brutt** én gang: et feilsøkingsskript gikk samtidig med `regmarktest` mot utgangspunktet
  (resultatet ble likt det kjente, men kunne vært en falsk rød).
- **Det som ble flyttet bort i stedet for løst:** gangen akter for styrhuset er for smal for dekkskartet (0,15 m mellom husets side og
  skansekledningen), så mannskapsplassen akter ble flyttet forut. Plassene for spillets livbøye på styrhusets akterskott og flåten på taket er
  ikke sett i spillet etter at dørken ble senket.
- **Det som kunne vært penere:** styrhuset er fortsatt nær en kasse (rette sider, flatt tak med bare 5 cm bue), roret er stort og flatt i
  profil, og fra broa synes instrumentene bare så vidt i spillet (dashbordet ligger lavt i synsfeltet; `hp` −0,30 ble valgt for å bestå
  `check()`, ikke formgitt fra skipperens plass).
- **Lesingen:** dokumentene i bestillingen er lest, men `ringnot38.py` bare i utdrag (hullene, utskjæringen, ankrene, eksporten), og
  `fittings.py` og `bpyutil.py` i grensesnittene; `docs/systemer/3d-baater-og-animasjon.md` 5.13, `testing.md` og `vessel3d.js`' `deckMap`,
  `markStrips` og `deckPoints` ble lest først da de feilet.

## 10. OB7: styrhuset forut, arbeidet om bord og karakteren etter Jonas' skala (09.11.2026)

Steg 85 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-61bc7d42-bfsaz0`. Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting», og om plastsjarken (valg 20): «Dette er kanskje den svakeste båten vi har. Du får frie tøyler til å lage en realistisk fiskebåt.» Før- og etter-bildene er tatt med `tests/ombord.py plastsjark`, bare bilder; arkene ligger i `docs/okter/2026-11-09-ob7/`.

### 10.1 Bildene av typen (valg 22 B) og Jonas' valg

`commons.wikimedia.org`, `upload.wikimedia.org`, `digitaltmuseum.no`, `mm.dimu.org` og `api.dimu.org` ble sluppet til i miljøet ved øktas start (de var stengt for OB1, OB5 og OB6). DigitaltMuseum svarte bare med en robotsperre (Cloudflare), og det gamle søke-API-et (`api.dimu.org/api/solr`) er lagt ned; Wikimedia Commons ga 429 (for mange forespørsler) på de fleste søk, så bare et lite utvalg kom gjennom. Bildene ligger ikke i repoet, bare lenkene. Lisensene er ikke lest (metadata-API-et svarte 429); bildene er brukt som referanse for planen, ikke lagt inn i spillet.

| # | Bilde (Wikimedia Commons) | Hva det viser |
|---|---|---|
| 1 | [Sjark after being lifted off With Frohavet.jpg](https://commons.wikimedia.org/wiki/File:Sjark_after_being_lifted_off_With_Frohavet.jpg) | En plastsjark i Austevoll: styrhuset forut, åpent arbeidsdekk akter med en mann og en mast eller davit akter |
| 2 | [IMG 7027-sjark abelvær.jpg](https://commons.wikimedia.org/wiki/File:IMG_7027-sjark_abelv%C3%A6r.jpg) | Sjark på Abelvær fra siden: styrhuset forut, arbeidsdekket akter med mast og bom |
| 3 | [Nybygget sjark.jpg](https://commons.wikimedia.org/wiki/File:Nybygget_sjark.jpg) | En nybygd sjark (tre) uten innredning: styrhuset forut for midten, åpent dekk akter med luke |
| 4 | [IMG 7024 Fiskebåt på Abelvær - sjark.jpg](https://commons.wikimedia.org/wiki/File:IMG_7024_Fiskeb%C3%A5t_p%C3%A5_Abelv%C3%A6r_-_sjark.jpg) | Samme type forfra: styrhuset framme med koøyer og vinduer, rekke rundt dekket |
| 5 | [IMG 6855-Edit-fiskebåt Fosnes.jpg](https://commons.wikimedia.org/wiki/File:IMG_6855-Edit-fiskeb%C3%A5t_Fosnes.jpg) | Tresjark ved Fosnes: ruff med koøyer forut, styrhuset midt |
| 6 | [Sjark.jpg](https://commons.wikimedia.org/wiki/File:Sjark.jpg) | ST-54-T (tre) ved kai: styrhuset trolig akter (uklart fra bildet) |
| 7 | [Sjark01.jpg](https://commons.wikimedia.org/wiki/File:Sjark01.jpg) | KA 175 (plast) ved kai forfra, med flere sjarker bak |

Jonas fikk arket med de sju (og to før-bilder fra spillet) og spørsmålet om styrhuset med to valg. **Jonas 09.11.2026: «Forut».** Det passer med utdragene av annonsene for forbildet («glass skyvedør ut til bakdekk», «stort lasterom akter», kap. 8). Underveis, med et bilde av styrhuset på et fiskefartøy: «Gjør styrhustak mer realistisk som dette, med en slags brem på kanten av taket som skrår», så «Bremen på styrhuset skrår feil vei i forhold til bildet jeg sendte deg» (den sto først med overkanten ute; nå står underkanten ute og flaten skrår innover opp til taket), og «Fargen kan du bestemme selv så lenge den harmonerer med resten av designet» (marineblå som stripa under ripa). Og: «Fjern gummiklaffer på spygatt» (spygattene er åpne hull nå).

### 10.2 Dekket målt og plassene

Arbeidsdekket akter er 4,34 m langt (fra speilets innside til styrhusets aktervegg ved x 4,40) og 2,7–2,9 m bredt mellom skansekledningene (2,22 m ved x 0,3 der hekken runder). Plassene ble lagt før veggene og vinduene, og dekkskartet (`qa/deckpoints.py`) har dem alle på dekkets høyde (0,56–0,60 m i spillets ramme; skipperen 0,31 på den nedsenkede dørken):

| Plass | Modellens x (fra speilet), y (babord +) | Hvorfor |
|---|---|---|
| Styrhuset | x 4,40–6,40, inntil ruffen (6,40–8,55), dørken senket 0,30 m | Forut som på bildene; frontrutene står over ruffens tak (`check()`: karmen 6 cm over taket) |
| Skyvedøra | akterveggen midt (y −0,32–0,32), et trinn ned inne | «glass skyvedør ut til bakdekk»; `doors[0]` |
| Døra til ruffen | i frontveggen innvendig, mellom konsollen og bysse | Ruffen nås fra styrhuset |
| Haleren | styrbord ripe x 3,75 | Like akter for huset, der fiskeren ser skipperen gjennom akterruta |
| Blødekaret (`work.tub`) | x 3,10, styrbord | Rett akter for fiskeren, fisken fra ripa i karet |
| Sløyebordet (båtens eget) | over babord ripe x 3,55–4,30 | Tvers av haleren; den som sløyer står innenfor |
| Lasteromsluka | x 2,35–3,30, midt | Mellom karet og bordet og akter for dem: «stort lasterom akter» |
| Isepakkeren (`work.pack`, ny) | x 2,05, y −0,45, vendt mot luka | Spillets plass ved karet havnet oppå lukelokket |
| Garnet (`kit.garn`) og stampene (`kit.stamps`) | x 1,20, babord og styrbord | Akter, der de settes fra over hekken (F4, F20) |
| Juksaplassene (`anchors.jigZ`, ny) | styrbord x 2,25 og 1,15, babord x 2,75 og 1,65 | Fordelt på begge sider, godt en meter mellom hver på samme side (F21); `crewclip` gir 4 av 4 uten klipp |
| Mannskapsplassene | ved haleren, ved bordet, akter for luka, ved døra | |
| Dieselpåfyllingen | babord x 2,05 | Lufteren på den rette sida |

**Teinene** (F7, Jonas 09.11.2026: «Ingen teiner»): etter OB16 er kongekrabbeteina konisk med bunnring på 1,45 m, og stablene står på modellens plasser (`kit.pots.at`, `tools/boats/potplaces.json`). Plastsjarken ble målt for én stabel på seks akter på babord og plassen der en halt teine veltes og tømmes akter på styrbord (spillet legger den 1,3 m akter for haleren, der teinemannen står): ringene fikk 1–3 cm klaring til skansen, luka og hverandre selv med luka smalere og flyttet forover, og teina som tømmes, veltes innover (0,8 m høy) rett inn i stabelen. Jonas fikk valget (én stabel på seks, eller ingen teiner som havsjarken og kyst15 etter valg 25 A) og svarte **«Ingen teiner»**. `VESSELS.plastsjark.rigs` har ikke teiner, båtbladet sier at det ikke er plass til kongekrabbeteiner, og en lagring med teiner, teinehaler eller krabbekar på plastsjarken får dem tatt i land og betalt tilbake (`potsUnfit`, som snekka). Luka står der den sto.

### 10.3 Det som er endret

- **Styrhuset forut** (`WX0`, `WX1` 4,40–6,40; før 0,95–3,75): tre lente frontruter over ruffens tak, sidevinduer i ekte åpninger, akterveggen med skyvedør av glass i aluminiumsramme, et vindu på hver side av den og det svarte vindusbåndet rundt. Karmen hevet til 1,20 m over dørken (frontrutene står over ruffens tak), vinduets overkant 1,80, taket 2,00. Ruffens akterflate er husets frontvegg (de ville ligget i samme plan), og nedgangen i ruffen er en dør inne i huset. Ruffens tak er senket fra 0,78 til 0,70 m over dekket.
- **Styreplassen** flyttet med huset (`OFF`): konsollen, rattet, skjermene, stolen, benken og bysse er de samme. `check()`: 2,00 m under taket, øyet 0,45 over karmen og 0,15 under overkanten, dashbordet innenfor synsfeltet.
- **Taket med skrå brem** (Jonas): underkanten 17 cm ut fra veggene med et flatt underslag, flaten skrår innover 20 cm opp til takkanten, marineblå som stripa. Masta, radarplattformen, eksosen, lyskasteren, rekka og flåtens plass står på taket som før.
- **Spygattene åpne** (Jonas): klaffene og hengselstengene er tatt bort.
- **Vekta** (valg 18 A): formen er tegnet til vannlinja 1,35 (6,63 t, 11 % over). Den er ikke formet om; den tomme båten flyter 3 cm lavere (`WLE` 1,32, 6,01 t), og spillets ramme er hennes, som på skiffen og snekka. Dypgangen er 1,32 m tom og 1,35 lastet. Bunnstoffet og vannlinjestripa står der formen har dem.
- **Stabiliteten** (`STAB_AT.plastsjark` i `core/03c-stability.js`): luka, garnet, stampene, karet, bordet, haleren, roret og teinene lest på nytt fra ankrene. Med rommet akter gir full last trim akter (før forover). Ny sjekk i `tests/unit/trim.test.mjs`, sett rød med den gamle tabellen (−1,28°) og grønn med den nye.
- **`VESSELS.plastsjark.desc`**: «styrhus forut med to køyer i ruffen under baugen, og åpent arbeidsdekk akter med lasterom og skyvedør inn til styrhuset».
- **Klasjsjekken** (`qa/clip_plast31.py`): 0; unntaket for lufterens hatt flyttet med den.

### 10.4 Etter-bildene og det som står igjen

Etter-opptaket (`tests/ombord.py plastsjark`, begge formater, alle operasjonene: huset og alle plassene er flyttet, så ingen ble droppet) og arkene i `docs/okter/2026-11-09-ob7/`: garnet og lina settes fra binga og stampene akter over hekken uten å gå gjennom noe (F20 rettet); de som jukser, står fritt ved ripa, to på styrbord og én på babord med tre maskiner (F21 rettet; `crewclip` 4 av 4 plasser uten klipp); sløyingen ved bordet på babord og pakkingen ved karet; skipperen bak rattet med utsikt over ruffen. I teinetrekket i etter-opptaket sto teina (den firkantede fra før OB16) i de to som sorterte; plastsjarken driver ikke med teiner lenger (10.2). **Står igjen:** (1) ~~Teina i folkene (F7)~~: ingen teiner (Jonas). (2) Ingen akter ved stampene når det settes (F4, OB3). (3) De hvite flekkene ved sjøen (sprutpartiklene, felles B).

### 10.5 Karakteren (forslag; Jonas setter den)

Etter Jonas' skala (valg 17, `om-bord.md` kap. 2). Forslaget i OB0 var 63 etter en annen skala, 64 etter OB2.

| Punkt | Vekt | Forslag | Begrunnelse |
|---|---|---|---|
| Skrogutforming | 20 | 14 | Skroget er én flate med kjølen, brønnen, roret og propellen, og vekta stemmer for den tomme båten (6,01 t). Trekk: ingen tegning; bildene av typen viser planen, ikke linjene; formen er ikke målt mot noe bilde |
| Detaljer | 20 | 15 | Ekte hull med lysning og glass, skyvedør i aluminiumsramme, bremmen, spygattene åpne, 76 600 trekanter, klasjsjekken 0. Trekk: materialene er ikke PBR (F2) |
| Lanterner | 5 | 4 | Lovlige plasser etter `check()`, `lanterntest` grønn; ikke sett om natta i denne økta |
| Styrhus | 10 | 8 | Forut som på bildene, frontrutene over ruffen, konsollen med plotter, ratt og enspak, døra til ruffen inne; `brotest` grønn (2,00 m under taket, øyet 1,65) |
| Arbeidsflyt | 25 | 20 | Settingen akter uten å gå gjennom huset, juksa fordelt, sløyingen og pakkingen ved hver sin plass, døra akter rett ut på arbeidsdekket, ingen teiner fordi de ikke får plass (Jonas). Trekk: ingen akter ved stampene når det settes (F4, OB3) |
| Utforming av dekk | 20 | 17 | Haleren, karet, bordet og luka samlet like akter for huset, redskapet akter der det settes fra, juksaplassene fri av alt. Trekk: garnet og stampene står der to av juksaplassene har ryggen sin, om både garn og juksa er om bord |
| **Sum** | **100** | **78** | Over grensen, uten funn med alvor A igjen som er plastsjarkens egne. Det som løfter mer: settingen akter fra stampene (F4, OB3), materialene (F2) og bilder av typen fra siden og ovenfra |

Jonas setter karakteren.

## Endringslogg

- 09.11.2026: OB7 (kap. 10): styrhuset forut etter bildene av typen (Jonas: «Forut»), arbeidsdekket akter, bremmen på taket, spygattene åpne, den tomme vannlinja; ingen teiner (Jonas); forslag 78.
- 01.11.2026: kap. 9, selvvurderingen; `check()` regner nå også takets høyde over dekket og navnefeltet mot registreringsmerket.

- 01.11.2026: første versjon, gjennomgangen før endring og de første rundene.
