# 3D-verdenen: terreng, lys, kamera og himmel

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.11 3D for hele kysten (kystplanen, fase K8, 02.10.2026)

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

## 4.11b Bakkens materialer i skyggeleggeren (Jonas 18.10.2026)

Jonas så en video om teksturflising og spurte om verden kunne bli penere. Vi har ingen fliser: bakken ble farget per punkt i nettet (12–47 m mellom dem) og så glattet. Det som manglet, var materiale, ikke variasjon. Rammene fra Jonas: terrenget er viktigst («arbeidsplassen er naturen og båten»), og spillet skal gå jevnt på telefoner, nettbrett og i nettleser.

- **Punktene** (`recolor` i `view3d.js`) gir nå vegetasjonsfargen (`aCol`) og et vektsett `aMat` = (berg, skog, snø, havnefylling). Berget og snøen legges på først i fragmentskyggeleggeren (`terFS`), så kantene kan skjerpes per piksel.
- **Tre trinn** etter kvaliteten (`MATQ` som `#define`, ett program per trinn, kompilert ved første bruk, `terProg`; et trinn driveren ikke vil kompilere, faller tilbake til det under):
  - **0 (lav):** den gamle blandingen av punktfargene, like billig som før.
  - **1 (middels):** en langsom variasjon i tone og lysstyrke over 128 og 512 m (så ingen to åssider er like); berget der bakken bratner, uten mønster på 20–60 m (første utkast la en terskel på slik støy, og en jevnt bratt fjellside i Lofoten ble til kamuflasjeflekker; Jonas: «Hva er greia med disse mønstrene?»): brede soner på om lag 160 m (strukket 2:1 nedover fallinja) skyver bergvekten mykt, geometriens egen helning legges til, og på de bratte flatene ligger tynne hyller med torv langs kotene; en skarp, flekkete snøkant med egen ustrukket støy (strukket bøyde den seg til bånd langs kotene der helningen dreide) og uten snø på det bratteste. Bergets relieff forsterker normalstøyen, snøen demper den.
  - **2 (høy og ultra):** innenfor 250–1 000 m i tillegg et fint mønster av berghyller og tuer (1,5–4 m, leses som struktur, ikke mønster), bergets sprekker (tynne linjer der en støy krysser midten, i tre projeksjoner vektet med normalen, så en fjellvegg ikke smøres ovenfra) og blokker, lav på de slakere flatene, gress og lyng i tuer (to skalaer), lyng på de tørrere skråningene, myr på flat lav mark under 70 m, og småstein der berget er halvt. Alt blandes inn etter avstanden, så ingenting popper.
- **Mediump:** verdenskoordinatene foldes med `mod(…, 4096)` og `mod(…, 16384)` før støyen, og de langsomme skalaene deler 16384, så det blir ingen søm.
- `MATP` (`G3._debug.matp`, `uMP`/`uMQ`): sonenes styrke, hyllene, det fine mønsteret, helningens vekt; terskelbredden, snøens forvrengning, strekket nedover fallinja. Valgt fra variantark (`matvar.py` i kladdemappa: seks varianter per sted i ett bilde). `#mat0`, `#mat1`, `#mat2` i adressen låser trinnet for sammenligning. Bilder før/etter ligger i økta (Senja, Lofoten, Bergen, Finnmark, Senja om vinteren); verktøyet var `terrshot.py` i kladdemappa.
- **Ikke gjort ennå:** ur ved foten av stup (trenger nabolaget), detaljteksturer (256² berg/gress som krydder), fasader og tak på byggene (runde 2).

## 4.11c Arealdekket: myr, jorder, lyng, vidde, bart fjell, ur og bre fra dataene (G1, 28.10.2026)

Jonas 28.10.2026: «Grafisk overhaling av natur, miljø og omgivelser … høyest mulig nivå av realisme», og at spillerne skal kjenne seg igjen (planen: `docs/planer/grafikk-natur-og-miljo.md`, G1). Før dette ble bakkens farge gjettet av høyde, helning og støy: myr på all flat mark under 70 m, bjørk der støyen sa det, berg over 280–420 m.

