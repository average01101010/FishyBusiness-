# Grafikk: natur, miljø og omgivelser (plan, 28.10.2026)

> Planen for den grafiske overhalingen av naturen og omgivelsene langs kysten. Skrevet av økta 28.10.2026 etter `/planlegg`. **Vedtatt 28.10.2026** (Jonas: «Dropp oppdrettsanlegg. Jeg ønsker ikke noe søksmål. Kjør på med det du mener er fysisk mulig å få til innenfor prosjektets rammer og potensielle begrensninger.»). Valgene i kapittel 6 er tatt av økta etter det; rammene og hva som er mulig står i kapittel 5a. Hver fase er én økt, G1 først. Måleenheten er Jonas' OnePlus Pad 3. Status står nederst og oppdateres av hver økt som bygger en fase. Systemdokumentene som gjelder: `docs/systemer/3d-verden.md`, `kart-og-terreng.md`, `bygg-veier-og-kaier.md`, `vaer-og-hav.md`.

## 1. Bestillingen

Jonas 28.10.2026, ordrett: «Grafisk overhaling av natur, miljø og omgivelser i spillet. Mål: Høyest mulig nivå av realisme.» Og: «kan ikke du finne ut hvordan vi kan gjøre ta spillet grafisk til next-level? Jeg tenker da på alt som ligger i offentlige kartdata eller andre ting som vi burde ta inn i spillet for at spillere skal kjenne seg igjen i verden. Kom gjerne også med andre forslag til hvordan du mener vi kan ta spillet til et mye bedre grafisk nivå.»

Reglene som gjelder: grafikken er nesten det viktigste, og kvaliteten senkes ikke uten målinger (Jonas 03.10.2026); terrenget er viktigst, «arbeidsplassen er naturen og båten», og spillet skal gå jevnt på telefoner, nettbrett og i nettleser (18.10.2026); spillet er nasjonalt, alt bygges for hele kysten (06.10.2026); eget simulert vær, ikke live-vær (06.10.2026); ingen ekte firmanavn (07.10.2026); kildene oppgis. **Bare Norge** (Jonas 28.10.2026: «vi trenger ikke å ta med Sverige, Finland, Danmark i dette selv om vi har data derfra allerede»): de nye lagene fylles bare over norsk land (`national.norway200`), og nabolandene beholder bakken slik den er. **Vannlinja skal med** (Jonas 28.10.2026: «Husk også alt som ligger i vannlinjen som kaier, moloer, flytebrygger eller andre ting som kan være relevante for de kystnære detaljene»): fase G10. Sjøen og skroget hører til Fysikk 4 (`docs/planer/fysikk-4-sjo-og-skrog.md`) og er ikke med her.

## 2. Slik er det i dag

Kort, med filene (`docs/systemer/kodekart.md` har linjenumrene):

- **Bakken:** 25 m-høyder fra Terrarium z13 (Kartverkets 10 m-terreng) i 10 km-blokker innen 3 km fra sjøen, z11 (rundt 30 m) ellers, lest på 25 m; fjernhøyder på 200 m (`far`) fra z9 (`tools/map/region.py`, `coast.py`, `national.py`). Finbakken rundt båten samples 2,7–4 m fra de samme 25 m-cellene, så den er glatt. Terrarium z13 har 5–8 m per piksel på norskekysten; vi tar bare hver fjerde piksel.
- **Bakkens farge og materiale** (`view3d/04-vec-packs.js` `recolor`, `01-shaders.js` `terFS`, `MATQ` 0–2, `3d-verden.md` 4.11b): fargen regnes per punkt fra høyde, helning, snøgrensen (`snowLineAt`) og skoglaget; berg der det bratner, lav, lyng, myr under 70 m på flat mark, tuer og sprekker som støy på høy kvalitet. Ingen fliser, ingen detaljteksturer. **Ikke gjort:** ur ved foten av stup, detaljteksturer, fasader og tak (4.11b).
- **Arealdekket:** av Overtures ti arealklasser (ESA WorldCover 10 m: forest, grass, shrub, crop, barren, wetland, moss, snow, urban, mangrove) tar rørledningen bare `forest` som 1 bit på 50 m (`region.py` 78, `coast.py` 83). Myr, dyrket mark, bart fjell, vidde, buskmark og evig snø finnes i kilden, men ikke i spillet; de gjettes av helning og høyde.
- **Innsjøer og elver finnes ikke.** Overtures `base/water` hentes (`tools/map/ov.py` `TYPES`), men brukes bare til moloer (`vectors.py` 137). Senjas vann, Lofotens fosser og Helgelands elver er bakke i spillet.
- **Skogen** (`06-buildings-lights.js` `addTrees`, `treeSeason`): bjørkeskog under tregrensa med litt furu, farget etter årstiden (`seasonAt`, V3: naken, grønn, gul), tegnet ut til 1,3 km (2,2 på Ultra). Treslag, høyde og tetthet er gjettet, like for Pasvik og Sunnmøre.
- **Byggene** (`06-buildings-lights.js` `bldCells`): Overtures fotavtrykk (i Norge stort sett Kartverkets bygg importert i OpenStreetMap), type fra `vectors.py` `BT`, kasse med saltak, tilfeldig vegg- og takfarge per type, pipe, vinduer og dører nær båten, lys i vinduene om natta. Høyde, takform og farge fra kilden (`height`, `roof_shape`, `roof_color`, `facade_color` der OSM har dem) brukes ikke.
- **Himmelen og lufta** (`15-env-mooring.js`, himmelskyggeren i `01-shaders.js`): senit- og horisontfarge etter solhøyde og skydekke, skyer som støy som driver med vinden (5.61), sol, måne med hav, stjerner, nordlys (5.42). Dis er én farge blandet inn med avstanden (`uFog`, `uFogD`) i alle skyggerne, uten blått spredningslys. Ingen tonemapping: fargene klippes ved 1,0, så sola på snø og solnedgangen mister det lyseste.
- **Lys og skygge:** sol og måne, opptil 8 punktlys (5.23), skygger på terrenget med tidsgrense per bilde (`SHMS`), lyskjegler fra fyr.
- **Vær i 3D:** regn og snø som punkter i en boks på 26 × 16 m rundt øyet (`24-cinema.js` «rain or snow»), sjørokk og sprut, dis av sjørokk. Ingen våte flater, ingen dråper på bruvinduet, ingen skodde som ligger på fjellet, snøen legger seg bare på tak (`snowy`) og bakke.
- **Liv:** måker (5.26), flytrafikk (22-docks-air), NPC-flåten, folk på kaia og om bord. Ingen ørn, skarv, ærfugl, hval, sau eller biler.
- **Steder i sjøen:** sjømerker, fyr, skjær (4.12c), flytebrygger (4.15). Ingen oppdrettsanlegg, vindturbiner eller kraftspenn.
- **Nullpunkt:** OnePlus Pad 3 i fint vær 71 bilder/s, 14,1 ms, Høy (Fysikk 4). Galaxy A52s mister konteksten (BACKLOG 10.1), så alt nytt må kunne slås av per kvalitetsnivå.

