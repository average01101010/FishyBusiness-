# Sjøfart og lover: vikeplikten, sikkerheten og regelverket på sjøen

> Nytt systemdokument i Ø11.1 (06.11.2026), skrevet ut fra kap. 5 og valgene i `docs/planer/lover-regler-sikkerhet.md` (Ø11a). Planen sier hvilken økt som bygger hva (Ø11.1–Ø11.9); dette dokumentet sier hva som gjelder og hva som er bygd, med paragraf og kilde, slik `kvoter-og-regler.md` gjør for fiskeriet. Hver økt i Ø11 skriver det den avgjør her samme dag.
>
> Kystvakta ser bare på fiskeriet (V1 A), så ingenting her har bøter eller kontroll. Fiskerireglene (kvoter, redskap, felt) står i `kvoter-og-regler.md`.

## 1. Valgene

Jonas' valg, med datoen de ble tatt. De spørres ikke om igjen.

| Valg | Jonas | Det betyr |
|---|---|---|
| V1 Når en regel brytes | **A** (28.10.2026) | Følgene kommer fra simuleringen: skade, ansvar etter skyld, høyere kaskopremie og en linje i dagboka. Ingen bøter, forelegg eller overtredelsesgebyr. Kystvakta ser bare på fiskeriet. |
| V2 Hvor strenge NPC-ene er | **A** (28.10.2026) | NPC-ene følger regel 13–18 fullt ut: de viker når de skal, og holder kurs og fart når spilleren skal vike. |
| npc-flåten 4 Vikeplikten | **A** (05.11.2026) | NPC-ene viker bare i spillerens egen visning, innen rundt 1 km fra båten hennes, og går tilbake til den felles banen etterpå. Avviket lagres aldri og sendes aldri. |
| npc-flåten 2 Navnene | **A** (05.11.2026) | Oppdiktede navn på alle fartøy. |
| V3 Påbudt utstyr | **Ingen sjekkliste, ingen sperre, ingen følger i kaskoen** (28.10.2026) | Lista over påbudt utstyr per båt, og modellene der de mangler. |
| V4 Fartsgrensene | **A** (28.10.2026) | En fast grense i havnene hvis Kystverket ikke har et åpent datasett. Et datasett er funnet (kap. 2.9), så V4 A er reserven i Ø11.8. |
| V5 Alkohol | **A** (28.10.2026) | Ikke med. |
| V6 Påbudt utstyr i butikken | **A** (28.10.2026) | Det som er påbudt, følger med båten. Butikken selger det bare der det er valgfritt. Gamle lagringer får det som mangler, gratis. |
| V7 Dagsignalene | **Ikke med** (05.11.2026: «Vi trenger ikke tenke på dagsignaler i spillet. Stort sett ingen bruker det på ekte») | Kjeglene, kulene og signalfigurene tegnes ikke. Om dagen sier AIS-kortet hva båten gjør (3.4). |
| V8 Det verste ved mann over bord | **A** (05.11.2026) | Ingen dør. Kommer båten ikke tilbake i tide, henter redningsskøyta eller helikopteret personen, som er sykmeldt noen dager. |
| V9 Nødstoppen på haleren | **B** (05.11.2026) | Bare en detalj på haleren. Mannskapet bruker den selv, og det står som nestenulykke i loggen. |
| V10 Senderen på vesten (PLB, AIS-MOB) | **C** (05.11.2026) | Ikke med. |
| V11 Kurs og øvelser | **C** (05.11.2026) | Ingen kurs eller øvelser i spillet. |
| Det som ikke lages | 28.10.2026 | Nødsignalene, linekasteren, EPIRB, SART, den håndholdte VHF-en og brannslukkeren oppbevares inne og vises ikke. Signalfigurene, radarreflektoren og refleksstripene lages ikke. Overlevelsesdrakten oppbevares inne. |
| Det som lages | 28.10.2026 | Oppblåsbar vest uten merkenavn, båret av mannskapet og skipperen på dekk. MOB-båt med davit og vugge. MOB-lys med røyk på brakett (bygd i Ø11.4, 06.11.2026). |
| Hviletid og papirer | 11.10.2026 | Hviletiden er fjernet og kommer ikke tilbake. Sertifikatene sperrer ingenting. |

