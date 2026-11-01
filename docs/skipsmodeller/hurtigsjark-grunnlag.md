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
| A7 | **Sidelanternene uten skjerm på takkanten**: den røde synes fra styrbord baug (natt-bildet fra styrbord), og de sitter på et 0,3 m tykt tak | `lights` | H | `F.side_lantern` med skjerm innenbords på husets sider forut for vinduene, under takkanten (4,42) |
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
| 6 | Testene: `vessel3d hurtigsjark`, `brotest hurtigsjark`, `lanterntest`, `vesseltest`, `regmarktest`, `maletest`, `walktest`, `penshot` grønne; enhetstestene 245 OK. `deckshot` rød på kranen for alle fire båtene med kran (kyst15, kyst21, hurtigsjark, sjarkny): stillingen ble ikke nådd innen tidsgrensen | Kjørt på bygget før endringene (`dist-base`) for å se om feilen er ny (kap. 7, merknad) |

## 8. Selvvurdering

(Fylles ut når modellen er ferdig.)
