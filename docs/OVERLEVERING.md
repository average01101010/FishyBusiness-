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

**Fartøystigen (bygget 01.10.2026, ikke publisert ennå):** 14 båttyper fra skiffen til havfiskeflåten med fullt datablad, 3D-modeller fra et byggesett (`vessel3d.js`), Båthandelen med faner, sideriss og visning i 3D, blad B, lån som innfris ved salg, toppfinansiering fra Innovasjon Norge og stigen i «Neste mål». NPC-flåten bruker de samme modellene. Se «Fartøystigen» i kapittel 9.

**Publisert 03.10.2026 (artifactversjon 64):**
- alt over
- kystplanens K1–K10: hele kysten med detalj i 3D og sjøkart, Autonav overalt, og tidevann og sol der båten er
- UI-runden for kartplotteren og 3D (5.15)
- «Fyll tanken» i Admin

Siden og 425 kartfiler (195 MB) gikk ut i fire publiseringer. Levering og bunkring finnes fortsatt bare i Senja-havnene.

**Publisert 03.10.2026 (artifactversjon 68):**
- alt over
- rettingene etter spilltesten 03.10.2026: Husøy, ytelse i 3D, kartplotteren i fliser, bro-visningen og stille sjø
- Kartverkets dybde langs hele kysten (kart-4, 4.8b)
- søvn på den felles klokka, brovaktsalarm og manuell styring (5.19, 5.22)
- lys om natta, kino, lyd, måker og halerne fra Blender (5.23–5.26)

Siden og 424 kartpakker (230 MB, 321 nye) gikk ut i fire publiseringer, med de 321 gamle fjernet. Regresjonen var grønn, unntatt to tester som feilet på testens egen venting og tidsgrense: `sea3d` og `vessel3d`. Begge er rettet i testene etterpå.

**Neste:** rettingene etter spilltest 2, med prioritet i rapportens siste del. Deretter K11 (nettstedet og PWA) og innholdet sone for sone, hver med eget klarsignal, og fase 4 i flåteplanen.

## 4. Teknisk arkitektur

### 4.1 Én fil, flere lag

1. **Kjerne:** simulering, tilstand `S`, arter, priser, kvoter og regler.
2. **UI:** HUD, knappelinja `#dock` med skuffen `#drawer` (`ui/10c-dock.js`), panel, telefonen `PHONE` med apper, overlays (`PUBW`, `ROD`), rute-editoren (`ui/03b-route.js`) og veiledningen «Første tur» (`ui/07b-first-trip.js`). Autoruta ligger i kjernen (`core/11-route.js`).
3. **3D:** `G3`, en egen WebGL-renderer for sjø, terreng, båter og effekter. Kartplotteren er Canvas2D og SVG.
4. **Data:**
   - Rasterkartene (land, dybde, avstand til land, eksponering, høyde og skog) ligger i kartpakker i `dist/map/`, som spillet henter (4.6).
   - Resten er base64-blobber i `<script type="application/octet-stream">`, blant annet vei, bygg, fin kyst og båtmodellene.

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

### 4.5 Rammen, projeksjonen og presisjonen (kystplanen, fase K2 og K4, 02.10.2026)

Forberedelser til hele kysten (planen står i `docs/kart/`). Fra K4 er spillets ramme den nasjonale UTM 33-rammen (4.7).

- **Projeksjonen** (`core/00-proj.js`, første fil i det felles skriptet, med `'use strict'`):
  - `utm33(lat, lon)` gir `{E, N, gamma, k}` og `utm33inv(E, N)` går tilbake. Krüger/Karney med sjette ordens rekker. Avviket mot PROJ (EPSG:25833) er 0,006 mm fra Utsira til Grense Jakobselv (`projtest.py`, referansen fra `tools/map/projref.py`).
  - `gamma` er meridiankonvergensen: sann kurs = rutenettskurs + γ.
  - `natP`/`natLL` er den nasjonale rammen i km: x = (E + 250 km)/1000, y = (8 050 km − N)/1000. Fra K4 er dette spillets ramme: `P`/`LL` i `01-world.js` er `natP`/`natLL`.
- **`gridKey(ix, iy)`** er nøkkelen for rutenettsceller, med `gridKeyX`/`gridKeyY` tilbake. Den tåler 2²⁰ celler hver vei og negative tall. Strøklengdebufferet, varmekartet, 3D-bitene og kamerakollisjonen bruker den.
- **Den gamle rammen** (`01-world.js`):
  - Senja-dataene og det håndplasserte innholdet er laget i den gamle rammen: flat ved 69,35° N, km fra 69,72° N 16,55° Ø.
  - `LG(x, y)`, `LGa([x, y])` og `LGm([x, z] i meter)` fører dem inn i spillets ramme med den eksakte projeksjonen, og `LGI(p)` fører tilbake.
  - `LGu(o, u)` dreier en retning, og `LGrot(x, y)` er vinkelen rammen dreies med (omtrent −γ).
  - I K2 var dette en ren forskyvning, `FR`, og torturtesten (`#frameshift`, `KYST_SHIFT=1`) flyttet rammen 1 000 km. Begge er borte i K4, fordi spillet nå ligger 810–892 km øst og 311–397 km sør for origo.
- **Oppstartsbarrieren** (`11-boot.js`): klokka og catch-up venter på `SIMREADY`, som settes når kartpakkene båtene trenger er lastet (4.6). `boottest.py` tester det.
- **Presisjon i 3D** (`view3d.js`):
  - Meshene i verden har hjørnene relativt til sitt eget origo `m.o` (`MB().mesh(o)`, `NB().mesh(o)`, `makeMesh`, `unitPatch`, bitene på 1 km og lysene deres). Modellmatrisen `relM(m)` er origo minus øye, regnet i doble tall.
  - Skyggerne regner verden fra gjengivelsesorigoet `RO`, et multiplum av 4 096 m nær øyet som flyttes først etter 40 km. Det gjelder:
    - bølgefasene og gruppefasene (`uGp`), regnet i doble tall per bølge
    - havets origo og sjøtilstandsrutene
    - kjølvannet
    - terrengets teksturkoordinater (`uPO`)
  - Bygg, fin kyst, veier, sjørokk og kjølvannets hekk lagres i Float64.
  - Uten dette blir Float32 6–12 cm grov 1 000 km fra origo, og bølgefasen går i stykker.
- **Bygget** (`build.mjs`) kompilerer hvert skript som helhet med `node:vm`, så et navn som er deklarert i to filer stopper bygget, ikke siden.

### 4.6 Kartdataene i pakker (kystplanen, fase K3, 02.10.2026)

Rasterkartene ligger ikke lenger i siden. Siden gikk fra 9,3 til 6,2 MB, og kartpakkene er 3,3 MB (2,8 MB i K3, før rammen ble 90 × 90 km i K4).

- **Bygget:** `node build.mjs` kaller `writeMap` i `tools/mappack.mjs`.
  - Den leser `src/data/geo-*.b64` og `hgt.b64` og pakker dem ut slik siden gjorde.
  - Fra K4 samples lagene om til den nasjonale rammen (4.7). Cellene telles fra rammens origo, så celle (ix, iy) med størrelse c dekker x i [ix·c, (ix+1)·c). Blokkene på 10 km og flisene på 50 km står dermed likt over hele kysten. For Senja går blokkene fra x 800 til 900 og y 310 til 400 km.
  - Avstanden til land regnes her fra den nye masken, ikke lenger i siden.
  - Pakkene lages bare på nytt når kildene endrer seg: dataene, `mappack.mjs` eller `00-proj.js` (`src` i manifestet). Første bygg tar rundt 4 s ekstra.
  - Hvert lag deles i blokker på 10 × 10 km, som pakkes hver for seg med deflate. 16-bitslagene (dybde og høyde) lagres som rest etter medianprediktoren, slik siden lagret dem før.
  - En pakke har blokkene av ett slag i én flis på 50 × 50 km:
    `'KMP1'`, u32 lengden på hodet, hodet som JSON (`{kind, tile, blocks:[[lag, bx, by, offset, lengde]]}`) og blokkene.
  - Filnavnet har de første 12 hex-tegnene av pakkens SHA-256 og endelsen `.wasm`, fordi artifacten avviser `.bin` (K1). `dist/map/manifest.json` lister lagene og pakkene.
- **Slagene:**

  | Slag | Lag | Lastes |
  |---|---|---|
  | `core` | `mask` (land, 25 m), `dc` (avstand til land, 100 m), `expo` (eksponering, 500 m) | alltid, før spillet starter |
  | `sim` | `depth` (dybde i halve meter, 50 m) | rundt båtene og redskapene før klokka går |
  | `view` | `hgt` (høyde, 25 m), `forest` (skog, 50 m) | til 3D, etter hvert som de kommer |

  - Det som ser langt, leser bare kjernen: strøklengdestrålene og den lokale flåtens drift og fiske. Derfor ligger 25 m-masken i kjernen. Den er 63 KB for Senja og anslått til rundt 10 MB for hele kysten. K6 kan gi de som ser langt en grovere maske.
  - Planen hadde masken i `sim`. `maptest` viste at strøklengdestrålene da leste pakker langt fra båten.
- **Lasteren** (`core/01b-mapdata.js`):
  - `mapStart` leser manifestet.
  - `mapLoad(pk)` henter en pakke én gang. Den lagres i IndexedDB (`kyst-map`) etter hashen, så en ny publisering bare henter det som er endret.
  - En blokk pakkes ut synkront med fflate (`src/js/lib/fflate.js`, MIT) første gang den leses. Den beholdes så lenge det er plass: `MAPD.budget` er 96 MB, og den som er brukt minst nylig, går først. Høydene er Float32, så 96 MB trengs til hele Senja i 3D. K8 gjør dem til Int16.
  - Lesing:
    - `rcell(L, ix, iy)` gir én celle.
    - `rbil(L, p)` interpolerer bilineært i km, med samme regning som `gridBilinear`.
    - `rbilM(L, x, z)` gjør det samme i meter.
    - `isLand`, `coastDist`, `depthF`, `exposure`, `swellFactor`, `approachPath`, ruta, sjøkartet, terrenget og skogen leser alle gjennom disse.
  - **Leser noe en blokk som ikke er lastet, er det en feil** (`MAPD.miss` telles). Spillet bruker aldri reserveverdier, så resultatet avhenger aldri av hva som tilfeldigvis er lastet.
- **Barrieren:**
  - `simAreaReady()` (`01b-mapdata.js`) krever at `sim`-pakkene er lastet innen `MAPD.simR` (4 km) fra hver båt du eier og 1 km fra midten av hvert redskap i sjøen. Det dekker ekkoloddet, sonaren og plotteren.
  - Mangler noe, bes det om, og `playMinutes` i `08-actions.js` stopper. Minuttene som gjenstår, står i `CATCH_LEFT`. `tick` spiller dem når pakken er kommet, uten å vente i `step()`.
  - `bootMap` i `11-boot.js` laster kjernen og `sim`-pakkene rundt de lagrede båtene, rutene deres, redskapene, havnene og feltene før `bootGame` leser lagringen. 3D laster `view`-pakkene i `init`.
  - Visninger som leser lenger ut, spør først med `mapViewReady` og tegner uten dybde til pakken er kommet: sjøkartet beholder det forrige bildet, og 3D-strandteksturen og plotteren tegner dypt vann. Varmekartet venter.
- **Testene går over HTTP:**
  - `tests/_env.py` starter en egen server for hver test på en ledig port, fordi `file://` ikke kan hente filer. Hver test får dermed sin egen opprinnelse og sin egen `localStorage`.
  - `KYST_DIST=<mappe>` tester et annet bygg enn `dist/`, og bygget skriver dit med samme variabel.
  - `tools/serve.py` serverer `dist/` for manuell testing.
- **`maptest.py`** holder igjen én `sim`-pakke (sletter den i siden og i IndexedDB, og holder svaret med `page.route`). Den sjekker at:
  - klokka stopper før båten kommer innen rekkevidde, og står stille så lenge pakken mangler
  - resten spilles når pakken kommer
  - turen ender nøyaktig som en tur med alt lastet (tid, sted, fangst, penger og logg)
  - ingenting leser fra en pakke som ikke er lastet

  Simuleringen trekker da fra en egen tilfeldighetsgenerator, så det siden trekker selv i mellomtiden, ikke forskyver den.

### 4.7 Over til UTM 33 (kystplanen, fase K4, 02.10.2026)

Dette er den eneste tilsiktede endringen i oppførsel i kartfasen. Spillets ramme er nå UTM sone 33 i km (4.5), og Senja ligger der den ligger på hele kysten.

- **Dataene:**
  - Vektorene (kystpolygonene, den fine kysten, veier, molo og kaier, sjømerker, bruer, dybdekurver og bygg) går punkt for punkt gjennom `LG`/`LGm` når siden lastes. Den eksakte projeksjonen tar rundt 0,5 µs per punkt.
  - Byggene dreies med `LGrot`. Retningene til havneenhetene dreies med `LGu`.
  - Rastrene samples om når bygget kjøres (`tools/mappack.mjs`, 4.6):
    - dybde, høyde (i meter mellom kodene), eksponering: bilineært
    - skog: nærmeste celle
    - avstand til land: regnet på nytt
  - Den omvendte projeksjonen erstattes der av et polynom av femte grad, med avvik rundt 0,1 mm.
  - **Masken** rastreres på nytt fra de fine kystpolygonene (`geo-fine.b64`) i den nye rammen. Der den gamle masken og polygonene er uenige, gjelder den gamle masken (holmer og skjær som polygonene mangler, og noen kaiender, 8 785 celler). Utenfor det gamle kvadratet brukes den gamle maskens nærmeste kantcelle.
  - Mot den gamle masken avviker 0,14 % av cellene, alle langs kysten.
  - Alle havnepunktene ligger i vann.
- **Utstrekningen:**
  - `MAPB` er boksen rundt det gamle kvadratet: x 810,0–892,0 og y 311,4–397,1.
  - Kvadratet er dreid 1,4–3,3°. I de smale trekantene mellom kvadratet og boksen står kantdataene strukket ut.
  - Utenfor `MAPB` er det land (`isLand`).
- **γ** (`gridGamma(p)`, per km-rute):
  - Simuleringen og 3D regner i rutenettet: kurs, strøklengdestrålene, bølgene og dønningen i 3D, drift og skipsbevegelsene.
  - Det som kommer inn som sann retning, dreies med −γ: vinden og dønningen inn i strøklengden og 3D, solens og månens asimut, og lyktsektorene.
  - Det mannskapet leser, vises som sann retning med `trueDeg(r, p)`: COG, HDG, peiling til WPT, kurs i ruta, «Ny kurs» i loggen, navigasjonsloggen og kursen når redskap settes.
  - Vindretningen i teksten er sann, slik den alltid var.
- **Fisken:** støyfeltene (patcher, stimer, døgnvariasjon) og dybdemodellen regnes i nasjonale km. Feltene har de samme statistiske egenskapene, men ligger andre steder:
  - hyse i februar: snittet over havet 0,169 mot 0,178 (−5 %), og den beste prosenten 0,495 mot 0,557
  - snittet tar også med de smale trekantene i hjørnene av boksen, så det er 9 % flere sjøceller
  - `geartest` måler nå linefisket på de åtte beste hysestedene i stedet for det ene beste, fordi ett sted alene svinger fra 50 til 110 kg per balje
- **Krabbeområdet** er et belte fra 35 til 75 km sør for 69,72° N, som før, nå som y i den nye rammen. **Fiskerifeltene** (`fieldCode`) og offshore-strøklengden utenfor kartet (`offMapFetch`) regner fortsatt i gamle km gjennom `LGI`.
- **Bestanden** er glissen: `S.stock` og `S.cstk` holder bare 2 km-rutene under 1, med `gridKey` i den nasjonale rammen (`stkGet`, `stkSet`, `stockFill`). `stockHour` går over disse rutene og naboene deres.
- **Lagringen v2:**
  - Nøkkelen er `kystfiske_v2`. Et spill i `kystfiske_proto_v1` (v1) leses én gang og flyttes over med `migrateV2`, og v1-lagringen blir stående.
  - `migrateV2` sender alle punkter `{x, y}` i lagringen gjennom `LG`. Det gjelder båt, plan, kladd, spor, merker, navigasjonslogg, redskap i sjøen, driftsplan og veiledningen.
  - Kursen til båtene dreies med rammen.
  - Bestandsrutenettene på 40 × 42 i den gamle rammen blir glisne nasjonale ruter. Der to gamle ruter havner i samme nye, brukes den laveste verdien.
  - Lagringen får `v:2` og `frame:'utm33'`. Oppstarten sjekker deretter, som før, at ingenting ligger på land.
  - `mig2test.py` lager et v1-spill av et v2-spill med `LGI` og leser det inn igjen. Alle posisjonene (23, i sju slags felt) havner innenfor 1 m, kursen og bestanden følger med, og v1-lagringen er urørt.
- **Testene:** `routes.json` er regnet om til den nasjonale rammen. Testene sender fortsatt gamle km gjennom `LG()` i siden. `KYST_SHIFT` er borte.

### 4.8 Kartrørledningen (kystplanen, fase K5, 02.10.2026)

Kartdataene lages i `tools/map/` (i git, uten dataene). Mellomlageret ligger i `tools/map/cache/` og resultatene i `tools/map/out/`, og ingen av dem er i git.

- **Kildene:**

  | Kilde | Hva | Status |
  |---|---|---|
  | Overture 2026-09-23.1 | land (OSM-kysten), arealdekke (skog), bygg, veier, kaier, landegrenser | åpen |
  | Terrarium | z13 (Kartverkets 10 m-terreng i Norge), z11 grovere | åpen |
  | Geonorge | dybde 50 m (`bathymetry50m`) og DTM10 | stengt fra miljøet |
  | Overpass | sjømerker med lyktsektorer, skjær | stengt |
  | Tidevannet (`api.sehavniva.no`) | | stengt |

  - Terrariums sjøbunn duger ikke som dybde. Ved z13 er sjøen 0, og de grove nivåene (z8–z9) har bare 0,3 i korrelasjon med Kartverkets dybde rundt Senja.
- **Filene:**
  - `ov.py`: filliste, indeks over radgruppene som berører Norge (`python3 tools/map/ov.py index`), og `features(type, boks, kolonner)` med HTTP-delhenting og mellomlager per radgruppe.
  - `frame.py`: den nasjonale rammen (pyproj EPSG:25833), den gamle Senja-rammen og regioner i hele 10 km-blokker.
  - `terrain.py`: Terrarium, samplet bilineært i lat/lon.
  - `legacy.py`: de gamle Senja-rastrene (dybde, eksponering), dekodet av `readSenja` i `tools/mappack.mjs`.
  - `pack.py`: kartpakkene (formatet i 4.6), `write` for en region, `write_tiles` for kystflisene, og `read_layer` for sjekker.
- **Senja** (`python3 tools/map/region.py senja`) skriver `src/data/map/`, som er i git (3,9 MB). `node build.mjs` kopierer den til `dist/map/`.
  - **Maske 25 m** fra Overture-land. Inne i det gamle kvadratet avviker den fra K4-masken i 0,43 % av cellene, og 97 % av dem ligger i kystlinja. Utenfor kvadratet ligger nå ekte data i stedet for strukket kant.
  - **Avstand til land** (100 m) er euklidsk.
  - **Terreng 25 m** fra Terrarium z13 (før z11). Det er over 0 på land og under 0 på sjøen etter masken.
  - **Skog 50 m** fra Overture (ESA WorldCover): 25 % av ruta mot 0,2 % før. Det gir rundt 20 % flere trær i 3D.
  - **Dybde og eksponering** kommer som før fra de gamle Senja-rastrene.
  - Bygget tar 30 s med varmt mellomlager.
- **Fyllingen av polygonene** (`fill` i `region.py`):
  - En celle er land når sentrum ligger inne. Fyllingen er partall/oddetall per polygon, så hull blir hull, og den er sjekket mot punkt-i-polygon.
  - PILs fylling tok med hver celle en kant rørte, så landet vokste opptil én celle. På 200 m-masken var det opptil 200 m, og i Gisundet stengte det testruta.
- **Terrenget i sjøen** er sjøbunnen fra dybdelaget. Terrarium har sjøen på 0 ved z13. Det ga −0,5 m overalt, som 3D tok for grunner og tegnet skum på (66 % mot 12 % i `sea3d`).
- **Den nye kysten i Gisundet:** OSM fra 2026 har et 40 m smalt landstykke ved 69,3075° N 17,984° Ø, der den gamle kysten hadde vann. Testrute 4 (`tests/routes.json`) har fått vendepunktet sitt flyttet 150 m vest.
- **Vannet foran kaiene** (`inHarbourPocket` i `01-world.js`):
  - Havneenhetens basseng og 50 m ut fra designerens kaifront (`QUAYS`, bare Finnsnes har ingen enhet) er vann, både i `isLand` og i terrenget i 3D.
  - **Finnsnes:** OSM-kysten fra 2026 ligger 30–45 m ute foran kaifronten designeren tegnet etter flyfoto 29.09.2026. Det kan være en ny utfylling eller en kai som ikke er på bildene. **Bør sjekkes på stedet eller mot nyere bilder.** Inntil videre gjelder designerens kai, og vannet foran den.
- **Hele kysten** (`national.py`, `coast.py`) går i trinn, som hver lagrer resultatet sitt:
  1. `national.py mask200`: land over hele rammen (1 450 × 1 720 km) på 200 m, også Sverige, Finland, Russland og Danmark, slik at strålene ser ut mot havet.
  2. `national.py tiles`: 50 km-flisene med norsk sjø innen 20 km fra land eller norsk land innen 3 km fra sjøen. Norges land og sjø kommer fra Overtures landegrenser.
  3. `national.py expo`: eksponeringen på 500 m. 48 stråler på 200 m-masken, og eksponeringen = 0,585 × middelet av åpen andel innen 10 km + 1,009 × andelen stråler som er åpne ut til 150 km. Modellen er tilpasset de gamle Senja-rastrene: korrelasjon 0,95 (testet på halvparten), og feilen er 0,125 på en skala fra 0 til 1.
  4. `coast.py`: lett utgave per flis med maske 25 m, avstand 100 m, terreng 25 m (z13 i blokkene innen 3 km fra sjøen, z11 ellers), skog, eksponering og dybde.
     - Dybden er Kartverkets inne i det gamle Senja-kvadratet. Ellers er den spillets egen dybdemodell, med støyen overført bit for bit, til Geonorge er åpen.
     - Pakkene havner i `out/national/lite/`, med kjerne per flis.
     - Spillet tar dem i bruk i K6–K8: lasteren må kunne laste kjernen per flis, og ha faste verdier for blokker uten pakke (innland og åpent hav).

### 4.8b Kartdataene for hele kysten i GitHub Actions og releaser (02.10.2026)

Jonas valgte 02.10.2026 å la GitHub bygge og lagre de nasjonale kartdataene. Git har bare koden og Senja-pakkene.

- **`.github/workflows/kart.yml`** kjører rørledningen på GitHubs maskiner, der nettet er åpent. Repoet er offentlig, så det er gratis.
  - **`national`:** Overtures indeks og de nasjonale trinnene (land på 200 m, kystflisene, eksponeringen, fjernhøydene).
  - **`tiles`:** flisene fordelt på `parts` deler (12) side om side, med `coast.py cache k n`.
  - **`pack`:** pakkene for alle flisene (`coast.py lite`) og releasen `kart-<kjøringsnummer>` med `kart-lite.tar.gz` og `manifest.json`.
- **Start:** en push som endrer `tools/map/kart.json`, på en hvilken som helst gren (endre `run` for å bygge på nytt), eller for hånd fra Actions-fanen når fila ligger på `main`.
- **`python3 tools/map/release.py [tag]`** henter den nyeste (eller den nevnte) releasen og pakker den ut i `tools/map/out/release/<tag>/lite`. Nedlastingen fra GitHub virker fra skymiljøet.
- **Første kjøring** (02.10.2026, 21 minutter): releasen `kart-1` med 168 fliser og 672 pakker, 217,7 MB. Det er flere filer enn én artifactversjon kan ha (511), så pakkene må slås sammen før den lette utgaven publiseres (K11).
- **Ikke ennå:** Bygget tar ikke pakkene fra releasen ennå. Det kommer med den lette artifacten og PWA-en i K11. Geonorge (dybde 50 m, DTM10) og Overpass kan nå kjøres i workflowen, men rørledningen bruker dem ikke ennå.

- **Ekte havbunn (03.10.2026):** `.github/workflows/dybde.yml` henter dybdemodellen «Dybdedata – terrengmodeller 50 meters grid» (Kartverket, CC BY 4.0) fra Geonorges WCS. Den brukes for hver kystflis (`tools/map/dybde.py`, `dybde.json`).
  - **Tjenesten:** `https://wms.geonorge.no/skwms1/wms.dtm2`, coverage `bathymetry50m`, EPSG:25833. Den skaleres til spillets 1 000 × 1 000 celler.
  - **Lagringen:** desimeter. 0 betyr at det ikke finnes data.
  - **Releasen:** `dybde-2`, alle 168 flisene, 86 MB.
  - **I rørledningen:** `coast.py` bruker dybden (`kartverket()`), og dybdemodellen der Kartverket ikke har data, blandet over 250 m i kanten. Inne i Senja-ruta står de gamle dataene, som er fra samme kilde (korrelasjon 1,0, medianavvik 0,1 m).
  - **Kartdataene:** `kart.yml` henter releasen som `kart.json` peker på (`depth`). `kart-3` ble 250 MB, over grensen for en artifact. Derfor rundes dybden i `kart-4` av grovere på dypt vann (`qdepth`: ½ m til 20 m, 1 m til 60 m, 2 m til 150 m og 5 m dypere).
  - **Høydereferansen** er ikke sjekket. Den er antatt å være den samme som i Senja-dataene, siden tallene stemmer.

### 4.9 Kjernen for hele kysten (kystplanen, fase K6, 02.10.2026)

- **Den nasjonale kjernen** ligger i `core`-pakken og lastes alltid. Den er 2,9 MB og lages av `national.py core_layers()`, som `region.py` legger ved:

  | Lag | Innhold |
  |---|---|
  | `land200` | land på 200 m over hele rammen (Norge med naboland, til 1 750 km sør), fra Overture |
  | `dc200` | avstanden til land på 200 m, i 100 m-steg til 25,5 km (u8) |
  | `expo` | eksponeringen på 500 m (4.8). Utenfor kystflisene er åpen sjø 255. Den erstatter de gamle Senja-rastrene, også på Senja: feltene utenfor ble litt mindre åpne (0,93/0,82/0,91 mot 0,95/0,90/1,00) og fjordfeltene litt mer (0,31–0,40 mot 0,23–0,28). |

  Lagene står i blokker på 50 km (`n` per lag i manifestet).
- **Detaljflisene** (`sim`) har nå `mask` (25 m), `dc` (100 m) og `depth` (50 m). `mapSimAt(p)` sier om flisen til p har detalj, og `mapViewAt(p)` det samme for terreng og skog.
- **Leserne:**
  - `isLand`, `coastDist` og `depthF` bruker detaljen der flisene har den, og pakken må da være lastet (barrieren). Ellers bruker de kjernen: land på 200 m og dybdemodellen (`depthModel`, med eksponering og `coastDistFar`).
  - `isLandFar` og `coastDistFar` leser bare kjernen. Det gjør det som ser langt:
    - strøklengdestrålene og -rutene (`fetchRay`, `fetchAt`, `fetchCell`)
    - den lokale flåtens drift
    - fisket på de kjente feltene
    - dybdemodellen
  - `isLandUI` er for skjermene: et trykk i kartet og ruteredigeringen. Den bruker detaljen hvis pakken er lastet. Ellers bruker den kjernen og ber om pakken.
- **Strøklengden:** strålene går på kjernen, stopper på 200 m-land, og får havets 600 km der de går ut av rammen. `offMapFetch` (Andøya, Kvaløya) er borte. Fra feltet nord for Husøy er strøklengden mot vest nå 530 km (før 257), fordi strålene ser havet utenfor Andøya.
- **Rammen:**
  - `MAPB` er hele rammen (0–1 450 × 0–1 720 km), og du kan seile overalt.
  - `HOME` er Senja-boksen. Den brukes til startutsnittet, målet for zoom i 2D (`MAP_W`, `MAP_H`) og de vide meshene i 3D (det fjerne terrenget og sjøtilstanden), til K8.
- **Utenfor detaljflisene:**
  - Sjøkartet tegner land fra kjernen og dybden fra modellen, med kysten fra `coast0` over (4.10).
  - 3D bruker fjernhøydene på 200 m fra K8 (4.11), og en flat stedfortreder fra kjernen til de er lastet.
- **Rettet etter regresjonen** (02.10.2026):
  - **Moloene** er land i 25 m-masken. De ligger i Overtures `base/infrastructure` (klasse `breakwater`, OSMs `man_made=breakwater`) og ikke i kystlinja. Fyllingen etter cellesentrum mistet dem som var smalere enn en celle, og ruta gikk rett gjennom moloen på Husøy. De fylles nå med en halv celle ekstra bredde (93 moloer i Senja-flisene).
  - **Strøklengden nær land:** 200 m-kjernen ser ikke moloene eller de smale sundene, og Husøy havn ligger i en 200 m-landcelle. Feltet tok da havet utenfor for havna (1,6 m sjø inne i havna i NNV 11 m/s). Innen `FETCH.near` (1 km) fra kjernens land går strålenes første `FETCH.fine` (1,5 km) på 25 m-masken (`fetchFine`, `fetchHere`), og kjernens stråler går videre derfra.
    - Det gjelder bare der flisens detalj er lastet. Den er alltid lastet rundt båtene og redskapen (barrieren), som er der simuleringen spør etter sjøen, så simuleringen blir lik uansett hva annet som er lastet.
  - **Dybden utenfor det gamle Senja-kvadratet:** Senja-flisene går utenfor kvadratet, og der ble Kartverket-rasteret lest med kanten dratt bortover (lyseblå striper i kartet vest for Senja). Der brukes nå dybdemodellen, slik `coast.py` gjør for kystflisene.
  - `seatest` forventer den nye eksponeringssummen (19 452,4477, 2,0 % over den gamle). Endringen kom med den nasjonale eksponeringen i K6 og er tilsiktet.
- **Ikke ennå:**
  - Autoruta («Følg leia», nå Autonav) leste 100 m-avstanden over hele `dc`-laget. Det er løst med vinduet i K9 (4.12).
  - Detaljflisene for hele kysten (`out/national/lite`) er ikke i git, og bygget bruker dem ikke ennå.

### 4.10 Sjøkartet i 2D (kystplanen, fase K7, 02.10.2026)

