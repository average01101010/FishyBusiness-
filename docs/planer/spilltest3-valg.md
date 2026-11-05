# Spilltest 3: det som venter på Jonas (plan 05.11.2026)

Bestillingen: økta etter spilltest 3 skulle rette F1–F7 og de enkle UX-funnene (U3, U5, U6, U7, U9, U10, U11), og «lage en plan med valg (/planlegg) for det som krever Jonas' avgjørelse: U1, U2, U4, U8, U12, K1–K3. Ikke bygg noe av dette før Jonas har svart.» Funnene står i `docs/playtest/rapport-3-redskap.md`. Ingenting her er bygd.

## Hva som finnes i dag

- **Tiden:** klokka i HUD-en og ETA går i spilltid. Varighetene skrives med `realDur`/`inReal` (`ui/02-format-state.js`), som deler på `simRate()` og viser ekte tid uten merking. `whenTxt` gir «14:20 · om 12 min». Rutepanelet merker ekte tid («ca. 5 min i ekte tid»).
- **Driften ved redskapet:** båten ligger `idle` og driver for vind og strøm mens redskapet står. Ankeret (`core/06e-anchor.js`, `anchorSpot`) går ikke over 40 m. «Ta opp» i knappelinja (`ui/10c-dock.js` `seaItems`) sier hvor langt det er til nærmeste blåse.
- **Varslene:** `toast` (`ui/02-format-state.js:173`) og `msg` legger meldinger over skjermen. Trofeveggen (`core/09f-merker.js`) og fartstiden (`core/09e-fartstid.js`) sender hver sin.
- **Kongekrabben:** Fiskeguiden (`ui/06f-fishguide.js`) vet utbredelsen; butikkortet for teiner (`ui/phone/12-utstyr-redskap.js`) sier ingenting om den.
- **Juksespillet:** `ui/09-hand-fishing.js`; nappene kommer hvert 21.–56. sekund i ekte tid.
- **Lina:** `docs/systemer/redskap.md` (Kalibrering) sier ca. 110 kg per stamp hyseline etter 12 t i februar; modellen gir 42–76 kg på de beste stedene, og testen fikk 15.

## Fasene (hver passer én økt)

- **P1 Tiden med merking (U1).** Alle varigheter som står i ekte tid, får klokkeslettet i spilltid først og ekte tid etter, merket («ferdig kl. 11:01 · om 47 min i ekte tid»): juksekortet, monteringen, egningen, verkstedet, Driftsplan. Én funksjon (`whenTxt` utvidet) brukt overalt. Filer: `ui/02-format-state.js`, `ui/10c-dock.js`, `ui/phone/12-utstyr-redskap.js`, `ui/10i-shop.js`, `ui/05c-drift.js`. Tester: `tut.py` (tekster i veiledningen), `geartest.py`, skjermbilder i begge formater.
- **P2 Driften ved redskapet (U2).** Avstand og drift til blåsa i HUD-en mens redskap står, en alarm ved en grense, og «Kjør dit» rett fra varselet. Valg V2 avgjør om båten også kan ligge på været. Filer: `ui/04-panels-instruments.js`, `core/10-gear.js` (`gearHour`), `core/06e-anchor.js`. Tester: `geartest.py`, `anchortest`, `fiskeplay.py line garn teiner`.
- **P3 Varslene (U4).** Toasten flyttes over viften og bort fra kortene; rekordene vises i fangstkortet i stedet for som melding; fartstiden går i dagboka. Filer: `ui/02-format-state.js`, `ui/05j-catchfeed.js`, `core/09f-merker.js`, `core/09e-fartstid.js`, `src/styles.css`. Tester: `uiplay.py`, skjermbilder.
- **P4 Kongekrabben på butikkortet (U8)** og **P5 ventetida i juksespillet (U12)**: små, kan tas i samme økt.
- **K1–K3** er tall og ikke kode; de justeres i `core/03f-fiske.js`/`core/10-gear.js` når Jonas har valgt, og måles med `geartest.py` og `fiskeplay.py`.

