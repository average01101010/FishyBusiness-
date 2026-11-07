# Blind spilltest 1 (30.09.2026)

To AI-agenter som ikke kjente utviklingen, spilte Kystfiske hver for seg som vanlige spillere. Etterpå ble de intervjuet, tok en quiz og prøvde bevisst å knekke spillet. Denne rapporten sammenligner det de sa med det vi målte i skjul. Funnene er sjekket mot koden og mot kildene.

- **Runde 1:** en voksen vanlig bruker uten fiskebakgrunn.
- **Runde 2:** en erfaren kystfisker fra Troms, rundt 55 år, med sjark, juksa og garn.

Råmaterialet ligger i `docs/playtest/r1/` og `docs/playtest/r2/`: dagbok, intervju, quiz, knekkfase, målinger og kodesjekk.

## Sammendrag: de ti viktigste funnene

1. **Ruteplanleggeren spiser økta.**
   - Runde 1 brukte rundt 60 handlinger på ruta fra Finnsnes til Botnhamn, og runde 2 rundt 110.
   - Punkter kan ikke dras eller settes inn, og «Etappe N» teller punkter spilleren ikke har satt.
   - Begge etterlyste å kunne flytte punkter eller få et automatisk ruteforslag. Fiskeren kalte det «følg leia».
2. **Tre hindre i starten som begge sto fast på:**
   - Finnsnes har ikke mottak.
   - Båten starter uten is, og ingen advarer om det før avgang.
   - Båten starter uten juksa, og knappen «Ny juksa» ser ut som en erstatning.
3. **Tiden står feil overalt.**
   - Spillet går 6 ganger så fort (`GAME_RATE = 6`), men introen sier «dobbelt så fort».
   - Tempovalget heter «2× (normalt)». Testvalgene 60×/600×/3600× gir egentlig 180×/1 800×/10 800×.
   - Ruteanslaget sier at ekte tid blir 3 ganger så lang som den faktisk blir.
   - Begge testerne oppdaget avviket selv.
4. **Alvorlig feil: kjøp av elektrisk haler låser båten i havn for alltid.**
   - Verkstedjobben får ingen varighet (`undefined t`) og blir aldri ferdig.
   - Jobben kan ikke fjernes, og avgang er sperret så lenge det finnes jobber. 38 000 kr er tapt.
   - Fiskeren så «undefined t», men kjøpte heldigvis ikke haleren.
5. **Fangsten føles for liten, og fangstfeltene betyr lite.**
   - Fiskeren fikk 10 kg på 3 timer på Malangsgapet i mars. Han mener 50–150 kg er normalt med stang og pilk.
   - Årsaken er stort sett at båten fisket uten juksa, som gir 0,35 av full effekt.
   - Sirklene på kartet er bare en liten bump i tettheten. En tilfeldig hotspot rett utenfor Botnhamn ga 107 kg på 8 timer.
6. **Kaffe på kaia er mer verdt enn fisket.**
   - Fiskeren fikk 2 500 kr fra kaffekoppene og 730 kr fra fisket.
   - En uke med kaffe gir rundt 10 000 kr kontant.
   - Begge testerne kalte kaffen og pubhjulet mobilspillotteri som ikke passer inn. Fiskeren sa rett ut: «kutt ut koppe- og publoddet».
7. **Pubhjulet har to feil:**
   - Kvelden skifter kl. 21, ikke kl. 15. Det gir to runder per kveld, og ingen den første kvelden.
   - Omlasting mens hjulet snurrer tar pengene, men premien går tapt.
8. **Pengene forsvinner uten spor:**
   - Is- og juksakjøp står ikke i driftsloggen, og kaffepengene står ikke i regnskapet.
   - Sluttseddelen og kassen kan avvike med 1 kr og 1 kg.
   - Lånetallene i Marked ser ut til å ikke summere.
