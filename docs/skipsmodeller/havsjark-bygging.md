# Byggingen av havsjarken: slik ble 35-foteren revidert (01.11.2026)

Kort byggedokument for revisjonen av `sjark` («Havsjark 35 fot (10,6 m) med bakk og styrhus»), skriptet `tools/boats/havsjark35.py`, etter
arbeidsmåten i `sulebas-bygging.md`. Avvikslista, lanternene, rundene og selvvurderingen står i `havsjark-grunnlag.md`.

## 1. Kildene

Ingen bilder fulgte med bestillingen. Målene er det første skriptets, målt 02.10.2026 på verftets profil- og generalarrangementstegning
(156,3 og 152 px/m, satt til 10,57 m o.a.; tegningene ligger ikke i repoet). De beholdes som de ble målt: kjølen og forfoten, stevnen, speilets
fall, ripa med den lave midja til styrbord og bakken, fenderlista, halvbreddene ved ripa, styrhuset med vinduene, redskapsrommet, lukene,
halestasjonen, mastene, bommen og seilet. Alt under vann utenom kjølen (bunnreisning, utfall, kimming) og alt inni er antatt. `check()`
regner modellen mot `VESSELS`, lanternereglene og spillets krav (`sulebas-bygging.md` kap. 15); `qa/lines.py` tegner spantrisset.

Bilder som ville låst det som er antatt: rett fra siden på land (bunnen og kjølen), forfra og akterfra (snittene), inn i styrhuset
(konsollen), ovenfra (dekket), og helst selve tegningene i repoet for et overlegg.

## 2. Skriptet

Skrevet på nytt etter `plast31.py` (det gamle skroget var to løse rutenett med speilet som trapp, og ballastkjølen var en egen kropp hengt under).

- **Rammen:** x forover fra skrogets akterkant ved fenderlista, y til babord, z opp fra vannlinja (tegningenes). Stasjonene akter for 1 m
  følger speilets fall (`x_of`).
- **Snittet** (`section`): fra kjølens underkant på senterlinja (`KEEL`, G) opp kjølens side og gjennom en hul kjølrot (kvadratisk Bézier)
  inn i kroppen (`vline`): en kubisk kurve fra senterlinjas bunn langs bunnreisningen, rundt kimmingen og opp langs utfallet til ripa.
  Kontrollpunktene trekkes mot hjørnet med fyldigheten `FULL` per stasjon, så snittet endrer seg jevnt (buen i det første skriptet hoppet
  der bunnreisningen steg mot stevnen, og baugen ble bulkete). Hjørnet holdes under ripa med et mykt minimum, også der bunnlinja og utfallet
  blir parallelle (x 9,87): en rett reserve der knakk baugen loddrett. Kjølen glir over i stevnen den siste 0,8 m (`g` i `section`).
  `check()` måler vannlinjenes jevnhet. Så den svarte vannlinjestripa og bunnstoffet (skåret med `bisect_plane` på plan
  som stiger 12 mm per meter), den røde stripa, fenderlista (avrundet, 5 cm ut, tynnes ut mot stevnen) og ripa. Antallet punkter er fast.
- **Ett nett** (`Mesh`): kjølen, sidene, speilet, kappene, innsida av skansekledningen, aktre dekk med bue, bakkens skott og bakkedekket deler
  punktene. Dekket og speilets innside begynner 7 cm forut for speilets utside (`TT`).
- **Ekte hull** (`cutters`, `cut_holes`, `linings`): koøyene i bakken med glass, ring og vridere; spygattene gjennom skansekledningen, åpne;
  forluka med aluminiumsramme og røykfarget lokk; lasterommet med karm, lukelemmer, liten luke og klamper; utløpene for kjølevann og
  lensepumpe; bakken inne i styrhuset.
- **Styrhuset** (`wheelhouse`): skall løftet fra ringer og gjort tykt (`solidify`), vinduene og døra skåret som hull med karm og glass, fronten
  lener forover med tre ruter og viskere, døra akter til styrbord med karm, blad, vindu, håndtak, hengsler og trinn inn. Taket med mørkerød
  kant, dryppkant og bue.
- **Styreplassen** (`helm`): konsollen til styrbord under frontvinduene, dashbordet som skrår opp forover med plotteren, ekkoloddet og
  motorpanelet vendt mot skipperen, kompasset, bryterpanelet, rattet (`F.helm_wheel`) 0,39 m forut for ham, enspaken (`F.single_lever`),
  VHF-en under taket, stolen (`F.helm_seat`); benken og kokeplata til babord.