Prinsippene 1–7 i `docs/planer/lover-og-regler.md` gjelder videre. Særlig **prinsipp 4: den som ikke styrer, får aldri følger for noe hun ikke kunne påvirke.** Derfor regnes vikingen, sammenstøtene og ulykkene bare når spillet er åpent, aldri i `catchUp`. Fra `CLAUDE.md`: felles klokke, Friction for Flow, sosialt er additivt (andre spilleres båter skades aldri), ingen ekte firmanavn.

## 2. Regelverket, med paragraf og kilde

Sjekket mot Lovdata 05.11.2026 i Ø11a (kap. 5 i planen), og sjøveisreglene 1–19 lest ordrett på nytt 06.11.2026 i Ø11.1. Der bare et sammendrag er lest, står det **[sammendrag]**; det leses ordrett i økta som bygger det.

### 2.1 Sjøveisreglene, FOR-1975-12-01-5

<https://lovdata.no/dokument/SF/forskrift/1975-12-01-5>. Forskrift om forebygging av sammenstøt på sjøen, fastsatt av Sjøfartsdirektoratet, i kraft 15.07.1977, sist endret FOR-2025-06-26-1372.

**Lest ordrett 06.11.2026:** regel 1–18 og 19 a–c. Regel 19 d og e er lest til «… i alle tilfelle navigere ytterst varsomt inntil faren»; resten av setningen er ikke lest (siden kuttes der i leseverktøyet, og Lovdata stopper `curl` og Chromium herfra med «Request stopped by Varnish IPS»). Regel 20–37 og vedlegg II–IV bare i sammendrag; vedlegg I lest 30.10.2026 (lanternene); vedlegg III ikke lest.

Det spillet bruker, regel for regel:

| Regel | Teksten (kort, ordrett der det står i anførselstegn) | I spillet |
|---|---|---|
| 2 b | Ved tolkingen skal det tas hensyn til «alle særlige omstendigheter», også fartøyets manøvreringsmuligheter | Et fartøy som ligger stille eller driver under 1 knop, kan ikke gjøre noe; da viker den som går (3.2, antatt) |
| 3 b | Maskindrevet fartøy: drevet fram av maskineri | Alle båtene i spillet (ingen seilbåter) |
| 3 d | «Fartøy som holder på med å fiske» fisker med «garn, liner, trål eller andre fiskeredskap som begrenser manøvreringsevnen», men ikke med «liner på slep eller andre fiskeredskap som ikke begrenser manøvreringsevnen» | Bare garn, line, teine, trål, not og snurrevad i sjøen gir forrang; juksa og dorg gjør det ikke (`colregCls`) |
| 3 f | Ikke under kommando: «på grunn av en eller annen usedvanlig omstendighet» ute av stand til å manøvrere | Motorstopp, tom for diesel og drift uten motor (`engine`, `adrift`); NPC-båten i et oppdrag som driver med motorfeil |
| 3 g | Begrenset evne til å manøvrere, blant annet slep som «sterkt begrenser» evnen til å avvike fra kursen (vi) | Redningsskøyta og den som sleper (slepet i oppdragene) |
| 3 h | Hemmet av sitt dypgående: maskindrevet fartøy med «sterkt begrenset evne til å avvike fra den kurs det følger» | Klassen finnes (`cbd`), men ingen fartøy får den før de store skipene kommer i Ø15 |
| 3 i | Underveis: ikke til ankers, ikke fast til land, ikke på grunn | Fortøyde og ankrede båter er ikke med i vikeplikten |
| 3 k, 11 | I sikte av hverandre «utelukkende når det ene kan ses fra det andre»; avsnitt II (regel 11–18) gjelder bare da | Ø11.1 regner alle som i sikte. Sikten og regel 19 kommer i Ø11.2 |
| 5, 7 a, 7 d i | Utkikk; «Hvis det er noen tvil, skal det regnes med at det er fare for sammenstøt»; fare når «kompasspeilingen … ikke forandrer seg merkbart» | Faren regnes som CPA og TCPA (3.2) |
| 8 a, b, e | Manøveren «markert, utføres i god tid»; så stor at den er «helt tydelig», «En rekke små forandringer … bør unngås»; om nødvendig «slakke på farten eller stoppe» | NPC-ene og Autonav svinger rundt 35° til styrbord og holder den nye linja til det andre fartøyet er klart, eller slakker av når det ikke er plass (3.3) |
| 9 b, 9 c | Fartøy under 20 m «skal ikke hindre eller vanskeliggjøre gjennomfarten» for et fartøy som bare kan navigere sikkert i en trang lei; det samme for den som fisker | Et stort fartøy i et smalt sund holder kurs, og spilleren får «Trang lei: gå av veien» (3.2) |
| 10 | Trafikkseparasjonssystemer | Ikke med (planens kap. 9) |
| 13 | Innhentende fartøy holder av veien «uten omsyn til» resten av avsnitt I og II; innhenting er å komme opp «mer enn 22,5 grader aktenfor tvers»; ved tvil er man innhentende; senere peilingsendring gjør det ikke til kryssende «før dette er endelig passert og klaret» | `colregSit` regner innhenting først og husker den til de er klare (3.2) |
| 14 | To maskindrevne på motsatte eller nesten motsatte kurser: «begge vike til styrbord»; når det andre ses «forut eller nesten forut»; ved tvil «gå ut fra den er det» | Møtende når begge ser den andre innen 12° av baugen (3.2) |
| 15 | Kryssende: det fartøyet holder av veien «som har det andre på sin styrbord side», og unngår «å gå forenom» | Kryssende fra styrbord: du viker; fra babord: du holder kurs |
| 16 | Den vikepliktige gjør «såvidt mulig i god tid … en markert manøver for å holde godt klar» | NPC-ene og Autonav (3.3) |
| 17 a i, a ii, b, c, d | Den andre «skal … beholde sin kurs og fart»; kan selv gjøre noe «så snart det blir klar over» at den andre ikke viker; skal gjøre noe når sammenstøt ikke kan unngås av den andre alene; skal ikke «forandre kurs til babord for et fartøy på sin babord side»; regelen fritar ikke den vikepliktige | NPC-en holder kurs og fart, og svinger til styrbord først når spilleren ikke har gjort noe og det er nært (3.3) |
| 18 | «Unntatt hvor regel 9, 10 og 13 krever noe annet»: maskindrevet viker for ikke under kommando, begrenset manøvreringsevne, fiske og seil; den som fisker, viker «så vidt mulig» for de to første; alle unntatt de to første unngår å hindre den som er hemmet av dypgående | Rangen i `colregSit` (3.2) |
| 19 a–c | Nedsatt sikt: sikker fart, maskineriet klart, ta hensyn til sikten | Ø11.2 |
| 19 d (delvis lest) | Bare sett på radar: unngå sving til babord for et fartøy forenom tvers (unntatt det som innhentes), og sving mot et fartøy tvers eller aktenfor tvers | Ø11.2 |
| 19 e (delvis lest) | Tåkesignal forut: ned til minste styrefart, om nødvendig stopp | Ø11.2 |
| 26, 27, 30 | Lanterner og signalfigurer ved fiske, ikke under kommando, anker og grunn [sammendrag] | Lanternene finnes; signalfigurene er ikke med (V7). Ø11.2 |
| 32–35 | Lydsignalene: kort støt om lag 1 s, langt 4–6 s; manøversignaler; tåkesignaler [sammendrag] | Ø11.2 |
| 37, vedlegg IV | Nødsignalene [sammendrag] | Bare i håndboka (Ø11.6) |
| Kap. II, 53 d | Fiskerioppsynsfartøy viser blått rundtlys [sammendrag] | Ø11.2 |

### 2.2 Sjøloven, LOV-1994-06-24-39

<https://lovdata.no/dokument/NL/lov/1994-06-24-39>. §§ 135, 161–164 lest gjennom sammendrag; resten bare overskrifter.

