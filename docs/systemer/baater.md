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
- **Navnet på båten** (Jonas 07.10.2026: «vises godt på skroget på alle båtene»; lagt om 04.11.2026: «Det som er mest vanlig er at navnet på båten skrives i blokkbokstaver på kanten av styrhustaket foran, men også på hekken. På hekken står som regel også hjemmehavnen til båten under navnet, men med litt mindre størrelse på skriften», og «teksten er enten svart eller hvit alt ettersom hvilken farge som får høyest kontrast mot fargen der den plasseres»):
  - `namePlaces(type)` i `vessel3d.js` finner plassene fra modellens egen flate med stråler langs lengderetningen (`facingTris` i et rutenett, `rayZ`), én stripe per tekstlinje, regnet én gang per type (rundt 0,1–0,25 s første gang typen tegnes):
    - **Styrhustaket foran** (`houseFront`): glassdelen som vender forover foran skipperens øye gir vinduenes overkant; over den leter ni stråler på tvers etter et bånd som vender forover uten trinn, minst 10 cm høyt (ellers det høyeste på 7). Bokstavene er så høye som lengden sier (`nameCap`: 20 cm på 7 m, 30 cm på 15 m, høyst 60 cm, ganger 0,85), men innenfor båndet; under 8 cm brukes ikke takkanten (snekka og plastsjarken har for smal kant og får navnet på baugen).
    - **Hekken** (`transom`): flatene som vender akterover på skrog-, stripe- og overbyggmalingen (ikke stiger, rekker og beslag) nær skrogets akterende. Navnet øverst, hjemmehavnen under i 0,55 av høyden; bokstavene på hekken er mindre enn på styrhuset (`sternCap`: 8,5 cm på 7 m, 10 cm på 10 m, 12,5 cm på 15 m, høyst 30 cm, og teksten aldri bredere enn halve hekken; Jonas 04.11.2026: «Lager du de voldsomt store?» og «Gjør teksten enda mindre … På mange båter dekker det jo nesten hele hekkens bredde»); blokka flyttes ned 4 cm om gangen til hver linje står på én jevn farge (for eksempel navnet på det hvite og havna på det blå), ellers mindre, ellers bare navnet.
    - **Ikke i baugen** (Jonas 04.11.2026: «Fjern også navnet som står i baugen, det ser malplassert ut»): båter uten styrhusfront får navnet bare på hekken (snekka, plastsjarken). Båter uten hekk til det (skiffen med påhengsmotoren midt på hekken, den spisse trebåten) får det lite akter på begge sider (`quarter`: 0,72–0,84 av lengden fra stevnen, under ripa, i hekkens bokstavhøyde, 3 cm ut fra skroget så klinkbordene ikke dekker det). `nameStrips` brukes bare til dette og til maletest.
    - Frysetråleren (`bunntral`) har akterslipp og får ikke navn på hekken (ingen flate midt akter).
  - **Skriften:** blokkbokstaver i spillets egen Archivo (fet, litt smal, i siden som data, så den er lik på alle enheter), sentrert og smalere når navnet er langt (`nameCanvas` i `view3d/13-instruments.js`). Teksturene ligger i et lager på 28 etter tekst, farge og stripens form (`nameTex`).
  - **Fargen:** hver plass har fargen under seg (`crossPaint`: middel, andel skrogmaling sone 1 og overbygg sone 3, jevnhet). `placeRGB` tar malingen spilleren har valgt der plassen ligger på skroget eller overbygget, og `nameInkLight` velger hvit eller svart etter WCAG-kontrasten (relativ luminans, sRGB).
  - Tegnes av `drawNames`: egen båt (`drawVessel(..., named)`), den håndstyrte båten, og de seks nærmeste andre båtene innen 250 m. Hjemmehavna er spillerens egen (`S.home`) og lokalflåtens (`FLEET[].home`); andre spillere har ingen havn med posisjonen, så hekken viser bare navnet.
  - Test: `node tests/unit/run.mjs navn` (plassene per type, havna under navnet og mindre, ingen navn i baugen, høyst halve hekkens bredde, fargen ved omlakkering).
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
  - Flagget lagres i `b.liv.flag = {c, s}` og går til de andre som `f:SE.vimpel`. Andre spilleres flagg tegnes fra TP1 (steg 108, 13.11.2026), se «Det de andre ser» under.
  - **Flaggtidene** (`flagUp(H, p)` i `core/03-simulation.js`, Jonas 07.10.2026): flagget er oppe fra kl. 08 (mars–oktober) eller kl. 09 (november–februar) til solnedgang, senest kl. 21. I Nordland, Troms og Finnmark (nord for 65° N) er det oppe kl. 10–15 fra november til februar. Det følger flaggforskriften fra 1927, som gjelder offentlig flagging. Malerverkstedet viser flagget uansett tid. Vimpelen (4.25) har ingen tider og henger oppe døgnet rundt.
  - Usikkert: noen kilder om flaggskikk til sjøs sier at flagget kan føres hele døgnet under fart. Det har vi ikke kunnet bekrefte i en primærkilde, så spillet bruker de samme tidene til sjøs og i havn.
