# Sikkerhetsgjennomgangen av skyen (Ø6, A7, 05.11.2026)

Økt Ø6 i `docs/planer/okter-etter-backloggen.md`, punkt A7 i `docs/planer/verktoy-fra-game-studios.md`. Jonas sa «kjør på» 05.11.2026. Økta har bare lest: ingen kode, ingen migrering og ingenting skrevet til databasen. Rettingene er forslag og bygges i egne økter (forslag til rekkefølge nederst).

## Hva som er lest

- `supabase/migrations/` (59 filer) og den levende databasen, bare med lesende spørringer: tabellene med RLS og rettigheter (`pg_class`, `pg_policy`, `has_table_privilege`), alle 150 funksjonene i `public` med hvem som kan kjøre dem (`has_function_privilege`) og kroppen til de som skriver eller deler noe om spillerne, triggerne, lagringsbøtta og jobbene i `cron.job`. Supabases sikkerhetsråd (`get_advisors security`) er tatt med.
- `supabase/functions/` (alle fem pluss `_shared/report.ts`).
- `ui/10f-cloud.js`, `ui/10g-push.js`, `ui/10l-share.js`, `ui/10h-world.js`, `src/admin/index.html`, `src/data/cloud.json` (lest av en lesende agent; funnene er sjekket mot linjene).
- `tools/server/setup.sh`, `tools/server/Caddyfile`, `.github/workflows/autofix.yml` og `deploy.yml`, og et søk etter hemmeligheter i hele git-historikken.

Det databasen faktisk har, er det som gjelder. Der migreringene sier noe annet, står det under funnet.

## Kort svar på spørsmålene

| Spørsmål | Svar |
|---|---|
| Hva kan en innlogget spiller lese om andre? | Bare det funksjonene gir: posisjon, båtnavn, brukernavn, fartstid, redskap i sjøen, landinger (kg, art, havn, båt) og topplistene. Aldri WorkOS-ID, e-post, lagring, penger eller kjøp: alle tabellene har RLS, ingen har policy for spillere, og ID-en ut er `md5('dsb'‖id)` kuttet til 10 tegn. Ingen tabell kan leses rett. |
| Hva kan en gjest eller en uten innlogging gjøre? | Uten innlogging: skrive feil (`tm_error`) og bildetakt (`tm_perf`) uten grense, lese sponsorene (`sp_now`, med vilje). En gjest (anonym Supabase-bruker) kan alt en spiller kan unntatt kjøp, navn, hilsen, venner, delte merker, nyheter og Kystposten, **også levere landinger og fangst som teller i den felles verdenen** (funn 2–4). |
| Kan haill, landinger, topplista eller lagringene forfalskes? | **Ja, landingene og fangsten** (funn 2–3), og med dem topplistene, kvoten for åpen gruppe, prisene i mottakene, fiskarlagets mål og ukas push. **Lagringen** er klientens egen (penger, haill og alt), men treffer bare spilleren selv (funn 6). Det som koster ekte penger, kan tas gratis med `#nocloud` (funn 5). **Kjøpet av haill** avgjøres av Stripe-webhooken på serveren og kan ikke forfalskes (sjekket). |
| Er admin og tilbakemeldingene stengt? | På serveren, ja. Alle `admin_*`/`sp_admin_*` sjekker `is_admin()` (Supabase Auth-bruker i `admins` og `aal2`). `agent_*` kan bare kjøres av `service_role` gjennom `feedback-agent` med tokenet, sammenlignet i konstant tid. Lagringsbøtta for video er privat. Restrisiko: tilbakemeldingstekst går via rutinen til PR-er som kan flettes og rulles ut av seg selv (funn 8). **Admin-siden har en lagret XSS (funn 1)**. |
| Hemmeligheter i koden? | Ingen funnet, heller ikke i historikken. `cloud.json` har bare offentlige verdier (publiserbar nøkkel, WorkOS-klient-ID). |
| Viser noe som deles, haill? | Nei, ingen felt. Ingen av `pos_put`, `land_put`, `news_put`, `mark_share`, `gear_put`, `hail_send`, `lag_post`, `gb_sign`, `tow_*` eller lagringens `summary` har haill. Det kan skimtes indirekte: trim gir farten `v` over båttypens toppfart i AIS, og haill gir høyere `kgph` i delte merker (funn 11). |

