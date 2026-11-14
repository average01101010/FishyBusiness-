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

## 4.18c Mottakene for havfiskeflåten (H0 av `docs/planer/havsteget.md`, 03.11.2026)

Jonas 03.11.2026: «Start H0 - Grunnmuren». Grunnmuren gjør at havbåtene får havner og priser før de låses opp i H1. Spillerne merker bare de nye mottakene på kartet.

- **Dataene (`tools/mottak/mottak.py hav`):** henter sluttsedlene 2024–2025 (Fiskeridirektoratet, NLOD) og føyer to ting inn i `src/data/mottak.json` slik den er. Flyttingene for bruer og land, som ble gjort etter at fila ble laget, står derfor.
  - Sild (NVG), makrell og snøkrabbe blant artene per mottak.
  - `big`: andelen av alt mottaket tar imot, som kommer fra fartøy på 28 m og over. 88 mottak får en femdel eller mer.
  - Den vanlige kjøringen av verktøyet teller det samme.
- **Havnene (`core/06b-coastports.js`):**
  - **Hva hver havn kjenner:** redskapsgruppene den tar imot (`mk.gear`), andelen fra 28 m og over (`mk.big`), havartene (`mk.hsp`), og kaia (`mk.q`: lengde og dybde fra registerets kaifront, den lengste i havna).
  - **Havflåtens mottak:** et mottak som tar minst 500 t i året av spillets arter og havartene, med en femdel eller mer fra 28 m og over.
    - Ligger det innen 1,5 km av en havn, hører det til den havna (`mk.hav`).
    - Ellers blir det en egen havn bare for havfiskefartøy (`havOnly`, `havMottak`, `mottak:false`). Kystbåtene kan ikke legge til der, det kommer ingen bestillinger derfra, og driftsplanen og Kystkartet ser det ikke.
    - **Lossingen der** (rettet i H2e 06.11.2026): `plantFor(pt, type)` i `06b-coastports.js` er regelen for «et mottak for denne båten»: alle mottak, og havmottakene for en havbåt. `startLanding` og Lever-siden (`landPage`, havnepanelet i `07-guide.js`) spurte bare `pt.mottak`, så en havbåt kunne ikke losse ved et havmottak (Avaldsnes, funnet av `havtur` fra Bergen), mens salget, tjenestene (`portServices`) og Driftsplan 2 (`p2PlantOk`) alt tok det.
    - Mottaket må ligge 1,5 km fra butikker, verft og rorbuer (`docs/handelssteder.md`).
    - 13 slike havner: Ellingsøy vest, Florø, Selje, Hjørungavåg, Fiskarstrand, Fiskarstrand øst, Lødingen, Longva, Måløy, Rypefjord (Hammerfest), Bulandet, Egersund sør og Avaldsnes.
    - Butikken i Rypefjord og verftet ved Fiskarstrand sto under 1,5 km fra havflåtens mottak. De er flyttet med `tools/steder/havflytt.py` (Jonas 03.11.2026: «Rypefjord og fiskarstrand øst må også ha mottak for havflåten. Flytt om så butikken eller verftet»): butikken 559 m til en kai på 96 m i Rypefjord, og verftet 1,2 km til en kai på 36 m. Flyttingen følger reglene i `landflytt.py`: land bak, ingen bro, 1,5 km til alle andre steder og 5 km mellom verft.
  - **`portWhy(pt, type)`:** et havfiskefartøy (`cls:'hav'`) kan legge til og levere bare der kaia er lang og dyp nok (som `quayFit`: 90 % av kaia minst lengden og 2 m, dybden minst dypgangen og 0,5 m). I tillegg må mottaket ta minst 5 % fra en av båtens redskapsgrupper (`VESSELS.mottak`: Trål, Not, Konvensjonelle), eller få en femdel fra 28 m og over. Grunnen gis på norsk og engelsk. Kystbåtene kan bruke alle mottakene som før.
  - **Ukjent dybde:** 0 i registeret (57 av 293 kaier) betyr at dybden ikke er kjent. Den regnes som 3 m (`QUAY_DEPTH_UNKNOWN`, som `quayFit`), og meldingen sier at den ikke er kjent.
  - **Stikkprøve 03.11.2026:** Båtsfjord, Tromsdalen, Selje og Skudeneshavn tar alle havbåtene. Melbu (84 m) nekter den pelagiske (75 m). Måløy (46 m) tar bare kystnotbåten. Kristiansand har ukjent dybde. En sjark kan ikke legge til ved et havmottak. Skjermbilder av Måløy i begge formater.
  - **Hvor regelen gjelder:** «Fortøy» (`moorAll`), Autonav til en havn (`leiaTo`), salget (`sell`) og «Lever» (`portServices`).
  - **Målt:**

    | Fartøy | Mottak som tar det |
    |---|---|
    | autoliner | 30 |
    | snøkrabbe | 17 |
    | ringnot38 | 35 |
    | bunntral | 7 |
    | pelagisk | 4 |

    Det er av 161 kystmottak med kai. I tillegg kommer de 13 havnene som bare er for havflåten.
