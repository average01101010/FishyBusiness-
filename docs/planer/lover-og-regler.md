# Lover og regler på sjøen (plan 28.10.2026)

> Plan etter `/planlegg`. Ingenting er bygd. Jonas svarte på valgene 28.10.2026: «V1: A, V2: A, V3: Nei, men finn ut listen for påbudt utstyr for relevant skip så kan vi heller lage modeller av utstyret i blender om vi ikke har det fra før. V4: Ja, V5: A». Lista over påbudt utstyr står under L6. Jonas valgte V6 A og sa hvilke ting som oppbevares inne og ikke skal lages (28.10.2026). **Venter på «kjør på» for L0.** Status står nederst.

## Hva Jonas ba om

28.10.2026: «Implementering av Lover, forskrifter, regler i spillet. Mål: At spillet har en høyest mulig grad av realisme, uten at det blir en dårlig eller mindre gøy opplevelse for brukerne.» Med lista: Sjøveisreglene, sjøloven, skipssikkerhetsloven, skipsarbeidsloven og forskriften om skips navn, kjenningssignal, merking og hjemsted. Senere samme dag: forskriften om farvannsskilt og navigasjonsinnretninger, forskriften om navigasjon og navigasjonshjelpemidler, havne- og farvannsloven, og konvensjonen om Den internasjonale organisasjonen for maritime navigasjonsinnretninger og -tjenester (IALA). «Lag en plan som tar sikte på å jobbe med en ting av gangen slik at vi klarer å holde fokus og unngår å jobbe for bredt.»

Fiskerireglene (kvoter, grunnlinja, fjordlinjene, redskapsregler, minstemål) har allerede regelmotoren R1–R4 (`docs/systemer/kvoter-og-regler.md`). Denne planen gjelder **sjøfarten**: hvordan båten føres, merkes, utstyres og bemannes.

## Kildene

Lest eller slått opp 28.10.2026. «Ikke lest» betyr at bare tittel og nummer er sjekket. L0 leser teksten før noe bygges.

| Kilde | Nummer | Gjelder spillet | Lest |
|---|---|---|---|
| Sjøveisreglene (forskrift om forebygging av sammenstøt på sjøen) | FOR-1975-12-01-5 | Ja, alle båter | Reglene 22–30 lest 17.10.2026 (lanternene, `docs/batplan.md` del 11). Reglene 2–19 og 32–37 ikke lest ennå |
| Sjøloven | LOV-1994-06-24-39 | Ja | Overskriftene: § 131 skipets sjødyktighet, § 133 skipsbøkene, § 135 havsnød, kap. 6A §§ 143–145 alkohol, kap. 8 §§ 161–164 sammenstøt (skyld, hendelig uhell, plikt til å hjelpe), kap. 16 §§ 441–455 berging. Teksten er ikke lest, bare kap. 16 (`turSlep`) |
| Skipssikkerhetsloven | LOV-2007-02-16-9 | Ja | Ikke lest |
| Skipsarbeidsloven | LOV-2013-06-21-102 | Ja, når båten har mannskap | Ikke lest |
| Forskrift om skips navn, kjenningssignal, merking og hjemsted | FOR-2002-06-27-754 | Ja | Lest: § 5 kjenningssignal for registrerte skip og fiskefartøy 10,67–15 m; § 6 IMO-nummer ikke for fiskefartøy; § 9 navnet på begge bauger og hekken, minst 15 cm, under 15 m minst 6 cm og synlig fra begge sider, hjemstedet på hekken, kjenningssignalet innhugget inne i båten og under 15 m også på skroget (6 cm under 24 m) |
| Forskrift om farvannsskilt og navigasjonsinnretninger | FOR-2012-12-19-1329 | Ja (skilt og merker langs leia) | Ikke lest. Hjemmel: havne- og farvannsloven |
| Havne- og farvannsloven | LOV-2019-06-21-70 | Ja (fartsgrenser, havneområder, ferdsel) | Ikke lest |
| IALA-konvensjonen (Den internasjonale organisasjonen for maritime navigasjonsinnretninger og -tjenester) | Traktat, nummeret sjekkes i L0 | Konvensjonen oppretter organisasjonen og gir ingen regler for båtene. Det som gjelder spillet, er IALAs merkesystem (region A: rødt om babord inn fra havet, grønt om styrbord, kardinalmerkene, toppmerkene, lyskarakterene), som de norske sjømerkene følger | Ikke lest |
| Forskrift om navigasjon og navigasjonshjelpemidler for skip og flyttbare innretninger | FOR-2014-05-05-1157 | **Nei**, fiskefartøy er unntatt (lasteskip, passasjerskip, innretninger). Den gjelder NPC-trafikken, ikke spillerens båter | Omfanget sjekket |
| **Lagt til:** Forskrift om fiske- og fangstfartøy under 15 meter største lengde | FOR-2013-11-22-1404 | Ja, de fleste båtene i spillet. Det er her utstyrskravene for fiskebåtene står (det navigasjonsforskriften gjør for andre skip) | Utstyrskravene lest 28.10.2026 (§§ 15–17, 36–45, 60–61, 63–68, 75–89) |
| **Lagt til:** Forskrift om konstruksjon, utstyr, drift og besiktelser for fiske- og fangstfartøy med største lengde på 15 m og derover | FOR-2000-06-13-660 | Ja, båtene fra 15 m (kyst21 og havbåtene) | Kap. 7 (redningsmidler), 9 (radio) og 10 (navigasjon) lest 28.10.2026. Kap. 5 (brann) ikke lest |
| **Lagt til:** Kvalifikasjonsforskriften (sertifikater og fartsområder) | Nummeret sjekkes i L0 | Bare som bakgrunn (se V3) | Ikke lest |
| Allerede i spillet: ervervstillatelsesforskriften §§ 22–23 (registreringsmerket) | | Bygd 07.10.2026 (`docs/systemer/baater.md`) | Lest |
| Allerede i spillet: forskrift om arbeids- og hviletid på fiskefartøy | FOR-2017-11-10-1758 | **Fjernet** (Jonas 11.10.2026: «Fjern alt om hviletid») | Lest |

