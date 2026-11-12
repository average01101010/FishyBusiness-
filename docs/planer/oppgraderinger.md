# Oppgraderinger: kniv, høtt, dekksutstyr i trinn, propell og én side for båten og utstyret (plan 07.11.2026)

> Plan etter `/planlegg`. **Jonas tok valgene 07.11.2026** (sitert under), **og V1 A samme dag.** OPP1 er bygd og rullet ut 07.11.2026 (Status nederst); OPP2–OPP5 står i køen. Hver fase er én økt. Reglene som gjelder: `CLAUDE.md` (handelsstedene, `buyGate`, modulære modeller, patchnotes), `docs/engasjement.md` (alt kan nås uten å betale, friksjonen er simuleringens egen, nye ting starter aldri på null) og `docs/handelssteder.md`. Tallene her er startverdier som måles før de settes.

## Hva Jonas ba om

- Jonas 07.11.2026: «spillet må ha et skikkelig oppgradeingsystem slik at spillere opplever effektivisering, progresjon og føler eierskap. Jeg har tenkt på oppgraderbare propeller, høtter, kniver, og eventuelt andre ting.» Med bilder fra Ships at Sea (Misc Games): kniver i tre trinn, høtter i tre trinn, «Tier 2 boat: new longline setter 2» og ti propeller.
- Svarene hans samme dag, på forslagene i chatten:
  1. **Kniven:** «kniv brukes allerede i dag til både bløgging og sløying, og jeg tenker en oppgradering kutter ned på tiden brukt samt kvaliteten på sløyingen. Høtten minsker risikoen for tap av fisk generelt, ikke bare kveite.»
  2. **Trinn på dekksutstyret som finnes:** «enig».
  3. **Propellen:** «propellene må også gi en reell økning i farten på båten, men ikke så mye at det blir uattraktivt å kjøpe trim-boost for ekte penger.» Og: «nivåene burde være fra 10-30% økning eller noe sånt. Det gir en merkbar endring for brukerne.» Etter innvendingen om skrogfarten: «Ja, skill på dem som du foreslo» (planende 10, 20 og 30 %, deplasement 5, 10 og 15 %).
  4. **Én side for båten og utstyret:** «enig».
  5. **Stell:** «mannskap sliper allerede kniverene ombord i dag automatisk, og slik skal det fortsatt være. Det blir for tungvint om dette må gjøres på land. Høtten trenger ikke vedlikehold. Dropp "fars kniv". Jeg tenker at kjøp av kniver, høtter, juksautstyr, halere og alt sånt hører hjemme i utstyrsbutikken.»
  6. **Høtten og trekketida:** «Hva med at høtten også effektiviserer tiden det tar å trekke opp et garn eller en line litt fordi det er enklere å få fisken ombord?» Svaret som ble enighet: ja for line og juksa, nei for garn og teiner, og lite.
  7. **Regelen for prosentene:** «jeg mener ikke vi skal ha en renters rente-effekt på oppgraderingene. Om det står 10% økning feks, så betyr det at økningen er 10% opp fra grunnnivået båten eller utstyret hadde.»

## Slik er det i dag

Spillet har alt mange oppgraderinger, men de er spredt på fem steder, nesten alle er priset som en andel av båtens pris, og ingen av dem gjelder det spilleren gjør med hendene.

| Sted | Oppgraderinger i dag | Hvor i koden |
|---|---|---|
| Verftet › Oppgrader | Lasterom 3 trinn, motor 2 trinn, lugarer 3, messe og bysse 3, tørkerom og bad 2, isolert lasterom 2, drivstofftank 2, stabilisering 2, sløye- og ismaskin over 14,99 m; 30 ekte minutter per jobb, «Ferdig nå» for ekte penger | `HOLDUP`, `ENGUP`, `UPGS`, `upgLv`, `applyVessel` i `core/03-simulation.js`; `YARD_KINDS`, `queueJob`, `finishJob` i `core/06-services.js`; kortene i `ui/phone/12-utstyr-redskap.js`; handlingen `upg` i `phone/14-act.js`; `tests/yardupgtest.py` |
| Verftet ellers | Skrogrens, antigro, reparasjon, kasko, Malerverkstedet | `foulHour` i `03-simulation.js`, `16c-hull.js`, `ui/10j-paint.js` |
| Utstyrsbutikken | Halere, juksamaskin, kveiteutstyr, 90 hk påhengs til skiffen, CHIRP, sonar, to radarer, krabbekar, oljehyre og varmedress, kroker, juksasett, blåsesett, garn, line, teiner; ett trinn per vare | `EQUIP`, `equipFits` i `core/02-species-gear.js`; `buyGate` i `core/10-gear.js`; varekortet `ui/05a-itemcard.js` (`ICFX` regner linjene av kjernens tall); `equipBuy` i `ui/phone/13b-nettet.js` |
| Slitasje og stell | Line, garn, teiner og juksasett slites, tak som synker, bøting og krokbytte av mannskapet eller butikken, tilbakekjøp | `CARE`, `wearOf`, `careTick` i `core/10b-gearcare.js`; `tests/caretest.py` |
| Båtstigen | Ti kystbåter og havbåtene, «Neste mål», hjemler, blad B, lån, båtsalg mellom spillere | `VESSELS`; `goals()` i `ui/phone/10-fartoy.js`; `core/09k-market.js` |
| Naustet | Tett tak, vedovn, fars arbeidsbenk, trofévegg | `NAUST_UP` i `core/07c-naust.js` |
| Ekte penger | Haill, trim, Skippertak, «Ferdig nå», maling, flagg, ønskenummer | `BOOSTS`, `HAILL`; `ui/10i-shop.js` |

**Kniver og høtter finnes ikke som gjenstander.** Sløyinga er en mannskapsjobb med faste plasser (`13-work.js`, `DECK.gut` i `core/05-vessels.js`: 5 kg per person og minutt), kniven nevnes bare i replikkene og i ledig-oppgaven «Sliper kniven» (`13-work.js`), og høtten bare i teksten til kveiteutstyret og i autolinas kommentar om haleporten. Propellen finnes bare som motortrinnene og trimmen.

**Det som alt finnes og som trinnene kan bygge på:**

