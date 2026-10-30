# Sulebas: byggegrunnlaget for pilotmodellen (F4)

> Forarbeidet til pilotbåten i `docs/planer/grafikk-batmodeller.md` (F4). Jonas 30.10.2026: «Når vi har gjort alt av forarbeid og
> analyser og du mener vi er 100% klar, så skal vi starte en ny økt der vi skal lage en blender-modell av pilotbåten sulebas i det
> detaljnivået vi ønsker.» Dette dokumentet er det økta bygger fra. Det bygger på bildeanalysen
> (`eksempel-sulebas-sf-100-su.md`, ett bilde, SUL-ID-ene), Jonas' tre nye bilder 30.10.2026 (ikke i repoet, fotografenes bilder) og
> planlisten (`planliste-fiskefartoy.md`).
>
> **Status: ikke klar ennå.** Kapittel 8 sier hva som mangler. Kildekoder: **S** sett i bilde, **T** tolket, **A** antatt,
> **R** fra en skriftlig kilde.

## 1. Fakta om båten

Fra byggerapporten i Maritimt Magasin («Sulebas», 04/2014), skjermbilder fra Jonas 30.10.2026 (R), og søk (R).

| Hva | Verdi | Følger for modellen |
|---|---|---|
| Navn, merke, kallesignal | SULEBAS, SF-100-SU, LECW (IMO 9675092) | Brukes ikke i spillet (kap. 2) |
| Design, verft | Seacon SC38. Skroget bygd ved Riga Shipyard (Latvia), utrustet og levert av Solund Verft AS (byggenummer 6) 15.02.2014 | – |
| Klasse | DNV 1A1 Fishing Vessel, Sjøfartsdirektoratets regler for fiskefartøy, fartsområde Havfiske II | – |
| **Lengde o.a.** | **38,55 m** | Låst |
| **Lengde p.p.** | **34,00 m** | Avstanden mellom perpendikulærene: hekken stikker rundt 1 m akter for roraksen, baugen med bulb rundt 3,5 m forut for FP (A) |
| **Bredde** | **9,50 m** | Låst |
| **Dybde til hoveddekket** | **4,30 m** | Låst (fra kjølen) |
| **Dybde til shelterdekket** | **6,60 m** | Låst: shelterdekket ligger 2,30 m over hoveddekket |
| Bruttotonnasje | 499 | – |
| Brennolje / RSW | 78,6 m³ / 419,5 m³ | RSW-tankene under hoveddekket midtskips: luker (DKS-03) |
| Dypgang | Ikke oppgitt | Anslått fra bildene (kap. 4.0) |
| Hovedmotor | 749 kW ved 1000 o/min, gir 5,04:1 | Propellen går rundt 200 o/min: stor propell |
| Propellanlegg | Type P70.22.280.4 (vribare blader) | Tolket: CPP, 4 blader, rundt 2,80 m diameter (T: siste to tall) |
| Ror | Eget styremaskinanlegg | Ror bak propellen |
| Thrustere | To tunnelthrustere FU-45-LTC-1225, 368 og 450 kW | Tunnel rundt 1,2 m (T: «1225»). Merkene i bildene viser én forut og én akter |
| Hjelpemotorer | 3 × 260 kW + akselgenerator 1240 kVA | – |
| Dekkskran | 25 tm | Knekkbomkranen midtskips (bilde 1, 2) |
| Fiskepumpekran | Egen kran | Kranen ved pumpa |
| Notkran | Egen modell (NK-6000) | Kranen akter styrbord med kraftblokka |
| Nothåndtering | Flålegger, mellomrull, notvinsj | Notbingen akter (RNG-03, -04) |
| Vinsjer | 2 ankervinsjer, brystvinsj, ørekalvinsj | Ankervinsjene på bakken; brystvinsj og ørekalvinsj er ringnotvinsjer (snurpinga) |
| Garn | Garnhaler og garngreier | Garnhaleren ved rekka (GRN-modulen: båten fisker også garn) |
| Fiskepumpe, RSW, vakuum/lossing, ozon | Egne anlegg | Pumpa midtskips; losseanlegg på dekk (A) |
| Fabrikk | Ja (lite anlegg) | Ikke synlig utvendig |
| MOB-båt og davit | RRB 425 (4,25 m), davit MOB 400-B | Oransje redningsbåt bak styrehuset babord, 4,25 m |
| Radarer | To: en 6 fots X-band og en «solid state» | To åpne radarantenner på mastetårnene |
| Sonarer | To: en lavfrekvent sonar og en høyfrekvent, pluss ekkolodd | To sonarkjøler/senkerør under forskipet (SKR-15) |
| Satellitt | SAT-TV-kuppel, Inmarsat-C, satellittelefoner, GMDSS A3 (MF/HF) | Radomene på taket, MF/HF-pisk, små sopper |
| Annet | AIS, VHF ×2, UHF, kompass, GPS, strømlogg, notovervåking, CCTV | Små antenner og kameraer på mastene |

Leverandørnavnene står i kilden, men brukes ikke i spillet.

**Viktig:** ringnotbåten i spillet (`pelagisk`, `not75.py`) er 75 m. Sulebas er en annen klasse: en flerbruks kystbåt med
ringnot, snurrevad og garn på 38,55 m. Se avgjørelse B1.

## 2. Reglene som gjelder modellen

- **Ingen ekte navn i spillet** (CLAUDE.md 07.10.2026): ikke «SULEBAS», «FLORØ», «SF-100-SU», «LECW», rederilogoen «LR» eller
  produsentnavnet på kranene («TRIPLEX»). Spillerens eget navn, hjemhavn og merke settes på navnefeltene (`names`, `regmark`) som
  på de andre båtene. Modellen får bare feltene og et nøytralt merke.
- **Bare utsiden** (06.10.2026): ingen innredning, men det som synes gjennom vinduene (konsoll, stoler, lys) er utside (OVB-12).
- **Ingen kjøpbart utstyr modellert inn** (18.10.2026): skipets egne systemer (kraner, kraftblokk, nottrakt, vinsjer, pumpe,
  tauspoler, galge) er skrog. Nota, korklina, tauene og fangsten tegnes av spillet. Det som kan kjøpes (radar, flåter, livbøyer)
  står på festepunkter (`kit`).
- **Ingen kode velger etter båttypens navn** (`vesseltest`).
- **Lanternene etter sjøveisreglene** (kap. 6).

