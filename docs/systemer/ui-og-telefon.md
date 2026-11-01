# Knappelinja, dekksdagboka, telefonen og skjermene

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.17 Knappelinja, skuffen og «Sett ut» (01.10.2026)

Inspirert av Fishing: Barents Sea. Den gamle handlingslinja `#actbar` er borte, og telefonen er slanket.

- **Knappelinja** (`#dock`, `DOCK` i `ui/10c-dock.js`): Runde knapper med et kort ord under, langs nedkanten. Bare knappene som passer akkurat nå, vises. Det som ikke kan brukes, er grått, og et trykk gir grunnen som toast. `renderActs()` er beholdt som navn og kaller `DOCK.render()`.
  - **I havn:** Marked (Lever, Is, Agn), Bygd (Pub, Bank, Oppdrag, Mannskap), Verft (Båthandel, Oppgrader, Fiskeutstyr, Vedlikehold, Bunkring) og Beholdning. «Planlegg» er fjernet (02.10.2026); kartplotteren åpnes fra det lille kartet i 3D. Marked, Bygd og Verft åpner en vifte med mindre knapper over seg (`#dockFan`). Med planlagt avgang: Kast loss og Avbryt.
  - **På sjøen:** Jukse (vifte med timer, start og kveite, bare når båten er rigget for juksa), Sett ut, Ta opp, Auto-nav og Beholdning når båten ligger stille; Stopp, Sløy eller Fisk videre, Jukse selv og Beholdning under juksing; Stopp båten og Auto-nav under fart; «Hjem» er fjernet (02.10.2026, «Returner samme vei» står i plotteren); Hjelp ved motorstopp. Mannskap dukker opp med prikk når det er krangel om bord.
  - **Statusfeltet** `#dockInfo` over knappene er tekst (avgang, verksted, lossing, kaiarbeid, redskapsarbeid, juksing og dekk).
  - `DOCK.items(meny)` og `DOCK.text()` er for testene.
- **Skuffen** (`#drawer`): Liggende kommer den fra høyre (380 px), stående er den et ark over knappene (55 % av høyden). Innholdet er telefonens sider: `PHONE.page(side)` lager HTML, og `PHONE.dact(side, handling, data)` kjører en `data-pa`-handling som om siden var åpen i telefonen. `DOCK.open('side:fane')` åpner en side med en fane valgt.
  - **Sidene i skuffen** (`DRAWER` i `ui/phone/11-rederi.js`, delt fra `05-phone.js` 26.10.2026): `lever`, `is`, `agn`, `bank`, `oppdrag`, `mannskap` og `bors` (som to faner), `fartoy` (Båthandel), `utstyr`, `fiske` (med kjøp av garn, line og teiner), `verksted`, `beholdning` (Redskap, Lasterom, Båten), og de gamle `havn`, `last` og `redskap`.
  - `PHONE.open(side)` og `data-pa="open"` sender en side i `DRAWER` til skuffen. Varslene i Rederi bruker `side:fane`, for eksempel `beholdning:last`.
- **Telefonen** har fjorten apper: Vær, Kystposten, Meldinger, Rederi, Salgslaget (Priser, Mine landinger, Toppliste), Kvote, Oppdrag, Haill, Sjømann, Redning, Trim, Patchnotes, Innstillinger og Admin. Kvote er fanen fra Salgslaget som egen app.
- **Patchnotes** (04.10.2026) viser kort hva de siste oppdateringene har gitt, med det nyeste først (`PATCH` i `ui/phone/07-patch.js`). Hver oppdatering har en id, en dato, en tittel og noen linjer på norsk og engelsk. Appen har et merke med tallet på oppdateringer du ikke har sett (`S.settings.patchSeen`), og de som var nye da du åpnet den, får «Ny» (`patchLast`). **Ved hver oppdatering legges en ny linje øverst i `PATCH`.**
  - **Admin** (testverktøy, 02.10.2026) har tidsskalaen (pause, 6×, 180×, 1 800× og 10 800×, det vil si `S.mult` 0, 1, 30, 300 og 1800) og knappen «+ 100 000 kr», som legger pengene i kassa uten å regne dem som inntekt og skriver en linje i loggen. Tempovalget er flyttet hit fra Innstillinger. Appen fjernes før spillet får felles klokke.
- **«Sett ut»** (`ui/03d-setmode.js`, tilstanden `SETM` er deklarert i `03-map.js`): Valget i viften åpner kartplotteren med redskapet tegnet som en linje fra båten. Lengden er den samme som `startSet` bruker: garn 30 m, line 1,5 m per krok, teiner 25 m mellom hver. Kartet zoomer så linja fyller rundt 40 %.
  - Dra i enden, eller trykk i kartet, for å snu linja. − og + endrer antall stamper eller teiner (en garnlenke settes hel).
  - Linja er rød med grunnen når enden er på land eller grunnere enn 5 m, når den krysser land, eller når `gearRules` sier nei.
  - «Sett ut» kaller `startSet(kind, spec, 0, hdg)`. Med `hdg` bruker den `setGeomExact` og setter bare der linja er tegnet, og båten snur dit. Uten `hdg` (ruta og driftsplanen) gjelder `setGeom` som før.
