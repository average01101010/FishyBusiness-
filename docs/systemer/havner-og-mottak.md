# Havner, mottak, rorbuer og naust

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.18 Fiskemottakene langs hele kysten (M1, 04.10.2026)

Jonas ville ha et register over alle fiskemottak i Norge, med kaimottaket fra Blender ved hvert av dem (M2 og M3). Han ba også om at prisene ikke tas fra gamle sluttsedler: «Husk bare at prisene har utviklet seg mye med årene.»

**Kildene** (`tools/mottak/mottak.py`, til `tools/mottak/cache/`, ikke i git):
- **Fiskeridirektoratets kjøperregister** (NLOD): alle førstehåndskjøpernes anlegg, med type, kommune, adresse, koordinater og Mattilsynets godkjenningsnummer.
- **Fangstdata (seddel)** for de to siste hele årene (NLOD, rundt 1 million linjer i året).
  - Nøkkelen mellom registeret og sedlene er `Mottaksstasjon`, som er godkjenningsnummeret.
  - Bare landinger fra norske fartøy telles.
- **Norges Råfisklags mottakskart** (Nordmøre til Finnmark): type (fiskemottak, fryselager) og sone.
  - Kontaktperson, e-post og telefon tas ikke med.
- **Kartverkets adresseregister:** For anlegg uten koordinater i noen av kildene finnes punktet fra adressen.

**Ingen ekte firmanavn** (Jonas 07.10.2026: «vi må fjerne alle ekte firma-navn fra fiskemottakene rundt om i landet. Jeg orker ikke å bli saksøkt»). Registeret leser firmaets navn for å finne mottaket, men skriver det aldri ut: `mottak.json` har ingen `n`, og spillet kaller et mottak ved stedet (`v`, poststedet). Samme regel gjelder alt annet i spillet, i data, tekster, modeller og skilt: bare steder, aldri et firma som finnes. Regelen står i `CLAUDE.md`.

**Resultatet** er `src/data/mottak.json` (0,12 MB) med 310 mottak (5 ble ikke funnet på kartet). For hvert mottak:
- **Hvem og hvor:**
  - type og kommune (ingen firmanavn, se under)
  - lat/lon og punktet i spillets ramme
- **Hva det tar imot i året:**
  - kilo, antall landinger og antall båter
  - redskapsgruppene
  - andelen fra båter under 15 m
- **Per art,** for spillets arter (torsk, hyse, sei, lyr, lange, brosme, uer, kveite, taskekrabbe og kongekrabbe):
  - kilo i året
  - andelen levert levende
  - månedene det tas imot, som maske
  - prisindeksen
- **Kaia** (`q`):
  - Det er nærmeste kaifront innen 600 m fra vec-pakkene (4.15). Kai eller brygge på minst 15 m med minst 2 m vann foretrekkes framfor kystlinje.
  - Feltene er punktet, normalens vinkel, lengden, dybden, typen og avstanden fra registerets punkt.
- **Tallene:** 266 mottak har spillets arter og er et fast anlegg (ordinært anlegg eller kaiselger). 255 av dem har en kai.
- **Kongekrabbe** tas imot ved 48 mottak, nesten alle i Øst- og Vest-Finnmark, med andel levende 0,9–1,0. Nord Senja Fisk har litt.
- **Prisindeksen** er det mottaket betalte for arten, delt på det de samme kiloene ville kostet til gjennomsnittsprisen for arten samme måned samme år. 1,00 er snittet.
  - Indeksen sier hvem som betaler godt eller dårlig, ikke hva fisken koster.
  - Spillet beholder sine egne priser (`SPECIES.pm`, Råfisklagets minstepriser).

**Oppdatering:**
- `.github/workflows/mottak.yml` legger resultatet som release `mottak-N`, og den nyeste kopieres til `src/data/mottak.json`.
- Den kjører den 3. hver måned, når `mottak.py` endres, eller for hånd.
- Kaiene trenger kartpakkene fra `tools/map/game.py`.

