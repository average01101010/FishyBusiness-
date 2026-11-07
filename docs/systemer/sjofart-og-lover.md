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

**Lest ordrett 06.11.2026:** regel 1–18 og 19 a–c (Ø11.1), og i Ø11.2 regel 19 d–e, 20–37, vedlegg I og III og kapittel II regel 46, 49, 52 og 53 d. Hovedsiden kuttes i leseverktøyet etter regel 19, så kapittelsidene (`…/KAPITTEL_1-2-19`, `KAPITTEL_1-3-1` til `-12`, `KAPITTEL_1-4-1` til `-6`, `KAPITTEL_4` vedlegg I, `KAPITTEL_6` vedlegg III, `KAPITTEL_2-3-1` til `2-4-4`) ble lest én og én, med forskyvning inn i siden der teksten sto lenger ned (hver kapittelside gir hele forskriften). Lovdata stopper `curl` og Chromium herfra. Vedlegg II (tilleggssignal for fiske nær andre) og IV (nødsignalene) er ikke lest ordrett. Utdragene står i tabellen under; teksten er tatt fra leseverktøyets omgjøring av siden, så tegnsettingen kan avvike litt fra Norsk Lovtidend.

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
| 3 k, 11 | I sikte av hverandre «utelukkende når det ene kan ses fra det andre»; avsnitt II (regel 11–18) gjelder bare da | Ø11.2: i sikte innen sikten om dagen og lanternenes synsvidde i mørket (`sjvSeenKm`); utenfor den i nedsatt sikt gjelder regel 19 (4.1, 4.2) |
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
| 19 a | «Denne regel gjelder for fartøy som ikke er i sikte av hverandre når de navigerer i eller nær et område med nedsatt sikt.» | Utenfor synsvidden i nedsatt sikt gjelder regel 19 i stedet for 11–18 (4.2) |
| 19 b | «Ethvert fartøy skal gå med sikker fart avpasset etter de rådende omstendigheter og nedsatte siktforhold. Et maskindrevet fartøy skal ha sitt maskineri klar til øyeblikkelig manøver.» | Autonav i sikker fart (4.3) |
| 19 d | «Et fartøy som oppdager et annet fartøy bare ved hjelp av radar, skal avgjøre om en nærsituasjon kan utvikle seg og/eller om det er fare for sammenstøt. Hvis så er tilfelle skal det i god tid ta forholdsregler … skal såvidt mulig følgende unngås: i. en kursforandring til babord for et fartøy som er forenom tvers unntatt for et fartøy som blir innhentet, ii. en kursforandring mot et fartøy som er tvers eller aktenfor tvers.» | Begge viker; siden etter 19 d (`sjvSide19`, 4.2) |
| 19 e | «… skal ethvert fartøy som tilsynelatende forenom tvers hører tåkesignalet fra et annet fartøy eller som ikke kan unngå å komme i en nærsituasjon med et annet fartøy som er forenom tvers, redusere farten til minste styrefart. Om nødvendig skal det stoppe helt og i alle tilfelle navigere ytterst varsomt inntil faren for sammenstøt er over.» | Autonav ned til minste styrefart, stopp når det er nært (4.2) |
| 20 b, c | Lanternene «fra solnedgang til soloppgang», og «skal hvis de føres, også vises fra soloppgang til solnedgang under nedsatt sikt» | Lanternene tennes om dagen i tåke (4.5) |
| 21 | Topplanterne 225° (rett forover til 22,5° aktenfor tvers), sidelanterner 112,5°, akterlanterne 135° («67,5 grader på hver side av fartøyet fra rett akterover»), rundtlysende 360° | Sektorene for egen båt og nå NPC-ene (`lampArc`, 4.5) |
| 22 | Synlighet: fra 50 m topp 6 mil, side, akter og rundt 3; 12–50 m topp 5 (under 20 m 3), side, akter og rundt 2; under 12 m topp 2, side 1, akter og rundt 2 | `sjvLampNm`; hvor langt båten ses i mørket (4.1) |
| 23 | Topplanterne, en akterste høyere (ikke plikt under 50 m), sider, akter; under 12 m kan rundtlysende hvit og sider; under 7 m og høyst 7 knop rundtlysende hvit | Som før (`lanterns`) |
| 26 | Fisker: «bare» disse; trål grønt over hvitt, annet fiske rødt over hvitt, sider og akter «når det gjør fart gjennom vannet»; e: den som ikke fisker, viser dem ikke | NPC-ene etter klassen og den virkelige farten (`sjvLanternSt`, 4.5) |
| 27 a, b | Ikke under kommando: to røde rundtlysende, sider og akter med fart; begrenset manøvreringsevne: rødt, hvitt, rødt; g: under 12 m behøver ikke | To røde finnes; rødt-hvitt-rødt legges til av 3D-visningen (4.5) |
| 28 | Hemmet av dypgående «kan» vise tre røde rundtlysende | Legges til når klassen kommer (Ø15) |
| 30 | Ankers: forut rundtlysende hvit, akter lavere; under 50 m én; grunn: to røde i tillegg (ikke under 12 m) | Som før; NPC-ene til ankers får ankerlyset (4.5) |
| 32 | Kort støt «om lag et sekunds varighet», langt «fra fire til seks sekunders varighet» | 1 s og 4,5 s (4.4) |
| 33 | Fløyte fra 12 m, klokke fra 20 m, gongong fra 100 m; under 12 m «noe annet som kan gi et kraftig lydsignal» | Alle båtene har horn; klokka brukes til ankers |
| 34 a, d, e | I sikte, ved manøver: ett kort «Jeg forandrer kurs til styrbord», to korte babord, tre korte «Jeg bruker maskinkraften akterover»; d: «minst fem korte støt» i tvil; e: ett langt ved en sving med skjult farvann | NPC-ene og Autonav gir manøversignalet; fem korte når spilleren ikke viker; hornknappen (4.4) |
| 35 | «I eller nær farvann med nedsatt sikt … enten det er dag eller natt»: med fart ett langt minst hvert annet minutt (a), stoppet to lange med om lag 2 s mellom (b), ikke under kommando, begrenset, hemmet, fiske og slep langt og to korte (c), slept og bemannet langt og tre korte (e), til ankers klokka om lag 5 s minst hvert minutt (g), grunn klokke og tre slag (h); under 12 m et annet kraftig lydsignal (j) | Tåkesignalene for alle innen hørevidde og egen båt (`sjvFogPat`, 4.4) |
| 36 | Signal for å påkalle oppmerksomhet; blitzlys unngås | Ikke med |
| 37, vedlegg IV | Nødsignalene (vedlegg IV ikke lest) | Bare i håndboka (Ø11.6) |
| Vedlegg I 8 | «I = 3,43 x 10^6 x T x D² x K^-D», T 2 x 10^-7 lux, «K … 0,8, som tilsvarer en meteorologisk sikt på omkring 13 nautiske mil»; tabellen 1 mil 0,9 cd, 2 mil 4,3, 3 mil 12, 4 mil 27, 5 mil 52, 6 mil 94 | Hvor langt en lanterne ses i en annen sikt (`sjvLightNm`, 4.1) |
| Vedlegg I 9 a | Sidelanterner avskjæres 1–3° utenfor sektoren; topp og akter høyst 5° | Sektorene (4.5) |
| Vedlegg III 1 b, c | Grunnfrekvens 250–700 Hz under 75 m, 130–350 Hz 75–200 m, 70–200 Hz fra 200 m; hørevidde 0,5 mil under 20 m, 1 mil 20–75 m, 1,5 mil 75–200 m, 2 mil fra 200 m | Tonen og hørevidden (4.4) |
| Vedlegg III 2 | Klokke minst 110 dB på 1 m; åpning minst 300 mm fra 20 m | Klokka høres som et horn under 20 m (antatt, 4.4) |
| Kap. II 53 d | «I tillegg til posisjonslanterner, skal norske kystvaktfartøy vise en blå lanterne som kjennetegn under kontroll med fiske. Lanternen skal plasseres på høyeste mastetopp og lyse med et ubrutt, blått lys i 360 grader og være synlig på minst 2 nautiske mils avstand.» (planen sa fiskerioppsynsfartøy; teksten sier kystvaktfartøy) | Kystvakta under kontroll (4.5) |
| Kap. II 49, 52 | Vaktfartøy grønt over to røde; toll og politi kan vise egne lanterner eller bluss | Ikke med |