- **Registreringsmerke** (steg 5, 07.10.2026):
  - Merket består av fylkets bokstaver, et løpenummer og kommunens bokstaver, malt på begge sider nær stevnen (ervervstillatelsesforskriften §§ 22–23).
  - Bokstavene hentes fra `src/data/regmerke.json` (`tools/regmerke/regmerke.py`). For hver av 193 kystkommuner er det bokstavene de fleste av kommunens fartøy har i Fiskeridirektoratets sluttsedler, og løpenumrene som er i bruk.
  - Kommunen er hjemhavnas. En kysthavn er et mottak med kommunen sin. De gamle Senja-havnene står i `PORTK`, der Sommarøy og Brensholmen ligger i Tromsø.
  - `regOf(b)` gir båten et nummer fra 100 til 999 som ingen ekte båt i kommunen har, trukket tilfeldig (`regDraw`), og lagrer det i `b.reg`. Jonas 07.11.2026: «når de tildeles tilfeldige nummer må vi etterstrebe å skape variasjon». Før kom nummeret fra båtens navn, id og type, så alle med samme hjemhavn, båttype og navn fikk samme merke (en båt uten navn heter merket sitt, `boatUnnamed`). Hver kommune har minst 817 ledige numre. En båt som alt har et nummer, beholder det.
  - Bokstavhøyden følger § 23: 45 cm fra 15 m, 25 cm fra 9 m, ellers 15 cm. Stripa ligger en tidel fra stevnen (`markStrips`, `sideStrip`).
  - **En modell kan si hvor merket og navnet står** (OB11 runde 2, 11.11.2026): `anchors.marks` (to striper som `sideStrip` gir dem, styrbord og babord) leses av `markStrips` foran søket, og `anchors.nameHouse` (én stripe over styrhusets front) av `houseFront`. Breisjarken har begge (Jonas 11.11.2026: «Navnet på båten skal bare være over styrhusvinduet på bremen og på akterspeilet. det andre nummeret kan gjøres mindre å plasseres høyere opp på det hvite»): navnet på bremmens forkant, og merket i 20 cm bokstaver på den hvite skansen i baugen. Søket kjenner bare skrogets egen maling og finner aldri en hvit skanse over fenderlista. 20 cm er under § 23 slik den står over (25 cm fra 9 m); Jonas ba om mindre, og spurt om det skal stå, svarte han 12.11.2026: «20cm går bra.» Tallet er `MARK_H` i `tools/boats/malo36.py`.
  - Fargene er hvitt på mørkt skrog og svart på lyst, slik § 23 sier (hvitt på svart eller svart på hvitt).
  - Merket står også på ervervstillatelsen under Papirer, og andre spillere ser det (`m:T.112.LK`, der Æ, Ø og Å reiser som 1, 2 og 3).
  - Ønskenummer (`des_reg`, 29 kr): spilleren velger løpenummeret selv, og bare en ekte båts nummer avvises (`regUsed`). To spillere kan ha samme nummer, og to av spillerens egne båter også (Jonas 07.11.2026: «om du betaler penger for registreringsnummeret så skal du få ha hva du vil, det er jo egentlig bare kosmetisk. Kartplotteren viser jo navnet på båten uansett» og «to ulike spillere skal kunne ha samme nummer om de ønsker»). Spillet spør derfor ikke serveren: `reg_claim` (`20261007100000_designs.sql`) sa «too many» for godt etter ti numre per spiller og ble spurt først etter betalingen. `reg_claims` og `reg_claim(text)` står ubrukt i databasen, og sider fra før oppdateringen kaller den til de lastes på nytt.
- **Kjenningssignalet** (L4 i Ø11.5, 06.11.2026; merkeforskriften FOR-2002-06-27-754, lest ordrett på Lovdata 05.11.2026):
  - § 5: fiskefartøy fra 10,67 m (og skip i skipsregistrene, som alle våre fra 15 m er) har kjenningssignal. Formen under 15 m er to bokstaver og fire siffer, som VH5150 (Store norske leksikon). `callOf(b)` i `core/06b-coastports.js` gir båter fra 10,67 m et signal fra Norges blokk som fiskeflåten bruker (LF, LG, LH, LK eller LM og fire siffer) og lagrer det i `b.call`. Det følger fartøyet, ikke eieren (som registreringsmerket gjør), så en båt som byttes inn, tar sitt med seg (`switchVessel` sletter `b.call`).
  - **Aldri et ekte:** `REGM.c` (nytt felt i `src/data/regmerke.json`) er de 4 003 kallesignalene på to bokstaver og fire siffer i Fiskeridirektoratets sluttsedler 2024–2025 (feltet «Radiokallesignal (seddel)»), fra `python3 tools/regmerke/regmerke.py kall`, som legger til `c` uten å røre `k`. Et lagret signal som viser seg å være ekte, byttes. Sluttsedlene har bare båter som har levert de to årene; et fartøy som ikke har levert, kan i prinsippet ha et signal vi gir (som for registreringsmerket).
  - § 9: under 15 m merket utvendig på skroget med tegn på minst 6 cm; fra 15 m merket varig. Spillet maler det på begge sider akter for registreringsmerket, en firedel til en tredel av lengden fra stevnen, med tegn på 12 cm under 15 m og 30 cm fra 15 m (`callStrips` i `vessel3d.js`, den samme søkingen som merket: `stripSearch`, klar av det som stikker ut, ankrene og merket, på jevn maling), hvitt på mørk maling og svart på lys (`drawCall` i `view3d/13-instruments.js`). Bare på egen båt, som merket.
  - Ikke gjort: signalet på AIS-kortet og i VHF-meldingene (Ø11.3), og at andre spillere ser det.
