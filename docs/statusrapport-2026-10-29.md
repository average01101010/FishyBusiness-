# Statusrapport: Det Store Blå (Kystfiske) – 29.10.2026

> Gjennomgang av repoet `average01101010/FishyBusiness-`. **Viktig om hvilken kode som er vurdert:** grenen `main` inneholder bare en README (ett commit). All kode ligger i arbeidsgrenen `ccr-5e1ba2f4-pusvyd` (961 commits, åpen PR #1 mot `main` siden 29.09.2026) og i grafikkgrenen `ccr-1d00422f-gjapvb`, som ligger 36 commits foran og er den nyeste (sist endret 29.10.2026 kl. 13:03). Rapporten er basert på grafikkgrenen; der den avviker fra arbeidsgrenen, er det nevnt. Filreferanser er til `src/` på den grenen.

---

## 0. Sammendrag

| Nøkkeltall | Verdi |
|---|---|
| Kode | ~34 000 linjer JS i 151 filer (gjennomsnittlig linjelengde >100 tegn), 466 KB admin/legal/CSS, 362 Python-filer i verktøy og tester |
| Byggeresultat | `dist/index.html` = **38,6 MB** (én selvstendig HTML-side) + `dist/map/` 14,3 MB (bare Senja; hele kysten 195–259 MB) |
| Innebygde binærdata | 80 `.b64`-filer, 36 MB (Blender-modeller, skrifter, bilder) inlinet i siden |
| Tester | 249 Playwright-skript (Python), 164 i testkjøreren (123 «LITE» + 41 3D), 0 enhetstester |
| Backend | Supabase (45 SQL-migrasjoner, ~130 RPC-funksjoner, 5 Edge Functions), WorkOS AuthKit, Stripe (testmodus) |
| Drift | detstorebla.no (Hetzner + Caddy) og GitHub Pages, deploy ved push til arbeidsgrenen. 600 Actions-kjøringer |
| Historikk | 997 commits på 32 dager (27.09–29.10.2026), 987 av dem med Claude som forfatter, 10 av eieren |
| Grener | 40 fjerngrener, 30 PR-er (6 åpne), `main` tom |

Spillet er et **spillbart, publisert MMO-lignende kystfiskespill** med en uvanlig dyp simulering (fiskeri, kvoter, regelverk, fysikk, økonomi) og et komplett datapipeline for hele norskekysten. De største svakhetene er **ingen enhetstester, ingen CI-testkjøring, ingen staging, en 38 MB enkeltside, klient-styrt økonomi og en kodebase med ett delt globalt skop**.

---

## 1. Teknologistakk og byggesystem

### 1.1 Kjernebiblioteker og rammeverk

| Område | Valg | Kommentar |
|---|---|---|
| Språk | Vanilla JavaScript (ES2020+), ingen TypeScript, ingen moduler | Alle `core/` og `ui/`-filer settes sammen i **ett** `<script>` med felles globalt skop (`'use strict'` i `core/00-proj.js`) |
| 3D-rendering | **Rå WebGL 1**, egen renderer `G3` | Ingen Three.js/Babylon. Utvidelser: `OES_standard_derivatives` (påkrevd), `OES_element_index_uint`, `ANGLE_instanced_arrays` (trær, vindturbiner, nærfelt). Ingen WebGL 2, ingen shadow maps (terrengskygge CPU-marsjeres i tidsskiver) |
| 2D-kartplotter | Canvas 2D (dybde/land-raster) + SVG-overlegg (ruter, redskap, merker) | `ui/03-map.js`, `ui/03a-chart.js` |
| Tilstandsstyring | Ett globalt mutabelt objekt `S` | Ingen Redux/signals; UI leser `S` direkte og tegnes på nytt per app |
| Komprimering | fflate 0.8.2 (vendored, MIT) | Synkron inflate av kartpakker og `CompressionStream` for lagringskoder |
| Autentisering | WorkOS AuthKit (authkit-js 0.20.4, vendored) + Supabase anonyme gjestekontoer | Admin: Supabase e-post/passord + TOTP |
| Backend | Supabase Postgres med RLS, PostgREST RPC, Edge Functions (Deno/TS), pg_cron, pg_net | Ingen supabase-js i spillet; rå `fetch` mot `/rest/v1/rpc/*` |
| Betaling | Stripe Checkout + webhook | Testmodus |
| Push | Web Push (web-push 3.6.7, VAPID) | Nøkler ikke lagt inn ennå |
| 3D-modeller | Blender 4.5.4 som Python-modul (`bpy`), egen GLB-skriver med `KHR_mesh_quantization` | Modeller base64-kodet i `<script type="application/octet-stream">` |
| PWA | Web App Manifest + egen Service Worker (49 linjer) | Bare i PWA-bygget (`KYST_PWA=1`) |
| Datapipeline | Python 3.11: numpy, scipy, shapely, pyarrow, pyproj, pillow, requests, osmium | Kjøres i GitHub Actions, resultat som GitHub Releases |

### 1.2 Bygg, kjøring og testing

| Oppgave | Kommando | Merknad |
|---|---|---|
| Bygg (artifact-utgave) | `node build.mjs` | Ingen npm-pakker, ingen `package.json`, ingen bundler/minifier. `@include(sti)` i `src/index.html` erstattes med filinnhold; JSON skrives `/*@include(sti)*/null`. Bygget kompilerer hvert `<script>` med `vm.Script` som syntakssjekk. Tar ~2,4 s |
| Bygg (PWA) | `KYST_PWA=1 node build.mjs` → `dist-pwa/` | Legger på manifest, SW med versjonshash, ikoner. `KYST_VEC=1` tar med vektorpakker (35 MB), `KYST_DIST=<mappe>` annen utmappe |
| Hele kysten | `python3 tools/map/release.py` + `python3 tools/map/game.py` → `tools/map/out/game/` | Bygget plukker denne automatisk hvis den finnes |
| Kjør lokalt | `python3 tools/serve.py` | Må kjøres over HTTP fordi `map/` hentes |
| Syntakssjekk | `node --check <fil>` per endret fil | Delene i `view3d/` og `ui/phone/` er IIFE-fragmenter og kan ikke sjekkes alene |
| Tester | `python3 tests/run.py changed \| smoke <navn> \| full [--3d]` | Playwright 1.63 (Python), SwiftShader. `changed` bruker `COVER`-tabellen (356 nøkler) til å velge tester fra `git diff` |
| Kodekart | `python3 tools/docs/kodekart.py` → `docs/systemer/kodekart.md` (110 KB) | Funksjonsoversikt med linjenummer |
| Lint/format/typecheck | **Finnes ikke** | Ingen ESLint, Prettier eller tsc |

**GitHub Actions (12 workflows):**

| Workflow | Utløses av | Gjør |
|---|---|---|
| `deploy.yml` «Appen på Hetzner» | push til `main`/`ccr-5e1ba2f4-pusvyd` som endrer `src/**` m.m. | Henter nyeste kart-release, bygger PWA, `rsync` til detstorebla.no. **Kjører ingen tester** |
| `pwa.yml` «Appen på GitHub Pages» | samme | Samme bygg → GitHub Pages (speil uten sky) |
| `autonav.yml` | data-endring, ukentlig | `tests/allpairs.py` ruteregresjon i 4 shards (eneste Playwright i CI) |
| `kart.yml` | redigering av `tools/map/kart.json` | Kartpakker for hele kysten (12-veis matrise, 240 min) → release `kart-N` (nå run 14/kart-16) |
| `dybde.yml`, `s2.yml`, `trees.yml`, `sjomerker.yml`, `tidevann.yml`, `klima.yml`, `regler.yml`, `mottak.yml` | «knappefil» (JSON) redigeres, noen på tidsplan | Dybde, Sentinel-2-farge (340 min), trehøyde, sjømerker, tidevann, klima, regelkart (ukentlig), mottak (månedlig) |

---

## 2. Mappestruktur og arkitektur

### 2.1 Mappelayout

```
FishyBusiness-/
├── build.mjs                 Byggeskript (Node, ingen avhengigheter)
├── CLAUDE.md                 Arbeidsregler og Jonas' vedtak (17 KB)
├── README.md
├── .github/workflows/        12 workflows (deploy, PWA, 10 datapipelines)
├── .claude/skills/           /lever, /okt-slutt, /planlegg, /regresjon, /stikkprove, /tilbakemeldinger, /blender
├── src/
│   ├── index.html            HTML-mal; definerer sammenstillingsrekkefølgen
│   ├── styles.css            154 KB
│   ├── js/
│   │   ├── core/  (48 filer)  Simulering: projeksjon, verden, kartlaster, arter/redskap, fangst, sjø,
│   │   │                      stabilitet, kvoter, regler, mannskap, fartøy, tjenester, driftsplan, havner,
│   │   │                      merker/oppdrag, redskap, rute/autonav, arbeid, energi, styring, dynamikk, skrog
│   │   ├── ui/    (54 filer)  i18n, tilstand/lagring, kartplotter, instrumenter, dekksdagbok, guide,
│   │   │                      handlinger, håndfiske, pub, butikk, sky, push, verden, venner, oppstart
│   │   ├── ui/phone/ (15)     Telefonen PHONE, én fil per app (regler, kvote, rederi, patchnotes …)
│   │   ├── view3d/ (33)       3D-rendereren G3 delt i nummererte deler 00–25 (+17b–17h)
│   │   ├── vessel3d.js        Båtmodeller (GLB-leser, prosedyreskrog), uten WebGL
│   │   ├── deckcrew.js        Mannskap på dekk
│   │   └── lib/fflate.js      Vendored
│   ├── data/                 17 JSON (regler 316 KB, mottak, leinett, tide, klima, sjømerker …),
│   │                          80 .b64 (36 MB modeller/skrifter), map/ (205 Senja-pakker, 14 MB)
│   ├── pwa/                  manifest, sw.js, ikoner
│   ├── admin/index.html      Admin-dashbord (egen side /admin/)
│   ├── legal/                personvern, vilkår, kilder, kontakt
│   └── vendor/authkit.js     WorkOS
├── supabase/
│   ├── migrations/ (45 SQL)  Skjema, RLS, ~130 RPC-funksjoner, cron
│   └── functions/ (5)        account-delete, feedback-agent, push-send, shop-checkout, stripe-webhook
├── tests/ (249 .py + run.py + _env.py, playtest/)   Playwright ende-til-ende
├── tools/ (29 mapper)        Kart-, regel-, tide-, klima-, mottak-, Blender-pipelines, server, feedback
└── docs/ (167 filer)         INDEKS.md, BACKLOG.md, systemer/ (36 systemdokumenter), planer/, playtest/, pr/
```

### 2.2 Ansvarsfordeling

Arkitekturen er «én fil i fire lag» (`docs/systemer/arkitektur.md`):

| Lag | Hvor | Ansvar | Grensesnitt |
|---|---|---|---|
| **Kjerne/simulering** | `core/02–16` | Arter, fangst, priser, kvoter, regler, mannskap, flåte, driftsplan, rute, fysikk | Muterer `S`; `step()` én gang per spillminutt |
| **Geografi/kartdata** | `core/00-proj.js`, `01-world.js`, `01b-mapdata.js`, `01c-vec.js`, `01d-coast.js`, `01e-marks.js` | UTM 33-projeksjon, kartpakkelaster, vektordata, kystindeks, sjømerker | `rcell/rbil/rbilM` (rasteroppslag), `isLand`, `coastSegHit`; to Web Workers (vec-dekoding, kystindeks) |
| **Fysikk** | `core/03c-stability.js`, `16b-dyn.js`, `16c-hull.js`, `03b-sea.js` | Hydrostatikk, 3-DOF manøvermodell, grunnstøting/skade, sjøtilstand | `S.boat.dyn`; bare spillerens båt når fanen er åpen |
| **Regelverk/kvoter** | `core/03d-quota.js`, `03e-rules.js`, `data/rules.json` | Kvoteberegning, åpen/lukket gruppe, regelmotor med geodata | `rulesAt()`, `ruBlockMsg()`, `codRoom()`, `landConf()` |
| **UI** | `ui/*`, `ui/phone/*`, `styles.css` | HUD, kartplotter, telefon-apper, dekksdagbok, veiledning, butikk | Leser `S`, kaller kjernefunksjoner; `data-pa`-handlinger |
| **3D** | `view3d/00–25`, `vessel3d.js`, `deckcrew.js` | Terreng, sjø, bygg, båter, folk, vær, kamera | Leser `S` og `window.CATCHQ` (fangstkø); egen `<script>` |
| **Nettverk/sky** | `ui/10f-cloud.js` (799 linjer), `10g-push.js`, `10h-world.js`, `10k–10o` | Innlogging, lagringssynk, felles verden, venner, prai, slep, push | RPC via `fetch`; polling |
| **Backend** | `supabase/` | Skjema, tilgangskontroll, serverkontroller, betaling, push, tilbakemeldingsagent | Alt gjennom `security definer`-RPC |

**Observasjoner om lagdelingen:**
- Skillet er **konvensjonsbasert, ikke håndhevet**: alt deler globalt skop, og kjernen kaller UI-funksjoner (`save/load/landConf/sell/catchUp` ligger i `ui/`). Kjernen kan ikke lastes alene (f.eks. i Node for enhetstester).
- TDZ-feller mellom filer (`let/const` finnes først når fila er kjørt) er dokumentert og håndtert ad hoc (`window.heatReady`).
- `view3d/` og `ui/phone/` er rent oppstykkede IIFE-er (delt 26.10.2026); delene er ikke moduler.
- Mutable singletoner: `S`, `BOAT` (`Object.assign(BOAT, VESSELS[type])`), `DYN`, `RU_NOW`, `WCLOCK`, `MAPD`.

---

## 3. Spillogikk, kart og fiskeriregelverk

### 3.1 Skipstilstand

- **`S`** (opprettet i `newState()`, `core/05-vessels.js:399`) er hele spilltilstanden: `v:2, frame:'utm33', t` (spillminutter siden EPOCH 1. mars 2027), `cash, loan, bank, fleet[], cur, crew, equip, quota, lic, ops, settings, stock/cstk/bstk` (bestandsgrid), `qy` (åpen gruppe per år), `bkq` (blåkveite), `book*` (regnskap), `fm` (fiskermanntall), `haill*, streak, rep`, `wq` (kø mot felles verden) m.m.
- **Per fartøy** ligger i `S.fleet[i]` og bindes inn i `S` med `bindVessel()`; `VKEYS` (`core/03-simulation.js:3`) lister feltene: `boat` (type, `pos{x,y}` i km, `heading, v, fuel, ice, status, dmg, kasko, dyn`), `hold[]` (fangstlotter `{sp,kg,cls,fresh,iced}`), `crew[], equip, pgear` (passivt redskap), `quota`, `lic`, `plan/ops`, `trail`, `workLog`.
- **Fartøytyper** i `VESSELS` (`core/02-species-gear.js:73+`, 13–15 typer): lengde, bredde, dypgang, deplasement, lastekapasitet, is, drivstoff, hk, `vmax/vcruise`, svingradius, planende, risiko, mannskap, køyer, rigger, `gearMax`, pris, skrogmateriale, dekksstasjoner. Regel: ingen kode velger på typenavn, bare på felt (`vesseltest.py` håndhever).
- **Fysikk:** `03c-stability.js` (hydrostatikk, IMO-værkriterium, rulle-/stampeperioder som dempede oscillatorer), `16b-dyn.js` (3-DOF surge/sway/yaw etter Fossen med Clarke-Gedling-Hine-derivater, Nomoto-kalibrering per båt, vind/bølgedrift, Kwon fartstap, kaikontakt, LOS-autopilot), `16c-hull.js` (kollisjons-/grunnstøtingsskade, hull og innstrømning mot lensepumpe, motorstopp, kasko). Andre båter og innhenting («catch-up») bruker en enklere kinematisk `sail`.

### 3.2 Tid og felles klokke

- `GAME_RATE = 6` spillminutter per ekte minutt; `WORLD_T0` = 5. okt 2026 15:00 UTC; `WCLOCK.off` er offset mot serverens `Date`-header (HEAD-forespørsel mot detstorebla.no).
- `step()` kjøres én gang per spillminutt (timevise kroker: ordrer, mannskap, groe, marked, bestand, sesonger, presse; deretter `vesselStep` per båt).
- `catchUp()` (`ui/08-actions.js:299`) spiller av fravær mot verdensklokka, inntil `WORLD_SIM_MAX` = 14 dager (eldre tid hoppes over). Alt simuleres fullt ut (driftsplan, mannskap, verft, bank/skatt), men bare når kartpakkene rundt hver båt er lastet (`simAreaReady`).

### 3.3 Kartdata og geografi for norskekysten

- **Ramme:** UTM sone 33 (EPSG:25833) via egen Krüger/Karney-implementasjon i `core/00-proj.js`; spillets km-ramme x = (E + 250 km)/1000, y = (8050 km − N)/1000. Sann kurs = rutenettkurs + γ. Senja-data i gammel ramme mappes med `LG*`.
- **Kartpakkeformat `KMP1`** (`tools/map/pack.py`, leser `core/01b-mapdata.js`): magic + JSON-header `{kind, tile, blocks:[[layer,bx,by,offset,len]]}` + raw-deflate per blokk; i16-lag som zigzag median-prediktor-residualer. Blokker 10×10 km, fliser 50×50 km. Filnavn `<kind>-<tx>-<ty>-<sha256:12>.wasm` (`.wasm` fordi artifact-verten avviste `.bin`).
- **Lag:** `core` (land200, avstand-til-land, eksponering, dyp), `sim` (maske 25 m, avstand f32 100 m, dybde i16 50 m), `view` (høyde 25 m, skog, arealdekke, fra kart-12: Sentinel-2 luma/chroma, trær, vann, strand), `far` (200 m), `chart` (kyst 3 m, sjømerker), `vec` (bygg, veier, bruer, brygger, kaier, NPC-plasser).
- **Kilder:** Overture 2026-09 (OSM kyst/bygg/veier/vann), Kartverket 10 m DTM + GEBCO (Terrarium), Kartverket bathymetri 50 m (CC BY 4.0), ESA WorldCover, Sentinel-2 L2A, Meta/WRI trehøyde, Kystverket leier, OpenSeaMap, Kartverket tidevanns-API, Fiskeridirektoratet (mottak, regelkart, registre).
- **Innhold hele kysten:** 2,35 M bygg, 1,15 M veisegmenter, 9 140 bruer, 137 855 kaifronter, ~98 000 skjær; 425+ pakker, 195–259 MB. I git ligger bare Senja (205 pakker, 14 MB).
- **Laster:** manifest → pakker hentes én gang, caches i IndexedDB `kyst-map` (nøkkel = hash), 1,5 s IDB-timeout med fallback til nett (lagt til 29.10), 5 forsøk; LRU i minnet på 96 MB. En ulastet blokk gir **feil, aldri reserveverdi**; simuleringen venter.
- **Rute/autonav:** A* på 100/200 m rutenett med korridorsøk og 50 m fingrid i sund (`core/11-route.js`), leinett fra Kystverket (3 982 noder, Dijkstra for >10 km, `11c-leinett.js`), hindringer (bruer med seilingshøyde, pæler, moloer, sjømerker, turbiner) i 250 m celler (`11b-obstacles.js`). Valideres av `autonavtest`, `routetest`, `obstest` og den ukentlige all-pairs-kjøringen.
- **Steder:** `mottak.json` (mottak uten firmanavn, bevisst), `steder.json` (butikk/verft), `rorbuer.json`, `marina.json`, `flyte.json`, `fyr.json`, `vind.json`, `fuglefjell.json`, `regmerke.json`.

### 3.4 Fiskerimodell og fangst

- `SPECIES` (`core/02-species-gear.js:6+`): per art kalibrering, dybdeprofil, månedlig tilgjengelighet, skrei-profil, pris per måned, størrelsesfordeling (lognormal), minstemål, lever/rogn, størrelsesklasser.
- `density(sp,p,H)` (`core/03-simulation.js:504`) = sted × tid × art (eksponering, kant, hotspot, felt, dagstøy, stim, dybde, bestand). Juksa per minutt i `fish()` (`core/05-vessels.js:681`): regelsjekk → `catchFactors()` (innsats, vær, kulde) → akkumulert fangst → `sampleFish()` → slipp under minstemål → `addCatch()` → `takeStock()` tømmer 2 km-bestandsgrid. Passivt redskap i `core/10-gear.js` (`haulUnit/landFish`).
- Bestandsmodell `STOCK/stockYear/stockF` (SSB-historikk for torsk, hyse, sei, blåkveite med Blim/Bpa, seedet random walk fra 2028).

### 3.5 Kvotekontroll

Fil `core/03d-quota.js` (255 linjer), dokumentert i `docs/systemer/kvoter-og-regler.md`:

| Struktur/funksjon | Hva |
|---|---|
| `REG26` | Hardkodede tall fra J-161-2026: TAC, norsk kvote, åpen/lukket gruppe, gruppekvoter per hjemmelslengde, kvoteenheter, maks/garantert åpen gruppe |
| `norQuota()`, `codChain()`, `yearQuota(y)` | Avsetninger, åpen gruppe 6,62 %, trålstige, 87,19 % lukket, Finnmarksmodellen; cachet per år og `qseed` |
| `HJ`, `licQ(l,H,len)` | Lukket gruppe: kvotefaktor per hjemmelslengde (u7…h20), hyse/sei [maks, garantert], strukturkvoter, samfiske, driftsordning |
| `access()` (`03-simulation.js:24`) | `'lukket' \| 'open' \| 'none'`; `BYCATCH = {share:0.1, cod:2000}` |
| `OPENF`, `qyOf/qyStep/qyAt` | Åpen gruppe simuleres dag for dag med ~2 100 NPC-båter, stopp med 7 dagers varsel, påslag 1. mai/1. juni, fritt fiske om høsten; persistert i `S.qy[y]`; spillerens og andre spilleres landinger teller (felles verden) |
| `quotaState()`, `quotaNewYear()` | Årsskifte: ny `S.quota`, strukturkvoter og samarbeid utløper |
| `ffPlan/ffPct` | Ferskfiskordningen |
| `REGN/npcReg/regTake`, `STRUCT*`, `twoOK`, `COOP*` | Rettighetsregister, strukturkvoter, <11 m-ordning, samfiske |
| `BKQ, bkSeason, bkOpen, bkMax, bkAllow, bkLanded` | Blåkveite: direktefiskevindu, maks per lengde, 7 %/uke bifangst utenfor; `S.bkq` |
| **Trekk ved landing** | `landConf()` (`ui/08-actions.js:100–127`): ferskfiskordning først, så kvote via `codRoom()`, rest **inndras**; hyse/sei maks + 30 %/20 % bifangst; blåkveite via `bkAllow`. `sell()` øker `q.torsk` og `qyAt(H).me` |

Kildene (J-161-2026 §§, saksdokument 5/2025, hi.no) står inline og i kapittel 6 i systemdokumentet.

### 3.6 Regelmotor

Fil `core/03e-rules.js` (265 linjer) + `src/data/rules.json` (316 KB, generert 04.10.2026 av `tools/rules/regler.py`, oppdateres ukentlig av `regler.yml`):

- **Data:** grunnlinje (`bl`), sjø innenfor grunnlinje (`blin`), nautiske mil-bånd (`nm`), 82 soner (fjordlinjer, åpne, grunnlinje), 19 lag fra Fiskeridirektoratet (stengte felt, fjordlinjer, 21–27,9 m og 28 m+-soner, krokgrense, Henningsvær, § 40-områder, kongekrabbe, gyteområder, Oslofjorden, Borgundfjorden, Lofoten, Lopphavet, Raet), 60 hovedområder, 578 lokasjoner. Polygoner delta-kodet, rastreres til 100 m celler per 10 km-blokk ved behov (`ruBlock/ruBits`).
- **`rulesAt({p,H,len,gear,sp,hand})`** (linje 88–183) returnerer `{v:'no'|'warn'|'ok', items:[{v,k,no,en,ref,url,block}]}`. Reglene er håndskrevne grener: § 31 (≥15 m innenfor fjordlinjene), § 33/33a (krok/garn → advarsel), § 32 (21–27,99 m innenfor grunnlinja, ≥28 m innenfor 4 nm med unntak), Henningsvær, Borgundfjorden, Lofoten, stengte felt (tekstmatch på redskap), gyteområder, Oslofjorden, Lopphavet, Raet, § 39 kveite/uer, blåkveite (dybde), kongekrabbe.
- **Håndheving er forebyggende:** `ruBlockMsg()` får båten til å **vente** (ingen fangst) der en regel blokkerer; `ruWpMsg()` advarer på rutepunkter, `ruOpenNear()` dytter autonav, `ruTips()` gir engangsmelding per regel (`S.ruSeen`), `ruNow()` HUD-status, `ruLayerBlock()` rødt/gult kartlag. `ruMinSize()` § 47 minstemål per region, `fjordLimits()` garn/krok-tak.
- **Ingen bøter, inspeksjoner eller kystvakt**; eneste økonomiske sanksjon er inndragning ved landing (`fine:0` hardkodet).
- Regler-appen på telefonen: `ui/phone/03-regler.js`; kvoteappen `04-kvote.js`.

---

## 4. PWA og MMORPG-nettverk

### 4.1 Offline, caching og lokal lagring

| Mekanisme | Oppsett |
|---|---|
| **Manifest** | `src/pwa/manifest.webmanifest`: fullscreen (fallback standalone), `lang: no`, 192/512/maskable-ikoner, tema `#0b1622` |
| **Service Worker** (`src/pwa/sw.js`) | Precache ved install: `./`, `index.html`, manifest, `map/manifest.json`, ikoner; `skipWaiting()` + `clients.claim()`. Fetch: `map/*.wasm` cache-first i `kyst-map` (hash i navnet, immutable); alt annet network-first med write-through til `kyst-page-<V>` og fallback til cache; navigasjon faller tilbake til `index.html`. Ny `map/manifest.json` → `prune()` sletter utgåtte pakker. Versjon `@V@` = sha256 av side + kartmanifest, satt av `build.mjs`. Push-hendelser → `showNotification` |
| **Server-cache** | Caddy: `no-cache` på `/`, `sw.js`, manifest; 1 år `immutable` på pakker |
| **Installasjon** (`ui/10p-install.js`) | `beforeinstallprompt` på Android, Share-veiledning på iOS; tilbys etter første levering, maks 3 ganger med 2 dagers mellomrom; ikke til iOS-gjester (separat lagring i standalone) |
| **Persistent lagring** | `navigator.storage.persist()` bes om ved last (resultat ignoreres) |
| **localStorage** | `kystfiske_v2` (hele `S` som JSON, v2), `kystfiske_proto_v1` (migreres via `migrateV2`), `kystfiske_v2_prev` (fortrengt lagring), `kystfiske_v2_own` (faneeierskap), `kystfiske_v2_foto`, `dsb_signed/dsb_guest/dsb_sync_<id>/dsb_device/dsb_install` m.fl. WorkOS refresh-token ligger også her (`workosDevMode: true`) |
| **IndexedDB** | Bare kartpakker: database `kyst-map`, store `f`, nøkkel = hash → ArrayBuffer. **Ingen utkastelse**; vokser med hver kart-release |
| **Lagringskode** | `KYST2:` + base64(gzip(JSON)) via `CompressionStream`; samme format går til skyen |
| **Hva virker offline** | Side, kart (besøkte pakker), skrifter og enheter som har vært innlogget før (lokal lagring, enhetsklokke som verdensklokke). **Virker ikke offline:** ny innlogging, gjesteopprettelse, all felles verden, lagringssynk, push. Dokumentert intensjon: «Spillet krever nett» |

### 4.2 Backend og flerspiller

**Backend (Supabase):**
- 45 migrasjoner, tabeller bl.a. `players, saves, save_hist, sessions, events, errors, perf, presence, landings, catches, products, purchases, entitlements, push_subs/queue/state, feedback*, friends, friend_req, shared_marks, guestbook, hails, tows, berths, names, news, cash_flags, admins`.
- **Tilgangsmodell:** RLS på alt, `revoke all from anon, authenticated`; bare `admin_read`-policies via `is_admin()` (krever `admins`-rad + TOTP/aal2). All spilltilgang gjennom ~130 `security definer`-RPC-er med eksplisitte grants (`tm_*, save_*, pos_*, land_put, catch_put, world_get/top, friend_*, hail_*, tow_*, push_*, shop_*, berth_*`).
- **Cron:** retensjon 13 måneder, tilbakemelding 2 år, `push-send` hvert 5. min via pg_net, `push_week`/`push_paper` hver time.
- **Edge Functions:** `account-delete` (sletter også WorkOS-bruker), `feedback-agent` (statisk bearer-token, mater Claude Code-rutinen 4×/døgn), `push-send` (web-push, VAPID; **POST er uautentisert**), `shop-checkout` (Stripe, pris fra `shop_quote`), `stripe-webhook` (signaturverifisert, idempotent, refusjon trekker tilbake).
- **Auth:** WorkOS AuthKit som tredjeparts-JWT i Supabase; gjester via anonym Supabase-signup, slås sammen ved registrering (`guest_claim/guest_merge`).
- **Admin-dashbord** (`src/admin/index.html`): trakt (konvolutt → første fangst → første levering → registrert → dag 1/7/30), feil, ytelse, tilbakemeldinger.

**Flerspiller / felles verden (alt implementert via polling, ingen Realtime/WebSocket):**

| Funksjon | Mekanisme | Intervall |
|---|---|---|
| Felles klokke (V1) | `WORLD_T0`, server-`Date`-header | ved oppstart |
| Felles sjø (V2) | Landinger og fangst per celle køes i `S.wq` (inne i lagringen, overlever offline) → `land_put/catch_put`; `world_get` gir andres åpen-gruppe-torsk, mottaksmetning, celle-uttømming | hvert 10. min + 4 s etter salg |
| Topplista | `world_top` per spilluke | cache 60 s |
| Posisjoner (V3) | `pos_put` + `pos_world(x,y,25 nm)` for ≤300 aktive; dødregning ≤30 s, borte etter 60 s; id-er er md5-hasher; gjester skjult | 15 s |
| Redskap i sjøen | `gear_sets` opp ved endring/5 min | 1 min/5 km |
| Venner, delte merker | RPC-polling | 20 s |
| Prai (hails), slep (tows) | serveren måler avstand (slep ≤200 m, 25 000 kr, tak per dag) | 15 s |
| Én enhet styrer | `save_claim` ved start, `save_beat` hvert 5. s, `save_put4` avvises fra ikke-aktiv enhet; overlevering av siste tilstand | 5 s |
| Konfliktløsning | Aldri-synket enhet → sky vinner; begge spilt → nyeste veggklokke vinner, taperen i `save_hist` (10 stk) / `kystfiske_v2_prev`; ekte divergens → spilleren velger | — |

**Tillitsmodell:** simuleringen er **klientautoritativ**. Serveren gjør bare rimelighetskontroller: posisjonsgrenser, landingstak (60/40/5 t, ≤24 rader, ≤400/time), navnesanering, monoton fartstid, ratebegrensninger, og en **rådgivende** kontantsprangdetektor (`cash_flags`, «ingenting avvises»). Økonomi, kvote og kjøp i spillet stoles på fra klienten (erkjent i dokumentasjonen).

**Planlagt, ikke gjort:** felles gytebestand/total kvote, lukket-gruppe-register, krabbebestand delt; VAPID-nøkler og «bit 2»-SQL for push (venter på Jonas); Stripe live-nøkler (testmodus siden 06.10); egendefinert auth-domene droppet (kostnad).

### 4.3 Drift og deploy

- **Produksjon:** Hetzner VPS + Caddy (auto-HTTPS, HSTS, `rrsync`-begrenset deploy-bruker, ufw, unattended-upgrades) på detstorebla.no. `deploy.yml` kjører ved push til `main` eller **arbeidsgrenen `ccr-5e1ba2f4-pusvyd`**: henter kart-release → `KYST_PWA=1 node build.mjs` → `rsync --delete-after`. Siste kjøring 29.10.2026 01:13, grønn.
- **Speil:** GitHub Pages (`pwa.yml`), skyen er av der (vertsliste i `cloud.json`).
- Supabase-migrasjoner og Edge Functions deployes **ikke** av CI (manuelt via MCP/SQL Editor).
- Grafikkgrenen `ccr-1d00422f-gjapvb` utløser kartpipelines, men **ikke** deploy (ikke i branch-lista), så G3–G10-arbeidet er ikke i produksjon før det flettes.

---

## 5. Nåværende status og utfordringer

### 5.1 Ferdig implementert (i produksjon på detstorebla.no)

- Fiskerimodell med arter, redskapstige (juksa → line → garn → teiner → trål/not), 13–15 båttyper med Blender-modeller, verft/Malerverksted, flåtefase 1–3.
- Hele kysten: kartpakker, 3D-terreng, vektorkyst, bygg/veier/bruer/kaier, sjømerker, tidevann per sted, klima, autonav med leinett og hindringer (kystplan K1–K10).
- Kvoter og regelmotor med Fiskeridirektoratets geodata, Regler- og Kvote-app, varsel før feil (R4).
- Mannskap, arbeid om bord, energi/hviletid, kulde/klær, dekksarbeid i 3D.
- Driftsplan 2 (del 1–7) med spill-mens-lukket mot felles klokke.
- Økonomi 2 (hovedbok, turoppgjør med lott etter fiskerioverenskomsten, bankkontoer, skatt ENK/AS) – rullet ut 27.10.
- Onboarding 2 O0–O5 (kortere første tur langs hele kysten) – PR #26/#27.
- Fysikk 1–3 og Fysikk 4 F1 (skumkart).
- Grafikkplan G1–G7 og G9 (arealdekke, innsjøer, Sentinel-2-farge, trær, vått/nedbør, turbiner/kraftspenn, dyreliv) – **på grafikkgrenen, ikke flettet**.
- Sky: WorkOS-innlogging, gjester, lagringssynk med konflikthåndtering, felles verden V1–V3, venner, delte merker, gjestebøker, prai, slep, kaiplasser, topplister, sesonger, patchnotes-app, tilbakemeldingsapp med agentrutine, admin-dashbord med trakt, personvern/vilkår-sider.
- Stripe-butikk (testmodus, hele løpet verifisert), push-infrastruktur (bygd, slått av).

### 5.2 Halvferdig / pågår

| Område | Status |
|---|---|
| Grafikk G8 (nærfelt) og G10 (kaiutstyr/marinaer) | Delvis: mangler `hgt10`, strender/tare/klipper; utriggere ikke bygd |
| Fysikk 4 | F1 bygd, F2 (oppdrift per skrogsnitt) neste, F3–F8 venter; ikke målt på nettbrett |
| Sjøen ved Bleik | Skum driver gjennom moloen, bølgemønster etter båten «til sjekk» (29.10) |
| Driftsplan 2 del 8 | Rydding (fjerne gammel `06d-drift.js`/`05c-drift.js`, bytte tester) venter på Jonas' prøving; stikkprøver langs kysten mangler |
| Onboarding 2 O6 | To ukers måling i admin-trakten pågår |
| Økonomi 2 | Bygd, men ikke spilltestet; skattesatser må sjekkes av regnskapsfører |
| Push | Kode og SQL klar, VAPID-nøkler mangler |
| Stripe | Testmodus; live krever org.nr., bedriftskonto, Stripe Tax, DPA |
| Regelmotor | Skagerrak-regel for torsk mangler; regeltekster ikke lest på nytt for 2026; minsteprisliste utløper 13.12.2026 |
| 6 åpne PR-er | Autonav rundt grunner (#24, #25), mannskapsplasser (#19), lav grafikk på store skjermer (#18), sløying på åpne båter (#29), setting langs strengen (#30). Flere er 150–330 commits bak arbeidsgrenen |

### 5.3 Mangler fullstendig

- NPC-flåten for hele landet (plan N1–N8, venter på fem valg).
- Sikkerhet SK1–SK6 (vest, mann over bord, nødstopp, kurs, nestenulykker).
- Flåteplanen fase 4–5 (flåten i kart/3D, rapporter).
- Navngitte fiskefelt utenfor Senja; lei/bølgeinfo i planleggeren.
- Bøter/inspeksjon/kystvakt (bare inndragning i dag); kvoteleie (§ 30).
- Felles bestand/totalkvote og lukket-gruppe-register i den felles verdenen.
- Lanseringsforutsetninger: forretningsmodell og selskapsform, engelsk navn, DPA-signaturer, MVA/OSS, aldersgrense for kjøp, ODbL-attribusjon for avledede kartpakker, staging-miljø, deploy-gate på ekte lagringer (`savestest.py` finnes, ikke koblet inn).

### 5.4 Tekniske flaskehalser

1. **Sidestørrelse:** `dist/index.html` er **38,6 MB** (dokumentasjonen sier 23 MB, eldre steder 6,2 MB). 36 MB er base64-modeller inlinet; `ui/phone/07-patch.js` alene er 226 KB patchnotes. Hele siden er cache-enheten: hver deploy laster alt ned på nytt for alle spillere, og SW med `skipWaiting` kan bytte kode under et åpent spill. Modellene kunne vært hashede sidefiler som kartpakkene (mønsteret finnes allerede).
2. **Hovedtrådstrykk:** synkron fflate-inflate, CPU-skyggemarsjering, mesh-bygging og WebGL i hovedtråden; bare to Web Workers (vec-dekoding, kystindeks). Ingen OffscreenCanvas. Ingen ytelsesmåling på nettbrett siden G1/G5/F1; G5 koster opptil 25 % i SwiftShader; WebGL-kontekst tapt på Galaxy A52s ved 347 MB JS-heap; `charttest` 3,0 s mot grense 2,5 s.
3. **WebGL 1:** ingen UBO/VAO/transform feedback; shader-link-feil på Adreno håndteres med fallback-stige; kontekst-tap → lagre og last på nytt.
4. **IndexedDB vokser uten grense** (kartpakker kastes aldri ut; SW-cachen prunes, men pakkene ligger dobbelt).
5. **Testtid:** full regresjon ~1–2 timer; siste fulle kjøring (27.10) traff 2-timersgrensen etter 127 av 155 tester.
6. **Kartpipeline** er tung (kart.yml 240 min, s2.yml 340 min) og styres ved å redigere JSON-«knapper».

### 5.5 Manglende tester og CI

- **0 enhetstester.** Alt er Playwright ende-til-ende mot bygget side; rene funksjoner som `codChain`, `licQ`, `rulesAt`, `pack.py`-koder/dekoder testes bare via stikkverdier i nettleseren.
- **CI kjører ingen tester** ved deploy (bare bygg + rsync). Eneste Playwright i CI er `autonav.yml`. Ukentlig regresjon er planlagt som en Claude Code-økt (første 02.11.2026).
- **Ustabile/røde tester** (BACKLOG 10.6): `sidetab`, `starttest`, `pwatest` røde på grunnbygget; `anchortest`, `fleet2test`, `drifttest` S6, `driftsplan2ui`, `turtest`, `selfcrew`, `driftsplan2test` S9 flakete fordi tilfeldighetstall ikke er frøsatt; `penshot` GL 1282; `anchor3d`/`anchorlight3d` timeouts; kystdekkende tester røde uten `tools/map/out/game`.
- **Ikke testet:** service worker/offline-løp, IndexedDB-kvote, ekte WorkOS/Supabase/Stripe ende-til-ende (bare stubber + `sqltest.py` mot lokal Postgres), Python-pipelinene.
- 85 skript i `tests/` er ikke med i `run.py` (mest engangs-skjermbilder `shot*.py`, `shore_*.py`).
- Ingen lint/format/typecheck; avhengigheter stort sett upinnet (`pip install numpy requests` i workflows; Playwright 1.63 i docs vs 1.56 i `autonav.yml`; bare `tools/map/requirements.txt` pinner).

### 5.6 Områder som trenger refaktorering

| Område | Problem | Forslag |
|---|---|---|
| Globalt skop | ~1 800 toppnivå-`const/let/function` bare i `core/`, deler skop med UI; kjernen avhenger av UI-funksjoner | ES-moduler eller i det minste navnerom per lag; flytt `save/load/landConf/sell` til kjernen |
| Kjempefunksjoner og linjer | `rulesAt` ~95 tette linjer nøstede vilkår, `fish()`, `vesselStep`, `sell`, `landConf`; 1 340 linjer >300 tegn, lengste 7 118 tegn | Del opp; flytt datalitteraler (`VESSELS`, `REG26`, `HJ`, `STOCK`, `BLADB`, `TREKK`) til JSON |
| Lagringsskjema | Bare `v:2`; migrasjoner er en voksende kjede av ad hoc-sjekker i `load()`; glemt `VKEYS`-nøkkel mister data stille | Numerisk skjemaversjon + migrasjonsliste + test som lagrer/laster alle felt |
| Duplikat driftsplan | `06d-drift.js` (v3) og `06g/06h-plan2` (v4) lever side om side med identiske feilmeldinger | Del 8 av Driftsplan 2 (planlagt) |
| Senja som egen kodesti | Innebygde Senja-rastere (`geo-*.b64`, `piers.json`, `seamarks.json`) bak `inSenja` overalt; Senja-pakkene mangler nye lag (S2, trær, vann, strand) | Regenerer Senja med release-formatet og fjern spesialstien |
| Regelmotor | Håndskrevne grener; vet ikke redskapsantall (§ 33 gir bare advarsel); stengte felt er øyeblikksbilde fra 04.10 uansett spilldato | Datadrevet regelbeskrivelse; dato-gyldighet på lagene |
| Synk-logikk | 4 generasjoner RPC (`save_put` → `put4`) + lokale heuristikker (150 s/3 s); `cloudtest.py` beskriver eldre regel | Fjern gamle veier, oppdater test |
| Telemetri-versjon | `cloudMeta().version` leser `<meta name="dsb-version">`, men ingen skriver den → rapporteres som `'dev'` | Skriv hash fra `build.mjs` |
| Sikkerhet | Klient-styrt økonomi (bare deteksjon); `push-send` POST uautentisert; `feedback-agent` ett statisk token; WorkOS refresh-token i localStorage (`workosDevMode`); peer-leverte strenger i HTML (XSS-historikk) | Serverside kvote-/kontant-kontroll for toppliste; auth på push-send; `workosDevMode: false` med egendefinert domene |
| Grenhygiene | `main` tom, produksjon deployes fra en feature-navngitt gren uten beskyttelse eller staging; plan-grener må flettes manuelt | Flett arbeidsgrenen til `main`, beskytt `main`, staging per gren (planlagt i `lansering.md`) |
| Lisens/data | Kartpakker avledet av OSM/Overture (ODbL), trær CC BY, regeltekster ikke re-lest for 2026, minstepriser utløper 13.12.2026 | Attribusjonsside og lisensgjennomgang før lansering |

### 5.7 Prosessobservasjoner

- Én menneskelig eier (Jonas) styrer AI-økter; vedtak er datert og sitert i `CLAUDE.md` og `docs/`. Dokumentasjonen er omfattende (36 systemdokumenter, 110 KB kodekart, én backlogg) og stort sett à jour til 29.10, men noen tall (sidestørrelse) er utdaterte.
- Commit-tempo opptil 78 per dag; «fart foran finpuss» er et uttalt prinsipp, og den tekniske gjelden over er en forventet konsekvens.
- Automatiserte agentrutiner: tilbakemeldingstriage 4×/døgn, ukentlig regresjons-PR (ikke kjørt ennå), ukentlig regelkart og all-pairs-ruter.
- To blinde AI-spilltester (30.09, 01.10); ingen menneskelig spilltest av Økonomi 2/Driftsplan 2 utover Jonas på nettbrett.

---

*Rapporten er laget 29.10.2026 fra grenen `ccr-1d00422f-gjapvb` (commit f3806b2) med arbeidsgrenen `ccr-5e1ba2f4-pusvyd` (commit 973c095) som sammenligning.*