## 3. Offentlige data vi kan ta inn

Alt under er sjekket mot katalogene 28.10.2026 (`data.norge.no`, Geonorge). «Lisens» er det katalogen sier; den som bygger fasen, leser lisensteksten én gang til før dataene legges i repoet.

| Kilde | Hva det gir spillet | Oppløsning | Lisens | Vurdering |
|---|---|---|---|---|
| **Overture `base/land_cover`** (ESA WorldCover 2020) | Myr, dyrket mark, bart fjell, vidde (moss), buskmark, evig snø og bre, tettsted, i tillegg til skogen vi har | 10 m vektor, tas på 50 m som i dag | Åpen (ESA CC BY 4.0, Overture) | **Billigst og først.** Samme rørledning, samme lag, bare ti verdier i stedet for én. |
| **Overture `base/water`** (OpenStreetMap) | Innsjøer, elver, bekker, fosser på land | Vektor | ODbL | Hentes alt. Ny lag-type i vec-pakkene. |
| **Kartverket Sentinel-2 skyfri mosaikk** (årlig, 1. august) | Den ekte fargen på bakken: jorder, myr, lav, berg, hogstflater, grustak, tettsteder | 10 m, tas på 20 m | Åpen lisens hos Kartverket; Copernicus-data krediteres | Trolig det største løftet for «kjenne seg igjen». Må prøves: mosaikken har solskygger og augustfarger, og må blandes med årstidene våre. |
| **NIBIO SR16 skogressurskart** | Treslag (gran, furu, lauv), trehøyde, kronedekning per celle | 16 m raster | NLOD 2.0 i nyeste post (eldre post sier Norge digitalt; sjekk) | Riktig skog: granskog i Trøndelag og på Helgeland, furu i Pasvik, bjørk i Troms. |
| **Kartverket DTM1 / Høydedata** | 1 m-terreng: svaberg, skjær, strandberg, hyller | 1 m | CC BY 4.0 | For stort for hele kysten (anslag over 2 GB bare i en 300 m-stripe langs kysten). Brukes ikke direkte; i stedet tettere lesing av Terrarium z13 (10 m) nær sjøen, se G8. |
| **Fiskeridirektoratet akvakulturregister** | Oppdrettsanleggene | Punkter og flater | NLOD | **Ikke med** (Jonas 28.10.2026: «Dropp oppdrettsanlegg. Jeg ønsker ikke noe søksmål»). Anleggene er private eiendommer med eiere i registeret; ingenting av det tas inn, heller ikke som hinder. |
| **NVE vindkraftverk** | Turbinene på Fosen, Smøla, Kvitfjell/Raudfjell utenfor Tromsø, Havøygavlen, Raggovidda, Berlevåg med flere, med posisjon per turbin | Punkter | Åpen (NVE) | Landemerker sett fra sjøen. Modell i Blender, roterer med vinden. |
| **NVE nettanlegg** | Kraftspennene over sundene (Gisundet, Tromsøysundet) med mastene | Linjer | Åpen (NVE) | G7, sammen med turbinene. Bare det som synes fra sjøen. |
| **Kartverket N50 Arealdekke** | Myr, skog, åpent område, dyrket mark, snø og bre, steinbrudd, industri, tettbebyggelse, innsjø, elv | Vektor 1:50 000 | CC BY 4.0 | Alternativ til ESA der ESA tar feil (valg 1). Egen rørledning (SOSI/GML via Geonorge). |
| **NVE breatlas** | Breene (Svartisen fra Helgeland, Øksfjordjøkelen som kalver i sjøen, Folgefonna) | Vektor | Åpen (NVE) | Kontroll av ESA-klassen `snow`, som også kan ta skygger og sent snødekke. |
| **seNorge** (NVE/MET) | Snødybde per km², daglig og normaler | 1 km | Åpen | Daglig strider mot «eget simulert vær». Normalene kan kalibrere `snowLineAt` per sted senere. Ikke med nå. |
| **SEAPOP** (NINA) | Sjøfuglkoloniene | Punkter | Åpne, men datasettene er tatt ned «til nye data er på plass» | Ikke tilgjengelig. De ti kjente koloniene (Røst, Lovund, Runde, Hornøya, Gjesvær, Bleiksøya, Sør-Gjæslingan …) legges inn for hånd, G9. |
| **FKB-Bygning** (Kartverket) | Takflater i 2,5D, ekte høyder | Vektor | Gratis for Norge digitalt-parter; **private må kjøpe tilgang gjennom forhandler** | Ikke med. Overtures `height`/`roof_shape` der de finnes, er gratis og tas i G1. |
| **Norge i bilder** (ortofoto) | Flybilder | 0,1–0,5 m | Norge digitalt, tillatelse fra rettighetshaverne også for ikke-kommersiell publisering | Ikke med. Sentinel-2 er det åpne alternativet. |
| **Kartverket dybde 25 m** | Finere bunn | 25 m | CC BY 4.0, men bare utenfor 12 nm | Innenfor territorialgrensen er alt finere enn 50 m gradert. Ingenting nytt å hente. |

