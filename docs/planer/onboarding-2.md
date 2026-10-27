# Onboarding 2: en kortere og lettere første tur, for hele kysten (plan 27.10.2026)

> Plan etter `/planlegg`. Ingenting er bygd. Venter på Jonas' svar på valgene V1–V6 og «kjør på».

## Hva Jonas ba om

27.10.2026: «re-design av tutorial/on-boarding for å gjøre opplevelsen bedre for brukerne. Husk at spillet dekker hele norskekysten,
ikke bare Senja. Det må vi ta høyde for.» Med et utdrag fra en samtale med Gemini. Hovedpunktene derfra:

- Behold brevet, båtnavnet, landsdelen, den garanterte første fangsten, «Senere» på registreringen og dryppene.
- Kutt: de sju «Skjønner»-boksene på vei hjem (`tour`, `hud`, `apps`, `vaer`, `salg`, `regler`, `redning`), haill på første tur,
  is og mannskap ved mottaket. Slå sammen `n1`–`n3`.
- Fjern det dempede laget med hull og ring. Led med knappenes tilstand og korte tekster («Legg inn rute for å kaste loss») i stedet.
- Ikke AI-radio (Gemini trakk det selv tilbake: «feature creep»).

## Hva målingene sier (skyen, `events`, 27.10.2026)

Få spillere, så dette er et signal og ikke et bevis. Bare spillere som deler bruksstatistikk, er med.

- **7 spillere** startet veiledningen 11.–13.10.2026. Ingen nye siden 13.10.
- **Ingen sendte `tut_done`.** Ingen kom så langt som til `land`.
- **4 av 7 stoppet på steget `sail`**, altså mens båten gikk ut til feltet, etter kino- og kamerastegene. Tre av dem kom aldri tilbake.
- Én kom forbi `sail` (175 s på det steget), fikk haillen og fisket, og stoppet ved `deck`.
- `n1` tok 10 s i median, `n2`, `n3`, `nout` og `intro` 1–2 s. Altså trykket spillerne bare videre.

**Det betyr:** spillerne faller av i ventetida før første napp, ikke i informasjonsdumpen på vei hjem. Den nådde ingen. Gemini har
rett i at hjemturen er for tung, men det viktigste er tida fra «Ta over» til første fisk.

**Tida i dag**, regnet fra koden: med `GAME_RATE` 6 er én spilltime 10 ekte minutter. Trebåten går 6 knop, og feltet ligger 1,5–6 km
ut (`tutFieldNear`), så turen ut tar 1,5–5,5 ekte minutter. Fisketida er 2 spilltimer, altså 20 ekte minutter (350 kg rom ved
rundt 175 kg/t). Deretter kommer turen hjem og leveringen. Kapittel 1 tar dermed rundt 30 ekte minutter og har 33 steg. Målet i
`docs/onboarding.md` var «første napp innen fem ekte minutter».

## Hva som finnes i dag

- `ui/07b-first-trip.js`: `TSTEPS` (33 steg), `tutAllow` (bare «Kast loss», nye rutepunkter og levering sperres; resten av UI-et er
  åpent), `tipPlace` (boksen, `#tutDim` og `#tutRing`; `nodim` og `small` finnes alt), `tutAdrift`.
- `ui/08c-start.js`: startlista for hele kysten, `tutFieldNear` (beste torsk 1,5–6 km ut, 20–150 m dybde, under båtens grense for
  sjø), `S.tutStart = {f, land}` (mottaket på startstedet, Botnhamn fra Vangshamn), `mapPreload`.
- `core/03-simulation.js`: `TUT_FIELD` (Gisundet nord), `tutFieldAt`, `TUTB` (175 kg/t, 72 % torsk, 18 % sei, 10 % hyse, overalt
  og hele året), `tutBonus`.
- `ui/07c-handbook.js`: dryppene (`HB`, 26 tips, `when()`, `HB_GAP` 90 s) og Håndboka-appen.
- Målingen: `tut_step`/`tut_done`, `admin_tut`, trakten i admin.

## Det som ikke holder for hele kysten (funnet i gjennomgangen)