- **Laget `cover`** (u8, 50 m, `view`-pakkene, samme ruter som `forest`): én klasse per rute, 1 skog, 2 lyng og kratt, 3 eng og gressmark, 4 dyrket mark, 5 myr, 6 vidde og lav, 7 bart fjell, 8 snø og bre, 9 tettsted og industri, 10 sand, 11 ur, 12 rullestein; 0 er sjø eller land uten klasse. Det lages av `cover()` i `tools/map/region.py` i tre lag, hvert over det forrige:
  1. Overtures `base/land_cover` (ESA WorldCover 10 m), **bare de detaljerte flatene** (zoom 8–15). Overture har landet to ganger; den grove utgaven (zoom 0–7) legger skog over hele Senja og gress under alt. Det gamle `forest`-laget tar begge og er derfor for raust (25 % mot 19 % av Senja-ruta); det står urørt for eldre klienter.
  2. OpenStreetMaps naturtyper (`base/land`), i Norge stort sett Kartverkets N50: myr, skog, bart fjell, ur, strand, rullestein, bre, lyng, kratt og gressmark.
  3. OpenStreetMaps arealbruk (`base/land_use`): dyrket mark, eng og gårdstun, parker, baner og kirkegårder (eng), steinbrudd (bart fjell), industri og handel (tettsted). Oppdrettsanleggene tas ikke med (Jonas 28.10.2026).
  - **Bare Norge** (Jonas 28.10.2026): `coast.py cover_tile` nuller laget utenfor norsk land (`national.norway200`), så Sverige, Finland og Russland beholder bakken som før.
  - **Senja-ruta:** ESA alene ga 1,4 % myr og én åker; med N50 er det 8 % myr, 2,2 % dyrket mark, 49 % skog, 23 % lyng og kratt, 10 % vidde, 6 % bart fjell. Et kystflis ved Bergen: 64 % skog, 25 % lyng, 4,4 % tettsted, 2,8 % dyrket mark. ESA kaller nesten alle lyngheiene og dvergbjørka på fjellet «shrub», så den klassen er lyng, ikke tett kratt.
  - **Senjas pakker** i `src/data/map` får laget av `python3 tools/map/cover.py senja` (som `deep.py`: bare `view`-pakkene skrives på nytt). Hele kysten får det fra neste kartrelease (`coast.py`, `kart.yml`). `game.py` fletter som før, blokk for blokk.
- **Spillet** (`view3d/03-berths-naust.js` `coverAt`, `coverClass`; `04-vec-packs.js` `recolor`; `01-shaders.js` `terFS`; `06-buildings-lights.js` `addTrees`):
  - Hvert punkt i nettene får andelen av hver klasse blant landrutene i de samme 4 × 4 rutene `forestAt` leser (`cv`, 12 byte per punkt), og `ck` = 1 der laget finnes. **Der en flis ikke har laget** (en release fra før, utenfor Norge), er `ck` 0, og alt er som før.
  - `recolor` farger etter klassene og årstiden (`grassNow`, halmfarget til sommergrønt): lyngheiene brunrøde til olivengrønne, vidda lys grå-grønn, myra halmgul til starrgrønn, jordene sterkt grønne om sommeren, tettstedet halvt hage og halvt grus. Skogen kommer fra skogandelen (og litt fra dvergbjørka i lyngen), ikke fra støy. Berget legges på som før etter helning og høyde (toppene er steinete selv der ESA sier lyng), og i tillegg der klassen er bart fjell, ur, rullestein eller vidde. Snøfonner og breer (klasse 8, sett i august) ligger over 120–220 m hele året.
  - Skyggeren får et nytt attributt `aCov` (myr, åker, lyng, 1 + vidde; 0 der ukjent). På høy og ultra (`MATQ 2`) ligger lyngen der lyngheia er, myra der myra er, med mørke pøler og tuer, vidda som et lyst lavteppe brutt av stein, og jordene med kjørespor hver 18. m og striper, dreid per åker. Der arealdekket er ukjent, gjelder støyreglene som før.
  - Trærne står der dataene har skog (inntil 420 m), spredt og lave i lyngen, sjeldne i eng og hager, aldri på myr, vidde, berg, ur, sand eller bre. De 900 plassene per kvadratkilometer gås gjennom i en spredt rekkefølge (397 · q mod 900), så taket på 260 trær ikke fylles i de nordligste radene først.
- **Rettet etter stikkprøvene langs kysten** (Bergen, Bodø, Reine, Hammerfest, 28.10.2026): punkter uten arealdekke (nærmere sjøen enn ESA-flatene når, eller en flis uten laget) får en anslått blanding i samme stil (den gamle skogregelen som skog, lyng under fjellet, vidde over), fordi et nett med begge stilene strakk fargen fra ett hjørne over de grove trekantene (en lys kile ved Hammerfest). ESAs lyng og vidde slås sammen og deles etter høyden (lyng lavt, lav og stein over 150–450 m, litt støy), fordi ESA trekker grensen mellom dem ulikt i hver 3 × 3-graders rute (rett kant langs 24° Ø på Kvaløya). Land uten klasse nær sjøen beholder den gamle trereglen. `coverAt` husker bare en blokksjekk som fant alle blokkene, ett sekund.
- **Byggenes høyde og takform** var med i planen for G1, men Overture har nesten ingenting av det i Norge: rundt Finnsnes har 0 av 5 704 bygg høyde, takform eller farge, og 4,7 % har antall etasjer. Det er ikke bygd.
- **Bildene** tas med `tests/terrshot.py` (båten til et sjøpunkt, kameraet mot mest land, lavt og fra drone) og settes sammen med `tests/terrpair.py`; sammenligningen før og etter ligger i `docs/pr/ccr-1d00422f-gjapvb/`.

