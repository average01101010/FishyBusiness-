# Havsjarken: byggegrunnlaget for revisjonen (F5)

> Grunnlaget for revisjonen av `sjark` («Havsjark 35 fot (10,6 m) med bakk og styrhus»), skriptet `tools/boats/havsjark35.py`, etter malen i
> `sulebas-pilot-grunnlag.md` og arbeidsmåten i `sulebas-bygging.md`. Bestilt av Jonas 01.11.2026: «Løft den til samme nivå og arbeidsmåte som
> pilotbåten ringnot38 og de reviderte båtene trebat, skiff, snekke og plastsjark». Ingen bilder fulgte med bestillingen.
>
> Kildekoder: **G** målt på verftets profil- og generalarrangementstegning av forbildet (det første skriptet, 02.10.2026; tegningene ligger ikke i
> repoet, bare målene i skriptet), **R** spillets data og dokumenter, **J** Jonas' ord, **A** antatt (vanlig for typen, vårt valg), **M** målt på
> modellen.

## 1. Fakta om båten

| Hva | Verdi | Kilde | Følger for modellen |
|---|---|---|---|
| Type | Tung havsjark i plast med lang ballastkjøl, styrhus midtskips på en kort bakk, lasterom og redskapsrom akter, høy mast med lastebom og styttesegl på aktermasten | R, G | Låst |
| Forbilde | Viksund Havsjark 35 (navnet står bare i skriptets kommentar og her) | R | Ikke i spillet: `VESSELS.sjark.desc` hadde «(Viksund 35)» og GLB-en het «Viksund Havsjark 35»; begge rettet (A19) |
| Lengde o.a. | 10,57 m | R, G | `vessel3d`: −6 % til +3 % |
| Bredde | 4,10 m (3,98 ved ripa, 4,03 over fenderlista) | R, G, M | ±5 % |
| Dypgang | 1,60 m i dataene; tegningens kjøl går 1,78 m under tegningens vannlinje | R, G | Dataene endres ikke (annonsene sier 1,6); avviket står i `check()` |
| Deplasement | 12 t | R | `check()`: 12,5 t ved tegningens vannlinje, 12 t to cm lavere |
| Maskin | 180 hk diesel, 8,5 kn marsj | R | Aksel ut gjennom kjølens akterkant, tre-blads propell Ø 0,68 i brønnen foran roret, tørr eksos gjennom styrhustaket |
| Byggeår | 1985 | R | Gelcoaten gulnet i flekker, slitt på ripa og dekket der folk står (B16) |
| Standard om bord | Kartplotter og VHF | R | Del av båten: plotteren i konsollen, VHF-en under taket |
| Farger | Hvitt skrog, mørkerød fenderliste og ripe, rød stripe, rødt bunnstoff, svart vannlinjestripe, hvitt overbygg, grågrønt dekk | G (det første skriptet) | Sone 1 skrog, 2 stripe, 3 overbygg, 4 dekk |

## 2. Reglene som gjelder modellen

- Ingen ekte navn, merke eller logo, heller ikke i GLB-ens `name` (nå «Havsjark 35 fot»).
- Bare utsiden; gjennom vinduene synes konsollen, rattet, stolen, benken og kokeplata.
- Ingen kjøpbart utstyr modellert inn: haleren, karene, stampene, garnet, livbøyene, flåten og radarene settes av spillet (`hauler`, `work`, `kit`).
- Lanternene på lovlige plasser (kap. 5).
- Det spillet er avhengig av, beholdes: typenavnet `sjark`, sone 1–4, og alle ankrene; nye: `doors`, `work`, `hatch`, `bunk`, `exhaust`.

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Ombygging eller nytt skript? | **Nytt skript etter `plast31.py`.** Skroget var to løse rutenett med speilet som trappetrinn og ballastkjølen som egen kropp hengt under, hullene var flater. Målene fra tegningene (G) beholdes som de ble målt: kjølen, forfoten, stevnen, speilets fall, ripa med den lave midja til styrbord, bakken, fenderlista, halvbreddene, styrhuset med vinduene, redskapsrommet, lukene, halestasjonen, mastene, bommen og seilet. |
| B2 | Skala | Tabellene i meter; `check()` regner modellen mot `VESSELS`, lanternereglene og spillets krav (kap. 15 i `sulebas-bygging.md`). `lines.py` tegner spantrisset (`tools/boats/out/qa/hs35_new_lines.png`). |
| B3 | Kjølen | Del av skrogets snitt: snittet starter på kjølens underkant (KEEL, G), går opp kjølens side og inn i bunnen gjennom en hul kjølrot (kvadratisk Bézier). Kjølens tykkelse 0,24–0,32 m (A). |
| B4 | Styreplassen | Skipperen står til styrbord ved x 6,60 bak rattet (0,39 m), øyet 2,65 m over vannet, konsollen under frontvinduene med dashbordet som skrår opp forover og plotteren, ekkoloddet og motorpanelet vendt mot ham, kompasset på toppen, VHF-en under taket, stolen bak ham, benken og kokeplata til babord. `hp` −0,26, `fov` 60: dashbordet 44° under øyet, inne i synsfeltet. |
| B5 | Formasta | Flyttet fra x 5,27 (stod inne i styrhusets akterkant) til x 5,40 inne i husets babord akterhjørne, gjennom taket med mansjett (profilen sa 5,46) |
| B6 | Arbeidsflyten | Fiskeren ved haleren i den lave midja til styrbord (x 4,5), blødekaret rett akter for ham, sløyebordet over babord ripe tvers av luka, den som sløyer innenfor det, luka imellom (fisken ises i rommet). |
| B7 | Styttesegl (M5) | To egne deler i GLB-en: `sail` (satt) og `sailf` (beslått på bommen med gaffelen senket). Spillet viser det satte til sjøs og det beslåtte i havn og i verftets visning. |
| B8 | Taket ved bakken | Styrhustaket står 1,32 m over bakkens gang ved siden av huset og ble tatt for dekk (spillets lenkeregel: inntil 1,6 m og 0,6 m). Kan ikke løses i formen uten et urimelig høyt hus; spillet fikk regelen at et tak over et rom med egen dørk ikke er dekk (A20). |

