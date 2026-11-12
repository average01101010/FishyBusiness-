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
| A9 | **Sidelanternene er bare fargede klosser** uten skjerm (spillet tegner lyset der modellen sier, så det synes ikke i før-bildene; skjermen mangler i modellen) | LYS-02 | `F.side_lantern` med skjerm på brett |
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

Masta med den hvite står 7 m fra flaggstanga og over den: spillet gir vimpel (`mastTop`). Nattbildene fra spillet (`ma36_etter_natt*`): den røde synes fra babord, den grønne fra styrbord.

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

**Karakter: 72/100: ikke godkjent** (grensen er 75).

Det som holder:
- Skroget er én flate med dødveden i snittet, ekte hull og jevne vannlinjer (0,008 mot 0,038 før).
- Profilen ligger oppå den gamle, som ble lagt over tegningen.
- Vekta er 21,9 t mot 29,5 t før. Dypgangen stemmer.
- Klasjsjekken står på 0, og alle 21 kontrollene i `check()` er grønne.
- Lanternene er lovlige, med skjermer og typede fiskelys.
- Broa viser konsollen og instrumentene fra skipperens øye. Rorplassen ligger på styrhusdørken for første gang.
- Arbeidsflyten går an: haleren, karet, luka og bordet ligger i rekkefølge.
- Testene som dekker båten er grønne: Node (420), `vessel3d`, `brotest`, `lanterntest`, `regmarktest`, `maletest`, `walktest`,
  `vesseltest`, `penshot` og `jigshot`.

Trekk:
1. **Jonas måtte påpeke vinduene om styrbord** der mannskapet arbeider. Plassene for haleren og juksamaskinene ble ikke lagt inn før
   lyet ble formet (kap. 19).
2. **Tegningen er ikke i repoet.** Overlegget er mot den gamle profilen, og plan, forriss og akterriss er ikke lagt over noe.
3. **Vekta er ikke avgjort:** 21,9 t ved tegningens vannlinje mot `disp` 20.
4. **Bare tre av seks juksamaskiner får plass.** Den høye akterskansen om styrbord er for høy for spillets regel for ripa (`jigRail`).
5. **Skjermene på broa er mørke flater** (som havsjarken), og nattbildet fra Blender er for mørkt til å si noe om lanternene. Nattbildet
   fra spillet viser dem.
6. **Jeg fant selv** at lyets tak ble mørkt i spillet, og at stigen gikk gjennom taket. Begge er rettet, men de ble funnet sent.
7. Testene i spillet ble kjørt på eksporten før taket ble delt i et rutenett. Node-testen og etter-bildene er tatt på den siste.

Det som må til for 75: Jonas ser på bildene uten å finne noe nytt, tegningen legges over sideriss og plan, og vekta og juksaplassene
avgjøres.

## 9. Spørsmål til Jonas

1. **Tegningen:** generalarrangementet bak skriptet ligger ikke i repoet. Kan du legge det ved (eller peke på det)? Da legges modellen over
   sideriss og plan hver runde, slik som den nye hurtigsjarken (`qa/overlay_hs11.py`).
2. **Vekta:** `disp` 20 t mot 21,9 t ved tegningens vannlinje. Er 20 t lettvekt eller lastet? Står Δ eller lettvekt på tegningen?

## 10. OB11: arbeidet om bord, setteporten, bremmen, vannlinja og karakteren etter Jonas' skala (10.11.2026)

Steg 89 i `docs/planer/koen.md`, Jonas' økt på grenen `ccr-7c6616f1-m5zscg`. Jonas 09.11.2026: «at arbeidet ombord utføres på en så ekte måte som mulig, at mannskapet oppfører seg som ekte mennesker, at utstyr står plassert på rasjonelle og logiske plasser, at utstyr opereres på en realistisk måte, at ingenting clipper inn i andre ting». Funnene er de i `docs/planer/om-bord.md` 4.8.

### 10.1 Bildene av typen (valg 22 B)

**Ingen bilder er sett.** Bildefilene på `upload.wikimedia.org` svarte 429 på det ene forsøket, `api.php` svarte «too many requests» på første spørring, og kategorisiden svarte 429; søkesiden og beskrivelsessidene svarte. Sperren er ikke omgått. Bildene er valgt etter beskrivelsen og kategoriene, og arket med lenkene (`docs/okter/2026-11-10-ob11/bilder-av-typen.md`) ble sendt Jonas før modellen ble endret: tre bilder av en glassfibersjark fra 2000 på 10,5 × 4,6 m med garnrull, fotografert ovenfra ved kai (kategoriene «Net drums» og «Fishing nets in Norway»), og to sjarker ved kai. Formen følger fortsatt tabellene som ble målt på generalarrangementet 02.10.2026.

### 10.2 Det før-bildene viste

- **Garnet og lina ble satt på skrå over hele akterdekket** fra rommet under lyet til babord, forbi aktermasta, og **ut gjennom hekken**: spillet fører redskapet ut 0,45 m til styrbord for midten i midjehøyden + 0,10 (3,07 m over grunnlinja), og akterskansen står til 3,76.
- **Stampeblokken sto 0,7 m inn under sløyebordet:** med åtte stamper om bord (0,78 × 2,02 m) rakk blokken fra x 3,39 til 5,41, og bordet står fra 3,20 til 4,10.
- **Juksamaskinene på akterdekket sto i skansen:** spillets tabell (`JIG_Z`) hadde fire plasser om styrbord, tre av dem ved den høye akterskansen (1,46 m over dekket), der `jigRail` la maskinen i platene under kappen.
- **De to som sorterer teinefangsten, sto inni hverandre** ved stigen under lyet, og teina ble tømt på lukas hjørne (spillet la den 2 m akter for haleren). Stabelen sto på akterdekket om styrbord (OB16), i veien for redskapets vei til hekken.
- **Haleren sto 1,25 m over dekket** (0,55 over ripa), 5 cm over grensen der spillet sender dem som haler og bløgger, inn (F24).
- Modellen hadde ingen pyntefendere (fargen `fender` var definert, men ikke brukt), og lensportene var alt åpne hull uten klaffer (02.11.2026).

### 10.3 Plassene (modellens x fra aktre perpendikulær, y babord +)

Regnet i `check()` mot spillets egne bokser (`deckcrew.js` `kitBoxes`, hver med 6 cm rundt) før eksporten.