- **Prisene (`core/02-species-gear.js`):**
  - **Fisk fryst om bord** får sin egen pris etter sedlene (`pmF`, Jonas 03.11.2026: «Prisene skal reflektere virkeligheten»), se 5.4 i `priser-og-salg.md`.
  - Sild, makrell og snøkrabbe har prisene per måned fra de samme sedlene: sild i RSW 11,5–12,8 kr, makrell i RSW 14–48 kr (lavest om sommeren, høyest i oktober) og fryst snøkrabbe 94–137 kr.
  - Månedene uten landinger er fylt mellom naboene, og laveste måned er gulvet.
- **Tester:** `tests/unit/havsteg.test.mjs` (havnene, regelen, grunnen, prisene for havartene) og `regions` (landsdelene til de nye havnene, `port-regions.json` skrevet på nytt).

## 4.18d Longyearbyen: havn uten mottak (H1b R7, 05.11.2026)

Longyearbyen er havn for spillerens båter, men ikke mottak (V4 B). Havneplassene kommer fra vec-pakkene som langs kysten (4.16c i `npc-trafikk.md`: Longyearbyen havn, Longyearbyen nordvest havn, Adventfjorden havn), og verftet og utstyrsbutikken står i 5.32b i `handel-og-steder.md`. Nærmeste mottak er på fastlandet (Tufjord, rundt 840 km). Mannskapet flyr til og fra Tromsø (5.6b i `folk-om-bord.md`).

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
  - Naustet står oppå kartets egen bakke slik den er (Jonas 01.11.2026: «modellen må ikke grave ut landmasse … Den må ligge oppå landmassen»): modellen har ikke lenger sin egen fjærebanke av ruter, steiner og gresstuster, og bakken skjæres ikke. Pålene, stolpene, steinmuren, tømmerkassen og bukkene under færingen går 1,2 m lenger ned (`SINK` i `naust.py`), inn i bakken. Står kartets bakke under kaidekket eller gulvet høyere enn undersiden deres, løftes hele modellen over den (`siteLift` med `SFOOT.naust`, `s.lift`, høyst 2,5 m). Bare sjøbunnen foran kaifronten senkes, der sjøkartet har sjø (kartets strand faller 1:3 fra kystlinja, så båten lå tørt): til båtens dypgang og en meter (minst 3 m), 16 m langs fronten til hver side og båtens bredde og 8 m ut, tilbake til det den var innen 8 m (`s.pit`).
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
  - **Ingen hurtigreise** (Jonas: «Fast travel er ikke mulig i spillet, punktum.»; **snudd med vilkår 12.11.2026**: hopp over resten av ruta mot ekte penger, med pris etter spart tid, diesel, is og fisk som om båten seilte, nektet før kjøpet i hardt vær og i turoppdrag og løp; plan i `docs/planer/hopp.md`, ikke bygd). Det som står her, gjelder fortsatt: `startShift` flytter aldri båten til eller fra naustet. Levering og diesel avvises ved naustet (`NAUST_SAIL`), og spilleren må seile til mottakskaia selv.
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
- **Fjæra** finnes første gang kartet der er lastet (`rorbuSite` i `core/07d-rorbu.js`, med `shoreSpot` som naustet): ved fiskeværet 150–700 m fra kaia, ellers så nær punktet som mulig, minst 110 m fra en havneenhet og 120 m fra naustet. Kaifronten står 4,4 m ute fra fjærelinja. Finnes ingen rett fjære, blir rorbua borte (`R.site = null`).
- **Som sted** er rorbua ikke en havn i `PORTS`. `portById` kjenner den likevel (`RBID`), med `rorbu:true` og uten mottak, diesel, is eller butikk. Båten ligger ved den med `b.status = 'port'` og `b.port = 'rbN'`. `quayFace(id, 'main')` er `rorbuFace` (14 m front), og `berthPose` legger båten der. I havn har knappene bare Hvil, Arbeid og Beholdning. `shopBuy` avviser handel.
- **Rute dit**: et trykk ved rorbua i kartplotteren eller med Autonav gjør den til rutas siste punkt (`rorbuSites` i `03-map.js` og `03b-route.js`). Kartplotteren tegner rorbuene som små røde hus fra regionnivå, og navnet nær. Kaia er en hindring for andre ruter (`11b-obstacles.js`).
- **3D**: rorbuene innen 4 km står i `SITES` (`rorbuNow`, høyst én ny fjære regnes ut per bilde med `rorbuSoon`). De står oppå kartets egen bakke som naustet (Jonas 01.11.2026: «Fiks samme løsning for de andre relevante byggene også … så sømløst som mulig»): `rorbu.py` har ikke lenger egen bank av ruter, steiner og gresstuster, stolpene og pålene går 1,2 m ned i bakken (`SINK`), bakken skjæres ikke, modellen løftes over bakken under kaia, hytta og altanen (`siteLift`, `SFOOT.rorbu`, høyst 2,5 m), og bare sjøbunnen foran kaia senkes og får vann i strandmasken (`s.pit`, 14 m til hver side). Kartets hus der tas bort.
- **Snø på egen bakke og tak** (Jonas 05.10.2026: «Ser jo rart ut at det er grønt gress rundt rorbua, så er det snø overalt ellers»): i Blender har gress og lyng fargesone 3, berg over flomålet og taket sone 2 (`rorbu.py`, `naust.py`, `Z`). `siteSnow` i `view3d.js` legger snø på det som vender opp, etter terrengets snøgrense (`snowNow`, samme regel som `recolor`, litt flekkete), og gresstustene blir visne. Modellen lages på nytt når snøgrensen flytter seg (20 m av gangen). Gjelder også fars naust.
- **Fortøy** (Jonas 05.10.2026: «Det må også være mulig å fortøye i kaia»): ligger båten stille innen 400 m fra en kai, en rorbu eller naustet, står «Fortøy» i skuffen (`moorNear` i `core/16-helm.js`, `moorGo` i `ui/10c-dock.js`). Den finner veien inn som Autonav og legger til. Uten blåse i nærheten tar den plassen til den grå «Ta opp». Med manuell styring heter knappen «Fortøy ved rorbua i …» eller «Fortøy i …», og den virker også ved rorbuer og naustet.
- **Hvilen** står i 5.19. Den koster 150 kr natta, betalt når du går inn og så for hvert døgn. Har du ikke råd til neste natt, går du om bord.
- **Tester**: `tests/rorbutest.py` (plassene, fjæra ved Gryllefjord og på et le-sted, Autonav dit, knappene, natt og hvile på 6 timer, neste natt, åpen båt ved mottakskai, kartplotteren, lagring) og `coast3d.py` (rorbua i 3D ved Gryllefjord, `coast_rorbu.png`).
- **Ikke gjort ennå:** kameraet kan gå inn i huset, og lykta ved døra lyser ikke.