### 3b. Det Overture alt har fra OpenStreetMap (funnet i G1, 28.10.2026)

Overture-utgaven rørledningen alt leser (`tools/map/ov.py`, `2026-09-23.1`) har mer enn planen regnet med, fordi OpenStreetMap i Norge i stor grad er Kartverkets N50 importert. Talt over Senja-ruta (90 × 100 km):

| Tema i Overture | Det som finnes (antall flater, linjer eller punkter) | Brukes i |
|---|---|---|
| `base/land` (naturtyper) | myr 15 134, skog 3 791, holmer 2 186, enkelttrær 505, topper 492, bart fjell 227, stup 203, strand 183, ur 171, steiner 115, gressmark 91, kratt 80, bre 32, lyng 36, skjær 19, rullestein 10 | G1 (arealdekket), G8 (stup, ur), G10 (strand, skjær) |
| `base/land_use` | dyrket mark 2 465, skiløyper 636, boligfelt 283, idrettsbaner 174, steinbrudd 70, oppdrett 53 (ikke brukt), kirkegårder 64, industri 35, småbåthavner 5 | G1 (jorder, eng, steinbrudd, industri), G10 (småbåthavner) |
| `base/water` | bekker 11 415, vann 8 451, elver 724, fosser 116, innsjøer 126, tjern 66, bukter 202 | G2 |
| `base/infrastructure` | strømstolper 5 158, høyspentmaster 2 589, gatelys 1 299, bruer 568, brygger 418, moloer 93, kaier 67, ferjekaier 21, demninger 37, master 107, lysmaster 72 | G7 (kraftspenn), G9 (gatelys), G10 (vannlinja) |

ESA alene fant myr på 1,4 % av Senjas land og én åker; med N50-flatene er det 8 % myr og 2,2 % dyrket mark. Det gjør valg 1 (N50 der ESA tar feil) overflødig: N50 kommer med uten egen rørledning.

## 4. Andre grafiske løft (uten nye data)

Det som ikke avhenger av kartdata, i rekkefølge etter hvor mye det løfter hvert bilde mot hva det koster på nettbrettet:

1. **Tonemapping og lys i høyt dynamisk område.** I dag klippes fargene ved 1,0 i hver skygger. En filmisk kurve (ACES-lignende) i hver fragmentskygger, uten eget etterbehandlingspass, gir riktig sol på snø, solnedganger, lys i mørket og hvitt skum uten at midttonene blir flate. Billig: noen instruksjoner per piksel.
2. **Luftperspektiv i stedet for én disfarge.** Fjerne fjell blir blåere og lysere mot himmelen (Rayleigh), ikke gråere mot én farge; nær sola blir disen varm (Mie). Det er den ene tingen som gjør at fjellrekkene i Lofoten og Lyngen ser ut som på bilder. Regnes per punkt i vertex-skyggeren for terrenget og per piksel for sjøen, med dagens sikt (`visibility`) som tetthet.
3. **Himmel med fysikk.** Senit og horisont fra en enkel spredningsmodell (Preetham/Hosek-Wilkie-tabeller, forhåndsregnet per solhøyde) i stedet for håndsatte farger; solskiva med glans; skyene får lys fra sola (lyse kanter mot sola, mørk base) og en skybase: når skydekket er tett og sikten kort, ligger skodda på fjellet og kutter toppene. Svært norsk, og nesten gratis: en høyde der terrengskyggeren blander inn skyfargen.
4. **Vått og nedbør.** Regn og snø i lufta (finnes som punkter) får vind og dybde; våte kaier, dekk, moloer og berg blir mørkere og speiler lyset mens det regner og en stund etter; dråper på bruvinduet; snøen legger seg på kaier, brygger, dekk, trær og moloer etter `seasonAt`, ikke bare på tak.
5. **Skogen som skog.** Nære trær som nå, fjerne trær som billboard-impostorer (ett firkantet ark per tre med forhåndstegnet silhuett, åtte retninger), så skogen kan gå ut til 6–10 km uten å koste. Tetthet, høyde og treslag fra SR16 (kapittel 3).
6. **Nærfeltet på land.** Innenfor 60–100 m fra øyet: gress og lyng som tuer (instanser), småstein, tang i fjæra (finnes som farge, får form), detaljteksturer for berg og gress (256², triplanar, «krydder» fra 4.11b), ur ved foten av stup.
7. **Vannet møter land.** Grunt vann over sand blir turkist (Haukland, Ramberg, Ersfjord): fargen over bunnen fra dybden og arealklassen `barren` på flat strand. Brenninga og tidevannssona finnes.
8. **Liv.** Biler med lys på veiene om natta og gatelys langs veiene i tettstedene (veiene finnes i vec-pakkene), røyk fra pipene i kulde, havørn som seiler langs stupene, skarv på skjærene, ærfugl i fjæra, sau på beite på øyene om sommeren (fra arealklassen `grass`), hval etter sted og årstid (spekkhogger og knølhval ved Skjervøy og Kvænangen november–januar, spermhval utenfor Andenes om sommeren).
9. **Fjernterrenget.** 200 m-rutenettet gir takkete silhuetter mot himmelen 20–60 km unna. 100 m (Terrarium z10) i det samme vinduet firedobler laget (5,2 MB → rundt 20 MB), og luftperspektivet (punkt 2) skjuler det meste. Måles etter G5 før det bestemmes.

