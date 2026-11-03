# Kystbåten (Kystbåt 14,99 m med lugarer): byggegrunnlaget for revisjonen (F5)

Revisjonen av `kyst15` (`tools/boats/kyst15.py`) etter pilotbåtens arbeidsmåte (`sulebas-bygging.md`), 02.11.2026. Bestillingen står i
`prompt-blender-revisjon.md`. Malene for koden er `malo36.py` (bakk og ly, ripa, mykt hjørne i baugen, åpen arbeidsside), `havsjark35.py`
(kjølen i snittet, seilet satt og beslått) og `hs11.py` (tung arbeidsbåt, kran, overlegg), ikke for formen. Kystbåten er den første
shelterdekkeren etter piloten: arbeidsdekket under shelterdekket, styrhuset forut, en åpen halestasjon om styrbord, kranen akter og en
mesanmast med støttesegl. Kildekoder som i pilot-grunnlaget: **S** sett i bilde, **T** tolket, **A** antatt, **R** fra en skriftlig kilde.

## 1. Fakta om båten

| | |
|---|---|
| Type i spillet | `kyst15`, «Kystbåt 14,99 m med lugarer», lukket gruppe (h14, hjemmel 14–14,9 m), 18 mill. kr, `cls: 'kyst'` |
| `VESSELS` | `len` 14,99, `beam` 6,6, `draft` 3,0, `disp` 75, `year` 2012, glassfiber, 750 hk, `crewMax` 5, `berths` 6, `crane` 1, `std` plotter, VHF, AIS, `jukseMax` 8, `stations` bord 3, haler 2 (R: dataene) |
| Forbildet | Tre bilder Jonas viste 06.10.2026 av en rød og hvit 15-meter, forfra, fra siden og skrått bakfra. **De ligger ikke i repoet**, og ingen tegning er kjent. Bildet som ble lagt ved økta (02.11.2026), er båthandelens sidebilde av den gamle modellen i spillet, ikke et foto av forbildet: det gir den gamle profilen, ikke mål |
| Kildene i repoet | Det gamle skriptets tabeller (høydene over vannet, fargene, plasseringen av styrhus, halestasjon, kran og mesan), kommentarene i det, `3d-baater-og-animasjon.md` og kartleggingen (M3, M4, M5, M6, M14, M15, M20, D8) |
| Vekta (D8) | Det gamle snittet veier **120,9 t** under vannlinja 2,75 (`qa/lines.py`, `section`; den løse kjølen ikke medregnet), mot `disp` 75. Vannlinjebredden 6,50 m, 98 % av største bredde: snittet var en superellipse nesten som en kasse |
| Hva `disp` er | I spillets kode er `disp` den tomme båten: `boatTons`, `boatTons0` og `stabOf` (`core/03-simulation.js`, `03c-stability.js`) legger fangst, is, diesel, last og redskap oppå. **Jonas 02.11.2026: vannlinja er den tomme båtens (75 t)** |
| Rammen | x forover fra speilets akterflate, y til babord, z opp fra kjølens underkant; vannlinja z = WL = 3,0 (dataenes dypgang er det dypeste punktet) |

## 2. Reglene som gjelder modellen

- Bare utsiden; ingen kjøpbart redskap modellert inn (haleren, karene, flåtene, radaren, livbøyene og kranen er spillets, på plassene i
  `kit` og ankrene). Skipets egne systemer (mesanen med bommen, ankerspillet, haleruller, styrhusets konsoll med plotter, VHF og AIS, som er
  standard på båten) er skrog og står. Eget sløyebord i halestasjonen (`work.own`).
- Ingen ekte navn (B20): GLB-ens `name` er «Coastal vessel 14.99 m».
- Lanternene etter sjøveisreglene (FOR-1975-12-01-5, vedlegg I; lest på Lovdata 30.10.2026 for piloten og 17.10.2026 for batplan del 11),
  regnet i `check()`.
