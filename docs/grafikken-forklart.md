# Slik fungerer grafikken i Det Store Blå

*Skrevet 30.10.2026 for Stig, som lager et annet spill. Det Store Blå er et fiskespill langs hele norskekysten som kjører i
nettleseren (også på Android-nettbrett). Her står hva som faktisk gir utseendet, og hva vi har lært underveis.*

---

## 0. Den korte versjonen

Hemmeligheten er ikke mange trekanter. Båtene har 7 000–40 000 trekanter hver, omtrent som en bil i et mobilspill på
middels nivå. Det som gjør at det ser bra ut, er dette:

1. **Lys som regnes per piksel**, med en felles «slutt» på alle skyggerne (luftperspektiv og myk tonekurve), så alt i bildet
   står i samme luft.
2. **Bakt skygge (ambient occlusion) i båtmodellene**, regnet i Blender med strålesporing, lagret i fargene på hvert punkt.
3. **Ekte data i stedet for oppdiktet landskap**: høydemodell, satellittfarger, trehøyder, arealdekke, bygg, kaier og
   fyrlykter for hele kysten.
4. **Et hav som er simulert, ikke malt**: 13 bølger fra et bølgespekter, skum som blir liggende, båtens egne bølger.
5. **Kvalitetsnivåer og reserver**, så det samme spillet ser best mulig ut på et toppnettbrett og fortsatt kjører på en billig
   telefon.
6. **Måling før optimalisering**: vi har en målebenk og en profil i selve spillet, så vi vet hva som koster.

Alt er skrevet direkte mot WebGL, uten Three.js, Babylon eller Unity. Det er mer arbeid, men vi bestemmer selv over hver
piksel og hvert tegnekall.

---

## 1. Grunnmuren: ren WebGL

- **Ingen motor.** Én tegneløkke (`requestAnimationFrame`) som oppdaterer verden og tegner hele bildet. Skyggerne er skrevet
  som tekst i JavaScript.
- **WebGL 2 med WebGL 1 som reserve.** Skyggerne er skrevet i GLSL ES 1.00 og oversettes ord for ord til 3.00 når konteksten
  er WebGL 2 (`attribute` → `in`, `varying` → `in`/`out`, `texture2D` → `texture`, en egen utfarge i stedet for
  `gl_FragColor`). Da trenger vi bare én kildekode, og bildet blir identisk på begge.
  *Felle:* GLSL 1.00 i en WebGL 2-kontekst mangler `fwidth`/`dFdx`. Du må enten skrive 3.00 eller oversette.
- **To pass per bilde:** først et fjernpass (land, sjø og båter ut til 170 km), så tømmes dybdebufferen og nærpasset tegnes
  (alt innen noen kilometer, med et nærplan på 25 cm). Med ett pass ville dybdebufferen ikke klare å skille sjø fra strand
  noen kilometer unna når kameraet også skal kunne stå 25 cm fra rattet.
- **Tegn relativt til kameraet.** Verden er rundt en million meter bred. I `Float32` er en posisjon der bare nøyaktig til
  6–12 cm, og da hopper ting. Alt legges derfor relativt til øyet før det sendes til GPU-en, og øyets posisjon regnes i full
  presisjon (JavaScript-`number`). Dette rettet en risting i bro-visningen som vi brukte lang tid på å finne.

## 2. Lyset

- **Per piksel:** sol, himmellys, opptil 8 punktlys (fyrlykter, lamper på kaia, lanterner), glans og fresnel (mer refleksjon
  på skrå). Glansen ligger i alfakanalen til hvert punkt i modellen, så lakk, stål og gummi blinker ulikt.
