# Økonomi 2: gjennomgang av spillets økonomi mot virkeligheten (27.10.2026)

> Oppdraget (Jonas 27.10.2026): se over in-game-økonomien, skattesystemet for ENK og Rederi AS mot virkeligheten, hvordan spilleren beskattes, hvordan mannskapet lønnes, inntekter og kostnader. Målet er et system som er realistisk og forståelig på en intuitiv måte. Jonas nevnte selv ulike bankkontoer (skatt, sparing). Dette er gjennomgangen med funn og forslag. **Ingenting er bygd.** Spørsmålene til Jonas står nederst, og den konkrete planen (`02-design.md`) lages når de er besvart.
>
> Kildene i koden: `TREKK`, `MVA`, `TAX`, `taxOf`, `taxTick`, `foundAS`, `LOANS`, `deal` i `core/03-simulation.js`; `HYRE`, `hyreAsk`, `payHyre`, `holdNet`, `crewSettle` og trivselen i `core/04-crew.js`; `sell()` i `ui/08-actions.js`; `hourly()` i `core/06-services.js`; `KASKO` i `core/16c-hull.js`; Rederi-appen i `ui/phone/11-rederi.js`, banken og mannskapssiden i `ui/phone/13-mannskap-bank-meld.js`, Foretaket i `ui/phone/08-home-papers-merker.js`. Dokumentasjonen: `docs/systemer/priser-og-salg.md` (5.4, E1–E4), `docs/systemer/folk-om-bord.md` (5.6), `docs/systemer/baater.md`.

## 1. Slik er det i dag

**Pengene.** Én kasse, `S.cash`, som er rederiets og spillerens på én gang. Startkapital 15 000 kr. Kassa kan bli negativ (HUD-en viser rødt, bunkring sperres), uten rente eller annen følge. Ingen privatøkonomi: spilleren tar aldri ut lønn, og det som er igjen etter skatt, er bare «kassa».

**Inntekter.** Sluttseddelen (`sell`): fisk etter minstepris/markedspris × klasse × kvalitet, lever og rogn, bestillingstillegg (10–40 %), innloggingsbonusen (prosent av fiskeverdien), oppdrag (`09g-turer.js`), festivalpremier, pubquiz, slep av andre spillere. Alt føres i `S.stats.revenue` (pub og festival i egne felt).

**Trekk på seddelen.** Råfisklagets ekte trekk (`TREKK`): lagsavgift 0,43 %, så pensjonstrekk 0,4 %, produktavgift 1,6 %, forskningsavgift 1,35 %, ressursavgift 0,42 %, kontrollavgift 0,22 % over 15 m. MVA 11,11 % legges på og går «videre til staten» (netto null) når salget har passert 50 000 kr på tolv måneder; da blir fisket et ENK i Enhetsregisteret.

**Mannskapet.** Hver person ber om en lott på 7–20 % av netto (etter trekkene, ikke etter felleskostnader) og får den ved hver levering. Alternativt hyre: fast dagslønn, 90 % av det lotten ville gitt i «en uke med 6 000 kr om dagen i fem dager», betalt hver midnatt også når båten ligger. Trivselen måler ukesinntekten mot den samme faste forventningen (`c.ask × 6 000 × 5`), uansett båt. Oppgjør når noen går i land (`crewSettle`). Salg-fanen regner fortsatt alle som lott (kjent hull, E3). Mannskapet sparer 25–40 % av lotten sin til egen båt (`14-crewlife.js`).

**Kostnader.** Diesel (14,50 kr/l, fiskefartøy uten avgifter), bensin, is, agn, redskap og vedlikehold (`10-gear.js`, `10b-gearcare.js`), motorservice og verftsjobber, kasko (2,5 % av båtprisen i året, trukket månedlig), rorbu (150 kr natta), pub, klær, maling, naustoppgraderinger, lån (renter som kostnad, avdrag ikke), regnskap for AS (30 000 kr i året), hyre og lott. Alt i én sum, `S.stats.costs`, uten kategorier. Et «skippertillegg» på 5 % når mannskapet leverer uten deg finnes bare i den gamle planen (`06d-drift.js`), ikke i Driftsplan 2.