## 5.25j Rorbuer og naust tar båter opp til 15 m (13.11.2026)

Jonas 13.11.2026, etter testen fra alle steder med den eldre kystbåten (21 m, 3,4 m dypgående), som lå ved rorbukaiene (14 m, 3,4 m) og naustkaia (16 m) med 2–2,5 m vann under seg og ikke fant noen vei ut. Han valgte «Grense ved 15 m»: «Rorbua og naustet tar båter opp til 15 m, uansett dybde ved kaia. Større båter avvises».

- **Grensen** (`SITE_MAXLEN` og `siteFits` i `core/07-harbours.js`): en båt over 15 m får ikke tilbud om rorbua eller naustet. Det gjelder trykk i kartet (`03-map.js`, `03b-route.js`), Autonav-målet (`rorbuTarget`, `naustTarget`), «Fortøy» (`moorAll`), driftsplanens hjem (`05d-plan2.js`; en lagret plan med rorbua som hjem sier fra i `06h-plan2-engine.js`) og hviletipset (`rorbuTip`). Naustets liggeplass leses som mottakets for henne (`berthKind`, `dock`).
- **Lagringene:** en båt over 15 m som alt ligger ved en rorbu, flyttes ved oppstart til nærmeste havn som tar henne, med en linje i loggen (`ui/11-boot.js`, `siteOut`; også flåtens andre båter).
- **Dybden «uansett»:** liggeplassen ved rorbuene og naustet mudres i simuleringen til den dypeste båten under 15 m (`SITE_DRAFT`, kystbåten på 14,99 m med 3,0 m) og 0,5 m ved laveste lavvann (`siteDredge` i `depthF`; lomma er 12 m til hver side og 14 m ut, `SITE_POCK`, og bunnen stiger 1:2 utenfor). Gropen i 3D er like dyp (`view3d/03-berths-naust.js`).
- **Veien ut:** en rorbu (`rorbuSite`) og naustet (`naustFind`, `naustWay`) legges bare der den båten kommer ut til åpent vann eller en havn. Lomma regnes som mudret under sjekken. Før gjaldt kravet til naustet bare båten spilleren hadde da naustet ble funnet, og rorbuene hadde ikke noe krav. Et naust sjekkes én gang mot kaia det ble funnet ved (`qk`), og de gamle naustene sjekkes én gang med det nye kravet.
- **Lomma når ut til båten** (14.11.2026, steg 126): ved naustene på Kvitsøy og Smøla nord lå den fine kysten 16 m ut fra naustets front, kaia ble bygd ut dit (`quayOut`), båten lå 20 m ut, og lomma på 14 m fra fronten ga henne 2,0 m. Nå regnes kaia ut én gang per sted med 15 m-grensen (`siteOut`, samme for alle båter der), og lomma (`sitePockE`) og 3D-gropa (`view3d/03-berths-naust.js`) når så langt ut i tillegg. Begge naustene 3,5 m etterpå. `tests/unit/sitepock.test.mjs`.
- `tests/unit/siteplass.test.mjs` og `tests/allesteder.py` (kystbåten på 14,99 m ved hver rorbu og hvert naust, og at den på 21 m avvises der).