## 5. Fasene

Hver fase er én økt. Hver fase slutter med bilder før og etter fra de samme seks stedene (Senja, Lofoten, Bergen, Bodø, Hammerfest, Hvaler) i stående og liggende format, og en måling på nettbrettet (`#fps`) mot nullpunktet 71 bilder/s. Alt nytt følger `QUAL` og kan slås av på Lav. Rekkefølgen under er anbefalingen (valg 3).

### G1. Arealdekket: ESA, N50-naturtypene og jordene, og byggenes høyde og takform

> **Bygd 28.10.2026** (`3d-verden.md` 4.11c). Byggenes høyde og takform er tatt ut: Overture har 0 % høyde, takform og farge og 4,7 % etasjer i Norge (Finnsnes). Punktene under er planen slik den var.


- **Bygger:** `forest` (u8, 50 m, 1 bit) blir `cover` (u8, 50 m, klassekode 0–10, samme størrelse). `region.py`, `coast.py`, `game.py` skriver det; `GAME` i `coast.py` får laget; ny kartrelease `kart-N` fra `kart.yml`. I spillet leser `recolor` (`04-vec-packs.js`) og `terFS` klassen: `barren` gir berg uavhengig av helning (bart fjell på vidda og svaberget), `wetland` gir myr (i dag bare under 70 m), `crop` gir jorder med kanter og striper, `moss` gir vidde (lav og lyng, ingen trær), `snow` gir evig snø og bre over snøgrensen, `shrub` gir kratt, `grass` gir eng og beite. `addTrees` planter skog bare i `forest` og kratt i `shrub`. Byggene tar `height`, `num_floors`, `roof_shape`, `roof_color` og `facade_color` fra Overture der de finnes (`vectors.py` skriver dem i bygglaget, `bldCells` leser dem); ellers som i dag.
- **Filer:** `tools/map/region.py`, `coast.py`, `game.py`, `vectors.py`, `core/01b-mapdata.js` (laget), `view3d/04-vec-packs.js`, `01-shaders.js`, `06-buildings-lights.js`.
- **Tester:** `landtest`, `coast3d`, `teleport3d`, `vectest`; nytt bilde-skript `terrshot.py` i `tests/` (variantarket fra 18.10 lå i kladdemappa og er ikke i repoet).
- **Måles:** klassene mot det vi vet: vidda rundt Vadsø skal være `moss`/`barren`, Jæren `crop`, Senjas myrer `wetland`, Svartisen `snow`. Dataene er fra 2020.
- **Forutsetter:** en kartrelease (`kart.yml` tar noen timer i Actions).

### G2. Innsjøer, elver og fosser

- **Bygger:** `vectors.py` tar `base/water` på land (`lake`, `reservoir`, `river`, `stream`, `canal`) inn i vec-pakkene som nytt lag `water` (flater og linjer, i flisa der midten ligger, som bryggene). `01c-vec.js` pakker det ut i workeren. I 3D (ny del `view3d/26-inland-water.js`, inn i malen etter `25-controls.js`): en innsjø er en flat, speilende flate i høyden til det laveste strandpunktet (lest fra `hgt`), med en enkel skygger (himmelspeiling, krusning av vinden, mørk bunn); terrenget under senkes ikke, flata legges 0,3 m under bredden. En elv er et bånd 2–12 m bredt etter klassen, drapert på bakken med hvitt der fallet er over 5 %, og en foss (sprut som billboard, lyd senere) der fallet er over 40 % over 30 m. Kartplotteren (`03-map.js`) tegner innsjøene og elvene på land fra z > 3, som veiene.
- **Filer:** `tools/map/vectors.py`, `core/01c-vec.js`, `view3d/26-inland-water.js` (ny, i `src/index.html` og `COVER`), `ui/03-map.js`.
- **Tester:** `vectest`, `charttest`; nytt `lakeshot.py` (Senja: Svanelvvatnet og Ånderdalen; Lofoten: Storvatnet ved Reine; sjekk at ingen innsjø ligger skrått eller over bredden).
- **Måles:** vec-pakkenes størrelse (35,5 MB i dag), Tromsø-flisa.
- **Forutsetter:** ny kartrelease (kan tas sammen med G1).

### G3. Bakkens farge fra Sentinel-2 (prøve på Senja, Jonas avgjør)

- **Bygger:** Kartverkets skyfrie mosaikk for siste år lastes i `kart.yml` (WMS eller Geonorge-nedlasting, GeoTIFF) og samples på 20 m som RGB565 (2 byte per celle) i `view`-pakkene, bare innenfor 3 km fra sjøen som høydene. I `recolor` blir mosaikkens farge sommerens grunnfarge (albedo) etter at mosaikkens egen belysning er tatt ut (del på et lavpassfiltrert lysbilde, så solskyggene i august ikke dobles med spillets skygger), og årstidene legges oppå som i dag: snø, halmgul vinter, gul høst (`grassNow`, `treeSeason`), og `cover` fra G1 der mosaikken er usikker (skygge, sky, vann). Fjernterrenget får mosaikken på 200 m.
- **Først Senja alene**, med bilder før og etter fra seks steder på øya i fire årstider. Jonas ser bildene og velger (valg 2). Hele kysten bygges bare om han sier ja.
- **Filer:** `tools/map/region.py`, `coast.py`, `game.py`, `kart.yml`, `core/01b-mapdata.js`, `view3d/04-vec-packs.js`, `01-shaders.js`.
- **Tester:** `landtest`, `teleport3d`, `terrshot`.
- **Måles:** størrelsen (anslag: det dobbelte av høydelaget per flis), lastetid, og om fargene stemmer i skygge og mot vann.
- **Usikkert:** Sentinel har 10 m, men skyrester, snøflekker i august i fjellet og fargestikk mot blått i skygge er kjent. Det er derfor en prøve, ikke et løfte.

