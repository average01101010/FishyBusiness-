# Filmoppsettet (harness): teknisk logg

*Startet 30.10.2026. Her står hvordan `tools/film.py` styrer spillet, hva som er prøvd, og hva som gjenstår. Planen står i `PLAN.md` del 4.*

## Slik virker det

- **Ingen filmkode i `src/`.** Spillet bygges med vektorpakkene (`KYST_VEC=1 node build.mjs` → `dist/`; uten `KYST_VEC` mangler bruer, veier og kartets bygg), serveres over HTTP av `film.py` selv på en ledig port, og styres gjennom det spillet alt eksponerer: `S` (tilstanden), `G3` og `G3._debug` (3D-visningen), `P(lat, lon)`, `isLandFar`, `coastDistFar`, `mapNeed`, `applyVessel`, `EPOCH`.
- **Adressen** er `index.html#seed=1,notut`: fast frø, ingen veiledning. Ikke `#qfix`, fordi den låser kvaliteten til «Høy»; kvaliteten settes i stedet med `S.settings.q3d`. På localhost går spillet på egen klokke (`WCLOCK.on` er usann), så `S.t` kan settes fritt.
- **Klokka** er Playwrights egen (`page.clock`): den går i sanntid under oppstart og lasting, pauses rett før første bilde (`pause_at`), og stepper så `1000/fps` ms per bilde (`run_for`). `Date`, `performance.now`, timere og `requestAnimationFrame` følger med, så spillets egen `frame()` tegner nøyaktig ett bilde per steg. Ingen endring i spillet trengs.
- **Klippet** er en JSON-fil i `shots/`: `when` (ISO, UTC) → `S.t`; `boat` → `S.boat.type` + `applyVessel()`; `place` (lat, lon, `clear` km fra land) → nærmeste sjøcelle, som `tests/teleport3d.py`; `heading` i grader; `speed` i knop gir `status:'sailing'` og en plan med ett veipunkt rett fram; `quality`; `pre` sekunder forspill (kjølvann, lasting); `load_s` sekunder sanntid til terreng og modeller før klokka fryses; `dur`; `cam`.
- **Kameraet:**
  - `orbit`: nøkkelpunkter i tid med `yaw`, `pitch` (grader), `dist` (m) og `fov`, interpolert med myk kurve, skrevet inn i spillets jaktkamera (`G3._debug.cam`) hvert bilde. Kameraet er relativt til båten, så det følger henne. Spillets egen kollisjonsløsning (løft over kai og bru, trekk inn langs linja) virker fortsatt.
  - `intro`: spillets egen vei ut av fars naust (`G3.intro(sek)`).
  - Et fritt kamera (øye og sikt i verden, for faste standpunkter fra land) finnes ikke ennå og krever en liten tilføyelse i spillet (`G3.film`), i egen PR.
- **UI skjules** med `body.kino-clean` pluss en innsatt stil som også tar kinoknappene, kameraknappen, tips og modaler.
- **Stillbildemodus** (`--stills`, for maskiner uten GPU): ingen forspill og ingen bilder mellom nøkkelpunktene. Båten settes der sporet har henne ved nøkkelpunktets tid (knop × 6, spillets tempo), kameraet settes, to bilder tegnes så visningen setter seg, og ett lagres. `isLandFar` varsler om båten står på land. For `intro` hoppes klokka fram med `fast_forward` mellom nøkkelpunktene.
- **Ut:** `control-m1/<klipp>-<størrelse>/f0000.png …` (nøkkelbildene ved 0, 25, 50, 75 og 100 %, eller alle med `--all`), `kontaktark.jpg`, og `log.json` med per nøkkelbilde: øyets høyde over land og sjø (`up`), fri linje til båten (`free`, 1 er helt fri), avstand (`d`), brennvidde, kvalitetsnivå og bilderate.

## Prøvd

