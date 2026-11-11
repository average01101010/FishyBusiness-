# Kvoter, regelverket og regelmotoren

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.17 Reglenes kartdata langs hele kysten (R1 av regelplanen, 04.10.2026)

Jonas: «Det neste vi må finne ut da er hvor grunnlinjen går langs hele kysten og hvordan regelverket er langs hele kysten». Og om artene: «Vi skal ikke fiske noe hummer i spillet», men «Kongekrabbe skal kunne fiskes i spillet! Det er viktig!»

**Kildene** (`tools/rules/fetch.py`, til `tools/rules/cache/`, ikke i git):
- **Kartverket, «Norges maritime grenser»** (CC BY 4.0), som GML i EPSG:25833 via nedlastings-API-et til Geonorge, fordi WFS-en svarer 500. Den har:
  - grunnlinja
  - linjene for 1, 4, 6 og 10 nm fra utøvelsesforskriften og plan- og bygningsloven
  - territorialgrensa (12 nm) og den tilstøtende sonen (24 nm)
- **Fiskeridirektoratets reguleringskart** (`Yggdrasil/Fiskerireguleringer`, ArcGIS REST, 38 lag, NLOD): alle lagene som GeoJSON i 25833, med sidevis henting.
  - Fire lag gir ingen geometri fra MapServer: 0 stengte felt, 18 og 19 gyte- og oppvekstområder, 40 rødspette.
  - De hentes fra WFS-en til `FiskeridirWFS_fiskeri`, som av og til feiler og derfor prøves på nytt. Feltnavnene der er andre og rettes.
- **Statistikkområdene** (`Yggdrasil/Statistikområder`): hovedområder (lag 6) og lokasjoner (lag 8) fra 2018, og fra ICES-områdene (lag 3) Skagerrak, 3.a.20 (Ø10, 07.11.2026, se 5.28c). Hele lag 3 som GeoJSON gir 500 fra tjenesten, så `fetch.py` spør etter 3.a.20 alene.

**Utregningen** (`tools/rules/regler.py`, rundt 95 s), som gir `src/data/rules.json` (0,32 MB) i spillets ramme med koordinater i enheter på 10 m:
- **Grunnlinja for fastlandet** lukkes langt inne i land gjennom Sverige, Finland og Russland til flata «innenfor grunnlinja».
  - De offisielle linjene ligger i sine avstander fra grunnlinja i spillets ramme. 4 nm måles til 4,006 nm, og avviket er høyst 0,6 % (UTM-skalaen).
  - Innenfor grunnlinja stemmer med Kartverkets «land og indre farvann» i 99,8 % av sjøpunktene innenfor 60 km.
  - 2 nm-linja tegnes her fra grunnlinja.
  - Spillet regner avstanden til grunnlinja selv, så alle sonene følger av den.
- **Fjordsonene:**
  - **Grunnlaget:** Sjøen deles av linjene på spillets eget land (`land200`, 200 m). Linjene er fjordlinjene for kysttorsk (lag 2), kroklinjene i Finnmark (lag 5) og yttergrensa for Oslofjorden (lag 38).
  - **Når sjøen er innenfor:** En del av sjøen er innenfor en linjetype når havet ikke kan nås uten å krysse en linje av den typen.
  - **Ender som ikke når land:**
    - En linjeende som ikke når land i 200 m-kartet, forlenges i linjas retning til land, høyst 2,5 km.
    - En linje som ender på en holme (Akanes – Gisløy), føres videre til nærmeste store land (minst 20 km²), som forskriftens «linje og kyst».
  - **Sider og lommer:**
    - Siden av linja avgjøres av nærmeste linjebit.
    - Små lommer som veggen skjærer av (under 3 km²), slås sammen med den største delen på samme side.
    - Delene møtes over linja bare gjennom celler rett ved veggen, og der to linjetyper ligger oppå hverandre, telles ingen kryssing.
  - **Kroklinjene i Finnmark** lukker ikke alltid fjorden alene (Porsanger-linja går til Magerøya, og Magerøysundet er åpent). Derfor merkes heller fjordsonene på yttersiden av en kroklinje, den siden som ligger nærmest grunnlinja, som unntatt krokgrensa 1.11–30.4. Det er 7 slike flater.
  - **Ringer og ytterkant:** Ringene tegnes gjennom landet midt mellom sjøen innenfor og sjøen utenfor, og hjørnene ved linjene legges på linjene.
  - **Resultat:** 82 soner. Den største er 6 324 km² og går fra Troms gjennom Vesterålen til indre Vestfjorden.
- **Områdene** (lagene som angår spillet, `KEEP`): Flater som følger land i detalj (Oslofjorden, gytefeltene i sør, Henningsværboksen, Borgundfjorden), tegnes på samme måte gjennom land fra spillets 25 m-maske (50 m, eller 100 m for store flater). Da beholder de kantene ute i sjøen og mister detaljene langs fjæra. Oslofjordflata går fra 694 548 til 4 829 hjørner.
  - **Utelatt etter Jonas' ønske:**
    - hummer (9, 10), flatøsters, leppefisk, snabeluer, rødspette og steinbit
    - trål, snurrevad og seinot (4, 11, 13, 14, 32, 33, 35, 36)
    - havbeite (Svalbard er med fra H1b R4, 5.28b)
  - **Med:** Kongekrabbe (12, 30) er med, fordi arten skal inn. Av de stengte feltene (lag 0) er bare de for konvensjonelle redskap med.
- `python3 tools/rules/look.py` tegner kontrollbilder til `tools/rules/out/`. De viser grunnlinja, sonene og linjene over spillets land for nord, Senja, Vesterålen, Lofoten, Finnmark, Midt-Norge og Oslofjorden.

**Oppdatering:**
- `.github/workflows/regler.yml` kjører begge skriptene og legger resultatet som release `regler-N`. Den nyeste kopieres til `src/data/rules.json`.
- Workflowen startes ved endring av `tools/rules/regler.json`, hver mandag på standardgrenen, eller for hånd.
- De stengte feltene og stengningene for kongekrabbe skifter fra uke til uke. I spillet er de et øyeblikksbilde fra hentedagen, og de gjelder uansett spilldato.

**Svakheter:**
- Sonene følger 200 m-landet, så der sjøen er smal, kan de være 100–200 m feil.
- To forskjellige lesninger av forskriften står i koden og er dokumentert der:
  - holmene og de smale sundene
  - kroklinjene i Finnmark

## 5.5 Kvoter og regulering

- **Blåkveite (07.10.2026, J-241-2025, `03d-quota.js` `BKQ`):** direktefisket for fartøy under 28 m åpner 25. mai kl. 00 og stoppes når gruppekvoten (5 230 t) er beregnet oppfisket. Lengden trekkes per år mellom 30 dager (2026) og 97 (2025), oftest kort (`bkSeason`), og stoppen varsles tre dager før (`bkNews`, melding fra Fiskeridirektoratet). Åpen gruppe med eier og høvedsmann på blad B (`bladB()`). Maksimalkvote etter største lengde: 9,7 t (0–13,99 m), 10,9 t (14–19,99 m), 12,1 t (20–27,99 m), ikke overførbar; 28 m og over bare bifangst, høyst 12,1 t. Utenom perioden (og uten blad B) høyst 7 % blåkveite i ukas landinger, regnet mandag til søndag og trukket fra maksimalkvoten (`bkAllow`, `landConf` inndrar resten). En landing inntil to døgn etter stoppen regnes med i perioden (redskapen skulle være på land da). Kvote-appen har et kort for blåkveite.
  - **Bestanden år for år** (`STOCK.blakveite`): gytebestanden av hunnfisk fra JRN-AFWG 2026 (2015, 2019, 2021, 2023, 2025, 2026 og 52 635 t ved starten av 2027; årene mellom står ikke i teksten), totalkvotene 2020–2026 fra den norsk-russiske kommisjonen (27 000, 27 000, 25 000, 25 000, 21 250, 19 000, 19 000 t; årene før er ikke funnet), rådet 19 610 t for 2027, B<sub>lim</sub> 33 391 t og B<sub>pa</sub> 46 747 t. Modellen etter 2027 er den samme som for torsken, men treg: `a` 0,1 mot 75 000 t, `sd` 0,06, `slack` 0,1. Bestanden virker på tettheten (`stockF`), og fra 2027 følger gruppekvoten og maksimalkvotene totalkvoten (`bkTacF`, `bkGroup`, `bkMax(len, y)`). Kvote-appen viser den under Bestand, bare årene med kjent totalkvote.

Kvotesystemet ligger i `core/03d-quota.js` (04.10.2026, plan Q1–Q6). Grunnlaget er forskriften slik den sto fra 1. oktober 2026 (J-161-2026, fiskeridir.no), Fiskeridirektoratets saksdokument 5/2025 til reguleringsmøtet og kvoterådene fra Havforskningsinstituttet. Kildenotatet med alle tall og lenker ligger under kapittel 6.

- **Fra totalkvote til fartøykvote** (`norQuota`, `codChain`, `yearQuota`):
  - **Norges kvote av torsk** = (TAC + 21 000 − tredjeland)/2 + 6 000. Formelen treffer 2019–2025 eksakt. Tredjelandsandelen 13,455 % er regnet ut fra § 2 for 2026. Hyse og sei følger TAC i samme forhold som i 2026.
  - **Fra toppen trekkes:**
    - forskning 880 t
    - ungdoms- og fritidsfiske 7 000 t
    - kystfiskeordningen (0,9 %, minst 3 000 t)
    - levendelagring 500 t
    - rekrutteringskvoter: 2 543 t i lukket og 450 t i åpen gruppe
  - **Åpen gruppe får 6,62 %.**
  - **Trålstigen:** 28 % til trål når resten er under 130 000 t, stigende til 33 % ved 330 000 t.
  - **Av det konvensjonelle:** havfiskeflåten får 12,81 % og lukket gruppe 87,19 %.
  - **Lukket gruppe:**
    - Den gir ferskfiskordningen sin del.
    - Resten fordeles med Finnmarksmodellen: 27,83 / 26,31 / 26,43 / 19,43 % på hjemmelslengdene under 11 / 11–14,99 / 15–20,99 / 21–27,99 m, pluss rekrutteringskvotene under 15 m.
  - **Kontroll mot 2026:** Kjeden gir § 5 for 2026 eksakt (9 257 / 72 945 / 19 164 / 19 036 / 17 407 / 12 796 t). `quotatest.py` sjekker det.
- **Åpen gruppe** (§§ 21, 26, 27):
  - Maksimalkvoten for 2026 var 4,0 / 5,6 / 6,4 t og den garanterte 3,0 / 4,2 / 4,8 t (under 8 m / 8–9,99 m / 10 m og over).
  - Senere år skaleres kvotene med gruppekvoten. Maksimalkvotene ganges i tillegg med en trukket faktor på 0,75–1,15 for hvor stramt direktoratet setter dem. Den garanterte kvoten er aldri over maksimalkvoten.
  - Hyse og sei har ingen maksimalkvote. Den garanterte kvoten skaleres med Norges kvote.
- **Lukket gruppe** (§§ 16, 18, 19, `HJ` og `licQ`):
  - **Torsk:** kvotefaktor × årets kvoteenhet for gruppen. I 2026 er enheten 8,4172 / 7,2662 / 6,9986 / 6,9982.
  - **Hyse og sei:** garantert kvote og maksimalkvote etter båtens største lengde, skalert med Norges kvote. Hyse under 11 m har ingen grense, slik det er fra 31.08.2026.
  - **Hjemmelslengder spillet selger:** under 7 m, 7–7,9, 8–8,9, 9–9,9, 10–10,9, 14–14,9 (`kyst15`) og 20–20,9 m (`kyst21`, 21 m).
  - **Ingen lengdegrense:** Deltakerforskriften for 2026 har ingen største lengde knyttet til hjemmelslengden, bare under 500 m³ lasterom.
  - **Over maksimalkvoten** kan en landing ha 30 % hyse og 20 % sei. Resten inndras ved levering.
- **Bestand og totalkvote** (`STOCK`, `stockYear`, `stockF`):
  - **Historikken** for gytebestand og totalkvote 2014–2026 er fra HI.
  - **2027:** Rådet er 312 667 t torsk, 180 336 t hyse og 127 807 t sei. TAC settes til rådet eller inntil 8 % over (torsk; i 2026 var den 5,8 % over).
  - **Fra 2028** gjelder en enkel modell per lagring:
    - Bestanden trekkes mot et langtidsnivå med tilfeldige årsklasser, og fiske over rådet holder den nede.
    - Rådet ∝ SSB^0,55 under B_pa.
    - Endringen er høyst ±20 % per år over B_pa (sei ±15 %).
  - **Fisketettheten** følger kvadratroten av gytebestanden mot mars 2027, for torsk, hyse og sei.
  - **Frøet** er `S.qseed` per lagring, så verdenen er ulik fra spill til spill.
- **Åpen gruppe gjennom året** (`qyOf`, `qyStep`, `qyAt`, `S.qy`):
  - **Flåten:** Rundt 2 100 virtuelle båter fisker gruppekvoten ned dag for dag. Fangsten avhenger av sesongen, været (vind under 12 m/s), bestanden og maksimalkvotene de har igjen. Antall båter og hvor hardt de fisker, trekkes for hvert år.
  - **Stopp:** Direktoratet stopper med en ukes varsel i Kystposten når gruppekvoten ser ut til å bli fisket, men bare før 1. juni.
  - **Økning:** Maksimalkvotene økes 1. mai og 1. juni når båtene ikke kan ta gruppekvoten.
  - **Fritt fiske** kan komme om høsten.
  - **Din fangst** teller med.
  - **De andre spillernes fangst** teller også med (`wshOpen`, fra `world_get` i `ui/10h-world.js`). Den kommer fra landingene de melder, og serveren kan ikke sjekke mot fangsten. Derfor teller hver konto høyst 60 t i året (`world_agg_get`), og gjester teller ikke før kontoen er registrert (05.11.2026, `supabase/migrations/20261105130000_guest_world.sql`, funn 2 i `docs/planer/sikkerhet-skyen.md`). Mange registrerte kontoer med falske landinger kan fortsatt flytte stoppen fram.
  - **Trykket i sjøen** (B3, 02.11.2026): gruppas fangst dag for dag er også åpen gruppes trykk på bestanden langs kysten (`trykkOpenScale` i `03g-trykk.js`), og de andre gruppene i kvotekjeden fisker sin kvote etter sedlene. Se 5.3d i `fiskerimodellen.md`.
  - **Kalibrering mot 2019–2026** (`k = 0,02`):
    - Med 2026-kvotene kommer stoppen i snitt 20. april (16. april i virkeligheten).
    - Rundt en tredjedel av årene har ingen stopp (3 av 8 år i 2019–2026).
  - **Lagring:** Året regnes ut dag for dag fram til i dag og lagres, så en varslet stopp står fast.
- **Ferskfiskordningen** (`ffPlan`, `ffPct`):
  - 20 % fra 29. juni.
  - Om høsten trekkes en endring etter historikken for 2017–2025:
    - økt til 30–50 % mellom 15. september og 25. november i rundt 70 % av årene
    - nedgang som i 2023
    - stopp som i 2019
    - ofte 10 % før jul
  - Kystposten melder endringene.
- **Rekkefølge ved levering:** ferskfisktillegget først, så kvoten, og resten inndras. Verdien av inndratt fisk trekkes fra.
- **§ 29 ved båtbytte:**
  - Det eieren har fisket i åpen gruppe i år, følger med til neste båt i åpen gruppe (`S.openUsed`).
  - En båt som tar over en hjemmel, starter året med det selgeren har fisket (`sellerCod`).
- **Registeret i lukket gruppe** (`REGN`, `npcReg`):
  - Torsk nord hadde 1 622 deltakeradganger per 17.10.2025. I spillet er de fordelt på hjemmelslengdene spillet selger, og hver har en NPC-eier.
  - Kjøper du en hjemmel, går eieren ut, så det blir én NPC mindre. Strukturering tar båten ut for godt.
  - Når spillet får ekte spillere på en felles server, tar de plassene til NPC-ene i det samme registeret (se veikartet i kapittel 9).
