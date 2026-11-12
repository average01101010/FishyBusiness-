# Hopp over resten av ruta (plan 12.11.2026)

Status: **venter på valgene og «kjør på»**. Ingenting er bygd.

## Hva Jonas ba om

Jonas 12.11.2026: «Under seiling så dukker det opp en liten knapp i hjørnet som åpen en rute der det står en kostnad for å skippe resten av ruten, altså teleportere seg til målet. I dette systemet må prisen være basert å en blanding av hastighet og tid, nesten som en taxi-meter. Jeg er 100% sikker på at dette kommer til å bli populært fordi mange ønsker å spare tid på lange distanser.»

Det snur en regel han satte før: «Fast travel er ikke mulig i spillet, punktum.» (`docs/systemer/havner-og-mottak.md`, «Ingen hurtigreise»). Spurt om regelen skal snus, svarte han samme dag «Ja, med vilkår», det vil si alternativet: «Taksameter etter spart tid (dyrere per time enn trim, minstepris). Diesel, slitasje, is og fisk går som om båten seilte. Nektes når været på ruta er for hardt. Ikke i turoppdrag og løp.»

Det er ekte penger, så alt i butikken går som PR til Jonas og rulles ikke ut før han har sett den (`CLAUDE.md`, «Ekte penger»). Funksjonen tjener ingenting før betalingen er i ekte modus (steg 72, L2) og butikken er åpnet for nye spillere (P5), så den hører under lanseringslinja.

## Reglene den må holde

- **Betalingen korter ned en ekte avstand** (`docs/engasjement.md`): seilingen er ekte, og hoppet er trim tatt helt ut. Ingen ventetid legges inn eller forlenges for å selge hopp.
- **Alt annet enn tida går som om båten seilte:** dieselen, motortimene og slitasjen, isen og fisken i rommet, og mannskapets timer. Ellers blir hoppet billigere enn å seile, og fisken kommer ferskere fram. Da kjøper man mer enn tid.
- **Ikke forbi været:** ville båten ha ligget bi eller gått i havn på ruta, nektes hoppet.
- **Ikke i turoppdrag og løp:** turoppdragenes belønning er satt etter seilingstida uten trim (`turPay`). Kappløpene får egne regler (`docs/engasjement.md`, «Vurderes senere»).
- **Det som tjenes ved å seile, tjenes ikke ved å hoppe:** fartstid (`09e-fartstid.js`: «Fartstid selges aldri, og ingenting som øker den direkte»), lykter passert i Kystkartet (`09m-kystkart.js`), distansen i statistikken og merkene som telles i nm.
- **Lik pris for alle:** prisen regnes bare av ruta og farten, aldri av hvem som kjøper. Den står i kroner med 💎 før kjøpet, og det er ingen nedtelling. Gjester kan ikke kjøpe.

## Hva som finnes i dag

- **Ruta og tida:** `draftTimeline()` (`ui/03b-route.js:14`) regner kurs og ETA for hver etappe. `draftSea(tl)` (`ui/03b-route.js:247`) gir sjøen langs ruta fra varselet (`hsAtFc`, `core/03b-sea.js:129`) ved minuttet båten er der. GPS-boksen viser ETA til siste punkt mens ruta seiles. Verdens klokke går med `GAME_RATE` 6: én spilltime er ti ekte minutter.
- **Fram:** `arrive(w)` (`core/05-vessels.js:898`) legger båten til kai (`dock(pid, berth)`) eller lar den bli på det siste punktet.
- **Flytte båten langt:** `tests/teleport3d.py` setter `b.pos` og kaller `mapNeed`, og 3D laster kartet der. Start langs kysten gjør det samme.
- **Været:** `lieTo`, `lieToStep` (`core/05-vessels.js:1264`), `windLim`, `seaLim` og innstillingen «Autonav går inn ved» (6–20 m/s) avgjør når båten ligger bi eller går i havn (`docs/systemer/autonav.md` 4.12j).
- **Dieselen:** `fuelUse(b, l)` (`core/03-simulation.js:505`).
- **Fisken:** ferskheten går med den felles klokka (`docs/systemer/priser-og-salg.md`, Huss mfl.), og isen smelter i karene (`core/07f-kar.js`).
- **Trim** (`BOOSTS` i `core/03-simulation.js:89`): 29/39/49 kr for ×1,5/1,75/2 fart i 24/48/72 spilltimer (4/8/12 ekte timer). Seiler båten hele tida trimmen varer, sparer den 2, 6 og 12 ekte timer, altså 14,5, 6,5 og 4,1 kr per spart time.
- **Butikken:** `shop_quote(product)` gir prisen fra `products`, og `shop-checkout` lager Stripe-økta med `price_data` (`supabase/functions/shop-checkout/index.ts`). `stripe-webhook` gir `grants`, og `shopGive` (`ui/10i-shop.js`) leverer i spillet. Haill står i en beholdning i Kaiboden (`S.haillInv`) til den aktiveres.