| Dato | Hva | Resultat |
|---|---|---|
| 30.10 | Skjermbilder med spillet i sanntid, SwiftShader | rundt 45 s per bilde i 540×960, over 60 s i 1080×1920. For tregt til klipp. |
| 30.10 | Første kjøring av `film.py` på klipp 13 | `G3.cam` finnes ikke utenfra; kameraet ligger på `G3._debug.cam`. Rettet. |
| 30.10 | `page.clock.run_for` | Tar bare hele millisekunder. Oppsettet stepper til nærmeste ms av det eksakte bildetidspunktet, så 60 fps veksler 16 og 17 ms. |
| 30.10 | Bilde for bilde med frossen klokke, 540×960, SwiftShader | 120 forspillbilder var ikke ferdige etter 23 minutter. Skyen kan ikke filme klipp, bare stillbilder. Bekrefter `PLAN.md` del 6. |
| 30.10 | Stillbildemodus (`--stills`): båten flyttes langs sporet til hvert nøkkelpunkt, to bilder tegnes, ett lagres | 110 s for det første bildet (terrenget bygges), så 8–10 s per bilde. Fem nøkkelbilder på 2,5 minutter. Dette er skyens arbeidsmåte. |
| 30.10 | Første kontaktark av klipp 13 | Båten lå på feil sted (startpunktet fra lat/lon-søket lå i havna, og sporet gikk på land ved 7,5 s). Brua var ikke i bildet. Vektorpakkene (bruer, veier, bygg fra kartet) var ikke med: bygget må gjøres med `KYST_VEC=1 node build.mjs`. Sjøen tegnes som hvite striper i motlys på SwiftShader; på GPU ser den ut som i Jonas' skjermbilder. |
| 31.10 | Oppslag i spillet | Gisundbrua: 17 punkter i `BRIDGES` (`core/01-world.js`), midtpunkt 69,2435° N 17,9612° Ø (x 867,08, y 365,655 km), retning 122°, bjelkebru. Finnsnes kai 69,2384° N 17,9774° Ø. Fars naust ligger ved Finnsnes i et nytt spill med `#notut` (`naustSite()` gir `port:'finnsnes'`), så `G3.intro` virker rett fra start. |

| 31.10 | Klipp 1 (naustet) i stillbildemodus, 12. okt kl. 04:30 UTC | Fem like bilder: `G3.intro(6)` endret ikke kameraet, så introen må undersøkes (returverdi, om `INTRO` nullstilles). Klokkeslettet var natt med stjerner (06:30 lokal tid i oktober på 69° N), så grålysning trenger rundt 06:00 UTC. Natta i seg selv var fin: lys i vinduene, stjerner, kailys i sjøen. |
| 31.10 | Klipp 13, andre forsøk, startpunkt mellom kaia og brua | Båten sto på land hele veien; `isLandFar`-varselet virker. Brua *var* i bildet i siste nøkkelbilde (vektorpakkene er med etter `KYST_VEC=1`). Startpunktet flyttet til sundets akse 180 m sørvest for brumidten, retning 32°. |
| 31.10 | Terrengkart rundt brua fra spillets eget finmaskede terreng (`probe.py`, 40 m-ruter) | Land vest for sundet (Silsand), åpen sjø øst og sør. Brumidten ligger på 12,8 m dyp. `isLandFar` er 200 m-ruter og leser det smale sundet som land, så landsjekken bruker `terrH` i stedet. |
| 31.10 | Hvorfor båten sto på land i klipp 13 | Stillbildemodusen leste båtens posisjon *etter* at terrenget hadde lastet i 20 s sanntid, og da hadde hun alt seilt 500 m i 8 knop. Nå brukes klippets eget startpunkt. |
| 31.10 | Hvorfor introen ikke syntes i klipp 1 | `G3.intro` ble kalt før klokka ble pauset. Den falske klokka tar igjen sanntiden idet den pauses, og med SwiftShaders trege bilder hadde flere sekunder gått, så introen på 6 s var over før første bilde. Nå startes den etter pausen. |
| 31.10 | Klipp 13 etter rettingene | **Virker.** Snurperen ligger i sundet og går under Gisundbrua ved 7,5 og 10 s, med Finnsnes bak. Ingen landvarsler. Kontaktark: `control-m1/13-snurper-brua-540x960/kontaktark.jpg`. Sjøen er hvite striper i motlys på SwiftShader (programvarerenderen), ikke slik den ser ut på GPU. |
| 31.10 | Klipp 1 etter rettingene | **Introen virker:** øyet starter ved kaia foran naustet (pålene i første bilde) og glir bakover og opp til jaktkameraet over 6 s. Men i et nytt spill med `#notut` ligger trebåten ved butikkaia i Finnsnes, ikke ved et naust i 3D, så naustdøra må settes opp slik veiledningen gjør det (Vangshamn, `NAUST3D`). Kl. 06:00 UTC 12. oktober tegnes fortsatt som blå time, mørkere enn ventet for 08:00 lokal tid; tidspunktet må prøves fram (07–08 UTC), og tolkningen av `S.t` mot `EPOCH` sjekkes. |
| 10.11 | Chrome på den leide Windows-maskinen (NVIDIA RTX PRO 6000 Blackwell Server Edition), detstorebla.no | «3D-visning støttes ikke på denne enheten (shadere: sjø middels VS: konteksten er mistet)». WebGL-konteksten mistes ved kompilering av sjøskyggeren. Årsaken er ikke funnet. Playwrights Chromium med andre ANGLE-valg testes av økta på maskinen. |

