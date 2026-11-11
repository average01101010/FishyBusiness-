# Lagringsporten flyttet fra GitHub til vår egen server (plan 11.11.2026)

Steg 102 i `docs/planer/koen.md`. Skrevet av L1f-økta (steg 79, grenen `ccr-b461eca2-teqw0r`). **Ingenting er bygd.** Valgene i kap. 3 er besvart 11.11.2026.

## 1. Hvorfor

L1c (steg 76) la lagringsporten i «Appen på Hetzner» (`.github/workflows/deploy.yml`): ved hvert slipp henter jobben hver spillers lagring og den forrige fra produksjonens database inn på en maskin hos GitHub og starter dem med det nye bygget. L1f (steg 79) skulle ta GitHub inn i personvernerklæringen som databehandler for dette. Da viste det seg (11.11.2026):

- GitHubs databehandleravtale gjelder ifølge [github.com/customer-terms](https://github.com/customer-terms) «GitHub Enterprise Cloud, GitHub Enterprise (Unified), GitHub Teams, and GitHub Copilot».
- Kontoen repoet ligger under, er en personlig konto på GitHub Pro (Jonas' skjermbilde 11.11.2026). Den er ikke på lista.
- Erklæringen kan derfor ikke si at GitHub har en avtale, og lagringene sendes til USA uten grunnlaget erklæringen oppgir for de andre.

Jonas 11.11.2026: «A, flytt lagringsporten til Hetzner». Lagringene skal ikke lenger innom GitHub. Hetzner står alt i erklæringen som databehandler (serveren i Helsinki).

## 2. Slik den bygges

Mønsteret finnes fra før: reléet lastes opp med rsync, og en `systemd`-enhet som ser på en fil (`dsb-rt-reload.path`), starter det på nytt. Deploy-nøkkelen kan bare rsync inn i `/srv/detstorebla` (rrsync) og får ikke skall. Porten bygges likt:

1. **Jobben hos GitHub** bygger som før (enhetstestene, kartpakkene, bygget, boottesten). Så laster den bygget opp til `/srv/detstorebla/gate/build/` og portens filer (`savestest.py`, `_env.py`, `fetch.py`, `cloud.json`, fixturen) til `gate/files/`, og til slutt en fil `gate/ask` med commiten og om det er en tilbakerulling.
2. **På serveren** ser `dsb-gate.path` at `gate/ask` er ny, og starter `dsb-gate.service`: en egen bruker uten skall, `nice` og et tak på CPU og minne, som henter lagringene til en mappe bare den kan lese (`/var/lib/dsb-gate/saves`), kjører porten og «den andre veien» (mot `current/`, som ligger på samme maskin: ingen rsync), sletter lagringene og skriver `gate/result.json` (antall, holdt eller ikke, fingeravtrykk og feiltype for den som ikke holdt; aldri en spillers id, navn eller lagring) og `gate/log.txt` (det `savestest` skriver i dag).
3. **Jobben venter** på `gate/result.json` for sin commit (spør med rsync hvert tiende sekund, tidsgrense som i dag), skriver loggen ut i jobbens logg og stopper om porten ikke holdt. Holdt den, lastes bygget opp til `current/` som i dag.
4. **Nøkkelen til databasen** (`SUPABASE_SERVICE_ROLE_KEY`) flyttes fra GitHubs hemmeligheter til en fil på serveren som bare root leser (`/etc/dsb-gate.env`, som reléets hemmelighet). Den tas bort fra GitHub når den nye porten har holdt i ett slipp. Uten fila skriver tjenesten et resultat som stopper slippet, som i dag.
5. **Serveren** får Chromium og Playwright for Python (samme versjon som testene), satt opp av `tools/server/setup.sh`, som Jonas kjører som root.

Det som er som før: porten kjører bare på `main` og ved tilbakerulling, fixturens tre friske legges til, den ødelagte må stoppes i `run.py`, fingeravtrykkene, og at detstorebla.no står urørt når porten stopper.

**Personvernerklæringen etterpå:** GitHub tas ut igjen. Hetzner-punktet får én setning om at kontrollen før en ny versjon kjøres der.

## 3. Valgene (besvart 11.11.2026)

**Jonas 11.11.2026: «V1 A, V2 A».** En egen liten server hos Hetzner bare for porten, og PR #62 flettes uten GitHub-punktet og det slippes ikke før porten er flyttet. GitHub-punktet ble tatt ut av PR #62 samme dag, og sperren mot slipp står øverst i `docs/planer/koen.md` og i «Slippet» i `tools/plan/RUTINE.md`.

- **V1. Hvor porten kjører.**
  - **A (anbefalt): en egen liten server hos Hetzner bare for porten** (samme størrelse som dagens, noen få euro i måneden; prisen er ikke sjekket). Dagens server har 2 vCPU og 4 GB og leverer spillet og reléet. Porten kjørte 74 lagringer på 2,5 minutter og den andre veien på 4,5 på GitHubs maskin med fire om gangen; på to kjerner som også leverer spillet, blir det anslagsvis 10–20 minutter med full last. En egen server holder det unna spillerne, og nøkkelen til databasen ligger ikke på maskinen som står åpen mot nettet.
  - **B: på dagens server**, med `nice` og tak på CPU (én kjerne) og minne, og to om gangen. Ingen ny kostnad. Slippene går om natta, men spillerne som er inne da, kan merke det, og nøkkelen til hele databasen ligger på webserveren.
- **V2. Personvernerklæringen (PR #62) fram til porten er flyttet.**
  - **A (anbefalt): PR #62 flettes uten GitHub-punktet, og det slippes ikke før porten er flyttet.** Erklæringen sier da aldri noe som ikke stemmer. Slipp som haster i mellomtida, tar du stilling til ett for ett.
  - **B: GitHub-punktet står til porten er flyttet**, men uten påstanden om avtale. Erklæringen beskriver da det som faktisk skjer, og sier rett ut at lagringene er innom GitHub.
  - **C: PR #62 venter** til porten er flyttet, og flettes da uten GitHub.

## 4. Det Jonas må gjøre selv

**Serveren finnes.** Jonas opprettet serveren 11.11.2026: `ubuntu-8gb-hel1-1`, Hetzner CPX32 (4 vCPU, 8 GB, 160 GB), Helsinki, 89.167.24.148 (skjermbilde fra Hetzner). Den er større enn planen ba om (2 vCPU og 4 GB holdt), fordi Jonas også vil ha rom framover («sikret for fremtiden … opp mot 5000 brukere»). Spillet og reléet ligger fortsatt på `ubuntu-4gb-hel1-10` (CX23, 65.108.252.250). Planen står: den nye er portens server. Om spillet senere flyttes dit, er et eget steg (DNS, sertifikatene, reléets hemmelighet, deploy-nøkkelen) og ikke en del av steg 102. Ingenting er satt opp på den ennå.

- Etter V1 A: opprette serveren hos Hetzner (Helsinki, Ubuntu) og kjøre `setup.sh` på den som root; etter V1 B: kjøre `setup.sh` på nytt på dagens server.
- Legge nøkkelen til databasen i fila på serveren (kommandoen står i `setup.sh` sin utskrift), og senere ta den bort fra GitHubs hemmeligheter.
- Starte det første slippet etter flyttingen og se at porten holder.

## 5. Antatt eller usikkert

- Tida på serveren er anslått, ikke målt.
- At Chromium med 3D (SwiftShader) går på serveren uten skjermkort, er antatt; det gjør den på GitHubs maskin.
- At rrsync slipper lesing av `gate/result.json` gjennom med deploy-nøkkelen: lesing fra `current/` virket i slippet 11.11.2026.
- Om GitHub Pro kan være dekket av en avtale likevel, er ikke lest ved kilden (`docs.github.com` er stengt i øktenes nettverk). Planen forutsetter at den ikke er det.
- Jobbens logg hos GitHub er offentlig. `result.json` og `log.txt` må derfor holde samme regel som i dag: bare fingeravtrykk og feiltype.

## 6. Tester

- `savestest` som i dag (fixturen, den ødelagte stoppes; i `COVER`).
- En ny sjekk av tjenestens skript lokalt: den skriver et resultat som stopper når nøkkelen mangler, når ingen lagring kom, og når én ikke holdt; sett rød først.
- `setup.sh` kan ikke prøves i en økt (trenger root på serveren); Caddy og `systemd`-enhetene valideres av skriptet selv, som i dag.
- Det første slippet etter flyttingen er den ekte prøven. Den gamle porten i jobben tas ikke bort før den nye har holdt i det.

## Status

- 11.11.2026: planen skrevet.
- 11.11.2026: Jonas svarte «V1 A, V2 A». Steget er `klar`. Ikke bygd.
- 11.11.2026: serveren for porten opprettet av Jonas (`ubuntu-8gb-hel1-1`, CPX32, 89.167.24.148). Ikke satt opp.
