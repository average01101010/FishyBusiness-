# Den nye hurtigsjarken: byggegrunnlaget for revisjonen (F5)

> Grunnlaget for revisjonen av `sjarkny` («Ny hurtigsjark 10,99 m, 650 hk»), skriptet `tools/boats/hs11.py`, etter malen i
> `sulebas-pilot-grunnlag.md`, arbeidsmåten i `sulebas-bygging.md` og koden i `hurtig11.py`. Bestilt av Jonas 01.11.2026: «Revider
> båtmodellen: Ny hurtigsjark 10,99 m, 650 hk … Kjør på.» Med bestillingen fulgte et skjermbilde av spillets båthandel med dagens modell og
> databladet. **02.11.2026 viste Jonas generalarrangementstegningen** som det første skriptet var målt av («Dette er bortimot hva jeg
> ønsker … Gjør den mer lik tegningen. Altså hele båten»). Tegningen ligger ikke i repoet (CLAUDE.md: bare målene).
>
> Kildekoder: **D** tegningen (131,7 px/m på bildet Jonas viste: LOA 10,99, BOA 4,68, LH 10,95, LWL 10,79, BH 4,59, BWL 4,49, dmax 2,06,
> D 2,40, Δmax 42 000 kg, G 16 000 kg, V 12 kn; sideriss, plan, for- og akterriss), **R** spillets data og dokumenter, **J** Jonas' ord,
> **A** antatt, **M** målt på modellen.

## 1. Fakta om båten

| Hva | Verdi | Kilde | Følger for modellen |
|---|---|---|---|
| Type | Bred, høy arbeidsbåt i plast: loddrett stevn over en rund forfot, rette sider, skarpt slag langt nede, grunn V med kjøl som faller akterover til dysa, slingrekjøler; ripa flat akter med et trinn opp ved styrhuset til bakken; styrhuset nesten i full bredde med frontvinduer som heller forover; lukket dekkshus til babord akter for huset og åpen haleplass til styrbord under ett langt tak; skrå søylemast; kran i babord hekk, luke midt akter | D, J | Låst |
| Lengde o.a. | 10,99 m | R, D | `vessel3d`: −6 % til +3 %; modellen 10,96 i båndet |
| Bredde | 4,68 m | R, D | ±5 %; modellen 4,62 ved ripa, 4,69 over lista |
| Deplasement | 42 t ved største vannlinje, 16 t lett (D); 15 t i `VESSELS` | D, R | `check()`: 45,0 t ved vannlinja 1,18 (+7 %); lett ligger hun 0,67 m høyere |
| Dypgang | 2,06 m | R, D | Kjølens underkant 0,88 under grunnlinja: 2,06 |
| Maskin | 650 hk (R); 12 kn (D) | R, D | Propell Ø 0,68 i dyse (innvendig Ø 0,72), profilror bak. **Farten**: kap. 9 |
| Byggeår | 2027, ny | R | Nesten ingen slitasje |
| Lasterom | 7 000 kg med is, 12 m³, fisk i bulk | R, D | Luke 1,30 × 1,24 m midt akter under kranen |
| Farger | Petrolblått skrog og skansekledning, hvit liste og kappe, hvitt hus, lysegrått tak med oransje kant, grått dekk, mørkt bunnstoff, svart vannlinjestripe | R (det første skriptet) | Sone 1 skrog, 2 lista og kappen, 3 overbygg og tak, 4 dekk: som før |

## 2. Reglene som gjelder modellen

- Ingen ekte navn, merke eller logo, heller ikke i GLB-ens `name` («New speed sjark 10.99 m»). Verftet i Finnsnes nevnes bare som sted.
- Bare utsiden; gjennom vinduene synes konsollen, skjermene, rattet, stolen, benken og kartbordet.
- Ingen kjøpbart utstyr modellert inn: haleren, karene, sløyebenken, stampene, garnet, livbøyene, flåten, radarene og kranen settes av spillet
  (`hauler`, `work`, `kit`). Kista i babord hekk er kranens fot (tegningen har kranen der). Det gamle skriptet hadde sin egen sløyebenk: den
  er fjernet.
- Lanternene på lovlige plasser (kap. 5).
- Det spillet er avhengig av, beholdes: typenavnet `sjarkny`, sone 1–4 og alle ankrene (`bunk` leses ikke av spillet og er tatt ut); nye:
  `stairs`, `work.tub`, `fishR`/`fishW`, `work`.

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Ombygging eller nytt skript? | **Nytt skript.** Koden er `hurtig11.py` sin (ett nett, `pchip`, ekte hull, `check()`), men formen er tegningens. Første utkast (01.11) brukte også `hurtig11`-formen: **Jonas: «Den blir alt for lik den andre hurtigsjarken … Jeg likte egentlig at den opprinnelige modellen så litt stor og macho ut … mer rett i baugen … det må være en markant design-forskjell»**. Han valgte loddrett stevn, frontvinduer som heller forover og et bredt, høyt hus, og viste så tegningen |
| B2 | Skrog | Etter tegningen, lagt over sideriss i hver runde (`qa/overlay_hs11.py`): kjølen fra 0,82 under grunnlinja akter, rett opp til 0,33 ved 8,6, inn i forfotens bue og opp en loddrett stevn; slaget fra 0,34 ved speilet til 0,8 i stevnen; lista ved 2,0–2,1; ripa 2,87 akter og 3,08 forut med trinnet ved 6,26–6,50; fordekket flatt |
| B3 | Bunnen | Grunn V (17° midtskips), kjøl (dødved) med halv bredde 0,08 ved foten og hul rot, som faller akterover 6,5 cm per meter; slingrekjøler langs slaget 3,2–7,2 (D: for- og akterrisset) |
| B4 | Propell og ror | Propell Ø 0,68 i en Kort-dyse (0,58–1,06) som hviler på kjølens sko, stag til skroget over; profilror 0,44 bak med hælen på skoen (D) |
| B5 | Lista og fargene | Hvit avrundet liste på knekken (sone 2), skansekledningen petrol som skroget (sone 1), kappen hvit (sone 2), takkanten oransje |
| B6 | Lensportene | Seks per side ved dekket (D: 0,38 × 0,15 m, x 0,34–4,90); til babord bare to, fordi kista og dekkshuset står mot skansen der |
| B7 | Styrhuset | 6,34–8,57, nesten fullt bredt (halv bredde 2,12), gulvet et trinn over dekket (2,38), taket 4,30 (D: toppen 4,41), frontvinduene heller 0,33 forover (tre ruter), to vinduer i hver side, døra i akterveggen til styrbord ut mot haleplassen, ett trinn. **Bakken nås innenfra**: huset fyller dekket som på tegningen, så spillets dekkskart har ingen gang dit (fordekket er ikke dekk i spillet, slik det ikke var før heller) |
| B8 | Dekkshuset og taket | Lukket dekkshus til babord fra x 3,17 til styrhuset, fra y −0,55 til sida (D: akterhuset og lugaren), med dør og vindu mot haleplassen, vindu akter og til babord; ett tynt tak fra 3,15 over dekkshuset og haleplassen, båret av to stolper til styrbord |
| B9 | Masta | Skrå søylemast over styrhusets akterkant med plattform ved 5,15 (D 5,2) og stang. **Stanga er 1,4 m høyere enn på tegningen** (7,62 mot 6,2), så fiskelysene står lovlig over sidelanternene (2(j)) |
| B10 | Styreplassen | Skipperen midt bak styrbord frontrute (y −1,12) ved x 7,33, rattet 0,40 foran ham, stolen 0,42 bak, øyet 4,03. Konsollen under frontvinduene med dashbordet som skrår opp forover, plotteren, ekkoloddet og motorpanelet vendt mot ham, kompass, VHF under taket, spaken på konsollens side; benk og kartbord til babord. `hp` −0,26, `fov` 60: dashbordet 43° under øyet |
| B11 | Arbeidsflyten | Haleren i haleporten til styrbord (5,25–5,95) under taket rett akter for styrhuset (D: haleren ved 5,6), blødekaret 0,75 m akter for ham, spillets sløyebenk ved styrbord ripe 1,25 m akter for karet, luka midt akter, stampene mellom benken og luka, garnet i styrbord hekk, lasten i babord hekk, kranen på kista i babord hekk (D) |
| B12 | Flaggstanga | På speilets babord hjørne med kule (D: 3,6); den gamle aktermasta er borte. Hekklyset på stolpe over speilets midte |

