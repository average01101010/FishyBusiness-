# Spillbarhet: fangsten forklart, første turs forventning og fiske i havna i kuling (plan 06.11.2026, Ø8)

> Plan etter `/planlegg`. **Jonas valgte 06.11.2026: V1 A, V2 A, V3 C, V4 A, V5 A.** **S1 er bygd 07.11.2026** (første tur i dekksdagboka, 4310a20f, gren `ccr-dc24762d-iyuakj`; status nederst). **S0 er bygd og rullet ut 08.11.2026 i ffd076c1** (full last, gren `ccr-e9f46ad4-wipgu7`; status nederst). **S2 er bygd 08.11.2026** (turens linje, gren `claude/o8b-s2-turens-linje-c70okw`; status nederst). S3 er ikke bygd; H3b er rullet ut (4107d71a), og køen (`docs/planer/koen.md`) sier hva hver fase venter på nå. Hver fase er én økt (`docs/planer/okter-etter-backloggen.md`, Ø8b). Krokene skal være ekte (`CLAUDE.md`, engasjement): ingen oppdiktet friksjon, aldri et oppdiktet tall vist som fakta, og tallene her er startverdier.

## Hva Jonas ba om

- Backloggen 10.2 (fra spilltest 2): «**Fangsten er uforklart, og den garanterte første turen gir feil forventning:** full last på første tur (`03-simulation.js`, påfyllingen i `05-vessels.js`), nå også med luksushaill. Etter første levering sier ingenting at turen var ekstra god eller hva vanlig fiske gir. Varmekartet, ekkoloddet, fangstmerkene og Fiskeguiden viser nå hvor fisken er.»
- Backloggen 10.2: «**Fiske inne i havna i kuling** har ingen egen regel (`inHarbour` brukes ikke av fisket).»
- Jonas 06.11.2026 (bestillingen for Ø8): «Skriv `docs/planer/spillbarhet-fangst.md`: hva spilleren får vite i dag om hvorfor fangsten ble som den ble (varmekartet, ekkoloddet, fangstmerkene, Fiskeguiden), hva første tur lover og hva vanlig fiske gir etterpå, og forslag med valg A/B/C og anbefaling: hva som sies etter første levering, hva sluttseddelen eller dagboka kan si om en god og en dårlig tur, om første tur skal være garantert full, og hvor det skal stå. Ta «Fiske inne i havna i kuling» inn i samme plan som et valg, siden regelen ville ligge i `core/05-vessels.js` eller `03-simulation.js`, som H3b og Ø11.2 er i nå; den bygges ikke i denne økta. Krokene må være ekte: ingen oppdiktet friksjon, og tallene er startverdier.»

## Det som alt er gjort siden backlogpunktet ble skrevet

