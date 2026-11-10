# Kystvaktskipene: byggegrunnlaget (steg 100, 10.11.2026)

> Steg 100 i `docs/planer/koen.md`, valg 30 besvart av Jonas 10.11.2026: «V1 C / V2 A / V3 A». Bestillingen samme dag: «Du kan jo få lov
> til å lage en blender-modell av en kystvaktbåt også. Den trenger ikke å være like detaljert som båtene spillerne bruker.» Skriptet er
> `tools/boats/kv.py` (begge skipene fra samme tabeller), modellene `src/data/boat-kv47.b64` og `boat-kv90.b64`, i spillet
> `core/09j-kystvakt.js` (`KVS`, `kvPose`, `kvOff`, `kvRib`, `kvNpcs`) og `view3d/20-trawl-seine.js` (`npcType`, `kvDraw`, `kvRibDraw`).
> Malen er `sulebas-pilot-grunnlag.md`. Kildekoder: **S** sett i bilde, **T** tolket, **A** antatt, **R** fra en skriftlig kilde.
>
> **Ingen bilder fra Jonas.** Alt utenom hovedmålene er antatt etter typen (kap. 8 sier hvilke bilder som ville gjort det bedre).

## 1. Fakta om skipene

Forbildene er to av Kystvaktens fartøyklasser. Klassenavnene står bare her og i kommentarene i skriptet, aldri i spillet (CLAUDE.md:
ingen ekte skipsnavn; Kystvakta er et offentlig organ og kan nevnes, men skipene i spillet står for hvilket skip som helst).

### 1.1 Det lille: 47 m, indre kystvakt (`kv47`)

Forbilde: ST-610-typen fra Skipsteknisk AS, fem skip bygd i Polen 2006–2007 for den indre kystvakten.

| Hva | Verdi | Kilde |
|---|---|---|
| **Lengde over alt** | **47,20 m** | R: Skipsteknisk, «ST-610 KV Nornen» (skipsteknisk.no, prosjektsiden: «length over all 47.20 m, moulded breadth 10.30 m») |
| **Bredde** | **10,30 m** | R: samme |
| **Dypgang** | **3,25 m** | R: Wikipedia, «Nornen-class patrol vessel» (Draught 3.25 m) |
| **Deplasement** | **om lag 760 t** | R: Kystvakten, presentasjon på Fritidsbåtkonferansen 2018 (sdir.no: «ca. 760 t», 47 m, 14 knop); Wikipedia sier 743 t, en annen liste 675 t |
| Fart | 14–16 kn | R: samme presentasjon (14), andre kilder 16 |
| Mannskap | 13–20 | R: norske kilder 13, Wikipedia 20 (innredning for 20 og sykelugar, Skipsteknisk) |
| Lettbåter | «hurtiggående lettbåter om bord» | R: svar på skriftlig spørsmål på Stortinget 2011 (antall og størrelse ikke oppgitt) |
| Overbygget, dekket, slepet | ikke lest | A: overbygget forut på en hevet bakk, slepe- og arbeidsdekk akter (typen; «bedre slepekapasitet», Stortinget 2011) |

### 1.2 Det store: 93 m, ytre kystvakt (`kv90`)

Forbilde: VS 794 CGV-typen fra Vik-Sandvik, tre skip bygd ved Myklebust verft 2009–2010 for den ytre kystvakten.

| Hva | Verdi | Kilde |
|---|---|---|
| **Lengde over alt** | **93 m** | R: Wikipedia «Barentshav-class offshore patrol vessel» (92–93 m), tu.no (93,2 m), Maritime Optima (93 m) |
| **Bredde** | **16,6 m** | R: tu.no og Wikipedia (16,6); Barents Observer 16 m, Maritime Optima 17 m |
| **Dypgang** | **6,0 m** (største) | R: Wikipedia (6,1 m), artikkelen om skipet (5,8 m). Modellen: skrogets egen 4,9 m (A), skegen ned til 6,0 m |
| **Deplasement** | **om lag 3 250 t** | R: engelske kilder (3 200 long tons, 3 251 t). Norske kilder sier 4 000 tonn, som tu.no omtaler som bruttotonnasje |
| Pæletrekk | 110 t | R: Wikipedia og flere (slepevinsj 250 t bruddlast, dekkskran 8 t) |
| Mannskap | 16 (standard), inntil 40 | R: Wärtsilä (16), andre kilder 40 |
| Helikopterdekk | **valgt** (valg 30) | A: forbildet er ikke lest med helikopterdekk; 105 m-klassen (Nordkapp-klassen: 105 m, 14,6 m, 4,9 m, 3 200 t, hangar for ett helikopter, R: helis.com og globalmilitary.net) har det. Valget sier «helikopterdekk akter på det store» |