## Prisen: taksameteret

Startverdiene, som justeres i spilltesting:

**pris = 0,10 kr per nm igjen + 20 kr per ekte time spart, minst 19 kr, rundet til hele kroner.**

Timene er ETA-en spilleren ser i GPS-boksen, med trim hvis den står på. Prisen låses når knappen trykkes og står i kjøpet (`purchases`). Mens båten seiler, går meteret ned, uten nedtelling eller ord om at prisen haster.

| Tur | Igjen | Ekte timer | Pris | Per spart time |
|---|---|---|---|---|
| Sjark 10 kn til feltet | 10 nm | 0,17 | 19 kr | minsteprisen |
| Sjark 10 kn | 60 nm | 1,0 | 26 kr | 26 kr |
| Hurtigsjark 25 kn | 200 nm | 1,3 | 47 kr | 35 kr |
| Trebåten 7 kn | 200 nm | 4,8 | 115 kr | 24 kr |
| Hurtigsjark 25 kn, Lindesnes–Nordkapp (anslått 1 300 nm) | 1 300 nm | 8,7 | 303 kr | 35 kr |

Per spart time er hoppet dyrere enn alle tre trimmene (4–15 kr), slik Jonas satte som vilkår. Delen per nm gjør at en rask båt betaler for avstanden og en sakte båt for tida, som et taksameter.

## Fasene

Hver fase er én økt.

### HO1 Kjernen (uten betaling)

- **Hva:** en ny fil `core/06j-hopp.js` (inn i malen etter `06i-plan2-sno.js` og i `COVER` i `run.py`) med tre rene funksjoner:
  - `hopQuote(b)`: nm og ekte timer igjen av ruta, prisen og taket.
  - `hopCheck(b)`: grunnen til at hoppet ikke kan gjøres. Grunnene er ingen rute, båten i havn, et turoppdrag i gang, været langs ruta over båtens grenser ved minuttet den er der, for lite diesel, over taket, og at det er en annen båt i flåten enn den spilleren følger.
  - `hopDo(b)`: båten flyttes til målet (`arrive`), dieselen trekkes (`fuelUse`), motortimer og slitasje legges til, fisken eldes og isen smelter med de spilte timene, og mannskapet får timene som om de seilte. Ingen fartstid, ingen lykter og ingen distanse telles.
- **Tilgang:** bare i testene og i admin («Gi hopp»), ikke i butikken.
- **Filer:** `core/06j-hopp.js`, `src/index.html`, `tests/run.py`, `tests/unit/hopp.test.mjs`.
- **Tester:** enhetstestene (prisen i tabellen over, hver grunn i `hopCheck`, diesel og ferskhet like etter et hopp som etter seilingen i `catchUp`, sett røde først), `node tests/unit/run.mjs`, `python3 tests/run.py changed`.
- **Måles:** diesel, ferskhet og is etter et hopp mot etter den samme ruta seilt i `catchUp`, med juksa, garn og fisk i rommet.

### HO2 Knappen, meteret og hoppet i 3D

- **Hva:**
  - Knappen i hjørnet mens en rute seiles, i kartet og i 3D.
  - Kortet med meteret: nm og timer igjen, prisen med 💎, og grunnen når hoppet ikke kan gjøres.
  - Hoppet med lasting av kartet ved målet (`mapNeed`) og en enkel overgang mens 3D laster.
  - De andre spillerne ser båten gå ut av AIS ved avgangen og komme inn igjen ved målet, uten forklaring og uten nytt felt i `pos_put`.
- **Filer:** `ui/03b-route.js`, `ui/03-map.js` (knappen), én del i `ui/phone/` eller `ui/05f-turer.js` (kortet), `src/styles.css`.
- **Tester:** ny `tests/hopptest.py` (LITE, med ett 3D-hopp): knappen, kortet og hoppet i begge formater (800×1280 og 1280×800), og at båten er ved kaia i målet uten land under kjølen. Skjermbilder i begge formater.
- **Stikkprøve** (`/stikkprove`): hopp i sør (Kristiansand–Bergen), midt (Kristiansund–Bodø) og nord (Tromsø–Båtsfjord). Krever hele kysten (`python3 tools/map/release.py`, `python3 tools/map/game.py`).
- **Måles:** tida 3D bruker på å laste kartet etter et langt hopp, på Jonas' nettbrett (`docs/spill-dette/`).