1. **Feltet kan havne på Senja.** Finner ikke `tutFieldNear` noe felt (ingen 20–150 m dybde innen 6 km, eller sjøen er over
   grensen overalt), settes ikke `S.tut.f`. Da faller `tutFieldAt()` tilbake til `GROUNDS[TUT_FIELD]`, som er Gisundet nord.
   Spilleren i for eksempel Kristiansand får da en ring i Troms. Teksten faller samtidig tilbake til «ved Gisundet nord».
2. **Feltet sjekkes ikke mot reglene.** `tutFieldNear` spør ikke regelmotoren (`03e-rules.js`). Fra 1.1. til 30.4. kan feltet havne i
   et gytefelt for kysttorsk sør for 62° N, der alt fiske er forbudt. Rundt Oslofjorden er torskefiske forbudt hele året, og bare
   håndholdt redskap er lov. Da ber veiledningen spilleren om å bryte en regel.
3. **Samme fiskemiks overalt.** Flekken er 72 % torsk hele året, også på Sørlandet om sommeren, der det ikke står skrei. Den gir
   også feil forventning (backloggen 10.2).
4. **Senja-navn igjen i tekster:** `route_empty_fs` («nord i Gisundet»), reserveverdiene i `tutAt`/`tutLandN` («Botnhamn»).
5. **Testen kjører bare fra Vangshamn.** `tut.py` velger `vangshamn`. Ingen test viser at første tur går fra Bergen, Bodø,
   Båtsfjord eller sørkysten.

## Den nye første turen (kapittel 1)

Fra 33 steg til rundt 14, og fra rundt 30 til rundt 15 ekte minutter. Målet er første napp innen 5 minutter etter «Ta over».

| Del | I dag | Nytt |
|---|---|---|
| Åpningen | brevet, båtnavnet, landsdelen | uendret |
| Naustet | `n1`, `n2`, `n3`, `nout`, `intro` | `n1` blir én linje som peker på fars torsk, så «Gå ut». `intro` blir én linje mens kameraet glir |
| Ut | `gps`, `route1`, `fish2`, `cast1`, `chip`, `kino`, `kino2`, `cam`, `cam2`, `sail` | `gps`, `route1`, `cast1`. Mens båten går, kommer ett lite tips som ikke må besvares: «Prøv Kino eller broa mens hun går» (V4) |
| Fisket | `luck`, `haill`, `luckhud`, `fish`, `deck`, `full` | `fish` («Jukse selv» med en gang hun er framme), `deck` ved første fisk over ripa, ikke ved full last. Haill etter V1 |
| Hjem | `route2`, `cast2`, `legs`, `tour`, `hud`, `apps`, `vaer`, `salg`, `regler`, `redning` | `route2`, `cast2`. Resten blir drypp |
| Mottaket | `land`, `slip`, `reg`, `book`, `ice`, `beh`, `crew`, `goal` | `land`, `slip` (med en linje om at første tur var ekstra god, og hva vanlig fiske her gir nå), `reg` («Senere» står), `goal` |

**Dit det som tas ut, går.** Det blir drypp i Håndboka, utløst når det gjelder:

| Steg som tas ut | Nytt drypp, utløst når |
|---|---|
| `ice` | spilleren ligger ved et mottak uten is før neste avgang, eller trykker «Kast loss» uten is |
| `crew` | fisken hoper seg opp på dekk første gang (sløyinga henger etter), eller ved andre levering |
| `vaer` | varselet blir gult for båten første gang |
| `redning` | motorstopp eller grunnstøting første gang (den første redningen er gratis, så det mister ingen noe på) |
| `regler` | første gang båten nærmer seg et stengt felt eller en regel i statusboksen |
| `salg` | etter andre levering |
| `hud`, `apps`, `book`, `beh` | ett drypp hver i kapittel 2, ett om gangen, med 90 s mellom som i dag |
| `kino`, `cam` | tipset på vei ut (V4), ellers et drypp på neste lange seiling |

**Visningen (V3):** Det dempede laget tas bort. Ringen rundt knappen og tipsboksen blir stående. Der en handling ikke er klar ennå,
er knappen grå og sier selv hva som mangler. «Kast loss» sier for eksempel «Legg et punkt i ringen først» i stedet for å vise en
toast. Sperrene i `tutAllow` blir som i dag, for de er bare tre. Det meste av UI-et er alt åpent; det var «Skjønner»-stegene som
føltes som et tvunget løp.

