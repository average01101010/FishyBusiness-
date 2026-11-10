# Hurtigsjarken: byggegrunnlaget for revisjonen (F6)

> Grunnlaget for revisjonen av `hurtigsjark` («Brukt hurtigsjark 10,99 m, 500 hk»), skriptet `tools/boats/hurtig11.py`, etter malen i
> `sulebas-pilot-grunnlag.md` og arbeidsmåten i `sulebas-bygging.md`. Bestilt av Jonas 01.11.2026: «Løft den til samme nivå og arbeidsmåte som
> pilotbåten ringnot38 og de reviderte båtene». Med bestillingen fulgte ett bilde: et skjermbilde av spillets båthandel med dagens modell
> (sidebildet og databladet), ikke et kildebilde av en båt.
>
> Kildekoder: **P** lest av bildene Jonas viste 13.10.2026 (det første skriptet; bildene ligger ikke i repoet og hadde ingen målestokk),
> **R** spillets data og dokumenter, **J** Jonas' ord, **A** antatt (vanlig for typen, vårt valg), **M** målt på modellen.

## 1. Fakta om båten

| Hva | Verdi | Kilde | Følger for modellen |
|---|---|---|---|
| Type | Hardknekt planende plastsjark med skeg, styrhus forut for midten over lugaren, åpent skjul akter for huset, arbeidsdekk akter med luke og haleport til styrbord | R, P | Låst |
| Forbilde | Nor-Dan 10.99 (navnet står bare i skriptets kommentar og her) | P | Ikke i spillet: `VESSELS.hurtigsjark` og GLB-navnet («Used speed sjark 10.99 m») er rene |
| Lengde o.a. | 10,99 m | R | `vessel3d`: −6 % til +3 % |
| Bredde | 3,90 m | R | ±5 %; modellen 3,92 ved ripa, 3,98 over lista |
| Dypgang | 1,6 m med skegen | R | Skegens underkant 1,58 m under vannlinja |
| Deplasement | 12 t | R | `check()`: 13,7 t ved vannlinja fra bildene, 12 t seks cm høyere (kap. 7) |
| Maskin | 500 hk, planende | R | Fire-blads propell Ø 0,72 bak skegen, aksel gjennom skegens akterkant, profilror, våt eksos i speilet |
| Byggeår | 2009 | R | Gelcoaten kritnet litt i flekker, lista gnidd grå, striper under spygattene, dekket slitt der folk står (B16) |
| Lasterom | 5 000 kg med is, 8 m³; leveres i kar | R | Luke 1,20 × 1,10 m med lav karm og lokk av tårnplate |
| Farger | Gult skrog, svart liste og fartsstriper, hvit skansekledning og hus, gult tak, mørkt bunnstoff, svart vannlinjestripe, grått dekk | P (det første skriptet), R (sidebildet) | Sone 1 skrog, 2 stripe, 3 overbygg (taket også), 4 dekk: som før |

## 2. Reglene som gjelder modellen

- Ingen ekte navn, merke eller logo, heller ikke i GLB-ens `name`.
- Bare utsiden; gjennom vinduene synes konsollen, skjermene, rattet, stolen og benken.
- Ingen kjøpbart utstyr modellert inn: haleren, karene, sløyebenken, stampene, garnet, livbøyene, flåten, radarene og kranen settes av spillet
  (`hauler`, `work`, `kit`). Kista i styrbord hekk er kranens fot og står.
- Lanternene på lovlige plasser (kap. 5).
- Det spillet er avhengig av, beholdes: typenavnet `hurtigsjark`, sone 1–4 og alle ankrene; nye: `stairs`, `work.tub`, `fishR`/`fishW`, `work`.

## 3. Avgjørelser

