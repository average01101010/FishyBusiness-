# Skiffen: byggegrunnlaget for revisjonen (F5)

> Grunnlaget for revisjonen av `skiff` («Aluminiumsbåt 19 fot (5,9 m), 60 hk påhengs»), skriptet `tools/boats/skiff59.py`, etter
> malen i `sulebas-pilot-grunnlag.md` og arbeidsmåten i `sulebas-bygging.md` (kap. 7 og 11). Bestilt av Jonas 31.10.2026: «Løft den
> til samme nivå og arbeidsmåte som pilotbåten», «Mål: En mye mer detaljert modell enn vi har i dag», «Jeg har dessverre ikke
> tegninger eller noe sånt for hånd», og «lag gjerne modeller av utstyr som kan brukes felles på andre båter».
>
> Kildekoder: **R** skriftlig kilde, **G** målt av det gamle skriptet på generalarrangementet (tegningen ligger ikke i repoet),
> **J** Jonas' ord, **A** antatt (vanlig for typen, vårt valg), **M** målt på modellen.

## 1. Fakta om båten

| Hva | Verdi | Kilde | Følger for modellen |
|---|---|---|---|
| Type | Åpen platebåt i aluminium med midtkonsoll, kastedekk forut, benk akter med motorbrønn, påhengsmotor i et hakk i speilet, plattformer (pods) på hver side av motoren | R (`VESSELS.skiff.desc`), G | Låst |
| Lengde | 5,90 m (skroget 5,80 fra podenes akterkant til stevnen, 6,1 m o.a. med baugrulle) | R, G | `vessel3d`: −6 % til +3 % i båndet −0,3–1,5 m |
| Bredde | 2,45 m (skroget 2,42 m ved ripa, rundt 2,51 over fenderlista) | R, G | ±5 % |
| Dybde | 1,17 m (G); ripa 1,06–1,15 m over kjølen | G | Tabellene `SHEER`, `KEEL` |
| Dypgang | 0,30 m skroget (G); 0,6 m med motorbeinet (R, `VESSELS.draft`) | G, R | Vannlinja z = 0,30 |
| Deplasement | 1,0 t (`VESSELS`) | R | Se kap. 7: skroget gir 1,60 t ved tegningens vannlinje |
| Bunnreisning | 10,5° ved speilet, reversert kimming (sprutlist) | G | Snittene |
| Byggeår | 2008 | R | Lett slitt: aluminium, malt utenpå |
| Motor | 60 hk firetakts påhengsmotor, bensin, 25" stamme | R | Egen del `outboard` og `prop` (de svinger og går rundt i spillet) |
| Farger | Hvitt skrog, marineblå vannlinjestripe, grå bunn (Jonas' valg) | J | Sone 1 skrog, sone 2 stripe |

Tegningen det gamle skriptet ble målt etter (en GA av en australsk 5,9 m platebåt), ligger ikke i repoet; tabellene i skriptet er det
som er igjen av den. **Ingen mål er målt på et bilde i denne økta.**

## 2. Reglene som gjelder modellen

- Ingen ekte navn, merke eller logo (CLAUDE.md). Det gamle skriptet skrev produsentens navn i GLB-ens `name`; det tas bort.
- Bare utsiden; på en åpen båt er cockpiten utside.
- Ingen kjøpbart utstyr modellert inn: livbøya, karet, garna, stampene, lasten, haleren, juksamaskinene og ankeret settes av spillet
  på plassene i `kit`, `skiff` og `bower`. Skjermene i konsollen er en del av båten.
- Lanternene på lovlige plasser (kap. 6).
- Det spillet er avhengig av beholdes: typenavnet `skiff`, sone 1 og 2, delene `outboard`, `prop`, `cap`, `glass`, og alle ankrene
  (`eye`, `skipperAt`, `crewSpots`, `hauler`, `filler`, `pole`, `lights`, `deck`, `gw`, `stern`, `bow`, `side`, `beam`, `pl`, `rl`,
  `open`, `hand`, `skiff` med `wheel`, `wheelTilt`, `lever`, `motor`, `prop`, `tub`, `fisher`, `reel`, `haul`, `mach`, `stack`, `charm`,
  `skipper`, `seat`, `filler`, `names`, `work`, `kit`, `bower`).

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Ombygging eller nytt skript? | **Nytt skript etter `ringnot38.py`/`snekke23.py`**, med rammen, tabellene, delene og ankrene fra det gamle. Skroget i dag er løse stykker (to sider, tre speilflater, to podkasser) som ikke kan bli én flate uten å skrives om. |
| B2 | Skala uten bilder | Tabellene (målt på GA-en av det gamle skriptet) er målestokken. Overlegget legges mot en linjetegning tegnet fra tabellene; `check()` sjekker mot `VESSELS` og lovens lanternekrav. Det er ikke et foto. |
| B3 | Dekket | Tårnplate (aluminium med mønster) på dørken, kastedekket og podene, slik platebåter ofte har; luker som ekte hull med renne og lokk. |
| B4 | Felles beslag | Nye beslag som andre båter kan bruke, legges i `fittings.py`: pullert, sidelanterne og rundtlys med skjerm, stangholder, luke, baugrulle, påhengsmotor. |
| B5 | Motorbrønnen | Brønnen får et eget gulv under hakket, så motorbrakettene og skruene synes som på en ekte båt. |

## 4. Gjennomgang før endring: avvikslista (31.10.2026)

Dagens modell rendret fra 15 vinkler (`scratchpad/sk/shots.py`): 11 190 trekanter nær, 990 fjern, ingen `lodm`. Spillet i begge
formater (`tests/skiffshot.py`, `TAG=for`). Kravlista B1–B22 (`docs/batplan.md` del 10), planlisten og M-punktene
(`kartlegging-spillet.md` kap. 6) gjennomgått.

| # | Avvik | Hvor | Alvor | Tiltak |
|---|---|---|---|---|
| A0 | **Spillet viser ikke Blender-modellen for egen skiff.** `glbHas('skiff')` spørres før modellfilene er lastet (`bootData`), og svaret «nei» huskes (`GLBHAS`), så `buildSkiff` bruker den gamle parametriske JS-modellen (baugrekke, rekker, levende skjermer). Blender-modellen synes bare i båtmarkedet og som NPC | `vessel3d.js` `glbHas`, `12-skiff.js` | H | Spørsmål til Jonas (kap. 8) |
| A1 | **Skroget er ikke én flate**: to sider som ikke deler punkter i kjølen, speilet i tre stykker, podene som egne kasser med egne sider; speilets nedre del går inn bak podene (skjulte flater) | `build_hull`, `transom`, `pod` | H | Ett nett: sidene, speilet, podene, ripa, foringen, benken, brønnen og dekkene deler punkter |
| A2 | **Flater i samme plan**: lukene og benkens sømmer er bokser oppå dekket (bunnen i dekkets plan), putene ligger på benken, speiltoppen (`ttop`) ligger i ripas plan, motorplata går gjennom speilet | `inside`, `transom` | H | Lukene som hull med renne og lokk, ingen bunnflater på det som står på dekk, alt som står på noe senkes 2–3 mm ned eller løftes |
| A3 | **Åpninger er ikke hull**: stangholderne er rør som står gjennom ripa, døra på konsollen er en plate som svever foran fronten, lukene er bokser | `fittings`, `console` | M | Stangholdere i ekte hull, lukene i ekte hull, døra med karm |
| A4 | **Den hvite rundtlysende står 0,86 m over sidelanternene**; vedlegg I 2(d) krever minst 1 m (båten går 24 kn, så regel 23 (d)(i) gjelder, ikke unntaket for under 7 m og 7 kn) | `fittings`, `anchors` | H | Lykta høyere (B8) |
| A5 | Sidelanternene er fargede terninger uten hus og uten skjerm (LYS-02) | `fittings` | M | Lyktehus med linse og skjerm |
| A6 | Skroget er helt glatt: ingen kjølskinne, ingen sveis, ingen løftelister, ingen stevnskinne (M3, M12) | – | M | Kjølskinne og stevnskinne, sveis i kimmingen, rundt speilet og podene, en løfteliste per side |
| A7 | Påhengsmotoren er kasser (prismer med harde kanter), propellen tre flate strimler, ingen trim/tilt, ingen anode, ingen vanninntak (M15) | `outboard` | M | Motoren bygd på nytt med runde former, propell fra `F.propeller`, brakettene, trimsylinderen, anode, inntak |
| A8 | Baugrulla er to plater og en sylinder; ingen baugøye (M13) | `fittings` | L | Baugrulle med kinn, rulle og sikringsbolt, baugøye på stevnen |
| A9 | Pullertene er bokser | `fittings` | L | Ekte hornpullert (felles beslag) |
| A10 | **Produsentens navn i GLB-en** (`name`: «Plate Alloy 5.9m Adventurer») (B20) | `main` | M | Nøytralt navn |
| A11 | Ingen slitasje (B16) | – | M | Hjørnefarge: skrubbemerker, grums ved vannlinja, slitt dørk, grått på bart metall |
| A12 | Foringen er en flat vegg fra dørk til ripe, uten sidelommer; dørken og kastedekket er flate | `inside` | M | Sidelommer som ekte åpninger, tårnplate, luke i dørken, dekselplate for tanken |
| A13 | Frontruta er én flat firkant; konsollen har ingen brytere, tenning eller karm | `console` | L | Buet rute med ramme, bryterpanel, tenningsbryter, dør med karm og hengsler |
| A14 | Ingen lensepumpeutløp, ingen lufting for tanken, ingen lenseplugg, ingen anoder på speilet, ingen løfteøyer (SKR-12, SKR-19) | – | L | Legges inn (ekte hull der det er hull) |
| A15 | Trekanter: 11 190 nær, langt under det båter under 12 m får (80 000) | – | – | Mål for revisjonen: 80 000–150 000 |

**Det som er bra og beholdes:** linjene (målt på tegningen), rammen og vannlinja, konsollens plass og ratt- og hendelplassen, setet,
plassene for folk og utstyr, navnestripene, motoren og propellen som egne deler.

### 4.1 Kravlista B1–B22 (før → mål)

| Punkt | Før | Mål | Merknad |
|---|---|---|---|
| B1 målte linjer, kontroll mot tegningen | ½ (målt på GA, overlegget krever tegningen) | ½ | Tegningen er ikke her; `check()` mot `VESSELS` og overlegg mot linjene fra tabellene |
| B2 plater, kjøl, propell | ½ | ✓ | A1, A6, A7 |
| B3 slingrekjøl, fendere, ripkapp, spygatt | ½ (fenderlist) | ✓ | Fenderlist, løftelister, ingen slingrekjøl (IR for en planende båt) |
| B4 overbygg, dører | IR | ½ | Konsollen med dør |
| B5 styreplass | ½ | ✓ | Ratt og hendel tegnes av spillet; konsollen, skjermene, kompasset, bryterne |
| B6 arbeidsdekket | ½ | ✓ | Luker, dørk, sidelommer; karet og haleren settes av spillet |
| B7 master, rigg | IR | IR | Bare lyktestanga |
| B8 lanterner | ½ | ✓ | A4, A5 |
| B9 anker, pullerter | ½ | ✓ | A8, A9; ankeret tegnes av spillet (`bower`) |
| B10 redningsutstyr | IR | IR | Livbøya settes av spillet (`kit.buoys`) |
| B11 eksos, tanker | ✗ | ✓ | Tanklufting, fyllestuss, lensepumpeutløp |
| B12 navnefelt | ✓ | ✓ | `names` følger den nye flaten |
| B13 flaggstang | ✓ | ✓ | Flagget på lyktestanga som før (`pole`) |
| B14 malingssoner | ✓ (1, 2) | ✓ | |
| B15 ankrene | ✓ | ✓ | Alle beholdes |
| B16 slitasje | ✗ | ✓ | A11 |
| B17 LOD | ½ (lod0, lod1) | ✓ | `lodm` lages når lod0 > 40 000 |
| B18–B22 | ✓ | ✓ | |

### 4.2 Planlisten (punktene som gjelder en åpen aluminiumsbåt; de andre er IR)

| ID | Før | Mål | Hvordan |
|---|---|---|---|
| SKR-01 proporsjoner | ✓ | ✓ | Tabellene fra GA-en |
| SKR-02 spring | ✓ | ✓ | `SHEER` |
| SKR-03 stevn | ½ | ✓ | Stevnskinne, baugøye |
| SKR-05 hekk | ½ (løse stykker) | ✓ | Speilet med hakket og podene i samme flate |
| SKR-06 spantform, kimming | ✓ | ✓ | Rett bunnplate, reversert kimming, rette sider |
| SKR-07 kjøl | ✗ | ✓ | Kjølskinne fra speilet til stevntoppen |
| SKR-09 plater og sveis | ✗ | ✓ | Sveis i kimmingen, rundt speilet og podene |
| SKR-12 overbordsutløp | ✗ | ✓ | Lensepumpeutløp og tanklufting i ekte hull |
| SKR-16 slitelister | ½ | ✓ | D-profil i gummi rundt ripa og speilhjørnene |
| SKR-18 aluminium | ½ | ✓ | Malt utenpå, bart metall i tårnplata og beslagene |
| SKR-19 anoder | ✗ | ✓ | To på speilet, trimfinnen og brakettene på motoren |
| DKS-02 dekksbelegg | ✗ | ✓ | Tårnplate på dørken, kastedekket, podene og lokkene |
| DKS-03 luker | ½ (bokser) | ✓ | Ekte hull med renne, lokk med hengsler og ring |
| DKS-08 leider | ✓ | ✓ | Badeleider på babord pod |
| FOR-04 pullerter | ½ | ✓ | Hornpullerter (felles `F.cleat`) |
| FOR-07 baugrulle | ½ (M13) | ✓ | `F.bow_roller` |
| FRM-01 propell | ½ (flate blad) | ✓ | `F.propeller`, tre blad, fast stigning |
| FRM-06 eksos | ✗ | ✓ | Gjennom navet; tomgangsutløp og kontrollstråle |
| FRM-07 bunnstoff, vannlinje | ½ | ✓ | Grensene skåret i flaten, med spring; slim ved vannlinja |
| LYS-02 sidelanterner med skjerm | ✗ | ✓ | `F.side_lantern` |
| SIK-03 livbøye | IR | IR | Spillets (`kit.buoys`) |
| SJK-01 aluminium | ½ | ✓ | |
| SJK-07 lister | ½ | ✓ | |
| SJK-08 dekksutstyr | ½ | ✓ | Puter, sete, lommer; kar og stamper er spillets |
| MAN-07 skala | ✓ | ✓ | `brotest` |
| SLT-02, -04 rennestriper, vekst | ✗ | ✓ | Under lensepumpeutløpet, slim ved vannlinja og på motorbeinet |

### 4.3 M-punktene som gjelder skiffen

M3 og M12 (glatte flater): A6. M13 (baugrulle som klump): A8. M15 (flate propellblad, ingen anoder): A7, A14. D6 (90 hk-motoren
har ingen egen modell): motoren blir et felles beslag med hestekrefter som parameter, så en 90 hk kan lages; å vise den i spillet
er en egen oppgave.

## 5. Målene (tabellene i skriptet)

Rammen: x forover fra podenes akterkant, y til babord, z opp fra kjølen ved speilet; vannlinja z = 0,30; spillets origo x = 3,0.
Speilet x = 0,60, stevnen x = 5,80. Tabellene `KEEL`, `SHEER`, `HBS` (halvbredde ved ripa), `HBC` (halvbredde i kimmingen) og `ZC`
(kimmingens høyde) er uendret fra det gamle skriptet (G). Dørken z = 0,45, kastedekket 0,82 (fra x 4,08), baugdekket ved ripa fra
x 5,35, ripas bredde 0,19, podene z 0,62, hakket z 0,70.

## 6. Lanternene

Sjøveisreglene (FOR-1975-12-01-5) slik de står i `docs/batplan.md` del 11. Båten er 5,9 m men går 24 kn, så regel 23 (d)(ii) for
under 7 m og høyst 7 kn gjelder ikke; regel 23 (d)(i): én hvit rundtlysende og sidelanterner. Vedlegg I 2(d): den rundtlysende
minst 1 m over sidelanternene. Typer i ankrene: `allround`, `port`, `stbd` (`lanterntest`). Den hvite skal stå på samme stang som
flagget (`pole`) og innenfor 1 m av den, så spillet ikke tar den for en mast (`mastTop`, vimpelregelen).

## 6.1 Kritikksløyfen (31.10.2026)

Verktøyene: `shots.py` (19 vinkler, se `skiff-bygging.md` kap. 4; K1, K2, K3, K4, K5 og K7 i planlisten kap. 30.3, K6 om natta med
`night.py`), `clip.py` (klasjsjekken langs normalen i snittet, også skrogets egne dekk), `skiff59.py check` og eksporten. Det finnes
ikke noe foto å legge over (kap. 7).

| Runde | Hva | Funnet | Rettet |
|---|---|---|---|
| 0 | `check()` | Deplasementet 1,60 t ved tegningens vannlinje mot 1,0 t; den hvite 0,86 m over sidelanternene | Lykta løftet til 1,05 m over; dataene ikke endret (kap. 7) |
| 1 | Første rendring (53 007 trekanter) | En kile i skyggen på baugsida; baugrullas kinn med feil omriss; for mye grønt på bunnen | Kinnene etter dekket til stevnen (`x_end`); slimet smalere |
| 2 | Klasjsjekk | 40 punkter: pullertenes føtter 3 mm ned i ripa (meningen) | Sjekken godtar inntil 6 mm i flaten: 0 |
| 3 | Vindskjermen (Jonas: «festet på en realistisk måte») | Ruta svevde 6 cm over konsolltoppen; bøylens bakre bein sto utenfor konsollen | U-skinne skrudd til toppen, gummilist, braketter boltet gjennom ruta, bøylen på sidefester med tre klemmer |
| 4 | Kilen igjen | Kastedekkets lukekolonner (±0,58) ble ikke klemt inn der båten smalner: en strimmel dekk stakk ut gjennom sida forut; klasjsjekken prøvde ikke skrogets egne dekk | Kolonnene klemt inn til foringen; sjekken prøver nå også skrogets dekk: 0 |
| 5 | Konsollen (Jonas: «Er skjermene på konsollen tiltet fremover?») | Skjermene lente toppen mot skipperen og vendte ned (arvet fra det gamle skriptet) | Toppen forover, de vender opp mot ham; ankrene for de levende skjermene med; rattet som felles beslag (`F.helm_wheel`) og egen del `wheel` |
| 6 | Planlisten kap. 29 | Vannlinjestripa gikk vannrett; ingen rennestripe under utløpet | Grensene på skrå plan med spring (15 mm/m); rennestripe under lensepumpeutløpet |
| 7 | Spillet, før og etter | Egen skiff ble tegnet med den gamle JS-modellen (A0); etter rettingen sto øyet på broa foran konsollen (`VGEO.skiff` fra før modellen var hentet) | `glbHas` og `VGEO.skiff` rettet; levende skjermer på modellens konsoll |
| 8 | Sløyebordet og karet (Jonas: «Det går jo ikke», «logisk og realistisk») | Spillets bord sto bak skipperen oppå setet og benken; blødekaret ved skipperens sete | Eget sløyebord over babord ripe ved konsollen (`work.own`), blødekaret på dørken forut for fiskeren på styrbord, fangstkaret babord forut for sløyebordet. Klasjsjekken fant brakettbeinet 5 cm ut fra sida: kortet til fenderlista. 0 |
| 9 | Broa i spillet | Skjermene helt i nedkanten under knappene | Blikket senket fra −0,30 til −0,40 rad (`hp`) |

| 10 | `vessel3d skiff` | Skroget målt 2,60 m bredt mot 2,45 (±5 %): sløyebordet stakk 16 cm forbi ripa | Bordet 6 cm forbi fenderlista (som trebåtens): 2,54 m, grønn |

## 6.1b Testene (31.10.2026)

Grønne: `vessel3d skiff` (174 621 punkter nær, 119 013 middels mot 120 000; 6,02 × 2,54 m), `brotest skiff`, `lanterntest`
(`['allround', 'side', 'side']`), `vesseltest`, `camtest`, `moortest`, `maletest`, og skiffens linje i `regmarktest`. Rød som var rød
før (trebat-grunnlaget kap. 6.3): `regmarktest` for `ringnot38`. Skjermbilder fra spillet i begge formater, før (`TAG=for`, med den gamle
JS-skiffen) og etter (`TAG=etter`): `tests/out/skiff_*`. Nattbildet K6 rendret i Blender (lanternene tent).

## 6.2 Arbeidet om bord (plassene)

Fiskeren står ved styrbord ripe forut for konsollen ved haleren (`skiff.fisher`, `haul`); blødekaret står på dørken rett forut for ham
(`work.tub`), så fisken går fra ripa rett i karet; sløyebordet er båtens eget, tvers over babord ripe ved konsollen (`work.table`,
`own`, `top`), og den som sløyer står på dørken mellom bordet og konsollen; den sløyde fisken går i fangstkaret med is babord forut
for bordet (`kit.tubs`). Avfallet går over ripa. Skipperen står ved rattet med setet bak seg; mannskapet sitter på benken akter.

## 7. Det som ikke kan måles

- **Deplasementet:** skroget gir 1,60 t under tegningens vannlinje (0,30 m) mot 1,0 t i `VESSELS`. Tegningens dypgang er trolig
  lastet (skrog rundt 0,6 t, motor, bensin, to mann, 350 kg fangst og 150 kg is gir rundt 1,5 t). Dataene endres ikke.
- **Alt på tvers og alt inni** (konsollen, benken, lukene, lommene, beslagene) er antatt for typen; bare linjene er målt.

## 8. Spørsmål til Jonas

Se A0: skal egen skiff i spillet vise Blender-modellen (rettingen i `glbHas`), eller skal den gamle JS-skiffen stå?
**Jonas 31.10.2026: «Blender + levende skjermer».** `glbHas` husker bare «ja», og modellen får ankre for skjermene i konsollen
(`skiff.scr`: kartplotteren, målerne og VHF-plassen), så spillet tegner de levende skjermene der (`12-skiff.js`).

## 9. Bilder som ville gjort resultatet bedre

Et bilde rett fra siden av en 5,9 m åpen aluminiumsbåt med midtkonsoll (helst en med kjent lengde, f.eks. en annonse), et rett
akterfra (speilet, hakket, podene og motoren), et ovenfra inn i båten (konsollen, benken, lukene) og nærbilder av konsollen og
motorbrønnen.

## Endringslogg

- 31.10.2026: første versjon, gjennomgangen før endring.
