# Priser, kvalitet, salg og bestillinger

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.4 Priser, kvalitet og salg

- **Prismodell:** `clsPrice = max(minstepris × kroktillegg, markedspris × havnefaktor × tilbudsfaktor × klasseforhold × metningsfaktor)`.
  - `weekDev` er et ukentlig AR(1)-avvik: 0,7 × forrige + støy.
  - `supplyFactor` ligger mellom 0,97 og 1,03.
  - Torskekurven er skalert til 2026-nivå med faktor 1,06.
- **Minstepriser:** dynamiske for torsk, hyse og sei fra 21.09.2026. De andre artene har faste minstepriser fra våren 2026. Tabellen står i spesifikasjonen og i `SPECIES.cls`.
- **Kvalitet** (`GM`):

| E | A | B | X (skadd) | V (vrak) |
|---|---|---|---|---|
| +5 % | 100 % | −15 % | −40 % | 1 kr/kg |

- **Kroktillegg:** Krokfanget hyse over 1,1 kg får +12,8 %.
- **Sløying om bord** (innstilling «Sløy fangsten»): hyse og sei slipper sløyetrekket på 0,30 kr/kg, og du får betalt for lever og rogn. Lever er 5 % av vekta. Rogn er 4 % for torsk i januar–april og 1 % ellers.
- **Arbeid på dekk (G, 29.09.2026):**
  - **Bløgging:** Den skjer automatisk og gratis idet fisken kommer over ripa. Deretter ligger fisken i bløggekaret, rund og uiset, og holder seg dårligere enn iset fisk etter temperaturen (se «Hvor lenge fangsten holder seg» under).
  - **Hvor lenge fangsten holder seg** (D3 av driftsplanen, Jonas 23.10.2026 svar 15a; `KEEP`, `keepDay`/`keepF`, `keepRRS`, `keepK` og `keepHours` i `core/03-simulation.js`, brukt i `vesselStep` og i push-varselet):
    - Blødd og sløyd fisk i is ved 0 °C følger de fire fasene til Huss mfl. (FAO Fisheries Technical Paper 348, 1995): fersk 0–2 døgn, nøytral 2–6, stygg 6–12 og bedervet 12–15. Torsk og hyse kasseres rundt 16 døgn etter fangst (FAO), og hel torsk i is holder 11–14 døgn etter smakspanelene (Matís). Klassene følger fasene: E til 2 døgn, A til 6, B til 12, X til 16, så V (ferskheten 100 → 85 → 65 → 40 → 15 → 0, lineært mellom).
    - Varmere holder dårligere med relativ fordervingshastighet (1 + 0,1 T)², T i °C (FAO, kvadratrotmodellen: pakket torsk 14 døgn ved 0 °C og 6 ved 5 °C). Uiset fisk på dekk ligger mellom sjøens og lufttemperaturen (`seaTemp`, `airTemp`), ikke under 0 °C. I juli (T ≈ 12 °C, faktor 4,4) holder uiset fisk E i rundt 11 timer; iset fisk holder E i 2 døgn.
    - Ublødd fisk holder dobbelt så dårlig. Det er spillets regel, ikke fra kildene: kvalitetsforskriften vil ha fisken blødd, og Råfisklagets minstepriser gjelder velbløgget vare (prisen for dårlig bløgget fisk kan settes ned med inntil 40 %).
    - **Fryserom** (`hold.kind` `frys`: snøkrabbefartøyet, autolineren, frysetråleren): mannskapet fryser fangsten i samme tempo som de iser, uten is (platefrysere), og fryst fisk holder klassen den hadde (`x.frozen`). **RSW** (ringnotskipet): fangsten kjøles idet den kommer om bord og holder seg som i is. Før D3 råtnet fangsten på disse skipene som uiset fisk.
    - **Fryst fisk ved mottaket** betales som fersk fisk av samme klasse: Råfisklaget har samme minstepris for fryst som for fersk (sløyd uten hode, torsk 6+ kg 70,75 kr/kg, sei 2,3+ kg 28,10, hyse 0,8+ kg 29,50; Prisrapport fersk- og fryst-omsetning uke 31 2026). Snittprisene for sjøfryst lå høyere enn for fersk hittil i 2026 (torsk ~1 % over, sei ~46 %, hyse omtrent dobbelt), men spillet bruker minsteprisene, slik det ble avtalt. Sluttseddelen merker partiet «fryst». Fryst fisk teller ikke som fersk landing i ferskfiskordningen (J-161-2026 § 25), og bare fersk torsk kan gå på den.
    - Test: `keeptest.py`.
  - **Sløying og ising** er arbeid (`DECK` i `05-vessels.js`). Sløying tar rundt 300 kg i timen per person og ising rundt 800. Isingen bruker 0,3 kg is per kg fisk. Tallene er anslag. En utstyrsleverandør oppgir 10–15 fisk i minuttet for hånd, trolig flatfisk, og FAO oppgir 30 i minuttet for maskin. Effektiviteten per person er `teamEff`.
  - **Hvem gjør hva** (`deckHands`):
    - Alene kan du ikke sløye mens du fisker eller styrer.
    - To eller flere: én styrer, og de andre jobber. Under fisket står én på dekk, og fisket går tilsvarende tregere.
    - Ligger båten stille eller ved kai, jobber alle.
  - **Bløggekaret** tar 60 kg på skiffen, 150 på snekka, 300 på sjarken og 400 på den nye sjarken. Er det fullt, stopper fisket til det er tatt unna. Tida du bruker på dekk, legges til fisketida. Knappene «Stopp og sløy» og «Fisk videre» styrer dette selv.
  - **«Ta unna fangsten før du går fra feltet»** (på som standard): alene blir du liggende til karet er tomt.
  - **I 3D:** Bløggekar og sløyebenk står på etterdekket. Den som jobber, står ved benken og sløyer, og sloet går over babord ripe mens måkene stuper etter det. Alene går skipperen fra rattet.
  - **Større fartøy** med fabrikk om bord kommer senere.
