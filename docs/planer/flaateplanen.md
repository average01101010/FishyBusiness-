# Flåteplanen og veikartene (fase 1–5, PWA og hele kysten)

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 9. Flåteplanen


## Fase 1: Flåtemodell uten synlige endringer (ferdig)

Se 4.3.

Testet:
- Lagring og innlasting.
- Et gammelt lagret spill blir en flåte med én båt, og fem timers fravær ble spilt av som 1 800 spillminutter.
- Alle regresjonstester består.

## Fase 2: Flere båter (ferdig)

Bygget etter designet under, med disse tilleggene:
- **Fangstinnsats:** Du teller bare med i fisket på båten du er om bord på. Før regnet spillet deg med på alle båter.
- **Driftsrapporten** leverer nå fangsten med én gang båten legger til. Før skjedde det i en `setTimeout`, som med flere båter kunne selge fangsten fra feil båt, og som under fravær kom etter at hele fraværet var spilt av.
- **Bestillinger** teller ikke fisk som blir inndratt.
- **Salgsverdien** for en båt i flåten regnes som innbyttet, altså med halv pris for 90 hk-motoren.
- **«Gå om bord»** gjør også at du følger båten.
- **Kvote-fanen** i Salgslaget viser et eget kort for båter uten adgang.
- **Verftet** sender melding når et nybygg til flåten er levert.

Designet:

Jonas valgte den strengt realistiske varianten.

**Regler:**
1. **Én båt i åpen gruppe.** Den første båten uten lisens (`openVesselId()`), og **ingen** hvis en båt i flåten har lisens i lukket gruppe.
2. **Eieren må være om bord i åpen gruppe.** `S.me` er båten spilleren er om bord på. Ved avgang settes `S.tripOwner = meAboard()` (`tripOwner` ligger i `VKEYS`). Er du om bord på en tur etter driftsplanen, er du høvedsmann, og turen er din. Rettet 30.09.2026: før regnet planturer alltid som skipperens, så fangsten ble inndratt selv om eieren var om bord. Oppstarten retter planturer som allerede er i gang med deg om bord i lagrede spill.
3. **Tilgang ved levering:**
   - `'lukket'` hvis båten har `lic`.
   - `'open'` hvis det er åpen gruppe-båten og `tripOwner` er sann.
   - Ellers `'none'`.
4. **`'none'`:** Torsk, hyse og sei samlet høyst 10 % av landingen, fordelt forholdsmessig. Torsk høyst 2 t per år (`q.byCod`). Resten inndras. Ingen ferskfiskordning.
5. **Driftsplan med ansatt skipper** er bare for lukket gruppe når det gjelder torsk, hyse og sei. Går skipperen alene på en båt i åpen gruppe eller uten adgang, fisker han kveite (`S.target = 'kveite'` hvis `kgear`) og andre arter, og han får 5 % skippertillegg. Med deg om bord fisker planen som dine egne turer (`fishEffort` teller deg). Skipperen er da vanlig mannskap og får ikke tillegget.
6. **Uten deg om bord** kan en båt bare kjøre hvis den har mannskap. Sjekk i starten av `depart()`.

**Endringer i koden:**
- **`sell()`:** Torskeblokken (`codFF` / `codQ` / `codConf` / `confShare`) generaliseres til inndragning per art (`confBy[sp]`). I løkka: `const cs = confBy[sp] || 0; if (cs > 0){ confKr += v * cs; confKg += x.kg * cs; v *= 1 - cs; }`. Egen meldingstekst for `'none'`.
- **`depart()`:** Skippersjekken og `S.tripOwner`.
- **`opsStep`:** Sett kveitemål når båten ikke har lukket gruppe.
- **Kjøp i telefonen:**
  - `a === 'buy'` får `data-ti="1"` for innbytte (dagens oppførsel med `switchVessel`) og `data-ti="0"` for å legge båten til flåten (`newVesselObj(type, havn, lic)`).
  - Samme for `a === 'buylic'`, med varsel om at skiffen mister åpen gruppe.
  - Ny båt fra verftet (`S.order`, der `PHONE.switchVessel(k)` kalles ved overtakelse) legges til flåten, med mindre bestillingen var med innbytte.
