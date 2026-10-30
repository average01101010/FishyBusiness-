# Trailerplan for Det Store Blå

*Versjon 2.1, 30. oktober 2026 (valgene i del 9 tatt samme kveld). Skrevet etter gjennomgang av spillkoden på arbeidsgrenen `ccr-5e1ba2f4-pusvyd` og Jonas' svar samme dag: spillet er gratis, semidiesel-lyden finnes, hele kysten og alle årstider finnes, og vi viser båter og natur framfor arbeidsanimasjoner. Strategien og begrunnelsene står i `TRAILER-STRATEGI.md`, arbeidsbeskrivelsen i `SLIK-LAGER-VI-TRAILEREN.md`. Dette er planen som binder dem sammen med det spillet faktisk kan.*

## 1. Det spillet gir oss, sett med filmøyne

Gjennomgangen av koden og dokumentasjonen ga mer enn jeg hadde regnet med. Det meste Laksebaronen måtte bygge for filmen, finnes alt her.

| Det vi trenger | Finnes i spillet | Hvor |
|---|---|---|
| Historien | Spillet starter faktisk med trebåten fra 1956 (`type:'trebat'`) i fars naust i Vangshamn. Visjonen heter «Fra jolle til rederi». | `core/05-vessels.js`, `docs/systemer/visjon.md` |
| Åpningsscene | Spilleren våkner i naustet, kameraet glir ut døra og ned på kaia, og ser båten for første gang. Dette er en ferdig kinosekvens. | `view3d/24-cinema.js` `introStart`, `docs/onboarding.md` B5 |
| Kinokamera | «Kino» med seks opptakstyper: drone, lavt langs siden, forfra, fra land med tele, landskap, bakfra over kjølvannet. Kameraet hopper over opptak der øyet er i land eller noe står i veien (`camFree`). | `view3d/24-cinema.js` |
| Rent bilde | «Skjul» (`body.kino-clean`) tar bort alt UI unntatt to kinoknapper. | `styles.css` 705 |
| Lys og tid | Sol og måne regnes der båten er. Senja har midnattssol midtsommer og mørketid midtvinter. Tiden settes med `S.t` (minutter fra `EPOCH`), slik testene gjør. | `docs/systemer/vaer-og-hav.md` 4.14, `tests/teleport3d.py` |
| Nordlys | Draperier med stråler, buer og folder, når sola er 7° under horisonten, det er klart, og aktiviteten er høy nok. Deterministisk fra tid og sted. | `vaer-og-hav.md` 5.20, `3d-verden.md` 5.42 |
| Vær og sjø | Vind og sjø fra tid og sted (`windAt(H, p)`), frøsatt verden (`WORLD_SEED`). Skumkart, kjølvann og skumkrage er under arbeid (Fysikk 4). | `core/03-simulation.js`, `docs/planer/fysikk-4-sjo-og-skrog.md` |
| Fast frø | `#seed=N` bytter `Math.random` med en frøsatt generator. To kjøringer gir samme vær, fangst og mannskap. | `core/01-world.js` |
| Dyreliv | Havørn, skarv, ærfugl, sau, nise, spekkhogger, knølhval med hale, fuglefjell, røyk fra piper, biler med lys, gatelys. `G3._debug.spawnWild('humpback', vinkel)` setter en hval akkurat der vi vil. | `view3d/17e-life.js`, `19-wildlife-npc.js` |
| Annen trafikk | MS Kystpilen (kystrute), MF Senjasund (ferje), Redningsskøyta, NPC-flåten med de samme båtmodellene. | `core/06-services.js` |
| Lys om natta | Fyr med roterende lyskjegler (Hekkingen, Bukkskinn), arbeidslys, kailys, lanterner, lys som glitrer i sjøen. | `3d-verden.md` 5.23 |
| Semidieselen | Ett tenn hver andre omdreining, 340–850 o/min, etter Jonas' video av en Sabb G. Hvert tenn slipper en svart røyksky fra eksosen (`drawSmoke`). Lyd og røyk går i takt. | `ui/10e-sound.js`, `3d-baater-og-animasjon.md` |
| Hele kysten | Kirkenes, Honningsvåg, Reine, Bergen, Hvaler, Senja er testet i 3D. Sesonghendelsene Lofotfisket (20.1–10.4), Finnmarksfisket (25.4–15.6), Seisommeren (10.6–31.8) og Krabbehøsten (1.9–30.11) er felles for alle. | `tests/teleport3d.py`, `skyen-og-felles-verden.md` 5.25f |
| Kvalitet | Fire nivåer. «Ultra» gir full oppløsning, tettere terreng og sjø, 160 km terreng og sikt til 90 km. Det er filmnivået. | `view3d/00-head.js` |
| Kontroller | `G3.camFree`, `G3.mastTop`, `G3.bridgeInto`, `isLandFar`, `coastDistFar`: det vi trenger for land-sjekk og mast-mot-bru-sjekk finnes som funksjoner. | `view3d/25-controls.js` |
| Merkevare | Logoen og delebildet lages i Blender av `tools/brand/logo.py`: havsjarken i den blå timen med Senja-fjellene bak. Skriften er Source Serif 4 Display Semibold (OFL). Dette er sluttkortets utgangspunkt. | `tools/brand/`, `src/pwa/og-image.jpg` |
| Testoppsett | Playwright i Python mot `dist/` over HTTP, `boot(pg)` starter spillet, skjermbilder til `tests/out/`. Byggingen tar 2 sekunder uten npm. | `tests/_env.py`, `build.mjs` |

