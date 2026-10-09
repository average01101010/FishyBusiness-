# On-boarding: planen for nye spillere (09.10.2026)

Jonas' ønske: en sømløs og god start som hekter nye spillere så fort som mulig og motvirker churn. Dette er planen, lagt fram før
bygging. Den bygger på det som finnes: åpningsscenen med brevet, startlista, naustet i 3D, veiledningen «Første tur»
(`ui/07b-first-trip.js`, 26 trinn), Neste mål-brikka, milepælene (`09f-merker.js`, kapitler og drypp), trakten i admin.

## 1. Prinsippene

1. **Første napp innen fem ekte minutter.** Alt som ikke trengs for å komme ut og få fisk, flyttes til senere. Krokene er ekte
   (napp, rykk, varierende fangst), så det er nappet som hekter, ikke forklaringen.
2. **Vis, ikke fortell.** Hvert trinn er noe spilleren gjør, ikke en tekstside. Ett tips om gangen, høyst to linjer, og tipset peker
   på knappen det gjelder. Lange forklaringer ligger i Håndboka (ny app, se 4), ikke i tipsene.
3. **Lær i det øyeblikket det gjelder.** Is når fisken ligger på dekk, vær når varselet viser vind, redningsappen første gang det
   faktisk blåser eller motoren fusker, driftsplan når spilleren har levert tre ganger og kjenner rutinen. Aldri «her er alt».
4. **Aldri stopp.** Ingen tips stopper båten eller spillet. Det som ikke er lest, ligger igjen som en prikk på Neste mål og i Håndboka.
5. **Alltid et neste mål.** Fra første sekund til uke fire står det ett konkret mål i Neste mål-brikka. Spilleren skal aldri lure på
   «hva nå?».
6. **Første tur er obligatorisk, resten er drypp.** Kapittel 1 (første tur) kjøres for alle. Kapittel 2–6 kommer som korte drypp
   når spilleren gjør ting første gang, og kan alltid hoppes over med ett trykk («Jeg kan dette» skjuler resten av kapittelet).
7. **Må virke i stående og liggende format, med berøring,** på svake telefoner uten 3D også (tipsene peker på 2D-elementer eller
   på knapper, aldri bare på noe i 3D-bildet).
8. **Mål alt.** Hvert trinn sender en hendelse (trinn, tid brukt, hoppet over). Trakten i admin viser hvor folk faller av, trinn for
   trinn, før og etter omskrivingen. Ingen endring i on-boardingen uten at den kan leses av der.

## 2. Kapittel 1: Første tur (obligatorisk, 25–35 ekte minutter)

Spilleklokka går 6× i kapittel 1 som i dag. Tallene i parentes er ekte minutter, omtrent.

### A. Åpningen (3 min)
1. Svart skjerm, konvolutten. Spilleren åpner brevet og leser (som i dag).
2. Startlista: «Hvor står fars naust?» Bare steder der været holder for første tur (bygget 09.10.2026). Standardvalget står
   markert, ett trykk holder.
3. Båtens navn (som i dag).

### B. Naustet (2 min)
4. **Spilleren våkner inne i naustet** (NAUST3D finnes). Tre–fire tekstlinjer som kommer én og én: fars naust, det han etterlot,
   notatboka på bordet, trofeveggen som er tom, ovnen. Linjene peker på det de nevner. Ett trykk per linje, ingen «Skjønner»-knapp
   med lang tekst.
5. «Gå ut» → kameraet glir ut døra og ned på kaia, og spilleren ser båten for første gang (kort kinosekvens, 5 s, kan hoppes over).
   Tips: navnet på båten, at den er gammel men flyter, at hun har juksa om bord.

### C. Ut på sjøen (5 min)
6. Tips på kartplotter-knappen: «Åpne kartplotteren.» (dagens `gps`.)
7. Feltet lyser i kartet med en ring. Tips: «Trykk på feltet, så Autonav.» Ruta legges, båten går. (`route1` + `cast1`, slått
   sammen til ett trinn: ett trykk på feltet gir både rute og avgang.)
8. Underveis, i rekkefølge, ett om gangen mens båten går, ingen stopper båten:
   - navigasjonsbaren øverst (HDG, SOG, dybde, tidevann, ekkoloddet),
   - Neste mål-brikka,
   - **kino-visningen** (trykk, se båten utenfra, 10 s),
   - **bro-visningen** (first-person), snu deg rundt med fingeren,
   - **kikkerten** (finnes), se mot feltet,
   - tilbake til kartplotteren.
   Det som ikke er trykket på innen båten er framme, hoppes over og blir en prikk i Håndboka.

