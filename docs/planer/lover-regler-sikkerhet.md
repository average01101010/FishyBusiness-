# Lover, regler og sikkerhet på sjøen (Ø11a, plan 05.11.2026)

> Plan etter `/planlegg`. Bare dokument; ingenting er bygd. Planen slår sammen `docs/planer/lover-og-regler.md` (L0–L8), «Sikkerhet SK1–SK6» (oppgave #164) og N8 i `docs/planer/npc-flaaten.md` til én rekke økter, Ø11.1–Ø11.9. Valgene Jonas alt har tatt, står i kap. 2 og spørres ikke om igjen. De nye valgene er V7–V11 i kap. 7. Byggingen er Ø11 i `docs/planer/okter-etter-backloggen.md` og starter etter H2. **Venter på V7–V11, og på «kjør på» for Ø11.1 når H2 er ute.**

## 1. Hva Jonas ba om

- **Lover og regler** (28.10.2026): «Implementering av Lover, forskrifter, regler i spillet. Mål: At spillet har en høyest mulig grad av realisme, uten at det blir en dårlig eller mindre gøy opplevelse for brukerne.» Og: «Lag en plan som tar sikte på å jobbe med en ting av gangen slik at vi klarer å holde fokus og unngår å jobbe for bredt.» Planen ble `lover-og-regler.md`.
- **Sikkerhet SK1–SK6** (oppgave #164). Teksten står ordrett i backloggen, flyttet fra overleveringens kapittel 10 26.10.2026: «Blender-modeller (vest, drakt, leider, livbøye, PLB), risiko, mann over bord, nødstopp, utstyr og kurs, nestenulykker.» Noen lengre beskrivelse finnes ikke i repoet eller i git-historikken. Planen leser de seks leddene i rekkefølge: **SK1** modellene, **SK2** risiko, **SK3** mann over bord, **SK4** nødstopp, **SK5** utstyr og kurs, **SK6** nestenulykker (antatt, kap. 8).
- **N8 Sjømannskap** (npc-flåten, 28.10.2026), og Jonas' valg 05.11.2026: N8 skal planlegges sammen med lover og regler.
- **Ø11a** (05.11.2026): én plan med `/planlegg`, fordi L1 og L3 (vikeplikt, lys og lyd) gjelder både spilleren og NPC-ene, og fordi L6 (vesten, MOB-båten med davit, MOB-lys med røyk) og SK1 (vest, drakt, leider, livbøye, PLB) er det samme utstyret.

## 2. Valgene som alt er tatt (spørres ikke om igjen)

| Valg | Jonas | Det betyr for planen |
|---|---|---|
| V1 Når en regel brytes | **A** (28.10.2026) | Følgene kommer fra simuleringen: skade, ansvar etter skyld, høyere kaskopremie og en linje i dagboka. Ingen bøter, forelegg eller overtredelsesgebyr. Kystvakta ser bare på fiskeriet. |
| V2 Hvor strenge NPC-ene er | **A** (28.10.2026) | NPC-ene følger reglene 13–18 fullt ut: de viker når de skal, og holder kurs når spilleren skal vike. |
| npc-flåten 4 Vikeplikten | **A** (05.11.2026) | NPC-ene viker bare i spillerens egen visning, innen rundt 1 km fra båten hennes, og går tilbake til den felles banen etterpå. Sammen med V2 A: reglene følges fullt ut, men vikingen er et lokalt avvik som aldri lagres eller sendes. |
| V3 Påbudt utstyr | **Ingen sjekkliste, ingen sperre, ingen følger i kaskoen** (28.10.2026) | Lista over påbudt utstyr per båt, og modellene i Blender der de mangler. |
| V4 Fartsgrensene | **A** (28.10.2026) | En fast grense i havnene **hvis** Kystverket ikke har et åpent datasett. Et datasett er funnet (kap. 5.9), så V4 A blir reserven i Ø11.8. |
| V5 Alkohol | **A** (28.10.2026) | Ikke med. |
| V6 Påbudt utstyr i butikken | **A** (28.10.2026) | Det som er påbudt, følger med båten. Butikken selger det bare der det er valgfritt. Gamle lagringer får det som mangler, gratis. |
| Det som ikke lages | Jonas 28.10.2026 | Nødsignalene, linekasteren, nødpeilesenderen (EPIRB), SART-en, den håndholdte VHF-en og brannslukkeren oppbevares inne og vises ikke. Signalfigurene (som utstyr), radarreflektoren og refleksstripene lages ikke. Overlevelsesdrakten oppbevares inne. |
| Det som lages | Jonas 28.10.2026 | Oppblåsbar vest, båret av mannskapet og skipperen på dekk, uten merkenavn. MOB-båt med davit og vugge. MOB-lys med røyk på brakett. Referansene er beskrevet under L6 i `lover-og-regler.md`. |
| npc-flåten 2 Navnene | **A** (05.11.2026) | Oppdiktede navn på alle fartøy. |
| Hviletid og papirer | Jonas 11.10.2026 | Hviletiden er fjernet og kommer ikke tilbake. Sertifikatene sperrer ingenting. |
| `CLAUDE.md` | | Felles klokke, Friction for Flow, sosialt er additivt (andre spilleres båter skades aldri), ingen ekte firmanavn. |

Prinsippene 1–7 i `lover-og-regler.md` gjelder videre. Særlig prinsipp 4: den som ikke styrer, får aldri følger for noe hun ikke kunne påvirke. Derfor regnes sammenstøt og ulykker med følger bare når spillet er åpent, og ikke i `catchUp`.

## 3. Sammenslåingen

| Fra de gamle planene | Bygges i | Hvorfor sammen |
|---|---|---|
| L0 Kildene | Kap. 5 her (sjekket 05.11.2026); resten først i Ø11.1 | Planen trengte kildene for å bli riktig. Det som mangler, står i kap. 8. |
| L1 vikeplikt og varsel, N8 vikeplikt og AIS-status | **Ø11.1** | Samme regel (`colregSit`) gjelder spilleren, Autonav og NPC-ene. |
| L3 sikt, lyd og dagsignaler, N8 lys og lydsignaler | **Ø11.2** | `lanterns` tegner allerede både egen båt og NPC-ene. Lyden og dagsignalene kommer på begge samtidig. |
| L2 sammenstøt | **Ø11.3** | Skylda leses fra vikeplikten i Ø11.1 og sikten i Ø11.2. |
| L6a modellene, SK1 (vest, livbøye, PLB) | **Ø11.4** | Samme modeller. Drakten oppbevares inne. Leideren finnes alt (Ø11.5). PLB står i V10. |
| L6b utstyret på båtene, L4 merking, SK1 og SK5 (utstyret), V6 A | **Ø11.5** | Alt som synes på skroget og på folkene, i én økt i `vessel3d.js` og `view3d/09-landing-deck.js`. |
| SK2 risiko, SK3 mann over bord, SK5 kurs og øvelse | **Ø11.6** | Risikoen sier når det skjer, hendelsen er det spilleren gjør, og øvelsen lærer henne det. |
| SK4 nødstopp, SK6 nestenulykker, L8 havsnød | **Ø11.7** | Nestenulykkene samler det de andre fasene finner. Havsnød hos andre bruker maskineriet fra Ø11.6. |
| L5 farvannet | **Ø11.8** | Står for seg (data, kartlag, Autonav). |
| L7 arbeidsavtalen | **Ø11.9** | Står for seg (mannskapet). |

Ø11 var anslått til 4–6 økter. Det som overlapper (Ø11.1–Ø11.6), er seks økter. Ø11.7–Ø11.9 kommer etter, når de første er spilt.

## 4. Hva som finnes i dag

- **Lanternene** etter regel 22–30 og vedlegg I (lest 30.10.2026): `lanterns` i `vessel3d.js` (linje 1420). Egen båt tegnes i `view3d/24-cinema.js` (rundt linje 452), NPC-ene i `view3d/22-docks-air.js` (`drawNPCLights`). NPC-ene får fast fart 5 kn og aldri anker, så de viser alltid underveis eller fiske. Dagsignalene tegnes ikke.
- **NPC-ene** er rene funksjoner av den felles klokka: `coastState`, `coastNear`, `npcStates` i `core/05-vessels.js` og `havNear` i `core/05d-hav.js`, innen `AIS_KM` (15 km). Ingen viker for noen. Senja har alt en ferje og et kystruteskip (`NPC_ROUTES`), så Ø11.1 kan prøves før Ø15 bygger flere typer.
- **Autonav:** `leiaRoute` (`core/11-route.js`), `sail` og `sailReplan` (`core/05-vessels.js`), `dynAuto` (`core/16b-dyn.js`).
- **Lyd:** skipshornet `SND.horn` (`ui/10e-sound.js`), brukt av anropene (`ui/10n-hail.js`) og tutingen.
- **Sikten** (`visibility`, `core/03-simulation.js`) og **risikoen** (`riskLevel` med `BOAT.risk`, `core/03-simulation.js`; `risk` i `core/05-vessels.js` rundt linje 1146): sjø over ripa, motorstopp, rulling og redning. Ingen folk er i fare.
- **Fysikk 3:** `hullHit` og `KASKO` (`core/16c-hull.js`). Grunnstøting finnes. Støt mellom båter finnes ikke.
- **Livbøyene og flåtene:** `V.lsa = lsaOf(V)` (`core/02-species-gear.js` linje 247), tegnet i `view3d/09-landing-deck.js` (`K.buoys`, `K.raft`) fra `tools/deck/sikker.py` (`livboye`, `boyeholder`, `boyelys`, `boyeline`, `flate4/6/12`, `vugge`, radaren). Bøyene har navnet og hjemstedet på seg (`boye_strip_top`, `boye_strip_bot`).
- **Folkene:** `deckcrew.js` (agentene på dekk), garderoben (`tools/harbour/garderobe.py`, `arbeider.py`, `src/data/worker.b64`). Flytedress står som planlagt jakke i `docs/karaktersystem.md`.
- **Redning:** `rescue` (`core/05-vessels.js`), Redning-appen (`ui/phone/09-vaer-post-salg-redning.js`), slep med bergelønn (`turSlep`, `core/09g-turer.js`).
- **Kystvakta** (`core/09j-kystvakt.js`) ser bare på fiskeriet.
- **Mannskapet:** lott, trivsel og avmønstring (`core/04-crew.js`, `core/14-crewlife.js`). Ingen arbeidsavtale.

## 5. Regelverket, sjekket 05.11.2026

Lovdata ble lest gjennom en leseagent. Der den bare ga et sammendrag og ikke teksten, står det **[sammendrag]**; det må leses ordrett i fasen som bygger det. `sdir.no`, `kystverket.no`, `geonorge.no` og `nkom.no` nås ikke fra testmiljøet (DNS-feil eller avvist av proxyen). Tallene fra Sjøfartsdirektoratet er derfor fra søkemotorens sammendrag av direktoratets PDF-er, ikke lest av oss.

### 5.1 Sjøveisreglene, FOR-1975-12-01-5

<https://lovdata.no/dokument/SF/forskrift/1975-12-01-5>. Gjelder, sist endret FOR-2025-06-26-1372. Regel 1–19 lest ordrett. Regel 20–37, vedlegg II og IV og kapittel II bare i sammendrag. Vedlegg I ble lest 30.10.2026 (lanternene). Vedlegg III er ikke lest.

| Regel | Krav | Spillet | Fase |
|---|---|---|---|
| 3 d | «Fartøy som holder på med å fiske» er fartøy med garn, line, trål eller annet redskap som begrenser manøvreringen, ikke den som fisker med liner på slep | Fiske gir forrang bare med garn, line, teine, snurrevad, trål og not i sjøen, ikke med juksa eller dorg | Ø11.1 |
| 3 f, 3 g, 3 h | Ikke under kommando; begrenset manøvreringsevne; hemmet av dypgående | Motorstopp og drift er ikke under kommando. Hemmet av dypgående kommer med de store skipene i Ø15 | Ø11.1 |
| 5, 6, 7, 8 | Utkikk. Sikker fart (sikt, trafikk, stoppdistanse, vind, sjø og strøm, dybde). Fare for sammenstøt når peilingen ikke endrer seg merkbart, og ved tvil. Manøveren i god tid, tydelig, ikke en rekke små | `colregSit` (CPA, TCPA, peilingen), NPC-enes og Autonavs manøver | Ø11.1, Ø11.2 |
| 9 b, 9 c, 10 | Fartøy under 20 m og fartøy som fisker skal ikke hindre et fartøy som bare kan navigere sikkert i en trang lei. Det samme i trafikkseparering | Varselet sier «gå av veien». Storskipet holder kurs | Ø11.1 |
| 13, 14, 15 | Innhenting (mer enn 22,5° aktenfor tvers), møtende (begge viker til styrbord), kryssende (den som har den andre om styrbord, viker og går ikke foran) | `colregSit` | Ø11.1 |
| 16, 17 | Den vikepliktige gjør noe tidlig og tydelig. Den andre holder kurs og fart, kan gjøre noe når det er klart at den andre ikke viker, og må gjøre noe når sammenstøt ikke kan unngås ellers; ikke sving babord for et fartøy om babord | NPC-ene og Autonav | Ø11.1 |
| 18 | Maskindrevet viker for ikke under kommando, begrenset manøvreringsevne, fiske og seil. Den som fisker, viker for de to første | Rangen i `colregSit` | Ø11.1 |
| 19 | Nedsatt sikt: sikker fart, maskinen klar, ikke sving babord for et fartøy forut for tvers, ned til minste styrefart når tåkesignal høres forut | Autonav i tåke | Ø11.2 |
| 26 | Trål grønt over hvitt, annet fiske rødt over hvitt, to kjegler spiss mot spiss om dagen [sammendrag]. COLREG tillater en kurv under 20 m, men det ble ikke funnet i Lovdatas tekst | Lanternene finnes; dagsignalene etter V7 | Ø11.2 |
| 27, 30 | Ikke under kommando: to røde og to kuler. Anker: kule forut. På grunn: tre kuler [sammendrag] | Dagsignalene etter V7 | Ø11.2 |
| 32, 33 | Kort støt om lag 1 s, langt 4–6 s. Fløyte fra 12 m, klokke fra 20 m. Under 12 m et annet middel som gir kraftig lyd [sammendrag] | Hornet finnes for alle båtene | Ø11.2 |
| 34 | 1 kort styrbord, 2 korte babord, 3 korte bakk. Minst 5 korte ved tvil. Ett langt ved sving og hindret sikt [sammendrag] | NPC-ene og spillerens horn | Ø11.2 |
| 35 | Nedsatt sikt: ett langt minst hvert 2. minutt underveis, to lange når fartøyet ligger stille, ett langt og to korte for fiske og ikke under kommando, klokke ved anker [sammendrag] | Tåkesignalene | Ø11.2 |
| 37, vedlegg IV | Nødsignalene [sammendrag] | Bare i håndboka | Ø11.6 |
| Kap. II, 53 d | Fiskerioppsynsfartøy viser blått rundtlys [sammendrag] | Kystvaktas skip | Ø11.2 |

### 5.2 Sjøloven, LOV-1994-06-24-39

<https://lovdata.no/dokument/NL/lov/1994-06-24-39>. §§ 135, 161–164 lest gjennom sammendrag. Resten bare overskrifter.

| § | Krav | Spillet | Fase |
|---|---|---|---|
| 135 Havsnød | Skipsføreren skal gjøre alt for å redde folk om bord, og hjelpe alle i havsnød så langt det skjer uten alvorlig fare for eget skip og folk [sammendrag] | Anropet når en båt i nærheten er i nød | Ø11.7 |
| 161 | Den som har skyld, erstatter skaden. Har begge skyld, deles den etter feilene; går det ikke å avgjøre, likt. Personskade gir solidarisk ansvar [sammendrag] | Skylda leses fra vikeplikten før støtet | Ø11.3 |
| 162 | Ulykkeshendelse eller uvisst: hvert skip bærer sin skade [sammendrag] | Samme | Ø11.3 |
| 163 | De samme reglene når et skip skader et annet ved manøver uten at de støter sammen [sammendrag] | Ikke bygd (kjølvann og svell); står i kap. 8 | |
| 164 | Etter sammenstøt: hjelpe den andre, og oppgi skipets navn og hjemsted og hvor det kommer fra og skal [sammendrag]. Det står i § 164, ikke i § 136 | Spillet gjør det for deg (VHF og dagboka) | Ø11.3 |
| 475 | Melding om sjøulykke til den myndighet Kongen bestemmer [sammendrag] | Spillet melder for deg | Ø11.6 |
| 131, 133, 143–145, 441–455 | Sjødyktighet, skipsbøkene, alkohol, berging: bare overskriftene lest | Alkohol er ikke med (V5 A). Bergelønnen finnes (`turSlep`); § 445 er ikke lest | |

### 5.3 Skipssikkerhetsloven, LOV-2007-02-16-9

<https://lovdata.no/dokument/NL/lov/2007-02-16-9>. Sist endret LOV-2025-04-25-12. §§ 1–27 ordrett, resten [sammendrag].

- **§ 2:** loven gjelder også fiskefartøy i næring, uansett lengde. Bare skip under 24 m som ikke brukes i næring, er unntatt (ordrett). Om en forskrift unntar fiskefartøy under 24 m, er ikke sjekket.
- **§ 7** sikkerhetsstyringssystem, **§ 9** teknisk sikkerhet (g: redningsmidler), **§ 14** navigering (hjemmelen for sjøveisreglene), **§ 19** skipsførerens plikter, **§ 20** at andre om bord skal medvirke, **§ 21** sikkerhetsinnretninger og utstyr. Kravene til utstyret står i forskriftene i 5.5 og 5.6.
- **§ 24** hviletid: ikke med (Jonas 11.10.2026).
- **§ 47** melding ved skade eller sykdom [sammendrag] → Ø11.6.
- **§ 52** tilbakeholdelse, **§§ 55–56** overtredelsesgebyr, **§§ 58–70** straff [sammendrag]: ikke med (V1 A).
- Ingen plikt til å **bruke** flyteplagg står i loven (§ 22 c gir bare hjemmel til en forskrift om verneutstyr).

### 5.4 Skipsarbeidsloven, LOV-2013-06-21-102

<https://lovdata.no/dokument/NL/lov/2013-06-21-102>. Sist endret LOV-2026-04-10-14 (i kraft 01.07.2026). Ordrett.

- **§ 1-2:** gjelder arbeidstakere om bord på norsk skip, uten unntak for fiske eller lengde. Om eieren som arbeider alene, er omfattet, sier teksten ikke.
- **§ 3-1:** skriftlig arbeidsavtale, senest når arbeidstakeren går om bord. Minsteinnholdet står i en forskrift som ikke er lest.
- **§ 3-2:** prøvetid inntil seks måneder.
- **§ 5-2:** oppsigelsesfrist én måned (skipsfører tre). To måneder etter fem års tjeneste, tre etter ti, 14 dager i prøvetiden.
- **§ 5-6:** oppsigelse må være saklig begrunnet.
- **§ 4-1 (4):** lønnsreglene gjelder ikke beregningen av lott på fiskefartøy.
- Loven har ikke noe kapittel om arbeidstid.

→ Ø11.9.

### 5.5 Fiskefartøy under 15 m, FOR-2013-11-22-1404

<https://lovdata.no/dokument/SF/forskrift/2013-11-22-1404>. Sist endret FOR-2025-06-26-1372. Ordrett. § 1: gjelder alle norske fiskefartøy under 15 m. Grensene står i den enkelte paragrafen (6, 8, 10,67 og 12 m). Forskriften definerer verken åpent eller dekket fartøy eller fartsområdene.

| § | Krav | Fase |
|---|---|---|
| 17 | Minst to brannslukkere på 6 kg | Oppbevares inne |
| 36 | Én redningsvest per person om bord, lett tilgjengelig | Ø11.4, Ø11.5 |
| 37 | Dekket fartøy og åpent med styrhus: redningsdrakt per person, med løftestropp, fløyte og lys | Oppbevares inne |
| 38 | Dekket fartøy over 6 m: flåte til alle. Høyst tre om bord: 4-mannsflåte etter ISO 9650-1 | Finnes |
| 43 | Én livbøye per tre personer, minst halvparten med lys, merket med navn og hjemsted. Under 10,67 m minst én med 30 m line. 10,67–15 m minst to, én med line på hver side | Finnes; sjekkes i Ø11.5 |
| 44 | To røyksignaler. Fjord- og kystfiske 3 fallskjermlys og 3 håndbluss; bankfiske 6 og 4 | Oppbevares inne |
| 45 (6) | Rednings- og brannøvelse minst hver tredje måned, og når over en tredjedel av mannskapet er byttet | Ø11.6 (V11) |
| 60, 61 | Radarreflektor; refleksstriper | Lages ikke |
| 63 | Fast leider akter med håndrekker, nederste trinn minst 300 mm under vannlinja | Ø11.5, Ø11.6 |
| 64, 68 | Radio på dekkede og åpne med styrhus: VHF-DSC overalt; fra kystfiske EPIRB, SART og håndholdt VHF (tabellen er flatet ut på Lovdata; kolonnene er tolket) | VHF følger båten (V6 A); resten inne |
| 75 | Magnetkompass | Finnes |
| 77 | Brovaktalarm på 10,67–15 m med selvstyring og fartsområde over fjordfiske | Følger båten (V6 A) |
| 79 | Plasseringen av radaren når den finnes. Radar er **ikke** påbudt her (lista i `lover-og-regler.md` L6 sa det) | Rettet her |
| 84 | Prismekikkert 7 × 50 eller 8 × 35 | Finnes |
| 86, 87 | Lanterner; «ett sett signalfigurer» på alle fartøy | Ø11.2 (V7) |
| 88 | Fast horn eller fløyte på 12–15 m. Under 12 m ikke krav her | Ø11.2 |
| 89 | Lyskaster på 12–15 m bygd etter 1.7.1997 med fartsområde over fjordfiske | Finnes |
| 92, 95–97 | Fartøyinstruks fra 8 m. Kontroll hver 30. måned | Ikke med (papirene) |

**Ikke funnet i forskriften:** plikt til å bære vest eller flytedress på dekk; nødstopp på haler eller vinsj (bare § 5 a om trålvinsjer montert etter 1.1.2023, som skal slakke ut over innstilt trekkraft); utstyr eller øvelse for mann over bord utover leideren, livbøya og øvelsen i § 45; PLB og AIS-MOB; risikovurdering.

### 5.6 Fiskefartøy fra 15 m, FOR-2000-06-13-660

<https://lovdata.no/dokument/SF/forskrift/2000-06-13-660>. Tittelen på Lovdata er «Forskrift om konstruksjon, utstyr og drift av fiskefartøy med lengde 15 meter eller mer». Gjelder, sist endret FOR-2025-06-26-1372. Om en nyere forskrift er på vei, er ikke sjekket.

| § | Krav | Fase |
|---|---|---|
| 7-5 | Redningsfarkoster til 200 % av de om bord (under 24 m og 24–45 m), ordrett. MOB-båt fra 45 m, og 24–45 m med bankfiske II eller større, med mindre en redningsbåt fyller kravet | Ø11.5 |
| 7-8, 7-9 | Redningsvest og redningsdrakt per person [sammendrag] | Ø11.4 (vesten); drakten inne |
| 7-10 | Livbøyer: 3 under 24 m, 4 for 24–45 m, 6 for 45–75 m, 8 fra 75 m. Lys på halvparten (under 24 m minst én). Røyk på minst to (under 24 m én). Line på hver side, minst 30 m [sammendrag] | Ø11.5 |
| 7-11, 7-12, 7-13, 7-14 | Linekaster fra 24 m; nødsignaler; håndholdt VHF per redningsfarkost og MOB-båt; SART [sammendrag] | Oppbevares inne |
| 9-6 | VHF-DSC (kanal 70, tale på 6, 13 og 16). AIS- eller radar-SART fra kystfiske eller fra 24 m (ordrett). EPIRB [sammendrag] | VHF følger båten |
| 10-3 | Radar fra 24 m, og under 24 m med bankfiske I [sammendrag] | Finnes |
| 10-4a | AIS fra 15 m [sammendrag] | Følger båten (V6 A) |
| 10-5, 10-7 | Lyskaster på alle; brovaktalarm med autopilot og fartsområde kystfiske eller større [sammendrag] | Finnes; følger båten |
| 5-55, 5-56 | Minst tre bærbare brannslukkere (under 24 m); 50 % flere for fartøy bygd etter 2003 [sammendrag] | Oppbevares inne |
| 8-3 | Båt- og brannøvelse hver måned (under 24 m hver tredje). MOB-båten sjøsettes hver måned, minst hver tredje [sammendrag] | Ø11.6 (V11) |

**Avvik i spillet i dag:** `lsaOf` gir kyst21 (21 m) fire livbøyer (§ 7-10: tre) og pelagisk (75 m) seks (§ 7-10: åtte), og vet ikke om røyk. Rettes i Ø11.5.

### 5.7 Sikkerhetsopplæringen, FOR-2011-12-22-1523

<https://lovdata.no/dokument/SF/forskrift/2011-12-22-1523>, §§ 5–16 ordrett. **§ 8 (4):** den som ikke har sertifikatplikt på fiskefartøy, skal ha bestått sikkerhetsopplæring for fiskere. **§ 7 (b):** opplæringen dekker hva man gjør når «en person faller over bord». Lengden står ikke der: 40 timer grunnkurs (Store norske leksikon, «fisker», <https://snl.no/fisker>) og 20 timer oppdatering innen åtte år (Sjøfartsdirektoratets emneplan fra 2015). Ingen av delene er sjekket mot en gjeldende side hos direktoratet.

### 5.8 Merking og kjenningssignal, FOR-2002-06-27-754

<https://lovdata.no/dokument/SF/forskrift/2002-06-27-754>. Gjelder, sist endret FOR-2025-06-26-1372. Ordrett.

- **§ 5:** registrerte skip, og fiskefartøy mellom 10,67 og 15 m, får kjenningssignal fra Sjøfartsdirektoratet.
- **§ 9:** skip i skipsregistrene har navnet forut og akter, synlig fra begge sider, og hjemstedet akter, med bokstaver på minst 15 cm. Under 15 m skal navnet stå godt synlig fra begge sider, med bokstaver på minst 6 cm. Kjenningssignalet merkes varig, og under 15 m også utvendig på skroget.
- **Formen:** under 15 m to bokstaver og fire siffer, for eksempel VH5150 (Store norske leksikon, «registreringsnummer – skip», <https://snl.no/registreringsnummer_-_skip>). En ekte fiskebåt har LK3764. Nkom nås ikke herfra.

→ Ø11.5.

### 5.9 Farvannet: havne- og farvannsloven og fartsgrensene

- **LOV-2019-06-21-70** (<https://lovdata.no/dokument/NL/lov/2019-06-21-70>), §§ 1–32 ordrett:
  - § 7: staten kan regulere ferdselen, blant annet med fartsbegrensning og ankring.
  - **§ 8: kommunen kan bare regulere fritidsfartøy.** Spillets båter er næringsfartøy, så de kommunale fartsforskriftene gjelder dem ikke. `lover-og-regler.md` L5 antok at fartsgrensene var kommunale, og det stemmer bare for fritidsbåtene.
  - § 9: kommunens ankringsforbud.
  - § 10: navigasjonsinnretninger og skilt skal ikke skades, flyttes eller brukes til fortøyning.
  - § 11: plikt til å varsle fartøy i nærheten om farer.
  - § 17: fartøy skal ikke brukes eller etterlates slik at de er til fare.
- **FOR-2021-04-19-1214, fartsgrenser på sjøen:** § 2: «Enhver som fører et fartøy skal utvise forsiktighet og avpasse farten etter sikt- og farvannsforholdene.» I tillegg gjelder 5 knop innen 50 m fra der det bades (regjeringen.no, «Nye regler om fartsgrenser på sjøen», <https://www.regjeringen.no/no/aktuelt/nye-regler-om-fartsgrenser-pa-sjoen/id2845279/>).
- **FOR-2021-12-16-3622, statlige fartsgrenser** for næringsfartøy (Kystverket): ikke lest. Den endres om lag to ganger i året.
- **Datasettet:** Geonorge har «Statlige fartsgrenser på sjøen for næringsfartøy» (Kystverket, gyldig fra 01.01.2022). Det ble funnet i Geonorges testkatalog. Lisensen og nedlastingen er ikke sjekket, fordi `geonorge.no` ikke nås herfra.
- **FOR-2012-12-19-1329, farvannsskilt** (<https://lovdata.no/dokument/SF/forskrift/2012-12-19-1329>): gjelder fortsatt etter 2019-loven (overgangsregelen i § 53). Vedlegg 1 punkt 5.10 har skiltet for fartsgrense. IALA nevnes for spesialmerkene, men det laterale systemet i region A ble ikke funnet i teksten som ble lest.

→ Ø11.8.

### 5.10 Ulykkene (Sjøfartsdirektoratet)

- Næringsfartøy: 5 omkomne i 2024 og 7 i 2025. Fiskefartøy er 24 % av ulykkene (Sdir, «Ulykkestatus 2024» og «Ulykkestall 2025», PDF-er på sdir.no).
- Fiskefartøy under 15 m: 14 fall over bord på ti år, og 13 omkom. Fall over bord fra små fiskebåter ender oftest med at fiskeren dør (Sdir, «Høyrisikohendelser»).
- Fiskerregisteret 2025: 9 210 fiskere med fiske som hovedyrke (`kvoter-og-regler.md` kap. 6).

Tallene viser at mann over bord er sjeldent per fisker og alvorlig når det skjer. SK2 kalibreres etter det, men spillets hyppighet er et spillvalg (kap. 8).

## 6. Øktene Ø11.1–Ø11.9

Hver økt er én fase, ferdig, testet og rullet ut før den neste. Alle kommer etter H2e. Nye regler og funksjoner legges i nye filer (`core/05e-sjovei.js`, `core/14b-sikkerhet.js`), så de delte filene får bare et kall eller to. Hver økt skriver det den avgjør, inn i `docs/systemer/sjofart-og-lover.md` (ny i Ø11.1) med paragraf og kilde, slik `kvoter-og-regler.md` gjør.

### Ø11.1 Vikeplikten for spilleren og NPC-ene (L1, N8)

- **Først:** `docs/systemer/sjofart-og-lover.md` skrives ut fra kap. 5 og legges i `docs/INDEKS.md` (det som var L0).
- **Kjernen** (`core/05e-sjovei.js`, ny):
  - `colregCls(v)` gir klassen etter regel 3 og 18: maskindrevet, fisker (bare med redskap som begrenser manøvreringen, 3 d), ikke under kommando (motorstopp, drift) og hemmet av dypgående (de store skipene fra Ø15).
  - `colregSit(a, b)` gir situasjonen (13, 14 eller 15), hvem som viker (16, 17, rangen i 18, og 9 b–c i trange leier), CPA og TCPA. Den gjelder egen båt mot NPC-ene, Kystvakta og de andre spillernes båter.
- **NPC-ene viker** (V2 A, npc-flåten 4 A):
  - Innen rundt 1 km fra spillerens båt, og bare i hennes visning: tydelig sving til styrbord eller fart ned i god tid (regel 8 og 16), og tilbake til den felles banen når CPA er åpen.
  - Som den som skal holde kurs, holder NPC-en kurs og fart, og gjør noe først når det er klart at spilleren ikke viker (17 a ii og 17 b).
  - Avviket legges oppå posisjonen fra `npcStates`, `coastNear` og `havNear` med ett kall der listene lages. Det lagres aldri og sendes aldri.
  - En vikemanøver går aldri på land eller grunn (`groundCheck`, leinettet). Er det ikke plass, senker NPC-en farten i stedet (8 e).
- **AIS-status** (N8): AIS-kortet viser underveis, fisker, ankret, fortøyd eller ikke under kommando, ut fra `n.st`.
- **Varselet** (prinsipp 3): i kartplotteren og statusboksen, for eksempel «Kryssende fra styrbord: du viker», med CPA i meter, en farget vektor og en ring på målet. Det kommer bare når CPA er under grensa og TCPA under noen minutter, aldri i havn. Det skal være sjeldent.
- **Autonav og Driftsplan viker** for båter de har vikeplikt for (`sail`, `dynAuto`), og går tilbake til ruta. Det skjer bare med spillet åpent: i `catchUp` regnes verken viking eller støt (prinsipp 4).
- **Nestenulykke:** en passering under en fast grense (om lag 50 m, settes i fasen) lagres til Ø11.7.
- **Filer:**
  - Nye: `core/05e-sjovei.js` og én linje i malen.
  - Ett kall hver: `core/05-vessels.js` (`npcStates`, `sail`), `core/05d-hav.js` (`havNear`), `core/16b-dyn.js` (`dynAuto`).
  - Varselet: `ui/03-map.js` (AIS-kortet og vektoren), `ui/03e-miniplot.js`, `ui/04-panels-instruments.js`.
- **Tester:**
  - Nye: `tests/unit/sjovei.test.mjs` (situasjonene 13–15, rangen i 18, 9 b–c, CPA og TCPA, grensetilfellene) og `tests/colregtest.py` (LITE). `colregtest` prøver Senjas ferje og en kystbåt på kryssende kurs med spilleren: NPC-en viker innen 1 km og holder kurs når spilleren skal vike, Autonav viker og kommer tilbake, og ingen NPC havner på land.
  - Fra før: `npctest` (samme tid gir samme posisjon utenfor 1 km), `autonavtest` og `routetest`.
- **Måles:** hvor ofte varselet kommer på en tur ut og hjem, og tiden i avviksfunksjonen i Lofoten i mars.

### Ø11.2 Sikt, lys, lyd og dagsignaler (L3, N8)

- **Sikt** (regel 6 og 19):
  - `visibility` gir hvor langt unna en båt ses. I tåke og mørke kommer varselet fra Ø11.1 tidligere.
  - Autonav går i sikker fart etter sikten og stoppdistansen. I tåke svinger verken Autonav eller NPC-ene babord for et fartøy forut for tvers.
  - Høres et tåkesignal forut, går Autonav ned til minste styrefart (19 e).
- **Lydsignaler** (regel 32–35):
  - NPC-ene innen hørevidde gir tåkesignal: ett langt hvert 2. minutt underveis, to lange når de ligger stille, ett langt og to korte når de fisker eller er ute av kontroll.
  - Manøversignalene høres når en NPC viker innen synsvidde: 1, 2 eller 3 korte. Minst 5 korte når spilleren har vikeplikt og ikke gjør noe (34 d).
  - Spillerens horn (`SND.horn`) får korte og lange støt: 1, 2, 3 og 5 korte og ett langt. Egen båt gir tåkesignal selv i tåke.
  - Lyden blir svakere med avstanden.
- **Dagsignalene** (etter V7): kjeglene når båten fisker, kula ved anker, to kuler ved motorstopp og drift. Det gjelder egen båt og NPC-ene. De legges ved mastetoppens lanterne.
- **NPC-enes lanterner etter det de gjør** (N8): `drawNPCLights` får den virkelige farten, ankeret og «ikke under kommando» fra NPC-en, ikke fast 5 kn. Kystvaktas skip får blått rundtlys (kap. II, 53 d).
- **Vedlegg I og III og regel 20–37** leses ordrett før byggingen.
- **Filer:**
  - `core/05e-sjovei.js`.
  - `vessel3d.js`: `lanterns` gir også dagsignalene.
  - `view3d/22-docks-air.js` (`drawNPCLights`) og `view3d/24-cinema.js` (egen båt).
  - Lyden: `ui/10e-sound.js` (mønstrene) og `ui/10n-hail.js` (hornknappene).
  - Sikker fart: `core/05-vessels.js` (`sail`) og `core/16b-dyn.js`.
  - `docs/systemer/lyd.md`.
- **Tester:**
  - `lanterntest`, utvidet med dagsignalene.
  - `colregtest` i tåke.
  - `soundtest`.
  - `anchorlight3d`, kjørt alene.
  - Skjermbilder i begge formater.

### Ø11.3 Sammenstøt mellom båter (L2)

- **Kontakt** mellom egen båt og NPC-båtene, Kystvaktas skip, sjømerkene og redskapsblåsene. Skaden regnes med `hullHit` som i dag.
- **Skylda** leses fra `colregSit` i sekundene før støtet: hvem hadde vikeplikt, holdt den andre kurs og fart, og var farten sikker for sikten.
  - § 161: skylda deles etter feilene, og likt når det ikke kan avgjøres.
  - § 162: ved uhell bærer hver sin skade.
- **Betalingen:** spilleren betaler sin andel av NPC-ens skade. Kaskoen dekker ansvaret og egen skade over egenandelen, med malus som i dag.
- **§ 164:** spillet oppfyller plikten for deg, med VHF-melding om navn, hjemsted, hvor du kommer fra og hvor du skal, og en linje i dagboka.
- **Andre spilleres båter** skades aldri av ditt støt. De får bare en melding.
- **Når det regnes:** bare med spillet åpent. Siden NPC-ene og Autonav viker, skjer det i praksis bare når spilleren styrer selv.
- **§ 163** (skade uten kontakt, for eksempel svell) bygges ikke.
- **Filer:**
  - `core/05e-sjovei.js`: kontakten og skylda.
  - `core/16c-hull.js`: `hullHit` for et annet fartøy og ansvaret i `KASKO`.
  - `core/16b-dyn.js`: støtet i bevegelsen.
  - `ui/06-logbook.js`: dagboka.
  - `ui/10n-hail.js`: meldingen til den andre spilleren.
- **Tester:** `hulltest` (utvidet) og `sjovei.test.mjs` (skylda i hver situasjon).

### Ø11.4 Utstyrsmodellene i Blender (L6a, SK1)

Etter `/blender` og `docs/skipsmodeller/leseliste.md`. Ingen merkenavn eller logoer.

- **Vesten:** oppblåsbar redningsvest (150–165 N) etter Jonas' referanser (L6). Den er et plagg i garderoben og legges på mannskapet og skipperen. Vesten tegnes ikke over flytedressen, som teller som flyteplagg. Med V10 A har den en liten sender på brystet.
- **MOB-båten** med davit og vugge, ny `tools/deck/mob.py`. Målene tas fra LSA-koden i fasen. Davitet står stille; å svinge det ut kommer i Ø11.6.
- **MOB-lys med røyk** på brakett, i `tools/deck/sikker.py`. `mob_profile` finnes alt i `boyelys`.
- **Lages ikke:** drakten og det andre som oppbevares inne. Dagsignalene lages i koden (V7). Leideren finnes alt (Ø11.5).
- **Filer:**
  - Skriptene: `tools/harbour/garderobe.py`, `arbeider.py` og `garderobe_bilder.py`, `tools/deck/sikker.py` og `tools/deck/mob.py` (ny).
  - Dataene: `src/data/worker.b64`, `src/data/deck-safety.b64` og en ny `src/data/deck-mob.b64` med dataelementet i malen.
  - Holder seg unna `tools/boats/fittings.py` og `tools/deck/pall.py` (H2d, Ø4).
- **Tester:**
  - Kontrollbildene og kritikksløyfen.
  - `garderobe_bilder.py` skal gi 0 kryss med vesten.
  - `crewclip`.
- **Merk:** Ø11.4 rører bare Blender-skript og egne `.b64`-filer. Den kan tas før H2 er ferdig hvis Jonas vil, med varsom fletting av malen.

### Ø11.5 Utstyret og merkingen på båtene (L6b, L4, SK1, V6 A)

- **`lsaOf` etter § 43 og § 7-10:**
  - Livbøyene: 3, 4, 6 og 8 fra 15 m. Kyst21 går fra 4 til 3, og pelagisk fra 6 til 8.
  - MOB-lys med røyk fra 15 m: på minst to bøyer, under 24 m på én. Under 15 m har bøyene bare lys.
  - MOB-båten fra 45 m (autoliner, snøkrabbe, bunntrål og pelagisk), på en ny ankerplass `K.mob`. Mangler modellen plassen, settes den fra koden til modellen revideres (Ø4).
- **V6 A:**
  - VHF på dekkede båter og åpne med styrhus. AIS fra 15 m. Brovaktalarm der § 77 og § 10-7 krever den.
  - Påbudt utstyr følger båten, og butikken selger det bare der det er valgfritt.
  - Gamle lagringer får det som mangler, gratis.
- **Vesten på folkene:** alltid på dekk til sjøs, ikke i havn eller på kaia (Jonas 28.10.2026).
- **Leideren akter** sjekkes mot § 63 på hver modell: fast, med håndrekker, og nederste trinn minst 300 mm under vannlinja. Der den mangler eller er for kort, settes den på ankeret fra koden.
- **L4 Merkingen:**
  - Kjenningssignal (to bokstaver og fire siffer) på 10,67–15 m, malt utvendig med 6 cm høye tegn, og på alle båter fra 15 m.
  - Ingen ekte kjenningssignaler: samme sperre som registreringsmerket. Signalene sjekkes mot fartøyregisteret hvis det har feltet.
  - Navnet forut og akter, 6 cm under 15 m og 15 cm fra 15 m. Hjemstedet akter fra 15 m.
  - Kjenningssignalet står på AIS-kortet og i VHF-meldingene (Ø11.3).
  - Avslutter `docs/batplan.md` del 12.
- **Filer:**
  - Utstyret og butikken: `core/02-species-gear.js` (`lsaOf`, påbudt utstyr i `VESSELS`), `ui/02-format-state.js` (gamle lagringer), `ui/10i-shop.js` og `ui/phone/12-utstyr-redskap.js`.
  - 3D: `view3d/09-landing-deck.js` (bøyene, MOB-båten og lysene), `vessel3d.js` (`markStrips`, kjenningssignalet) og personmodellen i `deckcrew.js` og `view3d/` (vesten).
- **Tester:**
  - `vesseltest`, enhetstestene og `vessel3d` (kjørt alene).
  - `deckshot` og `shoptest`.
  - Skjermbilder i begge formater, og stikkprøver av båtene langs kysten.

### Ø11.6 Mann over bord (SK2, SK3, SK5)

- **SK2 Risikoen:**
  - Sjansen for at noen går over bord, per time arbeid på dekk. Den øker med bølgehøyden, vinden, mørket og isingen, med setting og draging, og på åpne båter.
  - Den er nesten null i stille vær. `riskLevel` er grunnlaget.
  - Følger kommer bare når spillet er åpent, på båten hun følger, og når hun kan gjøre noe (prinsipp 4). Når hun ikke ser på, skjer bare nestenulykker som mannskapet tar selv. De står i «Mens du var borte».
  - Skipperen går ikke over bord i spillet, bare mannskapet, så spilleren alltid er den som handler. Er hun alene om bord, skjer det ikke.
  - Hyppigheten er et spillvalg og skal være sjelden (kap. 5.10). Den måles.
- **SK3 Hendelsen:**
  1. Alarmen går, og det står «Mann over bord!».
  2. MOB-knappen setter merket i plotteren.
  3. Båten snur med Williamson-svingen. Spilleren styrer selv, eller trykker «Autonav: MOB».
  4. Livbøya kastes. Fra 15 m viser røyken fra MOB-lyset stedet.
  5. Personen tas opp med leideren akter (§ 63), løftestroppen, eller MOB-båten fra 45 m, som svinges ut med davitet.
  - Hvor lenge personen klarer seg i vannet, avhenger av sjøtemperaturen. Vesten holder personen oppe. Utfallet følger V8.
- **SK5 Kurs og øvelse** etter V11. Med V11 A har alle i spillet kurset, slik de hadde papirene.
- **Meldingen** etter § 475 og skipssikkerhetsloven § 47: spillet melder for deg og skriver det i dagboka.
- **Ellers:** tips i håndboka med kilden, og et merke.
- **Filer:**
  - Nye: `core/14b-sikkerhet.js` (risikoen, hendelsen og øvelsen) og `ui/10s-mob.js` (skjermen under hendelsen), begge med en linje i malen.
  - Ett kall hver: `core/05-vessels.js` (`risk`), `core/13-work.js` (hvem som er på dekk), `core/04-crew.js` (sykmeldt etter V8).
  - UI: `ui/03-map.js` (MOB-merket), `ui/10e-sound.js` (alarmen), `ui/07c-handbook.js`.
  - 3D: `deckcrew.js` (personen i vannet), `view3d/21-rescue-anchor.js` (livbøya, røyken og MOB-båten).
  - `core/09f-merker.js` og `ui/phone/07-patch.js`.
- **Tester:**
  - Ny `tests/mobtest.py` (LITE): hendelsen i grov sjø med mannskap, merket, svingen, personen opp med leideren og utfallet; 3D-bildet kjørt alene.
  - Ny `tests/unit/mob.test.mjs`: sjansen mot været og tiden i vannet.
  - `crewtest` og `seaworktest`.

### Ø11.7 Nødstopp, nestenulykker og havsnød (SK4, SK6, L8)

- **SK4 Nødstoppen** på haleren, etter V9. Ingen forskrift krever den for halere. Den er god praksis.
- **SK6 Nestenulykkene:**
  - Kortet «Sikkerhet» i Redning-appen samler dem i én liste: passeringer under grensa (Ø11.1), nesten grunnstøting (`groundCheck`), mann over bord som endte godt, nødstopp i tide og sjø over ripa (`risk`).
  - Hver har dato, sted og én setning om hva den lærer, med kilde.
  - Et merke for turer uten skade.
  - Ingen telling som nulles av fravær.
- **L8 Havsnød** (§ 135):
  - Sjelden, og bare med spillet åpent: en NPC-båt i nærheten har mann over bord eller motorstopp i grov sjø, og ringer på VHF.
  - Den som er nærmest, kan svare og hjelpe, med det samme som i Ø11.6.
  - Belønningen er heder (merke og Kystposten). Bergelønn gis bare for skip og last, som i `turSlep`.
  - Lar spilleren være, tar en annen båt eller redningsskøyta det. Det får ingen følger (V1 A).
- **Filer:**
  - `core/14b-sikkerhet.js`.
  - Knappen under draget: `ui/09-hand-fishing.js` og `ui/10-rod-acts.js`.
  - Sikkerhet-kortet: `ui/phone/09-vaer-post-salg-redning.js`.
  - Anropet: `core/09g-turer.js`. Kystposten: `core/09h-press.js`. Merket: `core/09f-merker.js`.
- **Tester:** `mobtest` (utvidet) og `towtest`.

### Ø11.8 Farvannet (L5)

- **Fartsgrensene:** de statlige fartsgrensene for næringsfartøy fra Geonorge-datasettet. Lisensen og kilden sjekkes først. Ny `tools/fart/` lager `src/data/fart.json`. Er datasettet ikke åpent, gjelder V4 A.
- **I spillet:** grensene som lag i kartet. Autonav holder fartsgrensa, og varselet sier fra når spilleren er over. Aktsomhetsregelen (§ 2 i FOR-2021-04-19-1214) står i håndboka.
- **Sjømerkene:** sjekkes mot IALA region A (lateral, kardinal, toppmerkene og lyskarakteren) i `sjomerker-N`. Det som er galt, rettes i kartreleasen, som hører til Ø13. Varselet fra Ø11.1 får linjen «Du går på feil side av merket».
- **Ankringsforbudet** tas med hvis det finnes i data.
- **Stikkprøver:** Oslofjorden, Bergen, Bodø, Tromsø og Hammerfest.
- **Filer:**
  - Nye: `tools/fart/` og `src/data/fart.json`, med en linje i malen.
  - `core/05e-sjovei.js`, `core/05-vessels.js` (`sail`) og `core/16b-dyn.js`.
  - Kartlaget: `ui/03-map.js` og `ui/03a-chart.js`.
  - `docs/systemer/datarorledninger.md`.
  - Holder seg unna `tools/map/` og kartreleasen (Ø13).
- **Tester:** ny `farttest.py`, `charttest` og `autonavtest`.

### Ø11.9 Arbeidsavtalen (L7)

- **Avtalen:** skriftlig når noen mønstrer på (§ 3-1), med lott, stilling og båt i Mannskap-appen.
- **Prøvetid** inntil seks måneder (§ 3-2).
- **Oppsigelse:** fristene i § 5-2 og saklig grunn (§ 5-6).
- **Fristene er ekte tid** (felles klokke). En måneds oppsigelse er en måned. I dag sier mannskapet opp på noen døgn. Hvordan det skal virke i spillet, må avgjøres i fasen, og hvis det trengs, legges det fram som et valg.
- **Hviletiden** kommer ikke tilbake.
- **Filer:** `core/04-crew.js`, `core/14-crewlife.js` og `ui/phone/13-mannskap-bank-meld.js`.
- **Tester:** `selfcrew`, `crewtest` og `crewlifetest`.

### Rekkefølgen og de andre øktene

| Økt | Når | Kan ikke gå samtidig med | Grunnen |
|---|---|---|---|
| Ø11.1 | Først, etter H2e | Ø15, Ø9, Ø12, Ø7 | `05-vessels.js` (Ø15, Ø7 `npcStates`), `16b-dyn.js` (Ø9), `03-map.js` (Ø12 tar bort `DRIFTCTX`) |
| Ø11.2 | Etter Ø11.1 | Ø15, Ø9, Ø7 | `vessel3d.js` og `view3d/22-docks-air.js` (Ø15 N7), `16b-dyn.js` (Ø9), `10e-sound.js` (Ø7 har lyden i `gfxtest`) |
| Ø11.3 | Etter Ø11.2 | Ø9, Ø7 | `16b-dyn.js` og `16c-hull.js` (Ø9), `06-logbook.js` (Ø7) |
| Ø11.4 | Når som helst etter H2d (før, hvis Jonas vil) | Ø4 | Blender-skriptene og malen |
| Ø11.5 | Etter Ø11.4 | Ø5, Ø15, Ø4 | `10i-shop.js` (Ø5), `vessel3d.js` (Ø15), modellenes ankerplasser (Ø4) |
| Ø11.6 | Etter Ø11.5 | Ø12, Ø7 | `03-map.js`, `08-actions.js` (Ø12), `10e-sound.js` (Ø7) |
| Ø11.7 | Etter Ø11.6 | Ø7, Ø8 | `ui/phone/` (Ø7), dragingen (Ø8) |
| Ø11.8 | Etter Ø11.1 | Ø13, Ø12 | Sjømerkene og kartet (Ø13), `03-map.js` (Ø12) |
| Ø11.9 | Til slutt | | Bare mannskapsfilene |

- **H2:** Ø11 starter når H2e er ute. Da eier H2 ikke lenger `02-species-gear.js`, `05-vessels.js`, `13-work.js`, `04-crew.js`, `09-landing-deck.js`, `10-gear.js` og `09j-kystvakt.js`.
- **Ø10 (regelmotoren):** ingen felles filer. Ø11 trenger verken `03e-rules.js`, `03d-quota.js`, `rules.json` eller `09j-kystvakt.js`, fordi Kystvakta ikke ser på sjøfarten (V1 A, V3). Ø10 og Ø11 kan gå samtidig. Linjen «Filer» under Ø11 i øktplanen er rettet etter dette.
- **Ø15 (NPC-flåten):**
  - N8 bygges i Ø11.1 og Ø11.2, og strykes i Ø15.
  - De nye typene fra N3, N4, N5 og N7 får bare klassen sin (`colregCls`), lengden og lanternene i modellen. Store skip i ei lei får «hemmet av dypgående».
  - Ø15 og Ø11.1–Ø11.3 og Ø11.5 går ikke samtidig. Den som kommer sist, fletter.
- **Ø17:** hver fase legger nye tester i `COVER` i `tests/run.py`. Det er små endringer, men de flettes forsiktig mens Ø17 kjører.

## 7. De nye valgene (V7–V11)

**V7 Dagsignalene i 3D.** Jonas sa 28.10.2026 at signalfigurene ikke lages som utstyr, og at L3 skulle avgjøre om dagsignalene skal synes likevel.
- **A (anbefalt):** de vises på alle båter når de gjelder. Det er kjeglene ved fiske, kula ved anker og to kuler ved motorstopp og drift, laget i koden som enkle svarte former i riggen, uten Blender-modell. *Om dagen er kjeglene det eneste som viser at en båt fisker og har forrang etter regel 18, så spilleren kan lære vikeplikten av det hun ser.*
- B: de vises ikke. AIS-kortet sier hva båten gjør.

**V8 Det verste som kan skje ved mann over bord.**
- **A (anbefalt):** ingen dør. Vesten holder personen oppe. Kommer ikke båten tilbake i tide, henter redningsskøyta eller helikopteret personen. Vedkommende er sykmeldt noen dager og kommer tilbake. *Spilleren får spenningen og handlingene (alarm, merke, sving, livbøye, leider) uten et tap som føles som straff.*
- B: som i livet. Den som ikke blir funnet i tide, omkommer, og navnet kommer på en minnetavle ved mottaket (`docs/forslag.md`).
- C: ingen mann over bord i spillet, bare nestenulykker i dagboka.

**V9 Nødstoppen på haleren (SK4).** Ingen forskrift krever den.
- **A (anbefalt):** en sjelden hendelse under draget. Et mannskap henger seg fast i lina eller garnet, den røde knappen lyser, og spilleren har noen sekunder. Trykker hun i tide, blir det en nestenulykke i loggen. Kommer hun for sent, blir personen skadet (etter V8). Det skjer aldri i Første tur. *Det gir spilleren noe å gjøre midt i draget, og det er sjelden nok til ikke å mase.*
- B: nødstoppen er bare en detalj på haleren. Mannskapet bruker den selv, og det står som nestenulykke i loggen.

**V10 Senderen på vesten (PLB eller AIS-MOB, SK1).** Den er ikke påbudt.
- **A (anbefalt):** valgfritt utstyr i utstyrsbutikken (redning), festet på vesten. Ved mann over bord viser plotteren personen med en gang. *Det er ekte utstyr som letter en ekte friksjon, kjøpt for spillpenger, og etter V6 A selger butikken det som er valgfritt.*
- B: alle vestene har den, og den følger med båten.
- C: ikke med.

**V11 Kurset og øvelsene (SK5).** § 45 (6) i FOR-2013-11-22-1404 krever øvelse hver tredje måned og når over en tredjedel av mannskapet er byttet. Kurset står i kvalifikasjonsforskriften § 8 (4).
- **A (anbefalt):** kurset tas for gitt (alle har det, slik de hadde papirene). MOB-øvelsen er en kort ting spilleren kan gjøre i havna eller på feltet: kast dukken, sving og ta den opp. Mannskapet som var med, tar et ekte mann over bord raskere. Øvelsen gjelder til mannskapet byttes, ikke etter klokka. *Spilleren lærer hendelsen før den kommer, og ingenting tærer mens hun er borte.*
- B: som forskriften. Øvelse hver tredje måned med påminnelse i telefonen, og uten øvelse går det tregere.
- C: ingen kurs eller øvelser i spillet.

## 8. Det som er antatt eller usikkert

- **SK1–SK6** er tolket fra én linje i backloggen. Det finnes ikke noe mer.
- **Lovdata:** sjøveisreglene 20–37 med vedleggene, sjøloven, skipssikkerhetsloven fra § 28 og kapittel 7–10 i FOR-2000-06-13-660 er lest bare som sammendrag. De leses ordrett i fasen som bygger dem. Sjøloven §§ 131 og 445 er ikke lest. Radiotabellen i § 68 er flatet ut på Lovdata, så kolonnene er tolket.
- **Kurven** under 20 m (regel 26) er ikke bekreftet i den norske teksten.
- **Nådde vi ikke:** `sdir.no`, `kystverket.no`, `geonorge.no` og `nkom.no`. Ulykkestallene og kurslengden kommer fra søk, ikke fra sidene selv. Datasettet med fartsgrensene er funnet i Geonorges testkatalog, og lisensen er ikke sjekket. Formen på kjenningssignalet er fra Store norske leksikon. Ø11.8 trenger `geonorge.no` åpnet i nettverksinnstillingene, eller en arbeidsflyt som henter datasettet.
- **FOR-2021-12-16-3622** (de statlige fartsgrensene) er ikke lest, og den endres om lag to ganger i året.
- **Fartsområdene:** antatt som før. Kystfiske under 15 m, bankfiske I for kyst21 og havfiske for havbåtene.
- **Om en forskrift unntar fiskefartøy under 24 m** fra deler av skipssikkerhetsloven (§ 2 tredje ledd), er ikke sjekket.
- **Skyldfordelingen** avgjøres i virkeligheten av en domstol. Spillet bruker en enkel regel ut fra vikeplikten.
- **Vikingen er lokal** (npc-flåten 4 A). To spillere nær samme NPC-båt kan se den vike ulikt. Det er godtatt med valget.
- **Ytelsen** til avviket og `colregSit` med flere hundre båter innen 15 km i Lofoten i mars er ikke målt.
- **Hyppigheten** av mann over bord og nødstopp er et spillvalg, ikke et tall fra statistikken. Den må måles i spilltest.
- **At skipperen ikke går over bord,** og at det ikke skjer når hun er alene, er et designvalg. De fleste som omkommer i virkeligheten, er alene om bord (5.10).
- **En nødstopp på haleren** er god praksis, ikke et krav i forskriftene som ble lest. Arbeidstilsynets regler for arbeidsutstyr om bord er ikke søkt i.

## 9. Det planen ikke gjør

- Ingen bøter, forelegg, overtredelsesgebyr eller kontroll av sjøfarten (V1 A). Kystvakta ser bare på fiskeriet.
- Ingen sjekkliste og ingen sperre for utstyret (V3).
- Ikke alkohol (V5 A), hviletid eller sertifikater som sperrer.
- Ingen nye fiskeriregler (Ø10) og ingen nye NPC-typer (Ø15).
- Ingen kartrelease. Sjømerkene rettes i Ø13.
- Ikke trafikkseparering, losplikt eller navigasjonsforskriften for spillerens båter.
- Ingenting som stopper tiden eller driften, og ingen følger når spillet er lukket (prinsipp 4).
- Andre spilleres båter skades aldri.
- Ingen død ved mann over bord, med mindre Jonas velger V8 B.

## 10. Status

- 05.11.2026: planen skrevet i Ø11a. Kildene er sjekket på Lovdata (kap. 5). `lover-og-regler.md`, SK1–SK6 og N8 er slått sammen i Ø11.1–Ø11.9. Venter på V7–V11 og «kjør på» for Ø11.1 når H2 er ute.