### G4. Skogen fra SR16, og impostorer for fjerne trær

- **Bygger:** `tools/skog/` henter SR16-rasteret (Geonorge-nedlasting via et nytt `skog.yml`, som `dybde.yml`), og `game.py` legger treslag (2 bit), høyde (4 bit, 0–30 m i 2 m-steg) og kronedekning (2 bit) i ett u8-lag `trees` på 25 m i `view`-pakkene. `addTrees` planter gran (kjegle, mørk), furu (krone høyt, rødlig stamme) og lauv (bjørk, rogn, or) etter klassen, i tettheten og høyden cellen sier, og lar `cover` fra G1 gjelde der SR16 mangler data. Nye trær i Blender (`/blender`): gran, furu, bjørk i tre størrelser, med en impostor-tekstur (8 retninger × 3 årstider × snø) som tegnes som instanser fra 400 m og ut til 8 km. Hogstflater kommer av seg selv (SR16 har dem som lav skog).
- **Filer:** `tools/skog/skog.py` (ny), `.github/workflows/skog.yml` (ny), `tools/map/game.py`, `view3d/06-buildings-lights.js`, `01-shaders.js` (impostor-skygger), `tools/wild/` eller `tools/harbour/` for modellene.
- **Tester:** `landtest`, `teleport3d`, `terrshot`; ny `treeshot.py` (Pasvik furu, Namdalen gran, Senja bjørk, Finnmarksvidda ingen).
- **Måles:** trekanter og tegnekall med skog ut til 8 km, bildetakt i Namdalen (tett granskog) mot nullpunktet.
- **Usikkert:** SR16-lisensen (NLOD 2.0 i nyeste post; en eldre sier Norge digitalt). SR16 dekker produktiv skog; fjellbjørkeskogen over den kan mangle og tas da fra `cover`.

### G5. Himmelen, lufta og lyset: tonemapping, luftperspektiv, skybase

- **Bygger:** punkt 1–3 i kapittel 4. En felles GLSL-bit `TONE` (ACES-tilnærming) i enden av hver fragmentskygger (terreng, sjø, bygg, båter, himmel, partikler), med eksponering fra solhøyden og skydekket i `computeEnv` (`15-env-mooring.js`), så natta ikke løftes. Luftperspektivet som to ledd (Rayleigh blått, Mie varmt mot sola) med dagens `visibility` som tetthet, i stedet for `uFog` som én farge; terrenget regner det per punkt, sjøen per piksel. Himmelen fra forhåndsregnede tabeller for solhøyde og turbiditet (32 × 8 verdier, lastet som tekstur), solskiva med glans, skyene med sollys fra kanten og mørk base, og skybasen: en høyde fra skydekket og sikten der terrengskyggeren blander inn skyfargen, så fjelltoppene står i skodde på grå dager.
- **Filer:** `view3d/01-shaders.js` (alle fragmentskyggerne, himmelen), `15-env-mooring.js`, `17-draw.js` (uniformene).
- **Tester:** `lighttest`, `aurorashot`, `kinotest`, `sea3d` (ingen hopp), `heattest`; nytt `skyshot.py` (seks solhøyder × tre skydekker, Senja og Bergen).
- **Måles:** bildetakt på nettbrettet, fordi dette ligger i hver piksel. Skal ligge innenfor 3 ms av nullpunktet, ellers trinnvis etter `QUAL` (luftperspektiv per punkt på Lav).
- **Risiko:** Adreno 642L og Direct3D (BACKLOG 10.1, `vaer-og-hav.md` 5.20) tåler ikke alle skyggere; hver endring får `#` -bryter i adressen og faller tilbake som sjøen gjør (`dsb_sea`).

### G6. Vått og nedbør

- **Bygger:** punkt 4 i kapittel 4. Nedbøren i lufta som instanser i en sylinder 40 m rundt øyet med vinden fra `env.windDir`, snø som flak som daler, regn som streker; en «våthet» 0–1 i `env` som stiger i regn og faller over to timer, som gjør kaier, moloer, dekk, berg og veier mørkere og blankere (spekulær i `terFS` og byggskyggeren); dråper på bruvinduet i bro-visningen (teksturert glass i `13-instruments.js`/`23-camera-frame.js`), snø som legger seg på kaier, brygger, moloer, dekk og trær fra `seasonAt` (snødybden ved sjøen finnes alt), og vått snø-slaps i mildvær.
- **Filer:** `view3d/24-cinema.js` (partiklene flyttes til en egen del `27-weather.js`), `01-shaders.js`, `15-env-mooring.js`, `05-quays-breakwaters.js`, `06-buildings-lights.js`.
- **Tester:** `kinotest`, `lighttest`; nytt `wetshot.py` (Bergen i regn, Senja i snøvær, bro-visning).
- **Måles:** partikkelantall mot bildetakt; av på Lav.

### G7. Vindturbiner og kraftspenn (landemerkene)