- **Feilene på dekk** (`crewSlip` i `core/14-crewlife.js`, Jonas 23.10.2026): hvert minutt på dekk, rundt 0,12 % per person og litt mer sliten, kald, i sjø, uerfaren eller umotivert, skjer én av tre ting: en fisk går over ripa (45 %, 1,5–4,5 kg av den største lotten), en fisk blir stygt sløyd (30 %, friskheten på lotten faller litt, «Den blir litt dårligere betalt»), eller noen skjærer seg (25 %, fire timer saktere). Det er omtrent én gang på en lang dag ved bordet. Kniven kan senke de to siste, høtten den første.
- **Juksespillet** (`land(m)` i `ui/10-rod-acts.js`): et dårlig timet napp gir halv treff, og da glipper det halvparten av gangene. Høtten kan senke glippet.
- **Trekketida** (`gopUnitMin` i `core/10-gear.js`): `GEAR[kind].haul` ganger enhetene, delt på hendene ved haleren og laget (`workTeam`, `teamEff`), ganget opp for hånd uten haler (`hand`). Høttens lille del og halernes trinn hører inn her, som én formel.
- **Kvaliteten** er friskhetsgraden (`grade` i `03-simulation.js`, E til V etter Huss et al.), og all fisk regnes som godt bløgget (`bled` er alltid sann i `addCatch`). Det finnes ingen egen pris for sløyekvalitet. Kommentaren i koden nevner at Råfisklagets minstepriser gjelder godt bløgget fisk, og at dårlig bløgget fisk kan trekkes inntil 40 %; det er ikke bygd.
- **Farten** stables i dag med renters rente: `applyVessel` ganger `vmax` med motorens `speedOfPower` (kubikkrot for deplasement med tak 12 %, kvadratrot for planende) og så med trimmen (`T.x`). `dynCalOf` i `core/16b-dyn.js` leser `BOAT.vmax / V.vmax`, så alt som går gjennom `applyVessel` når roret (rettet 06.11.2026 etter Tonys trim).

**Hvorfor det ikke kjennes som progresjon:** lagringene i skyen 07.11.2026 (34 med sammendrag) står 30 i trebåten, 2 i snekka, 1 i havsjarken og 1 i den nye hurtigsjarken. På trebåten finnes ikke lasteromstrinn (karene er fulle), ikke lugar, messe eller tørkerom (ingen køyer), ikke stabilisering (under 9 m); motortrinnet koster minsteprisen og gir 0,2 knop. Første oppgradering spilleren merker er juksamaskinen til 34 000 kr, og neste er snekka til 245 000. Mellom et par tusen og 34 000 kr er det nesten ingenting å kjøpe utenom klær, kroker og naustet. Det meste av verftets trinn er usynlig (en faktor i en formel), og ingen side viser alle trinnene samlet.

## Prinsippene

1. **Prosentene regnes av grunnivået og legges sammen** (Jonas 07.11.2026, punkt 7). Et trinn viser hele økningen over grunnivået, ikke økningen fra trinnet under. Båtens grunnivå er `VESSELS[type]`, utstyrets er tabellens tall (`DECK.gut`, `GEAR[kind].haul`, `GEAR[kind].set`). Fart: `V.vmax × (1 + propell + motor + trim)`, der motor er `speedOfPower(P) − 1` som i dag og trim er `T.x − 1`. Forbruk: `fuelK × (1 + 0,4·(P − 1) − propellForbruk)`. Mannskapets ferdighet (`teamEff`) ganges inn etterpå som i dag; det er et annet system og røres ikke.
2. **Effektivisering er tid, kvalitet, svinn og diesel, ikke fisk per time.** Fangsten er kalibrert mot ERS-sedlene og begrenset av kvotene (`docs/systemer/redskap.md`, Kalibrering), så ingen av trinnene ganger på `density`, `luck` eller `GEAR.q`. Det ene unntaket står som V1.
3. **Trinn 1 er det spilleren har i dag.** Ingen ny straff legges inn for at et trinn skal ha noe å fjerne. Kniven og høtten om bord er trinn 1 på alle båter fra start, uten kjøp og uten fylling av gamle lagringer: en lagring uten feltet er trinn 1.
4. **Alt for spillkroner, i de tre handelsstedene.** Kniver, høtter, juksautstyr, halere, linesetter og garnrenne i utstyrsbutikken; propellen på verftet som motortrinnene. Ingenting av dette selges for ekte penger; haill, trim og «Ferdig nå» står som før. `buyGate` og `equipFits` avgjør hva som kan kjøpes, som alt annet.
5. **Per båt.** Knivsettet og høtten er båtens, som halerne, fordi mannskapet bruker og sliper dem. De følger båten ved innbytte og salg (`mbPack` tar `S.equip` med i dag). Ingen personlig gjenstand som følger fiskeren.
6. **Ingen vedlikehold.** Mannskapet sliper knivene om bord som i dag (ledig-oppgaven står), høtten trenger ingenting. Ingen slitasje på trinnene.
7. **Synlig.** Hvert trinn har et varekort med sine tall (`ICFX`), står på siden «Båten og utstyret», og det som har modell, tegnes på båten på festepunktene (modulært, `docs/systemer/redskap.md` 5.62). Patchnotes nevner bare hva det gjør.

## Designet

### Kniven (knivsett per båt, utstyrsbutikken)

| Trinn | Navn | Sløyetempo (`DECK.gut`) | Stygt sløyd og kutt (`crewSlip`) | Pris |
|---|---|---|---|---|
| 1 | Knivene om bord | som i dag, 5 kg per person og minutt | som i dag | følger båten |
| 2 | Nye sløyekniver | +10 % | −30 % | 1 500 kr per sløyeplass (`stations.table`) |
| 3 | Sløyekniver i ett stykke og stålhansker | +20 % | −50 % | 4 500 kr per sløyeplass |

- Tempoet ganges inn der `DECK.gut` brukes (`deckMinute`, `deckEta` i `core/05-vessels.js`, `left.sloy` i `13-work.js`), som én faktor `knifeX(b)` fra kjernen. Sløyemaskinen og fabrikkene (`gutMachine`, havbåtene) rører den ikke.
- Feilene: i `crewSlip` ganges sannsynligheten for grenene «stygt sløyd» og «kutt» med `1 − kniv`, aldri grenen «over ripa».
- **Det må sies ærlig på kortet:** kvaliteten er en liten effekt, fordi feilene er sjeldne; tida er den store. Alene i båten er sløyinga flaskehalsen (bløggekaret fylles, fisket stopper), så kniven gir flere kilo per dag for den som fisker alene, selv om fangsten per time står. Det måles med `tests/fiskeplay.py` per trinn før tallene settes.
- Ikke på havbåtene (`cls: 'hav'`, fabrikk).

### Høtten (én per båt, utstyrsbutikken)