- **Riggen** (`rig`): formasta i husets babord akterhjørne gjennom taket med mansjett, den hvite rundtlysende på toppen
  (`F.allround_lantern`), fiskelysene rødt over hvitt på armer forut, brakettene for spillets radarer, antennebommen med pisker, salingen,
  vanten til babord på røstjern abeam masta og til styrbord på et øye på takkanten, forstaget til takets front, lastebommen i svanehals med
  toppløft, blokk, krok og vinsj; aktermasta med bom, gaffel, stag og hekklyset (`F.stern_lantern`). På taket: rekke, eksosen med
  regnhatt, lyskasteren, hornet, kompasset og GPS-en; arbeidslys under takkanten akter.
- **Sidelanternene** (`F.side_lantern`, med skjerm) på husets sider ved frontene.
- **Bakken**: rekkverk på foter rundt baugen, ankerspillet med gypsy og varpkopp, kjettingrøret, baugrulla (`F.bow_roller`), pullerter,
  klamper, sopplufter, smale trinn opp fra aktre dekk inntil huset på begge sider, med håndtak.
- **Aktre dekk**: redskapsrommet (dør i den skrå veggen, lameller akter, tak med kant), halestasjonen i den lave midja med rull mellom
  kinnene, rekkverket rundt hekken, pullerter, klamper, påfyllingen og lufteren, fendere, slangen, tauknippet på bakken, flaggstanga.
- **Stytteseglet** som to egne deler: `sail` (satt, `F.sail` med bue og panel, gaffel og spri) og `sailf` (beslått på bommen under
  surringer, gaffelen senket). Spillet viser det satte til sjøs og det beslåtte i havn (`drawSail`).
- **Under vann**: skoen fra kjølen til rorets hæl, profilroret (`F.foil_rudder`) med stamme og lager, akselen ut av kjølens akterkant
  med stevnrør og anode, propellen (`F.propeller`, Ø 0,68, tre blad), sinkanoder, ekkoloddgiveren og sjøvannsinntaket.
- **Fjernmodellen** (`build(False)`): færre rader, ingen hull, vinduene som mørke plater: 4 283 trekanter, 5 863 punkter.

## 3. Det spillet fikk

- `vessel3d.js` `lanterns`: typede fiskelys (`fishR`, `fishW`) tennes der modellen har dem (før: hvitt på den hvites plass og rødt en
  meter over mastetoppen).
- `vessel3d.js` `deckMap`: et tak over et rom med egen dørk er ikke dekk (`roofOver`); trapper som modellen navngir (`stairs: [{from, to}]`,
  formatet kyst15 alt hadde) blir lenker. Prøvd på alle 15 typer mot bygget før: endrer bare havsjarken, breisjarken (styrhustaket var
  dekk), ringnotbåten (sløyebordet og isen sto på et tak 6,25 m oppe) og autolineren (et tak over et rom, ingen plass flyttet).
- `view3d/20-trawl-seine.js`: `drawSail` for egen båt, verftets visning og andre båter.
- `VESSELS.sjark.desc`: forbildets navn fjernet; GLB-navnet er «Havsjark 35 fot».
- `vessel3d.js` `markStrips`: to lavere høyder under ripa (havsjarken har bare 0,35 m mellom fenderlista og ripa på baugen); `regmarktest`
  er grønn, også for ringnotbåten.
- `tests/unit/vessel3d.test.mjs`: tallsjekkene fra `vessel3d.py` i Node (6 s); `run.mjs` tar `scripts` og `data` fra en testfil.

## 4. Kritikksløyfen

`qa/shots.py` (K1–K7, K6 fra begge sider, nærbildene i `CLOSE`), `qa/sheet.py`, `qa/lines.py`, `qa/clip_havsjark35.py` (ny),
`qa/deckpoints.py`, `qa/fair.py` (ny: knekkene i nettet per stasjon og rad, og vannlinjenes jevnhet, for alle skript) og `qa/deckgrid.py`
(ny: dekkskartet rute for rute). Før- og etter-bildene i spillet: `tests/hs35shot.py` (`TAG=for`/`etter`), med K6 fra babord baug og K7 ovenfra.