### 2.2 Sjøloven, LOV-1994-06-24-39

<https://lovdata.no/dokument/NL/lov/1994-06-24-39>. **Kapittel 8 «Sammenstøt» (§§ 161–164) lest på Lovdata 06.11.2026, sent på kvelden (Ø11.3):** hovedsiden og `…/KAPITTEL_8` gir bare innholdsfortegnelsen og et sammendrag i leseverktøyet, så paragrafsiden `…/%C2%A7161` ble lest med forskyvning 39 933 inn i siden, der teksten under «Del III. Ansvar» står; den siden har hele kapittelet. Kapittelet har ikke noen § 165 (neste er kapittel 9, §§ 171–182 c). Leseverktøyet gir bare korte ordrette sitater (de i anførselstegn under); resten er gjengitt med egne ord ledd for ledd. Siden viste ingen «sist endret» i teksten som ble lest. §§ 135 og 475 er fortsatt bare lest i sammendrag.

| § | Krav | I spillet | Økt |
|---|---|---|---|
| 135 | Skipsføreren hjelper alle i havsnød så langt det skjer uten alvorlig fare for eget skip og folk [sammendrag] | Anropet når en båt i nærheten er i nød | Ø11.7 |
| 161 «Sammenstøt som følge av skyld på en eller begge sider» | 1. ledd: skyld på én side, «skal den skyldige erstatte skaden» (på skip, last eller person). 2. ledd: skyld på begge sider, hver erstatter etter forholdet mellom feilene; lar det seg ikke fastslå, «deles skaden likt». 3. ledd: hver svarer bare for sin del, men for personskade er de skyldige «solidarisk ansvarlige». 4. ledd: den som har betalt mer enn sin del, kan kreve det tilbake fra den andre. 5. ledd: ved bedømmelsen av skylda skal det særlig tas hensyn til «om det var tid til overlegninger eller ikke» | Skylda leses fra vikeplikten i spillminuttene før støtet, men ikke det siste halve minuttet; delt etter feilene (5.3, 5.4). Ingen blir skadet i spillet, så det solidariske ansvaret og regressen er ikke med | Ø11.3 |
| 162 «Sammenstøt som følge av ulykkeshendelse» | Følge av ulykkeshendelse, eller kan det ikke vises at skyld på noen side er årsaken, «bærer hvert skip sin skade» | Ingen feil funnet: hver sin skade (5.3) | Ø11.3 |
| 163 «Sammenstøt uten at skip støter sammen» | Reglene gjelder også når et skip ved manøver eller lignende skader et annet skip eller folk eller last om bord, også «uten at sammenstøt mellom skipene har funnet sted» | Ikke bygd (svell og sug) | |
| 164 «Plikt til å yte bistand m m» | Etter sammenstøt skal hver skipsfører gi det andre skipet, mannskapet og passasjerene «all den hjelp som er mulig og nødvendig» så langt det kan skje uten særlig fare for eget skip og folk; skipsførerne skal også «oppgi til den andre sitt eget skips navn og hjemsted», og hvor skipet kommer fra og skal; det samme når et skip støter sammen med en båt | Spillet gjør det for deg: VHF-meldingen og dagboka; NPC-en blir liggende (5.5) | Ø11.3 |
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
| 86–88 | Lanterner; signalfigurer; horn eller fløyte på 12–15 m | Bygd i Ø11.2 (lanternene etter regel 20–30, hornet med signalene); signalfigurene ikke med (V7) |
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

Bygd og rullet ut 06.11.2026 (981a4751, flettet i d62153dc; Jonas: «Oppgave: Ø11.1, vikeplikten for spilleren og NPC-ene (L1 og N8)»). Reglene ligger i den nye `core/05e-sjovei.js`. De delte filene har ett kall hver: `npcStates` (`colregNpc`) og `sail` (`sjvSail`) i `core/05-vessels.js`, `havNear` (`colregHav`) i `core/05d-hav.js` og `dynAuto` (`sjvAuto`) i `core/16b-dyn.js`. Varselet står i `ui/04-panels-instruments.js` (stripa og boksen), `ui/03-map.js` (plotteren og AIS-kortet) og `ui/03e-miniplot.js` (minikartet).

### 3.1 Klassene (regel 3 og 18): `colregCls`, `colregOwnCls`, `colregHav`

| Klasse | Hvem | Regel |
|---|---|---|
| `pow` maskindrevet | Alle under fart, også den som jukser eller dorger | 3 b, 3 d |
| `fish` holder på med å fiske | Spilleren mens hun setter eller drar garn, line eller teiner (`b.gop`). En kystbåt i fisket med lenka si i sjøen (`NPCGEAR`). Havfartøyet som tråler, setter og drar line, teiner eller garn, eller har nota eller snurrevaden ute (ikke mens det leter). En annen spiller som fisker | 3 d |
| `nuc` ikke under kommando | Spilleren med motorstopp eller tom tank (`engine`, `adrift`) | 3 f |
| `ram` begrenset manøvreringsevne | Redningsskøyta med slepet | 3 g vi |
| `cbd` hemmet av dypgående | Finnes, men ingen får den før Ø15 | 3 h |
| `moor`, `anch` ikke underveis | Ved kai, ved naustet, til ankers; kystruteskipet og ferja ved kaia | 3 i |

AIS-kortet har en ny rad «Navigasjonsstatus» med AIS-ens egne navn (`colregAisSt`): underveis med motor, driver fiske, til ankers, fortøyd, ikke under kommando, begrenset manøvreringsevne, hemmet av dypgående (N8).

### 3.2 Situasjonen: `colregSit(a, b)`

Gir regelen, hvem som viker (`a`, `b`, `both` eller `none`), CPA og avstand i meter, TCPA i spillminutter og om det er fare. Rekkefølgen følger teksten:

1. **Regel 2 b:** ligger ett av dem stille eller driver under 1 knop, holder den som går, klar (antatt tolkning av «særlige omstendigheter»; to som ligger stille gir ingen fare).
2. **Regel 13** (først, «uten omsyn til» resten): den som kommer opp mer enn 22,5° aktenfor tvers (over 112,5° fra den andres baug) og haler inn. Innhentingen huskes til de er klare (13 d).
3. **Regel 9 b–c:** et fartøy på 40 m eller mer der sjøen tvers over er under 1,2 km med land innen 0,9 km på begge sider (`sjvNarrow`), «kan bare navigere sikkert» i leia. Spilleren under 20 m, eller som fisker, skal ikke hindre det: «Trang lei: gå av veien». Storskipet holder kurs.
4. **Regel 18 d**, så **rangen i 18 a og c:** maskindrevet < fisker < ikke under kommando og begrenset manøvreringsevne. To som fisker, holder klar begge (regel 2 og 8). To som ikke kan manøvrere, kan ingen av dem.
5. **Regel 14 og 15** mellom to maskindrevne: møtende når begge ser den andre innen 12° av baugen (14 b «nesten forut», og 14 c «Hvis et fartøy er i noen tvil …»); ellers kryssende, og den som har den andre om styrbord (0–112,5°), viker.

**Rollene står mens møtet varer** (rettet under testingen 06.11.2026): når faren først er der, beholdes regelen og hvem som viker til de er passert og klare. Uten det gjorde kystbåtens avslakking at hun etter en stund lå forut for spilleren, situasjonen snudde til «du viker», Autonav svingte mot henne, og de passerte 2 m fra hverandre. Regel 17 a sier at den andre skal beholde kurs og fart; det er når rollene byttes, sammenstøtene skjer.