## 4.11d Lufta og lyset: luftperspektiv, skulder mot hvitt og skodde på fjellet (G5, 28.10.2026)

Planen: `docs/planer/grafikk-natur-og-miljo.md`, G5. Før dette ble alt tonet mot én disfarge (`uFog`, himmelens horisont) etter avstanden, likt i alle kanaler, og fargene ble klippet ved 1,0.

- **`fin(c, v)`** (GLSL-biten `AIR` i `view3d/01-shaders.js`) er slutten på alle de opplyste fragmentskyggerne: terrenget, byggene (`LIT_FS`), havet (nær og fjern), båtene (`LITN_FS`) og de teksturerte flatene (`TEX_FS`, `12-skiff.js`).
  - **Luftperspektivet:** samme tetthet som før (`uFogD` fra sikten) og samme horisontfarge, men tapet er per kanal, blått mer enn rødt (× 0,8, 0,95 og 1,2), så fjerne fjell blir blå og mister kontrasten før de går i ett med himmelen (Rayleigh). Mot sola lyses disen varm med himmelens egen glans rundt sola (`uAirMie` = himmelskyggerens ledd, pow 12 × 0,35, mindre i skydekke), så landet møter horisonten i samme farge (Mie).
  - **Skulderen** (`tone`): verdier under 0,8 er uendret (først 0,6, men det bleiket himmelblåfargen), og over det bøyer de mykt mot hvitt i stedet for å klippes. Snø, skum og solbelyste skrog beholder tegningen sin. En filmisk kurve med tå (ACES) ble ikke valgt, fordi den gjør netter og skygger mørkere enn de er stilt inn etter.
  - Himmelen får den samme skulderen, så horisonten og den fjerne disen fortsatt møtes.
- **Skodde på fjellet** (i `fin()`, `uCB`/`uCC`/`uEye`; `computeEnv` i `15-env-mooring.js`): over skybasen går terrenget, trærne, husene og båtene inn i skyens grå, med samme ujevne kant for alt (støy på verdens x og z, foldet som terrengets `wp`; med en glatt kant for trærne sto de mørke inne i skya), med en ujevn underkant som stiger og synker over noen hundre meter. Skybasen er rundt 2 700 m under spredt skydekke og 250–300 m under helt grått, 150 m lavere i regn eller snø. Bare et skydekke over 55 % legger den på bakken. Fargen er horisontens grå, så skodda på fjellet er himmelens.
- **`#air0`** i adressen gir den gamle disen og ingen skulder, for sammenligning. Et program som ikke får de nye uniformene (`airSet`), tegner som før.

- **Himmelen og skyene** (resten av G5, 28.10.2026, bare med lufta på): en bred, svak glans rundt sola i tillegg til solskiva, en dypere blåfarge på motsatt side, og jordskyggen med det rosa beltet over den (Venus-beltet) på motsatt side når sola står like under eller over horisonten (`uSunD.y` innenfor rundt 4°). Skyene lyses fra sola: skystøyen leses en gang til litt mot sola, og der skya er tynnere mot sola, får kanten solens farge (sølvkant), mens den tykke midten og undersida blir mørkere grå. I helt grått vær (skydekke over 75–98 %) går det over i det jevne grå laget som før.

## 4.11e Innsjøer, elver, bekker og fosser (G2, 28.10.2026)

Planen: `docs/planer/grafikk-natur-og-miljo.md`, G2. Før dette fantes det ikke ferskvann i 3D: innsjøene var bakke i 25 m-høydene.

- **Dataene** (`tools/map/water.py`, kalt fra `coast.py vec()`): Overtures `base/water` (OpenStreetMap, i Norge stort sett Kartverkets N50) på land, som en `water`-post i flisas vec-pakke. Saltvann og flater som for det meste ligger på sjøen (landmasken), tas ikke med; flater under 150 m² er for små. Alt forenkles til 4 m.
  - **Stående vann** (innsjø, tjern, magasin): en flat flate i vannets høyde, medianen av 25 m-høydene inne i den + 0,3 m (Kartverkets terreng har innsjøene flate i vannflata). Trianguleres i rørledningen (shapely, constrained Delaunay).
  - **Elveflater** draperes på bakken (0,2 m over).
  - **Linjene** (bekk, elv, kanal og grøft) og **fossene** (punkter).
  - Hammerfest-flisa: rundt 6 000 ting, 210 kB pakket, 18 s å lage. Hele kysten fra `kart-12` (29.10.2026): vannet er 45 MB av vec-pakkenes 81 MB (rundt 270 kB per flis, Bergen 445 kB). Appen henter pakkene flis for flis etter behov (`src/pwa/sw.js`), så det er bare flisene rundt spilleren som lastes. Eldre klienter hopper over posten (`VECN` i `core/01c-vec.js` kjenner den ikke).
  - `python3 tools/map/water.py inject tools/map/out/game tx,ty` legger posten inn i en lokal spillmappe for å prøve uten en release.