### D. Fisket (6 min)
9. Framme på feltet: fiskelykka og haillen (dagens `luck`, `haill`, `luckhud`: luksushaillen er gaven ved registrering, her vises
   bare at lykka finnes og hva haill gjør, uten pris).
10. «Start juksa.» Nappet kommer raskt (feltet er varmt, garantien finnes). Jukse-spillet forklares med ett tips ved første napp:
    «Rykk når det napper.»
11. Første fisk om bord: tips om **bløgging og sløying**: «Fisken bløgges og sløyes på dekk. Det gir bedre pris.» Dekkslogglinja
    nederst viser det som skjer.
12. Fisker til lasterommet er fullt (dagens `full`). Tips underveis om lasten (kg på dekk/i rommet).

### E. Hjem med manuell rute (7 min)
13. **Manuell rute til mottaket** (Jonas' forslag, ja): «Trykk i kartet for å legge rutepunkter fram til mottaket.» Mottaket lyser.
    Rutekontrollen («krysser land») sier fra, og Autonav står alltid som reserve-knapp om spilleren gir opp.
14. **Kurslista** vises når ruta er lagt: etapper, kurs, distanse, tid. Ett tips.
15. «Kast loss.» Underveis, ett om gangen, mens båten går:
    - telefonen og appene: Vær (med varselet og fargene for det båten tåler), Salgslaget (priser nå), Kvote (åpen gruppe, kort),
      Regler («Kan jeg fiske her?»),
    - **været som konsekvens:** vis varselet for i morgen og hva som skjer om det blåser over grensen (båten snur selv, eller blir
      liggende),
    - **redningsappen:** hvor den er, at Redningsskøyta kommer ved motorstopp og slep, ett trykk.
    Rekkefølgen er fast, men bare så mange som rekker før båten er framme; resten kommer på neste tur (kapittel 2).

### F. Levering (5 min)
16. Fortøy, «Lever fisken». Krana og trucken går. **Sluttseddelen** vises: kilo, art, pris, trekk, netto. Første penger.
17. **Registrering** tilbys her, som «skriv under sluttseddelen i ditt navn»: båtdåp med registreringsmerke og brukernavn (finnes),
    luksushaill som gave. Gjester kan hoppe over; da kommer tilbudet igjen ved tredje levering.
18. **Dekksdagboka:** turen står der allerede (endowed progress). Ett tips.
19. **Is:** «Kjøp is, så holder fangsten seg.» Første is er gratis (finnes). Tips om at isen går med per tur.
20. **Beholdning:** rom, is, diesel, redskap. Ett tips.
21. **Mannskap:** på kaia står en som vil mønstre på, på lott (koster ingenting før fangsten deles). Tips: «Med en mann til går
    sløyinga dobbelt så fort.» Spilleren velger ja eller nei; begge går videre. (Jonas' forslag. Jeg anbefaler ja, men at det
    er et valg: en som vil være alene i båten, skal få være det.)
22. Kapittel 1 ferdig: milepælen «Første levering» (finnes), Neste mål settes til «Tur 2: velg felt selv». Spilleren fisker på egen
    hånd fra nå.

## 3. Kapittel 2–6: dryppene (frivillige, utløst av det spilleren gjør)

Hvert drypp er 1–3 tips, utløst første gang noe skjer, med «Jeg kan dette» som skjuler resten av kapittelet. Et drypp som
ikke blir sett, ligger i Håndboka og som prikk i Neste mål.

**Kapittel 2: Tur 2 og 3 (samme dag).** Fiskeguide-appen (hvor fisken står, sesonger), ekkoloddet og artsvalget, regellaget i
kartplotteren, dybder og flo og fjære (tidevannet i navigasjonsbaren og i Vær), fartsjustering i kartplotteren (diesel per nm),
søk etter steder, innstillingene i kartplotteren. Kystposten og meldinger første gang det kommer en sak eller melding.

**Kapittel 3: Kvelden og natta (dag 1 → dag 2).** Energi og hviletid: «Du er trøtt, sov i naustet.» Kulde og effekt på arbeid første
gang det er under null. Diesel og bunkring når tanken er under 30 %. Rorbuene når spilleren ligger langt hjemmefra.

**Kapittel 4: Rutinen (dag 2–3, etter tredje levering).** Driftsplanen: «La mannskapet ta morgenturen mens du sover» (dagskortet
finnes). Landinger, topplista, leverandørforhold i Salgslaget. Milepælene (Merker-appen). Tilbakemeldingsappen («Si fra om noe
er rart, det er lov å være ærlig», med takk-haillen). Patchnotes-prikken.

**Kapittel 5: Utstyr og båt (uke 1).** Første tur med ekte oppdrag (turtavla finnes): «Turen tar 40 min, belønningen er god» og
**trim** forklart der det blir fristende av seg selv (kortere tid på den turen). Utstyrsbutikken (line/garn/teiner og halerne de
trenger, utsett og opptak, agn, kroker). Verftet (vedlikehold, begroing, maling, «Ferdig nå» bare som det det gjør i spillet).
Båttypene og fasilitetene om bord når spilleren har råd til neste båt (Neste mål viser det). Sikkerhetsutstyr når SK-planen er
bygget.

**Kapittel 6: Sosialt og økonomi (uke 1–2).** Venner, deling av fiskeposisjoner, AIS og andre spillere, puben og kjentmannen,
fiskarlag, gjestebok. Rederiet, økonomien (ENK/AS, skatt, lån), blad B, lukket gruppe, kvotemarkedet, bestander. Papirene.

## 4. Håndboka (ny app på telefonen)

Alle tipsene samlet, sortert etter kapittel, søkbare, med en prikk ved det som ikke er sett. Et tips i Håndboka kan åpnes på
nytt («Vis meg») og peker da på knappen igjen. Dette dekker Jonas' lange liste uten å putte alt i veiledningen: det som ikke
kommer som drypp, står i Håndboka. Håndboka er også svaret på «hvordan var det nå igjen?» uten å spørre i tilbakemeldingen.

## 5. Det Jonas' liste manglet (forslag)

- **Registreringsøyeblikket** (punkt 17) og **push-tillatelsen**: spørres første gang noe venter (line satt, verftsjobb): «Vil du
  ha beskjed når den er klar?», aldri ved start.
- **Lyd, musikk og språk**: ett tips i naustet (ovnen knitrer, musikken av/på) og språkvalget på startskjermen.
- **Fars notatbok og trofeveggen** (rekordene), **drømmefisken**.
- **Anker**, **natt og søvn**, **slep ved motorstopp** (redning), **fortøying**.
- **Overtroen**, **tatoveringene**, **flagget**, **malingen** (kosmetikk, synlig for andre).
- **Kvalitet og pris**: bløgging, is og tid på dekk gir prisen; dette er den første «dyktighet gir penger»-kroken.
- **Jukse-spillet** som ferdighet (midt på gir 2×).
- **Uke- og sesongrytmen**: ukas beste fisker, skreisesongen, årets første skrei i Kystposten.

## 6. Måling

- Hvert trinn sender `tut_step` (id, sekunder brukt, hoppet over/ferdig) til hendelsene i skyen (samtykke finnes).
- Admin: trakten får ett steg per trinn i kapittel 1 og ett per kapittel 2–6, med andel som når hvert og median tid. Før
  omskrivingen måles dagens veiledning i minst noen dager, så vi har et før-tall.
- Mål for kapittel 1: 80 % av dem som åpner brevet, leverer første fisk; median under 30 ekte minutter.

## 7. Rekkefølge og omfang

| Steg | Hva | Omfang |
|---|---|---|
| 1 | Måling: `tut_step`-hendelser og trakt per trinn i admin, på dagens veiledning | 1 dag |
| 2 | Kapittel 1 omskrevet: naustet som start, ny rekkefølge, manuell rute hjem med kursliste, apper underveis, registrering ved sluttseddelen, mannskap på kaia | 3–4 dager + `tut` (40 min) i begge formater |
| 3 | Håndboka og Neste mål-dryppene (kapittel 2–6, rammeverket) | 2 dager |
| 4 | Innholdet i kapittel 2–6 | 3 dager |
| 5 | Full regresjon, dokumentasjon, patchnotes | 1 dag |

Testen `tut.py` utvides til kapittel 1 slik den er nå (hele turen med berøring, liggende og stående), og kapittel 2–6 får en
egen lett test som utløser hvert drypp og sjekker at ingen stopper spillet.

## 8. Spørsmål til Jonas før bygging

1. Mannskap ved første levering: valg (anbefalt) eller alltid?
2. Manuell rute hjem i kapittel 1 (anbefalt, med Autonav som reserve) eller Autonav begge veier?
3. Registrering ved sluttseddelen (anbefalt) eller først ved tredje levering som nå?
4. Skal kapittel 1 kunne hoppes over av noen (for eksempel en som starter spillet på nytt)? Anbefalt: ja, men bare etter at
   spilleren har fullført det én gang på samme enhet eller konto.
5. Kinosekvensen ut av naustet (5 s): vil du ha den, eller rett ut på kaia?
