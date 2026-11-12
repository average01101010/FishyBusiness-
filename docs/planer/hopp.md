# Hopp over resten av ruta (plan 12.11.2026)

Status: **HO1, HO2 og HO3 er bygd (12.11.2026, steg 104–106) og rullet ut til testutgaven.** Kjøpet er ekte penger: PR-en venter på Jonas, og migreringen `20261112200000_hopp.sql` kjører han på testprosjektet når det har `shop-checkout` og Stripe-webhooken (L1a). Til da er butikken i testmodus på testutgaven (bare for admin, ingen betaling).

## Hva Jonas ba om

Jonas 12.11.2026: «Under seiling så dukker det opp en liten knapp i hjørnet som åpen en rute der det står en kostnad for å skippe resten av ruten, altså teleportere seg til målet. I dette systemet må prisen være basert å en blanding av hastighet og tid, nesten som en taxi-meter. Jeg er 100% sikker på at dette kommer til å bli populært fordi mange ønsker å spare tid på lange distanser.»

Det snur en regel han satte før: «Fast travel er ikke mulig i spillet, punktum.» (`docs/systemer/havner-og-mottak.md`, «Ingen hurtigreise»). Spurt om regelen skal snus, svarte han samme dag «Ja, med vilkår», det vil si alternativet: «Taksameter etter spart tid (dyrere per time enn trim, minstepris). Diesel, slitasje, is og fisk går som om båten seilte. Nektes når været på ruta er for hardt. Ikke i turoppdrag og løp.»

Det er ekte penger, så alt i butikken går som PR til Jonas og rulles ikke ut før han har sett den (`CLAUDE.md`, «Ekte penger»). Funksjonen tjener ingenting før betalingen er i ekte modus (steg 72, L2) og butikken er åpnet for nye spillere (P5), så den hører under lanseringslinja.

## Reglene den må holde

- **Betalingen korter ned en ekte avstand** (`docs/engasjement.md`): seilingen er ekte, og hoppet er trim tatt helt ut. Ingen ventetid legges inn eller forlenges for å selge hopp.
- **Bare fisken i lasterommet merker tida** (Jonas 12.11.2026: «Det eneste som taper seg med tiden som forsvinner er kvaliteten på fisken i lasterommet»; før: «Alt annet enn tida går som om båten seilte»). Fisken og isen eldes minutt for minutt som om båten seilte; dieselen, motortimene, trimmen, Skippertak, energien, mannskapet og provianten er som før.
- **Været nekter aldri hoppet** (endret 12.11.2026; før: «Ikke forbi været»). Jonas, da han så kortet si nei for 11 m/s på testutgaven: «Jeg trodde vi ble enig om at hoppet skulle fungere uavhengig av været?» Hoppet går i all slags vær, før og etter kjøpet. Maskinhavari og sjø over ripa i grov sjø hoppes over, som resten av turen.
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

## Prisen: spart tid

Jonas 12.11.2026 (V1): «Kan det være bedre å bare ta betalt for tiden spart i totale minutter eller sekunder?» Svaret ble ja: tida inneholder alt farten, og nm-delen la ikke noe til. Startverdiene, som justeres i spilltesting:

**Prisstigen, trinnvis som skattetrinn: 75 øre per spart ekte minutt den første timen, 50 øre de neste tre timene og 25 øre etter det, minst 5 kr, rundet til hele kroner. Ingen tak** (Jonas 12.11.2026, V2: «Ingen tak»).

Jonas 12.11.2026 om stigen: «Hva tenker du om en dynamisk prisstige som blir billigere jo lengere ruten er? På den måten er korte tidsbesparelser litt dyre, men de lengre oppleves rimeligere.» Han valgte A (75/50/25 øre) samme dag. Trinnene gjelder minuttene i rekkefølge, så totalprisen øker alltid med tida og snittet per minutt faller. En pris per minutt som hang på rutas samlede lengde, kunne gjort en lengre rute billigere enn en kortere og gitt omveier.