- **Spillet** (`view3d/17b-inland-water.js`): et nett per flis med innsjøene og elveflatene, bygd når flisas `view`-pakke er lastet (innen 14 km, to fliser per halve sekund), og frigjort med den. Elvene og bekkene innen 3,5 km legges som bånd på bakken (bekk 2,4 m, elv 9 m, kanal 3 m), hvite der fallet er over rundt 18 % (bekkene litt mindre), og en foss som et hvitt fall ned den bratteste retningen.
  - **Skyggeren** (`vann`): mørkt, torvbrunt vann (norske innsjøer er mørke), himmelen speilet etter Fresnel, krusning som driver med vinden på innsjøene og med strømmen i elvene, solglimt, hvitt vann i strykene, og is med snø om vinteren under snøgrensen (`uIce`, `uSnowY`). Slutter med `fin()`, så lufta og skodda er den samme som for terrenget.
  - **Stående vann i spillets høyder** (rettet etter stikkprøvene 28.–29.10.2026): høydene over 10 m er lagret i trinn på 2 m (`hgtEnc`), så en innsjø Kartverket har flat, leses trappete inne i vannet. Nivået går derfor til 0,3 m over 85 %-persentilen av bakken inne i flata (midten av hver trekant og tre punkter halvveis mot hjørnene), men aldri mer enn 2,5 m over den laveste tidelen av bredden. Vann der under 70 % av punktene da ligger under nivået, og tjern under 400 m², tegnes ikke (et lite tjern i Bergen sto som en mørk kile i lia). Elveflatene deles i trekanter på høyst 12 m, så de følger bakken.
  - Tegnes etter terrenget i både det fjerne og det nære passet i `24-cinema.js`, med `polygonOffset` mot bakken.
  - `#waterA` og `#waterL` tegner bare flatene eller bare linjene og fossene, og `#waterI` farger hvert stående vann etter nummeret (r + 256 g, flisa i b), for å finne en feil i et bilde.
  - **`#water0`** i adressen tegner ikke ferskvannet, for sammenligning.
- **Ikke bygd ennå:** innsjøene og elvene i kartplotteren (2D), lyden av fosser, og sprut ved fossene.

## 4.11f Bakkens farge fra Sentinel-2 (G3, 29.10.2026)

Planen: `docs/planer/grafikk-natur-og-miljo.md`, G3. Jonas 29.10.2026: G3 avgjøres av økta ut fra bildene, og hele kysten får det om det er klart bedre. Det var det: sommermosaikken av Senja viser de grønne liene, de brune og grå fjellene, myrene, innsjøene og byene slik de er, mens arealklassene bare gir én farge per klasse.

