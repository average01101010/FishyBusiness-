# Kystfiske – overlevering fra chat til Claude Code

Skrevet 29.09.2026 ved flytting fra claude.ai-chat til Claude Code. Dokumentet samler beslutninger, regler, tall og arbeidsmåte som ikke står i koden. Les det sammen med `docs/spesifikasjon.md` (fiskerisystemet) og koden.

- Siste publiserte versjon fra chatten: https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f (flåtemodell fase 1).
- Spesifikasjon (Claude Doc): https://claude.ai/code/artifact/0ca28240-d946-46b1-802b-b4b511e9398d
- Spillfila: én selvstendig HTML-fil, `kystfiske-prototype.html` (~4,3 MB, all kart- og terrengdata innebygd som base64).

## 1. Visjon og sjanger

- **Sjanger:** Tycoon-/managementsimulator med idle-elementer for kystfiskeflåten. «Fra jolle til rederi»: spilleren starter med en 19-fots skiff og fiskestang i Finnsnes/Senja og bygger et rederi med en flåte, driftsplaner, skippere og kvoter.
- **Stigen:** kystfisker (skiff, egne hender) → sjarkeier (større båt, mannskap, kvote i lukket gruppe) → småreder (2–3 båter, ansatte skippere, driftsplaner) → reder (flåte, ulike redskap og felt) → verdikjede (mottak, isanlegg, verksted) → imperium (nye regioner, konkurranse, topplister).
- **Idle-løkke:** Hver båt har skipper og driftsplan. Flåten fisker, leverer og fyller drivstoff og is mens spilleren er borte. Spilleren kan alltid gå om bord og ta roret selv.
- **Realisme er kjerneverdien.** Regler, priser, kvoter og båtoppførsel skal være så ekte som mulig. Forenklinger skal være bevisste og dokumenterte. Jonas er fra Finnsnes og har maritim bakgrunn, så han merker urealistiske detaljer.
- Målgruppe: voksne.

## 2. Arbeidsmåte og preferanser

- Kommuniser på **norsk**. Kodekommentarer og identifikatorer er på engelsk.
- Jonas spiller og tester på **nettbrett** (Android). UI må fungere på berøringsskjerm i stående og liggende format.
- Ved større funksjoner: **legg fram en konkret plan og vent på klarsignal**. Når Jonas sier «snakk uten å bygge» eller «vent til jeg gir klarsignal», skal ingenting bygges.
- Når han sier «kjør på», bygg, test og lever.
- Etter hver endring: kjør regresjonstestene, og lever en fungerende versjon. I chatten ble fila publisert som artifact hver gang.
- Vær ærlig om feil. Si fra når en test er svak, når noe er antatt, eller når en regel er usikker.
- Sjekk regelverk mot kilder (Lovdata, Fiskeridirektoratet, Råfisklaget) før regler bygges inn, og oppgi kilden.

## 3. Status nå

**Ferdig og publisert (i rekkefølge):** fiskerisystemet, redskapsstige og animasjoner, tempo 1:6, lukket gruppe-kjøp med lån, «Neste mål», haill, pub og verkstedovertid, kveitefiske med fredning, NPC-kaiplasser og trykkprioritet i kartplotteren, jevnere båtbevegelse, «Kaffe på kaia», fiskekar, rengjort bunn, bestillinger, klær og kulde, mannskapssystemet med Mannskapsbørs, **flåtemodell fase 1**, **fase 2** (flere båter) og **fase 3** (Rederiappen). Fase 2 og 3 er bygget i Claude Code.

**Etter spilltest 1 (bygget 01.10.2026, ikke publisert ennå):** feilrettinger A1–A15, juksamaskin = 2 × håndjuksa, innloggingsbonus i stedet for «Kaffe på kaia», riktig tid (6×) med nedtelling i ekte tid, butikken «Fiskeutstyr», rute-editor med WP-navn, angre og dra, autoruta «Følg leia» og den obligatoriske veiledningen «Første tur». Planen står i kapittel 9 under «Etter spilltest 1».

**Spilltest 2 (01.10.2026):** én agent, 384 handlinger fra nytt spill. Se `docs/playtest/rapport-2.md`.

**Ekkolodd-varmekart (bygget 01.10.2026, ikke publisert ennå):** Kartplotteren viser hvor fisken står i en sirkel rundt båten, ut fra ekkoloddet eller sonaren. Fisken trekker jevnt, bestanden vokser helt tilbake, og første tur har en ekte skreiflekk. Ekkoloddvinduet vises i plotteren, og sonaren er nytt utstyr. Se 5.1, 5.3, 5.14 og 5.16.

**Neste:** rettingene etter spilltest 2, med prioritet i rapportens siste del, deretter fase 4 i flåteplanen.

## 4. Teknisk arkitektur

### 4.1 Én fil, flere lag

1. **Kjerne:** simulering, tilstand `S`, arter, priser, kvoter og regler.
2. **UI:** HUD, knappelinja `#dock` med skuffen `#drawer` (`ui/10c-dock.js`), panel, telefonen `PHONE` med apper, overlays (`PUBW`, `ROD`), rute-editoren (`ui/03b-route.js`) og veiledningen «Første tur» (`ui/07b-first-trip.js`). Autoruta ligger i kjernen (`core/11-route.js`).
3. **3D:** `G3`, en egen WebGL-renderer for sjø, terreng, båter og effekter. Kartplotteren er Canvas2D og SVG.
4. **Data:** base64-blobber i `<script type="application/octet-stream">`, blant annet dybde, høyde, land, vei og bygg.

### 4.2 Tilstand og tid

- `S` er hele spilltilstanden. Lagres i `localStorage` under `KEY`, med `v:1`.
- Kart i km-rutenett: x østover, y sørover. Grenser lat 68,98–69,72 og lon 16,55–18,55. `KX = 111,32·cos(69,35°)`, `KY = 111,32`.
- `EPOCH` = mandag 1. mars 2027 kl. 06:00 UTC. `S.t` er spillminutter siden EPOCH, og `H = S.t/60`.
- `GAME_RATE = 6` spillminutter per ekte minutt. Ett spillår er rundt to ekte måneder, og en fisketur rundt én kveld. `S.mult` er en testmultiplikator.
- `step()` kjøres én gang per spillminutt. `catchUp(realMs)` spiller av fravær, opp til `CATCHUP_CAP`.
- **Tid i ekte tid** (`02-format-state.js`): `realDur(spillminutter)` og `inReal()` gir «om 12 min» ut fra `GAME_RATE × S.mult`, og `whenTxt(T)` gir «14:20 · om 12 min». Brukes i ruteanslaget, fisketida, verkstedet, bunkringen, lossingen, ståtida og planlagt avgang. HUD-brikka «Neste» (`nextEvent()` i `04-panels-instruments.js`) viser den nærmeste hendelsen for båten du ser på, for eksempel «⏱ Fremme på feltet om 7 min (14:20)».

### 4.3 Flåtemodellen (fase 1, ferdig)

- `S.fleet` er en liste av fartøy, og `S.cur` er båten som følges.
- Alt som hører til én båt, ligger i fartøyet under nøklene i `VKEYS`: `boat, plan, hold, crew, equip, jobs, cevt, ops, lic, quota, draft, draftSpeed, draftDep, marks, target, trail, fsess, facc, fnext, fishPlanH, workLog, clothes, tripBuff, prep, svcTold, boatName, lastSale, restWarn, kvRel, codWarn, lastIceWarn, navrows`.
- `S.boat`, `S.hold` og de andre er **alias** som peker på fartøyet som er bundet akkurat nå. All eldre kode virker derfor uendret.
- Hjelpefunksjoner:
  - `curVessel()` gir båten som følges.
  - `storeVessel(v)` kopierer tilbake til fartøyet.
  - `bindVessel(v)` setter aliasene og kaller `applyVessel()`.
  - `ensureFleet()` lager en flåte med én båt fra en gammel lagring.
  - `withVessel(v, fn)` binder midlertidig en annen båt.
  - `eachVessel(fn)` kjører en funksjon for hver båt.
- `step()` kjører først en felles del: bestillinger, Mannskapsbørs, marked, bestand og `hourly()`. Deretter kjøres `crewTick`, `navHour` og `vesselStep(H)` for hver båt via `eachVessel`.
- **Lagring:** `save()` skriver flåten én gang og fjerner VKEYS fra toppnivået. `load()` binder aliasene til båten som følges straks lagringen er lest, før noe annet leser `S.boat`.
- **Viktig ved bytte:** Primitive verdier (tall, strenger) må skrives tilbake med `storeVessel` før man bytter båt. `save()` gjør dette selv.
- **Rederinivå, ikke per båt:** `cash, loan, stats, sales, msgs, log, market, stock, orders, rep, bors, streak, haill, pubE, settings, company, owned, tut, lang, me`. `S.tut` er `0` eller veiledningens tilstand (5.16).
- **Fase 2 la til** (i `src/js/core/03-simulation.js`):
  - `S.me` er båten du er om bord på, og `tripOwner` (i `VKEYS`) sier om du var om bord da båten dro.
  - `vget(v, k)` leser et felt fra en hvilken som helst båt. For båten som er bundet, ligger de levende verdiene i `S`, ikke i fartøyobjektet.
  - `openVesselId()`, `meAboard()` og `access()` (`'lukket'`, `'open'` eller `'none'`) gir reglene i kapittel 9.
  - `onVessel(v, fn)` binder en båt og slår på båtnavn foran loggen. `eachVessel` bruker den.
  - `newVesselObj(type, havn, lic)`, `vesselValue(v)` og `deliverOrder()` (verftet).
- **Fase 3 la til** (i telefonen, `src/js/ui/05-phone.js`):
  - Appen `rederi` med flåtekort og varsler. `vSummary()` leser én båt mens den er bundet, og `PHONE.alerts()` gir varslene.
  - Båtvelgeren: appene i `SEL_APPS` (Fartøy, Utstyr, Mannskap, Mannskapsbørs, Verksted) viser og endrer båten i `selV`, som standard båten du følger. Handlinger i disse appene kjøres inne i `withSel`, bortsett fra navigasjon (`NAV`).
  - `S.sales` har båtens id i `v`. `hourly()` er delt: varsler og lån for rederiet, service per båt.

### 4.4 Konvensjoner og fallgruver i koden

- **Telefonknapper bruker `data-pa="handling"`.** `data-a` er en *parameter*, for eksempel appnavn for `data-pa="open"`. Dette ga en feil der driftsplanknappene aldri virket.
- **Nye apper** krever tre ting: en linje i `APPS`, et ikon i `IC` (SVG), og funksjonsnavnet i sidekartet `PAGES()`. En side som skal åpnes i skuffen i stedet for telefonen, legges også i `DRAWER` og får tittel i `TITLE` i `ui/10c-dock.js` (se 5.17).
- `BOAT` er et `const`-objekt som oppdateres med `Object.assign(BOAT, VESSELS[type])` i `applyVessel()`.
- **Nye lagrede nøkler** må legges til i standardlista i lastekoden, `for (const k of ['equip', 'crew', …])`. Nøkler per båt legges i `VKEYS`.
- **Telefonoverskrifter:** `L(no, en)` i telefonen, `t(key)` i panelet (ordbok), og `LS(...)` for korte og lange knappetekster.
- **3D-kamera mot styrbord side,** der skipperen står: `cam.yaw = -0.85`.
- Hendelser i 3D fra simuleringen går via `window.CATCHQ`, som er fangstkøen for fiskeanimasjonene.
- **Lagene i kartplotteren:** dybdekartet `#chartcv` (lerret), varmekartet `#heatcv` (lerret) og så SVG-kartet `svg#map` øverst. Land, kystlinje, kurver og navn ligger i SVG, så det som tegnes på `#heatcv`, havner aldri over land. Legg aldri noe som skal ligge under land, i `gBase` eller etter den.
- **TDZ mellom filene:** Funksjoner heises i det felles skriptet, men `let` og `const` finnes først når fila deres har kjørt. `03-map.js` kaller derfor `heatPaint()` bare når `window.heatReady` er satt (av `03c-heat.js`), og ingen fil kaller noe fra en senere fil mens den lastes.
- **Innstillinger må tåle `undefined`:** `S.settings` får ikke standardverdier nøkkel for nøkkel ved lasting. Nye nøkler leses som «ikke satt», for eksempel `S.settings.echo !== false` for «på».
- **`chartMode()`** (`07-guide.js`) gir `'fish'` bare når båten du følger har kartplotter. `S.settings.chart` er ønsket ditt og beholdes når du følger en båt uten plotter.