- **Kvotehandel** (Kvote-appen → Marked):
  - **Strukturkvote for 11–27,99 m** (J-244-2025):
    - Du kjøper en hjemmel i samme gruppe. Båten den hørte til, meldes ut av registeret over fiskefartøy (kvoteforskriften § 8; kondemnering kreves ikke lenger), og du får kvotefaktoren minus 10 %, for 20 år. (Teksten i Kvote-appen sa «hogges» til KM3, 10.11.2026.)
    - Kvotetaket er 5× egen kvote for 11–14,99 m og 6× for 15–27,99 m, regnet med egen kvote (§ 12, spesialist i én sektor: spillerens båter har bare torskesektoren). Det var 3× og 4× til KM1 (08.11.2026). Fiskeridirektoratets «Forslag etter høring» 11.09.2026 (kap. 4.2) beholder taket og legger bare til 4+2 og 5+3 for dem som fisker i begge sektorer.
    - Registeret mister én eier per strukturering (`regTake` i kjøpet i `ui/phone/14-act.js`). Til KM1 tok `structIn` én til, så hver strukturering tok to eiere ut; `structIn` tar ingen nå.
    - Når tiden går ut, går kvoten tilbake til gruppen (`structExpire`).
  - **Den særlige kvoteordningen under 11 m** (fra 2025): To egne båter med hjemmel, begge eid siden året før. Den ene oppgir hjemmelen og selges, og den andre fisker begge kvotene. Ingen avkorting, etter min lesning.
  - **Kvotesamarbeid (§ 31):**
    - Samarbeidet er med en NPC-eier, som mønstrer på (begge eierne skal være om bord).
    - Hans kvote kommer om bord for året, og han får halvparten av verdien av torsken som landes på den. Andelen er en antakelse.
    - Han går i land ved nyttår.
  - **Leie av kvote** er ikke med. Det er ikke lov å overføre fangst eller kvantum til en annen båt (§ 30).
  - **Kvotemarkedet mellom spillere, kjernen (KM1, rullet ut 08.11.2026 i bdb092d3, `core/03i-kvotemarked.js`):** rene funksjoner, ingen server og ingen vinduer ennå (KM2 og KM3).
    - Varene: en hjemmel (med strukturkvotene som følger den og årets fangst på den, `kmPack`) og en strukturkvote alene (med årene som er igjen og sin del av årets fangst). Aldri kilo. Den andre kvoten fra den særlige ordningen følger aldri med; den faller bort (kap. 2 § 6).
    - Taksten (`kmTakst`): en hjemmel er årets torskekvote × `KPK` (hele kilo, som `licValue`); en strukturkvote det samme for faktoren × år igjen / 20 (lineært, antatt). Grensene er Bs (`MB`): start fra 40 %, «Kjøp nå» opptil 160 %, neste bud 2 % over, «Selg nå» til registeret 90 %.
    - Hva som ikke kan legges ut (`kmWhy`): havtillatelser, den andre kvoten, båten på sjøen, losser eller lagt ut hos megleren, en hjemmel i kvotesamarbeid i år, en strukturkvote med under ett spillår igjen. Driftskravet (`drift`: ingen landing på hjemmelen i år eller de to foregående) er bygd, men av (`KM.drift`), fordi Fiskeridirektoratet tok det bort for kystflåten i «Forslag etter høring» 11.09.2026 kap. 2.2.2 (§ 8 gjelder bare trål, ringnot, reketrål nord og snøkrabbe). `sell` skriver `l.landY` (siste spillår med landing på hjemmelen) så det kan slås på.
    - Hva kjøperen kan (`kmBuyWhy`): blad B; en hjemmel settes på en båt uten hjemmel (ikke et havfartøy) eller struktureres inn på en båt i samme gruppe 11–27,99 m innenfor kvotetaket; en strukturkvote bare struktureres. Lengderegelen (utkastets § 6, uendret etter høringen): en hjemmel under 11, 15 eller 21 m fra en båt under den lengden kan ikke flyttes til en båt på eller over den. Spillet har ingen båt mellom 15 og 21 m, så en hjemmel 20–20,9 m går bare til `kyst21` (21 m) fra en båt på 21 m. Ingen landsdel (V5 A).
    - Selgerens side (`kmOut`): hjemmelen går ut, båten blir i rederiet uten den, og kvoten hennes starter på nytt. Kjøperens side (`kmApply`): satt på en båt blir hun lukket gruppe og starter året med det selgeren fisket (§ 29); strukturert får båten faktoren − 10 % i 20 år og strukturkvotene som de var, og selgerens fangst på hjemmelen i år legges til; en strukturkvote flyttes uten ny avkorting, med årene som før. Fiskeridirektoratet godkjenner ved oppgjøret og sender melding (ingen ventetid). Summen av kvotefaktorene står ved salg, bortsett fra avkortingen ved strukturering og den andre kvoten som faller bort.
    - Den ledige hjemmelen (`S.licFree`, `kmFree`): en hjemmel i rederiet uten båt i høyst to spillår (17 520 spilltimer; forhåndstilsagnet i utkastets § 7, «to år», beholdt etter høringen), så tilbake til registeret (`regFree`) med melding fra Fiskeridirektoratet. Fristen sjekkes ved nyttår og hver gang lista leses (KM3 leser den i Kvote-appen). Den kan legges ut eller settes på en egen båt. KM4 bruker `kmApply(item, {how:'free'})` når selgeren beholder hjemmelen.
  - **Kvotemarkedet på serveren (KM2, 08.11.2026, `supabase/migrations/20261108230000_kvotemarked.sql`, kjørt av Jonas i SQL-editoren samme kveld og sjekket i databasen):** hjemler og strukturkvoter selges i samme auksjonshus som båtene (`listings.kind` `right` og `struct`, `item` er varen fra `kmPack`), med de samme budene, det samme oppgjøret hvert minutt og den samme innboksen. Ingenting i spillet ennå (KM3).
    - **Varen bygges opp på nytt på serveren** (`km_item`), med bare feltene den kan ha; navn og spillere blir aldri med. Varens år må være den felles klokkas spillår eller ett fra (`km_year()` av `world_gh()`, som `land_put`). En strukturkvote har høyst 0,9 av hjemmelens faktor (§ 11) og høyst 20 år, og bare i gruppene fra 11 m (§ 9) og i hjemmelens egen gruppe; det en hjemmel bærer, holdes innenfor taket (4 ganger egen faktor på toppen for 11–14,99 m, 5 fra 15 m).
    - **Taksten på serveren** (`quota_ref`): kvotefaktoren × 2026-enheten for gruppa (`REG26.unit`) × 260 kr/kg (`KPK`), og en strukturkvote etter faktoren × år igjen / 20. Verdien spillet sender (`kmTakst`), må ligge mellom 0,3 og 2,5 ganger den (`km_band`), fordi enheten i senere år følger bestanden og KM5 lar kroneprisen gå 0,7–1,4. Samme tillit som Kystmegleren har til `vesselValue`.
    - **Grensene er Kystmeglerens:** start fra 40 %, «Kjøp nå» opptil 160 %, neste bud 2 % over, 1, 6, 24 eller 72 timer, høyst tre åpne oppføringer per spiller felles med båtene, gjester verken selger eller byr, ingen kan by på sin egen. Ingen leveringsavgift for kvoter. En strukturkvote med under ett spillår igjen kan ikke legges ut.
    - **Oppgjøret:** kjøperen får varen i innboksen (`right` eller `struct`, med varen), selgeren prisen minus 5 % (`paid`). En hjemmels plass i registeret (`reg_held`) flytter fra selgeren til kjøperen (`broker_reg_move`); en strukturkvote er ingen plass. Registeret selger som før (V3 A): `reg_take` og `reg_free` er uendret, uten grense per uke.
    - **Serveren krever ikke at selgeren har en plass i registeret** for hjemmelen. Spillet tar plassen bare når skyen er på og spilleren er logget inn, og et kjøp står i lagringen når registeret ikke har en eier igjen (`regSend` i `03d-quota.js`), så et slikt krav ville nektet ærlige spillere. En endret klient kan derfor legge ut en hjemmel den ikke har; det er samme tillit som for båtene.
  - **Kvotemarkedet i Kvote-appen (KM3, 10.11.2026, `ui/phone/04b-kvotemarked.js`, `ui/10t-kvotemarked.js`, `mbKm` i `core/09k-market.js`):** Kvote → Marked er Kvotemarkedet.
    - **Øverst den felles kvoten:** gruppekvoten for torsk i år og tonn per kvotefaktor for gruppene under 11 m, 11–14,9 m og 15–20,9 m, og hvor mange av hjemlene i registeret spillerne eier (summen av `REGN` er 1 566; planen sier 1 622, se backloggen).
    - **Fanene:** Registeret (det som sto under Marked før: eierne per hjemmelslengde, ukas selger, havtillatelsene, strukturering fra registeret, den særlige ordningen og kvotesamarbeid; `kvReg` i `04-kvote.js`), Hjemler, Strukturkvoter, Dine og Solgt (siste måned, prisen mot taksten, aldri hvem).
    - **Kortet og oppføringen:** hjemmelslengde, gruppe, kvotefaktor (med strukturkvotene en hjemmel bærer), årets kvote i tonn for torsk og den garanterte delen for hyse og sei, år igjen, landet på den i år, taksten, høyeste bud, «Kjøp nå» og tid igjen, med «Fiskeridirektoratet godkjenner ved oppgjøret».
    - **Kjøpet:** kjøperen velger båten før han byr: «Sett på» en båt uten hjemmel, eller «Strukturer inn på» en båt i samme gruppe, med faktoren den gir (−10 % i 20 år for en hjemmel) og kvotetaket vist; en båt som ikke kan, er grå med grunnen (`kmBuyWhy`). Valget huskes per oppføring i lagringen (`S.mkt.km.to`), så oppgjøret finner det også når spillet var lukket.
    - **Oppgjøret (`mbApply` ser på `r.lk` før båtlogikken):** kjøperens rad `right` eller `struct` går til `kmApply` med båten han valgte. En hjemmel som ikke lenger kan settes der (båten har fått hjemmel, er solgt, blad B mangler), blir en ledig hjemmel med melding. En strukturkvote som ingen valgt båt kan ta, holdes igjen: raden merkes ikke som gjort (`broker_done`), den står under «Venter på en båt» i Dine (`S.mkt.km.wait`), og tas når spilleren velger en båt som kan. Selgerens `paid` tar hjemmelen eller strukturkvoten ut av båten (`kmOut`) og låsen av; båten med samme id blir i rederiet. Lånene innfris ikke av et kvotesalg (båten er fortsatt rederiets). Spillet kaller verken `regTake` eller `regFree`: serveren flytter plassen.
    - **«Legg ut»:** varen, startpris og «Kjøp nå» innenfor 40–160 % av taksten (`kmBounds`), 1 time, 6 timer, 1 døgn eller 3 døgn. Selgerens nøkkel (`kmKey`): båtens id for hjemmelen, båtens id + `/` + hjemmelslengde og første år for en strukturkvote (`v3/h14.2031`), `f` + hjemmelslengde og timen den ble ledig for en ledig hjemmel.
    - **Låsen (valgt uten å spørre):** mens hjemmelen eller en strukturkvote ligger ute, ligger båten til kai (`b.sale` med `km`, som en båt hos Kystmegleren), fordi varen er pakket med det som var landet på den da den ble lagt ut; fisket hun videre, ville de samme kiloene ikke komme med til kjøperen. Båten kan da heller ikke legges ut hos megleren, byttes inn, struktureres på eller gå i kvotesamarbeid. Lasterommet må være tomt (fangsten levert) og driftsplanen av før noe legges ut. Én vare per båt om gangen, og høyst tre oppføringer i alt, felles med båtene. Låsen settes før kallet til serveren og tas av om det feiler, og hver gang lista leses, holdes låsene mot serverens liste over det rederiet har ute (`heal` i `10t-kvotemarked.js`): en åpen oppføring uten lås i lagringen (siden ble lukket før svaret kom, eller en eldre lagring fra en annen enhet) låses igjen, og en lås uten oppføring tas av, aldri for en som er solgt (da gjør `paid`-raden begge deler). En ledig hjemmel som ligger ute, går ikke tilbake til registeret selv om fristen går ut mens salget pågår (`kmFree`).
    - **«Selg nå til registeret · 90 %»** (`kmQuick`, V3 A): en hjemmel (med strukturkvotene på den) går tilbake til registeret med en gang (`regFree`), og båten blir i rederiet. En strukturkvote alene kan ikke selges til registeret (den er ingen plass der).
    - **Den ledige hjemmelen** vises i Dine med fristen; den kan settes på en båt eller struktureres inn (uten server), legges ut eller selges til registeret. `kmFree` kalles hver gang Marked tegnes.
    - **«Ønsket hjemmel»** (`km_wish_set`): hjemmelslengde, slag og høyeste pris; varsles i Meldinger mens spillet er åpent og som push fra serveren ellers.
    - **Driftskravet står av** (Jonas 10.11.2026, valg 15 A: «driftskravet står av, som i virkeligheten»).
    - Uten skyen (testene, uten nett) har markedet bare registeret, og sidene sier at markedet mellom spillere trenger nett og innlogging. En gjest kan se, ikke handle.
    - Gjennomgangen (`/code-review` medium, 10.11.2026) fant ti ting; alle rettet: fangst i rommet kunne landes etter at hjemmelen var pakket (nå `hold` i `kmPutWhy`), en ledig hjemmel kunne gå til registeret mens den lå ute, låsen ble satt etter svaret (og aldri gjenopprettet), to ledige hjemler fra samme time delte nøkkel (`kmFreeAdd` flytter `H0` en time), `buylic` med innbytte manglet vakten, en ventende strukturkvote ga spørring hvert minutt uten lagring, en 404 for kvotemarkedet slo av megleren også, og feiltekstene sa «henne» og «Kystmegleren».
    - Tester: `tests/kvotemarkedtest.py` (29 sjekker med stikkprøvene, skyen stubbet) og `tests/unit/market3.test.mjs` (34 sjekker, sett rød uten `lk`-sjekken i `mbApply`: da ble båten solgt som båt).
  - **Båten med eller uten hjemmelen (KM4, 11.11.2026, `core/09k-market.js`, `ui/phone/13c-megler.js`, `11-rederi.js`, `14-act.js`; Jonas 07.11.2026, valg 10: «V2, a»):** selgeren velger om hjemmelen følger båten (overtakelse for fortsatt drift) eller blir i rederiet (utskiftning, eller ledig i høyst to spillår).
    - **«Legg ut til salgs» hos Kystmegleren:** en båt med hjemmel har valget «Hjemmelen følger med» (som før; strukturkvotene følger hjemmelen) eller «Uten hjemmel». Uten velges det hvor hjemmelen skal: «Ledig hjemmel» eller «Flytt til «båt»» for hver annen egen båt, grå med grunnen når den ikke kan ta den. Verdien, grensene 40–160 % og startprisen følger valget (uten hjemmel er verdien skroget). Hjemmelen flyttes **før** `listing_put` kalles (`MBC.put(…, keep)` i `ui/10s-broker.js`), så den har en annen nøkkel enn båten på serveren, og pakka (`mbPack`) har da `lic: null`. Serveren trenger ikke noe nytt felt: kortet leser `vessel.lic`.
    - **Sier serveren nei** (`listing_put 4xx/5xx`), settes hjemmelen tilbake (`undo` fra `mbMove`). Kommer det ikke noe svar, spørres lista: har serveren båten ute, låses hun slik serveren har henne, og hjemmelen blir der den ble flyttet; svarer heller ikke lista, blir hjemmelen der den ble flyttet, og siden sier at den kan settes tilbake i Rederi (satt tilbake på en båt som selges uten den, ville den blitt borte med båten).
    - **Kortet** i Kystmegleren og i verftets «Båter til salgs her» sier «Hjemmel følger med» med hjemmelslengden, eller «Uten hjemmel», for alle båter og også for kjøperen. Oppføringen uten hjemmel sier hva det betyr (åpen gruppe under 11 m, ellers bare bifangst, og at en hjemmel kan kjøpes i Kvotemarkedet). Selgerens rad i Rederi sier «Til salgs hos Kystmegleren uten hjemmel» (`b.sale.kept`). Usolgt eller trukket: meldingen og toasten sier at hjemmelen kan settes tilbake med «Flytt hjemmelen til …».
    - **«Flytt hjemmelen til …»** (Rederi «⋯» på en båt med hjemmel; de ledige hjemlene står på et eget kort under flåten med «Flytt til …»): hjemmelen flyttes med strukturkvotene, årets fangst på den og kjøpsåret til en annen egen båt, eller blir ledig hjemmel; en ledig hjemmel settes på en båt. Det koster ingenting og skjer med en gang, med melding fra Fiskeridirektoratet. `mbMoveWhy` gir grunnen: båten må ligge i havn, ikke losse, ha tomt rom og driftsplanen av, ikke ligge til salgs, ikke være i kvotesamarbeid i år; mottakeren kan ikke ha hjemmel, ligge til salgs eller være en havbåt; og **lengderegelen** (`kmLenWhy`, utkastets § 6): en hjemmel under 11, 15 eller 21 m fra en båt under den lengden kan ikke flyttes til en båt på den lengden eller mer. Registeret røres ikke (samme eier).
    - **Den andre kvoten fra den særlige ordningen (`two`) faller bort** ved båtsalg, flytting og innbytte (kvoteforskriften kap. 2 § 6: «Ved tildeling av deltakeradgang ved salg av fartøy for fortsatt drift, ved utskifting av fartøy eller til erstatning for tilsvarende deltakeradgang, faller kvote for deltakeradgang som er oppgitt etter § 4 annet ledd bokstav c bort»; lest på Lovdata i planen 07.11.2026). `mbLicSold` tar den ut av pakka, og selgeren får det sagt før det bekreftes: i skjemaet, i flyttearket (med et spørsmål før flyttingen) og i raden ved innbytte. Før fulgte den med til kjøperen.
    - **Verdien ved salg** (`mbValue`, `mbLicKr`, `mbQuick`): uten den andre kvoten og uten partnerens kvote i et kvotesamarbeid i år, som kjøperen heller ikke får (før var begge med i verdien serveren fikk, men ikke i pakka). «Selg nå til Kystmegleren» og innbyttet på verftet regner med samme verdi.
    - **Innbyttet på verftet:** arket for båten som kjøpes, har raden «Hjemmelen ved innbytte» med «Følger innbyttebåten» (som før) eller «Behold som ledig hjemmel», og innbyttet er priset etter valget (`tradeIn` i `10-fartoy.js`, raden `tiLicRow` i `13c-megler.js`). Valget gjelder arket det tas på.
    - **Valgt uten å spørre:**
      - **Åpen gruppe samme år:** tas hjemmelen av den siste båten med hjemmel, begynner rederiets båt i åpen gruppe med det som alt er fisket på hjemmelen i år (§ 29: eierens fangst følger eieren). Ellers kunne samme år fiskes to ganger ved å ta hjemmelen av og sette den på igjen.
      - **Tilsagnet er to år én gang:** en ledig hjemmel som settes på en båt og tas av igjen uten at noe er landet på den, beholder den gamle fristen (`lic.fu`). Er det landet på den, er den i bruk, og et nytt tilsagn er to nye år.
      - **Mottakeren trenger ikke ligge i havn.** Kilden må.
      - **Flyttingen går med en gang**, uten saksbehandlingstid (Friction for Flow: ingen ventetid som ikke finnes av en annen grunn).
    - Gjennomgangen (`/code-review` medium, 11.11.2026) fant ni ting. Rettet: åpen gruppe samme år, svaret som forsvant, tomt rom og driftsplanen av, en angring som bare reverserer flyttingen (det som ble landet eller kjøpt mens serveren ble spurt, står), tilsagnets frist, valget ved innbytte som ble hengende, teksten for driftskravet. Ikke rettet: lånetaket i `deal()` regner flåten med `vesselValue` (med den andre kvoten), i `core/03-simulation.js`, som HS4 eide da (backloggen «KM4»).
    - Utenfor stegets filliste, så lite som valget trengte: `ui/10s-broker.js` (`put` tar hvor hjemmelen blir) og `ui/phone/10-fartoy.js` (to linjer: `tradeIn` og raden).
    - Tester: `tests/unit/market.test.mjs` (`two` sett rød mot den gamle `mbPack`, så grønn) og `market2.test.mjs` (flyttingen, lengdegruppene 11, 15 og 21 m, ledig hjemmel i to spillår, angringen; rettingene etter gjennomgangen sett røde mot commiten før), og `tests/megletest.py` (14 nye sjekker, skyen stubbet, bilder i begge formater). Reglene er nasjonale (én hjemmel, én logikk, ingen posisjon i dem), så stikkprøver langs kysten er ikke gjort; enhetstestene dekker lengdegruppene.
  - **Resten av kvotemarkedet** (KM5 kvoteprisen som lever og målingen) er planlagt (`docs/planer/kvotemarkedet.md`, steg 64 i køen). Jonas' valg 07.11.2026: «V1, a», «V2, a», «V3, a», «V4, anbefalt», «V5, a». Det betyr at hjemler og strukturkvoter handles, aldri kilo; at selgeren velger om hjemmelen følger båten; at registeret selger som i dag; at taksten skal følge torskeprisen og kvoteutsiktene; og at det blir ett nasjonalt marked.
