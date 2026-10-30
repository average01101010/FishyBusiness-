# Eksempel: Bildeanalyse av SULEBAS (SF-100-SU)

Utfylt eksempel på [planlisten for fiskefartøy](planliste-fiskefartoy.md), laget fra ett foto av
M/S **SULEBAS**, SF-100-SU, kallesignal **LECW**, hjemmehavn **Florø**, sett fra babord
baug-kvarter under fiske/pumping. Eksemplet viser hvordan et referansefoto blir til konkrete
modellkrav.

---

## 0. Om eksemplet

### 0.1 Kolonner og koder

Kolonnene følger planlisten (kap. 0), med tre tillegg for bildeanalyse:

| Kolonne | Betydning |
|---|---|
| **Sone** | Hvor i referansebildet detaljen er (se 0.4). |
| **Observert** | Det som faktisk *ses* i bildet: form, antall, farge, plassering. Dette er modellkravet. |
| **Tolkning** | Sannsynlig funksjon. Påvirker rigging og gameplay, ikke formen. |
| **Sik.** | **S** = sikker (tydelig synlig) · **T** = tolket (synlig, men funksjon eller deler av formen er antatt) · **A** = antatt/skjult (må verifiseres med andre kilder). |

ID-ene har prefikset `SUL-`. Kapitlene i eksemplet tilsvarer disse modulene i planlisten:

| Kapittel i eksemplet | Moduler i planlisten |
|---|---|
| 2 Identitet (SUL-IDN) | IDN |
| 3 Skrog (SUL-SKR) | SKR, DKS, FOR (ankerlomme, klyss) |
| 4 Farger (SUL-MAT) | MAT |
| 5 Overbygg (SUL-OVB) | OVB, SIK |
| 6 Signalmast (SUL-MST) | MST |
| 7 Formast og bakk (SUL-FOR) | MST-02, FOR, RNG-11 |
| 8 Kraner og fiskehåndtering (SUL-DEK) | KRN, FSK, RNG |
| 9 Redskap i sjøen (SUL-RED) | RNG |
| 10–14 (SUL-LYS, -SIK, -MAN, -SLT, -MIL) | LYS, SIK, MAN, SLT, MIL |

Fartøytype etter planlisten: **RNG**.

### 0.2 Retningsbegreper

- **Forut / akter** = mot baug / mot hekk. **BB** = babord (venstre sett forover), **SB** = styrbord.
- I bildet peker baugen mot høyre, og vi ser **SB side**. Venstre i bildet = akter.

### 0.3 Kort om fartøyet (fra bildet)

- **Type:** ringnotfartøy (kraftblokk, nottrakt, notgjerde, fiskepumpe med sugeslange). Brukeren
  vurderer det også slik. Offentlige oppføringer beskriver et fartøy med samme navn som flerbruksfartøy
  (not, snurrevad/fly-shooting, garn) – **ikke verifisert mot register**.
- **Situasjon i bildet:** redskap ute på SB side akter, pumpeslange rigget utenbords,
  4 mannskap i arbeid. Fartøyet ligger tilnærmet stille.
- **Registreringsmerke:** SF = Sogn og Fjordane (gammel fylkeskode), SU = Solund kommune.

### 0.4 Bildesoner (referansebildet er 1577 × 1010 px)

| Sone | Innhold | Utsnitt (x1,y1 – x2,y2) |
|---|---|---|
| **Z1** | Signalmast, radomer, antenner | 450,0 – 850,330 |
| **Z2** | Styrehus og øvre overbygg | 480,280 – 900,560 |
| **Z3** | Akterkran og kraftblokk | 260,300 – 620,640 |
| **Z4** | Akterskip og hekk | 260,560 – 620,860 |
| **Z5** | Midtskips: pumpestasjon, slange, midtkran | 560,520 – 960,860 |
| **Z6** | Formast og bakk | 900,230 – 1340,640 |
| **Z7** | Baug, bulb og skrogmerking | 880,560 – 1360,880 |
| **Z8** | Redskap og tau i sjøen | 0,640 – 460,880 |
| **Z9** | Himmel, sjø, lys (hele bildet) | – |

---

## 1. Skala og hovedmål

Bildet har ingen målestokk. Mål **må** hentes fra Fiskeridirektoratets merkeregister /
Skipsregisteret (søk på `SF-100-SU` eller `LECW`) før skroget låses.

| Mål | Verdi | Kilde / sikkerhet |
|---|---|---|
| Lengde over alt (LOA) | ☐ fyll inn | Register. Grovt anslag fra bildet: **ca. 35–45 m** (A) |
| Bredde (B) | ☐ fyll inn | Register |
| Dypgang (T) | ☐ fyll inn | Register |
| Fribord akter (vannlinje → topp hekk-skansekledning) | ca. 5 m | Bildet, målt mot mannskap (A) |
| Høyde styrehusvinduer | ca. 1,3–1,5 m | Bildet (A) |
| Rekkverkshøyde | 1,0–1,1 m | Standard / bildet (T) |
| Skalareferanse | Mannskap 1,80 m | Kap. 12 |

