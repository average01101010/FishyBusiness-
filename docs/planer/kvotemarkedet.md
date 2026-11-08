# Kvotemarkedet: kjøp og salg av kvote mellom spillere (plan 07.11.2026)

Steg 30 i `docs/planer/koen.md` (`/planlegg`, stopper ved valgene). Dette er en plan med valg, ikke noe som er bygd. Jonas tok valgene 07.11.2026 (kap. 10), og fasene står som steg 60–64 i køen.

## 1. Hva Jonas ba om

Jonas 07.11.2026, om V5 i `docs/planer/etter-tonys-test.md` (hjemmelen ved båtsalg mellom spillere): «Kvoter kan vel selges med båten på ekte også? Men planen min er å lage et kvotemarked også der man kan kjøpe og selge kvoter.» B8 holder hjemmelen med båten til denne planen er skrevet.

Startmeldingen for steg 30 ba om fem ting i tillegg til det vanlige: det virkelige som grunnlag (strukturkvoteordningen, kvotetak, salg «for fortsatt drift» med Fiskeridirektoratets godkjenning, kondemnering) med kilder; én felles kvote per art som spillerne deler; det B alt har på serveren; hva som skjer med kvoten når båten selges (B8); og hva som holder markedet levende med få spillere uten NPC-flooding (det vil Jonas ikke ha).

Reglene fra `CLAUDE.md` som gjelder her: alt kan nås uten å betale; ingen tilfeldige utfall for ekte penger; Friction for Flow (ingen ventetid lagt inn for å selge oss forbi den); sosialt er additivt; mål og se.

## 2. Slik er det i virkeligheten

Lest 07.11.2026. Kildene står i kap. 9.

**Kvoten er en andel, ikke kilo.** En båt i lukket gruppe fisker kvotefaktoren sin ganger årets kvoteenhet for gruppa. Enheten kommer av gruppekvoten, som kommer av totalkvoten (J-187-2026 §§ 5, 16, 18; kvotekjeden i `kvoter-og-regler.md` 5.5). Det som omsettes, er derfor tillatelser og kvotefaktorer. Tonnene følger av året.

**Tillatelsen hører til eieren og ett bestemt fartøy.** Deltakerloven § 4 annet ledd: «Ervervstillatelse gis til fartøyets eier for ett bestemt fartøy.» Kjøperen må oppfylle aktivitetskravet i § 6 («minst tre av de siste fem årene og fortsatt er knyttet til fiske- og fangstyrket»). For de lukkede gruppene kreves i tillegg at eier og høvedsmann står på blad B (høringsnotatet 26.03.2026, kap. 3.2). Kvote kan ikke selges eller leies som kilo: det er ikke lov å overføre fangst eller kvantum til en annen båt (J-187-2026 § 30, slik `kvoter-og-regler.md` 5.5 leser den). Det som ligner mest på leie, er kvotesamarbeidet i § 31, for ett år, med begge eierne om bord.

**Tre veier for en tillatelse** (Fiskeridirektoratets utkast til ny forskrift om fiskeritillatelser, høringsnotatet 26.03.2026 kap. 10, § 5; utkastet samler reglene i deltakerforskriften for 2026, som ikke er lest direkte):
- **a) Utskiftning:** eieren bytter ut sin gamle båt med en brukt eller et nybygg og beholder tillatelsen.
- **b) Overtakelse av fartøy for fortsatt drift:** kjøperen overtar båten med tillatelsen. Det er det B8 gjør i dag.
- **c) Flytting av driftsgrunnlag:** eieren av en båt oppgir tillatelsen, og den tildeles en annen båt. Slik selges en hjemmel uten båten.

**Lengden.** Utkastets § 6 nekter utskiftning og flytting fra en båt under 11 m med hjemmel under 11 m til en båt på 11 m eller mer. Det samme gjelder 15 m og 21 m. Skjæringsdatoen 5. juli 2019 i paragrafen tyder på at regelen gjelder alt i dag. Spillet sier i dag «ingen lengdegrense» (`HJ` i `core/03d-quota.js`), men det gjelder hvilken båt som kan *ha* en hjemmel, ikke flyttingen, som spillet ikke har ennå.

**Driftskravet (forslag).** Utkastets § 8 sier at den som selger båten eller oppgir tillatelsen, må ha levert fangst på tillatelsen i år eller ett av de to foregående årene. Kravet gjelder blant annet «Konvensjonell kysttillatelse nord» og snøkrabbe. Fiskeridirektoratet kan gi dispensasjon når tillatelsen struktureres. Kravet er foreslått, ikke vedtatt.

**Forhåndstilsagn.** Utkastets § 7 sier at en eier som selger båten uten å ha en ny, kan få tilsagn om tillatelsen for en båt han ikke har kjøpt ennå. Tilsagnet varer «to år».

