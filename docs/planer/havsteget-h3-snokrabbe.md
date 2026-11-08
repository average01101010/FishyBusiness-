# Havsteget H3: snøkrabbe (plan, 06.11.2026)

Jonas 06.11.2026: «Neste økt i havsteget: H3, snøkrabbe. H2 (autolineren) er ferdig og rullet ut (H2e i 377b6c59). Arbeid på en egen gren fra arbeidsgrenen, og spør Jonas før noe rulles ut.» Oppgaven: «Lag planen for H3 … slik H2 fikk sin», med det som finnes, regelverket sjekket mot kildene, driftstallene, fasene som egne økter med utrulling etter hver, og valgene som A/B/C med anbefaling. «Finn ut det du er usikker på før du spør. Ikke bygg noe før Jonas har svart.»

Valgene fra `havsteget.md` gjelder: V2 B og V3 A (03.11.2026: «Prisene må reflektere det virkelige liv, og tillatelsene må også være realitiske. Husk: vi lager en simulering av fiskerinæringen i norge, og da må vi være så tett opp mot realiteten som mulig»), V4 C (rammen er utvidet i H1b, så snøkrabbefeltene øst og ved Svalbard er i spillet), V5 A (lag med nøkkelfolk) og V6 A (automatisk med valg, hånda på rattet når man vil). Fra H2 gjelder også Jonas' «husk at vi må ha blendermodeller og animasjoner for hele operasjonen» (05.11.2026).

Planen bygger på H0 (mottakene og prisene), H1 (tillatelsen `krab`, 5.5b i `docs/systemer/kvoter-og-regler.md`), H1b (rammen, sonene og sokkelen i 5.28b, isen i 5.20f, havflåten på de nye feltene) og H2 (lagene, fabrikken, turen, lossingen på paller, havbåten i Driftsplan 2, havsjekken i 5.30b).

## 1. Hva som finnes i dag

Funnet i koden og i en sonde mot kjernen (`node tests/unit/run.mjs`, midlertidig, ikke lagt inn) 06.11.2026.

**Båten** (`core/02-species-gear.js` `VESSELS.snokrabbe`, modellen `tools/boats/krabbe50.py`): 50 × 11 × 6 m, 1 800 t, 3 600 hk, 11/13,5 kn, fryserom 900 m³ og 500 t (`hold:{kind:'frys'}`), 350 m³ drivstoff (400 l i timen), `crew` seks nøkkelfolk, dekk 4 og fabrikk 4 i to skift (`rot:2`), 18 køyer, `rigs:['teiner']`, `gearMax.teine` 7 000, `mottak:['Konvensjonelle']`, 60 M (bygd 2001), `lock:true`. Ingen `freezeT`, `plantLph`, `gutMachine` eller `priceNew`. Modellen har portalen for teinene på styrbord side med transportbåndet akterover, knekkbomkranen, en høy kran, rennen for teinene på styrbord hekkhjørne og teinestabler på dekket (ankrene `hauler` og `deck`).

**Tillatelsen** (`core/03d-quota.js` `HAVLIC.krab`): Snøkrabbetillatelse, `q26:{snokrabbe:351}` (fartøykvoten 2026), gruppa 12 336 t, 2027 skalert med 16 594/12 336 (`HAVF_SP`), så 472 t per tillatelse. `HAVKF.krab` 1, men `havOffer` gir også snøkrabbetillatelsen en kvotefaktor på 0,6–1,4, selv om alle tillatelsene har samme kvote. Registeret `HREG.krab` er 34 (regnet ut: 12 036 / 351; det rette er 30, kap. 2). Kvoteprisen `HPK.snokrabbe` er 712 kr/kg (260 × 115/42, uten kilde), så kvoten er verdt 250 MNOK i 2026 og 336 MNOK i 2027; båten med ukas tillatelse kostet 282 MNOK i sonden. Kjøpet (`havLicWhy`, `havLicTake`, blad B) virker som for autolineren, men `lock` stopper det.

**Teinene** (`core/10-gear.js`): bare kongekrabbeteina (`POTS.big`, firkantet, 1,4 × 1,4 × 0,65 m i modellen `tools/gear/teine.py`, 2 200 kr, 40 krabber). `soakHour` for teiner gir bare kongekrabbe (`density('krabbe')`, `kingArea`, `KC`) og litt torsk og brosme (`SELQ.teine`); halve fangsten etter om lag 20 t, krabben dør etter 48 t. Setting 0,9 og trekking 1,2 min per teine med haler. Ingen lenker, ingen konisk teine, ingen sortering av hunner og små, ingen koking.

**Arten** (`SPECIES.snokrabbe`): `npc:true` (bare havflåten fanger den), `shell:true`, `size:[0.6, 0.3]`, `dep:[250, 0.6]`, prisen per måned fra sedlene 2025 (94,5–136,8 kr/kg rund vekt, det er prisen for fryste klør), én klasse, `minKg:0`, `uh:1`. Beskatningen er anslått (`03g-trykk.js` `harv.snokrabbe` 0,2).

**Utbredelsen** (`core/03f-fiske.js` `MIG.snokrabbe`): en boks nord for 72,4° N og øst for 26,5° Ø, uten dybde, sone eller sokkel. Sedlene i `fiske.json` har snøkrabben bare per hovedområde (15, 24, 23), ikke per lokasjon.

**Feltene og sonene** (H1b, 5.28b): sokkelen (`ruShelf`) og sonene (`ruSea`) finnes. Rutenettet i sonden (mars 2027) viser norsk sokkel i fiskevernsonen og i den vestre delen av Smutthullet, russisk sokkel øst for avgrensningslinja, og isen over 40 % (`SEA_ICE_LIM`) nord for om lag 76,5–77° N.

**Reglene** (`core/03e-rules.js:337`, `sk0`–`sk4`, J-237-2025): tillatelse kreves, forbudt innenfor 12 nm (også ved Svalbard og Jan Mayen), forbudt på andre lands sokkel, stengt 1.7–30.11 med teinene på land, og en tekst om fartøykvoten 351 t (pluss 82 t levende) og høyst 20 % bløtkrabbe. **Finnes ikke:** høstingsforskriften § 27, minstemålet, sorteringen av undermåls og hunner, teinetaket, krav til teina, røkting og telling mot kvoten (`landConf` kjenner ikke snøkrabben).

**Havflåten** (`core/05d-hav.js`, `havflaate.json`): 17 NPC-snøkrabbefartøy (`teine`, modellen `snokrabbe`) på 12 felt (h24, h15, h23 og h03), turer på 14–28 døgn og 2–4 døgn i havn, seks lenker side om side. **Tre av feltene er ulovlige for et norsk fartøy:** h24 ved 76,49° N 38,66° Ø ligger i russisk sone, h15 ved 74,20° N 39,75° Ø på russisk sokkel i Smutthullet (`sk2`), og h03 ved 71,03° N 29,03° Ø innenfor 12 nm (`sk1`).

**Mottakene** (`core/06b-coastports.js`, `mottak.json`): fem av spillets havner har snøkrabbe i sedlene: Båtsfjord (1 105 t), Honningsvåg (330 t), Vardø (306 t), Senjahopen (135 t) og Kjøllefjord (53 t). Med kairegelen (`portWhy`: 90 % av kaia minst 52 m, dybde minst 6,5 m) passer bare Båtsfjord, Kjøllefjord og Senjahopen. Regelen for redskapet (`mottak:['Konvensjonelle']`) gjør at 19 av 174 havner tar båten, de fleste uten å ha tatt imot snøkrabbe. **De største mottakene er ikke havner:** de nøytrale fryselagrene («Annet anlegg» i kjøperregisteret) i Båtsfjord (F9175) og Tromsø (T9211, TF9199), og anleggene i Ålesund (2130) og Kinn (SF9102), tok 99 % av den fryste snøkrabben i 2025 (kap. 2b), men `PORTS` tar bare «Ordinært anlegg» og «Kaiselger».

**Lotten** (`core/04-crew.js` `OPPG.snokrabbe`): § 20, 35 % flatt, valgt for teiner fra 28 m (`fisheryOf`).

**Driftsplan 2** (`core/06g-plan2.js`, `06h-plan2-engine.js`): teiner som stasjoner med ståtid 18–96 t (standard 48), for kongekrabben. Havbåtens sløyfe døgnet rundt (H2c, `D.auto`) kjenner bare autolina.

**Kystvakta** (`core/09j-kystvakt.js` `kvHavCheck`): havsjekken er laget for autolina (§ 26, § 32, sei, lange, brosme, § 47 og § 49). Den kjenner teiner bare som redskap i posisjonssjekken.

**3D:** NPC-snøkrabbefartøyene setter og trekker lenker (`NPCGEAR`). Spillerens teiner tegnes med kongekrabbeteina over davit og haler; portalen på snøkrabbefartøyet er skrog uten bevegelse.

## 2. Regelverket

Lest 06.11.2026 av en agent og kontrollert i økta. Kilde og om teksten er lest eller bare sett i et søkeutdrag, står ved hvert punkt. Lovdata stopper `curl` herfra, så Lovdata-tekstene er lest gjennom et nettleserverktøy som gir setningene som utdrag; ordlyden bør stikkprøves før den siteres i spillet. Fiskeridirektoratets sak 17/2026 og vedlegg 3f er lastet ned og lest ordrett.

**Reguleringen for 2026** (J-237-2025, «Forskrift om regulering av fangst av snøkrabbe i 2026», fastsatt av NFD 19.12.2025, gjeldende 1.1.–31.12.2026, fiskeridir.no/yrkesfiske/j-meldinger/J-237-2025, lest):

- **§ 1:** «Det er forbudt for norske og utenlandske fartøy å fangste snøkrabbe i norsk sjøterritorium og indre farvann, … og på den norske kontinentalsokkelen i 2026» (unntatt etter §§ 2–4), og «For norske fartøy gjelder forbudet også på andre lands kontinentalsokkel.» Spillet har dette (`sk1`, `sk2`).
- **§ 2:** «… fangste og lande inntil 12 336 tonn snøkrabbe utenfor territorialfarvannet i 2026.» Av dette er 2 460 t (20 %) satt av til levering av levende snøkrabbe og 300 t til forsknings- og forvaltningsformål. Kvotefleks på totalkvoten: inntil 10 % kan belastes eller godskrives året etter.
- **§ 3:** «Fartøy med snøkrabbetillatelse kan fangste og lande en fartøykvote på 351 tonn.» Fiskeridirektoratets sak 17/2026: 351 t «innebærer 10 % overregulering fra starten av året», og «I 2026 ble fangsten kun regulert med garanterte fartøykvoter» (ingen maksimalkvote). Ordet «garantert» står i regjeringens pressemelding 19.12.2025 (utdrag), ikke i forskriften.
- **§ 4:** i tillegg «en garantert kvote på 82 tonn til levering av levende snøkrabbe» for fartøy som er egnet og utrustet for det (sak 17/2026: alle de 30 fikk den). Landingene føres med kvotetype 15, «Tilleggskvote». Det stemmer med sedlene (kap. 2b).
- **§ 5:** «Det er forbudt å drive fangst av snøkrabbe og å ha snøkrabbeteiner i sjøen … i perioden fra og med 1. juli til og med 30. november.» «Det er ikke tillatt å ha mer enn 20 % innblanding av bløtkrabbe i fangst etter snøkrabbe»; over det skal fangsten stoppes, fartøyet skifte felt og innblandingen meldes til Fiskeridirektoratet. Direktoratet kan forby fangst i perioder og områder av biologiske hensyn. Spillet har stengingen (`sk3`) og bløtkrabben som tekst (`sk4`).
- **§ 7:** «Kvantumet som kan fangstes av det enkelte fartøy kan ikke overføres til annet fartøy», og fangst tatt om bord kan ikke overføres.

