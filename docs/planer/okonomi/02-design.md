# Økonomi 2: designet (27.10.2026)

> Planen for det Jonas bestilte etter gjennomgangen i `01-gjennomgang.md`. **Venter på «kjør på».** Hver fase Ø1–Ø5 er én økt: økta leser denne fila, bygger fasen, oppdaterer statusen nederst og `docs/systemer/priser-og-salg.md` (og `folk-om-bord.md` for mannskapet), og slutter med `/lever` og `/okt-slutt`.

## 1. Bestillingen

Jonas 27.10.2026, svarene på de ti spørsmålene i `01-gjennomgang.md`:

1. Ambisjonsnivå: «Du bestemmer, men det må bli så bra og realistisk som mulig.»
2. Privatøkonomi: «Nei, spilleren har i utgangspunktet ikke behov for en privatøkonomi.»
3. Bankkontoer: «Automatisk skatteavsetning, rente på sparekonto, kassakreditt med rente.»
4. Lott etter felleskostnader og 1,5 lott til leid skipper: «Ja, ja.»
5. Skatterytmen: «Gjør det så realistisk som mulig.»
6. AS: «Siden spillere ikke skal ha en privatøkonomi vil alle pengene beholdes i selskapet og skattes deretter.»
7. Mannskapet: «Gjør det som er bransjestandard i dag.»
8. Lærestoff: «MVA kan stå på seddelen, men legg gjerne til en økonomi-del i håndboka-appen.»
9. Faste småkostnader (kaileie, forsikring, regnskapsfører for ENK, proviant): «Støy.»
10. Rekkefølge: Driftsplan 2 går i en annen økt, SK1–SK6 venter.

Reglene som gjelder: `CLAUDE.md` (ærlig om antakelser, kilder oppgis, patchnotes uten salgsstrategi, UI i begge formater), `docs/engasjement.md` (ingen ventetid eller friksjon lagt inn for å selge; økonomien er simuleringens egen og selges ikke forbi), `docs/handelssteder.md` (banken er ingen handel: ingen nye kjøp av varer; kontoene er penger, ikke ting).

## 2. Det som finnes i dag

Beskrevet i `01-gjennomgang.md` kapittel 1. Kort: én kasse `S.cash`, alle trekk og kjøp skriver `S.cash -= x; S.stats.costs += x` på rundt 45 steder (`grep "S.cash -= "`), uten kategori. `sell()` i `ui/08-actions.js` lager sluttseddelen, trekker `trekkOf` (Råfisklaget), regner lott per person av netto etter trekk, legger seddelen i `S.sales` og `S.lastSale`. Skatten i `core/03-simulation.js` (`TAX`, `taxOf`, `txProfit`, `taxTick`, `foundAS`, `depBase`), kalt fra `hourly()` i `core/06-services.js` ved midnatt. Mannskapets lott og hyre i `core/04-crew.js` (`genCrew` sitt `ask`, `HYRE`, `hyreAsk`, `payHyre`, `holdNet`, `crewSettle`, trivselens forventning `c.ask × 6 000 × 5` i `crewTick`). Banken og mannskapssiden i `ui/phone/13-mannskap-bank-meld.js` (`bank()`, `mannskap()`), Rederi-appen i `ui/phone/11-rederi.js` (`rederi()`, regnskapskortet), handlingene i `ui/phone/14-act.js` (`repay`, `repayAll`, `foundas`, `cpay`), Salg-fanen i `ui/06b-book-tabs.js`, håndboka i `ui/07c-handbook.js` (`HB_CH`, kapittel 6 «Sosialt og økonomi», dryppene `HB`), lagringsmigreringene i `ui/11-boot.js`, pengenes lyd og telling i `ui/02-format-state.js` (`cashShown`, `cashFx`).

## 3. Kildene (sjekket 27.10.2026)