Anslaget bygger på ca. 33–36 px/m ved akterdekket (målt på mannskap) og en synlig
skroglengde på ca. 1070 px med moderat perspektivforkortning. Bruk det kun til blokkmodellen.

---

## 2. Identitet, tekst og dekaler (IDN)

| ID | Sone | Element | Observert | Tolkning | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-IDN-01 | Z2 | Navnebrett front | «SULEBAS» i sorte, fete versaler (grotesk), på eget hvitt rektangulært brett montert på frontskansen til dekket under styrehuset. | Navnebrett forut | S | P2 | ☐ |
| SUL-IDN-02 | Z4 | Akternavn | «SULEBAS» over «FLORØ» (mindre, ca. 70 %), sorte smale versaler, malt rett på hvit akterskansekledning SB låring. Husk «Ø». | Navn + hjemmehavn | S | P2 | ☐ |
| SUL-IDN-03 | Z7 | Registreringsmerke | «SF-100-SU», store sorte versaler på hvit baugskansekledning SB, mellom ankerlomma og overbygget. Bokstavhøyde ca. 2/3 av det hvite feltet. | Fiskerimerke, også på BB | S | P1 | ☐ |
| SUL-IDN-04 | Z2/Z3 | Kallesignal | «LECW», sort tekst på frittstående hvitt skilt (ca. 1:2,5) med sort kant, montert på SB side av styrehustaket, vinklet litt utover. | Kallesignalskilt, også på BB | S | P2 | ☐ |
| SUL-IDN-05 | Z7 | Rederilogo baug | Hvit ring med kursivt monogram (ligner «LR») høyt oppe på blå baug nær stevnen. Til venstre (akter) for ringen 5 like tykke horisontale hvite fartsstriper med trappet ende. | Rederilogo, også på BB | S | P2 | ☐ |
| SUL-IDN-06 | Z7 | Thrustermerke | Hvit sirkel med 4-bladet propellsymbol, lavt på baugen like over vannlinja. | Advarsel for tunnelthruster | S | P2 | ☐ |
| SUL-IDN-07 | Z7 | V-merker | 2 hvite nedoverpekende V-er på rad akter for thrustermerket, samme høyde. | Posisjonsmerker ved thrustersymbolet. Samme «V V ⊕» finnes på Trønderhav. | T | P3 | ☐ |
| SUL-IDN-08 | Z2/Z3 | «TRIPLEX» | Blå versaler på sideflaten av begge kranbommene. | Kranprodusent | S | P3 | ☐ |
| SUL-IDN-09 | Z1 | Radomdekaler | Venstre radom: blå rund logo med liten tekst og gul trekantet varseldekal. Høyre radom: «Intellian» i blå tekst. | Produsentmerke + strålingsvarsel | S | P3 | ☐ |
| SUL-IDN-10 | Z5 | Lite skilt | Hvitt skilt med sort tekst («Su…») på skottet under broen, delvis skjult av kranarmen. | Navne- eller dekksskilt | T | P3 | ☐ |
| SUL-IDN-11 | – | Dypgangsmerker, fribordsmerke, IMO-nr. | Ikke synlige. Reelt fartøy har dypgangsskala forut/akter/midtskips og IMO-nr. | Lovpålagt merking | A | P3 | ☐ |
| SUL-IDN-12 | – | Flagg | Ikke synlig i bildet. Norsk flagg normalt akter eller i mast. | Valgfritt for spillet | A | P3 | ☐ |

---

## 3. Skrog: form og konstruksjon (SKR)

