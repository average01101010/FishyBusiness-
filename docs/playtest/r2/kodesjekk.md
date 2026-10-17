# Kodesjekk av funnene fra runde 2 (Explore-agent, 30.09.2026)

Stier er relative til `src/`. Tallene er sjekket ved å kjøre kjernefilene i minnet med node.

1. **Visningsfeil, men regnestykket er riktig. Lån og egenkapital i Marked.**
   - Formelen står i `deal()` (ui/05-phone.js:212), og kjøpet sjekkes likt (:509):
     - `cost = price − ti`
     - `eqNeed = max(0, 0,2·price − ti)`
     - `loanNeed = max(0, cost − max(0, cash − 5000))`
   - Kjøpet godtas hvis `cash ≥ cost`, eller hvis `loanNeed ≤ 0,8·price && cash ≥ eqNeed && salg ≥ 3`.
   - Teksten viser «lån» og «egenkapital» ved siden av hverandre, men de er ikke en oppdeling av prisen:
     - «lån» er det som mangler med dagens kontanter når 5 000 kr holdes i reserve.
     - «egenkapital» er minstekravet.
   - Skiffen står med lån 89 817 kr. Det er 94,5 % av prisen, så knappen er grå.
   - Det reelle kravet er egenkapital + 5 000 kr, men reserven vises ikke.
   - Kjøpet med innbytte var riktig. Innbyttet på 66 500 kr er over kravet på 49 000 kr, og lånet på 174 254 kr er 71 % av 245 000.
2. **Designhull, ikke en pengemaskin.**
   - Innbytteverdien er 0,7 × prisen, pluss 0,5 × motor90 og 0,95 × kvote (core/03-simulation.js:26). For snekka blir det 171 500 kr.
   - Å bytte tilbake gir +76 500 kr i kontanter, men `S.loan` blir stående. Én runde koster 102 000 kr i nettoformue.
   - Hullet er at lånet «mot pant i båten» overlever salg og innbytte, også via `vsell` (:524). I tillegg sprer `takeLoan` (:462) hele saldoen over 120 nye måneder.
3. **Drivstoffet er en tilfeldighet, og navnet er et designvalg.**
   - Ny båt får 40 % tank, altså 220 × 0,4 = 88 L. Bensinen i den gamle går tapt uten refusjon, og isen settes til 0.
   - Navnet beholdes med vilje.
   - Lasten tømmes ikke ved bytte og kan bli større enn den nye båten har plass til.
4. **To feil og et designproblem i pubhjulet.**
   - **Kveldsgrensen:** `pubEvening` = `floor((H−15)/24)` (core/03-simulation.js:305), men `EPOCH` er kl. 06:00. Kvelden skifter derfor kl. 21:00, og det blir én runde kl. 15–21 og en ny kl. 21–03. Samme forskyvning stenger puben den første kvelden (`pubE:-1`).
   - **Omlasting:** `spin` trekker pengene og lagrer, men premien trekkes og brukes først etter 4,4 s (ui/09-hand-fishing.js:25–35). Laster man inn på nytt i mellomtiden, er pengene borte og premien tapt.
   - **Knappen:** Den er riktig grå når runden er brukt, men den grå stilen er bare `opacity:.45` på gull, og teksten inviterer fortsatt til kjøp.
5. **Alvorlig feil. Haleren låser båten.**
   - `FIT_H` (ui/05-phone.js:31) mangler de fire halerne, så etiketten viser «undefined t».
   - Kjøper man en haler, legges det inn en verkstedjobb med `h` = undefined, og `until` blir NaN. Jobben blir aldri ferdig, og den første jobben kan ikke fjernes.
   - `start` og `depnow` nekter så lenge det finnes jobber. Båten blir stående i havn for alltid, og 38 000 kr er tapt.
   - Ingen av testerne kjøpte haler.
6. **Misforståelse om isen.**
   - Fisk uten is taper 3,0 poeng i timen, mot 0,9 med is. 13 kg uten is falt fra E til A, og en tredjedel til B, rundt 10 % under iset fisk.
   - Klassene er E ≥85, A ≥65, B ≥40, X ≥15, ellers V. Prisfaktorene er E 1,05, A 1,00, B 0,85 og X 0,6. «Full pris» er altså A.
   - **Feil som dukket opp i sjekken:** `addCatch` setter alltid `bled=true`, og innstillingen `settings.bleed` brukes aldri. Blødningsvalget har ingen virkning.
7. **Design. Fiske i havna i kuling.**
   - Bølgene er `hsOpen × eksponering^1,3` fra et rutenett på 500 m uten vindretning. Botnhamn har eksponering 0,21, så 3 m blir 0,39 m.
   - Ingenting stopper fiske i havneområder. Lav eksponering gir bare lavere tetthet, 0,68 av åpent farvann for torsk.
   - Fiske bruker aldri drivstoff, bare seiling gjør det.
   - Banken krever at `S.sales.length >= 3`, og enhver landing teller.
8. **Ruteplanleggeren.**
   - **Misforståelse:** Trykk i panelet kan ikke gå gjennom til kartet. Det var trolig et bomtrykk ved zoomknappene, som ligger 12 px fra panelet.
   - **Feil:** «Etappe 2 krysser land» kom fra `exitWps` (core/07-harbours.js:78). Den legger inn Botnhamns innseilingspunkt nordøst for havna også når det ikke er fri sikt til målet. Punktet spilleren trykket, lå i sjøen.
9. **Design (balanse). Kaffe på kaia.**
   - Premien kan hentes én gang per kalenderdato. Tabellen:

     | Dag | Premie |
     |---|---|
     | 1 | Kar |
     | 2 | Is |
     | 3 | Rykte + 1 500 kr |
     | 4 | 30 L |
     | 5 | Pubrunde |
     | 6 | Skrog |
     | 7 | Kasse på 6 000–20 000 kr |

   - Koppene: 40 % 500 kr, 20 % 1 000 kr, 15 % is, 15 % rykte og 10 % ingenting. Forventet verdi er 400 kr per henting.
   - Milepælene gir 10 000, 25 000, 50 000 og 100 000 kr.
   - En uke gir rundt 10 000 kr kontant, mot 730 kr fra fisket i runde 2.
   - Kosmetisk feil: ryktekoppen viser «0 kr».
   - `borte` flytter også kalenderen, slik en ekte pause over midnatt gjør.
10. **Design. Stangfisket.**
    - Nappet blir til «For sent» etter 1,1 s.
    - Knappen er grå i 1,6 s spilltid. På en treg maskin blir det lenger, fordi `phase` øker med høyst 0,1 s per bilde.