**Kildene ble lest gjennom søk 10.11.2026.** Sidene selv (Wikipedia, snl.no, navypedia) kunne ikke hentes fra skyøkta (nettet er stengt
for dem); tallene over er de søket gjengir fra dem, med lenkene i svaret til Jonas. Der kildene er uenige, står begge.

## 2. Reglene som gjelder modellene

- **Ingen ekte navn** (CLAUDE.md 07.10.2026): ingen skipsnavn, kjenningsnummer (W 330 osv.) eller kallesignal. «KYSTVAKT» på siden er
  organet, ikke et skip (V3 A). GLB-ens `name` er «Kystvaktskip 47 m» og «Kystvaktskip 93 m».
- **Bare utsiden** (06.10.2026); bak broens vinduer et mørkt rom og konsollen, så glasset leser som glass.
- **Kan ikke kjøpes.** Skipene er ingen type i `VESSELS`: Båthandelen, flåten, verftet og `vesseltest` ser dem aldri. 3D-visningen leser
  modellen rett fra GLB-en (`glbModel`) når NPC-en er Kystvakta (`n.kv`, `n.vtype`); ingen kode velger etter båttypens navn.
- **Lanternene etter sjøveisreglene** (kap. 6), regnet i `check()`.

## 3. Avgjørelser

| # | Spørsmål | Valg | Hvorfor |
|---|---|---|---|
| V1 | Hvilket skip | **C** (Jonas): to skrog fra samme skript, 47 m langs kysten og ved kai, 93 m til havs | Havkontrollen på bankene og ved Svalbard er ytre kystvakt i virkeligheten |
| V2 | Lettbåten | **A** (Jonas): en RIB på 8,5 m som går til fartøyet, ligger langs dets babord side og heises inn | «Setter over inspektører i lettbåten» skal synes |
| V3 | Merkingen | **A** (Jonas): grått skrog, de skrå stripene i rødt, hvitt og blått forut, «KYSTVAKT» på siden | Uten skipsnavn og kjenningsnummer |
| K1 | Detaljnivå | Middels: nær 20–40 tusen trekanter, fjern under 4 000 | Startmeldingen; NPC-taket er 40 000 |
| K2 | Hvor skipet ligger ved kai | **Om babord, på fendere** (1,5 m klart) | Kaia er om styrbord for spillerens båt (`berthPose`); før lå Kystvakta 28 m om styrbord for havnas punkt, altså inne på kaia eller på land |
| K3 | Langs kysten (båten på feltet) | Om styrbord, 6 m klart | Som før («langs styrbord side»), med de nye breddene |
| K4 | Til havs | Om babord, 180 m mellom sentrene (minst 30 m klart) | Som før (H2e) |
| K5 | Lettbåtens tider | Firt ned 2 min, over 6, langs fartøyet 74, tilbake 6, heist 2 (til sammen kontrollens 90) | Antatt, ingen kilde |
| K6 | Begge masthodelys på det store | Det forre på en formast på bakken (9 m fra stevnen), det aktre på masta over skorsteinen, 4,6 m høyere og 47,8 m akter | Vedlegg I 2(a)(ii) og 3(a) krever 4,5 m og halve lengden. Helikopterdekket akter gjør at det aktre ikke kan stå lenger bak |

## 4. Skipene sone for sone

Rammen: x forover fra akterspeilet, y til babord, z opp fra basislinja (underkanten av skrogets flate kjøl). Alle mål er i skriptets
tabeller (`SHIPS`, `arrangement()`) med kilden i kommentaren. Bare lengde, bredde, dypgang og deplasement har skriftlig kilde (R);
resten er antatt etter typen (A) og kan rettes med bilder.

### 4.1 Skroget (begge)

- **Én glatt flate** (`hb(x, z)`, som pilotens): under vannlinja en superellipse fra kjølen til vannlinjas halvbredde med fyldigheten
  `NX`, over den utfallet til dekkets halvbredde; forut for `X_ENT` trekkes snittet inn mot stevnen med en fyldighet per høyde (`KB`):
  fin forfot, fulle vannlinjer under utfallet. Skrå stevn, tverrhekk med speilet litt neddykket, ingen bulb (ikke lest for noen av dem).