- **Kilden:** Sentinel-2 L2A fra Element 84s åpne lager på AWS (`s3://sentinel-cogs`, lest over HTTPS uten konto). Copernicus-dataene er fri for all bruk, også kommersiell, med kilden oppgitt: «Contains modified Copernicus Sentinel data 2021-2025». Vurdert og forkastet: ESA WorldCovers årsmosaikk (CC BY 4.0, men årsmedianen har vinterens snø over det meste av fjellet), Kartverkets skyfrie mosaikker (bare handlekurv, ingen lisens oppgitt) og EOX' Sentinel-2 cloudless 2016 (lisensen kan kreve deling på like vilkår, originalene krever AWS-konto).
- **Mosaikken** (`tools/s2/s2.py`, workflowen `.github/workflows/s2.yml`, releasen `s2-N`, startes av `tools/s2/s2.json`): per flis scenene fra MGRS-rutene over den, 15. juni til 31. august 2021-2025, under 60 % skyer, de 14 klareste per rute; hver projisert til flisas 50 m-ruter i UTM 33 (GDAL tar 40 m-oversikten). Medianen av scenene der klassifiseringen (SCL) sier vegetasjon, bar mark, vann eller uklassifisert; skyer, skyskygger, snø og topografisk skygge tas ikke med. 168 fliser i 24 deler, rundt en time. `s2-1` 29.10.2026.
- **I kartdataene** (`coast.py sat_tile`, fra `kart.json` sitt `s2`): solskyggen fra opptakene tas ut (opptakene er fra rundt kl. 11, sola i sør-sørøst rundt 90 - breddegrad + 13 grader opp; hver rute deles på lyset fra 50 m-terrenget, 35 % himmel og 65 % sol, mot flat mark), så spillets egen sol ikke legges på to ganger. Pakket som i JPEG: lysstyrke `sy` på 50 m (7 bit) og fargetone `sco`, `scg` på 100 m (6 bit), som 16-biters lag med dekodingen `raw` (0,65 MB for en flis med bare land, mot 1,9 MB for tre fargekanaler). Bare norsk land; sjøen og utlandet er 0.
- **I spillet** (`view3d/03-berths-naust.js satAt`, `04-vec-packs.js recolor`): fargen leses per punkt i nettene (de fire nærmeste rutene) og blir sommerfargen, i spillets farger (`SATK`, `SATG`: en potenskurve per kanal, tilpasset seks arealklasser på Finnsnes-flisa). Årstiden legges på som klassenes farge nå delt på deres sommerfarge, så ruska, halmgult og snø kommer som før. Satellittfargen har 85 % av vekten, i tettsteder mindre (taket og asfalten tegner spillet selv). Skogens mørke legges ikke på igjen der satellitten alt ser den. `#sat0` i adressen gir fargen fra før.
- **Rettet underveis:** spillets dekoder leste alle 16-biters lag som høyder (`mapDecode`, nå `dec: 'raw'`), blokkhurtigbufferen hadde plass til 16 lag (nå 64), og sjekken av om en blokk er lastet, delte svar mellom lagene (`covBlk`, nå per lag).

## 4.11g Trærne fra trehøydekartet (G4, 29.10.2026)

Planen: G4. SR16 (NIBIOs skogkart) kan ikke hentes herfra og har ikke en åpen lisens for spill, så den åpne erstatningen er brukt (Jonas 29.10.2026: «Bruk åpen erstatning»).

- **Kilden:** Meta og World Resources Institutes trehøydekart v2 (CC BY 4.0, `s3://dataforgood-fb-data/forests/v2/global/dinov3_global_chm_v2_ml3`, 1 m, Web Mercator-fliser etter quadkey på z10), lest på 1/8-oversikten (rundt 9,6 m). Kilden som oppgis: «Canopy height: Meta and World Resources Institute (2024), CC BY 4.0». Løv eller nåler fra Sentinel-2s nær-infrarøde om sommeren (`s2.py nir`, B08): løvtrær reflekterer rundt dobbelt så mye.
- **Uttrekket** (`tools/trees/trees.py`, workflowen `trees.yml`, releasen `trees-N`, startes av `tools/trees/trees.json`): per flis andelen under trær (over 2,5 m) og middelhøyden på 25 m. `trees-1` 29.10.2026; ved Finnsnes er middelhøyden rundt 7 m.
- **I kartdataene** (`coast.py trees_tile`, fra `kart.json` sitt `trees`): laget `trees` på 50 m, u8: bit 0-3 andelen (0-15), bit 4-6 høydeklassen (under 4 m, så 4 m-trinn, 28 m og over), bit 7 nåler. Grensen for nåler er nær-infrarødt under 88 (`NIR_NEEDLE`), kalibrert på tett, høy skog: bjørka ved Finnsnes har median 103 (25-persentilen 93), grana ved Namsos 73 (75-persentilen 81), Trondheim 75 og Kristiansand 76.
- **Modellene** (`tools/wild/trees.py`, `src/data/trees.b64`): gran, furu og bjørk i to detaljnivåer, 1 m høye fra bakken. Bjørka har blad (sone 1) og kvister (sone 2) som byttes om vinteren; snø legger seg på toppen av kronene.
- **I spillet** (`view3d/17c-trees.js`): per 50 m-rute så mange trær som andelen sier (`TREE_DENS` per kvalitet: 3, 6, 10, 16 i en full rute), så høye som kartet sier (±28 %), snudd og farget litt hver. Nåletrær er gran i sør under 450 m og på god mark, ellers furu; nord for Saltfjellet mest furu. Ingen trær i fjæra (under 1,5 m), i bratt berg, på bygg, havneenheter eller steder. Tegnes med `ANGLE_instanced_arrays`, ett kall per art og detaljnivå per kilometerrute; de nære rutene (`TREE_LOD0`) får de detaljerte modellene. Uten laget (en eldre release, utenfor Norge) eller utvidelsen står de gamle kjeglene. `#trees0` i adressen gir de gamle trærne.
- **Rettet før første test:** forskyvningen ble regnet fra gjengivelsesorigo (`RO`) i stedet for øyet; skyggeleggerne tegner fra øyet (`V.m` har ingen flytting), og tåka (`fin`) vil ha avstanden fra øyet.

