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
  - **Kvoten:** landingene går mot fartøykvoten fra tillatelsen i rund vekt (valg V4), og den nye J-meldingen for 2027 legges inn når den kommer. Registeret får 30 tillatelser (`HREG.krab`, sak 17/2026). Tilleggskvoten for levende kommer i H3b.
  - **Kjøpet:** `lock` tas av snøkrabbefartøyet. Tillatelsen følger fartøyet ved salg for fortsatt drift eller utskifting (konsesjonsforskriften kap. 6, høringsnotatet 2023), så spilleren kjøper et brukt fartøy med tillatelsen fra en NPC-eier, som i dag (`havOffer`, men med én tillatelse og ikke en kvotefaktor). Prisen er skroget pluss tillatelsen; hvordan tillatelsen prises, er valg V6.
  - **Mottakene som tar snøkrabbe:** et mottak tar snøkrabbefartøyets fangst bare når sedlene har snøkrabbe der (`portWhy` med artene, ikke bare `Konvensjonelle`). I H3a landes krabben hel og fryst som i dag (holdene fryser); fabrikken og fryselagrene er H3b.
  - **Havflåten:** de tre NPC-feltene som er ulovlige for et norsk fartøy (russisk sone, russisk sokkel i Smutthullet, innenfor 12 nm) flyttes inn på norsk sokkel i sin lokasjon (`tools/npc/havflaate.py`).
- **Filer:** `core/02-species-gear.js`, `core/10-gear.js`, `core/03f-fiske.js`, `core/03e-rules.js`, `core/03d-quota.js`, `core/06b-coastports.js`, `core/05d-hav.js`, `tools/npc/fiske.py`, `tools/npc/havflaate.py`, `src/data/fiske.json`, `src/data/havflaate.json`, `ui/08-actions.js`, `ui/10-gear-ui.js`, `ui/phone/10-fartoy.js`.
- **Tester:** ny `tests/unit/snokrabbe.test.mjs` (fangst per teine mot HI og sedlene, sorteringen, minstemålet, bløtkrabben, reglene, kvoten, registeret med 30), `rules.test.mjs`, `havlic.test.mjs`, `hav.test.mjs` (ingen NPC-felt utenfor norsk sokkel), `havsteg.test.mjs`, ny `tests/snokrabbetest.py` (kalibreringen på feltene, en lenke satt og trukket, reglene på stedet, skjermbilder i begge formater), `geartest`.
- **Måles:** kg per teine og per fiskedøgn på Storbanken, Sentralbanken og ved Hopen mot HI og sedlene, og andelen undermåls og bløt krabbe per måned.

### H3b Drift om bord: fabrikken, levende krabbe, vaktene, turen og lossingen