## 4. Gjennomgang før endring: avvikslista (01.11.2026)

Spillet viser Blender-modellen (`glbHas('sjarkny')` sann, 8 009 trekanter, delene lod0/glass/lod1, fire typede lys, sone 0–4, mast), ikke
byggesettets reserve. Før-bildene fra spillet: `tests/out/hs11_for_*_{liggende,staaende}.png` (`tests/hs11shot.py`, ny etter `hu11shot.py`).
Dagens modell rendret fra K1–K7: `tools/boats/out/qa/hs11for_*.png`. `qa/stubcheck.py --volume`: det gamle skroget veier 44,6 t ved vannlinja
1,18 (tegningens 42 t passer, dataenes 15 t er lettvekta). `qa/fair.py` fant ingen sammenhengende skrogflate å måle (to løse rutenett).
`qa/deckpoints.py`: alle plassene på dekket. `qa/deckgrid.py`: styrhusgulvet og fordekket ikke knyttet til dekket, ingen `stairs`.

| # | Avvik | Hvor | Alvor | Tiltak |
|---|---|---|---|---|
| A1 | **Skroget er ikke én flate**: to rutenett, speilet, skegen, gulvet og dysa egne kropper | `hull`, `under` | H | Ett nett (B2) |
| A2 | **Åpningene er ikke hull**: lensportene mørke flekker midt på sida, dørene plater | `decks`, `house` | H | Ekte lensporter ved dekket (B6), luka ned i rommet, forluka, eksosen, lensepumpas utløp, styrhusdøra med karm og blad |
| A3 | **Skjermene vender feil**; broa viser tykke stolper og rekkverket midt i synet | `house` | H | B10 |
| A4 | **Sløyebenken er modellert inn** ved døra | `decks` | H | Fjernet; spillets benk (B11) |
| A5 | **Dekkskartet**: styrhusgulvet ikke knyttet til dekket, ingen trinn | ankrene | H | Gulvet et trinn over dekket, `stairs` (B7) |
| A6 | **To i mannskapet står i hverandre** i døråpningen | `crewSpots` | M | Fire plasser ved arbeidet (B11) |
| A7 | **Sidelanternene uten skjerm**, ingen fiskelys, hekklyset på speilets kant | `lights` | M | Kap. 5 |
| A8 | **Rattet en torus uten nav**, stolen inni rattet | `house` | M | `F.helm_wheel`, `F.helm_seat` (B10) |
| A9 | Flate sider; lista en hvit stripe uten form | `hull` | M | Ekte liste, slagflate (B5) |
| A10 | Røykpipe på taket; aktermast i hekken | rigg | L | Våt eksos i speilet, flaggstang (B12) |

**Det som var bra og beholdes:** målene fra tegningen, fargene, den oransje takkanten, rekkverket rundt fordekket, plassene for flåten på taket.

## 5. Lanternene

| Lys | Plass | Regel |
|---|---|---|
| Hvit rundtlysende (under 12 m: i stedet for topplys og hekklys) | Mastestangas topp, 7,72 m | Minst 1 m over sidelanternene (vedlegg I 2(d)): 3,54 |
| Side, rød/grønn med skjerm | Styrhusets sider forut for vinduene, under takkanten, 4,18 m | Høyst tre firedeler av den hvites høyde over skroget (2(g)): 1,10 mot 3,64 |
| Hekklys | Stolpe over speilets midte, 3,22 m | (båten fører det i tillegg) |
| Fiske: rødt over hvitt rundtlysende | Armer akter for stanga, 7,35 og 6,30 m | Minst 1 m imellom under 20 m (1,05); det nedre minst to ganger avstanden over sidelanternene (2(j)): 2,12 mot 2,10 |
| Arbeidslys | Under takets akterkant og under plattformen | – |

## 6. Arbeidsflyten og plassene

Fiskeren står ved haleren i haleporten til styrbord (x 5,60; terskelen 0,46 m over dekket) under taket, rett akter for styrhuset. Blødekaret
står 0,75 m akter for ham, sløyebenken ved styrbord ripe akter for karet (3,60) med den som sløyer innenfor, og fisken går ned luka midt akter.
Den fjerde står ved luka. Skipperen går ett trinn opp fra haleplassen og inn døra i styrhusets aktervegg og står bak rattet midt bak
styrbord frontrute. Kranen på kista i babord hekk når luka, lasteplassen og kaia.

## 7. Kritikksløyfen

| Runde | Hva ble sett | Hva ble gjort |
|---|---|---|
| 0 (før) | Før-bilder i begge formater, vekta, `fair.py`, `deckpoints`, `deckgrid`, K1–K7 | Avvikslista (kap. 4); bildene og lista sendt til Jonas |
| 1 | Første utkast etter `hurtig11.py` med planende bunn (15,4 t); `fair.py`: knekk ved skegens forkant (x 7,30) fra en `min()`-grense | Myk overgang (`ss`); klipp 60 → 0 (trinnene i skansen der baugen smalner, ankerspillet i fordekkets stigning) |
| 2 | **Jonas: for lik den brukte hurtigsjarken**; valgte loddrett stevn, frontvinduer forover, bredt og høyt hus | Stevnen, fronten og huset bygd om |
| 3 | **Jonas viste tegningen**: «Gjør den mer lik tegningen. Altså hele båten» | Skroget, overbygget, masta, kranens plass og arbeidsflyten etter tegningen; overlegget på sideriss (`qa/overlay_hs11.py`, ny) |
| 4 | Overlegget: kjølen for dyp forut (møtte ikke forfotens bue), masta 0,25 m for langt akter; «akterhuset» på 3,57 var flaggstanga | Kjølen inn i forfoten fra 8,0, masta flyttet, flaggstang på speilet, kranens kiste 1,30 høy |
| 5 | Nærbildet av baugen: lista bøyde 0,5 m opp i stevnen (knekken møtte stevnen ved 2,6) | Knekken ender ved 10,94, i listas høyde |
| 6 | Eksport: lod0 60 935 trekanter, lodm 40 000, lod1 2 561 (fjernmodellen); GLB 3,5 MB. Enhetstestene 245 OK. `deckpoints`: alle plassene på dekket, skipperen 1,20 nås gjennom døra | – |
| 7 | Etter-bildene i spillet i begge formater (`tests/out/hs11_etter_*`): modellen, kranen i babord hekk, livbøyene, flåten, skipperen bak ruta, sidelanternene om natta (rød fra babord, grønn fra styrbord). Broa: tre ruter, dashbordets skjermer leser som store svarte flater ovenfra | Står (kap. 8) |
| 8 | Testene (`runtests.sh`, etter hverandre): `vessel3d sjarkny`, `brotest sjarkny` (rom 1,92, mørk 0,06), `lanterntest`, `regmarktest` (merket på jevn sone 1, 0,69 fra stevnen), `vesseltest`, `maletest`, `walktest` grønne; `deckshot` se BACKLOG (kranprøven var rød for alle kranbåtene før) | – |

## 8. Selvvurdering