## 5. Systemer i spillet

### 5.1 Båter og utstyr

| Båt (`VESSELS`) | Pris | Last | Mannskap | Merknad |
|---|---|---|---|---|
| `skiff`, åpen 19 fot, 60 hk påhengs | 95 000 | 350 kg | 1 + 1 | Startbåt, planende, 24 kn |
| `snekke`, 26 fot, 30 hk diesel | 245 000 | 900 kg | 1 + 2 | 8 kn, deplasement |
| `sjark`, 34 fot (10,4 m), styrhus | 1 150 000 | 3 000 kg | 1 + 3 | 600 L diesel |
| `sjarkny`, 10,99 m ny | 6 400 000 | | | Byggetid 45 døgn på verftet i Finnsnes |

**Redskapsstige:**
- *Fiskestang med én sluk:* effekt 0,35 per person. Alle starter med den.
- *Håndjuksa med pilk og fire markkroker:* 1 900 kr, effekt 1,0.
- *Juksamaskin:* 34 000 kr, effekt 2,0 hver, altså omtrent dobbelt så mye som håndjuksa. Én person passer tre og fisker da ikke selv med håndjuksa. Skiffen med to maskiner fyller lasten på rundt 2 timer på en god skreidag (`JIG` i `03-simulation.js`, endret 01.10.2026).
- *Kveiteutstyr:* stor pilk, kraftig snøre og gaff, 2 490 kr.
- **Butikken «Fiskeutstyr»** (telefonapp `fiske`, i alle havner, «Fiskeutstyr på kaia» i Finnsnes) selger håndjuksa, is og kveiteutstyr. Et kjøp tar to trykk: det første viser prisen, det andre betaler, og kjøpet står i driftsloggen. Finnsnes har ikke isrenne, så butikken selger is i sekker for 2,00 kr/kg (`PRICE.iceBag`, vårt anslag). På mottakene kommer isen fra isrenna for 1,50 kr/kg. Handlingslinja har «Fiskeutstyr» og en isknapp med mengde og pris. Klær, elektronikk og juksamaskiner er i Utstyr-appen.
- *Garn, line og teiner:* passivt redskap som står i sjøen mens båten er borte. Se «Redskap i sjøen» i kapittel 9.
- *Halere* (`EQUIP`): elektrisk haler 38 000 kr (skiff og snekke, line og små teiner), linehaler 68 000, garnhaler 95 000 og teinehaler 58 000 (snekke og større). Uten haler trekkes garn og line for hånd og tar 2–2,5 ganger så lang tid. Store teiner kan ikke trekkes for hånd.
- *Plass til redskap* (`gearMax` i `VESSELS`): skiff 6 garn / 4 stamper / 20 teiner, snekke 15 / 10 / 50, sjark 40 / 24 / 150, sjarkny 60 / 30 / 200.

Mister du juksa, fiskes det videre med stang til du kjøper ny i Fiskeutstyr. `motor90` er et utstyrsvalg for skiffen (30 kn).

**Ekkolodd og sonar** (varmekartet i kartplotteren, se 5.14):

| Trinn (`HEAT.tiers`) | Utstyr | Varmekartet | Artsvalg |
|---|---|---|---|
| `basic` | Enkelt ekkolodd, alle båter har det | 1 nm i diameter, ruter på 100 m, fire trinn | Nei |
| `chirp` | CHIRP-ekkolodd, 13 900 kr, 3 t å montere | 1,5 nm, ruter på 60 m, glatt | Alle, torsk, hyse, sei |
| `sonar` | Sonar (søkelys), 150 000 kr, 16 t, bare sjark og ny sjark | 3 nm, ruter på 80 m, oppdateres hvert 2. minutt, viser hvor stimene trekker | Alle, torsk, hyse, sei |

- Sonarens pris og monteringstid er antakelser. Delene til en Furuno CH-37BB koster rundt 13 200 USD før montering (fant ingen norsk pris), og båten må på slipp for senkerøret.
- Ekkoloddet og sonaren slås av og på i sidepanelet i plotteren (`S.settings.echo`, `S.settings.sonar`). Av betyr ingen varme, og ekkoloddet slutter å tegne. Fartøy-appen merker dem «(av)».
- En montering som venter mens båten byttes til en type utstyret ikke passer, betales tilbake (`finishJob`).

**«Neste mål»** står øverst i Fartøy-appen og som en linje på telefonens hjemskjerm, med knapp til butikken når pengene er der.

### 5.2 Kart, fjordlinje og fangstfelt

- **Fjordlinja** (`FJORD`, `insideFjord(p)`) går fra Andøya via Skrolsvik, Gryllefjord, Hekkingen og Sommarøy til Kvaløya. Punktene er hentet fra Fiskeridirektoratets kart, kalibrert mot tre flyplasser.
- Innenfor fjordlinja er det forbudt for båter på 15 m eller mer å fiske, snurrevad er forbudt, line har høyst 5 000 kroker og torskegarn høyst 80 garn. Linja tegnes stiplet fiolett i kartplotteren.
- Den eneste NPC-båten på 15 m eller mer (20,9 m, fra Mefjordvær) har bare fangstfelt utenfor linja.
- **Fangstfelt** (`FIELDS`, `fieldCode(p)`): 05-25, 05-29, 05-30, 05-31, 05-40, 05-41 og 05-42, tilordnet med nærmeste punkt. Koden vises på sluttseddelen.
- **Kjente felt** (`GROUNDS`): Havet nord for Husøy, Utenfor Mefjorden, Vest av Gryllefjord, Malangsgapet, Gisundet og Solbergfjorden.

### 5.3 Fiskerimodellen

- **Arter** (`SPECIES`): torsk (kysttorsk og skrei), hyse, sei, lyr, lange, brosme, uer og kveite.
  - Hver art har månedlig tilgjengelighet (`av`), dybde (`dep`), eksponering (`prod`) og markedspris (`pm`).
  - Den har også ukentlig prisvariasjon (`sig`), størrelsesfordeling (`size`, lognormal), minstemål (`minKg`) og størrelsesklasser med minstepris (`cls`).
  - Fra sløyd uten hode til rund vekt regnes det med `uh`. Lever og rogn har egne priser.
- **Kalibreringsfaktor per art** (`k`):

| Torsk | Hyse | Sei | Lyr | Lange | Brosme | Uer | Kveite |
|---|---|---|---|---|---|---|---|
| 0,37 | 0,3 | 0,6 | 0,3 | 0,3 | 0,35 | 0,5 | 0,35 |

- **Skreipulsen** (`skrei`): 0,6 / 2,0 / 2,5 / 0,8 for januar–april, 0,1 i desember. Den virker bare på eksponerte banker på 40–250 m og på de tre ytre feltene (`skreiSpot`).
- **`density(sp, p, H)`** er den ene kilden for fisk i spillet: fangst, ekkolodd, varmekart, garn, line, stang og pubrykter. 30 × `density` er kg i timen for én person med håndjuksa. Den er delt i `denPlace(p)` (det alle arter deler: land, dybde, eksponering, helling og avstand til feltene), `denTime(H)` (sesongtallene, lagret for én time) og `denSp()` (artens egen sum). Delingen ga nøyaktig de samme tallene (kontrollsum over rutenett rundt alle feltene).
- **Fisken trekker** (`hotspot`, `HOT`): Gode flekker på et mønster på 3,5 km. To felt overlapper hele tiden, hvert glir sin vei med 0,7–1,7 km i døgnet og toner inn og ut over 240 timer. Før hoppet hele mønsteret hver 120. time. Snittet er det samme som før (0,742 mot 0,737).
- **Stimer** (`school`, `SCHOOL`): et finere mønster (400 m) som svømmer 0,5–1 km i timen i hver arts egen retning. Det gir ±15 % og er 1 i snitt, så fangsten over en dag er den samme, men bittet på ett sted kommer og går i løpet av en halvtime. Sonaren viser retningen (`schoolDrift`).
- **Bestanden** (`STK`, `S.stock`, ruter på 2 km): Den leses mellom de fire nærmeste rutene (`gridBilinear`), og fangsten trekkes fra de samme fire med samme vekter (`stockW`). Nedtrekket der du fisker er kg/K·Σw², altså mykere enn før, men det samlede uttaket er det samme. Gjenveksten har et minste steg og runder til 1e-4, så en rute kommer helt tilbake til 1: en rute på 0,5 er full igjen etter rundt 42 dager. Før stoppet den på 0,876, og krabbe på 0,667. Krabbe (`S.cstk`) er fortsatt én verdi per rute, som før, fordi teinekalibreringen hviler på det og varmekartet ikke viser krabbe.
- **Fangst:** `density() × luck(sp) × targetF(sp) × innsats × værstraff`, deretter trekkes hver fisk for seg med egen vekt.
  - Fisk under minstemålet slippes.
  - Kveite i fredningstiden eller over 100 kg slippes.
  - Uer utenfor juni–august er bare bifangst (×0,15).
- **Kalibrering** (én person med håndjuksa, 8 timer):
  - Skreidag på godt felt: 350 kg, altså full last på skiffen.
  - Juli: rundt 80 kg.
  - Seistim i mai: rundt 180 kg.
  - Bare fiskestang: rundt 100–145 kg.
  - `tests/simday.py` kjører også dekksarbeidet, ellers stopper fisket når bløggekaret er fullt (60 kg). Den skriver ut innsatsstigen 0,35 : 1 : 2 : 4 for stang, håndjuksa, én og to maskiner.
  - Mål for åpen gruppe i 2024 (Lofoten, Vesterålen, Senja og Tromsø): 5,3 t torsk, 3,0 t sei og 1,2 t hyse per båt og år.
  - **Etter varmekartet (01.10.2026):** `simday.py` ga 350 / 322 / 98 / 245 / 110 / 350 kg før og 350 / 273 / 129 / 229 / 134 / 350 kg etter (Husøy mars, Gryllefjord mars, Husøy juli, Malangsgapet mai, stang, to maskiner). Hver kjøring har ±10–15 % tilfeldighet, og de enkelte tallene flytter seg fordi hotspotene ligger annerledes. Det mykere nedtrekket gir litt mer fisk over en dag på samme sted. `calib.py`, `kvtest.py` og `geartest.py` holder seg innenfor sine intervaller.
- **Kveitefiske** (`S.target = 'kveite'`, krever kveiteutstyr):
  - Kveite får faktor ×9, og best rundt strømstille: ×(1,4 − 0,8·strømstyrke). Andre arter får ×0,2.
  - Juksamaskiner hjelper ikke.
  - Resultat: rundt én kveite per dag i september og 1,5 i oktober, 2 000–3 000 kr per dag.

### 5.4 Priser, kvalitet og salg

- **Prismodell:** `clsPrice = max(minstepris × kroktillegg, markedspris × havnefaktor × tilbudsfaktor × klasseforhold × metningsfaktor)`.
  - `weekDev` er et ukentlig AR(1)-avvik: 0,7 × forrige + støy.
  - `supplyFactor` ligger mellom 0,97 og 1,03.
  - Torskekurven er skalert til 2026-nivå med faktor 1,06.
