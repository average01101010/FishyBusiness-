# Breisjarken (Sjark 36 fot med bakk og ly): byggegrunnlaget for revisjonen (F5)

Revisjonen av `breisjark` (`tools/boats/malo36.py`) etter pilotbåtens arbeidsmåte (`sulebas-bygging.md`), 02.11.2026. Bestillingen står i
`prompt-blender-revisjon.md`. Malen for koden er `havsjark35.py` (en tung rundbunnet sjark med kjøl og bakk), ikke for formen: formen
er tegningens.

## 1. Fakta om båten

| | |
|---|---|
| Type i spillet | `breisjark`, «Sjark 36 fot med bakk og ly», åpen gruppe, h10 i lukket gruppe, 9 mill. kr |
| Forbildet | Generalarrangementet og databladet for en 36 fots sjark på 10,99 m fra 2014 (verftet og merket står bare i `3d-baater-og-animasjon.md`, aldri i spillet) |
| Hovedmål (databladet) | LOA 10,99, bredde 4,20 (4,40 over fenderne), dybde 2,34, høyde med mast rundt 9,5 m, lasterom 19 m³, 300 hk, rundt 10 kn |
| `VESSELS` | `len` 10,99, `beam` 4,2, `draft` 2,0, `disp` 20, `year` 2015, glassfiber, 4 køyer, `crewMax` 4, `std` plotter og VHF |
| Kildene i repoet | Bare tabellene i skriptet, målt på tegningen 02.10.2026 (stasjonene 1 m fra hverandre, 92,4 px/m). **Tegningen ligger ikke i repoet**, og ingen bilder er lagt ved denne økta |
| Rammen | x forover fra aktre perpendikulær, y til babord, z opp fra grunnlinja; vannlinja z = 1,38 |

## 2. Reglene som gjelder modellen

- Bare utsiden; ingen kjøpbart redskap modellert inn (haleren, karene, flåten, radaren og livbøyene er spillets, på plassene i `kit`).
  Skipets egne systemer (galgen over hekken med nettrulla, bommene, vinsjen, haleporten) er skrog og står.
- Ingen ekte navn (B20): GLB-ens `name` var merkenavnet, nå «Sjark 36 fot med bakk og ly».
- Lanternene etter sjøveisreglene (FOR-1975-12-01-5, vedlegg I), sjekket i `check()`.
- Spillets krav (`sulebas-bygging.md` kap. 15) regnet i `check()` før overbygget ble formet: dekkskartet (1,85 m over dekk, lenkene,
  tak over rom), broa (1,8 m, synsfeltet), navnet mot merket, bredden og lengden i `vessel3d`.

## 3. Avgjørelser

- **B1 Formen:** tabellene fra tegningen beholdes (kjøllinja og forfoten, stevnen, ripa med trinnene, halvbreddene ved ripa, speilets
  fall, fenderlista, lyet, styrhuset og vinduene, mastene og galgen). Snittene under ripa sier ikke tegningen noe om; de er mitt valg,
  og de er det som rettes for vekta.
- **B2 Vekta:** det gamle skroget veide 28,6 t, og 29,5 t med skegen, ved tegningens vannlinje mot `disp` 20 t. Kroppen er gjort
  slankere (mer bunnreisning, kimmingen som én kubisk kurve), men ikke helt ned til 20 t: en breisjark med 19 m³ lasterom ved
  tegningens vannlinje er trolig ikke lettvekt. Nå 21,9 t; 20 t gir vannlinja 6 cm lavere. `VESSELS` er ikke endret (spørsmål 1).
- **B3 Kjølen i snittet:** dødveden fra akterstevnen (x 1,0) forover til den løper inn i kroppen (x 6,6) er en del av skrogets snitt
  (havsjark35-oppskriften), ikke en egen kropp.
- **B4 Ripa over et jevnt referansesnitt:** ripa hopper 0,9 m opp ved bakken og 0,7 m ned akter for lyet. Kurven i snittet tegnes til en
  jevn linje over ripa og klippes ved ripa, så hoppene ikke endrer formen under (første forsøk ga en knekk i vannlinja ved x 6,42).