| Trinn | Navn | Fisk over ripa (`crewSlip`) | Glipp i juksespillet (`land`, halv treff) | Trekk av line (`gopUnitMin`) | Pris |
|---|---|---|---|---|---|
| 1 | Høtten om bord | som i dag | 50 % | som i dag | følger båten |
| 2 | Stålhøtt | −30 % | 40 % | −4 % tid per stamp | 900 kr |
| 3 | Lang høtt med krok av stål | −60 % | 30 % | −8 % tid per stamp | 2 900 kr |

- Grenen «over ripa» i `crewSlip` ganges med `1 − høtt`. Glippet i `land(m)` for `m === 0.5` leser høtten. Linetrekket får faktoren i `gopUnitMin`, bare `g.kind === 'line'` og `g.op === 'haul'`, ikke autolina (maskinens tempo), ikke garn (tømmes ved garnbordet) og ikke teiner.
- **Synlig svinn:** fisk tapt over ripa telles (`S.stats.lostRail`, kg og antall) og står på «Båten og utstyret» og på høttens kort («Tapt over ripa denne uka: 3 fisk, 9 kg»), så spilleren ser hva høtten redder. 3D-kroken `hooks.onCrewFx(c, 'slip', …)` finnes alt; OPP5 gir den et plask.
- Juksespillets glipp er det ene stedet høtten gir mer fangst: nappet er alt «due», så det er tapt fangst som blir tatt, ikke mer fisk i sjøen. Snittet per time for en som timer nappene dårlig går opp noen prosent; måles i `fiskeplay.py juksa`.

### Dekksutstyret i trinn (utstyrsbutikken)

| Vare | Trinn 2 | Trinn 3 | Pris for trinnene |
|---|---|---|---|
| Juksamaskin (V1 A) | «med autostopp»: én person passer fire | «med skjerm og telling»: én person passer fem | 12 000 og 24 000 kr per maskin om bord |
| Linehaler | +10 % trekkfart (25 til 22,5 min per stamp) | +20 % (20 min) | halve nyprisen, så hele nyprisen en gang til (34 000, 68 000) |
| Garnhaler | +10 % (4 til 3,6 min per garn) | +20 % (3,2 min) | 47 500, 95 000 |
| Teinehaler | +10 % (1,2 til 1,08 min per teine) | +20 % (0,96 min) | 29 000, 58 000 |
| Juksasett (markkroker og pilk, kveitepilk) | bedre kroker og pilk: slites halvparten så fort (`CARE.jig.wear`) | – | +50 % på settets pris |

**Nye dekksmoduler** (Ships at Sea sin «longline setter»):

| Vare | Krever | Trinn 1 | Trinn 2 | Pris |
|---|---|---|---|---|
| Linesetter (renne med magasin over hekken) | linehaler | −20 % settetid (`GEAR.line.set`: 5 til 4 min per stamp) | −35 % (3,25 min) | 24 000 og 22 000 kr |
| Garnrenne (renne over hekken for setting) | garnhaler | −25 % settetid (`GEAR.garn.set`: 0,8 til 0,6 min per garn) | – | 18 000 kr |

- Trinnene ligger i `EQUIP[k].tiers` (navn, tall og pris per trinn), kjøpes trinn for trinn (`buyGate` nekter trinn 3 uten trinn 2), og lagres som tallet i `S.equip[k]` (i dag `true` eller antall; `jukse` teller maskiner og får `S.equip.jukseLv` ved siden). En haler på trinn 2 kjøpt til en båt som ikke passer, finnes ikke: `equipFits` som før.
- Halernes trinn og høttens lille del ganges inn i `gopUnitMin` etter regelen i prinsipp 1: `base × (1 − haler − høtt)`, aldri `(1 − haler) × (1 − høtt)`.
- Modellene for linesetter og garnrenne kommer i OPP5; effekten kan gå i OPP2 med kortet og «om bord», som plotteren og ekkoloddet i dag.

### Propellen (verftet, per båt, `b.propLv`)

| Trinn | Fart, planende skrog | Fart, deplasementsskrog | Forbruk | Akselerasjon | Pris |
|---|---|---|---|---|---|
| 1 | +10 % | +5 % | −5 % | +5 % | 2 % av båtprisen, minst 2 500 kr |
| 2 | +20 % | +10 % | −10 % | +10 % | 4 %, minst 4 000 kr |
| 3 | +30 % | +15 % | −15 % | +15 % | 7 %, minst 6 500 kr |

- Ny tabell `PROPUP` i `core/03-simulation.js`, ny jobb `prop` i `YARD_KINDS` og `finishJob` (`core/06-services.js`), 30 ekte minutter som de andre, kortet under Verft › Oppgrader (`phone/12-utstyr-redskap.js`, handlingen i `14-act.js`), raden i databladet (`phone/10-fartoy.js`). Ikke påhengsmotor (skiffen har `motor90` i stedet) og ikke havbåtene.
- **Den additive regelen bygges i samme økt:** `applyVessel` regner `sum = propell + (speedOfPower(P) − 1) + (T ? T.x − 1 : 0)` én gang og setter `vmax`, `vcruise` og `accel` av typens tall. Trimmen gir dermed like mange knop uansett propell, og «dobbel fart» er dobbelt av grunnfarten. `trimSet`/`trimEnd` og `speedPin` (rutefarten) er som før; `dynCalOf` leser `BOAT.vmax` og trenger ingen endring, men `tests/unit/trimfart.test.mjs` utvides med summen.
- Summen av de varige trinnene per båt, uten trim (motorens del er `speedOfPower` på trinn 2):

| Båt | Grunnfart | Propell 3 | Motor 2 | Sum | Med turbotrim (+100 %) |
|---|---|---|---|---|---|
| Trebåt 7 kn | 7,0 | +15 % | +6,3 % | 8,5 kn | 15,5 kn |
| Havsjark 10 kn | 10,0 | +15 % | +6,3 % | 12,1 kn | 22,1 kn |
| Hurtigsjark 22 kn | 22,0 | +30 % | +9,5 % | 30,7 kn | 52,7 kn |
| Ny hurtigsjark 25 kn | 25,0 | +30 % | +9,5 % | 34,9 kn | 59,9 kn |

(Raden for ny hurtigsjark er fra før 05.11.2026: Jonas satte henne da til 12 kn med deplasementsskrog, så hun får +15 % og ikke +30 %. De målte tallene for alle fire står under «OPP3, målt».)

- Trebåten på trinn 3 går forbi snekka og plastsjarken i fart. Det er greit: de selger på last, plass og mannskap, ikke fart.
- Bremselengder og svingradier ved høyere toppfart på de planende båtene sjekkes i `routetest` og `obstest`; `trackfollow` (3D) bare om `16b-dyn.js` endres.

### «Båten og utstyret» og «Neste mål»

