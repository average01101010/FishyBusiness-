# NPC-flåten for hele landet: automatisert, mer realistisk og flere fartøytyper (plan, 28.10.2026)

Jonas 28.10.2026: «Lag en fremtidsplan om å automatisere npc-flåten i hele landet, gjøre oppførsel mer realistisk, innlegging av flere typer npc-fartøy.»

Planen bygges ikke før Jonas har valgt (kapittel 4) og sagt «kjør på». Hver fase er én økt.

## 1. Hva som finnes i dag

Systemdokumentet er `docs/systemer/npc-trafikk.md` (4.16, 4.16b, 5.14).

- **Kystens fiskebåter** (`tools/map/npc.py`, `vec`-pakkenes `npc`, fra `kart-7`): én båt per 150 m kaifront, 1–3 per havn, 4 137 langs kysten. Lengdene trekkes fra en fast fordeling. Feltene er 2–4 per havn, valgt etter skråningen i dybden, og leia er korteste vei på et 100 m rutenett. Navnene trekkes fra en liste.
- **Oppførselen** (`coastState` i `core/05-vessels.js`): ut om morgenen kl. 4–8, driv med vinden på feltet i kast på 45 min, hjem om ettermiddagen, inne i kuling og 30 % fridager. Alle båtene oppfører seg som jukse- eller linjebåter; ingen setter garn, drar snurrevad eller går til et mottak. Ingen sesonger.
- **Felles verden:** posisjonen er en ren funksjon av den felles klokka, så alle spillerne ser de samme båtene. Bare båtene innen `AIS_KM` (15 km) regnes (`coastNear`).
- **Liggeplassene** (`coastMoor`, 4.16b): kai, flytebrygge eller bøye, fri for land og andre båter.
- **3D** (`npcMesh` i `view3d/20-trawl-seine.js`): byggesettets dekkede kystmodell nærmest i lengde og bredde, fire fargedrakter. Bare fiskebåter.
- **Bare Senja** (håndlaget, `core/05-vessels.js`): `FLEET` (14 navngitte båter som tar fisk fra bestanden), kystruteskipet «MS Kystpilen» og ferja «MF Senjasund» på faste ruter (`NPC_ROUTES`, `npcStates`). Langs resten av kysten finnes verken ferjer, kystruta, hurtigbåter, lasteskip eller fritidsbåter.
- **Andre som vises på AIS:** spillernes båter (`peerStates`), tidligere mannskap med egen båt (`alumniStates`), oppdragsbåtene (`turNpcs`) og redningsskøyta (`rescueAis`).

## 2. Kildene (alle åpne, sjekkes på nytt før hver fase)

| Kilde | Hva den gir | Lisens |
|---|---|---|
| Fiskeridirektoratets fartøyregister (merkeregisteret, «Fartøy, eier og fisketillatelser») | hver registrert fiskebåt med lengde og hjemkommune | NLOD; feltlista sjekkes i datadokumentasjonen |
| Fiskeridirektoratets sluttsedler (landingsdata, brukt alt i `tools/mottak/`) | fangst per redskap, art, måned, område og kommune | NLOD |
| Fiskeridirektoratets «Fiskeplasser – redskap» (aktive og passive, WFS på gis.fiskeridir.no) | fiskeplassene langs kysten etter redskap, med navn der de har det, fra intervjuer med fiskerne | NLOD |
| Entur, ruter og stopp i NeTEx | ferjesamband, hurtigbåter og kystruta, med avganger | NLOD |
| Kystverkets historiske AIS (HAIS) | spor per skipstype siden 2010; fiskebåter under 15 m og fritidsbåter under 45 m er unntatt | uten tilgangsvilkår; sjekkes |
| OpenStreetMap (`route=ferry`, småbåthavner) | ferjeleiene og gjestehavnene | ODbL, med kilde oppgitt |

Ingen ekte fartøynavn, rederier eller merkenavn brukes i spillet («Jeg orker ikke å bli saksøkt»). Registeret brukes bare som statistikk: hvor mange båter, hvor lange og med hvilket redskap, per kommune.

## 3. Fasene

### N1. Datagrunnlaget for fiskeflåten