## 4. Gjennomgang før endring: avvikslista (01.11.2026)

Spillet viser Blender-modellen (`glbHas('sjark')` sann, 26 466 trekanter, delene lod0/glass/lod1, fire typede lys, sone 0–4, mast), ikke
byggesettets reserve. Før-bildene fra spillet: `tests/out/hs35_for_*_liggende.png` (alle sju: ute, akter, bro, dekk, natt, natt fra babord, ovenfra)
og `hs35_for_{ute,akter,bro}_staaende.png` (`tests/hs35shot.py`; den stående runden nådde tidsgrensen på 25 min etter tre bilder i SwiftShader).
Dagens modell rendret fra K1–K7: `tools/boats/out/qa/hs35for_*.png`, arket `hs35for_ark.png`. Dekkpunktene (`qa/deckpoints.py sjark`): alle
plassene på dekkhøyde 0,63–0,67, men høyeste dekkcelle 3,35 m (taket).

| # | Avvik | Hvor | Alvor | Tiltak |
|---|---|---|---|---|
| A1 | **Skroget er ikke én flate**: to rutenett per side som ikke deler punkter i kjøllinja, speilet en trapp av egne flater, ballastkjølen en egen loftet kropp hengt under bunnen (to flater i samme rom ved kjølrota) | `hull`, `keel` | H | Ett nett: snittet fra kjølens underkant over bunnen, kimmingen og sida til ripa, speilet, kappen, innsida av skansekledningen, dekket, bakkens skott og bakkedekket deler punkter |
| A2 | **Åpninger er ikke hull**: lensportene mørke plater, koøyene tori utenpå sida, døra en plate på veggen, luka en kasse | `freeing`, `ports`, `door` | H | Ekte hull med lysning: koøyene med glass, ring og vrider, lensportene gjennom skansen med gummiklaff på hengselstang, forluka med ramme og røkfarget lokk, lasteromskarmen ned i rommet med lukelemmer og liten luke, styrhusdøra med karm, blad, vindu og trinn inn, utløpene for kjølevann og lensepumpe |
| A3 | **Formasta står i styrhusets vegg** (x 5,27 mot husets akterkant 5,25) | `rig` | H | Flyttet inn i husets babord akterhjørne (B5) |
| A4 | **Sidelanternene bare 0,73 m under den hvite** (allround på en stake på taket, 3,62) og under en firedel av høyden: brudd på vedlegg I 2(d) | `lights` | H | Den hvite rundtlysende på formastas topp (8,54), sidelanternene med skjerm på husets sider ved frontene (2,90): 5,6 m imellom |
| A5 | **Fiskelysene tennes over mastetoppen**: spillet satte hvitt på den hvites plass og rødt en meter over den, mens modellens rødt-over-hvitt sitter på armer forut for masta (8,23 og 6,82) | `vessel3d.js lanterns` | M | Typede lys `fishR`/`fishW`, som spillet nå tenner der de er (A20) |
| A6 | **Styttesegl oppe i havn** (M5), stivt | `sail` | M | B7; `F.sail` med bue, lik og panel |
| A7 | **Broa**: konsollen var en kasse med skrå topp under vinduene, utenfor synsfeltet (`hp` −0,06, `fov` 58), rattet inni konsollen, ingen stol | `console`, ankrene | H | B4 |
| A8 | **Redskapsrommet akter er en glatt kasse** uten dør, ventil eller takkant (kartlegging) | `GR` | M | Vegger på dekket og ripa, dør i den skrå veggen med karm, blad, vindu, håndtak og hengsler, lameller i akterveggen, tak med kant og dryppkant, håndlist |
| A9 | **Tomt dekk ovenfra** (M14) | – | M | Fendere, slangetrommel, tauknipper, pullerter, klamper, sugelufter, påfyllingsluke og lufterør, flaggstang |
| A10 | **Registreringsmerket skjevt på skrå stevn** (M6) | `markStrips` | M | Spillets felt, ikke modellen; navnefeltene flyttet akter for merket (`names`) så de aldri ligger oppå hverandre; sjekkes i `regmarktest` og `maletest` |
| A11 | Under vann: roret en plate, propellen 3 blad uten nav mot kjølen, ingen anoder | `under` | M | Sko fra kjølen til rorets hæl, profilror (`F.foil_rudder`) med stamme og lager, propell (`F.propeller`) Ø 0,68 på aksel ut av kjølens akterkant med stevnrør og anode, sinkanoder, ekkoloddgiver, sjøvannsinntak |
| A12 | Styrhuset: vinduene i ekte hull (beholdt), men taket et tykt lokk uten kant; ingen vindusviskere; døra en plate | `wheelhouse` | M | Tak med mørkerød kant i fenderlistas farge, dryppkant og bue; viskere på de tre frontrutene; dør i ekte åpning (A2); arbeidslys under takkanten akter |
| A13 | Riggen: ingen fester for vantene (endte i lufta over ripa), forstaget til ingenting | `rig` | M | Vantskruer på røstjern på sida, forstaget til et øye på takets front, bommen i svanehals på masta over taket, toppløft, blokk og krok, vinsj |
| A14 | Bakken: rekkverket uten foter, ingen trinn opp fra aktre dekk | `forecastle` | M | Stolper på foter på ripa, topp- og knerekke rundt baugen, tre trinn på braketter på bakkens skott på begge sider av huset, håndtak |
| A15 | Ankerspillet en kasse, ingen kjettingrør | `windlass` | L | Spill med motorhus, gypsy og varpkopp, kjettingrør, baugrulle (`F.bow_roller`) |
| A16 | Ingen `doors`, `work`, `hatch`, `bunk`, `exhaust` i ankrene | ankrene | M | Lagt inn |
| A17 | Navnefeltene over fenderlista på bakken (x 7,7–8,9) der merket også vil stå | `names` | M | Under fenderlista, x 6,20–7,45, akter for merket; speilet over den røde stripa |
| A18 | `lodm` fins ikke (26 466 nær, lod1 2 663) | eksport | L | Nær ~300 000 tillatt; `lodm` lages når lod0 > 40 000 minus seilets trekanter |
| A19 | **Ekte merkenavn i spillet**: `VESSELS.sjark.desc` «(Viksund 35)» på norsk og engelsk, GLB-navnet «Viksund Havsjark 35 (10.57 m)» | data, eksport | H | Fjernet (CLAUDE.md: forbildet bare i kommentarer og doku) |
| A20 | **Styrhustaket er dekk i spillet** (høyeste dekkcelle 3,35 m) | `vessel3d.js deckMap` | H | B8: spillets regel `roofOver`. Prøvd på alle 15 typer: endrer bare breisjark (taket 3,72 var dekk, 546 celler) og **ringnot38** (sløyebordet og isen sto på et tak 6,25 m oppe; nå på dekket 3,0) |
| A21 | Vannlinja og dypgangen: tegningens kjøl 1,78 m under tegningens vannlinje mot 1,60 i dataene | data | L | Dataene står (annonsene); avviket står i `check()` |

