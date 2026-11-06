# UI 2, U2-0: kartleggingen i stående (06.11.2026)

Fase U2-0 i `docs/planer/ui-2-staaende.md`: det Kystlys-undersøkelsen (04.11.2026) ikke gjorde. Alt her er målt eller lest i koden 06.11.2026 på arbeidsgrenen (`0b9de6d7`), med `tests/kartlegging.py` (ny), `tests/uishots.py` og `tests/uiplay.py` i stående. Ingenting i `src/` er endret. Containeren har ingen GPU, så målingene er tatt uten 3D; bildene med 3D er Jonas' egne (`tlf-01` til `tlf-13`, `brett-01` til `brett-04` i denne mappa).

## 1. Inventaret: alt spilleren ser og kan gjøre, i tre bøtter

Lest ut av koden (`ui/04-panels-instruments.js`, `ui/10c-dock.js`, `ui/03e-miniplot.js`, `ui/05j-catchfeed.js`, `ui/phone/00-shell.js`, `ui/phone/11-rederi.js`). Bøttene er planens: **sanntid** er det som må synes uten trykk, **ett trykk** er det som må nås med ett trykk fra 3D-visningen, **bakmeny** er det som kan ligge bak en side eller en app. Kolonnen «I dag» sier hvor det står nå, «Forslag» hvor planen legger det. Det som er lest, ikke målt, er merket.

### 1.1 Datapunktene

| Datapunkt | I dag | Bøtte | Forslag |
|---|---|---|---|
| Klokka og datoen | boksens hode, stripa | sanntid | stripa, linje 1 |
| Kassa | boksens hode, stripa, telefonens widget | sanntid | stripa, linje 1 |
| Tilstanden (I havn, Ligger stille, Jukser, Underveis, Hiver anker, …) med prikk | boksen, stripa | sanntid | stripa, linje 1 |
| Neste hendelse (fisket ferdig, framme, avgang, sluttseddelen, bunkringen, verkstedet) med klokkeslett og ekte tid | boksen (`nextEvent`) **og** pilla over knappene (`infoText`) | sanntid | stripa, linje 3, ett sted |
| Diesel, last, energi, sjø | boksens fire målere | sanntid | stripa, linje 2 |
| Full last («Full», rødt) | måleren Last | sanntid | linje 2 og hovedknappen «Til mottaket» |
| Reglene her (✓ Lov her, !, ✕) | «nå»-rad i boksen, «Nå»-kort på telefonen | sanntid bare når ! eller ✕ | linje 3 ved ! og ✕; ✓ bare i boksen bak stripa |
| Stabilitet (synkronrulling, kraftig rulling, rank) | «nå»-rad, oransje | sanntid | linje 3 |
| Blåsa (avstand, drift, «Kjør dit») | «nå»-rad | sanntid ved eget redskap | linje 3 |
| Kulde (−%, °C) | «nå»-rad | sanntid når den koster | linje 3, bak sjø og regler |
| Haill (+%) | «nå»-rad | bakmeny | boksen bak stripa |
| Båten (navn, ⚓) ved flere båter | «nå»-rad | bakmeny | boksen; Rederi-appen |
| Vind, bølger med risiko, drivstoff av kapasitet, last av kapasitet, rund vekt, bonus, skatt og spart | hele tabellen ved trykk (`hudFull`) | bakmeny | boksen bak stripa, som i dag |
| Fart, kurs, posisjon | minikartets fot (`GPS3D`), GPS-boksen i liggende telefon | sanntid | minikartets fot som i dag |
| Neste punkt, ETA, mål | minikartets fot når ruta går (`navOf`) | sanntid under seiling | som i dag |
| Dybde, tidevann, sol | bare i plotterens ECDIS-linje | ett trykk | som i dag (minikartet åpner plotteren) |
| Ekkoloddet, fisken rundt båten | minikartet (fargeskalaen lite–mye) | sanntid, også under seiling (Jonas 06.11.2026) | minikartet, fast plass; står i roen |
| Fangsten som kommer over ripa (art, kg, kr) og kg/t | fangstkortene til høyre (`CFEED`) | sanntid under fisket | som i dag |
| Dekk: kg og minutter til sløyd | pilla over knappene (`deckText`) | sanntid under fisket | linje 3 |
| Juksing: maskiner i gang og til når | pilla over knappene | sanntid | linje 3 |
| Hviler i køya / på rorbua / i naustet, % og uthvilt kl. | pilla | sanntid under hvile | linje 3 |
| Verksted til / mannskapet jobber til, lossing, forhaling, bunkring | pilla | sanntid i havn | linje 3 |
| Ved kaia / Ved naustet, rorbu kr natta | pilla | bakmeny | tas ut av stripa; står i stedshodet i skuffen |
| Kompasset | toppen | sanntid | som i dag, står i roen |
| Varslene (toast) | over knappene | sanntid | som i dag; bryter roen |
| Meldinger (antall) | telefonknappens merke | sanntid | som i dag |
| Mannskapets krangel og driftsplanens stopp (prikk) | Mannskap-knappen i linja | sanntid | Om bord-knappen |
| Mottak med fisk om bord, verft med forfalt service, butikk med ny vare (prikk) | knappene i havn | ett trykk | som i dag |