Skatteetaten, Lovdata, regjeringen.no, Sticos og NDLA kunne ikke åpnes fra arbeidsmiljøet (DNS sperret / 403). Det under er fra søkeresultatenes gjengivelse av dem, og skal leses i kilden før lansering (`docs/lansering.md` sier regnskapsfører sjekker satsene).

- **Forskuddsskatt ENK** (skattebetalingsloven § 10-20 første ledd, endret fra inntektsåret 2021, Stortingets lovvedtak 53 2020–2021; Skatteetatens skattebetalingshåndbok): fire like terminer **15. mars, 15. juni, 15. september og 15. desember i inntektsåret**, etter forventet inntekt (sist fastsatt skatt, eller det spilleren melder). Under 2 000 kr forfaller alt 15. juni. Skatteetaten skriver at det er vanlig å betale 34–50 % av overskuddet i forskudd og anbefaler å sette av 40 %.
- **Forskuddsskatt AS** (§ 10-20 tredje ledd, § 6-5): to like terminer **15. februar og 15. april året etter inntektsåret**, hver halvparten av sist fastsatte skatt. Ikke under 2 000 kr.
- **Skatteoppgjøret:** skattemeldingen for næringsdrivende og selskaper har frist 31. mai. ENK får oppgjøret fra juni (restskatt eller tilgode), AS fra august til november (Sticos, Azets, Skatteetaten: «vi kan ikke gi en dato»).
- **Satsene 2026** (regjeringen.no «Skattesatser 2026», Sticos, Sands, Nordea): alminnelig inntekt 22 %, selskapsskatt 22 %, trygdeavgift fiske og fangst 7,6 % (ned fra 7,7), trinnskatt 226 100 / 318 300 / 725 050 / 980 100 / 1 467 200 kr med 1,7 / 4,0 / 13,7 / 16,8 / 17,8 % (Sands har 16,7 og 17,7 på de to øverste; regjeringen.no har 16,8 og 17,8, og spillet har det), personfradrag **114 210** kr i forslaget (spillet har 114 540; må leses i vedtaket), fiskerfradrag **30 %, høyst 160 000 kr** (Sticos; Stortingets innstilling 4 L 2025–2026), minst 130 dager på fiske (skatteloven § 6-60).
- **Lottsystemet** (Norges Fiskarlag «Tariffseksjonene»; SNL «lottfiske»; NDLA «Utregning av lottoppgjør»; BlueCrew «Fisker lønn 2026»): bruttofangstverdien minus felleskostnadene (drivstoff, is, agn, redskap og slitasje, proviant) er delingsfangsten, som deles mellom båten og mannskapet etter **tabeller forhandlet mellom Båteierseksjonen og Mannskapsseksjonen**, med mannskapets prosent etter fartøyets størrelse og antall mann. NDLA bruker en tabell fra 2020 der en båt på rundt 76 fot med seks mann gir **44 %** til mannskapet. BlueCrew sier at nettofangsten ofte deles 50–60 % til båten og 40–50 % til mannskapet, og at lott er det vanlige både i kyst- og havflåten, hyre det uvanlige. Selve tabellene (fiskerioverenskomsten) kunne ikke leses, så tabellen i Ø2 er **et anslag** kalibrert mot disse tallene. Skipperens 1,5 lott er Jonas' bestilling og vanlig praksis, ikke verifisert i en kilde.
- **Garantikassen for fiskere:** pensjonstrekket 0,4 % står alt. Garantilotten (minsteinntekt når fisket slår feil) bygges ikke.
- **Ikke funnet, settes som anslag og merkes i koden:** skjermingsrenten i foretaksmodellen (bruker 3,5 %), sparerente (3,5 %), kassekredittrente for små bedrifter (10 %).

## 4. Designet

Prinsipp: **ett pengesystem**, der hver krone som flyttes, går gjennom én funksjon med kategori, slik at seddelen, regnskapet, skatten, kontoutskriften og håndboka viser det samme tallet. Alt bak bryteren `ECON2 = true` i `core/03-simulation.js` slik at en lagring fra før kan spilles videre (migrering i `11-boot.js`), og slik at `DRIFT2` ble gjort.