**Forslag etter høring (Fiskeridirektoratet 11.09.2026, lest 08.11.2026 i KM1).** Direktoratets forslag til departementet etter høringen, PDF lenket fra høringssiden (kap. 9). Det endrer ett av de tre:
- **Driftskravet er tatt bort for kystflåten.** Kap. 2.2.2: «Fiskeridirektoratet tar imidlertid tilbakemeldingene til etterretning og foreslår å avvente å innføre et driftskrav for tillatelsesgrupper i kystfiskeflåten samt konvensjonell havfisketillatelse nå.» § 8 i det nye utkastet gjelder bare torsketrål, seitrål, pelagisk trål, nordsjøtrål, ringnot, reketrål nord og snøkrabbe. «Konvensjonell kysttillatelse nord», som er alle hjemlene i markedet, er ikke med. KM1 har bygd regelen, men den er av (`KM.drift = false`), og valget står som valg 15 i køen.
- **Lengderegelen (§ 6) står.** Den kodifiserer forholdsmessighetsinstruksen 7. september 2022 «uten tilsiktede materielle endringer», gjelder ved utskiftning og flytting av driftsgrunnlag, og «gjelder ikke ved overtakelse av fartøy for fortsatt drift» (kap. 8.1.5). Teksten i utkastet: «Søknader om flytting av driftsgrunnlag skal avslås dersom: a. tildeling av fiskeritillatelse med hjemmelslengde under 11 meter tilhørende fartøy med største lengde under 11 meter, til fartøy med største lengde på eller over 11 meter», og det samme for 15 og 21 m. Unntaket for hydrogendrevne båter under 13 m er ikke med i spillet.
- **Forhåndstilsagnet (§ 7) står,** «med en varighet på to år», og kan nå også gis når fartøyet «skal benyttes på annet kvotesett i samme rederi» (kap. 8.1.6). Den ledige hjemmelen i høyst to spillår følger det.
- **Kvotetaket står:** 3+3 og 5+1 for 11–14,99 m, 4+4 og 6+2 for 15–27,99 m, og direktoratet «opprettholder forslaget» om 4+2 og 5+3 i tillegg (kap. 4.2). En spesialist i torskesektoren har fortsatt 5 og 6 ganger.

**Strukturkvoteordningen for kystflåten** (forskrift 7. november 2003 nr. 1309 om spesielle kvoteordninger for kystfiskeflåten, sist endret 19.12.2025):
- § 3: kvoter kan utveksles mellom fartøy «dersom et fartøy tas permanent ut av fiske».
- § 8 krever at båten blir «meldt ut av registeret over fiskefartøy» og at alle deltakeradgangene på den oppgis. **Kondemnering (hogging) kreves ikke lenger.** Deltakerloven § 7 bokstav b nekter likevel ny ervervstillatelse til en båt som er tatt ut slik.
- § 9: bare hjemmelslengde 11–27,99 m, i samme gruppe (11–14,99, 15–20,99 eller 21–27,99 m). For torsk, hyse og sei må begge båtene ha vært registrert i samme landsdel i minst 12 måneder. Nord-Norge og Sør-Norge er hver sin landsdel.
- § 11: «Strukturkvoten skal tilsvare kvotefaktoren for det fartøyet som tas ut av fiske, men avkortet med 10 prosent av denne.» Den gis i inntil 20 år, eller 25 år regnet fra 2008 for kvoter gitt før 2007. Avkortingen er 10 % for alle fra 27.11.2020 (høringsnotatet 7.2.2.1).
- § 12, kvotetaket: 11–14,99 m inntil 3 ganger egen kvote, eller 5 ganger i én sektor. 15–27,99 m inntil 4 ganger, eller 6 ganger i én sektor når den andre er høyst 2. Høringsnotatets tabell 9 skriver det som 3+3 og 5+1, og 4+4 og 6+2. Departementet ba om å vurdere 4+2 og 5+3 i tillegg. Spillet har bare torskesektoren (pelagisk sektor er sild og makrell), så en spillers båt er spesialist, og taket er 5 og 6 ganger. Spillet bruker i dag 3 og 4 (`STRUCT.cap`).
- § 12 tredje ledd: strukturkvoten gis for fiske med det enkelte fartøyet, men «kan tildeles for fiske med annet eller flere andre fartøy», eller med et erstatningsfartøy. § 11b: en strukturkvote kan deles og flyttes fra neste kvoteår.

**Strukturgevinsten.** Avkortingen går tilbake til gruppa, «jevnt på kvotefaktorene i den aktuelle gruppen» (departementets instruks 27.10.2016). Når en tidsbegrenset strukturkvote går ut, fordeles den etter Stortingets vedtak 592 (2023–2024) «med full effekt på grunnkvoter og halv effekt til gjenværende strukturkvoter (modell X), etter opprinnelig hjemmelslengde». De første strukturkvotene går ut 31.12.2026 (høringsbrevet). Fra da av er det en ny type kvotefaktor, strukturgevinstkvotefaktoren, som kan holdes utenfor kvotetaket.

**Den særlige kvoteordningen under 11 m** (kap. 2 i samme forskrift, endret fra 01.01.2026):
- § 4: eieren har to båter med hjemmel under 11 m, har eid begge siden året før, oppgir den enes hjemmel og sletter den båten. Den gjenværende båten fisker begge kvotene.
- § 6 (ny): «Ved tildeling av deltakeradgang ved salg av fartøy for fortsatt drift, ved utskifting av fartøy eller til erstatning for tilsvarende deltakeradgang, faller kvote for deltakeradgang som er oppgitt etter § 4 annet ledd bokstav c bort.» Den andre kvoten følger altså ikke med når båten selges.

**Eierkonsentrasjon.** Kystflåten har ingen grense for hvor stor del av en gruppe én eier kan ha (høringsnotatet 2.4.2). Stortinget har bedt om grenser for andre arter enn torsk, hyse og sei nord (vedtak 587 og 588, 2023–2024). Havflåten har grenser, for eksempel 15 % av gruppekvoten per art for konvensjonelle havfiskefartøy og 12 kvotefaktorer for torsketrål (2.4.1).

**Antallet.** Det var 1 452 deltakeradganger i torsk, hyse og sei nord, kyst, per 31.12.2025, mot 1 648 i 2023 og 2 423 i 2005 (høringsnotatet tabell 3). Det er om lag hundre færre i året, mest gjennom strukturering. Spillet har 1 622 (`REGN`, saksdokument 5/2025 tabell 8, 17.10.2025); forskjellen er ikke forklart (kap. 7).