## Funnene

Alvorlighet: **høy** = én spiller kan ødelegge for alle eller ta penger; **middels** = jukseveier eller misbruk som merkes av andre; **lav** = herding.

### 1. HØY: lagret XSS i admin-dashbordet gjennom tilbakemeldingens `meta.pos`

- **Fil:** `src/admin/index.html:227` (`fbMeta`, brukt i linje 243). `m.pos[0]` og `m.pos[1]` settes rett inn i `href` og lenketeksten uten `esc()`. `fb_send` (`supabase/migrations/20261005180000_feedback.sql:81`, levende) sjekker bare at `meta` er et objekt på høyst 4 000 byte.
- **Angrep:** hvem som helst med en gjestekonto kaller `fb_send2` med `meta:{pos:["\"><img src=x onerror=…>",0]}`. Når Jonas åpner Tilbakemeldinger i admin, kjører skriptet med hans aal2-økt (`sessionStorage.dsbAdmin`, med fornyelsesnøkkelen). Da kan angriperen kalle alle `admin_*` og `sp_admin_*`: endre verdensinnstillinger (`admin_cfg_set`, `admin_stock_set`), sponsorer, navn og logoer, svare spillere, lese alle tilbakemeldinger og hele dashbordet, og ta med seg tokenet.
- **Retting:** `esc(+m.pos[0])` og `esc(+m.pos[1])` (tall, ellers ingenting), og i SQL: `fb_send` beholder `pos` bare som to tall. Gå samtidig gjennom resten av admin for verdier fra spillerne som ikke går gjennom `esc()` (funn 13). En streng CSP på `/admin` (funn 15) ville stoppet dette.
- **Status 05.11.2026 (Jonas: «Rett funn 1 nå»): rettet i admin-siden** (b5289877): `fbMeta` tar bare to endelige tall og viser «–» ellers. Angrepet ble prøvd i Chromium mot admin i demo-modus: før rettingen kjørte skriptet, etter rettingen ikke. Databasen hadde ingen tilbakemelding med annet enn tall i `pos` (113 lest), så hullet er ikke brukt. **Også i databasen:** migreringen `supabase/migrations/20261105120000_fb_meta.sql` (`fb_send` beholder `pos` bare som to tall innenfor bredde og lengde, `sqltest` grønn). Sperren i skymiljøet stoppet `apply_migration` som en utrulling til produksjon, så Jonas kjørte den i SQL Editor 05.11.2026; bekreftet etterpå med en lesende spørring.

### 2. HØY: landingene stoles på fra klienten, og én spiller kan stenge åpen gruppe for alle

- **Fil:** `land_put` (`20261030170000_bygde.sql:29`) tar `kg` og `kgq` (opptil 100 t per rad, 24 rader, 400 rader i timen), `gh` (hvilken som helst spilltime innenfor ±10⁷), `port` (fri tekst, 40 tegn), `acc` og `ev` fra klienten. Den eneste sjekken er at spilleren finnes, så **gjester** kan også levere. Klienten sender fra `ui/10h-world.js:98`.
- **Hva det treffer for andre:**
  - **Kvoten i åpen gruppe:** triggeren `world_year_add` summerer `kgq` per spiller (tak 60 t per spiller og år, også gjester), `world_agg_get` (`20261102120000_register.sql:132`) legger det sammen, og spillet stopper torskefisket i åpen gruppe for alle når summen når kvoten (`core/03d-quota.js:183`, `wshOpen`). **Rettet 05.11.2026 (for sterkt sagt i gjennomgangen):** kvoten for åpen gruppe er 9 257 t torsk minus 865 t ferskfisk, altså 8 392 t (`REG26.open`), og hver konto teller høyst 60 t i året. Det trengs derfor rundt 140 kontoer for å fylle hele kvoten. Stoppet i `03d-quota.js` regner med den simulerte flåtens fangst og en margin på sju dager, så langt færre kontoer flytter stoppet fram. Med gjester kunne et skript lage nye kontoer i det tempoet Supabase slipper gjennom (standard 30 i timen per IP, ikke lest i innstillingene) og stenge gruppa på noen timer.
  - **Topplistene:** `world_top`, `ev_top`, `bygde_top`, fiskarlagets mål (`lag_get`, som også skriver en nyhet) og «Ukas beste fisker» som push til alle (`push_week`). Taket per landing (10 t åpen, 60 t lukket) hjelper lite når det kan sendes 400 i timen.
  - **Prisene i mottakene:** `world_get` `mkt` trekker prisen ned etter andres landinger siste døgn (tak 40 t per spiller, havn og art). Falske landinger kan presse prisen i en havn for alle.
  - `ev_top` tar med gjester, ulikt `world_top` og `bygde_top`.