**Faren** (regel 7): CPA under grensa og TCPA foran. Grensa er `100 m + 1,5 × den lengste` (`colregLim`), mellom 120 og 400 m: to sjarker 120 m, ferja 175 m, kystruteskipet 283 m. Ferjas og kystruteskipets mål kommer fra AIS-kortet (`SJV_SIZE`), siden `npcStates` ikke har dem.

### 3.3 Hva NPC-ene og Autonav gjør (V2 A, npc-flåten 4 A)

- **Når:** `sjvEval` ser på møtene rundt båten du følger høyst én gang per tiendedels spillminutt (et sekund), og bare med spillet åpent og i gang (`sjvLive`: `DYN.on`, ikke i `catchUp`, `simRate` høyst 60). I havn (`inHarbour`), fortøyd, til ankers eller på slep skjer ingenting. Det er `npcStates` som utløser det, og 3D-visningen og kartplotteren spør hvert bilde. Når ingen visning spør (telefonen over en visning som står, eller en test uten noen av dem), holder Autonav det ferskt fra sine egne steg (`sjvFresh` i `sjvAuto` og `sjvSail`, bare for båten du følger). Funnet 06.11.2026 da turmålingen uten 3D og uten plotter ga null varsler fordi ingenting ble sett på.
- **Den vikepliktige NPC-en** (16) svinger 35° til styrbord innen 1 km og TCPA under 8 spillminutter, og står ut fra kursen sin så langt at CPA blir minst 1,5 ganger grensa (`sjvNeed`, ganger 1,3, minst 150 m og høyst 600 m). Hun holder den nye linja parallelt og svinger tilbake når de er passert og klare (`sjvOffAt`, `sjvPhase`). Ved innhenting og rangen velges siden som åpner mest; ellers alltid styrbord (14 a, 15, 17 c).
- **Uten plass** (8 e): stripa ut til avviket og 600 m fram må være sjø dypere enn dypgåendet og en meter, utenfor havnene (`sjvRoom`); er den ikke, halveres avviket, og er det fortsatt ikke plass, slakker hun av til 35 % og ligger etter kursen sin (`sjvLagAt`, posisjonen fra `npcStates` med den tiden hun ligger etter), og tar det igjen i 1,3 ganger farten etterpå.
- **Den som skal holde kurs og fart** (17 a i) gjør det. Først når spilleren ikke har gjort noe og det er nært (innen et spillminutt av hverandre, TCPA under 1,5 spillminutter, CPA under 0,7 ganger grensa), svinger hun til styrbord selv (17 a ii, b, c).
- **Avviket er lokalt** (npc-flåten 4 A): det legges over posisjonen fra den felles klokka i `colregNpc` hver gang `npcStates` lager lista, som en kopi, og lagres eller sendes aldri. Retningen er fast fra hun begynner å svinge, så et hjørne i ruta flytter henne ikke. Spor og enkeltbåter (`only`) er den felles banen.
- **Autonav** (og Driftsplan, som seiler med Autonav) viker for fartøy båten du følger skal vike for, innen 1,2 km og TCPA under 8 spillminutter, på samme måte: `sjvAuto` gir autopiloten i `dynAuto` et avvik fra linja (svingens fart er 35° av farten) og tar det tilbake når de er klare. Ved et stopp (seks lengder, minst 150 m), når hun rygger eller snur fra land (`T.bow`), eller når grunnsjekken finner grunn foran henne (hvert spillsekund), går avviket tilbake og hun slakker av i stedet. Minuttsteget (`sail`, når manøvreringsmodellen ikke går) svinger 35° fra etappen til avviket er nådd, og etappens egen kurs tar henne til neste punkt etterpå (`sjvSail`).
- **Ikke med:** NPC-ene viker ikke for hverandre (de går på den felles klokka). De andre spillernes båter viker aldri automatisk for deg; deres eget spill gjør det for dem. Spilleren som holder kurs, gjør ingenting automatisk etter 17 a ii.

### 3.4 Varselet

- **Når:** CPA under grensa og TCPA under 6 spillminutter (ett minutt i ekte tid), innen 3 km, og innen 1,5 km når det er den andre som skal vike. Aldri i havn og aldri mens tiden tas igjen. Det som er varslet, står til CPA er klart åpen (1,3 ganger grensa) og, når NPC-en eller Autonav viker for akkurat den båten, til de er passert, så spilleren ser hvorfor båten svinger.
- **Stripa** (UI 2, U2-1): varselet står først på tredje linje, foran reglene, rullingen, blåsa og neste hendelse, i den korte formen («Fra styrbord: vik», «Autonav viker»; stripa er 47 vw på telefonen og 250 px på nettbrettet), med CPA i den delen som kuttes først (`.l3s`): «Fra styrbord: vik · CPA 80 m». Rødt (`r2`) når du viker, gult (`r1`) når den andre viker eller Autonav gjør det for deg.
- **Boksen og kortet** (nettbrett liggende, PC): på tredje linje i stedet for neste hendelse, så boksen ikke vokser over minikartet: «Kryssende fra styrbord: du viker · CPA 80 m om 40 s» (tiden i ekte tid); kortet har navnet på den andre i tillegg. Den første utgaven la en rad «Vikeplikt» i «nå»-radene; den gjorde boksen tre linjer høyere og la den over minikartet i liggende (skjermbildet 06.11.2026).
- **Kartplotteren og minikartet:** en ring rundt båten, hennes vektor og din fram til CPA, og en stiplet linje mellom de to punktene der, med «CPA 80 m · om 40 s» (`sjvChartSvg`, `miniSjv`). I minikartet står ringen på kanten når båten er utenfor.
- **AIS-kortet:** raden «Vikeplikt» øverst når det er båten som er varslet.
- **Tekstene** (`sjvSay`): kryssende fra styrbord og babord, møtende, innhenter og innhentes, fiskefartøy, ikke under kommando, begrenset manøvreringsevne, hemmet av dypgående, trang lei, ligger stille, begge fisker, og «For nær: gjør noe nå» når den andre skulle vike og det er for nært (17 b).

### 3.5 Nestenulykker

En passering der avstanden minus en firedel av de to lengdene er under 50 m (`SJV.NEAR`), med minst ett av fartøyene i 2 knop eller mer, lagres i `S.nearMiss` (høyst 40) med tid, sted, båten, navnet på den andre, avstanden og regelen. Ø11.7 viser dem i kortet «Sikkerhet».

### 3.6 Tester og målinger

