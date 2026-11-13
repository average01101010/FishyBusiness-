# Tilpasning av båtenes utseende (plan 12.11.2026)

Status: **plan, ingenting bygd. Valgene er tatt** (Jonas 12.11.2026): V1 A, TP1 over lanseringslinja rett etter porten; V2 A, blandet (spillkroner for farger, soner og fendere; 29 kr for design, navn og fløyte; noe kan fortjenes, TP7); V3 A, Kystfiskerpakken 249 kr minus det du eier; V4 B, tre skrifter og farge. Fasene TP1–TP8 er én økt hver, steg 108–115 i køen (TP1 over linja, de andre under).

## Hva Jonas ba om

Jonas 12.11.2026: «omfattende customization for båtenes utseende».

Det bygger videre på Malerverkstedet, som han bestilte 06.10.2026 (`docs/engasjement.md`, arbeidslista punkt 2): skrogfarge for spillpenger, første fargevalg gratis, og for ekte penger malingsdesign, flagg, rederilogo og registreringsmerke, «varig og synlig for andre spillere i den felles verdenen og i sidebildet i Båthandel».

Det han har sagt før, som planen må holde:

- **Navnet** (04.11.2026): «Det som er mest vanlig er at navnet på båten skrives i blokkbokstaver på kanten av styrhustaket foran, men også på hekken», og «teksten er enten svart eller hvit alt ettersom hvilken farge som får høyest kontrast mot fargen der den plasseres».
- **Vimplene** (09.11.2026): «fjerne vimplene fra båtene. Jeg liker de ikke. Flaggene beholdes.»
- **Fenderne** (10.11.2026): «Fjern pyntefenderne fra båt-modellen». Fenderne er én felles modell som mannskapet henger ut ved kai.
- **Ønskenummeret** (07.11.2026): «om du betaler penger for registreringsnummeret så skal du få ha hva du vil, det er jo egentlig bare kosmetisk.»
- **Logoen** (07.10.2026): «spillere kan laste opp hva de vil, men la meg eventuelt kunne fjerne det i admin-dashboard om det er støtende».
- **Sponset design når avtalen slutter** (12.11.2026): «Fargene blir».
- **Penger** (12.11.2026, om de tre testene for kjøp): «Jeg må være åpen for å kunne skape fleksible og kapitalistiske løsninger.»

## Reglene planen holder

- **Bare utseende.** Ingenting her endrer fart, fangst, stabilitet, hørevidde, synlighet i AIS eller radar, eller noe annet i simuleringen (tabellen under).
- **Varig og synlig for andre.** Alt som selges, skal de andre spillerne se (eller høre) i den felles verdenen. Det som ikke synes for andre, selges ikke.
- **Prøv før du kjøper.** Alt vises på egen båt før betalingen (`PAINTPRE`), som i dag.
- **Ekte penger:** pris i kroner med 💎, kjent innhold, ingen nedtelling, ingen tilfeldig utfall, gjester kan ikke kjøpe. Alt som rører butikken, går som PR til Jonas.
- **Båtmodellene:** bare utsiden, ingen innredning, ingen animasjoner i båthandelen, ingenting kjøpbart modellert inn i båtene.
- **Ingen kode velger etter båttypens navn.** Hva en båt kan ha, avgjøres av modellen (malesonene, `topsides`, ankrene), som `designFits` gjør i dag.
- **Grafikken er nesten det viktigste:** ingenting av dette får senke kvaliteten, og det som tegnes for mange båter, har tak og deler buffere.
- **Handelssteder:** alt kjøpes i Malerverkstedet på verftet, og pakken også i Kaiboden.

## Hva som finnes i dag

### Malerverkstedet (`ui/10j-paint.js`, `PAINT`)

- Egen knapp i Verft-vifta. Kameraet går rundt egen båt (`G3.paintView`), og det du trykker på, vises med en gang (`PAINTPRE`, `hullLiv`). `PAINT.page` tegner sida, `PAINT.act` tar trykkene, `apply` legger malingen på båten.
- **For spillkroner:** 16 skrogfarger og «Original» i `HULLPAL` (`vessel3d.js`), og «Kystfisker», som fortjenes i kapittel 3 av «Første uke på sjøen». Overbygg (malesone 3) og dekk (sone 4) der modellen har dem (`ZONES`, `glbZones`). Pris: 1 % av båtprisen, minst 1 500 kr (`PAINT.price`); første skrogfarge på hver båt er gratis.
- **For ekte penger** (`DESIGNS`, `COS`, `COSOWN`): ripestripe, totone, vannlinjestripe, stripefarge og nylakkert (29 kr hver), flagg i alle 50 nasjoner og tre former (19 kr), ønskenummer (29 kr), rederilogo laget eller lastet opp (49 kr). Prisene står i `supabase/migrations/20261007100000_designs.sql` og `20261007110000_logos.sql`. Til sammen 242 kr.
- **Sponsede design** (steg 44): gratis, merket «Samarbeid», `b.liv.sp` over egen maling (`spCard`, `core/09l-sponsor.js`).
- **I 3D:** detaljerte modeller males i sone 1, 3 og 4 (`glbPaint`); designene skjæres inn i skrogets trekanter langs skutesidens profil (`glbDesign`, `designLines`, `topsides`); byggesettbåtene får `col` (`kitLiv`). Navnet (`namePlaces`, `nameCanvas`, `nameTex`, `drawNames`), merket (`markStrips`), kallesignalet (`callStrips`) og logoen (`logoStrips`, `drawLogo`) er teksturer på striper langs skroget. Flagget er et bilde (`flagCanvas`) på én blafrende duk (`FLAGM`, 22 × 16 ruter, 0,6 × 0,44 m, `view3d/13-instruments.js`), tegnet i `view3d/24-cinema.js` når `flagUp` sier at det er oppe.