- **Siden** ligger i Fartøy-appen (`ui/phone/10-fartoy.js`) som egen seksjon øverst, for båten du følger: hver stige som én linje med prikker (●●○), navnet på trinnet, neste trinn med pris og virkning i spillerens egne tall (kg per time ved bordet, minutter per stamp eller garn, knop, liter per time), hvor det kjøpes (butikk eller verft) med «Nærmeste» og Autonav dit (`nearestKind` i `core/06c-steder.js`). Stigene: kniv, høtt, juksamaskin, halerne som passer, linesetter og garnrenne, propell, motor, lasterom, verftets `UPGS`, ekkolodd og sonar, antigro. Det som ikke passer båten, står ikke. Det som er fullt, står med alle prikker fylt.
- **Tapt over ripa** og **minutter per stamp i dag** står på siden som tall, så svinn og tid blir synlige før kjøpet.
- **«Neste mål»** (`goals()`) får ett utstyrstrinn mellom båttrinnene etter regelen: det billigste ukjøpte trinnet som koster under en tidel av neste båt i stigen, bare når flåten er én båt (som håndjuksa og første juksamaskin i dag). Med flere båter står stigen som før.
- **Trakten** (`admin_funnel`, `supabase/migrations/20261007150000_funnel.sql`, fanen «Trakt» i `src/admin/`): ett tall til, «andel med minst ett kjøpt trinn innen dag 7», fra hendelsene `shop_buy {w, k, lv}` (finnes, får `lv`) og ny `upg {k, lv}` fra verftet. Ny migrering som utvider funksjonen; `tests/sqltest.py`.
- Håndboka kapittel 8 «Utstyr og redskap» (`HB`, `lex_*`) får oppføringene for kniv, høtt, linesetter, garnrenne og propell.

### Modellene i 3D (OPP5)

- Kniven i handa ved sløyebordet (fisken tegnes alt i hendene, `drawDeck`), høtten på ripa ved haleplassen (`drawHaulRest`-mønsteret i `view3d/10-gear.js`), linesetter og garnrenne over hekken på festepunktene (`anchors`, dekkskartet), et plask i sjøen ved `onCrewFx 'slip'`. Blender: `tools/deck/kniv.py`, `hott.py`, `linesetter.py`, `garnrenne.py` etter `/blender`, uten merker. Propellen er under vann og tegnes ikke.
- «Prøv på båten» (`G3.TRY3D`) får linesetter og garnrenne.
- Jonas ser modellene før utrulling (som H3d1).

## Fasene

| Fase | Hva | Filer | Tester | Måles |
|---|---|---|---|---|
| **OPP1 Kniv og høtt** | `EQUIP.kniv` og `EQUIP.hott` med `tiers`; `knifeX`/`hookX` i kjernen; `DECK.gut` ganget i `deckMinute`, `deckEta`, `left.sloy`; grenene i `crewSlip`; glippet i `land(m)`; linetrekket i `gopUnitMin`; `S.stats.lostRail`; kortene i butikken med «om bord · trinn 1» og «Tapt over ripa»; `ICFX`-linjene; `buyGate` trinn for trinn; patchnote | `core/02-species-gear.js`, `05-vessels.js`, `13-work.js`, `14-crewlife.js`, `10-gear.js`, `ui/10-rod-acts.js`, `ui/05a-itemcard.js`, `ui/phone/12-utstyr-redskap.js`, `13b-nettet.js`, `01-i18n.js`, `07-patch.js` | ny `tests/unit/oppgradering.test.mjs` (summene, `DECK`-faktoren, `crewSlip` med `CREW_SEED`, `gopUnitMin` line, `buyGate`), ny `opptest.py` (kjøp bare ved butikkens kai, kortet, trinn 2 før 3, gammel lagring er trinn 1), `worktest`, `shoptest`, `itemcardtest`, `caretest`; sett rød først | `fiskeplay.py` alene og med mannskap per trinn (kg per dag, minutter ved bordet); `worktest` tida ved bordet |
| **OPP2 Trinn på dekksutstyret** | `tiers` på juksamaskin (V1 A), halerne og juksasettene; linesetter og garnrenne som varer uten modell; `JIG` (maskiner per person) i `03-simulation.js`; `gopUnitMin` med haler-trinn og settetid; kortene | `core/02-species-gear.js`, `03-simulation.js`, `10-gear.js`, `10b-gearcare.js`, `ui/phone/12-utstyr-redskap.js`, `05a-itemcard.js`, `01-i18n.js`, `07-patch.js` | `oppgradering.test.mjs` utvidet, `jig.test.mjs`, `geartest` (minutter per stamp, garn og teine per trinn), `caretest`, `itemcardtest`, `opptest` | `geartest` tidene; `fiskeplay.py line` og `garn` |
| **OPP3 Propellen og den additive regelen** | `PROPUP`, `b.propLv`; `applyVessel` regner summen én gang (propell, motor, trim); jobben `prop` på verftet; kortet og databladets rad; `cloudEv('upg')` | `core/03-simulation.js`, `06-services.js`, `ui/phone/12-utstyr-redskap.js`, `14-act.js`, `10-fartoy.js`, `01-i18n.js`, `07-patch.js` | `trimfart.test.mjs` (summen, ikke produktet: 25 × 2,395), `yardupgtest`, `fuelcal`, `boostklokke`, `routetest` og `obstest` med toppfart på hurtigsjarkene, `kjoptest` (trim gir like mange knop med og uten propell); sett rød først | tabellen over målt i spillet per båt; dieselregnskapet per tur |
| **OPP4 «Båten og utstyret», Neste mål og trakten** | seksjonen i Fartøy-appen; `goals()` med utstyrstrinnet; Håndboka kap. 8; migreringen som utvider `admin_funnel`; admin-fanen | `ui/phone/10-fartoy.js`, `ui/07c-handbook.js`, `01-i18n.js`, `supabase/migrations/`, `src/admin/index.html`, `07-patch.js` | `vesseltest` (Neste mål, sett rød: trebåt med 40 000 kr får kniv trinn 2, ikke snekka), `opptest` (siden i begge formater, skjermbilder), `sqltest`, `admintest` | trakten: andel med kjøpt trinn innen dag 7, før og etter datoen |
| **OPP5 Modellene** | kniv, høtt, linesetter, garnrenne i Blender; tegningen på festepunktene; plasket; «Prøv på båten» | `tools/deck/`, `src/data/*.b64`, malen, `view3d/10-gear.js`, `09-landing-deck.js`, `25-controls.js`, `vessel3d.js` | `vesseltest` (delene finnes, målene), `deckshot`, `geartest` 3D, `trytest`; kontrollbilder i `tools/deck/out/` | Jonas ser modellene; ingen tall |