- **Minstepriser:** dynamiske for torsk, hyse og sei fra 21.09.2026. De andre artene har faste minstepriser fra våren 2026. Tabellen står i spesifikasjonen og i `SPECIES.cls`.
- **Kvalitet** (`GM`):

| E | A | B | X (skadd) | V (vrak) |
|---|---|---|---|---|
| +5 % | 100 % | −15 % | −40 % | 1 kr/kg |

- **Kroktillegg:** Krokfanget hyse over 1,1 kg får +12,8 %.
- **Sløying om bord** (innstilling «Sløy fangsten»): hyse og sei slipper sløyetrekket på 0,30 kr/kg, og du får betalt for lever og rogn. Lever er 5 % av vekta. Rogn er 4 % for torsk i januar–april og 1 % ellers.
- **Arbeid på dekk (G, 29.09.2026):**
  - **Bløgging:** Den skjer automatisk og gratis idet fisken kommer over ripa. Deretter ligger fisken i bløggekaret, rund og uiset, og mister kvalitet omtrent tre ganger så fort som iset fisk (3,0 mot 0,9 poeng i timen).
  - **Sløying og ising** er arbeid (`DECK` i `05-vessels.js`). Sløying tar rundt 300 kg i timen per person og ising rundt 800. Isingen bruker 0,3 kg is per kg fisk. Tallene er anslag. En utstyrsleverandør oppgir 10–15 fisk i minuttet for hånd, trolig flatfisk, og FAO oppgir 30 i minuttet for maskin. Effektiviteten per person er `teamEff`.
  - **Hvem gjør hva** (`deckHands`):
    - Alene kan du ikke sløye mens du fisker eller styrer.
    - To eller flere: én styrer, og de andre jobber. Under fisket står én på dekk, og fisket går tilsvarende tregere.
    - Ligger båten stille eller ved kai, jobber alle.
  - **Bløggekaret** tar 60 kg på skiffen, 150 på snekka, 300 på sjarken og 400 på den nye sjarken. Er det fullt, stopper fisket til det er tatt unna. Tida du bruker på dekk, legges til fisketida. Knappene «Stopp og sløy» og «Fisk videre» styrer dette selv.
  - **«Ta unna fangsten før du går fra feltet»** (på som standard): alene blir du liggende til karet er tomt.
  - **I 3D:** Bløggekar og sløyebenk står på etterdekket. Den som jobber, står ved benken og sløyer, og sloet går over babord ripe mens måkene stuper etter det. Alene går skipperen fra rattet.
  - **Større fartøy** med fabrikk om bord kommer senere.
- **Sluttseddelen** viser art, størrelse, kvalitet, kilo, kilopris, lever og rogn, inndragning, ferskfiskordningen, bestillinger og fangstfelt.
  - Hver linje står i hele kroner og kilo, og totalen er summen av linjene (A7). Linjene står med full verdi, og det som inndras, står som egne trekk: torsk over kvote eller bifangstgrensen, krabbe under minstemålet og trekket for rognkrabbe. Tillegg for bestillinger og innloggingsbonusen har egne linjer.
  - Under totalen kommer «Lott til mannskapet» og «Til kassa», og kassa får nøyaktig total minus lott. Gebyret for småkrabbe står som en merknad under, fordi det kommer fra Fiskeridirektoratet og ikke står på seddelen.
- Alle priser i spillet er per kilo **rund vekt**.

### 5.5 Kvoter og regulering

- **Åpen gruppe, J-30-2026 § 21:**

| Lengde | Maks torsk | Garantert torsk |
|---|---|---|
| Under 8 m | 4,0 t | 3,0 t |
| 8–9,99 m | 5,6 t | 4,2 t (uavklart, se kap. 10) |
| 10 m og over | 6,4 t | 4,8 t |

  Hyse og sei er fritt fiske, med garantert 4,0/5,6/6,4 t hyse og 5 t sei.
- **Stopp i maksimalkvotefisket** (`codStopDoy`): 15. mai i 2025 og 16. april i 2026. Andre år trekkes en dato mellom 8. april og 20. mai. Kystposten varsler en uke før.
- **Ferskfiskordningen** (`ffPct`): 20 % fra 29. juni, 30 % fra 15. september, 40 % fra 13. oktober og 10 % fra 15. desember, av ukas ferske landinger. Hyse under 0,8 kg teller ikke.
- **Rekkefølge ved levering:** ferskfisktillegget først, så kvoten, og resten inndras. Verdien av inndratt fisk trekkes fra.
- **Lukket gruppe** (`LIC_OFFERS`, kjøpes i Fartøy-appen):
  - *Snekke med kvote under 7 m:* 9,562 t torsk, 2,4 mill. kr.
  - *Sjark med kvote 10–10,9 m:* 17,78 t torsk, rundt 5,15 mill. kr.
  - Kvotepris rundt 225 kr per kg torsk. Anslaget bygger på Riksrevisjonens nivå fra 2017 og prisutviklingen siden.
  - Lån opptil 80 % over 15 år til 6,9 %. Fast fartøykvote uten stopp.
- **Ikke med i spillet:** Alderstillegg, fordi spilleren ikke har noen alder, og kystfiskeordningen, som gjelder Sørreisa men ikke Finnsnes.
- **Kveite, høstingsforskriften § 39:**
  - Fredet nord for 62° N fra 20.12 til og med 20.4, for alle redskaper.
  - Minstemål 84 cm, minstevekt 7,2 kg ved salg.
  - Kveite over 200 cm skal slippes.
  - Ingen kvote.
- **Uer:** Direktefiske bare med juksa i juni–august for båter under 15 m.

### 5.6 Mannskap

- **Mannskapsbørsen** (app `bors`):
  - Kandidater følger fiskerregisteret 2025. Aldersgrupper: 4,3 / 19,4 / 19,5 / 16,7 / 20,1 / 16,1 / 3,9 %. 6 % kvinner. 10,8 % har biyrke og er om bord fredag–søndag.
  - Én eller to nye kandidater kl. 07 hver dag, ofte ingen i skreisesongen. Hver søker hyre i 2–5 dager, og det er høyst 6 i børsen.
  - Stjernene er anslag, og det andre trekket er skjult til det er avslørt.
  - Forhandling ned 2 prosentpoeng lykkes i 60 % av tilfellene, 35 % for stolte folk.
  - Mønstring skjer i havn. Pubrykter kan avsløre skjulte trekk.
- **Egenskaper** (1–5): erfaring, styrke, utholdenhet, teknisk, kokk og sjømannskap. **Redskap:** juksa, line, garn og teiner.
- **13 trekk:** arbeidsjern, kranglefant, spøkefugl, grinebiter, perfeksjonist, lokalkjent, sjøsyk, ølglad, lærevillig, rastløs, makelig, omsorgsfull og stolt. Alle har fordeler og ulemper, se `TRAITS` og `crewEff`.
- **Trivsel** drifter mot et mål:
  - Utgangspunkt 60, pluss (lott − ønsket lott) × 300.
  - Pluss eller minus opptil 12 for ukesinntekt mot forventning.
  - Kokk: (beste kokk − 2,5) × 3.
  - Minus (slitenhet − 50) × 0,5.
  - Minus kulde × 50.
  - Minus grov sjø, med ekstra straff for sjøsyke.
  - Trekkeffekter, nag × 5, brudd på hviletid −8, og uløst konflikt −10.
  - Driftshastighet 0,04 per time (0,07 for rastløse).
- **Oppsigelse:** Under grensen i mer enn 36 timer fører til oppsigelse i neste havn. Grensen er 22, 30 for rastløse og 15 for grinebitere.
- **Slitenhet:** +6 per time ved fiske og +3 ved seiling, skalert med utholdenhet og høyere om natta. Den går ned med 8 per time i havn.
- **Hviletid:** Minst 10 timer hvile per døgn (arbeidstidsreglene for fiskere). Brudd gir advarsel og 1,5 ganger raskere slitasje.
- **Kjemi** (`compat`): trekk, samme hjemsted, aldersforskjell over 30 år, og nag.
- **Konflikter** (`S.cevt`):
  - Mellom mannskapet (`PAIR_TOPICS`): løses ved å snakke med dem, ta parti, gi fri eller si opp.
  - Med skipperen (`BOSS_TOPICS`): løses ved å høre på, stå på sitt eller si opp.
  - Uløst etter 12 timer blir det verre, og etter 48 timer mønstrer noen av.
- **Utvikling:** Hver 40. time på sjøen øker erfaring og redskap, dobbelt så fort for lærevillige. Skjulte trekk avsløres etter 12 timer på sjøen.
- **Testet:** Vanlig drift med 10 timers fiske og klær ga trivsel 60–70. Hardkjøring med 20 timer per døgn fikk alle tre til å si opp innen fire døgn.

### 5.7 Driftsplan (`S.ops`, per båt)

- Lagret rute som driftsplan, med skipper, ukedager, avgangstid og vindgrense.
- `opsStep` tar værsjekk, fyller drivstoff, is og redskap, og drar. `opsLanded` selger, fyller på, sender rapport og gir skipperen 5 % bonus.
- **Fase 2** endrer hva en ansatt skipper får fiske i åpen gruppe, se kapittel 9.

### 5.8 Bestillinger (`CUSTOMERS`, `ordersTick`)

- **Kjøpere:** Mottakene på Husøy, i Senjahopen, Gryllefjord og Botnhamn. Fiskebutikken og hotellet på Finnsnes leverer via Botnhamn. I tillegg restauranten i Senjahopen.
- **Tilbud:** Nye bestillinger kl. 06, én eller to per dag og høyst 3 åpne. Hver må besvares innen ett døgn.
- **Hva som bestilles:** Bare arter som er fangbare nå. Torsk bare hvis det er over 150 kg kvote igjen.
- **Tillegg:** Store mottak betaler 10–20 %, små kunder 20–40 %, ganget med omdømmet. Bonus ved fullført bestilling.
- **Omdømme:** Fullført gir +8, tapt frist −10. Omdømmet vektlegger hvilke kunder som bestiller.
- Fisk som oppfyller kravet går først til bestillingen når du leverer i riktig havn.

### 5.9 Innloggingsbonus (`STREAK`, `S.streak`, fra 01.10.2026)

- Erstatter «Kaffe på kaia», som ble fjernet etter spilltest 1 fordi den ble opplevd som lotteri.
- Hver ny kalenderdag du åpner spillet, gir +1 % på prisen for fisken du leverer. Det er ikke noe tak. Hver dag du ikke kommer innom, trekker 3 %, og bonusen går aldri under 0. Tid tilbake i klokka gir ingenting.
- Regnes i `streakTouch()` (`core/03-simulation.js`) ved oppstart, når appen blir synlig igjen, og hvert minutt. Dagene er lokale kalenderdager (`dayKey`, `dayNum`).
- Bonusen gjelder fisken, ikke tillegg for bestillinger, lever eller rogn. Den står som egen linje på sluttseddelen, og mannskapets lott regnes av totalen med bonusen.
- Vises i HUD-en («Bonus +12 %») og på et kort i Salg-appen med hva i morgen gir og hva en tapt dag koster.
- **Migrering:** Eldre lagringer starter på 0 %. Ubrukte gratis pubrunder fra kaffen ble betalt ut med 1 000 kr hver. Lånte fiskekar og rengjort bunn er borte.
- **Å måle:** Uten tak dobler bonusen fiskeprisen etter 100 dager. Konstantene i `STREAK` gjør det enkelt å sette et tak senere.

### 5.10 Haill og pub

- **Haill selges kun for ekte penger.** Den er i testmodus nå, uten betaling. Kan også vinnes på puben.
- **Haill gjelder hele rederiet,** alle båter. Jonas' begrunnelse: det koster ekte penger.

