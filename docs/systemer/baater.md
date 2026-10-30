# Båter: flåten, båttypene, verftet og malingen

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.3 Flåtemodellen (fase 1, ferdig)

- `S.fleet` er en liste av fartøy, og `S.cur` er båten som følges.
- Alt som hører til én båt, ligger i fartøyet under nøklene i `VKEYS`: `boat, plan, hold, crew, equip, jobs, cevt, ops, lic, quota, draft, draftSpeed, draftDep, marks, target, trail, fsess, facc, fnext, fishPlanH, workLog, clothes, tripBuff, prep, svcTold, boatName, lastSale, restWarn, kvRel, codWarn, lastIceWarn, navrows`.
- `S.boat`, `S.hold` og de andre er **alias** som peker på fartøyet som er bundet akkurat nå. All eldre kode virker derfor uendret.
- Hjelpefunksjoner:
  - `curVessel()` gir båten som følges.
  - `storeVessel(v)` kopierer tilbake til fartøyet.
  - `bindVessel(v)` setter aliasene og kaller `applyVessel()`.
  - `ensureFleet()` lager en flåte med én båt fra en gammel lagring.
  - `withVessel(v, fn)` binder midlertidig en annen båt.
  - `eachVessel(fn)` kjører en funksjon for hver båt.
- `step()` kjører først en felles del: bestillinger, Mannskapsbørs, marked, bestand og `hourly()`. Deretter kjøres `crewTick`, `navHour` og `vesselStep(H)` for hver båt via `eachVessel`.
- **Lagring:** `save()` skriver flåten én gang og fjerner VKEYS fra toppnivået. `load()` binder aliasene til båten som følges straks lagringen er lest, før noe annet leser `S.boat`.
- **Viktig ved bytte:** Primitive verdier (tall, strenger) må skrives tilbake med `storeVessel` før man bytter båt. `save()` gjør dette selv.
- **Rederinivå, ikke per båt:** `cash, loan, stats, sales, msgs, log, market, stock, orders, rep, bors, streak, haill, pubE, settings, company, owned, tut, lang, me`. `S.tut` er `0` eller veiledningens tilstand (5.16).
- **Fase 2 la til** (i `src/js/core/03-simulation.js`):
  - `S.me` er båten du er om bord på, og `tripOwner` (i `VKEYS`) sier om du var om bord da båten dro.
  - `vget(v, k)` leser et felt fra en hvilken som helst båt. For båten som er bundet, ligger de levende verdiene i `S`, ikke i fartøyobjektet.
  - `openVesselId()`, `meAboard()` og `access()` (`'lukket'`, `'open'` eller `'none'`) gir reglene i kapittel 9.
  - `onVessel(v, fn)` binder en båt og slår på båtnavn foran loggen. `eachVessel` bruker den.
  - `newVesselObj(type, havn, lic)`, `vesselValue(v)` og `deliverOrder()` (verftet).
- **Fase 3 la til** (i telefonen, `src/js/ui/05-phone.js`):
  - Appen `rederi` med flåtekort og varsler. `vSummary()` leser én båt mens den er bundet, og `PHONE.alerts()` gir varslene.
  - Båtvelgeren: appene i `SEL_APPS` (Fartøy, Utstyr, Mannskap, Mannskapsbørs, Verksted) viser og endrer båten i `selV`, som standard båten du følger. Handlinger i disse appene kjøres inne i `withSel`, bortsett fra navigasjon (`NAV`).
  - `S.sales` har båtens id i `v`. `hourly()` er delt: varsler og lån for rederiet, service per båt.

- **Admin: gratis båt til testing** (Jonas 30.10.2026: «La meg som admin kunne kjøpe båter gratis, selv fra havflåten. Jeg må
  kunne teste dem»): på arket til hver båt i Båthandelen står knappen «Admin: ta gratis til flåten» når `adminOk()` (Jonas' konto
  på skyens adresser, alltid i lokale testbygg; samme regel som Admin-appen). Båten legges i flåten uten pris, lån, hjemmel eller
  lås (`lock`), i havna den fulgte båten ligger i eller den nærmeste, og følges med en gang (`adminbuy` i `ui/phone/14-act.js`).
  Gjelder også havflåten og pilotbåten `ringnot38`. Test: `adminbuytest`.

## 4.23 Malerverkstedet og navnet på skroget (06.–07.10.2026)

Jonas' bestilling ligger i `docs/engasjement.md`, arbeidslista punkt 1. Alle seks stegene er bygget: skrogfarge, navn på alle båter, malingen til andre spillere, malingsdesign, flagg, registreringsmerke og rederilogo.

- **Malerverkstedet** (`ui/10j-paint.js`) er en egen knapp i Verft-vifta og åpner en side i skuffen (`maler`).
  - 16 skrogfarger i `HULLPAL` (`vessel3d.js`), og «Original».
  - Fargen koster spillpenger: rundt 1 % av båtprisen, minst 1 500 kr (`PAINT.price`). Første fargevalg på hver båt er gratis.
  - Malingen lagres i båtens egen tilstand: `b.liv = {hull:key}` i `S.boat`, som følger fartøyet i flåten og i lagringen. En båt som tas i innbytte (`switchVessel`), og en ny båt i flåten starter uten maling.
  - Det legges ikke inn ventetid: fargen gjelder med en gang.
