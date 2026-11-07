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

## 5. Lanternene (FOR-1975-12-01-5 vedlegg I, regnet i `check()`)

| Lys | Plass | Kravet | Verdi |
|---|---|---|---|
| Forreste topplanterne | toppen av masta på styrhustaket, x 38,6, z 23,65 | 3(a): høyst L/4 (12,5 m) fra stevnen; 2(a)(i): minst bredden (11 m) over skroget | 11,4 m fra stevnen; 14,25 m over teinedekket (det øverste gjennomgående dekket: bakken og shelteret går ikke hele lengden) |
| Aktre topplanterne | toppen av aktermasta på skorsteinen, x 12,35, z 28,25 | 2(a)(ii): minst 4,5 m over den forreste; 3(a): minst L/2 bak | 4,50 m over, 26,2 m bak |
| Sidelysene | vingenes forkant, ±5,38 m ut, z 16,20, skjermet innenfor | 2(g): høyst tre firedeler av topplanternas høyde over skroget; forut for topplanterna | 6,80 mot 10,69; 2,9 m forut |
| Fiskelysene | rødt over hvitt på armen forut for masta, z 22,30 og 20,30 | 2(i)(ii): minst 2 m fra hverandre (fra 20 m), det nederste minst 4 m over skroget; 2(j): det hvite minst to ganger avstanden over sidelysene | 2,00 m; 10,90 m; 4,10 over sidelysene |
| Akterlyset | på stolpen midt på shelterets akterrekke, z 13,65 | | 7,65 m over vannet |

M21(2) i kartleggingen (den forreste topplanterna 16,5 m fra baugen på den gamle modellen) er rettet.

## 6. Arbeidsflyten og plassene (kap. 19: lagt inn før veggene)

Plassene ble satt først og regnet i `check()`: rekka ved haleren 1,20 m over teinedekket, blokka 0,95 m utenfor siden og 3,50 m over rekka,
sorteringsbordet 0,95 m høyt og 0,15 m over båndet, båndet 18,55 m fra bordet til renna, 70 stableplasser (840 teiner) med 0,69 m fri gang
langs båndet, 1,03 m i midtgangen og 0,78 m langs babord side, stablene 0,22 m under shelterets tak og bjelkene mellom toppene, kranbommen
11,4 m som når luka (5,5 m), 9,7 m utenfor babord og 2,1 m utenfor styrbord. Trappene og dørene er ankre (`stairs`, `doors`), og ankrene
H3d2 trenger står i `anchors.snok`.

## 7. Kritikksløyfen

| # | Funn | Rettet |
|---|---|---|
| 1 | Første `check()`: 1 684 t (−6 %) | fyldigheten midtskips 0,90 → 0,965: 1 762 t |
| 2 | Vannlinjene: 0,524 m i stigningen akter (filteret tok punkter under kroppen ved skjegget) | filteret 0,5 m over bunnlinja: 0,011 |
| 3 | Stablene på tolv kolliderte med shelterets bjelker (−0,08 m) | bjelkene midt mellom stableplassene |
| 4 | Kranens rekkevidde om styrbord 0,7 m | bommen 11,4 m |
| 5 | `wh_ring` med punkter på linje ga deling på null i `offset_poly` | bare hjørnene til takets omriss |
| 6 | K1–K5: portalens bein manglet (en loddrett bjelke i `beam()` klapper sammen) | `up=(1, 0, 0)` for stolper |
| 7 | K5, K7: husveggene flekkete rundt vinduene (glatt skygge over boolske vifter) | flat skygge etter kuttet |
| 8 | K1: baugen full og rund øverst, som en slepebåt | halvbredden forut smalere øverst |
| 9 | Teinerennas port lå utenfor speilets avrundede hjørne | porten flyttet inn til y −3,95 |
| 10 | K2, c_stern: flatt speil uten beslag | fender rundt hekken, loddrett fender om babord, navnefeltet over fenderen |
| 11 | c_wh: kassene for panamaklyssene sto ut av skansekledningen som trekanter | ovale ringer på innsida |
| 12 | Fjernmodellen 7 956 trekanter | grovversjonen uten kutt og småbeslag: 3 891 |
| 13 | Bøyestangas flagg svart (to flater i ett plan) | tynn plate |
| 14 | `h3dshot`: havflåtens bilder tatt fra inni eget skrog | deg i kystbåten |
| 15 | Jonas: «Jeg hater at du lager helt flate styrhustak … Vanlige styrhus har jo en slags brem, eller skrående kant øverst over vinduene» (bildet: et blått bånd som skrår ut og opp over vinduene) | bremmen skrår 0,42 m ut og 0,58 m opp fra 0,16 m over vindusbåndet til takkanten rundt hele styrhuset (0,57 m ut over frontrutene), en kant på 6 cm, så taket med svak bue; et lavere bånd rundt husets tak; i skrogets farge, sone 2 (sone 1 er skroget for `markStrips`) |
| 16 | Navnet på bremmen: `houseFront` fant ingen stripe der bremmens hjørner bøyer bort (navntesten rød) | stripa krymper til den passer (`vessel3d.js`) |
| 17 | I spillet: en kam av kiler fra rekka til vannlinja på babord baug (bildene `ute` og `ovenfra`; først tatt for styrbord og for mellomversjonen). Våtheten, skadene, normalene, AO, merkene, teinene, farten og en annen båt på samme sted utelukket; GLB-en lest inn i Blender viste kammen | `pchip` bufret splinene på `id(tab)`, og `keel_t` og `wk` sender en ny liste hvert kall: når en id kom igjen, fikk en stasjon feil spline, skjegget negativ bredde og snittet falt sammen til en korde. `check()` kjører før byggingen og ga babord feil ved noen stasjoner. Bufferen bruker nå innholdet, og `check()` sjekker at sidene er like (rød 4,0 m, grønn 0,0000). Mellomversjonen ble før det bygd i skriptet i stedet for med Decimate (36 393 trekanter); den beholdes, men Decimate var ikke skyldig |
| 18 | Stablene om bord ble aldri tegnet: koden leste `pots.big`, fartøyet bærer `pots.sno` | `potsAboard()` (M1 rettet i spillet, ikke bare i modellen) |
| 19 | Bildenavnene i `h3dshot`: kameraets yaw + er babord, ikke styrbord (sidelysene i nattbildene: rødt i «natt_sb») | yaw byttet for natt_sb/natt_bb, bildene døpt om; K1 er babord baug, K2 styrbord hekk |

