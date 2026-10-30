# Tilbakemeldinger, agenten og admin

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.22 Tilbakemeldingsagenten (06.10.2026)

Jonas ba om det slik: «koble deg opp mot detstorebla.no/admin slik at du kan hente ut alt av tilbakemeldinger 4 ganger i døgnet og gjøre eventuelle tiltak». Han ga klarsignal til planen med «Ja, du kan kjøre det slik … kl. 06-12-18-00».

- **Rutinen** er en Claude Code-rutine (Routine) som starter en ny økt kl. 05.58, 11.58, 17.58 og 23.58 Oslo-tid, to minutter før hver hel time Jonas ba om. Den følger `tools/feedback/RUTINE.md` på arbeidsgrenen. Instruksene kan altså endres med en push, uten å røre rutinen. Rutinen er `trig_01U6Q88HroVFLRYZJiYm9ko5` og varsler med push. Den nye økta har ikke repoet fra start og kloner arbeidsgrenen selv, fordi repoet er offentlig. For å pushe og åpne PR-er kobler den repoet til seg selv med `add_repo`.
- **Veien inn** er Edge-funksjonen `feedback-agent`, med egen nøkkel `FEEDBACK_AGENT_TOKEN`. Jonas lager nøkkelen og legger den inn som hemmelighet i Supabase og som API-legitimasjon i Claude Code-miljøet (ikke som miljøvariabel, for den er synlig for alle som bruker miljøet). Funksjonen kaller bare `agent_*`-funksjonene i `20261006120000_feedback_agent.sql`, så nøkkelen gir ingen tilgang til spillere, lagringer eller kjøp. Rutinen bruker ikke Supabase-koblingen.
- **Hva agenten ser** (`agent_feedback`):
  - Den ser teksten, emnet, karakteren og bildene. Videoene ser den ikke, bare hvor mange det er.
  - Den ser også en fast liste med nøkler fra `meta`: versjon, enhet, skjerm, 3D-nivå, bildetakt, båt, status, havn, posisjon, spilltid og veiledningssteg.
  - Den ser spilletida som et intervall og hvor mange tilbakemeldinger spilleren har sendt før.
  - Spilleren er en kode på 6 tegn som bare gjelder i én lesing. E-postadresser og norske telefonnumre i teksten blir maskert (`agent_scrub`).
  - Ny er det agenten ikke har notert (`ai_at` er tom). En kjøring som stopper underveis, tar resten neste gang.
- **Hva agenten gjør:**
  - Den noterer hver tilbakemelding med `agent_note`: notat, vekt (`ai_score`), foreslått status og foreslått svar.
  - Den skriver en rapport med `agent_run` (tabellen `agent_runs`, som holdes ett år).
  - Vekten er alvor (5 krasj eller tapt lagring, 3 feil, 2 forvirring eller ytelse, 1 ønske) × antall ulike spillere med samme sak. Den får +0,5 for over 20 timers spilletid og +0,5 for saker som gjelder starten.
  - Agenten svarer aldri spillerne selv.
- **Kode:**
  - **Fra 06.10.2026:** høyst to PR-er per kjøring mot arbeidsgrenen, aldri en push til den (Jonas: «den skal endre koden 4 ganger om dagen om den må. Viktig at vi utbedrer feil kjapt.»). Saker fra tidligere kjøringer som ikke er rettet, tas også, høyest vekt først. Rutinen kobler repoet til seg selv med `add_repo` (skrivetilgang) og kjører på Opus 5.5.
  - **Aldri:** endringer i `.github/`, `supabase/`, admin, `src/legal/`, serveren eller agenten selv.
  - **Repoet er offentlig:** tilbakemeldingene havner aldri i git, i en commit-melding eller i en PR. `agent.py` nekter å lagre dem inne i repoet.
- **Teknikk og enheter** (06.10.2026; Jonas: «vi må samle inn så mye viktig data vi kan og analysere for å optimalisere spillet for så mange enheter som mulig»; `20261006160000_device_data.sql`):
  - Bildetaktmålingene (`perf`, aldri med spiller) og feilrapportene (`errors`) har nå enheten: grafikkbrikken (`gpu`, slik WebGL navngir den), kjerner og minne slik nettleseren oppgir dem, skjermen (`scr`, f.eks. `412x915@2.6`), 3D-nivået og visningen. Spillet sender det med `cloudDev` i `ui/10f-cloud.js`. Grafikkbrikken leses én gang per økt fra en liten WebGL-kontekst som slippes med en gang, så den er kjent også der 3D-visningen ikke starter.
  - `tech_view(days)` slår sammen feilene per melding (antall, økter, spillere som tall, versjoner, plattformer, nettlesere, de fem vanligste grafikkbrikkene og én stack) og bildetakten per plattform, nettleser og grafikkbrikke, og per versjon. Agenten leser det med `agent.py tech` (`agent_tech`, via `feedback-agent`), og admin i fanen Teknikk (`admin_devices`): bildetakt per enhet, rødt under 25 og gult under 45.
  - Rutinen går gjennom feilene og bildetakten i hver kjøring (punkt 3 i `RUTINE.md`), og retter for de enhetene det gjelder, uten å senke grafikken for alle.
