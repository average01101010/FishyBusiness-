# Haillen på serveren (Ø6 funn 6, steg 49, plan 10.11.2026)

Planen for funn 6 i `docs/planer/sikkerhet-skyen.md`: haillen og velkomstgaven ligger i dag hos klienten. Ingenting er bygd, ingen migrering er kjørt, og ingenting i `src/` er rørt. Fasene rører `ui/10i-shop.js`, `grants` og `shop_*`, altså ekte penger: PR-en for hver fase venter på Jonas (`CLAUDE.md`).

## 1. Hva Jonas ba om

- Jonas 10.11.2026, valg 16 V7 i `docs/planer/lansering-plan.md`: **A**. Før lanseringen bare det som gjelder ekte penger og gaver, det vil si velkomstgaven gitt én gang fra serveren og kjøpt haill talt fra `grants`. Saldoen i databasen, brukt gjennom en funksjon, kommer etter lanseringen.
- Reglene som gjelder (`CLAUDE.md`, «Engasjement og inntekt»):
  - Luksushaill gis bare som gave ved registrering og som takk for tilbakemelding.
  - Haill gir plass på topplista, men det synes aldri for andre at noen har brukt haill (Jonas 06.10.2026).
  - Variabel belønning kommer fra sjøen, ikke fra lommeboka.
  - Gjester kan ikke kjøpe.
- Startmeldingen (`start/49.md`) ber i tillegg om at ingen mister noe og at den som er ærlig, ikke straffes.

## 2. Slik er det i dag (lest 10.11.2026)

**Hva klienten eier.** Beholdningen er `S.haillInv = {haill, luksus}` i lagringen, og den aktive haillen er `S.haill = {type, t0, how}`. Begge gis og brukes bare i nettleseren:

- `giveHaill(type, how)` og `useHaill(type)` i `core/03-simulation.js` (linje 1199–1200) legger til og trekker fra lokalt.
- Lagringen går til serveren med `save_put4` (`20261013120000_active.sql`) slik den er, og serveren leser ikke `haillInv`.

**Hvor haillen kommer fra:**

| Kilde | Hvor | Hva serveren vet |
|---|---|---|
| Kjøpt haill eller luksushaill | Stripe → `stripe-webhook` → `shop_paid` lager en rad i `grants`; spillet henter den med `shop_pending`, gir den (`shopGive` i `ui/10i-shop.js`) og sier fra med `shop_done` | Alt: betalingen, raden og om den er gitt. Kan ikke forfalskes (sjekket i funn 6). |
| Takk-haill for tilbakemelding | `admin_feedback_set` lager en rad i `grants` (`fb_haill`, `reward:true`, `20261006140000_feedback_reward.sql`); spillet gir den i `shopClaim` | Alt, som for kjøp |
| **Velkomstgaven** (luksushaill) | `guestGift()` i `ui/10f-cloud.js` (linje 957): gis når `localStorage.dsb_reg_gift` finnes; nøkkelen settes etter `guest_merge` (linje 174) | **Ingenting.** Se under. |
| Puben (hjulet: 6 + 6 av 100 haill, 3 luksus) | `ui/09-hand-fishing.js` linje 40, `PUB_WHEEL` i `core/03-simulation.js`, én runde per pubkveld | Ingenting |
| Kapittel 2 i merkene | `achChapter(1)` i `core/09f-merker.js` linje 206 | Ingenting |
| Testkjøp | `payBuy` gir med én gang når `shopMode()` er `'test'` (artifacten, testene, adminens spill) | Ingenting (med vilje) |

**Hullene med velkomstgaven:**

- `dsb_reg_gift` settes etter `guest_merge` uansett svar, også når sammenslåingen feilet eller ga `merged:false`.
- Hvem som helst kan sette nøkkelen selv i nettleseren. Da gir hver start én ny luksushaill.
- Den som lager konto rett fra innloggingsskjermen («Lag konto», `cgUp`) uten å ha vært gjest, får ingen velkomstgave i det hele tatt.

**Det serveren allerede vet:** alt i `grants` (kjøpt, refundert, gitt, takk). Når en gjest blir konto, flyttes radene med (`guest_merge` i `20261105130000_guest_world.sql`). Pengene i spillet (kroner) er også klientens: `saves_cash_check` varsler bare, og bare med samtykke (funn 6).

**Det som ikke kan stoppes med en saldo:** fangsten regnes i klienten. Den som endrer koden, kan gange opp fangsten uten haill i det hele tatt (funn 2). Saldoen på serveren verner altså **varen** (at haill ikke kan lages gratis, og at tallene i admin stemmer), ikke topplista. Det er grunnen til at V7 A er riktig: jukset rammer bare jukseren selv.