- **Bygger:** `tools/npc/` (ny) leser fartøyregisteret og sluttsedlene og gir per kommune antall aktive båter etter lengdegruppe (under 11 m, 11–15 m, 15–21 m, 21–28 m) og redskap (garn, line, jukse, snurrevad, teine, not, trål), og hvilke måneder og arter de lander. `npc.py` fordeler båtene på havnene i kommunen etter kaifronten, som i dag, men med det riktige antallet og redskapet i stedet for én fast fordeling. Fiskeplassene erstatter skråningsregelen: en båt får feltene for sitt redskap innen rekkevidden for sin størrelse.
- **Fangstfeltenes navn langs hele kysten:** fiskeplassene som har navn, kommer i kartplotteren som navn uten sirkel (Jonas 28.10.2026), som Senjas felt nå.
- **Filer:** `tools/npc/` (ny), `tools/map/npc.py`, `tools/map/coast.py`, `kart.yml`, `core/05-vessels.js` (nye felt i båtene), `ui/03-map.js` (navnene).
- **Tester:** `npctest` (antall per havn, redskapet, feltene på vann), `charttest` (navnene).
- **Måles:** antallet mot Fiskeridirektoratets 4 614 aktive fiskefartøy (2024), størrelsen på `npc` i vec-pakkene, og hvor mange havner som får båter.

### N2. Fisket etter redskap og sesong

- **Bygger:** `coastState` får én oppførsel per redskap, fortsatt som en ren funksjon av den felles klokka:
  - **Garn:** setter om ettermiddagen, ligger inne om natta, trekker neste morgen. Garnlenkene står med blåser i sjøen mens de står.
  - **Line og autoline:** setter tidlig, trekker etter noen timer.
  - **Jukse:** driver som i dag.
  - **Snurrevad og trål:** slep i rette strekk over feltet med lav fart.
  - **Teine:** går ei rekke teiner og røkter dem.
- **Levering:** båten går til nærmeste mottak som tar arten (`MOTTAK`), legger til der en stund og går så hjem. Det gir trafikk ved mottakene, slik det er i virkeligheten.
- **Sesongene fra sluttsedlene:** skreisesongen samler båter fra hele Nord-Norge i Lofoten og Vesterålen januar–april, seisesongen, makrellen og sild. En båt kan ha en annen hjemhavn i sesongen enn resten av året.
- **Hva det gir spilleren:** flåten står der fisken er etter de ekte landingene, så den som følger med på AIS, finner fisken; Lofoten i mars er fullt av båter.
- **Filer:** `core/05-vessels.js`, `view3d/20-trawl-seine.js` (redskapet i sjøen), `view3d/19-wildlife-npc.js`.
- **Tester:** `npctest` (samme tid gir samme posisjon, redskapet på vann, levering ved et mottak), ny `npcseason.py` (Lofoten i mars mot juli).
- **Måles:** tiden i `coastNear` i Lofoten i mars (flest båter innen 15 km).

### N3. Ferjene

- **Bygger:** ferjesambandene langs hele kysten fra Entur (avgangene) og OpenStreetMap (leia). Hver ferje går etter rutetida, legger til ved ferjekaia og ligger der om natta. Størrelsen etter sambandet (antall biler). Senjas «MF Senjasund» går inn i det samme systemet.
- **Filer:** `tools/npc/ferje.py` (ny), vec-pakkene (`ferry`), `core/05-vessels.js`, `core/01c-vec.js`.
- **Tester:** ny `ferrytest.py` (Bodø–Moskenes, Halhjem–Sandvikvåg, Bognes–Lødingen: avgangen stemmer med rutetida, ferja ligger ved kaia mellom turene, leia holder seg på vann).
- **Usikkert:** Enturs data er så gode som det fylket og operatøren leverer.

### N4. Kystruta og hurtigbåtene

- **Bygger:** ett kystruteskip i hver retning hver dag mellom Bergen og Kirkenes, med anløpene og tidene fra Entur (eller den faste rutetabellen), og oppdiktede skipsnavn («MS Kystpilen» blir ett av dem). Hurtigbåtene fra Entur på samme måte.
- **Filer:** som N3.
- **Tester:** `ferrytest.py` (kystruta i Tromsø, Bodø og Ålesund på rett tid).