- **Sluttseddelen** viser art, størrelse, kvalitet, kilo, kilopris, lever og rogn, inndragning, ferskfiskordningen, bestillinger og fangstfelt.
  - Hver linje står i hele kroner og kilo, og totalen er summen av linjene (A7). Linjene står med full verdi, og det som inndras, står som egne trekk: torsk over kvote eller bifangstgrensen, og død kongekrabbe (0 kr). Gamle sedler kan ha krabbe under minstemålet og trekket for rognkrabbe fra taskekrabbens tid. Tillegg for bestillinger og innloggingsbonusen har egne linjer.
  - Under totalen kommer trekkene i oppgjøret, så «Lott til mannskapet» og «Til kassa». Kassa får nøyaktig total minus trekk og lott. Gebyret for småkrabbe står som en merknad under på gamle sedler. Kongekrabben har ikke noe slikt gebyr.
  - **Trekkene** (E2 av økonomiplanen, 04.10.2026, `TREKK` og `trekkOf` i `03-simulation.js`), som Råfisklaget trekker dem:
    - **Lagsavgift:** 0,43 % av totalen (ferske produkter fra 1.7.2026).
    - **Av totalen minus lagsavgiften:**
      - pensjonstrekk til Garantikassen for fiskere: 0,4 %
      - produktavgift til folketrygden: 1,6 % fra 1.1.2026
      - fiskeriforskningsavgift: 1,35 %
      - ressursavgift: 0,42 %
      - kontrollavgift: 0,22 %, bare fra fartøy på 15 m og mer, fordi den ennå ikke er innført under 15 m
    - **Til sammen:** rundt 4,2 % under 15 m.
    - **Lotten:** Mannskapets lott regnes av det som er igjen etter trekkene. Det er en antakelse, fordi lottavtalene regner etter felles utgifter.
    - **Lagring:** I `S.sales[].d.tk` og `S.lastSale.tk`. Salg-fanen viser dem som én linje.
    - **Balansen:** Inntekten blir 4 % lavere, så `progweek` er kjørt på nytt. Blad B og inngangen til lukket gruppe er fortsatt innen rekkevidde: dag 32 med en tur annenhver dag, og dag 18 med tur hver dag.
  - **Papirene og foretaket** (E1, 04.10.2026, `MVA`, `mvaOf` og `mvaCheck` i `03-simulation.js`):
    - Papirer (under Sjømann) har ervervstillatelse for hver båt (deltakerloven § 4; under 15 m holder det at du er aktiv fisker) og kortet «Foretaket».
    - Du trenger verken ENK eller AS for å fiske. Når salget passerer 50 000 kr på tolv måneder (merverdiavgiftsloven § 2-1), registreres fisket som ENK i Enhetsregisteret og i Merverdiavgiftsregisteret (`S.mva`, med et fiktivt org.nr.). Det kommer en melding fra Brønnøysundregistrene.
    - Etter det står MVA 11,11 % (§ 5-8) på sluttseddelen, regnet av totalen minus de offentlige trekkene, og like stor «MVA videre til staten». Netto er null.
    - **Forenkling:** Inngående MVA på diesel og utstyr kommer ikke tilbake, så prisene i spillet regnes som uten MVA.
  - **Lotten** (Økonomi 2, Ø2, 27.10.2026; `OPPG`, `LOTT`, `oppgPct`, `lottFishery`, `lottM`, `lotOf`, `apprLot`, `lotMigrate`, `tripOf`, `tripAdd`, `tripCost`, `lottParty`, `lottSplit`, `payMates`, `weekKr`, `lotWeek` i `core/04-crew.js`; erstatter «Lott eller hyre», E3 04.10.2026):
    - **Kilden:** «Fiskerioverenskomst og oppgjørsavtaler mellom Mannskapsseksjonen og Båteierseksjonen i Norges Fiskarlag», gjelder fra 1. januar 2025 (PDF-en Jonas fant 27.10.2026). Tabellene og reglene under er lest av den. Den andre PDF-en (HK og Norges Fiskarlag 2024–2026) er tariffen for de ansatte i Fiskarlaget og gjelder ikke fisket.
    - **Felleskostnadene** (§ 8 B): Råfisklagets trekk (§ 8 B 1, alt på seddelen), drivstoff (§ 8 B 9: litrene motoren brenner, `fuelUse`, til tankens snittpris `b.fuelKrL`), is (§ 8 B 13: isen på fisken), agn (§ 8 B 22: agnet som settes) og egning (§ 8 B 25: egnebuas arbeid, `egnOrder`), havneavgift (§ 8 B 7: `havnMinute`), juksautstyr (§ 8 B 19: håndjuksa, kveiteutstyr og juksasett), og for garn, line og teiner tapt redskap (oppgjørsavtalene §§ 1, 3 og 19: verdien av det som går tapt i været, `gearHour`). Tellingen er per båt (`b.trip`, `tripAdd`) og nullstilles ved levering. De er betalt fra kontoen da de oppsto og står i hovedboka da; i oppgjøret trekkes de bare før delingen. MVA holdes utenfor (§ 8 E). Ikke med: kost til mannskapet, forsikringspremiene i § 5 og sløyeutgifter (spillet har dem ikke; Jonas: småkostnader er støy).
    - **Mannskapets prosent** av delingsfangsten (`OPPG`) etter fisket turen sist brukte (§ 8 A «det siste fisket», `lottFishery` etter `b.tripGear`, som nå holder tiden): juksa § 18 etter antall juksamaskiner og fot (uten maskiner under 30 fot 74,5 %); garn § 1 etter antall om bord og fot (to mann under 30 fot 59,5 %); krabbeteiner § 1 c, garntabellen + 3 %; line § 3 (landegnet line); garn og line fra 28 m § 6 (havfiske, etter meter); teiner fra 28 m § 20 snøkrabbe, 35 %. Tabellene vekter også lasterommet i m³; spillet bruker bare lengden. Et antall som ikke står i kolonnen, tar nærmeste rad (innledningen til oppgjørsavtalene). Trål, snurrevad og not (§§ 12, 13, 15) legges inn når havbåtenes fiske kommer.
    - **Hvem som teller:** alle om bord, eieren også; en lærling som en halv mann (§ 24.3: snittet av radene på hver side).
    - **Lottene:** en mann 1 lott; en lærling (nivå «lærling») 40 %, 60 % og 75 % lott i første, andre og tredje år etter årene på sjøen (§ 24.4); eieren om bord 1 lott, som blir i kassa sammen med båtens del (ingen privatøkonomi). Arbeidsjern og erfarne i skreisesongen ber om en tidel mer; forhandling og «Øk lotten» flytter en tidel.
    - **Skipper og styrmann** (§ 22 a, rederiutgift): den som skipper når eieren er i land (den utnevnte skipperen, ellers den mest sjøvante), får ekstralott 1/6 lott under 15 m, 1/3 lott fra 15 til 24 m og 1/2 lott fra 24 m, betalt av båtens del, ikke av mannskapets (avtalen nevner ikke under 10 m; spillet gir 1/6 der også). Erstatter Jonas' valg av 1,5 lott 27.10.2026, etter avtalen han fant samme dag. En styrmann på døgndrift (`c.mate`) får bestmannshyre 408 kr om dagen under 24 m og 500 kr fra 24 m (`payMates`, ved midnatt).
    - **Hyre er borte** (Jonas: V1 A). Mannskap på hyre og gamle prosentandeler går over på lott (`lotMigrate`, nærmeste kvarte lott, 15 % var en hel).
    - **Oppgjør når noen går i land** (`crewSettle`): lotten av lasten om bord, priset som ved levering (`holdNet`), minus turens felleskostnader så langt.
    - **Trivselen** måler ukas lott mot det en lott på denne båten gir i en vanlig uke (`lotWeek`: `WEEKKR` etter båtlengde, et anslag i spillets kroner, × 0,8 × sesongen × mannskapets prosent ÷ lottene). Lott mot ønsket lott teller × 40, ikke for lærlinger (de følger avtalen).
    - **Sluttseddelen** viser netto etter trekk, hver felleskostnad, delingsfangsten, mannskapets del med fisket, antall om bord, prosenten og paragrafen, hver lott (lærling og skippertillegg merket) og «Til kassa» (`portSlip` i `ui/07-guide.js`). Salg-fanen viser det samme (`d.fk` = [liter, drivstoff, kg is, is, agn, havn, redskap], `d.dl` = [delingsfangst, prosent, om bord, eierens lott, fisket], `d.crew` = [navn, lotter, kr, skipper, ekstralott]). Mannskapssiden har kortet «Lottoppgjøret».
    - Test: `lotttest.py` (tabellverdiene slått opp i avtalen, oppgjøret, lærling, skipper, migreringen).
  - **Bankkontoene** (Økonomi 2, Ø3, 27.10.2026; `BANK`, `bankS`, `kkLimit`, `spendable`, `eqCash`, `bankMove`, `bankAfterIncome`, `taxPay`, `bankRelease`, `bankDay` i `core/03-simulation.js`; Jonas: «Automatisk skatteavsetning, rente på sparekonto, kassakreditt med rente»):
    - `S.cash` er brukskontoen. `S.bank` har `skatt`, `spare`, `auto`, `pct`, `spPct`, `kkAcc`, `spAcc`.
    - **Skattekontoen:** etter hver levering og hvert oppdrag med penger (`bankAfterIncome`) settes skatten på årets overskudd så langt minus det som er betalt og avsatt (`taxOwed`) av, høyst halvparten av det som kom inn (V3 A), eller en fast prosent (30, 40, 50 %; Skatteetaten råder til rundt 40 %). Skatten betales derfra først (`taxPay`). Det som står igjen etter et oppgjør, går tilbake (`bankRelease`).
    - **Sparekontoen:** 3,5 % rente (anslag), regnet daglig og godskrevet den første i måneden; fast sparing 0–30 % av hver levering; teller som egenkapital i `deal()` og Neste mål (`eqCash`), og båtkjøpet henter derfra det brukskontoen mangler.
    - **Kassekreditten:** brukskontoen kan gå under null inntil rammen, 10 % av flåtens verdi og minst 20 000 kr (`kkLimit`, anslag), mot 10 % rente (anslag), trukket den første i måneden. Alle kjøpssjekkene spør `spendable()` (rundt 55 steder); innbetaling på lån og aksjekapital krever penger på brukskontoen. Over rammen sier banken fra én gang i døgnet.
    - Banken viser brukskonto (med det som kan brukes), skattekonto (avsatt mot skatten så langt, valg av avsetning, inn og ut), sparekonto (rente, inn og ut, fast sparing), kassekreditt (ramme, brukt, påløpt rente), lånene, skattekortet og kontoutskriften. Det fulle HUD-et har raden «Skatt · spart».
  - **Skatten** (Økonomi 2, Ø4, 27.10.2026; `TAX`, `taxOf`, `saldoOf`, `depBase`, `skjBase`, `txInit`, `txProfit`, `txNow`, `taxOwed`, `enkAdv`, `taxPlan`, `asBase`, `txClose`, `taxTick`, `foundAS` i `core/03-simulation.js`; erstatter «Skatt og Rederi AS», E4 04.10.2026):
    - **Overskuddet:** inntekter minus kostnader i hovedboka minus saldoavskrivning 14 % av hver båts skattemessige verdi (`S.saldo`, 70 % av prisen når båten første gang er med, skrevet ned ved hvert årsskifte; utstyr kostnadsføres ved kjøpet, og motoren avskrives ikke lenger i tillegg). Underskudd føres videre (skatteloven § 14-6), ENK og AS hver for seg (`S.taxCarry`).
    - **ENK:** 22 % av overskuddet minus fiskerfradrag (§ 6-60: 30 %, høyst 160 000 kr, med 130 dager på fiske) og personfradrag (114 540 kr; forslaget for 2026 var 114 210, ikke sjekket i vedtaket); trygdeavgift 7,6 % og trinnskatt av personinntekten, som er overskuddet minus skjermingsfradraget (båtenes saldoverdi og kvoteverdien × 3,5 %, anslag). **Forskuddsskatten** i fire like terminer 15. mars, 15. juni, 15. september og 15. desember i inntektsåret (skattebetalingsloven § 10-20 første ledd, fra inntektsåret 2021), satt til fjorårets skatt og endret når året ser ut til å avvike mer enn 20 % (det første året etter et anslag på hele året); under 2 000 kr forfaller alt 15. juni. **Skatteoppgjøret** 20. juni året etter.
    - **AS:** 22 % av overskuddet; alt blir i selskapet (Jonas 27.10.2026). Forskudd i to terminer 15. februar og 15. april året etter (§ 10-20 tredje ledd), hver halvparten av sist fastsatte skatt, eller årets egen når den avviker mer enn 20 % (regnskapsføreren melder endring). Skatteoppgjøret 20. oktober året etter. Regnskapsfører 30 000 kr i året (anslag), registreringsgebyr 5 570 kr. Stiftes selskapet i løpet av året, er overskuddet fram til da enkeltpersonforetakets (`S.tx.enk`), og ENK-terminene for det går videre.
    - **Forskudd betalt før terminene** (CapteinAdrian 28.10.2026): et AS som betalte kvartalsforskudd etter reglene før 27.10.2026, har det i `S.tx.paid`. Det trekkes fra i `taxOwed` (skattekontoen), lukkes som betalt for selskapet i `txClose`, og selskapets terminer året etter tar aldri mer enn det som gjenstår av årets skatt (også i `taxPlan`). Før rettingen ville et slikt selskap ha betalt årets skatt to ganger (februar og april året etter), og skattekontoen satte av for mye. Den automatiske avsetningen følger nå skatten nedover også: står det mer på skattekontoen enn skatten som gjenstår, går resten tilbake etter neste levering.
    - **Årsskiftet** (`txClose`): årets overskudd og skatt lagres i `S.txY[år]` (`enk` og/eller `as`, med betalt og oppgjort), saldoverdiene skrives ned, og neste års forskudd settes. Skatteetaten sier fra en uke før hver betaling (`taxPlan`).
    - Skattekortet i banken viser året så langt, forskuddet og det som er betalt, de neste betalingene med dato og beløp, siste oppgjør, framført underskudd og ENK mot AS på overskuddet så langt.
    - Kildene: skattebetalingsloven § 10-20 og Skatteetatens skattebetalingshåndbok (terminene, gjengitt i søk 27.10.2026), regjeringen.no «Skattesatser 2026», Sticos (fiskerfradraget 160 000 kr for 2026), Stortingets innstilling 4 L 2025–2026. Skatteetaten og Lovdata var sperret fra arbeidsmiljøet; satsene bør sjekkes av regnskapsfører før lansering.
    - Test: `skattetest.py`.
