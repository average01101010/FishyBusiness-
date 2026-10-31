# Byggingen av pilotbåten: slik ble kystnotbåten på 38,55 m laget (30.10.2026)

Dette dokumentet beskriver hele byggingen av pilotbåten `ringnot38` (`tools/boats/ringnot38.py`), fra første bilde til båten
lå i spillet, slik at neste båt kan bygges på samme måte og med de samme kontrollene. Det er skrevet for den som skal bygge en
ny Blender-modell av et fiskefartøy, og for den som skal lage dokumentet for den båten. Målene og avgjørelsene for akkurat
denne båten står i `docs/skipsmodeller/sulebas-pilot-grunnlag.md` (grunnlaget, kap. 4.0 med alle målene, kap. 7.1 med alle
rundene i kritikksløyfen). Kravlista for alle fiskefartøy står i `docs/skipsmodeller/planliste-fiskefartoy.md`, og
rørledningen for Blender-modeller i `docs/systemer/3d-baater-og-animasjon.md` og `/blender`.

Ærlig oppsummering først: båten er bygd etter 20 fotografier og en byggerapport, uten tegning. Formen og plasseringen av alt
som kunne måles på bildene, ligger på fotoene (overlegget i kap. 5 viser det). Resultatet kunne likevel vært bedre med en
høyere grad av nøyaktighet og oppløsning, se kap. 10: alt på tvers av båten er anslått fordi ingen bilder viser henne rett
forfra, rett akterfra eller rett fra styrbord; dekksutstyret er plassert etter skråbilder; og modellen har bare farger per
hjørne, ingen teksturer, så plater, sveis, rust og slitasje mangler (F2 i grafikkplanen). Med generalarrangementet (GA) og
materialer ville den samme arbeidsmåten gitt en modell som er vanskelig å skille fra fotoet.

## 1. Rammene

- **Grafikkplanen** (`docs/planer/grafikk-batmodeller.md`): F0 målte at geometrien ikke er flaskehalsen på nettbrettet
  (OnePlus Pad 3: 50 fps med 224 000 trekanter), så budsjettet er rundt 300 000 trekanter nær for egen båt, 40 000 middels og for
  NPC-båter (F1). F4 er pilotbåten. Materialer (F2) og skygger (F3) kommer etter.
- **Avgjørelsene før bygging** (grunnlaget kap. 3): B1 = C, båten bygges i riktig størrelse og plassen i spillet avgjøres etterpå
  (typen er låst i `VESSELS`); B2 = fargene som forbildet (blått skrog, hvit stripe, rødt bunnstoff; spilleren kan male om).
- **CLAUDE.md-reglene som gjelder:** ingen ekte navn, kallesignal eller logo i modellen (spillet skriver spillerens på
  navnestripene, `names`); bare utsiden; ingen kjøpbart redskap modellert inn; de lovpålagte lanternene på riktige plasser
  (`lights`, kap. 6 i grunnlaget, etter FOR-1975-12-01-5 lest på Lovdata).

## 2. Kildene og hva hver kilde gir

| Kilde | Gir | Gir ikke |
|---|---|---|
| Byggerapporten (fem skjermbilder) | LOA 38,55, Lpp 34,00, B 9,50, dybde 4,30/6,60, GT, tanker, maskin, propell, thrustere, kraner, vinsjer, elektronikk | dypgang, høyder over dekk, plassering av noe |
| Sidebilde rett fra babord under fart (42432bd5, 3392 × 2400) | **alle lengder og høyder** i fast skala (80,47 px/m): spring, stevn, stripe, dekk, styrehus, master, kraner, pipe, åpninger | alt på tvers, styrbord side |
| Slippbildene fra styrbord og babord (226293a9, 9d43d29b) | undervannsskroget: bulb, bunn, propell i brønn, ror, thrusterrist, merker, anoder; de store vinduene da båten var ny | skala (perspektiv) |
| Flybildet (82e91969) | dekket ovenfra: arbeidsdekket på styrbord, kassen på babord, kranene, vinsjene, flåtene, nottrakta | høyder |
| Skråbilder fra låringene og baugen (1000a4bd, 8cdb9214, 274df4a7, 4929aa51, 5e85f70b m.fl.) | det som er bak og under: hekken, pipa, gangbanene, trappene, hull i rekka | mål (bare forhold) |
| Nærbilder (95c900de, 47d6785c, 7b36cbe5, 3bd16b40, c6db804c, 5f57d449, a5d2b0af, e90097a6, 6adcfa72, da0277c0) | form på master, pipe, nottrakt, kraftblokk, plattform, styrehusets bakside, vinduene | |
| Pressebildet (0b9f58de, rendering) | styrbord baug ovenfra, bekrefter arbeidsdekket | |