### 1.2 Handlingene

| Handling | I dag | Når | Bøtte | Forslag |
|---|---|---|---|---|
| Jukse (timer, arter, start) | linja, kort i vifta | stille, båt rigget for juksa | ett trykk | hovedknappen |
| Jukse selv / Slutt å jukse | linja | jukser i 3D | ett trykk | hovedknappen |
| Stopp (fisket), Stopp og sløy, Fisk videre | linja | jukser | ett trykk | linja |
| Sett ut (vifte med stampene) | linja | stille, settredskap om bord | ett trykk | «Redskap» med vifte, bare når settredskap er om bord |
| Ta opp, Trekk, Trekk og sett igjen | linja, vifte | innen 0,3 km fra blåsa | ett trykk | hovedknappen; «Redskap»-vifta |
| Til blåsa | linja (hovedknapp) | innen en halv mil | ett trykk | hovedknappen |
| Kjør dit (til blåsa langt unna) | «nå»-raden i boksen | blåsa over 1 nm | ett trykk | linje 3 |
| Auto-nav | linja | stille, underveis | ett trykk | ut av linja; minikartet åpner plotteren der Autonav er en knapp; «Til mottaket» som hovedknapp ved full last |
| Stopp båten | linja | underveis | ett trykk | hovedknappen; står i roen |
| Kast loss, Avbryt | linja | avgang planlagt | ett trykk | som i dag |
| Fortøy (vifte ved flere kaier) | linja | kai innen 400 m | ett trykk | linja; sammen med Anker som «Ligg» når det blir for mange |
| Kast anker, Hiv anker | linja | stille med ankerplass | ett trykk | linja |
| Hjelp (Redning) | linja, rødt | motorstopp, driver, grunnstøtt | ett trykk | hovedknappen |
| Prai, Ta slep | linja | en annen spiller nær | ett trykk | linja |
| Mottak: Lever, Is, Agn, Bunkring | vifte | i havn med mottak | ett trykk | som i dag, høyst fire på en rad |
| Butikk: Fiskeutstyr, Elektronikk og haler | vifte | i havn med butikk | ett trykk | som i dag |
| Bygd: Pub, Gjestebok, Bank, Oppdrag, Ansatte (og Hvil ved rorbu) | vifte, fem | i havn | ett trykk | vifta på to rader på to og tre, eller Gjestebok inn i Pub |
| Verft: Båthandel, Oppgrader, Vedlikehold, Malerverksted, Bunkring | vifte, fem | i havn med verft | ett trykk | som Bygd |
| Naustet (3D) | linja | ved fars naust | ett trykk | linja |
| Hvil i køya / i naustet / på rorbua | linja, ofte under «Mer» | alltid | ett trykk når energien er lav | kontekstuell: lav energi, anker, naust, rorbu; ellers i boksen |
| Mannskap (arbeidet om bord, roller) | linja, under «Mer» til sjøs | med mannskap eller driftsplan | ett trykk | fanen Mannskap i Om bord |
| Ansatte (krangelen) | linja med prikk | krangel om bord | ett trykk | Om bord med prikk |
| Beholdning: Redskap, Rigg, Lasterom, Båten | linja, sist | alltid | ett trykk | «Om bord», sist i linja, med Mannskap som femte fane |
| Dekksdagboka | fanen nede til venstre | alltid | ett trykk | som i dag; går ut i roen |
| Telefonen | knappen nede til høyre | alltid | ett trykk | som i dag; går ut i roen |
| Kamera, Kino | øverst til høyre | i 3D | bakmeny | som i dag; går ut i roen |
| Minimer boksen, minimer kartet | − på hver | alltid | bakmeny | stripa er normalen; kartets − står |
| Ta roret på en annen båt / Følg en annen båt | Rederi-appen, under bretten | flere båter | ett trykk fra telefonen | Rederi: flåten først, hovedknappen på kortet |
| Telefonens 24 apper | rutenettet, 12 synlige | alltid | bakmeny | grupper med overskrifter (V6 A) |