**Kvoteprisen.** Ingen offentlig kilde for kvotepriser er funnet, heller ikke ved et nytt søk 07.11.2026. Spillet bruker 260 kr/kg torsk (`KPK`, ett salg i 2025 på rundt 270 kr/kg; Riksrevisjonen 2017: en hjemmel på 9 m rundt 1,8 mill. kr).

## 3. Slik er det i spillet i dag

- **Hjemlene** (`core/03d-quota.js`): `HJ` har hjemmelslengdene med kvotefaktoren, og `licQ` gir årets kvote i kilo av faktoren og kvoteenheten. `licValue` (`core/03-simulation.js`) er torskekvoten ganger `KPK`, og `vesselValue` tar med 95 % av den.
- **Registeret** er ett for alle på serveren (`reg_rights`, `reg_held`, `reg_take`, `reg_free`; `npcReg`, `regTake`, `regFree`, `regSeller`). Det har 1 622 hjemler med NPC-eiere. En spiller kommer inn ved å kjøpe av en som går ut, på verftet (`LIC_OFFERS`, Båthandel → Med hjemmel). En spiller uten landing eller kjøp på 90 dager gir plassen tilbake. Kvote-appen viser «ukas selger» per hjemmelslengde, men kjøpet er ikke begrenset til én i uka.
- **Strukturkvote** (`STRUCT`, `structRoom`, `structPrice`, `structIn`, `structExpire`): du kjøper en NPC-hjemmel i samme gruppe, får faktoren minus 10 % i 20 spillår, innenfor 3 eller 4 ganger egen kvote. Kvote-appen sier at båten «hogges».
- **Den særlige ordningen under 11 m** (`twoOK`, `l.two`) og **kvotesamarbeid med en NPC-eier** (`COOP`, `coopOffer`, `l.coop`).
- **Kvote-appen → Marked** (`ui/phone/04-kvote.js`, `kvMkt`): tabellen over registeret, havtillatelsene, knappene for strukturkvote, den særlige ordningen og kvotesamarbeidet. Handlingene ligger i `ui/phone/14-act.js` (`struct`, `two`, `coop`).
- **B, båtsalget mellom spillere** (`supabase/migrations/20261107140000_broker.sql`, `core/09k-market.js`, `ui/10s-broker.js`, `ui/phone/13c-megler.js`): `listings`, `bids`, innboksen `broker_ledger` (én rad per krone og per båt, brukt én gang av spillet), `listing_settle` hvert minutt, `broker_cash_ok`, `broker_wish` og push med `broker_tell`.
  - **B8:** hjemmelen følger båten, og plassen i registeret flytter med (`broker_reg_move`). `mbPack` tar bort kvotesamarbeidet, men ikke `two`, så den andre kvoten fra den særlige ordningen følger med til kjøperen. Det strider mot kap. 2 § 6 (kap. 7).
  - **Hurtigsalg til megleren** gir hjemmelen tilbake til registeret (`regFree`).
- **Den felles kvoten:** med verdensklokka får alle spillerne samme frø (`WORLD_SEED`, `ui/11-boot.js`), så kvoteårene, bestanden og kvoteenheten er like for alle. Med bryteren `stock_server` (B4) kommer bestanden fra serveren. Åpen gruppes gruppekvote fiskes ned med alle spillernes landinger (`wshOpen`), og admin viser spillernes andel av gruppekvoten (`admin_share`).
- **Det som mangler:**
  - En spiller kan ikke selge en hjemmel uten båten.
  - Ingen kan selge eller kjøpe en strukturkvote fra en annen spiller.
  - Alt som kjøpes, kommer fra NPC-eierne, og alltid til 260 kr/kg.

## 4. Designet

### 4.1 Prinsippene

1. **Det som handles, er tillatelser og kvotefaktorer, aldri kilo** (V1). Tonnene følger av året: kvotefaktoren ganger kvoteenheten.
2. **Én felles kvote.** Summen av kvotefaktorene i en gruppe ligger fast, fordi registeret har et fast antall hjemler. Det én spiller kjøper, har en annen spiller solgt, eller en NPC-eier har gått ut. Kvoteenheten er den samme for alle (frøet, og bestanden fra serveren når bryteren er på), så samme hjemmel er like mye verdt hos kjøperen som hos selgeren. Handelen flytter bare hvem som fisker. Bestanden påvirkes av fangsten, ikke av handelen.
3. **B sin mekanikk, ingen NPC-oppføringer.** Auksjon med startpris, «Kjøp nå» og varighet (1 t, 6 t, 1 døgn, 3 døgn i ekte tid), bud som binder pengene, oppgjør hvert minutt og innboksen. Kommisjonen er 5 % og hurtigsalget 90 %, som Jonas valgte for B (V4 A og V6 A). Ingen nye valg om dem.
4. **Registeret er gulvet.** De virkelige eierne som spillet alt har, er der fra før. De legger ikke ut oppføringer, men selger og kjøper til taksten, slik verftet er gulvet for båtene (B6). Etter V3 A selger de som i dag, så lenge det finnes eiere.
5. **Reglene som i virkeligheten der de gjør spillet bedre:** blad B, samme gruppe, kvotetaket, 10 % avkorting, 20 år, lengdegrensen for flytting og driftskravet. Ingen ventetid for saksbehandlingen. Fiskeridirektoratet godkjenner ved oppgjøret og sender melding. Saksbehandling tar uker i virkeligheten, og å legge inn den ventetida bryter Friction for Flow.
6. **Bare spillkroner.** Ingen haill, ingen ekte penger og ingen «Ferdig nå» i markedet. Ingen tilfeldige utfall, og varen er kjent på forhånd: kvotefaktoren, årene som er igjen, og det som er fisket på den i år.