- Spillets krav (`sulebas-bygging.md` kap. 15) regnet i `check()` før overbygget ble formet: dekkskartet (1,85 m over dekk, den indre
  takhøyden, ikke ytterkanten; lenkene, trappene, tak over rom), broa (1,8 m, synsfeltet), navnet mot merket, juksaripa (`jigRail`), bredden
  og lengden i `vessel3d`.

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Vekta | **Jonas 02.11.2026: 75 t, den tomme båten.** Kroppen er tegnet ny: én kubisk kurve fra kjølrota til ripa med fyldighet per stasjon (malo36), 73,4 t ved WL 3,0 (75 t gir vannlinja 2 cm høyere), vannlinjebredden 5,95 m (90 %) |
| B2 | Akterskipet | **Jonas: shelterdekket til hekken** (som før og som butikkteksten): alt arbeid under shelterdekket, kranen og mesanen oppå |
| B3 | Styrhuset | **Jonas: full bredde.** Veggene står på shelterdekkets ripe; døra akter om styrbord ut på shelterdekket (hektet åpen), en dør i babord frontskjørt ut på fordekket. Skiller seg fra 21-meteren (styrhus akter, åpent dekk, rundgatt) i silhuetten |
| B4 | Høydene over vannet | Det gamle skriptets: arbeidsdekket 0,90 m over vannet, shelterdekket 3,05 midtskips, ripa 3,90 ved stevnen. Ripa på shelterdekket 0,26 m med rekke til 1,0 m; rundt fordekket stiger skansen til 0,6 m |
| B5 | Fargene | Det gamle skriptets (bildene 06.10.2026): signalrødt skrog, hvit skvettlist og hvit vannlinje, svart bunn, hvitt over det røde, grått dekk; rødt støttesegl |
| B6 | Kjølen | Dødved fra akterstevnen (x 1,75) til forfoten (x 11,4) i skrogets snitt, ikke en egen kropp; skoen under propellen bærer rorets hæl (M20) |

## 4. Gjennomgang før endring: avvikslista (02.11.2026)

Spillet viser Blender-modellen (`glbHas` sann, `buildVesselModel(..).glb`, 15 770 trekanter, delene lod0, glass og lod1, alle ankrene;
lysene `masthead`, `port`, `stbd`, `stern`). Før-bildene er tatt i spillet i begge formater (`tests/ky15shot.py`, `TAG=for`).