- **Forhåndsvisningen:** fargen du trykker på, settes i `PAINTPRE` og vises på båten før du betaler (`hullLiv`).
  - `G3.paintView` lar kameraet gå sakte rundt egen båt og legger båten midt i det skuffen lar være fritt (`paintAim`).
  - Skuffen styrer det: `DOCK` kaller `PAINT.live` når siden åpnes og lukkes.
- **I 3D:**
  - En detaljert modell males i sone 1 (`glbPaint`), med den innbakte skyggen beholdt.
  - En byggesettbåt får fargen i `col.hull`.
  - Egen båt har egne buffere (`pvm(t, liv)`, nøkkel `type|own`). Bare fargebufferen lastes opp på nytt når fargen endres, så å prøve farger bygger ingenting nytt. Den håndstyrte båten gjør det samme med `paintHand`.
  - Trebåten (`snekke23.py`) har fått sone 1 på plankene og er eksportert på nytt.
- **Navnet på skroget** (Jonas 07.10.2026: «vises godt på skroget på alle båtene»):
  - `nameStrips(type)` finner en stripe på hver side forut ut fra modellen selv. Skrogets trekanter som vender ut mot styrbord, kuttes ved hver stasjon. Det gir toppen og bunnen av skutesiden og bredden i hver høyde. Små hull i flaten, som spylegatt, bygges det bro over.
  - Stripa er inntil 0,025 L + 5 cm høy (16–90 cm), fire ganger så lang som høy, og midten står en firedel av lengden fra stevnen. Enden ved stevnen holdes av til registreringsmerket.
  - Bokstavene er lyse på mørkt skrog og mørke på lyst (`hullRGB`, `isLight`).
  - Egen båt tegnes i `drawVessel(..., named)`, den håndstyrte med sine egne ankre.
  - De seks nærmeste andre båtene innenfor 250 m (fiskeflåten, kysttrafikken og andre spillere) får navnet sitt med teksturer fra et lite lager (`nameTex`, høyst 10).
- **Andre spillere ser malingen** (`supabase/migrations/20261007090000_livery.sql`):
  - `presence.liv` er en kort kode (`'h:kobolt'`, senere også design, flagg, merke og logo). Den er begrenset til bokstaver, tall og noen skilletegn, og til 160 tegn.
  - `pos_put` har fått argumentet `liv` med standardverdi, og den gamle versjonen med sju argumenter er fjernet. `pos_near` leverer feltet videre.
  - Spillet sender `livStr(S.boat)` bare når båten er malt. Svarer serveren 404 på et kall med `liv`, sendes posisjonen uten (`WORLDP.noLiv`), så den felles verdenen aldri slås av.
  - `peerStates` tar `liv` med, og `npcModel` bygger modellen med `livParse(liv)`. Bare farger fra `HULLPAL` godtas.
- **Malingsdesign** (steg 3, 07.10.2026):
  - Fem design, `DESIGNS` i `vessel3d.js`: ripestripe, totone, vannlinjestripe, stripefarge (modellens sone 2) og nylakkert (glans).
  - Hvert design kjøpes én gang og er ditt på alle båter: `S.cos`, og på kontoen `entitlements`, som kommer som `CLOUD.owned` i `tm_hello`.
  - Produktene `des_*` (type `skin`) står i `supabase/migrations/20261007100000_designs.sql`. `shop_paid` legger også inn eierskapet, og `shop_refund` tar det bort. Spillet gir designet med `giveCos` (`shopGive`, `give:'cos'`).
  - Et design kan prøves på båten før kjøpet. Det som ble prøvd, settes på når kjøpet kommer tilbake (`S.cosWant`).
  - Linjene kuttes inn i skrogets egne trekanter (`glbDesign`) langs skutesidens profil (`topsides`, 96 stasjoner fra sone 1). Kantene blir skarpe uansett hvor fint modellen er delt opp.
  - Egen båt får nye buffere når et design endrer formen (`livGeo`), ellers lastes bare fargene opp på nytt.
  - En byggesettbåt tar ripestripe og vannlinjestripe som `col.stripe` og `col.boot` (`kitLiv`). `designFits` sier hva hver type kan ha.
  - `livStr` sender designene til de andre spillerne (`'h:..;r:..;t:..;v:..;s:..;g:1'`).