- **Navnet etter § 9** (Ø11.5): fra 15 m navnet og hjemstedet akter med bokstaver på minst 15 cm, under 15 m navnet på minst 6 cm (`transom` prøver ikke mindre enn det, og bare der hekken ikke har plass, faller den tilbake til de gamle størrelsene). På kyst21 blir hjemstedet derfor like høyt som navnet (15,5 cm mot 8,5 cm før). Navnet forut er styrhusfronten fra Jonas' valg 04.11.2026 («Fjern også navnet som står i baugen»), og på havbåtene modellenes egne navneplasser på baugen. At navnet under 15 m skal være «godt synlig fra begge sider», er tolket som styrhusfronten og hekken (antatt, se backloggen).
- **Etter gjennomgangen 07.11.2026**: husflagget som ble prøvd med logoen, følger med gjennom betalingen (`S.cosWant.logoFlag`), og et design legges på båten det ble kjøpt på (`shopGive` i `withVessel`), ikke båten du er om bord i når kjøpet kommer. Funnet samme dag og rettet: logoen hadde ingen plass på skroget til `ringnot38` (se Rederilogo under), og ønskenummeret stoppet etter ti numre (`reg_claim`, se over).
- **Rederilogo** (steg 6, 07.10.2026; `des_logo`, 49 kr; `supabase/migrations/20261007110000_logos.sql`):
  - Logoen er rederiets (`S.logo`), ikke båtens, og står på alle båtene. Den lages av ett av seks tegn (`LOGOSYM`), opptil tre bokstaver og to farger fra skrogpaletten (`{kind:'g', sym, txt, c1, c2}`), eller er et opplastet bilde (`{kind:'u', img, ver}`).
  - Et opplastet bilde gjøres 256 × 256 (hele bildet, resten gjennomsiktig) og WebP, ellers PNG, på høyst 58 000 tegn (`upload` i `10j-paint.js`). Det prøves på båten før kjøpet, som alt annet.
  - Logoen står midtskips på begge sider (`logoStrips`, en kvadratisk stripe ved halve lengden, høyst 0,06 L + 0,3 m) og kan heises som rederiflagg (flaggkoden `LOGO`, som krever logoen og ikke flaggene).
  - **Ringnotbåten** (07.11.2026, funnet i gjennomgangen av butikken: logoen ble aldri tegnet på kystnotbåten 38,55 m, de 14 andre typene hadde den): skrogets blå (malingssone 1) går også langs rekkverket og listene på overbygget, så `sideStrip` tok toppen fra listen på styrhuset (9,6 m) midtskips og fant ingen flate under. Der de to vanlige forsøkene (halve lengden og 0,42) ikke finner plass, står logoen nå på selve feltet av skrogmaling (`sideStrip(…, band)`: det sammenhengende blå båndet mellom den hvite stripa og skansekledningen, 1,1–2,8 m), på hver side for seg midt i den strekningen nærmest midtskips (0,35–0,65 av lengden) der skroget er bart en kvart logohøyde rundt (`stripBare`: ingen koøye, intet utløp, ingen list fra 2 cm inn til 50 cm ut), malingen er skrogets egen og jevn (`stripPaint`), og den ikke ligger på navnet, merket eller kallesignalet. Koøyene og utløpene er ekte hull og ulike på de to sidene, så logoen står ved z 3,73–4,70 på styrbord (mellom to grupper koøyer, 1,25 m og 0,87 m fra dem) og z 5,24–6,21 på babord (akter for et utløp), 1,0 m høy (0,6 av båndet). Det første forsøket la logoen på samme plass på begge sider, over en gruppe koøyer; det neste nærmest midtskips, 0,5 m fra koøyene på den ene siden og 1,6 m på den andre. De andre 14 typene er uendret (alle plassene sammenlignet før og etter i Node). Modellen er ikke endret.
  - Andre ser den gjennom malingskoden: en laget logo reiser i sin helhet (`l:g.anker.JH.marine.hvit`), et bilde bare som versjon (`l:u.3`), og hentes med `logo_get` etter spillerens id i den felles verdenen (`peerLogo` i `10h-world.js`, mellomlagret per spiller og versjon).
  - Serveren tar ett bilde per spiller (`logos`, `logo_put` krever kjøpet, høyst 30 opplastinger om dagen, bare data-URL for WebP, PNG eller JPEG). Uten skyen (artifacten, testene) blir bildet bare på enheten.
  - Jonas (07.10.2026): «spillere kan laste opp hva de vil, men la meg eventuelt kunne fjerne det i admin-dashboard om det er støtende, samtidig som jeg gir en forklaring på hvorfor. Spilleren skal dermed kunne velge et nytt bilde gratis.» Admin-fanen **Logoer** viser alle bildene og tar et bort med en grunn (`admin_logos`, `admin_logo_remove`). Da får ingen bildet lenger. Ved neste start ser spillet det (`logoCheck`, `logo_mine`), tar logoen av båtene og flagget og sender en melding med grunnen. Kjøpet er spillerens, så et nytt bilde koster ingenting.
  - Vilkårene (punkt 5) og personvernsiden («Rederilogoen du laster opp») sier dette.
- **Test:**
  - `maletest`: knappen, siden, prøvefargen, at første fargevalg er gratis, prisen, for lite penger, lagringen, lukking og innbytte, designene, flagget, registreringsmerket, logoen (laget, opplastet og tatt bort). Fra 07.11.2026 krever den plass til merket og logoen på hver type (før godtok den at én manglet, og det var ringnotbåten), og `tests/unit/vessel3d.test.mjs` sjekker i Node at hver type har plass til logoen, merket og kallesignalet, at logoen ikke ligger på navnet, merket eller kallesignalet, og at ringnotbåtens logo står på bar, jevn skrogmaling på begge sider.
  - `cloudtest`: malingen går opp og ned, og en server uten den ennå gir ingen avbrudd.
  - `sqltest`: feltet vaskes, kortes og leveres videre; designene etter kjøp og refusjon; ønskenummeret; logoen (bare etter kjøp, henting, fjerning med grunn og nytt bilde).
  - `regnrtest` (07.11.2026, stubbet sky som `kjoptest`, databasen som den var): en annen spillers nummer går rett til Stripe og på båten når kjøpet kommer tilbake, uten å spørre databasen; elleve numre på rad på én båt; en egen båts nummer; en ekte båts nummer avvises.
  - `tests/unit/regmerke.test.mjs`: 60 like båter med samme navn og hjemhavn får minst 50 ulike numre, i 100–999 og ingen ekte båts, i Kristiansand, Bømlo, Ålesund, Bodø, Tromsø, Hammerfest og Båtsfjord. `tests/unit/navneklash.test.mjs`: ingen to navn på toppnivå i sidens skript er like.
  - `admintest`: fanen Logoer tegnes i demoen.
  - Navnene er sjekket på bilder fra siden for alle båttypene.

### Det de andre ser: flaggene og bufferne (TP1, steg 108, 13.11.2026)

Jonas 12.11.2026, tilpasning V1 A: «TP1 over linja». Det som er solgt, skal ses av de andre (`docs/planer/tilpasning.md` TP1).

- **Flagget på de andre** (`drawPeerFlags` i `view3d/13-instruments.js`, kalt etter `drawNPCNames` i `view3d/20-trawl-seine.js`):
  - De seks nærmeste spillerbåtene innen 250 m med glasset inne, som navnene. Flagget står ved båtens flaggstang (`GEO(type).pole`), slik som på egen båt.
  - Flagget leses av koden hennes med `livFlag` (`vessel3d.js`): det hun har kjøpt, rederiflagget med logoen (laget, eller bildet hennes fra `peerLogo`; Norge til bildet er hentet, som på egen båt), ellers Norge i rektangel.
  - Flaggtidene er `flagUp` der hun er, spurt én gang per spillminutt. Stikkprøven i januar (`tests/unit/flaggtider.test.mjs`): Kristiansand og Ålesund oppe fra kl. 09 til solnedgang, Hammerfest kl. 10–15.
  - Bildene ligger i en pool etter flagg, form og logo (høyst 8, den eldste slippes). Hver båt har sin egen duk (høyst 8), regnet én gang per bilde med den tilsynelatende vinden mot hennes kurs og fart (`clothInto`, `clothStep`; egen båt bruker de samme).
  - NPC-ene får ikke flagg i dette steget. Tellerne: `G3._debug.peerFlags`.
