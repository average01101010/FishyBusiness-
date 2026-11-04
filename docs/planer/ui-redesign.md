# UI-redesign: «Kystlys» (plan 04.11.2026)

> Vedtatt 04.11.2026: Jonas valgte A på alle seks (V1–V6) og sa «kjør på». U0 er i gang.

## Hva Jonas ba om

> «Jeg ønsker å la en playwright-agent prøve å spille "Det Store Blå" der formålet er en å re-designe alt av UI på en mer intuitiv måte som ser mer "polished" ut og gir utrykk av et spill som er lanseringsklart.» (03.11.2026)

> «Jeg vil at playwright-agenten har mulighet til å gå gjennom alt av UI, og kommer med innovative løsninger og måter for hvordan et re-design kan gjennomføres slik at alt er mer forståelig og intuitivt for brukerne samtidig som det har et bra design og uttrykk.» (04.11.2026)

Undersøkelsene kjøres bare i liggende format inntil videre (Jonas 04.11.2026). Telefonen er «ikke det største UI-problemet» (Jonas 04.11.2026).

## Slik ble det undersøkt

- `tests/uiplay.py` spiller fra en ny start: konvolutten, brevet, startstedet, båten og hele «Første tur». Ringen i veiledningen trykkes slik `tut.py` gjør. Etterpå går skriptet gjennom alt:
  - knappelinja og hver vifte
  - alle 21 skuffesidene, med faner og rullet til bunnen
  - alle 23 appene, med faner
  - dagboka med fanene, kartplotteren og ruta, og puben
- Det tar et bilde av hvert steg (`tests/out/uiplay/liggende/NN_*.png`, 113 bilder i runde 3) og lagrer en designtelling per bilde (`census.json`): skriftstørrelser, fonter, farger, bakgrunner, radier og knappestiler.
- Fire analyseagenter vurderte hver sin del av bildene. Del 1 var åpningen, veiledningen og knappelinja. Del 2 var skuffesidene. Del 3 var telefonen. Del 4 var dagboka, kartplotteren, HUD-en og designsystemet. Funnene under er samlet fra dem og fra det jeg så selv. Spilltest 2 (`docs/playtest/rapport-2.md`) er tatt med der den sier det samme.
- **Svakheter i undersøkelsen:**
  - Veiledningen låste seg i runde 3 (se F1). Derfor er knappelinja og skuffesidene fotografert med båten på sjøen og ikke i havn, og noen havnesider viser bare «ikke her».
  - Bildet av puben viste ikke puben, trolig fordi 3D ikke rakk å tegne.
  - Garderobe-appen åpner ikke som side.
  - Stående format er ikke undersøkt.

## Hovedfunnene

