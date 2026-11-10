# Haill og penger som saldo på serveren (Ø6 funn 6, steg 49, plan 10.11.2026)

Jonas' økt, grenen `claude/o6-funn-6-haill-saldo-ume93b`. Ingenting er bygd, ingen migrering er kjørt og ingenting er skrevet til databasen; den levende databasen er bare lest. Fasene er steg 95–99 i `docs/planer/koen.md`.

## 1. Hva Jonas ba om

- Funn 6 i `docs/planer/sikkerhet-skyen.md` (05.11.2026): «lagringen, pengene og haillen er klientens». Rettingen på sikt: «haill som en saldo i databasen (innløst med en funksjon, slik `grants` alt er for kjøp), velkomstgaven gitt én gang av `guest_merge` på serveren. Admin-dashbordets økonomitall skal leses som det klienten melder.»
- L1 (`docs/planer/lansering-plan.md`, valg 16 V7), **Jonas 10.11.2026: «A»**: «før lanseringen bare det som gjelder ekte penger og gaver: velkomstgaven én gang fra serveren, og kjøpt haill talt fra `grants`. Haillen som saldo i databasen, brukt gjennom en funksjon, kommer etter lanseringen.»
- Reglene som gjelder (`CLAUDE.md`, «Engasjement og inntekt»): haill for ekte penger beholdes og er trolig hovedproduktet; luksushaill gis bare som gave ved registrering og som takk for tilbakemelding; haill gir plass på topplista, men synes aldri; gjester kan ikke kjøpe; ekte penger (`ui/10i-shop.js`, `shop_*`) rulles aldri ut uten at Jonas har sett PR-en.

## 2. Hva som finnes i dag (lest 10.11.2026)

### Haillen i spillet

- `HAILL` (`core/03-simulation.js:1176`): `haill` (29 kr), `luksus` (59 kr) og `takk` (bare fra serveren, 12 timer). Beholdningen er `S.haillInv` (`{haill, luksus, takk}`, tall i lagringen). `giveHaill(type, how)` legger én til, `useHaill(type)` (`:1200`) tar én og setter `S.haill = {type, t0}`. «Aktiver» i Haill-appen (`ui/phone/14-act.js:268`, `haillon`) er det eneste stedet haill brukes.
- Kildene til `giveHaill`: kjøpet (`ui/10i-shop.js:70` `shopGive`, og testkjøpet i `14-act.js:265`), takken for tilbakemelding (`10i-shop.js:112`, grant `fb_haill`), velkomstgaven (`ui/10f-cloud.js:960` `guestGift`), puben (`ui/09-hand-fishing.js:40`, hjulet `PUB_WHEEL` trukket i klienten for 1 000 spillkroner) og kapittel 2 i merkene (`core/09f-merker.js:206`).

### Kjøpet og `grants`

- `supabase/migrations/20261006040000_shop.sql`: Stripe-webhooken kaller `shop_paid`, som lager én `grants`-rad per betalt kjøp. Spillet henter de åpne med `shop_pending`, gir dem (`shopClaim`, `shopGive`), husker ID-ene i `S.shopGiven` (de siste 200), lagrer og sier `shop_done(ids)`, som setter `done_at`. `shop_refund` tar tilbake en grant som ikke er `done`.
- **Hullet:** når `done_at` er satt, finnes kjøpet bare i lagringen. Går en lagring uten det videre (to enheter i konflikt der den andre vinner, `cloudSync` «alltid den siste lagringen»; en tidligere lagring tatt tilbake under Innstillinger; opplastingen som ikke når fram før `shop_done`; et nytt spill), er det betalte borte, og ingenting på serveren gir det igjen. Admin kan bare rette det for hånd med en grant (`data.comp`, sett én gang: `trim_turbo` uten kjøp).
- Malingsdesignene er alt riktige: `entitlements` på serveren (`20261007100000_designs.sql`), lest som `CLOUD.owned` fra `tm_hello`, og `pos_put` deler bare det kontoen eier (funn 5). De rører ikke denne planen.

### Velkomstgaven

- `cloudGate` (`10f-cloud.js:169–175`): tilbake fra registreringen med en gjestekode kalles `guest_merge`, og **uansett svar** settes `localStorage.dsb_reg_gift = '1'`. `guestGift` (`:957`) gir en luksushaill når nøkkelen finnes og tar den bort. Den som setter nøkkelen selv, får en ny luksushaill ved hver start. En konto laget uten gjest først (Lag konto på innloggingsskjermen) får ingen gave.
- `guest_merge` (`20261105130000_guest_world.sql:133`) flytter gjestens `grants` til kontoen, men gir ingen gave.

### Pengene