| Type | Pris | Effekt |
|---|---|---|
| Kveithaill | 19 kr | ×3 kveite ved kveitefiske, ×1,5 ved vanlig fiske, ingen minus |
| Haill | 29 kr | +10 % på alle arter |
| Luksushaill | 59 kr | +20 % på alle arter, +35 % på torsk |

- **Ferskvare:** Full effekt i 2 døgn, deretter lineært ned til 0 etter 7 døgn. En ny haill erstatter den gamle.
- Haillen vises i HUD og som pynt på gelenderet i 3D (gullhestesko eller liten fisk).
- **Pubrunden** (`PUBW`):
  - 1 000 kr i spillkroner, én gang per spillkveld mellom 15:00 og 03:00, bare i havn.
  - Lykkehjulet: kveithaill 18 %, rykte 20 %, haill 7,5 %, luksushaill 1,5 % og tomhendt 53 %, med humoristiske replikker. Oddsen vises.
  - Runden betales og lagres før hjulet snurrer, så premien overlever at appen lukkes (A4). Kvelden går fra 15:00 til 03:00 (A3).
- **Første gang er luksushaill gratis** i veiledningen «Første tur», og Haill-appen forklarer da hva haill ellers koster.

### 5.11 Kulde og klær

- **Effektiv temperatur** (`effTemp`): Vindavkjølingsformelen. `coldPen` gir opptil 35 % kuldestraff og 15 % våtstraff.
- **Klær, per person:**
  - *Oljehyre* (1 290 kr): kulde ×0,85, våt ×0,2.
  - *Varmedress* (3 490 kr): kulde ×0,3, våt ×0,6.
  - *Begge:* kulde ×0,25, våt ×0,15.
- **Test ved −12 °C effektivt:** Fisket gikk 27 % tregere uten klær, 21 % med oljehyre og 6 % med begge.

### 5.12 Verksted

- **Overtid** med spillkroner: halverer resten av tiden på jobben som pågår, for 950 kr per spart time.
- **Hastejobb:** ferdig med én gang. Tenkt for ekte penger (15 kr), gratis i testmodus.

### 5.13 Båtbevegelse og animasjoner

- **Simuleringen** (`sailV`):
  - Planende båter akselererer 10 kn per minutt, deplasementsbåter 3 kn per minutt. Nedbremsing går 1,5 ganger så raskt.
  - 5 kn innenfor 250 m fra en havn.
  - Bremsing før neste stopp (havn eller fiskeplass) langs ruta.
  - `livePose` bruker samme fart som neste steg.
- **3D-følgeren** (`updateBoat`):
  - Styrer mot et punkt litt lenger fremme på ruta (pure pursuit).
  - `TURN_R`: skiff 35, snekke 45, sjark 70 og sjarkny 80 m.
  - Dreiepunktet ligger en tredel fra baugen, så hekken slår ut.
  - Sideskrens: β = 0,14·yawrate, begrenset til 0,18 rad.
  - Planende båter krenger innover (−0,18·yaw), deplasementsbåter utover (+0,06·yaw).
  - Båten flyttes direkte til simuleringens posisjon hvis den er mer enn 900 m unna.
  - `G3._debug.stepBoat(dt, t, frac)` brukes til frakoblet testing med 60 bilder i sekundet.
- **Fiskeanimasjoner:**
  - Stang: skipperen rykker og svinger fisken inn.
  - Håndjuksa: snelle med sveiv på ripa, og én til fem fisk på pilk og markkroker.
  - Juksamaskiner: haler selv.
  - Figuren har armer som tegnes live (`limbM`, armløs kropp + rør).
  - Fiskekaret regner bort fisk som fortsatt er i lufta.
- **Stangfisket** (`ROD`): minispill med napp, kamp, stramming og brudd. Automatisk fangst halveres mens det pågår.

### 5.14 NPC-flåte og kartplotter

- **Kaiplasser** (`berthSlot`, `berthShift`): Hver NPC-båt har en egen plass langs kaia, 30–60 m fra havnepunktet. Plassen er kontrollert mot land, og båter i samme havn ligger minst 20 m fra hverandre. Forskyvningen avtar over 150 m.
- Kystruteskipet og ferja har egne plasser, 70 m unna.
- **Trykk i kartplotteren:** Trykk nær en havn går til havna, ikke til en fortøyd båt. Fortøyde AIS-mål tegnes mindre og svakere.
- **Varmekartet** (`core/12-heat.js`, `ui/03c-heat.js`, fra 01.10.2026): Kartplotteren viser fisken i en sirkel rundt båten du følger, i både Navigasjon og Fiskekart, ut fra ekkoloddet eller sonaren (tabellen i 5.1). Kartplotteren er ikke nødvendig.
  - Rutene ligger på et fast rutenett i verden (`HEATC`), så bildet ikke flimrer. De regnes ut med `heatSample()` fra den samme `density()` som fangsten, i biter på 5 ms (`heatWork`). Nærmeste ruter regnes først, og litt foran båten når den går. Ved nytt bestandstime regnes de på nytt. I havn, i skjult fane og før dybdedataene er lastet regnes ingenting.
  - Det båten har passert, gløder etter og blekner over 30 spillminutter (`HEAT.glow`). Så glemmes det.
  - Tegnes på `#heatcv` under SVG-kartet: ettergløden, en dempet grå skive (sterkere i Fiskekart), de levende rutene og en stiplet ring for rekkevidden. Fargene følger «Fiskebestand» i Fishing: Barents Sea: blått der det er lite fisk, så fiolett, turkis og lyst, og gult der det er tettest. Skalaen er logaritmisk (4,5–150 kg/t internt), og det enkle ekkoloddet viser fire trinn.
  - **Ingen tall for fisken** (brukerens krav 01.10.2026): Spilleren skal aldri se kilo eller kilo i timen for fisken. Varmen viser hvor fisken står tett, ikke hvor mye en båt vil ta. Boksen `#heatBox` ved GPS-en viser bare instrumentet, rekkevidden i nm, artsbrikka og en skala fra «Lite fisk» til «Mye fisk». Med sonar står det også hvor stimene trekker (bare retning), og under første tur at full last er garantert.
  - Valgene står i sidepanelet: «Ekkolodd: På | Av», «Sonar: På | Av» og «Art: Alle | Torsk | Hyse | Sei» (`S.settings.heatSp`, bare med CHIRP eller sonar).
  - **Ekkoloddvinduet** (`#echoWrap`, `INSTR`) vises nå i plotteren ved GPS-en, og stopper når ekkoloddet er av. Ekkomerkene kommer fra samme sum som varmen og øker opp mot rundt 100 kg/t.
  - **Konsollen i 3D** (skiffen) viser den samme varmen (`heatDrawInto`) og «EKKOLODD AV» når ekkoloddet er av. Med CHIRP viser konsollkartet litt mer enn ±1,1 km.
  - Ytelse: Rundt 10 µs per rute her og rundt 40 µs med CPU-en struping fire ganger. Hele sonarsirkelen (4 000 ruter) tar 0,15–0,18 s fordelt på biter, og en full oppdatering kommer hvert annet spillminutt.

### 5.15 Ruteplanleggeren og «Følg leia» (01.10.2026)

- **WP-navn** (`ui/03b-route.js`): WP0 er starten (havna eller båten), så WP1, WP2 … i den rekkefølgen de seiles. Navnene brukes i kartet, lista, varslene («Etappe WP2→WP3 krysser land»), GPS-boksen og loggen («WP3 passert»). Punkter havna legger til på vei ut og inn (`w.auto` `'out'` eller `'in'`), vises dempet og merket «utseiling» eller «innseiling».
- **A12:** `exitWps` og `entryWps` (`07-harbours.js`) legger bare inn punkter når veien fra dem til neste punkt er fri, og aldri selve havnepunktet. Ser ingen av punktene målet, legges ingen inn, og etappen spilleren tegnet, blir markert.
- **Rutelista** har ett kort per WP: kurs som skal styres (rettvisende, kartet er nord opp), lengde i nm, ETA i spilltid med nedtelling i ekte tid, koordinat, fisketid ± og redskapsbrikke. `draftTimeline()` regner ut kurs og tider. Under kortene står sumlinjene, og knapperaden med «Kast loss» står fast nederst. Sidepanelet i plotteren er 340 px bredt.
- **Angre og gjør om:** Alle endringer i kladden er steg i en historikk på 100 steg per båt (`draftEdit`, `draftUndo`, `draftRedo`). Den lagres ikke. Flytende knapper på 44 × 44 px står over zoomknappene.
- **Flytt og sett inn:** Et trykk innenfor 22 px av et punkt drar det. Havner det på land, blir det rødt og går tilbake. En finger til avbryter og zoomer kartet. Havna til slutt kan ikke flyttes. Hver lange etappe har en «+» midt på: et trykk setter inn et punkt der, og et drag lager et nytt punkt der fingeren slipper. Farene regnes per etappe (`legHazardMemo`), så et drag regner bare om de to etappene som berøres.
- **«Følg leia»** (`core/11-route.js`): A* på rutenettet på 100 m med avstand til land (`DC`). Et steg koster mer innenfor 200 m fra land, og mye mer over vann grunnere enn sikker dybde + 1 m eller nær skjær (ikke i havnene). Havnene forlates og nås via innseilingen. Ruta rettes ut der en rett etappe holder 150 m fra land (mindre der det er trangt), dyp nok og fri for skjær, til høyst 12 WP. Beregningen går i biter på rundt 8 ms.
  - Bruk: knappen i knapperaden eller den flytende kompassknappen, og så et trykk i kartet (et punkt eller en havn). Hele autoruta er ett angresteg.
  - En håndtegnet rute får en linje som sammenligner den med å følge leia gjennom de samme stoppene: «Følg leia: 5,2 nm · 20 min · 3,1 L. Din rute: −0,2 nm, −1 min, −0,1 L.»
  - Målt: Følg leia er 0–1,4 % lengre enn den strammeste veien langs land til de seks feltene. Fordelen med en god manuell rute er altså liten, fordi rutene mest går over åpent vann.

### 5.16 Veiledningen «Første tur» (01.10.2026)

- **Obligatorisk** for nye spill, også etter nullstilling. Eldre lagringer sendes ikke gjennom den. `#notut` i adressen hopper over den (testene bruker det).
- **Tilstand:** `S.tut = {v:2, m:{…}, catch:true, pAt}`. `m` er milepælene. Steget som vises, er det første som ikke er gjort, og «gjort» leses også av spilltilstanden, så veiledningen tåler omlasting. Rutestegene (`live`) leses på nytt hver gang til båten har kastet loss.
- **Stegene** (`TSTEPS` i `ui/07b-first-trip.js`): butikken (håndjuksa og 150 kg is gratis), kartplotteren, rute til ringen ved Gisundet nord (med «Følg leia» fremhevet), minst 2 timer fisketid, «Kast loss», gratis luksushaill mens båten går ut, fisket og «Fisk selv», dekksarbeidet, full last, rute til Botnhamn med «Følg leia», «Kast loss», «Neste»-brikka, levering, sluttseddelen og «Neste mål».
- **Visning:** Et dempet lag med hull rundt målet og en pulserende ring (z-index 61–62, over telefonen), med tipset over (63). `tutRect()` gir målet.
- **Garantert første fangst** (`S.tut.catch`): Så lenge flagget er satt, ligger det en ekte skreiflekk på feltet i Gisundet nord (`tutBonus`, `TUTB`, `TUT_FIELD`). Den gir rundt 175 kg/t for én person i sentrum og en tidel ved kanten av ringen, i samme miks som påfyllingen (72 % torsk, 18 % sei, 10 % hyse). Flekken legges oppå bestanden og fiskes ikke ned, så ekkoloddet og varmekartet viser det båten får.
  - `fish()` fyller fortsatt på, så lasten er full når fisketida er ute, men påfyllingen er nå et sikkerhetsnett: rundt en firedel av fangsten i stedet for ni tideler (`window.TUTTOP` teller den i testene). Bare bestandens egen andel av fangsten trekkes fra bestanden.
  - `risk()` og snuing for vind er slått av, og i stangfisket kommer nappet etter 4–8 s. Flagget nullstilles ved første levering.