9. **Lånet overlever salg av båten det er pant i.**
   - Kjøp med innbytte og så tilbakebytte gir +76 500 kr i kontanter, men gjelda består.
   - Det er ikke en pengemaskin, siden nettoformuen synker med rundt 102 000 kr per runde. Likevel er det et hull.
10. **Regler, fagord og steder får toppkarakter:**
    - Fiskeren ga regler 8/10.
    - Han roste Redskap- og Kvote-appen som «ekte kystfolk-kunnskap».
    - Kvoten, stopp i maksimalkvotefisket, ferskfiskordningen, maskevidden og ordene forhale, bunkre og sluttseddel stemmer.
    - På to regler han husket annerledes, fredningstiden for kveite og minstemålet for krabbe, har spillet rett og hukommelsen hans feil (se Realisme).

## Slik ble testen gjort

- **Separate agenter:**
  - Hver tester kjørte som sitt eget Claude-program, `claude -p` med modellen Opus 5.5, i en tom mappe uten prosjektinstrukser.
  - Den eneste tillatelsen var spillerbroen `/tmp/playtest/bro` og å se skjermbildene. Alt annet ble sperret teknisk.
- **Nettbrettet:**
  - Chromium med Playwright, 1293 × 830 punkter liggende og 915 × 1208 stående, med berøring.
  - Nettleser-ID-en (user agent) var den samme som i Claude-appen på din OnePlus Pad 3.
  - Skjermstørrelsen er anslått fra målene tribunen fikk fra nettbrettet ditt, altså skjermen 1293 × 915 minus systemlinjene. Fullskjerm ble aldri målt.
- **Uten testverktøy:** Tempovalget, «Hastejobb (test)» og setningen i introen om testtempo var skjult. Spillet selv var uendret, fra commit `90f9eee`.
- **Spillklokka:**
  - Klokka sto stille mens agenten tenkte. Hvert trykk ga 2 s spilltid, som for en rask menneskespiller.
  - `vent` lot tiden gå, og `borte N` hoppet N timer fram, som å legge fra seg nettbrettet.
  - «Menneskelig tid» er derfor summen av trykk, venting og borte-tid.
- **Faser:** Normal spilling med rundt 300 handlinger, deretter intervju (48 spørsmål, 55 for fiskeren), quiz med 13 spørsmål og til slutt en knekkfase med rundt 50 handlinger. Agentene visste ikke om de neste fasene på forhånd.
- **Skjult observatør:** Spilltilstanden ble lagret for hver handling, hvert minutt og hvert femte minutt (lagringen), sammen med sidefeil og treffpunkt for trykk.

### Begrensninger, ærlig sagt

- **3D-grafikken:** Testmaskinen har ikke skjermkort. 3D ble tegnet med rundt 2 bilder i sekundet og halv oppløsning, og animasjonene gikk i sakte film. Agentene ble bedt om å se bort fra ytelse, så 3D er ikke vurdert rettferdig.
- **Stangfisket:** Nappvinduet er 1,1 s, og agenten har minst 2 s per handling. Agentene kunne derfor nesten ikke rekke nappet, og «For sent, den slapp» sier mer om testoppsettet enn om spillet. At knappen gjør ingenting mens man venter, og at nappet mangler lyd og vibrasjon, er likevel gyldige funn.
- **Tidsanslaget er optimistisk:** 2 s per trykk er raskt. En person som leser tekstene bruker lenger tid, så menneskelig tid er en nedre grense.
- **Utvalgets størrelse:** To agenter er ikke mange spillere. Funnene er gode hint, ikke statistikk. Men der begge sto fast på samme sted, er signalet sterkt.
- **Portrettformat:** Ingen av agentene snudde nettbrettet, så stående format er ikke testet.
- **Kostnad:** Rundt 8 USD for runde 1 og rundt 7 USD for runde 2, med intervju, quiz og knekkfase inkludert.

## Rundene side om side