## 4.11h Vindturbiner og kraftspenn over sjøen (G7, 29.10.2026)

Planen: G7. NVEs lister (kart.nve.no, api.nve.no) er stengt fra containeren; OpenStreetMap i Overture (`base/infrastructure`, ODbL, som kartet alt bruker) har turbinene som står, med høyden fra Kartverkets register over luftfartshindre for de fleste, og kraftlinjene mast for mast.

- **Uttrekket** (`tools/vind/vind.py` til `src/data/vind.json`, 52 kB): turbinene (`power=generator`, `generator:source=wind`, ikke under bygging eller nedlagt) på norsk land eller i norsk sjø, i kystens fliser: posisjon, navhøyde og rotordiameter (fra `height:hub` og `rotor:diameter`; med bare totalhøyden er rotoren 0,75 av den). Ingen eier, operatør eller produsent tas med. Spennene: strekket mellom to master på en kraftlinje (`power_line`, `minor_line`) på 120 m og mer der midten krysser sjøen og begge mastene står på land; der OpenStreetMap tegner en linje per fase (Sognefjorden), blir det ett spenn. 29.10.2026: 1 228 turbiner og 735 spenn.
- **Modellene** (`tools/vind/models.py`, `src/data/vind.b64`): tårnet (1 m høyt, skaleres med navhøyden), maskinhuset med navet og bladene (1 m rotor), en stålportal for 66 kV og mer og en H-mast i tre under det.
- **I spillet** (`view3d/17d-vind.js`): turbinene innen 14 km, både i fjern- og nærpasset, snudd mot vinden der båten er; bladene går med tuppen på åtte ganger vinden fra 3 m/s opp til 80 m/s og står over 25 m/s. Om natta har de rødt hinderlys på maskinhuset, blinkende i takt på dem som er over 150 m til tuppen. Spennene innen 4 km får en mast i hver ende og tre liner med nedheng (3 % av spennet, minst 1 %), aldri under 30 m over sjøen på midten; mastene heves til det. Ett instanstegnekall per del. `#vind0` i adressen skrur det av.
- **Kartplotteren** (`ui/03-map.js`): turbinene med sjøkartets trearmede symbol, spennene som stiplet magenta luftspenn.
- **Autonav** (`core/11b-obstacles.js`): en turbin som står i sjøen (de flytende ved Karmøy, noen på skjær), er et hinder med foten og fundamentet. Spennene henger høyere enn noen båt (`obsAir`), så de er ikke hindre.
- **Test:** `vindshot.py` (Smøla dag og natt, Havøygavlen, Kvitfjell fra sjøen vest for Kvaløya, Sognefjordspennet ved Ortnevik).

## 4.11i Vått og nedbør (G6, 29.10.2026)

- **Våtheten** (`view3d/15-env-mooring.js wetSet`, `env.wet` 0-1): regnet de siste tre timene etter den felles klokka (`precipAt`, `airTemp`), hvert tiende minutt så vått som det regnet (sludd og snø halvparten), tørket ut over rundt halvannen time (raskere i vind). Regnes på nytt hvert spillminutt, så alle spillerne ser det samme.
- **Snøen på det som er bygd** (`env.snowC`): snøen ved sjøen (snøgrensen under havet, 60 %, fordi gammel snø på kaier og veier er brøytet og tråkket), eller nysnøen som har falt under 0 °C de siste 12 timene (95 %), som går i mildvær.
- **I skyggeleggerne** (`uWet` = våthet, snø): terrenget (`terFS`) blir mørkere i vått, berget og fjæra mest og graset minst, ikke under snø, med solas glans innen 1,5 km. Det som er bygd (`LIT_FS`: kaier, moloer, bruer, hus): snø på flatene som vender opp, og i vått mørkere med glans av sol og himmel, mest på det flate. Modellene (`LITN_FS`: båtene, havneenhetene, brygger): de ru flatene mørkere og alt blankere i vått, mest det flate, som et vått dekk.
- **Nedbøren i lufta** (`24-cinema.js`): regn som streker, snø som flak, og sludd mellom 0,5 og 2 °C (annenhver partikkel et flak som faller raskere enn snø); på «Lav» halvparten så mange.
- **Dråpene på vinduene** (`13-instruments.js drawDrops`): fra roret i en båt med styrehus, perler som sitter på glasset og dråper som renner ned med et vått spor, i glassets egen ramme, så de blir sittende på vinduet. Mer jo hardere det regner, noen igjen mens det tørker, og sjøsprøyt i kuling.
- `#wet0` i adressen skrur våthet, snø på bygg og dråper av. Test: `wetshot.py` (Bergen tørt, i regn og fra roret, Finnsnes i snøvær, Bodø i sludd; været holdes ved å bytte ut `precipAt` og `airTemp`).