- **Bufferne** (`npcKB`, `nkbCap` i `view3d/20-trawl-seine.js`; `livPaint`, `npcModelKey`, `npcModelDrop` i `vessel3d.js`):
  - En spillerbåts modell nøkles bare på den delen av koden som endrer malingen (`h o d r t v s g x`, `livPaint`). Merke, logo og flagg tegnes over modellen. To båter med lik maling deler modell og buffere, og en uten maling deler lokalflåtens umalte modell.
  - Taket: høyst 12 malte modeller (`NKBP.cap`). Over taket slippes den som lengst ikke har vært tegnet, når det er minst 20 s siden. Bufferne slettes med `gl.deleteBuffer`, og modellen tas ut av `NPCMOD`. En modell som tegnes, slippes aldri, så alle båtene i syne beholder malingen, og taket kan stå over 12 så lenge flere ulikt malte båter er nær. `npcWarm` lager en malt modell på forhånd bare under taket, ellers lages den når båten tegnes første gang (slik det var før Ø3c); ellers ville taket og oppvarmingen bygd de samme modellene om igjen.
  - Tellerne: `G3._debug.npcBufs` (`models`, `made`, `dropped`, `mb`, `all`).
  - Stand-in-båtene i målingen (`bench:true`) teller ikke som «andre spillere møtt» i merkene (`core/09f-merker.js`).
- **Målingen** (`tests/flaggshot.py`, og `#benchpeer` i spillet, `G3.benchPeers`): 20 stand-in-spillere rundt egen båt, først med hver sin maling og hvert sitt merke («ulik»), så med samme maling og hvert sitt merke («lik»). Det som ble sendt til GPU-en, er talt ved WebGL (`bufferData`), så de samme tallene kommer fra et bygg før steget. SwiftShader, 1280×800:

  | | Før (arbeidsgrenen 13.11.2026) | Etter (steg 108) |
  |---|---|---|
  | 20 båter, hver sin maling og sitt merke: MB sendt til GPU-en | 66,4 | 46,5 |
  | … buffere laget / slettet | 461 / 50 | 333 / 26 |
  | … malte modeller laget / i live etterpå | (ingen tellere; én per kode og nivå) | 19 / 20 |
  | 20 båter, samme maling og hvert sitt merke: MB sendt til GPU-en | 43,3 | 6,2 |
  | … buffere laget / slettet | 88 / 1 | 11 / 53 |
  | … malte modeller laget / i live etterpå | (én per merke) | 2 / 12 |
  | Bildetid (ms, SwiftShader, bare en sjekk) | 275 / 5 933 | 163 / 171 |

  Før steget fikk hver spillerbåt egen modell når merket var ulikt, og ingenting ble sluppet (1 buffer slettet). Etter deler båtene med lik maling modell (2 nye, en per nivå), og de malte modellene som ikke tegnes, slippes over taket (53 buffere slettet). Med hver sin maling sendes det mindre enn før, fordi `npcWarm` ikke lenger lager begge nivåene på forhånd over taket. 5 933 ms i «før, lik» er SwiftShader som hang i ett bilde; tallet sier ingenting.

  Tallene som teller, måler Jonas på Pad 3 med `#benchpeer` (`docs/spill-dette/108.md`).

### Navnets skrift og farge, og hjemhavna for andre (TP2, steg 109, 13.11.2026)