- **Volumet mot deplasementet** (`check()`, Simpson over snittene): 47 m: 761 t mot 760 (Cb 0,49, Cm 0,81, Cp 0,61); 93 m: 3 393 t mot
  3 250 (+4 %, Cb 0,46, Cm 0,78, Cp 0,59). Første utkast ga 1 097 t og 5 431 t (Cb 0,71 og 0,69, kassesnitt); fyldigheten, inngangen og
  løpet akter er stilt mot vekta, og vannlinja er smalere enn dekket (9,9 og 15,8 m mot 10,3 og 16,6), med utfall over.
- **Dypgangen til det store:** med skrogets egen dypgang 6,0 m måtte Cb vært 0,35 (en jager), så skroget har 4,9 m (A) og skegen går ned
  til 6,0 m (største dypgang, R).
- **Fargene:** grått skrog (zone 1), lysere grått overbygg (zone 3), mørkt grått dekk og grågrønt helikopterdekk (zone 4), rødbrunt
  bunnstoff til 0,25 m over vannlinja (A: ingen fargekode er lest). Spillet maler ikke Kystvakta om.
- **Stripene** (V3 A): et bredt rødt bånd, et smalt hvitt og et blått, skrå med toppen forover (som stevnen), fra like over vannlinja til
  under ripa, rødt forrest (A: mønsteret er Kystvaktens «racing stripe», bredden og vinkelen er ikke målt). Lagt på skroget i små flater
  (`hull_quad`) så de følger krumningen.
- **«KYSTVAKT»** i mørke blokkbokstaver av streker (`GLYPHS`, `lettering`) akter for stripene, lesbar fra sjøen på begge sider (A: farge
  og skrift ikke målt).
- **Fenderlist** (A): en kraftig svart gummilist langs begge sider i hoveddekkets høyde og over hekken (et skip som går langs siden av
  båter).

### 4.2 Det lille (47 m)

- **Dekkene:** hoveddekket akter (5,0–5,15 m) med skansekledning 1,0 m; bakken fra 24,6 m (7,6–8,55 m, spring forover) med
  skansekledning; trinnet i ripa over 1,2 m.
- **Overbygget:** 01-huset på hoveddekket (19,4–24,6 m, ±3,95), 02-dekket på bakken (21,0–34,0 m, ±3,65) med vinduer, broa (28,2–34,6
  m, ±3,45, glass rundt som heller ut øverst, takoverheng, mørkt rom og konsoll inni) med brovinger ut til skutesiden. Masta på
  brotaket (31,0 m) med radarplattform, rå, radar, radom, pisker og lyskastere; skorsteinen akter for broa.
- **Slepe- og arbeidsdekket akter:** slepevinsj (trommel 1,44 m), slepepinner og hekkrull, H-pullert, en knekkbomkran om babord foldet
  akterover, RIB-en på 7,4 m i vugge om styrbord med davit.
- **Undervann:** skeg med aksel, firebladet propell (Ø 1,9 m), ror.

### 4.3 Det store (93 m)

- **Ett gjennomgående øvre dekk** (10,8–12,5 m, spring forover), med skansekledning bare på bakken forut for 70 m og rekker langs
  dekkskanten ellers.
- **Helikopterdekket** (0,8–22 m, hele bredden): mørkt grågrønt med hvit kantlinje, gul landingsring (Ø 9,2 m) og hvit H, sikkerhetsnett
  1,5 m utenfor kanten (A: etter CAP 437s mønster; dekket er 21 m langt for et helikopter med D om lag 19,6 m).
- **Hangaren** forut for dekket (22–31 m, ±5,7, 5,6 m høy) med porten mot dekket.
- **Overbygget:** 01 fra 31 til 72,4 m (±7,0) med båtnisjer i sidene (39,2–48,2 m, inn til ±4,3), 02 fra 49 til 71,6 m, broa (59,5–72,5
  m, ±6,0) med brovinger, radarmast på brotaket, skorstein (33–39,5 m) med masta for det aktre masthodelyset, formasten på bakken.
- **Lettbåtene:** én RIB på 8,5 m i hver nisje med davit; den om styrbord er egen del (`rib`) som spillet flytter.
- **Undervann:** skeg ned til 6,0 m, to propeller (Ø 3,5 m) på aksler med braketter, to ror.
- **Vinduer i skutesiden:** en rad kvadratiske vinduer under dekket (A).