- **Hva:**
  - **Fabrikken (klør):** sorteringen, delingen i to klør (seksjoner), kokingen, frysingen og glasseringen, pakket i kartong; kapasiteten er ikke funnet utenom ett fartøy på 20 t krabbeben i døgnet (35 om bord), så et 50 m fartøy får om lag 10–12 t produkt i døgnet (antatt, nok for 8 t rund vekt fangst). Rommet fylles av produktvekten, kvoten og prisen går på rund vekt (som V2 A i H2), med Fiskeridirektoratets faktor for året: 1,61 til 2025 og 1,49 fra 2026 (kap. 2b).
  - **Levende krabbe (valg V1):** tanker med gjennomstrømmende sjøvann; krabben holdes levende til levering (i sedlene om lag tre døgn fra siste fangst), dør etter hvert ellers. Tilleggskvoten (82 t i 2026, om lag 110 t i forslaget for 2027) gjelder bare levende levert.
  - **Prisene:** klør per kg rund vekt etter måned (sedlene 2025, som `pm` i dag) og levende med egen pris (sedlene 2025: 70–91 kr/kg), Råfisklagets minstepriser når de kan leses.
  - **Vaktene og lagene** (V5 A i `havsteget.md`): antallet om bord etter sedlene (kap. 2b: 21–29 på et 50 m fryst fartøy, mot 14 i spillet i dag), anonyme lag på dekk og i fabrikken i to vakter, med nøkkelfolkene fra H2.
  - **Turen:** om lag 20 døgn for fryst og 8–9 for levende (sedlene); drivstoff, agn, proviant og rom setter grensen, med kortet Turen fra H2b.
  - **Lotten:** § 20 for snøkrabbe med turoppgjøret som finnes. Prosenten i oppgjørsavtalen er ikke funnet; spillets 35 % sjekkes mot undersøkelsen (31,5–43,6 % av inntektene i 2022–2024) og mot avtalen om den kan leses.
  - **Lossingen:** fryste klør på paller (H2b) ved fryselagrene; levende krabbe i kar med kran til levendemottaket.
  - **Mottakene (valg V2):** fryselagrene og anleggene som tok fryst snøkrabbe i sedlene (Båtsfjord, Tromsø, Ålesund, Kinn) blir havmottak for fryst (`havOnly`), og levendemottakene (Båtsfjord, Vardø, Honningsvåg, Kjøllefjord) tar levende der kaia passer. `tools/mottak/mottak.py` skriver levende og fryst snøkrabbe per anlegg.
- **Filer:** `core/05-vessels.js` (`holdFreezes`, tankene), `core/13-work.js`, `core/03-simulation.js` (`sell`, `capHold`), `core/02-species-gear.js` (prisene, båten), `core/03d-quota.js` (tilleggskvoten), `core/04-crew.js`, `core/07-harbours.js` (`landPlan` for levende), `core/06b-coastports.js`, `tools/mottak/mottak.py`, `src/data/mottak.json`.
- **Tester:** ny `tests/unit/krabbefabrikk.test.mjs` (omregningen, fabrikkfarten, tankene, tilleggskvoten, lossetiden, lotten), `selltest`, ny `tests/krabbefabrikktest.py` (to døgn der lagene fisker uten deg om bord, lossing ved et fryselager og levende ved et levendemottak), `trip2`, `havsteg.test.mjs`.
- **Måles:** tonn per døgn og per tur, levende og fryst, mot sedlene; lotten per tur.

### H3c Snøkrabbe i Driftsplan 2, isen og fredningen

- **Hva:**
  - **Driftsformen:** feltet er mange lenker med ståtid i døgn; skipet går fra lenke til lenke, trekker den som har stått lengst, setter den ut igjen, døgnet rundt i vaktene, til rommet, kvoten, agnet, drivstoffet, provianten eller turens døgn sier stopp; så til mottaket (fryst eller levende) og ut igjen.
  - **Teinene står ute** mens skipet leverer, som i virkeligheten, men røktes minst hver tredje uke (§ 18) og posisjonen meldes (§ 25).
  - **Fredningen:** alle teiner på land før 1. juli (J-237-2025 § 5); planen tar dem inn i juni, og ingen setting før 1. desember.
  - **Isen:** drivis over lenkene (`seaIceAt`) stopper trekkingen og kan koste teiner; planen holder seg unna iskanten. Hvilken is som gjelder, er valg V3.
  - **Været:** havbåtens grenser fra H2c (arbeidsgrensen og ligge bi).
  - **Den felles klokka:** sløyfen spilles også når appen er lukket (`catchUp`).
- **Filer:** `core/06g-plan2.js`, `core/06h-plan2-engine.js`, `ui/05d-plan2.js`, `core/10-gear.js`, `core/03h-is.js` (og `tools/is/is.py` med V3 A).
- **Tester:** `havplantest` (nytt scenario: en tur med snøkrabbe), `tests/unit/havplan.test.mjs`, `driftsplan2test`, `driftsplan2ui`, `is.test.mjs`, alene.
- **Måles:** at en tur på planen gir det samme som en tur for hånd (innenfor 15 %), og sesongen mot sedlene (tonn per fartøy, turer og døgn mellom landingene).

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
  - **Stikkprøvene:** turer fra Båtsfjord, Vardø eller Honningsvåg (nord), Tromsø (midt) og Ålesund (sør), der sedlene har landinger; skjermbilder i begge formater.
  - Patchnotes.
