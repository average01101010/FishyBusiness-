# Hus, veier, bruer, brygger, moloer og kaier (vec-pakkene)

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.15 Hus, veier, bruer, brygger, moloer og kaier langs kysten (del 4, 03.10.2026)

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

**Pakkenes brygger, flater og veier under enhetene (Jonas 08.10.2026, tilbakemelding #45, #46, #50).** `tileStatics` i `view3d.js` hopper over vec-brygger og -flater som ligger under en havneenhet (blokk, fylling, 3 m margin eller basseng, `unitCovers` i `01-world.js`) eller et rorbu-/naustområde (`onSite`), og `addRoads` hopper over veisegmenter der (6 m margin). `11b-obstacles.js` gjør ikke lenger slike brygger til båthinder. Kontroll med alle steder (08.10.2026, før rettingen): 0 synlige bygg i konflikt, men brygger/moloer i liggeplassen ved 98 av 161 mottak, 99 av 132 verft og 45 av 64 butikker, vei over enheten ved 31/77/11 av dem, og bruer innenfor 5 m ved 16 steder (ikke rettet: bruer, `shoreSpot` i `07c-naust.js` ser bare Senjas `PIERBOX`, og 17 mottak–verft/butikk-par i samme by ligger nærmere enn 1,5 km). Neste: la `tools/steder/steder.py` avvise kaifronter med fast hinder i liggeplassen, og flytt stedene som berører en bru.

**Flytebryggene blant pakkenes brygger (Jonas 25.10.2026, tilbakemelding #94, alternativ a).** Bryggene som OpenStreetMap merker `floating=yes`, tegnes med havnas Blender-moduler (`tools/harbour/brygge.py`), ikke som grå kasser 2,4 m over sjøen.
- **Dataene:** `python3 tools/map/flyte.py` lager `src/data/flyte.json`, rundt 340 kB.
  - Kilden er Overtures `base/infrastructure` (brygger med `source_tags` `floating=yes`), samme utgave som kartet (`kart.json`).
  - Den trenger `tools/map/out/game` for flisene.
  - Resultatet er 6 764 flytebrygger i spillets fliser. Andelen merket i noen byer: Bodø 41 av 50 brygger, Bergen 45 av 93, Tromsø 32 av 55, Båtsfjord 16 av 24, Kristiansand 13 av 48 og Hammerfest 3 av 19.
  - Brygger uten merket står som før.
  - Dataene ligger utenfor vec-pakkene, så kartet trenger ikke bygges på nytt. Rørledningen er endret siden `kart-8`, og et nytt bygg ville tatt med mer.
- **Hver flytebrygge** har midtpunktet slik spillet regner det (snittet av punktene i hele meter), og linjene pontongene følger.
  - En brygge tegnet som linje er linja selv.
  - En brygge tegnet som flate får midtlinja: et rektangel får langaksen, ellers Voronoi-kantene av omrisset uten sporene ut til hjørnene. Bredden er medianen langs linja.
- **Kjent igjen:** `vecDecode` gir hver bryggeboks midtpunktet (`fm`), og `flyteTile` i `01c-vec.js` gir flisas flytebrygger. `tileStatics` hopper over bryggeboksene og flatene med samme midtpunkt (innenfor 1 m) og bygger flytebryggene (`floatJob` i `view3d.js`, én brygge per steg i flisas jobb, så Bergens 339 ikke blir 150 ms i ett bilde). Senja er unntatt, som for de andre vec-bryggene.
- **Modulene:**
  - Pontonger på 12 m langs linjer på 1,6 m og bredere, skalert på langs så de passer etappen og på tvers etter bredden (0,7–1,6).
  - Fingre på 8 m langs smalere linjer, fra enden der de møter en annen linje.
  - Endepontongen med leider og livbøye i en åpen ende.
  - Høyst én landgang per brygge: fra landkaret på land eller en fast brygge innenfor 10 m bak den nærmeste åpne enden.
  - En ende som møter en annen linje innenfor 1,5 m, er sammenkoblet, også mot en annen brygge, fordi OSM ofte har hver arm som egen brygge. En ende inntil land (3 m) får ingenting.
- **Tegningen** følger tidevannet:
  - Nær øyet (150, 250, 350 eller 450 m etter `QUAL.lvl`) tegnes modulene som er i synsfeltet. Hver har 800–1 600 trekanter og tegnes i ett kall. Pontongene hiver litt med sjøen (0,3), og landgangen vinkles etter høyden.
  - Hele flisa har i tillegg lave kasser i ett nett, litt innenfor modulene (`relM` har høyden `oy`).
  - Kamerahindringene er dekkene fra under vann til over rekka.
  - De tetteste havnene, rundt Oslo, har rundt 300 moduler innenfor 350 m. I testmiljøet tegnes 138 der.
- **Prøvd** i mN51 (der #94 ble meldt), Bergen, Bodø, Tromsø, Båtsfjord, Hammerfest og ved Oslo. Sjekken ligger i `vectest.py` (Tromsø).
- **Ikke gjort:** NPC-båtenes kaiplasser ved en flytebrygge kartlagt som linje regnes som før mot en brygge på 4,2 m. Båten ligger derfor rundt 0,9 m fra pontongkanten.
