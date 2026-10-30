# Skyen, innloggingen og den felles verdenen

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.20 Skyen: innlogging, skylagring, måling og admin-dashbordet (04.10.2026)

Jonas' valg: gratis å spille med kjøp via Stripe, påkrevd innlogging med WorkOS, Supabase, samtykke til statistikk og bare han som admin. Hele lista står i `docs/lansering.md`.

- **Konfigurasjon:** `src/data/cloud.json` har bare offentlige verdier: vertene (`hosts`), Supabase-adressen og `anon`-nøkkelen, WorkOS-klient-ID-en, et eventuelt eget innloggingsdomene og den publiserbare Stripe-nøkkelen. Skyen er av når en verdi mangler eller siden ikke ligger på en av vertene. Derfor er den av i artifacten, i testene og lokalt. Hemmelige nøkler skal aldri inn her.
- **Databasen** (`supabase/migrations/20261004120000_cloud.sql`):
  - Tabellene er spillere, lagringer, økter, hendelser, feil, bildetakt, produkter, kjøp og rettigheter.
  - Alle tabellene har RLS, med lesetilgang bare for `is_admin()`. Det krever Supabase Auth-ID-en til Jonas i `admins` og totrinnsinnlogging (`aal2`).
  - Spillet skriver bare gjennom funksjonene `tm_hello`, `tm_consent`, `tm_batch`, `tm_error`, `tm_perf`, `save_get`, `save_put2` (før `save_put`), `save_hist_list`, `save_hist_get` og `delete_me` og `delete_me2` (security definer; den siste navngir kontoen for Edge Function `account-delete`, som også sletter brukeren hos WorkOS, se docs/lansering.md). Funksjonene sjekker WorkOS-ID-en (`pid()`, tokenets `sub`) og samtykket.
  - Under 13 år teller ikke et ja som samtykke.
  - **Admin-appen i spillet** (05.10.2026, Jonas: «admin-appen på telefonen skal kun være tilgjengelig på min konto»):
    - `players.game_admin` er satt for WorkOS-kontoen til Jonas, og bare der. Ingen spiller kan sette den selv, fordi tabellen ikke har skrivetilgang for spillere.
    - `tm_hello` gir `admin`, og `adminOk()` i `ui/10f-cloud.js` skjuler appen og handlingene uten flagget. Det gjelder på vertene i `cloud.json` (også med `#nocloud` og uten nett) og på GitHub Pages.
    - Artifacten og lokale bygg for testene har appen.
    - En ny admin settes i SQL Editor: `update public.players set game_admin = true where id = '<WorkOS-ID>'`.
    - Spillet kjører i nettleseren, så dette skjuler verktøyene for spillerne. Det stopper ikke noen som endrer siden. Det som må holde i en felles verden, må sjekkes på serveren.
  - Når kontoen slettes, forsvinner alt om spilleren. Kjøpene blir stående uten navn, fordi bokføringsloven krever det.
  - Rådata slettes etter 13 måneder (`pg_cron`).
  - `admin_dashboard(days)` gir alle tallene til dashbordet i ett svar.
  - **Test:** `sqltest` kjører skjemaet på en lokal PostgreSQL med Supabases `auth.jwt()`.
- **I spillet** (`ui/10f-cloud.js`, og AuthKit i `src/vendor/authkit.js`, MIT):
  - `bootMap().then(cloudGate)`: en ny spiller starter som **gjest** (fra 06.10.2026, se under). En enhet som har vært logget inn før, møter innloggingsskjermen når innloggingen er borte. Med innlogging hilser spillet (`tm_hello`), og `cloudSync` avgjør hvilket spill som går videre (se lagringen under).
  - **Gjester** (Jonas 06.10.2026: «nye brukere ikke trenger å logge inn til å starte med», kontoen etter tredje levering, «vær svært bevisst i måten det gjøres på»):
    - Anonym innlogging i Supabase i bakgrunnen (`guestStart`, nøkkelen i `dsb_guest`). Gjesten er med i den felles verdenen og lagres i skyen som alle andre.
    - Myke kort i spillets egne ord: etter «Første tur» («Ta vare på «Havbris»») og etter andre levering («Én landing til på fars papirer»).
    - Etter tredje levering (`S.landN`, `GUEST_LANDS`) venter «Kast loss» på et brev fra Fiskeridirektoratet om fiskermanntallet. Brevet viser båten, pengene og fisken, sier ærlig at spillet bare ligger i nettleseren, og gir en luksushaill. «Ikke nå» lukker alltid. Uten nett venter ingenting.
    - Gjester kan ikke kjøpe med ekte penger (`payBuy` og `shop_quote`).
    - «Registrer meg»: spillet lastes opp, `guest_claim()` gir en engangskode som ligger på enheten (`dsb_guest_code`), og så kommer WorkOS. Tilbake som konto flytter `guest_merge(code)` alt fra gjesten til kontoen før lagringen hentes, og velkomstgaven ligger om bord.
    - Databasen: `supabase/migrations/20261006180000_guest.sql`. Testene: `guesttest.py` og gjestedelen av `sqltest`.
  - En enhet som har vært logget inn før, kan spille uten nett.
  - **Samtykket** spørres én gang, fire sekunder etter start, sammen med fødselsåret.
  - **Målingen** starter med et ja:
    - en økt med et livstegn hvert minutt, med aktiv tid bare når fanen er synlig
    - spilltilstanden: båt, kasse, flåte, rekke og hjemhavn
    - hendelsene, gjennom innpakning av spillets egne funksjoner: `depart`, `sell`, `runAground`, `startSet`, `startHaul`, `PHONE.open` og alle knapper med `data-pa`
    - feil, opptil 20 ulike per økt
    - bildetakten, anonymt
  - **Rage quit:** en økt som slutter innen ett minutt etter en grunnstøting eller en dårlig levering.
  - **Lagringen mellom enhetene** (05.10.2026, `supabase/migrations/20261005200000_save_sync.sql`, etter at Jonas mistet et spill: «Har plutselig mistet progresjon og fått denne båten igjen. Hvorfor?»):
    - **Årsaken var:** den nyeste lagringen etter klokka vant. En enhet med et gammelt spill åpent (en telefon i bakgrunnen) lagret det hvert tredje minutt og var derfor alltid «nyest». Neste start på nettbrettet hentet det over spillet der.
    - **Nå** husker hver enhet hvilken skylagring spillet kommer fra (`dsb_sync_<bruker>` i `localStorage`: skyens `saved_at` som `rev`, og tiden på den lokale lagringen da som `at`). `save_put2` får den som `base` og avviser lagringen når skyen har gått videre siden (en annen enhet har lagret).
    - **Ved start** (`cloudSync`):
      - Ingen spill her: kontoens hentes.
      - Kontoen har spillet herfra (`rev` stemmer): videre med det.
      - Ikke spilt her siden sist i takt (opptil 150 sekunder, det siste minuttet som kanskje ikke nådde opp da siden ble lukket): kontoens hentes.
      - Spilt begge steder: spilleren velger før spillet starter, og ser begge (dag, penger, båtnavn og type, antall båter, om første tur pågår; `saveSum`, sendt med hver lagring som `summary`).
    - **Under spillet:** avviser skyen en lagring, kommer det samme valget som en dialog, og ingenting sendes før spilleren har valgt. «Spillet på denne enheten» sendes med `force`.
    - **Ingenting går tapt:**
      - Spillet som blir erstattet på enheten, legges i `kystfiske_v2_prev` (`loadCode`).
      - Skyen tar vare på de ti siste lagringene i `save_hist`: høyst én per halvtime, og alltid den en tvungen lagring skriver over.
      - Begge kan hentes tilbake under Innstillinger → kontokortet → «Tidligere lagringer» (`cloudHist`, `cloudRestore`). Spillet som byttes ut, tas vare på på samme måte.
    - **Den gamle `save_put`** virker for sider som fortsatt har den gamle koden, men skriver aldri over en lagring fra den nye uten `force` (den har `summary`).
    - **Opplastingen** går hvert minutt når spillet er endret (Jonas: «Kan progresjon lastes opp oftere til database?», før hvert tredje), når appen legges i bakgrunnen og når siden lukkes. Android avslutter ofte en side i bakgrunnen uten `pagehide`.
    - **Plass:** ti historikklagringer per spiller er opptil rundt 1 MB. Det må følges med når spillerne blir mange (gratisplanen i Supabase har 500 MB).
  - **Kontokortet** i Innstillinger har e-posten, statistikkbryteren, «Logg ut» og «Slett kontoen».
  - **Innloggingsdomenet:** WorkOS bruker utviklermodus (fornyelsesnøkkelen ligger i `localStorage`) til et eget innloggingsdomene som `auth.detstorebla.no` er satt opp og ført inn som `workosApiHostname`.
  - **Test:** `cloudtest` bruker stand-ins for WorkOS og Supabase.
