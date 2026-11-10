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

Før lansering (over lanseringslinja, sporet «Lansering», med L1e): **HS1**, **HS2** og **HS3** (V2 B, Jonas 10.11.2026: så snart som mulig, før flere spillere slippes inn i early access). Etter lansering: **HS4** (etter V3) og **HS5**. Alle rører ekte penger eller gaver: PR-en venter på Jonas før utrulling (`CLAUDE.md`), og migreringen kjøres av økta først når Jonas har sett PR-en. Patchnotes nevner ingenting av dette (det er ekte penger og juks); bare en ny linje i Haill-appen, hvis noen, beskrives ved hva den gjør.

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

### HS4 Saldoen: all haill på serveren (steg 98, etter lansering)

Etter V3 A:
- **Puben** trekkes på serveren: `pub_spin()` (én runde per kveld etter den felles klokka `WCLOCK`, 15:00–03:00 spilltid, samme hjul), som gir en grant ved haill eller luksushaill. De 1 000 kronene trekkes fortsatt i klienten.
- **Kapittel 2** i merkene gir en grant én gang per konto (`ach_haill(ch)`; en jukser vinner høyst den ene).
- **Den lokale beholdningen** `S.haillInv` gjøres om til grants én gang per lagring ved første start etter fasen, med et tak (forslag: høyst 3 av hver; antatt, se kap. 5), og blir så borte. Etter det er all haill enheter på serveren, brukt gjennom `haill_use`.
- **Gjester** får sin pubhaill som grant på gjesten, og `guest_merge` flytter den som i dag.
- **Filer:** migrering, `ui/09-hand-fishing.js` (puben), `core/09f-merker.js`, `core/03-simulation.js`, `ui/10i-shop.js`, `tests/sqltest.py`, `tests/kjoptest.py` og testen for puben.

### HS5 Pengene: en bedre sjekk og ærlige tall i admin (steg 99, etter lansering)

Etter V4 A:
- `saves_cash_check` regner pengene mot det serveren selv har (landingene i `landings` med mottakets pris, megleren, kvotemarkedet) i stedet for klientens egne hendelser. Den varsler i admin, og stopper ingenting.
- Økonomitallene i admin merkes «meldt av spillet».
- **Filer:** migrering, `src/admin/index.html`, `tests/sqltest.py`, `tests/admintest.py`.

## 4. Valgene

Rekkefølgen og hva som kommer før lansering, er avgjort (V7 A). Det som står igjen:

- **V1. En kjøpt haill aktivert uten nett (HS2).** **Besvart 10.11.2026, A** (Jonas: «V1: A»).
  - **A (anbefalt):** den aktiveres med en gang, og serveren får vite det når nettet er tilbake. Spilleren venter aldri på nettet for noe de har betalt for; det verste er at den kan brukes to ganger hvis to enheter er uten nett samtidig, og bare én enhet styrer om gangen.
  - B: knappen sier «Trenger nett» til serveren har svart.
- **V2. Trim, Skippertak og «Ferdig nå» som går tapt med en lagring (HS3).** **Besvart 10.11.2026, B** (Jonas: «V2: A, det burde rettes asap.», så presisert: «Jeg mener at dette burde vi fikse med en gang, så snart som mulig fordi jeg vurderer å ta inn flere spillere til early access/ beta-testing, og da må alt dette med fungere som det skal»). HS3 er over lanseringslinja, rett etter HS2, og HS1–HS3 tas så snart som mulig, før flere spillere slippes inn i early access.
  - **A (anbefalt):** etter lansering, slik V7 A sier; til da retter admin det for hånd med en grant (`comp`), som i dag. De varer høyst tre døgn, og det har ikke skjedd ennå.
  - B: før lansering, sammen med HS2.
  - C: aldri.
- **V3. Haillen fra puben og kapitlene (HS4).** Jonas 10.11.2026: «Skjønner ikke helt hva du mener på denne. Gi meg mer kontekst.» Konteksten er gitt i økta samme dag (under), og **anbefalingen er endret til B**: med pengene i spillet (V4 A) og landingene fra spillet (funn 2) kan en jukser alt skaffe seg mer fangst uten haill, så A stenger en dør mens vinduet står åpent, og puben ville trenge nett. Venter på svaret.
  - Konteksten: haill kommer fra fem steder. Tre gir serveren (kjøpt, velkomstgaven, takken for tilbakemelding); etter HS2 ligger de på serveren og kan ikke gå tapt eller lages. To gir spillet selv: lykkehjulet på puben (1 000 spillkroner, én runde per kveld, trukket i nettleseren) og kapittel 2 i merkene (én haill). De ligger bare i lagringen, så den som redigerer lagringen, kan gi seg selv så mange han vil. Ingen ekte penger og ingen andre spillere rammes av det. For spilleren ser alt likt ut i Haill-appen i begge tilfellene.
  - A (anbefalt til 10.11.2026): også på serveren, så all haill er én saldo og den lokale beholdningen forsvinner. Puben trekkes på serveren, og kapittelhaillen gis én gang per konto.
  - **B (anbefalt fra 10.11.2026):** bare haillen fra serveren (kjøpt, gaven, takken) er saldo, slik den er etter HS2; puben og kapitlene blir i lagringen. Det gjør HS4 unødvendig, og jukset med dem rammer bare jukseren selv.
