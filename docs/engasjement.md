# Engasjement og inntekt (Jonas 06.10.2026)

Spillet skal tjene penger, og Jonas skal kunne leve av det. Dette er grunnlaget for hvordan vi holder på spillerne og tjener på dem uten at de slutter eller føler seg maset på. Reglene som gjelder i hver avgjørelse, står kort i `CLAUDE.md` under «Engasjement og inntekt». Her er grunnlaget, arbeidslista i rekkefølge og det vi ikke gjør.

## Grunntanken: Friction for Flow

- **Krokene er ekte.** Forskningen Jonas fant (variabel belønning, sløyfer med ulik tidshorisont, flyt, endowed progress, tapsaversjon, samling, sosialt bevis) beskriver to ting som ofte blandes: ærlig engasjementsdesign og manipulasjon. Vi bruker det første fullt ut og holder oss unna det andre, fordi publikummet er voksne som kjenner fiske, fordi reguleringen i Norge og EØS strammer til, og fordi tillit er det eneste fortrinnet en enkeltutvikler har som ikke kan kopieres. Simulatorer som lever lenge, tjener på at folk elsker dem.
- **Haill for ekte penger beholdes.** Det er trolig det mest innbringende i spillet (Jonas 06.10.2026). Haill er fart i din egen progresjon. Luksushaill gis bare som gave ved registrering og som takk for tilbakemelding; resten selges.
- **Friksjonen er simuleringens egen:** avstand, vær, ståtid, slitasje, hviletid, verftstid, kvoter, åpningstider. Det vi selger (haill, trim, «Ferdig nå», kosmetikk), skal lette en friksjon som finnes av en annen grunn enn salget. Vi legger aldri inn ventetid, energi eller trøtthet for å selge oss forbi den, og vi forlenger aldri en ventetid for å selge mer. Ventetid for ekte penger (verftet, 30 ekte minutter) skal være kortere enn en vanlig pause mellom økter.
- **Innholdet legges der betalingen blir fristende av seg selv.** Jonas' eksempel: turoppdrag ut fra der spilleren er, med lange turer og gode belønninger, som gjør trim i Trim-appen attraktivt. Turen skal være verdt å ta uten trim, og belønningen skal stå i forhold til turen uten trim. Betalingen korter ned en ekte avstand, aldri en oppdiktet.
- **Alt kan nås uten å betale.** Hvert oppdrag, hver belønning og hvert mål skal være mulig og morsomt å nå med tid og dyktighet. Betaling er fart og bekvemmelighet. Designet balanseres med hyppige belønninger og synlig progresjon for den som ikke betaler. Ellers er det ikke Friction for Flow, men en betalingsmur, og det gir churn.
- **Endowed progress:** nye ting starter aldri på null. Milepælskort, samlinger og stiger viser det som alt er oppnådd (første tur, gratis juksa, luksushaillen), og første steg er lett. Gjestestarten er bygd slik: du har noe å ta vare på før du blir bedt om noe.
- **Variabel belønning kommer fra sjøen, ikke fra lommeboka.** Fiskingen selv (napp, rykk, varierende fangst, flekker som flytter seg, været) er den ærlige utgaven av spilleautomaten. Sjeldne hendelser er tilfeldige og gratis. Det vi selger, er alltid kjent på forhånd.
- **Tre sløyfer, alltid.** Hver ny funksjon skal svare på: hva gir den spilleren å gjøre nå (30–90 sekunder), i dag (timer) og denne uka?

## Det vi har (og som er legitimt)

- **Kjernesløyfen:** fiskingen. Napp, rykk, fangsten varierer, flekkene flytter seg, været. Innsatsen er tid og dyktighet, ikke penger.
- **Metasløyfen:** 14 båter, «Neste mål», utstyr, lån, blad B, lukket gruppe, mannskap, tatoveringer, fars notatbok, trofévegg, kvoteår.
- **Sosial sløyfe:** felles verden, ukas toppliste, Skreifestivalen, synlige båter, push når noen passerer deg. Den finnes, men er tynn.
- **Innloggingsbonusen** er den snille varianten: +1 % per dag, bortedager tærer gradvis (`STREAK.decay`), den nulles ikke. Duolingo måtte redde seg med «streak freeze» fordi folk som mistet en lang streak, sluttet.
- **Push** er begrenset: høyst 4 i døgnet, ingenting 22–08, hendelser i verden heller enn «kom tilbake».
- **Butikken:** priser i kroner, ingen fiktiv valuta, 💎-merket, angrerett forklart, gjester kan ikke kjøpe. Det ligner prinsippene EU-landenes forbrukermyndigheter (CPC-nettverket) la fram for spillvaluta i 2025.
- **Gjestestarten:** gratis juksa, is og luksushaill, registrering etter andre levering (eller ved andre åpning), i spillets egne ord.
- **Haill** (29 kr, +100 % i 24 t, så avtagende over 72 t) og **luksushaill** (59 kr, +200 % første døgn, over 96 t). **Trim** (29/39/49 kr, ×1,5/1,75/2 fart i 24/48/72 t). **«Ferdig nå»** på verftet (19 kr).