### 4.4 Lettbåten (begge)

RIB på 8,5 m (7,4 m på det lille) × 3,0 m: dyp V, mørkegrå tuber rundt, konsoll med vindskjerm, to jockeyseter, bøyle med lys, to
påhengsmotorer (A: Kystvaktens lettbåter er ikke lest; størrelsen er innenfor startmeldingens 7–9 m). I GLB-en er den om styrbord på det
store en egen del i sin egen ramme (midt på lengden i vannlinja), med `anchors.rib` = `{at, L, B, cox}`.

## 5. Kravlista mot planlisten

Planlisten er for fiskefartøy; punktene for redskap og fangst (FSK, KRN for fangst, RNG–SJK) gjelder ikke. Middels detalj (K1): P1 skal
være med, P2 der det synes på avstand. ✓ med, ½ forenklet, ✗ mangler, – ikke relevant.

| ID | Skal ha | 47 | 93 |
|---|---|---|---|
| SKR-01 | Hovedmål og proporsjoner | ✓ | ✓ |
| SKR-02 | Spring, bakk | ✓ | ✓ |
| SKR-03 | Stevn og utfall | ✓ | ✓ |
| SKR-04 | Bulb | – (ikke lest) | ✗ (ikke lest; trolig ja) |
| SKR-05 | Hekk | ✓ (tverrhekk) | ✓ |
| SKR-06 | Spantform | ✓ | ✓ |
| SKR-07 | Slingrekjøl | ✗ | ✗ |
| SKR-08 | Skeg og propellåpning | ✓ | ✓ |
| SKR-09 | Plater og sveis | ✗ | ✗ |
| SKR-10 | Skansekledning | ✓ | ✓ (bakken) |
| SKR-11 | Lenseporter | ✗ | ✗ |
| SKR-14 | Thrustere | ✗ | ✗ |
| SKR-16 | Slitelister | ✓ (fenderlist) | ✓ |
| SKR-20 | Åpninger i siden | – | ½ (vinduer som flater, ikke hull) |
| DKS-01 | Dekksinndeling | ✓ | ✓ |
| DKS-07 | Dører | ½ | ½ |
| DKS-08 | Trapper og leidere | ✗ | ✗ |
| OVB-01 | Overbyggets plass | ✓ (A) | ✓ (A) |
| OVB-03 | Brovinduer | ✓ | ✓ |
| OVB-05 | Takoverheng | ✓ | ✓ |
| OVB-06 | Brovinger | ✓ | ✓ |
| OVB-08 | Vinduer | ✓ | ✓ |
| OVB-09 | Skorstein | ✓ | ✓ |
| OVB-11 | Brotaket | ✓ | ✓ |
| OVB-12 | Konsoll bak glasset | ½ | ½ |
| MST-01–05 | Mast, radarer, radom, pisker | ✓ | ✓ |
| MST-02 | Formast | – | ✓ |
| FOR-01–02 | Ankerspill og ankerlomme | ✓ | ✓ |
| FOR-04 | Pullerter | ✓ | ✓ |
| FRM-01, 03 | Propell og ror | ✓ | ✓ |
| FRM-07 | Bunnstoff | ✓ | ✓ |
| LYS-01–03 | Lanternene | ✓ | ✓ |
| LYS-08 | Lyskastere | ✓ | ✓ |
| SIK-01 | Redningsflåter | ✗ | ✗ |
| SIK-02 | MOB-båt/RIB med davit | ✓ | ✓ |
| SIK-05 | Rekkverk | ✓ | ✓ |
| KRN-01–02 | Kran | ✓ (knekkbom) | ✗ |
| IDN | Merking | ✓ (stripene, KYSTVAKT) | ✓ |
| MAT-01–02 | Farger og grenser | ✓ | ✓ |
| Helidekk | Markering, nett | – | ✓ |

## 6. Lanternene etter sjøveisreglene

FOR-1975-12-01-5 vedlegg I, slik pilotens grunnlag (kap. 6) leste dem på Lovdata 30.10.2026; regnet i `check()`. «Over skroget» er det
øverste gjennomgående dekket: hoveddekket på det lille (5,0 m), det øvre dekket på det store (10,8 m).