**Forslaget og kvoten for 2027:**

- **Totalkvoten er fastsatt:** «Nærings- og fiskeridepartementet har fastsett totalkvoten for snøkrabbe i 2027 til 16 594 tonn», og «Minstemålet på 95 mm skalbreidde blir vidareført i 2027» (regjeringen.no, «Snøkrabbekvoten aukar i 2027», 28.10.2026, utdrag). Det er HIs kvoteråd (Rapport fra havforskningen 2026-54, 19.10.2026, lest), som også anbefaler å stenge fra 1. juli til 31. desember (et råd, ikke en regel).
- **Fiskeridirektoratets forslag** (reguleringsmøtet 4.–5.11.2026, sak 17/2026 «Regulering av fangst av snøkrabbe i 2027», lest ordrett): 10 % overregulering videreføres ikke; kvotefleks på fartøynivå (inntil 10 % av fartøykvoten belastes eller godskrives året etter) fra årsskiftet 2027/2028; levende levering videreføres med 20 % avsetning. Regneeksemplet (ikke vedtatt): «Den ordinære fartøykvoten vil utgjøre om lag 430 tonn og tilleggskvoten om lag 110 tonn.» Videreført: 20 % bløtkrabbe med skifte av felt, rapportering, «Utkastforbud for død og døende snøkrabbe og all snøkrabbe over minstemål», og fredningen 1.7.–30.11. Den endelige forskriften kommer rett før årsskiftet.
- **Sak 17/2026 om flåten:** tre typer fartøy, «Fartøy som leverer levende, fartøy som leverer fryst, og kombinasjonsfartøy». I 2026 (til 30.09) er 11 409 t tatt, 6 760 t fryst og 4 649 t levende; over 30 % av krabben på ordinær kvote er levert levende; 79 % er landet i Finnmark, 18 % i Troms, 2 % i Møre og Romsdal og 1 % i Vestland. I 2025 ble totalkvoten (12 019 t etter fratrekk) overfisket med om lag 1 396 t.

**Deltakelsen** (konsesjonsforskriften FOR-2006-10-13-1157 kap. 6, lest):

- **§ 6-1:** «Fiskeridirektoratet tildeler tillatelse til fangst av snøkrabbe i Barentshavet med teiner (snøkrabbetillatelse).»
- **§ 6-2** (endret ved FOR-2024-05-24-833, virkning 1.1.2025): eieren må ha fangstet snøkrabbe med fartøy med tillatelse i to av årene 2020–2022 innen 16. mai, fartøyet må stå i merkeregisteret og være «egnet og utrustet for fangst av snøkrabbe med teiner i Barentshavet». Ingen lengdekrav.
- **§ 6-3:** «Det kan bare deltas på annen stats kontinentalsokkel når det foreligger eksplisitt samtykke fra den aktuelle staten.»
- **Antallet:** «70 fartøy hadde en slik tillatelse i 2024», og etter de nye vilkårene fra 2025 «fikk 30 fartøy tillatelse til å delta» (sak 17/2026). **Spillet har 34** (`HREG.krab`, regnet ut); det rette er 30. 9 576 t ordinær kvote delt på 30 og ganget med 1,1 er 351 t, og 2 460 / 30 er 82 t.
- **Omsetning:** ingen strukturkvoteordning for snøkrabbe er funnet, og kap. 6 sier ingenting om overføring (§ 1-4 har bare det generelle kravet ved salg for fortsatt drift). Usikkert.
- Den gamle forbudsforskriften (FOR-2014-12-19-1836) er opphevet fra 1.1.2025 og erstattet av de årlige forskriftene (J-259-2024 for 2025, J-237-2025 for 2026).

**Høstingsforskriften** (FOR-2021-12-23-3910, lovdata.no/forskrift/2021-12-23-3910, lest):

- **§ 27 første ledd:** «Det er forbudt for fartøy over 21,5 meter å fangste med teiner etter kongekrabbe eller annen krabbe innenfor 4 nautiske mil … fra grunnlinjene langs norskekysten fra grensen mot Sverige til grensen mot Russland.» **Annet ledd:** «I perioden fra og med 1. november til og med 31. mars er det forbudt for fartøy over 21,35 meter å fangste med teiner … etter kongekrabbe eller annen krabbe innenfor 6 nautiske mil fra grunnlinjene i Finnmark.» Tredje ledd: dispensasjon for taskekrabbe, ikke i Finnmark. For snøkrabben går J-237-2025 lenger (bare utenfor territorialfarvannet), men § 27 gjelder kongekrabbeteinene, og ingen av spillets kystbåter er over 21,35 m (kyst21 er 21 m); snøkrabbefartøyet kan heller ikke rigges for kongekrabbe.
- **§ 28 tredje ledd:** «Snøkrabbe kan kun fangstes med teiner.» «Hvert fartøy kan fangste med maksimalt 8 000 teiner.» Spillet har 7 000 teiner som plass om bord (`gearMax.teine`).
- **§ 18:** «Teiner som brukes til fangst av snøkrabbe skal røktes minst én gang hver tredje uke», og «Det enkelte fartøy må røkte sine egne teiner.»
- **§ 25 annet ledd b:** posisjonen for snøkrabberedskap «skal rapporteres minst en gang hver tredje uke etter setting».
- **§ 29 tredje ledd og vedlegg 3f** (i kraft 1.1.2024, PDF lest ordrett): «Alle teiner som benyttes til fangst av snøkrabbe skal ha rømmingshull som holdes lukket med bomullstråd.» Tråden høyst 5 mm, hullet så stort at «en sylinder med minimum 20 cm i diameter» går gjennom, nedre kant 10–40 cm over bunnrammen. Det er hullet som åpner seg når teina blir stående tapt (spøkelsesfiske), ikke en fluktåpning for småkrabbe: HI skriver at «Det er i dag ikke krav til teineutforming, fluktåpninger eller minste maskeåpning i snøkrabbeteiner» (Rapport fra havforskningen 2026-55, lest).
- **§ 46:** «Taskekrabbe og snøkrabbe skal måles over skallets største bredde.» **§ 47:** snøkrabbe 9,5 cm.
- **§ 51:** «All fangst av snøkrabbe over minstemål skal føres i land», og unntaket for død eller døende fangst gjelder ikke snøkrabbe (sist endret FOR-2025-12-22-2946, i kraft 1.1.2026).
- **§ 66 tredje ledd:** «Alle teiner som benyttes til fangst av snøkrabbe skal være tydelig merket med fartøyets registreringsmerke.» § 68 (bøyestang, flagg og lys utenfor grunnlinjene) gjelder garn og line, ikke teiner særskilt.
- **Hunnkrabben:** ikke noe forbud funnet i forskriften. HI skriver at «eggbærende hunnkrabber skal gjenutsettes» uten å oppgi hjemmel. Hunnene blir sjelden 9,5 cm brede, så minstemålet tar dem i praksis (sjekkes mot HI i H3a).

**Svalbard og Smutthullet:**

- Høstingsforskriften gjelder også «i fiskevernsonen ved Svalbard» og «på den norske kontinentalsokkelen» (§ 1 annet ledd, lest). J-237-2025 er blant annet hjemlet i svalbardloven, men nevner ikke Svalbard i teksten. At Svalbards territorialfarvann (12 nm) er stengt, er tolket ut av «utenfor territorialfarvannet» (spillet har det i `sk1`).
- **Høyesterett** (HR-2023-491-P, 20.3.2023, SIA North Star Ltd. mot staten, Lovdata, lest): «Min konklusjon er etter dette at rederiet ikke har rett til fangst av snøkrabbe» (avsnitt 227); «territorial waters» i Svalbardtraktaten omfatter ikke kontinentalsokkelen utenfor Svalbard, og snøkrabben er «en såkalt sedentær art» (avsnitt 24, om HR-2019-282-S). Snøkrabben på sokkelen ved Svalbard er altså Norges, og bare norske fartøy med tillatelse kan ta den.
- **§ 58:** høsting er forbudt 20 nm rundt Bjørnøya, 15 nm vest av Spitsbergen sør for 77° 30′ N og 20 nm nord for 77° 30′ N vest for 14° Ø, unntatt reketrål og skjellskraping (spillet har det, `sv58`). Områdene for sårbare økosystemer stenger teiner også (`vme`); J-61-2019 er ikke lest.
- **Smutthullet:** «fra og med 2017 ikke lenger mulig for de norske fartøyene å fangste på russisk sokkel i Smutthullet» (sak 17/2026). Russisk minstemål er 100 mm (HI 2026-55).

**Ikke lest, eller usikkert:**

- FOR-nummeret til J-237-2025 og forskriften for 2027 (kommer i desember).
- Om tillatelsen kan omsettes eller struktureres.
- Et rettslig forbud mot hunnkrabbe; krav om koking om bord; et forbud mot å ha død krabbe om bord; ERS og VMS for snøkrabbe; Kystvaktens egne kontrollpunkter.
- Innholdet i J-61-2019 (sårbare økosystemer ved Svalbard) og om § 58 har tidsgrenser.
- Regjeringens pressemeldinger er bare lest som søkeutdrag (regjeringen.no ga 403 herfra).

## 2b. Driftstallene

### Fra sluttsedlene (regnet ut 06.11.2026)

Kilde: Fiskeridirektoratets fangstdata (sluttsedler) for 2024, 2025 og 2026 (til og med oktober), `register.fiskeridir.no/uttrekk/fangstdata_<år>.csv.zip`, NLOD, lastet ned og regnet ut 06.11.2026. Alt er norske fartøy med teiner.

| | 2024 | 2025 | 2026 (jan–jul) |
|---|---|---|---|
| Rund vekt | 10 463 t | 13 415 t | 11 410 t |
| Fartøy med over 20 t | 20 | 28 | 28 |
| Levende | 237 t (2 %) | 3 337 t (25 %) | 4 508 t (40 %) |
| Klør, kokt og fryst om bord | 10 226 t | 10 078 t | 6 760 t |
| Tilleggskvote (levende) | – | 925 t | 1 512 t |
| Fangstverdi | 720 MNOK | 1 479 MNOK | ikke i fila ennå |