**Svakheter:**
- **Registerets punkt** er av og til kontoret og ikke kaia. Da kan kaia innen 600 m være feil kai.
- **Typen:** 15 anlegg har typen «NOT_TRANSLATED» i registeret, mest fryselagre og terminaler.
  - De som Råfisklaget kaller fiskemottak, regnes som ordinært anlegg. Resten blir «Annet anlegg».
- **Snitt over to år:** Kilo og landinger er snittet for de to årene. Et mottak som startet eller stengte i perioden, ser derfor halvt så stort ut.

## 4.18b Mottakene som havner, og start langs hele kysten (M2, 05.10.2026)

Jonas 04.10.2026: «alle nye brukere skal få bestemme selv hvor i landet de ønsker å starte spillet ... de burde jo få en anbefaling om å starte en plass der det er torsk ... salgslaget på telefonen må vise de 8-10 nærmeste fiskemottakene». Han lot meg velge resten (05.10.2026, «Du får litt frie tøyler»): alle mottak med kai som passer en kystfisker, og spill fra før blir der de er, med én gratis flytting.

- **Navnene:** `mottak.py` slår opp poststedet rundt hvert mottak i Kartverkets adresseregister (`punktsok`, det vanligste innen 800 m, i `cache/steder.json`) og legger det i feltet `v` (Båtsfjord, Senjahopen, Mo i Rana). `python3 tools/mottak/mottak.py steder` legger bare navnene inn i `src/data/mottak.json` som finnes.
- **Havnene** (`core/06b-coastports.js`, før `07-harbours.js`): et fast anlegg (ordinært eller kaiselger) med kai, som tar imot minst 10 t i året av spillets arter, fra små båter (minst 5 %) eller med konvensjonelle redskap (minst 30 %). Det gir 202 mottak. Mottak innen 1,2 km av hverandre blir én havn (det største gir navnet), og de innen 2 km av en Senja-havn blir den havna (den beholder kaia og enheten, og får registerets prisindeks i `mk`). Resultatet er 153 nye havner (`coastal: true`, id `'m' + mottaksnummer`).
  - Kaia er registerets kaifront (`q`) som en `QUAYS`-oppføring (`COASTQ`, slått sammen etter konverteringen i `07-harbours.js`). Havnepunktet ligger 15 m ut fra midten, og strandpunktet 30 m inn.
  - **Kaimottaket fra Blender står ved hvert mottak** (Jonas 05.10.2026: «3 modeller av ulike typer fiskemottak, men som har samme funksjon ... plasseres tilfeldig på stedene der fiskemottakene er på ekte»). Hver kysthavn får en `UNITS`-oppføring med blokkens front på registerets kaifront (`o` midt på, `u` langs, `n` ut mot sjøen) og en fylling på 4 m bak blokka.
    - Utseendet (`v`) velges tilfeldig, men likt hver gang, ut fra en hash av id-en: `a` er dagens mottak, `b` det gamle fiskebruket og `c` det store anlegget. Av de 153 ble det 52 a, 45 b og 56 c.
    - Alt som gjelder enhetene, gjelder også her: liggeplassene (`quayFace` gir enhetens landings- og bunkersplass), land under blokk og fylling (`onUnitGround`), det mudrede bassenget, terrenget rundt (`unitTerr`, `unitPatch`) og kartets hus som tas bort.
    - Kranen, trucken og folkene legges ut når øyet kommer innen 1,5 km og bakken der er lastet (`plantsCoast` i `view3d.js`, kalt fra `nearestPlant`). Da arbeider de ved leveringen som på Senja.
    - Stikkprøve på hvert tiende mottak: blokka står på land, og havnepunktet og liggeplassen ligger i sjøen ved alle. Bildene er `coast_plant_a.png`, `_b` og `_c` fra `tests/coast3d.py`.
  - Prisfaktoren er mottakets prisindeks halvveis mot 1, mellom 0,94 og 1,06. Alle har drivstoff og butikk, og isrenne der mottaket tar imot 1000 t eller mer i året.
  - Like navn får siden av den første de ligger på, for eksempel «Vardø øst» (08c: i stedet for firmanavn viser startvalget antall mottak og tonn i året).
