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
| Juksaplassen (`anchors.jigZ`, `JIG`) | **én**, styrbord x 3,55 i den åpne sida | ripa der 0,71 m over dekket; fri for akterskansen, lyets hjørne, blødekaret og haleren |
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

### 10.6 Karakteren: 68/100, ikke ferdig

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
