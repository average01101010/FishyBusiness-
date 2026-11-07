# Snøkrabbefartøyet: byggingen (H3d1, 07.11.2026)

Hvordan `tools/boats/krabbe50.py` er bygd, del for del, og hvor spillet bruker den. Grunnlaget (kildene, valgene, avvikslista og
selvvurderingen) står i `snokrabbe-grunnlag.md`; redskapet og fangsten i `docs/systemer/redskap.md` 5.70. Arbeidsmåten er pilotens
(`sulebas-bygging.md`), koden etter `kyst15.py` (`check()` først, `Mesh`, `pchip`, hullene med boolsk kutt) og `al45.py` (luka og kranen
som egne deler for lossingen).

## 1. Nivåene og rammen

| | z (fra skoen) | over vannet |
|---|---|---|
| Vannlinja `WL` | 6,00 | 0 |
| Teinedekket `DK` (hoveddekket akter) | 9,40 | 3,40 |
| Rekka på det åpne teinedekket `GW` | 10,60 | 4,60 (bildene 06.10.2026) |
| Shelterets underside `CEIL` (bjelkene 0,26 dypere, mellom stablene) | 12,00 | 6,00 |
| Shelteret og bakkedekket `SD` | 12,35 | 6,35 |
| Huset (tier A) oppe `TA`, styrhusets dørk `WF` | 15,00 / 15,08 | 9,08 |
| Øyet på broa | 16,73 | 10,73 |
| Forreste topplanterne / aktre | 23,65 / 28,25 | |

Rammen: x forover fra speilets akterflate (0–50), y til babord, z opp. `to_game(p) = (−y, z − WL, −(x − 25))`.

## 2. Skroget (én flate)

- **Linjene:** `LOW` (bunnen på senterlinja med kjøldrag 0,5 m over 26 m, rund forfot, stevnen rak 10°), `HB` (halvbredden ved ripa,
  hjørnene i speilet runde i plan), `DR`, `FL` og `FULL` (bunnreisning, utfall og fyldighet per stasjon). Snittet er én kubisk kurve fra
  kjølrota til ripa (`vline`), skjegget (dødveden) i snittet fra x 4,4 til 20 (`kb`, `keel_t`). 1 762 t ved WL 6,0 mot 1 800 (Cb 0,58).
- **Sheerlinja** (`z_cap`): shelterets lave karm akter (SD + 0,25), feid ned over 1,4 m til teinedekkets rekke, opp igjen over 1,2 m til
  bakkens skansekledning (1,05 m over dekket, stiger til 1,45 ved stevnen). Feiene er glatte, så skroget er én flate.
- **Båndene** (`section`): bunnstoff, oker vannlinje (bisekt ved `Z_AF` og `Z_BT`), antrasitt skrog, to rubbelister (8,05 og 10,30, avsmalnet
  i endene), oker stripe øverst på ripa.
- **Innsida, karmen og dekkene** i samme `Mesh` som utsida: innsida fra teinedekket (eller bakkedekket) opp til karmen, karmen over,
  speilets innside, teinedekket, shelterets topp, underside og forkant, bakkedekket og bakkens akterskott.
- **Hullene** (`cutters`, boolsk kutt, så `linings`): værportene i shelterets sider (to hver side), akteråpningen og teinerennas port i
  speilet, koøyene i bakkens sider, hawse-rørene, lensportene med klaffer på teinedekket, spygattene under shelteret, lasteluka ned i rommet.
- **På platene** (`seams`): sveiste skjøter langs og på tvers, isbeltets kanter (1C) fra midtskips til stevnen, dypgangsmerkene akter,
  midtskips og forut, thrustersymbolet; ingen skjøter der navnet, merket og kjenningssignalet skal stå (`clear_for_text`).
- **Under vann** (`underwater`): skoen, roret (2,1 m korde), CPP-propellen Ø 2,7 m i åpningen (1,04 m til skroget, 39 %), baugthrusteren med
  rist, slingrekjølene, anoder, sjøkister, sonarkum og ekkoloddgivere.

## 3. Arbeidet (kap. 19: plassene først)

Lina kommer over blokka på portalens arm ut over styrbord side og inn til haleren innenfor rekka; teina lander på sorteringsbordet akter
for haleren, tømmes (hullet til fabrikken, renna for det som slippes ut over siden), agnes og går akterover på transportbåndet langs
styrbord side til stablene og ut gjennom teinerennas port i speilet. Stablene står i fem rader (70 plasser, 840 teiner) under shelteret
og på det åpne dekket, med gang langs båndet, i midten og langs babord side. Lasteluka over fryserommet og de to lukene over RSW-tankene
står på det åpne dekket; kranen på søyla ved bakkens skott om babord når luka, kaia og stablene, og bommen ligger i støtta over
stablene til sjøs. Trapper: fra teinedekket opp på shelteret (midtgangen) og opp på bakken (styrbord), fra bakken opp på huset
(langs akterveggen, babord). Ankrene for H3d2 står i `anchors.snok`.