| # | Funn | Kravet | Tiltak |
|---|---|---|---|
| A1 | **Vekta:** 120,9 t i snittet mot 75 t; vannlinjebredden 98 % av største bredde (superellipse med eksponent 2,8) | D8, kap. 13 | Kroppen som kubisk kurve med fyldighet og bunnreisning: 73,4 t, 90 % |
| A2 | **Kjølen er en egen kropp** (`keel`, `forefootkeel`, `shoe`, `sole` løftet under skroget) | kap. 7, 13 | Kjølen i snittet |
| A3 | **Skroget er løse flater:** to sidegrid, et speilgrid, dekkene og innsida av ripa egne `Acc`-flater; baugen en egen lapp av rader fra x 8,5 | kap. 4.1 | Én flate (`Mesh`) |
| A4 | Tabellene lest med rette stykker (`interp`), baugen fra en annen formel enn snittet akter | kap. 17 | `pchip`, ett snitt hele veien |
| A5 | **Halestasjonen er hoppede celler** i skrogets rutenett (ingen lysning, ingen kant), og innsida en løs kasse | kap. 4.2 | Ekte hull med lysning og hjørneradius, innside med dekk, tak, vegger, dør |
| A6 | **Vinduene, lufteåpningene og «klyssene» er flate hvite plater** på skrogsida (K2-før-bildet) | kap. 7, 16 | Koøyer, lameller og hawse-rør som ekte hull |
| A7 | **Hekken (M4):** flatt speil med knivskarpe hjørner, ingen avrunding i plan | M4, SKR-05 | Avrundede hjørner i plan, fender i lista, panamaklyss, leider, navn |
| A8 | **Støtteseglet (M5)** står oppe i havn | M5, SJK-11 | To deler, `sail` og `sailf` (`drawSail`) |
| A9 | **Fiskelysene 0,5 m fra hverandre** (11,25 og 10,75), ikke typet: spillet tente sine egne ved mastetoppen | vedlegg I 2(i)(ii): minst 1 m | 1,06 m, typet `fishR`/`fishW`, det hvite 2,31 m over sidelanternene (2(j)) |
| A10 | Sidelanternene er fargede klosser i en mørk boks uten skjerm innenfor | LYS-02 | `F.side_lantern` med skjerm på brett |
| A11 | **Styrhuset:** tak og vegger som skall uten dørk, konsollen en kasse, rattet en ring, stolen to klosser, skjermene tre plater | B5, kap. 15.6 | Konsoll med skrått dashbord og fire skjermer mot skipperen, felles ratt, enspak, sete, VHF, benk og karttavle |
| A12 | Fargegrensene vannrette (bunnstoffet, vannlinja); det røde stiger forut i tabellen, men baugens lapp hadde egne rader | planliste kap. 29 | Rader i snittet; bunnstoff og vannlinje stiger 12 mm per meter |
| A13 | **Ankerets rør i baugen** står der merket skal stå (merket flyttet seg rundt dem, `markStrips`) | M6 | Hawse-rørene helt forut (x 14,1), merket på jevn rød sone |
| A14 | M3: store glatte sider, ingen lensporter, ingen utløp, ingen ventiler med dybde | M3 | Lensespalter i ripa, utløp med krage, lameller, koøyer |
| A15 | M14: shelterdekket tomt ovenfra (bare pullerter og rekka) | M14, OVB-13 | Luftrør, sopp-ventiler, tauknippe, klamper, pullerter på kvarterene, takets rekke, arbeidslys |
| A16 | M15: propellen fra fittings, men anodene få, ingen slingrekjøl, ingen ekkoloddgiver | M15 | Slingrekjøler, anoder, giver, sjøkiste, thrustertunnel på begge sider |
| A17 | **Juksaplassene:** spillets `jigRail` fant en «ripe» langs hele sida (skrogets egne punkter under 1,3 m over arbeidsdekket), så maskinene kunne havne på den lukkede sida | kap. 19 | `JIG_Z` for typen: tre plasser på halestasjonens ripe akter for haleren |
| A18 | Bare 15 770 trekanter nær | F1 | Mer detalj innenfor budsjettet |

## 5. Lanternene

12–20 m (sjøveisreglene regel 23 og 26, vedlegg I), regnet i `check()`, typet i `anchors.lights`:

| Lys | Plass | Kontroll |
|---|---|---|
| Topplanterne (`masthead`, 225° forover) | toppen av masta på styrhustaket | 5,9 m over ripa (2(b): minst 2,5 m) |
| Rød og grønn (`port`, `stbd`) | på brett på styrhustakets forre hjørner, skjerm innenfor (`F.side_lantern`) | 2,0 m over skroget, høyst tre firedeler av topplanterna (2(g)) |
| Akterlanterne (`stern`) | på mesanens akterkant over speilet (`F.stern_lantern`) | |
| Fiskelys rødt over hvitt (`fishR`, `fishW`) | på armer forut for masta | 1,06 m fra hverandre (2(i)(ii)), det nederste 4,4 m over ripa (minst 2 m), det hvite 2,31 m over sidelanternene (2(j): minst 2,12) |
| Arbeidslys (`work`) | under styrhustakets akterkant og under taket i halestasjonen | ingen lanterne |

## 6. Arbeidsflyten og plassene (kap. 19: lagt inn før veggene)

Halestasjonen er åpen om styrbord fra x 4,60 til 7,80, ripa 0,95 m over arbeidsdekket, 2,04 m fri høyde under shelterdekket.