Minsteprisen og minuttprisen: først 25 kr i timen og minst 19 kr. Jonas 12.11.2026: «Jeg tenker vi ikke skal ha noe minstegrense på 19kr, det er for høyt. Jeg tenker kanskje 5kr, og at kostnaden per minutt spart er 0,5kr, altså 50øre?», og om minsteprisen: «Jeg synes det er litt viktig at minsteprisen er så lav som mulig for at det skal se billig ut.» Økta anbefalte 5 kr og 50 øre: 1 kr minuttet dobler prisen på de lange hoppene, der bruken og pengene er, og løser ikke kortgebyret, som er fast per kjøp. Stripes laveste beløp i NOK er etter alt å dømme 3 kr (ikke sett i Stripes egen tabell).

Timene er ETA-en spilleren ser i GPS-boksen, med trim hvis den står på. Prisen låses når knappen trykkes, sammen med målet, og står i kjøpet (`purchases`). Mens båten seiler, går prisen ned, uten nedtelling eller ord om at den haster. Alt under 7 minutter koster minsteprisen.

| Tur | Igjen | Ekte minutter | Pris |
|---|---|---|---|
| Sjark 10 kn ut til feltet | 10 nm | 10 | 8 kr |
| Sjark 10 kn | 60 nm | 60 | 45 kr |
| Hurtigsjark 25 kn | 200 nm | 80 | 55 kr |
| Trebåten 7 kn | 200 nm | 286 | 147 kr |
| Hurtigsjark 25 kn, Lindesnes–Nordkapp (anslått 1 300 nm) | 1 300 nm | 520 | 205 kr |
| Trebåten 7 kn, Lindesnes–Nordkapp | 1 300 nm | 1 857 | 539 kr |

Det laveste trinnet, 25 øre minuttet, er 15 kr per spart time og dermed dyrere enn alle tre trimmene (4–15 kr per spart time), slik Jonas satte som vilkår.

**Mot trimmen** (Jonas 12.11.2026: «Vi må huske at det skal koste litt ekstra å spare tiden man vinner på å teleportere ved å skippe reisen»). Trimmen sparer tid i alt som seiles i 4, 8 eller 12 ekte timer, høyst en tredel, tre sjudeler eller halvparten av turen. Hoppet tar bort én tur helt. Brukt fullt ut koster trimmen 0,24 kr (pumpa), 0,11 kr (ladeluftkjølingen) og 0,07 kr (turboen) per spart minutt. Hoppet koster 0,75, 0,50 og 0,25 kr, altså rundt tre ganger pumpa den første timen og fire ganger turboen på de lange turene.

| Tur (ekte minutter) | Billigste trim bare for denne turen | Hoppet |
|---|---|---|
| 10 | pumpa 29 kr, sparer 3 min (8,70 kr/min) | 8 kr, sparer 10 (0,80 kr/min) |
| 60 | pumpa 29 kr, sparer 20 min (1,45 kr/min) | 45 kr, sparer 60 (0,75 kr/min) |
| 286 | pumpa 29 kr, sparer 95 min (0,30 kr/min) | 147 kr, sparer 286 (0,51 kr/min) |
| 520 | ladeluftkjølingen 39 kr, sparer 223 min (0,18 kr/min) | 205 kr, sparer 520 (0,39 kr/min) |
| 1 857 | turboen 49 kr, sparer 720 min (0,07 kr/min) | 539 kr, sparer 1 857 (0,29 kr/min) |

For én tur under rundt to og en halv time er hoppet billigere per spart minutt enn trim kjøpt bare for den turen, fordi trimmen varer i timer og er laget for mye seiling. Skal hoppet være dyrere også der, må minsteprisen opp mot trimmens 29 kr. Over det er hoppet dyrere per minutt for alle turer. Trim og hopp sammen er lovlig: står turboen på når trebåten hopper Lindesnes–Nordkapp, er det 1 137 minutter igjen, og hoppet koster 359 kr. Turboens tolv timer er da brukt opp (regelen over), så til sammen 408 kr.

**Det som er igjen per kjøp** etter MVA (25 %) og Stripes 2,4 % + 2,00 kr for norske og EØS-kort: 1,88 kr av 5 kr, 4,21 kr av 8 kr, 32,92 kr av 45 kr. Gebyret er fast per kjøp, så de minste hoppene gir nesten ingenting; de er verdt det som en lav terskel for første kjøp. Andelen hopp til minsteprisen måles etter lanseringen, og prisen kan endres på serveren uten ny versjon av spillet.