- **Zoom:** fra hele landet (`ZMIN = MAP_H / 1800`, utsnittet 1 800 km høyt) til en havn (`ZMAX = 160`, en halv kilometer). `view.z` er fortsatt målt mot `MAP_H` (Senja-boksen).
- **Kartpakkene får vektorer** (`tools/map/chart.py`, som `region.py` legger ved):

  | Oppføring | Hvor | Innhold |
  |---|---|---|
  | `coast0` | kjernen | land i hele rammen forenklet til 300 m, polygoner over 0,2 km² (10 167 ringer, 294 kB pakket) |
  | `names0` | kjernen | navnene som vises fra hele landet: byer og tettsteder over 20 000 i Norge, over 150 000 i utlandet; hav, fjorder og sund som spenner over 40 km; øyer som spenner over 25 km (115 navn) |
  | `coast1` | `chart`-pakke per flis | land forenklet til 25 m, polygoner over 2 000 m² |
  | `coast2` | `chart`-pakke per flis | land forenklet til 3 m, polygoner over 50 m² |
  | `names` | `chart`-pakke per flis | steder, vann, øyer og topper/nes med rang 0–3, og vinkelen navnet dreies |

  - Vektoroppføringene ligger ved flisens første blokk med antallet som sjette felt, og leses med `mapVec(pk, navn)`.
  - Ringene er pakket som i `vectors.py` (klasse, antall punkter, sikksakk-steg). De ytre ringene og hullene går hver sin vei, så spillet fyller med `nonzero` og overlappende polygoner blir land.
  - Overture deler landet i biter. Spillet streker derfor ringene dobbelt så bredt og fyller over etterpå, så sømmene mellom bitene dekkes og bare stranda beholder streken (halvparten, på sjøsiden).
  - **Rangen:**
    - Steder går etter Overtures klasse og folketall.
    - Vann er stort sett punkter eller linjer langs fjorden i OpenStreetMap (`place=bay`). Det rangeres etter hvor langt det er til land fra punktet (200 m-masken), etter lengden på linja og etter arealet. Navn på -vika, -bukta, -hamna, -pollen og lignende kommer nær inne.
    - En fjord som er tegnet som linje, får navnet dreid langs linja (Malangen, Gisundet, Andfjorden).
    - Innen hver rang står det viktigste først, og spillet beholder den rekkefølgen.
  - Navnene har bokmål, norsk eller nynorsk der Overture har det, ellers første form av hovednavnet («Porsangerfjorden», ikke «Porsáŋgguvuotna»).
  - `names0` går etter avgrensningsboksene uten geometri (geometrien for hele rammen ville vært flere GB). Hvert navn plasseres i boksen der det er lengst fra land (vann) eller sjø (øyer), regnet på 200 m-masken.
- **Tre detaljnivåer etter høyden på utsnittet** (`chartLevel`, `src/js/ui/03a-chart.js`):

  | Nivå | Utsnitt | Kyst | Dybde |
  |---|---|---|---|
  | 0 | over 150 km | `coast0` | grovt: dybdemodellen uten skråningen mot land, høyst 160 000 punkter skalert opp; ingen flispakker hentes |
  | 1 | 8–150 km | `coast1` der flisen har kartpakke, `coast0` ellers | som før: detaljflisene, ellers kjernens land og dybdemodellen |
  | 2 | under 8 km | `coast2` | som nivå 1; landet er bare vektorkysten, med moloene (fra 04.10.2026, 4.19) |

  - På nivå 2 viser kartet det `legClear` regner som land: vektorkysten med moloene, havnelommene og mottakenes fyllinger (4.19). `charttest` krever at minst 99,5 % av punktene i et havneutsnitt stemmer (100 % målt 04.10.2026, mot 99,5–99,8 % med masken).
  - B-splinen for dybden brukes bare der en piksel er finere enn dybdecellene (50 m). Lenger ute gir bilineær like glatt kart for en femtedel av arbeidet.
  - **Tegnetid** i `charttest` (1 280 × 800, CPU strupet 4×): hele landet 0,1 s, regionen 0,35 s, fjorden (20 km) 1,5 s, havna 0,5 s. Fjordnivået er det tyngste: B-splinen med 16 oppslag per piksel. Det er det samme som før K7, og en kandidat for finpussen.
  - Stiene ligger som `Path2D` i km, flisene fra sitt eget hjørne, så tallene holder seg små ved største zoom. Hver flis tegnes innenfor sin rute, så kantene der polygonene er kuttet, ikke blir streket opp.
- **Gradnettet** tegnes i lerretet med et steg som gir minst tre paralleller over utsnittet (fra 10° ned til 15″). Meridianene får omtrent samme avstand på bakken. Breddene står ved venstre kant og lengdene ved nedre kant (`69°20'N`, `17°30'Ø`).
- **Stedsnavnene** står i SVG-en (`chartNamesSvg`):
  - Rang 0 vises alltid og kommer fra `names0` i kjernen, også over flisene. Rang 1 vises under 140 km, rang 2 under 30 km og rang 3 under 9 km, alle fra flisene. Et flisnavn som `names0` alt har innen 60 km, droppes.
  - Det viktigste kommer først, og et navn som dekker et navn som alt står (eller en havns navn), droppes.
  - Et sted med samme navn som en havn innen 3 km droppes.
  - De håndplasserte navnene og Senja-kysten (`geo-coast.b64`, `COAST_D`) er borte. Havnenavnene og feltnavnene vises først fra `view.z ≥ 0,5`.
- **`charttest.py`** (uten 3D, måler tid, så den kjører alene til slutt), liggende og stående:
  - zoomer fra hele landet via regionen og fjorden til havna og sjekker detaljnivået på hvert trinn
  - sjekker land og sjø i pikslene, byene og fjordnavnene, gradnettet og at havnekartet stemmer med `isLand`
  - drar kartet med én finger og knipser det ut med to (berøring over CDP), forbi den gamle grensen på 0,8
  - måler tegnetiden med CPU strupet 4× (`Emulation.setCPUThrottlingRate`); grensen er 2,5 s på hvert nivå
  - skjermbilder: `chart_land.png`, `chart_region.png`, `chart_harbour.png`, `chart_pinch.png`
- **Ikke ennå:**
  - Kartpakkene finnes bare for Senja-flisene. Ellers tegnes `coast0`, også nær inne, over kjernens land på 200 m.
  - Navnene står vannrett (de gamle fjordnavnene var rotert langs fjorden).
  - `FINE` (den gamle 12,5 m-kysten) brukes fortsatt av plotteren i 3D.

- **Fliser (03.10.2026, etter spilltesten):** Bakgrunnen (dybde, fjære og land) tegnes nå i fliser på 256 × 256 piksler (`CT`, `chartTile`, `chartCompose`, `chartWork`). Kyst, gradnett og fjordlinje ligger på et eget lerret over (`CT.vec`).
  - En ny flis kommer først grovt (¼ oppløsning) med en gang. Så tegnes den fint, 8 ms per bilde, fra midten og ut.
  - Når kartet dras, tegnes flisene som finnes der de nå er (`chartPan`), så det blir aldri mørke felt.
  - Mangler pakkene, tegnes flisene fra kjernen (`prov`) og på nytt når pakkene kommer (`chartCame`).
  - Fjæra leses bilineært fra masken med kantutjevning.
  - Kystlinja forenkles etter pikselstørrelsen (`pathStep`) og strekes som tre hårstreker under fyllet. En bred strek kostet 0,7 s rundt hele landet med CPU strupet 4×.
  - Dybden nær inne regnes med B-spline i hver 4. piksel og interpoleres imellom.
  - **Tidene med CPU strupet 4× (`charttest`):** første bilde 0,06–0,36 s og alt fint innen 1,6 s, mot 1,5–2,6 s før.

### 4.11 3D for hele kysten (kystplanen, fase K8, 02.10.2026)

- **Fjernhøydene (`far`):**
  - Bakken på 200 m for 3D-visningen langs hele kysten: 191 fliser med land som er kystfliser eller grenser til en, med én pakke per flis (5,2 MB i alt).
  - De lages av `national.py far200()` fra Terrarium z9, som gir 100–160 m per piksel i Norge, med Kartverkets terreng på land og havbunnen fra GEBCO.
  - Høydene er lest bilineært i 200 m-cellenes midtpunkt og tilpasset 200 m-landet: land minst 1 m, sjø høyst −2 m.
  - Kilden hadde enkeltspisser (4 378 m i Rogaland). En celle som ligger 400 m over medianen av naboene, får medianen, og ingenting går over 2 470 m.
  - Laget er av typen `far`, med blokker på 50 km. `pack.write` regner nå flisa ut fra blokkens størrelse i km og skriver bare blokkene som er med (`keep`).
- **Høydene lagres som Int16** i desimeter (`L.k = 0.1`, `rbil`/`rbilM` ganger med `L.k`). Det tar halve plassen av Float32. Dybden er fortsatt Float32.
- **Strømming** (`stream3d`): 3D-visningen henter pakkene rundt båten høyst hvert andre sekund.
  - Fjernhøydene hentes over fjernterrengets vindu, og flisenes bakke og skog innenfor 14 km.
  - Når en pakke kommer, bygges meshene over den på nytt.
  - Før pakken er inne, er landet en stedfortreder fra 200 m-landet.
  - `tileH` leser et høydelag bare der cellenes flis har pakken inne. Kantene mellom flisene og områder som ikke er lastet ennå, gir derfor aldri en feil.
- **Bakken i 3D:**

  | Kilde | Hvor |
  |---|---|
  | Flisenes 25 m-bakke | der den er lastet |
  | Fjernhøydene | ellers, holdt til 200 m-landet som simuleringen seiler etter utenfor flisene |
  | Flat stedfortreder (land 2 m, sjø −4 m) | til fjernpakken kommer |

- **Vinduer som følger båten:**
  - Fjernterrenget (`TERR`) er et vindu på 100 km rundt båten, på et rutenett av 10 km. Det bygges på nytt når båten er 20 km fra midten (`TERRW`).
  - Det vide sjøtilstandskartet og havet langt ute følger det samme vinduet.
  - Senja-kvadratet (`HOME`) brukes nå bare til startutsnittet, zoommålet i 2D og de faste meshene for Senja-havnene.
- **Kvalitetsnivåer** (`QUAL`, valget Grafikk i 3D i Innstillinger på telefonen: Auto, Lav, Middels, Høy):

  | | Lav | Middels | Høy |
  |---|---|---|---|
  | Største `dpr` | 1 | 1,25 | 1,5 |
  | Nærterreng (nær / langt kamera) | 3 / 6 km | 6 / 12 km | 6 / 12 km |
  | Skygger på terrenget | av | på | på |
  | Havskyggeren | fjernvarianten helt inn til bølgefeltet | full | full |
  | Sjørokk og sprut i lufta | av | på | på |

  - Auto går ned et nivå etter 4 s under 28 bilder/s og opp et nivå etter 12 s over 50, men ikke tilbake til et nivå den forlot før det har gått to minutter.
  - `#qfix` i adressen holder nivået på Høy. Testene bruker det (`_env.py`), fordi SwiftShader bare gir noen få bilder/s.
- **`teleport3d.py`** (3D) flytter båten til Kirkenes, Honningsvåg, Reine, Bergen, Hvaler og Senja. På hvert sted sjekker den at:
  - fjernpakken kom, og vinduet fulgte båten
  - fjellene når høyden for stedet (målt 560, 573, 802, 1 552, 372 og 1 298 m i vinduet)
  - det ikke er noen GL-feil eller sidefeil, og at bildet har innhold (`tp_<sted>.png`)

  Den sjekker også at kartblokkenes minne holder seg under budsjettet (36 MB etter seks steder), at Lav gir kortere nærterreng, at Auto går ned og opp som beskrevet, og at valget står på telefonen. Bildetakten skrives ut, men tallene fra SwiftShader sier ingenting om et nettbrett.
- **Ikke ennå:**
  - Detaljert bakke (25 m), skog, bygg og veier finnes bare for Senja. Andre steder er bakken 200 m og landet glatt uten skog.
  - Sola, månen og tidevannet regnes fortsatt for Senja (K10), så bildene fra Kirkenes og Bergen har Senjas lys.
  - Bildetakten er ikke målt på nettbrettet ennå. Testsiden for bildetakt, minne og tid for catch-up er ikke bygget.

- **Ytelsen etter spilltesten 03.10.2026:**
  - Skyggene regnes med en tidsgrense per bilde (`SHMS`, 2–4 ms). Nettene bygges rad for rad over flere bilder (`meshTask`, `meshStep`), ett om gangen og med nærnettet først.
  - Et nett under bygging som fortsatt dekker båten, får gjøre seg ferdig. Uten det hoppet sjøkartet når båten gikk fort.
  - Pakkene for 3D hentes én gang hver (`stream3d`), og bare nett som en ny pakke dekker, bygges på nytt (`staleOver`).
  - Kompasslinja er en ferdig tegnet stripe. Det er ingen backdrop-filter i 3D.
  - Automatisk kvalitet går opp igjen etter 8 s over 40 bilder/s.
  - «Vis bildetakt» ligger i Innstillinger.

### 4.12 Autonav over hele kysten (kystplanen, fase K9, 02.10.2026)

- **Vindu i stedet for hele kartet** (`leiaFind` i `core/11-route.js`): A* går i et vindu rundt start og mål, `LEIA.pad` (5 km) eller `LEIA.padK` (35 %) av avstanden, det som er størst.
  - Der vinduet når flisenes detalj (sim-pakkene), brukes 100 m-celler med 100 m-avstanden til land (`dc`), ellers 200 m-celler på den nasjonale kjernen (`dc200`). Pakkene under vinduet lastes før søket.
  - Blir vinduet for stort (over `LEIA.maxCells`, 600 000 celler), eller detaljen er inne men bare 200 m-celler får plass, søkes det først grovt (celler på et multiplum av 200 m). Deretter søkes det i en korridor på `LEIA.corr` grove celler pluss 1 km på hver side av den grove veien. Korridoren bruker 100 m-celler der detaljen er inne og boksen ikke er for stor, så de smale sundene i 25 m-masken ikke blir oversett.
  - Finner søket ingen vei i vinduet (rundt et nes, ut av en dyp fjord), prøves det igjen med 2,5 og 6 ganger så stort vindu.
- **Antall punkter** (`leiaMaxWp`): et mål, ikke et tak. 12 på ruter under 80 km, så ett til per 2,5 km, høyst 40. Utrettingen stopper ved den første avstanden fra land (`LEIA.margins`) som når målet, ellers beholdes færrest punkter.
- **Målt** (`routetest.py`, 02.10.2026):
  - Senja: alle etapper til de seks feltene og Botnhamn er fri for land, grunner og skjær. Rutene er 0,0–2,5 % lengre enn den strammeste veien langs land. Feltet rundt Senja (52 nm) trenger det andre vinduet og får 15 punkter (målet 20).
  - Finnsnes–Tromsø: 67 km, 12 punkter, 1,11 ganger luftlinja, 100 m-celler.
  - Bodø–Reine: 93 km, 7 punkter, 1,04 ganger luftlinja, 200 m-celler (bare kjernen der).
  - Bergen–Florø innaskjærs: 150 km, 35 punkter, 1,10 ganger luftlinja, aldri mer enn 3,5 km fra land.
  - Ingen bit tar over 16 ms. Søket leser klokka hver 8. ekspansjon. Med hver 32. ga Finnsnes–Tromsø 15,7 ms, og med detaljen for hele kysten ga Bergen–Florø 15 ms ved hver 16. Nå er den lengste biten 10,8 ms. Hver nasjonal rute er ferdig på under ett sekund.
  - Med hele kysten i bygget (4.13) går alle tre rutene på 100 m-celler: Bodø–Reine 94 km med 9 punkter, Bergen–Florø 153 km med 33. Endepunktene i testen velges nå med detaljen (300 m fra land og dypt nok). Startpunktet ved Bodø fra 200 m-kjernen lå på 1,1 m dyp.

### 4.13 Hele kysten i bygget (03.10.2026)

- **Releasen i spillets format** (`coast.py game`, `kart-2` og senere): per flis `sim` (maske 25 m med moloene, avstand 100 m, dybde 50 m), `view` (terreng 25 m, skog 50 m) og `chart` (kyst på 25 m og 3 m, stedsnavn), slik `region.py` lager Senja. `kart-1` var i K5-formatet (maske og avstand i en kjerne per flis, ingen sjøkart) og brukes ikke av bygget.
  - Moloene (`region.breakwaters`) er nå med for hele kysten.
  - Flisjobbene i workflowen lager kysten og navnene per flis (`chart_tile`, mellomlagret i `out/national/chart/`), og pakkejobben skriver `kart-game.tar.gz`.
- **`tools/map/game.py`** setter sammen pakkene til bygget i `tools/map/out/game/` (ikke i git):
  - kjernen og fjernhøydene fra `src/data/map` (`region.py`)
  - Senjas fliser derfra også, men blokk for blokk sammen med releasens: Senja-regionen begynner på y 310 km, flisene på 300, så raden 300–310 kommer fra releasen
  - alle andre fliser fra releasen
  - de små pakkene slått sammen, så artifacten holder seg under 511 filer per versjon: fjernhøydene 4 × 4 fliser per fil og sjøkartet 2 × 2. En sammenslått pakke har `tiles` i manifestet.
  - Lagene for flisene dekker hele rammen (releasens utstrekning).
- **`python3 tools/map/release.py`** henter den nyeste releasen (`game/`), og `python3 tools/map/game.py` setter sammen. `node build.mjs` tar `tools/map/out/game/` når den finnes, ellers `src/data/map` (bare Senja), eller det `KYST_MAP` peker på. Den skriver ut hvilken.
- **Lasteren** (`01b-mapdata.js`):
  - En sammenslått pakke føres under hver av flisene sine som en egen pakke (`of`) som lastes gjennom den.
  - `mapHasM` hopper over blokker i fliser uten pakke (innlandet, åpent hav), så 3D ikke venter på dem.
  - Sjøkartets mellomlager er per pakke og flis (`chartPath`, navnene).
- **Bygget for hele kysten** (`kart-2`): 168 fliser med detalj, 424 kartpakker og manifestet. Det er 195 MB kart pluss en side på 6,2 MB.

  | Slag | Pakker | MB |
  |---|---|---|
  | `sim` | 168 | 60,8 |
  | `view` | 168 | 113,6 |
  | `chart` | 62 | 12,1 |
  | `far` | 25 | 5,2 |
  | `core` | 1 | 3,3 |

  En spiller laster bare pakkene rundt båten (og kjernen), og de lagres i IndexedDB.
- **Rettet etter regresjonen med hele kysten:**
  - Telefonens dekning (`coverage`) leste den detaljerte avstanden til land, som krever at pakken er lastet. Den bruker nå kjernens (`coastDistFar`): det er kilometre, og en skjerm skal aldri vente på en pakke.
  - Testene som flytter båten rett til et sted (`teleport3d`, `tidetest`, endepunktene i `routetest`), laster nå detaljpakkene der først, slik barrieren gjør før en båt kommer dit. En båt som seiler, kommer aldri inn i en flis som ikke er lastet, fordi barrieren laster 4 km rundt den før klokka går.
  - Kartblokkene fyller nå hele budsjettet (96 MB) etter seks steder, og det eldste går ut. `teleport3d` sjekker at budsjettet holder.
- **Kameraet ved kaia** (`view3d.js`): ved lavvann ligger en båt ved kaia rundt 3 m under kaikanten, og en løfting på 57° var ikke nok til å se over kanten (`camtest`, Botnhamn, med tidevannet fra K10). Kameraet kan nå løftes nesten rett ned over båten (1,45 rad).

### 4.14 Tidevann per sted og sol etter posisjon (kystplanen, fase K10, 03.10.2026)

- **Tidevannet** (`core/03-simulation.js`):
  - `tools/tide/fetch.py` henter Kartverkets tidevannsvarsel (Se havnivå, `vannstand.kartverket.no`, CC BY 4.0). Det er timevis over sjøkartnull for et år fra 1.10.2026, i et punkt på sjøen per kystflis (`tools/tide/points.json`, 143 punkter 0,4–3 km fra land).
  - Skriptet tilpasser spillets harmoniske konstanter med minste kvadraters metode. Konstantene er middelvann over sjøkartnull og amplitude og fase for M2, S2, N2, K2, K1 og O1, med de samme astronomiske argumentene som `tideH`. Nodalfaktorene ligger i årets tilpasning.
  - Kartverket er stengt fra skymiljøet. Derfor kjører `.github/workflows/tidevann.yml` skriptet og legger resultatet som releasen `tide-<kjøring>`. Den startes av en endring i `tools/tide/tide.json`. `api.sehavniva.no` svarte ikke fra GitHub, så den nye adressen prøves først.
  - Resultatet ligger i `src/data/tide.json` (138 punkter, fra `tide-2`). Restavviket er 7–13 cm, fra tidevannskomponentene spillet ikke har (M4, P1, Q1 og andre).
  - `tidePlace(p)` blander de tre nærmeste punktene etter omvendt kvadrat av avstanden, som komplekse tall så fasene går jevnt over.
  - `tideH(H, p)`, `tideZC(p)`, `tideCD(H, p)` og `tideEvents(H0, timer, p)` gjelder der `p` er, ellers der båten du følger er (`herePos`). Uten tabellen brukes Senjas gamle konstanter overalt. Det var Tromsøs: M2 0,86 m.
  - **Målt** (`tidetest.py`):

    | Sted | Tidevannsforskjell over 15 dager i mars 2027 | Middelvann over sjøkartnull | M2 |
    |---|---|---|---|
    | Hvaler | 0,30 m | 0,57 m | 0,12 m |
    | Bergen | 1,27 m | 0,89 m | 0,42 m |
    | Bodø | 2,58 m | 1,68 m | 0,85 m |
    | Senja (Husøy) | 1,98 m | 1,36 m | 0,66 m, før 0,86 m |
    | Kirkenes | 2,96 m | 2,06 m | 1,06 m |

    Ved Egersund er M2 bare 3–6 cm (amfidromepunktet). Høyvannet kommer rundt 1,4 timer senere på yttersida av Senja enn med Tromsøs konstanter.
  - Havneenhetene mudres i forhold til middelvann der de ligger (`unitDredge` bruker `tideZC(p)`). `unittest` regner det laveste vannet per enhet.
- **Sola og månen:** `sunAt(H, p)`, `moonAt(H, p)` og `sunTimes(H, p)` regner der `p` er, ellers der båten er (`obsAt`, i 5 km-ruter). 3D-lyset, SOL i navigasjonslinja, været på telefonen, nordlyset og overtroen følger dermed båten.
  - Midtsommer har Senja, Bodø og Kirkenes midnattssol, og dagen er 19,2 timer i Bergen og 18,7 på Hvaler.
  - Midtvinter har Senja og Kirkenes mørketid, og dagen er 1,6 timer i Bodø, 5,8 i Bergen og 6,3 på Hvaler.
  - Sola regner lysbrytningen to ganger nær horisonten (`sunAt` legger den til høyden, og `sunTimes` bruker −0,83°). Dagene blir derfor noen minutter for lange. Det er gammelt og er ikke rettet.
- **Grunnstøting i sør** (`tidetest.py`): over samme grunne (1,0 m i kartet) ved høyvann går en båt med 1,8 m dypgang på grunn på Hvaler (1,66 m vann), men flyter i Bodø (3,15 m).

### 4.15 Hus, veier, bruer, brygger, moloer og kaier langs kysten (del 4, 03.10.2026)

Jonas sto i Tromsø og så ingen hus. Før dette fantes bygg, veier, bruer og brygger bare for Senja, innebygd i siden (`#bld`, `GEO_ROADS`, `BRIDGES`, `PIERS`).

**Rørledningen** (`tools/map/vectors.py`, `coast.py`, releasen `kart-5`):
- **Veier:** Overtures `road_flags` (`is_bridge`, `is_tunnel` med `between` som brøkdeler av linja) deler hver vei. Bru- og tunnelbitene tas ut av veilaget. Før ble Tromsøysundtunnelen tegnet rett over sjøen.
- **Bruer (`bridge`):** brubitene med klasse, lengde og navn (`names.rules` for akkurat den biten), i samme form som `BRIDGES`.
  - Bitene av samme bru føyes sammen (`linemerge`), og en bru som er kartlagt to ganger (Hausdorff under 10 m), tas bare én gang.
  - Biter under 15 m (stikkrenner) blir vei.
- **Brygger (`pier`):** kind 0 er brygge (`pier/pier`), 1 er molo og 2 er kailinje (`quay/quay`).
  - Moloene ligger i Overture som `water/breakwater`. Før ble de lett etter under `pier` og kom aldri med.
  - Kailinja snus så vannet ligger til venstre, (−dz, dx).
  - Alt holdes helt i flisa der midten ligger.
- **Kaifronter (`quay`):** der NPC-båtene kan ligge.
  - Rette kanter på 10 m eller mer fra bryggene. En brygge kartlagt som linje regnes 4,2 m bred.
  - Kailinjene.
  - Rett kyst (1 m forenkling) på 25 m eller mer, innenfor 150 m fra en brygge eller kai, eller 30 m fra et stort industribygg (fiskebruket står ofte på en kai som bare er kartlagt som kystlinje).
  - Med 300 m sone kom steinfyllingene langs byveiene med.
  - Hver front lagres i 9 byte: midtpunkt, normalen mot vannet, lengde, dybde (50 m-dybden ved den første av 25, 50 og 75 m ut som har vann, i kvartmeter, 0 = ukjent; i `kart-5` den største av de tre, som var for raust, rettet til neste release) og slag.
- **Pakkene:** `coast.py game` legger lagene i en egen pakketype `vec` per flis, så `view`-pakkene beholder hashen og ikke lastes ned på nytt. Størrelsen per lag skrives ut i releasen.
- **Hele kysten i `kart-5`:**

  | Lag | Antall | MB (rått) |
  |---|---|---|
  | bygg (2 km fra sjøen) | 2 349 499 | 18,8 |
  | veier | 1 154 363 | 23,5 |
  | bruer | 9 140 | 0,5 |
  | brygger, moloer, kailinjer | 28 917 | 0,5 |
  | kaifronter | 137 855 | 1,2 |

  168 `vec`-pakker er 35,5 MB komprimert. Tromsø-flisa er 0,37 MB.
- **Bygget:** `vec`-pakkene kommer alltid i appen (PWA). Artifacten får dem bare med `KYST_VEC=1`: den har 256 MB per versjon, og kartet ligger nær det. Der gjelder Senjas innebygde data alene som før.

**Spillet** (`core/01c-vec.js`):
- **Senja-ruta:** inne i den gamle rammen brukes de innebygde dataene som før. Havneenhetene og spillerens kaiplasser er tilpasset dem. Det pakkene har der, hoppes over, så ingenting tegnes to ganger.
  - Ruta testes mot hjørnene (`SENJAQ`, `inSenja`). Kantene bøyer seg bare millimetre.
  - Unntak: kaifrontene i Senja-ruta beholdes, fordi de bare brukes til NPC-plasser.
- **Utpakkingen:** en flis pakkes ut når den først etterspørres etter at pakken er kommet (`vecTile`). Det skjer i en web worker (`vecDecode` og `pierBoxes`, med kildeteksten sendt inn), fordi en by er titalls millisekunder arbeid.
  - Uten worker gjøres det på hovedtråden.
  - Bygg og veier kommer sortert per km-rute, så hovedtråden lager oppslagene uten å gå gjennom dem.
  - `VEC.came` og `VEC.drop` får beskjed når en flis kommer og går.
  - En flis mer enn 60 km fra båten og øyet slippes (`vecPrune`).
- **Oppslag:**
  - `roadsIn(boks)` gir Senjas veier og pakkenes. En veibit hører til flisa der midten ligger, så ingenting dobles ved flisgrensa.
  - `bridgesIn(boks)`.
  - `vecWant` laster pakkene for et utsnitt.
- **3D** (`view3d.js`):
  - `stream3d` laster `vec` innenfor 14 km.
  - Byggene leses gjennom `bldCells(key)`: Senjas `BLD` og pakkens, hver med egne tabeller og eget frø, slik at Senjas hus ser ut som før.
  - Når en flis kommer, bygges km-bitene på den på nytt.
  - Kameraets hindringer har flisa som merke og forsvinner med den.
- **Bruer, brygger og moloer per flis** (`tileStatics`, `tileStep`): bygges når flisas høyder er inne, noen få per bilde innenfor de ledige millisekundene (`MESHMS`). Tromsø-flisa var et halvt sekund i én jafs. Hver flis får sitt eget nett.
- **Brygger kartlagt som flater** (`slabInto`): tegnes i sin egen form, med dekke i striper på 1 m (kuttet der omrisset krysser stripas midte) og kaivegger langs kantene. Rektangelet rundt dem, slik Senjas små brygger er tegnet, la seg ut over vannet ved et stort kaiområde i Bergen. Kameraets hindringer er striper på 4 m.
- **Bruene** (`bridgeInto`): dekket var kasser på 18 m som sto vannrett hver for seg. Det ble som en trapp («pass på at brua ikke ser ut som en trapp», Jonas 03.10.2026).
  - Nå er dekket ett jevnt bånd over tverrsnitt hver 8. m, med gjæring i knekkene: veibane, kantdragere, rekkverk og en kassebjelke under som er smalere enn dekket og dypere jo lengre brua er (1,1–2,6 m).
  - Seilhøyden er som før, 3,6 % av lengden, mellom 6 og 42 m: Tromsøbrua rundt 38 m, Sandnessundbrua 42 m. Senjas 40 bruer er rundt 15 000 trekanter.
- **Moloene** («de beskytter jo som oftest båtene som ligger på kaiplassene fra dårlig vær og bølger», Jonas 03.10.2026; `moundInto`, `rockInto`): en steinfylling som høydefelt over den kartlagte formen, så knekker, L-former og runde molohoder blir riktige.
  - En omriss-polygon er vannlinja. En molo kartlagt som linje er midten av en fylling 16 m bred ved vannet.
  - Krona står rundt 2,8 m over middelvann, flat og grusa. «De fleste moloer har en vei på toppen» (Jonas, om Husøy-moloen): en vei over en molo legges på krona (`moundTop`, `addRoads`), og km-bitene under bygges på nytt når moloene til en flis er ferdige.
  - Sidene faller 1 : 1,4 til 6 m under: grå granitt over vann, mørk og tangete i tidevannssona. Løse plastringssteiner ligger i skråningene, og hver er en skjev og tippet stein, ikke en kasse.
  - Avstanden til formen regnes med en tostegs avstandstransform på et rutenett på 2 m (et par millisekunder for 600 m molo).
  - Det som ligger dypere enn 1,6 m, tegnes ikke, og krona er én stripe per rad. Senjas 35 moloer er rundt 35 000 trekanter. Den første versjonen var 107 000.
  - Steinene ligger i et eget lite nett per molo og tegnes bare innenfor 1,5 km fra øyet (`STONES`, `STONE_R`, `drawStones`). Lenger unna er en stein mindre enn en piksel. Normalen regnes fra pikslenes deriverte, og tusenvis av steiner for små til å se ga SwiftShader stopp på 11–30 s per bilde (`kinotest`, `sea3d`, `heattest` og `landtest` fikk tidsavbrudd). Uten at steinene ble tegnet, gikk testene som før.
  - Senjas moloer bygges på samme måte (de som en havneenhet ikke har tatt).
  - Moloene ligger som land i 25 m-masken (`region.breakwaters`). Vindsjøen nær land regnes langs stråler på den masken (`fetchFine`), så det er roligere bak en molo.
