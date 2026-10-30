# Båtene i 3D: bevegelse, animasjoner, styrhuset, måkene og halerne

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.13 Båtbevegelse og animasjoner

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
  - **Felles kode** for båtskriptene ligger i `tools/boats/bpyutil.py`: `interp` (tabeller), `resample` (rader på fargegrensene), `stem_stations` (snitt der stevnen krysser hver fargegrense, se under), `offset_poly`, `beauty`, `side_picture`, `on_drawing` (render oppå tegningen) og `export_boat` (baking, lod0 + glass + lod1, GLB og sidebilde). Med `dry` skriver skriptene GLB-en bare til `tools/boats/out/`, så `src/data/` står urørt. En prøvekjøring av Malo-skriptet etter flyttingen ga samme geometri som før; bare den bakte skyggen i lod0 varierer litt fra kjøring til kjøring.
  - **Fargebåndene i stevnen** (Jonas 21.10.2026, #89): et snitt som starter over et fargebånd (kjølen har steget i stevnen), har båndet samlet i stevnpunktet. Flatene fra snittet akter for det gikk da opp langs stevnen, så bunnstoffet og stripa løp opp baugen og stripas to sider møttes i et hakk. `stem_stations` legger et snitt der stevnen krysser hver fargegrense, så hvert bånd ender i stevnen i sin egen høyde. Snekka får også et snitt der stevnen krysser hvert klinkbord (de gikk opp stevnen som en mørk kile), og alle tre får et siste snitt i stevnspissen, der snittet er ett punkt: før sluttet skroget en centimeter for tidlig, og åpningen viste seg som et lyst hakk øverst i stevnen. Brukt i hs11 (den nye hurtigsjarken), plast31 og snekke26. Stikkprøve på alle 14 båtene forfra 21.10.2026: de andre har rene stevner (den mørke trekanten på Malo 36 er ankeret i baugrullen). Malo 36 farger hver flate etter høyden (`band_mat`) og har ikke feilen.
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
- **Pilotbåten, kystnotbåten på 38,55 m (`ringnot38`, 30.10.2026):** `tools/boats/ringnot38.py` bygger en flerbruks ringnot- og
  snurrevadbåt etter byggerapporten og fotografiene av en ekte båt (grunnlaget og alle målene står i
  `docs/skipsmodeller/sulebas-pilot-grunnlag.md`, kap. 4.0 og 7.1). Det som skiller henne fra de andre skriptene, og som er malen
  for båtene etter henne: skroget er én glatt flate der bulben er slått sammen med forskipet med en myk overgang (`smax`), siden
  er usymmetrisk (åpent arbeidsdekk på styrbord med lav skansekledning, lukket kasse på babord), alle åpninger i skrog og rekke er
  ekte hull skåret med boolsk utskjæring (`holes()`, `cutter()`, `apply_cut()`; lokket løseren legger over hullet, slettes) med
  lysning og rom, lameller, glass eller anker bak, kritikksløyfen (rendring fra fotovinklene, overlegg mot sidebildet i målt
  skala, klasjsjekk, punkttelling) kjøres etter hver endring, og de felles beslagene i `fittings.py` brukes der de finnes
  (propell, anoder, merker, nottrakt, kraftblokk, radomer, pisker, GPS, lyskastere, leider, slangetrommel). Regel: aldri to
  flater i samme plan. Eksporten gir `lod0` rundt 117 000 trekanter, `lodm` 40 000 (Decimate, første båt som får den) og
  `lod1` rundt 13 600 punkter (den gamle 12 000-linja gjelder ikke lenger, Jonas 30.10.2026). Dataene ligger i `src/data/boat-ringnot38.b64` og `-side.b64`, i malen som `glb-ringnot38` og
  `pic-ringnot38`. Typen `ringnot38` i `VESSELS` er låst (`lock`), plassen i stigen er ikke avgjort (B1 = C).
  Kjøring: `python3 tools/boats/ringnot38.py fast export` (med `dry` for bare `tools/boats/out`). Tester: `vessel3d`, `vesseltest`,
  `brotest`, `lanterntest`.
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
- **Plastsnekka 26 fot (`snekke`, fra 13.10.2026):** `tools/boats/snekke26.py` bygger snekka etter bildene Jonas viste (en klassisk norsk familiesnekke på 26 fot fra 70- og 80-tallet; forbildet står bare i skriptets kommentar). Første forsøk ble avvist («Elendig modell. Her må du jobbe mer nøye»), så linjene er lest av bildene og sjekket mot dem fra samme vinkler. Skroget er rundbunnet med sju støpte klinkbord som løper jevnt ut mot stevnen, kraftig spring, utfall i baugen og avrundet akterende med lite speil. Et bredt marineblått bånd under ripa. Lav ruff forut med tre vinduer med runde hjørner i hver side, rundet front og luke. Tredelt vindskjerm i rustfri ramme og hardtopp på stolper over styreplassen (styrbord), med sidevinduer og skyveluke. Pulpit og rekke langs sidedekket, akterrekke, badeleider, liten haler på styrbord karm og åpen cockpit akter til redskapen (`open: true`). Dataene ligger i `src/data/boat-snekke26.b64` og `boat-snekke26-side.b64` (`glb-snekke`, `pic-snekke`). Test: `vessel3d.py snekke` (8,03 × 2,72 m).
- **Den brukte hurtigsjarken (`hurtigsjark`, fra 13.10.2026):** `tools/boats/hurtig11.py` bygger en planende sjark på 10,99 m etter bildene Jonas viste (forbildet står bare i skriptets kommentar). Knekkspantskrog med sprutlister og høy, utfallende baug med knekk der det hvite begynner. Gult skrog opp til knekken, svart scheerlist og hvitt skansekledning over. Svarte fartsstriper langs det gule, som blir til streker akterut. Rett speil, hvitt over gult, med leider og rundt lys. Styrhus forut for midten med svarte vindusrammer (fire skrå ruter foran, tre store i hver side og et stort åpent leskur akter med livbøye), tykt gult tak med visir og rekke, flåte og søkelys. Akterveggen har stålskap, splittdør med koøye og åpen nedgang. Masten har stålbein til takhjørnene forut og gule stag til takhjørnene akter (Jonas spurte hvorfor bommen hang slik; den var feiltolket og er tatt bort), salinger med arbeidslys, radarkuppel og en haleblokk i kjetting under en arm. Slank tripod-mast på babord låring. Arbeidsdekket har høy skansekledning med gelender, lukekarm av riflet plate, sløyebenk og haleport med linehaler på styrbord. Dataene ligger i `src/data/boat-hurtig11.b64` og `boat-hurtig11-side.b64` (`glb-hurtigsjark`, `pic-hurtigsjark`). Test: `vessel3d.py hurtigsjark` (10,78 × 3,92 m).
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
  - **Truckføreren** er havnearbeidernes figur (`arbeider.py`), som sitter på setet med hendene på rattet mens trucken kjører en levering (`drawUnitParts` med tida, oppgaven `drive`). Klossfiguren som satt i truckmodellen, er tatt ut (Jonas 21.10.2026, #86). En truck som står, har ingen fører.
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


## Felles beslag i båtskriptene (`tools/boats/fittings.py`, 30.10.2026)

Etter kartleggingen (`docs/skipsmodeller/kartlegging-spillet.md`, kap. 7.4 og 8.1) tegnes beslagene ett sted, i skriptets ramme
(x forover, y babord, z opp), med båtens egne materialer som argumenter: propell med vridde, skjeve blad og CPP-nav eller fast
stigning med tauvern, anoder, thrustertunnel med rist, dypgangsmerker (hver 0,2 m, hele meter som «nM»), thruster-, bulb- og
V-merker, sveisesømmer, lenseporter, piskeantenner, radomer, GPS-sopper, lyskastere, leidere med og uten bur, notgjerde, kraftblokk,
nottrakt, sidehaler, slangetrommel og støtteseil av duk (bue, hul akterlik, paneler, kantbånd og forsterkninger). `not75`,
`tral60`, `krabbe50`, `al45`, `kyst15` og `havsjark35` bruker dem; de andre skriptene tar dem i bruk når de endres. Hvert skript har
en `surf(x, z, sg)` som gir punktet, normalen og retningen forover på skroget, så merker og beslag ligger på flaten.

**Lanternene i høyden** (funnet 30.10.2026): to topplanterner står minst 4,5 m over hverandre med den akterste høyest (COLREG vedlegg
I 2(a)(ii)); snøkrabbefartøyet og autolineren hadde 2,0 og 0,9 m og er rettet. Radarer står under lanternen eller ikke foran den.

**Snøkrabbefartøyets teiner** er dekksutstyr, ikke skrog: modellen har bare plassene (`kit.pots`), og spillet tegner stablene etter
antallet om bord (`docs/systemer/redskap.md`).

## Tegnegrunnlaget for båtene (F1 i `docs/planer/grafikk-batmodeller.md`, 30.10.2026)

- **Profilen (`#prof`, `G3.prof` i `view3d/25-controls.js`, `PROF` og `PMK` i `00-head.js`):** måler hvor tida i et bilde går. Bildet er delt i ni deler (oppdatering, himmel, fjernt land, fjern sjø, nært land og trær, egen båt, flåten og ting, nær sjø, lys og glass), merket med `PMK('del')` i `frame0` (`24-cinema.js`). For hver del: tida på hovedtråden (JS) og på GPU-en med `EXT_disjoint_timer_query` (WebGL 2: `_webgl2`) der nettleseren gir den. Deretter 11 oppsett à 2,5 s innsvinging og 4 s måling: som nå, tomt bilde (ingenting tegnet: hva nettleseren og skjermen gir), pikseltetthet 0,75, 1 og skjermens egen, uten terreng, sjø, trær og nærfelt, båter, med venting på GPU-en til slutt (`readPixels`), og med en piksel lest tilbake ved hvert merke (GPU-tida per del når tidtakeren mangler). Tabellen viser bildetid, bilder/s, andel over 20 ms, JS, GPU, ventetid og oppløsning, fordelingen av bildeintervallene (144–30 Hz) og lange oppgaver, og delene live hvert annet sekund til den trykkes bort. `window.PROFR` har tallene. Av koster den én flaggtest per merke. Test: `profshot`.
- **WebGL 2 med WebGL 1 som reserve** (valg 1 A): `init` (`18-setup.js`) ber om `webgl2` først. Skyggerne er fortsatt skrevet i GLSL ES 1.00 og oversettes ord for ord til 3.00 i `compile` (`glsl3` i `01-shaders.js`: `in`/`out`, `texture()`, en egen utfarge for `gl_FragColor`, ingen `#extension`), fordi 1.00 i en WebGL 2-kontekst ikke har `fwidth`. WebGL 1-utvidelsene som er kjerne i WebGL 2 (`OES_standard_derivatives`, `OES_element_index_uint`, `ANGLE_instanced_arrays`), svarer med kjernefunksjonene når de spørres etter, så trærne, nærfeltet og vindturbinene er som før. WebGL 1 brukes der WebGL 2 mangler, med `#gl1` i adressen, og på en enhet der oppstarten på WebGL 2 har feilet (`dsb_gl1`, skyen får vite det, og siden lastes én gang til); `#gl2` overstyrer. Bildene i SwiftShader er like (avviket mot WebGL 1 er det samme som mellom to kjøringer på WebGL 2, rundt 3 % av pikslene fra animasjonen). Kontekstvalget gjelder enheten, ikke kvalitetsnivået. `G3._debug.gl2`. Test: `f1test`.
- **Detaljnivå etter avstand for egen båt** (tre trinn): `glbModel(type, lod)` gir `lod0` ved lod 2 (nær), `lodm` eller `lod0` ved lod 1 (middels) og `lod1` under 1 (fjern); de håndbygde modellene har ikke noe trinn over 1. `pvm` bygger egen båt på lod 2, `pvmHull` det middels og fjerne trinnet når de trengs (`19-wildlife-npc.js`). `ownTier` velger etter hvor lang båten er i tegningens piksler (lengde / avstand × tegningens høyde / synsfeltet, så zoom og pikseltetthet er med), med tersklene `QUAL.blod` per nivå ([nær, middels] i piksler: Lav 300/75, Middels 270/68, Høy 240/60, Ultra 135/34) og 15 % slingring så den ikke blinker; [0, 0] holder henne nær på alle avstander (av for nivået). NPC-båtene og de andre spillernes båter bruker lod 1 og 0,3 som før, altså `lodm` nær: dagens nivå (Jonas 30.10.2026). Målebenken (`#bench`) tegner alltid `lod0`.
- **Taket:** `lod0` for egen båt rundt 300 000 trekanter (900 000 punkter i spillet, der hver trekant har egne punkter), `lodm` og NPC-nær 40 000 (120 000 punkter). `vessel3d` sjekker begge. Eksporten (`export_boat` i `tools/boats/bpyutil.py`) lager `lodm` med Decimate (collapse) av den bakte nærmodellen når den har over `LODM_TRIS` = 40 000 trekanter; flatene beholder materialet (malingssonene) og hjørnene den bakte skyggen. Ingen båt er over 40 000 i dag (ringnotbåten har rundt 38 600), så `lodm` finnes ikke i noen modell ennå, og Decimate-steget er ikke kjørt; det prøves med pilotbåten (F4).
- **Ultra etter målt bildetid** (valg 2 A; før kom ultra bare når den var valgt): `auto` prøver ultra på en enhet med 32-bits indekser som har tegnet Høy over 80 bilder/s i 20 s (over 55 når ultra har holdt før), går tilbake til Høy etter 3 s under 45, og husker utfallet (`dsb_ultra`, `ULTRA_VER`) så den ikke går opp og ned; ikke innen 2 minutter etter et steg ned. `QUAL.autoU = false` slår det av. Spilleren kan fortsatt velge nivå selv. Med 20 ms på Pad 3 i dag kommer forsøket ikke i gang før det som holder bildet, er funnet (profilen).

## 5.26 Måker og halere fra Blender (03.10.2026)

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

## 5.40b Styrhuset sett innenfra: vinduene og takhøyden (21.10.2026)

Jonas så ingenting ut av vinduene i bro-visningen på den nye hurtigsjarken, og hodet til skipperen sto opp gjennom taket.

- **Innerveggen:** sju modeller (`hs11`, `kyst15`, `plast31`, `al45`, `krabbe50`, `tral60`, `not75`) hadde en mørk innervegg fra dørken til taket hele veien rundt, som skulle gi et mørkt rom sett utenfra. Spillet tegner begge sider av flatene, så den dekket vinduene innenfra. `lining()` i `bpyutil.py` lager innerveggen med åpning ved vindusbåndet der veggen har glass, og med karm over og under.
- **Takhøyden:** i `hs11` var dørken i styrhuset foredekket (`ZFD` 3,0 m), bare 1,41 m under taket, og den som står ved roret (`drawDeckCrew`, oppgave `helm`) er rundt 1,8 m. Dørken er senket til et trinn over arbeidsdekket (`ZWH` = `ZMD` + 0,25), så det er 2,05 m under taket. Konsollen, stolen og benken står på den nye dørken, og øyet i bro-visningen står i vindusbåndet over skjermene.
- **Andre båter (proben, `brotest`):** i `kyst21` var båndene under og over vinduene massive klosser, så det var 1,75 m til «taket» og konsollen var gjemt. De er nå vegger rundt et rom med gulv, 2,1 m under taket. I `tral60` sto øyet under vinduskarmen, fordi plassen ved roret var på dekket under broens hevede dørk. Den står nå på dørken. I `kyst15` sto øyet over vindusoverkanten og er senket til 1,55 m. Under hardtoppen på snekka er rorplassen laget for å sitte (øyet 1,22 m over plassen). Der sitter den som styrer (`helmsit` i `drawWorker`), med setet i øyehøyde minus 0,95 m.
- **I bro-visningen** tegnes ingen ved roret, verken skipperen eller en i mannskapet som har roret, fordi øyet står der.
- **Test:** `brotest` tar bro-visningen på hver båt med styrhus (`bro_*.png`) og sjekker at midten av bildet ikke er mørk, og at det er minst 1,85 m fra stedet ved roret (`skipperAt`) til flaten over i modellen.