## Avgjort om det vi har

1. **Topplista og haill** (Jonas 06.10.2026): den som kjøper haill, er med på topplista som alle andre, med alt de har levert. Det er pay-to-win, og det er et valg: uten det forsvinner mye av grunnen til å kjøpe. **Haill-bruk vises aldri for andre**, verken på topplista, i AIS-kortet, i posisjonen til de andre, i Kystposten eller noe annet sted. For alt de andre vet, har den beste båten funnet en skikkelig god fiskeplass. Ingen felt om haill skal inn i det som deles (`pos_put`, `landings`, topplista).
2. **«Ferdig nå»** beholdes, med regelen over: ventetiden forlenges aldri for å selge mer.

## Arbeidslista, i rekkefølge

Alt bygges for hele kysten. Hver endring skal kunne leses av i trakten (punkt 9) før neste vurderes.

1. **Fartstid, registrering og synlighet** (Jonas 07.10.2026, avgjort etter forslag). Bygges i denne rekkefølgen:
   1. **Fartstid** fra 0 til 40 år, uten rangnavn. Bare status, ingen låser. Kurven: poeng(N) = 1 000 000 · (N/40)^2,8, styrt etter tid: år 1 i første tur, 3 første dag, 5 første uke, 10 etter en måned, 20 etter 4–5 måneder, 30 etter et år og 40 etter 2–3 år for en som spiller jevnt. Etter 40 telles årene som stjerner. Fartstid tjenes om bord (tid til sjøs og levert fangst etter kvadratroten av verdien), og fangst tatt med haill teller. Det mannskapet og redskapene gjør mens appen er lukket, gir omtrent en firedel («rederierfaring»). Borte-tid gir «uthvilt»: dobbel fartstid de neste timene til sjøs, med et tak, og den forsvinner aldri. Spillere som har spilt, får fartstid regnet ut fra det de har gjort. Fartstid selges aldri, og ingenting som øker den direkte.
   2. **Rapporten ved åpning** («Mens du var borte»): ett stort tall som teller opp, fartstidslinja som fylles, ruter for levert, beste levering og uthvilt, og en kort liste over det som skjedde. Bare det som er vunnet, ingenting om hva man gikk glipp av. Kan hoppes over.
   3. **Den navnløse båten:** båten er uten navn til spilleren registrerer seg, og kjennes på registreringsmerket. Registreringen kommer etter andre levering, eller ved andre åpning av spillet om det kommer først. Der døper spilleren båten og velger et unikt brukernavn. Brukernavnet er påkrevd for alle registrerte (Jonas 07.10.2026), og kontoer fra før blir spurt til de har valgt et. Begrunnelsen er lagringen, og den er sann: en gjest har spillet bare i denne nettleseren. Støtende navn fjernes i admin med forklaring, og et nytt velges gratis.
   4. **Synlighet:** registrerte spillere vises alltid (valget for å skjule båten fjernes; personvern og vilkår oppdateres). Spillerbåtene skiller seg tydelig fra NPC-ene i kartet og i 3D. AIS viser båtnavn, eier og fartstid. Gjester vises ikke for andre i AIS eller på topplista, men ser seg selv. Serveren sjekker at fartstiden ikke vokser raskere enn mulig.
   5. Så achievements, med «Første uke på sjøen» (punkt 3). Ferdig 07.10.2026, se punkt 3.
2. **Malerverkstedet** (Jonas 06.10.2026): egen knapp under Verft. Skrogfarge for spillpenger, og første fargevalg er gratis. For ekte penger: malingsdesign på skroget, nasjon og form på flagget (eventuelt egen logo), rederilogo på skroget (lastet opp eller generert) og registreringsmerket. Varig og synlig for andre spillere i den felles verdenen og i sidebildet i Båthandel. Mekanismen finnes: GLB-båtene har malesone 1 for skroget (`glbModel(type, lod, liv)`), byggesettbåtene har `col`-tabeller, NPC-båtene bruker `LIVERY`, navnet på skroget er et bilde på en stripe langs siden (`texStrip`, `A.names`), og flagget i akterenden er et eget nett (`buildFlag`). Det som mangler, er UI, lagring per båt, salg gjennom butikken og at malingen følger `pos_put` til de andre.
3. **«Første uke på sjøen»** (bygd 07.10.2026, OVERLEVERING 4.25):
   - **Kalibrert etter de to første spillerne som leverte.** De spilte rundt 14 timer over tre dager, omtrent én levering i timen.
     - 10 000 kr per levering kom på andre levering, ett tonn etter rundt tre leveringer, og 25 000 kr per levering på dag 2.
     - 50 000 kr kom først etter båtbytte. Ingen leverte 100 000 kr på én gang.
     - Garn, line, nye mottak og båtbytte er der de stopper opp eller aldri kommer.
   - **21 milepæler i tre kapitler à sju**, et kapittel synlig om gangen. Neste kapittel åpner ved fem av sju, så ingen står fast. Tre er krysset av fra første tur.
   - **Hver milepæl gir et drypp fra noen på kysten.** Dryppene trekkes i tre nivåer (7/2/1 av 10) og passer til det spilleren har: agn til den med line, bøting til den med garn, skrogrens, motorservice, is, diesel, penger, og en sjelden gang utstyr. Variabel, gratis og fra sjøen.
   - **Hvert kapittel har en kjent belønning:** vimpler som andre ser, en vanlig haill som smaksprøve etter kapittel 2 (Jonas: «haill som smaksprøve funker»), og skrogfargen «Kystfisker».
   - **De langsiktige merkene** tar over etter uka, så kortet aldri bare tar slutt.
   - **Første slep og første reparasjon er gratis** (Jonas: «slik at spillerne lærer, men ikke får konsekvenser»).
   - **Trakten per milepæl** ligger i admin under «Merker». Der tallet faller mest, er neste sted å gjøre noe.
