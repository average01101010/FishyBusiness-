# Forslagslista 04.10.2026

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.27 Forslagslista 04.10.2026 (natta til 05.10)

Jonas' liste: oppgraderinger, kvotehandel, kikkert, raskere fangst, fortøying, snurring ved siste veipunkt, stanga ut, drivstoffpriser, jukse-spill, nattmodus, salg for ekte penger, Blender-modeller, åpningstider, flytrafikk, ny haill og agn. Svarene hans: håndjuksa omtrent dobbelt så rask, luksushaill +200 % (kan justeres ned), motoroppgraderinger på verftet og speed-boost i en egen telefonapp for ekte penger.

- **Siste veipunkt:**
  - 3D-følgeren (`updateBoat`) holdt fart forbi sluttpunktet mens målet sto fast der i opptil ett spillminutt, og snudde rundt punktet. Nå trappes farten ned med avstanden når målet er neste stopp eller rutens slutt, og forbi punktet holdes kursen.
  - `sailV` bremser også inn mot rutens siste punkt.
  - `routetest` steger følgeren med 30 bilder i sekundet: før 360 graders sving, nå 0.
- **Piruett før et stopp** (Jonas 04.10.2026):
  - **Årsaken:** Simuleringen bremser inn mot neste stopp med ett minutts sprang, fra 23 til 8 kn. Punktet følgeren sikter på, saktnet da med én gang, mens følgeren bremset saktere. Den kom 58 m forbi punktet og snudde 360° for å nå det.
  - **Nå:** Ligger punktet bak følgeren langs sporet, holder den sporets kurs og senker farten til punktet er foran igjen. Bremsen regnes ut fra farten båten har.
  - `routetest` har fått et stopp i 23 kn, som gikk 360° før og 0° nå.
- **Juksa ×2 og jukse-spillet:** se «Redskapsstige» og «Jukse-spillet» over.
- **Nattmodus i kartplotteren:**
  - `S.settings.chartNight` er 'auto', 'day' eller 'night', valgt i kartets innstillinger. Auto er natt når sola står mer enn 4° under horisonten der båten er (`chartNight()` i `07-guide.js`).
  - Navigasjonskartet får da mørk sjø i blått og dempet land (`chartRaster`, `FAR`). Kyst, gradnett og bakgrunn bruker fiskekartets mørke stil, og SVG-laget får klassen `plot` (og `night`).
  - Miniplotteren følger med.
  - `tick()` tegner kartet på nytt når sola skifter det (`CHN`).
- **Kikkert i bro-visningen** (`cam.zoom` 1–8 i `view3d.js`):
  - To fingre fra hverandre zoomer (fov = 2·atan(tan(fov0/2)/z)). Dra-farten deles på z, og hjulet zoomer også.
  - Dobbelttrykk og `setHelm` går tilbake.
  - Knipingen endrer ikke lenger `cam.dist` i bro-visning (den endret terrengets rekkevidde i det skjulte).
  - Lyspunktene vokser med z (`uSize × ZF()`).
  - Detaljavstandene for NPC-sett, havneenheter og byggdetalj regnes som avstand/z, byggene med høyst 3×.
  - Kikkertrammen er `#binoc`, som viser «4×».