- **Ta opp** lyser innenfor 0,3 km fra en blåse (`nearSet`). For garn og teiner kommer «Trekk og sett igjen» i en vifte.
- **Auto-nav** åpner kartplotteren med Autonav klar (`leiaArm`). Et trykk på en egen blåse finner veien til et punkt 50 m utenfor (`buoyStandoff`). Fra 02.10.2026 går båten ikke av seg selv: spilleren trykker «Kast loss». Den trekker ikke selv. «Kjør dit» per sett i Beholdning gjør det samme (`DOCK.goTo`).
- **Rettinger:** `gearTap` ga et rutepunkt med trekk uten `kind`, så `wpActLabel` krasjet. En setting som ble stoppet før første enhet gikk ut, gir nå tilbake blåsesettet, egnede stamper og teineagn.

## 5.18 Dekksdagboka med faner, oppdragslista og papirene (01.10.2026)

Inspirert av Fishing: Barents Sea.

- **Fanene** (`#bkTabs`) står på venstre kant av boka: Dagbok, Sesonger, Hendelser, Utstyr og Salg. Hver fane er sin egen sideliste i `BOOK` (`ui/06-logbook.js`), og sidene for alle fanene unntatt Dagbok lages av `bookTabPages(fane)` i `ui/06b-book-tabs.js`. Alt står eldst først, så en fane åpner på nyeste side. `BOOK.open('salg', i)` åpner sluttseddel nummer `i` i `S.sales`.
  - **Sesonger:** årets regler (kveitefredningen, skreisesongen, maksimalkvotene i åpen gruppe, uer på juksa, ferskfiskordningen) og prissesongene, også kongekrabbens: måneder der `SPECIES[art].pm` ligger minst 10 % over eller under årssnittet. Det som er over, krysses ut (klassen `over`; `x` er opptatt av lukkeknapper).
  - **Hendelser:** de siste fire ukene. Ukens prisbevegelse per art når `weekDev` er minst ±8 %, uværsdager med toppris (`supplyFactor` ≥ 1,025), og regelendringer.
  - **Utstyr:** et kort per sett fra `S.gearLog` (hele rederiet, de siste 60), som skrives i `finishSet` og oppdateres i `finishHaul` og når redskap går tapt. Ståtid som tellestreker opp til 40 t.
  - **Salg:** sluttseddelen per levering. `sell()` lagrer den i `S.sales[i].d`: linjer `[art, klasse, kvalitet, sløyd, kg, kr, antall]`, lever og rogn, innloggingsbonus, oppdragstillegg, inndratt, trekk for rognkrabbe, mannskapet med andel, lott, gebyr og et løpenummer (`S.saleSeq`). Bare de siste 60 salgene beholder `d`. Eldre salg vises med kg og kroner per art.
- **Oppdrag** tas i Bygd (skuffesiden `oppdrag`). De aktive ligger som en oppdragsliste i telefonappen `ordl` («Oppdrag») med frist og framdrift, og under står de tidligere med Levert eller Ikke levert. `ordState().done` har nå `ok` og tar 20. Både levert og ikke levert skrives i Drift.
- **Salgslaget, «Mine landinger»:** 📖 per sluttseddel åpner den i boka.
- **Sjømann, fanen «Papirer»** (`papers()`): helseerklæring for arbeidstakere på skip (fiktiv lege, gyldig 2 år fra første loggføring), sikkerhetsopplæring for sjøfolk på mindre skip (35 t), fiskeskipper klasse C og begrenset radiosertifikat (SRC, gyldig når en båt har VHF). Papirene styrer ingenting.

## 5.25b Telefon, nettbrett og PC (05.10.2026)

Jonas: «vi må uansett optimalisere hele spillets UI for både mobil, nettbrett og pc». `tests/uishots.py` går gjennom hovedvisningene (havn, sjø i 3D, kartplotter, rute, telefonen, Salgslaget, Innstillinger, boka og menyen i havn) i fem størrelser: telefon stående (390 × 844) og liggende, nettbrett stående (800 × 1280) og liggende, og PC (1440 × 900). Den tar bilder (`tests/out/ui_<visning>_<størrelse>.png`) og finner selv tekst som er kuttet, knapper utenfor skjermen (ikke det som ligger i en boks som ruller, og ikke Dekksdagboka, som stikker ut med vilje), de store blokkene oppå hverandre, og knapper under 32 × 30 px på berøringsskjermer. Første runde fant 181 ting, nå 0.

Hva som ble gjort (siste blokk i `styles.css`):
- **Telefon stående** (`max-width: 560px`): telefonen i spillet fyller hele skjermen uten ramme. Kompasset ligger øverst, med infoboksen under. Handlingsknappene går fra Dekksdagboka til telefonknappen, og navnene kan gå over to linjer. Kartplotterens topprad har symboler for innstillinger (⚙) og lukk (✕), og ekkoloddskalaen ligger under raden til høyre.
- **Telefon liggende** (`max-height: 520px`): infoboksen er litt mindre (`zoom`), minikartet er borte, GPS-boksen ligger rett under infoboksen, og telefonen i spillet er like høy som skjermen.
- **Overalt:** kompasset når aldri infoboksen, og knappene i appene (`.ph-sub`) er minst 36 px høye på berøringsskjermer. Ekkoloddfeltet forsvinner når ekkoloddet er av.
- `--gpsTop` og `--hudW` regnes fra infoboksen slik den er tegnet (`getBoundingClientRect`), så de stemmer med `zoom`.