### N5. Skipsfarten: lasteskip, tankskip, cruiseskip og Kystvakten

- **Bygger:** leiene og tettheten per skipstype fra Kystverkets historiske AIS, slått sammen til et nett av leier. Skipene går etter en tidsplan som følger klokka, med like mange per døgn og årstid som i dataene (cruiseskipene om sommeren). Ingen skip har ekte navn.
- **Filer:** `tools/npc/ais.py` (ny), `kart.yml` eller en egen workflow, vec-pakkene (`lanes`), `core/05-vessels.js`.
- **Tester:** ny `shiptest.py` (leiene på dypt nok vann, tettheten i Vestfjorden og Oslofjorden mot dataene).
- **Usikkert:** hvor mye HAIS-data som kan hentes i workflowen innen grensa på 6 timer.

### N6. Fritidsbåter og seilbåter om sommeren

- **Bygger:** fritidsbåter og seilbåter fra småbåthavnene (flytebryggene i vec-pakkene) på fine sommerdager, mest i helgene, korte turer og fisketurer nær land. Ingen AIS-data finnes for dem, så tettheten er et anslag etter folketallet i kommunen.
- **Filer:** `core/05-vessels.js`, `tools/map/npc.py`.
- **Tester:** `npctest`.

### N7. Modellene

- **Bygger:** i Blender (`/blender`), bare utsiden: ferjer i tre størrelser, kystruteskip, hurtigbåt, lasteskip, tankskip, cruiseskip, Kystvakt, og fiskebåtene etter redskap (snurrevadbåt, autoliner, ringnotbåt, tråler). Fritidsbåt og seilbåt. LOD som i dag (full detalj innen 500 m, enkel ut til 1,5 km, boks utenfor) og fargedrakter. Redskapet vises med de modellene spillet alt har.
- **Filer:** `tools/boats/` eller `tools/ships/` (ny), `src/data/*.b64`, `vessel3d.js`, `view3d/20-trawl-seine.js`.
- **Tester:** `vesseltest`, ny `npcshot.py` (bilder av hver type).
- **Måles:** tegnekall og trekanter i Bergen havn og i Lofoten i mars.

### N8. Sjømannskap: vikeplikt, lys og signaler

- **Bygger:** båtene og skipene viker for spillerens båt etter sjøveisreglene (kryssende kurs, møtende, forbikjøring; et stort skip i ei lei viker ikke for en sjark). Lanterner og dagsignaler etter hva båten gjør (fisker, tråler, ankret), AIS-status (under fart, fisker, fortøyd) og lydsignaler.
- **Filer:** `core/05-vessels.js`, `view3d/19-wildlife-npc.js`, `lyd.md`.
- **Tester:** ny `colregtest.py` (en ferje og en fiskebåt på kryssende kurs med spilleren).
- **Kilde:** forskrift om forebygging av sammenstøt på sjøen (sjøveisreglene, FOR-1975-12-01-5), sjekkes på Lovdata før bygging.

## 4. Valgene

1. **Hvor mange båter og hvilket redskap: A** Fiskeridirektoratets register og sluttsedler som statistikk per kommune. B dagens regel etter kaifronten. *Anbefaling A:* da står flåten der den står i virkeligheten, med det redskapet som brukes der.
2. **Navnene: A** oppdiktede navn på alle fartøy, også kystruta og ferjene. B ekte navn fra registeret. *Anbefaling A:* ekte fartøynavn og rederier er firmanavn, og regelen er ingen ekte firmanavn.
3. **Tar NPC-flåten fisk fra bestanden? A** nei, som i dag. B ja, etter fangsten i sluttsedlene. *Anbefaling A:* bestandsmodellen har alt det virkelige fisket med, så B ville telle det to ganger.
4. **Vikeplikten: A** båtene viker bare i spillerens egen visning og bare nær spillerens båt (innen rundt 1 km), og går tilbake til den felles banen etterpå. B ingen viking. *Anbefaling A:* den felles klokka bestemmer hvor båtene er for alle, og et lite avvik nær din egen båt er det eneste som ikke gjør verdenen ulik for andre.
5. **Rekkefølgen: A** N1, N2, N3, N4, N7, N8, N5, N6. B den synlige trafikken først (N3, N4, N7), så fisket. *Anbefaling A:* fiskeflåten er kjernen i spillet og gir spilleren noe å bruke (der flåten er, er fisken); ferjene og kystruta kommer rett etter.