| ID | Sone | Element | Observert | Tolkning | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-SKR-01 | Z4–Z7 | Hovedsilhuett | Høyt skrog med høy bakk forut, tydelig spring opp mot baugen, nesten horisontal dekkslinje akterover og høy, lukket hekk. | Moderne norsk ringnot-/flerbruksdesign | S | P1 | ☐ |
| SUL-SKR-02 | Z7 | Stevn | Rett, svakt foroverlent stevn som glir over i bulben. Lys stevnlinje/sveis fra bulb opp mot skansen. | Stevnplate | S | P1 | ☐ |
| SUL-SKR-03 | Z7 | Bulbbaug | Stor, avlang og spiss bulb som stikker foran stevnen i vannflaten. Toppen bryter overflaten med hvit skumkant. | Bulbbaug | S | P1 | ☐ |
| SUL-SKR-04 | Z7 | Baugflare | Spantene faller tydelig utover i baugen, og skansekledningen lener ut over vannlinja. | Flare mot sjøsprut | S | P1 | ☐ |
| SUL-SKR-05 | Z7 | Plateskjøter | Svake vertikale og horisontale skjøter i felt på ca. 2–3 m på blå baug, pluss én lang horisontal linje midt i det blå feltet fra baug og akterover. | Plateskjøter, mulig isforsterkning | S/T | P3 | ☐ |
| SUL-SKR-06 | Z7 | Vertikal linje forut | Lys vertikal linje akter for thrustermerket, fra midt i det blå feltet og ned mot vannlinja. | Sveis rundt thrustertunnel | T | P3 | ☐ |
| SUL-SKR-07 | Z6/Z7 | Skansekledning forut | Hvit, høy og glatt med avrundet toppkant (skandekk). Går over i rørrekkverk på bakken. | Bakkskanse | S | P1 | ☐ |
| SUL-SKR-08 | Z6/Z7 | Fortøyningsklyss | 3–4 ovale lukkede klyss (panama) med avrundet ramme i skansekledningen forut SB, pluss ett i stevntoppen. | Fortøyning | S | P2 | ☐ |
| SUL-SKR-09 | Z7 | Liten åpning forut | Liten rektangulær åpning nede i skansekledningen akter for SF-merket. | Lenseport/spygatt | T | P3 | ☐ |
| SUL-SKR-10 | Z7 | Ankerlomme | Innfelt nisje i overgangen hvit/blå under bakken, med utstikkende blå krage under. Grått stokkløst anker synlig i nisjen. | Ankerlomme, speiles på BB | S | P2 | ☐ |
| SUL-SKR-11 | Z4 | Hekk | Svært høy hvit akterskansekledning med stor radius i hjørnet (myk overgang fra side til akter). Mørk, slitt toppkant. | Lukket akterdekk/notbinge | S | P1 | ☐ |
| SUL-SKR-12 | Z4 | Rund åpning akter | Liten rund åpning i hvit akterskansekledning SB, akter for navnet. | Lysventil eller lenseåpning | S | P3 | ☐ |
| SUL-SKR-13 | Z4/Z5 | Åpen midtseksjon | Hvit skansekledning brytes mellom hekk- og bakkseksjonen. Her er hoveddekket åpent mot siden. | Arbeidsdekk/pumpestasjon | S | P1 | ☐ |
| SUL-SKR-14 | Z4/Z5 | Blått rørrekkverk | Rekke av blåmalte rørstøtter/U-bøyler på skrogkanten langs den åpne midtseksjonen, i samme blå som skroget. | Fallsikring | S | P2 | ☐ |
| SUL-SKR-15 | Z4/Z5 | Overbordsåpninger | Rad med 8–10 rektangulære åpninger (avrundede hjørner, ca. 0,4 × 0,25 m) i blått skrog rett over vannlinjestripa akter/midtskips. Noen har lyse rister inni. | Lenseporter/utløp fra pumpe- og RSW-system | T | P2 | ☐ |
| SUL-SKR-16 | Z5/Z7 | Runde utløp | 2–3 små runde utløp med krage, pluss én avlang åpning med rist forut for midtskips. | Sjøvannsutløp | S | P3 | ☐ |
| SUL-SKR-17 | Z4 | Utløp i vannlinjestripa | 2 rektangulære rister i den hvite stripa akter, med vann som renner ut. | Avløp fra avvanner/tanker | T | P3 | ☐ |
| SUL-SKR-18 | Z4/Z8 | Y-beslag på skrogkant | Svart gaffel-/Y-formet beslag på skrogkanten SB akter, der tau og kjetting går over. | Føring eller stopper | T | P3 | ☐ |
| SUL-SKR-19 | – | Undervannsskrog | Ikke synlig: kjøl, slingrekjøler, propell (dyse?), ror, akterthruster, sonar-/senkekjøl, anoder. | Må hentes fra andre kilder | A | P2 | ☐ |

---

## 4. Farger og materialer (MAT)

Fotoverdiene er median-samplet fra referansebildet. Bildet er **ikke fargekalibrert**, så bruk
verdiene som startpunkt og juster i en nøytral lysrigg.

| ID | Flate | Observert | Foto-hex (sol / skygge) | Foreslått base | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-MAT-01 | Skrog under hoveddekk | Dyp ultramarinblå marinemaling, halvblank | `#102672` / `#0E1760` | Nær RAL 5002 | S | P1 | ☐ |
| SUL-MAT-02 | Fargegrense hvit/blå | Skarp, rett linje omtrent i hoveddekkshøyde. Stiger bratt mot stevnen slik at hele baugtoppen rundt logoen er blå. | – | – | S | P1 | ☐ |
| SUL-MAT-03 | Vannlinjestripe | Hvit stripe (ca. 0,4–0,6 m) langs vannlinja med smal blå kant under. Forut brytes den opp i 3–4 streker med mellomrom. | – | Hvit som SUL-MAT-04 | S | P2 | ☐ |
| SUL-MAT-04 | Overbygg, skanse, kraner, master | Hvit, halvblank | `#F3F3F3` / `#B0B2BC` | RAL 9010/9016 | S | P1 | ☐ |
| SUL-MAT-05 | Blå dekorstriper | Horisontale blå bånd i overbygget: bredt under styrehustaket, smalt gjennom vindusraden på nederste nivå, blå kant/underside på mastplattformene. | Som SUL-MAT-01 | Som SUL-MAT-01 | S | P2 | ☐ |
| SUL-MAT-06 | Rekkverk | Hvite stålrør. Enkelte håndlister og hele rekkverket midtskips er blå. | – | – | S | P2 | ☐ |
| SUL-MAT-07 | Tekst og logoer | Sort og hvit, malt eller folie | `#101010`–`#202020` | – | S | P2 | ☐ |
| SUL-MAT-08 | Metall | Blankt rustfritt (trakt, rørbend, sylinderstenger), bronse/messing (svivelsokkel), galvanisert grått (rister, rammer) | – | PBR metallic | S/T | P2 | ☐ |
| SUL-MAT-09 | Gummi og plast | Svart pumpeslange (halvmatt), sorte og blå hydraulikkslanger | `#232327` | – | S | P2 | ☐ |
| SUL-MAT-10 | Tauverk | Grønt PP/PE-tau, mørk kjetting, tykk gul trosse forut | – | Tiling-tau-tekstur | S | P2 | ☐ |
| SUL-MAT-11 | Flottører og bøye | Gule flottører. Rosa/korallrød fenderbøye. | Gul `#ECD461`. Rosa `#FEC4CA` / `#E3838A` | – | S | P2 | ☐ |
| SUL-MAT-12 | Presenning | Dyp blå, rynket og surret | `#171A69` | Cloth/sim eller skulptert | S | P2 | ☐ |
| SUL-MAT-13 | Vindusglass | Mørkt tonet med sterk refleks. Konsoller og interiør delvis synlig. | – | Glass + enkelt interiør-kort | S | P2 | ☐ |
| SUL-MAT-14 | Radomer | Matt hvit glassfiber | – | – | S | P3 | ☐ |
| SUL-MAT-15 | Mannskapsklær | Refleks gulgrønn, oransje/gul, rød/oransje flytedress, hvite og gule hjelmer | Rød `#CA3B33` | – | S | P3 | ☐ |