- **Admin-dashbordet** (`src/admin/index.html` blir `admin/` i bygget, med verdiene fra `cloud.json` satt inn):
  - Innlogging med Supabase Auth og TOTP. Første gang vises QR-koden for autentiseringsappen.
  - Fanene er oversikt, spilletid, frafall, spillbruk, økonomi i spillet, penger, teknikk, geografi og det som må vente.
  - Diagrammene er SVG, uten biblioteker. Tallene oppdateres hvert minutt.
  - Uten nøkler, eller med `?demo`, vises oppdiktede tall.
  - **Test:** `admintest`.
- **Serveren** (`tools/server/setup.sh` og `Caddyfile`, `.github/workflows/deploy.yml`):
  - Caddy på Hetzner med HTTPS. Kartpakkene bufres i ett år, og siden, service workeren og kartmanifestet sjekkes hver gang.
  - En egen bruker for utrulling som bare kan kjøre `rsync` til `/srv/detstorebla` (rrsync).
  - En brannmur som bare slipper inn port 22, 80 og 443, og automatiske sikkerhetsoppdateringer.
  - Utrullingen går fra `main` og arbeidsgrenen når hemmelighetene `DEPLOY_HOST`, `DEPLOY_KEY` og `DEPLOY_KNOWN_HOSTS` finnes.
  - **`setup.sh` kjøres rett fra GitHub** (`curl … | bash -s detstorebla.no`) og henter da `Caddyfile` fra samme gren (`DSB_REF`).
    - Uten nøkkel lager skriptet deploy-nøkkelen på serveren og skriver ut de tre hemmelighetene. Slik går nøkkelen aldri gjennom chatten.
    - Først sjekker skriptet tre ting: SSH-portene holdes åpne, det stopper hvis noe annet bruker port 80 eller 443, og en fremmed Caddyfile tas vare på som `.bak`.
    - Det legger ut en «kommer snart»-side til første opplasting.
  - `try_files {path} {path}.html`, så `/personvern` og `/vilkar` virker uten `.html`.
- **Personvern og vilkår** (`src/legal/`, utkast 04.10.2026):
  - `build.mjs` legger `personvern.html` og `vilkar.html` ved siden av spillet, med stilen fra `legal.css` satt inn.
  - Innloggingsskjermen og samtykket lenker dit. Tekstene beskriver det databasen faktisk gjør, så en endring i hva som lagres må også inn der.
  - Uten samtykke lagrer `tm_hello` bare kontoen. Utstyret, landet og fødselsåret kommer først med et ja, og et nei i `tm_consent` sletter det igjen.
  - Det som står igjen, og hullet med WorkOS-brukeren ved «slett kontoen», står i `docs/lansering.md` under «Juridisk».
  - **Kilder og kontakt** (05.10.2026): `kilder.html` har dataene, skriftene og programvaren med lisensene, og `kontakt.html` foretaket etter ehandelsloven § 8. Alle fire sidene lenkes fra kontokortet i Innstillinger (ny fane) og fra hverandre. Kommer det nye data inn i spillet, må de også stå på kildesiden.
  - **Skriftene ligger i siden** (05.10.2026): Archivo og Source Serif 4 er lagt inn som latinsk delmengde (`src/data/font-archivo.b64`, `font-serif.b64`, `font-serif-i.b64`, hentet fra Google Fonts med `curl`), som Caveat og Rock Salt fra før. Spillet henter ingenting fra Google lenger, og skriftene virker uten nett.


## 4.21 Felles verden V1–V3: én klokke, én sjø og spillerne på kartet (05.10.2026)

Jonas: «det er viktig at alle har en delt klokke fordi dette er et online-spill». Planen V1–V3 er godkjent: verden starter ved utrullingen, går i 6×, og spillerne skal kunne se hverandre.

- **Klokka** (`core/01-world.js`):
  - Spillminutt 0 (1. mars 2027 kl. 06, `EPOCH`) var `WORLD_T0` = 5.10.2026 kl. 15:00 UTC.
  - Verdens minutt er `worldT()` = (nå − `WORLD_T0`) × `GAME_RATE` / 60 000.
  - «Nå» er serverens tid: `worldSync` (`ui/10f-cloud.js`) leser `Date` fra en ny HEAD av siden og legger forskjellen i `WCLOCK.off`. Uten nett brukes enhetens egen klokke.
  - Klokka gjelder overalt, også i artifacten og på GitHub Pages, men ikke for testene på en lokal server. Der går hvert spill fra 0 som før, med mindre adressen har `#world` (`worldtest`).