- **Kvote-appen:** fanene Mine kvoter, Åpen gruppe (gruppekvote, fisket så langt, stopp, økninger og ferskfisk), Bestand (graf over gytebestand og totalkvote med B_pa og B_lim) og Marked. Fra KM3 (10.11.2026) er Marked Kvotemarkedet (`ui/phone/04b-kvotemarked.js`): den felles kvoten øverst og fanene Registeret, Hjemler, Strukturkvoter, Dine og Solgt; handlingene begynner på `km` og går til `kmAct` (`14-act.js`). Se 5.5, «Kvotemarkedet i Kvote-appen».
- **Kystposten:** stoppvarsel og stopp, økning, fritt fiske, endringer i ferskfiskordningen, kvoterådet for neste år (26. juni), totalkvoten (17. oktober) og reguleringen for neste år (19. desember).
- **Kvoteprisen** (`KPK`) står på 260 kr/kg. Jeg fant ingen kilde for kvotepriser (se kapittel 10). Med større kvoter i 2027 koster hjemlene mer, og inngangen til lukket gruppe kommer litt senere i `progweek`.
- **Blad B** (`BLADB`, `S.fm`, `fmLand` i `sell()`): Deltakerloven § 6 krever at den som får ervervstillatelse, har drevet ervervsmessig fiske i minst tre av de siste fem årene (lov 26. mars 1999 nr. 15, Lovdata). Blad B i fiskermanntallet er det vanlige beviset. I spillet er det forenklet til 10 landingsdager med deg om bord og 1 G i førstehåndsverdi (136 549 kr, G fra 1. mai 2026, nav.no/grunnbelopet). Fiskeridirektoratet sender melding, Papirer i Kvote-appen har et kort med fremdriften, og en båt med hjemmel krever blad B. Gamle lagringer får det fra sluttsedlene, eller med en gang hvis de har en hjemmel.
- **Finansiering** (`deal()`, `finance()`, `payDown()` i `core/03-simulation.js`):
  - Kystbanken låner inntil 80 % av prisen til 6,9 %, over 15 år for båt med hjemmel og 10 år ellers, og krever tre sluttsedler.
  - Innbytte og salg innfrir lånene først, og bare resten teller som egenkapital (smutthullet fra spilltest 1 er tettet). All gjeld til sammen holdes innenfor 80 % av verdien på flåten med den nye båten.
  - Innovasjon Norge toppfinansierer det første kjøpet i lukket gruppe med et risikolån på 15 % (`INN`) til 8,9 % over 10 år (`S.loanIN`, eget kort i Bank). Da trengs 5 % egenkapital, rundt 61 000 kr med skiffen i bytte. Vilkårene er ikke sjekket, og andelen er satt med `progweek.py` slik at inngangen kommer sammen med blad B.
- **Ikke med i spillet:** Alderstillegg, fordi spilleren ikke har noen alder, og kystfiskeordningen, som gjelder Sørreisa men ikke Finnsnes.
- **Kveite, høstingsforskriften § 39:**
  - Fredet nord for 62° N fra 20.12 til og med 20.4, for alle redskaper.
  - Minstemål 84 cm, minstevekt 7,2 kg ved salg.
  - Kveite over 200 cm skal slippes.
  - Ingen kvote.
- **Uer:** Direktefiske bare med juksa i juni–august for båter under 15 m.

## 5.5b Havtillatelsene og kvotefaktorene (H1 av `docs/planer/havsteget.md`, 03.11.2026)

Jonas 03.11.2026: «Start H1». Valgene samme dag: «Ja, du kan gjerne lage autolineren først» (V1 A), og «Prisene må reflektere det virkelige liv, og tillatelsene må også være realitiske. Husk: vi lager en simulering av fiskerinæringen i norge, og da må vi være så tett opp mot realiteten som mulig» (V2 B: ekte nivå, V3 A: tillatelsene som i virkeligheten). Koden er i `core/03d-quota.js` (`HAVLIC`, `HREG`, `HAVKF`, `HPK`, `havQ`, `havGroup`, `havOffer`, `havValue`, `havPrice`, `havLicWhy`, `havLicTake`).

- **Tillatelsene:** én per gruppe, med kvotefaktor.
  - **Torsketråltillatelse** (`tral`, konsesjonsforskriften § 2-1) for frysetråleren. Per kvotefaktor 1,00 i 2026: 372 t torsk, 332 t hyse og 422 t sei (J-161-2026 §§ 7–9).
  - **Konvensjonell havfisketillatelse** (`konv`) for autolineren: 118 t torsk og 107 t hyse per faktor. Sei 272 t gjelder bare med garnseitillatelse, som spillet ikke har. Uten den har sei ingen fartøykvote her (antatt). Snurrevad over 28 m legges hit til regelen er funnet.
  - **Ringnottillatelse** (`rnot`, § 4-1) for de to notbåtene: NVG-sild, 49 % av Norges 342 666 t fordelt på 69 tillatelser. Én faktor er her snittillatelsen; den virkelige følger konsesjonskapasiteten i hl (antatt).
  - **Snøkrabbetillatelse** (`krab`): fartøykvoten regnes av årets regler (H3a, under): 351 t pluss 82 t for levende i 2026, 433 t pluss 110 t i 2027 (forslaget), deretter av spillets bestand. Alle har samme kvote (`flat`, ingen kvotefaktor).
- **Fartøykvoten** er kvotefaktorene (egne pluss struktur, `l.extra`) ganger kvoten per faktor for året. `licQ` gir den for en havtillatelse i samme form som for kystens hjemler, så salget, Kvote-appen og torskegrensa (`codLimits`) virker som før.
- **Gruppedelingen** (J-161-2026 § 5, `havGroup`):
  - Torsk følger kvotekjeden. Trålstigen gir 32 535 t (torsketrål 31 785 og seitrål 750), og 12,81 % gir 10 717 t til havfiskeflåten, begge eksakt for 2026.
  - Hyse og sei følger Norges kvote, sild står som 2026, og snøkrabbe følger totalkvoten.
