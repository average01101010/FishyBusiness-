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
- **Byggenes høyde og takform** var med i planen for G1, men Overture har nesten ingenting av det i Norge: rundt Finnsnes har 0 av 5 704 bygg høyde, takform eller farge, og 4,7 % har antall etasjer. Det er ikke bygd.
- **Bildene** tas med `tests/terrshot.py` (båten til et sjøpunkt, kameraet mot mest land, lavt og fra drone) og settes sammen med `tests/terrpair.py`; sammenligningen før og etter ligger i `docs/pr/ccr-1d00422f-gjapvb/`.

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