- `tests/unit/sjovei.test.mjs` (73 sjekker): regel 13–15, rangen i 18, 18 d, 9 b–c, regel 2 b, CPA og TCPA, grensene for sektorene (12°, 112,5°), avviket over tid, klassene, AIS-statusen og tekstene.
- `tests/colregtest.py` (LITE, 25 sjekker) på Senja: ferja med spilleren om styrbord viker 390 m til styrbord og er tilbake på den felles banen etterpå, aldri på land, og spilleren holder kurs; med spilleren om babord holder ferja kurs og fart og Autonav viker 294 m og er 6 m fra linja til slutt, med varselet i boksen og ringen i plotteren; en båt fra Senja-flåten på vei ut viker 325 m; uten plass slakker hun av (700 m etter) og tar det igjen; når Autonav ikke viker, gjør ferja noe selv (17 a ii) og de går 131 m fra hverandre; båtene lenger unna enn 1,2 km er der klokka sier; Autonav viker også når ingen visning spør etter båtene (291 m ut, 1 m fra linja til slutt); ingen varsler i havn, ingen viking i `catchUp`. Den spiller møtene i ekte tid og tar rundt 7 minutter.
- **3D og veiledningen** (06.11.2026, på det flettede bygget d62153dc): `trackfollow` 10 OK (autopiloten i `dynAuto` med det ene kallet), `tut` i stående 14 OK og `"tut": 0` (veiledningen peker på tredje linje, der varselet nå står først).
- **Stikkprøven langs kysten** (06.11.2026, `dist-vec` med kystflåten fra vec-pakkene, juni kl. 6, uten 3D): en kystbåt på vei ut eller inn på kryssende kurs med spilleren, begge veier.

  | Sted | Båten | Spilleren om styrbord: NPC-en viker | Spilleren om babord: Autonav viker |
  |---|---|---|---|
  | Bergen | Sjøsprøyt | 325 m til styrbord, tilbake på banen (0 m), nærmest 234 m, aldri på land | 311 m fra ruta, 1 m fra linja til slutt, nærmest 249 m; NPC-en holder kurs |
  | Bodø | Steinbit | 345 m, tilbake (0 m), nærmest 275 m | 196 m, 0 m til slutt, nærmest 174 m |
  | Hammerfest | Ishavet II | 325 m, tilbake (0 m), nærmest 232 m | 299 m, 1 m til slutt, nærmest 236 m |
  | Tromsø | | Ikke prøvd: kystbåten (Havbris) gikk i trange sund, og skriptet fant ingen kryssing med åpen sjø hele veien | |

  Feilen ble ikke funnet noe sted (det var en ny funksjon). Ved Bodø var en annen kystbåt 359 m fra kursen sin mer enn 1,2 km fra spilleren: den hadde veket og var på vei tilbake. `colregtest` sjekker derfor at alle båtene som ikke er i en manøver, er der klokka sier.
- **Hvor ofte varselet kommer** (06.11.2026, Autonav ut omtrent 6–8 km og hjem igjen fra nærmeste havn, juni kl. 6–7 da flåten går ut, fem ganger farten, med kartplotteren åpen som i spillet): Bodø 17,2 km, opptil 15 fartøy på AIS: 0 varsler. Husøy 11,9 km, 38 på AIS: 1 varsel (en Senja-båt fra babord, som veik). Bergen 8,9 km, 11 på AIS: 0. Hammerfest 15,1 km, 34 på AIS: 0. Ingen nestenulykker. Sjeldent, som planen ville; om det er for sjeldent til at spilleren lærer reglene, ses i spilltest (backloggen 10.5).
- **Tiden** (Lofoten i mars, Henningsvær 10.03.2027 kl. 9, 42 fartøy innen AIS, 29 fra kystflåten, 5 innen 3 km): `npcStates` 0,7 ms med reglene mot 0,5 ms uten (median av 25), selve `sjvEval` under 0,1 ms; den lengste enkeltkjøringen som ble sett, var 5,2 ms (Hammerfest, med sjekken av plassen til svingen). Ingen havfartøy var innen AIS den dagen, så det verste tilfellet (havflåten på feltet) er ikke målt.

## 4. Ø11.2 Sikt, lys og lyd (L3, N8)

Bygd og rullet ut 06.11.2026 (05134a03, flettet i 23556f43, rullet ut i f04d4feb; Jonas: «Oppgave: Ø11.2, sikt, lys og lyd (L3, N8). Les regel 19 d–e, 20–37 og vedlegg I og III i sjøveisreglene ordrett på Lovdata før noe bygges … Sikker fart for Autonav legges i core/05e-sjovei.js gjennom sjvAuto og sjvSail, uten nye kall i core/05-vessels.js eller core/16b-dyn.js»). Reglene og de rene funksjonene ligger i `core/05e-sjovei.js`; ingen nye kall i de delte kjernefilene. Lyden i `ui/10e-sound.js`, hornknappen i `ui/10n-hail.js` og `ui/10c-dock.js` (vifta `horn`), lanternene i `view3d/22-docks-air.js` (`drawNPCLights`, `lanternFog`, `lampFade`, `lampArc`, `lampsMore`) og `view3d/24-cinema.js` (egen båt). `vessel3d.js` (`lanterns`) er ikke rørt (Ø11.5 kjørte).

### 4.1 Sikten og nedsatt sikt

- **Sikten** er spillets `visibility(H, p)` der båten du følger er (`sjvVisAt`). **Mørkt** er når sola står mer enn 6° under horisonten (`sjvDark`, etter den borgerlige skumringen).
- **Hvor langt en båt ses** (`sjvSeenKm`): om dagen så langt sikten er; i mørket så langt hovedlanterna hennes ses i den sikten. Lanterna er laget for regel 22-avstanden (`sjvLampNm`: 2, 3, 5 eller 6 mil etter lengden), og vedlegg I 8 gir lysstyrken; `sjvLightNm` finner avstanden der samme lysstyrke når terskelen med sikten nå (transmisjonen per mil er 0,05 opphøyd i en mil delt på sikten; 0,05^(1/13) = 0,79, som er vedleggets K 0,8 ved 13 mils sikt). En lanterne for 2 mil ses 1,1 km i 1,2 km sikt, 2 km i 3,7 km sikt og 2,2 mil i klart vær.
- **I sikte** (regel 3 k) er en båt nærmere enn det. **Nedsatt sikt** er sikt under 2 nautiske mil, 3,7 km (`SJV.FOG`, antatt: reglene gir ikke noe tall, regel 3 l nevner tåke, snøfall og sterke regnbyger), og slutter først over 4,2 km, så den ikke blinker i kanten.
- **Været har ingen tåke** (backloggen 10.3): `visibility` går ned til 1,2 km bare i tett snøvær (45 − 42 × nedbøren − 8 × skydekket, minst 1,2 km), i regn ikke under 9 km. Nedsatt sikt kommer altså i spillet i snøbyger om vinteren; testene og bildene tvinger sikten ned som `coneshot` gjør. Havskodde om sommeren hører hjemme i `core/03-simulation.js`, som H3a hadde åpen; den er ikke lagt inn.

### 4.2 Regel 19: når dere ikke ser hverandre

- **Klassen:** `colregSit(a, b, {fog:true})` gir situasjonen `19` når de ikke er i sikte i nedsatt sikt. Avsnitt II gjelder da ikke (heller ikke innhenting, regel 13); regel 2 b (den som ligger stille) og regel 9 (trang lei, avsnitt I) kommer fortsatt først. **Begge tar forholdsregler** (19 d «skal det i god tid ta forholdsregler»); er den ene ikke under kommando eller har begrenset manøvreringsevne, gjør den andre det.
- **Siden** (`sjvSide19`, 19 d): et fartøy forenom tvers gir sving til styrbord (19 d i), men den som innhenter, kan svinge til den siden som åpner mest; et fartøy tvers eller aktenfor tvers gir sving bort fra det (19 d ii: om styrbord til babord, om babord til styrbord). Gjelder både NPC-ene og Autonav. Svingen er den samme som i Ø11.1 (35°, avviket, plassen, tilbake etterpå), og NPC-en ser nå etter plassen hvert sekund mens hun står ut fra kursen (`sjvRoomOn`: banen hennes etter klokka 0–450 m fram med avviket hun har); er det ikke plass, går hun tilbake straks. Funnet i stikkprøven i Bergen: under 19 begynner manøveren tidligere og varer lenger, og kursen bøyde inn mot land etter de 600 m som ble sjekket da hun svingte. Gjelder også møtene i klart vær.
- **Rollene står** mens møtet varer, som i Ø11.1: et møte som begynte under 19, er under 19 til de er passert og klare, også når de kommer i sikte (antatt: etter teksten gjelder avsnitt II fra de ser hverandre, men å bytte roller midt i en manøver er det som ga sammenstøtet i Ø11.1).
- **Tidligere varsel** («I tåke og mørke kommer varselet fra Ø11.1 tidligere»): under 19 står varselet fra TCPA 10 spillminutter (6 i sikte) og innen 5 km (3), NPC-en viker innen 1,6 km (1,0) og Autonav innen 1,8 km (1,2), fra TCPA 12 spillminutter (8). I mørket i klart vær er båtene i sikte (lanternene ses 2 mil eller mer, lenger enn varselets 3 km), så der endrer ingenting seg; mørket teller bare sammen med nedsatt sikt.
- **19 e:** høres et tåkesignal tilsynelatende forenom tvers fra et fartøy som ikke er i sikte, eller kan hun ikke unngå en nærsituasjon med et fartøy forenom tvers (under 1 km og CPA under halve grensa), går Autonav ned til **minste styrefart** (`sjvMinKn`: en tredjedel av marsjfarten, 2–4 knop, antatt) og **stopper** når de er nærmere enn grensa, til faren er over (CPA åpen eller passert), høyst et kvarter. Tåkesignalet huskes i tre spillminutter (`SJV.heard`).
- **Tekstene** (`sjvSay`): «Nedsatt sikt: vik til styrbord», «… vik til babord» (aktenfor tvers om styrbord), «… hold klar» (du innhenter), «… Autonav viker», «… den andre viker», og «Tåkesignal forut: minste styrefart» (eller «stopp», «Autonav går sakte»); kort i stripa «Tåke: vik til SB», «Tåke: Autonav sakte», «Tåkesignal: sakte».