- **Hovedboka** (Økonomi 2, Ø1, 27.10.2026; planen `docs/planer/okonomi/02-design.md`; `ACCT`, `book`, `bookAll`, `bookYear`, `bookResult`, `bookMigrate` i `core/03-simulation.js`):
  - Hver krone inn eller ut går gjennom `book(kategori, kr, tekst)` (kostnad negativ, inntekt positiv). Ingen kode skriver `S.cash -=` eller `S.stats.costs +=` lenger; et nytt kjøp eller en ny inntekt bruker `book`.
  - Kategoriene (`ACCT`): inntekter `fisk`, `tillegg` (bestillinger, innloggingsbonus, lever og rogn), `oppdrag`, `rente`, `annet` (premier, slep, drypp); kostnader `trekk`, `mannskap`, `kvote`, `diesel`, `is`, `agn`, `redskap` (også utstyr som monteres), `verft`, `havn`, `forsikring` (kasko, slep, medlemskap), `renter`, `regnskap` (AS), `land` (naust, rorbu, pub, klær); `skatt`; og utenfor resultatet `laan`, `avdrag`, `baat`, `spare`, `skattekonto`. En refusjon (avbestilt jobb) er en positiv post i kostnadens kategori.
  - `book` fører `S.stats.revenue`/`costs`/`tax` (som skatten, driftsplanens dagstall og statistikken leser), årets summer i `S.stats.y[år]` og kontoutskriften `S.ledger` (de siste 250 postene, med saldo). En levering er én post med delene (fisk, tillegg, trekk, lott, kvotesamarbeid). Like poster innen to spilltimer slås sammen (pumpas liter, havneavgiften).
  - Ved skatteoppgjøret lagres årets avskrivning og skatt (`_dep`, `_tax`) i årets summer.
  - En lagring fra før hovedboka får årets inntekter og kostnader så langt som én linje hver (`eldre_inn`, `eldre_ut`) og forskuddet som årets skatt (`bookMigrate`, første gang hovedboka brukes, også for en lagring fra skyen).
  - **Banken** har to faner (`bank()` i `ui/phone/13-mannskap-bank-meld.js`): Kontoer (brukskonto, lån, skattekortet, kontoutskriften med «Vis flere») og Regnskap (året med inntekter og kostnader per kategori, avskrivning, resultat før og etter skatt, pengene utenom resultatet, balansen; tidligere år som knapper). Rederi-appen viser årets tall og «Hele regnskapet».
  - **Rederi-appen** åpnes av flåten: AS, mer enn én båt, eller mannskap om bord (`rederiOpen`). «Stift Rederi AS» står i Neste mål til selskapet finnes, med hva AS betyr for skatten.
  - Test: `boktest.py` (kassa, kontoutskriften, årssummene og de gamle summene stemmer på krona; migreringen; bankens to faner i begge formater).
- Alle priser i spillet er per kilo **rund vekt**.

## 5.8 Bestillinger (`CUSTOMERS`, `ordersTick`)

- **Kjøpere:** Mottakene på Husøy, i Senjahopen, Gryllefjord og Botnhamn. Fiskebutikken og hotellet på Finnsnes leverer via Botnhamn. I tillegg restauranten i Senjahopen.
- **Tilbud:** Nye bestillinger kl. 06, én eller to per dag og høyst 3 åpne. Hver må besvares innen ett døgn.
- **Hva som bestilles:** Bare arter som er fangbare nå. Torsk bare hvis det er over 150 kg kvote igjen.
- **Tillegg:** Store mottak betaler 10–20 %, små kunder 20–40 %, ganget med omdømmet. Bonus ved fullført bestilling.
- **Omdømme:** Fullført gir +8, tapt frist −10. Omdømmet vektlegger hvilke kunder som bestiller.
- Fisk som oppfyller kravet går først til bestillingen når du leverer i riktig havn.