### OPP1, målt 07.11.2026 (før tallene ble satt)

`tests/fiskeplay.py kniv1 kniv2 kniv3 kniv1m kniv2m kniv3m` (frø 1, uten 3D, ny side per kjøring): trebåten (bløggekar 60 kg, rom 500 kg) med håndjuksa på et torskested nord for Senja på startdagen (1. mars), ti timer jukse, så til fangsten er sløyd og iset. Kniv og høtt på samme trinn. «Minutter ved bordet» er minuttene noen sløyde eller iset; «dine» er skipperens egne (`S.deckMe`).

| | Trinn 1 | Trinn 2 | Trinn 3 |
|---|---|---|---|
| Alene, kg etter 6 t | 306,5 | 307,4 (+0,3 %) | 310,8 (+1,4 %) |
| Alene, minutter ved bordet etter 6 t | 61 | 55 (−10 %) | 51 (−16 %) |
| Alene, rommet fullt (500 kg) etter | 9,40 t | 9,42 t | 9,32 t |
| Alene, minutter ved bordet hele dagen | 105 | 95 (−10 %) | 87 (−17 %) |
| Med én mann, rommet fullt etter | 4,65 t | 4,82 t | 4,80 t |
| Med én mann, minutter ved bordet hele dagen | 91 | 84 (−8 %) | 69 (−24 %) |
| Med én mann, dine minutter ved bordet | 45 | 29 | 0 |
| Fisk over ripa, stygt sløyd, kutt (en dag) | 0 | 0 | 0 |

- **Det kniven gir, er tid, som planen sa.** Alene i trebåten står skipperen ved bordet 10 og 17 % kortere; kiloene øker bare 0,3 og 1,4 % på seks timer, fordi sløyinga tar om lag 100 av 560 minutter, og rommet på 500 kg er fullt etter drøyt ni timer på alle trinn. «Flere kilo per dag for den som fisker alene» (designet over) stemmer bare der karet er flaskehalsen; med håndjuksa på trebåten er det rommet. Med en mann om bord holder han sløyinga alene fra trinn 3, og skipperen kan jukse hele tida (45, 29 og 0 minutter ved bordet).
- **Feilene er så sjeldne at én dag ikke viser dem** (ingen i de seks spilte dagene). Andelene er målt i `tests/unit/oppgradering.test.mjs` med frøsatte terninger: 400 000 minutter gir 1 589 over ripa, 1 102 stygt sløyde og 867 kutt på trinn 1; kniv 3 halverer de to siste, høtt 3 tar 60 % av den første, trinn 2 30 %.
- **Høttens trekk og glipp** er ikke målt i en spilt dag (trebåten har ingen linehaler, og juksespillet timer en person): `gopUnitMin` og `jigSlip` er regnet i enhetstesten (21,4, 20,6 og 19,7 min per stamp hyseline; glipp 50, 40 og 30 %). Måles i OPP2 med `fiskeplay.py line`.
- **Tallene i tabellene over står** (+10/+20 % tempo, −30/−50 % feil, −30/−60 % over ripa, −4/−8 % trekk). Målingen ga ingen grunn til å flytte dem; Jonas kan flytte dem.

### OPP2, målt 07.11.2026 (dekksutstyret i trinn)

`tests/fiskeplay.py line1 line2 line3 garn1 garn2 garn3` (frø 1, uten 3D, ny side per kjøring): havsjarken på startdagen (1. mars). Line alene: fire stamper hyseline på et hysested utenfor Senja, 12 timers ståtid; linehaleren og høtten på trinn 1, 2 og 3, og linesetteren på trinn 2 (setteren) og 3 (med stampemagasin). Garn med én mann om bord: ti torskegarn 180 mm utenfor Gryllefjord, 18 timer; garnhaleren og høtten på trinnet, garnrenna fra trinn 2. «Farten ved haleren» er `gopUnitMin` når trekket begynner (før bløggekaret fylles); «trekket i alt» er spillminuttene fra første til siste enhet.

| | Trinn 1 | Trinn 2 | Trinn 3 |
|---|---|---|---|
| Line, satt (min per stamp) | 5,5 | 4,25 (−23 %) | 3,5 (−36 %) |
| Line, farten ved haleren (min per stamp) | 25,7 | 22,1 (−14 %) | 18,5 (−28 %) |
| Line, trekket i alt (min per stamp) | 30,5 | 26,75 (−12 %) | 23,0 (−25 %) |
| Line, fangst (kg) | 61,6 | 59,0 | 59,5 |
| Garn, satt (min per garn) | 0,9 | 0,7 (−22 %) | 0,7 |
| Garn, farten ved haleren (min per garn) | 4,87 | 4,39 (−10 %) | 3,90 (−20 %) |
| Garn, trekket i alt (min per garn) | 12,5 | 11,9 (−5 %) | 11,2 (−10 %) |
| Garn, fangst (kg) | 688 | 691 | 690 |

- **Andelene legges sammen, som prinsipp 1 sier:** på line er farten ved haleren 14 og 28 % kortere (haleren 10 og 20 %, høtten 4 og 8 %), ikke 0,9 × 0,96. Settinga er 20 og 35 % kortere i modellen; i spilte minutter 23 og 36 % fordi minuttene rundes.
- **Fangsten står** (61,6, 59,0 og 59,5 kg line; 688–691 kg garn): trinnene er tid, ikke fisk per time (prinsipp 2, V1 A).
- **På garna er dekket flaskehalsen:** med nesten 700 kg torsk fyller bløggekaret seg, trekket går saktere (`haulSlow`), og haleren venter på dem som bløgger og sløyer. Farten ved haleren er 10 og 20 % kortere, men trekket i alt bare 5 og 10 %. Kniven (OPP1) og flere hender gir mer der. Kortet viser farten ved haleren for én person (grunnivået), ikke dagens trekk.
- **Garnrenna** gir 0,9 → 0,7 min per garn (ti garn: 9 → 7 minutter). Det er lite i en dag, men det er det planen ba om.
- **Juksamaskinenes trinn** er regnet, ikke spilt: én person passer 3, 4 og 5 maskiner (innsatsen alene 12, 16 og 20 med fem maskiner, `tests/unit/jig.test.mjs`); på plastsjarken (fire) gir trinn 2 en maskin til, og trinn 3 nektes. Juksasettenes slitasje (halvparten) og høttens glipp i juksespillet (OPP1) er regnet i enhetstesten, ikke i en spilt dag: juksespillet trenger en som timer nappene.
- **Tallene i tabellene over står.** Målingen ga ingen grunn til å flytte dem; Jonas kan flytte dem.