### Det de andre ser

- Malingen går som en kort kode (`livStr`, for eksempel `h:kobolt;r:hvit;f:SE.vimpel;m:T.112.LK;l:g.anker.JH.marine.hvit`) med `pos_put` hvert 15. sekund og kommer tilbake med `pos_world` for båtene innen 25 km. `livParse` gjør den om til maling, og `npcModel` bygger modellen. Reléet (`tools/server/rt/server.mjs`) sender bare sted, kurs, fart og tilstand (18 byte opp, 20 ned) og ingen maling.
- `pos_put` (`supabase/migrations/20261105140000_liv_owned.sql`) kutter koden ved **160 tegn** og stryker de betalte delene kontoen ikke eier (`r t v s g f l` mot `entitlements`).
- Navnet, merket og logoen tegnes på de seks nærmeste spillerbåtene innen 250 m (`drawNPCNames`). Hjemhavna står bare på egen båts og lokalflåtens hekk, fordi den ikke følger med posisjonen.

### Det som ikke henger med i dag

1. **Andre spilleres flagg tegnes ikke** (`docs/systemer/baater.md` 4.23). Flagget selges for 19 kr og rederiflagget følger logoen (49 kr), men bare eieren ser dem. Det bryter «varig og synlig for andre».
2. **Bufferne for de andre spillernes båter** er nøklet på hele malingskoden (`npcKB` og `npcMesh` i `view3d/20-trawl-seine.js`, `npcModel` i `vessel3d.js`), også registreringsmerket (`m:`) og logoen (`l:`), som er ulike for hver spiller. Slik koden leses, får derfor hver spillerbåt egne buffere selv med samme maling, og `NKB`, `NKM` og `NPCMOD` slipper aldri noe. Det er ikke målt (TP1 måler før det rettes).
3. **Koden er nesten full.** Den lengste koden spillet kan lage i dag er 151 tegn (sju farger, lakk, rederiflagg, merke og laget logo). Et sponset design (`x:<id>`) eller noe nytt får ikke plass innenfor 160.
4. **Tutingen fra en annen båt spilles med tonen til din egen båt** (`SND.horn` i `ui/10e-sound.js` bruker `BOAT.len`, kalt fra `ui/10n-hail.js`).
5. **Sidebildet i Båthandel** er et fast WebP fra Blender (`vesselSVG`, `glbData('pic', type)`) og viser ikke malingen.

### Lyden, fenderne, butikken og delingen

- **Hornet:** `blast`, `blasts` og `hornHz` i `ui/10e-sound.js`. Tonen følger lengden etter sjøveisreglene vedlegg III 1 b (420 Hz under 20 m, 300 Hz til 75 m, 190 til 200 m, 110 over, med en ters over). «Tut» til en spiller innen 1 nm går gjennom `hail_send` og `hails_get` (`ui/10n-hail.js`, `20261009240000_hails.sql`).
- **Fenderne:** én felles modell (`tools/deck/anker.py` `fender`), hengt ut av mannskapet på egen båt ved kai (`view3d/15-env-mooring.js`, OB2). Andre spilleres båter har ingen fendere.
- **Butikken:** `payBuy`, `shopWhat`, `SHOP_PRODUCT` og `realKr` i `ui/10i-shop.js`; produktene i tabellen `products`, prisen fra `shop_quote`, eierskapet i `entitlements` (`shop_paid` legger inn, `shop_refund` tar bort), og `srvApply` skriver `S.cos` over med serverens svar (HS4). Kaiboden ligger i `ui/phone/00-shell.js` og `01-haill-fiske-service.js`.
- **Bilde og deling:** `SNAP` og `snapTake` i `view3d/24-cinema.js` tar et bilde av det som nettopp ble tegnet (tilbakemeldingene); `ukeShare` i `ui/05i-ukas.js` deler et bilde med `navigator.share` eller laster det ned.
- **Testene i dag:** `maletest`, `regnrtest`, `sponsor2test`, `fasittest` (dekker `10j-paint.js`), `vessel3d`, `regmarktest`, `lanterntest`, `cloudtest`, `sqltest`, `hailtest`, `soundtest`, `kjoptest`, `moortest`, `benchshot` (målesida `#bench`, `G3.bench`), og i Node `tests/unit/vessel3d.test.mjs`, `navn.test.mjs`, `regmerke.test.mjs`, `sponsor.test.mjs`, `sjovei.test.mjs`, `merker.test.mjs`.