| 10.11 | Leid GPU-maskin (Windows 10, NVIDIA RTX PRO 6000 Blackwell, 96 GB, 16 kjerner) | Hodeløs Chromium tegner på kortet med `--use-angle=gl` (OpenGL 4.5) eller `vulkan`. Med `d3d11` mister 3D-visningen konteksten mens sjø-shaderen kompileres («sjø VS: konteksten er mistet»), også uten GPU-vakthund; det kan ramme Windows-spillere og bør undersøkes i spillet. `film.py --gpu` bruker `gl`. |
| 10.11 | Windows-oppsett | Git for Windows sjekker ut med CRLF (`core.autocrlf=true`), og bygget legger `.b64`-filene inn i strenger, så `\r` stoppet bygget. Repoet er satt til `core.autocrlf=false` lokalt og sjekket ut på nytt. Python må kjøre med `PYTHONUTF8=1` (ellers leser `tools/map/game.py` filene som cp1252). |
| 10.11 | Filmklokka hoppet til år 58 000 | `page.clock.pause_at(ms)` i Python tolker et tall som **sekunder**. Klokka hoppet tusen ganger fram, `performance.now()` ble 1,8·10¹⁵, og sjøen ble flat, skyene endret seg og bølgene sto stille (trolig også de hvite stripene i skyens bilder). Nå gis en `datetime`. Sjøen med frossen klokke er nå lik sanntid. |
| 10.11 | Tempoet | Spillet seiler seks ganger fortere enn livet (`GAME_RATE`). Filmen setter `S.mult = 1/6`, så båtene, trafikken og sola går i ekte fart («pace»: «game» gir spillets). 9 knop er 4,6 m/s på skjermen. |
| 10.11 | Hastighet på GPU | 0,15 s per bilde i 1080×1920 med PNG og alle kontrollene: et klipp på 10 s (300 bilder) på under ett minutt. Lasting 10–15 s per klipp. |
| 10.11 | `G3.film` | Lagt inn i spillet (egen commit, `24-cinema.js` og `25-controls.js`): `{fov}` setter jaktkameraets brennvidde (ellers låst til 55° utenfor roret), `{eye, tgt, fov}` et fritt kamera. Uten virkning når den ikke brukes. |
| 10.11 | Kontrollene i hvert bilde | Skrogets omriss mot det fine terrenget (land, grunt), skroget i vannlinja og masten opp langs høyden mot spillets faste flater for kameraet (`camInside`: brupilarer, brudekk, kaier, bygg), øyet mot sjø, terreng og flater, og fri sikt. Etter filmingen hvert bilde mot det forrige (hopp). Første forsøk på klipp 13 i ekte fart: kameraet på siden mens båten var under brua fikk en pilar mellom seg og båten, spillets kamera trakk seg brått inn (hopp ved bilde 160). Banen går nå nord for brua. |
| 10.11 | Intet grensesnitt | Jonas: «Ingen UI, UX eller GUI». Alt på siden utenom 3D-lerretet `#gl` og elementene som holder det, gjøres usynlig (opacity 0) før hvert bilde, også stedsnavn-laget `#labels` og det som dukker opp underveis. |