- **Spillet følger verdens minutt** (`tick` i `ui/08-actions.js`):
  - Hver tikk går simuleringen fram til verdens minutt, og `acc` er brøkdelen til den glatte bevegelsen.
  - Er spillet mer enn ti spillminutter bak (fanen har sovet), spilles fraværet med `catchUp`, også mer enn 72 timer. Mer enn to uker hoppes over til de siste to (`WORLD_SIM_MAX`).
  - Er spillet foran verdens klokke (en lagring fra før), går det med halv fart til verden har tatt det igjen. Ingenting stilles tilbake. Det gjelder bare de fire lagringene fra før start, som var høyst 0,6 spilldøgn foran.
- **Ingen egen fart:** `simRate()` ser bort fra `S.mult`. Admin-appen viser «Felles klokke» med verdens tid i stedet for fartsknappene. Spoling er fjernet fra før (p31).
- **Samme verden:** `S.qseed` = `WORLD_SEED` for alle, så kvoteårene, bestandene, ferskfiskplanene og kjøperne er like. Været, tidevannet, sola og årstidene regnes fra klokka og er derfor felles av seg selv.
- **Nye spill** begynner på verdens minutt (`newState`). Første tur virker uansett tid på døgnet, fordi mottaket alltid tar imot den første fangsten (`mottakOpen`).
- **V3, spillerne ser hverandre** (`ui/10h-world.js`, `supabase/migrations/20261005220000_presence.sql`):
  - Hvert 15. sekund, mens spillet er åpent, synlig og innlogget, sendes båten du følger med `pos_put`: posisjon (km i spillets ramme), kurs (radianer i rutenettet), fart, status, båtnavn og type. Det er én rad per spiller i `presence`, og den skrives over.
  - `pos_near(x, y, 25 km)` gir de andre båtene som er hørt de siste to minuttene, de nærmeste først. Id-en er en hash, aldri kontoen.
  - **Alle aktive spillere** (08.10.2026, `pos_world` i `20261008120000_pos_world.sql`): `pos_near` ga høyst 40 båter innenfor 80 km. `pos_world(x, y, 25)` gir alle som er hørt de siste to minuttene, uansett avstand (de 300 nærmeste hvis det er flere), nærmeste først. Båtene innenfor 25 km har malingen (`liv`) som før, de lenger unna går uten, så svaret blir lite. Spillet henter dem med ett kall hvert 15. sekund (`worldTick`), ikke ett per spiller. Uten funksjonen (404) faller spillet tilbake på `pos_near`. Gjester, brukernavn og at ingen kan skjule båten er som før.
  - De havner i `PEERS`, og `peerStates()` (`core/05-vessels.js`) legger dem til i `npcStates`. Slik vises de av AIS-en i kartplotteren (gul, `ais player`, eget AIS-kort med båttype og størrelse) og av 3D-visningen. Mellom meldingene glir de videre langs kursen i opptil 30 sekunder.
  - I 3D tegnes en annen spillers båt med modellen til sin egen båttype (`npcType` i `view3d.js`, også GLB-modellene), med skipper og mannskap som lokalflåten. Før 05.10.2026 fikk de boksmodellen, så en venn i trebåten så ut som en hvit plastbåt. `vessel3d.py peer` sjekker det.
  - «Vis båten min for andre spillere» på kontokortet (`S.settings.showMe`) stopper sendingen, og `pos_off` sletter raden med en gang.
  - Uten nett, eller før migreringen, sendes ingenting, og båtene forsvinner etter et minutt.
  - Personvernsiden har et eget avsnitt.
  - **Test:** `sqltest` (funksjonene og låsen) og `cloudtest` (sendingen, en båt i nærheten med AIS-kort, og avskrudd visning).
- **V2, felles sjø, kvote og marked** (05.10.2026; `core/03-simulation.js` `WSH`, `ui/10h-world.js` `worldShare`, `supabase/migrations/20261006000000_world_v2.sql`):
  - **Opp:** hvert salg (`sell`, `wshLand`) legges i `S.wq.l`: mottaket, spilltimen på den felles klokka, året, tilgangsgruppa, kilo per art og torsken som teller på kvoten i åpen gruppe. Fisken spillerens egne båter tar fra sjøen (`takeStock`, ikke lokalflåtens i `stockHour`), legges i `S.wq.c` per 2 × 2 km-celle med de samme vektene som bestanden. Køen ligger i lagringen og sendes hvert tiende minutt, og fire sekunder etter et salg (`land_put`, `catch_put` i bunker på 500 celler). En rad databasen avviser (400), droppes. Uten nett venter alt.
  - **Ned** (`world_get`, hvert tiende minutt):
    - De andre spillernes torsk i åpen gruppe i år. Den legges til flåtens fangst (`wshOpen` i `qyStep`), så stopp, økning og fritt fiske regnes med spillerne. Kvote-appen viser «Andre spillere har landet» med antall båter.
    - Hva de har levert til hvert mottak det siste døgnet, avskrevet med 3 % per spilltime som `S.market`. Det fyller mottaket og senker prisen (`wshSat` i `clsPrice`).
    - Fisken de har tatt siden forrige gang, per celle, avskrevet med 0,4 % per spilltime som gjenveksten. Den trekkes fra bestanden din med en gang (`wshTake`). Markøren `S.wcur` ligger i lagringen sammen med bestanden. Et nytt spill får de siste tre døgnene.
  - **Tak per spiller** (mot tull fra en endret klient): 60 t torsk i åpen gruppe per år, 40 t per mottak og 5 t per celle. Fangstradene slettes etter fire døgn, og leveransene blir stående for årstallene.
  - Ingen ser hvem, bare summer. Tabellene har ingen policy, og radene går med kontoen. Admin har `admin_world()` med leveranser, kilo, spillere og celler det siste døgnet.
  - **Topplistene «Norges beste båter»** (05.10.2026; Jonas: «Lag en toppliste for åpen gruppe, der spillere ikke er registrert med rederi, men med båtnavn», «Lag en toppliste for lukket gruppe også, der rederinavn og fartøynavn vil synes for alle», «alle topplistene [skal] være nasjonale lister»; `supabase/migrations/20261006020000_toplist.sql`):
    - Hvert salg har med båtnavnet (`boat` i `landings`), og i lukket gruppe rederinavnet (`company`). Begge er tomme når «Vis båten min for andre spillere» er av.
    - `world_top(w, grp)` rangerer spillerne langs hele kysten etter hva de har landet i åpen eller lukket gruppe i spilluke `w`, altså spilltime w·168 til (w+1)·168 som `weekOf`. Hver landing teller høyst 10 t i åpen gruppe og 60 t i lukket. Lista har topp 20, med båtnavnet (og rederiet i lukket gruppe) fra siste salg, mottaket de har levert mest til, og spillerens egen plass.
    - Salgslaget → Toppliste (`worldTop` i `ui/10h-world.js`) har fanene Åpen gruppe og Lukket gruppe (standard er spillerens egen) og Denne uka/Forrige uke. Lista hentes når den vises, høyst én gang i minuttet per liste, og på nytt etter egne salg. Uten sky vises Senja-flåten som før, nå med båtnavnet ditt og hjemhavna i stedet for firmanavnet og Finnsnes.
  - **Båtnavn fra andre spillere** blir HTML i kartets SVG og AIS-kortet. Derfor fjernes `<>&"'` og backslash og backtick både i spillet (`peerName` i `core/05-vessels.js`) og på serveren (`pos_put` og `land_put`). Før 05.10.2026 kunne et båtnavn med markup ha kjørt kode hos andre spillere i nærheten.
  - **Ikke felles ennå:** gytebestanden og totalkvoten (spillerne er en dråpe mot 285 000 t), registeret over lukket gruppe (`REGN`) og krabbebestanden.
  - **Test:** `sqltest` (summer, tak, markør, lås, sletting) og `cloudtest` (salg og celler opp, kvote, pris og bestand ned, markøren).