- **De nærmeste:** `plantsNear(p, n)` gir de n nærmeste mottakene (bufret per halve km). Salgslaget viser de 10 nærmeste med avstand og pris for torsk, hyse og sei (fet er beste pris av dem). Snittprisen (`avgPrice`), verdianslaget og pristabellen i havneguiden bruker de 10 nærmeste, ikke alle. Morgentipset fra mottakene («God morgen! Vi betaler …») er fjernet (13.10.2026). Kystradioen sender i stedet lokale værmeldinger på VHF kl. 09, 12, 15, 18 og 21 på spillets klokke (Jonas 13.10.2026; `radioForecast` i `core/06-services.js`): vind og retning der båten som følges er, Beaufort-navnet, bølgene ute (`fcHsOpen`), og om vinden øker (med tidspunkt), avtar eller holder seg de neste 12 timene, med «Kulingvarsel» fra 13,9 m/s. Bare med VHF om bord på en av båtene. Den vanlige kulingvarslingen hopper over disse timene, så det ikke kommer to meldinger. Meldinger på skjermen står i 10 s (`toast(msg, ms)`), og en kort beskjed oppå gir meldingen tilbake etterpå.
- **Kartdata:** `bootMap` laster bare rundt Senja-havnene, feltene, det som er lagret og den lagrede hjemhavna (`saved.home`), ikke rundt alle mottakene. 3D bygger kaidekk, kaiutstyr og bunkring bare for kysthavner innen 40 km fra båten (`portHere`), og navnelappene slår ikke opp terrenghøyden for havner mer enn 14 km unna. Kysthavnene har ikke havneenheten eller mottaksanlegget i 3D ennå (M3).
- **«Hvor står fars naust?»** (`ui/08c-start.js`, etter brevet og før båtnavnet). Uten kart (Jonas 08.10.2026). Øverst står de tolv stedene der det er mest å tjene akkurat nå, i synkende rekkefølge (`startInfo`: for hver art mottaket tar imot denne måneden, årets kilo fordelt på månedene den tas imot, ganger ukas pris, vektet opp der mye kommer fra små båter). Under står alle stedene per region (Øst-Finnmark … Rogaland og Sørlandet), og et søkefelt finner et sted på navnet, så spilleren kan starte nær der hun bor. **Vangshamn** på Senja (fars naust, `HOME0` i `01-world.js`, en havn uten handel, 5,7 km fra mottaket i Botnhamn) står i lista med Botnhamns tall. Den er det nye standardhjemmet: spill fra før med hjem i Finnsnes eller uten hjem flyttes dit ved lasting (`load` i `02-format-state.js`). Båten blir der den er.
  - «Start her» laster kartet rundt havna (`mapNeed`), flytter båten dit, setter `S.home` og sentrerer kartet. 3D venter mens valget er åpent.
  - **«Første tur»** fra et annet sted: `S.tutStart` har feltet (det beste torskefeltet 1,5–6 km fra havna, på 20–150 m vann, r 1,2 km) og leveringshavna (havna selv, eller Botnhamn fra Vangshamn, som ikke har mottak). `tutNew` tar dem med, og tipsene sier for eksempel «utenfor Kjøllefjord» i stedet for «ved Gisundet nord». Uten `S.tutStart` (bare gamle spill) er det Gisundet nord og Botnhamn som før.
  - **Spill fra før:** Innstillinger har kortet «Hjemsted», der man kan velge nytt hjemsted én gang (`S.moved`, `START_HOMEONLY` i `chooseStart`). Hjemhavna og fars naust flyttes, men båten blir der den er, og man seiler dit selv (Jonas 05.10.2026: «Fast travel er ikke mulig i spillet, punktum.»).
- `tests/starttest.py` sjekker havnene, Salgslaget, hele veien fra brevet til båtnavnet med start i nord, feltet og tipsene der, et salg ved kystmottaket og flyttingen.
- **Svakheter:** Bestillingene (`CUSTOMERS`), mannskapets hjemsteder, NPC-flåten og avisa er fortsatt Senja. Kysthavnene får ikke kaiutstyr i 3D når båten kommer dit etter at 3D er bygget, før siden lastes på nytt. Naustet er ikke plassert ennå.