**Når betalingen har gått gjennom** (Jonas 12.11.2026, V3: «Så lenge betalingen har gått gjennom skal spillerene kunne teleportere seg frem til målet, uavhengig av været eller andre ting. De betaler fortsatt for tiden de har spart.»):
- Været, dieselen og turoppdraget sjekkes bare før kjøpet.
- Når betalingen er kommet fram, flyttes båten til målet som sto da kjøpet ble gjort, uansett vær eller endret rute.
- (Erstattet samme dag: hoppet legges ikke i Kaiboden. Båten fryses når ⏩ trykkes, se «Holdet og leveringen» under.)

**Holdet og leveringen** (Jonas 12.11.2026, etter at HO3 var bygd og kontrollert; bygd samme dag):
- «Hopp skal ikke selges i kaiboden, det skal kun selges per minutt når man trykker på knappen under seilas.»
- «For at et hopp skal kunne kjøpes og brukes må en rute mellom A og B være startet. Når spilleren har kommet fram til endepunktet av ruten ved hjelp av hoppet er tjenesten levert og spilleren skal ikke ha noe "hopp" tilgode.»
- Spurt om hva som skal skje når båten har kommet fram ved å seile mens betalingen går: «Når brukeren trykker på hopp-knappen stopper båten momentant som om den var fryst i tiden, det løser problemet.»

Det er bygd slik (`core/06j-hopp.js` `hopHoldOn`, `hopHeld`, `hopHoldFor`; `ui/10u-hopp.js`; `ui/10i-shop.js` 5b):
- **⏩ fryser båten** der hun er, før kortet vises (`b.hopHold`). Hun har ingen fart, bruker ingen diesel, blir ikke snudd av været og får ingen motortrøbbel (`vesselStep`, `dynCan`). Prisen og stoppet på kortet er derfor det betalingen gjelder.
- **Verdens klokke går som før.** Fisken, isen, mannskapet og du går som på en båt som ligger stille.
- **Holdet varer mens siden er hos Stripe og mens tida borte spilles inn.** Det står i lagringen, så en annen enhet som har spillet, gjør hoppet der.
- **Holdet slutter** ved hoppet, ved «Avbryt», når kjøpet avbrytes hos Stripe, når ruta endres, når siden skjules med kortet åpent, og senest etter 35 ekte minutter. Stripe-økta for et hopp utløper etter 31 minutter (`shop-checkout` `expires_at`), så ingen betaling kommer etter at holdet er sluppet.
- **Når betalingen kommer, hopper båten fra holdet til endepunktet**, uansett vær (`hopGo(true)`), med en gang eller så snart tida borte er spilt inn (`hopWait`). Da er tjenesten levert. Ingenting er tilgode, og hoppet står ikke i Kaiboden.
- **Et kjøp som likevel ikke kan gjøres, merkes for refusjon** (`hopVoid`, hendelsen `hop_void`), og loggen, Meldinger og skjermen sier det én gang. Det gjelder når holdet var sluppet da betalingen kom, når turen er tydelig lengre enn det som ble betalt for (`hopCovers`), og når noen er i sjøen. Jonas refunderer i Stripe, og `shop_refund` tar da grantet tilbake. Med holdet skal dette nesten aldri skje.

## Fasene

Hver fase er én økt.

### HO1 Kjernen (uten betaling)

- **Hva:** en ny fil `core/06j-hopp.js` (inn i malen etter `06i-plan2-sno.js` og i `COVER` i `run.py`) med tre rene funksjoner:
  - `hopQuote(b)`: ekte minutter igjen av ruta, målet og prisen etter stigen.
  - `hopCheck(b)`: grunnen til at hoppet ikke kan gjøres. Grunnene er ingen rute, båten i havn, et turoppdrag i gang, været langs ruta over båtens grenser ved minuttet den er der, for lite diesel, og at det er en annen båt i flåten enn den spilleren følger.
  - `hopDo(b)`: båten flyttes til målet (`arrive`), dieselen trekkes (`fuelUse`), motortimer og slitasje legges til, trimmen brukes for den tida turen ville tatt med trim, fisken eldes og isen smelter med de spilte timene, og mannskapet får timene som om de seilte. Ingen fartstid, ingen lykter og ingen distanse telles.