## 8. Selvvurdering (07.11.2026)

**Karakter: 85/100**, akkurat på kravet (Jonas: minst 85). Bildene fra spillet ligger i `tests/out/h3d_etter_*` (før: `h3d_for_*`), i
begge formater.

Det som holder:
- **Skroget** er én flate med dødved, bunnreisning, utfall og fyldighet per stasjon: 1 762 t mot 1 800, jevne vannlinjer (0,011), og
  babord og styrbord like i alle 227 stasjonene (ny kontroll). Isbeltet, rubbelistene, sveiseskjøtene, dypgangsmerkene, thrustersymbolet
  og lensportene med klaff står på platene; åpningene er ekte hull med kanter.
- **Arbeidet er lagt før veggene** og regnet i `check()` (12 grupper, alle OK): rekka ved haleren, blokka, bordet, båndet, renna, 70
  stableplasser med gang rundt, kranens rekkevidde til luka, kaia og stablene. Ankrene H3d2 trenger, luka og kranen som egne deler, og
  `kit`-plassene i modellen (`KITADD`, `MOBCUT` og `HELM_KIT` for typen er borte). I spillet: haleren under portalen, teina på bordet,
  mannskapet ved halestasjonen og stablene om bord (bildet `drag` og `teinedekk`).
- **Lanternene** er lovlige etter vedlegg I og sett i spillet om natta fra begge sider og akterfra: rødt og grønt sidelys, begge
  topplanternene, akterlyset; fiskelysene av under gange.
- **Broa** har egen pult, ratt, spaker og skjermer, vinduer rundt hele styrhuset, og bremmen Jonas ba om rundt taket.
- **Budsjettene:** 123 449 trekanter nær (300 000), 36 393 midt (40 000), 3 891 fjern (4 000).
- **Testene:** enhetstestene 1 800 OK; `snokrabbetest`, `krabbefabrikktest`, `vesseltest`, `regmarktest`, `maletest`, `lanterntest` OK;
  `walktest` rød bare for autolineren (kjent i backloggen); `h3dshot` rød før og grønn etter.

Trekk:
1. **Jonas måtte påpeke det flate styrhustaket.** Vanlige styrhus har en brem eller en skrående kant over vinduene, og det burde
   vært med fra start.
2. **Kammen på babord baug** sto i to eksporter før den ble funnet. Jeg la den først på Decimate i mellomversjonen, så på styrbord side;
   begge deler var feil. Årsaken var spline-bufferen i `pchip`, arvet fra `kyst15.py`, og den ble funnet først da GLB-en ble lest inn i
   Blender igjen. Kontrollen av sidene sto ikke i `check()` fra start.
3. **Stablene ble ikke tegnet** i spillet (koden leste `pots.big`) før etter-bildene viste det tomme dekket; `check()` regnet plassene,
   men ingen prøve så dem i spillet.
4. **Mål på tvers, høydene i huset og fargefeltene er antatt**: bildene fra 06.10.2026 ligger ikke i repoet, og tegningen fra 07.11.2026
   er et større fartøy skalert ned.
5. **Haleren er vår egen** (ingen tegning av en ekte), og registreringsmerket er ikke skrevet på blåsa ennå.
6. **GLB-en er 5,9 MB** mot 0,6 MB før.
7. `deckshot`, `potshot`, `haultest` og `landtest` er ikke kjørt (H3d2 kjører dem med animasjonene).

## 9. Spørsmål og bilder som ville gjort resultatet bedre

1. **Bildene fra 06.10.2026** og helst generalarrangementet eller et bilde rett fra siden av et norsk snøkrabbefartøy rundt 50 m: da kan
   modellen legges over hver runde, og målene på tvers og husets høyder trenger ikke være antatt.
2. Et bilde av halestasjonen og sorteringsbordet om bord (hvor bordet står mot haleren, og hvordan teina går til båndet), og av stablene
   under shelteret.
3. Haleren: et bilde eller merke (bare til tegningen, aldri som navn i spillet).
4. Om fargene (antrasitt, oker, kremhvitt) skal stå, eller om du vil ha et annet design.