Regelen som kom ut av dette: **ett bilde rett fra siden i kjent skala er verdt mer enn ti skråbilder.** Alt som ble målt på
sidebildet, stemte på første forsøk; alt som ble anslått fra skråbilder, måtte rettes to til tre ganger (arbeidsdekket, den
forreste kranen, nottrakta, tankene). Neste båt: be om sidebilde fra begge sider, rett forfra, rett akterfra og rett ovenfra
før byggingen begynner, og helst GA-tegningen, som låser alt på én gang.

## 3. Rammen og målingen

- **Modellens ramme:** x forover fra akterspeilets akterflate, y til babord, z opp fra basislinja (kjølens underside).
  Vannlinja z = 3,85 (lest av bildene; byggerapporten gir ikke dypgang). `to_game` snur til spillets ramme (x styrbord, y opp fra
  vannlinja, z akterover, midtskips i origo).
- **Skalaen i sidebildet:** stevntoppen og akterspeilet gir px/m; en kjent høyde (shelterdekket 6,60 m fra byggerapporten) gir
  v-origo. Da leses hvert punkt som (x, z) i meter direkte av bildet. Skriptet `scratchpad/r38/mcrop.py` beskjærer bildet med
  et rutenett i modellmeter; `gcrop.py` det samme i piksler for bilder uten skala.
- **Automatisk lesing der det går:** den blå toppen (shelterdekkets kant) og den hvite stripen ble lest hver 0,5 m etter fargen
  (`lines.txt`): det er slik springen ble funnet (dekkslinja 7,39 m ved hekken, 6,54 m midtskips, 8,13 m ved stevnen). Det eldre
  sidebildet viste den samme buen, så den er ikke linseforvrengning. Vinduene i sida ble funnet som mørke løp langs en linje.
- **Perspektivbilder:** et forsøk på å løse kameraet (`pnp.py`, `camfit.py`) ga 50–100 px feil fordi skjermbildene er
  beskåret og hovedpunktet ukjent. Det ble lagt bort; skråbilder brukes til form og rekkefølge, ikke til mål.

## 4. Byggingen, sone for sone

Rekkefølgen var skrog → undervann → dekk → overbygg → master → dekksutstyr → akterdekk → merker → beslag. Hver sone ble rendret
og sammenlignet før neste.

### 4.1 Skroget: én glatt flate

- Snittene akter for 28 m er superellipser mellom kjøllinja (`LOW`), vannlinjebredden (`HBW`) og dekksbredden (`HBD`) med en
  fyldighetseksponent (`NX`) som gir V akter og kasseform midtskips; over vannlinja en kurve opp til shelterdekket og videre opp
  skansekledningen. Akterspeilet (x < 2,6) har flat bunn og en knekk ut til sida (hekkbildet), ikke en rund.
- Forskipet er grunnsnittet ved 28 m trukket inn mot stevnen med en fyldighet per høyde (`PW`): fin forfot, full baug under utfallet.
- **Bulben er slått sammen med forskipet i én flate:** begge gir en signert halvbredde per høyde, og `smax` (en glatt maksimum med
  fillet `KF` = 0,70 m) gir overgangen. Da vokser bulben ut av forfoten med en myk rand hele veien, og halsen mellom bulb og stevn
  blir en hul kurve. Første versjon var en egen torpedo hengt under baugen; Jonas: «ALT for dårlig». Snittene deles i stykker
  (`pieces`) der flaten krysser senterlinja, så bulbens nese og baugen over blir egne nett som møtes i halsen (`neck`).
- Sida er **usymmetrisk**: `z_bw(x, sg)` gir sidas topp per side; styrbord har lav skansekledning (0,35 m) langs hele
  arbeidsdekket fra notbingen til bakken, babord den høye sida.
- Fargegrensene (bunnstoff, tynn hvit linje, den brede stripen med egen spring) er rader i nettet (`resample` med bånd), så
  kantene er skarpe uten teksturer. Strekene i stripens ender og høyt på baugen er flekker lagt på flaten (`hull_patch`).