- Kontantene (`S.cash`) og hele økonomien regnes i klienten: salg, lønn, diesel, verft, driftsplanene og tida som tas igjen når spillet åpnes (`catchUp`). `save_put4` tar lagringen som den er. `saves_cash_check` (`20261107140000_broker.sql:345`) varsler bare, og sammenligner klientens `summary.cash` med klientens egne hendelser.
- Der penger går mellom spillere, holder serveren alt regnskapet: megleren (`broker_ledger`) og kvotemarkedet (samme mønster som `grants`). En jukser med falske kroner kan by på en båt eller en hjemmel, men selgeren får det som er budt, så ingen andre taper.

### Databasen (lesende spørringer 10.11.2026)

| Vare i `grants` | Rader | Åpne | Levert | Spillere |
|---|---|---|---|---|
| `fb_haill` (takk) | 105 | 22 | 83 | 7 |
| `haill` (kjøpt) | 3 | 0 | 3 | 2 |
| `trim_turbo` | 2 (én er en rettelse uten kjøp) | 0 | 2 | 1 |
| `verft_na` | 1 | 0 | 1 | 1 |

118 spillere (19 kontoer, 99 gjester), 38 lagringer (12 på kontoer), 13 kjøp (5 betalt), 0 rader i `entitlements`, 0 i `guest_links`. Ingen `luksus` er kjøpt.

## 3. Fasene (én økt hver)

Før lansering (over lanseringslinja, sporet «Lansering», med L1e): **HS1**, **HS2**, **HS3** og **HS4** (V2 og V3, Jonas 10.11.2026: så snart som mulig, før flere spillere slippes inn i early access, og «Spillere skal ikke kunne redigere sin egen lagring og gi seg selv så mye haill eller andre varer de selv vil»). Alle fem er over lanseringslinja: **HS5** også (V5, avgjort i økta 10.11.2026 etter at Jonas overlot det). Alle rører ekte penger eller gaver: PR-en venter på Jonas før utrulling (`CLAUDE.md`), og migreringen kjøres av økta først når Jonas har sett PR-en. Patchnotes nevner ingenting av dette (det er ekte penger og juks); bare en ny linje i Haill-appen, hvis noen, beskrives ved hva den gjør.

### HS1 Velkomstgaven fra serveren, én gang (steg 95, før lansering)

- **Migrering** `supabase/migrations/2026111xxxxxxx_reg_gift.sql`:
  - varen `reg_luksus` i `products` (ikke aktiv, 0 kr, `data = {"give":"haill","type":"luksus","gift":true}`), så `shop_quote` nekter den
  - en unik delindeks på `grants (player_id) where product_id = 'reg_luksus'`, så én konto aldri får to
  - `tm_hello` lager granten for en spiller som ikke er gjest (`on conflict do nothing`); da får også en konto laget uten gjest gaven, og den kommer også på en ny enhet uten nøkkelen
  - de 19 kontoene som finnes, får en rad som alt er levert (`done_at = now()`), fordi vi ikke kan se hvem som har fått gaven fra nøkkelen (lagringene er komprimert) og regelen er én gave per registrering
- **Spillet:** `guestGift` gir ikke lenger noe selv, og `dsb_reg_gift` brukes bare til å be om `shopClaim` med en gang. `shopClaim` kjenner `data.gift` og viser Fiskeridirektoratets melding som i dag («Du er ført i fiskermanntallet …») i stedet for kjøpsbekreftelsen. Etter HS2 er gaven en enhet på serveren som de kjøpte.
- **Filer:** ny migrering, `ui/10f-cloud.js` (`cloudGate`, `guestGift`), `ui/10i-shop.js` (`shopClaim`), `tests/sqltest.py`, `tests/guesttest.py` (stand-in for Supabase gir granten).
- **Tester:** `sqltest` med en ny sjekk: to `tm_hello` gir én rad, en gjest får ingen, `guest_merge` gir ingen ekstra; sett rød mot den gamle `tm_hello` først. `guesttest` (luksushaillen om bord etter registreringen, nå fra granten; ny sjekk: `dsb_reg_gift` satt for hånd gir ingenting, sett rød først). `kjoptest`, `cloudtest`. `node --check` og bygg. Ingen 3D, ingen stikkprøver langs kysten (ingenting i spillet avhenger av stedet; svaret sier hvorfor).
- **Måles:** antall `reg_luksus`-rader mot nye kontoer i admin (skal være like), og at registreringen i trakten ikke faller.

### HS2 Kjøpt haill talt fra `grants` (steg 96, før lansering)