- **Retting (forslag, i rekkefølge):** (a) gjester teller ikke i `world_year`, `mkt` og topplistene før de er registrert; (b) et tak i ekte tid per spiller og båt i `land_put`: kg per time etter båttypens last (`presence.vtype`) og høyst én landing per havn per N minutter; (c) `gh` må ligge nær den felles klokka (`WCLOCK`) og `port` være en kjent havne-ID (`^[A-Za-z0-9_-]+$`); (d) på sikt: landingen sjekkes mot fangsten som er meldt med `catch_put` og mot posisjonen (båten må ha vært ved havna). Dokumentet i `kvoter-og-regler.md` må si at kvoten for åpen gruppe kan påvirkes av andre spillere.
- **Status 05.11.2026 (Jonas: «Kjør på funn 2–4»):** (a) og (c) er gjort i `supabase/migrations/20261105130000_guest_world.sql`. Jonas kjørte migreringen i SQL Editor 05.11.2026 (sperren i skymiljøet stopper `apply_migration`); bekreftet etterpå: de seks funksjonene er de nye, ingen gjesterader igjen i `world_year`, triggeren og rettighetene som før.
  - En gjests landinger teller ikke i `world_year` (kvoten, båtene og gruppenes fangst), i mottakenes marked (`world_get` `mkt`) eller i sesongtoppen (`ev_top`), før kontoen er registrert. Da tar `guest_merge` dem med; før gikk de tapt med gjestens rad (`ON DELETE CASCADE`).
  - De 11 gjesteradene som alt lå i `world_year`, slettes av migreringen.
  - `land_put` tar ingen landing foran den felles klokka (`world_gh()` + 24 spilltimer; ingen av de 706 landingene i databasen lå foran), regner året ut av `gh` selv og renser havn og art. Mønsteret for havn har ÆØÅ, fordi mottakene i Østfold har «Ø» i ID-en (`ØF50`, `ØF55`, `ØF56`); alle 310 havne-ID-ene i dataene er sjekket.
  - `sqltest` er grønn: 129 OK, og en ny sjekk dekker alt over.
  - **Ikke gjort:** (b) et tak i ekte tid etter båttypens last er ikke bygd. Ett tak per time ville stoppet ekte landinger når spillet tar igjen flåtens drift etter flere dager borte, og når havfartøyene (H2–H6) lander hundrevis av tonn. Taket på 60 t per konto og år for åpen gruppe står, og (d) står for seg.
  - **Det som gjenstår:** en registrert konto kan fortsatt sende falske landinger, og dermed toppe topplistene, flytte prisene i en havn og telle opptil 60 t i åpen gruppe. Det krever en WorkOS-konto per konto, og kan ikke lenger gjøres med gjester i hopetall.

### 3. MIDDELS: falsk fangst tømmer feltene for andre