## Kosmetikk eller spillfordel

| Det som tilpasses | Kunne det gi en fordel? | Slik holdes det rent |
|---|---|---|
| Farger, design, lakk, bunnstoff | Bunnstoff gir mindre begroing i virkeligheten | Bare fargen; begroing, skrogrens og fart regnes som før |
| Navnets skrift og farge | En navnefarge som ikke kan leses, skjuler båten | Fargen må ha kontrast minst 3:1 mot malingen under, ellers velges svart eller hvit som i dag |
| Registreringsmerke og kallesignal | – | Tilpasses ikke ut over ønskenummeret: hvitt på mørkt og svart på lyst etter § 23 som i dag |
| Skipsfløyta | En kraftigere fløyte ville høres lenger | Hørevidden og styrken følger lengden som før (vedlegg III 1 c); bare klangen og tonen innenfor lovens bånd velges |
| Flagg og logo | – | Ingen virkning |
| Fendere | Fendere tar av for støt ved kai | Fargen bare; tallene for støt ved kai er de samme |

## Prisene

Startverdier, justeres i spilltesting. Ekte penger står med 💎 i spillet.

| Hva | I dag | Forslag |
|---|---|---|
| Skrogfarge, overbygg, dekk | spillkroner: 1 % av båtprisen, minst 1 500 kr; første skrogfarge gratis | som i dag |
| Malingsdesign (5) | 29 kr hver | som i dag |
| **Nye malingsdesign (4, TP3)** | – | 29 kr hver |
| Flagg, alle nasjoner og former | 19 kr | som i dag |
| Ønskenummer | 29 kr | som i dag |
| Rederilogo | 49 kr | som i dag; plassen velges gratis av den som har logoen (TP3) |
| **Navnet: skrift og farge (TP2)** | – | 29 kr for alle skrifter og farger |
| **Skipsfløyta: alle fløytene (TP4)** | – | 29 kr |
| **Fenderfarge (TP5)** | – | spillkroner: 400 kr per båt |
| **Bunnstoff (TP5)** | – | spillkroner: som skrogfargen |
| **Kystfiskerpakken (TP8)** | – | 249 kr (V3) |
| Alt for ekte penger til sammen | 242 kr | 416 kr |

## Fasene

Rekkefølgen: TP1 står alene. TP2 gjør plass i koden og på serveren, så TP3 og TP4 bygger på den. TP8 kommer sist fordi pakken samler alt. Fasene som rører `ui/10i-shop.js`, `supabase/migrations/` og Kaiboden, venter til økta som eier dem nå (steg 106 HO3) er levert. Fasene står i køen som steg 108 (TP1) til 115 (TP8). TP1 står over lanseringslinja, rett etter porten (Jonas 12.11.2026, V1 A); TP2–TP8 står under linja i rekkefølge. TP1 venter til steg 36 (Ø15 N7, NPC-skipene) er levert, fordi den økta eier `vessel3d.js` og `view3d/20-trawl-seine.js` nå.

Felles for alle: `node --check` og bygg, `python3 tests/run.py changed`, `node tests/unit/run.mjs` når `vessel3d.js` eller `core/` er endret, ny sjekk sett rød før rettingen, `/kontroll` før `/lever`, patchnote som sier hva det gjør i spillet (aldri pris, 💎 eller butikk), og 4.23 i `docs/systemer/baater.md` oppdatert samme dag.

### TP1 Det som alt er solgt, synes for andre (flagget og bufferne)