**Karakter: 70/100: ikke godkjent** (grensen er 75). Skroget er én flate etter tegningen og lagt over sideriss, vekta og dypgangen stemmer
med tegningen (45 t mot 42, 2,06), klipp-kontrollen står på 0, alle kontrollene i `check()` er grønne, lanternene er lovlige med fiskelys,
arbeidsflyten følger tegningen (haleren rett akter for styrhuset, karet og benken akter for den, luka midt akter, kranen i babord hekk), og
testene er grønne. Trekk: (1) **Jonas måtte rette retningen to ganger**: første utkast var en kopi av den brukte hurtigsjarken i formen, og
tegningen som lå bak det gamle skriptet (kommentaren øverst sa det) ble ikke etterspurt før han viste den; (2) jeg tegnet først en planende
bunn for å treffe `disp` 15 t, før jeg så at tegningens 42 t er største deplasement og 16 t lettvekt; (3) bare sideriss er lagt over;
planet, for- og akterrisset er lest av øyemål (husets bredde, slaget, bunnreisningen); (4) mastestanga er 1,4 m høyere enn på tegningen
for fiskelysene; (5) broa i spillet viser skjermene som store svarte flater, og stolpene mellom rutene er tykke; (6) farten er ikke avgjort.

Det som må til for 75: Jonas ser på bildene uten å finne noe nytt, overlegg også på plan og for-/akterriss, og en finere bro.

## 9. Spørsmål til Jonas

1. **Farten og «planende»**: tegningen sier 12 kn og en deplasementsbåt med dyse; `VESSELS.sjarkny` har `vmax` 25, `vcruise` 20,
   `planing: true`, og butikkteksten sier «Planende skrog og stor motor». Modellen følger tegningen. Skal dataene følge (for eksempel 13–14
   kn med 650 hk, ikke planende, og en ny tekst), eller skal båten fortsatt gå 25 kn i spillet?
   **Jonas valgte 05.11.2026: 12 kn, som tegningen.** Hun er en deplasementsbåt med dyse: `vmax` 12, `planing` av, og ny butikktekst.
   Det tas i Ø7 (`docs/planer/okter-etter-backloggen.md`), etter H2, fordi `core/02-species-gear.js` og `ui/phone/10-fartoy.js` er H2s.
2. **Vekta**: `disp` 15 t er tegningens lettvekt (16 t). Skal den være 16?

## 10. OB10: arbeidet om bord, bremmen, vannlinja og karakteren etter Jonas' skala (10.11.2026)