**Det som ikke finnes, og som filmen trenger:**

1. **Fast klokke.** Spillet tegner i sanntid med `performance.now()` (rundt 80 steder i 3D-koden). For film må hvert bilde være nøyaktig 1/60 s etter det forrige. Dette løses uten å endre spillet: Playwright legger inn et skript før siden laster som bytter ut `performance.now`, `Date.now` og `requestAnimationFrame` med en kunstig klokke som filmoppsettet stepper fram ett bilde om gangen.
2. **Fritt kamera.** Kinokameraet velger selv. Filmen trenger øye, siktepunkt og brennvidde per bilde fra en bane vi har tegnet. Det krever én liten tilføyelse i spillet: `G3.film({eye, tgt, fov})` som, når den er satt, overstyrer kameraet. Noen linjer i `25-controls.js` og `24-cinema.js`, i egen PR, uten virkning når den ikke brukes.
3. **Lydopptak.** Lyden er laget i Web Audio mens spillet går, ingenting er innspilt. Et hodeløst Chromium gir ingen lyd ut. Se del 5.
4. **Rask tegning.** Skyen tegner med programvare-GPU (SwiftShader): rundt 45 s per bilde i halv størrelse. Klippene må filmes på en maskin med GPU (del 6).

## 2. Historien og de to båtene

Spillet begynner med trebåten og ender med snurperen. Traileren gjør det samme, på 60–70 sekunder.

- **Akt 1, arven (0–12 s).** Naustet. Døra glir opp, trebåten ligger ved kaia i grålysning. Semidieselen starter. Hun går ut Gisundet under Gisundbrua. *Lyden er kroken.*
- **Akt 2, kysten (12–40 s).** Hele kysten og hele året, på slag: Lofoten i januar med snø på tindene, Finnmark i mai med havørn, Senja i juni med knølhval i midnattssol, Varanger i oktober i kuling, nordlys i desember. Båtene blir større for hvert klipp. Stedsnavn på skjermen.
- **Akt 3, målet (40–55 s).** Kystnotbåten på 38,55 m legger ut under Gisundbrua kl. 04 i midnattssol. Lang, rolig kamerabevegelse. Ingen tekst, ingen stemme. Så: trebåten og snurperen ved samme kai.
- **Slutt (55–62 s).** Logo på siste store slag. «Spill gratis på detstorebla.no» ett slag senere. Motoren alene i ett sekund, så stillhet.