### 4.2 Varene

- **Hjemmel uten båt** (flytting av driftsgrunnlag). Selgeren oppgir hjemmelen, og båten blir i rederiet uten den. Kjøperen velger ved kjøpet:
  - **Sett den på en båt uten hjemmel:** båten blir en båt i lukket gruppe. Det krever blad B og at lengderegelen i utkastets § 6 holder.
  - **Strukturer den inn på en båt med hjemmel i samme gruppe** (11–27,99 m): faktoren minus 10 % i 20 spillår, innenfor kvotetaket.

  Skroget som meldes ut ved strukturering, er ikke modellert, som i dag når du strukturerer fra en NPC-eier. Med det som er fisket på hjemmelen i år følger det spillet alt gjør: kjøperen starter året med selgerens fangst (`sellerCod`, § 29).
- **Strukturkvote.** Selgerens strukturkvote, med årene som er igjen, flyttes til kjøperens båt i samme gruppe, innenfor kvotetaket, uten ny avkorting. Årene fortsetter å telle (kvoteforskriften § 12 tredje ledd og § 11a). Hele kvoten flyttes; deling (§ 11b) er ikke med.
- **Båt med hjemmel** (overtakelse for fortsatt drift) er B, i Kystmegleren, som i dag. Etter V2 A velger selgeren om hjemmelen følger med.

Ikke varer: kilo og leie (V1), havtillatelsene og kvotesamarbeid mellom spillere (kap. 8), og åpen gruppe, som ikke har noen kvote å selge.

### 4.3 Grensene

- **Hvem kan legge ut:** en registrert spiller, ikke en gjest (`broker_who`). Høyst tre oppføringer per spiller, felles med båtene.
- **Hva som ikke kan legges ut** (`kmWhy`):
  - en hjemmel uten landing på seg i år eller de to foregående spillårene (driftskravet, utkastets § 8; ett spillår er rundt to ekte måneder);
  - en hjemmel i kvotesamarbeid i år;
  - den andre kvoten fra den særlige ordningen, som faller bort (kap. 2 § 6);
  - en hjemmel på en båt som er på sjøen, losser eller er lagt ut i Kystmegleren;
  - en strukturkvote med under ett spillår igjen.
- **Hvem kan kjøpe** (`kmBuyWhy`): blad B, en båt som kan ta varen (lengde, gruppe, kvotetak) og penger til budet (`broker_cash_ok`).
- **Prisen:** startprisen minst 40 % og «Kjøp nå» høyst 160 % av taksten, og neste bud minst 2 % over, som i B. Serveren holder verdien klienten oppgir, mot et bånd regnet av kvotefaktoren, 2026-enheten og 260 kr/kg. Det er samme tillit som B har til `vesselValue`.
- **Taksten:**
  - En hjemmel er årets torskekvote ganger kvoteprisen (V4).
  - En strukturkvote er det samme for sin faktor, ganget med årene igjen delt på 20. Lineært, fordi tidsgrensen ble innført for at kvoten kunne avskrives over perioden (høringsnotatet 6.1); det er en antakelse.
- **En hjemmel uten båt i rederiet** (etter V2 A, eller når en båt med hjemmel selges uten den) står som «ledig hjemmel» i høyst to spillår (forhåndstilsagnet i utkastets § 7), rundt fire ekte måneder. Den kan settes på en egen båt, legges ut eller selges til registeret. Etter fristen går den tilbake til registeret med melding fra Fiskeridirektoratet. Det hindrer at hjemler blir liggende ubrukt.
- **Kvotetaket rettes etter § 12:** 5 ganger for 11–14,99 m og 6 ganger for 15–27,99 m, fordi spillerens båter bare har torskesektoren. Det var 3 og 4 (rettet i KM1 08.11.2026).

### 4.4 B8: hva som skjer med kvoten når båten selges

Etter V2 A velger selgeren i «Legg ut til salgs»:
- **Hjemmelen følger båten** (overtakelse for fortsatt drift), som i dag. Strukturkvotene følger med.
- **Hjemmelen blir i rederiet:** den blir en ledig hjemmel eller settes på en annen egen båt (utskiftning). Strukturkvotene blir med hjemmelen.

Uansett faller den andre kvoten fra den særlige ordningen bort (kap. 2 § 6), og kvotesamarbeidet blir hos selgeren (som i dag). Innbytte på verftet får samme valg.

### 4.5 Det som holder markedet levende med få spillere

Uten NPC-oppføringer og uten bud fra noen som ikke finnes:
1. **Registeret som gulv og tak** (V3 A): NPC-eierne selger som i dag til taksten så lenge det finnes eiere. «Selg nå» til registeret til 90 % av taksten er der alltid, så ingen blir sittende med en hjemmel de ikke får solgt. Prisen på en hjemmel mellom spillere havner derfor mellom 90 og 100 % av taksten. Det som gjør markedet verdt å bruke likevel:
   - Det har varer registeret ikke har. En strukturkvote til taksten koster 1/20 av hjemmelens takst per år den varer. Å kjøpe og strukturere fra registeret koster 1/18, fordi 10 % avkortes og kvoten varer 20 år.
   - En båt kan selges uten at eieren går ut av lukket gruppe (V2 A).
   - Taksten flytter seg (V4 B), så tidspunktet betyr noe.

   Målingen i KM5 viser om spillerne legger ut hjemler (kap. 7).