- **Prinsippet:** for haill betyr granten ikke «gitt» men «ubrukt». Haillen fra serveren (kjøpt, velkomstgaven, takken) er enheter med ID som ligger på serveren til de aktiveres. Lagringen holder bare en kopi. En lagring som går tapt, mister da aldri en haill fra serveren; det verste som kan skje, er at en brukt haill dukker opp igjen fordi lagringen som husket bruken, gikk tapt før serveren fikk vite det (til spillerens fordel, sjelden).
- **Migrering:**
  - kolonnen `grants.used_at`
  - `shop_pending` gir de åpne som før, pluss haill-grantene som er levert men ikke brukt
  - ny `haill_use(id)` (bare `authenticated`, egen spiller, én gang; svarer om den ble brukt nå)
  - `shop_refund` tar tilbake en haill som ikke er brukt (`used_at is null`), også etter levering
  - **overgangen:** alle haill-grants som alt er levert (3 kjøpte, 83 takk), får `used_at = done_at`, fordi de alt står i lagringenes tall og vi ikke kan se hvilke som er brukt. Bare nye grants følger regelen.
- **Spillet:**
  - `S.haillSrv = [{id, type}]` er speilet av serverens ubrukte haill, byttet ut (ikke lagt til) ved hver `shopClaim`, så en haill som er tatt tilbake eller brukt på en annen enhet, forsvinner
  - beholdningen i Haill-appen er `S.haillInv` (puben, kapitlene) pluss `S.haillSrv`, vist som i dag
  - `useHaill` tar den lokale først (den kan gå tapt med lagringen, serverens kan ikke), ellers en fra serveren: `haill_use(id)`, og ID-en i `S.haillUsed` (de siste 200), så den ikke vises igjen selv om svaret ikke kommer fram
  - uten nett: etter V1
- **Filer:** ny migrering, `core/03-simulation.js` (`giveHaill`, `useHaill`; ren funksjon for beholdningen med en enhetstest), `ui/10i-shop.js` (`shopClaim`, `shopGive`), `ui/phone/01-haill-fiske-service.js` (tallet), `ui/phone/14-act.js` (`haillon`), `ui/11-boot.js` (feltene i en gammel lagring), `tests/unit/`, `tests/kjoptest.py`, `tests/sqltest.py`.
- **Tester:**
  - `kjoptest` med nye sjekker, hver sett rød først: en kjøpt haill ligger i beholdningen; en lagring uten den (et nytt spill på samme konto) får den igjen ved neste start; aktiveringen kaller `haill_use` én gang; en refusjon før bruk tar den bort
  - `sqltest`: `haill_use` bare for egen grant, bare én gang, ikke for en annen spillers ID, overgangen
  - enhetstesten for beholdningen (tom, bare lokal, bare server, begge, brukt ID)
  - `hailltest`, `haillplass`, `guesttest`, `boostklokke`
  - skjermbilder av Haill-appen med haill fra serveren i 800×1280 og 1280×800
  - ingen stikkprøver langs kysten (haillen er lik overalt; svaret sier hvorfor)
- **Måles:** i admin, haill per kilde (kjøpt, gave, takk): levert, brukt, ubrukt, og hendelsen `haill_back` når en lagring får en haill igjen. Den viser hvor ofte et kjøp ville gått tapt før.

### HS3 Trim, Skippertak og «Ferdig nå» tilbake med en tapt lagring (steg 97, før lansering, rett etter HS2)

- `shop_pending` gir også de leverte trim-, Skippertak- og verftsgrantene fra de siste 7 døgnene. Spillet gir på nytt en som ikke står i `S.shopGiven` og ikke er gått ut: trim og Skippertak med tida som er igjen regnet fra `done_at` (aldri forlenget), «Ferdig nå» som en kreditt når jobben ikke finnes i lagringen. `S.shopGiven` må da holde alle ID-ene fra de siste 7 døgnene.
- **Filer:** migrering (`shop_pending`), `ui/10i-shop.js` (`shopClaim`, `shopGive`), `core/15-energy.js` (`giveSkip` med sluttid), `tests/kjoptest.py`, `tests/boostklokke.py`.
- **Tester:** `kjoptest` (trim gitt på nytt etter et nytt spill, med riktig tid igjen; ingen ny trim når den er gått ut; aldri to ganger; sett rød først), `boostklokke`, `skiptest`, `sqltest`.

### HS4 Serveren er fasiten for haill og alt som er kjøpt (steg 98, før lansering, etter HS3)

Jonas 10.11.2026, som svar på V3: «Spillere skal ikke kunne redigere sin egen lagring og gi seg selv så mye haill eller andre varer de selv vil. Det må fikses.» Det er V3 A og mer: også det som alt er aktivert (haillen om bord, trimen, Skippertak), kreditten for «Ferdig nå» og designene skal komme fra serveren, ikke fra lagringen. Etter HS4 er lagringen bare en kopi for disse; ved hver start med nett og hver `shopClaim` skrives de over fra serveren, så det en spiller skriver inn i lagringen selv, forsvinner.

