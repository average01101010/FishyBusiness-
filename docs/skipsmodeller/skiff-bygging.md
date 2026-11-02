# Byggingen av skiffen: slik ble aluminiumsbåten revidert (31.10.2026)

Kort byggedokument for revisjonen av `skiff` («Aluminiumsbåt 19 fot (5,9 m), 60 hk påhengs»), skriptet `tools/boats/skiff59.py`,
etter arbeidsmåten i `sulebas-bygging.md` (kap. 7 og 11). Avvikslista, kravlista, lanternene og rundene står i `skiff-grunnlag.md`.

## 1. Kildene

Ingen bilder i denne økta (Jonas 31.10.2026: «Jeg har dessverre ikke tegninger eller noe sånt for hånd»). Linjene er tabellene fra det
gamle skriptet, målt på generalarrangementet til en 5,9 m australsk platebåt (stasjoner hver 700 mm, 93,9 px/m; tegningen ligger ikke i
repoet): lengde 5,9 m, bredde 2,45 m, dybde 1,17 m, dypgang 0,3 m, bunnreisning 10,5° ved speilet. Alt inni (konsollen, benken, lukene,
lommene, beslagene) er antatt for typen. `check()` sjekker modellen mot tabellene, `VESSELS` og lanternereglene; overlegget mot et foto
kunne ikke gjøres.

## 2. Skriptet

Skrevet på nytt etter `ringnot38.py` og `snekke23.py`, med rammen, tabellene, delene og ankrene fra det gamle (spillet bygger på dem).

- **Ett nett** (`Mesh`, punktene delt etter posisjon): begge sidene møtes i kjøllinja; snittene (`section`) har en fast kolonne der
  podenes innside går (`y4`), så podene er bunnen og sida ført akterover forbi speilet; speilet er én plate rundt hakket, med punktene
  til sidene, podene, speiltoppen og brønnen; ripa, baugdekket, foringen, benken, brønnen, dørken og kastedekket henger i samme nett.
  Radene opp sida står på faste høyder ved podene og går over i jevne steg forover (en hard overgang ga en kile i skyggen på baugen).
- **Malingsgrensene** skjæres i flaten (`bisect_plane`) på skrå plan som stiger 15 mm per meter forover (planlisten kap. 29: grensen
  skal følge skrogets linjer), og flatene males etter hvilken side av planet de ligger (`side_mat`).
- **Ekte hull:** `Mesh.quad_hole` lager et rundt hull midt i en celle (en ring av punkter koblet til hjørnene i vifte), `F.hole_lining`
  foringen inni; lukene er celler som står tomme, med renne (`gutter`) og lokk (`F.hatch_lid`) 4 mm under dekket; sidelommene er celler
  som står tomme i foringen, med bunn, tak, bakvegg og ender.
- **Aldri to flater i samme plan:** det som står på noe, har ingen bunn og føttene 2–4 mm ned i flaten (sete, puter, beslag, skinner);
  lokkene ligger under dekket, tårnplatas ruter står med foten 0,4 mm ned.
- **Konsollen:** vindskjermen står i en U-skinne skrudd til konsolltoppen, har gummilist på toppen og bakkantene, en vinkelbrakett
  boltet gjennom ruta ved hver bakkant, og bøylen står på sidefester på konsollveggene med tre klemmer over toppkanten (Jonas:
  «festet på en realistisk måte»). Skjermene heller bakover mot skipperen; det gamle skriptet hadde dem med toppen mot ham (Jonas:
  «Er skjermene på konsollen tiltet fremover?»). Ankrene `skiff.scr` sier hvor spillet tegner de levende skjermene.
