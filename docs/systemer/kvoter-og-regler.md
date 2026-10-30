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
- **Statistikkområdene** (`Yggdrasil/Statistikområder`): hovedområder (lag 6) og lokasjoner (lag 8) fra 2018.

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
    - Svalbard og havbeite
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
    - Du kjøper en hjemmel i samme gruppe, hogger båten og får kvotefaktoren minus 10 %, for 20 år.
    - Kvotetaket er 3× egen kvote for 11–14,99 m og 4× for 15–27,99 m.
    - Når tiden går ut, går kvoten tilbake til gruppen (`structExpire`).
  - **Den særlige kvoteordningen under 11 m** (fra 2025): To egne båter med hjemmel, begge eid siden året før. Den ene oppgir hjemmelen og selges, og den andre fisker begge kvotene. Ingen avkorting, etter min lesning.
  - **Kvotesamarbeid (§ 31):**
    - Samarbeidet er med en NPC-eier, som mønstrer på (begge eierne skal være om bord).
    - Hans kvote kommer om bord for året, og han får halvparten av verdien av torsken som landes på den. Andelen er en antakelse.
    - Han går i land ved nyttår.
  - **Leie av kvote** er ikke med. Det er ikke lov å overføre fangst eller kvantum til en annen båt (§ 30).
- **Kvote-appen:** fanene Mine kvoter, Åpen gruppe (gruppekvote, fisket så langt, stopp, økninger og ferskfisk), Bestand (graf over gytebestand og totalkvote med B_pa og B_lim) og Marked.
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

**I spillet:**
- **Juksa:** Juksa og fisket med båten (`08-actions.js`, `05-vessels.js`) stopper der `ruBlockMsg` sier nei, med grunnen i loggen.
- **Faste redskap:** Setting av redskap (`10-gear.js`) stopper på samme måte, og grensene for garn og kroker følger `fjordLimits`.
- **Kartet:** Kartet tegner fjordlinjene langs hele kysten.
- **Sluttsedler:** Sluttseddelen bruker Fiskeridirektoratets lokasjon (`ruLok`).
- **Senja:** Den håndtegnede Senja-linja (`FJORD`) er borte.

`tests/rulestest.py` sjekker punkter langs kysten (sonene, områdene og avstanden til grunnlinja) og svarene for hver regel, med datoer og lengder.

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
- **Besøket:** et VHF-anrop i loggen og en beskjed på skjermen, så ligger skipet («Kystvakta», navy med hvit stripe, listet som NPC `kv` i `npcStates`) langs styrbord side i en halv spilltime (`KV.visitMin`) og følger båten. Båten stoppes ikke, og ingenting venter (ingen oppdiktet friksjon). Etter halvtimen kommer meldingen fra «Kystvakta».
- **Det hun ser på (`kvCheck`):** (1) de stoppende reglene for stedet (`rulesAt`, `block` og `no`) for hvert redskap i sjøen (ved redskapets midtpunkt, med arten redskapet og lasten mest har) og for juksa der båten fisker; (2) § 33a: over 80 garn innenfor fjordlinjene når torsk er arten; (3) § 33: over 5 000 kroker på line innenfor fjordlinjene der `fjordLimits` har krokgrense (ikke i de seks Finnmarksfjordene om vinteren); (4) bifangst uten adgang: torsk, hyse og sei over 10 % av lasten (`BYCATCH.share`, som kaia regner); (5) torsk om bord utover det som er igjen av kvoten (`quotaState`, `codLimitNow`, ikke under ferskfiskordningen); (6) § 18 røkting: garn eller line som har stått over to døgn på over 300 m, eller over fire døgn (de samme grensene som påminnelsene i `10-gear.js`). Minstemål spørres ikke om (fangsten har ingen undermåls fisk i modellen), og redskapsmerking finnes ikke i spillet; det sies ikke at de er sett på.
- **Utfallet:** alt i orden gir én setning med hva som ble sett på (redskapen i sjøen, fangsten om bord, reglene for stedet), tellingen i papirene og merket «Rent skip» (`ACHL` `kv`: 1, 5, 10). En merknad leses opp med regelens tekst og kilde (høstingsforskriften, J-161-2026, deltakerforskriften, som regelmotoren siterer dem), uten ny straff (valg V-A A): fangst utover regelen inndras ved levering som før (`landConf`). En merknad gir en sak i Kystposten (type `kv`, `09h-press.js`): havna og regelkodene som én streng (`f33a-byc`, høyst fire), som spillet leser som kildene (`KV_REF`), aldri kiloene eller tekstene. Serveren tar typen når `supabase/migrations/20261030150000_news_kv.sql` er kjørt (SQL Editor); til da avviser `news_put` saken (400), som `pressFlush` svelger, og den står bare i egen avis.
- **Papirene:** kortet «Kystvakta» i Kvote-appen under Papirer (`papKv` i `08-home-papers-merker.js`): kontroller, uten merknad, siste kontroll med dato og utfall, og hva hun spør om. Håndboka får tipset «Kystvakta» etter første kontroll (`07c-handbook.js`), som peker til Regler-appens «Kan jeg fiske her?».
- **Måling:** hendelsen `kv_check` (`ok`, kodene, båtens status, nummeret, redskapstypene, kiloene om bord). Hyppigheten (50 %/25 % per uke) er et valg for ikke å mase, ikke et målt tall; den leses av i `kv_check` mot aktive spillere.
- **Tester:** `kystvakttest` (ren båt, 90 garn og 6 000 kroker innenfor fjordlinjene, bifangst uten adgang, besøket med skipet og ordet, merket og hendelsen, saken i Kystposten, ukekastet og kulingen, kortet i begge formater), `tests/unit/kystvakt.test.mjs` (grensene og tellingen av redskap).