## 4.24 Fartstid og «Mens du var borte» (07.10.2026)

Jonas' avgjørelser står i `docs/engasjement.md`, arbeidslista punkt 1. Dette er del 1 av 4.

- **Fartstid** (`core/09e-fartstid.js`, `S.fs = {p, rest, away}`):
  - Den går fra 0 til 40 år, uten rangnavn. Den er bare status og låser ingenting.
  - Poengene til år N er `fsNeed(N) = 1 000 000 · (N/40)^2,8`: 33 til første år, 20 617 til tiende, 143 587 til tjuende og 1 000 000 til førtiende. Etter 40 koster hvert år like mye som det førtiende, og det vises som stjerner.
  - `fsOf(p)` gir år, døgn (0–364) og andelen av året. `fsText` lager «12 år fartstid», eller «12 år og 143 døgn fartstid».
  - Om bord tjenes 80 poeng per spilltime til sjøs (`fsMinute` i `step`) og 3·√kr per levering (`fsLand` i `sell`). Fangst tatt med haill teller.
  - Mens du er borte (`FS_AWAY`, mens borte-tida spilles i `catchUp`), og når et mannskap leverer uten deg, teller det en firedel («rederierfaring», `S.fs.away`).
  - **Uthvilt:** hver ekte time borte gir 2 spilltimer dobbel fartstid til sjøs, høyst 18 (`fsRested`). Hvilen brukes bare opp til sjøs og forsvinner aldri ved å vente.
  - Et lagret spill uten fartstid får den regnet ut fra det som er gjort (`fsSeed`): nautiske mil med deg om bord, antall turer og inntekten.
  - Et nytt år gir en linje i loggen og en toast. Hvert tiende år gir en melding fra Kystposten.
  - Tempoet er kalibrert for omtrent 1000 poeng per ekte spilletime. Det gir år 3 første dag, år 5 første uke, år 10 etter rundt en måned og år 40 etter 2–3 år. Tallene justeres i spilltesting.
- **Visningen:** en brikke under «Neste mål» på telefonen viser år og døgn, uthvilt eller døgn til neste år, med en linje. Et kort øverst i Sjømann-appen forklarer hvordan fartstid tjenes.
- **«Mens du var borte»** (`awayStart`, `awayEnd` og `showAway` i `ui/08-actions.js`):
  - `catchUp` tar et øyeblikksbilde før borte-tida spilles, også når den spilles i bolker (`CATCH_LEFT`).
  - Rapporten viser ett stort tall som teller opp: det som ble levert, eller døgnene med fartstid hvis ingenting ble levert. Fartstidslinja fylles, og ved et nytt år fylles den til enden og starter på nytt. Tre ruter viser levert, beste levering og uthvilt, og under står de seks siste hendelsene. Knappen heter «Til sjøs!».
  - Den viser bare det som er vunnet. Etter et kort fravær (under 5 ekte minutter) uten levering eller nytt år vises den ikke.
- **Test:** `fartstidtest` (kurven, utregningen fra statistikk, om bord, uthvilt, borte, levering, rapporten, kort fravær og telefonen).
- **Del 2: den navnløse båten, registreringen og brukernavnet** (Jonas: «Det gir en følelse av eierskap når man får døpe en navnløs båt selv»):
  - Et nytt spill starter uten båtnavn (`boatUnnamed` i `ui/08-actions.js`): `S.unnamed = true`, og `S.boatName` er registreringsmerket, så alt som viser navnet, viser merket. Merket nevnes ikke for spilleren (Jonas 10.10.2026: «bare la tildeles et nummer, så kan de heller få døpe båten under registreringen»): vinduet «Båten etter far» og veiledningen snakker bare om båten, og `reg`-steget sier at dåpen kommer med registreringen. Navnestripa på skroget tegnes ikke (`view3d.js`). Kortet «Båten etter far» har bare knappen «Ta over båten» (`#obGo`).
  - `boatChristen(navn)` døper båten: navnet males på skroget, det står i loggen, og overtroen får det nye navnet (`loreRename`).
  - **Registreringen** (`ui/10f-cloud.js`): `GUEST_LANDS = 2`. Etter første levering sier et kort at én levering er igjen. Etter den andre, eller ved andre åpning av spillet (`S.opens`, `guestOpenAsk`), kommer brevet fra Fiskeridirektoratet. Det ber om båtens navn (`#regBoat`, bare når båten er navnløs) og et brukernavn (`#regUser`, 3–20 tegn, `NAME_RE`). Brukernavnet er påkrevd (Jonas: «Alle registrerte brukere må ha et brukernavn. Det skal ikke være valgfritt»), og det sjekkes mot `name_free` før registreringen. «Har du konto? Logg inn» krever det ikke. Navnene holdes på enheten (`dsb_names`) til kontoen finnes. Da døper `namesApply` båten og tar brukernavnet med `name_claim`.
  - Uten skyen (artifacten) spør `nameNudge` om båtens navn på samme tidspunkt. Testene (`#notut`) får det bare når de ber om det.
  - **Brukernavnet** (`supabase/migrations/20261007120000_names.sql`):
    - Tabellen `names` har ett navn per spiller, unikt uansett store og små bokstaver. Ingen spiller leser tabellen.
    - `name_claim` gir 'ok', 'taken' eller 'bad'. Gjester kan ikke ta et navn.
    - `name_free` og `name_mine` (med grunnen hvis navnet er tatt bort).
    - Admin-fanen «Brukernavn» (`admin_names`, `admin_name_remove`) tar bort et navn med en grunn som spilleren leser i spillet (`nameCheck`). Navnet sperres for godt i `names_banned`, og et nytt navn er gratis.
  - Kontokortet under Innstillinger har brukernavnet og, mens båten er navnløs, båtens navn. Personvernsiden forklarer brukernavnet.
  - **Tester:**
    - `starttest`: den navnløse starten og dåpen.
    - `guesttest`: kortet etter første levering, og brevet med navnefeltene etter den andre. Et ugyldig brukernavn avvises, og navnene holdes på enheten og tas i bruk på kontoen.
    - `sqltest`: brukernavnene.
    - `tut`: åpningen.