- **Bygger:** `tools/vind/vind.py` henter NVEs vindkraftverk (turbin for turbin, navhøyde der den finnes) og nettanleggene som krysser sjø (linjer med mastepunkter) til `src/data/vind.json` og `src/data/spenn.json`; ingen eier- eller firmanavn tas med, bare posisjon, høyde og spennvidde. Blender (`/blender`): en vindturbin i to størrelser (rundt 80 og 150 m navhøyde) og en kraftmast med liner. I 3D tegnes turbinene innenfor 12 km (de er 150–250 m høye og synes langt) med rotorene i vindens hastighet og rødt hinderlys om natta (5.23), spennene innenfor 3 km som liner med nedheng mellom mastene. Kartplotteren viser turbinene og spennene med sjøkartets symboler (vindturbin, luftspenn med seilingshøyde der NVE oppgir den).
- **Filer:** `tools/vind/` (ny), `src/data/vind.json`, `spenn.json`, `view3d/22-docks-air.js` eller ny del, `ui/03-map.js`, `docs/systemer/datarorledninger.md`.
- **Tester:** `lighttest`; nytt `vindshot.py` (Kvitfjell/Raudfjell fra Malangen, Smøla, Havøygavlen, Gisundet med spennet: ingen turbin i sjøen, ingen mast under vann).
- **Måles:** tegnekall med Fosen-parkene i synsfeltet (de største, over 200 turbiner).
- **Usikkert:** NVE-lista har konsesjonsstatus, og en turbin under bygging kan stå i lista før den står på fjellet; bare «i drift» tas med. Seilingshøyden på spennene finnes ikke i alle poster.

### G8. Nærfeltet på land: 10 m-bakke langs sjøen, tuer, detaljteksturer og ur

- **Bygger:** `hgt` leses på 10 m i stedet for 25 m i 10 km-blokkene innen 1 km fra sjøen (Terrarium z13 har det), som eget lag `hgt10` i `view`-pakkene; finbakken og nærterrenget tar det der det finnes. Svaberg, skjær og strandberg får da sin form i stedet for å glattes. Så punkt 6 i kapittel 4: tuer av gress og lyng som instanser innen 80 m, detaljteksturer (berg, gress, grus, 256², triplanar) i `terFS` på høy og ultra, ur (løse blokker, instanser) der helningen går fra over 45° til under 25° på 30 m, og tangen i fjæra som form.
- **Filer:** `tools/map/region.py`, `coast.py`, `game.py`, `core/01b-mapdata.js`, `view3d/02-mesh-terrain.js`, `01-shaders.js`, `04-vec-packs.js`.
- **Tester:** `landtest`, `coast3d`, `terrshot`.
- **Måles først, på Senja-flisa:** størrelsen på `hgt10` (anslag 4–6 × dagens høydelag for stripa, men stripa er en brøkdel av blokkene). Blir hele kysten over 150 MB mer, tas stripa ned til 500 m, eller fasen gjør bare tuer, teksturer og ur.
- **Forutsetter:** kartrelease.

### G9. Liv i landskapet

- **Bygger:** punkt 8 i kapittel 4: gatelys langs veiene i tettbebyggelse (`cover` = urban) som punktlys i avstand og lyspunkter nær, biler som lyspar som følger veiene om natta og små kasser om dagen (vec-veiene, deterministisk av flisas frø, 2–10 per km i tettsted, 0–1 på landet), røyk fra pipene under 5 °C, havørn (seiler i oppvind langs stup over 100 m, to per 10 km kyst i nord), skarv på skjær (sjømerkenes skjær, 4.12c), ærfugl i fjæra, sau på øyer med `grass` mai–september, hvalene etter sted og årstid (`spawnWild` finnes for måkene), og fuglefjellene for hånd (de ti kjente). Hvert dyr som egen liten modell i `tools/wild/` med LOD.
- **Filer:** `view3d/19-wildlife-npc.js`, `22-docks-air.js`, `06-buildings-lights.js`, `tools/wild/`, `src/data/fuglefjell.json` (ny, for hånd med kilde).
- **Tester:** `lighttest`, `vectest`; nytt `lifeshot.py` (måkene har ingen egen test i dag).
- **Måles:** tegnekall om natta i Tromsø.

### G10. Vannlinja: kaier, moloer, brygger, strender og skjær

