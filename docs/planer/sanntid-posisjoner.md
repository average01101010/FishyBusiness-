# Sanntid: de andre spillernes båter like jevne som i et skytespill (plan 03.11.2026)

## Hva Jonas ba om

- 02.11.2026: «Gjøre slik at andre brukere sine båter og NPC-båter beveger seg i realtime uten hakking eller lagging.»
- 03.11.2026: «Men du må huske at dette er et online-spill der jeg ønsker at spillere skal kunne se verden helt uten lag eller hakking. Gjerne like smooth som når man spiller call of duty eller andre spill, om du skjønner hva jeg mener?»

## Hvordan Call of Duty og lignende spill gjør det

- **En server sender tilstanden mange ganger i sekundet** (20–60 Hz) over en åpen forbindelse (UDP eller WebSocket), ikke med enkeltkall.
- **Interessestyring:** hver klient får bare det som er i nærheten.
- **Snapshot-interpolasjon:** klienten tegner de andre rundt 100 ms bak den nyeste meldingen, mellom to kjente punkter. Bevegelsen blir da jevn og nøyaktig, selv om pakker kommer ujevnt. Ekstrapolering brukes bare når en pakke mangler.
- **Bildet tegnes med skjermens takt,** med en jevn klokke (ingen stopp ved tikk).

## Hva som finnes i dag

- **Posisjonen går gjennom databasen hvert 15. sekund** (`worldTick` i `ui/10h-world.js`): `pos_put` skriver én rad per spiller i `presence`, og `pos_world` henter alle. Det er 0,07 Hz, rundt 300 ganger sjeldnere enn i et skytespill.
- **Rettet 02.11.2026** (commit på `ccr-f5d7f108-arpvc0`):
  - Avsenderen sender `livePose` (der båten er), ikke minuttposisjonen. Den var opptil 250 m gammel.
  - Mottakeren dødregner med svingrate og glir over til hver ny melding (`PTRK`, `ptTake`, `ptPose` i `core/05-vessels.js`).
  - NPC-båtene har en jevn klokke og myk kurs (`npcClock`, `npcHead` i `view3d/20-trawl-seine.js`).
  - **Resultatet:** ingen hopp. Men med 15 s mellom meldingene gjetter klienten i 15 s om gangen. En sving eller et stopp ses derfor først 0–15 s etter at det skjedde, og båten må rettes opp mykt etterpå. Det er «lag», og det fjernes ikke uten hyppigere meldinger.
- **NPC-båtene er regnet ut av klokka** (`npcStates`) og trenger ikke nett. Hver klient ser det samme. Der er det bare bildet og ytelsen som teller.
- **Serveren:** Hetzner CX23 i Helsinki (2 vCPU, 4 GB, 20 TB trafikk, `docs/lansering.md`). Caddy server bare statiske filer (`tools/server/Caddyfile`).
- **Supabase Realtime** er ikke i bruk. Prisen (supabase.com/docs/guides/realtime/pricing, hentet 03.11.2026):
  - Hver Broadcast-melding teller som 1 sendt pluss 1 per mottaker.
  - Pro har 5 mill. meldinger og 500 samtidige forbindelser inkludert. Etter det koster det 2,50 USD per million meldinger og 10 USD per 1 000 forbindelser.

## Fasene

**S1. Snapshot-interpolasjon i klienten** (én økt, bare klient; **bygd 05.11.2026 sammen med S2**, i `ui/10h-world.js`)
- Hver spillerbåt får en buffer med de siste meldingene: tid, x, y, kurs og fart.
- Båten tegnes en fast forsinkelse bak den nyeste meldingen, rundt 2,5 meldingsintervaller. Mellom to meldinger brukes Hermite-interpolasjon (posisjon og fart), så kurven blir rund. Dødregningen fra 02.11 brukes bare når bufferen er tom.
- Serverens klokke måles (avviket mot `Date.now`), så tidene i meldingene kan sammenlignes.
- **Måling:** to sider i Playwright. Den ene seiler en rute, den andre tegner. Vi måler hvor ujevne stegene per bilde er (største avvik fra jevn fart) og avstanden til der båten faktisk er.
- Filer: `core/05-vessels.js` og en ny `ui/10q-rt.js`. Tester: `tests/unit/peers.test.mjs`, ny `tests/rttest.py`.