- **Bygger:** flagget i akterenden på de andre spillernes båter, også rederiflagget (`f:LOGO.<form>` med logoen fra koden hennes, eller bildet fra `peerLogo` når den er lastet opp), på de seks nærmeste innen 250 m som navnene, etter flaggtidene på hennes posisjon (`flagUp`). En spillerbåt uten kjøpt flagg fører Norge i rektangel, som egen båt. Teksturene i en liten pool etter flagg og form (som logoene, høyst 8). Duken regnes én gang per bilde for hver flagg, med vinden mot hennes kurs.
- **Bufferne:** modellene for spillerbåtene nøkles bare på den delen av koden som endrer malingen (`h o d r t v s g x`), ikke på merket, logoen eller flagget; og det er et tak på hvor mange malte spillerbåtmodeller som holdes (de eldste slippes med `gl.deleteBuffer`). Tellere i `G3._debug`.
- **Filer:** `view3d/13-instruments.js` (flaggpoolen, `drawPeerFlags`), `view3d/24-cinema.js`, `view3d/20-trawl-seine.js` (`npcKB`, `npcMesh`), `vessel3d.js` (`npcModel`, en ny ren `livPaint(s)`), `view3d/25-controls.js` (`#bench` med malte spillerbåter).
- **Tester:** `tests/unit/vessel3d.test.mjs` (`livPaint`: merke, logo og flagg gir samme nøkkel, et sponset design gir ny), `maletest` (en stand-in-spiller med `f:SE.vimpel` får flagget tegnet, telt i `G3._debug`), `benchshot`, `f1test` og `dbg23o` (dekker `20-trawl-seine.js`, `13-instruments.js`). De andre testene for de samme filene (`wetshot`, `kinotest`, `tral3d`, `seabedtest` og flere) kan ikke feile av flagg på andre båter og kjøres ikke; commiten sier det. Stikkprøve på flaggtidene for de andre: Kristiansand, Ålesund og Hammerfest i januar (nord for 65° N er flagget oppe kl. 10–15).
- **Måles:** i `#bench` med 20 spillerbåter rundt egen båt, alle med ulik maling og ulikt merke, før og etter: antall buffere, MB lastet opp til GPU-en og bildetid. SwiftShader er bare en sjekk; tallene som teller, tar Jonas på Pad 3 (`docs/spill-dette/`).
- **Skjermbilder:** 3D med to spillerbåter med flagg, 800×1280 og 1280×800.
- **Ekte penger:** nei.
- **Ferdig når:** (1) en annen spillers kjøpte flagg og rederiflagg vises på båten hennes innen 250 m, og en uten kjøp fører Norge i rektangel; (2) to spillerbåter med lik maling og ulikt merke deler buffere, og antallet malte modeller har et tak; (3) målingen før og etter står i 4.23 med tallene; (4) `maletest` og enhetstestene er grønne, og den nye sjekken er sett rød.

### TP2 Navnet på skroget: skrift og farge, og hjemhavna for andre (med plass i koden)

- **Bygger:** valg av skrift for navnet (V4): blokk (dagens Archivo), smal blokk (Archivo smalere med `fontStretch`, som `nameCanvas` alt bruker) og antikva (Source Serif 4, spillets serif-skrift, som alt ligger i sida). Ingen ny skrift legges i sida. Farge: automatisk svart eller hvit (som i dag), hvit, svart, gull eller en farge fra paletten; en farge med kontrast under 3:1 mot malingen under faller tilbake til automatisk. Gjelder styrhuset og hekken. Merket og kallesignalet endres ikke. Hjemhavna på hekken også for de andre spillerne (gratis), som en kort kode for havna.
- **Plass i koden (serveren):** `pos_put` tar 320 tegn i stedet for 160, og de betalte delene sjekkes mot en tabell (`liv_paid`: bokstav og produkt), så et nytt betalt felt bare er en rad. Nye bokstaver i koden (ikke `p`, som var vimplene).
- **Filer:** `view3d/13-instruments.js` (`nameCanvas`, `nameTex`, `drawNPCNames`), `vessel3d.js` (`livStr`, `livParse`, fargen ved `placeRGB`), `ui/10j-paint.js` (kortet), `ui/10i-shop.js` (`SHOP_PRODUCT`), en ny migrering (320 tegn, `liv_paid`, produktet `des_navn`).
- **Tester:** `tests/unit/navn.test.mjs` (kontrastregelen, fallet tilbake, hjemhavna under navnet), `maletest`, `cloudtest` (koden opp og ned, en server uten den nye `pos_put` gir ingen avbrudd), `sqltest` (320 tegn, filteret for den nye bokstaven), `kjoptest` (produktet). De andre testene for `10i-shop.js` (`boostklokke`, `skiptest`, `guesttest`) kan ikke feile av en ny rad i en tabell og kjøres ikke. Stikkprøve på hjemhavna for andre: Kristiansand, Kristiansund og Båtsfjord (lange navn og Å).
- **Måles:** tida det tar å tegne et navn første gang i hver skrift, og at antallet navneteksturer holder seg innenfor lageret på 28 (`nameTex`) med seks andre båter i nærheten.
- **Skjermbilder:** navnekortet i Malerverkstedet, 800×1280 og 1280×800, og 3D av de tre skriftene på tre båttyper.
- **Ekte penger:** ja (`des_navn`, `10i-shop.js`): PR til Jonas. Migreringen kjøres av Jonas på testprosjektet før pushen (`docs/spill-dette/`).
- **Ferdig når:** (1) navnet kan få tre skrifter og fem slags farge, prøves før kjøpet og synes på de andre spillernes skjermer; (2) en farge som ikke kan leses, blir aldri brukt; (3) andre ser hjemhavna under navnet på hekken; (4) en kode på over 160 tegn kommer fram til de andre, og en ikke eid betalt del blir strøket av serveren.