**Lån.** Kystbanken 6,9 % over 10 eller 15 år, inntil 80 % av prisen, og lånene samlet innenfor 80 % av flåtens verdi. Innovasjon Norge topper det første kjøpet i lukket gruppe med 15 % til 8,9 %. Innfris ved salg og innbytte. Innbetaling 10 000 kr om gangen eller alt.

**Skatt** (`TAX`). Overskuddet = inntekter − kostnader siden nyttår − saldoavskrivning 14 % av skrog og motor. ENK: 22 % av (overskudd − fiskerfradrag − personfradrag 114 540), trygdeavgift 7,6 % (nedre grense 99 650), trinnskatt i fem trinn. Fiskerfradrag 30 %, høyst 160 000, etter 130 dager på sjøen. AS: 22 % flatt, ingen fiskerfradrag, 30 000 kr i regnskap. Forskuddsskatt 1. januar, april, juli og oktober på året så langt, oppgjør ved nyttår. Underskudd føres ikke videre. Skatten føres i `S.stats.tax`, **som ikke vises noe sted**. «Stift Rederi AS» koster 5 570 kr i gebyr (aksjekapitalen på 30 000 sjekkes, men blir i kassa) og åpner Rederi-appen.

**Hva spilleren ser.** HUD: kassa. Rederi-appen: Konto, Inntekt i dag, Regnskap (inntekter, kostnader og resultat siden spillets start, lånene, balanse). Banken (skuff): Brukskonto, lånene, det samme regnskapet én gang til, skattekortet (overskudd så langt i år, dager på fiske, «skatt som ENK» mot «skatt som AS», forskudd betalt, knappen Stift Rederi AS). Papirer: Foretaket (form, org.nr., MVA). Sluttseddelen og Salg-fanen: linjer, trekk, lott, netto til kassa.

## 2. Funn: der spillet avviker fra virkeligheten

Satsene for 2026 er fra søk 04.10.2026 og må sjekkes mot Skatteetaten før lansering (`docs/lansering.md` sier det samme). Det som er mer enn et tall:

1. **AS er alltid billigst, og det er feil.** I virkeligheten betaler et AS 22 % av overskuddet, men eieren får ikke pengene før de tas ut: som lønn (skattlegges som lønn hos eieren) eller som utbytte (22 % × oppjustering 1,72 = 37,84 % hos aksjonæren etter skjerming). Samlet skatt på utbytte er rundt 51,5 %. Grunnen til at fiskere likevel velger AS, er at overskudd som blir stående i selskapet (til ny båt, kvote) bare koster 22 %, pluss begrenset ansvar. Spillet forenkler bort uttak og utbytte, så AS blir 22 % flatt mot ENKs opptil rundt 47 % + 7,6 %. Skattekortet sammenligner de to rett ut, og «Neste mål» ber spilleren stifte AS. Siden spilleren ikke har noen privatøkonomi, finnes ikke forskjellen mellom «penger i selskapet» og «penger til meg» i spillet i det hele tatt. Dette er det største avviket, og valget om privatøkonomi avgjør hvordan det løses (spørsmål 1 og 2).
2. **Lotten regnes før felleskostnadene.** Lottsystemet på kysten: brutto fangstverdi minus trekkene og turens felleskostnader (drivstoff, agn, is, proviant) gir delingsfangsten, som deles mellom båten (båtlott) og mannskapet (mannslotter, skipperen ofte 1,5). I spillet får mannskapet sin prosent av netto etter trekk, og eieren bærer diesel, is og agn alene. Dokumentet sier selv at dette er en antakelse. Å trekke turens felleskostnader først er både riktigere og mer forståelig: da står det på seddelen hva turen kostet.
3. **Forskuddsskatten.** Et ENK betaler forskuddsskatt i fire terminer (15. mars, 15. mai, 15. september, 15. november) etter forventet inntekt (fjorårets), og skatteoppgjøret kommer i juni–oktober året etter, med restskatt eller tilgode. Spillet trekker kvartalsvis på «året så langt» og gjør opp 1. januar. Det er forståelig, men ikke det spillerne kjenner igjen fra livet. Underskudd føres ikke videre; i virkeligheten gjør det det (og i ENK mot annen inntekt).
4. **Personinntekten i ENK** regnes i virkeligheten etter foretaksmodellen (overskudd minus skjermingsfradrag) før trygdeavgift og trinnskatt. Skjermingen er liten for en sjark (3–4 % av skjermingsgrunnlaget), så forenklingen er grei. Nevnes bare for ærlighetens skyld.
5. **Mannskapets forventning er fast.** 6 000 kr om dagen i fem dager gjelder på skiffen og på 21-meteren. En dekksmann på en kystbåt i skreisesongen tjener i virkeligheten 1 500–3 000 kr dagen, en på en jolle ingenting i nærheten. Når forventningen ikke skalerer, blir trivsel og hyre feil i begge ender av stigen.
6. **Leid skipper.** Går båten uten deg (Driftsplan 2), fører den sjøvante roret til vanlig lott. I virkeligheten får skipperen mer (1,5 lott eller skipperlott). Det gamle skippertillegget på 5 % forsvant med Driftsplan 2.
7. **Kostnader som mangler** (små, men de ville gjort regnskapet ekte): havneavgift/kaileie for liggeplassen (noen tusen i året), ansvarsforsikring og yrkesskadeforsikring for mannskapet (pliktig for folk på hyre), regnskapsfører også for ENK (10–20 000 kr i året, mot 30 000 for AS), proviant (måltidene om bord koster ingenting nå), Fiskeridirektoratets gebyrer. Sjøfartsdirektoratets fartøyinstruks (8–15 m, kontroll hvert 30. måned) hører til sikkerhetsplanen SK1–SK6.
8. **Motoren kostnadsføres og avskrives dobbelt.** Utstyrskjøp går rett i `S.stats.costs` ved kjøpet (`14-act.js`, `equip`: fullt fradrag samme år), og `depBase` legger i tillegg halve prisen på `motor90` (148 000 kr) til avskrivningsgrunnlaget, så den trekkes to ganger. Sjekket 27.10.2026. I virkeligheten avskrives utstyr over 30 000 kr (saldogruppe d, 20 %). Liten sak.
9. **Aksjekapitalen** på 30 000 blir i kassa (bare gebyret trekkes). Ufarlig, men meldingen sier den «blir stående i selskapet».

## 3. Funn: der spillet er vanskelig å forstå

1. **Skatten er usynlig til den slår.** Ingen avsetning, ingen advarsel før terminen, ingen sum å se. `S.stats.tax` vises ikke, så «Resultat» i Regnskap er før skatt, og spilleren kan ikke finne ut hva skatten har kostet uten å bla i Meldinger. En god skreisesong gir et stort trekk 1. april rett i kassa, kanskje til minus.
2. **To overskudd uten forklaring.** Regnskap viser inntekter og kostnader siden spillets start (livstid), skattekortet viser «overskudd så langt» i år med avskrivning. Tallene stemmer ikke med hverandre, og avskrivningen står ingen steder som linje.
3. **Kassa og resultatet går hver sin vei.** Avdrag og båtkjøp tar penger uten å være kostnad (riktig), men ingenting forklarer det. Det mangler en kontoutskrift eller en kontantstrøm («hvor ble pengene av?»).
4. **Kostnadene er én sum.** Uten kategorier (diesel, is og agn, redskap, mannskap, verft, forsikring, renter, avskrivning, skatt) kan ingen se hva som koster. Et regnskap per år med kategorier er det mest lærerike spillet kan vise.
5. **Samme regnskap to steder** (Rederi og Bank), tre navn på det samme beløpet (kassa i HUD, «Konto», «Brukskonto»).
6. **MVA-linja er netto null** og tar plass på seddelen. Realistisk, men den forvirrer mer enn den lærer med mindre den forklares i én setning («du får den, og betaler den videre»).
7. **Rederi-appen er låst til AS eller flere båter.** Det blander «rederi» (flåten) med selskapsform. En ENK med én sjark og mannskap er også et rederi i spillets forstand.
8. **Hyre vises som lott i Salg-fanen** (kjent, E3 «ikke ennå»).
9. **Spilltesten** (rapport 2): agenten satt igjen med 556 kr og «turte ikke» ta lån. Et varsel når et kjøp ikke lar det bli igjen til diesel og is, står på lista der. Det passer inn i bankkontoene: en reserve.