### 4.3 Sikker fart (regel 6 og 19 b)

- Med Autonav i nedsatt sikt er farten høyst det hun kan stoppe fra innen halve avstanden hun ser (`sjvSafeMs`: hennes egne stoppdistanser fra manøvreringsmodellen, `dynVStop` og `dynCal`; den gamle tommelfingerregelen, reglene gir ikke noe tall), aldri under minste styrefart. Om dagen er avstanden sikten, i mørket lanternene til en båt under 12 m i den sikten.
- Det går gjennom de to kallene som fantes (`sjvCapV`): `sjvAuto` gir autopiloten i `dynAuto` en fart den ikke går over, og minuttsteget `sjvSail` gjør minuttet kortere med eller uten en vikemanøver (`sjvCreep`, langs etappen, ikke inn i den siste halve kilometeren til et stopp, og grunn foran overlates til minuttstegets egen sjekk).
- Med 1,2 km sikt (det tetteste været gir) binder det nesten aldri: en sjark stopper på langt under 600 m. I 0,6 km sikt gikk trebåten høyst 7,3 knop. Det er minste styrefart etter tåkesignalet (19 e) som merkes.
- En linje i dagboka når det begynner: «Nedsatt sikt (1,2 km). Autonav går i sikker fart og gir tåkesignal.» (høyst én gang i tre spillimer).
- Bare med spillet åpent (`sjvLive`), aldri i `catchUp` (prinsipp 4).

### 4.4 Lydsignalene (regel 32–35, vedlegg III)

- **Køen:** kjernen legger signalene i `SJV.sig` (`sjvSig`: mønsteret, hvor, lengden, egen båt), og lyden spiller dem (`sigTick` i `SND.tick`). Mønstrene: `L` langt støt 4,5 s, `S` kort 1 s, 1 s mellom og 2 s mellom to lange (35 b), og `bell`, klokka ringt hurtig i 5 s (35 g). Eldre enn 8 sekunder spilles ikke.
- **Tåkesignalene** (`sjvFogSigs`, regel 35): hver båt innen hørevidden gir sitt signal på sin egen takt fra id-en, hvert 100.–117. spillsekund (35: «minst hvert annet minutt»; i spilltid, siden båtene går i spillets fart, det er rundt hvert 18. sekund i ekte tid), klokka hvert 50.–57. sekund. Med fart ett langt, stoppet to lange, fiske, ikke under kommando, begrenset og hemmet langt og to korte, til ankers klokka, fortøyd ingenting (`sjvFogPat`). Egen båt gjør det samme hvert 110. sekund, og langt og tre korte på slep med redningsskøyta (35 e). Ikke klokke og tre slag på grunn (35 h); egen båt på grunn regnes som fortøyd.
- **Hørevidden** (vedlegg III 1 c): 0,5 mil under 20 m, 1 mil til 75 m, 1,5 mil til 200 m. Styrken avtar som de andre lydene, `(ref / d)^0,9`, med `ref` 3,6 % av hørevidden, så en fløyte er en hvisken ved grensa (en båt på 10 m 400 m unna 0,11, kystruteskipet 2 km unna 0,07). Til venstre eller høyre etter retningen; i kartet er øret om bord og ser forover.
- **Tonen** (vedlegg III 1 b): 420 Hz under 20 m, 300 Hz til 75 m, 190 Hz til 200 m, 110 Hz over, med en ters over (to toner, som tonehornene). Hornet sto før på 147 og 220 Hz for alle (et stort skip); tutingen til andre spillere bruker nå tonen til din egen båt.
- **Manøversignalene** (34 a): når en NPC begynner å vike og dere er i sikte, ett kort (styrbord), to korte (babord) eller tre (hun slakker av fordi det ikke er plass; antatt at hun da bruker maskinen akterover). Autonav gir det samme for din båt. Svingen tilbake gir ikke noe signal.
- **Fem korte** (34 d): en NPC som skal holde kurs og fart, og ser at spilleren ikke viker (innen 1,5 km, TCPA under 2,5 spillminutter, CPA under 0,8 grensa, i sikte), gir minst fem korte én gang, før hun gjør noe selv (17 a ii).
- **Hornet** (`HAIL.signal`, `ui/10n-hail.js`): mens et vikepliktvarsel står, er «Tut» i knappelinja «Horn», med en vifte: «1 kort · styrbord», «2 korte · babord», «3 korte · bakk», «5 korte · tvil», «1 langt», og «Tut til «…»» øverst når en spiller er innen 1 nm. Ett signal om gangen. Uten varsel er knappen som før (bare tutingen til en spiller innen 1 nm). NPC-ene reagerer ikke på hornet; de følger reglene uansett.
- Lyden fikk også rettingen av et øre som ikke er et tall (backloggen 10.1, «Lyden tar imot tall som ikke er endelige»): et kamera som er NaN, høres om bord, og `set` og `place` hopper over et tall som ikke er endelig.

### 4.5 Lanternene (N8, regel 20–30, kap. II 53 d)

- **Etter det NPC-ene gjør** (`sjvLanternSt`): klassen fra Ø11.1 og den virkelige farten i stedet for fast 5 knop og fiskelys for alle med `st` «fishing». En kystbåt som jukser, viser lanternene til et maskindrevet fartøy (26 e); garn, line og teiner i sjøen rødt over hvitt; havtråleren som sleper, grønt over hvitt (26 b); sider og akter bare når hun gjør fart (over 0,5 knop); til ankers ankerlyset; ikke under kommando to røde; ved kaia ingen (også ferja og kystruteskipet når de ligger ved kaia).
- **Det 3D-visningen legger til** (`lampsMore`), siden `lanterns` i `vessel3d.js` ikke kan endres nå: rødt, hvitt, rødt over toppen for begrenset manøvreringsevne (27 b i), tre røde for hemmet av dypgående (28, ingen har klassen ennå), og **Kystvaktas blå rundtlys** øverst (kap. II 53 d) mens hun ligger langs siden for kontroll (`kv`).
- **Sektorene** (regel 21, vedlegg I 9 a): sidelanternene og akterlanterna på NPC-ene vises bare innenfor buene sine (`lampArc`, samme sjekk som egen båt fikk 01.11.2026). Før lyste grønt og rødt rundt hele horisonten på de andre båtene.
- **Om dagen i nedsatt sikt** (20 c) er lanternene tent, svakere enn om natta (styrken `clamp((3,7 − sikt) / 2,5, 0, 0,6)`: 0,6 ved 1,2 km), både på egen båt og NPC-ene.
- **Langt unna i tåke** blekner en lanterne ut ved avstanden den ses i sikten (`lampFade`, `sjvLightNm`), blandet inn med tåka fra 5,9 km sikt ned til 3,7 km, så natta i klart vær er som før (alle lys til 16 km).
- Sikten her er den 3D-visningen tegner (`env.fogD`), som på nivå 3 er 1,8 ganger spillets og kortere i storm (sjørokket).