### TP3 Nye malingsdesign og rederilogoens plass

- **Bygger:** fire nye design, hvert prøvd og kjøpt som i dag: **dobbel ripestripe** (to smale striper under ripa), **baugsveip** (en bred stripe som går skrått ned akterover i forskipet), **hekkfarge** (akterspeilet i egen farge) og **bred stripe** (et bånd midt på skutesiden). `glbDesign` lærer å skjære langs et plan på tvers også, så baugsveipen får skarp akterkant. `designFits` sier hvilke modeller som kan ha hvert (byggesettbåtene bare det `col` har).
- **Logoens plass:** den som har logoen, velger midtskips (i dag), styrhussidene eller baugen, gratis. Søket bruker `stripBare` og `stripPaint` for alle typer, og det lukker backlogpunktet «Rederilogoen på flere båter står over noe som stikker ut, eller på to farger».
- **Sponsede design** kan bruke de nye designene (nøklene i `sp_paint`).
- **Målingen av salget:** hendelsen `pnt_try` (hvilket design som ble prøvd, ingenting om spilleren), så admin kan se prøvd mot kjøpt per design.
- **Filer:** `vessel3d.js` (`DESIGNS`, `designLines`, `glbDesign`, `designFits`, `kitLiv`, `livGeo`, `logoStrips`), `ui/10j-paint.js`, `ui/10i-shop.js`, `view3d/13-instruments.js` (logoen etter plass), `view3d/19-wildlife-npc.js` (`pvm` bygger på nytt ved ny form), `core/09l-sponsor.js` (`spPaintLiv`), en ny migrering (fire `des_*`, rader i `liv_paid`, nøklene i `sp_paint`).
- **Tester:** `tests/unit/vessel3d.test.mjs` (hvert design på hver type: samme flateareal innen 0,1 %, bare sone 1 farges, logoplassene på bar og jevn maling og ikke over navn, merke eller kallesignal), `maletest`, `sponsor2test`, `sqltest`, `kjoptest`.
- **Måles:** tida `glbDesign` bruker med alle designene på, for hver type på `lod0` og `lodm` (verst er ringnotbåten), med CPU-en strupet fire ganger, og hvor mange trekanter som kommer til. Det skjer bare når et design endres, aldri per bilde.
- **Skjermbilder:** designkortene, 800×1280 og 1280×800; 3D av hvert design på skiffen, havsjarken, kyst15 og ringnotbåten.
- **Ekte penger:** ja (fire nye produkter): PR til Jonas. Migreringen på testprosjektet først.
- **Ferdig når:** (1) de fire designene kan prøves, kjøpes og ses av andre på alle typene `designFits` godtar; (2) logoen kan stå på tre plasser og står aldri over noe som stikker ut eller på to farger; (3) tida per type er målt og står i 4.23; (4) et sponset design kan bruke de nye designene.

### TP4 Skipsfløyta

- **Bygger:** valg av fløyte: klang (én tone, totone som i dag, tretone) og leie (lav, middels som i dag, høy). Grunntonen holdes alltid innenfor båndet for lengden i sjøveisreglene vedlegg III 1 b (250–700 Hz under 75 m, 130–350 Hz til 200 m, 70–200 Hz fra 200 m), og tonene som bærer lyden, ligger der 1 a sier hørbarheten avgjøres (180–2100 Hz under 20 m, 180–700 Hz fra 20 m). Lest på Lovdata 12.11.2026. Hørevidden og styrken er som før. Fløyta brukes i tutingen (hos begge) og i egen båts signaler (regel 34 og 35). En annen båts tut spilles med hennes lengde og hennes fløyte, ikke din (retter punkt 4 over). Knappen «Prøv» i kortet spiller den én gang.
- **Filer:** `core/05e-sjovei.js` (en ren `whistleHz(L, leie)` med båndet), `ui/10e-sound.js` (`blast` med klang, `horn` med lengde og fløyte), `ui/10n-hail.js` (avsenderens fløyte fra koden hennes i `peerStates`), `vessel3d.js` (`livStr`, `livParse`), `ui/10j-paint.js`, `ui/10i-shop.js`, en ny migrering (`des_floyte`, rad i `liv_paid`).
- **Tester:** `tests/unit/sjovei.test.mjs` (grunntonen og tonene som bærer lyden, innenfor vedlegg III for alle lengder og leier), `soundtest`, `hailtest` (en tut fra en lang båt spilles med hennes tone), `maletest`, `sqltest`, `kjoptest`.
- **Måles:** ingenting tungt. Jonas hører på fløytene på nettbrettet (`docs/spill-dette/`).
- **Skjermbilder:** fløytekortet, 800×1280 og 1280×800.
- **Ekte penger:** ja: PR til Jonas.
- **Ferdig når:** (1) ni fløyter kan prøves og kjøpes som ett kjøp, og totone middels er gratis som i dag; (2) enhetstesten viser at ingen kombinasjon går utenfor vedlegg III; (3) den du tuter på, hører din fløyte med din lengde; (4) egne manøver- og tåkesignaler bruker den samme fløyta.