- **Del 3: synlig på sjøen** (Jonas: «Det skal ikke være mulig å skjule båten sin posisjon for andre spillere, det er et krav»):
  - Valget «Vis båten min for andre spillere» er borte, sammen med `worldShowMe` og `pos_off`. `worldTick` (`ui/10h-world.js`) legger alltid ut posisjonen, og en levering har alltid båtnavnet (`wshLand`).
  - `pos_put` tar også fartstiden i poeng (`fs`). En server uten den (404) får posisjonen uten fartstid, og så uten maling (`WORLDP.noFs`, `WORLDP.noLiv`).
  - **Migrasjonen** `supabase/migrations/20261007130000_seen.sql`:
    - `players.guest` merkes i `pos_put` og av en trigger på `landings`. Gjestene fra før merkes etter id-formatet: uuid for Supabase-gjester, `user_` for WorkOS.
    - `pos_near` utelater gjester og gir eierens brukernavn (`user`) og fartstid (`fs`).
    - `world_top` utelater gjester, unntatt spilleren selv, og gir brukernavnet.
    - **Kontrollen av fartstiden:** første melding godtas opp til 65 000 poeng (15 år). Deretter vokser den med høyst 5 000 poeng per ekte time siden forrige melding, og den synker aldri. Spillet beholder sine egne poeng, og serveren tar dem igjen etter hvert.
  - **AIS-kortet** for en spiller (`aisInfo` i `ui/03-map.js`) viser eier og fartstid før båttypen.
  - **Kartet:** spillerne tegnes til slutt, gule og større, med en ring. Navnet vises fra `view.z > 1,5` og kommer først blant navnene. Kartplotteren (`#map.plot`) har egne farger, og minikartplotteren i 3D gjør det samme.
  - Topplista viser brukernavnet under båtnavnet.
  - **Alle kontoer har et brukernavn:** `nameCheck` henter navnet fra serveren (`name_mine`), også når det er tatt på en annen enhet.
    - Har kontoen ikke noe navn, spør `nameAsk`. Det gjelder kontoer fra før brukernavnene, navn som admin har tatt bort, og navn som en annen tok før kontoen var klar.
    - Kortet har ingen «Senere». Det venter til andre dialoger er lukket, og kommer tilbake hvis en annen dialog tar plassen.
    - Bare når serveren ikke kan ta navnet nå (frakoblet, eller før migrasjonen), går spillet videre. Da spør det igjen ved neste åpning.
  - Personvern og vilkår er oppdatert: alle registrerte er synlige, med brukernavn og fartstid, og det kan ikke skrus av. Gjester er bare synlige for seg selv.
  - **Tester:**
    - `cloudtest`: fartstiden går opp, eier og fartstid står på AIS-kortet, serveren uten fartstid, ingen skjuling, og det påkrevde brukernavnet (hentes, spørres om uten vei rundt, tatt bort).
    - `guesttest`: registreringen krever et ledig brukernavn.
    - `sqltest`: gjester skjult på AIS og topplista, eier og fartstid, kontrollen av fartstiden, `pos_off` borte.
- **Neste:** achievements («Første uke på sjøen»), se 4.25.

## 5.25e Sesongene som hendelser, og folk på kaia (05.10.2026)

Jonas valgte dem fra lista (nr. 5 og 7).

**Sesongene** (`core/09c-seasons.js`):
- Hver sesong (`SEASON_EV`) begynner på sin egen dag hvert år, i et vindu av noen dager. Dagen er den samme for alle (`seasonDoy`, fra `h2`):
  - Skreien kommer (rundt 20. januar).
  - Høysesong på feltene (rundt 1. mars).
  - Skreien drar (rundt 10. april).
  - Loddetorsk i Finnmark (rundt 25. april).
  - Seisommer (rundt 10. juni).
  - Høsthyse (rundt 5. september).
  - Sild og hval i fjordene (rundt 10. november).
  - Julefiske (15. desember).
- Hver sesong har tre kanaler:
  - Kystradio over VHF: en melding på dagen, fra `seasonDay`, som går hver time. Kystradioen (`radio` i `06-services.js`) vises på skjermen i 15 sekunder og legges aldri i Meldinger (Jonas 21.10.2026: «De fyller innboksen totalt»). Det gjelder værmeldingene kl. 09, 12, 15, 18 og 21, kulingvarselet på VHF og sesongnyhetene. De siste 40 står i `S.radio`, og dekksdagboka henter dagens værmeldinger derfra. Kulingvarsel som SMS («Værvarsel», uten VHF) er fortsatt en melding. Gamle Kystradio-meldinger flyttes fra `S.msgs` til `S.radio` ved oppstart.
  - Kystposten (`seasonNews` i `newsForDay`).
  - Praten på puben (`seasonTalk`).
- Regelverkets egne datoer står også i kalenderen (`SEASON_FIXED`). Nyhetene om dem ligger fortsatt i `06-services.js`.
- **Skreifestivalen:** andre helg i mars, fra lørdag 00 til søndag 18.
  - Største torsk som noen av båtene dine lander (`festCatch` i `addCatch`), mot sju skippere fra kysten (`festField`).
  - Premiene er 15 000, 7 500 og 3 000 kr, og resultatet kommer søndag kveld.
  - En drømmeskrei vinner nesten alltid.
- Telefonappen Sesong (`ui/06d-season-folk.js`) viser:
  - sesongen nå
  - festivaltavla fra en uke før til tre dager etter
  - det som kommer
  - en fiskekalender med 7 arter × 12 måneder, laget av `SPECIES[sp].av` (skrei lagt til for torsk)

