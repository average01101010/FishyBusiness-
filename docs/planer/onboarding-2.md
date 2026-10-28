# Onboarding 2: en kortere og lettere første tur, for hele kysten (plan 27.10.2026, andre utgave)

> Plan etter `/planlegg`. Jonas valgte 1A–8A og sa «kjør på» 27.10.2026. O0–O5 er bygd og rullet ut; O6 pågår (status nederst).

## Hva Jonas ba om

27.10.2026: «re-design av tutorial/on-boarding for å gjøre opplevelsen bedre for brukerne. Husk at spillet dekker hele norskekysten,
ikke bare Senja. Det må vi ta høyde for.» Med et utdrag fra en samtale med Gemini. Hovedpunktene derfra:

- Behold brevet, båtnavnet, landsdelen, den garanterte fangsten, «Senere» på registreringen og dryppene.
- Kutt informasjonsdumpen på vei hjem, haill på første tur, og is og mannskap ved mottaket.
- Bytt det dempede laget ut med knappenes egen tilstand. Ingen AI-radio.

Samme dag, etter første utgave av planen: «Husk at vi må tenke på alt som kan forhindre churn i denne perioden av spillet», med ti
prinsipper (under), og «Tenk gjerne gjennom planen en gang til og presenter den på nytt før vi kjører på.»

## Hva målingene sier (skyen, `events`, 27.10.2026)

Få spillere, så dette er et signal og ikke et bevis. Bare spillere som deler bruksstatistikk, er med.

- **7 spillere** startet veiledningen 11.–13.10.2026. Ingen nye er målt siden 13.10.
- **Ingen sendte `tut_done`**, og ingen kom så langt som til `land`.
- **4 av 7 stoppet på `sail`**, altså mens båten gikk ut til feltet, etter kino- og kamerastegene. Tre av dem kom aldri tilbake.
- Naustlinjene ble trykket bort på 1–2 s (`n1` 10 s).

Spillerne faller av i ventetida før første napp. Hjemturens gjennomgang nådde ingen. Kapittel 1 tar i dag rundt 30 ekte minutter og
har 33 steg. Regnet fra koden (`GAME_RATE` 6, trebåten 6 knop, feltet 1,5–6 km ut) tar turen ut 1,5–5,5 minutter. Fisketida er 2
spilltimer, altså 20 ekte minutter.

## De ti prinsippene, og hva de blir i spillet

| Prinsipp | I dag | I planen |
|---|---|---|
| **1. Første mestring på under fem minutter** | Første fisk kommer etter rundt 6–10 minutter (brev, start, naust, rute, seiling) | Feltet 1,5–2,5 km ut, så turen tar 1,5–2,5 minutter. Naustet blir én linje. «Jukse selv» kommer straks båten er framme, og nappet kommer etter 4–8 s. Måles som `tFish` (O0), med 5 minutter fra «Ta over» som mål |
| **2. Rigget forsprang** | Garantert flekk, juksa om bord, 15 000 kr | Uendret. Etter første levering står «Neste mål»-stripa alt et stykke på vei (pengene fra leveringen teller) |
| **3. Styring med knappenes tilstand** | Dempet lag, ring og «Skjønner» | Laget fjernes. Knappene viser selv hva som mangler («Legg et punkt i ringen først»). Bare tre ting er sperret, slik som i dag |
| **4. Skjul det til det trengs** | Puben, kveita og driftsplanen er skjult; alle appene og knappene synes | Kapittel 1 viser bare det turen bruker. Resten kommer fram når det trengs, med et merke «ny» og et drypp (V7) |
| **5. En uløst oppgave ved slutten** | «Neste mål: juksamaskin», uten noe å gjøre nå | Kapittel 1 slutter med én konkret, liten oppgave: «Fyll is og kast loss på tur 2». Neste mål står ved siden av |
| **6. Ekte tall som belønning** | Sluttseddelen med kr/kg | Sluttseddelen blir øyeblikket: kilo, kr/kg per størrelse og netto. Og en linje om hva vanlig fiske gir der nå (backloggen 10.2). Ingen poeng eller stjerner |
| **7. Eierskap tidlig** | Båtnavnet, landsdelen | Båtnavnet nevnes i tekstene og i loggen fra første linje («[navn] er klar»). Ingen nye valg før første fisk |
| **8. Tap når appen er lukket** | Fisk råtner uten is, været snur båten, push om full last | Bare simuleringens egne følger: fersk fisk uten is, været, ståtid. Ikke noe forsprang som går tapt. Se V8, det kolliderer med en regel |
| **9. Andre fiskere straks etter første seier** | Topplista og AIS ligger i apper | Sluttseddelen får en linje som «I dag har 6 båter levert her, mest torsk.» Andre båter ved mottaket synes alt i 3D. Topplista kommer som første drypp etter levering. Ingenting om haill deles |
| **10. Tidlig nedetid som forventning** | Ventingen ut er tom | Seilingen og fisketida vises fra første tur i ekte tid («Framme om 2 min», «Fisker til 14:20»), og push-spørsmålet kommer ved første ekte venting etter kapittel 1. Ingen ventetid legges til. Se V8 |

