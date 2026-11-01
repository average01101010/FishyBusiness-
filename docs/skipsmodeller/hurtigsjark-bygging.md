# Byggingen av hurtigsjarken: slik ble 10,99-meteren revidert (01.11.2026)

Kort byggedokument for revisjonen av `hurtigsjark` («Brukt hurtigsjark 10,99 m, 500 hk»), skriptet `tools/boats/hurtig11.py`, etter
arbeidsmåten i `sulebas-bygging.md`. Avvikslista, avgjørelsene, lanternene, rundene og selvvurderingen står i `hurtigsjark-grunnlag.md`.

## 1. Kildene

Med bestillingen fulgte et skjermbilde av spillets båthandel med dagens modell, ikke et kildebilde. Linjene er det første skriptets, lest
13.10.2026 av bildene Jonas viste (de ligger ikke i repoet og hadde ingen målestokk): kjølen og stevnen, slaget, knekken, ripa og
halvbreddene, fargene, vinduene, mastene. De beholdes som de ble lest; bare endene er satt der linjene møter stevnen. Bunnen mellom kjølen
og slaget, skegen, listene, inndelingen av huset og alt inni er antatt. `check()` regner modellen mot `VESSELS`, lanternereglene og
spillets krav (`sulebas-bygging.md` kap. 15).

Bilder som ville låst det som er antatt: et sidebilde med kjent målestokk eller en generalarrangementstegning, forfra og akterfra (snittene),
ovenfra (dekket), inn i styrhuset og arbeidsdekket med haleporten.

## 2. Skriptet

Skrevet på nytt etter `havsjark35.py` (det gamle skroget var to løse rutenett, et eget speil og en egen skeg).

- **Rammen:** x forover fra speilet, y til babord, z opp fra grunnlinja; vannlinja er z 1,0 (som før, spillets ramme uendret).
- **Linjene** (`KEEL`, `CHZ`/`CHY`, `KNZ`/`KNY`, `SHZ`/`SHY`) leses med en monoton kubisk kurve gjennom punktene (`pchip`): rette stykker
  mellom punktene knakk hvert snitt der stigningen skiftet (`fair.py`: 100° tvers over stasjonene ved x 10,0 og 10,5).
- **Snittet** (`section`, fast antall punkter): fra skegens underkant på senterlinja opp skegens side og gjennom en hul rot inn i bunnen;
  V-bunnen med to sprutlister per side (flat underside, stående ytterside, dør ut mot stevnen); slaget med flaten ut; sida, svakt kullet,
  med fartsstripa; den avrundede lista på knekken; skansekledningen med utfall til ripa, til styrbord med hakket for haleporten.
  Bunnstoffet og vannlinjestripa skjæres med `bisect_plane` på plan som stiger 12 mm per meter.
- **Ett nett** (`Mesh`): skegen, bunnen, sidene, lista, skansekledningen, speilet, kappene, innsida, arbeidsdekket med bue, skottet og
  fordekket (som stiger mot stevnens topp fra x 9,7) deler punktene.
- **Ekte hull** (`cutters`, `cut_holes`, `linings`): spygattene under lista med krage, lugarnedgangen i skottet med karm, lasteromsluka med
  karm og lokk av tårnplate, forluka med aluminiumsramme og røkfarget lokk, den våte eksosen i speilet, lensepumpas utløp.
- **Styrhuset** (`wheelhouse`): skall løftet fra ringer og gjort tykt, vinduene og døra skåret som hull med karm og glass, fronten lener
  akterover, viskerne parkert langs rutenes underkant, døra i akterveggen til styrbord med bladet hektet åpent og tre trinn opp. **Skjulet**
  (`shelter`): skjermer på ripa med store åpninger og trinn opp til sidedekkene. **Taket**: ett tynt tak fra 3,80 over arbeidsdekket til
  visiret, gul kant, dryppkant, bue, rekkverk på stolper innenfor kanten.
- **Styreplassen** (`helm`): konsollen til styrbord, dashbordet som skrår opp forover med plotteren, ekkoloddet og motorpanelet vendt mot
  skipperen, kompasset, bryterpanelet, rattet 0,42 m forut for ham, enspaken, VHF-en under taket, stolen bak ham; benken og kartbordet til
  babord. Skipperen står midt bak styrbords frontrute (y −0,46), ikke bak stolpen.
- **Dekket** (`decks`): rekkverk og pulpit, ankerspillet, kjettingrøret, baugrulla på det hevede fordekket, pullerter, klamper, sugelufter,
  håndlister på fronten, stevnbeslaget, haleportens rulle, håndlistene aft, kista i styrbord hekk (kranens fot), den slanke aktermasta med
  flagget, hekklyset på stolpe over speilet, leideren.
- **Riggen** (`rig`): A-rammemasta med bein og gule stag på fotplater, salinger, radarbraketter, fiskelysene på en arm akter for masta, den
  hvite på toppen, arbeidslys, piskeantenner, GPS, hiveblokken.
- **Under vann** (`underwater`): profilror, fire-blads propell Ø 0,72 på aksel ut av skegens akterkant med lager og anode, sinkanoder,
  ekkoloddgiver, sjøvannsinntak.
- **Slitasje** (`wear`): per hjørne, kritt i gelcoaten, gnidd liste, striper under spygattene og lensepumpa, slitt dekk ved haleren og benken.
- **Fjernmodellen** (`build(False)`): få stasjoner, ankerspillet en kloss, lanternene enkle: 3 265 trekanter (spillets flåte teller 9 795
  punkter mot 12 000).

## 3. Kontrollene

`/opt/bpyenv/bin/python tools/boats/hurtig11.py check` (alle grønne): deplasementet, lengden, bredden, dypgangen, fribordet, lanternene
(2(d), 2(g), 2(c), 2(j), vimpelen), propellens klaringer, styrhusets høyde, øyet mot vinduene, dashbordet i synsfeltet, rattets og stolens
avstand, takhøyden over side- og arbeidsdekket, trinnhøyden, kista, luka, haleportens terskel, båndet `vessel3d` måler, jevnheten i
vannlinjene på sidene og i slaget, knekken og ripa i plan. `qa/fair.py` etter hver endring av snittet; `qa/shots.py` for K1–K7 og nærbildene.
`tests/hu11shot.py` tar bildene i spillet (TAG=for før, TAG=etter etter).