- **Én felles slutt på alle skyggerne (`fin()`):** terreng, bygg, hav, båter og teksturer går gjennom samme bit kode til slutt:
  - **Luftperspektiv:** tapet over avstand er ulikt per fargekanal (blått taper mer enn rødt, som Rayleigh-spredning), så
    fjerne fjell blir blålige og flate før de går i ett med himmelen.
  - **Mot sola** lyses disen opp med samme glans som himmelen har rundt sola (Mie-spredning), så land og himmel møtes i samme
    farge i horisonten.
  - **Skulder i stedet for klipping:** verdier under 0,8 er uendret, og over det bøyer de mykt mot hvitt. Snø, skum og
    solbelyste skrog beholder detaljene. Vi prøvde ACES, men den gjorde nettene mørkere enn de var stilt inn etter.
  - **Skodde på fjellet:** over skybasen går alt inn i skyens grå med samme ujevne kant.
  Når alt i bildet ender i samme luft, ser det «ekte» ut selv med enkle modeller. Det er trolig det viktigste enkeltgrepet.
- **Himmelen** er en egen skygger: solskive og glans, jordskyggen og det rosa Venus-beltet ved soloppgang, skyer fra støy som
  driver med vinden (i ekte tid etter værdataene), stjerner og nordlys i buer og folder.
- **Vær gjør overflatene våte:** etter regn blir berg og kaier mørkere og får glans, snø legger seg på det som er bygd, og det
  renner dråper på styrhusvinduene.

## 3. Båtene (og andre modeller)

- **Laget i Blender med Python-skript** (`bpy`), ikke modellert for hånd. Hver båt er et skript som bygger skroget fra
  verftenes tegninger og mål (spant, vannlinjer, stevn), og legger på styrhus, master, kraner og beslag fra et felles bibliotek.
  Da kan vi bygge på nytt når noe endres, og alle båtene får samme kvalitet på beslagene.
- **Bakt skygge:** Blender regner ambient occlusion med strålesporing (Cycles, 48 prøver) og legger den inn i fargen på hvert
  punkt. Det koster ingenting i spillet og gir dybde i hjørner, under rekka og rundt styrhuset. Dette er grunnen til at
  modellene ser «tunge» og ekte ut uten teksturer.
- **Lakksoner:** hvert punkt vet om det er skrog, stripe, overbygg eller dekk, så spilleren kan male båten i spillet uten at
  den bakte skyggen forsvinner (fargen ganges med skyggen).
- **Kompakt fil:** GLB med `KHR_mesh_quantization`: posisjoner som 16-bits heltall, normaler og farger som bytes. En båt er
  0,7–1,7 MB, og filene hentes separat og lagres på enheten etter første gang.
- **Detaljnivåer:** en nærmodell for din egen båt, en middels og en enkel fjernmodell (rundt en tidel av trekantene) for båter
  fra noen hundre meter. Hvilken som tegnes, avgjøres av hvor mange piksler båten fyller på skjermen, ikke av avstanden alene,
  så zoom og oppløsning er med. Lenger ute er båtene enkle kasser.
- **Det vi ikke modellerer:** innredning og rom under dekk (spillerne ser dem aldri), og utstyr spilleren kan kjøpe. Utstyret
  er egne modeller som settes på faste «ankerpunkter» i båten.

**Målt på et OnePlus Pad 3:** bildetida var den samme, 20 ms, med 8 000 og med 224 000 båttrekanter på skjermen. Trekantene
koster nesten ingenting på et moderne nettbrett. Det som koster, er piksler (oppløsning × hvor tung skyggeren er per
piksel). Taket for egen båt er derfor nå hevet til rundt 300 000 trekanter.

**Nivået framover: pilotbåten.** Den første båten som er laget på det nye nivået, er en ringnotbåt på 38,55 m, bygd etter
fotografier av en ekte båt og gått gjennom over 20 runder med kritikk mot bildene (kraner, kraftblokk, ankerlommer,
redningsflåter, anoder langs bunnen, merker på baugen). Den ble lagt inn i spillet 30.10.2026, og alle båtene skal opp på
samme nivå:

| Del | Trekanter | Brukes til |
|---|---|---|
| Nær | 119 302 | din egen båt på nært hold |
| Middels | 40 000 | din egen båt lenger unna, og andres båter nær deg |
| Fjern | 12 066 | båter langt unna |
| Glass | 286 | vinduene |

Fila er 6,1 MB. Til sammenligning har de eldre båtene 7 000–40 000 trekanter, så nærmodellen er 3–17 ganger så detaljert,
og den bruker omtrent 40 % av taket. Middels-utgaven lages automatisk av eksporten: Blender forenkler den ferdig bakte
nærmodellen (Decimate) ned til 40 000 trekanter, og lakksonene og den bakte skyggen blir med.

## 4. Landskapet: ekte data for hele kysten

Det meste av «realismen» kommer fra åpne data. Alt er bearbeidet på forhånd av Python-skript i GitHub Actions, delt i
fliser og lagt i små pakker som spillet henter rundt båten mens den seiler.

| Hva | Kilde | Brukes til |
|---|---|---|
| Høyder på land | Kartverket (via Terrarium), 25 m nær og 200 m langt unna | terrenget |
| Havdybde | Kartverkets dybdemodell (50 m) nær land, GEBCO lenger ute | brenninger, grunner, bunnen |
| Bakkens farge | Sentinel-2 (Copernicus), sommermosaikk 2021–2025 med solskyggen tatt ut | fargen på bakken |
| Arealdekke | ESA WorldCover | myr, lyng, jorder, bart fjell, ur, bre |
| Trær | Meta/WRI trehøydekart (1 m), andel og høyde per 50 m | skogen, tre for tre |
| Bygg, veier, kaier, brygger, innsjøer | OpenStreetMap/Overture | byene, havnene, vannet |
| Fyr og sjømerker | OpenStreetMap (sjømerkene med lyskarakter) | lys om natta med riktig karakter og sektor |
| Vindturbiner og kraftspenn | OpenStreetMap | det som synes fra sjøen |

Husk lisensene: Copernicus og Kartverket krever at kilden står oppgitt, Meta/WRI er CC BY 4.0, OpenStreetMap er ODbL.

Tips fra arbeidet:
- **Lagre høyder som `Int16` i desimeter** (halve plassen av `Float32`).
- **Fjern skyggene i satellittbildene** før de brukes som farge, ellers får du dobbel skygge (satellittens og din egen).
- **Ingen tabeller med tall som fasit:** materialene på bakken (berg, skog, snø, havnefylling) er vekter per punkt som
  blandes per piksel i skyggeren, så kantene blir skarpe der de skal.
- **Instanser for trær og småting:** én modell av gran, furu og bjørk, tegnet tusenvis av ganger med ett tegnekall
  (`drawArraysInstanced`), med litt ulik høyde, vridning og farge.
- **Støy med flyttall:** GPU-ens hash-funksjoner mister nøyaktighet når koordinatene blir store. Fold verdenskoordinatene
  (`mod(x, 4096)`) før støyen, ellers får du flate felt og skarpe kanter (vi så det i skyene på nettbrettet).

## 5. Havet

Havet er det som får mest skryt, og det er en simulering, ikke en tekstur:

- **13 Gerstner-bølger** (10 vindsjø fra et bølgespekter som følger vindens styrke og strøklengde, 3 dønninger), med bratthet
  som gir spisse topper og runde daler. Fjernpasset bruker bare de fire lengste.
- **Sjøtilstanden varierer med stedet:** en tekstur over området sier hvor mye sjø det er per retning, så det er lunt bak en
  holme og grovt ute på havet.
- **Krusninger og vindkast** som mørke flekker som driver over vannet («kattepoter»).
- **Skumtopper** etter en ekte formel for hvor stor del av havet som er hvitt ved en gitt vind (Monahan), skumstriper fra
  liten kuling, sjørokk i storm.