## Hva som finnes i dag

- `ui/07b-first-trip.js`: `TSTEPS` (33 steg), `tutAllow` (bare «Kast loss», nye rutepunkter og levering sperres), `tipPlace` (boksen,
  `#tutDim`, `#tutRing`, `nodim`, `small`), `tutAdrift`.
- `ui/08c-start.js`: startlista for hele kysten, `tutFieldNear` (beste torsk 1,5–6 km ut, 20–150 m dybde, under båtens grense for
  sjø), `S.tutStart = {f, land}`, `mapPreload`.
- `core/03-simulation.js`: `TUT_FIELD` (Gisundet nord), `tutFieldAt`, `TUTB` (175 kg/t, 72 % torsk, 18 % sei, 10 % hyse, overalt
  og hele året).
- `ui/07c-handbook.js`: dryppene (`HB`, 26 tips, `HB_GAP` 90 s) og Håndboka-appen.
- `ui/10g-push.js`: `pushAsk`, som venter til veiledningen er ferdig.
- Neste mål: `goals()` i `ui/phone/08-home-papers-merker.js`, med stripe i kroner.
- Målingen: `tut_step`/`tut_done`, `admin_tut`, trakten i admin.

## Det som ikke holder for hele kysten

1. **Feltet kan havne på Senja.** Finner ikke `tutFieldNear` et felt, faller `tutFieldAt()` tilbake til Gisundet nord, uansett hvor
   spilleren starter, og teksten sier «ved Gisundet nord».
2. **Feltet sjekkes ikke mot reglene.** Sør for 62° N kan det havne i et gytefelt for kysttorsk (alt fiske forbudt 1.1–30.4), og
   rundt Oslofjorden er torskefiske forbudt hele året. Da ber veiledningen spilleren bryte en regel.
3. **Samme fiskemiks overalt.** 72 % torsk hele året, også på Sørlandet om sommeren.
4. **Senja-navn i tekster:** `route_empty_fs` («nord i Gisundet»), reserveverdiene i `tutAt`/`tutLandN` («Botnhamn»).
5. **Testen kjører bare fra Vangshamn** (`tut.py`).
6. **Sluttseddelens linje om andre fiskere** og linja om vanlig fiske må virke langs hele kysten, også der det er få NPC-båter og
   ingen andre spillere.

## Den nye første turen (kapittel 1)

Fra 33 steg til rundt 12, og fra rundt 30 til rundt 15 ekte minutter.

| Del | Steg | Hva spilleren gjør og ser |
|---|---|---|
| Åpningen | brevet, båtnavnet, landsdelen | Uendret |
| Naustet | `n1`, `nout` | Én linje som peker på fars torsk: «Fars torsk, 24,6 kg. Slå den.» Så «Gå ut». Kameraet glir ut til båten, og navnet hennes står i tipset |
| Ut | `gps`, `route1`, `cast1` | Kartplotteren. Ett trykk i ringen. «Kast loss» er grå til punktet ligger der, og lyser så. Mens hun går: «Neste» viser ekte tid til framme, og ett lite tips om Kino eller broa som ikke må besvares (V4) |
| Fisket | `fish`, `deck` | «Jukse selv» straks båten er framme. Nappet kommer etter 4–8 s. `deck` kommer ved første fisk over ripa. Fisketid etter V2 |
| Hjem | `route2`, `cast2` | Ett trykk på mottaket, så «Kast loss». «Neste» viser tid til framme |
| Mottaket | `land`, `slip`, `reg`, `goal` | Levering. Sluttseddelen med kr/kg, hva vanlig fiske gir her nå, og hvor mange båter som har levert i dag. Registrering («Senere» står). Til slutt den åpne oppgaven: «Fyll is og kast loss på tur 2», med Neste mål ved siden av |