### OPP4, målt 07.11.2026 (trakten før datoen)

Trakten (`admin_funnel`, «kjøpt trinn innen dag 7», migreringen `20261107160000_funnel_tier.sql`), regnet med samme regel som funksjonen, bare summer, 07.11.2026 15:03 UTC:

| Kull | Startet (med statistikk) | Har hatt sju dager | Kjøpt trinn innen dag 7 |
|---|---|---|---|
| Før 07.11.2026 | 21 | 14 | 0 (0 %) |
| Fra 07.11.2026 | 0 | 0 | – |

- Ingen spiller hadde kjøpt et trinn ennå (0 `shop_buy` med `lv`, 0 `upg` de siste 30 dagene): trinnene kom med OPP1 samme dag rundt 13:00 UTC. Ukene før er derfor nullpunktet. Kullene er små: 7, 5, 0, 4 og 5 nye spillere med statistikk i ukene fra 5.10, 12.10, 19.10, 26.10 og 2.11. De fem fra uka 2.11 startet før datoen, men har dagene sine etter OPP1 og kan fortsatt telle; de første som startet med trinnene i butikken, leses av fra 14.11.2026. Tallet bør leses over to–tre uker før noe vurderes.
- Bare spillere som deler bruksstatistikk, er med (de alene har økter og hendelser).

### OPP3, målt 12.11.2026 (farten og dieselen)

Målt med spillets egen kjerne (`applyVessel`, manøvermodellen `dynCalOf`/`dynInt` på full gass i stille vann til farten står, og `fuelLph`), i Node med den samme koden som spillet kjører; i nettleseren går hurtigsjarken i 30,7 og 52,7 kn til et stopp og under Gisundbrua (`routetest`, `obstest`). Toppfart i knop, papiret (`BOAT.vmax`) / modellen:

| Båt | Grunnfart | Propell 3 | Motor 2 | Sum (propell 3 + motor 2) | Med turbotrim | Turbotrim alene | Med den gamle regelen (produktet) |
|---|---|---|---|---|---|---|---|
| Trebåt (7 kn, deplasement) | 7,00 / 6,93 | 8,05 / 7,91 | 7,44 / 7,35 | 8,49 / 8,31 | 15,49 / 15,26 | 14,00 / 13,77 | 17,11 |
| Havsjark (10 kn, deplasement) | 10,00 / 9,82 | 11,50 / 11,18 | 10,63 / 10,38 | 12,13 / 11,79 | 22,13 / 21,84 | 20,00 / 19,72 | 24,44 |
| Hurtigsjark (22 kn, planende) | 22,00 / 21,70 | 28,60 / 28,25 | 24,10 / 23,78 | 30,70 / 30,32 | 52,70 / 52,07 | 44,00 / 43,48 | 62,66 |
| Ny hurtigsjark (12 kn, deplasement) | 12,00 / 11,66 | 13,80 / 13,46 | 12,75 / 12,40 | 14,55 / 14,24 | 26,55 / 26,22 | 24,00 / 23,69 | 29,33 |

- Modellen ligger 1–3 % under papiret (vind og drift i stille vann er null; skrogets motstand), som før OPP3 (`trimfart.test.mjs` krever innen 3 %).
- Trimmen gir like mange knop med og uten propell: turbotrim gir hurtigsjarken +22,0 kn på 22 kn og på 28,6 kn (`trimfart.test.mjs`, `yardupgtest`).
- Med motor 2 og trim er farten nå lavere enn før: hurtigsjarken går 46,1 kn med motor 2 og turbotrim, mot 48,2 kn med produktet. Det er regelen (prinsipp 1).

**Dieselregnskapet for en tur:** 20 nm ut og 20 nm hjem (40 nm), stille vann, tom båt, rent skrog, `fuelLph` × timene. Fart, timer og liter:

| Båt | Fart | Uten propell | Propell 3 | Propell 3 + motor 2 | Propell 3 ved samme fart som uten |
|---|---|---|---|---|---|
| Trebåt | marsj | 6,0 kn · 6,7 t · 6,5 L | 6,9 kn · 5,8 t · 6,0 L | 7,3 kn · 5,5 t · 6,8 L | 5,5 L |
| Trebåt | full | 7,0 kn · 5,7 t · 12,2 L | 8,1 kn · 5,0 t · 11,0 L | 8,5 kn · 4,7 t · 12,3 L | 6,0 L |
| Havsjark | marsj | 8,5 kn · 4,7 t · 53 L | 9,8 kn · 4,1 t · 50 L | 10,3 kn · 3,9 t · 58 L | 45 L |
| Havsjark | full | 10,0 kn · 4,0 t · 93 L | 11,5 kn · 3,5 t · 86 L | 12,1 kn · 3,3 t · 97 L | 51 L |
| Hurtigsjark | marsj | 17,0 kn · 2,4 t · 126 L | 22,1 kn · 1,8 t · 133 L | 23,7 kn · 1,7 t · 155 L | 109 L |
| Hurtigsjark | full | 22,0 kn · 1,8 t · 156 L | 28,6 kn · 1,4 t · 167 L | 30,7 kn · 1,3 t · 196 L | 132 L |
| Ny hurtigsjark | marsj | 10,0 kn · 4,0 t · 212 L | 11,5 kn · 3,5 t · 203 L | 12,1 kn · 3,3 t · 233 L | 181 L |
| Ny hurtigsjark | full | 12,0 kn · 3,3 t · 364 L | 13,8 kn · 2,9 t · 337 L | 14,6 kn · 2,8 t · 381 L | 211 L |

- Propellen sparer 15 % ved samme fart. Går båten fortere med den (marsj og full følger toppfarten), sparer et skrog som ikke planer, likevel 4–10 % på turen og kommer fram 13 % før; den planende hurtigsjarken bruker 6–8 % mer på turen og kommer fram 23 % før, fordi forbruket stiger med farten.
- Ved full fart sparer propellen mye mer ved samme fart (trebåten 12,2 → 6,0 L), fordi forbrukskurven til et deplasementsskrog stiger bratt over 90 % av toppfarten (`fuelBase`), og propellen flytter toppfarten opp. Det er kurven slik den er; ikke kalibrert mot ekte båter.
- Prisene for trinn 1–3: trebåten 2 500, 4 000 og 6 500 kr (gulvene), snekka 5 000, 10 000 og 17 000, havsjarken 23 000, 46 000 og 81 000, hurtigsjarken 98 000, 196 000 og 343 000, kystbåten på 15 m 360 000, 720 000 og 1 260 000 kr (`yardupgtest`, `opptest`).