**Det som var bra og beholdes:** målene fra tegningene, ripa med den lave midja, bakken, fenderlista og stripa, styrhusets form med de buede
sidevinduene, mastene, bommen og seilets mål, fargene.

**Pynt (gjøres uten å vente):** spring og hekk beholdes som tegnet; fenderlista som en ekte list (rundet, mørkerød) som går rundt speilet; ripa
med mørkerød kapp; takkanten i samme farge; rød stripe; gulnet gelcoat i flekker, rustvann under lensportene, sotstriper ved utløpene.

## 5. Lanternene

| Lys | Plass | Regel |
|---|---|---|
| Hvit rundtlysende (under 12 m: i stedet for topplys og hekklys) | Formastas topp, 8,54 m | Minst 1 m over sidelanternene (vedlegg I 2(d)) |
| Side, rød/grønn med skjerm | Husets sider ved frontene, 2,90 m | Høyst tre firedeler av den hvites høyde over skroget (2(g)) |
| Hekklys | Aktermasta, 4,16 m | (båten fører det i tillegg) |
| Fiske: rødt over hvitt rundtlysende | Armer forut for formasta, 8,23 og 6,82 m | Minst 1 m imellom under 20 m (2(i)); det nedre minst to ganger avstanden over sidelanternene (2(j)) |

## 6. Arbeidsflyten og plassene

Fiskeren står ved haleren på styrbord midje (x 4,40), blødekaret er rett akter for ham (3,80), den som sløyer står innenfor sløyebordet på
babord ripe tvers av luka (3,30), den fjerde akter ved redskapsrommets dør. Skipperen går inn styrhusdøra til styrbord og står bak rattet.

## 7. Kritikksløyfen

(fylles inn runde for runde)