**Folk på kaia** (`core/09d-folk.js`):
- **Edvard**, som kjente far, hilser i hjemhavna én gang om dagen mellom 08 og 20 (`folkPort` i `step`). Første gang sier han hvem han er. Siden snakker han om:
  - far og været, uten å gjenta seg på fem dager
  - veien til et méd du ikke har funnet (40 % av dagene)
  - storfisken du fikk
- **Mottakssjefen** (et navn per mottak, `folkPlantName`) teller det du lander der (`folkSold` i `sell`).
  - Etter 2, 10 og 30 tonn er du fast leverandør. Mottaket betaler da 1, 2 og 3 % mer på markedsprisen (`folkPf` i `clsPrice`).
  - Minsteprisen endres ikke.
- **Solveig i butikken** teller kjøp med pris (`folkShop`):
  - etter 5 kjøp er kaffen gratis (bare tekst)
  - fra 15 kjøp er sekkeisen 10 % billigere (`folkIce` i `shopIceKr`)
- Telefonappen Folk viser dem, hvor langt det er til neste trinn, og hva Edvard sa sist.

**Oppdrag langs kysten:** mottakene langs kysten er også kunder (`CUSTOMERS`, lagt til i `06b-coastports.js` med de tre artene de tar imot mest av). `custNear` gir bestillinger fra kunder innen 60 km fra hjemhavna eller 40 km fra båten. Med Senja som hjem gjelder Senjas egne kunder som før. Omdømmekortet viser bare kundene i nærheten og dem du har handlet med.

**Usikkert:** prosentene for faste leverandører er et anslag. Mottakene gir ofte bonus eller bedre vilkår til faste leverandører, men tallene er ikke sjekket mot noen avtale. Premiene i festivalen er satt av oss.

## 5.25g Innlastingen og innloggingen (05.10.2026)

- **Bildet** (`tools/brand/loader.py`, `src/data/loader-land.b64` og `loader-port.b64`):
  - Fars naust på pålekaia i blåtimen, laget av de samme modellene som i spillet (`tools/harbour/naust.py` og `tools/boats/snekke23.py`).
  - Lampa over loftsdøra og vinduene lyser varmt, og trebåten ligger fortøyd med to tau.
  - Bak står Senja-tinder med snø i skyggeleggeren: høyt og ikke for bratt, brutt opp av støy. Fjellene er laget av ridged-støy.
  - I det åpne partiet til venstre står en blek fjellrekke i det siste lyset. Noen naboer har lys i vinduene langs stranda, og det er stjerner høyt oppe.
  - Det er to bilder:
    - Liggende: 1600 × 1000, med naustet i midten.
    - Stående: 960 × 1600, med naustet litt over midten, slik at innloggingskortet ligger over sjøen.
  - Bildene er WebP med kvalitet 84 (54 og 49 KB). De legges i siden som CSS (`.dsb-bg` i `src/index.html`), og `@media (orientation:portrait)` velger det stående.
  - `python3 tools/brand/loader.py quick` gir en rask prøve. `land` eller `port` renderer bare det ene bildet, på rundt to minutter.
- **Innlastingen** (`#loader`):
  - Bildet er mørkere øverst og nederst.
  - Øverst står «Kystfiske langs norskekysten» i sperrede versaler mellom to streker, og navnet stort i Source Serif 4.
  - Nederst løper en tynn lysstripe, med «Laster kysten …» under.
  - `.gone` toner den ut og skjuler den etterpå (`visibility`), og da stopper stripa.
- **Innloggingen** (`cloudGateShow` i `ui/10f-cloud.js`):
  - Den har samme bilde og tittel.
  - Teksten og knappene står i et halvgjennomsiktig kort med uskarp bakgrunn. På telefon og nettbrett ligger kortet nederst. På brede skjermer (minst 900 × 600, liggende) står det til venstre, så naustet synes.
  - Klassene ligger i `styles.css` (`.cg-card`, `.cg-btn`), ikke inline.
- **Ikke gjort ennå:** innlastingsteksten er alltid norsk. Spillets språk er ikke lest inn ennå når den vises.

## 5.25h Push-varsler (05.10.2026)

- **Hvorfor de planlegges i spillet:** spillet kjører i nettleseren, så serveren vet ikke hva som skjer i det.
  - Når appen går i bakgrunnen (`visibilitychange` til `hidden`, og `pagehide`), regner `pushItems()` i `ui/10g-push.js` ut hva som skjer mens den er borte.
  - Den felles klokka går videre med `GAME_RATE` (6 spillminutter per minutt) når spillet er lukket. Spilltid T blir derfor `nå + (T − S.t) / 6` minutter. Planen ser 40 ekte timer fram (`PUSH_AHEAD`).
  - `push_plan` legger planen ut på serveren og erstatter den forrige.
  - Tilbake i appen tømmes planen, så ingenting kommer mens du spiller.
- **Det som varsles** (05.10.2026; Jonas: «Varselet må ha betydning», «Vi skal sende 4 pushvarsel i døgnet. kjør på med alle forslagene»). Hver type hører til en gruppe spilleren kan slå av på kontokortet (`S.settings.pushCat`), og har en tid den slutter å bety noe (`exp`):
  - *Fangst og båter:*
    - Redskap som har stått lenge nok: line 10 t, garn 20 t, teiner 40 t (`PUSH_SOAK`, etter `soakHour` i `core/10-gear.js`).
    - Fisk i lasterommet som snart går ned et kvalitetstrinn, to spilltimer før. Fallet regnes som i `vesselStep` (`keepHours`, fasene i is og temperaturen på dekk; fryst fisk aldri). Ikke når båten er på vei inn, for det dekker neste punkt.
    - En båt på rute når den er framme i havna med fisk, regnet som ETA i ruta. Uten fisk kommer det ikke.
  - *Verftet:* verftsjobbene på en båt er ferdige (`YARD_KINDS`).
  - *Kvoter:* Fiskeridirektoratet varsler stopp i åpen gruppe. Året regnes videre dag for dag på en kopi av `S.qy` (`qyStep`), med det som er igjen av kvoten (`codRoom`).
  - *Topplista* (serveren selv): når en annen spillers levering tar dem forbi deg i gruppa denne spilluka (`push_passed` i `land_put`, høyst én i døgnet), og ukeresultatet når spilluka er over (`push_week`, hver time i pg_cron, «Norges beste båt!» for nummer 1). Bare når spilleren ikke er i spillet (presence de siste to minuttene) og har topplista på (`push_prefs`).
  - *Sesonger:* sesongnyhetene kl. 07 den dagen de kommer, fra Kystradio, og skreifestivalen dagen før.
  - Høyst 24 i planen.