### Ø1 Hovedboka og regnskapet per år

- **`book(k, kr, note, vid)`** i `core/03-simulation.js` (ny seksjon «the books»): kategori `k`, beløp (minus er kostnad, pluss er inntekt), tekst og båt. Den gjør `S.cash += kr`, fører `S.stats.y[år]` og legger en post i `S.ledger` (de siste 300, eldre bare som summer). Kategoriene: inntekter `fisk`, `tillegg` (bestillinger, innloggingsbonus, lever og rogn), `oppdrag`, `annet` (festival, quiz, slep, drypp); kostnader `diesel`, `is`, `agn`, `redskap` (kjøp, bøting, egning, kroker), `mannskap` (lott, oppgjør), `verft` (service, montering, ombygging, skrog, overtid, maling), `forsikring` (kasko, egenandel), `renter` (lån, kassekreditt), `regnskap` (AS), `land` (rorbu, naust, pub, klær, medlemskap, gebyrer), `trekk` (Råfisklaget og staten), `mva` (inn og ut, netto null), `skatt`. Utenfor resultatet, men i kontoutskriften: `avdrag`, `laan` (utbetalt), `baat` (kjøp og salg), `spare` og `skattekonto` (overføringer).
- De rundt 45 stedene som skriver `S.cash -=`/`S.stats.costs +=` byttes til `book`. `S.stats.revenue` og `S.stats.costs` beholdes (summer for alt som leser dem: `txProfit`, admin, tester), men regnes fra `book`.
- **Regnskapskortet** (ett sted: Rederi-appen; banken har en knapp dit) viser **året** (velger: i år, i fjor): inntekter per kategori, kostnader per kategori, avskrivning, resultat før skatt, skatt, resultat etter skatt; under det kontantstrømmen (avdrag, båtkjøp og salg, lån, overføringer til spare og skatt) og balansen som nå. `S.stats.tax` vises. Fjorårene står som `S.stats.y[år]`.
- **Kontoutskriften** på banksiden: de siste postene fra `S.ledger` (dato, tekst, beløp, saldo), med «Vis flere».
- Rederi-appen åpnes av **flåten** (`rederiOpen`: mannskap om bord, mer enn én båt, eller AS), ikke bare av AS (gjennomgangen 3.7); «Stift Rederi AS» i Neste mål blir et valg med begrunnelsen (22 % på det som blir i selskapet), ikke et steg alle tar.
- Filer: `core/03-simulation.js`, alle filene med `S.cash -=` (lista i `01-gjennomgang.md`, `grep`), `ui/phone/11-rederi.js`, `ui/phone/13-mannskap-bank-meld.js`, `ui/11-boot.js` (migrering: `S.stats.y[inneværende år]` startes fra `S.tx.rev0/cost0`, resten som «tidligere år»).
- Tester: `python3 tests/run.py changed` (dekker `03-simulation`: simday, calib, keeptest m.fl.; `08-actions`: selltest, cashfxtest, docktest, booktest; `06-services`: fleet3test, opsowntest; `14-act`: docktest, turtest). En ny `boktest.py` (LITE) leverer tre ganger, kjøper diesel og is, og sjekker at `S.ledger`, `S.stats.y`, `S.stats.revenue/costs` og `S.cash` stemmer med hverandre på krona. Skjermbilder av Rederi og banken i begge formater.

### Ø2 Turoppgjøret: felleskostnader, lotter og bransjestandarden