- **47 m (under 50 m):** én topplanterne (regel 23 a ii) på mastetoppen, 12,1 m over skroget (2(a)(i): minst bredden, 10,3 m).
  Sidelanternene i kasser på brovingenes ytterkant, 6,4 m over skroget (2(g): høyst 3/4 av topplanterna) og 0,4 m akter for masta (3(b):
  ikke forut for topplanterna). Akterlanterna på en stake over hekken.
- **93 m (50 m og over):** to topplanterner (regel 23 a ii). Den forre på formasten, 12,2 m over skroget (2(a)(i): 12 m når bredden er
  over 12) og 9 m fra stevnen (3(a): høyst en firedel av lengden); den aktre på masta over skorsteinen, 4,6 m høyere (2(a)(ii): minst 4,5)
  og 47,8 m akter (3(a): minst halve lengden, 46,5). Sidelanternene på brovingene, 7,0 m over skroget. Akterlanterna under
  helikopterdekkets akterkant.
- **Det blå rundtlyset** under kontroll (kap. II 53 d) legger spillet over den høyeste lanterna (`22-docks-air.js` `lampsMore`), som før.
- Arbeidslys: lyskasterne på brotaket og hangaren (`work`).

## 7. Kritikksløyfen

Verktøyene i `tools/boats/qa/` (`shots.py` med `KV_SHIP=47` eller `90`; skriptets egne nærbilder `CLOSE`: forfra og akterfra i
skipets skala, broa, båtnisjen, K6 fra babord, K7 i skipets skala). Uten bilder er sammenligningen mot tabellene og typen, ikke mot foto.
`check()` (begge skipene, 24 sjekker): lengde over alt, største bredde, volumet mot deplasementet med Cb, Cm og Cp, sidene, alle
lanternereglene i kap. 6, lettbåten innenfor skutesiden og vugga lang nok.

Runde 0 (`check()` før noen rendring): volumet ga 1 097 t og 5 431 t (Cb 0,71 og 0,69): kassesnitt midtskips, kort inngang, fullt løp.
Fyldigheten (`NX` 4,6 → 2,5 og 2,25), inngangen (`X_ENT` 30 → 22 og 55 → 42), bovens fyldighet lavt (`KB`), løpet akter og en smalere
vannlinje under utfallet ga 761 t og 3 393 t (93 m-skipet med skrogets dypgang 4,9 m, se 4.1). Trekantene: 46 tusen nær på 93 m-skipet
(stasjonene sto like tett som på 47 m); stasjonsavstanden skalert med lengden og propellene bare i nærversjonen: 31 tusen nær, 2,3 fjern.

Runde 1 (47 m: K1, K2, K3p, K7): stripene fikk sagtenner og «KYSTVAKT» halve bokstaver: de flate flatene sank inn i baugen mellom
hjørnene. Rettet med `hull_quad` (merket i biter på 0,15–0,3 m, hvert hjørne på skroget). Ankerlomma sto høyt og langt akter (som et
vindu): flyttet ned mot stevnen (44,3 m × 5,5 m).

Runde 2 (47 m: K1, K7; 93 m: K1, K2, K3p): stripene og bokstavene rene. 93 m-skipet så ut til å flyte 3 m for høyt: kontrollbildenes vann
var 160 × 160 m rundt origo og nådde ikke baugen (`qa/shots.py` legger nå vannet 2,5 båtlengder rundt midten). Skegen var en kloss med
loddrett akterkant 3,4 m høy: raket opp i løpet og faired inn i kjølen forut. Skutesiden var én stor tom plate: en rad vinduer under
dekket. Lagt til på begge: fenderlista (et skip som går langs siden av båter).

Runde 3 (93 m: K1, K2, K7, akterfra, båtnisjen, broa; 47 m: K2, akterfra, båtnisjen, broa, K6 fra babord): vannlinja dekker skroget,
hekken med nettene, hangarporten, propellene og rorene leser riktig; lettbåten i vugga med daviten. Funnet: kjettinghjulene på ankerspillet
var 0,84 m «dekk» med tolv kanter (rettet: 0,6 m på det lille med bremsebånd og trommel, 18 kanter); K7 sto for nær for 93 m (egen K7 i
skipets skala); om natta lyser Blenders akterlanterne også forover (den har ingen skjerm i rendringen; spillet tegner sektorene, `lampArc`).