| | Runde 1: vanlig bruker | Runde 2: erfaren fisker |
|---|---|---|
| Handlinger (spill + knekk) | 301 + 51 | 302 + 50 |
| Ekte tid for spillingen | 49 min | 34 min |
| Menneskelig tid (herav borte) | 4 t 06 (3 t 30) | 10 t 21 (9 t 57) |
| Spilltid | 24 t 48, mandag 06:00 til tirsdag 06:48 | 62 t, mandag til onsdag kveld |
| Turer og landinger | 3 turer, 1 landing | 3 turer, 2 landinger |
| Fangst og salg | 6 kg, 132 kr | 23 kg, 730 kr |
| Kontanter ved slutt | 14 840 kr (−160) | 11 183 kr (−3 817, kjøpte klær for 4 780) |
| Kaffe på kaia | 500 kr | 2 500 kr |
| Utstyr kjøpt | Is, drivstoff | Klær, is, drivstoff |
| Juksa kjøpt | Nei, bare i knekkfasen, ved et uhell | Nei |
| Mottak brukt | Botnhamn | Botnhamn |
| Grunnstøting, motorstopp, slep | Ingen | Ingen |
| Inndragning eller gebyr | Ingen | Ingen |
| Sidefeil | 0 | 0 |
| Ekte bomtrykk, utenom kart og 3D | 6 | 17, hvorav 5 fordi Kaffe på kaia dukket opp midt i ruteplanleggingen |
| Apper åpnet | Salg, Vær, Meldinger, Redskap, Kystposten | Vær, Salg, Fartøy, Kystposten, Redskap, Bank |
| Aldri oppdaget | Juksa, mannskap, lån, bestillinger, kveite, redskap i sjøen, driftsplan, tatoveringer | Det samme, men lån og båtkjøp ble funnet i knekkfasen |
| Quiz | ca. 10 av 13 | ca. 8,5 av 13 i spillet, og god fagkunnskap ellers |
| Karakterer: start, navigasjon, fiske, økonomi, regler, grensesnitt, realisme, moro | 6, 4, 5, 5, 7, 5, 7, 5 | 6, 4, 3, 5, 8, 6, 6, 4 |

### Hvor fort går progresjonen?

- **Ingen av dem kom ut av startbåten ved vanlig spill.** Begge endte i minus etter en til tre spilldager. Tiden gikk mest med til:
  - å finne mottak og is
  - å lage ruter, rundt 20–35 % av alle handlinger
  - fiske uten juksa
- **Fisket er ikke det som bærer økonomien de første dagene.** Kaffe på kaia ga mer enn fisket i begge rundene. For en ny spiller betyr det at daglig innlogging lønner seg mer enn å fiske.
- **Den raskeste lovlige inntekten** fant runde 1 i knekkfasen: sett 8 t fiske på et vilkårlig punkt nær et mottak og legg fra deg nettbrettet. Det ga 3 571 kr på rundt 1 t 20 min menneskelig tid.
  - Uten juksa tilsvarer det rundt 2 700 kr per menneskelig time.
  - Med juksa (1 900 kr) ville effekten vært 1,0 i stedet for 0,35. Da kan skiffen tjene rundt 7 500 kr per menneskelig time i skreisesongen.
  - Det er en nedre grense for hvor fort en innsatt spiller kan gå videre, men det tester vi ikke her.
- **Båtbyttet i knekkfasen** viste at en snekke kan kjøpes etter tre sluttsedler med lån og innbytte. Fiskeren kjøpte den med 9 246 kr på konto. Progresjonen kan dermed hoppe raskt når banken først er låst opp.

## Funn, sortert etter type

Status: **Bekreftet feil** er sjekket i koden. **Design** betyr at det virker som kodet, men ikke er forklart. **Misforståelse** betyr at testeren tok feil.

### A. Feil i koden