## 5.25f Fars naust og butikken på kaia i 3D (05.10.2026)

- Modellene kommer fra `tools/harbour/naust.py` og `butikk.py`, og hvor de står, regner `core/07c-naust.js` ut. De ligger i siden som `glb-naust` og `glb-shop`.
- **Naustet** (`naustFind`) står ved hjemhavna (`S.home`, ellers Finnsnes), på en fjærestrekning 60–240 m til en av sidene langs mottakets kaifront. Strekningen må oppfylle disse kravene:
  - fjæra er nesten rett over 30 m (høyst 6 m bue)
  - det er åpent vann 8, 16 og 30 m ut, og land 6, 14 og 25 m inn
  - det er minst 70 m til et havnepunkt
- Pålekaiens front står 4 m ute fra fjærelinja, parallelt med den.
- Plassen regnes ut én gang per hjemsted (`S.naust`, `naustSite`), når kartet rundt havna er lastet.
- **Butikken** (`shopSite`) står bak kaifronten i Finnsnes, med x = 0 midt på fronten.
- `view3d.js` har `SITES`, som brukes slik:
  - `sitesNow` gir plassene, og modellene tegnes av `drawSites`, fullt innen 900 m og enkelt ut til 4 km.
  - Bakken (`siteTerr` i `terrRaw`) skjæres 0,4 m under naustets egen fjærebanke (`NBANK` = `BANK` i `naust.py`, fra 3 m ute til 16 m inne) og går tilbake til det den var innen 8 m.
  - Butikkens plass (fra 9,6 m til 27,5 m inn) planeres 0,1 m under kaidekket og går tilbake til det den var innen 12 m.
  - Kartets hus og trærne der modellene står, tas bort (`onSite`, med `clear`-rektanglene fra modellenes ankere).