- **Fil:** `catch_put` (`20261006000000_world_v2.sql:65`): 600 celler per kall, opptil 50 t per celle, 6 000 rader i timen, også gjester. `world_get` gir de andres fangst per celle (tak 5 t per spiller og celle) og klienten trekker den fra bestanden (`wshTake`, `ui/10h-world.js:111`).
- **Angrep:** én konto kan merke hvert felt i en region som tomt i dager; flere anonyme kontoer gjør det verre.
- **Retting:** cellene må ligge nær spillerens siste posisjon i `presence`, kg per time etter båttypen, og gjester holdes utenfor `cells` til de er registrert.
- **Status 05.11.2026:** gjestenes fangst er holdt utenfor `cells` (`world_get`, `20261105130000_guest_world.sql`), og `catch_put` merker gjesten. Kravet om at cellene skal ligge nær spillerens posisjon er ikke bygd, fordi flåten fisker langt fra der spilleren er (driftsplanen). En registrert konto kan fortsatt merke celler, med 5 t per spiller og celle som før.

### 4. MIDDELS: anonyme kontoer uten grense

- Gjestene er anonyme Supabase-innlogginger (`ui/10f-cloud.js:66–83`). Alle tak i funksjonene er per spiller, så den som lager mange gjester, ganger opp funn 2, 3, 10 og 9. Supabases egen grense for anonyme innlogginger (standard 30 i timen per IP) er ikke lest i prosjektinnstillingene.
- **Retting:** Turnstile eller CAPTCHA på anonym innlogging (Supabase støtter det), og funn 2a og 3 (gjester påvirker ikke andre før de er registrert).
- **Status 05.11.2026:** 2a og 3 er gjort, så mange gjester tømmer ikke lenger kvoten, markedet, feltene eller topplistene. Det gjester fortsatt kan, er det funn 9 og 10 sier: fylle feil-, bildetakt- og tilbakemeldingstabellene, og holde kaiplasser. Turnstile er ikke bygd: det krever en Cloudflare-konto, et skript fra Cloudflare på siden og en linje i personvernerklæringen, og det er Jonas' valg. **Jonas kan selv** se på grensen for anonyme innlogginger i Supabase (Authentication → Rate limits) og sette den lavere enn standarden.

### 5. MIDDELS: `#nocloud` på detstorebla.no gir det som koster ekte penger gratis

- **Fil:** `cloudOn()` (`ui/10f-cloud.js:12`) slår skyen av med `#nocloud`, og `shopMode()` (`ui/10i-shop.js:17`) gir da `'test'`, så `payBuy` kaller `give()` uten betaling (`10i-shop.js:42`): haill, trim, Skippertak og malingsdesign. Spillet lastes opp neste gang uten `#nocloud`, og designene vises for alle gjennom `liv` i `pos_put`/`pos_world` (bare logoen sjekkes mot kjøpet, `logo_put`).
- **Retting:** `shopMode()` gir `'off'` på vertene i `cloud.json` når skyen er av; `pos_put` fjerner design i `liv` som spilleren ikke eier (`entitlements`).
- **Status 05.11.2026 (Jonas: «Kjør på funn 5 og 14»): rettet** (acdaf0db):
  - `shopMode()` gir `'off'` på spillets egne verter når skyen er av: `pubHost()`, altså vertene i `cloud.json` og GitHub Pages, med `#nocloud`, uten nett og på Pages. Artifacten og testserveren har testkjøpene som før.
  - `pos_put` deler de betalte delene av malingen bare når kontoen eier dem (`supabase/migrations/20261105140000_liv_owned.sql`). Det gjelder ripe, totone, vann, stripe, lakk, flagg og rederilogo. Fargene, registreringsmerket og vimplene deles alltid. Spilleren ser selv det som står i lagringen; bare de andre ser båten uten det som ikke er kjøpt.
  - **Prøvd:** `kjoptest` har en ny sjekk med `#nocloud` på spillets vert, `sqltest` en ny sjekk av designene. I Chromium med detstorebla.no pekt til testserveren er butikken av; skjermbilder i begge formater.
  - Migreringen ble kjørt av Jonas i SQL Editor 05.11.2026 og bekreftet i databasen; den er ikke prøvd mot en ekte spillers posisjon ennå (ingen på sjøen da).

### 6. MIDDELS: lagringen, pengene og haillen er klientens