- **Øyet ved rattet** (Jonas' video 04.10.2026, skiff i 24 kn): Rekka og konsollen hoppet i snitt 3,7 px per bilde mot øyet, mens horisonten sto stille. Øyet ble plassert med glattet hiv og stamp (0,3 s), mens båten ble tegnet uten. Nå sitter øyet fast på skroget, og bare blikkretningen følger stamp og rull dempet (70 %, 0,3 s). Hiv flytter ikke horisonten. Rettingen er ikke målt i spillet ennå.
- **Fjernet 11.10.2026 (Jonas):** mottakene har ingen åpningstider. `mottakOpen` returnerer alltid sant, kortet «Åpningstider» i Salgslaget er borte, og planleggeren ser aldri et stengt mottak. Resten av dette punktet er historikk.
- **Åpningstider på mottakene** (`mottakOpen`, `mottakNext`, `mottakWhen` i `07-harbours.js`):
  - Mottakene publiserer ingen tider (søkt 04.10.2026: mottaket i Senjahopen oppgir telefon, og Råfisklaget lister mottakene uten tider). Derfor typiske tider: hverdager 06–18, lørdag 08–14, stengt søndag, og 05–22 hver dag i skreisesongen (januar–april).
  - Første tur venter aldri.
  - «Lever» viser når mottaket åpner. Knappen «Vent til åpning» er fjernet (Jonas 05.10.2026: alle spillerne går på samme klokke og dato, så ingenting kan spole tiden fram). Bare `catchUp` kjører simuleringen fram, til den felles klokka etter at spillet har vært lukket.
  - Driftsplanen venter ved kaia (`b.landWait`) og losser når mottaket åpner.
- **Drivstoffprisen** (`fuelPrice(H, pid, diesel)` i `02-species-gear.js`):
  - Grunnprisen × en ukeskurve (AR(1) over ukene som fiskeprisene, ±12 %, lik i alle havner) × havnefaktor (±4 % etter navnet).
  - Grunnprisen ble sjekket 04.10.2026: Preem oppga anleggsdiesel til 16,28 kr/l uten mva (29.08.2026), og fiskefartøy betaler verken mineraloljeavgift eller CO2-avgift (Skatteetaten). Derfor står 14,50 kr/l, og bensinen på 23,90.
  - Bunkringen fører det som faktisk er betalt (`f.paid`).
  - Vær-appen viser diesel denne og forrige uke.

- **Verftet og speed-boost (C1–C4):**
  - **Lasterom** (`HOLDUP`, `S.boat.holdLv`): tre trinn, ×1,25, ×1,6 og ×2,0 av typens lasterom. Isrommet vokser likt (`applyVessel`). Prisen er 4, 7 og 12 % av båtens pris, og jobben `hold` tar 8, 16 og 32 timer.
  - **Last og vekt** (`boatTons`, `boatTons0`, `loadF` i `03-simulation.js`): vekten er egenvekt + last + is + drivstoff + 90 kg per person, mot egenvekt + en fjerdedel av lasterommet + halv tank + én person. Toppfarten ganges med (D0/D)^0,22 for deplasementsbåter og ^0,5 for planende båter, mellom 0,55 og 1,08. Forbruket ganges med (D/D0)^(2/3).
    - Skiffen full: −10 %. Sjarken full: −8 %.
  - **Større motor** (`ENGUP`, `S.boat.engLv`, ikke påhengsmotor): +20 % og +40 % effekt. Prisen er 6 og 11 % av båtens pris, og jobben `eng` tar 12 og 24 timer.
    - Farten følger kvadratroten av effekten for planende båter og kubikkroten for deplasementsbåter, med høyst +12 % (skrogfarten).
    - `fuelK` × (1 + 0,4·(P−1)).
  - **Begroing** (`foulHour`, `S.boat.foul`): vokser hver time i sjøen, 0,012 per døgn i juni–september og 0,004 ellers, og ×0,3 med `EQUIP.antigro` (18 000 kr, 6 t). Full begroing gir −15 % fart og +25 % drivstoff. Jobben `hull` («Skrogrens på slipp», 1 500 kr + 400 kr per meter, 6 t) nullstiller den.
    - Ikke nøkkelen `clean`, som slettes ved oppstart.
  - **Trim-appen** (`BOOSTS`, `S.boat.trim` = {k, t0}, `trimOn`, `trimLeft`, bare diesel og ikke påhengsmotor). Fra 05.10.2026 er trim fart for en tid, kjøpt for ekte penger (Jonas: «Trim er tidsbegrenset oppgradering av farten»), og tida er spilltid:

    | Trim | Fart | Varer | Pris |
    |---|---|---|---|
    | Justert dieselpumpe | +50 % | 24 t | 29 kr |
    | Ladeluftkjøling | +75 % | 48 t | 39 kr |
    | Økt turbotrykk | +100 % | 72 t | 49 kr (Jonas 05.10.2026) |

    - Farten gjelder toppfart og marsjfart, og akselerasjonen øker like mye (`applyVessel`). Hestekreftene vises som før.
    - Én trim om gangen på en båt. En ny tar plassen til den som er på. Når tida er ute, går farten tilbake og loggen sier fra (`vesselStep`).
    - Dieselen følger farten (`fuelLph`), så mer fart bruker mer diesel. Det står i appen.
    - Den gamle trimmen var varig og gratis i testen. Den tas bort ved lasting (`11-boot.js`).
    - Kjøpet er i testmodus som haillen til butikken med Stripe er på plass.
  - **Ferdig nå på verftet** (`YARD_NOW_NOK` = 19 kr, Jonas 05.10.2026): alle verftsjobbene båten har gående (`YARD_KINDS`), gjøres ferdig med én gang. Knappen står over arbeidskøen i Verksted, i testmodus til butikken er på plass. «Overtid, halv tid» for spillpenger finnes fortsatt.
    - **Effektene er vårt forslag:** Jonas skrev at han hadde oppgitt dem, men de står ikke i meldingene hans.

- **Agn til line og teiner** (`BAITS` i `10-gear.js`):
  - Faktorene per art på line- og teinefangsten:

    | Agn | Pris | Faktorer |
    |---|---|---|
    | Makrell | 18 kr/kg (som før) | sei 1,4 · hyse, torsk og krabbe 1,0 · ellers 0,8 |
    | Krabbe | 10 kr/kg | 1,0 på alt |
    | Reke | 28 kr/kg | torsk 1,4 · hyse og sei 1,1 · ellers 0,8 |
    | Sei | 12 kr/kg | kveite 1,6 · krabbe 1,2 · ellers 0,7 |
    | Krill | 22 kr/kg | uer 1,8 · ellers 0,6 |

  - Prisene er spillverdier, og faktorene følger Jonas' beskrivelse.
  - **Beholdningen** er `pgear.bait`, gruppert etter slag (`baitOf`). Ei gammel lagring blir makrell, fordi teksten var «Sild og makrell».
  - **Agnet velges når det brukes** (20.10.2026, se 5.63): «Egn» og egnebua tar slaget spilleren velger (`egnSelf(lk, n, bait)`, `egnOrder(lk, n, bait)`), og teinene settes med et valgt slag. `pgear.baitPref` er bare det sist valgte, som brukes når ingen velger (mannskapets egen egning på sjøen og driftsplanen etter levering).
  - **Stampene husker agnet:** `lines[lk].bt` holder slag → stamper, og et lineset får `baitW`. Teineset får `bait`.
  - **Egen sei** kan tas fra lasten i havn før levering (`baitFromHold`), og den teller på kvoten (`quotaState().sei`). Kongekrabbe er for dyr til agn (`BAIT_OWN = ['sei']`). Agnslaget «Krabbe» er strandkrabbe som kjøpes.
    - **Antakelse, ikke bekreftet:** fangst til eget bruk skal føres på landingsseddelen etter landingsforskriften. Lovdata var sperret fra arbeidsmiljøet 04.10.2026, og søk ga ikke noe klart svar.
  - Makrell finnes ikke som art i spillet ennå, så den kan bare kjøpes.
- **Inn til kai og ut igjen** (`berthPath`, `berthBlocked`, `berthClear` i `07-harbours.js`):
  - Et punkt er sperret når det er land i 25 m-masken eller ligger innenfor halv bredde av en bryggeboks (`PIERBOX`) eller en havneenhets kaiblokk.
  - **Banen går** fra båten til et punkt 1,5 båtlengder akter for kaiplassen og en bredde ut fra kaia, og så langs kaia inn. Er det fritt, går den rett. Ellers søker den over maskens celler innenfor 1,5 km og strammer linja.
  - **3D:** under en rute er banen ut fra kaia og inn til kaia en del av linja båten følger (`trkStep`, se «3D-båten på ruta»). Uten rute følger `moorStep` banen, glattet med `pathM`/`pathAt`.
  - **Test:** `harbourtest` sjekker banen inn til hver kaiplass for tre båttyper, fra havnepunktet og fra innseilingen.
- **Fiskeslagene fra Blender** (`tools/fish/fisk.py`, `src/data/fish.b64`, 612 KB):
  - **Artene:** torsk, sei, hyse, lyr, lange, brosme, uer, kveite, blåkveite og kongekrabbe (delen heter fortsatt `krabbe`), hver som én del i GLB-en.
  - **Fiskene** er 1 m lange, med hodet mot −z, ryggen opp og høyre side mot +x. Spillet skalerer dem etter vekta. Krabben er 1 m over beina.
  - **Kjennetegnene** er tatt med slik de ses på dekk:
    - torsk: skjeggtråd, overkjeve over underkjeve, flekker og lys sidelinje
    - sei: underkjeven lengst, rett lys sidelinje, kløyvd stjert
    - hyse: svart sidelinje og svart flekk over brystfinnen, høy første ryggfinne
    - lyr: mørk sidelinje som buer høyt over brystfinnen
    - lange og brosme: lange kropper og lange finner. Brosmen har mørkt bånd og hvit kant på finnene.
    - uer: rød, med piggete ryggfinne og store øyne
    - kveite: flatfisk med begge øynene på høyre side, mørk oppe og hvit under
    - blåkveite (07.10.2026): flatfisk som kveita, men mørk grå-brun på begge sider, og det venstre øyet sitter på ryggkanten (`eye2`), fordi den svømmer mer opprett
  - **Kroppen** er ringer langs fisken med et smalt bånd for sidelinja. Finnene er tynne plater. Farger og flekker ligger i hjørnefargene.
  - **I spillet** erstatter de de prosedyrale fiskene (`FC`/`fishM`, som står igjen som reserve) gjennom `fishOf(sp)` i `view3d.js`:
    - i baljen på skiffen
    - på jukselina og i jukse-spillet (`hang`)
    - som lykkefisken i haillen
    - som torsken i hendene ved sløying
    - som fangst i blødekaret og på sløyebordet på dekkede båter (`drawDeck`, inntil 8 fisk etter artene i lasten)
  - Krabbene ligger flatt i baljen.
  - **Test:** `vesseltest` sjekker at alle ni delene finnes, at fiskene er 1 m fra snuten ved −z, at kveita er flat og at krabben er rundt 1 m bred.
- **Redningsskøyta som forløp** (`rescue`, `towStep`, `towPose`, `rescueBase` i `05-vessels.js`; `tools/boats/redning.py`, `src/data/boat-redning.b64`):
  - **Hvor den kommer fra:** nærmeste redningsstasjon (Finnsnes eller Gryllefjord). Er stasjonen mer enn 60 km unna, kommer den fra nærmeste havn.
  - **Forløpet** (`TOW`):
    1. Mannskapet mønstrer på 10 minutter.
    2. Skøyta går 25 knop langs leia.
    3. Slepet settes på 5 minutter.
    4. Den sleper deg i 6 knop til nærmeste verft (`nearestYard`; fra 08.10.2026, Jonas: skroget skal repareres etterpå, og et slep til et mottak lot en spiller i åpen båt bli stående uten hvile, #48). Finnes ikke noe verft, til nærmeste havn.
  - **Veiene** finnes med `leiaRoute` mens mannskapet mønstrer. Finnes ingen vei, går den rett. En båt på grunn dras først ut til nærmeste vann (`towSea`).
  - **Pris og fangst:** prisen trekkes ved anropet. Fangsten beholdes ved slep og går tapt ved nødanrop, som før.
  - **I spillet:** statusen viser hva som skjer: venter på redningsskøyta, den er på vei, slepet settes, eller under slep i 6 kn. «Spol fram til havn» er fjernet (05.10.2026, én klokke for alle), så slepet tar den tiden det tar. Redning-appen viser slepet i stedet for knappene.
  - **3D:** en generisk redningsskøyte på 16,5 m, uten merker fra Redningsselskapet:
    - oransje skrog, hvitt styrhus og svart fenderlist
    - mast med radar og blålys som blinker
    - lanterner som lyser om natta
    - slepetauet går fra slepekroken til baugen din
    - den høres som en stor båt
  - **Test:** `towtest.py` sjekker oppmønstringen, farten, at veiene aldri går over land, pris og fangst, båt på grunn, spoling og statusteksten.
- **Garn og line i 3D** (`drawSetting`, `haulFish` i `view3d.js`; `tools/gear/blaase.py`, `src/data/gear-marks.b64`):
  - **Setting:** redskapet går fra bingen eller balja over hekken og akterut i sjøen. Garnet har flottører og blytau, og lina har agnede kroker på tauemene. Dreggen går over først og synker. På skiffen går det over hekken på babord side av påhengsmotoren.
  - **Blåsestaken fra Blender** står i begge ender av hvert sett: oransje flottør, stang med blylodd under, svart flagg og radarreflektor. Dreggen har fire fliker.
  - **Trekking:** fisk kommer opp i maskene og på krokene, så mange som settet har igjen, med artene i forhold.
  - **Test:** ingen ny test, fordi det bare er tegning. Det er sjekket med skjermbilder.
- **Juksamaskinen i 3D** (`drawSkiff` i `view3d.js`; `tools/gear/juksamaskin.py`, `src/data/gear-jig.b64`, fra 13.10.2026, brukerens ønske: «Lag en bra blendermodell av juksamaskin»): delene `maskin` (klemme på rekka med svingbar stolpe, motorhus på langs, kontrollboks med grønn skjerm, tastatur og rød stoppknapp mot fiskeren, kabel, stålarm ut over siden og rød blokk), `spole` (åpen spole med sene, dreier om z) og `skive` (blokkskiva). Origo er rekkas topp ved klemma; `ex.tip` er der senen går ned fra blokka, `ex.lead` der den kommer inn fra spolen. Spolen rykker opp og ned mens maskinen jukser og spoler inn når det er fisk på, og skiva går med. Ingen merkevare (flere produsenter på bildene). På skiffen og trebåten (`hand`) står de der `drawSkiff` alltid har hatt dem. På alle andre båter utenom havflåten (Jonas 13.10.2026: «alle båter utenom havflåten skal ha anledning til å bruke juksamaskin») tegner `drawJigRail` inntil tre på styrbord rekke så lenge båten har maskiner, og de går (spole, sene, fisk) bare mens hun jukser. Plassene leses av båtens egen modell én gang per type (`jigRail`): ut fra midten av arbeidsdekket, unna haleren og endene, i hvert snitt toppen av det ytterste av siden mellom kne- og hoftehøyde over dekk. `JIG_Z` overstyrer der siden er dekket (breisjarken: akter for leskuret). Kystbåten 14,99 m får dem i åpningen i skjermen der mannskapet står. Plastsjarkens faste, tegnede maskiner (`partJukse`) er tatt bort fra modellen. `tests/jigshot.py` tar bildene og sjekker at hver båt får tre plasser.
- **Teinene i 3D** (`drawPots`, `drawCrabTank`, `potDeck` i `view3d.js`; `tools/gear/teine.py`, `src/data/gear-pot.b64`, fra 04.10.2026, brukerens ønske: «Lager du blender-modeller av teiner og kongekrabbe? Og animasjoner for haling av teiner»):
  - **Modellene fra Blender:**
    - kongekrabbeteina: stålramme 1,4 × 1,4 × 0,65 m, notlin, en trakt inn i hver av to motsatte sider, agnboks i midten og luke i toppen (`teinedor`, med hengsel)
    - teinehaleren på davitt: en stolpe ved rekka med en bøyd arm ut over siden og en blokk 2,1 m over dekk og 0,9 m utenfor stolpen, med hydraulisk V-skive som går rundt (`davitskive`)
    - krabbekaret: et blått kar på 1,2 × 0,8 × 0,7 m med sjøvann og slange fra dekkspumpa
    - Målene og fargene har jeg valgt selv. Det finnes ingen tegninger.
  - **Haling** (én teine i den tida arbeidet tar, `gopUnitMin`, så den målte tida mellom teinene; syklusen starter på nytt når simuleringen teller en teine):
    1. Teina kommer opp fra bunnen på tauet og ut av sjøen til blokka, med hanefoten fra hjørnene.
    2. Den svinges inn over rekka og settes på dekk ved haleren.
    3. Luka åpnes, og krabbene, så mange som settet har per teine, går én og én til krabbekaret (uten kar ned i lasten).
    4. Agnboksen fylles, luka lukkes, og teina løftes bort i stabelen akter.
  - **Setting:** teina tas fra toppen av stabelen, vippes ut over rekka og synker, og driver akterut mens båten går fram. Tauet følger med fra rekka.
  - **Uten teinehaler** (skiffen og små båter) går tauet over rekka, og den gamle trommelen står der som før.
  - **Små teiner** tegnes i 0,75 av størrelsen.
  - **Dekket:** når båten er rigget for teiner, er blødekaret og sløyebordet tatt bort, så sant det ikke er fisk som venter på sløying. Krabbekaret står på babord side med krabbene fra lasten i seg, og bare når båten er rigget for teiner (Jonas 21.10.2026: «Om båten ikke er rigget med teiner skal det ikke være noe krabbekar ombord»). Plassen er tvers over for haleren, men der et hus eller en kahytt står, flytter `tankAt` i `view3d.js` karet til nærmeste plass på dekkskartet (`deckMap`) der hele grunnflaten er dekk, på samme side. Før sto det gjennom kahytten på den nye hurtigsjarken, der haleren står under kahyttaket. Dekkskartet har bare det øverste gulvet i hver rute, så en rute med gulv 1,9 m eller mer over karet regnes som rom under et dekk (arbeidsdekket under overbygget på kystbåten 15 m). Karet står på den høyeste dekksflaten under seg (dekkets bue), med 5 cm slingringsmonn til rekka og veggene (før 15 cm: sjarkens kar gikk inn i rekka). Der dekket bare er tofter og kasser, står det på en lav, flat plattform (inntil 0,75 m over dekket), og der den åpne flekken er mindre enn karet (trebåtens brønn, 0,6 × 0,8 m), tegnes et mindre kar, ned til 70 % (femte tall i `tankAt`). Sjekket med `deckshot` og en sonde som ser etter deler av modellen inne i karet på alle ni kystbåtene som kan rigges for teiner.
  - **Test:** `geartest` tar bildet `gear3d.png` mens teinene settes. Ellers er det sjekket med skjermbilder.
- **Fly og helikopter** (`05c-air.js`; `tools/air/fly.py`, `src/data/air.b64`):
  - **Modellene** er generiske og uten flyselskap:
    - et regionalt propellfly: høyvinget, med T-hale, to motorer og firebladede propeller, 22 m langt og 26 m mellom vingetuppene, omtrent som Dash 8-100/200
    - et tomotors helikopter med fembladet rotor på 14 m
  - **Plassene:**
    - 37 flyplasser og 19 helikopterplasser (baser og sykehus) i en håndliste
    - koordinatene er skrevet fra hukommelsen og ligger innenfor noen hundre meter
  - **Rutene:**
    - 40 flyruter og 13 helikopterruter, et tenkt nett og ikke en ekte rutetabell
    - hver rute går 1–4 ganger om dagen hver vei, mellom kl. 06 og 22, litt ulikt fra dag til dag
  - **Flygingen:**
    - flyet stiger med 8 %, flyr 470 km/t i opptil 5 500 m høyde og kommer inn på 3 grader
    - helikopteret flyr 250 km/t i 250–500 m høyde
  - **I 3D** vises de innenfor 15 km:
    - propeller og rotorer går rundt
    - lanternene lyser om natta, og de røde antikollisjonslysene og de hvite strobene blinker hele døgnet
    - lyden er en dur som vokser og avtar, og helikopteret har rotorslag
  - **Test:** `airtest.py` sjekker rutetabellen, høydeprofilen, at ingen fly går om natta, at tabellen er lik hver gang, og målene på modellene.