- **Turens forbruk** per båt, `b.trip = {t0, fuelL, fuelKr, iceKg, iceKr, baitKr, gearKr}`, telles der det brukes: diesel i `vesselStep` (liter × båtens siste bunkerpris, `b.fuelKrL` settes i `startFueling`), is der den legges på fisken (`DECK` i `05-vessels.js`), agn der lina egnes og teinene agnes (`10-gear.js`), redskap tapt eller slitt på turen (`10b-gearcare.js`). Nulles ved levering. Driftsplan 2 (`06h-plan2-engine.js`) rører ikke dette: forbruket telles der det skjer, uansett hvem som fører båten.
- **Sluttseddelen** (`sell()` og `06b-book-tabs.js`): brutto, trekkene (én linje, detaljene ved trykk som nå), MVA (én linje, «du får den og betaler den videre»), **felleskostnader** (diesel, is, agn, redskap; én linje hver), **delingsfangst**, mannskapets lotter (én linje per person med lottall), **til kassa**. `S.lastSale.fk` og `S.sales[].d.fk` lagrer felleskostnadene.
- **Lotten** regnes slik det gjøres på kysten: mannskapets andel `M` av delingsfangsten etter en tabell over antall om bord (med skipperen) og båtens lengde, delt i lotter: hver mann 1 lott, lærling 0,75, leid skipper 1,5, eieren om bord 1 lott (som går i kassa sammen med båtens andel, siden spilleren ikke har privatøkonomi). Tabellen (anslag, kalibrert mot kildene i kapittel 3; justeres i spilltesting):

| Om bord (med skipper) | under 11 m | 11–15 m | 15–28 m | over 28 m |
|---|---|---|---|---|
| 1 | 0 % | | | |
| 2 | 30 % | 30 % | | |
| 3 | 36 % | 36 % | 36 % | |
| 4 | 40 % | 40 % | 40 % | 38 % |
| 5–6 | 44 % | 44 % | 44 % | 42 % |
| 7 og flere | | 48 % | 48 % | 46 % |

  Eksempel: sjark med eieren og én mann: delingsfangst 10 000 kr, M = 30 %, to lotter, mannen får 1 500 kr (15 %), eieren 1 500 + 7 000 i kassa. Med dagens regel får mannen 10–20 % av netto etter trekk uten at dieselen er trukket, så balansen flyttes litt mot eieren på korte turer og litt mot mannskapet på lange, og `progweek` kjøres på nytt.
- **Mannskapsbørsen** ber ikke lenger om prosent, men om lotter: lærlingen 0,75, erfaren 1, dreven 1 (og «vil ha 1,25» i skreisesongen eller som stolt). Forhandling ±0,1 lott som nå. `c.share` lagres som lottall (migrering: `share × 100 / 15` rundet til nærmeste kvarte lott, minst 0,75). `holdNet` og `crewSettle` regner det samme oppgjøret på lasten om bord.
- **Hyre tas bort** som standard (valg V1): bransjestandarden er lott. Mannskap på hyre i gamle lagringer går over til lott ved neste levering, med en melding. Koden for hyre blir stående bak `ECON2` til neste rydding. Hullet «Salg-fanen regner alle som lott» (E3) forsvinner med det.
- **Forventningen** i trivselen (`crewTick`): ikke 6 000 × 5, men det lotten ville gitt på denne båten i en vanlig uke: `VESSELS[type].weekKr` (ny, et anslag per båttype fra `progweek` og de typiske landingene: skiffen 6 000, snekka 12 000, sjarken 40 000, kystbåten 150 000, havbåtene mer) × sesongfaktor × M / lotter. Hyra forsvinner, så `hyreAsk` går ut av bruk.
- **Leid skipper:** 1,5 lott når `!meAboard()` og `crewSkipper()` fører båten (Driftsplan 2). Det gamle skippertillegget på 5 % i `06d-drift.js` forsvinner med del 8 uansett.
- Filer: `core/03-simulation.js`, `core/04-crew.js`, `core/05-vessels.js`, `core/07-harbours.js` (bunkerpris), `core/10-gear.js`, `core/10b-gearcare.js`, `ui/08-actions.js`, `ui/06b-book-tabs.js`, `ui/07-guide.js` (seddelen på skjermen), `ui/phone/13-mannskap-bank-meld.js` (lotter på kortene), `ui/phone/14-act.js` (`cpay` bort), `ui/11-boot.js`.
- Tester: `changed` (selltest, skiptest, fleet2test, worktest, crewlifetest, geartest, caretest, booktest, driftsplan2test). `boktest.py` utvides med turens kostnader mot seddelen. `progweek.py` kjøres og leses: blad B og inngangen skal fortsatt komme på 14–16 turer; ellers justeres tabellen, ikke prisene.