## 3. Fasene (én økt hver)

### 49a, F-a: velkomstgaven fra serveren og haillen talt fra `grants` (før lansering)

- **Migrering** `supabase/migrations/2026111…_reg_gift.sql`:
  - **Produkt:** et nytt produkt `reg_gift` (0 kr, `active = false`, `data {"give":"haill","type":"luksus","gift":"reg"}`).
  - **Én gang per konto:** en unik delindeks `grants (player_id) where product_id = 'reg_gift'`, så gaven aldri kan gis to ganger.
  - **Funksjonen:** `reg_gift(p)` lager raden med `on conflict do nothing`. Den kalles fra `guest_merge` når sammenslåingen gikk (`merged:true`), og fra `tm_hello` når raden i `players` er ny og kontoen ikke er gjest (V1).
  - **Ingen gave i ettertid:** kontoer fra før får ingenting.
  - **Tallene for admin:** `admin_haill()` (bare `is_admin()` med aal2) gir haill og luksus kjøpt, refundert, takk og velkomst per uke, og hvor mange som er gitt, alt fra `grants`.
- **Klienten:**
  - `guestGift()` gir ikke lenger noe. Den sletter bare `dsb_reg_gift` om den finnes.
  - `shopClaim` kjenner igjen `gift:'reg'` og viser den samme meldingen fra Fiskeridirektoratet som i dag («Du er ført i fiskermanntallet …»), ikke «Takk for kjøpet».
  - `src/admin/index.html` får tallene i pengefanen.
- **Rekkefølgen ved utrulling:** klienten først, så migreringen. En side som er hurtiglagret fra før (PWA), kan gi gaven én gang til lokalt. Det er høyst én luksushaill per konto, én gang.
- **Filer:** ny migrering, `ui/10f-cloud.js` (`guestGift`, linje 174), `ui/10i-shop.js` (`shopClaim`), `src/admin/index.html`, `tests/sqltest.py`, `tests/kjoptest.py`, `ui/phone/07-patch.js` (patchnotatet sier bare at velkomstgaven nå kommer også til den som lager konto rett fra innloggingen; ingen pris, ingen grunn).
- **Tester:**
  - `sqltest` med nye sjekker:
    - gaven gis én gang gjennom `guest_merge` og én gang gjennom `tm_hello` for en ny konto, men ikke to ganger
    - ingen gave for en konto fra før, for en gjest eller når `merged:false`
    - `admin_haill` er stengt for spillere
    - **Sett rød først:** sjekkene skrives og kjøres mot migreringene uten den nye, og skal da feile.
  - `kjoptest`:
    - `dsb_reg_gift` satt for hånd gir ingenting
    - en `reg_gift`-rad fra `shop_pending` gir én luksushaill og Fiskeridirektoratets melding, og den gis bare én gang etter omlasting
    - **Sett rød først** med `git stash` på klientendringen.
  - `admintest` for pengefanen.
  - Skjermbilder av velkomstmeldingen i begge formater.
  - Ingen stikkprøver langs kysten: dette har ikke noe med stedet å gjøre.
- **Utrulling:** PR til Jonas (ekte penger). Migreringen kjøres når Jonas har godkjent, etter at klienten er ute.

### 49b, F-b1: saldoen i databasen (etter lansering, bare serveren)

- **Migrering** `…_haill_bal.sql`:
  - **Tabellene:**
    - `haill_bal (player_id, type, n)` er beholdningen.
    - `haill_ledger (id, player_id, type, delta, why, ref, at)` er hver endring med grunn.
    - `haill_active (player_id, type, gh)` er den aktive haillen, med `gh` etter den felles klokka (`world_gh()`).
    - Alle tre har RLS uten policy og `revoke all from anon, authenticated`.
  - **Funksjonene** (`security definer`, `pid()`):
    - `haill_mine()` gir beholdningen og den aktive haillen.
    - `haill_use(type)` trekker én, setter den aktive og feiler under null.
    - `haill_pub(evening)` trekker hjulet på serveren etter V3: høyst én runde per pubkveld regnet fra `world_gh()`, og 1000 kr trekkes fortsatt i spillet.
    - `haill_ch(ch)` gir kapittelgaven én gang (`ref` unik).
  - **Kjøpt haill:** `shop_done` legger haill-radene (`give:'haill'`, også takk og velkomst) inn i saldoen når spillet melder dem gitt. Sider fra før gir fortsatt lokalt og fungerer, så migreringen kan kjøres før den nye klienten.
  - **Lagringer med haill fra før:** startsaldoen etter V2.
  - **Gjester:** `guest_merge` flytter saldoen og loggen fra gjesten til kontoen og legger sammen.
  - `delete_me` sletter alt med kontoen (`on delete cascade`).