- **Kartplotteren** (`03-map.js`): veier fra z > 3 og bruer fra z > 2,5 hentes fra `roadsIn` og `bridgesIn`. Pakkene lastes for utsnittet, og kartet tegnes på nytt når en flis kommer.
- **Kaiplasser for NPC-båtene** (`07-harbours.js`: `quayFit`, `quayFree`, `npcBerths`; Jonas: «størrelsen på kaia skal bestemme hvor store NPC båten som kan ha anløp der»):
  - En front tar en båt når 90 % av lengden er båtens lengde + 2 m, og vannet utenfor er dypgående + 0,5 m. Ukjent dybde regnes som 3 m, og det er en gjetning.
  - Fronter ved et havnepunkt (der spilleren ligger) og ved en havneenhet holdes fri.
  - En havns båter får plass samlet, i rekkefølge, nærmeste front med plass først, parallelt med fronten og med siden mot kaia.
  - Senja-flåten (`FLEET`, med `L`, `B` og `T`) ligger ved slike fronter i havn og går derfra til leia over de første 450 m (`fleetState`). Finnes ingen front, ligger båten som før (`berthShift`).
- **Ytelse** (SwiftShader, sier lite om nettbrettet): Tromsø-flisa (33 687 bygg, 11 351 veibiter, 63 bruer, 612 bryggebokser, 25 moloer) pakkes ut i workeren. Bruene, bryggene og moloene er rundt 88 000 trekanter.

### 4.16 NPC-trafikk langs hele kysten (del 5, 04.10.2026)

Jonas valgte «Full trafikk langs kysten», men «NPC båtene skal kun dukke opp innenfor spillerens AIS område».

**Rørledningen** (`tools/map/npc.py`, `coast.py game`, fra `kart-6`):
- **Havner:** kaifronter på 12 m eller mer som ligger innenfor 250 m av hverandre, med minst 30 m front til sammen.
  - Flytebryggene i småbåthavner (bryggelinjer, slag 1) teller ikke, for der ligger fritidsbåtene.
  - Senja-ruta er utelatt, fordi `FLEET` er flåten der.
- **Flåte** (fra kart-7): én båt per 150 m front, 1–3 per havn og høyst 55 per flis, 4 137 langs kysten. Fiskeridirektoratet oppgir 4 614 aktive fiskefartøy i 2024. kart-6 hadde én per 45 m, 1–8 per havn og høyst 300 per flis, altså 19 411 båter.
  - Lengdene trekkes fra kystflåten: 45 % 7–10 m, 30 % 10–11 m, 15 % 11–15 m, 8 % 15–21 m og 2 % 21–28 m.
  - Bredden er 0,3·L + 0,9, og dypgåendet er 0,09·L + 0,6. Begge er tilnærminger.
  - Hver båt får en kaiplass som passer (samme regel som `quayFit`). Får ingen front plass, prøves en mindre båt.
  - Navnet trekkes fra en liste.
- **Felt:** 2–4 per havn, 20–150 m dypt og 3–22 km sjøvei unna, 2 km fra hverandre. Fra kart-7 ligger de minst 600 m fra land (helst 1 km), og et felt som en annen havn i flisa har valgt innenfor 2 km, får trekk. En havn uten felt (innsjøer og lommer) er utelatt, og en kaifront uten målt dybde gir ingen kaiplass. Feltene velges mest etter skråningen (dybdens gradient på 500 m) og litt tilfeldig.
- **Leia:** korteste vei på et 100 m rutenett av flisas 25 m-maske, rettet ut der masken er fri.
  - Først prøves et strengt rutenett der høyst én av 16 småruter er land, så et romsligere med fire.
  - Havner hvis munning ligger i samme 500 m-rute, deler beregningen.
  - Noen få leibiter skjærer et hjørne av 25 m-masken: 23 av 680 rundt Tromsø.
- Alt legges som JSON i flisas vec-pakke (`npc`). Det beregnes i parallell før pakkene skrives. Tromsø tar 5 s og Bergen 30 s.

**Spillet** (`core/05-vessels.js`):
- `coastState(båt, H)` er en ren funksjon av klokka, som `fleetState0`:
  - ut om morgenen fra kaiplassen til havnemunningen i havnefart, så leia til et av feltene
  - driv med vinden på feltet
  - hjem om ettermiddagen
  - inne i kuling (en større båt går ut i verre vær) eller på fridager
- `coastNear` regner bare båtene innenfor `AIS_KM` (15 km) fra båten du følger, og ber om pakkene der båten er.
  - Havner der verken båtplassene, leiene eller feltene kan komme innenfor, hoppes over.
  - Klokkeslettet regnes én gang per kall.
  - Det tar rundt 1 ms per kall for 200 båter ved Tromsø (stasjonær maskin).
- `npcStates` tar dem med som `coast:true`, med lengde, bredde, dypgående og lakk.
  - De tar ikke fisk fra bestanden: bare `FLEET` gjør det, og den har hver spiller.
  - De har AIS-kort og spor i kartet, og vises som fiskebåter i miniplotteren.
  - I 3D bruker de byggesettet (`npcMesh` etter lengde og bredde), som Senja-flåten.
- Båtene kommer bare i appen, siden de ligger i vec-pakkene.

**Rettet etter spilltesten 04.10.2026** (skjermbilde fra Toppsundet: båtene i klynger på sjøen og på land, og for mange):
- **Færre.** `vecDecode` beholder bare båtene med `fnv(id) < NPC_KEEP` (0,17, minst én per havn). Det gir rundt 22 % av kart-6s 19 411, altså rundt 4 300. Fiskeridirektoratet oppgir 4 614 aktive fiskefartøy i 2024 (kystmagasinet.no, «Stabilt antall norske fiskefartøy»). Med kart-7 er `NPC_KEEP` satt til 1.
- **Fridager og avreise.** 30 % fridager, og avreise kl. 4–8.
- **Spredt.** Hver båt har en egen plass 0,3–1,2 km fra feltets midtpunkt (`coastSpot`) og en egen vinkel på driften. Hvert kast slutter der det neste starter.
- **Ikke på land.** Før hvert kast sjekkes driften mot land: 25 m-masken der pakken er lastet, ellers kjernens 200 m (`coastLand`). Treffer den land, snus den, legges tvers eller halveres, og ellers ligger båten stille. Svaret lagres per båt og kast (`coastCast`).
  - Årsaken var at to tredjedeler av feltene ved Toppsundet lå under 500 m fra land, og driften (rundt 1 km med vinden) ble ikke sjekket.
- **Navnene i kartplotteren.** Båtene langs kysten får navn bare når kartet er under 4 km høyt. Ingen navn legges oppå et annet, styrt av et rutenett av navneceller i `renderDyn`.

**Test:** `npctest.py` (LITE) sjekker:
- at båtene bare er innenfor AIS-rekkevidden
- natt, dag og kveld
- at samme tid gir de samme posisjonene
- at hver båt ligger ved en front som passer
- at leiene holder seg unna land
- at ingen havn ligger i Senja-ruta
- at båtene ikke tar fisk
- AIS-kortet og sporet

### 4.17 Reglenes kartdata langs hele kysten (R1 av regelplanen, 04.10.2026)

Jonas: «Det neste vi må finne ut da er hvor grunnlinjen går langs hele kysten og hvordan regelverket er langs hele kysten». Og om artene: «Vi skal ikke fiske noe hummer i spillet», men «Kongekrabbe skal kunne fiskes i spillet! Det er viktig!»

**Kildene** (`tools/rules/fetch.py`, til `tools/rules/cache/`, ikke i git):
- **Kartverket, «Norges maritime grenser»** (CC BY 4.0), som GML i EPSG:25833 via nedlastings-API-et til Geonorge, fordi WFS-en svarer 500. Den har:
  - grunnlinja
  - linjene for 1, 4, 6 og 10 nm fra utøvelsesforskriften og plan- og bygningsloven
  - territorialgrensa (12 nm) og den tilstøtende sonen (24 nm)
- **Fiskeridirektoratets reguleringskart** (`Yggdrasil/Fiskerireguleringer`, ArcGIS REST, 38 lag, NLOD): alle lagene som GeoJSON i 25833, med sidevis henting.
  - Fire lag gir ingen geometri fra MapServer: 0 stengte felt, 18 og 19 gyte- og oppvekstområder, 40 rødspette.
  - De hentes fra WFS-en til `FiskeridirWFS_fiskeri`, som av og til feiler og derfor prøves på nytt. Feltnavnene der er andre og rettes.
- **Statistikkområdene** (`Yggdrasil/Statistikområder`): hovedområder (lag 6) og lokasjoner (lag 8) fra 2018.

**Utregningen** (`tools/rules/regler.py`, rundt 95 s), som gir `src/data/rules.json` (0,32 MB) i spillets ramme med koordinater i enheter på 10 m:
- **Grunnlinja for fastlandet** lukkes langt inne i land gjennom Sverige, Finland og Russland til flata «innenfor grunnlinja».
  - De offisielle linjene ligger i sine avstander fra grunnlinja i spillets ramme. 4 nm måles til 4,006 nm, og avviket er høyst 0,6 % (UTM-skalaen).
  - Innenfor grunnlinja stemmer med Kartverkets «land og indre farvann» i 99,8 % av sjøpunktene innenfor 60 km.
  - 2 nm-linja tegnes her fra grunnlinja.
  - Spillet regner avstanden til grunnlinja selv, så alle sonene følger av den.
- **Fjordsonene:**
  - **Grunnlaget:** Sjøen deles av linjene på spillets eget land (`land200`, 200 m). Linjene er fjordlinjene for kysttorsk (lag 2), kroklinjene i Finnmark (lag 5) og yttergrensa for Oslofjorden (lag 38).
  - **Når sjøen er innenfor:** En del av sjøen er innenfor en linjetype når havet ikke kan nås uten å krysse en linje av den typen.
  - **Ender som ikke når land:**
    - En linjeende som ikke når land i 200 m-kartet, forlenges i linjas retning til land, høyst 2,5 km.
    - En linje som ender på en holme (Akanes – Gisløy), føres videre til nærmeste store land (minst 20 km²), som forskriftens «linje og kyst».
  - **Sider og lommer:**
    - Siden av linja avgjøres av nærmeste linjebit.
    - Små lommer som veggen skjærer av (under 3 km²), slås sammen med den største delen på samme side.
    - Delene møtes over linja bare gjennom celler rett ved veggen, og der to linjetyper ligger oppå hverandre, telles ingen kryssing.
  - **Kroklinjene i Finnmark** lukker ikke alltid fjorden alene (Porsanger-linja går til Magerøya, og Magerøysundet er åpent). Derfor merkes heller fjordsonene på yttersiden av en kroklinje, den siden som ligger nærmest grunnlinja, som unntatt krokgrensa 1.11–30.4. Det er 7 slike flater.
  - **Ringer og ytterkant:** Ringene tegnes gjennom landet midt mellom sjøen innenfor og sjøen utenfor, og hjørnene ved linjene legges på linjene.
  - **Resultat:** 82 soner. Den største er 6 324 km² og går fra Troms gjennom Vesterålen til indre Vestfjorden.
- **Områdene** (lagene som angår spillet, `KEEP`): Flater som følger land i detalj (Oslofjorden, gytefeltene i sør, Henningsværboksen, Borgundfjorden), tegnes på samme måte gjennom land fra spillets 25 m-maske (50 m, eller 100 m for store flater). Da beholder de kantene ute i sjøen og mister detaljene langs fjæra. Oslofjordflata går fra 694 548 til 4 829 hjørner.
  - **Utelatt etter Jonas' ønske:**
    - hummer (9, 10), flatøsters, leppefisk, snabeluer, rødspette og steinbit
    - trål, snurrevad og seinot (4, 11, 13, 14, 32, 33, 35, 36)
    - Svalbard og havbeite
  - **Med:** Kongekrabbe (12, 30) er med, fordi arten skal inn. Av de stengte feltene (lag 0) er bare de for konvensjonelle redskap med.
- `python3 tools/rules/look.py` tegner kontrollbilder til `tools/rules/out/`. De viser grunnlinja, sonene og linjene over spillets land for nord, Senja, Vesterålen, Lofoten, Finnmark, Midt-Norge og Oslofjorden.

**Oppdatering:**
- `.github/workflows/regler.yml` kjører begge skriptene og legger resultatet som release `regler-N`. Den nyeste kopieres til `src/data/rules.json`.
- Workflowen startes ved endring av `tools/rules/regler.json`, hver mandag på standardgrenen, eller for hånd.
- De stengte feltene og stengningene for kongekrabbe skifter fra uke til uke. I spillet er de et øyeblikksbilde fra hentedagen, og de gjelder uansett spilldato.

**Svakheter:**
- Sonene følger 200 m-landet, så der sjøen er smal, kan de være 100–200 m feil.
- To forskjellige lesninger av forskriften står i koden og er dokumentert der:
  - holmene og de smale sundene
  - kroklinjene i Finnmark

### 4.18 Fiskemottakene langs hele kysten (M1, 04.10.2026)

Jonas ville ha et register over alle fiskemottak i Norge, med kaimottaket fra Blender ved hvert av dem (M2 og M3). Han ba også om at prisene ikke tas fra gamle sluttsedler: «Husk bare at prisene har utviklet seg mye med årene.»

**Kildene** (`tools/mottak/mottak.py`, til `tools/mottak/cache/`, ikke i git):
- **Fiskeridirektoratets kjøperregister** (NLOD): alle førstehåndskjøpernes anlegg, med type, kommune, adresse, koordinater og Mattilsynets godkjenningsnummer.
- **Fangstdata (seddel)** for de to siste hele årene (NLOD, rundt 1 million linjer i året).
  - Nøkkelen mellom registeret og sedlene er `Mottaksstasjon`, som er godkjenningsnummeret.
  - Bare landinger fra norske fartøy telles.
- **Norges Råfisklags mottakskart** (Nordmøre til Finnmark): type (fiskemottak, fryselager) og sone.
  - Kontaktperson, e-post og telefon tas ikke med.
- **Kartverkets adresseregister:** For anlegg uten koordinater i noen av kildene finnes punktet fra adressen.

**Resultatet** er `src/data/mottak.json` (0,12 MB) med 310 mottak (5 ble ikke funnet på kartet). For hvert mottak:
- **Hvem og hvor:**
  - navn, type og kommune
  - lat/lon og punktet i spillets ramme
- **Hva det tar imot i året:**
  - kilo, antall landinger og antall båter
  - redskapsgruppene
  - andelen fra båter under 15 m
- **Per art,** for spillets arter (torsk, hyse, sei, lyr, lange, brosme, uer, kveite, taskekrabbe og kongekrabbe):
  - kilo i året
  - andelen levert levende
  - månedene det tas imot, som maske
  - prisindeksen
- **Kaia** (`q`):
  - Det er nærmeste kaifront innen 600 m fra vec-pakkene (4.15). Kai eller brygge på minst 15 m med minst 2 m vann foretrekkes framfor kystlinje.
  - Feltene er punktet, normalens vinkel, lengden, dybden, typen og avstanden fra registerets punkt.
- **Tallene:** 266 mottak har spillets arter og er et fast anlegg (ordinært anlegg eller kaiselger). 255 av dem har en kai.
- **Kongekrabbe** tas imot ved 48 mottak, nesten alle i Øst- og Vest-Finnmark, med andel levende 0,9–1,0. Nord Senja Fisk har litt.
- **Prisindeksen** er det mottaket betalte for arten, delt på det de samme kiloene ville kostet til gjennomsnittsprisen for arten samme måned samme år. 1,00 er snittet.
  - Indeksen sier hvem som betaler godt eller dårlig, ikke hva fisken koster.
  - Spillet beholder sine egne priser (`SPECIES.pm`, Råfisklagets minstepriser).

**Oppdatering:**
- `.github/workflows/mottak.yml` legger resultatet som release `mottak-N`, og den nyeste kopieres til `src/data/mottak.json`.
- Den kjører den 3. hver måned, når `mottak.py` endres, eller for hånd.
- Kaiene trenger kartpakkene fra `tools/map/game.py`.

**Svakheter:**
- **Registerets punkt** er av og til kontoret og ikke kaia. Da kan kaia innen 600 m være feil kai.
- **Typen:** 15 anlegg har typen «NOT_TRANSLATED» i registeret, mest fryselagre og terminaler.
  - De som Råfisklaget kaller fiskemottak, regnes som ordinært anlegg. Resten blir «Annet anlegg».
- **Snitt over to år:** Kilo og landinger er snittet for de to årene. Et mottak som startet eller stengte i perioden, ser derfor halvt så stort ut.

### 4.19 Vektorkysten gjelder (04.10.2026)

Jonas: «Jeg vil ha bort det som er i magenta», og vannlinja skal være nøyaktig nok til at skjær og moloer stemmer. Fra nå er vektorkysten (`coast2`) fasiten for land og sjø i hele spillet, ikke 25 m-masken.

- **Dataene** (`tools/map/chart.py`, `coast2`):
  - Overtures landbiter slås sammen per flis (`unary_union`) før de forenkles til 3 m. Før ble hver bit forenklet for seg, og sømmene mellom dem ble glipper på opptil 3 m, som en landsjekk ville sett som vann.
  - Skjær ned til 4 m² beholdes (før 50 m²).
  - Moloene (`base/infrastructure`, klasse `breakwater`) utenfor landet kommer som egne ringer: klasse 2 (ytre) og 3 (hull). Flater brukes som de er tegnet, og linjer blir 12 m brede, som er et anslag. Mange moloer ligger allerede i OSM-kysten, for eksempel i Botnhamn, rundt 8 m brede. Masken gjorde dem 25 m brede.
  - Senjas kartpakker er bygget på nytt med `region.py senja`. Hele kysten bygges av `kart.yml` (`run` 8 i `kart.json`), og mellomlageret heter nå `coast2u-*`.
  - En flis med ny `coast2` har 504 ringer der den før hadde 1 060.
- **Kystindeksen** (`core/01d-coast.js`, `COAST`):
  - Hver kartflis får en indeks når pakken kommer (`coastEnsure`), laget i en worker (`coastBuild`). Flisa deles i ruter på 100 m. Hver rute har vindingstallet i hjørnet, med land og moloer talt hver for seg etter nonzero-regelen, og kantene som berører den.
  - Svaret i en rute med kanter regnes eksakt ved å telle kantene en krysser på vei fra hjørnet, ned langs rutas venstre side og bort til punktet. Hjørnene ligger utenfor hele meter (`COX`, `COY`), der punktene i dataene ligger.
  - `coastAt(p)` gir 1 (land), 2 (molo), 0 (sjø) eller −1 (ingen fin kyst). `coastDistM(p)` gir avstanden til kysten innen 100 m. `coastSegHit(a, b)` sier om en rett strekning krysser kysten.
  - **Målt for Senjas fire fliser:** 1,4 s i workeren til sammen, og 200 000 `isLand` på 73 ms (0,4 µs hver).
  - **Barrieren:** kartpakkene lastes rundt båtene, og indeksen er en del av `mapReadyAt`, `mapNeed`, oppstarten og autonav (`leiaFind1`). Simuleringen leser derfor aldri en flis uten indeks (`maptest`). Skjermene kan tegne ruter over fliser ingen har bedt om. Der gjelder masken til indeksen er klar (`COAST.soft` teller det).
- **Landsjekkene:**
  - `isLand` bruker indeksen der flisa har kartpakke, ellers masken. Havnelommene og mottakenes fyllinger gjelder som før.
  - Moloene er 8–12 m brede, og prøvene i `legClear` (hver 40. m), `groundCheck` (20 m), `clearLine` og `leiaLegOk` (8 m) og rorhjelpen (10 m) kunne gå rett over dem. Alle sjekker nå også strekningen med `coastSegHit`. Søkene i `approachPath` og `berthPath` gjør det mellom nabocellene, og en celle er land der `isLand` sier det om midten.
  - **Dybden** (`depthWater` i `03-simulation.js`): dybdelaget har 0 på maskens land. Nå regnes dybden bare av vanncellene, så vannet rett ved kysten har dybden til sine egne celler i stedet for å gå mot 0, ellers ville båter gått på grunn i vann kartet viser. Der alle fire cellene er land, brukes vanncellene to ruter ut. Der det ikke er noen, er dybden 2 m, som er et anslag for et sund masken tettet.
- **Kartplotteren:** masken tegnes ikke lenger som fjære (`chartRaster`). Landet er bare vektorkysten, med moloene. Bare mottakenes fyllinger males i rasteret, i samme farge som landet.

## 5. Systemer i spillet

### 5.1 Båter og utstyr

Båtene står i `VESSELS` (`core/02-species-gear.js`). Tallene er startverdier og anslag, og vekta er deplasement.

| Nøkkel | Typenavn | L × B × T (m) | Vekt (t) | Last | Motor, marsj/topp | Mannskap / køyer | Pris | Gruppe |
|---|---|---|---|---|---|---|---|---|
| `skiff` | Aluminiumsbåt 19 fot (5,9 m), 60 hk påhengs (etter Plate Alloy 5.9m Adventurer) | 5,9 × 2,45 × 0,6 (skroget 0,3, med motorbeinet 0,6) | 1,0 | 350 kg | 60 hk, 18/24 kn | 1+1 / 0 | 95 000 | åpen under 8 m (startbåt) |
| `trebat` | Gammel tresnekke 22 fot, 10 hk Sabb (1962) | 6,7 × 2,2 × 0,9 | 1,8 | 500 kg | 10 hk, 5,5/6,5 kn | 1+1 / 0 | 60 000 | åpen under 8 m |
| `snekke` | Plastsnekke 26 fot, 30 hk diesel | 7,9 × 2,7 × 1,2 | 3,0 | 900 kg | 30 hk, 7/8 kn | 1+2 / 0 | 245 000 | åpen under 8 m |
| `jukesjark` | Plastsjark 29 fot (8,9 m) | 8,9 × 3,2 × 1,2 | 5,5 | 1 800 kg | 150 hk, 8,5/10 kn | 1+2 / 2 | 750 000 | åpen 8–9,99 m |
| `sjark` | Havsjark 35 fot (10,6 m) med bakk og styrhus (etter Viksund Havsjark 35) | 10,57 × 4,1 × 1,6 | 12 | 6 500 kg | 180 hk, 8,5/10 kn | 1+3 / 2 | 1 150 000 | åpen 10 m og over |
| `hurtigsjark` | Brukt hurtigsjark 10,99 m, 500 hk | 10,99 × 3,9 × 1,6 | 12 | 5 000 kg | 500 hk, 17/22 kn | 1+3 / 2 | 4 900 000 | åpen 10 m og over |
| `sjarkny` | Ny hurtigsjark 10,99 m, 650 hk | 10,99 × 4,3 × 1,8 | 15 | 7 000 kg | 650 hk, 20/25 kn | 1+3 / 3 | 10 500 000, 45 døgn på verftet | åpen 10 m og over |
| `breisjark` | Sjark 36 fot med bakk og ly (etter Malo 36) | 10,99 × 4,2 × 2,0 | 20 | 10 000 kg (19 m³) | 300 hk, 9,5/10,5 kn | 1+4 / 4 | 9 000 000 | åpen 10 m og over |
| `kyst15` | Kystbåt 14,99 m med lugarer | 14,99 × 6,6 × 3,0 | 75 | 28 t | 750 hk, 10/11,5 kn | 1+5 / 6 | 18 000 000 | bare lukket gruppe |
| `kyst21` | Eldre kystbåt 21 m (1978) | 21 × 7,2 × 3,4 | 190 | 55 t | 900 hk, 10/11 kn | 1+6 / 8 | 9 000 000 | bare lukket, ikke innenfor fjordlinja |
| `snokrabbe` 🔒 | Snøkrabbefartøy 50 m med fryseri | 50 × 11 × 6 | 1 800 | 500 t fryst | 3 600 hk, 11/13,5 kn | 14 / 18 | 60 mill. | havfiske, konsesjon |
| `autoliner` 🔒 | Autoliner 45 m med frysing | 45 × 10,5 × 6 | 1 500 | 400 t fryst | 3 000 hk, 11/13 kn | 14 / 16 | 70 mill. (ny 300) | havfiske, konsesjon |
| `bunntral` 🔒 | Frysetråler 62 m med akterslipp | 62 × 14 × 6,5 | 3 000 | 800 t fryst | 8 000 hk, 12/15 kn | 25 / 30 | 150 mill. (ny 500) | havfiske, konsesjon |
| `pelagisk` 🔒 | Ringnot- og pelagisk tråler 75 m | 75 × 15,5 × 7,5 | 5 000 | 2 000 t RSW | 9 000 hk, 14/17 kn | 12 / 16 | 250 mill. (ny 800) | havfiske, konsesjon |

- **Feltene:** `len`, `beam`, `draft`, `disp`, `holdCap`, `iceCap`, `fuelCap`, `hp`, `engine`, `vcruise`, `vmax`, `accel`, `turnR`, `planing`, `outboard`, `diesel`, `fuelK`, `risk`, `crewMax`, `berths`, `tubCap` (bløggekaret), `land` (kasser eller kar ved levering), `std` (utstyr som følger med), `rigs`, `jukseMax`, `gearMax`, `svcH`, `svcCost`, `svcJobH`, `cls` (`open`, `kyst`, `hav`), `price`, `isNew`, `year` og `desc`. Havbåtene har også `priceNew`, `lock`, `crew` (nøkkelfolk og lag, bare data til havsteget) og `autoHooks`.
- **Ingen kode velger etter typenavn.** Alt leser feltene, og `vesseltest.py` feiler hvis `=== '<type>'` dukker opp i `src/js`.
- **Havbåtene (🔒)** har datablad og 3D-modell, men kan ikke kjøpes før havfeltene kommer vestover.
- **Køyer** styrer hvilen: uten køyer hviler mannskapet bare i land.
- **Prisene bygger på:** brukte 26-fots snekker til 30 000–340 000 kr, en brukt Selfa 10,65 m til 4,9 mill., nye 10,99-meteres sjarker til 9,5–12,5 mill., nye 14,99-meteres kystbåter til 23–70 mill. og brukte trålere uten kvote til over en halv milliard. Havbåtenes priser og vekt er grove anslag.