- **Puben** trekkes på serveren: `pub_spin()` (én runde per kveld etter den felles klokka, 15:00–03:00 spilltid, samme hjul `PUB_WHEEL`; serveren regner spilltida med de samme konstantene som `core/01-world.js`, `WORLD_T0` og `GAME_RATE`). Haill og luksushaill blir en grant, ryktet og «tomt» kommer tilbake til spillet som i dag. De 1 000 kronene trekkes fortsatt i spillet (pengene er V4 A). Puben trenger nett; uten nett sier den det.
- **Kapittel 2** i merkene gir en grant én gang per konto (`ach_haill(ch)`; en jukser vinner høyst den ene).
- **Den lokale beholdningen** `S.haillInv` gjøres om til grants én gang per konto ved første start etter fasen, med et lavt tak (forslag: høyst 2 haill og 1 luksushaill, `haill_import`; antatt, se kap. 5), og blir så borte.
- **Haillen om bord:** `haill_use(id, t0)` lagrer spilltida den ble aktivert (serveren godtar den bare nær sin egen spilltid, eller nær tida køen ble laget uten nett etter V1 A). Spillet setter `S.haill` fra serverens sist brukte haill og overser den i lagringen. En haill aktivert uten nett gjelder til serveren har svart; svarer den at enheten ikke finnes, tas haillen bort.
- **Trim og Skippertak:** slutten regnes fra serverens grants (som i HS3) og skrives over `b.trim` og `S.skip` ved hver start; en trim eller et Skippertak serveren ikke kjenner, tas bort.
- **«Ferdig nå»:** kreditten er en grant med `used_at` (`yard_use(id)`), ikke tallet `S.yardCredit` i lagringen.
- **Designene:** de betalte malingsdesignene leses bare fra `entitlements` (`CLOUD.owned`), ikke fra `S.cos` (`ui/10j-paint.js` `owned`, `giveCos`). Det som er tjent i spillet (skrogfargen fra kapittel 3), står i lagringen som før.
- **Gjester** har sin pubhaill og takk-haill som grants på gjesten, og `guest_merge` flytter dem som i dag.
- **Der det ikke er sky** (artifacten, testserveren) er alt som i dag. På spillets egne verter uten sky (`#nocloud`, uten nett, GitHub Pages) gjelder det serveren sa sist, og ingenting nytt kan tjenes eller kjøpes.
- **Det som ikke kan stoppes:** den som endrer minnet i en åpen side med utviklerverktøy, kan gi seg selv noe til siden lastes på nytt. Det blir ikke lagret, når ikke serveren og vises ikke for andre. Fangsten tatt med det, kommer fram som landinger, som serveren fortsatt tar fra spillet (funn 2).
- **Filer:** migrering, `ui/09-hand-fishing.js` (puben), `core/09f-merker.js`, `core/03-simulation.js` (`useHaill`, `S.haill`), `core/15-energy.js`, `core/05-vessels.js` (`S.yardCredit`), `ui/10i-shop.js`, `ui/10j-paint.js`, `ui/11-boot.js`, `tests/unit/`, `tests/sqltest.py`, `tests/kjoptest.py`, `tests/maletest.py` og testen for puben.
- **Tester:** for hver vare en sjekk i `kjoptest` eller `maletest` der lagringen redigeres (haill i beholdningen, haill om bord, trim, Skippertak, kreditten, et design) og spillet etter neste start har det serveren sier, sett rød først; `sqltest` for `pub_spin` (én runde per kveld, ikke utenfor åpningstida), `ach_haill` (én gang), `haill_import` (taket, én gang), `haill_use` med `t0`, `yard_use`.

### HS5 Kronene og landingene sjekket på serveren, og jukserne ut av topplistene (steg 99, før lansering)

V5 A, avgjort i økta 10.11.2026 etter at Jonas overlot det (Jonas: «Du vet sikkert bedre enn meg hvordan vi forhindrer juksing i spillet. Du har tross alt skrevet koden»). Kronene blir i spillet (V4 A), fordi hele økonomien regnes der også når spillet er lukket. Det serveren kan, er å se når en lagring eller en landing ikke kan være ekte, og hindre at det skader andre. Det er bare topplistene, fiskarlagets mål, «Ukas beste fisker» og kvoten for åpen gruppe som rammer andre; det en spiller gjør med sine egne kroner, rammer bare ham selv.