- `save_put4` (`20261013120000_active.sql:55`, og de eldre `save_put`, `save_put2`, `save_put3` som fortsatt kan kalles) tar `data`, `saved_at`, `game_t` og `summary` som de er. Haillen ligger bare i lagringen (`giveHaill`); velkomstgaven gis på nytt hver gang `localStorage.dsb_reg_gift` settes (`ui/10f-cloud.js:927`), og kjøpte varer markeres levert av klienten (`shop_done`).
- `saves_cash_check` (`20261017120000_turokonomi.sql:30`) varsler bare, og bare når spilleren har samtykket; den sammenligner klientens `summary.cash` med klientens egne `sale`/`tur_done`-hendelser fra `tm_batch`, så en jukser slipper unna med falske hendelser eller ved å la `summary` være.
- **Treffer bare spilleren selv** (og kjøpet går ikke tapt for oss: Stripe og `shop_paid` på serveren avgjør hva som er betalt). Det merkes for andre gjennom topplistene (funn 2) og fartstiden (funn 11).
- **Retting på sikt:** haill som en saldo i databasen (innløst med en funksjon, slik `grants` alt er for kjøp), velkomstgaven gitt én gang av `guest_merge` på serveren. Admin-dashbordets økonomitall skal leses som det klienten melder.

### 7. MIDDELS: innloggingene ligger i `localStorage`

- WorkOS kjører i utviklermodus (`cloud.json`: `workosDevMode:true`, tomt `workosApiHostname`), så fornyelsesnøkkelen ligger i `localStorage` (`workos:refresh-token:<klient>`, `src/vendor/authkit.js:155,178`). Gjestens nøkler ligger i `localStorage.dsb_guest` (`ui/10f-cloud.js:70`). Enhver XSS i spillet blir da en varig overtakelse av kontoen.
- **Retting:** eget innloggingsdomene (`auth.detstorebla.no`, står alt som plan i `skyen-og-felles-verden.md`) og `devMode:false`, så nøkkelen ligger i en httpOnly-cookie.

### 8. MIDDELS: tilbakemeldinger fra spillerne kan styre en PR som rulles ut av seg selv

- Rutinen (`tools/feedback/RUTINE.md`) leser spillernes tekst, åpner PR-er med merket `autofix`, og `autofix.yml` fletter og ruller ut når porten (`tools/autofix/gate.py`) slipper dem gjennom. En spiller kan skrive en tilbakemelding som prøver å styre agenten (prompt injection). Porten (filene, størrelsen, ingen kall til andre verter) er et godt vern, men ikke et fullt.
- **Retting:** automatisk fletting bare for rettinger fra feillista; PR-er som bygger på en spillers tekst, venter på Jonas. Lenkene til PR-ene i admin skal sjekkes mot `^https://github.com/` (funn 13).
- **Status 05.11.2026 (Jonas: «Kjør på ryddejobbene 8–12 og 15», 922cb4ca):** `autofix.yml` har steget «Opphavet»: en PR som i tittel eller tekst viser til `tilbakemelding #N` (eller `feedback #N`), flettes ikke inn av seg selv, men får `autofix-stoppet` og en kommentar om at den venter på Jonas. Teksten sjekkes igjen rett før fletting. `RUTINE.md` sier at `autofix` bare settes på rettinger fra feillista og bildetakten. **Igjen:** feillista er også tekst fra fremmede (`tm_error` uten innlogging), og en rutine som er lurt av en melding, kan la være å nevne tilbakemeldingen. Porten (filene, størrelsen, koden og testene) er fortsatt vernet mot det.

### 9. LAV: skriving uten innlogging og uten grenser