| Plass | Hvor | Målt |
|---|---|---|
| Haleren (`hauler`) | x 5,47 på styrbord kappe, **0,30 m over ripa** (før 0,55) | 0,97 m over dørken der den som haler, står (spillets grense 1,2 m; F24) |
| Blødekaret (`work.tub`) | 4,02–5,22, y −1,45 (uendret) | 1 cm fra skansens fot, 0,27 m til luka, 0,25 m akter for haleren |
| Sløyebordet (`work.table`, eget) | 3,20–4,10 ved babord ripe (uendret) | den som sløyer, står y 1,03; nummer to 0,7 m forut på fri dørk (F19). Akter står casingen i veien |
| Stampene (`kit.stamps`, `STAMP0`) | første rad x 3,54, y −0,20 og −0,72, fire rader akterover: **dørken akter for luka** under takets akterkant | blokken med åtte 1,72–3,86 × −0,91..−0,01: 2 cm til luka, 8 cm til aktermasta, 5 cm til stigen, 27 cm til lasteplassen |
| Garnkaret (`kit.garn`, `GARN`) | x 2,75, y −0,37, samme sted (aldri om bord samtidig med stampene) | 0,47 m til luka, 3 cm til stigen |
| Setteporten (`SPORT`) | i hekken, y −0,60 til 0,60 mellom galgens stolper (flyttet fra ±0,62 til ±0,67), terskelen 0,58 m over dekket, rulle Ø 8 cm i terskelen | rullens topp 2,94, redskapet går ut i 3,02 ved y −0,45; garnrulla henger over (4,27) |
| Redskapets vei til porten | rett akterover fra karet eller stampene | 0,32 m klar av aktermasta fra garnkaret, 0,25 m fra stampene; ikke gjennom casingen eller stigen |
| Teinestabelen (`kit.pots`, `POTS`) | x 0,67, y −0,40 på det åpne akterdekket (plassen OB16 fant på dekkskartet), seks i høyden | 17 cm fra speilet, fri for casingen, masta, pullertene og skansen. I etter-bildene står den ved x 0,55, y 0,35 (babord for midten): `potshot` var rød der og ved x 0,70, y 0,15, fordi dekkskartet knytter casingen til dekket og rutene inntil 0,6 m fra den ikke er gulv. Flyttet tilbake til OB16s plass og skrevet inn i den eksporterte modellen med `tools/boats/potplaces.py`, uten ny eksport og uten nye bilder. Hun står i redskapets vei til setteporten, men teiner og garn eller line er ikke rigget samtidig |
| Der teina tømmes (`kit.pots.spot`, `POT_SPOT`) | x 3,20, y −1,12 i den åpne sida akter for blødekaret | 4 cm til karet, 3 cm til skansen, 4 cm til lukas hjørne |
| Juksaplassene (`anchors.jigZ`, `JIG`) | **to** om styrbord (valg 32): x 3,66 i den åpne sida og x 2,64 akter for lyets hjørne | ripa der 0,71 m over dekket; 1,02 m imellom; fri for akterskansen, takstolpen, lyets hjørne, blødekaret og haleren |
| Slangen | x 5,62, y 1,55 under lyet forut om babord | lå der stampene står nå |

**Juksaplassene er talt ærlig, og det ble én.** Bare den åpne sida om styrbord (2,78 m) har ei ripe en mann kan jukse over, og haleren og blødekaret står i de to fremste tredelene. Akterskansen er 1,46 m høy, babord side er lyets vegg, og bakkens kappe har rekkene sine. `VESSELS.breisjark.jukseMax` er derfor satt fra 6 til **1** (valg 31 A, som på hurtigsjarkene), og maskiner over det tas i land og betales tilbake av `ui/11-boot.js` slik den står. Se spørsmålet til Jonas i 10.7.

### 10.4 Det som ellers er endret

- **Eksportert på nytt** (pchip-feilen fra H3d1). Skriptet hadde alt nøkkelen på tabellens innhold; `check()` har nå sjekken «sidene er like» (0,0000 m mellom styrbord og babord snitt).
- **Spillets vannlinje er den tomme båtens** (`WLE` = tegningens − 0,06 m): tegningens vannlinje bærer 21,8 t, `disp` 20 t er den tomme båten (valg 18 A), og ved `WLE` veier hun 20,05 t. Formen står. Malingen står ved tegningens vannlinje, 6 cm over den tomme båtens; avstanden er liten, så den er ikke flyttet til den lastede vannlinja (på den nye hurtigsjarken var den 0,67 m). `STAB_AT.breisjark` er lest på nytt (dekket 0,94 m over vannet, redskapet akter for luka, stabelen på akterdekket), med sjekk mot modellens ankre i `tests/unit/trim.test.mjs`.
- **Bremmen på styrhustaket** (valg 26): rundt hele takkanten, 16 cm ut fra veggene. 3 cm hvit underkant med dryppkanten under, flaten skrår 11 cm inn opp til takkanten **i skrogets marineblå** (lav akter, høy foran der taket stiger til visiret). Dryppkanten står 1,90 m over gangen på bakken.
- **Veggene uten striper:** de skarpe kantene merkes på nytt etter kuttet på styrhuset og lyets vegger (`shade(…, 5)`). `qa/flatnorm.py`: 291 flater opptil 76° skjevt før, 1 etter (en flate på 0,03 m² i skansens innside, 42°).
- **Galgen** er 5 cm bredere på hver side (±0,67), så setteporten får 1,2 m mellom stolpene; garnrulla med.
- Klasjsjekken `qa/clip_malo36.py`: 0. `check()`: 34 av 34.

### 10.5 Testene

- `node tests/unit/run.mjs`: 2 869 OK, 0 feil. **Sett rød først:** mot den nye eksporten og de gamle tallene var fem røde (`STAB_AT.dy`, `net`, `tub` og `pots` i `trim`, og `jukseMax` 6 mot én plass i `jig`); grønne etter at `STAB_AT` og `jukseMax` ble rettet. Sjekken i `teiner` (stabelen rommer `gearMax.teine`, og `kit.pots.spot` er modellens) var grønn også mot den gamle eksporten for stabelen, og er en vakt.
- `crewclip`: breisjarken lagt i F19-lista. **Ikke sett rød:** paret ved bordet målte over 0,55 m også før (de to som sto inni hverandre i 4.8, var de som sorterer teinefangst, og det paret måler ikke `crewclip`). Rød bare for `snokrabbe`, fra før.
- `walktest` (breisjarken OK, 500 celler; rød bare for autolineren, fra før), `vesseltest`, `lanterntest`, `regmarktest`: grønne.
- 3D, én om gangen: `brotest breisjark` (1,88 m under taket, utsikten ikke svart), `vessel3d breisjark` (184 929 punkter nær, 119 994 middels, skroget 11,12 × 4,11 m), `deckshot` med `KYST_DECK=breisjark` (16 OK; den ene røde linja er havbåtenes MOB-båt, som filteret tar bort), `jigshot` (breisjarken 1 av 1) og `potshot` (rød for breisjarkens stabel første gang, «ikke gulv» ved casingens hjørne; og fortsatt rød 15 cm lenger inn; se raden om teinestabelen i 10.3 grønn etter at den ble lagt på OB16s plass).
- **Droppet:** `hull3d` (bare `jukseMax` og plassene i `STAB_AT` er endret i kjernen, og `hull`- og `trim`-enhetstestene dekker dem), `ma36shot` og `maletest` (ingen malingssone er flyttet), og hele lista fra `run.py changed`.
- `ombord.py breisjark` før og etter, begge formater, alle 15 operasjonene (kranen finnes ikke på henne); ingen droppet, fordi vannlinja, taket og plassene er endret. Arkene i `docs/okter/2026-11-10-ob11/`.