- **Bestilt** av Jonas 28.10.2026 underveis i G1 (sitatet står i kapittel 1). I dag finnes kaifronter, moloer med plastringsstein, faste brygger som flater eller kasser, flytebrygger fra Blender, tang og rur i tidevannssona og brenninga (`bygg-veier-og-kaier.md` 4.15, `3d-verden.md`).
- **Bygger:** kaiveggene får materiale (betong med tidevannsstripe og grønske under middelvann, tre med svarte fendere og bildekk, stein i eldre kaier), pullerter, leidere og fenderlister langs kaifrontene (`quay` i vec-pakkene) etter lengden; de faste bryggene uten `floating=yes` (BACKLOG: grå kasser i Kristiansand og Hammerfest) får dekke, pæler og utriggere (alternativ b fra #94); strendene og rullesteinsfjærene fra N50 (`base/land` sand og shingle) legges som eget lag langs kysten på 5 m, siden de er for smale for 50 m-rutene i `cover`; skjærene og holmene får tang, rur og brenning etter eksponeringen; stupene (`physical/cliff`) gir brattkant i fjæra; småbåthavnene (`recreation/marina`) får bøyer og fortøyde småbåter.
- **Filer:** `tools/map/vectors.py` (nye lag: strand, skjær, stup, småbåthavn), `core/01c-vec.js`, `view3d/05-quays-breakwaters.js`, `22-docks-air.js`, `tools/harbour/` (pullert, leider, fender, brygge på pæler i Blender).
- **Tester:** `vectest`, `moortest`, `docktest`, `havntest`; `terrshot.py` med havnene (Finnsnes, Husøy, Bergen, Bodø, Hammerfest).
- **Ingen firmanavn** og ingenting fra oppdrettsanleggene.

## 5a. Rammene, og hva som er mulig (28.10.2026)

Jonas ba om «det du mener er fysisk mulig å få til innenfor prosjektets rammer og potensielle begrensninger». Rammene, og hva de betyr for hver fase:

- **Én side, kartpakkene ved siden av.** Alt nytt av data går i pakkene (`view` og `vec`), aldri i siden (6,2 MB). Pakkene strømmes per flis og huskes i IndexedDB; GitHub Pages har 1 GB per side og Hetzner ingen grense som betyr noe, så det dobbelte av dagens 230 MB er trygt. Valg 5: A.
- **Nettbrettet.** Jonas spiller på OnePlus Pad 3; nullpunktet er 71 bilder/s på Høy der. Det som ligger i hver piksel (G5, G6, G8s teksturer), får høyst 3 ms til sammen, ellers trinnvis etter `QUAL`. Det som er data (G1–G4, G7), koster bare der det tegnes og styres av avstandene som i dag. Pad 3 har skjerm nok til Ultra, så Ultra-trinnet måles også der.
- **Adreno 642L og Direct3D** nekter enkelte skyggere. Hver ny skygger får en reserve og en bryter i adressen, som sjøen (`dsb_sea`), og kan ikke ta 3D ned. Ikke en hindring, men en regel for G5, G6 og G8.
- **GitHub Actions** lager kartet (`kart.yml`, noen timer per release, 6 timer er taket per jobb). G1, G2, G3 og G8 trenger hver sin release, eller én felles; Sentinel-mosaikken (G3) og SR16 (G4) må kunne hentes uten en handlekurv på Geonorge (WMS/WCS eller en direkte fil), ellers hentes de én gang for hånd og legges som en release, slik `dybde-N` gjøres.
- **Lisensene** avgjør hva som i det hele tatt tas inn: ESA/Overture, OpenStreetMap, Kartverkets Sentinel-mosaikk, SR16 (NLOD) og NVE er åpne; FKB, Norge i bilder og alt med eiere og firmaer er ute.
- **Testmiljøet** har bare Senja (`tools/map/out/game` mangler), så hver fase bygges og måles på Senja først, og hele kysten prøves der stikkprøvene krever det (`/stikkprove`).

| Fase | Mulig? | Grensen |
|---|---|---|
| G1 arealdekket | Ja, sikkert | Én kartrelease. ESA er fra 2020. |
| G2 innsjøer og elver | Ja, sikkert | Innsjøhøyden fra 25 m-høyder; flata legges under bredden. |
| G3 Sentinel-2 | Ja som prøve på Senja; hele kysten bare om bildene holder og laget er under rundt 60 MB | Solskygger og augustfarger i mosaikken; størrelsen. Avgjøres i økta etter bildene, ikke før. |
| G4 SR16 | Trolig; om rasteret ikke kan hentes automatisk, hentes det for hånd som en release. Reserve: treslag etter klima og sted (gran innenlands sør for Saltfjellet, furu i Finnmark og Pasvik, bjørk på kysten) over `forest` fra G1 | Nedlastingsveien og lisensposten. |
| G5 himmel og lys | Ja; det dyreste i tid per piksel | 3 ms-grensen; reserver for Adreno. |
| G6 vått og nedbør | Ja | Partiklene av på Lav. |
| G7 turbiner og spenn | Ja, lite | NVEs lister. |
| G8 10 m-bakke og nærfeltet | Bakken bare om `hgt10` for hele kysten holder seg under rundt 150 MB; tuer, teksturer og ur uansett | Måles på Senja-flisa før noe bygges for kysten. |
| G9 liv | Ja | Tegnekall om natta i byene. |
| G10 vannlinja | Ja | Vec-pakkene vokser litt (strand og skjær på 5 m bare langs kysten). |

## 6. Valgene (tatt av økta 28.10.2026)

Jonas overlot valgene til økta («kjør på med det du mener er fysisk mulig»). Tatt slik, med grunnen:

1. **Arealdekket: A og C i ett**: ESA-klassene, med OpenStreetMaps naturtyper og arealbruk over (N50 importert i OSM), i samme rørledning (kapittel 3b).
2. **Bakkens farge: A**, Sentinel-2 prøves på Senja, og økta som bygger G3 avgjør etter bildene og størrelsen om hele kysten får det. Bildene legges i `docs/pr/` så Jonas kan se dem.
3. **Rekkefølgen: A**: G1, G5, G2, G3, G4, G7, G6, G8, G9, og G10 (vannlinja) etter G2, fordi den bruker de samme vec-lagene. De billige dataene først, så lyset som endrer hvert bilde, så resten etter gevinst.
4. **Oppdrettsanleggene: ute** (Jonas 28.10.2026). G7 er bare turbiner og spenn, uten eiere og navn.
5. **Datamengden: A**, pakkene får vokse til rundt det dobbelte, målt per fase.
6. **Fjernterrenget på 100 m: A**, avgjøres etter G5 med bilder.

## 7. Antatt og usikkert

- **Lisensene** er lest i katalogene, ikke i lisenstekstene: Sentinel-mosaikken står som åpen hos Kartverket, og Copernicus krever kreditering; SR16 står med NLOD 2.0 i nyeste post og Norge digitalt i en eldre; FKB er ikke gratis for private; Norge i bilder krever tillatelse. Den som bygger fasen, leser lisensen og skriver kilden i `docs/systemer/datarorledninger.md`.
- **Størrelsene** er anslag til flisa er bygd: `cover` koster ingenting (samme lag), `water` som bryggene (0,5 MB rått), Sentinel på 20 m rundt det dobbelte av høydelaget, `trees` som høydelaget på 25 m delt på to, `hgt10` måles.
- **Bildetakten** på nettbrettet er bare målt én gang (71 bilder/s). G5 og G6 ligger i hver piksel og kan koste 2–5 ms; det er grensen for at Høy holder 60.
- **ESA WorldCover er fra 2020** og klassifisert av satellitt: hogstflater, nye felt og snødekke i opptaksåret kan slå ut. `snow` kontrolleres mot NVEs breatlas.
- **Innsjøenes høyde** fra 25 m-høyder kan være noen meter feil i bratt terreng; flata legges etter det laveste strandpunktet, så den aldri ligger over land.
- **Terrarium z13** er Kartverkets 10 m i Norge, men pikselstørrelsen varierer med breddegraden (5–8 m); `hgt10` leses bilineært.
- **Adreno og Direct3D:** hver ny skygger får en bryter og en reserve, som sjøen (`dsb_sea`).

## 8. Det planen ikke gjør

- Sjøen, skummet, bølgene mot land og skroget: Fysikk 4 (F2–F8).
- Båtmodellene, dekket og folkene om bord (`3d-baater-og-animasjon.md`).
- Kartplotteren i 2D, bortsett fra innsjøer, elver, turbiner og spenn der G2 og G7 legger dem inn.
- Live-vær og seNorge daglig (Jonas 06.10.2026: eget simulert vær).
- Oppdrettsanleggene (Jonas 28.10.2026: ingen søksmål), ortofoto og FKB (lisens), og alt annet med eiere og firmaer.
- Interiør, fabrikker og rom under dekk (Jonas 06.10.2026).
- Lyd (fosser, regn på taket) hører til `lyd.md` og kommer når G2 og G6 er sett.
- Etterbehandling med egne pass (bloom, SSAO, TAA): dyrt på nettbrett, og tonemapping gjøres i skyggerne. Vurderes etter G5 om målingene gir rom.

## 9. Måling på nettbrettet

Hver fase måles på Jonas' OnePlus Pad 3 (det han spiller på, 28.10.2026) med `#fps` i fint vær ved Finnsnes (nullpunktet 71 bilder/s, 14,1 ms, Høy), og i Tromsø om natta (tettest bebyggelse). Jonas sender tallene, og en fase som koster mer enn 3 ms på Høy, får effekten trinnvis etter `QUAL` før neste fase begynner. `tm_perf` sender bildetakten til dashbordet, men ikke stedet (BACKLOG 10.5); G5 legger stedet (flisa) til, så tette byer kan skilles ut.

## Status

- 28.10.2026: planen skrevet (gren `ccr-1d00422f-gjapvb`, må flettes inn i arbeidsgrenen).
- 28.10.2026: Jonas: «Dropp oppdrettsanlegg. Jeg ønsker ikke noe søksmål. Kjør på med det du mener er fysisk mulig å få til innenfor prosjektets rammer og potensielle begrensninger. Lag en plan for dette før vi går i gang.» Oppdrettsanleggene tatt ut, valgene tatt av økta (kapittel 6), rammene og gjennomførbarheten skrevet (kapittel 5a). **Neste: G1 (arealdekket) i egen økt.**
- 28.10.2026: Jonas: «Husk bare at vi ikke trenger å ta med sverige, finland, danmark … Kjør på når du er klar. Husk å ta gode bilder underveis», og underveis: «Husk også alt som ligger i vannlinjen som kaier, moloer, flytebrygger …» (fase G10).
- 28.10.2026: **G1 bygd** (`3d-verden.md` 4.11c): laget `cover` fra ESA, N50-naturtypene og arealbruken, i Senjas pakker og i kartreleasen `kart-10` for hele kysten (258,7 MB mot 250,1 MB i `kart-8`); farger, myr, jorder, lyng, vidde, bre, trær og ruska i spillet. Bilder før og etter i `docs/pr/ccr-1d00422f-gjapvb/g1/`. Byggenes høyde og takform er tatt ut (Overture har dem ikke i Norge).
- 28.10.2026: **G5 bygd** (`3d-verden.md` 4.11d): luftperspektiv per fargekanal med varm dis mot sola, skulder mot hvitt fra 0,8, og skodde på fjellet for alt som tegnes. Bilder i klart og grått vær i `docs/pr/ccr-1d00422f-gjapvb/g5-clear/` og `g5-grey/`. Ikke målt på nettbrettet ennå. Neste: G2 (innsjøer og elver).
- 29.10.2026: **G2 bygd** (`3d-verden.md` 4.11e): innsjøer, tjern, elver, bekker og fosser fra `base/water` i `kart-12`, og resten av G5 (glansen rundt sola, jordskyggen med det rosa beltet, skyene lyst fra sola). I samme økt: brenningene ute i sjøen rettet (`vaer-og-hav.md`), fangstfeltene uten sirkel (Jonas). Bilder i `docs/pr/ccr-1d00422f-gjapvb/g2/` og `brenning/`. Ikke bygd: innsjøene i kartplotteren, lyden av fosser. Neste: G3 (Sentinel-2 på Senja).
- 29.10.2026, Jonas: «Jobb deg gjennom en og en oppgave av G3, G4, G7, G6, G8, G9, G10 … Når en oppgave er ferdig og du mener den er klar, kjører du den ut på detstorebla.no. Ikke stopp før du har fullført alle oppgavene.» Valgene: G3 avgjør økta selv ut fra bildene (hele kysten bare om det er klart bedre); en kilde som ikke kan hentes automatisk, erstattes av en åpen kilde som kan brukes kommersielt; alt nytt trinnvis etter `QUAL` med en av-bryter i adressen, Jonas måler med `#fps` når det passer. Blender-modeller for dyreliv og annet der det trengs.