- `tm_error` og `tm_perf` kan kalles uten innlogging (rollen `anon`) og har ingen grense; ~~`fb_send` har ingen grense på lengden av `topic` og `body`~~ (feil i gjennomgangen: tabellen har `char_length(body) between 1 and 4000` og en sjekk på emnet); `tm_batch` tar `evs[].d` av hvilken som helst størrelse (400 per kall). Det kan fylle databasen (gratisplanen har 500 MB) og gi Jonas push om «nye feil» (`err_alert`, høyst hver halvtime).
- **Retting:** lengdetak (`left(...)`) på `topic`, `body` og `d`, og en grense per minutt i `tm_error`/`tm_perf` (per spiller, eller samlet når `pid()` er tom).
- **Status 05.11.2026 (Jonas: «Kjør på ryddejobbene 8–12 og 15», 922cb4ca):** i `supabase/migrations/20261105150000_rydd.sql`.
  - `tm_error` tar høyst 30 + de aktive spillerne i minuttet og 200 + 20 per aktiv spiller i timen; over det dropper den stille. Aktive er spillere sett siste time (`tm_active()`).
  - `tm_perf` tar høyst 500 + 60 per aktiv spiller i timen.
  - `tm_batch` tar en hendelses data bare opp til 4 000 byte.
  - Dagens volum var høyst 3 i minuttet og 20 feil og 1 283 målinger i døgnet, og den største hendelsen var 469 byte, så grensene treffer ikke vanlig spill. Et angrep kan fortsatt fylle det som slipper gjennom under taket, men ikke mer.

### 10. LAV: kaiplassene kan holdes av én spiller

- `berth_put` (`20261023120000_berths.sql:32`): én konto kan holde 30 plasser i 30 dager, også gjester. Med flere gjester kan en havn fylles.
- **Retting:** høyst 1–2 plasser per spiller (båtene i flåten), gjester ingen, og plassen frigjøres når spilleren ikke har vært der på et døgn.
- **Status 05.11.2026 (Jonas: «Kjør på ryddejobbene 8–12 og 15», 922cb4ca):** en gjests kaiplass viker for en konto (`berth_put`), og kontoene ser ikke gjestenes plasser (`berth_get`), fordi en gjests båt ikke vises for andre. Grensen på 30 per spiller står: den er Jonas' valg fra 23.10.2026 (flåten og driftsplanenes hjemmehavner). En registrert konto kan fortsatt holde 30 plasser i én havn.

### 11. LAV: posisjonen og fartstiden kan settes fritt; trim og haill kan skimtes

- `pos_put` (`20261103120000_route.sql:64`) tar `x`, `y` og `v` (høyst 60 kn) uten sjekk mot forrige posisjon, så avstandssjekkene i `hail_send` og `tow_hook` kan omgås, og `fs` (fartstid, vist for andre) kan økes med 5 000 i timen.
- Trim viser seg som `v` over båttypens toppfart, og haill som høyere `kgph` i delte merker. Ingen felt sier haill, men regelen i `CLAUDE.md` er at det aldri skal vises.
- **Retting:** `v` kappes ved båttypens vanlige toppfart før den deles; `kgph` rundes grovt; `fs` vokser høyst med ekte tid.
- **Status 05.11.2026 (Jonas: «Kjør på ryddejobbene 8–12 og 15», 922cb4ca):**
  - **Delte merker:** et fangstmerke husker haillen om bord da det ble laget (`lf`, `core/05-vessels.js` og `core/10-gear.js`). Det deles som om det var fisket uten haill (`ui/10l-share.js`, `sharetest`). Merker fra før har ikke `lf` og deles som før.
  - **Ikke gjort:** farten `v` er ikke kappet. Posisjonene som deles hvert 15. sekund, viser farten uansett, og en kappet `v` ville bare fått de andres båter til å hoppe. Trim er heller ikke haill; regelen i `CLAUDE.md` gjelder haill.
  - **Fartstida:** taket på 5 000 poeng i timen står, fordi en stor landing alene kan gi flere tusen poeng (3·√verdien).
  - **Posisjonen:** den kan fortsatt settes fritt, så avstandssjekkene i `hail_send` og `tow_hook` kan omgås. Å sjekke farten mellom to posisjoner ville stoppet ekte hopp når spillet tar igjen tiden borte.

### 12. LAV: rettighetene i databasen er videre enn migreringene sier