2. **Taksten lever** (V4 B): den følger torskeprisen og kvoteutsiktene. Kvoterådet 26. juni, totalkvoten 17. oktober og reguleringen 19. desember står alt i Kystposten. Det gir naturlige tidspunkter å kjøpe og selge på, uten at noe er oppdiktet.
3. **Strukturkvotene eldes:** en kvote med tre år igjen er billigere enn en med femten. Det gir ulike priser og en grunn til å selge før den går ut.
4. **Ønsket hjemmel:** «si fra når en hjemmel 14–14,9 m legges ut under X kr» går som push, etter mønsteret fra «Ønsket båt» (`broker_tell`, høyst én gang i tolv timer) og `docs/push-plan.md`. Kjøperen trenger ikke å følge med.
5. **Lange auksjoner** (opptil tre døgn i ekte tid), så få spillere rekker å se dem.
6. **Ærlig sosialt bevis:** «Solgt siste måned» med prisene, og Kystposten «Kvoteprisen denne uka» (taksten, mediansalget og antall salg). Øverst i markedet står den felles kvoten: gruppekvoten i år, tonn per faktor og hvor mange av de 1 622 hjemlene spillerne eier.
7. **Sesongen:** før skreisesongen trenger spillerne kvote, og etter den bytter mange båt.
8. **Driftskravet og fristen på to år** gjør at hjemler kommer tilbake i omløp i stedet for å bli liggende.

Svaret på «hva gir den spilleren å gjøre nå, i dag og denne uka?»: nå å by eller legge ut; i dag å følge auksjonen eller få beskjed om ønsket; denne uka å planlegge kvoten til sesongen og strukturere før skreien.

## 5. Fasene

Én økt hver. Hver fase skriver status her og i `docs/systemer/kvoter-og-regler.md` (5.5, «Kvotehandel»), oppdaterer køen og avslutter med `/lever` og `/okt-slutt`. Ingen fase rører ekte penger.

### KM1 Kjernen: varene, reglene og taksten som rene funksjoner (steg 60)

- **Bygger:**
  - Ny `core/03i-kvotemarked.js` (i malen etter `03h-is.js`): `kmTakst(item, H)`, `kmBounds`, `kmWhy` (kap. 4.3), `kmBuyWhy` (blad B, lengderegelen etter utkastets § 6, samme gruppe og kvotetak ved strukturering, strukturkvote i samme gruppe), `kmPack`, `kmApply` (hjemmelen eller strukturkvoten ut av selgerens båt og inn på kjøperens, `licExtra`), og den ledige hjemmelen (`S.licFree`, fristen på to spillår og `regFree` når den går ut).
  - Driftskravet trenger et felt for siste år med landing på hjemmelen (`l.landY`, skrevet i `sell`).
  - `STRUCT.cap` etter § 12 (5 og 6), og teksten «hogger båten» → «båten meldes ut av registeret» i `kvoter-og-regler.md`.
  - Gjenbruk `MB` fra `09k-market.js` (5 %, 90 %, 40 %, 160 %, 2 %, varighetene) der det går, så tallene står ett sted.
- **Filer:** ny `core/03i-kvotemarked.js`, `core/03d-quota.js` (`STRUCT`, `structRoom`), `ui/08-actions.js` (bare `l.landY` i `sell`), `src/index.html` (én linje), `tests/run.py` (`COVER`).
- **Tester:**
  - Ny `tests/unit/kvotemarked.test.mjs`, sett rød først: taksten, grensene, hver grunn i `kmWhy` og `kmBuyWhy`, at summen av kvotefaktorer er lik før og etter et salg, at samme hjemmel gir samme tonn i to lagringer med `WORLD_SEED`, og fristen for den ledige hjemmelen.
  - `quota.test.mjs` (taket) og `quotatest` (strukturkvoten i Kvote-appen virker som før).

### KM2 Serveren (steg 61)

- **Bygger:** én migrering `supabase/migrations/<ts>_kvotemarked.sql`.
  - **Anbefalingen til økta:** utvid `listings` med `kind` (`boat` som standard, `right`, `struct`) og `item jsonb`, og bruk `bids`, `broker_ledger` og `listing_settle` videre. Da er det ett auksjonshus, ett oppgjør og én innboks, som spillet bruker på samme måte.
  - Båndet mot taksten fra en ny tabell `quota_ref` (`HJ` med faktorene, 2026-enheten og 260 kr/kg).
  - Ved oppgjøret flytter `broker_reg_move` plassen i registeret for en hjemmel. En strukturkvote er ingen plass i registeret, og en strukturert hjemmel går ut av registeret for godt, som i dag.
  - Registeret som i dag (V3 A): `reg_take` og `reg_free` uendret, ingen grense per uke.
  - `listings_get` filtrert på `kind`, `broker_wish` for hjemmelslengdene, `km_*` i målingen og en lesefunksjon for admin.
  - Kjør migreringen selv (Jonas 07.11.2026: «Du er hjertlig velkommen til å kjøre migreringene selv»).
- **Filer:** `supabase/migrations/`, `tests/sqltest.py`.
- **Tester:** `sqltest` utvidet og sett rød først (for eksempel med båndet tatt bort). B sine sjekker skal stå grønne uendret: én båt solgt, en hjemmel solgt og en strukturkvote solgt i samme kjøring.

### KM3 Kvotemarkedet i Kvote-appen (steg 62)

- **Bygger:**
  - Ny `ui/phone/04b-kvotemarked.js`: Kvote → Marked blir Kvotemarkedet, med fanene Registeret (eierne som er igjen per hjemmelslengde, ukas selger og taksten), Hjemler, Strukturkvoter, Dine (oppføringer og bud) og Solgt siste måned.
  - **Kortet:** hjemmelslengde, kvotefaktor, årets kvote i tonn for torsk, hyse og sei, år igjen, landet på den i år, taksten, høyeste bud, «Kjøp nå» og tid igjen, med «Fiskeridirektoratet godkjenner ved oppgjøret».
  - **«Legg ut»:** varen, startpris, «Kjøp nå» og varighet. **Kjøpet:** valget av båt (sett på en båt uten hjemmel, eller strukturer, med taket og −10 % vist), og «Selg nå til registeret · 90 %».
  - **Øverst:** den felles kvoten (kap. 4.5 punkt 6).
  - `ui/10t-kvotemarked.js` har RPC-kallene, og innboksen brukes via `10s-broker.js` (radene for hjemler og strukturkvoter går til `kmApply`).
  - Patchnote uten penger og psykologi.