### TP5 Fendere og bunnstoff (spillkroner)

- **Bygger:** fenderfarge (hvit, blå, rød, oransje, sort, gul) per båt, på den felles fendermodellen; de andre ser fenderne på spillerbåter som ligger ved kai innen 150 m (de seks nærmeste), i fargen deres. Bunnstoff (ny malesone 5) i rød, sort, blå eller grå på modellene som har sonen; bare fargen. Valgt uten å spørre: sone 5 legges inn i hver modell når den uansett eksporteres på nytt (materialet `antifouling` eller `bottom` i båtskriptet får `zone=5`); skiffen eksporteres her som første, om ingen annen økt eier den. Kan snus til en egen fase som eksporterer alle modellene.
- **Filer:** `view3d/15-env-mooring.js` (fenderne, også på andre), `vessel3d.js` (`glbPaint` med sone 5, `livStr`, `livParse`), `ui/10j-paint.js` (`ZONES` og fenderkortet), `tools/boats/skiff59.py` og `src/data/boat-skiff59*.b64` (via `/blender`).
- **Tester:** `moortest` (fenderne ute ved kai, også på en stand-in-spiller), `maletest`, `tests/unit/vessel3d.test.mjs` (sone 5 males bare der den finnes), `vessel3d` og `vesseltest` for skiffen etter eksporten.
- **Måles:** tegnekallene og bildetida med seks spillerbåter med fendere ved kai, i `#bench`.
- **Skjermbilder:** kortene, 800×1280 og 1280×800; 3D av fendere på egen og en annen båt.
- **Ekte penger:** nei.
- **Ferdig når:** (1) fenderfargen velges for spillkroner og ses på egen og andres båter ved kai; (2) bunnstoffet kan males på skiffen og vises ikke på typer uten sone 5; (3) ingenting i begroing, fart eller støt ved kai er endret (de testene som dekker dem, er grønne uten å være endret).

### TP6 Før og etter, og del bildet

- **Bygger:** en knapp «Nå» i Malerverkstedet som viser båten slik hun er mens du holder den. «Del bildet»: et bilde fra kameraet rundt båten (`SNAP`) med båtens navn og detstorebla.no, delt som `ukeShare` gjør (deling eller nedlasting). Ingen pris, ingen haill; et sponsormerke bare når spilleren selv har designet på. Om målingen tillater det: egne båter i Flåten med sin egen maling i stedet for det faste sidebildet (punkt 5 over), tegnet når sida åpnes og ikke lagret.
- **Filer:** `ui/10j-paint.js`, `view3d/24-cinema.js` (`snapTake` beskåret til båten), `view3d/25-controls.js` (kameraet til bildet), `ui/05i-ukas.js` (delingen som felles hjelper), `ui/phone/10-fartoy.js` (bildene i Flåten).
- **Tester:** `maletest`, `uketest` (delingen er flyttet), `vesseltest` og `fleet3test` (Flåten).
- **Måles:** tida for bildet, og tida for å tegne en egen båt til Flåten på Pad 3. Over 100 ms per båt: Flåten beholder sidebildet, og fasen sier det.
- **Skjermbilder:** Malerverkstedet med knappene og det delte bildet, 800×1280 og 1280×800.
- **Ekte penger:** nei.
- **Ferdig når:** (1) «Nå» viser dagens maling og slipper tilbake til det som prøves; (2) bildet kan deles på Android og lastes ned ellers; (3) målingen for Flåten er gjort, og bildene er der eller ikke etter grensen.

### TP7 Det som kan fortjenes (V2 A)

- **Bygger:** to av de nye designene og tretone-fløyta kan fortjenes gjennom de langsiktige merkene og sesongene (merket for året kan tas igjen neste år, så det er ingen FOMO), og kan fortsatt kjøpes. Kortet sier begge veiene: «Fortjenes med …, eller kjøp nå». Det fortjente gis på serveren én gang, som haillen fra kapittel 2 (`achHaillAsk`), som en rad i `entitlements` med egen kilde, så `srvApply` ikke stryker det og `pos_put` lar de andre se det.
- **Filer:** `core/09f-merker.js`, `ui/10i-shop.js` (`srvApply`), `ui/10j-paint.js`, en ny migrering (gaven for merket, én per merke og konto).
- **Tester:** `tests/unit/merker.test.mjs`, `merketest`, `kjoptest`, `fasittest` (`srvApply`), `sqltest`, `maletest`.
- **Måles:** i admin: hvor mange når merkene, og hvor mange kjøper designet før de har fortjent det.
- **Skjermbilder:** kortene med begge veiene, 800×1280 og 1280×800.
- **Ekte penger:** ja (`10i-shop.js`, `entitlements`): PR til Jonas.
- **Ferdig når:** (1) merket gir designet på alle spillerens båter og for de andre; (2) en lagring som skrives om for hånd, gir ingenting; (3) kortet viser både merket og prisen.