- **Skummet blir liggende:** et skumkart (en tekstur som tegnes hvert bilde) holder på kjølvannets skum så det driver og
  løser seg opp i stedet for å følge båten.
- **Båtens egne bølger:** Kelvin-mønsteret med de riktige vinklene, baugbølge, hekkbølge, propellbobler og sprut. Bølgelengden
  er den fysiske (2πv²/g).
- **Brenninger mot land** fra dybden.
- **CPU-speil:** samme bølger regnes også i JavaScript (`seaH`), så båten, kameraet og fuglene ligger nøyaktig på vannet som
  tegnes.

## 6. Ytelse og kvalitetsnivåer

- **Fem valg:** Auto, Lav, Middels, Høy og Ultra. Hvert nivå setter oppløsning (pikseltetthet 1 til full skjerm),
  terrengets rekkevidde og tetthet, havets cellestørrelse, hvor langt trærne og småtingene går, hvor mange punktlys, og hvor
  detaljert bakken er.
- **Auto måler bildetida** og går ned et nivå etter 4 s under 28 bilder/s, opp igjen etter 8 s over 40. Ultra prøves bare på
  en enhet som har god margin, og enheten husker utfallet, så den ikke går opp og ned.
- **Reserver for svake GPU-er:** havet er det tyngste programmet, og noen drivere nekter å kompilere det uten å si hvorfor.
  Spillet prøver da lettere utgaver, helt ned til en flat sjø, husker hva som virket på enheten, og sender beskjed til skyen
  så vi vet hvilke enheter det gjelder. En enhet som mister grafikkonteksten, lagrer spillet og laster siden på nytt.
- **Alt nytt kan slås av per nivå.** Det er regelen: en billig telefon skal aldri betale for det et toppnettbrett tåler.
- **Målebenk og profil i spillet:** `#bench` i adressen tegner båten mange ganger og måler bildetida. `#prof` deler bildet i ni
  deler og måler tida på hovedtråden og på GPU-en (`EXT_disjoint_timer_query`). Etterpå måles bildet med én del tatt ut om
  gangen og i flere oppløsninger. Da ser du om det er pikslene, geometrien, JavaScript eller nettleserens takt som holder deg
  igjen, før du begynner å optimalisere.

## 7. Testing av grafikken

- **Playwright med SwiftShader** (programvare-GPU i Chromium) tegner spillet i skyen, tar skjermbilder og sjekker at det ikke
  er GL-feil, at alle skyggerne kompilerer (på både WebGL 1 og 2), og at modellene holder seg under taket for trekanter.
- **Sammenlign bilder.** Da vi gikk over til WebGL 2, tok vi samme scene med begge og sammenlignet pikslene. Avviket var like
  stort som mellom to kjøringer med samme versjon (det er bare animasjonen som går).
- **SwiftShader sier ingenting om ytelse.** Den er 100–1 000 ganger tregere enn et nettbrett. Ytelsen måles bare på ekte
  enheter, med `#bench` og `#prof`.

## 8. Det vi ville sagt til en som starter

1. **Lys og luft før polygoner.** En felles tonekurve og et luftperspektiv som alt går gjennom, gir mer enn dobbelt så mange
   trekanter.
2. **Bak det som ikke endrer seg.** Ambient occlusion i modellene er gratis i spillet og gir enorm dybde.
3. **Bruk ekte data.** Høydemodeller, satellittfarger og trehøyder er gratis og gjør verden troverdig på en måte som er
   vanskelig å dikte opp.
4. **Lag modellene med skript.** Det tar lenger tid første gang, men du kan bygge alt på nytt når du lærer noe nytt.
5. **Mål før du optimaliserer.** Vi trodde trekantene var flaskehalsen. Målingen viste at de ikke var det.
6. **Ha en reserve for alt.** Mobil-GPU-er er uforutsigbare; spillet må aldri bli svart.
7. **Tegn relativt til kameraet** i store verdener, ellers rister alt.
