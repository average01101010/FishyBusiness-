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
- **Gjestestarten:** gratis juksa, is og luksushaill, registrering etter tredje levering, i spillets egne ord.
- **Haill** (29 kr, +100 % i 24 t, så avtagende over 72 t) og **luksushaill** (59 kr, +200 % første døgn, over 96 t). **Trim** (29/39/49 kr, ×1,5/1,75/2 fart i 24/48/72 t). **«Ferdig nå»** på verftet (19 kr).

## To ting å rette ved det vi har

1. **Topplista og haill.** Haill dobler eller tredobler fangsten, og topplista rangerer på kilo levert, så den som kjøper, klatrer. Forslaget er at topplista teller fangst uten haill-effekten (andelen er kjent når fisken tas), så haill forblir din egen fart mens rangeringen er ærlig. Haill selges uansett. **Jonas avgjør.**
2. **«Ferdig nå»** beholdes, med regelen over: ventetiden forlenges aldri for å selge mer.

## Arbeidslista, i rekkefølge

Alt bygges for hele kysten. Hver endring skal kunne leses av i trakten (punkt 8) før neste vurderes.

1. **Malerverkstedet** på verftet: kosmetikk for ekte penger. Skrogfarger og fargeskjemaer, navnebrett, vimpler og flagg, stil på registreringsmerket, slitt eller nylakkert. Varig, 19–79 kr, synlig for andre spillere i den felles verdenen og i sidebildet i Båthandel. Mekanismen finnes: GLB-båtene har malesone 1 for skroget (`glbModel(type, lod, liv)`), byggesettbåtene har `col`-tabeller, og NPC-båtene bruker `LIVERY` i dag. Det som mangler, er UI, lagring per båt, salg gjennom butikken og at fargen følger `pos_put` til de andre.
2. **«Første uke på sjøen»:** et kort med 8–10 milepæler uten tidsfrist (første fangst, første levering, første storm, første natt på rorbu, første mann hyret, første 10 000 kr, fars første merke funnet). To er krysset av fra første tur. Metasløyfen i de tre første dagene.
3. **Turoppdrag fra der du er** (Jonas' tillegg): lange turer med gode belønninger ut fra hjemhavna og mottakene rundt, som gjør trim attraktivt. Belønningen står i forhold til turen uten trim.
4. **Sjeldne hendelser på sjøen** som gratis variabel belønning: drømmefisken, hvalen, en rekordfisk, en tapt garnlenke med fisk i, omtale i Kystposten.
5. **Ukerytmen:** søndagskort og én push, «Ukas fangst», med plassering, beste dag og hva naboene leverte. Sesongvimpler som fortjenes («Skreisesongen 2027»), men som også kan fortjenes neste år: sesong uten FOMO.
6. **Kystkartet:** samling for hele landet. Mottak du har levert til (av 153), lykter du har passert, arter du har fanget. Fullførelsestrangen er ærlig når samlingen er ekte.
7. **«Kystfiskerpakken»**, ett kjøp (for eksempel 199 kr): alle dagens fargeskjemaer, supportervimpel og navnet ditt på kildesiden. Ingen spillfordeler. Et alternativ til småkjøp for dem som heller betaler én gang.
8. **Trakten i admin-dashbordet:** konvolutt → første fangst → første levering → tredje levering → registrert → tilbake dag 1, 7 og 30. Hendelsene finnes (start, sale, reg_ask, reg_go). Uten dette gjetter vi.

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