## 3. Avgjørelser før bygging

| # | Spørsmål | Valg | Anbefaling |
|---|---|---|---|
| B1 | Hvor i spillet hører båten hjemme? | A) Ny båttype på rundt 38 m (flerbruk ringnot og snurrevad) i stigen mellom kystbåtene og havflåten. B) Erstatter modellen for dagens 75 m ringnotbåt (feil størrelse og type). C) Bygges som pilot nå, plassen i spillet avgjøres etterpå | **C.** Modellen bygges i riktig størrelse, og ingenting i spillmekanikken endres i pilotøkta. B frarådes: proporsjonene til en 38 m båt blir feil på 75 m |
| B2 | Fargene | A) Som Sulebas: blått skrog, hvit skanse og overbygg, rødt bunnstoff, hvit vannlinjestripe, blå striper på taket. B) Eget design | **A** som standard (det er ikke et firmanavn, og spilleren kan male om). Logo og navn byttes |
| B3 | Detaljnivå i tall | Nær 250 000–300 000 trekanter (F0-målingen), middels 30 000, fjern 4 000 | Som foreslått. Endelig etter F1 |
| B4 | Rekkefølge | A) Piloten bygges etter F1–F3 (materialene finnes). B) Geometrien nå, materialene etterpå | **A.** UV-ene må legges mens modellen bygges |
| B5 | Hvilken scene vises i kontrollbildene | Gange, ringnot med pumping (som originalbildet), snurrevad | Alle tre. Utstyrsstillingene legges inn som deler som kan flyttes |

## 4. Båten sone for sone

Mål i meter langs skroget fra baugen er **anslag** fra bilde 2 (babord side, baugen til venstre, rundt 16,7 px/m med 38,55 m). Alt
merket A skal kontrolleres mot bedre kilder (kap. 8).

### 4.0 Målt på sidebilde 3 (30.10.2026)

Bilde 3 er babord side under fart, tatt med tele fra land (3392 × 2400 i skjermbildet). Skala 80,47 px/m fra stevntoppen (u 118) til
akterspeilet (u 3220). Høyder regnes fra shelterdekket, 6,60 m midtskips (byggerapporten), som ligger på v 1571 ved x = 18,2 m. Alle
mål er i modellens ramme: x forover fra akterspeilet, z opp fra basislinja. Overlegget (`ov_edge`, ortografisk babord) treffer
stevn, hekk, spring, stripe, styrehus, master og kraner innen et par cm i bildet.

- **Spring er ekte.** Den blå toppen (shelterdekkets kant) går fra 7,39 m ved hekken, ned til 6,54 m ved x 15,5 og opp til 8,13 m ved
  stevnen (målt hver 0,5 m etter fargen). Det eldre sidebildet viser samme stigning i meter, så den kommer ikke fra linsa. Den brede
  hvite stripen har sin egen spring: toppen ligger på 4,92 m på det laveste og 5,57 m akter. Den er 0,33 m bred og går sammenhengende
  fra 4,35 til 27,35 m, med tre skrå streker i hver ende.
- **Stevnen** heller rundt 33°, gjennom 35,2 m i vannlinja (= AP + Lpp med rorstammen i 1,2 m) og opp til 9,18 m.
- **Sida:** toppen ligger på 9,85 m rundt notbingen akter (0–6,35 m) og på 8,44–8,84 m langs øvre dekk. Forut stiger den til 9,18 m som
  et lavt skansekledning. Rekkverkets topp ligger på 9,78 m fra 8 m og helt fram. Øvre dekk går nesten flatt fra 8,66 m (6,42 m) til
  8,72 m ved baugen. Shelterdekket under er lukket hele veien fram.
- **Styrehuset:** glass fra karmen på 11,95 m til overkanten på 13,18 m. Glasset heller utover på alle sider (0,30 m forut, 0,36 m
  akter). Den blå takkanten ligger på 13,26–13,42 m og står 0,64 m ut over fronten og 0,3 m ellers. Taket skrår 0,6 m opp innover til
  kompassdekket på 14,02 m, med rekkverk til 15,0 m. Dekk B er en plattform rundt styrehuset på 11,05 m, med rekkverk til 12,05 m,
  fra 10,28 til 21,22 m. Døra på babord står mellom 11,58 og 12,18 m. Styrbords sidelys sitter på takskråningen, lampa ved x 14,6
  og z 13,8. Kallesignalskiltet står på 11,85–14,69 m × 13,88–14,98 m.
- **Huset på øvre dekk:** 11,73–20,35 m, med to par høye vinduer på hver side (z 9,72–10,5) og en blå linje på 9,88–10,0 m.
- **Skrogsida:**
  - Ankerlomma ligger på 30,6–32,2 × 7,40–7,94, med ankerkronen under.
  - Lufteåpninger med lameller ligger på 5,76–6,05 m mellom 16,8 og 27,1 m.
  - Innfelte trinn går fra dekket til vannet ved 22,5–22,9 m.
  - Vinduer i shelterdekkssida: 13,0–14,4, 9,35–10,5 og 4,7–5,1 m.
  - En sidedør står ved 6,65–7,65 m.
  - Åtte lensporter sitter i bingeveggen (0,3–3,6 × 8,8–9,07 m), og fem utløp under de aktre strekene.
- **Pipa:** står på babord akter, flukt med sida, på 4,06–6,36 m. Den går fra veggen til den blå toppen på 12,14–12,45 m og har ett
  svanehalsrør.
- **Formasten:** forkanten heller akterover og akterkanten står nesten loddrett (bunnen 30,14–31,38, toppen 29,9–30,3). Plattformene
  ligger på 13,52 og 15,33 m, og topplanterna på 17,5 m. Lyskasteren står på den nedre plattformen.
- **Radarmasta:** tårnet går til plattformen på 17,2 m og videre til kuppelplattformen på 19,3 m. Kuppel 1 har 1,3 m diameter og
  sitter på x 14,3. Kuppel 2 har 1,5 m diameter og står på en stang ved x 11,5 (topp 21,5 m). Stigemasta har røde lys på 22,1 m.
  Radarene står på 15,9–16,2 m (4,4 m antenne) og 18,0–18,2 m (1,6 m). Piskeantennene går til 24,2 og 24,7 m.
