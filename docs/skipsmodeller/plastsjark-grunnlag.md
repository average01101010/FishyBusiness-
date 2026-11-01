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
| Type | Plastsjark med styrhus akter, åpent arbeidsdekk med lasterom midtskips, ruff forut med to køyer, full kjøl | R (`VESSELS.plastsjark.desc`, `docs/batplan.md` del 3) | Låst |
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
| B4 | Planen for dekket | Beholdes som i spillet og batplanen: styrhus akter, arbeidsdekk midtskips, ruff forut. Søket 01.11.2026 fant annonser som tyder på styrhus midtskips og arbeidsdekk akter på noen Viksund 31 («glass skyvedør ut til bakdekk», «stort lasterom akter»), men utdragene er usikre, så det er ikke endret (kap. 8, spørsmål til Jonas). |
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

## 7. Det som ikke kan måles

- **Deplasementet:** skroget gir 6,64 t under vannlinja mot 6 t i `VESSELS` (11 % over; 6 t gir vannlinja 3 cm lavere). Grunnere blir bunnen
  flat. Annonsene nevner 5–11 t, trolig 7–8 t i drift; dataene er ikke endret.
- **Bredden:** registrene og annonsene sier oftest 3,05 m (3,10–3,20 på noen), spillet har 3,30. Ikke endret: det første skriptet leste 3,05–3,30, og
  ingen kilde i økta kunne åpnes og leses i sin helhet.
- **Alt under vann og alt på tvers:** kjølen, roret, propellen, vannlinjebredden og alt inni (konsollen, benken, lukene) er antatt for typen.

## 8. Spørsmål til Jonas og bilder som ville gjort resultatet bedre

- **Hvor står styrhuset?** Spillet og batplanen har styrhus akter og arbeidsdekk midtskips. Utdrag av annonser for Viksund 31 nevner «glass
  skyvedør ut til bakdekk» og «stort lasterom akter», som tyder på styrhus midtskips og arbeidsdekket akter på noen av dem. Modellen følger
  spillet til et bilde avgjør det.
- **Bilder:** et rett fra siden av en Viksund 31 Sjark med kjent lengde (annonse eller brosjyre), helst på land så kjølen, roret og propellen
  synes; et rett akterfra (speilet, roret); et rett forfra (utfallet og stevnen); et inn i styrhuset (konsollen, døra) og et ovenfra over
  arbeidsdekket (luka, haleren); og helst produsentens tegning.

## Endringslogg

- 01.11.2026: første versjon, gjennomgangen før endring og de første rundene.
