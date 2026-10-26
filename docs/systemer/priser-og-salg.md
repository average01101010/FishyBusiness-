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
  - **Lott eller hyre** (E3, 04.10.2026, `HYRE`, `hyreAsk` og `payHyre` i `04-crew.js`):
    - Hvert mannskap kan gå på lott (som før) eller på hyre. Bytte gjøres med knappen på mannskapskortet i Rederi-appen (`cpay`).
    - **Hyre** er en fast dagslønn (`c.hyre`), betalt ved midnatt (`hourly` i `06-services.js`) for hver dag mannskapet er ansatt, også når båten ligger. Den som går på hyre, får ingen lott i `sell()`.
    - **Oppgjør når noen går i land** (Adrian 13.10.2026: mannskap ble sagt opp rett før levering, og fikk verken lott eller hyre). Oppsigelse går bare til kai (`crewAshore` i `05-phone.js`). `crewSettle(c)` i `04-crew.js` kjøres ved oppsigelse (`cfire`, `cres` fireA/fireB, `fire`) og når noen mønstrer av (`crewQuit`):
      - På lott: var de om bord da fisken i lasterommet ble tatt (`c.trip`, satt av `addCatch`), får de `c.share` av `holdNet()` med en gang: lasten priset som i `sell()` ved mottaket der båten ligger (eller det nærmeste), minus trekket. Inndragning og bonuser regnes ikke med.
      - På hyre: dagslønna for den delen av døgnet som er gått siden midnatt (eller siden de mønstret på).
      - I `sell()` får alle med `c.trip` lott, også de som har fått fri etter at fisken ble tatt. `c.trip` nulles ved levering.
    - **Hyra mannskapet ber om** er 90 % av det lotten de ønsker ville gitt i en uke med 6 000 kr om dagen i fem dager, fordelt på sju dager. Dette er et anslag, ingen tariff. Moralen følger hyra mot det de ba om, med litt ekstra fordi den er trygg.
    - **Ingen arbeidsgiveravgift** på hyre til mannskap på fiskefartøy. Produktavgiften dekker den (folketrygdloven § 23-5, Skatteetaten «Hyre til mannskap på fiske-, småhvalfangst- og selfartsfartøy», funnet med søk 04.10.2026).
    - **Ikke ennå:** Salg-fanen regner fortsatt mannskapets andel som lott for alle.
  - **Skatt og Rederi AS** (E4, 04.10.2026, `TAX`, `taxOf`, `taxTick` og `foundAS` i `03-simulation.js`, kortet «Skatt» under Regnskap i Rederi-appen):
    - **Når:** forskuddsskatt hvert kvartal (1. januar, april, juli og oktober) på året så langt (ingenting kommer tilbake før oppgjøret), og skatteoppgjøret ved nyttår. Meldingene kommer fra Skatteetaten.
    - **Overskuddet:** inntekter minus kostnader i `S.stats` siden nyttår (trekk, lott, hyre, diesel, utstyr, renter; ikke avdrag, båtkjøp eller skatten selv) minus avskrivning på 14 % av skrog og motor (saldogruppe e, `depBase`). Kvoten avskrives ikke. Underskudd føres ikke videre (forenkling).
    - **Enkeltpersonforetak** (`S.form` mangler): overskuddet er eierens inntekt. 22 % på alminnelig inntekt etter fiskerfradrag og personfradrag (114 540 kr), trygdeavgift 7,6 % (satsen for fiske og fangst; nedre grense 99 650 kr, høyst 25 % av inntekten over den) og trinnskatt (1,7 % fra 226 100, 4,0 % fra 318 300, 13,7 % fra 725 050, 16,8 % fra 980 100 og 17,8 % fra 1 467 200 kr).
    - **Fiskerfradraget** (skatteloven § 6-60): 30 % av overskuddet, høyst 160 000 kr, når du har vært på fiske minst 130 dager i året (`S.tx.days`: dager båten du er om bord i, var ute).
    - **Rederi AS** (knappen på skattekortet): 30 000 kr i aksjekapital blir stående i selskapet (aksjeloven § 3-1), og registreringsgebyret er 5 570 kr. Selskapet betaler 22 %, uten fiskerfradrag, og rundt 30 000 kr i året til regnskap (trukket månedlig; et anslag). Uttak og utbytte er forenklet bort.
    - **Kildene:** satsene er fra Stortingets skattevedtak for 2026 og vedtaket om avgifter til folketrygden for 2026, slik regjeringen.no og andre gjengir dem (funnet med søk 04.10.2026). Lovdata og Skatteetaten var sperret fra arbeidsmiljøet. Gebyret og regnskapsbeløpet er ikke sjekket.
- Alle priser i spillet er per kilo **rund vekt**.

## 5.8 Bestillinger (`CUSTOMERS`, `ordersTick`)

- **Kjøpere:** Mottakene på Husøy, i Senjahopen, Gryllefjord og Botnhamn. Fiskebutikken og hotellet på Finnsnes leverer via Botnhamn. I tillegg restauranten i Senjahopen.
- **Tilbud:** Nye bestillinger kl. 06, én eller to per dag og høyst 3 åpne. Hver må besvares innen ett døgn.
- **Hva som bestilles:** Bare arter som er fangbare nå. Torsk bare hvis det er over 150 kg kvote igjen.
- **Tillegg:** Store mottak betaler 10–20 %, små kunder 20–40 %, ganget med omdømmet. Bonus ved fullført bestilling.
- **Omdømme:** Fullført gir +8, tapt frist −10. Omdømmet vektlegger hvilke kunder som bestiller.
- Fisk som oppfyller kravet går først til bestillingen når du leverer i riktig havn.