- **Kranene:**
  - Den forreste kranen er sammenfoldet, med knekken på 19,6 × 11,7 og jiben ned til hvilen ved 26,9 × 10,5.
  - Akterkranen har søylen ved 7,2 m til 16,8 m og hodet til 18,1 m. Bommen går fram til 12,1 m.
  - Hjulet til nothaleren (1,75 m) henger på et åk på 14,3 m.
- **MOB-båten** (4,25 m) står på 7,85–12,05 m med davit ved 11,45 m.

**Styrbord er lavere enn babord** (Jonas 30.10.2026, bildene 274df4a7, 82e91969, 3f711e55). På styrbord ligger et åpent
arbeidsdekk på shelterdekket fra 7,3 til 25,8 m, med bare et blått rørrekkverk (1,1 m) på skrogkanten. Den høye bingeveggen akter
bøyer ned mot dekket ved 5,0–7,3 m, og forut reiser sida seg til bakken ved 25,8–26,6 m. Babord halvdel er et lukket hus (kassen,
`Y_C` = −0,6 m) opp til øvre dekk. Huset på dekket går ned til arbeidsdekket på styrbord. Den forreste kranen står på foten ved
bakken (26,85 m, babord) og ligger foldet akterover langs babord side med knekken ved 19,7 m. Det leste jeg feil første gang, og
flybildet viser det.

**Åpningene er ekte hull** (Jonas 30.10.2026: «ikke bare bruk svarte teksturer»). Skroget og skansekledningens innside skjæres med
et prisme gjennom omrisset (`holes()` og `cutter()`, boolsk EXACT). Lokket som løseren legger over hullet, slettes etterpå. Hvert
hull får en lysning: platekanten og så et mørkt rom bak med bakvegg (`box`), lameller (`louvre`), glass (`glass`) eller ankeret
(`pocket`). Hull gjennom skansekledningen (`thru`) viser dekket bak. På styrbord er stedene for lufteåpningene akter for 16 m,
trinnene ved 8 m og den store åpningen i baksida (27,05–28,45 m) anslått fra skråbilder uten skala.

Antatt, ikke målt: alt som ligger på tvers av båten. Bredden på husene, styrehuset (±3,9) og plattformen (±4,45) er anslått, og
master, kupler og kraner står midt i båten eller ved babord rekke. Styrbord side antas lik babord, bortsett fra pipa og døra. Det
trengs bilder forfra, akterfra og fra styrbord.

### 4.1 Skrog og merking (begge sider)

- **Silhuett:** høy bakk forut med tydelig spring, nesten rett dekkslinje akterover, høy lukket hekk med stor radius i hjørnene
  (SUL-SKR-01, -11). Hvit skanse og overbygg, blått skrog, hvit vannlinjestripe, mørkt rødt bunnstoff (S, alle bildene).
- **Baug:** rett, svakt foroverlent stevn, flare, bulb i vannflaten (SUL-SKR-02–04). Ankerlomme i overgangen hvit/blå (SUL-SKR-10).
  Rederilogo i hvit ring og fem hvite fartsstriper høyt på det blå forut (bilde 2: «LR»-ringen og stripene ved stevnen) – byttes
  med nøytral logo. Registreringsmerket på den hvite skansen forut, begge sider (bilde 2: «SF-100-SU» på babord).
- **Langs siden:** rad med firkantede åpninger i det blå like over vannlinja (bilde 1 og 3), lenseporter øverst i det blå, et par
  firkantede vinduer i det hvite midtskips (bilde 3), utvendige leidertrinn i siden (bilde 2 midtskips, bilde 1 aktre hjørne).
- **Akter:** baugthruster- og akterthrustermerke (⊕) med tre–fire hvite vertikale streker (rister) like over vannlinja akter
  (bilde 1, 3: «ꟾꟾꟾ ⊕»). Navn og hjemhavn to steder på det hvite akter: på hekkens skrå hjørne og lenger forut på aktre
  overbygg (bilde 1, 2, 3). Rad med små vinduer (8–10) i det hvite akter på styrbord (bilde 2 «SULEBAS FLORØ»-veggen).
- **Hekkspeilet:** ikke sett rett bakfra. Bilde 3 viser hvit øvre del med navn og leidertrinn i hjørnet (A for resten).

### 4.2 Forskipet (0–12 m fra baugen)

- **Bakk** med rekkverk rundt, ankervinsj (ikke sett, A), en blå presenning over noe på bakken (bilde 2: rund, rundt 1,5 m),
  livbøye med lys på rekkverket (bilde 1).
- **Formast** (rundt 8–9 m fra baugen): hvit konisk rørmast, to plattformer med blå kant og rekkverk, lyskaster, lanterner,
  toppstang med lys (bilde 1, 2, 3). Leider på masta (bilde 1: trapp/leider ved foten).
- **Leidere** fra hoveddekket opp til bakken (bilde 1: skrå trapp med rekkverk ved formastas fot).

### 4.3 Midtskips arbeidsdekk (12–20 m)

- **Knekkbomkran** med fundament ved bakken styrbord, bommen lagt akterover langs overbygget (bilde 1: «TRIPLEX»-bom med gult
  skilt; bilde 2: bommen ligger forover over dekket). SUL-DEK-09.
- **Pumpestasjon** med fiskepumpe, svivel og trakt (SUL-DEK-05, -06, -08). **Sugeslangen er grønn** i bilde 1 (rundt 0,35 m),
  lagt utenbords langs styrbord side fra midtskips mot baugen (i originalbildet sort og hengende i kjedelinje).
- **Portalramme** over skutesiden ved pumpa (SUL-DEK-10), **mørk enhet** bak kranfundamentet (SUL-DEK-11: nettrommel eller
  sidehaler).
- Gul kasse (fiskekasse/oppbevaring) og mye løst utstyr på dekk (bilde 2, 3).

### 4.4 Overbygg og styrehus (rundt 17–28 m)

- **Styrehuset** på et dekkshus, vinduer rundt hele fronten og sidene (10–12 ruter, skråstilte, sorte karmer), taket med
  overheng og **blå stripe langs takkanten** (bilde 1, 2, 3). Skilt med kallesignalet på taket (byttes med spillerens).
- **To mastetårn på taket:** hvite, trappede tårn med blå bånd. Det aktre er høyest, med to radomer (hvite kuler, rundt 1,2 m),
  åpne radarantenner, plattformer med rekkverk, lanterner på en rå; flere høye piskantenner (3–4) (bilde 1, 2, 3).