---

## 5. Overbygg (OVB)

| ID | Sone | Element | Observert | Tolkning | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-OVB-01 | Z2 | Plassering og form | Overbygg i 3–4 nivåer omtrent midtskips, med bakk og åpent arbeidsdekk forut og akterdekk/notbinge bak. Kantete volum med avfasede hjørner. | – | S | P1 | ☐ |
| SUL-OVB-02 | Z5 | Nivå 1 | Hvit vegg med 2 kvadratiske vinduer med runde hjørner. Blå stripe går gjennom vindushøyden. 1 smalt høyt vindu ved hjørnet. | Oppholdsrom/messe | S | P2 | ☐ |
| SUL-OVB-03 | Z2 | Nivå 2 (dekket under styrehuset) | Åpen gangbane med hvitt rørrekkverk foran og langs SB. Frontskanse med navnebrett (SUL-IDN-01). Rad med mørke vinduer bak. | Lugarer/dagrom | S | P2 | ☐ |
| SUL-OVB-04 | Z2 | Styrehus | Panoramavinduer rundt front og sider, skråstilt med toppen utover (ca. 10–15°). Tykke hvite stolper, ca. 8–10 vindusfelt synlig på SB/front. Fasettert front. | Bro | S | P1 | ☐ |
| SUL-OVB-05 | Z2 | Styrehustak | Utstikkende takskjerm over vinduene med bred blå stripe langs kanten. Taket har hvitt rørrekkverk (2 vanger) rundt. | – | S | P1 | ☐ |
| SUL-OVB-06 | Z2/Z3 | Lys/kamera under LECW | Mørk rektangulær enhet på styrehussiden under kallesignalskiltet. | Arbeidslys eller CCTV | T | P3 | ☐ |
| SUL-OVB-07 | Z3 | Akterdekk bak styrehus | Rekkverk, trapper og leidere mellom nivåene. 2 hvite sylindriske beholdere med bånd i stativ. | Redningsflåter | T | P2 | ☐ |
| SUL-OVB-08 | Z5 | Rød oval | Liten rød oval lampe/skilt på skottet like under navnebrettet. | Rød lampe eller brannskilt. Ikke sidelanterne: SB-siden har grønt sidelys. | T | P3 | ☐ |
| SUL-OVB-09 | Z6 | Bakkhus | Hvitt dekkshus forut for overbygget (bærer SF-merket), med trapp/leider og rekkverk på toppen. Rød gjenstand bak rekkverket. | Bakk-overbygg, redningsbøye | T | P2 | ☐ |
| SUL-OVB-10 | Z2 | Grå beholder | Grå avrundet kapsel med rødt merke på dekket under styrehuset, BB/forut. | Utstyrsskap eller flåte | T | P3 | ☐ |
| SUL-OVB-11 | Z4 | Buet le-tak akter | Krum hvit takplate med rørkant, fra overbygget akterover mot hekken. 2 mannskap står ved enden. | Skjerm over notbinge/arbeidsdekk | S | P2 | ☐ |
| SUL-OVB-12 | Z4 | Gittertrapp og fareskilting | Galvanisert gittertrapp, og gul/sort skråstripet fareskilting på vertikal konstruksjon ved pumpesonen. | – | S | P3 | ☐ |
| SUL-OVB-13 | Z5 | Leider | Gul/messingfarget vertikal leider på skottet ved pumpestasjonen. | – | T | P3 | ☐ |
| SUL-OVB-14 | – | Ikke synlig | Skorstein/eksos (trolig integrert i mast eller akterkant), styrehusets akterside (akterstyreplass mot notbinge), BB brovinge, dører, interiør. | Krever flere referanser | A | P2 | ☐ |

---

## 6. Signalmast, radar og elektronikk (MST)