- **`newVesselObj`:** Klon standardverdiene for VKEYS fra `newState()`. Båten ligger i havn i oppgitt havn med 40 % drivstoff. Store båter får plotter og VHF. Navn fra en liste (Senjaværing, Nordlys, Malangen, Gisund, Havglimt, Skreien, Fjordbris, Straumen, Hekkingen, Kvitskjær). Ny id `vN`.
- **Fartøy-appen, fanen «Min båt»:** Et flåtekort per båt med navn, type, status, tilgang og «du er om bord». Knapper:
  - `vfollow`: bytter hvilken båt som følges (`storeVessel`, `bindVessel` og `G3.vesselChanged()`).
  - `vboard`: bytter båten du er om bord på. Begge må ligge i havn.
  - `vname`: gir nytt navn med `prompt()`.
  - `vsell`: selger båten for 70 % av prisen pluss 95 % av kvoteverdien. Ikke båten du er om bord på, og ikke den siste.
- **Mannskap-appen:** Merknad om tilgang for båten. Mannskapsbørsen ansetter til båten som følges.
- **`log()`:** Hendelser inne i `eachVessel` får båtnavn som prefiks når flåten har flere båter. Bruk et flagg som settes i `eachVessel`.
- **HUD:** Egen rad med båtnavnet og ⚓ når du er om bord, hvis flåten har flere båter.
- **Tester:**
  - To båter kjører driftsplan en simulert uke, med kvoter holdt adskilt og ingen båt på land.
  - Levering uten adgang gir riktig inndragning.
  - Knappene for følge, gå om bord, navn og salg trykkes ekte.
  - Lagring og innlasting med to båter.
  - Regresjonstestene.

## Fase 3: Rederiappen (ferdig)

Flåteoversikt med status, posisjon, last, drivstoff, skipper, driftsplan og dagens inntekt. Varsler når en båt trenger deg. Velger for hvilken båt i Mannskap, Fartøy, Utstyr og Verksted.

## PWA og hele kysten (veikart, 30.09.2026)

Jonas diskuterte med en annen AI-modell om å gjøre spillet til en PWA og utvide det til hele kysten fra Grense Jakobselv til Nordmøre. Vurderingen ble lagret som veikart. **Ingenting er bygget.** Hver fase krever eget klarsignal.

- **Valgt:** Hosting er GitHub Pages (P1 er bygget 03.10.2026). PWA-bygget kan ha flere filer (manifest, service worker, ikoner, kartsoner), men artifacten forblir én fil.
- **Vurdering av påstandene:**
  - *3D i nettleseren* er allerede løst med WebGL.
  - *Installasjon og offline* krever egen hosting. En artifact på claude.ai kan etter det vi vet ikke få eget manifest og egen service worker.
  - *Push-varsler* krever alltid en server. Nettet har ingen lokale, tidsstyrte varsler. På iPhone virker push bare for apper på Hjem-skjermen (iOS 16.4+).
  - *Påstanden om at EU presset fram PWA på iOS* er misvisende. Apple fjernet Hjem-skjerm-apper i EU i iOS 17.4-betaen og snudde 1.3.2024.
  - *Periodisk bakgrunnssynk* finnes bare i Chrome og Edge.
  - *Safari* sletter lagring etter 7 dager uten bruk for nettsider, men ikke for apper på Hjem-skjermen. Kvoten er rundt 60 % av disken for installerte webapper.
  - *Lagringsgrensene* tvinger ikke simuleringen over på en server. En server trengs for felles topplister uten juks, felles marked, push og synk.
  - *Batteriet* er allerede håndtert. 3D stopper når fanen er skjult, og `catchUp` regner inn tiden spilleren var borte.
  - *Hele kysten:* Dagens ~80 × 80 km bruker 3,8 MB kartdata. Kyststripa er ~20 ganger større (60–80 MB), så den må lastes i soner.
