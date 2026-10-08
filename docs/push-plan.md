# Push-varsler: «båten venter på deg» (Jonas 07.10.2026, bygget 08.10.2026)

Jonas: «vi aktivt burde bruke push-varsler som sier i fra når båten ankommer sine destinasjoner, eller når ventetider er ferdig … slik at brukeren blir varslet og ikke glemmer spillet av.» Alle varsler er knyttet direkte til driften av spillerens egen båt og eget redskap: «Så lenge varslene er knyttet direkte opp mot driften er alt greit.»

Koden: klienten `src/js/ui/10g-push.js` (`pushItems` → `push_plan`), serveren `supabase/migrations/20261005120000_push.sql`, `20261006030000_push_rules.sql` og `20261008000000_push_ops.sql`, og Edge Function `supabase/functions/push-send` (kjøres hvert 5. minutt av pg_cron). Tester: `tests/pushtest.py` (klienten) og `tests/sqltest.py` (serveren).

## Reglene (Jonas' valg 07.10.2026)

- **Bare drift.** Et varsel betyr at noe ved spillerens egen båt eller eget redskap venter på henne, eller at en ventetid hun selv startet er slutt. Aldri «kom tilbake», aldri tapt innloggingsbonus eller tapt plass, aldri noe om penger, haill eller kjøp.
- **Også om natta.** Mange jobber nattevakter ombord, og de som sover har telefonen på stille. Ingen stille timer.
- **Første varsel tidligst 5 minutter etter at appen ble lukket.** Ikke alle turer er lange. Serveren legger aldri noe tidligere enn `now() + 5 min`. Siden pg_cron kjører hvert 5. minutt, kommer det i praksis 5–10 minutter etter lukking.
- **Spilleren velger ikke antall.** Vi justerer ned heller om tilbakemeldingene sier det. Hun kan bare slå av gruppene «Båten og driften» og «Ukas beste fisker» (og hele push).
- **Testfasen:** vi tåler litt mer. Tallene under er startverdier.
- **Kystposten sender ingen varsler** (appen har prikk). Heller ingen sesonger, kvote, topplista («noen gikk forbi deg» er borte) eller annet verdensnytt.
- **Verden: ett varsel i uka**, Norges beste fisker (åpen og lukket gruppe). Se «Ukas beste fisker» under.

## Hva som varsles (alt i gruppen `drift`)

| Hendelse | Tag | Prioritet | Levetid |
|---|---|---|---|
| Framme etter ei rute: mottak (med fisk: «Lever mens fisken er fersk»), butikk, verft | `port-` | 1 | 12 t |
| Ruta er slutt og båten ligger ute og venter | `end-` | 1 | 12 t |
| Lasten er full (juksing, ut fra fangsten så langt) | `full-` | 1 | 6 t |
| Redskap har stått lenge nok (line 10 t, garn 20 t, teiner 40 t) | `gear-` | 2 | 6 t |
| Fisken i lasterommet går snart ned en kvalitet | `fresh-` | 2 | 2 t |
| Verftsjobb eller montering ferdig | `yard-` | 2 | 12 t |
| Kuling eller storm på vei (båtens egne grenser) mens båten er ute eller redskap står i sjøen, to spilletimer før | `wx-` | 1 | 6 t |
| Mannskapet begynner å bli sliten, mens båten er ute | `crew-` | 1 | 6 t |
| Mannskapet bryter snart hviletiden (14 timer i strekk) | `rest-` | 1 | 6 t |
| Motoren er over tid for service, mens båten er ute (risikoen for stopp vokser) | `svc-` | 2 | 6 t |
| Du er uthvilt i naustet eller rorbua | `rested` | 3 | 12 t |
| Du er sliten på sjøen | `tired` | 3 | 12 t |

**Motorstopp** kan ikke varsles på forhånd: stoppet trekkes tilfeldig i simuleringen mens spilleren er borte. Det som dekkes i dag, er kulingvarselet og servicevarselet, som er det som øker risikoen. Et eget stoppvarsel krever at risikoen trekkes ut fra et frø som serveren også kjenner (P2).

Hvert varsel er skrevet rolig, med båtens navn, hva som har skjedd og hva hun kan gjøre nå. Spilletid i ord, varselet kommer i ekte tid (24 spilletimer = 4 timer, `GAME_RATE = 6`).

## Takten

- **Tak i døgnet følger bruken** (`push_cap`): 6 som grunnlag, 12 med minst 6 økter siste tre døgn, 24 med minst 12. 24 er et tak, ikke et mål.
- **Demper:** når de fem siste varslene ikke ble fulgt av en økt innen en halv time, og ingen økt har startet siden, er taket 2 til hun åpner appen igjen. Taket styres av det spilleren gjør, ikke av at vi vil ha henne inn.
- **Samling:** flere varsler som forfaller samtidig blir ett («Det Store Blå»), det viktigste først (`pri`, så tid).
- Det ukentlige varselet ligger utenfor taket.
- Planen legges når appen går i bakgrunnen og tømmes når hun er tilbake, så ingenting kommer mens hun spiller. Planen gjelder 40 ekte timer fram (serveren tar to døgn).

## Ukas beste fisker

Hver **mandag fra 08:00 norsk tid** (sjekkes hver time av pg_cron, `push_week`): «Ukas beste fisker i åpen gruppe er «Båt» med 12,3 t. I lukket gruppe: …», ut fra de siste sju dagene av landingene (gjester er utelatt). Det betyr en ekte uke, ikke en spilluke (en spilluke er bare 28 ekte timer). Går bort med bryteren «Ukas beste fisker».

## Forutsetninger

- **VAPID-nøklene** må være laget og lagt inn av Jonas (som hemmeligheter i Supabase, aldri i git), ellers vises ikke bryteren i spillet.
- Migrasjonen `20261008000000_push_ops.sql` må kjøres i Supabase (den tar også ned Kystposten-jobben `dsb-push-paper`).
- **iPhone:** web-push virker bare i appen lagt til på hjemskjermen.

## Mål og se

I admin-trakten (neste): andel som slår på varsler, sendt per spiller per døgn, åpnet innen 30 minutter per tag, og andel som slår av en gruppe etter et varsel. Hvis mange slår av eller ikke åpner, justerer vi ned før noe nytt legges til.

## Senere (ikke bygget)

- **P2:** dyp lenke fra varselet (åpne rett på riktig side), prøvevarsel, og stoppvarsel med frø for motorstopp.
- **P3:** tallene i admin.
- **P4:** «Klar til sjøsetting» når dokka kommer (handelsstedene, trinn 3).