### 4.6 Tester og målinger

- **Enhetstestene** (`tests/unit/sjovei.test.mjs`, 107 sjekker, 34 nye): regel 22-avstandene, vedlegg I 8 (2 mil i 13 mils sikt, 1,1 km i 1,2 km), hvor langt en båt ses dag og natt, hørevidden i vedlegg III, mønstrene i regel 35 og 34 a, sidene i 19 d, `colregSit` under 19 (begge viker, ingen innhenting, den som ikke er under kommando, den som ligger stille), lanternene etter klassen, tekstene og at de korte får plass, og tåkesignalene over tid (`sjvFogSigs`: takten, hørevidden, klokka, 19 e). Hele kjernen 1 340 OK.
- **`colregtest`** (LITE, 32 OK, 603 s) fikk to møter i tåke med Senjas ferje i 0,5 km sikt: (1) begge viker (ferja 325 m til styrbord, Autonav 600 m), varselet «Nedsatt sikt: Autonav viker» kommer ved 1 635 m mot 1 483 m i klart vær, begge gir ett langt støt, de passerer 288 m fra hverandre, og ferja er tilbake på banen. 19 e slo ikke inn her, fordi Autonavs sving hadde åpnet CPA før ferja ble hørt (da er det ikke «fare for sammenstøt»). (2) Med ingen av dem svingende tar tåkesignalet forut Autonav ned til 2,2 knop (minste styrefart 2,0), varselet sier «Tåkesignal forut», og de går 222 m fra hverandre. Første kjøring hadde en rød sjekk som var testens egen (den så bare på de tre første tekstene); rettet.
- **`soundtest`** (24 OK), **`lanterntest`** (12 OK, de tre nye om NPC-ene), **`anchorlight3d`** (3D, alene, 5 OK: om dagen i klart vær ingen lanterner, i tåke tre tent med styrke 0,6, og Kystvakta under kontroll med blått lys om natta), **`gfxtest`** (3D, 7 OK; rød siden 04.11.2026 på lydfeilen, grønn nå) og **`dbg23o`** (3D, stille).
- **`tut.py` i stående** (14 OK, `"tut": 0`, 2 221 s): knappelinja kan få «Horn» når et varsel står, så veiledningen er kjørt; bare i stående (der det er færrest plasser på raden), ikke i liggende.
- **Testene som dekker filene** (`run.py smoke`, uten 3D): `npctest` 19, `autonavtest` 25, `hudtest` 18, `havflaate` 9, `hailtest` 4, `cashfxtest` 4, `docktest` 112, `dockrow` 16, `geartest` 46, `rorbutest` 13, `bunktest` 5, alle OK.
- **Skjermbildene** (`tests/out/o112/`, ikke i git; 800×1280 og 1280×800, 3D i SwiftShader): Senjas ferje om dagen i 0,3 km sikt og kystruteskipet en januarkveld i 0,4 km, med varselet i stripa og boksen («Tåke: Autonav viker · CPA 270 m», «Nedsatt sikt: Autonav viker · CPA 280 m om 3 s»), Horn i knappelinja, ringen i plotteren og minikartet, egen båts lanterner om dagen i tåke og kystruteskipets lanterner og vinduer nær. Om dagen ses ikke ferja i 0,3 km sikt, bare ringen rundt henne i minikartet («Tåke: Autonav viker · CPA 470 m»). Lyspunktene er små i SwiftShader; stjernene står over tåka når skydekket er tvunget lavt (i spillet kommer tett sikt bare med snø og skyer). I det liggende dagbildet kom ferja 18 m unna etter at skriptet hadde frosset tiden (`S.mult`) i et halvt minutt for bildet og så sluppet den; uten frysingen gikk det samme møtet klar med 565 m i 3D og 294 m uten 3D. `S.mult` finnes bare for testene (én klokke for alle).
- **Stikkprøven langs kysten** (`/stikkprove`, `dist-vec` med hele kysten og kystflåten, juni kl. 6, 0,5 km sikt, uten 3D; en kystbåt på kryssende kurs, begge veier):

  | Sted | Båten | NPC-en har deg om styrbord | Du har NPC-en om styrbord |
  |---|---|---|---|
  | Bergen | Sjøsprøyt | Første kjøring: hun sto **på land** et halvt minutt 195 m fra kursen (funnet her, rettet med `sjvRoomOn`). Etter rettingen: hun gikk tilbake da det ble trangt, slakket av (lå 1,2 km etter) og var tilbake på banen; nærmest 652 m; Autonav 519 m ut | Autonav viker 477 m, nærmest 389 m; NPC-en trengte ikke å gjøre noe (CPA var åpen) |
  | Trondheim | Kystvakt | 195 m til styrbord, tilbake (0 m), nærmest 211 m; Autonav 456 m | Autonav 456 m, nærmest 401 m |
  | Hammerfest | Vesterhav | 228 m, tilbake (0 m), nærmest 299 m; Autonav 600 m | Begge viker (325 m og 456 m), nærmest 600 m |
  | Kristiansand | Kystvakt | Ikke plass til å svinge: hun slakket av, og Autonav svingte 390 m; nærmest 704 m | Ingen av dem hadde plass: begge slakket av, 19 e tok Autonav ned, og de passerte **98 m** fra hverandre uten nestenulykke |
  | Bodø | | Ikke prøvd: ingen kryssing med åpen sjø hele veien, kl. 6 og kl. 8 | |

  Aldri på land etter rettingen. Alle steder ga båten og NPC-en ett langt støt, og egen båt to lange da hun lå stille ved enden av ruta. Om natta i januar var alle båtene ved kaia uten lanterner og de få under fart med lanternene til et maskindrevet fartøy. Funnet om listene (`npcStates` med og uten id) står i backloggen.
- **Tiden** (`npcStates` med reglene, median av 25 med 25–42 båter på AIS): 0,5–0,8 ms i klart vær og 0,4–0,5 ms i tåke; den lengste enkeltkjøringen 25,8 ms (Hammerfest, i tåke, med maskinen under last fra testene ved siden av).

### 4.7 Ikke med

- Havskodde i været (4.1), dagsignalene (V7), vedlegg II (lysene for fiske nær andre som fisker) og vedlegg IV (nødsignalene, Ø11.6).
- Klokka og de tre slagene på grunn (35 h), losfartøyets fire korte (35 k), lyssignalene i 34 b og oppmerksomhetssignalet (36).
- NPC-ene sakker ikke farten etter tåkesignalet (19 e gjelder Autonav); de svinger etter 19 d, og slakker av bare når det ikke er plass (8 e). NPC-ene gir ikke signal når de svinger tilbake.
- Andre spilleres båter gir tåkesignal i ditt spill etter det spillet vet om dem (klassen og farten), ikke etter hva spilleren gjør med hornet.

## 5. Ø11.3 Sammenstøt (L2)

Bygd 07.11.2026 på grenen `ccr-208d78a1-ruhxll` (Jonas: «Oppgave: Ø11.3, sammenstøt mellom båter (L2). Les sjøloven kapittel 8 (§§ 161–164) ordrett på Lovdata før noe bygges … Kontakten og skylda legges i core/05e-sjovei.js. Skylda leses fra vikeplikten i sekundene før støtet (colregSit, rollene som står, regel 19 og sikker fart). I 16b-dyn.js og 16c-hull.js holdes det til ett kall hver, og 05-vessels.js røres ikke … Andre spilleres båter skades aldri, og det regnes bare med spillet åpent, aldri i catchUp»). Alt ligger nederst i `core/05e-sjovei.js`. De delte filene: ett kall i `core/16b-dyn.js` (øverst i `dynContact`: `sjvTouch`), ingen i `core/16c-hull.js` (skaden regnes med `hullHit`, `hullSay`, `hullCost`, `kaskoSelf` og `KASKO` slik de er), ingen i `core/05-vessels.js` (minuttsteget går gjennom `sjvSail` og blikket). Meldingen til en annen spiller ligger i `ui/10n-hail.js` (`hooks.onClash`), dagboka trengte ingen endring (`ui/06-logbook.js` viser loggen med `k:'nav'` og `S.radio`).

