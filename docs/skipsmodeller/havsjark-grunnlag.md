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

| Runde | Hva ble sett | Hva ble gjort |
|---|---|---|
| 0 (før) | Før-bilder, dekkpunkter (høyeste dekkcelle 3,35: taket), K1–K7 (K5 sto inne i redskapsrommet) | Avvikslista (kap. 4) |
| 1 | Nytt skript eksportert på første forsøk (lod0 58 406, `lodm` 39 036, lod1 4 283). K1–K7 og nærbildene: ren profil, ekte hull, dør og lameller på redskapsrommet; styreplassen svart i rendringen (glasset er ugjennomsiktig i Cycles); natta riktig fra begge sider. Klipp-kontrollen (`qa/clip_havsjark35.py`, ny): 14 punkter (fenderne og ankerspillets fot i dekket) | Rettet; `shots.py` tar nå styreplassens bilder uten glasset og en egen `K5` når standardkameraet står i noe |
| 2 | **Jonas: «Baugen ser veldig bulkete ut».** Vannlinjene målt: knekk på 50–60 mm i andrederiverte ved x 8,9–9,3, der kimmingsbuen i `vline` hoppet når bunnreisningen steg fort mot stevnen. Fenderlista en spiss sagtann i snittet | Buen byttet med en kubisk kurve fra kjølrota til ripa med fyldighet `FULL` per stasjon: knekken under 20 mm. Fenderlista avrundet (sju punkter). Deplasementet 11,31 t (6 % under 12 t) |
| 3 | Dekkpunktene: bakken ble ikke dekk. Feilsøkt i dekkskartet celle for celle: vanten til styrbord (masta står til babord) krysset gangen ved huset i hodehøyde, trinnene dekket hele gangen, og avstanden fra bakken til dekket ble nøyaktig tre celler (0,2 × 3 > 0,6 i flyttall). Det fremre visiret ble dekk (1,2 m over bakken). Takregelen tok bakken for et tak over et rom (skrogbunnen inni er en «dørk») | Vanten til styrbord til et øye på takkanten, trinnene smale inntil huset, `stairs`-ankeret (spillet leser det nå), takregelen avgrenset (rommets dørk ikke under dekket, inntil to celler unna for visiret, ikke dekket selv) |
| 4 | **Jonas: «Hvorfor er ikke spygattene åpne?»** Gummiklaffene utenpå hullene leste som svarte klosser | Klaffene og hengselstengene fjernet; hullene står åpne (nærbildet `c_free`) |

| 5 | Testene: `vessel3d sjark`, `brotest sjark`, `lanterntest`, `vesseltest`, `maletest`, `walktest` grønne; **`regmarktest` rød for havsjarken** (merket fant ikke plass: bare 0,35 m mellom fenderlista og ripa på baugen) og for ringnotbåten (rød også før); `penshot` rød på GL-feil 1282, den samme på bygget før endringene. Den nye Node-testen (`tests/unit/vessel3d.test.mjs`) fant at fjernmodellen hadde 12 849 punkter mot 12 000 (`vessel3d.py sjark` hopper over lokalflåten) | `markStrips` prøver to lavere høyder under ripa (bare båter der alle høyere plasser feilet): `regmarktest` grønn, også ringnotbåten. Fjernmodellen uten aksel og propell og med enkle vinduer: 3 799 trekanter, 11 397 punkter |
| 6 | **Jonas: «Er det bare meg eller virker baugen ganske bulkete fortsatt?»** Kantene i skroget målt (vinkelen mellom flatene): en knekk på 10–14° langs stasjonen x 9,34 fra kjølen til lista, og en bule ved x 9,87. Årsak: der bunnreisningen blir bratt, klatrer kimmingens hjørne over ripa (9,34), og så blir bunnlinja og utfallet parallelle (9,87); begge gangene falt snittet tilbake til en rett linje. Overgangen fra kjølen til stevnen ved 9,5 hoppet også 6–10 cm | Hjørnet holdes under ripa med et mykt minimum, ingen rett reserve; kjølen glir over i stevnen den siste 0,8 m. `check()` måler nå vannlinjenes jevnhet (største endring i stigningen 0,012 m per 6 cm-steg, grense 0,02). Målingene ble verktøyene `qa/fair.py` og `qa/deckgrid.py` |

Eksporten: lod0 60 590 trekanter (taket 300 000), `lodm` 39 036 (taket 40 000 minus seilets), lod1 3 799 / 5 156 punkter (taket 12 000),
glass 260; GLB 3,77 MB mot 0,90 MB før. Seilet er to egne deler (`sail`, `sailf`).

## 8. Selvvurdering