- **Feltene:** hovedområde 24 Storbanken (76,5–78,5° N, 31–39° Ø) og 15 Sentralbanken (74,5–75,5° N, 31–39° Ø), litt ved Hopen (23) og 131 t i område 27 i 2026. Lokasjonene med mest: 24-02 (76,5° N 33° Ø), 24-03, 24-01, 15-03, 15-04 og 15-05 (74,5° N 33–37° Ø). **Sonene:** fiskevernsonen ved Svalbard 85–91 %, Smutthullet 3–9 %, Norges økonomiske sone 1–8 %.
- **Sesongen:** landingene går fra desember til juli: 2025 januar 2 056 t, februar 2 693, mars 3 538, april 2 576, mai 807, juni 427, juli 128 og desember 745 t (åpner 1.12). I 2024 var kvoten tatt i mars.
- **To driftsformer** (2025; 2026 i parentes):
  - **Klør, kokt og fryst om bord:** median 107 t rund vekt per landing (99), kvartilene 57–168 t (64–148), **20 døgn mellom landingene** (19), kvartilene 15–28 (12–24), 22 om bord (23), fartøyene 47–78 m (median 47, 2026 52). Landes ved fryselagrene i Båtsfjord (66 %), Tromsø (27 %), Ålesund og Kinn. 16 fartøy bare fryst (8), 2 begge (9).
  - **Levende:** median 21 t per landing (28), **8 døgn mellom landingene** (9), 13 om bord, 3 døgn fra siste fangst til landing. Landes i Båtsfjord (F101), Vardø, Honningsvåg og Kjøllefjord. 10 fartøy bare levende (11).
- **Per fartøy:** 2025 om lag 600–720 t for de største, 2026 om lag 430 t for de fleste (fartøykvoten 351 t pluss tilleggskvoten 82 t for levende, kap. 2). 4–10 turer i sesongen.
- **Omregningen** fra klør (produktvekt) til rund vekt er **1,61** i 2024 og 2025 og **1,49** fra januar 2026. Levende krabbe er rund vekt. Kokt og fryst krabbe pakkes som «emballert», «konsumpakket», «i lås» og «½ blokk i kartong 25 kg», fryst og glassert.
- **Prisen** (beløp for fisker delt på rund vekt):
  - Klør 2025: januar 133, februar 133, mars 137, april 118, mai 91, juli 86 kr/kg rund vekt (214, 214, 219, 191, 143, 139 kr/kg produkt). 2024: 64–71 kr/kg rund vekt (104–114 produkt).
  - Levende 2025: januar 85, februar 90, mars 91, april 83, mai 79, juni 81, juli 70 kr/kg. Landingene i desember 2025 står uten beløp i fila.
  - 2026 har ingen beløp i fila ennå.
  - Spillets `pm` er prisen for klør i 2025 (rund vekt). Levende krabbe har ingen egen pris.
- **Mannskapet** (feltet «Besetning» på seddelen): 50–53 m med fryseri 21–29 om bord, 45–47 m med fryseri 20–24, de som leverer levende 7–13.

### Fra kildene (søkt 06.11.2026)

Lest av en agent og kontrollert i økta der teksten er lastet ned. hi.no og fiskeridir.no kunne leses; rafisklaget.no, fiskebat.no, fiskarlaget.no, nofima.no og regjeringen.no var stengt, så tallene derfra er søkeutdrag.

- **Teina** (HI, Rapport fra havforskningen 2023-51, Humborstad m.fl., «Utvikling av et miljø- og ressursvennlig teinefiske etter snøkrabbe», lest; høringsnotatet om merking og rømmingshull 15.06.2023, lest): konisk, stålramme og notlin, inngangen på toppen og tømming i bunnen; maskevidden om lag 135 mm, mest 130–140 mm (HI 2025-52, lest), noen rederier 140–150 mm. Mål, vekt og pris er ikke funnet.
- **Lenkene** (HI 2023-51 og 2023-61, lest): «Teinene blir oftest satt i lenker på 200 eller 400 stykker per lenke, og avstanden mellom enkeltteiner er typisk 25 meter», «i gjennomsnitt … 200 teiner per lenke». En lenke på 200 er om lag 5 km (utregnet); 8 000 teiner er 40 lenker à 200. Fartøyene «kan operere med opptil 9000 teiner og ståtid på inntil tre uker» (2023, før taket ble 8 000).
- **Ståtiden** (HI 2023-51, lest): forsøkslenka på et fartøy på 57,7 m ble satt og trukket 13 ganger på 99 fiskedøgn i 2021 (ståtid 3–17 døgn, snitt om lag 7,6) og 13 ganger på 147 døgn i 2022 (4–25 døgn, snitt om lag 11). Fiskebåt (høringssvar 2023, lest): de mest effektive røkter 9 000 teiner på under 5 døgn.
- **Trekkingen:** om lag 1 200 teiner i døgnet per båt (agnstudie fra Nofima og HI, utdrag), minst 1 800 etter Fiskebåts tall (utregnet). Farten i teiner i timen er ikke funnet (døgnet rundt blir det 50–75).
- **Agnet:** akkar er standard; i forsøket «Teinene ble egnet med 1 akkar delt i 2 biter» (HI 2023-51, lest). Agnstudien (utdrag) oppgir 0,7–2 kg per teine; agn, is, salt og emballasje er 3,1 MNOK per fartøy i året (lønnsomhetsundersøkelsen, under), som med akkar til om lag 30 kr/kg er nærmere 0,5–1 kg per teine (utregnet).
- **Fangsten per teine:** ikke funnet som tall per felt og måned (bare figurer hos HI). Utregnet av sedlene og undersøkelsen: om lag 8,3 t i døgnet i sjøen i 2024, så 4,6–6,9 kg per teine ved 1 200–1 800 teiner i døgnet. Teiner som hadde stått 1,5 år, hadde «et gjennomsnitt på 3 krabber per teine», 98 % levende (HI). Snittvekten per hann er ikke funnet.
- **Det som slippes:** undermåls 26–27 % (HI-toktet 2020 og en lenke etter 21 døgn), 11 % under 95 mm i en annen studie, opptil 50 % etter en skipper (HI 2023-51); skadde krabber over minstemålet 20 % i 2024 mot om lag 8 % året før (HI 2025-52). Svært få hunner blir 95 mm (Fiskeridirektoratet).
- **Feltene og dybden:** «nord og sør for Sentralbanken, i Svalbardsonen, i norsk økonomisk sone og i norsk del av Smutthullet» (HI 2025-52); forsøksfartøyet fisket ved 76° 10′–76° 31′ N, 33° 05′–37° 59′ Ø på **250–350 m** (HI 2023-51). Krabben kom først inn ved Gåsebanken.
- **Isen:** «drivis drar med seg teinelenken» og er «tidvis et stort problem» (HI 2023-51, lest); HI har prøvd en undervannsbøye mot tap i drivis. Drivisen kommer til feltet i starten av mars (høringssvar 2025, lest).
- **Kjøttfylden** er best februar–april (HI 2025-52).
- **Levende lagring:** under 5 °C, 30–34 ‰ og 25–50 kg krabbe per m³ (Nofima-veiledning 2016, utdrag). 4–5 mottak tar levende snøkrabbe (Fiskeridirektoratet).
- **Fabrikken:** ett fartøy har 35 om bord og en linje for inntil 20 t krabbeben i døgnet (Baird Maritime, utdrag). Andre kapasiteter er ikke funnet. Store ombordprodusenter har 30–40 om bord (Fiskebåt 2024, lest).
- **Lønnsomhetsundersøkelsen 2024, fartøygruppe 014 «Havgående krabbefartøy»** (Fiskeridirektoratet, tabell G 22, lest; 5 fartøy i utvalget av 14): 58,4 m, 38,5 år; driftsinntekter 52,5 MNOK; arbeidsgodtgjørelse til mannskapet 16,6 MNOK (31,5 % av inntektene; 43,6 % i 2023 og 34,5 % i 2022); drivstoff 4,9 MNOK; agn, is, salt og emballasje 3,1 MNOK; proviant 0,54 MNOK; vedlikehold 4,3 MNOK og redskap 2,7 MNOK; driftsresultat −3,7 MNOK; 99 driftsdøgn og 79 døgn i sjøen. Gruppa tok 9 181 t snøkrabbe (656 t per fartøy) og 2 000 t reker i 2024. Prisen i 2024 var halvparten av 2025.
- **Prisene** (Fiskeridirektoratet, sak 17/2025, lest): fryst 68,90 kr/kg i 2024 og 130,68 i 2025, levende 63,68 og 82,41 kr/kg (rund vekt). 2026 fram til uke 22: levende 71,23 kr/kg og fryste klør om lag 179 kr/kg produkt (Fishing Daily, utdrag; om lag 120 kr/kg rund vekt med 1,49, utregnet). Råfisklagets minstepriser er ikke funnet.
- **Lotten:** oppgjørsavtalens prosent for snøkrabbe er ikke funnet (Fiskebåt og Fiskarlaget var stengt). Spillets § 20 med 35 % står mot 31–44 % av inntektene i undersøkelsen.
- **Tillatelsens pris:** ikke funnet. Bokført verdi er 1,3 MNOK per fartøy (undersøkelsen), som er kostpris, ikke markedspris; tillatelsene ble tildelt etter fangsthistorikk (§ 6-2), ikke kjøpt.
- **Merkingen** (høringsnotatet 2023 og høstingsforskriften, lest): alle teiner har registreringsmerket siden 1.1.2024, på sideflaten i øvre halvdel; vak er ikke påbudt, men merkes om det brukes. Fiskeridirektoratet fant at «eiermerking kun i endene av teinelenkene ikke er tilstrekkelig». Plikten til å lete etter tapt redskap står i § 69.

### Isen på feltene (sonden og sedlene 06.11.2026)

- Spillets is er snittet for 1991–2020 (OSI-450-a, 5.20f i `vaer-og-hav.md`), og den stenger over 40 % (`SEA_ICE_LIM`). Sentralbanken (74,5–75,5° N) er åpen hele vinteren; Storbanken ved 76,5° N har 21–44 % i januar–april, og nord for om lag 77° N er havet stengt i mars.
- Sedlene viser fangst der: 2024 om lag 1 250 t ved 77,5° N (33–37° Ø) i februar–mars, 2025 om lag 300 t ved 78,5° N i april og 2026 330 t ved 77,25° N i februar–mars. Isen i spillet er altså mer enn i dag på den nordlige delen av Storbanken (valg V3).

## 3. Fasene

H3 deles som H2, i økter med `/lever` og utrulling etter hver (valg V5). H3d deles fra start i modellene og animasjonene, fordi H2d måtte deles.

### H3a Snøkrabben, teina, lenkene, fangsten og reglene