- **Takk-haill** (06.10.2026; Jonas: «12 spilltimer med 100% "haill" i belønning om tilbakemeldingen er av verdi for utviklingen av spillet. Haillet skal ikke gradvis miste effekt …, det skal vare 12timer, så ferdig»):
  - Når admin setter en tilbakemelding til «Kommer» eller «Fikset» første gang, får spilleren én takk-haill (`HAILL.takk` i `core/03-simulation.js`: +100 % i 12 spilltimer, så borte, uten svakere trinn). Den kommer som en grant (`admin_feedback_set` i `20261006140000_feedback_reward.sql`), samme vei som butikken, og går i Haill-appens beholdning. Spilleren får en melding i telefonen og et push-varsel hvis varsler er på. Produktet `fb_haill` kan ikke kjøpes (`active` er false).
  - `shopClaim` (`ui/10i-shop.js`) henter også hvert tiende minutt mens spillet er åpent, så takken kommer uten omstart.
  - Tilbakemelding-appen og Haill-appen sier at gode tips belønnes. I «Dine tilbakemeldinger» står 🎁 ved dem som har gitt takk-haill.
- **Påminnelsen** (`FEEDBACK.nudge` i `ui/06e-feedback.js`; Jonas: «Vi må bevisstgjøre dem»): en melding på skjermen med «Gi tilbakemelding» rett til appen.
  - Etter en levering, høyst hver andre dag, og ikke de to første dagene etter at spilleren har sendt en.
  - Etter en grunnstøting eller en feil i spillet, høyst én gang i døgnet hver. Da er emnet «Feil» valgt på forhånd.
  - Minst seks timer mellom to påminnelser, aldri i første tur, aldri over et annet vindu eller telefonen, og bare der tilbakemeldinger kan sendes. Hver påminnelse telles som hendelsen `fb_nudge`.
- **I `/admin`:**
  - Under hver tilbakemelding står det agenten foreslår. Knappen «Bruk forslaget» fyller inn status og svar, og Jonas trykker Lagre.
  - Fanen Agent viser rapportene (`admin_agent_runs`) og lenker til PR-ene.
- **Personvern:** personvernerklæringen sier at Claude fra Anthropic (USA) leser tilbakemeldingene uten navn, e-post eller bruker-ID, og Anthropic står på lista over databehandlere.
- **Test:**
  - `sqltest`: bare service_role leser, uten spiller-ID og med maskering; et notat tar tilbakemeldingen ut av de nye; rapporten og forslaget kommer fram til admin; spillere og admin-innloggingen slipper ikke inn.
  - `admintest`: Agent-fanen og «Bruk forslaget».

## 5.25c Admin: åpningen på nytt (05.10.2026)