**Det som tas ut, blir drypp** i Håndboka, utløst når det trengs:

| Tatt ut | Drypp, utløst når |
|---|---|
| `ice` | den åpne oppgaven etter kapittel 1, og ellers «Kast loss» uten is |
| `crew` | fisken hoper seg opp på dekk første gang, eller ved andre levering |
| `vaer` | varselet blir gult for båten første gang |
| `redning` | motorstopp eller grunnstøting første gang |
| `regler` | første gang båten nærmer seg et stengt felt |
| `salg` og topplista | rett etter første levering (prinsipp 9), så etter andre levering |
| `luck`, `haill`, `luckhud` | etter V1 |
| `hud`, `apps`, `book`, `beh`, `legs` | ett drypp hver i kapittel 2, ett om gangen, med 90 s mellom |
| `kino`, `cam` | tipset på vei ut (V4), ellers første lange seiling |

## Fasene

Hver fase passer i én økt og avsluttes med `/lever` og `/okt-slutt`.

**O0. Måling og stikkprøver (først, liten).**
- `tut_step`/`tut_done` får startstedet (havn og landsdel) og `tFish`, de ekte sekundene fra «Ta over» til første fisk om bord.
  Trakten i admin deles opp per landsdel og viser tid til første napp.
- Sjekk om målingen har stoppet, eller om det bare ikke har kommet nye spillere siden 13.10.
- Stikkprøve med dagens kode fra Bergen, Bodø, Båtsfjord og Egersund eller Kristiansand, i januar og i juli: om feltet blir funnet,
  om det er lovlig, hvor langt ut det ligger, og tida til første fisk.
- Filer: `07b-first-trip.js`, `admin/`, en ny migrering. Test: `tut.py` (bare at hendelsene går).

**O1. Hele kysten.**
- `tutFieldNear` foretrekker 1,5–2,5 km og søker videre ut ved behov. Finner den ikke noe, legges flekken i nærmeste lovlige sjø
  ved havna. Senja-feltet brukes aldri utenfor Senja.
- Feltet sjekkes mot regelmotoren for juksa, arten og datoen.
- `TUTB.mix` lages av artene som står der nå, avgrenset til det som tas på juksa, er lovlig der og da, og tas imot av mottaket.
  Mengden er fortsatt garantert.
- Senja-navnene tas ut av reservetekstene.
- Filer: `08c-start.js`, `core/03-simulation.js`, `07b-first-trip.js`, `01-i18n.js`. Test: ny lett `tutcoast.py` fra fem steder
  (sør, vest, midt, nord, øst): feltet, lovligheten, miksen og avstanden.
- Reglene sjekkes mot Fiskeridirektoratet og Lovdata før bygging.

**O2. Fram til første napp (prinsipp 1, 3, 7).**
- Naustet blir én linje og «Gå ut».
- `chip`, `kino`, `kino2`, `cam`, `cam2` og `sail` blir ett tips som ikke må besvares.
- «Kast loss» og «Lever» blir grå knapper med egen tekst på veiledningens steg (`03b-route.js`, `10c-dock.js`).
- Det dempede laget fjernes (V3).
- Filer: `07b-first-trip.js`, `03b-route.js`, `10c-dock.js`, `styles.css`. Test: `tut.py` (ny `ORDER`), skjermbilder 800×1280 og
  1280×800.

**O3. Fisket (prinsipp 1, 2).**
- Fisketida og påfyllingen etter V2. Haillen og `tutWait` i `05-vessels.js` etter V1. `deck` kommer ved første fisk.
- Filer: `07b-first-trip.js`, `core/05-vessels.js`, `core/03-simulation.js`. Test: `tut.py`, `hailltest`.

**O4. Mottaket og slutten (prinsipp 5, 6, 9).**
- Sluttseddelen får linja om vanlig fiske og linja om dagens leveringer på mottaket. Kilden er felles verden der den finnes, ellers
  NPC-flåtens landinger på mottaket. Står ingen andre båter der, skrives linja ikke.
- `goal` slutter med den åpne oppgaven (is og tur 2).
- Stegene som tas ut, blir drypp med utløserne over. `icestep.py` flyttes fra veiledningen til den åpne oppgaven.
- Filer: `07b-first-trip.js`, `07c-handbook.js`, sluttseddelen i `10c-dock.js`. Test: `tut.py`, `hbtest.py`, `icestep.py`.