### Ø3 Bankkontoene

- **`S.bank = {skatt, spare, auto:{skatt:true, sparePct:0}, kk:{limit, rate:0.10, intPaid}, rent:0.035}`.** `S.cash` er brukskontoen og det HUD-en viser. HUD-en får en liten linje under kassa når skattekontoen eller sparekontoen har penger («+ 48 000 avsatt»), bare i det fulle HUD-et.
- **Skattekontoen.** Etter hver levering og hvert oppdrag med penger: `book` flytter en avsetning fra bruks til skatt. Beløpet er spillets eget anslag: `taxOf(årets overskudd så langt framskrevet) − betalt − avsatt`, begrenset til 50 % av det som kom inn, så kassa aldri tømmes av avsetningen. Spilleren kan slå av automatikken eller sette en fast prosent (Skatteetatens råd, 40 %, står som forslag i teksten). Terminene (Ø4) trekkes fra skattekontoen først, resten fra bruks. Står det mer på skattekontoen enn skatten ble, flyttes resten tilbake ved oppgjøret, med melding. Kortet viser «Avsatt» mot «Forventet skatt i år» med en stolpe.
- **Sparekontoen.** Innskudd og uttak med beløp (knapper 10 000, 50 000, alt, og et felt), valgfri fast prosent av hver levering, rente 3,5 % i året (anslag) godskrevet den 1. i måneden (`hourly`), ført som inntekt `annet`. Sperret for daglige trekk: ingenting trekkes derfra uten at spilleren flytter det. «Neste mål» og `deal()` regner sparekontoen som egenkapital («egenkapitalen banken krever: 85 000, du har 40 000 på sparekonto og 12 000 i kassa»), og båtkjøpet henter derfra når spilleren godtar det i tilbudet.
- **Kassekreditten.** Brukskontoen kan gå under null inntil `kk.limit` = 10 % av flåtens verdi, minst 20 000 kr (anslag), mot 10 % rente (anslag) regnet daglig og trukket den 1. i måneden som `renter`. Alle kjøpssjekkene (`S.cash < pris`, rundt 25 steder: `buyGate`, `careQueue`, `equip`, `svc`, `member`, bunkring, is, agn, rorbu, pub, maling) går gjennom én funksjon `canPay(kr)` = `S.cash + kk.limit ≥ kr`. Under grensen stopper alt, med toast og en melding fra banken. HUD-en viser rødt under null som nå, og banken sier «Kassekreditt brukt: 12 000 av 40 000». Rentene synes på kortet. **Varsel ved kjøp** som ville la det bli igjen mindre enn en tur i diesel og is (rapport 2 punkt 8): bekreftelsen sier det.
- Banken får fire kort: Brukskonto (kontoutskrift fra Ø1), Skattekonto, Sparekonto, Kassekreditt, så lånene som nå.
- Filer: `core/03-simulation.js` (banken og `canPay`), `core/06-services.js` (rente og kassekreditt i `hourly`), `ui/08-actions.js` (avsetningen etter `sell`), `core/09g-turer.js` (etter oppdrag), `ui/phone/13-mannskap-bank-meld.js`, `ui/phone/14-act.js`, `ui/phone/10-fartoy.js` (Neste mål, `deal`), `ui/04-panels-instruments.js` og `ui/07-guide.js` (HUD), kjøpsstedene for `canPay`.
- Tester: `changed`; ny `banktest.py` (LITE): levering gir avsetning, termin trekker fra skattekontoen, innskudd og rente, kjøp på kassekreditt til grensen og stopp, renten den 1. Skjermbilder av banken i begge formater.