**Obligatorisk (V6):** Turen er fortsatt obligatorisk, slik Jonas bestemte 05.10.2026. Når den er kort og bare består av ting
spilleren gjør, trengs ingen nødutgang.

## Fasene

Hver fase passer i én økt og avsluttes med `/lever` og `/okt-slutt`.

**O0. Måling og stikkprøver (først, liten).**
- `tut_step` og `tut_done` får med startstedet (`home`, landsdelen) og `tFish`, de ekte sekundene fra «Ta over» til første fisk om
  bord. Trakten i admin kan da deles opp per landsdel og vise tid til første napp.
- Sjekk hvorfor ingen nye spillere er målt siden 13.10.2026. Er det bare ingen nye, eller har målingen stoppet?
- Stikkprøve med dagens kode fra Bergen, Bodø, Båtsfjord og én havn på sørkysten (Egersund eller Kristiansand), i januar og i juli:
  ble feltet funnet, er det lovlig, hvor langt er det, og hvor lang tid går fra start til første fisk?
- Filer: `07b-first-trip.js`, `admin/`, en ny migrering. Test: `tut.py` (bare at hendelsene går).

**O1. Hele kysten (robusthet).**
- `tutFieldNear` søker videre ut (opp til 10 km, så grunnere eller dypere vann). Finner den fortsatt ikke noe, legges flekken i
  nærmeste lovlige sjø ved havna. Senja-feltet brukes aldri utenfor Senja.
- Feltet sjekkes mot regelmotoren for juksa, arten og datoen: ingen stengte felt, gytefelt eller forbud. Helst ligger det 1,5–3 km
  ut, så første napp kommer fort.
- `TUTB.mix` lages av de artene som faktisk står på feltet nå (`density` per art), avgrenset til arter som tas på juksa, som er lovlige
  der og da, og som mottaket tar imot. Mengden er fortsatt garantert.
- Senja-navnene tas ut av reservetekstene og `route_empty_fs`.
- Filer: `08c-start.js`, `core/03-simulation.js`, `07b-first-trip.js`, `01-i18n.js`. Test: ny lett test `tutcoast.py`, som starter
  første tur fra fem steder langs kysten (sør, vest, midt, nord, øst) og sjekker felt, lovlighet, miks og avstand.
- Reglene sjekkes mot kildene før bygging (se «Usikkert»).

**O2. Fram til første napp.**
- Naustet blir én linje og «Gå ut». `fish2` ligger igjen bare som sikkerhetsnett (den løser seg allerede av seg selv).
- `chip`, `kino`, `kino2`, `cam`, `cam2` og `sail` tas ut som steg. Inn kommer ett lite tips som ikke må besvares (V4).
- `fish` kommer med en gang båten er framme. `deck` kommer ved første fisk over ripa.
- Filer: `07b-first-trip.js`. Test: `tut.py` (ny `ORDER`), begge formater.

**O3. Fisket og haillen (V1, V2).**
- Fisketida og påfyllingen etter V2. `luck`/`haill`/`luckhud` og `tutWait` i `05-vessels.js` etter V1.
- Sluttseddelen får en linje om at første tur var ekstra god, og hva vanlig fiske gir her nå (stryker backloggen 10.2).
- Filer: `07b-first-trip.js`, `core/05-vessels.js`, `core/03-simulation.js`, sluttseddelen i `10c-dock.js`. Test: `tut.py`,
  `hailltest`.

**O4. Hjem og levering.**
- Ta ut `legs`, `tour`, `hud`, `apps`, `vaer`, `salg`, `regler`, `redning`, `book`, `ice`, `beh` og `crew`.
- De nye dryppene i `HB` med utløserne i tabellen over. `icestep.py` flyttes fra veiledningen til drypp.
- Filer: `07b-first-trip.js`, `07c-handbook.js`. Test: `tut.py`, `hbtest.py`, `icestep.py`.

**O5. Visningen (V3).**
- Ta bort `#tutDim`. Ringen og boksen blir stående.
- Grå knapper med egen tekst for «Kast loss» og «Lever» på veiledningens steg.
- Filer: `07b-first-trip.js`, `styles.css`, rutepanelet (`03b-route.js`). Test: `tut.py`, `hbtest.py`, skjermbilder 800×1280 og
  1280×800.