| # | Funn | Alvor | Hvor |
|---|---|---|---|
| A1 | Kjøp av elektrisk haler gir en verkstedjobb uten varighet. Båten blir låst i havn for alltid, og 38 000 kr går tapt. Utstyr-appen viser «Kjøp og monter · undefined t». | Kritisk | `FIT_H` i `ui/05-phone.js:31` mangler halerne. `until` blir NaN i `core/06-services.js:163`. |
| A2 | Tiden står feil: introen, «2× (normalt)», testvalgene 60×/600×/3600× og ruteanslaget `dur(e.hours / 2)`. Alt er skrevet for 2×, men spillet går 6×. | Høy | `01-i18n.js:3,42`, `index.html:23`, `07-guide.js:81` |
| A3 | Pubhjulet: kvelden skifter kl. 21, ikke kl. 15, fordi `EPOCH` er kl. 06. Det gir to runder per kveld og ingen den første kvelden. | Middels | `core/03-simulation.js:305` |
| A4 | Pubhjulet: premien trekkes først etter 4,4 s. Omlasting mens hjulet snurrer tar pengene, men premien går tapt. | Middels | `ui/09-hand-fishing.js:25–35` |
| A5 | «Ny juksa» trekker 1 900 kr uten pris, uten bekreftelse og uten logg. Knappen ser ut som en erstatning, men båten starter uten juksa. Fiske-fanen sier «mistet, kjøp ny i havn». | Høy | `10-daily-coffee.js:142`, `08-actions.js:48`, `07-guide.js:118` |
| A6 | Kjøp av is og juksa står ikke på driftssiden. Kaffepengene går ikke inn i regnskapet. | Middels | `07-harbours.js:197`, `10-daily-coffee.js:30,74` |
| A7 | Sluttseddelen avrunder hver linje og totalen hver for seg, og kassen får den uavrundede summen. Det gir avvik på ±1 kr og ±1 kg. | Lav | `07-guide.js:240,245`, `08-actions.js:129–131` |
| A8 | Minsteprisen for lange er 13,57, men priskortet viser «14» mens dagens pris vises med én desimal (13,9). | Lav | `05-phone.js:153` |
| A9 | Statusfeltene «Gjør klar kranen» og «Veier inn · seddel» har samme pilleform og peker som knappene. | Middels | `styles.css:71` |
| A10 | Tipset «Start med å trykke på sjøen nord i Gisundet» vises ved tom rute i alle havner. | Lav | `07-guide.js:68` |
| A11 | Kameraet går inn i kaier, kraner og bropilarer. Det holdes bare over terreng og sjø. | Middels | `view3d.js:2121` |
| A12 | «Etappe 2 krysser land» kan komme fra et innseilingspunkt som legges inn automatisk uten fri sikt til neste punkt. Punktet spilleren trykket, lå i sjøen. | Middels | `core/07-harbours.js:78` (`exitWps`) |
| A13 | Blødningsvalget virker ikke. `addCatch` setter alltid `bled=true`, og `settings.bleed` brukes aldri. | Lav | `05-vessels.js:269` |
| A14 | Ryktekoppen i Kaffe på kaia viser «0 kr». | Lav | `10-daily-coffee.js:35` |
| A15 | Oddslinja i pubhjulet utelater «tomhendt 53 %», som overleveringen sier skal vises. | Middels | `09-hand-fishing.js:21` |

### B. Start og veiledning (begge sto fast)

- **Finnsnes har ikke mottak eller is**, og det sies ingen steder.
  - Introen sier «lever fangsten på et mottak».
  - Veiledningen sier «avslutt ruten ved å trykke på en havn», og det omfatter Finnsnes.
  - Begge kom hjem med fisk de ikke fikk solgt.