- **Registeret** (`HREG`, i samme register som hjemlene, `npcReg`):
  - **Antallet er som i virkeligheten:** 26 konvensjonelle havfiskefartøy (Fiskeridirektoratets høringsnotat 26.03.2026, tabellen for 2025) og 36 torsketrålere (snl.no 2019, ikke bekreftet for 2025). I tillegg 69 ringnottillatelser (21.10.2025) og 30 snøkrabbetillatelser (Fiskeridirektoratets sak 17/2026: 70 i 2024, 30 fra 2025; H3a 06.11.2026, før 34, regnet ut). En gammel lagring med 34 får 30 (`npcReg`), og migreringen `20261106120000_snokrabbe_30.sql` satte 30 på serveren (kjørt av Jonas i SQL Editor 06.11.2026). `npcReg` tar dessuten aldri mer enn `HREG` fra serverens register.
  - **NPC-skipene:** for hver tillatelse en spiller eier, er ett NPC-skip av samme slag borte fra havet (`havHeld` i `05d-hav.js`, Jonas' regel). NPC-havflåten har flere skip enn tillatelsene, fordi reketrål, seitrål og andre tillatelser fisker ved siden av.
  - **Serveren:** `supabase/migrations/20261103180000_havkonsesjon.sql` legger de fire i `reg_rights`. `reg_take` og `reg_free` virker som for hjemlene.
  - **En gammel lagring** får havtillatelsene fulle.
- **Tilbudet** (`havOffer`): ukas selger er en NPC-eier med sine kvotefaktorer, 0,6–1,4 ganger gruppas snitt.
  - Snittet er 2,37 for torsketrål (85,4 faktorer på 36 tillatelser) og 3,49 for konvensjonelt hav (90,8 på 26), strukturkvotene medregnet.
  - Tilbudet er det samme hele uka.
- **Prisen (V2 B):** skroget (dagens 60–250 M er brukte skrog) pluss kvotene til sin verdi (`havValue`, `HPK`).
  - Torsk koster 260 kr/kg (`KPK`, som for kysten). De andre artene koster i forhold til førstehåndsprisen mot torsk: hyse og sei 124, sild 74 og snøkrabbe 712 kr/kg.
  - En snittillatelse blir rundt 155 MNOK for konvensjonelt hav og 450 MNOK for torsketrål. Autolineren med ukas tillatelse koster for eksempel 208 MNOK.
  - Ingen kilde oppgir kvotepriser for havflåten. Nofima 2018 og avisene («Østerfjord» med kvoteverdier over 400 MNOK) peker samme vei. Sild og snøkrabbe er mest usikre: strukturkvote i ringnot skal gå for godt over 100 MNOK per 100 basistonn. Det må sjekkes før H3 og H5.
- **Kjøpet** (`buy` i `ui/phone/14-act.js`): en havbåt krever blad B (som lukket gruppe) og en ledig tillatelse i registeret. Prisen er `havPrice`, og tillatelsen tas fra eieren (`havLicTake`) og legges på båten (`S.lic` med `hav:true`). Fiskeridirektoratet sender melding. Ved innbytte går tillatelsen tilbake til registeret, som hjemlene. Båtene står fortsatt som `lock:true`, så kjøpet åpner først når H2 låser opp autolineren.
- **Det spilleren ser:**
  - Kvote-appen → Marked har kortet «Havtillatelser» med eierne igjen og kvoten per faktor for året.
  - Båthandelen → Havfiske har seksjonen «Tillatelse» på databladet: selger, kvotefaktor mot snittet, fartøykvoten og gruppa per art, kvoteverdien mot skroget, ledige i registeret og kilden.
  - Mine kvoter viser tillatelsen og kvotefaktoren for en havbåt.
- **Ikke med ennå:** Kystvaktas havsjekker (trål innenfor 12 nm, maskevidde, rist) kommer med redskapet i H2 og H4, fordi ingen havbåt kan fiske før da. Heller ikke med er strukturkvote og eiertak for havtillatelsene (konvensjonelt hav 10 %, § 12). `access()` gir fortsatt `lukket` for en havbåt, så landingene teller i lukket gruppe på serveren; det må skilles ut i H2.
- **Snøkrabben fra H3** (planen `docs/planer/havsteget-h3-snokrabbe.md`, valgene 06.11.2026; bygd i H3a samme dag, se «Snøkrabben i H3a» under): registeret skal ha 30 tillatelser, ikke 34 (Fiskeridirektoratets sak 17/2026), og alle har samme kvote, uten kvotefaktor. V4 (Jonas: «Gjør det som blir mest riktig, og passer spillet i et fremtidsperspektiv.»): reglene står per år som data (totalkvoten, avsetningen til levende levering, forskningskvoten, overreguleringen og kvotefleksen fra J-meldingene), fartøykvotene regnes av dem med de 30 tillatelsene (2026: 351 t pluss 82 t; 2027 etter forslaget om lag 433 t pluss 110 t), kvotefleksen på fartøynivå (10 %, fra 2027/2028) føres i lagringen, og totalkvoten etter siste kjente år følger spillets egen bestand, som torsken (`STOCK`, `stockYear`). V6 B: tillatelsen prises etter det driften kan bære (driftsoverskuddet før avskrivninger fra lønnsomhetsundersøkelsen og prisene over flere år, ganget med et antall år), og ikke med `HPK.snokrabbe` (712 kr/kg), som ingen kilde støtter.
- **Tester:** `tests/unit/havlic.test.mjs` (kvoten per faktor mot J-tabellen, gruppene, kjeden, faktorene og prisene, registeret ned og opp, ett NPC-skip borte) og `sqltest` (registeret på serveren).

### Snøkrabben i H3a (06.11.2026, grenen `ccr-1c785ad6-0di8o1`, rullet ut samme dag i 8982db93)

Jonas' V4: «Gjør det som blir mest riktig, og passer spillet i et fremtidsperspektiv»; V6: B. Koden er i `core/03d-quota.js` (`SNOREG`, `snoYear`, `snoQuota`, `snoRoom`, `snoFlexNewYear`, `SNOV`, `snoLicValue`, `STOCK.snokrabbe`), `core/03-simulation.js` (`quotaState`) og `ui/08-actions.js` (`landConf`, `sell`).

- **Reglene per år som data** (`SNOREG`): totalkvoten, avsetningen til levende levering, forsknings- og forvaltningskvoten, overreguleringen og kvotefleksen fra hver J-melding, og de 30 tillatelsene. Fartøykvotene regnes av dem, i hele tonn som forskriften gir dem: ordinær (totalkvote − levende − forskning) / 30 × (1 + overregulering), tilleggskvote levende / 30.
  - **2026** (J-237-2025 §§ 2–4, lest): 12 336 t, 2 460 t til levende, 300 t forskning, 10 % overregulering: 351 t og 82 t, som § 3 og § 4. Kvotefleksen gjelder totalkvoten, ikke fartøyet.
  - **2027:** totalkvoten 16 594 t er fastsatt (28.10.2026); resten er Fiskeridirektoratets forslag (sak 17/2026, lest): ingen overregulering, 20 % (3 300 t) til levende, 10 % kvotefleks på fartøynivå fra 2027/2028: 433 t og 110 t («om lag 430» og «om lag 110» i saken). Forskriften for 2027 legges inn som en ny rad i desember.
  - **Etter 2027:** totalkvoten er spillets bestand (`stockYear('snokrabbe', y)`), 20 % til levende og resten som siste rad.
- **Bestanden** (`STOCK.snokrabbe`, `idx`): B/BMSY fra HIs SPiCT-modell (Rapport fra havforskningen 2026-54, tab. 6, lest: 0,24 i 2017, 1,13 i 2023, 1,58 i 2024, 1,70 i 2026, 1,78 i 2027; 2018, 2020 og 2022 mellom naboene) og totalkvotene 2017–2026 (tab. 5: 4 000 t i 2017, 9 758 i 2024, 12 019 i 2025, 12 336 i 2026), rådet 16 594 t for 2027, MSY Btrigger 0,5 og Blim 0,3. Modellen etter 2027 er torskens, med `Bm` 1,6 (antatt: nivået med fiske på rådet), `sd` 0,15, ingen grense på endringen fra år til år (rådet har ingen) og kvoten lik rådet (`slack` 0). Med frøet 0 gir den 18 000 / 17 000 / 16 800 / 15 800 / 15 000 t i 2028, 2029, 2030, 2032 og 2035. Bestanden virker på krabba i sjøen (`stockF`). Den er en indeks, ikke tonn, så flåtetrykket (`trkBiomass`) bruker den ikke.
- **Kvotefleksen** (`snoFlexNewYear`, i lagringen på tillatelsen, `S.lic.flex`): ved årsskiftet godskrives det som ble stående ubrukt, eller belastes det som ble fisket over, høyst 10 % av fartøykvoten, fra 2027/2028. I året kan fartøyet fiske inntil 10 % over kvoten (`snoQuota().max`), og det trekkes året etter.
- **Landingen** (`landConf`): snøkrabbe over kvoten med fleksen inndras; resten går på kvoten i rund vekt (`quotaState().snokrabbe`). I H3a landes alt hel og fryst på den ordinære kvoten; tilleggskvoten for levende krabbe kommer med tankene i H3b. Målt i `snokrabbetest`: 500 t i mars 2027 gir 476 t kvoterom (433 t og 10 %) og 4,7 % inndratt.
- **Tilleggskvoten i H3b** (06.11.2026, grenen `ccr-2f1306ed-u6tdgs`; `snoLandQ` i `core/10e-krabbefabrikk.js`, `landConf` og `sell` i `ui/08-actions.js`): levende krabbe fra tankene går først på tilleggskvoten (J-237-2025 § 4: «en garantert kvote på 82 tonn til levering av levende snøkrabbe»; 110 t i 2027 etter forslaget), ført i `quotaState().snoTq`; resten av den levende krabben, de fryste klørne og den døde krabben går på fartøykvoten med fleksen, og det som er over, inndras. Sedlene 2025 og 2026 har 29–32 % av den levende krabben på tilleggskvoten («Tilleggskvote», kvotetype 15) og resten på vanlig kvote; den døde krabben på levendelandingene står på begge. I spillet går den døde krabben alltid på fartøykvoten (forenklet). Klørne regnes om til rund vekt med årets faktor (1,49 fra 2026, `snoUh`). Kvote › Mine kvoter viser for snøkrabbetillatelsen det som er landet på fartøykvoten, fartøykvoten med fleksen fra i fjor, hvor mye fartøyet kan fiske over, det som er igjen, og tilleggskvoten brukt mot årets (H3a viste torskekvoten der). Sedelen (`S.lastSale.sno`, `det.sno`) har tonnene på hver kvote.
- **Tillatelsen** (`havOffer`, `havValue`): ingen kvotefaktor (`flat`), og verdien er det driften kan bære (V6 B, `snoLicValue`): inntekten med årets kvoter og snittprisen 2024–2026 (fryst 68,90, 130,68 og om lag 120 kr/kg rund vekt; levende 63,68, 82,41 og 71,23 kr/kg; Fiskeridirektoratets sak 17/2025 og et søkeutdrag for 2026), minus mannskapet (spillets 35 %) og kostnadene fra lønnsomhetsundersøkelsen 2024, gruppe 014 (alle kostnader utenom mannskapet, 39,6 MNOK, minus avskrivninger på 4 MNOK, antatt, og lagt på snøkrabben etter dens del av inntekten, 86 %), ganget med 7 år (nåverdien av ti år med 7 % rente; vårt valg). For 2027: inntekt 54,1 MNOK, kostnader 30,6 MNOK, 4,5 MNOK i året og en verdi på 31,6 MNOK; med skroget 91,6 MNOK. `HPK.snokrabbe` (712 kr/kg) brukes ikke lenger for snøkrabben. Ingen salgspris er funnet, så tallet er et anslag. Det er svært følsomt for prisen: med prisene for 2025 alene blir driftsresultatet om lag 12 MNOK og verdien om lag 84 MNOK; med prisene for 2024 alene er den 0.
- **Kjøpet:** `lock` er tatt av snøkrabbefartøyet. Båthandelen viser kvoten «lik for alle 30 tillatelsene», tilleggskvoten, kvotefleksen og verdien med driftsresultatet.

## 5.5c Autolineren: § 26, sei, lange og brosme (H2a av `docs/planer/havsteget-h2-autoline.md`, 05.11.2026)

- **J-187-2026** (gjeldende fra 26.10.2026) har erstattet J-161-2026; alle henvisningene i koden er byttet (`RU_J187`). Paragrafene og leddene er de samme (§ 32 tredje ledd for 28 m og over, sjekket i teksten 05.11.2026).
- **Høstingsforskriften § 26** (`rulesAt`, `F26`, `f26In`): fartøy over 21,35 m med egnemaskin om bord (`q.egn`, fra `BOAT.autoHooks`) kan ikke sette line innenfor 4 nm av grunnlinja langs fastlandskysten (ikke Svalbard og Jan Mayen), og innenfor 10 nm i tre felt: Finnmark og Troms (20°–21° 30′ Ø) og Troms (69° 30′–70° 09′ N) 1.9–31.12, Nordland (67° 30′–69° 20′ N) 1.9–30.4. Feltene ligger mellom endelinjene fra forskriftens punkter, og 4–10 nm fra grunnlinja. Unntaket for fløytline etter hyse er ikke med (spillet har ikke fløytline). Varsel og stopp som de andre reglene (`f26`, `f26b`).
- **Sei uten garnseitillatelse** (`HAVBY`, `landConf`): 25 % av landingen som bifangst (J-187-2026 § 14). De 50 % mens garnseifisket er åpent, er ikke med. Hyse og torsk har ingen bifangst ut over fartøykvoten (§ 14).
- **Lange og brosme for 28 m og over** (`lbShare`, `lbStop`, `lbNews` i `03d-quota.js`; J-128-2026 og Fiskeridirektoratets forslag for 2027, sak 15/2026 i reguleringsmøtet 4.–5.11.2026): lange inntil 35 % av hver fangst og landing hele året, brosme fritt til gruppekvoten er tatt (stoppen trekkes hvert år mellom 6. august og 11. september, som 2026 og 2025) og deretter 15 %. Fiskeridirektoratet varsler stoppen tre dager før. Regler-appen viser det (`lb28`). Andelen sjekkes ved landing, ikke per hal.
- **Landingene fra havbåtene** sendes til den felles verden som egen gruppe (`hav`; serveren fører dem som `none`), så de ikke teller i lukket gruppes toppliste og ukas beste fisker.

## 5.28 Regelmotoren langs hele kysten (R2 av regelplanen, 05.10.2026)

- **Blåkveite (07.10.2026):** for line og garn (eller arten) nord for 62° N på 400 m og dypere: `bk5o` (åpent, med perioden og maksimalkvoten), `bk5c` (stengt: bare bifangst, 7 %), `bkB` (uten blad B), `bk7` (28 m og over: bare bifangst). Dypere enn 1000 m blokkeres bunnredskap (`bk1000`: «nye fiskeområder» krever egen tillatelse etter forskrift om bunnredskap). Minstemål 45 cm i `ruMinSize`. Regler-appen har arten som eget valg.

`core/03e-rules.js` leser `src/data/rules.json` (se 4.17) og svarer på «kan jeg fiske her?».

**Oppslag:**
- `rulesAt({p, H, len, gear, sp, hand})` gir `{v, items}`. `v` er det verste av `no`, `warn` og `ok`. Hver grunn har tekst på norsk og engelsk, paragraf og kilde, og `block` når spillet stopper deg i dag.
- `ruBlockMsg(q)` gir teksten for det første stoppet, eller `null`.
- `insideFjord(p)`, `insideBaseline(p)`, `blDist(p)`/`blNm(p)`, `ruHom(p)`, `ruLok(p)`, `fjordLimits(p, H)` og `ruMinSize(sp, p)`.
- **Hurtigoppslaget:** Sonene og grunnlinja legges i celler på 100 m, en blokk på 10 km om gangen første gang den trengs. Det gjøres med skannlinjer over ringene. 20 000 oppslag tar noen få millisekunder.

**Reglene, skrevet ut fra forskriftene:**
- **Høstingsforskriften § 31:** Fartøy på 15 m eller mer kan ikke fiske torsk innenfor fjordlinjene.
  - Under 21 m kan de fiske andre arter med konvensjonelle redskap (bokstav h).
  - Sør for 68° 15,6′ N kan de fiske annet enn torsk (bokstav a).
  - Ellers er det ikke lov.
- **§ 33 og § 33a:** høyst 5 000 kroker og 80 torskegarn innenfor fjordlinjene. Fra 1.11 til 30.4 er yttersidene av kroklinjene i seks fjorder i Finnmark unntatt krokgrensa.
- **J-161-2026 § 32**, nord for 62° N med konvensjonelle redskap:
  - **21–27,99 m:** ikke torsk, hyse eller sei innenfor grunnlinja.
    - I område 00, 06 og 07 gjelder forbudet bare torsk.
    - Torsk er lov inn til fjordlinjene 1.1–1.5 i 00, og 1.1–10.4 i 06 og 07.
  - **28 m og over:** ikke innenfor 4 nm.
    - I 06 og 07 gjelder det bare torsk.
    - I 00 er hyse og sei lov utenfor linja i Vestfjorden (og torsk 1.3–14.4), men ikke innenfor fjordlinjene.
    - Fra område 05 til Russland er det lov inn til grunnlinja 1.1–30.6.
    - Øst for Darupskjæret er det lov inn til 2 nm 1.7–31.12.
  - **Henningsværboksen** er stengt 1.1–30.6 for fartøy over 11 m.
  - **Borgundfjorden** er stengt 1.3–31.5, unntatt for håndsnøre.
  - **Bifangst:** Grensene på 5 % og 20 % vises som advarsel.
- **De andre områdene:**
  - stengte felt for line og garn
  - gytefeltene for kysttorsk i sør, 1.1–30.4
  - Oslofjorden: ikke torsk, og bare håndholdte redskap for fisk
  - nullfiskeområdene og Lopphavet
  - Raet, som gir en advarsel
  - de fleksible felleshavene i Lofoten: faste redskap skal være om bord kl. 10–17
- **§ 39:**
  - Kveite er fredet 20.12–20.4 nord for 62° N og hele året sør for.
  - Uer er bare lov med juksa fra båt under 15 m, 1.6–31.8.
  - Disse to stopper ikke spillet ennå. `kveiteClosed` og `uerOpen` i simuleringen styrer det som før.
- **§ 47:** minstemål etter sted for torsk, hyse, sei, kveite og uer. Taskekrabben er ute av spillet fra 04.10.2026.
- **Kongekrabbe** (J-136-2026 og J-138-2026 fra Fiskeridirektoratet, § 2 er lik i begge; `kcQuota` og regelene `kc2`, `kc10` og `kc5`):
  - **Kvoteområdet** ligger øst for linja ved 26° Ø, med hele Porsangerfjorden, Kamøyfjorden og Magerøysundet sørøst for linja. Bare båter registrert i Finnmark, med eier bosatt der i minst to år, kan fiske der. Spilleren er fra Senja, så svaret er «Nei».
    - `kcQuota(ll)` er en tilnærming til linjene i lat/lon: øst for 26° Ø opp til 71°30′ N, og vest for 26° Ø havet sør for Magerøya (øst for 25°32′ Ø sør for 71,02° N, øst for 24°51′ Ø sør for 70,93° N). Det er ikke de nøyaktige punktene i § 2.
  - **Fritt fiske vest for linja** (J-138 § 5): ingen kvote og intet minstemål, men all kongekrabbe som fanges, skal landes (det er forbudt å sette den ut igjen), og teinene skal være uten fluktåpning.
  - **Stengt 1.–9. november 2026** i boksen 71°09′–71°14′ N, 25°20′–26° Ø (J-138 § 10).
  - Om det finnes et tak på antall teiner i fritt område, er ikke sjekket.
- **Høstingsforskriften § 27** (H3a 06.11.2026, lest; `f27`, `f27b`): fartøy over 21,5 m kan ikke fangste med teiner etter kongekrabbe «eller annen krabbe» innenfor 4 nm av grunnlinjene langs kysten fra Sverige til Russland, og fartøy over 21,35 m ikke innenfor 6 nm av grunnlinjene i Finnmark (hovedområde 03 og 04) fra 1. november til 31. mars. Ingen av spillets kystbåter er så store ennå (kyst21 er 21 m), og snøkrabbefartøyet kan ikke rigges for kongekrabbe, så regelen venter på en større kystbåt.

**I spillet:**
- **Juksa:** Juksa og fisket med båten (`08-actions.js`, `05-vessels.js`) stopper der `ruBlockMsg` sier nei, med grunnen i loggen.
- **Faste redskap:** Setting av redskap (`10-gear.js`) stopper på samme måte, og grensene for garn og kroker følger `fjordLimits`.
- **Kartet:** Kartet tegner fjordlinjene langs hele kysten.
- **Sluttsedler:** Sluttseddelen bruker Fiskeridirektoratets lokasjon (`ruLok`).
- **Senja:** Den håndtegnede Senja-linja (`FJORD`) er borte.

`tests/rulestest.py` sjekker punkter langs kysten (sonene, områdene og avstanden til grunnlinja) og svarene for hver regel, med datoer og lengder.

## 5.28b Sonene utenfor kysten (H1b R4 av `docs/planer/havsteget-h1b-rammen.md`, 04.11.2026)

Jonas 03.11.2026: «kjør på» for hele H1b. Bestillingen: `rules.json` får sonene utenfor kysten, og `rulesAt` sier hva som gjelder i hver av dem. Det som ikke kan bekreftes i kilden, stenges heller enn å gjettes.

**Kartdataene** (`seas()` i `tools/rules/regler.py`, `sea` og `shelf` i `rules.json`):
- **Norges soner** står slik Kartverket tegner dem i «Norges maritime grenser» (`nmg-25833.gml`): Norges økonomiske sone (`no`), fiskevernsonen ved Svalbard (`sv`), fiskerisonen ved Jan Mayen (`jm`), territorialfarvannet ved Svalbard (`svt`) og ved Jan Mayen (`jmt`), og Norges kontinentalsokkel (`shelf`, for snøkrabben).
- **Nabolandenes soner og det internasjonale farvannet** finnes ikke som flater i den fila. Den har bare de avtalte linjene mellom Norge og nabolandene. Derfor deles havet langs alle linjene som finnes:
  - Kartverkets avtalte linjer og 200 nm-linjer
  - Fiskeridirektoratets «Sjøgrenser» (`Yggdrasil/Sjøgrenser_linje`, hentet av `fetch.py`), som har 200 nm-linjene til Russland, Island, Grønland, Færøyane og Storbritannia og linjene mellom dem
  - spillets land på 1 km (`land1k`, og `land200` i den gamle rammen) som vegg
- Hver del av havet får sonen sin fra et frøpunkt (`SEA_SEEDS`). En stor del uten frø er internasjonalt farvann, og en liten del går til naboen. Delene tegnes på 1 km, og hjørnene innen 1,5 km av en linje legges på linja. Kantene ute på havet ligger derfor på linjene, med en usikkerhet på rundt 0,3 km. Flatene er utvidet 0,3 km, så ingen glipe står uten sone. Norges egne soner slås opp foran nabolandenes.
- **Sonene:** russisk (`ru`), islandsk (`is`), grønlandsk (`gl`), færøysk (`fo`), britisk (`gb`), dansk (`dk`) og svensk (`se`). Smutthullet (`smh`) og Smottet (`smt`, mellom NØS, Jan Mayen-sonen, Færøyane og Island) er internasjonalt farvann, og det er også lomma mellom Jan Mayen-sonen, NØS, fiskevernsonen og Grønland (`int`). `xx` er hav langt utenfor spillets farvann (Østersjøen, Irland og Rockall, det færøysk-britiske særområdet), og det er stengt.
- **Smutthullet** når øst for 2010-linja fram til Russlands 200 nm. Den delen av stripa som ligger mer enn 200 nm fra både Svalbards og fastlandets grunnlinjer, er Smutthullet. Resten er traktatens særområde, der Russland har sonens rettigheter. Smutthullet blir 68 700 km² (oppgitt rundt 67 000).
- **Svalbards forbud:** Fiskeridirektoratets lag 26 (høstingsforskriften § 58) og lag 25 (sårbare økosystemer) er tatt med i `L`.
- **Statistikkområdene:** lokasjonene i hele rammen er med (`lok`), ikke bare i den gamle rammen.
- **Størrelsen:** `rules.json` er 0,59 MB (0,32 før). Sonene utgjør 0,11 MB og lokasjonene utenfor den gamle rammen 0,09 MB.

**Regelmotoren** (`core/03e-rules.js`):
- `ruSea(p)` gir sonekoden i de samme cellene på 100 m som fjordsonene, og `ruSeaName(c)` gir navnet. `''` er fastlandets sjøterritorium og indre farvann, der kystens regler gjelder som før.
- `ruSeaRules` gir reglene for hver sone. `rulesAt` tar havtillatelsen fra `q.hav` (`tral`, `konv`, `rnot`, `krab`), eller fra båten når den som spør ikke oppgir den.
- **Svalbard** (`sv`, `svt`):
  - Torsk og hyse er lov på kvotene (`sv1`).
  - Sei er stengt (`sv2`). Seikvoten gjelder «i Norges territorialfarvann og Norges økonomiske sone», og om territorialfarvannet ved Svalbard regnes med, er ikke bekreftet.
  - Andre arter er stengt til reglene er funnet (`sv3`).
  - § 58 stopper alt fiske i 20 nm rundt Bjørnøya og 15–20 nm på vestsiden av Spitsbergen (`sv58`). Unntatt er reketrål og skjellskraping, som spillet ikke har.
  - I områdene for sårbare økosystemer er bunnredskap stengt, også line, garn og teiner (`vme`), og de nye fiskeområdene krever egen tillatelse (`vmen`).
- **Jan Mayen** (`jm`, `jmt`): torsk og hyse er forbudt (`jm0`), og sei er stengt (`jm3`). Unntaket er kartleggingsfisket etter torsk (`jm1`): 181 t for konvensjonelle havfiskefartøy, bare line, ett fartøy om gangen, og fartøyet melder fra før det starter.
- **Smutthullet, Smottet og annet internasjonalt farvann** (`int1`): torsk og hyse på kvoten nord for 62° N, med en advarsel om NEAFC-registreringen. Andre arter er stengt (`int2`).
- **Russisk sone:** uten lisens er sonen stengt (`ru0`). Med lisens er torsk og hyse lov på kvoten (`ru1`), og sei og andre arter er stengt.
- **Islandsk sone** er stengt (`is0`). Ingen adgang for 2026 er funnet.
- **Grønlandsk sone:**
  - Lisens trengs.
  - Konvensjonelt hav har fartøykvote på 360 t torsk og 215 t blåkveite. Tråleren har 235 t blåkveite og 650 t uer (`gl1`).
  - Andre arter og andre båter er stengt (`gl2`).
- **Færøysk sone:**
  - Lisens trengs, og bare konvensjonelt hav kan fiske der.
  - Lange og brosme er lov (`fo3`), lange bare til 25. august (`fo2`).
  - Andre arter er bare bifangst (`fo4`).
- **Britisk sone** (lisens), etter ICES-området (`ruGbArea`, en tilnærming):
  - I Nordsjøen er bunnfisk lov på vilkårene for Nordsjøen (`gb4`).
  - Nord for 62° N (2.a) er bare blåkveite lov, til 1. juli (`gb2`).
  - Vest for 4° V (5.b og 6.a) er lange og brosme lov, bare med line, og brosme bare til 8. oktober (`gb6`).
- **Dansk og svensk sone** er ikke sjekket og derfor stengt (`dk0`).
- **Snøkrabbe** gjelder i alle soner:
  - Den krever snøkrabbetillatelse (`sk0`).
  - Den er forbudt innenfor 12 nm, også ved Svalbard og Jan Mayen (`sk1`).
  - Den er forbudt på andre lands sokkel (`sk2`).
  - Den er stengt 1.7–30.11 (`sk3`).
  - Fartøykvoten for året står i `sk4` (H3a: regnet av `SNOREG`, 433 t pluss 110 t i 2027).
  - Over 20 % bløtkrabbe i siste trekk i lokasjonen: skift felt (`sk5`, varsel i sju døgn; J-237-2025 § 5).
  - Høyst 8 000 teiner, røkting og posisjon hver tredje uke, alt over 9,5 cm og død krabbe i land (`sk6`, info; høstingsforskriften §§ 18, 25, 28, 46, 47, 51). Taket sjekkes ved setting (`gearRules`).
  - Bare teiner (`sk7`, § 28 tredje ledd). Minstemålet er 9,5 cm (`ruMinSize`, § 47).
- **Lisensene** (`zoneLic`, `zoneLicApply`, `S.zlic`):
  - Lisensen for russisk, grønlandsk, færøysk og britisk sone søkes i Kvote → Papirer (`papZlic`) og gis med en gang. Ingen kilde oppgir behandlingstida, så spillet legger ikke inn en oppdiktet ventetid.
  - Havtillatelsen gir lisensen for russisk sone.
  - Lisensen gjelder alle båtene.
- **Kvotene i utenlandske soner** står som data i `ZQ`, med gruppas tak og fartøykvoten. Tellingen mot taket kommer når det kan fiskes der (fisken i R6, havbåtene fra H2), se BACKLOG.
- Regler-appen viser sonen under «Hvor du er» og har kortet «Havet utenfor kysten» under «Lær mer». Regellaget, varselet før feil og Kystvakta spør `rulesAt` og får sonene med.

**Kildene** (lest 04.11.2026, J-meldingene direkte på fiskeridir.no):
- J-248-2025 og J-247-2025 (torsk og hyse i fiskevernsonen)
- J-161-2026 §§ 1–2 (sei bare i territorialfarvannet og NØS, Jan Mayen unntatt)
- J-61-2026 (kartleggingsfisket ved Jan Mayen)
- J-133-2026 (færøysk sone)
- J-94-2026 (grønlandsk sone)
- J-177-2026 (britisk sone)
- J-237-2025 (snøkrabbe: territorialfarvannet, andre lands sokkel, stengt 1.7–30.11)
- J-193-2026 (et stengt område for snurrevad og torsketrål på Spitsbergenbanken, ikke i spillet før trålen kommer)
- Høstingsforskriften § 58, lest på Lovdata. Fiskeridirektoratets kartlag og Havforskningsinstituttet oppgir den gamle paragrafen § 56.
- Fiskeridirektoratets skjema FD-54 (russisk sone) og FD-55 (NEAFC)
- FOR-2023-01-12-35, den siste islandske adgangen, som er opphevet

**Ikke lest, eller usikkert:**
- Protokollen fra den norsk-russiske fiskerikommisjonen for 2026: regjeringen.no var stengt.
- Smutthullavtalen.
- Om sei i territorialfarvannet ved Svalbard regnes som «Norges territorialfarvann».
- At kvoten nord for 62° N gjelder i internasjonalt farvann, er lest ut av J-161-2026 §§ 1–2. Farvannet er ikke nevnt særskilt.
- Reglene for blåkveite, lange, brosme, uer og kveite i fiskevernsonen og i internasjonalt farvann. De er stengt.
- Skagerrakavtalen (dansk og svensk sone). Den er stengt.

## 5.28c Skagerrak: torsken øst for Lindesnes (Ø10, 07.11.2026)

Rullet ut 07.11.2026 i f4e2a8c0 (versjon fb060e367846, PR #49).

Bestillingen (steg 10 i `docs/planer/koen.md`, fra backloggen «Regelmotoren mangler Skagerrak», funnet i Onboarding 2): torsk utenfor grunnlinjen i Skagerrak øst for Lindesnes er stengt for norske fartøy, med unntaket for juksa under 11 m. Første tur hadde sin egen sjekk (`tutSkagOut`); nå svarer `rulesAt`.

**Regelverket** (lest 07.11.2026):
- **Forskrift om regulering av fisket etter torsk i Nordsjøen og Skagerrak i 2026** (FOR-2025-12-19-2805), lest på Lovdata som sist endret ved FOR-2026-10-01-1976, og ordrett i J-160-2026 hos Fiskeridirektoratet («Forskriften lyder etter dette», gjeldende 1.10–31.12.2026). Endringene i 2026 (FOR-2026-06-26-1451, FOR-2026-08-27-1705, FOR-2026-10-01-1976; J-113, J-135 og J-160-2026) gjelder maksimalkvotene i Nordsjøen, ikke Skagerrak.
- **§ 1:** «Det er forbudt for norske fartøy å fiske og lande torsk i følgende områder i 2026: […] I Skagerrak, det vil si utenfor den norske grunnlinjen og videre avgrenset mot vest av en rett linje gjennom fra Hanstholmen fyr til Lindesnes fyr og i sør av en rett linje gjennom Skagen fyr til Tistlarna fyr utenfor 4 nautiske mil av de svenske og danske grunnlinjene.»
- **§ 2:** «Uten hinder av forbudet i § 1 kan norske fartøy fiske inntil 52 tonn torsk i Skagerrak utenfor grunnlinjene.»
- **§ 4, siste ledd:** «Fartøy som i 2004 fikk dispensasjon fra forbudet mot å fiske direkte etter torsk i Skagerrak utenfor grunnlinjene, kan maksimalt fiske og lande 3 tonn torsk i Skagerrak utenfor grunnlinjene. Andre fartøy med største lengde under 11 meter, kan i perioden fra og med 1. april til og med 30. juni maksimalt fiske og lande 3 tonn torsk med juksa i Skagerrak utenfor grunnlinjene dersom eier/høvedsmann er registrert på blad B i fiskermanntallet og fartøyet ikke har adgang til å delta i lukket gruppe i fisket etter torsk med konvensjonelle redskap i Nordsjøen.»
- **§ 5:** «Fartøy som fisker med andre konvensjonelle redskap enn snurrevad i Skagerrak kan ha inntil 5 % bifangst av torsk i de enkelte fangster og ved landing.» (Snurrevad 2,5 %, trål 1–2,5 %; ikke i spillet.)
- **2023-forskriften** (FOR-2022-12-16-2281, utløpt 31.12.2023, lest på Lovdata) har samme ordlyd i § 1 og samme juksaunntak i § 4; tallene var 100 tonn i § 2 og 6 tonn for dispensasjonsfartøyene. Backloggen viste til den.
- **Bakgrunnen** (Fiskeridirektoratets foreløpige forslag 01.12.2025, sak 12/2025): «utgangspunktet [bør] være at det ikke bør åpnes for et direkte fiske etter torsk utenfor grunnlinjene i Skagerrak i 2026». Ordningen for under 11 m med juksa kom i 2015; dispensasjonen fra 2004 gjaldt 7 fartøy, i dag 3–4.

**Kartdataene** (`skag` i `rules.json`, `skagerrak()` i `tools/rules/regler.py`):
- Linjene i § 1 er ICES' egne rundt 3.a.20 (Skagerrak), så flata er ICES 3.a.20 slik Fiskeridirektoratet tegner den (Statistikområder lag 3, NLOD). Vestkanten er den rette linja fra Hanstholm (57,11789° N 8,58917° Ø) til Lindesnes (57,97993° N 7,05134° Ø), 39 punkter på linja; Lindesnes-punktet ligger om lag 300 m fra fyret slik Wikipedia oppgir det (57°58′57″ N 7°02′48″ Ø). Linja er rett i lengde og bredde, ikke en storsirkel.
- Spillet spør bare utenfor grunnlinja, så flata er utvidet over land og indre farvann (innenfor grunnlinja, øst for linja) før den forenkles på 0,2 km. Forenklingen flytter da bare kanter innenfor grunnlinja. Utenfor grunnlinja sier den forenklede flata det samme som ICES-flata i 99,87 % av 21 189 punkter; avvikene ligger i dansk og svensk farvann og i 2 punkter rett ved linja i NØS. 1 063 hjørner, 9,8 kB.
- **Oppdatering:** `python3 tools/rules/fetch.py --skag && python3 tools/rules/regler.py --skag` legger `skag` inn i `rules.json` slik den er, og resten blir byte for byte som før (rundt 2 min). Full kjøring (`fetch.py`, `regler.py`) tar den med. Ikke for hånd.

**Regelmotoren** (`core/03e-rules.js`):
- `ruSkag(p)`: utenfor grunnlinja, i flata, og i norsk farvann (`ruSea` er `''` eller `no`). Flata ligger i de samme 100 m-cellene som sonene (bit 64). Den danske og svenske delen av Skagerrak er stengt fra før (`dk0`, 5.28b), med sin egen grunn.
- `rulesAt` sør for 62° N utenfor grunnlinja i Skagerrak:
  - `skag` (nei, stopper): torsk, også når arten ikke er oppgitt (juksa, line og garn uten art), med grunnen og unntaket i teksten: «Norske fartøy kan ikke fiske torsk i Skagerrak utenfor grunnlinjen (øst for linja Lindesnes–Hanstholmen). Unntaket er juksa fra fartøy under 11 m med eier på blad B, 1. april–30. juni, høyst 3 tonn.»
  - `skag4` (advarsel): unntaket, når redskapet er juksa (eller ikke oppgitt), båten er under 11 m, datoen 1.4–30.6 og spilleren på blad B (`bladB()`). Teksten sier 3 tonn og 52 tonn norsk kvote.
  - `skag5` (advarsel): andre arter med juksa, line eller garn, høyst 5 % torsk som bifangst. Ikke for teiner.
- Kortnavnene (`RU_SHORT`): «Ikke torsk i Skagerrak her», «Skagerrak: juksa, høyst 3 t torsk», «Høyst 5 % torsk som bifangst».

**I spillet** (som de andre reglene, ingen egen kode): juksa stopper og båten venter med grunnen i loggen (`05-vessels.js`), setting av redskap stopper (`10-gear.js`), ruta og «Kast loss» varsler, Autonav går til nærmeste lovlige sted (5.29b), regellaget er rødt utenfor grunnlinja øst for Lindesnes, statusboksen sier «✕ Ikke torsk i Skagerrak her», Regler-appen gir grunnen og kilden, og tipset kommer første gang. Kystvakta tar `skag` med i merknadene (`KV_REF.skag`, så saken i Kystposten får kilden). Første tur: `tutSkagOut` i `ui/08c-start.js` er tatt ut; feltet ved et mottak i Skagerrak finnes nå innenfor grunnlinja (juksa uten art er stengt utenfor), og miksen spør `rulesAt` per art.

**Forenklet, antatt, ikke med:**
- **Juksa stopper helt** utenfor grunnlinja i Skagerrak, ikke bare torsken: fangsten har torsk i seg, slik Oslofjordens torskeforbud og § 31 stopper (5.28). Etter § 5 kunne spilleren fiske andre arter med høyst 5 % torsk. **Jonas 08.11.2026 (valg 12):** «Valg 12: fangsten kan ikke holde torsken ute, det er urealistisk. Bifangst av uønskede eller fredede arter er et ekte problem og spillet må reflektere dette». Altså verken at fangsten holder torsken ute (A) eller stoppet som nå (B): juksa, line og garn etter andre arter skal fiske der, torsken kommer med i fangsten, og bifangsten blir spillerens problem slik den er for fiskerne: grensen på 5 % i fangsten og ved landing, beskjed om å flytte, alt landes (utkastforbudet), torsken over grensen inndras ved levering, og Kystvakta ser på den. Fiske etter torsk er fortsatt stengt, og unntaket under 11 m står. Det samme gjelder der torsken ellers er forbudt med en bifangstgrense (Oslofjorden, § 31), og for fredede arter (kveite i fredningstida, uer). **Bygd i Ø10b 11.11.2026, se 5.28d:** juksa, line og garn stoppes ikke lenger der.
- ~~**Taket på 3 tonn telles ikke**~~: telt fra Ø10c 11.11.2026, se 5.28e.
- **Lukket gruppe i Nordsjøen** finnes ikke i spillet, så det vilkåret i § 4 regnes som oppfylt (antatt).
- **Dispensasjonsfartøyene fra 2004** (3 tonn, tre eller fire navngitte båter) er ikke spillerens og er ikke med.
- ~~**Nordsjøen**~~ (§ 1 a, vest for linja sør for 62° N): bygd i Ø10c 11.11.2026, se 5.28e.
- ~~**Gyte- og oppvekstområdene for torsk i NØS sør for 62° N**~~ (lag 18 og 19 i `rules.json`): bygd i Ø10c 11.11.2026, se 5.28e.

**Tester:** `tests/unit/skagerrak.test.mjs` (32 sjekker: flata ved Kristiansand, Arendal og Egersund og på hver side av linja, stoppet med grunnen og kilden, unntaket i tid, lengde, redskap og blad B, bifangsten, teinene, dansk sone, Bergen; sett rød før regelen fantes). Stikkprøven 07.11.2026 (trebåten 7 m, 1 nm utenfor grunnlinja og innenfor): Kristiansand og Arendal stengt utenfor (juksa venter med grunnen, Kystvakta merker `skag`), fiske med torsk innenfor; Egersund åpent utenfor (29 kg, 10–11 kg torsk); Bergen uberørt. Første tur fra Kristiansand (`tut.py` med `KYST_TUT_START=58.14,8.0`) gikk hele veien: feltet utenfor Kristiansand S, 298 kg levert.

## 5.28d Bifangsten der torsken er forbudt (Ø10b, steg 65, 11.11.2026)

Jonas 08.11.2026 (valg 12): «Valg 12: fangsten kan ikke holde torsken ute, det er urealistisk. Bifangst av uønskede eller fredede arter er et ekte problem og spillet må reflektere dette». Bygd for Skagerrak utenfor grunnlinja øst for Lindesnes. Rullet ut til testutgaven 11.11.2026 i ef22cd6 (versjon 5770a07c34e0).

**Regelverket** (lest 11.11.2026 på Lovdata gjennom en leseagent, som bare kunne gjengi korte sitater ordrett; resten er gjengitt etter innholdet, og det er sagt der det gjelder):
- **FOR-2025-12-19-2805 § 5** (Lovdata, sist endret FOR-2026-10-01-1976, og J-160-2026): andre konvensjonelle redskap enn snurrevad i Skagerrak: 5 % torsk, «i de enkelte fangster og ved landing» (ordene gjelder hver prosentsats i paragrafen). Nordsjøen 15 %, snurrevad 8,5 % i Nordsjøen og 2,5 % i Skagerrak (ikke i spillet). Forskriften har ingen egen paragraf om inndragning; § 10 viser til havressurslova § 59 (gebyr) og § 11 til §§ 60, 61, 64 og 65 (straff).
- **Høstingsforskriften § 51** (sist endret FOR-2025-12-22-2946): «All fangst skal føres i land. Dette gjelder likevel ikke:» a) levende fangst tatt i strid med reglene: «Slik fangst skal straks slippes på sjøen.» b) lovlig fangst som er levende når den slippes. c) død eller døende fangst av arter som ikke står på lista. f) kveite over 2 m: «Påbudet gjelder uavhengig av om kveiten er levedyktig eller død eller dødende.»
- **§ 49** (innblanding under minstemål, i antall i de enkelte fangster) og **§ 50** (Fiskeridirektoratet kan stenge områder for å begrense fangst under minstemål, 7, 14 eller 21 dager) gjelder minstemål, ikke bifangst av en forbudt art; **§ 48** er unntakene fra minstemålene. Ingen av dem gir en regel for torskeandelen her.
- **Havressurslova § 54** (forvaltningsmessig inndragning): «Fangst eller verdien av fangst som er hausta eller levert i strid med føresegner» tilfaller salgslaget, «utan omsyn til om tilhøvet medfører straffansvar».
- **Forskrift om inndraging av fangst og bruk av inndregne midlar** (FOR-2010-03-12-390, sist endret FOR-2025-06-12-1054) § 2: salgslaget avgjør inndragning av «ulovleg bifangst». § 3: det skal gis «vederlag for omkostningar ved ilandføring dersom meirfangsten eller den ulovlege fangsten ikkje var tilsikta», og «Vederlaget skal setjast til 20 % av verdien av meirfangsten eller den ulovlege fangsten.»
- **Råfisklaget:** sidene deres om inndragning lot seg ikke lese (rundskrivlista lastes med skript). Hva de gjør i praksis med fangst over en bifangstgrense, er derfor ikke lest hos dem, bare i forskriften over.