Det Jonas har sagt styrer utvalget: båtene og naturen bærer filmen. Arbeidet om bord (sette og dra bruk, sløying, levering) vises bare der vi har sjekket at det ser godt ut, og det sjekker vi senere i egen runde (del 8, punkt «Animasjoner»).

## 3. Opptaksliste, utkast 1

**Den gjeldende lista er `shotlist.md`** (v1 for 9:16, uten UI-klipp, etter Jonas' valg 30.10.2026). Tabellen under er utkastet den bygger på. Tidene er omtrentlige til musikken er valgt. Formatet er stående 9:16 og liggende 16:9 fra samme opptak, så viktig innhold holdes midt i bildet. Alle steder er ekte og navngis på skjermen med ett ord.

| # | Tid | Sted og tid på året | Båt | Hva som skjer | Kamera | Lyd | Tekst |
|---|---|---|---|---|---|---|---|
| 1 | 0–3 | Vangshamn, Senja, oktober, grålysning, overskyet | trebåt | Naustdøra glir opp, trebåten ved kaia. Som spillets egen intro. | `introStart`, døra og ut | Stillhet, så ovnen, så sjø | – |
| 2 | 3–6 | Samme | trebåt | Nærbilde: det grå treverket, rorkulten, motorkassa. Røyken puffer når motoren starter. | Lavt, nært, nesten i vannflaten | Semidiesel tenner, tomgang | – |
| 3 | 6–12 | Gisundet nordover, Gisundbrua | trebåt | Hun går 7 knop under brua. Finnsnes våkner, røyk fra pipene. | Fra land med tele, så bakfra over kjølvannet | Motor, musikk inn på slag ved 6 s | «Finnsnes» |
| 4 | 12–15 | Reine, Lofoten, 25. januar, kl. 11, klart | snekke 26 | Lav vintersol på snødekte tinder, ærfugl på sjøen. | Drone lavt, sidelengs | Musikk bygger | «Lofoten» |
| 5 | 15–18 | Vestfjorden, samme dag | havsjark 35 | Flere sjarker på feltet (NPC-flåten), lett sjø. | Fra siden, telelinse | – | «Lofotfisket» |
| 6 | 18–21 | Honningsvåg, 10. mai, kl. 09 | kyst 15 | Havørn sirkler over fjellet, skarv på bergene. Båten passerer under. | Drone som følger ørna, tilter ned til båten | – | «Finnmark» |
| 7 | 21–24 | Bleik, Andøya, 20. juni, kl. 01, midnattssol | kyst 21 | Knølhval blåser og dykker, halen opp. `spawnWild('humpback')`. | Fra dekk, lavt, mot sola | Blåsten | «Midnattssol» |
| 8 | 24–27 | Vardø, 15. oktober, kl. 14, Beaufort 7 | kyst 21 | Sjø over baugen, skum i stripene. | Forfra, lavt, sprut mot kamera | Vind, sjø | «Varanger» |
| 9 | 27–30 | Bergen, 5. april, kl. 19 | hurtigsjark | Byen, Bryggen, lys i husene, MS Kystpilen går ut. | Drone over havna | – | «Bergen» |
| 10 | 30–33 | Hekkingen fyr, Senja, 20. desember, kl. 23, klart | havsjark 35 | Lyskjeglene går rundt. Nordlyset bygger seg opp over 5 sekunder, aldri brått. | Fast kamera fra sjøen, båten passerer under fyret | Musikken åpner seg | – |
| 12 | 37–40 | Finnsnes verft | kyst 15 → kyst 21 | Kjøp. Større båt ved kaia. | Nært, båtnavnet på baugen | Siste slag før drop | «Fra sjark …» |
| 13 | 40–50 | Gisundet, 21. juni, kl. 04, midnattssol | kystnotbåt 38,55 | Hun legger ut under Gisundbrua. Masten klarer brua. Sola lavt i nordøst, lang skygge og glitter. | Én lang bevegelse: lavt forfra, stiger og dreier rundt styrbord side til akterut | Drop. Ingen tekst, ingen stemme | – |
| 14 | 50–54 | Finnsnes kai, samme morgen | begge | Trebåten fortøyd ved siden av snurperen. Kameraet trekker ut til begge er i bildet. | Fra kaia, sakte ut | Nedtrapping over to slag | «… til snurper» |
| 15 | 54–58 | Montasje: Hvaler, Rørvik, Bodø, Tromsø, Hammerfest, Kirkenes | ulike | Ett slag per sted. Hele kysten på fire sekunder. | Drone, samme høyde og retning i alle | Hvert klipp på et slag | Stedsnavnene |
| 16 | 58–62 | Sluttkort | – | Logoen fra `logo.py` på siste store slag. «Spill gratis på detstorebla.no» ett slag etter. Liten kreditering nederst. | – | Sluttslag, så semidiesel alene i 1 s | – |

**Regler for lista:**

- Alt skal være i spillet den dagen traileren publiseres. Ingen «kommer»-funksjoner.
- Båter og dyr kommer inn fra bildekanten eller er med fra første bilde. Hvalen blåser først, så kommer ryggen, så halen.
- Lyset endres aldri brått i et klipp. Nordlyset bygger seg opp.
- Overtoning bare i to overganger: 10 → 11 og 13 → 14. Resten er harde klipp på slag.
- Trebåten har klipp 1, 2, 3, 11 og 14. Snurperen har 13 og 14. Trebåten vinner i tid, med vilje.

## 4. Filmoppsettet (harness)

Laksebaronen bygde filmkoden inn i spillet bak et byggeflagg. Vi kan gjøre det enklere, fordi spillet alt eksponerer det meste gjennom `G3`, `S` og testene: **filmoppsettet ligger i `trailer/tools/` og styrer spillet utenfra gjennom Playwright, uten noen filmkode i `src/`.** Det eneste spillet trenger, er kameraoverstyringen (del 1, punkt 2), i egen PR.

### Slik virker det

1. `node build.mjs` bygger `dist/` som vanlig. Med hele kysten i `tools/map/out/game/` får bygget alle kartpakkene, ellers bare Senja. Lofoten, Finnmark og Bergen krever hele kysten, så det må hentes først (`python3 tools/map/release.py`, se `docs/systemer/datarorledninger.md`).
2. `trailer/tools/film.py` starter Chromium med Playwright, 1080×1920 eller 1920×1080, `deviceScaleFactor: 1`, og adressen `index.html#qfix,seed=1,notut`. På localhost går spillet på sin egen klokke (`WCLOCK.on` er usann), så tiden kan settes fritt.
3. **Før siden laster** legges et skript inn (`add_init_script`) som gjør klokka kunstig: `performance.now()` og `Date.now()` returnerer filmtiden, `requestAnimationFrame` legger tilbakekallet i en kø som oppsettet tømmer ett bilde om gangen. Hvert bilde er nøyaktig 1000/60 ms. Spillet merker ingen forskjell.
4. **Hvert klipp er en JSON-fil** i `trailer/shots/`: sted (lat, lon og kurs), dato og klokkeslett (`S.t`), båttype (`S.boat.type`), fart, kvalitet (`ultra`), kamerabane som nøkkelpunkter med øye, sikt og brennvidde, dyr som skal settes ut og når, hva som skal skjules, og hvor mange bilder før start som brukes til å bygge opp kjølvann og laste terreng.
5. `film.py` setter opp klippet (teleporterer med `P(lat, lon)` og `mapNeed`, slik `teleport3d.py` gjør), venter til terreng, bygg og modeller er lastet (`G3._debug.vec`, `trees`, `life.M`), kjører forspillet, og lagrer så ett PNG per bilde med `page.screenshot`. Fulle 60 bilder i sekundet.
6. **Været velges, ikke bestemmes.** Vinden kommer av tid og sted med fast frø. Oppsettet leter i timene rundt ønsket tid etter den som gir ønsket vind og sikt (`windAt(H, p)`, nordlys med `auroraAt`), og skriver tiden den fant inn i klippet. Da er klippet alltid likt.
7. **Kontrollbilder** per klipp: 0, 25, 50, 75 og 100 %, kontaktark og en forhåndsvisning i halv størrelse med musikken under, som i Laksebaronen.

### Automatiske kontroller

- **Ingen hopp:** hvert bilde sammenlignes med det forrige. Et sprang over terskelen stopper klippet og peker på bildet.
- **Skroget mot land og kai:** `isLandFar` og `coastDistFar` for skrogets hjørner i hvert bilde, også i forspillet.
- **Masten mot brua:** `G3.mastTop` mot `G3.bridgeInto` når snurperen går under Gisundbrua. Klipp 13 stopper hvis masten treffer.
- **Fri sikt:** `G3.camFree(båt, øye)` over 0,9 i hvert bilde, slik kinoen krever.
- **Lastet før start:** ingen bilde tas før trær, bygg, dyremodeller og kartpakker rundt stedet er på plass. Reserveformer skal aldri synes.
- **Lyset:** solhøyden logges per bilde. Et klipp der den krysser en terskel (for eksempel sola går ned midt i klippet) merkes.

### Spillfeil som filmen avslører

Rettes i egne PR-er på vanlig måte, aldri bare i filmen. Det vi allerede vet kan komme: sprang i detaljnivå på trær og bygg når kameraet flyr fort, Gisundbrua som skjuler opptak nord for Finnsnes (kinoen hopper dem over, filmen må velge baner som går klar), og kjølvannet som er under ombygging i Fysikk 4.

## 5. Lyd

Lyden i spillet er laget i Web Audio hvert 100. millisekund, ingenting er innspilt. Det gir tre veier til lyd i filmen:

| Vei | Hva | Fordel | Ulempe |
|---|---|---|---|
| **A. Opptak fra iMacen** | Spillet kjøres på Jonas' iMac med skjermopptak og systemlyd (QuickTime med BlackHole, eller OBS). Trebåten på tomgang og i 7 knop, 2–3 minutter av hver. | Ekte spillyd, enkelt, en kveld | Krever at Jonas gjør det, lyden er ikke bilde-synkron med filmen |
| **B. Offline-rendering i oppsettet** | Filmoppsettet bytter `AudioContext` med `OfflineAudioContext` og lar lydmotoren tikke på den kunstige klokka, så lyden rendres bilde for bilde sammen med filmen. | Perfekt synkron, røykpuffene og tennene i takt | Usikkert om lydmotoren tåler det uten endringer. Prøves først når bildene er godkjent. |
| **C. Jonas' Sabb-video** | Ekte opptak av en ekte Sabb G, som lydmotoren alt er laget etter. | Autentisk, varm | Ikke spillyd, så «alt er ekte spillgrafikk» må sies om bildet alene |

**Avgjort 30.10.2026:** Jonas kan ikke ta opp lyd, og lyden er ikke viktig i denne traileren så lenge musikken setter stemningen. Musikken bærer derfor hele filmen. Vei B prøves som forbedring når bildene er låst, så semidieselen kan ligge under klipp 1–3 og i siste sekund; lykkes den ikke, utgår motorlyden uten at filmen lider. Vei A og C utgår. Uansett vei legges motorlyden under klipp 2 og 3 og i det siste sekundet, og alt annet ambient (vind, sjø, blåst, måker) tas fra samme opptak.

Musikk og stemme som i `SLIK-LAGER-VI-TRAILEREN.md`: Suno rundt 96 BPM, to stilretninger, klipp på slag, tekst på skjermen i masteren og en eventuell ekte nordnorsk stemme som egen versjon.

## 6. Hvor filmes det

**Målt 30.10.2026 i denne skyen** (SwiftShader, Chromium 1243, spillet på «Høy», trebåten ved kaia i Finnsnes kl. 04 en junimorgen, UI skjult):

| Størrelse | Tid per skjermbilde |
|---|---|
| 540×960 | rundt 45 s |
| 1080×1920 | over 60 s, det tredje bildet gikk over 2 minutter |

Bildene ser riktige ut (trebåten med skipperen foran «Båt & Fiskeutstyr», lav sol, rolig sjø), men hastigheten holder ikke til film: et klipp på 10 sekunder er 600 bilder, altså mange timer per klipp. Tallet er målt med spillet i sanntid i bakgrunnen; med den kunstige klokka tegnes bare ett bilde per steg, så det blir raskere, men neppe raskt nok. Konklusjon:

- **Enkeltbilder og kontaktark kan lages i skyen** (ett bilde per nøkkelpunkt i kamerabanen), til å velge utsnitt og lys.
- **Alle klipp filmes på en maskin med GPU**, det vil si Jonas' iMac. Filmoppsettet er Python, Chromium og Playwright og kjører likt der. Med ekte GPU tegner spillet «Ultra» i 60 bilder i sekundet, så et klipp på 10 sekunder tar sekunder til et minutt.
- **Skyen brukes til resten:** klipp-JSON, musikkanalyse, klippekart, stemme, sammensetting, miks og kontroller på ferdige bilder.
- Alternativ hvis iMacen ikke kan stå og filme: en leid GPU-maskin i skyen for en dag eller to.

## 7. Måling etter publisering

CLAUDE.md krever «mål og se» for hver engasjementsendring. Traileren er en slik.

- **Kilde på besøket.** En liten tilføyelse i spillet (egen PR): `#fra=tiktok` eller `?fra=yt` i adressen lagres ved første oppstart og sendes med i telemetrien (`core/18-telemetry.js`), så trakten i admin-dashbordet (konvolutt → første fangst → første levering → registrert → dag 1/7/30) kan deles opp etter hvor spilleren kom fra. Hver publisering får sin egen adresse.
- **De fem korte klippene** med hver sin krok (lyden, stedet, snurperen, fakta-kortet, de to båtene) publiseres med noen dagers mellomrom før hovedtraileren. Den kroken som holder lengst de første tre sekundene, flyttes først i neste versjon.
- **Tidspunkt.** Lofotfisket i spillet går 20. januar til 10. april, samtidig med det ekte. Norske medier skriver om Lofotfisket hver januar. En hovedtrailer som slippes uka før 20. januar, med Lofoten-klippene fremst i de korte versjonene, låner den oppmerksomheten. Det gir også tid til Onboarding 2 og Fysikk 4 før alt filmes i full størrelse.

## 8. Rekkefølge og faser

| Fase | Hva | Resultat | Avhenger av |
|---|---|---|---|
| **F0** | Avklaringer. Gjort 30.10.2026, se del 1 og del 6. Gjenstår: om hele kysten kan hentes i skyen, og at filmoppsettet kjører på iMacen. | Denne planen | – |
| **F1** | Filmoppsettet: kunstig klokke, klipp-JSON, teleportering, væroppslag, kontrollbilder, de automatiske kontrollene. PR med `G3.film`. | `trailer/tools/film.py`, `HARNESS.md` | F0 |
| **F2** | De to viktigste klippene først, i halv størrelse: naustdøra med trebåten (klipp 1–2) og snurperen under brua (klipp 13). Holder de, holder resten. | Kontrollbilder og forhåndsvisning til Jonas | F1 |
| **F3** | Musikk: Jonas lager versjonene etter `audio/SUNO-PROMPT.md`, vi analyserer og velger. Klippekart. | `audio/music-edit-1.json` | F0 |
| **F4** | Resten av opptakslista, `script.md`, `shotlist.md` låst mot klippekartet. Første grovklipp. | `rough/m1.mp4` | F2, F3 |
| **F5** | Runder: Jonas ser på mobilen, notater med tidskode, retting, nytt grovklipp. Som Laksebaronen, 3–5 runder. | `rough/m2…` | F4 |
| **F6** | Animasjoner sjekkes: sette og dra bruk, sløying, levering, mannskap på dekk. Det som holder, kan få et klipp. Det som ikke holder, vises ikke, og noteres i backloggen. | Beslutning per animasjon | F5 |
| **F7** | Full størrelse på GPU, lydmiks til −14 LUFS, sluttkort fra `logo.py`, tekstede versjoner, fem korte klipp, plakat, `CREDITS.md`, tekster. | Leveransen | F5, F6 |
| **F8** | Publisering: korte klipp fra 4. januar, hovedtrailer 11.–15. januar 2027. Måling i admin. | Tall i trakten | F7, PR for `#fra=` |

## 9. Valgene (Jonas 30.10.2026)

1. **Musikk:** valget er vårt. Vi velger retning A, nordisk og nedpå, med retning B som reserve i samme Suno-økt. Bestillingen står i `audio/SUNO-PROMPT.md`.
2. **Stemme:** Jonas ordner den selv, som egen versjon. Masteren har bare tekst på skjermen (`script.md`).
3. **Format:** 9:16 til TikTok først. 16:9 senere fra de samme klippene.
4. **UI:** ingen klipp med grensesnitt. Fakta-kortet er tatt ut.
5. **Engelsk:** ikke nå.
6. **Lyd:** ingen opptak. Musikken bærer. Semidieselen eventuelt senere gjennom offline-rendering (del 5).
7. **Tidspunkt:** vårt valg. Vi sikter på hovedtraileren i uka 11.–15. januar 2027, uka før Lofotfisket åpner 20. januar, med de korte klippene fra 4. januar. Det gir tid til Onboarding 2 og Fysikk 4 før full størrelse.

## 10. Risiko

- **Tegnehastighet i skyen.** Målt til rundt 45 s per bilde i halv størrelse. Klippene filmes på iMacen; skyen lager enkeltbilder og alt rundt.
- **Hele kysten i skyen.** Kartpakkene er 195–259 MB og hentes fra en GitHub-release. Disken i en økt er begrenset. Det må prøves.
- **Lyd.** Vei B er usikker. Vei A holder for alt vi trenger.
- **Sprang i detaljnivå** på trær, bygg og nærfelt når kameraet beveger seg fort. Den automatiske hopp-sjekken finner dem, og banene legges så de ikke skjer, eller spillet rettes i PR.
- **Fysikk 4 og Onboarding 2** er under arbeid. Sjøen og åpningen kan se annerledes ut om noen uker. Filmen i full størrelse tas til slutt, så den får det nyeste.
- **Alt må være spillbart ved publisering.** Opptakslista bruker bare det som finnes i dag. Nye funksjoner kommer bare inn hvis de er publisert før traileren.

## 11. Det jeg endret fra versjon 1

- Spillet er ren WebGL i vanlig JavaScript med eget byggeskript, ikke Vite og three.js. Filmoppsettet trenger derfor ikke noe byggeflagg: det styrer spillet utenfra med Playwright, og den ene tilføyelsen i spillet (`G3.film`) går i egen PR.
- Åpningen er naustet og døra, ikke bare trebåten ved kaia. Spillets egen intro er trailerens første bilde.
- Hele kysten og alle årstider er med i opptakslista: Lofoten, Finnmark, Bleik, Vardø, Bergen, og sesonghendelsene som finnes i spillet.
- Lyden har en egen plan, fordi den er syntetisk og må tas opp eller rendres.
- Arbeidsanimasjoner er flyttet til en egen sjekk (F6), etter Jonas' ønske om å vise båtene og naturen.
- Publisering er knyttet til Lofotfisket 20. januar, og målingen til trakten i admin.