| § | Krav | I spillet | Økt |
|---|---|---|---|
| 135 | Skipsføreren hjelper alle i havsnød så langt det skjer uten alvorlig fare for eget skip og folk [sammendrag] | Anropet når en båt i nærheten er i nød | Ø11.7 |
| 161 | Den som har skyld, erstatter skaden; begge skyld: etter feilene, ellers likt; personskade solidarisk [sammendrag] | Skylda leses fra vikeplikten før støtet | Ø11.3 |
| 162 | Ulykkeshendelse eller uvisst: hvert skip bærer sin skade [sammendrag] | Samme | Ø11.3 |
| 163 | Skade ved manøver uten kontakt [sammendrag] | Ikke bygd (svell) | |
| 164 | Etter sammenstøt: hjelpe, oppgi navn, hjemsted, hvor fra og hvor til [sammendrag] | Spillet gjør det for deg (VHF og dagboka) | Ø11.3 |
| 475 | Melding om sjøulykke [sammendrag] | Spillet melder for deg | Ø11.6 |

### 2.3 Skipssikkerhetsloven, LOV-2007-02-16-9

<https://lovdata.no/dokument/NL/lov/2007-02-16-9>, sist endret LOV-2025-04-25-12. §§ 1–27 ordrett, resten [sammendrag].

- § 2: gjelder fiskefartøy i næring uansett lengde.
- § 14 navigering (hjemmelen for sjøveisreglene), § 19 skipsførerens plikter, § 21 utstyret (kravene står i forskriftene i 2.5 og 2.6).
- § 24 hviletid: ikke med (Jonas 11.10.2026).
- § 47 melding ved skade eller sykdom [sammendrag]: Ø11.6.
- §§ 52, 55–56, 58–70 tilbakeholdelse, gebyr og straff [sammendrag]: ikke med (V1 A).
- Ingen plikt til å **bruke** flyteplagg står i loven.

### 2.4 Skipsarbeidsloven, LOV-2013-06-21-102

<https://lovdata.no/dokument/NL/lov/2013-06-21-102>, sist endret LOV-2026-04-10-14. Ordrett. § 3-1 skriftlig arbeidsavtale; § 3-2 prøvetid inntil seks måneder; § 5-2 oppsigelsesfrist én måned (to etter fem år, tre etter ti, 14 dager i prøvetiden); § 5-6 saklig grunn; § 4-1 (4) lønnsreglene gjelder ikke lotten. Ø11.9.

### 2.5 Fiskefartøy under 15 m, FOR-2013-11-22-1404

<https://lovdata.no/dokument/SF/forskrift/2013-11-22-1404>, sist endret FOR-2025-06-26-1372. Ordrett.

| § | Krav | Økt |
|---|---|---|
| 17 | Minst to brannslukkere på 6 kg | Oppbevares inne |
| 36 | Én redningsvest per person, lett tilgjengelig | Ø11.4 (bygd), Ø11.5 |
| 37 | Redningsdrakt per person på dekkede og åpne med styrhus | Oppbevares inne |
| 38 | Dekket over 6 m: flåte til alle | Finnes |
| 43 | Én livbøye per tre personer, halvparten med lys, merket med navn og hjemsted; under 10,67 m minst én med 30 m line; 10,67–15 m minst to, én med line på hver side | Ø11.5 |
| 44 | Røyksignaler, fallskjermlys, håndbluss | Oppbevares inne |
| 45 (6) | Øvelse hver tredje måned | Ikke med (V11 C) |
| 60, 61 | Radarreflektor, refleksstriper | Lages ikke |
| 63 | Fast leider akter med håndrekker, nederste trinn minst 300 mm under vannlinja | Ø11.5, Ø11.6 |
| 64, 68 | VHF-DSC; fra kystfiske EPIRB, SART og håndholdt VHF (tabellen er flatet ut på Lovdata, kolonnene tolket) | VHF følger båten (V6 A); resten inne |
| 75, 84 | Magnetkompass; prismekikkert | Finnes |
| 77 | Brovaktalarm på 10,67–15 m med selvstyring over fjordfiske | Ø11.5 (V6 A) |
| 79 | Radaren der den finnes; radar er ikke påbudt | |
| 86–88 | Lanterner; signalfigurer; horn eller fløyte på 12–15 m | Ø11.2; signalfigurene ikke med (V7) |
| 89 | Lyskaster på 12–15 m bygd etter 1.7.1997 over fjordfiske | Finnes |