**S2. Sanntidsreléet på Hetzner** (én økt; **bygd 05.11.2026**, se status nederst)
- En liten Node-tjeneste (`tools/server/rt/`, WebSocket med `ws`), bak Caddy på `wss://detstorebla.no/rt`, startet av systemd.
- Klienten sender posisjonen 5 ganger i sekundet under fart og én gang i sekundet når båten ligger stille, rundt 40 byte per melding.
- Reléet sender hver melding bare til spillerne innenfor 25 km. Kysten deles i ruter på 10 km, og hver klient følger sin rute og de åtte rundt.
- Ingenting lagres. `pos_put` hvert 15. sekund står som før, for AIS-en langt unna, topplista og de som ikke får forbindelse.
- **Innlogging:** en ny databasefunksjon `rt_ticket()` gir en billett som gjelder i 60 s, signert med en hemmelighet som bare databasen og reléet kjenner. Reléet sjekker den uten å spørre databasen. Gjester er med, slik som i `pos_world`. Båten kan ikke skjules (krav fra 07.10.2026).
- **Ingen forbindelse:** klienten faller tilbake på 15 s-pollingen og sporet fra 02.11.
- Filer: `tools/server/rt/server.mjs`, `tools/server/setup.sh` (Node og tjenesten), `Caddyfile` (`reverse_proxy /rt`), `deploy.yml` (laster opp reléet), og en migrering for `rt_ticket`. Tester: `sqltest` og `rttest.py` mot et lokalt relé.

**S3. Last og drift** (én økt)
- Lasttest med 500 og 2 000 simulerte klienter mot reléet på serveren. Vi måler CPU, minne, trafikk og forsinkelse.
- Reléets tall (forbindelser, meldinger per sekund, forsinkelse) legges i admin-appen.