**Rekkefølgen:** OPP1 og OPP4 først, fordi begge treffer første uke på trebåten og kan leses av i trakten. Så OPP3, OPP2 og OPP5. OPP1 og OPP3 rører `core/03-simulation.js`, `05-vessels.js`, `10-gear.js` og `14-crewlife.js`, som Ø8b S0, S2 og M (køen steg 5, 7, 8) også eier mens de går; rutinens regel om filer avgjør hvem som går først.

## Valget

### V1. Juksamaskinens trinn

**Valgt: A** (Jonas 07.11.2026: «A»).

- **A (anbefalt): bare flere maskiner per person.** Trinn 2 lar én person passe fire, trinn 3 fem (`JIG` i `03-simulation.js`), innenfor `jukseMax`. Hvorfor: det er tid og hender, ikke fisk per time, som prinsipp 2 sier, og maskinen er alt et fangsttrinn (4,0 mot håndjuksa 2,0). Ulempen er ærlig: på trebåten og snekka (2 og 3 maskiner) gir trinnet ingenting, så det teller fra plastsjarken og opp.
- B: som A, og i tillegg +5 % og +10 % per maskin. Merkes på alle båter, men er det ene trinnet som gir mer fisk per time og må kalibreres mot `docs/systemer/redskap.md`.
- C: ingen trinn på juksamaskinen.

## Antatt og usikkert

- **Alle tallene er startverdier** uten kilde: ingen måling finnes av hva en bedre kniv gjør med sløyetida, eller en høtt med svinnet. De settes etter `fiskeplay.py` og `geartest`, og Jonas kan flytte dem.
- **Per båt og propellen på verftet** er valgt av økta ut fra svarene 07.11.2026 (mannskapet sliper knivene, alt følger båten, verftet har motoren); Jonas har ikke sagt «per båt» med de ordene.
- **Kvaliteten fra kniven er liten,** fordi feilene på dekk er sjeldne. Vil Jonas ha kvaliteten synlig på sluttseddelen, må det bygges et eget sløyekvalitetstrekk, og det er en annen plan (Råfisklagets prisregler for dårlig bløgget fisk er kilden; ikke lest i denne økta).
- **Kniven gir flere kilo per dag for den som fisker alene,** fordi sløyinga er flaskehalsen. Det er en følge av tida, ikke av fangsten, men det må måles, og haill ganger på toppen.
- **Juksespillets glipp** er den ene fangstøkningen høtten gir; noen prosent for den som timer dårlig.
- **Farten på de planende båtene** med propell 3 og motor 2 (31 og 35 knop) og med turbotrim oppå er ikke prøvd i manøvermodellen eller på nettbrett; trimmen ganger alt i dag (50 knop), så det meste er sett før.
- **Prisene** for trinnene er valgt så trebåten har noe å kjøpe for 900 til 6 500 kr de første dagene, og så propell 3 på en båt til 10 millioner koster 735 000 kr. `progweek.py` måler at stigen fortsatt tar uker, ikke dager.
- **Mannskapets ferdighet** (`teamEff`) ganges fortsatt inn etter summen. Et mannskap på 5 i sløying med kniv 3 blir raskt; det er ment.

## Det planen ikke gjør

- Ingenting selges for ekte penger, og ingen trinn låses bak haill, trim, fartstid eller merker.
- Ingen ny straff på trinn 1: ingen nye tap, ingen nye trekk, ingen slitasje på kniv, høtt eller propell.
- Ingen endring av fiskemodellen, `density`, `luck`, `GEAR.q` eller kalibreringen mot ERS (V1 A er valgt, så ingen unntak).
- Ikke havbåtene: fabrikkene, autolina og den koniske teina har sine egne tall.
- Ikke mannskapets personlige utstyr eller klær (Jonas 10.10.2026: spilleren kler ikke mannskapet; klærne finnes).
- Ikke flere båter i stigen, ikke sertifikater, ikke kvotemarkedet.
- Patchnotes sier hva trinnene gjør, aldri priser i kroner for ekte penger eller hvorfor.

## Status