1. **Fire visuelle språk uten roller.** Mørkt glass (knappelinja, kamera, telefonknappen), lyse krem-kort (dialoger, tips, skuffen), monospace ECDIS-stripe (kartplotteren) og papir med håndskrift (brevet, dagboka) står side om side på samme skjerm. På bilde 13 ligger fire av dem samtidig.
2. **Designtellingen.** Over 113 bilder, uten 3D-etiketter under 5 px og brøkstørrelser fra `clamp`/`vw`, er det rundt 22 ekte skriftstørrelser fra 8 til 30 px. Elleve av dem ligger mellom 9 og 14 px. Det er 77 tekstfarger, 172 bakgrunnsfarger (minst sju nesten like marineblå), 24 radier og 60 knappestiler. Stilarket har 408 ulike hex-verdier og 174 rgba-verdier, mot 451 `var(--…)`. Et polert spill har rundt 7 størrelser, 10–12 flater, 4 radier og 3–4 knapper.
3. **Fangsten, selve kjernen, synes ikke.** Under fisket er det eneste tegnet «Dekk: 6 kg» i statuslinja og at «Last» stiger i HUD-tabellen (bilde 13–15). Spilltest 2 sa det samme: spilleren «forsto aldri hva som avgjør fangsten».
4. **HUD-en er et feilsøkingspanel.** Den er en tabell med 9–11 like rader: Vind, Bølger, Stabilitet, Regler, Drivstoff, Last, Energi, Bonus og Kulde. Det som er viktig nå, får ikke plass foran resten. Varselrader («synkronrulling» i oransje) dukker opp uten forklaring, og i kartplotteren står den oppå ECDIS-stripa som viser mye av det samme.
5. **Veiledningen og meldingene krangler.** Tipsene dekker HUD-en eller havner bak skuffen (8, 11, 16, 17, 22). De viser til ting som ikke er på skjermen: «GPS-en» (minikartet), «Neste», «Kino», «ringen der» og Botnhamn utenfor bildet. Kremfargede tips og mørke toast-meldinger kommer samtidig, ofte med motstridende eller gammelt innhold (10, 12, 20–23).
6. **Knapper som ikke kan brukes, sier ikke hvorfor.** Grå knapper står i knappelinja, i skuffen og i butikkene (29, 34, 41, 48, 53, 54). Grunnen står et annet sted eller kommer som feilmelding etter trykket. Grått ligner den lyse sekundærknappen. Agn alene har 14 grå knapper (54).
7. **Tekstvegg først, handlingen under bretten.** Rigg, Utstyr, Mannskap, Bank (13 linjer om skatt) og Verksted begynner med avsnitt (27, 34, 40, 41, 47, 48). Kvote er lovtekst (Deltakerloven § 6, «1 G», B<sub>pa</sub>/B<sub>lim</sub>). Fagord forklares ikke: juksa, bløggekar, sløy, blåse, synkronrulling, åpen gruppe, maksimalkvote, WP, SOG, XTE.
8. **Informasjonsarkitekturen er spredt.**
   - 21 skuffesider overlapper. De dekker de tre handelsstedene, båten og rederiet, og navnene er ikke de samme overalt («Bygd, Ansatte» / «Mannskapsbørsen», «Butikk › Fiskeutstyr» finnes ikke, «Oppgrader» / «Oppgraderinger»).
   - Telefonen har 23 apper. Bare 6–7 synes uten å rulle, og det er derfor Kvote og Regler aldri ble åpnet.
   - Kaiboden, Haill og Trim er tre ikoner til én butikk.
9. **Tomme tilstander peker ingen vei.** Eksempler er «Ingen garn om bord», «Ingen mannskap», «Arbeidskø 0/6 · Ingen jobber», «Ingen meldinger.» og malerverkstedet med én linje (26, 39, 49, 58, 60, 65).
10. **De store øyeblikkene feires ikke.** Sluttseddelen etter første tur (12 852 kr) er et skjema. Seks gaver kommer som like linjer i en dialog, og kassa hopper fra 15 000 til 80 014 kr uten at noe skjer på skjermen (bilde 18–22 i runde 2).
11. **Lagene har ingen regel.** «Første uke på sjøen» står midt på skjermen mens telefonen og viften fra knappelinja er åpne, og ingenting dimmes. Dagens z-verdier: skuff 70, bok 55, telefon 60, dialog 30 (under telefonen), veiledning 61–63, toast 20 (under boka), `.cashfx` 99999.
12. **Det som allerede er godt, og som redesignet bygger på:**
    - konvolutten og brevet
    - naustet i 3D med gullringen
    - dialogen «Båten etter far» (krem, Source Serif kursiv, magenta knapp), som er mønsteret for dialoger
    - Kystpostens avistypografi
    - «Kan jeg fiske her? Ja» i Regler
    - MAYDAY-siden i Redning
    - bildene av båtene i båthandelen
    - Fiskeguiden

## Feil som ble funnet underveis (rettes for seg, uavhengig av valgene)