### 5.1 Kontakten

- **Skrogene** er femkanter av lengden og bredden (stevnen, skuldrene ved 0,3 L, hekken ved −0,47 L; `sjvHullPts`, samme ramme som `dynContact`), og kontakten finnes med skillende akser (`sjvSat`): overlappen, veien ut og punktet. Sjømerkene, brupilarene og vindturbinene i sjøen er sirkler fra hinderindeksen (`HIND`, `11b-obstacles.js`; `sjvSatC`), og blåsene til redskapet i sjøen punkter (`NPCGEAR`).
- **Mot hele lista** (backloggen 10.1, «`npcStates(H)` og `npcStates(H, id)` gir ulik plass»): båtene hentes fra `npcStates(H)` uten id, den samme lista som 3D-visningen og kartplotteren tegner, hvert andre spillsekund innen 300 m (`sjvNear`), og føres videre med farten og kursen mellom.
- **Tre steder det ses etter:** (1) i hvert steg i manøvreringsmodellen, både for hånd og med Autonav (`sjvTouch` fra `dynContact`, 0,2 spillsekunder; klokka for stegene er `sjvClock`: første steg i et tikk på visningenes tid, hvert steg etter `DYN_H` lenger fram); (2) i hvert blikk når modellen ikke har båten (`sjvSweep` fra `sjvEval`): skrogene fra forrige blikk til dette i steg på halvannen meter av bevegelsen mellom dem, når hun ligger stille, fisker eller driver på sjøen, eller går med minuttsteget; (3) minuttsteget går gjennom `sjvSail`, som tar blikket (`sjvFresh`) og holder henne der det minuttet støtet skjedde (`SJV.stopT`).
- **Hvem som er med:** alle i lista unntatt redningsskøyta, Kystvakta langs siden under kontroll, båten på slepet i et oppdrag, en spiller du sleper eller blir slept av, og de skjulte. Fortøyde og ankrede bare når du styrer selv (antatt: Autonavs vei inn er havnas, og en båt ved kai der 3D-visningen legger den er ikke noe Autonav ser). I havn, til ankers og på slep ses det ikke etter i blikket.

### 5.2 Støtet og skaden

- **Impulsen** er som mot kaia (`sjvImpulse`, som `dynContact`): båten settes ut av overlappen, farten inn i den andre snus med en femdel, med den andres masse (en halv blokkoeffisient av lengde, bredde og dypgang, `sjvMass`; din egen fra `disp`). NPC-en er på den felles klokka og flyttes ikke av støtet.
- **Under en knop** tar fendrene det. Over: hvert skrog tar støtet med den farten en kai ville gitt det samme (`sjvKnEq`: hele støtet på den med den andres andel av massen): sjarken mot kystruteskipet tar nesten hele farten, skipet nesten ingenting; to like båter hver farten over roten av to.
- **Din skade** er `hullHit` (Fysikk 3) med den farten, og det står i dagboka med `hullSay`: «Sammenstøt med «Sjøsprøyt», 6,0 knop. Skroget er skadet. «Sjøsprøyt» fikk skrammer.» (under 3 knop «Smell i …»).
- **Den andres skade** (`sjvOtherCost`) regnes som `hullHit` med hennes materiale (stål fra 15 m, havflåten og skipene, ellers glassfiber), og prisen er malingen over en flekk etter lengden, skroget etter hva hun er verdt (`sjvValue`: 6 m 0,1 MNOK, 10 m 1,2, 15 m 12, 21 m 20, 40 m 90, 60 m 150, 80 m 250, 125 m 900, antatt), og hullet; aldri over halve verdien. Kystruteskipet som får et lett støt, koster titusener, ikke millioner.
- **Et nytt støt** mens sammenstøtet varer (til NPC-en har ligget ferdig og ett minutt til) teller bare når det er en halv knop hardere, og da bare som skade på ditt skrog; ingen ny skyld og ingen ny betaling.
- **Sjømerkene, brupilarene og turbinene:** støtet som mot kaia, «Smell i sjømerket, 2,3 knop.» / «Hardt støt mot brupilaren …», skade med `hullHit`; ingen andre betaler eller får betalt (antatt: Kystverkets krav for et merke er ikke med).
- **Blåsene:** kjører du over en blåse i mer enn halvannen knop, står det «Kjørte over blåsa til «…». Pass deg for redskap i sjøen.» Ingen skade (de er myke) og ingen tau i propellen (ikke bygd).

### 5.3 Skylda (§§ 161 og 162)

Skylda leses fra **sporet av blikk** (`SJV.trail`): hvert blikk på hvert fartøy innen 3 km de siste 8 spillminuttene, med regelen og rollene som står (Ø11.1: de låses når faren begynner), CPA, TCPA, grensa, om regel 19 gjelder, peilingene, sikten og den sikre farten, og hvordan begge går. `sjvFault` gir poeng for feil:

| Feil | Poeng | Regel |
|---|---|---|
| Den vikepliktige (16; begge i 14, 18 c og 19) gjorde ingen markert manøver i god tid | 3 | 8, 16 |
| Den vikepliktige gjorde noe, men møtte den andre likevel (for lite, for sent) | 1 | 8, 16 |
| Den som skulle holde kurs og fart, endret kurs eller fart så de kom nærmere, mens det var mer enn 3 spillminutter til CPA (etter det tillater 17 a ii og krever 17 b) | 2 | 17 a i |
| Sving til babord for en forut: for den som skulle holde kurs, med den andre om babord | 2 | 17 c |
| Sving til babord for en forut ellers (møtende, nedsatt sikt; ikke den som innhenter) | 1 | 14 a, 19 d i |
| Over sikker fart i nedsatt sikt (din: stoppdistansene dine, `sjvSafeMs`; hennes: hun ses på under åtte lengder) | 1 | 6, 19 b |
| Ikke ned til minste styrefart i nærsituasjon med en forut i tåka (under 1 km, CPA under halve grensa) | 1 | 19 e |
| Svingte rett mot den andre i siste spillminutt uten at det var fare før | 3 | 8, 2 |
| Gikk på et fartøy som lå fortøyd eller til ankers | 3 | (2 b) |