### 10.6 Karakteren: 68/100, ikke ferdig (runde 2, 11.11.2026: 71/100, fortsatt ikke ferdig; se 10.9)

Satt som en egen evaluering av en uavhengig underagent som bare fikk arkene, rendringene, bildet fra roret, `check()`-utskriften og skalaen (Jonas 10.11.2026). Målet var 75.

| Punkt | Vekt | Poeng | Begrunnelse (sensorens, forkortet) |
|---|---|---|---|
| Skrogutforming | 20 | 15 | Én jevn flate, ren fenderlist og vannlinjestripe, vekta stemmer (20,05 t) og sidene er like. Kjøl, sko, propell og ror er ikke vist i noe bilde; spranget har en synlig knekk der bakken begynner; lengden over alt 11,22 mot 10,99 og bredden 4,12 mot 4,20 |
| Detaljer | 20 | 13 | Mye riktig beslag (rekker, stag, lyskastere, eksos, pullerter, baugrull, lensporter, trapp, leidere), men rene, flate flater: lite slitasje, ingen sklisikring som synes, ingen navn og merke i rendringene; vinsjen på masta og kapstanen på bakken ser ut som plassholdere |
| Lanterner | 5 | 3 | Høydene og avstandene etter vedlegg I står i `check()`, og lanternehusene synes, men ikke ett nattbilde |
| Styrhus | 10 | 7 | Utvendig godt (skrå frontruter, bremmen, dør og sidevinduer). Fra roret: brukbar utsikt, men skjermene er blanke mørke plater, sprossene brede og rattet synes så vidt |
| Arbeidsflyt | 25 | 16 | Hovedgrepene står riktig og er klart bedre enn før: haling og bløgging i den åpne sida, sløying ved bordet, setting ut gjennom porten under garnrulla; ikke noe redskap gjennom skansen. Trekker ned: de som har pause eller er uten maskin, står rart (stiv grunnstilling, nesa i veggen under lyet, en bak teinestabelen, en som hviler i setteporten); fortøyning og lossing kan ikke vurderes fra bildene |
| Utforming av dekk | 20 | 14 | Logisk og lesbar plan, og redskapet har egne plasser som ikke står i veien for hverandre. Trangt etter modellens egne tall (0,27 m der bløggeren står, 1–8 cm klaringer), teinestabelen står foran setteporten, dekket viser lite bruk, og bare én juksaplass på en båt for fire |
| **Sum** | 100 | **68** | |

To ting sensoren var usikker på, er målt etterpå: hodet «i garnrullens motor» (`line_sett`) er perspektiv (motoren og rullens skiver henger 2,0 m og mer over dørken), og mannen bak teinestabelen står mellom stabelen og hjørnet fordi `deckcrew.js` ikke vet om stablene (felles, som OB10).

### 10.7 Det som står igjen, og spørsmålet til Jonas

**Spørsmål til Jonas: juksa og akterskansen.** Modellen har ærlig talt én juksaplass, så `jukseMax` er satt fra 6 til 1. Skal hun kunne ha flere maskiner, må noe i formen endres, og det er et avvik fra tegningen:
- **A (som nå):** én maskin. Hun er en garn-, line- og teinebåt.
- **B:** akterskansen om styrbord senkes til ripehøyde (0,7 m) fra lyet og akterover, så tre maskiner til får plass der (fire i alt). Akterdekket blir da åpnere mot sjøen om styrbord.
- **C:** akterskansen står, men får to–tre juksaluker (åpninger i ripehøyde) om styrbord.

Til 75 mangler sju poeng. Det som kan hentes i modellen: nattbilde av lanternene og bilde av undervannsskroget (vist, ikke bare regnet), instrumenter på skjermene på broa, slitasje og sklisikring som synes, teinestabelen bort fra setteporten (krever at dekkskartet ikke knytter casingen til dekket, eller en plass om styrbord ved x 1,25 som er regnet, men ikke prøvd), og juksaplassene etter svaret over. Det som ligger i felles kode (OB3, OB4, F18, pausene), løfter arbeidsflyten for alle båtene.

### 10.8 Valg 32: to juksamaskiner (Jonas 10.11.2026)

Spurt om juksa og akterskansen (A én maskin, B senke akterskansen om styrbord, C juksaluker) svarte Jonas: «den burde ha 2 maskiner». Bygd som en liten B: **trinnet fra den lave ripa opp til akterskansen står en meter lenger akter om styrbord** (`STEP_S`, x 2,0–1,3 mot tegningens 3,0–2,3), så den lave ripa (0,71 m) går fra x 2,0 til styrhuset. Babord side er tegningens (casingen står mot skansen der). Skroget under ripa er uendret og likt på begge sider (`check()`: 0,0000 m), og vekta er den samme.

- Juksaplassene: x 3,66 (i den åpne sida, akter for blødekaret) og x 2,64 (akter for lyets hjørne, under takets akterkant, mellom takstolpen ved 2,30 og veggen ved 2,98), 1,02 m fra hverandre. `VESSELS.breisjark.jukseMax` er **2**; maskiner over det tas i land og betales tilbake av `ui/11-boot.js` slik den står.
- Livbøya om styrbord er flyttet fra x 2,05 til 1,00 (den hang der skansen nå er lav).
- Fjernmodellen leser trinnet på sine egne stasjoner (med to stasjoner til gikk den over 12 000 punkter: 12 222; nå 11 790-nivået igjen, enhetstesten `vessel3d` var rød imellom).
- Tester: `check()` 34 av 34, `clip_malo36` 0, `flatnorm` 1 (som før), enhetstestene 2 892 OK (`jig`: to plasser i modellen og `jukseMax` 2), `crewclip` (breisjarken `jig 2/2`, rød bare for `snokrabbe`), `walktest` (breisjarken OK). `ombord.py breisjark juksa --ops jig,maskin` i begge formater: to står ved hver sin maskin på den lave ripa, én på hver side av lyets hjørne (`docs/okter/2026-11-10-ob11/juksa_to_maskiner.jpg`, og styrbord side i `styrbord_side_valg32.jpg`). Droppet: `jigshot` på nytt (enhetstesten, `crewclip` og bildene dekker plassene) og de andre operasjonene i `ombord.py` (bare ripa akter for lyet og juksaplassene er endret). Karakteren er ikke satt på nytt; 68 står, med «bare én juksaplass» ute av lista.

### 10.9 Runde 2 (11.11.2026): fra 68 til 71, ikke 75

Steg 89 på nytt, Jonas' økt på grenen `claude/zen-babbage-aixu88`, etter startmeldingen «Runde 2» i `docs/planer/start/89.md`. Valg 32 (to juksamaskiner) står urørt.

**Før-bildene på nytt, og hva OB3 og OB4 har rettet.** `tests/ombord.py breisjark` spiller nå 22 operasjoner (15 i runde 1): rigging og setting med fullt redskap om bord, is om bord og lossing sett nært er nye. Sett i før-bildene:

- **Settingen (OB3):** én står akter ved setteporten og setter gjennom linesetteren i porten, stampene står i blokk akter for luka, og lina går rett akterover og ut gjennom porten. Ingen står lenger og hviler i setteporten mens det settes.
- **Lossingen og isen (OB4):** mottakets kran løfter karene opp av luka med én om bord som styrer løftet og én som gir tegn, og renna fra siloen svinger inn over luka med en mann ved munnstykket. Fortøyningen (OB2) vises med tauene i land. Begge kunne ikke vurderes i runde 1.
- **Det som fortsatt er som før:** de som har pause under arbeidet, står med ryggen til eller ser ut over sjøen ved siden av dem som arbeider (felles kode, OB14, steg 92). `clipcheck` er tom i alle 22 operasjonene, i begge formater.

**Det som er rettet i modellen:**

| Punkt fra 10.6 og 10.7 | Gjort | Målt |
|---|---|---|
| Teinestabelen foran setteporten | **Prøvd, og satt tilbake.** Plassen i styrbord låring mot den høye akterskansen (x 1,20, y −1,01; 0,76 m fra porten) holdt i `check()`, og etter-bildene og karakteren er tatt med stabelen der. `potshot` sier nei: dekkskartets ytterste rute (1,6–1,8 m ute) er ikke gulv, og testen lar en ring gå inn i den bare fra `beam`/2 − 0,45 = 1,65 m; 15 cm lenger inn møter ringen aktermastas rute eller pullertens. Det finnes ingen fri sirkel på 1,45 m mellom dem (det mangler 1,4 cm). **Stabelen står derfor på OB16s plass (x 0,67, y −0,40), foran porten, som i runde 1.** Teiner og garn eller line er aldri rigget samtidig | 0,18 m fra setteportens åpning, som før. Livbøya om styrbord henger der den hang |
| Trangt der bløggeren står (0,27 m) | **Luka er 10 cm smalere på hver side og 8 cm kortere akter** (4,00–5,48 × ±0,62; tegningens 3,92 og ±0,72) | bløggeren har **0,37 m** mellom karet og luka (før 0,27), den som sløyer 0,12 m til luka (før 0,02), stampeblokken 4 cm til luka og 14 cm til aktermasta (før 2 og 8), teina tømmes 9 cm fra karet og 20 cm fra lukas hjørne (før 4 og 4) |
| Bredden 4,12 mot 4,20 | **Prøvd, og tatt tilbake:** halvbreddene ble ført ut med 2,9 % (`BSC` 1,029, slaget litt mindre fyldig så vekta sto), og ripa målte 4,20 m. Men de 4 cm ekstra dørk i styrbord låring flyttet plassen spillet gir karene som losses (`deckcrew.js` `landSlots`, på et rutenett på 0,2 m), fra midt på akterdekket ut i låringen, og han som gir tegn ved ripa mistet plassen sin når juksamaskinene står der (`crewclip`, OB4s sjekk: grønn før, rød med 4,20). **Tegningens tabell står derfor: 4,08 m ved ripa og 4,12 over fenderlista, 2 % smal.** Faktorene står i skriptet til dekkskartet kjenner stablene og lossingen har en egen plass (backloggen) | den tomme båten 20,05 t ved `WLE`; sidene like (0,0000 m); vannlinjene jevne |
| Lengden over alt 11,22 mot 10,99 | **Står, med begrunnelse:** skroget alene er 11,20 m, 2 % for langt. Stasjonene er målt på tegningen med 1 m mellom, og hver plass om bord (haleren, luka, stampene, setteporten, styrhuset) er regnet mot dem; en retting betyr å flytte alt forut for bakken eller hele hekken med ror og propell. Spillet regner med 10,99 m (`VESSELS.len`), og `check()` holder avviket under 2,5 % | 11,22 m med fenderlista, 11,20 uten |
| Knekken i spranget der bakken begynner | To ting: (1) **fenderlista** lå flatt til x 6,0 og steg så brattest ved x 7–8; nå én kurve fra x 4,0 til stevnen med stigning som øker hele veien, innenfor 4 cm av tegningens punkter. (2) **Ripa** steg 0,9 m på 0,28 m (x 6,40–6,68); nå over x 6,10–6,95 som tegningen har det | sidebildet `rend_K3s` før og etter |
| Vinsjen på masta (en rød kasse 0,54 × 0,44 × 0,70 m) | **Bygd som en vinsj:** fotplate klemt til mastas akterkant med to bånd, to vanger, trommel med flenser og wire, hydraulikkmotor om babord med slanger ned langs masta, bremsetrommel og spak om styrbord; løperen opp til en blokk under bommens hæl, ut til blokka i nokken og ned til kroken | laveste punkt 2,09 m over dørken (før 1,79) |
| Kapstanen på bakken (to røde sylindre, 0,78 m høy) | **Bygd som en kapstan:** boltet fot, trommel med midje mellom leppene og seks ribber, blank der tauet går, malt krone med spakehull, 0,46 m høy | — |
| Blanke skjermer på broa | **Kartplotteren viser et kart** (land om babord og en holme, tre dybdefarger, kjølsporet, båten og avstandsringen), **ekkoloddet viser bunnen** (rødt over gult, en stim over, skalaen til høyre), og motorpanelet har tre instrumenter med visere. Små flater farget i hjørnene, så de er like i rendringen og i spillet | `ma36_etter_bro` |
| Brede sprosser sett fra roret | Rutene foran er 3 cm bredere (0,69 m), hjørnerutene 6 cm (0,56 m), siderutene 4 og 7 cm, og rammene 2 cm (før 3) | en sprosse foran er 5 cm (før 8), 5–6 cm ved en hjørnerute (før 15–20) |
| Sklisikring og slitasje som ikke syntes | **Sklisikringsfelt på hele akterdekket** (1 235 ruter på 10 cm, 4 mm over gelcoaten), mørkere og matte, med glatte renner langs skansene, rundt luka, casingen, masta og pullertene, og skjøter mellom feltene. Slitt lyst der de står og går (ved haleren, karet, bordet, juksaplassene, trappa, casingdøra, setteporten), rustbrunt rundt stålets føtter, mørkt og grønnlig i rennene. På skroget: gelcoaten skurt lys i striper under haleren, matt etter kaia under fenderlista, og mørkere striper under lensportene | `rend_c_aftdeck`, `felles_rydd` |
| Navn og merke manglet i rendringene | Se under: Jonas flyttet dem samme dag | — |
| Én flate med skjev skyggenormal (0,03 m², 42°) | Lensporten ved x 3,25 er flyttet 5 cm forover, så kuttet ikke lager en smal flis ved en stasjon | `flatnorm`: **0** (før 1) |