- **F1 Veiledningen låser seg** (H): på steget `route2` peker ringen på «Autonav», men skuffen «Beholdning» står åpen fra fiskesteget og dekker knappen. Skriptet trykket i ringen 900 ganger, og spilletiden gikk rundt 30 timer med fisk om bord. Runde 2 slapp unna fordi skuffen var lukket. Etterpå sto «Lukk telefonen først» fast over telefonen i alle 45 bildene av appene. Retting: et steg lukker panelene som dekker målet (`ui/07b-first-trip.js`).
- **F2 Sidefeil i `havNear`** fra `npcStates`, `renderDyn`, `tick`, to ganger under seilingen til Botnhamn: «Cannot read properties of undefined (reading 'x')».
- **F3 Håndskriften er ikke innebygd**: `.bk-et`, `.bk-gt`, `.bk-sn`, `.hw` og `.lg td` ber om Segoe Print, Bradley Hand og Comic Sans, og faller til en ukjent `cursive` på Android. Caveat er innebygd. Rock Salt brukes to steder.
- **F4 «Start på nytt»** står rett under Regnskap på havnesiden (50). (Den har et `confirm`-varsel; testen trykket det bort. Feilen er plassen: den står også i rødt under Innstillinger.)
- **F5 Lever-siden** sier «Prislisten under», men ingenting står under (52).
- **F6 «Kjøp (test, ingen betaling)»** sto i Kaiboden (82–84). Ikke en feil: `shopMode` (`ui/10i-shop.js`) gir «test» bare når skyen er av (utvikling og tester) eller for admin; spillerne ser «Kjøp · kr» eller «Snart i salg».
- **F7 Prisene spriker**: torsk 59,52 kr i Kystposten, 60 kr i lokalsaken og 56,98 kr i Salgslaget samme dag (63, 64, 67). Det kan være riktig (ulike mottak eller tider), men det står ikke.

## Designsystemet «Kystlys»

Tanken er et styrhus om natta: instrumentene lyser svakt, loggboka ligger på bordet, og en varm lykt viser vei. Hvert av de fire språkene får én rolle og bare den:

| Språk | Rolle | Brukes til |
|---|---|---|
| **Instrument** (mørkt glass) | Det som ligger over havet | HUD, knappelinja, toppstripa, fangstkortene |
| **Kort** (lyst) | Der du arbeider | Skuffen, telefonens apper, dialoger |
| **ECDIS** | Bare inne i kartet | Kartplotterens stripe og kartet, aldri som pynt |
| **Papir** | Det som er skrevet | Dagboka, brevene, sluttseddelen. Caveat for håndskrift, Source Serif for trykk |
| **Krem** | Bare veiledningen | Tips og ringen. Spilleren lærer at krem betyr «gjør dette» |

- **Farger:**
  - Flater: `--s-deep #0B1720`, `--s-glass rgba(11,23,32,.78)`, `--s-raised #15252F`, `--s-card #FBFCF8`, `--s-card-2 #EEF2F0`, `--s-paper #F2E8D2`, `--s-guide #FFFBE9`
  - Tekst: `--t-on-dark #EEF4F7`, `--t-on-dark-2 rgba(238,244,247,.68)`, `--t-ink #16323F`, `--t-muted #5B727C`, `--t-pen #1F2F6E`
  - Aksent: `--a-primary #B5227A` (bare primærhandling og aktiv rute, aldri «Lukk»), `--a-focus #E8C96A` (veiledningens ring)
  - Status: `--ok`, `--warn`, `--bad` som i dag
  - Fiskefelt: `--fish #2FA0A0`, ikke rødt, fordi rødt betyr fare ellers
- **Typografi** (Archivo, med mono bare for instrumenttall), laveste størrelse 11 px:

  | Trinn | Størrelse/linjehøyde | Bruk |
  |---|---|---|
  | cap | 11/14 600, versaler | etiketter |
  | sm | 13/18 | |
  | body | 15/22 | |
  | lg | 17/24 600 | |
  | h3 | 20/26 600 | |
  | h2 | 26/32, Source Serif kursiv | titler på dialoger og sider |
  | num | 18/22 mono | instrumenter |
  | hand | 20/24 Caveat | bare på papir |