| # | Spørsmål | Valg |
|---|---|---|
| B1 | Ombygging eller nytt skript? | **Nytt skript etter `havsjark35.py`.** Linjene fra bildene (P) beholdes som de ble lest: kjøl og stevn, slaget, knekken, ripa og halvbreddene; bare endene er satt der hver linje møter stevnen (slaget ved x 10,62, knekken ved 10,93; det første skriptet lot dem ende forbi stevnen, så baugen fikk en finne) |
| B2 | Skala | Tabellene i meter; `check()` regner modellen mot `VESSELS`, lanternereglene og spillets krav (kap. 15 i `sulebas-bygging.md`), og måler jevnheten i vannlinjene på sidene og i slaget, knekken og ripa i plan |
| B3 | Skegen | Del av skrogets snitt: snittet starter på skegens underkant og går opp sida inn i bunnen gjennom en hul rot. Halv bredde 0,07 ved foten, 0,10 ved rota (A); bratt akterkant foran propellen, buet forkant inn i bunnen ved x 7,6 |
| B4 | Bunnen | Rett V (P: 12,5° ved speilet, 17° midtskips), to sprutlister per side (A: 45 mm brede, 15 mm dype, flat underside og stående ytterside) som dør ut mot stevnen; slaget med en flate på 55 mm ut før sida reiser seg |
| B5 | Lista | Ekte avrundet gummiliste på knekken (A: 90 mm høy, 40 mm ut), svart, dør ut ved stevnen; det første skriptet malte bare en svart stripe |
| B6 | Dekket og lensportene | Arbeidsdekket lå i knekkens høyde (P 1,95), så første utkast lenset det gjennom rør til små spygatt under lista. **Jonas: «Har båten ingen spygatt?»** De leste ikke. Dekket er løftet til 2,16 (1,16 over vannet, over listas topp), og lensportene er skåret åpne gjennom skansekledningen ved dekket: 0,40 × 0,14 m, tre til babord og to til styrbord (kista står akter til styrbord) |
| B7 | Huset og skjulet | Styrhuset fra skottet (5,83) til fronten (8,55) over lugaren, gulvet på fordekkets høyde. **Akter for huset et åpent skjul** (4,30–5,80) med skjermer på ripa og store åpninger, under ett tynt tak som går fra 3,80 over arbeidsdekket til visiret over frontvinduene. Taket er 70 mm i kanten og 110 mm på midten (det første var 0,30 m: M «tykt massivt tak») |
| B8 | Husets bredde | 2,90 m (P: 3,24) så sidedekkene blir 0,33 m og spillets dekkskart kan gå forbi huset til fordekket |
| B9 | Inngangene | Styrhusdøra i akterveggen til styrbord, to trinn opp fra skjulets dekk til terskelen (0,56 m opp), bladet hektet åpent mot veggen; trinn opp til sidedekkene på begge sider av huset; lugaren nås fra styrhuset (en nedgang i skottet ble for lav da dekket ble løftet); `stairs`-ankeret for alle tre |
| B10 | Styreplassen | Skipperen står til styrbord ved x 7,18 bak rattet (0,42 m), stolen 0,42 m bak ham, øyet 4,35 (3,35 over vannet), konsollen under frontvinduene med dashbordet som skrår opp forover og plotteren, ekkoloddet og motorpanelet vendt mot ham, kompasset på toppen, VHF-en under taket. `hp` −0,26, `fov` 60: dashbordet 44° under øyet, inne i synsfeltet |
| B11 | Arbeidsflyten | Fiskeren i haleporten til styrbord (x 3,90), blødekaret rett akter for ham (3,05), spillets sløyebenk ved babord ripe tvers av luka (3,30) med den som sløyer innenfor, luka imellom; stampene under skjulet til babord, garnet midt i hekken, lasteplassen i babord hekk, kranen på kista i styrbord hekk |
| B12 | Vekta | 13,7 t ved vannlinja fra bildene mot 12 t i dataene: innenfor 15 %, og 12 t gir vannlinja 6 cm høyere. Bildene har ingen målestokk, og 12 t er trolig lett vekt; dataene står |

## 4. Gjennomgang før endring: avvikslista (01.11.2026)

Spillet viser Blender-modellen (`glbHas('hurtigsjark')` sann, 9 971 trekanter, delene lod0/glass/lod1, fire typede lys, sone 0–4, mast), ikke
byggesettets reserve. Før-bildene fra spillet: `tests/out/hu11_for_*_{liggende,staaende}.png` (`tests/hu11shot.py`, ny: ute, akter, bro, dekk,
natt fra styrbord, natt fra babord, ovenfra). Dagens modell rendret fra K1–K7: `tools/boats/out/qa/hu11for_*.png`. Spantrisset fra den gamle
snittfunksjonen: `tools/boats/out/qa/hu11for_lines.png` (bunnreisning 12,5° ved speilet, 17° midtskips; slaget 0,2 m under vannlinja akter).
`qa/fair.py` på det gamle skriptet: kantene tvers over stasjonene ved baugen summerer seg til 50–100° (x 10,15–10,9), og radene ved slaget
(z 0,7–0,9) til 210–465° per 0,1 m: slaget og sprutlista er knekker der de ikke skal være, og baugen knekker fra kjølen til ripa.