**S4. Bildet og ytelsen i 3D** (én økt, kan tas før S2)
- Vi måler hva `npcStates` koster per bilde med full kystflåte (`coastNear` regnes på nytt hvert bilde, fordi nøkkelen er klokka). Ved behov lagres utregningen per spillsekund, og posisjonen interpoleres mellom.
- Hakkingen ved høy bildefrekvens i backloggen (#106, millisekundklokka i Firefox) tas samtidig, fordi den gjelder de samme bildene.

## Valgene

1. **Hvordan posisjonene skal fram**
   - **A (anbefalt):** eget relé på Hetzner-serveren. Det koster ingenting ekstra, og meldingene kan komme 5–10 ganger i sekundet. Det er den eneste måten å komme nær et skytespill uten en regning som vokser med hver spiller.
   - **B:** Supabase Realtime Broadcast. Vi slipper egen serverkode, men betaler per melding. Ved 2 Hz og 5 båter i nærheten blir det 43 000 meldinger per spillertime. 100 spillere samtidig, 3 timer om dagen, gir rundt 390 mill. meldinger i måneden, som er rundt 960 USD.
   - **C:** bare polle oftere (2 s). Det trenger ingen ny teknikk, men gir 7,5 ganger databaselasten og fortsatt synlig etterslep.
2. **Hvor ofte**
   - **A (anbefalt):** 5 Hz under fart og 1 Hz stille. En båt endrer kurs langsomt, så med interpolasjon ser 5 Hz ut som 10 Hz.
   - **B:** 10 Hz hele tiden, slik et skytespill gjør. Det gir dobbel trafikk uten at det synes på en båt.
3. **Interpolasjon eller gjetting**
   - **A (anbefalt):** tegn de andre rundt 0,5 s bak (snapshot-interpolasjon). Bevegelsen blir helt jevn og følger den ekte kursen. I dette spillet er det ingen skudd eller treff der et halvt sekund betyr noe. Slep mellom spillere (`10o-ptow.js`) plasserer båten etter din egen båt og påvirkes ikke.
   - **B:** ekstrapoler til nå. Det gir null forsinkelse, men små rettinger ved hver sving.

## Det som er antatt eller usikkert

- At serveren tåler reléet ved siden av Caddy. Et WebSocket-relé som videresender småmeldinger, bruker lite CPU, men S3 må måle det. Trafikken er rundt 40 byte × 5 Hz × antall mottakere, langt under 20 TB i måneden.
- Spillets fart (6×) gjør at båtene beveger seg rundt 25 m/s på skjermen i 8 knop. Med 5 Hz er det 5 m mellom punktene, som interpolasjonen fyller.
- ~~Hvordan billetten best signeres~~ **Avgjort i S2 (05.11.2026): HMAC i Postgres.** `rt_ticket()` lager billetten med `extensions.hmac` (pgcrypto 1.3, som prosjektet har) og hemmeligheten i Supabase Vault (`rt_secret`, `supabase_vault` 0.3.1 finnes i prosjektet); reléet sjekker den med `node:crypto`. Grunnene:
  - **Én vei for alle.** Gjestene er anonyme Supabase-innlogginger (HS256- eller ES256-token fra Supabase Auth), kontoene er WorkOS-token (RS256 med nøkler fra WorkOS). Å sjekke JWT i reléet ville krevd to slags nøkler, henting av JWKS fra to steder og at reléet fulgte med når nøklene byttes.
  - **Databasen avgjør hvem.** Reléet får den offentlige id-en (`left(md5('dsb' || pid), 10)`, den samme som `pos_world` gir) og gjesteflagget fra databasen, ikke fra klienten, og trenger verken WorkOS-id-en eller nettet. Med JWT måtte reléet ha regnet ut id-en og gjesteflagget selv, og en feil der ville vist båten under feil id eller vist gjestene.
  - **Kort og én gang.** Billetten gjelder 60 s og tas én gang (en tilfeldig nonce), mens et JWT gjelder i en time og kan brukes igjen. Prisen er ett kall til databasen per tilkobling og at hemmeligheten må ligge to steder (Vault og `/etc/dsb-rt.env`), som Jonas legger inn selv.
- Hetzner har én server og ingen reserve. Faller reléet ned, går spillet tilbake til 15 s-pollingen, slik som i dag.

## Hva planen ikke gjør

- Ingen server som bestemmer over spillet («server-authoritative»). Hver klient eier sin egen båt, som før. Fusk med posisjonen er ikke vanskeligere eller lettere enn i dag.
- Ingen endring i NPC-båtenes logikk, bare i hvordan de tegnes.
- Ingen sanntid for redskap, fangst eller handel.

## Status

- 02.11.2026: forløperen er bygd og pushet (sporet, `livePose`, NPC-klokka). S1–S4 venter på valgene.
- 03.11.2026: Jonas valgte den billigste veien («kjør på»): først rutedeling og sending ved endring over databasen (0 kr), så reléet på Hetzner. **Steg 1 er bygd:** `rt` i `pos_put`/`pos_world` (migreringen kjørt av Jonas), `peerRouteStr`, `routeWalk`, `worldSig`, og NPC-båtene i 3D med fart, bue og krengning (`npcFollow`). Neste: reléet (S2) med sending bare når mottakernes gjetning blir feil.
- 05.11.2026 (Ø16): **S2 er bygd, ikke rullet ut** (gren `ccr-529a099b-0o66nk`). Jonas' valg fra 03.11.2026 gjelder: 1A eget relé, 2A 5 Hz under fart og 1 Hz stille, 3A snapshot-interpolasjon 0,5 s bak. S1 (interpolasjonen i klienten) er bygd sammen med S2, i `ui/10h-world.js` (ikke i `core/05-vessels.js` og en ny `10q-rt.js`, fordi `05-vessels.js` hører til andre økter).
  - **Reléet** (`tools/server/rt/server.mjs`, `ws` 8.22.0 fra `package-lock.json`): WebSocket bak Caddy på `wss://detstorebla.no/rt` (lytter bare på 127.0.0.1:8787), ruter på 10 km, og hver båt hører sin egen og de åtte rundt (10–20 km hver vei, ikke en sirkel på 25 km som planen sa). Meldingene er binære: 18 byte opp (sted, kurs, fart, tilstand og avsenderens tid), 20 byte per båt ned, samlet ti ganger i sekundet per mottaker. Ingenting lagres, og det logges bare tall. Tak: 12 meldinger i sekundet per tilkobling (24 i støt), 64 byte per melding, 16 tilkoblinger per adresse, 6 000 i alt, én side per spiller (den nyeste vinner, 4001), ny billett hver 12. time. Posisjonen stoles ikke mer på enn i `pos_put` (Ø6 funn 11): ±5 000 km, høyst 60 knop, kjent tilstand, ingen felt om spilleren.
  - **Billetten:** `rt_ticket()` i `supabase/migrations/20261105160000_rt_ticket.sql`, se valget over. En gjest slipper inn og ser de andre, men gjestens båt sendes ikke videre, som i `pos_world`. Båten kan ikke skjules. Uten hemmeligheten i Vault svarer funksjonen `rt off`, og spillet holder seg til 15 s-pollingen.
  - **Klienten** (`ui/10h-world.js`, `RT`, `rtTick`, `rtSend`, `rtRecv`, `rtPose`): sender 5 ganger i sekundet når båten har fart eller har flyttet seg over 1 m siden forrige melding, ellers én gang i sekundet. De andre tegnes 0,5 s bak med Hermite mellom meldingene (farten fra meldingene på hver side). Er neste melding sen, fortsetter båten langs bevegelsen i opptil 1,5 s, før sporet fra 02.11 tar over. Overgangene glir: inn på reléet over 2 s (båten senker farten med en firedel et øyeblikk, fordi den skal et halvt sekund bak), og tilbake til sporet over minst 2,5 s fra reléets siste melding. Reléets klokke måles mot `performance.now` (den raskeste meldingen, synker 2 ms i sekundet). En skjult side slipper forbindelsen med en gang. Etter en feil prøver den igjen etter 1–64 s, etter en omstart av reléet spredt over 1–10 s, og uten `rt_ticket` (404) ikke mer i økta. `pos_put` og `pos_world` hvert 15. sekund går som før, også med reléet oppe.
  - **Drift:** `setup.sh` legger inn Node 22 fra NodeSource, brukeren `dsbrt`, hemmeligheten i `/etc/dsb-rt.env` (lages der og skrives ut én gang som linjen til Vault), tjenesten `dsb-rt` (systemd, strengt avlukket) og `dsb-rt-reload.path`, som starter tjenesten på nytt når GitHub har lastet opp en ny `VERSION`. `deploy.yml` laster opp reléet ved siden av siden, sammenlignet på innhold, så et uendret relé ikke startes på nytt. `Caddyfile`: `reverse_proxy /rt`, og `encode` gjelder ikke `/rt`.
  - **Målt lokalt** (`tests/rttest.py`, 12 OK, alt på én maskin uten nettforsinkelse): en båt som seiler en sirkel med 300 m radius i 8 knop med 5 meldinger i sekundet, tegnes 4 cm (median) og høyst 8 cm fra der hun var 0,50 s før; farten fra bilde til bilde avviker 0,8 % (median) og høyst 5 %. Overgangen tilbake til sporet: største steg 0,54 m mot 0,42 m med reléet.
  - **Det Jonas må gjøre før utrullingen:** kjøre migreringen i SQL Editor, kjøre `setup.sh` på serveren fra grenen (den lager hemmeligheten og skriver ut linjen til Vault), kjøre den linjen i SQL Editor, og si ja.
  - **Ikke gjort:** S3 (lasttesten mot serveren og tallene i admin; `GET /stats` på 127.0.0.1 gir tallene). En tett klynge (Lofotfisket) gir trafikk som vokser med kvadratet av båtene i ruta; taket er 512 meldinger per mottaker per tiende sekund, og S3 må måle om båtene langt unna bør tynnes ut. Sending bare når mottakernes gjetning blir feil (status 03.11) er ikke bygd: Jonas valgte 5 Hz/1 Hz, og med interpolasjon trengs hver melding.
- 06.11.2026: migreringen `20261105160000_rt_ticket.sql` kjørt av Jonas i SQL Editor og bekreftet med en lesende spørring (funksjonen, rettighetene, pgcrypto 1.3). Igjen før utrullingen: `setup.sh` på serveren, linjen til Vault og Jonas' ja.
- 06.11.2026: Jonas kjørte `setup.sh` fra grenen på serveren og la hemmeligheten i Vault. Bekreftet: `rt_secret` finnes og har riktig form, `/rt` går til reléet i Caddy (502 til koden er lastet opp), siden svarer 200. Igjen: Jonas' ja til utrullingen.