### 4.2 Hullene: ekte åpninger, ikke svarte flekker

Jonas: «ikke bare bruk svarte teksturer». Hvert hull (`holes()`: side, x0, x1, z0, z1, hjørneradius, slag, dybde) skjæres ut av
skroget med et prisme langs sidas normal (boolsk DIFFERENCE, EXACT). Løseren legger et lokk over hullet som om skroget var
massivt; lokket bærer utskjærerens eget materiale og slettes etterpå (`apply_cut`). Så bygges lysningen: platekanten (3 cm) og
rommet bak etter slaget: `box` (mørkt rom med bakvegg), `louvre` (lameller), `glass` (karm og glass), `pocket` (ankeret i
lomma), `door` (hvitt dørblad i nisjen), `thru` (gjennom skansekledningen, dekket synes bak). Lensportene i bingeveggen og
klyssene er `thru`. Prismene gjennom skansekledningen skjærer også innsida (`decks`).

### 4.3 Dekkene

Shelterdekket (6,60 m midtskips) er lukket hele veien fram. Øvre dekk (`ZD`, nesten flatt, 8,66 til 8,72 m) ligger over kassen:
bak huset er kassen hele bredden, under og forut for huset bare til babord for `y_c(x)` (husets styrbord vegg, så kassens vegg
ved y −0,6), og arbeidsdekket på styrbord ligger på shelterdekket med blått rørrekkverk på skrogkanten. Bakken (`X_FC` = 26 m)
har akterskott med dør og vinduer. Dekkene har 12 cm bue (`camber`). Rekkene er rørrekker med stolper (`pipe_rail`, `rail`).

### 4.4 Overbygget

Huset på øvre dekk (11,73–20,35 m) med runde hjørner (`rrect`), vinduer og dører. Dekk B (11,05 m) er en plattform rundt hele
styrehuset med kantplate og rekkverk, skåret ut rundt nottrakta på styrbord, og ført akterover som gangbane på to stolper på
begge sider, med en lavere balkong på husets tak under. Styrehuset: glass fra 11,95 til 13,18 m som heller utover på alle sider
(`lean`), bred front i fasetter (`wh_plan`, superellipse), stolper mellom alle vinduer også på baksida, dør på babord, innervegg
med åpning ved vinduene (`lining`), taket med blå kantbånd som skrår 0,6 m opp innover til kompassdekket (`ZR` = 14,02) med
rekkverk, kallesignalskilt og sidelanterner med skjermer på takskråningen.

### 4.5 Master, kraner, utstyr

Formasta med skrå forkant, to plattformer med kantplater og rekkverk, trinn, lyskastere, horn, topplanterne. Radarmasta som to
platetårn (åttekantede, avfaset) med plattform, kuppel på søyle, stigemast med røde lys, kuppel nr. 2 på stang, radarer, pisker
og GPS. Akterkranen med avsmalnende kassefot, bom til knekken, jib foldet akterover, svingarm til kraftblokka over nottraktas
munning. Den forreste kranen med fot nær midtskips på bakkens akterkant og bom svingt ut til sida. Pipa som trapes med to
svanehalsrør. Nottrakta helt på styrbord side av styrehuset med munningen akterover i vindushøyde. Vakuumtankene som korte
tanker hengende under plattformen ved husfronten. Hopper, slangetrommel, varpevinsjer, trapper, ankervinsj på bakkhuset,
notvinsj på bakken, tausnelle, runde luke, livbøyer, redningsflåter, rød kiste, MOB-båt med davit, notbinge med skillevegg,
bøyer, ruller, A-ramme med akterlanterne og leider på hekken.

### 4.6 Undervann og merker

Skeg, boss, aksel, CPP-propell (`F.propeller`), profilror (NACA-tykkelse) med endeplate, anoder (ror, skeg, side, bunnkant),
slingrekjøler, to tunnelthrustere med rist lagt på den buede flaten (`tunnel_on_hull`), sjøkister, sonartrunker. Merkene fra
`fittings.py`: dypgangsskalaer på baug og hekk (`F.draft_scale`), thrusterringer, V-er, bulbmerke.

### 4.7 Felles beslag

Alt som finnes i `tools/boats/fittings.py`, brukes derfra: propell, anoder, merker, nottrakt (`net_funnel`), kraftblokk
(`power_block`), radomer, pisker, GPS, lyskastere, leider, slangetrommel. Første versjon hadde egne varianter av seks av dem;
det ga ujevn kvalitet mellom båtene og ble byttet ut til slutt. Regel for neste båt: slå opp i `fittings.py` før noe bygges.