- **Hva:**
  - **Arten:** snøkrabben blir fiskbar for snøkrabbefartøyet (ikke for kystbåtene, som ikke kan ha tillatelsen). Hver krabbe som kommer opp, får kjønn, skallbredde i mm og vekt (lengde–vekt etter HI, kap. 2b) og om den er bløt (nylig skallskifte, etter måned). Sorteringen på dekk: hanner fra 9,5 cm beholdes (§ 47, § 46 måler over største bredde), resten settes ut levende; bløtkrabbe telles mot 20 % i fangsten (J-237-2025 § 5; over det: skift felt). Død krabbe og alt over minstemålet skal i land (§ 51).
  - **Utbredelsen:** `MIG.snokrabbe` (boksen) byttes mot sedlene per lokasjon og måned 2024–2026 (Storbanken, Sentralbanken, Hopen; kap. 2b), med dybden (250–350 m der forsøksfartøyet fisket, HI 2023-51) og bare på norsk sokkel. `tools/npc/fiske.py` tar lokasjonene for snøkrabben (bare den arten, så resten av `fiske.json` og kalibreringen er urørt).
  - **Teina:** en ny konisk snøkrabbeteine i `POTS` (maske 135 mm, inngangen på toppen, tømming i bunnen; mål, vekt og pris er ikke funnet og settes som antakelse) med rømmingshull lukket med bomullstråd (§ 29, vedlegg 3f) og merket med fartøyets registreringsmerke (§ 66). Agnet er akkar, én per teine delt i to (HI 2023-51), om lag 0,5–1 kg (utregnet). Den kan bare kjøpes til et fartøy med snøkrabbetillatelse (`buyGate`).
  - **Lenkene:** 200 teiner per lenke med 25 m mellom (om lag 5 km), satt over rennen akter og trukket gjennom portalen, med dregg og blåse i hver ende (HI). Taket er 8 000 teiner per fartøy (§ 28), altså 40 lenker; plassen om bord (`gearMax.teine`, 7 000 i dag) settes etter dekket. Trekkingen tar 1 200–1 800 teiner i døgnet (50–75 i timen døgnet rundt, utregnet; farten er ikke funnet).
  - **Fangsten:** `soakHour` for snøkrabbeteina med ståtid i døgn (3–25, snitt 7–11 hos HI), kalibrert mot sedlene og undersøkelsen: om lag 5–7 kg per teine, 8 t i døgnet i sjøen og om lag 100 t rund vekt per tur på om lag 20 døgn for et fryst fartøy. Av det som kommer opp, er om lag en firedel undermåls (HI), og bløtkrabben følger skallskiftet (måneden). Krabben lever i teina (98 % levende etter 1,5 år, HI), i motsetning til kongekrabben i dag; `takeStock` tar av bestanden. Snittvekten per hann (lengde–vekt) er ikke funnet og hentes fra HIs toktrapporter i økta.
  - **Reglene ved setting** (`rulesAt`, varsel før feil): § 1 og § 5 i reguleringen (sokkel, territorialfarvann, andre lands sokkel, fredningen med teinene på land 1.7–30.11) finnes; nytt er taket på 8 000 teiner (§ 28), røkting hver tredje uke (§ 18) og posisjonen hver tredje uke (§ 25) som varsler, og § 27 for kongekrabbeteiner på fartøy over 21,5 m (4 nm) og 21,35 m (6 nm i Finnmark 1.11–31.3), så regelen finnes om en større kystbåt kommer. Henvisningene oppdateres til forskriften for 2027 når den kommer.
  - **Kvoten (V4, «det som blir mest riktig, og passer spillet i et fremtidsperspektiv»):** reglene står per år som data (en tabell med totalkvoten, avsetningen til levende levering, forsknings- og forvaltningskvoten, overreguleringen og kvotefleksen fra hver J-melding), og fartøykvotene regnes av dem med de 30 tillatelsene, ikke skrevet inn som tall: 2026 gir 351 t pluss 82 t (J-237-2025), 2027 etter forslaget om lag 433 t ordinær kvote og 110 t tilleggskvote ((16 594 − 3 300 − 300)/30 og 3 300/30, sak 17/2026), uten overregulering. Forskriften for 2027 legges inn som en ny rad når den kommer i desember. Kvotefleksen på fartøynivå (inntil 10 % av fartøykvoten belastes eller godskrives året etter, fra 2027/2028) føres i lagringen. Etter siste kjente år følger totalkvoten spillets egen bestand, slik torskekvoten gjør (`STOCK`, `stockYear`, `tacOf`): snøkrabben får en bestand med HIs tall (indeksen fra toktene og rådet for 2027, Rapport fra havforskningen 2026-54) og beskatningen fra flåten, så kvoten går opp og ned med bestanden. Landingene går mot kvoten i rund vekt. Registeret får 30 tillatelser (`HREG.krab`), og alle har samme kvote (ingen kvotefaktor i `havOffer`).
  - **Kjøpet:** `lock` tas av snøkrabbefartøyet. Tillatelsen følger fartøyet ved salg for fortsatt drift eller utskifting (konsesjonsforskriften kap. 6, høringsnotatet 2023), så spilleren kjøper et brukt fartøy med tillatelsen fra en NPC-eier, som i dag (`havOffer`). Prisen er skroget pluss tillatelsen, og tillatelsen prises etter det driften kan bære (V6 B): driftsoverskuddet før avskrivninger for et snittfartøy med årets kvote og prisene (kostnadene fra lønnsomhetsundersøkelsen, gruppe 014; prisene fra sedlene over flere år, så 2024 og 2025 begge teller), ganget med et antall år som settes og begrunnes i økta. Det erstatter `HPK.snokrabbe` (712 kr/kg). Ingen salgspris er funnet, så tallet er et anslag og står som det.
  - **Mottakene (V2 C):** fangsten landes ved alle mottak der kaia passer etter regelen som finnes (`portWhy`: kaia, dybden og redskapsgruppa eller andelen fra 28 m og over), også der sedlene ikke har snøkrabbe. I dag er det 19: Skarsvåg, Kjøllefjord, Båtsfjord, Havnnes, Tromsdalen, Husøy, Senjahopen, Gryllefjord, Torsken, Andenes, Straumsjøen vest, Melbu, Napp, Nordfold, Selje, Avaldsnes, Ombo, Skudeneshavn og Egersund sør. Ingen nye havner. I H3a landes krabben hel og fryst som i dag (holdene fryser); fabrikken er H3b.
  - **Havflåten:** de tre NPC-feltene som er ulovlige for et norsk fartøy (russisk sone, russisk sokkel i Smutthullet, innenfor 12 nm) flyttes inn på norsk sokkel i sin lokasjon (`tools/npc/havflaate.py`).
- **Filer:** `core/02-species-gear.js`, `core/10-gear.js`, `core/03f-fiske.js`, `core/03e-rules.js`, `core/03d-quota.js` (`STOCK.snokrabbe`, reglene per år, kvotefleksen), `core/05d-hav.js`, `tools/npc/fiske.py`, `tools/npc/havflaate.py`, `src/data/fiske.json`, `src/data/havflaate.json`, `ui/08-actions.js`, `ui/10-gear-ui.js`, `ui/phone/10-fartoy.js`.
- **Tester:** ny `tests/unit/snokrabbe.test.mjs` (fangst per teine mot HI og sedlene, sorteringen, minstemålet, bløtkrabben, reglene, kvoten, registeret med 30), `rules.test.mjs`, `havlic.test.mjs`, `hav.test.mjs` (ingen NPC-felt utenfor norsk sokkel), `havsteg.test.mjs`, ny `tests/snokrabbetest.py` (kalibreringen på feltene, en lenke satt og trukket, reglene på stedet, skjermbilder i begge formater), `geartest`.
- **Måles:** kg per teine og per fiskedøgn på Storbanken, Sentralbanken og ved Hopen mot HI og sedlene, og andelen undermåls og bløt krabbe per måned.
- **Målt 06.11.2026** (H3a, `tests/snokrabbetest.py` med hele kysten, 7 døgns ståtid, punkter på 220–380 m der reglene tillater det, vektet etter sedlene per lokasjon; trekkefarten 1 469 teiner i døgnet med lagene om bord; sedlene: frosne turer 2024–2026, tonn mellom to landinger delt på dagene mellom dem minus tre for gange og lossing, median):

  | Felt | Dybde | kg per teine, februar | april | t per fiskedøgn, februar | april | t per turdøgn, modellen (4/5 av døgnene fiske) | Sedlene, t per turdøgn |
  |---|---|---|---|---|---|---|---|
  | Storbanken (24-01–05) | 283 m | 7,5 | 4,4 | 11,1 | 6,5 | 8,9 / 5,2 | februar 9,5 (19 turer), april 4,6 (5) |
  | Sentralbanken (15-03–05, 09, 10) | 254 m | 5,7 | 5,8 | 8,4 | 8,5 | 6,7 / 6,8 | februar 7,9 (17), april 6,7 (6) |
  | Ved Hopen (23-07, 23-15) | 251 m | 4,1 | 2,6 | 6,0 | 3,8 | 4,8 / 3,1 | februar 5,3 (3) |

  Over hele sesongen (desember–juni, alle lokasjonene med landinger, vektet etter kiloene, havet på 300 m i enhetstesten) gir en teine 5,8 kg beholdt etter 7 døgn, og en dag 8,5 t; 15 fiskedøgn av en tur på 20 gir om lag 125 t (sedlene: median 99–127 t per frossen landing, 19–20 døgn mellom). Én lenke på Storbanken i februar: 1 499 kg (7,5 kg per teine), 2 698 krabber beholdt (89 bløte, 34 døde) og 651 satt ut levende (554 hanner under 9,5 cm og 97 hunner). Undermåls er 18 % av hannene (HI: 11–27 %), bløt krabbe 3 % i februar, 14 % i juni og 30 % i august.

### H3b Drift om bord: fabrikken, levende krabbe, vaktene, turen og lossingen

- **Hva:**
  - **Fabrikken (klør):** sorteringen, delingen i to klør (seksjoner), kokingen, frysingen og glasseringen, pakket i kartong; kapasiteten er ikke funnet utenom ett fartøy på 20 t krabbeben i døgnet (35 om bord), så et 50 m fartøy får om lag 10–12 t produkt i døgnet (antatt, nok for 8 t rund vekt fangst). Rommet fylles av produktvekten, kvoten og prisen går på rund vekt (som V2 A i H2), med Fiskeridirektoratets faktor for året: 1,61 til 2025 og 1,49 fra 2026 (kap. 2b).
  - **Levende krabbe (valg V1):** tanker med gjennomstrømmende sjøvann; krabben holdes levende til levering (i sedlene om lag tre døgn fra siste fangst), dør etter hvert ellers. Tilleggskvoten (82 t i 2026, om lag 110 t i forslaget for 2027) gjelder bare levende levert.
  - **Prisene:** klør per kg rund vekt etter måned (sedlene 2025, som `pm` i dag) og levende med egen pris (sedlene 2025: 70–91 kr/kg), Råfisklagets minstepriser når de kan leses.
  - **Vaktene og lagene** (V5 A i `havsteget.md`): antallet om bord etter sedlene (kap. 2b: 21–29 på et 50 m fryst fartøy, mot 14 i spillet i dag), anonyme lag på dekk og i fabrikken i to vakter, med nøkkelfolkene fra H2.
  - **Turen:** om lag 20 døgn for fryst og 8–9 for levende (sedlene); drivstoff, agn, proviant og rom setter grensen, med kortet Turen fra H2b.
  - **Lotten:** § 20 for snøkrabbe med turoppgjøret som finnes. Prosenten i oppgjørsavtalen er ikke funnet; spillets 35 % sjekkes mot undersøkelsen (31,5–43,6 % av inntektene i 2022–2024) og mot avtalen om den kan leses.
  - **Lossingen:** fryste klør på paller (H2b); levende krabbe i kar med kran. Begge ved mottakene fra H3a (V2 C).
  - **Levende og fryst ved samme mottak (V2 C):** alle mottakene som tar båten, tar både levende krabbe og klør, med prisen etter måned og produkt (ingen pris per mottak).