**Det som er bygd:**
- **Regelen** (`rulesAt`): `skag` stopper bare når det spørres om torsk (`sp:'torsk'`: Regler-appens rute for torsk, oppdrag etter torsk). Uten art (juksa, line og garn, slik båten fisker) er svaret gult med `skag5`: høyst 5 % torsk som bifangst, fiske etter torsk er forbudt, flytt ved mer, og det som er over ved levering, inndras. Spillet har ikke noe «fisk etter torsk»-valg (`S.target` er blanding eller kveite), så ingen juksa stoppes der i dag; kommer valget, sendes `sp:'torsk'` og stoppet gjelder. Regellaget er gult, ruta, «Kast loss», Autonav og driftsplanen stopper ikke. Unntaket (`skag4`, juksa under 11 m på blad B 1.4–30.6) er som før.
- **Sonen** (`ruByc({p, H, len, gear})`, `RU_BYC.skag.share` 0,05): juksa, line og garn utenfor grunnlinja i Skagerrak, ikke under unntaket (da er torsken lovlig), ikke teiner.
- **Lasten** (`bycAdd` i `addCatch`, `core/05-vessels.js`): `S.boat.byc = {skag:{kg, cod}}`, all fisk tatt i sonen på turen og torsken i den. Telleren begynner på nytt med tom last (levering, redning). En teller per tur, ikke et felt per post: postene slås sammen og deles når fisken sløyes og ises.
- **I fangsten** (`fish()`): over 5 % torsk i fiskeøkta på stedet (`S.fsess.zk`/`zc`, fra 20 kg) sier spillet fra én gang per økt: loggen, en melding fra «Regler» med § 5 og § 51, og en beskjed på skjermen. Båten stoppes ikke.
- **Ved levering** (`landConf`, `bycConf`): torsken over 5 % av Skagerrak-fangsten inndras først (`zConf`), uansett kvote; resten av torsken går som før. Kaia sier det før «Lever» (`landWarn`), Råfisklaget sender melding, og sluttseddelen har raden «Inndratt: torsk over 5 % bifangst i Skagerrak» (`byc5`).
- **Kystvakta** (`kvCheck`): merknaden `skagby` når siste fangst (økta på stedet) eller Skagerrak-fangsten om bord har over 5 % torsk; `KV_REF.skagby`. Hun leser ikke lenger forbudet (`skag`) av at lasten mest er torsk.
- **Første tur:** feltet legges ikke i bifangstsonen (`ui/08c-start.js`), så fangsten på første tur ikke inndras.

**Antatt og forenklet:**
- **5 % regnes av fangsten tatt i sonen**, ikke av hele landingen: torsk tatt lovlig innenfor grunnlinja er ikke bifangst og røres ikke. Forskriften sier «ved landing» uten å skille; dette er vår lesning.
- **Alt landes.** § 51 a sier at levende fangst tatt i strid med reglene skal slippes straks. Spillet bløgger fisken idet den kommer over rekka, så torsken regnes som død og landes. Bifangst innenfor 5 % er uansett lovlig fangst.
- **20 % vederlag for ilandføring** (inndragningsforskriften § 3). Jonas 11.11.2026: «Dette må inn. Jeg vet at fiskere utnytter seg av slikt regelverk bevist, så det er realistisk.» Alle inndragninger ved levering (over kvoten, bifangst uten adgang, bifangst etter maksimalkvoten, blåkveite, snøkrabbe, Skagerrak) gir 20 % av den inndratte verdien tilbake (`CONF_PAY` i `ui/08-actions.js`, `vedKr`): egen rad på sluttseddelen og i dekksdagbokas salg, med i totalen (så trekkene og lotten regnes av den), og kaia sier beløpet før «Lever». Antatt: spillet kan ikke vite om fangsten var tilsiktet, så alle får det; § 3 unntar overfiske av kongekrabbe og de pelagiske artene, som spillet ikke inndrar. Rullet ut til testutgaven 11.11.2026 i 66937a2 (versjon be465205f56f); `skagtest` (20 OK), `booktest` (grønn igjen: summen tar med sløyetrekket og vederlaget), `r4test`, `bktest` og `quotatest` grønne.
- **Varselet i fangsten gjelder juksa.** Line og garn telles i lasten, ved levering og hos Kystvakta, men trekket gir ikke eget varsel.
- **Feltet stenges ikke** (§ 50 gjelder minstemål).

**Oslofjorden og § 31, ikke bygd om:**
- **Oslofjorden (`oslo`)** stopper som før. Regelen for torsk i Oslofjorden ble ikke funnet på Lovdata i denne økta (høstingsforskriftens kapitler slik de ble lest, har ingen Oslofjord-paragraf, og spillets egen henvisning er bare «Oslofjordforskriften» uten nummer), så bifangstregelen der er ikke lest. Uten kilden bygges den ikke om.
- **§ 31 (`f31`, 15 m og over innenfor fjordlinjene)** stopper som før. § 31 første ledd forbyr fiske, og bokstav h unntar «Fiske etter andre fiskeslag enn torsk med andre konvensjonelle redskaper enn snurrevad med fartøy under 21 meter»; paragrafen har ingen prosentsats. De 5 % i `f31h` viser til J-187-2026 § 32, som ikke ble lest ordrett i denne økta. Å slippe 15-meteren inn i fjordene i nord, der juksa mest tar torsk, endrer spillet for hele kysten og gjøres ikke på en sats som ikke er lest.
- Mekanismen er klar for begge: en ny nøkkel i `RU_BYC` og en gren i `ruByc`.

**De fredede artene:**
- **Kveite i fredningstida** slippes (`letGo`, `kveiteClosed`), med linje i loggen. Høstingsforskriften § 44: «All levedyktig fangst av kveite i fredningstiden skal straks slippes på sjøen.» Antatt: kveite tatt på juksa er levedyktig. Død kveite fra garn og line i fredningstida (bifangstsatsene i § 41, 1 % per uke og 0,5 % i fredningstida nord for 62° N) er ikke modellert. Kveite over 2 m slippes alltid (§ 51 f), som i spillet.
- **Uer** utenfor vinduet følger `uerOpen` i simuleringen som før. § 44 gir inntil 10 % uer med konvensjonelle redskap (30 % under 21 m fra 1.8 til 31.12); det er ikke bygd inn, og første ledd i § 44 ble bare delvis lest (backloggen).

**Tester:** `tests/unit/skagerrak.test.mjs` (uten art stoppes ikke, gult regellag, `ruByc` etter redskap, sted og unntak, tellingen i lasten, inndragningen 100 − 5 % av 400 = 80 kg, taket på torsken om bord, ny telling etter tom last; sett rød mot koden før endringen). `tests/skagtest.py` (trenger hele kysten): stikkprøven 11.11.2026 med trebåten og håndjuksa i lett bris, fire timer, 1. mars: **Kristiansand** (2,2 nm utenfor grunnlinja) 30 kg, 15 kg torsk, varselet én gang («59 % torsk»), Kystvakta `skagby`, 13,8 kg inndratt på Flekkerøy; **Arendal** (1,2 nm) 28 kg, 13 kg torsk, varselet («43 %»), 11,5 kg inndratt; **Egersund** 30 kg med 9 kg torsk og **Bergen** 11 kg: ingen sone, ingen telling, ingenting inndratt. Kaia og sluttseddelen i begge formater med 100 kg torsk av 400 kg: 80 kg inndratt. Bildene i `docs/okter/2026-11-11-65/`.