## 5. Kritikksløyfen

Dette er den viktigste delen å ta med videre. Etter hver endring:

1. **Rendre fra fotovinklene** (`scratchpad/r38/shape.py`, ett navn per vinkel: `sq`, `pq`, `aer`, `slipq`, `sternv`, `sqz`,
   `whaft`, `chute`, `fcrane`, `fmast`, `rmast`, `sbowair`, `pmid`, `ustern`, `fcair`): himmellys 0,45, eksponering −1,0, så
   det hvite ikke brenner ut. Sammenlign med fotoet side om side; skriv ned hvert avvik.
2. **Overlegg mot sidebildet** (`overlay3.py x0 x1 z0 z1 px/m`): ortografisk rendring fra babord i den målte skalaen, lagt over
   fotoet som blanding og som røde omriss (`ov_blend.png`, `ov_edge.png`). Kjøres etter hver runde, i hel lengde og i utsnitt
   (baugen, kranen, styrehuset). Ligger omrisset på fotoet, er målet riktig; ligger det ved siden av, er noe flyttet.
3. **Klasjsjekk** (`clipcheck.py`): hvert punkt i dekksutstyret, mastene og akterdekket prøves mot styrehusets plan, dekk B's
   kantplate og huset under; rekkverkene mot traktas rør. Skal være 0. Første kjøring fant 147 (nottrakta gjennom styrehuset,
   Jonas så det før meg).
4. **Punkttelling og eksport** (`count.py`, `ringnot38.py fast dry export`): nær, middels (`lodm`), fjern, og at eksporten går.
5. **Rendring i rått lys for å finne svarte flater:** en vegg som rendret svart, var to flater i samme plan (husets kassevegg
   oppå dekkets). Metoden som fant den (`dbg9.py`, `dbg12.py`): skjul objekt for objekt, slett flata, rendre igjen. Regel:
   aldri to flater i samme plan; den ene veggen slutter 11 cm under den andre.

Sløyfen gikk 22 runder på denne båten; hver runde står i grunnlaget kap. 7.1 med bildet den gikk mot og hva som ble funnet. De
største feilene som sløyfen fant: bulben som egen kropp, nesten rett dekkslinje (ekte spring), arbeidsdekket bare mellom huset og
bakken (det går hele sida), den forreste kranen på feil side, nottrakta på feil plass to ganger, tankene som rør fra dekket,
tårnene runde i stedet for platetårn, flåtene oppe på gangbanen i stedet for på balkongen.

## 6. Eksport og spillet

- `python3 tools/boats/ringnot38.py fast export` bygger nærmodellen (`BOAT0`, `GLASS0`), baker skygge i hjørnene, lager
  `lodm` med Decimate til 40 000 trekanter (første båt som har den) og fjernmodellen (`build(False)`: grovere snitt, uten
  rekkverk, lameller, stolper), skriver GLB-en med anker-data (`anchors()`: `eye`, `skipperAt`, `crewSpots`, `lights` typet,
  `doors`, `names`, `deck`, `hauler`, `filler`, `bower`), base64 til `src/data/boat-ringnot38.b64` og sidebildet til
  `-side.b64`.
- Malen (`src/index.html`) får `glb-ringnot38` og `pic-ringnot38`; `VESSELS.ringnot38` (låst) i `core/02-species-gear.js`;
  `SPEC3D.ringnot38` (parametrisk reserve) og `HELM_KIT` i `vessel3d.js`; patchnotes; `COVER` i `tests/run.py`.
- Tall: nær 119 302 trekanter (357 906 punkter i spillet), middels 40 000, fjern rundt 13 600 punkter. `vessel3d` måler skroget
  36,67 m i vannlinjebåndet mot 38,55 over alt fordi stevnen heller over bulben; testen tillater nå 6 %.
- Tester: `vessel3d ringnot38`, `brotest ringnot38` (hode under taket, utsyn), `lanterntest`, `vesseltest`, enhetstestene;
  `tests/r38shot.py` tar skjermbilder i spillet i begge formater.

## 7. Det som gikk galt, og regelen det ga