- **Filer:** `core/05-vessels.js` (`holdFreezes`, tankene), `core/13-work.js`, `core/03-simulation.js` (`sell`, `capHold`), `core/02-species-gear.js` (prisene, båten), `core/03d-quota.js` (tilleggskvoten), `core/04-crew.js`, `core/07-harbours.js` (`landPlan` for levende).
- **Tester:** ny `tests/unit/krabbefabrikk.test.mjs` (omregningen, fabrikkfarten, tankene, tilleggskvoten, lossetiden, lotten), `selltest`, ny `tests/krabbefabrikktest.py` (to døgn der lagene fisker uten deg om bord, lossing av klør og av levende krabbe ved et mottak), `trip2`, `havsteg.test.mjs`.
- **Måles:** tonn per døgn og per tur, levende og fryst, mot sedlene; lotten per tur.
- **Funnet i økta 06.11.2026** (sedlene 2024–2026 lastet ned og regnet ut på nytt, en agent på fiskeridir.no og hi.no; resten søkeutdrag):
  - **Omregningen:** 1,61 i 2024 og 2025 og 1,49 fra 2026, rad for rad i sedlene (6 408 av 6 662 t klør i 2026 med 1,49).
  - **Død krabbe:** fra 2026 (utkastforbudet i § 51) står død krabbe på levendelandingene som «Rund», «Oppmaling»: 142 t mot 4 699 t levende, 2,9 % etter vekt (medianlandingen 2,1 %, tidelen med mest 9 %; januar 0,3 %, februar og mars 2,8–2,9 %, april 4,9 %, mai 3,7 %, juni 8,3 %), betalt 1 kr/kg (2025). Andelen øker ikke tydelig med turens lengde (4–16 døgn). Levendelandingene i 2026: median 32 t, 2–3 døgn fra siste fangst, 9 døgn mellom landingene, 13 om bord på 46,6 m; 29–32 % av den levende krabben på tilleggskvoten. 16 fartøy leverte både levende og fryst i 2025 og 13 i 2026.
  - **Levende etter størrelse** (2025, kr/kg): 800–999 g 93,2, 500–800 g 83,0, 350–500 g 79,0, under 350 g 79,2, usortert 55,8. Råfisklagets minstepriser fra 9.2.2026 (rundskriv 2/2026, søkeutdrag): 60, 50, 30 og 5 kr/kg, skadd 25, vrak fri; klør 80 kr/kg (A, glassert). Snittet i 2026: klør om lag 178,5 kr/kg produkt (uke 34, mot 209 i 2025) og levende 71,12 kr/kg (NRK 8.7.2026, mot 81,71); sedlene for 2026 har ikke beløp ennå.
  - **Fabrikken:** ingen norsk kapasitet; russiske krabbefartøy 30 t rå til 20 t produkt i døgnet (søkeutdrag); klørne 61–67 % av rund vekt (Sjømat Norge 2023, lest, og faktoren); glassering 7–12 %.
  - **Mannskapet:** Polar Pioneer (52 m) har plass til 32, Arctic Pioneer (45 m) og Kvitungen (47,5 m) 21; «to skift under sesongen, hvor mannskapet er 5 uker på og 5 uker av» (høringssvar 2023, lest). Lønnsomhetsundersøkelsen 2018 (gruppe 014): 32,2 fiskere og 21,2 årsverk per fartøy, mannskapet 37,7 % av inntektene.
  - **Ikke funnet:** dødelighet per døgn om bord, tankvolum per fartøy, lossefarten for levende krabbe, oppgjørsavtalen for snøkrabbe, drivstoff i liter for gruppe 014 (bare 4,9 MNOK; Fiskeridirektoratets sak 29a/2024: 0,9–3,0 l per kg fangst for gruppen i 2015–2022).
- **Målt 06.11.2026** (H3b, `tests/krabbefabrikktest.py` med hele kysten, februar 2027, Sentralbanken 74,8° N 34,6° Ø på 250 m, 30 lenker som har stått en uke, lagene trekker og setter ut igjen uten deg om bord; `tests/unit/krabbefabrikk.test.mjs`):

  | | Modellen | Sedlene |
  |---|---|---|
  | Fryst, per fiskedøgn | 5,7 t rund vekt, 3,8 t klør (1 200 teiner trukket og satt ut igjen) | 4,7–6,5 t per døgn mellom landingene (median 2024–2026) |
  | Fryst, per tur på 20 døgn (1,2 døgn gange hver vei, ett døgn lossing) | om lag 95 t rund vekt, 64 t klør | median 99–123 t per landing, 19–20 døgn mellom |
  | Levende, per fiskedøgn | 5,8 t i tankene | |
  | Levende, per tur på 8–9 døgn | tankene (40 t) fulle etter 6,8 fiskedøgn, om lag 35 t | median 32 t per landing, 9 døgn mellom (2026) |
  | Død i tankene ved levering | 2,9 % på en tur på ni døgn i februar, 4,8 % i juni (enhetstesten); 0,5 % på testens korte tur (to fiskedøgn og halvannet døgn til mottaket) | 2,9 % (2026), juni 8,3 % |
  | Fabrikken | høyst 12 t klør i døgnet; holdt følge med fangsten (draget aldri saktere) | |
  | Drivstoff | 5 470 l på et fiskedøgn; om lag 6 800 l i snitt med en femdel gange | 4,9 MNOK i 2024 (gruppe 014), ingen liter |
  | Lotten | to døgn med klør: 1,2 MNOK på seddelen, 315 000 kr til skiftet (14 300 kr per mann); en frysetur på 20 døgn om lag 119 000 kr per mann; den korte levendeturen 175 000 kr til skiftet | 35 % (§ 20) mot 31,5–43,6 % av inntektene 2022–2024 |

  Sluttseddelen for klørne i februar: 153 kr/kg produkt (103 kr/kg rund vekt); levende 800 g og over 82,7, 500–800 g 73,6, 350–500 g 70,0 kr/kg; død 1 kr/kg. Lossingen i Båtsfjord: 7,9 t klør på 8 paller; 11,6 t levende i 30 kar og en pall på 2,7 timer, alt levende på tilleggskvoten.

### H3c Snøkrabbe i Driftsplan 2, isen og fredningen

- **Hva:**
  - **Driftsformen:** feltet er mange lenker med ståtid i døgn; skipet går fra lenke til lenke, trekker den som har stått lengst, setter den ut igjen, døgnet rundt i vaktene, til rommet, kvoten, agnet, drivstoffet, provianten eller turens døgn sier stopp; så til mottaket (fryst eller levende) og ut igjen.
  - **Teinene står ute** mens skipet leverer, som i virkeligheten, men røktes minst hver tredje uke (§ 18) og posisjonen meldes (§ 25).
  - **Fredningen:** alle teiner på land før 1. juli (J-237-2025 § 5); planen tar dem inn i juni, og ingen setting før 1. desember.
  - **Isen (V3 B):** snøkrabbefartøyet får isklasse (`VESSELS.snokrabbe.iceClass`), så det kan gå i spredt drivis; isen ellers er som i dag (snittet for 1991–2020). I dag gjør en isklasse at isen aldri stenger (`seaIceShut`); den blir en grense for konsentrasjonen klassen tåler, som settes etter et søk (klassen og grensen er ikke funnet for snøkrabbeflåten). Teinene er ikke tryggere enn før: drivis over en lenke (`seaIceAt` langs lenka) stopper trekkingen, og drivisen kan dra lenka med seg (HI 2023-51), så teiner kan gå tapt eller flyttes. Planen setter ikke lenker i isen og tar dem inn når iskanten nærmer seg.
  - **Været:** havbåtens grenser fra H2c (arbeidsgrensen og ligge bi).
  - **Den felles klokka:** sløyfen spilles også når appen er lukket (`catchUp`).