**O5. Det som skjules (prinsipp 4, 10, etter V7).**
- I kapittel 1 viser knappelinja og telefonen bare det turen bruker. Hver app eller knapp kommer fram med merket «ny» når dryppet
  dens utløses, eller etter kapittel 1 når V7 B er valgt.
- `pushAsk` kommer første gang båten går eller fisker etter kapittel 1, ikke ved slutten.
- Filer: `10c-dock.js`, `ui/phone/`, `07c-handbook.js`, `10g-push.js`. Test: `hbtest.py`, `tut.py`, skjermbilder i begge formater.

**O6. Avslutning.**
- `/stikkprove` av hele første tur i Bergen, Bodø og Båtsfjord, i tillegg til Senja.
- Patchnote: kort, og uten noe om hvorfor.
- Oppdater `opning-og-veiledning.md` og `docs/onboarding.md`, og ta de gamle stegene ut av `TUT_STEPS` i admin.
- Mål trakten i to uker før noe mer endres.

O1 kan gå først, fordi det er en feil i dag for spillere som starter langt fra Senja.

## Valgene

**V1. Haillen på første tur.** Jonas ba 05.10.2026 om fiskelykke og haill like før første fiske. I dag venter båten på feltet til
haillen er hentet.
- **A (anbefalt):** Ingen haill i kapittel 1. Den kommer som drypp etter første levering, med gaven ved registrering. Hvorfor: den
  garanterte flekken skjuler hva haillen gjør, og ventingen kommer før første napp.
- B: Én linje og gratis haill, uten venting.
- C: Som i dag.

**V2. Fisketida på første tur.**
- **A (anbefalt):** 1 spilltime (10 ekte minutter) og rundt 175 kg. Leveringen krever ikke full last. Hvorfor: det halverer den
  lengste ventetida uten å røre den felles klokka.
- B: 2 timer som i dag, med «Jukse selv» straks.
- C: 1 time med sterkere flekk og full last. Det gir enda mer feil forventning.

**V3. Det dempede laget.**
- **A (anbefalt):** Borte overalt. Ringen og knappenes tilstand blir stående.
- B: Bare på første steg (GPS-en).

**V4. Kino og broa på vei ut.**
- **A (anbefalt):** Ett lite tips som ikke må besvares. Hvorfor: det fineste i spillet bør vises, men ikke som en oppgave.
- B: Bare som drypp.

**V5. Is og mannskap.**
- **A (anbefalt):** Is blir den åpne oppgaven ved slutten av kapittel 1, og mannskap blir drypp. Hvorfor: isen er det spilleren
  trenger neste gang, så den egner seg som oppgaven som henger igjen.
- B: Begge blir drypp.

**V6. Obligatorisk.**
- **A (anbefalt):** Fortsatt obligatorisk og uten nødutgang (Jonas 05.10.2026). Turen blir kort og består av ting spilleren gjør.
- B: En knapp «Jeg har spilt før» som hopper til `goal`.

**V7. Hvor mye som skjules i kapittel 1.**
- **A (anbefalt):** Knappelinja og telefonen viser bare det kapittel 1 bruker. Hver app kommer fram når dryppet dens utløses, med
  merket «ny». Hvorfor: det gir progressiv avsløring uten en eneste tekstboks.
- B: Alt kommer fram samlet etter kapittel 1.
- C: Alt synes som i dag.

**V8. Prinsipp 8 og 10 mot reglene i `CLAUDE.md`.** «Tapt forsprang når appen er lukket» kolliderer med «Ingen straff for fravær».
«Nedetid for å forankre spite-spending» kolliderer med «vi legger aldri inn ventetid … for å selge oss forbi den». Reglene står til
du sier noe annet.
- **A (anbefalt):** Reglene står. Tap når appen er lukket kommer bare fra simuleringen selv (fisk uten is, været, ståtid), og vises
  ærlig. Nedetida er den ekte seilingen og fisketida, vist i ekte tid fra første tur, så trim gir mening senere uten at noe er lagt
  til. Ingen salg eller trim i kapittel 1, for gjester kan ikke kjøpe uansett. Hvorfor: reglene er grunnen til at spillet tåler å
  tjene penger på voksne fiskere uten at det oppleves som et mobilspill.
- B: Reglene endres, og det skrives inn i `CLAUDE.md` og `docs/engasjement.md` hva som nå er lov.

## Usikkert