- **Haill:** Kommer båten fram før haillen er hentet, venter den på feltet (`b.tutWait`) og begynner å fiske når haillen er om bord.
- **Sperrer** (`tutAllow`): «Kast loss», nye punkter og levering bare på sine steg. Puben, kveiteutstyret, driftsplanen, «Hjem samme vei» og levering andre steder enn Botnhamn er skjult til veiledningen er ferdig.
- **Nødutgang:** «Hopp over veiledningen» vises først etter 20 minutter uten fremgang.
- **Knappelinja:** Veiledningen peker på Verft og så Fiskeutstyr (`dockApp()`), på «Fisk selv» og statusfeltet i knappelinja, og på Marked, Lever og «Lever» i skuffen. Sluttseddelen vises i skuffen under Marked, Lever.

### 5.17 Knappelinja, skuffen og «Sett ut» (01.10.2026)

Inspirert av Fishing: Barents Sea. Den gamle handlingslinja `#actbar` er borte, og telefonen er slanket.

- **Knappelinja** (`#dock`, `DOCK` i `ui/10c-dock.js`): Runde knapper med et kort ord under, langs nedkanten. Bare knappene som passer akkurat nå, vises. Det som ikke kan brukes, er grått, og et trykk gir grunnen som toast. `renderActs()` er beholdt som navn og kaller `DOCK.render()`.
  - **I havn:** Marked (Lever, Is, Agn), Bygd (Pub, Bank, Oppdrag, Mannskap), Verft (Båthandel, Oppgrader, Fiskeutstyr, Vedlikehold, Bunkring), Beholdning og Planlegg. Marked, Bygd og Verft åpner en vifte med mindre knapper over seg (`#dockFan`). Med planlagt avgang: Kast loss og Avbryt.
  - **På sjøen:** Jukse (vifte med timer, start og kveite), Sett ut, Ta opp, Auto-nav, Hjem og Beholdning når båten ligger stille; Stopp, Sløy eller Fisk videre, Stang og Beholdning under juksing; Stopp båten, Hjem og Auto-nav under fart; Hjelp ved motorstopp. Mannskap dukker opp med prikk når det er krangel om bord.
  - **Statusfeltet** `#dockInfo` over knappene er tekst (avgang, verksted, lossing, kaiarbeid, redskapsarbeid, juksing og dekk).
  - `DOCK.items(meny)` og `DOCK.text()` er for testene.
- **Skuffen** (`#drawer`): Liggende kommer den fra høyre (380 px), stående er den et ark over knappene (55 % av høyden). Innholdet er telefonens sider: `PHONE.page(side)` lager HTML, og `PHONE.dact(side, handling, data)` kjører en `data-pa`-handling som om siden var åpen i telefonen. `DOCK.open('side:fane')` åpner en side med en fane valgt.
  - **Sidene i skuffen** (`DRAWER` i `05-phone.js`): `lever`, `is`, `agn`, `bank`, `oppdrag`, `mannskap` og `bors` (som to faner), `fartoy` (Båthandel), `utstyr`, `fiske` (med kjøp av garn, line og teiner), `verksted`, `beholdning` (Redskap, Lasterom, Båten), og de gamle `havn`, `last` og `redskap`.
  - `PHONE.open(side)` og `data-pa="open"` sender en side i `DRAWER` til skuffen. Varslene i Rederi bruker `side:fane`, for eksempel `beholdning:last`.
- **Telefonen** har ti apper: Vær, Kystposten, Meldinger, Rederi, Salgslaget (Priser, Mine landinger, Toppliste), Kvote, Haill, Sjømann, Redning og Innstillinger. Kvote er fanen fra Salgslaget som egen app.
- **«Sett ut»** (`ui/03d-setmode.js`, tilstanden `SETM` er deklarert i `03-map.js`): Valget i viften åpner kartplotteren med redskapet tegnet som en linje fra båten. Lengden er den samme som `startSet` bruker: garn 30 m, line 1,5 m per krok, teiner 25 m mellom hver. Kartet zoomer så linja fyller rundt 40 %.
  - Dra i enden, eller trykk i kartet, for å snu linja. − og + endrer antall stamper eller teiner (en garnlenke settes hel).
  - Linja er rød med grunnen når enden er på land eller grunnere enn 5 m, når den krysser land, eller når `gearRules` sier nei.
  - «Sett ut» kaller `startSet(kind, spec, 0, hdg)`. Med `hdg` bruker den `setGeomExact` og setter bare der linja er tegnet, og båten snur dit. Uten `hdg` (ruta og driftsplanen) gjelder `setGeom` som før.
- **Ta opp** lyser innenfor 0,3 km fra en blåse (`nearSet`). For garn og teiner kommer «Trekk og sett igjen» i en vifte.
- **Auto-nav** åpner kartplotteren med «Følg leia» klar og `AUTONAV` satt. Et trykk på en egen blåse finner veien til et punkt 50 m utenfor (`buoyStandoff`), og båten går med en gang veien er funnet. Den trekker ikke selv. «Kjør dit» per sett i Beholdning gjør det samme (`DOCK.goTo`).
- **Rettinger:** `gearTap` ga et rutepunkt med trekk uten `kind`, så `wpActLabel` krasjet. En setting som ble stoppet før første enhet gikk ut, gir nå tilbake blåsesettet, egnede stamper og teineagn.

## 6. Regelverk og kilder

| Tema | Kilde | Hovedpunkter |
|---|---|---|
| Kvoter nord for 62° N | J-30-2026 (endret flere ganger i 2026) | Se 5.5. Stopp 16.4.2026 |
| Maskevidde i torskegarn | Maskeviddeforskriften (Lovdata 1989-10-10-1095) | Minst 156 mm nord for 62° N. Spillet selger 156, 180 og 200 mm |
| Fjordlinja og redskap | Høstingsforskriften kap. VI | Innenfor: høyst 80 torskegarn og 5 000 kroker, ikke snurrevad, ikke fartøy på 15 m eller mer. Håndheves når du setter redskap |
| Røkting | Høstingsforskriften kap. V | Garn og line for kveite og breiflabb minst hver 4. dag. Hvert fartøy røkter egne teiner |
| Trål | Høstingsforskriften kap. XIII | Forbudt innenfor 12 nm, med unntak. Ikke i spillet ennå |
| Tapt redskap | Fiskeridirektoratet, «Meld tapt redskap» | Meldes til Kystvakten med type, mengde og posisjon |
| Taskekrabbe | Høstingsforskriften kap. X; HI 2023–24; Råfisklaget rundskriv 8/2025 | Minst 13 cm skallbredde nord for 59°30'. Mye krabbe sør for Senja. Pris etter hann/hunn med hele klør (kronetallene ikke hentet) |
| Line | Store norske leksikon, «line» | Ca. 300 kroker per stamp bankline og 700 hyseline. Snøreline står 3–4 t, annen line over natta |
| Deltakelse | Deltakerforskriften 2025/2026 (Lovdata) | Eier med ≥ 50 % i båt i lukket gruppe gjør at andre båter ikke kan være i åpen gruppe. Eier med båt i åpen gruppe kan ikke ha flere der |
| Eier om bord | Fiskeridirektoratets høringsnotat 26.03.2026 | I åpen gruppe må eieren selv være høvedsmann om bord (unntak ved sykdom, graviditet med mer) |
| Én båt | NFD pressemelding 19.12.2025 | «Ein person, ein båt, ein kvote» |
| Bifangst uten adgang | J-30 § 35 | Høyst 10 % torsk, hyse og sei samlet per landing, og høyst 2 t torsk |
| Kveite | Høstingsforskriften § 39, 2026 | Fredet 20.12–20.4, 84 cm / 7,2 kg, slippes over 200 cm |
| Minstepriser | Råfisklaget, 21.09.2026 og rundskriv 7/2026 | Se `SPECIES.cls` |
| Priser og sesong | Råfisklaget, salgsstatistikk 2025 | Troms-sonen, fersk |
| Fiskere | Fiskerregisteret 2025 | 9 210 med fiske som hovedyrke og 1 115 med biyrke. Troms 963, 6 % kvinner, 24 % under 30 år |
| Kvotepris | Riksrevisjonen 2017 | 9-meters hjemmel rundt 1,8 mill. kr |
| Hviletid | Arbeidstidsreglene for fiskere | ≥ 10 t hvile per døgn og ≥ 77 t per uke (per uke ikke modellert) |

**Følg med på:**
- Arbeidsgruppens rapport om åpen gruppe fra 23.06.2026, som foreslår minstekvantum og aldersgrense 30 år.
- Høringen om kveiteregulering, som kan gi åpen gruppe for kveite for båter under 15 m.

## 7. Monetisering: prinsipper

- **Haill** er det eneste som selges for ekte penger nå. Senere kan det komme kosmetikk, et abonnement (bekvemmelighet, ikke mer fisk), nye regioner, lokale sponsorer og skolelisenser.
- **Kroner i spillet selges aldri for ekte penger.** Da ville pubhjulet blitt betalt pengespill.
- **Tilfeldige belønninger er alltid gratis,** og oddsen vises.
- **Ingen betaling** for å redde en rekke, og ingen kunstig ventetid som bare finnes for å selge snarveien.
- **Kvotene begrenser verdien av boostere.** Salget bygger på moro og tid spart.
- **Betaling krever egen server og brukerkontoer.** Kjøp kan ikke ligge i localStorage. Vipps er nesten et krav.

## 8. Engasjement: veikart

**Ferdig:**
- Innloggingsbonus (erstattet «Kaffe på kaia» 01.10.2026)
- Veiledningen «Første tur»
- Bestillinger
- «Neste mål»
- Pub og haill
- Mannskapssystemet

**Neste kandidater:**
- Fartstid som XP, med titlene dekksgutt → lettmatros → matros → skipper → reder
- Sertifikater for større båter
- Utmerkelser, artslogg og største fisk
- Trofé-fisk og tegn i sjøen, som måkeflokker og seistimer
- «Mens du var borte»-oppsummering
- Varsler og topplister når spillet får server (se «PWA og hele kysten (veikart)» i kapittel 9)

## 9. Flåteplanen

### Fase 1: Flåtemodell uten synlige endringer (ferdig)

Se 4.3.

Testet:
- Lagring og innlasting.
- Et gammelt lagret spill blir en flåte med én båt, og fem timers fravær ble spilt av som 1 800 spillminutter.
- Alle regresjonstester består.

### Fase 2: Flere båter (ferdig)

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

### Fase 3: Rederiappen (ferdig)

Flåteoversikt med status, posisjon, last, drivstoff, skipper, driftsplan og dagens inntekt. Varsler når en båt trenger deg. Velger for hvilken båt i Mannskap, Fartøy, Utstyr og Verksted.

### Havner, mottak og fortøyning (B1–B5, godkjent 29.09.2026)

Mottakene ligger der Jonas har funnet dem i Råfisklagets leveranseoversikt: Husøy, Senjahopen, Botnhamn, Gryllefjord, Sommarøy, Brensholmen, Torsken og Frovåg (Brødrene Karlsen Senja, avd. Frovåg). Finnsnes har ikke mottak eller is i virkeligheten, bare bøteri og forhandler av fiskeutstyr og båter. Bunkerskai: Husøy, Senjahopen, Gryllefjord, Botnhamn og Torsken, fra Jonas' satellittbilder. Finnsnes beholder drivstoff inntil videre (se åpne spørsmål).