| # | Avvik | Hvor | Alvor | Tiltak |
|---|---|---|---|---|
| A1 | **Skroget er ikke én flate**: to rutenett (babord, styrbord) som ikke deler punkter i kjøllinja, speilet et eget rutenett, skegen en egen loftet kropp hengt under bunnen (to flater i samme rom ved rota) | `hull_p`, `hull_s`, `transom`, `skeg` | H | Ett nett: snittet fra skegens underkant over bunnen med listene, slaget, sida, lista, skansekledningen, speilet, kappen, innsida, dekket, skottet og fordekket deler punkter (B3) |
| A2 | **Åpningene er ikke hull**: lensportene og haleporten mørke plater på skansen, døra og nedgangen plater på veggen, luka en kasse | `decks`, `house` | H | Ekte hull med lysning: lensportene ved dekket (B6), haleporten som et hakk i ripa med rulle, lasteromsluka ned i rommet, forluka, eksosen og lensepumpas utløp; styrhusdøra med karm og blad (B9) |
| A3 | **Baugen knekker** (fair.py: 50–100° per stasjon ved x 10,15–10,9): slaget og knekken løp forbi stevnen og ble klemt med `max`, så snittet fikk en finne og hoppet | `base_section` | H | Linjene ender der de møter stevnen (B1); vannlinjene og linjene i plan måles i `check()` |
| A4 | **Skipperen står i rattet og stolen** (rattet x 7,17, stolen 7,15, skipperen 7,15) | `house`, ankrene | H | B10 |
| A5 | **Skjermene vender feil** (toppen mot skipperen, flaten ned) og står utenfor synsfeltet; broa i spillet er svarte stolper og en mørk himling | `house`, `hp` | H | Dashbord som skrår opp forover med skjermene i det, tynne sprosser, lys himling, `hp` −0,26 (B10) |
| A6 | **Sløyebenken står i haleporten** (benken 3,5–4,0 til styrbord, porten 3,55–4,25): fiskeren ved haleren og den som sløyer står på samme sted | `house`, `work` | H | Benken er spillets, ved babord ripe tvers av luka (B11) |
| A7 | **Sidelanternene uten skjerm på takkanten**: den grønne synes fra babord baug gjennom styrhuset (natt-bildet fra babord), og de sitter på et 0,3 m tykt tak | `lights` | H | `F.side_lantern` med skjerm innenbords på husets sider forut for vinduene, under takkanten (4,42). Etter-bildet viste den grønne fra babord fortsatt: spillets lysskinn tegnet side- og hekklys hele veien rundt, på alle båter. Rettet i spillet (`24-cinema.js`: sidelanternene fra rett forut til 22,5° akter for tvers på egen side, hekklyset 67,5° til hver side akterut, vedlegg I 9(a)) |
| A8 | **Ingen fiskelys** | `lights` | M | Rødt over hvitt rundtlysende på en arm akter for masta (8,55 og 7,50; kap. 5) |
| A9 | **Taket er en blokk på 0,30 m** med visir som en kloss (M) | `house` | M | Tynt tak med gul kant, dryppkant og bue (B7) |
| A10 | **Flate sider** (M3: ingen lister, lensporter eller beslag) og **mørke flekker på skrogsida** (M11: bakt AO på store trekanter) | `hull` | M | Lista, sprutlistene, slagflaten, spygattene med krage, slitasje per hjørne (B16); skroget i tette stasjoner (0,06 m) så AO-en blir jevn |
| A11 | **Skegen og propellen**: skegen en egen kropp, propellen fire håndlagde blad uten nav og vridning, roret en plate | `underwater` | M | Skegen i snittet (B3), `F.propeller` Ø 0,72 på aksel ut av skegens akterkant med lager og anode, `F.foil_rudder` med stamme og lager, sinkanoder på skegen og speilet, ekkoloddgiver, sjøvannsinntak |
| A12 | **Mannskapsplass på lukelokket** (`crewSpots` 2,6/0/ZMD+0,26) | ankrene | M | Fire plasser på dekket (B11) |
| A13 | **Hekklyset 7,7 m oppe** på aktermasta, flaggstanga og hekklyset i samme punkt | `lights`, `pole` | M | Hekklyset på en stolpe over speilets midte (3,22); flagget på aktermastas topp (5,60), 6,4 m fra den hvite |
| A14 | **Ingen trinn** fra arbeidsdekket (1,95) opp til styrhusgulvet og fordekket (2,70): 0,75 m | `house` | M | Dekket løftet til 2,16 (B6); to trinn til døra og til hvert sidedekk, `stairs` (B9) |
| A15 | **Fordekket ved baugen**: baugrulla og ankerspillet sto i lufta over et 0,7 m dypt fordekk innenfor ripa | `decks` | M | Fordekket stiger til stevnens topp fra x 9,95 (ankerbrønnens lokk); rulla på braketter på det |
| A16 | Ingen slitasje, ingen `lodm`, ingen trinn, ingen dører i ankrene utenom to plater | eksport, ankrene | L | B16-slitasje, `lodm` når lod0 > 40 000, `doors` med `in`, `stairs` |
| A17 | Mastene: A-rammens bein uten fotplater på et tykt tak, rekkverket rundt taket i lufta over kanten | `house` | L | Fotplater på det tynne taket, rekkverket på stolper innenfor kanten rundt den aktre delen og sidene |