- **Avstand, radier og høyder:**
  - Avstand: 4, 8, 12, 16, 24 og 32.
  - Radier: 4 (merke), 8 (knapp og felt), 14 (kort og panel) og 999 (pille og rund).
  - Høyder: knapp minst 44 px, handlingsknapp 56 px.
- **Fire knapper:**
  1. Primær: magenta fyll.
  2. Sekundær: kant eller hevet flate.
  3. Instrument: rund glassknapp, 56 px.
  4. Lukk eller ikon: nøytral, 44 px.

  En knapp som ikke kan brukes, sier alltid grunnen i seg selv, for eksempel «Kjøpes i Tussøy · 10 nm», «Krever linehaler →» eller «Må i havn». Den er ikke bare grå.
- **Lag med regel:**

  | Lag | Plassering |
  |---|---|
  | 0 | 3D og kart |
  | 10 | HUD |
  | 20 | knappelinja |
  | 30 | skuff |
  | 40 | bok |
  | 50 | telefon |
  | 60 | dialog (dimmer alt under) |
  | 70 | veiledning |
  | 80 | toast og feiring |
  | 90 | sperrer (søvn, innlogging, lasting) |

  Bare ett av lagene 30–50 kan være åpent om gangen. Veiledningen får aldri dekke det den peker på. Mens et tips står, holdes toast-meldingene tilbake.
- **Målet for tellingen:** høyst 10 skriftstørrelser, 25 bakgrunner og 6 radier, uten etiketter under 5 px. `uiplay.py` blir målingen før og etter hver fase.

## De nyskapende grepene

1. **Fangsten i sentrum** (løser funn 3 og spilltest 2):
   - Hver fisk over ripa gir et lite instrumentkort som glir inn: «Torsk 4,2 kg · godt bløgget · ca. 85 kr».
   - Kortene samles i en teller med kg per time og en lasteromsmåler som fylles.
   - Ved første fisk går kameraet ned på dekk, så bløggekaret synes.
   - Etter hvert trekk kommer én linje om hvorfor: felt, tetthet, vær, redskap og mannskap.
2. **HUD-en blir instrumenter, med progressiv avsløring:**
   - Fire faste målere i én rad: Drivstoff, Last, Energi og Vær (vind og bølger i ett symbol med farge for trygt, grenseland og farlig).
   - Under dem kommer bare de varslene som gjelder nå, som én rad med hva du bør gjøre («Synkronrulling: endre kurs eller fart»).
   - Trykk gir hele tabellen.
   - For en ny spiller kommer HUD-en fram gradvis: kartet først, så Last ved første fisk, så Vær ved første tur ut.
3. **Én kontekstuell hovedknapp:**
   - Knappelinja får én stor primærknapp som følger tilstanden: «Begynn å fiske», så «Sløy fangsten», så «Til mottaket · Botnhamn 3 nm», så «Lever alt».
   - Resten ligger i en ⋯-vifte.
   - Knapper som ikke kan brukes, skjules eller viser grunnen før trykket.
   - Hvert ikon er unikt («Hvil» og «Naustet» er ikke lenger samme hus).
4. **Veiledningen eier skjermen mens den snakker:**
   - Hvert steg lukker paneler som er i veien, panorerer kartet til målet og tegner ringen rundt målet, med tipset festet til ringen og aldri oppå HUD-feltet det handler om.
   - Bare én stemme snakker om gangen.
   - Tipsene bruker navnene på skjermen («kartet», ikke «GPS-en»).