- **Flagg** (steg 4, 07.10.2026):
  - Flagget i akterenden er et bilde (`flagCanvas`) på den blafrende duken (`FLAGM`, med `ub` og `drawTexQuad`). Det som ligger utenfor formen, er gjennomsiktig og tegnes ikke.
  - `FLAGS` i `vessel3d.js` har 50 nasjoner, også Sápmi og kvenene, tegnet av noen få former, så de ser like ut på alle enheter.
  - Formene er rektangel, vimpel (strukket 1,7 × 0,8) og splitt. Det norske splittflagget er statsflagget og tilbys ikke (lov om Norges flagg).
  - Norge i rektangel er gratis og det båten kommer med. Alle nasjoner og former er ett kjøp: `des_flagg`, 19 kr, `S.cos.flagg`.
  - Flagget lagres i `b.liv.flag = {c, s}` og går til de andre som `f:SE.vimpel`. Andre spilleres flagg tegnes ikke ennå.
  - **Flaggtidene** (`flagUp(H, p)` i `core/03-simulation.js`, Jonas 07.10.2026): flagget er oppe fra kl. 08 (mars–oktober) eller kl. 09 (november–februar) til solnedgang, senest kl. 21. I Nordland, Troms og Finnmark (nord for 65° N) er det oppe kl. 10–15 fra november til februar. Det følger flaggforskriften fra 1927, som gjelder offentlig flagging. Malerverkstedet viser flagget uansett tid. Vimpelen (4.25) har ingen tider og henger oppe døgnet rundt.
  - Usikkert: noen kilder om flaggskikk til sjøs sier at flagget kan føres hele døgnet under fart. Det har vi ikke kunnet bekrefte i en primærkilde, så spillet bruker de samme tidene til sjøs og i havn.
- **Registreringsmerke** (steg 5, 07.10.2026):
  - Merket består av fylkets bokstaver, et løpenummer og kommunens bokstaver, malt på begge sider nær stevnen (ervervstillatelsesforskriften §§ 22–23).
  - Bokstavene hentes fra `src/data/regmerke.json` (`tools/regmerke/regmerke.py`). For hver av 193 kystkommuner er det bokstavene de fleste av kommunens fartøy har i Fiskeridirektoratets sluttsedler, og løpenumrene som er i bruk.
  - Kommunen er hjemhavnas. En kysthavn er et mottak med kommunen sin. De gamle Senja-havnene står i `PORTK`, der Sommarøy og Brensholmen ligger i Tromsø.
  - `regOf(b)` gir båten et nummer ingen ekte båt i kommunen har, og lagrer det i `b.reg`.
  - Bokstavhøyden følger § 23: 45 cm fra 15 m, 25 cm fra 9 m, ellers 15 cm. Stripa ligger en tidel fra stevnen (`markStrips`, `sideStrip`).
  - Fargene er hvitt på mørkt skrog og svart på lyst, slik § 23 sier (hvitt på svart eller svart på hvitt).
  - Merket står også på ervervstillatelsen under Papirer, og andre spillere ser det (`m:T.112.LK`, der Æ, Ø og Å reiser som 1, 2 og 3).
  - Ønskenummer (`des_reg`, 29 kr): nummeret kan ikke være en ekte båts. Serveren gir hvert merke til én spiller (`reg_claims`, `reg_claim`), høyst ti per spiller.
- **Rederilogo** (steg 6, 07.10.2026; `des_logo`, 49 kr; `supabase/migrations/20261007110000_logos.sql`):
  - Logoen er rederiets (`S.logo`), ikke båtens, og står på alle båtene. Den lages av ett av seks tegn (`LOGOSYM`), opptil tre bokstaver og to farger fra skrogpaletten (`{kind:'g', sym, txt, c1, c2}`), eller er et opplastet bilde (`{kind:'u', img, ver}`).
  - Et opplastet bilde gjøres 256 × 256 (hele bildet, resten gjennomsiktig) og WebP, ellers PNG, på høyst 58 000 tegn (`upload` i `10j-paint.js`). Det prøves på båten før kjøpet, som alt annet.
  - Logoen står midtskips på begge sider (`logoStrips`, en kvadratisk stripe ved halve lengden, høyst 0,06 L + 0,3 m) og kan heises som rederiflagg (flaggkoden `LOGO`, som krever logoen og ikke flaggene).
  - Andre ser den gjennom malingskoden: en laget logo reiser i sin helhet (`l:g.anker.JH.marine.hvit`), et bilde bare som versjon (`l:u.3`), og hentes med `logo_get` etter spillerens id i den felles verdenen (`peerLogo` i `10h-world.js`, mellomlagret per spiller og versjon).
  - Serveren tar ett bilde per spiller (`logos`, `logo_put` krever kjøpet, høyst 30 opplastinger om dagen, bare data-URL for WebP, PNG eller JPEG). Uten skyen (artifacten, testene) blir bildet bare på enheten.
  - Jonas (07.10.2026): «spillere kan laste opp hva de vil, men la meg eventuelt kunne fjerne det i admin-dashboard om det er støtende, samtidig som jeg gir en forklaring på hvorfor. Spilleren skal dermed kunne velge et nytt bilde gratis.» Admin-fanen **Logoer** viser alle bildene og tar et bort med en grunn (`admin_logos`, `admin_logo_remove`). Da får ingen bildet lenger. Ved neste start ser spillet det (`logoCheck`, `logo_mine`), tar logoen av båtene og flagget og sender en melding med grunnen. Kjøpet er spillerens, så et nytt bilde koster ingenting.
  - Vilkårene (punkt 5) og personvernsiden («Rederilogoen du laster opp») sier dette.