- **Filer:** ny `ui/phone/04b-kvotemarked.js`, ny `ui/10t-kvotemarked.js`, `ui/phone/04-kvote.js`, `ui/10s-broker.js`, `ui/phone/14-act.js`, `ui/01-i18n.js` (delt), `ui/phone/07-patch.js` (delt), `src/index.html`, `tests/run.py`.
- **Tester:**
  - Ny `tests/kvotemarkedtest.py` (LITE, skyen stubbet som i `megletest`): legg ut, by, overbydd, kjøp nå, oppgjøret, flytting, strukturering, taket, blad B, driftskravet, den ledige hjemmelen.
  - `quotatest` og `megletest`.
  - Skjermbilder i 800×1280, 1280×800 og 390×844.
  - Stikkprøve (`/stikkprove`): kjøp og sett hjemmelen på en båt i Bergen, Bodø og Hammerfest.

### KM4 Båten med eller uten hjemmelen (B8 etter V2, steg 63)

- **Bygger:**
  - Valget i «Legg ut til salgs» i Kystmegleren og kortet («Hjemmel følger med» eller «Uten hjemmel»).
  - `mbPack` uten hjemmelen når selgeren beholder den. `two` faller bort i begge tilfeller (kap. 2 § 6).
  - Rederi «⋯» → «Flytt hjemmelen til …» mellom egne båter (utskiftning).
  - Innbytte på verftet med valget om å beholde hjemmelen som ledig hjemmel i to år.
- **Filer:** `core/09k-market.js`, `ui/phone/13c-megler.js`, `ui/phone/11-rederi.js`, `ui/phone/13-mannskap-bank-meld.js`, `ui/phone/14-act.js`.
- **Tester:** `market.test.mjs` og `market2.test.mjs` (`two` sett rød først), `megletest`, `fleet2test`, `vesseltest`, `quotatest`, og skjermbilder i begge formater.

### KM5 Kvoteprisen som lever, og målingen (steg 64)

- **Bygger:**
  - `kpkAt(H)` etter V4 B: 260 kr/kg × torskeprisen i sesongen mot snittet for 2026 × kvoteutsikten (neste års råd eller totalkvote mot årets når de er kjent), glattet over fire spilluker og holdt mellom 0,7 og 1,4 ganger.
  - `licValue`, `structPrice`, `LIC_OFFERS` og `vesselValue` følger den. Havflåtens priser (`havValue`, `HPK` i forhold til `KPK`) følger samme indeks.
  - Kystposten «Kvoteprisen» én gang i uka.
  - Admin → Økonomi i spillet → Kvotemarkedet: salg per uke, kjøp fra spillere mot registeret, medianpris mot taksten, tid til første bud og spillernes andel per gruppe.
  - Målingen `km_put`, `km_bid`, `km_buy` og `km_quick` i prosent av taksten, aldri hvem.
  - Kalibrer med `progweek.py`: inngangen i lukket gruppe skal ikke flytte seg mer enn et par dager.
- **Filer:** `core/03-simulation.js` (`KPK`, `licValue`), `core/03d-quota.js` (`structPrice`, `havValue`), `core/09h-press.js` (Kystposten), `src/admin/index.html`, en migrering for admin-funksjonen.
- **Tester:** ny `tests/unit/kvotepris.test.mjs` (sett rød først), `havlic.test.mjs`, `quota.test.mjs`, `quotatest`, `markettest` og `progweek`.
- **Les av etter to ekte uker** i admin før noe justeres: volumet, andelen kjøpt av spillere og prisene mot taksten.

**Rekkefølgen:** KM1, så KM2, så KM3. KM4 kan gå etter KM1 ved siden av KM2 og KM3 så lenge den ikke rører de samme filene (`14-act.js` deles med KM3: KM4 tar den etter KM3, eller de deler den etter tur). KM5 går sist.

## 6. Valgene (tatt 07.11.2026)

Jonas valgte V1 A, V2 A, V3 A, V4 B og V5 A (kap. 10). Teksten under står slik den ble lagt fram.

**V1 Hva som selges.**
- **A (anbefalt):** hjemler og strukturkvoter, altså kvotefaktorer, som i virkeligheten. Tonnene følger av året.
- B: tonn av årets kvote (leie).
- C: begge.

Hvorfor A: leie og overføring av kvantum er ikke lov i Norge (§ 30). A holder kvoten knyttet til en båt som fisker, og B ville gjort kvoten til en vare uten båt.

**V2 Kvoten når båten selges (B8).**
- **A (anbefalt):** selgeren velger om hjemmelen følger båten (overtakelse for fortsatt drift) eller blir i rederiet (utskiftning, eller ledig i to år).
- B: hjemmelen følger alltid båten, som nå.
- C: båter selges alltid uten hjemmel hos megleren, og hjemlene bare i kvotemarkedet.

Hvorfor A: det er de tre veiene i virkeligheten (utkastets §§ 5 og 7), og det er det som gjør det mulig å selge en båt uten å gå ut av lukket gruppe.