5. **Handelsstedet er et sted, ikke en liste:**
   - Skuffens 21 sider samles til fem innganger: **Butikken**, **Mottaket**, **Verftet**, **Båten** og **Rederiet**.
   - Til sjøs har hvert sted et hode med navn, avstand, tid og en stor «Seil dit». Varene kan ses, men ikke kjøpes.
   - I havn blir hodet «Du er her», og knappene våkner.
   - Én felles varekomponent: bilde, navn, én nytte-linje, «Har», og pris med grunnen i selve knappen.
   - Primærhandlingen står fast nederst: Lever alt, Fyll diesel og is, Sett ut.
6. **Ordbok i teksten.** Fagord får en prikket understrek, og et trykk gir én setning på vanlig norsk og et lite bilde. Lovtekst og kilder legges bak «Mer». Hver side og app begynner med én setning som svarer på spørsmålet sitt, og så kommer detaljene.
7. **Telefonen svarer før du spør:**
   - Hjemskjermen blir et varselsenter: «Du kan fiske torsk her ✓», «Kvote: 0 av 4,3 t», «Torsk 57 kr i Vangshamn», «Rederiet trenger deg». Hvert kort åpner riktig app på riktig fane.
   - Felt i HUD-en åpner riktig app («Lov her ›» åpner Regler, «Bonus» åpner Salgslaget).
   - Telefonen åpner på hjemskjermen og ikke i appen fra sist.
8. **De store øyeblikkene feires:**
   - Sluttseddelen blir et papir som skrives ut, med beløpet som telles opp inn i kassa.
   - Gaver og milepæler kommer én og én som kort i feiringslaget, med det de gir, synlig.
   - Første levering er en scene og ikke et skjema.

## Fasene (hver passer én økt, liggende og stående skjermbilder før levering)

| Fase | Bygger | Filer | Tester |
|---|---|---|---|
| **U0** Feilene | F1–F6 | `ui/07b-first-trip.js`, `core/07e-havn.js` eller der `havNear` står, `styles.css` (fontene), `ui/phone/02-havn-last-agn-ordre.js`, `ui/phone/01-haill-fiske-service.js` | `tut.py` i begge formater, `uiplay.py` |
| **U1** Tokens og lag | Tokenene og z-skalaen i `:root`. De gamle navnene (`--ink`, `--mag` …) står som aliaser. Ingen synlig endring utenom fontene. | `styles.css` | `uishots.py`, `uiplay.py` (tellingen før og etter) |
| **U2** Komponentene | Knapp (4 varianter, med grunn når den ikke kan brukes), kort, fane, varekort, tom tilstand og ordbok-understrek, som `.c-*`-klasser ved siden av de gamle | `styles.css`, en ny `ui/05j-ui-kit.js` (i malen og `COVER`) | `uishots.py` |
| **U3** HUD og knappelinja | Grep 2 og 3 | `ui/04-panels-instruments.js`, `ui/10c-dock.js`, `styles.css` | `docktest.py`, `tut.py`, `uishots.py` |
| **U4** Fisket | Grep 1, fiskefeltet i `--fish` | `ui/09-hand-fishing.js`, `ui/03c-heat.js`, `ui/03e-miniplot.js`, `view3d/` (kameraet ved første fisk) | `tut.py`, fisketestene som dekker juksa |
| **U5** Veiledning og meldinger | Grep 4, toast-køen | `ui/07b-first-trip.js`, `ui/07-guide.js`, `ui/02-format-state.js` | `tut.py` i begge formater |
| **U6** Handelsstedene | Grep 5, skuffens 21 sider til 5 | `ui/phone/11-rederi.js` (`DRAWER`), `ui/10c-dock.js`, `ui/10i-shop.js`, sidene i `ui/phone/` | `docktest.py`, `shoptest`, kjøpstestene (`buyGate`), `tut.py` |
| **U7** Telefonen | Grep 7: varselsenteret og kontekstlenkene, Kaiboden som ett ikon | `ui/phone/00-shell.js`, `08-home-papers-merker.js`, `06-render.js` | telefontestene, `uishots.py` |
| **U8** Kartplotter, dagbok og start | Forklarte instrumenter og et kortere rutepanel (+/− for fart i stedet for glideren), dagboka ryddet (høyre side i fanene, gråtoning i stedet for røde X), startsted med kystkart | `ui/03-map.js`, `ui/03b-route.js`, `ui/06-logbook.js`, `ui/06b-book-tabs.js`, `ui/08c-start.js` | `routetest.py`, boktestene, `tut.py` |
| **U9** Feiringen | Grep 8: sluttseddelen, gavene og milepælene | `ui/02-format-state.js` (`cashFx`), `ui/05e-merker.js`, sluttseddelen i skuffen | `tut.py`, merketestene |
| **U10** Ordboka | Grep 6 over alle sider og apper | en ordliste i `ui/01-i18n.js` eller egen data | `uishots.py` |