- **Test:**
  - `maletest`: knappen, siden, prøvefargen, at første fargevalg er gratis, prisen, for lite penger, lagringen, lukking og innbytte, designene, flagget, registreringsmerket, logoen (laget, opplastet og tatt bort).
  - `cloudtest`: malingen går opp og ned, og en server uten den ennå gir ingen avbrudd.
  - `sqltest`: feltet vaskes, kortes og leveres videre; designene etter kjøp og refusjon; ønskenummeret; logoen (bare etter kjøp, henting, fjerning med grunn og nytt bilde).
  - `admintest`: fanen Logoer tegnes i demoen.
  - Navnene er sjekket på bilder fra siden for alle båttypene.

## 5.1 Båter og utstyr

Båtene står i `VESSELS` (`core/02-species-gear.js`) i fartøyskjemaet v2 (17.10.2026, `docs/batplan.md` del 4). Tallene er startverdier og anslag. Skjemaet har sju grupper felt:

- **Skrog og mål:** `len`, `beam`, `draft`, `disp` (deplasement i tonn), `hullMat` (`tre`, `glassfiber`, `alu`, `stål`; materialet bestemmer også hvor lett skroget tar skade, se 5.60), `planing`, `outboard`, `turnR`, `sea` (hvor mye sjøen gjør med båten) og `risk` (bølgehøyde og vind hun tåler, trinn for trinn).
- **Last:** `hold {kind, m3}` (`dekk`, `rom`, `frys` eller `rsw`), `holdCap` (kg), `deckCargo` (frakt på dekk, med kran), `iceCap`, `tubCap` (bløggekaret), `land` (kasser eller kar ved levering), `iceMaker` og `gutMachine` (kg i timen; monteres på verftet, bare over 14,99 m).
- **Motor og drivstoff:** `hp`, `engine`, `rpm`, `semi` (semidiesel), `diesel`, `vcruise`, `vmax`, `accel`, `fuelCap` og `lph` (liter i timen i marsjfart).
- **Folk:** `crewMax` (folk utenom skipperen), `berths` (køyer), `cabins` (lugarer) og `crew` (nøkkelfolk og lag på havbåtene).
- **Fasiliteter (`fac`) og arbeidsplasser (`stations`):** hus (`open`, `hardtop`, `hus`), ly, bysse (`none`, `plate`, `bysse`), WC, tørkerom og messe; `stations.table` er hvor mange som sløyer samtidig, `stations.hauler` haleplassene. `crane` er antall kraner.
- **Redskap:** `rigs`, `jukseMax`, `gearMax {garn, stamp, teine}` og `std` (utstyr som følger med). Ingen båt har redskap modellert inn, bare plassene (Jonas 18.10.2026).
- **Handel og drift:** `price`, `priceNew`, `isNew`, `year`, `cls` (`open`, `kyst`, `hav`), `lock` (havbåtene), `svcH`, `svcCost`, `svcJobH` og `desc`.

`vesselDerive` regner ut resten, slik at ingen tall står to steder: `fuelK` (forbrukskurven) fra `lph`, `range` = `fuelCap` / `lph` × `vcruise`, `watch` (døgndrift 2+2: styrhus og minst to køyer), `openOk` (under 11 m og ikke havbåt) og `haulers` (halerne som passer etter `equipFits`). `vesseltest.py` er skjemavokteren: den nekter en båt uten feltene og passer på reglene (blant annet at ingen kode velger etter typenavn).

Mannskapet leser fasilitetene (17.10.2026, `docs/batplan.md` del 8): køyer gir hvile om bord til ankers og på sjøen med vakt (`15-energy.js`, `koye`), byssa bestemmer maten (`14-crewlife.js`), ly og tørkerom kulda og messa humøret (`04-crew.js`), `stations.table` hvor mange som sløyer (`13-work.js`), og `watch` om døgndrift går (`06d-drift.js`).

Tabellene under er hentet fra spillet 19.10.2026 (`VESSELS` etter `vesselDerive`).