- **Kronene:** `save_put4` sammenligner `summary.cash` og flåtens verdi med forrige lagring. Økningen kan ikke være større enn det serverens egne tall forklarer i tida som har gått: landingene i `landings` (kilo, art og mottak, med mottakets høyeste pris), utbetalingene fra megleren og kvotemarkedet, og et romslig tak per ekte time etter flåten. Går den over, får kontoen et merke (`cheat_flags`: hva, hvor mye, når). Lagringen tas likevel imot (spilleren mister aldri spillet sitt), og ingenting slettes.
- **Landingene** (funn 2b og 2d): `land_put` sjekker landingen mot fangsten som er meldt med `catch_put`, og mot hvor mye flåten kan ha tatt siden forrige landing i ekte tid (lasten etter båttypen i `presence.vtype`, ganget med tida, så tida som tas igjen etter dager borte og havbåtene går gjennom). En landing over det får et merke på samme måte.
- **Et merke** holder kontoen ute av `world_top`, `bygde_top`, `ev_top`, fiskarlagets mål (`lag_get`), «Ukas beste fisker» (`push_week`) og summen for åpen gruppe (`world_year`) til Jonas har sett på det i admin og fjernet merket eller latt det stå. Spilleren ser seg selv på topplista som før (ingen beskjed, ingen straff i spillet), så et feil merke koster lite og kan rettes.
- **Måles først:** sjekkene kjøres mot alle landingene og lagringene som finnes (over 700 landinger og 38 lagringer 10.11.2026), og grensene settes så ingen av dem får merke, før merket tar noen ut av topplistene. Til da skriver den bare merket.
- **Admin:** en fane med merkene (konto, hva, hvor mye over, når), med «Fjern merket» og «La stå»; økonomitallene merkes «meldt av spillet».
- **Filer:** migrering (`save_put4`, `land_put`, `cheat_flags`, topplistene, `lag_get`, `push_week`, `world_year`), `src/admin/index.html`, `tests/sqltest.py`, `tests/admintest.py`. Ingen ting i `src/js/`.
- **Tester:** `sqltest` (en lagring med en million kroner for mye får merke; en ekte lagring etter tre døgn borte med driftsplan gjør det ikke; en landing over det flåten kan ta, får merke; en konto med merke er ute av hver topplisteliste og summen for åpen gruppe, men ser seg selv; «Fjern merket» tar den inn igjen; bare admin med aal2 kan se og fjerne), sett rød mot de gamle funksjonene først; `admintest` med fanen; skjermbilder av fanen i 800×1280 og 1280×800.

#### HS5 bygd 10.11.2026 (steg 99, Jonas' økt, grenen `claude/hs5-kronene-landingene-niqy2q`)

Migreringen `supabase/migrations/20261110160000_cheat_flags.sql`, fanen «Juks» i admin og testene. Slik det virker, står i `docs/systemer/skyen-og-felles-verden.md`, «Kronene og landingene sjekket på serveren». Bryteren `cheat_on` står av til Jonas har sett tallene under.

**Avvik fra planen, med grunn:**
- Kronene sjekkes av en trigger på `saves`, ikke inne i `save_put4`. Da dekkes også `save_put`, `save_put2` og `save_put3`, som fortsatt kan kalles (funn 6), og `save_put4` er urørt.
- «Flåtens verdi» står ikke i lagringens `summary` (bare kassa, båttypen og antall båter), og lån og innbytte gjør at verdien ikke kan regnes rett. Sjekken regner derfor på kassa, og lar en flåte som har vokst telle 5 % av prisen.
- Økningen regnes fra den høyeste kassa i de bevarte lagringene, så en lagring tatt tilbake ikke gir merke.
- «Mottakets høyeste pris» er artens høyeste pris ganget med to. Serveren har ingen pris per mottak.
- Slakken på 300 000 kr er per døgn og ikke per lagring (funnet i gjennomgangen av koden: ellers kunne den brukes om igjen for hver lagring), og kontoens første lagring sjekkes også.
- Sjekken mot meldt fangst teller ikke blåkveite, krabbe og snøkrabbe, som spillet aldri melder fangst for (`takeStock`).
- Spillets adminkonto sjekkes ikke for kroner (den har penger fra Admin-appen: ti hopp på 0,4 til 88,7 millioner i `cash_flags`).

**Målingen (punkt 3), lesende spørringer mot databasen 10.11.2026:** 38 lagringer og 100 bevarte lagringer; 803 landingsrader i 120 kall fra 10 kontoer (5 registrerte, 5 gjester); 266 fangstrader fra de siste fire døgnene (3 kontoer). Alle kontoene har én båt (trebåt, snekke eller sjark).

| Hva | Største ekte | Grensen | Merker |
|---|---|---|---|
| Økning i kassa mellom to bevarte lagringer (90 par, spillere) | 163 959 kr på 4,3 timer (sjark); 155 343 kr over den høyeste kassa før | forklart av landinger, megler og tak per time; resten under | 0 |
| Uforklart økning per døgn (det som er igjen etter landingene og taket per time) | 41 048 kr (3 av 90 par hadde noe uforklart) | 300 000 kr per døgn | 0 |
| Raskeste økning | 43 800 kr på 11 minutter (ny spiller, trebåt); 55 787 kr på 24 minutter (første tur, 500 kg) | som over | 0 |
| Én landing mot lasten | 1,08 laster (snekke 1 080 kg); sjark 6 500 kg og trebåt 500 kg er 1,0 | 8 laster i bøtta ved start | 0 |
| Én landing, spillets adminkonto | 3,97 laster (trebåt 1 985 kg) | 8 laster | 0 |
| Landet på 6 ekte timer | 6,0 laster (trebåt 3 000 kg); sjark 2,1; adminkontoen 9,9 | 8 + 6 = 14 laster | 0 |
| Landet på 24 ekte timer | 10,1 laster (trebåt 5 032 kg); sjark 3,5 | 8 + 24 = 32 laster | 0 |
| Landet på 7 døgn | 19,5 laster (trebåt 9 763 kg); sjark 9,7 (62 996 kg) | 8 + 168 = 176 laster | 0 |
| Landet mot meldt fangst, fire døgn | 1,28 ganger (6 032 kg landet, 4 730 kg meldt); en gjest på første tur 500 kg landet og 0 meldt | 3 ganger + 6 laster | 0 |