## 4. Forslag

Sortert etter hva som gir mest for spilleren per time arbeid. A–C er kjernen, D–F er dybde, G er småfiks.

**A. Bankkontoer** (Jonas' idé). Banken får flere kontoer med automatiske overføringer:
- *Brukskonto*: det HUD-en viser. Alt kommer inn her og alt daglig trekkes her.
- *Skattekonto*: etter hvert oppgjør settes en andel av netto av (standard på, prosenten regnes av spillets egen skatteberegning så langt i år, og kan overstyres). Kortet viser «avsatt» mot «forventet skatt i år». Terminen trekkes fra skattekontoen først. Det er rådet enhver regnskapsfører gir et ENK, og det gjør skatten til noe spilleren ser vokse, ikke en overraskelse.
- *Sparekonto*: valgfri fast andel eller faste beløp, rente (3–4 %), og «Neste mål» kan peke på den («egenkapitalen banken krever: 85 000, spart 40 000»). Pengene er sperret for daglige trekk, så reserven til diesel og is holder.
- *Kassekreditt* i stedet for stille minus: brukskontoen kan gå under null inntil en grense (f.eks. 10 % av flåtens verdi) mot rente (8–10 %), med melding; under grensen stopper kjøp. Det gir «tomt» en følge som er ekte og forståelig.
- *Privatkonto* bare hvis spilleren skal ha privatøkonomi (spørsmål 2).

**B. Turoppgjøret.** Sluttseddelen og Salg-fanen viser hele turen: brutto, trekk (én linje, detaljer ved trykk), MVA (én linje med forklaring), turens felleskostnader (diesel brukt × prisen den ble bunkret til, is, agn), delingsfangst, båtlott/mannslotter, netto til kassa. Lotten regnes av delingsfangsten (funn 2.2). Dette krever at båten teller turens forbruk (`b.tripCost`), som er lite arbeid. Det gjør at hver tur lærer spilleren hva den kostet, og lotten blir lik den fiskerne kjenner. Balansen (progweek) må kjøres på nytt: mannskapet får litt mindre, eieren litt mer.

**C. Ett regnskap, per år, med kategorier.** Kostnadene føres med kategori (`S.stats.y[år]` eller en liten hovedbok `S.ledger` med de siste 200–300 postene, som også gir kontoutskrift i banken). Regnskapskortet (ett sted, i Rederi, med snarvei fra Bank) viser året: inntekter per kilde, kostnader per kategori, avskrivning, resultat før skatt, skatt, resultat etter skatt, og under det kontantstrømmen (avdrag, båtkjøp, innskudd på spare- og skattekonto). Fjorårene bevares som rader. `S.stats.tax` kommer fram.

**D. ENK mot AS gjort ekte** (avhenger av spørsmål 1 og 2):
- *Enkel utgave uten privatøkonomi:* AS betaler 22 % av det som blir stående, men eieren må ta en «skipperhyre» (fradragsberettiget i AS, beskattet som lønn hos eieren, fiskerfradraget følger med). Da koster AS omtrent som ENK når alt tas ut, og mindre når overskuddet blir i selskapet til ny båt. Sammenligningen på skattekortet viser begge med eierens lønn, ikke 22 mot 45.
- *Full utgave med privatkonto:* ENK: overskuddet skattlegges hos deg og er ditt (til privatkontoen). AS: lønn og utbytte flyttes fra selskapet til privatkontoen, med skatten de koster; selskapets kasse er selskapets. Begrenset ansvar betyr noe: går selskapet konkurs, mister du flåten, ikke privatkontoen. Dette er realistisk og lærerikt, men det er en ny dimensjon i spillet (hva brukes privatpengene til?).
- Begge: Rederi-appen åpnes av flåten (mannskap eller flere båter), ikke av AS. «Stift AS» blir et valg med en begrunnelse (du skal kjøpe båt med hjemmel, du vil ha partnere), ikke et steg alle tar.

**E. Skatteterminer og oppgjør som i livet.** Terminene 15. mars, mai, september og november etter forventet inntekt (fjorårets overskudd, eller året så langt framskrevet det første året), oppgjør i juni med restskatt eller tilgode, underskudd framføres. Et varsel sju spilldager før hver termin med beløpet. Med tempo 1:6 kommer en termin omtrent hver 15. ekte dag; det ligner i rytme på det vi har.

**F. Mannskapets lønn mot virkeligheten.** Forventningen (og hyra) skalerer med båten og fiskeriet (for eksempel båtens typiske ukeomsetning fra `VESSELS` og sesongen) i stedet for 6 000 × 5. Leid skipper får 1,5 lott når du ikke er om bord. Garantilott fra Garantikassen (en minste ukelott når fisket slår feil) kan legges inn senere som fargelegging. Salg-fanen viser hyre som hyre.

**G. Småfiks.** Vis skatt betalt; ett navn på kassa; sjekk dobbeltføringen av utstyr i `depBase`; aksjekapitalen; de små faste kostnadene (kaileie, ansvarsforsikring, regnskapsfører for ENK) som årlige trekk med melding; varsel ved kjøp som tømmer kassa under diesel og is (rapport 2).

**Kildene som må sjekkes før bygging** (CLAUDE.md: regelverk mot kildene): skatteetaten.no (satser 2026: trinnskatt, trygdeavgift fiske, personfradrag, fiskerfradrag, oppjusteringsfaktor utbytte, skjermingsrente), Lovdata skatteloven §§ 6-60 og 12-2, Norges Fiskarlags lottavtale for kystflåten (felleskostnader, båtlott, skipperlott), Garantikassen (pensjonstrekk, garantilott), rafisklaget.no (trekkene). Skatteetaten og Lovdata var sperret fra arbeidsmiljøet 04.10.2026; det må prøves igjen, ellers må Jonas eller regnskapsføreren bekrefte satsene.

## 5. Spørsmål til Jonas

1. **Ambisjonsnivå.** (a) Rydde og forklare det som finnes (C, G, deler av B). (b) Pluss bankkontoene og turoppgjøret (A, B, E, F). (c) Pluss ekte ENK/AS med privatøkonomi (D full). Hva skal denne runden levere?
2. **Privatøkonomi.** Skal spilleren ha egne penger ved siden av rederiets (egen lønn, privatkonto, noe å bruke dem på), eller er kassa alt? Svaret avgjør hvordan AS mot ENK kan gjøres ekte.
3. **Bankkontoene.** Hvilke: bruks, skatt, spare, privat? Automatisk avsetning til skatt som standard (med prosent spilleren kan endre), eller bare manuelt? Rente på sparekontoen? Kassekreditt med rente når kassa går tom, eller sperre som nå?
4. **Lott etter felleskostnader.** Skal diesel, is og agn trekkes før lotten (som i livet), og skal leid skipper få 1,5 lott? Det endrer balansen tidlig i spillet litt.
5. **Skatterytmen.** Ekte terminer (mars/mai/september/november) og oppgjør i juni, eller beholde kvartal og nyttår fordi det er enklere? Skal underskudd framføres?
6. **AS.** Skal AS koste noe ekte (eierens lønn/utbytte beskattes), eller stå som 22 % flatt? Skal Rederi-appen åpnes av flåten i stedet for av AS?
7. **Mannskapet.** Skal forventning og hyre skalere med båt og fiskeri? Er hyre (fast dagslønn) noe du vil beholde, eller er lott nok?
8. **Hvor mye lærestoff.** Skal MVA-linja stå på seddelen (med forklaring), eller gjemmes? Hvor lange forklaringer tåler bank- og regnskapskortet (én setning per tall, eller en egen «Slik virker det»-side)?
9. **Faste småkostnader.** Vil du ha kaileie, ansvarsforsikring, regnskapsfører for ENK og proviant inn som årlige/månedlige trekk, eller er det støy?
10. **Rekkefølge.** Backloggen har Driftsplan 2 del 8 og SK1–SK6 ventende. Går økonomien foran, eller etter?