| ID | Sone | Element | Observert | Tolkning | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-MST-01 | Z1 | Mastetårn | Hvitt, avsmalnende kasse-/trapesformet tårn over styrehuset med blå plattformkant og rekkverk. Leider/trinn langs SB side. | Signalmast | S | P1 | ☐ |
| SUL-MST-02 | Z1 | Rørramme på topp | Hvit rørkonstruksjon i 2–3 etasjer med horisontale armer (rå) som bærer lys og antenner. | – | S | P2 | ☐ |
| SUL-MST-03 | Z1 | Radom 1 (venstre) | Stor hvit kuppel (ca. 1,2–1,5 m Ø) med flat bunnflens, logo og gul varseldekal (SUL-IDN-09). | VSAT/satellittkommunikasjon | S | P1 | ☐ |
| SUL-MST-04 | Z1 | Radom 2 (høyre) | Litt mindre hvit kuppel med «Intellian» på egen hvit konisk sokkel, med blå ring/plattform under. | VSAT/TV-sat | S | P1 | ☐ |
| SUL-MST-05 | Z2 | Radarantenne | Lang hvit open array-antenne (ca. 2,5–3 m) på grått girhus, foran masta på styrehustaket. | X-bånd-radar, **roterende** | S | P1 | ☐ |
| SUL-MST-06 | – | Radar 2 | Ikke tydelig synlig. Fartøy av denne typen har normalt minst 2 radarer. | Sjekk BB og bakside | A | P2 | ☐ |
| SUL-MST-07 | Z1 | Toppanterner | 2 lanterner med mørkerød/brun hette ytterst på toppen av rørrammen, pluss flere små lamper. | Rundtlys/fiskelys | T | P2 | ☐ |
| SUL-MST-08 | Z1 | Små antenner | 3–5 hvite sopp-/kuleantenner på korte stenger, 1 kort pisk (ca. 2 m) på toppen midt på, 1 liten sort sensor. | GPS/AIS/Inmarsat-C, vindmåler | S | P3 | ☐ |
| SUL-MST-09 | Z1/Z2 | Lange piskantenner | 2 svært høye hvite glassfiberpisker (ca. 8–10 m): én akter (venstre i bildet) og én forut (høyre i bildet) med skjøtehylse ca. 2/3 opp. 1–2 kortere pisker på styrehustaket. | MF/HF- og VHF-antenner | S | P2 | ☐ |
| SUL-MST-10 | Z1 | Kule på stang og boks | Liten hvit kule på stang og hvit boksenhet på bakre plattform. | GPS-kompass, kamera/lys | S | P3 | ☐ |
| SUL-MST-11 | Z1 | Lyskaster på ramme | Sort lyskaster/arbeidslys på rørrammens nedre del, SB. | – | S | P3 | ☐ |
| SUL-MST-12 | Z1/Z3 | Kabelbunter | Sorte kabler langs mastens SB side og ved kranfundamentet. | – | S | P3 | ☐ |
| SUL-MST-13 | Z2 | Søkelys på styrehustaket | Kromhus med stor rund linse på sokkel, front SB. | Søkelys, **pan/tilt** | S | P2 | ☐ |
| SUL-MST-14 | Z2 | Takutstyr | Hvit sylinder, hvite koblingsbokser og en oransje/rød gjenstand på styrehustaket. | Kompasshus/antenne, MOB-lys | T | P3 | ☐ |

---

## 7. Formast og bakk (FOR)

| ID | Sone | Element | Observert | Tolkning | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-FOR-01 | Z6 | Formast | Høy, hvit, konisk og avsmalnende rund mast midt på bakken (ca. 12–15 m over dekk). | – | S | P1 | ☐ |
| SUL-FOR-02 | Z6 | Klatretrinn | U-formede trinn på begge sider fra fot til topp (20+ stk.). | – | S | P3 | ☐ |
| SUL-FOR-03 | Z6 | Nedre plattform | Rørrekkverk med blå underside/kant. Under: 2 kvadratiske LED-flomlys og en liten enhet. Venstre ende i bildet: rund gul/oransje lanterne. | Gule blinklys for ringnot (T) | S/T | P2 | ☐ |
| SUL-FOR-04 | Z6 | Stor lyskaster | Ca. 0,5 m Ø, kromhus, på mastens front over nedre plattform. | Søkelys, **pan/tilt** | S | P2 | ☐ |
| SUL-FOR-05 | Z6 | Øvre plattform | Mindre plattform med rekkverk og blå kant. | – | S | P2 | ☐ |
| SUL-FOR-06 | Z6 | Mastetopp | Lanterne med mørk hette og liten blå skive. | Topplys/rundtlys | S | P2 | ☐ |
| SUL-FOR-07 | Z6 | Utstyr med presenning | Stort utstyr ved mastefoten, dekket av dyp blå presenning som er surret fast. | Vinsj eller blokk i parkert stilling | T | P2 | ☐ |
| SUL-FOR-08 | Z6 | Notgjerde | Høye hvite rørstøtter (ca. 1,5–2 m over rekkverket) langs bakkens kanter, med grønne tau i sikksakk og horisontale grønne liner mellom. | Hindrer at nota henger seg fast | S | P2 | ☐ |
| SUL-FOR-09 | Z6 | Bakkrekkverk | Hvitt rørrekkverk med tettstilte vertikale sprosser rundt baugen. | – | S | P2 | ☐ |
| SUL-FOR-10 | Z6 | Vinsj | Grå vinsj med stor trommel med grønt tau, forut SB. | Anker-/fortøyningsvinsj | S | P2 | ☐ |
| SUL-FOR-11 | Z6 | Gul trosse | Tykk gul trosse/slange lagt langs baugrekkverket. | Fortøyningstrosse | S | P3 | ☐ |
| SUL-FOR-12 | Z6 | Småutstyr | Liten hvit stolpe med T-topp ved vinsjen, sort sylinder på dekk. | Lys/sensor, fender | T | P3 | ☐ |
| SUL-FOR-13 | Z6 | Maskinramme | Grått gitterdekk/ramme med oransje komponent under notgjerdet. | Vinsj/hydraulikk | T | P3 | ☐ |