### 1.3 Skuffens 21 sider og telefonens apper

- **Skuffen** (`DRAWER`): `drift`, `arbeid`, `rigg`, `fiske`, `service`, `fartoy`, `utstyr`, `utstyrb`, `redskap`, `mannskap`, `bors`, `bank`, `verksted`, `havn`, `last`, `lever`, `is`, `agn`, `oppdrag`, `beholdning`, `maler`. Planen rører ikke sidene (kap. 9 i planen), bare arket de ligger i, og slår `arbeid` inn i `beholdning` som fane.
- **Telefonen** (`APPS`): Vær, Kystposten, Meldinger, Rederi, Salgslaget, Kvote, Regler, Driftsplan, Oppdrag, Nettet, Kaiboden (Haill, Trim, Skippertak som faner), Sesong, Fiskeguide, Venner, Milepæler, Redning, Håndboka, Garderoben, Patchnotes, Tilbakemelding, Innstillinger, Admin. 22 på rutenettet for en spiller med rederi (Admin bare for admin).

## 2. Slik ble det målt

- **`tests/kartlegging.py`** (ny, i `LITE` i `run.py`): starter spillet uten veiledning og uten 3D i 390×844 og 800×1280 (berøring, `device_scale_factor` 2), setter opp 17 tilstander likt i begge (i havn ved mottaket i Finnsnes, med fisk om bord, med mannskap, viftene Bygd, Verft og Mottak, ved fars naust i Vangshamn, avgang planlagt, stille til sjøs på `GROUNDS[0]` med og uten mannskap, juksevifta, med linehaler og to stamper, Sett ut-vifta, innenfor 400 m fra kaia, nesten full last, krangel om bord, underveis til Botnhamn) og leser for hver: knappene i linja med bredde, høyde, skrift, grå og hovedknapp, hvor mange rader de brekker til (topper samlet med 30 px toleranse, så den høyere hovedknappen ikke telles som egen rad), vifta, pilla over knappene, boksens og stripas høyde, neste hendelse, «nå»-radene, hvor minikartet lander, og trykkflatene under 44 px. Så skuffesidene Beholdning, Mannskap og Ansatte (arkets høyde, innholdets lengde i skjermer, knapper), telefonens hjemskjerm og Rederi (målt etter innglidningen), tellingen av fire skjermer, og en tidslinje på fire spilletimer (stille 30 min, juksing 2 t, seiling 1,5 t) med en prøve hvert femte minutt av det stripas tredje linje ville hatt å si. Tallene ligger i `tests/out/kartlegging/<fmt>.json`, bildene ved siden av. Frø 1. Kjøringen tar rundt fire minutter.
- **`tests/uishots.py`** uten 3D i de fem størrelsene (390×844, 844×390, 800×1280, 1280×800, 1440×900): 45 visninger, 0 funn (kuttet tekst, knapper utenfor skjermen, blokker oppå hverandre, knapper under 32×30 px). Sidefeil `[]` i alle.
- **`tests/uiplay.py`** med 3D i 800×1280: første runde ble stoppet av bakgrunnsgrensa på 90 minutter etter 94 av rundt 113 bilder (hele første tur, knappelinja, alle skuffesidene og halve telefonen; bildene ligger i `tests/out/uiplay/staaende-avbrutt-1/`), og tellingen gikk tapt fordi skriptet skrev den først til slutt. Skriptet skriver nå tellingen og stegene etter hvert bilde, og runden kjøres på nytt med to timers grense. `KYST_UIPLAY_SIZE=390x844:tlf` (ny) gir telefonstørrelsen; den kjøres etter nettbrettet om tida rekker. Tellingen føres inn i kap. 3.7 når den finnes.
- **Bildene fra Jonas' telefon og nettbrett** (`tlf-01` til `tlf-13`, `brett-01` til `brett-04`) er 3D-laget: hva som dekker båten.
- **Svakheter:** ingen 3D i målingene (bakgrunnen er svart, og båtens plass i bildet kommer bare fra Jonas' bilder); bare Senja; «full last» nådde 496 av 500 kg, som er «nesten full» og ikke «full», så hovedknappen ved full last (Auto-nav etter spilltest 3, U5) er ikke prøvd; «ved egen blåse», nød, slep og prai er ikke satt opp; tidslinja er én tur uten havnefasen; `env(safe-area-inset-*)` og ekte sveip er ikke med i Chromium.

## 3. Målingene

### 3.1 Knappelinja per tilstand

| Tilstand | Knappene (telefon) | Rader telefon | Rader nettbrett | Grå | Hovedknapp | Pilla over knappene |
|---|---|---|---|---|---|---|
| Havn ved mottak, uten mannskap | Butikk, Bygd, Verft, Beholdning | 1 | 1 | 0 | – | Ved kaia |
| Havn ved mottak, med mannskap | Butikk, Bygd, Verft, Mannskap, Beholdning | 1 | 1 | 0 | – | Ved kaia |
| Havn, vifta Bygd | Pub, Gjestebok, Bank, Oppdrag, Ansatte, Hvil | vifta 2 | vifta 1 | 0 | – | |
| Havn, vifta Verft | Båthandel, Oppgrader, Vedlikehold, Malerverksted, Bunkring | vifta 2 | vifta 1 | 0 | – | |
| Ved fars naust | Hvil, Naustet, Beholdning | 1 | 1 | 0 | – | |
| Avgang planlagt | Kast loss, Avbryt, Beholdning | 1 | 1 | 0 | Kast loss | Avgang 09:09 · Ved kaia |
| Stille til sjøs, juksebåt | Jukse, Sett ut, Ta opp, Auto-nav, Mer, Beholdning | **2** | 1 | 2 (3 uten mannskap) | Jukse | |
| Stille med line om bord | Jukse, Sett ut, Ta opp, Auto-nav, Mer, Beholdning | **2** | 1 | 1 | Jukse | |
| Stille ved kai | Jukse, Sett ut, Fortøy, Auto-nav, Mer, Beholdning | **2** | 1 | 1 | Jukse | |
| Krangel om bord | som stille, Ansatte under Mer | **2** | 1 | 2 | Jukse | |
| Underveis | Stopp båten, Auto-nav, Mannskap, Beholdning | 1 | 1 | 0 | – | |

Knappene på telefonen er 44 px sirkler (hovedknappen 52) med etikett 9,5 px; på nettbrettet 52 og 60 px med 11,5 px. Fem står på én rad på telefonen, seks brekker, og «Mer» står alt i alle tilstander til sjøs fordi Hvil, Mannskap og Anker ligger bak den. Viftene brekker ved fem på telefonen, fire og én.

### 3.2 Boksen, stripa og minikartet

| Tilstand | Boksen telefon | Boksen nettbrett | Stripa | Minikartets topp (telefon) |
|---|---|---|---|---|
| Havn | 110 px | 135 px | 31 / 30 px | 156 px |
| Stille til sjøs | 122 px | 152 px | 31 / 30 px | 168 px |
| Avgang planlagt | 134 px | 155 px | 31 / 30 px | 180 px |
| Underveis | 157 px | 173 px | 31 / 30 px | 203 px |

Boksen varierer med 47 px på telefonen mellom havn og underveis, og minikartet flytter seg like mye, fordi `--gpsTop` måles fra boksen. Stripa er 31 px i alle tilstander. Med stripa står minikartet på samme sted (målt: samme topp som med boksen i hver tilstand, fordi målingen tok begge i samme tilstand; det er boksens høyde mellom tilstander som flytter det).

### 3.3 Stripas tredje linje

Tidslinja, 48 prøver i hvert format (samme tall i begge):

| Tilstand | Prøver | Neste hendelse | Pilla | «Nå»-rader |
|---|---|---|---|---|
| Ligger stille | 6 | 0 | 0 | 2 (Regler ✓, Kulde) |
| Jukser | 24 | 24 («Fisket er ferdig …») | 24 («Jukser til … · Dekk …») | 2 |
| Underveis | 18 | 18 («Fremme i Botnhamn») | 2 | 2 |

Pilla sier aldri noe som neste hendelse ikke også sier (0 prøver med bare pilla), utenom dekkets kg og minutter. «Nå»-radene har alltid minst «Regler ✓ Lov her», så med ✓ regnet med er tredje linje aldri tom til sjøs; uten ✓ er den tom mens båten ligger stille uten noe på gang (6 av 48) og i havn når ingenting skjer (tilstandene havn, naust).

### 3.4 Skuffen i stående

| Side | Arket, telefon | Innhold, telefon | Innhold, nettbrett | Knapper |
|---|---|---|---|---|
| Beholdning (`beholdning`, i `TALL`) | 78 % av høyden | 2,0 skjermer | 1,1 | 7 |
| Mannskap (`arbeid`, i `TALL`) | 78 % | 1,5 skjermer | 1,0 | 7 (to like tunge per person) |
| Ansatte (`mannskap`, ikke i `TALL`) | **55 %** | **4,6 skjermer** (Mannskapsbørsen 4,2) | 2,7 | 6 |

### 3.5 Telefonen

| | Telefon 390×844 | Nettbrett 800×1280 |
|---|---|---|
| Kort over rutenettet på hjemskjermen (med rederi) | 7 | 7 |
| Apper synlige uten å rulle, av 22 | 12 | **6** (rutenettet begynner 84 % ned) |
| Rederi, sidens lengde | 1,7 skjermer | 2,5 skjermer |
| Rederi, der flåten begynner | 0,81 skjermer ned | **1,12 skjermer ned** |
| Knappene over flåten | Hele regnskapet, Til banken | samme |

### 3.6 Trykkflater under 44 px

I alle 17 tilstander: minimer-knappen på boksen (`hmin`) 32×30, minimer-knappen på kartet (`plotMin`) 32×30, og målerknappen (`gauges`) 119×31 på telefonen (205×43 på nettbrettet). Knappene i linja er 44 px og over.

### 3.7 Tellingen

Fire skjermer uten 3D (havn, sjø, skuffen Beholdning, telefonens hjem):

| | Telefon | Nettbrett | Kystlys' mål |
|---|---|---|---|
| Skriftstørrelser | 16 (8,5–46 px; 8 under 13 px) | 14 | høyst 10 |
| Tekstfarger | 16 | 18 | |
| Bakgrunner | 34 | 35 | høyst 25 |
| Radier | 15 | 17 | høyst 6 |
| Knappestiler | 18 | 17 | 3–4 |

Hele tellingen over alle flatene (`uiplay.py`, 3D) føres inn her når kjøringene er ferdige.

### 3.8 Første tur i stående nettbrett (uiplay med 3D)

Sett på bildene fra den avbrutte runden (`u20-brett-tur-plotter-tips-og-toast.jpg`, `u20-brett-tur-dekket.jpg`, `u20-brett-tur-levering-tre-stemmer.jpg`): plotteren i 800×1280 har rutepanelet som en kolonne til høyre, og kartet er 460 px bredt. På steget `fish` står tipset «Nå fisker juksa. Trykk «Lukk» …» over panelets tittel og toasten «Følg veiledningen først …» nederst samtidig, mens boksen er dimmet. På dekket (`lookDeck`) står boksen og kartet øverst til venstre uten å dekke båten, og tipset peker på pilla over knappene, som planen tar bort. Ved leveringen (`slip`) snakker tre stemmer samtidig: kaiarbeiderens snakkeboble i 3D («Velkommen! Vi biter ikke …», kuttet øverst), meldingen «✉ Astrid på mottaket i Botnhamn: Velkommen til oss …» som toast over boksen, og tipset «Her er prisen per kilo …» over sluttseddelen. Første tur gikk gjennom i stående nettbrett (steg 1–20), og skuffesidene og viftene så riktige ut i arket på 88 %; Mottak-vifta har fire på én rad på nettbrettet.

## 4. Funnene

| ID | Funn | Sett eller målt | Format | Planen |
|---|---|---|---|---|
| K1 | Seks knapper til sjøs brekker til to rader, Beholdning alene øverst; «Mer» står alltid til sjøs | målt (3.1), `tlf-01`, `u20-tlf-sjo-stille` | telefon | U2-2 og U2-3: Om bord, Auto-nav ut, Redskap som én knapp: høyst fem |
| K2 | Viftene Bygd (seks med Hvil) og Verft (fem) brekker til fire og én | målt, `tlf-10`, `tlf-11` | telefon | U2-3: høyst fire per rad, to og tre ved fem |
| K3 | En til tre av seks knapper til sjøs er grå uten grunn før trykket (Sett ut, Ta opp, Kast anker) | målt (3.1) | begge | U2-3: grunnen på knappen, det som aldri gjelder båten skjult |
| K4 | Boksen vokser 47 px mellom havn og underveis, og minikartet flytter seg like mye | målt (3.2), `brett-01` til `brett-04` | begge | U2-1: stripa med fast høyde, kartet i fast plass |
| K5 | Neste hendelse står i boksen og i pilla samtidig under juksing (24 av 24 prøver), og pilla sier aldri noe boksen ikke sier | målt (3.3) | begge | U2-1: pilla ut, dekkets tall på linje 3 |
| K6 | Tredje linje ville stått tom mens båten ligger stille uten noe på gang, og i havn i ro | målt (3.3) | begge | U2-1: i havn står stedet der; til sjøs er tomt greit (kap. 5) |
| K7 | Minimer-knappene er 32×30 px, målerknappen 31 px høy | målt (3.6) | telefon | U2-1: 44 px |
| K8 | Hjemskjermen har sju kort før appene; på nettbrett stående synes seks av 22 apper | målt (3.5), `u20-brett-telefon-hjem` | begge, verst nettbrett | U2-6: kortene på én rad, grupper |
| K9 | Rederi: flåten begynner 0,8 og 1,1 skjermer ned, bak regnskapet og to knapper | målt (3.5), `u20-tlf-rederi` | begge | U2-5: flåten først |
| K10 | Ansatte-siden åpner på 55 % med 4,6 skjermer innhold; den står ikke i `TALL` | målt (3.4), `u20-tlf-skuff-ansatte` | telefon | U2-7: ett ark for alle |
| K11 | Mannskap-siden: to like tunge knapper per person | sett, `tlf-12` | begge | U2-7 |
| K12 | Tips og toast står samtidig i plotteren på steget `fish`, tipset over panelets tittel | sett, `u20-brett-tur-plotter-tips-og-toast` | nettbrett stående | backloggen 10.1; U2-1 eller Ø7 |
| K13 | Veiledningen peker på det som flyttes: `#hud .st.nx` (seil, full, land, sluttseddel), `#dockInfo` (dekket), `#miniPlot` (tre steg) | lest, `ui/07b-first-trip.js` linje 83, 100, 109, 111, 113, 122, 127, 155 | begge | U2-1: linje 3 beholder klassen `st nx`, og dekk-steget peker dit; `tut.py` i begge formater |
| K14 | Tellingen er over Kystlys' mål på fire skjermer: 16 størrelser, 34 bakgrunner, 15 radier, 18 knappestiler | målt (3.7) | begge | U2-9 måler etter |
| K16 | Tre stemmer samtidig ved leveringen i første tur: snakkeboblen i 3D, meldingen som toast over boksen, tipset over sluttseddelen (Kystlys funn 5 står) | sett, `u20-brett-tur-levering-tre-stemmer` | nettbrett stående | backloggen 10.1; U2-1 eller Ø7 (én stemme om gangen) |
| K15 | `uishots` finner 0 i fem størrelser: det automatiske tilsynet ser ikke det strukturelle (brekking, grå, dobbelt opp), og grensa 32×30 er under 44 | målt | alle | `kartlegging.py` måler det; grensa i `uishots` kan heves til 44 for berøring (U2-9) |

## 5. Planens antakelser, prøvd

- **«Tredje linje står tom mye av tiden.»** Nei til sjøs: under juksing og seiling har den alltid noe (42 av 48 prøver), og pilla har ingenting å legge til utover dekkets tall. Tom bare mens båten ligger stille uten noe på gang, og i havn i ro. Forslag: i havn står stedet på linje 3 («Ved kaia · Finnsnes», «Ved naustet», «Rorbu · 400 kr natta»), slik pilla gjør i dag; til sjøs står den tom de få minuttene mellom to handlinger. «Regler ✓» hører ikke hjemme på linje 3 (den er alltid der), bare ! og ✕.
- **«Fem på raden holder i stående.»** Ja: fem står på én rad på telefonen i havn og underveis, seks brekker. Hovedknappen, tre kontekstuelle og Om bord er fem. Viftene må ha høyst fire per rad.
- **«Om bord-sammenslåingen gir for lang side.»** Nei: Mannskap blir en fane, og fanene er egne sider (Beholdning 2,0 skjermer, Mannskap 1,5 på telefonen, hver for seg). Fanelinja får fem faner og ruller som i dag.
- **«Hva bryter roen.»** Ikke målt; lest: `toast` (`ui/02-format-state.js`), tipsene (`ui/07-guide.js`, `07b`), fangstkortene (`CFEED`), søvnskjermen, Kystvakta, prai. Forslag: toast, tips, søvn og prai henter knappene tilbake; fangstkortene gjør det ikke (de er instrumenter).
- **«Veiledningen peker på plotterens Autonav, ikke linjas.»** Ja for Autonav (`#rAuto`). Men den peker på boksens neste-linje i fire steg, på pilla i ett og på minikartet i tre (K13). U2-1 må holde disse målene i live.

## 6. Det som gjenstår i U2-0

- Tellingen fra `uiplay.py` i 800×1280 (kjører på nytt med to timers grense) føres inn i 3.7; 390×844 etterpå om tida rekker. Første tur i stående nettbrett er sett (K12, K13, K16).
- «Full last» og «ved egen blåse» måles i U2-3 når linja bygges om, med `fiskeplay.py` som har oppsettet for blåsa.