## Havner, mottak og fortøyning (B1–B5, godkjent 29.09.2026)

**Fra 02.10.2026 står havneenheten i alle de åtte mottakshavnene** (se 5.13). Den erstatter de genererte mottakene i B3, bunkerskaiene i B5 og kaifrontene i `QUAYS` for disse havnene. Sommarøy, Brensholmen og Frovåg har nå også bunkers. Tidslinjene for landing, forhaling, bunkring og is er de samme. Finnsnes har som før sin kai i `QUAYS` og fyller der båten ligger.

Mottakene ligger der Jonas har funnet dem i Råfisklagets leveranseoversikt: Husøy, Senjahopen, Botnhamn, Gryllefjord, Sommarøy, Brensholmen, Torsken og Frovåg. Finnsnes har ikke mottak eller is i virkeligheten, bare bøteri og forhandler av fiskeutstyr og båter. Bunkerskai: Husøy, Senjahopen, Gryllefjord, Botnhamn og Torsken, fra Jonas' satellittbilder. Finnsnes beholder drivstoff inntil videre (se åpne spørsmål).

1. **B1 Havnene (ferdig):** Åtte mottak. De fire nye (Sommarøy, Brensholmen, Torsken, Frovåg) ligger ved OpenStreetMap-kaia nærmest det største industribygget. Frovåg er funnet fra sjømerket «Frovåghamn» og veien Frovågneset. Is bare på mottakene, drivstoff i Finnsnes, Husøy, Senjahopen og Gryllefjord. Driftsplanen fyller bare det havna selger, og de nye mottakene legger ut bestillinger. Prisfaktorene for de nye (0,98–1,0) er anslag.
2. **B2 Fortøyning (ferdig):**
   - **Kaiene:** `src/js/core/07-harbours.js` har kaiene som bokser (`PIERBOX`), som 3D-visningen tegner, med dekket 2,4 m over middelvann (`QTOP`).
   - **Liggeplassen:** `berthPose(havn, type)` gir liggeplassen langs nærmeste kaifront med kaia på styrbord side, eller på babord for en båt med dekkskranen om babord (F22, OB4 11.11.2026: `berthSide(type)` leser `VESSELS[type].quay`, −1 for den nye hurtigsjarken, kyst15 og kyst21; `bp.side` er +1 eller −1, og kursen er snudd en halv omdreining for −1, på samme plass ut fra fronten). Fortøyningen (`MO.side`), fenderne, båtens egen kran (`drawCrane`), mannskapets plasser (`CREW3D.quaySide`) og Kystvaktas plass utenpå (`kvPose`: på siden bort fra kaia) leser siden. Lossingen med mottakets kran og isen går i båtens egen ramme og trengte ingen endring. Bunkringen leser fyllestussen fra modellen (`G.filler`), som står om babord på de fleste båtene: slangen går over dekket der stussen er på siden bort fra kaia, som før (nå også på den nye hurtigsjarken, som har stussen om styrbord; kyst15 og kyst21 fikk den mot kaia). `tests/unit/lossing.test.mjs` passer på at feltet stemmer med kranen i modellen (`kit.crane`). Fronten må være minst 2 m lengre enn båten.
   - **Kaifronten:** Den har dekk i kjetting, fenderbjelke, gul kant og pullerter.
   - **Å legge til:** Båten kommer inn i en bue og legger seg parallelt med kaia, og fenderne henges ut. Tauene settes i rekkefølgen akterspring, baugtamp, hekktamp og forspring. **Fra OB2 (09.11.2026)** gjør mannskapet det: fenderne henges ut de siste 400 m inn, hvert tau kastes fra klampen når hånden står der, og skipperen står ved roret til hun ligger fortøyd (`moorPhase` i `core/05-vessels.js`, stasjonen `fort`; 5.19c i `docs/systemer/folk-om-bord.md`).
   - **Tidevannet:** Tauene får lengden de hadde da de ble satt, så de slakkes og strammes med tidevannet.
   - **Å kaste loss:** Dette er tilstanden `unmooring` i simuleringen og tar `CAST_MIN` (1) spillminutt, mens tauene tas inn i omvendt rekkefølge av mannskapet på `fort`; klar av kaia tas fenderne inn og tauene kveiles før noen går inn (`stow`, OB2).
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
   - **Kasser og kar:** (Endret 04.11.2026, `docs/planer/fiskekar-dekk.md`.) Alt lander i hvite kar på 500 kg (`TUB_KG`, `core/07f-kar.js`), ett per løft. Båtene uten lasterom (skiff, trebåt, snekke) løfter sine egne kar fra plassene på dekk, og karene kommer spylt tilbake om bord ett og ett etter vasken (`LANDING.wash`, 6 spillminutter; `landPlan` gir `own`, `lifts` = 2 × kar, `landLiftT`). Båtene med lasterom fyller mottakets kar fra rommet, satt ut på dekk (`deckSlots`). Kranen løfter med en firepartsstropp fra hvert hjørne (Jonas 04.11.2026), samlet i ringen på kroken (`drawSling`, delene `slynge_*` i `deck-fish`). Trucken tar de fulle karene inn, og på en åpen båt kommer den ut igjen med de spylte (`fkRun(P, back)`). Før 04.11.2026 landet skiffen og snekka i kasser på 40 kg og sjarkene i kar på 300 kg; en lossing som var i gang i en gammel lagring (`kind:'box'`), spilles som før.
   - **Paller for frysebåtene** (H2b, 05.11.2026, V1 A i `docs/planer/havsteget-h2-autoline.md`): et fartøy med fryserom lander den frosne fangsten på paller på om lag 1 t produkt, ett løft hvert sjette minutt, om lag 10 t i timen (`PALL`, `landPlan` med `kind:'pall'`), så 300 t tar om lag 30 timer. Fisk som ligger ufryst, fryses ved kaia før innveiingen (`landFreeze`). I 3D løfter kranen en pall med kartonger (`PM.palF`). Detaljene står i 5.65 i `redskap.md`.
   - **Eksempler:** En skiff med 300 kg tar 12,5 min, en snekke med 900 kg 17,5 min, en sjark med 2,5 t 32,5 min og en ny sjark med 6 t 60 min.
   - **Salget:** Salget (`sell()`) gjøres når sluttseddelen kommer, på det som er i lasten da. Avgang som settes under lossingen, venter til den er ferdig. Driftsplanen lander på samme måte, og rapporten kommer med sluttseddelen (`opsReport`).
   - **Is:** Is renner fra isrenna med rundt 100 kg i minuttet (`b.iceUntil`, bare for 3D).
   - **I 3D** (`landScene` i `view3d.js`) følger alt den samme tidslinja, så siste last er på kaia når sluttseddelen kommer:
     - **Lasten:** Den står på dekk, på paller med kasser eller i kar. Sjarken har plass til fire kar på dekk, og resten ligger i lasterommet.
     - **Kranen:** Den svinger ut, senker kroken til lasten, løfter og svinger inn, og setter lasten på losseplassen. Annenhver last stables oppå den forrige.
     - **Trucken:** Den henter to laster om gangen og kjører dem inn porten. Farten settes slik at en tur tar høyst to løft (1,9–4,6 spillminutter i de åtte mottakene).
     - **Folka:** Én gir tegn ved kaikanten, én tar imot lasten og hekter av, én teller ved porten og én kjører kranen med fjernkontroll. Alle møter opp, også om natta. Når noen må til en ny plass, går de dit. Trucken kjører.
     - **Isen:** Den renner fra isrenna ned i båten mens isen fylles. Fra OB4 (11.11.2026) svinges renna mot iskassa, og på en båt med dekksmannskap kommer isen gjennom en slange til den som tar imot ved kassa (5.19e i `folk-om-bord.md`).
     - **Båtens eget mannskap (OB4, 11.11.2026):** én hekter stroppen på ved karet og én gir tegn ved rekka mot kaia; mottakets kar står på fritt dekk under åpen himmel (5.19e i `folk-om-bord.md`).
   - **Ikke med ennå:** Andre båter i flåten og lokalflåten lander uten animasjon. Egne båter vises ikke i 3D før fase 4.