4. **Turoppdrag fra der du er** (Jonas' tillegg): lange turer med gode belønninger ut fra hjemhavna og mottakene rundt, som gjør trim attraktivt. Belønningen står i forhold til turen uten trim.
5. **Sjeldne hendelser på sjøen** som gratis variabel belønning: drømmefisken, hvalen, en rekordfisk, en tapt garnlenke med fisk i, omtale i Kystposten.
6. **Ukerytmen:** søndagskort og én push, «Ukas fangst», med plassering, beste dag og hva naboene leverte. Sesongvimpler som fortjenes («Skreisesongen 2027»), men som også kan fortjenes neste år: sesong uten FOMO.
7. **Kystkartet:** samling for hele landet. Mottak du har levert til (av 153), lykter du har passert, arter du har fanget. Fullførelsestrangen er ærlig når samlingen er ekte.
8. **«Kystfiskerpakken»**, ett kjøp (for eksempel 199 kr): alle dagens fargeskjemaer, supportervimpel og navnet ditt på kildesiden. Ingen spillfordeler. Et alternativ til småkjøp for dem som heller betaler én gang.
9. **Trakten i admin-dashbordet** (bygd 07.10.2026, fanen «Trakt», `admin_funnel` i `supabase/migrations/20261007150000_funnel.sql`): konvolutt → første fangst → første levering → tredje levering → registrert → tilbake etter 1, 7 og 30 dager, totalt og per uke spillerne startet. Det største frafallet er merket. Bare spillere som deler statistikk telles. Bygd før punkt 4, fordi hver endring skal kunne leses av her.

**Vurderes senere:** fiskarlag per hjemhavn (felles ukemål og oppslag, aldri slik at én spillers fravær skader andre), innholdsutvidelser som havsteget med blåkveite (legitimt så lenge grunnspillet føles komplett), abonnement («Rederi-medlemskap») med bekvemmeligheter der ingenting går tapt ved oppsigelse (vent til betalingsviljen for kosmetikk er kjent).

## Det vi ikke gjør

- **Loot boxes, gacha, pakker med ukjent innhold og «pity»-systemer.** Belgia og Nederland forbyr dem, Forbrukertilsynet og Forbrukerrådet har kjempet mot dem i årevis, og tilfeldige belønninger for ekte penger risikerer å bli regnet som pengespill under pengespilloven (Lotteritilsynet). EU-kommisjonens Digital Fairness Act er på vei, men så vidt vi vet ikke vedtatt; sjekk status før lansering utenlands.
- **Fiktiv valuta** og pakker som skjuler prisen. Prisen står i kroner med 💎.
- **Nedtellinger i butikken**, «bare i dag». Sesongting kan fortjenes eller kjøpes igjen senere.
- **Straff for fravær:** ingen push om tapt bonus eller tapt plass, ingen streak som nulles.
- **Lengre ventetider eller energi som betalingsmur.** Trøttheten er simulering og skal forbli det.
- **Vervepyramider med spam.** Et enkelt «inviter en venn» med en liten gave til begge er greit.
- **Reklame for belønning.** Ingen reklame i spillet.
- **Sosial forpliktelse som felle.** Topplister, fiskarlag og felles mål er additive.
- **Barn.** 13-årsgrensen for samtykke står, butikken er låst for gjester, og ingen gamblinglignende mekanikk.

## Måling

Trakten i admin-dashbordet (punkt 8) er målestokken: hvor mange går fra konvolutten til første fangst, første levering, tredje levering og registrering, og hvor mange kommer tilbake dag 1, 7 og 30. «Rage quit» (økt som slutter innen et minutt etter grunnstøting) måles alt. Konvertering og inntekt per spiller leses i Supabase (purchases). Vi endrer én ting om gangen og ser på tallene før neste.