**Sett i stikkprøven:** juksa utenfor grunnlinja ved Kristiansand og Arendal gir 43–59 % torsk i mars etter modellen, så nesten all torsken derfra inndras. Det er regelen, men spilleren som vil fiske der, må finne sei og lyr; om torskeandelen i modellen i Skagerrak er for høy, er ikke vurdert.

## 5.28e Sør for 62° N: gyteområdene, oppvekstområdene, Nordsjøen og takene på 3 tonn (Ø10c, steg 68, 11.11.2026)

Bestillingen (steg 68 i `docs/planer/koen.md`, fra backloggen «Regelmotoren sør for 62° N, det som står igjen etter Ø10»): det kildene avgjør sør for 62° N. Bygd på grenen `ccr-49289d8b-v7t3dk`. Rullet ut til testutgaven 11.11.2026 i e1ca159 (versjon 71508b0ed753).

**Regelverket** (lest ordrett 11.11.2026 hos Fiskeridirektoratet, fiskeridir.no/yrkesfiske/j-meldinger; Lovdata svarte 405 på øktas forespørsler, så J-meldingene er kilden, og de gjengir forskriftene i sin helhet):
- **J-229-2025, forskrift om forbud mot fiske i gyteområder for torsk i Norges økonomiske sone sør for 62° i 2026** (fastsatt 19.12.2025, gjelder 1.1–31.12.2026, erstatter J-2-2025). § 1: «Forskriften gjelder for norske og utenlandske fartøy.» § 2: «Det er forbudt å fiske i Norges økonomiske sone i følgende avgrensede områder tidsperioder»: Stanhope ground «1. januar – 30. april», Coral edge «1. desember – 28. februar», Egersundbanken «1. desember – 31. mars», Vestbanken «1. januar - 15. mars», Revet «1. januar-15. Mars». For Stanhope ground og Revet: «Denne forskriften gjelder området som ligger i Norges økonomiske sone.» § 3: «Forbudet i § 2 gjelder ikke fiske med ringnot og pelagisk trål.»
- **J-99-2026, forskrift om forbud mot fiske i oppvekstområder** (fastsatt 17.6.2026, gjelder 1.7–31.12.2026). § 2: «Det er forbudt å fiske i følgende områder i Norges økonomiske sone sør for 62°N i perioden 1. juli – 31. desember 2026»: Egersundbanken, Midtbanken, Lille Fiskebank. § 3: ikke ringnot etter sild, makrell og hestmakrell eller pelagisk trål etter sild og makrell; «Forbudet i § 2 gjelder ikke fiske med juksa.»; «Forbudet i § 2 gjelder ikke fiske med garn med maskestørrelse ikke mindre enn 160 mm.»
- **J-160-2026** (forskrift 19.12.2025 nr. 2805 om torsk i Nordsjøen og Skagerrak i 2026, «Forskriften lyder etter dette», fra 1.10.2026). § 1 a: Nordsjøen er «Norges territorialfarvann og økonomiske sone sør for 62° N avgrenset mot øst av en rett linje gjennom Hanstholmen fyr og Lindesnes fyr, og i EU-sonen og britisk sone i ICES´ statistikkområde 4». § 4 andre ledd: «Fartøy med adgang til å delta i åpen gruppe i fisket etter torsk for fartøy med mindre enn 500m³ lasteromvolum som fisker med konvensjonelle redskap i Nordsjøen, kan maksimalt fiske og lande følgende kvanta torsk i Nordsjøen»: garantert 2 tonn og maksimalkvote 3 tonn, likt for 0–9,99 m, 10–20,99 m og 21 m og over. § 4 siste ledd (Skagerrak, juksa under 11 m, se 5.28c). § 5: «Fartøy som fisker med andre konvensjonelle redskap enn snurrevad i Nordsjøen kan ha inntil 15 % bifangst av torsk i de enkelte fangster og ved landing», og siste ledd: «Når det direkte fisket etter torsk er stoppet eller når det enkelte fartøy har fisket sin maksimalkvote, kan fartøy med adgang til å delta i et direkte fiske etter torsk i Nordsjøen ha bifangst av torsk i fisket etter andre arter etter bestemmelsene i § 5.» § 2: «Alle kvanta i forskriften angis i rund vekt.» § 3: gruppekvoten for konvensjonelle er 706 tonn.
- **Startmeldingen sa Revet 1.2–15.3.** Forskriften sier 1. januar–15. mars, og den er fulgt.

**Kartdataene:** lag 18 og 19 i `rules.json` er sjekket hjørne for hjørne mot koordinatene i J-229-2025 § 2 og J-99-2026 § 2 (11.11.2026): alle åtte områdene er like, på minuttets hundredel. Navnene i lag 18 har årstallet laget ble tegnet («Egersundbanken 2025»), men J-meldingen i dataene er J-229-2025, som er forskriften for 2026. Dataene er derfor ikke endret, og `tools/rules/` er ikke kjørt; koden kjenner områdene på begynnelsen av navnet (`RU_GYTE`).

**Regelmotoren** (`core/03e-rules.js`):
- **Gyteområdene** (`gyte18`, nei, stopper): alt fiske, alle redskap, arter og lengder, i områdets periode. Grunnen sier området og perioden; kilden er J-229-2025 § 2. Som de andre stoppene: juksa venter, setting stopper, ruta, «Kast loss», Autonav og driftsplanen varsler, regellaget er rødt, Kystvakta tar den med (`KV_REF.gyte18`).
- **Oppvekstområdene** 1.7–31.12: line og teiner (og alt annet enn juksa og garn) stoppes (`opp19`); garn under 160 mm stoppes også (`opp19`, se oppfølgingen under), garn fra 160 mm er lov (`opp19g`); juksa er lov (`opp19j`, vist i Regler-appen).
- **Bare delen i norsk sone** (`ruSeaNo`): Revet ligger mest i dansk sone, Stanhope ground delvis i britisk; der gjelder sonenes egne regler (5.28b). Sonedataene slutter ved om lag 56,7° N, så de sørligste hjørnene av Vestbanken og Lille Fiskebank har ingen sone i dataene; de regnes som norsk sone (de ligger langt fra land).
- **Nordsjøen** (`ruNsjo`): sør for 62° N, norsk farvann, vest for linja, og ikke i Skagerrak-flata. Territorialfarvannet er sjøterritoriet og indre farvann, så **fjordene er med** (Bergen, Stavanger, Egersund), i motsetning til Skagerrak, som bare gjelder utenfor grunnlinja. Linja er den Skagerrak-flata ender i; nord for Lindesnes fyr (over land og i indre farvann) brukes fyrets lengdegrad.
- `nsjo` (ok): så lenge det er igjen på taket, sier regelen 3 tonn (2 garantert), hvor mye som er igjen, og 15 % etterpå. Ingenting blir gult. `nsjoby` (advarsel): taket er fisket, eller båten har ikke adgang: torsk bare som bifangst, høyst 15 %.
- **Unntaket i Skagerrak** (`skag4`) gjelder bare så lenge det er igjen av de 3 tonnene; teksten sier hvor mye. Når de er tatt, er torsken bifangst igjen (`skag5`, `skag`).
- Det regelmotoren husker (`ruNow`, regellaget, rutepunktene), har takene i nøkkelen (`ruCapKey`), så svaret skifter den dagen et tak er fullt.

**Takene** (`core/03d-quota.js`, `SORQ`, `sorRoom`, `sorLeft`, `sorConf`, `sorLanded`):
- **Spilleren regnes i åpen gruppe sør for 62° N.** Spillet har ingen lukket gruppe der, og en hjemmel nord for 62° N gir ingen adgang til lukket gruppe i Nordsjøen. Hvem som er i åpen gruppe, følger deltakerforskriften § 16 og § 6 (`sorAcc`, se oppfølgingen under): eieren om bord, én båt per eier; en båt utenfor har bare bifangsten på 15 %. Unntaket i Skagerrak krever ikke åpen gruppe (§ 4: «Andre fartøy med største lengde under 11 meter»).
- **Tellingen** går der kvotene nord for 62° N telles: `quotaState()` har `nsjo` og `skag4`, kg rund vekt landet på taket i år, og begynner på nytt ved nyttår som resten. Fangsten telles per sone i lasten med telleren fra Ø10b (`S.boat.byc.nsjo` og `.skag4`, `bycAdd` gjennom `ruByc`; i `RU_BYC` har de andelen 1, så `fish()` ikke varsler og `bycConf` ikke tar noe).
- **Ved levering** (`sorConf`, ren funksjon): torsken fra sonen går på taket så lenge det er plass; det som er over, kan være bifangst av fangsten derfra (15 % i Nordsjøen, 5 % i Skagerrak), og resten inndras. Torsken derfra regnes ikke mot kvoten nord for 62° N (`codQ`, ferskfiskordningen og åpen gruppes felles kvote der). Sløyd torsk veier mindre enn den ble telt: inndragningen følger vekta om bord, taket telles i rund vekt.
- **Kaia** (`landWarn`) sier før «Lever» hvor mye som er over og hvorfor, og viser til Regler-appen. **Sluttseddelen** har raden «Inndratt: torsk over 3 tonn i Nordsjøen (15 % bifangst)» eller «… over 3 tonn med juksa i Skagerrak (5 % bifangst)» (`nsjo3`, `skag3`), Råfisklaget skriver, og vederlaget på 20 % (5.28d) gjelder.
- **Kystvakta** (`kvCheck`) spør om torsken over takene som om kvoten nord for 62° N: merknadene `nsjo3` og `skag3` (`KV_REF`), og torsken fra sonene regnes ikke mot kvoten i nord.
- **Første tur** bruker `ruBycOnly` (bare ekte bifangstsoner), så feltet fortsatt legges i Nordsjøen (`ui/08c-start.js`, én linje).

**Oppfølgingen samme dag** (Jonas 11.11.2026: «Fiks alt som er svakt eller antatt, jeg er drittlei av å starte en økt så har jeg plutselig 5 nye arbeidsoppgaver i loggen når økta er ferdig. Blir jo aldri ferdig da»). Alt som sto som antatt eller som gjenstående etter Ø10c, er avgjort av kildene eller bygd:
- **Vilkårene for åpen gruppe i Nordsjøen** er lest i deltakerforskriften (J-66-2026, fiskeridir.no). § 14: fisket gjelder «sør for 62 grader nord, vest for en rett linje gjennom Lindenes fyr og Hanstholmen fyr … med fartøy som har mindre enn 500 m³ lasteromsvolum som fisker med annet redskap enn not og trål». § 16: «Når vilkårene for deltakelse i lukket gruppe ikke er oppfylt, kan fartøy som oppfyller følgende vilkår delta i åpen gruppe»: registrert og under 500 m³ (ingen lengdegrense, i motsetning til nord for 62° N), «eier av fartøyet og høvedsmann må være ført i fiskermanntallet», og «under utøvelse av fangst må eier selv være høvedsmann om bord i fartøyet». § 6: «Hvis eier av fartøy som deltar i åpen gruppe eier 50 % eller mer i annet fartøy, kan ikke sistnevnte fartøy delta i åpen gruppe i samme fiskeri.» I spillet (`sorAcc`, `sorOpenId`): eieren må være om bord på turen (`S.tripOwner`), og én båt per eier: den første i flåten som lander torsk på taket i et år, har åpen gruppe i Nordsjøen det året. Lengden teller ikke, og en hjemmel nord for 62° N stenger ikke (det er et annet fiskeri). En båt utenfor har bare bifangsten, og teksten sier hvorfor (`sorWhy`).
- **Fisket i åpen gruppe stoppes ikke**, fordi det ikke ble stoppet i 2026: gruppekvoten ble ikke tatt, og Fiskeridirektoratet økte lukket gruppes maksimalkvoter tre ganger i stedet (minste lengdegruppe 6 tonn i J-113-2026 26.6, 10 tonn i J-135-2026 27.8, 12,5 tonn i J-160-2026 1.10), og ingen J-melding stopper fisket (lista for sør for 62° N lest 11.11.2026). De 3 tonnene gjelder derfor hele året, og de garanterte 2 står i teksten.
- **Garnets maskevidde** finnes i spillet (torskegarn og flytegarn 156, 180 og 200 mm, blåkveitegarn 360 mm; `NETOPT` i `core/10-gear.js`), så regelen i J-99-2026 § 3 er bygd: en garnlenke under 160 mm stoppes i oppvekstområdene 1.7–31.12 (`opp19`, grunnen sier maskevidden), 160 mm og over er lov. Settingen sender lenkas maskevidde, Kystvakta settets; uten en lenke avgjør de minste garna om bord (`ruMeshNow`). Høstingsforskriften § 19 (J-163-2026, lest i PDF-en): bunnsatte garn sør for 62° N minst 126 mm, og 148 mm for torsk og sei utenfor 4 nm i NØS vest for linja; alle spillets garn er større, så den gir ingen regel.
- **Varselet i fangsten** gjelder nå også Nordsjøen: når de 3 tonnene er fisket (eller båten er utenfor åpen gruppe) og det er over 15 % torsk i fangsten på stedet, sier spillet fra én gang per økt, som i Skagerrak over 5 % (`ruBycWarn` i `03e-rules.js`, brukt av `fish()` i `core/05-vessels.js`). Loggen sier én gang i døgnet at kvoten i Nordsjøen er full.
- **«Torskekvoten er full»** (kvoten nord for 62° N) regner ikke lenger med torsken tatt sør for 62° N (`sorCodAboard`).
- **Kvote-appen** («Mine kvoter») har kortet «Torsk sør for 62° N» for båten som ligger sør for 62° N eller har landet på et tak i år: maksimalkvoten, landet, om bord derfra og igjen, for Nordsjøen og for juksaunntaket i Skagerrak (`kvSor` i `ui/phone/04-kvote.js`). Kaia viser dit.
- **Torsk innenfor grunnlinja øst for Lindesnes** (Sørlandskysten utenom Oslofjorden) har ingen kvote: § 1 i torskeforskriften nevner bare Nordsjøen og Skagerrak «utenfor den norske grunnlinjen», og kvotene i J-187-2026 gjelder nord for 62° N. Fangsten der telles som fri (`sorfri`), så den ikke regnes mot kvoten nord for 62° N, og ingenting inndras. Oslofjorden er som før (torsk forbudt).
- **3 tonn i året** er forskriftens tall og står. Det er ikke en antakelse.

**Forenklet, og det står:**
- **Bifangsten regnes av fangsten tatt i sonen**, som i Skagerrak (5.28d; forskriften sier «i de enkelte fangster og ved landing»).
- **Forskriftene er årets egne** (2026). Spillet lar dem gjelde hvert år, som stengte felt og resten av reglene.
- **EU-sonen og britisk sone i ICES 4** hører til Nordsjøen i § 1; i spillet er de stengt uten lisens fra før (5.28b).
- **Lovdata** svarte 405 på øktas forespørsler; forskriftene er lest i J-meldingene hos Fiskeridirektoratet, som gjengir dem i sin helhet.

**Tester:** `tests/unit/sor62.test.mjs` (gyteområdene per dato og sted, alle redskap, oppvekstområdene, sonen Nordsjøen, takene og `sorConf` med grensetilfellene; sett rød mot koden før endringen: 21 FEIL av 36), `tests/unit/skagerrak.test.mjs` (to sjekker oppdatert: Egersund og Bergen er nå `nsjo`, unntaket er `skag4`). `tests/sor62test.py` (trenger hele kysten, 33 sjekker) er stikkprøven. Også kjørt grønne: `skagtest`, `quotatest`, `kystvakttest`, `r4test`, `rulestest`, `trip2`, `selltest` (lest).

**Stikkprøven 11.11.2026** (trebåten 7 m i åpen gruppe, håndjuksa i lett bris, fire timer, spillets 1. mars):
- **Bergen**, innenfor grunnlinja (29 kg, 5 kg torsk) og 1,3 nm utenfor (31 kg, 6 kg torsk): sonen er Nordsjøen, juksa stoppes ikke, regelen sier 3 tonn og «3,0 tonn igjen», ingenting er gult. Levert i Brandasund og Bøvågen: ingenting inndratt, torsken telt på taket og ikke på kvoten nord for 62° N. Med taket fullt og 100 kg torsk av 400 kg: regelen er gul, Kystvakta merker `nsjo3`, kaia sier 40 kg før «Lever», og sluttseddelen har raden, i begge formater.
- **Egersund** 1 nm utenfor (30 kg, 8 kg torsk): som Bergen. **Egersundbanken** (58,02° N 4,55° Ø) 1. mars: stengt for alt fiske, juksa tar ingenting; åpen 1. juni. Oppvekstområdet der: line stoppet 29. juli, juksa og garn ikke, line åpen 9. juni.
- **Revet** (57,69° N 8,83° Ø, delen i norsk sone) og **Vestbanken**: stengt 1. mars, åpne 1. april. **Stanhope ground**: stengt 1. mars, åpen 1. juni. **Coral edge**: åpen 1. mars (stengt til og med 28. februar).
- **Kristiansand** 1. juni med blad B, 2 nm utenfor grunnlinja: unntaket, «3,0 tonn igjen», torsken telt på taket, ingen bifangstmerknad; levert på Flekkerøy uten inndragning. Med 100 kg igjen og 300 kg torsk av 400: 100 på taket, 20 som bifangst, 180 inndratt, kaia og sluttseddelen sier det i begge formater. Med taket fullt er sonen `skag` igjen (5 %), og `fish()` varsler.
- **Tromsø**: ingen sone, ingen telling, ingen av reglene.
- Bildene i `docs/okter/2026-11-11-68/`.

**Tilbakerulling:** en sluttseddel med raden `nsjo3` eller `skag3` har en grunn den forrige versjonen ikke kjenner (som `byc5` fra Ø10b hadde); rulles spillet tilbake, feiler visningen av akkurat den seddelen i den gamle siden.

## 5.29 Regler-appen, statuslinja og regellaget (R3 av regelplanen, 05.10.2026)

Jonas: «mange som skal spille dette har kanskje ikke så mye erfaring med fiskeri fra før, så vi blir nødt til å lage en intuitiv løsning der hvordan vi skal vise og lære dem hvilke regelverk som gjelder».

- **Statusboksen** har linja «Regler» når du er på sjøen: ✓ Lov her, ! en grense eller ✕ et forbud, med en kort tekst (`RU_SHORT`).
  - Den gjelder din båt, redskapet hun er rigget med, og kveite når du fisker etter den (`ruCtx`, `ruNow`, som holder svaret i 10 spillminutter og 50 m).
  - Et trykk åpner appen.
- **Regler-appen** (`regler` i `05-phone.js`):
  - **Her og nå:**
    - «Kan jeg fiske her?» med svar, grunner, paragraf og lenke til kilden.
    - Et rutenett med alle arter og redskap for din båt her i dag. Trykk på en rute for å se hvorfor.
    - Hvor du er: fjordlinjene med navnene, grunnlinja i nm, statistikkområdet og lokasjonen, og minstemålene her.
  - **Sjekk:** art, redskap, båtlengde etter lengdegruppene, måned, og hvor. Stedet kan være der båten er, midt i kartplotteren eller en av de seks nærmeste havnene.
  - **Lær mer:** åtte regler forklart enkelt, hver med kilde:
    - fjordlinjene
    - grunnlinja og nm
    - båtlengde og kysttorsk
    - minstemål
    - fredningstider
    - stengte felt
    - Lofoten og Henningsvær
    - sør for 62° N