Steg 88 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-e7277295-e9i00p`. Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting». Før- og etter-bildene er tatt med `tests/ombord.py sjarkny`, bare bilder, begge formater, alle 16 operasjonene; arkene ligger i `docs/okter/2026-11-10-ob10/`.

### 10.1 Bildene av typen (valg 22 B)

**Ingen bilder kunne hentes i denne økta heller.** Bildeserveren (`upload.wikimedia.org`) svarte 429 på det ene forsøket, og søket (`commons.wikimedia.org/w/api.php`) svarte tomt etter noen få spørringer; sperren er ikke omgått. Kilden for denne båten er uansett **tegningen Jonas selv viste 02.11.2026** (D i kap. 1; «Gjør den mer lik tegningen. Altså hele båten»), som er bedre enn bilder av typen. Arket fra OB9 (`hurtigsjark-grunnlag.md` 9.1, fem bilder fra Wikimedia Commons av sjarker med styrhuset forut og arbeidsdekket akter; nummer 1 og 3 er sett av OB8 og godkjent av Jonas, resten valgt etter beskrivelsen) gjelder samme type og er det nærmeste som finnes; ingen nye bilder er lagt til, og ingen bilder er sett av meg. Det som avgjør plassene under, er tegningen, spillets egne mål (`check()`) og før-bildene.

### 10.2 Det før-bildene viste

- **De to som sløyer, sto i én klump** ved benken om styrbord (F19), og benken (2,80–4,40) sto 9 cm inn i blødekarets plass (4,31) og 20 cm inn i stampeblokken (0,99–3,01 med åtte om bord).
- **Teinestabelen syntes ikke:** to av de fire plassene OB16 fant, sto inne i det lukkede dekkshuset (x 5,1, y 0,34) og inne i styrhuset (x 7,2), fordi dekkskartet regner gulvet i et lukket hus som dørk; de seks teinene i opptaket sto i dekkshuset. Teina som trekkes, ble lagt og tømt 2 m akter for haleren (`potDeck`), der benken sto.
- **Juksa:** fire på styrbord, én i haleporten ved døra og én ved benken.
- **Den forreste takstolpen** (x 4,60 på dørken) sto 5 cm inn i blødekarets kant.
- **Vekta:** skroget fortrenger 45,0 t ved tegningens største vannlinje (tegningen: 42 t størst, 16 t lett); `VESSELS.sjarkny.disp` er 15 t. Spillets ramme sto på den største vannlinja, så hun lå som fullastet etter tegningen med tre ganger vekta spillet regner med.

### 10.3 Plassene (modellens x fra speilet, y babord +)

Regnet i `check()` mot spillets egne bokser (`deckcrew.js` `kitBoxes`, hver med 6 cm rundt) før eksporten.

| Plass | Før | Nå | Hvorfor |
|---|---|---|---|
| Sløyebenken (`work.table`, `TABLE`) | styrbord ripe, x 3,60 | **babord ripe tvers av luka**, x 2,25 (1,39–3,11), y 1,84 | Mellom kista og dekkshuset. Den som sløyer, står innenfor (y 1,20) med luka i ryggen, 0,80 m dørk mellom benken og luka; nummer to 0,7 m akter. Fisken går rett ned i rommet (som den brukte hurtigsjarken etter OB9) |
| Kista med kranen (`LOCKER`) | babord, x 1,30–2,35 | babord hekk, **x 0,08–1,13**, inntil speilet | Gir plass til benken forut for den; fortsatt «kran akter til babord» som tegningen, 1,2 m lenger akter, og ingen lomme akter for kista der noen kan bli stående. Babords lensport flyttet fra 0,34 til 1,45 (bak kista før) |
| Flaggstanga (`pole`) | babord hjørne | **styrbord hjørne** | Sto 0,6 m fra kranens søyle; avvik fra tegningen (babord) |
| Blødekaret (`work.tub`) | x 4,85 | som før | Rett akter for haleren |
| Dørken under taket akter for karet | benken | **fri, x 3,15–4,25** | Her legges og tømmes teina (`kit.pots.spot`, ring 1,45 m ved x 3,50, y −1,30), og her går gangen fra haleren til dekket |
| Stampene (`kit.stamps`, `STAMP0`) | x 2,75, y −0,95 | x 2,00, y −0,80: blokken x 0,18–2,32, y −0,61 til −1,51 | Langs lukas styrbord side akter for taket, ved hekken der lina går ut; 0,68 m gang til ripa |
| Garnkaret (`kit.garn`) | styrbord hekk | som før | Garnet går ut over hekken 0,45 m til styrbord |
| Teinestablene (`kit.pots`, `POTS`) | 4 × 6, to av dem inne i husene | **2 × 6**: styrbord hekk på dørken (x 0,85, y −1,41) og på luka (x 1,60) | Lomma i babord hekk mellom speilet, luka og kista er under 1,45 m. `gearMax.teine` 21 → **12** (valg 25 A: det dørken rommer) |
| Juksaplassene (`anchors.jigZ`, ny) | `jigRail`: 4 av 6, én i haleporten | **styrbord 2,80, 3,85, 1,70, 0,65** (de to første alltid fri; de to i hekken står i gangen ved stampene, garnkaret eller teinestabelen når det er om bord) | Godt en meter imellom (1,05), fri for flaggstanga, takstolpene, karet, haleporten, haleren og døra. **Ingen om babord:** babord ripe er dekkshuset, benken og kista fra styrhuset til speilet. `jukseMax` 6 → **4** (som valg 31 A for den brukte) |
| Takstolpene (`POSTS`) | på dørken, x 3,23 og 4,60 | **på styrbord kappe**, x 3,23 og 4,42 | Fri dørk; ingen i karet |
| Livbøyene | én på dekkshusets aktervegg, én på styrbord gripelist ved x 2,60 | **begge på dekkshusets aktervegg**, på hver side av vinduet | Ingen på ripa der de jukser og går |
| Lasten (`kit.cargo`, `CARGO`) | babord hekk, x 0,75, y 1,10, langskips | **på tvers akter for luka til babord**, x 0,51, y 0,74 | Fri for kranens fot, luka og nummer to ved benken |
| Leideren i hekken (`LADDER`, `LADDERS.sjarkny` i `vessel3d.js`) | y −1,05 til −1,35 | y −1,55 til −1,85 | 1,25 m fra der redskapet går ut over hekken (0,75 før) |
| Gripelista om styrbord | x 0,90–3,00 | x 1,75–2,90 | Fri for teinestabelen i hekken |

### 10.4 Det som ellers er endret

- **Bremmen på styrhustaket** (valg 26): rundt hele takkanten, også ut over skansen over dekkshuset og haleplassen og visiret foran. Underkanten står der den oransje kanten var (3 cm oransje med dryppkanten under), flaten skrår 0,10 m inn og 0,18 m opp **i skrogets petrol** og i skrogets malingssone, kronen 4 cm. `check()`: dryppkanten 2,17 m over arbeidsdekket og haleplassen (dekkskartet 1,85). Masta, flåten og rekka står på kronen (`roof_top`).
- **Styrhusveggene uten striper:** de skarpe kantene merkes på nytt etter vinduskuttet (`shade(shell, 5)`). `qa/flatnorm.py`: 90 flater opptil 74° skjevt på styrhuset før, 0 etter (igjen: to flater på den skrå mastesøylen 20,6°, rund del, grensen er 20).
- **Spygattene** var alt åpne uten klaffer. **Pyntefendere:** modellen hadde ingen.
- **Den tomme båtens vannlinje** (valg 18 A): formen står, spillets vannlinje `WLE = WL − 0,665` gir 14,83 t mot 15 t. Hun ligger **0,67 m høyere** i spillet enn før: fribord midtskips 2,36 m, arbeidsdekket 1,59 m over vannet, dypgang med kjølen 1,40 m, dysas topp 0,47 m under vannet. Det er det tegningens skrog gir for en tom båt på 15–16 t (største deplasement 42 t ved 2,06 m). **Malingen følger spillet:** spillet laster henne med høyst 7 t fisk, 2,4 t is og 2 t olje (26,4 t, 0,26 m dypere), så bunnstoffet og vannlinjestripa er lagt etter den lastede vannlinja `WLL`, ikke tegningens største, som hun aldri når i spillet. Leideren i hekken er forlenget ned til den nye vannlinja. `VESSELS.sjarkny.draft` 2,06 står (tegningens største).
- **`STAB_AT.sjarkny`** (`core/03c-stability.js`) lest på nytt: `dy` 1,6, benken [−1,84, 3,25], stampene [0,8, 3,5], teinene [0,7, 4,27] (midt mellom de to stablene; med seks eller færre står alle i styrbord hekk, så slagsiden er regnet litt for liten da), og `fish` [1,75, 3,25] (midt i juksaplassene). Sjekk i `tests/unit/trim.test.mjs` mot modellens eksporterte ankre.
- **Enhetssjekkene** (`trim`, `jig`, `teiner`): sett røde mot den gamle modellen og de gamle tallene (4 FEIL av 2 814), grønne etter.
- **Settingen:** redskapet går ut over hekken i 2,97 m mot hekkens topp 2,87 (`drawSetting`: ripas høyde + 0,10): fritt, ingen setteport trengs.
- **Småbeslag** (runde 2, etter den første evalueringen): håndlister på dekkshusets styrbord vegg langs haleplassen og under aktre vindu, tre arbeidslys under taket (haleren, karet, takets akterkant), hengsler og håndtak på kista, fire surringsøyer i dørken rundt luka.
- **Klasjsjekken** (`qa/clip_hs11.py`): 0 punkter.
- **`crewclip`**: sjarkny med i F19-lista. Ikke sett rød: før-bygget ga også over 0,55 m mellom de to (klumpen i før-bildene er to som står tett langs kameraets retning og benken inn i karet og stampene); juksa 4 av 4 plasser etter (4 av 6 før).

### 10.4b Jonas' svar 10.11.2026

Spurt om de tre tingene som ventet: «1. Hun skal ligge riktig i sjøen i henhold til estimert ekte vekt, med farten deretter. 2. Ja, juster ned 3. To stabler».

- **Vannlinja står** (`WLE`, 15 t tom). **Farten** (også valgt 05.11.2026, kap. 9: «12 kn, som tegningen»): `VESSELS.sjarkny` `vmax` 25 → 12, `vcruise` 20 → 10, `planing` av, ny tekst på båtbladet. `lph` 75 → 55 ved marsjfart er **antatt** (rekkevidde 364 nm mot 533 før), ikke målt mot kilde. Navnet «Ny hurtigsjark» står. `tests/unit/motstand.test.mjs`: et skrog som drives mer enn 1,25 ganger kneika uten å plane (hun: 12 kn mot 9,1), måles til kneika; sett rød med den gamle regelen (1,17× mot 1,4). `hull.test.mjs`: hun er ute av de planende.
- **Teinene 12 og juksamaskinene 4** står.
- **To stabler:** `tests/potshot.py` godtar at ringen når inn i den ene ruta på 20 cm ved skansens fot (gulv i ruta innenfor, ingen utenfor); en karm inne på dekket har gulv på begge sider og blir fortsatt funnet. Linja var rød på stabelen i styrbord hekk før («ikke gulv ved 2.04,4.32»).

### 10.5 Etter-bildene og det som står igjen

Etter-bildene (`tests/ombord.py sjarkny`, begge formater, alle 16 operasjonene, tatt på nytt etter runde 2; ingen droppet, fordi vannlinja, taket og plassene er endret) og arkene i `docs/okter/2026-11-10-ob10/`. Sett: de to som sløyer, står side om side ved benken om babord med luka bak seg (F19 rettet); fire jukser langs styrbord ripe med en meter imellom, ingen i haleporten eller døra (F21; babord har ingen plass); stampene og garnkaret står ved hekken der redskapet går ut, og to står ved stampene når lina settes; teinestabelen står synlig i styrbord hekk, og teina tømmes på fri dørk under taket; bremmen synes rundt hele taket; hun ligger høyere, med dekket omtrent i kaihøyde ved mottaket.

**Står igjen** (det meste er felles kode, ikke modellen):
1. **En som har pause, setter seg der teinestabelen står** (`teiner_sett`): `deckcrew.js` vet ikke om stablene (OB3, `om-bord.md` 4.12).
2. **Ledige folk mens redskapet går** (ingen ved garnkaret når garnet settes, F4; den fjerde uten maskin når tre maskiner er om bord; ingen kjører kranen, F23): OB3 og OB4.
3. **Den foldede kranbommen** ligger over benkens aktre ende i hodehøyde ved nummer to som sløyer; ingen klipp sett, men tett.
4. **Garnhaleren og teinedaviten** (spillets modeller) henger utenbords forut for haleporten og over takkanten; ikke undersøkt nærmere.
5. **Nakne flater**: dekkshusveggene, speilet og dørken har lite som bærer på nært hold; dashbordet er tre svarte skjermer (F2, materialene).
6. **Lanternene er ikke vist tent om natta** i denne økta (bare `lanterntest` og `check()`), og undervannsskroget er ikke vist i bildene.
7. **Juksaplassene i hekken** (1,70 og 0,65) står i gangen ved stampene, garnkaret eller teinestabelen når det er om bord.
8. Fra kodegjennomgangen, ikke rettet: teineplassene står to steder (`hs11.py` og `potplaces.json`, holdt like av `check()`); teinestablene prøves ikke mot stampene og garnkaret (bare om bord sammen under egning og bøting).

### 10.6 Karakteren: 71/100, ikke ferdig

**Runde 2 (11.11.2026): 67/100, fortsatt ikke ferdig.** Det som ble gjort står i 10.7, det som står igjen i 10.8, og karakteren med det som mangler i 10.9.

Satt som en egen evaluering av en uavhengig underagent som bare fikk arkene, rendringene, bildet fra roret, `check()`-utskriften og skalaen (Jonas 10.11.2026). Første evaluering, etter runde 1, ga **69**; etter runde 2 (livbøyene, leideren, kista, lasten, småbeslagene) ga en ny underagent **71**. Forslaget i OB0 var 66 etter en annen skala.

| Punkt | Vekt | Runde 1 | Runde 2 | Begrunnelse (runde 2) |
|---|---|---|---|---|
| Skrogutforming | 20 | 15 | 15 | Loddrett stevn, rette sider, skarpt slag, mål og vekt etter `check()` (14,83 t mot 15). Trekk: kasseformet med store flate felt i sida og speilet; undervannsskroget ikke vist |
| Detaljer | 20 | 14 | 14 | Bakken med rekke, spill og pullerter, spygatt uten klaffer, håndlister, lys under taket, kistas håndtak. Trekk: nakne vegger, speil og dørk; vinduene uten dybde |
| Lanterner | 5 | 4 | 4 | Lovlige etter `check()` og synlige i bildene. Trekk: ikke vist tent om natta |
| Styrhus | 10 | 7 | 7 | Frontrutene forover, bremmen, utsynet fra roret. Trekk: svarte skjermer uten instrumenter, brede stolper |
| Arbeidsflyt | 25 | 15 | 16 | Hver operasjon på et logisk sted: haling under taket, bløgging ved karet, sløying ved benken, juksa spredt, setting over hekken. Trekk: en mann i teinestabelen, ingen ved garnkaret, den fjerde uten maskin, ledige folk |
| Utforming av dekk | 20 | 14 | 15 | Følger tegningen, alt fritt for hverandre i `check()`, fri gang langs styrbord ripe. Trekk: trangt i styrbord hekk og ved karet, klaringer på noen centimeter, alt arbeid om styrbord |
| **Sum** | **100** | **69** | **71** | Under grensen på 75 |

**Min egen vurdering:** jeg er enig i tallet. Det som skiller 71 fra 75, er mest arbeidsflyten (16 av 25), og der er de fleste trekkene felles kode som OB3 og OB4 eier (`deckcrew.js`, `core/13-work.js`, `view3d/09` og `10`), ikke plassene. Modellen selv kan hente et par poeng på detaljer (dørken, veggene, speilet) og på bilder som viser lanternene om natta og undervannsskroget. Den nye hurtigsjarken trenger altså en runde til etter OB3 og OB4, som trebåten (OB1, 73).

### 10.7 Runde 2 (11.11.2026): det OB3 og OB4 rettet, og det som er rettet i modellen

Steg 88 runde 2, Jonas' økt på grenen `claude/charming-knuth-ih6c5n`, etter startmeldingen i `docs/planer/start/88.md`. Før-bildene er tatt på nytt med den gamle modellen og dagens kode (OB3 og OB4 er ute), etter-bildene med den nye; alle 24 operasjonene `tests/ombord.py sjarkny` nå har, begge formater, ingen droppet. Arkene, bildene fra roret, nattbildene og undervannsskroget ligger i `docs/okter/2026-11-11-ob10-r2/`. Vannlinja, `jukseMax` 4 og de to teinestablene er ikke rørt (Jonas 10.11.2026).

**Det OB3 og OB4 alene hadde rettet (punkt 2 i 10.5), sett i før-bildene og i det opptaket skriver ut:**
- **Garnet settes med én ved garnkaret** (`haling:gear`) og én som setter; i runde 1 sto ingen ved karet (F4).
- **Kranen kjøres av en med fjernkontroll, og én følger lasten** (`last:remote`, `last:look`); i runde 1 kjørte ingen kranen (F23).
- **Isen tas imot av en ved tuten** (`nozzle`), og ved lossingen hektes karene av (`unhook`).
- **Den fjerde jukser for hånd** når tre maskiner er om bord; i runde 1 sto han uten noe.
- **Lina settes av én** fra stampen ved hekken (eller gjennom linesetteren med magasinet), de tre andre har pause. Det er riktig bemanning for en båt på 11 m, men tre ledige synes i bildet.
- Står igjen i felles kode: den som har pause, kan sette seg der teinestabelen står (punkt 1, OB14, steg 92).

**Rettet i modellen (`tools/boats/hs11.py`):**

| Punkt i 10.5 | Før | Nå |
|---|---|---|
| 3. Den foldede kranbommen | `ry` 0, foten midt på kista (x 0,605): knekken og den lave bommen lå 0,83 m **forover** fra 1,46 m over dørken, over benkens aktre ende ved hodet til nummer to | **Snudd** (`CRANE_RY` π) og foten flyttet til x 0,78: knekken og den lave bommen ligger akterover over kista til speilet (x −0,05, 0,70 m over ripa), teleskopenes hoder forover til x 1,45 i **2,51 m** over dørken. Ingenting av kranen under mannshøyde over benken. `check()` regner begge endene og spillets boks rundt foten mot nummer to ved benken |
| 4. Garnhaleren og teinedaviten | Ikke undersøkt | **Undersøkt:** plassen er riktig (haleporten på tegningen, stolpens fot 9 cm innenfor skansen), og at garnhalerens arm står ut over sida, er slik haleren er bygd. Feilen var **taket**: teinedaviten er en stolpe på 2,30 m med armen til 3,02 m, og taket sto 2,17 m over dørken helt ut til skansen, så stolpen gikk gjennom takkanten. Taket er **spart ut over haleporten** (`ROOF_CUT`: fra x 5,20 til styrhuset står kanten inne ved y 1,92, 0,14 m innenfor stolpen); den som står ved haleren (y 1,69), står fortsatt under tak. **Avvik fra tegningen**, som har taket helt ut. Rekka på taket ender akter for utsparingen |
| 5. Nakne flater | Dekkshusets vinduer var en rute 1 mm utenpå en flat ramme; veggene, speilet og dørken hadde nesten ingenting; dashbordet tre svarte skjermer | **Vinduene** i dekkshuset har fire lister 30 mm ut rundt ruta, som ligger 24 mm dypt, og en dryppelist over; styrhusets ruter ligger 48 mm inne i veggen (30 før). **Dørken:** fem gripefelt der de går og arbeider, med renner langs skansen og rundt luka. **Dekkshuset:** ventilrister lavt på to vegger, brannslukker, koblingsboks med rør, sparkeplate og hengsler på døra, spyleslangen med kran på akterveggen. **Speilet:** klamper på rekka på hver side av der redskapet går ut, løfteøyer, to anoder til under vann. **Hekken:** dypgangsmerker på begge låringer. **Dashbordet:** kartplotteren med land, grunner, rute og båt, ekkoloddet med bunn og merker, motorpanelet med tre visere og lamper (malt, ikke levende) |
| 6. Ikke vist | Lanternene om natta og undervannsskroget | Nattbilder fra spillet fra styrbord og babord baug, og tre rendringer av undervannsskroget (kjøl, ror, propell i dyse, anoder) |
| 7. Juksaplassene i hekken | Sto som «i gangen ved stampene, garnkaret eller teinestabelen når det er om bord» | **Plassene står** (2,80, 3,85, 1,70, 0,65). Påstanden var feil: spillet setter stampene, garnkaret og teinestablene på dekk bare når hun er rigget for det redskapet eller arbeider med det (`deckcrew.js` `rigGear`), og det jukses bare når hun er rigget for juksa. Da er styrbord side fri fra speilet til blødekaret, som `juksa_jig` og `juksa_maskin` viser. Maskinene står boltet på ripas topp hele tida, over gangen og ikke i den |
| 8. Teineplassene to steder | `hs11.py` og `potplaces.json`, holdt like av `check()` | **Ett sted:** skriptet leser `tools/boats/potplaces.json` som de andre båtene. Ingen andre båter rørt |

**Ellers:** `qa/flatnorm.py` som etter runde 1 (bare to flater på den runde mastesøylen, 20,6° mot grensen 20; ingen på vegger). `qa/clip_hs11.py` 0. Modellen er 63 974 trekanter nær (taket er rundt 300 000), fjernmodellen 2 609.

### 10.8 Etter-bildene i runde 2 og det som står igjen

Sett i arkene: kranen står foldet som en høy V på kista med den lave enden mot speilet, og de to ved benken har fri luft over seg; teinedaviten står fritt i utsparingen og går ikke gjennom taket; garnhaleren står i samme utsparing med armen ut over sida; gripefeltene, ristene, slangen og vinduenes dybde synes fra kameraet i alle operasjonene; fra roret viser skjermene instrumenter. Opptakets egen klippsjekk (`clipNow`, `bodyHits`, folk utenfor dekket) fant ingenting i noen av de 48 opptakene.

**Står igjen:**
1. **Teina som trekkes, er bredere enn utsparingen** (ring 1,45 m, utsparingen 1,06 m lang): når den svinges inn fra davitens blokk i 2,8 m, går den over takkanten. Det er spillets animasjon (`view3d/10-gear.js` `drawPots`) mot et tak på 2,2 m, og hører til felles kode.
2. **En som har pause i teinestabelen** (OB14, steg 92).
3. **Tre ledige mens lina settes**, og fulle stamper (24) fyller dørken akter helt inn til benken; `gearMax.stamp` 30 er mer enn dørken rommer ryddig. Ikke rørt (felles kode og et tall Jonas ikke har bedt om å endre).
4. **Skjermene er malt**, ikke levende, og lyser ikke om natta.
5. **Etter-bildene ble tatt før dypgangsmerkene i baugen ble tatt bort** (de sank inn i skroget der sida svinger inn mot stevnen og syntes som noen prikker); modellen som er eksportert, har merkene bare akter. Ellers er den lik.

### 10.9 Karakteren etter runde 2: 67/100, ikke ferdig

Satt 11.11.2026 av en uavhengig underagent som bare fikk de 24 arkene, 15 rendringer, sju bilder fra spillet (også fra roret og om natta), `check()`-utskriften og skalaen, som i runde 1. Den fikk ikke karakteren fra runde 1 og ikke denne teksten. Jeg har ikke bedt om en ny karakter.

| Punkt | Vekt | Runde 1 (71) | Runde 2 | Sensorens begrunnelse (kort) |
|---|---|---|---|---|
| Skrogutforming | 20 | 15 | 14 | Én ren flate, jevne linjer, kjøl, dyse og ror henger sammen, vekta treffer. Trekk: kasseform med plane sider, flatt loddrett speil og butt baug; høyt fribord (2,36 m) |
| Detaljer | 20 | 14 | 13 | Mye beslag på plass (anoder, dypgangsmerker, brannslukker, rist, slange). Trekk: ingen slitasje å se (rust, skrubb, sømmer), vinduene svarte plater, dekket uten struktur |
| Lanterner | 5 | 4 | 3,5 | Rødt og grønt lyser i nattbildene, høydene etter vedlegg I. Trekk: den hvite på mastetoppen er utenfor bildet; lanterneglansen ligger over merket |
| Styrhus | 10 | 7 | 6,5 | Utsiden god; fra roret baugen, horisonten og instrumenter på skjermene. Trekk: mørkt og nakent inne, brede stolper, øyet 9 cm under vinduets overkant |
| Arbeidsflyt | 25 | 16 | 16 | Operasjonene kan skilles, og folk står stort sett riktig. Trekk: ledige og stive folk, tre–fire tett i styrbord akterhjørne når det settes, teina som svinges inn går gjennom mann og takstolpe |
| Utforming av dekk | 20 | 15 | 14 | Planen er logisk. Trekk: trangt overalt (klaringer på 2–5 cm, 0,68 m gang), fullt redskap fyller dørken akter, alle juksaplasser om styrbord, den foldede kranen ruver som en høy V foran vindu og livbøye |
| **Sum** | **100** | **71** | **67** | Under grensen på 75 |

**Min egen vurdering.** Tallet er lavere enn i runde 1 selv om modellen har flere detaljer og to klipp færre. Sensorene er to ulike kjøringer, og denne så flere bilder (24 operasjoner mot 16, nattbilder, undervannsskroget), så tallene kan ikke trekkes fra hverandre punkt for punkt. Det jeg tar med meg:
- **Det modellen ikke kan rette:** skrogformen er tegningens (Jonas 02.11.2026: «Gjør den mer lik tegningen»), og vannlinja og fribordet følger vekta (Jonas 10.11.2026). Arbeidsflyten (16 av 25) er felles kode: ledige folk, teina som svinges inn, flagget i arbeidshjørnet, kaikranens bom over taket ved lossing.
- **Snuingen av kranen ble trukket for.** Den lave bommen er borte fra dem som sløyer, men den høye enden peker nå forover og står som en V foran dekkshusets vindu. Sensoren mener det ser rarere ut enn før. Det er et valg for Jonas: som nå (ingenting i hodehøyde ved benken), tilbake (lavere å se på, men bommen over benkens ende), eller en bomstøtte så kranen kan ligge parkert lavt (`kit.crane.rest`), som krever plass til en 3,1 m lang bom.
- **Detaljene syntes ikke nok.** Slitasjen (`wear`) finnes i modellen, men synes ikke i bildene; gripefeltene leste sensoren ikke som struktur. Vinduene er fortsatt mørke plater i spillets lys.
- **To av rendringene var ubrukelige** (`c_work` grå, `c_shelter` bare et hjørne): kameraene i `CLOSE` står inne i det som er lagt til siden de ble satt. De må flyttes før neste runde.
- **Nattbildet** må tas med hele masta i bildet, så den hvite synes.

**Det som mangler til 75** (rundt åtte poeng): arbeidsflyten når OB14 og fellesfunnene under er rettet (anslått 3–4), synlig slitasje og struktur på nært hold (2–3), styrhuset inne (1–2), og et valg om kranen og nattbildet (1–2). Uten endringer i felles kode er 75 neppe innen rekkevidde med modellen alene.

### 10.10 Jonas' svar 11.11.2026 (valg 38 og 39)

Spurt om kranen (som nå, tilbake, eller bomstøtte) og utsparingen i taket (behold, eller taket som på tegningen med en lavere davit): «V38: ok» og «V39: behold».

- **Kranen står som nå**, foldet med den lave enden mot speilet og den høye forover (`CRANE_RY` π, `CRANE_X` 0,78). Ikke rør den i runde 3.
- **Utsparingen i taket over haleporten beholdes** (`ROOF_CUT`), som et godkjent avvik fra tegningen.

### 10.11 Runde 3 (12.11.2026): det fellesøktene rettet, og det som er rettet i modellen

Steg 88 runde 3, arbeidsrutinen på grenen `plan/2026-11-11-88` (PR #66), etter startmeldingen i `docs/planer/start/88.md`. Før-bildene er tatt på nytt med modellen fra runde 2 og dagens kode (OB14 er ute), etter-bildene med den nye; alle 25 operasjonene `tests/ombord.py sjarkny` nå har (`felles_kulde` er ny siden runde 2), begge formater, ingen droppet. Skrogformen, kranen (valg 38), utsparingen i taket (valg 39), vannlinja, `jukseMax` 4 og de to teinestablene er ikke rørt.

**Det OB14 og de andre øktene har rettet av fellesfunnene i 10.8 og backloggen, sett i før-bildene og i det opptaket skriver ut:**
- **Ledige folk står ikke lenger stive.** Når sløyingen er ferdig, spyler én dekket og en annen koster (`spyl:hose`, `kost:sweep` i `felles_rydd`, `felles_is` og `felles_loss`), og de som ikke har noe å gjøre i kulda, slår floke (`frys:cold`). Ved lossing og ising er alle fire i arbeid (kranen, kroken, luka, slangen).
- **Hvile er ikke lenger bare å stå:** i `felles_hvile` sitter de på en balje ved rekka med matpakka.
- **Den som har pause, sitter ikke lenger i teinestabelen** i noen av de 50 før-opptakene (punkt 2 i 10.8).
- **Står fortsatt, og er felles kode:** teina som svinges inn fra davitens blokk (`teiner_trekk`), tre tett i styrbord akterhjørne når line og garn settes (`line_sett`, `garn_sett`), flagget som henger i den som jukser akterst (`juksa_maskin`, `juksa_jig`), tre ledige mens lina settes, og mottakets kranbom over taket ved lossing.

**Rettet i modellen (`tools/boats/hs11.py`):**

| Det sensoren trakk for i 10.9 | Før | Nå |
|---|---|---|
| «Ingen slitasje å se» | `wear` endret fargen 3–5 %, og ingenting syntes i spillet | **Rustrenner** nedover sida under hver lensport og under lenseutløpet, og over den hvite lista der de krysser den; **mørke renner** under klampene på ripa; **skrubb** på lista og ripa; **sot** rundt eksosen i speilet (et eget felt 3 mm utenpå speilet i skrogets farge og malingssone, mørkt inn mot røret); **groe** i et bånd over vannlinjestripa og øverst på bunnstoffet; gelcoaten **krittet** midtskips der fenderne ligger; skitt langs skansens fot innenbords og litt rust rundt lensportene. Alt er farge per hjørne (`TINT`), ingen nye flater unntatt sotfeltet. Skroget har stasjoner hver 6. cm, så rennene blir striper. Dempet to ganger etter bildene fra spillet: rusten på sida fra 0,80 til 0,55 (for mye for en båt spillet selger som ny i 2027), og rusten innenbords fra 0,45 til 0,22 (syntes som en oransje flekk bak sløyebenken) |
| «Dekket uten struktur» | Gripefeltene var mørkere enn dørken (0,31 mot 0,40) og hadde farge bare i hjørnene på ruter på 45 cm | Feltene er **lysere enn dørken** (0,47) og har **opphøyde knaster** i kryssmønster (56 × 15 mm, 4 mm høye, 11 cm imellom, rundt 740 stykker): de skrå sidene fanger lyset, og feltene leses som sklisikring i spillet. Feltet er delt i ruter på knastenes deling (11 cm), med hjørnene midt mellom knastene: et hjørne under en knast ble svart i den bakte skyggen og ga mørke flekker i et rutemønster i spillet (sett i sløyingen, rettet og sett igjen). Slitasjen der de står og arbeider (ved haleren, ved benken, ved stampene) går mykt over feltet; en raskere støy ga også flekker og er tatt ut |
| Styrhuset «mørkt og nakent inne» | Skyggen som bakes inn (`bake_ao`), gjorde rommet til en mørk boks: veggene 0,86 ble rundt 0,35 i spillet | Alt inne i styrhuset er **løftet 1,6 ganger** i `wear` (`in_wh`, `WH_LIFT`; grensen følger fronten som lener seg forover, så baugdekket foran vinduene ikke løftes med, funnet i gjennomgangen), og taket har fått en himling inne. Den bakte skyggen ligger fortsatt oppå, så hjørnene er mørkere enn veggene. **Gasshendelen** sto på konsollens side mot midten og **VHF-en** i taket ved døra, begge utenfor bildet fra roret i begge formater; nå står hendelen på dashbordet ved skipperens venstre hånd, 0,26 m fra rattets sentrum (ringen 0,20: han når den uten å gå gjennom rattet; første utkast sto bak rattet og ble rettet etter gjennomgangen), VHF-en er felt inn i dashbordet over rattet, og mikrofonen henger på en klips over hendelen. Motorpanelet er flyttet 20 cm innover og gjort smalere, kompasset 5 cm |
| To rendringer ubrukelige | `c_work` sto over det lange taket og så bare tak; `c_shelter` sto 0,8 m fra dekkshusets aktervegg | `c_work` fra babord låring over speilet inn over arbeidsdekket; `c_shelter` fra akterkant av taket forover langs haleplassen mot styrhusdøra |
| Den hvite på mastetoppen utenfor nattbildet | `tests/hs11shot.py` tok nattbildene fra 13 m | Fra 22 m, så hele masta er med |

**Funnet utenfor modellen og rettet i runden:** drivende uten diesel om natta viste hun de to røde for «ikke under kommando» 1 og 2 m over det hvite på masttoppen, i lufta. Spillet (`lanterns` i `vessel3d.js`) henger dem nå der modellen har fiskelanternene på masta (rødt 1,05 m over hvitt), for alle båtene som har dem; sjekken i `tests/unit/sikker.test.mjs`, sett rød før. Under 12 m behøver hun dem ikke (regel 27 g), men spillet viser dem som før.

**Valg rutinen tok selv (kan snus):** (1) **Slitasjen på en båt som selges ny** (VESSELS: 2027): startmeldingen og sensoren ba om slitasje som synes, og den er lagt moderat (rusten dempet to ganger). Snus ved å senke faktorene i `wear()` (`RUST`-blandingen 0,55 på sida, 0,22 innenbords; `GRIME` under klampene 0,55). (2) **Ommaling tar slitasjen:** spillet bytter skrogets farge med malingen i sone 1 og 2 (`vessel3d.js` `emit`), så en båt som males om på verftet, står uten rust og skitt, som etter en ekte ommaling. Snus ved å legge slitasjen i `_PAINT`-kanalen ved eksporten (`bpyutil.mesh_arrays`, to ledige plasser) og blande den inn i malingen i `vessel3d.js`.

**Målt:** sotfeltet ligger 3 mm utenpå speilet. Kameraets nærplan er 0,25 m når det står nær båten (`view3d/24-cinema.js`), og med 24-bits dybde skiller spillet flater under 1 mm ut til 50 m og 3 mm rundt 110 m, der feltet er et par piksler; kanten har samme farge som speilet. Gripefeltene (5 mm over dørken) og knastene (4 mm over feltet) er innenfor det samme.

**Ellers:** `check()` grønn. `qa/flatnorm.py` som etter runde 1 og 2 (to flater på den runde mastesøylen, 20,6° mot grensen 20; ingen på vegger). `qa/clip_hs11.py` 0. Modellen er 69 330 trekanter nær (63 974 før; taket er rundt 300 000), fjernmodellen 2 613. Enhetstestene 3 345 OK.

### 10.12 Karakteren etter runde 3: 63/100, ikke ferdig

Satt 12.11.2026 av en ny uavhengig underagent som bare fikk 26 ark fra arbeidet om bord (tre bilder per operasjon i begge formater), 14 bilder fra spillet (utenfra, akterfra, fra roret, dekket, natta fra begge bauger, ovenfra, begge formater), 29 rendringer (`qa/hs11_wle.py` og `qa/hs11_uv.py`), `check()`-utskriften og skalaen. Den fikk ikke karakterene fra runde 1 og 2 og ikke denne teksten.

| Punkt | Vekt | Runde 1 (71) | Runde 2 (67) | Runde 3 | Sensorens begrunnelse (kort) |
|---|---|---|---|---|---|
| Skrogutforming | 20 | 15 | 14 | 14 | Én jevn flate, slag, støvelstripe, dyse med propell, vekta stemmer. Trekk: roret en flat kloss, kjølen og skoen bokser, stevnjernet et løst rør utenpå stevnen, nesten halvsirkelformet baug sett ovenfra |
| Detaljer | 20 | 14 | 13 | 12 | Mye smått holder (lensporter med rustrenner, leider, eksos, vinsj, brannslukker, rister, riffeldørk). Trekk: lista gnidd og uskarp, lyse firkantflekker på sida, rustrennene like kopier, tom takplate, ingen fendere ved kai |
| Lanterner | 5 | 4 | 3,5 | 4 | Rødt og grønt riktig fra hver baug, den hvite synes, fiskelysene riktig. Trekk: styrhuset fullt opplyst om natta |
| Styrhus | 10 | 7 | 6,5 | 7 | God utside; fra skipperens øye baugen og horisonten; gass, VHF, ekkolodd og plotter. Trekk: tykke stolper mellom frontvinduene, innvendige flater nakne |
| Arbeidsflyt | 25 | 16 | 16 | 13 | Gangen i arbeidet logisk. Trekk: folk gjennom hverandre og gjennom stampene (`line_settfull`, `line_riggfull`, `garn_riggfull`), kranen står foldet og stille under «kran», ingen ved trossene under «kast loss», redskapet hopper fra haleren til akterdekket, kranen, benken og livbøyene borte midt i lossingen sett ovenfra (`felles_lossn`) |
| Utforming av dekk | 20 | 15 | 14 | 13 | Planen god. Trekk: kort åpent akterdekk, stampeblokken fyller styrbord hekk, tre klemt under taket ved haleren, garnkaret og teinestabelen 3,5–5 m fra haleren |
| **Sum** | **100** | **71** | **67** | **63** | Under grensen på 75 |

**Min egen vurdering.** Tre sensorer, tre kjøringer, flere bilder hver gang; tallene kan ikke trekkes fra hverandre punkt for punkt. Det runden skulle løfte, ble sett: slitasjen («lensporter med rustrenner»), dørken («dekksplater med riffelmønster»), gass og radio fra roret, kameraene og nattbildet. Men sensoren trakk detaljene videre for selve teksturene (lista, flekkene, kopiene), og arbeidsflyten og dekket for det som ligger i spillets felles kode og ble sett tydeligere med 26 ark. Det som skal til for 75, ligger mest der (anslått 7–9 poeng av de 12), og runde 4 tar det (`docs/planer/start/88.md`).

**Det som mangler til 75, og hvor det ligger:**
1. **Folk gjennom hverandre og gjennom stampene** når line og garn settes eller rigges (`line_settfull`, `line_riggfull`, `garn_riggfull`): `deckcrew.js` (plassene og `kitBoxes` mot stampeblokken), og stampeblokken som fyller styrbord hekk (`STAMP0`, `stamp_box` i `hs11.py`, `gearMax.stamp`).
2. **Kranen gjør ingenting under «kran»** (`felles_kran`, `felles_krann`): båtens egen kran står foldet i alle tre bildene mens lasta løftes; `view3d/09-landing-deck.js` (kranen, `kit.crane`) og opptakets scene i `tests/ombord.py`. Undersøkes først: er det opptaket som tar bildene før kranen begynner, eller spillet som ikke bruker båtens kran?
3. **Kranen, benken og livbøyene borte i bildene ovenfra under lossingen** (`felles_lossn`, liggende): folkene og karene står der, utstyret ikke. Ikke funnet med vilje i koden (12.11.2026); første mistanke er at spillet bytter til fjernmodellen uten utstyr når kameraet står høyt. Mål før noe rettes.
4. **Ingen ved trossene under «kast loss», «hvile» som står ved ripa**, og redskapet som hopper fra haleren til akterdekket: felles kode (`deckcrew.js`, `view3d/10-gear.js`).
5. **Modellen:** lista (skrubben gir en gnidd, uskarp kant på nært hold; mykere eller ingen), de lyse firkantflekkene på sida (`chalk`, for grov støy mot stasjonene), rustrennene som like kopier (varier lengde og styrke per lensport), roret og skoen som profiler, stevnjernet inntil stevnen, og styrhusets innside (takpanel, kompass).

### 10.13 Runde 4 (12.11.2026): folkene i redskapet, kranen, lossingen ovenfra, og modellen

Steg 88 runde 4, arbeidsrutinen på grenen `plan/2026-11-12-88` (PR #69), etter startmeldingen i `docs/planer/start/88.md`. Før-bildene er tatt med dagens kode og runde 3-modellen for de operasjonene som var røde (`line_settfull`, `line_riggfull`, `garn_settfull`, `garn_riggfull`, `kran`, `krann`, `lossn`, `kast`), etter-bildene for alle operasjonene i begge formater. Skrogformen, kranen (valg 38), utsparingen i taket (valg 39), vannlinja, `jukseMax` 4 og de to teinestablene er ikke rørt. Målt før noe ble rettet, punkt for punkt i 10.12:

1. **Folk gjennom stampene** var felles kode: stampeblokken var 0,78 m i gangkartet mot 1,0 m i bildet, og redskapet sperret bare cellene med midten inni (celler på 0,2 m), så folkene sto med halve kroppen i stampene, garnkarene og teinene på alle båtene. Rettet i `deckcrew.js` (5.19g i `docs/systemer/folk-om-bord.md`), med en ny sjekk i `crewclip` (`kitHits`), rød på bygget fra før på hurtigsjarken, snekka, havsjarken, breisjarken og kyst15. I modellen sto den indre stampraden 6 cm inne på lukekarmen: `STAMP0` y −0,86, inntil karmen; gangen mellom stampene og skansens fot er 0,58 m (`check()` måler nå til stampene selv).
2. **Kranen sto stille under «kran»** i opptaket, ikke i spillet: kranen beveger seg høyst 0,2 s per bilde (`drawCrane`), og SwiftShader tegner ett bilde på noen sekunder, så bildene ble tatt før den hadde foldet seg ut. `tests/ombord.py` venter nå til den står utfoldet.
3. **Kranen, benken og livbøyene borte ovenfra under lossingen** var ikke fjernmodellen (mistanken): `drawDeck` hoppet over alt utstyret så lenge `b.land` sto. Rettet i `view3d/09-landing-deck.js`; flåten og livbøyene på taket står også nå.
4. **Ingen ved trossene under «kast loss»** var også opptaket: avgangen ble kalt før opptaket ventet på tre bilder (~30 s), og fortøyningene tas inn på ett spillminutt. Nå på den langsomme klokka fra avgangen.
5. **Modellen (`hs11.py`):** lista uten den gnidde kanten (skrubben er noen få mørke felt langs henne, hele listas høyde, så kantene er skarpe), ingen lyse firkantflekker (kritingen er en langsom vask langs fenderbåndet, uten støy over høyden), rustrennene ulike fra lensport til lensport (lengde, styrke, bredde og hvilken side som er tyngst, per port), roret med tykkere profil (18 % av korden), skoen en avrundet stang som smalner akterover, stagene til dysa som profiler, stevnjernet et halvrundt bånd 50 mm bredt og 12 mm ut, i ett stykke langs stevnens egen linje, og en takkonsoll over roret med brytere, lamper, merkestrimler, styrekompass, lyskasterens håndtak og bjelker i taket. `check()` grønn, `qa/flatnorm.py` som før (to flater på mastesøylen, 20,6°), `qa/clip_hs11.py` 0.