### TP8 Kystfiskerpakken

- **Bygger:** ett kjøp (V3): alt Malerverkstedet selger for ekte penger når pakken kjøpes, med innholdet listet på kortet. Prisen regnes av serveren (`shop_quote`) og er 249 kr minus det kontoen alt har betalt for ting i pakken, aldri mer enn resten koster hver for seg; ingen betaler to ganger for det samme. `shop_paid` legger inn hver ting i `entitlements`, og `shop_refund` tar dem bort. Egen fane i Kaiboden og et kort øverst i Malerverkstedet. Ting som kommer senere, er ikke med, og kortet sier det. `docs/engasjement.md` punkt 8 rettes (ingen vimpel; navnet på kildesiden bare om V3 er B).
- **Filer:** en ny migrering (produktet, `shop_quote`, `shop_paid`, `shop_refund`), `ui/10i-shop.js`, `ui/phone/00-shell.js` og `01-haill-fiske-service.js` (Kaiboden), `ui/10j-paint.js`.
- **Tester:** `sqltest` (prisen med og uten ting fra før, kjøpet og refusjonen), `kjoptest`, `hailltest` (Kaiboden får en fane til), `guesttest` (gjester kan ikke kjøpe), `maletest`.
- **Måles:** kjøp per produkt i `purchases` før og etter, og andelen pakker mot enkeltkjøp.
- **Skjermbilder:** fanen i Kaiboden og kortet i Malerverkstedet, 800×1280 og 1280×800.
- **Ekte penger:** ja: PR til Jonas, merkelappen `jonas-har-sett` før slippet.
- **Ferdig når:** (1) pakken kan kjøpes for 249 kr av en ny konto og gir alt som står på kortet, også for de andre; (2) en konto som eier deler fra før, får lavere pris og aldri høyere enn resten enkeltvis; (3) refusjonen tar alt i pakken bort; (4) `engasjement.md` punkt 8 stemmer med det som er bygd.

## Valgene

**Svarene (Jonas 12.11.2026):** V1 A · V2 A · V3 A · V4 B, alle de anbefalte. Alternativene står under for historikken; fasene over følger svarene.

- **V1 Flagget som er solgt, men ikke synes (TP1).**
  - **A (anbefalt):** TP1 flyttes over lanseringslinja, rett etter porten.
  - **B:** TP1 står etter linja som resten, og flaggkortet sier til da at andre ikke ser flagget ennå.
  - **C:** Flagget tas ut av salg til TP1 er ute.
  - Anbefalt A fordi flagget og rederiflagget alt selges for ekte penger og regelen sier at kosmetikk skal være synlig for andre, og TP1 er liten og rører ikke butikken.

- **V2 Hva som er ekte penger, og hva som kan fortjenes.**
  - **A (anbefalt):** farger, soner og fendere for spillkroner; nye design, navnet og fløyta for ekte penger (29 kr hver); noen av dem kan også fortjenes gjennom merkene og sesongene (TP7).
  - **B:** alt nytt bare for ekte penger, som designene i dag (TP7 utgår).
  - **C:** alt nytt også for spillkroner, til en høy pris.
  - Anbefalt A fordi salget beholdes, mens «alt kan nås uten å betale» holder for en del av det, med tid og dyktighet som ekte vei.

- **V3 Kystfiskerpakken.**
  - **A (anbefalt):** 249 kr for alt Malerverkstedet selger for ekte penger når du kjøper (416 kr enkeltvis med de nye tingene), minus det du alt har betalt for; ingen vimpel og ikke navnet på kildesiden.
  - **B:** 199 kr som i `engasjement.md`, bare det som finnes i dag (242 kr enkeltvis), og navnet ditt på kildesiden om du vil (`src/legal/kilder.html`, egen PR, og personvernsida må si det).
  - **C:** ingen pakke, bare enkeltkjøp.
  - Anbefalt A fordi pakken da er verdt mer enn summen av småkjøpene for den som heller betaler én gang, og ingen betaler to ganger for det samme.

- **V4 Navnets skrift (TP2).**
  - **A:** bare fargen kan velges; skriften er blokkbokstaver som i dag.
  - **B (anbefalt):** tre skrifter som finnes på ekte båter (blokk, smal blokk, antikva) og fargen.
  - **C:** navnet tilpasses ikke.
  - Anbefalt B fordi blokk fortsatt er det vanlige og det spillet starter med, mens antikva og smal blokk finnes på eldre og nyere båter, så valget gir mer uten å bli urealistisk.

## Valgt uten å spørre (kan snus)