**Det som var bra og beholdes:** linjene fra bildene, fargene og stripene (gult, svart, hvitt, fartsstripene som slutter i streker akter),
A-rammemasta med tverrsalinger, radarbraketter og hiveblokk, den slanke aktermasta, kista i styrbord hekk som kranens fot, plassene for
utstyret (flåten på taket, garnet i hekken, lasten i babord hekk).

**Pynt (gjøres uten å vente):** tynt tak med gul kant og dryppkant; ekte avrundet svart liste; to sprutlister og slagflate; svakt kullet side;
fartsstripa spisset forut og strekene akter kortere mot hekken; åpne lensporter; vindusviskere; arbeidslys under takkanten og på salingen; rekkverk med foter og pulpit; stevnbeslag;
sugelufter, pullerter og klamper; kritt og gnisning i gelcoaten.

**Bilder som ville hjulpet (ikke i repoet):** et sidebilde av en 10,99-sjark av denne typen med kjent målestokk (eller en generalarrangementstegning),
bilder rett forfra og akterfra, ovenfra (dekksplan), innsiden av styrhuset og arbeidsdekket med haleporten. Med dem kan linjene, husets mål og
vinduene måles i stedet for å leses av.

## 5. Lanternene

| Lys | Plass | Regel |
|---|---|---|
| Hvit rundtlysende (under 12 m: i stedet for topplys og hekklys) | A-rammemastas topp, 9,65 m | Minst 1 m over sidelanternene (vedlegg I 2(d)): 5,23 |
| Side, rød/grønn med skjerm | Husets sider forut for vinduene, under takkanten, 4,42 m | Høyst tre firedeler av den hvites høyde over skroget (2(g)): 1,38 mot 5,01 |
| Hekklys | Stolpe over speilets midte, 3,22 m | (båten fører det i tillegg) |
| Fiske: rødt over hvitt rundtlysende | Arm akter for masta til babord, 8,55 og 7,50 m | Minst 1 m imellom under 20 m (1,05); det nedre minst to ganger avstanden over sidelanternene (2(j)): 3,08 mot 2,10 |
| Arbeidslys | Under takkanten akter, på den nedre salingen | – |

## 6. Arbeidsflyten og plassene

Fiskeren står ved haleren i haleporten til styrbord (x 3,90; terskelen 0,44 m over dekket), blødekaret er rett akter for ham (3,05), den som
sløyer står innenfor spillets sløyebenk ved babord ripe tvers av luka (3,30), luka er imellom, og den fjerde står akter for luka. Skipperen går
opp trinnene fra skjulet og inn døra til styrbord i husets aktervegg og står bak rattet. Stampene står under skjulet til babord (4,90), garnet
midt i hekken, lasteplassen i babord hekk, kranen på kista i styrbord hekk.

## 7. Kritikksløyfen

