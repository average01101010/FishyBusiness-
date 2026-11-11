# Lanseringen: testutgave og produksjon, lagringsporten, feilvarsel, betalingen, sikkerheten og det juridiske (L1, plan 09.11.2026)

Steg 71 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-41bf0bd0-c7ywb9`. Bare dokumenter: ingenting er bygd, `.github/` er ikke rørt, og ingenting er skrevet til databasen (bare lesende spørringer med tall, ingen spillerdata). Fasene er steg 74–79 i køen, over lanseringslinja, med `venter på valg`. Valgene står som **L1** under «Valg som venter på Jonas» i køen og i kap. 4 her.

## 1. Hva Jonas ba om

- 09.11.2026, om MVP-en: «kystflåten er MVPen. Havbåtene kan vente. Det vil ta ganske lang tid før spillerene kommer til det punktet at de kan bruke disse båtene uansett, men jeg tenkte det var bra å lage bra modeller av de tidlig for å kunne bruke de i promo-sammenheng, feks en trailer.» Spillinnholdet før lansering er lanseringslinja i køen. Denne planen er resten: det som må være på plass før Det Store Blå offentliggjøres.
- 08.10.2026 (`docs/lansering.md` B7), om stabiliteten: den venter «til spillet offentliggjøres, fordi det endres mange ganger daglig i utviklingen». Punktene var ekte lagringer som stopper utrullingen, en testutgave før produksjonen, og feilene fra spillerne som varsel til Jonas.
- Startmeldingen for steg 71 (09.11.2026) ba om sju deler: testutgave og produksjon, lagringsporten, feilvarselet, betalingen i ekte modus, sikkerheten i funn 6 og 7, det juridiske som står igjen i A5, og sluttsjekken.

## 2. Hva som finnes i dag (sjekket 09.11.2026)

### Utrullingen

- **Hver push til arbeidsgrenen går rett til spillerne.** `deploy.yml` («Appen på Hetzner») og `pwa.yml` («Appen på GitHub Pages») kjører på `push` til `main` og `ccr-5e1ba2f4-pusvyd` når `src/**`, `build.mjs`, kartreleasen eller `tools/server/**` endres. Det ble 36 utrullinger på 48 timer 07.–08.11.2026. Portene er enhetstestene (`node tests/unit/run.mjs`) og `boottest` mot `dist-pwa`; lagringstesten er ikke med.
- **Serveren:** én Caddy-blokk for `detstorebla.no` med roten `/srv/detstorebla/current` (`tools/server/Caddyfile`), og deploy-brukeren kan bare kjøre `rrsync` inn i `/srv/detstorebla` (`setup.sh`). Endres Caddyfilen, må Jonas kjøre `setup.sh` på nytt som root. Utrullingen laster den ikke opp.
- **`main` er tom.** Standardgrenen er arbeidsgrenen (valg 2, 08.11.2026). `.claude/settings.json` nekter en økt å pushe til `main` i alle former.
- **«Ny versjon er ute»** (`ui/10p-install.js` `UPDATE`) spør `version.json` ved siden av siden og viser stripa når versjonen er en annen. Siden versjonen hører til nettstedet, virker det også for en testadresse.
- **Patchnotene** (`PATCH` i `ui/phone/07-patch.js`) ligger i koden, så de viser alltid det som er i bygget spilleren har.
- **GitHub Pages** får de samme utrullingene. Pages er ikke lov å bruke til kommersiell programvare (`lansering.md` G), og spillere som har spilt der, har lagringen sin i nettleseren på den adressen.

### Lagringene

- `tools/saves/fetch.py --hist N` henter lagringene og de N siste i `save_hist` per spiller med `SUPABASE_SERVICE_ROLE_KEY` til `tests/saves/` (står i `.gitignore`). `tests/savestest.py` starter hver av dem på en tom enhet, spiller to timer i spillet og sjekker at båten er der. Den tar én om gangen.
- Databasen har nå 37 lagringer, og `save_hist` har 99 rader fra 35 spillere (717 kB). Med `--hist 1` blir det rundt 72 starter. Hver start tar 20–40 s i SwiftShader, så det er 25–50 minutter i serie. Tallet øker med spillerne.

### Feilvarselet

- **Det finnes alt, med push** (02.11.2026, `supabase/migrations/20261102150000_err_alert.sql`). `err_alert()` kjøres av pg_cron hvert tiende minutt (`dsb-err-alert`, aktiv). Den sender én push til kontoen med `game_admin` når det kommer en ny feilmelding (ikke sett på 60 dager), tre krasj eller mer, svart skjerm, «Oppstarten står fast», «Lagringen feilet» eller en feil i en Edge Function, høyst én hver halvtime. Den siste uka kom det 77 feil og 21 varsler, og alle 21 ble sendt.
- **Det som mangler:**
  - Varselet kommer bare når Jonas har push på et levende abonnement.
  - En side som henger helt, kan ikke melde fra selv (fra 02.11.2026 meldes «Oppstarten står fast» først ved neste start).
  - Ingenting merker at detstorebla.no eller reléet er nede, og da kommer det heller ingen feil.
  - Med en testutgave må varslene si om feilen kom fra test eller produksjon.

### Betalingen

- **Butikken er alt i ekte modus på detstorebla.no.** `GET shop-checkout` svarer `{"ready":true}`, den begrensede live-nøkkelen (`rk_live_`) og webhooken står i Supabase (06.10.2026), og `purchases` har 5 betalte kjøp på til sammen 155 kr. Det siste er en trim til 49 kr 06.11.2026 fra en konto uten admin. 4 kjøp er åpne og 4 utløpt.
- `STRIPE_TAX` er av, så det legges ikke på MVA. `STRIPE_MANAGED` er av (Jonas 05.10.2026: «Nei til managed payments. Vi kan eventuelt aktivere dette når vi går internasjonalt»).
- **Produktene ligger i databasen** (`products`: 18 varer, 17 aktive), ikke i Stripe. `shop-checkout` lager prisen i hvert kjøp (`price_data`, NOK, `tax_behavior: 'inclusive'`, skatteklassen `txcd_10201001`). Jonas trenger altså ikke å lage produkter i Stripe, bare godkjenne lista og prisene.
- `cloud.json` har `"stripePk": ""`, og det er riktig, fordi spillet går til Stripe Checkout gjennom `shop-checkout` og aldri trenger nøkkelen.

### Sikkerheten (`docs/planer/sikkerhet-skyen.md`)

- **Funn 6** (lagringen, pengene og haillen er klientens): bare jukseren selv rammes, og kjøpet er trygt, fordi `shop_paid` og `grants` avgjør hva som er betalt. Velkomstgaven gis på nytt hver gang `dsb_reg_gift` settes, og `shop_done` meldes av klienten. Steg 49 (planen) er klar.
- **Funn 7** (innloggingen i `localStorage`): retter seg med `auth.detstorebla.no` og `workosDevMode:false`. **Jonas valgte det bort 11.10.2026** (`lansering.md`, «WorkOS i produksjon»: 99 USD i måneden er uaktuelt). Valg 6 i køen og steg 50 venter likevel på at han setter det opp. Det må avklares (valg V6 under).
- Spillet har ingen Content-Security-Policy (funn 15 står igjen: «trenger en egen gjennomgang»). Det er den som gjør en XSS til en overtatt konto.

### Det juridiske (`lansering.md` A5)

- **Gjort:** personvernerklæringen og vilkårene (godkjent av Jonas 02.11.2026), kilde- og kontaktsiden, sletting av kontoen, angrerettlinja.
- **Står igjen:** varemerket, ODbL for kartpakkene og næringskoden. Dessuten MVA og non-Union OSS, som hører til betalingen.

## 3. Fasene (én økt hver)

Rekkefølgen er satt etter hva som verner spillerne først og hva Jonas må gjøre før økta kan begynne. L1a og L1b går foran fordi de endrer arbeidsrutinen for alle de andre stegene.

### L1a Testutgaven (steg 74)

**Jonas først:** DNS for `test.detstorebla.no`, og etter V3 A et Supabase-prosjekt for test (kap. 5, punkt 1–4).

- **Serveren:** en blokk `test.@DOMAIN@` i `tools/server/Caddyfile` med roten `/srv/detstorebla/test`, `X-Robots-Tag: noindex` og de samme hodene som produksjonen. `setup.sh` lager mappa og lar deploy-nøkkelen nå den, med `rrsync` fortsatt på `/srv/detstorebla`.
- **Bygget:** `KYST_CHANNEL=test node build.mjs`. Bygget får `<meta name="dsb-channel" content="test">` og `<meta name="robots" content="noindex">`, og i `version.json` står `"ch":"test"`. En liten fast merkelapp «Testutgave» vises øverst i hjørnet (aldri over knappene). `cloud.json` får en blokk `test` med testens Supabase, WorkOS Staging (`client_01M449YCKA9VJST0W0FY0HP62E`) og Stripe-sandkassen, og `ui/10f-cloud.js` velger blokken etter verten.
- **Utrullingen:** `deploy.yml` sender arbeidsgrenen til `test/` og `main` til `current/`. Det er bare to linjer i jobben, men `.github/` røres først i denne økta. `pwa.yml` slutter å rulle ut arbeidsgrenen (se L1b om Pages).
- **Filer:** `tools/server/Caddyfile`, `tools/server/setup.sh`, `build.mjs`, `src/data/cloud.json`, `ui/10f-cloud.js` (`cloudCfg`), `ui/10p-install.js` (merkelappen), `.github/workflows/deploy.yml`, `docs/systemer/publisering.md`.
- **Tester:**
  - en ny `tests/kanaltest.py` (LITE): testbygget har merkelappen, `noindex` og testens Supabase, og produksjonsbygget har ingen av dem. Den skal sees rød først, mot bygget uten `KYST_CHANNEL`.
  - `boottest` på begge byggene, `kjoptest` (`shopMode` på testverten), `run.py changed`.
  - skjermbilder av merkelappen i 800×1280 og 1280×800.
- **Måles:** at test og produksjon ikke deler lagring eller tjenestearbeider (to opphav, to `localStorage`), og at «Ny versjon er ute» virker på hver adresse for seg.

### L1b Slippet til produksjon (steg 75)

- **Mekanismen** (etter V1 og V2): `main` er produksjonen. Et slipp er en fast-forward av `main` til en commit på arbeidsgrenen som har stått på testadressen og har porten grønn. Skriptet `tools/release/slipp.py` lager PR-en «Slipp <dato>» fra arbeidsgrenen til `main`. Beskrivelsen har:
  - commitene siden forrige slipp
  - patchnotatene som kommer med
  - migreringene som må kjøres i produksjon før slippet
  - en rød linje når slippet rører ekte penger (`ui/10i-shop.js`, `ui/10q-buymoment.js`, `shop_*`, `supabase/functions/shop-*`, `stripe-*`) eller `src/legal/`. Da venter PR-en alltid på Jonas (`CLAUDE.md`).
- **Arbeidsrutinen** (`tools/plan/RUTINE.md` punkt 8 og 9): «rull ut» betyr fra nå av «til testadressen». Slippet gjøres etter V2. Migreringene kjøres først på testprosjektet (V3 A), og i produksjon rett før slippet, aldri etter. Regelen at spillet skal tåle en migrering før koden, står som før.
- **Hastefeil:** en retting slippes som et eget slipp med det som alt står på arbeidsgrenen, når porten holder. Står det noe på arbeidsgrenen som ikke kan slippes, plukkes rettingen ut (`git cherry-pick`) til en gren fra `main`, slippes derfra og flettes tilbake.
- **Tilbake:** et slipp som viser seg å være galt, rulles tilbake ved å starte «Appen på Hetzner» for hånd på forrige slipps commit (`workflow_dispatch` med `ref`). Lagringer som den nye versjonen har skrevet, må tåle en eldre versjon. `savestest` sjekker det ikke i dag, og det står i kap. 6.
- **Patchnotene:** som i dag. Testadressen viser det nyeste med merket «på test», og produksjonen viser det som er sluppet, fordi notatene ligger i bygget. «Ny versjon er ute» kommer i produksjonen bare ved et slipp, høyst like ofte som V2 sier.
- **GitHub Pages:** ved lanseringen erstattes siden av en enkel side «Spillet har flyttet til detstorebla.no» med «Kopier lagringen» (lagringskoden fra Innstillinger → Lagret spill), og `pwa.yml` stopper.
- **Filer:** ny `tools/release/slipp.py`, `tools/plan/RUTINE.md`, `.claude/skills/lever/`, `CLAUDE.md` (Publisering), `docs/systemer/publisering.md`, `.github/workflows/deploy.yml` og `pwa.yml`, `ui/phone/07-patch.js` (merket «på test»).
- **Tester:** `slipp.py --dry` mot de siste ti commitene skal finne en commit som rører butikken og merke den (sett rød med en commit uten). Ingen spilltester utenom `boottest`.

### L1c Lagringsporten (steg 76)

- **Steget:** et steg i produksjonsjobben i `deploy.yml` (bare for `main`) kjører `fetch.py --hist 1` mot produksjonens Supabase og `savestest.py` mot `dist-pwa` før opplastingen. Én lagring som ikke starter, stopper slippet. Lagringene ligger bare i `$RUNNER_TEMP` og slettes til slutt, og loggen viser bare fingeravtrykket (de første 8 tegnene av sha256), aldri innholdet. Tidsgrensen heves til 45 minutter.
- **Raskere:** `savestest.py` tar fire lagringer samtidig, i egne nettleserkontekster i samme Chromium, og skriver tida per lagring. Målet er under 10 minutter for 72 lagringer. Arbeidsrutinen kan kjøre den samme testen mot testbygget før slippet (`fetch.py` med nøkkelen i økta, om den finnes).
- **Den andre veien:** lagringene som testprosjektet har (skrevet av den nye koden), startes med forrige slipp. Det fanger en lagring som en tilbakerulling ikke tåler. Etter V3 B er dette de samme lagringene som produksjonens; etter V3 C finnes de ikke.
- **Filer:** `tests/savestest.py`, `tools/saves/fetch.py` (`--out`, fingeravtrykkene), `.github/workflows/deploy.yml`, `docs/systemer/testing.md`, `docs/lansering.md` B7.
- **Tester:** `savestest` sett rød med en lagring som er laget ødelagt med vilje (en båt med en posisjon på land utenfor lastede blokker, som feilen «mask block 105,20 is not loaded» 08.10.2026), så grønn uten den. Den ødelagte lagringen legges som `tests/saves-fixture/` i git, fordi den ikke er en spillers.
- **Måles:** minutter per slipp, og hvor mange lagringer som ble prøvd.

### L1d Feilvarselet (steg 77)

**Bygd 10.11.2026 (Jonas' økt, grenen `ccr-d120fd15-qq3fhp`) etter V4 B: bare push.** E-posten under (`mail_queue`, `err-mail`, morgensammendraget) er ikke bygd og skal ikke bygges. Nede, heng og kanalen er bygd som beskrevet, med disse avvikene: reléet spørres med `GET /rt` uten billett (404 fra reléet er «oppe», 502 fra Caddy «nede»), vakten ligger i `ui/11b-watchdog.js`, og `err_alert` har én markør og én halvtime per kanal. Alt står under «Feilvarselet L1d» i `docs/systemer/tilbakemelding-og-admin.md`. Migreringen `20261110190000_err_kanal_uptime.sql` kjøres i produksjonen rett før slippet som tar med koden (den kan også kjøres før: den er bakoverkompatibel, og varselet for nede trenger ingen kode i spillet), og av Jonas for hånd i testprosjektet.

- **E-post** (etter V4): `err_alert()` legger det samme varselet i en ny kø `mail_queue` i tillegg til push. En ny Edge Function `err-mail` (pg_cron hvert tiende minutt) sender det til Jonas' adresse gjennom e-posttjenesten (`RESEND_API_KEY` eller tilsvarende, som Jonas legger inn selv). Et sammendrag kommer hver morgen kl. 07 norsk tid, med feilene siste døgn gruppert som i Teknikk, og bare når det har vært noe.
- **Nede:** en ny pg_cron-jobb (`dsb-uptime`, hvert femte minutt) spør `https://detstorebla.no/version.json` og reléet med pg_net. To bom på rad gir «detstorebla.no svarer ikke» på push og e-post, og nytt varsel når siden er oppe igjen. Det samme gjøres for testadressen, men uten push om natta.
- **Heng:** en liten vakt i en Web Worker får et livstegn fra siden hvert sekund. Står hovedtråden stille i 15 s, sender vakten selv «Spillet hang i N s» med versjonen og hvor i oppstarten eller spillet det var (`tm_error` med `fetch` fra workeren, som ikke henger), og «hang i N s, kom tilbake» når siden kommer tilbake. Fra før fanges det som skjer før siden blir stående, i «Oppstarten står fast» ved neste start.
- **Test eller produksjon:** `errors` får kanalen fra `cloudMeta()`. Varslet sier «[test]» foran, og test gir aldri push om natta (23–07).
- **Filer:** ny migrering (`mail_queue`, `err_alert` med kanalen, `dsb-uptime`), ny `supabase/functions/err-mail/`, `ui/10f-cloud.js` (`cloudMeta`), ny `ui/11b-watchdog.js` (eller i `ui/11-boot.js`), `src/index.html` (én linje), `docs/systemer/tilbakemelding-og-admin.md`.
- **Tester:**
  - `sqltest`: varselet kommer i begge køene, høyst ett hver halvtime, og test om natta gir ingen push. Sett rød før migreringen.
  - ny `tests/hengtest.py` (LITE): siden låses i 20 s med en løkke, og feilen skal ligge i `tm_error`-stand-in-en. Sett rød uten vakten.
  - `boottest`.
- **Måles:** antallet varsler per døgn den første uka, så Jonas ikke får så mange at han slutter å lese dem.

### L1e Sikkerheten før lansering (steg 78)

- **Funn 7** (etter V6 A): en Content-Security-Policy for selve spillet, laget av `build.mjs` som for admin, men med det spillet trenger:
  - workers og `blob:`
  - `wasm-unsafe-eval` for kartpakkene
  - `connect-src` bare til Supabase, WorkOS, `wss://detstorebla.no/rt` og egen vert
  - `img-src 'self' data: blob:`
  - ingen inline-skript uten hash
  - `frame-ancestors 'none'`

  En XSS kan da ikke sende fornyelsesnøkkelen noe sted. I tillegg settes kortere levetid på økta hos WorkOS (Jonas, kap. 5 punkt 12). `workosDevMode` står til V6 sier noe annet.
- **Funn 6** følger sin egen plan (steg 49) og byggingen den legger inn, i rekkefølgen V7 sier. Etter V7 B må dette være ute før lanseringen:
  - velkomstgaven gitt én gang av serveren (`guest_merge`)
  - kjøpt haill gitt og talt fra `grants`, aldri fra klientens `shop_done` alene
- **Status 10.11.2026:** Jonas valgte V7 A. Planen for funn 6 er skrevet (`docs/planer/haill-saldo.md`): HS1 velkomstgaven (steg 95, klar) og HS2 kjøpt haill fra `grants` (steg 96, etter valg 29 V1) er over lanseringslinja; HS3–HS5 etter.
- **Filer:** `build.mjs`, `tools/server/Caddyfile` (CSP-hodet for `/`, eller meta i siden), `ui/11-boot.js` og `ui/` der et inline-skript eller `eval` finnes, `docs/planer/sikkerhet-skyen.md`.
- **Tester:**
  - ny `tests/csptest.py` (LITE): spillet går en hel førstetur, Kontoen og butikken under CSP-en uten et eneste `securitypolicyviolation`, og et innsatt `<script>` fra en tilbakemelding kjøres ikke. Sett rød uten CSP-en.
  - `boottest`, `tut.py` (ett format), `kjoptest`, `admintest`.
  - stikkprøver i Bergen, Bodø og Hammerfest, fordi kartpakkene lastes på nytt der.

### L1f Det juridiske i sidene (steg 79)

- **Kildesiden** (`src/legal/kilder.html`) får linjen: «Kartdataene i spillet er avledet fra OpenStreetMap (© OpenStreetMap-bidragsyterne) og tilbys under Open Database License (ODbL 1.0)». Den lenker til kartreleasene `kart-N` på GitHub, der den avledede databasen ligger åpent (repoet er offentlig). Attribusjonen i spillet (kartet) sjekkes mot ODbL 4.3.
- **Personvernerklæringen:**
  - e-posttjenesten for feilvarselet (V4 A) som databehandler; varslene har ingen personopplysninger, men tjenesten ser Jonas' adresse
  - GitHub som databehandler for lagringsporten (L1c): lagringene behandles i GitHubs jobb og slettes etterpå
  - testprosjektet (V3 A)
- **Vilkårene:** at prisene er med MVA når Stripe Tax er på (L2).
- **Filer:** `src/legal/kilder.html`, `personvern.html`, `vilkar.html`. **Rulles aldri ut uten at Jonas har sett PR-en** (`CLAUDE.md`).
- **Tester:** `legaltest`, om den finnes (ellers en ny som sjekker lenkene og at sidene bygges), og skjermbilder i begge formater.

### L2 Betalingen i ekte modus (steg 72, finnes)

Venter på Jonas (kap. 5, punkt 5–8). Så bygges dette:

- `STRIPE_TAX=1`, med `billing_address_collection: 'required'` eller landet i kassen, så Stripe Tax kan velge sats (25 % i Norge, landets sats i EU gjennom OSS).
- Kvitteringen på e-post fra Stripe (innstillingen i Stripe) med bekreftelsen om angreretten (`lansering.md` A5 krever at den står i kvitteringen).
- Pengefanen i admin: konvertering, refusjoner og andelen som forlater kassen (`lansering.md` E).
- Refusjonen prøvd hele veien i sandkassen på testadressen.
- **Filer:** `supabase/functions/shop-checkout/`, `stripe-webhook/`, `src/admin/index.html`, `ui/10i-shop.js` (bare om teksten endres). **PR-en venter på Jonas** (ekte penger).
- **Tester:** `kjoptest` og `sqltest`, og ett ekte kjøp med refusjon i produksjon, gjort av Jonas.

### L3 Sluttsjekken (steg 73, finnes)

- **Full regresjon** (`/regresjon`, rundt en time) på kandidaten til lanseringsslippet, sortert mot det som er kjent rødt.
- **Lasttesten** (steg 47): 500 klienter mot reléet og 500 syntetiske spillere mot Supabase, om natta. Tallene i admin leses. Etter V3 A går lasten mot testprosjektet først, og mot produksjonen bare én gang før lanseringen, om natta.
- **Lagringsporten** grønn på alle lagringer, og `savestest` den andre veien (L1c).
- **Jonas spiller kystflåten på nettbrettet** (OnePlus Pad 3), på testadressen, i stående og liggende format:
  - én hel tur med skiffen og trebåten (juksa)
  - én med snekka eller en sjark (line eller garn)
  - én med en kystbåt (teiner eller garn)
  - en levering, et båtkjøp på verftet og ett kjøp i butikken i sandkassen

  Han setter en karakter per båt, som OB-fasene gjør.
- **Telefonen:** `#prof` og `first3d` fra Galaxy A52s (Ø3b), og første start under målet i `publisering.md`.
- **Lista i kap. 5** er gått gjennom.
- **Slippet:** lanseringsslippet, Pages flyttet, og det første døgnet med feilvarselet på.

## 4. Valgene

Svar som «L1 V1 A» osv. Ett anbefalt alternativ per valg.

**Besvart 10.11.2026 (Jonas):** V1 A, V2 A, V3 A, **V4 B** (bare push, med varsel for nede og heng; ingen e-post, ingen e-posttjeneste, ingen ekstra databehandler, kap. 5 punkt 10 faller bort), V5 A, V6 A, V7 A. Fasene 74–78 følger dette; 77 (L1d) bygges uten `err-mail` og `mail_queue`.

- **V1. Hvor produksjonen kommer fra.**
  - **A (anbefalt): `main` er produksjonen,** og et slipp er en PR fra arbeidsgrenen til `main` som flettes som fast-forward. Deny-lista nekter alt nå en økt å pushe til `main`, så ingenting slippes ved et uhell. PR-en viser hva som kommer med.
  - B: en tag (`prod-ÅÅÅÅMMDD-N`) som en økt setter etter porten. Det er enklere, men ingenting stopper en tag satt ved en feil.
  - C: «Slipp» som en knapp i Actions (`workflow_dispatch` med commit). Uten PR blir det ingen oversikt over hva som kom med.
- **V2. Hvem slipper, og hvor ofte.**
  - **A (anbefalt): arbeidsrutinen slipper selv høyst én gang i døgnet, om natta (03–05 norsk tid),** når porten og lagringsporten holder og testadressen har stått minst seks timer uten en ny feil i feilvarselet. Jonas kan si «slipp nå» for en hastefeil. Slipp som rører ekte penger eller `src/legal/`, venter alltid på ham. Det holder arbeidet automatisk (Jonas 07.11.2026), og spillerne får én oppdatering i døgnet i stedet for 18.
  - B: bare Jonas slipper, når han fletter PR-en.
  - C: fast slipp to ganger i uka.
- **V3. Testutgavens sky.**
  - **A (anbefalt): et eget Supabase-prosjekt for test, med WorkOS Staging og Stripe-sandkassen.** Test skriver aldri i spillernes lagringer, verden, kvoter eller topplister, migreringene prøves der først, og lasttesten kan gå der. Det koster ett prosjekt til (gratis på Free-planen, rundt 10 USD i måneden på Pro, sjekk) og et oppsett på 20 minutter for Jonas.
  - B: samme Supabase som produksjonen, med egne lagringsrader for test (`saves.channel`) og testkontoene skjult i verden. Det er billigere, men en feil i testkoden kan skrive i den felles verdenen.
  - C: testutgaven uten sky (lokale lagringer, som artifacten). Det er tryggest og enklest, men ingenting i skyen kan prøves før produksjonen.
- **V4. Hvordan feilvarselet når deg.**
  - **A (anbefalt): push som i dag, pluss e-post** (det alvorlige med en gang og et morgensammendrag) gjennom en e-posttjeneste med EU-region og databehandleravtale, for eksempel Resend eller Postmark. Med det får du varselet også når push-abonnementet har gått ut, og det koster ingenting ved så få e-poster (sjekk prisene).
  - B: bare push, med varselet for nede og heng i tillegg.
  - C: e-post bare som sammendrag hver morgen.
- **V5. Butikken fram til L2.**
  - **A (anbefalt): la den stå åpen som nå.** Kjøpene er få (155 kr til nå) og fra kjente spillere, og L2 gjøres før offentliggjøringen.
  - B: slå den av med «Snart i salg» til Stripe Tax og MVA er på plass. Det gjøres ved å ta `STRIPE_SECRET_KEY` ut av Supabase, så `ready` blir `false` uten ny kode.
  - Ærlig om A: salg til forbrukere i EU skal ha EU-moms fra første krone gjennom non-Union OSS (sjekk med regnskapsfører). Små beløp, men ikke null.
- **V6. Funn 7, innloggingen.** Du valgte bort `auth.detstorebla.no` 11.10.2026 (99 USD i måneden), men valg 6 og steg 50 venter fortsatt på at du setter det opp.
  - **A (anbefalt): behold `workosDevMode`, og vern innloggingen med en CSP for spillet og kortere økter hos WorkOS (L1e).** Ta domenet når inntektene dekker det. CSP-en stenger veien en XSS ville brukt for å sende nøkkelen ut, og den trengs uansett.
  - B: kjøp domenet hos WorkOS før lanseringen (`workosDevMode:false`).
  - C: vår egen økt-cookie gjennom Caddy (`/auth` til en Edge Function som bytter koden hos WorkOS og setter en httpOnly-cookie på detstorebla.no). Det er gratis, men det er en ny innloggingsflyt å bygge og prøve rett før lanseringen.
- **V7. Funn 6, haillen på serveren.**
  - **A (anbefalt): før lanseringen bare det som gjelder ekte penger og gaver:** velkomstgaven én gang fra serveren, og kjøpt haill talt fra `grants`. Haillen som saldo i databasen, brukt gjennom en funksjon, kommer etter lanseringen. Jukset rammer bare jukseren selv, og den fulle saldoen rører hver haill-knapp i spillet.
  - B: hele saldoen på serveren før lanseringen.
  - C: alt etter lanseringen.

## 5. Det Jonas må gjøre selv, steg for steg

Rekkefølgen er den fasene trenger dem i. Hemmeligheter (nøkler, passord) skrives aldri i chatten og legges aldri i repoet. De limes inn der det står.

1. **DNS for testadressen** (før L1a). Webhuset.no → Min side → Domener → detstorebla.no → DNS ([webhuset.no](https://www.webhuset.no/)):
   - `A` for `test` = `65.108.252.250`
   - `AAAA` for `test` = serverens IPv6 (står i Hetzner Console → serveren → Networking, [console.hetzner.cloud](https://console.hetzner.cloud/))

   Si fra når de er lagt inn.
2. **Testprosjektet i Supabase** (V3 A, før L1a). [supabase.com/dashboard/new](https://supabase.com/dashboard/new/):
   - navn `detstorebla-test` og samme region som produksjonen (Irland, eu-west-1)
   - under Authentication → Sign In / Providers: slå på «Allow anonymous sign-ins» (samme felle som 11.10.2026, `lansering.md`)
   - under Authentication → Third-Party Auth: legg til WorkOS med issuer `https://api.workos.com/user_management/client_01M449YCKA9VJST0W0FY0HP62E` (Staging)
   - gi meg prosjektadressen og den publiserbare nøkkelen (de er offentlige). Supabase-koblingen i Claude må trolig kobles til det nye prosjektet også (sjekk under Connectors), ellers kjører du migreringene i SQL Editor.
3. **WorkOS Staging** (før L1a). [dashboard.workos.com](https://dashboard.workos.com/) → miljøet Staging:
   - Redirects: legg til `https://test.detstorebla.no/` (med skråstrek)
   - Sessions → CORS: legg til `https://test.detstorebla.no`
4. **Stripe-sandkassen for testprosjektet** (før L1a). [dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks):
   - nytt endepunkt `https://<testprosjektet>.supabase.co/functions/v1/stripe-webhook` med hendelsene `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed` og `charge.refunded`
   - legg `whsec_…` og `sk_test_…` inn i testprosjektet: Edge Functions → Secrets, `STRIPE_WEBHOOK_SECRET` og `STRIPE_SECRET_KEY`
5. **Stripe-kontoen i produksjon** (før L2).
   - [Settings → Business](https://dashboard.stripe.com/settings/account): Johansen Havbruksdrift, org.nr. 935 600 820, adressen og nettstedet `https://detstorebla.no`.
   - [Settings → Payouts](https://dashboard.stripe.com/settings/payouts): kontoen utbetalingene går til, helst en egen konto for spillet (`lansering.md` A2).
   - [Settings → Customer emails](https://dashboard.stripe.com/settings/emails): slå på «Successful payments», så kjøperen får kvittering.
   - Databehandleravtalen: Stripes DPA er en del av avtalen ([stripe.com/legal/dpa](https://stripe.com/legal/dpa)); sjekk at den gjelder kontoen.
6. **MVA** (før L2, med regnskapsfører).
   - Sjekk om foretaket alt er MVA-registrert: [Enhetsregisteret, 935 600 820](https://virksomhet.brreg.no/oppslag/enheter/935600820).
   - Er det ikke det, gjelder grensen på 50 000 kr på tolv måneder for alt MVA-pliktig salg til sammen ([Skatteetaten: registrering i Merverdiavgiftsregisteret](https://www.skatteetaten.no/bedrift-og-organisasjon/avgifter/mva/registrering/)).
   - Registreringen og næringskoden (punkt 8) gjøres i samme Samordnet registermelding i Altinn ([altinn.no](https://www.altinn.no/), søk «Samordnet registermelding»).
7. **Non-Union OSS for EU-moms** (før L2, før salg til forbrukere i EU). Et foretak uten etablering i EU registrerer seg i ett EU-land det velger, og leverer én kvartalsvis oppgave for alle EU-landene ([EU: One Stop Shop](https://vat-one-stop-shop.ec.europa.eu/), [Your Europe](https://europa.eu/youreurope/business/taxation/vat/vat-digital-services-moss-scheme/index_en.htm), [Skatteetatens melding om EU-reglene](https://www.skatteetaten.no/nn/rettskilder/type/skattedirektoratets-meldinger/merverdiavgift-og-elektronisk-handel--nye-regler-i-eu-om-registrering-for-merverdiavgift-ved-omsetning-av-visse-elektroniske-tjenester-til-private/)). Sjekk med regnskapsfører hvilket land, og om terskelen på 10 000 euro gjelder for et foretak utenfor EU (den gjør trolig ikke det). Legg registreringene inn i [Stripe Tax → Registrations](https://dashboard.stripe.com/tax/registrations): Norge når foretaket er MVA-registrert, og OSS-landet. Si fra, så slår L2 på `STRIPE_TAX=1`.
8. **Næringskoden.** I Samordnet registermelding (punkt 6): legg til utgivelse av dataspill, 58.210 «Utgivelse av programvare for dataspill» etter SN2007. Sjekk koden i den nye standarden SN2025 hos SSB ([ssb.no/klass](https://www.ssb.no/klass/)), og utvid formålet med «utvikling og salg av dataspill».
9. **Varemerket.**
   - Søk opp «Det Store Blå» i [Patentstyrets søk](https://search.patentstyret.no/), også som figurmerke og med «Det store blå».
   - Søk om merket i klasse 9 (programvare, nedlastbare spill) og 41 (spilltjenester på nett) på [patentstyret.no](https://www.patentstyret.no/) med ID-porten. Gebyret per søknad og per klasse står på prissiden der (ikke sjekket i denne økta: siden var stengt herfra).
   - Ærlig: «Det store blå» er også tittelen på en film fra 1988 og kan bli sett som beskrivende for havet. Patentstyret kan derfor nekte merket som ord. Et figurmerke (logoen med navnet) står sterkere. Spør gjerne en varemerkerådgiver.
10. **E-posttjenesten for feilvarselet** (V4 A, før L1d). Lag en konto hos for eksempel [Resend](https://resend.com/) (velg EU-region):
    - legg inn domenet `detstorebla.no` og postene den viser, hos Webhuset (punkt 1)
    - signer databehandleravtalen
    - legg API-nøkkelen inn i Supabase → Edge Functions → Secrets som `RESEND_API_KEY`
    - si hvilken adresse varslene skal til
11. **Grensen for anonyme innlogginger** (funn 4). [Authentication → Rate Limits](https://supabase.com/dashboard/project/xcqbqzrsgycpeoyclakm/auth/rate-limits): sett «anonymous sign-ins» lavere enn standarden (30 i timen per IP), for eksempel 10.
12. **Kortere økter hos WorkOS** (V6 A, med L1e). [dashboard.workos.com](https://dashboard.workos.com/) → Production → Authentication → Sessions: sett levetiden på økta («maximum session length») til for eksempel 30 dager, og «inactivity timeout» til 7 dager (sjekk navnene, de kan ha endret seg).
13. **Totrinnsinnlogging** på alt som kan styre spillet, om det ikke alt er gjort (`lansering.md` E):
    - [GitHub](https://github.com/settings/security)
    - [Supabase](https://supabase.com/dashboard/account/security)
    - [Stripe](https://dashboard.stripe.com/settings/user)
    - [Hetzner](https://accounts.hetzner.com/)
    - [WorkOS](https://dashboard.workos.com/)
    - Webhuset
    - e-posten
14. **Kjør `setup.sh` på serveren** etter L1a (og etter L1e om CSP-en legges i Caddy). Logg inn med SSH fra iMacen og kjør `curl -fsSL https://raw.githubusercontent.com/average01101010/FishyBusiness-/ccr-5e1ba2f4-pusvyd/tools/server/setup.sh | bash -s detstorebla.no` som root. Den beholder deploy-nøkkelen.
15. **Slipp-PR-ene** (V1 A): i GitHub-appen → repoet → Pull requests → «Slipp <dato>» → Merge. Det trengs bare for slipp som rører ekte penger eller `src/legal/`, eller alle slipp etter V2 B.
16. **Spilltesten i L3** på nettbrettet, på testadressen, og karakterene.

## 6. Det som er antatt eller usikkert

- **Lovene og satsene er ikke sjekket mot kildene i denne økta.** Patentstyret, SSB og EUs OSS-sider kunne ikke åpnes herfra. Skatteetatens melding og OSMF-sidene ble funnet i søk.
  - Satsene og tersklene for MVA og OSS, gebyrene og næringskoden i SN2025 er merket «sjekk» og skal bekreftes med regnskapsfører eller på kildesidene.
  - Om non-Union OSS kan brukes direkte av et norsk foretak, er ikke bekreftet av Skatteetaten. EU-reglene sier at et foretak uten etablering i EU kan det.
- **ODbL:** at kartpakkene er en avledet database og ikke bare et produsert verk, er ikke avgjort ([OSMF Licence and Legal FAQ](https://osmfoundation.org/wiki/Licence_and_Legal_FAQ), [Open Data License/Use Cases](https://wiki.openstreetmap.org/wiki/Open_Data_Licence/Use_Cases)). Det trygge er å behandle dem som en avledet database, og den ligger alt åpent i releasene. Det L1f gjør, er å si det og lenke dit.
- **Kjøpene i `purchases`:** at kjøpet 06.11.2026 er en ekte spiller og ikke en av Jonas' egne kontoer fra Staging, er ikke sjekket. Jeg leste bare status, vare, beløp og dato.
- **Tida for lagringsporten** (20–40 s per lagring) er anslått fra boottest i SwiftShader, ikke målt i GitHubs jobb.
- **Lagringer den andre veien:** at en eldre versjon tåler en lagring fra en nyere, er ikke prøvd. En tilbakerulling kan derfor ødelegge for spillere som har spilt på den nye. L1c prøver det, og L1b bruker tilbakerulling bare når porten har prøvd den.
- **Supabase-koblingen i Claude** er satt opp for prosjektet `xcqbqzrsgycpeoyclakm`. Om den kan nå et testprosjekt uten nytt oppsett, er ikke sjekket.
- **Kostnaden** for et prosjekt til på Supabase (V3 A) avhenger av planen produksjonen er på. Det er ikke lest her.
- **CSP-en for spillet** (L1e) kan stoppe noe som bare skjer sjelden (en worker, en `blob:`-adresse, en lyd). `csptest` går en hel førstetur, men ikke alt i spillet.
- **V2 A** forutsetter at feilvarselet (L1d) skiller test fra produksjon. Før det kan rutinen ikke se om testadressen har stått uten feil, og da slipper bare Jonas. **Etter L1d (10.11.2026):** feilene er merket med kanalen, men feilene fra testadressen ligger i testprosjektets `errors`, som øktene og rutinen ikke når. Rutinen kan derfor fortsatt ikke lese om testadressen har stått uten feil; det kan bare Jonas (SQL Editor i testprosjektet, eller push derfra når `push-send` er satt opp der). L1b må enten gi rutinen en lesevei til testprosjektet eller la Jonas bekrefte.
- Funnet om at butikken alt er i ekte modus, var ikke kjent for startmeldingen. Den sa «betalingen i ekte modus» som om den var i testmodus.

## 7. Hva planen ikke gjør

- **Bygger ingenting** og rører ikke `.github/`, `src/` eller databasen. Fasene gjør det, hver i sin økt etter klarsignalet.
- **Tar ikke spillinnholdet** før lansering (OB-fasene, F4, F5, Ø3b/Ø3c og resten over lanseringslinja). Det står i køen.
- **Tar ikke app-butikkene** (Google Play og App Store, `lansering.md` A6), det engelske navnet eller markedsføringen og traileren.
- **Flytter ikke spillet til et AS** (`lansering.md` F5: når inntekten eller risikoen vokser) og tar ikke regnskapet.
- **Tar ikke Turnstile/CAPTCHA** for gjestene (funn 4) eller en ny lasttest med 2 000 eller 5 000 spillere. Det blir egne valg når lasttestens tall er lest.
- **Tar ikke funn 6 i sin helhet.** Det er steg 49, som er en egen plan.

## Status

- 09.11.2026: planen skrevet (L1, steg 71, Jonas' økt, gren `ccr-41bf0bd0-c7ywb9`). Fasene er steg 74–79 i køen med `venter på valg`. Valgene er L1 V1–V7 under «Valg som venter på Jonas». Ingenting er bygd.
- 10.11.2026: **L1a bygd** (steg 74, Jonas' økt, gren `ccr-1ddbadbc-g5fj4d`), etter V1 A og V3 A. Det som ble avgjort i økta, står i «Testutgave og produksjon» i `docs/systemer/publisering.md`:
  - merkelappen står til høyre for minikartet, fordi hjørnet er minikartets og minimer-knappens
  - blokken `test` velges av kanalen **eller** verten, så et testbygg aldri når produksjonens sky
  - sanntidsreléet er produksjonens: ingen `/rt` på testadressen, og reléet lastes opp bare fra `main`
  - `deploy.yml` nekter et testbygg til `current/` og et bygg uten kanal til `test/`
  - admin-siden i testbygget får testprosjektet
  - «Måles» i L1a: to opphav gir to `localStorage` og to tjenestearbeidere av seg selv; «Ny versjon er ute» spør `version.json` ved siden av siden. Ingen av delene er prøvd på den ekte testadressen ennå.
- 11.11.2026: **L1b bygd** (steg 75, Jonas' økt, gren `claude/l1b-production-release-allrqm`), etter V1 A og V2 A. Det som ble avgjort i økta, står i «Slippet» og «GitHub Pages har flyttet» i `docs/systemer/publisering.md` og i «Slippet» i `tools/plan/RUTINE.md`:
  - `tools/release/slipp.py` skriver slipp-PR-en og er porten for et automatisk slipp (`--auto`); den fletter aldri
  - `main` er roten av arbeidsgrenens historie, så et slipp kan være en ren framoverføring; men ingen økt kan gjøre den uten at deny-lista endres eller en workflow gjør det, og `merge_pull_request` gir aldri en fast-forward: **valg 33** (A Jonas fletter, B workflow «Slipp», C økta fletter med flettecommit; anbefalt B). Til det er svart, fletter Jonas selv, og rutinen slipper ikke
  - migreringene: på testprosjektet av Jonas for hånd før pushen, i produksjon rett før slippet; rutinen stopper ved en som ikke står som kjørt på test; `list_migrations` i produksjon er ikke fasiten
  - Edge Functions deployes ikke av rutinen: et slipp med en endret funksjon venter på Jonas
  - hastefeil: «slipp nå», eller rettingen plukket ut til en gren fra `main` når arbeidsgrenen har noe som ikke kan slippes
  - tilbakerulling: `deploy.yml` på `main` med `inputs.commit` (bare en commit som alt ligger på `main`)
  - Patchnotes har merket «på test» i testutgaven; `pwa.yml` legger ut flyttesiden på Pages, bare for hånd, når Jonas sier til (ikke kjørt)
  - det første slippet er ikke gjort: PR-en «Slipp 11.11.2026» står til Jonas (ekte penger: HS2), med `haill_use`-migreringen først. **P1 i porten er ferdig når det første slippet er gjort.**
- 10.11.2026: **L1d bygd** (steg 77, Jonas' økt, gren `ccr-d120fd15-qq3fhp`), etter V4 B: bare push. Nede (`dsb-uptime`), heng (vakten i en Web Worker) og kanalen i `errors` med «[test]» og nattestillhet. Ingen e-post. Koden går til testadressen; migreringen venter på Jonas (testprosjektet for hånd, produksjonen før slippet). Se «Feilvarselet L1d» i `docs/systemer/tilbakemelding-og-admin.md`.