---

## 8. Kraner og fiskehåndtering (DEK)

| ID | Sone | Element | Observert | Tolkning | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-DEK-01 | Z3 | Akterkran | Hvit hydraulisk bomkran høyt på overbyggets akterkant ved masta. Bommen peker ut mot SB/akter. Hydraulisk løftesylinder under bommen, teleskop-/knekkseksjon ytterst. | Notkran, **rigges** | S | P1 | ☐ |
| SUL-DEK-02 | Z3 | Kranspiss | Hvit vaierskive-enhet på toppen, rotator/svivel, blå hydraulikkslanger i bue og liten krok med kjetting ytterst. Tynn vaier langs bommen. | – | S | P2 | ☐ |
| SUL-DEK-03 | Z3 | Hengende kraftblokk | Under kranspissen: to store hvite hjulskiver med ring av 8–10 lettelseshull på hver side av en sort midttrommel. Sort trådbur rundt hydraulikkmotor, stålstag. Henger fritt i svivel. | Kraftblokk/nothaler, **roterer + pendler** | T | P1 | ☐ |
| SUL-DEK-04 | Z3/Z5 | Hvitt trompetrør | Stort hvitt buet rør med utvidet trakteåpning på toppen, som vender opp mot kraftblokka. Går skrått ned mot skutesiden. | Nottrakt: nota trekkes trolig gjennom når den hales og legges ombord (brukerens vurdering). Samme komponent finnes på Trønderhav. | S/T | P1 | ☐ |
| SUL-DEK-05 | Z5 | Svivelhode | Sort konisk, trinnvis hode under røret, med flat sort flens med sirkulære spor, på bronsefarget skrå sokkelplate. | Dreiekobling | T | P2 | ☐ |
| SUL-DEK-06 | Z5 | Rustfri trakt | Blank konisk trakt med åpningen opp, koblet til pumpeslangen. Tau surret rundt. | Slangeinntak/-kobling | S | P2 | ☐ |
| SUL-DEK-07 | Z5 | Pumpeslange | Sort gummislange med stor diameter (ca. 0,35–0,45 m). Henger i kjedelinje utenpå skroget SB fra trakten akter til koblingspunktet forut, der den går inn over skutesiden via stålbend og flenskobling med bolter. | Sugeslange for fiskepumpe, suger fisken ut av nota. **Kurve/bones** | S | P1 | ☐ |
| SUL-DEK-08 | Z5 | Pumpestasjon | Sort/grått maskineri på hoveddekket midtskips med rød/oransje flens og rød rektangulær komponent. Hvit søyle/davit med bunt av sorte hydraulikkslanger. Grå klokkeformet hette. | Pumpe, hydraulikk, lufterør | T | P2 | ☐ |
| SUL-DEK-09 | Z5/Z2 | Midtkran | Hvit knekkbomkran med fundament forut ved bakken SB. Hovedbommen går skrått opp akterover langs overbygget, med hydraulisk sylinder (blank stang) under. Knekkledd med sorte slanger og gul kabel. Jib ned mot pumpestasjonen med hvitt krokbeslag/blokk i enden. | Slange-/pumpekran, **rigges** | S | P1 | ☐ |
| SUL-DEK-10 | Z5 | Portalramme | Kraftig hvit L-/portalformet stålramme over skutesiden i forkant av pumpesonen. | Sidehaler-/blokkarm eller pumpegalge | T | P2 | ☐ |
| SUL-DEK-11 | Z5 | Mørk enhet | Stor mørkegrå enhet med avrundet topp og lys prikket overflate (ca. 2–3 m høy) bak midtkranens fundament. | Nettrommel, sidehaler med gummibelegg eller stablet not | A | P2 | ☐ |
| SUL-DEK-12 | Z4 | Notbinge | Mørkt materiale bak hekkens toppkant, beige/rustfarget slitt dekk. | Not i binge | A | P2 | ☐ |
| SUL-DEK-13 | – | Ikke synlig | Snurpevinsj, trål-/snurrevadvinsjer, nettrommel akter, galge, utstyr på BB, lasteluker/RSW-luker, avvanner, MOB-båt med davit. | Krever flere referanser | A | P2 | ☐ |

---

## 9. Redskap i sjøen (RED)