- **På for nye spillere** (05.10.2026; Jonas: «jeg ønsker at varsler skal være på by default for nye brukere»). Ingen side kan sende varsler før spilleren har sagt ja til nettleserens egen spørsmål, og på iPhone kan spørsmålet bare komme fra et trykk. Derfor:
  - Har nettleseren allerede gitt lov, slår spillet dem på av seg selv (`pushAuto`).
  - Ellers spør det med et eget vindu når «Første tur» er ferdig og etter en levering (`pushAsk`), høyst tre ganger og med minst et døgn mellom (`S.settings.pushAsk`).
  - Det spør aldri igjen når spilleren har sagt nei i nettleseren eller slått varslene av i Innstillinger (`S.settings.push` = false).
  - «Slå på varsler» spør nettleseren før noe annet venter (`pushOn`), så trykket fortsatt gjelder.
- **Reglene på serveren** (`supabase/migrations/20261006030000_push_rules.sql`, `push_claim`): høyst fire meldinger per spiller i døgnet. Det som forfaller samtidig, blir én melding med en linje per varsel. Ingenting går mellom 22 og 08 norsk tid. Det som har gått ut på dato, droppes usendt. `push_plan` erstatter bare spillets egne (`kind` = `plan`), ikke serverens (`srv`). `dsb.clock` lar testene sette klokka.
- **Serveren** (`supabase/migrations/20261005120000_push.sql`):
  - `push_subs` og `push_queue` er stengt for spillere.
  - `push_sub` godtar bare nettleserens egne varseltjenester (Google, Mozilla, Microsoft og Apple), så funksjonen poster aldri til en adresse spilleren velger.
  - `push_claim` tar det som er forfalt og merker det sendt i samme operasjon (`for update skip locked`). Bare service-rollen kan kalle den.
  - En slettet spiller tar med seg abonnementene og køen (`on delete cascade`).
- **Sendingen** (`supabase/functions/push-send`):
  - Den bruker `npm:web-push` med VAPID-nøklene som hemmeligheter, som bare Jonas lager.
  - pg_cron kaller den hvert femte minutt.
  - Et abonnement tjenesten melder borte (404 eller 410), slettes. Et som feiler over 50 ganger, slettes også.
  - `GET ?key` gir den offentlige nøkkelen. Uten nøkler viser ikke spillet bryteren.
- **I spillet:**
  - Bryteren «Varsler når appen er lukket» står på kontokortet under Innstillinger. Den vises bare innlogget, i appen og med nøkkelen på plass.
  - Service worker-en (`src/pwa/sw.js`) viser varselet med appens ikon, og et trykk henter appen fram.
  - Personvernerklæringen har et eget avsnitt om varsler.
- **Tester:**
  - `pushtest.py`: ingen bryter uten nøkkel, slå på og av, tidene i planen, og at planen legges ut i bakgrunnen og tømmes i appen.
  - `sqltest.py`: bare varseltjenestene, ingen plan uten abonnement, høyst to døgn, at det forfalte tas én gang, og at alt slettes med kontoen.
- **Status:**
  - Med MCP er bit 1, funksjonen og jobben lagt inn.
  - Bit 2 (med DELETE) og nøklene står igjen for Jonas, se `docs/lansering.md`.
  - På iPhone virker varslene bare når appen er lagt på hjemskjermen.

## Felles verden og tid (beslutninger 01.–02.10.2026)

- **Tiden:** 6× beholdes, også for farten i bildet. Et døgn i spillet er 4 ekte timer. Forslaget om ekte fart i bildet (med ETA i ekte tid og på spillklokka) ble vurdert og droppet: døgnrytmen er viktigere, og store båter som går saktere, oppleves uansett realistisk.
- **Spolingen** (tempo 180×, 1 800× og 10 800×) er et adminverktøy for testing og skal fjernes for spillerne. Den ligger nå i Admin-appen i telefonen, sammen med pause og «+ 100 000 kr».
- **Felles verden når serveren kommer:** samme klokke og dato, samme bestander og samme priser fra mottakene for alle. Konkurransen kommer av at alle er ute etter den samme fisken. Bestandene skal bygge på ekte data og forvaltes realistisk.
- **Ingen VHF og ingen sosiale møteplasser.** I kartplotteren kan du trykke på et AIS-mål innenfor rekkevidden og se hvem det er, hvilken båt og hvilket felt hun ligger på.
- **Spillet krever nett.** PWA-en mellomlagrer filene, men spilles bare med nett.

## 5.49 Venner (Jonas 09.10.2026)

- **Folk-appen er Venner** (id fortsatt `folk`, `ui/10k-friends.js`). Den viser vennekoden din (6 tegn, uten 0/O/1/I), et felt for en annens kode, forespørsler til deg (Godta/Avslå), vennene og forespørslene du har sendt.
- **Hver venn vises med** status («På sjøen nå», «I havn nå», «Fisker nå» eller «Sist sett for …»), nærmeste havn og avstanden fra deg. Knappen «Vis i kartet» åpner kartplotteren der vennen er. «Fjern venn» krever to trykk.
- **Legge til:** med kode, fra AIS-kortet til en spillerbåt i kartet («Legg til som venn», `FRIENDS.chip`), eller ved en spiller i puben («Hvem er her»). Spør to spillere hverandre, blir de venner uten å svare.
- **I kartet:**
  - Venners båter er grønne.
  - En venn med lukket spill står der båten sist lå, med stiplet ring og tiden (`FRIENDS.svg`).
  - Båten kan ikke skjules for venner. Jonas: «Det skal ikke være mulig å slå av posisjon».
- **Skyen:** `supabase/migrations/20261009180000_friends.sql`.
  - Tabellene `friend_codes`, `friends` og `friend_req`. Ingen tabell er åpen.
  - Funksjonene `friend_code`, `friend_ask`, `friend_answer`, `friend_remove` og `friends_get`.
  - Gjester stoppes både av tokenet og av `players.guest`.
  - Høyst 100 venner og 20 forespørsler i timen.
  - Spillerne er bare kjent ved samme hash som i `pos_world`.
  - Uten migreringen (404) sier appen at Venner ikke er klare.
- **Henting:** hvert minutt mens spilleren er logget inn, og med en gang etter en handling. En ny forespørsel gir én melding fra «Venner» (`S.frSeen`).
- **Fast kunde** (bonusen på mottakene og i butikken, `FOLKAPP.page`) står nå nederst i Priser i Salgslaget. Edvard er ikke lenger i appen. Han hilser fortsatt på kaia.
- **Testene:** `friendtest` (med en falsk database) og vennedelen av `sqltest` (på en lokal PostgreSQL).