| Nøkkel | Type | L × B × T (m) | Depl. (t) | Skrog | Last (`hold`, `holdCap`) | Dekkslast | Motor, marsj/topp | Forbruk, rekkevidde | Folk / køyer / lugarer | Pris | Gruppe |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `skiff` | Aluminiumsbåt 19 fot (5,9 m), 60 hk påhengs (2008) | 5,9 × 2,45 × 0,6 | 1 | aluminium | på dekk 0,8 m³, 350 kg | 150 kg | 60 hk, 18/24 kn | 11 l/t, 147 nm | 1 + 1 / 0 / 0 | 95 000 | åpen og lukket gruppe |
| `trebat` | Trebåt 23 fot (7,0 m), 8 hk semidiesel (1956) | 7 × 2,26 × 0,62 | 1,9 | tre | på dekk 0,8 m³, 350 kg | 200 kg | 8 hk, 6/7 kn | 1 l/t, 360 nm | 1 + 1 / 0 / 0 | 45 000 | åpen og lukket gruppe |
| `snekke` | Plastsnekke 26 fot, 30 hk diesel (1994) | 7,9 × 2,7 × 1,2 | 3 | glassfiber | på dekk 1,8 m³, 900 kg | 300 kg | 30 hk, 7/8 kn | 3 l/t, 513 nm | 1 + 2 / 0 / 0 | 245 000 | åpen og lukket gruppe |
| `plastsjark` | Plastsjark 31 fot (9,45 m), 100 hk (1992) | 9,45 × 3,3 × 1,35 | 6 | glassfiber | lasterom 6 m³, 3 500 kg | 800 kg | 100 hk, 7,5/8,5 kn | 8 l/t, 563 nm | 1 + 2 / 2 / 1 | 850 000 | åpen og lukket gruppe |
| `sjark` | Havsjark 35 fot (10,6 m) med bakk og styrhus (1985) | 10,57 × 4,1 × 1,6 | 12 | glassfiber | lasterom 11 m³, 6 500 kg | 1 500 kg | 180 hk, 8,5/10 kn | 12 l/t, 638 nm | 1 + 3 / 4 / 1 | 1,15 mill. | åpen og lukket gruppe |
| `hurtigsjark` | Brukt hurtigsjark 10,99 m, 500 hk (2009) | 10,99 × 3,9 × 1,6 | 12 | glassfiber | lasterom 8 m³, 5 000 kg | 1 200 kg | 500 hk, 17/22 kn | 55 l/t, 464 nm | 1 + 2 / 2 / 1 | 4,9 mill. | åpen og lukket gruppe |
| `sjarkny` | Ny hurtigsjark 10,99 m, 650 hk (2027) | 10,99 × 4,68 × 2,06 | 15 | glassfiber | lasterom 12 m³, 7 000 kg | 1 800 kg | 650 hk, 20/25 kn | 75 l/t, 533 nm | 1 + 3 / 4 / 2 | 10,5 mill. (ny, levert med en gang) | åpen og lukket gruppe |
| `breisjark` | Sjark 36 fot med bakk og ly (2015) | 10,99 × 4,2 × 2 | 20 | glassfiber | lasterom 19 m³, 10 000 kg | 2 500 kg | 300 hk, 9,5/10,5 kn | 20 l/t, 1 615 nm | 1 + 4 / 4 / 2 | 9 mill. | åpen og lukket gruppe |
| `kyst15` | Kystbåt 14,99 m med lugarer (2012) | 14,99 × 6,6 × 3 | 75 | glassfiber | lasterom 45 m³, 28 000 kg | 6 000 kg | 750 hk, 10/11,5 kn | 60 l/t, 1 500 nm | 1 + 5 / 6 / 3 | 18 mill. | bare lukket gruppe |
| `kyst21` | Eldre kystbåt 21 m, garn og line (1978) | 21 × 7,2 × 3,4 | 190 | stål | lasterom 90 m³, 55 000 kg | 10 000 kg | 900 hk, 10/11 kn | 80 l/t, 3 125 nm | 1 + 6 / 8 / 4 | 9 mill. | bare lukket gruppe |
| `snokrabbe` 🔒 | Snøkrabbefartøy 50 m med fryseri (2001) | 50 × 11 × 6 | 1 800 | stål | fryserom 900 m³, 500 000 kg | 40 000 kg | 3 600 hk, 11/13,5 kn | 400 l/t, 9 625 nm | 14 / 18 / 9 | 60 mill. | havfiske, konsesjon |
| `autoliner` 🔒 | Autoliner 45 m med frysing (1999) | 45,4 × 10,45 × 3,8 | 1 050 | stål | fryserom 700 m³, 400 000 kg | 30 000 kg | 3 000 hk, 11/13 kn | 350 l/t, 9 429 nm | 14 / 16 / 8 | 70 mill. (ny 300 mill.) | havfiske, konsesjon |
| `bunntral` 🔒 | Frysetråler 60 m med akterslipp (2004) | 60,3 × 12,5 × 5,1 | 2 200 | stål | fryserom 1 400 m³, 800 000 kg | 60 000 kg | 8 000 hk, 12/15 kn | 900 l/t, 9 333 nm | 25 / 30 / 15 | 150 mill. (ny 500 mill.) | havfiske, konsesjon |
| `pelagisk` 🔒 | Ringnot- og pelagisk tråler 75 m (2010) | 75 × 15,5 × 7,5 | 5 000 | stål | RSW-tanker 2 800 m³, 2 000 000 kg | 80 000 kg | 9 000 hk, 14/17 kn | 1 000 l/t, 9 100 nm | 12 / 16 / 8 | 250 mill. (ny 800 mill.) | havfiske, konsesjon |