| ID | Sone | Element | Observert | Tolkning | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|---|
| SUL-RED-01 | Z8 | Grønt tau 1 | Tykt grønt tau (ca. 40–60 mm) fra SB låring ned i sjøen og akterover. Ligger delvis i overflaten ut mot venstre bildekant. | Korkline/notstrekk | S | P1 | ☐ |
| SUL-RED-02 | Z8 | Flottørklynge | 6–8 gule runde flottører (ca. 20–25 cm) samlet på tau 1 nær skroget. | Notflottører | S | P2 | ☐ |
| SUL-RED-03 | Z8 | Line 2 | Mørk kjetting-/vaierline med grønt tau fra pumpesonen diagonalt ned i sjøen. Divergerer ca. 10° fra tau 1. | Snurpe-/ringline | S | P2 | ☐ |
| SUL-RED-04 | Z8 | Redskapstolkning | Mest sannsynlig ringnot under tørking/pumping. Alternativt snurrevad-/fly-shooting-tau. | Bestemmer gameplay-scenen | T | – | ☐ |
| SUL-RED-05 | Z5 | Fenderbøye | Rosa/korallrød rund bøye (ca. 0,6–0,8 m Ø), hengende i tynt tau fra rekka like over vannlinja ved trakten. | A-type fenderbøye, **fysikk** | S | P2 | ☐ |
| SUL-RED-06 | Z4 | Tau over hekken | Svart tau over hekkens toppkant, håndtert av 2 mannskap. | – | S | P3 | ☐ |

---

## 10. Lys og lanterner (LYS)

Samleoversikt med antall som er synlige på SB side. Hver lyskilde skal ha et eget emitter-objekt
som kan slås av og på.

| ID | Type | Synlig antall | Plassering (ID) | Krav i spillet | ☐ |
|---|---|---|---|---|---|
| SUL-LYS-01 | Søkelys med kromhus | 2 | Formast (SUL-FOR-04), styrehustak (SUL-MST-13) | Spotlight, pan/tilt, volumetrisk kjegle | ☐ |
| SUL-LYS-02 | LED-flomlys/arbeidslys | ≥ 4 | Formast (SUL-FOR-03), mastramme (SUL-MST-11), styrehusside (SUL-OVB-06) | Area/spot, dekkbelysning om natta | ☐ |
| SUL-LYS-03 | Topplys/rundtlys | ≥ 3 | Formasttopp (SUL-FOR-06), signalmast (SUL-MST-07) | Emissive + point light | ☐ |
| SUL-LYS-04 | Gul lanterne | 1 | Formastens nedre plattform (SUL-FOR-03) | Gule vekselblink under ringnotfiske | ☐ |
| SUL-LYS-05 | Sidelanterne SB (grønn) | Ikke identifisert | Trolig på brovingen. Den røde ovalen (SUL-OVB-08) er ikke sidelanterne. | 112,5° sektor | ☐ |
| SUL-LYS-06 | Lysstilstander | – | – | Gange · Trålfiske (grønt over hvitt) · Annet fiske (rødt over hvitt) · Ringnot (+ 2 gule vekselblink) · Ankret | ☐ |

---

## 11. Sikkerhetsutstyr (SIK)

| ID | Sone | Element | Observert | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|
| SUL-SIK-01 | alle | Rekkverk | Hvite rørrekkverk på alle åpne dekk (2 vanger, stolper ca. 1,5 m), blått midtskips, tett sprosserekkverk på bakken. Lag trim-sheet og modulære deler. | S | P2 | ☐ |
| SUL-SIK-02 | Z3 | Redningsflåter | 2 hvite beholdere i stativ på akterdekket bak styrehuset (SUL-OVB-07). Trolig flere på BB. | T | P2 | ☐ |
| SUL-SIK-03 | Z6 | Redningsbøye | Rød gjenstand bak bakkrekkverket (SUL-OVB-09). | A | P3 | ☐ |
| SUL-SIK-04 | Z4 | Fareskilting | Gul/sort skråstriper (SUL-OVB-12). | S | P3 | ☐ |
| SUL-SIK-05 | – | MOB-båt | Ikke synlig. Normalt påkrevd med davit, kan stå på BB-siden som ikke synes. | A | P2 | ☐ |

---

## 12. Mannskap (MAN)

Mannskapet brukes som skalareferanse og til NPC-design.

| ID | Sone | Antall | Observert | Pri. | ☐ |
|---|---|---|---|---|---|
| SUL-MAN-01 | Z4 | 2 | På hekken, lent over skansen: én gul og én hvit hjelm, refleks gulgrønne jakker, blå hansker. Håndterer svart tau. | P2 | ☐ |
| SUL-MAN-02 | Z3 | 1 | På akterdekket ved flåtene: hvit hjelm, gul/oransje jakke, blå bukse, grønne hansker. | P2 | ☐ |
| SUL-MAN-03 | Z5 | 1 | Ved trakten: rød/oransje flytedress/oljehyre med hette. | P2 | ☐ |
| SUL-MAN-04 | – | – | Skalareferanse: 1,80 m figur. Plasser én ved hver arbeidsstasjon i benchmark-renderet. | P1 | ☐ |