| Plass | Hvor (x, y) | Hvorfor |
|---|---|---|
| Haleren (`hauler`) | 7,30, på ripa med halerulla | forut i åpningen, under arbeidslyset |
| Fiskeren ved haleren (`spot0`) | 7,05, −2,55 | |
| Blødekaret (`work.tub`, spillets) | 6,55, −2,35 | rett akter for haleren |
| Den som bløgger (`spot1`) | 6,55, −1,70 | innenfor karet |
| Lasteromsluka (`hatch`) | 5,30–6,10, −2,30…−1,70 | mellom karet og bordet: fisken ned på is |
| Sløyebordet (`work.table`, eget) | 4,78–5,78 langs innerveggen | over luka fra karet |
| Den som sløyer (`spot2`) | 5,25, −1,95 | utenfor bordet, vendt inn |
| Juksamaskinene (`JIG_Z`) | x 4,95, 5,65, 6,35 på ripa | akter for haleren, ikke ved bordet |
| Leideren opp til shelterdekket (`stairs`) | 7,02–7,72 ved innerveggen forut | brønn i shelterdekket med karm og rekke |
| Døra inn til det lukkede arbeidsdekket | innerveggen, 6,10–6,80 | |
| Kranen (`kit.crane`) | shelterdekket akter babord, x 3,2, foldet akterover på hvilen | når lasteplassene, sida og kaia |
| Flåtene, bøyene | styrhustakets akterkant; rekkas stolper akter | |
| Skipperen (`skipperAt`) | 11,38, −1,05 på styrhusdørken | midt bak styrbord frontrute, rattet 0,40 m forut |

## 7. Kritikksløyfen

| Runde | Hva ble sett på | Funn | Retting |
|---|---|---|---|
| 0 | `stubcheck` og `lines.py` på det gamle snittet; før-bildene i spillet | 120,9 t; avvikslista kap. 4 | |
| 1 | `check()` på første utkast | 51 t (vannlinjebredden 78 %), bredden i `vessel3d`-båndet −7 %, det hvite fiskelyset 2,04 m over sidelanternene (krav 2,20), en knekk ved stevnen | fyldighet 0,95 og lavere bunnreisning midtskips, forfoten fyldigere: 73,4 t, 90 %; fiskelysene løftet |
| 2 | spantriss og profil (`qa/lines.py`) | knekk i profilen der kjølen møter forfoten (x 11,4) | kjølen blandet glatt inn i forfoten; 21 av 21 kontroller grønne |
| 3 | K1–K7 av den gamle (fra git) og den nye i Blender | kroppen grunn og kjølen 1,4 m dyp under den (en finnekjøl i K3s); hekkens bunn over vannet, en hule over roret; K6 svart: sidelanternene sto inne i styrhustakets bue (8,30 mot 8,44 m) | kroppen 0,4 m dypere, fyldigheten 0,72 og bunnreisningen 12° midtskips: 75,1 t; hekken ved vannlinja; lanternene på brett over taket; lista 0,2 m høyere (bredden i `vessel3d`-båndet 6,30 m) |
| 4 | klasjsjekken (`qa/clip_kyst15.py`, ny) | 104: 80 var en feil i sjekken (halestasjonens område), 24 ekte (dekket i halestasjonen ut i skrogsida: innsida målt der skroget er bredere) | innsida målt ved dekket. **0** |
| 5 | **Jonas: «Styrhuset og vinduene ser også ganske fucked ut»** | ujevne ruter med tykke hvite stolper; sideglasset i ett plan mens veggen følger ripa og smalner 0,35 m; hjørnedøra som en hvit plate | sammenhengende svart vindusbånd, tre like frontruter, én rute i hvert frontskjørt, hver siderute i veggens eget plan, roret lavere |
| 6 | nærbildene (halestasjonen, broa, baugen, hekken, åpningen, leideren) | ingenting nytt | |
| 7 | eksport, Node (420 OK), `qa/deckpoints.py` | shelterdekket, styrhuset og fordekket ikke i dekkskartet (ingen rorplass): leiderens fot lå i en sperret celle mot endeveggen; den som sløyer havnet på shelterdekket (spillet setter ham mot senterlinja) | leideren snudd, foten på fritt dekk; `work.stand` i `deckPoints`; alle plassene på riktig dekk |
| 8 | overlegget av den nye profilen (K3s) over den gamle | shelterdekket, rekka, åpningen, styrhusets plass og stevnen ligger oppå hverandre; kroppen dypere og kjølen grunnere (vekta), lista 0,2 m høyere, styrhustaket noe lavere | |
| 9 | testene etter hverandre (`runtests.sh`) og etter-bildene i begge formater | `vessel3d`, `brotest`, `lanterntest`, `regmarktest`, `maletest`, `walktest`, `vesseltest`, `jigshot` grønne; `penshot` rød på GL-feil 1282 (kjent fra før havsjarken, BACKLOG); `anchor3d`: kyst15s anker ble ikke ferdig hevet innen testens tid; nattbildene fra spillet for nær til å vise lanternene | se kap. 8 |

