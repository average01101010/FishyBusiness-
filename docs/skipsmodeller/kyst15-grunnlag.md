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

## 10. OB12: arbeidsdekket akter, setteporten, luka og karakteren etter Jonas' skala (11.11.2026)

Steg 90 i `docs/planer/koen.md`, bygd av arbeidsrutinen (grenen `plan/2026-11-11-90`, PR #64). Jonas, valg 19 (09.11.2026): «Lag en åpning i hekken for setting av garn, liner. Lag også en garn-binge for oppbevaring av garn ombord». Funnene som skulle rettes, står i `docs/planer/om-bord.md` 4.9.

### 10.1 Bildene av typen (valg 22 B)

Ingen bilder er funnet, og ingen er sett: `docs/okter/2026-11-11-ob12/bilder-av-typen.md` sier hva som ble søkt, og hva hver del bygger på i stedet. Luka i styrbord side er øktas eget valg og er ikke sett på en ekte båt.

### 10.2 Det før-bildene viste

Tatt med `tests/ombord.py kyst15` mot arbeidsgrenen før endringen (19 operasjoner, begge formater). F24 (ingen ved haleren) var alt rettet i den felles koden av OB3: i linetrekket står én ved haleren og én ved karet, men de synes så vidt fra kameraet over shelterdekket.

- **Setting:** garnkaret og stampene sto på shelterdekket, og garnet og lina gikk ut over rekka der, tre meter over sjøen.
- **Juksa:** to sto i haleporten skulder ved skulder, og to «jukset» fra rekka på shelterdekket uten maskin.
- **Sløying og trekk:** kameraet så shelterdekket; arbeidet under det syntes ikke (F18).
- **Haleren:** stolpen sto utenpå skroget under haleporten.

### 10.3 Plassene (modellens x fra speilet, y babord +, z fra kjølens underkant)

| Plass | Hvor | Regnet mot |
|---|---|---|
| Arbeidsdekket akter | x 0,08–4,56, fra skrogets innside om styrbord til innerveggen y 1,05; dørken som i halestasjonen (z 3,90), 2,04 m under taket | – |
| Setteporten (`SPORT`) | i speilet, y −1,05 til 0,15, terskelen 0,58 m over dørken, 1,08 m høy; karm ute og rulle i terskelen | speilets bredde der (4,52 m), fenderlista under (9 cm), navnet over, redningsleideren (y −1,32), og punktet spillet setter ut i uten mannskap (y −0,45, 1,05 m over dørken) |
| `kit.setter` | terskelens ytterkant midt i porten | `deckcrew.js` `setOver`, `10-gear.js` `drawStern` (linesetteren og garnrenna står der) |
| Garnkaret (`kit.garn`) | x 2,25, y −0,45: rett forut for porten | boksen 1,0 × 1,2 m; setterens magasin (0,6 × 1,06 m) får plass mellom karet og porten; 1,57 m dørk til den som setter; gangen om styrbord 1,73 m |
| Stampene (`kit.stamps`) | x 4,06, y 0,86: blokken med åtte ligger langs innerveggen, x 2,24–4,38 | boksen 0,78 × 2,02 m, fri av garnkaret og veggen |
| Luka akter (`AH0`–`AH1`) | styrbord side x 2,00–4,20, samme terskel (0,95 m) og overkant som haleporten, 0,40 m stolpe imellom | – |
| Juksaplassene (`anchors.jigZ`) | x 5,83 og 4,86 i haleporten, 3,60 og 2,60 i luka | 0,97 m eller mer mellom to, 0,12 m akter for blødekarets boks, 1,47 m fra haleren |
| Halerens fot (`anchors.haulerFoot`) | 2,71 m fra midten, 0,20 m innenfor skrogets innside | spillet satte den ved 3,10 (0,2 m innenfor største bredde), som er utenfor skroget ved dørken |
| Rekka de ledige står ved (`anchors.leanY`) | shelterdekkets | `vessel3d.js` `deckPoints` |

`python3.11 tools/boats/kyst15.py check`: 28 sjekker, alle grønne (21 fra før, sju nye: sidene er like, setteporten, redskapet på arbeidsdekket, redskapets vei, juksaplassene, halerens fot, åpningene).

### 10.4 Det som ellers er endret

- **Bremmen på styrhustaket** (valg 26): 16 cm ut fra veggene, 3 cm underkant med dryppkant, flaten skrår 11 cm inn opp til takkanten, i skrogets røde. Taket er lukket innenfor bremmen (rutenettet over stoppet før fronten).
- **Stripene på styrhusveggene:** `qa/flatnorm.py` ga 258 plane flater med skyggenormaler over 20° skjevt før, 0 etter (`shade(shell, 5)` etter kuttet, som på de andre båtene).
- **Navnet på speilet** står over porten (z 5,70–6,12; før 5,18–5,62).
- **Ventilen om styrbord akter** er tatt bort (luka står der); maskinrommets luft er om babord.
- **Vekta:** 75,1 t ved tegningens vannlinje mot 75 t i `VESSELS`: vannlinja står, ingen `WLE`.
- **pchip:** skriptet hadde alt nøkkelen på tabellens innhold; eksporten i repoet var fra før rettingen. Sjekken «sidene er like» gir 0,0000 m.
- **Spygattene** har ingen klaffer, og ingen fendere er stuet på dekk: ingenting å ta bort.
- **Fjernmodellen** (`lod1`): rommet i få flater, 3 719 trekanter (taket er 4 000).
- **`jukseMax` 8 → 4** (valg 31 A): maskinene over går i land til full pris, og trinn på maskinene som ikke gir noe med fire, betales tilbake (`jigTierBack`).

### 10.5 Testene

- `node tests/unit/run.mjs`: 3 120 grønne. Nye sjekker for kyst15 i `trim.test.mjs` (`STAB_AT` mot ankrene, redskapet på arbeidsdekket, setteplassen i hekken) og `jig.test.mjs` (fire plasser, en armlengde imellom, hvert punkt på terskelen, `jigTierBack`), sett røde før rettingene.
- Underveis ble to enhetstester røde av endringen og rettet: `lossing` (de ledige sto mot veggen under dekk: `anchors.leanY`) og `vessel3d: lokalflåten kyst15` (fjernmodellen over taket).
- Testene i nettleseren og det som ble droppet, står i PR #64 og i commit-meldingene.

### 10.6 Karakteren: 68/100, ikke ferdig

Satt som en egen evaluering av en uavhengig underagent som bare fikk de seks før- og etter-arkene, tre felles etter-bilder, fem rendringer, `check()`-utskriften, funnene fra 4.9 og skalaen (Jonas 10.11.2026). Målet var 75. Karakteren etter OB0 var 71 på den gamle skalaen med åtte punkter; denne er den første etter Jonas' skala, så tallene kan ikke trekkes fra hverandre.

| Punkt | Vekt | Poeng | Begrunnelse (sensorens, forkortet) |
|---|---|---|---|
| Skrogutforming | 20 | 16 | Tallene er sterke (75,1 t, sidene like, jevne vannlinjer, propellklaringene). Overgangen mellom side og speil står som en hard kant med ulik rødfarge. Undervannsskroget, kjølen, roret og propellen er ikke vist i noe bilde |
| Detaljer | 20 | 12 | Flate, ensfargede flater uten slitasje. Setteporten og åpningene i sida er hull uten lem, hengsler eller skalkejern. Luka i sida er ikke kontrollert mot en ekte båt |
| Lanterner | 5 | 3 | Høydene og avstandene er målt mot vedlegg I, men ingen nattbilder og ingen kontroll av sektorene |
| Styrhus | 10 | 6 | Bremmen synes og stripene er borte. Ingen bilder fra roret; rutene er svarte i rendringene |
| Arbeidsflyt | 25 | 17 | Klart bedre: fire juksaplasser ved ripa, folk ved haleren i trekkene, setting ut gjennom porten. Trekker ned: de som sløyer, står i en klump med ryggen til; ryddingen skjer fortsatt på shelterdekket (F12); de ledige står oppe på shelterdekket; teiner, lossing og inn til kai er ikke vist |
| Utforming av dekk | 20 | 14 | Redskapet står på samme dekk som haleren, og gangbreddene er målt. Stampene står 3–4 m akter for haleren i det andre rommet; shelterdekket er en tom flate med bare kranen; ingen bilder innenfra arbeidsdekket |
| **Sum** | 100 | **68** | |

### 10.7 Det sensoren så som galt, og hva som er vårt

| Det sensoren så | Hva det er |
|---|---|
| Tre som sløyer, står i hverandre i haleporten, med ryggen til | F19, felles kode (`deckcrew.js` `deckAt`), og bordet står langs innerveggen, så de vender ryggen ut. Ikke rettet her: halestasjonen er 1,2 m bred. Står i backloggen |
| Den akterste i juksabildet har ingen maskin | Opptaket gir henne tre maskiner; den fjerde jukser for hånd på sin plass. Ikke en feil |
| Garnhalerens trommel og renne henger utenpå skroget forut for haleporten | Garnhalerens modell er lengre forover enn åpningen har plass til fra `HXX` 7,30 (åpningen slutter 7,80). Ikke rettet; backloggen |
| Garnet er en stiv stang, og karet i akterrommet «er fullt av fisk» | Felles tegning av garnet (`10-gear.js`); det i karet er garnet (`drawNetTub`), som ligner fisk på avstand |
| Mannen fyller hele setteporten | Porten er 1,08 m høy over en terskel på 0,58 m; den som setter, står rett innenfor. En høyere port ville gått opp i navnet på speilet. Backloggen |
| Rydding og spyling på shelterdekket | F12, OB14 (steg 92) |
| De ledige står på shelterdekket | Valgt: rekka er der (`anchors.leanY`); under dekk ville de stått mot en vegg |
| Sikksakkmønster på styrhusveggen i kranbildet | Skyggen fra kaias kran og rekka (ikke sjekket nærmere); backloggen |
| Den grønne lanterna «inne på taket» | Sett fra babord baug; sidelanternene står på takets forkant, 0,10 m innenfor veggen (`check()` linje 13 er grønn). Perspektiv |
| Hvite flekker i sjøen, ingen tau ved kasting | Felles (F1–F3, `24-cinema.js`) |

### 10.8 Det som står igjen

Kyst15 trenger en runde til for 75. Det sensoren mener gir mest: de som sløyer, spredt ved bordet og synlige; ryddingen ned i halestasjonen (OB14); bilder som viser det som ikke er vist (lanternene om natta, fra roret, undervannsskroget, innenfra arbeidsdekket); lemmer på porten og åpningene; slitasje. Spørsmål til Jonas: har du et bilde av en ekte 15-meter med shelterdekk sett aktenfra og fra styrbord, så luka og porten kan kontrolleres mot det?