- Migreringene gjør `revoke all … from public` og `grant … to authenticated`, men Supabase gir `anon` rett til å kjøre nye funksjoner direkte. Derfor kan `anon` kjøre ni `security definer`-funksjoner: `admin_cash_flags`, `admin_tur_share`, `guest_claim`, `guest_merge`, `push_plan`, `saves_cash_check` (en triggerfunksjon), `sp_now`, `tm_error` og `tm_perf`. Alle sjekker `is_admin()` eller `pid()` (eller er åpne med vilje), så ingen av dem er et hull i dag.
- Tabellene `berths`, `cash_flags`, `sponsors` og `sponsor_placements` har alle rettigheter for `anon` og `authenticated` og er bare vernet av RLS uten policy (eller `admin_read`). Det holder, men én `disable row level security` ville åpnet dem.
- **Retting:** `revoke execute … from anon` der det trengs, `alter default privileges in schema public revoke execute on functions from anon, authenticated` og `revoke all on <tabell> from anon, authenticated` på de fire tabellene. Supabases råd sier det samme (`get_advisors`: 9 + 121 varsler om `security definer`, ett om `search_path` i `world_gh`).
- **Status 05.11.2026 (Jonas: «Kjør på ryddejobbene 8–12 og 15», 922cb4ca):** i `supabase/migrations/20261105150000_rydd.sql`:
  - `anon` mister retten til `admin_cash_flags`, `admin_tur_share`, `guest_claim`, `guest_merge` og `push_plan`, og alle mister den til triggerfunksjonen `saves_cash_check`. Bare `tm_error`, `tm_perf` og `sp_now` er åpne for `anon`, med vilje.
  - Nye funksjoner får ikke lenger `anon` som standard (`alter default privileges`, bare for `anon`). Standarden for `authenticated` står, fordi migreringene regner med den.
  - De fire tabellene mister rettighetene for `anon` og `authenticated`.
  - `world_gh` får fast `search_path`.
  - Varslene om `security definer` for `authenticated` (121) står: funksjonene er veien inn med vilje og sjekker `pid()` eller `is_admin()`.

### 13. LAV: mer i admin som ikke escapes

- `daily()` (`src/admin/index.html:117`): nettlesernavnene fra `tm_batch` går inn i SVG-ens `<title>` uten `esc()` (20 tegn hver, så vanskelig, men mulig).
- Lenkene til agentens PR-er (`index.html:288`) escapes, men skjemaet sjekkes ikke (`javascript:` er mulig fra `agent_run`).
- **Retting:** `esc()` på hele tittelteksten og `^https://github.com/` på lenkene.
- **Status 05.11.2026: rettet** sammen med funn 1 (b5289877). Resten av admin er gått gjennom: alt annet fra spillerne går gjennom `esc()`, `md()` escaper før Markdown, bildene er sjekket som data-URL-er på serveren, og ID-ene er tall.

### 14. LAV: `#seed=N` virker på detstorebla.no

- `core/01-world.js:20–23`: frøet gjør `Math.random` forutsigbart, så en spiller kan se sjeldne hendelser på forhånd.
- **Retting:** bare når siden ikke ligger på vertene i `cloud.json` (eller når `WCLOCK` er av).
- **Status 05.11.2026: rettet** (acdaf0db). Frøet virker bare på en lokal testserver (localhost, 127.0.0.1, [::1]), ikke etter om `WCLOCK` er av, fordi `worldtest` bruker `#world` sammen med frøet. Prøvd i Chromium: på detstorebla.no (pekt til testserveren) er `Math.random` den vanlige; på 127.0.0.1 virker frøet.

### 15. LAV: herding av serveren og funksjonene