### Ø4 Skatten som i livet

- **ENK:** forskuddsskatten i fire terminer **15. mars, 15. juni, 15. september, 15. desember** i inntektsåret, hver ¼ av forventet skatt. Forventet skatt det første året: `taxOf` av overskuddet så langt framskrevet til hele året (som å melde inn en ny forventet inntekt), regnet på nytt før hver termin; senere år: fjorårets fastsatte skatt (`S.taxLast.R.sum`), justert før hver termin om året ser ut til å bli mer enn 20 % annerledes (som en endret skattemelding). Under 2 000 kr: alt 15. juni. **Skatteoppgjøret i juni** året etter: restskatt trekkes (fra skattekontoen først) eller tilgode settes inn, med melding fra Skatteetaten. Underskudd framføres (`S.tx.carry`, skatteloven § 14-6) mot neste års overskudd. **Skjermingsfradraget** i foretaksmodellen: personinntekten (trygdeavgift og trinnskatt) regnes av overskuddet minus skjermingsgrunnlaget (`depBase` + kvoteverdien) × 3,5 % (anslag), alminnelig inntekt som før. Fiskerfradraget og personfradraget som nå.
- **AS:** 22 % av overskuddet (alt blir i selskapet, Jonas' valg 6). Forskudd i to terminer **15. februar og 15. april året etter**, hver halvparten av fjorårets fastsatte skatt (det første året ingen forskudd), **oppgjøret i oktober** året etter. Regnskapsføreren 30 000 kr i året står. Underskudd framføres. Skattekortet sammenligner ENK og AS ærlig: «som ENK betaler du personskatt av hele overskuddet, som AS 22 %, men alt blir i selskapet; i livet koster det å ta pengene ut». Rederi-appen og AS skilles (Ø1).
- **Varsel** sju spilldager før hver termin (melding fra Skatteetaten med beløpet og hva som står på skattekontoen), og terminen som en linje på bankkortet.
- **Avskrivningen** rettes: `motor90` kostnadsføres ved kjøpet og skal ikke også inn i `depBase` (gjennomgangen 2.8). Utstyr over 30 000 kr kunne avskrives i saldogruppe d (20 %), men det krever et anleggsregister; det bygges ikke nå (kostnadsføring gir spilleren fradraget tidligere, som er til spillerens fordel, og det står som forenkling i doku).
- Filer: `core/03-simulation.js` (`TAX`, `taxOf`, `txProfit`, `taxTick`, `foundAS`, `depBase`), `core/06-services.js`, `ui/phone/13-mannskap-bank-meld.js` (skattekortet), `ui/11-boot.js` (migrering av `S.tx`: betalt forskudd beholdes, terminene settes framover).
- Tester: `changed` (simday, calib og de andre på `03-simulation`); ny `skattetest.py` (LITE) spiller et ENK-år og et AS-år med faste tall mot en utregning i testen (terminene på riktige datoer, oppgjøret, framført underskudd, fiskerfradraget med og uten 130 dager, skjermingen), og at `S.tx` fra en gammel lagring går videre.

### Ø5 Håndboka, tekstene, patchnotene og balansen

- **Håndboka** (`ui/07c-handbook.js`, kapittel 6 «Sosialt og økonomi») får dryppene: «Sluttseddelen» (brutto, trekk, felleskostnader, delingsfangst, lott), «Lotten» (lotter, mannskapets andel, skipperens 1,5), «MVA-en» (du får den og betaler den videre), «Skatten» (ENK, terminene, fiskerfradraget), «Skattekontoen», «Sparekontoen og egenkapitalen», «Kassekreditten», «ENK eller AS», «Lånene». Hvert drypp kommer første gang det skjer (første levering med felleskostnader, første avsetning, første termin, første gang kassa går under null) og står i appen med «Vis meg», som de andre.
- **Tekstene** på bank- og regnskapskortene: én setning per tall, på norsk og engelsk; kildene på `kilder.html`.
- **Patchnotene:** én ny oppføring, kort, uten tall om ekte penger (regelen i `CLAUDE.md`).
- **Balansen:** `progweek.py` med de tre tempoene, `selltest`, `simday` og `calib` leses; tabellen i Ø2 og avsetningen i Ø3 justeres til blad B og inngangen fortsatt kommer på 14–16 turer, og til en sjark med to mann og hjemmel tjener omtrent som i livet (Fiskeridirektoratets lønnsomhetsundersøkelse for kystflåten under 11 m: driftsinntekter rundt 1,5–2,5 millioner kr i året, sjekkes i kilden).
- **Dokumentasjonen:** `docs/systemer/priser-og-salg.md` (5.4 skrives om: oppgjøret, banken, skatten), `docs/systemer/folk-om-bord.md` (5.6 lotten), `docs/systemer/ui-og-telefon.md` (bankens kort), `docs/handelssteder.md` (banken er ikke et handelssted; en linje), `docs/BACKLOG.md`.
- Filer: `ui/07c-handbook.js`, `src/legal/kilder.html`, `ui/phone/07-patch.js`, dokumentene.
- Tester: `hbtest` (håndboka), skjermbilder av håndboka, banken og seddelen i begge formater.

## 5. Valgene

- **V1 Hyre.** A: tas bort, lott for alle, som i kystflåten i dag (anbefalt: det er bransjestandarden Jonas ba om, og det fjerner et hull i Salg-fanen). B: beholdes som et valg på mannskapskortet, med hyra regnet av `weekKr`.
- **V2 Mannskapets andel.** A: tabell etter antall om bord og båtlengde, delt i lotter (anbefalt: det er slik oppgjøret gjøres, og det skalerer av seg selv fra jolla til havbåten). B: dagens prosent per person beholdes, bare regnet etter felleskostnadene (mindre arbeid, men forventningen må fortsatt fikses for hånd per båt).
- **V3 Skatteavsetningen.** A: automatisk etter spillets eget anslag, standard på, kan overstyres (anbefalt: den treffer, og spilleren ser hvorfor beløpet er som det er). B: fast 40 % av hver levering, som Skatteetaten anbefaler (enklere å forstå, men setter av for mye for små båter under personfradraget).
- **V4 Satsene som ikke kunne leses i kilden** (personfradrag 114 210 mot 114 540, skjermingsrente, sparerente, kassekredittrente, lottabellen). A: jeg setter anslagene, merker dem i koden og doku, og Jonas eller regnskapsføreren sjekker før lansering (anbefalt: det stopper ikke byggingen, og alle tall er startverdier som justeres). B: Jonas slår opp satsene nå, før Ø2–Ø4.

## 6. Antatt eller usikkert

- Lottabellen, skipperens 1,5 lott, `weekKr` per båttype, sparerenten, kassekredittrenten og grensen, skjermingsrenten og personfradraget er anslag (kapittel 3). De merkes `// an estimate` i koden.
- Felleskostnadene i avtalene omfatter også proviant og emballasje; proviant koster ingenting i spillet (Jonas: støy), så den er ikke med.
- AS uten uttak er Jonas' valg: realistisk for et selskap som lar alt stå, og det må stå i håndboka at det er slik.
- Skatteoppgjørets dato finnes ikke (Skatteetaten sender fortløpende); juni og oktober er valgt som det vanligste.
- Det første året uten fjorårsskatt: Skatteetaten skriver ut forskudd etter det spilleren melder; spillet melder selv (framskrivingen). Det er en forenkling av at spilleren måtte ha gjort det.
- Tempo 1:6 gjør at en ENK-termin kommer rundt hver 15. ekte dag og AS-terminene to ganger i året; en spiller som kommer inn midt i året, får første termin med en gang om det er over 2 000 kr.

## 7. Det planen ikke gjør

Ingen privatøkonomi, lønn eller utbytte. Ingen småkostnader (kaileie, ansvarsforsikring, regnskapsfører for ENK, proviant, gebyrer). Ingen garantilott, ingen minstelønn. Ingen anleggsregister for utstyr. Ingen kvoteavskrivning. Ingenting for ekte penger: banken selger ingenting, og ingen friksjon i økonomien lettes for ekte penger. Driftsplan 2 del 8 og SK1–SK6 rører den ikke.

## 8. Status

- 27.10.2026: planen skrevet. Jonas: «kjør på», V1 A, V2 A, V3 A, V4 A («så lenge det er ganske nøyaktig går det greit»).
- 27.10.2026, Ø1 bygd: `ACCT`/`book`/`bookAll` i `core/03-simulation.js`, alle rundt 70 pengeflyttingene i 28 filer gjennom `book`, bankens faner Kontoer og Regnskap, Rederi-appens årstall, `rederiOpen` etter flåten, `boktest.py`. Navnet `BOOK` var tatt (dekksdagboka), så kategoriene heter `ACCT`. Bryteren `ECON2` ble ikke laget for Ø1: hovedboka endrer ingen tall, bare hvor de føres.
- 27.10.2026, Ø2–Ø5 bygd i samme økt (Jonas: «kjør på»): lotten (`LOTT` m.fl. i `core/04-crew.js`, `fuelUse`/`fuelAdd` i `03-simulation.js`, seddelen, Salg-fanen, mannskapssidene; hyra fjernet), bankkontoene (`BANK` m.fl., `spendable()` i rundt 55 kjøpssjekker, bankens kort, HUD-raden), skatten (`TAX` med terminene, `txClose`, `taxPlan`, `S.saldo`, `S.taxCarry`, skattekortet), håndboka (kapittel 7 «Økonomien», ni tips), patchnote `p144`. Avvik fra planen: kategoriene heter `ACCT`; ingen bryter `ECON2` (hovedboka og skatten er vevd inn overalt, og lagringene migreres i stedet: `bookMigrate`, `lotMigrate`, `T.adv`); felleskostnadene er drivstoff, is og agn, ikke redskap (redskapet er båtens i lottavtalene); gamle prosentandeler rundes til nærmeste kvarte lott. Tester: `boktest`, `lotttest`, `skattetest` (nye), og de testene uten 3D som dekker filene. `progweek`: inngangen til lukket gruppe etter 11–12 turer i alle tre tempoene.
- Gjenstår: spilltest, og regnskapsførers sjekk av satsene før lansering.
- 27.10.2026, etter at Jonas fant fiskerioverenskomsten og oppgjørsavtalene i Norges Fiskarlag (fra 1.1.2025): anslaget for lotten er byttet ut med avtalens tabeller (`OPPG`: juksa § 18 etter juksamaskiner, garn § 1, krabbeteiner § 1 c, line § 3, havfiske § 6, snøkrabbe § 20), lærlingen teller som en halv mann og får 40/60/75 % lott (§ 24), skipperen får ekstralott 1/6, 1/3 eller 1/2 lott fra rederiet (§ 22 a) i stedet for 1,5 lott, en styrmann på døgndrift bestmannshyre (§ 22 a), og felleskostnadene følger § 8 B (havneavgift, egning, juksautstyr og tapt redskap lagt til). Mannskapets andel ble dermed mye høyere enn anslaget (59,5 % for to mann på en garnbåt under 30 fot, mot 30 %).
- 27.10.2026: flettet inn i arbeidsgrenen og rullet ut på detstorebla.no (Jonas: «Commit og push ut på detstorebla.no når du er klar»).