**Karakter: 64/100.** Skroget er én flate med kjølen, hullene er ekte, broa er tegnet fra skipperens øye, lanternene er lovlige, og tre feil i
spillet som rammet andre båter er rettet (ringnotbåtens sløyebord og is sto på et tak 6,25 m oppe; breisjarkens styrhustak var dekk;
fiskelysene ble tent over mastetoppen). Trekk: (1) Jonas så bulene i baugen og klaffene foran spygattene før jeg meldte dem; begge burde vært
fanget i nærbildene av runde 1, der baugen allerede så krøllete ut, og baugen måtte rettes to ganger fordi jeg første gang rettet bare det første
hoppet jeg fant i stedet for å måle hele flaten; (2) jeg ødela skriptet med en `sed` som byttet `X0` i alle navn og måtte
gjenopprette det fra mitt eget skriv; (3) ingen overlegg mot tegningene (de ligger ikke i repoet), bare mot tabellene; (4) deplasementet ble
11,3 t mot 12 t etter at buen ble byttet; (5) stripene knekker fortsatt synlig der de går rundt stevnen.

## 9. OB8: arbeidet om bord, setteporten, bremmen og karakteren etter Jonas' skala (10.11.2026)

Steg 86 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-869710d8-bo5iwu`. Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting». Før- og etter-bildene er tatt med `tests/ombord.py sjark`, bare bilder, begge formater; arkene ligger i `docs/okter/2026-11-10-ob8/`.

### 9.1 Bildene av typen (valg 22 B) og Jonas' valg

Commons-API-et (`api.php`) svarte 429 på hver forespørsel i hele økta; den vanlige søkesiden svarte, og miniatyrene ble hentet direkte fra `upload.wikimedia.org` (noen ga 429 og ble hentet på nytt etter en pause). Lisensene er ikke lest; bildene er brukt som referanse for planen, ikke lagt inn i spillet. Bildene ligger ikke i repoet, bare lenkene.

| # | Bilde (Wikimedia Commons) | Hva det viser |
|---|---|---|
| 1 | [Fishing boat Henningsvær DSC03772.jpg](https://commons.wikimedia.org/wiki/File:Fishing_boat_Henningsv%C3%A6r_DSC03772.jpg) | En sjark i Henningsvær fra siden: høy baug med bakk og styrhus forut, den lave midja med kar og kasser, et hvitt redskapsrom akter med masta. Nærmest havsjarkens plan |
| 2 | [SJARK fiskebåt fiskegarn … (SANGIS R-5-S 10,5x4,6m 2000) … Foto fra Jorenholmen P-hus A.jpg](https://commons.wikimedia.org/wiki/File:SJARK_fiskeb%C3%A5t_fiskegarn_Salg_av_fisk_fra_b%C3%A5t_ved_kai_(SANGIS_R-5-S_10,5x4,6m_2000)_%C3%98STERV%C3%85GKAIEN_Stavanger_havn_harbour_NORWAY_2022-03-29_Sale_from_fishing_boat_Garnrulle_Net_drum_winch_Foto_fra_Jorenholmen_P-hus_A.jpg) | En garnsjark på 10,5 × 4,6 m ovenfra: styrhuset forut, garnhaleren på styrbord, sorteringen midt, garnrulla akter og garnet ut over hekken |
| 3 | [Fishing boats Henningsvær.jpg](https://commons.wikimedia.org/wiki/File:Fishing_boats_Henningsv%C3%A6r.jpg) | To sjarker baug mot kaia: høy baug, styrhuset forut, mast og bom |

Jonas fikk arket med de tre og tre før-bilder fra spillet (settingen akter, juksa i klump, de to ved bordet) og to spørsmål. **Bildene: «Ja, bruk dem».** **Settingen** (garnet og lina gikk gjennom redskapsrommet og ut over hekken 10 cm under toppen av skansen, fordi spillet setter over hekken 0,45 m til styrbord for midten i midjehøyden + 0,10, `view3d/10-gear.js` `drawSetting`): A en åpning med rull i hekken og binga og stampene i styrbord gang akter, B binga og stampene flyttet uten åpning, C redskapsrommet bort og åpen hekk som bilde 2. **Jonas 10.11.2026: «A Åpning i hekken».**

### 9.2 Dekket målt og plassene

Målt i spillet før endringen (`qa/deckpoints.py sjark`, `qa/deckgrid.py sjark`, og en liten probe som lar kjernen fylle karet og skriver ut hvor de fire står etter 20 s): den som iser, sto på lukekanten (0,89 m, lukelemmene), og nummer to ved sløyebordet ble trukket 0,45 m inntil den første, fordi plassen 0,7 m akter for ham (`deckcrew.js` `deckAt`) lå inntil redskapsrommets hjørne og falt tilbake mot ham. Garnbinga og stampene sto forut for luka på babord, så settingen gikk på skrå gjennom redskapsrommet.

| Plass | Modellens x (fra hekken), y (babord +) | Hvorfor |
|---|---|---|
| Setteporten | i skansen over speilet, y −0,72 til −0,20, terskelen 1,24 m, rull (Ø 6 cm) med topp 1,32 | Spillets sti går ut i y −0,45 og 1,38 m (`check()`: rullen 6 cm under, skansens topp ellers 1,48) |
| Garnbinga (`kit.garn`) | x 1,25, y −0,92 (460 l, 1,00 × 1,20 m langskips) | Styrbord gang akter ved siden av redskapsrommet; garnet rett akter til porten, 0,44 m klar av redskapsrommet (`check()`) |
| Stampene (`kit.stamps`) | to i bredden og tre forover fra x 0,75, y −1,17 (`ry` π, `n` 6; resten stables) | Samme gang; den fjerde raden ville stått på lukekarmen |
| Sløyebordet (`work.table`) | over babord ripe x 3,60 (før 3,30) | Tvers av luka som før; nummer to står nå 0,60 m fra den første, side om side (F19) |
| Isepakkeren (`work.pack`, ny) | x 3,80, y −0,90, mellom luka og blødekaret, vendt mot karet | Før på lukekanten (0,89 m) |
| Iskassa (`kit.iskasse`, ny; spillets 300 l) | x 4,35, midt forut for luka, på tvers | Spillet legger den ellers 0,62 m til siden for pakkeren; med pakkerens første plass ved skansen hang den utenfor skroget i de første etter-bildene |
| Juksaplassene (`anchors.jigZ`, ny) | styrbord x 2,95, babord 4,55, styrbord 0,85, babord 0,95, styrbord 5,05 | Fordelt på begge sider, over en meter imellom på samme side, ingen i gangen ved redskapsrommet (binga og stampene står der) eller ved haleren (F21) |
| Fenderne | begge på babord akter for redskapsrommet | Styrbord gang akter er redskapets |
| Den fjerde i mannskapet (`crewSpots[3]`) | x 0,95, midt akter | Før i styrbord gang |

### 9.3 Det som er endret

- **Setteporten i hekken** (Jonas: «A»): hullet skåret gjennom skansen over speilet med terskel og kinn i kappens mørkerøde, rulla på to braketter. `check()` har to nye linjer: rullens topp under spillets settehøyde og veien fra binga og stampene til porten klar av redskapsrommet.
- **Plassene** som i tabellen over; `STAB_AT.sjark` (`core/03c-stability.js`) lest på nytt: garnet og stampene akter på styrbord, bordet 0,3 m forut. Ny sjekk i `tests/unit/trim.test.mjs` (30 garn akter: hekken ned og slagside mot styrbord), sett rød med den gamle tabellen (−0,02° og −1,61°, altså mot babord) og grønn med den nye (0,32° og 1,56°).
- **Bremmen på styrhustaket** (valg 26): underkanten 0,12 m ut fra veggene med flatt underslag, flaten skrår innover 0,18 m opp til takkanten, kronen 5 cm, mørkerød som fenderlista og kappene (den gamle leppens farge). 0,12 og ikke plastsjarkens 0,17, så gangen på bakken ved siden av huset forblir dekk (`check()`: 0,57 m bred utenfor bremmen, underslaget 1,22 m over den). Mastestøvelen, øyet for vanten, forstagets øye, rekka, lyskasteren og flåtens plass står på taket; sidelanternene (2,82) og arbeidslysene under underslaget.
- **Styrhusveggene uten striper** (Jonas 10.11.2026, med to bilder: «Den ser liksom ut som den huler litt innover mot vinduene pga de stripene», «Synes jeg ser tendenser til det på siden av styrhuset også?»): skallet ble glattet med de skarpe kantene merket før vinduene og døra ble skåret ut, så kantene rundt hullene ble glatte, og skyggenormalene på de plane veggene sto opptil 135° (akterveggen) og 73° (sidene) skjevt. De skarpe kantene merkes nå på nytt etter kuttet (`shade(shell, 5)`): 0,2° og 0,7°. Ny sjekk `qa/flatnorm.py` for alle båtene (rød på havsjarken før, grønn etter); hva den fant på de andre, står i backloggen («Striper på plane vegger»).
- **Spygattene** var alt åpne uten klaffer (runde 4); klasjsjekkens unntak nevnte fortsatt klaffer og er rettet.
- **Vekta** (valg 18 A): skroget gir 11,30 t ved tegningens vannlinje mot 12 t (6 % under, innenfor 10 %): formen og vannlinja står.
- **Klasjsjekken** (`qa/clip_havsjark35.py`): 12 punkter, de samme 12 som før endringen (ankerspillets fot 3 mm i bakkedekket ved x 9,25), ikke nye.
- **`crewclip`**: ny sjekk for F19 (to ved samme bord eller kar minst 0,55 m imellom) for de reviderte båtene, sett rød mot bygget før (sjark 0,45) og grønn etter (0,60). Kyst15, kyst21, snøkrabbebåten og bunntråleren står 0,40–0,45 og hører til sine faser (backloggen).
- **Livbøya på styrhusets aktervegg** (Jonas 10.11.2026: «Flytt ned den redningsbøya som henger på veggen på styrhuset slik at den ikke dekker vinduet på bakveggen»): festet 0,35 m under vinduets underkant (før 2,35 m, toppen av bøya i vinduet).
- **Fenderne** (Jonas 10.11.2026: «Fjern pyntefenderne fra båt-modellen»): de to som lå løse på dørken akter, er tatt bort; fenderne som mannskapet henger ut ved kaia, er nå en felles modell for alle båtene (`tools/deck/anker.py` `fender`), og blåsa er laget for redskapet (backloggen).

### 9.4 Etter-bildene og det som står igjen

Etter-bildene (`tests/ombord.py sjark`, begge formater, alle operasjonene: plassene, iskassa, bøya og fenderne er endret, så ingen ble droppet) og arkene i `docs/okter/2026-11-10-ob8/`: garnet går fra binga i styrbord gang akter ut over hekken gjennom setteporten, med én ved binga (F20 rettet); de to som sløyer, står side om side ved bordet, pakkeren ved karet og iskassa forut for luka (F19 rettet); de som jukser, står fritt på begge sider (F21 rettet); dekket akter er uten løse fendere. To runder etter-bilder ble kastet: den første viste iskassa hengende utenfor skansen (pakkerens første plass), den andre hadde bøya over vinduet og pyntefenderne. **Står igjen:** (1) Ingen akter ved stampene når det settes (F4, OB3). (2) Med fire om bord brukes fire av de fem juksaplassene. (3) De to ved bordet står 0,60 m fra hverandre: side om side, men tett (spillets `deckAt` gir 0,7 m og runder til dekkskartets ruter). (4) Ankerspillets fot 3 mm i bakkedekket (fra før). (5) Blåsa er laget, men ikke tatt i bruk (`view3d/10-gear.js` eies av steg 21c).

### 9.5 Karakteren (forslag; Jonas setter den)

Etter Jonas' skala (valg 17, `om-bord.md` kap. 2). Forslaget i OB0 var 61 etter en annen skala, 62 etter OB2.

| Punkt | Vekt | Forslag | Begrunnelse |
|---|---|---|---|
| Skrogutforming | 20 | 14 | Skroget er én flate med kjølen etter verftets tegning, jevne vannlinjer (`check()`), vekta 11,3 t mot 12 (6 % under, innenfor 10 %). Trekk: tegningene ligger ikke i repoet, og bildene av typen viser planen, ikke linjene; stripene knekker der de går rundt stevnen |
| Detaljer | 20 | 15 | Ekte hull med lysning, setteporten med rull, bremmen, plane vegger uten striper, spygattene åpne, klasjsjekken uten nye punkter. Trekk: materialene er ikke PBR (F2); ankerspillets fot i dekket |
| Lanterner | 5 | 4 | Lovlige plasser etter `check()`, sidelanternene under bremmens underslag; ikke sett om natta i denne økta |
| Styrhus | 10 | 8 | Konsollen, rattet, stolen og utsikten fra skipperens øye som før (`check()`), taket med bremmen, bøya under vinduet |
| Arbeidsflyt | 25 | 19 | Settingen gjennom setteporten fra binga og stampene akter, to side om side ved bordet, pakkeren ved karet, juksa fordelt. Trekk: ingen akter ved stampene når det settes (F4, OB3); de to ved bordet står tett |
| Utforming av dekk | 20 | 16 | Haleren, karet, bordet og luka samlet i midja, redskapet akter der det settes fra, iskassa ved luka, juksaplassene fri av alt. Trekk: styrbord gang akter deles av redskapet og en juksaplass på hekken; gangen der pakkeren står er 1,1 m |
| **Sum** | **100** | **76** | Over grensen, uten funn med alvor A igjen som er havsjarkens egne |

Jonas setter karakteren.
