# Snøkrabbefartøyet (Snøkrabbefartøy 50 m med fryseri): byggegrunnlaget for H3d1

Havsteget H3d1 (`docs/planer/havsteget-h3-snokrabbe.md`), 07.11.2026: hele modellen av `snokrabbe` (`tools/boats/krabbe50.py`) er bygd
på nytt fra bunnen (Jonas 07.11.2026: «hele modellen skal revideres eller skapes fra bunn av med mye høyere kvalitet», «den beste modellen
i spillet», selvvurdering minst 85/100). Malen for koden er pilotbåten (`ringnot38.py`) og kystbåten (`kyst15.py`, `check()` først), for
lossingen autolineren (`al45.py`: luka og kranen som egne deler). Kildekoder som i pilot-grunnlaget: **S** sett i bilde, **T** tolket,
**A** antatt, **R** fra en skriftlig kilde.

## 1. Fakta om fartøyet

| | |
|---|---|
| Type i spillet | `snokrabbe`, «Snøkrabbefartøy 50 m med fryseri», havfartøy (`cls: 'hav'`), 60 mill. kr, kjøpes med snøkrabbetillatelsen (H3a) |
| `VESSELS` | `len` 50, `beam` 11, `draft` 6,0, `disp` 1 800 (lastet, et anslag), stål, `year` 2001, 3 600 hk, `iceClass` 1C, `crane` 5, fryserom 900 m³, RSW-tanker 400 m³, 22 om bord, 26 køyer (R: dataene) |
| Bildene Jonas bygde henne etter (06.10.2026) | Renderinger av en moderne krabbefanger (side, baug, skrått), 57 × 12 m, **ikke i repoet**. Det gamle skriptets tekst gir det de viste: det lave teinedekket akter med rekka 4,6 m over vannet, bakken fra 28 m forover med huset og styrhuset, portalen med knekkarmkranen ved siden av, shelteret over teinedekket akter, den runde forfoten under en nesten loddrett stevn (T) |
| Tegningen Jonas viste 07.11.2026 | Generalarrangementet til en snøkrabbefanger på 73,4 × 16,6 m (LPP 64, mallet dybde 7,6, dypgang 5,9; klør 30/20 t i døgnet, fryserom 1 750 m³, tank for levende krabbe 124 m³, dekkskraner, to akterbommer, 40 om bord, 12 knop). Gir arrangementet: halestasjonen midtskips om styrbord, teinene stablet i rader over det aktre dekket, lukene over fryserommet og tankene, kranene, overbygget forut med vinduer rundt (S). Skalert til 50 m (L/B 4,4 mot spillets 4,5) |
| Størrelsen | **Polar Pioneer** (IMO 9202675, Tromsø): 49,95 × 11,2 m, bygd 1999, ombygd for snøkrabbe; 52 m største lengde og 32 køyer etter rederiets høringssvar (R: Fiskeridirektoratet, høringssvar fra Polar Pioneer AS m.fl. 22.09.2023, lest; maritimeoptima.com, søkeutdrag). Spillets 50 × 11 m er hennes |
| Flåten for øvrig | Arctic Pioneer 45 m og Kvitungen 47,5 m (21 køyer, høringssvaret), Polarbris 43,5 m (to gjennomgående dekk, hoveddekk og shelterdekk; ICE-C; søkeutdrag fra The Fishing Daily), Frøyanes 69,9 × 17 m, dypgang 6,15, ice 1B, moonpool forut for teinene under shelter, Motus haleanlegg, 35 om bord (R: Baird Maritime og Fiskerforum, lest 07.11.2026), Stødig 39,3 × 11,5 m med halelem om styrbord og justerbar isplog for snøkrabbe om vinteren (R: Baird Maritime, lest) |
| Rammen | x forover fra speilets akterflate, y til babord, z opp fra skoen under propellen; vannlinja z = WL = 6,0 |

## 2. Reglene som gjelder modellen

- Bare utsiden; ingen kjøpbart utstyr modellert inn: haleren, flåtene, livbøyene, MOB-båten og radarene settes av spillet på plassene i
  ankrene (`hauler`, `kit.raft`, `kit.buoys`, `kit.mob`, `kit.radarA`, `kit.radar`). Skipets egne systemer er skrog og står: portalen med
  blokka, sorteringsbordet, transportbåndet, teinerenna, kranen med bomstøtta, lukene, ankerspillet, styrepulten.
- Ingen ekte navn: GLB-ens `name` er «Snow crab pot vessel 50 m»; ingen verft eller produsent nevnt i spillet (bare i denne doku).
- Lanternene etter sjøveisreglene (FOR-1975-12-01-5, vedlegg I; lest på Lovdata 30.10.2026 for piloten), regnet i `check()`: to topplanterner
  (regel 23(a)(ii), fra 50 m), den forreste høyst L/4 fra stevnen (M21(2) i kartleggingen, ikke rettet før nå), den aktre minst 4,5 m høyere og
  minst L/2 bak; fiskelysene rødt over hvitt 2 m fra hverandre; sidelysene høyst tre firedeler av topplanternas høyde over skroget.
- Teina etter høstingsforskriften: rømmingshullet etter vedlegg 3 f (minst 20 cm, nedre kant 10–40 cm over bunnrammen, bomullstråd høyst
  5 mm), registreringsmerket på hver teine (§ 66, fra 1.1.2024; høringsnotatet 15.06.2023: «på sideflaten i øvre halvdel»).