**Redskapsstige:**
- *Ingen fiskestang* (fjernet 04.10.2026 etter Jonas' liste): uten håndjuksa eller juksamaskin fisker ingen for hånd. «Jukse» sier fra og peker til butikken.
- *Håndjuksa med pilk og fire markkroker:* 1 900 kr, effekt 2,0 (doblet 04.10.2026: «350 kg på 9 spilltimer er for lite»).
- *Juksamaskin:* 34 000 kr, effekt 4,0 hver, altså dobbelt så mye som håndjuksa. Én person passer tre og fisker da ikke selv med håndjuksa (`JIG` i `03-simulation.js`).
- *Kveiteutstyr:* stor pilk, kraftig snøre og gaff, 2 490 kr.
- **Butikken «Fiskeutstyr»** (telefonapp `fiske`, i alle havner, «Fiskeutstyr på kaia» i Finnsnes) selger håndjuksa, is og kveiteutstyr. Et kjøp tar to trykk: det første viser prisen, det andre betaler, og kjøpet står i driftsloggen. Finnsnes har ikke isrenne, så butikken selger is i sekker for 2,00 kr/kg (`PRICE.iceBag`, vårt anslag). På mottakene kommer isen fra isrenna for 1,50 kr/kg. Handlingslinja har «Fiskeutstyr» og en isknapp med mengde og pris. Klær, elektronikk og juksamaskiner er i Utstyr-appen.
- *Garn, line og teiner:* passivt redskap som står i sjøen mens båten er borte. Se «Redskap i sjøen» i kapittel 9.
- *Halere* (`EQUIP`): elektrisk haler 38 000 kr (båter til og med 8,5 m, line og små teiner), linehaler 68 000, garnhaler 95 000 og teinehaler 58 000 (fra 7,5 m). Hva som passer hvilken båt, står som `fit:{minLen, maxLen, outboard}` og sjekkes med `equipFits(k, type)`. Uten haler trekkes garn og line for hånd og tar 2–2,5 ganger så lang tid. Store teiner kan ikke trekkes for hånd.
- *Plass til redskap* (`gearMax` i `VESSELS`, garn / stamper / teiner): skiff 6 / 4 / 20, tresnekke 8 / 6 / 30, snekke 15 / 10 / 50, 8,9-metersjark 25 / 14 / 80, sjark 40 / 24 / 150, hurtigsjark 50 / 26 / 180, ny sjark 60 / 30 / 200, bred sjark 120 / 40 / 400, kystbåt 15 m 160 / 60 / 500 og 21 m 300 / 120 / 800.

Mister du juksa, fisker bare juksamaskinene til du kjøper ny i Fiskeutstyr. `motor90` er et utstyrsvalg for båter med påhengsmotor (`boost`: 30 kn, mer drivstoff).

**Ekkolodd og sonar** (varmekartet i kartplotteren, se 5.14):

| Trinn (`HEAT.tiers`) | Utstyr | Varmekartet | Artsvalg |
|---|---|---|---|
| `basic` | Enkelt ekkolodd, alle båter har det | 1 nm i diameter, ruter på 100 m, fire trinn | Nei |
| `chirp` | CHIRP-ekkolodd, 13 900 kr, 3 t å montere | 1,5 nm, ruter på 60 m, glatt | Alle, torsk, hyse, sei |
| `sonar` | Sonar (søkelys), 150 000 kr, 16 t, båter fra 10 m | 3 nm, ruter på 80 m, oppdateres hvert 2. minutt, viser hvor stimene trekker | Alle, torsk, hyse, sei |

- Sonarens pris og monteringstid er antakelser. Delene til en Furuno CH-37BB koster rundt 13 200 USD før montering (fant ingen norsk pris), og båten må på slipp for senkerøret.
- Ekkoloddet og sonaren slås av og på i sidepanelet i plotteren (`S.settings.echo`, `S.settings.sonar`). Av betyr ingen varme, og ekkoloddet slutter å tegne. Fartøy-appen merker dem «(av)».
- En montering som venter mens båten byttes til en type utstyret ikke passer, betales tilbake (`finishJob`).

**«Neste mål»** står øverst i Båthandel og som en linje på telefonens hjemskjerm, og følger stigen: håndjuksa, første juksamaskin, blad B (landingsdager og verdi, knapp til Papirer), første båt med hjemmel (egenkapitalen banken krever), neste hjemmel opp, kystbåten på 14,99 m og «Havfiske» (kommer). De to neste stegene vises.

**Båthandel** (Verft → Båthandel, `market()` og `sheet()` i `ui/05-phone.js`):
- Fanene er Åpen gruppe, Med hjemmel, Kystflåten og Havfiske. Hvert kort har et sideriss i SVG (`vesselSVG`, laget fra den samme 3D-spesifikasjonen, så det virker uten WebGL), navn, mål og pris.
- Databladet har Generelt (pris, mål, vekt, lasterom, is, drivstoff, motor, fart, mannskap, køyer, hva båten tåler, gruppe og fjordlinja), Redskap, Hjemmel og Mannskap om bord, og knappene «Kjøp og bytt inn», «Kjøp til flåten» og «Se båten i 3D».
- «Se båten i 3D» (`G3.showroom(type)`) viser båten flytende utenfor havna med et kamera som går sakte rundt. Brikka `#showChip` har navn, mål og «Tilbake».
- Før rederiet har en båt i lukket gruppe, kjøpes en båt i åpen gruppe bare ved å bytte inn den du har. Et rederi kan ha én båt i åpen gruppe.

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
- **`density(sp, p, H)`** er den ene kilden for fisk i spillet: fangst, ekkolodd, varmekart, garn, line, jukse-spillet og pubrykter. 30 × `density` × innsats er kg i timen (én person med håndjuksa har innsats 2). Den er delt i `denPlace(p)` (det alle arter deler: land, dybde, eksponering, helling og avstand til feltene), `denTime(H)` (sesongtallene, lagret for én time) og `denSp()` (artens egen sum). Delingen ga nøyaktig de samme tallene (kontrollsum over rutenett rundt alle feltene).
- **Fisken trekker** (`hotspot`, `HOT`): Gode flekker på et mønster på 3,5 km. To felt overlapper hele tiden, hvert glir sin vei med 0,7–1,7 km i døgnet og toner inn og ut over 240 timer. Før hoppet hele mønsteret hver 120. time. Snittet er det samme som før (0,742 mot 0,737).
- **Stimer** (`school`, `SCHOOL`): et finere mønster (400 m) som svømmer 0,5–1 km i timen i hver arts egen retning. Det gir ±15 % og er 1 i snitt, så fangsten over en dag er den samme, men bittet på ett sted kommer og går i løpet av en halvtime. Sonaren viser retningen (`schoolDrift`).
- **Bestanden** (`STK`, `S.stock`, ruter på 2 km): Den leses mellom de fire nærmeste rutene (`gridBilinear`), og fangsten trekkes fra de samme fire med samme vekter (`stockW`). Nedtrekket der du fisker er kg/K·Σw², altså mykere enn før, men det samlede uttaket er det samme. Gjenveksten har et minste steg og runder til 1e-4, så en rute kommer helt tilbake til 1: en rute på 0,5 er full igjen etter rundt 42 dager. Før stoppet den på 0,876, og krabbe på 0,667. Krabbe (`S.cstk`) er fortsatt én verdi per rute, som før, fordi teinekalibreringen hviler på det og varmekartet ikke viser krabbe.
- **Fangst:** `density() × luck(sp) × targetF(sp) × innsats × værstraff`, deretter trekkes hver fisk for seg med egen vekt.
  - Fisk under minstemålet slippes.
  - Kveite i fredningstiden eller over 100 kg slippes.
  - Uer utenfor juni–august er bare bifangst (×0,15).
- **Kalibrering** (én person med håndjuksa, 8 timer, etter doblingen 04.10.2026):
  - Skreidag på godt felt: full last på skiffen (350 kg) på rundt halve dagen.
  - Juli: rundt 270 kg (før doblingen 140).
  - Seistim i mai: full last.
  - `tests/simday.py` kjører også dekksarbeidet, ellers stopper fisket når bløggekaret er fullt (60 kg). Dekket holder følge: juli ga 269 kg mot 140 før. Den skriver ut innsatsstigen 2 : 4 : 8 for håndjuksa, én og to maskiner (og 0,35 for den gamle stanga, som ikke brukes lenger).
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
  - Under totalen kommer trekkene i oppgjøret, så «Lott til mannskapet» og «Til kassa». Kassa får nøyaktig total minus trekk og lott. Gebyret for småkrabbe står som en merknad under, fordi det kommer fra Fiskeridirektoratet og ikke står på seddelen.
  - **Trekkene** (E2 av økonomiplanen, 04.10.2026, `TREKK` og `trekkOf` i `03-simulation.js`), som Råfisklaget trekker dem:
    - **Lagsavgift:** 0,43 % av totalen (ferske produkter fra 1.7.2026).
    - **Av totalen minus lagsavgiften:**
      - pensjonstrekk til Garantikassen for fiskere: 0,4 %
      - produktavgift til folketrygden: 1,6 % fra 1.1.2026
      - fiskeriforskningsavgift: 1,35 %
      - ressursavgift: 0,42 %
      - kontrollavgift: 0,22 %, bare fra fartøy på 15 m og mer, fordi den ennå ikke er innført under 15 m
    - **Til sammen:** rundt 4,2 % under 15 m.
    - **Lotten:** Mannskapets lott regnes av det som er igjen etter trekkene. Det er en antakelse, fordi lottavtalene regner etter felles utgifter.
    - **Lagring:** I `S.sales[].d.tk` og `S.lastSale.tk`. Salg-fanen viser dem som én linje.
    - **Balansen:** Inntekten blir 4 % lavere, så `progweek` er kjørt på nytt. Blad B og inngangen til lukket gruppe er fortsatt innen rekkevidde: dag 32 med en tur annenhver dag, og dag 18 med tur hver dag.
  - **Papirene og foretaket** (E1, 04.10.2026, `MVA`, `mvaOf` og `mvaCheck` i `03-simulation.js`):
    - Papirer (under Sjømann) har ervervstillatelse for hver båt (deltakerloven § 4; under 15 m holder det at du er aktiv fisker) og kortet «Foretaket».
    - Du trenger verken ENK eller AS for å fiske. Når salget passerer 50 000 kr på tolv måneder (merverdiavgiftsloven § 2-1), registreres fisket som ENK i Enhetsregisteret og i Merverdiavgiftsregisteret (`S.mva`, med et fiktivt org.nr.). Det kommer en melding fra Brønnøysundregistrene.
    - Etter det står MVA 11,11 % (§ 5-8) på sluttseddelen, regnet av totalen minus de offentlige trekkene, og like stor «MVA videre til staten». Netto er null.
    - **Forenkling:** Inngående MVA på diesel og utstyr kommer ikke tilbake, så prisene i spillet regnes som uten MVA.
  - **Lott eller hyre** (E3, 04.10.2026, `HYRE`, `hyreAsk` og `payHyre` i `04-crew.js`):
    - Hvert mannskap kan gå på lott (som før) eller på hyre. Bytte gjøres med knappen på mannskapskortet i Rederi-appen (`cpay`).
    - **Hyre** er en fast dagslønn (`c.hyre`), betalt ved midnatt (`hourly` i `06-services.js`) for hver dag mannskapet er ansatt, også når båten ligger. Den som går på hyre, får ingen lott i `sell()`.
    - **Hyra mannskapet ber om** er 90 % av det lotten de ønsker ville gitt i en uke med 6 000 kr om dagen i fem dager, fordelt på sju dager. Dette er et anslag, ingen tariff. Moralen følger hyra mot det de ba om, med litt ekstra fordi den er trygg.
    - **Ingen arbeidsgiveravgift** på hyre til mannskap på fiskefartøy. Produktavgiften dekker den (folketrygdloven § 23-5, Skatteetaten «Hyre til mannskap på fiske-, småhvalfangst- og selfartsfartøy», funnet med søk 04.10.2026).
    - **Ikke ennå:** Salg-fanen regner fortsatt mannskapets andel som lott for alle.
- Alle priser i spillet er per kilo **rund vekt**.

### 5.5 Kvoter og regulering

Kvotesystemet ligger i `core/03d-quota.js` (04.10.2026, plan Q1–Q6). Grunnlaget er forskriften slik den sto fra 1. oktober 2026 (J-161-2026, fiskeridir.no), Fiskeridirektoratets saksdokument 5/2025 til reguleringsmøtet og kvoterådene fra Havforskningsinstituttet. Kildenotatet med alle tall og lenker ligger under kapittel 6.

- **Fra totalkvote til fartøykvote** (`norQuota`, `codChain`, `yearQuota`):
  - **Norges kvote av torsk** = (TAC + 21 000 − tredjeland)/2 + 6 000. Formelen treffer 2019–2025 eksakt. Tredjelandsandelen 13,455 % er regnet ut fra § 2 for 2026. Hyse og sei følger TAC i samme forhold som i 2026.
  - **Fra toppen trekkes:**
    - forskning 880 t
    - ungdoms- og fritidsfiske 7 000 t
    - kystfiskeordningen (0,9 %, minst 3 000 t)
    - levendelagring 500 t
    - rekrutteringskvoter: 2 543 t i lukket og 450 t i åpen gruppe
  - **Åpen gruppe får 6,62 %.**
  - **Trålstigen:** 28 % til trål når resten er under 130 000 t, stigende til 33 % ved 330 000 t.
  - **Av det konvensjonelle:** havfiskeflåten får 12,81 % og lukket gruppe 87,19 %.
  - **Lukket gruppe:**
    - Den gir ferskfiskordningen sin del.
    - Resten fordeles med Finnmarksmodellen: 27,83 / 26,31 / 26,43 / 19,43 % på hjemmelslengdene under 11 / 11–14,99 / 15–20,99 / 21–27,99 m, pluss rekrutteringskvotene under 15 m.
  - **Kontroll mot 2026:** Kjeden gir § 5 for 2026 eksakt (9 257 / 72 945 / 19 164 / 19 036 / 17 407 / 12 796 t). `quotatest.py` sjekker det.
- **Åpen gruppe** (§§ 21, 26, 27):
  - Maksimalkvoten for 2026 var 4,0 / 5,6 / 6,4 t og den garanterte 3,0 / 4,2 / 4,8 t (under 8 m / 8–9,99 m / 10 m og over).
  - Senere år skaleres kvotene med gruppekvoten. Maksimalkvotene ganges i tillegg med en trukket faktor på 0,75–1,15 for hvor stramt direktoratet setter dem. Den garanterte kvoten er aldri over maksimalkvoten.
  - Hyse og sei har ingen maksimalkvote. Den garanterte kvoten skaleres med Norges kvote.
- **Lukket gruppe** (§§ 16, 18, 19, `HJ` og `licQ`):
  - **Torsk:** kvotefaktor × årets kvoteenhet for gruppen. I 2026 er enheten 8,4172 / 7,2662 / 6,9986 / 6,9982.
  - **Hyse og sei:** garantert kvote og maksimalkvote etter båtens største lengde, skalert med Norges kvote. Hyse under 11 m har ingen grense, slik det er fra 31.08.2026.
  - **Hjemmelslengder spillet selger:** under 7 m, 7–7,9, 8–8,9, 9–9,9, 10–10,9, 14–14,9 (`kyst15`) og 20–20,9 m (`kyst21`, 21 m).
  - **Ingen lengdegrense:** Deltakerforskriften for 2026 har ingen største lengde knyttet til hjemmelslengden, bare under 500 m³ lasterom.
  - **Over maksimalkvoten** kan en landing ha 30 % hyse og 20 % sei. Resten inndras ved levering.
- **Bestand og totalkvote** (`STOCK`, `stockYear`, `stockF`):
  - **Historikken** for gytebestand og totalkvote 2014–2026 er fra HI.
  - **2027:** Rådet er 312 667 t torsk, 180 336 t hyse og 127 807 t sei. TAC settes til rådet eller inntil 8 % over (torsk; i 2026 var den 5,8 % over).
  - **Fra 2028** gjelder en enkel modell per lagring:
    - Bestanden trekkes mot et langtidsnivå med tilfeldige årsklasser, og fiske over rådet holder den nede.
    - Rådet ∝ SSB^0,55 under B_pa.
    - Endringen er høyst ±20 % per år over B_pa (sei ±15 %).
  - **Fisketettheten** følger kvadratroten av gytebestanden mot mars 2027, for torsk, hyse og sei.
  - **Frøet** er `S.qseed` per lagring, så verdenen er ulik fra spill til spill.
- **Åpen gruppe gjennom året** (`qyOf`, `qyStep`, `qyAt`, `S.qy`):
  - **Flåten:** Rundt 2 100 virtuelle båter fisker gruppekvoten ned dag for dag. Fangsten avhenger av sesongen, været (vind under 12 m/s), bestanden og maksimalkvotene de har igjen. Antall båter og hvor hardt de fisker, trekkes for hvert år.
  - **Stopp:** Direktoratet stopper med en ukes varsel i Kystposten når gruppekvoten ser ut til å bli fisket, men bare før 1. juni.
  - **Økning:** Maksimalkvotene økes 1. mai og 1. juni når båtene ikke kan ta gruppekvoten.
  - **Fritt fiske** kan komme om høsten.
  - **Din fangst** teller med.
  - **Kalibrering mot 2019–2026** (`k = 0,02`):
    - Med 2026-kvotene kommer stoppen i snitt 20. april (16. april i virkeligheten).
    - Rundt en tredjedel av årene har ingen stopp (3 av 8 år i 2019–2026).
  - **Lagring:** Året regnes ut dag for dag fram til i dag og lagres, så en varslet stopp står fast.
- **Ferskfiskordningen** (`ffPlan`, `ffPct`):
  - 20 % fra 29. juni.
  - Om høsten trekkes en endring etter historikken for 2017–2025:
    - økt til 30–50 % mellom 15. september og 25. november i rundt 70 % av årene
    - nedgang som i 2023
    - stopp som i 2019
    - ofte 10 % før jul
  - Kystposten melder endringene.
- **Rekkefølge ved levering:** ferskfisktillegget først, så kvoten, og resten inndras. Verdien av inndratt fisk trekkes fra.
- **§ 29 ved båtbytte:**
  - Det eieren har fisket i åpen gruppe i år, følger med til neste båt i åpen gruppe (`S.openUsed`).
  - En båt som tar over en hjemmel, starter året med det selgeren har fisket (`sellerCod`).
- **Registeret i lukket gruppe** (`REGN`, `npcReg`):
  - Torsk nord hadde 1 622 deltakeradganger per 17.10.2025. I spillet er de fordelt på hjemmelslengdene spillet selger, og hver har en NPC-eier.
  - Kjøper du en hjemmel, går eieren ut, så det blir én NPC mindre. Strukturering tar båten ut for godt.
  - Når spillet får ekte spillere på en felles server, tar de plassene til NPC-ene i det samme registeret (se veikartet i kapittel 9).
- **Kvotehandel** (Kvote-appen → Marked):
  - **Strukturkvote for 11–27,99 m** (J-244-2025):
    - Du kjøper en hjemmel i samme gruppe, hogger båten og får kvotefaktoren minus 10 %, for 20 år.
    - Kvotetaket er 3× egen kvote for 11–14,99 m og 4× for 15–27,99 m.
    - Når tiden går ut, går kvoten tilbake til gruppen (`structExpire`).
  - **Den særlige kvoteordningen under 11 m** (fra 2025): To egne båter med hjemmel, begge eid siden året før. Den ene oppgir hjemmelen og selges, og den andre fisker begge kvotene. Ingen avkorting, etter min lesning.
  - **Kvotesamarbeid (§ 31):**
    - Samarbeidet er med en NPC-eier, som mønstrer på (begge eierne skal være om bord).
    - Hans kvote kommer om bord for året, og han får halvparten av verdien av torsken som landes på den. Andelen er en antakelse.
    - Han går i land ved nyttår.
  - **Leie av kvote** er ikke med. Det er ikke lov å overføre fangst eller kvantum til en annen båt (§ 30).
- **Kvote-appen:** fanene Mine kvoter, Åpen gruppe (gruppekvote, fisket så langt, stopp, økninger og ferskfisk), Bestand (graf over gytebestand og totalkvote med B_pa og B_lim) og Marked.
- **Kystposten:** stoppvarsel og stopp, økning, fritt fiske, endringer i ferskfiskordningen, kvoterådet for neste år (26. juni), totalkvoten (17. oktober) og reguleringen for neste år (19. desember).
- **Kvoteprisen** (`KPK`) står på 260 kr/kg. Jeg fant ingen kilde for kvotepriser (se kapittel 10). Med større kvoter i 2027 koster hjemlene mer, og inngangen til lukket gruppe kommer litt senere i `progweek`.
- **Blad B** (`BLADB`, `S.fm`, `fmLand` i `sell()`): Deltakerloven § 6 krever at den som får ervervstillatelse, har drevet ervervsmessig fiske i minst tre av de siste fem årene (lov 26. mars 1999 nr. 15, Lovdata). Blad B i fiskermanntallet er det vanlige beviset. I spillet er det forenklet til 10 landingsdager med deg om bord og 1 G i førstehåndsverdi (130 160 kr, G fra 1. mai 2025, nav.no). Fiskeridirektoratet sender melding, Papirer i Sjømann-appen har et kort med fremdriften, og en båt med hjemmel krever blad B. Gamle lagringer får det fra sluttsedlene, eller med en gang hvis de har en hjemmel.
- **Finansiering** (`deal()`, `finance()`, `payDown()` i `core/03-simulation.js`):
  - Kystbanken låner inntil 80 % av prisen til 6,9 %, over 15 år for båt med hjemmel og 10 år ellers, og krever tre sluttsedler.
  - Innbytte og salg innfrir lånene først, og bare resten teller som egenkapital (smutthullet fra spilltest 1 er tettet). All gjeld til sammen holdes innenfor 80 % av verdien på flåten med den nye båten.
  - Innovasjon Norge toppfinansierer det første kjøpet i lukket gruppe med et risikolån på 15 % (`INN`) til 8,9 % over 10 år (`S.loanIN`, eget kort i Bank). Da trengs 5 % egenkapital, rundt 61 000 kr med skiffen i bytte. Vilkårene er ikke sjekket, og andelen er satt med `progweek.py` slik at inngangen kommer sammen med blad B.
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
- **Egenskaper** (1–5): erfaring, styrke, utholdenhet, teknisk, kokk og sjømannskap. **Redskap og dekk** (`c.gear`): juksa, line, garn, teiner, sløying (`sloy`), ising (`is`) og krabbesortering (`sort`). Dekksferdighetene ble lagt til 01.10.2026, og gamle lagringer får dem ut fra erfaringen (`deckSkills`).
- **13 trekk:** arbeidsjern, kranglefant, spøkefugl, grinebiter, perfeksjonist, lokalkjent, sjøsyk, ølglad, lærevillig, rastløs, makelig, omsorgsfull og stolt. Alle har fordeler og ulemper, se `TRAITS` og `crewEff`.
- **Trivsel** drifter mot et mål:
  - Utgangspunkt 60, pluss (lott − ønsket lott) × 300.
  - Pluss eller minus opptil 12 for ukesinntekt mot forventning.
  - Mat: (matstell − 3) × 3, der matstell er snittet av de fire siste måltidene (5.19).
  - Minus (slitenhet − 50) × 0,5.
  - Minus kulde × 50.
  - Minus grov sjø, med ekstra straff for sjøsyke.
  - Trekkeffekter, nag × 5, brudd på hviletid −8, og uløst konflikt −10.
  - Driftshastighet 0,04 per time (0,07 for rastløse).
- **Oppsigelse:** Under grensen i mer enn 36 timer fører til oppsigelse i neste havn. Grensen er 22, 30 for rastløse og 15 for grinebitere.
- **Slitenhet:** +6 per time ved fiske og +3 ved seiling, skalert med utholdenhet og høyere om natta. Den som tar pause, blir mindre sliten: faktoren er 0,4 + 0,6 × andelen av timen personen jobbet. Den går ned med 8 per time i havn.
- **Hviletid:** per person etter forskriften, se 5.19. Brudd gir en melding per døgn, 1,5 ganger raskere slitasje og −8 i trivsel.
- **Kjemi** (`compat`): trekk, samme hjemsted, aldersforskjell over 30 år, og nag.
- **Konflikter** (`S.cevt`):
  - Mellom mannskapet (`PAIR_TOPICS`): løses ved å snakke med dem, ta parti, gi fri eller si opp.
  - Med skipperen (`BOSS_TOPICS`): løses ved å høre på, stå på sitt eller si opp.
  - Uløst etter 12 timer blir det verre, og etter 48 timer mønstrer noen av.
- **Utvikling:** Ferdighetene vokser med stasjonen personen faktisk står på (5.19). Erfaring og sjømannskap vokser i tillegg hver 40. time på sjøen, dobbelt så fort for lærevillige. Skjulte trekk avsløres etter 12 timer på sjøen.
- **Rettet 01.10.2026:** `crewQuit` avbrøt resten av `crewTick` den timen, og juksing trente feil redskap etter garn (`lastGear`). Begge er borte.
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

**Ny haill fra 04.10.2026** (Jonas' liste, `HAILL` i `03-simulation.js`). To typer, og kveithaillen er borte. En gammel kveithaill blir vanlig haill.

| Type | Pris | Trinn (fiskelykke på alle arter og alt redskap) |
|---|---|---|
| Haill | 29 kr | fersk +100 % til 48 t, mellomhaill +50 % til 72 t, gammelhaill +25 % til 96 t, borte |
| Luksushaill | 59 kr | +200 % til 48 t, så fersk +100 % til 96 t, mellom +50 % til 120 t, gammel +25 % til 144 t, borte |

- `luck(sp)` = 1 + `haillBoost()`. Trinnene står i `steps`. `haillStage()` gir navnet, og `haillLeft()` gir timene som er igjen.
- **Beholdning:** et kjøp eller en pubpremie legges i `S.haillInv` (`giveHaill`). «Aktiver» i Haill-appen tar en derfra (`useHaill`). Er det allerede haill om bord, må du bekrefte at den byttes ut. **Haill aktiveres aldri av seg selv.**
- +200 % er Jonas' valg («så kan vi eventuelt justere det ned om det blir for sterkt. Målet er jo at det skal være fristende å kjøpe»). Sammen med juksa ×2 gir luksushaillen seks ganger fangsten fra før 04.10. Det må måles i spilltest.
- Haillen vises i HUD («Luksushaill +200 %») og som pynt på gelenderet i 3D (gullhestesko eller liten fisk).
- **Pubrunden** (`PUBW`):
  - 1 000 kr i spillkroner, én gang per spillkveld mellom 15:00 og 03:00, bare i havn.
  - Lykkehjulet (fra 04.10.2026): haill 12 %, luksushaill 3 %, rykte 25 % og tomhendt 60 %. Premien legges i beholdningen. Oddsen vises.
  - Runden betales og lagres før hjulet snurrer, så premien overlever at appen lukkes (A4). Kvelden går fra 15:00 til 03:00 (A3).
- **Første gang er luksushaill gratis** i veiledningen «Første tur», og Haill-appen forklarer da hva haill ellers koster. Steget ber deg også trykke «Aktiver».

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
  - Akselerasjonen står i `accel` (kn per minutt): skiff og ny sjark 10, hurtigsjark 9, deplasementsbåtene 1,5–3 og havbåtene 0,8–1. Nedbremsing går 1,5 ganger så raskt.
  - 5 kn innenfor 250 m fra en havn.
  - Bremsing før neste stopp (havn eller fiskeplass) langs ruta.
  - `livePose` bruker samme fart som neste steg.
- **3D-følgeren** (`updateBoat`):
  - Styrer mot et punkt litt lenger fremme på ruta (pure pursuit).
  - Svingradius `turnR` i `VESSELS`: skiff 35, tresnekke 30, snekke 45, 8,9-metersjark 50, sjark 70, hurtigsjark 75, ny sjark 80, bred sjark 85, kystbåtene 110 og 150 m.
  - Dreiepunktet ligger en tredel fra baugen, så hekken slår ut.
  - Sideskrens: β = 0,14·yawrate, begrenset til 0,18 rad.
  - Planende båter krenger innover (−0,18·yaw), deplasementsbåter utover (+0,06·yaw).
  - Båten flyttes direkte til simuleringens posisjon hvis den er mer enn 900 m unna.
  - `G3._debug.stepBoat(dt, t, frac)` brukes til frakoblet testing med 60 bilder i sekundet.
- **Fiskeanimasjoner:**
  - Håndjuksa: snelle med sveiv på ripa, og én til fem fisk på pilk og markkroker.
  - Juksamaskiner: haler selv.
  - Figuren har armer som tegnes live (`limbM`, armløs kropp + rør).
  - Fiskekaret regner bort fisk som fortsatt er i lufta.
- **Jukse-spillet** (`JIGG` i `ui/10-rod-acts.js`, 04.10.2026, erstatter stangfisket): «Jukse selv» i skuffen når du jukser for hånd i 3D.
  - Mens du spiller, går din egen del av juksefangsten (`jigMeShare()` i `03-simulation.js`) ut av den automatiske fangsten og kommer gjennom nappene dine i stedet, i samme takt i snitt (`kgps`).
  - Ved napp sveiper en nål over en stripe på 1,4 s. «Rykk!» innenfor ±0,06 s av midten gir 2× (pilk og markkrok), ±0,15 s gir 1,5×, ±0,3 s gir 1×, og ellers 0,5× (fisken slapp halve gangen). Ikke noe trykk regnes som 0,5×.
  - Et napp er verdt det som har kommet til siden forrige napp, og leveres som hele fisk. Resten tas med til neste napp. Nappene kommer 5–40 s fra hverandre (4–8 s på første tur).
  - 3D viser vanlig håndjuksing med fisken som kommer opp (`CATCHQ`).
  - Testkroker: `JIGG.grade(off)`, `_bite()` og `_hit(off)`.
- **Båtmodellene** (`src/js/vessel3d.js`, eget `<script>` før `view3d.js`, uten WebGL):
  - `VB()` er byggeren (det gamle `NB()` uten GL), og `lod` styrer oppløsningen. I `view3d.js` er `NB = VB + mesh()`.
  - `hullShape(H)` lager skroget fra parametre (rund eller hard kimming, baug- og hekkform, flare, spring, skansekledning, bulb), og `hullBuild` lager skrog, kjøl, ror, speil, dekk, skansekledning og ripe med fargebånd.
  - Delene: styrhus med vinduer og ratt, overbygg, baksadekk, skorstein, mast med radar og lanterner, eksos, rekker, flåter, fendere, galge, halere, davit, kar, teiner, motorkasse, toft, rorkult, juksamaskiner, haleport, nottrommel, og for havbåtene portal, akterslipp, tråldører, kran, kraftblokk og notbinge.
  - `SPEC3D[type]` beskriver hver båt. `buildVesselModel(type, lod, livery)` gir `{o, glass, cap, geo}`, og `geoOf(type)` gir det `view3d.js` trenger (øye og ratt, dekket, lanterner, flagg, haler, påfylling, plass for mannskapet). Skiffen har fortsatt den håndbygde modellen (`hand:true`).
  - Glasset tegnes blandet etter resten, og åpne skrog får dybdemasken (`cap`) som holder sjøen ute.
  - Budsjettet er 25 000 punkter for kystbåtene og 45 000 for havbåtene. Kystbåtene ligger på 11 000–22 000 og havbåtene på 19 000–23 000, og hver bygges på under 15 ms.
- **Detaljerte modeller fra Blender (GLB, fra 02.10.2026):** Byggesettet over holdt ikke målet om realistiske båter. Første båt laget på den nye måten er `breisjark`, 36-fots Malo-sjarken. Den andre er `sjark`, Viksund Havsjark 35 (se under).
  - **Kilden** er et skript, `tools/boats/malo36.py`, som kjører Blender som Python-modul. Installer med `pip install bpy==4.5.4` og kjør `python3 tools/boats/malo36.py`. Det skriver `src/data/boat-malo36.b64` (GLB, rundt 0,9 MB) og `src/data/boat-malo36-side.b64` (sidebildet til Båthandel, WebP). Med `fast` hoppes bildene over, og med `check` lages bare overlegget. Bildene havner i `tools/boats/out/` (ikke i git).
  - **Målene** er tatt fra generalarrangementet for 36 fots Malo-sjark 10,99 m (Jemar Norpower, 2014) og databladet: lengde 10,99 m, bredde 4,20 m, dybde 2,34 m, høyde med mast rundt 9,5 m, lasterom 19 m³ og 300 hk. Stasjonene på tegningen står 1 m fra hverandre (92,4 px/m), og profil og dekksplan ble målt til tabeller i skriptet: kjøl og forfot, stevn, ripe, halvbredder, styrhus, ly, vinduer og rigg. Tegningen er ikke i repoet. Overlegget (`ov_side_on_ga.png`, `ov_top_on_ga.png`) legger modellen oppå tegningen, og den treffer i profil og plan. Under vannlinja og i tverrsnittene er formen mitt valg: bunnreisning, rund kimming med radius og utfall.
  - **Bare eksteriør** (Jonas' krav). Styrhuset har mørke innervegger, konsoll og ratt, slik at vinduene ser ut som glass og rattkameraet ser ut.
  - **Fila:** Tre deler: full detalj (rundt 26 600 trekanter), glasset, og en enkel utgave (rundt 2 800 trekanter) for NPC-båter fra 300 m til 1,5 km. Posisjonene lagres som 16-bits heltall, og normaler og farger som bytes (KHR_mesh_quantization). Fargens alfa er glans. `_PAINT` har lakksonen (1 = skroget) og den innbakte skyggen, så en fargedrakt kan male om skroget. Skyggen er bakt med Cycles. Alle flater må vende utover, ellers blir både lyset i spillet og skyggen feil (`orient`/`out` i `bpyutil.py`).
  - **I spillet:** `glbParse` og `glbModel` i `vessel3d.js` leser fila første gang typen vises. `buildVesselModel` bruker den når siden har et dataelement `glb-TYPE`, og ellers byggesettet. Dataene ligger i `<script id="glb-breisjark">` og `<script id="pic-breisjark">` med `type="application/octet-stream"` i `src/index.html`, ved siden av `bld` og `hgt`. De må ikke ligge som strenger i et skript: da tar det så lang tid å lese skriptet at klokka rakk å kalle `G3` før `view3d.js` var lastet. Plassene 3D-visningen trenger, står i GLB-ens `extras`: øye, ratt, mannskap, lanterner, haler, påfylling og flagg. `vesselSVG` viser sidebildet når typen har et, og NPC-båter i samme størrelse bruker modellen med fargedraktene.
  - **Felles kode** for båtskriptene ligger i `tools/boats/bpyutil.py`: `interp` (tabeller), `resample` (rader på fargegrensene), `offset_poly`, `beauty`, `side_picture`, `on_drawing` (render oppå tegningen) og `export_boat` (baking, lod0 + glass + lod1, GLB og sidebilde). Med `dry` skriver skriptene GLB-en bare til `tools/boats/out/`, så `src/data/` står urørt. En prøvekjøring av Malo-skriptet etter flyttingen ga samme geometri som før; bare den bakte skyggen i lod0 varierer litt fra kjøring til kjøring.
  - **NPC-båter med GLB-modell** får nærversjonen bare innenfor 150 m (ellers 300 m), fordi mange i lokalflåten deler den (`npcNear` i `view3d.js`, `glbHas` i `vessel3d.js`).
- **Havsjarken (`sjark`, fra 02.10.2026):** `tools/boats/havsjark35.py` bygger Viksund Havsjark 35 fot.
  - **Kildene:** profiltegningen og generalarrangementet fra Viksund Båt Nor AS (maskinrom foran lasterommet), og annonsene for Viksund 35 (10,57 m lang, 4,20 m bred, dypgang 1,60 m). Tegningene er ikke i repoet. Begge er satt til 10,57 m over alt (profilen 156,3 px/m, planen 152 px/m, og planen er dreid 1,75°).
  - **Det som er målt:** kjøl og forfot, stevn, speilets fall, ripe og fenderlist, halvbredder, bakken, styrhuset med vinduer, redskapsrommet, luka, haleplassen, mastene, lastebommen og stytteseglet.
  - **Det som er valgt:** skrogformen under vannlinja og i tverrsnittene, tykkelsen på ballastkjølen, fargene (hvitt skrog med mørk rød list og ripe, grågrønt dekk, beige seil), linehaleren og vindusrutene. Fremre mast står ved styrhusets akterkant (profilen sier 5,46 m, planen 5,15 m, modellen 5,27 m).
  - **Tallene i spillet:** 10,57 × 4,1 × 1,6 m, 12 t, lasterom 6 500 kg og 900 L diesel (fra et datablad Jonas viste), 180 hk og 8,5/10 kn. Databladets 75 hk og 16 kn ble ikke brukt fordi de ikke er realistiske for en tung havsjark. Rommet er større enn hurtigsjarkens (5 000 kg): tung og romslig mot rask.
  - **Kjøring:** `python3 tools/boats/havsjark35.py` (med `check` bare overlegget, `fast` uten bilder, `dry` uten å skrive til `src/data/`). Overlegget trenger tegningene i `HAVSJARK_PROFIL` og `HAVSJARK_GA`. Dataene ligger i `src/data/boat-havsjark35.b64` og `src/data/boat-havsjark35-side.b64`, og i malen som `glb-sjark` og `pic-sjark`.
- **Starterbåten (`skiff`, fra 02.10.2026):** `tools/boats/skiff59.py` bygger en åpen aluminiumsbåt med midtkonsoll.
  - **Kilden:** GA-tegningen for Plate Alloy 5.9m Adventurer (Plate Alloy Australia): lengde over alt 6,1 m, lengde 5,9 m, bredde 2,45 m (2,02 m innvendig), dybde 1,17 m, dypgang 0,3 m og bunnreisning 10,5° i speilet. Profilen har stasjoner for hver 700 mm (93,9 px/m). Tegningen er ikke i repoet. Jonas valgte aluminium som tegningen, 60 hk som før og lakkert hvitt skrog med marineblå stripe og grå bunn.
  - **Modellen:** hard kimming med spruterist, flate sider, bred ripe (0,19 m) med svart fenderlist, transom-pods med badeplattform og leider, en benk på tvers akter med motorbrønn, midtkonsoll med vindskjerm, rekkverk, mørke skjermer (ikke levende, etter Jonas' ønske) og kompass, pidestallsete, fordekk med to luker og ankerboks, fiskekar, klamper, stangholdere, lanterner og akterlys på stang. Påhengsmotoren er bygget i Blender som egen del.
  - **GLB-en har tre ekstra deler:** `cap` (lokket i ripas innerkant, som tegnes bare i dybdebufferen så sjøen ikke vises inne i båten), `outboard` (motoren i sitt eget koordinatsystem med dreiepunktet i motorbrønnen) og `prop`. `export_boat(..., more=[...])` i `bpyutil.py` skriver slike deler. Et objekt kan gis som funksjon, så det lages først etter at skroget er bakt (lokket ville ellers skygget for cockpiten).
  - **I spillet:** `glbModel` tar også starterbåten (før sjekken på `hand`), setter motoren og propellen på plass i den hele modellen (Båthandel og testene) og gir lokket som trekanter. `glbPart(type, navn)` gir én del. `view3d.js` bytter `VGEO.skiff` med geometrien fra GLB-en, og `buildSkiff` henter skrog, glass, lokk, motor og propell derfra. Ratt, gasshendel, motorens sving og vipp og propellens rotasjon er som før.
  - **Plassene:** `SKA` i `view3d.js` har plassene som de levende delene og folkene bruker (dørk, kar, fiskeren, haleren, håndjuksa, de tre juksamaskinene, redskapsstabelen og påfyllingen). Standardtallene er det gamle skrogets, og `anchors.skiff` i GLB-en overstyrer dem, sammen med ratt, gasshendel, motor, propell, sjarm, skipper, sete og navnebrettene. `anchors.work` gir plassene for sløyebordet og blødekaret (`drawDeck`), som ellers settes ut fra bredden.
  - **Kjøring:** `python3 tools/boats/skiff59.py` (med `check`, `fast` og `dry` som de andre). Overlegget trenger tegningen i `SKIFF_GA`. Dataene ligger i `src/data/boat-skiff59.b64` og `boat-skiff59-side.b64`, og i malen som `glb-skiff` og `pic-skiff`.
- **Folkene (`worker`, fra 02.10.2026):** `tools/harbour/arbeider.py` bygger én kropp i deler, etter Jonas' bilder.
  - **Delene:** overkropp (`torso` med glidelås og brystlommer, eller `sweater` med stripet hals), hode med ansikt (`head`), tre hodeplagg (`hardhat`, `skippercap` og `beanie`), overarm, underarm, lår, legg, støvel og hanske.
  - **Hvert koordinatsystem:**
    - Overkroppen har origo i hoftene, 0,92 m opp.
    - Hodet og hodeplaggene har origo i halsroten, 1,50 m opp.
    - Støvelen har origo på bakken under ankelen.
    - Lemmene er én enhet lange langs +z og runde, så spillet strekker dem mellom to ledd (`limbM` med r = 1).
  - **Drakter:** Plaggene er lakksoner. Sone 1 er jakka og sone 3 buksa. `WKIT` i `vessel3d.js` maler dem:
    - havnearbeideren i blå kjeledress og gul hjelm
    - skipperen i marineblå genser og skipperlue (Jonas: «så man ser forskjellen på dem»)
    - mannskapet i oransje oljehyre og rød lue
  - **I spillet:**
    - **Havnearbeiderne og dekksmannskapet:** `drawWorker` stiller delene ledd for ledd (`PM.W`).
    - **Skipper og mannskap i båtene og i NPC-flåten:** `figureVB` setter figuren sammen til én modell (`personVB`, `people()`, `person()` i `buildSkiff`). Om bord er figuren skalert til 0,95 (`WK_S`), fordi styrehusene ble laget for den gamle figuren.
    - **Fiskeren i skiffen:** får armene fra figuren (`SK.wk`).
    - **Uten dataelementet:** spillet tegner de gamle klossfigurene.
  - **Kjøring:** `python3 tools/harbour/arbeider.py` (eller `fast` uten bilder). Fila er `src/data/worker.b64`, rundt 180 KB, og ligger i malen som `glb-worker`.
- **Havneenheten (02.10.2026, i alle de åtte mottakshavnene):** `tools/harbour/kaimottak.py` bygger kaia med fiskemottak, kran, truck, is og bunkers som én enhet. Finnsnes beholder sin kai.
  - **Kaia:** en blokk på 54,8 × 24,4 m med rette betongvegger ned til 9 m under middel vannstand på alle sider. Ingenting stikker ut i sjøen (Jonas).
  - **Plasseringen:** `UNITS` i `01-world.js` gir for hver havn midten av fronten (`o`, i meter) og retningen langs fronten (`u`). Sjøen ligger på `n = (-u.z, u.x)`.
    - Fronten ligger på mottakskaia Jonas merket i `QUAYS`. Den er skjøvet langs kaia dit blokka står på mest land og har fritt vann foran: Husøy 12 m, Frovåg 14 m og Senjahopen 2 m.
    - Sommarøy og Brensholmen har ingen merket kai og er plassert med et søk nær havnepunktet etter det samme.
    - Liggeplassen ligger høyst 25 m fra havnepunktet, så innseilingen står.
  - **Liggeplassene:** `quayFace` henter dem fra enheten (`UNIT.berth`).
    - Landing: midt på x = −5 og 24 m lang, der kranen og isrenna rekker.
    - Bunkers: midt på x = 16,5 og 23 m lang, ved pumpa.
    - `berthPose` gir dem videre med `face.unit`. Forhaling til bunkers er en tur på rundt 21 m langs samme kai. Alle åtte havnene har bunkers (`PORTS.fuel`).
  - **Dybden:**
    - Bassenget foran (|x| ≤ 33,4 m, 26 m ut) er mudret til 6,6 m under middel vannstand, både i navigasjonen (`unitDredge` i `depthF`, 5,3 m under sjøkartnull) og i 3D (`unitTerr`). Det stiger 1:2 utenfor.
    - Ved laveste lavvann (summen av `TIDE_C` er 1,55 m) er det minst 5 m vann langs hele fronten.
  - **Terrenget i 3D:**
    - `unitTerr` senker land som er høyere enn dekket ved sidene og bak, og går tilbake til det opprinnelige innen 22 m (`UNIT_REACH`).
    - **Fyllingen bak blokka** (Jonas 04.10.2026: «det er viktig at fiskemottaket ser ut som det hører hjemme med omgivelsene»):
      - Sju av åtte blokker sto ute i vannet med 10–60 m sjø bak seg i 3D-terrenget.
      - `UNITS[k].f` er omrisset av en fylling i enhetens ramme, fra baksiden til 3 m inn på fast land (0,5 m og over i minst 10 m). Den er målt per meter langs baksiden fra høydepakkene, der landet ligger innen 70 m, og er minst 4 m dyp overalt.
      - Fyllingen ligger flatt i dekkhøyde (`UNIT_TOP`), og sidene skråner 1:1,6 ned til bunnen.
      - Den er land i simuleringen (`onUnitGround` i `isLand`, `unitDredge`), land i kartplotteren (`pocketsIn` gir 2) og fjerner kartlagte brygger (`PIERBOX`).
    - **Havnelandet over flo:** Kartets land er 0,5 m og over, mens tidevannet går til 1,55 m, så lavt land bak kaiene ble oversvømt ved flo. Land innen 30 m fra blokka og fyllingen heves til dekkhøyde, og det går tilbake til det opprinnelige innen 45 m (`UNIT_LIFT`).
    - Fyllingen og det flate havnelandet rett ved den er asfalt og grus (`pv` i `unitPatch` og `recolor`). Skråningene blir stein fordi de er bratte.
    - `unittest` sjekker at det rett bak blokka er over høyeste flo og land i simuleringen, at hele fyllingen er i dekkhøyde, og at kartets land innen 25 m er over flo.
    - Hver enhet nær båten har sitt eget fine terrengstykke (`unitPatch`, 1,6–4 m mellom punktene) over blokka, fyllingen og 65 m rundt (`UNIT_FINE`). Det følger veggene og har hull der blokka står.
    - Ytterkanten ligger på det nære terrengets egne trekanter. Det nære terrenget senkes under stykket (`terrCoarse`), og stykket tegnes med litt offset.
  - **Det som skjules:**
    - bygg fra kartdataene på kaia og i bassenget (`bldOnUnit` ved innlasting)
    - trær (`addTrees`)
    - brygger og de gamle kaidekkene (`PIERBOX`)
    - de gamle fittings-delene; pullertene til fortøyningen kommer fra enheten (`QB`)
  - **Tegningen:** `drawUnits` tegner full modell innen 900 m og den enkle utgaven ute til 15 km. De bevegelige delene står i hvile ved alle enhetene. Mottaket nærmest kameraet arbeider (`drawPlant`).
  - **Kranen** (`craneGeo`):
    - Søyla svinger, bommen løftes for å nå inn nær søyla og holder tuppen minst 2,6 m over hælen, og teleskopet går ut 0–4,6 m.
    - Posisjonen i `landScene` er den samme som før: retning, radius og krokhøyde.
  - **Trucken** (`fkRun`, `legAt`):
    - Den venter øst for slippsonen og kjører fram med gaflene over lasten. Så går den en kvart sving med radius 2,5 m inn på linja til porten, gjennom porten og inn.
    - Ut rygger den samme vei. Den kjører mykt i gang og bremser mykt.
    - Rulleporten ruller opp etter hvor trucken er på ruta, så den er oppe før gaflene når den.
  - **Isrenna:** svinger ut over lasterommet mens isen renner, og tilbake langs kaia etterpå. Isen faller fra tuten.
  - **Folkene:** står på enhetens plasser, utenfor truckruta: én gir tegn, én tar imot, én teller og én kjører fjernkontrollen. Rundene deres (tau, spyling, feiing og kaffe på benken) går også utenfor ruta.
  - **Bunkers:** pumpa, slangetrommelen, tanken og skiltet er enhetens. Spillet tegner bare telleren og slangen.
  - **Delene som beveger seg:** kranen (`crane_house`, `crane_boom1`, `crane_boom2` og `crane_hook`), trucken (`truck` og `truck_forks`), rulleporten (`door`, med origo i overkant) og isrenna (`chute`).
  - **Ankerne** (`anchors` i GLB-en): liggeplassene, pullertene, kranen, slippsonen, porten, truckruta med hjørnemålene, silo og renne, pumpe, trommel og teller, folkenes plasser og runder, kassestablene, kamerahindringene og lysene.
  - **Testen:** `tests/unittest.py` sjekker for hver havn:
    - at det er minst 5 m vann langs fronten ved laveste lavvann
    - at havbunnen i 3D i bassenget aldri ligger over laveste vann
    - at truckens fire hjørner er minst 1 m innenfor dekket langs hele ruta
    - at en truckrunde tar høyst to løft
    - at ingen brygge står på kaia
    - Den tar også bilder (`unit_<havn>.png`).
  - **Data:** `src/data/harbour-unit.b64` (585 KB), i malen som `glb-harbour`.


### 5.14 NPC-flåte og kartplotter

- **Kaiplasser** (`berthSlot`, `berthShift`): Hver NPC-båt har en egen plass langs kaia, 30–60 m fra havnepunktet. Plassen er kontrollert mot land, og båter i samme havn ligger minst 20 m fra hverandre. Forskyvningen avtar over 150 m.
- Kystruteskipet og ferja har egne plasser, 70 m unna.
- **NPC-modellene** (V9): Hver båt i `FLEET` får den dekkede kystmodellen nærmest i lengde og bredde (`npcKit`), skalert til egne mål, i en av fire fargedrakter (`LIVERY`: egen, marineblå, rød, grønnblå). Innenfor 500 m tegnes den med full detalj (lod 1) med skipper i styrhuset og to på dekk når hun fisker, innenfor 1,5 km med lod 0,3 (rundt 5 000 punkter), og lenger ute som de gamle boksmodellene. Lanternene følger modellen. I kartplotteren er ikonet større jo lengre båten er.
- **Trykk i kartplotteren:** Trykk nær en havn går til havna, ikke til en fortøyd båt. Fortøyde AIS-mål tegnes mindre og svakere.
- **Varmekartet** (`core/12-heat.js`, `ui/03c-heat.js`, fra 01.10.2026): Kartplotteren viser fisken i en sirkel rundt båten du følger, i både Navigasjon og Fiskekart, ut fra ekkoloddet eller sonaren (tabellen i 5.1). Kartplotteren er ikke nødvendig.
  - Rutene ligger på et fast rutenett i verden (`HEATC`), så bildet ikke flimrer. De regnes ut med `heatSample()` fra den samme `density()` som fangsten, i biter på 5 ms (`heatWork`). Nærmeste ruter regnes først, og litt foran båten når den går. Ved nytt bestandstime regnes de på nytt. I havn, i skjult fane og før dybdedataene er lastet regnes ingenting.
  - Det båten har passert, gløder etter og blekner over 30 spillminutter (`HEAT.glow`). Så glemmes det.
  - Tegnes på `#heatcv` under SVG-kartet: ettergløden og de levende rutene. Skalaen er logaritmisk (4,5–150 kg/t internt), og det enkle ekkoloddet viser fire trinn.
  - **Fargene** (brukerens ønsker 02.10.2026): fra gjennomsiktig der det ikke er fisk, gjennom lys turkis og blå, til lilla der det er mest (`HEATPAL`), så bare ansamlingene av fisk synes, og fargetonen skiller mengdene. Dekningen er ((t − 0,06)/0,56)^1,15, så tynn fisk er klar, og fra rundt 40 kg/t er fargen helt tett. Den grå skiva og den stiplede ringen er borte.
  - **Myk kant:** Bildet tegnes med uskarphet på 5 % av radien. Hver rute husker hvor nær båten den har vært mens den har lyst (`c.near`, andel av radien), og dekningen går fra full innenfor 55 % av radien til ingenting ved ringen. Sporet bak en båt i fart beholder dermed fargen, mens sidene og forkanten fader ut.
  - **Ingen tall for fisken** (brukerens krav 01.10.2026): Spilleren skal aldri se kilo eller kilo i timen for fisken. Varmen viser hvor fisken står tett, ikke hvor mye en båt vil ta. Feltet `#heatBox` i navigasjonslinja øverst i plotteren (`#ecdisTop`, etter SOL) viser bare instrumentet, rekkevidden i nm, en fargestripe fra «lite» til «mye fisk» og artsbrikka. Teksten i `title` har resten. Med sonar står det også hvor stimene trekker (bare retning), og under første tur at full last er garantert.
  - Valgene står under «Innstillinger» i navigasjonslinja (`#plotSet`, `plotSetOpen`): kartplotterens innstillinger (`chartSettings`), «Ekkolodd: På | Av», «Sonar: På | Av» og «Art: Alle | Torsk | Hyse | Sei» (`S.settings.heatSp`, bare med CHIRP eller sonar).
  - Ekkoloddvinduet (`#echoWrap`) er fjernet (02.10.2026). GPS-boksen (`#instr`, `INSTR`) står igjen.
  - **Konsollen i 3D** (skiffen) viser den samme varmen (`heatDrawInto`) og «EKKOLODD AV» når ekkoloddet er av. Med CHIRP viser konsollkartet litt mer enn ±1,1 km.
  - Ytelse: Rundt 10 µs per rute her og rundt 40 µs med CPU-en struping fire ganger. Hele sonarsirkelen (4 000 ruter) tar 0,15–0,18 s fordelt på biter, og en full oppdatering kommer hvert annet spillminutt.

### 5.15 Ruteplanleggeren og Autonav (01.10.2026, Autonav fra 02.10.2026)

- **WP-navn** (`ui/03b-route.js`): WP0 er starten (havna eller båten), så WP1, WP2 … i den rekkefølgen de seiles. Navnene brukes i kartet, lista, varslene («Etappe WP2→WP3 krysser land»), GPS-boksen og loggen («WP3 passert»). Punkter havna legger til på vei ut og inn (`w.auto` `'out'` eller `'in'`), vises dempet og merket «utseiling» eller «innseiling».
- **A12:** `exitWps` og `entryWps` (`07-harbours.js`) legger bare inn punkter når veien fra dem til neste punkt er fri, og aldri selve havnepunktet. Ser ingen av punktene målet, legges ingen inn, og etappen spilleren tegnet, blir markert.
- **Rutelista** har ett kort per WP: kurs som skal styres (rettvisende, kartet er nord opp), lengde i nm, ETA i spilltid med nedtelling i ekte tid, koordinat, fisketid ± og redskapsbrikke. `draftTimeline()` regner ut kurs og tider. Under kortene står sumlinjene, og knapperaden med «Kast loss» står fast nederst. Sidepanelet i plotteren er 340 px bredt.
- **Angre og gjør om:** Alle endringer i kladden er steg i en historikk på 100 steg per båt (`draftEdit`, `draftUndo`, `draftRedo`). Den lagres ikke. Flytende knapper på 44 × 44 px står over zoomknappene.
- **Flytt og sett inn:** Et trykk innenfor 22 px av et punkt drar det. Havner det på land, blir det rødt og går tilbake. En finger til avbryter og zoomer kartet. Havna til slutt kan ikke flyttes. Hver lange etappe har en «+» midt på: et trykk setter inn et punkt der, og et drag lager et nytt punkt der fingeren slipper. Farene regnes per etappe (`legHazardMemo`), så et drag regner bare om de to etappene som berøres.
- **Autonav** (før «Følg leia», `core/11-route.js`): A* på rutenettet på 100 m med avstand til land (`DC`). Et steg koster mer innenfor 200 m fra land, og mye mer over vann grunnere enn sikker dybde + 1 m eller nær skjær (ikke i havnene). Havnene forlates og nås via innseilingen. Ruta rettes ut der en rett etappe holder 150 m fra land (mindre der det er trangt), dyp nok og fri for skjær, til høyst 12 WP (lengre ruter flere, se 4.12). Beregningen går i biter på rundt 8 ms. Søket går i et vindu rundt etappen fra K9 (4.12).
  - Bruk (brukerens ønske 02.10.2026): én knapp, «Autonav» (`#rAuto`), over zoomknappene i kartplotteren, og så et trykk i kartet (et punkt eller en havn). Knappene «Følg leia» i panelet og knapperaden er fjernet. Hele autoruta er ett angresteg. Båten går først når spilleren trykker «Kast loss», og kartplotteren blir stående åpen etter «Kast loss». Den lukkes med «Lukk».
  - En håndtegnet rute får en linje som sammenligner den med Autonav gjennom de samme stoppene: «Autonav: 5,2 nm · 20 min · 3,1 L. Din rute: −0,2 nm, −1 min, −0,1 L.»
  - Målt: Autonav er 0–1,4 % lengre enn den strammeste veien langs land til de seks feltene. Fordelen med en god manuell rute er altså liten, fordi rutene mest går over åpent vann.

- **Kartplotteren** (brukerens ønsker 02.10.2026):
  - **Navigasjonslinja** øverst (`#ecdisTop`): HDG, COG, SOG, POS, dybde, tidevann, sol, ekkoloddfeltet (`#heatBox`, 5.14), og helt til høyre «Rute», «Innstillinger» og «Lukk» (`#ecClose`, tilbake til 3D).
  - **GPS-boksen** er flyttet inn i linja (brukerens ønske 02.10.2026). Mens en rute seiles (`body.navon`), kommer WPT (nummer og tid dit som etikett, avstand og peiling), XTE (avstanden fra etappen, R eller L) og ETA (til siste punkt, med navnet) etter POS, med rosa etiketter som ruta. Er linja for smal, viker SOL (under 1 440 px), så TIDEVANN (1 240 px), og under 980 px XTE og POS.
  - **Play og pause** (`#rPlay`, `routePlayMode`, brukerens ønske 02.10.2026): En stor rosa ▶ dukker opp øverst i knappesøyla når en rute er lagt inn og båten ligger stille, og gjør det samme som «Kast loss». Mens båten seiler ruta, blir den ⏸: båten stopper der den er, og resten av ruta går tilbake til kladden (`routePause`), så den kan endres før ▶ fortsetter. En driftsplan pauses ikke her.
  - **«Innstillinger»** (`#ecSet`) åpner et lite vindu under linja (`#plotSet`) med kartplotterens og ekkoloddets innstillinger. Det lukkes med ✕, et nytt trykk på knappen eller når 3D vises.
  - **Sidepanelet** er skjult til spilleren begynner å legge inn en rute. Klassen `routing` på `body` settes av `renderRouteTools` når kladden har punkter, det er en plan, eller Autonav regner. Da kommer panelet med kursene og driftsplanen som før.
  - **Åpning:** `openPlotter()` sentrerer alltid på båten med 6 km i høyden (`PLOT_KM`).
- **3D-visningen** (brukerens ønsker 02.10.2026):
  - **Kompasslinja** (`#compass3d`, `compassDraw` i `view3d.js`): en tynn linje øverst med ±70° rundt kameraets retning, streker for hver 5°, tall for hver 15° og N, NØ, Ø … Retningen er sann (rutenettsretning + γ). En rosa hakk viser midten.
  - **Det lille kartet** (`#miniPlot`, `ui/03e-miniplot.js`) under statusboksen, like bredt som den: nord opp, så stort at ekkoloddringens diameter fyller det (en halv nautisk mil hver vei uten ekkolodd), med fisken (`heatDrawInto` uten uskarphet), ruta som gjenstår og båten. Det tegnes en gang i sekundet over en bakgrunn (sjø, land og kyst for to ganger utsnittet, `miniBg`) som tegnes på nytt bare når båten har flyttet seg en femdel av radien, eller hvert 20. sekund. Å tegne kysten hver gang gjorde skjermbildene i 3D-testene 5–8 ganger tregere med SwiftShader. Et trykk åpner kartplotteren. Det erstatter GPS-knappen og «Planlegg».
  - **GPS-boksen i 3D** (`#gps3d`, brukerens ønske 02.10.2026) under det lille kartet, like bred og like gjennomsiktig som statusboksen: fart, kurs og posisjon, og mens en rute seiles også WPT, XTE, tid til neste punkt og ETA. Den vises ikke i havn.

### 5.16 Veiledningen «Første tur» (01.10.2026)

- **Obligatorisk** for nye spill, også etter nullstilling. Eldre lagringer sendes ikke gjennom den. `#notut` i adressen hopper over den (testene bruker det).
- **Tilstand:** `S.tut = {v:2, m:{…}, catch:true, pAt}`. `m` er milepælene. Steget som vises, er det første som ikke er gjort, og «gjort» leses også av spilltilstanden, så veiledningen tåler omlasting. Rutestegene (`live`) leses på nytt hver gang til båten har kastet loss.
- **Stegene** (`TSTEPS` i `ui/07b-first-trip.js`): butikken (håndjuksa og 150 kg is gratis), kartplotteren, rute til ringen ved Gisundet nord (med «Autonav» fremhevet), minst 2 timer fisketid, «Kast loss», gratis luksushaill mens båten går ut, fisket og «Jukse selv», dekksarbeidet, full last, rute til Botnhamn med «Autonav», «Kast loss», «Neste»-brikka, levering, sluttseddelen og «Neste mål».
- **Visning:** Et dempet lag med hull rundt målet og en pulserende ring (z-index 61–62, over telefonen), med tipset over (63). `tutRect()` gir målet.
- **Garantert første fangst** (`S.tut.catch`): Så lenge flagget er satt, ligger det en ekte skreiflekk på feltet i Gisundet nord (`tutBonus`, `TUTB`, `TUT_FIELD`). Den gir rundt 175 kg/t for én person i sentrum og en tidel ved kanten av ringen, i samme miks som påfyllingen (72 % torsk, 18 % sei, 10 % hyse). Flekken legges oppå bestanden og fiskes ikke ned, så ekkoloddet og varmekartet viser det båten får.
  - `fish()` fyller fortsatt på, så lasten er full når fisketida er ute, men påfyllingen er nå et sikkerhetsnett: rundt en firedel av fangsten i stedet for ni tideler (`window.TUTTOP` teller den i testene). Bare bestandens egen andel av fangsten trekkes fra bestanden.
  - `risk()` og snuing for vind er slått av, og i jukse-spillet kommer nappet etter 4–8 s. Flagget nullstilles ved første levering.
- **Haill:** Kommer båten fram før haillen er hentet, venter den på feltet (`b.tutWait`) og begynner å fiske når haillen er om bord.
- **Sperrer** (`tutAllow`): «Kast loss», nye punkter og levering bare på sine steg. Puben, kveiteutstyret, driftsplanen, «Hjem samme vei» og levering andre steder enn Botnhamn er skjult til veiledningen er ferdig.
- **Nødutgang:** «Hopp over veiledningen» vises først etter 20 minutter uten fremgang.
- **Knappelinja:** Veiledningen peker på Verft og så Fiskeutstyr (`dockApp()`), på «Jukse selv» og statusfeltet i knappelinja, og på Marked, Lever og «Lever» i skuffen. Sluttseddelen vises i skuffen under Marked, Lever.

### 5.17 Knappelinja, skuffen og «Sett ut» (01.10.2026)

Inspirert av Fishing: Barents Sea. Den gamle handlingslinja `#actbar` er borte, og telefonen er slanket.

- **Knappelinja** (`#dock`, `DOCK` i `ui/10c-dock.js`): Runde knapper med et kort ord under, langs nedkanten. Bare knappene som passer akkurat nå, vises. Det som ikke kan brukes, er grått, og et trykk gir grunnen som toast. `renderActs()` er beholdt som navn og kaller `DOCK.render()`.
  - **I havn:** Marked (Lever, Is, Agn), Bygd (Pub, Bank, Oppdrag, Mannskap), Verft (Båthandel, Oppgrader, Fiskeutstyr, Vedlikehold, Bunkring) og Beholdning. «Planlegg» er fjernet (02.10.2026); kartplotteren åpnes fra det lille kartet i 3D. Marked, Bygd og Verft åpner en vifte med mindre knapper over seg (`#dockFan`). Med planlagt avgang: Kast loss og Avbryt.
  - **På sjøen:** Jukse (vifte med timer, start og kveite, bare når båten er rigget for juksa), Sett ut, Ta opp, Auto-nav og Beholdning når båten ligger stille; Stopp, Sløy eller Fisk videre, Jukse selv og Beholdning under juksing; Stopp båten og Auto-nav under fart; «Hjem» er fjernet (02.10.2026, «Returner samme vei» står i plotteren); Hjelp ved motorstopp. Mannskap dukker opp med prikk når det er krangel om bord.
  - **Statusfeltet** `#dockInfo` over knappene er tekst (avgang, verksted, lossing, kaiarbeid, redskapsarbeid, juksing og dekk).
  - `DOCK.items(meny)` og `DOCK.text()` er for testene.
- **Skuffen** (`#drawer`): Liggende kommer den fra høyre (380 px), stående er den et ark over knappene (55 % av høyden). Innholdet er telefonens sider: `PHONE.page(side)` lager HTML, og `PHONE.dact(side, handling, data)` kjører en `data-pa`-handling som om siden var åpen i telefonen. `DOCK.open('side:fane')` åpner en side med en fane valgt.
  - **Sidene i skuffen** (`DRAWER` i `05-phone.js`): `lever`, `is`, `agn`, `bank`, `oppdrag`, `mannskap` og `bors` (som to faner), `fartoy` (Båthandel), `utstyr`, `fiske` (med kjøp av garn, line og teiner), `verksted`, `beholdning` (Redskap, Lasterom, Båten), og de gamle `havn`, `last` og `redskap`.
  - `PHONE.open(side)` og `data-pa="open"` sender en side i `DRAWER` til skuffen. Varslene i Rederi bruker `side:fane`, for eksempel `beholdning:last`.
- **Telefonen** har fjorten apper: Vær, Kystposten, Meldinger, Rederi, Salgslaget (Priser, Mine landinger, Toppliste), Kvote, Oppdrag, Haill, Sjømann, Redning, Trim, Patchnotes, Innstillinger og Admin. Kvote er fanen fra Salgslaget som egen app.
- **Patchnotes** (04.10.2026) viser kort hva de siste oppdateringene har gitt, med det nyeste først (`PATCH` i `05-phone.js`). Hver oppdatering har en id, en dato, en tittel og noen linjer på norsk og engelsk. Appen har et merke med tallet på oppdateringer du ikke har sett (`S.settings.patchSeen`), og de som var nye da du åpnet den, får «Ny» (`patchLast`). **Ved hver oppdatering legges en ny linje øverst i `PATCH`.**
  - **Admin** (testverktøy, 02.10.2026) har tidsskalaen (pause, 6×, 180×, 1 800× og 10 800×, det vil si `S.mult` 0, 1, 30, 300 og 1800) og knappen «+ 100 000 kr», som legger pengene i kassa uten å regne dem som inntekt og skriver en linje i loggen. Tempovalget er flyttet hit fra Innstillinger. Appen fjernes før spillet får felles klokke.
- **«Sett ut»** (`ui/03d-setmode.js`, tilstanden `SETM` er deklarert i `03-map.js`): Valget i viften åpner kartplotteren med redskapet tegnet som en linje fra båten. Lengden er den samme som `startSet` bruker: garn 30 m, line 1,5 m per krok, teiner 25 m mellom hver. Kartet zoomer så linja fyller rundt 40 %.
  - Dra i enden, eller trykk i kartet, for å snu linja. − og + endrer antall stamper eller teiner (en garnlenke settes hel).
  - Linja er rød med grunnen når enden er på land eller grunnere enn 5 m, når den krysser land, eller når `gearRules` sier nei.
  - «Sett ut» kaller `startSet(kind, spec, 0, hdg)`. Med `hdg` bruker den `setGeomExact` og setter bare der linja er tegnet, og båten snur dit. Uten `hdg` (ruta og driftsplanen) gjelder `setGeom` som før.
- **Ta opp** lyser innenfor 0,3 km fra en blåse (`nearSet`). For garn og teiner kommer «Trekk og sett igjen» i en vifte.
- **Auto-nav** åpner kartplotteren med Autonav klar (`leiaArm`). Et trykk på en egen blåse finner veien til et punkt 50 m utenfor (`buoyStandoff`). Fra 02.10.2026 går båten ikke av seg selv: spilleren trykker «Kast loss». Den trekker ikke selv. «Kjør dit» per sett i Beholdning gjør det samme (`DOCK.goTo`).
- **Rettinger:** `gearTap` ga et rutepunkt med trekk uten `kind`, så `wpActLabel` krasjet. En setting som ble stoppet før første enhet gikk ut, gir nå tilbake blåsesettet, egnede stamper og teineagn.

### 5.18 Dekksdagboka med faner, oppdragslista og papirene (01.10.2026)

Inspirert av Fishing: Barents Sea.

- **Fanene** (`#bkTabs`) står på venstre kant av boka: Dagbok, Sesonger, Hendelser, Utstyr og Salg. Hver fane er sin egen sideliste i `BOOK` (`ui/06-logbook.js`), og sidene for alle fanene unntatt Dagbok lages av `bookTabPages(fane)` i `ui/06b-book-tabs.js`. Alt står eldst først, så en fane åpner på nyeste side. `BOOK.open('salg', i)` åpner sluttseddel nummer `i` i `S.sales`.
  - **Sesonger:** årets regler (kveitefredningen, skreisesongen, maksimalkvotene i åpen gruppe, uer på juksa, ferskfiskordningen, krabbesesongen fra `SPECIES.krabbe.av`) og prissesongene: måneder der `SPECIES[art].pm` ligger minst 10 % over eller under årssnittet. Det som er over, krysses ut (klassen `over`; `x` er opptatt av lukkeknapper).
  - **Hendelser:** de siste fire ukene. Ukens prisbevegelse per art når `weekDev` er minst ±8 %, uværsdager med toppris (`supplyFactor` ≥ 1,025), og regelendringer.
  - **Utstyr:** et kort per sett fra `S.gearLog` (hele rederiet, de siste 60), som skrives i `finishSet` og oppdateres i `finishHaul` og når redskap går tapt. Ståtid som tellestreker opp til 40 t.
  - **Salg:** sluttseddelen per levering. `sell()` lagrer den i `S.sales[i].d`: linjer `[art, klasse, kvalitet, sløyd, kg, kr, antall]`, lever og rogn, innloggingsbonus, oppdragstillegg, inndratt, trekk for rognkrabbe, mannskapet med andel, lott, gebyr og et løpenummer (`S.saleSeq`). Bare de siste 60 salgene beholder `d`. Eldre salg vises med kg og kroner per art.
- **Oppdrag** tas i Bygd (skuffesiden `oppdrag`). De aktive ligger som en oppdragsliste i telefonappen `ordl` («Oppdrag») med frist og framdrift, og under står de tidligere med Levert eller Ikke levert. `ordState().done` har nå `ok` og tar 20. Både levert og ikke levert skrives i Drift.
- **Salgslaget, «Mine landinger»:** 📖 per sluttseddel åpner den i boka.
- **Sjømann, fanen «Papirer»** (`papers()`): helseerklæring for arbeidstakere på skip (fiktiv lege, gyldig 2 år fra første loggføring), sikkerhetsopplæring for sjøfolk på mindre skip (35 t), fiskeskipper klasse C og begrenset radiosertifikat (SRC, gyldig når en båt har VHF). Papirene styrer ingenting.

### 5.19 Arbeid om bord, mat, hviletid, replikker og energien din (01.10.2026)

Brukerens ønske: mannskapet skal være en levende og givende del av spillet, inspirert av Fishing: Barents Sea. Ingen portretter.

- **Filer:** `core/13-work.js` (stasjoner og kjeder), `core/14-crewlife.js` (læring, mat, hviletid og replikker), `core/15-energy.js` (energien din og søvnen) og `ui/05b-work.js` (skuffesiden «Arbeid», toastene og søvnskjermen).
- **Stasjoner** (`STATIONS`): Ror, Fiske, Haling, Krabbesortering, Sløying, Ising, Kokk og Pause. Hvert minutt går hver person om bord til den første stasjonen i kjeden sin som har arbeid (`workAssign`, `workCtx`):

  | Stasjon | Har arbeid når … |
  |---|---|
  | Ror | båten går, kaster loss eller har motorstopp. Én person. |
  | Fiske | båten jukser (status `fishing` uten redskapsarbeid, juksarigg, ikke stoppet for sløying) |
  | Haling | redskap settes eller trekkes |
  | Krabbesortering | teiner trekkes. Med noen her slipper halerne å sortere (ellers ×1,3 på tida). |
  | Sløying og Ising | det ligger over 0,5 kg i karet som skal sløyes eller ises |
  | Kokk | et måltid er forfalt. Én person. |

- **Kjeder:** `c.job` per mannskap og `S.myJob` for deg. `null` betyr standard:
  - Du: Ror → Haling → Fiske → Sløying → Ising.
  - Første mann: Sløying → Ising → Haling → Fiske.
  - De andre: Fiske → Haling → Sløying → Ising.
  - Det gir samme oppførsel som før: under seiling styrer én og resten sløyer, og ved fiske sløyer én når det er fisk i karet.
- **Reglene som alltid gjelder:**
  - Står ingen ved roret, tar den med best sjømannskap det (blant dem som har pause først, du før mannskapet).
  - Står ingen ved halingen, tar en som har pause den, ellers en fra dekket.
  - Er måltidet forfalt og ingen har Kokk i kjeden, lager den beste kokken med pause mat, hvis kokk ≥ 3.
  - Etter «Stopp og sløy» går alle med pause på dekk.
- **Farten følger dem som står der** (`workTeam`):
  - Fiske: `effortOf(antall ved ripa, maskiner)` × snittet av deres `crewEff`. Faktoren for hender på dekk i `catchFactors` er borte.
  - Sløying: 5 kg/min × `crewEff(c, 'sloy')` per person, og det som er til overs går til ising.
  - Ising: 13,3 kg/min × `crewEff(c, 'is')`.
  - Haling: `gopUnitMin` med snittet av halerne og antallet som haler. Ingen ved halingen betyr ingen framdrift.
  - Du teller som 1, eller 0,75 med energi under 25 %.
- **Ferdige oppsett** (`JOB_PRESETS`): «Én på dekk» (standard), «Alle fisker» og «Alle på dekk».
- **Menyen «Arbeid»** (knappelinja, i havn og på sjøen, bare med mannskap om bord):
  - Øverst er flyten for riggen: Ror → Fiske/Haling (→ Krabbe) → Sløying → Ising, med Kokk og Pause ved siden av. Hvert kort viser hvem som står der og hva som venter: kg, redskap trukket, eller tid til måltidet og matstellet.
  - Under er det én rad per person, med deg først. Raden viser hva personen gjør nå, kjeden som nummererte brikker, energien din, og «Må hvile innen X t» når det er 6 timer eller mindre igjen.
  - «Endre»: trykk stasjonene i den rekkefølgen du vil ha dem. Et nytt trykk tar en stasjon ut. «Ferdig» lagrer, og «Auto» går tilbake til standarden.
  - Et trykk på navnet åpner personkortet med ferdighetsstreker (juksa, line, garn, teiner, sløying, ising, krabbesortering, matlaging, sjømannskap og styrke), slitenhet, trivsel, hvor fort personen lærer, og de tre siste replikkene.
- **Læring** (`learnHour`, hver time per person om bord utenfor havn): Minuttene per stasjon (`c.wk`) trener ferdigheten for den stasjonen.
  - Formel: vekst = 0,012 × alder × trivsel × lærevillig (×2) × (1 − ferdighet/5,5) per hel time.
  - Alder: 1,7 for 18 år, 1,3 for 30, 1,0 for 40, 0,7 for 50, 0,45 for 60 og 0,3 for 75, lineært mellom.
  - Trivsel: 0,2 under 30, 0,6 under 50, 1 opp til 75 og 1,25 over.
  - Hvilken ferdighet: Haling trener redskapet båten er rigget for, Ror trener sjømannskap, og Kokk trener matlaging.
  - Hvert hele steg logges og gir gjerne en replikk.
- **Mat:**
  - Det er et måltid hver 6. time på sjøen, og bare med mannskap om bord. I havn spiser folk i land.
  - Den som står ved Kokk, lager mat i 30 minutter, og kvaliteten er kokkens `attr.kokk` avrundet. Lager du maten selv, blir den 3.
  - Er ingen ledig innen én time, blir det tørre brødskiver (kvalitet 1).
  - Rettene går fra brødskiver via pølser i lompe, fiskekaker og kokt torsk med poteter til mølje.
  - Matstell (`foodScore`) er snittet av de fire siste måltidene og er 3 uten måltider. Trivselen får (matstell − 3) × 3.
  - Sjansen for krangel ganges med 1,6 når matstellet er under 2,5, og med 0,7 når det er over 3,5.
  - Et måltid på 4 eller mer gir deg +4 % energi.
  - Tilstanden ligger per båt i `S.meal`.
- **Hviletid** (forskrift om arbeids- og hviletid på fiskefartøy, FOR-2017-11-10-1758 § 3):
  - Kravene: minst 10 timer hvile per 24 timer og 77 per 168 timer, hvilen i høyst to perioder der én er minst 6 timer, og høyst 14 timer mellom hvileperiodene.
  - Hver person har en logg over de siste 168 timene (`c.rest`, 1 = hvile).
  - Ingen av båtene har køyer (`VESSELS.*.berths = 0`), så bare timer i havn eller i land teller som hvile. Med køyer ville en time med høyst 10 minutters arbeid telle.
  - `restCheck` sjekker 14-timersregelen først, deretter døgnet, delingen og uka. `restLeft` gir timene som er igjen.
  - Brudd gir 1,5 ganger raskere slitasje og −8 i trivsel, og én melding per døgn som navngir regelen.
  - Du er unntatt, fordi § 1 holder den som jobber alene på egen båt utenfor. Du har energien i stedet.
  - Følge: en skiff-tur med mannskap på over 14 timer bryter regelen.
- **Replikker** (`SAY`, 102 linjer):
  - Den norske teksten er på nordnorsk, med ord fra brukerens liste (agalaus, au hirre, hustri, sjyen, kokning, låppen på nævan, han står stiv i dag og flere). Den engelske er vanlig engelsk. Grove og nedsettende ord fra lista er ikke brukt.
  - Situasjonene: god og dårlig fangst, fullt kar, kulde, sjøsyke, slitenhet, god og dårlig mat, hvilebrudd, uvær, stille vær, lang tur, lott, nytt ferdighetssteg, morgen, godt og dårlig trekk, og småprat etter trekk.
  - Om lag 60 % av gangene velges en replikk som passer et trekk hos noen om bord.
  - `sayHour` gir høyst én replikk per 1,5 timer per båt, med 55 % sjanse hver time. Hendelser (`crewSay`) kommer straks, men høyst én per 15 minutter.
  - Replikken vises som toast når du er om bord, står i Drift i dagboka, og de fem siste lagres på personen (`c.said`).
- **Energien din** (`S.energy`, 0–100, `energyMinute` hvert minutt):
  - Den synker 100/24 % per time når båten du er om bord på, ikke ligger ved kai, og stiger 100/8 % per time ved kai eller i land.
  - HUD-raden heter «Energi».
  - Ved 25 % kommer en melding og en toast, og arbeidet ditt går med 0,75.
  - Under 15 % mørkner kantene på skjermen (`#vign`).
  - **Ved 0 sovner du i 8 spilltimer** (`S.sleep`). `#sleep` (z 64) toner til svart og viser nedtellingen i ekte tid.
  - Med mannskap står du utenfor arbeidet, den med best sjømannskap tar roret, og turen går videre.
  - Alene stopper fisket og redskapsarbeidet, og båten driver med vinden i 0,3–0,8 knop (`sleepDrift`). Den kan gå på grunn.
  - Du våkner med 60 %. Det er en antakelse.
  - Søvnen løper også mens spillet er lukket.
  - **Klokka er felles for alle spillerne** (Jonas 03.10.2026). Søvnen kan derfor ikke gå raskere eller spoles over. Den kan bare avbrytes, med mindre hvile:
    - **«Våkn opp»** på søvnskjermen kommer etter første time (`WAKE_MIN`). Du får energien søvnen har gitt så langt (`sleepGain`: 60 % × sovet tid / 8 t).
    - **Du våkner når du kommer tilbake** etter fem minutter eller mer borte (`WAKE_BACK` i `catchUp`), med samme regel.
  - **Brovaktsalarmen** (`EQUIP.brovakt`, 7 900 kr, startverdi, 2 t montering; Jonas 03.10.2026):
    - Døser du av på sjøen, får søvnen `alarmAt` = 3 spillminutter. Da piper den (`SND`), skjermen blir mørkerød og en rød blinkende **ACK** vises.
    - ACK (`alarmAck`) vekker deg med 10 % og gjør deg døsig (`S.drowsy`).
    - Døsig på sjøen døser du av igjen med 3 % sjanse hvert minutt (`h2(S.t, 977)`, så samme minutt er likt for alle). Alarmen går da på nytt.
    - Døsigheten går over når du har hvilt deg til 60 % ved kai, eller etter en hel søvn.
    - Trykker ingen ACK (spillet lukket), piper den videre og du sover som uten alarm.
    - Kilder til selve ordningen er ikke sjekket. BNWAS er påbudt på større skip (SOLAS V/19). Om og når den kreves på norske fiskefartøy, er ikke sjekket.
  - **«Energi av» i Admin** (`S.adm.noEnergy`, `energyOff`; Jonas 03.10.2026, for testing): energien holdes på 100 %, du sovner ikke og døser ikke av, og knappen vekker deg om du sover. HUD-raden viser «av». `sleeptest.py` sjekker den.

### 5.20 Vær og hav (02.10.2026)

Brukerens ønske: havet skal se ut og oppføre seg slik Beaufort-skalaen beskriver det, og vindretningen mot land skal telle (le og lo). Kjølvann, hekkbølge og baugbølge skal være realistiske. Overgangene skal være jevne.

Brukerens valg:
- Både spillet og 3D følger vindretning og le.
- Dønningen er et eget system.
- Vinden dreier med lavtrykkene.
- Det åpne havet følger WMO.
- Dønningen holder feltene ute omtrent like grove som før.

**Kjernen** (`core/03b-sea.js`, etter `03-simulation.js`):

- **Vinden** (`windAt`) er uendret i styrke, med samme kontrollsum som før.
  - Lavtrykkene ligger i `stormsNear(H)`.
  - `windDir` dreier med klokka gjennom hvert lavtrykk, fra S foran det, via SV på toppen, til V/NV bak kaldfronten (Buys Ballots lov), vektet etter lavtrykkets andel av vinden.
  - `WX_FORCE = {w, d}` holder været fast i tester.
- **Strøklengde** `fetchAt(p, fra)`:
  - Sju stråler, −45…+45°, mot vinden. Effektiv strøklengde etter Saville (SPM 1984): Σ F·cos²α / Σ cos α.
  - Strålene marsjerer med `coastDist` (steg `max(25 m, 0,92·d − 70 m)`) og stopper på 25 m-masken.
  - Utenfor kartet:
    - åpent Norskehav mot N og NV (600 km)
    - Andøya rundt 16 km over Andfjorden mot V
    - 15 km mot S og Ø, og ved Kvaløya
  - `fetchField` gir roten av strøklengden fra en buffer i 200 m-ruter og 10°-sektorer: bilineær mellom rutene (ruter på land teller ikke) og lineær mellom sektorene, så den aldri hopper.
  - Kostnaden er rundt 5 µs uten buffer og 0,5 µs med, i Chromium på PC.
- **Vindsjø:** JONSWAP (Hasselmann m.fl. 1973) med U i m/s og F i meter:
  - `Hs = 0,0016·U·√(F/g)` og `Tp = 0,286·(U/g)·(gF/U²)^(1/3)`
  - Den vokser aldri over WMOs sannsynlige høyde for åpent hav per Beaufort-styrke: 0 / 0,1 / 0,2 / 0,6 / 1 / 2 / 3 / 4 / 5,5 / 7 / 9 / 11,5 / 14 m (`WMO`, `hsWMO`, interpolert mellom midtfartene). Tabellen er gjengitt av NOAA og Hong Kong Observatory.
  - Vinden sjøen svarer på er `weAt(H) = 0,6·W(H) + 0,4·W(H−3)`.
- **Dønning** (`swellOpen`) kommer fra VNV (300° ± 25°) med periode 9–14 s. Den har to deler:
  - en grunndønning etter årstid (`SWELL`) × støy (0,1–1,9)
  - en restdønning etter lavtrykkene: maks av `hsWMO(we(H−k))·e^(−k/24)` for k = 6–36 t, bare for vind fra vestlig halvdel

  Inn mot land dempes den med `EXPO^1,5` (`swellFactor`). `exposure()` er uendret, fordi den styrer fisk og dybde.
- **Bølgehøyden:**
  - `hsAt(p, H) = max(0,05; √(vindsjø² + dønning²))` (`hsParts` gir delene).
  - `hsOpen(H) = √(hsWMO² + dønning²)`.
  - Varselet `hsAtFc` regner det lokale varselet i «Vær» gjennom den samme sjøen med varselvinden.
  - Minne for siste kall gjør de 26 kallene billige.
- **Kalibrering:** Dønningen er satt så snittet gjennom året på de tre ytre feltene er 92–94 % av før.

  | | Før | Nå |
  |---|---|---|
  | Snitt Hs, Husøy / Mefjorden / Gryllefjord | 1,78 / 1,66 / 1,91 m | 1,68 / 1,53 / 1,77 m |
  | Skiffen «trygt» om dagen ved Husøy, vinter / vår–høst / sommer | 12 / 24 / 72 % | 10 / 17 / 63 % |

  - Fjordfeltene er uendret, der er vinden grensen.
  - `progweek`: blad B dag 22 som før, 37 turer mot 44 på 56 dager, men 296 kg og 10 140 kr per tur mot 281 kg og 8 766 kr. Nettoen etter 56 dager er 379 301 kr mot 388 726 kr. Med 15 % egenkapital kommer inngangen nå litt etter dag 56.
  - `simday` er innenfor ±3 %.
- **Sjøgang og tekst:**
  - `seaState(hs)` gir Douglas-skalaen (WMO-kode 3700) med met.no sine navn: havblikk, småkruset sjø, smul sjø, svak sjø, moderat sjø, røff sjø, veldig røff sjø, opprørt hav, veldig opprørt hav, ekstremt opprørt hav (`SEAN`).
  - `seaHere` legger til «krapp» når vindsjøen er brattere enn 1/25 av bølgelengden og større enn dønningen.
  - `BFS` beskriver havet ved hver Beaufort-styrke (etter SNL «Beauforts vindskala»).
  - Vær-panelet og vær-appen viser sjøgangen, vindsjøen og dønningen med retning og periode, og teksten for vindstyrken.

**Havet i 3D** (`view3d.js`):

- **Sjøtilstandskart:**
  - To teksturer: n (32² over det nære terrenget) og w (128² over hele kartet).
  - Kanalene R og G er roten av strøklengden for de to 10°-sektorene rundt vinden, og B er dønningsfaktoren.
  - De bygges stykkevis, 1,5–25 ms per bilde etter hvor tregt bildet går, og holdes per sektor.
  - Den viste teksturen står til den nye er klar, så sjøen aldri faller tilbake til det grove kartet.
  - `ssAt(x, z)` leser det samme på CPU-en.
- **Bølgene:**
  - 10 komponenter for vindsjøen, 96–6,4 m.
  - To spektre, ungt (F = 1 km) og utvokst, som blandes per piksel etter hvor utvokst sjøen er.
  - 3 dønningskomponenter (L = 1,56·T², ×0,8 / 1 / 1,25) fra dønningens egen retning.
  - Amplituden settes per sted fra teksturen, både i verteksskyggeren og i fragmentskyggeren.
  - Uten teksturer i verteksskyggeren, eller med `#novtf`, gjelder verdien ved båten.
  - Når en bølge dreier eller blir lengre, holdes fasen fast der båten er.
- **`seaH`** følger det som tegnes:
  - lokale høyder, bølgegrupper (`grp`), dempingen av korte bølger (`att`) og fadingen mot kanten
  - Gerstner-forskyvningen opphevet med to steg tilbake
  - `seaHFast` (uten opphevingen) til kjølvannet
- **Beaufort-trekk:**

  | Styrke | Utseende |
  |---|---|
  | 0 | Speilblankt |
  | 1 | Kattepoter (krusninger i flekker) |
  | 2 | Blanke småbølger |
  | 3 og over | Skumtopper (se under) |
  | 7 | Skumstriper fra 13,9 m/s |
  | 8 | Sjørokk fra 17,2 m/s (partikler) |
  | 9 | Dis av sjørokk, bare i 3D. Sikten blir 15 km ved 24,5, 4 km ved 28,5 og 1 km ved 32,7 m/s. |
  | 10 | Hvitt hav fra 24,5 m/s |

  Skumtoppene dekker andelen W = 3,84·10⁻⁶·U^3,41 (Monahan og O'Muircheartaigh 1980) der sjøen har hatt 0,2–3 km å bryte på. De sitter på kammene, normalisert med eget standardavvik. Terskelen er tilpasset den målte spredningen: `0,228 + 0,293·z − 0,016·z²`, der z er normalkvantilen. Kanten er like bred som pikselen (`fwidth`), med en svak, myk rand utenfor, og flekkene inni glattes ut før de blir mindre enn et par piksler. Da hakker ikke kanten. Der skummet er for lite til å synes, blir havet hvitere i stedet. Brenningene følger sjøen som når hver strand.
- **Jevne overganger:**
  - Vind, høyde og dønning glir mot nye verdier med tidskonstant 4 s, retningen over 12 s.
  - Alle trekk har myke overganger.
  - `sea3d.py` måler at ingen bølge endrer seg mer enn 1,7 cm når vinden økes i steg på 0,1 m/s fra stille til orkan.
- **Ytelse:**
  - Det flate havet tegnes som ringer rundt det som tegnes nærmere, uten `discard` og uten piksler som tegnes to ganger.
  - Fjernpassen bruker en egen variant med de fire lengste bølgene.
  - `#fps` i adressen viser bildetakten.
  - **Når 3D ikke starter** (Jonas' telefon 04.10.2026, Galaxy A52s): meldingen «3D-visning støttes ikke» sier nå også hvilket steg og hvilken feil som stoppet det (`failWhy`, `G3.failWhy`): WebGL-konteksten, en shader med loggen sin, et byggesteg eller en mistet kontekst. Dyr, NPC-båter, fly og redningsskøyta stopper ikke 3D om de feiler (`opt`).
- **Båtens egne bølger** (`WAKE_GLSL`, `updateWake`). Fartsregimet følger Froude-tallet Fr = v/√(gL) med lengden fra `VESSELS` og simuleringens fart gjennom vannet.
  - **Kelvin-kilen (19,47°):** tverrbølger 2πv²/g lange inne i kilen (faller som 1/√s) og skråbølger med fronter 35° på kursen (k = 1,5·k₀) langs kantene (faller som s^−1/3). De er høyest nær skrogfart (høyde ≈ 0,045·L, maks 0,6 m).
  - **Planende skrog (Fr > 1):** bare skråbølger, flatt hvitt propellvann og hanekam bak påhengsmotoren.
  - **Lange og korte bølger:** de lange løfter havet, de korte gir bare skygge.
  - **I sving:** det rette mønsteret stopper der det går mer enn noen meter fra sporet, og skumstripa (`TRAIL`) fortsetter.
  - **Skumstripa** (Jonas 04.10.2026):
    - Hekkbølgene (de to Kelvin-armene) blekner gradvis og er borte etter 10 s, rundt 115 m ved 23 kn. Før varte de 18 s, 210 m.
    - Hvert hjørne ligger på bølgene der det står. Med én høyde på tvers ble den ene armen mer skjult av bølgene enn den andre, og babord så kortere ut.
    - Propellstrømmen viser bare skumboblene, og de er borte etter 6 s: «kun vise boblepartiklene». Det lyse båndet under dem er fjernet.
  - **Baugbølgen:** klatrer opp i stevnen og løper akterover i 25° (høyde ≈ 0,12·v²/2g, maks 0,6 m).
  - **Brytning:** baugbølgen og hekkbølgen brekker hvitt når de blir bratte.
  - **Sprøyten:** kommer når baugen stuper ned i en sjø, og blåser med vinden.

**Ikke løst her:** fisket inne i havna i kuling (spilltest r2 «knekk» A). Havna blir roligere, slik den er i virkeligheten, så det trenger en egen regel. Bildetakten på nettbrettet er ikke målt. SwiftShader går rundt 2 bilder/s og kan ikke skille.

**Kilder:**
- WMO-tabellen over Beaufort og bølgehøyde (NOAA WPC, Hong Kong Observatory)
- Hasselmann m.fl. 1973 (JONSWAP)
- Shore Protection Manual 1984 / CEM (effektiv strøklengde)
- Monahan og O'Muircheartaigh 1980 (skumtopper)
- SNL «Beauforts vindskala», «frisk bris», «liten kuling»
- met.no / SNL «sjøgang» (Douglas-skalaen)

### 5.21 Skipsstabilitet og båtens bevegelser (02.10.2026)

Brukerens ønske: båtene skal oppføre seg i sjøen etter prinsippene for skipsstabilitet.

Brukerens valg: bevegelse og spill. Båten kantrer ikke, men det kommer tydelige varsler. Ising er ikke med nå.

Fila er `core/03c-stability.js`.

- **Hydrostatikk** (`hullOf`, `stabOf`) fra `VESSELS` (len, beam, draft, disp):
  - Skrogets midlere dypgang gir en blokkoeffisient på minst 0,35. Draft i `VESSELS` er det dypeste punktet.
  - Vannlinjekoeffisient Cwp = (1 + 2·Cb)/3.
  - KB = T·(5/6 − Cb/(3·Cwp)) (Normand) og BM = Cwp²·B²/(11,75·Cb·T) (Murray).
  - Fribord 0,35 + 0,035·L (maks 2,5 m). Dekkskanten går under ved atan(2f/B).
  - Tyngdepunktet: små og åpne båter ligger lavt (KG er en andel av dybden), større båter er bygd til GM ≈ 0,09·B + 0,3 m. Den stiveste av de to gjelder.
  - Resultatet er GM 2,1 m for skiffen, 0,64–0,77 m for sjarkene, 0,9–1,0 m for kystbåtene og 1,3–1,7 m for havbåtene. Alle er over IMOs 0,35 m for fiskefartøy med ett dekk (IS-koden 2008, del B 2.1).
- **Egenperioder:**
  - Rull etter IMOs værkriterium (IS-koden 2.3): T = 2·C·B/√GM, C = 0,373 + 0,023·B/d − 0,043·L/100, med B/d maks 3,5 som formelen er tilpasset.
  - Skiffen ruller på 1,5 s, sjarkene på 4–5 s, kyst21 på 6,1 s og den pelagiske tråleren på 9,2 s.
  - Hiv og stamp: T = 2π·√(Cb·T·1,8/(g·Cwp)).
- **Last** (`stabLoad`):
  - Fangsten ligger lavt i rommet (på dørken i en åpen båt).
  - Karene som venter, og redskapen ligger på dekk (midten 0,8 m opp). Teine 15 kg (stor 25), garn 9, linestamp 25, juksasett 6.
  - Sidene faller ut, så BM faller som (Δ0/Δ)^0,4.
  - Innenfor `gearMax` holder båtene seg over IMOs minimum: sjarken med 150 teiner har GM 0,58 m. Med 500 teiner kommer den ned i 0,32 m.
- **Bevegelser i spillet** (`motionAt`):
  - Vindsjø og dønning møtes hver for seg med møtefrekvensen ωe = |ω − k·v·cos μ|.
  - Rullet svarer på bølgehellingen π·Hs/λ på tvers som en dempet svingning (0,12 av kritisk for spredt sjø), med resonans når møteperioden treffer rulleperioden.
  - Hiv og stamp følger bølger lengre enn skroget og jevner ut de kortere. Vertikal akselerasjon regnes en tredjedel av lengden foran midten.
  - Vind fra siden gir slagside: 0,5·ρ·U²·1,2 på siden over vann (`windHeel`).
- **Arbeidet** (`hsWork`, `motionHere`):
  - Fiske og arbeid om bord (`catchFactors` med bølgehøyden den får, `workTeam`, `teamEff`) bruker bølgehøyden skalert med hvor mye båten beveger seg, mot det samme skroget i drift med siden mot sjøen og tomt dekk. `simday` er uendret (±10 %), og `progweek` gir 312 211 kr mot 312 801 kr uten.
  - Kalibreringen holder derfor i snitt, mens kurs, fart, last og resonans teller.
  - 1 m/s² vertikal akselerasjon teller like mye som 10° rull. Faktoren er avgrenset til 0,6–1,8.
  - Eksempel: skiffen i 18 kn mot sjøen får 1,64, undan sjøen 0,6.
- **Varsler** (`stabState`, `stabTick` én gang i minuttet på sjøen):
  - Redusert når GM er under 0,35 m eller rull + slagside når 60 % av vinkelen til dekkskanten.
  - Kritisk når GM er under 0,15 m eller 90 %.
  - Årsaken er «rank» (for mye på dekk), «synkronrulling» (endre kurs eller fart) eller «kraftig rulling» (legg baugen mot sjøen).
  - Varslene kommer i loggen og i HUD-en. Vær-panelet viser GM, rulleperioden, rullingen og slagsiden.
- **3D** (`updateBoat`):
  - Skroget svarer som en dempet svingning i hiv og stamp (demping 0,35) og rull (0,08), med egenperiodene fra `stabOf` med lasten.
  - Sjøen snittes over vannlinjen i 3×3 punkter, så lange skrog rir over kort sjø.
  - Vind fra siden gir slagside mot le.
  - Skjermen går 6× fortere enn ekte tid, så møteperiodene i 3D er kortere enn i spillets regning. Den høye frekvensen dempes bort av egenperiodene.
- **Ikke med:** ising, kantring, fri væskeflate i rommet, en GZ-kurve forbi dekkskanten (rullet er bare begrenset til 1,6 × dekkskantvinkelen), og Sjøfartsdirektoratets egne krav for fiskefartøy under 15 m (ikke sjekket i detalj).

**Kilder:**
- IMO International Code on Intact Stability 2008: værkriteriet 2.3 og kravene til fiskefartøy i del B 2.1
- Normand og Murray (anslagene for KB og BM)

### 5.22 Manuell styring (03.10.2026)

Brukerens ønske: en frivillig mulighet til å styre båten selv, med gass og ratt på skjermen.
- **Filer:** `core/16-helm.js` (simuleringen), `ui/10d-helm.js` (kontrollene), `helmtest.py`.
- **Innstillingen:** «Manuell styring» på/av i Innstillinger (`S.settings.manual`).
- **Kontrollene i 3D:**
  - Gassen står til høyre: fram, nøytral og bak. Den klikker inn i nøytral innenfor 7 % og blir stående der du slipper.
  - Rattet (joysticken) står til venstre. Sideveis er roret, og det går tilbake til midten.
  - Begge er 16 % synlige til du rører dem.
- **Å ta roret:** rører du kontrollene på sjøen (`helmTake`), stopper ruta eller Autonav. Lager du en ny rute, styrer ruta igjen (`helmOn` krever at det ikke finnes noen `S.plan`).
- **Klokka er den felles** (6×). Jonas ville ikke ha ekte tid mens man styrer, fordi alle spillerne deler klokka.
- **Simuleringen** (`helmStep`) flytter båten hvert tikk (200 ms) med spillsekundene som har gått:
  - Farten følger `BOAT.accel` per spillminutt.
  - Svingen følger `turnR` når båten har fart, med litt propellstrøm når den står stille i gir. På skjermen svinger den høyst ½ rad/s.
  - Drivstoff går etter `fuelLph`.
  - Grunnstøting skjer som med en rute.
  - **Land** stopper båten. Over 3 knop går den på grunn med skade, saktere legger den bare an. Grunnsjekken regner bare grunt vann som grunn, fordi rutene holdes unna land.
- **Kast loss og Fortøy:**
  - «Kast loss» i havna lar deg starte fra kaiplassen (`helmCast`, `helmCastDone`).
  - «Fortøy i …» kommer når du er under 3 knop innen 80 m fra kaiplassen eller 120 m fra havnepunktet (`helmMoorable`).
- **3D:** båten følger simuleringens posisjon tett, og svingen gir krenging og kjølvann som med en rute.

### 5.23 Lys om natta og fyrlykter (03.10.2026)

- **Lyskildene:** opptil 8 punktlys lyser opp terreng, bygg, havneenheter, båter og sjø (`PLG`, `pLit` i skyggeleggerne, `pickLights` hvert bilde). På «Lav» brukes 2, på «Middels» 4.
  - båtens eget arbeidslys over dekk, 26 m rekkevidde
  - sjømerkelysene i nærheten mens de blinker på: fyr 170 m, middels 90 m og små 50 m
  - lyskasterne over kaiplassene, 45 m
- **På sjøen** glitrer lysene i bølgene, med samme ruhet som sola, ut til tre ganger rekkevidden.
- **Lyskjeglene** (`drawBeams`): fyr («M» eller rekkevidde 10 nm og mer) har to kjegler som går rundt én gang i lysets periode.
  - De fleste norske fyr er sektorlys som ikke roterer. Kjeglene er for utseendet Jonas ba om.
  - I Senja-dataene gjelder det Hekkingen og Bukkskinn.
- `lighttest.py` sjekker lysene og kjeglene.

### 5.24 Kino-visning (03.10.2026)

- **Knappen** (filmkamera) under kameraknappen skrur kino på og av (`G3.kino`, `KINO` i `view3d.js`).
- **Opptakene** varer 12–20 s og går etter tur:
  - drone som sirkler
  - lavt langs siden i vannflaten
  - forfra mot baugen
  - fra land når båten går forbi, med telelinse: bildet er rundt fire båtlengder høyt uansett avstand (6–40°)
  - landskap
  - bakfra over kjølvannet
- **Kameraet:** øyet og siktepunktet glattes over 0,7 s, med klipp ved nytt opptak. Horisonten er vannrett.
  - Glattingen skjer relativt til båten (`KINO.eyeR`, `KINO.tgtR`).
  - Før ble den gjort i verdensrammen. Siden båten går seks ganger raskere på skjermen (71 m/s ved 23 kn), hang kameraet rundt 50 m etter, og båten var som oftest utenfor bildet (Jonas 04.10.2026).
  - Kameraet fra land står stille, og bare siktet følger båten.
  - Er båten skjult bak land i mer enn ett sekund, klippes det til neste opptak.
  - Landskapsbildet er tatt nærmere (120 m bak og 80 m til siden), med siktet 60 m foran båten.
- **Opptak som hoppes over:** et opptak med øyet i land eller sjø, eller med noe mellom kameraet og båten (`camFree`), hoppes over. Gisundbrua stenger for eksempel for halvparten av opptakene nord for Finnsnes.
- **«Skjul»** tar bort statusboksen, knappene, kompasset og minikartet. Bare de to kinoknappene står igjen.
- Kameraknappen avslutter kino.
- Funksjonene for kinokameraet kom med i commiten for ytelse ved en feil, men brukes først med kino-commiten.

### 5.25 Lyd (03.10.2026)

- **Fil og oppstart:** `ui/10e-sound.js` (`SND`). Lyden lages i nettleseren med Web Audio uten opptak, og starter ved første trykk.
- **Lagene** følges hvert 100. ms:
  - Motoren følger turtallet fra farten. En påhengsmotor går høyt, en diesel lavt og dunkende. Den går på tomgang når båten ligger stille på sjøen, og er av i havn.
  - Skvulp og vasking langs skroget øker med fart og sjø, og det kommer smell i skroget.
  - Vind, regn og snø.
  - Måker, ofte når det sløyes.
  - I havna: kranens sus og truckens ryggepip mens fangsten landes, pumpa ved bunkring og isrenna.
  - Haleren i hydraulikk mens det hales, og snella ved jukse.
  - Brovaktsalarmen.
- **Hvor lyden kommer fra** (Jonas 03.10.2026): i 3D er øret kameraet (`G3.ear`, fra siste bilde som ble tegnet).
  - Det som har en plass, dempes med avstanden: `(ref / d)^0.9` fra `ref` meter (`SNDREF`).
    - Egen båt (`G3.sndSrc`): motor 12 m, skvulp 10 m, haler 5 m, snelle 4 m og smell 8 m. Måkene er 8–38 m rundt båten (12 m).
    - Mottaket der båten ligger: kran 18 m, truck 20 m og isrenne 15 m.
    - Pumpa: 6 m.
    - De tre nærmeste NPC-båtene innen 2,5 km (12 m, Kystpilen og ferja 30 m): en lav diesel hver, sterkere i fart.
  - Lyden blir mattere langt unna, fordi lavpasset går ned til 35 %.
  - Den panoreres mot venstre eller høyre etter vinkelen fra kameraet (`StereoPannerNode`).
  - Vind, regn og havet rundt deg dempes ikke. Brovaktsalarmen går aldri under halv styrke.
  - I 2D-kartet er øret om bord som før, og ingen NPC-motorer høres.
  - Med kameraet 21 m bak båten er motoren 62 % av full styrke, og 300 m unna 5,5 % (målt i 3D).
- **Innstillinger:** Av, 25, 50, 75 eller 100 % (`S.settings.sound`, `S.settings.vol`). I 2D er lyden 60 % av styrken.
- `soundtest.py` sjekker lagene, avstanden, panoreringen, alarmgulvet og NPC-motorene (med `SND.testEar`/`testSrc`), ikke hvordan det låter.

### 5.26 Måker og halere fra Blender (03.10.2026)

- **Måkene** (`tools/wild/maake.py`, `src/data/gull.b64`):
  - gråmåke og svartbak med egne vingedeler (arm og hånd)
  - vingeslag med raskere nedslag og glid
  - raskere slag når de stuper etter innmat
- **Halerne** (`tools/gear/haler.py`, `src/data/haul-garn.b64` og `haul-line.b64`) er bygd etter målene på Jonas' tegninger. Tegningene ligger ikke i repoet.
  - **Garnhaleren** (Lorentzen-type) er 1 562 mm ut fra stolpen, 745 mm inn og 1 950 mm høy. Den har V-skive av gummi med ribber, hydraulikkmotor, avtakerrull, V-renne og blå slanger.
  - **Linehaleren** er 1 330 × 500 × 440 mm over stolpen. Den har rød V-skive (Ø350), gul avtaker (Ø160), to loddrette føringsruller (Ø60, 225 mm fra hverandre), innløpsrulle (Ø104) og renne.
  - Fargen på stålet (galvanisert grå), stolpehøyden og ribbene på garnskiva har jeg valgt selv.
  - **I spillet** (`drawGearOp`, `haulModel`) står haleren på en stolpe innenfor styrbord ripe på båter over 7,5 m. Skiva går rundt med redskapet (0,6 m/s), og avtakeren går motsatt vei.
  - **Redskapet** følger stien over haleren fra sjøen og ned renna: garnet med flottører, lina med fortommer.
  - **Mannskapet:** de som står på «Haling» i arbeidskjedene, står ved haleren, ved enden av renna og ved binge eller balje. Skipperen er med når det er hans jobb, og forlater da rattet.
  - `haultest.py` tar bilder og sjekker at skiva går rundt.

### 5.28 Regelmotoren langs hele kysten (R2 av regelplanen, 05.10.2026)

`core/03e-rules.js` leser `src/data/rules.json` (se 4.17) og svarer på «kan jeg fiske her?».

**Oppslag:**
- `rulesAt({p, H, len, gear, sp, hand})` gir `{v, items}`. `v` er det verste av `no`, `warn` og `ok`. Hver grunn har tekst på norsk og engelsk, paragraf og kilde, og `block` når spillet stopper deg i dag.
- `ruBlockMsg(q)` gir teksten for det første stoppet, eller `null`.
- `insideFjord(p)`, `insideBaseline(p)`, `blDist(p)`/`blNm(p)`, `ruHom(p)`, `ruLok(p)`, `fjordLimits(p, H)` og `ruMinSize(sp, p)`.
- **Hurtigoppslaget:** Sonene og grunnlinja legges i celler på 100 m, en blokk på 10 km om gangen første gang den trengs. Det gjøres med skannlinjer over ringene. 20 000 oppslag tar noen få millisekunder.

**Reglene, skrevet ut fra forskriftene:**
- **Høstingsforskriften § 31:** Fartøy på 15 m eller mer kan ikke fiske torsk innenfor fjordlinjene.
  - Under 21 m kan de fiske andre arter med konvensjonelle redskap (bokstav h).
  - Sør for 68° 15,6′ N kan de fiske annet enn torsk (bokstav a).
  - Ellers er det ikke lov.
- **§ 33 og § 33a:** høyst 5 000 kroker og 80 torskegarn innenfor fjordlinjene. Fra 1.11 til 30.4 er yttersidene av kroklinjene i seks fjorder i Finnmark unntatt krokgrensa.
- **J-161-2026 § 32**, nord for 62° N med konvensjonelle redskap:
  - **21–27,99 m:** ikke torsk, hyse eller sei innenfor grunnlinja.
    - I område 00, 06 og 07 gjelder forbudet bare torsk.
    - Torsk er lov inn til fjordlinjene 1.1–1.5 i 00, og 1.1–10.4 i 06 og 07.
  - **28 m og over:** ikke innenfor 4 nm.
    - I 06 og 07 gjelder det bare torsk.
    - I 00 er hyse og sei lov utenfor linja i Vestfjorden (og torsk 1.3–14.4), men ikke innenfor fjordlinjene.
    - Fra område 05 til Russland er det lov inn til grunnlinja 1.1–30.6.
    - Øst for Darupskjæret er det lov inn til 2 nm 1.7–31.12.
  - **Henningsværboksen** er stengt 1.1–30.6 for fartøy over 11 m.
  - **Borgundfjorden** er stengt 1.3–31.5, unntatt for håndsnøre.
  - **Bifangst:** Grensene på 5 % og 20 % vises som advarsel.
- **De andre områdene:**
  - stengte felt for line og garn
  - gytefeltene for kysttorsk i sør, 1.1–30.4
  - Oslofjorden: ikke torsk, og bare håndholdte redskap for fisk
  - nullfiskeområdene og Lopphavet
  - Raet, som gir en advarsel
  - de fleksible felleshavene i Lofoten: faste redskap skal være om bord kl. 10–17
- **§ 39:**
  - Kveite er fredet 20.12–20.4 nord for 62° N og hele året sør for.
  - Uer er bare lov med juksa fra båt under 15 m, 1.6–31.8.
  - Disse to stopper ikke spillet ennå. `kveiteClosed` og `uerOpen` i simuleringen styrer det som før.
- **§ 47:** minstemål etter sted for torsk, hyse, sei, kveite, uer og taskekrabbe.

**I spillet:**
- **Juksa:** Juksa og fisket med båten (`08-actions.js`, `05-vessels.js`) stopper der `ruBlockMsg` sier nei, med grunnen i loggen.
- **Faste redskap:** Setting av redskap (`10-gear.js`) stopper på samme måte, og grensene for garn og kroker følger `fjordLimits`.
- **Kartet:** Kartet tegner fjordlinjene langs hele kysten.
- **Sluttsedler:** Sluttseddelen bruker Fiskeridirektoratets lokasjon (`ruLok`).
- **Senja:** Den håndtegnede Senja-linja (`FJORD`) er borte.

`tests/rulestest.py` sjekker punkter langs kysten (sonene, områdene og avstanden til grunnlinja) og svarene for hver regel, med datoer og lengder.

### 5.29 Regler-appen, statuslinja og regellaget (R3 av regelplanen, 05.10.2026)

Jonas: «mange som skal spille dette har kanskje ikke så mye erfaring med fiskeri fra før, så vi blir nødt til å lage en intuitiv løsning der hvordan vi skal vise og lære dem hvilke regelverk som gjelder».

- **Statusboksen** har linja «Regler» når du er på sjøen: ✓ Lov her, ! en grense eller ✕ et forbud, med en kort tekst (`RU_SHORT`).
  - Den gjelder din båt, redskapet hun er rigget med, og kveite når du fisker etter den (`ruCtx`, `ruNow`, som holder svaret i 10 spillminutter og 50 m).
  - Et trykk åpner appen.
- **Regler-appen** (`regler` i `05-phone.js`):
  - **Her og nå:**
    - «Kan jeg fiske her?» med svar, grunner, paragraf og lenke til kilden.
    - Et rutenett med alle arter og redskap for din båt her i dag. Trykk på en rute for å se hvorfor.
    - Hvor du er: fjordlinjene med navnene, grunnlinja i nm, statistikkområdet og lokasjonen, og minstemålene her.
  - **Sjekk:** art, redskap, båtlengde etter lengdegruppene, måned, og hvor. Stedet kan være der båten er, midt i kartplotteren eller en av de seks nærmeste havnene.
  - **Lær mer:** åtte regler forklart enkelt, hver med kilde:
    - fjordlinjene
    - grunnlinja og nm
    - båtlengde og kysttorsk
    - minstemål
    - fredningstider
    - stengte felt
    - Lofoten og Henningsvær
    - sør for 62° N
- **Regellaget i kartplotteren** (`ruLayerBlock` og `ruLayerCanvas`):
  - Laget er rødt der din båt ikke kan fiske med redskapet sitt i dag, og gult der det er grenser.
  - Det regnes på et rutenett på 250 m, en blokk på 10 km om gangen. Én blokk tar rundt 40 ms, og høyst 25 ms regnes per bilde. Resten kommer i de neste bildene.
  - Laget tegnes mykt over sjøen, med fjordlinjene skarpt oppå.
  - Det slås av og på under innstillingene til kartplotteren («Regellag på / Av»). Standard er på.

### 5.27 Forslagslista 04.10.2026 (natta til 05.10)

Jonas' liste: oppgraderinger, kvotehandel, kikkert, raskere fangst, fortøying, snurring ved siste veipunkt, stanga ut, drivstoffpriser, jukse-spill, nattmodus, salg for ekte penger, Blender-modeller, åpningstider, flytrafikk, ny haill og agn. Svarene hans: håndjuksa omtrent dobbelt så rask, luksushaill +200 % (kan justeres ned), motoroppgraderinger på verftet og speed-boost i en egen telefonapp for ekte penger.

- **Siste veipunkt:**
  - 3D-følgeren (`updateBoat`) holdt fart forbi sluttpunktet mens målet sto fast der i opptil ett spillminutt, og snudde rundt punktet. Nå trappes farten ned med avstanden når målet er neste stopp eller rutens slutt, og forbi punktet holdes kursen.
  - `sailV` bremser også inn mot rutens siste punkt.
  - `routetest` steger følgeren med 30 bilder i sekundet: før 360 graders sving, nå 0.
- **Piruett før et stopp** (Jonas 04.10.2026):
  - **Årsaken:** Simuleringen bremser inn mot neste stopp med ett minutts sprang, fra 23 til 8 kn. Punktet følgeren sikter på, saktnet da med én gang, mens følgeren bremset saktere. Den kom 58 m forbi punktet og snudde 360° for å nå det.
  - **Nå:** Ligger punktet bak følgeren langs sporet, holder den sporets kurs og senker farten til punktet er foran igjen. Bremsen regnes ut fra farten båten har.
  - `routetest` har fått et stopp i 23 kn, som gikk 360° før og 0° nå.
- **Juksa ×2 og jukse-spillet:** se «Redskapsstige» og «Jukse-spillet» over.
- **Nattmodus i kartplotteren:**
  - `S.settings.chartNight` er 'auto', 'day' eller 'night', valgt i kartets innstillinger. Auto er natt når sola står mer enn 4° under horisonten der båten er (`chartNight()` i `07-guide.js`).
  - Navigasjonskartet får da mørk sjø i blått og dempet land (`chartRaster`, `FAR`). Kyst, gradnett og bakgrunn bruker fiskekartets mørke stil, og SVG-laget får klassen `plot` (og `night`).
  - Miniplotteren følger med.
  - `tick()` tegner kartet på nytt når sola skifter det (`CHN`).
- **Kikkert i bro-visningen** (`cam.zoom` 1–8 i `view3d.js`):
  - To fingre fra hverandre zoomer (fov = 2·atan(tan(fov0/2)/z)). Dra-farten deles på z, og hjulet zoomer også.
  - Dobbelttrykk og `setHelm` går tilbake.
  - Knipingen endrer ikke lenger `cam.dist` i bro-visning (den endret terrengets rekkevidde i det skjulte).
  - Lyspunktene vokser med z (`uSize × ZF()`).
  - Detaljavstandene for NPC-sett, havneenheter og byggdetalj regnes som avstand/z, byggene med høyst 3×.
  - Kikkertrammen er `#binoc`, som viser «4×».
- **Øyet ved rattet** (Jonas' video 04.10.2026, skiff i 24 kn): Rekka og konsollen hoppet i snitt 3,7 px per bilde mot øyet, mens horisonten sto stille. Øyet ble plassert med glattet hiv og stamp (0,3 s), mens båten ble tegnet uten. Nå sitter øyet fast på skroget, og bare blikkretningen følger stamp og rull dempet (70 %, 0,3 s). Hiv flytter ikke horisonten. Rettingen er ikke målt i spillet ennå.
- **Åpningstider på mottakene** (`mottakOpen`, `mottakNext`, `mottakWhen` i `07-harbours.js`):
  - Mottakene publiserer ingen tider (søkt 04.10.2026: Nergård i Senjahopen oppgir telefon, og Råfisklaget lister mottakene uten tider). Derfor typiske tider: hverdager 06–18, lørdag 08–14, stengt søndag, og 05–22 hver dag i skreisesongen (januar–april).
  - Første tur venter aldri.
  - «Lever» viser når mottaket åpner og har knappen «Vent til åpning» (`playMinutes`).
  - Driftsplanen venter ved kaia (`b.landWait`) og losser når mottaket åpner.
- **Drivstoffprisen** (`fuelPrice(H, pid, diesel)` i `02-species-gear.js`):
  - Grunnprisen × en ukeskurve (AR(1) over ukene som fiskeprisene, ±12 %, lik i alle havner) × havnefaktor (±4 % etter navnet).
  - Grunnprisen ble sjekket 04.10.2026: Preem oppga anleggsdiesel til 16,28 kr/l uten mva (29.08.2026), og fiskefartøy betaler verken mineraloljeavgift eller CO2-avgift (Skatteetaten). Derfor står 14,50 kr/l, og bensinen på 23,90.
  - Bunkringen fører det som faktisk er betalt (`f.paid`).
  - Vær-appen viser diesel denne og forrige uke.

- **Verftet og speed-boost (C1–C4):**
  - **Lasterom** (`HOLDUP`, `S.boat.holdLv`): tre trinn, ×1,25, ×1,6 og ×2,0 av typens lasterom. Isrommet vokser likt (`applyVessel`). Prisen er 4, 7 og 12 % av båtens pris, og jobben `hold` tar 8, 16 og 32 timer.
  - **Last og vekt** (`boatTons`, `boatTons0`, `loadF` i `03-simulation.js`): vekten er egenvekt + last + is + drivstoff + 90 kg per person, mot egenvekt + en fjerdedel av lasterommet + halv tank + én person. Toppfarten ganges med (D0/D)^0,22 for deplasementsbåter og ^0,5 for planende båter, mellom 0,55 og 1,08. Forbruket ganges med (D/D0)^(2/3).
    - Skiffen full: −10 %. Sjarken full: −8 %.
  - **Større motor** (`ENGUP`, `S.boat.engLv`, ikke påhengsmotor): +20 % og +40 % effekt. Prisen er 6 og 11 % av båtens pris, og jobben `eng` tar 12 og 24 timer.
    - Farten følger kvadratroten av effekten for planende båter og kubikkroten for deplasementsbåter, med høyst +12 % (skrogfarten).
    - `fuelK` × (1 + 0,4·(P−1)).
  - **Begroing** (`foulHour`, `S.boat.foul`): vokser hver time i sjøen, 0,012 per døgn i juni–september og 0,004 ellers, og ×0,3 med `EQUIP.antigro` (18 000 kr, 6 t). Full begroing gir −15 % fart og +25 % drivstoff. Jobben `hull` («Skrogrens på slipp», 1 500 kr + 400 kr per meter, 6 t) nullstiller den.
    - Ikke nøkkelen `clean`, som slettes ved oppstart.
  - **Trim-appen** (`BOOSTS`, `S.boat.boost`, bare diesel og ikke påhengsmotor): justert dieselpumpe +10 %, ladeluftkjøling +8 % og økt turbotrykk +12 % effekt, med en tidel bedre akselerasjon hver.
    - Til sammen gir det +10 % toppfart på en deplasementsbåt og +15 % på en planende båt.
    - Kjøpet er i testmodus som haillen. Prisene (49, 59 og 79 kr) er plassholdere.
    - **Effektene er vårt forslag:** Jonas skrev at han hadde oppgitt dem, men de står ikke i meldingene hans.

- **Agn til line og teiner** (`BAITS` i `10-gear.js`):
  - Faktorene per art på line- og teinefangsten:

    | Agn | Pris | Faktorer |
    |---|---|---|
    | Makrell | 18 kr/kg (som før) | sei 1,4 · hyse, torsk og krabbe 1,0 · ellers 0,8 |
    | Krabbe | 10 kr/kg | 1,0 på alt |
    | Reke | 28 kr/kg | torsk 1,4 · hyse og sei 1,1 · ellers 0,8 |
    | Sei | 12 kr/kg | kveite 1,6 · krabbe 1,2 · ellers 0,7 |
    | Krill | 22 kr/kg | uer 1,8 · ellers 0,6 |

  - Prisene er spillverdier, og faktorene følger Jonas' beskrivelse.
  - **Beholdningen** er `pgear.bait`, gruppert etter slag (`baitOf`). Ei gammel lagring blir makrell, fordi teksten var «Sild og makrell».
  - **Valgt slag** (`pgear.baitPref`) bestemmer hva egnebua og egningen bruker, og hva teinene tar.
  - **Stampene husker agnet:** `lines[lk].bt` holder slag → stamper, og et lineset får `baitW`. Teineset får `bait`.
  - **Egen sei og krabbe** kan tas fra lasten i havn før levering (`baitFromHold`). Seien teller på kvoten (`quotaState().sei`).
    - **Antakelse, ikke bekreftet:** fangst til eget bruk skal føres på landingsseddelen etter landingsforskriften. Lovdata var sperret fra arbeidsmiljøet 04.10.2026, og søk ga ikke noe klart svar.
  - Makrell finnes ikke som art i spillet ennå, så den kan bare kjøpes.
- **Inn til kai og ut igjen** (`berthPath`, `berthBlocked`, `berthClear` i `07-harbours.js`):
  - Et punkt er sperret når det er land i 25 m-masken eller ligger innenfor halv bredde av en bryggeboks (`PIERBOX`) eller en havneenhets kaiblokk.
  - **Banen går** fra båten til et punkt 1,5 båtlengder akter for kaiplassen og en bredde ut fra kaia, og så langs kaia inn. Er det fritt, går den rett. Ellers søker den over maskens celler innenfor 1,5 km og strammer linja.
  - **3D:** `moorStep` følger banen, glattet med `pathM`/`pathAt`. Ved avgang går båten baklengs ut fra kaia og så banen ut til havnepunktet (`DEP` i `updateBoat`), før følgeren tar over.
  - **Test:** `harbourtest` sjekker banen inn til hver kaiplass for tre båttyper, fra havnepunktet og fra innseilingen.
- **Fiskeslagene fra Blender** (`tools/fish/fisk.py`, `src/data/fish.b64`, 363 KB):
  - **Artene:** torsk, sei, hyse, lyr, lange, brosme, uer, kveite og taskekrabbe, hver som én del i GLB-en.
  - **Fiskene** er 1 m lange, med hodet mot −z, ryggen opp og høyre side mot +x. Spillet skalerer dem etter vekta. Krabben er 1 m over beina.
  - **Kjennetegnene** er tatt med slik de ses på dekk:
    - torsk: skjeggtråd, overkjeve over underkjeve, flekker og lys sidelinje
    - sei: underkjeven lengst, rett lys sidelinje, kløyvd stjert
    - hyse: svart sidelinje og svart flekk over brystfinnen, høy første ryggfinne
    - lyr: mørk sidelinje som buer høyt over brystfinnen
    - lange og brosme: lange kropper og lange finner. Brosmen har mørkt bånd og hvit kant på finnene.
    - uer: rød, med piggete ryggfinne og store øyne
    - kveite: flatfisk med begge øynene på høyre side, mørk oppe og hvit under
  - **Kroppen** er ringer langs fisken med et smalt bånd for sidelinja. Finnene er tynne plater. Farger og flekker ligger i hjørnefargene.
  - **I spillet** erstatter de de prosedyrale fiskene (`FC`/`fishM`, som står igjen som reserve) gjennom `fishOf(sp)` i `view3d.js`:
    - i baljen på skiffen
    - på jukselina og i jukse-spillet (`hang`)
    - som lykkefisken i haillen
    - som torsken i hendene ved sløying
    - som fangst i blødekaret og på sløyebordet på dekkede båter (`drawDeck`, inntil 8 fisk etter artene i lasten)
  - Krabbene ligger flatt i baljen.
  - **Test:** `vesseltest` sjekker at alle ni delene finnes, at fiskene er 1 m fra snuten ved −z, at kveita er flat og at krabben er rundt 1 m bred.
- **Redningsskøyta som forløp** (`rescue`, `towStep`, `towPose`, `rescueBase` i `05-vessels.js`; `tools/boats/redning.py`, `src/data/boat-redning.b64`):
  - **Hvor den kommer fra:** nærmeste redningsstasjon (Finnsnes eller Gryllefjord). Er stasjonen mer enn 60 km unna, kommer den fra nærmeste havn.
  - **Forløpet** (`TOW`):
    1. Mannskapet mønstrer på 10 minutter.
    2. Skøyta går 25 knop langs leia.
    3. Slepet settes på 5 minutter.
    4. Den sleper deg i 6 knop til nærmeste havn.
  - **Veiene** finnes med `leiaRoute` mens mannskapet mønstrer. Finnes ingen vei, går den rett. En båt på grunn dras først ut til nærmeste vann (`towSea`).
  - **Pris og fangst:** prisen trekkes ved anropet. Fangsten beholdes ved slep og går tapt ved nødanrop, som før.
  - **I spillet:** statusen viser hva som skjer: venter på redningsskøyta, den er på vei, slepet settes, eller under slep i 6 kn. «Spol fram til havn» står i skuffen og i panelet, og Redning-appen viser slepet i stedet for knappene.
  - **3D:** en generisk redningsskøyte på 16,5 m, uten merker fra Redningsselskapet:
    - oransje skrog, hvitt styrhus og svart fenderlist
    - mast med radar og blålys som blinker
    - lanterner som lyser om natta
    - slepetauet går fra slepekroken til baugen din
    - den høres som en stor båt
  - **Test:** `towtest.py` sjekker oppmønstringen, farten, at veiene aldri går over land, pris og fangst, båt på grunn, spoling og statusteksten.
- **Garn og line i 3D** (`drawSetting`, `haulFish` i `view3d.js`; `tools/gear/blaase.py`, `src/data/gear-marks.b64`):
  - **Setting:** redskapet går fra bingen eller balja over hekken og akterut i sjøen. Garnet har flottører og blytau, og lina har agnede kroker på tauemene. Dreggen går over først og synker. På skiffen går det over hekken på babord side av påhengsmotoren.
  - **Blåsestaken fra Blender** står i begge ender av hvert sett: oransje flottør, stang med blylodd under, svart flagg og radarreflektor. Dreggen har fire fliker.
  - **Trekking:** fisk kommer opp i maskene og på krokene, så mange som settet har igjen, med artene i forhold.
  - **Test:** ingen ny test, fordi det bare er tegning. Det er sjekket med skjermbilder.
- **Fly og helikopter** (`05c-air.js`; `tools/air/fly.py`, `src/data/air.b64`):
  - **Modellene** er generiske og uten flyselskap:
    - et regionalt propellfly: høyvinget, med T-hale, to motorer og firebladede propeller, 22 m langt og 26 m mellom vingetuppene, omtrent som Dash 8-100/200
    - et tomotors helikopter med fembladet rotor på 14 m
  - **Plassene:**
    - 37 flyplasser og 19 helikopterplasser (baser og sykehus) i en håndliste
    - koordinatene er skrevet fra hukommelsen og ligger innenfor noen hundre meter
  - **Rutene:**
    - 40 flyruter og 13 helikopterruter, et tenkt nett og ikke en ekte rutetabell
    - hver rute går 1–4 ganger om dagen hver vei, mellom kl. 06 og 22, litt ulikt fra dag til dag
  - **Flygingen:**
    - flyet stiger med 8 %, flyr 470 km/t i opptil 5 500 m høyde og kommer inn på 3 grader
    - helikopteret flyr 250 km/t i 250–500 m høyde
  - **I 3D** vises de innenfor 15 km:
    - propeller og rotorer går rundt
    - lanternene lyser om natta, og de røde antikollisjonslysene og de hvite strobene blinker hele døgnet
    - lyden er en dur som vokser og avtar, og helikopteret har rotorslag
  - **Test:** `airtest.py` sjekker rutetabellen, høydeprofilen, at ingen fly går om natta, at tabellen er lik hver gang, og målene på modellene.

## 6. Regelverk og kilder

| Tema | Kilde | Hovedpunkter |
|---|---|---|
| Kvoter nord for 62° N | J-161-2026, gjeldende fra 01.10.2026 (fiskeridir.no/yrkesfiske/j-meldinger/j-161-2026). Kjeden: J-30, J-43, J-52, J-57, J-76, J-80, J-88, J-137, J-156, J-161 | Se 5.5. Stopp i åpen gruppe 16.4.2026 (J-57). Garantert torsk 8–9,99 m er 4,2 t |
| Fordeling av norsk kvote | Fiskeridirektoratets saksdokument 5/2025 (reguleringsmøtet november 2025), og tilsvarende for 2019–2024 | Avsetninger, åpen gruppe 6,62 %, trålstigen, Finnmarksmodellen. Gir § 5 eksakt |
| Bestander og råd | HI, kvoteråd for 2027 (juni 2026), og IMR-VNIRO-rapporten 2026 | Torsk: TAC 2026 285 000 t, råd 2027 312 667 t, B_lim 220 000, B_pa 460 000 t. Hyse og sei i STOCK |
| Strukturkvoter | Forskrift om spesielle kvoteordninger for kystfiskeflåten (J-244-2025), og høringsnotatet om strukturgevinst 2026 | 11–27,99 m, samme gruppe, 10 % avkorting, 20 år, kvotetak 3× (11–14,99) og 4× (15–27,99). Særlig kvoteordning under 11 m fra 2025 |
| Åpen gruppe og ferskfisk, historikk | Saksdokumentene 2019–2025 | Stopp 24.3.2019, 20.4.2020, 1.5.2023, 15.5.2025, 16.4.2026; ingen i 2021, 2022, 2024. Ferskfisk 2017–2025 |
| Maskevidde i torskegarn | Maskeviddeforskriften (Lovdata 1989-10-10-1095) | Minst 156 mm nord for 62° N. Spillet selger 156, 180 og 200 mm |
| Trekk i oppgjøret | Norges Råfisklag, «Forklaring til trekk på fiskers avregning» (rafisklaget.no, lest 04.10.2026) | Lagsavgift 0,43 % (ferskt fra 1.7.2026). Av totalen minus den: pensjonstrekk 0,4 %, produktavgift 1,6 % (fra 1.1.2026), forskningsavgift 1,35 %, ressursavgift 0,42 %, kontrollavgift 0,22 % (ikke under 15 m ennå). MVA 11,11 % på salget til salgslaget. Se 5.4 |
| Fjordlinja og redskap | Høstingsforskriften kap. VI (§ 31, 33, 33a, lest 04.10.2026) | Innenfor: høyst 80 torskegarn og 5 000 kroker (yttersidene av kroklinjene i Finnmark unntatt 1.11–30.4), ikke snurrevad. 15 m eller mer: ikke torsk; under 21 m andre arter, sør for 68° 15,6′ N annet enn torsk. Se 5.28 |
| Kysttorsk etter lengde | J-161-2026 § 32 (lest 04.10.2026) | 21–27,99 m ikke innenfor grunnlinja, 28 m og over ikke innenfor 4 nm, med unntak etter område og dato. Henningsværboksen og Borgundfjorden. Se 5.28 |
| Grunnlinja og sonene | Kartverket, Norges maritime grenser (Geonorge, 25833) | Grunnlinja, 1, 4, 6, 10, 12 og 24 nm. Se 4.17 |
| Reguleringskartet | Fiskeridirektoratet, Yggdrasil/Fiskerireguleringer (38 lag) og Statistikområder | Fjordlinjer, kroklinjer, stengte felt, gytefelt, Oslofjorden, Lofoten, kongekrabbe. Se 4.17 |
| Røkting | Høstingsforskriften kap. V | Garn og line for kveite og breiflabb minst hver 4. dag. Hvert fartøy røkter egne teiner |
| Trål | Høstingsforskriften kap. XIII | Forbudt innenfor 12 nm, med unntak. Ikke i spillet ennå |
| Tapt redskap | Fiskeridirektoratet, «Meld tapt redskap» | Meldes til Kystvakten med type, mengde og posisjon |
| Taskekrabbe | Høstingsforskriften kap. X; HI 2023–24; Råfisklaget rundskriv 8/2025 | Minst 13 cm skallbredde nord for 59°30'. Mye krabbe sør for Senja. Pris etter hann/hunn med hele klør (kronetallene ikke hentet) |
| Line | Store norske leksikon, «line» | Ca. 300 kroker per stamp bankline og 700 hyseline. Snøreline står 3–4 t, annen line over natta |
| Deltakelse | Deltakerforskriften 2025/2026 (Lovdata) | Eier med ≥ 50 % i båt i lukket gruppe gjør at andre båter ikke kan være i åpen gruppe. Eier med båt i åpen gruppe kan ikke ha flere der |
| Eier om bord | Fiskeridirektoratets høringsnotat 26.03.2026 | I åpen gruppe må eieren selv være høvedsmann om bord (unntak ved sykdom, graviditet med mer) |
| Én båt | NFD pressemelding 19.12.2025 | «Ein person, ein båt, ein kvote» |
| Bifangst uten adgang | J-161-2026 § 35 (sjekket 04.10.2026) | Høyst 10 % torsk, hyse og sei samlet per landing, og høyst 2 t torsk |
| Kveite | Høstingsforskriften § 39, 2026 | Fredet 20.12–20.4, 84 cm / 7,2 kg, slippes over 200 cm |
| Minstepriser | Råfisklaget, 21.09.2026 og rundskriv 7/2026 | Se `SPECIES.cls` |
| Priser og sesong | Råfisklaget, salgsstatistikk 2025 | Troms-sonen, fersk |
| Fiskere | Fiskerregisteret 2025 | 9 210 med fiske som hovedyrke og 1 115 med biyrke. Troms 963, 6 % kvinner, 24 % under 30 år |
| Kvotepris | Riksrevisjonen 2017 | 9-meters hjemmel rundt 1,8 mill. kr |
| Hviletid | Forskrift om arbeids- og hviletid på fiskefartøy (FOR-2017-11-10-1758) §§ 1 og 3 | ≥ 10 t hvile per 24 t og ≥ 77 t per 168 t, høyst to perioder der én er ≥ 6 t, og ≤ 14 t mellom hvileperiodene. Gjelder ikke den som jobber alene på egen båt. Snittet på 48 t arbeid per uke er ikke modellert. Sjekket mot søkeresultat 01.10.2026, fordi Lovdata er sperret her. |

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

**Fra 02.10.2026 står havneenheten i alle de åtte mottakshavnene** (se 5.13). Den erstatter de genererte mottakene i B3, bunkerskaiene i B5 og kaifrontene i `QUAYS` for disse havnene. Sommarøy, Brensholmen og Frovåg har nå også bunkers. Tidslinjene for landing, forhaling, bunkring og is er de samme. Finnsnes har som før sin kai i `QUAYS` og fyller der båten ligger.

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
- **Riggen** (`b.rig`, `RIGS` i `10-gear.js`, fra 01.10.2026, brukerens valg): Båten er rigget for én type fiske om gangen.

  | Rigg | Krever |
  |---|---|
  | `juksa` | ingenting (håndjuksa eller juksamaskin) |
  | `line` | linehaler eller elektrisk haler |
  | `garn` | garnhaler |
  | `teiner` | teinehaler eller elektrisk haler |

  - Første montering av en haler er en verftsjobb under Oppgrader. Når utstyret er om bord, byttes riggen gratis og med en gang på siden «Rigg» under Verft (`rigBlock`, `rigSet`). Det skjer bare i havn, og bare når alt eget redskap er trukket.
  - Riggen styrer `gearRules` (feil rigg gir «Rigg om på verftet»), `setChoices`, valgene i ruta, driftsplanens stasjoner og knappene. «Jukse» er av uten juksarigg, og «Sett ut» er av med juksarigg.
  - Med passiv rigg gir fisketimer i ruta og etter setting ingen juksefangst. Båten venter («Venter, går …»).
  - Trekking sjekkes ikke mot riggen, slik at gamle lagringer med blandet redskap i sjøen kan trekkes.
  - Gamle lagringer får riggen fra redskapet i sjøen eller fra driftsplanen, ellers juksa (`rigGuess`).
  - En skiff kan rigge line og teiner med elektrisk haler, men ikke garn, fordi garnhaleren bare passer snekke og større.
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

### Felles verden og tid (beslutninger 01.–02.10.2026)

- **Tiden:** 6× beholdes, også for farten i bildet. Et døgn i spillet er 4 ekte timer. Forslaget om ekte fart i bildet (med ETA i ekte tid og på spillklokka) ble vurdert og droppet: døgnrytmen er viktigere, og store båter som går saktere, oppleves uansett realistisk.
- **Spolingen** (tempo 180×, 1 800× og 10 800×) er et adminverktøy for testing og skal fjernes for spillerne. Den ligger nå i Admin-appen i telefonen, sammen med pause og «+ 100 000 kr».
- **Felles verden når serveren kommer:** samme klokke og dato, samme bestander og samme priser fra mottakene for alle. Konkurransen kommer av at alle er ute etter den samme fisken. Bestandene skal bygge på ekte data og forvaltes realistisk.
- **Ingen VHF og ingen sosiale møteplasser.** I kartplotteren kan du trykke på et AIS-mål innenfor rekkevidden og se hvem det er, hvilken båt og hvilket felt hun ligger på.
- **Spillet krever nett.** PWA-en mellomlagrer filene, men spilles bare med nett.

### PWA og hele kysten (veikart, 30.09.2026)

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

### Fartøystigen (V1–V10, godkjent og bygget 01.10.2026)

Båtene er spillets superstjerner, med Fishing: Barents Sea som inspirasjon, men egne navn som forklarer båttypen. Jonas bestemte: stigen går helt til havfiske (havbåtene bygges nå, men låses til kartet utvides vestover), neste kjøp etter startbåten er en båt i lukket gruppe, rundt én uke med vanlig spilling dit, markedspriser med 80 % banklån og toppfinansiering fra Innovasjon Norge, ingen sertifikatkrav ennå, blad B som forenklet aktivitetskrav og store mannskap som nøkkelfolk og lag (bare data foreløpig).

1. **V1 Skjema:** feltene i `VESSELS`, `equipFits`, `BEAM` avledet fra bredden. Ingen kode velger etter typenavn.
2. **V2:** `view3d.js` styres av data (`geoOf`, `turnR`, geo-flagg).
3. **V3 Byggesettet** i `vessel3d.js` (5.13).
4. **V4:** de nye kyst- og havtypene, prisene, fem tilbud med hjemmel, køyer og fjordlinja for 15 m og over (venter i stedet for å fiske innenfor).
5. **V5 Båthandel** (5.1) med `G3.showroom`.
6. **V6:** havbåtene i 3D.
7. **V7 Progresjonen:** blad B, lån som innfris ved salg og innbytte, toppfinansiering og stigen i «Neste mål» (5.5).
8. **V8 Kalibreringen** med `progweek.py`: en bot spiller fra 1. mars med skiffen og spillets egne funksjoner i tre tempo (tur hver tredje dag, annenhver dag og hver dag været tillater). Den går ut når bølgene på feltet og vinden er innenfor det skiffen tåler. Blad B kommer etter 14–16 turer i alle tempo, fordi 1 G binder. Med 10 % toppfinansiering tok inngangen 24 turer, med 15 % kommer den sammen med blad B. Torskekvoten i åpen gruppe (4 t) blir full rundt dag 42 for den som fisker hver dag.
9. **V9 NPC-modellene** (5.14).
10. **V10** dokumentasjonen.

Åpne punkter står i kapittel 10.

### Fase 4: Flåten i kart og 3D

Egne båter vises med egne symboler i kartplotteren, og du kan trykke for å følge. Båter i nærheten vises i 3D.

### Fase 5: Rapport og nøkkeltall

«Mens du var borte» per båt, og lønnsomhet per båt og for rederiet.

### Senere

Større fartøyklasser, snurrevad, trål og ringnot (med lisenser, sonar og farvann utenfor 12 nm), egne anlegg og nye regioner. For PWA, server og hele kysten, se «PWA og hele kysten (veikart)».

## 10. Kjente problemer og åpne spørsmål

- **Mannskapssystemet (01.10.2026) er ikke spilltestet.** Usikre punkter:
  - Antakelser: du våkner med 60 %, maten i havn er nøytral, terskelen for å lage mat uten Kokk i kjeden er kokk ≥ 3, og gode og dårlige trekk måles med faste kg per enhet (garn 25, stamp 80, teine 1,2).
  - Hviletiden telles i hele timer. En kort tur innom kai gir derfor en hvileperiode på én time.
  - Med standardkjedene og uten kokk på 3 eller mer får mannskapet brødskiver hver 6. time, og trivselen går mot −6. Følg med på om det blir for hardt.
  - Når du sovner med mannskap på en båt du ikke følger, går turen videre uten deg. Ingenting stopper båten fra å komme i havn og levere mens du sover.
  - Tester som går over 24 timer på sjøen med deg om bord, kan nå få deg til å sovne. Det vil vise seg i full regresjon.
- **Riggen:** En båt med blandet redskap i sjøen fra en gammel lagring kan trekke alt, men bare sette det riggen tillater.
- **Havet (02.10.2026, 5.20):**
  - Bildetakten på nettbrettet etter endringene i havskyggeren er ikke målt (åpne med `#fps`).
  - Skumtoppene er flekker fra støy på kammene, ikke brytende bølger.
  - Kelvin-mønsteret er en tilnærming med én retning for skråbølgene.
  - Vinden har ikke le bak fjellene, og den herskende vindretningen er ikke sjekket mot seklima.met.no.
  - Fisket inne i havna i kuling trenger fortsatt en egen regel.
- **Hus, veier, bruer og kaier langs kysten (03.10.2026, 4.15):**
  - Artifacten har ikke `vec`-pakkene (35,5 MB får ikke plass under 256 MB), så husene utenfor Senja finnes bare i appen.
  - Dønningen leses av eksponeringen på 500 m (`swellFactor`), som ikke ser moloene. Vindsjøen er roligere bak en molo, men dønningen er ikke det. Den kan dempes ved å lese masken nær land.
  - Dybden ved en kaifront er fra 50 m-dybden og grov. Ukjent dybde regnes som 3 m.
  - Kystkantene som regnes som kai, er funnet med en regel (rett kyst nær en brygge eller et stort industribygg). Små havner uten kartlagte brygger kan mangle fronter, og en steinfylling nær en brygge kan bli regnet som kai.
  - Senja-flåtens kaiplasser kommer når flisas `vec`-pakke er lastet (i 3D innenfor 14 km), og før det ligger båtene som før. Del 5 skal regne plassene ut i rørledningen, så alle får de samme uansett hva som er lastet.
  - Bildetakten med bygg i tette byer er ikke målt på nettbrettet (åpne med «Vis bildetakt»).
- **NPC-trafikken langs kysten (04.10.2026, 4.16):**
  - Båtene går rett fra kaiplassen til havnemunningen, og den streken kan krysse en brygge.
  - Noen få leibiter skjærer et hjørne av land.
  - Terrenget ved en kaifront er fra 25 m-masken, så en båt ved kai kan stå litt inn i terrenget der kaia ikke er kartlagt som brygge.
  - Havnene har ingen navn.
  - Flåten er en tilnærming. Den følger kaiplassen, ikke Fiskeridirektoratets register.
- **Kartplotteren: dobbel kyst langs vannlinja (03.10.2026). Løst 04.10.2026 med «Kystlinja gjelder», se 4.19.** Det som sto her:
  - **Hva som ses:** på nært hold ligger et mykt grønt felt ved siden av den gule kysten, og smale sund er tettet med grønt. Det ser ut som to landmasser oppå hverandre.
  - **Årsaken:** kartet tegner land fra to kilder.
    - Den gule kysten er vektorkysten fra Overture/OSM (`coast2`, forenklet til 3 m, `chartCoast` i `03a-chart.js`).
    - Det grønne er 25 m-masken, de samme polygonene gjort om til ruter (en rute er land hvis midten er det, `fill` i `tools/map/region.py`), pluss moloene. Spillet bruker masken i `isLand`, `legClear` og `groundCheck` (`01-world.js`).
    - På nivå 2 tegner `chartRaster` (`03-map.js`) masken som grønn fjære der den er land utenfor kysten (K7, så spilleren skal se hvorfor en rute blir avvist). Siden 03.10.2026 leses den bilineært, så kanten blir myk.
    - Maskens kant kan ligge 12–18 m fra kysten, til begge sider, og sund under 25–40 m blir lukket.
  - **Tre måter å rette det på:**
    1. **Kystlinja gjelder** (anbefalt):
       - Landsjekken nær kysten bruker `coast2`, og masken er bare en rask forhåndssjekk. Vektorkysten brukes bare der maskens 3 × 3 nabolag er blandet. Avgjørelsen tas lokalt ved å telle kryssinger av kanter fra en rute med kjent svar.
       - Chart-pakkene lastes da rundt båtene, ikke bare i kartvisningen.
       - Moloene, og mask-land mer enn én rute fra vektorland, er fortsatt land.
       - Fjæra tegnes bare der kildene virkelig er uenige.
       - Ingen nye kartdata. Rundt en halv til en hel dag, med `routetest`, `charttest`, `helmtest` og `trip2`.
    2. **Bare fjern det grønne:** raskt, men en rute gjennom et smalt sund kan bli avvist uten synlig grunn.
    3. **Kysten tegnes fra masken** (glattet konturlinje): kart og spill blir like, men kysten blir mindre detaljert på nært hold.

- **Sertifikatene i Sjømann er ikke sjekket mot kildene.** Søk viste «Fiskeskippersertifikat klasse C eller D6» for båter under 15 m og navnene «helseerklæring for arbeidstakere på skip» og «sikkerhetsopplæring for sjøfolk på mindre skip» (Sjøfartsdirektoratet, 12 PAX-siden), men sdir.no og Lovdata var sperret fra arbeidsmiljøet. Hvilket sertifikat en fører av fiskefartøy under 15 m faktisk trenger, og at helseerklæringen varer 2 år, må sjekkes før papirene får betydning i spillet.

- **Blind spilltest 1 (30.09.2026):** Se `docs/playtest/rapport-1.md`. Feilene A1–A13 og A15 er rettet 01.10.2026 (`fixtest.py`, `shoptest.py`, `camtest.py`, `routetest.py`). A14 (ryktekoppen) forsvant med «Kaffe på kaia». Åpent fra rapporten:
  - Lånet innfris nå ved salg og innbytte (V7). Et nytt lån starter fortsatt nye 10 eller 15 år for hele restgjelda.
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

- **Malo-modellen (`breisjark`), åpne punkter:** Skrogformen under vannlinja er anslått (tegningen har ikke spantriss). Fra rattet ser du bare konsollen, ikke stoler eller instrumenter. Rekkverk og vaiere er tynne og kan flimre på avstand. Lyset i spillet er enklere enn i Blender, så sammenlign i spillet, ikke bare med Cycles-bildene. Fila gjør `dist/index.html` 1,25 MB større (6,2 MB). Alle 14 typer på denne måten ville gitt rundt 18 MB, over grensen på 16 MB for én artifact, så de neste krever ekstra filer i artifacten eller PWA-en.
- **Havsjarken (`sjark`), åpne punkter:** Formen under vannlinja er anslått, og ballastkjølen er en egen kropp som ikke glir over i skroget. Stytteseglet står alltid, også i havn. Styrhusets dør på babord side og innredningen er ikke med. De to sjarkmodellene gjør sammen `dist/index.html` rundt 2,6 MB større (7,5 MB).
- **Starterbåten (`skiff`), åpne punkter:** Den gamle skiffen i `buildSkiff` bygges fortsatt én gang og byttes ut med GLB-delene. Den er reserve og kan ryddes bort. Skjermene i konsollen er ikke levende lenger (Jonas). Sløyebordet og blødekaret står tett ved setet, og blødekaret er tegnet i 75 % størrelse. Med de tre detaljerte båtene er `dist/index.html` 8,2 MB.
- **Fartøystigen, usikre tall og regler:**
  - Kvoteprisen (260 kr/kg) er et anslag fra ett salg i 2025 og Riksrevisjonen i 2017. Ingen kilde publiserer kvotepriser (Fiskeridirektoratet, Råfisklaget, HI og NAV sjekket 04.10.2026). Fiskeridirektoratet regner 54 kr/kg ved første hånd, så 260 kr/kg er rundt fem års førstehåndsverdi.
  - Vilkårene til Innovasjon Norge (15 %, 8,9 %, 10 år) er ikke sjekket. Andelen er satt for spillets tempo.
  - G er 130 160 kr (fra 1. mai 2025) og er ikke oppdatert for 2026.
  - Havbåtenes priser og vekt er grove anslag, og statusen til snøkrabbekonsesjonen er ikke sjekket.
  - Blad B er en forenkling av deltakerloven § 6 (tre av fem år). Sertifikatene låser ingenting ennå.
  - Et nytt lån legges sammen med det gamle og betales over nye 10 eller 15 år.
  - `portFits` (kaifront og dybde per havn) er ikke bygget. Alle kystbåtene får plass i alle havner, men havbåtene trenger det når havsteget kommer.
  - NPC-modellene er ikke målt med CPU-struping. Første gang en modell trengs, tar den 5–11 ms å bygge.
- **Minstepriser for andre arter etter 21.09:** Rundskriv 13/2026 er ikke hentet, så lyr og de andre bygger på rundskriv 7/2026.
- **Farten i 3D:** Med tempo 1:6 går båten seks ganger raskere enn virkeligheten. Bevegelsen er jevn, men farten ser høy ut.
- **`S.owned`** er en liste over båttyper fra før flåtemodellen. «Neste mål» følger stigen og bruker hjemlene i flåten, men lista finnes fortsatt.
- **Kveithaill** kan gi rundt 8 000 kr per dag ved kveitefiske om høsten. Sjekk balansen i spilltesting.
- **Klær og kulde:** `coldPen` bruker hele mannskapet (`S.crew.length`), ikke bare dem som er om bord.
- **Sløyetid:** 300 kg per person og time for sløying og 800 for ising er anslag. Jeg fant ingen god kilde for håndsløying av torsk, så tallene må justeres i spilltesting.
- **Driftsplan i åpen gruppe:** En skiff på driftsplan uten kveiteutstyr leverer nesten bare fisk som blir inndratt, fordi torsk, hyse og sei er over bifangstgrensen. Det er etter reglene, men spilleren bør få et tydeligere råd om å kjøpe kveiteutstyr.
- **Drivstoff i Finnsnes:** Bildene viser bare bøteri og utstyrsforhandler i Finnsnes. Jonas vil at Finnsnes selger drivstoff inntil videre (29.09.2026), fra kaia båten ligger ved.

- **Kvotesystemet, usikre tall og regler (04.10.2026):**
  - Totalkvoten for 2027 var ikke satt da systemet ble bygget, så spillet bruker HIs råd med inntil 8 % over.
  - Tredjelandsandelen i formelen for Norges kvote (13,455 %) er regnet ut fra § 2 for 2026, ikke hentet fra en kilde.
  - Bestandsmodellen fra 2028 er enkel og kalibrert på HIs serie 2014–2027. Seiens historiske gytebestand ble ikke funnet.
  - Flåtemodellen i åpen gruppe er kalibrert slik at kvotene for 2026 gir stopp rundt midten av april. Den treffer ikke 2025, da stoppen kom 15. mai med høyere overregulering.
  - Fordelingen av de 1 622 hjemlene på hjemmelslengdene spillet selger, er et anslag. Fiskeridirektoratet oppgir bare gruppene under 11, 11–14,9, 15–20,9 og 21–27,9 m.
  - Om den særlige kvoteordningen under 11 m har avkorting, er min lesning av J-244-2025 (ingen avkorting).
  - Andelen til NPC-eieren i et kvotesamarbeid (50 %) er en antakelse.
  - Fartøy på 21–27,99 m har forbud mot å fiske torsk innenfor grunnlinjen (§ 32). Grunnlinjen finnes ikke i kartdataene, så det er ikke håndhevet.
  - Strukturgevinst som går tilbake etter «modell X», er ikke modellert. Strukturkvoten bare faller bort.
- **`heattest` i testmiljøet (04.10.2026):** Ytelsesmålingen med CPU ×4 holder ikke 3 s i testmiljøet, fordi SwiftShader tegner 3D på den strupede CPU-en. Bygget fra før 04.10 oppfører seg likt (målt med det samme prøveskriptet). Testen bruker rundt 50 minutter. Mål heller på nettbrettet.

## 11. Testing

- **Verktøy:** Playwright med Chromium og SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). Testene finner spillet via `tests/_env.py` (`GAME` med `#notut`, `GAME_TUT` uten).
- **Kjøring** (bare det som er strengt nødvendig, brukerens krav 01.10.2026):
  - Under byggingen: `python3 tests/run.py changed`. Den leser `git diff` og untracked filer, og kjører bare testene i `COVER` for de endrede filene. En test som selv er endret, kjøres. Tekst og dokumentasjon kjører ingenting, og en fil som ikke står i `COVER`, kjører `trip2.py`.
  - `python3 tests/run.py smoke test …` kjører bare de testene du nevner.
  - `python3 tests/run.py full` er hele regresjonen før publisering (49 tester, rundt en time). `--3d` tegner 3D i alle.
  - Testene i `LITE` kjøres med `KYST_LITE=1`, som gir `#no3d` i adressen: G3 er aktiv og alt går som før, men `frame()` tegner ingenting. Det gjorde `shoptest.py` rundt tre ganger raskere (43 s mot 13 s, med de samme 18 OK) og `docktest.py` fra rundt 10 minutter til 61 s. To slike går samtidig, først.
  - Testene i `D3` ser på selve 3D-bildet og går med 3D, én om gangen og uten andre tester ved siden av. Det gjelder også `tut.py` (`DRAWS3D`), som spiller «Første tur» med 3D. SwiftShaders bilder stopper opp under annen last: 03.10.2026 gikk alle 3D-testene som kjørte ved siden av testene uten 3D, ut på tid ved klikk og skjermbilder, men de gikk alene. `vessel3d` (60 skjermbilder) har 1500 s og `sea3d` 1200 s. `routetest` og `heattest` måler millisekunder, og `landtest` følger kranen i 3D bilde for bilde. De går alene til slutt (`SOLO`), ellers forstyrrer de andre testene dem.
  - Loggene havner i `tests/out/logs/`. `boot(pg)` i `_env.py` starter spillet og venter på startskjermen i stedet for faste pauser.
  - Testene henter spillet over HTTP fra en egen server per test (4.6). `KYST_DIST` peker på et annet bygg.
- **Regresjon:**
  - `trip2.py`: hel tur via kartplotter, avgang, 3D, fiske og havn.
  - `tut.py`: veiledningen «Første tur», spilt gjennom med berøring som en spiller, liggende og stående, med tre omlastinger. Skal ende med `"tut": 0`.
  - `dbg23o.py`: ingen WebGL-feil.
- **Funksjonstester**, blant andre:
  - **`seatest.py` (uten 3D):**
    - strøklengderoser og at `exposure()` er uendret
    - le og lo ved 11 m/s, WMO-høydene og jevnheten
    - at vinden dreier gjennom lavtrykkene
    - sjøgang, «krapp» og tekstene i Vær og vær-appen
  - **`stabtest.py` (uten 3D):**
    - GM og egenperioder per båttype
    - teiner på dekk og fangst i rommet
    - resonans
    - at arbeidet kjenner kurs og fart
    - varslene
  - **Fra 03.10.2026:**
    - `helmtest.py` (uten 3D): manuell styring med musa som finger, med «Kast loss», gass, ratt, nøytral, overtakelse fra rute, land og «Fortøy»
    - `sleeptest.py` (uten 3D): søvn på den felles klokka, «Våkn opp», oppvåkning når du kommer tilbake, brovaktsalarmen med ACK og døsigheten
    - `soundtest.py` (uten 3D): lydlagene følger båten. Den sjekker ikke hvordan det låter.
    - `lighttest.py` (3D): lysene om natta, «Lav» og fyrkjeglene
    - `kinotest.py` (3D): kino-opptakene, «Skjul» og avslutning
    - `haultest.py` (3D): halerne fra Blender, skiva og mannskapet
    - `charttest.py`: tidsmåler også første bilde og drar kartet et halvt utsnitt
  - **`sea3d.py` (3D):**
    - ingen hopp fra stille til orkan, ved brå vindendring eller når det nære kartet bygges på nytt
    - skumdekket mot Monahan, både regnet ut og tegnet
    - sjørokk og dis, le mot lo og havn, og `#novtf`
    - kjølvannet for skiff, sjark og kyst21
    - bildene `sea3d_bf.png`, `sea3d_lee.png` og `sea3d_wake.png`
  - `selltest.py`: salg, kvote, ferskfisk og sløying.
  - `simday.py` og `kvtest.py`: kalibrering av fangst.
  - `ordtest.py`: bestillinger, klær og kulde.
  - `streaktest.py`: innloggingsbonusen, med flyttet dato.
  - `fixtest.py`: feilrettingene etter spilltest 1 (haleren, pubkvelden, pubhjulet).
  - `timetest.py`: tidstekstene, nedtelling i ekte tid og «Neste»-brikka.
  - `shoptest.py`: Fiskeutstyr, sekkeis og isrenne, «Neste mål», sluttseddelen som summerer seg, og A8–A13.
  - `booktest.py`: dekksdagboka med faner, med ekte data (to salg gjennom `sell()`, en line satt og trukket med spillets egne steg). Fanene, kryss over det som er over, hendelser med samme prosent som `weekDev`, tellestreker, sluttseddelen som summerer seg og netto, gamle salg uten linjer, blaing innenfor fanen, oppdragslista, Papirer og lenken fra Salgslaget.
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
  - `worktest.py`: arbeid om bord (5.19). Den sjekker kjedene og hvem som står hvor, sløyefarten per person, oppsettene, roret og halingen som alltid får folk, krabbesortering, læring etter alder og trivsel, måltider og brødskiver, mat mot trivsel, 14-timersregelen og natt ved kai, replikker og avstanden mellom dem, energien til sjøs og ved kai, søvn alene (driver) og med mannskap (turen går videre), og menyen «Arbeid» liggende og stående med knapper på minst 44 px.
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
  - `unittest.py`: havneenheten i de åtte havnene. Den sjekker minst 5 m vann langs fronten ved laveste lavvann, at havbunnen i bassenget ikke er over laveste vann i 3D, at truckens hjørner er minst 1 m innenfor dekket langs hele ruta, liggeplassene, mottaket og bunkersstasjonen, og at ingen brygge står på kaia. Bilder: `unit_<havn>.png`.
  - `fleet3test.py`: fase 3. Varsler, båtvelgeren, inntekt per båt og service per båt.
  - `fleet2test.py`: fase 2. Levering med og uten adgang, to båter på driftsplan i en simulert uke, knappene i Fartøy-appen, nybygg til flåten, og lagring med to båter. Skriver `OK` eller `FEIL` per sjekk.
  - `vesseltest.py`: fartøystigen. Ingen valg etter typenavn i `src/js`, fullt datablad og fornuftige forhold for hver type, utstyr som passer, de fem tilbudene, fjordlinja for 21 m, Båthandel liggende og stående (faner, kort med sideriss, havbåtene låst, knapper på 44 px), innbytte til 8,9-metersjarken, og progresjonen: blad B ved tiende landingsdag, migrering, innbyttet som innfrir lånet, inngangen med toppfinansiering, «Neste mål», banken, papirene og salg som innfrir lån.
  - `vessel3d.py` (3D): hver modell på sjøen fra siden, baugen, akter og rattet (`tests/out/vessel_<type>_*.png`, se på dem), punkter mot budsjettet, lengden innenfor 8 %, visningen i Båthandel, og NPC-båtene (modell per båt, skalering, punkter per utgave og et bilde ved siden av en båt som fisker). `python3 tests/vessel3d.py npc` kjører bare NPC-delen.
  - `progweek.py` (LES): boten som spiller fram til første båt i lukket gruppe (V8). Les dagen og turen for blad B og inngangen i hvert tempo.
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