## 5. Antatt eller usikkert

- Om fartøyregisterets åpne utgave har hjemkommune og lengde i samme fil, er ikke sjekket (datadokumentasjonen fra 2020 beskriver fila «Fartøy, eier, første ledd»).
- Fiskeplassene er under oppbygging hos Fiskeridirektoratet, og noen områder kan mangle. Der brukes skråningsregelen som i dag.
- HAIS har ikke fiskebåter under 15 m og fritidsbåter under 45 m, så de små båtene kan ikke kopieres fra sporene; de lages etter registeret og anslag.
- Ytelsen med flere hundre båter innen 15 km i Lofoten i mars er ikke målt. `AIS_KM` og LOD-avstandene kan måtte gjøres trinnvis etter `QUAL`.
- Alt er en ren funksjon av klokka, så ingen server trengs. En ferje som er forsinket av været, må regnes ut av været ved avgangen, slik båtene i dag regner kulingen.

## 6. Hva planen ikke gjør

- Ingen kø ved mottakene eller ventetid som spilleren må vente på (regelen om at ventetid aldri legges inn).
- Ingen NPC-båter som konkurrerer om kaiplassen spilleren holder (`havnBerths` passer alt på det).
- Ingen samtaler på VHF eller oppdrag fra NPC-båtene; det er en egen plan om det ønskes.
- Ingen oppdrettsbåter (brønnbåter, fôrbåter) (Jonas 28.10.2026: ikke noe om oppdrett).
- Ingen ekte navn på fartøy, rederier eller selskaper.

## 7. Status