- **Ikke det siste halve minuttet** (§ 161 femte ledd, «tid til overlegninger»): blikkene i de siste 30 spillsekundene (fem sekunder i ekte tid) teller ikke, så et kast i siste øyeblikk er ingen feil.
- **Manøveren måles** ved det siste blikket før det halve minuttet: hennes endringer i kurs og fart siden faren begynte, mot der hun ville vært på kursen og farten hun hadde da (bestikk), skal ha åpnet CPA med en femdel av grensa (minst 30 m) mot den andre slik hun faktisk gikk, eller mot den andre på kursen og farten hun hadde (17 a i: den vikepliktige kan regne med det); eller tatt 40 % av farten. **Å styre mot henne er ikke å vike:** en som fortsatte å svinge etter at den andre hadde lagt om, og fikk CPA ned der den gamle kursen ville gått klar (minst halve grensa), har ikke veket (funnet i `hulltest` 7a: forfølgelsen av ferja etter hennes sving etter 17 a ii så ut som en vikemanøver).
- **Ikke under kommando og begrenset manøvreringsevne** (3 f, g) får ingen poeng: hun kunne ikke gjøre noe. To som ligger stille eller driver under en knop: § 162. To som ikke kan manøvrere: § 162.
- **Ingen fare sett i tide** (ingen blikk med fare før det siste halve minuttet): den som svingte 20° eller mer mot den andre det siste spillminuttet mens den andre holdt kursen, får skylda; ellers rollene ved støtet (`colregSit` der og da), og den vikepliktige 3.
- **Delingen:** ingen poeng gir § 162, hver bærer sin skade. Ellers § 161, etter poengene i hele prosent, og minst en femdel til hver som har en feil (avrundet til firedeler ga 40/60 som 50/50 i testen; § 161 sier etter feilene). Eksempler (enhetstestene): du hadde vikeplikt etter regel 15 og gjorde ingenting, 100/0; hun skulle vike og gjorde ingenting, 0/100; du skulle holde kurs og svingte til babord tidlig, hun vek ikke, 40/60; møtende og ingen svingte, 50/50; du svingte til styrbord og hun ikke, 25/75; i tåke uten at noen gjorde noe, og du over sikker fart, 56/44.
- **Teksten** (`sjvFaultSay`): «Skylda etter sjøloven § 161 er din: du hadde vikeplikt etter regel 15 (kryssende) og holdt ikke av veien.», «… deles likt: du …, og «…» …», «Skylda etter sjøloven § 161: du 40 %, «Sjøsprøyt» 60 %. Du …, og hun …», «Sjøloven § 162: ingen feil på noen av sidene, så hver bærer sin skade.»

### 5.4 Betalingen

- **Din del av hennes skade** (`sjvSettle`): uten kasko betaler du alt, ført som «Erstatning til «…» (sjøloven § 161)» under «Forsikring og slep». Med kasko betaler forsikringen det som går over egenandelen, og du egenandelen; det er en skade på kaskoen som ved en reparasjon (premien en firedel opp i et år, `kaskoClaims`).
- **Hennes del av din skade:** det skaden din koster deg på verftet (`sjvOwnLoss`: ingenting når det er den første reparasjonen av skroget, som er gratis; egenandelen med kasko; ellers hele) ganger hennes andel, betalt som «Erstatning fra «…» (sjøloven § 161)» under «Andre inntekter». Med kasko tar verftet fortsatt egenandelen og registrerer skaden (antatt; i virkeligheten søker forsikringen regress og kan la være å telle skaden).
- Linja i dagboka: «Du erstatter 100 % av skaden på «MF Senjasund», 13 500 kr.» eller «Rederiet til «…» betaler deg 12 800 kr for din del av skaden på båten.»

### 5.5 § 164: VHF, dagboka, og NPC-en som blir liggende

- **VHF 16** (`sjvVhf`): ««Sjøsprøyt», «Sjøsprøyt», dette er «Havbris», LM6779, hjemsted Finnsnes, på vei fra Botnhamn til Tromsø. Vi har kollidert med dere. Er alle om bord i orden? Trenger dere hjelp?» og svaret ««Sjøsprøyt»: Alle i orden her. Ingen er skadet, vi klarer oss. Vi blir liggende litt og ser over skroget.» (med vann i båten: «Vi tar inn litt vann, men lensepumpa holder unna.»). Kjenningssignalet er båtens fra 10,67 m (`callOf`, Ø11.5); det sto i backloggen som noe som ventet på Ø11.3. Hvor hun kommer fra, er siste «Kastet loss fra …» i loggen (ellers nærmeste havn); hvor hun skal, neste havn på ruta, eller «feltet».
- Meldingen står 15 sekunder på skjermen som kystradioen (`toast`) og i `S.radio`, så dekksdagbokas navigasjonsside viser den med tiden («VHF 16: …»). Sammenstøtet og skylda med betalingen står som to linjer i loggen (`k:'nav'`).
- **NPC-en blir liggende** (`sjvStandBy`): tre spillminutter (et halvt minutt i ekte tid) der støtet var, som en lokal stopp over den felles banen (npc-flåten 4 A: aldri lagret eller sendt). Var hun i en vikemanøver, ligger hun med avviket hun hadde. Etterpå ligger hun så langt etter kursen sin som hun ventet og tar det igjen i 1,3 ganger farten, mens avviket går tilbake med svingens fart (`sjvPose`, `sjvOffAt` for `E.p0`). Mens hun ligger, er posisjonen den hele lista ga ved støtet; etterpå kommer den fra `npcStates(H, id)` (som etter en avslakking i Ø11.1).
- Sammenstøtene lagres i `S.clashes` (høyst 40, med tid, sted, båt, navnet, farten, regelen, skylda, skadene og betalingen) til Sikkerhet-kortet i Ø11.7.

### 5.6 Andre spilleres båter

Skades aldri (`CLAUDE.md`: sosialt er additivt): din båt tar støtet som mot en båt av hennes størrelse, men hun får ingen skade, ingen betaler noen, og hun stoppes ikke. Loggen sier «… er en annen spillers båt og tar ikke skade.» og «Du ropte opp «…» og spurte om de trenger hjelp (sjøloven § 164).», og spillet sender henne den faste linja «Trenger du hjelp?» (`HAIL.send(n, 4)`; serveren tar bare linjene 0–5, så en egen linje for sammenstøt trenger en migrering).

### 5.7 Når det regnes

Bare med spillet åpent og i gang (`sjvLive`: `DYN.on`, ikke i `catchUp`, `simRate` høyst 60). Med spillet lukket (catchUp) ses det ikke etter kontakt, og ingenting skjer (prinsipp 4). Siden NPC-ene og Autonav viker, skjer det i praksis når spilleren styrer selv, eller når ingen av dem har plass.

### 5.8 Tester og målinger

(fylles inn under)

### 5.9 Ikke med

- § 163 (skade uten kontakt: svell og sug), regressen og det solidariske ansvaret for personskade i § 161 (ingen blir skadet).
- Tau i propellen fra en blåse, skade på andres redskap, og Kystverkets krav for et sjømerke.
- At NPC-er støter i hverandre (de går på den felles klokka), og at en annen spillers båt stopper eller får vite skylda.
- At malusen på kaskoen faller bort når den andre hadde skylda.

## 6. Antatt eller usikkert

- Regel 19–37, vedlegg I og III og kapittel II 46, 49, 52 og 53 d er lest ordrett 06.11.2026 (Ø11.2); vedlegg II og IV ikke. Grensa for nedsatt sikt (2 mil), minste styrefart (2–4 knop), sikker fart (stopp innen halve sikten), at rollene står når de kommer i sikte, at NPC-en bruker maskinen akterover når hun slakker av, og at klokka høres som en fløyte under 20 m, er antatt (4.1–4.4).
- Sjøloven kapittel 8 er lest på Lovdata 06.11.2026, men leseverktøyet ga bare korte ordrette sitater; resten er gjengitt med egne ord (2.2). §§ 135 og 475, skipssikkerhetsloven fra § 28 og kapittel 7–10 i FOR-2000-06-13-660 er bare lest i sammendrag.
- Skylda (Ø11.3) er et spillvalg ut fra reglene, ikke en domstols vurdering: poengene, det halve minuttet for «tid til overlegninger», at en femdel av grensa er en markert manøver, åtte lengder for hennes sikre fart, verdiene etter lengden, massene etter en halv blokkoeffisient, og at hvert skrog tar støtet som mot en kai med den andres andel av massen (5.2–5.4).
- `sdir.no`, `kystverket.no`, `geonorge.no` og `nkom.no` nås ikke herfra. Lovdata svarer bare leseverktøyet, ikke `curl` eller Chromium (06.11.2026).
- Skyldfordelingen (Ø11.3) avgjøres i virkeligheten av en domstol; spillet bruker en enkel regel ut fra vikeplikten.
- Vikingen er lokal (npc-flåten 4 A): to spillere nær samme NPC-båt kan se den vike ulikt.