**Svakt eller antatt:**
- Sjekken mot meldt fangst kunne bare prøves mot fire døgn og tre kontoer, fordi `catches` slettes etter fire døgn.
- Ingen i databasen har flere båter, driftsplan over flere døgn med mange landinger eller havbåt. Grensene for dem (én last per ekte time per båt, 21 døgn) er regnet, ikke målt.
- Bøtta er romslig: en trebåt kan lande 12 t i døgnet uten merke, mot 5 t som det meste en ekte spiller har gjort. Sjekken mot meldt fangst strammer det til seks laster per fire døgn for den som ikke også melder falsk fangst.
- Båttypen og antall båter er spillets ord.
- Et salg av en båt som ikke er den spilleren står i, kan gi et feil merke når flåteverdien ikke er meldt (spillere uten samtykke til statistikk). Ingen slike salg finnes i dataene.
- Kontoens første lagring holdes mot 15 000 kr. En som har spilt lenge uten sky og så får en konto, kan få et feil merke.

## 4. Valgene

Rekkefølgen og hva som kommer før lansering, er avgjort (V7 A). Det som står igjen:

- **V1. En kjøpt haill aktivert uten nett (HS2).** **Besvart 10.11.2026, A** (Jonas: «V1: A»).
  - **A (anbefalt):** den aktiveres med en gang, og serveren får vite det når nettet er tilbake. Spilleren venter aldri på nettet for noe de har betalt for; det verste er at den kan brukes to ganger hvis to enheter er uten nett samtidig, og bare én enhet styrer om gangen.
  - B: knappen sier «Trenger nett» til serveren har svart.
- **V2. Trim, Skippertak og «Ferdig nå» som går tapt med en lagring (HS3).** **Besvart 10.11.2026, B** (Jonas: «V2: A, det burde rettes asap.», så presisert: «Jeg mener at dette burde vi fikse med en gang, så snart som mulig fordi jeg vurderer å ta inn flere spillere til early access/ beta-testing, og da må alt dette med fungere som det skal»). HS3 er over lanseringslinja, rett etter HS2, og HS1–HS3 tas så snart som mulig, før flere spillere slippes inn i early access.
  - **A (anbefalt):** etter lansering, slik V7 A sier; til da retter admin det for hånd med en grant (`comp`), som i dag. De varer høyst tre døgn, og det har ikke skjedd ennå.
  - B: før lansering, sammen med HS2.
  - C: aldri.
- **V3. Haillen fra puben og kapitlene (HS4).** **Besvart 10.11.2026, A og mer** (Jonas: «Spillere skal ikke kunne redigere sin egen lagring og gi seg selv så mye haill eller andre varer de selv vil. Det må fikses.»); HS4 er skrevet om etter det og flyttet over lanseringslinja. Før det, samme dag: «Skjønner ikke helt hva du mener på denne. Gi meg mer kontekst.» Konteksten er gitt i økta samme dag (under), og **anbefalingen er endret til B**: med pengene i spillet (V4 A) og landingene fra spillet (funn 2) kan en jukser alt skaffe seg mer fangst uten haill, så A stenger en dør mens vinduet står åpent, og puben ville trenge nett. Venter på svaret.
  - Konteksten: haill kommer fra fem steder. Tre gir serveren (kjøpt, velkomstgaven, takken for tilbakemelding); etter HS2 ligger de på serveren og kan ikke gå tapt eller lages. To gir spillet selv: lykkehjulet på puben (1 000 spillkroner, én runde per kveld, trukket i nettleseren) og kapittel 2 i merkene (én haill). De ligger bare i lagringen, så den som redigerer lagringen, kan gi seg selv så mange han vil. Ingen ekte penger og ingen andre spillere rammes av det. For spilleren ser alt likt ut i Haill-appen i begge tilfellene.
  - A (anbefalt til 10.11.2026): også på serveren, så all haill er én saldo og den lokale beholdningen forsvinner. Puben trekkes på serveren, og kapittelhaillen gis én gang per konto.
  - **B (anbefalt fra 10.11.2026):** bare haillen fra serveren (kjøpt, gaven, takken) er saldo, slik den er etter HS2; puben og kapitlene blir i lagringen. Det gjør HS4 unødvendig, og jukset med dem rammer bare jukseren selv.