- **Regellaget i kartplotteren** (`ruLayerBlock` og `ruLayerCanvas`):
  - Laget er rødt der din båt ikke kan fiske med redskapet sitt i dag, og gult der det er grenser.
  - Det regnes på et rutenett på 250 m, en blokk på 10 km om gangen. Én blokk tar rundt 40 ms, og høyst 25 ms regnes per bilde. Resten kommer i de neste bildene.
  - Laget tegnes mykt over sjøen, med fjordlinjene skarpt oppå.
  - Det slås av og på under innstillingene til kartplotteren («Regellag på / Av»). Standard er på.

## 5.29b Varsel før feil (R4 av regelplanen, 05.10.2026)

Jonas: «Ja, kjør på». Spillet sier fra før du gjør feil, ikke bare etterpå.

- **Ruta:** et punkt med fisketid, eller med redskap som skal settes, der reglene stopper båten, får en rød linje med grunnen (`ruWpMsg`, holdt per punkt, båt og dag i `RU_WP`).
  - Fisketid spør om juksa, slik båten fisker på fiskeøktene. Redskap spør om det redskapet.
  - Første gang du gir et slikt punkt fisketid eller redskap, kommer grunnen også som en melding på skjermen.
- **«Kast loss»** med et slikt punkt på ruta spør først: «Reglene stopper båten på ruta», med punktene og grunnene. «Endre ruta» lukker, og «Kast loss likevel» kaster loss. Der venter båten uten å fiske, som før. Ikke i «Første tur».
- **Autonav:** et trykk der reglene stopper båten fra å fiske med redskapet hun er rigget med, går til nærmeste sted innen 3 km der hun kan (`ruOpenNear`: ringer ut fra stedet, 16 retninger, ikke på land). Meldingen sier hvorfor og hvor langt. Trykker du samme sted igjen innen ett minutt, går Autonav helt dit (`LEIA_RU`). Finnes det ikke noe sted innen 3 km, går ruta dit du trykket, med beskjed om at du kan seile dit, men ikke fiske der.
  - Havner og naustet spørres ikke. Autonav til en blåse for å trekke (`leiaTo(p, true)`) spør heller ikke.
- **Kaia før «Lever»:** sier hvor mye som blir inndratt hvis du leverer nå, verdien, og hvorfor: ingen adgang (10 % bifangst), ingen torskekvote igjen, eller maksimalkvoten for hyse eller sei fisket i lukket gruppe (`landWarn` i `07-guide.js`).
  - Utregningen er skilt ut av `sell` i `landConf` (`08-actions.js`), så kaia og sluttseddelen regner likt. `landConf` endrer ikke kvotetallene.
- **Tips første gang:** første gang en regel med ✕ eller ! gjelder båten på sjøen, kommer en melding i telefonen fra «Regler» med hele teksten og kilden, og en kort beskjed på skjermen (`ruTips`, hvert femte sekund sammen med lagringen). Hver regel én gang (`S.ruSeen`), ett tips om gangen. Ikke i «Første tur».
- **Test:** `r4test` (16 m båt i Malangen: punktet i ruta, spørsmålet ved «Kast loss», Autonav til nærmeste lovlige sted og helt dit ved andre trykk, kaia før levering og sluttseddelen etter, og tipsene).

## 5.30 Kystvakta om bord (V1 i `docs/planer/oppdrag-2.md`, 31.10.2026)

Jonas: «Ja, få inn kystvakta.» Kystvakta kommer langs siden for kontroll, ved kai eller på feltet, og spør det regelmotoren alt vet. `core/09j-kystvakt.js`.

- **Når:** høyst én gang per spilluke. Ved hver ny spilluke (`weekOf`) kastes det om uka får en kontroll (`KV.p` 50 %, 25 % i to uker etter en kontroll uten merknad), og i så fall en tilfeldig time i uka (`S.kv.at`). Den første timen etter det med båten klar starter besøket; en uke som går uten (spillet lukket, kuling, Første uke), faller bort. Klar (`kvReady`) er: ikke i Første tur, minst tre leveringer og det første oppdraget gjort (eller fem leveringer), båten ved kai, på feltet eller stille (aldri under seiling, på grunn eller på slep), og under kuling (13,9 m/s) der båten er. Den kommer til båten spilleren følger.
- **Besøket:** et VHF-anrop i loggen og en beskjed på skjermen, så ligger skipet («Kystvakta», listet som NPC `kv` i `npcStates`) langs siden i en halv spilltime (`KV.visitMin`) og følger båten: ved kai om babord (kaia er om styrbord, `berthPose`), langs kysten om styrbord. Fra steg 100 (10.11.2026) er det Kystvaktas eget skip på 47 m (5.30d); før var det en kystbåt på 15 m, navy med hvit stripe, som ved kai lå 28 m fra havnas punkt og kunne havne på kaia. Båten stoppes ikke, og ingenting venter (ingen oppdiktet friksjon). Etter halvtimen kommer meldingen fra «Kystvakta».
- **Det hun ser på (`kvCheck`):** (1) de stoppende reglene for stedet (`rulesAt`, `block` og `no`) for hvert redskap i sjøen (ved redskapets midtpunkt, med arten redskapet og lasten mest har) og for juksa der båten fisker; (2) § 33a: over 80 garn innenfor fjordlinjene når torsk er arten; (3) § 33: over 5 000 kroker på line innenfor fjordlinjene der `fjordLimits` har krokgrense (ikke i de seks Finnmarksfjordene om vinteren); (4) bifangst uten adgang: torsk, hyse og sei over 10 % av lasten (`BYCATCH.share`, som kaia regner); (5) torsk om bord utover det som er igjen av kvoten (`quotaState`, `codLimitNow`, ikke under ferskfiskordningen); (6) § 18 røkting: garn eller line som har stått over to døgn på over 300 m, eller over fire døgn (de samme grensene som påminnelsene i `10-gear.js`). Minstemål spørres ikke om ved kysten (fangsten har ingen undermåls fisk etter modellens grenser), og redskapsmerkingen for kystredskapet sjekkes ikke; det sies ikke at de er sett på. Havbåtene får begge i havsjekken (5.30b).
- **Utfallet:** alt i orden gir én setning med hva som ble sett på (redskapen i sjøen, fangsten om bord, reglene for stedet), tellingen i papirene og merket «Rent skip» (`ACHL` `kv`: 1, 5, 10). En merknad leses opp med regelens tekst og kilde (høstingsforskriften, J-161-2026, deltakerforskriften, som regelmotoren siterer dem), uten ny straff (valg V-A A): fangst utover regelen inndras ved levering som før (`landConf`). En merknad gir en sak i Kystposten (type `kv`, `09h-press.js`): havna og regelkodene som én streng (`f33a-byc`, høyst fire), som spillet leser som kildene (`KV_REF`), aldri kiloene eller tekstene. Serveren tar typen når `supabase/migrations/20261030150000_news_kv.sql` er kjørt (SQL Editor); til da avviser `news_put` saken (400), som `pressFlush` svelger, og den står bare i egen avis.
- **Papirene:** kortet «Kystvakta» i Kvote-appen under Papirer (`papKv` i `08-home-papers-merker.js`): kontroller, uten merknad, siste kontroll med dato og utfall, og hva hun spør om. Håndboka får tipset «Kystvakta» etter første kontroll (`07c-handbook.js`), som peker til Regler-appens «Kan jeg fiske her?».
- **Måling:** hendelsen `kv_check` (`ok`, kodene, båtens status, nummeret, redskapstypene, kiloene om bord). Hyppigheten (50 %/25 % per uke) er et valg for ikke å mase, ikke et målt tall; den leses av i `kv_check` mot aktive spillere.
- **Tester:** `kystvakttest` (ren båt, 90 garn og 6 000 kroker innenfor fjordlinjene, bifangst uten adgang, besøket med skipet og ordet, merket og hendelsen, saken i Kystposten, ukekastet og kulingen, kortet i begge formater), `tests/unit/kystvakt.test.mjs` (grensene og tellingen av redskap).

## 5.30b Kystvaktas havsjekk om bord (H2e av `docs/planer/havsteget-h2-autoline.md`, 06.11.2026)

Jonas 06.11.2026: «Neste økt i havsteget: H2e, Kystvakta på havet, hele turen og stikkprøvene … spør Jonas før noe rulles ut.» Oppgaven: «Kystvaktas havsjekk om bord på autolineren: posisjonen mot § 26 og J-187-2026 § 32, merkingen etter §§ 66 og 68, fangsten mot fartøykvoten, minstemål, innblanding, og bifangsten av sei, lange og brosme.» Koden er i `core/09j-kystvakt.js` (`kvHavCheck`, `KV47`, `kvMix`, `kvSampleFish`, `kvHaulKeep`, `kvWhatHav`) og `core/10-gear.js` (`landFish`, `finishHaul`, `gopAbort`).

- **Når:** som før (5.30), høyst én gang i uka, aldri i kuling. Er båten du følger en havbåt (`S.lic.hav`) og ikke ved kai, er det en havkontroll: skipet ligger av babord (180 m, `KVH.side`) og setter over inspektører i lettbåten, og kontrollen tar 90 minutter (`KVH.visitMin`, antatt) mot en halvtime ved kai. Båten arbeider videre imens. Meldingen heter «Havkontroll på <posisjonen>», ikke nærmeste havn, som kan være 100 nm unna.
- **Posisjonen** (høstingsforskriften § 26, J-187-2026 § 32 tredje ledd, sonene): hver lenke i sjøen, og lenka som settes nå så langt den har gått, prøves mot de stoppende reglene for line med egnemaskin i begge ender og om lag hver kilometer mellom (`kvAlong`). En lenke på 6,5 km kan ha den ene enden innenfor 4 nm mens midten, som kystsjekken ser på, er utenfor. Merknaden sier hvor lina står og hvor langt fra grunnlinja.
- **Merkingen** (§§ 66 og 68, lest på Lovdata 06.11.2026): bøyestang med radarreflektor og flagg i hver ende, to flagg og to gule lys i vest og ett av hver i øst, vak høyst én nautisk mil fra hverandre, stang minst 2 m over vannet, lys synlig 2 nm med 20–25 blink i minuttet, og hvert vak merket med fartøyets registreringsmerke (`regOf`). Autolinesystemet har dette (5.66 og 5.67 i `redskap.md`), så sjekken teller stengene og vakene og sier dem i meldingen; den kan ikke slå feil i dag.
- **Fartøykvoten** (J-187-2026 § 14 tredje ledd: «Det er ikke adgang til å ha bifangst av torsk eller hyse ut over fartøykvotene»): torsken og hysa om bord pluss det som er landet i år mot fartøykvoten fra tillatelsen (`licQ`, `havQ`).
- **Bifangsten** i siste fangst (det siste draget, eller draget som pågår) og i fangsten om bord: sei høyst 25 % (§ 14 andre ledd: «i de enkelte fangster og av landet fangst»; de 50 % mens garnseifisket er åpent, er ikke med, som ved landing), lange høyst 35 % og brosme høyst 15 % etter stoppen for 28 m og over (J-128-2026 og forslaget for 2027, `lbShare`). Over grensen i siste fangst: flytt til et felt med mindre av arten. Over i lasten: det overskytende inndras ved levering, som før (`landConf`).
- **Minstemål og innblanding** (§ 47 og § 49, lest på Lovdata 06.11.2026): stikkprøven er fisken i det siste draget, telt mens den kom opp (`kvSampleFish` i `landFish`: hver fisk, også den som slippes), mot minstemålet der redskapet sto: torsk 44 cm nord for 62° N (55 cm innenfor 4 nm) og 40 cm sør, hyse 40/32, sei 45/40, blåkveite 45 cm; lange og brosme har ikke minstemål. Fra steg 59 (10.11.2026) er tabellen og kurven fiskets egne (`KV47 = MIN47`, `kvMinCm = min47Cm`, `kvCmKg = lwKg` i `02-species-gear.js`; uer og kveite telles også), så stikkprøven måler etter de samme målene som fisken sorteres etter om bord (`fiskerimodellen.md`, «Fisk under minstemålet slippes»). § 49 fjerde ledd: høyst 15 % torsk, hyse og sei under minstemålet til sammen, i antall i de enkelte fangster, nord for 62° N (20 % ved fiske etter hyse med line i område 03, femte ledd; 20 % torsk ved fiske etter torsk med juksa og line innenfor 4 nm av grunnlinjen nord for 62° N, sjuende ledd, lest 10.11.2026: «er det tillat å ha til sammen 20 % torsk under minstemål i antall i de enkelte fangster», og hysa og seien da etter fjerde ledd, fra steg 59; 15 % blåkveite, niende ledd; sør for 62° N 10 % av hver art, første ledd). Under 20 fisk sier ingenting. Over grensen: skift felt; Fiskeridirektoratet kan stenge feltet (§ 50 a). Innenfor grensen er fisken under minstemålet lovlig fangst (§ 51 b: levedyktig fisk kan slippes, død fisk landes).
- **Det spilleren ser:** VHF-anropet og meldingen med alt hun så på (antall punkter langs lina, stenger og vak med registreringsmerket, fangsten, bifangsten og stikkprøven med antall fisk målt og andelen under minstemålet). Kortet «Kystvakta» i Papirer har en setning om havsjekken når båten er en havbåt. Hendelsen `kv_check` har `hav` og `mix` (andelen under minstemålet i prosent). Kystposten får kildene, aldri kiloene (nye koder `kvoteh`, `seiby`, `lby`, `bby`, `f49` i `KV_REF`).
- **Ikke med:** kystbåtene får ikke stikkprøven av minstemål og innblanding. Fra steg 59 (10.11.2026) slipper modellen fisk under § 47 der den tas (55 cm torsk innenfor 4 nm nord for 62° N), så det kystbåten har om bord, er aldri under minstemålet: en stikkprøve av lasten ville aldri gi merknad (målt i `fiskeplay.py minste`, tallene i `fiskerimodellen.md`). Stikkprøven på havbåten teller hver fisk som kom opp, også den som slippes (tolkningen i backloggen); å gjøre det samme med juksa innenfor 4 nm ville gi merknad nesten hver gang (om lag en tredjedel av torsken er under 55 cm om sommeren), så det er ikke gjort. § 68 for kystbåtenes garn og line utenfor grunnlinja sjekkes heller ikke. Størrelsen på fisken varierer ikke med feltet, så innblanding over 15 % skjer knapt på autolina; målt 06.11.2026 nord for Loppa: 1 av 274 under minstemålet.
- **Tester:** `tests/unit/kystvakt.test.mjs` (§ 47 og § 49, stikkprøven, lenka med én ende innenfor 4 nm, merkingen, bifangsten i lasten og i siste fangst, fartøykvoten for hyse og torsk) og `kystvakttest` (en lenke satt, trukket og satt igjen nord for Loppa, havkontrollen med skipet av babord i 90 minutter, ordet, en lenke innenfor 4 nm og 45 % lange i siste fangst, Kystposten, kortet og meldingen i begge formater).

## 5.30c Kystvaktas havsjekk om bord i snøkrabbefartøyet (H3e av `docs/planer/havsteget-h3-snokrabbe.md`, 10.11.2026)