- **Filer:** ny migrering, `tests/sqltest.py`.
- **Tester:** `sqltest`:
  - saldoen kan ikke gå under null
  - to samtidige `haill_use` gir én
  - hjulet høyst én gang per pubkveld
  - kapittelgaven én gang
  - sammenslåingen legger sammen
  - startsaldoen etter V2
  - **vakten for topplista** (punkt 4)
  - **Sett rød først** mot migreringene uten den nye.
- **Utrulling:** PR til Jonas (`shop_done` er `shop_*`), migreringen kjøres når Jonas har godkjent.

### 49c, F-b2: spillet bruker saldoen (etter 49b)

- **Klienten:**
  - Med skyen på er `S.haillInv` og `S.haill` speil av `haill_mine()`. De hentes ved start, etter `shopClaim`, når fanen blir synlig og etter hver bruk.
  - «Aktiver» i Haill-appen kaller `haill_use` (V4).
  - Pubhjulet viser utfallet fra `haill_pub`.
  - `achChapter(1)` kaller `haill_ch`.
  - `shopGive` gir ikke lenger haill lokalt, men henter saldoen etter `shop_done`.
  - Uten sky (artifacten, testene, `#nocloud` utenfor spillets verter) går alt lokalt som i dag.
- **Ren funksjon i kjernen:** `haillFromServer(local, srv)` (ny i `core/03-simulation.js`, ved `giveHaill`) avgjør hva som vises, og får enhetstester med grensetilfellene: ingen sky, svaret uteblir, den lokale beholdningen er høyere enn serverens, og den aktive haillen er utløpt.
- **Filer:** `core/03-simulation.js`, `ui/10i-shop.js`, `ui/10f-cloud.js`, `ui/09-hand-fishing.js`, `core/09f-merker.js`, `ui/phone/01-haill-fiske-service.js`, `ui/phone/14-act.js`, `ui/phone/07-patch.js`, ny `tests/unit/haill.test.mjs`, `tests/kjoptest.py`, `tests/shoptest.py`.
- **Tester:**
  - `node tests/unit/run.mjs`
  - `kjoptest` og `shoptest`: haillen fra serveren, «Aktiver» uten nett sier fra og trekker ikke, og hjulet med serverens utfall
  - `savestest`: gamle lagringer med `haillInv` lastes som før
  - `tut.py` i ett format (logikk, ikke UI)
  - Skjermbilder av Haill-appen og pubhjulet i begge formater.
- **Utrulling:** PR til Jonas.

## 4. Topplista viser fortsatt ikke haill

- **Tabellene er stengt:** `haill_bal`, `haill_ledger` og `haill_active` leses bare gjennom `haill_mine` (egen konto) og `admin_haill` (Jonas med aal2).
- **Ingen åpen funksjon rører dem:** ingen funksjon som er åpen for spillerne (`pos_world`, `pos_put`, topplistene, `world_agg_get`, AIS-kortet, Kystposten `news_*`, `rt_ticket`, reléet i `tools/server/rt/`), leser dem eller tar med noe om haill.
- **Vakt i `sqltest`:** den leser kildeteksten til alle funksjoner i `pg_proc`. Den feiler hvis en annen funksjon enn de fem som er nevnt i fasene (`haill_mine`, `haill_use`, `haill_pub`, `haill_ch`, `admin_haill`), pluss `shop_done` og `guest_merge`, nevner `haill_bal`, `haill_ledger` eller `haill_active`. Den ses rød ved å legge inn en prøvefunksjon som leser `haill_bal`.
- **Merkene:** delte fangstmerker regnes fortsatt som fisket uten haill (`lf`, funn 11), og det endres ikke.

## 5. Valgene

**Besvart 10.11.2026 (Jonas):** «V1: A, V2: A, V3: A, V4: A». Fasene bygges etter A på alle fire.

- **V1. Hvem får velkomstgaven (49a)?**
  - **A (anbefalt):** hver ny konto én gang, enten den kommer fra en gjest (`guest_merge`) eller lages rett fra innloggingen. «Gave ved registrering» gjelder begge veiene, og i dag får den som lager konto direkte, ingenting, noe som ser ut som en glipp.
  - B: bare gjester som registrerer seg, som i dag.