- **Bunnstoffet** kommer i hver modell når den uansett eksporteres (TP5). Snus med en egen fase som eksporterer alle modellene på nytt.
- **Flagget på de andre** tegnes på de seks nærmeste spillerbåtene innen 250 m, som navnene. NPC-ene får ikke flagg i denne planen. Snus med tallene i `drawPeerFlags`.
- **Koden** får 320 tegn i stedet for å pakkes tettere; da forstår eldre sider fortsatt fargenavnene. Snus med en kortere kode og en versjon.
- **Fenderfargen** koster 400 kr i spillkroner per båt. Tallet er en startverdi.

## Det som er antatt eller usikkert

- **Bufferne (punkt 2):** at hver spillerbåt får egne buffere og at ingenting slippes, er lest av koden, ikke målt. TP1 måler det før det rettes.
- **De nye designene:** at baugsveip, dobbel ripestripe, hekkfarge og bred stripe er vanlige på norske fiskebåter, er antatt. De ses på bilder før TP3 bygger dem, og Jonas kan sende bilder.
- **Skriftene:** at Archivo i sida går smal nok til «smal blokk», og at Source Serif 4 (høyst halvfet, 600) er kraftig nok til å leses på hekken, er ikke prøvd. Holder de ikke, trengs en ny fri skrift (OFL) i sida, og da måles hvor mye den gjør sida større.
- **Fløyta:** at én tone, totone og tretone er ekte fløytetyper er antatt. Båndene i vedlegg III er lest på Lovdata 12.11.2026 (FOR-1975-12-01-5). Det er ikke sjekket om en spiller kan oppleve et annet leie som et annet signal.
- **Det fortjente (TP7):** merkene regnes i spillet, så serveren kan ikke sjekke alt. En som jukser, kan få et design gratis. Det er lite å tape, men det er ikke tett.
- **Prisen i pakken minus det du eier:** at det er lov og forståelig er antatt (prisen står før kjøpet, som i dag). Jonas ser formuleringen i PR-en.
- **Bunnstoffet** synes lite (under vannlinja, ved krenging og i klart vann). Verdien er usikker.
- **Flagget til sjøs:** spillet bruker flaggtidene fra flaggforskriften også til sjøs; det er usikkert fra før (4.23).

## Det planen ikke gjør

- **Lys:** lanternene og lysene tilpasses ikke. Sjøveisreglene regel 20 b: fra solnedgang til soloppgang «skal ingen andre lys vises, unntatt slike lys som ikke kan forveksles med de lanterner» som reglene krever (Lovdata, lest 12.11.2026). Det samme gjelder pyntelys og juletre i masta.
- **Statsflagget:** det norske splittflagget tilbys ikke (flaggloven, LOV-1898-12-10-1 § 2: flagget «med Split og Tunge» brukes på statens bygninger og post- og tollfartøy).
- **Vimpler** og flaggline i masta (Jonas 09.11.2026).
- **Innredning, animasjoner i båthandelen, redskap eller pyntefendere modellert inn i båtene.**
- **Rust og slitasje** som tilpasning. Synlig slitasje hører til simuleringen, ikke til Malerverkstedet.
- **Klær og mannskapets utseende** (Garderoben), kallesignalet for andre, og bilde av andres båter i AIS-kortet.
- **Tilfeldige pakker, nedtellinger og design som bare finnes en kort tid.**
- **Sponsorreglene** (`docs/planer/butikker-og-sponsorer.md`) endres ikke; de nye designene kan brukes av sponsede design på samme vilkår.
- **Reléet** får ingenting nytt. Alt utseende går med `pos_put` og `pos_world`.

## Status

- 12.11.2026: planen skrevet i Jonas' økt (grenen `ccr-e7efd74c-rioki0`, sammen med HO3). Ingenting bygd.
- 12.11.2026: Jonas svarte på V1–V4 (alle A, V4 B). Fasene lagt i køen som steg 108–115; hel startmelding for TP1 i `start/108.md`.
- 13.11.2026: TP1 bygd av arbeidsrutinen (steg 108, grenen `plan/2026-11-13-108`, PR #78; rullet ut til testutgaven 13.11.2026, f70c2ddb, versjon 08e93023d16f): de andre spillernes flagg (`drawPeerFlags`), modellene nøklet på malingen (`livPaint`) og et mykt tak på 12 malte modeller, målingen `#benchpeer` og tallene i 4.23 i `docs/systemer/baater.md`. Valg rutinen tok (kan snus): taket slipper bare modeller som ikke er tegnet på 20 s, så alle båtene i syne beholder malingen (snus med `NKBP` i `view3d/20-trawl-seine.js`); flagget tegnes ut til 250 m på alle nivåer av modellen, også der navnet ikke står (snus i `drawPeerFlags`); logoen sendes også under et sponset design, for rederiflagget (`livStr`). `maletest` kjører uten 3D, så sjekkene står i den nye 3D-testen `tests/flaggshot.py`. `view3d/24-cinema.js` ble ikke rørt (FB4 eide den); matrisen for vimpelen står derfor to steder.