## 6. Regelverk og kilder

| Tema | Kilde | Hovedpunkter |
|---|---|---|
| Kvoter nord for 62° N | J-161-2026, gjeldende fra 01.10.2026 (fiskeridir.no/yrkesfiske/j-meldinger/j-161-2026). Kjeden: J-30, J-43, J-52, J-57, J-76, J-80, J-88, J-137, J-156, J-161 | Se 5.5. Stopp i åpen gruppe 16.4.2026 (J-57). Garantert torsk 8–9,99 m er 4,2 t |
| Fordeling av norsk kvote | Fiskeridirektoratets saksdokument 5/2025 (reguleringsmøtet november 2025), og tilsvarende for 2019–2024 | Avsetninger, åpen gruppe 6,62 %, trålstigen, Finnmarksmodellen. Gir § 5 eksakt |
| Bestander og råd | HI, kvoteråd for 2027 (juni 2026), og IMR-VNIRO-rapporten 2026 | Torsk: TAC 2026 285 000 t, råd 2027 312 667 t, B_lim 220 000, B_pa 460 000 t. Hyse og sei i STOCK |
| Strukturkvoter | Forskrift om spesielle kvoteordninger for kystfiskeflåten (J-244-2025), og høringsnotatet om strukturgevinst 2026 | 11–27,99 m, samme gruppe, 10 % avkorting, 20 år, kvotetak 3× (11–14,99) og 4× (15–27,99). Særlig kvoteordning under 11 m fra 2025 |
| Åpen gruppe og ferskfisk, historikk | Saksdokumentene 2019–2025 | Stopp 24.3.2019, 20.4.2020, 1.5.2023, 15.5.2025, 16.4.2026; ingen i 2021, 2022, 2024. Ferskfisk 2017–2025 |
| Maskevidde i torskegarn | Maskeviddeforskriften (Lovdata 1989-10-10-1095) | Minst 156 mm nord for 62° N. Spillet selger 156, 180 og 200 mm |
| Trekk i oppgjøret | Norges Råfisklag, «Forklaring til trekk på fiskers avregning» (rafisklaget.no, lest 04.10.2026) | Lagsavgift 0,43 % (ferskt fra 1.7.2026). Av totalen minus den: pensjonstrekk 0,4 %, produktavgift 1,6 % (fra 1.1.2026), forskningsavgift 1,35 %, ressursavgift 0,42 %, kontrollavgift 0,22 % (ikke under 15 m ennå). MVA 11,11 % på salget til salgslaget. Se 5.4 |
| Fjordlinja og redskap | Høstingsforskriften kap. VI (§ 31, 33, 33a, lest 04.10.2026) | Innenfor: høyst 80 torskegarn og 5 000 kroker (yttersidene av kroklinjene i Finnmark unntatt 1.11–30.4), ikke snurrevad. 15 m eller mer: ikke torsk; under 21 m andre arter, sør for 68° 15,6′ N annet enn torsk. Se 5.28 |
| Kysttorsk etter lengde | J-161-2026 § 32 (lest 04.10.2026) | 21–27,99 m ikke innenfor grunnlinja, 28 m og over ikke innenfor 4 nm, med unntak etter område og dato. Henningsværboksen og Borgundfjorden. Se 5.28 |
| Grunnlinja og sonene | Kartverket, Norges maritime grenser (Geonorge, 25833) | Grunnlinja, 1, 4, 6, 10, 12 og 24 nm. Se 4.17 |
| Reguleringskartet | Fiskeridirektoratet, Yggdrasil/Fiskerireguleringer (38 lag) og Statistikområder | Fjordlinjer, kroklinjer, stengte felt, gytefelt, Oslofjorden, Lofoten, kongekrabbe. Se 4.17 |
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
- Arbeidsgruppens rapport om åpen gruppe fra 23.06.2026, som foreslår minstekvantum og aldersgrense 30 år.
- Høringen om kveiteregulering, som kan gi åpen gruppe for kveite for båter under 15 m.