- 07.11.2026: planen skrevet (Jonas' økt, grenen `ccr-5626c087-fg38n2`, bygd på arbeidsgrenen samme dag). Valgene 1–7 over er tatt av Jonas 07.11.2026. Stegene OPP1–OPP5 står i `docs/planer/koen.md` (53–57), med hel startmelding for OPP1.
- 07.11.2026: Jonas valgte **V1 A** (juksamaskinens trinn gir bare flere maskiner per person, ingen fisk per time). Alle valgene er tatt. Venter på «kjør på», og på at planen flettes inn i arbeidsgrenen, så rutinen ser stegene.
- 07.11.2026: Jonas ga klarsignal for OPP1 ved å be om startmeldingen. Planen og køen ble pushet til arbeidsgrenen før arbeidet (bare dokumenter). **OPP1 bygd** i Jonas' økt, gren `plan/2026-11-07-opp1`: `EQUIP.kniv` og `EQUIP.hott` med trinnene i tabellene over, `upgSum` (prinsipp 1), kniven i `deckMinute`, `deckEta` og `left.sloy`, feilene i `crewSlip`, høtten i `gopUnitMin` (bare trekk av line) og i juksespillets glipp, `S.stats.lostRail` med uka per båt, `buyGate('tier')`, kortene i Fiskeutstyr, `lex_kniv` og `lex_hott` i Håndboka (utenfor startmeldingens filer, fordi `itemcardtest` krever «Mer» på hvert kort), patchnoten. Målingene står over («OPP1, målt»), systemet i «Kniv og høtt i tre trinn» i `docs/systemer/redskap.md`, det som er svakt i backloggen. Det som hører til kjøpet og ikke var i OPP1s filer (bekreftelsen over 10 000 kr og trinnet i kvitteringen i `14-act.js`, trinnet ved salg i `09k-market.js`, innbyttet i `13-mannskap-bank-meld.js`), er lagt til OPP4 i køen. **Rullet ut i 73c12b26** (flettet med arbeidsgrenen i 7217777f; porten i `tools/plan/RUTINE.md` punkt 6 holdt, 3D-testene ikke kjørt etter Jonas' «ikke 3D»). Neste på sporet: OPP4 (steg 54), med hel startmelding i køen.
- 07.11.2026: Jonas ga klarsignal for OPP4 ved å be om startmeldingen. **OPP4 bygd og rullet ut i e10cd8ad** (Jonas' økt, gren `plan/2026-11-07-opp4`, flettet med arbeidsgrenen i 24eb4a19): siden «Båten og utstyret» først under Om bord › Båten med alle stigene, prikkene, neste trinn med pris, sted og tall, «Nærmeste» og Autonav, tapt over ripa og minuttene per stamp i dag; Neste mål med ett utstyrstrinn under en tidel av neste båt når flåten er én båt; bekreftelsen i knappen fra 10 000 kr og trinnet i kvitteringen; trinnet som tall ved salg mellom spillere; kniv og høtt blir med den gamle båten ved innbytte (prinsipp 5). Trakten har «kjøpt trinn innen dag 7» (`20261107160000_funnel_tier.sql`, kjørt av økta); målingen før datoen står over («OPP4, målt»). Systemet står i `docs/systemer/baater.md`, trakten i `samlinger-og-kultur.md`, det som er svakt i backloggen. Valg 9 i køen: om trinnene skal regnes i innbytteprisen (anbefalt A: nei, som nå). Neste på sporet: OPP3 (steg 55, venter på OPP2), med hel startmelding i køen.
- 07.11.2026: Jonas svarte **A** på valg 9 fra OPP4 (trinnene ved innbytte): kniv og høtt følger den gamle båten ved innbytte og regnes ikke i innbytteprisen; båtbladet sier det før kjøpet. OPP3 (propellen) følger det samme.
- 07.11.2026: Jonas om siden etter utrullingen: «Det er jo nesten umulig å skjønne hva som skjer på denne siden når det er så mye tekst og greier, det er jo elendig UI, UX eller GUI … Det må gjøres mer intuitivt for brukerne.» Siden er gjort om samme dag og rullet ut i c7e1bcb0: én rad per ting med bilde, prikker, én kort gevinst i egne tall og prisen, stedet én gang per handelssted, forklaringen i Håndboka bak «?» (`docs/systemer/baater.md`).
- 10.11.2026: **OPP5 bygd** i Jonas' økt, gren `claude/opp5-modellene-vkbwvw` (steg 57), rullet ut til testutgaven (test.detstorebla.no) 10.11.2026 etter Jonas samme kveld: «Rull ut på testgrenen når du mener du er ferdig med arbeidet». Produksjonen får det først ved et slipp, så Jonas ser modellene på testutgaven før de når spillerne. `tools/deck/oppgr.py` → `deck-upg` (kniv 2 og 3, høtt 2 og 3, linesetter, stampemagasin med bein, garnrenne), kniven og høtten etter trinn i hendene og stålhansken på trinn 3, høtten ved ripa ved haleplassen, linesetteren eller garnrenna over hekken på `kit.setter` (plassene i `SETTERS`, `vessel3d.js`, målt med stråler; ni av ti kystbåter, kyst15 venter på åpningen i hekken i OB12), «Prøv på båten» og heisen for begge. Plasket ved `slip` fantes fra før. Ingen tall endret. Systemet: «Oppgraderingene i 3D» i `docs/systemer/redskap.md`; det som står igjen, i backloggen («OPP5»). OPP3 (propellen, steg 55) er det som gjenstår av planen.
- 07.11.2026: **OPP2 bygd** i Jonas' økt, gren `ccr-6e84b098-t2tu38`, etter startmeldingen i køen (steg 56): trinnene for linehaleren, garnhaleren og teinehaleren (10 og 20 % kortere trekk, halve og hele nyprisen), juksamaskinene (V1 A: én person passer 3, 4 og 5; 12 000 og 24 000 kr per maskin; fra fire maskiner), juksasettene (slites halvparten så fort, 50 % dyrere), linesetteren (20 og 35 % kortere setting, 24 000 og 22 000 kr) og garnrenna (25 %, 18 000 kr). Trinnene er egne varer uten pris (`linehalerLv` …, `jukseLv`, `juksesett`) med `of`, som kniven og høtten, fordi OPP4s side, salget mellom spillere og innbyttet da leser dem riktig (med `tiers` på selve haleren ville siden stoppet og innbyttet mistet haleren). Systemet står i «Dekksutstyret i trinn» i `docs/systemer/redskap.md`, målingene over, det som er svakt i backloggen.
- 12.11.2026: **OPP3 bygd** i Jonas' økt, grenen `ccr-013bxxie-opp3` (steg 55; Jonas overstyrte taket: «Overstyr taket nå»): `PROPUP` og `b.propLv` i `core/03-simulation.js`, summen én gang i `applyVessel` (`speedSum`: propell, motor og trim lagt sammen av båtens egen fart, akselerasjonen likedan, forbruket `fuelK × (1 + 0,4·(P − 1) − propell)`), `boatWith` for kortene (nå og neste trinn), jobben `prop` på verftet (30 ekte minutter, `j.kr` og `j.ty`, prisen tilbake ved innbytte mens den venter og ved avbestilling), kortet under Verft › Oppgrader med «Bekreft · kr» fra 10 000 kr og kvitteringen med trinnet, `cloudEv('upg', {k:'prop', lv})`, linja på «Båten og utstyret» (`tier:true`, så Neste mål tar den), raden i databladet, `lex_propell`, salget mellom spillere (`mbPack`/`mbUnpack`). Det startmeldingen nevnte fra OPP2, er tatt: OPP2s trinn står på siden (`tierLad` med `icTierLine`), juksamaskinens pris på siden og i Neste mål er `equipKr('jukse')`, og `jobx` betaler tilbake `j.kr`. **Rettet:** innbyttet (`switchVessel`) tok med motortrinnet, lasterommet og ombyggingene til den nye båten gratis; nå blir verftets arbeid med den gamle, og bladet sier det før kjøpet. Ny hurtigsjark er 12 kn med deplasementsskrog (Jonas 05.11.2026), så «59,9 kn» i startmeldingen gjelder ikke henne lenger; summen er sjekket på den brukte hurtigsjarken (22 kn: 52,7 kn, ikke 62,7) og på den nye (26,55, ikke 29,33). Målingene står over («OPP3, målt»).
- 12.11.2026: Jonas svarte **A** på innbyttet (spørsmålet fra OPP3-økta): «A: Alt blir med skroget». Motor, propell, lasterom og ombygginger blir med den gamle båten og regnes ikke i innbytteprisen, som kniv og høtt (valg 9 A). Kontrollen og gjennomgangen fant at verftsjobber som ventet ved innbyttet, kunne legge et trinn på den nye båten, og at Trim-appen lover farten etter den gamle regelen; jobbene er rettet (betales tilbake), og Trim-appen lover nå det trimmen gir (`trimVmax`; rettet i økta da HO3 var ferdig og fila ledig).