- **V4. Pengene i spillet (HS5).** **Besvart 10.11.2026, A** (Jonas: «V4: A»).
  - **A (anbefalt):** blir i klienten, med en bedre sjekk og ærlige tall i admin. Hele økonomien regnes i klienten, også når spillet er lukket. Penger på serveren ville kreve at serveren regner økonomien selv, og det er en omskriving av spillet. Der penger går mellom spillere, holder serveren alt regnskapet.
  - B: kontantene som saldo på serveren, med hver krone inn og ut gjennom en funksjon (flere måneders arbeid, og spillet uten nett slutter å virke).
  - C: ingenting, la funn 6 stå for pengene.

- **V5. Spillkronene og det de kjøper (båter, motorer, utstyr, redskap), etter Jonas' «andre varer» 10.11.2026.** **Avgjort i økta 10.11.2026, A og mer,** etter at Jonas overlot det («Du vet sikkert bedre enn meg hvordan vi forhindrer juksing i spillet. Du har tross alt skrevet koden»); HS5 er skrevet om og flyttet over lanseringslinja. HS4 gjør serveren til fasiten for haill og alt som er kjøpt for ekte penger. Kronene er V4 A: hele økonomien regnes i spillet, også når det er lukket, og det en spiller kjøper i de tre handelsstedene, betales med kroner fra lagringen. Den som redigerer kronene, kan da kjøpe alt for spillkroner.
  - **A (anbefalt):** HS4 for haill og det som er kjøpt for ekte penger; for kronene sjekken i HS5 flyttet over lanseringslinja, så en konto med flere kroner enn serverens tall (landingene, megleren, kvotemarkedet) forklarer, merkes i admin, og du avgjør (for eksempel ut av topplistene). Det fanger den som skriver inn en million, ikke den som jukser litt.
  - B: kronene på serveren (V4 B): hver krone inn og ut gjennom en funksjon, og serveren regner salget, lønna, dieselen og driftsplanene selv. Det er en omskriving av spillet over flere måneder, og spillet slutter å virke uten nett.

## 5. Det som er antatt eller usikkert

- **Hvem som har fått velkomstgaven, kan ikke ses.** Lagringene er komprimert, og `events` har ingen `reg_done` nå (de er kanskje ryddet bort; det er ikke sjekket hvor lenge hendelsene holdes). HS1 regner alle de 19 kontoene som har fått den. En som aldri fikk den, får den ikke.
- **Overgangen i HS2** regner de 86 leverte haill-grantene som brukt. En kjøpt haill som ikke er brukt ennå, ligger da fortsatt bare i lagringen, som i dag. Med 3 kjøpte haill er det lite.
- **`tm_hello` som stedet for gaven** er valgt fordi den kalles ved hver start med innlogging. At den alltid kalles før `shopClaim`, er lest i `cloudGate`, ikke prøvd.
- **Taket i overgangen i HS4** (2 haill og 1 luksushaill) er gjettet. Det bør settes etter et oppslag i lagringene (hvor mange haill spillerne har) når HS4 kommer.
- **To enheter uten nett** (V1 A) kan bruke samme haill. Hvor ofte det skjer, vet vi ikke; `haill_use` som svarer «brukt før», blir en hendelse som kan telles.
- **Sjekken i HS5** kjenner ikke prisen spillet ga for en landing (`land_put` har kilo, art og mottak). Den bruker den høyeste prisen arten kan få og et romslig tak, så den fanger store jukser og ikke små. Grensene settes etter de ekte lagringene og landingene før merket tar noen ut av topplistene.
- **Regelverket:** ingenting her bygger på lover eller forskrifter. Angreretten ved kjøpet (angrerettloven § 22 n) er som før.

## 6. Hva planen ikke gjør

- **Bygger ingenting**, kjører ingen migrering og rører ikke `src/`, `tests/` eller `supabase/`.
- **Endrer ikke kjøpet:** prisene, `shop-checkout`, Stripe-webhooken og `shop_paid` er som før. Ingen ny vare.
- **Gjør ikke haillen synlig for andre.** Ingen funksjon som deler noe (`pos_put`, `pos_world`, `land_put`, topplistene, Kystposten), leser `grants` eller `used_at`.
- **Tar ikke landingene og fangsten** (funn 2 og 3, gjort 05.11.2026) eller posisjonen og fartstida (funn 11).
- **Tar ikke designene**, som alt ligger på serveren (`entitlements`).
- **Oppdaterer ikke systemdokumentet** (`docs/systemer/skyen-og-felles-verden.md`) eller backloggen: økta som planla, eide bare `docs/planer/`. Fasene skriver det de bygger inn der.