- **V4. Pengene i spillet (HS5).** **Besvart 10.11.2026, A** (Jonas: «V4: A»).
  - **A (anbefalt):** blir i klienten, med en bedre sjekk og ærlige tall i admin. Hele økonomien regnes i klienten, også når spillet er lukket. Penger på serveren ville kreve at serveren regner økonomien selv, og det er en omskriving av spillet. Der penger går mellom spillere, holder serveren alt regnskapet.
  - B: kontantene som saldo på serveren, med hver krone inn og ut gjennom en funksjon (flere måneders arbeid, og spillet uten nett slutter å virke).
  - C: ingenting, la funn 6 stå for pengene.

## 5. Det som er antatt eller usikkert

- **Hvem som har fått velkomstgaven, kan ikke ses.** Lagringene er komprimert, og `events` har ingen `reg_done` nå (de er kanskje ryddet bort; det er ikke sjekket hvor lenge hendelsene holdes). HS1 regner alle de 19 kontoene som har fått den. En som aldri fikk den, får den ikke.
- **Overgangen i HS2** regner de 86 leverte haill-grantene som brukt. En kjøpt haill som ikke er brukt ennå, ligger da fortsatt bare i lagringen, som i dag. Med 3 kjøpte haill er det lite.
- **`tm_hello` som stedet for gaven** er valgt fordi den kalles ved hver start med innlogging. At den alltid kalles før `shopClaim`, er lest i `cloudGate`, ikke prøvd.
- **Taket på 3 i overgangen i HS4** er gjettet. Det bør settes etter et oppslag i lagringene (hvor mange haill spillerne har) når HS4 kommer.
- **To enheter uten nett** (V1 A) kan bruke samme haill. Hvor ofte det skjer, vet vi ikke; `haill_use` som svarer «brukt før», blir en hendelse som kan telles.
- **Sjekken i HS5** forutsetter at serveren kan regne prisen på en landing. `land_put` har kilo, art og mottak, men prisen er klientens; HS5 må bruke prisen spillet viste og regne med et slingringsmonn.
- **Regelverket:** ingenting her bygger på lover eller forskrifter. Angreretten ved kjøpet (angrerettloven § 22 n) er som før.

## 6. Hva planen ikke gjør

- **Bygger ingenting**, kjører ingen migrering og rører ikke `src/`, `tests/` eller `supabase/`.
- **Endrer ikke kjøpet:** prisene, `shop-checkout`, Stripe-webhooken og `shop_paid` er som før. Ingen ny vare.
- **Gjør ikke haillen synlig for andre.** Ingen funksjon som deler noe (`pos_put`, `pos_world`, `land_put`, topplistene, Kystposten), leser `grants` eller `used_at`.
- **Tar ikke landingene og fangsten** (funn 2 og 3, gjort 05.11.2026) eller posisjonen og fartstida (funn 11).
- **Tar ikke designene**, som alt ligger på serveren (`entitlements`).
- **Oppdaterer ikke systemdokumentet** (`docs/systemer/skyen-og-felles-verden.md`) eller backloggen: økta som planla, eide bare `docs/planer/`. Fasene skriver det de bygger inn der.

## Status

- 10.11.2026: V2 presisert av Jonas: før lanseringen og så snart som mulig (early access); HS3 flyttet over lanseringslinja, startmeldingen skrevet (`start/97.md`).
- 10.11.2026: Jonas svarte V1 A, V2 A («det burde rettes asap») og V4 A; V3 venter på svaret etter mer kontekst (anbefalingen endret til B). Startmeldingen for HS2 er skrevet (`start/96.md`).
- 10.11.2026: planen skrevet (steg 49, Jonas' økt, grenen `claude/o6-funn-6-haill-saldo-ume93b`). HS1 er klar (ingen valg; V7 A avgjorde den); HS2 venter på V1, HS3 på V2, HS4 på V3, HS5 på V4. Valgene står som valg 29 i køen. Ingenting er bygd.