- 28.10.2026: planen skrevet. Venter på valgene og klarsignal.
- 01.11.–02.11.2026: N1 og N2 er erstattet av `docs/planer/bestand-og-flaate.md` (L2/N1: én nasjonal kystflåte etter registeret per kommune, bygd 02.11.2026). Valg 1 er dermed tatt. Valg 3 ble **B**: Jonas sa 01.11.2026 at «hele kystflåten skal ta av den verdens felles bestand av fisk» (B3, flåtetrykket).
- 05.11.2026: **Jonas' valg** for resten (spurt ett og ett): **2 A** oppdiktede navn på alle fartøy, også kystruta og ferjene. **4 A** båtene viker bare i spillerens egen visning og innen rundt 1 km fra spillerens båt, og går tilbake til den felles banen etterpå. **5**: N3, N4, N7, så N8 planlagt sammen med `docs/planer/lover-og-regler.md` (L1 vikeplikt og L3 lys og lyd, Ø11a i `docs/planer/okter-etter-backloggen.md`), så N5 og N6. Bygges som Ø15 når Jonas gir klarsignal.
- 11.11.2026: **N3 (ferjene) bygd og rullet ut til testutgaven** (steg 34, 6dd8f8b9, versjon 0f7ed2548e0e, Jonas' økt, gren `ccr-df3a37ec-wjhw30`; N4 har hel startmelding i `docs/planer/start/35.md`), med valg 35 V2 A (egen datafil, ingen kartrelease). Systemet står i 4.18 i `docs/systemer/npc-trafikk.md`. **Kildene slik de ble funnet:**
  - **Entur:** API-et (`api.entur.io`) og utviklersidene (`developer.entur.org`) er stengt fra økta, men det nasjonale GTFS-uttrekket ligger på `https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_norway-aggregated-gtfs.zip`, som er åpen. Lest derfra: rutetype 1004 og 1013 (137 + 2 linjer, 17 355 turer), stoppene, tidene og kjøredagene. Lisensen er NLOD etter planens tabell; **lisensteksten og Enturs vilkårsside lot seg ikke lese** (`data.norge.no` og `developer.entur.org` er stengt), så det må Jonas eller en workflow bekrefte før lansering.
  - **OpenStreetMap (`route=ferry`) og Overture:** ikke brukt. Geofabrik er stengt fra økta, og en tegnet ferjerute måtte uansett passes til spillets kyst. Leia er regnet i spillets egen maske og bakt mot spillets land. Dermed er ferjene ikke avledet av ODbL-data.
  - **Dekningen:** 131 av 139 linjer er med. Ute: sambandene i Ryfylke rundt Byre, Helgøy og Nord-Hidle (spillets kart har land der), Værøy–Røst, Kvamsøya–Voksa, innsjøferjene (Randsfjorden, Nisser), og fire linjer uten turer i uka. Sommerrutene 2027 er ikke i Enturs data ennå, så sommeruka mangler.
  - Det som ikke ble bygd: vec-pakkenes `ferry` (valg 35), og 3D-modellene (N7).
- 12.11.2026: **N4 (kystruta og hurtigbåtene) bygd** (steg 35, Jonas' økt, gren `ccr-013bxxie-n4kyst`; N7 har hel startmelding i `docs/planer/start/36.md`). Systemet står i 4.18b i `docs/systemer/npc-trafikk.md`. Det N4 fant og valgte:
  - **Entur** har hurtigbåtene (1014, 62 linjer), passasjerferjene (1008, 41 linjer; 15 av dem går i hurtigbåtfart og regnes som hurtigbåter) og kystruta (1002, to operatører, rundturer Bergen–Kirkenes–Bergen). Kystruta har ikke avgang hver dag i uttrekket (258 av 415 dager), så spillet tar anløpene og tidene derfra og lar ruta gå hver dag med 11 skip (Statens kystrute; avtaleteksten ikke lest fra økta).
  - **Sommeruka finnes nå** (uka fra 28.06.2027), så ferjene, hurtigbåtene og passasjerferjene går etter sommerrutene 20. juni–10. august.
  - **Senjas «MS Kystpilen»** er erstattet av det nasjonale skipet (hun er ett av de 11); ved Finnsnes anløper skipene etter rutetida (nordgående 11:00, sørgående 04:20, før om kvelden). Jonas 12.11.2026: «A: Ekte rutetid (anbefalt)».
  - **Hurtigbåtene** er typen `ferry` med `ex` (ferjekassa i 3D til N7). Leinettet ble ikke brukt for kystrutas lange legger; masken fant alle.
- 12.11.2026: **N7, første del, bygd** (steg 36, Jonas' økt, gren `ccr-013bxxig-n7skip`): modellene for bilferjene i tre størrelser, hurtigbåten, passasjerferja og kystruteskipet (`tools/ships/`, `src/data/ship-*.b64`), valgt i 3D etter feltene `type`, `ex` og `L` og skalert til fartøyets mål, LOD som fiskebåtene, lanternene etter sjøveisreglene og vinduslys om natta. Systemet står i 4.18c i `docs/systemer/npc-trafikk.md`. Pendelferjene er like i begge ender, så `ferjeAt` er ikke endret (de ligger alltid med rampa mot land). **Står igjen i steget (`pågår`):** lasteskip, tankskip og cruiseskip (trafikken er N5), fiskebåtene etter redskap i kystflåten, fritidsbåt og seilbåt (trafikken er N6).
- 13.11.2026: **N7, andre del, bygd** (steg 36, Jonas' økt, gren `ccr-013bxxid-n7rest`): lasteskip, tankskip og cruiseskip (`last.py`, `tank.py`, `cruise.py`; trafikken og linjene i malen er N5s), kystflåtens fiskebåter etter redskap (snurrevad, not, reketrål, teine, kystlinebåt; valgt i 3D etter registerets redskap og lengden, ute i spillet), fritidsbåt og seilbåt (`fritid.py`, `seil.py`; trafikken og linjene er N6s). Systemet står i 4.18c-2 i `docs/systemer/npc-trafikk.md`. Valget i økta: garn, juksa og line under 13 m beholder spillerens båter (de er garn- og linebåter); not og trål fikk egne modeller fordi registeret har 332 og 142 slike i kystflåten.
- 05.11.2026: N8 er planlagt i `docs/planer/lover-regler-sikkerhet.md` (Ø11a) og bygges i Ø11.1 (vikeplikten, AIS-status) og Ø11.2 (lanterner etter det båten gjør, lydsignaler; dagsignaler er ikke med, Jonas 05.11.2026). De nye typene i N3, N4, N5 og N7 får bare klassen etter sjøveisreglene (`colregCls`), lengden og lanternene i modellen.