Ikke funnet i forskriften: plikt til å bære vest på dekk, nødstopp på haler, utstyr for mann over bord utover leideren og livbøya, PLB og AIS-MOB, risikovurdering.

### 2.6 Fiskefartøy fra 15 m, FOR-2000-06-13-660

<https://lovdata.no/dokument/SF/forskrift/2000-06-13-660>, sist endret FOR-2025-06-26-1372. § 7-5 redningsfarkoster til 200 % og MOB-båt fra 45 m (ordrett); § 7-10 livbøyer 3 / 4 / 6 / 8 etter lengden, lys og røyk [sammendrag]; § 9-6 VHF-DSC og SART (ordrett); § 10-3 radar fra 24 m; § 10-4a AIS fra 15 m; § 10-7 brovaktalarm [sammendrag]. **Avvik i spillet:** `lsaOf` gir kyst21 fire livbøyer (§ 7-10: tre) og pelagisk seks (åtte). Rettes i Ø11.5.

### 2.7 Sikkerhetsopplæringen, FOR-2011-12-22-1523

<https://lovdata.no/dokument/SF/forskrift/2011-12-22-1523>, §§ 5–16 ordrett. § 8 (4) sikkerhetsopplæring for fiskere; § 7 (b) dekker «en person faller over bord». Kurset er ikke med (V11 C).

### 2.8 Merking og kjenningssignal, FOR-2002-06-27-754

<https://lovdata.no/dokument/SF/forskrift/2002-06-27-754>, ordrett. § 5 kjenningssignal for 10,67–15 m; § 9 navn forut og akter, hjemsted akter, 15 cm (under 15 m 6 cm). Formen to bokstaver og fire siffer er fra Store norske leksikon. Ø11.5.

### 2.9 Farvannet

- **Havne- og farvannsloven, LOV-2019-06-21-70**, §§ 1–32 ordrett: § 7 staten regulerer ferdselen; **§ 8 kommunen kan bare regulere fritidsfartøy**, så spillets næringsfartøy følger de statlige fartsgrensene; § 10 skiltene; § 11 varsle om farer; § 17 fartøy til fare.
- **FOR-2021-04-19-1214** § 2: aktsomhetsregelen, og 5 knop innen 50 m fra der det bades.
- **FOR-2021-12-16-3622**, statlige fartsgrenser for næringsfartøy: ikke lest.
- **Datasettet** «Statlige fartsgrenser på sjøen for næringsfartøy» (Kystverket) i Geonorges testkatalog; lisensen ikke sjekket.
- **FOR-2012-12-19-1329**, farvannsskilt.

→ Ø11.8.

### 2.10 Ulykkene

Næringsfartøy: 5 omkomne i 2024 og 7 i 2025; fiskefartøy er 24 % av ulykkene. Fiskefartøy under 15 m: 14 fall over bord på ti år, 13 omkom (Sjøfartsdirektoratet, fra søkemotorens sammendrag av direktoratets PDF-er; `sdir.no` nås ikke herfra).

## 3. Ø11.1 Vikeplikten for spilleren og NPC-ene (L1, N8)

Bygges 06.11.2026 (Jonas: «Oppgave: Ø11.1, vikeplikten for spilleren og NPC-ene (L1 og N8)»). Kapitlet fylles ut med det som er bygd, målt og avgjort.

## 4. Antatt eller usikkert

- Regel 19 d og e er bare lest delvis, og regel 20–37 bare i sammendrag (2.1). Ø11.2 leser dem ordrett først.
- Sjøloven, skipssikkerhetsloven fra § 28 og kapittel 7–10 i FOR-2000-06-13-660 er bare lest i sammendrag.
- `sdir.no`, `kystverket.no`, `geonorge.no` og `nkom.no` nås ikke herfra. Lovdata svarer bare leseverktøyet, ikke `curl` eller Chromium (06.11.2026).
- Skyldfordelingen (Ø11.3) avgjøres i virkeligheten av en domstol; spillet bruker en enkel regel ut fra vikeplikten.
- Vikingen er lokal (npc-flåten 4 A): to spillere nær samme NPC-båt kan se den vike ulikt.