Rekkefølgen U0 → U1 → U2 er fundamentet. Etter det kan U3–U10 tas i den rekkefølgen Jonas vil.

## Valgene

- **V1 Visuell retning.**
  - **A** «Kystlys», med de fire språkene i hver sin rolle (anbefalt): det beholder det som alt er godt (brevet, dagboka, ECDIS) og fjerner bare kollisjonene.
  - **B** Mørkt glass overalt, også skuffen og telefonen.
  - **C** Lyst nordisk papir overalt.
- **V2 Rekkefølge.**
  - **A** Fundamentet først, U0–U2, så flatene (anbefalt): da arver hver ny flate systemet, og tellingen viser framgangen.
  - **B** Det som synes mest først, U3 og U4, med tokens underveis.
- **V3 Skuffen.**
  - **A** Fem steder: Butikken, Mottaket, Verftet, Båten og Rederiet (anbefalt): det følger regelen om handelsstedene i `CLAUDE.md` og fjerner overlappet.
  - **B** Behold de 21 sidene, bare med nytt utseende.
- **V4 Telefonen.**
  - **A** Bare varselsenteret, kontekstlenkene og Kaiboden som ett ikon nå (anbefalt): Jonas sier telefonen ikke er det største problemet, og dette løser det spilleren ikke fant.
  - **B** Slå 23 apper sammen til rundt 9.
- **V5 HUD-en.**
  - **A** Fire målere og varslene som gjelder nå, med hele tabellen ved trykk (anbefalt).
  - **B** Behold tabellen, men med ny stil og rangering.
- **V6 Knappelinja.**
  - **A** Én kontekstuell hovedknapp og ⋯ (anbefalt): spilleren ser alltid neste steg.
  - **B** Behold knappene som i dag, men med unike ikoner og grunnen på knapper som ikke kan brukes.

## Antatt eller usikkert

- Det er usikkert om fangstkortene (grep 1) koster noe i 3D-en på nettbrettet. De er HTML over lerretet, så trolig ikke, men det må måles med `#prof`.
- Det er ikke sjekket i koden hvordan dialog, toast og telefon faktisk stables når de åpnes samtidig. Lagene i tabellen er et mål og ikke en beskrivelse av i dag.
- Fem steder i skuffen (V3 A) krever at testene som åpner sider med `DOCK.open('<side>')`, får aliaser, så de gamle sidenavnene må virke en stund.
- Stående format er ikke undersøkt i denne runden. Hver fase tar bilder i begge formater før levering, slik `CLAUDE.md` krever.
- Analysen av bildene er gjort av agenter som ikke kjenner spillet. Det de var usikre på, er strøket eller merket.

## Det planen ikke gjør

- Endrer ikke grafikken i 3D, båtmodellene eller kartets innhold.
- Endrer ikke spillets regler, priser eller økonomi. Grepene viser det som finnes, tydeligere.
- Legger ikke til ventetid, energi eller noe som skal selges forbi (`docs/engasjement.md`). Kaiboden får samme innhold, bare samlet.