**V3 Registeret (NPC-eierne) når spillerne handler.**
- A: registeret selger som i dag til taksten så lenge det finnes eiere, både på verftet og i Kvote-appen.
- **B (anbefalt):** én eier per hjemmelslengde går ut per spilluke, felles for alle spillerne og først til mølla, på verftet med båt og i Kvote-appen. «Selg nå» til registeret står alltid.
- C: registeret kjøper bare og selger ikke lenger.

Hvorfor B: med få spillere merkes det ikke. Med mange blir hjemlene knappe slik de er i virkeligheten, og markedet mellom spillerne får et tak over seg som ikke alltid er der. Med A blir båndet mellom hurtigsalget (90 %) og registeret (100 %) så smalt at ingen tjener på å legge ut. C gjør inngangen til lukket gruppe avhengig av at andre spillere selger.

**V4 Kvoteprisen (taksten).**
- A: fast 260 kr/kg som i dag.
- **B (anbefalt):** den følger torskeprisen og kvoteutsiktene, glattet og innenfor 0,7–1,4 ganger.
- C: den følger medianen av spillernes salg siste måned, innenfor et bånd.

Hvorfor B: den gir markedet naturlige tidspunkter (rådet, totalkvoten) uten å kunne flyttes av noen med to kontoer, som C kan med få salg.

**V5 Landsdelen.**
- **A (anbefalt):** ett nasjonalt marked i første runde.
- B: som i virkeligheten. Struktur bare innen samme landsdel med 12 måneders registrering (kvoteforskriften § 9). Salg mellom Nord-Norge og Sør-Norge nektes, unntatt salg til Nord-Troms og Finnmark (landsdelsbindingen fra 2016; bare søkesammendraget er sett, ikke deltakerforskriften for 2026).

Hvorfor A: med få spillere deler B et tynt marked i to. B kan tas inn når admin viser nok aktive spillere i begge landsdelene.

## 7. Antatt og usikkert

- **Deltakerforskriften for 2026** (FOR-2025-12-19-2811) er ikke lest direkte. Det om salg for fortsatt drift, flytting, lengderegelen, forhåndstilsagnet og driftskravet er tatt fra Fiskeridirektoratets utkast i høringsnotatet 26.03.2026, som skal videreføre den.
  - **Driftskravet** (§ 8) er tatt bort for kystflåten i «Forslag etter høring» 11.09.2026 (kap. 2). KM1 bygde det av (`KM.drift`); valg 15 i køen. Med V3 A tjener ingen på å kjøpe fra registeret for å selge videre (registeret selger til 100 % av taksten), så regelen trengs lite i spillet.
  - **«Forslag etter høring»** (11.09.2026) er lest i KM1 (kap. 2). Det er et forslag til departementet, ikke en vedtatt forskrift.
- **Kvotetaket på 5 og 6 ganger** er min lesning av § 12 og tabell 9: en båt med bare torskesektoren er spesialist. Endringen gir en strukturert båt i spillet mer kvote enn i dag.
- **At en strukturkvote kan flyttes til en annen eiers båt** leser jeg av § 12 tredje ledd og § 11b. I praksis følger den oftest båten. Er det feil, blir strukturkvotene en vare bare med båten (KM4) og ikke i Kvote-appen.
- **Taksten** er uten kilde: 260 kr/kg, den lineære verdien av en strukturkvote og indeksen i V4 B er anslag.
- **Antallet:** 1 452 deltakeradganger per 31.12.2025 (høringsnotatet tabell 3) mot 1 622 i spillet (saksdokument 5/2025 tabell 8, 17.10.2025). Det kan være ulike tellinger eller datoer; ikke undersøkt.
- **Serveren stoler på klienten** for blad B, lengden og taket, som B gjør for `vesselValue`. En endret klient kan kjøpe en hjemmel den ikke skulle hatt, men skader bare seg selv. Pengene og registeret holdes på serveren.
- **Ekte liv i markedet** kan bare måles etter utrullingen (KM5). Med få spillere vil prisene ligge nær taksten. Det er ærlig, og det er greit.
- **V3 A gir hjemlene et smalt bånd:** 90–100 % av taksten (kap. 4.5 punkt 1). En selger tjener høyst 5 % på å legge ut i stedet for å selge til registeret. KM5 viser om spillerne legger ut hjemler likevel. Strukturkvotene og båtene uten hjemmel er ikke bundet av båndet.

## 8. Hva planen ikke gjør

- **Kilo eller leie av kvote** (V1).
- **Havtillatelsene** (torsketrål, konvensjonelt hav, snøkrabbe) i markedet. De selges med havbåten på verftet. Strukturkvote og eiertak for havflåten (konvensjonelt hav 15 % av gruppekvoten, torsketrål 12 faktorer) hører til H8 og en egen plan.
- **Kvotesamarbeid mellom spillere** (§ 31 krever begge eierne om bord). NPC-eieren står som i dag.
- **Strukturgevinsten etter modell X** og avkortingen fordelt tilbake på gruppa. Kvoteenheten kommer fra den virkelige kjeden, og en spillers utløpte strukturkvote er noen promille av gruppa. Det står som en forenkling i systemdokumentet.
- **Deling av strukturkvoter** (§ 11b), **eiertak for kystflåten** (finnes ikke i dag) og **faste kvotefaktorer** (departementet har tatt dem ut av høringen).
- **De nye navnene** («fiskeritillatelse», «Konvensjonell kysttillatelse nord»). Spillet sier «hjemmel» til forskriften er vedtatt.
- **NPC-oppføringer, oppdiktede bud, ventetid for saksbehandling,** noe som kan kjøpes for ekte penger, og push om å være overbydd (som i B).

## 9. Kilder (lest 07.11.2026)