## 4.11j Nærfeltet på land (G8, 29.10.2026)

- **Modellene** (`tools/wild/naer.py`, `src/data/naer.b64`): grastue, lyngtue, tre steinblokker og tang som ligger i fjæra, 1 m til målestokken.
- **I spillet** (`view3d/17f-near.js`): innen 45, 70 og 100 m (Middels, Høy, Ultra; av på Lav) får bakken sine små ting celle for celle (3,5, 3 og 2,5 m; først 60, 90 og 120 m, men det kostet en tredjedel av et bilde mer i SwiftShader i Finnsnes havn), avgjort av cellas hash og arealdekket (`cover`): tuer på gras og jorder, lyng på heia, vidda og myra, blokker i ura (0,5–1,9 m) og noen på bart berg, småstein på rullestein og sand, og tang i fjæra under høyvann. Ikke på veier, bygg, havneenheter, steder eller under snøen (steinen blir). Bygges i ruter på 32 m, tre i bildet, de nærmeste først, og tegnes i ett instanstegnekall per modell. Graset følger årstiden (grønt til halmgult), lyngen blomstrer i august og september, og alt er mørkere i vått. Graset vaier litt. `#near0` i adressen skrur det av.
- **Ikke gjort ennå:** høydelaget på 10 m langs sjøen (`hgt10`) fra planen; det trenger en egen kartrelease. Detaljteksturene i `terFS` finnes som støy på Høy og Ultra fra før (4.11b).

## 4.11k Liv i landskapet (G9, 29.10.2026)

- **Modellene** (`tools/wild/dyr.py`, `src/data/dyr.b64`): havørn (kropp og vinger), skarv sittende og med vingene ute, ærfugl hann og hunn, hvit og grå sau, nise, spekkhogger, knølhval og knølhvalens hale. Mønstrene er farget per hjørne (`TINT`). Nisen og hvalene erstatter de gamle formene i `19-wildlife-npc.js`.
- **I spillet** (`view3d/17e-life.js`), alt avgjort av stedet og den felles klokka:
  - havørn i én av to 2 km-ruter i nord (én av tre i Trøndelag, én av sju lenger sør) der bakken går over 110 m med sjø i ruta, sirklende over det høyeste punktet, noen ganger to; om dagen
  - skarv på de lave bergene i vannkanten (0,4–4 m), 2–6 sammen, noen med vingene ute til tørk
  - ærfugl i flokker på 4–12 på sjøen inntil land, hele året, som rir på dønningene
  - sau på gras, lyng og jorder fra mai til september, 3–9 sammen
  - røyk fra pipene på hus og hytter under 5 °C (pipene samles når kilometerrutene bygges, `06-buildings-lights.js`)
  - gatelys hver 35 m langs veiene der de går gjennom tettsteder (`cover` = bebyggelse), om natta, innen 5 km
  - biler på veiene: 6 per km i tettsted, 0,6 på hovedveiene utenfor; små biler om dagen innen 1,5 km, to hvite og to røde lys om natta innen 4 km
  - fuglene ved de ti kjente fuglefjellene (`src/data/fuglefjell.json`, satt for hånd etter SEAPOP og Miljødirektoratet; posisjonene er omtrentlige), som hvite prikker som sirkler foran fjellet, om dagen
- Lysene og fuglefjellets fugler tegnes i fjernpasset utenfor nærpassets rekkevidde og i nærpasset innenfor. På Lav bare lysene, fuglefjellene og hvalene. `#life0` i adressen skrur det av.

## 4.11l Vannlinja (G10, 29.10.2026)