- **Filer:** `core/06g-plan2.js`, `core/06h-plan2-engine.js`, `ui/05d-plan2.js`, `core/10-gear.js`, `core/03h-is.js` (isklassen som grense), `core/02-species-gear.js` (`iceClass`).
- **Tester:** `havplantest` (nytt scenario: en tur med snøkrabbe), `tests/unit/havplan.test.mjs`, `driftsplan2test`, `driftsplan2ui`, `is.test.mjs`, alene.
- **Måles:** at en tur på planen gir det samme som en tur for hånd (innenfor 15 %), og sesongen mot sedlene (tonn per fartøy, turer og døgn mellom landingene).
- **Bygd 07.11.2026** (grenen `ccr-5c109e47-twgn6s`, ikke rullet ut): «Snøkrabbefartøyet i Driftsplan 2» i `docs/systemer/driftsplan.md`, isklassen i 5.20f i `vaer-og-hav.md`, drivisen og tapet i 5.69 i `redskap.md`. Funnet og rettet underveis: siden og kartet prøvde snøkrabbefeltene mot reglene for kongekrabbe (`potSp`), `portBusy` regnet kaia som ledig mens pumpa gikk før EPOCH (1.3.2027), og reserven for veien inn (`tripLeft`) regnet med marsjfart mens planen går for full fart; skipet gikk tomt for diesel i sesongen. Jonas 07.11.2026 underveis: «På de store havbåtene skal forresten mannskapet kun gå døgndrift. Det skal ikke være et alternativ med dagdrift.» (regelen står nå på båtklassen, `p2Hav`).
- **Målt 07.11.2026** (`tests/havplantest.py` del 8–10 med hele kysten, `kart-31`; to felt à 20 lenker på Sentralbanken, 74,8° N 34,4° Ø og 74,9° N 35,2° Ø på 240 m, 25 km fra hverandre, fra Båtsfjord, frøet satt):

  | | Planen | For hånd / sedlene |
  |---|---|---|
  | Fire døgn ved lenkene i februar (40 lenker som har stått en uke) | 20,5 t rund vekt, 19 trekk | for hånd på de samme lenkene og døgnene 20,1 t, 21 trekk (2,3 %) |
  | Per fiskedøgn | 5,1 t | H3b for hånd 5,7 t (10,0 %) |
  | De samme døgnene spilt som `catchUp` (lukket) | 20,0 t | åpent 20,5 t (2,6 %) |
  | En frysetur fra Båtsfjord med lenkene stående (20 døgn) | 64–83 t rund vekt etter 21,7 døgn i tre kjøringer med samme frø (én tur varierer: i lukket spill kommer kartflisene inn på andre minutter); lenkene sto mens skipet leverte, og det gikk ut igjen | H3b-anslaget for hånd om lag 95 t på 20 døgn, uten været (12–32 % under); sedlene median 99–123 t, 19–20 døgn mellom |
  | Sesongen fryst, 4.1.–30.6.2027 (fartøykvoten 433 t, 476 t med fleksen) | 464 t på 8 landinger (median 74 t; 44, 79, 74, 92, 77, 55, 31 og 12 t), 21,5 døgn mellom landingene, 2 lenker tapt i været, alle teinene på land før 1. juli | sedlene: 99–127 t per landing, 19–20 døgn mellom, 4–10 turer, om lag 430 t per fartøy i 2026 |
  | Sesongen levende, samme feltene (og tilleggskvoten 110 t) | 446 t på 21 landinger (median 21,5 t, 26–34 t i februar–april), 8,3 døgn mellom landingene, hele tilleggskvoten tatt, ingen lenker tapt, alt på land før 1. juli (i hele `havplantest`: 420 t på 20, 22,8 t, 8,7 døgn; fryst 458 t på 7, 74,5 t, 22,0 døgn) | sedlene: median 21–32 t per landing, 8–9 døgn mellom, 2–3 døgn fra siste fangst til landing |

  Planen gjør det samme som hånda (2,3 %) og det samme lukket som åpent (2,6 %), og levendeturene treffer sedlene (8,3 døgn mellom landingene, 21,5 t per landing). Turene er mindre enn i sedlene (79 mot 99–127 t per landing): lagene trekker og setter ut igjen om lag 1 000 teiner i døgnet (H3b: 1 200, flåten 1 200–1 800), og en lenke gir om lag 1 t (5 kg per teine) på dette feltet, mot 5,7 kg i H3a for Sentralbanken. Det er H3a- og H3b-modellen, ikke planen; derfor tar sesongen kvoten først i juni, mens flåten tok den i mars–april (2024 stoppet 19. mars, 2025 maksimalkvotene 27. april). Isen kom ikke over feltene på Sentralbanken (5–10 % i middelet for 1991–2020).

### H3d1 Blender-modellene

Etter `/blender` og leselista for modellene; bare utsiden, ingen rom under dekk, og redskap som egne deler på ankrene (CLAUDE.md).

- **Snøkrabbeteina:** konisk teine (mål i kap. 2b) med inngangen på toppen, agnboksen og rømmingshullet med bomullstråden (vedlegg 3f), og stablet på dekket slik koniske teiner stables.
- **Snøkrabben:** hann og hunn i `tools/deck/fisk.py` (som kongekrabben), og klørne (seksjonene).
- **På dekket:** teinehaleren i portalen (egen del på ankeret `hauler`), sorteringsbordet ved portalen og rennen akter; portalen, transportbåndet og kranene er skrog og står.
- **Merkingen:** blåse eller bøye med registreringsmerket i endene av lenkene (§ 66).
- **Lasten:** kartongen med fryste klør (25 kg, `tools/deck/pall.py`) og karet for levende krabbe ved lossingen; lasteluka og ankrene for lossingen på `krabbe50.py`, som på autolineren.
- **Filer:** `tools/gear/teine.py` (eller ny `tools/gear/snoteine.py`), `tools/deck/fisk.py`, `tools/deck/pall.py`, `tools/boats/krabbe50.py`, `view3d/10-gear.js`, `view3d/09-landing-deck.js`, `src/data/*.b64`, malen.
- **Tester:** `vessel3d.test.mjs`, kontrollbildene fra Blender, ny `tests/h3dshot.py` (3D alene) og skjermbilder i begge formater.

### H3d2 Animasjonene

- **Settingen:** teinene går fra stablene langs transportbåndet til rennen og over hekken i båtens fart, med lina mellom og dregg og blåse i endene.
- **Trekkingen:** lina kommer inn gjennom portalen, teina løftes inn, åpnes og tømmes på sorteringsbordet, folkene sorterer (små og bløte over bord, hannene til fabrikken eller tankene), agnes og går akterover til stablene eller ut igjen.
- **Lossingen:** pallene med klør fra rommet med båtens kran (som H2d2), og karene med levende krabbe.
- **Tester:** `h3dshot` (3D alene), `haultest`, `landtest`, skjermbilder i begge formater.

### H3e Kystvakta, hele turen og stikkprøvene

- **Hva:**
  - **Kystvaktas havsjekk for snøkrabbe:** posisjonen langs hver lenke (sokkelen, 12 nm, russisk sokkel, § 58, sårbare økosystemer), fredningen (teiner i sjøen 1.7–30.11), taket på 8 000 teiner (§ 28), merkingen (§ 66) og rømmingshullet (vedlegg 3f), røkting og posisjonsmelding (§§ 18 og 25), fartøykvoten og tilleggskvoten, og en stikkprøve av siste trekk mot minstemålet (§ 47) og bløtkrabben (20 %, J-237-2025 § 5), og at alt over minstemålet og død krabbe er beholdt (§ 51).
  - **Hele turen** i `tests/havtur.py` (`havtur.py krabbe`): kjøp med tillatelsen, ut fra Båtsfjord, sett lenkene, la dem stå, trekk, kok og frys, hjem, lever ved fryselageret; og en levende tur.
  - **Stikkprøvene:** turer fra Båtsfjord og Kjøllefjord (nord), Tromsdalen eller Melbu (midt) og Selje eller Avaldsnes (sør), blant mottakene som tar båten (V2 C); skjermbilder i begge formater.
  - Patchnotes.
- **Tester:** `havtur`, `kystvakttest`, `kystvakt.test.mjs`.

## 4. Valgene

Hvert valg har en anbefaling og én setning om hvorfor. Valgene er tatt 06.11.2026 (Jonas: «V1: A», «V2: C», «V3: B», «V4: Gjør det som blir mest riktig, og passer spillet i et fremtidsperspektiv.», «V5: A», «V6: B»).

**V1 Levende eller fryst krabbe** (valgt: A, Jonas 06.11.2026)
- **A (anbefalt): begge, som kombinasjonsfartøy:** fryseriet for klør og tanker for levende krabbe, og spilleren (eller planen) velger per tur. Slik drev 9 av 28 fartøy i 2026, og tilleggskvoten (82 t, om lag 110 t i forslaget for 2027) kan bare tas levende.
- **B: bare fryst (klør),** slik båten er beskrevet i dag. Da står tilleggskvoten ubrukt, som for ombordprodusentene sak 17/2026 omtaler.
- **C: bare levende:** turer på 8–9 døgn og ingen fabrikk, men lavere pris (82 mot 131 kr/kg rund vekt i 2025).

**V2 Hvor snøkrabben landes** (valgt: C, Jonas 06.11.2026)
- **A (anbefalt): der sedlene viser at den ble landet:** fryselagrene og anleggene for fryst (Båtsfjord, Tromsø, Ålesund, Kinn) blir havmottak, og levende krabbe går til Båtsfjord, Vardø, Honningsvåg og Kjøllefjord der kaia passer. Da går turene til havnene flåten bruker (79 % landet i Finnmark i 2026).
- **B: bare spillets havner som tar snøkrabbe i dag** og har kai for 50 m (Båtsfjord, Kjøllefjord, Senjahopen).
- **C: alle mottak der kaia passer** (19 i dag), også de som aldri har tatt imot snøkrabbe.

**V3 Isen på feltene** (valgt: B, Jonas 06.11.2026)
- **A (anbefalt): et nyere snitt for isen** (2011–2020 i det samme datasettet, gjerne med 2021–2025 fra OSI SAFs fortsettelse). Sedlene 2024–2026 viser fangst ved 77–78,5° N der snittet for 1991–2020 stenger i februar–april. Det gjelder hele havet i nord, ikke bare snøkrabben, og kjøres i Actions (`is.yml`).
- **B: isklasse på snøkrabbefartøyet,** så det kan gå i spredt drivis; isen ellers som i dag. Teinene er like utsatt for drivisen (HI).
- **C: som i dag:** feltene nord for om lag 77° N er stengt om vinteren (om lag en tidel av fangsten i 2024).

**V4 Kvoten i spillets år (fra 2027)** (valgt: Jonas 06.11.2026: «Gjør det som blir mest riktig, og passer spillet i et fremtidsperspektiv», altså A, med reglene per år som data og kvoten etter 2027 fra spillets egen bestand (H3a))
- **A (anbefalt): som forslaget for 2027:** ordinær fartøykvote om lag 430 t og tilleggskvote om lag 110 t for levende, uten overregulering, med kvotefleks på 10 % fra 2027/2028. Totalkvoten på 16 594 t er fastsatt, og forskriften legges inn når den kommer i desember. Det er slik reglene blir, og V5 i H2 ble tatt på samme måte.
- **B: som 2026 skalert med totalkvoten,** slik spillet gjør nå: 472 t per tillatelse og ingen tilleggskvote.

**V5 Rekkefølgen** (valgt: A, Jonas 06.11.2026)
- **A (anbefalt): seks økter med utrulling etter hver** (H3a, H3b, H3c, H3d1, H3d2, H3e). Snøkrabbefartøyet kan kjøpes og fiske for hånd etter H3a.
- **B: alt i én utrulling** til slutt.

**V6 Prisen på snøkrabbetillatelsen** (valgt: B, Jonas 06.11.2026)
- **A: som i dag,** med kvoten i samme forhold til førstehåndsprisen som torskekvoten (712 kr/kg, `HPK`): om lag 385 MNOK for kvoten i 2027 (540 t), om lag 445 MNOK med skroget. Ingen kilde.
- **B (anbefalt): etter det driften kan bære.** Tillatelsen følger bare et fartøy som selges for fortsatt drift, og det finnes ingen strukturkvoter for snøkrabbe, så verdien er noen års overskudd av driften. Det regnes i H3a av lønnsomhetsundersøkelsen og prisene over flere år (2024 ga underskudd, 2025 det dobbelte av prisen), og blir trolig under 150 MNOK. Det er også et anslag uten salgspris.
- **C: vent med å åpne kjøpet** til en ekte salgspris er funnet (Fiskeribladet og Kyst.no kunne ikke nås herfra).

## 5. Antatt eller usikkert

Oppdatert etter H3a og H3b 06.11.2026 (det som ble funnet, og det som fortsatt er antatt):