- Kartplotteren viser naustet som et lite hus med navnet «Fars naust» (`NOTEBOOK.svg`).
- Testen er `tests/sitetest.py`, med bildene `site_naust.png` og `site_shop.png`.
- **Naustet som hjem** (Jonas' valg nr. 4, `NAUST_UP` i `07c-naust.js`): stegene kjøpes én gang i Notatbok, mens båten ligger i hjemhavna.
  - Tett taket (6 000 kr) og vedovn (9 000 kr, etter taket) gir hver 25 % raskere hvile i hjemhavna (`naustRest` i `energyMinute`).
  - Fars arbeidsbenk (7 500 kr) gir håndjuksa og kveiteutstyr en firedel billigere i hjemhavna (`shopBuy`).
  - Troféveggen (3 000 kr) er bare pynt i notatboka.
  - Regnet på taket (lyd) er ikke laget ennå.
- **Start ved naustet** (Jonas 05.10.2026, #207): et nytt spill starter med båten ved naustets pålekai (`S.boat.berth = 'naust'` i `chooseStart`, `ui/08c-start.js`, som også laster kartet 7,5 km rundt havna).
  - **Naustet** finnes nå med `shoreSpot` (ringsøk etter rett fjære: sjøretning fra 12 prøver på 12 m, fjæra langs normalen, rett over ±halve lengden, vann ut og land inn, utenfor `PIERBOX`, poeng etter `pref`). Det står 60–360 m fra mottakets kaifront. Kystundersøkelsen i `starttest.py` (hvert 8. mottak langs kysten) fant det ved 20 av 20.
  - **Liggeplassen** `quayFace(pid, 'naust')` er `naustFace`: fra naustets midtpunkt, 8,1 m halv lengde og 3,4 m dyp, med sjøen ut. `berthKind` faller tilbake til `'main'` når naustet ikke er funnet.
  - **Butikken ved naustet** (`shopNear`, `S.shopN`) står 45–130 m fra naustet (ellers opp til 160 m), på bakkens høyde (`lev`, medianen av 9 prøver). `siteTerr` planerer plassen der, og `drawSites` løfter modellen. I Finnsnes brukes butikken på kaia.
  - Naustet og butikken står minst 110 m fra midten av en havneenhet (`unitNear`). Enhetens blokk, fylling og terreng rundt rekker omtrent 100 m, og mottakene langs kysten har også enheter.
  - **Juksa og isen er gratis ved naustet**: far betalte for dem i fjor høst, og Solveig forteller det i en melding. Isen kommer i sekker.
  - **Ingen hurtigreise** (Jonas: «Fast travel er ikke mulig i spillet, punktum.»): `startShift` flytter aldri båten til eller fra naustet. Levering og diesel avvises ved naustet (`NAUST_SAIL`), og spilleren må seile til mottakskaia selv.
  - **Til naustet** går det med en rute: `naustTarget(pt, r)` gjør et trykk ved naustet i kartplotteren (`03-map.js`) eller med Autonav (`03b-route.js`) til rutas siste punkt `{port:hjem, berth:'naust'}`. `arrive` kaller `dock(pid, w.berth)`, som legger båten ved naustet. Autonav finner veien til havna og ender ved naustet. Fra havna selv går ruta rett dit.
  - Testene er `sitetest.py` (start ved naustet, Solveig, ingen flytting, ruta som ender ved naustet) og `starttest.py` (kystundersøkelsen: naustet ≤ 400 m, butikken 40–170 m, feltet ≤ 6 km og dieselen for første tur ≤ 60 % av tanken).
- **Ikke gjort ennå:** kameraet kan gå inn i husene, og lyktene i ankrene brukes ikke.


## 5.25i Rorbuer langs kysten (05.10.2026)

Jonas 05.10.2026: «Vi skal lage en blender-modell av en rorbu med kaiplass. Disse skal plasseres rundt om kring langs kysten slik at spillere kan hvile der, eller ligge til kai under uvær. De vil som regel ligge i områder som er litt beskyttet mot bølger og vær.» Og: «Rorbua må være billig. Energi skal kunne lade opp fra 0-100% på 6 timer in-game ved hvile på rorbuer», «Ved hvile forsvinner skipperen fra båten», og om antallet: «Kan sikkert halveres».

- **Modellen** er `tools/harbour/rorbu.py` (rød rorbu på påler med altan, trapp ned til en pålekai med pullerter, stige, fendere og dekk, hane på mønet), i siden som `glb-rorbu` (`src/data/harbour-rorbu.b64`). Rammen er naustets: x langs kaifronten, fronten ved y = 0, y innover. Kledningen er malingssone 1, så spillet maler den oker eller hvit (`RBCOL` og `siteModel('rorbu:o')` i `view3d.js`). Fargen velges av id-en (`R.v`: r, o, w).
- **Plassene** (`src/data/rorbuer.json`, laget av `tools/rorbu/rorbuer.py` fra `national.py` sine lag og stedsnavnene i sjøkartpakkene):
  - **Én ved hvert fiskevær** (kind 0): mottakene som `06b-coastports.js` gjør til havner (samme filter og samme grupper på 1,2 km), 161 stykker.
  - **Le-steder mellom** (kind 1): sjøceller i norsk sjøterritorium inntil land på 200 m, med åpenhet mot havet (`expo`) på høyst 0,3 og vann rundt (minst 8 av 25 celler innen 400 m), minst 14 km fra en annen rorbu, i fast stokket rekkefølge. Det gir 374 (med 10 km var det 696, og Jonas syntes de kunne halveres).
  - **Navnet** er nærmeste tettsted i sjøkartet innen 6 km, ellers øy og så farvann.
- **Fjæra** finnes første gang kartet der er lastet (`rorbuSite` i `core/07d-rorbu.js`, med `shoreSpot` som naustet): ved fiskeværet 150–700 m fra kaia, ellers så nær punktet som mulig, minst 110 m fra en havneenhet og 120 m fra naustet. Kaifronten står 4,4 m ute fra fjærelinja (der banken i `rorbu.py` krysser middelvann). Finnes ingen rett fjære, blir rorbua borte (`R.site = null`).
- **Som sted** er rorbua ikke en havn i `PORTS`. `portById` kjenner den likevel (`RBID`), med `rorbu:true` og uten mottak, diesel, is eller butikk. Båten ligger ved den med `b.status = 'port'` og `b.port = 'rbN'`. `quayFace(id, 'main')` er `rorbuFace` (14 m front), og `berthPose` legger båten der. I havn har knappene bare Hvil, Arbeid og Beholdning. `shopBuy` avviser handel.
- **Rute dit**: et trykk ved rorbua i kartplotteren eller med Autonav gjør den til rutas siste punkt (`rorbuSites` i `03-map.js` og `03b-route.js`). Kartplotteren tegner rorbuene som små røde hus fra regionnivå, og navnet nær. Kaia er en hindring for andre ruter (`11b-obstacles.js`).
- **3D**: rorbuene innen 4 km står i `SITES` (`rorbuNow`, høyst én ny fjære regnes ut per bilde med `rorbuSoon`). Bakken skjæres etter bankens profil (`RBANK`, fra modellens ankere), og kartets hus der tas bort.
- **Snø på egen bakke og tak** (Jonas 05.10.2026: «Ser jo rart ut at det er grønt gress rundt rorbua, så er det snø overalt ellers»): i Blender har gress og lyng fargesone 3, berg over flomålet og taket sone 2 (`rorbu.py`, `naust.py`, `Z`). `siteSnow` i `view3d.js` legger snø på det som vender opp, etter terrengets snøgrense (`snowNow`, samme regel som `recolor`, litt flekkete), og gresstustene blir visne. Modellen lages på nytt når snøgrensen flytter seg (20 m av gangen). Gjelder også fars naust.
- **Fortøy** (Jonas 05.10.2026: «Det må også være mulig å fortøye i kaia»): ligger båten stille innen 400 m fra en kai, en rorbu eller naustet, står «Fortøy» i skuffen (`moorNear` i `core/16-helm.js`, `moorGo` i `ui/10c-dock.js`). Den finner veien inn som Autonav og legger til. Uten blåse i nærheten tar den plassen til den grå «Ta opp». Med manuell styring heter knappen «Fortøy ved rorbua i …» eller «Fortøy i …», og den virker også ved rorbuer og naustet.
- **Hvilen** står i 5.19. Den koster 150 kr natta, betalt når du går inn og så for hvert døgn. Har du ikke råd til neste natt, går du om bord.
- **Tester**: `tests/rorbutest.py` (plassene, fjæra ved Gryllefjord og på et le-sted, Autonav dit, knappene, natt og hvile på 6 timer, neste natt, åpen båt ved mottakskai, kartplotteren, lagring) og `coast3d.py` (rorbua i 3D ved Gryllefjord, `coast_rorbu.png`).
- **Ikke gjort ennå:** kameraet kan gå inn i huset, og lykta ved døra lyser ikke.

## Havner, mottak og fortøyning (B1–B5, godkjent 29.09.2026)

**Fra 02.10.2026 står havneenheten i alle de åtte mottakshavnene** (se 5.13). Den erstatter de genererte mottakene i B3, bunkerskaiene i B5 og kaifrontene i `QUAYS` for disse havnene. Sommarøy, Brensholmen og Frovåg har nå også bunkers. Tidslinjene for landing, forhaling, bunkring og is er de samme. Finnsnes har som før sin kai i `QUAYS` og fyller der båten ligger.

Mottakene ligger der Jonas har funnet dem i Råfisklagets leveranseoversikt: Husøy, Senjahopen, Botnhamn, Gryllefjord, Sommarøy, Brensholmen, Torsken og Frovåg. Finnsnes har ikke mottak eller is i virkeligheten, bare bøteri og forhandler av fiskeutstyr og båter. Bunkerskai: Husøy, Senjahopen, Gryllefjord, Botnhamn og Torsken, fra Jonas' satellittbilder. Finnsnes beholder drivstoff inntil videre (se åpne spørsmål).

1. **B1 Havnene (ferdig):** Åtte mottak. De fire nye (Sommarøy, Brensholmen, Torsken, Frovåg) ligger ved OpenStreetMap-kaia nærmest det største industribygget. Frovåg er funnet fra sjømerket «Frovåghamn» og veien Frovågneset. Is bare på mottakene, drivstoff i Finnsnes, Husøy, Senjahopen og Gryllefjord. Driftsplanen fyller bare det havna selger, og de nye mottakene legger ut bestillinger. Prisfaktorene for de nye (0,98–1,0) er anslag.
2. **B2 Fortøyning (ferdig):**
   - **Kaiene:** `src/js/core/07-harbours.js` har kaiene som bokser (`PIERBOX`), som 3D-visningen tegner, med dekket 2,4 m over middelvann (`QTOP`).
   - **Liggeplassen:** `berthPose(havn, type)` gir liggeplassen langs nærmeste kaifront med kaia på styrbord side. Fronten må være minst 2 m lengre enn båten.
   - **Kaifronten:** Den har dekk i kjetting, fenderbjelke, gul kant og pullerter.
   - **Å legge til:** Båten kommer inn i en bue og legger seg parallelt med kaia, og fenderne henges ut. Tauene settes i rekkefølgen akterspring, baugtamp, hekktamp og forspring.
   - **Tidevannet:** Tauene får lengden de hadde da de ble satt, så de slakkes og strammes med tidevannet.
   - **Å kaste loss:** Dette er tilstanden `unmooring` i simuleringen og tar `CAST_MIN` (2) spillminutter, mens tauene tas inn i omvendt rekkefølge.
   - **De ekte kaiene (29.09.2026):** Jonas merket mottakskai og bunkerskai på satellittbilder av Husøy, Senjahopen, Gryllefjord, Botnhamn, Torsken, Frovåg og Finnsnes. Bildene ble lagt over spillets kartdata (veier, kystlinje og bygg fra OpenStreetMap), og kaifrontene ble lagt på spillets kystlinje og flyttet ut forbi der den buler. De ligger i `QUAYS` i `07-harbours.js`, med `main` (der du lander) og `bunker`. Kaidekket bak fronten er 10 m (`QUAY_DEPTH`).
     - **Havnepunktene** ligger nå 6–18 m ut fra mottakskaia. Flyttet: Husøy (inn i indre havn, langs det lange mottaket på vestsida), Gryllefjord (til mottaket i øst, 430 m), Frovåg (til mottaket i sør, 250 m), Senjahopen, Botnhamn (nordveggen til Nord Senja Fisk), Torsken og Finnsnes (til kaia ved bøteriet sør for brua, 700 m nord for sentrum). Sommarøy og Brensholmen er ikke sjekket mot bilder.
     - **Innseiling:** `approachPath(havn)` finner veien fra åpent farvann inn til kaia gjennom sjøcellene i kartet og retter den ut der sikten er fri. Kartplotteren legger inn veien ut av havna og veien inn når du trykker på en havn (`exitWps` og `entryWps`). På Husøy går den inn gjennom moloåpningen i sør.
     - Simuleringen melder ikke grunnstøting på land innenfor 600 m fra en havn, bare på grunt vann. En rute rett over en molo blir derfor ikke stoppet, bare vist. Innseilingsveien er det som holder båtene i sjøen.
     - Jonas merket også slipp og verksted i Botnhamn (Botnhamn Sveis). Verkstedet i spillet er ikke knyttet til noen havn i dag.
3. **B3 Mottakene i 3D (ferdig):**
   - **Bygget:** Mottaket er det nærmeste store OpenStreetMap-bygget ved liggeplassen, og industribygg foretrekkes. Finnes det ikke noe, settes et eget bygg på nærmeste tørre land. Veggen mot kaia får port, baldakin og skilt med mottakets navn.
   - **Kaia:** Issilo på bein står der det er best avstand til kran og losseplass, med kort renne ut over liggeplassen. Kaia har gul kaikran, lysmaster som lyser om natta, og kassestabler og kar ved porten.
   - **Truck:** Kjører paller mellom stabelen og kaia.
   - **Arbeidere:** Fire i varselklær og hjelm. De kveiler tau ved pullertene, spyler og stabler kasser, feier og tar kaffepause. Mellom 22 og 06 er bare vakta der.
   - **Ytelse:** Bare mottaket nærmest kameraet animeres. Koden ligger i `view3d.js` under «fish plants» (`plantLayout`, `buildPlants`, `drawPlant`).
4. **B4 Levering (ferdig):**
   - **Tid:** Leveringen tar spilltid. Klargjøring 5 min, 2,5 min per kranløft og 5 min til innveiing og sluttseddel (`LANDING` i `07-harbours.js`). Tallene er anslag.
   - **Kasser og kar:** Skiff og snekke lander i kasser på 40 kg fisk, ni per løft. Sjarkene lander i kar på 300 kg, ett per løft.
   - **Eksempler:** En skiff med 300 kg tar 12,5 min, en snekke med 900 kg 17,5 min, en sjark med 2,5 t 32,5 min og en ny sjark med 6 t 60 min.
   - **Salget:** Salget (`sell()`) gjøres når sluttseddelen kommer, på det som er i lasten da. Avgang som settes under lossingen, venter til den er ferdig. Driftsplanen lander på samme måte, og rapporten kommer med sluttseddelen (`opsReport`).
   - **Is:** Is renner fra isrenna med rundt 100 kg i minuttet (`b.iceUntil`, bare for 3D).
   - **I 3D** (`landScene` i `view3d.js`) følger alt den samme tidslinja, så siste last er på kaia når sluttseddelen kommer:
     - **Lasten:** Den står på dekk, på paller med kasser eller i kar. Sjarken har plass til fire kar på dekk, og resten ligger i lasterommet.
     - **Kranen:** Den svinger ut, senker kroken til lasten, løfter og svinger inn, og setter lasten på losseplassen. Annenhver last stables oppå den forrige.
     - **Trucken:** Den henter to laster om gangen og kjører dem inn porten. Farten settes slik at en tur tar høyst to løft (1,9–4,6 spillminutter i de åtte mottakene).
     - **Folka:** Én gir tegn ved kaikanten, én tar imot lasten og hekter av, én teller ved porten og én kjører kranen med fjernkontroll. Alle møter opp, også om natta. Når noen må til en ny plass, går de dit. Trucken kjører.
     - **Isen:** Den renner fra isrenna ned i båten mens isen fylles.
   - **Ikke med ennå:** Andre båter i flåten og lokalflåten lander uten animasjon. Egne båter vises ikke i 3D før fase 4.
5. **B5 Bunkring (ferdig):**
   - **Forhaling:** Der havna har egen bunkerskai, betyr «Fyll drivstoff» at båten kaster loss fra mottakskaia, går bort og fortøyer ved bunkerskaia (`startShift`, rundt 3 knop). Vil du levere derfra, går den tilbake til mottakskaia først. Isen kommer fra isrenna ved mottaket. Står båten ved bunkerskaia, går den derfor tilbake før du kan kjøpe is. Finnsnes fyller der båten ligger.
   - **Pumpa:** Omtrent 45 L/min bensin og 90 L/min diesel (`PUMP`, anslag), pluss 1,5 min for å få slangen ut og 1 min for å legge den på plass. Du betaler etter hvert som det renner inn. En skiff fyller 80 L på litt over 4 min, en sjark 500 L på rundt 8 min.
   - **Venting:** Avgang og driftsplan venter mens båten losser, forhaler eller fyller (`portBusy`). Driftsplanen fyller ved bunkerskaia etter lossingen, og rapporten sier det.
   - **I 3D:** Bunkersanlegget har tank i betongkar, pumpe med teller, slangetrommel og «BUNKERS»-skilt, i de fem bunkershavnene og i Finnsnes. Forhalingen følger spilltida: tauene tas inn, båten går over, tauene settes. En person fra båten står ved kaikanten med pistolen i fylleåpningen, og telleren går.