**Navnet og merket (Jonas 11.11.2026, midt i økta):** «liker ikke hvordan teksten er plassert på skroget. Navnet på båten skal bare være over styrhusvinduet på bremen og på akterspeilet. det andre nummeret kan gjøres mindre å plasseres høyere opp på det hvite». Spillet fant plassene selv og la navnet på den smale hvite kanten under bremmen (13 cm bokstaver, i bremmens skygge) og merket på det blå i baugen, fordi søket bare kjenner skrogets egen maling og aldri den hvite skansen. Nå sier modellen hvor de står: `anchors.nameHouse` (navnet på **bremmens forkant**, 20 cm bokstaver) og `anchors.marks` (merket **på den hvite skansen i baugen**, 16 cm under ripa, x 8,95–10,03), lest av `houseFront` og `markStrips` i `vessel3d.js`; andre modeller uten slike plasser søker som før. Navnet på akterspeilet står der spillet la det. **Merket er 20 cm høyt, og det er under regelen spillet ellers følger** (`baater.md`: § 23, 25 cm fra 9 m; ikke sjekket mot Lovdata på nytt i denne økta): Jonas ba om mindre, og spurt om det skal stå, svarte han 12.11.2026: «20cm går bra.» Tallet står ett sted (`MARK_H` i `malo36.py`). Rendringene viser de samme plassene (`render_only()`, aldri eksportert).

**Det som nå er vist:** undervannsskroget (kjøl, sko, propell, ror, anoder, innsug) fra låringen og fra baugen uten vann (`rend_c_under`, `rend_c_under_f`), og lanternene tent om natta i spillet fra styrbord og babord baug (`ma36_etter_natt`, `nattbb`) og i rendringen (`rend_K6`, `rend_c_night_aft`).

**Pullertene** i låringene står 7 cm lenger ut (y ±1,52, 13 cm fra skansens fot): på 1,45 rørte de dekkskartets rute 1,2–1,4 m ute, som da ikke var gulv (funnet under forsøket med teinestabelen i låringen; de står der de ble flyttet til).

**Testene i runde 2.** `check()` 35 av 35 (to nye linjer: stabelen mot setteporten, og lengdeavviket under 2,5 %), `flatnorm` 0, `clip_malo36` 0, enhetstestene grønne. **Sett rød først:** `trim` (fire plasser i `STAB_AT.breisjark` mot den nye eksporten), `regmarktest` (merket på den hvite skansen med ni og med 49 stasjoner i spillets egen avstand fra skroget; grønn med 24 mm), `crewclip` (lossingen med 4,20 m bredde; grønn med tegningens bredde), `potshot` (stabelen i styrbord låring på tre plasser: ved skansen, 15 cm inn, og med pullertene flyttet; grønn først med stabelen tilbake på OB16s plass), og den nye sjekken i `tests/unit/navn.test.mjs` (navnet på bremmen, merket på den hvite skansen, blekket etter overbyggets maling: rød mot koden før gjennomgangens retting). Resultatene av 3D-testene og hvilke som ble droppet, står i commit-meldingen og i backloggen.

**Karakteren i runde 2: 71/100, ikke ferdig.** Satt 11.11.2026 av en uavhengig underagent som bare fikk mappa `docs/okter/2026-11-11-ob11-r2/` (arkene før og etter for 22 operasjoner, rendringene, bildet fra roret, nattbildene, navnebildene og `check()`-utskriften) og skalaen. Den fikk ikke 10.6, ikke forrige karakter og ingen vurdering fra økta. Karakteren er ikke satt på nytt for å nå grensen. **Bildene sensoren så, hadde teinestabelen i styrbord låring**; den er satt tilbake foran setteporten etterpå (`potshot`), så «Utforming av dekk» kan være ett poeng for høyt.

| Punkt | Vekt | Runde 1 | Runde 2 | Begrunnelse (sensorens, forkortet) |
|---|---|---|---|---|
| Skrogutforming | 20 | 15 | 15 | Én flate, 20,05 t mot 20,0, like sider, jevne vannlinjer; kjøl, skrueramme, propell, sko og anoder henger sammen (nå vist). Trekker ned: steget i ripa ned til midtskipet leser som en knekk i sideriss, sidene er flate og kasseaktige, roret er en flat plate, 2 % for lang |
| Detaljer | 20 | 13 | 13 | Mye beslag, og navn og merke står riktig. Slitasjen finnes, men er svak. Rene, kantete flater på nært hold; ingen dørhåndtak, sveisesømmer, anker på rulla eller fenderfester sett; et svart gap der skråstaget møter galgebjelken |
| Lanterner | 5 | 3 | 4 | Høydene i `check()`, og i spillet bare rødt fra babord baug, bare grønt fra styrbord og hvitt akterfra. Mastetoppen er kuttet i nattbildene, så den hvite rundtlysende ses bare som gjenskinn, og fiskelysene er ikke vist tent |
| Styrhus | 10 | 7 | 8 | God sikt, og dashbordet har kompass, ekkolodd, tre instrumenter og kartplotter: et klart løft. Innsiden er ellers glatt (ingen radio, brytere, listverk), stolpene er fortsatt tykke, og rattet dekker nedre del av bildet |
| Arbeidsflyt | 25 | 16 | 16 | Trekkingen overbeviser, jukserne står ved lav ripe med hver sin maskin, og settingen går ut gjennom porten over renna. Trekker ned: en mann ligger ute på setterenna (`garn_riggfull`), en står stivt på skrå ved galgestolpen (`juksa_maskin`), setteren sitter i eller bak galgestolpen (`line_sett`), to står i hverandre i hjørnet (`line_riggfull`); `teiner_sett` viser ingen teiner; hvile er bare å stå; lossing og is nært viser ikke mannskapet |
| Utforming av dekk | 20 | 14 | 15 | Plassene er logiske og regnet, og redskapets vei går ikke gjennom skansen. Trangt akterdekk med klaringer på 1–5 cm, stigen og aktermasta i gangveien mot porten, flagget henger inn der setteren står, casingen tar hele babord akterhjørne |
| **Sum** | 100 | **68** | **71** | |

**Det som mangler til 75 (fire poeng), og hvor det ligger:**

- **Felles kode (ikke modellen, OB14 og senere):** den ledige som setter seg på setterenna utenfor hekken, han som står på skrå ved galgestolpen, to som får samme hjørne, og hvile som bare er å stå. Mannen på renna sto der også i før-bildene.
- **Modellens plasser ved setteporten:** setteren står for nær styrbord galgestolpe, og flagget på babord låring henger inn over ham. Kan prøves: flaggstanga ut på hjørnet eller opp på galgen, og `SPORT` og `GANT_Y` 5–10 cm bredere.
- **Akterdekket:** stigen til taket (x 2,0, y −1,2) og aktermasta står i veien mot porten, og klaringene er små (stampene 5 cm til stigen, garnkaret 3 cm). Stigen kan flyttes til lyets akterkant om babord over casingen; da får stampene og garnkaret 30–40 cm.
- **Detaljer på nært hold:** dørhåndtak og hengsler som synes, sveisesømmer eller lister i skjøtene, fester for fendere, gapet der skråstaget møter galgebjelken, sterkere slitasje på hvite flater, radio og brytere på broa.
- **Skroget:** roret som et profilror med hæl i stedet for en plate, og en mykere overgang der ripa går ned til midtskipet (formen er tegningens; en mykere overgang er et avvik Jonas må ville ha). Lengden står (2 %).
- **Bildene:** nattbilde der hele masta er med (den hvite rundtlysende), og ett mens hun fisker (rødt over hvitt); `teiner_sett` tatt mens det står teiner om bord; rendringene lysere under lyet.