- **Fangsten per teine** er kalibrert mot sedlene (tonn per turdøgn på frosne turer, per hovedområde og måned) og lønnsomhetsundersøkelsen, ikke mot målinger per teine; HI har bare figurer, og 0,5–2,5 kg per teine for 2015–2019 (et sekundært søkeutdrag) er fra da bestanden var en femdel av i dag. Turdøgnene i sedlene er dagene mellom landinger minus tre (antatt for gange og lossing), og modellens fire femdeler av døgnene til fiske er også antatt. Hopen har bare tre frosne turer i sedlene.
- **Utbredelsen:** fjerderota av fangsten per lokasjon som indeks (flåten går dit krabba er) er valgt slik at Hopen og Storbanken står i forhold som fangsten per turdøgn; månedsfaktoren (kvadratrota, 0,4–1,6), 35 % ved siden av lokasjonene med landinger, 6 % ellers på norsk sokkel nord for 72° N og flekkene er antatt. Dybdevinduet (full 220–380 m) bygger på HI 2023-51 (250–350 m).
- **Lengde–vekt:** W = 2,36·10⁻⁴·CW^3,126 (hardt skall) er vår tilpasning til medianene i HI 2023-61 fig. 8, ikke en publisert kurve, og figuren oppgir ikke kjønn (90–125+ mm er hanner i praksis). Hunnenes vekt bruker samme kurve. Størrelsene i teina (105 ± 11 mm, 18 % under 9,5 cm) er lest av figuren i HI toktrapport 2024-21; hunnandelen (3 %) er antatt.
- **Bløtkrabbe per måned** (3 % om vinteren til 30 % i juli–august) er våre tall etter HIs beskrivelse av hamskiftet; at teina fanger bløt krabbe like lett, er antatt. At 20 %-regelen gjelder per trekk med minst 50 krabber, at spillet melder for deg, og sju døgn i lokasjonen er våre valg.
- **Død krabbe:** 1 % i teina er antatt (HI: 98 % levende etter 1,5 år).
- **Teina:** målene (130/70/60 cm) og vekta (14,5 kg) er søkeutdrag, ikke lest i kilden; prisen (1 500 kr) er antatt. **Trekkefarten** (50 s per teine) er regnet av Fiskebåts høringssvar (9 000 teiner på under fem døgn); **settefarten** (8 s, om lag 6 knop med 25 m mellom) er antatt. **Agnet** er et halvt kilo akkar per teine; hvor godt andre agn virker, er antatt. Agnets trekk (halvert på om lag to døgn) og fangsten uten agn (4 %) er antatt.
- **Plassen om bord:** 8 000 teiner (taket i § 28); at flåten har med opptil 12 000 per tur, er et søkeutdrag.
- **Bestanden etter 2027:** HIs B/BMSY for 2018, 2020 og 2022 er fylt inn mellom naboene, og `Bm` 1,6, `sd` 0,15 og kvoten lik rådet er våre.
- **Tillatelsens pris** (V6 B): kostnadene fra 2024 (et år med lav pris, og en gruppe som også tok reker), avskrivningene (4 MNOK), mannskapet (35 %) og sju år er våre valg; verdien er 31,6 MNOK i 2027 og svært følsom for prisen (0 med prisen for 2024 alene, om lag 84 MNOK med prisen for 2025).
- **Fabrikken** (H3b): 12 t klør i døgnet (18 t rund vekt) er antatt; ingen norsk kapasitet er funnet. De russiske krabbefartøyene Arktur, Zenith og Vaigach koker 30 t rå krabbe til 20 t produkt i døgnet, Frøyanes 20 t krabbeben med 35 om bord, og anlegget i Båtsfjord 8–10 t klør (alle søkeutdrag). Delingen ved bordet (5 kg i minuttet per mann, dekkets sløyefart) er ikke målt for snøkrabbe. Glasseringen (7–12 %, Råfisklaget, søkeutdrag) regnes ikke i produktvekten.
- **Tankene** (H3b): 400 m³ og 40 t (100 kg/m³) er antatt; FHF nevner en tank på 100 m³ og Nofima forsøk ved 100–200 kg/m³ (søkeutdrag). **Dødeligheten:** ingen tall per døgn om bord ble funnet; `h0` er kalibrert mot sedlene for 2026 (2,9 % død krabbe på levendelandingene, de første årene med utkastforbudet). Hvordan den øker med døgnene i tanken (τ 10 døgn), temperaturen (over 4 °C), bløtt skall (4 ganger) og stoppede pumper (20 ganger) er våre valg; tettheten følger Nofimas forsøk i grove trekk. Juni gir 4,8 % mot sedlenes 8,3 % (seks turer), så modellen tar ikke hele sommeren.
- **Død krabbe** går alltid på fartøykvoten i spillet; i sedlene står den halvt på tilleggskvoten. Prisen (1 kr/kg) er fra sju rader i 2025.
- **Prisene** (H3b): snittet for 2024–2026 som nivå er vårt valg (det samme som tillatelsens verdi); prisen for 2026 er søkeutdrag (Råfisklagets prisrapport uke 34 og NRK 8.7.2026), fordi sedlene for 2026 ikke har beløp ennå. Desember er satt lik januar (ingen beløp for desember 2025), og august–november er fylt mellom juli og desember (fredningen). Minsteprisene for levende og klør er søkeutdrag av rundskriv 2/2026 og prisrapporten.
- **Lossingen av levende krabbe:** 400 kg i karet og et løft hvert femte minutt er antatt; ingen tall funnet.
- **Mannskapet:** 22 om bord (seks nøkkelfolk, 8 på dekk og 8 i fabrikken) etter sedlenes «Besetning»; to skift som går fem uker på og fem av er fra høringssvaret fra Polar Pioneer AS m.fl. (2023, lest), men vaktordningen (seks og seks) er ikke funnet. Om kombinasjonsfartøyene går med færre folk på levendeturer (sedlene: 13 om bord på levendefartøyene), er ikke undersøkt; spillet har hele skiftet med.
- **Lotten:** oppgjørsavtalen for snøkrabbe er ikke funnet (Fiskebåt og Fiskarlaget var stengt); 35 % står mot 31,5–43,6 % av inntektene i undersøkelsen 2022–2024 og 37,7 % i 2018.
- **Drivstoffet** (H3b): generatorene (180 l i timen) er antatt; lønnsomhetsundersøkelsen har bare kroner for gruppe 014, og Fiskeridirektoratets sak 29a/2024 gir 0,9–3,0 l per kg fangst i 2015–2022.
- **Tap av lenker i været og i drivisen** (H3c): været tar nå en liten del av kystredskapets tap (`SNOC.lossF` 0,005, om lag en tredel av en lenke på en sesong med 40 lenker på Sentralbanken), og drivisen resten der den kommer. Ingen kilde gir tapet per fartøy eller hvor langt en lenke dras: HI 2023-51 sier at drivisen kutter og sliter av iletauene og er «en av hovedårsakene til redskapstap», Fiskeridirektoratet fant avslitte ender på lenker som ble funnet igjen og tok opp 12 309 teiner på opprenskingstoktene 2018–2022, og SINTEF skriver at «flere tusen teiner» ble forlatt i isen i mars–april. Modellen (kuttet med 0,07 % i timen × ((c − 20) / 70)², dradd med 2 % av vinden og en sjettedel av det) er kalibrert så en sesong på Storbanken mister om lag én lenke til isen, og er vår. Isen er middelet for 1991–2020, så en konsentrasjon er et snitt over år, ikke isen en bestemt dag.
- **Hunnkrabben:** ingen hjemmel funnet for å sette ut hunner; minstemålet tar dem i praksis. Egg-bærende hunner settes ut (HI, uten hjemmel).
- **Reguleringen for 2027** er et forslag (sak 17/2026); totalkvoten er fastsatt.
- **Kystvaktas kontrollpunkter** for snøkrabbe, ERS og VMS, og om «Kystvakten skal ha melding ved setting og trekking» står i en forskrift, er ikke sjekket.
- **Isen** (H3c): isklassen 1C for snøkrabbefartøyet er antatt for et 50 m fartøy fra 2001 (Frøyanes har Ice 1B, Polarbris ICE-C, Prestfjord Ice 1B; de eldre har ingen oppgitt, søkeutdrag; DNV-registeret var stengt). Ingen kilde gir en grense i prosent for et fiskefartøy; 60 % for 1C (70 for 1B, 80 for 1A) er regnet med POLARIS i middels tykk førsteårsis under 1 m, med risikoverdiene slik vi husker tabellen i MSC.1/Circ.1519 (ikke lest i kilden). Redskapets grenser er våre: planen setter ikke der 4/10 kommer innen ståtida og to døgn, tar lenkene inn før det, og trekker ikke over 5/10; risikoen begynner ved 2/10. At flåten tar inn lenkene når iskanten nærmer seg, er ikke funnet (Fiskebåt 2023: «et stort antall teiner har stått igjen på feltet etter endt sesong»), og heller ikke at den flytter fra Storbanken til Sentralbanken når isen kommer; Ervik Group vil at sesongen skal slutte før drivisen kommer i starten av mars. Snittet for 1991–2020 stenger fortsatt felt nord for om lag 77° N for andre båter, og NPC-flåtens snøkrabbefartøy bruker 40 % som før.
- **Driftsplanen for snøkrabbe** (H3c): lenkemønsteret (2 km mellom, åtte i rekka, 6,5 km mellom rekkene), 1,2 t per lenke i kvotebudsjettet, 12 timer før skipet heller trekker den eldste (minst 3 døgn), 18 døgn som grense for å røkte før skipet går inn, to døgns margin før 1. juli, seks døgn for den eldste krabben i tankene (sesongen gir 8,3 døgn mellom landingene, sedlene 8–9; fem ga 7,3), levendeturer på høyst 10 døgn og fryseturer på 20 som standard er våre valg. Hvordan flåten legger opp fredningen, er ikke funnet: 2024 ble fangsten stoppet 19. mars og 2025 maksimalkvotene 27. april (sak 17/2025), og Fiskebåt skriver at kvoten de siste årene er tatt «i god tid før stoppen 1. juli»; Polar Pioneer og Arctic Pioneer har snøkrabbe som «eneste driftsgrunnlag» (opplag om sommeren, vår tolkning), Frøyanes tråler reker deler av året og Kvitungen tar sel.
- **Mottakene (V2 C):** 19 mottak tar båten; Vardø og Honningsvåg, der mye levende krabbe landes, har for kort eller grunn kai for 50 m og 6 m dypgang etter registeret (45–47 m-fartøy lander der). Om kaiene er målt riktig, er ikke sjekket. Fryselagrene der fryst snøkrabbe landes i virkeligheten, er ikke havner (backloggen).
- **Sedlene for 2026** har ingen beløp ennå, og 2026 har en ny omregningsfaktor (1,49). At faktoren er Fiskeridirektoratets nye, er sett i sedlene og et søkeutdrag, ikke i tabellen (Tableau, utilgjengelig).

## 6. Hva planen ikke gjør