- Spillets krav (`sulebas-bygging.md` kap. 15) i `check()` før formen: dekkskartet (1,85 m), broa (1,8 m og synsfeltet), navnet mot merket,
  bredden og lengden i `vessel3d`, stablene under shelteret, kranens rekkevidde.

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Arrangementet | Bildene fra 06.10.2026 (det gamle skriptet), fylt ut med tegningen fra 07.11.2026: teinedekket akter med shelteret over den aktre delen (stablene under det), det åpne teinedekket midtskips med portalen og halestasjonen om styrbord, bakken forut med huset og styrhuset (T) |
| B2 | Vekta | `disp` 1 800 t er lastet (dataene): 1 762 t ved WL 6,0 (1 800 t gir vannlinja 9 cm høyere), Cb 0,58, LWL 47,8 m |
| B3 | Isklassen | 1C (dataene): isbeltet i baugen som sveiste plateskjøter 0,65 m under og 0,80 m over vannlinja fra midtskips til stevnen, slitt bart i malingen der isen skurer (A) |
| B4 | Arbeidsflyten | Lina kommer over portalens blokk ut over styrbord side til haleren innenfor rekka; teina lander på sorteringsbordet akter for haleren, tømmes, agnes og går akterover på transportbåndet langs styrbord side til stablene og til teinerenna på styrbord hekk (tegningen, planens H3d2) |
| B5 | Fargene | Jonas 20.10.2026 («Bytt gjerne fargene til et annet design som ikke ligner denne»): antrasitt skrog, oker rekkestripe og vannlinje, nesten svart bunn, kremhvitt overbygg; portalen og kranen med oker bånd |
| B6 | Kranen | Knekkarmkranen ved portalen (bildene), på en søyle om babord ved bakkens skott, bommen parkert akterover i bomstøtta over stablene; hode, bom og krok som egne deler slik at lossingen (H2d2) kan bruke den |
| B7 | Masta | Forreste mast på styrhustaket 11,4 m fra stevnen; den aktre på skorsteinen midt på shelteret, 26,2 m lenger akter og 4,5 m høyere (vedlegg I) |
| B8 | Stablene | 70 plasser à tolv (840 teiner) i fem rader: under shelteret og på det åpne dekket, med fri gang langs båndet, i midten og langs babord side |

## 4. Gjennomgang før endring: avvikslista (07.11.2026)

Spillet viste Blender-modellen (`glbHas` sann, 29 181 trekanter nær, delene lod0, glass og lod1; lysene `masthead`, `masthead2`, `port`,
`stbd`, `stern`); før-bildene er tatt i spillet i begge formater (`tests/h3dshot.py`, `TAG=for`), og K1–K7 av det gamle skriptet i Blender
(`qa/shots.py ... kr50for`). `h3dshot` var rød på tre av fem sjekker før endringen (ingen luke, ingen kran, `HELM_KIT`, ingen ankre for
H3d2, ingen MOB-plass på modellen, ingen snøkrabbeteine fra Blender).

| # | Funn | Kravet | Tiltak |
|---|---|---|---|
| A1 | **Skroget er en kasse** med trappetrinn i sheerlinja: løse grid for sidene, speilet og bakken | kap. 4.1 | Én flate (`Mesh`) fra skjegget til ripa, med sveipene der shelteret og bakken slutter |
| A2 | Ingen vekt regnet; snittet en superellipse | D8, kap. 13 | Kubisk snitt med bunnreisning, utfall og fyldighet per stasjon: 1 762 t mot 1 800 |
| A3 | Hekken: flatt speil med skarpe hjørner (M4) | M4 | Avrundede hjørner i plan, akteråpningen og teinerennas port som ekte hull, navnet, dypgangsmerkene |
| A4 | **Teinedekket tomt (M1)** og ingen stabler synlige; shelteret aktert lukket | M1 | 70 stableplasser i fem rader under og foran shelteret, værport i shelterets sider |
| A5 | Ingen teinerenne, intet sorteringsbord som eget bord | H3d1 | Bord, bånd og renne som skipets egne, ankrene for H3d2 |
| A6 | **Forreste topplanterne 16,5 m fra baugen** (M21(2)) | vedlegg I 3(a) | Masta på styrhustaket, 11,4 m fra stevnen |
| A7 | Broa: en svart stolpe midt i utsynet (før-bildet `bro`), konsollen fra `HELM_KIT` | kap. 15.6 | Eget styrepult med skjermer, ratt, spaker, stoler; vinduer rundt hele styrhuset, også akter mot dekket |
| A8 | MOB-båten bakt inn (MOBCUT), bøyene og flåtene fra `KITADD` | Ø11.5 | `kit.mob`, `kit.raft`, `kit.buoys` på modellen; KITADD og MOBCUT for typen fjernet |
| A9 | Ingen luke og ingen kran som deler: lossingen brukte mottakets kran | H2d2 | `hatch` og `crane` som på autolineren |
| A10 | Store flate sider uten plateskjøter, lensporter eller isbelte (M3) | M3, SKR-09–11 | Sveiste skjøter, isbeltet, lensporter med klaff, spygatter, rubbelister, hawse-rør |
| A11 | Under vann: ingen slingrekjøl, ingen thrustertunnel, ingen sonar | M15 | Slingrekjøler, baugthruster med rist og symbol, anoder, sjøkister, sonarkum, ekkoloddgivere |
| A12 | 29 181 trekanter nær | budsjettet 300k | Mer detalj innenfor budsjettet |