5. **B5 Bunkring (ferdig):**
   - **Forhaling:** Der havna har egen bunkerskai, betyr «Fyll drivstoff» at båten kaster loss fra mottakskaia, går bort og fortøyer ved bunkerskaia (`startShift`, rundt 3 knop). Vil du levere derfra, går den tilbake til mottakskaia først. Isen kommer fra isrenna ved mottaket. Står båten ved bunkerskaia, går den derfor tilbake før du kan kjøpe is. Finnsnes fyller der båten ligger.
   - **Pumpa:** Omtrent 45 L/min bensin og 90 L/min diesel (`PUMP`, anslag), pluss 1,5 min for å få slangen ut og 1 min for å legge den på plass. Du betaler etter hvert som det renner inn. En skiff fyller 80 L på litt over 4 min, en sjark 500 L på rundt 8 min. **Havbåtene** (`cls:'hav'`) bunkrer med 800 L/min fra kaiens tankanlegg eller en bunkerbåt (`PUMP.hav`, H2e 06.11.2026, antatt mellom bunkerbåten «Aas Provider»s 400 L/min, iLaks, og Thyborøn havns faste anlegg for fiskeflåten på opptil 1 500 L/min). Før tok autolinerens 180 m³ over et døgn og en full tank (300 m³) over to; nå 3,9 og 6,3 timer (`havtur`).
   - **Venting:** Avgang og driftsplan venter mens båten losser, forhaler eller fyller (`portBusy`). Driftsplanen fyller ved bunkerskaia etter lossingen, og rapporten sier det.
   - **I 3D:** Bunkersanlegget har tank i betongkar, pumpe med teller, slangetrommel og «BUNKERS»-skilt, i de fem bunkershavnene og i Finnsnes. Forhalingen følger spilltida: tauene tas inn, båten går over, tauene settes. En person fra båten står ved kaikanten med pistolen i fylleåpningen, og telleren går.

