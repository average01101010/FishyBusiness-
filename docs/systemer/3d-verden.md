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
  | Største `dpr` | 1, og høyst 2,1 millioner piksler (`px0`, rundt full HD; 03.11.2026, fra grenen `claude/admiring-cray-otunlz`: Iris Xe på 3440 × 1440 holdt 17 bilder/s) | 1,25 | 1,5 | 3 (skjermens egne) |
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

  - **Ultra** (Jonas 05.10.2026: «en ultra grafikk setting ... finne ut hvor grensa ligger for flagship-modeller») velges for hånd, og fra 30.10.2026 også av Auto på en enhet som måler raskt nok (forsøket i `qualTick`, F1 i `docs/planer/grafikk-batmodeller.md`, valg 2 A: etter 20 s over 80 bilder/s på Høy, tilbake under 45, utfallet huskes i `dsb_ultra`; detaljer i `3d-baater-og-animasjon.md`). Det krever 32-bits indekser (`OES_element_index_uint`, `UINT`; kjerne i WebGL 2), ellers blir det Høy. **Konteksten** er WebGL 2 der den finnes, med WebGL 1 som reserve (`#gl1`), og skyggerne oversettes fra GLSL ES 1.00 til 3.00 ved kompileringen (`glsl3`, F1). Nettene over 65 536 punkter får `Uint32`-indekser (`i32`), og tegnekallene velger type etter det. Bildetakten vises med «Vis bildetakt» i Innstillinger. Testen er `tests/ultratest.py`.
  - **Nivået enheten har vist at den ikke holder** (04.11.2026, Jonas: «3d nivå skal senkes automatisk om det må det»; `QM` og `qmDown` i `view3d/00-head.js`). Bildetakten alene så det ikke: de tapte kontekstene, krasjen og hengene i 3D på Adreno 642L og 830 den uka kom på nivå 2 med god bildetakt og JS-minne fra 176 til 817 MB, så det går etter hva enheten gjorde, ikke etter en grense for minnet. Auto går ett nivå ned ved en kontekst tapt under spill (før siden lastes på nytt), ved en side som stoppet mens den tegnet 3D på skjermen (`dsb_q3d_alive`: et slag hvert 5. s mens 3D tegnes, tatt bort når siden skjules, går til kartet, holdes eller lukkes; et slag 25 s eller eldre fra en annen side ved oppstart er en krasj) og ved to heng på 5–120 s innen ti minutter (bildene sto stille med siden synlig). Nivået enheten falt til, huskes i `dsb_qdown` i sju dager, så omlastingen etter en tapt kontekst ikke starter der den falt; Ultra prøves ikke under taket. Bare på Auto: et nivå valgt for hånd og `#qfix` røres ikke. Taket står i loggen for tapt kontekst (`nivå 1 (tak 1 etter krasj)`) og i `G3._debug.qm`. Testen er `tests/qdowntest.py`.

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
  - Skyggene regnes med en tidsgrense per bilde (`SHMS`, 2–4 ms). Nettene bygges rad for rad over flere bilder (`meshTask`, `meshStep`), ett om gangen og med nærnettet først (fra 05.11.2026: én jobb per slag nett, se under).
  - Et nett under bygging som fortsatt dekker båten, får gjøre seg ferdig. Uten det hoppet sjøkartet når båten gikk fort.
  - Pakkene for 3D hentes én gang hver (`stream3d`), og bare nett som en ny pakke dekker, bygges på nytt (`staleOver`).
  - Kompasslinja er en ferdig tegnet stripe. Det er ingen backdrop-filter i 3D.
  - Automatisk kvalitet går opp igjen etter 8 s over 40 bilder/s.
  - «Vis bildetakt» ligger i Innstillinger.
- **Terrengnettene i tidsbiter, også starten og slutten** (05.11.2026, Jonas: «Terrengnettene bygges delvis i ett strekk»; laggen 04.11 i backloggen). Bare høydene var tidsdelt; resten gikk i ett strekk, 60–300 ms på en PC hver gang båten hadde flyttet seg et stykke, og 3–4 ganger så lenge på telefonen. Nå:
  - `meshRows` stopper midt i en rad (hvert 32. punkt). En rad i fjernnettet over land var 10–40 ms.
  - Slutten av nettet (`meshEndG`: normalene, fargene `recolorG`, bufferne) er en generator som gir fra seg tråden når bildets bit er brukt opp (`SLEND`, `sliceDue`, `sliceRun`). `makeMesh`, `meshEnd` og `recolor` kjører den ferdig med én gang (`runAll`). Indeksene er de samme for alle nett av samme størrelse, så det er én indeksbuffer per størrelse (`gridIdx`, `m.ibs`; `freeMesh` sletter den ikke). Fargingen etter nettet var bygd, sto to ganger for finnettet. Den andre er fjernet.
  - Én jobb per slag nett (`MJOBS`, før bare én jobb om gangen). Jobben som får gå, er den der båten er nærmest kanten av nettet sitt. Er båten nær kanten (12 % av bredden), får den en større bit. En jobb som har ventet over 8 s, går først til den er ferdig, så sant ingen haster. Uten den regelen ble fjernnettet aldri ferdig etter et hopp, fordi nye fliser hele tiden kom foran det (teleport3d, Kirkenes). Før ventet finnettet bak midt- og fjernnettet til båten hadde forlatt det, og ble så bygd i ett strekk (150–300 ms). Bare et nett uten noe nett før seg, eller et nett båten har hoppet langt fra (over en kvart bredde og over 2 km, altså en teleport), bygges i ett strekk. En jobb som er over halvveis, startes ikke på nytt så lenge båten er på den.
  - Strandlaget og høydeteksturen under nærnettet (`buildGround` → `groundStep`, `GJOB`: `depthF` for 65 536 punkter, 150–300 ms) lages rad for rad. Teksturene i bruk står til de nye er ferdige, og så går begge opp sammen med firkanten sin (`SRECT`). Landmasken tegnes etterpå som før.
  - **Landmasken som mangler ute på havet** (05.11.2026, funnet av `h2dshot` nord for Loppa): en simuleringsrute langt ute kan mangle sin maskeblokk, og `rbilM` kastet «map: mask block 94,18 has no pack» som sidefeil. `groundStep` tar nå landandelen (`landFracM`) resten av jobben når masken ikke kan leses (`maskOr`, `J.nom`), som der ruta ikke har simuleringspakken.
  - Strendene og klippene (`shoreTile`) og innsjøene og elvene (`waterTile`) lages som generatorer, én flis om gangen (`SHJOB`, `WJOB`). Før var det en hel flis på 50 km i ett strekk, opp til 180 og 750 ms.
  - Ny farge for årstida (snølinja, graset, ruska) går i kø, et nett om gangen (`recolorAll`, `RCQ`, før alle nettene samtidig, rundt 100 ms). Midtnettet er nå med, det ble ikke farget på nytt før. Et nett som er under bygging når årstida skifter, farges på nytt når det er ferdig.
  - Alle jobbene deler én bit per bilde (`SLICE_END` = `meshSlice()`: `MESHMS`, inntil 30 % av et bilde og høyst 60 ms). Strandlaget går først, fordi det begynner på nytt med hvert nytt nærnett og må bli ferdig. Så kommer nettet, og fargene, strendene og vannet får resten, hver minst halve `MESHMS` eller en tidel av et tregt bilde (høyst 20 ms). En fjerdedel var for lite: strendene ble ikke ferdige på et halvt minutt i havnshot. Tidligere hadde hver jobb sin egen bit, og et bilde med tre av dem tok over 100 ms.
  - Hvordan terrenget ser ut, er ikke endret: punktene, fargene og teksturene regnes som før, bare fordelt over flere bilder. `G3._debug.tjobs` viser jobbene som står, og hvor mange som er ferdige av hvert slag (`now` er de som ble bygd i ett strekk).
  - Målt på PC med hele kysten (kart-31), sjarkny med fullt pådrag i 150 s utenfor Skjervøy, CDP-profil. Tallene er bare tiden i terrengarbeidet (`updateNear`, `updateWater`, `updateShore`) per sammenhengende strekk på hovedtråden. Strekk over 50 ms: 11 → 2, over 100 ms: 4 → 0. Det lengste: 295 → 53 ms (bildets bit i SwiftShader er 30 % av et bilde på 100–500 ms, høyst 60 ms). Stikkprøver i Bergen og Bodø: se backloggen.

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