---

## 13. Slitasje og overflatedetaljer (SLT)

| ID | Sone | Observert | Teknikk | Sik. | Pri. | ☐ |
|---|---|---|---|---|---|---|
| SUL-SLT-01 | Z4 | Generelt nyere og velholdt fartøy. Baug og overbygg er rene. Lav til moderat slitasje. | Global weathering-styrke ca. 0,2–0,3 | S | P1 | ☐ |
| SUL-SLT-02 | Z4 | Brune rustestriper og slitasje på hekkskansens toppkant og innside. | Kantmaske + rust-decal | S | P2 | ☐ |
| SUL-SLT-03 | Z4/Z5 | Lysere blå flekker, riper og flekkmaling på skroget rundt pumpe- og tausonen. | Ripe-/touch-up-maske | S | P2 | ☐ |
| SUL-SLT-04 | Z4 | Lett skitten og gulnet hvit plating akter. | Grime-maske (AO-basert) | S | P3 | ☐ |
| SUL-SLT-05 | Z4/Z5 | Vann som renner fra utløp, mørkere fuktig sone ved vannlinja. | Wetness-maske, partikler | T | P3 | ☐ |
| SUL-SLT-06 | Z7 | Plateskjøter og sveiser (SUL-SKR-05/06). | Normal map / trim | S | P3 | ☐ |
| SUL-SLT-07 | – | Forventet på reelt fartøy: kantslitasje på rekkverk, rennestriper under lenseporter, slitasje under klyss og ved ankerlomma. | Procedural masks | A | P3 | ☐ |

---

## 14. Miljø og referanse-render (MIL)

| ID | Element | Observert | Krav til benchmark-scene | ☐ |
|---|---|---|---|---|
| SUL-MIL-01 | Sjø | Mørk marineblå (`#2E4561`), moderat dønning (ca. 1–2 m), vindkrusninger, hvitt skum ved bulben, svak hekkbølge. | Havshader med skum rundt skrogkontakt | ☐ |
| SUL-MIL-02 | Himmel | Klar blå topp (`#608FD5`), stor hvit cumulusbanke med blågrå underside, mørk grå sky til venstre. | Tilsvarende HDRI | ☐ |
| SUL-MIL-03 | Lys | Sterk sol fra høyre/forfra, ca. 30–40° høyde, harde skygger. SB side delvis i sol. | Sun lamp + HDRI | ☐ |
| SUL-MIL-04 | Kamera | Lavt (ca. 2–5 m over sjøen, trolig fra en annen båt), SB baug-kvarter ca. 30–45° fra baugen, telelinse (komprimert perspektiv). Skipet fyller ca. 85 % av bildebredden. | Kamera ca. 85–135 mm, 1577 × 1010 | ☐ |
| SUL-MIL-05 | Måke | Én måke i lufta til høyre for formasta. | Valgfritt | ☐ |
| SUL-MIL-06 | Tilstand | Fartøyet ligger nesten stille med redskap ute. | Scene «pumping» | ☐ |

---

## 15. Benchmark og Blender-standarder

Poeng, vekting, standard kameraer, riggekrav og Blender-standarder står i
[planlisten kap. 30–31](planliste-fiskefartoy.md#30-benchmark-og-kvalitetskrav). For dette fartøyet:

- Kortkode `SUL`, typemodul **RNG**.
- Referansefotoet tilsvarer standardkamera **K1** (se SUL-MIL-04).
- Riggekrav: radar (SUL-MST-05), kraner (SUL-DEK-01, SUL-DEK-09), kraftblokk (SUL-DEK-03),
  pumpeslange (SUL-DEK-07), tau og flottører (SUL-RED-01 til -03), fenderbøye (SUL-RED-05),
  søkelys (SUL-LYS-01) og lysstilstander (SUL-LYS-06).

---

## 16. Referanser som mangler

Bildet viser bare SB side fra én vinkel. Skaff disse før modellen kan nå hero-nivå:

- [ ] Hovedmål fra register (kap. 1), helst generalarrangement-tegning (GA).
- [ ] BB side (kraner, sidehaler, pumpe og flåter er trolig plassert annerledes).
- [ ] Akterspeil og akterdekk ovenfra (notbinge, vinsjer, nettrommel, galge).
- [ ] Undervannsskrog i dokk (propell, ror, thrustere, sonar, bunnstoffarge).
- [ ] Skorstein/eksos og bakside av signalmasta.
- [ ] Nærbilder av kraftblokk, trompetrør og svivel (SUL-DEK-03 til SUL-DEK-05) for å avklare funksjonen.
- [ ] Styrehusinteriør (valgfritt, hvis spillet har bro-visning).
- [ ] Nattbilde for lyssetting.

---

## Endringslogg

| Dato | Endring |
|---|---|
| 2026-10-29 | Første versjon, basert på ett referansefoto. Gjort om til eksempel på planlisten. |
| 2026-10-30 | Rettet side: bildet viser SB side, ikke BB. Oppdatert tolkning av nottrakt (SUL-DEK-04), sugeslange (SUL-DEK-07), V-merker (SUL-IDN-07) og rød oval (SUL-OVB-08). |