1. **B1 Havnene (ferdig):** Åtte mottak. De fire nye (Sommarøy, Brensholmen, Torsken, Frovåg) ligger ved OpenStreetMap-kaia nærmest det største industribygget. Frovåg er funnet fra sjømerket «Frovåghamn» og veien Frovågneset. Is bare på mottakene, drivstoff i Finnsnes, Husøy, Senjahopen og Gryllefjord. Driftsplanen fyller bare det havna selger, og de nye mottakene legger ut bestillinger. Prisfaktorene for de nye (0,98–1,0) er anslag.
2. **B2 Fortøyning (ferdig):**
   - **Kaiene:** `src/js/core/07-harbours.js` har kaiene som bokser (`PIERBOX`), som 3D-visningen tegner, med dekket 2,4 m over middelvann (`QTOP`).
   - **Liggeplassen:** `berthPose(havn, type)` gir liggeplassen langs nærmeste kaifront med kaia på styrbord side. Fronten må være minst 2 m lengre enn båten.
   - **Kaifronten:** Den har dekk i kjetting, fenderbjelke, gul kant og pullerter.
   - **Å legge til:** Båten kommer inn i en bue og legger seg parallelt med kaia, og fenderne henges ut. Tauene settes i rekkefølgen akterspring, baugtamp, hekktamp og forspring.
   - **Tidevannet:** Tauene får lengden de hadde da de ble satt, så de slakkes og strammes med tidevannet.
   - **Å kaste loss:** Dette er tilstanden `unmooring` i simuleringen og tar `CAST_MIN` (2) spillminutter, mens tauene tas inn i omvendt rekkefølge.
   - **De ekte kaiene (29.09.2026):** Jonas merket mottakskai og bunkerskai på satellittbilder av Husøy, Senjahopen, Gryllefjord, Botnhamn, Torsken, Frovåg og Finnsnes. Bildene ble lagt over spillets kartdata (veier, kystlinje og bygg fra OpenStreetMap), og kaifrontene ble lagt på spillets kystlinje og flyttet ut forbi der den buler. De ligger i `QUAYS` i `07-harbours.js`, med `main` (der du lander) og `bunker`. Kaidekket bak fronten er 10 m (`QUAY_DEPTH`).
     - **Havnepunktene** ligger nå 6–18 m ut fra mottakskaia. Flyttet: Husøy (inn i indre havn, langs det lange mottaket på vestsida), Gryllefjord (til mottaket i øst, 430 m), Frovåg (til mottaket i sør, 250 m), Senjahopen, Botnhamn (nordveggen til Nord Senja Fisk), Torsken og Finnsnes (til kaia ved bøteriet sør for brua, 700 m nord for sentrum). Sommarøy og Brensholmen er ikke sjekket mot bilder.
     - **Innseiling:** `approachPath(havn)` finner veien fra åpent farvann inn til kaia gjennom sjøcellene i kartet og retter den ut der sikten er fri. Kartplotteren legger inn veien ut av havna og veien inn når du trykker på en havn (`exitWps` og `entryWps`). På Husøy går den inn gjennom moloåpningen i sør.
     - Simuleringen melder ikke grunnstøting på land innenfor 600 m fra en havn, bare på grunt vann. En rute rett over en molo blir derfor ikke stoppet, bare vist. Innseilingsveien er det som holder båtene i sjøen.
     - Jonas merket også slipp og verksted i Botnhamn (Botnhamn Sveis). Verkstedet i spillet er ikke knyttet til noen havn i dag.
3. **B3 Mottakene i 3D (ferdig):**
   - **Bygget:** Mottaket er det nærmeste store OpenStreetMap-bygget ved liggeplassen, og industribygg foretrekkes. Finnes det ikke noe, settes et eget bygg på nærmeste tørre land. Veggen mot kaia får port, baldakin og skilt med mottakets navn.
   - **Kaia:** Issilo på bein står der det er best avstand til kran og losseplass, med kort renne ut over liggeplassen. Kaia har gul kaikran, lysmaster som lyser om natta, og kassestabler og kar ved porten.
   - **Truck:** Kjører paller mellom stabelen og kaia.
   - **Arbeidere:** Fire i varselklær og hjelm. De kveiler tau ved pullertene, spyler og stabler kasser, feier og tar kaffepause. Mellom 22 og 06 er bare vakta der.
   - **Ytelse:** Bare mottaket nærmest kameraet animeres. Koden ligger i `view3d.js` under «fish plants» (`plantLayout`, `buildPlants`, `drawPlant`).
4. **B4 Levering (ferdig):**
   - **Tid:** Leveringen tar spilltid. Klargjøring 5 min, 2,5 min per kranløft og 5 min til innveiing og sluttseddel (`LANDING` i `07-harbours.js`). Tallene er anslag.
   - **Kasser og kar:** Skiff og snekke lander i kasser på 40 kg fisk, ni per løft. Sjarkene lander i kar på 300 kg, ett per løft.
   - **Eksempler:** En skiff med 300 kg tar 12,5 min, en snekke med 900 kg 17,5 min, en sjark med 2,5 t 32,5 min og en ny sjark med 6 t 60 min.
   - **Salget:** Salget (`sell()`) gjøres når sluttseddelen kommer, på det som er i lasten da. Avgang som settes under lossingen, venter til den er ferdig. Driftsplanen lander på samme måte, og rapporten kommer med sluttseddelen (`opsReport`).
   - **Is:** Is renner fra isrenna med rundt 100 kg i minuttet (`b.iceUntil`, bare for 3D).
   - **I 3D** (`landScene` i `view3d.js`) følger alt den samme tidslinja, så siste last er på kaia når sluttseddelen kommer:
     - **Lasten:** Den står på dekk, på paller med kasser eller i kar. Sjarken har plass til fire kar på dekk, og resten ligger i lasterommet.
     - **Kranen:** Den svinger ut, senker kroken til lasten, løfter og svinger inn, og setter lasten på losseplassen. Annenhver last stables oppå den forrige.
     - **Trucken:** Den henter to laster om gangen og kjører dem inn porten. Farten settes slik at en tur tar høyst to løft (1,9–4,6 spillminutter i de åtte mottakene).
     - **Folka:** Én gir tegn ved kaikanten, én tar imot lasten og hekter av, én teller ved porten og én kjører kranen med fjernkontroll. Alle møter opp, også om natta. Når noen må til en ny plass, går de dit. Trucken kjører.
     - **Isen:** Den renner fra isrenna ned i båten mens isen fylles.
   - **Ikke med ennå:** Andre båter i flåten og lokalflåten lander uten animasjon. Egne båter vises ikke i 3D før fase 4.
5. **B5 Bunkring (ferdig):**
   - **Forhaling:** Der havna har egen bunkerskai, betyr «Fyll drivstoff» at båten kaster loss fra mottakskaia, går bort og fortøyer ved bunkerskaia (`startShift`, rundt 3 knop). Vil du levere derfra, går den tilbake til mottakskaia først. Isen kommer fra isrenna ved mottaket. Står båten ved bunkerskaia, går den derfor tilbake før du kan kjøpe is. Finnsnes fyller der båten ligger.
   - **Pumpa:** Omtrent 45 L/min bensin og 90 L/min diesel (`PUMP`, anslag), pluss 1,5 min for å få slangen ut og 1 min for å legge den på plass. Du betaler etter hvert som det renner inn. En skiff fyller 80 L på litt over 4 min, en sjark 500 L på rundt 8 min.
   - **Venting:** Avgang og driftsplan venter mens båten losser, forhaler eller fyller (`portBusy`). Driftsplanen fyller ved bunkerskaia etter lossingen, og rapporten sier det.
   - **I 3D:** Bunkersanlegget har tank i betongkar, pumpe med teller, slangetrommel og «BUNKERS»-skilt, i de fem bunkershavnene og i Finnsnes. Forhalingen følger spilltida: tauene tas inn, båten går over, tauene settes. En person fra båten står ved kaikanten med pistolen i fylleåpningen, og telleren går.

### Overtro som kultur (O, ferdig 29.09.2026)

Sjøfolk og fiskere har alltid vært overtroiske. Overtroen er bare lore i spillet og påvirker ikke fangst, vær eller humøret om bord. Alt ligger i `src/js/core/08-lore.js` (`LORE`).
- **Innhold:** noaord (høghus for kirke, svartkjole for prest, hest og gris nevnes ikke), ikke plystre om bord, aldri ut på en fredag, ikke ønske god tur, snu er dårlig fiskelykke, å møte presten, brunost, vafler og bananer, kost og bøtte over bord, mastemynten, omdøping av båt, draugen og troen på at kvinner om bord brakte ulykke. Den siste fortelles som noe puben ler av.
- **Når det dukker opp:**
  - avgang på en fredag
  - av og til ved avgang, med folk på kaia og presten på veien
  - når du snur og går hjem
  - når dere tar inn sjø
  - når du gir båten nytt navn
  - når verftet leverer en ny båt (mastemynten)
  - omtrent hver 30. time på sjøen med mannskap
  - draugen om natta i dårlig sikt
  - pubrunden, der seks av ti tomme kvelder blir en fortelling
- **Hvem forteller:** Den eldste om bord, folk på kaia, verftet eller puben forteller. Det blir en melding og en linje i dekksdagboka. Samme fortelling kommer ikke igjen innen tre døgn.
- **Appen «Sjømann»** viser det du har hørt under «Fra gamle dager», og resten som ukjent.
- **Kilder:** Store norske leksikon (noaord, draug), Redningsselskapet «Ikke ta med brunost på havet!», Båtmagasinet «Om tro og overtro til sjøs», Norsk Fisk «Overtro», NRK om mastemynten og en forumtråd om omdøping (svakt belegg). «Snu med sola» og «måker er druknede sjøfolk» ble tatt ut fordi jeg ikke fant belegg.

### Sjømannstatoveringer (T, ferdig 29.09.2026)

Tatoveringene er belønninger som kommer av seg selv, med en melding når du har gjort deg fortjent til en. Appen «Sjømann» viser dem på en figur, og kortene under viser betydning, krav og hvor langt du har kommet. Bare det du gjør selv om bord, teller. Alt ligger i `src/js/core/09-tattoos.js` (`TATS`, tellerne i `S.tat`, tatoveringene i `S.tattoos`).

| Tatovering | Plass | Krav |
|---|---|---|
| Svale og svale nummer to | Brystet | 5000 og 10 000 nautiske mil med deg om bord |
| Nautisk stjerne | Skulderen | 100 turer hjem uten grunnstøting eller slep |
| Tau rundt håndleddet | Håndleddet | 100 timer eget arbeid på dekk: sløying, ising og fiske for hånd |
| Kryssede ankere | Mellom tommel og pekefinger | 50 turer som skipper med fullt mannskap |
| Harpun | Underarmen | Et rederi med tre båter |
| Gris og hane | Fotbladene | Reddet etter grunnstøting, motorstopp eller drift |
| Kniv gjennom rose | Leggen | Samme mann om bord i ett år, eller 50 leveranser til samme mottak |
| Anker, skilpadde, hulajente, Kong Neptun | Skulderen, håndbaken, overarmen og leggen | Låst. Krever Atlanterhavet, ekvator og Hawaii, altså farvann utenfor Senja. |

- **Tegningene** ligger i `src/js/ui/05-tattoo-art.js` (`TATART`). Stilen er strektegning i marineblått blekk på kremfarget papir, etter de gamle flash-arkene. En sjømann med sjømannslue og bart sitter på en pullert med en taukveil ved føttene. Tatoveringer du har fått, er tatovert på ham. Resten vises som svake sjablonger, og de låste er svakest. `AT` bestemmer plassen til hver tatovering på figuren. `icon(id, fått)` gir tegningen til kortene. Figuren var først en enkel strekfigur, men brukeren ville ha den profesjonell, etter et referansebilde av en tatovert sjømann. Den ble tegnet om 29.09.2026.