| Runde | Hva ble sett | Hva ble gjort |
|---|---|---|
| 0 (før) | Før-bilder i begge formater, `fair.py`, spantrisset, K1–K7 | Avvikslista (kap. 4) |
| 1 | Nytt skript; `check()` grønn utenom vekta på første forsøk (13,86 t, 15,5 % over): bunnen gjort rett V, 13,70 t. `fair.py` på det nye skroget: 100° tvers over stasjonene ved x 10,0 og 10,5, der tabellene fra bildene skiftet stigning, og fordekkets rampe for bratt | Tabellene lest med en monoton kubisk kurve (`pchip`), rampen slakket (9,70–10,62). Gjenværende knekker er listene, slaget og skegens rot (med vilje) |
| 2 | K1–K7 og nærbildene: ren profil, ekte hull, skjul og trinn. Broa: skipperen sto bak stolpen mellom frontrutene (svart stolpe midt i synet), en vindusvisker sto loddrett i synsfeltet; fartsstripas streker akter leste som vinduer | Skipperen midt bak styrbords rute (y −0,46), viskerne parkert langs rutas underkant, strekene kortere mot hekken |
| 3 | Eksport: lod1 4 461 trekanter; Node-testen fant 13 383 punkter i lokalflåten mot 12 000 (tre punkter per trekant) | Ankerspillet en kloss og lanternene enkle i fjernversjonen: 3 225 trekanter, 9 675 punkter |
| 4 | **Jonas: «Har båten ingen spygatt?»** Spygattene var små rør under lista og leste ikke | Arbeidsdekket løftet til 2,16 over lista, åpne lensporter gjennom skansekledningen ved dekket (B6); haleporten 0,44 over dekket, to trinn opp; lugarnedgangen i skottet fjernet |
| 5 | Klipp-kontrollen (`qa/clip_hurtig11.py`, ny): 44 punkter: døras karm under dekkets bue, ankerspillets fot og kista 2–3 cm ned i dekket, kista inn i skansen akter (bredden målt ved 0,8 m, ikke ved kistas akterkant) | Rettet: 0 |
| 6 | Testene: `vessel3d hurtigsjark`, `brotest hurtigsjark`, `lanterntest`, `vesseltest`, `regmarktest`, `maletest`, `walktest`, `penshot` grønne; enhetstestene 245 OK. `deckshot` rød på kranen for alle fire båtene med kran (kyst15, kyst21, hurtigsjark, sjarkny): stillingen ble ikke nådd innen tidsgrensen | Ikke min: feilen rammer også de tre kranbåtene jeg ikke har rørt. Kjøringen på bygget før ble avbrutt (Jonas: «Du bestemmer selv hva du mener er relevant å teste»); ført i BACKLOG |
| 7 | Etter-bildene i spillet (liggende): broa med dashbord og skjermer, dekket med lensportene, kranen på kista. **Natt fra babord baug: den grønne synes gjennom styrhuset** | Spillets lysskinn følger nå lanternenes sektorer (A7); `lanterntest` og nattbildene tatt på nytt |

## 8. Selvvurdering

**Karakter: 62/100: ikke godkjent** (grensen er 75/100, Jonas 01.11.2026; satt etter at vurderingen ble skrevet). Det som må til for å nå den: et overlegg mot bilder i kjent målestokk, vekta nærmere 12 t, etter-bilder i stående format, og en runde der Jonas ikke finner noe selv. Skroget er én flate med skegen, listene og slaget, linjene fra bildene er glatte, hullene er ekte, broa er tegnet fra
skipperens øye, lanternene er lovlige med fiskelys, arbeidsflyten henger sammen (fiskeren i haleporten, karet akter for ham, benken til
babord), klipp-kontrollen står på 0 og alle kontrollene i `check()` er grønne. Trekk: (1) Jonas måtte spørre etter lensportene: jeg valgte
spygatt under lista som var riktige på papiret, men som ikke synes; (2) treg økt: før-bildene i spillet tok 50 minutter, og en rød
kranprøve som ikke var min, kostet nesten en time før jeg så at den rammet båter jeg ikke hadde rørt; (3) en redigering dupliserte halve
skriptet (hentet tilbake fra git), og en testrunde startet mot en gammel eksport; (4) ingen overlegg mot bildene (de ligger ikke i repoet),
og bunnen, skegen og husets inndeling er antatt; (5) 13,7 t mot 12 t; (6) etter-bildene i spillet bare i liggende format (modellen er lik i
begge, og brukerflaten er ikke endret).

## 9. OB9: arbeidet om bord, bremmen og karakteren etter Jonas' skala (10.11.2026)

Steg 87 i `docs/planer/koen.md`, Jonas' økt på grenen `claude/ob9-hurtigsjarken-75-jtun77`. Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting». Før- og etter-bildene er tatt med `tests/ombord.py hurtigsjark`, bare bilder, begge formater; arkene ligger i `docs/okter/2026-11-10-ob9/`.

### 9.1 Bildene av typen (valg 22 B)

**Bildene kunne ikke hentes i denne økta.** Bildeserveren (`upload.wikimedia.org`) svarte 429 med «Your request does not comply with our robot policy» på hver forespørsel, også originalene, og miniatyrene er flyttet til `thumb.wikimedia.org`, som skyøktas nett ikke slipper til. Beskrivelsessidene på `commons.wikimedia.org` svarte, så bildene under er valgt etter beskrivelsen og kategoriene, ikke sett av meg. Bilde 1–3 er de samme som OB8 så på og Jonas sa ja til («Ja, bruk dem»); 4–6 er nye og usette. Lisensene er ikke lest; bildene er referanse for planen, ikke lagt inn i spillet, og ligger ikke i repoet.