### 10.10 Runde 3 (12.11.2026): 71, fortsatt ikke 75

Steg 89 på nytt, Jonas' økt på grenen `claude/ob11-r3-breisjark`, etter startmeldingen «Runde 3» i `docs/planer/start/89.md`. Valg 32, bredden og navnet og merket står urørt. Bildene, arkene og `check.txt` står i `docs/okter/2026-11-12-ob11-r3/`.

**Før-bildene på nytt etter OB14 (steg 92), hva som er rettet av punktene fra 10.9** (`ombord.py breisjark`, 24 operasjoner, begge formater, `clipcheck` tom i alle):

- **Den ledige på setterenna:** borte. I `garn_riggfull` står ingen lenger ute på renna.
- **Han som står på skrå ved galgestolpen:** fortsatt. I `felles_hvile` står én ved styrbord galgestolpe og ser ut.
- **To i samme hjørne:** fortsatt under settingen. I `line_sett` står tre tett ved porten: setteren og to som ser på.
- **Hvile som bare er å stå:** fortsatt. De som har pause, står.

Alt dette er felles kode (`deckcrew.js`, `core/13-work.js`) og er ikke rørt her.

**Det som er gjort i modellen:**

| Punkt fra 10.9 | Gjort | Målt (`check()`) |
|---|---|---|
| Setteren for nær styrbord galgestolpe | Setteporten (`SPORT`) og galgen (`GANT_Y`) 10 cm bredere på hver side: porten ±0,70, stolpene ±0,77 | setteren 0,025 m fra stolpens innside på begge plassene (y −0,45 uten linesetter, −0,05 med); før −0,075, altså i stolpen. Ny linje, rød med de gamle målene |
| Flagget henger inn over setteren | Flaggstanga flyttet fra ripa på babord hjørne av speilet opp på galgen: en hylse på utsida av babord galgebjelke, stanga skrått akterover med knott (`POLE`, `pole_top()`, `anchors.pole`) | flagget henger aldri lavere enn 2,69 m over dekket (før 1,48). Ny linje, rød med den gamle stanga |
| Stigen til lyets tak i veien mot porten | Stigen flyttet til babord over casingen: tre trinn på casingens akterside med håndtak over taket, og en kort leider fra casingtaket opp forbi takets akterkant. Rekka på taket er åpen der. Ventilen på casingens akterside er flyttet til innsida akter for døra | 1,09 m fra stampene og garnkaret (før 0,05 og 0,03). Ny linje, krever minst 0,25 |
| Gapet der skråstaget møter galgebjelken | Staget går inn i bjelken og står i et øre med bolt; tverrbjelkene går mellom sidebjelkenes innsider litt lavere (de svarte firkantene i hjørnene var sammenfallende flater), og en tverrbjelke ved aktermasta, som sidebjelkene før endte i lufta ved | sett i `rend_c_aftdeck` |
| Dørhåndtak og hengsler | Styrhusdøra: låsskilt, håndtak på 17 cm, to hengsler med blad og en mørk tetningslist rundt bladet. Casingdøra: to hengsler | `rend_c_wh` |
| Lister i skjøtene | Stållist rundt styrhusets fot på bakken og langs lyets vegger der de står på ripa | `clip_malo36` 0 |
| Fester for fendere | Fenderøyer på ripa, fire på hver side (x 0,70, 1,75, 7,35, 8,35) | — |
| Slitasje på de hvite flatene | Sterkere: grått-brunt i flekker, mørkere ved føttene, grått der hender og tau går over ripa, grønngrått under takkantene | per hjørne, se under |
| Radio, brytere og list på broa | VHF med håndsett på hylla mellom dashbordet og vinduene (en AIS sto der også i bildene sensoren så, og er tatt ut etter kontrollen: AIS kjøpes, og kjøpbart utstyr modelleres ikke inn), ti brytere med kontrollamper langs dashbordets fot, treliste rundt veggene under taket | `spill_bro`, `rend_c_helm` |
| Roret som en plate | Profilror NACA 0018 (før 11 %), korden 0,60 m oppe og 0,50 nede, avrundet fot, kobling med fire bolter der stammen møter bladet, og hæl med lagerhus på skoens akterende | `rend_c_under` |

**Bildene:** nattbilde med hele masta (`spill_natt`, den hvite rundtlysende på toppen), nattbilde mens hun fisker (`spill_fiskenatt`, rødt over hvitt), teinesettingen med stabelen om bord (`spill_teiner`), og navnet på i alle (`tests/ma36shot.py` sletter `S.unnamed`, lukker «Mens du var borte» og skjuler kartet og statusboksen; `MA36_ONLY=teiner` tar bare teinene). `teiner_sett` i `ombord.py` viser fortsatt ingen stabel (alle seks er satt før bildet), og testen er ikke denne øktas.

**Testene i runde 3.** `check()` 38 av 38 (tre nye linjer, sett røde mot de gamle målene), `flatnorm` 0, `clip_malo36` 0 (202 punkter i de første listene i `alu` og en lås for dypt; rettet), enhetstestene 3 564 OK, `lanterntest` og `regmarktest` grønne, `crewclip` (breisjarken `jig 2/2`; rød bare for `snokrabbe` som før), `walktest` (breisjarken OK; rød bare for autolineren som før), `vesseltest` grønn etter at den kjente sjekken fra HS3 er rettet. 3D-testene står i commit-meldingen.

**Karakteren i runde 3: 71/100, ikke ferdig.** Satt 12.11.2026 av en uavhengig underagent som bare fikk mappa og skalaen (kap. 2 i `om-bord.md` uten tabellen med karakterene). Den fikk ikke grunnlaget, ikke forrige karakter og ingen vurdering fra økta.