- **Tallene er tynne:** 7 spillere på tre dager. O0 måler tida til første napp per landsdel før og etter.
- **Torskeregler sør for 62° N:** regelmotoren har gytefeltene og Oslofjorden. Annet kystfiske etter torsk i Skagerrak, og juksa for
  andre arter, må sjekkes mot Fiskeridirektoratet og Lovdata før O1. Kildene skrives inn.
- **Fem minutter til første fisk** henger på hvor lang tid brevet og startlista tar (lasting av kartet). Det er ikke målt. Målet
  regnes fra «Ta over».
- **Linja om dagens leveringer** trenger data om andre båter per mottak. Om felles verden har det per mottak, er ikke sjekket. Ellers
  brukes NPC-flåten, som er tynn noen steder.
- Om 1 times fisketid gir en fangst som føles god nok, må spilles.

## Det planen ikke gjør

- Ingen AI-radio og ingen ny VHF.
- Brevet, båtnavnet, startlista og naustet i 3D endres ikke (bare teksten i naustet).
- Ingen endring av den felles klokka eller `GAME_RATE`.
- Ingen ny ventetid, ingen straff for fravær, og ingen salg i kapittel 1.
- Dryppene i kapittel 3–6 endres ikke, utover de nye som kommer fra kapittel 1.

## Status

- 27.10.2026: første utgave av planen (V1–V6).
- 27.10.2026: andre utgave etter Jonas' ti prinsipper: tabellen over prinsippene, O4 og O5 nye, V7 og V8 nye. Venter på svar og
  «kjør på».
- 27.10.2026: **Jonas: 1A 2A 3A 4A 5A 6A 7A 8A, «kjør på»** (svaret kom via Gemini, med to presiseringer). Den ene var å måle tida fra
  landsdelen er valgt til naustet er lastet; det er gjort i O0. Den andre var en hardkodet linje som «I dag har 4 andre båter levert her»
  når det mangler data. Den bygges ikke, fordi det ville være et oppdiktet tall vist som fakta: linja bruker NPC-flåtens leveringer i
  spillet og står ikke når det ingen er (O4).
- 27.10.2026: **O0 og O1 bygd** (`docs/systemer/opning-og-veiledning.md`, «Onboarding 2»). Funn underveis:
  - Selve fisket spør regelmotoren, og båten venter der reglene stopper juksa. Et første felt i et stengt gytefelt ville latt veiledningen
    stå fast. Feltet sjekkes nå mot det.
  - Torskefiske utenfor grunnlinjen i Skagerrak er forbudt for norske fartøy (FOR-2022-12-16-2281 § 1). Regelmotoren mangler dette
    (`BACKLOG.md`).
  - Gytefeltforskriften (FOR-2019-03-25-321 § 1): alt fiske er forbudt 1.1–30.4 i 15 gytefelt fra Indre Oslofjord til Skjernøysund. Det
    står i regelmotoren.
- 27.10.2026: **O0 og O1 rullet ut** på detstorebla.no (PR #26, merge 4993de5; «Appen på Hetzner» og «Appen på GitHub Pages» grønne). Jonas kjørte
  migreringen `20261027120000_tut_time.sql` i SQL-editoren. `tut.py` var grønn liggende; stående sovnet skipperen på feltet i testen
  (klokka går 30× der), og testen vekker den nå med søvnskjermens egen knapp. Jonas valgte å rulle ut uten å vente på en ny kjøring.
- 27.10.2026: **O2 bygd** (`docs/systemer/opning-og-veiledning.md`, «O2»): naustet i én linje, ett lite tips på vei ut, ingen dempet lag,
  «Kast loss» grå med det den venter på. Testes.
- 27.10.2026: **O3, O4 og O5 bygd** sammen med energien som står stille under første tur (Jonas: «Kan vi ikke bare skru av energien til
  etter tutorialen?»). `tut.py` kan kjøres i ett format (`KYST_TUT_ONE`, Jonas: ett format når bare logikken endres).
- 28.10.2026: **O2–O5 rullet ut** (PR #27, merge 91dc790). Testet samlet: `tut.py` i begge formater (26 OK; det eneste røde var `reg` i
  testens forventede rekkefølge, som hoppes over uten skyen), `hbtest`, `icestep`, `tutdrift`, `docktest`, `admintest`. Første tur er nå
  16 steg (fra 33), og tok 19 minutter for testen i begge formater (fra rundt 50).
- 28.10.2026: **O6 påbegynt:** trakten i admin har de nye stegene; `tut.py` kan starte hvor som helst (`KYST_TUT_START=lat,lon`), og hele
  første tur prøves fra Bergen, Bodø og Båtsfjord.

