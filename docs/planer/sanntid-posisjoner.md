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

**S1. Snapshot-interpolasjon i klienten** (én økt, bare klient)
- Hver spillerbåt får en buffer med de siste meldingene: tid, x, y, kurs og fart.
- Båten tegnes en fast forsinkelse bak den nyeste meldingen, rundt 2,5 meldingsintervaller. Mellom to meldinger brukes Hermite-interpolasjon (posisjon og fart), så kurven blir rund. Dødregningen fra 02.11 brukes bare når bufferen er tom.
- Serverens klokke måles (avviket mot `Date.now`), så tidene i meldingene kan sammenlignes.
- **Måling:** to sider i Playwright. Den ene seiler en rute, den andre tegner. Vi måler hvor ujevne stegene per bilde er (største avvik fra jevn fart) og avstanden til der båten faktisk er.
- Filer: `core/05-vessels.js` og en ny `ui/10q-rt.js`. Tester: `tests/unit/peers.test.mjs`, ny `tests/rttest.py`.

**S2. Sanntidsreléet på Hetzner** (én økt)
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
- Hvordan billetten best signeres: HMAC i Postgres (`pgcrypto`, som vi har) eller å sjekke JWT-en fra Supabase/WorkOS i reléet. Det avgjøres i S2.
- Hetzner har én server og ingen reserve. Faller reléet ned, går spillet tilbake til 15 s-pollingen, slik som i dag.

## Hva planen ikke gjør

- Ingen server som bestemmer over spillet («server-authoritative»). Hver klient eier sin egen båt, som før. Fusk med posisjonen er ikke vanskeligere eller lettere enn i dag.
- Ingen endring i NPC-båtenes logikk, bare i hvordan de tegnes.
- Ingen sanntid for redskap, fangst eller handel.

## Status

- 02.11.2026: forløperen er bygd og pushet (sporet, `livePose`, NPC-klokka). S1–S4 venter på valgene.