| Punkt | Vekt | Runde 2 | Runde 3 | Sensorens begrunnelse (forkortet) |
|---|---|---|---|---|
| Skrogutforming | 20 | 15 | 16 | Vekt, like sider og jevne vannlinjer; spranget og fenderlista fine. Trekk: 2 % for lang, roret leses fortsatt som en flat plate og hælen som en plate, kjølen er en kasse, speilet og stevnen er kantete |
| Detaljer | 20 | 13 | 13 | Mye beslag. Trekk: nesten ingen synlig slitasje eller rennemerker, grove sopplufter og pullerter, ikke noe anker i baugrulla, ingen vindusviskere sett, dekket ser stilisert ut |
| Lanterner | 5 | 4 | 4 | Rødt og grønt riktig, rødt over hvitt mens hun fisker. Trekk: akterlanternen er ikke vist, lysene er små punkter uten glød, og i rendringen er alle tent samtidig |
| Styrhus | 10 | 8 | 8 | Dashbordet troverdig med radioene. Trekk: tykk midtstolpe, grovt pikslede skjermer i spillet, tomt tak |
| Arbeidsflyt | 25 | 16 | 15 | Porten, plassene og rekkefølgen gir mening. Trekk (lest som alvor A): mannen i blått i `spill_teiner` står i den tynne stolpen under lyets akterkant om styrbord, mannen i rødt i `teiner_trekk` i en stolpe, setteren 2,5 cm fra galgestolpen, og flaggstanga ser ut til å gå gjennom setteren i fem ark (sett ovenfra akter: stanga står på galgen 5 m opp, men den skrår akterover mot kameraet) |
| Utforming av dekk | 20 | 15 | 15 | Planen henger sammen. Trekk: casingen tar hele babord akterhjørne, gangen om styrbord er 0,45 m, centimetermarginer der teina tømmes, lyets akterstolper står i arbeidssonen |
| **Sum** | 100 | **71** | **71** | |

**Etter kontrollen (`/kontroll` og `/code-review`, 12.11.2026), rettet og eksportert på nytt:** AIS-en på dashbordet er tatt ut (AIS kjøpes, og kjøpbart utstyr modelleres ikke inn; VHF-en følger båten), slitasjen på skansens innside går igjen opp fra dekket (den nye regelen ga hele innsida samme mørke), mastelinja i `check()` regnes mot den nye flaggstanga, det gamle hælpinnet er borte, og patchnotatet sier hva som er endret, ikke hvorfor. Sensoren så bildene med AIS-en, så «Styrhus» kan være satt et halvt poeng for høyt. `spill_bro` og rendringene av broa er tatt på nytt uten den. GL-feilene i `potshot` (1282) er der også på bygget fra før endringen og er ikke modellens (backloggen, 10.6).

**Det som mangler til 75 (fire poeng), og hvor det ligger:**

- **Stolpene under lyets akterkant og folkene** (modellen og felles kode): den om styrbord står ved x 2,30 på ripa, og juksaplassen ved 2,64 og plassene under teinetrekkingen kommer inntil den. Prøv å flytte stolpen lenger akter eller inn, og legg en sjekk i `check()` for avstanden fra hver mannskapsplass til hver stolpe (minst 0,25 m til skuldra). Mannen i stolpen i `teiner_trekk` må finnes med et bilde ovenfra.
- **Setteren og galgen:** 2,5 cm er for lite til at det leser fritt. 10–15 cm til, og flaggstanga rett opp eller på aktermasta, så den ikke ser ut til å gå gjennom folk sett ovenfra akter.
- **Roret og hælen:** profilen synes ikke fra siden. Avrundet forkant som synes, tykkere hæl med overgang til kjølen.
- **Slitasjen** synes ikke på de store hvite boksene (farge bare i hjørnene). Uten teksturer: flere hjørner der slitasjen skal synes, eller en tekstur (spørsmål for grafikkplanen).
- **Anker i baugrulla, vindusviskere som synes, finere sopplufter og pullerter.**
- **Akterlanternen vist om natta** (et nattbilde rett akterfra).
- **Felles kode (ikke modellen):** han som står ved styrbord galgestolpe i pausen, tre tett ved porten under settingen, og hvile som bare er å stå.


### 10.11 Runde 4 (12.11.2026)

Steg 89 på nytt, Jonas' økt på grenen `claude/ob11-r4-breisjark`, etter startmeldingen «Runde 4» i `docs/planer/start/89.md`. Valg 32, bredden (4,12 m), navnet og merket på 20 cm står urørt. Bildene, arkene og `check.txt` står i `docs/okter/2026-11-12-ob11-r4/`.

**Hvor folkene står (sonden).** I stedet for å gjette plassene fra `deckcrew.js` ble spillet spurt: en sonde kjørte scenene fra `tests/ombord.py` (teiner sett og trekk, juksa jig, maskin og sløy, line og garn sett og trekk, rydd, hvile, ut) og skrev ut hver som sto på plass (`CREW3D.visible()`, `mode` `at`) i modellens ramme. Mannen i blått i `spill_teiner` var den som tar kaffe ved ripa om styrbord (x 2,5, y −1,7), 0,02 m fra skuldra til stolpen ved x 2,30. Juksaren på den akterste plassen (x 2,64) sto mellom den stolpen og lyets vegg (0,19 m til veggens ende). Mannen i rødt i `teiner_trekk` sto ved x 3,9, y −1,3 (nummer to ved teina), 0,8 m fra veggen: han sto ikke i en stolpe, men bak lyets veggende sett fra kameraet akter om styrbord. Plassene står i `CREW_WORK` og `CREW_REST` i skriptet. Sonden er `tools/boats/qa/crewplaces.py`, og arkene lages av `tools/boats/qa/sheet_ob11.py` (FØR fra forrige rundes ETTER-rad).

**Det som er gjort i modellen:**

| Punkt fra 10.10 | Gjort | Målt (`check()`) |
|---|---|---|
| Folk i stolpen under lyets akterkant om styrbord | Stolpen er tatt bort (`ROOF_POSTS`). Takhjørnet bæres av lyets vegg akter for åpningen med et kne under takkanten (0,4 m dypt, 2,0 m over dekket), av veggen om babord og av stolpen om babord over maskinkassa; det henger 0,8 m akter for veggen. Den akterste juksaplassen er flyttet fra x 2,64 til 2,40 (`JIG`, `anchors.jigZ`) | ny linje: arbeidsplassene (juksaplassene, haleren, ved teina og blødekaret, bordet, setteren, den som mater garnet) minst 0,25 m fra skuldra til stolpene (lyets akterstolpe, lyets vegg akter for åpningen, åpningens forkant, galgestolpene, aktermasta): nærmeste 0,29. Ny linje: plassene i pausen og ryddingen minst 0,05: nærmeste 0,08 (kaffe forut for veggens ende). Begge røde med runde 3-målene |
| Setteren 2,5 cm fra galgestolpen | Setteporten og galgen 8 cm bredere på hver side: porten ±0,78, stolpene ±0,85 | setteren 0,105 m fra stolpens innside; krever 0,10 (før 0,02). Rød med 0,77 |
| Flaggstanga skrå over setteren | Rett opp i hylsa på utsida av babord galgebjelke | ny del av linja: toppen rett over foten; rød med den skrå stanga |
| Roret og hælen leses som plater | Roret: bladets omriss med 0,14 m radius der forkanten møter toppen og foten, bladet 0,11 m lavere (toppen 0,86) så stammen (Ø 0,11) synes over det, kobling med fire bolter og et nav der stammen går inn i skroget. Skoen er en kropp, 0,165 m dyp (før en plate på 9 cm), 0,20 bred ved kjølen og 0,15 ved hælen, med en hulkil opp i kjølens akterende og avrundet hæl | propellen 0,20 m over skoen (før 0,28 mot den tynne); `c_rudder` |
| Detaljer | Ankeret i baugrulla i rendringene (spillets eget: `anchors.bower`, en plog på 16 kg; det manglet i alle rendringer fordi spillet tegner det). Viskere som pendler fra veggen over hver frontrute, rustfrie armer og svart gummi (svarte armer forsvant mot det mørke glasset). Sopplufter med boltet fot, bånd, kuppel og mørk munn under skjørtet. Pullerter med skrådd fotplate, bolter, sveis, midje og tung hette med leppe | `c_anchor`, `c_wipers`, `c_vents` |
| Slitasje på de store hvite boksene | Styrhusets vegger og maskinkassa er rutenett på 0,12–0,15 m, så slitasjen per hjørne har hjørner å sitte på; regnstriper ned veggene; rustrenner under lensportene på det blå (som `hs11.py`) og ved baugen under ankeret | `flatnorm` 0; `c_free`, `K2` |
| Akterlanternen om natta | Nattbildet rett akterfra i spillet (`ma36shot`, `natt_akter`) og i rendringen (`c_night_stern`) | — |
| Teinene ovenfra | `ma36shot` tar settingen og trekkingen ovenfra og skriver hvor hver står | `spill_teiner_ovenfra`, `spill_teinetrekk_ovenfra` |