| Feil | Regel |
|---|---|
| Bulb som egen kropp med skarp skjøt | Skroget er én flate; alt som vokser ut av det, slås sammen med `smax` |
| Målte fra skråbilder; måtte rette tre ganger | Mål bare på bilder rett fra siden i kjent skala; skråbilder gir form og rekkefølge |
| Svarte flekker for åpninger | Alle åpninger er ekte hull med lysning og rom |
| Trakta gjennom styrehuset | Klasjsjekk etter hver runde |
| Svart vegg | Aldri to flater i samme plan |
| Egne varianter av beslag som fantes | Slå opp i `fittings.py` først |
| Lokket den boolske løseren la over hullet | Utskjæreren får eget materiale; flatene med det slettes |
| Fjernversjonen vokste over gamle grenser for hver runde | Fjernversjonen bygges med egne tall (`_F`, `nb`/`nu`, uten rekkverk); grensene står i `vessel3d.py` og grafikkplanen, ikke i hodet |
| Tolket det Jonas ba fjernet feil (tankene) | Spør hva fotoet viser før noe fjernes helt; bygg det slik det faktisk er |

## 8. Hva neste båt trenger før byggingen begynner

1. Sidebilde rett fra **begge** sider i høy oppløsning, rett forfra, rett akterfra, rett ovenfra (drone), og slippbilde. Helst
   GA-tegningen (legges ikke i repoet, bare målene).
2. Byggerapport eller registerdata: LOA, Lpp, B, dybde, dypgang, GT, maskin, propell, thrustere, vinsjer, kraner.
3. Grunnlagsdokumentet etter malen i `sulebas-pilot-grunnlag.md`: fakta, regler, avgjørelser B1–B5, sonene, kravlista med
   ✓/½/✗, lanternene, godkjenning, mangler.
4. Skriptet etter `ringnot38.py`: linjene som tabeller i meter med kilden i kommentaren, `holes()` for alle åpninger, felles
   beslag, `build(fine)` med fjernversjon, `anchors()`, `export`.
5. Kritikksløyfen fra første rendring, ikke til slutt.

## 9. Tidsbruk

Hele byggingen tok én lang økt (30.10.2026): grunnlag og måling om formiddagen, skroget og overbygget midt på dagen, 22 runder
i kritikksløyfen om ettermiddagen og kvelden, ferdigstilling og spill-integrasjon til slutt. Omtrent en tredjedel av tida gikk til
å rette det som var anslått fra skråbilder; den tida spares med riktige bilder fra start.

## 10. Det resultatet mangler, og hva som ville gjort det bedre

Resultatet kunne vært bedre med en høyere grad av nøyaktighet og oppløsning i kildene og i modellen:

- **Nøyaktighet på tvers.** Bredden på husene, plattformen, kassen, plasseringen av lufteåpningene akter på styrbord, trinnene
  og åpningen i baksida er anslått fra skråbilder. Et bilde rett forfra, rett akterfra og GA-tegningen ville låst dem.
- **Dekksutstyret.** Plassene på arbeidsdekket, bakken og kompassdekket er lest av flybildet og skråbilder uten skala. Et bilde
  rett ovenfra i kjent skala ville gitt dem på centimeteren.
- **Oppløsning i modellen.** Rekkverk, stolper, lameller og beslag er bygd med få segmenter for å holde budsjettet; med
  budsjettet på 300 000 trekanter kunne skroget hatt tettere snitt ved bulben og hekken, og beslagene rundere.
- **Materialer.** Modellen har bare farger og glans per hjørne. Plateskjøter, sveis, rust, slitasje, matte og blanke felt,
  skitt under utløpene, gulnet hvitmaling: alt dette er det som gjør et foto til et foto, og ingenting av det finnes før F2
  (materialer med UV-er og normalkart) og F3 (skygger) er inne. Da må skroget få UV-er mens det bygges.
- **Det som ikke ble bygd:** vindusviskere og klarsiktsruter, lufterør og kabelbaner, brannutstyr, gassflasker, landgang, flagg,
  vant og barduner, livliner, avvanner og renner, bløggeplass; ringnotens tilleggslys (vedlegg II) er ikke lest på Lovdata.

Med de kildene og de materialene ville den samme arbeidsmåten gitt en modell som er vanskelig å skille fra fotografiet.

## Endringslogg

- 30.10.2026: første versjon, skrevet etter at båten lå i spillet (Jonas: «Skriv et detaljert dokument over hele byggingen»).