### HO3 Kjøpet

- **Hva:**
  - Produktet `hopp` i `products` med prisen fra `shop_quote(product, nm, timer)` etter formelen og taket. Serveren regner prisen, men stoler på klientens nm og timer, slik den stoler på posisjonen i dag.
  - `purchases.data` med nm, timer og pris.
  - `shopGive` gir hoppet når betalingen kommer fram.
  - Er ruta endret eller båten framme før betalingen kommer, se valg V3.
  - `shopThanks` sier hva som skjedde.
- **Filer:** `supabase/migrations/` (ny), `supabase/functions/shop-checkout/index.ts`, `ui/10i-shop.js`, Kaiboden i `ui/phone/`.
- **Ekte penger:** PR til Jonas, ingen utrulling før han har sett den. Migreringen kjøres av Jonas på testprosjektet først.
- **Tester:** `sqltest` (prisen fra serveren og taket), `kjoptest` (kjøpet i testmodus til hoppet er gjort), `python3 tests/run.py changed`.

## Valgene

**V1 Prisformelen**
- **A (anbefalt): taksameter med nm og timer** (0,10 kr per nm + 20 kr per ekte time, minst 19 kr). Det er det Jonas beskrev: en rask båt betaler for avstanden, en sakte for tida.
- B: bare etter spart tid (25 kr per ekte time, minst 19 kr). Enklest å forklare.
- C: faste trinn (opptil 1, 3, 6 og 12 ekte timer, for eksempel 19, 49, 99 og 179 kr). Ligner trimmen, men man betaler opp til neste trinn.

**V2 Taket per hopp**
- A: 24 ekte timer (rundt 600 kr for trebåten).
- **B (anbefalt): 12 ekte timer** (rundt 250–300 kr). Det holder ett kjøp innenfor det en ung spiller kan bruke uten å spørre hjemme, og en lang tur må seiles et stykke før den kan hoppes.
- C: ingen tak.

**V3 Når hoppet ikke kan gjøres når betalingen kommer fram** (ruta endret, båten framme, været snudd)
- **A (anbefalt):** hoppet legges i Kaiboden som «Hopp opptil N timer» og kan brukes én gang på en senere rute, uten utløpsdato. Det virker som haillen i beholdningen.
- B: pengene går automatisk tilbake gjennom Stripe. Det er renest for kjøperen, men gebyret er tapt og koden er mer.

## Det som er antatt eller usikkert

- **Tallene i formelen** er startverdier. Ingen vet hva spillerne betaler før butikken er i ekte modus.
- **Lindesnes–Nordkapp er anslått** til 1 300 nm langs leia, ikke regnet med ruteplanleggeren (hele kysten er ikke i dette bygget).
- **«Som om båten seilte»** kan bygges på to måter. Enten spilles båtens egne prosesser (diesel, is, fisk, mannskap) av minutt for minutt langs ruta, eller de regnes samlet med formler. HO1 velger etter målingen mot `catchUp`. Det første er tryggest, men går mot verdens klokke for alt annet.
- **Mannskapets timer:** krav om hviletid ble fjernet 11.10.2026 (`docs/systemer/folk-om-bord.md` 5.19), og arbeidsavtalen (Ø11.9) er ny. HO1 må sjekke hva seilingen gjør med mannskapet i dag, og gjøre det samme.
- **De andre spillerne kan gjette** at hoppet er kjøpt når båten forsvinner og dukker opp langt unna. Det kan ikke skjules uten å vise noe falskt.
- **3D-lastingen** etter et langt hopp er ikke målt på en vanlig telefon.

## Det planen ikke gjør

- Ingen hopp for båtene i flåten som går på Driftsplanen, bare for båten spilleren følger.
- Ingen hopp mens spillet er lukket, og ingen hopp i turoppdrag og kappløp.
- Ingen pakker med timer, ingen spillvaluta og ingen rabatter.
- Ingen patchnote om hoppet: patchnotene nevner aldri butikken.
- Ingen endring i trim, haill eller turoppdragenes belønning.

## Status

- 12.11.2026: planen skrevet i Jonas' økt (grenen `ccr-e7efd74c-rioki0`). Venter på V1–V3 og «kjør på».