- **Tempo:** En fiskedag er 20–40 nm, så den første svalen kommer etter 150–250 fiskedager. Tallene justeres i spilltesting.
- **Kilder for betydningene:** US Navy History «Sailors' Tattoos», One Ocean Expedition om svalen og The Bermudian «Vintage Sailor Tattoos and Their Meanings».

### Redskap i sjøen: garn, line og teiner (R1–R7, ferdig 30.09.2026)

Jonas' valg: alle tre kystredskapene i samme runde, ståtid for line som avveiing, ekte krabberegler, og egning både i egnebua og av mannskapet. Snurrevad, trål og ringnot kommer senere med større båter, lisenser og nye farvann (12 nm fra grunnlinja ligger utenfor kartet).

- **Filer:**
  - `src/js/core/10-gear.js`: redskapstabellene, kjøp, regler, setting og trekking, ståtid, vær, bøting, egning og driftsplanens stasjoner.
  - `src/js/ui/10-gear-ui.js`: fiskepanelet, blåsene i kartet og redskapsvalget i ruta. Knappene for redskap ligger i knappelinja (5.17), og «Sett ut» tegnes i kartet (`ui/03d-setmode.js`).
  - Telefonappen «Redskap» ligger i `05-phone.js`, og 3D-delen i `view3d.js` (`buildGear`, `drawGearSea`, `drawGearOp`).
- **Tilstand:**
  - `S.pgear` er per båt (i `VKEYS`): garnlenker `{id, mesh, n, cond}`, stamper `{n, baited}` per linetype, teiner per størrelse, agn i kg, blåsesett og det som ligger på land (egnebu, bøteri).
  - `S.sets` er for hele rederiet: redskap i sjøen `{id, vid, kind, a, b, n, tSet, acc, dead, lost, heavy, …}`, slik at kartet og 3D tegner alle båtenes blåser.
  - `S.cstk` er et eget bestandslag for krabbe.
- **Arbeidet på sjøen:** Setting og trekking er `b.gop` under status `fishing`, så sløying, hvileregler, automatisk retur og pausen når bløggekaret er fullt virker som før. Båten går langs strengen mens den setter eller trekker.
  - Setting tar ca. 0,8 min per garn, 5 min per stamp og 0,9 min per teine.
  - Trekking tar ca. 4 min per garn, 25 min per stamp hyseline og 1,2 min per teine med haler.
  - Mannskapet og ferdighetene (`gear.garn`, `gear.line`, `gear.teiner`) gjør det raskere.
- **Ståtid** (`soakHour`, hver time):
  - *Line:* agnet vaskes ut (τ 10 t), krokene fylles, og marfloen tar 7 %/t etter 20–28 t. Fisken lever de første 5 timene (E-kvalitet og krokpremie), så faller friskheten.
  - *Garn:* fyller seg, og fisken dør i garnet. Friskheten starter på 84 og faller raskere i varmt vann (`SST`). Maskevidden styrer størrelsen (lengde ≈ 0,40 × maske).
  - *Teiner:* halve fangsten etter ca. 20 t, og krabben dør etter 48 t.
  - Selektiviteten per redskap og art står i `SELQ`.
- **Vær og røkting:**
  - Tap og skade per time øker kraftig over 2,5 m sjø. Tung dregg holder bedre.
  - Etter to døgn kommer et varsel, og etter fire døgn en påminnelse fra Fiskeridirektoratet.
  - Tapt redskap gir melding og varsel til du melder det.
- **Slitasje og bøting:**
  - Garna slites ca. 5 % per trekk, mer med stor fangst, krabbe og sjø. Under 25 % går de i filler.
  - Du bøter selv i havn (en jobb), eller leverer til bøteriet i Finnsnes (180 kr per garn per 10 %, klart etter et døgn).
- **Egning:**
  - Egnebua ved mottakene (antatt) tar 500 kr per stamp hyseline og 300 for bankline, pluss agn, og er klar etter 3 t pluss 20 min per stamp.
  - Egen egning går med ca. 560 kroker per time per person.
- **Krabbe:**
  - Holdes levende, sløyes ikke og ises ikke.
  - Sorteres ved trekking. «Sorter nøye» sender småkrabbe og rognkrabbe ut igjen.
  - Slurv gir inndragning og gebyr (2 000 kr + 100 kr per krabbe, plassholder), og 10 % trekk for rognkrabbe.
  - Krabbe har ingen kvote og teller ikke i ferskfiskordningen (antakelse).
- **Driftsplan:** Et veipunkt med redskap blir en stasjon: trekk og sett ut igjen langs samme strek, sett nytt om ingenting står der, og ta alt med hjem ved kuling innen 36 t.
  - Garn krever to om bord.
  - Line går til egnebua etter levering.
  - Teiner er en lovlig inntekt for en båt i åpen gruppe med ansatt skipper.
- **Kalibrering (startverdier):**
  - Hyseline 12 t i februar på et godt hysested: ca. 110 kg per stamp, 67 % hyse.
  - Garn 180 mm 20 t i mars vest av Gryllefjord: ca. 30 kg per garn.
  - Store teiner 24 t i september sør på Senja: ca. 1,5 kg per teine.
  - En dag med håndjuksa samme sted: ca. 430 kg for én person.
- **Priser (startverdier):** garn 1 500 kr, stamp hyseline 2 100 og bankline 1 700, teine 550/850, blåsesett 2 500, tung dregg 1 500, agn 18 kr/kg.

### PWA og hele kysten (veikart, 30.09.2026)

Jonas diskuterte med en annen AI-modell om å gjøre spillet til en PWA og utvide det til hele kysten fra Grense Jakobselv til Nordmøre. Vurderingen ble lagret som veikart. **Ingenting er bygget.** Hver fase krever eget klarsignal.

- **Valgt:** Hosting blir GitHub Pages når det er aktuelt. PWA-bygget kan ha flere filer (manifest, service worker, ikoner, kartsoner), men artifacten forblir én fil.
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
  - **P1, PWA-skall uten server:**
    - `dist-pwa/` med `index.html`, `manifest.webmanifest`, `sw.js` og ikoner
    - eksport og import av lagret spill, fordi artifacten og PWA-en har ulike domener
    - `navigator.storage.persist()`
    - test av offline
  - **P2, liten server:**
    - innlogging (Vipps eller e-post), skylagring og synk
    - push ved ETA: klienten regner ut tidspunktet, serveren sender varselet
    - betaling for haill (kap. 7)
  - **P3, flerspiller:** Serveren kontrollerer sluttsedler, slik at topplistene og det felles markedet ikke kan jukses.
  - **P4, nye regioner i soner:** Soner etter **Norges Råfisklags ni soner** (sone 1 Øst-Finnmark til sone 9 Nordmøre, som er nettopp Råfisklagets område). Hver sone får egne mottak, fjordlinjer, fangstfelt og regler med kildesjekk. Kongekrabbe i kvoteområdet øst for 26° Ø.
- **Tone:** Engasjementet skal komme av god fisking, med nyttige varsler som spilleren velger selv. Uttrykk som «avhengighetsskapende», «null frafall» og «instant dopamin» strider mot prinsippene i kapittel 7, og Forbrukerrådet og EU følger manipulerende design i spill.
- **Kilder:**
  - WebKit, «Updates to Storage Policy»
  - MDN, «Storage quotas and eviction criteria» og «Periodic Background Synchronization API»
  - TechCrunch 1.3.2024 om Apples reversering
  - Norges Råfisklag, «Om Norges Råfisklag»

### Etter spilltest 1 (F1–F10, godkjent 30.09.2026, bygget 01.10.2026)

Rapporten fra den blinde spilltesten ga ti faser. Jonas bestemte: veiledningen er obligatorisk, juksamaskinen gir 2 × håndjuksa, «Kaffe på kaia» byttes med en innloggingsbonus på +1 % per dag uten tak og −3 % per tapt dag, puben og haill blir værende og introduseres tidlig, og neste spilltest er en lengre økt fra start.

1. **F1 Kritiske feil:** haleren som låste båten (A1, `FIT_H` i `06-services.js` med `fitHours` og `jobOk`), pubkvelden 15–03 (A3), pubhjulet som tapte premien ved omlasting (A4), oddslinja med «tomhendt 53 %» (A15), og testnøkkelen `#notut`.
2. **F2 Juksamaskinen:** `JIG = {rod:0.35, hand:1, machine:2.0, perPerson:3}` og én felles `effortOf()`, også for driftsplanen.
3. **F3 Innloggingsbonus** i stedet for «Kaffe på kaia» (5.9). Fiskekar og rengjort bunn er fjernet.
4. **F4 Tiden:** tekstene sier seks ganger så fort, tempovalgene viser 6×, 180×, 1 800× og 10 800×, nedtelling i ekte tid og «Neste»-brikka (4.2).
5. **F5 Butikken og pengesporet:** «Fiskeutstyr» (5.1), sluttseddelen som summerer seg (A7, 5.4), minstepriser med to desimaler (A8), status som ikke ser ut som knapper (A9), Gisundet-tipset bare i Finnsnes (A10), kameraet utenfor kaier, bruer og bygg (A11) og det ubrukte blødningsvalget fjernet (A13).
6. **F6 Rute-editoren** og **F7 «Følg leia»** (5.15), med A12.
7. **F8 «Første tur»** (5.16).
8. **F9** dokumentasjon og full regresjon. **F10** spilltest 2.

Åpne punkter jeg avgjorde (kan overstyres): bonusen starter på 0 for eldre lagringer, «Fiskeutstyr» finnes i alle havner, «Neste»-brikka gjelder båten du ser på, og sidepanelet i plotteren er 340 px.

### Fase 4: Flåten i kart og 3D

Egne båter vises med egne symboler i kartplotteren, og du kan trykke for å følge. Båter i nærheten vises i 3D.

### Fase 5: Rapport og nøkkeltall

«Mens du var borte» per båt, og lønnsomhet per båt og for rederiet.

### Senere

Større fartøyklasser, snurrevad, trål og ringnot (med lisenser, sonar og farvann utenfor 12 nm), egne anlegg og nye regioner. For PWA, server og hele kysten, se «PWA og hele kysten (veikart)».

## 10. Kjente problemer og åpne spørsmål

- **Blind spilltest 1 (30.09.2026):** Se `docs/playtest/rapport-1.md`. Feilene A1–A13 og A15 er rettet 01.10.2026 (`fixtest.py`, `shoptest.py`, `camtest.py`, `routetest.py`). A14 (ryktekoppen) forsvant med «Kaffe på kaia». Åpent fra rapporten:
  - Lånet overlever salg av båten, og hvert nytt lån starter 120 nye måneder.
  - Fangstfeltene har liten vekt i kartet.
  - En skipper på driftsplan kjøper ikke sekkeis i Finnsnes. Bare mottakene fyller is på driftsplanen.
  - Kameraet holdes unna kaier, bruer, fyr, siloer, kraner og bygninger, men ikke andre båter eller kranarmen.
  - Laster man siden på nytt rett etter en endring, kan Chrome lese en lagring som er noen sekunder gammel (localStorage skrives med forsinkelse). Sett i testmiljøet, ikke kontrollert på nettbrett. Det koster i så fall bare de siste sekundene.