**O6. Avslutning.**
- `/stikkprove` av hele første tur i Bergen, Bodø og Båtsfjord, i tillegg til Senja.
- Patchnote (kort, uten noe om hvorfor). Oppdater `opning-og-veiledning.md` og `docs/onboarding.md`. Fjern de utdaterte stegene i
  `TUT_STEPS` i admin.
- Mål trakten i to uker før noe mer endres.

O1 kan gå før O2–O5, for det er en feil for spillere som starter langt fra Senja i dag.

## Valgene

**V1. Haillen på første tur.** Jonas ba 05.10.2026 om at fiskelykke og haill skulle vises like før første fiske. I dag venter båten
på feltet til haillen er hentet (tre steg).
- **A (anbefalt):** Ingen haill i kapittel 1. Den kommer som drypp etter første levering, sammen med gaven ved registrering.
  Hvorfor: den garanterte flekken skjuler uansett hva haillen gjør, og ventingen sperrer det første nappet.
- B: Én kort linje om fiskelykke og en gratis haill, men båten fisker uten å vente.
- C: Som i dag.

**V2. Fisketida på første tur.**
- **A (anbefalt):** 1 spilltime (10 ekte minutter) og rundt 175 kg. Leveringen er ikke avhengig av full last, og sluttseddelen
  forklarer at turen var god. Hvorfor: det halverer den lengste ventetida uten å endre den felles klokka.
- B: 2 timer som i dag, men «Jukse selv» kommer med en gang, så tida fylles med noe å gjøre.
- C: 1 time med en sterkere flekk, så rommet blir fullt likevel. Det gjør forventningen enda mer feil (backloggen 10.2).

**V3. Det dempede laget.**
- **A (anbefalt):** Borte overalt. Ringen og boksen blir stående, og knappene sier selv hva som mangler. Hvorfor: det er det voksne
  spillere reagerer på, og ringen peker like godt.
- B: Bare på første steg (GPS-en), der spilleren ikke vet hvor noe er ennå.
- C: Som i dag.

**V4. Kino og broa på vei ut.**
- **A (anbefalt):** Ett lite tips som ikke må besvares mens båten går. Hvorfor: det er det fineste i spillet og bør vises, men det
  skal ikke være en oppgave.
- B: Bare som drypp, på neste lange seiling.
- C: Som i dag (fire steg).

**V5. Is og mannskap.**
- **A (anbefalt):** Begge blir drypp. Is kommer ved neste avgang uten is, og den første fyllingen er fortsatt gratis. Mannskap kommer
  når fisken hoper seg opp på dekk. Hvorfor: der lærer spilleren hvorfor det trengs.
- B: Is blir i kapittel 1 (fordi tur 2 uten is gir dårligere pris), og mannskap blir drypp.

**V6. Obligatorisk.**
- **A (anbefalt):** Fortsatt obligatorisk og uten nødutgang, slik Jonas bestemte 05.10.2026. Turen blir kort og består av ting
  spilleren gjør.
- B: En knapp «Jeg har spilt før» på startskjermen som hopper til `goal`, med den garanterte fangsten slått av.

## Usikkert

- **Tallene er tynne.** 7 spillere i tre dager. At de falt av under seilingen ut, er det beste signalet vi har, men det kan også ha
  vært lasting, 3D eller noe annet. O0 måler tida til første napp per landsdel før resten bygges, og etter.
- **Regler for torsk sør for 62° N:** regelmotoren har gytefeltene (1.1–30.4) og Oslofjorden. Om annet kystfiske etter torsk i
  Skagerrak, eller juksa for de andre artene, er regulert, må sjekkes mot Fiskeridirektoratet og Lovdata før O1 bygges. Kildene
  skrives inn.
- **Tida ut regnet fra koden,** ikke målt: 1,5–6 km ved 6 knop. Det kan bli lenger med Autonav rundt holmer.
- Om tidsforbruket med 1 time fisketid holder for en fangst som føles god, må spilles.

## Det planen ikke gjør

- Ingen AI-radio og ingen ny VHF.
- Brevet, båtnavnet, startlista og naustet i 3D endres ikke (bare tekstene i naustet).
- Ingen endring av den felles klokka eller tempoet (`GAME_RATE`). Første tur får ikke spole fram.
- Dryppene i kapittel 3–6 endres ikke utover de nye fra kapittel 1.

## Status

- 27.10.2026: planen skrevet. Venter på svar på V1–V6 og «kjør på».