Startmeldingen (steg 26, Jonas' økt 10.11.2026): «Kystvaktas havsjekk for snøkrabbe i `core/09j-kystvakt.js`, bygd som H2e-sjekken for autolineren: posisjonen langs hver lenke (sokkelen, 12 nm, russisk sokkel, § 58, sårbare økosystemer), fredningen (teiner i sjøen 1.7–30.11), taket på 8 000 teiner (§ 28), merkingen (§ 66) og rømmingshullet (vedlegg 3 f), røkting og posisjonsmelding (§§ 18 og 25), fartøykvoten og tilleggskvoten, en stikkprøve av siste trekk mot minstemålet (§ 47) og bløtkrabben (20 %, J-237-2025 § 5), og at alt over minstemålet og død krabbe er beholdt (§ 51).» Koden er `kvSnoCheck` og `kvWhatSno` i `core/09j-kystvakt.js`; havkontrollen ellers (når, skipet av babord, 90 minutter, meldingen) er som 5.30b.

- **Kildene:** J-237-2025 lest i sin helhet på fiskeridir.no 10.11.2026 (§ 3: «en fartøykvote på 351 tonn»; § 4: «en garantert kvote på 82 tonn til levering av levende snøkrabbe»; § 5: «Det er forbudt å drive fangst av snøkrabbe og å ha snøkrabbeteiner i sjøen i perioden fra og med 1. juli til og med 30. november» og «Ved mer enn 20 % innblanding av bløtkrabbe i de enkelte fangster, skal fangstingen stoppes og fartøyet skal skifte fangstfelt»). Høstingsforskriften §§ 18, 25, 28, 29 med vedlegg 3f, 46, 47, 51 og 66 slik planen leste dem på Lovdata 06.11.2026 (kap. 2); 10.11.2026 nådde verktøyet bare starten av siden ordrett (sist endret FOR-2026-10-02-1999, uendret siden planen), så ordlyden er ikke lest på nytt.
- **Posisjonen:** hver snøkrabbelenke prøves langs hele lengden (`kvAlong`, om lag hver kilometer) med snøkrabbens egne regler (`rulesAt` med `sp:'snokrabbe'`, `gear:'teiner'`): `sk1` (innenfor 12 nm, også Svalbards og Jan Mayens sjøterritorium), `sk2` (annet lands sokkel, også den russiske delen av Smutthullet), `sk3` (fredningen: teiner i sjøen 1.7–30.11), `sk7`, `sv58` og `vme`. Merknaden sier hvor lenka står, og hvor langt fra grunnlinja for reglene som er avstander fra den (`sk1`; for `sk2`, `sv58` og `vme` bare stedet). Røktingen og posisjonen nevner den eldste lenka. Før H3e ble lenkene prøvd med arten lasten hadde mest av, så snøkrabbereglene ble aldri spurt (rettet).
- **Taket** (§ 28): over 8 000 teiner i sjøen (`SNOC.max`, lenka som settes nå så langt den har gått) er en merknad. Settingen stopper allerede over taket (`gearRules`), så det skjer ikke i spillet i dag.
- **Merkingen og rømmingshullet** (§ 66 tredje ledd, § 29 tredje ledd med vedlegg 3f): hver teine i sjøen telles mot `POTS[..].mark` og `.hole`. Snøkrabbeteina har begge (5.68 i `redskap.md`), så det er aldri en merknad i dag; meldingen sier registreringsmerket (`regOf`), rømmingshullene med bomullstråd og blåse og bøyestang i hver ende.
- **Røktingen og posisjonen** (§ 18, § 25 annet ledd b): lenka som har stått lengst uten røkting, over tre uker (`SNOC.tendH`), og eldste posisjonsmelding over tre uker (`SNOC.posH`; fangstdagboka melder den ved setting og hver tredje uke, `snoTend`).
- **Kvotene** (J-237-2025 §§ 3 og 4, fra 2027 forslaget i sak 17/2026 eller spillets bestand, `snoYear`): krabben om bord i rund vekt mot det som er igjen av fartøykvoten med kvotefleksen og tilleggskvoten, regnet som landingen ville gjort det (`snoLandQ`: den levende krabben først på tilleggskvoten); det landingen ville inndra, er merknaden. Meldingen sier hvor mye som er landet av hver.
- **Stikkprøven av siste trekk** (trekket som pågår, eller det siste innen to døgn): sorteringen fra `landSno`, som `kvHaulKeep` nå gjemmer for snøkrabbetrekk (`sno`: beholdt, satt ut, under 9,5 cm, hunner, bløte, døde). Merknader: levende krabbe under 9,5 cm beholdt (`uk`, §§ 46 og 47), krabbe over minstemålet eller død krabbe satt ut (`ro`, `rd`, § 51), og over 20 % bløtkrabbe i et trekk med minst 50 beholdt (det `snoHaulDone` melder og gjemmer i `S.snoSoft` i en uke, `SNOC.softDays`) fulgt av en lenke satt på samme felt (samme lokasjon i sluttseddelstatistikken, `lokOfCell`) etterpå, eller som settes der nå (J-237-2025 § 5). Et trekk på et annet felt siden skjuler det ikke. Spillets sortering (`landSno`) følger reglene, så `uk`, `ro` og `rd` er 0 i dag; de telles for når sorteringen blir mannskapets eller spillerens. Å trekke lenker som sto på feltet før bløtkrabbetrekket, er ingen merknad: de må tas opp for å flyttes.
- **Ikke med:** fangstdagbok og ERS/VMS (ikke lest), et eget forbud mot hunnkrabbe (ikke funnet i forskriften), kontroll av lasten om bord mot minstemålet (klørne kan ikke måles; sorteringen er det som teller), at fartøyet røkter sine egne teiner (§ 18 annet punktum: spillet har bare egne lenker).
- **Tester:** `tests/unit/kystvakt.test.mjs` del `sno` (19 sjekker, sett røde mot koden før H3e) og `tests/havtur.py krabbe` (hele turen, Kystvakta om bord mens den første lenka trekkes, «alt i orden» etter 90 minutter med alt hun så på).

## 5.30d Kystvaktskipene (steg 100, 10.11.2026)

Valg 30 (Jonas 10.11.2026: «V1 C / V2 A / V3 A»): to skip fra samme skript, `tools/boats/kv.py`, med grunnlaget i `docs/skipsmodeller/kystvakt-grunnlag.md`. Koden er `KVS`, `kvShip`, `kvOff`, `kvPose`, `kvRib` og `kvNpcs` i `core/09j-kystvakt.js` og `npcType`, `kvDraw` og `kvRibDraw` i `view3d/20-trawl-seine.js`.

- **Skipene:** `kv47` (47,2 × 10,3 m, om lag 760 t, etter ST-610-typen i den indre kystvakten) ved kai og langs kysten, `kv90` (93 × 16,6 m, om lag 3 250 t, etter VS 794-typen i den ytre kystvakten, med helikopterdekk akter) til havs. Grått skrog, de skrå stripene i rødt, hvitt og blått og «KYSTVAKT» på siden, ingen skipsnavn eller kjenningsnummer. Middels detalj: 28 og 36 tusen trekanter nær, 2,2 og 2,6 tusen fjern.
- **Kan ikke kjøpes:** skipene er ingen type i `VESSELS` (Båthandelen, flåten, verftet og `vesseltest` ser dem ikke). `kvNpcs` gir NPC-en `vtype` (`kv47`/`kv90`), modellens lengde og bredde; `npcType` tar modellen når NPC-en er Kystvakta og modellen er i siden, ellers kitets båt av samme størrelse som før. `npcKB` leser den rett fra GLB-en (`glbModel`), `npcMesh` skalerer med GLB-ens egne mål (1:1). Hun tegnes nær ut til 900 m (`npcNear`), uten bølgegang (som de store skipene), med skipperen på broa og to på dekk, og lanternene fra modellen (to topplanterner på det store) med det blå rundtlyset over.
- **Plassen** (`kvPose`, `kvOff`): ved kai der båten ligger i 3D (`berthPose`, ikke havnas punkt), om babord med 1,5 m klart på fendere (`KV.gap.kai`), flyttet ut en meter om gangen så lenge skroget ville stått på land, en pir eller en havneenhet (`berthBlocked`, inntil 40 m); langs kysten om styrbord, 6 m klart (`KV.gap.sjo`); til havs om babord, 180 m mellom sentrene og aldri under 30 m klart (`KVH.side`, `KVH.gapMin`). Avstanden regnes med begge halvbreddene, så skrogene aldri møtes for noen båttype (`tests/unit/kvskip.test.mjs`).
- **Lettbåten** (V2 A): det store skipets RIB om styrbord er en egen del i GLB-en (`rib`, `anchors.rib`). `kvRib` gir fasen ut fra minuttene siden besøket begynte: firt ned fra daviten (2 min), over til fartøyet (6), langs fartøyets babord side mens inspektørene er om bord (74), tilbake (6), heist inn (2), til sammen de 90 minuttene (`KVRIB`, tidene antatt). 3D-visningen flytter den mellom daviten, vannet under den og fartøyets babord side slik båten ligger der (`bv`), med føreren og to inspektører på vei over og tilbake. Ved kai trengs den ikke.
- **Tester:** `tests/unit/kvskip.test.mjs` (typene, plassen for alle båttypene, sidene, fasene; sett rød mot koden før steg 100) og `tests/kvshot.py` (modellene i siden og ikke i `VESSELS`, lanternene, plassen ved kai og til havs, bildene i begge formater; ikke i `run.py`, SwiftShader alene).

## 6. Regelverk og kilder

| Tema | Kilde | Hovedpunkter |
|---|---|---|
| Kvoter nord for 62° N | J-161-2026, gjeldende fra 01.10.2026 (fiskeridir.no/yrkesfiske/j-meldinger/j-161-2026). Kjeden: J-30, J-43, J-52, J-57, J-76, J-80, J-88, J-137, J-156, J-161 | Se 5.5. Stopp i åpen gruppe 16.4.2026 (J-57). Garantert torsk 8–9,99 m er 4,2 t |
| Fordeling av norsk kvote | Fiskeridirektoratets saksdokument 5/2025 (reguleringsmøtet november 2025), og tilsvarende for 2019–2024 | Avsetninger, åpen gruppe 6,62 %, trålstigen, Finnmarksmodellen. Gir § 5 eksakt |
| Bestander og råd | HI, kvoteråd for 2027 (juni 2026), og IMR-VNIRO-rapporten 2026 | Torsk: TAC 2026 285 000 t, råd 2027 312 667 t, B_lim 220 000, B_pa 460 000 t. Hyse og sei i STOCK |
| Strukturkvoter | Forskrift om spesielle kvoteordninger for kystfiskeflåten (J-244-2025), og høringsnotatet om strukturgevinst 2026 | 11–27,99 m, samme gruppe, 10 % avkorting, 20 år, kvotetak 5× (11–14,99) og 6× (15–27,99) for en spesialist (§ 12; 3× og 4× til KM1). Særlig kvoteordning under 11 m fra 2025 |
| Strukturkvoter, lest på nytt for kvotemarkedet | Forskrift 7. november 2003 nr. 1309 (Lovdata, sist endret FOR-2025-12-19-2812, lest 07.11.2026) og deltakerloven (LOV-1999-03-26-15) | § 8: båten «meldt ut av registeret over fiskefartøy» og deltakeradgangene oppgitt, ingen krav om kondemnering. § 9: landsdel (Nord-Norge eller Sør-Norge) i 12 måneder for torsk, hyse og sei. § 12: 3× eller 5× i én sektor (11–14,99 m), 4× eller 6× i én sektor (15–27,99 m). Kap. 2 § 6: den særlige ordningens andre kvote faller bort ved salg for fortsatt drift. Deltakerloven § 4 annet ledd, § 6 og § 7 b. Spillet bruker fortsatt 3× og 4× (backloggen, «Kvotemarkedet, funnene fra planen») |
| Fiskeritillatelser og strukturgevinst (forslag) | Fiskeridirektoratets høringsnotat 26.03.2026 (fiskeridir.no, høringen «Fiskeritillatelser, kvotetak og fordeling av strukturgevinst», lest 07.11.2026) | Utkastets § 5: utskiftning, overtakelse av fartøy for fortsatt drift og flytting av driftsgrunnlag; § 6 lengdegrensene for flytting (11, 15, 21 m); § 7 forhåndstilsagn i to år; § 8 driftskravet (foreslått). Avkortingen er 10 % for alle fra 27.11.2020. Strukturgevinsten ved utløp etter modell X (Stortinget vedtak 592, 2023–2024); de første strukturkvotene går ut 31.12.2026. 1 452 deltakeradganger i torsk nord, kyst, per 31.12.2025 (tabell 3). Brukes i `docs/planer/kvotemarkedet.md` |
| Forslag etter høring (Fiskeridirektoratet 11.09.2026, PDF lenket fra samme høringsside, lest 08.11.2026) | Direktoratets forslag til departementet etter høringen | Driftskravet (§ 8) avventes for kystflåten og konvensjonelt hav (kap. 2.2.2); det gjelder trål, ringnot, reketrål nord og snøkrabbe. § 6 (lengderegelen) kodifiserer forholdsmessighetsinstruksen 7.9.2022 uten materielle endringer og gjelder ikke overtakelse for fortsatt drift (kap. 8.1.5). § 7 forhåndstilsagn «med en varighet på to år», også når fartøyet skal brukes på et annet kvotesett i samme rederi. Kvotetaket i kystflåten står (3+3/5+1, 4+4/6+2), med 4+2 og 5+3 i tillegg (kap. 4.2.2). Brukes i `core/03i-kvotemarked.js` |
| Åpen gruppe og ferskfisk, historikk | Saksdokumentene 2019–2025 | Stopp 24.3.2019, 20.4.2020, 1.5.2023, 15.5.2025, 16.4.2026; ingen i 2021, 2022, 2024. Ferskfisk 2017–2025 |
| Maskevidde i torskegarn | Maskeviddeforskriften (Lovdata 1989-10-10-1095) | Minst 156 mm nord for 62° N. Spillet selger 156, 180 og 200 mm |
| Trekk i oppgjøret | Norges Råfisklag, «Forklaring til trekk på fiskers avregning» (rafisklaget.no, lest 04.10.2026) | Lagsavgift 0,43 % (ferskt fra 1.7.2026). Av totalen minus den: pensjonstrekk 0,4 %, produktavgift 1,6 % (fra 1.1.2026), forskningsavgift 1,35 %, ressursavgift 0,42 %, kontrollavgift 0,22 % (ikke under 15 m ennå). MVA 11,11 % på salget til salgslaget. Se 5.4 |
| Fjordlinja og redskap | Høstingsforskriften kap. VI (§ 31, 33, 33a, lest 04.10.2026) | Innenfor: høyst 80 torskegarn og 5 000 kroker (yttersidene av kroklinjene i Finnmark unntatt 1.11–30.4), ikke snurrevad. 15 m eller mer: ikke torsk; under 21 m andre arter, sør for 68° 15,6′ N annet enn torsk. Se 5.28 |
| Torsk i Skagerrak | FOR-2025-12-19-2805 §§ 1, 2, 4 og 5 (Lovdata, lest 07.11.2026, sist endret FOR-2026-10-01-1976; J-160-2026), og FOR-2022-12-16-2281 (2023, samme ordlyd) | Torsk forbudt for norske fartøy utenfor grunnlinjen øst for linja Lindesnes–Hanstholm; unntak juksa under 11 m, blad B, 1.4–30.6, høyst 3 t; 52 t norsk kvote; 5 % bifangst. Se 5.28c |
| Kysttorsk etter lengde | J-161-2026 § 32 (lest 04.10.2026) | 21–27,99 m ikke innenfor grunnlinja, 28 m og over ikke innenfor 4 nm, med unntak etter område og dato. Henningsværboksen og Borgundfjorden. Se 5.28 |
| Grunnlinja og sonene | Kartverket, Norges maritime grenser (Geonorge, 25833) | Grunnlinja, 1, 4, 6, 10, 12 og 24 nm. Se 4.17 |
| Sonene utenfor kysten | Kartverket, Norges maritime grenser; Fiskeridirektoratet, Yggdrasil/Sjøgrenser_linje (hentet 04.11.2026) | NØS, fiskevernsonen, Jan Mayen, territorialfarvannet ved Svalbard og Jan Mayen, sokkelen; nabolandenes 200 nm og linjene mellom dem. Se 5.28b |
| Svalbard | J-248-2025, J-247-2025, høstingsforskriften § 58 (Lovdata, lest 04.11.2026), forskriften om sårbare marine økosystemer (lag 25) | Torsk og hyse på kvotene, ikke sei (J-161-2026 § 2). Bjørnøya 20 nm og vestsiden av Spitsbergen 15–20 nm stengt, unntatt reketrål og skjellskraping |
| Jan Mayen | J-161-2026 § 1, J-61-2026 | Torsk og hyse forbudt. Kartleggingsfiske 181 t torsk med line for konvensjonelle havfiskefartøy, ett fartøy om gangen |
| Utenlandske soner | J-94-2026 (Grønland), J-133-2026 (Færøyane), J-177-2026 (Storbritannia), skjema FD-54 (Russland), FOR-2023-01-12-35 (Island, opphevet) | Lisens for andre lands farvann. Kvoter per gruppe og fartøy, se 5.28b. Ingen islandsk adgang funnet for 2026 |
| Snøkrabbe | J-237-2025 | Bare utenfor territorialfarvannet, på norsk sokkel, stengt 1.7–30.11, fartøykvote 351 t (+82 t levende) |
| Reguleringskartet | Fiskeridirektoratet, Yggdrasil/Fiskerireguleringer (38 lag) og Statistikområder | Fjordlinjer, kroklinjer, stengte felt, gytefelt, Oslofjorden, Lofoten, kongekrabbe. Se 4.17 |
| Minstemål og innblanding | Høstingsforskriften §§ 46–51 (Lovdata, lest 06.11.2026, sist endret FOR-2026-10-02-1999) | § 47: torsk 44 cm nord for 62° N (55 innenfor 4 nm), 40 sør; hyse 40/32; sei 45/40; blåkveite 45; kveite 84 cm og 7,2 kg; uer 30/32 (utenfor/innenfor 12 nm); ikke lange og brosme. § 49: 10 % av hver art i antall i de enkelte fangster; nord for 62° N 15 % torsk, hyse og sei til sammen med trål og konvensjonelle redskap, 20 % hyse med line i område 03, 20 % torsk med juksa og line innenfor 4 nm, 15 % blåkveite og uer. § 50: Fiskeridirektoratet kan stenge felt. § 51: all fangst landes, unntatt levedyktig fangst som slippes. Se 5.30b |
| Merking | Høstingsforskriften §§ 66 og 68 (Lovdata, lest 05. og 06.11.2026) | Vak merket med registreringsmerket; utenfor grunnlinjene bøyestang med radarreflektor eller flagg i hver ende, to i vest og ett i øst, gule lys om natta (2 nm, 20–25 blink), vak høyst 1 nm fra hverandre, stang minst 2 m. Se 5.30b |
| Røkting | Høstingsforskriften kap. V | Garn og line for kveite og breiflabb minst hver 4. dag. Hvert fartøy røkter egne teiner |
| Trål | Høstingsforskriften kap. XIII | Forbudt innenfor 12 nm, med unntak. Ikke i spillet ennå |
| Tapt redskap | Fiskeridirektoratet, «Meld tapt redskap» | Meldes til Kystvakten med type, mengde og posisjon |
| Kongekrabbe | Fiskeridirektoratet J-136-2026 og J-138-2026; Råfisklagets minstepriser fra 5.10.2026 og prisstatistikk; Havforskningsinstituttets tokt 2023–2026 | Kvoteområde øst for 26° Ø for Finnmark. Fritt fiske vest for linja uten kvote og minstemål, alt skal landes. Stengt 1.–9.11 ved Nordkapp. Minstepris for levende krabbe per klasse, død krabbe 0 kr. Nesten ingen i Troms, mest vest for Nordkapp og i kvoteområdet |
| Line | Store norske leksikon, «line» | Ca. 300 kroker per stamp bankline og 700 hyseline. Snøreline står 3–4 t, annen line over natta |
| Deltakelse | Deltakerforskriften 2025/2026 (Lovdata) | Eier med ≥ 50 % i båt i lukket gruppe gjør at andre båter ikke kan være i åpen gruppe. Eier med båt i åpen gruppe kan ikke ha flere der |
| Eier om bord | Fiskeridirektoratets høringsnotat 26.03.2026 | I åpen gruppe må eieren selv være høvedsmann om bord (unntak ved sykdom, graviditet med mer) |
| Én båt | NFD pressemelding 19.12.2025 | «Ein person, ein båt, ein kvote» |
| Bifangst uten adgang | J-161-2026 § 35 (sjekket 04.10.2026) | Høyst 10 % torsk, hyse og sei samlet per landing, og høyst 2 t torsk |
| Kveite | Høstingsforskriften § 39, 2026 | Fredet 20.12–20.4, 84 cm / 7,2 kg, slippes over 200 cm |
| Minstepriser | Råfisklaget: dynamiske minstepriser for torsk, hyse og sei, og rundskriv 13/2026 for de andre artene (21.09–13.12.2026, kontrollert 24.10.2026) | Se `SPECIES.cls` |
| Priser og sesong | Råfisklaget, salgsstatistikk 2025 | Troms-sonen, fersk |
| Fiskere | Fiskerregisteret 2025 | 9 210 med fiske som hovedyrke og 1 115 med biyrke. Troms 963, 6 % kvinner, 24 % under 30 år |
| Kvotepris | Riksrevisjonen 2017 | 9-meters hjemmel rundt 1,8 mill. kr |
| Hviletid | Forskrift om arbeids- og hviletid på fiskefartøy (FOR-2017-11-10-1758) §§ 1 og 3 | ≥ 10 t hvile per 24 t og ≥ 77 t per 168 t, høyst to perioder der én er ≥ 6 t, og ≤ 14 t mellom hvileperiodene. Gjelder ikke den som jobber alene på egen båt. Snittet på 48 t arbeid per uke er ikke modellert. Sjekket mot søkeresultat 01.10.2026, fordi Lovdata er sperret her. |

**Følg med på:**
- Fiskeridirektoratets forslag til ny forskrift om fiskeritillatelser og ny forskrift om spesielle kvoteordninger og strukturgevinst (høring 26.03.2026, «Forslag etter høring» 11.09.2026, ikke lest). Det endrer navnene og kan gi driftskrav ved salg; kvotemarkedet (`docs/planer/kvotemarkedet.md`) bygger på det.
- Arbeidsgruppens rapport om åpen gruppe fra 23.06.2026, som foreslår minstekvantum og aldersgrense 30 år.
- Høringen om kveiteregulering, som kan gi åpen gruppe for kveite for båter under 15 m.