## Status

- 04.11.2026: undersøkelsen gjort (`tests/uiplay.py`, tre runder, liggende), planen skrevet.
- 04.11.2026: valgene V1–V6 er A (Jonas: «Kjør på»).
- 04.11.2026 **U0**:
  - F1: `tutTip` lukker skuffen når den dekker målet, både en knapp og et sted i kartet (`ui/07b-first-trip.js`).
  - F2: `havNear` leser ikke `P.p` når skipet var skjult ett minutt før (`core/05d-hav.js`).
  - F3: dagbokas håndskrift er Caveat, ett trinn større (`styles.css`).
  - F4: «Start på nytt» er tatt bort fra havnesiden (`ui/07-guide.js`).
  - F5: Lever-siden til sjøs sier hvor fisken leveres, med nærmeste mottak og Autonav (`landPage`, `lever`).
  - F6 og F7 er ikke feil, eller ikke avgjort.
  - Patchnotatet heter `ui-u0-041126`.
  - Testene: `run.py changed` 12 OK. `tut` gikk gjennom i begge formater (28 OK). `havflaate` og `npctest` trenger hele kysten, som ikke finnes i containeren, så `havNear`-rettingen er ikke prøvd i en test.
- 04.11.2026 **U1**:
  - Tokenene står i `:root`: flater, tekst, aksent, `--fish`, typografiskalaen, avstand, radier og høyder.
  - Lagskalaen `--z-*` gjelder 17 lag. Dialogen ligger nå over telefonen og boka, toast over boka, og effektene under sperrene. Det lave innenfor HUD-en og lasteskjermen står som før.
- 04.11.2026 **U2**:
  - Fire knapper. `ph-btn p` hadde ingen stil på 47 primærknapper. En knapp som ikke kan brukes, er stiplet og viser `data-why` når siden gir grunnen.
  - Fanene i telefonen og skuffen har én stil, på én rad som ruller. Kortene har felles radius og kant, og `.ph-empty` er klar for tomme tilstander.
- 04.11.2026 **U3**:
  - Statusboksen har fire målere og det som gjelder nå under dem. Hele tabellen kommer ved trykk (`S.settings.hudFull`).
  - Knappelinja har høyst seks knapper, med resten under «Mer» (`rowOf`), en hovedknapp (`hero`), stiplet ring på knapper som ikke kan brukes, og eget ikon for Hvil.
  - `rowsUp` måler løftet fra der radene starter.
  - Testene er grønne: hudtest 7, docktest 96, dockrow 16, uishots 45, rulestest 21, timetest 9.
- 04.11.2026 **U4**:
  - Fangstkortene (`ui/05j-catchfeed.js`, kroken `catchFeed` i `addCatch`) viser art, vekt og verdi ved nærmeste mottak, og over dem kg og kg/t for plassen.
  - **Fiskekartets farger beholdes**: paletten hvit, blå, grønn, gul, rød er Jonas' valg fra 05.10.2026 og er slik ekte ekkolodd viser fisk. `--fish` brukes ikke på kartet.
  - Gjenstår av U4: en forklaring av fargene i minikartet, og kameraet ned på dekk ved første fisk.
- 04.11.2026 **U5**:
  - Et nytt tips tar bort toast-meldingen fra steget før. En toast under 1,2 s gamle står, fordi den er svaret på trykket.
  - En toast som ville dekket tipset, flytter seg til toppen (`tipToast`). Tips om statusboksen står til høyre for den.
  - «Det lille kartet» står i stedet for «GPS-en».
  - Testene: tutdrift 5, hbtest 16 og cashfxtest 4.