- **Tester:** `havtur`, `kystvakttest`, `kystvakt.test.mjs`.

## 4. Valgene

Hvert valg har en anbefaling og én setning om hvorfor.

**V1 Levende eller fryst krabbe**
- **A (anbefalt): begge, som kombinasjonsfartøy:** fryseriet for klør og tanker for levende krabbe, og spilleren (eller planen) velger per tur. Slik drev 9 av 28 fartøy i 2026, og tilleggskvoten (82 t, om lag 110 t i forslaget for 2027) kan bare tas levende.
- **B: bare fryst (klør),** slik båten er beskrevet i dag. Da står tilleggskvoten ubrukt, som for ombordprodusentene sak 17/2026 omtaler.
- **C: bare levende:** turer på 8–9 døgn og ingen fabrikk, men lavere pris (82 mot 131 kr/kg rund vekt i 2025).

**V2 Hvor snøkrabben landes**
- **A (anbefalt): der sedlene viser at den ble landet:** fryselagrene og anleggene for fryst (Båtsfjord, Tromsø, Ålesund, Kinn) blir havmottak, og levende krabbe går til Båtsfjord, Vardø, Honningsvåg og Kjøllefjord der kaia passer. Da går turene til havnene flåten bruker (79 % landet i Finnmark i 2026).
- **B: bare spillets havner som tar snøkrabbe i dag** og har kai for 50 m (Båtsfjord, Kjøllefjord, Senjahopen).
- **C: alle mottak der kaia passer** (19 i dag), også de som aldri har tatt imot snøkrabbe.

**V3 Isen på feltene**
- **A (anbefalt): et nyere snitt for isen** (2011–2020 i det samme datasettet, gjerne med 2021–2025 fra OSI SAFs fortsettelse). Sedlene 2024–2026 viser fangst ved 77–78,5° N der snittet for 1991–2020 stenger i februar–april. Det gjelder hele havet i nord, ikke bare snøkrabben, og kjøres i Actions (`is.yml`).
- **B: isklasse på snøkrabbefartøyet,** så det kan gå i spredt drivis; isen ellers som i dag. Teinene er like utsatt for drivisen (HI).
- **C: som i dag:** feltene nord for om lag 77° N er stengt om vinteren (om lag en tidel av fangsten i 2024).

**V4 Kvoten i spillets år (fra 2027)**
- **A (anbefalt): som forslaget for 2027:** ordinær fartøykvote om lag 430 t og tilleggskvote om lag 110 t for levende, uten overregulering, med kvotefleks på 10 % fra 2027/2028. Totalkvoten på 16 594 t er fastsatt, og forskriften legges inn når den kommer i desember. Det er slik reglene blir, og V5 i H2 ble tatt på samme måte.
- **B: som 2026 skalert med totalkvoten,** slik spillet gjør nå: 472 t per tillatelse og ingen tilleggskvote.

**V5 Rekkefølgen**
- **A (anbefalt): seks økter med utrulling etter hver** (H3a, H3b, H3c, H3d1, H3d2, H3e). Snøkrabbefartøyet kan kjøpes og fiske for hånd etter H3a.
- **B: alt i én utrulling** til slutt.

**V6 Prisen på snøkrabbetillatelsen**
- **A: som i dag,** med kvoten i samme forhold til førstehåndsprisen som torskekvoten (712 kr/kg, `HPK`): om lag 385 MNOK for kvoten i 2027 (540 t), om lag 445 MNOK med skroget. Ingen kilde.
- **B (anbefalt): etter det driften kan bære.** Tillatelsen følger bare et fartøy som selges for fortsatt drift, og det finnes ingen strukturkvoter for snøkrabbe, så verdien er noen års overskudd av driften. Det regnes i H3a av lønnsomhetsundersøkelsen og prisene over flere år (2024 ga underskudd, 2025 det dobbelte av prisen), og blir trolig under 150 MNOK. Det er også et anslag uten salgspris.
- **C: vent med å åpne kjøpet** til en ekte salgspris er funnet (Fiskeribladet og Kyst.no kunne ikke nås herfra).

