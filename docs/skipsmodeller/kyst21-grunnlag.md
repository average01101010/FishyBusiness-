# Den eldre kystbåten 21 m (`kyst21`): byggegrunnlag

OB13, steg 91 i `docs/planer/koen.md` (Jonas' økt 11.11.2026, grenen `claude/charming-faraday-my9nnq`). Båten er bygd på nytt etter
pilotbåtens arbeidsmåte (`sulebas-bygging.md`), med `kyst15.py` og `malo36.py` som mal for koden. Byggefila er `tools/boats/kyst21.py`.
Funnene som skulle rettes, står i `docs/planer/om-bord.md` 4.10.

## 1. Fakta om båten

| | |
|---|---|
| Spillets data (`VESSELS.kyst21`) | 21 × 7,2 × 3,4 m, `disp` 190 t (den tomme båten, valg 18 A), stål, bygd 1978, 900 hk, `crewMax` 6, rom 90 m³, dekkslast 10 t, kran 2 t, `jukseMax` 8, garn 240, stamper 33, teiner 30 |
| Typen | Eldre norsk kystbåt i stål med bakk, rundgatt, galge om styrbord, åpent arbeidsdekk og hus akter |
| Kildene | Bildene Jonas viste 06.10.2026 («Hindholmen», «Erkna»); de ligger ikke i repoet. Ingen tegning. `docs/okter/2026-11-11-ob13/bilder-av-typen.md` sier hva økta fant og ikke fant på Commons (ingen bilder er sett) |
| Fargene | Jonas lot oss velge («Skroget trenger ikke være grønt»): oksblodrødt skrog, hvit ripestripe, svart bunn, lakkert teakstyrhus på hvitt dekkshus, kremgule master og bom |

Rammen i skriptet: x forover fra rorstammen, y mot babord, z opp fra kjølens underkant akter; vannlinja er z = 3,40. Skroget går fra
x −1,6 (rundgattens spiss) til 19,4 (stevnens topp). Spillets midtskips er x 8,9.

## 2. Reglene som gjelder modellen

- Bare utsiden (CLAUDE.md). Ingen redskap modellert inn: haleren, karene, flåtene, livbøyene, radaren og kranen er spillets og settes
  på ankrene. Skipets egne systemer står: galgen, masta med lastebommen, lastevinsjen på bakken, ankerspillet, halerullen på ripa og setterullen
  i hekken.
- Ingen ekte firmanavn. Forbildenes navn står bare her og i kommentarer.
- Valg 26 (Jonas 09.11.2026): brem på styrhustaket som skrår innover oppover, spygatt uten klaffer. Ingen pyntefendere (10.11.2026).
- Valg 18 A: `disp` er den tomme båten.
- Jonas 11.11.2026, underveis i økta: «jeg tenker modellen burde være sånn 140000 trekanter i nær. Dette burde bli en vakker båt rett og
  slett». Nærmodellen er 141 982 trekanter.

## 3. Avgjørelser

| # | Hva | Valgt | Hvorfor |
|---|---|---|---|
| B1 | Vekta (249 t mot 190) | **Bunnen tegnet på nytt**, ingen `WLE` | Avviket lå i formen: snittene var superellipser med nesten flat bunn. De nye snittene har 8° bunnreis midtskips og en stangkjøl; modellen veier 190,1 t ved tegningens vannlinje, så spillets vannlinje er tegningens |
| B2 | Hekken | Rundgatt som ett med skroget: profilen stiger fra akterstevnen til spissen, i plan rund | Den gamle hekken var en egen flate med en kloss til dødved under |
| B3 | Bakken | Dekket 1,97 m over hoveddekket ved fronten, dør 1,80 m over en terskel på 0,12 m, leider om styrbord | Den gamle lå 1,0 m over dekket med en dør på 0,86 m |
| B4 | Bakkens kledning | Skansen sveiper opp fra ripa til bakkens kledning over 0,9 m akter for fronten; kroppen tegnes alltid til spranget, og kledningen står rett videre opp | Første utkast lot snittet følge toppen, og fenderlista fikk en bølge under sveipet |
| B5 | Huset | Kortet inn og flyttet forover (x 2,40–8,00; før 1,0–7,4): **et akterdekk bak huset** | F20: garnet og lina gikk fra luka gjennom huset til hekken. Nå står garnkarene på akterdekket rett innenfor setterullen |
| B6 | Setteplassen | En rull mellom to kinn på hekkens skansekledning, 0,55 m om styrbord for flaggstanga (`kit.setter`) | Erstatter tabellen `SETTERS.kyst21` i `vessel3d.js` |
| B7 | Sløyebordet | 2,0 m langs styrbord skansekledning akter for blødekaret, med spylerør over | F19: tre som sløyer, sto i hverandre ved et bord på 0,9 m. Røret gjør også at bordplata ikke blir «dekk» i spillets gangkart |
| B8 | Den som iser | Ved lukas styrbord karm (`work.pack`) | «Isingen ved luka» (4.10) |
| B9 | Juksa | Åtte plasser i modellen (`anchors.jigZ`): fire om babord langs arbeidsdekket, fire om styrbord langs sidedekket ved huset, 1,05–1,2 m imellom | F21. Styrbord ripe på arbeidsdekket er opptatt av haleren, karet og bordet. `jukseMax` står på 8 |
| B10 | Kranen | Spillets, på bakkdekket om babord akterkant; hun legger babord til (`quay: -1`) | F22. Modellen kan ikke gjøre kranen eldre (M16): den er spillets felles kran. Hennes egen lastebom med vinsj står på masta |
| B11 | Lanternene | Topplanterna på mastetoppen, fiskelysene på armer under den, sidelanternene på skjermer ved båtdekkets forkant | Vedlegg I for 20 m og over, kap. 5 |
| B12 | Dekkshusets indre | En mørk flate en meter over dekket inne i huset | Spillets gangkart fant et rom med ståhøyde under båtdekket og satte rorplassen der |
| B13 | Garnbingen (runde 2) | Lave bord (0,17 m) på stolper rundt de fire karene spillet setter på akterdekket, ingen åpning: en går over | Under gangkartets 0,25 m og karenes prøve på 0,2 m, så `netTubs` får fire kar som før |
| B14 | Styrhusdørken (runde 2) | 0,30 m over båtdekket, terskel 0,15 og trinn utenfor døra; innvendig 1,97 m til taket | Øyet ser bakkens ripe 2,3° under vannrett (før 0,9°); silhuetten er 0,11 m høyere |
| B15 | Lastebommen (runde 2) | Toppet opp langs mastas akterkant og holdt med et bånd, slik den stues til sjøs | Lagt akterover sto den på skrå over skipperens ruter |
| B16 | Tømmestedet for teinene (runde 2) | `kit.pots.spot` på lukedekselet, x 11,05, y −0,35; stabelen som sto der, er borte, og de tre forut har ti hver | Spillet tipper teina 0,7 m innover fra ringen (`10-gear.js` `tipM`); langs styrbord er det ikke 2,2 m fritt dekk på tvers (bordet, karet, luka), så på dekket sto den tippede teina i karmen. Spillets eget sted sto oppå karet og bordet |

## 4. Gjennomgang før endring: avvikslista

Fra `om-bord.md` 4.10, den gamle byggefila og før-bildene (`tests/ombord.py kyst21`, begge formater, 11.11.2026).

| # | Avvik | Rettet |
|---|---|---|
| A1 | 249 t mot 190 (+31 %) | 190,1 t (B1) |
| A2 | Skroget var rader fra to spant med lapper i endene, kjøl og dødved som klosser | Én flate med kjølen i snittet (`Mesh`, 141 982 trekanter med alt) |
| A3 | Ingen spygatt, ingen klyss som hull, ingen koøyer i skroget | Åtte spygatt per side (åpne, med en stang), klyss, koøyer forut og akter, døra i bakkens front: ekte hull med foring |
| A4 | Bakken 1,0 m over dekket, dør 0,86 m | B3 |
| A5 | Garnet og lina gjennom huset (F20) | B5, B6 |
| A6 | Tre som sløyer i en klump (F19) | B7, B8 |
| A7 | Juksa: tre skulder ved skulder om styrbord, én mellom galgebeina (F21) | B9 |
| A8 | Rørrekkverk oppå skansekledningen rundt hekken (1,8 m til sammen) | Bare skansekledningen (0,95 m) |
| A9 | Fiskelys 1 m fra hverandre, sidelanternene på styrhustaket | Kap. 5 |
| A10 | Glatt stål uten skjøter (M12), ingen slitasje å snakke om | Plateskjøter og støt, skansestøtter, rust fra spygattene, slitt dekk der de står |
| A11 | Ingen slange i modellen (F12) | Spyleslange på kroken på husets front ved bordet, spylerør over bordet |
| A12 | Styrhustaket en plate | Brem (valg 26), buet tak, kompass, lyskaster, radarfot |
| A13 | Kranen moderne (M16) | Ikke rettet: spillets felles kran (B10) |

## 5. Lanternene (FOR-1975-12-01-5 vedlegg I, 20 m og over)

Hentet fra Lovdata 11.11.2026 (`lovdata.no/dokument/SF/forskrift/1975-12-01-5`; siden sier «Sist endret FOR-2025-06-26-1372»). Teksten i
vedlegg I kom til økta som et sammendrag av siden, ikke ordrett, så sitatene under er sammendragets ordlyd. Punktene er regnet i `check()`.

| Punkt | Kravet | Modellen |
|---|---|---|
| 2 (a)(i) | Topplanterna minst 6 m over skroget, og minst bredden når den er over 6 m (høyst 12 m) | 9,24 m over hoveddekket ved masta (bredden 7,2 m) |
| 2 (f)(i) | Topplanterna «klar av og over alle andre lys» | 0,70 m over det røde fiskelyset |
| 2 (g) | Sidelanternene høyst tre firedeler av topplanternas høyde over skroget | 2,59 m mot høyst 6,93 m |
| 2 (i)(i) | Lys over hverandre minst 2 m fra hverandre fra 20 m; det nederste minst 4 m over skroget | 2,08 m; 6,46 m |
| 2 (j) | Det nederste fiskelyset minst to ganger avstanden over sidelanternene | 4,18 m mot 4,16 m |
| 3 (b) | Sidelanternene ikke forut for topplanterna, ved eller nær siden | 6,9 m akter for den, på båtdekkets kant |
| 3 (d) | Én topplanterne skal stå forut for midtskips | 5,25 m forut for midten |

Masta er derfor 9,3 m over hoveddekket. Hekklanterna står ved rekka akter på flaggstangas fot. Ikke sett om natta i spillet ennå
(`lanterntest` er grønn: typene og avstandene).

## 6. Arbeidsflyten og plassene (lagt inn før veggene, kap. 19)

Modellens x fra rorstammen, y babord +. Alle er regnet i `check()` mot spillets egne bokser (`deckcrew.js` `kitBoxes`, 6 cm rundt hver).

| Plass | Hvor | Regnet mot |
|---|---|---|
| Arbeidsdekket | x 8,00–14,60, 6,8 m bredt innenfor skansekledningen (0,95 m høy) | – |
| Haleren (`anchors.hauler`) | styrbord ripe x 12,00, under galgens akterste bein; halerull på ripa | ripa 0,35–1,3 m over dekket |
| Halerens fot (`anchors.haulerFoot`) | 0,20 m innenfor skansekledningens innside | spillets egen plass ville stått i skansekledningen |
| Galgen | bein ved x 12,55 og 13,45, bjelken ut over ripa, blokk og ruller | den som haler, står ved x 11,8 og 12,55 |
| Blødekaret (`work.tub`) | ved skansekledningen x 10,40–11,60 | 0,14 m akter for halerens fot; den som bløgger, innenfor |
| Sløyebordet (`work.table`, hennes eget) | x 8,30–10,30 langs skansekledningen | tre med 0,7 m imellom; 1,16 m gang til luka |
| Den som iser (`work.pack`) | ved lukas styrbord karm x 10,2 | 0,49 m fra karmen |
| Luka | x 9,40–11,80, 2,2 m bred, karm 0,6 m | – |
| Stampene (`kit.stamps`) | blokken med åtte om babord for luka, x 9,53–11,67 | 0,92 m gang til luka, 0,55 m til skansekledningen |
| Tømmestedet (`kit.pots.spot`, runde 2) | på lukedekselet, x 11,05, y −0,35 | ringen og den tippede teina på dekselet (minst 0,03 m til kantene), 0,54 m fra stablene, 0,09 fra lasteplassen på luka |
| Garnbingen (runde 2) | x 0,05–1,47, y −2,24 til 2,20, 0,17 m høy | de fire karene spillet setter (`netTubs`), 0,91 m gang forut, setterullen 1,63 m akter |
| Teinestablene (`kit.pots`, `potplaces.json`) | tre på tvers forut for luka (x 13,0; y −0,75, 0,75 og 2,25), ti i hver: 30 (runde 1: 8 + 8 + 7 og 7 på luka) | fri av haleren, karet, bordet, stampene og hverandre |
| Lasteenhetene (`kit.cargo`) | fire mellom huset og luka, én på lukas akterkant | fri av bordet, stampene og stabelen på luka |
| Akterdekket | x −1,6 til 2,40 | – |
| Garnkaret (`kit.garn`) | x 0,75, y −0,55; de neste karene legger spillet ved siden av | 1,57 m dørk til den som setter, 0,99 m gang til huset |
| Setterullen (`kit.setter`) | hekkens skansekledning, y −0,55, 1,13 m over dekket | setterens magasin får plass mellom rullen og karet |
| Juksaplassene (`anchors.jigZ`) | babord x 9,0, 10,2, 11,4, 12,6; styrbord x 2,75, 3,8, 5,0, 6,2 | minst 1,05 m mellom to på samme side, klar av døra |
| Kranens fot (`kit.crane`) | bakkdekket x 15,35, y 2,0 | 5,2 m til lukas midte, 1,6 m til kaikanten |
| Leiderne (`anchors.stairs`) | til bakken om styrbord for masta; til båtdekket på husets aktervegg om babord | begge er over 1,6 m, som gangkartet ikke lenker selv |

Det som er eget valg og ikke hentet fra et bilde: akterdekket med garnkarene (B5), og at juksamaskinene om styrbord står langs
sidedekket ved huset.

## 7. Kritikksløyfen

| Runde | Sett | Rettet |
|---|---|---|
| 1 | `check()`: 129 t med første linjer | Bunnreis 14° → 8°, fyldigere slag, lavere bunn: 186 t, så 190,1 t |
| 2 | Hekken lente 52° utover: dekket var 0,86 m bredt der ripa var 2,08 | Mindre utfall og flatere bunnreis akter, brattere profil øverst |
| 3 | Rendringene: fenderlista bølget under bakkens sveip | B4 |
| 4 | Roret hang som en plate akter for hekken | Rorstammen flyttet inn under hekken, bladet følger skroget |
| 5 | Spillets gangkart: bakken ikke lenket (en pullert sto i leiderens topp), rom under båtdekket, bordplata som dekk, pullerter midt i sidedekket | Pullertene flyttet, B12, spylerøret |
| 6 | Jonas: 140 000 trekanter og en vakker båt | Finere skrog (354 spant), plateskjøter, skansestøtter, plankene i styrhuset og på båtdekket, kappeventiler, lastevinsj, mastetrinn, skipsklokke, brannbøtter, kompass, tregrating, lister, vantskruer |
| 7 | `potshot`: tre teinestabler sto ikke på fritt gulv. Lastevinsjen fra runde 6 sto ved mastefoten midt i dem, vantene gikk gjennom den ytterste, og lastebommen ligger over midten | Vinsjen flyttet opp på bakken bak mastebeina, vantfestene forover til masta, lastebommens feste løftet til 2,15 m over dekket (en bom lavere enn 1,85 m tar gulvet under seg ut av gangkartet), skansestøttene ved stabelen om babord tatt bort |

`qa/flatnorm.py`: tre små flater (0,04 m² hver, 21–22° skjevt) på ripestripa og under vann; ingen på hus og styrhus (`shade(shell, 5)`
etter kuttet).

## 8. Karakteren: 70/100, ikke ferdig

Satt 11.11.2026 som en egen evaluering av en uavhengig underagent som bare fikk rendringene (14 bilder), de seks før- og etter-arkene,
tretten etter-bilder fra spillet, `check()`-utskriften, funnene i 4.10 og Jonas' skala (Jonas 10.11.2026). Målet var 75. Anslaget før
var 48 på den gamle skalaen med åtte punkter, så tallene kan ikke trekkes fra hverandre.

| Punkt | Vekt | Poeng | Begrunnelse (sensorens, forkortet) |
|---|---|---|---|
| Skrogutforming | 20 | 16 | Sammenhengende skrog med jevnt spring, rundgatt, kjøl med hæl, ror, propell, slingrekjøl, plateskjøter og dypgangsmerker; målene stemmer. Formen er troverdig, men ikke bekreftet mot tegning eller bilde. Baugen er nokså butt og flat i platene |
| Detaljer | 20 | 14 | Koøyer, spygatt, pullerter, lufterør, ankerspill, klokke, leidere, brannbøtter og lukekiler synes. Dekket er en flekkete grå flate uten sveis; lastevinsjen er en sylinder med en rød kloss; døra i bakkens front er et svart hull; rust synes knapt |
| Lanterner | 5 | 3 | Høydene og avstandene er regnet mot reglene. I nattbildene fra spillet ved kai synes ingen lanterner, og nattrendringen er for mørk til å vise mer enn tre lys |
| Styrhus | 10 | 7 | Teakstyrhus på hvitt dekkshus med båtdekk, rekke og utstyr på taket ser riktig ut for typen. Fra roret er stolpene tjukke, og bakken, masta og bommen fyller midtfeltet |
| Arbeidsflyt | 25 | 15 | Folk ved haleren i garn- og linetrekket, juksa på begge sider, tre på rekke ved bordet, kranen mot kaia med en mann ved den. Åpent: klump ved galgen i teinetrekket, ingen på dekk ved setting av teiner, ryddingen på akterdekket. Holdt på 60 % fordi F19 ikke kan utelukkes i teinetrekket |
| Utforming av dekk | 20 | 15 | Logisk rekke om styrbord (galge og haler, kar, bord, luke) med tregrating og sidedekk på 1,04 m; garnkar og setterull akter, stamper om babord. Akterdekket er nakent i modellen; fire garnkar er lite mot 240 garn |
| **Sum** | 100 | **70** | |

## 9. Det sensoren så som galt, og hva som er vårt

| Det sensoren så | Hva det er |
|---|---|
| Tre–fire i en klump ved galgen i teinetrekket | Felles kode (`deckcrew.js`: de som sorterer, får plassene `pick` og `pot` ved haleren). Klippesjekken i opptaket var tom, men bildet er for lite til å avgjøre. Modellens del: plassen der teina tømmes (`kit.pots.spot`) er ikke satt, så spillet legger den ved haleren. **Runde 2:** et eget sted for tømmingen akter for karet |
| Ingen på dekk og ingen stabler ved setting av teiner | Felles (F4 for teiner, OB3 «står igjen»). Stablene tegnes når teinene er om bord; opptaket setter dem ut først |
| Lanternene synes ikke i nattbildene | Ved kai er lanternene slukket i spillet (`lanterns`: ingen i havn). Ikke sett under seilas om natta: **runde 2** tar et nattbilde til sjøs |
| Dekket flekkete grått uten sveis | Modellen. **Runde 2:** sveisesømmer i dekksplatene, sklisikre felt, slitasje der de går |
| Utsikten fra roret stengt av bakken, masta og bommen; tjukke stolper | Modellen: bakken er hevet til 1,97 m, og øyet ser 0,9° over rekka forut. **Runde 2:** smalere stolper, bommen lagt til side eller lavere, og vurder høyere styrhusdørk |
| Ryddingen på akterdekket, «ingen slange» | Felles (F12, OB14, steg 92). Slangen finnes på husets front ved bordet, men synes ikke i bildene |
| Lastevinsjen grov, døra i bakken et svart hull, bordet som et stativ | Modellen. **Runde 2** |
| Akterdekket nakent | Modellen: bare setterullen og pullertene. **Runde 2:** en garnbinge av bord, beslag for karene, lys |
| Den moderne røde kranen | Spillets felles kran (M16). Står i backloggen |
| Hvite flekker bak båten | Felles (`24-cinema.js`) |

## 10. Testene

- `python3.11 tools/boats/kyst21.py check`: 33 sjekker, alle grønne.
- `node tests/unit/run.mjs`: 3 306 grønne. Nye sjekker for kyst21 i `trim.test.mjs` (sett røde mot den gamle tabellen), `jig.test.mjs`
  (sett røde mot den gamle eksporten) og `teiner.test.mjs` (grønn også mot den gamle).
- `tests/ombord.py kyst21` før og etter, begge formater, alle operasjonene; redskapsreglene slått av i opptaket
  (`KYST_OMBORD_NORULE=1`), fordi alle feltene i Senja-pakka ligger innenfor grunnlinjen. Klippesjekken var tom i alle klippene.
- Testene i nettleseren står i commit-meldingen og i meldingen til Jonas.

## 11. Spørsmål og det som ville gjort resultatet bedre

- Et bilde av en stålbåt på 18–25 m fra 60- eller 70-tallet med bakk og rundgatt, sett ovenfra eller aktenfra (akterdekket er eget valg).
- Skal styrhuset løftes en halv etasje, slik at skipperen ser over bakken? Det endrer silhuetten.

## 12. Runde 2 (12.11.2026)

Steg 91, Jonas' økt, grenen `claude/ob13-kyst21-runde2`. Startmeldingen: `docs/planer/start/91.md`. Målet: fra 70 til minst 75 på Jonas'
skala, med det sensoren pekte på i kap. 9, i den rekkefølgen startmeldingen gir.

### 12.1 Det som er gjort

| # | Hva | Gjort | Regnet eller sett |
|---|---|---|---|
| 1 | Teinetrekket | Eget tømmested på luka (B16, `kit.pots.spot`, også i `potplaces.json`), tre stabler på ti | `check()`: ringen og den tippede teina på lukedekselet, fri av stablene og lasteplassen. I spillet står de tre som sorterer, på rad ved x 10,4–11,6, y −2,1 til −2,5, minst 0,72 m fra hverandre (før og etter), ved karmen innenfor dem. Første forsøk (akter for karet) ble forkastet etter kontrollen: den tippede teina sto i karmen. Spillets krabbekar (`tankAt`) står om babord |
| 2 | Utsikten fra roret | Bommen toppet opp (B15), stolpene 5,9 cm mellom frontrutene og 8,4 cm mot hjørnene med karmene (før 11 og 13), dørken 0,30 m høyere (B14) | `check()`: bommen ligger bak masta sett fra øyet (0,00 m ved siden av), baugens ripe 2,3° under vannrett. `helm`-bildet før og etter |
| 3 | Dekket | Sveisesømmer i platene (skjøter på tvers hver 1,8 m, to langsgående strøk på hver side), sklisikre felt med riflet mønster der de står (ved setteren, på begge sider av luka, utenfor husets dører) | Ingenting over 0,004 m |
| 4 | Akterdekket | Garnbingen (B13), seks øyebolter for karenes surringer, to klamper på skansekledningen, arbeidslys under båtdekkets akterkant (bare lampa: spillet retter alle `work`-lys mot bordet, så den er ikke et anker) | `check()`; `netTubs` gir fire kar som før (lest i spillet) |
| 5 | Lanternene om natta | Nattbilder fra spillet til sjøs (seilas: topplanterne, sidelanternene, hekklanterna; fiske: rødt over hvitt), egne nattrendringer `K6n` og `K6a` med hele masta i bildet, flomlysene tent og svakt måneskinn (`shots.py`: valgfrie `NIGHT_FLOODS` og `NIGHT_SUN` i skriptet) | Den felles `K6` klipper mastetoppen ut (100 mm linse), derfor de egne |
| 6 | Grove deler | Lastevinsjen (trommel med vaier, flenser, bremsetrommel med bånd og spak, clutchspak, varphoder, motorhus med slanger), lys skott bak bakkdøra (ingen innredning), sløyebordet som trau (lepper, skjørt, tre skjærebrett, avstivning, gitterhylle, avløp, dyser på spylerøret; ingen kniver, de er kjøpbart redskap) | Rendringene `c_fore`, `c_break`, `c_table` |

Nærmodellen er 147 722 trekanter (før 141 982). Døra til styrhuset er 2,05 m over terskelen. `qa/flatnorm.py`: de samme tre små flatene som i runde 1, ingen i styrhuset.

### 12.2 Det som ikke er modellens

- **Folkene i teinetrekket:** `deckcrew.js` setter dem som sorterer, på rad ved haleren med ansiktet mot ripa (`places().pot` og `beside`),
  uansett hvor teina tømmes. Teina svinges rett fra blokka til tømmestedet i skulderhøyde (`10-gear.js` `drawPots`, u 0,55–0,62), så
  den går forbi dem som står imellom. Begge filene var bare til lesing i denne økta; i backloggen.
- Kranen (M16), ryddingen (F12), ingen ved teinene under setting (F4) og de hvite flekkene bak båten står som før.

### 12.3 Rundene med sensoren

| Sensor | Sum | Skrog | Detaljer | Lanterner | Styrhus | Arbeidsflyt | Dekk | Rettet etter |
|---|---|---|---|---|---|---|---|---|
| 1 (fersk underagent, bare bildene, `check()` og skalaen) | **70** | 15 | 13 | 4 | 7 | 16 | 15 | Koøyene akter 0,6 m over vannet (før 0,3), slitasje og rust i dekket og fra lenseportene, topplanterna skjermet akterover (225°; den var rundtlysende), kompassets kuler svarte (de ble lest som sidelys), frontvinduene 0,20 m forover (før 0,10), garnbingen med et forbord på 0,55 m (flyttet til x 1,70: ved 1,47 stengte gangkartet cellene der spillet prøver karene, og `netTubs` ga ett kar, sett i spillet), navnet på bremmen (`anchors.nameHouse`: med den skrå fronten fant spillets søk ikke båndet over vinduene) |
| 2 (ny fersk underagent, samme bilder med de nye rendringene) | **76** | 16 | 15 | 4 | 8 | 17 | 16 | – |

Sensor 2 fikk i tillegg vite at setting akter og trekk forut med sidedekket imellom er typens valg (B5) og ikke noe modellen kan endre i denne runden; sensor 1 trakk for det. Tallene er derfor ikke helt sammenlignbare. Det sensor 2 trakk for: mannskapet arbeider ikke synlig i teinetrekket og teina henger tippet uten at noen tar i den (spillets felles kode), vinsjen og ventilene er grove primitiver og båten ser for ny ut (modellen), teinestablene på ti står frittstående uten reol eller surring og garnbingen er lav på sidene (modellen; bingens sider er lave fordi gangkartet ellers stenger karenes plass).

**Kyst21 er ferdig etter skalaen: 76/100** (Jonas 10.11.2026: «ferdig ved 75 eller mer»). Det som står igjen, er i backloggen under OB13.