| Nøkkel | Hus | Ly | Bysse | WC | Tørkerom | Messe | Sløyebord / haleplasser | Vakt 2+2 | Kran | Ismaskin / sløyemaskin (kg/t) | Halere som passer | Redskapsplass garn / stamper / teiner | Bløggekar | Juksamaskiner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `skiff` | åpen | – | – | – | – | – | 1 / 1 | – | – | – / – | linehaler, teinehaler | 6 / 4 / 4 | 60 kg | 2 |
| `trebat` | åpen | – | – | – | – | – | 1 / 1 | – | – | – / – | linehaler, teinehaler | 6 / 4 / 6 | 60 kg | 2 |
| `snekke` | hardtopp | – | – | – | – | – | 1 / 1 | – | – | – / – | linehaler, garnhaler, teinehaler | 15 / 10 / 9 | 150 kg | 3 |
| `plastsjark` | styrhus | – | kokeplate | – | – | – | 1 / 1 | ja | – | – / – | linehaler, garnhaler, teinehaler | 30 / 18 / 12 | 250 kg | 4 |
| `sjark` | styrhus | – | kokeplate | ja | – | – | 2 / 1 | ja | – | – / – | linehaler, garnhaler, teinehaler | 40 / 24 / 18 | 300 kg | 5 |
| `hurtigsjark` | styrhus | – | kokeplate | ja | – | – | 2 / 1 | ja | – | – / – | linehaler, garnhaler, teinehaler | 50 / 26 / 18 | 350 kg | 6 |
| `sjarkny` | styrhus | – | bysse | ja | ja | – | 2 / 1 | ja | – | – / – | linehaler, garnhaler, teinehaler | 60 / 30 / 21 | 400 kg | 6 |
| `breisjark` | styrhus | ja | bysse | ja | ja | – | 2 / 1 | ja | – | – / – | linehaler, garnhaler, teinehaler | 100 / 33 / 20 | 450 kg | 6 |
| `kyst15` | styrhus | ja | bysse | ja | ja | ja | 3 / 2 | ja | 1 | – / – | linehaler, garnhaler, teinehaler | 160 / 33 / 30 | 800 kg | 8 |
| `kyst21` | styrhus | – | bysse | ja | ja | ja | 3 / 2 | ja | 2 | – / – | linehaler, garnhaler, teinehaler | 240 / 33 / 30 | 1200 kg | 8 |
| `snokrabbe` | styrhus | ja | bysse | ja | ja | ja | 4 / 2 | ja | 5 | – / – | linehaler, garnhaler, teinehaler | 0 / 0 / 7000 | 2000 kg | 0 |
| `autoliner` | styrhus | ja | bysse | ja | ja | ja | 4 / 1 | ja | 3 | – / 2 500 | linehaler, garnhaler, teinehaler | 0 / 0 / 4 | 2000 kg | 0 |
| `bunntral` | styrhus | ja | bysse | ja | ja | ja | 6 / 2 | ja | 5 | – / 4 000 | linehaler, garnhaler, teinehaler | 0 / 0 / 4 | 3000 kg | 0 |
| `pelagisk` | styrhus | ja | bysse | ja | ja | ja | 2 / 2 | ja | 5 | – / – | linehaler, garnhaler, teinehaler | 0 / 0 / 4 | 3000 kg | 0 |

- **Gruppe:** båter under 11 m kan fiske i åpen gruppe (`openOk`), og med hjemmel i lukket. Kystbåtene fra 14,99 m går bare i lukket gruppe, og båter på 15 m og over fisker ikke innenfor fjordlinja (venter i stedet, se 5.2). Havbåtene (🔒) har datablad og 3D-modell, men kan ikke kjøpes før havfeltene kommer.
- **Ingen kode velger etter typenavn.** Alt leser feltene, og `vesseltest.py` feiler hvis `=== '<type>'` dukker opp i `src/js`.
- **Køyer** styrer hvilen: uten køyer hviler mannskapet bare i land (naust, rorbu).
- **Prisene bygger på:** brukte 26-fots snekker til 30 000–340 000 kr, en brukt Selfa 10,65 m til 4,9 mill., nye 10,99-meteres sjarker til 9,5–12,5 mill., nye 14,99-meteres kystbåter til 23–70 mill. og brukte trålere uten kvote til over en halv milliard. Havbåtenes priser og vekt er grove anslag.