- **Bak styrehuset på babord:** oransje MOB-båt i vugge med davit, blå presenning over noe ved siden av (bilde 2, 3).
- **Hvite kjegle-/traktformer** ved styrehuset (bilde 1): nottrakt (SUL-DEK-04, Jonas' tolkning).
- **Hvite trommer med flenser** (bilde 1: to–fire spoler på tvers ved styrehusets bakkant): tauspoler for snurrevad (SNV-01), T.
- Redningsflåter i holdere og livbøyer på rekkverket (bilde 1: røde ringer).

### 4.5 Akterskipet (28–38 m)

- **Aktre kran / blokkbom** på styrbord akter: høy hvit søyle med bom, kraftblokka hengende fra spissen (rund skive med
  lettelseshull, SUL-DEK-01–03; bilde 2 og 3 viser den samme rundskiven fra babord).
- **Tårn akter på babord** med blå kappe og logoring (bilde 2, 3): skorstein/eksoskasse (T).
- **Lukket akterdekk** med høy skanse (notbinge, SUL-DEK-12), hvitt lavt dekkshus akter (bilde 3).
- Vinsjer, snurpeblokker, nettrommel: ikke sett (A).

### 4.6 Under vann

Ikke sett i noen av bildene. Antas (A): én propell i dyse eller åpen CPP, ror bak, bulb, slingrekjøl, baug- og akterthruster
(merkene viser begge), anoder, sonar senket under forskipet (ringnot har sonar). Må kontrolleres (kap. 8).

## 5. Kravlista mot planlisten

Hvert punkt i planlisten som gjelder båten, med hva Sulebas har og hva modellen skal ha. «Info» viser om grunnlaget er klart (✓),
delvis (½) eller mangler (✗). Punkter som ikke gjelder en ringnot-/snurrevadbåt er utelatt (trål, line, garn, teine, fabrikk).

### SKR Skrog
| ID | Modellen skal ha | Info |
|---|---|---|
| SKR-01 | 38,55 × 9,50 m (B1), dybde og dypgang fra register | ✓ (byggerapporten; dypgangen 3,85 lest av bildene) |
| SKR-02 | Spring opp mot bakken, rett dekkslinje akter | ✓ |
| SKR-03 | Rett, svakt foroverlent stevn med flare | ✓ |
| SKR-04 | Bulb i vannflaten | ✓ (slippbildene 226293a9, 9d43d29b) |
| SKR-05 | Høy hekk med store hjørneradier, speil | ✓ (274df4a7: nedsenket speil, flat bunn, knekk) |
| SKR-06 | Rundspant, myk kimming | ✓ |
| SKR-07 | Kjøl, slingrekjøl | ✓ (kjølplate, slingrekjøler) |
| SKR-08 | Skeg og propellåpning | ✓ |
| SKR-09 | Plateskjøter i felt på 2–3 m, lang skjøt midt i det blå (SUL-SKR-05) | ✓ |
| SKR-10 | Hvit skanse med avrundet topp, brutt midtskips (SUL-SKR-07, -13) | ✓ |
| SKR-11 | Lenseporter øverst i det blå | ✓ |
| SKR-12 | Rad med firkantede overbordsutløp og runde utløp (SUL-SKR-15, -16) | ✓ |
| SKR-13 | Sjøkister | ✓ (riller midtskips) |
| SKR-14 | Baug- og akterthrustertunnel | ✓ (riste på kurven, 6,2 og 34,0 m) |
| SKR-15 | Sonar og senkekjøl | ✓ (to sonartrunker) |
| SKR-16 | Slitelister og blått rørrekkverk midtskips (SUL-SKR-14) | ✓ |
| SKR-17 | Isforsterkning | ✗ |
| SKR-18 | Stål | ✓ |
| SKR-19 | Anoder | ✓ (ror, skeg, side, bunnkant) |
| SKR-20 | Ankerlomme, porter | ✓ |
| SKR-21 | Innfelte leidertrinn i siden og hekken | ✓ |
| SKR-22 | Ventilasjonsrister | ✓ (lameller i ekte hull) |

### DKS Dekk
| ID | Modellen skal ha | Info |
|---|---|---|
| DKS-01 | Bakk, åpent arbeidsdekk midtskips, lukket akterdekk/notbinge | ✓ |
| DKS-02 | Dekksbelegg (grått, slitt beige i bingen) | ½ |
| DKS-03 | Luker til RSW-tankene | ✗ (ikke sett ovenfra tett nok) |
| DKS-04 | Lufte- og peilerør langs skansen | ½ |
| DKS-05 | Ventilasjon på overbygget | ½ |
| DKS-06 | Rør og kabelbaner | ½ |
| DKS-07 | Dører (overbygg, styrehus) | ✓ (styrehus babord, hus begge sider, kasse, bakke, sidedør) |
| DKS-08 | Trapper og leidere (bakken, masta, styrehuset) | ✓ |
| DKS-09 | Brannutstyr | ✗ (A, standardplasser) |
| DKS-10 | Drenering | ½ |
| DKS-11 | Le-tak og skjermer | ½ |
| DKS-12 | Løst dekksutstyr (presenninger, kasser) | ✓ |
| DKS-13 | Gassflasker | ✗ (A) |
| DKS-14 | Landgang | ✗ (A) |

### OVB Overbygg
| ID | Modellen skal ha | Info |
|---|---|---|
| OVB-01 | Dekkshus med styrehus over, midtskips–forut | ✓ |
| OVB-02 | Kantet, moderne formspråk med skråstilte vinduer | ✓ |
| OVB-03 | 10–12 skråstilte ruter rundt fronten, sorte karmer | ✓ |
| OVB-04 | Klarsiktsruter og vindusviskere | ½ (ikke sett tydelig) |
| OVB-05 | Takoverheng med blå kant | ✓ |
| OVB-06 | Brovinger | ½ |
| OVB-07 | Akterstyreplass mot arbeidsdekket | ✗ |
| OVB-08 | Vinduer i dekkshus og akter | ✓ |
| OVB-09 | Skorstein/eksostårn akter babord | ✓ (trapes, to rør) |
| OVB-10 | Utstyr på skott (lys, høyttalere, skap) | ½ |
| OVB-11 | Styrehustak med mastetårnene | ✓ |
| OVB-12 | Konsoll og stoler synlige gjennom glasset | ½ (A) |
| OVB-13 | Takflater sett ovenfra | ½ (bilde 3) |
| OVB-14 | Skylight | ✗ |
| OVB-15 | Flybru | – (finnes ikke) |
| OVB-16 | Navnefelt på styrehuset (spillerens navn) | ✓ |

### MST Master og elektronikk
| ID | Modellen skal ha | Info |
|---|---|---|
| MST-01 | To trappede mastetårn på styrehustaket med blå bånd | ✓ |
| MST-02 | Formast: konisk rørmast med to plattformer | ✓ |
| MST-03 | Åpne radarantenner (to) | ✓ (4,4 og 1,6 m) |
| MST-04 | To radomer, rundt 1,2 m | ✓ |
| MST-05 | 3–4 høye piskantenner | ✓ |
| MST-06 | Småantenner (GPS, AIS) | ½ |
| MST-07 | Sensorer (vindmåler) | ½ |
| MST-08 | Tyfon | ✓ (formastas akterkant) |
| MST-09 | Signalfigurer | – (spillet tegner) |
| MST-10 | Flagg (flaggstang akter) | ½ |
| MST-11 | Skjult elektronikk | – |
| MST-12 | Vant og barduner | ½ |
| MST-13 | Flaggline | ½ |

### FOR Fortøyning og forskip
| ID | Modellen skal ha | Info |
|---|---|---|
| FOR-01 | Ankervinsj på bakken | ✓ (under presenning, 82e91969) |
| FOR-02 | Ankerlomme med anker (spillets anker) | ✓ |
| FOR-03 | Fortøyningsvinsjer | ✓ (to varpevinsjer på arbeidsdekket, to varpehoder på bakken) |
| FOR-04 | Klyss (3–4 panama forut, SUL-SKR-08) og pullerter | ✓ |
| FOR-05 | Fendere | ½ |
| FOR-06 | Bakk | ✓ |
| FOR-07 | Stevnbeslag | ½ |

### FRM Fremdrift
| ID | Modellen skal ha | Info |
|---|---|---|
| FRM-01 | Propell (CPP antatt) | ✓ (CPP, fire blad, 2,80 m) |
| FRM-02 | Dyse | ✓ (ingen dyse: propell i brønn, 9d43d29b) |
| FRM-03 | Ror | ✓ (profilror med endeplate) |
| FRM-04 | Aksel og tauvern | ✓ |
| FRM-05 | Baug- og akterthruster | ✓ |
| FRM-06 | Eksos (tårnet akter) og kjølevannsutløp | ½ |
| FRM-07 | Rødt bunnstoff, hvit vannlinjestripe | ✓ |

### LYS Lys
| ID | Modellen skal ha | Info |
|---|---|---|
| LYS-01–06 | Etter kap. 6 | ✓ (regelen), ½ (plassene) |
| LYS-07 | Arbeidslys på master, kraner, overbygg | ½ |
| LYS-08 | Lyskastere (formasta, styrehustaket) | ✓ |
| LYS-09 | Innvendig lys bak vinduene om natta | ½ |
| LYS-10 | Lysstillinger: havn, gange, fiske, ankret | ✓ |
| LYS-11 | Pyntelys | – |

### SIK Sikkerhet
| ID | Modellen skal ha | Info |
|---|---|---|
| SIK-01 | Redningsflåter i holdere (`kit.raft`) | ✓ (to på dekk B babord akter) |
| SIK-02 | Oransje MOB-båt i vugge med davit, babord bak styrehuset | ✓ |
| SIK-03 | Livbøyer med lys (`kit.buoys`) | ✓ |
| SIK-04 | Nødpeilesender | ½ |
| SIK-05 | Rekkverk overalt der det er fall | ✓ |
| SIK-06 | Skilting | ½ |
| SIK-07 | Livliner | ✗ |
| SIK-08 | Kister for redningsutstyr | ✓ (den røde kisten på balkongen) |

### FSK Fangsthåndtering
| ID | Modellen skal ha | Info |
|---|---|---|
| FSK-01 | Fiskepumpe på dekk midtskips | ✓ |
| FSK-02 | Grønn sugeslange (0,35 m), utenbords langs styrbord | ✓ |
| FSK-03 | Avvanner og renner | ✗ |
| FSK-04 | Fangstmottak | ✗ |
| FSK-05 | Bløgge- og sløyeplass (snurrevad) | ✗ |
| FSK-06 | Kar og kasser (gul kasse) | ½ |
| FSK-07 | Tankluker (RSW) | ✗ |

### KRN Kraner og løfteutstyr
| ID | Modellen skal ha | Info |
|---|---|---|
| KRN-01 | To kranfundament: midtskips styrbord ved bakken, akter styrbord | ✓ |
| KRN-02 | Bommer og sylindre (knekkbom midtskips, blokkbom akter) | ✓ |
| KRN-03 | Blå hydraulikkslanger i bue | ✓ |
| KRN-04 | Kranspiss med skive og krok | ✓ |
| KRN-05 | Bomstøtte for midtkranen | ½ |
| KRN-06 | Galge/portal ved pumpa (SUL-DEK-10) | ½ |
| KRN-07 | Hjelpevinsjer | ✗ |
| KRN-08 | Blokker og wire | ½ |
| KRN-09 | Lastebom | – |

### IDN Identitet
| ID | Modellen skal ha | Info |
|---|---|---|
| IDN-01 | Felt for registreringsmerket på den hvite skansen forut, begge sider | ✓ |
| IDN-02 | Felt for navn og hjemhavn akter (to steder) og på styrehuset | ✓ |
| IDN-03 | Skilt for kallesignalet på taket, begge sider | ✓ |
| IDN-04 | IMO-nummer (Sulebas har ett, 499 BT): utelates eller blir spillerens eget | ½ (avgjøres med B1) |
| IDN-05 | Nøytral logo i hvit ring og fem fartsstriper forut | ✓ |
| IDN-06 | Dypgangsmerker | ½ (ikke lest i bildene) |
| IDN-07 | Fribordsmerke | ½ |
| IDN-08 | Thrustermerker ⊕ forut og akter, V-merker | ✓ |
| IDN-09 | Produsentmerker | – (ikke i spillet) |
| IDN-10 | Dekaler som eget lag | ✓ |
| IDN-11 | Stor skroggrafikk | – |

### MAT Materialer (krever F2)
| ID | Modellen skal ha | Info |
|---|---|---|
| MAT-01, -02 | Fargene i B2, skarpe grenser ved stripa og skansen | ✓ |
| MAT-03 | Marinemaling med glans | ✓ (F2) |
| MAT-04 | Grått antisklidekk, slitt beige i bingen | ½ |
| MAT-05 | Galvanisert og rustfritt stål | ✓ (F2) |
| MAT-06 | Gummi (slange, fendere) | ✓ |
| MAT-07 | Tau og not | ✓ |
| MAT-08 | Glass med speiling | ✓ (F2) |
| MAT-09 | Presenninger (blå) | ✓ |
| MAT-10 | Propellbronse | ✓ |
| MAT-11 | Tre | – |

### SLT Slitasje (krever F2)
Kantslitasje på skansens toppkant og hekken (SUL-SKR-11), rennestriper under lenseporter og utløp, redskapsslitasje i bingen og
ved blokka, groe ved vannlinja, sot ved eksosen. Alt ½: synlig i bildene, men ikke kartlagt flate for flate. SLT-09 (is og snø)
som spillets vær.

### MAN Mål for folk
MAN-01–08 som planlisten: rekkverk 1,0–1,1 m, dører 0,8 × 2,0 m, dekkshøyde 2,3–2,5 m, trinn 0,25–0,3 m. ✓

### MIL Miljø
Spillets eget (vannlinje, skum, kjølvann, måker, havn). ✓

### RNG Ringnot
| ID | Modellen skal ha | Info |
|---|---|---|
| RNG-01 | Kraftblokk som henger fra blokkbommen akter (to hvite skiver med lettelseshull, sort trommel, motor i trådbur) | ✓ |
| RNG-02 | Blokkbom/notkran akter styrbord | ✓ |
| RNG-03 | Notbinge akter | ½ (innsiden ikke sett) |
| RNG-04 | Nothaler/notlegger | ✗ |
| RNG-05 | Sidehaler | ½ (mørk enhet midtskips, T) |
| RNG-06 | Snurpevinsj | ✗ |
| RNG-07 | Snurpeblokker | ✗ |
| RNG-08 | Ringer og ringstokk | ✗ |
| RNG-09 | Korkline (spillet tegner) | ✓ |
| RNG-10 | Notbøye | ½ |
| RNG-11 | Notgjerde | ½ |
| RNG-12 | Pumping: pumpe, slange, trakt, svivel | ✓ |
| RNG-13 | Sonar | ✗ (A) |
| RNG-14 | RSW-tanker (luker) | ✗ |
| RNG-15 | Nottrakt (hvitt buet rør med trakt) | ✓ (T: Jonas' tolkning) |

### SNV Snurrevad (båten er flerbruk)
| ID | Modellen skal ha | Info |
|---|---|---|
| SNV-01 | Tauspoler (hvite trommer med flenser ved styrehuset) | ½ (T) |
| SNV-02 | Snurrevadvinsj | ✗ |
| SNV-03 | Nettrommel | ✗ (kanskje den mørke enheten) |
| SNV-04 | Hekkrull eller sidegalge | ✗ |
| SNV-05 | Tau (spillet) | ✓ |
| SNV-06 | Bøye | ½ |
| SNV-07 | Arbeidsdekk | ½ |

**Oppsummert:** av rundt 170 punkter er omtrent 75 klare (✓), 55 delvis (½) og 40 mangler (✗). Det som mangler mest, er under
vann, akterdekket ovenfra (vinsjer, binge, nothaler) og hekken rett bakfra.

## 6. Lanternene etter sjøveisreglene

FOR-1975-12-01-5, lest på Lovdata 30.10.2026 (sist endret 26.06.2025). For en båt på 38,55 m og 9,50 m bredde:

- **Topplanterne** (regel 23 a): én er påbudt (den andre er frivillig under 50 m). Den skal stå minst 9,5 m over skroget (vedlegg I
  2(a)(i): minst bredden, opptil 12 m). Føres to, skal den akterste stå minst 4,5 m høyere (2(a)(ii)) og helst halve lengden
  bak (3(a)). **Anbefaling:** én topplanterne på formasta, som på bildene.
- **Sidelanterner** (regel 23 a iii) på styrehusets sider eller brovinger, med matte sorte skjermer innvendig (LYS-02).
- **Akterlanterne** (regel 23 a iv) akter.
- **Fiske** (regel 26): rødt over hvitt rundtlys (ringnot, snurrevad, garn), minst 2 m fra hverandre (vedlegg I 2(i), 20 m og
  over), den nederste minst 4 m over sidelanternene (2(j)). Gjelder også om båten tråler (grønt over hvitt).
- **Tilleggssignaler for ringnot** (vedlegg II): to gule lys som blinker vekselvis, i loddrett linje (LYS-05). Må leses på
  Lovdata før de bygges inn (ikke sjekket 30.10.2026).
- **Ankerlys og NUC** (regel 27, 30): ett hvitt rundtlys forut; to røde i loddrett linje, 2 m fra hverandre.

Modellen får typede plasser for hver lanterne (`lights`), og spillet tenner dem (`lanterns()` i `vessel3d.js`).

## 7. Godkjenning av piloten

- Kontrollbilder fra kameraene K1–K7 i planlisten (kap. 30) i Blender, og fra de samme vinklene som Jonas' fire bilder, side om
  side med bildene.
- Skjermbilder fra spillet i begge formater, dag og natt (lanternene), i havn og under fiske.
- Bildetid på Pad 3 i havna med båten som egen båt (`#bench`).
- `vessel3d` med det nye taket, `brotest`, `lanterntest`, `deckshot`.
- Jonas godkjenner nivået før resten av flåten tas.

## 7.1 Kritikksløyfen (30.10.2026)

Arbeidsmåten for piloten, og for båtene etter den: modellen rendres fra de samme vinklene som fotoene (`scratchpad/r38/shape.py`:
`sq` styrbord låring høyt som 1000a4bd, `pq` babord låring som 8cdb9214, `aer` flybildet 82e91969, `slipq` slippen 226293a9,
`sternv` hekken 274df4a7, og det ortografiske overlegget mot sidebildet 42432bd5), bildene sammenlignes med fotoene, feilene
skrives opp, rettes og rendres på nytt. Overlegget mot sidebildet kjøres etter hver runde, så ingenting flytter seg.

Runde 1 (akterskipet og dekksutstyret): notbingens skillevegg, rekkverket på den fremre brønnen, bøyene og tauskivene, rullene på
hekkveggen, leideren på akterspeilet, nottrakta akter for styrehuset, kraftblokka på akterkranen, vakuumtankene og pumpehopperen,
trappene til bakken og kassedekket, ankervinsjen og varpehodene. Funnet og rettet: plattformens dekkprisme lå i plan med kantplata
(svart stripe), bingegulvet for lyst.

Runde 2 (baug og hekk): leideren sto på styrbord, skal på babord; dypgangsmerkene på baug og hekk, thrusterringene over begge
tunnelene, de to V-ene og bulbmerket lagt inn; baugens skala flyttet opp over thrusterrista.

Runde 3 (mot 8cdb9214 og 82e91969): akterkranens søyle som avsmalnende kasse, ankervinsjens presenning lavere og lenger akter,
skansekledningen 0,35 m langs arbeidsdekket under det blå rekkverket.

Runde 4 (mot 4929aa51, 5e85f70b, 47d6785c, 82e91969, nye bilder 30.10.2026): **arbeidsdekket på styrbord ligger bare mellom
husfronten (20,35 m) og bakken (25,8 m)**; akter for huset er styrbord side lukket opp til øvre dekk som babord, med husets vinduer i
den (anslaget 7,3–25,8 m var feil). **Den forreste kranen står på styrbord** (foten ved bakkens akterkant, bommen akterover over
arbeidsdekket og hopperen, jiben foldet ned bak vakuumtankene), ikke babord. Pipa er en trapes (2,9 m ved foten, 1,45 m under den
blå toppen) med **to** bare stålrør med svanehals. Trinnene ned sida på styrbord ligger ved 24,0–24,4 m (mellom lufteåpningene),
ikke ved 8 m. Lagt til: rørrekkverk langs bingeveggens topp, plattform med rekkverk på vakuumtankene, trapp fra arbeidsdekket opp
på kassen ved hopperen, dør og to vinduer i bakkens akterskott på styrbord, den gule kisten på arbeidsdekket.

Runde 5 (mot 95c900de): radarmastas to tårn som platetårn med rette sider og avfasede hjørner, ikke runde.

Runde 6–7: akterkranen målt på sidebildet (bommen til knekken ved 11,4 m, jiben foldet akterover under den), nottrakta,
presenningskassen, ankervinsjens runde presenning, tausnella, den runde luka, varpevinsjene, A-ramma på hekken; fjernversjonen
trimmet under 12 000 punkter.

Runde 8 (Jonas' meldinger 30.10.2026, bildene 7b36cbe5, 3bd16b40, c6db804c, 5f57d449, a5d2b0af): **nottrakta står helt på
styrbord side av styrehuset**, utenfor husveggen på øvre dekk (fot 12,9 m, y −3,95), med munningen akterover i vindushøyde over
plattformens rekkverk (topp 12,9 m). **Kraftblokka henger rett over munningen** (10,3 m, 14,5 m) på svingarmen fra jibens tupp:
nota hales over blokka, faller gjennom trakta og legges i notbingen akterut. Plattformen (dekk B) er skåret ut rundt trakta
(kanten inn til y −3,0 mellom 10,35 og 13,9 m) og ført akterover til 8,3 m som en gangbane på to stolper, med en lavere balkong på
husets tak under. Styrehusets bakside har stolper mellom vinduene som de andre sidene (hver 1,3 m). Vinduene i huset under
styrehuset manglet glass (glasset lå 2 cm inne i veggen); nå ligger det like utenfor.

Runde 9 (Jonas 30.10.2026: «Trakten clipper gjennom styrhuset»): en **klasjsjekk** er lagt inn i sløyfen
(`scratchpad/r38/clipcheck.py`): hvert punkt i dekksutstyret, mastene og akterdekket prøves mot styrehusets plan (mellom dekk B og
takkanten), dekk B's kantplate og huset under; gangbanens rekkverk prøves mot traktas rør. Første kjøring: 147 klasj. Rettet:
trakta flyttet akterover og utover (fot 12,3 m / y −4,55, munning 9,7 m / 13,05 m) så munningen er helt akter for styrehusets
bakvegg og over rekkverket; plattformens rekkverk stopper ved utskjæringens innerhjørne og gangbanens rekkverk går rundt traktas
innside; vakuumtankene flyttet fram under dekk B's utstikk med toppen under kantplata; den forreste kranens knekk flyttet fram
foran dekk B's front og utenfor tankene, jiben under plattformen; MOB-båten og daviten akter for huset og dekk B. Sluttkjøring:
0 klasj. Sjekken kjøres etter hver runde fra nå.

Runde 10 (Jonas 30.10.2026: «arbeidsdekk nesten hele veien bak på styrbord-siden», a5d2b0af, 4929aa51): **arbeidsdekket på
styrbord går fra notbingens vegg (7,3 m) til bakken (25,8 m)**, med lav skansekledning og blått rørrekkverk hele veien; runde 4
tok feil om stykket akter for huset. Huset under styrehuset står på øvre dekk med sin styrbord vegg (y −3,35) som kassens vegg ned
til shelterdekket; akter for huset en kasse under gangbanen med dør (8,8–9,6 m) og vinduene i veggen; forut for huset springer
kassen inn til y −0,6 med en tverrvegg ved 20,35 m. Døra i husets styrbord side er på arbeidsdekkets nivå. Trinnene under sidedøra
akter (7,3–7,7 m) på begge sider. **De tre svarte vakuumtankene er tatt ut** (Jonas: «Hva er disse svarte rørene? Fjern dem»); på
bildene henger tre korte svarte tanker (rundt 1,3 m) under plattformen ved husfronten, ikke fra dekket og opp som mine var.
Hopperen flyttet til y −0,7…−3,5. Klasjsjekk: 0.

Runde 11: en vegg som rendret svart viste seg å være to flater i samme plan (husets kassevegg oppå dekkets); den ene skygget den
andre. Regel fra nå: **aldri to flater i samme plan**; `dbg12.py`-metoden (skjul objekt for objekt, slett flata) finner slike.
Styrbord sidedør akter tatt ut (det er arbeidsdekk der). Kontrollbildene rendres med himmellys 0,45 og eksponering −1,0.

Runde 12 (hekkbildet 274df4a7, flybildet 82e91969, kaibildet 47d6785c): akterspeilet går 0,65 m under bunnstofflinja (rød stripe
på speilet i bildet), med flat bunn og en knekk ut til sida 1,0 m høyere, ikke en rund (`section_body`, x < 2,6); livbøyer på
bakkens akterskott, gangbanens akterkant og dekk B's babordkant; sidedøra akter på babord som et hvitt dørblad med vindu i
nisjen. Fjernversjonen 11 595 punkter, nærversjonen 93 352.

Runde 13 (5e85f70b, 95c900de, fa9cc65c): mastenes plattformer har en hvit kantplate (0,22–0,45 m) over det blå båndet og
rekkverket oppå, ikke bare rekkverk; formasten har stigetrinn opp akterkanten fra dekket til den øvre plattformen, og to
lyskastere i bøyle på forkanten (11,45 m) pluss én under, rettet forover og ned over bakken.

Runde 14 (fa9cc65c, 7b36cbe5, a5d2b0af): **vakuumtankene er lagt inn igjen, slik de er på bildene**: tre korte svarte tanker
(1,35 m, Ø 0,84) som henger under dekk B's utstikk ved husfronten med hvite topper og to samlerør, ikke rør fra dekket som i
runde 1 (de Jonas ba om å fjerne). Fjernversjonen holdt under 12 000 med `_F` 0,45 og grove tanker.

Runde 15 (9d43d29b slippen fra babord, ba02ed9c styrehusfronten, b34e7009 babord under fart, 0b9f58de pressebildet fra
styrbord baug): den forreste kranen synes like godt fra babord, så foten står nær midtskips på bakkens akterkant (y −1,8), ikke ved
styrbord rekke; navnet står på styrehusets front under vinduene (ny navnestripe i `names`, langs frontens fasetter); styrehusets
bakvegg har to store ruter og døra (stolper hver 2,0 m der, 1,3 m ellers). Pressebildet lagt til som kontrollvinkel (`sbowair`).
Pressebildet bekrefter: hele styrbord side er åpent arbeidsdekk med lav skansekledning fra bakken til hekken, kassen og huset
til babord, hopperen med rørene midtskips til styrbord.

Runde 16 (slippbildet fra babord 9d43d29b mot sidebildet 42432bd5): tre skrå streker høyt på baugen (34,0–35,5 m, z 6,75–7,25)
ved siden av klasseringen (ringen modelleres ikke); fire runde utløp i det røde over bulben (31,0–32,5 m, z 3,7); **fire store
vinduer i shelterdekkets babordside** (15,6–25,2 m, z 7,45–8,3) fantes da båten var ny, men er plateslått over: sidebildet viser
bare omrissene, så de er tegnet som hvite paneler flush i sida med en tynn kant. Dypgangsmerkenes rekkefølge på baugen stemmer
med slippbildet (thrusterringen forrest, V-ene akter for den).

Runde 17 (undervannsskroget mot slippbildet 9d43d29b): bunnen er flat med en markert kant der den står på blokkene, propellen
i brønn med roret bak og hekkthrusteren forut for den, bulben med gitteret og firebladet propell, alt som i modellen. Lagt til: en
rad sinkanoder langs bunnkanten hver 2,6 m fra 8,5 til 29,3 m (de små grå rektanglene i bildet) og en endeplate under roret.
Dypgangsskalaen på baugen leser like mot bildet (siffer hver 0,2 m, M ved hele metre, 0,5 m akter for stevnen).

Runde 18 (c6db804c, 7b36cbe5): gangbanen akter for styrehuset finnes på **begge** sider (dekk B ført akterover til 8,3 m, på to
stolper, med rekkverk); på babord står to redningsflåter i holdere (8,95 og 10,0 m) over MOB-båten, og den røde utstyrskisten
på balkongen under. MOB-båtens davit flyttet til båtens akterende (7,5 m) så den ikke går gjennom gangbanen.

Igjen etter runde 18, ikke mulig å måle fra bildene som finnes: alt på tvers av styrbord side (lufteåpningene akter for 16 m, trinnene
ved 8 m, åpningen i baksida), bredden på hus og plattform, dekksutstyrets nøyaktige plasser på arbeidsdekket. Det som krever F2:
plater, sveis, rust, slitasje, glansen i malingen.

## 8. Det som mangler før 100 % klar

1. ~~Mål fra registeret~~ **Løst 30.10.2026** med byggerapporten (kap. 1). Bare dypgangen mangler; den anslås fra bildene.
2. **Bilder som mangler:** hekken rett bakfra; akterdekket ovenfra eller fra styrbord (vinsjer, binge, nothaler, snurpeblokker);
   baugen rett forfra; bakken ovenfra (ankervinsj); styrehusfronten rett forfra. Helst ett bilde i dokk (undervannsskroget). Har
   Jonas generalarrangementet (GA) for SC38, er det bedre enn alle bildene: det låser alle mål på en gang. Tegningen legges ikke i
   repoet, bare målene.
3. **Avgjørelsene B1–B5** (kap. 3).
4. **F1–F3 ferdige** (WebGL 2 og nytt tak, materialene, skyggene), etter grafikkplanen.
5. **Vedlegg II** (tilleggslysene for ringnot) lest på Lovdata.

Når 1–5 er på plass, er grunnlaget klart, og pilotøkta kan starte.

## Endringslogg

- 30.10.2026: kravlista (kap. 5) ajourført etter runde 17: det som er bygd, er merket ✓ med kilden.
- 30.10.2026: kritikksløyfen runde 4: arbeidsdekket bare 20,35–25,8 m, forreste kran til styrbord, pipa med to rør.
- 30.10.2026: kritikksløyfen (kap. 7.1), runde 1 og 2: akterskipet, dekksutstyret, merkene.
- 30.10.2026: styrbords arbeidsdekk (båten er ikke symmetrisk), den forreste kranen snudd, alle åpninger som ekte hull (kap. 4.0).
- 30.10.2026: kap. 4.0, alt målt på sidebilde 3 (spring, stevn, stripe, sida, styrehuset med plattform og skrått tak, hus, åpninger,
  pipe, master, kraner); modellen bygd og lagt over bildet.
- 30.10.2026: byggerapporten (hoveddata, maskineri, dekksutstyr, elektronikk) lagt inn i kap. 1.
- 30.10.2026: første versjon (fakta, avgjørelser, sonene fra fire bilder, kravlista, lanternene, mangler).