- Lov 26. mars 1999 nr. 15 om retten til å delta i fiske og fangst (deltakerloven), §§ 4–7, 10, 21: https://lovdata.no/dokument/NL/lov/1999-03-26-15
- Forskrift 7. november 2003 nr. 1309 om spesielle kvoteordninger for kystfiskeflåten, §§ 3, 7–12, kap. 2 §§ 4–6 (sist endret FOR-2025-12-19-2812, fra 01.01.2026): https://lovdata.no/dokument/SF/forskrift/2003-11-07-1309
- Fiskeridirektoratet, høringsnotat 26.03.2026 «Fiskeritillatelser, kvotetak og fordeling av strukturgevinst» (kap. 1.1, 2.4, 3.2 med tabell 2 og 3, 6.1, 6.3 med tabell 9, 7.1–7.2, utkastet i kap. 10 §§ 5–8), og høringsbrevet samme dag: https://www.fiskeridir.no/hoeringer/horing-fiskeritillatelser-kvotetak-og-fordeling-av-strukturgevinst
- Fiskeridirektoratet, «Forslag etter høring – fiskeritillatelser, kvotetak og fordeling av strukturgevinst», 11.09.2026 (kap. 2.2, 4.2, 8.1.5, 8.1.6 og utkastets §§ 6–8), lenket fra samme høringsside (lest 08.11.2026)
- Stortingets vedtak 586–592 (2023–2024) og Meld. St. 7 (2023–2024), slik høringsnotatet siterer dem.
- J-187-2026 (§§ 5, 16, 18, 29–31) og saksdokument 5/2025, som i `docs/systemer/kvoter-og-regler.md` kap. 6.
- Kongelig resolusjon 17.06.2016, «Fra fylkesbinding til landsdelsbinding» (regjeringen.no; bare tittelen og søkesammendraget er sett).

## 10. Jonas' valg

Jonas 07.11.2026, svar på valg 10 i køen: «V1, a», «V2, a», «V3, a», «V4, anbefalt», «V5, a».

- **V1 A:** hjemler og strukturkvoter (kvotefaktorer) handles, aldri kilo.
- **V2 A:** selgeren velger om hjemmelen følger båten eller blir i rederiet (ledig i høyst to spillår).
- **V3 A:** registeret selger som i dag, til taksten så lenge det finnes eiere, på verftet og i Kvote-appen. Det er ingen grense per uke. «Selg nå» til 90 % står.
- **V4 B:** taksten følger torskeprisen og kvoteutsiktene, 0,7–1,4 × 260 kr/kg (KM5).
- **V5 A:** ett nasjonalt marked.
- **Driftskravet og kvotetaket på 5 og 6 ganger**, som planen tok med uten å spørre, sa Jonas ikke noe imot. De står.

## Status

- 07.11.2026: planen skrevet (steg 30, Jonas' økt, gren `claude/kvotemarkedet-steg-30-y3ctw0`). Regelverket lest på Lovdata (deltakerloven, kvoteforskriften) og i Fiskeridirektoratets høringsnotat 26.03.2026. Fasene KM1–KM5 står som steg 60–64 i køen med `venter på valg`, og valgene V1–V5 som valg 10. Funnene som gjelder spillet slik det er nå (kvotetaket, «hogger», `two` ved båtsalg), står i backloggen. Ingenting er bygd.
- 07.11.2026 18:15 UTC: Jonas' valg skrevet inn (kap. 10): V1 A, V2 A, V3 A, V4 B, V5 A. KM1 (steg 60) er klar. KM2–KM5 venter bare på fasene før seg. KM2 trenger ikke `reg_week` (V3 A), og kap. 4.5 punkt 1 er skrevet om etter V3 A.
- 08.11.2026: **KM1 bygd og rullet ut i bdb092d3** (steg 60, Jonas' økt, gren `ccr-5588e999-w5pry1`). Ny `core/03i-kvotemarked.js`: `kmTakst`, `kmBounds` (Bs `MB`), `kmQuick`, `kmWhy`, `kmBuyWhy` (lengderegelen `kmLenWhy`, strukturering `kmStructWhy`), `kmPack`, `kmOut`, `kmApply` (put, struct, free) og den ledige hjemmelen (`S.licFree`, `kmFree`, to spillår, så `regFree` med melding). `sell` skriver `l.landY`. `STRUCT.cap` er 5 og 6 (`structFits`), og `structIn` tar ikke lenger en eier ut av registeret selv (kjøpet i `14-act.js` tok én til, så hver strukturering tok to). «Forslag etter høring» lest: driftskravet er tatt bort for kystflåten (bygd, av, valg 15), lengderegelen og forhåndstilsagnet står (kap. 2). Valgt uten å spørre, skrevet i `kvoter-og-regler.md`: en hjemmel tar strukturkvotene sine med seg; ved strukturering legges selgerens fangst på hjemmelen i år til kjøperens; lengderegelen gjelder bare når hjemmelen settes på en båt, ikke ved strukturering; en kjøper kan ikke kjøpe en hjemmel uten å sette den på en båt. Gjennomgangen (`/code-review` medium) fant at en strukturkvote som ble flyttet alene, tok fangsten sin med uten å trekke den fra selgerens båt, at kontrollene lot ledige hjemler gå ut og forskjøv indeksen, at en ledig hjemmel fra i fjor fikk en oppdiktet selgerfangst, og at en båt som mistet hjemmelen, ikke fikk eierens fangst i åpen gruppe tilbake (§ 29). Alt rettet; `landY` skrives bare for torsk, hyse og sei. Tester: `tests/unit/kvotemarked.test.mjs` (90 sjekker, sett rød uten modulen i malen, med det gamle taket og mot commiten før rettingene fra gjennomgangen), `quotatest` (taket på 5 og én eier per strukturering).