- **Skodda på fjellet rettet 29.10.2026** (Jonas' bilde fra Finnsnes i regn: den så ut som snø, hvit og i striper nedover lia): kanten bare fra støy på 300–700 m som driver med vinden (`uCD`, `env.cdrift`, en tiendedel av vindfarten), en bred og myk kant som er tynn nederst, og skyen litt mørkere enn himmelen (`env.ccol` 0,86 × horisonten). Bilde før og etter i `docs/pr/ccr-1d00422f-gjapvb/g10/skodde_for_etter.png`.

- **Skodda på fjellet kokte, og lå som et flatt bånd (rettet 02.11.2026,** Jonas' video fra nettbrettet: kameraet sto stille, men skodda på toppene skiftet fra bilde til bilde): driften var den felles klokka i timer ganger vinden nå (`H * 3600 * w * 0.1`), så en endring i vinden på en hundredels m/s flyttet skya hundrevis av meter (samme feil som himmelens skyer hadde før 19.10). Nå samles driften bilde for bilde i sanntid (`CDR` i `15-env-mooring.js`, `uCD` er `vec4`): to lag, ett med 0,3 + 0,2 × vinden m/s og ett saktere og dreid 30°, så kanten skifter form sakte. Støyen gjentar seg hver 4096. m (`aNp`), så foldingen gir ingen skjøt. Skylaget har en overside (`env.cthick`, 450 m til 1 500 m i helt grått), og hvor grått et punkt blir, er skyens tetthet samlet langs synslinja (`aG`, integralet av tettheten) mot rundt 330 m sikt inne i skya, ganger hvor mye punktet selv står i skya: fjerne topper i skya er borte, nær li ved basen bare disig, de høyeste toppene står over et tynt lag, og fra et høyt kamera synes sjøen og landet under basen (gjennom hele laget, som fra et fly, ble alt grått). `tests/skoddeshot.py` sjekker at skya står stille med stille kamera og vind som endrer seg. Det finnes fortsatt ingen havskodde eller tåkebanker over sjøen.

- **Skyene uten flate felt og skarpe kanter (30.10.2026,** Jonas' bilder på sjøen fra nettbrettet): skystøyen tok utvalg opp mot tusener (vindens forskyvning), der grafikkbrikkens hash mister nøyaktighet og naboruter blir like. Nå gjentar støyen seg hver 289. rute og regner bare med små tall (`cq5`), med femtegrads overgang og hver oktav dreid mot den forrige (`cfbm`); lyset fra sola tar forskjellen 3 ganger, ikke 4. Kan bare ses på brikken som hadde feilen (SwiftShader regner alltid i 32 bit).

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
- **Skjærene i 3D** (Ø13 K4, steg 33e, 11.11.2026; `view3d/17i-rocks.js`; bergene tegnes i den nære gjennomgangen ved siden av strendene (`drawRocks` i `24-cinema.js`), brenningen etter sjøen (`drawRockFoam` i `drawSea`, `17-draw.js`)). Før sto de 98 063 skjærene fra sjøkartpakkene (OpenStreetMaps `seamark:type=rock`, `sjomerker-7`) og Senjas egne bare i kartet, i Autonav og i grunnstøtingen: sjekket i spillet ved Bergen, Bodø og Senja før noe ble bygd, og der skjæret lå, var det bare sjø (bildene `gammel_*` i `docs/okter/2026-11-11-33e/`).
  - **Hvert skjær innen rekkevidde er et lavt, avrundet berg** der `rocksIn` har det (samme liste som grunnstøtingen spør, så Senjas og kystens kommer likt). Et skjær godt inne i en havns vann tegnes ikke (punktet og 15 m til hver side er i havna: `groundCheck` støter ikke en båt som er i havn; et skjær på kanten kan støte en båt rett utenfor, og står), og heller ikke et skjær som ligger under bakken (på fjæra eller på land i 3D).
  - **Formen er en ren funksjon av posisjonen** (`rockShape`: frøet er posisjonen på 0,1 m, all tilfeldighet kommer fra `rng(frø)`, og mangler tidevannstabellen eller eksponeringen når cella bygges, prøves cella igjen tre sekunder senere i stedet for å få en reserveverdi), så alle spillerne ser det samme skjæret. Foten (2,4 m under middelvann) når høyst rundt 10,5 m fra punktet, innenfor de 12 m som støter (`groundCheck` i `core/01-world.js`); ved middelvann er berget 3–9 m over. `G3._debug.rockShape(x, y)` gir formen, og `coast3d` sjekker at den er lik når den spørres to ganger.
  - **Høyden er spillets, ikke dataenes** (dataene sier bare hvor skjæret er): toppen ligger mellom 0,1 A under og 0,75 A over middelvann, der A er springamplituden på stedet (M2 + S2 fra `tidePlace`, minst 0,35 m så skjær i Skagerrak også stikker opp). Berget står stille og sjøen går med tidevannet (`env.tide`), så skjæret er tørt ved fjære sjø og overskylt ved flo; sjøens egen dybdetest dekker det som er under.
  - **Fargene er fjæras** (tonene fra `terFS` sitt tidevannsbelte): tare og vått berg nederst, tang opp til rundt middelvann (tett og høyere i ly, tynn og flekkete på åpen kyst, etter kjernens `exposure` der skjæret ligger), det lyse rurbeltet over (høyere med sprøytet), og grått berg på toppen, lysere ute i havet. Tegnes med lit-programmet (vått i regn som resten), men uten snø (tidevannssonen har aldri snø, som fjæra).
  - **Brenningen** (eget lite program `skjaerskum`): der det er sjø (`ssAt` der skjæret ligger, fra 0,1 m), ligger hvitt vann der sjøen står grunt over berget, som en ring rundt et tørt skjær og over hele et overskylt, mer jo høyere sjøen er, og ingenting i stille vær eller når skjæret ligger for dypt. Skumflaten er 7 × 7 punkter per skjær i ett buffer som fylles hvert bilde (ett tegnekall): for de nærmeste innen 180 m inne i bølgefeltet ligger den på bølgenes egne høyder (`seaH`) i sjønettets egne punkter, så den ligger i den tegnede flaten; for de andre er den flat, på vannets høyde ved skjæret inne i bølgefeltet (ett oppslag, `seaHFast`) og på tidevannet utenfor. Skummets mønster står i skjærets egen ramme, så det hopper ikke når øyet flytter seg. Brenningen bruker ikke skumkartet (steg 42 eier `14-sea.js`); se backloggen.
  - **Trinnene (`QUAL`):** rekkevidde 500, 900, 1 400 og 2 000 m (Lav til Ultra), detalj per skjær 3 × 8, 4 × 12, 6 × 16 og 8 × 22 (ringer × punkter rundt: 40, 92, 176 og 330 trekanter), brenning på 0, 24, 64 og 128 skjær innen 800 m, og 0, 3, 6 og 10 av dem på bølgene. Antallet kuttes aldri innen rekkevidden (et skjær som støter, skal synes), bare rekkevidden og detaljen. En celle mer enn rundt en kilometer unna bygges med minste detalj uansett trinn (et skjær der er noen få piksler), og på nytt når øyet kommer nær (langt over 1 050 m, nær igjen under 750 m, så en celle på grensa ikke bygges om og om igjen).
  - **Tegnekallene følger ikke antallet:** ett nett per 1 km-celle (cellene `rocksIn` holder), bygd en skive per bilde som strendene, så høyst 9–25 kall for bergene og ett for brenningen. `#rocks0` i adressen skrur alt av.
  - **Målt** (11.11.2026, der det er flest skjær i landet: 1 km-cellen (392, 1008) ved Smøla, 63°19′N 7°51′Ø, 167 skjær i cella og 739 innen 3 × 3 km). **Bildetida lot seg ikke måle i testmiljøet:** med SwiftShader tegnes ett bilde per 20–35 s på dette stedet både med og uten skjærene (`G3.prof` fikk ett bilde eller ingen i hvert vindu på 4 s; samme side, `G3._debug.rocksOff` av og på), så forskjellen drukner. Det som kan telles: på Middels 422 skjær i rekkevidde, 27 396 trekanter i 6 tegnekall pluss ett for brenningen; på Høy 600 skjær, 56 504 trekanter i 12 kall (105 600 før cellene over en kilometer unna fikk minste detalj). JS-tida per bilde på testmaskinen: 0,05–1,8 ms for bergene (mest mens celler bygges) og 0,1–0,5 ms for brenningen med 3–5 skjær på bølgene. Om det merkes på Middels på et nettbrett, vet vi ikke før Jonas har målt med `#prof` med og uten `#rocks0` der (`docs/spill-dette/33e.md`); ingenting er kuttet på forhånd utover avstandsdetaljen.
  - **Test:** `coast3d` (ved Bodø og ved ett av Senjas egne: skjæret er tegnet der `rocksIn` har det, toppen er tørr ved laveste vann og under ved høyeste, foten innenfor 12 m, formen lik to ganger, og ingenting med `#rocks0`; `KYST_COAST3D=rocks` kjører bare den delen). Sett rød mot bygget uten delen. Bilder ved Bergen, Bodø, i Finnmark (Måsøy; ved Hammerfest by har dataene ingen skjær nærmere enn 15 km) og Senja i `docs/okter/2026-11-11-33e/`.
- **Test:** `havnshot.py` (Kristiansand, Bergen, Bodø, Hammerfest og Finnsnes).

## 4.11m Skyggene på alt og skyskygger (04.11.2026, Jonas: «Kjør på»)

Før dette hadde bare terrengnettene skygge fra fjellene, regnet per punkt (`updateShadows`, `aShd`). Båter, hus, kaier, trær og sjøen var like solbelyst i en fjord i kveldsskygge, og skyene kastet ingen skygge.

- **Én felles funksjon i lufta (`AIR` i `01-shaders.js`):** `sunV(v)` sier hvor mye av det direkte lyset fra sol eller måne som når punktet `v` (fra øyet), og `cloudV(v)` er skydelen av det alene. `SUNV(fs)` gjør om en opplyst skyggelegger: hver `uSunCol` i `main()` blir `sunC = uSunCol × sunV(vW)`. Den brukes av `LIT_FS` (bygg, kaier, moloer, bruer), `LITN_FS` (båtene, havneenhetene, folka), `TREE_FS`, `NEAR_FS` (nærfeltet), `VD_FS` (vindturbinene), `WATER_FS` (innsjøene) og sjøen (`SEA_FS`, `BASIC_FS`). Glansen og solglitteret på sjøen forsvinner dermed i skyggen. Terrenget (`terFS`) har fjellskyggen i punktene sine fra før og får bare `cloudV`. `TEX_FS` (flate teksturer, mediump) er ikke med.
- **Fjellskyggen på resten (`SG`, `sunGridStep` i `04-vec-packs.js`):** et rutenett rundt båten (Middels 3 km, Høy 4 km og Ultra 6 km; 256, 256 og 384 ruter på hver side, 12–16 m per rute). Det regnes mot lyset fra 2 m over bakken eller sjøen, med samme høyder som terrengskyggene (`shadeH`). Det lastes opp som en tekstur på enhet 5, og skyggeleggerne leser den lineært. Hver rute husker den minste klaringen strålen har over landet (tangens til vinkelen), så kanten blir myk over omtrent solas egen bredde og ikke de tre trinnene til terrenget. Rutenettet regnes i tidsbiter (`SGW.ms`: 1,5–4 ms per bilde) inn i en ny tabell mens den gamle brukes. Det regnes på nytt når lyset har flyttet seg et trinn (samme nøkkel som terrenget) eller båten har flyttet seg en firedel av bredden. Strålen stopper over 2 300 m. Ytterst blander teksturen seg mot sol, og utenfor den er alt opplyst. Uten rutenett leses en hvit rute (`sunT0`), fordi en enhet uten tekstur leser svart.
- **Skyskyggene (`cloudV`):** punktet føres opp langs lyset (den ekte retningen `env.shadowDir`, ikke den løftede `lightDir`) til skybasen (`env.cbase`, 400–2 500 m). Dekket der følger himmelens regel: samme terskel på støy av 1,4 km, 590 m og 260 m, som gjentar seg hver 32 km, så folden aldri synes. Skyskyggene driver med vinden i skyenes høyde, som skyene på himmelen (`CLD.m` i `cloudStep`, i meter). Himmelens jevne demping av sola (1 − 0,72 × skydekket, `computeEnv`) fordeles i stedet: under en sky når en femdel av sola fram, og i en glipe litt mer enn snittet (inntil 1,3), så bildet i snitt er omtrent like lyst som før. Styrken er null under klar himmel og under helt grått dekke (`sstep(0,08, 0,25)` × `1 − sstep(0,8, 0,95)`).
- **Av:** på Lav, med `#sun0` i adressen og med lufta av (`#air0`). Terrengets egne skygger står som før.
- **Test:** `sunshot.py` (Fjordgård i Ørnfjorden en høstkveld med og uten rutenettet, og ved middagstid under spredt skydekke). `G3._debug.sun` er `SG`.

## 4.11n 3D langt ute: γ og målestokken (havsteget H1b R8, 05.11.2026)

Planen (kap. 3a i `docs/planer/havsteget-h1b-rammen.md`) sa at målestokken ved Island «må sees på i R7»; det ble gjort i R8.

- **Retningene ved store γ:** `tests/havshot.py` legger båten ved Petsjorahavet (γ +31,4°), utenfor Nord-Island (γ −31,3°, k 1,024) og ved Bjørnøya (γ 3,7°) en julikveld, dreier kameraet til solas rutenettretning (sann asimut − γ) og deretter mot vinden. Kompasset over 3D-bildet viser sann retning innen 0,6° av `sunAt` og `windDir` begge steder, og bildene viser sola midt under kompasset (306° ved Petsjorahavet). Sola, månen (`computeEnv`), vinden og dønningen (`14-sea.js`, `10-gear.js`, `17d-vind.js`, `24-cinema.js`), lyktsektorene (`06-buildings-lights.js`) og kompasset (`compassDraw`) går alle gjennom γ; ingenting måtte rettes.
- **Målestokken (k):** 3D tegnes i rutenett-meter. Ved Nord-Island er k 1,024 (1,037 lengst vest ved Island), så land og vec-byggene er 2,4–3,7 % større i rutenettet enn i virkeligheten, mens båtmodellene, havneenhetene og bølgelengdene er tegnet i sanne meter. Båten går k ganger fortere i rutenettet (`gridScale`, R1), så tida langs land og farten mot land er riktige; bare størrelsen på båten og bølgene mot landet er 2–4 % for liten. Det ses ikke (modellene varierer mer enn det seg imellom), og det finnes ingen detaljfliser, kaier eller bygg der k er stor (Island, Færøyane og Grønland har bare land på 200 m). **Ingen endring** (valg med begrunnelse; tas opp igjen om det kommer havner med Blender-modeller utenfor Norge).
- **Rettet underveis:** kompasslinja i stående format er rundt 150 px for 140°, og tallene hver 15. grad løp inn i hverandre og i himmelretningene («120SØ150165», hele kysten). Nå står bare himmelretningene når det er under 26 px mellom tallene (`compassStrip` i `view3d/23-camera-frame.js`).

## 4.11o Ytelsen, det som kan måles i testmiljøet (Ø3a, 07.11.2026)

Ø3a i `docs/planer/koen.md` (steg 21): det som kan måles uten Jonas' telefon, med måling før og etter og uten endring i utseendet («Grafikken er nesten det viktigste» i `CLAUDE.md`). Alt målt med hele kysten (kart-31) i Playwright med SwiftShader, så GPU-delen er overdrevet; arbeidsgrenen på `cdb92def` er «før». Måleskriptene ligger ikke i repoet (de er beskrevet her).

- **Førstegangsstarten** (ny nettleser uten buffer og tjenestearbeider, 800 × 1280, CPU strupet 4×, brevet, Vangshamn, «Start her», til `first3d`): brevet etter 11,2 s; fra «Start her» til første 3D-bilde 34,5 s (`wait_s` 29,4). Profilen over det spennet (36,5 s med struping, inklusiv tid): `init` 19,1 s, av det terrengnettene (`makeMesh` 9,5 s: `meshRows` 8,5 s med `coverAt` 4,3 s, `terrRaw` 3,2 s, `satAt` 3,1 s, `tileH` 2,5 s), `getContext` 4,6 s og skyggeleggerne (`program`/`compile`) 2,4 s, byggene (`loadBuildings` 2,5 s, av det `bldOnUnit` 1,8 s), `buildStatics` 1,3 s og `buildSkiff` 1,2 s; bildene etterpå `updateNear` 4,7 s og `updateMid` 1,3 s; utenom 3D `chooseStart` → `tutFieldNear` 2,0 s (feltet for første tur) og minikartet 1,0 s. `rcell` (alle leserne av rasterne, 4,9 s inklusiv med `mapBlock`) har fått en snarvei for en celle i blokka den har fra før (`kart-og-terreng.md`); minikartets kyst er 7,2 s → 0,15 s kaldt der kartpakkene ikke er inne (`kartplotter.md` 5.44b).
- **Det som ikke ble gjort, og hvorfor:** (1) *3D forberedt mens brevet leses:* det som ikke avhenger av startstedet, er konteksten og skyggeleggerne. Uten `KHR_parallel_shader_compile` står hovedtråden mens de kompileres (2,4 s her med struping; på en telefon ikke målt), så det ville flyttet frysen inn i brevet og listen over startsteder; med utvidelsen kan det gjøres uten å stå, men `program` og `compile` ligger i `view3d/01-shaders.js` (F3 hadde den). Byggene (`loadBuildings`) avhenger av startstedet (`bldOnUnit` → `sitesNow` → `naustSite`, fars naust) og kan ikke regnes før det er valgt. (2) *`KHR_parallel_shader_compile`:* samme fil, og kan ikke måles med SwiftShader. (3) *`GLBM` som typede tabeller:* 61 steder i `vessel3d.js` og `view3d/` (også `09`, `10` og `16`, som H3d1 og F2 hadde). (4) *Terrengnettene* (`view3d/03-berths-naust.js`): fila var ikke på Ø3a-lista. Alle fire står i Ø3c i køen (steg 21b) med hel startmelding.
- **`first3d`** (`ui/11-boot.js`) har fått `letter_s` (navigasjonen til brevet er på skjermen, uten porten og bakgrunnen) og `read_s` (fra brevet til 3D blir bedt om), så ventetiden før brevet og spillerens egen tid med brevet og startstedet kan skilles fra `total_s` (`publisering.md`).
- **Bølgekartet over fjernterrenget** (`SSL.w`, 128 × 128 `fetchAt` over 100 km): målt ved Husøy, Bergen, Bodø, Hammerfest og Lofoten for sektorene 0, 9 og 22, PC uten struping: 6–31 µs per punkt (snitt 14,8 varmt, 16,1 kaldt), altså rundt 0,25 s per sektor på PC (på et nettbrett anslått fire ganger så mye, ikke målt), fordelt over bildene av `ssStep` (`clamp(rdt × 60, 1,5, 25)` ms per bilde, i 16 bilder/s rundt 3,8 ms). `fetchRay` slår nå opp de fjerne lagene én gang per stråle og bruker stegets landlag igjen for landet: samme verdier (sum og hash like), varmt 14,8 → 12,9 µs, kaldt 16,1 → 15,3 µs (`vaer-og-hav.md`). Færre punkter langt til havs ligger i `view3d/14-sea.js` (F3), og strålene lagret per 1 km-celle ville gitt andre verdier enn i dag (punktet flyttet inntil 0,7 km); begge står til etter F3.
- **NPC-modellenes byggetid** (`npcModel`, nær 1 og fjern 0,3, første gang en type vises, CPU strupet 4×, Blender-modellene inne): 25–171 ms per type, rundt 80 ms for de fleste (trebåten 171, skiffen 79, kyst21 25), 1,2 s for alle 15. Tallet før Blender-modellene var 5–11 ms. GL-opplastingen kommer i tillegg. Hver ny type i synsfeltet gir altså et stopp på rundt 80 ms på et nettbrett; å bygge typene i tidsbiter etter starten er et forslag i Ø3c.

## 4.11p Ytelsen, det Ø3a målte og Ø3c tok (Ø3c, 09.11.2026)

Ø3c i `docs/planer/koen.md` (steg 21b), Jonas' økt på grenen `ccr-159e8207-jxlj4z`. Alt målt med hele kysten (kart-31) i Playwright med SwiftShader, CPU strupet 4×, mot arbeidsgrenen på `0164fc7` som «før» (et bygg av den med bare målekroken `G3._debug.meshBench` lagt til). Måleskriptene ligger ikke i repoet; de er beskrevet her.

- **Skyggeleggerne i to halvdeler** (`view3d/01-shaders.js`): `progStart` gir begge skyggeleggerne og lenkingen til driveren uten å spørre om noe, `progEnd` leser status, loggen (de samme feilene og navnene som før, «… VS», «… FS», «… link») og uniformene; `program()` er de to på én gang. Med `KHR_parallel_shader_compile` (`KPSC`) starter `init` de sju programmene uten reserve (lit, terreng, modell, tekstur, kjølvann, himmel, punkter) samtidig, sjøens forsøk går etter hverandre som før med `await` mellom (`programA`, `progWait` spør `COMPLETION_STATUS_KHR` hvert 8. ms), og de sju leses etter at sjøen er gjennom og merkene (`SEA_TRY`) er tatt bort. Uten utvidelsen leses de sju med en gang i den gamle rekkefølgen før sjøen, så en feil stopper starten der den gjorde. `#kpsc0` i adressen gjør som uten utvidelsen.
- **3D forberedt mens brevet leses** (`view3d/18-setup.js`): `init` er delt i `initGL` (konteksten og skyggeleggerne, som ikke avhenger av startstedet) og resten (byggene avhenger av fars naust, `bldOnUnit` → `sitesNow` → `naustSite`). `G3.prep()` kalles fra `ui/11-boot.js` 2,5 s etter at brevet kom (når det har kommet inn). Med utvidelsen kjører den hele `initGL`; uten lager den bare konteksten, og skyggeleggerne kommer i `init` som før. En feil i forberedelsen holdes (`glErr`) og kastes i `init`, så den meldes og håndteres (WebGL 1-reserven, sjønivået) der den ble før. En kontekst som mistes under forberedelsen, starter ikke 3D bak brevet når den kommer tilbake (`ASK3D`), og `initGL` gjøres om igjen i `init` (`GLOK` nulles). SwiftShader har ikke utvidelsen, så grenen med den er prøvd med en etterlignet utvidelse (`getExtension` og `COMPLETION_STATUS_KHR` byttet i siden): 9 spørsmål om status, ingen sidefeil, 3D kom opp. Det ekte tallet må komme fra Jonas' nettbrett (`#prof` og `first3d`).
- **Terrengnettene** (`view3d/03-berths-naust.js`): `coverAt`, `covBlk` og `satRead` spurte `performance.now()` for hvert punkt for å holde en blokk de hadde funnet i et sekund; nå tar `meshRows` klokka ved starten av hver rad og hver 32. punkt (`MNOW`), og `satRead` holder de fire blokkene et punkts celler ligger i per lag (`SATQ`), slik `coverAt` alt gjorde (`COVB`), i stedet for fire oppslag per punkt. `meshRows` med CPU-en strupet 4× ved Vangshamn (`meshBench`, tre ganger hver):

  | Nettet | Før | Etter | Hash (`pos`, `h`, `fo`, `cv`, `ck`) |
  |---|---|---|---|
  | fjernt, 255², 100 km | 470–588 ms | 368–552 ms | lik (`ef55deec`) |
  | midt, 256², 10 km | 1 031–1 155 ms | 361–540 ms | lik (`5fe3ad01`) |
  | nært, 256², 2,6 km | 812–972 ms | 377–398 ms | lik (`71eed3bf`) |
  | nært 1,5 km øst, 256², 2,6 km | 1 070–1 151 ms | 462–473 ms | lik (`df330a6a`) |

  Nettene er byte for byte like. Det som er det samme langs en rad (raden i dekket og satellittlagene, vektene), regnes fortsatt per punkt; det er neste steg om det trengs.
- **NPC-typene i tidsbiter** (`view3d/20-trawl-seine.js`, `npcWarm`): fra 4 s etter starten lages modellen for båtene innen 5 km på nivået de først tegnes med (0,3), så for dem innen 1,5 km på nærnivået, ett steg om gangen når nettleseren er ledig (`requestIdleCallback`, innen et sekund der den aldri er det): modellen lest fra bytene (`glbLoad`) i ett steg, bygd og sendt til GPU-en i det neste (`npcKB`, de samme buffrene som `npcMesh` lager). Ingen type bygges lenger i bildet den kommer inn i synsfeltet, så lenge den har vært innen 5 km i noen sekunder. `G3._debug.nwarm.n` teller stegene. Byggetiden per type er den samme (25–171 ms med struping, 4.11o); den er bare flyttet ut av bildene.
- **Førstegangsstarten** (ny nettleser, CPU 4×, brevet lest i 8 s, Vangshamn, «Start her», til `first3d`, én kjøring hver): `wait_s` 15,9 → 10,9 s stående 800 × 1280 (uten utvidelsen: konteksten laget under brevet, og terrengnettene); 9,9 s liggende med den etterlignede utvidelsen. Skjermbildet i naustet etterpå er det samme før og etter.
- ~~**Står igjen til Ø3d**~~ (`GLBM` som typede tabeller): gjort 10.11.2026, 4.11q under. `view3d/09` og `10` trengte ingen endring (de leser delene hjørne for hjørne og gjør dem til `Float32Array`).

## 4.11q Ytelsen: `GLBM` som typede tabeller (Ø3d, 10.11.2026)

Ø3d i `docs/planer/koen.md` (steg 21c), Jonas' økt på grenen `ccr-07d61e23-19971d`. «Før» er arbeidsgrenen på `3a81cce` bygd for seg; målt i Playwright (Chromium med `--js-flags=--expose-gc`, 1280 × 800, Senja-bygget uten hele kysten), `performance.memory.usedJSHeapSize` etter tre `gc()`, to kjøringer hver. Måleskriptet ligger ikke i repoet: start med `boot`, vent 15 s, mål; les så alle 51 modellene i `DATAB` med `glbLoad` og hver del i `parts`, og mål igjen.

| | Før | Etter |
|---|---|---|
| JS-minnet etter starten (30 typer i `GLBM`, delene starten trenger) | 376,1–376,2 MB | 281,1–281,4 MB |
| JS-minnet med alle 51 typene og alle 133 delene lest | 664,2–670,5 MB | 408,9–409,0 MB |
| Tabellene i delene (`p`, `n`, `c`, `zone`, `ao`) med alle delene lest | 327,7 MB | 167,2 MB |

- **Hva som ble gjort:** `glbParse` (`vessel3d.js`) gir `Float32Array` for posisjonene, normalene og fargene, `Uint8Array` for malingssonen og `Float64Array` for skyggen (`ao`); ett hjørne per trekant som før (indekserte tabeller ville spart mer, men alle leserne går hjørne for hjørne, og trekantene skulle ikke endres). `f32cat` og `f32moved` setter deler sammen der koden før brukte `concat` og `push` (`glbModel`, `view3d/07-harbour-unit.js`). Detaljene og hva som er likt står i `3d-baater-og-animasjon.md` («Delene er typede tabeller»).
- **Likt:** `tests/unit/glbm.test.mjs` (hver type, nivå 0,3, 1 og 2, bar, lakkert, med design, med stripe og som egen båt): 207 av 300 modeller er like float32 for float32 med den gamle leseren; i de 93 der koden regner nye hjørner av posisjonene, er avviket høyst 0,066 mm (designlinjene) og 0,24 µm (påhengsmotoren og rorkulten på plass), med samme antall hjørner. Skjermbildene før og etter av egen båt (trebåten med rorkulten) og havna i Finnsnes i begge formater ligger i `docs/okter/2026-11-10-21c/`.

## 4.11r Ytelsen på Galaxy A52s (Adreno 642L): havbunnen, himmelen bak sjøen og flåten (Ø3b, 10.11.2026)

Ø3b i `docs/planer/koen.md` (steg 46), Jonas' økt på grenen `ccr-da624f01-5lbjel`. Grunnlaget er Jonas' tre målinger fra telefonen 10.11.2026 (valg 8 i køen): `#prof` ved åpen sjø, `#prof` ved Tromsdalen fiskemottak med to båter ved siden av, og `first3d` fra en første start. Utseendet er ikke endret (`CLAUDE.md`: grafikken er nesten det viktigste): det samme bildet er tegnet med og uten endringene med klokkene frosset og sammenlignet piksel for piksel (under).

**Det målingene sier** (trebåten, natt, 617 × 1372 piksler på Høy):

| | Åpen sjø | Tromsdalen, i havn |
|---|---|---|
| «som nå» | 9 b/s, 106 ms, JS 23,1 ms | 8 b/s, 118 ms, JS 40,3 ms |
| tetthet 0,75 | 26 b/s | 20 b/s |
| full tetthet | 3 b/s (JS 83 ms) | 3 b/s (JS 105 ms) |
| uten sjø | 21 b/s | 12 b/s |
| uten terreng | 14 b/s | 13 b/s |
| uten båter | | 9 b/s |
| dyrest i «synk per del» | nær sjø 69,7 ms, nært land 32,3, fjernt land 23,1 | nært land og trær 51,4, nær sjø 38,3, fjernt land 24,3 |
| lange oppgaver i 4 s | 2 (296 ms) | 9 (886 ms) |

- **Telefonen er bundet av pikslene, ikke av trekantene eller JS-en.** Bildetida følger antall piksler nesten rett fram (0,75 × tettheten gir en fjerdedel så mange piksler og 106 → 38 ms). Det som koster, er altså hvor mange piksler som skyggelegges, og hvor dyr skyggeleggeren er for hver.
- **Terrenget kostet 35 ms av 106 ved åpen sjø, der det nesten ikke er land i bildet.** Terrengnettene dekker hele vinduet, også havbunnen, og hver piksel av den ble skyggelagt (med den dyreste terrengskyggeleggeren på nærnettene) før sjøen, som tegnes sist og er ugjennomsiktig, dekket den. Det samme i fjernpasset, og himmelen ble tegnet over hele bildet først. Under horisonten ble hver piksel dermed skyggelagt opptil fem ganger: himmel, fjern havbunn, fjern sjø (utenfor nærnettet), nær havbunn og nær sjø.
- **Sjøen selv er den største enkeltposten** (58 ms av 106 ved åpen sjø): bølgefeltet rundt båten (600 m) dekker nesten alt under horisonten fra jaktkameraet, med den fulle havskyggeleggeren. Den er ikke rørt her (se «Ikke gjort»).
- **JS-en** er 23 ms ved åpen sjø og 40 ms i havn, og vokser med bildetida (83–105 ms på full tetthet): mye av den er GL-kall som venter på grafikkortet, og jobbene som får en andel av bildet (terrengnettene inntil 30 %, bølgekartet). Av bildets egen JS i havn er de andre båtenes tilstand størst (under).
- **Auto-kvaliteten** går ned til Lav på denne telefonen (under 28 b/s i 4 s), der tettheten er 1: det er trolig derfor skjermen viste 23 b/s i spillet mens profilen, som holder nivået den startet på, viste 9. Alt under gjelder alle nivåene.

**Det som er gjort:**

- **Havbunnen tegnes ikke der sjøen dekker den** (`dryIdx`, `dryThr` i `view3d/17-draw.js`). Hvert av de fire rutenettene (`TERR`, `MIDM`, `NEARM`, `FINEM`) får sin egen indeksbuffer med bare trekantene som når over en høyde `thr`, i samme rekkefølge som den delte bufferen (`gridIdx`), og tegnes med den:
  - fjernpasset (`TERR`, `MIDM`), under den flate fjernsjøen: `thr` er 0,25–0,5 m under tidevannet (trinn på 0,25 m);
  - nærpasset (`NEARM`, `FINEM`), under den flate nærsjøen og bølgefeltet: lavere med det dypeste bølgedalene kan grave og en margin: `floor(tidevannet − 0,75) − ceil(3 × (Hs vindsjø + Hs dønning) + 2)`, i hele meter, der vindsjøen er den høyeste vinden kan reise i det hele tatt (`WV.cap`), ikke bare den ved båten, som kan ligge i ly 300 m fra åpent vann (funnet i gjennomgangen) (McCowans grense i havskyggeleggeren holder dessuten bølgene over bunnen på grunt vann);
  - bufferen lages på nytt når `thr` flytter seg et trinn (tidevannet rundt hvert femte minutt, været sjelden) og slettes med nettet (`freeMesh`); en høyde som ikke er et tall, beholder trekantene sine; med nærnettet ikke bygd ennå tegnes fjernnettet i begge pass med nærpassets høyde.
  - Bildet er det samme fordi sjøen tegnes over hver piksel der en stråle fra et øye over sjøen treffer sjøens plan: fjernringen (hele vinduet og 40 km, med hull for nærnettet), nærringen (nærnettet og 20 m, med hull for bølgefeltet) og bølgefeltet. Det som ligger helt under planet, synes aldri.
  - Alt tegnes som før når øyet ikke er minst 1 m over tidevannet (et kamera i en bølgedal), når profilen tar sjøen bort («uten sjø»), og med `#seabed1` i adressen. `G3._debug.dry` viser høydene og trekantene; `G3._debug.dryOff(bunn, himmel)` slår av og på mens spillet går (testen).
- **Himmelen skyggelegges ikke bak sjøen** (`skyMask` i `17-draw.js`, kalt fra `frame0` i `24-cinema.js`). Før himmelen tegnes hele fjernsjøens rektangel ved tidevannet (uten hull) bare til dybdebufferen, med et lite program (`sjømaske`) og en nærgrense på 1 m, så planet når inn under kameraet (fjernpassets egen nærgrense er 25 m), og himmelen tegnes med dybdetesten på. Den står bak planet ut til 20 km. Det fjernpasset tegner etterpå, står foran planet overalt der det er over vannet (dybden med nærgrense 25 m er den nærmeste av de to for alt som er under 25 ganger så langt unna som planet), og sjøen tegnes over hver piksel av planet, i fjernpasset eller nærpasset. Ikke når øyet ikke er over tidevannet, uten sjø i profilen, eller med `#skymask0`; en driver som ikke vil kompilere det lille programmet, får himmelen som før (`SKYMASK.P = false`).
- **De andre båtenes tilstand regnes én gang per bilde** (`npcFrame` i `view3d/20-trawl-seine.js`). Fjernpasset og `drawNPC` spurte `npcStates` hver for seg, den dyreste delen av bildets egen JS i havn (1,5 av 9,8 ms per bilde på en PC ved Tromsdalen, hver gang; tallet for telefonen er rundt fem ganger så høyt). Fjernpasset brukte bildets klokke og `drawNPC` båtenes egen (`npcClock`), så en båt begge passene tegnet (1,5–3 km unna), sto to steder mens minuttet ble holdt. Nå tegner begge henne der båtenes klokke har henne.
- **Senja-flåten regnes ikke ut langt fra Senja** (`fleetOff` i `core/05-vessels.js`, `docs/systemer/npc-trafikk.md`): det var den som leste Senja-flisene langt unna (punkt 4 i «Laggen 04.11.2026»).

**Målt her** (Playwright med SwiftShader, hele kysten, kart-31; «før» og «etter» er samme bygg med `dryOff`, så alt annet er likt):

| Sted (format) | Terrengtrekanter per bilde, før → etter (`TERR`, `MIDM`, `NEARM`, `FINEM`) | Piksler som skiller før og etter (av 1 024 000) | Støy (samme bilde to ganger) |
|---|---|---|---|
| Tromsdalen, i havn (800 × 1280) | 519 000 → 358 000 (129 → 84, 130 → 98, 130 → 106, 130 → 69 tusen) | 0 | 1 |
| Tromsdalen, i sundet (1280 × 800) | som over | 9–17, høyst 20 av 255 | 4–10, høyst 1 |
| Åpen sjø nord for Kvaløya, 70,10° N 17,50° Ø, 9 m/s (800 × 1280) | 519 000 → 4 000 (bare `TERR`; de tre andre tegnes ikke) | 343 (101 over 8 nivåer), høyst 30 | 410, høyst 1 |
| Åpen sjø (1280 × 800) | som over | 332 (8 over 8 nivåer), høyst 27 | 636, høyst 1 |
| Bergen, i havn (800 × 1280) | 519 000 → 401 000 | 0 | 0 |
| Bodø, i havn (1280 × 800) | 519 000 → 241 000 | 11, høyst 28 | 0 |
| Hammerfest, i havn (800 × 1280) | 519 000 → 298 000 | 74, høyst 29 | 6, høyst 1 |

- **Pikslene som skiller, er prikker som er borte.** Før stakk havbunnen gjennom sjøen i enkeltpiksler langs skjøtene mellom sjøens flater (ringene tegnes som fire striper av hvert sitt rutenett, og kantene møtes ikke punkt for punkt): en prikket, mørk linje i sjøen under horisonten på åpen sjø og i Hammerfest, og spredte prikker i sundet ved Tromsø. Uten havbunnen er de borte eller knapt synlige (det som er bak, er disen). Slått av hver for seg ved Tromsdalen: himmelmasken alene gir 5 piksler med høyst 1 nivå (støyen), bunnen alene de samme prikkene. I alle elleve pikslene som skilte over 2 nivåer der, ligner pikselen omgivelsene mer etter enn før. Utsnittene ligger i `docs/okter/2026-11-10-46/`.
- **Alle trekantene i bildet:** åpen sjø 858 000 → 345 000 per bilde (med den enkle sjøen, `sealvl=2`); i havn ved Tromsdalen går bare terrengets del ned (bygg, trær og båter er resten av 1,6 millioner).
- **Tida per bilde kan ikke måles her:** SwiftShader bruker 15–36 s på et bilde i telefonens oppløsning, nesten alt i havskyggeleggeren, og bildeintervallene i et lite vindu svinger fra 15 ms til 12 s mellom to like målinger. Tallet må komme fra telefonen (`docs/spill-dette/46.md`).
- **JS:** bildets egen JS i havn ved Tromsdalen var 9,8 ms per bilde på PC-en her (CDP-profil), av det `npcStates` 1,5 ms i fjernpasset og 0,8 av `drawNPC`s 1,2 ms; nå ett kall.
- **Testen** `tests/seabedtest.py` (3D): samme sammenligning ved naustet og på åpen sjø vest for Senja, hvor mye som kuttes, at alt tegnes igjen med øyet nede ved tidevannet, og at de andre båtene regnes én gang per bilde.

**Målt på telefonen etter utrullingen** (Jonas' `#prof` fra A52s ved Tromsdalen fiskemottak 10.11.2026 kveld, Wi-Fi, versjon `916257ea9a9b`; spilltid 4. okt 11:58, altså dag, mens målingen før var natt, så lysene og himmelen er ikke de samme; nivået står ikke i bildet):

| Tromsdalen, i havn | Før (natt) | Etter (dag) |
|---|---|---|
| «som nå» | 8 b/s, 118 ms, JS 40,3 ms | 12 b/s, 83,7 ms, JS 17,7 ms |
| tomt bilde | | 60 b/s, 16,6 ms, JS 6,9 ms |
| tetthet 0,75 / 1 / full | 20 / – / 3 b/s | 25 / 19 / 5 b/s |
| uten terreng | 13 b/s (terrenget 41 ms) | 14 b/s, 70,5 ms (terrenget 13 ms) |
| uten sjø | 12 b/s (sjøen 35 ms) | 18 b/s, 54,4 ms (sjøen 29 ms) |
| uten båter | 9 b/s | 12 b/s, 84,0 ms (båtene ingenting) |
| lange oppgaver i 4 s | 9 (886 ms) | 0 |
| «synk per del»: nært land og trær / nær sjø / fjernt land | 51,4 / 38,3 / 24,3 ms | 42,9 / 47,8 / 36,8 ms (hele bildet 201 ms med synk, så delene er blåst opp) |

- Bildet går fra 118 til 84 ms, terrengets andel fra 41 til 13 ms, JS-en fra 40 til 18 ms, og de lange oppgavene er borte. Hvor mye av det som er natt mot dag, kan ikke skilles ut av ett bilde.
- Sjøen er nå klart størst (29 av 84 ms), og bildet er fortsatt bundet av pikslene (0,75 × tettheten gir 39 ms). Det tomme bildet går i 60 b/s, så det er det som tegnes, ikke nettleseren. Neste steg er havskyggeleggeren (backloggen).

**Første start** (`first3d` fra telefonen, inkognito, Wi-Fi, `warm:false`): brevet etter 13,7 s, 5,0 s fra «Start her» til første 3D-bilde (`models_s` 0). Ø3a målte 11,2 s og 29,4 s med CPU-en strupet 4× i SwiftShader, og Ø3c 10,9 s etter sine endringer; på telefonen er ventetiden altså halvparten av det testmiljøet viste, og modellene er inne når det spørres etter dem. Tiden til brevet er nedlastingen og tolkingen av siden på et første besøk (9,6 MB før komprimering) og er ikke rørt her.

**Ikke gjort, og hvorfor:**

- **Havskyggeleggeren** er det som koster mest på 642L (58 av 106 ms ved åpen sjø, 35 av 118 i havn). Den kan gjøres billigere uten å endre bildet ved å hoppe over ledd som er slått av (ingen kjølvann, ingen punktlys, ingen skumtopper i stille vær) med en gren på en uniform, men 642L har før nektet å lenke havskyggeleggeren etter mindre endringer enn det (5.20, «kjølvannet borte» 05.11.2026), og en feil der gir en enklere sjø for alle med den driveren. Det kan ikke prøves i SwiftShader. Det står i backloggen som neste steg, med måten det bør prøves på.
- **Rekkefølgen i nærpasset** (båten før terrenget, nærnettet før fjernnettet): lite å hente etter at havbunnen er borte, og terrengskyggeleggeren forkaster piksler (hullet for det finere nettet og vannlinja), så den tidlige dybdetesten er uansett avhengig av driveren.
- **Hvilken commit i havsteget som gjorde laggen verre** (et bygg med kart-28): leseren av Senja-flisene er funnet og tatt bort, så spørsmålet har ikke lenger noe å si, og klonen i økta har ikke historikken (grunn klone).

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

## 5.24 Kino-visning (03.10.2026, ny regi 01.11.2026)

- **Knappen** (filmkamera) under kameraknappen skrur kino på og av (`G3.kino`, `KINO` i `view3d/24-cinema.js`). Roen (UI 2, U2-4, 07.11.2026, `docs/systemer/ui-og-telefon.md`) bygger på «Skjul»: etter åtte sekunder uten trykk blir knappene, Kamera, Kino og «Skjul» svake av seg selv, mens stripa, minikartet og kompasset står.
- **Brukes til trailerklipp** (Jonas 01.11.2026: «det må se bra ut»). Regien ble bygd om 01.11.2026 fra seks faste opptak etter tur til fjorten slag som velges etter hvor båten er.
- **Opptakene** (`KSHOT`) varer 8–20 s. Hvert har en vekt ute på havet og en ved land, og en lengde:
  - `drone`: sirkler rundt båten, stiger litt og zoomer sakte inn
  - `low`: lavt langs siden i vannflaten, med litt håndholdt skjelv
  - `ahead`: forfra, skyver sakte inn mot baugen
  - `pass`: et kamera lavt ved kursen som båten går tett forbi; det panorerer med henne, og linsen holder størrelsen hennes (bare i fart)
  - `shore`: fra land med telelinse, bildet tre–fire båtlengder høyt, kryper innover
  - `chase`: bakfra over kjølvannet, svaier litt fra side til side
  - `vista`: bare ved land. Høyt (90–380 m) på sjøsiden av båten, ser forbi henne mot fjellene og glir sakte på tvers (parallakse)
  - `reveal`: kran fra lavt bak båten opp og bakover, siktet løftes fra båten mot landet
  - `pullback`: trekker seg ut fra tett på båten til 500–900 m unna og høyt, til båten er en prikk i fjorden med landet bak
  - `vertigo`: dolly zoom: kameraet går bakover mens linsen lukker seg, så båten holder størrelsen og landet bak vokser
  - `top`: rett ovenfra, dreier sakte og stiger
  - `flyover`: fra lavt foran båten opp over henne og ned bak, og ender som høy chase langs kursen
  - `profile`: fra siden med lang linse (10–30°), med landet som glir forbi bak
  - `away`: kameraet blir stående mens båten går fra det, og linsen følger henne ut (bare i fart)
- **Valget** (`kinoNext`): `kinoLand` ser etter land i 24 retninger ut til 3,5 km. Andelen med land blander vektene mellom hav og land, så landskapsopptakene kommer oftest nær land og nesten aldri langt til havs. Samme slag kommer ikke igjen innen fem opptak. Sideopptakene står på sjøsiden, så landet er bak båten.
- **Opptak som hoppes over** (`kinoOk`): ved start, midt og slutt (med båten flyttet fram langs kursen) må øyet være over bakken, et lavt øye over vann (unntatt kameraene som står på land), og verken terrenget (`kinoSight`), bygg, kaier eller båter (`camFree`) stå mellom øyet og båten.
- **Kameraet:** banene er glattet (smoothstep og sinus), og øyet og siktepunktet glattes i tillegg over 0,7 s, med klipp ved nytt opptak. Linsen glattes over 0,5 s. Horisonten er vannrett.
  - Glattingen skjer relativt til båten (`KINO.eyeR`, `KINO.tgtR`). Før ble den gjort i verdensrammen. Siden båten går seks ganger raskere på skjermen (71 m/s ved 23 kn), hang kameraet rundt 50 m etter, og båten var som oftest utenfor bildet (Jonas 04.10.2026).
  - Kameraene som står i verden (`shore`, `pass`, `away`) står stille, og bare siktet følger båten.
  - Er båten skjult bak land, bygg eller båter i mer enn ett sekund, klippes det til neste opptak.
  - Nærplanet går ut med et høyt kamera langt unna (`KINO.near`, 0,25–6 m), som for det vanlige kameraet.
- **For testene og trailerens harness:** `G3._debug.kinoNext(type)` ber om et bestemt slag (det tas hvis det passer der båten er og går klar), `G3._debug.kinoTypes` lister dem, og `G3._debug.kino` gir slag, nummer, linse, høyde, fri sikt og avstand.
- **Trailerens kamera** (`G3.film(o)`, `FILM` i `view3d/24-cinema.js`, flettet inn i arbeidsgrenen 10.11.2026 med Jonas' ja): `null` i spillet, og da går kameraet som før. `{fov}` alene setter følgekameraets brennvidde (grader); `{eye, tgt, fov}` setter øyet i et punkt i verden (meter) og sikter mot `tgt`, eller mot midten av båten når `tgt` er `'boat'` eller mangler. Det går foran kino, men ikke foran visningsmodus (`SHOW`) og maleren (`PAINTV`). Brukes bare av `trailer/tools/film.py`.
- **«Skjul»** tar bort statusboksen, knappene, kompasset og minikartet. Bare de to kinoknappene står igjen.
- Kameraknappen avslutter kino.

## 5.40 Bro-visningen rister ikke (09.10.2026)

`model()` i `view3d.js` lager en `Float32Array`. Kameraøyet i bro-visningen ble regnet gjennom den med båtens verdensposisjon (rundt 1 000 000 m), og float32 har der bare 6–12 cm oppløsning. Øyet hoppet derfor i trinn mens skroget, som tegnes relativt til øyet, ikke gjorde det. Det ga et sagtann-mønster rundt 10 ganger i sekundet som økte med farten (målt i Jonas' video: 1–2 px glidning per bilde, så 8–10 px tilbake). Nå roteres øyets plass på skroget alene og legges til posisjonen i full presisjon, og `BMabs` har posisjonen i full presisjon. **Regel:** legg aldri verdenskoordinater inn i `model()` når resultatet brukes til noe annet enn en matrise som sendes til GPU-en relativt til øyet. Test: `tests/helmjit.py`.

## 5.42 Nordlyset i buer og folder (tilbakemelding #56, 09.10.2026)

Gardinene sto på en linje med små folder langs den magnetiske øst-vest-retningen, så sett på langs ble de «et langt teppe som henger på himmelen i en rett linje». Nå:
- **Linja bøyer seg** (`aFold` i himmelskyggeren): store buer, S-folder, små krusninger og en strammere krøll som vandrer langs den.
- **Strålen følges opp** gjennom høydene i ni steg, og arket lyses der den krysser linja. En fold sett fra siden vises derfor to ganger. Den gamle fastpunkt-løsningen kunne ikke følge store bøyer.
- **Kantlyset regnes ut fra linjas egen normal**, ikke fra en fast retning.
- **Underkanten bølger**, og gardinene kommer og går i biter langs lengden, så buene slutter på himmelen.
- **Test:** `aurorashot` (OK). Bilder fra fire retninger før og etter ble sendt til Jonas.