| # | Bilde (Wikimedia Commons) | Hva det viser (etter beskrivelsen) | Sett |
|---|---|---|---|
| 1 | [SJARK … (SANGIS R-5-S 10,5x4,6m 2000) … Foto fra Jorenholmen P-hus A.jpg](https://commons.wikimedia.org/wiki/File:SJARK_fiskeb%C3%A5t_fiskegarn_Salg_av_fisk_fra_b%C3%A5t_ved_kai_(SANGIS_R-5-S_10,5x4,6m_2000)_%C3%98STERV%C3%85GKAIEN_Stavanger_havn_harbour_NORWAY_2022-03-29_Sale_from_fishing_boat_Garnrulle_Net_drum_winch_Foto_fra_Jorenholmen_P-hus_A.jpg) | En plastsjark fra 2000, 10,5 × 4,6 m, ovenfra ved kaia: styrhuset forut, garnhaleren på styrbord, sorteringen midt, garnrulla akter og garnet ut over hekken. Nærmest hurtigsjarkens dekksplan | av OB8 |
| 2 | [samme båt, B](https://commons.wikimedia.org/wiki/File:SJARK_fiskeb%C3%A5t_fiskegarn_Salg_av_fisk_fra_b%C3%A5t_ved_kai_(SANGIS_R-5-S_10,5x4,6m_2000)_%C3%98STERV%C3%85GKAIEN_Stavanger_havn_harbour_NORWAY_2022-03-29_Sale_from_fishing_boat_Garnrulle_Net_drum_winch_Foto_fra_Jorenholmen_P-hus_B.jpg) og [C](https://commons.wikimedia.org/wiki/File:SJARK_fiskeb%C3%A5t_fiskegarn_Salg_av_fisk_fra_b%C3%A5t_ved_kai_(SANGIS_R-5-S_10,5x4,6m_2000)_%C3%98STERV%C3%85GKAIEN_Stavanger_havn_harbour_NORWAY_2022-03-29_Sale_from_fishing_boat_Garnrulle_Net_drum_winch_Steinkarkaien_Foto_fra_Jorenholmen_P-hus_C.jpg) | Samme sjark fra andre vinkler (beskrivelsen: «fibreglass … net drum/winch for handling fishing nets»): arbeidsdekket akter og hekken | B og C nei |
| 3 | [Fishing boat Henningsvær DSC03772.jpg](https://commons.wikimedia.org/wiki/File:Fishing_boat_Henningsv%C3%A6r_DSC03772.jpg) | En sjark fra siden med styrhuset forut og arbeidsdekket akter | av OB8 |
| 4 | [Sjark.jpg](https://commons.wikimedia.org/wiki/File:Sjark.jpg) | «Sjark i Ravnkloa, Trondheim» (2009) | nei |
| 5 | [IMG 7024 Fiskebåt på Abelvær - sjark.jpg](https://commons.wikimedia.org/wiki/File:IMG_7024_Fiskeb%C3%A5t_p%C3%A5_Abelv%C3%A6r_-_sjark.jpg) og [IMG 7027-sjark abelvær.jpg](https://commons.wikimedia.org/wiki/File:IMG_7027-sjark_abelv%C3%A6r.jpg) | «Sjark i havna på Abelvær» | nei |

Søkene som ble prøvd (søkesiden med `ns6`): «Nor-Dan», «hurtigsjark», «plastsjark», «sjark fiskebåt», «sjark Lofoten», «sjark Senja», «fishing boat Henningsvær/Svolvær/Ballstad», «Fishing boats in Lofoten», «Selfa», «Viksund fishing», og kategoriene `Sjark` og `Fishing boats of Norway`. Ingen bilder av en planende 10–11 m hurtigsjark med haleport ble funnet med navn eller kategori; bilde 1 er nærmest. Det som avgjør plassene under, er spillets egne mål (`check()`, `deckpoints`, sonden) og arbeidet slik planlisten og havsjarkens grunnlag beskriver det, ikke bildene.

### 9.2 Dekket målt og plassene

Målt i spillet før endringen med en liten sonde (som OB8: kjernen setter båten i juksa, fyller karet og skriver ut hvor folkene står etter 20 s; modellens x fra speilet, y babord +). **Juksa:** jigRail ga seks plasser, alle fire som ble brukt på styrbord: x 5,55 (i trinnene og døra til styrhuset), 4,85 (under taket like forut for haleporten), 2,40 og 1,35 (ved den foldede kranen). **Sløying:** de to ved benken sto 0,61 m fra hverandre (x 3,40 og 2,79), side om side men tett; i før-bildet ser de ut til å stå inni hverandre fordi kameraet ser langs dem. **Benken og stampene:** benken (spillets, 0,62 × 1,6 m) sto x 2,44–4,16, mens stampeblokken med åtte (`deckcrew.js` `kitBoxes`) sto x 3,08–5,22 over den samme dørken på babord: med lina om bord sto benken i stampene. **Kranen:** den foldede kranen ligger langs styrbord skanse fra kista (x 0,25–1,40) og forover til like akter for blødekaret (rundt x 2,1, sett ovenfra i `juksa_sloy_staaende_2.jpg`), så styrbord akter har ingen fri ripe for juksa. **Settingen:** spillet setter over hekken 0,45 m til styrbord i midjehøyden + 0,10 (`drawSetting`), her 3,00 m over kjølen mot hekkens topp 2,88: redskapet går fritt over hekken, så ingen setteport trengs (OB8s valg A gjaldt havsjarkens høye skanse).

| Plass | Modellens x, y | Hvorfor |
|---|---|---|
| Sløyebenken (`work.table`, `BENCH`) | x 2,40 (før 3,30), y 1,55 | Langs babord ripe tvers av luka (luka x 1,75–2,95): fisken går rett ned i rommet, og benken står fri av stampene. Nummer to står 0,61 m forut for den første (sonden etter: x 2,39 og 3,00) |
| Stampene (`kit.stamps`, `STAMP0`) | første rad x 5,30 (før 4,90), y 0,95 (før 1,30) | Under skjulet til babord, innenfor gangen langs babord ripe: blokken med åtte (spillets boks, `stamp_box()`) x 3,48–5,62, y 0,24–1,14, forut for benken med 0,22 m imellom, innenfor trinnene opp til sidedekket (y fra 1,50) og fri for juksaplassene ved ripa (gjennomgangen 10.11.2026: med y 1,30 sto begge babords juksaplasser i blokken) |
| Juksaplassene (`anchors.jigZ`, ny) | babord 3,70, styrbord 4,95, babord 4,75 | Begge sider, over en meter imellom på samme side, ingen i haleporten (3,52–4,28), ved haleren, i døra og trinnene (fra 5,30), ved kranen eller under flaggmastas stag (til 1,90). Tre plasser for tre om bord; den fjerde i sonden (fire agenter) står ledig |
| Babords gripelist | fjernet | Benken står langs skansen der den var (1,60–2,90) |
| Spillets vannlinje (`WLE`) | 5 cm under tegningens | Valg 18 A: 11,99 t mot 12 t (`check()`, `qa/stubcheck.py`: 13,59 t ved tegningens) |

### 9.3 Det som er endret

- **Bremmen på styrhustaket** (valg 26): rundt hele takkanten, også ut over skansen over skjulet og visiret foran, med underkanten der den gamle leppen var (så haleporten og gangen ved huset har samme takhøyde): en kant på 3 cm med dryppkanten under, flaten skrår 0,10 m inn og 0,18 m opp, kronen 4 cm. Svart som stripene og lista, i stripenes malingssone (sone 2), så den følger malingen. `check()`: dryppkanten 1,90 m over sidedekket og 2,44 over arbeidsdekket (dekkskartet 1,85). Masta, stagføttene, rekka, lyskasteren, flåten og radarbrakettene står på kronen (`roof_top`).
- **Styrhusveggene uten striper:** de skarpe kantene merkes på nytt etter at vinduene og døra er skåret ut (`shade(shell, 5)`). `qa/flatnorm.py`: 82 flater opptil 74° skjevt før, 0 etter.
- **Plassene** som i tabellen; `check()` har to nye linjer: benken og stampeblokken fra hverandre med fritt dekk for nummer to 0,7 m forut og akter (en kropp 0,25 m bred til hver side), og juksaplassene på begge sider fri for det som står på ripa og for stampeblokken. Begge ble sett røde med stampene der de sto i første utkast (5,10 / 1,30) og grønne etter.
- **Badestigen i hekken** (`vessel3d.js` `LADDERS.hurtigsjark`): spillets forlengelse under modellens stige er løftet 5 cm med den nye vannlinja, så det ikke blir en glipe (gjennomgangen).
- **Vekta** (valg 18 A): formen står, spillets vannlinje `WLE = WL − 0,05` (som `plast31.py`), så den tomme båten ligger 5 cm høyere i sjøen; malingen står der formen har den.
- **`STAB_AT.hurtigsjark`** (`core/03c-stability.js`) lest på nytt: `dy` 1,21, benken z 3,1, stampene x −0,95, z 0,2. Ny sjekk i `tests/unit/trim.test.mjs` som leser modellens eksporterte ankre og sammenligner hele tabellen, sett rød mot den gamle (dy, table og tub) og grønn etter.
- **`crewclip`**: hurtigsjarken med i F19-lista (to ved samme bord minst 0,55 m imellom). Ikke sett rød: før-bygget ga 0,61.
- **Spygattene** var alt åpne uten klaffer (runde 4), og klasjsjekkens unntak nevner ikke klaffer. **Pyntefenderne:** modellen hadde ingen igjen, bare kommentaren, som er rettet.
- **Klasjsjekken** (`qa/clip_hurtig11.py`): 0 punkter, som før.

### 9.4 Etter-bildene og det som står igjen

Etter-bildene (`tests/ombord.py hurtigsjark`, begge formater, alle operasjonene: taket, vannlinja og plassene er endret, så ingen ble droppet; linesettingen og linetrekket tatt på nytt etter at stampene ble flyttet i gjennomgangen) og arkene i `docs/okter/2026-11-10-ob9/`: bremmen synes rundt hele taket, svart mot det gule; de som jukser, står på begge sider under skjulet og på babord ved takkanten, ingen i haleporten, døra eller ved kranen (F21 rettet); de to som sløyer, står side om side ved benken tvers av luka (F19: 0,61 m, som før, men nå med benken fri av stampene). **Står igjen:** (1) **Ingen akter ved stampene når det settes** (F4, OB3), og lina går fra stampene under skjulet på skrå over dekket til hekken. (2) **Tre i klump ved haleren når teinene trekkes** (de to som sorterer, står skulder i skulder med haleren rundt karet; `deckcrew.js`, ikke modellen). (3) **Ingen kjører kranen** (F23, OB4). (4) **`jukseMax` 6 mot tre juksaplasser:** maskin 4–6 tegnes ikke (valg 31 i køen). (5) De to ved benken står 0,61 m fra hverandre, side om side men tett (spillets `deckAt` gir 0,7 m og runder til rutene). (6) Babords gripelist er tatt bort der benken står; livbøya på babord akter (`kit.buoys`) henger ved flaggmastas stag, ikke på en list.

### 9.5 Karakteren (forslag; Jonas setter den)

Etter Jonas' skala (valg 17, `om-bord.md` kap. 2). Forslaget i OB0 var 59 etter en annen skala.

| Punkt | Vekt | Forslag | Begrunnelse |
|---|---|---|---|
| Skrogutforming | 20 | 14 | Skroget er én flate med skegen, listene og slaget, jevne vannlinjer og linjer i plan (`check()`), den tomme båten 11,99 t mot 12 ved spillets vannlinje (valg 18 A). Trekk: linjene er lest av bilder uten målestokk, og bildene av typen kunne ikke ses i denne økta |
| Detaljer | 20 | 15 | Ekte hull med lysning, åpne spygatt uten klaffer, bremmen, plane vegger uten striper (0 skjeve flater), klasjsjekken 0, stigen hel. Trekk: materialene er ikke PBR (F2); ingen setterenne akter (F9) |
| Lanterner | 5 | 4 | Lovlige plasser og sektorer (`check()`, `lanterntest`), sidelanternene under bremmens underslag; ikke sett om natta i denne økta |
| Styrhus | 10 | 8 | Konsollen, rattet, stolen og utsikten fra skipperens øye som før (`check()`, `brotest`), taket med bremmen og plane vegger |
| Arbeidsflyt | 25 | 18 | Benken tvers av luka med fisken rett ned, to side om side, juksa fordelt fritt for haleporten, døra og kranen, settingen fritt over hekken. Trekk: ingen akter ved stampene (F4), tre i klump ved haleren i teinetrekket, ingen kjører kranen (F23) |
| Utforming av dekk | 20 | 16 | Haleren, blødekaret, benken og luka samlet midt på dekket, stampene under skjulet fri av benken og juksaplassene, kranen og frakten akter, teinestabelen midt på dørken. Trekk: tre juksaplasser mot `jukseMax` 6, stampene langt fra hekken der lina går ut |
| **Sum** | **100** | **75** | På grensen. Ingen funn med alvor A igjen som er hurtigsjarkens egne; det som trekker, er felles kode (F4, F23, klumpen ved haleren) og spørsmålet om juksamaskinene |

Jonas setter karakteren.