- **Faser:**
  - **P1, PWA-skall uten server (bygget 03.10.2026):**
    - Jonas ba om å få beskjed når vi blir begrenset. Det ble vi: artifacten var på 236 av 256 MB, og bygg, veier, bruer, kaier og NPC-ruter for hele kysten får ikke plass.
    - `KYST_PWA=1 node build.mjs` lager `dist-pwa/` med samme side, `manifest.webmanifest`, `sw.js` (versjon fra siden og kartmanifestet) og ikoner (`src/pwa/`, tegnet av `tools/pwa/icons.py`).
    - Service workeren:
      - henter kartpakkene fra mellomlageret først (`kyst-map`; navnet har hashen, så de byttes aldri)
      - fjerner pakker et nytt kartmanifest ikke lister
      - henter siden og kartmanifestet fra nettet først, og fra mellomlageret uten nett
    - `navigator.storage.persist()`.
    - Eksport og import av lagret spill under Innstillinger → «Lagret spill»: lagringen gzippet i base64 etter `KYST2:` (`saveCode`/`loadCode` i `02-format-state.js`). `SAVE_OFF` hindrer at `pagehide` lagrer over den før siden lastes på nytt.
    - `.github/workflows/pwa.yml` bygger med den nyeste kart-releasen (`game.py`) og legger ut på GitHub Pages: https://average01101010.github.io/FishyBusiness-/.
      - Pages' kilde er «GitHub Actions».
      - Miljøet `github-pages` tillater `main` og `ccr-5e1ba2f4-pusvyd` (Jonas satte det opp 03.10.2026).
      - Repoet er offentlig, så Pages er gratis.
    - `pwatest.py` sjekker manifestet, at service workeren tar over, mellomlageret, oppstart uten nett, og eksport og import.
    - Artifacten publiseres som før med samme kode, uten service worker.
  - **P2, liten server:**
    - innlogging (Vipps eller e-post), skylagring og synk
    - push ved ETA: klienten regner ut tidspunktet, serveren sender varselet
    - betaling for haill (kap. 7)
  - **P3, flerspiller:** Serveren kontrollerer sluttsedler, slik at topplistene og det felles markedet ikke kan jukses.
    - **Verdener (Jonas 04.10.2026):** Hver verden er en kopi av norsk fiskeri, med de samme 1 622 hjemlene i lukket gruppe, rundt 2 100 båter i åpen gruppe, de samme bestandene og den samme forskriften.
      - NPC-ene fyller plassene som ikke er tatt av spillere. En spiller som kjøper en hjemmel, tar over plassen til NPC-eieren (registeret `npcReg` i `03d-quota.js` er laget for å flyttes til serveren). I åpen gruppe tar hver spiller plassen til én av de virtuelle båtene.
      - Når alle NPC-hjemlene i en verden er kjøpt, handler spillerne med hverandre, og kvoteprisen stiger.
      - Når en verden er full, starter nye spillere i en ny verden. Bestander og kvoter justeres ikke for å gi plass, fordi det ville bryte realismen.
  - **P4, nye regioner i soner:** Soner etter **Norges Råfisklags ni soner** (sone 1 Øst-Finnmark til sone 9 Nordmøre, som er nettopp Råfisklagets område). Hver sone får egne mottak, fjordlinjer, fangstfelt og regler med kildesjekk. Kongekrabbe i kvoteområdet øst for 26° Ø.
- **Tone:** Engasjementet skal komme av god fisking, med nyttige varsler som spilleren velger selv. Uttrykk som «avhengighetsskapende», «null frafall» og «instant dopamin» strider mot prinsippene i kapittel 7, og Forbrukerrådet og EU følger manipulerende design i spill.
- **Kilder:**
  - WebKit, «Updates to Storage Policy»
  - MDN, «Storage quotas and eviction criteria» og «Periodic Background Synchronization API»
  - TechCrunch 1.3.2024 om Apples reversering
  - Norges Råfisklag, «Om Norges Råfisklag»

## Fase 4: Flåten i kart og 3D

Egne båter vises med egne symboler i kartplotteren, og du kan trykke for å følge. Båter i nærheten vises i 3D.

## Fase 5: Rapport og nøkkeltall

«Mens du var borte» per båt, og lønnsomhet per båt og for rederiet.

## Senere

Større fartøyklasser, snurrevad, trål og ringnot (med lisenser, sonar og farvann utenfor 12 nm), egne anlegg og nye regioner. For PWA, server og hele kysten, se «PWA og hele kysten (veikart)».