- **Blind spilltest 2 (01.10.2026):** Se `docs/playtest/rapport-2.md`. Starten og ruteplanleggingen virker, og agenten kjøpte juksamaskin og ansatte mannskap. Åpent fra rapporten, i prioritert rekkefølge:
  - Fangsten er uforklart, og den garanterte første turen (175 kg/t) gir feil forventning.
  - Havna man startet fra kan ikke velges som sluttpunkt. Trykket på navneskiltet gir «Det er land», og et trykk nær havnepunktet tar utseilingspunktet.
  - Fartsglideren i rutepanelet fanger sveip.
  - Planleggeren viser ikke bølger langs ruta.
  - Innloggingsbonusen forklarer ikke at den gjelder ekte dager.
  - Reglene når ikke fram uten at spilleren leter dem opp.

- **Varmekartet, åpne punkter:**
  - Fangsten for fraværstida (`catchUp` i `11-boot.js`) regnes før dybdedataene er lastet. Da brukes den grove dybdemodellen, og på de tre ytre feltene blir fraværsfangsten bare 42–60 % av det den skulle vært. Ikke rettet: det endrer balansen og må avgjøres først.
  - Sonarens pris (150 000 kr) og monteringstid (16 t) er antakelser.
  - Bare skiffen har konsoll i 3D, så de andre båtene viser ikke ekkolodd eller varme i 3D.
  - Utstyr som ikke passer en ny båt, forsvinner ved båtbytte uten refusjon (som før). Teksten i Utstyr-appen sier det nå.

- **Redskap, åpne punkter:**
  - Minsteprisene for taskekrabbe (Råfisklaget, rundskriv 8/2025) er ikke hentet, fordi siden er blokkert herfra. Hunn 17 og hann 14 kr/kg er plassholdere.
  - Hvilke havner som har egnebu, og hva egning koster, er antakelser.
  - Gebyret for småkrabbe er en plassholder.
  - Kvotetillegg for landegnet line er ikke bekreftet og ikke bygget inn.
  - NPC-båtene har ikke egne blåser ennå.

- **Garantert torsk for 8–9,99 m:** 4,2 t i forskriften og 3,2 t i departementets rapport. Spillet bruker forskriften.
- **Minstepriser for andre arter etter 21.09:** Rundskriv 13/2026 er ikke hentet, så lyr og de andre bygger på rundskriv 7/2026.
- **Farten i 3D:** Med tempo 1:6 går båten seks ganger raskere enn virkeligheten. Bevegelsen er jevn, men farten ser høy ut.
- **`S.owned`** er en liste over båttyper fra før flåtemodellen. «Neste mål» bruker nå typene i flåten, men lista finnes fortsatt.
- **Kveithaill** kan gi rundt 8 000 kr per dag ved kveitefiske om høsten. Sjekk balansen i spilltesting.
- **Klær og kulde:** `coldPen` bruker hele mannskapet (`S.crew.length`), ikke bare dem som er om bord.
- **Sløyetid:** 300 kg per person og time for sløying og 800 for ising er anslag. Jeg fant ingen god kilde for håndsløying av torsk, så tallene må justeres i spilltesting.
- **Kvote ved bytte av båt i åpen gruppe:** Kvotebruken ligger per båt. Selger du båten i åpen gruppe midt i året, får neste båt en ubrukt kvote. I virkeligheten følger det du har fisket med når du bytter fartøy.
- **Driftsplan i åpen gruppe:** En skiff på driftsplan uten kveiteutstyr leverer nesten bare fisk som blir inndratt, fordi torsk, hyse og sei er over bifangstgrensen. Det er etter reglene, men spilleren bør få et tydeligere råd om å kjøpe kveiteutstyr.
- **Drivstoff i Finnsnes:** Bildene viser bare bøteri og utstyrsforhandler i Finnsnes. Jonas vil at Finnsnes selger drivstoff inntil videre (29.09.2026), fra kaia båten ligger ved.
- **Bifangstregelen** (10 % per landing og 2 tonn torsk i året) er tatt fra designet i fase 2 og ikke kontrollert på nytt mot J-30-2026 § 35.

## 11. Testing

- **Verktøy:** Playwright med Chromium og SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). Testene finner spillet via `tests/_env.py` (`GAME` med `#notut`, `GAME_TUT` uten).
- **Regresjon:**
  - `trip2.py`: hel tur via kartplotter, avgang, 3D, fiske og havn.
  - `tut.py`: veiledningen «Første tur», spilt gjennom med berøring som en spiller, liggende og stående, med tre omlastinger. Skal ende med `"tut": 0`.
  - `dbg23o.py`: ingen WebGL-feil.
- **Funksjonstester**, blant andre:
  - `selltest.py`: salg, kvote, ferskfisk og sløying.
  - `simday.py` og `kvtest.py`: kalibrering av fangst.
  - `ordtest.py`: bestillinger, klær og kulde.
  - `streaktest.py`: innloggingsbonusen, med flyttet dato.
  - `fixtest.py`: feilrettingene etter spilltest 1 (haleren, pubkvelden, pubhjulet).
  - `timetest.py`: tidstekstene, nedtelling i ekte tid og «Neste»-brikka.
  - `shoptest.py`: Fiskeutstyr, sekkeis og isrenne, «Neste mål», sluttseddelen som summerer seg, og A8–A13.
  - `docktest.py`: knappelinja, viftene, skuffen og «Sett ut» med berøring, liggende og stående. Knappene i havn og på sjøen, grå knapper som sier hvorfor, kjøp i skuffen, de ti appene, linjelengden i kartet (±2 px), dra i enden, setting langs linja, avbrutt setting, og «Ta opp» 50 m fra blåsa.
  - `camtest.py`: kameraet holdes utenfor kaier, kraner og bropilarer.
  - `routetest.py`: rute-editoren med berøring (WP-navn, kort, angre, dra, sett inn, A12) og «Følg leia».
  - `heattest.py`: fiskemodellen og varmekartet. Bestanden (nedtrekk på fire ruter, gjenvekst helt tilbake), hotspotene som trekker, stimene, skreiflekken på første tur, radius per trinn, varmen ved båten = 30·Σdensity, av og på, artsvalget, avlesningen, ettergløden, sonaren som utstyr, konsollen i 3D og ytelsen med CPU-en struping fire ganger (`Emulation.setCPUThrottlingRate`, en stand-in for nettbrettet). Skjermbilder i `tests/out/heat_*.png`.
  - `hailltest.py` og `luck2.py`: haill og pub.
  - `crewtest.py`: mannskap.
  - `motion2.py`: båtbevegelse, frakoblet med 60 bilder i sekundet.
  - `berthtest.py`: kaiplasser og trykk i kartplotteren.
  - `fleet1test.py` og `fleet1mig.py`: flåtemodell og migrering.
  - `moortest.py`: fortøyning og mottakene i 3D. Liggeplass i alle havner, å legge til med tauene og å kaste loss.
  - `harbourtest.py`: havnene. Mottak, is og drivstoff per havn. De ekte kaiene: alle båttyper ligger langs kaifronten i sjøen i 3D-kystlinja, og ruta inn og ut av hver havn går fri av land.
  - `tattest.py`: tatoveringene. Nautiske mil og trygge turer bare med deg om bord, grunnstøting og slep, alle kravene, de låste og appen.
  - `loretest.py`: overtroen. Fredagsavreise, at samme fortelling ikke gjentas, omdøping, mastemynt, fortellinger på sjøen og på puben, uendret humør og appen «Sjømann».
  - `decktest.py`: arbeidet på dekk. Bløggekaret, sløyefart, stopp når karet er fullt, én mann mot to, «ta unna før du går» og kvalitetstapet.
  - `geartest.py`: redskap i sjøen. Den har 27 sjekker:
    - kjøp i Redskap-appen etter plassen om bord
    - to om bord for garn, og grensene innenfor fjordlinja
    - strengen mellom blåsene
    - ståtidskurvene for line, garn og teiner, og maskevidden
    - trekking inn i dekksarbeidet
    - krabbesortering med gebyr og trekk
    - tap i storm og melding til Kystvakten
    - påminnelser, slitasje, bøting og egning
    - driftsplanens stasjoner
    - lagring, blåser i kartet og 3D
    - kalibreringen

    `Math.random` er seedet, så kjøringene gjentar seg.
  - `bunkertest.py`: bunkringen. Forhaling til bunkerskaia og tilbake, pumpefart og betaling, avgang som venter, Finnsnes, og i 3D stasjonene, forhalingen og telleren.
  - `landtest.py`: leveringen. Lossetid, kasser og kar, avgang som venter, isrenna, og i 3D at kroken står over lasten på dekk og over losseplassen og at trucken rekker siste tur.
  - `fleet3test.py`: fase 3. Varsler, båtvelgeren, inntekt per båt og service per båt.
  - `fleet2test.py`: fase 2. Levering med og uten adgang, to båter på driftsplan i en simulert uke, knappene i Fartøy-appen, nybygg til flåten, og lagring med to båter. Skriver `OK` eller `FEIL` per sjekk.
  - `opsowntest.py`: driftsplan med deg om bord. Turen er din, torsken går på kvoten, ingenting blir inndratt, ingen kveiteomlegging og ikke noe skippertillegg. Skipperen alene gir de gamle reglene. Sjekker også at lagrede planturer rettes ved oppstart. Velger selv en rolig dag, fordi planen blir på land i for mye sjø.
- **Triks:**
  - Testmaskinen gir få bilder i sekundet, og `dt` begrenses til 0,1 s. Test dynamikk frakoblet med `G3._debug.stepBoat`.
  - Spillet lagrer seg selv når siden lukkes. For å teste gamle lagrede spill: legg dem inn med `context.add_init_script` i en ny nettleserøkt.
  - Nyttige verktøy: `G3._debug` (cam, bv, SK, TRAIL, stepBoat, eye, camInside, camFree), `ROD._strike/_prog`, `PUBW.open`, `PHONE.open(app)`, `mapToClient(p)`, `leiaRoute(a, b, aPort, bPort)`, `tutStep()`, `tutRect()`.
  - Berøring og drag i kartet: send `Input.dispatchTouchEvent` via CDP, og start Chromium med `--disable-gpu-compositing`. Med SwiftShader-komposisjon tegner plotteren rundt ett bilde i sekundet, og hvert fingerflytt venter på et bilde.
  - Kjør ikke mange 3D-tester samtidig. Da kan klikk og skjermbilder gå ut på tid.
  - Chrome skriver localStorage til disk med forsinkelse, og en file://-side som lastes på nytt med en gang, kan lese gamle verdier. Skal en test sende noe over en omlasting (datoforskyvning, en lagring), bruk `window.name`, som `streaktest.py` gjør.
  - Klikk telefonknapper med `document.querySelector('[data-pa=...]').click()`. Sidene i skuffen ligger i `#drawerBody`.
  - Playwrights `tap` venter på et stille bilde, og 3D blir aldri stille. Bruk CDP-berøring som i `tut.py` og `docktest.py`.
  - Test effekter med bestanden nullstilt (`S.stock = initStock()`) mellom kjøringer, ellers tømmer den første kjøringen feltet.

## 12. Innhold i overleveringspakken

- `OVERLEVERING.md` (dette dokumentet) og `README.md`.
- `kystfiske-prototype.html`: siste publiserte versjon (fase 1).
- `tests/`: alle testskriptene.
- `scripts/`: alle oppdateringsskriptene fra chatten (`patch_*.py` og lignende), som historikk for hvordan funksjonene ble bygget.
- `data/processed/`: behandlede datafiler (base64 og json) som er bakt inn i HTML-fila.
- `data/osm2/`: råkilder fra OpenStreetMap for kart.
- `transcripts/`: fullstendige utskrifter av de fire tidligere chatøktene og `journal.txt`, med hele historikken før denne økta.

Kartrastere i `.npy`-format (over 300 MB) er ikke med. De kan lages på nytt fra OpenStreetMap-kildene, og resultatet ligger allerede i HTML-fila.