Runde 4 (i spillet, `tests/kvshot.py`, SwiftShader): modellene er i siden, ikke i `VESSELS`, med lanternene og lettbåten som egen del;
ved kai i Finnsnes ligger 47 m-skipet om babord for havsjarken med 1,5 m mellom skrogene og kaia om styrbord; til havs vest for Senja ligger
93 m-skipet 180 m av babord for snøkrabbefartøyet (166 m klart), lettbåten langs fartøyets babord side etter 30 minutter og på vei over
etter 5. Sidefeil: ingen. Funnet: kameraets vinkel går motsatt vei av det malen (`hu11shot.py`) sier, så bildet av lettbåten så fartøyets
styrbord side, og bildet nær ved kai sto inne i kaibygget (rettet i testen). `kystvakttest` med hele kysten: 21 OK, også havkontrollen.

Gjennomgangen (`/code-review` medium på koden): ti funn. Rettet: folkene på skipet ble skalert med kitets skala når modellen mangler;
ingen landsjekk til havs (nå som ved kai, ti meter om gangen og så den andre siden); skipet fulgte fartøyet inn i havna under
havkontrollen (blir nå liggende); en kartblokk som ikke var inne, ga den blokkerte plassen; plassen ble regnet hvert spillminutt (nå når
havna, kaiplassen, typen eller posisjonen endres); nærversjonen helt ut til 900 m (nå 500); lettbåtens buffere per type; ingen 3D-test i
`COVER` (nå `anchorlight3d`). Ikke rettet: naust og rorbu som ikke er lastet, gir hovedkaia, som båten selv (`berthNow`); lettbåten følger
3D-båten mens skipet følger spillets minutt (backloggen).

## 8. Det som mangler

1. **Bilder:** sidebilde rett fra siden av begge klassene (målene på overbygget, masta, stripene og bokstavene), gjerne rett forfra og
   ovenfra. Med dem kunne overbyggets plass og høyder, stripenes vinkel og bredde og bokstavenes størrelse vært målt.
2. **Generalarrangementet** for typene (overbygg, dekk, helikopterdekkets plass på 93 m-skipet).
3. Fargekoden for Kystvaktens grå.

## 9. Selvvurdering

Målt mot bestillingen (middels detalj, «trenger ikke å være like detaljert som båtene spillerne bruker») og planlisten for det som
gjelder et skip som ikke fisker. Uten et eneste bilde kan ingen del få full uttelling for likhet med forbildet.

| Del | Vekt | Poeng | Hvorfor |
|---|---|---|---|
| Mål og skrogform mot kildene | 20 | 16 | Lengde, bredde og deplasement treffer (761 mot 760 t, 3 393 mot 3 250 t), dypgangen forklart; men skrogformen er antatt, og 93 m-skipet har trolig bulb |
| Overbygg, master, bro, helikopterdekk, slepedekk, daviter | 20 | 14 | Alt bestillingen nevner er med og leser riktig i K1–K7 og i spillet; men plassen og høydene er antatt etter typen, husene er rette kasser, vinduene i de lavere dekkene flate plater |
| Lettbåten (V2) | 10 | 8 | Egen del, fem faser over 90 minutter, fører og inspektører; selve RIB-en er enkel (fasetterte tuber, kassemotorer) |
| Merkingen (V3) | 10 | 8 | Stripene og «KYSTVAKT» rene på begge sider, lesbare fra sjøen; vinkelen, breddene, fargen og skriften er antatt |
| Lanternene | 10 | 10 | Alle reglene i vedlegg I regnet i `check()`, også to topplanterner, 4,6 m og 47,8 m, på 93 m-skipet |
| Budsjett og teknikk | 10 | 9 | 28/36 tusen nær, 2,2/2,6 tusen fjern, 0,85/1,19 MB; én retting i et felles verktøy (`shots.py`) |
| I spillet | 20 | 16 | Kan ikke kjøpes, riktig skip ved kai og til havs, aldri i båten (enhetstesten for alle typene), bildene i begge formater, ingen sidefeil; ved kai kan skipet stå over naboenes ytre del |
| **Sum** | **100** | **81** | |

**81/100.** Over grensen på 75 for det bestillingen ba om (middels detalj). Det som ville løftet den: et sidebilde av hver klasse (målene
på overbygget, masta og merkingen), bulb og en mykere overgang mellom husene på 93 m-skipet, og vinduer som ekte hull.

## Endringslogg

- 10.11.2026: første versjon (steg 100): fakta med kilder, avgjørelsene, skipene sone for sone, kravlista, lanternene.