## Sluttseddelen raskere (Tonys spilltest 06.11.2026)

`LANDING` i `core/07-harbours.js`: `note` 5 → 2 spillminutter (innveiingen og seddelen etter siste løft) og `wash` 6 → 3 (de åpne båtenes fulle kar inn, tømt og vasket, før kranen tar dem tilbake). Kranens løft (`lift` 2,5) og `prep` 1 er som før, siden 3D spiller løftene på samme tidslinje. En sjark med 500 kg: 1 + 2,5 + 2 = 5,5 min (var 8,5). Trebåtens ene kar opp og tilbake: 1 + 2 · 2,5 + 3 + 2 = 11 min (var 17). Enhetstesten i `fabrikk.test.mjs` sier seddelen 2 min etter siste løft; `landtest.py` regner ut av `LANDING` selv.

## Køen ved mottakene (K1–K4, K6 i `docs/planer/etter-tonys-test.md`; Jonas 07.11.2026, V2 A og V3 A)

Jonas: «La det være mulig at det blir kø ved mottakene … Det insentiverer at brukerne sprer seg i landet.»

- **Losseplassene** (`landSlots(pt)` i `core/07-harbours.js`): én per 25 m kaifront fra kjøperregisteret (`pt.mk.q[0]`), 1–4. Husøy (59 m) 2, Botnhamn (25 m) 1, Senjahopen (144 m) 4, et mottak uten registrert kai 1. Tallene er anslag (K1) og justeres i spilltesting.
- **Serveren** (`supabase/migrations/20261107120000_landing_q.sql`): tabellen `landing_q` (én rad per spiller: mottak, kg, `since`, `seen`, `started`, `until`), og funksjonene `land_begin(port, kg, dur_s, slots)` (plassen nå: `{go:true, until}` eller `{go:false, ahead, active, slots, wait_s}`; FIFO etter `since`; et annet mottak starter ventetida på nytt), `land_end()` og `land_look(ports)` (køene ved inntil 12 mottak: `[{port, active, waiting}]`). `land_sweep` sletter en lossing tre minutter etter slutten og en venting som ikke er fornyet på ett minutt, så en lukket fane aldri holder kaia (K6). Bare `authenticated`; anon nektes. Ventetida er grovt regnet: den første plassen som blir ledig, pluss én lossing av egen lengde per båt foran. Migreringen er kjørt mot Supabase 07.11.2026.
- **Klienten:** `startLanding` spør serveren når køen er på (`landQueueOn`: skyen på, ikke første tur, ikke mens tida borte spilles, ikke slått av): `b.landQ = {pid, kg, ops, t0, ahead, wait, slots}`, og `landQueueAsk` spør hvert 15. ekte sekund fra `quayMinute`. Svarer serveren go, kjører `landQueueGo` → `landStart` (lossingen som før, med kranens tidslinje). `landQueueEnd` sender `land_end` fra `finishLanding`, fra «Gå ut av køen» og fra `depart` (uten driftsplan). `portBusy` regner køen som opptatt, så planene venter (`depart` setter avgangen minuttet etter). **Aldri en hindring:** uten skyen, i første tur, under `catchUp` (`LANDQ.away`, satt av `playMinutes`), etter to mislykkede kall eller ved 404 (`LANDQ.off`, serveren uten køen) losser hun som før.
- **Skjermen:** stripa og skuffens linje «Kø · 2 foran · ca. 11 min» (`landQText`, `10c-dock.js info`), Lever-siden med køen, «Gå ut av køen» og «Lever et annet sted» (`landQOthers`: de tre nærmeste mottakene med køen fra `land_look`, et minutt gammel, og «Kjør dit» = Autonav dit via `landgo`), og en toast ved første svar (`hooks.onLandQ` i `10-rod-acts.js`). Fisken ligger som i lasten imens (K4: ingen ekstra straff).
- **Ikke gjort:** NPC-flåten tar ingen plasser (K5), push-varselet «Din tur ved kaia», og 3D viser ikke de andre spillernes lossing ved kaia (de andres båter vises som før).
- **Tester:** `tests/kotest.py` (12 sjekker: plassene etter kailengden, uten skyen som før, venting med riktig kall og tekster, Lever-siden, 15-sekundersregelen, go, `land_end` ved slutt og ved «Gå ut av køen», serveren nede, 404, tida borte), og `tests/sqltest.py` (K2: rekkefølgen, ventetida, plassen fri ved `land_end`, en venting som ikke fornyes, `land_look`, anon). Sett rød før (kotest krasjet på `b.land` null før `landQueueGo` ble rettet til å losse før skjermkroken).
