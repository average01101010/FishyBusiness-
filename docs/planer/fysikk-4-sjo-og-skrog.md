# Fysikk 4: sjøen og skroget (plan, utkast 27.10.2026)

> Planen for den neste runden med vannfysikk og samspillet mellom båt og sjø. Skrevet av økta 27.10.2026 etter `/planlegg`. **Utkast: venter på Jonas' svar på valgene i kapittel 6.** Hver fase er én økt. Status står nederst og oppdateres av hver økt som bygger en fase.

## 1. Bestillingen

Jonas 27.10.2026, ordrett: «Ytterligere forbedring av vannfysikk og hvordan båten samhandler med vannet. Mål: Vannfysikk med en høy grad av realisme.»

Med bestillingen fulgte et notat om havsimulering (JONSWAP og FFT, Gerstner, gruntvann, Jacobi-skum, 6 frihetsgrader, Kelvin og Froude, bølge–strøm, BEM og Cummins, propell, SPH, hydroakustikk, Morison, kavitasjon, ekstrembølger, squat, thrustere, kran og kjedelinje), som Jonas ba oss sjekke og vurdere, og fire videoer fra spillet chillboats.game (Instagram): kjølvannet til en planende redningsskøyte sett rett ovenfra, skumkragen rundt skroget sett skrått bakfra, en seilbåt som graver baugen ned i storsjø med vann over dekk («Intense downwind sailing physics»), og en seilbåt i krapp sjø i solnedgang («how it's going»).

Reglene som gjelder: verden går 6× (`GAME_RATE`), bølgene i ekte tid, den korte sjøen i båtens ramme (Jonas 19.10.2026, `vaer-og-hav.md` 5.20b). Fysikken i spilltid (Jonas 18.10.2026, `fysikk-og-styring.md` 5.58). Eget simulert vær, ikke live-vær (Jonas 06.10.2026). Grafikken er nesten det viktigste, men ytelsen på nettbrettet må holde (`CLAUDE.md`). Båten kantrer og synker aldri.

## 2. Slik er det i dag

Det meste av det notatet beskriver for det åpne havet og kjølvannet finnes alt, i enklere form. Kort, med filene:

- **Sjømodellen i kjernen** (`core/03b-sea.js`): vindsjø etter JONSWAPs vekstlover mot strøklengde (`fetchAt`, `Hs = 0,0016·U·√(F/g)`, `Tp`), tak etter WMO per Beaufort-styrke, dønning som eget system (`swellOpen`, `swellFactor`), Douglas-sjøgang (`seaState`), retningsfaktorene for fartstap etter Kwon (`seaDirF`). `hsParts`/`seaPartsNear` gir høyde, periode og retning for begge systemene der båten er.
- **Havet i 3D** (`view3d/14-sea.js`, `01-shaders.js` `SEA_VS`/`SEA_FS`, `17-draw.js` `drawSea`): 13 Gerstner-bølger (10 vindsjø 96–6,4 m fra to spektre blandet etter bølgealder, 3 dønning), amplituden per piksel fra sjøtilstandsteksturene (roten av strøklengden per 10°-sektor og dønningsfaktoren, `ssAt`), bølgegrupper, bratthet `Q`, 8 analytiske krusninger, vindkast og kattepoter, skumtopper med Monahans dekning som terskel på kammene, skumstriper fra liten kuling, sjørokk og dis, brenninger på vannlinja fra dybdeteksturen (`uHgt`), nærfeltet (bølge 4–9 og krusningene følger båten med 5/6, `nfStep`), myke overganger, og reservene for svake GPU-er (`SEA_VS_LITE`, `BASIC_VS`, `dsb_sea`). Flaten er 600 m med 4 m-celler (2 m på ultra), og fjernpassen har de fire lengste bølgene. `seaH` er CPU-speilet av det som tegnes.
- **Båtens egne bølger** (`WAKE_GLSL`, `updateWake`, `wakeHFast`): Kelvin-mønsteret (tverrbølger 2πv²/g, skråbølger 35°), regimene etter Froudetallet, baugbølgen som klatrer stevnen og løper akterover i 25°, hvit brytning av baug- og hekkbølgen når de er bratte, skumstripa `TRAIL` (to armer, borte etter 10 s, `24-cinema.js`), propellbobler (6 s), sprøyten som punkter (700) når baugen stuper, hanekam bak påhengsmotoren.
- **Skroget i sjøen i 3D** (`view3d/16-motion.js` `updateBoat`): hiv, stamp og rull som dempede svingere med egenperiodene fra `stabOf` (`core/03c-stability.js`), sjøen snittet over vannlinja i 3×3 punkter, de lange bølgene og dønningen glattet (de møtes 6× for ofte), nærfeltet rett på, trim etter farten, krenging i sving, slagside for vinden, rulledemping etter Ikeda. Skroget følger overflaten; ingen oppdriftskraft regnes.
- **Manøvreringsmodellen** (`core/16b-dyn.js`, Fysikk 1–2): surge, sway og gir i spilltid, Clarkes deriverte, ror i propellstrømmen, skyvkraft mot kvadratisk motstand kalibrert til toppfarten, sjøens tak etter retning, vindkreftene, bølgedriften, propellen i lufta, skruevirkningen, giring i sjøen, kontakt med kaier, drift i ro.
- **Skade** (`core/16c-hull.js`, Fysikk 3): støt, grunnstøting, lekkasje, pumpe, verft, kasko.
- **Tester:** `sea3d` (15 min, 3D: ingen hopp, skumdekket mot Monahan, le og lo, kjølvannet for skiff, sjark og kyst21, rullingen som svinger), `dyntest` (uten 3D: kalibreringstabellen, sjøen etter retning, driften, skruevirkningen, propellen i lufta), `stabtest`, `trackfollow`, `helmjit`, `hulltest`.

## 3. Notatet, punkt for punkt

Fysikken i notatet er stort sett riktig. Det som ikke stemmer, eller ikke passer spillet, står i tabellen. «I dag» er det spillet har, «Planen» hvor det havner.

| Påstand i notatet | Stemmer? | I dag | Planen |
|---|---|---|---|
| FFT-sjø fra et statistisk spektrum er standarden; JONSWAP passer norskekysten bedre enn Phillips (strøklengdebegrenset, spissere) | Ja. Nyanse: JONSWAP gir et *spissere spektrum* (γ ≈ 3,3); de skarpe kammene og de brede dalene kommer av ulineariteten (Gerstner/Stokes), ikke av spekteret. | JONSWAPs vekstlover og WMO-taket i kjernen; 13 Gerstner-bølger i skyggeren, ikke FFT | Valg 1. Gerstner-summen forbedres (F3); FFT måles for seg (F6) |
| Gerstner-forskyvning gir skarpe topper | Ja | Finnes (`Q`, `steepOf`) | Beholdes; brattheten følger bølgealderen (F3) |
| Dispersjonsrelasjonen ω² = gk·tanh(kh); shoaling og refraksjon mot land; dybden som parameter i FFT-gridet | Ja for fysikken. En FFT-flis forutsetter samme dybde overalt, så dybdeavhengigheten må legges utenfor FFT-en (eller flere fliser per dybdeklasse). | Dypvannsdispersjon overalt; brenninger bare på selve vannlinja; `exposure`/`swellFactor` demper dønningen mot land | F4 |
| Brytning når Jacobi-determinanten J ≤ 0; skum og energitap derfra | Ja. J ≤ 0 er selvkryssing; i praksis settes skum fra J under rundt 0,5. For en Gerstner-sum er J analytisk og billig. | Skum statistisk på de høyeste kammene (Monahans dekning som terskel) | F3 |
| Stivt legeme med 6 frihetsgrader, trykket integrert over skroget (hydrostatikk + Froude-Krylov), demping og tilleggsmasse | Ja | 3 frihetsgrader vannrett i kjernen (spilltid); hiv, stamp og rull følger overflaten som dempede svingere i 3D | Valg 2. F2: oppdrift per skrogsnitt i 3D for hiv og stamp; rull som i dag; kjernen beholder sine 3 |
| Kelvin-kilen 19,47° uansett fart; Froudetallet; skrogfart ved Fr ≈ 0,4; motstanden stiger bratt mot skrogfart; hekkbølgen som vann som fyller tomrommet | Ja. 19,47° gjelder dypt vann; ved Fr over rundt 0,5 ser kilen smalere ut (Rabaud og Moisy 2013), og på grunt vann videre. «Eksponentiell» er løst sagt; bølgemotstanden går som Fr⁴–Fr⁶ med kneiker. | Kelvin-mønsteret, Fr-regimene, baugbølgen, hvit brytning og skumstripa finnes. Motstanden i modellen er kvadratisk, uten kneik ved skrogfart | F1 (skummet), F5 (kneika) |
| Bølge–strøm: Doppler-skift ω = σ + k·U; motstrøm gir kortere, brattere og farligere sjø | Ja | Ingen strøm på bølgene; `curAt` er en forenklet strøm bare for ankeret | Ikke i denne planen (valg 5) |
| Sanntidsdata: GRIB fra Frost API eller BarentsWatch inn i skyggerne | Delvis feil: Frost gir observasjoner som JSON, ikke GRIB; varslene ligger på MET sin thredds-tjener og api.met.no. Og det strider mot Jonas' valg 06.10.2026 (eget simulert vær, én felles klokke som går 6×). | Simulert vær per sted fra klimanormaler, lavtrykk på spor | Ikke med |
| BEM-beregnede RAO-er og Cummins-ligningen med retardasjonsfunksjon | Riktig fysikk, men krever et BEM-program og skrogformer vi ikke har; gevinsten over riktig tilleggsmasse og demping er liten i et spill | Tilleggsmasse 0,8 i hiv, Ikeda-demping i rull | Ikke med; tilleggsmasse og demping settes i F2 |
| Medstrømsfaktor og propelleffekt (prop walk), særlig akterover | Ja | Skruevirkningen finnes (7 % av skyvkraften akterover, 1,2 % forover) | Ikke mer nå |
| Grønn sjø og sjøsprøyt med SPH i et lokalt 3D-grid | Riktig fysikk, men ikke mulig på plattformen (én HTML-fil, WebGL, nettbrett, JS på CPU) | Sprøyt som punkter | Slamming med hvitt vann i F2; vann over dekk eventuelt senere som enkel dekksvask, aldri SPH |
| Hydroakustikk: Medwins formel, Snells lov, skyggesoner for ekkolodd og USBL | Riktig fysikk, men det er ikke vannfysikk for skroget, og usynlig for spilleren | Ekkoloddet er et spillverktøy | Ikke med |
| Morisons ligning for liner og kjettinger, lumped mass | Ja | Ankerkjettingen tegnes som kjedelinje (`ANC3`) uten krefter tilbake på båten | Ikke med (hører til redskap i sjøen og havsteget) |
| Kavitasjon (σ) og ventilasjon, thrust breakdown, tap av rorvirkning | Ja | Ventilasjon finnes (propellen i lufta: −60 % skyv, −50 % ror) | Ikke mer nå |
| Ekstrembølger: NLSE og modulasjonsustabilitet; en stokastisk forsterkning der bølgesystemer krysser over dybdegradienter | Ja i fysikken; forenklingen er fornuftig. «Strukturell kollaps» strider mot regelen om at båten aldri synker | Bølgegrupper (`grp`) | F7 (valgfri), med skade etter Fysikk 3 |
| Squat etter Barrass; bankeffekten i trange sund | Ja (Barrass: nedsynking Cb·V_k²/100 m i åpent, grunt vann, Cb·V_k²/50 i trangt farvann) | Ikke med; grunnsjekken bruker dypgangen i ro | F5 |
| Thrusterdegradering og Coanda-effekten | Ja, men ingen båt i spillet har thruster | — | Ikke med |
| Kranløft flytter KG til krantuppen; kjedelinje; snap-loads | Ja | Last på dekk i `stabLoad`; ingen hengende last | Ikke med (eget prosjekt med havsteget) |

## 4. Videoene: det de viser som vi mangler

- **Kjølvannet ovenfra** (video 1 og 2, planende skøyte i 25–30 knop): to hvite armer av skum som starter der sprøyten fra kimmingen treffer vannet, et turbulent hvitt bånd midt bak hekken (propellstrømmen og hekkbølgen), og alt varer i flere hundre meter før det blekner gradvis med en frynsete kant. I sving bøyer hele stripa seg med sporet. Hos oss: skumstripa er to smale armer som er borte etter 10 s (rundt 115 m i 23 knop), propellstrømmen er bare bobler, og kanten er jevn.
- **Skumkragen rundt skroget** (video 2 bakfra): en bred, tett hvit krage fra baugen og langs hele skutesida ved fart, som løfter seg i et sprøytteppe fra baugen og legger seg som skum bak. Hos oss: baugbølgen er en kam i geometrien, sprøyten er punkter, og det er lite skum inntil skroget.
- **Baugen i storsjø** (video 3): båten surfer ned en bølgerygg, graver baugen ned i neste, og det slår opp en vegg av hvitt vann som skyller over dekket; skroget sitter tungt i vannet. Hos oss: skroget følger overflaten og graver seg aldri ned; sprøyten kommer når baugen stuper, men uten hvitt vann rundt skroget.
- **Sjøen i seg selv** (video 3 og 4): krappe kammer med skum som blir liggende og drar ut i striper med vinden, og bølgene har skarp rygg og flate daler. Hos oss: skumtoppene er flekker som sitter på kammen og forsvinner med den; stripene kommer først i liten kuling.

Skjermbilder av spillets sjø i dag ligger i `tests/out/` etter `sea3d` (`sea3d_wake.png`, `sea3d_bf.png`); økta 27.10.2026 tok egne (skiff 18 knop ovenfra og bakfra, sjark 8,5 knop i Beaufort 5 og 7, kyst21 i Beaufort 6, sjarken i ro tvers i kuling), se kapittel 9.

## 5. Fasene

Hver fase passer én økt, bygges bak et flagg i adressen der det er mulig (`#foam0`, `#hull0`, som `#nf0` i dag), så før og etter kan sammenlignes på nettbrettet, og avsluttes med bilder før og etter, `sea3d` eller `dyntest` etter hva den dekker, patchnotes, systemdokumentet og `BACKLOG.md`.

### F1. Skumkartet: kjølvannet, skumkragen og skum som blir liggende

- **Hva:** et skumkart som følger båten: en tekstur (RGBA8, rundt 512×512 over 400 m, 0,8 m per piksel) som tegnes til hvert bilde med to pass: (1) det gamle kartet flyttet med båtens forflytning i hele piksler, dempet (tidskonstant 15–25 s for kjølvannet, 4–8 s for skumtopper) og drevet litt med vinden (striper); (2) nytt skum lagt inn der det lages: skumkragen langs vannlinja (sterkest der baugbølgen forlater skroget og ved hekken), de to armene der Kelvin-bølgene bryter (dagens terskler `uWk3`), propellstrømmens bånd bak hekken, skumtoppene (fra F3 når den kommer; til da dagens terskel), og sprøytpunktene der de treffer vannet. Havskyggeren leser kartet med ett teksturoppslag i nærpassen, legger dagens flekkstøy over så skummet får struktur, og lyser det som dagens skumfarge `fc`. Sjøen under skummet blir lysere og mattere (mindre speiling). `TRAIL` og boblene går over til å være punkter som *legger inn* skum, ikke egne striper.
- **Fysikken bak:** skummets levetid på havet er 10–30 s for bobler i et kjølvann (lengre bak store skrog), og det driver med vinden.
- **Filer:** `view3d/14-sea.js` (nytt `FOAM`: teksturene, rammebufferne, `foamStep`, `foamAdd`), `01-shaders.js` (`SEA_FS` leser kartet; to små skyggere for passene), `17-draw.js` (`drawSea` binder kartet), `24-cinema.js` (skumstripa og sprøyten legger inn skum), `18-setup.js` (reservene: uten rammebuffer er kartet av, sjøen som i dag).
- **Tester:** `sea3d` (kjølvannsbildene får en ovenfra, og en måling av hvit andel i et felt bak hekken etter 20 s), `dbg23o`. Nytt flagg `#foam0`.
- **Måles:** millisekunder per bilde for de to passene (`#fps` på nettbrettet, før og etter), hvor langt stripa synes bak skiffen i 18 knop og sjarken i 8,5 (mål: 300 m og 150 m), at ingen GL-feil kommer på nivå 1 og 2 (`seatrytest`).

### F2. Skroget i sjøen: oppdrift per skrogsnitt

- **Hva:** hiv og stamp i 3D regnes av krefter, ikke av overflatefølging: skroget deles i 7–9 snitt langs lengden (tre søyler på tvers for rullmomentet), hvert med bredde og dybde fra en parametrisk skrogform av `VESSELS` (lengde, bredde, dypgang, blokk-koeffisient, baug- og hekkpunktene i `GEO`). I hvert snitt leses vannhøyden (`seaH`, med nærfeltet rett på og den lange sjøen glattet som i dag), og oppdriften er ρ·g·det neddykkede arealet; Froude-Krylov tas med som Smith-effekten (e^(−k·d)) for den korte sjøen. Tilleggsmasse 0,8 i hiv og den tilsvarende i stamp, demping som bølgedannelse (satt så egenperiodene i ro blir `stabOf` sine, Tz ± 15 %). Planende skrog får dynamisk løft av farten (forenklet Savitsky), som erstatter dagens faste trim. Rullet beholdes som i dag (GM, bølgehellingen, Ikeda), fordi det er kalibrert mot IMO-periodene og måles i `sea3d`.
- **Det gir:** baugen graver seg ned når et snitt er helt under (oppdriften mettes), hekken løftes i medsjø, stevnen slår i sjøen (slamming: når baugsnittet treffer vannet med relativ fart over en terskel, rundt 2 m/s for sjarken), med sprøytsky, skum rundt baugen (F1) og lyd; skiffen i 18 knop i krapp sjø slår; sjarken i 6 m motsjø tar sjøen over bakken.
- **Spilltid:** kjernens `motionAt` (arbeid, varsler) og 3-DOF-modellen rører vi ikke; det hun opplever i 3D er bildet av den samme sjøen. Slammingen bokføres (`S.incidents`), og først i F7 får den konsekvens.
- **Filer:** `view3d/16-motion.js` (`updateBoat`), `core/03c-stability.js` (`hullSections(type)`), `view3d/24-cinema.js` (sprøyt og lyd ved slag), `vessel3d.js` (bare om `GEO` trenger et punkt til).
- **Tester:** `sea3d` (rullingen som svinger må stå; nytt: sjarken i ro i stille vann ligger på samme dypgang ± 5 cm og hiver med Tz ± 15 % når hun slippes fra 0,3 m), `trackfollow`, `helmjit`. Flagg `#hull0`.
- **Måles:** sjarken i 3,5 m sjø (som 19.10.2026: rull 10° tvers, hiv 1,0–1,2 m), stamp og hvor ofte hun slår i 6 m motsjø, og at ingenting rister i havn (`moortest`).

### F3. Brytning og spekteret

- **Hva:** Jacobi-determinanten av Gerstner-forskyvningen regnes per piksel (analytisk, tre ekstra ledd per bølge), og skum lages der J faller under en terskel som følger brattheten, lagt inn i skumkartet (F1) så det blir liggende og driver med vinden. Monahans dekning beholdes som *kalibreringsmål*: terskelen settes så den tegnede andelen hvitt treffer Monahan innenfor faktor to i 8–25 m/s, som `sea3d` måler i dag. Skummets utseende etter bildene i kapittel 9: lagt inn med skarp forkant på kammen som bryter, med en hale som blekner og driver med vinden (kartet fra F1), og støyen i kornet 0,3–3 m i stedet for dagens 5–10 m-flekker. Sjørokk fra kammer som bryter (fra Beaufort 7, i dag jevnt fra 8). Spekteret: amplitudevektene får JONSWAPs form (γ = 3,3) i stedet for dagens log-normale, retningsspredningen cos^2s per komponent etter bølgealder (ung sjø smalere), brattheten `Q` nær grensen i ung, strøklengdebegrenset sjø og slakere i utvokst, og om budsjettet tåler det, to komponenter til mellom 6 og 20 m (der kammene i video 3 og 4 ligger). Fjernpassen rører vi ikke.
- **Filer:** `01-shaders.js` (`SEA_FS`: J, skum inn i kartet; `SEA_VS_WAVE` om komponenter legges til), `14-sea.js` (`specW`, `WL`, `WOFF`), `sea3d.py` (skummålet står).
- **Tester:** `sea3d` (ingen hopp, skumdekket, bildene), `skytest` (deler skyggerfila).
- **Måles:** andel hvitt mot Monahan ved 8, 12, 17 og 25 m/s; bildetakten før og etter på nettbrettet; den lengste skyggerlinja (Adreno 642L lenket ikke dagens sjø, så `dsb_sea`-trappa må virke som før, `seatrytest`).

### F4. Kystnær sjø: shoaling, brytning og refraksjon

- **Hva:** innenfor det nære terrenget, der dybden finnes per piksel (`uHgt`, i dag bare til brenningene på vannlinja), får bølgene gruntvannsoppførsel: amplituden vokser etter Greens lov ((L/4h)^(1/4) fra dybden L/4) og brytes ved H = 0,78·h (McCowan) med skum inn i kartet og kammen kappet; bølgelengden komprimeres synlig (forskyvningen og normalen skaleres med k_h/k fra ω² = gk·tanh(kh), ikke fasen, som ville hoppe over dybdegradienter); retningen bøyes mot land over de siste to bølgelengdene (mot gradienten av `coastDist`, som sjøtilstandsteksturen får i den ledige kanalen). Dønningen får det samme, så den ruller inn parallelt med stranda. `seaH` på CPU får det samme fra `depthF`, så skroget og bøyene stemmer med bildet ved land.
- **Filer:** `01-shaders.js`, `14-sea.js` (`seaDisp`, `ssWork`: dybden/avstanden til land i kanal A), `17-draw.js`.
- **Tester:** `sea3d` (bildene i le og lo får en strand i kuling: yttersida av Husøy), `coast3d`, `landtest`.
- **Måles:** bølgehøyden over en 3 m grunne mot 20 m dypt vann ved samme vind (mål: 1,3–1,5× før brytning), at ingenting endres på dypt vann (samme `seaH` som før på Husøy-feltet, ± 1 cm), bildetakten.

### F5. Motstand, grunt vann og bankeffekt (kjernen, spilltid)

- **Hva:** (1) bølgemotstand med kneik rundt Fr 0,4–0,5 i `dynPar` (C_w(Fr) som Fr⁴ med en topp ved 0,45), kalibrert som i dag så full gass fortsatt gir toppfarten (`dynCal` løser `k2` på nytt); det endrer formen på akselerasjonen og gassen som trengs i hver fart: deplasementsbåtene henger ved skrogfart, de planende går over kneika. Drivstoffet rører vi ikke (kalibrert i økonomien). (2) Squat: effektiv dypgang + Cb·V_k²/100 (×2 i trangt farvann: sund smalere enn 8 bredder) i `groundCheck` og i dybdevisningen, og trim i 3D. (3) Bankeffekten i `dynInt`: sidekraft inn mot land og moment som skyver baugen ut når `coastDist` på den ene siden er under tre bredder på grunt vann, ∝ ρ·v²·L·T·(B/d)². (4) Gruntvannsmotstand når dybden er under to dypganger (Schlichting, enkel faktor i `speedCap`).
- **Filer:** `core/16b-dyn.js` (`dynPar`, `dynInt`, `dynEnv`, `dynCal`), `core/05-vessels.js` (`groundCheck`), `ui/` der dybden under kjølen vises.
- **Tester:** `dyntest` (tabellen innenfor grensene; nytt: sjarken i 8 knop over 1,9 m tar bunnen, over 2,3 m ikke; sjarken langs kaimuren i 6 knop giret 3–8° ut), `helmtest`, `trip2`, `autonavtest`.
- **Måles:** t90 og stopp per båt mot tabellen 19.10.2026; `progweek` og `simday` innenfor ±3 % (turtidene regnes av `sailV`, som ikke endres).

### F6 (valgfri). FFT-sjø: én økt med måling

- **Hva:** en prøve, ikke et bytte: en worker regner JONSWAP med retningsspredning som to FFT-fliser (128², 250 m og 40 m) hvert bilde (CPU, rundt 3–6 ms i en worker), lastet opp som teksturer; hjørneskyggeren leser dem (krever teksturer i hjørneskyggeren, som Adreno 642L ikke har: den beholder Gerstner), `seaH` leser samme tall på CPU, nærfeltet blir en forskyvning av oppslaget i den korte flisa. Måles mot dagens sjø på nettbrettet (bildetakt, minne, opplastingstid) og i bilder.
- **Så avgjør Jonas** om FFT-en tar over for den fulle sjøen (med Gerstner som reserve) eller legges bort. Først etter F1–F3, fordi skumkartet og Jacobi-skummet virker med begge.

### F7 (valgfri). Brottsjø og slamming med konsekvens

- **Hva:** en sjelden ekstrembølge i grov sjø (Hs over 3 m der vindsjø og dønning krysser med over 60°): en bølgegruppe på rundt 2·Hs går gjennom, varslet av mannskapet («Brottsjø forut, hold baugen opp!»), tegnet som en forbigående komponent i 3D (lik for alle som ser samme sted, fra verdensklokka). Tar hun den tvers eller akterfra, får skroget et støt etter Fysikk 3 (`hullHit` med sjøens energi), redskap på dekk kan gå over bord, og mannskapet får en skrekk (trivsel). Slammingen fra F2 får samme vei: gjentatte harde slag i høy fart gir skrammer og skade. Hun synker aldri.
- **Filer:** `core/03b-sea.js` (hendelsen), `view3d/14-sea.js`, `core/16c-hull.js`, `core/14-crewlife.js`.
- **Tester:** `hulltest`, `seatest`.

Rekkefølgen er F1, F2, F3, F4, F5, så F6 og F7 om Jonas vil. F1 og F2 kan bytte plass (valg 7).

## 6. Valgene

1. **Bølgefeltet.** A: Gerstner-summen forbedres (F3), FFT måles for seg (F6) etterpå. B: FFT i en worker med en gang, Gerstner som reserve. C: FFT på GPU-en med ping-pong-pass. **Anbefalt A.** Skumkartet og Jacobi-skummet gir mesteparten av det videoene viser, virker på nettbrettet med dagens reserver, og FFT-en kan prøves med måling når det andre er på plass. C frarådes: sjøskyggeren lenker alt ikke på Jonas' telefon, og flere pass per bilde er det som koster på en mobil GPU.
2. **Skroget.** A: overflatefølgingen forbedres (baugen ned ved høye kammer, slag fra relativ fart), ingen krefter. B: oppdrift per skrogsnitt for hiv og stamp i 3D, rull som i dag, kjernens 3 frihetsgrader uendret (F2). C: full 6-DOF i kjernen i spilltid, 3D følger den. **Anbefalt B.** C ville møte bølgene 6× for ofte igjen («rister voldsomt», 03.10.2026) eller kreve at bølgene går i spilltid, som Jonas sa nei til 19.10.2026.
3. **Skummet og kjølvannet.** A: skumkart som følger båten (F1). B: dagens striper og partikler bygges videre. **Anbefalt A.** Det er slik kjølvannet i videoene er laget, og det gir skumkragen, det lange sporet, svingen og skum som blir liggende, med ett teksturoppslag i havskyggeren.
4. **Kystnær sjø** (F4). A: ja. B: nei, bare åpent hav. **Anbefalt A**, som fase fire: brenningene og dønningen som ruller inn parallelt med land er det en ser mest av langs kysten.
5. **Strøm og tidevannsstrøm på bølgene.** A: egen fase i denne planen. B: ikke nå, egen plan senere (som 5.59 sa). **Anbefalt B.** Det trenger et strømfelt for hele kysten (fra tidevannets fase og sundenes form, ingen åpne data for det), og det er et eget prosjekt.
6. **Ekstrembølger** (F7). A: ja, med skade etter Fysikk 3 og varsel fra mannskapet. B: nei. **Anbefalt A**, sist, og liten.
7. **Rekkefølgen.** A: skummet og kjølvannet først (F1), så skroget (F2). B: skroget først. **Anbefalt A**: F1 synes straks og er avgrenset til 3D; F2 bruker skummet til slagene.
8. **Det som tas ut** av notatet: BEM og Cummins, SPH, hydroakustikk, thrustere og Coanda, kran og kjedelinje, kavitasjon, sanntidsdata. **Anbefalt: tas ut.** Si fra om noe av det skal inn likevel.
9. **Spill eller bare bilde.** A: F1–F4 endrer bare det en ser og hører; det som gir konsekvens (slag, brottsjø) kommer i F7 og går gjennom Fysikk 3 og mannskapet. B: slag og vann over dekk får konsekvens alt i F2. **Anbefalt A**: kjernen i spilltid holdes lik for alle spillere, og konsekvensene kommer samlet.

Spørsmål uten A/B:

- Hva i videoene veier tyngst for deg: kjølvannet ovenfra, skumkragen rundt skroget, baugen som graver seg ned i storsjø, eller sjøens eget utseende? (Svaret styrer hva F1 og F3 bruker tiden på.)
- Hvilke enheter måler vi på? Nettbrettet (merke og modell) og Galaxy A52s. Kan du sende `#fps`-tallet fra sjøen i dag (åpent hav, kuling) før F1 starter, så vi har et nullpunkt?
- Skal `#foam0`/`#hull0` (av-bryterne) bli stående etter at fasen er levert, som `#nf0`, eller tas bort?

## 7. Antatt og usikkert

- Skrogformene under vann er anslått (parametrisk av `VESSELS`); GLB-modellene har ikke snitt vi kan lese. F2 kalibreres mot `stabOf` sine perioder, ikke mot tegningene.
- Skumkartets kostnad på nettbrettet er ikke målt: to små pass og ett oppslag til i havskyggeren. Får Adreno 642L problemer, er kartet av der (sjøen som i dag).
- Jacobi-terskelen må kalibreres mot Monahan; det kan koste en runde med `sea3d` (15 min) per forsøk.
- Shoaling uten faseintegrasjon (F4) er en tilnærming: bølgene blir kortere og brattere i bildet, men fasen følger dypvannsfarten. Over en lang, slak strand kan det synes som at kammene går litt for fort inn. Det riktige (å integrere k langs strålen) hører til en FFT-løsning med flere fliser, og er ikke verdt det nå.
- Barrass' formel er laget for skip; for en sjark på 10 m er squaten liten (0,3 m i 8 knop) og trolig i overkant. Det er en forsiktig feil.
- Froudetallet som styrer kneika regnes av lengden i `VESSELS` (lengde over alt), ikke vannlinjelengden; for en sjark er forskjellen rundt 5 %.
- Toppfartene i `VESSELS` står (Jonas' tall), så kneika endrer bare veien dit.

## 8. Det planen ikke gjør

- Ingen live-data (Jonas 06.10.2026) og ingen endring av 6×-klokka eller nærfeltet (19.10.2026).
- Ingen SPH, ingen BEM, ingen 6-DOF i kjernen, ingen thrustere, ingen hydroakustikk, ingen kranfysikk, ingen Morison på redskap.
- Fjernpassen (sjøen utenfor det nære terrenget) endres ikke.
- Kjernens `motionAt`, fangsten og økonomien kalibreres ikke på nytt; `simday` og `progweek` skal stå innenfor ±3 %.
- NPC-båtene får skumkartet bare for skumkragen og et kort spor (ikke per båt i hele flåten), og ingen oppdriftsmodell; de følger overflaten som i dag.

## 9. Bilder fra i dag (27.10.2026)

Økta tok bilder av dagens sjø i testnettleseren (SwiftShader: tregt, men tegnet som på en GPU) for å sammenligne med videoene: skiffen i 18 knop i Beaufort 3 (ovenfra, bakfra), sjarken i 8,5 knop i Beaufort 5 og 7–8 (ovenfra, fra låringen, fra baugen, fra siden) og kyst21 i Beaufort 6. Bildene ligger ikke i repoet. Det de viste:

- **Kjølvannet ovenfra** er to tynne rekker av skumprikker langs Kelvin-armene og en smal stripe av bobler midt bak, i begge båtene. Videoenes brede, hvite V og det turbulente båndet finnes ikke. Fra låringen er Kelvin-tverrbølgene bak sjarken gode, og det er et lite hvitt felt ved hekken.
- **Skum rundt skroget** er en tynn hvit strek langs vannlinja og noen sprøytprikker ved baugen i Beaufort 5; i Beaufort 7–8 lite mer. Skroget sitter riktig i vannet (sjarken krenger 5° for vinden, hiver og stamper), men ingenting av videoenes skumkrage og sprøytteppe.
- **Skumtoppene** er store, glatte, hvite flekker (5–10 m) som ligger flatt på sjøen og ser like ut i Beaufort 5 og 8; i videoene er skummet finkornet, med skarp forkant på kammen og en hale som drar ut i striper med vinden. Det er et spørsmål om *hvor* skummet lages (på kammen som bryter, så det ligger igjen og driver) og om kornet i støyen (0,3–3 m, ikke 5–10), og det hører til F1 (kartet som husker) og F3 (Jacobi-terskelen og støyen).
- **Kammene** er runde og lange; sjøen i Beaufort 8 ser ut som glatte åser med flekker på, mens videoenes sjø er krapp og kort-kammet med mange retninger. Det er retningsspredningen og brattheten (F3), og det er grensen for 13 komponenter (F6 måler om FFT gir mer).
- I Beaufort 7–8 snudde simuleringen sjarken hjem av seg selv («Returnerer», været over båtens grense), som den skal. Sjøen var 5,3 m.

## Status

- 27.10.2026: utkast skrevet, med gjennomgangen av notatet og videoene. **Venter på Jonas' svar på valgene 1–9 og spørsmålene uten bokstav.** Ingenting er bygd.