- **Tilgang:** bare i testene og i admin («Gi hopp»), ikke i butikken.
- **Filer:** `core/06j-hopp.js`, `src/index.html`, `tests/run.py`, `tests/unit/hopp.test.mjs`.
- **Tester:** enhetstestene (prisene i tabellen over, hver grunn i `hopCheck`, diesel og ferskhet like etter et hopp som etter seilingen i `catchUp`, sett røde først), `node tests/unit/run.mjs`, `python3 tests/run.py changed`.
- **Måles:** diesel, ferskhet og is etter et hopp mot etter den samme ruta seilt i `catchUp`, med juksa, garn og fisk i rommet.

### HO2 Knappen, meteret og hoppet i 3D

- **Hva:**
  - Spoleknappen (⏩) i 3D til høyre, rett under kamera- og kinoknappen, bare mens en rute seiles (Jonas 12.11.2026: «Jeg tenker selve knappen kan legges her på skjermen, og vises som et "fast forward"-symbol, nesten som en spoleknapp. Den skal være kontekstuell og kun komme opp når en rute er i gang.»).
  - Kortet med meteret: nm og timer igjen, prisen med 💎, og grunnen når hoppet ikke kan gjøres.
  - Hoppet med lasting av kartet ved målet (`mapNeed`) og en enkel overgang mens 3D laster.
  - De andre spillerne ser båten gå ut av AIS ved avgangen og komme inn igjen ved målet, uten forklaring og uten nytt felt i `pos_put`.
- **Filer:** `ui/03b-route.js`, `ui/03-map.js` (knappen), én del i `ui/phone/` eller `ui/05f-turer.js` (kortet), `src/styles.css`.
- **Tester:** ny `tests/hopptest.py` (LITE, med ett 3D-hopp): knappen, kortet og hoppet i begge formater (800×1280 og 1280×800), og at båten er ved kaia i målet uten land under kjølen. Skjermbilder i begge formater.
- **Stikkprøve** (`/stikkprove`): hopp i sør (Kristiansand–Bergen), midt (Kristiansund–Bodø) og nord (Tromsø–Båtsfjord). Krever hele kysten (`python3 tools/map/release.py`, `python3 tools/map/game.py`).
- **Måles:** tida 3D bruker på å laste kartet etter et langt hopp, på Jonas' nettbrett (`docs/spill-dette/`).

### HO3 Kjøpet

- **Hva:**
  - Produktet `hopp` i `products` med prisen fra `shop_quote_hop(minutter)` etter formelen (`hop_price`). Serveren regner prisen, men stoler på klientens minutter, slik den stoler på posisjonen i dag.
  - `purchases.data` med minuttene, målet og prisen.
  - `shopGive` gir hoppet når betalingen kommer fram.
  - Hoppet gjøres fra holdet til målet i kjøpet, uansett vær (se «Holdet og leveringen»).
  - `shopThanks` sier hva som skjedde.
- **Filer:** `supabase/migrations/` (ny), `supabase/functions/shop-checkout/index.ts`, `ui/10i-shop.js`, Kaiboden i `ui/phone/`.
- **Ekte penger:** PR til Jonas, ingen utrulling før han har sett den. Migreringen kjøres av Jonas på testprosjektet først.
- **Tester:** `sqltest` (prisen fra serveren), `kjoptest` (kjøpet i testmodus til hoppet er gjort), `python3 tests/run.py changed`.

## Valgene (tatt 12.11.2026)

- **V1 Prisen:** bare spart tid (Jonas: «Kan det være bedre å bare ta betalt for tiden spart i totale minutter eller sekunder?»), som prisstigen 75/50/25 øre per minutt, minst 5 kr (sitert over). Taksameteret med nm og timer og den flate prisen er lagt bort.
- **V2 Taket:** ingen tak (Jonas: «Ingen tak»).
- **V3 Etter betalingen:** hoppet gjøres uansett vær og andre ting (Jonas, sitert over). Båten fryses når ⏩ trykkes, og ingenting er tilgode etter hoppet (Jonas 12.11.2026, «Holdet og leveringen»).

## Det som er antatt eller usikkert