Jonas 12.11.2026, tilpasning V4 B: «Tre skrifter og farge»; V2 A: 29 kr (`des_navn`, ekte penger: PR #82 til Jonas). Planen: `docs/planer/tilpasning.md` TP2.

- **Skriftene** (`NAMEFONT` i `vessel3d.js`, `NFONT` og `nameCanvas` i `view3d/13-instruments.js`): blokk (`b`, Archivo halvfet 700 i normal bredde), smal blokk (`s`, Archivo 700 i bredden `condensed`, 78 % så bred), antikva (`a`, Source Serif 4 600). Begge skriftene lå alt i sida; ingen ny skrift.
  - **Blokk er uendret.** Koden ba før om `semi-condensed`, men satte `fontStretch` før `font`, og det nullstiller bredden. Målt i Chromium 13.11.2026: «HAVBRIS ÅSEN» 760 px i 100 px blokk, 591 px i smal blokk, 675 px i `semi-condensed`. Navnene har altså alltid stått i normal bredde, og blokk beholder det.
  - En nettleser som ikke kan smale inn skriften på lerretet, smaler bokstavene (×0,8) i stedet.
  - Antikva-skriften hentes første gang et navn skrives i den (`serifNeed`), og navnene i den tegnes på nytt når den er inne.
- **Fargen** (`NAMEINK`, `nameInk`): automatisk (svart eller hvit etter malingen, `nameInkLight`, som før), hvit, svart, gull eller en farge fra `HULLPAL`. En valgt farge brukes bare der kontrasten mot malingen under er minst 3:1 (`NAMEMIN`, WCAGs krav for stor tekst, `contrastOf`); ellers står navnet i svart eller hvitt der. Kortet sier fra når det skjer (`inkWeak`). Gjelder navnet på styrhuset, på hekken og hjemhavna under det; registreringsmerket og kallesignalet står fortsatt i svart eller hvitt (§ 9 i merkeforskriften).
- **Per båt:** `b.liv.nf` og `b.liv.nc`, kjøpt én gang for kontoen (som designene) og satt på hver båt i Malerverkstedet. Prøves før kjøpet (`PAINTPRE`). Et nytt maleri beholder båtens skrift også der kjøpet ikke er kjent ennå på enheten.
- **Koden til de andre** (`livStr`): `n:<skrift>.<farge>` (betalt, `des_navn`) og `k:<havnas id>` (gratis), begge sist, så en server som fortsatt kutter ved 160, kutter dem og ikke logoen. Havnas id kjenner alle spill (`PORTS`: mottakene langs hele kysten, Senjas havner og fars naust); hjemhavna er `S.home`, ellers `HOME0`, det samme som egen hekk viser. `livPaint` og `livParse` ser bort fra begge, så båtene deler fortsatt modell (TP1). De andre leser dem med `livName` og `livHome`, slått opp én gang per kode (`livNameOf`).
- **Serveren** (`supabase/migrations/20261113160000_liv_navn.sql`): `pos_put` tar 320 tegn (var 160; den lengste koden før var 151). De betalte delene sjekkes mot tabellen `liv_paid` (bokstav og produkt: `r t v s g l n`), så et nytt betalt felt er en rad; flagget (`f`) står som før (nasjon `des_flagg`, rederiflagg `des_logo`). Ingen leser tabellen utenom `pos_put`. Migreringen kjøres av Jonas på testprosjektet før pushen, og i produksjon rett før slippet.
- **Lageret av navneteksturer** er fortsatt 28 (`NTX`), nøklet på høyde, skrift, tekst og blekk. Tellerne: `G3._debug.names` (hva bildene skrev), `G3._debug.nameTex` (antall og millisekundene for det første navnet i hver skrift).
- **Testene:** `tests/unit/navn.test.mjs` (kontrasten over alle farger og all maling, fallet tilbake, koden), `maletest` (kortet, prøving, kjøp), `sqltest` (320 tegn, `n:` bare med `des_navn`, `k:` alltid, ingen leser `liv_paid`), `cloudtest` (en kode over 160 går opp hel; en annen spillers skrift og hjemhavn kommer ned), `tests/navnshot.py` (3D: tre skrifter på tre båttyper, hjemhavnene Kristiansand, Kristiansund og Båtsfjord, lageret).

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
| `sjarkny` | Ny hurtigsjark 10,99 m, 650 hk (2027) | 10,99 × 4,68 × 2,06 | 15 | glassfiber | lasterom 12 m³, 7 000 kg | 1 800 kg | 650 hk, 10/12 kn | 55 l/t, 364 nm | 1 + 3 / 4 / 2 | 10,5 mill. (ny, levert med en gang) | åpen og lukket gruppe |
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
| `sjarkny` | styrhus | – | bysse | ja | ja | – | 2 / 1 | ja | – | – / – | linehaler, garnhaler, teinehaler | 60 / 30 / 12 | 400 kg | 4 |
| `breisjark` | styrhus | ja | bysse | ja | ja | – | 2 / 1 | ja | – | – / – | linehaler, garnhaler, teinehaler | 100 / 33 / 6 | 450 kg | 2 (OB11, valg 32: to juksaplasser på den lave ripa om styrbord; akterskansen er 1,5 m høy) |
| `kyst15` | styrhus | ja | bysse | ja | ja | ja | 3 / 2 | ja | 1 | – / – | linehaler, garnhaler, teinehaler | 160 / 33 / 30 | 800 kg | 4 (OB12, valg 31 A: to juksaplasser i haleporten og to i luka akter for den; resten av sida er shelterdekkets vegg) |
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

**Påbudt utstyr følger båten (V6 A, Ø11.5, 06.11.2026; Jonas 28.10.2026: «Det som er påbudt, følger med båten. Butikken selger det bare der det er valgfritt. Gamle lagringer får det som mangler, gratis»):** `reqOf(V)` i `core/02-species-gear.js` gir det forskriftene krever, lest på Lovdata 06.11.2026: VHF med DSC på dekkede båter og åpne med styrhus (FOR-2013-11-22-1404 §§ 64 og 68; fra 15 m FOR-2000-06-13-660 § 9-6), AIS fra 15 m (§ 10-4a; under 15 m bare AIS-SART, som oppbevares inne) og brovaktalarm fra 10,67 m på båter med selvstyring og fartsområde over fjordfiske (§ 77; fra 15 m § 10-7). Alle båtene med styrhus her har Autonav og kystfiske eller mer, så det blir: skiffen og trebåten ingenting, snekka, plastsjarken og havsjarken VHF, hurtigsjarkene, breisjarken og kystbåten på 14,99 m VHF og brovaktalarm, og alle fra 15 m VHF, AIS og brovaktalarm. Det står i `V.req` og er lagt til `V.std`, så det følger båten fra verftet, i Båthandelens datablad og hos megleren. `applyVessel` legger det på båten som bindes (`reqFill`), også etter innbytte, og `ui/11-boot.js` gir en gammel lagring det som mangler, gratis, med én linje i loggen. I utstyrsbutikken står det under «Om bord» med «påbudt, følger båten», og `equipBuy` selger det ikke. Brovaktalarmen er dermed alltid om bord fra 10,67 m (døsingen ved roret i `core/15-energy.js` vekkes av den).

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

**«Neste mål»** står øverst i Båthandel og som en linje på telefonens hjemskjerm, og følger stigen: håndjuksa, første juksamaskin, blad B (landingsdager og verdi, knapp til Papirer), første båt med hjemmel (egenkapitalen banken krever), neste hjemmel opp, kystbåten på 14,99 m, «Stift Rederi AS» og til sist det billigste havfiskefartøyet som kan kjøpes (skrog og tillatelse, `havPrice`). De to neste stegene vises.

**Stigen er flåtens** (Jonas 07.11.2026: med en autoliner og to sjarker og 93 millioner på konto ba hjemskjermen om første juksamaskin, som autolineren ikke kan ha, og etter den om den gamle tresnekka med hjemmel under 7 m; «nå er den bare irriterende og stjeler plass»). `goals()` i `ui/phone/10-fartoy.js` ser på hele flåten, ikke båten du følger, og et steg er passert når flåten har nådd det eller et steg over det:
- Håndjuksa og første juksamaskin gjelder bare den første båten alene: de er borte når flåten har mer enn én båt, en båt med hjemmel eller en båt utenfor åpen gruppe. Juksamaskinen foreslås bare til en båt som kan ha en (`jukseMax` over null).
- Med et havfiskefartøy i flåten er stigen klatret: blad B, hjemlene, kystbåten og havfiskefartøyet hoppes over. Bare «Stift Rederi AS» kan stå igjen, og når selskapet er et AS, er Neste mål borte fra hjemskjermen og Båthandel (kortet for første uke eller fartstiden fyller da raden alene).
- Det siste steget het «Havfiske, kommer når kartet utvides vestover» til autolineren kunne kjøpes (H2); nå er det det billigste havfiskefartøyet som ikke er låst, for flåten uten innbytte.
- `vesseltest` sjekker det (sett rød på bygget før rettingen: «Håndjuksa» og «Første juksamaskin» med autolineren og sjarken).

**Båthandel** (Verft → Båthandel, `market()` og `sheet()` i `ui/05-phone.js`):
- Fanene er Åpen gruppe, Med hjemmel, Kystflåten og Havfiske. Hvert kort har et sideriss i SVG (`vesselSVG`, laget fra den samme 3D-spesifikasjonen, så det virker uten WebGL), navn, mål og pris.
- Databladet har Generelt (pris, mål, vekt, lasterom, is, drivstoff, motor, fart, mannskap, køyer, hva båten tåler, gruppe og fjordlinja), Redskap, Hjemmel og Mannskap om bord, og knappene «Kjøp og bytt inn», «Kjøp til flåten» og «Se båten i 3D».
- «Se båten i 3D» (`G3.showroom(type)`) viser båten flytende utenfor havna med et kamera som går sakte rundt. Brikka `#showChip` har navn, mål og «Tilbake».
- Før rederiet har en båt i lukket gruppe, kjøpes en båt i åpen gruppe bare ved å bytte inn den du har. Et rederi kan ha én båt i åpen gruppe.
- **Havbåtene** (rettet i H2e 06.11.2026): prisen ved kjøpsknappene er skroget med tillatelsen (`havPrice`), slik kjøpet betaler den; før viste mellomlegget og «Til flåten» bare skroget (57,4 og 70 MNOK mot 202,8 og 215,4 MNOK betalt), og notatet «Uten hjemmel kan hun bare ta … som bifangst» sto under. Nå står det at tillatelsen følger med og at hun fisker på fartøykvoten. Fanen Havfiske sier at autolineren kan kjøpes og at de merket «kommer» ikke kan det ennå. Funnet av `havtur`.

**Salg av egen båt (07.11.2026, B i `docs/planer/etter-tonys-test.md`; Jonas: V4 A, V5 A, V6 A):** «Selg for» full verdi i Rederi er erstattet av **«Selg nå til Kystmegleren»** for 90 % av `vesselValue` (B4, `mbQuickSell` i `core/09k-market.js`: lånene innfris først, mannskapet går i land, hjemmelen går tilbake til eierne i registeret, og båten forsvinner). Innbytte på verftet gir fortsatt hele `vesselValue`. **«Legg ut til salgs»** selger henne til en annen spiller hos Kystmegleren (startpris 40–160 % av verdien, «Kjøp nå», 1 t, 6 t, 1 døgn eller 3 døgn i ekte tid): hun flyttes til nærmeste verft og er låst (`b.sale`: kan ikke gå ut, «Ta roret» er grått, verken levering, innbytte eller hurtigsalg) til salget er over; solgt går hun ut av flåten med prisen minus 5 %, usolgt er hun din igjen. Det som følger henne til kjøperen: navnet, byggeåret, motortimene og servicen, groen og skaden, verftets ombygginger, utstyret, redskapet om bord og hjemmelen med årets fangst på den (merket på kortet, B8). Malingsdesignet og registreringsmerket blir hos selgeren. Hele systemet står i `handel-og-steder.md` («B Båtsalg mellom spillere»).

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

Bare båten, aldri fiskeutstyr eller haler. Tallene står i `core/03-simulation.js` (`HOLDUP`, `ENGUP`, `PROPUP`, `UPGS`), jobbene i `core/06-services.js` (`finishJob`, kind `upg`), kortene i `ui/05-phone.js` (verftet, Oppgraderinger) og testen i `tests/yardupgtest.py`. Lagret per båt: `b.holdLv`, `b.engLv`, `b.propLv`, `b.upg = {nøkkel: trinn}`.

- **Prisen** er en andel av båtens pris (`upPrice(pc)`, minst 5 000 kr), så en tråler til 60 mill. koster millioner og en snekke noen tusen. Hver jobb tar 30 ekte minutter (`YARD_H`).
- **Lasterom** (ikke havbåtene, `cls: 'hav'`): +20 %, +40 %, +70 % til 3, 6 og 10 % av båtprisen (var +25, +60, +100 %). Eksisterende lagringer beholder trinnet og får de nye tallene.
- **Motor** (ikke påhengsmotor): +10 % og +20 % kraft til 6 og 11 %. Fartsgevinsten er bevisst liten mot Trim (+50 til +100 %): mer diesel (`fuelK`) og motorservice ×1,2 og ×1,5 (`svcCostOf`).
- **Mannskap, bare på båter med køyer** (`berths` > 0): lugarer (tretthet ×0,92 / ×0,85 / ×0,78 på sjøen), messe og bysse (måltidet 24 / 18 / 12 minutter og humør +2 / +4 / +6), tørkerom og bad (kuldeslitet ×0,85 / ×0,7). Virkningen går gjennom `BOAT.fx` til `crewTick` (`core/04-crew.js`) og `mealMinute`.
- **Isolert lasterom** (ikke havbåtene): isbruken per kilo ×0,85 / ×0,7. **Drivstofftank** (ikke påhengs- og havbåter): ×1,25 / ×1,5. **Stabilisering** (fra 9 m): slingrekjøl, og gyrostabilisator fra 25 m; `BOAT.sea` ×0,9 / ×0,78 (mindre fartstap i sjø) og mannskapets sjøgang teller mindre.
- **Propell** (OPP3 av `docs/planer/oppgraderinger.md`, 12.11.2026; ikke påhengsmotor, ikke havbåtene: `propFits`): tre trinn i `PROPUP`, lagret som `b.propLv` (en lagring uten feltet har ingen). Planende skrog +10, +20 og +30 % fart, deplasementsskrog +5, +10 og +15 %; forbruket −5, −10 og −15 %, akselerasjonen +5, +10 og +15 %; prisen 2, 4 og 7 % av båtprisen, minst 2 500, 4 000 og 6 500 kr. Jobben `prop` i `YARD_KINDS` husker prisen (`j.kr`) og båttypen (`j.ty`): byttes båten mens den venter, eller er trinnet ikke lenger det neste, betaler verftet tilbake, som en avbestilling (`jobx`). Kortet under Verft › Oppgrader (`ui/phone/12-utstyr-redskap.js`) viser knop og liter i timen ved marsjfarten nå og med neste trinn (`boatWith`), spør «Bekreft · kr» fra 10 000 kr og gir kvitteringen med trinnet; bestillingen sender `cloudEv('upg', {k:'prop', lv})` til trakten. Propellen følger båten ved salg mellom spillere (`mbPack`/`mbUnpack`).
- **Fartsregelen** (Jonas 07.11.2026, punkt 7; `speedSum` i `core/03-simulation.js`): propellen, motoren (`speedOfPower(P) − 1`) og trim (`T.x − 1`) legges sammen av båtens egen fart én gang i `applyVessel`, aldri ganget oppå hverandre: `vmax`, `vcruise` × (1 + sum), akselerasjonen × (1 + propell + 0,3 · motorens kraft + trim), forbruket `fuelK` × (1 + 0,4 · (P − 1) − propell). Trim gir like mange knop med og uten propell. `trimSet`/`trimEnd`, `trimRescale`, `speedPin` og `dynCalOf` er som før.
- **Innbytte** (`switchVessel` i `ui/phone/13-mannskap-bank-meld.js`, 12.11.2026): verftets arbeid er skrogets og blir med den gamle båten: motoren, propellen, lasterommet og ombyggingene (`engLv`, `propLv`, `holdLv`, `upg`). Før tok den nye båten dem med gratis. Bladet i markedet sier det før kjøpet (`data-swapyard`), og loggen etter. Det regnes ikke i innbytteprisen (`vesselValue`), som trinnene (valg 9 A). Jonas 12.11.2026 bekreftet regelen for alt verftets arbeid: «A: Alt blir med skroget». Verftsjobbene på det gamle skroget som venter eller går, betales tilbake og tas av køen ved innbyttet (`j.kr`, ellers prisen fra den gamle båten), og `finishJob` betaler tilbake en jobb for en annen båttype eller et trinn som ikke lenger er det neste (`yardStale`, `j.ty`). Trim-appens «Toppfart med den» (`ui/phone/06-render.js`) regnes med `trimVmax(k)`, så den lover det trimmen gir (rettet i OPP3 etter at HO3 var ferdig; `yardupgtest`).
- **Ikke gjort:** havbåtene har ingen oppgraderinger for lasterom (tankene er faste); lugarer gir ikke ekstra mannskapsplass; ingen animasjon.


## Båten og utstyret, og utstyrstrinnet i Neste mål (OPP4 av `docs/planer/oppgraderinger.md`, 07.11.2026)

Jonas 07.11.2026 om «én side for båten og utstyret»: «enig». Klarsignal ved at han ba om startmeldingen for OPP4 (køen steg 54).

- **Siden** (`kitCard` i `ui/phone/10-fartoy.js`) står først under Om bord › Båten (`fartoy('min')`), for båten du følger. **Gjort om samme dag etter Jonas' tilbakemelding** på første utgave (07.11.2026 16:29: «Det er jo nesten umulig å skjønne hva som skjer på denne siden når det er så mye tekst og greier … Brukerne kommer jo bare til å bli forvirret å ikke skjønne noe. Det må gjøres mer intuitivt for brukerne»): øverst navnet på båten, «n av m trinn» med en stolpe og «?» til Håndboka (`lex_oppgrad`, der forklaringen står); så per handelssted en overskrift («Utstyrsbutikken», «Verftet») med «Du er her» eller «Nærmeste: <sted> · n nm» og «Autonav dit»; under den én rad per stige med bildet (varekortenes `ICPIC`, og egne små bilder `BU_IC` for verftets ombygginger), navnet og prikkene (●●○, `data-lv`/`data-max`; første prikk er det båten har uten kjøp), én kort gevinst i grønt i spillerens egne tall («300 → 330 kg/t ved bordet», «−30 % fisk over ripa», «53 → 26 min/stamp», «7,0 → 7,2 kn», «60 → 75 L») og prisen for båten til høyre. Står du der det selges, er prisen en knapp til siden der det kjøpes (grå når pengene ikke rekker); ellers står bare prisen. Det som kan kjøpes, står først med det billigste øverst; det som monteres eller bygges («Monteres», «På verftet»), etter; det som er fullt, sist, med alle prikkene fylt, en hake og navnet på trinnet. Nederst to fliser med tall.
- **Stigene** (`LADDERS`, én oppføring hver; `ladders()` tar bort det som ikke passer båten, og stiger med bare ett trinn), med gevinsten på raden: kniv (kg i timen ved bordet) og høtt (færre fisk over ripa, og raskere linetrekk der båten tar line; `tierLad`, alle `EQUIP` med `tiers`), juksa (håndjuksa som første prikk, så maskinene opp til `jukseMax`), halerne i `V.haulers` (for hånd, eller ingen for teiner, som første prikk; minutter per stamp, garn eller teine nå og med haleren), motoren (`ENGUP`: knop topp, med trimmen når den er på (summen, `boatWith`, fra OPP3) og hvor mye mer diesel, `0,4·(P − 1)`) eller påhengsmotoren på 90 hk, lasterommet (`HOLDUP`) eller karene (`karSteps`), verftets `UPGS` som passer, ekkolodd og sonar (enkelt ekkolodd, CHIRP, sonar fra 10 m), bunnstoff («gror 3× saktere», som varekortet). **Propellen (OPP3) og halernes trinn, linesetter og garnrenne (OPP2) legges til som én oppføring hver**; en vare i `EQUIP` med `tiers` får raden av `tierLad` uten mer.
- **Hvor:** per handelssted en overskrift med «Du er her» (da er prisen på hver rad en knapp til Fiskeutstyr, Elektronikk og haler eller verftets Oppgrader) eller «Nærmeste: <sted> · n nm» med «Autonav dit» (`placesNear` i `core/06c-steder.js`; `nearestKind`, som startmeldingen nevnte, finnes ikke).
- **Tallene** (flisene nederst): fisk «tapt over ripa denne uka» for båten (`railWeek`, med «i alt» for rederiet fra `S.stats.lostRail` når det er flere), og minuttene en enhet tar å trekke i dag for redskapet båten er rigget for (stamp, garn eller teine; line når hun er rigget for juksa og tar line) (`haulNow`: `gopUnitMin` som om båten trakk nå, med folkene om bord og kulda; `b.gop`, `b.status` og `b.deckStop` settes et øyeblikk og settes tilbake i `finally`. Er ingen om bord, regnes én person ved full styrke og det står «(én person)»).
- **Neste mål** (`goals()`): med én båt i flåten kommer det billigste ukjøpte trinnet (stigene med `tier`: kniv og høtt, dekksutstyrets trinn fra OPP2 og propellen; fra 12.11.2026 står OPP2s trinn på siden med gevinsten fra `icTierLine`) foran neste båt i stigen, når det koster under en tidel av henne (`price` på båttrinnene: skrog og hjemmel, kystbåten, havbåten). Verftets ombygginger og juksamaskinene er ikke med. En trebåt med 40 000 kr får «Nye sløyekniver (trinn 2)» før tresnekka med hjemmel; med høtten på trinn 1 kommer «Stålhøtt (trinn 2)» først (900 kr).
- **Kjøpet** (det fra OPP1 som hørte til): et trinn til 10 000 kr eller mer spør «Bekreft · kr» i knappen (`tierKr`, handlingen `equip` i `ui/phone/14-act.js`, og kortet i Fiskeutstyr, `ui/phone/12-utstyr-redskap.js`), og kvitteringen sier «Kjøpt: Sløyekniver, trinn 3: …» og «trinn 3 / 3 om bord». Ved innbytte på verftet blir kniv og høtt med den gamle båten (prinsipp 5), den nye står på trinn 1, loggen og båtbladet i markedet sier det (`swapTiers` i `ui/phone/13-mannskap-bank-meld.js`). Ved salg mellom spillere følger trinnet båten som tall (`mbPack`/`mbUnpack` i `core/09k-market.js`).
- **Tester:** `vesseltest` (Neste mål med trinnet), `opptest` (siden i begge formater, prikkene, Nærmeste og Autonav, bekreftelsen på kystbåten på 15 m, kvitteringen, innbyttet), `tests/unit/market.test.mjs` (trinn 3 er trinn 3 hos kjøperen).

## Fiskekar på båtene uten lasterom (04.11.2026)

Jonas 04.11.2026: «båter som ikke har lasterom oppbevarer fisken i de hvite 500 kilos fiskekarrene», antall kar etter kapasiteten, gradvis fylling uten clipping, karene løftes ut ved levering. Planen og valgene står i `docs/planer/fiskekar-dekk.md`.

- `VESSELS.kar {n, max}` på `skiff`, `trebat` og `snekke` (`land:'tub'`). Kapasiteten er karene: `holdCap = karN × TUB_KG` (500 kg). Skiffen og trebåten har ett kar, snekka to. Det er ikke plass til flere på dekk (målt i modellene), og et kar stablet oppå et fullt kar måtte vært båret dit først, så `max = n` og verftet har ingen trinn for dem (`karSteps`). En lagring med `holdLv` på en slik båt får trinnene betalt tilbake én gang (`karRefund`, kalt i `ui/11-boot.js`).
- Plassene står i modellenes `kit.tubs` (`[x, y, z, ry, liter, under]`): skiffen forut for konsollen om babord, trebåten tvers mellom midttofta og forreste tofte (forreste tofte flyttet 0,11 m forover, `snekke23.py`), snekka langs babord mot speilet og tvers i styrbord hjørne akter (bløggekaret flyttet 0,07 m forover). Iskassa (`kit.iskasse`, et blått 300 l-kar i 0,6) står under sløyebordet på alle tre.
- Fordelingen (`tubLoads`): det sløyde og isede fyller karene etter tur, det isede nederst; fisken som venter på kniven, ligger i bløggekaret. Pakkingen (`tubPack`, ren funksjon med enhetstest `tests/unit/kar.test.mjs`): lag på langs og tvers etter tur, hver fisk sjekket mot karets indre profil i sin høyde (2,5° vegger, hjørneradius 80 mm, 18 mm klaring), lengden etter vekten (`fishLen`), høyst 12 % kortere. Fisken vises én om gangen etter kiloene (`tubShown`), bare de to øverste lagene tegnes.

## Revisjonen om bord og teinene på trebåten (OB0, 09.11.2026)

Revisjonen av kystflåten båt for båt og operasjon for operasjon står i `docs/planer/om-bord.md` (opptakene fra `tests/ombord.py`, funnene F1–F24 og S1–S5, karakterene, fasene OB1–OB15 og valgene 17–23). Ingen av de ti kystbåtene er over 75/100 etter klippene; kyst15 falt fra 76 til 71.

**Jonas 09.11.2026, etter bildene av kongekrabbeteinene gjennom skroget:** «Jeg tror ikke den trebåten skal kunne holde på med krabbeteiner. Det har den åpenbart ikke plass til. Det må i så fall oppdateres i databladet til båten og gjøres slik at spillere ikke kan kjøpe det til den båten heller.» Ikke bygd ennå: `teiner` ut av `VESSELS.trebat.rigs`, og teinehaleren, krabbekaret og teinene ikke kjøpbare til trebåten (`equipFits` og `buyGate`, så kjøpet og knappene følger), med lagringene som alt har dem (OB1, steg 70 i køen). Skiffen har samme problem (valg 23).

**Jonas' svar på valgene fra OB0 (09.11.2026, valg 17–23 i køen):** skalaen for båtenes karakter er skrogutforming 20, detaljer 20, lanterner 5, styrhus 10, arbeidsflyt 25 og utforming av dekk 20 (grensen 75 står); `disp` er den tomme båten for alle båtene, som for kyst15; garn skal kunne trekkes for hånd på trebåten og skiffen; skiffen mister teinene som trebåten; fasene bruker offentlige bilder av samme type og sier hvilke, «slik at jonas har kontroll under prosessen»; kyst15 får «en åpning i hekken for setting av garn, liner» og «en garn-binge for oppbevaring av garn ombord»; plastsjarken: «Dette er kanskje den svakeste båten vi har. Du får frie tøyler til å lage en realistisk fiskebåt.» Ingenting av det er bygd ennå (fasene OB1–OB15 i `docs/planer/om-bord.md`).