`www.sdir.no` slipper ikke gjennom proxyen i testmiljøet (DNS-feil). Lovdata svarer. Sjøfartsdirektoratets veiledninger og rundskriv må hentes på en annen måte (en arbeidsflyt, eller at Jonas åpner domenet i nettverksinnstillingene).

## Hva som finnes i dag

- **Lanternene** etter sjøveisreglene 22–30 (`lanterns` i `vessel3d.js`, tent i `view3d/` etter status, fart, anker og fiske; `tests/lanterntest.py`, `anchorlight3d`). Dagsignalene (to kjegler, kula) tegnes ikke (`vessel3d.js` rundt linje 1198).
- **Registreringsmerket** (fiskerimerket, T-33-LK) etter ervervstillatelsesforskriften §§ 22–23, bokstavhøyde etter lengden (`regOf`, `markStrips`, `src/data/regmerke.json`). Navn og logo på skroget (`nameQ`, `markQ`, Malerverkstedet). Hjemsted på hekken og kjenningssignal er ikke bygd (`docs/batplan.md` del 12).
- **AIS** med NPC-trafikk innenfor 15 km (`coastNear`, `AIS_KM`) og spillerbåter (`PEERS`). **VHF** gir værmeldinger og kulingvarsel (`radioForecast`). NPC-båtene følger leinettet og viker ikke for noen.
- **Støt og grunnstøting** (Fysikk 3, `core/16c-hull.js`): skade, lekkasje, lensepumpe, redningsskøyte, verft og kasko. Støt mellom båter finnes ikke («Ikke gjort» i 5.60).
- **Slep med bergelønn** etter sjøloven kap. 16 (`turSlep`).
- **Mannskapet** har hyre gjennom lotten (Økonomi 2), trivsel, energi og avmønstring, men ingen arbeidsavtale. Hviletiden er fjernet. Papirene (sertifikatene) er tatt bort fordi spillet aldri sjekket dem.
- **Sjømerkene** langs kysten (`kart-og-terreng.md`, releasene `sjomerker-N`) og fyrene (`fyr.json`).
- **Sikkerhet SK1–SK6** (backloggen, oppgave #164): vest, drakt, leider, livbøye, PLB, mann over bord, nødstopp. Ikke begynt.

## Prinsippene for denne planen

1. **Loven gir spillet noe å gjøre, ikke noe å vente på.** Hver regel skal svare på: hva gjør spilleren annerledes nå? En regel som bare er tekst, legges i håndboka, ikke i spillet.
2. **Følgene kommer fra simuleringen** (`CLAUDE.md`, Friction for Flow): et sammenstøt koster skade, ansvar og kaskopremie, ikke en oppdiktet straff. Bøter og kontroller bare om Jonas vil det (V1).
3. **Varsle før feil**, slik regelmotoren gjør (R4): spilleren skal få vite at hun har vikeplikt før hun treffer noen, ikke etter.
4. **Autonav og driftsplanen følger reglene selv**, så den som ikke styrer, aldri får følger for noe hun ikke kunne påvirke. Felles klokke: det som skjer mens spillet er lukket, må gå riktig også da.
5. **Én lov om gangen, én fase per økt.** Hver fase er ferdig, testet og rullet ut før neste begynner. Ingen fase rører `src/js/` på to steder samtidig.
6. **Kilden oppgis** i systemdokumentet med paragraf, slik `kvoter-og-regler.md` gjør.
7. **Hele kysten** fra start, og stikkprøver i Bergen, Bodø og Hammerfest/Båtsfjord der fasen har med steder å gjøre.

## Fasene

Rekkefølgen er valgt etter hvor mye spilleren merker det, og så det ene bygger på det forrige. Hver fase passer én økt.

### L0 Kildene (bare dokumenter, én økt)

Les teksten i hver kilde over på Lovdata og skriv `docs/systemer/sjofart-og-lover.md` (nytt systemdokument): per lov og paragraf hva som gjelder hvilke båter (lengde, åpen eller lukket, mannskap), hva spillet gjør med den (bygges, i håndboka, eller med vilje utelatt) og hvilken fase. Finn nummeret på forskriften for fiskefartøy på 15 m og over og kvalifikasjonsforskriften. Legg dokumentet inn i `docs/INDEKS.md`. Ingen kode, ingen tester.

### L1 Sjøveisreglene: vikeplikt og varsel (én økt)

Sjøveisreglene 13–18: innhenting (13), møtende (14), kryssende (15, den som har den andre om styrbord, viker), plikten til å vike og til å holde kurs og fart (16, 17), og rangen mellom fartøyene (18: maskindrevet viker for fartøy som fisker). Regel 18 gjør at fiske faktisk gir forrang, og det skal spilleren merke.
- **Kjernen:** `colregSit(a, b)` (ny, `core/`) gir situasjonen, hvem som viker, CPA og TCPA mellom egen båt og hver båt innenfor AIS-rekkevidden. NPC-ens `n.st` sier om den fisker.
- **NPC-båtene viker** når de har vikeplikt: en tydelig kursendring til styrbord eller fartsreduksjon i god tid (regel 16), og holder kurs når spilleren skal vike.
- **Varsel:** i kartplotteren og statusboksen («Kryssende fra styrbord: du viker», CPA i meter, en farget vektor på AIS-målet). Bare når CPA er under en grense og TCPA under noen minutter, så det ikke maser.
- **Autonav viker** for båter den har vikeplikt for, og går tilbake til ruta.
- **Tester:** ny `colregtest.py` (LITE): situasjonene 13–15 og 18 med faste båter, NPC som viker, Autonav som viker; `routetest`/`autonavtest` der Autonav endres.
- **Måles:** hvor ofte varselet kommer på en vanlig tur ut og hjem (det skal være sjeldent).

### L2 Sammenstøt mellom båter og sjøloven kap. 8 (én økt)

Det Fysikk 3 ikke har: støt mot andre båter (NPC og spillere) og bøyer. Skaden regnes med `hullHit` som i dag. Hvem som betaler, følger sjøloven § 161 (skyld fordeles etter hvor mye hver har skyld) og § 162 (hendelig uhell: hver bærer sitt), og skylda leses fra `colregSit` i øyeblikket før støtet (hvem hadde vikeplikt, holdt den andre kurs). Kaskoen dekker egen skade over egenandelen og ansvaret overfor den andre. § 164: etter et sammenstøt skal man hjelpe og oppgi båtens navn og hjemsted; spillet gjør det for deg og skriver det i dagboka. **Andre spilleres båter skades aldri** av ditt støt (sosialt er additivt, `CLAUDE.md`); de får bare en melding. Tester: `hulltest` utvides.

### L3 Sjøveisreglene: sikt, lyd og dagsignaler (én økt)

- Regel 6 og 19 (sikker fart og nedsatt sikt): i tåke og mørke kortere radar- og øyesikt, og Autonav senker farten til sikker fart. Varselet fra L1 kommer tidligere.
- Regel 34–35 (lydsignaler): tåkesignal fra båter i tåke (ett langt hvert 2. minutt under fart, langt og to korte for fiske), og manøversignalene når NPC-en viker. Spillerens horn finnes (tuting).
- Regel 26 og 30 (dagsignaler): to kjegler med spissene mot hverandre når båten fisker, kula ved anker, i 3D for alle båter (`lanterns`, `vessel3d.js`).
- Tester: `lanterntest` utvides med dagsignalene, `lyd` ses for seg.

### L4 Merking, navn, kjenningssignal og hjemsted (én økt, liten)

FOR-2002-06-27-754 § 5 og § 9: kjenningssignal (fire tegn, `LK1234`-form, sjekkes i L0) for båter fra 10,67 m, malt på skroget under 15 m; navnet på begge bauger og hekken med bokstavhøyde etter lengden (6 cm under 15 m, 15 cm fra 15 m); hjemstedet på hekken for båter i skipsregisteret (15 m og over). Kjenningssignalet står på AIS-kortet og i VHF-meldingene. Avslutter `docs/batplan.md` del 12. Ingen ekte båters kjenningssignal (samme sperre som registreringsmerket, `reg_claims`). Tester: `vesseltest`, skjermbilder av skroget i begge formater.

### L5 Farvannet: skilt, fartsgrenser og havneområder (én økt, kanskje to)

Havne- og farvannsloven og farvannsskiltforskriften: fartsgrenser i havner og sund (skiltene og grensa i kartet), forbud mot ankring der det er skiltet, og at sjømerkene i spillet følger skiltforskriften og IALAs region A (lateral og kardinal, farger, toppmerker, lyskarakter), sjekket mot `sjomerker-N` i kartet. Et merke spilleren går feil side av, er en grunnstøting som venter (Fysikk 3), så varselet fra L1 får en linje for det («Du går på feil side av merket»). Datakilden for fartsgrensene er det usikre: de lokale fartsforskriftene er kommunale, og et åpent datasett fra Kystverket er ikke funnet ennå (L0 leter). Hvis det ikke finnes, holder det med havnene og mottakene spillet kjenner (V4). Autonav holder fartsgrensa selv. Kjølvannet fra Fysikk 4 (F1) gjør at fart i havn synes. Stikkprøver langs kysten.

### L6 Påbudt utstyr: modellene i Blender og plassen på båtene (V3, to økter)

Jonas (V3, 28.10.2026): ingen sjekkliste, ingen sperre og ingen følger i kaskoen. I stedet lista over hva hver båt skal ha om bord, så utstyret som mangler, lages i Blender og står på båtene. **L6a** lager modellene som mangler (`/blender`, `tools/deck/sikker.py` utvides). **L6b** setter dem på båtene etter lista, i det antallet reglene krever, slik livbøyene og flåtene står i dag (`view3d/09-landing-deck.js`, `K.buoys`). Mann over bord og nestenulykker (resten av SK1–SK6) er ikke med her og står i backloggen.

**Båtene i spillet og hvilken forskrift som gjelder dem:**

| Gruppe | Båtene | Forskrift |
|---|---|---|
| Åpne, uten styrhus | skiff (5,9 m), trebat (7,0 m) | FOR-2013-11-22-1404 |
| Åpen med hardtop | snekke (7,9 m) | FOR-2013-11-22-1404 (regnes som åpen med styrhus: drakt og radio gjelder) |
| Med styrhus under 10,67 m | plastsjark (9,45 m), sjark (10,57 m) | FOR-2013-11-22-1404 |
| 10,67–15 m | hurtigsjark, sjarkny, breisjark (10,99 m), kyst15 (14,99 m) | FOR-2013-11-22-1404, og de strengere kravene fra 10,67 m (12 m for horn og lyskaster) |
| 15–24 m | kyst21 (21 m) | FOR-2000-06-13-660 |
| 24–45 m | ingen nå | FOR-2000-06-13-660 |
| 45 m og over | autoliner (45,4 m), snokrabbe (50 m), bunntral (60,3 m), pelagisk (75 m: 75 m-grensa for livbøyene) | FOR-2000-06-13-660 |

**Lista** (antall per person = `crewMax` + skipperen; «fra» er største lengde):

| Utstyr | Under 15 m (FOR-2013-11-22-1404) | 15 m og over (FOR-2000-06-13-660) | Modell i dag |
|---|---|---|---|
| Redningsvest | én per person (§ 36) | én per person (§ 7-8) | **Mangler.** Lages som oppblåsbar vest båret av folk på dekk (referansebildene under) |
| Overlevelsesdrakt | én per person på dekkede båter og åpne med styrhus (§ 37) | én per person (§ 7-9) | Oppbevares inne, vises ikke |
| Redningsflåte | dekkede båter over 6 m: plass til alle; høyst tre om bord: 4-mannsflåte etter ISO 9650-1 (§ 38) | plass til 200 % av de om bord; fra 45 m én på hver side som tar alle (§ 7-5) | Finnes: `flate4`, `flate6`, `flate12` med vugge (`sikker.py`) |
| MOB-båt | | fra 45 m; 24–45 m med bankfiske II (§ 7-5) | **Mangler.** Lages med davit og vugge (referansebildene under) |
| Livbøye | én per tre personer, minst halvparten med lys; under 10,67 m minst én med 30 m flytende line, 10,67–15 m minst to, én med line på hver side (§ 43) | under 24 m 3, 24–45 m 4, 45–75 m 6, fra 75 m 8; lys på minst halvparten (under 24 m minst én); røyk på minst to (under 24 m én); line på hver side (§ 7-10) | Finnes: `livboye`, `livboye_w`, `boyeholder`, `boyelys`, `boyeline`. **Mangler:** lys og røyk i ett (referansebildet under), som erstatter `boyelys` på bøyene som skal ha røyk |
| Nødsignaler | to røyksignaler; fjord- og kystfiske tre fallskjermraketter og tre håndbluss, bankfiske seks og fire (§ 44) | fallskjermraketter 12 fra 24 m, ellers 4; håndbluss 4–10 etter lengden; to røyksignaler (§ 7-12) | Oppbevares inne, vises ikke |
| Linekaster | | fra 24 m (§ 7-11) | Oppbevares inne, vises ikke |
| Nødpeilesender (EPIRB, fritt flytende) | kystfiske og større (§ 68) | kystfiske og større, og fra 24 m (§ 9-6) | Oppbevares inne, vises ikke (Jonas 28.10.2026) |
| SART (radar- eller AIS-SART) | kystfiske og større (§ 68) | under 24 m én, fra 24 m én i hver flåte (§ 7-14) | Oppbevares inne, vises ikke |
| Håndholdt VHF | kystfiske og større (§ 68) | én per flåte og MOB-båt (§ 7-13) | Oppbevares inne, vises ikke |
| VHF med DSC | dekkede og åpne med styrhus (§§ 64, 68) | alle (§ 9-6) | I butikken (`EQUIP.vhf`), modell i konsollen |
| AIS | | fra 15 m (§ 10-4a) | I butikken (`EQUIP.ais`), ingen synlig del |
| Brannslukker | minst to på 6 kg, én om båten ikke har styrhus eller lugar (§ 17) | kap. 5, ikke lest | Oppbevares inne, vises ikke |
| Kompass | alle (§ 75) | alle; fra 24 m standardkompass og styrekompass (§ 10-3) | Finnes i skiffen og havsjarken |
| Radar | 10,67–15 m bygd etter 1997 (§ 79) | fra 24 m, og under 24 m med bankfiske I (§ 10-3) | Finnes (`radome`, åpen antenne) |
| Brovaktsalarm | 10,67–15 m med autopilot (§ 77) | med autopilot og kystfiske (§ 10-7) | I butikken (`EQUIP.brovakt`), ingen synlig del trengs |
| Kikkert | alle (§ 84) | alle (§ 10-4) | Finnes i hendene (`hender.py`) |
| Horn eller fløyte | 12–15 m fast montert (§ 88) | sjøveisreglene vedlegg III | Finnes på havsjarken, hurtigsjarken og Maloen |
| Lyskaster | 12–15 m (§ 89) | alle (§ 10-5) | Finnes på fem modeller |
| Signalfigurer (kjegler, kule) | alle (§ 87) | alle (§ 10-5) | Lages ikke (Jonas 28.10.2026). L3 avgjør om dagsignalene skal synes likevel |
| Radarreflektor | når overbygget reflekterer dårlig (§ 60) | | Lages ikke (Jonas 28.10.2026) |
| Refleksstriper | fire per side, minst 50 × 300 mm, og seks synlige ovenfra (§ 61) | | Lages ikke (Jonas 28.10.2026) |
| Leider akter | fast, med håndtak, nederste trinn minst 300 mm under vannlinja (§ 63) | | Finnes på flere modeller som badeleider. Sjekkes mot § 63 |
| Lanterner | sjøveisreglene (§ 86) | sjøveisreglene (§ 10-5) | Finnes (`lanterns`) |

**Modellene som må lages i L6a** (Jonas 28.10.2026: nødsignalboksen, linekasteren, nødpeilesenderen, SART-en, den håndholdte VHF-en, brannslukkeren, signalfigurene, radarreflektoren og refleksstripene oppbevares inne eller vises ikke, og lages ikke). Det som står igjen, er det som synes fra dekk og på folk:

1. **Oppblåsbar redningsvest (150–165 N), båret av mannskapet på dekk.** Referansene (Jonas 28.10.2026, tre butikkbilder): en krage som går rundt nakken og ned foran brystet i to tykke, avrundede pølser med glidelås langs innerkanten, i rødt eller oransje; et svart belte rundt livet med plastspenne midt foran; en svart skrittstropp; et rødt trekkhåndtak (dråpeformet) som henger under venstre side; på noen en blinkende lampe og refleksfelt. Ingen merkenavn eller logoer (referansene har RS, Hansen Protection og Viking på seg). Vesten legges på arbeiderne og skipperen i garderoben (`tools/harbour/arbeider.py`, `garderobe.py`) som et plagg de alltid har på dekk, ikke som en egen ting på dekket.
2. **MOB-båt i vugge med davit**, fra 45 m (autoliner, snokrabbe, bunntral, pelagisk). Referansene: et hvitt davit med søyle, vinsj og én skrå arm med blokk og krok, og løftestropp til tre punkter i båten; båten oransje, rundt 5–6 m, med fenderkrage, konsoll med bøyle, påhengsmotor eller vannjet, og en oransje presenning over når den står i vugga på dekk. Mål fra SOLAS og LSA-koden for redningsbåter (måles i L6a). Davitet kan svinge ut i 3D senere, men i L6a står det bare.
3. **MOB-lys og røyk i ett på brakett**, koblet med line til livbøyen. Referansen: en oransje sylinder med bredere midtdel, to hvite lamper på skulderen, rustfri brakett øverst og hvit line nederst. Den henger ved siden av livbøyene som skal ha røyk (§ 43 og § 7-10).

**Det som ikke kan avgjøres fra forskriften:** spillet har ingen fartsområder (fjordfiske, kystfiske, bankfiske I og II). Lista antar **kystfiske** for båtene under 15 m, **bankfiske I** for kyst21 og **havfiske** for havbåtene, fordi feltene de fisker på, ligger der. Kravene til nødpeilesender, SART og håndholdt VHF følger av dette.

### L7 Skipsarbeidsloven: mannskapet ansettes og sies opp (én økt)

Skriftlig arbeidsavtale når noen mønstrer på (lott eller hyre, stilling, båt), prøvetid, oppsigelsesfrist og vern mot usaklig oppsigelse, og at mannskapet går i land når avtalen sier det. Bygger på Mannskap-appen og avmønstringen som finnes. **Hviletiden kommer ikke tilbake** (Jonas 11.10.2026), med mindre Jonas sier det. Tester: `selfcrew`, mannskapstestene.

### L8 Sjøloven for skipperen: havsnød (én økt, valgfri)

§ 135 havsnød: plikten til å hjelpe folk i havsnød, som et rop på VHF når en båt i nærheten trenger hjelp (bygger på slepet og bergelønnen). Alkohol (§§ 143–145) er ikke med (V5 A).

## Valgene

**V1 Hva skjer når en regel brytes?** Jonas: **A**.
- **A (anbefalt):** følgene kommer fra simuleringen: skade, ansvar etter skyld, høyere kaskopremie, og en linje i dagboka. Ingen bøter. *Det er den ekte følgen og den Friction for Flow tillater.*
- B: som A, og i tillegg sjeldne kontroller (Kystvakten eller politiet) med forelegg etter de ekte satsene.
- C: bare varsel og forklaring, ingen følger.

**V2 Hvor strenge er NPC-båtene?** Jonas: **A**.
- **A (anbefalt):** NPC-ene følger reglene 13–18 fullt ut: de viker når de skal, og holder kurs når spilleren skal vike. *Da lærer spilleren reglene av det som skjer rundt henne.*
- B: NPC-ene viker alltid for spilleren, uansett regel. Tryggere, men urealistisk.

**V3 Hva gjør påbudt utstyr (L6)?** Jonas: **ingen av dem**. Finn lista over påbudt utstyr, og lag modellene i Blender der de mangler (L6).
- **A (anbefalt):** utstyret som mangler, vises på sjekklista før avgang med paragraf, og kaskoen dekker ikke det som skjer for en båt som ikke var sjødyktig. Ingen sperre ved «Kast loss». *Spilleren kan velge selv, og følgen er ekte.*
- B: «Kast loss» er sperret til båten har det loven krever.
- C: bare sjekklista.

**V4 Fartsgrensene (L5) hvis Kystverket ikke har et åpent datasett:** Jonas: **A** («Ja»).
- **A (anbefalt):** en fast grense i havnene og ved mottakene spillet kjenner (5 knop er vanlig i kommunale fartsforskrifter; sjekkes), merket i kartet. *Det dekker det spilleren merker.*
- B: L5 venter til et datasett er funnet.

**V5 L8 (alkohol etter puben):** Jonas: **A**.
- **A (anbefalt):** ikke med nå; vurderes når L1–L7 er spilt. *Risikoen for at det blir irriterende er stor, og det gir lite å gjøre.*
- B: med i L8.

**V6 Påbudt utstyr i butikken (ny 28.10.2026, fra lista under L6).** Jonas: **A**. VHF, AIS og brovaktsalarm selges i dag som valgfritt utstyr (`EQUIP`), men AIS er påbudt fra 15 m, VHF på alle dekkede båter, og brovaktsalarmen med autopilot. Livbøyene og flåtene står allerede på båtene uten at de kjøpes.
- **A (anbefalt):** det som er påbudt for båten, følger med båten (står i databladet, er med i prisen og synes på båten), og butikken selger det bare til båtene der det er valgfritt. *Da har ingen båt mindre enn loven krever, og spilleren slipper å kjøpe noe hun ikke kan velge bort.* Gamle lagringer får det som mangler, gratis.
- B: som i dag. Butikken selger det, og ingen båt må ha det.

## Det som er antatt eller usikkert

- Fartsområdene som lista under L6 antar (kystfiske under 15 m, bankfiske I for kyst21, havfiske for havbåtene).
- Brannkapitlet (kap. 5) i FOR-2000-06-13-660 er ikke lest, så antallet brannslukkere fra 15 m er ikke kjent.
- Paragrafene i skipssikkerhetsloven og skipsarbeidsloven er ikke lest. Det som står om dem over, er fra overskrifter og egen kunnskap og sjekkes i L0 før noe bygges.
- Formen på kjenningssignalet for fiskefartøy (bokstaver og tall) er ikke sjekket.
- At de kommunale fartsgrensene i havn ofte er 5 knop, er ikke sjekket.
- Skyldfordelingen etter sjøloven § 161 avgjøres i virkeligheten av en domstol; spillet bruker en enkel regel ut fra vikeplikten.
- NPC-båtenes vikemanøver må ikke sende dem på land eller grunn; leinettet og `aldri på land` (`autonav.md`) må holde også da.

## Det planen ikke gjør

- Ingen nye fiskeriregler (de hører til regelmotoren).
- Ikke hviletid (fjernet av Jonas 11.10.2026) og ikke sertifikater som sperrer båtkjøp (papirene ble fjernet fordi de ikke styrte noe), med mindre Jonas ber om det.
- Ikke trafikkseparasjonssystemene langs kysten og losplikten: de gjelder store last- og tankskip, ikke spillerens båter.
- Ikke navigasjonsforskriften for spillerens båter (fiskefartøy er unntatt).
- Ingen regel som stopper tiden eller driften (felles klokke).

## Status

- 28.10.2026: planen skrevet.
- 28.10.2026: Jonas svarte på V1–V5. Lista over påbudt utstyr per båt er funnet (L6) fra FOR-2013-11-22-1404 og FOR-2000-06-13-660. 
- 28.10.2026: Jonas valgte V6 A. Utstyret som oppbevares inne (nødsignaler, linekaster, nødpeilesender, SART, håndholdt VHF, brannslukker) og signalfigurene, radarreflektoren og refleksstripene lages ikke. L6a lager vesten, MOB-båten med davit og MOB-lys med røyk. Referansebildene er beskrevet under L6, ikke lagt i repoet. Venter på «kjør på» for L0.