- **Tallene i stigen** (75/50/25 øre per minutt, minst 5 kr) er startverdier. Hvor mange flere som kjøper lange hopp når prisen nesten halveres, vet ingen før butikken er i ekte modus. Ingen vet hva spillerne betaler før butikken er i ekte modus.
- **Lindesnes–Nordkapp er anslått** til 1 300 nm langs leia, ikke regnet med ruteplanleggeren (hele kysten er ikke i dette bygget).
- **«Som om båten seilte»** kan bygges på to måter. Enten spilles båtens egne prosesser (diesel, is, fisk, mannskap) av minutt for minutt langs ruta, eller de regnes samlet med formler. HO1 velger etter målingen mot `catchUp`. Det første er tryggest, men går mot verdens klokke for alt annet.
- **Mannskapets timer:** krav om hviletid ble fjernet 11.10.2026 (`docs/systemer/folk-om-bord.md` 5.19), og arbeidsavtalen (Ø11.9) er ny. HO1 må sjekke hva seilingen gjør med mannskapet i dag, og gjøre det samme.
- **De andre spillerne kan gjette** at hoppet er kjøpt når båten forsvinner og dukker opp langt unna. Det kan ikke skjules uten å vise noe falskt.
- **3D-lastingen** etter et langt hopp er ikke målt på en vanlig telefon.
- **Uten tak** kan ett kjøp bli over 700 kr for en sakte båt på en lang tur. Spillere fra 13 år kan kjøpe. Det er Jonas' valg, og det står her så det ses igjen når butikken er i ekte modus.

## Det planen ikke gjør

- Ingen hopp for båtene i flåten som går på Driftsplanen, bare for båten spilleren følger.
- Ingen hopp mens spillet er lukket, og ingen hopp i turoppdrag og kappløp.
- Ingen pakker med timer, ingen spillvaluta og ingen rabatter.
- Ingen patchnote om hoppet: patchnotene nevner aldri butikken.
- Ingen endring i trim, haill eller turoppdragenes belønning.

## Status

- 12.11.2026: planen skrevet i Jonas' økt (grenen `ccr-e7efd74c-rioki0`). Valgene V1–V3 tatt samme dag. Jonas: «Kjør på hopp over ruta». Fasene er steg 104–106 i køen.
- 12.11.2026: HO1 (kjernen) og HO2 (spoleknappen, kortet, hoppet i 3D) bygd i samme økt (Jonas: «Kjør på HO2 med spoleknappen»), begge med uavhengig kontroll og alt kontrollen fant rettet. Stikkprøven i sør, midt og nord (Kristiansand–Bergen, Kristiansund–Ålesund, Tromsø–Hammerfest, og LITE i Kristiansand, Kristiansund og Båtsfjord). Det som er bygd, står i `docs/systemer/autonav.md` 4.12n.
- 12.11.2026: HO3 (kjøpet) bygd i samme økt (Jonas: «Gjør helt ferdig og rull ut på test med en gang.»): `shop_quote_hop`, `hop_price`, `hop_use`, `shop_state` med hoppene, `shop_refund` som tar tilbake et ubrukt hopp, `shop-checkout` med minuttene og stoppet, leveringen i `srvApply` og Kaiboden. Uavhengig kontroll; funnene rettet (kvitteringens pris, kaiplass-id-en, minuttene i kjøpet, refusjonen, ventingen på innhentingen, grunnen i Kaiboden). Hvordan holdet og leveringen virker, står under «Holdet og leveringen».
- 12.11.2026: Jonas: hopp selges bare ved ⏩, ingenting tilgode, og båten fryses når knappen trykkes. Kaiboden-ordningen er tatt bort og holdet bygd (`b.hopHold`), med tester og en ny uavhengig kontroll.
- 12.11.2026: været tatt helt ut av hoppet (Jonas: «Jeg trodde vi ble enig om at hoppet skulle fungere uavhengig av været?»). Kortet nekter bare for diesel, nesten fremme og grunnene i `hopWhy`.
- 12.11.2026: Jonas: «Ingenting skal være en hindring for å kjøpe "hopp". Det er dårlig business. Det eneste som taper seg med tiden som forsvinner er kvaliteten på fisken i lasterommet.» Bygd samme dag: kortet nekter bare når ingen rute seiles (og under Driftsplanen, når spillet er åpent et annet sted, og i sekundene tida borte spilles inn, som kortet venter på). Diesel, «nesten fremme», anker, «Stopp båten», omkjøring, lekkasje, mann over bord, slep, første tur og turoppdrag hindrer ikke lenger. Under hoppet eldes bare fisken og isen i lasterommet (og snøkrabben i tankene); dieselen, motortimene, trimmen, Skippertak, energien din, mannskapet og provianten er som før (`hopDo`).