- **B5 Små avvik fra tegningen for spillets krav:** styrhusets vegger 8 cm høyere (5,18 mot 5,10: 1,85 m fri høyde over dørken med
  dekkets bue, `DM_HEAD`), styrbord vegg 4 cm inn (gangen 0,45 m for dekkskartet), fiskelyset rødt 10 cm høyere (1,07 m mellom rødt og
  hvitt, loven krever 1 m; tegningens 0,97 var for lite), propellen 1,06 mot 1,10 m (klaringen til skroget over).

## 4. Gjennomgang før endring: avvikslista (02.11.2026)

Spillet viser Blender-modellen (`glbHas` sann, `buildVesselModel(..).glb`, 25 133 trekanter, delene lod0, glass og lod1, alle ankrene).
Før-bildene er tatt i spillet i begge formater (`tests/ma36shot.py`, `TAG=for`).

| # | Funn | Kravet | Tiltak |
|---|---|---|---|
| A1 | **Vekta:** 28,6 t i snittet + 0,9 t skeg = 29,5 t ved tegningens vannlinje mot 20 t; vannlinjebredden 95 % av største bredde | D8, kap. 13 | Kroppen som kubisk kurve med fyldighet, mer bunnreisning: 21,9 t, 85 % |
| A2 | **Skegen er en egen kropp** (en kasse loftet under skroget), med en skarp skjøt | kap. 7, 13 | Kjølen i snittet |
| A3 | **Skroget er løse flater:** to sidegrid og en speilstige, innsida av skansen, kappen og dekkene som egne grid | kap. 4.1 | Én flate (`Mesh`) |
| A4 | **Bule i baugen:** vannlinjene knekker 0,038 m per 6 cm-steg ved x 9,62 (`fair.py`; grensen er 0,02) fordi kimmingen er en bue fra en hjørnevinkel | kap. 16 | 0,008 |
| A5 | Tabellene lest med rette stykker (`interp`): knekk der stigningen skifter | kap. 17 | `pchip` |
| A6 | **Lensportene er svarte plater** på skrogsida, ikke hull | kap. 7, 16, 17 | Ekte hull gjennom skansen ved dekket, tre per side |
| A7 | Fargegrensene vannrette (bunnstoffet, vannlinjestripa) | planliste kap. 29 | Stiger 12 mm per meter forover |
| A8 | **Fiskelysene 0,97 m fra hverandre**; loven krever minst 1 m (vedlegg I 2(i)). Lysene er ikke typet (`fishR`/`fishW`), så spillet tegnet sine egne ved mastetoppen | LYS-04 | 1,07 m, typet |
| A9 | **Sidelanternene er bare fargede klosser**, uten skjerm: den røde synes over baugen fra styrbord | LYS-02 | `F.side_lantern` med skjerm på brett |
| A10 | **GLB-ens navn er et ekte merkenavn** | B20 | Nøytralt navn |
| A11 | **Lyets vegger står oppå ripa uten skjøt**, taket er en kasse som henger 0,8 m akter for veggene uten støtte | kap. 12 | Veggene 4 mm utenpå med skjøt; to stolper til skansen akter |
| A12 | **Galgen over hekken henger i lufta** akter: bjelkene går ut over speilet uten noe under | kap. 12 | To stolper på speilets kapp |
| A13 | **Styrhuset har ingen dørk** mellom akterveggen (5,95) og bakken (6,55): man ser ned på dekket inni huset | B5 | Dørk i bakkens høyde, vegger ned til dekket |
| A14 | **Broa:** konsollen er en kasse, rattet en ring, stolen to kasser, skipperen står på stolen; dashbordet ligger 54° under øyet mot et synsfelt til 32° | kap. 15.6 | Konsoll med skrått dashbord og skjermer mot skipperen, felles ratt, enspak, sete, VHF; skipperen bak rattet; dashbordet 46° under øyet med `hp` −0,35 |
| A15 | **Pullerten om babord ved styrhuset står inne i husveggen** (7,3, 1,75 mot veggen 1,76) | klasj | Pullertene flyttet forut |
| A16 | **Arbeidsflyten:** blødekaret står helt akter (0,55, −1,37), 4,8 m fra haleren | kap. 12 | Karet rett akter for haleren, sløyebordet akter for karet, luka innenfor |
| A17 | Propell, ror og anoder egne varianter | kap. 4.7 | `F.propeller`, `F.foil_rudder`, `F.anode` |
| A18 | Hekken og forskipet uten pullerter som festes på noe; rekka på bakken uten fot | kap. 12 | Pullerter på plate, rekkestolper på fot |
| A19 | Bare 25 133 trekanter nær; flate sider (M3) | F1, M3 | Mer detalj innenfor budsjettet |
| A20 | Spillets dekkskart: styrhustaket ble dekk før `roofOver` (rettet 01.11.2026); casingens tak 1,1 m over dekket kan knyttes til dekket | kap. 15 | Står som før (walktest grønn); se kap. 7 |