- **Is:** Båten starter med 0 is, og ruten og avgangen advarer ikke. Første beskjed kommer på sjøen: «Tom for is. Fangsten ises ikke.»
- **Juksa:** Båten starter uten juksa, og bare stanga fisker (effekt 0,35). Ingen av testerne skjønte at de manglet det viktigste redskapet. Det er hovedgrunnen til at fangsten føltes for liten.
- **«Neste mål»** ble ikke funnet i runde 1. Runde 2 fant det først i knekkfasen, under Fartøy › Marked. Det er for godt gjemt.
- **«Redskap: nei»** på veipunktene skjønte ingen av dem. Uten redskap i sjøen finnes det bare ett valg, og trykket gjør ingenting.
- **Kulde −24 % · −7 °C** mot −2 °C på telefonen:
  - Prosenten er straffen på fangstfarten.
  - −7 °C er vindkjølingen, og −2 °C er lufttemperaturen.
  - Fiskeren skjønte det først i Utstyr-appen, og brukeren skjønte det aldri.
- **Kaffe på kaia dukket opp midt i ruteplanleggingen** og stjal trykk (runde 2).

### C. Ruteplanleggeren

- Punkter kan bare legges til på slutten. De kan ikke dras eller settes inn. Angre, slett og tøm er alt som finnes.
- Trykk på land virker ofte tause. Meldingen «Det er land» finnes, men den forsvinner når trykket snapper til en havn, tolkes som panorering eller treffer AIS, eller når en annen melding overskriver den.
- Havnene legger inn innseilingspunkter automatisk. Da flytter nummereringen seg, og «Etappe N» blir uklar.
- «Kast loss»-knappen flytter seg nedover når lista vokser.
- Begge savnet automatisk rute. Fiskeren: «Ekte kartplotter har autorute.»
- Advarslene ble rost: rødt ved land, gult ved skjær, og sikker dybde mot dypgang. «Hjem samme vei» og «Lagre som fast driftsplan» ble også satt pris på.

### D. Fiske og balanse

- **Fangst (design, ikke forklart):**
  - Fangstfeltsirklene er en bump på 0,45 i tettheten. Hotspoten (0,3–1,8, flytter seg hver 120. time), dybde, eksponering og bestand betyr mer. Malangsgapet starter delvis nedfisket.
  - En spiller som stoler på sirklene, blir skuffet. Kartet bør si at de er hint, eller sirklene bør vekte mer.
- **Fiskerens tall:** 50–150 kg på 3 timer med stang eller pilk på Malangsgapet i mars. Spillet gir rundt 5 kg/t uten juksa og rundt 15 kg/t med håndjuksa. Kalibreringen bør sjekkes mot fiskerens tall. De er erfaringstall fra én person, ikke statistikk.
- **Is og kvalitet (misforståelse):**
  - Fisk uten is falt fra E til A, og en tredjedel til B. Det er rundt 10 % lavere pris.
  - Fiskeren trodde han fikk full pris, fordi A regnes som «full pris».
  - Trekket bør vises på sluttseddelen, for eksempel «uten is: −x kr».
- **Kaffe på kaia og pub:**
  - Kaffen gir i snitt rundt 400 kr per dag, pluss premiene for dag 3 og dag 7 og milepæler på opptil 100 000 kr. Det er mer enn fisket de første dagene.
  - Pubhjulet koster 1 000 kr, og 53 % av rundene gir ingenting. Premiene er haill, som ellers selges for 19–59 kr i ekte penger.
  - Det holder seg innenfor kapittel 7 bare fordi kroner i spillet ikke kan kjøpes for ekte penger.
  - Begge testerne kalte det lotteri, og fiskeren mente det bryter med stemningen.
- **Banken:**
  - Tre sluttsedler låser opp lån, og enhver landing teller, også 6 kg fra havna i kuling.
  - Lånet står igjen etter salg og innbytte, og `takeLoan` sprer hele saldoen over 120 nye måneder.
  - Tallene i Marked blander «lån ved dagens kontanter» med «minste egenkapital», og reserven på 5 000 kr vises ikke.