**Redskapsstige:**
- *Ingen fiskestang* (fjernet 04.10.2026 etter Jonas' liste): uten håndjuksa eller juksamaskin fisker ingen for hånd. «Jukse» sier fra og peker til butikken.
- *Håndjuksa med pilk og fire markkroker:* 1 900 kr (`PRICE.gear`), effekt 2,0. Den ligger montert i båten fra start (handelssteder trinn 1).
- *Juksamaskin:* 34 000 kr, effekt 4,0 hver, altså dobbelt så mye som håndjuksa. Én person passer tre og fisker da ikke selv med håndjuksa (`JIG` i `03-simulation.js`). Hvor mange båten har plass til, står i `jukseMax`.
- *Kveiteutstyr:* stor pilk, kraftig snøre og gaff, 2 490 kr (`PRICE.kgear`).
- **Handelen** skjer bare på de tre stedene i `docs/handelssteder.md`: utstyrsbutikken (telefonsiden `utstyrb`, med båten ved butikkens kai) selger fiskeutstyr, halere, elektronikk, redning og klær; fiskemottaket tar imot fisken og selger is fra isrenna (1,50 kr/kg, `PRICE.ice`) og agn; verftet har båtene, motoren, vedlikeholdet, malingen, skrogreparasjonen og kaskoen. `buyGate` og `equipFits` (`core/10-gear.js`) avgjør hva som kan kjøpes til båten du har.
- *Garn, line og teiner:* passivt redskap som står i sjøen mens båten er borte. Se «Redskap i sjøen» i kapittel 9.
- *Halere* (`EQUIP`): linehaler 68 000 kr, garnhaler 95 000 (fra 7,5 m) og teinehaler 58 000. Hva som passer hvilken båt, står som `fit:{minLen, maxLen, outboard}` og sjekkes med `equipFits(k, type)`; tabellen over viser resultatet. Uten haler trekkes garn og line for hånd og tar 2–2,5 ganger så lang tid. Teiner kan ikke trekkes for hånd.

Mister du juksa, fisker bare juksamaskinene til du kjøper ny i utstyrsbutikken. `motor90` er et utstyrsvalg for båter med påhengsmotor (`boost`: 30 kn, mer drivstoff).

**Ekkolodd og sonar** (varmekartet i kartplotteren, se 5.14):

| Trinn (`HEAT.tiers`) | Utstyr | Varmekartet | Artsvalg |
|---|---|---|---|
| `basic` | Enkelt ekkolodd, alle båter har det | 1 nm i diameter, ruter på 100 m, fire trinn | Nei |
| `chirp` | CHIRP-ekkolodd, 13 900 kr, 3 t å montere | 1,5 nm, ruter på 60 m, glatt | Alle, torsk, hyse, sei |
| `sonar` | Sonar (søkelys), 150 000 kr, 16 t, båter fra 10 m | 3 nm, ruter på 80 m, oppdateres hvert 2. minutt, viser hvor stimene trekker | Alle, torsk, hyse, sei |

- Sonarens pris og monteringstid er antakelser. Delene til en Furuno CH-37BB koster rundt 13 200 USD før montering (fant ingen norsk pris), og båten må på slipp for senkerøret.
- Ekkoloddet og sonaren slås av og på i sidepanelet i plotteren (`S.settings.echo`, `S.settings.sonar`). Av betyr ingen varme, og ekkoloddet slutter å tegne. Fartøy-appen merker dem «(av)».
- En montering som venter mens båten byttes til en type utstyret ikke passer, betales tilbake (`finishJob`).

**«Neste mål»** står øverst i Båthandel og som en linje på telefonens hjemskjerm, og følger stigen: håndjuksa, første juksamaskin, blad B (landingsdager og verdi, knapp til Papirer), første båt med hjemmel (egenkapitalen banken krever), neste hjemmel opp, kystbåten på 14,99 m og «Havfiske» (kommer). De to neste stegene vises.

**Båthandel** (Verft → Båthandel, `market()` og `sheet()` i `ui/05-phone.js`):
- Fanene er Åpen gruppe, Med hjemmel, Kystflåten og Havfiske. Hvert kort har et sideriss i SVG (`vesselSVG`, laget fra den samme 3D-spesifikasjonen, så det virker uten WebGL), navn, mål og pris.
- Databladet har Generelt (pris, mål, vekt, lasterom, is, drivstoff, motor, fart, mannskap, køyer, hva båten tåler, gruppe og fjordlinja), Redskap, Hjemmel og Mannskap om bord, og knappene «Kjøp og bytt inn», «Kjøp til flåten» og «Se båten i 3D».
- «Se båten i 3D» (`G3.showroom(type)`) viser båten flytende utenfor havna med et kamera som går sakte rundt. Brikka `#showChip` har navn, mål og «Tilbake».
- Før rederiet har en båt i lukket gruppe, kjøpes en båt i åpen gruppe bare ved å bytte inn den du har. Et rederi kan ha én båt i åpen gruppe.

## 5.12 Verksted

- **Tid og samtidighet** (05.10.2026, Jonas: «Montering av utstyr og vedlikehold skal ta 30 ekte minutter, og man kan gjøre flere oppgaver samtidig»; `core/06-services.js`):
  - Verftets jobber (`YARD_KINDS`: montering, service, skrogrens på slipp, lasterom, motorbytte og reparasjon) tar 30 ekte minutter hver: `YARD_H` = 30 × `GAME_RATE` / 60 = 3 spilltimer. Det gjelder uansett hva som gjøres, og `FIT_H` og `svcJobH` brukes ikke lenger.
  - Service man gjør selv (`self`), koster 35 % og tar dobbelt så lang tid.
  - Arbeidet på kaia (klargjøring, egning og bøting) beholder sine egne timer.
  - Alle jobbene går samtidig. Hver får sin `until` når den bestilles i havn, eller når båten kommer i havn. `jobsDone()` er den siste av dem. Den brukes til avgangen, «Neste»-brikken og statusfeltet.
  - `jobOk` gir jobber fra før (2–16 timer, også en som pågår) verftets halvtime.
  - Køen har fortsatt plass til seks. En jobb som venter på havn, kan fjernes.
- **Overtid** med spillkroner, per jobb: halverer resten av tiden på den jobben, for 950 kr per spart time.
- **«Ferdig nå»** (før «Hastejobb», tenkt for ekte penger) er bare for admin (`adminOk()`).

## Fartøystigen (V1–V10, godkjent og bygget 01.10.2026)

Båtene er spillets superstjerner, med Fishing: Barents Sea som inspirasjon, men egne navn som forklarer båttypen. Jonas bestemte: stigen går helt til havfiske (havbåtene bygges nå, men låses til kartet utvides vestover), neste kjøp etter startbåten er en båt i lukket gruppe, rundt én uke med vanlig spilling dit, markedspriser med 80 % banklån og toppfinansiering fra Innovasjon Norge, ingen sertifikatkrav ennå, blad B som forenklet aktivitetskrav og store mannskap som nøkkelfolk og lag (bare data foreløpig).

1. **V1 Skjema:** feltene i `VESSELS`, `equipFits`, `BEAM` avledet fra bredden. Ingen kode velger etter typenavn.
2. **V2:** `view3d.js` styres av data (`geoOf`, `turnR`, geo-flagg).
3. **V3 Byggesettet** i `vessel3d.js` (5.13).
4. **V4:** de nye kyst- og havtypene, prisene, fem tilbud med hjemmel, køyer og fjordlinja for 15 m og over (venter i stedet for å fiske innenfor).
5. **V5 Båthandel** (5.1) med `G3.showroom`.
6. **V6:** havbåtene i 3D.
7. **V7 Progresjonen:** blad B, lån som innfris ved salg og innbytte, toppfinansiering og stigen i «Neste mål» (5.5).
8. **V8 Kalibreringen** med `progweek.py`: en bot spiller fra 1. mars med skiffen og spillets egne funksjoner i tre tempo (tur hver tredje dag, annenhver dag og hver dag været tillater). Den går ut når bølgene på feltet og vinden er innenfor det skiffen tåler. Blad B kommer etter 14–16 turer i alle tempo, fordi 1 G binder. Med 10 % toppfinansiering tok inngangen 24 turer, med 15 % kommer den sammen med blad B. Torskekvoten i åpen gruppe (4 t) blir full rundt dag 42 for den som fisker hver dag.
9. **V9 NPC-modellene** (5.14).
10. **V10** dokumentasjonen.

Åpne punkter står i kapittel 10.

## 5.37 Verftets oppgraderinger av selve båten (Jonas 09.10.2026)

Bare båten, aldri fiskeutstyr eller haler. Tallene står i `core/03-simulation.js` (`HOLDUP`, `ENGUP`, `UPGS`), jobbene i `core/06-services.js` (`finishJob`, kind `upg`), kortene i `ui/05-phone.js` (verftet, Oppgraderinger) og testen i `tests/yardupgtest.py`. Lagret per båt: `b.holdLv`, `b.engLv`, `b.upg = {nøkkel: trinn}`.

- **Prisen** er en andel av båtens pris (`upPrice(pc)`, minst 5 000 kr), så en tråler til 60 mill. koster millioner og en snekke noen tusen. Hver jobb tar 30 ekte minutter (`YARD_H`).
- **Lasterom** (ikke havbåtene, `cls: 'hav'`): +20 %, +40 %, +70 % til 3, 6 og 10 % av båtprisen (var +25, +60, +100 %). Eksisterende lagringer beholder trinnet og får de nye tallene.
- **Motor** (ikke påhengsmotor): +10 % og +20 % kraft til 6 og 11 %. Fartsgevinsten er bevisst liten mot Trim (+50 til +100 %): mer diesel (`fuelK`) og motorservice ×1,2 og ×1,5 (`svcCostOf`).
- **Mannskap, bare på båter med køyer** (`berths` > 0): lugarer (tretthet ×0,92 / ×0,85 / ×0,78 på sjøen), messe og bysse (måltidet 24 / 18 / 12 minutter og humør +2 / +4 / +6), tørkerom og bad (kuldeslitet ×0,85 / ×0,7). Virkningen går gjennom `BOAT.fx` til `crewTick` (`core/04-crew.js`) og `mealMinute`.
- **Isolert lasterom** (ikke havbåtene): isbruken per kilo ×0,85 / ×0,7. **Drivstofftank** (ikke påhengs- og havbåter): ×1,25 / ×1,5. **Stabilisering** (fra 9 m): slingrekjøl, og gyrostabilisator fra 25 m; `BOAT.sea` ×0,9 / ×0,78 (mindre fartstap i sjø) og mannskapets sjøgang teller mindre.
- **Ikke gjort:** havbåtene har ingen oppgraderinger for lasterom (tankene er faste); lugarer gir ikke ekstra mannskapsplass; ingen animasjon.