**Før-bildene.** Arkene har runde 3s etter-rad som FØR (samme modell som før denne runden, tatt 12.11.2026 om morgenen) og opptakene fra denne runden som ETTER. Før-opptaket på nytt ble startet og stoppet etter 8 av 24 klipp: med to opptak samtidig tok det over to timer per format, og modellen var den samme som i runde 3. Felles kode kan ha endret seg mellom runde 3 og nå (OB10 runde 4 eier `deckcrew.js` og var ikke flettet inn da opptakene ble tatt).

**`STAB_AT.breisjark.fish`** er midten av de to juksaplassene: 2,03 (fra midtskips, akterover) med runde 3s plasser, 2,15 nå. `core/03c-stability.js` eies av OB10 runde 4 (arbeidsrutinen) mens denne økta går, så tallet står i den øktas linje under «Øktene som kjører» i køen. `tests/unit/trim.test.mjs` sjekker ikke `fish`, og 12 cm for to mann gir ingen trim som synes.

**Testene i runde 4.** `check()` 40 av 40 (fire linjer nye eller strengere, alle røde med runde 3-målene), `flatnorm` 0, `clip_malo36` 0, enhetstestene 3 638 OK, `lanterntest`, `regmarktest` og `vesseltest` grønne, `crewclip` (breisjarken `jig 2/2`; rød bare for `snokrabbe` som før) og `walktest` (breisjarken OK; rød bare for autolineren som før). `ombord.py breisjark` 24 operasjoner i begge formater med `clipcheck` tom i alle. `potshot`, `brotest breisjark` og `vessel3d breisjark`: se commit-meldingen.

**Karakteren i runde 4: 71/100, ikke ferdig.** Satt 12.11.2026 av en uavhengig underagent som bare fikk mappa og skalaen (kap. 2 i `om-bord.md` uten tabellen med karakterene), ikke grunnlaget, forrige karakter eller øktas vurdering.

| Punkt | Vekt | Runde 3 | Runde 4 | Sensorens begrunnelse (forkortet) |
|---|---|---|---|---|
| Skrogutforming | 20 | 16 | 16 | Glatt og likt, vekta treffer. Trekk: dødveden og propellbrønnen er en firkantet kloss med loddrett akterstevn, roret leses fortsatt som en plate (profilen synes ikke fra siden), 2 % for lang |
| Detaljer | 20 | 13 | 14 | Ankeret, viskerne, soppluftene og pullertene sett. Trekk: rustrennene var mettet oransje og så ut som lys om natta, lite slitasje ellers, nakne innvegger i lyet og styrhuset, en sagtakket kant ved styrhusets akterhjørne, eksosrøret tett inntil flåten |
| Lanterner | 5 | 4 | 4 | Riktig, rødt over hvitt. Trekk: dekkslyset overdøver akterlanterna under gange, Blender-nattbildene for mørke |
| Styrhus | 10 | 8 | 7 | God sikt og dashbord. Trekk: fasetterte innervegger, mørkt og tomt tak, ingen takkonsoll |
| Arbeidsflyt | 25 | 15 | 16 | Plassene og settingen gir mening, mannskapet klar av stolpene i de fleste bildene. Trekk (A): setteren står inne i teinestabelen i `teiner_sett`; sprut som svever over dekket (`garn_sett`); line og garn fra haleren til stamp og kar vises ikke; garnrulla brukes aldri |
| Utforming av dekk | 20 | 15 | 14 | Logiske plasser, trinn og gang. Trekk (A): teinestabelen 0,18 m fra setteporten; aktermasta midt foran porten; få dekksdetaljer |
| **Sum** | 100 | **71** | **71** | |

**Rettet etter sensuren (12.11.2026), ikke sensurert på nytt:** den sagtakkede kanten var rutenettet denne runden la på styrhusveggene (solidify og vinduskuttene ga hakk ned akterhjørnet om babord); styrhusskallet er tre ringer igjen. Rustrennene er dempet (0,30, 0,18, 0,11 med 0,55 i stedet for lys rust med 0,80). Begge er eksportert på nytt og vist i `rend_K3p`, `rend_c_free`; arkene og bildene fra spillet er tatt før rettingen.

**Det som mangler til 75 (fire poeng), og hvor det ligger:**

- **Teinestabelen og setteren (A, modellen og felles kode):** stabelen står på OB16s plass foran setteporten (x 0,67, y −0,40, ringen fra y −1,13 til 0,33), og spillet stiller setteren 0,45 m til styrbord for midten over hekken (`deckcrew.js` `setOver`), altså inne i ringen. Styrbord låring er prøvd og felt av `potshot` (10.9), babord låring stenges av maskinkassa og pullerten. Løsningen er en egen setterplass i modellen som spillet leser når teiner settes (`kit.setter`), eller at `potshot`s unntak regnes fra skrogets virkelige side; begge rører felles kode (`deckcrew.js`, `tests/potshot.py`), som OB10 runde 4 eier nå.
- **Dødveden og propellbrønnen (modellen):** avrundet overgang fra kjølen til akterstevnen og brønnens forkant, så det ikke leses som en kloss.
- **Styrhuset inne (modellen):** innervegger uten fasetter (fler ringer uten vinduskuttene som ga hakk), en takkonsoll med radio og lys.
- **Akterdekket (modellen):** aktermasta står midt foran setteporten (0,25 m fra stampenes vei); garnrulla over hekken har ingen rolle i spillet. Begge er tegningens.
- **Felles kode:** sprut over dekket (`garn_sett`), line og garn som ikke vises fra haleren til stamp og kar, dekkslyset under gange (`spill_natt_akter`), og flaggstanga som i perspektiv tegnes over folk ved hekken (den står nå rett opp på galgen; det som står igjen, er kameraets vinkel).