Backlogpunktet er fra spilltest 2 (før 27.10.2026). Onboarding 2 (`docs/planer/onboarding-2.md`, Jonas' valg 1A–8A, O3 og O4 bygd 27.10.2026 og rullet ut 28.10.2026) tok halve punktet:

- **Første tur er ikke lenger full last.** Fisketida er én spilltime (`TUT_FISH_H`, ti ekte minutter), og påfyllingen fyller bare til halvt lasterom (`TUT_HOLD` 0,5, `tutTarget()`, 175 kg i trebåten). Leveringen venter ikke på full last (`core/03-simulation.js`, `05-vessels.js` `fish()`).
- **Ingen haill i første tur** (V1 A): luksushaillen er bare gaven ved registrering, og haillen kommer som dryppet `lykke` første gang båten fisker etter første levering.
- **Sluttseddelen i første tur sier at turen var ekstra god, og hva vanlig fiske gir** (O4, `portSlip` i `ui/07-guide.js`): «Første tur var ekstra god: fisken sto tett. Med håndjuksa gir fisket her nå vanligvis rundt N kg i timen, mer med juksamaskin og bedre felt.» N er fangsten ganger bestandens egen andel av tettheten på feltet (`S.tut.fk`, summert i `fish()`), per fisketime, rundet til 10 kg; under 10 kg står «under 10 kg». Og «Andre fiskere har også levert her det siste døgnet, mest torsk» når felles verden har leveringer der (aldri et oppdiktet tall).
- **Stikkprøven O6** (28.10.2026, `docs/systemer/opning-og-veiledning.md`): første levering ble 184 kg og 9 672 kr ved Bøvågen, 186 kg og 8 498 kr i Bodø, 259 kg og 9 064 kr i Vadsø, og linja sa «rundt 80», «rundt 20» og «rundt 40 kg i timen».

Det som står igjen av punktet, er altså **ikke første turen i seg selv, men at ingenting etter den forklarer en vanlig tur**: hvorfor tur 2 ga 40 kg der tur 1 ga 180, og hvorfor en tur i kuling, i kulda eller på et nedfisket felt ga mindre. Linja om vanlig fiske står bare på første sluttseddel, som forlater skuffen fire spilltimer etter salget, og den står ingen andre steder.

## Hva spilleren får vite i dag

Alt leses fra fiskemodellen (`density(sp, p, H)` i `core/03-simulation.js` er den ene kilden, 5.3 i `docs/systemer/fiskerimodellen.md`), så ingenting av det kan si noe annet enn havet gjør.

| Hvor | Hva det sier | Hva det ikke sier |
|---|---|---|
| **Varmekartet** (`core/12-heat.js`, `ui/03c-heat.js`, det lille kartet og kartplotteren) | Hvor fisken står nå, som 30 × Σ`density` kg/t for håndjuksa, per art eller samlet, med ettergløden der du har fisket. Fargeskalaen «lite … mye» | Ingenting om været, kulda, haillen eller tida på døgnet; viser tettheten, ikke fangsten |
| **Ekkoloddet og sonaren** (`echoSvg` i `07-guide.js`, `vertZ`, `schoolDrift`) | Hvor i vannet fisken står (nær bunnen om dagen, høyere om natta) og hvilken vei stimen svømmer | Ikke mengden mot vanlig |
| **Fangstmerkene** (`S.marks`, `05-vessels.js` linje 1028, `10-gear.js` linje 577, tegnet i `ui/03-map.js` linje 423) | Etter minst 15 minutters jukse: kg/t på stedet, farget mot «vanlig» (`HEATG.fair`: juksa 20 kg/t, line 100 kg/stamp, garn 40 kg/garn, teine 20 kg/teine, ganger riggen). Etter et trekk: kg per stamp, garn eller teine og ståtida. Borte etter 12 spilltimer | Hvorfor det ble slik: ikke om sjøen, kulda eller haillen var grunnen |
| **Fangstkortene** (`ui/05j-catchfeed.js`) | Under fisket: «8 × Torsk 24,6 kg · ca. 1 503 kr» per art, og «Her 180 kg · 36 kg/t» for økta (`S.fsess`) | Ikke noe mot vanlig |
| **Fiskeguiden** (`ui/06f-fishguide.js`, 5.33) | Hvor og når hver art finnes (måned, dyp, åpen kyst, kanter), redskap med ●●●, agn, pris, regler, og «Det du har funnet ut» fra leteoppdragene | Ikke dagens fangst |
| **Mannskapet** (`SAY` i `core/14-crewlife.js` linje 96–100, 232) | «Nu bit dem!» over 40 kg/t etter en time, «Hvis torsken bit like dårlig som kaffen smake …» under 8 kg/t etter to timer; de erfarne sier fra om været og om bedre fiske et stykke unna (`sayHour`, `adviceWx`, `adviceGround`) | Bare med mannskap om bord, og bare som replikk |
| **Statusboksen** (HUD) | Sjø og vind med risikofargen, «Luksushaill +200 %»-linja mens haillen virker, kulde i prosent | Ikke hva de gjorde med fangsten |
| **Sluttseddelen** (`portSlip` i `07-guide.js`) | Kilo, størrelse, kvalitet og kr/kg per art, inndragning med grunn, trekkene, lotten; i første tur linja om vanlig fiske og om andre fiskere | Etter første tur: ingenting om turen var god eller dårlig, eller hvorfor |
| **Dekksdagboka** (`ui/06-logbook.js`, `06b-book-tabs.js`) | Drift per dag: loggen («Bløggekaret er fullt», «Tom for is», replikkene, været), Fangst-fanen med salgene, Ukas fangst (`05i-ukas.js`: kilo, kroner, beste dag, største fisk) | Ingen linje per tur om fangsten mot vanlig |

**Det modellen vet, men ikke sier:** `catchFactors(H, W, hs)` i `core/05-vessels.js` linje 943 regner hvert minutt det som gjør fangsten mindre eller større enn tettheten tilsier: sjøen og vinden (`wpen`, fra halve båtens forsiktige grense og vind over 8 m/s, ned til 0,15), kulda (`coldPen`), hendene ved ripa (`fishEffort`, `workTeam`), slitt pilk (`jigQ`), og `fish()` ganger på `luck(sp)` (haillen), `targetF` (kveiteutstyret), `biteF` (tid på døgnet og stimen) og bestanden (`S.stock`, nedfisket der du har stått). Ingen av disse står noe sted etter turen. Fangstmerket viser bare resultatet mot «vanlig».

## Hva første tur lover, og hva vanlig fiske gir etterpå

- **Første tur:** flekken (`tutBonus`, `TUTB.peak` 5,2) gir rundt 175 kg i timen for én person midt i ringen og en tidel ved kanten, i feltets egen miks (`S.tut.f.mix`); påfyllingen fyller til 175 kg om flekken ikke rekker. Én time. Første levering: 175–260 kg og 8 500–9 700 kr (O6).
- **Vanlig fiske med håndjuksa etterpå** (`docs/systemer/fiskerimodellen.md` 5.3, spilltest 3 `docs/playtest/rapport-3-redskap.md`): kalibreringen sier 350 kg på rundt en halv dag på et godt skreifelt og rundt 270 kg på 8 timer i juli; spilltest 3 målte 51 kg/t ved Husøy 1. mars, 34 kg/t ved Bøvågen, 16 kg/t ved Henningsvær og 12 kg/t ved Gjesvær (K1, Lofoten er tynn), og O4-linja sa 20–80 kg/t på de tre startstedene. «Vanlig» i fangstmerkene er 20 kg/t (`HEATG.fair.jig`).
- **Avstanden:** første time gir altså 2–10 ganger det en vanlig time gir samme sted. Sluttseddelen sier det nå, én gang. Etterpå er fangsten per tur typisk 50–350 kg etter 3–8 timer, mot 175 kg på én time første gang.
- **Ikke målt:** Trakten per steg i admin har hatt for få nye spillere til å si om linja virker (O6: «to uker med måling før noe mer endres»; `admin_tut`, `admin_tut_time`). Dette står i 10.5.

## Forslagene og valgene

### V1. Hva som sies etter første levering

**Valgt: A** (Jonas 06.11.2026).

I dag: linja på sluttseddelen i første tur (O4), borte fire spilltimer etter salget.

- **A (anbefalt): linja beholdes, og skrives også i dekksdagboka** som én logglinje ved første levering (`tutFinish` i `ui/07b-first-trip.js` → `log()`), med det samme tallet: «Første tur var ekstra god. Vanlig fiske med håndjuksa gir her nå rundt N kg i timen.» Så står den i Drift den dagen, og en spiller som lurer etter tur 2, finner den. Hvorfor: det er én linje og ett tall som alt finnes, og den overlever skuffen.
- B: et eget kort «Slik var første tur» i Fangst-fanen i dagboka (fangsten, flekkens andel, vanlig fiske her, mottakets dag), med linken «Hvorfor fikk jeg mindre nå?» etter tur 2. Mer å bygge (`06b-book-tabs.js`), og ingen målt grunn ennå.
- C: som i dag.

### V2. Hva sluttseddelen eller dagboka kan si om en god og en dårlig tur

**Valgt: A** (Jonas 06.11.2026).

Alle tre bygger på det samme: `fish()` summerer per tur det modellen alt regner, i `tripOf(b)` (`core/04-crew.js` linje 143, der turens felleskostnader alt samles): fisketimene, Σ 30·`density`·innsats (det fisken sto til, «potensialet»), og hvor mye `wpen`, `coldPen`, `luck` og bestandens nedtrekk tok eller ga i snitt over turen. Teksten skriver bare det som var over 10 %, og aldri et tall modellen ikke har. Redskapstrekkene har sitt eget «vanlig» (`HEATG.fair`) og får samme linje per trekk.

- **A (anbefalt): én linje på sluttseddelen for hver tur**, under tabellen, som O4-linja: «Turen ga 38 kg i timen med håndjuksa. Fisken sto til rundt 50: sjøen (1,4 m) tok 20 %, kulda 5 %.» eller «Turen ga 120 kg i timen. Haillen ga det dobbelte, og det var tett med skrei.» Hvorfor: sluttseddelen er øyeblikket (Onboarding 2, prinsipp 6), spilleren står der uansett, og linja gjør variasjonen til en forklaring i stedet for en skuffelse. Den sier aldri at spilleren gjorde feil, bare hva sjøen og båten gjorde.
- B: et kort «Turen» i dagboka per tur (Fangst-fanen, `06b-book-tabs.js`) med alle faktorene som linjer, og ingenting på sluttseddelen. Mer å lese, men ikke der spilleren er.
- C: bare «Her nå»-tallet fra varmekartet i statusboksen mens båten fisker («Her nå: 25 kg/t, du: 38»), og ingen linje etter turen. Billigst, men forklarer ikke en dårlig tur når den er over.

### V3. Om første tur skal være garantert full

**Valgt: C, full last** (Jonas 06.11.2026: «Jeg tenker den første turen er ekstremt viktig for å forhindre churn og dermed må vi sikte oss inn på alt som gir dopamin og serotonin til brukeren, men brukeren skal jo selv få lov til å bestemme hvor lenge de ønsker å fiske før de leverer, men det er jo dumt å ikke fylle båten.»). Slik bygges det (antatt, Jonas retter om det er feil):
- Påfyllingen fyller til fullt lasterom (`TUT_HOLD` 1, 350 kg i trebåten) innen fisketida er ute. Fisketida er fortsatt én spilltime (`TUT_FISH_H`, ti ekte minutter).
- Spilleren bestemmer selv når fisket slutter: «Slutt å jukse» og veien inn virker som på andre turer, og veiledningens steg `full` er ferdig når lasten er full, tida er ute eller spilleren stopper. Påfyllingen fyller bare mens båten fisker, så den som stopper tidlig, leverer det som er om bord.
- Det koster tid: alene må spilleren sløye alt (rundt 5 kg i minuttet), så en full trebåt gir rundt 35 spillminutter mer på feltet enn halv, om lag seks ekte minutter, om spilleren fisker timen ut.
- Linjene fra V1 og V2 bærer forventningen: sluttseddelen og dagboka sier at første tur var ekstra god, og hva vanlig fiske gir der.
- Datoen skrives i planen og i trakten i admin, så første til tredje levering kan sammenlignes før og etter.

Alternativene som sto:

- **A (anbefalt): halvt lasterom som nå** (V2 A i Onboarding 2, Jonas 27.10.2026), og forventningen rettes med V1 og V2. Hvorfor: valget er en uke gammelt, O6 har tallene, og trakten første → tredje levering skal måles i to uker før noe endres («Mål og se», `CLAUDE.md`). Å endre tallet nå gjør målingen verdiløs.
- B: bare flekken, ingen påfylling (`TUT_HOLD` 0). Første fangst blir det flekken gir (rundt 175 kg/t i sentrum, mindre ved kanten og når spilleren jukser dårlig), så 60–175 kg. Mer ærlig, men første levering kan bli 3 000 kr, og det er ikke målt hva det gjør med frafallet.
- C: full last igjen (`TUT_HOLD` 1). Gir den feile forventningen tilbake. Ikke anbefalt.

### V4. Hvor det skal stå

**Ført som A** (06.11.2026). Jonas: «Forklaringen på hva? Jeg skjønner ikke konteksten.» Forklaringen er linjene fra V1 og V2: at første tur var ekstra god, og hvorfor en vanlig tur ble god eller dårlig. Med V1 A og V2 A står de på sluttseddelen og i dagboka, og det er A. Spørsmålet som sto igjen, var om de også skal stå i statusboksen mens båten fisker (B). Det er ikke valgt, og S4 er tatt ut.

- **A (anbefalt): sluttseddelen og dekksdagboka.** Linja (V2 A) på seddelen, og den samme linja i Drift-loggen for dagen, så den finnes etter at seddelen er borte. Første tur (V1 A) på samme måte.
- B: statusboksen under fisket (V2 C) i tillegg: «Her nå» mot «du». Kan komme senere, når linja er sett i trakten.
- C: en toast når fisket slutter (`endFishing`). Ikke anbefalt: varslene drukner alt (spilltest 3, U4).

### V5. Fiske inne i havna i kuling

**Valgt: A** (Jonas 06.11.2026): ingen ny regel før tettheten i havnebassengene er målt.

**Slik er det i dag:** `fish()` spør ikke `inHarbour` (`core/01-world.js` linje 140: 600 m fra havnepunktet og 350 m fra innseilingspunktet, «mudret og merket, ingen grunner der»). En båt som ligger stille inne i havnebassenget med status `fishing`, jukser det modellen gir der: `denPlace` gir lite på grunt, lunt vann, og sjøen er lav (kort strøklengde i `hsAt`), så `wpen` er nær 1. Kulinga ute stopper ingenting der inne. Hvor mye det gir, er ikke målt. Reglene (`ruBlockMsg`) har ingen havneregel. Det finnes ingen generell lov mot å fiske i et havnebasseng; noen kommuners ordensforskrifter etter havne- og farvannsloven § 8 forbyr fiske fra kai eller i bassenget, men det er per havn og ikke sjekket mot Lovdata for noen av spillets 160 havner, så en sperre ville være en oppdiktet regel inntil det er gjort.

- **A (anbefalt): ingen ny regel, men mål det først.** Ett skript måler `density` for juksas arter i ti havnebasseng (`inHarbour`, sør, midt og nord) mot nærmeste felt utenfor, i mars og i juli. Gir bassenget under 20 % av feltet, er det modellen selv som holder fisket der nede, og kulinga gir ingen snarvei: en skipper som ligger i havna i kuling, ligger der fordi det er lurt, og får det lille som står der. Hvorfor: friksjonen er simuleringens egen, og ingenting legges til.
- B: havnebassenget gir ×0,1 i `denPlace` (`core/03-simulation.js`), med én logglinje første gang båten fisker der: «Inne i havna står det lite fisk.» Bygges bare om målingen i A viser at bassenget gir mer enn 20 % av feltet. En regel i modellen med en grunn, ikke en sperre.
- C: fiske i havnebassenget sperres som reglene sperrer (`ruBlockMsg`: «Ingen fiske i havnebassenget»). Ikke anbefalt uten kilde per havn; kilden måtte inn i `rules.json` havn for havn.

Regelen (A-målingen og B) ligger i `core/03-simulation.js` (`denPlace`) eller `05-vessels.js` (`fish()`), som H3b og Ø11.2 eier nå, så den bygges etter dem.

## Fasene

| Fase | Hva | Filer | Tester | Måles |
|---|---|---|---|---|
| **S0. Full last på første tur** (V3 C) | `TUT_HOLD` 1; påfyllingen fyller mot full last i den tida som er igjen; spilleren kan stoppe når hun vil, og `full` er ferdig da; teksten i steget | `core/03-simulation.js`, `core/05-vessels.js` (`fish()`), `ui/07b-first-trip.js`, `docs/systemer/opning-og-veiledning.md` | `tut` i ett format, `tutcoast` (påfyllingen og miksen), skjermbilder av steget i begge formater | Trakten første → tredje levering før og etter datoen |
| **S1. Første tur i dagboka** (V1 A; bygd 07.11.2026, 4310a20f) | Logglinja ved `tutFinish` med N fra `S.tut.fk` | `ui/07b-first-trip.js`, `01-i18n.js` | `tut` i ett format (`KYST_TUT_ONE=liggende`), `booktest` | Trakten første → tredje levering (admin), som nå |
| **S2. Turens linje** (V2 A, V4 A) | `tripOf(b)` får fisketimene, potensialet og faktorene fra `fish()` og `finishHaul`; linja på sluttseddelen og i Drift ved salget; tekstene i begge språk | `core/04-crew.js` (`tripOf`), `core/05-vessels.js` (`fish()`), `core/10-gear.js` (`finishHaul`), `ui/07-guide.js` (`portSlip`), `ui/08-actions.js` (`sell`), `01-i18n.js` | `selltest`, `booktest`, `geartest`, enhetstest av faktorsummene i `tests/unit/`, skjermbilder av seddelen i begge formater | Om linja leses: hendelsen `slip_why {kgph, fair, pen}` i skyen, og om leveringene per spiller går opp etter tur 2 |
| **S3. Havna** (V5 A, så B om målingen sier det) | Målingen i ti basseng; ×0,1 bare om den krever det | `core/03-simulation.js` (`denPlace`), skript i `tests/` | `heattest` (varmekartet), `simday`, enhetstest | Tettheten i bassengene mot feltene |

S0, S2 og S3 venter på at H3b er rullet ut (`03-simulation.js`, `04-crew.js`, `05-vessels.js`, `07-guide.js`, `08-actions.js`). S1 rører bare `ui/07b-first-trip.js` og kan gå først. S4 (statusboksen) er tatt ut: V4 B ble ikke valgt.

## Antatt og usikkert

- **Tallene i linja er modellens egne** (`wpen`, `coldPen`, `luck`, `density`), ikke kalibrert mot hva en fisker ville sagt. En tur der sjøen tok 20 % og kulda 5 %, kan føles annerledes. Prosentene vises bare når de er over 10 %.
- **«Potensialet»** (30·Σ`density`·innsats) er det modellen ville gitt uten straff og lykke, på de stedene båten sto. Det sier ikke hva et bedre sted ville gitt; det gjør varmekartet og mannskapets råd.
- **Første levering blir mindre verdt langs kysten enn på Senja** (O1: miksen er den lokale). Om 175 kg på én time er «for mye» eller «for lite», må trakten si; det er ikke spilt nok.
- **Havnebassengene** er ikke målt. Anbefalingen i V5 kan snu når tallene kommer.
- **Lofoten er tynn** (10.5, K1 i spilltest 3) og rettes ikke av denne planen; en forklaringslinje gjør bare den tynne turen forståelig.

## Det planen ikke gjør

- Ingen endring av fiskemodellen, kalibreringen eller første turs flekk og miks (O1–O4 står).
- Ingen haill, ingen trim, ingen ventetid og ingen salg i noen av linjene (`docs/engasjement.md`).
- Ingen sperre i havnene uten kilde per havn.
- Ingen nye toasts.
- De navngitte fangstfeltene for hele kysten er Ø14, og «Reglene» bekreftes i neste spilltest.

## Status

- 06.11.2026: planen skrevet (Ø8, gren `ccr-ccfb0017-rmieib`). Venter på V1–V5 og «kjør på». Bølgene langs ruta og innloggingsbonusens tekst fra samme økt er bygd og står ikke her (`docs/systemer/autonav.md` 5.15 og `haill-pub-og-bonus.md` 5.9); mannskapstesten står i `docs/playtest/rapport-4-mannskap.md`.
- 06.11.2026: Jonas valgte V1 A, V2 A, V3 C (full last, spilleren bestemmer selv når hun leverer), V5 A, og V4 er ført som A etter at konteksten var forklart. Planen har fått S0 for full last, og S4 er tatt ut. Venter på «kjør på» og på at H3b er rullet ut.
- 07.11.2026: **S1 bygd** (Jonas' økt, gren `ccr-dc24762d-iyuakj`, 4310a20f). Når første tur er ferdig (`tutFinish` i `ui/07b-first-trip.js`), skrives «Første tur var ekstra god. Vanlig fiske med håndjuksa gir her nå rundt N kg i timen.» i dekksdagboka (Drift), med samme N som sluttseddelen (`tutNormKg`, samme formel som `portSlip`; «under 10 kg» under 10), tekstene på norsk og engelsk i `ui/01-i18n.js` (`tut_norm`, `tut_norm_kg`, `tut_norm_lo`). Ingen linje når `S.tut.fk` mangler (en lagring fra før O4) eller ingenting er levert. Prøvd: N likt på seddelen og i dagboka for fem andeler av bestanden (rundt 140, 40 og 10 kg, og under 10 kg to ganger) og ved mottakene nær Bergen, Bodø og Hammerfest; `booktest` 25 OK, `tut` i liggende 14 OK (dagboka og sluttseddelen sa begge «rundt 40 kg i timen» etter 302 kg levert i Botnhamn), `starttest` og `tutdrift`. **Måling, datoen for endringen: 07.11.2026.** Trakten før (samme utregning som `admin_funnel`, spillere som deler bruksstatistikk, startuke): uka fra 05.10 7 startet, 2 første levering, 2 tredje; 12.10 5, 2, 2; 26.10 4, 1, 0; 02.11 5, 1, 1 (ingen nye i uka fra 19.10). Til sammen siste åtte uker 21 startet, 6 første levering, 5 tredje. Det er for få spillere til å si om linja virker; sammenlign første → tredje levering for spillere som startet fra 07.11.2026 med tallene over når det er minst like mange. Rullet ut i 91cc422a. Patchnotatet er ikke lagt inn (bare de to filene, Jonas 07.11.2026); teksten står i køen, i startmeldingen for S0.
- 08.11.2026: **S0 bygd og rullet ut i ffd076c1** (Jonas' økt, gren `ccr-e9f46ad4-wipgu7`). `TUT_HOLD` 1: påfyllingen fyller til fullt lasterom innen fisketida er ute, bare mens båten fisker. **Trebåten har ikke lasterom, men ett fiskekar på 500 kg på dekk**, så full last er 500 kg, ikke 350 som V3 regnet med; teksten i steget sier «fiskekaret» eller «lasterommet» etter båten (Jonas 08.11.2026: «Husk at ikke alle båter har lasterom. Noen fyller jo fisken i kar på dekk.»). Påfyllingen per minutt er regnet om (minuttets del av det som sto igjen før minuttets egen fangst, ett minutt tidlig), så lasten blir full også når bløggekaret fylles det siste minuttet. «Stopp» virket alt i første tur; `full` er ferdig når fisket er over, og teksten i steget sier at spilleren kan levere før. Tida på feltet: rundt 150 spillminutter mot 112 med halv last, som V3 anslo; etter «Rund fisk på første tur» (samme dag) rundt 90 mot 80. **N i dekksdagboka** (S1) tar nå påfyllingen ut og deler på minuttene fisket: med full last er påfyllingen rundt to tredeler av fangsten, og N ville ellers sagt rundt 120 der den nå sier 50 ved Gisundet. Sluttseddelen (`portSlip`, `ui/07-guide.js`) kaller `tutNormKg(ls)` (Jonas' valg A 08.11.2026, etter at Ø12 C var ute), så seddelen og dagboka sier samme N. Antatt, som merket over: én spilltime, påfyllingen bare under fiske, `full` ferdig når spilleren stopper. Prøvd: `tests/tutfull.py` (ny, sett rød mot bygget før S0), med stikkprøvene ved Bergen (Bøvågen), Bodø og Hammerfest (Forsøl), heattests første-tur-del, `booktest`, `starttest`, `tutdrift` og `tut` i liggende; skjermbildene i `docs/okter/2026-11-08-o8b-s0/`. **Måling, datoen for endringen: 08.11.2026.** Sammenlign første → tredje levering for spillere som startet fra 08.11.2026 med tallene under S1 (07.11.2026), når det er minst like mange; S1 og S0 kom med en dags mellomrom, så de to kan ikke skilles i trakten.
- 08.11.2026: **S2 bygd** (Jonas' økt, gren `claude/o8b-s2-turens-linje-c70okw`). `fish()` summerer per tur det fisken sto til (30·Σ`density`·innsats, med `biteF`, `targetF` og juksas andel, uten bestandens nedtrekk) og hva hvert trinn tok i rekkefølge: nedfisket felt (`S.stock`), sjøen og vinden (`wpen`), kulda (`coldPen`), slitt pilk (`jigQ`, lagt til fordi modellen har det og det forklarer en dårlig tur), og hva haillen ga (`luck`); `finishHaul` legger trekkene mot `HEATG.fair` for ståtida, med haillen og nedfiskingen mens lenka sto. `tripSum` og `tripWhy` (`core/04-crew.js`) gjør det til én linje på norsk og engelsk, bare trinn på minst 10 %; den står på sluttseddelen under tabellen og i Drift-loggen etter «Leverte …», og `slip_why {kgph, fair, pen, gq}` går til skyen. Ikke på første tur (den har sin egen linje) og ikke i statusboksen (V4 B). Antatt: «tett» ved 3 × et vanlig trekk og «tynt» ved 0,4 ×; planens «kulda 5 %» i eksempelet er lest som et eksempel, og regelen om 10 % gjelder. Prøvd: `tests/unit/turlinje.test.mjs` (sett rød før), `tests/turlinjetest.py` (stille, grov sjø, haill, nedfisket felt, engelsk, og stikkprøvene ved Bergen/Bøvågen, Bodø og Hammerfest/Forsøl), `geartest` (tre trekk), og skjermbildene i `docs/okter/2026-11-08-o8b-s2/`. **Måling, datoen for endringen: 08.11.2026.** Sammenlign leveringene per spiller etter tur 2 for spillere som startet fra 08.11.2026 med tallene under S1, når det er minst like mange; S0, S1 og S2 kom tett og kan ikke skilles.