## 5. Antatt eller usikkert

- **Fangsten per teine** er regnet ut av sedlene og undersøkelsen (5–7 kg), ikke målt per felt og måned; HI har bare figurer. Snittvekten per hann og lengde–vekt-forholdet er ikke funnet ennå (H3a leter i HIs toktrapporter).
- **Teina:** mål, vekt og pris er ikke funnet. **Trekkefarten** er regnet av teiner i døgnet. **Agnet per teine** er én akkar i HIs forsøk; 0,5–1 kg er regnet ut av kostnadene.
- **Fabrikken:** kapasiteten for et 50 m fartøy (10–12 t produkt i døgnet) er antatt ut fra ett fartøy på 20 t med 35 om bord.
- **Mannskapet:** 21–29 om bord på et 50 m fryst fartøy er sedlenes felt «Besetning»; om flåten går med to skift som bytter, er ikke funnet. Båten har 18 køyer i dag.
- **Lotten:** prosenten i oppgjørsavtalen er ikke lest; 35 % står mot 31,5–43,6 % av inntektene i undersøkelsen.
- **Prisen på tillatelsen** (V6) har ingen kilde.
- **Hunnkrabben:** ingen hjemmel funnet for å sette ut hunner; minstemålet tar dem i praksis. Egg-bærende hunner settes ut (HI, uten hjemmel).
- **Reguleringen for 2027** er et forslag (sak 17/2026); totalkvoten er fastsatt.
- **Kystvaktas kontrollpunkter** for snøkrabbe, ERS og VMS, og om «Kystvakten skal ha melding ved setting og trekking» står i en forskrift, er ikke sjekket.
- **Isen:** at et nyere snitt (V3 A) passer sedlene bedre, er ikke målt; det sjekkes mot landingene per lokasjon og måned.
- **Mottakene:** kaiene i registeret (lengde og dybde fra kartet) stenger Vardø og Honningsvåg for et 50 m fartøy med 6 m dypgang, men 45–47 m-fartøy lander der. Om kaiene er målt riktig, er ikke sjekket.
- **Sedlene for 2026** har ingen beløp ennå, og 2026 har en ny omregningsfaktor (1,49). At faktoren er Fiskeridirektoratets nye, er sett i sedlene og et søkeutdrag, ikke i tabellen (Tableau, utilgjengelig).

## 6. Hva planen ikke gjør

- Ingen reketrål eller andre fiskerier med snøkrabbefartøyet (gruppa i undersøkelsen tok også 2 000 t reker i 2024), og ingen kongekrabbe med det.
- Ingen fangst på russisk sokkel (krever russisk samtykke, konsesjonsforskriften § 6-3) og ingen forsknings- og undervisningskvoter.
- Ingen navngitte nøkkelfolk med liv (H7).
- Ingen fabrikk, tanker eller rom under dekk i modellen (CLAUDE.md: bare utsiden).
- Ingenting selges for ekte penger.

## 7. Status

- 06.11.2026: planen skrevet på grenen `ccr-016e1586-atu94e` (fra arbeidsgrenen etter H2e, 1df71d75). Regelverket lest samme dag (J-237-2025, sak 17/2026, konsesjonsforskriften kap. 6, høstingsforskriften §§ 18, 25, 27–29, 46, 47, 51, 58 og 66 med vedlegg 3f, HR-2023-491-P), sedlene for 2024–2026 regnet ut, og driftstallene søkt opp (HI, Fiskeridirektoratet, lønnsomhetsundersøkelsen). Venter på valgene V1–V6 og «kjør på».