- 04.11.2026 **U6**:
  - Stedshodet `dress` i `ui/10c-dock.js` står på handelssidene. Det viser «Du er her», eller nærmeste sted med Autonav, og erstatter kortet `nearHint`.
  - Borte fra stedet får knapper som ikke kan trykkes `data-why` («Kjøpes ved … i …»).
  - Lange forklaringer foldes til tre linjer med «Mer».
  - Grepet om fem steder ble mindre enn planlagt: knappelinja var allerede delt etter Mottak, Butikk, Verft, Bygd og Beholdning, så sidene står, men hvert sted sier nå hvor det er.
  - Testene: shoptest 21, itemcardtest 20, geartest 46 og docktest 96. Én kjøring av docktest under last var rød på viftene og grønn alene.
- 04.11.2026 **U7**:
  - «Nå» på hjemskjermen (`nowCards`): reglene her, best betalt torsk blant de fire nærmeste mottakene, og rederiet når det trenger deg.
  - Telefonen åpnet allerede på hjem etter lukking, og Kaiboden var allerede ett ikon. Testen hadde åpnet Haill og Trim direkte.
  - Testene: kystkarttest 5, merketest 12 og kystvakttest 11.
- 04.11.2026 **U8** (delvis):
  - Det som er over i dagboka, er grått med én strek.
  - Rutepanelet har − og + ved fartsglideren (begge glidere: utkastet og ruta under seiling), én knop per trykk, gjennom `panelInput`/`panelChange` som glideren. Glideren står, så `slidertest` (6 OK) gjelder fortsatt. Fartsteksten bryter i stedet for å klippes.
  - Testene: slidertest 6 OK; routetest 41 OK og 2 FEIL, begge utenfor endringen (tidsmåling under last mens `tut` gikk, og hele kysten, som mangler i containeren).
- 04.11.2026 **U9** (delvis): sluttseddelen skrives ut rad for rad første gang den vises (`SLIP_OUT` i `07-guide.js`, `--el` lar en ny tegning fortsette der den var), og «Til kassa» lyser opp til slutt. Kassa telte allerede opp (`cashFx`), og merkene kom allerede én og én (`achPump`).
- 04.11.2026 **U10**: ordboka (`ui/05k-ordbok.js`). 18 fagord får prikket strek første gang de står i skuffen eller en telefonapp (ikke på hjemskjermen), aldri i knapper, lenker, faner, overskrifter eller det som reagerer på trykk. Trykk gir én setning (`#ordTip`). `uishots` 45 OK.
- 04.11.2026 **U4 resten**: fargeforklaringen i minikartet (fem felt, «lite» og «mye», bare når ekkoloddet tegner fisk, `03e-miniplot.js`), og `G3.lookDeck()` (`view3d/25-controls.js`): ved første fisk i første tur glir kameraet ned over dekket på 1,1 s, ikke fra broa eller i kino. Det lagres i `S.tut.deckCam`, utenfor `S.tut.m`, så stegrekkefølgen i `tut.py` står.
- 04.11.2026 **U8 resten**:
  - Kartplotterens instrumenter (HDG, SOG, POS, WPT, ETA, DYBDE, TIDEVANN, SOL) har prikket strek under navnet, og et trykk gir én setning (`ECDIS_EXPL` i `05k-ordbok.js`).
  - Dagbokas Sesonger og Hendelser på et oppslag: det som er over til venstre, «Nå» til høyre (`bkSplit`); én side om gangen er som før. booktest 25 OK.
  - **Startstedet får ikke kystkart.** Jonas sa 08.10.2026: «Fjern kartet fra start-skjermen for nye brukere» (kommentaren i `ui/08c-start.js`). Den avgjørelsen står, og punktet er strøket fra planen.
- 04.11.2026 **U9 resten**: første levering har et stempel over sluttseddelen («Første levering», beløpet til kassa, kg og stedet), bare i første tur. Animasjonen fortsetter der den var når skuffen tegnes på nytt.
- **Gjenstår ikke noe av fasene.** Ordboka kan få flere ord og et lite bilde per ord. Full regresjon (`/regresjon`) før grenen slås inn i arbeidsgrenen.