| 10.11 | Løpet før filmingen | Hele løpet (forspill og klipp, skrogets lengde og bredde og 2 m ved siden) sjekkes mot det fine terrenget, og startpunktet flyttes til nærmeste sted der det er dypere enn dypgangen overalt. Kjernens kart er 200 m-ruter og sier sjø der havna er grunn: Hvaler, Hammerfest og Kirkenes ble flyttet 15–60 m. |
| 10.11 | Båt ved kai | 3D-visningen legger ikke båten rett ved kaia, den seiler henne inn langs sitt eget spor, over et minutt i ekte fart. Filmoppsettet kjører spillets tempo til hun ligger stille, og legger så andre båter ved siden av der 3D-båten ligger (`bv`). Andre båter legges inn som andre spilleres båter (`PEERS`); spillet tømmer den lista hvert tiende sekund uten server, så de legges inn igjen før hvert bilde. |
| 10.11 | Jaktkameraet ved brua | Når siktepunktet ligger høyt (mot brudekket), løfter og trekker spillets kamera seg, og båten ble en prikk. Klipp 3 og 13-side om side bruker fritt kamera (`"mode": "fixed"`, `G3.film`). Det stående bildet er bare rundt 27° bredt, så to båter side om side må ses langs linja, ikke fra siden. |
| 10.11 | Hvalen | En knølhval dukker opp fire ganger med 14 s mellomrom, og bare den siste viser halen. `spawn` med `age` 41,7 gir blåsten etter 0,4 s; `dist` og `swim` legger den der den ikke skjules av båten. Halen kom ikke tydelig fram i m1. |
| 10.11 | Grovklipp m1 | 50 s på «Fjord at Dawn», 18 klipp, tekster i øvre tredjedel, sluttkort over sluttklippet, felles fargebehandling. 5 min å sette sammen. `trailer/out/rough/m1.mp4` og `m1-540.mp4` på maskinen, kontaktark i `control-m1/grovklipp-m1-kontaktark.jpg`. |

## Eksporten, 10.11 (etter innstillingene til Laksebaronens siste trailer)

Jonas fikk innstillingene til Laksebaronens 4K-trailer og valgte samme format. Alt står ett sted, `tools/enc.py`:

| | Før | Nå |
|---|---|---|
| Størrelse og rate | 1080×1920, 30 | master 2160×3840, 60 (`film.py --scale 2 --fps 60`); grovklipp som før |
| Bildefiler | PNG | JPEG 97 for 4K (`--jpeg 97`), PNG ellers |
| Video | CRF 16 (14 per klipp) | CRF 13, preset `slow` |
| Farge | umerket, BT.601-matrise | BT.709, begrenset område, merket |
| Lyd | AAC 256k, låta som den var | AAC 320k, 48 kHz; miks til −14 LUFS og høyst −1,5 dBTP, så 60 % (Jonas' valg), rundt −18,5 LUFS |
| Filming | ett klipp om gangen | `JOBS=3` i `film-all.sh` |
| Sammensetting | én prosess | `assemble.py --jobs N` |

- **Fargefeilen var ekte.** ffmpeg regnet RGB om med BT.601 og merket ingenting, og en spiller som antar BT.709 viser da feil farge. Målt her på rene farger gjennom gammel og ny koding, lest slik en telefon leser fila: (200, 60, 40) kom ut som (212, 72, 36) før og (199, 58, 39) nå; (90, 160, 70) som (85, 147, 65) før og (89, 158, 70) nå. Rødt ble altså for sterkt og grønt for mørkt. `accurate_rnd+full_chroma_int` må stå i filteret, ellers blir hvitt fra JPEG 251.
- **Lyden** er ett fast løft til −14 LUFS (mindre hvis toppen ville gått over −1,5 dBTP), ingen kompresjon. Med stemme (`voice` i klippekartet): høypass 70 Hz, kompresjon 2,5:1 og toppbegrenser på stemmen, 3 dB demping rundt 2,5 kHz i musikken, og musikken på ett fast nivå minst 8 LU under stemmen. Musikken senkes aldri bare mens stemmen snakker.
- **Prøvd her i skyen** med lagde bilder og lyd (216×384, 60 bilder, JPEG, tre prosesser, stemme): fila kom ut som H.264 60/1, `bt709`, `tv`, AAC 48 kHz, −18,5 LUFS. **Ikke prøvd:** 4K-tegningen i spillet, tida per bilde og tre filminger samtidig på kortet. Det er første oppgave i `tools/START-4K-MASTER.md`.
- **Prøvd på GPU 10.11 (klipp 13, RTX PRO 6000, ANGLE gl):** `--scale 2` gir 2160×3840 uten endring i spillet (taket på «Ultra» er 3 ganger skjermpunktene, `QUAL.dpr` i `view3d/00-head.js`), og bildet er skarpere enn 1080 forstørret (rekker, master, navnet på baugen). 0,10 s per bilde (690 bilder på 71 s), 1,03 MB per bilde som JPEG 97. Banen er den samme i 60 som i 30.
- **Rykk hvert 0,4 s, rettet i `film.py`:** Playwrights frosne klokke kaller `requestAnimationFrame` hvert 16. ms av sin egen tid, ikke én gang per steg. Ved 60 bilder (16,67 ms) fikk hvert 24. steg to tegninger og dobbel bevegelse; ved 30 bilder hvert 12. steg tre for to (ligger i 1080-opptakene til m1 og m2). Sett som jevne topper i hoppsjekken (bilde 9, 33, …, 225, 249), borte etter rettingen: siden tegner nå nøyaktig én gang per bilde, styrt fra `film.py`. Igjen er små topper bare i sjøen (bilde 131 og 133 i klipp 13), som er spillets egen oppdatering av sjøflata.
- **Lyden i m2 kom ut på −20,4 LUFS, ikke −18,5:** låta er −14,8 LUFS med topp på −0,3 dBTP, så toppgrensa (−1,5 dBTP) holder løftet igjen (−1,2 dB i stedet for +0,8). Uten kompresjon eller toppbegrenser kommer den ikke høyere.
- Beholdt fra vårt eget: Source Serif 4 (spillets skrift), tekstene 27 % ned fra toppen (innenfor de trygge sonene: unna nederste fjerdedel og høyre kant), og at hvert bilde settes sammen med fargebehandling og korn før én koding.

## Gjenstår

- PR mot arbeidsgrenen med `G3.film` (commit «G3.film: kamera for traileren»).
- D3D11-feilen («sjø VS: konteksten er mistet») undersøkt i spillet.
- Lydrendering med `OfflineAudioContext` (vei B i `PLAN.md` del 5), først når bildene er låst.

## Verktøyene (10.11)

- `film.py <klipp.json> --gpu`: filmer ett klipp. Felter ut over de over: `heading` kan være `"coast"` (langs land med land om babord) eller `"upwind"`; `home` (fars naust der, f.eks. `vangshamn`), `moor` (`{port, kind}`: ved kai der `berthPose` legger båten), `peers` (andre båter ved kaia, som andre spilleres båter), `spawn` (dyr i et bestemt bilde), orbit-nøkler med `aim` (meter over båten kameraet sikter på). Bildene og `clip.mp4` i `trailer/out/<klipp>-<størrelse>/` (ikke i git), kontaktark og `log.json` i `control-m1/`.
- `film-all.sh <klipp> …`: filmer flere etter hverandre.
- `weather.py weather-wants.json`: leter i spillets vær etter timen som gir ønsket sol, vind, skyer, sikt og nordlys.
- `beats.py <sang>`: tempo, slag, takter og deler (til `audio/beats.json`).
- `titles.py`: tekstene og sluttkortet som gjennomsiktige bilder.
- `assemble.py audio/music-edit-1.json`: grovklippet bilde for bilde på slagene, med tekstene, sluttkortet og låta, til `trailer/out/rough/`.