## 5. Lanternene

Under 12 m (sjøveisreglene regel 23 og 26, vedlegg I; regnet i `check()`), typet i `anchors.lights`:

| Lys | Plass | Kontroll |
|---|---|---|
| Hvit rundtlysende (`allround`) | toppen av formasta, 9,21 m over grunnlinja | 3,53 m over sidelanternene (2(d): minst 1 m) |
| Rød og grønn (`port`, `stbd`) | på brett på styrhustakets forre hjørner, med skjerm innenfor (`F.side_lantern`) | 1,78 m over skroget mot den hvites 6,11 (2(g): høyst tre firedeler, 4,58) |
| Akterlanterne (`stern`) | på galgens akterende, vendt akterover (`F.stern_lantern`) | |
| Fiskelys rødt over hvitt (`fishR`, `fishW`) | på korte armer forut for masta, 8,92 og 7,85 m | 1,07 m fra hverandre (2(i): minst 1 m; tegningen ga 0,97), det hvite 2,17 m over sidelanternene (2(j): minst 2,14) |
| Arbeidslys (`work`) | under lyets takkant akter og over den åpne sida | ingen lanterne |

Masta med den hvite står 7 m fra flaggstanga og over den: spillet gir vimpel (`mastTop`).

## 6. Arbeidsflyten og plassene

Jonas 02.11.2026 (med et bilde av styrbord side): «Kan du fjerne dette vinduet på styrbordsiden slik at mannskapet har plass til å
arbeide der? Er vel omtrent der juksamaskinene, garnhaler eller linehaler blir stående.» Lyet er nå åpent om styrbord fra x 3,10 til
5,88 (ripa opp til 4,45 m, en list under taket og et håndtak langs den), og tegningens haleport og de to vinduene er én åpning. Om
babord står veggen med de to vinduene.

| Plass | Hvor (x, y) | Hvorfor |
|---|---|---|
| Haleren (`hauler`) | 5,47, styrbord ripe, med halerulla på kappen | forut i den åpne sida, under arbeidslyset |
| Fiskeren ved haleren (`spot0`) | 5,30, −1,30 | |
| Blødekaret (`work.tub`, spillets) | 4,62, −1,45 | rett akter for haleren |
| Den som bløgger (`spot1`) | 4,62, −0,85 | innenfor karet |
| Sløyebordet (`work.table`, eget, `own`) | 3,20–4,10, babord ripe | over luka fra karet; avfallet over babord ripe |
| Den som sløyer (`spot2`) | 3,65, 0,90 | innenfor bordet, vendt mot babord |
| Lasteromsluka (`hatch`) | 3,92–5,48 midt | mellom karet og bordet: fisken ned på is |
| Garnkaret og stampene (`kit.garn`, `kit.stamps`) | 5,10, babord | forut for bordet, over luka fra haleren |
| Juksamaskinene (`13-instruments.js JIG_Z`) | styrbord x 3,85 og 3,15 i den åpne sida, 1,75 og 1,05 på akterdekket; babord 0,55 | ripa der det er plass, ikke ved bordet, casingen eller stigen |
| Skipperen (`skipperAt`, `ror`) | 7,08, −0,55 på styrhusdørken | bak rattet, setet bak ham |