- **Felles beslag** (nye i `fittings.py`, Jonas: «lag gjerne modeller av utstyr som kan brukes felles»): `loft`, `sring`, `prism_side`,
  `cleat`, `side_lantern`, `allround_lantern`, `bow_roller`, `hatch_lid`, `tread_plate`, `hole_lining`, `helm_wheel` (rattet, som alle
  båter utenom trebåten skal ha) og `outboard` (påhengsmotoren etter hestekrefter: dekselet med det grå båndet, beinet som profil,
  platen, girhuset med skjegg, inntak og trimfinne, brakettene med skruene i brønnen, tilt-røret, svivelen, trim og tilt,
  styrearmen og slangen; propellen fra `F.propeller`). Fra før: `propeller`, `anode`, `pipe`, `atorus`.
- **Arbeidet om bord** (Jonas: «Sørg for at sløyebenken og karet er plassert på en logisk og realistisk måte»): båten har sitt eget
  sløyebord over babord ripe ved konsollen (`gutting_board`, `work.own`), blødekaret står forut for fiskeren på styrbord, fangstkaret
  babord forut for bordet (grunnlaget kap. 6.2). Spillets bord sto før bak skipperen, oppå setet.
- **Delene:** `cap`, `outboard`, `prop` og `wheel` (rattet i spillets egen ramme for det, så spillet dreier modellens ratt).

## 3. Spillet

To feil i spillet ble funnet fordi før-bildene ble tatt før eksporten (sulebas-bygging kap. 11): egen skiff ble aldri tegnet med
Blender-modellen. `glbHas` husket «nei» når den ble spurt før modellfilene var hentet (`bootData`, siden 29.10.2026), og `VGEO.skiff`
ble bestemt da siden lastet. Rettet i `vessel3d.js` (bare «ja» huskes) og `12-skiff.js` (`VGEO.skiff` settes når modellen tas i bruk).
Jonas valgte at modellen skal brukes, med levende skjermer.

## 4. Kritikksløyfen

Verktøyene i økta sin kladdemappe (`scratchpad/sk/`): `shots.py` (19 vinkler: ortografisk fra begge sider, forfra, akterfra, ovenfra og
under, skrått som K1, K2, K5 og K7 i planlisten, nærbilder av konsollen, vindskjermen, baugen og motoren), `clip.py` (klasjsjekken:
hvert punkt i utstyret, konsollen og skrogets egne dekk mot skrogets innside langs normalen i snittet, mot foringen og dørken; motoren
mot speilet og brønnen), `skiff59.py check` og eksporten. Rundene står i grunnlaget kap. 6.1.

## 5. Tall

| | Før | Etter |
|---|---|---|
| Nær (`lod0`) | 11 190 trekanter | 55 035 |
| Middels (`lodm`) | – | 36 499 (motoren og propellen kommer i tillegg: 3 172) |
| Fjern (`lod1`) | 990 | 2 507 |
| GLB | 404 KB | 4 458 KB |

## 6. Kjøring

    uv venv -p /usr/bin/python3.11 /opt/bpyenv && VIRTUAL_ENV=/opt/bpyenv uv pip install bpy==4.5.4 pillow
    /opt/bpyenv/bin/python tools/boats/skiff59.py check       kontrollene
    /opt/bpyenv/bin/python tools/boats/skiff59.py fast dry    GLB-en bare i tools/boats/out
    /opt/bpyenv/bin/python tools/boats/skiff59.py fast        til src/data
    TAG=etter python3 tests/skiffshot.py                      skjermbilder fra spillet i begge formater (pip install playwright==1.63.0)

## 7. Det som ikke kan måles, og hva som ville gjort det bedre

- Linjene er fra en tegning som ikke ligger her; alt inni er antatt. Bilder som ville hjulpet: rett fra siden av en 5,9 m åpen
  aluminiumsbåt med midtkonsoll og kjent lengde, rett akterfra (speilet, hakket, podene og motoren), ovenfra inn i båten, og nærbilder
  av konsollen og motorbrønnen.
- Deplasementet: 1,60 t ved tegningens vannlinje mot 1,0 t i `VESSELS` (1,0 t gir vannlinja 7 cm lavere). Dataene er ikke endret.
- Materialene (F2): tårnplata er geometri, men platene, sveisen og malingen har bare farge per hjørne.

## Endringslogg

- 31.10.2026: første versjon.