## Status

- 10.11.2026: **HS5 bygd** (steg 99, Jonas' økt, grenen `claude/hs5-kronene-landingene-niqy2q`): migreringen `20261110160000_cheat_flags.sql`, fanen «Juks» i admin, `sqltest` og `admintest`. Tallene fra målingen står under HS5. Bryteren `cheat_on` er av og slås på når Jonas har sett tallene (admin → Juks → «Slå på»).
- 10.11.2026: **HS1 rullet ut** (daee2c71, versjon 614ea0f825ec; Jonas: «Rull ut på det store blå når du mener du er klar»). Migreringen ble kjørt først (`reg_gift`), spillet pushet rett etter. Lesende spørring etterpå: 13 `reg_luksus`-rader, alle levert, 13 kontoer, ingen hos gjester, varen ikke aktiv. `tm_hello` i databasen var lik den i repoet før migreringen.
- 10.11.2026: **HS1 bygd** (steg 95, Jonas' økt, grenen `claude/hs1-velkomstgave-u3rnfm`); rullet ut samme dag, se linja over. Migreringen `20261110150000_reg_gift.sql` (varen `reg_luksus`, delindeksen `grants_reg_gift`, `tm_hello` med granten, de leverte radene for kontoene som finnes), `shopClaim` med grenen `data.gift`, `guestGift` som bare ber om `shopClaim`. Det som avviker fra planen eller er verdt å vite:
  - **Kontoene er 13, ikke 19.** Planen talte `players` uten `guest`-merket, men merket settes først når en gjest lander eller seiler; 7 av de 19 er anonyme innlogginger (gjester) som ikke har gjort det ennå (lesende spørring mot `auth.users` 10.11.2026: 107 anonyme, 13 WorkOS-ID-er, 120 spillere). Migreringen gir derfor den leverte raden til ID-ene som ikke er en uuid (WorkOS, `user_…`). Hadde gjestene fått en levert rad, ville `guest_merge` flyttet den til den nye kontoen, og den som registrerte seg, hadde aldri fått gaven.
  - **Rekkefølgen ved utrullingen:** migreringen først, spillet rett etter. En side fra før HS1 mot en server med `reg_luksus` gir den som registrerer seg i mellomtida, to luksushaill (nøkkelen og granten) og kjøpsbekreftelsen «Takk for kjøpet!» med varenavnet `reg_luksus` uten pris (sett i `guesttest` mot den gamle koden). Det gjelder bare nye registreringer på en gammel side, og går over når siden er oppdatert.
  - **Et nytt spill etter at gaven er levert,** har den ikke (granten er `done`), som for kjøpt haill i dag. HS2 retter det (gaven blir en ubrukt enhet på serveren).
  - `shopClaim` holder nå bekreftelseslista (`rc`) for sitt eget kall, fordi `guestGift` kan starte et kall mens et annet venter på `shop_done`.
  - Etter utrullingen: `select count(*) from grants where product_id = 'reg_luksus'` skal være lik antall kontoer (WorkOS-ID-er i `players`).
- 10.11.2026: V5 avgjort i økta etter at Jonas overlot det («Du vet sikkert bedre enn meg hvordan vi forhindrer juksing i spillet. Du har tross alt skrevet koden»): A og mer; HS5 skrevet om (kronene og landingene sjekket på serveren, et merke holder kontoen ute av topplistene og summen for åpen gruppe til Jonas har sett på det) og flyttet over lanseringslinja; startmeldingen i `start/99.md`. Alle valgene i planen er tatt; steg 49 er ferdig.
- 10.11.2026: V3 besvart av Jonas («Spillere skal ikke kunne redigere sin egen lagring og gi seg selv så mye haill eller andre varer de selv vil. Det må fikses.»): HS4 skrevet om (serveren er fasiten for haill og alt som er kjøpt, også det som er aktivert) og flyttet over lanseringslinja. Om «andre varer» også gjelder spillkronene og det de kjøper, er valg 30 (V5).
- 10.11.2026: V2 presisert av Jonas: før lanseringen og så snart som mulig (early access); HS3 flyttet over lanseringslinja, startmeldingen skrevet (`start/97.md`).
- 10.11.2026: Jonas svarte V1 A, V2 A («det burde rettes asap») og V4 A; V3 venter på svaret etter mer kontekst (anbefalingen endret til B). Startmeldingen for HS2 er skrevet (`start/96.md`).
- 10.11.2026: planen skrevet (steg 49, Jonas' økt, grenen `claude/o6-funn-6-haill-saldo-ume93b`). HS1 er klar (ingen valg; V7 A avgjorde den); HS2 venter på V1, HS3 på V2, HS4 på V3, HS5 på V4. Valgene står som valg 29 i køen. Ingenting er bygd.
