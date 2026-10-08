# Det Store Blå (Kystfiske) – overlevering fra chat til Claude Code

> Spillet heter **Det Store Blå** fra 04.10.2026 (brukerens valg, domenet detstorebla.no). Navnet står i `<title>`, lasteskjermen, toppstripa (`T.no.title`, `T.en.title`) og PWA-manifestet. Et engelsk navn for lansering i utlandet er ikke valgt. Repoet, lagringsnøklene (`kystfiske_v2`) og andre interne navn heter fortsatt kystfiske og skal ikke endres. Sjekklista for lanseringen står i `docs/lansering.md`.

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

- **Dyp til havs (07.10.2026, for blåkveita):** kjernelaget `deep` er havbunnen fra Terrarium (ETOPO1 til havs) på 1 km celler over hele rammen, i 10 m steg (u8, `dec:'x10'`, opp til 2550 m, 0 = land eller ingen data). `tools/map/deep.py` skriver det inn i kjernepakken i `src/data/map` (navnet og manifestet endres), og `tools/map/game.py` tar den nye kjernen for hele kysten. Kjør `deep.py` på nytt etter at `region.py` har skrevet en ny kjerne. `depthF` bruker laget utenfor kystflisene (`offDepth`), og inne i flisene der flisa har modellens fyllverdi i stedet for Kartverkets dyp og er dypere enn 150 m (`tileDepth`). Blokkbufferen har plass til 16 lag (`gridKey * 16 + id`).

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
- **Krabbeområdet** var et belte fra 35 til 75 km sør for 69,72° N. Fra 04.10.2026 er det kongekrabbens utbredelse (`kingArea`, se «Kongekrabbe» under redskapene). **Fiskerifeltene** (`fieldCode`) og offshore-strøklengden utenfor kartet (`offMapFetch`) regner fortsatt i gamle km gjennom `LGI`.
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
- **Kvalitetsnivåer** (`QUAL`, valget Grafikk i 3D i Innstillinger på telefonen: Auto, Lav, Middels, Høy, Ultra):

  | | Lav | Middels | Høy | Ultra |
  |---|---|---|---|---|
  | Største `dpr` | 1 | 1,25 | 1,5 | 3 (skjermens egne) |
  | Nærterreng (nær / langt kamera) | 3 / 6 km | 6 / 12 km | 6 / 12 km | 9 / 18 km |
  | Punkter per side: nær / midt / fjern | 256 / 256 / 255 | 256 / 256 / 255 | 256 / 256 / 255 | 384 / 384 / 511 |
  | Finbakken (1 km rundt båten) | 768 m, 192 | 1024 m, 256 | 1024 m, 256 | 1024 m, 384 (2,7 m) |
  | Fjernterrengets vindu | 100 km | 100 km | 100 km | 160 km |
  | Kameraets fjerngrense og klarværssikt | 170 / 50 km | 170 / 50 km | 170 / 50 km | 260 / 90 km |
  | Landmasken | 2048 | 2048 | 2048 | 4096 |
  | Bølgefeltet (600 m) | 4 m | 4 m | 4 m | 2 m |
  | Bygg og trær | 1,3 km | 1,3 km | 1,3 km | 2,2 km |
  | Mottak, naust og båter i full detalj | 1 × | 1 × | 1 × | 1,8 × |
  | Tid til nett og skygger per bilde | 3+2 ms | 4+3 ms | 5+4 ms | 9+8 ms |
  | Skygger på terrenget | av | på | på | på |
  | Havskyggeren | fjernvarianten helt inn til bølgefeltet | full | full | full |
  | Sjørokk og sprut i lufta | av | på | på | på |

  - **Ultra** (Jonas 05.10.2026: «en ultra grafikk setting ... finne ut hvor grensa ligger for flagship-modeller») velges bare for hånd, aldri av Auto. Det krever 32-bits indekser (`OES_element_index_uint`, `UINT`), ellers blir det Høy. Nettene over 65 536 punkter får `Uint32`-indekser (`i32`), og tegnekallene velger type etter det. Bildetakten vises med «Vis bildetakt» i Innstillinger. Testen er `tests/ultratest.py`.

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

### 4.12b Hindringer i sjøen for rutene (05.10.2026)

Jonas: «autoruter aldri skal gå gjennom 3d elementer eller landmasse». Båten hans seilte gjennom en pilar på Gisundbrua. Dette gjelder langs hele kysten: bruer, staker, påler, lykter, kardinal- og lateralmerker.

- **`core/11b-obstacles.js`** samler det 3D-visningen bygger i sjøen, slik simuleringen ser det, i meter i den nasjonale rammen:
  - **Bruer** (`BRIDGES` på Senja, `t.bridges` fra vec-pakkene ellers), regnet som `bridgeInto` i `view3d.js` gjør (`obsBridge`):
    - Pilarene står i det 18 m lange steget der dekket passerer et multiplum av 70 m. De regnes som sirkler.
    - Dekket er delt i biter på 8 m, hver med laveste underkant. Underkanten regnes med endene på 1 m, og 3D-visningens ender ligger like høyt eller høyere. Der ruta går under, er det tegnede dekket derfor minst så høyt.
    - En bit som er lavere enn båten (`obsAir`, 0,35 × lengden, 2–16 m, pluss 1 m for tidevann og sjø), er en vegg. Bruer under 60 m ligger lavt hele veien.
  - **Kaier og moloer på påler**: `PIERBOX` og vec-pakkenes `t.piers`, som rektangler. Kaidekkene (`made`), som står på land bak en kaifront, er ikke med.
  - **Pålekaia ved fars naust.**
  - **Sjømerkene** som 3D-visningen bygger (`SEAMARKS.marks` på Senja, kystens fra sjøkartpakkene, 4.12c).
  - Havneenhetens blokk og fylling er land allerede (`isLand`).
- **Indeksen** (`obsIndex`) har 250 m-celler, og hver ting ligger i alle cellene innen 40 m. Den bygges på nytt når vec-pakkene endres (`VEC.ver`) eller naustet flyttes.
  - `obsSegHit(a, b)` går gjennom cellene etappen krysser (DDA) og gir den første tingen etappen kommer nærmere enn `obsClr` (halve bredden pluss 6 m).
- **Autonav** (`leiaRoute`):
  - `leiaLegOk` krever at etappen er fri for hindringer. Utrettingen tar derfor ikke snarveier gjennom dem.
  - Ingenting teller innen 40 m fra rutas start og mål (`HIND.ctx.free`), fordi en båt kan ligge inntil en kai eller skal til naustkaia.
  - Før utrettingen lastes vec-pakkene langs veien (`obsLoad`, høyst 4 s).
  - Etterpå går `obsRoute` gjennom etappene. En etappe som fortsatt treffer noe (søkets celler er 100 m og større, og nabocellene sjekkes ikke), får en omvei (`obsDetour`, opptil tre ting etter hverandre):
    - **Under en bro:** midt i et løp mellom to pilarer der dekket er høyt nok, fra et punkt 45 m eller mer ut på hver side.
    - **Rundt et merke:** på den korteste siden.
    - **Rundt en kai:** om hjørnene.
    - Hvert bein i omveien sjekkes mot land og hindringer, og det skal ikke være farligere enn etappen det erstatter (`obsSafe`): like dypt, og uten skjær innen 25 m. Gikk etappen selv forbi skjær, skal beinet være minst 15 m fra dem, eller like langt unna som etappen. trip2-ruta tilbake under Gisundbrua gikk på grunn på et skjær før denne regelen. Under en bro kan omveien også gå tilbake til etappens egen linje rett etter brua.
    - Finnes ingen trygg omvei, beholdes etappen slik den er.
- **Under seiling** (`obsSail` i `sail`, `05-vessels.js`): etappen båten er på, sjekkes én gang per veipunkt og hver gang vec-pakkene endres. Treffer den noe, legges en omvei inn foran neste veipunkt. Det gjelder alle ruter, også de som er tegnet for hånd, og pakkene langt unna, som kommer først når båten nærmer seg.
- **Testen** er `tests/obstest.py`:
  - Gisundbruas pilarer.
  - Autonav fra Finnsnes til Botnhamn under brua.
  - En etappe gjennom en pilar og en gjennom et sjømerke.
  - Korte bruer som vegg.
  - En tegnet rute gjennom en pilar, rettet under seiling.
  - trip2-ruta under Gisundbrua og tilbake: rundt pilaren, ikke nærmere skjærene, tilbake i havn.
  - En lang bro i Tromsø-flisa (Ramfjordbrua) når bygget har vec-pakkene.
- **Ikke gjort ennå:** et ferdig leinett fra Kystverkets hovedleder og bileder. Med det ville Autonav nesten ikke trenge å regne, og rutene gå der ekte båter går.

### 4.12d Autonav går aldri på land (08.10.2026, tilbakemeldingene #47 og #48)

Jonas: «Autonav må fungere 10 av 10 ganger, og en bruker skal aldri havne i en slik situasjon pga. Autonav.» En spiller med mannskap om bord gikk på grunn på Autonav fra Vannareid til Honningsvåg. Gjenskapt i testen: ruta var for lang for ett 100 m-rutenett, så korridoren gikk på 200 m-celler, og et rått steg mellom to celler (aldri sjekket som linje) krysset land to etapper utenfor Vannareid.