- **Fiske bruker aldri drivstoff.** Bare seiling gjør det.

### E. Realisme (den erfarne fiskeren)

**Stemmer:**
- været og bølgene, og vurderingen av båtens grense på 1 m
- prisene for torsk (59), hyse (26) og sei (22), og drivstoff til rundt 24 kr/L
- 16 knop og 0,6 L/nm for en 19-foting med 60 hk
- kvoten i åpen gruppe, stoppen og ferskfiskordningen
- maskevidden 156 mm, garnlenker, marflo og at garn krever to om bord
- stedene
- fagordene forhale, bunkre, sluttseddel og stamp

**Skurrer:**
- fangstmengdene i skreisesongen
- at «juksa» brukes om stang (på sjarken sier man stang eller pilk, mens juksa er snøret eller maskinen)
- at 700 kroker per stamp hyseline er mye (han hadde 400–500)
- lotterielementene
- at minsteprisen for kveite 5–20 kg er høyere enn for 40–60 kg (han var usikker)

**Kontrollert mot kilder:**

| Påstand | Resultat | Kilde |
|---|---|---|
| Tidevannet i Finnsnes er bare ±0,4 m | Misforståelse. Modellen har M2 0,86 m og S2 0,31 m, som gir rundt 2,3–2,8 m ved springflo. Han leste «Nå +0,4 m over middelvann» som hele forskjellen. Telefonen bør vise dagens høy- og lavvann med høyde. | [Kartverket](https://www.kartverket.no/en/at-sea/se-havniva/tides-and-water-level) |
| Kveita er fredet 20.12–31.3 | Spillet har rett. Fredningen ble utvidet til 20.12–20.4 fra 2025 og gjelder også i 2026. | [Dykking.no](https://www.dykking.no/nyheter/6460-utvider-fredning-av-kveite), [Fiskeridirektoratet, høring 2026](https://www.fiskeridir.no/hoeringer/horing-av-forslag-til-regulering-av-fisket-etter-kveite-i-2026/_/attachment/inline/1f80a73b-254a-456c-af85-0da274eef1ea:72d58117e50daa7def0de8409f8a3ddc8fb9df74/H%C3%B8ringsnotat%20-%20Regulering%20av%20fisket%20etter%20kveite%20i%202026.pdf) |
| Minstemålet for krabbe er 11 cm nord for Stad | Spillet har rett med 13 cm nord for 59°30' N. Fiskeren husket grensen som gjelder sør for den. | [Lovdata, høstingsforskriften kap. X](https://lovdata.no/dokument/SF/forskrift/2021-12-23-3910/KAPITTEL_10), [Havforskningsinstituttet](https://www.hi.no/hi/nyheter/2023/januar/har-undersokt-taskekrabbe-langs-hele-kysten) |
| Ordet heter «hail», ikke «haill» | Begge skrivemåtene brukes. Wikipedia oppgir «hald, hall, haill eller vadhald». Spillets skrivemåte kan stå. | [Wikipedia: Haill](https://no.wikipedia.org/wiki/Haill), [NRK](https://www.nrk.no/tromsogfinnmark/vil-forske-pa-om-_haill_-gir-bedre-fiskelykke-_-soker-frivillige-fiskere-1.14436120) |
| Minsteprisene for kveite etter størrelse | Ikke kontrollert i denne runden. Må sjekkes mot Råfisklagets gjeldende liste. | Råfisklaget |

### F. Utnyttelse (knekkfasene)

| Funn | Gjenskaping | Vurdering |
|---|---|---|
| Latmannsfiske nær mottak | Én rute med ett punkt ved havna og 8 t fiske, så `borte`. Ga 107 kg og 3 571 kr uten innsats. | Design. Tallene er plausible, men gjør fangstfeltene overflødige. |
| Fiske i havna i kuling | Ett punkt rett utenfor kaia, 2 t fiske. Bølgene var 0,4 m, fisket brukte 0 L, og det ga en sluttseddel. | Design. Det er skjerming uten vindretning og ingen grense for fiske i havn. Det låser opp banken billig. |
| To pubrunder per kveld | Spinn før kl. 21 og igjen etter kl. 21. | Feil A3 |
| Omlasting under hjulet | Pengene er trukket, premien går tapt. | Feil A4 (taper for spilleren) |
| Kjøp med innbytte og tilbakebytte | +76 500 kr i kontanter, mens lånet består. | Designhull, ikke profitt (−102 000 kr netto per runde) |
| Kjøp av is flere ganger | 50 kg per trykk, opptil 150 kg, uten mengde eller pris i handlingslinja. | Design. Vis mengden. |
| Omlasting i knekkfasen | Beholdt all tilstand, og kaffen ga ikke ny premie. | Robust |

Sperrene holdt: ruter over land ble stoppet, fisketiden stopper på 8 t, bunkringen betales med en gang, og et dobbeltrykk på Fyll trakk ikke penger to ganger.

### G. Grensesnitt

- **Telefonen:** Den ble rost for å være ryddig. Den åpner siste app i stedet for hjemskjermen, og det forvirret begge.
- **Knapper uten pris:** «Ny juksa» og «Kjøp is» mangler pris, mens «Kveiteutstyr (2 490 kr)» har det.
- **Den grå pubknappen** er bare en blek gullknapp og ser fortsatt aktiv ut.
- **Nappet i stangfisket** har verken lyd eller vibrasjon. Knappen «Rykk» gjør ingenting mens man venter på napp, men det skjønte ingen.
- **Fiskekartet** er låst uten forklaring på hvorfor og hvordan det låses opp. Det krever kartplotter til 24 900 kr.
- **Pinch-zoom** sentrerte ikke der fingrene var (runde 2).

## Fortelling mot målinger

- **Runde 1** sa at den ikke hadde juksa og ikke visste det. Målingen bekrefter det: `gear:false` hele spillet, helt til den kjøpte juksa ved et uhell i knekkfasen.
- **Runde 2** trodde han fikk full pris for fisk uten is. Fisken falt fra E til A, og en del til B, men sluttseddelen viser ikke trekket.
- **Begge** sa de ikke fikk inndragning eller gebyr. Det stemmer med målingene: ingen meldinger om inndragning og ingen kvote nær grensen.
- **Runde 1** ga regler 7 og runde 2 ga 8, men ingen av dem møtte fjordlinja, kveita, bifangst eller hvile. Karakteren gjelder det de leste i appene, ikke det de møtte på sjøen.
- **Selvvurderingen i quizen var godt kalibrert.** Høy sikkerhet og riktig svar på det de hadde lest (kvote, stopp, ferskfisk, garn, egning). Lav sikkerhet på kveite, fjordlinja og været, og der gjettet de.
- **Pubhjulet:** Runde 1 sa i intervjuet at den ikke så pub eller haill. Den oppdaget puben først i knekkfasen, da den lette bevisst.

## Forslag til tiltak (prioritert)

1. **Fiks feil A1 (haleren) straks**, og la verkstedet håndtere NaN og ukjent varighet. Gamle lagringer med en slik jobb må reddes ved oppstart.
2. **Rett tiden overalt (A2):**
   - Skriv «6 ganger så fort» i introen og «6× (normalt)» på tempovalget. Alternativt kan `GAME_RATE` settes til det teksten sier, men det endrer balansen.
   - Rett testvalgene og ruteanslaget.
3. **Start uten feller:**
   - La velkomsten si at Finnsnes ikke har mottak, og nevn Botnhamn som nærmeste.
   - Gi skiffen litt is fra start, eller advar ved «Kast loss» når isen er 0.
   - Gjør «Ny juksa» til «Kjøp håndjuksa (1 900 kr)» med en kort forklaring, og vurder å gi juksa fra start.
4. **Ruteplanleggeren:**
   - Gjør det mulig å dra punkter og sette inn punkter på en etappe.
   - Nummerer etappene etter punktene spilleren ser.
   - Vis alltid hvorfor et trykk ble avvist.
   - Vurder «følg leia» mellom to havner, basert på de kjente innseilingene og `legClear`.
5. **Balanser Kaffe på kaia og puben:**
   - Kutt kontantpremiene kraftig, eller bytt dem mot ting som is, agn og rykter.
   - Vurder å fjerne pubhjulet eller gjøre det gratis og sjeldent.
   - Vis «tomhendt 53 %» (A15).
   - Rett A3 og A4.
6. **Pengespor:** Logg alle kjøp og kaffepremier (A6), rett avrundingen (A7), vis minsteprisen med to desimaler (A8), og vis isen i HUD-en og trekket for manglende is på sluttseddelen.
7. **Lån:**
   - La salg og innbytte innfri lånet på båten som selges, eller krev at det flyttes.
   - Vis «du trenger X kr, pluss 5 000 i reserve».
   - Ikke start 120 nye måneder ved hvert nytt lån.
8. **Fangstfeltene:** Gi sirklene større vekt eller en tekst som sier at fisken flytter seg. Sjekk kalibreringen mot fiskerens tall for skrei med stang og juksa.
9. **Mindre ting:**
   - Status skal ikke se ut som knapper (A9).
   - Rett tipset som henger igjen (A10) og kamerakollisjonen (A11).
   - Rett `exitWps` så den ikke lager et ugyldig punkt (A12).
   - Sløyfe eller koble blødningsvalget (A13).
   - Vurder hjemskjermen som standard på telefonen.
   - Forklar kulde-prosenten i HUD-en.
10. **Neste spilltest:**
    - Mål fullskjermformatet på nettbrettet ditt.
    - Test stående format.
    - Gi agenten en «reager raskt»-kommando for stangfisket, eller vurder det bare med et menneske.
    - Kjør en runde der agenten får et klart mål, for eksempel å kjøpe den første juksamaskinen, for å måle progresjonen direkte.

## Filer

- **Rådata per runde** (`docs/playtest/r1/` og `r2/`):
  - `dagbok.txt`, `intervju.md`, `quiz.md` og `knekk.md`
  - `maalinger.json` fra `tests/playtest/analyze.py`
  - `kodesjekk.md`
- **Skjermbilder i `docs/playtest/`:**

  | Fil | Viser |
  |---|---|
  | `r1-rute-23-punkter.jpg` | Ruta til Botnhamn |
  | `r1-levering-kamera-status.jpg` | Kameraet inne i krana, statusfeltet som ser ut som en knapp og «Ny juksa» uten pris |
  | `r1-kaffe-paa-kaia.jpg` | Kaffe på kaia |
  | `r1-pubhjul.jpg` | Pubhjulet |
  | `r2-marked-laan.jpg` | Lånetallene i Marked |
  | `r2-innbytte-tilbake.jpg` | Tilbakebyttet som gir −76 500 kr |
  | `r2-kaffe-over-plotter.jpg` | Kaffe på kaia over kartplotteren |
  | `r2-rute-gisundet.jpg` | Ruta gjennom Gisundet |

- **Verktøy (`tests/playtest/`):**
  - `harness.py` er spillerbroen og observatøren, og `bro.py` er kommandoene.
  - `run_agent.sh` og `agent-env.sh` starter den blinde agenten.
  - `ticker2.sh` oppdaterer tribunen, og `analyze.py` lager målingene.
  - `prompts/` inneholder instruksene, og `quiz-fasit.md` er fasiten.
- **Timelapse** av begge rundene, 6 bilder i sekundet, ligger på tribunen: https://claude.ai/artifact/UE47UWuKgc9madso1Eb9wQ