## Valgene

- **V1 Tiden (U1).**
  - **A (anbefalt):** klokkeslett i spilltid først, ekte tid etter med «i ekte tid» («ferdig 11:01 · om 47 min i ekte tid»). Spilleren ser begge og kan lese klokka i HUD-en mot det.
  - B: bare spilltid overalt («5 t»), ekte tid bare i rutepanelet.
  - C: bare ekte tid, men merket.
  - Hvorfor A: klokka og varigheten henger sammen, og ekte tid er det spilleren planlegger dagen sin etter.
- **V2 Driften (U2).**
  - **A (anbefalt):** avstanden i HUD-en og en alarm når båten er mer enn 1 nm fra blåsa (som en ankeralarm), med «Kjør dit». Båten driver som før.
  - B: som A, og båten «ligger på været» ved redskapet (motoren holder henne innen 0,5 nm, og det koster diesel).
  - C: som B uten dieselkostnad.
  - Hvorfor A: det er ærlig sjømannskap, og spilleren får vite det i tide. B er riktig til sjøs, men da må ståtida ha et mannskap om bord og en kostnad, og det er en større endring.
- **V3 Varslene (U4).**
  - **A (anbefalt):** rekordene i fangstkortet, fartstiden i dagboka (toast bare for hele år etter de fem første), toasten over viften.
  - B: bare flytte toasten; innholdet som før.
  - Hvorfor A: 74 + 51 meldinger i en test drukner det spilleren trenger å se.
- **V4 Kongekrabben (U8, Jonas 20.10.2026: «Ikke vis hint»).**
  - **A (anbefalt):** butikkortet viser utbredelsen som en opplysning, som garnkortet viser maskevidder: «Kongekrabbe · Øst-Finnmark, litt i Vest-Finnmark». Ingen råd om hvor du bør dra.
  - B: ingenting på kortet; spilleren må lese Fiskeguiden.
  - Hvorfor A: en ny spiller i Senja brukte 98 000 kr og fikk 932 kr. Opplysningen er tilstanden slik den er, ikke et tips.
- **V5 Juksespillet (U12).**
  - **A (anbefalt):** et lite dupp i snøret og en svak lyd 1–3 s før nappet, tilfeldig også uten napp etter (falske dupp), så ventetida får liv.
  - B: kortere tid mellom nappene (10–30 s).
  - Hvorfor A: ventetida er ekte fiske; B endrer fangsten per time.
- **V6 Balansen (K1–K3).**
  - K1 Lofoten i mars: **A (anbefalt):** heve torsketettheten i Vestfjorden i februar–april til Husøy-nivå (rundt 3 innen 12 km), med Fiskeridirektoratets fangstdagbøker som kilde. B: la det stå (backloggen 10.5).
  - K2 Lina: **A (anbefalt):** kalibrere modellen opp til dokumentets 110 kg per stamp på et godt hysested etter 12 t, og la plasseringen avgjøre resten. B: senke dokumentets tall til det modellen gir (60 kg).
  - K3 Fartstiden: **A (anbefalt):** la «år» stå (det er bestemt), men vise det i dagboka i stedet for som toast (følger V3). B: telle i måneder de første ukene.

## Antatt eller usikkert

- Tallene i rapporten er én kjøring med ett frø (`seed=1`) og skriptet setter selv sted, tid og energi; drift og fangst kan variere med frøet.
- K1: Lofotens skreitall må hentes fra Fiskeridirektoratets fangstdagbøker eller sluttsedlene før det endres; det er ikke gjort i denne økta.
- K2: hvor mye av lav linefangst som skyldtes at agenten satte lina ut fra hysefeltet og ikke langs det, er ikke målt.

## Hva planen ikke gjør

- Ingen nye varsler for ekte penger eller fravær (`docs/push-plan.md` står).
- Ingen endring i reglene for blåkveite eller kongekrabbe; bare hvordan de vises.

## Status

- 05.11.2026: planen skrevet. Venter på Jonas' valg V1–V6.