- **Korridoren i biter** (`leiaCorridor`, `leiaCorridor1` i `core/11-route.js`): etter det grove søket deles den grove veien i stykker som hver får plass i 2 × `LEIA.maxCells` celler på 100 m (200 m bare utenfor flisenes detalj). Rutenettene er lagt fast fra rammens origo, så et stykke slutter i samme celle som det neste begynner i. Vannareid–Honningsvåg (146 nm) går nå på 100 m-celler på 5–7 s.
- **Hver etappe sjekkes som båten seiler den** (`leiaLegSafe`, `leiaMend`): etter utrettingen går hver etappe gjennom simuleringens egen regel (land, dybde under dypgang + `LEIA.minOver` (0,5 m) utenfor havnene, molo, skjær innen 12 m). En etappe som feiler, legges rundt via et punkt til siden av midten (40–300 m), ellers med et fint søk mellom endene; finnes ingenting, svarer Autonav «Fant ingen trygg rute dit» i stedet for å levere ei rute båten grunnstøter på.
- **Celler grunnere enn dypgang + 0,5 m er stengt** (`leiaCost`), ikke bare dyre (før kostet de 30 ganger). Dybden sjekkes også de siste 50 m inn mot hvert punkt (`leiaLegOk`), unntatt når punktet selv ligger grunt (ei blåse, naustet). Et mål på grunt vann avvises («For grunt der for båten»), og kartplotteren flytter et slikt trykk ut til nærmeste dype punkt innen 500 m (`deepNear` i `ui/03b-route.js`).
- **Kartet rundt begge endene lastes først** (`leiaRoute0`): `approachPath` for ei fjern havn kastet «mask block is not loaded» når flisene der ikke var inne.
- **Sikkerhetsnettet i simuleringen** (`sailReplan`, `sailStop` i `core/05-vessels.js`): treffer `groundCheck` på en etappe ruta kalte trygg (ikke én spilleren tegnet gjennom grunna og kastet loss på, `pl.unsafe`), stopper båten 25 m før, og Autonav finner en vei rundt derfra til neste punkt (`leiaRoute`, spleiset inn i ruta, høyst tre forsøk per etappe). Finnes ingen, ligger båten stille og resten av ruta går tilbake til kladden. Det gjelder også etter en drift, en pause eller et slep, og driftsplanens og den automatiske returens etapper.
- **Søvn:** sovner du alene mens Autonav går, holder autopiloten kursen og båten går fram til ruta er slutt (`vesselStep`). Uten rute driver hun som før, men stopper før land eller grunt vann (`sleepDrift`). Ingen grunnstøting i søvne.
- **Telemetrien** om grunnstøting har nå farten før den ble nullstilt og `how` (leia, route, return, ops, helm, sleep, drift), i `S.incidents` og `cloudEv('aground')`. Den gamle farten var alltid 0.
- **«Sitter båten fast?»** (`unstuck` i `core/05-vessels.js`, kortet i Redning-appen; tilbakemelding #49: i Vannareid gikk båten ti meter og hoppet tilbake til mottaket, både med Autonav og manuelt): legger båten ut på trygt vann like utenfor (ytterste punkt på havnas vei inn, ellers nærmeste punkt minst 200 m fra land og dypt nok), der den ligger stille. Ikke under slep, høyst hvert tiende ekte minutt, gratis. Tilstanden båten hadde (status, havn, plan, ror, hvile, landing, flytting, jobber og de siste fortøyningene i `S.dockLog`) går til telemetrien som `unstuck`, så årsaken kan finnes. Hoppet lot seg ikke gjenskape med en ren lagring, verken på versjonen han spilte (`592f875`) eller den nye.
- **Test:** `tests/autonavtest.py` (søvn på rute, drift mot land, sikkerhetsnettet med og uten `unsafe`, fristen, grunt trykk, og fire nasjonale ruter der hver etappe sjekkes med `groundCheck` og `isLand` hver 5. m). 30 tilfeldige mottakspar langs kysten ble kjørt i tillegg (resultatet står i commit-meldingen).

### 4.12e Autonav for hele kysten: leinett, fint søk ved endene, land i grunnsjekken (08.10.2026)

Jonas: «Autonav burde være så bra at den fint klarer å lage en rute fra Oslo til Kirkenes.»

- **Leinettet** (`tools/leia/leinett.py`, `src/data/leinett.json`, `core/11c-leinett.js`): Kystverkets hovedleder og bileder fra Geonorges WFS «farled» (typen `app:HovedledOgBiled`, 214 hovedleder og 926 bileder, åpne data, NLOD, kilden oppgitt i dataene) gjort om til en graf i spillets ramme. Punktene er tynnet (Douglas–Peucker 15 m), punkter innen 30 m er ett knutepunkt, linjer som krysser får et knutepunkt der de krysser, og løse ender innen 1,5 km av en annen led kobles til den. 6270 knutepunkter, 95 % i ett sammenhengende nett, 132 kB.
  - Ruter over 10 km går inn på nettet: fra starten til ett av de nærmeste knutepunktene innen 12 km (rett etappe, ellers et kort søk, ellers det fine 25 m-søket helt fram, `lnetAccess`), korteste vei gjennom nettet (Dijkstra, `lnetPath`) og ut til målet. Så rettes ruta ut og hver etappe sjekkes som båten seiler den (`leiaMend`).
  - Langs nettet gjelder den strenge regelen først (sikker dybde og 25 m fra skjær, som rutelistas varsler); en etappe som ikke kan legges om, beholdes hvis den holder båtens eget minimum (`st.soft`). Har nettets rute slike etapper og strekningen er under 400 km, regnes rutenettet også, og ruta med færrest slike etapper velges (Bergen–Florø: rutenettet, 0 av 36).
  - Målt: Oslo verft–Bugøynes (nærmeste havn til Kirkenes) 1459 nm, 198 punkter, ingen etappe på grunn eller land, 35 s. Reine–Bergsfjord (fant ingen vei før) 6 s, Vannareid–Honningsvåg under 2 s.
- **Trinn 1, fint søk ved endene** (`leiaLane` i `core/11-route.js`): en ende i trangt vann (100 m-cellen har land eller er under 150 m fra land) får en vei på kartets 25 m-maske ut til åpent vann, bredde først, gjennom vann dypt nok for båten, uten å skjære et landhjørne eller krysse en molo, innen 2,5 km. Det grove søket leter 8 km etter åpent vann ved endene.
- **Havner som var stengt inne** (`approachPath` i `core/07-harbours.js`): 6 av 359 havner (mottakene i Ålesund, Fosnavåg, Laukvik og Vengsøy, utstyrsbutikkene i Vanse og Søndeled) lå i lommer der kaia og fyllingen stengte vannet. Da regnes land innen 80, 150, 250 og 400 m av havnepunktet som passerbart (`pt.free`, `quayLand`). Søndeled utstyrsbutikk er fortsatt stengt (data).
- **Land i grunnsjekken** (`groundCheck` i `core/01-world.js`): land midt på en etappe er grunnstøting, ikke bare grunt vann, sjekket hver 5. m (dybden hver 20. m). Autonav sjekker land hver 2. m (`leiaLegFail`): en holme tynnere enn 4 m gled mellom prøvene på Bodø–Olderdalen.
- **Ikke gjort ennå:** nettet sjekkes mot kartet hver gang en rute lages; et ferdig sjekket nett i dataene vil gjøre lange ruter mye raskere (neste steg), og en kontroll av alle mottakspar i Actions.

### 4.12c Sjømerker langs hele kysten (05.10.2026)

Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av norge ha også. Dette er ikke en senja-simulator».

- **Kilden** er OpenStreetMaps seamark-tagger (OpenSeaMap; i Norge for det meste fra Kystverkets data), hentet med Overpass. Overpass er stengt for skyøkta, men åpen i Actions.
  - `tools/map/sjomerker.py fetch` henter i ni bånd langs kysten og gjør dem om til den nasjonale rammen (km), i formatet til `src/data/seamarks.json`:
    - **lykter** `[x, y, høyde m, rekkevidde nm, rytme (+ på, − av, sekunder), sektorer [[fra°, til°, farge]], 'M'|'m', navn]`. Sektorene er sanne peilinger fra sjøen mot lykta, som OpenSeaMap har dem. Rytmen kommer fra `sequence`, ellers fra karakter og periode (Fl, LFl, Oc, Iso, Q, VQ, F).
    - **merker** `[x, y, type, kategori]`: M fyr, m lykt, P påle, D stake (fare eller spesialmerke), L lateralstake, B bøye, C kardinalbøye, S kardinalstake, K varde. Kategorien er port/starb eller north/east/south/west.
    - **skjær** `[x, y]` (`seamark:type=rock`).
  - `.github/workflows/sjomerker.yml` startes av en endring i `tools/map/sjomerker.json` eller `sjomerker.py`, og legger `sjomerker.json.gz` i releasen `sjomerker-N`.
  - **Kilden i Actions** er Geofabriks `norway-latest.osm.pbf` (1,4 GB), filtrert med osmium (`sjomerker.py pbf`). Overpass ga 504 på det første båndet langs kysten, og beholdes som reserve (`fetch`).
  - **`sjomerker-2`** (05.10.2026) har 7 809 lykter, 23 878 merker og 98 056 skjær, 1,16 MB komprimert. Merkene fordeler seg slik:
    - 13 520 staker (D)
    - 3 267 lateralstaker (L)
    - 2 338 lykter (m)
    - 2 227 bøyer (B)
    - 2 046 påler (P)
    - 331 kardinalbøyer (C)
    - 82 varder (K)
    - 67 fyr (M)

    Sjøkartpakkene vokste fra 9,6 til 10,8 MB.
- **I kartpakkene:**
  - `tools/map/release.py` henter den nyeste `sjomerker-N` sammen med kartreleasen.
  - `tools/map/game.py` (`marks_by_tile`) legger hver flis' merker inn i flisas sjøkartpakke som oppføringen `marks` (JSON, raw deflate, ved flisas første blokk).
  - Sjøkartpakkene er med i artifacten, så sjømerkene er det også. En ny release endrer bare sjøkartpakkene.
- **I spillet** (`core/01e-marks.js`):
  - `marksAdd` leser en flis' merker når pakkens kyst bygges (`coastDone`). Det skjer rundt alle båter og sett (simuleringens sperre), over kartplotterens vindu, langs Autonav-veien og rundt 3D-visningen.
  - Inne i Senjas gamle rute gjelder de innebygde `SEAMARKS`.
  - `marksNear(kind, x, y, R)` gir lyktene, merkene eller skjærene fra `SEAMARKS` og flisene innen R km.
  - `rocksIn` tar med flisenes skjær per 1 km-celle (`marksRocksIn`). Dermed teller de for grunnstøting og for Autonav (`leiaRocks` bruker nå `rocksIn` over rutenettets boks).
  - Kartplotteren tegner lykter og merker fra `marksNear`.
  - Hindringene for rutene (`11b-obstacles.js`) tar med merkene, og indeksen bygges på nytt når `MARKS.ver` endres.
  - **3D:** `markInto` bygger et merke som før. Kystens merker får et nett per flis (`marksStatics`) når flisas terreng er lastet. Lyktene blinker etter `lightLP`: Senjas fase er som før etter rekkefølgen, og kystens etter posisjonen. De tegnes fra `marksNear` rundt øyet (sektorlys innen 50 km, lys som lyser opp innen 5 km og fyrstråler innen 26 km).
  - **Lysets høyde** (07.10.2026, `lightY`): høyden i dataene er lysets høyde over havet, så lyset tegnes der, men aldri lavere enn 4 m over terrenget. Før ble høyden lagt oppå bakken, og et fyr på en knaus hadde lyset langt over tårnet.
  - **Fyrene** (07.10.2026): de 134 fyrene i `src/data/fyr.json` (se 4.26) får et rundt tårn i 3D (`fyrInto`): hvitt med rødt bånd under gangen, mørk gang med rekkverk, lanterne og rødt tak. Lanternen står der lyset er, så tårnet er så høyt som det trengs over terrenget (høyst 40 m). Der et fyr fra registeret står, tegnes ikke kassetårnet til merket `M`.
- **Testene** er `tests/marktest.py` (Tromsø: flisas merker lest, sektorer og rytme, ingen inne i Senja-ruta, skjær i `rocksIn`, hindringene og kartplotteren) og `tests/coast3d.py` (lyktene utenfor Tromsø om natta).

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
- **Nordlyset** (06.10.2026, Jonas' liste: «realistiske draperier med stråler, farger etter høyde og bevegelse»):
  - **Når:** `auroraAt(H, p)` krever at sola står minst 7° under horisonten, at det er klart, og at aktiviteten (en langsom støy som av og til stiger til en storm) er høy nok der båten er. Nordlysovalen ligger over Nord-Norge de fleste aktive netter, så fra 67° N og nordover holder litt aktivitet. Lenger sør trengs sterkere netter: ved Oslo er det bare de sterkeste (`need`, lineært fra 67° N til 59,5° N). `aurorashot` teller 99 av 113 mørke, klare prøvetider med nordlys på Senja og 17 ved Oslo.
  - **Slik ser det ut** (himmelskyggeren i `view3d.js`): tre gardiner langs den magnetiske øst-vest-retningen (12° fra rutenettet). Hver er et loddrett lag fra en skarp underkant 100 km oppe til rundt 300 km, og strålen fra øyet møter laget der den krysser det (to steg langs folden, så laget er sammenhengende i alle høyder).
    - Gardinens linje folder seg og driver langs buen. Strålene står langs feltlinjene og flimrer, og lyset pulserer langsomt.
    - Fargene: grønt (oksygen, 557,7 nm) fra underkanten, rødt (630 nm) høyt oppe, og en lilla kant under når det er sterkt.
    - Et lag sett på skrå er lysere enn et sett rett forfra (lengre vei gjennom laget), og rett over hodet blir det en krone (taket er 4×).
    - Svakt nordlys er en lav bue i nord. Sterkere nordlys kommer sørover og opp over hodet.
  - **Test:** `aurorashot` tar bilder fra broa mot nord en klar januarnatt i tre styrker og uten. Den sjekker at himmelen blir grønnere jo sterkere natta er, at det tegnes uten GL-feil, og forskjellen mellom Senja og Oslo.
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
  - Km-bitene med hus bygges først når flisas bakkehøyder (25 m, `view`) er inne, og bygges på nytt når høyder eller kystlinje for flisa kommer (`staleOver`). Før det sto husene på reservehøydene og sank ned i bakken og snøen (06.10.2026).
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

**Ingen ekte firmanavn** (Jonas 07.10.2026: «vi må fjerne alle ekte firma-navn fra fiskemottakene rundt om i landet. Jeg orker ikke å bli saksøkt»). Registeret leser firmaets navn for å finne mottaket, men skriver det aldri ut: `mottak.json` har ingen `n`, og spillet kaller et mottak ved stedet (`v`, poststedet). Samme regel gjelder alt annet i spillet, i data, tekster, modeller og skilt: bare steder, aldri et firma som finnes. Regelen står i `CLAUDE.md`.

**Resultatet** er `src/data/mottak.json` (0,12 MB) med 310 mottak (5 ble ikke funnet på kartet). For hvert mottak:
- **Hvem og hvor:**
  - type og kommune (ingen firmanavn, se under)
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

### 4.18b Mottakene som havner, og start langs hele kysten (M2, 05.10.2026)

Jonas 04.10.2026: «alle nye brukere skal få bestemme selv hvor i landet de ønsker å starte spillet ... de burde jo få en anbefaling om å starte en plass der det er torsk ... salgslaget på telefonen må vise de 8-10 nærmeste fiskemottakene». Han lot meg velge resten (05.10.2026, «Du får litt frie tøyler»): alle mottak med kai som passer en kystfisker, og spill fra før blir der de er, med én gratis flytting.

- **Navnene:** `mottak.py` slår opp poststedet rundt hvert mottak i Kartverkets adresseregister (`punktsok`, det vanligste innen 800 m, i `cache/steder.json`) og legger det i feltet `v` (Båtsfjord, Senjahopen, Mo i Rana). `python3 tools/mottak/mottak.py steder` legger bare navnene inn i `src/data/mottak.json` som finnes.
- **Havnene** (`core/06b-coastports.js`, før `07-harbours.js`): et fast anlegg (ordinært eller kaiselger) med kai, som tar imot minst 10 t i året av spillets arter, fra små båter (minst 5 %) eller med konvensjonelle redskap (minst 30 %). Det gir 202 mottak. Mottak innen 1,2 km av hverandre blir én havn (det største gir navnet), og de innen 2 km av en Senja-havn blir den havna (den beholder kaia og enheten, og får registerets prisindeks i `mk`). Resultatet er 153 nye havner (`coastal: true`, id `'m' + mottaksnummer`).
  - Kaia er registerets kaifront (`q`) som en `QUAYS`-oppføring (`COASTQ`, slått sammen etter konverteringen i `07-harbours.js`). Havnepunktet ligger 15 m ut fra midten, og strandpunktet 30 m inn.
  - **Kaimottaket fra Blender står ved hvert mottak** (Jonas 05.10.2026: «3 modeller av ulike typer fiskemottak, men som har samme funksjon ... plasseres tilfeldig på stedene der fiskemottakene er på ekte»). Hver kysthavn får en `UNITS`-oppføring med blokkens front på registerets kaifront (`o` midt på, `u` langs, `n` ut mot sjøen) og en fylling på 4 m bak blokka.
    - Utseendet (`v`) velges tilfeldig, men likt hver gang, ut fra en hash av id-en: `a` er dagens mottak, `b` det gamle fiskebruket og `c` det store anlegget. Av de 153 ble det 52 a, 45 b og 56 c.
    - Alt som gjelder enhetene, gjelder også her: liggeplassene (`quayFace` gir enhetens landings- og bunkersplass), land under blokk og fylling (`onUnitGround`), det mudrede bassenget, terrenget rundt (`unitTerr`, `unitPatch`) og kartets hus som tas bort.
    - Kranen, trucken og folkene legges ut når øyet kommer innen 1,5 km og bakken der er lastet (`plantsCoast` i `view3d.js`, kalt fra `nearestPlant`). Da arbeider de ved leveringen som på Senja.
    - Stikkprøve på hvert tiende mottak: blokka står på land, og havnepunktet og liggeplassen ligger i sjøen ved alle. Bildene er `coast_plant_a.png`, `_b` og `_c` fra `tests/coast3d.py`.
  - Prisfaktoren er mottakets prisindeks halvveis mot 1, mellom 0,94 og 1,06. Alle har drivstoff og butikk, og isrenne der mottaket tar imot 1000 t eller mer i året.
  - Like navn får siden av den første de ligger på, for eksempel «Vardø øst» (08c: i stedet for firmanavn viser startvalget antall mottak og tonn i året).
- **De nærmeste:** `plantsNear(p, n)` gir de n nærmeste mottakene (bufret per halve km). Salgslaget viser de 10 nærmeste med avstand og pris for torsk, hyse og sei (fet er beste pris av dem). Snittprisen (`avgPrice`), morgentipset, verdianslaget og pristabellen i havneguiden bruker de 10 nærmeste, ikke alle.
- **Kartdata:** `bootMap` laster bare rundt Senja-havnene, feltene, det som er lagret og den lagrede hjemhavna (`saved.home`), ikke rundt alle mottakene. 3D bygger kaidekk, kaiutstyr og bunkring bare for kysthavner innen 40 km fra båten (`portHere`), og navnelappene slår ikke opp terrenghøyden for havner mer enn 14 km unna. Kysthavnene har ikke havneenheten eller mottaksanlegget i 3D ennå (M3).
- **«Hvor står fars naust?»** (`ui/08c-start.js`, etter brevet og før båtnavnet). Uten kart (Jonas 08.10.2026). Øverst står de tolv stedene der det er mest å tjene akkurat nå, i synkende rekkefølge (`startInfo`: for hver art mottaket tar imot denne måneden, årets kilo fordelt på månedene den tas imot, ganger ukas pris, vektet opp der mye kommer fra små båter). Under står alle stedene per region (Øst-Finnmark … Rogaland og Sørlandet), og et søkefelt finner et sted på navnet, så spilleren kan starte nær der hun bor. **Vangshamn** på Senja (fars naust, `HOME0` i `01-world.js`, en havn uten handel, 5,7 km fra mottaket i Botnhamn) står i lista med Botnhamns tall. Den er det nye standardhjemmet: spill fra før med hjem i Finnsnes eller uten hjem flyttes dit ved lasting (`load` i `02-format-state.js`). Båten blir der den er.
  - «Start her» laster kartet rundt havna (`mapNeed`), flytter båten dit, setter `S.home` og sentrerer kartet. 3D venter mens valget er åpent.
  - **«Første tur»** fra et annet sted: `S.tutStart` har feltet (det beste torskefeltet 1,5–6 km fra havna, på 20–150 m vann, r 1,2 km) og leveringshavna (havna selv, eller Botnhamn fra Vangshamn, som ikke har mottak). `tutNew` tar dem med, og tipsene sier for eksempel «utenfor Kjøllefjord» i stedet for «ved Gisundet nord». Uten `S.tutStart` (bare gamle spill) er det Gisundet nord og Botnhamn som før.
  - **Spill fra før:** Innstillinger har kortet «Hjemsted», der man kan velge nytt hjemsted én gang (`S.moved`, `START_HOMEONLY` i `chooseStart`). Hjemhavna og fars naust flyttes, men båten blir der den er, og man seiler dit selv (Jonas 05.10.2026: «Fast travel er ikke mulig i spillet, punktum.»).
- `tests/starttest.py` sjekker havnene, Salgslaget, hele veien fra brevet til båtnavnet med start i nord, feltet og tipsene der, et salg ved kystmottaket og flyttingen.
- **Svakheter:** Bestillingene (`CUSTOMERS`), mannskapets hjemsteder, NPC-flåten og avisa er fortsatt Senja. Kysthavnene får ikke kaiutstyr i 3D når båten kommer dit etter at 3D er bygget, før siden lastes på nytt. Naustet er ikke plassert ennå.

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
  - Piksler dypt inne i maskens land (cellen og de fire naboene), og der den indekserte kysten sier land (`coastAtIf`), males i landfargen uten at dybden regnes. Land fikk B-splinen for dybden og gjorde fjordnivået tregere.
  - **Tegnetiden i `charttest`** varierer mye i testmiljøet, også på nivået for hele landet, som ikke er endret: 0,49–0,74 s for første bilde med både gammel og ny kode, og fjordnivået 1,5–2,9 s, mot grensene 0,6 og 2,5 s. Bør måles på nettbrettet.
- **3D** (`view3d.js`):
  - `stream3d` laster kartpakkene innen 14 km og bygger indeksen. Når den kommer, bygges terrengnettene over flisa på nytt.
  - **Høydene ved kysten** (`terrRaw`, `COAST3`): der indeksen er inne, stiger bakken 1:1 fra kystlinja til 1,7 m på landsiden og faller like mye på sjøsiden (`coastSdIf`, signert avstand). Vannlinja mellom to punkter i nettet havner da på kystlinja, ikke på rutenettet. Land fra 25 m-masken som står i vann kartet viser, blir borte. Alt land ligger over høyeste tidevann (1,55 m).
  - **Landmasken** (`buildLandMask`, 2048 × 2048 over nærnettet, 1,5–6 m per piksel) tegnes fra `coast2` med moloene, mottakenes kaiblokk og fylling som land og havnebassengene og lommene foran kaiene som sjø. Terrengskyggeren kaster bakke over vannet der masken sier sjø (`uLand`, `uTideY`), så kanten blir kystlinjas egen. Sjøskyggeren kaster ingenting, så den tidlige dybdetesten beholdes.
  - **Det fine terrenget rundt båten** (`FINEM`, `fineWanted`): 1 024 m med rundt 4 m mellom punktene (768 m på lav kvalitet), der nærnettet har 12–47 m. Nærnettet har et hull under det. Ellers ble en 8 m bred molo, som ved Hamnskjæret i Botnhamn, flekkete eller borte.
  - **Moloene:** de som ligger i OSM-kysten, blir terreng. De som er tegnet som molo (Senjas `PIERS` type 1 og vec-pakkenes `molos`), bygges som før som steinfyllinger, som på Husøy.
  - **Kontrollbilder** (`probe/coast3d.py` i kladdemappa): Botnhamn, Husøy og Senjahopen før og etter.
  - **Ikke ennå:**
    - Kantene kan bli litt taggete på skrå, der masken leses fra en grovere mip.
    - Skummet langs land regnes fortsatt fra høydene i nærnettet, ikke fra masken.
    - Hus som står på brygger over vann, viser nå veggene helt ned til vannet, fordi bakken under dem ikke lenger dekker dem.

### 4.20 Skyen: innlogging, skylagring, måling og admin-dashbordet (04.10.2026)

Jonas' valg: gratis å spille med kjøp via Stripe, påkrevd innlogging med WorkOS, Supabase, samtykke til statistikk og bare han som admin. Hele lista står i `docs/lansering.md`.

- **Konfigurasjon:** `src/data/cloud.json` har bare offentlige verdier: vertene (`hosts`), Supabase-adressen og `anon`-nøkkelen, WorkOS-klient-ID-en, et eventuelt eget innloggingsdomene og den publiserbare Stripe-nøkkelen. Skyen er av når en verdi mangler eller siden ikke ligger på en av vertene. Derfor er den av i artifacten, i testene og lokalt. Hemmelige nøkler skal aldri inn her.
- **Databasen** (`supabase/migrations/20261004120000_cloud.sql`):
  - Tabellene er spillere, lagringer, økter, hendelser, feil, bildetakt, produkter, kjøp og rettigheter.
  - Alle tabellene har RLS, med lesetilgang bare for `is_admin()`. Det krever Supabase Auth-ID-en til Jonas i `admins` og totrinnsinnlogging (`aal2`).
  - Spillet skriver bare gjennom funksjonene `tm_hello`, `tm_consent`, `tm_batch`, `tm_error`, `tm_perf`, `save_get`, `save_put2` (før `save_put`), `save_hist_list`, `save_hist_get` og `delete_me` (security definer). Funksjonene sjekker WorkOS-ID-en (`pid()`, tokenets `sub`) og samtykket.
  - Under 13 år teller ikke et ja som samtykke.
  - **Admin-appen i spillet** (05.10.2026, Jonas: «admin-appen på telefonen skal kun være tilgjengelig på min konto»):
    - `players.game_admin` er satt for WorkOS-kontoen til Jonas, og bare der. Ingen spiller kan sette den selv, fordi tabellen ikke har skrivetilgang for spillere.
    - `tm_hello` gir `admin`, og `adminOk()` i `ui/10f-cloud.js` skjuler appen og handlingene uten flagget. Det gjelder på vertene i `cloud.json` (også med `#nocloud` og uten nett) og på GitHub Pages.
    - Artifacten og lokale bygg for testene har appen.
    - En ny admin settes i SQL Editor: `update public.players set game_admin = true where id = '<WorkOS-ID>'`.
    - Spillet kjører i nettleseren, så dette skjuler verktøyene for spillerne. Det stopper ikke noen som endrer siden. Det som må holde i en felles verden, må sjekkes på serveren.
  - Når kontoen slettes, forsvinner alt om spilleren. Kjøpene blir stående uten navn, fordi bokføringsloven krever det.
  - Rådata slettes etter 13 måneder (`pg_cron`).
  - `admin_dashboard(days)` gir alle tallene til dashbordet i ett svar.
  - **Test:** `sqltest` kjører skjemaet på en lokal PostgreSQL med Supabases `auth.jwt()`.
- **I spillet** (`ui/10f-cloud.js`, og AuthKit i `src/vendor/authkit.js`, MIT):
  - `bootMap().then(cloudGate)`: en ny spiller starter som **gjest** (fra 06.10.2026, se under). En enhet som har vært logget inn før, møter innloggingsskjermen når innloggingen er borte. Med innlogging hilser spillet (`tm_hello`), og `cloudSync` avgjør hvilket spill som går videre (se lagringen under).
  - **Gjester** (Jonas 06.10.2026: «nye brukere ikke trenger å logge inn til å starte med», kontoen etter tredje levering, «vær svært bevisst i måten det gjøres på»):
    - Anonym innlogging i Supabase i bakgrunnen (`guestStart`, nøkkelen i `dsb_guest`). Gjesten er med i den felles verdenen og lagres i skyen som alle andre.
    - Myke kort i spillets egne ord: etter «Første tur» («Ta vare på «Havbris»») og etter andre levering («Én landing til på fars papirer»).
    - Etter tredje levering (`S.landN`, `GUEST_LANDS`) venter «Kast loss» på et brev fra Fiskeridirektoratet om fiskermanntallet. Brevet viser båten, pengene og fisken, sier ærlig at spillet bare ligger i nettleseren, og gir en luksushaill. «Ikke nå» lukker alltid. Uten nett venter ingenting.
    - Gjester kan ikke kjøpe med ekte penger (`payBuy` og `shop_quote`).
    - «Registrer meg»: spillet lastes opp, `guest_claim()` gir en engangskode som ligger på enheten (`dsb_guest_code`), og så kommer WorkOS. Tilbake som konto flytter `guest_merge(code)` alt fra gjesten til kontoen før lagringen hentes, og velkomstgaven ligger om bord.
    - Databasen: `supabase/migrations/20261006180000_guest.sql`. Testene: `guesttest.py` og gjestedelen av `sqltest`.
  - En enhet som har vært logget inn før, kan spille uten nett.
  - **Samtykket** spørres én gang, fire sekunder etter start, sammen med fødselsåret.
  - **Målingen** starter med et ja:
    - en økt med et livstegn hvert minutt, med aktiv tid bare når fanen er synlig
    - spilltilstanden: båt, kasse, flåte, rekke og hjemhavn
    - hendelsene, gjennom innpakning av spillets egne funksjoner: `depart`, `sell`, `runAground`, `startSet`, `startHaul`, `PHONE.open` og alle knapper med `data-pa`
    - feil, opptil 20 ulike per økt
    - bildetakten, anonymt
  - **Rage quit:** en økt som slutter innen ett minutt etter en grunnstøting eller en dårlig levering.
  - **Lagringen mellom enhetene** (05.10.2026, `supabase/migrations/20261005200000_save_sync.sql`, etter at Jonas mistet et spill: «Har plutselig mistet progresjon og fått denne båten igjen. Hvorfor?»):
    - **Årsaken var:** den nyeste lagringen etter klokka vant. En enhet med et gammelt spill åpent (en telefon i bakgrunnen) lagret det hvert tredje minutt og var derfor alltid «nyest». Neste start på nettbrettet hentet det over spillet der.
    - **Nå** husker hver enhet hvilken skylagring spillet kommer fra (`dsb_sync_<bruker>` i `localStorage`: skyens `saved_at` som `rev`, og tiden på den lokale lagringen da som `at`). `save_put2` får den som `base` og avviser lagringen når skyen har gått videre siden (en annen enhet har lagret).
    - **Ved start** (`cloudSync`):
      - Ingen spill her: kontoens hentes.
      - Kontoen har spillet herfra (`rev` stemmer): videre med det.
      - Ikke spilt her siden sist i takt (opptil 150 sekunder, det siste minuttet som kanskje ikke nådde opp da siden ble lukket): kontoens hentes.
      - Spilt begge steder: spilleren velger før spillet starter, og ser begge (dag, penger, båtnavn og type, antall båter, om første tur pågår; `saveSum`, sendt med hver lagring som `summary`).
    - **Under spillet:** avviser skyen en lagring, kommer det samme valget som en dialog, og ingenting sendes før spilleren har valgt. «Spillet på denne enheten» sendes med `force`.
    - **Ingenting går tapt:**
      - Spillet som blir erstattet på enheten, legges i `kystfiske_v2_prev` (`loadCode`).
      - Skyen tar vare på de ti siste lagringene i `save_hist`: høyst én per halvtime, og alltid den en tvungen lagring skriver over.
      - Begge kan hentes tilbake under Innstillinger → kontokortet → «Tidligere lagringer» (`cloudHist`, `cloudRestore`). Spillet som byttes ut, tas vare på på samme måte.
    - **Den gamle `save_put`** virker for sider som fortsatt har den gamle koden, men skriver aldri over en lagring fra den nye uten `force` (den har `summary`).
    - **Opplastingen** går hvert minutt når spillet er endret (Jonas: «Kan progresjon lastes opp oftere til database?», før hvert tredje), når appen legges i bakgrunnen og når siden lukkes. Android avslutter ofte en side i bakgrunnen uten `pagehide`.
    - **Plass:** ti historikklagringer per spiller er opptil rundt 1 MB. Det må følges med når spillerne blir mange (gratisplanen i Supabase har 500 MB).
  - **Kontokortet** i Innstillinger har e-posten, statistikkbryteren, «Logg ut» og «Slett kontoen».
  - **Innloggingsdomenet:** WorkOS bruker utviklermodus (fornyelsesnøkkelen ligger i `localStorage`) til et eget innloggingsdomene som `auth.detstorebla.no` er satt opp og ført inn som `workosApiHostname`.
  - **Test:** `cloudtest` bruker stand-ins for WorkOS og Supabase.
- **Admin-dashbordet** (`src/admin/index.html` blir `admin/` i bygget, med verdiene fra `cloud.json` satt inn):
  - Innlogging med Supabase Auth og TOTP. Første gang vises QR-koden for autentiseringsappen.
  - Fanene er oversikt, spilletid, frafall, spillbruk, økonomi i spillet, penger, teknikk, geografi og det som må vente.
  - Diagrammene er SVG, uten biblioteker. Tallene oppdateres hvert minutt.
  - Uten nøkler, eller med `?demo`, vises oppdiktede tall.
  - **Test:** `admintest`.
- **Serveren** (`tools/server/setup.sh` og `Caddyfile`, `.github/workflows/deploy.yml`):
  - Caddy på Hetzner med HTTPS. Kartpakkene bufres i ett år, og siden, service workeren og kartmanifestet sjekkes hver gang.
  - En egen bruker for utrulling som bare kan kjøre `rsync` til `/srv/detstorebla` (rrsync).
  - En brannmur som bare slipper inn port 22, 80 og 443, og automatiske sikkerhetsoppdateringer.
  - Utrullingen går fra `main` og arbeidsgrenen når hemmelighetene `DEPLOY_HOST`, `DEPLOY_KEY` og `DEPLOY_KNOWN_HOSTS` finnes.
  - **`setup.sh` kjøres rett fra GitHub** (`curl … | bash -s detstorebla.no`) og henter da `Caddyfile` fra samme gren (`DSB_REF`).
    - Uten nøkkel lager skriptet deploy-nøkkelen på serveren og skriver ut de tre hemmelighetene. Slik går nøkkelen aldri gjennom chatten.
    - Først sjekker skriptet tre ting: SSH-portene holdes åpne, det stopper hvis noe annet bruker port 80 eller 443, og en fremmed Caddyfile tas vare på som `.bak`.
    - Det legger ut en «kommer snart»-side til første opplasting.
  - `try_files {path} {path}.html`, så `/personvern` og `/vilkar` virker uten `.html`.
- **Personvern og vilkår** (`src/legal/`, utkast 04.10.2026):
  - `build.mjs` legger `personvern.html` og `vilkar.html` ved siden av spillet, med stilen fra `legal.css` satt inn.
  - Innloggingsskjermen og samtykket lenker dit. Tekstene beskriver det databasen faktisk gjør, så en endring i hva som lagres må også inn der.
  - Uten samtykke lagrer `tm_hello` bare kontoen. Utstyret, landet og fødselsåret kommer først med et ja, og et nei i `tm_consent` sletter det igjen.
  - Det som står igjen, og hullet med WorkOS-brukeren ved «slett kontoen», står i `docs/lansering.md` under «Juridisk».
  - **Kilder og kontakt** (05.10.2026): `kilder.html` har dataene, skriftene og programvaren med lisensene, og `kontakt.html` foretaket etter ehandelsloven § 8. Alle fire sidene lenkes fra kontokortet i Innstillinger (ny fane) og fra hverandre. Kommer det nye data inn i spillet, må de også stå på kildesiden.
  - **Skriftene ligger i siden** (05.10.2026): Archivo og Source Serif 4 er lagt inn som latinsk delmengde (`src/data/font-archivo.b64`, `font-serif.b64`, `font-serif-i.b64`, hentet fra Google Fonts med `curl`), som Caveat og Rock Salt fra før. Spillet henter ingenting fra Google lenger, og skriftene virker uten nett.


### 4.21 Felles verden V1–V3: én klokke, én sjø og spillerne på kartet (05.10.2026)

Jonas: «det er viktig at alle har en delt klokke fordi dette er et online-spill». Planen V1–V3 er godkjent: verden starter ved utrullingen, går i 6×, og spillerne skal kunne se hverandre.

- **Klokka** (`core/01-world.js`):
  - Spillminutt 0 (1. mars 2027 kl. 06, `EPOCH`) var `WORLD_T0` = 5.10.2026 kl. 15:00 UTC.
  - Verdens minutt er `worldT()` = (nå − `WORLD_T0`) × `GAME_RATE` / 60 000.
  - «Nå» er serverens tid: `worldSync` (`ui/10f-cloud.js`) leser `Date` fra en ny HEAD av siden og legger forskjellen i `WCLOCK.off`. Uten nett brukes enhetens egen klokke.
  - Klokka gjelder overalt, også i artifacten og på GitHub Pages, men ikke for testene på en lokal server. Der går hvert spill fra 0 som før, med mindre adressen har `#world` (`worldtest`).
- **Spillet følger verdens minutt** (`tick` i `ui/08-actions.js`):
  - Hver tikk går simuleringen fram til verdens minutt, og `acc` er brøkdelen til den glatte bevegelsen.
  - Er spillet mer enn ti spillminutter bak (fanen har sovet), spilles fraværet med `catchUp`, også mer enn 72 timer. Mer enn to uker hoppes over til de siste to (`WORLD_SIM_MAX`).
  - Er spillet foran verdens klokke (en lagring fra før), går det med halv fart til verden har tatt det igjen. Ingenting stilles tilbake. Det gjelder bare de fire lagringene fra før start, som var høyst 0,6 spilldøgn foran.
- **Ingen egen fart:** `simRate()` ser bort fra `S.mult`. Admin-appen viser «Felles klokke» med verdens tid i stedet for fartsknappene. Spoling er fjernet fra før (p31).
- **Samme verden:** `S.qseed` = `WORLD_SEED` for alle, så kvoteårene, bestandene, ferskfiskplanene og kjøperne er like. Været, tidevannet, sola og årstidene regnes fra klokka og er derfor felles av seg selv.
- **Nye spill** begynner på verdens minutt (`newState`). Første tur virker uansett tid på døgnet, fordi mottaket alltid tar imot den første fangsten (`mottakOpen`).
- **V3, spillerne ser hverandre** (`ui/10h-world.js`, `supabase/migrations/20261005220000_presence.sql`):
  - Hvert 15. sekund, mens spillet er åpent, synlig og innlogget, sendes båten du følger med `pos_put`: posisjon (km i spillets ramme), kurs (radianer i rutenettet), fart, status, båtnavn og type. Det er én rad per spiller i `presence`, og den skrives over.
  - `pos_near(x, y, 25 km)` gir de andre båtene som er hørt de siste to minuttene, de nærmeste først. Id-en er en hash, aldri kontoen.
  - De havner i `PEERS`, og `peerStates()` (`core/05-vessels.js`) legger dem til i `npcStates`. Slik vises de av AIS-en i kartplotteren (gul, `ais player`, eget AIS-kort med båttype og størrelse) og av 3D-visningen. Mellom meldingene glir de videre langs kursen i opptil 30 sekunder.
  - I 3D tegnes en annen spillers båt med modellen til sin egen båttype (`npcType` i `view3d.js`, også GLB-modellene), med skipper og mannskap som lokalflåten. Før 05.10.2026 fikk de boksmodellen, så en venn i trebåten så ut som en hvit plastbåt. `vessel3d.py peer` sjekker det.
  - «Vis båten min for andre spillere» på kontokortet (`S.settings.showMe`) stopper sendingen, og `pos_off` sletter raden med en gang.
  - Uten nett, eller før migreringen, sendes ingenting, og båtene forsvinner etter et minutt.
  - Personvernsiden har et eget avsnitt.
  - **Test:** `sqltest` (funksjonene og låsen) og `cloudtest` (sendingen, en båt i nærheten med AIS-kort, og avskrudd visning).
- **V2, felles sjø, kvote og marked** (05.10.2026; `core/03-simulation.js` `WSH`, `ui/10h-world.js` `worldShare`, `supabase/migrations/20261006000000_world_v2.sql`):
  - **Opp:** hvert salg (`sell`, `wshLand`) legges i `S.wq.l`: mottaket, spilltimen på den felles klokka, året, tilgangsgruppa, kilo per art og torsken som teller på kvoten i åpen gruppe. Fisken spillerens egne båter tar fra sjøen (`takeStock`, ikke lokalflåtens i `stockHour`), legges i `S.wq.c` per 2 × 2 km-celle med de samme vektene som bestanden. Køen ligger i lagringen og sendes hvert tiende minutt, og fire sekunder etter et salg (`land_put`, `catch_put` i bunker på 500 celler). En rad databasen avviser (400), droppes. Uten nett venter alt.
  - **Ned** (`world_get`, hvert tiende minutt):
    - De andre spillernes torsk i åpen gruppe i år. Den legges til flåtens fangst (`wshOpen` i `qyStep`), så stopp, økning og fritt fiske regnes med spillerne. Kvote-appen viser «Andre spillere har landet» med antall båter.
    - Hva de har levert til hvert mottak det siste døgnet, avskrevet med 3 % per spilltime som `S.market`. Det fyller mottaket og senker prisen (`wshSat` i `clsPrice`).
    - Fisken de har tatt siden forrige gang, per celle, avskrevet med 0,4 % per spilltime som gjenveksten. Den trekkes fra bestanden din med en gang (`wshTake`). Markøren `S.wcur` ligger i lagringen sammen med bestanden. Et nytt spill får de siste tre døgnene.
  - **Tak per spiller** (mot tull fra en endret klient): 60 t torsk i åpen gruppe per år, 40 t per mottak og 5 t per celle. Fangstradene slettes etter fire døgn, og leveransene blir stående for årstallene.
  - Ingen ser hvem, bare summer. Tabellene har ingen policy, og radene går med kontoen. Admin har `admin_world()` med leveranser, kilo, spillere og celler det siste døgnet.
  - **Topplistene «Norges beste båter»** (05.10.2026; Jonas: «Lag en toppliste for åpen gruppe, der spillere ikke er registrert med rederi, men med båtnavn», «Lag en toppliste for lukket gruppe også, der rederinavn og fartøynavn vil synes for alle», «alle topplistene [skal] være nasjonale lister»; `supabase/migrations/20261006020000_toplist.sql`):
    - Hvert salg har med båtnavnet (`boat` i `landings`), og i lukket gruppe rederinavnet (`company`). Begge er tomme når «Vis båten min for andre spillere» er av.
    - `world_top(w, grp)` rangerer spillerne langs hele kysten etter hva de har landet i åpen eller lukket gruppe i spilluke `w`, altså spilltime w·168 til (w+1)·168 som `weekOf`. Hver landing teller høyst 10 t i åpen gruppe og 60 t i lukket. Lista har topp 20, med båtnavnet (og rederiet i lukket gruppe) fra siste salg, mottaket de har levert mest til, og spillerens egen plass.
    - Salgslaget → Toppliste (`worldTop` i `ui/10h-world.js`) har fanene Åpen gruppe og Lukket gruppe (standard er spillerens egen) og Denne uka/Forrige uke. Lista hentes når den vises, høyst én gang i minuttet per liste, og på nytt etter egne salg. Uten sky vises Senja-flåten som før, nå med båtnavnet ditt og hjemhavna i stedet for firmanavnet og Finnsnes.
  - **Båtnavn fra andre spillere** blir HTML i kartets SVG og AIS-kortet. Derfor fjernes `<>&"'` og backslash og backtick både i spillet (`peerName` i `core/05-vessels.js`) og på serveren (`pos_put` og `land_put`). Før 05.10.2026 kunne et båtnavn med markup ha kjørt kode hos andre spillere i nærheten.
  - **Ikke felles ennå:** gytebestanden og totalkvoten (spillerne er en dråpe mot 285 000 t), registeret over lukket gruppe (`REGN`) og krabbebestanden.
  - **Test:** `sqltest` (summer, tak, markør, lås, sletting) og `cloudtest` (salg og celler opp, kvote, pris og bestand ned, markøren).

### 4.22 Tilbakemeldingsagenten (06.10.2026)

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

### 4.23 Malerverkstedet og navnet på skroget (06.–07.10.2026)

Jonas' bestilling ligger i `docs/engasjement.md`, arbeidslista punkt 1. Alle seks stegene er bygget: skrogfarge, navn på alle båter, malingen til andre spillere, malingsdesign, flagg, registreringsmerke og rederilogo.

- **Malerverkstedet** (`ui/10j-paint.js`) er en egen knapp i Verft-vifta og åpner en side i skuffen (`maler`).
  - 16 skrogfarger i `HULLPAL` (`vessel3d.js`), og «Original».
  - Fargen koster spillpenger: rundt 1 % av båtprisen, minst 1 500 kr (`PAINT.price`). Første fargevalg på hver båt er gratis.
  - Malingen lagres i båtens egen tilstand: `b.liv = {hull:key}` i `S.boat`, som følger fartøyet i flåten og i lagringen. En båt som tas i innbytte (`switchVessel`), og en ny båt i flåten starter uten maling.
  - Det legges ikke inn ventetid: fargen gjelder med en gang.
- **Forhåndsvisningen:** fargen du trykker på, settes i `PAINTPRE` og vises på båten før du betaler (`hullLiv`).
  - `G3.paintView` lar kameraet gå sakte rundt egen båt og legger båten midt i det skuffen lar være fritt (`paintAim`).
  - Skuffen styrer det: `DOCK` kaller `PAINT.live` når siden åpnes og lukkes.
- **I 3D:**
  - En detaljert modell males i sone 1 (`glbPaint`), med den innbakte skyggen beholdt.
  - En byggesettbåt får fargen i `col.hull`.
  - Egen båt har egne buffere (`pvm(t, liv)`, nøkkel `type|own`). Bare fargebufferen lastes opp på nytt når fargen endres, så å prøve farger bygger ingenting nytt. Den håndstyrte båten gjør det samme med `paintHand`.
  - Trebåten (`snekke23.py`) har fått sone 1 på plankene og er eksportert på nytt.
- **Navnet på skroget** (Jonas 07.10.2026: «vises godt på skroget på alle båtene»):
  - `nameStrips(type)` finner en stripe på hver side forut ut fra modellen selv. Skrogets trekanter som vender ut mot styrbord, kuttes ved hver stasjon. Det gir toppen og bunnen av skutesiden og bredden i hver høyde. Små hull i flaten, som spylegatt, bygges det bro over.
  - Stripa er inntil 0,025 L + 5 cm høy (16–90 cm), fire ganger så lang som høy, og midten står en firedel av lengden fra stevnen. Enden ved stevnen holdes av til registreringsmerket.
  - Bokstavene er lyse på mørkt skrog og mørke på lyst (`hullRGB`, `isLight`).
  - Egen båt tegnes i `drawVessel(..., named)`, den håndstyrte med sine egne ankre.
  - De seks nærmeste andre båtene innenfor 250 m (fiskeflåten, kysttrafikken og andre spillere) får navnet sitt med teksturer fra et lite lager (`nameTex`, høyst 10).
- **Andre spillere ser malingen** (`supabase/migrations/20261007090000_livery.sql`):
  - `presence.liv` er en kort kode (`'h:kobolt'`, senere også design, flagg, merke og logo). Den er begrenset til bokstaver, tall og noen skilletegn, og til 160 tegn.
  - `pos_put` har fått argumentet `liv` med standardverdi, og den gamle versjonen med sju argumenter er fjernet. `pos_near` leverer feltet videre.
  - Spillet sender `livStr(S.boat)` bare når båten er malt. Svarer serveren 404 på et kall med `liv`, sendes posisjonen uten (`WORLDP.noLiv`), så den felles verdenen aldri slås av.
  - `peerStates` tar `liv` med, og `npcModel` bygger modellen med `livParse(liv)`. Bare farger fra `HULLPAL` godtas.
- **Malingsdesign** (steg 3, 07.10.2026):
  - Fem design, `DESIGNS` i `vessel3d.js`: ripestripe, totone, vannlinjestripe, stripefarge (modellens sone 2) og nylakkert (glans).
  - Hvert design kjøpes én gang og er ditt på alle båter: `S.cos`, og på kontoen `entitlements`, som kommer som `CLOUD.owned` i `tm_hello`.
  - Produktene `des_*` (type `skin`) står i `supabase/migrations/20261007100000_designs.sql`. `shop_paid` legger også inn eierskapet, og `shop_refund` tar det bort. Spillet gir designet med `giveCos` (`shopGive`, `give:'cos'`).
  - Et design kan prøves på båten før kjøpet. Det som ble prøvd, settes på når kjøpet kommer tilbake (`S.cosWant`).
  - Linjene kuttes inn i skrogets egne trekanter (`glbDesign`) langs skutesidens profil (`topsides`, 96 stasjoner fra sone 1). Kantene blir skarpe uansett hvor fint modellen er delt opp.
  - Egen båt får nye buffere når et design endrer formen (`livGeo`), ellers lastes bare fargene opp på nytt.
  - En byggesettbåt tar ripestripe og vannlinjestripe som `col.stripe` og `col.boot` (`kitLiv`). `designFits` sier hva hver type kan ha.
  - `livStr` sender designene til de andre spillerne (`'h:..;r:..;t:..;v:..;s:..;g:1'`).
- **Flagg** (steg 4, 07.10.2026):
  - Flagget i akterenden er et bilde (`flagCanvas`) på den blafrende duken (`FLAGM`, med `ub` og `drawTexQuad`). Det som ligger utenfor formen, er gjennomsiktig og tegnes ikke.
  - `FLAGS` i `vessel3d.js` har 50 nasjoner, også Sápmi og kvenene, tegnet av noen få former, så de ser like ut på alle enheter.
  - Formene er rektangel, vimpel (strukket 1,7 × 0,8) og splitt. Det norske splittflagget er statsflagget og tilbys ikke (lov om Norges flagg).
  - Norge i rektangel er gratis og det båten kommer med. Alle nasjoner og former er ett kjøp: `des_flagg`, 19 kr, `S.cos.flagg`.
  - Flagget lagres i `b.liv.flag = {c, s}` og går til de andre som `f:SE.vimpel`. Andre spilleres flagg tegnes ikke ennå.
  - **Flaggtidene** (`flagUp(H, p)` i `core/03-simulation.js`, Jonas 07.10.2026): flagget er oppe fra kl. 08 (mars–oktober) eller kl. 09 (november–februar) til solnedgang, senest kl. 21. I Nordland, Troms og Finnmark (nord for 65° N) er det oppe kl. 10–15 fra november til februar. Det følger flaggforskriften fra 1927, som gjelder offentlig flagging. Malerverkstedet viser flagget uansett tid. Vimpelen (4.25) har ingen tider og henger oppe døgnet rundt.
  - Usikkert: noen kilder om flaggskikk til sjøs sier at flagget kan føres hele døgnet under fart. Det har vi ikke kunnet bekrefte i en primærkilde, så spillet bruker de samme tidene til sjøs og i havn.
- **Registreringsmerke** (steg 5, 07.10.2026):
  - Merket består av fylkets bokstaver, et løpenummer og kommunens bokstaver, malt på begge sider nær stevnen (ervervstillatelsesforskriften §§ 22–23).
  - Bokstavene hentes fra `src/data/regmerke.json` (`tools/regmerke/regmerke.py`). For hver av 193 kystkommuner er det bokstavene de fleste av kommunens fartøy har i Fiskeridirektoratets sluttsedler, og løpenumrene som er i bruk.
  - Kommunen er hjemhavnas. En kysthavn er et mottak med kommunen sin. De gamle Senja-havnene står i `PORTK`, der Sommarøy og Brensholmen ligger i Tromsø.
  - `regOf(b)` gir båten et nummer ingen ekte båt i kommunen har, og lagrer det i `b.reg`.
  - Bokstavhøyden følger § 23: 45 cm fra 15 m, 25 cm fra 9 m, ellers 15 cm. Stripa ligger en tidel fra stevnen (`markStrips`, `sideStrip`).
  - Fargene er hvitt på mørkt skrog og svart på lyst, slik § 23 sier (hvitt på svart eller svart på hvitt).
  - Merket står også på ervervstillatelsen under Papirer, og andre spillere ser det (`m:T.112.LK`, der Æ, Ø og Å reiser som 1, 2 og 3).
  - Ønskenummer (`des_reg`, 29 kr): nummeret kan ikke være en ekte båts. Serveren gir hvert merke til én spiller (`reg_claims`, `reg_claim`), høyst ti per spiller.
- **Rederilogo** (steg 6, 07.10.2026; `des_logo`, 49 kr; `supabase/migrations/20261007110000_logos.sql`):
  - Logoen er rederiets (`S.logo`), ikke båtens, og står på alle båtene. Den lages av ett av seks tegn (`LOGOSYM`), opptil tre bokstaver og to farger fra skrogpaletten (`{kind:'g', sym, txt, c1, c2}`), eller er et opplastet bilde (`{kind:'u', img, ver}`).
  - Et opplastet bilde gjøres 256 × 256 (hele bildet, resten gjennomsiktig) og WebP, ellers PNG, på høyst 58 000 tegn (`upload` i `10j-paint.js`). Det prøves på båten før kjøpet, som alt annet.
  - Logoen står midtskips på begge sider (`logoStrips`, en kvadratisk stripe ved halve lengden, høyst 0,06 L + 0,3 m) og kan heises som rederiflagg (flaggkoden `LOGO`, som krever logoen og ikke flaggene).
  - Andre ser den gjennom malingskoden: en laget logo reiser i sin helhet (`l:g.anker.JH.marine.hvit`), et bilde bare som versjon (`l:u.3`), og hentes med `logo_get` etter spillerens id i den felles verdenen (`peerLogo` i `10h-world.js`, mellomlagret per spiller og versjon).
  - Serveren tar ett bilde per spiller (`logos`, `logo_put` krever kjøpet, høyst 30 opplastinger om dagen, bare data-URL for WebP, PNG eller JPEG). Uten skyen (artifacten, testene) blir bildet bare på enheten.
  - Jonas (07.10.2026): «spillere kan laste opp hva de vil, men la meg eventuelt kunne fjerne det i admin-dashboard om det er støtende, samtidig som jeg gir en forklaring på hvorfor. Spilleren skal dermed kunne velge et nytt bilde gratis.» Admin-fanen **Logoer** viser alle bildene og tar et bort med en grunn (`admin_logos`, `admin_logo_remove`). Da får ingen bildet lenger. Ved neste start ser spillet det (`logoCheck`, `logo_mine`), tar logoen av båtene og flagget og sender en melding med grunnen. Kjøpet er spillerens, så et nytt bilde koster ingenting.
  - Vilkårene (punkt 5) og personvernsiden («Rederilogoen du laster opp») sier dette.
- **Test:**
  - `maletest`: knappen, siden, prøvefargen, at første fargevalg er gratis, prisen, for lite penger, lagringen, lukking og innbytte, designene, flagget, registreringsmerket, logoen (laget, opplastet og tatt bort).
  - `cloudtest`: malingen går opp og ned, og en server uten den ennå gir ingen avbrudd.
  - `sqltest`: feltet vaskes, kortes og leveres videre; designene etter kjøp og refusjon; ønskenummeret; logoen (bare etter kjøp, henting, fjerning med grunn og nytt bilde).
  - `admintest`: fanen Logoer tegnes i demoen.
  - Navnene er sjekket på bilder fra siden for alle båttypene.

### 4.24 Fartstid og «Mens du var borte» (07.10.2026)

Jonas' avgjørelser står i `docs/engasjement.md`, arbeidslista punkt 1. Dette er del 1 av 4.

- **Fartstid** (`core/09e-fartstid.js`, `S.fs = {p, rest, away}`):
  - Den går fra 0 til 40 år, uten rangnavn. Den er bare status og låser ingenting.
  - Poengene til år N er `fsNeed(N) = 1 000 000 · (N/40)^2,8`: 33 til første år, 20 617 til tiende, 143 587 til tjuende og 1 000 000 til førtiende. Etter 40 koster hvert år like mye som det førtiende, og det vises som stjerner.
  - `fsOf(p)` gir år, døgn (0–364) og andelen av året. `fsText` lager «12 år fartstid», eller «12 år og 143 døgn fartstid».
  - Om bord tjenes 80 poeng per spilltime til sjøs (`fsMinute` i `step`) og 3·√kr per levering (`fsLand` i `sell`). Fangst tatt med haill teller.
  - Mens du er borte (`FS_AWAY`, mens borte-tida spilles i `catchUp`), og når et mannskap leverer uten deg, teller det en firedel («rederierfaring», `S.fs.away`).
  - **Uthvilt:** hver ekte time borte gir 2 spilltimer dobbel fartstid til sjøs, høyst 18 (`fsRested`). Hvilen brukes bare opp til sjøs og forsvinner aldri ved å vente.
  - Et lagret spill uten fartstid får den regnet ut fra det som er gjort (`fsSeed`): nautiske mil med deg om bord, antall turer og inntekten.
  - Et nytt år gir en linje i loggen og en toast. Hvert tiende år gir en melding fra Kystposten.
  - Tempoet er kalibrert for omtrent 1000 poeng per ekte spilletime. Det gir år 3 første dag, år 5 første uke, år 10 etter rundt en måned og år 40 etter 2–3 år. Tallene justeres i spilltesting.
- **Visningen:** en brikke under «Neste mål» på telefonen viser år og døgn, uthvilt eller døgn til neste år, med en linje. Et kort øverst i Sjømann-appen forklarer hvordan fartstid tjenes.
- **«Mens du var borte»** (`awayStart`, `awayEnd` og `showAway` i `ui/08-actions.js`):
  - `catchUp` tar et øyeblikksbilde før borte-tida spilles, også når den spilles i bolker (`CATCH_LEFT`).
  - Rapporten viser ett stort tall som teller opp: det som ble levert, eller døgnene med fartstid hvis ingenting ble levert. Fartstidslinja fylles, og ved et nytt år fylles den til enden og starter på nytt. Tre ruter viser levert, beste levering og uthvilt, og under står de seks siste hendelsene. Knappen heter «Til sjøs!».
  - Den viser bare det som er vunnet. Etter et kort fravær (under 5 ekte minutter) uten levering eller nytt år vises den ikke.
- **Test:** `fartstidtest` (kurven, utregningen fra statistikk, om bord, uthvilt, borte, levering, rapporten, kort fravær og telefonen).
- **Del 2: den navnløse båten, registreringen og brukernavnet** (Jonas: «Det gir en følelse av eierskap når man får døpe en navnløs båt selv»):
  - Et nytt spill starter uten båtnavn (`boatUnnamed` i `ui/08-actions.js`): `S.unnamed = true`, og `S.boatName` er registreringsmerket, så alt som viser navnet, viser merket. Navnestripa på skroget tegnes ikke (`view3d.js`). Kortet «Båten etter far» har bare knappen «Ta over båten» (`#obGo`).
  - `boatChristen(navn)` døper båten: navnet males på skroget, det står i loggen, og overtroen får det nye navnet (`loreRename`).
  - **Registreringen** (`ui/10f-cloud.js`): `GUEST_LANDS = 2`. Etter første levering sier et kort at én levering er igjen. Etter den andre, eller ved andre åpning av spillet (`S.opens`, `guestOpenAsk`), kommer brevet fra Fiskeridirektoratet. Det ber om båtens navn (`#regBoat`, bare når båten er navnløs) og et brukernavn (`#regUser`, 3–20 tegn, `NAME_RE`). Brukernavnet er påkrevd (Jonas: «Alle registrerte brukere må ha et brukernavn. Det skal ikke være valgfritt»), og det sjekkes mot `name_free` før registreringen. «Har du konto? Logg inn» krever det ikke. Navnene holdes på enheten (`dsb_names`) til kontoen finnes. Da døper `namesApply` båten og tar brukernavnet med `name_claim`.
  - Uten skyen (artifacten) spør `nameNudge` om båtens navn på samme tidspunkt. Testene (`#notut`) får det bare når de ber om det.
  - **Brukernavnet** (`supabase/migrations/20261007120000_names.sql`):
    - Tabellen `names` har ett navn per spiller, unikt uansett store og små bokstaver. Ingen spiller leser tabellen.
    - `name_claim` gir 'ok', 'taken' eller 'bad'. Gjester kan ikke ta et navn.
    - `name_free` og `name_mine` (med grunnen hvis navnet er tatt bort).
    - Admin-fanen «Brukernavn» (`admin_names`, `admin_name_remove`) tar bort et navn med en grunn som spilleren leser i spillet (`nameCheck`). Navnet sperres for godt i `names_banned`, og et nytt navn er gratis.
  - Kontokortet under Innstillinger har brukernavnet og, mens båten er navnløs, båtens navn. Personvernsiden forklarer brukernavnet.
  - **Tester:**
    - `starttest`: den navnløse starten og dåpen.
    - `guesttest`: kortet etter første levering, og brevet med navnefeltene etter den andre. Et ugyldig brukernavn avvises, og navnene holdes på enheten og tas i bruk på kontoen.
    - `sqltest`: brukernavnene.
    - `tut`: åpningen.
- **Del 3: synlig på sjøen** (Jonas: «Det skal ikke være mulig å skjule båten sin posisjon for andre spillere, det er et krav»):
  - Valget «Vis båten min for andre spillere» er borte, sammen med `worldShowMe` og `pos_off`. `worldTick` (`ui/10h-world.js`) legger alltid ut posisjonen, og en levering har alltid båtnavnet (`wshLand`).
  - `pos_put` tar også fartstiden i poeng (`fs`). En server uten den (404) får posisjonen uten fartstid, og så uten maling (`WORLDP.noFs`, `WORLDP.noLiv`).
  - **Migrasjonen** `supabase/migrations/20261007130000_seen.sql`:
    - `players.guest` merkes i `pos_put` og av en trigger på `landings`. Gjestene fra før merkes etter id-formatet: uuid for Supabase-gjester, `user_` for WorkOS.
    - `pos_near` utelater gjester og gir eierens brukernavn (`user`) og fartstid (`fs`).
    - `world_top` utelater gjester, unntatt spilleren selv, og gir brukernavnet.
    - **Kontrollen av fartstiden:** første melding godtas opp til 65 000 poeng (15 år). Deretter vokser den med høyst 5 000 poeng per ekte time siden forrige melding, og den synker aldri. Spillet beholder sine egne poeng, og serveren tar dem igjen etter hvert.
  - **AIS-kortet** for en spiller (`aisInfo` i `ui/03-map.js`) viser eier og fartstid før båttypen.
  - **Kartet:** spillerne tegnes til slutt, gule og større, med en ring. Navnet vises fra `view.z > 1,5` og kommer først blant navnene. Kartplotteren (`#map.plot`) har egne farger, og minikartplotteren i 3D gjør det samme.
  - Topplista viser brukernavnet under båtnavnet.
  - **Alle kontoer har et brukernavn:** `nameCheck` henter navnet fra serveren (`name_mine`), også når det er tatt på en annen enhet.
    - Har kontoen ikke noe navn, spør `nameAsk`. Det gjelder kontoer fra før brukernavnene, navn som admin har tatt bort, og navn som en annen tok før kontoen var klar.
    - Kortet har ingen «Senere». Det venter til andre dialoger er lukket, og kommer tilbake hvis en annen dialog tar plassen.
    - Bare når serveren ikke kan ta navnet nå (frakoblet, eller før migrasjonen), går spillet videre. Da spør det igjen ved neste åpning.
  - Personvern og vilkår er oppdatert: alle registrerte er synlige, med brukernavn og fartstid, og det kan ikke skrus av. Gjester er bare synlige for seg selv.
  - **Tester:**
    - `cloudtest`: fartstiden går opp, eier og fartstid står på AIS-kortet, serveren uten fartstid, ingen skjuling, og det påkrevde brukernavnet (hentes, spørres om uten vei rundt, tatt bort).
    - `guesttest`: registreringen krever et ledig brukernavn.
    - `sqltest`: gjester skjult på AIS og topplista, eier og fartstid, kontrollen av fartstiden, `pos_off` borte.
- **Neste:** achievements («Første uke på sjøen»), se 4.25.

### 4.25 Merker: «Første uke på sjøen» og de langsiktige merkene (07.10.2026)

Jonas' avgjørelser står i `docs/engasjement.md`, arbeidslista punkt 1.5 og 3. Milepælene er kalibrert etter når de to første spillerne som leverte, gjorde ting. Ingen av dem hadde prøvd garn eller line, eller levert til et annet mottak, før dag 3. Ingen hadde levert over 100 000 kr på én gang.

- **Kjernen** (`core/09f-merker.js`, `S.ach = {d, g, ch, l, c, sp, peers, owe, seed, best, pen, colour}`):
  - `ACH` har 21 milepæler i tre kapitler, `ACH_CH`: «Fars båt» (første timer), «Egen skipper» (dag 1–2) og «Kjent på kysten» (resten av uka).
  - Hver milepæl er en funksjon `p()` av tilstanden. Den gir `true` eller `[har, trenger]`.
  - Noen bruker tellere i `S.ach.c`, som `achAdd` setter fra spillet: `sleep` (`restStart`, `fallAsleep`), `equip` (utstyr og redskap kjøpt), `crew` (hyret), `boat` (kjøpt), `haul` (`gearBack`), `storm` (en tur i kuling, Beaufort 6 og mer, hjem uten slep, `achTripEnd` fra `tatTripEnd`), `big` (torsk over 9 kg, `achCatch` i `addCatch`) og `night`.
  - To er skjulte, «???» med et hint: første uvær og storfisken.
  - `achCheck` går hvert tiende spilleminutt (`achMinute` i `step`), ved salg (`achSale` i `sell`), ved turens slutt, når båten tas over og når Merker-appen åpnes.
- **Kapitlene:** et kapittel åpner det neste når fem av sju er tatt (`ACH_OPEN`), så ingen står fast på én de ikke vil ta.
  - Milepæler som er nådd i et kapittel som ikke er åpent, er krysset av når kapittelet åpnes, og gavene kommer da.
  - Når alle sju er tatt, kommer belønningen (`achChapter`) og en melding fra Kystposten:
    - **Kapittel 1:** vimpelen (`pen` = 1).
    - **Kapittel 2:** lengre vimpel (`pen` = 2) og en vanlig haill.
    - **Kapittel 3:** enda lengre vimpel (`pen` = 3) og skrogfargen «Kystfisker» (`HULLPAL` med merket `ach`, `palOk`, gratis å male).
  - Vimpelen går i malingskoden til de andre (`p:N` i `livStr`, `livPen` i `vessel3d.js`). AIS-kortet nevner den ikke (Jonas 07.10.2026).
  - Den er den norske vimpelen (Jonas 07.10.2026): rød og spiss, med korsets hvite og blå på langs ut til tuppen (`penTex` i `view3d.js`, `.ach-pen` i `styles.css`).
  - Den henger fra mastetoppen (`mastTop`: høyeste lanterne + 0,3 m, når den er over flaggstanga) på flaggets klut (`FLAGM`), som blafrer med den tilsynelatende vinden. Båter uten mast, som trebåten, har ingen vimpel, bare flagget (Jonas 07.10.2026: «ser jo teit ut med 2 flagg på hverandre»).
  - Kapitlet vises bare med lengden: omtrent 1,7, 2 og 2,4 m (`PEN_S`). `tests/penshot.py` tar bilder fra siden i frisk bris.
- **Gavene («drypp»)** gis ved `achGive`:
  - **Trekningen:** `achPool(skala)` gir det som passer nå: agn bare med line eller teiner, bøting bare med garn som er slitt, skrogrens bare når båten er begrodd, motorservice når den er over 30 % av intervallet, is og diesel når det er plass. Så kommer penger.
  - **Nivåene:** 7 av 10 vanlige, 2 av 10 gode (full tank, bøting, skrogrens, service, 5 000–10 000 kr), 1 av 10 sjeldne (utstyr som båten ikke har, montert gratis av verkstedet, eller 15 000–25 000 kr).
  - **Skala:** ×1, ×1,5 og ×2,5 per kapittel, og ×3 for de langsiktige merkene.
  - **Trekningen er fast per spill** (`achRnd`, hash av `S.ach.seed` og milepælen). Gaven gis og lagres med en gang, så en omlasting gir ikke ny trekning.
  - **Under første tur** (`tutOn`) venter gavene i `S.ach.owe` og kommer når turen er over.
- **De langsiktige merkene** (`ACHL`) har trinn, og hvert trinn gir en gave. Merkene er største levering (100 000 kr til 1 million), levert i alt (10 til 1000 t), fartstid (10 til 40 år), mottak, arter, nautiske mil, nattfiske, fars merker og andre spillere møtt på sjøen.
- **Et spill som er spilt før** (`achSeed`) blir krysset av for det det har gjort, og får ukas gaver. De langsiktige merkene starter der spillet er, uten gaver for det som alt er gjort.
- **Første slep og første reparasjon er gratis** (`freeFirst` i `rescue` og `hullRepair`). Ved første slep får spilleren beholde fangsten, også ved nødanrop. En melding forklarer hvordan det kan unngås, og hva det koster neste gang.
- **Det spilleren ser** (`ui/05e-merker.js`):
  - Et banner øverst med milepælen og gaven. Det tar ikke imot trykk, og spillet går videre under det.
  - Et kort når et kapittel er fullført.
  - Ett samlet kort når mange kommer på en gang, som for et spill som er spilt før.
  - Merker-appen har tre faner: «Første uke», «Merker» (med fartstiden) og «Tatoveringer» (flyttet fra Sjømann). Sjømann har nå «Fra gamle dager» og «Papirer».
  - Brikka på hjemskjermen viser «Første uke n / 21» og nærmeste milepæl, til kapittel 3 er fullført.
- **I testene** (`#notut`) gis ingen gaver eller bannere uten `window.__achOn`.
- **Trakten** i admin-fanen «Merker» viser hvor mange som nådde hver milepæl, og kapitlene som er fullført. Kilden er spillets hendelser `ach` og `ach_ch`, så bare spillere som deler statistikk telles. `admin_ach` ligger i `supabase/migrations/20261007140000_ach.sql`.
- **Den store trakten** (admin-fanen «Trakt», `admin_funnel(weeks)` i `supabase/migrations/20261007150000_funnel.sql`, `docs/engasjement.md` punkt 9) følger spilleren fra første økt (konvolutten) til første fangst, første og tredje levering, konto, og tilbake etter 1, 7 og 30 dager.
  - Første fangst er milepælen `fish`, eller en levering for spill fra før merkene. Leveringene er spillets `sale`-hendelser, én per levering. Konto er en WorkOS-id (`user_…`) som ikke er gjest.
  - «Tilbake etter N dager» er en økt startet minst N dager etter den første. Den regnes bare av dem som startet for minst N dager siden (`d1n`, `d7n`, `d30n`).
  - Tallene vises totalt og per uke spillerne startet (de siste 8). Steget med størst frafall er merket. Bare spillere som deler statistikk, er med, siden bare de har økter og hendelser.
- **Tester:**
  - `merketest`: alt over.
  - `sqltest`: trakten.
  - `towtest`: slepet med betaling (`S.free` satt).

### 4.26 Turoppdrag fra der du er (07.10.2026)

Punkt 4 i `docs/engasjement.md`. Jonas: en blanding av korte og lange oppdrag ut fra der spilleren er. De lange skal friste til trim, gi god belønning og alltid kunne nås uten. Kjernen ligger i `core/09g-turer.js`, skjermen i `ui/05f-turer.js` og testen i `tests/turtest.py`.

- **Tavla** (`turEnsure`, `turMake`) lages fra der båten er (`turHere`). En ny tavle kommer hver spillmorgen, når båten har flyttet seg mer enn 20 nm (`TUR.move`), og når tavla er tom.
  - Den har to korte, ett middels og ett langt oppdrag. Klassen avgjøres av seilingstiden uten trim (`TUR.cls`, i spilltimer): kort 0,4–3 (opptil en halvtime i ekte tid), middels 3–7,5, lang 7,5–18 (opptil tre timer). `GAME_RATE` er 6.
  - Fra tre års fartstid kommer også sesongflyttingen.
- **Vektet etter spilleren** (`turMe`, Jonas 07.10.2026). Grunnlaget er spillerens egen lagring, som har det samme som skyen. Spillet leser aldri databasen per spiller.
  - **Under ett år fartstid** (før første tur er ferdig): ingen lange oppdrag, bare et kort til.
  - **Under ti år:** de lange går opp til 12 spilltimer (`turHi`). Fra ti år går de helt opp til 18, og bestillingene kan kreve ekstra kvalitet til 20 % tillegg.
  - **Bestillinger:** arten er en spilleren lander, og mengden er omtrent en vanlig landing i denne båten. Omdømmet hos mottaket (`repOf`) gir 0,8–1,2 ganger bonusen.
  - **Rekkefølgen** (`turOrder`): nye spillere får steder de kjenner først, erfarne (fra fem år) nye steder først.
- **Kvotene** (`turRoom`, Jonas 07.10.2026): det som er igjen å lande av hver art.
  - **Uten adgang:** ingen oppdrag ber om torsk, hyse eller sei, siden de bare kan være bifangst. Den tapte redskapen har da lange og brosme i stedet.
  - **Torsk:** det som er igjen under maksimalkvoten mens åpen gruppe er åpen, og av garantert kvote etter stoppen. I lukket gruppe er det fartøykvoten (`codRoom`). Ferskfisktillegget kommer i tillegg, men regnes ikke med.
  - **Hyse og sei i lukket gruppe:** maksimalkvotene (`licQ`).
  - **Kongekrabbe** gis aldri som oppdrag.
  - Et oppdrag ber aldri om mer enn 80 % av det som er igjen. Bestillinger trenger minst 150 kg igjen, og sesongflyttingen 1 000 kg. Mottakenes vanlige bestillinger (`ordersTick`) bruker den samme sjekken.
- **Treffsikkert** (`turCan`): et oppdrag tilbys bare når båten klarer det.
  - **Drivstoff:** turen må gå på 75 % av en full tank (tur-retur for tapt redskap). Mottakene selger diesel.
  - **Åpne båter** holder seg innaskjærs: eksponeringen langs linja må være høyst 0,7, lest fra kjernekartet.
  - **Været:** varselet (`hsAtFc`) skal ligge under båtens egen varselgrense i timene turen tar. Sesongflyttingen sjekker ikke varselet, siden spilleren selv velger dagene.
  - **Avstanden** er den rette linja ganget med 1,25 (`TUR.detour`). «Kjør dit» (`turGo`) finner den virkelige veien med `leiaRoute` og drar, også fra kaia.
- **Belønningen** (`turPay`) er det båten tjener i timen (`turRate`: 9 000 kr i trebåten, etter lasterommet opphøyd i 0,6) ganger timene uten trim, ganget med 1,1, 1,3, 1,6 og 2 for sesongen. Fristen er minst 2,5 ganger tiden uten trim, og den flyttes aldri. Unntaket (`turStuck`, 08.10.2026, tilbakemelding #48): tiden båten står på grunn, slepes eller ligger i havn med skroget på slippen (`repair`-jobben), teller ikke; fristen skyves minutt for minutt. Én gang, for oppdragene som var aktive da dette kom inn (`T.credit`), gis tiden siden den siste grunnstøtingen etter at oppdraget ble tatt, tilbake, høyst to døgn.
- **Typene:**
  - **Bestilling** (`turBest`): en ordre i ordresystemet (`S.orders`, med `tur`). Turens betaling er bonusen, og `sell` betaler den sammen med fisken.
  - **Frakt** (`turFrakt`, `TUR_GOODS`): varer i `S.cargo`, som er per fartøy (`VKEYS`). De tar plass fra `capHold` og teller i vekten (`boatTons`), men er ikke en del av fangsten (`holdTotal`) eller landingen. Varene hentes ved kai, og hvis båten ikke ligger der, går «Kjør dit» innom. De betales når de leveres (`turDock` i `dock`).
  - **Tapt redskap** (`turGarn`, `turSpawn`): et sett med `tur` og fisk i, 0,9–6 km fra land med begge ender i åpent vann. Det er garn når to kan trekke dem og spilleren har garn, ellers en line som én kan trekke. Når det er trukket (`finishHaul` → `turHauled`), går redskapet til eieren og ikke til `pgear`, og eieren betaler finnerlønn (halvparten, siden fisken er spillerens). Fristen løper ikke ut mens redskapet hales.
  - **Slep av båt med motorstopp** (`turSlep`, Jonas 07.10.2026: bergelønn etter sjøloven kap. 16). En NPC-båt (`turNpcs`, i `npcStates`, tegnet med byggesettet) ligger 1,5–14 nm unna, 0,5–8 km fra land, og er 0,75–0,95 ganger spillerens egen lengde. Hun skal til nærmeste havn med kai.
    - **Drift** (`turMinute` i `step`): hun driver med vinden, 3 % av vindfarten (et anslag for en liten båt uten fart). Farten er begrenset, så hun tidligst når land etter tre ganger tiden det tar å komme dit uten trim. Når hun når land, er oppdraget tapt, og det blir ingen bergelønn.
    - **Slepet** går over når spillerens båt ligger stille (under 1,5 kn) innen 150 m. Da gjelder høyst 5,5 kn (`TUR_TOWV`, `speedCap`), dieselforbruket ganges med 1,5 (`fuelLph`), og hun følger etter i tauet. I 3D tegner `drawTowLine` tauet fra hekken til baugen hennes med litt bukt.
    - **Bergelønnen** (`turSalvage`) betales av eierens forsikring når hun er levert i havn (`turDock`). Den er tiden etter tavlas timepris (`turPay`) pluss 3–15 % av båtens verdi etter faren (`turDanger`: 1 innen et par hundre meter fra land, 0 fra rundt 2 km). Den er aldri høyere enn verdien.
    - **Verdien** (`turValue`) er et anslag for en brukt båt: 60 % av nypris etter lengden (`TUR_VAL`). Kortet viser spennet før slepet og summen når faren er satt.
    - **Etter loven:** § 445 sier at bergelønn bare gis ved et nyttig resultat, og at den aldri kan være høyere enn verdien av det som er berget. § 446 lister det bergelønnen måles etter: verdien, dyktighet og innsats, faren, tiden, kostnadene og risikoen. Etter § 450 gir arbeid etter en avtale inngått før faren oppsto, ingen bergelønn. Derfor er det ingen avtalt pris på kortet, og slepet er frivillig. I praksis gjøres oppgjøret med eierens forsikringsselskap.
    - **Kilder:** [sjøloven kap. 16 på Lovdata](https://lovdata.no/dokument/NL/lov/1994-06-24-39/KAPITTEL_16), [SNL: bergelønn](https://snl.no/bergel%C3%B8nn), [SNL: no cure, no pay](https://snl.no/no_cure,_no_pay).
    - **Antakelser:** driften, verdiene og fordelingen mellom tid og verdi er anslag til spilltesting.
  - **Prøvefiske for Havforskningsinstituttet** (`turProve`), etter Kystreferanseflåten: HI har siden 2005 hatt 20–25 kystfartøy (mest garnbåter på 9–15 m) langs hele kysten. De er på kontrakt og får betalt for å føre fangstdagbok over hele fangsten (også bifangst og utkast), lengdemåle fangsten og ta øresteiner av kommersielle arter en gang i uka. Kilder: [hi.no Referanseflåten](https://www.hi.no/hi/tokt/referanseflaten-1) og [The Coastal Reference Fleet 2007–2019](https://www.hi.no/hi/nettrapporter/rapport-fra-havforskningen-en-2021-52). I spillet finnes to varianter:
    - **Stasjon** (krever juksa): fisk innen 1 km fra stasjonen i en spilltime (to på middels). `turProveMinute` teller minuttene og det som kommer om bord fra da. Så kommer målebrettet (`turMeasure` i `ui/05f-turer.js`): ti fisk av artene som ble tatt, med lengder fra artens vanlige spenn (`TUR_LEN`). Spilleren trykker der halen slutter og leser av i hele cm. Instituttet betaler tida (`turPay`) og inntil 20 % til etter nøyaktigheten (alt innen 0,5 cm i snitt, ingenting fra 3 cm). Ga stasjonen ingen fisk, betales tida («en tom stasjon er også en prøve»). Fangsten er spillerens. Stasjonen tilbys bare der juksa er lov (`ruBlockMsg`).
    - **Ekkoloddlinje:** tre punkter 0,8–1,6 km fra hverandre i åpent vann. De passeres i rekkefølge innen 200 m, høyst 8 knop. Båten slakker av til 7 knop når den nærmer seg linja. Instituttet svarer med det ekkoloddet så: arten som sto tettest og mellom hvilke punkter, etter fiskemodellen (`heatSample`).
    - Fartsgrensen og målet om nøyaktighet er spillets egne. Hvordan HI faktisk betaler referanseflåten, har jeg ikke funnet tall på.
  - **Bilde av et fyr for Kystposten** (`turFoto`): fyret fra registeret `src/data/fyr.json` (134 fyr på fastlandskysten, laget av `tools/map/fyr.py` fra lyktene i `sjomerker-2`: navngitte lykter som er store fyr, har rekkevidde på 10 nm eller mer, eller har «fyr» i navnet, uten molo-, havne-, led- og bifyr og uten Svalbard). Spilleren tar bildet fra åpent vann 0,5–1,2 km fra fyret.
    - **Lyset:** noen ganger vil avisa ha bildet i lav sol (sola mellom −1° og 6°), mens fyret lyser (sola under −4°), under nordlyset (`auroraAt` ≥ 0,3) eller i uvær (vind fra 10,8 m/s, ikke for åpne båter og ikke mer sjø enn båten tåler). Et lys tilbys bare når det kommer i minst en time mellom framkomst og frist. Kortet og svaret sier når det kommer neste gang (`turLysNext`).
    - **Bildet:** innen 3 km viser 3D-visningen en utløser (`#fotoBtn`, `turFotoUi`). `G3.seen` sjekker at fyret er foran kameraet innenfor bildets bredde og at ikke terrenget står i veien. Da tar `G3.snap` bildet (720 px). Uten 3D tas det fra kortet innen 1,5 km, uten bilde.
    - **Avisa:** Kystposten trykker saken samme dag (`T.press`, `newsForDay`) med bildet. Bildene ligger bare på denne enheten (`kystfiske_v2_foto` i localStorage, de seks siste), ikke i lagringen.
  - **Sesongflytting** (`turSesong`): mottaket 40–250 nm unna som lander mest av en art som er i sesong (`mk.sp[sp].months`). Spilleren skal levere tre lastrom (halvannen gang så mye fra ti år, torsk innenfor 80 % av kvoten) ved mottakene innen 30 km før uka er ute. `turSale` i `sell` teller det som leveres.
- **Avgangen** (`turDepart` i `depart`): ved turer på 20 minutter eller mer skriver loggen når båten er fremme. Ved turer på en time eller mer sier noen noe om turen (Jonas: mange legger fra seg telefonen når båten går).
  - Ved annenhver lange tur i dieselbåter uten trim kan motoren nevnes med ordene fra Trim-appen (`TUR_TUNE`: pumpe, ladeluftkjøling, turbo; semidiesel bare pumpe), høyst én gang per 20 ekte timer.
  - Er spilleren alene om bord, er det minnet om far som snakker. Med trim på kan noen si «Hør hvor fint hun går nå».
  - Aldri til gjester, aldri i veiledningen, aldri i hardt vær eller med lite diesel. Mekanikeren nevner pumpa etter service høyst hver tredje ekte dag (`turMechanic`).
  - Ingenting av dette står i patchnotes.
- **Måling:** `cloudEv` sender `tur_take`, `tur_done` og `tur_fail` (med type, klasse, nm og om trim var på) og `crew_tip` (hvilken kommentar).
- **Skjermen:** fanen «Turer» i Oppdrag-appen viser «Dine oppdrag», tavla og tidligere oppdrag. Bestillingene har egen fane. Kartet viser en stiplet ring der hvert oppdrag går (`turSvg`).
- **Tavla** trekker nå blant typene med vekter (`draw` i `turMake`): de korte mellom bestilling, frakt, prøvefiske og fyrbilde, middels også med slep, og lange mellom bestilling, frakt og fyrbilde. Høyst ett prøvefiske og ett fyrbilde om gangen.
- **Neste:** se Kystposten (4.27).

### 4.27 Kystposten: den felles avisa (07.10.2026)

Jonas: «båtnavn eller rederiene til andre brukere må komme offentlig i avisen. Det må også være varselprikk på appen og varsel i spillet. Jeg ønsker at spillere skal kunne trykke på en nyhetssak å lese litt mer». Etter planen svarte han: uhell skal i avisa («Det er realistisk»), andres fyrbilder skal ikke, og det skal være en lokalfane. Kjernen ligger i `core/09h-press.js`, skjermen i `ui/05g-press.js`, skyen i `supabase/migrations/20261007170000_news.sql` (og `…171000_news_get_fix.sql`, `…180000_news_more.sql`, `…190000_news_skrei.sql`), og testen i `tests/posttest.py`.

- **Saker** (`pressPut`) lages der det skjer:
  - **boat:** kjøp av båt (`buy` i telefonen, og kjøp med kvote i lukket gruppe);
  - **name:** båtdåp (`boatChristen`);
  - **aground:** grunnstøting (`runAground`);
  - **rescue:** slep fra Redningsselskapet (`rescue`);
  - **salv:** bergelønn (`turDock`);
  - **foto:** fyrbilde (`turFotoTake`);
  - **fish:** storfisk (drømmefisken);
  - **fs:** fartstid hvert tiende år (`fsYear`);
  - **ach:** kapittel i Merker (`achChapter`);
  - **as:** aksjeselskap;
  - **tur:** lang tur eller sesongflytting fullført (`turPayOut`, klassen `lang` eller sesong; bestilling, frakt og sesong);
  - **kvote:** strukturkvote kjøpt (`struct`, kvotefaktoren i titusendeler).
  - Hver sak har type, sted (km), båtnavnet (og rederiet i lukket gruppe, som på topplista) og noen tall og koder (båttype, havne-id, art, indeks i `FYR` og `TUR_BOATS`).
  - Ingen saker lages i «Første tur». Gjester sender ingen saker.
- **Ordene** (`pressStory`) skrives i leserens spill, likt for egne og andres saker: overskrift, ingress og brødtekst på norsk og engelsk. Stedsnavnene kommer fra `nearestPlace` og havnenavnene fra `portById`. En sak med en type eller nøkkel spillet ikke kjenner, vises ikke. Båtkjøp viser sidebildet av båten (`vesselSVG`). Fyrbilder vises bare i egen avis.
- **Skyen:**
  - `news_put` tar bare typens egne nøkler: tall, og koder som matcher `^[A-Za-z0-9_-]{1,24}$`. Fritekst kommer aldri inn. Båtnavn og rederi renses som i `land_put`. Grensen er 12 saker i timen og to av samme type på ti minutter. Gjester får nei.
  - `news_get` gir sakene fra den siste spilluka langs hele kysten (60) og innen 150 km (40), og dagens største landinger (30) fra `landings`, uten gjester, med båtnavn og rederi i lukket gruppe.
  - `supabase/migrations/20261007180000_news_more.sql` legger til `tur` og `kvote` og `push_paper`.
  - `admin_news`/`admin_news_remove` brukes av fanen «Kystposten» i admin. Den viser sakene med brukernavnet og har en knapp som tar en sak bort for alle.
  - Røyktestet med MCP i en transaksjon som ble rullet tilbake: ukjente nøkler og fritekst forsvinner.
- **Klienten** (`pressFlush`, `pressFetch`): egne saker ligger i en kø (`S.press.q`, de 20 siste) og sendes straks og hvert annet minutt. En sak som avvises (400), droppes. Andres saker hentes hvert tredje minutt og når avisa åpnes.
- **Avisa:**
  - **Forsiden** har hele kysten: spillernes saker, dagens største landing og de nasjonale sakene fra `newsForDay` (kvoter og regulering, `nat`), pluss de to første lokale sakene i dag.
  - **Lokalt** har det som er innen 150 km fra hjemhavna, med distriktets største landing.
  - Hver sak er en knapp. «Les mer» åpner artikkelen, som har tilbakeknapp (`sub.postArt`).
- **Varsler:**
  - Appen viser antall uleste saker (`pressUnread`: nyere enn sist avisa ble åpnet).
  - En egen sak varsles i spillet med en toast etter fire sekunder.
  - Når andres saker hentes, varsles én ny stor sak eller én ny sak nær hjemhavna, høyst hvert tredje minutt.
  - **Push** (`push_paper`, pg_cron hver time, minutt 9): når et spilldøgn (fire ekte timer) er over, får den med dagens største landing langs kysten (minst 200 kg, ikke gjester) «Du står i avisa». Det går gjennom `push_srv`, så samme regler gjelder som for topplista: varslene for topplista må være på, ikke mens spilleren er i spillet, høyst fire i døgnet og ingenting 22–08. Bare det siste døgnet sendes.
  - I spillet får den med dagens største landing beskjed én gang når avisa hentes (`pressFetch`).
- **Ukas toppfisker** (`pressTop`) kommer fra den felles topplista (`worldTop`) for åpen og lukket gruppe forrige uke, med nr. 2 og 3. Den lokale «Ukas toppfisker» fra `newsForDay` vises bare når skyen ikke har tall.
- **Personvern:** `src/legal/personvern.html` har fått avsnittet «Saker i Kystposten». Haill står aldri i sakene. Brukernavnet står ikke i avisa, bare i admin.
- **Rekordpris** (`pressRecords`, `pressPrice`; Jonas: «Ta rekordpriser og sesongens første skrei. Det kommer ingen nye fiskemottak langs kysten»):
  - Prisindeksen for en art en dag er `marketPrice × supplyFactor` kl. 08 (`pressIx`). Den er lik i alle spill på den felles klokka, så rekorden kommer samme dag for alle.
  - Rekord betyr at dagen er høyere enn hver dag året før (365 dager, 0,2 % margin). Saken trykkes bare når arten ikke hadde rekord de seks dagene før, så en stigende uke gir én sak.
  - Arter: torsk, hyse og sei. Saken står bare på forsiden (type `pris`, «Marked»), og torsk er en stor sak.
  - Kronene i saken er leserens egne: snittet hos de ti mottakene nærmest hjemhavna, hvem som betaler best, endringen siden for en måned siden, og om været har holdt båtene i havn (`supplyFactor ≥ 1,02`).
  - Dagens rekord varsles i spillet én gang (`pressDay`, hver spilltime fra `05-vessels.js`; `S.press.told`).
  - Ordet «rekord» gjelder altså det høyeste på et år, og ingressen sier det.
- **Årets første skrei** (`pressSkrei`, `pressSkreiFetch`):
  - `news_first(since)` (`supabase/migrations/20261007190000_news_skrei.sql`) gir de ti første torskelandingene i 30 spilldøgn fra skreisesongens første dag (`SEASON_EV` skrei, `seasonDoy`). En landing er en spillers rader på samme tid og havn, minst 30 kg torsk, i åpen eller lukket gruppe, aldri en gjest, med båtnavnet og rederiet i lukket gruppe.
  - Klienten tar den første ved en havn nord for 62° N (Stad, `natLL`). Havneregisteret er likt for alle, så det blir samme båt for alle.
  - Den hentes med avisa i sesongens første 30 dager, til en første har stått i tre spilltimer, fordi landingene kan komme opp til ti minutter for sent til skyen.
  - Saken (type `skrei`, «Fangst») står på forsiden og lokalt når havna er innen 150 km, i en uke. Den varsles én gang i året, med «Om deg» for den som landet.
  - Uten sky finnes bare sesongsaken fra `newsForDay` («Skreien er her»).
  - Røyktestet med MCP i en transaksjon som ble rullet tilbake: to rader på samme tid ble slått sammen til 45 kg, 10 kg og hyse kom ikke med.
- **Ikke laget:** saker om nye mottak (Jonas: det kommer ingen nye fiskemottak langs kysten). Ingen push for første skrei ennå.

## 5. Systemer i spillet

### 5.1 Båter og utstyr

Båtene står i `VESSELS` (`core/02-species-gear.js`). Tallene er startverdier og anslag, og vekta er deplasement.

| Nøkkel | Typenavn | L × B × T (m) | Vekt (t) | Last | Motor, marsj/topp | Mannskap / køyer | Pris | Gruppe |
|---|---|---|---|---|---|---|---|---|
| `skiff` | Aluminiumsbåt 19 fot (5,9 m), 60 hk påhengs (etter Plate Alloy 5.9m Adventurer) | 5,9 × 2,45 × 0,6 (skroget 0,3, med motorbeinet 0,6) | 1,0 | 350 kg | 60 hk, 18/24 kn | 1+1 / 0 | 95 000 | åpen under 8 m (startbåt for spill fra før 05.10.2026, nå bare til kjøps på verftet) |
| `trebat` | Trebåt 23 fot (7,0 m), 8 hk semidiesel (1956), fars gamle båt | 7,0 × 2,26 × 0,62 | 1,9 | 350 kg | 8 hk, 6/7 kn | 1+1 / 0 | 45 000 | åpen under 8 m (startbåt fra 05.10.2026) |
| `snekke` | Plastsnekke 26 fot, 30 hk diesel | 7,9 × 2,7 × 1,2 | 3,0 | 900 kg | 30 hk, 7/8 kn | 1+2 / 0 | 245 000 | åpen under 8 m |
| `jukesjark` | Plastsjark 29 fot (8,9 m) | 8,9 × 3,2 × 1,2 | 5,5 | 1 800 kg | 150 hk, 8,5/10 kn | 1+2 / 2 | 750 000 | åpen 8–9,99 m |
| `sjark` | Havsjark 35 fot (10,6 m) med bakk og styrhus (etter Viksund Havsjark 35) | 10,57 × 4,1 × 1,6 | 12 | 6 500 kg | 180 hk, 8,5/10 kn | 1+3 / 2 | 1 150 000 | åpen 10 m og over |
| `hurtigsjark` | Brukt hurtigsjark 10,99 m, 500 hk | 10,99 × 3,9 × 1,6 | 12 | 5 000 kg | 500 hk, 17/22 kn | 1+3 / 2 | 4 900 000 | åpen 10 m og over |
| `sjarkny` | Ny hurtigsjark 10,99 m, 650 hk | 10,99 × 4,68 × 2,06 | 15 | 7 000 kg | 650 hk, 20/25 kn | 1+3 / 3 | 10 500 000, 45 døgn på verftet | åpen 10 m og over |
| `breisjark` | Sjark 36 fot med bakk og ly (etter Malo 36) | 10,99 × 4,2 × 2,0 | 20 | 10 000 kg (19 m³) | 300 hk, 9,5/10,5 kn | 1+4 / 4 | 9 000 000 | åpen 10 m og over |
| `kyst15` | Kystbåt 14,99 m med lugarer | 14,99 × 6,6 × 3,0 | 75 | 28 t | 750 hk, 10/11,5 kn | 1+5 / 6 | 18 000 000 | bare lukket gruppe |
| `kyst21` | Eldre kystbåt 21 m (1978) | 21 × 7,2 × 3,4 | 190 | 55 t | 900 hk, 10/11 kn | 1+6 / 8 | 9 000 000 | bare lukket, ikke innenfor fjordlinja |
| `snokrabbe` 🔒 | Snøkrabbefartøy 50 m med fryseri | 50 × 11 × 6 | 1 800 | 500 t fryst | 3 600 hk, 11/13,5 kn | 14 / 18 | 60 mill. | havfiske, konsesjon |
| `autoliner` 🔒 | Autoliner 45 m med frysing | 45,4 × 10,45 × 3,8 | 1 050 | 400 t fryst | 3 000 hk, 11/13 kn | 14 / 16 | 70 mill. (ny 300) | havfiske, konsesjon |
| `bunntral` 🔒 | Frysetråler 60 m med akterslipp | 60,3 × 12,5 × 5,1 | 2 200 | 800 t fryst | 8 000 hk, 12/15 kn | 25 / 30 | 150 mill. (ny 500) | havfiske, konsesjon |
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

- **Arter** (`SPECIES`): torsk (kysttorsk og skrei), hyse, sei, lyr, lange, brosme, uer, kveite og blåkveite (fra 07.10.2026, se «Blåkveite» under).
  - Hver art har månedlig tilgjengelighet (`av`), dybde (`dep`), eksponering (`prod`) og markedspris (`pm`).
  - Den har også ukentlig prisvariasjon (`sig`), størrelsesfordeling (`size`, lognormal), minstemål (`minKg`) og størrelsesklasser med minstepris (`cls`).
  - Fra sløyd uten hode til rund vekt regnes det med `uh`. Lever og rogn har egne priser.
- **Kalibreringsfaktor per art** (`k`):

| Torsk | Hyse | Sei | Lyr | Lange | Brosme | Uer | Kveite | Blåkveite |
|---|---|---|---|---|---|---|---|---|
| 0,37 | 0,3 | 0,6 | 0,3 | 0,3 | 0,35 | 0,5 | 0,35 | 0,6 |

- **Blåkveite** (07.10.2026, tilbakemelding #10; researchen i `docs/blakveite.md`, planen i `docs/plan-blakveite.md`):
  - **Hvor:** eggakanten. `eggaArea` (`03-simulation.js`, via feltet `area:'egga'`) gir null grunnere enn 280–400 m og dypere enn 1000–1150 m, null sør for 62° N, 0,15 fra Storegga til Helgeland, full styrke fra Lofoten (67,6–68,8° N) og nordover, × 0,4 i Vest-Finnmark og × 0,6 øst for 26,5° Ø (sluttseddelene 2025 per område). Vestfjorden × 0,15, de skjermede fjordbassengene i Troms × 0,12 (usikkert). Om vinteren (nov–feb) tynnes det sør for 70° N (inntil −45 %) og fylles nord for (+30 %), fordi gytefisken samles på kanten fra 70 til 75° N.
  - **Dypet** kommer fra kjernelaget `deep` (`tools/map/deep.py`, se 4.6): kystflisene slutter 40–65 km ut, og modellen utenfor dem ble aldri dypere enn rundt 260 m.
  - **Eget bestandslag** `S.bstk` (feltet `stk`), som vokser tilbake saktere enn krabbens (0,1 % av underskuddet i timen).
  - **Frøene:** feltet `late` legger arten sist i `ALLSP`, etter krabben, så ingen andre arters hotspots, dagsstøy og ukepriser flytter seg.
  - **Størrelse** `size:[2.0, 0.4]` (Råfisklaget 2026: 4 % under 1 kg, 46 % 1–2 kg, 50 % over 2 kg), minstemål 45 cm = 0,9 kg. **Pris:** minstepris 46/47/48 kr under 1,2, 1,2–2,4 og over 2,4 kg (uke 27 2026), snitt 61 kr. `uh` 1,3 er et anslag.
  - **Redskap:** juksa tar nesten ingen (`jig:0.03`, arten finnes ikke i juksastatistikken). Bankline 5,0, hyseline 2,5 og garn 3,2 (`SELQ`); line er 49 % og garn 40 % av kystfangsten i 2026. Kalibrert grovt (07.10.2026): med 4,0 ga ti stamper bankline i 20 timer på kanten ved Andøya i juni 300–320 kg (rundt 100 kg per 1000 kroker), og med 5,0 blir det rundt 125 kg, så 30 stamper om dagen gir en båt under 14 m rundt 7 t den første uka (målet i planen er 7,5 t). Spermhvalen tok 20–28 % i to av tre trekk ved Andøya. En hel uke er ikke kjørt, og om halvparten av båtene fisker opp maksimalkvoten, er ikke målt.
  - **Bestanden** på kanten tas fra `S.bstk` (også fra line og garn, `soakHour`): ett sett på ti stamper tar rundt 30 % av ruta, så man må flytte seg langs kanten. Den vokser tilbake med 0,1 % av underskuddet i timen. Makrell 1,3 og sei 1,1 som agn.
  - **Dypt vann:** endetauene går ned og opp før første enhet (`endLines` i `10-gear.js`): 60 m i minuttet ned, 40 med haler og 25 for hånd opp, begge ender. På 700 m blir det rundt 23 min setting og 35 min før trekket kommer i gang.
  - **Tjuver på lina** (`thiefOf`): spermhval ved Andøya (68,9–70° N, 14,6–17,2° Ø) tar 20–50 % av lina i en fjerdedel av trekkene (HI, rapport 2024-10), og håkjerring tar 5–15 % i 8 % av trekkene på over 300 m.
  - **Røkting:** redskap på over 300 m får påminnelse etter to døgn (høstingsforskriften § 18).
  - **Mottak og oppdrag** (07.10.2026, Jonas: «Alle mottak skal kunne ta i mot blåkveite»): salget har aldri skilt på mottak, så alle kjøper den. Alle mottak nord for 62° N får `mk.sp.blakveite` (`06b-coastports.js`, med kilo og måneder fra registeret der det har dem), og alle store kunder der får arten lagt til (`custSp`, `bkPlant` i `03-simulation.js`). Bestillingene kommer bare i direktefisket fram til stoppen varsles, for en båt under 28 m på blad B som eier line eller garn (`bkOrderable`, via `spCatchable`): 300–3000 kg, fire dager. `turRoom` er resten av maksimalkvoten, så Turer kan også gi bestillinger og sesongflytting for blåkveite.
  - **Kystposten** (`newsForDay` i `06-services.js`, forsiden): åpningen, varselet om stoppen tre dager før, stoppdagen, kvoterådet 26. juni og totalkvoten 17. oktober, sammen med torskens.

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
  - Hver linje står i hele kroner og kilo, og totalen er summen av linjene (A7). Linjene står med full verdi, og det som inndras, står som egne trekk: torsk over kvote eller bifangstgrensen, og død kongekrabbe (0 kr). Gamle sedler kan ha krabbe under minstemålet og trekket for rognkrabbe fra taskekrabbens tid. Tillegg for bestillinger og innloggingsbonusen har egne linjer.
  - Under totalen kommer trekkene i oppgjøret, så «Lott til mannskapet» og «Til kassa». Kassa får nøyaktig total minus trekk og lott. Gebyret for småkrabbe står som en merknad under på gamle sedler. Kongekrabben har ikke noe slikt gebyr.
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
  - **Skatt og Rederi AS** (E4, 04.10.2026, `TAX`, `taxOf`, `taxTick` og `foundAS` i `03-simulation.js`, kortet «Skatt» under Regnskap i Rederi-appen):
    - **Når:** forskuddsskatt hvert kvartal (1. januar, april, juli og oktober) på året så langt (ingenting kommer tilbake før oppgjøret), og skatteoppgjøret ved nyttår. Meldingene kommer fra Skatteetaten.
    - **Overskuddet:** inntekter minus kostnader i `S.stats` siden nyttår (trekk, lott, hyre, diesel, utstyr, renter; ikke avdrag, båtkjøp eller skatten selv) minus avskrivning på 14 % av skrog og motor (saldogruppe e, `depBase`). Kvoten avskrives ikke. Underskudd føres ikke videre (forenkling).
    - **Enkeltpersonforetak** (`S.form` mangler): overskuddet er eierens inntekt. 22 % på alminnelig inntekt etter fiskerfradrag og personfradrag (114 540 kr), trygdeavgift 7,6 % (satsen for fiske og fangst; nedre grense 99 650 kr, høyst 25 % av inntekten over den) og trinnskatt (1,7 % fra 226 100, 4,0 % fra 318 300, 13,7 % fra 725 050, 16,8 % fra 980 100 og 17,8 % fra 1 467 200 kr).
    - **Fiskerfradraget** (skatteloven § 6-60): 30 % av overskuddet, høyst 160 000 kr, når du har vært på fiske minst 130 dager i året (`S.tx.days`: dager båten du er om bord i, var ute).
    - **Rederi AS** (knappen på skattekortet): 30 000 kr i aksjekapital blir stående i selskapet (aksjeloven § 3-1), og registreringsgebyret er 5 570 kr. Selskapet betaler 22 %, uten fiskerfradrag, og rundt 30 000 kr i året til regnskap (trukket månedlig; et anslag). Uttak og utbytte er forenklet bort.
    - **Kildene:** satsene er fra Stortingets skattevedtak for 2026 og vedtaket om avgifter til folketrygden for 2026, slik regjeringen.no og andre gjengir dem (funnet med søk 04.10.2026). Lovdata og Skatteetaten var sperret fra arbeidsmiljøet. Gebyret og regnskapsbeløpet er ikke sjekket.
- Alle priser i spillet er per kilo **rund vekt**.

### 5.5 Kvoter og regulering

- **Blåkveite (07.10.2026, J-241-2025, `03d-quota.js` `BKQ`):** direktefisket for fartøy under 28 m åpner 25. mai kl. 00 og stoppes når gruppekvoten (5 230 t) er beregnet oppfisket. Lengden trekkes per år mellom 30 dager (2026) og 97 (2025), oftest kort (`bkSeason`), og stoppen varsles tre dager før (`bkNews`, melding fra Fiskeridirektoratet). Åpen gruppe med eier og høvedsmann på blad B (`bladB()`). Maksimalkvote etter største lengde: 9,7 t (0–13,99 m), 10,9 t (14–19,99 m), 12,1 t (20–27,99 m), ikke overførbar; 28 m og over bare bifangst, høyst 12,1 t. Utenom perioden (og uten blad B) høyst 7 % blåkveite i ukas landinger, regnet mandag til søndag og trukket fra maksimalkvoten (`bkAllow`, `landConf` inndrar resten). En landing inntil to døgn etter stoppen regnes med i perioden (redskapen skulle være på land da). Kvote-appen har et kort for blåkveite.
  - **Bestanden år for år** (`STOCK.blakveite`): gytebestanden av hunnfisk fra JRN-AFWG 2026 (2015, 2019, 2021, 2023, 2025, 2026 og 52 635 t ved starten av 2027; årene mellom står ikke i teksten), totalkvotene 2020–2026 fra den norsk-russiske kommisjonen (27 000, 27 000, 25 000, 25 000, 21 250, 19 000, 19 000 t; årene før er ikke funnet), rådet 19 610 t for 2027, B<sub>lim</sub> 33 391 t og B<sub>pa</sub> 46 747 t. Modellen etter 2027 er den samme som for torsken, men treg: `a` 0,1 mot 75 000 t, `sd` 0,06, `slack` 0,1. Bestanden virker på tettheten (`stockF`), og fra 2027 følger gruppekvoten og maksimalkvotene totalkvoten (`bkTacF`, `bkGroup`, `bkMax(len, y)`). Kvote-appen viser den under Bestand, bare årene med kjent totalkvote.

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
| Haill | 29 kr | fersk +100 % til 24 t, mellomhaill +50 % til 48 t, gammelhaill +25 % til 72 t, borte |
| Luksushaill | 59 kr | +200 % til 24 t, så fersk +100 % til 48 t, mellom +50 % til 72 t, gammel +25 % til 96 t, borte |

- **Trinnene er 24 spilltimer hver** (Jonas 05.10.2026: «All tidseffekt er oppgitt i spilltid»). 24 timer i spillet er 4 ekte timer. Før var de 48 timer.
- **Tekstene skal selge** (Jonas: «Formuler dette på en intuitiv måte som fremmer salg»): de starter med det spilleren får («Dobbel fiskelykke et helt døgn!», «Tredobbel fiskelykke det første døgnet!»), og så trinnene. De sier aldri «kjøp nå», fordi direkte kjøpsoppfordringer til barn er forbudt (markedsføringsloven og UCPD vedlegg I nr. 28).

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

- **Tid og samtidighet** (05.10.2026, Jonas: «Montering av utstyr og vedlikehold skal ta 30 ekte minutter, og man kan gjøre flere oppgaver samtidig»; `core/06-services.js`):
  - Verftets jobber (`YARD_KINDS`: montering, service, skrogrens på slipp, lasterom, motorbytte og reparasjon) tar 30 ekte minutter hver: `YARD_H` = 30 × `GAME_RATE` / 60 = 3 spilltimer. Det gjelder uansett hva som gjøres, og `FIT_H` og `svcJobH` brukes ikke lenger.
  - Service man gjør selv (`self`), koster 35 % og tar dobbelt så lang tid.
  - Arbeidet på kaia (klargjøring, egning og bøting) beholder sine egne timer.
  - Alle jobbene går samtidig. Hver får sin `until` når den bestilles i havn, eller når båten kommer i havn. `jobsDone()` er den siste av dem. Den brukes til avgangen, «Neste»-brikken og statusfeltet.
  - `jobOk` gir jobber fra før (2–16 timer, også en som pågår) verftets halvtime.
  - Køen har fortsatt plass til seks. En jobb som venter på havn, kan fjernes.
- **Overtid** med spillkroner, per jobb: halverer resten av tiden på den jobben, for 950 kr per spart time.
- **«Ferdig nå»** (før «Hastejobb», tenkt for ekte penger) er bare for admin (`adminOk()`).

### 5.13 Båtbevegelse og animasjoner

- **Simuleringen** (`sailV`):
  - Akselerasjonen står i `accel` (kn per minutt): skiff og ny sjark 10, hurtigsjark 9, deplasementsbåtene 1,5–3 og havbåtene 0,8–1. Nedbremsing går 1,5 ganger så raskt.
  - 5 kn innenfor 250 m fra en havn.
  - Bremsing før neste stopp (havn eller fiskeplass) langs ruta.
  - `livePose` bruker samme fart som neste steg.
- **3D-båten på ruta** (`trkOn`/`trkStep` i `view3d.js`, fra 06.10.2026). Jonas: «båten strengt må følge rutestreken som lages i kartplotteren», «ganske nøyaktige kursendringer», og «slakker av og stopper nøyaktig der den skal».
  - **Linja** er i meter:
    - ut fra kaia båten ligger ved, med `berthPath` baklengs
    - rutas veipunkter slik kartplotteren tegner dem
    - inn til kaia der ruta ender, med samme kaiplass som `berthNow`
    - Linja går bare fram til første havn på ruta, fordi `dock` avslutter ruta der.
  - **Farten** er simuleringens (`sailV`). Ligger båten bak simuleringen, tar den igjen (inntil 1,5 × + 3 m/s). Simuleringen starter ved havnepunktet, så båten ligger bak etter avgang. Ligger den foran, saktner den.
  - **Stopp:** båten bremser slik at den står nøyaktig på hvert stopp simuleringen ikke har nådd ennå (fiskeplass, setting, havn) og på slutten.
    - Bremsen er fart/6 m/s², minst 1,2.
    - Har simuleringen stoppet (slutten av ruta, fiske, setting eller Stopp), går båten fram dit simuleringen står. Har den alt passert punktet, bremser den så mykt den kan.
  - **Hjørnene** rundes over 6 m på hver side (`TRK_R`), unntatt ved et stopp, der den står på punktet. Kursen er linja mellom punktene 6 m før og 6 m etter.
  - **Ved kaia:**
    - Ut fra kaia går den sakte baklengs (3 kn) med kaias kurs, og snur over 1,5 båtlengder (minst 10 m).
    - Inn til kaia går den sakte (4 kn).
    - Når den er inne, går fortøyningen rett på (`MO.phase = 'lines'`).
  - **Ny eller endret rute** gir en ny linje fra der båten er, med farten den har. Endringene i veipunktene sjekkes hvert 30. bilde.
  - Dreiepunktet ligger en tredel fra baugen, så hekken slår ut.
  - Sideskrens: β = 0,14·yawrate, begrenset til 0,18 rad.
  - Planende båter krenger innover (−0,18·yaw), deplasementsbåter utover (+0,06·yaw).
  - Båten flyttes direkte til simuleringens posisjon hvis den er mer enn 900 m unna.
  - **Før:** en følger styrte mot et punkt lenger fremme på ruta (pure pursuit, svingradius `turnR`), med egne animasjoner ut (5–45 s, `DEP`) og inn (8–60 s, `MO.phase = 'in'`). Den skar hjørnene i trange havner og gled forbi sluttpunktet. I Senjahopen lå båten ved mottakskaia mens turen til rorbua alt var ferdig (tilbakemelding #3).
  - `turnR` i `VESSELS` gjelder nå bare manuell styring: skiff 35, tresnekke 30, snekke 45, 8,9-metersjark 50, sjark 70, hurtigsjark 75, ny sjark 80, bred sjark 85, kystbåtene 110 og 150 m.
  - `moorStep` med fasen `in` brukes fortsatt når båten kommer til kai uten rute, for eksempel etter slep.
- **Stopp under en rute** (`haltPlan` i `05-vessels.js`, fra 06.10.2026):
  - Knappen lager en ny rute til et punkt litt lenger fram på ruta, 0,012 km per knop (30–300 m).
  - Simuleringen og 3D-båten slakker av og stopper der, og loggen sier «Stoppet båten».
  - Et nytt trykk mens båten slakker av gjør ingenting.
  - Ved manuell styring stopper båten med en gang, som før.
- **Kartplotteren** tegner egen båt, sporet og første etappe av ruta der `livePose` sier båten er, ved hver tegning (5 ganger i sekundet). Før skjedde det bare hvert spillminutt. `livePose` gir også `idx`, neste veipunkt derfra. Minikartplotteren i 3D tegnes 4 ganger i sekundet mens båten går, og én gang i sekundet når den ligger.
- **Test:** `trackfollow.py` kjører fra mottakskaia i Senjahopen til rorbua rb129, så Stopp på sjøen, så en rute som ender på sjøen, og til slutt kartplotteren.
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
- **Frysetråleren (`bunntral`, fra 06.10.2026):** `tools/boats/tral60.py` bygger en hekktråler på 60 m med akterslipp, etter generalarrangementet Jonas viste («Fish processing vessel 60 m, bottom and pelagic trawling», tegning 101-001, 1:100). Tegningen er ikke i repoet.
  - **Målene fra tegningen:** lengde over alt 60,30 m, mellom perpendikulærene 53,50 m, bredde 12,50 m, dekkene på 5,8, 8,6, 11,0 og 13,3 m, spantavstand 0,60 m. Profilen og planene ble målt i Jonas' bilde (rundt 18,1 px/m, spant 0 i AP). Vannlinja er satt til 4,7 m over basislinja, og dypgangen med skeg og sko er 5,1 m.
  - **Spillets tall** følger tegningen (Jonas' valg 06.10.2026): «Frysetråler 60 m med akterslipp», 60,3 × 12,5 × 5,1 m. Deplasementet er satt ned fra 3 000 til 2 200 t, så fyldigheten holder seg under 0,6 (`vesseltest`). Pris, rom, motor og fart står som før.
  - **Skroget:** spantseksjoner med superellipse-kimming bak x = 36 m. Foran det ender hver vannlinje i stevnelinja, med y = Ymid(z)·(1 − (1 − s)^p), der p er tilpasset dekksplanen (4,6 ved dekk 3, 3,1 i vannlinja). Bulben, skegen, skoen, dysa med propell og roret er egne deler.
  - **Hekken:** slippen er 4,2 m bred og går fra 5,7 m i speilet opp til dekk 3 ved x = 6,6 m. På hver side av den står kasser opp til galgedekket. Galgen har to bein og en tverrbjelke med blokkene, og tråldørene henger der på hver side av slippen, som på Jonas' bilde.
  - **Annet på dekk:** A-masta over trållinja (med eksosen og løfteblokka), nettrommelen, delte trålvinsjer, hovedvinsj, knekkbomkran, MOB-båt med davit og redningsflåter. Overbygningen står fra x = 28 m, med styrhus på dekk 4 og mast med radarer.
  - **Bare utsiden** (Jonas: «ikke … fabrikken under dekk»). Bak vinduene i styrhuset er det et mørkt rom, så glasset ser ut som glass.
  - **Fila:** rundt 12 800 trekanter nær og 4 500 på avstand, 565 KB. GLB-en har også delene `door` (én tråldør, origo i sjakkelen), `codend` (posen full av fisk, origo i munningen) og `netroll` (trålen på trommelen, akse på tvers).
  - **Trålen i 3D** (`TRAWL`, `drawTrawl` i `view3d.js`): dørene henger i galgen og trålen ligger på trommelen. `G3._debug.trawl('shoot' | 'tow' | 'haul')` spiller utsett, slep og opptak.
    - **Utsett (46 s):** trålen går ut av trommelen og ned slippen med posen først. Etter 12 s senkes dørene, dreies ut og går akterover på varpene.
    - **Slep:** varpene går fra blokkene ned i sjøen.
    - **Opptak (50 s):** dørene kommer inn og opp i galgen. Så kommer trålen inn på trommelen, og posen, full, opp slippen.
    - Spillet tråler ikke ennå, fordi det hører til havsteget (Jonas' valg 06.10.2026: «Bare modeller og animasjoner»). Båthandelen viser ikke animasjonene (CLAUDE.md).
  - **Test:** `tral3d.py`. Kjøring: `python3 tools/boats/tral60.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-tral60.b64` og `boat-tral60-side.b64`, og i malen som `glb-bunntral` og `pic-bunntral`.
- **Ringnot- og pelagisk tråleren (`pelagisk`, fra 06.10.2026):** `tools/boats/not75.py` bygger en snurper og pelagisk tråler på rundt 75 m, etter profiltegningene av en dansk snurper som Jonas viste («Denne kan både bruke ringnot og trål»). Tegningene er ikke i repoet.
  - **Målene:** tegningen har bare spantskala (0–120) og ingen tall. Med vanlig spantavstand på 0,60 m blir den 75,5 m over alt, som spillets 75 m, så spillets tall (75 × 15,5 × 7,5 m) står. Bredden står ikke på tegningen.
  - **Det som er målt** (19,17 px/m):
    - vannlinja 7,6 m over basislinja
    - springen på det blå skroget: 13,7 m akter, 12,65 m midtskips og 16,5 m ved stevnen, med hvit skansekledning over
    - bulbens nese på 72,1 m, 5,4 m opp
    - styrhuset med vinduer på 17,6–19,4 m og tak på 20,7 m, mastene og skorsteinen
  - **På dekk:**
    - notbingen akter, med nota og korkene og kraftblokkranen over styrbord side
    - tårnkranen på styrbord hekkhjørne og snurpedaviten midtskips på styrbord
    - trålrullen og trålvinsjene, og tråldørene i galger på hekkhjørnene
    - overbygningen midtskips med MOB-båt i en nisje på styrbord side, den skrå masta, skorsteinen med to eksosrør, og kranen og formasta forut
  - Dør, pose og trålrull er de samme delene som i tråleren (`tral60.py`). Fila er rundt 15 600 trekanter nær og 4 400 på avstand, 602 KB. Bare utsiden er modellert.
  - **Nota i 3D** (`SEINE`, `drawSeine` i `view3d.js`): `G3._debug.seine('shoot' | 'purse' | 'haul' | 'pump')` spiller fasene etter hverandre.
    - **Notkast (40 s):** nota går ut over hekkrullen fra bingen. Korkene legger seg i en ring på 62 m fra hekken rundt til styrbord side midtskips.
    - **Snurping (25 s):** snurpelina går fra daviten ned i sjøen.
    - **Hiving (45 s):** nota går gjennom kraftblokka og ned i bingen, og ringen krymper inn mot styrbord side.
    - **Pumping (20 s):** posen ligger ved siden med fisk som koker i den, og pumpeslangen går ned i den.
    - Korkene og fisken er punkter på sjøen i båtens vannrette ramme.
  - **Trålen** spilles som for tråleren (`TRAWL`), over hekkrullen og med dørene fra hekkhjørnene. Spillet fisker ikke med not eller trål ennå (havsteget), og Båthandelen viser ikke animasjonene.
  - **Test:** `tral3d.py` (begge havbåtene). Kjøring: `python3 tools/boats/not75.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-not75.b64` og `boat-not75-side.b64`, og i malen som `glb-pelagisk` og `pic-pelagisk`.
- **Autolineren (`autoliner`, fra 06.10.2026):** `tools/boats/al45.py` bygger en autoliner på 45 m, etter generalarrangementet Jonas viste («45 m Longliner», prosjekt 6161, tegning 101-002, 1:100). Tegningen er ikke i repoet.
  - **Målene på tegningen:** 45,38 m over alt, 41,05 m mellom perpendikulærene, bredde 10,45 m, dybde til hoveddekket 4,75 m, 2. dekk 7,15 m og 3. dekk 9,55 m, 16 køyer. Spillet har nå 45,4 × 10,45 m.
  - **Dypgående:** vannlinja på tegningen ligger 3,3 m over basislinja og 3,75 m over kjølskoen, så spillet har 3,8 m (før 6 m). Med 6 m ville hoveddekket på 4,75 m ligget under vann. Deplasementet er satt ned fra 1 500 til 1 050 t, så fyldigheten blir 0,57 og under grensen i `vesseltest.py`. Pris, lasterom, motor og fart er som før.
  - **Det som er målt** (47,46 px/m, spant 0 i akterkant):
    - stevnen er sporet av tegningen: forfoten går rund og full fram til nesa på 42,7 m i vannlinja, stevnen svinger inn til 41,1 m 6,3 m opp og flarer ut til skansen på 43,4 m. Det er ingen egen bulb.
    - speilet på −2,0 m, styrhuset på 10,9–19,1 m med vinduer på 12,4–13,3 m og tak på 14,05 m, skorsteinen på 6,0–9,6 m
    - haleporten på styrbord side på 20,7–23,5 m, 5,5–7,05 m over basislinja
  - **Baugen** er en flate av rader fra spantet på 26 m fram til stevnen (`bow_pt`). Radene ligger vannrett over vannlinja og følger den skrå kjølen nederst. Stasjoner på tvers ville gitt trappetrinn der stevnen svinger tilbake.
  - **På dekk:** skorsteinen med to eksosrør, MOB-båten og kranen på babord side akter, kranen foran styrhuset med bommen lagt forover, plattformen med ankervinsjen og den skrå formasta forut, rekker hele veien og radarmasta med to kupler på styrhustaket. Skroget er marineblått til 2. dekk og hvitt over (våre farger).
  - **Lina:** haleren (`hauler`) står innenfor haleporten på hoveddekket (`deck`). Lina går fra sjøen inn gjennom den mørke åpningen. Haleren, balene og settingen er inne i skroget og synes ikke, som på en ekte autoliner.
  - Fila er rundt 14 000 trekanter nær og 2 600 på avstand, 448 KB. Bare utsiden er modellert.
  - **Test:** `tral3d.py`. Kjøring: `python3 tools/boats/al45.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-al45.b64` og `boat-al45-side.b64`, og i malen som `glb-autoliner` og `pic-autoliner`.
- **Snøkrabbefartøyet (`snokrabbe`, fra 06.10.2026):** `tools/boats/krabbe50.py` bygger et teinefartøy på 50 m etter bildene Jonas viste av en moderne krabbebåt (et verfts renderinger av en 57 × 12 m-design, fra siden, forfra og skrått). Bildene er ikke i repoet.
  - **Målene:** bildene har ingen tall, så spillets mål står (50 × 11 m, 6,0 m dypgående). Proporsjonene er tatt fra sidebildet og skalert ned.
  - **Formen:** lavt teinedekk akter med skansen 4,6 m over vannet, og bakken hever seg fra 28 m og forover. Styrhuset står på et dekkshus på bakken, med vinduer rundt fronten og vinger som er bredere enn huset under. Masta står på taket. Stevnen er nesten loddrett, med rund forfot. Baugen er den samme flaten av rader som på autolineren.
  - **På dekk:** portalen der teinene kommer opp på styrbord side, med transportbåndet akterover, knekkbomkranen og en høy kran ved siden av. Taket over teinedekket akter står på stolper, med dekkshuset tvers over hekken. Eksosrørene står på babord hekkhjørne, MOB-båten på en plattform på babord side og rennen for teinene på styrbord hekkhjørne.
  - **Fargene:** Jonas ville ha et annet design enn bildene («som ikke ligner denne»): antrasittgrått skrog med okergul ripestripe og vannlinje, nesten svart bunn, kremhvite overbygg og okergule bånd på portalen.
  - **Teinene:** haleren (`hauler`) står under portalen ved styrbord rekke, og dekket (`deck`) er teinedekket. Fila er rundt 14 600 trekanter nær og 3 200 på avstand, 496 KB. Bare utsiden er modellert.
  - **Test:** `tral3d.py`. Kjøring: `python3 tools/boats/krabbe50.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-krabbe50.b64` og `boat-krabbe50-side.b64`, og i malen som `glb-snokrabbe` og `pic-snokrabbe`.
- **Den eldre kystbåten (`kyst21`, fra 06.10.2026):** `tools/boats/kyst21.py` bygger en stålbåt på 21 m fra 70-tallet etter bildene Jonas viste av gamle kystbåter (Hindholmen, Erkna). Hun har bakk, rundgatt og galge. Spillets mål står (21 × 7,2 m, 3,4 m dypgående).
  - **Skroget:** ripa stiger mot baugen. Endene er flater av rader fra spantene på 5 og 10 m, som på autolineren (`end_pt`). Radene nær bunnen følger kjølen, og radene over vannlinja følger ripa. Akter lukker radene seg som en ellipse i plan, rundgattet, og under vann går de inn mot akterstevnen.
  - **Bakken** har en hvit hvalrygg, plating fra ripa opp til skansen på bakken, som en egen flate (`whaleback`).
  - **På dekk:** masta ved bakkebrekket med to skrå bein og lastebommen lagt akterover og opp, galgen på styrbord side, luka midtskips og fiskekasser. Akter står dekkshuset med koøyer, styrhuset i lakkert teak med vinduer rundt, skorsteinen (krem med rødt bånd og svart topp) og mesanmasta. Ankervinsjen står på bakken.
  - **Fargene:** Jonas lot oss velge («Skroget trenger ikke være grønt»): oksblodrødt skrog med hvit ripestripe, svart bunn og kremgule master og bom.
  - **Redskapet:** båten fisker i spillet i dag. Haleren står ved styrbord rekke ved galgen, og redskapet ligger på det åpne arbeidsdekket midtskips. Fila er rundt 9 000 trekanter nær og 2 300 på avstand, 321 KB. Bare utsiden er modellert.
  - **Test:** `tral3d.py`. Kjøring: `python3 tools/boats/kyst21.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-kyst21.b64` og `boat-kyst21-side.b64`, og i malen som `glb-kyst21` og `pic-kyst21`.
- **Kystbåten på 14,99 m (`kyst15`, fra 06.10.2026):** `tools/boats/kyst15.py` bygger en moderne kystbåt etter bildene Jonas viste av en rød og hvit 15-meter, sett forfra, fra siden og skrått bakfra. Spillets mål står (14,99 × 6,6 m, 3,0 m dypgående).
  - **Skroget:** rødt med hvit vannlinje og hvit skvettlist. Det røde stiger mot baugen, og over det er skansen hvit. Baugen er en flate av rader som på autolineren, med rund forfot under en skrå stevn.
  - **Baksdekket:** et hvitt overbygg over arbeidsdekket. Styrbord side har en åpen halestasjon over den røde skansen, der redskapet kommer inn. Haleren (`hauler`) står der, og dekket (`deck`) er arbeidsdekket under baksdekket.
  - **Oppå baksdekket:** styrhuset forut med skrå frontvinduer, og masta på taket med radar, GPS-kuppel og lyskastere. Den røde knekkbomkranen står akter, og mesanmasta på hekken har rødt støttesegl og bom ut over hekken. Rekka går rundt hele dekket, og det henger livbøyer på den.
  - **Halestasjonen er åpen:** åpningen er skåret ut av skroget, med gulv, innside av skansen, vegger, dør og hvitt tak innenfor. Haleren og mannskapet synes der inne. `grid` i `bpyutil.py` hopper over en celle når materialfunksjonen gir `None`.
  - Fila er rundt 9 250 trekanter nær og 1 800 på avstand, 327 KB. Bare utsiden er modellert.
  - **Test:** `tral3d.py`, som også haler line i halestasjonen. Kjøring: `python3 tools/boats/kyst15.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-kyst15.b64` og `boat-kyst15-side.b64`, og i malen som `glb-kyst15` og `pic-kyst15`.
- **Den nye hurtigsjarken (`sjarkny`, fra 06.10.2026):** `tools/boats/hs11.py` bygger en sjark på 10,99 m etter tegningen og bildet Jonas viste: et fiskefartøy for kystfiske, fisk i bulk. Tegningen er ikke i repoet.
  - **Målene på tegningen:** 10,99 m over alt, 10,79 m i vannlinja, 4,68 m bredde over alt, 2,06 m største dypgående, 2,40 m dybde, 42 t lastet. Spillet har nå 10,99 × 4,68 m og 2,06 m (før 4,3 og 1,8). Deplasementet (15 t), pris, motor og fart er som før.
  - **Målt** (131 px/m på det forstørrede profilbildet):
    - vannlinja 1,18 m over basislinja
    - kjølen faller 0,3 m forover fra speilet, med hardt slag fra 0,38 m ved speilet og opp til vannlinja ved stevnen
    - dekket 2,11 m opp akter og siden 3,10 m forut
    - stevnen nesten loddrett, styrhustaket på 4,41 m
    - skjegget 0,88 m under basislinja, med propellen i dyse
  - **Dekksplass:** Jonas ba om plass til redskap («husk at det må være dekksplass for utstyr»). Huset på tegningens akterdekk er derfor tatt bort, og arbeidsdekket går fritt fra speilet til det korte huset bak styrhuset. Det har flat luke og lensporter. Kranen står på babord hekkhjørne, og haleren står ved styrbord rekke under takets overheng.
  - **Fargene:** Jonas lot oss velge. Skroget er petrolblått med hvit skvettlist, overbyggene hvite, takkanten og kranen oransje.
  - Fila er rundt 6 000 trekanter nær og 1 500 på avstand, 217 KB. Bare utsiden er modellert.
  - **Test:** `tral3d.py`, som også haler line på dekket. Kjøring: `python3 tools/boats/hs11.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-hs11.b64` og `boat-hs11-side.b64`, og i malen som `glb-sjarkny` og `pic-sjarkny`.
- **Fars gamle trebåt (`trebat`, startbåten fra 05.10.2026):** `tools/boats/snekke23.py` bygger en klinkbygd spissgatter på 23 fot med innenbords semidiesel, etter Jonas' bilder av gamle snekker. Han valgte: topphastighet 7 knop, resten fiktivt etter skiffen; maks 850 o/min; slitt og gammel, ubehandlet trevirke («Gammelt trevirke»); ingen fendere, ikke noe stevnbånd; rorkult og aldri ratt i tillegg.
  - **Modellen:** ni bord i hver side med landene, spant, kjøl, stevner, ripe og skvettlist; dørker rett over vannlinja (spillet tegner sjøen over alt under den), tre tofter, fordekk; motorkasse med sylinder, glødehode, eksosrør og eikehjul; høyt ror langs den skrå akterstevnen med rorkult; fiskekasser foran midttofta og sløyebord over babord rekke (renne, kniv, bøtte); fars presenning som tøy på fordekket. 17 948 trekanter, 854 KB.
  - **Slitasjen** ligger i hvert hjørne (`Acc.done(tint=wear)` i `bpyutil.py`, attributtet `TINT` som GLB-skriveren ganger inn i fargen), så den glir over flatene i stedet for å følge dem i firkanter: grålig treverk i flekker og øverst, mørkt der det er vått, striper fra ripa, tjæret bunn, rust på jernet. Bildene fra Blender gjør spillets farger lineære, så de ser ut som i spillet.
  - **Delene i GLB-en:** `cap` (lokket), `prop` og `tiller` (rorkulten med roret og flaggstanga, origo i rorhodet; de svinger sammen). Sløyebordet stikker 6 cm ut over ripa, uten renne, så skroget holder målene i `vessel3d.py`. `glbModel` setter rorkulten og propellen på plass i den hele modellen (Båthandelen, avstand). `anchors.skiff` har `tiller` (`post` og `grip`), `inboard`, `prop`, `sit`, skipperen på akterste tofte og ingen `wheel`; `anchors.work.own` sier at båten har sitt eget sløyebord (`top` er høyden på det), så `drawDeck` ikke tegner det vanlige. `anchors.exhaust` er munningen på eksosrøret.
  - **I spillet:** hver åpen type med modell og håndankre får sitt eget håndsett (`HANDK`, `useHand(t)` og `handKit(t)` i `view3d.js`) med skrog, glass, lokk, propell, rorkult, navnebrett, skipper og mannskap. Uten ratt i ankrene tegnes verken ratt, gasshendel eller påhengsmotor, bare rorkulten som svinger med roret og propellen under akterstevnen.
  - **Semidieselen:** `VESSELS.trebat.semi` og `rpm:[340, 850]`. Lyden (`ui/10e-sound.js`) er ett tenn hver andre omdreining (firetakt, T = 120/o/min): et dunk på 62→42 Hz med en overtone, et smell opp mot 1,5 kHz og et klakk 0,37 av syklusen etter, etter Jonas' video av en Sabb G (1 sylinder). Hvert tenn legges i `SND.FIRES`, og `drawSmoke` i `view3d.js` slipper en svart sky fra `anchors.exhaust` på samme tid (med egen klokke når lyden er av). Skyene stiger, vokser, tynnes og driver med vinden.
  - **Kjøring:** `python3 tools/boats/snekke23.py` (med `fast` og `dry`). Dataene ligger i `src/data/boat-snekke23.b64` og `boat-snekke23-side.b64`, og i malen som `glb-trebat` og `pic-trebat`. Nye spill starter med `trebat` (`newState`); lagringer uten type blir trebåt.
  - **Skiffen kjøpes bare på verftet** (05.10.2026, Jonas: «Den båten der skal kun være tilgjengelig for kjøp i verftet … For alle brukere»). `bootGame` (`ui/11-boot.js`) gir en lagring som fortsatt har gratisskiffen fra starten, fars trebåt i stedet. Det gjelder det første fartøyet når `S.owned` bare er `['skiff']` eller mangler. Utstyr som ikke passer i trebåten (påhengsmotoren på 90 hk), betales tilbake til full pris, og loggen sier hvorfor. En skiff som er kjøpt på verftet (`S.owned` har flere), blir stående. Testen er `boottest`.
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
  - **Data:** `src/data/harbour-unit.b64` (585 KB), i malen som `glb-harbour`. Det gamle fiskebruket og det store anlegget (`kaimottak.py b` og `c`, 05.10.2026) ligger i `harbour-unit-b.b64` og `harbour-unit-c.b64` (635 og 598 KB GLB), i malen som `glb-harbour-b` og `glb-harbour-c`.


### 5.14 NPC-flåte og kartplotter

- **Kaiplasser** (`berthSlot`, `berthShift`): Hver NPC-båt har en egen plass langs kaia, 30–60 m fra havnepunktet. Plassen er kontrollert mot land, og båter i samme havn ligger minst 20 m fra hverandre. Forskyvningen avtar over 150 m.
- Kystruteskipet og ferja har egne plasser, 70 m unna.
- **NPC-modellene** (V9): Hver båt i `FLEET` får den dekkede kystmodellen nærmest i lengde og bredde (`npcKit`), skalert til egne mål, i en av fire fargedrakter (`LIVERY`: egen, marineblå, rød, grønnblå). Innenfor 500 m tegnes den med full detalj (lod 1) med skipper i styrhuset og to på dekk når hun fisker, innenfor 1,5 km med lod 0,3 (rundt 5 000 punkter), og lenger ute som de gamle boksmodellene. Lanternene følger modellen. I kartplotteren er ikonet større jo lengre båten er.
- **Trykk i kartplotteren:** Trykk nær en havn går til havna, ikke til en fortøyd båt. Fortøyde AIS-mål tegnes mindre og svakere.
- **Fangstprikkene** (`S.marks`, fra 05.10.2026): Hver fiskeøkt og hvert trekk gir en prikk i kartplotteren, farget etter kilo i timen. Prikken forsvinner 12 spilltimer etter at den ble satt (Jonas 05.10.2026: «Prikkene med fangst-rate skal forsvinne etter 12 in-game timer», `MARK_LIFE` i `ui/03-map.js`). `renderDyn` tegner kartet på nytt når den neste går ut. Prikkene blir liggende i lagringen, så sluttseddelen finner fortsatt feltet.
- **Egne merker** (`S.pins`, `ui/03-map.js`, fra 06.10.2026, ønske fra en spiller): hold fingeren stille i kartplotteren i 0,55 s, så settes et gult flagg (ikke et veipunkt). Et trykk på flagget åpner et kort med navn, posisjon og avstand, «Rute hit» (legger et veipunkt) og «Slett». Merkene lagres med spillet, ikke per båt, og blir liggende til de slettes (høyst 60). `routetest.py` sjekker det med berøring.
- **Varmekartet** (`core/12-heat.js`, `ui/03c-heat.js`, fra 01.10.2026): Kartplotteren viser fisken i en sirkel rundt båten du følger, i både Navigasjon og Fiskekart, ut fra ekkoloddet eller sonaren (tabellen i 5.1). Kartplotteren er ikke nødvendig.
  - Rutene ligger på et fast rutenett i verden (`HEATC`), så bildet ikke flimrer. De regnes ut med `heatSample()` fra den samme `density()` som fangsten, i biter på 5 ms (`heatWork`). Nærmeste ruter regnes først, og litt foran båten når den går. Ved nytt bestandstime regnes de på nytt. I havn, i skjult fane og før dybdedataene er lastet regnes ingenting.
  - Det båten har passert, gløder etter og blekner over 30 spillminutter (`HEAT.glow`). Så glemmes det.
  - Tegnes på `#heatcv` under SVG-kartet: ettergløden og de levende rutene. Skalaen er logaritmisk (4,5–150 kg/t internt), og det enkle ekkoloddet viser fire trinn.
  - **Fargene** (Jonas 05.10.2026, før lys turkis, blå og lilla fra 02.10.2026): fem trinn som et ekkolodd, hvitt (gjennomsiktig, så kartet viser seg) under 10 kg/t, så blått fra 10, grønt fra 20, gult fra 40 og rødt fra 80 kg/t (`HEAT_STEPS`, `HEATPAL`). Det enkle ekkoloddet viser trinnene som de er, og de bedre glir mellom dem, så bare ansamlingene av fisk synes, og fargen skiller mengdene. Under 10 kg/t er det klart, og fargen er tett like over. Den grå skiva og den stiplede ringen er borte.
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
  - **Minimer og skjul** (Jonas 05.10.2026: «Spillere skal kunne trykke minimer på disse, som gjør slik at bare basisinformasjonen vises på en tynn stripe … Legg også inn muligheten for fjerning av HUD i innstillingene»): «–» i hjørnet av statusboksen gjør den til én linje med klokke, status og penger, og varsler bare om sjøen og lav energi (`S.settings.hudMin`). «–» på det lille kartet (`#plotMin`) skjuler det og viser fart, kurs og posisjon i en stripe (`plotMin`). «+» åpner igjen. I Innstillinger tar «Skjul HUD» bort statusboksen, det lille kartet, GPS-stripen og kompasset (`hudOff`, `body.hudoff`). Alt lagres. Test: `tests/hudtest.py`.

### 5.15b Åpningsscenen: brevet fra far (05.10.2026)

Jonas: «Skjermen er helt svart, med en slitt konvolutt med røff håndskrift hvor det står: "Til den som tar over" ... Ut kommer det et brettet brev som åpnes.» Teksten i brevet er Jonas sin.

- **Flyt** (`ui/08b-letter.js`, `showLetter`):
  1. Et nytt spill (`showIntro` uten `namesOnly`) åpner på en svart skjerm med lyskjegle, støv og filmkorn.
  2. Spilleren trykker på konvolutten. Den snus, klaffen løsner og svinger opp, og brevet glir ut av lomma.
  3. Konvolutten faller bort, og brevet kommer fram og brettes ut, først øverste og så nederste tredjedel.
  4. «Ta over» går videre til båtnavnet.
- **Lyd:** Papirlyden lages av støy med båndpass og spredte klikk (`letterSound`) og følger lydinnstillingen.
- **Når den ikke vises:** `#notut` hopper over brevet, slik testene gjør (bare fra testmaskinen). Nullstilling (`reset`) viser det heller ikke.
- **Papiret** er fra Blender (`tools/opening/brev.py`). Det er fem WebP-bilder, til sammen rundt 150 kB, i `pic-letter-*`:
  - konvoluttens forside, lomme, innside og klaff
  - selve arket
  
  Bildene har ekte skrukker i geometrien, lys som streifer over arket og flekker i et fargelag. Kantene er slitt bort i alfakanalen.
- **Håndskriften** er sidens egen tekst, så den er skarp og finnes på begge språk:
  - Caveat (SIL OFL 1.1) i brevet og Rock Salt (Apache 2.0) på konvolutten
  - Fontene ligger i siden som base64 (`src/data/font-*.b64`), så de virker uten nett.
  - Skriftstørrelsen tilpasses arket, målt på en kopi utenfor skjermen.
- **Båtnavnet uten rederi** (Jonas: «nye spillere skal ikke lage rederi, kun gi båten et navn. Rederi skal opprettes når man skal kjøpe seg inn i lukket gruppe»):
  - Dialogen spør bare om båtnavnet, og `S.company` står tom.
  - Arket for en båt med hjemmel i lukket gruppe har feltet «Rederiet» med et navneforslag. Navnet settes når kjøpet går gjennom (`buylic`).
  - Stifter spilleren AS før det (`foundAS`), får rederiet navnet «båtnavn Fiskeri AS».
- **Test:** `tut.py` åpner brevet med berøring, både liggende og stående. Den sjekker at brevet er helt utbrettet, at teksten får plass, og at dialogen etterpå bare har båtnavnet.

### 5.16 Veiledningen «Første tur» (01.10.2026)

- **Obligatorisk** for nye spill, også etter nullstilling, og den kan ikke hoppes over (Jonas 05.10.2026: «Hvert steg må gjennomføres, og om spillet lukkes mens tutorial pågår skal den fortsette der den slapp»). Eldre lagringer sendes ikke gjennom den. `#notut` i adressen hopper over den bare når spillet kjøres fra testmaskinen (`127.0.0.1` eller `localhost`, `NOTUT` i `08-actions.js`).
- **Tilstand:** `S.tut = {v:2, m:{…}, catch:true, pAt}`. `m` er milepælene. Steget som vises, er det første som ikke er gjort, og «gjort» leses også av spilltilstanden, så veiledningen tåler omlasting. Rutestegene (`live`) leses på nytt hver gang til båten har kastet loss.
- **Stegene** (`TSTEPS` i `ui/07b-first-trip.js`; fra 07.10.2026 ligger håndjuksa montert i båten fra start og første fiske går uten is, mens naustet ikke selger noe): kartplotteren, rute til ringen ved Gisundet nord (med «Autonav» fremhevet), minst 2 timer fisketid, «Kast loss», «Neste»-brikka og ventingen mens båten går ut, fisket og «Jukse selv», dekksarbeidet, full last, rute til Botnhamn med «Autonav», «Kast loss», gjennomgangen på vei inn, levering, sluttseddelen, isen (steget `ice`: Marked → Is, første fylling på 150 kg er på mottaket, som kjenner igjen den gamle båten, og prisen nevnes ikke) og «Neste mål». `tests/icestep.py` dekker jakta, naustet og isesteget.
- **Fiskelykke og haill like før første fiske** (05.10.2026, Jonas: «Spilleren burde introduseres for "fiskelykke" og haill-appen like før han skal fiske første gangen»):
  - Båten venter på feltet til luksushaillen er aktivert (`tutWait`, `core/05-vessels.js`).
  - Der forklarer `luck` hva fiskelykke er, og `haill` henter den gratis luksushaillen i Haill-appen.
  - `luckhud` viser haill-linja i statusboksen, som blekner trinn for trinn.
- **Gjennomgangen på vei til mottaket** (05.10.2026, Jonas: «… når brukeren har fisket og er på tur til nærmeste fiskemottak. Da må det tas en gjennomgang på alt fra statusfanen, dekksdagboken, appene, kamera, innstillinger, værsystemer»):
  - `tour` og `hud`: statusboksen og «–»/«+».
  - `book`: dekksdagboka. Steget er gjort når den åpnes, fordi tipset er skjult mens boka er åpen.
  - `cam` og `cam2`: til broa med kameraknappen og tilbake. Steget hoppes over uten 3D. Kinoknappen nevnes.
  - `apps`: telefonens hjemskjerm.
  - `vaer`: Vær-appen med varselet for 48 timer og risikofargene.
  - `innst`: innstillingene.
  - Hvert av disse stegene leses ferdig med «Skjønner». Båten seiler videre imens, og venter ved kaia hvis den kommer fram først.
- **Lagringer midt i første tur:** et steg regnes som gjort når et senere steg er merket (`tutStep`). Da møter ikke en lagring fra før endringen nye steg bak seg.
- **Visning:** Et dempet lag med hull rundt målet og en pulserende ring (z-index 61–62, over telefonen), med tipset over (63). `tutRect()` gir målet.
- **Garantert første fangst** (`S.tut.catch`): Så lenge flagget er satt, ligger det en ekte skreiflekk på feltet i Gisundet nord (`tutBonus`, `TUTB`, `TUT_FIELD`). Den gir rundt 175 kg/t for én person i sentrum og en tidel ved kanten av ringen, i samme miks som påfyllingen (72 % torsk, 18 % sei, 10 % hyse). Flekken legges oppå bestanden og fiskes ikke ned, så ekkoloddet og varmekartet viser det båten får.
  - `fish()` fyller fortsatt på, så lasten er full når fisketida er ute, men påfyllingen er nå et sikkerhetsnett: rundt en firedel av fangsten i stedet for ni tideler (`window.TUTTOP` teller den i testene). Bare bestandens egen andel av fangsten trekkes fra bestanden.
  - `risk()` og snuing for vind er slått av, og i jukse-spillet kommer nappet etter 4–8 s. Flagget nullstilles ved første levering.
- **Haill:** Kommer båten fram før haillen er hentet, venter den på feltet (`b.tutWait`) og begynner å fiske når haillen er om bord.
- **Sperrer** (`tutAllow`): «Kast loss», nye punkter og levering bare på sine steg. Puben, kveiteutstyret, driftsplanen, «Hjem samme vei» og levering andre steder enn Botnhamn er skjult til veiledningen er ferdig.
- **Ingen nødutgang:** knappen «Hopp over veiledningen» (etter 20 minutter uten fremgang) er fjernet. Steget leses fra spilltilstanden og milepælene i `S.tut`, som lagres, så veiledningen fortsetter der den slapp etter at spillet har vært lukket.
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
  - **Sesonger:** årets regler (kveitefredningen, skreisesongen, maksimalkvotene i åpen gruppe, uer på juksa, ferskfiskordningen) og prissesongene, også kongekrabbens: måneder der `SPECIES[art].pm` ligger minst 10 % over eller under årssnittet. Det som er over, krysses ut (klassen `over`; `x` er opptatt av lukkeknapper).
  - **Hendelser:** de siste fire ukene. Ukens prisbevegelse per art når `weekDev` er minst ±8 %, uværsdager med toppris (`supplyFactor` ≥ 1,025), og regelendringer.
  - **Utstyr:** et kort per sett fra `S.gearLog` (hele rederiet, de siste 60), som skrives i `finishSet` og oppdateres i `finishHaul` og når redskap går tapt. Ståtid som tellestreker opp til 40 t.
  - **Salg:** sluttseddelen per levering. `sell()` lagrer den i `S.sales[i].d`: linjer `[art, klasse, kvalitet, sløyd, kg, kr, antall]`, lever og rogn, innloggingsbonus, oppdragstillegg, inndratt, trekk for rognkrabbe, mannskapet med andel, lott, gebyr og et løpenummer (`S.saleSeq`). Bare de siste 60 salgene beholder `d`. Eldre salg vises med kg og kroner per art.
- **Oppdrag** tas i Bygd (skuffesiden `oppdrag`). De aktive ligger som en oppdragsliste i telefonappen `ordl` («Oppdrag») med frist og framdrift, og under står de tidligere med Levert eller Ikke levert. `ordState().done` har nå `ok` og tar 20. Både levert og ikke levert skrives i Drift.
- **Salgslaget, «Mine landinger»:** 📖 per sluttseddel åpner den i boka.
- **Sjømann, fanen «Papirer»** (`papers()`): helseerklæring for arbeidstakere på skip (fiktiv lege, gyldig 2 år fra første loggføring), sikkerhetsopplæring for sjøfolk på mindre skip (35 t), fiskeskipper klasse C og begrenset radiosertifikat (SRC, gyldig når en båt har VHF). Papirene styrer ingenting.

### 5.19 Arbeid om bord, mat, hviletid, replikker og energien din (01.10.2026)

Brukerens ønske: mannskapet skal være en levende og givende del av spillet, inspirert av Fishing: Barents Sea. Ingen portretter.

- **Filer:** `core/13-work.js` (stasjoner og kjeder), `core/14-crewlife.js` (læring, mat, hviletid og replikker), `core/15-energy.js` (energien din og søvnen) og `ui/05b-work.js` (skuffesiden «Mannskap», toastene og søvnskjermen).
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
- **Menyen «Mannskap»** (knappelinja, i havn og på sjøen, så snart du har mannskap eller en driftsplan; het «Arbeid» til 07.10.2026, tilbakemelding #11; ansettelser ligger under Bygd, «Ansatte»):
  - Øverst er «Mannskapet»: deg og hver person, med status (mønstret på «båten» ved kai, til sjøs eller hvilende i rorbua/naustet; fri denne turen; fri i dag for biyrke), slitenhet, trivsel, hvilt siste døgn og hviletidsregelen. Mannskapet er mønstret på båten og følger den dit den ligger: driftsplanen (`opsStep`) går også fra en rorbu eller et annet sted enn planens havn, ved at skipperen først tar leia (`leiaRoute`, mellomlagret i `OPS_PRE`) derfra til planens første punkt. Ligger båten ved en rorbu, hviler mannskapet der med `RORBU.rate` også når du ikke er om bord (`crewTick`).
  - Nederst er kortet «Fast driftsplan» (det samme som før lå under Bygd, Mannskap): på/av, avgang, dager, maks vind og skipper, og knappen «Lag driftsplan av ruta i kartplotteren» når båten ligger i havn og ruta ender i en havn.
  - Flyten for riggen (bare med mannskap om bord): Ror → Fiske/Haling (→ Krabbe) → Sløying → Ising, med Kokk og Pause ved siden av. Hvert kort viser hvem som står der og hva som venter: kg, redskap trukket, eller tid til måltidet og matstellet.
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
  - Den synker 100/24 % per time når båten du er om bord på, ikke ligger ved kai.
  - **Hvor du hviler** (Jonas 05.10.2026: «Man skal ikke kunne hvile i en åpen båt, da må man enten seile hjem til naustet sitt eller ta inn på en rorbu», `restRate` i `15-energy.js`):
    - I land, når du har gått inn (`S.rest`, knappen «Hvil» i havn, `restStart`/`restEnd`): i fars naust i hjemhavna (ved begge liggeplassene) stiger den 100/8 % per time, med taket og ovnen raskere (`naustRest`). På en rorbu (5.25i) stiger den 100/6 % per time, for 150 kr natta.
    - Om bord ved kai på en båt med køyer (`VESSELS` `berths` > 0) stiger den 100/8 % per time som før.
    - I en åpen båt (ingen køyer) ved en annen kai står den stille. Advarselen ved 25 % peker på nærmeste rorbu.
    - Mens du hviler i land, er skipperen borte fra båten i 3D (`awaySk` i `view3d.js`). «Gå om bord» eller å kaste loss (`depart`) avslutter hvilen.
  - HUD-raden heter «Energi».
  - Ved 25 % kommer en melding og en toast, og arbeidet ditt går med 0,75.
  - Under 15 % mørkner kantene på skjermen (`#vign`).
  - **Ved 0 sovner du i 8 spilltimer** (`S.sleep`). `#sleep` (z 64) toner til svart og viser nedtellingen i ekte tid.
  - Med mannskap står du utenfor arbeidet, den med best sjømannskap tar roret, og turen går videre.
  - Alene stopper fisket og redskapsarbeidet, og båten driver med vinden i 0,3–0,8 knop (`sleepDrift`). Fra 08.10.2026 (4.12d) stopper den før land eller grunt vann og blir liggende («Båten drev inn mot land og ble liggende der»), og på en rute holder autopiloten kursen og båten går fram til ruta er slutt. Den går aldri på grunn i søvne.
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

**Klima etter sted (V1, 06.10.2026;** Jonas: «Vi skal jo ikke ha ekte live-vær, men vi må kunne simulere været langs hele kysten på en god måte, med variasjoner fra sted til sted»):
- `src/data/climate.json` har månedsmidler for 19 punkter fra Færder til Kirkenes: lufttemperatur, nedbør, snø, sterkeste vind, andel kulingdager og skydekke fra ERA5 2006–2020, og sjøtemperatur fra Open-Meteos marine data 2023–2025. Dataene hentes av `tools/climate/fetch.py` i `.github/workflows/klima.yml` (startes ved å endre `tools/climate/klima.json`) og ligger som releaser `klima-N`.
- Spillets eget vær er uendret, men flyttes med hvor stedet avviker fra Senja, der spillet er kalibrert. Lufta og sjøen flyttes med forskjellen i temperatur, nedbøren med forholdet i månedsnedbør, og skydekket med forskjellen. Ved Senja er alt nøyaktig som før.
- Mellom punktene vektes de tre nærmeste med 1/d², lagret per rute på 5 km (`climW`).
- `airTemp`, `precipAt`, `cloudAt`, `visibility` og `seaTemp` tar et valgfritt sted `p` og bruker ellers båten. Begroingen på redskap regner sjøtemperaturen der redskapet står, og Vær-appen viser sjøtemperaturen der båten er.
- Bodø, Tromsø og Kirkenes ligger ute på sjøen fra `klima-2`. I `klima-1` var rutene deres mest land, med altfor kalde vintre (Tromsø −8,1 °C i januar mot −4,1 °C nå).
- **Test:** `climtest`.

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
  - **Shaderne på telefoner** (05.10.2026): pikselskyggerne ber om høy presisjon bare der telefonen har det (`FS_HP`), en mistet kontekst før 3D er i gang prøver igjen (`glWatch`), og feilen går til skyen (`cloudErr`, med GPU og grenser). Jonas' Adreno 642L kompilerte alt, men lenket ikke sjøen, og driveren ga ingen logg. Sjøen prøver derfor i rekkefølge: med sjøtilstandsteksturen i hjørneskyggeren, uten den, og med fjernsjøens enklere bølger. Pikselskyggeren har sine egne kopier av bølgetabellene (`SEAF`: `uFWa`, `uFWb`, `uFGp`), fordi samme uniform-tabell i begge skyggerne var det eneste sjøen hadde som ingen annen skygger hadde. Lenkes ingen av dem, prøves hver halvdel alene for rapporten (VS alene, FS alene), og en enkel flat sjø med litt krusning, himmel og solglitter tar over (`BASIC_VS`/`BASIC_FS`, `PS.basic`). Skyen får vite hvilken sjø som ble brukt («3D sjø med reserve»). Prøvd ved å tvinge lenkingen til å feile i Chromium.
  - **Windows med Direct3D 11** (05.10.2026): den fulle sjøen tok med seg GPU-prosessen både på Intel Iris Xe i Chrome (Adrian) og på NVIDIA GTX 980 i Firefox, med «sjø link: ingen logg fra driveren». Etter det feilet hver kompilering uten logg, mens `isContextLost()` ennå sa nei, og Chrome slo så av WebGL for siden («ingen WebGL-kontekst» til nettleseren startes på nytt). Derfor:
    - Direct3D (alle merker, `GPU` fra `RENDERER`) starter på sjønivå 1 (fjernsjøens bølger og ingen tekstur i hjørneskyggeren).
    - Nivået som prøves, skrives ned først (`dsb_sea_try`) og slettes når sjøen er laget og konteksten fortsatt lever. Finner en lasting merket igjen, starter den ett nivå ned (`dsb_sea`) og sier fra til skyen. Slik lærer en maskin som krasjer, selv om nettleseren aldri melder at konteksten er mistet.
    - Etter en feil uten logg venter `glSettle` 80 ms og ser om konteksten er mistet, før neste forsøk.
    - Uten WebGL-kontekst forteller feilteksten at nettleseren må lukkes helt og åpnes igjen.
    - Gir nettleseren ingen kontekst med kantutjevning og den kraftige GPU-en, prøver spillet enklere innstillinger før 3D gir opp: uten kantutjevning, så uten krav (`ctxTry`, #218, Adrians PC).
  - **Mistet kontekst under spill** (#218, 05.10.2026): bufrene, teksturene og programmene forsvinner med konteksten. Når nettleseren gir den tilbake, lagres spillet og siden lastes på nytt, høyst én gang hvert tiende minutt (`dsb_gl_reload` i sessionStorage), så en driver som faller igjen og igjen ikke laster siden om og om igjen. Ellers står meldingen om å laste på nytt. Feilen går til skyen. `seatrytest` sjekker det med `WEBGL_lose_context`.
    - Test: `tests/seatrytest.py` (D3).
  - **Bølgeløkkene skrevet ut** (05.10.2026, etter feilloggen): Adreno 642L lenket fortsatt ingen sjø, og hjørneskyggeren alene feilte. Den var den eneste skyggeren i spillet som slo opp i uniform-tabeller med en løkkevariabel. Løkkene over de 13 bølgene er derfor skrevet ut med faste indekser i både hjørne- og pikselskyggeren (`SEA_VS_WAVE`, `SEA_WAVE(W, i)`). Bølgene er de samme.
    - Før den flate sjøen prøves en lett hjørneskygger med de fire lengste vindbølgene og dønningen, uten kjølvann i geometrien (`SEA_VS_LITE`, `PS.lite`, `#sealite` i adressen tvinger den).
    - Varianten som virket når den fulle ikke gjorde det, huskes på enheten for denne utgaven av skyggerne (`dsb_sea_ok`, `SEA_VER`), så telefonen ikke lenker de som feilet ved hver start. Endres skyggerne, endres `SEA_VER`, og alle prøver den fulle sjøen igjen.
    - Test: `tests/sea3d.py` (den lette sjøen tegnes uten GL-feil).
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
- **Semidieselen** (trebåten, 05.10.2026): se 5.13. Nivået `LV.eng` er styrken på dunkene, som blir litt kraftigere når gassen er oppe.
- **Musikken** (Jonas 05.10.2026: «rolig ambient instrumentaler som svak stemning i bakgrunnen. Må kunne skrus av i innstillinger»):
  - Den lages mens den spiller (`musTick` i `SND`): myke flater (tre oscillatorer per tone gjennom et lavpass) i langsomme akkorder i D, dorisk om dagen og eolisk om natta, over en lav grunntone. Hver akkord varer 19–25 s og glir over i den neste.
  - Nå og da kommer en kort frase på en myk klokke (en til tre toner fra akkorden, en eller to oktaver opp), gjennom et langt ekko og et rom (en konvolver med fire sekunder støy som dør ut).
  - Mørkere om natta (lavere lavpass) og i dårlig vær, og sjeldnere klokker i storm.
  - Den har egen vei ut (ikke `master`), så den spiller også når lydeffektene er av. Styrken er `S.settings.music` (Av, Svak 0,2, Normal 0,35, som er standard, og Sterkere 0,6), og ganget med 0,2 er den aldri høy.
  - Ingen filer eller lisenser. `soundtest.py` sjekker at den spiller med egen styrke og blir stille med Av.

### 5.25b Telefon, nettbrett og PC (05.10.2026)

Jonas: «vi må uansett optimalisere hele spillets UI for både mobil, nettbrett og pc». `tests/uishots.py` går gjennom hovedvisningene (havn, sjø i 3D, kartplotter, rute, telefonen, Salgslaget, Innstillinger, boka og menyen i havn) i fem størrelser: telefon stående (390 × 844) og liggende, nettbrett stående (800 × 1280) og liggende, og PC (1440 × 900). Den tar bilder (`tests/out/ui_<visning>_<størrelse>.png`) og finner selv tekst som er kuttet, knapper utenfor skjermen (ikke det som ligger i en boks som ruller, og ikke Dekksdagboka, som stikker ut med vilje), de store blokkene oppå hverandre, og knapper under 32 × 30 px på berøringsskjermer. Første runde fant 181 ting, nå 0.

Hva som ble gjort (siste blokk i `styles.css`):
- **Telefon stående** (`max-width: 560px`): telefonen i spillet fyller hele skjermen uten ramme. Kompasset ligger øverst, med infoboksen under. Handlingsknappene går fra Dekksdagboka til telefonknappen, og navnene kan gå over to linjer. Kartplotterens topprad har symboler for innstillinger (⚙) og lukk (✕), og ekkoloddskalaen ligger under raden til høyre.
- **Telefon liggende** (`max-height: 520px`): infoboksen er litt mindre (`zoom`), minikartet er borte, GPS-boksen ligger rett under infoboksen, og telefonen i spillet er like høy som skjermen.
- **Overalt:** kompasset når aldri infoboksen, og knappene i appene (`.ph-sub`) er minst 36 px høye på berøringsskjermer. Ekkoloddfeltet forsvinner når ekkoloddet er av.
- `--gpsTop` og `--hudW` regnes fra infoboksen slik den er tegnet (`getBoundingClientRect`), så de stemmer med `zoom`.

### 5.25c Admin: åpningen på nytt (05.10.2026)

Admin-appen (bare Jonas' konto) har kortet «Åpningen»: «Vis brevet» spiller brevscenen igjen uten å endre noe, og «Start nytt spill» spør først og begynner så helt på nytt (lagringen i skyen også), med brevet, båtnavnet og «Første tur».

### 5.25d Fars notatbok og drømmefisken (05.10.2026)

Jonas valgte dem fra lista over det som får folk til å spille videre (nr. 2 og 3). Reglene ligger i `core/09b-dream.js`, og appen, kartmerkene og kampen i `ui/06c-notebook.js`. Testen er `tests/dreamtest.py`.

**Notatboka:**
- `notesMake()` lager fem méd rundt hjemhavna (`S.home`, ellers Finnsnes), én gang, når kartet rundt havna er lastet. Appen Notatbok laster kartet selv første gang.
- Hvert méd ligger der arten står best innen 2–12 km, på sin dybde, og minst 1,5 km fra de andre:
  - torsk på 20–80 m
  - hyse på 60–160 m
  - sei på 20–120 m
  - lange på 150–350 m
  - kveite på 40–140 m
- Teksten har retning og avstand fra havna, nærmeste stedsnavn, dybden i favner (m / 1,83) og et råd fra far (`FATHER`).
- Medene lagres i `S.notes` (`marks`, `found`, `shown`). En flytting (`S.home` endres) lager nye.
- Fisker du innen 400 m fra et méd, er det funnet (`dreamTick`). Da kommer en melding, og arten biter 30 % bedre der (`noteBoost` i `fish()`).
- Et funnet méd viser fars historie om stedet (`FATHER_STORY`). Når alle fem er funnet, gir «fars gamle pilk» 5 % bedre fangst overalt (`noteAll`).
- «Vis i kartet» tegner en stiplet sirkel med radius 500 m (`m.c`, inntil 350 m fra medet) og holder den på kartet. Funne méd får et blyantkryss med navnet.
- Første gang du fisker selv (etter «Første tur», eller i et spill fra før), kommer meldingen fra «Naustet».

**Drømmefisken:**
- Den rulles hvert fiskeminutt med juksa (`dreamTick`), når det er minst 30 kg plass. Arten veies etter tettheten der, og fisken må stå på sin dybde:

  | Art | Vekt | Merknad |
  |---|---|---|
  | Kveite | 60–180 kg | |
  | Skrei | 25–42 kg | En firedel så ofte utenfor januar–april |
  | Lange | 18–30 kg | |
  | Sei | 16–24 kg | |
  | Uer | 8–13 kg | |
  | Brosme | 10–16 kg | |

- **Hvor ofte:** sannsynligheten er `min(0,02, Σtetthet / 2 / 1800)` per minutt. I juni gir det rundt 1 per 100 timer på fars torskeméd og 6 på Kveitebakken (`dreamP`). På Kveitebakken er den åtte ganger så høy, og der er det kveite 60 % av gangene.
- Er du om bord og siden er synlig, kjemper du selv (`DREAMUI`). Ellers tar mannskapet den, og de får den inn halvparten av gangene.
- **Kampen:**
  - En rad viser belastningen og en annen hvor mye line som er ute (40 m ved start).
  - Hold «Sveiv» (eller mellomrom) for å ta inn line, 4,2 m/s. Belastningen stiger da 0,32 per sekund, og mye mer om fisken drar samtidig.
  - Fisken drar ut på måfå, oftere og lenger mens den har krefter, og telefonen vibrerer.
  - Fisken mister krefter mens belastningen er over 30 %.
  - Snøret ryker når belastningen har vært rød i et halvt sekund. Tar fisken 120 m line, er den borte.
  - Er lina inne og fisken sliten (krefter under 35 %), blir den gaffet. Har den krefter igjen, dykker den.
  - 20 sekunder uten berøring, eller at siden skjules, gir fisken til mannskapet.
- Det som landes, går i lasten (så mye det er plass til) og på trofeveggen (`S.trophies`), og meldes i Kystposten.
- Kveite i fredningstida (`kveiteClosed`) settes ut igjen, men kommer likevel på veggen.
- En kamp som er igjen fra en side som ble lukket, er tapt.

**Usikkert:** tallene for hvor ofte storfisken kommer og hvor vanskelig kampen er, er ikke prøvd av en spiller ennå.

### 5.25e Sesongene som hendelser, og folk på kaia (05.10.2026)

Jonas valgte dem fra lista (nr. 5 og 7).

**Sesongene** (`core/09c-seasons.js`):
- Hver sesong (`SEASON_EV`) begynner på sin egen dag hvert år, i et vindu av noen dager. Dagen er den samme for alle (`seasonDoy`, fra `h2`):
  - Skreien kommer (rundt 20. januar).
  - Høysesong på feltene (rundt 1. mars).
  - Skreien drar (rundt 10. april).
  - Loddetorsk i Finnmark (rundt 25. april).
  - Seisommer (rundt 10. juni).
  - Høsthyse (rundt 5. september).
  - Sild og hval i fjordene (rundt 10. november).
  - Julefiske (15. desember).
- Hver sesong har tre kanaler:
  - Kystradio over VHF: en melding på dagen, fra `seasonDay`, som går hver time.
  - Kystposten (`seasonNews` i `newsForDay`).
  - Praten på puben (`seasonTalk`).
- Regelverkets egne datoer står også i kalenderen (`SEASON_FIXED`). Nyhetene om dem ligger fortsatt i `06-services.js`.
- **Skreifestivalen:** andre helg i mars, fra lørdag 00 til søndag 18.
  - Største torsk som noen av båtene dine lander (`festCatch` i `addCatch`), mot sju skippere fra kysten (`festField`).
  - Premiene er 15 000, 7 500 og 3 000 kr, og resultatet kommer søndag kveld.
  - En drømmeskrei vinner nesten alltid.
- Telefonappen Sesong (`ui/06d-season-folk.js`) viser:
  - sesongen nå
  - festivaltavla fra en uke før til tre dager etter
  - det som kommer
  - en fiskekalender med 7 arter × 12 måneder, laget av `SPECIES[sp].av` (skrei lagt til for torsk)

**Folk på kaia** (`core/09d-folk.js`):
- **Edvard**, som kjente far, hilser i hjemhavna én gang om dagen mellom 08 og 20 (`folkPort` i `step`). Første gang sier han hvem han er. Siden snakker han om:
  - far og været, uten å gjenta seg på fem dager
  - veien til et méd du ikke har funnet (40 % av dagene)
  - storfisken du fikk
- **Mottakssjefen** (et navn per mottak, `folkPlantName`) teller det du lander der (`folkSold` i `sell`).
  - Etter 2, 10 og 30 tonn er du fast leverandør. Mottaket betaler da 1, 2 og 3 % mer på markedsprisen (`folkPf` i `clsPrice`).
  - Minsteprisen endres ikke.
- **Solveig i butikken** teller kjøp med pris (`folkShop`):
  - etter 5 kjøp er kaffen gratis (bare tekst)
  - fra 15 kjøp er sekkeisen 10 % billigere (`folkIce` i `shopIceKr`)
- Telefonappen Folk viser dem, hvor langt det er til neste trinn, og hva Edvard sa sist.

**Oppdrag langs kysten:** mottakene langs kysten er også kunder (`CUSTOMERS`, lagt til i `06b-coastports.js` med de tre artene de tar imot mest av). `custNear` gir bestillinger fra kunder innen 60 km fra hjemhavna eller 40 km fra båten. Med Senja som hjem gjelder Senjas egne kunder som før. Omdømmekortet viser bare kundene i nærheten og dem du har handlet med.

**Usikkert:** prosentene for faste leverandører er et anslag. Mottakene gir ofte bonus eller bedre vilkår til faste leverandører, men tallene er ikke sjekket mot noen avtale. Premiene i festivalen er satt av oss.

### 5.25f Fars naust og butikken på kaia i 3D (05.10.2026)

- Modellene kommer fra `tools/harbour/naust.py` og `butikk.py`, og hvor de står, regner `core/07c-naust.js` ut. De ligger i siden som `glb-naust` og `glb-shop`.
- **Naustet** (`naustFind`) står ved hjemhavna (`S.home`, ellers Finnsnes), på en fjærestrekning 60–240 m til en av sidene langs mottakets kaifront. Strekningen må oppfylle disse kravene:
  - fjæra er nesten rett over 30 m (høyst 6 m bue)
  - det er åpent vann 8, 16 og 30 m ut, og land 6, 14 og 25 m inn
  - det er minst 70 m til et havnepunkt
- Pålekaiens front står 4 m ute fra fjærelinja, parallelt med den.
- Plassen regnes ut én gang per hjemsted (`S.naust`, `naustSite`), når kartet rundt havna er lastet.
- **Butikken** (`shopSite`) står bak kaifronten i Finnsnes, med x = 0 midt på fronten.
- `view3d.js` har `SITES`, som brukes slik:
  - `sitesNow` gir plassene, og modellene tegnes av `drawSites`, fullt innen 900 m og enkelt ut til 4 km.
  - Bakken (`siteTerr` i `terrRaw`) skjæres 0,4 m under naustets egen fjærebanke (`NBANK` = `BANK` i `naust.py`, fra 3 m ute til 16 m inne) og går tilbake til det den var innen 8 m.
  - Butikkens plass (fra 9,6 m til 27,5 m inn) planeres 0,1 m under kaidekket og går tilbake til det den var innen 12 m.
  - Kartets hus og trærne der modellene står, tas bort (`onSite`, med `clear`-rektanglene fra modellenes ankere).
- Kartplotteren viser naustet som et lite hus med navnet «Fars naust» (`NOTEBOOK.svg`).
- Testen er `tests/sitetest.py`, med bildene `site_naust.png` og `site_shop.png`.
- **Naustet som hjem** (Jonas' valg nr. 4, `NAUST_UP` i `07c-naust.js`): stegene kjøpes én gang i Notatbok, mens båten ligger i hjemhavna.
  - Tett taket (6 000 kr) og vedovn (9 000 kr, etter taket) gir hver 25 % raskere hvile i hjemhavna (`naustRest` i `energyMinute`).
  - Fars arbeidsbenk (7 500 kr) gir håndjuksa og kveiteutstyr en firedel billigere i hjemhavna (`shopBuy`).
  - Troféveggen (3 000 kr) er bare pynt i notatboka.
  - Regnet på taket (lyd) er ikke laget ennå.
- **Start ved naustet** (Jonas 05.10.2026, #207): et nytt spill starter med båten ved naustets pålekai (`S.boat.berth = 'naust'` i `chooseStart`, `ui/08c-start.js`, som også laster kartet 7,5 km rundt havna).
  - **Naustet** finnes nå med `shoreSpot` (ringsøk etter rett fjære: sjøretning fra 12 prøver på 12 m, fjæra langs normalen, rett over ±halve lengden, vann ut og land inn, utenfor `PIERBOX`, poeng etter `pref`). Det står 60–360 m fra mottakets kaifront. Kystundersøkelsen i `starttest.py` (hvert 8. mottak langs kysten) fant det ved 20 av 20.
  - **Liggeplassen** `quayFace(pid, 'naust')` er `naustFace`: fra naustets midtpunkt, 8,1 m halv lengde og 3,4 m dyp, med sjøen ut. `berthKind` faller tilbake til `'main'` når naustet ikke er funnet.
  - **Butikken ved naustet** (`shopNear`, `S.shopN`) står 45–130 m fra naustet (ellers opp til 160 m), på bakkens høyde (`lev`, medianen av 9 prøver). `siteTerr` planerer plassen der, og `drawSites` løfter modellen. I Finnsnes brukes butikken på kaia.
  - Naustet og butikken står minst 110 m fra midten av en havneenhet (`unitNear`). Enhetens blokk, fylling og terreng rundt rekker omtrent 100 m, og mottakene langs kysten har også enheter.
  - **Juksa og isen er gratis ved naustet**: far betalte for dem i fjor høst, og Solveig forteller det i en melding. Isen kommer i sekker.
  - **Ingen hurtigreise** (Jonas: «Fast travel er ikke mulig i spillet, punktum.»): `startShift` flytter aldri båten til eller fra naustet. Levering og diesel avvises ved naustet (`NAUST_SAIL`), og spilleren må seile til mottakskaia selv.
  - **Til naustet** går det med en rute: `naustTarget(pt, r)` gjør et trykk ved naustet i kartplotteren (`03-map.js`) eller med Autonav (`03b-route.js`) til rutas siste punkt `{port:hjem, berth:'naust'}`. `arrive` kaller `dock(pid, w.berth)`, som legger båten ved naustet. Autonav finner veien til havna og ender ved naustet. Fra havna selv går ruta rett dit.
  - Testene er `sitetest.py` (start ved naustet, Solveig, ingen flytting, ruta som ender ved naustet) og `starttest.py` (kystundersøkelsen: naustet ≤ 400 m, butikken 40–170 m, feltet ≤ 6 km og dieselen for første tur ≤ 60 % av tanken).
- **Ikke gjort ennå:** kameraet kan gå inn i husene, og lyktene i ankrene brukes ikke.


### 5.25g Innlastingen og innloggingen (05.10.2026)

- **Bildet** (`tools/brand/loader.py`, `src/data/loader-land.b64` og `loader-port.b64`):
  - Fars naust på pålekaia i blåtimen, laget av de samme modellene som i spillet (`tools/harbour/naust.py` og `tools/boats/snekke23.py`).
  - Lampa over loftsdøra og vinduene lyser varmt, og trebåten ligger fortøyd med to tau.
  - Bak står Senja-tinder med snø i skyggeleggeren: høyt og ikke for bratt, brutt opp av støy. Fjellene er laget av ridged-støy.
  - I det åpne partiet til venstre står en blek fjellrekke i det siste lyset. Noen naboer har lys i vinduene langs stranda, og det er stjerner høyt oppe.
  - Det er to bilder:
    - Liggende: 1600 × 1000, med naustet i midten.
    - Stående: 960 × 1600, med naustet litt over midten, slik at innloggingskortet ligger over sjøen.
  - Bildene er WebP med kvalitet 84 (54 og 49 KB). De legges i siden som CSS (`.dsb-bg` i `src/index.html`), og `@media (orientation:portrait)` velger det stående.
  - `python3 tools/brand/loader.py quick` gir en rask prøve. `land` eller `port` renderer bare det ene bildet, på rundt to minutter.
- **Innlastingen** (`#loader`):
  - Bildet er mørkere øverst og nederst.
  - Øverst står «Kystfiske langs norskekysten» i sperrede versaler mellom to streker, og navnet stort i Source Serif 4.
  - Nederst løper en tynn lysstripe, med «Laster kysten …» under.
  - `.gone` toner den ut og skjuler den etterpå (`visibility`), og da stopper stripa.
- **Innloggingen** (`cloudGateShow` i `ui/10f-cloud.js`):
  - Den har samme bilde og tittel.
  - Teksten og knappene står i et halvgjennomsiktig kort med uskarp bakgrunn. På telefon og nettbrett ligger kortet nederst. På brede skjermer (minst 900 × 600, liggende) står det til venstre, så naustet synes.
  - Klassene ligger i `styles.css` (`.cg-card`, `.cg-btn`), ikke inline.
- **Ikke gjort ennå:** innlastingsteksten er alltid norsk. Spillets språk er ikke lest inn ennå når den vises.

### 5.25h Push-varsler (05.10.2026)

- **Hvorfor de planlegges i spillet:** spillet kjører i nettleseren, så serveren vet ikke hva som skjer i det.
  - Når appen går i bakgrunnen (`visibilitychange` til `hidden`, og `pagehide`), regner `pushItems()` i `ui/10g-push.js` ut hva som skjer mens den er borte.
  - Den felles klokka går videre med `GAME_RATE` (6 spillminutter per minutt) når spillet er lukket. Spilltid T blir derfor `nå + (T − S.t) / 6` minutter. Planen ser 40 ekte timer fram (`PUSH_AHEAD`).
  - `push_plan` legger planen ut på serveren og erstatter den forrige.
  - Tilbake i appen tømmes planen, så ingenting kommer mens du spiller.
- **Det som varsles** (05.10.2026; Jonas: «Varselet må ha betydning», «Vi skal sende 4 pushvarsel i døgnet. kjør på med alle forslagene»). Hver type hører til en gruppe spilleren kan slå av på kontokortet (`S.settings.pushCat`), og har en tid den slutter å bety noe (`exp`):
  - *Fangst og båter:*
    - Redskap som har stått lenge nok: line 10 t, garn 20 t, teiner 40 t (`PUSH_SOAK`, etter `soakHour` i `core/10-gear.js`).
    - Fisk i lasterommet som snart går ned et kvalitetstrinn, to spilltimer før. Fallet regnes som i `vesselStep` (blødd og iset 0,9 per time osv.). Ikke når båten er på vei inn, for det dekker neste punkt.
    - En båt på rute når den er framme i havna med fisk, regnet som ETA i ruta. Uten fisk kommer det ikke.
  - *Verftet:* verftsjobbene på en båt er ferdige (`YARD_KINDS`).
  - *Kvoter:* Fiskeridirektoratet varsler stopp i åpen gruppe. Året regnes videre dag for dag på en kopi av `S.qy` (`qyStep`), med det som er igjen av kvoten (`codRoom`).
  - *Topplista* (serveren selv): når en annen spillers levering tar dem forbi deg i gruppa denne spilluka (`push_passed` i `land_put`, høyst én i døgnet), og ukeresultatet når spilluka er over (`push_week`, hver time i pg_cron, «Norges beste båt!» for nummer 1). Bare når spilleren ikke er i spillet (presence de siste to minuttene) og har topplista på (`push_prefs`).
  - *Sesonger:* sesongnyhetene kl. 07 den dagen de kommer, fra Kystradio, og skreifestivalen dagen før.
  - Høyst 24 i planen.
- **På for nye spillere** (05.10.2026; Jonas: «jeg ønsker at varsler skal være på by default for nye brukere»). Ingen side kan sende varsler før spilleren har sagt ja til nettleserens egen spørsmål, og på iPhone kan spørsmålet bare komme fra et trykk. Derfor:
  - Har nettleseren allerede gitt lov, slår spillet dem på av seg selv (`pushAuto`).
  - Ellers spør det med et eget vindu når «Første tur» er ferdig og etter en levering (`pushAsk`), høyst tre ganger og med minst et døgn mellom (`S.settings.pushAsk`).
  - Det spør aldri igjen når spilleren har sagt nei i nettleseren eller slått varslene av i Innstillinger (`S.settings.push` = false).
  - «Slå på varsler» spør nettleseren før noe annet venter (`pushOn`), så trykket fortsatt gjelder.
- **Reglene på serveren** (`supabase/migrations/20261006030000_push_rules.sql`, `push_claim`): høyst fire meldinger per spiller i døgnet. Det som forfaller samtidig, blir én melding med en linje per varsel. Ingenting går mellom 22 og 08 norsk tid. Det som har gått ut på dato, droppes usendt. `push_plan` erstatter bare spillets egne (`kind` = `plan`), ikke serverens (`srv`). `dsb.clock` lar testene sette klokka.
- **Serveren** (`supabase/migrations/20261005120000_push.sql`):
  - `push_subs` og `push_queue` er stengt for spillere.
  - `push_sub` godtar bare nettleserens egne varseltjenester (Google, Mozilla, Microsoft og Apple), så funksjonen poster aldri til en adresse spilleren velger.
  - `push_claim` tar det som er forfalt og merker det sendt i samme operasjon (`for update skip locked`). Bare service-rollen kan kalle den.
  - En slettet spiller tar med seg abonnementene og køen (`on delete cascade`).
- **Sendingen** (`supabase/functions/push-send`):
  - Den bruker `npm:web-push` med VAPID-nøklene som hemmeligheter, som bare Jonas lager.
  - pg_cron kaller den hvert femte minutt.
  - Et abonnement tjenesten melder borte (404 eller 410), slettes. Et som feiler over 50 ganger, slettes også.
  - `GET ?key` gir den offentlige nøkkelen. Uten nøkler viser ikke spillet bryteren.
- **I spillet:**
  - Bryteren «Varsler når appen er lukket» står på kontokortet under Innstillinger. Den vises bare innlogget, i appen og med nøkkelen på plass.
  - Service worker-en (`src/pwa/sw.js`) viser varselet med appens ikon, og et trykk henter appen fram.
  - Personvernerklæringen har et eget avsnitt om varsler.
- **Tester:**
  - `pushtest.py`: ingen bryter uten nøkkel, slå på og av, tidene i planen, og at planen legges ut i bakgrunnen og tømmes i appen.
  - `sqltest.py`: bare varseltjenestene, ingen plan uten abonnement, høyst to døgn, at det forfalte tas én gang, og at alt slettes med kontoen.
- **Status:**
  - Med MCP er bit 1, funksjonen og jobben lagt inn.
  - Bit 2 (med DELETE) og nøklene står igjen for Jonas, se `docs/lansering.md`.
  - På iPhone virker varslene bare når appen er lagt på hjemskjermen.

### 5.25i Rorbuer langs kysten (05.10.2026)

Jonas 05.10.2026: «Vi skal lage en blender-modell av en rorbu med kaiplass. Disse skal plasseres rundt om kring langs kysten slik at spillere kan hvile der, eller ligge til kai under uvær. De vil som regel ligge i områder som er litt beskyttet mot bølger og vær.» Og: «Rorbua må være billig. Energi skal kunne lade opp fra 0-100% på 6 timer in-game ved hvile på rorbuer», «Ved hvile forsvinner skipperen fra båten», og om antallet: «Kan sikkert halveres».

- **Modellen** er `tools/harbour/rorbu.py` (rød rorbu på påler med altan, trapp ned til en pålekai med pullerter, stige, fendere og dekk, hane på mønet), i siden som `glb-rorbu` (`src/data/harbour-rorbu.b64`). Rammen er naustets: x langs kaifronten, fronten ved y = 0, y innover. Kledningen er malingssone 1, så spillet maler den oker eller hvit (`RBCOL` og `siteModel('rorbu:o')` i `view3d.js`). Fargen velges av id-en (`R.v`: r, o, w).
- **Plassene** (`src/data/rorbuer.json`, laget av `tools/rorbu/rorbuer.py` fra `national.py` sine lag og stedsnavnene i sjøkartpakkene):
  - **Én ved hvert fiskevær** (kind 0): mottakene som `06b-coastports.js` gjør til havner (samme filter og samme grupper på 1,2 km), 161 stykker.
  - **Le-steder mellom** (kind 1): sjøceller i norsk sjøterritorium inntil land på 200 m, med åpenhet mot havet (`expo`) på høyst 0,3 og vann rundt (minst 8 av 25 celler innen 400 m), minst 14 km fra en annen rorbu, i fast stokket rekkefølge. Det gir 374 (med 10 km var det 696, og Jonas syntes de kunne halveres).
  - **Navnet** er nærmeste tettsted i sjøkartet innen 6 km, ellers øy og så farvann.
- **Fjæra** finnes første gang kartet der er lastet (`rorbuSite` i `core/07d-rorbu.js`, med `shoreSpot` som naustet): ved fiskeværet 150–700 m fra kaia, ellers så nær punktet som mulig, minst 110 m fra en havneenhet og 120 m fra naustet. Kaifronten står 4,4 m ute fra fjærelinja (der banken i `rorbu.py` krysser middelvann). Finnes ingen rett fjære, blir rorbua borte (`R.site = null`).
- **Som sted** er rorbua ikke en havn i `PORTS`. `portById` kjenner den likevel (`RBID`), med `rorbu:true` og uten mottak, diesel, is eller butikk. Båten ligger ved den med `b.status = 'port'` og `b.port = 'rbN'`. `quayFace(id, 'main')` er `rorbuFace` (14 m front), og `berthPose` legger båten der. I havn har knappene bare Hvil, Arbeid og Beholdning. `shopBuy` avviser handel.
- **Rute dit**: et trykk ved rorbua i kartplotteren eller med Autonav gjør den til rutas siste punkt (`rorbuSites` i `03-map.js` og `03b-route.js`). Kartplotteren tegner rorbuene som små røde hus fra regionnivå, og navnet nær. Kaia er en hindring for andre ruter (`11b-obstacles.js`).
- **3D**: rorbuene innen 4 km står i `SITES` (`rorbuNow`, høyst én ny fjære regnes ut per bilde med `rorbuSoon`). Bakken skjæres etter bankens profil (`RBANK`, fra modellens ankere), og kartets hus der tas bort.
- **Snø på egen bakke og tak** (Jonas 05.10.2026: «Ser jo rart ut at det er grønt gress rundt rorbua, så er det snø overalt ellers»): i Blender har gress og lyng fargesone 3, berg over flomålet og taket sone 2 (`rorbu.py`, `naust.py`, `Z`). `siteSnow` i `view3d.js` legger snø på det som vender opp, etter terrengets snøgrense (`snowNow`, samme regel som `recolor`, litt flekkete), og gresstustene blir visne. Modellen lages på nytt når snøgrensen flytter seg (20 m av gangen). Gjelder også fars naust.
- **Fortøy** (Jonas 05.10.2026: «Det må også være mulig å fortøye i kaia»): ligger båten stille innen 400 m fra en kai, en rorbu eller naustet, står «Fortøy» i skuffen (`moorNear` i `core/16-helm.js`, `moorGo` i `ui/10c-dock.js`). Den finner veien inn som Autonav og legger til. Uten blåse i nærheten tar den plassen til den grå «Ta opp». Med manuell styring heter knappen «Fortøy ved rorbua i …» eller «Fortøy i …», og den virker også ved rorbuer og naustet.
- **Hvilen** står i 5.19. Den koster 150 kr natta, betalt når du går inn og så for hvert døgn. Har du ikke råd til neste natt, går du om bord.
- **Tester**: `tests/rorbutest.py` (plassene, fjæra ved Gryllefjord og på et le-sted, Autonav dit, knappene, natt og hvile på 6 timer, neste natt, åpen båt ved mottakskai, kartplotteren, lagring) og `coast3d.py` (rorbua i 3D ved Gryllefjord, `coast_rorbu.png`).
- **Ikke gjort ennå:** kameraet kan gå inn i huset, og lykta ved døra lyser ikke.

### 5.25j Tilbakemelding: appen for spillernes tilbakemeldinger (05.10.2026)

Jonas 05.10.2026: «Lag en feedback-app i telefonen hvor brukerne kan komme med tilbakemeldinger, gjerne sortert etter hva tilbakemeldingen gjelder. La dem også laste opp bilde. På denne måten kan vi samle inn masse viktig data».

- **Appen** (`ui/06e-feedback.js`, `FEEDBACK`, appen `tilbake` på telefonen):
  - Emne (`TOPICS`): Feil, Knapper og skjerm, Grafikk og fart, Fiske og fangst, Penger og priser, Båter og utstyr, Kart, vær og verden, Første tur, Idé eller ønske, Annet.
  - Tekst (høyst 4000 tegn, minst 3), hvor fornøyd spilleren er (1–5 stjerner, valgfritt) og ett bilde (valgfritt).
  - **Bildet:** fra galleriet eller kameraet (`<input type=file accept=image/*>`), eller «Bilde av spillet»: telefonen går bort et øyeblikk, og `G3.snap()` (`view3d.js`) tar det neste 3D-bildet i samme bilde som det tegnes (uten knappene). Begge gjøres mindre i nettleseren: høyst 1600 px på den lengste siden, JPEG under 540 000 tegn (rundt 400 kB).
  - **Med følger** (`FEEDBACK.meta`): `cloudMeta()` (versjon, nettleser, plattform, app, grafikkvalg, båt, penger, flåte, spilldager, økt) og skjermen, 3D eller kart, kvalitetsnivå og bildetakt, båtens status, havn og posisjon (lat/lon med tre desimaler), spilltid, veiledningssteg og energi. Appen sier hva som sendes.
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

### 5.25k Butikken: haill, trim og verftet for ekte penger (05.10.2026)

Jonas: «hele spillet skal være free-to-play, men med betalte boostere i form av haill-appen og trim-appen og betaling for å hoppe over verkstedtid». Først «Ja til Managed Payments», så «Nei til managed payments. Vi kan eventuelt aktivere dette når vi går internasjonalt». Om samtykket: «Gjør dette på en intuitiv måte som tar fokuset bort fra handlingen, vi må tenke salg salg salg», «gjør det nesten usynlig».

- **Varene** (`products` i databasen, `supabase/migrations/20261006040000_shop.sql`):

  | id | Vare | Pris |
  |---|---|---|
  | `haill`, `luksus` | Haill, luksushaill | 29 kr, 59 kr |
  | `trim_pump`, `trim_ic`, `trim_turbo` | Trim +50 % / +75 % / dobbel fart | 29 kr, 39 kr, 49 kr |
  | `verft_na` | Verftet ferdig nå | 19 kr |

  Prisen som trekkes, står i databasen. Spillet viser sine egne (`HAILL`, `BOOSTS`, `YARD_NOW_NOK`), så de må stemme overens.
- **Kjøpet** (`ui/10i-shop.js`):
  1. Kjøpsknappen går rett til betalingen, uten noe vindu imellom (`payBuy`, `shopGo`, ikke `shopBuy`, som er butikken på kaia).
  2. Edge Function `shop-checkout` henter varen med spillerens egen innlogging (`shop_quote`), lager en Stripe Checkout-side i NOK med prisen inkludert MVA og skatteklassen `txcd_10201001`, og skriver kjøpet som åpent (`purchases`, med båten i `data`).
  3. Stripe sender spilleren tilbake med `?kjop=<økt>`.
- **Bokføringen** (Edge Function `stripe-webhook`, signaturen sjekkes først):
  - Betalt: `shop_paid` bokfører kjøpet og lager én `grants`-rad per kjøp, uansett hvor mange ganger Stripe sier fra.
  - Utløpt eller feilet: `shop_ended`.
  - Refundert i sin helhet: `shop_refund` tar tilbake en vare spillet ikke har gitt ennå.
- **Leveringen:** spillet spør `shop_pending` ved start, når det kommer tilbake fra Stripe (flere ganger de første 45 sekundene) og når det blir synlig igjen. Det gir varen (`shopGive`: haill i beholdningen, trim på båten kjøpet gjaldt, eller verftet ferdig på den båten), husker id-ene i `S.shopGiven`, så ingenting gis to ganger, og sier fra med `shop_done`.
- **Hvem som får kjøpe** (`shopMode`):
  - `live`: innlogget, og Stripe er satt opp (`GET shop-checkout` gir `ready`).
  - `test`: uten skyen (artifacten og testene), og for admin før Stripe er satt opp. Varen gis med én gang, uten betaling.
  - `off`: «Snart i salg». Ingen får noe gratis på detstorebla.no.
  - Den gratis luksushaillen i «Første tur» går utenom butikken som før.
- **Angreretten:** en liten, dempet linje under hver kjøpsknapp (`shopFine`, `.shop-fine`) og den samme setningen ved betalingsknappen hos Stripe (`custom_text`): varen leveres med én gang, og angreretten faller da bort (angrerettloven § 22 bokstav n). Linja må være lesbar for at samtykket skal gjelde.
- **Brytere** (hemmeligheter i Supabase): `STRIPE_SECRET_KEY` og `STRIPE_WEBHOOK_SECRET`. `STRIPE_MANAGED=1` gjør Stripe til selger (Managed Payments), og er av. `STRIPE_TAX=1` lar Stripe Tax legge på MVA når foretaket er MVA-registrert.
- **Tester:** `tests/kjoptest.py` (spillet med stand-ins for Stripe og Supabase) og `tests/sqltest.py` (databasen).

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

### 5.29b Handelssteder (regel, 07.10.2026)

- Tre steder handler man: utstyrsbutikken, fiskemottaket og verftet. Fars naust og rorbuene selger ingenting. Hele regelen, den vedtatte første turen og det som mangler (verftsmodellen, plassering av butikker og verft langs kysten), står i `docs/handelssteder.md`. Dagens spill har fortsatt alt på kaia i hver havn, også fra naustet.

### 5.30 Rettelser etter tilbakemeldingene #34–#42 (07.10.2026)

- **#42 Skipperen og mannskapet på sløying:** `deckActivity` i `view3d.js` gir nå `me` og `crew` hver for seg. Står begge på «Sløying» eller «Ising» i `workAssign`, står skipperen ved bordet og en av mannskapet ved bløggekaret (`drawDeck`), og skipperen forlater rattet. Før ble han stående ved rattet.
- **#34 Båten ved rorbua:** en båt fortøyd ved en rorbu før kysten var funnet (`rorbuSite`) ble satt ved kandidatpunktet, ved mottakets kai, mens 3D tegnet den ved rorbua. `dock` finner nå kaia først, og `rorbuSite` flytter en båt som alt ligger der (også i en gammel lagring). Gjaldt alle rorbuer. Test: `rorbutest.py` 7b.
- **#39 Første tur fra naustet:** (1) Autonav fra fars naust i Øksfjord fant ingen vei: naustet ligger i en vik 100 m-rutenettet ser som lukket mot sjøen. `leiaTo` prøver da på nytt med havnas innseilingsvei (`approachPath`). Test: `naustleia.py`. (2) Konvoluttens klaff lå med tuppen mot lommen og svingte lukket igjen mens konvolutten falt (`.lt-flap-ii`, `08b-letter.js`). (3) **Åpent:** butikken kan brukes fra naustet. Jonas mener det ikke skal gå an. Å stenge den betyr at båten må legges til kai i havna før man handler, og et nytt steg i første tur. Ikke endret.
- **#38 COG og XTE** er fjernet fra plotterlinja, instrumentpanelet og 3D-skjermen. COG var lik HDG, og XTE var alltid null.
- **#40 Bro-visningen:** å dra ned ser nå ned (`cam.hp` minus dra), som å dra til høyre ser til høyre.
- **#37 Rutepanelet på mobil** (under 700 px): panel nederst, over hele bredden og høyst 42 % av høyden, med veipunktene i to kolonner (`body.vplot #side` i `styles.css`).
- **#41 Ekkoloddet:** `HEAT.sp` har alle artene, og `heatSample` gir en verdi per art (`HEATI`: 0–2 og 4 som før, 5–9 for lyr, lange, brosme, uer og kveite; 3 er fortsatt summen av de andre). Knappen på kartet og innstillingene går gjennom dem. Test: `heatpick.py`.
- **#36 Fiskekarene** (`partTubs`, `vessel3d.js`): et kar som ville stått utenfor skroget (snekka akterut) trekkes inn, og flyttes mot midten når det ikke er plass til to. Andre båter er uendret.

### 5.31 De andres redskap i havet (tilbakemelding #35, 07.10.2026)

- **Hva:** garn, liner og teiner som andre spillere har stående, vises uten eier: grå streker med bøyer i kartplotteren (`gearSvg`, `10-gear-ui.js`) og bøyene i 3D (`drawGearSea`). Det er bare visning: de kan ikke trykkes på, og de stopper ikke setting eller ruter.
- **Server** (`supabase/migrations/20261007200000_gear.sql`): tabellen `gear_sets` (spiller, id, slag og de to bøyene), uten policy. `gear_put(sets)` skriver over spillerens egne (høyst 60), `gear_near(x, y, r)` gir de andres innenfor r km (høyst 60) som `[slag, x1, y1, x2, y2]`, nærmest først, høyst 300, uten gjester og uten noe om eieren (ingen id, ingen navn). Sett som ikke er fornyet på 14 døgn, hoppes over.
- **Klient** (`gearSync` i `10h-world.js`, kalt fra `worldTick` hvert 15. sekund): egne sett går opp når de endrer seg og hvert 5. minutt, de andres hentes én gang i minuttet eller når båten har gått 5 km. `PEERGEAR` (`05-vessels.js`) er listen. En database uten funksjonene (404) lar spillet være i fred.
- **Å gjøre:** migrasjonen må kjøres (Supabase-MCP-en ble avbrutt da den skulle legges inn). Til da vises ingenting av de andres redskap.
- **Test:** `peergear.py` (en etterligning av databasen står i stedet for den).

### 5.28 Regelmotoren langs hele kysten (R2 av regelplanen, 05.10.2026)

- **Blåkveite (07.10.2026):** for line og garn (eller arten) nord for 62° N på 400 m og dypere: `bk5o` (åpent, med perioden og maksimalkvoten), `bk5c` (stengt: bare bifangst, 7 %), `bkB` (uten blad B), `bk7` (28 m og over: bare bifangst). Dypere enn 1000 m blokkeres bunnredskap (`bk1000`: «nye fiskeområder» krever egen tillatelse etter forskrift om bunnredskap). Minstemål 45 cm i `ruMinSize`. Regler-appen har arten som eget valg.

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
- **§ 47:** minstemål etter sted for torsk, hyse, sei, kveite og uer. Taskekrabben er ute av spillet fra 04.10.2026.
- **Kongekrabbe** (J-136-2026 og J-138-2026 fra Fiskeridirektoratet, § 2 er lik i begge; `kcQuota` og regelene `kc2`, `kc10` og `kc5`):
  - **Kvoteområdet** ligger øst for linja ved 26° Ø, med hele Porsangerfjorden, Kamøyfjorden og Magerøysundet sørøst for linja. Bare båter registrert i Finnmark, med eier bosatt der i minst to år, kan fiske der. Spilleren er fra Senja, så svaret er «Nei».
    - `kcQuota(ll)` er en tilnærming til linjene i lat/lon: øst for 26° Ø opp til 71°30′ N, og vest for 26° Ø havet sør for Magerøya (øst for 25°32′ Ø sør for 71,02° N, øst for 24°51′ Ø sør for 70,93° N). Det er ikke de nøyaktige punktene i § 2.
  - **Fritt fiske vest for linja** (J-138 § 5): ingen kvote og intet minstemål, men all kongekrabbe som fanges, skal landes (det er forbudt å sette den ut igjen), og teinene skal være uten fluktåpning.
  - **Stengt 1.–9. november 2026** i boksen 71°09′–71°14′ N, 25°20′–26° Ø (J-138 § 10).
  - Om det finnes et tak på antall teiner i fritt område, er ikke sjekket.

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

### 5.29b Varsel før feil (R4 av regelplanen, 05.10.2026)

Jonas: «Ja, kjør på». Spillet sier fra før du gjør feil, ikke bare etterpå.

- **Ruta:** et punkt med fisketid, eller med redskap som skal settes, der reglene stopper båten, får en rød linje med grunnen (`ruWpMsg`, holdt per punkt, båt og dag i `RU_WP`).
  - Fisketid spør om juksa, slik båten fisker på fiskeøktene. Redskap spør om det redskapet.
  - Første gang du gir et slikt punkt fisketid eller redskap, kommer grunnen også som en melding på skjermen.
- **«Kast loss»** med et slikt punkt på ruta spør først: «Reglene stopper båten på ruta», med punktene og grunnene. «Endre ruta» lukker, og «Kast loss likevel» kaster loss. Der venter båten uten å fiske, som før. Ikke i «Første tur».
- **Autonav:** et trykk der reglene stopper båten fra å fiske med redskapet hun er rigget med, går til nærmeste sted innen 3 km der hun kan (`ruOpenNear`: ringer ut fra stedet, 16 retninger, ikke på land). Meldingen sier hvorfor og hvor langt. Trykker du samme sted igjen innen ett minutt, går Autonav helt dit (`LEIA_RU`). Finnes det ikke noe sted innen 3 km, går ruta dit du trykket, med beskjed om at du kan seile dit, men ikke fiske der.
  - Havner og naustet spørres ikke. Autonav til en blåse for å trekke (`leiaTo(p, true)`) spør heller ikke.
- **Kaia før «Lever»:** sier hvor mye som blir inndratt hvis du leverer nå, verdien, og hvorfor: ingen adgang (10 % bifangst), ingen torskekvote igjen, eller maksimalkvoten for hyse eller sei fisket i lukket gruppe (`landWarn` i `07-guide.js`).
  - Utregningen er skilt ut av `sell` i `landConf` (`08-actions.js`), så kaia og sluttseddelen regner likt. `landConf` endrer ikke kvotetallene.
- **Tips første gang:** første gang en regel med ✕ eller ! gjelder båten på sjøen, kommer en melding i telefonen fra «Regler» med hele teksten og kilden, og en kort beskjed på skjermen (`ruTips`, hvert femte sekund sammen med lagringen). Hver regel én gang (`S.ruSeen`), ett tips om gangen. Ikke i «Første tur».
- **Test:** `r4test` (16 m båt i Malangen: punktet i ruta, spørsmålet ved «Kast loss», Autonav til nærmeste lovlige sted og helt dit ved andre trykk, kaia før levering og sluttseddelen etter, og tipsene).

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
  - Mottakene publiserer ingen tider (søkt 04.10.2026: mottaket i Senjahopen oppgir telefon, og Råfisklaget lister mottakene uten tider). Derfor typiske tider: hverdager 06–18, lørdag 08–14, stengt søndag, og 05–22 hver dag i skreisesongen (januar–april).
  - Første tur venter aldri.
  - «Lever» viser når mottaket åpner. Knappen «Vent til åpning» er fjernet (Jonas 05.10.2026: alle spillerne går på samme klokke og dato, så ingenting kan spole tiden fram). Bare `catchUp` kjører simuleringen fram, til den felles klokka etter at spillet har vært lukket.
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
  - **Trim-appen** (`BOOSTS`, `S.boat.trim` = {k, t0}, `trimOn`, `trimLeft`, bare diesel og ikke påhengsmotor). Fra 05.10.2026 er trim fart for en tid, kjøpt for ekte penger (Jonas: «Trim er tidsbegrenset oppgradering av farten»), og tida er spilltid:

    | Trim | Fart | Varer | Pris |
    |---|---|---|---|
    | Justert dieselpumpe | +50 % | 24 t | 29 kr |
    | Ladeluftkjøling | +75 % | 48 t | 39 kr |
    | Økt turbotrykk | +100 % | 72 t | 49 kr (Jonas 05.10.2026) |

    - Farten gjelder toppfart og marsjfart, og akselerasjonen øker like mye (`applyVessel`). Hestekreftene vises som før.
    - Én trim om gangen på en båt. En ny tar plassen til den som er på. Når tida er ute, går farten tilbake og loggen sier fra (`vesselStep`).
    - Dieselen følger farten (`fuelLph`), så mer fart bruker mer diesel. Det står i appen.
    - Den gamle trimmen var varig og gratis i testen. Den tas bort ved lasting (`11-boot.js`).
    - Kjøpet er i testmodus som haillen til butikken med Stripe er på plass.
  - **Ferdig nå på verftet** (`YARD_NOW_NOK` = 19 kr, Jonas 05.10.2026): alle verftsjobbene båten har gående (`YARD_KINDS`), gjøres ferdig med én gang. Knappen står over arbeidskøen i Verksted, i testmodus til butikken er på plass. «Overtid, halv tid» for spillpenger finnes fortsatt.
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
  - **Egen sei** kan tas fra lasten i havn før levering (`baitFromHold`), og den teller på kvoten (`quotaState().sei`). Kongekrabbe er for dyr til agn (`BAIT_OWN = ['sei']`). Agnslaget «Krabbe» er strandkrabbe som kjøpes.
    - **Antakelse, ikke bekreftet:** fangst til eget bruk skal føres på landingsseddelen etter landingsforskriften. Lovdata var sperret fra arbeidsmiljøet 04.10.2026, og søk ga ikke noe klart svar.
  - Makrell finnes ikke som art i spillet ennå, så den kan bare kjøpes.
- **Inn til kai og ut igjen** (`berthPath`, `berthBlocked`, `berthClear` i `07-harbours.js`):
  - Et punkt er sperret når det er land i 25 m-masken eller ligger innenfor halv bredde av en bryggeboks (`PIERBOX`) eller en havneenhets kaiblokk.
  - **Banen går** fra båten til et punkt 1,5 båtlengder akter for kaiplassen og en bredde ut fra kaia, og så langs kaia inn. Er det fritt, går den rett. Ellers søker den over maskens celler innenfor 1,5 km og strammer linja.
  - **3D:** under en rute er banen ut fra kaia og inn til kaia en del av linja båten følger (`trkStep`, se «3D-båten på ruta»). Uten rute følger `moorStep` banen, glattet med `pathM`/`pathAt`.
  - **Test:** `harbourtest` sjekker banen inn til hver kaiplass for tre båttyper, fra havnepunktet og fra innseilingen.
- **Fiskeslagene fra Blender** (`tools/fish/fisk.py`, `src/data/fish.b64`, 612 KB):
  - **Artene:** torsk, sei, hyse, lyr, lange, brosme, uer, kveite, blåkveite og kongekrabbe (delen heter fortsatt `krabbe`), hver som én del i GLB-en.
  - **Fiskene** er 1 m lange, med hodet mot −z, ryggen opp og høyre side mot +x. Spillet skalerer dem etter vekta. Krabben er 1 m over beina.
  - **Kjennetegnene** er tatt med slik de ses på dekk:
    - torsk: skjeggtråd, overkjeve over underkjeve, flekker og lys sidelinje
    - sei: underkjeven lengst, rett lys sidelinje, kløyvd stjert
    - hyse: svart sidelinje og svart flekk over brystfinnen, høy første ryggfinne
    - lyr: mørk sidelinje som buer høyt over brystfinnen
    - lange og brosme: lange kropper og lange finner. Brosmen har mørkt bånd og hvit kant på finnene.
    - uer: rød, med piggete ryggfinne og store øyne
    - kveite: flatfisk med begge øynene på høyre side, mørk oppe og hvit under
    - blåkveite (07.10.2026): flatfisk som kveita, men mørk grå-brun på begge sider, og det venstre øyet sitter på ryggkanten (`eye2`), fordi den svømmer mer opprett
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
    4. Den sleper deg i 6 knop til nærmeste verft (`nearestYard`; fra 08.10.2026, Jonas: skroget skal repareres etterpå, og et slep til et mottak lot en spiller i åpen båt bli stående uten hvile, #48). Finnes ikke noe verft, til nærmeste havn.
  - **Veiene** finnes med `leiaRoute` mens mannskapet mønstrer. Finnes ingen vei, går den rett. En båt på grunn dras først ut til nærmeste vann (`towSea`).
  - **Pris og fangst:** prisen trekkes ved anropet. Fangsten beholdes ved slep og går tapt ved nødanrop, som før.
  - **I spillet:** statusen viser hva som skjer: venter på redningsskøyta, den er på vei, slepet settes, eller under slep i 6 kn. «Spol fram til havn» er fjernet (05.10.2026, én klokke for alle), så slepet tar den tiden det tar. Redning-appen viser slepet i stedet for knappene.
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
- **Teinene i 3D** (`drawPots`, `drawCrabTank`, `potDeck` i `view3d.js`; `tools/gear/teine.py`, `src/data/gear-pot.b64`, fra 04.10.2026, brukerens ønske: «Lager du blender-modeller av teiner og kongekrabbe? Og animasjoner for haling av teiner»):
  - **Modellene fra Blender:**
    - kongekrabbeteina: stålramme 1,4 × 1,4 × 0,65 m, notlin, en trakt inn i hver av to motsatte sider, agnboks i midten og luke i toppen (`teinedor`, med hengsel)
    - teinehaleren på davitt: en stolpe ved rekka med en bøyd arm ut over siden og en blokk 2,1 m over dekk og 0,9 m utenfor stolpen, med hydraulisk V-skive som går rundt (`davitskive`)
    - krabbekaret: et blått kar på 1,2 × 0,8 × 0,7 m med sjøvann og slange fra dekkspumpa
    - Målene og fargene har jeg valgt selv. Det finnes ingen tegninger.
  - **Haling** (én teine i den tida arbeidet tar, `gopUnitMin`, så den målte tida mellom teinene; syklusen starter på nytt når simuleringen teller en teine):
    1. Teina kommer opp fra bunnen på tauet og ut av sjøen til blokka, med hanefoten fra hjørnene.
    2. Den svinges inn over rekka og settes på dekk ved haleren.
    3. Luka åpnes, og krabbene, så mange som settet har per teine, går én og én til krabbekaret (uten kar ned i lasten).
    4. Agnboksen fylles, luka lukkes, og teina løftes bort i stabelen akter.
  - **Setting:** teina tas fra toppen av stabelen, vippes ut over rekka og synker, og driver akterut mens båten går fram. Tauet følger med fra rekka.
  - **Uten teinehaler** (skiffen og små båter) går tauet over rekka, og den gamle trommelen står der som før.
  - **Små teiner** tegnes i 0,75 av størrelsen.
  - **Dekket:** når båten er rigget for teiner, er blødekaret og sløyebordet tatt bort, så sant det ikke er fisk som venter på sløying. Krabbekaret står på babord side med krabbene fra lasten i seg.
  - **Test:** `geartest` tar bildet `gear3d.png` mens teinene settes. Ellers er det sjekket med skjermbilder.
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

### 5.32 De tre handelsstedene (Jonas 07.10.2026)

Regelen står i `docs/handelssteder.md`. Spillet har tre steder man handler: **fiskemottaket** (levere fisk, kjøpe is, agn og diesel), **utstyrsbutikken** (redskap, haler, juksamaskin, elektronikk, klær) og **verftet** (båter, motor og lasterom, antigro, vedlikehold, maling, diesel). Fars naust og rorbuene selger ingenting.

- **Stedene** (`core/06c-steder.js`, `src/data/steder.json`, `tools/steder/steder.py`): butikker og verft er egne havner med egen kai, havneenhet og navn av byen (aldri et firma): «Egersund verft», «Avaldsnes utstyrsbutikk». De lages som kystmottakene (`COASTQ`, `UNITS` med utseendene `s` og `y`, `PORTS` med `sted:'butikk'|'verft'`, `coastal`). Data: Overture Maps places (punkter, ingen navn, adresser eller telefon) lagt på nærmeste kai i vec-pakkene (minst 25 m, 3 m vann, innen 1,2 km, minst 130 m fra andre kaier), og oppdiktede steder der et mottak er langt fra et verft (50 km) eller en butikk (28 km). Nå 103 butikker og 157 verft, 206 av dem ekte punkter. Det lengste fra et mottak til nærmeste verft er 34 nm og til butikk 25 nm (indre Finnmark). Finnsnes har butikken og båthallen i ett (`sted:'butikk verft'`). `python3 tools/steder/steder.py` lager filen på nytt (trenger vec-pakkene fra `tools/map/game.py` og nett).
- **Hva et sted tilbyr** (`portServices(pt, berth)`): `{mottak, butikk, verft, bunker}`; ved naustet (berth `naust`) og rorbuer tom. `placesNear(p, kind, n)` gir de nærmeste.
- **Knappene** (`ui/10c-dock.js`): Mottak (Lever, Is, Agn, Bunkring), Butikk (Fiskeutstyr, Elektronikk og haler) og Verft (Båthandel, Oppgrader, Vedlikehold, Malerverksted, Bunkring) vises bare der stedet har dem, og Bygd finnes alle steder. Siden `utstyr` ble delt i verftets (lasterom, motor, antigro, påhengsmotor) og butikkens (`utstyrb`: resten av utstyret og klærne).
- **Kjøp bare der det hører til:** `shopBuy` (håndjuksa og kveiteutstyr bare i butikken, is bare på mottaket), `buyGear` (redskap i butikken, agn på mottaket) og telefonsidene (`atKind` i `ui/05-phone.js`). Siden sier hvor hun finner det, med nærmeste sted og «Autonav dit» (`nearHint`, handlingen `goplace`), også i Salgslaget.
- **3D:** stedene bruker harbour-unit-utseendene `s` og `y` (`harbour-unit-s/y.b64`); til de er laget tegnes mottaksutseendet `a`. Stedene er ikke mottak (`U.sted`), så kran, truck og folk legges ikke ut der.
- **Tester:** `stedertest.py` (stedene, tjenestene, knappene, kjøp og nærmeste), `docktest.py`, `shoptest.py` og `icestep.py`.

### 5.33 Fiskeguiden (Jonas 08.10.2026)

Appen **Fiskeguide** på telefonen (`ui/06f-fishguide.js`, `GUIDE`) svarer på «hvor og når skal jeg lete etter hver art» på noen sekunder. Alt leses fra fiskemodellen, så guiden aldri kan si noe annet enn havet gjør: `SPECIES` (`av` per måned og `skrei` for torsk, `dep` og `prod` for dyp og åpen kyst, `minKg`, `maxKg`, `pm` for pris), `SELQ` (hva redskapet beholder), `BAITS`/`baitF` (agn), reglenes datoer (kveite fredet 20. des–20. april, uer bare juni–august: `kveiteClosed` og `uerOpen` i `03-simulation.js`), og de to artene havet forteller per sted: blåkveite (`eggaArea`, lite sør for 62° N) og kongekrabbe (`kingArea`). Rene tekster for stedene (`WHERE`) er skrevet etter kommentarene og reglene i modellen.

- **Måned:** tolv måneds-knapper (nåværende har en prikk), «Mest å hente» (de tre beste, rangert etter `k × base × tilgang`), og alle ti arter med linje (måneden mot artens beste), dybdeintervall og kort sted. Stengte arter står sist og blekt. Merker: **Skrei**, **Fredet**, **Åpner 21. april**, **Fredet fra 20. des**, **Bare bifangst**, **Lite der du er** (blåkveite sør for 62° N, kongekrabbe der `kingArea` er under 0,1).
- **Hele året:** ti arter × tolv måneder. Stripet er fredet, innrammet er den valgte måneden. En bokstav i toppraden åpner den måneden i månedsvisningen.
- **Artskort:** søyler for alle måneder (skreien som egen blå del for torsk, trykk for å se måneden), Best og Bra som månedsområder, Hvor (dyp, sted, åpen kyst, kanter), Hvordan (redskap med ●●● etter `SELQ`, agn som gir mer enn 10 %), Pris (valgt måned, best og lavest betalt), Regler (minstemål, største lovlige, kveitas fredning) og en knapp til Regler-appen.
- Valgt måned og kort huskes i `GUIDE.st` (ikke i lagringen). Sesong-appen har en knapp hit under sin egen kalender.
- Test: `tests/guidetest.py` (månedene, stengt og skrei, årsvisningen, kortene for torsk, blåkveite, kongekrabbe og kveite, «Lite der du er» sør og nord, engelsk).
- Ikke bygget: regionsvise tall for torsk, hyse og sei (modellen har ikke egne regioner for dem, bare dybde, åpen kyst og kanter), og «anbefalt felt der du er» (varmekartet og ekkoloddet viser hvor fisken står akkurat nå).

### 5.34 Verftet og utstyrsbutikken som havneenheter (Jonas 08.10.2026)

`tools/harbour/steder.py s|y` lager `harbour-unit-s` (butikken: toetasjes butikk fra Finnsnes-modellen, uten is og drivstoff, på plantenes kai) og `harbour-unit-y` (verftet). Verftet står på en **stor enhet** (`UNIT_Y` i `01-world.js`, `ugeo(U)`, `U.y`): kai på 120 m, dekk 34 m, basseng mudret til 13 m (ca. 11,5 m ved lavvann), hovedliggeplass x = -20 (90 m), bunkersliggeplass x = 30. Alt som før leste `UNIT.*` leser nå `ugeo(U)` (kjerne, 3D-terreng, 2D-kart). Det gjør at den største båten, den pelagiske tråleren (75 m, 15,5 m bred, 7,5 m dypgang), får plass og vann under kjølen. `BEAM` har nå også havbåtene, så de ligger en bredde ut fra kaia.

Modellen har hall (40 × 20 m, port mot kaia, skiltet VERFT · BÅTSALG), tilhenger- og blokkbåt, tønner og tømmer, dieselstasjonen (som plantens, så bunkringen er den samme) og skipsløftet: 14 vinsjhus langs kanten med trinse over kaifronten, og fire plattformer (14 × 6,4, 26 × 9,6, 56 × 14 og 90 × 21 m) med kjølblokker, og en kabel (`yard_cable`). Spillet (`liftStep`, `drawYardLift` i `view3d.js`) velger minste plattform som rommer båten (lengde + 3 m, bredde + 1,2 m) og skalerer den litt. Ved jobb av typen `hull` eller `repair` (slippen) stiger plattformen under kjølen (40 s), løfter båten til kaidekket, og senker den når jobben er ferdig. Båten ligger stille (ingen sjø, ingen fortøyningstau) mens den står oppe. Test: `tests/yardtest.py` (3D) og `stedertest.py` (geometri og dybde).

Ikke gjort: animert mannskap og kran ved løftet, lyd, og at stedene i `steder.json` er valgt for en 120 m enhet (de er valgt for 55 m; samsvar med nabohavner sjekkes ikke).

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
| Kongekrabbe | Fiskeridirektoratet J-136-2026 og J-138-2026; Råfisklagets minstepriser fra 5.10.2026 og prisstatistikk; Havforskningsinstituttets tokt 2023–2026 | Kvoteområde øst for 26° Ø for Finnmark. Fritt fiske vest for linja uten kvote og minstemål, alt skal landes. Stengt 1.–9.11 ved Nordkapp. Minstepris for levende krabbe per klasse, død krabbe 0 kr. Nesten ingen i Troms, mest vest for Nordkapp og i kvoteområdet |
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


### 5.35 Plassering, ikoner, mottaksnavn og rutelistens tab (08.10.2026)

- **Plassering** (regelen står i `docs/handelssteder.md`, «Plassering av stedene»): `tools/steder/steder.py` og `tools/rorbu/rorbuer.py` lager `steder.json` og `rorbuer.json` på nytt. Ingen to steder (mottak, butikk, verft, rorbu, fars naust) nærmere enn 1,5 km, unntatt landsbyer uten andre kaier (0,6 km, aldri under 0,5). Kaia velges etter ly (eksponering fra `national.expo`) og gangavstand. Ekte verft kan flytte seg inntil 2 km til en bedre kai, verft tynnes ut (5 km mellom), og det legges inn oppdiktede verft der et mottak er mer enn 34 km (rundt 20 nm) fra nærmeste. Én utstyrsbutikk per poststed (ekte før oppdiktet, ingen i Finnsnes, der butikken står på kaia). Rorbuene ved mottakene står 1,5–4 km fra mottaket, i det mest skjermede (eksponering høyst 0,3) skjæret. `07d-rorbu.js` finner rett strand nær punktet. Kjente hull: 5 av 202 mottak ligger 37–44 km fra nærmeste verft, og 27 er over 37 km fra nærmeste butikk (størst 65 km: Båtsfjord, Røst, Kiberg), fordi kartpakkene ikke har noen ledig kai i de landsbyene. `tests/placetest.py` måler det.
- **Mottaksnavn:** `portLabel(p)` (`01-world.js`) gir «Stedet fiskemottak», «Stedet mottak» eller «Stedet fiskebruk» (utseende b = det gamle bruket), alltid det samme for samme mottak. Kartplotteren viser dem; teksten ellers sier fortsatt stedet.
- **Kartikoner** (`portIcon` i `03-map.js`, `portKind` i `01-world.js`): mottak en fisk i blå ring, utstyrsbutikk en krok i oransje firkant, verft et skrog på løft i grønn ring, fars naust et lite hus, ellers den gamle ruten.
- **Mannskapets dialekt og tekst over hodet** (08.10.2026, tilbakemelding #44): linjene er skrevet på nordnorsk. `crewDialect` (`14-crewlife.js`) bytter ord etter hvor mannskapet kommer fra (`homePort`, ellers spillerens hjemhavn): nord for 65° N som de står, så trøndersk, møring, vestlandsk og sørlandsk (`DIALECTS`). I 3D står linja som en boble over hodet på den som sier den i ti sekunder (`say3d` i `view3d.js`, `.say3d` i `styles.css`, kalt fra `hooks.onSay`); uten 3D er det en melding som før. `tests/saytest.py`.
- **Dybdelinjer og dybdetall** (08.10.2026, tilbakemelding #43): `chartRaster` (`03-map.js`) tegner dybdelinjer for hele kysten fra dybderasteret, i et eget gjennomløp etter at flisa er malt: Senjas nivåer (5 … 800) og 1000 m, færre jo lenger ut utsnittet er (200/500/1000 øverst). Utenfor kystflisene brukes havbunnslaget (`offDepth`, Terrarium, til 2500 m), ikke modellen. Linjer tegnes ikke der de to kildene møtes eller der lagret dybde har et trinn brattere enn en havbunn kan ha (10 piksler på tvers). `soundingsSvg` skriver dybdetall (hele meter, ett desimal under 10) i et rutenett som ligger fast når kartet dras, ca. hver 150. piksel. De gamle vektorlinjene (`.depc`) skjules i kartplotteren.
- **Knappene på kartet:** like store (48 px) og firkantige: start/pause, slett ruta (`#rClear`, tømmer det lagde utkastet), angre, gjør om og navigasjonspilen (`#zboat`). Zoomknappene er fjernet.
- **Rutelistens tab** (`#sideTab` i `08-actions.js`, CSS sist i `styles.css`): i kartplotteren skyver tab-en (ÅPNE/LUKK) rutelisten ut til høyre (liggende, `body.sidehide`, kartet blir like bredt som skjermen) eller ned (stående, `body.drawer`). Rute-knappen i toppen er skjult stående. `tests/sidetab.py`.

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

Mottakene ligger der Jonas har funnet dem i Råfisklagets leveranseoversikt: Husøy, Senjahopen, Botnhamn, Gryllefjord, Sommarøy, Brensholmen, Torsken og Frovåg. Finnsnes har ikke mottak eller is i virkeligheten, bare bøteri og forhandler av fiskeutstyr og båter. Bunkerskai: Husøy, Senjahopen, Gryllefjord, Botnhamn og Torsken, fra Jonas' satellittbilder. Finnsnes beholder drivstoff inntil videre (se åpne spørsmål).

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
  - `S.cstk` er et eget bestandslag for krabbe (kongekrabbe fra 04.10.2026).
- **Riggen** (`b.rig`, `RIGS` i `10-gear.js`, fra 01.10.2026, brukerens valg): Båten er rigget for én type fiske om gangen.

  | Rigg | Krever |
  |---|---|
  | `juksa` | ingenting (håndjuksa eller juksamaskin) |
  | `line` | linehaler eller elektrisk haler |
  | `garn` | garnhaler |
  | `teiner` | teinehaler eller elektrisk haler |

  - Første montering av en haler er en verftsjobb under Oppgrader. Når utstyret er om bord, byttes riggen gratis og med en gang om bord, i fanen «Rigg» under Beholdning (`rigBlock`, `rigSet`; Jonas 07.10.2026, før lå den under Verft og krevde kai). Det kan gjøres hvor som helst, så lenge ingen av egne garn, liner eller teiner står i sjøen.
  - Riggen styrer `gearRules` (feil rigg gir «Rigg om på verftet»), `setChoices`, valgene i ruta, driftsplanens stasjoner og knappene. «Jukse» er av uten juksarigg, og «Sett ut» er av med juksarigg.
  - Med passiv rigg gir fisketimer i ruta og etter setting ingen juksefangst. Båten venter («Venter, går …»).
  - Trekking sjekkes ikke mot riggen, slik at gamle lagringer med blandet redskap i sjøen kan trekkes.
  - Gamle lagringer får riggen fra redskapet i sjøen eller fra driftsplanen, ellers juksa (`rigGuess`).
  - En skiff kan rigge line og teiner med elektrisk haler, men ikke garn, fordi garnhaleren bare passer snekke og større.
- **Arbeidet på sjøen:** Setting og trekking er `b.gop` under status `fishing`, så sløying, hvileregler, automatisk retur og pausen når bløggekaret er fullt virker som før. Båten går langs strengen mens den setter eller trekker.
  - Setting tar ca. 0,8 min per garn, 5 min per stamp og 0,9 min per teine.
  - **Fangsten kommer om bord i deler** (tilbakemelding #30, 07.10.2026): `haulUnit` flytter ikke en hel enhets fangst på én gang, men en del av den (`HAUL_SLICES` i `10-gear.js`) når redskapet kommer over rekka. Lina gir en del per 100 kroker (3 for en banklinestamp, 7 for hyselina), garn gir tredjedeler per garn, og teiner kommer hele. `b.gop` har `sl` (deler per enhet) og `sub` (deler ferdig i enheten). Sløyinga går da parallelt med trekket i stedet for å vente på slutten av hver enhet. I 3D følger fisken på kroker og i garnet den ekte fangsten per krok (`haulFish` i `view3d.js`), litt tykkere vist (minst hver åttende krok).
  - **Trekket går saktere når bløggekaret fylles** (`haulSlow` i `10-gear.js`, tilbakemelding #30: «man får heller trekke saktere siden bløggekaret fylles opp»): Fisken bløgges når den kommer over rekka og venter i karet til noen sløyer den. Opp til halvt kar går trekket med full fart. Deretter faller farten lineært til en femtedel ved fullt kar, der trekket stopper som før (`deckStop`) til fisken er sløyd og isa. Statuslinja sier «saktere, karet fylles». **Garn:** Trekkes garn, står to ved haleren (`workCtx.hands` i `13-work.js`): en trekker og en bløgger (`p.bl`, vist som «Bløgger» på Mannskap-siden). Farten er den til dem som trekker (`gopUnitMin`), så to om bord gir samme tempo som før. Sløyinga venter da til karet må tømmes, eller til en tredje tar den. Runde fisk som sløyes først på vei inn, og to ved garnhaleren, ble forkastet 07.10.2026.
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
- **Krabbe** (taskekrabbe til 04.10.2026, så kongekrabbe; brukerens ord: «Taskekrabbe skal fjernes fra spillet. Det er kongekrabbe som gjelder innen fiskerinæringen»):
  - Artsnøkkelen er fortsatt `'krabbe'`, så lagringer, `S.cstk`, `ALLSP`-rekkefølgen (frøene) og delen i `fish.b64` holder seg. Navnet er «Kongekrabbe».
  - **Hvor den finnes** (`kingArea` i `10-gear.js`, etter Havforskningsinstituttet): nesten ingen i Troms (0,004; 0–0,01 krabbe per teine på toktene 2023–2026), litt i Balsfjorden og ved Håkøya (0,03), stigende fra 19,6° Ø til 0,15 ved 22° Ø, 0,7 ved 24° Ø og 1,2 ved 26° Ø. Nord for 72° N er det mindre. Dybden er `dep:[80, 0.8]`.
  - **Fangsten** (`KC` i `10-gear.js`): `KC.q = 3` ganger den gamle krabbefangsten per teine, snittvekt 1,5 kg. Store teiner i 24 timer i september i Vest-Finnmark gir 2–12 kg per teine (`geartest`, anslag). Alt som kommer opp, beholdes (J-138 § 5): 40 % hunner (snitt 1,1 kg), 5 % skadde hanner, hannene etter vekt. Klassene er Råfisklagets.
  - **Prisen** (`SPECIES.krabbe`): minstepris for levende krabbe fra 5.10.2026 per klasse: hann over 3,2 kg 296, 2,2–3,2 kg 291, 1,6–2,2 kg 246, 0,8–1,6 kg 66, hunn 80 og skadd hann 100 kr/kg. Under 0,8 kg er fri prising (20 kr er et anslag). Markedsprisen følger måneden (`pm`) etter Råfisklagets statistikk: 2025 i snitt 436 kr/kg, fra 151 i april til 614 i januar. Månedene mellom de kjente er anslått.
  - **Levende eller død:** krabben holdes levende og sløyes og ises ikke. Uten krabbekar faller friskheten 2,5 per time (den lever rundt et døgn), med `EQUIP.krabbekar` (28 000 kr, anslag) 0,4 per time. Under friskhet 40 er den død (`KC.dead`), og død krabbe vrakes til 0 kr med en melding fra mottaket og en linje på seddelen.
  - **Teinene** (`POTS`): små kongekrabbeteiner 1 400 kr (20 krabber), store 2 200 kr (40 krabber, krever teinehaler). Plassen om bord (`gearMax.teine`) er en tredel av det den var for taskekrabbe. Prisene er anslag.
  - Krabbe har ingen kvote i fritt område og teller ikke i ferskfiskordningen.
  - **Gamle lagringer** (`S.kc` i `bootGame`): taskekrabbe i lasten fjernes, med en linje i loggen.
  - **Leveringen:** kongekrabben kan leveres ved alle mottakene i spillet. Mottakene i Finnmark kommer med M2.
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
  - Kongekrabbe: fangsten per teine, hvor lenge krabben lever om bord, teineprisene, prisen under 0,8 kg og månedsprisene mellom de kjente er anslag. Linjene for kvoteområdet er tilnærmet.
  - Hvilke havner som har egnebu, og hva egning koster, er antakelser.
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
  - `worktest.py`: arbeid om bord (5.19). Den sjekker kjedene og hvem som står hvor, sløyefarten per person, oppsettene, roret og halingen som alltid får folk, krabbesortering, læring etter alder og trivsel, måltider og brødskiver, mat mot trivsel, 14-timersregelen og natt ved kai, replikker og avstanden mellom dem, energien til sjøs og ved kai, søvn alene (driver) og med mannskap (turen går videre), og menyen «Mannskap» liggende og stående med knapper på minst 44 px.
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