## 5.51 Delte fangstmerker (Jonas 09.10.2026)

- **Dele:** trykk på et av dine egne fangstmerker i kartet (`SHARE.tap`, `ui/10l-share.js`). Da åpnes et kort med fangsten, tiden og avstanden, og knappene «Del med venner», «Del med fiskarlaget» og «Rute hit».
  - Delingen sender bare tallene (posisjon, kg/t eller kg per line, garn eller teine, ståtid og kvalitet), aldri tekst. Knappen blir «Delt» (`mk.sh`).
  - Trykk på et eget merke la før til et rutepunkt. Nå åpner det kortet, og «Rute hit» gjør det samme.
- **Se andres:**
  - Merker delt med deg (fra en venn, eller fra noen i fiskarlaget i havna di) står i kartet som en rute i fangstens farge, med navnet og fangsten.
  - De står i 4 ekte timer, som er ett spilldøgn ved 6×.
  - Trykk gir avsender og «Rute hit». Første gang et merke kommer, går en linje til Meldinger fra «Venner» eller «Fiskarlaget» (`S.shSeen`).
- **Skyen:** `supabase/migrations/20261009200000_shared_marks.sql`.
  - Tabellen `shared_marks`, som er stengt for spillerne, og funksjonene `mark_share` og `marks_get`.
  - Høyst 5 delinger på 4 timer. Gjester kan ikke dele.
  - Fiskarlag-deling krever medlemskap (`nolag`).
  - Ingen ser sine egne delte merker, og fremmede ser ingenting.
  - Merkene slettes etter ett døgn.
- **Testene:** `sharetest` (med en falsk database) og delte merker i `sqltest`.

## 5.53 Tuting og faste hilsener på sjøen (Jonas 09.10.2026)

- **Tut:** knappen kommer blant båtens knapper (ligger stille og under seiling) når en annen spillers båt er innenfor 1 nm (`HAIL.dockItem`, `ui/10n-hail.js`).
  - Hornet høres her (`SND.horn`), og hos den andre med styrke etter avstanden.
  - Du kan tute på samme båt én gang i minuttet.
  - Tutingen teller i merket «Tutet på andre båter» (1–200).
- **Faste hilsener:** AIS-kortet til en spillerbåt innenfor 5 nm har seks faste hilsener (`HAIL.LINES`). Det er ingen fritekst.
- **Mottak:**
  - Hentes hvert 15. sekund med id etter den siste du har sett (`S.hailId`).
  - Hver hilsen gir en melding: fra «Venner» om avsenderen er en venn, ellers fra «Sjøen».
  - Den vises også som en kort beskjed på skjermen og som tekst over båten i 3D i 10 sekunder (`G3.sayBoat`, som følger båten).
- **Skyen:** `supabase/migrations/20261009240000_hails.sql`.
  - Tabellen `hails`, som er stengt for spillerne, og funksjonene `hail_send` og `hails_get`.
  - Serveren måler avstanden selv mellom posisjoner som er rapportert de siste to minuttene.
  - Høyst 60 i timen. Gjester kan ikke sende.
  - Raden slettes etter ett døgn.
- **Testene:** `hailtest` (med en falsk database) og hilsenene i `sqltest`.

## 5.55 Slep mellom spillere (Jonas 09.10.2026: belønning «Kanskje 25000?»)

- **Den som trenger hjelp** (båten driver, har motorstopp eller står på grunn):
  - Redning-appen har kortet «Spør om slep» (`PTOW.card4phone`, `ui/10o-ptow.js`).
  - Spørsmålet sendes fra stedet der båten ligger (`tow_ask`), og ventetiden vises.
  - Når noen tar det, kommer en melding.
  - Når slepet er festet, får båten status `ptow`. Den ligger 50 m bak hjelperen og fortsetter langs hennes kurs mellom rapportene (`ptowStep`, en gren i `vesselStep`).
  - Når hjelperen fortøyer, legger båten seg i den havna (`dock`). Slepet er gratis.
  - Tar ingen spørsmålet innen 20 ekte minutter, eller kommer ikke den som tok det innen 20 minutter, avlyses det og redningsskøyta tilkalles (`rescue(true)`).
  - Starter motoren igjen av seg selv, avlyses spørsmålet.
- **Hjelperen:**
  - Spørsmål innenfor 30 nm hentes hvert 30. sekund (`tow_open`). De står som røde trekanter «Trenger slep» i kartet, og det kommer én melding per spørsmål.
  - Trykk på trekanten gir kortet med «Hjelp» (`tow_take`), og Autonav går dit.
  - Når båten ligger stille innenfor 150 m, kommer «Ta slep» blant knappene (`tow_hook`). Serveren sjekker selv at båtene er innenfor 200 m.
  - Under slep er farten begrenset til 5,5 kn, og drivstofforbruket er ×1,5, som på sleperturene (`ptowTowing` i `speedCap`/`fuelLph`).
  - Når hjelperen fortøyer i en havn (`PTOW.docked` fra `dock`), er jobben gjort. Spillet betaler 25 000 kr når serveren tillater det: én gang i døgnet for samme spiller, og høyst tre betalte slep i døgnet, så to venner ikke kan tjene på å late som.
  - Merket «Slept andre spillere» har trinnene 1–20.
  - Hjelperen kan «Gi fra seg» slepet. Da åpnes det for andre igjen.
- **Skyen:** `supabase/migrations/20261009260000_tows.sql`.
  - Tabellen `tows`, som er stengt for spillerne.
  - Funksjonene `tow_ask`, `tow_open`, `tow_take`, `tow_hook`, `tow_done`, `tow_cancel` og `tow_mine`.
  - Gjester kan verken spørre eller hjelpe.
- **I 3D** (`view3d.js` `drawNPC` og `drawTowLine`):
  - Den andre båten er funnet blant spillerbåtene ved festingen (`pid`, den nærmeste).
  - Hos hjelperen legges den slepte båten 30 m akterut, og tauet går fra hjelperens akterende til den slepte båtens baug. Hos den slepte legges hjelperen 30 m forut, og tauet går fra egen baug til hjelperens akterende.
  - Båtene følger dermed hverandre jevnt, selv om rapportene kommer hvert 15. sekund. Tauet henger litt, som ved slep av NPC-båter.
- **Testene:** `ptowtest` (begge rollene, med en falsk database) og slep i `sqltest`.