- Ingen reketrål eller andre fiskerier med snøkrabbefartøyet (gruppa i undersøkelsen tok også 2 000 t reker i 2024), og ingen kongekrabbe med det.
- Ingen nye havner og ingen fryselagre som havner (V2 C), og ingen ny is for andre båter enn snøkrabbefartøyet (V3 B).
- Ingen fangst på russisk sokkel (krever russisk samtykke, konsesjonsforskriften § 6-3) og ingen forsknings- og undervisningskvoter.
- Ingen navngitte nøkkelfolk med liv (H7).
- Ingen fabrikk, tanker eller rom under dekk i modellen (CLAUDE.md: bare utsiden).
- Ingenting selges for ekte penger.

## 7. Status

- 06.11.2026: planen skrevet på grenen `ccr-016e1586-atu94e` (fra arbeidsgrenen etter H2e, 1df71d75). Regelverket lest samme dag (J-237-2025, sak 17/2026, konsesjonsforskriften kap. 6, høstingsforskriften §§ 18, 25, 27–29, 46, 47, 51, 58 og 66 med vedlegg 3f, HR-2023-491-P), sedlene for 2024–2026 regnet ut, og driftstallene søkt opp (HI, Fiskeridirektoratet, lønnsomhetsundersøkelsen). Venter på valgene V1–V6 og «kjør på».
- 06.11.2026: **valgene tatt** (Jonas): V1 A (både levende og fryst, som kombinasjonsfartøy), V2 C (alle mottak der kaia passer, ingen nye havner), V3 B (isklasse på snøkrabbefartøyet, isen ellers som i dag), V4 «Gjør det som blir mest riktig, og passer spillet i et fremtidsperspektiv» (A: forslaget for 2027, reglene per år som data, fartøykvotene regnet av totalkvoten og de 30 tillatelsene, kvotefleksen i lagringen, og totalkvoten etter 2027 fra spillets egen bestand), V5 A (seks økter med utrulling etter hver) og V6 B (tillatelsen prises etter det driften kan bære). Fasene over er rettet etter valgene. **Neste:** H3a i en ny økt, når Jonas sier «kjør på».
- 06.11.2026: **planen flettet inn i arbeidsgrenen** i 784debb5 (Jonas: «Ja, flett inn»); bare dokumentasjon, ingen utrulling. Promptet for H3a er gitt Jonas. **Neste:** H3a i en ny økt.
- 06.11.2026: **H3a bygd** på grenen `ccr-1c785ad6-0di8o1` (fra arbeidsgrenen etter 3e259a14), ikke rullet ut (Jonas: «spør Jonas før noe rulles ut»). Snøkrabben er fiskbar for snøkrabbefartøyet med kjønn, skallbredde, vekt og bløtt skall per krabbe og sorteringen etter §§ 46, 47 og 51 og J-237-2025 § 5; utbredelsen fra sedlene per lokasjon og måned 2024–2026 (`fiske.json` `snok`) med dybden og bare på norsk sokkel; den koniske teina med rømmingshull og registreringsmerke, lenker på 200 med 25 m mellom, taket på 8 000 og akkar; fangsten kalibrert mot sedlene (tabellen under H3a); §§ 18, 25, 27 og 28; kvotene per år som data (351 + 82 t i 2026, 433 + 110 t i 2027, så bestanden), kvotefleksen i lagringen; 30 tillatelser, ingen kvotefaktor, verdien etter driften (31,6 MNOK i 2027); fartøyet låst opp; de tre ulovlige NPC-feltene flyttet. Systemdokumentene: 5.68 i `redskap.md`, 5.5b og 5.28 i `kvoter-og-regler.md`, 5.3c-R6 i `fiskerimodellen.md`. **Neste:** Jonas ser på det og sier om H3a skal rulles ut (og migreringen `20261106120000_snokrabbe_30.sql` kjøres); så H3b.
- 06.11.2026: **H3a rullet ut** (Jonas: «Rull ut. Send meg promptet for å starte neste økt»): grenen `ccr-1c785ad6-0di8o1` flettet med arbeidsgrenen etter U2-2, U2-3, Ø11.1 og Ø11.5 i dc6eb44f og 8982db93 (rullet ut i 8982db93); etter den siste flettingen enhetstestene 1388 OK, `snokrabbetest` 23 OK, `geartest` 46 OK, `boottest` 4 OK, `vesseltest` 33 OK, `shoptest` 21 OK, `trip2` og `dbg23o` grønne. Migreringen `20261106120000_snokrabbe_30.sql` er kjørt av Jonas i SQL Editor samme dag (registeret på serveren har 30). **Neste:** H3b (fabrikken, levende krabbe, vaktene, turen og lossingen) i en ny økt.
- 06.11.2026: **H3b bygd** på grenen `ccr-2f1306ed-u6tdgs` (fra arbeidsgrenen etter H3a, b63df02b), ikke rullet ut (Jonas: «spør Jonas før noe rulles ut»). Fabrikken for klør (12 t i døgnet, faktoren 1,61/1,49 per år, produktvekt i rommet og rund vekt på kvoten og prisen), levende krabbe i RSW-tankene (40 t) etter størrelse, valgt per tur, med dødeligheten kalibrert mot sedlene for 2026, død krabbe rund til oppmaling, prisene per måned fra sedlene over flere år og levende etter størrelse, tilleggskvoten for levende krabbe først, 22 om bord i to skift som går fem uker på, proviant for 30 døgn, turkortet med agnet og tankene, lossing på paller og i kar, Kvote-appen for snøkrabbe, og tapet av snøkrabbelenker i været satt ned (`SNOC.lossF`). Systemdokumentene: 5.69 i `redskap.md`, «Tilleggskvoten i H3b» i 5.5b i `kvoter-og-regler.md`, 5.6c i `folk-om-bord.md`, 5.4 i `priser-og-salg.md`. Målingene under H3b i kap. 3. Testene: enhetstestene 1 432 OK (ny `krabbefabrikk.test.mjs` 44 OK), `krabbefabrikktest` 35 OK uten sidefeil med skjermbilder i begge formater, `run.py changed` 69 tester med 61 grønne; de røde var røde før H3b, ustabile eller 3D på tid (backloggen, «Røde i `run.py changed` for H3b»). **Neste:** Jonas ser på det og sier om H3b skal rulles ut; så H3c (Driftsplan 2, isen og fredningen).
- 07.11.2026: **H3c bygd** på grenen `ccr-5c109e47-twgn6s` (fra H3b-grenen `ccr-2f1306ed-u6tdgs` med arbeidsgrenen flettet inn i f7cc23d9), ikke rullet ut (Jonas: «Spør Jonas før noe rulles ut»). Snøkrabbe i Driftsplan 2 (`core/06i-plan2-sno.js`): felt med lenker à 200 og ståtid i døgn, trekk den som har stått lengst og sett ut igjen, turens slutt fryst og levende, lenkene står mens skipet leverer og røktes etter § 18, fredningen etter J-237-2025 § 5, fartøykvoten og tilleggskvoten som grense for året; isklassen 1C som grense for konsentrasjonen (60 %), drivisen over lenkene (kutter iletauene, drar lenka) og tapet i været (`SNOC.lossF` 0,005); siden og kartkortet i lenker og døgn. Rettet underveis: snøkrabbefelt prøvd mot kongekrabbens regler, `portBusy` før EPOCH, reserven for veien inn i full fart; Jonas 07.11.2026: «På de store havbåtene skal forresten mannskapet kun gå døgndrift» (regelen på båtklassen, `p2Hav`). Målingene under H3c i kap. 3; det som er antatt, i kap. 5 og i backloggen. Testene: enhetstestene (havplan og is), `havplantest` del 8–10, `run.py changed` (se backloggen og testhistorikken). **Neste:** Jonas ser på H3b og H3c og sier om de skal rulles ut; så H3d1 (Blender-modellene) i en ny økt.
- 07.11.2026: **H3b og H3c rullet ut** (Jonas: «Rull ut på det store blå»): grenen `ccr-5c109e47-twgn6s` flettet med arbeidsgrenen (lossekøen, megleren, boostklokka m.m.) i 192d4059 og rullet ut i 4107d71a. På det flettede treet: enhetstestene 1 801 OK, `trip2`, `boottest`, `vesseltest`, `shoptest`, `snokrabbetest`, `krabbefabrikktest`, `geartest`, `istest`, `driftsplan2ui`, `harbourtest`, `docktest` og `dbg23o` grønne; `driftsplan2test` S19 (rorbua) er like rød på arbeidsgrenen uten H3 (backloggen 10.6). **Neste:** H3d1 i en ny økt, med snøkrabbefartøyet revidert eller bygd på nytt med mye høyere kvalitet (Jonas 07.11.2026: «hele modellen skal revideres eller skapes fra bunn av med mye høyere kvalitet»).
- 08.11.2026: **H3d1 rullet ut** i c131e302 (Jonas: «Rull ut på det store blå»), flettet med arbeidsgrenen; testene etter flettingen i `docs/planer/koen.md` (Status). Neste: H3d2.
- 07.11.2026: **H3d1 bygd** på grenen `ccr-287cbb81-whkbel` (fra arbeidsgrenen etter H3b/H3c og U2-4, 5607da82), ikke rullet ut (Jonas: «spør Jonas før noe rulles ut»). Snøkrabbefartøyet bygd på nytt fra bunnen i `tools/boats/krabbe50.py` etter pilotens arbeidsmåte (`docs/skipsmodeller/snokrabbe-grunnlag.md` med kildene, avvikslista, lanternene og selvvurderingen; `snokrabbe-bygging.md`): skroget som én flate (1 762 t mot 1 800), isbeltet, shelteret over teinedekket akter, portalen med blokka, sorteringsbordet, transportbåndet og teinerenna i styrbord hekk, 70 stableplasser, lasteluka og RSW-lukene, knekkarmkranen med bomstøtte (luka og kranen som deler for lossingen), bakken med huset og styrhuset med vinduer rundt og eget styrepult, lanternene etter vedlegg I (M21(2) rettet), kit-plassene i modellen (`KITADD`, `MOBCUT` og `HELM_KIT` for typen fjernet); 123 000 trekanter nær, 36 000 midt (bygd i skriptet); en kam på babord baug var spline-bufferen i `pchip` (rettet, og `check()` sjekker at sidene er like), 3 891 for havflåten; brem rundt styrhustaket og husets tak (Jonas 07.11.2026). Redskapet og fangsten (`redskap.md` 5.70): snøkrabbeteina med rømmingshull og merke, haleren, blåsa og bøyestanga (`tools/gear/snoteine.py`), snøkrabben og klørne (`tools/fish/fisk.py`), pallen med klør og karet for levende krabbe (`tools/deck/pall.py`). Testene og bildene: `tests/h3dshot.py` (ny, 3D alene) rød før og grønn etter; resten i backloggen. **Neste:** Jonas ser på bildene og sier om H3d1 skal rulles ut; så H3d2 (animasjonene) i en ny økt.