## 4. Overbygget

- **Huset (tier A)** på bakken fra x 30 til 43: sidevinduer, tre i fronten, to akter og døra (hektet åpen), taket som båtdekk med rekke.
- **Styrhuset** fra x 35,6 til 42,85 med fronten lent ut 0,30 m: mørkt vindusbånd hele veien rundt, to ruter i fronten og én i hver fasett,
  tre og vingedøra langs sidene, seks akter mot dekket rundt døra; vinger med skansekledning og egen pult; taket med rekke.
- **Bremmen** (Jonas 07.11.2026: «Jeg hater at du lager helt flate styrhustak»): fra `BRIM0` (0,16 m over vindusbåndet, en kremhvit stripe
  mellom) skrår et bånd i skrogets farge ut `BRIM` 0,42 m og opp til takkanten `RTOP`, 0,57 m ut over frontrutene (`BRIM_F`), i tre bånd
  oppover (en stor flat flate blir mørk i spillet), en kant på 6 cm og taket med bue (`wh_crown`) i et rutenett. Husets tak har et lavere
  bånd (`TBRIM`). Materialet `brim` er i sone 2: sone 1 leser spillet som skroget (`markStrips` fant «ripa» på bremmen). Hjørnene
  (`CI`) er bare de ti hjørnene i `wh_ring`, fordi `offset_any` tåler punkter på linje, `offset_poly` ikke.
- **Styrepulten** tvers under frontrutene: to radarer, plotter, sonar og ekkolodd, maskinpanelet, lite ratt, spaker for stigningen og
  thrusterne, kompass, to stoler; aktre pult mot dekket for draget og kranen; karttavle og benk. Ingen `HELM_KIT` for typen lenger.
- **Mastene:** den forreste på styrhustaket (topplanterna, fiskelysene rødt over hvitt på armen forut, plattformen for den åpne antenna,
  krysset med pisker og GPS, sokkelen for radomen), den aktre på skorsteinen midt på shelteret (den andre topplanterna, plattform, kryss,
  arbeidslys). Sidelysene på vingenes forkant med skjerm innenfor; akterlyset på shelterets akterrekke.

## 5. Delene spillet flytter og plassene det setter utstyr på

- `hatch` (lokket fra hengselen om babord), `crane_head`, `crane_boom`, `crane_block` (fra slewingaksen, bomfoten og øyet), som på
  autolineren (`drawHatch`, `drawShipCrane`).
- `kit`: `pots` (70 stableplasser og tømmeplassen på bordet), `raft` (to, på shelterets akterhjørner), `buoys` (seks, på rekka og husets
  tak), `mob` (på shelteret om styrbord, daviten ved siden), `radarA` og `radar`. `KITADD` og `MOBCUT` for typen er fjernet.

## 6. Eksporten og mellomversjonen

`export_boat(..., mid=lambda: build('mid')[0])`: mellomversjonen (`lodm`, lokalflåten nær og egen båt lenger unna) bygges av skriptet
selv (`MID[0]`), ikke med Decimate av nærmodellen. Decimate trakk skrogets utside og innside (8 cm fra hverandre) sammen, og innsida
stakk gjennom som striper på styrbord baug i spillet. I `MID`: stasjoner hver 1,2 m, færre rader i innsida og dekkene, rekka som to rør,
koøyene og klyssene med ti punkter, ingen vindusrammer, stag, spantene på innsida, ringer, hengsler, broens pult og arbeidslys; under vann
grovversjonen. Tallene 07.11.2026: nær 123 453, midt 36 393 (enhetstesten tillater 120 000 punkter), fjern 3 891, GLB 5 993 KB.

## 7. Kontrollene

`python3.11 tools/boats/krabbe50.py check` regner vekta, målene, fribordet, høyden under shelteret, broa og synsfeltet, lanternene etter
vedlegg I, arbeidsplassene, stablene, kranens rekkevidde, propellklaringen, navnet mot merket, båndet i `vessel3d` og vannlinjenes
jevnhet. Kontrollbildene: `qa/shots.py tools/boats/krabbe50.py kr50...` (K1–K7 og nærbildene i `CLOSE`). I spillet: `tests/h3dshot.py`.