- **V2. Haill som ligger i lagringene fra før (49b)?**
  - **A (anbefalt):** startsaldoen er det som står i lagringen i skyen. Dukker enheten opp med mer ved første start etter 49c (spilt etter siste lagring), tas forskjellen én gang. Over 10 merkes kontoen i `admin_haill` så Jonas ser det, men ingenting tas fra noen. Ingen mister noe, den ærlige straffes ikke, og jukset fra før rammet bare jukseren selv.
  - B: som A, men med et tak (for eksempel det kontoen har fått i `grants` pluss 20 for puben og kapittelet). Taket kan treffe en ærlig spiller som har vært heldig på puben.
  - C: alle starter med det `grants` sier, og det de har vunnet på puben og i merkene, forsvinner. Det straffer de ærlige.
- **V3. Haill som vinnes i spillet (puben og kapittel 2) i 49b og 49c?**
  - **A (anbefalt):** serveren trekker hjulet (`haill_pub`, én gang per pubkveld etter den felles klokka) og gir kapittelgaven én gang (`haill_ch`). Det er den eneste måten saldoen kan stemme på. Sjansene på hjulet og prisen er de samme, og utfallet er fortsatt tilfeldig og gratis, fra sjøen og ikke fra lommeboka.
  - B: to kasser. Den kjøpte og gitte haillen ligger på serveren, og den vunne ligger hos klienten som i dag. Det er enklere, men den vunne kan da lages gratis, og Haill-appen må vise to tall eller slå dem sammen.
  - C: klienten melder hva den vant, og serveren tar det med et tak per pubkveld. Det er halvveis: taket stopper mengden, men ikke utfallet.
- **V4. «Aktiver» uten nett (49c)?**
  - **A (anbefalt):** krever nett. Spillet er online med én felles klokke, og knappen sier «Får ikke kontakt. Prøv igjen når du har nett» uten å trekke noe. En kø som tas igjen senere, kan gi samme haill to ganger på to enheter.
  - B: aktiveres lokalt og meldes når nettet kommer, med retting om saldoen ikke holdt.

## 6. Det som er antatt eller usikkert

- **Sider fra før:** at ingen spiller har en side som er hurtiglagret så lenge at den gir velkomstgaven lokalt etter 49a, er antatt. Det koster i så fall én luksushaill, én gang.
- **Grensen på 10** i V2 A er et startpunkt for hva som er vanlig. Den er ikke målt mot databasen. Økta for 49b teller `haillInv` i `saves.data` først (én spørring) og justerer.
- **Den aktive haillen:** `S.haill.t0` er i dag spillets egen tid (`boostT()`). I 49b blir den felles klokka (`gh`) sannheten. At de to er det samme for en spiller som er à jour, følger av `WCLOCK`, men det må prøves med en lagring som har stått stille, i 49c.
- **Ventetid ved aktivering:** `haill_use` legger et rundtur-kall foran haillen. Det er antatt at det merkes mindre enn ett sekund på mobilnett.
- **Testprosjektet:** prøven mot testprosjektet venter på L1a (steg 74). Før det prøves migreringene bare lokalt i `sqltest`.

## 7. Hva planen ikke gjør

- **Pengene i spillet (kroner) blir ikke en saldo på serveren.** Det ville kreve at salget av fisk regnes på serveren (prisene i mottakene, kvotene, landingene), og det er funn 2 og en mye større plan. `saves_cash_check` står som varsel.
- **Fangsten verner den ikke mot jukset.** Den som endrer koden, kan fortsatt gange opp fangsten (funn 2), og saldoen stopper bare gratis haill.
- **Ingen haill gis i ettertid.** Kontoer fra før får ikke velkomstgaven.
- **Trim, Skippertak, «Ferdig nå» og malingen** blir ikke saldoer. De gis fra `grants` som i dag, og malingen sjekkes alt mot `entitlements` (funn 5).
- **Ingenting ved butikken, prisene eller Stripe endres.**

## Status

- 10.11.2026: planen skrevet (steg 49, Jonas' økt, grenen `ccr-c1a6f716-vlr7nu`). Fasene er steg 49a, 49b og 49c i køen med `venter på valg`. Valgene V1–V4 var valg 29 i køen.
- 10.11.2026: valg 29 besvart av Jonas, «V1: A, V2: A, V3: A, V4: A». 49a er `klar`; 49b venter på 49a og lanseringen, 49c på 49b. Ingenting er bygd.