`qa/deckpoints.py breisjark` (det nye bygget): alle plassene på dekkets høyde (0,88–0,95 over vannet), rorplassen på styrhusdørken
(1,93; i den gamle modellen hadde dørken 1,79 m under taket og var ikke dekk), døra på gangen ved bakken (1,90), og ingen dekkscelle på
noe tak (den høyeste er bakken, 1,95).

## 7. Kritikksløyfen

| Runde | Hva ble sett på | Funn | Retting |
|---|---|---|---|
| 0 | `stubcheck` på det gamle snittet, `fair.py` på det gamle skroget | 28,6 + 0,9 t; bule 0,038 i baugen | (avvikslista) |
| 1 | `check()` på første utkast | 23,05 t; vannlinja hoppet 0,38 m ved x 9,66 (hjørnet i snittet forsvant når bunnreisning + utfall gikk over 90°); propellen 5 cm fra skroget; dashbordet utenfor synsfeltet; gangen 0,40 | myk overgang (`softplus`, mykt minimum); propellen 1,06; `hp` −0,35; huset 4 cm inn |
| 2 | `check()` | knekk i vannlinja ved x 6,42: kurven i snittet gikk til ripa, og ripa hopper ved bakken | kurven til en jevn linje over ripa, klippet ved ripa (`z_ref`, `h_ref`) |
| 3 | `check()`, vekta | vannlinjebredden falt til 83 % | mer bunnreisning og fyldigere kimming: 21,9 t, 85 % |
| 4 | `fair.py` på det nye skroget | vannlinjene 0,008 (grensen 0,02); knekkene står i stevnen, fenderlista og trinnene | |
| 5 | klasjsjekken (`qa/clip_malo36.py`) | 78: trinnene i skansen, vinsjfoten og ventilene under dekket, casingens tak i skansen, husets fot | flyttet; sjekken måler skansens innside etter høyden. **0** |
| 6 | les koden mot dekkskartet | styrhusskallets lokk ga 1,81 m under taket over dørken | skallet åpent oppe, takets underside lukker det |
| 7 | nærbilder | stigen opp på lyet gikk gjennom takplata (også i den gamle) | stigen akter for takkanten, åpning i rekka |
| 8 | K1–K7, nærbildene | fenderlistas svarte bånd 25 cm bredt (flaten over lista fikk listas farge); viskerne tvers over rutene sett fra rattet | listas øverste punkt hører til skansen; viskerne kortere og parkert lavt |
| 9 | Jonas' bilde av styrbord side | vinduene står der mannskapet skal arbeide | styrbord side av lyet åpen; bordet til babord; juksaplassene per side |
| 11 | overlegget av den nye profilen (K3s) over den gamle, som ble lagt over tegningen da den ble målt | stevnen, kjøllinja, ripa med trinnene, lyet og styrhuset ligger oppå hverandre; styrhustaket 8 cm høyere (B5) | |
| 12 | etter-bildene i spillet | lyets tak mørkt i spillet (én flate med fire hjørner i skyggen fra listene) | taket som rutenett |
| 10 | Node-testen | fjernmodellen 18 165 punkter mot 12 000 | lyets vegger og beslagene grovere i `build(False)`: 11 754 |

## 8. Selvvurdering

Fylles ut når testene og bildene fra spillet er sett.

## 9. Spørsmål til Jonas

1. **Tegningen:** generalarrangementet bak skriptet ligger ikke i repoet. Kan du legge det ved (eller peke på det)? Da legges modellen over
   sideriss og plan hver runde, slik som den nye hurtigsjarken (`qa/overlay_hs11.py`).
2. **Vekta:** `disp` 20 t mot 21,9 t ved tegningens vannlinje. Er 20 t lettvekt eller lastet? Står Δ eller lettvekt på tegningen?