Admin-appen (bare Jonas' konto) har kortet «Åpningen»: «Vis brevet» spiller brevscenen igjen uten å endre noe, og «Start nytt spill» spør først og begynner så helt på nytt (lagringen i skyen også), med brevet, båtnavnet og «Første tur».

## 5.25j Tilbakemelding: appen for spillernes tilbakemeldinger (05.10.2026)

Jonas 05.10.2026: «Lag en feedback-app i telefonen hvor brukerne kan komme med tilbakemeldinger, gjerne sortert etter hva tilbakemeldingen gjelder. La dem også laste opp bilde. På denne måten kan vi samle inn masse viktig data».

- **Appen** (`ui/06e-feedback.js`, `FEEDBACK`, appen `tilbake` på telefonen):
  - Emne (`TOPICS`): Feil, Knapper og skjerm, Grafikk og fart, Fiske og fangst, Penger og priser, Båter og utstyr, Kart, vær og verden, Første tur, Idé eller ønske, Annet.
  - Tekst (høyst 4000 tegn, minst 3), hvor fornøyd spilleren er (1–5 stjerner, valgfritt) og ett bilde (valgfritt).
  - **Bildet:** fra galleriet eller kameraet (`<input type=file accept=image/*>`), eller «Bilde av spillet»: telefonen går bort et øyeblikk, og `G3.snap()` (`view3d.js`) tar det neste 3D-bildet i samme bilde som det tegnes (uten knappene). Begge gjøres mindre i nettleseren: høyst 1600 px på den lengste siden, JPEG under 540 000 tegn (rundt 400 kB).
  - **Med følger** (`FEEDBACK.meta`): `cloudMeta()` (versjon, nettleser, plattform, app, grafikkvalg, båt, penger, flåte, spilldager, økt) og skjermen, 3D eller kart, kvalitetsnivå og bildetakt, båtens status, havn og posisjon (lat/lon med tre desimaler), spilltid, veiledningssteg og energi. Appen sier hva som sendes. **Versjonen** i `cloudMeta()` kommer fra `<meta name="dsb-version">`, som `build.mjs` skriver fra 29.10.2026 (før sto det `dev` i alt, se `publisering.md`).
  - Teksten holdes mellom tegningene (siden tegnes på nytt ved hvert trykk), som firmanavnet.
  - **Dine tilbakemeldinger** nederst viser de 30 siste med status (Mottatt, Lest, Kommer, Fikset, Ikke nå) og svaret fra Jonas.
  - Sendes bare når skyen er på (innlogget på detstorebla.no eller i appen, `CLOUD.on`). I artifacten og testene står det hvor den kan sendes fra.
- **Serveren** (`supabase/migrations/20261005180000_feedback.sql`):
  - Tabellen `feedback` er stengt for spillere, som resten av skyen. `fb_send` skriver (sjekker innlogging, at spilleren finnes, høyst 20 per døgn, emnet, lengdene og at bildet er en data-URL for JPEG, PNG eller WebP). `fb_mine` gir spillerens egne uten bilder.
  - Admin (`is_admin()`): `admin_feedback` (liste, filter, antall per emne og status, snittkarakter og MB bilder), `admin_feedback_img` og `admin_feedback_set` (status og svar).
  - Slettes med spilleren (`on delete cascade`), ellers etter to år (`dsb-feedback` i pg_cron). Personvernerklæringen har et eget avsnitt.
- **Admin-dashbordet** (`/admin`, fanen Tilbakemeldinger): tall, fordeling per emne, filter, hver tilbakemelding med bilde ved trykk, det som fulgte med (posisjonen som lenke til Norgeskart), og status og svar som lagres per rad. Fanen hentes ikke på nytt hvert minutt, så et svar som skrives, blir stående.
- **Test:** `tests/feedbacktest.py` (LITE) med en stand-in for Supabase: appen, emnene, teksten mellom tegningene, et bilde som gjøres mindre, sendingen med det som følger med, og listen med svar. `G3.snap` testes ikke der (ingen 3D).
- **Flere bilder og video** (05.10.2026; Jonas: «Litt viktig at spillet tillater skjermbilder og skjermopptak. Dette er essensielt ved logging av feilmeldinger», så «Kjør på med video og flere bilder»; `supabase/migrations/20261006010000_feedback_media.sql`):
  - En nettside eller PWA kan ikke sperre skjermbilder eller skjermopptak på Android. Det gjør bare Chrome selv i inkognitofaner. Appen forklarer hvordan man tar dem.
  - **Appen:** opptil fire bilder (`D.imgs`, «Velg bilder eller video» med `multiple`, og «Bilde av spillet») og to videoer (`D.vids`) på inntil to minutter, vist som miniatyrer med ×.
    - En video over 50 MB (gratisplanens største fil), eller i et format bøtta ikke tar, spilles én gang gjennom et lerret på høyst 1280 px og tas opp igjen med `MediaRecorder` (MP4 der nettleseren kan, ellers WebM). Bitraten velges så filen havner under grensen, høyst 2,5 Mbit/s. Det tar like lang tid som videoen, med prosent på skjermen.
  - **Sendingen:** `fb_send2` tar teksten og bildene. Det første bildet ligger i `feedback.img` som før, resten i `feedback_img`. Uten migreringen (404) brukes `fb_send` med det første bildet, uten video.
    - Deretter tar hver video `fb_media_slot` (navnet `<spiller>/<id>-<n>-<tilfeldig>.<ext>` i spillerens egen mappe, for en tilbakemelding fra siste time, høyst to per tilbakemelding og seks per døgn), opplasting med fremdrift (`XMLHttpRequest` til `/storage/v1/object/feedback-media/…`, `x-upsert: false`) og `fb_media_done`.
    - Feiler en opplasting, er teksten og bildene allerede inne. Skjemaet beholder videoene og viser «Send videoen på nytt». Navnet fra forsøket som feilet, gir plass til det nye.
  - **Storage:** den private bøtta `feedback-media` (50 MB per fil, bare videotyper). Policyene: opplasting bare til et navn `fb_media_slot` har gitt ut og som ikke er brukt (`fb_media_ok`), lesing og sletting i egen mappe (`fb_media_own`) eller for admin (`is_admin()`).
  - **Sletting:** Storage godtar ikke sletting fra SQL (`storage.protect_delete`). Spillet sletter derfor spillerens videoer gjennom Storage (`cloudMediaDel`, `fb_media_list`) før `delete_me`.
    - En fil som har mistet raden sin, for eksempel etter to år eller hvis slettingen i spillet feilet, telles som «uten tilbakemelding» i admin og kan slettes der (`admin_media_orphans`).
  - **Admin:** «Vis n bilder» (`admin_feedback_imgs`), «Spill av video» (signert lenke i en time), «Slett videoen» (Storage og så `admin_media_gone`), og MB video av 1 024 MB på gratisplanen.
  - **Test:** `sqltest` (bildene, navnene, grensene, låsen og admin) og `feedbacktest` (to bilder, en video som beholdes, en over grensen som gjøres mindre, en opplasting som feiler og sendes på nytt, og listen med 📷 og 🎬). Policyene i Storage kan bare testes på ekte Supabase.