- **Caddyfile:** ingen `Content-Security-Policy` og ingen `frame-ancestors`/`X-Frame-Options`. Admin bør få en streng CSP (`script-src 'self'`, ingen inline) og `frame-ancestors 'none'`.
- **`setup.sh:70`:** finnes ikke `rrsync`, får deploy-nøkkelen `restrict` alene, som er et skall for brukeren `deploy`. Skriptet bør stoppe i stedet. Skriptet rører ikke `PasswordAuthentication` i sshd.
- **`push-send`:** POST uten token sender det som er forfalt litt tidligere. Ufarlig, men kan gis et delt hemmelig hode fra `cron.job`. **Ikke gjort** (ufarlig; det krever en ny hemmelighet og en ny utrulling av funksjonen).
- **Supabase Auth:** vern mot lekkede passord er av (gjelder bare Jonas' admin-passord, som også har TOTP). **Jonas kan** slå det på under Authentication i Supabase, hvis planen har det.
- **Status 05.11.2026 (Jonas: «Kjør på ryddejobbene 8–12 og 15», 922cb4ca):**
  - **Admin-siden har en streng CSP**, lagt inn av `build.mjs`: bare sitt eget skript etter hash, bilder som `data:`, video og kall bare til Supabase, ingen `<base>` og ingen skjema. Den ene `onclick` i HTML-en er flyttet inn i skriptet. `admintest` sjekker CSP-en, og alle 18 fanene tegner under den uten brudd.
  - **Caddyfile** sender `frame-ancestors 'none'` og `X-Frame-Options DENY` for `/admin`. Det trer i kraft først når `setup.sh` kjøres på serveren igjen, fordi utrullingen bare laster opp siden.
  - **`setup.sh`** stopper når `rrsync` mangler, i stedet for å gi deploy-nøkkelen et skall.
  - CSP for selve spillet er ikke laget: det har workers, blob-URL-er og WASM og trenger en egen gjennomgang.

## Det som er sjekket og er i orden

- RLS er på alle 50 tabellene, og ingen tabell kan leses eller skrives rett av en spiller. Alle lesinger går gjennom funksjoner som filtrerer på `pid()`.
- `is_admin()` krever en Supabase Auth-bruker i `admins` og `aal2`; WorkOS-tokenene har ikke `aal` og en `sub` som ikke er en uuid. Alle 23 admin-funksjoner sjekker den.
- `agent_*`, `push_claim`, `push_week`, `shop_paid`, `shop_ended`, `shop_refund`, `err_alert` og de andre interne funksjonene kan ikke kjøres av `anon` eller `authenticated`.
- Kjøpene: prisen kommer fra `products` (`shop_quote`), gjester kan ikke kjøpe, webhooken sjekker Stripe-signaturen, `shop_paid` bokfører én gang og gir én `grants`-rad, returadressen er hvitlistet. Ingenting klienten sender, avgjør om noe er betalt.
- `account-delete` tar WorkOS-ID-en fra det verifiserte tokenet, ikke fra kallet. `feedback-agent` sammenligner tokenet i konstant tid og når bare `agent_*`.
- Lagringsbøtta `feedback-media` er privat, med lesing og sletting bare for eieren og admin.
- Spillernes ID ut er `md5('dsb'‖id)` på 10 tegn, aldri WorkOS-ID-en. Båtnavn, firmanavn og navn renses på serveren og escapes i spillet (`peerName`, `esc`, `gEsc`).
- Ingen hemmeligheter i koden eller i git-historikken; `cloud.json` har bare offentlige verdier.
- Admin-handlingene i spillet (`adm*`) endrer bare den lokale tilstanden og kaller ingen funksjon på serveren.

## Forslag til rekkefølge

1. ~~**Funn 1** (XSS i admin)~~: rettet 05.11.2026 i admin (b5289877, med funn 13) og i databasen (`20261105120000_fb_meta.sql`, kjørt av Jonas).
2. ~~**Funn 2a, 3 og 4**~~: gjort 05.11.2026 (`20261105130000_guest_world.sql`, med 2c). Turnstile (funn 4) og 2b er ikke bygd, se funnene.
3. ~~**Funn 5 og 14**~~: rettet 05.11.2026 (acdaf0db; migreringen `20261105140000_liv_owned.sql` kjørt av Jonas). 2c og 13 er gjort tidligere; 2b står.
4. **Funn 7** (innloggingsdomenet) når Jonas setter opp `auth.detstorebla.no` hos WorkOS.
5. ~~**Funn 8, 9, 10, 11, 12 og 15**~~: gjort 05.11.2026 (922cb4ca og `supabase/migrations/20261105150000_rydd.sql`, **som venter på SQL Editor**); det som ikke er gjort, står under hvert funn.
6. **Funn 6** (haill på serveren) hører til en større plan for økonomien; den rammer bare jukseren selv.