- **Kaiveggene** (`05-quays-breakwaters.js pierInto`, `slabInto`): i bånd, grønske under middelvann, den mørke stripa av tidevannet over den, og betongen (kaiens steinfylling litt varmere) opp til dekket.
- **Beslagene** (`quayFit`) langs hver kaikant med sjø utenfor, i hele landet: to fenderlister i tre, bildekk hver 6 m, pullerter hver 12 m litt inn på dekket, en leider ned i vannet hver 35 m og den gule kanten. Havneenhetene og kaiplassene til spillets havner har sine egne fra før.
- **De faste bryggene** som er kartlagt som linje (ikke `floating=yes`), er tredekke på pæler hver 3 m, ikke grå kasser (BACKLOG: Kristiansand og Hammerfest; alternativ b fra #94).
- **Småbåthavnene** (`tools/map/marina.py` til `src/data/marina.json`, OpenStreetMaps `leisure=marina` i Overture, 460 i Norge; `view3d/17g-marina.js`): innen 1,5 km ligger småbåter med baugen inn ved fingerplassene langs begge sider av flytebryggene i havna, 3,2 m mellom, ellers på bøyer i rekker der det er dypt nok. Fire slag (åpen båt med påhengsmotor, snekke, motorbåt med kahytt, seilbåt med mast); fire av fem plasser tatt fra mai til september, én av tre om vinteren. `#marina0` i adressen skrur dem av.
- **Strendene og rullesteinsfjærene** (`tools/map/shore.py`, laget `shore` i vec-pakkene fra `kart-16`; `view3d/17h-shore.js`): OpenStreetMaps sand og rullestein innen 150 m fra sjøen, 4 115 områder for hele kysten, lagt på bakken i trekanter på høyst 6 m; sanden mørk og våt nede ved vannet. `#shore0` skrur dem av.
- **Stupene i fjæra** (samme lag fra `kart-18`): OpenStreetMaps `natural=cliff` innen 200 m fra sjøen får en bergvegg langs linja, fra toppen ned til bakken eller fjæra 12 m ut, der den faller 4 m eller mer (i Bergen-flisa 46 stup, 1 246 flater).
- **Tangen og ruren etter eksponeringen** (`terFS`, `uExpo` fra kjernens `expo` der båten er): i en lun fjord står tangbeltet tettere og litt høyere, på en åpen kyst er det tynnere og rurbeltet går høyere med sprøytet.
- **Test:** `havnshot.py` (Kristiansand, Bergen, Bodø, Hammerfest og Finnsnes).

## 5.23 Lys om natta og fyrlykter (03.10.2026)

- **Lyskildene:** opptil 8 punktlys lyser opp terreng, bygg, havneenheter, båter og sjø (`PLG`, `pLit` i skyggeleggerne, `pickLights` hvert bilde). På «Lav» brukes 2, på «Middels» 4.
  - båtens eget arbeidslys over dekk, 26 m rekkevidde
  - sjømerkelysene i nærheten mens de blinker på: fyr 170 m, middels 90 m og små 50 m
  - lyskasterne over kaiplassene, 45 m
- **På sjøen** glitrer lysene i bølgene, med samme ruhet som sola, ut til tre ganger rekkevidden.
- **Lyskjeglene** (`drawBeams`): fyr («M» eller rekkevidde 10 nm og mer) har to kjegler som går rundt én gang i lysets periode.
  - De fleste norske fyr er sektorlys som ikke roterer. Kjeglene er for utseendet Jonas ba om.
  - I Senja-dataene gjelder det Hekkingen og Bukkskinn.
- `lighttest.py` sjekker lysene og kjeglene.

## 5.24 Kino-visning (03.10.2026)

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

## 5.40 Bro-visningen rister ikke (09.10.2026)

`model()` i `view3d.js` lager en `Float32Array`. Kameraøyet i bro-visningen ble regnet gjennom den med båtens verdensposisjon (rundt 1 000 000 m), og float32 har der bare 6–12 cm oppløsning. Øyet hoppet derfor i trinn mens skroget, som tegnes relativt til øyet, ikke gjorde det. Det ga et sagtann-mønster rundt 10 ganger i sekundet som økte med farten (målt i Jonas' video: 1–2 px glidning per bilde, så 8–10 px tilbake). Nå roteres øyets plass på skroget alene og legges til posisjonen i full presisjon, og `BMabs` har posisjonen i full presisjon. **Regel:** legg aldri verdenskoordinater inn i `model()` når resultatet brukes til noe annet enn en matrise som sendes til GPU-en relativt til øyet. Test: `tests/helmjit.py`.

## 5.42 Nordlyset i buer og folder (tilbakemelding #56, 09.10.2026)

Gardinene sto på en linje med små folder langs den magnetiske øst-vest-retningen, så sett på langs ble de «et langt teppe som henger på himmelen i en rett linje». Nå:
- **Linja bøyer seg** (`aFold` i himmelskyggeren): store buer, S-folder, små krusninger og en strammere krøll som vandrer langs den.
- **Strålen følges opp** gjennom høydene i ni steg, og arket lyses der den krysser linja. En fold sett fra siden vises derfor to ganger. Den gamle fastpunkt-løsningen kunne ikke følge store bøyer.
- **Kantlyset regnes ut fra linjas egen normal**, ikke fra en fast retning.
- **Underkanten bølger**, og gardinene kommer og går i biter langs lengden, så buene slutter på himmelen.
- **Test:** `aurorashot` (OK). Bilder fra fire retninger før og etter ble sendt til Jonas.