| 10 | `anchor3d` mot bygget fra før (`dist-for`) | hivingen rød også der (kjent, BACKLOG); sprutet manglet bare på mitt bygg, to ganger: klysset sto 2,82 m over vannet, og SwiftShader hoppet over bildene mens ankeret passerte vannflaten | klysset 2,45 m over vannet (som det gamle): sprutet sett; `regmarktest` grønn igjen |
| 11 | nattbilde i spillet på 32 m fra begge sider og akterfra (`NIGHT=1 tests/ky15shot.py`) | fra babord rød og hvit, fra styrbord grønn og hvit, akterfra akterlanterna; ingen lanterne synes fra feil side | |
| 12 | broa i spillet og i nærbildet | skjermene leste som svarte plater (som på havsjarken og breisjarken) | skjermene lyser svakt: plotteren som kart med land, ekkoloddet med bunnen, AIS, motorpanelet; `brotest` grønn |

## 8. Selvvurdering

**Karakter: 76/100: godkjent** (grensen er 75).

Det som holder:
- Skroget er én flate med dødveden i snittet, 75,1 t mot 75 (før 121), jevne vannlinjer (0,003), avrundet hekk med fender, leider og navn.
- Alle 21 kontrollene i `check()` er grønne, klasjsjekken står på 0, og dekkskartet har alle plassene på riktig dekk (halestasjonen, shelterdekket,
  rorplassen på styrhusdørken, fordekket).
- Arbeidsflyten går an og ble lagt før veggene: haleren, karet, luka og bordet i rekkefølge, juksaplassene på ripa, leideren opp, døra inn.
- Lanternene er lovlige og vist i spillet fra hver side om natta; fiskelysene typet, 1,06 m fra hverandre.
- Broa viser utsynet, konsollen og skjermene som lyser.
- Testene som dekker båten er grønne: Node (420), `vessel3d`, `brotest`, `lanterntest`, `regmarktest`, `maletest`, `walktest`, `vesseltest`,
  `jigshot`; `penshot` (GL-feil 1282) og hivingen i `anchor3d` er røde også før endringen (BACKLOG).

Trekk:
1. **Jonas måtte påpeke styrhuset og vinduene** (sideglasset i ett plan på en buet vegg, ujevne ruter). Jeg hadde sett K1 uten å se det.
2. **Fotoene og tegningen mangler**: overlegget er mot den gamle profilen, og alt på tvers er antatt.
3. **Jeg skrev over det gamle skriptet** før K1–K7 av det var tatt (hentet fra git).
4. Bare tre av åtte juksamaskiner får plass (bare halestasjonens ripe er en ripe ved arbeidsdekket).
5. GLB-en er 3,9 MB mot 0,9 MB før.
6. `deckshot` er ikke kjørt helt (Jonas: ingen unødvendige tester; kranprøven er kjent rød for alle kranbåtene, plass-kontrollene var OK).

## 9. Spørsmål og bilder som ville gjort resultatet bedre

1. **Bildene fra 06.10.2026** (forfra, fra siden og skrått bakfra) og helst **generalarrangementet**: de ligger ikke i repoet. Med et bilde rett
   fra siden legges modellen over det hver runde (`qa/overlay_hs11.py`); til da er overlegget mot den gamle profilen.
2. Et bilde ovenfra eller av shelterdekket akter (kranens plass, luker, rekka) og av halestasjonen innenfra.
