# Ruteplanleggeren og Autonav

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.12 Autonav over hele kysten (kystplanen, fase K9, 02.10.2026)

- **Vindu i stedet for hele kartet** (`leiaFind` i `core/11-route.js`): A* går i et vindu rundt start og mål, `LEIA.pad` (5 km) eller `LEIA.padK` (35 %) av avstanden, det som er størst.
  - Der vinduet når flisenes detalj (sim-pakkene), brukes 100 m-celler med 100 m-avstanden til land (`dc`), ellers 200 m-celler på den nasjonale kjernen (`dc200`). Pakkene under vinduet lastes før søket.
  - Blir vinduet for stort (over `LEIA.maxCells`, 600 000 celler), eller detaljen er inne men bare 200 m-celler får plass, søkes det først grovt (celler på et multiplum av 200 m). Deretter søkes det i en korridor på `LEIA.corr` grove celler pluss 1 km på hver side av den grove veien. Korridoren bruker 100 m-celler der detaljen er inne og boksen ikke er for stor, så de smale sundene i 25 m-masken ikke blir oversett.
  - Finner søket ingen vei i vinduet (rundt et nes, ut av en dyp fjord), prøves det igjen med 2,5 og 6 ganger så stort vindu.
- **Antall punkter** (`leiaMaxWp`): et mål, ikke et tak. 12 på ruter under 80 km, så ett til per 2,5 km, høyst 40. Utrettingen stopper ved den første avstanden fra land (`LEIA.margins`) som når målet, ellers beholdes færrest punkter.
- **Målt** (`routetest.py`, 02.10.2026):
  - Senja: alle etapper til de seks feltene og Botnhamn er fri for land, grunner og skjær. Rutene er 0,0–2,5 % lengre enn den strammeste veien langs land. Feltet rundt Senja (52 nm) trenger det andre vinduet og får 15 punkter (målet 20).
  - Finnsnes–Tromsø: 67 km, 12 punkter, 1,11 ganger luftlinja, 100 m-celler.
  - Bodø–Reine: 93 km, 7 punkter, 1,04 ganger luftlinja, 200 m-celler (bare kjernen der).
  - Bergen–Florø innaskjærs: 150 km, 35 punkter, 1,10 ganger luftlinja, aldri mer enn 3,5 km fra land.
  - Ingen bit tar over 16 ms. Søket leser klokka hver 8. ekspansjon. Med hver 32. ga Finnsnes–Tromsø 15,7 ms, og med detaljen for hele kysten ga Bergen–Florø 15 ms ved hver 16. Nå er den lengste biten 10,8 ms. Hver nasjonal rute er ferdig på under ett sekund.
  - Med hele kysten i bygget (4.13) går alle tre rutene på 100 m-celler: Bodø–Reine 94 km med 9 punkter, Bergen–Florø 153 km med 33. Endepunktene i testen velges nå med detaljen (300 m fra land og dypt nok). Startpunktet ved Bodø fra 200 m-kjernen lå på 1,1 m dyp.

## 4.12b Hindringer i sjøen for rutene (05.10.2026)

Jonas: «autoruter aldri skal gå gjennom 3d elementer eller landmasse». Båten hans seilte gjennom en pilar på Gisundbrua. Dette gjelder langs hele kysten: bruer, staker, påler, lykter, kardinal- og lateralmerker.

- **`core/11b-obstacles.js`** samler det 3D-visningen bygger i sjøen, slik simuleringen ser det, i meter i den nasjonale rammen:
  - **Bruer** (`BRIDGES` på Senja, `t.bridges` fra vec-pakkene ellers), regnet som `bridgeInto` i `view3d.js` gjør (`obsBridge`):
    - Pilarene står i det 18 m lange steget der dekket passerer et multiplum av 70 m. De regnes som sirkler.
    - Dekket er delt i biter på 8 m, hver med laveste underkant. Underkanten regnes med endene på 1 m, og 3D-visningens ender ligger like høyt eller høyere. Der ruta går under, er det tegnede dekket derfor minst så høyt.
    - En bit som er lavere enn båten (`obsAir`, 0,35 × lengden, 2–16 m, pluss 1 m for tidevann og sjø), er en vegg. Bruer under 60 m ligger lavt hele veien.
  - **Kaier og moloer på påler**: `PIERBOX` og vec-pakkenes `t.piers`, som rektangler. Kaidekkene (`made`), som står på land bak en kaifront, er ikke med.
  - **Pålekaia ved fars naust.**
  - **Sjømerkene** som 3D-visningen bygger (`SEAMARKS.marks` på Senja, kystens fra sjøkartpakkene, 4.12c).
  - Havneenhetens blokk og fylling er land allerede (`isLand`).
- **Indeksen** (`obsIndex`) har 250 m-celler, og hver ting ligger i alle cellene innen 40 m. Den bygges på nytt når vec-pakkene endres (`VEC.ver`) eller naustet flyttes.
  - `obsSegHit(a, b)` går gjennom cellene etappen krysser (DDA) og gir den første tingen etappen kommer nærmere enn `obsClr` (halve bredden pluss 6 m).
- **Autonav** (`leiaRoute`):
  - `leiaLegOk` krever at etappen er fri for hindringer. Utrettingen tar derfor ikke snarveier gjennom dem.
  - Ingenting teller innen 40 m fra rutas start og mål (`HIND.ctx.free`), fordi en båt kan ligge inntil en kai eller skal til naustkaia.
  - Før utrettingen lastes vec-pakkene langs veien (`obsLoad`, høyst 4 s).
  - Etterpå går `obsRoute` gjennom etappene. En etappe som fortsatt treffer noe (søkets celler er 100 m og større, og nabocellene sjekkes ikke), får en omvei (`obsDetour`, opptil tre ting etter hverandre):
    - **Under en bro:** midt i et løp mellom to pilarer der dekket er høyt nok, fra et punkt 45 m eller mer ut på hver side.
    - **Rundt et merke:** på den korteste siden.
    - **Rundt en kai:** om hjørnene.
    - Hvert bein i omveien sjekkes mot land og hindringer, og det skal ikke være farligere enn etappen det erstatter (`obsSafe`): like dypt, og uten skjær innen 25 m. Gikk etappen selv forbi skjær, skal beinet være minst 15 m fra dem, eller like langt unna som etappen. trip2-ruta tilbake under Gisundbrua gikk på grunn på et skjær før denne regelen. Under en bro kan omveien også gå tilbake til etappens egen linje rett etter brua.
    - Finnes ingen trygg omvei, beholdes etappen slik den er.
- **Under seiling** (`obsSail` i `sail`, `05-vessels.js`): etappen båten er på, sjekkes én gang per veipunkt og hver gang vec-pakkene endres. Treffer den noe, legges en omvei inn foran neste veipunkt. Det gjelder alle ruter, også de som er tegnet for hånd, og pakkene langt unna, som kommer først når båten nærmer seg.
- **Testen** er `tests/obstest.py`:
  - Gisundbruas pilarer.
  - Autonav fra Finnsnes til Botnhamn under brua.
  - En etappe gjennom en pilar og en gjennom et sjømerke.
  - Korte bruer som vegg.
  - En tegnet rute gjennom en pilar, rettet under seiling.
  - trip2-ruta under Gisundbrua og tilbake: rundt pilaren, ikke nærmere skjærene, tilbake i havn.
  - En lang bro i Tromsø-flisa (Ramfjordbrua) når bygget har vec-pakkene.
- **Ikke gjort ennå:** et ferdig leinett fra Kystverkets hovedleder og bileder. Med det ville Autonav nesten ikke trenge å regne, og rutene gå der ekte båter går.

## 4.12d Autonav går aldri på land (08.10.2026, tilbakemeldingene #47 og #48)

Jonas: «Autonav må fungere 10 av 10 ganger, og en bruker skal aldri havne i en slik situasjon pga. Autonav.» En spiller med mannskap om bord gikk på grunn på Autonav fra Vannareid til Honningsvåg. Gjenskapt i testen: ruta var for lang for ett 100 m-rutenett, så korridoren gikk på 200 m-celler, og et rått steg mellom to celler (aldri sjekket som linje) krysset land to etapper utenfor Vannareid.

- **Korridoren i biter** (`leiaCorridor`, `leiaCorridor1` i `core/11-route.js`): etter det grove søket deles den grove veien i stykker som hver får plass i 2 × `LEIA.maxCells` celler på 100 m (200 m bare utenfor flisenes detalj). Rutenettene er lagt fast fra rammens origo, så et stykke slutter i samme celle som det neste begynner i. Vannareid–Honningsvåg (146 nm) går nå på 100 m-celler på 5–7 s.
- **Hver etappe sjekkes som båten seiler den** (`leiaLegSafe`, `leiaMend`): etter utrettingen går hver etappe gjennom simuleringens egen regel (land, dybde under dypgang + `LEIA.minOver` (0,5 m) utenfor havnene, molo, skjær innen 12 m). En etappe som feiler, legges rundt via et punkt til siden av midten (40–300 m), ellers med et fint søk mellom endene; finnes ingenting, svarer Autonav «Fant ingen trygg rute dit» i stedet for å levere ei rute båten grunnstøter på.
- **Celler grunnere enn dypgang + 0,5 m er stengt** (`leiaCost`), ikke bare dyre (før kostet de 30 ganger). Dybden sjekkes også de siste 50 m inn mot hvert punkt (`leiaLegOk`), unntatt når punktet selv ligger grunt (ei blåse, naustet). Et mål på grunt vann avvises («For grunt der for båten»), og kartplotteren flytter et slikt trykk ut til nærmeste dype punkt innen 500 m (`deepNear` i `ui/03b-route.js`).
- **Kartet rundt begge endene lastes først** (`leiaRoute0`): `approachPath` for ei fjern havn kastet «mask block is not loaded» når flisene der ikke var inne.
- **Sikkerhetsnettet i simuleringen** (`sailReplan`, `sailStop` i `core/05-vessels.js`): treffer `groundCheck` på en etappe ruta kalte trygg (ikke én spilleren tegnet gjennom grunna og kastet loss på, `pl.unsafe`), stopper båten 25 m før, og Autonav finner en vei rundt derfra til neste punkt (`leiaRoute`, spleiset inn i ruta, høyst tre forsøk per etappe). Finnes ingen, ligger båten stille og resten av ruta går tilbake til kladden. Det gjelder også etter en drift, en pause eller et slep, og driftsplanens og den automatiske returens etapper.
  - **Med manøvreringsmodellen** (`dynAuto` i `core/16b-dyn.js`, 26.10.2026, tilbakemelding #96): når båtens egen vei (et hjørne skåret på svingradien, drift av linja) treffer grunn eller land i over 1,5 m/s på en etappe ruta kalte trygg, holdes hun tilbake der hun var, og `sailReplan` finner en vei rundt. Før satte modellens siste sjekk henne på grunn med skade. Bare en etappe spilleren selv tegnet gjennom grunna (`pl.unsafe`), grunnstøter. Testen er `dyntest.py` 2c.
- **Søvn:** sovner du alene mens Autonav går, holder autopiloten kursen og båten går fram til ruta er slutt (`vesselStep`). Uten rute driver hun som før, men stopper før land eller grunt vann (`sleepDrift`). Ingen grunnstøting i søvne.
- **Telemetrien** om grunnstøting har nå farten før den ble nullstilt og `how` (leia, route, return, ops, helm, sleep, drift), i `S.incidents` og `cloudEv('aground')`. Den gamle farten var alltid 0.
- **«Sitter båten fast?»** (`unstuck` i `core/05-vessels.js`, kortet i Redning-appen; tilbakemelding #49: i Vannareid gikk båten ti meter og hoppet tilbake til mottaket, både med Autonav og manuelt): legger båten ut på trygt vann like utenfor (ytterste punkt på havnas vei inn, ellers nærmeste punkt minst 200 m fra land og dypt nok), der den ligger stille. Ikke under slep, høyst hvert tiende ekte minutt, gratis. Tilstanden båten hadde (status, havn, plan, ror, hvile, landing, flytting, jobber og de siste fortøyningene i `S.dockLog`) går til telemetrien som `unstuck`, så årsaken kan finnes. Hoppet lot seg ikke gjenskape med en ren lagring, verken på versjonen han spilte (`592f875`) eller den nye.
- **Test:** `tests/autonavtest.py` (søvn på rute, drift mot land, sikkerhetsnettet med og uten `unsafe`, fristen, grunt trykk, og fire nasjonale ruter der hver etappe sjekkes med `groundCheck` og `isLand` hver 5. m). 30 tilfeldige mottakspar langs kysten ble kjørt i tillegg (resultatet står i commit-meldingen).

## 4.12e Autonav for hele kysten: leinett, fint søk ved endene, land i grunnsjekken (08.10.2026)

Jonas: «Autonav burde være så bra at den fint klarer å lage en rute fra Oslo til Kirkenes.»

- **Leinettet** (`tools/leia/leinett.py`, `src/data/leinett.json`, `core/11c-leinett.js`): Kystverkets hovedleder og bileder fra Geonorges WFS «farled» (typen `app:HovedledOgBiled`, 214 hovedleder og 926 bileder, åpne data, NLOD, kilden oppgitt i dataene) gjort om til en graf i spillets ramme. Punktene er tynnet (Douglas–Peucker 15 m), punkter innen 30 m er ett knutepunkt, linjer som krysser får et knutepunkt der de krysser, og løse ender innen 1,5 km av en annen led kobles til den. 6270 knutepunkter, 95 % i ett sammenhengende nett, 132 kB.
  - Ruter over 10 km går inn på nettet: fra starten til ett av de nærmeste knutepunktene innen 12 km (rett etappe, ellers et kort søk, ellers det fine 25 m-søket helt fram, `lnetAccess`), korteste vei gjennom nettet (Dijkstra, `lnetPath`) og ut til målet. Så rettes ruta ut og hver etappe sjekkes som båten seiler den (`leiaMend`).
  - Langs nettet gjelder den strenge regelen først (sikker dybde og 25 m fra skjær, som rutelistas varsler); en etappe som ikke kan legges om, beholdes hvis den holder båtens eget minimum (`st.soft`). Har nettets rute slike etapper og strekningen er under 400 km, regnes rutenettet også, og ruta med færrest slike etapper velges (Bergen–Florø: rutenettet, 0 av 36).
  - Målt: Oslo verft–Bugøynes (nærmeste havn til Kirkenes) 1459 nm, 198 punkter, ingen etappe på grunn eller land, 35 s. Reine–Bergsfjord (fant ingen vei før) 6 s, Vannareid–Honningsvåg under 2 s.
- **Trinn 1, fint søk ved endene** (`leiaLane` i `core/11-route.js`): en ende i trangt vann (100 m-cellen har land eller er under 150 m fra land) får en vei på kartets 25 m-maske ut til åpent vann, bredde først, gjennom vann dypt nok for båten, uten å skjære et landhjørne eller krysse en molo, innen 2,5 km. Det grove søket leter 8 km etter åpent vann ved endene.
- **Havner som var stengt inne** (`approachPath` i `core/07-harbours.js`): 6 av 359 havner (mottakene i Ålesund, Fosnavåg, Laukvik og Vengsøy, utstyrsbutikkene i Vanse og Søndeled) lå i lommer der kaia og fyllingen stengte vannet. Da regnes land innen 80, 150, 250 og 400 m av havnepunktet som passerbart (`pt.free`, `quayLand`). Søndeled utstyrsbutikk er fortsatt stengt (data).
- **Land i grunnsjekken** (`groundCheck` i `core/01-world.js`): land midt på en etappe er grunnstøting, ikke bare grunt vann, sjekket hver 5. m (dybden hver 20. m). Autonav sjekker land hver 2. m (`leiaLegFail`): en holme tynnere enn 4 m gled mellom prøvene på Bodø–Olderdalen.
- **Bakt leinett** (`tools/leia/bake.py`, Jonas: «Kan mye av leinettet kodes inn på en slik måte at det tar mye kortere tid å lage lange ruter?»): spillet kjøres uten skjerm, og hver etappe i nettet sjekkes én gang som båten seiler den (`leiaLegFail`). Den sjekkes først strengt (startbåtens sikre dybde og 25 m fra skjær), ellers legges den om (`leiaMend`). Holder ingen av delene, beholdes den med båtens eget minimum (`soft`, tre ganger så dyr i Dijkstra), og ellers kuttes den. Så rettes hver led ut der en rett etappe holder samme regel, men aldri forbi et kryss (da faller nettet fra hverandre). Resultatet er `baked: true`, `soft` per etappe og dybden bakingen brukte (`sd`, `draft`).
  - Kjøres slik: `node build.mjs && python3 tools/leia/leinett.py && python3 tools/leia/bake.py` (rundt 1,5 min med hele kysten i bygget). Skriptet nekter å bake et nett som alt er bakt.
  - 08.10.2026: 6977 etapper, 6677 strenge, 94 lagt om, 115 myke og 91 kuttet. 3982 knutepunkter, 95 % i ett nett, 99 kB.
  - I spillet brukes nettets etapper som de er. Bare veien inn på og ut av nettet rettes ut og sjekkes, og kartet langs ruta lastes etterpå (rutelistas varsler og seilasen leser det). De myke etappene telles i `st.soft`, så rutenettet sammenlignes under 400 km som før. En båt som stikker dypere enn bakingen, eller en høyere sikker dybde i innstillingene, får hele nettet sjekket som før.
  - Målt: Oslo verft–Bugøynes 1477 nm, 404 punkter, 0 etapper på grunn, 6,8 s (35 s før), og 1,8 s av det er lasting. Fosnavåg–Bugøynes 4,9 s.
- **Sterk vind** (`startReturn`/`shelterReturn` i `core/06-services.js`, Vannareid 08.10.2026): båten snur av seg selv bare når vinden stiger over grensen mens den er ute (`b.windArm`, settes når vinden er under grensen, nulles ved avgang, ved «Sitter båten fast?» og når den snur). I vedvarende kuling ble hver start, hvert Stopp og hver flytting sendt rett tilbake til mottaket. Når den snur, går den med Autonav til nærmeste kai (de tre nærmeste prøves, rorbuer tas ikke med), eller hjem samme vei, etter `S.settings.autoTo` (`'near'` som standard, `'home'`), valgt under Sikkerhet i Innstillinger. Finner Autonav ingen vei, går den hjem samme vei. `autonavtest` 8a–8c.
- **Kvittering ved salg** (Jonas 08.10.2026: «ka-ching», «+(inntekt)» i grønt, telles over på konto; `cashFx` i `ui/02-format-state.js`, `SND.cash` og `SND.coin` i `ui/10e-sound.js`): når `sell()` har betalt ut, ringer kassa (et klikk og en bjelle slått to ganger, laget i nettleseren), beløpet (`+15 848 kr`) stiger i grønt fra kassa i toppbaren, og kassa og HUD-en teller seg opp fra gammel til ny sum (1,1 til 2,6 s, lengre for mer, med et lite tikk som blir høyere mot slutten). Den som ber om mindre bevegelse, får summen og ringelyden uten telling. En side styrt av en test (`navigator.webdriver`) viser summen med en gang, med mindre `CASHFX.force` er satt. `cashShown()` gir tallet som vises; spillets kasse (`S.cash`) er alltid den ekte. Test: `cashfxtest.py`.
- **Rettinger etter den første kjøringen i Actions** (08.10.2026, 301 par, 18 feilet, ingen etapper på land eller grunn): 1) *lommer*: en ende hvis åpne 100 m-celler bare utgjør et lite lukket stykke (Fredvang, Sleneset og flere) går først ut av lomma på 25 m-kartet (`leiaPocket`, `leiaPocketOut`), i et nytt forsøk når det første ikke fant vei. 2) *innseilingen*: havnas egen innseilingslinje (`approachPath`) beholdes som den er i mendingen (kan krysse kailand inne i havna og ha 2 til 3 m i innløpet; teller som myk etappe, `st.trust`). 3) *landsjekken*: innseilingslinjen og utrettingen (`leiaLegOk`) sjekker nå land hver 2. m som mendingen, ikke hver 8. 4) en vei inn på leia som det fine kartet fant (`preLane`, `postLane`) beholdes som den er (Helligvær). 5) `coastDist` bruker det grove kartet når en blokk ved flisas kant ikke finnes i noen pakke. Etter dette gikk 301 av 301 par.
- **Trinn 3, alle mottakspar** (`tests/allpairs.py`, `.github/workflows/autonav.yml`): Autonav fra hvert mottak til de tre nærmeste innen 250 nm, rundt 360 par, og fire av de lengste veiene (Oslo–Kirkenes, Kristiansand–Hammerfest, Bergen–Svolvær, Bodø–Alta). Hver etappe sjekkes med `groundCheck` og land hver 5. m. Fire deler kjøres side om side i Actions med den nyeste kartreleasen, ved push som endrer rutefinneren, havnene, nettet eller mottakene, hver mandag og for hånd. Rapporten er en artifact. Lokalt: `SHARD=1/60 python3 tests/allpairs.py`.

## 4.12f Autonav 2: strammere ruter, trange sund, leinettet rettet ut, tidevann i dybden (12.10.2026)

Jonas: «Den er i dag ganske bra, men den tar noen rare avgjørelser som forlenger reiseveien for brukerne betraktelig. Den må også ta høyde for fartøyets dypgående samt tidevann slik at brukerne ikke går på grunn pga. Autonav.» Bildene hans viste fire ting: ruta fra Havøysund til rorbua gikk 7,5 nm rundt Havøya for 1,1 nm i luftlinje, leinettets knutepunkter dro ruta inn i og ut av havner den bare passerte (Honningsvåg, Kamøyvær, Havøysund øst, Myre), V-svinger der veien inn på nettet gikk til nærmeste knutepunkt bak båten, og rekker av 20 m-etapper ut av en lane. (V-en ved Risøyhamn er geografi: sørspissen av Andøya må rundes før Gavlfjorden, og den står.)

- **Hele ruta strammes til slutt** (`leiaPull` i `core/11-route.js`): fra hvert punkt som beholdes, det fjerneste punktet forover (høyst `LEIA.pullW` 64 punkter og `LEIA.pullKm` 30 km) som en rett etappe når under seilingsregelen (`leiaLegFail` strengt: sikker dybde minus tidevannskreditten, 25 m fra skjær, land hver 2. m, havnas eget land ved rutas ender hoppet over), minst `LEIA.shoreMin` 100 m fra land utenfor havnene, og klar av bruer, kaier og merker. Leinettets etapper strammes også (før ble de tatt som de var), og lanenes småetapper. En etappe som bare holder båtens eget minimum (myk), beholdes: ingen ny etappe er mindre trygg enn den den erstatter. Galopp og halvering som `leiaStraighten`; land prøves først hver 200 m og hver 8. m, så de fleste fjerne kandidatene koster lite (hele strammingen 2–10 ms per rute).
- **Trange sund på 50 m-rutenettet** (`LEIA.fineC`, `leiaShore`, `leiaFind`): en celle er åpen når ingen av de fire kvartene er land etter den fine kysten og 25 m-masken (`isLand`), avstanden til land er 100 m-lagets i midten (aldri 0 for en åpen celle). Brukes på korte veier (under `LEIA.fineKm` 25 km) der 100 m-rutenettet ikke fant vei eller fant en som er mer enn `LEIA.detour` 1,45 ganger luftlinja pluss 0,5 km, i et vindu rundt luftlinja, og den korteste av de to tas. Bare for båter til `LEIA.fineLen` 15 m: en 50 m-celle er fri for land over 50 m, og det er ikke noe sund for en 20 m båt. Havøysund–rorbua: 1,55 nm gjennom sundet (175 m bredt, 1,4–6 m) i stedet for 7,5 nm.
- **Påkoblingen til leinettet** (`lnetAhead` i `core/11c-leinett.js`): i tillegg til de nærmeste knutepunktene (nå 8 innen 12 km) prøves de nærmeste fire innen 25 km som ligger innenfor 50° av retningen mot den andre enden, bare når en ren rett etappe når dem. Dijkstra velger så mellom alle. Før lå de nærmeste punktene gjerne langs havnas egen biled, så veien gikk ut til krysset og tilbake.
- **Tidevannet i dybden** (`LEIA_TIDE`, `leiaTideCredit`, `leiaLim`): kartdybdene (`depthF`) er under sjøkartnull; vannet står `tideCD(H, p)` over det. Ruta sjekkes mot den laveste vannstanden turen kan møte: nivået over de neste timene turen kan ta (luftlinja i marsjfart pluss en tredjedel, 4 timer på toppen, høyst 36) ved begge endene, hvert kvarter, minus `LEIA.tideMargin` 0,3 m for vær og modellfeil, mellom −0,5 og +1 m. Kreditten trekkes fra den kartdybden båten trenger (dypgang + `LEIA.minOver`): i rutenettets kostnad, etappesjekken, lanene og kartplotterens flytting av grunne trykk (`deepNear`). Det strenge kravet (sikker dybde) regner uten kreditten, slik rutelistas varsler (`legHazard`) gjør, så lista og Autonav er enige om hva som er gult. Så er et sund med 1,5 m på kartet åpent for en 2 m båt ved springflo med timer å gå på, og stengt når turen møter fjære. Seilasen sjekker fortsatt vannet som det er (`groundCheck` med `tideCD`) og stopper før en grunne om tidevannet falt fortere enn planen (`sailReplan`). Kreditten er 0 utenfor en rute (bakingen, testene), og `opt.noTide` slår den av. To ruter kan gå samtidig (sammenligningen i kartplotteren, seilasens vei rundt ved siden av spillerens): hver legger tilbake det den fant, ikke 0, og begge er fra samme båt på samme tid, så kredittene er så godt som like.
- **Målt** (`tests/leiaprobe.py`, før → etter, nm): Havøysund–rorbua 7,52 → 1,55; Havøysund–Mehamn 76,6 → 74,4 (24 → 16 punkter); Honningsvåg–Hammerfest 63,4 → 60,7 (27 → 19); Havøysund–Myre 291 → 288 (79 → 56); Engenes–Harstad 16,65 → 16,27; Bodø–Reine 53,1 → 51,5 (22 → 14). Ingen etappe på land eller grunn i noen av dem. Tidene er som før (rutesøket og lastingen dominerer, 0,5–9 s), strammingen koster 2–10 ms.
- **Proben** `tests/leiaprobe.py` kjører navngitte par (eller `PAIRS=a>b,...`, også `rorbu:<havn>` og `lat,lon`), skriver lengde, luftlinje, forhold, punkter, hvordan ruta ble funnet, kreditten og tiden, sjekker hver etappe med `groundCheck`, og tar bilde av kartplotteren til `tests/out/leia/<TAG>_<par>.png`.
- **Test:** `autonavtest.py` 9a–9d (kreditten, Havøysund–rorbua gjennom sundet, det grunneste på veien som mål nektes uten tidevann og nås med, Honningsvåg–Hammerfest strammet). Kjørt 12.10.2026: autonavtest (20 OK), routetest (43 OK), obstest, r4test, naustleia, teleport3d grønne; docktest, vesseltest og fleet3test feiler likt på HEAD-bygget før endringen (telefonens appliste, lasterommet, en null-knapp) og hører til neste finpuss. `routetest` feilet én gang i en samlekjøring som gikk parallelt med en annen testkjøring, og gikk grønt tre ganger alene. Alle mottakspar (`autonav.yml`) kjøres i Actions ved pushen.
- **Ikke gjort:** havnenes egne veier ut (`approachPath`) har fortsatt punkter 13–50 m fra hverandre rundt moloene; de ligger i havna og strammes ikke, fordi en rett etappe der krysser kailand.

## 4.12g Autonav over åpent hav (havsteget H1b R6, 05.11.2026)

Jonas 05.11.2026: «Start r6 i en ny økt». Målet i planen (R6 i `docs/planer/havsteget-h1b-rammen.md`): 1 500 km planlegges på under 1 s på nettbrettet, rette strekk over åpent hav sjekket mot 1 km-laget, og den fine sjekken nær land.

**Hvorfor det var tregt** (målt med Chromiums profiler, hele kysten, `kart-31`):
- En rute på 80 km fra 71,2° N 24° Ø til 71,6° N 26° Ø tok **2,3 s** her, og 300 km fra Finnmark mot Bjørnøya **8,8 s**, begge for ett eneste rett strekk. De 400 s fra R5 er ikke gjenskapt; der var trolig flere ruter og testens egen venting med.
- **`unitDredge`** (havneenhetenes mudrede basseng i `depthF`) gikk gjennom alle havneenhetene for hver dybdeavlesning: 30–50 % av tida. Nå slås enhetene opp etter km-ruta (`unitsAt`, `07-harbours.js`), og svaret er det samme.
- **Ingen snarvei for rette strekk over 30 km.** Søket i rutenettet ble kjørt uansett.
- **Hver sjekk gikk langs hele etappen** hver 2.–30. m (`leiaLegOk`, `leiaLegFail`, `legHazard`, `leiaPull`): et strekk på 900 km er 450 000 punkter, flere ganger.
- **`rocksIn` med boksen rundt hele etappen**: et skrått strekk på 1 000 km spurte om en million tomme km-ruter (`rocksAlong` i `01-world.js` tar det nå i biter på 2 km).
- **Vinduet lastet alle pakkene** innenfor hundrevis av km før grovsøket, og `lnetLoad` lastet alle pakkene i boksen rundt hvert strekk.

**Slik det er nå** (`core/11-route.js`, `core/11c-leinett.js`):
- **Stykkene som trenger den fine sjekken** (`legRuns`): langs etappen hvert 100. m, eller lenger der det er plass. Et punkt minst 0,5 km fra land (laget `isLand` selv leser der: flisenes 100 m-avstand i detaljen, ellers kjernens; 1,5 km på den vide rammens 1 km-lag), utenfor havnene og 4 m dypere enn det sjekken spør om, er åpent hav, og vannet halvveis til neste punkt også, fordi avstanden til land ikke kan falle fortere enn veien går. Steget vokser med avstanden til land, høyst 1 km, og er 100 m der dybden er under 30 m over grensa. Resten, med 150 m på hver side, sjekkes som før (land hvert 2. m, dybden, skjær, moloer, broer). Etapper opptil 1 km er ett stykke, så sjekkene nær kysten er som før. Stykkene huskes per etappe, med dybdegrensa løftet til sikker dybde + 1 m, så alle sjekkene av én etappe deler dem. `legRunsAsync` regner dem i skiver på 8 ms.
- **Rett strekk over 30 km**: lastes langs strekket og sjekkes med `leiaLegOk` (stykkene nær land fint). Holder det, er ruta ett strekk (`st.by = 'open'`).
- **Ut fra leinettet** (`lnetExit`): har den ene enden leinettet og den andre ikke (Svalbard, Petsjorahavet, Nord-Island), og ruta er over 40 km, regnes avstandene gjennom hele nettet fra den nære enden (`lnetDists`), og noden der veien langs nettet pluss det rette strekket ut er kortest, av dem med et rent strekk, blir utgangen (de 30 beste prøves). Ligger enden bak land (en fjord på Svalbard), tas den beste noden med et rent strekk minst en tredel ut, og rutenettet søker resten.
- **Grovsøket over havet** (grovruter på `LEIA.oceanC` = 1 km og mer, ruter fra rundt 450 km): laster ingen pakker (det leser kjernens sjøbunn, `offDepth`), estimatet veier 1,5, så søket går mot målet rundt en øy i stedet for å fylle havet bak den, og korridoren søkes bare der grovstegene ikke er rene strekk (`okStep`), med ett steg på hver side. Med mindre grovruter (en rute langs kysten) er alt som før: vinduet lastes, flisenes dybde leses og korridoren går hele veien. Prøvd først med grensa på 250 m: da gikk Bergen–Florø 5 km fra land (156,8 km) i stedet for innaskjærs (151,8 km, høyst 3,6 km fra land), fordi kjernens dybde ikke ser leia innenfor skjærene. En ende som er lenger enn 8 km fra en åpen grovrute (Tromsø), får 25 km.
- **Utstrammingen** (`leiaPull`) tar et strekk over 30 km bare når midten er minst 10 km fra land (`LEIA.pullOpen`) og høyst 30 km av det ligger nær land.
- **Pakkene lastes når de mangler** (`leiaLegOkL`, `fail` i `leiaMend`, `ok` i `leiaPull`), og `lnetLoad` laster langs strekket i biter på 5 km.
- **Rutelistas farevurdering ser på de samme bitene** (`draftHazards` og `legReady` i `core/01-world.js`, 06.11.2026, test `draftlooptest`). Før spurte `legReady` om alle pakkene i etappens boks (±0,5 km), mens `lnetLoad` bare hentet bitene langs linja; en lang, skrå etappe (Vestfjorden) hadde da pakker i boksen som aldri kom, og etappen var aldri «klar». `draftHazards` ventet på `lnetLoad`, kalte `routeChanged` når ventingen var over, som kjørte `draftHazards` på nytt, som ventet igjen (på løfter som alt var løst) … en evig kjede av mikrooppgaver som aldri slapp tråden: ingen tidtaker, ingen feil, ingen livstegn, og utkastet lå alt i lagringen (`routeChanged(); save();` i `leiaTo`), så hver start låste seg på nytt. Fire låser hos Adrian samme kveld (Bodø–Husøy, en havn ved Andenes, Engenes). Nå sjekker `legReady` bitene på 5 km ±0,5 km som `lnetLoad` henter, og `.then` kaller `routeChanged` bare når etappene er klare; ellers merkes utkastet `fail|` og ingenting venter igjen. Det samme ville truffet alle med en lang rute med skrå etapper over åpent vann, uansett enhet.
- **Oppstarten laster de samme bitene** (07.11.2026, `bootMapLoad` i `ui/11-boot.js`, test `kartkorridortest`): planen som gjenstår og utkastet får korridoren sin lastet med `lnetLoad`, ikke bare pakkene rundt hvert punkt. Oppstartens egen sjekk av planen (`legClear` i `bootGame`) og tegningen av utkastet leser hele etappen; før kastet en lesing midt på en lang etappe «mask block … is not loaded» og siden lastet seg selv på nytt (Adrian 05.11.2026; Bodø–Husøy i testen: to lastinger, én etappe fortsatt ikke klar, 4–5 s; nå én lasting, alle 37 klare, 2,4–2,8 s).
- **Utkastets landsjekk huskes per etappe** (07.11.2026, `legClearMemo` i `core/01-world.js`, test `legmemotest`): `renderDyn` (fem ganger i sekundet) og rutepanelets `estimate` regnet `legClear` på hver etappe hver gang, rundt 8 500 `isLand` per bilde for Bodø–Husøy (5,3 ms per bilde i Chromium på en stasjonær maskin, nå 3,0 ms og ingen `isLand`). Svaret glemmes når en kartpakke kommer inn (`MAPD.fetched + MAPD.cached`), en flis får kystindeksen sin (`COAST.built`; til da leser `isLand` 25 m-masken) eller vec-flisene endres (`VEC.ver`).
- `leiaLegOkG` er en generator som slipper skjermen hver 512. punkt i utrettingen.

**Målt** (Chromium her, hele kysten; `tests/istest.py` og et skript i økta):

| Rute | Før | Nå | Lengde |
|---|---|---|---|
| 71,2° N 24° Ø → 71,6° N 26° Ø (80 km) | 2,3 s | 0,1 s | rett strekk |
| 71,0° N 23° Ø → 74,3° N 18,2° Ø (400 km) | 8,8 s | 0,3 s | rett strekk |
| Hammerfest → Bjørnøya (74,35° N 19,6° Ø) | | 0,75 s | 235 nm (luftlinje 234) |
| Båtsfjord → Petsjorahavet (69,9° N 48° Ø) | | 0,13 s | 383 nm (373) |
| Ålesund → Nord-Island (66,8° N 18,5° V, 1 270 km) | | 0,3 s | 692 nm (682) |
| Tromsø → Isfjorden (78,25° N 15,3° Ø) | ingen rute | 2,2 s | 563 nm (522) |
| Barentshavet → vest av Spitsbergen rundt isen i mars | | 0,86 s | 342 nm (330), største is langs ruta 11 % |

- Alle etappene er sjekket med `groundCheck`: ingen grunnstøter.
- **Langs kysten** (`routetest`, samme ruter som før, sammenlignet med bygget før R6, 4bbef7f): Finnsnes–Tromsø 67,4 km på 0,9 s (før 2,2 s), Bodø–Reine 93,5 km på 0,4 s (1,3 s), Bergen–Florø 151,8 km og høyst 3,6 km fra land på 1,4 s (4,0 s). Rutene er de samme; tida kommer fra `unitDredge` og `rocksAlong`.
- **Testene:** `autonavtest` 10 (de fire havrutene i `routes.json` «hav»: funnet, ingen etappe på grunn eller i isen, høyst 1,15 ganger luftlinja, under 10 s her) og `istest` (en hel rute rundt isen i mars).
- **Tromsø–Isfjorden** bruker rundt 1 s på veien ut av Tromsø selv (den fine leia i `lnetAccess`, som Tromsø–Hammerfest også bruker: 0,9–1,5 s). Den lengste skiva er 90–130 ms, i utrettingen nær land (første lesing av blokkene). Se BACKLOG.
- **Nettbrettet er ikke målt.** Tallene er fra skymaskinen.

**Rettet 05.11.2026, etter utrullingen av R6 og R7:** CI-sjekken av alle mottaksparene («Autonav langs hele kysten», `tests/allpairs.py`) ble rød på ett par (mM416 → mM2187 på Sunnmøre): en etappe på 8,6 km gikk over en holme på rundt 20 m ved 62,396° N 5,830° E. Avstandslaget (`coastDist`, flisenes 100 m-lag) kjenner ikke holmen og sier 0,5 km til land der den står, så `legRuns` kalte stykket åpent hav og den fine sjekken gikk ikke der. Nå leses også strekningen et åpent punkt står inne for, med `isLand` hver 5. m (`LEGOPEN.land`, `legLandIn`); land der gjør punktet nært, og stykket sjekkes fint som før R6. Det koster lite (20 000 oppslag i masken tar rundt 10 ms her). Holmer tynnere enn 5 m som avstandslaget heller ikke kjenner, kan fortsatt gli mellom punktene på åpent hav (BACKLOG 10.3).

## 4.12h Ut av fjordene til havet hele året (havsteget H1b R8, 05.11.2026)

Funnet av `tests/havtur.py` (R8): **Tromsø → Isfjorden fant ingen rute** i januar og juni–november, bare i mars–mai. Årsaken var ikke isen, men at den virket bare *på grunn av* isen: `lnetExit` prøver i andre runde rutenettet fra en node bare når den rette linja derfra mot målet er fri minst en tredjedel av veien (`leiaLegFail`). Fra Tromsø krysser alle de rette linjene øyer like utenfor, så ingen node slapp gjennom. I månedene med is ved Svalbard var isen 790 km ute det første linja traff (`leiaLegFail` sjekker isen før land), og da slapp en node gjennom ved et tilfelle. Tabellen i 4.12g (2,2 s) ble målt i mars.

Stikkprøven langs kysten fant det samme fra **Bergen** (verftet) mot Shetland og mot et punkt 100 km til havs (61° N 1° Ø), hele året: nodene ved byen ligger i skjærgården, der grovsøket blir stengt inne (298 utvidelser og stopp).

**Rettet** (`core/11c-leinett.js` `lnetExit`, tredje runde): finnes ingen node etter de to første rundene, prøves rutenettet (`leiaFind`) uten filteret fra de `LNET.exitGrid / 2` billigste nodene og fra de `LNET.exitGrid` (4) billigste nodene som ligger i åpent farvann (`dcCellFar` ≥ `LNET.exitOpen` = 1,5 km). `st.exit.any` sier at det var denne runden.

**Målt etter rettingen** (Chromium her, juli 2027, kyst15): Tromsø → Isfjorden 559–565 nm (luftlinje 523) på 1,9–3,2 s, Tromsø → Sørkapp 421 nm på 0,9–1,3 s, Bergen → Shetland 200 nm (190) på 1,2–2,0 s, Trondheim → 66° N 2° Ø 272 nm (265), Bodø → Jan Mayen-feltet 529 nm (526), Kristiansand → Nordsjøen, Hammerfest → Bjørnøya og Vadsø → 72,5° N 40° Ø uendret; i januar, juli og oktober, alle uten etappe på grunn eller i isen (`groundCheck`, `seaIceOnLeg`). `routes.json` «hav» har fått Bergen–Shetland (`autonavtest` 10, 25 OK).

## 4.12i Seilasene i R8 (05.11.2026)

`tests/havtur.py` (LITE, trenger hele kysten og `dist-vec`) planlegger og seiler åtte turer i juli med kyst15 på den felles klokka (`step()`), uten å fylle på tanken: Båtsfjord–Sentralbanken, Båtsfjord–Petsjorahavet, Hammerfest–Bjørnøya, Tromsø–Isfjorden, Ålesund–Nord-Island, Ålesund–Færøyane, Måløy–Vikingbanken og Måløy–Shetland. På hver: målet er sjø med dybde, sonen (`ruSea`) og lisensen, klimapunktene og månedsmiddelet av vinden, bølgene og temperaturen i januar og juli, isen i mars og september og ruta i mars, rekkevidden for hver båttype og forbruket mot overslaget i rutepanelet. 68 OK.

| Tur | nm (luftlinje) | Timer, kyst15 10 kn | Diesel brukt / overslag (L) | Sone | γ | k |
|---|---|---|---|---|---|---|
| Båtsfjord–Sentralbanken | 338 (336) | 33,8 | 2 137 / 2 126 | fiskevernsonen | 19,5° | 1,003 |
| Båtsfjord–Petsjorahavet | 383 (373) | 38 | 2 412 / 2 404 | russisk | 31,4° | 1,018 |
| Hammerfest–Bjørnøya | 235 (234) | 23,6 | 1 497 / 1 505 | Svalbards territorialfarvann | 4,4° | 1,000 |
| Tromsø–Isfjorden | 563 (523) | 56,4 | 3 595 / 3 595 | Svalbards territorialfarvann | 0,3° | 1,000 |
| Ålesund–Nord-Island | 692 (682) | 68,6 | 4 381 / 4 520 | islandsk | −31,3° | 1,024 |
| Ålesund–Færøyane | 347 (342) | 34,5 | 2 229 / 2 295 | færøysk | −18,7° | 1,014 |
| Måløy–Vikingbanken (60° N 2,6° Ø) | 142 (137) | 14,3 | 929 / 946 | norsk | −11,3° | 1,006 |
| Måløy–Shetland | 188 (185) | 18,8 | 1 224 / 1 248 | britisk | −14,1° | 1,009 |

- **Drivstoffet:** forbruket ligger innenfor 3 % av overslaget i rutepanelet. Kyst15 (9 000 L) rekker alle turene og tilbake; kyst21 og havbåtene likeså. Sjarken (900 L) rekker Nord-Island bare 108 % én vei og blir stoppet av panelet («Ikke nok drivstoff»); til Sentralbanken bruker den 52 % én vei og kommer ikke hjem. Panelet sjekket bare veien ut, så det sier nå fra når tanken ikke rekker tilbake til nærmeste bunkring (`placesNear(end, 'bunker')`, luftlinja og en tidel til, samme fart og vind; varsel, ikke stopp; `noback` i `ui/01-i18n.js`, `panelRoute` i `ui/07-guide.js`). Nærmeste bunkring fra Sentralbanken er Longyearbyen verft, 322 nm.
- **Ingen kuling i juli** på noen av turene (andelen 3-timers verdier over 14 m/s er 0 % i juli og 12–16 % i januar på feltene). Hva kuling langt til havs gjorde, ble målt for seg (januar, 20 m/s, `shelterReturn`): nærmeste kai var 167–676 nm unna. Nå ligger båtene bi der (4.12j).
- **Kuling langt ute** (`shelterReturn`, `core/06-services.js`): kandidatene (de `SHELTER.tries` = 5 nærmeste kaiene etter luftlinja, før 3) prøves nå til luftlinja til neste er lengre enn den beste ruta så langt, og den korteste ruta tas, ikke den første som finnes. Fra Sentralbanken: Longyearbyen 481 nm (rundt Sørkapp) → Gamvik 319 nm. Langs kysten er valget det samme som før (Bergen, Bodø, Hammerfest, Kristiansand og Senja: kaia 5–18 nm unna).
- **Sonen ved Vikingbanken:** 60° N 2,0° Ø ligger i britisk sone; banken er på norsk side lenger øst, så testen bruker 2,6° Ø.

## 4.12j Ligge bi i uvær (havsteget H1b R8, 05.11.2026)

Jonas 05.11.2026: «Mange av de større havfiskebåtene er laget for å kunne være ute i orkan. Nå vet ikke jeg hva det verste været som kan bli i spillet er, så du får ta en vurdering.»

**Det verste været i spillet** (ti år, hver 3. time, `windAt` og `hsAt` på feltet):

| Sted | Mest vind | Mest sjø | Timer i året over 24 m/s | over 8 m sjø |
|---|---|---|---|---|
| Vikingbanken | 35,2 m/s | 12,4 m | 35 | 34 |
| Shetland | 34,6 | 12,3 | 32 | 24 |
| Utenfor Lofoten | 31,0 | 11,7 | 21 | 20 |
| Bjørnøya | 29,0 | 10,6 | 19 | 15 |
| Sentralbanken | 25,8 | 8,9 | 4 | 4 |
| Petsjorahavet | 25,5 | 8,5 | 2 | 1 |
| Nord-Island, Danmarkstredet | 24,7 | 8,1 | 0 | 0 |

**Vurderingen:** havfartøyene (`cls: 'hav'`, 38–75 m) er bygd for å ligge ute, og ingen av dem rekker en kai fra feltene uansett. Å løpe hundrevis av nm i kulingen (fra Nord-Island 675 nm, 68 timer) er verre enn å ligge bi. Derfor (`lieTo`, `lieToStep`, `windLim`, `seaLim`, `quayFar` i `core/05-vessels.js`):
- **Havfartøyene** på egen tur arbeider etter egne grenser, ikke etter kystinnstillingen («Autonav går inn ved», 6–20 m/s): vinden `BOAT.risk[2]` (24–26 m/s) og sjøen midt mellom `risk[0]` og `risk[1]` (6,5–8,5 m; sjøen over `risk[0]` alene er 130 timer i året på Vikingbanken, midtpunktet om lag like ofte som vinden over 24 m/s). Over dem ligger de bi der de er, også nær kysten; de går ikke i havn. Avgangen utsettes også bare etter deres egen grense.
- **Alle andre båter** ligger bi i stedet for å gå til kai når nærmeste kai er over `RIDE.h` = 8 timer unna i fart (Bjørnøya 213 nm, Nord-Island 682 nm). Langs kysten er det som før: Kristiansand, Bergen, Haltenbanken (40 nm), Bodø, Tromsøflaket, Hammerfest, Båtsfjord og Vikingbanken (76 nm) går inn.
- **Bi:** baugen mot sjøen i styrefart. Båten holder stedet (ingen avdrift; `lieDrift` står), bruker diesel som ved `RIDE.kn` = 4 knop, faren i sjøen er ett trinn lavere (`risk`), og statusen er «Ligger bi i uværet». Når vinden har vært `RIDE.ease` = 2 m/s under grensen og sjøen under i `RIDE.calm` = 60 minutter, fortsetter ruta («Det har løyet etter N timer»). Tar spilleren båten (ny rute, roret), er det slutt på å ligge bi. Sover skipperen alene, driver båten som før (`sleepDrift`).
- **Driftsplan 2** (fra H2c, 05.11.2026, «Havbåten i Driftsplan 2» i `driftsplan.md`): kystbåtene har planens grenser og går i ly som før. En havbåt på planen arbeider med redskapet under planens grenser (forhåndsvalgene 15/4, 18/5 og 21/6 m/s og m), venter ved lina over dem, og ligger bi over sine egne grenser her (`plan2Wx` gir `{hav:true}`), også når planen venter ute og uansett kystinnstillingen; hun går ikke i havn for været.
- **Testen:** `tests/havtur.py storm` (`WX_FORCE`): kyst15 langt ute i 20 m/s ligger bi og fortsetter, kyst15 ved kysten går til kai, havfartøyet går videre i 20 m/s (sjøen 7,2 m) og ligger bi i 28 m/s (11,4 m).

## 4.12k Havnas vei inn holder seg ut fra land (04.11.2026)

Jonas (video fra Tufjord, 04.11.2026): «Båter går gjennom landmassen i autonav … Fiks det uten å gjøre autonav dårligere.» Båten gikk på Autonav inn til Tufjord og seilte i 3D oppå fjæra langs stranda vest for mottaket. Årsaken var havnas egen innseiling (`approachPath`): søket gikk bredde først gjennom 25 m-cellene og spurte bare om cellen var vann, og utrettingen spurte bare om linja krysset land. Ved Tufjord gikk den tredje etappen 1 m fra kystlinja. Simuleringen regner det som vann, men i 3D faller fjæra 1:3 fra 2 m på linja, så vannlinja ligger noen meter ut ved fjære, og båten har bredde og skjærer svingene. Inne i havna (600 m rundt havnepunktet) sjekker hverken grunnsjekken eller Autonav avstanden til land, så ingenting fanget det.

- **Søket** (`approachPath` i `core/07-harbours.js`) er nå korteste vei (Dijkstra, `leiaHeap`) der et steg koster mer jo nærmere kysten cellen ligger: opptil 1 + `APPR.K` (6) ganger på linja, ingenting utenfor `APPR.R` (40 m), målt mot den fine kysten (`apprClr`, `coastDistM`). Veien legger seg midt i bassenger og sund, og går tett inntil land bare der vannet er så smalt. De samme cellene er åpne som før (land, skårne hjørner, moloer, `pt.free`), så alle havner som hadde en vei inn, har det fortsatt.
  - Innenfor `APPR.near` (60 m) av havnepunktet koster ingenting ekstra: der legger båten til kai. Uten det gikk veien til Leknes verft rundt kaia for å komme inn fra den åpne siden.
  - Et steg mellom to celler som krysser en flik av den fine kystens land, koster `APPR.cut` (20) celler mer. Det brukes bare der det ikke finnes annen vei, som før.
- **Utrettingen** godtar en rett etappe bare når den ikke går nærmere kysten enn cellene den erstatter, opptil `APPR.keep` (25 m), med 4 m slingringsmonn. Innenfor `APPR.near` av havnepunktet og innenfor `pt.free` gjelder det ikke.
- **Utrettingen og strammingen** (`leiaLegOk`, `leiaPull` i `core/11-route.js`) spurte ikke om avstanden til land inne i havnene (600 m rundt havnepunktet, `inHarbour`). Nå holder en rett etappe der `LEIA.harbourMin` (20 m) fra den fine kysten, sjekket hver 6. m (`leiaHarbourClr`), unntatt innenfor 80 m av et havnepunkt eller rutas ender og 30 m ved etappens egne ender. I `leiaLegOk` gjelder det for alle marginer, fordi utrettingen tar varianten med færrest punkter, også den uten margin (Engenes: en etappe ut av havna gikk 1 m fra stranda); ikke for `opt.tight`. Begge faller tilbake på punktene de har, så ingen rute forsvinner, og går havnas egen vei nærmere land, beholdes punktene dens.
- **Tidevannskreditten og hindringene etter to ruter samtidig** (`LEIA_RUN` i `leiaRoute`): hver rute la tilbake det den fant da den begynte. To ruter som overlappet og ble ferdige i den rekkefølgen de begynte (returen i kuling ved siden av en annen), etterlot den første rutas kreditt (og frisonene ved endene, `HIND.ctx`) for godt, så kartplotterens flytting av et trykk ut fra grunna og lanene regnet med kreditten utenfor en rute. Nå får den nyeste som fortsatt regnes sine tilbake, og når den siste er ferdig, det som var før den første. Funnet av `autonavtest` 9a, som ble rød da tidene i rutesøket endret seg.
- **Målt** over alle 372 havnene langs kysten, før → etter (sonde i kladdemappa, `approachPath` og hver etappe til havnepunktet):
  - Nærmeste avstand til kysten mer enn 120 m fra havnepunktet: under 5 m i 111 → 3 havner, under 20 m i 184 → 15; medianen 20 → 36 m. Tufjord: 1 → 25 m.
  - Ingen havn mistet veien inn (den samme ene havna har ingen før og etter). Etapper over land (utenfor `quayLand`) i 12 → 3 havner, ingen nye.
  - Veiene inn er til sammen 0,95 % lengre (281,3 → 284,0 km), den største økningen 280 m (Træna utstyrsbutikk, fra 7 til 24 m fra land). 754 → 809 punkter.
  - Tiden: `approachPath` regnes én gang per havn per økt. Den lengste tok 107 ms (Mandal utstyrsbutikk, før 32 ms), snittet 14 ms (før 5 ms).
- **Målt på hele ruter** (16 par, før → etter, sonde i kladdemappa): lengden er den samme innenfor 0,5 % (Seløy–Brønnøysund 52,0 → 46,5 nm), ingen etappe på grunn (`groundCheck`) eller over land, og tidene som før eller kortere. Nærmeste avstand til land inne i havnene (utenfor 80 m av endene): Havøysund–Tufjord 2 → 21 m, Tufjord–Havøysund 0 → 22, Engenes–Harstad 4 → 20, Meløy–Bodø 1 → 18, Bremnes–Bergen 3 → 23, Havøysund–Mehamn 3 → 21. Lavt fortsatt: Honningsvåg–Hammerfest 2, Seløy–Brønnøysund 3, Gjesvær–Tufjord 4 (leinettets egne etapper og lanene brukes som de er).
- **Testene:** `autonavtest` (20 OK), `obstest`, `naustleia`, `rorbutest`, `havntest`, enhetstestene. `harbourtest` er rød på Finnsnes-kaia (båtene 15–18 m ut fra kaia) også på bygget før endringen.
- **Ikke gjort:** de tre havnene som fortsatt har under 5 m (Fosnavåg, Mandal verft og Bøvågen) ligger der vannet er så trangt. Inne i havnene sjekker grunnsjekken fortsatt ikke land (`groundCheck` hopper over `inHarbour`).

## 5.15 Ruteplanleggeren og Autonav (01.10.2026, Autonav fra 02.10.2026)

- **WP-navn** (`ui/03b-route.js`): WP0 er starten (havna eller båten), så WP1, WP2 … i den rekkefølgen de seiles. Navnene brukes i kartet, lista, varslene («Etappe WP2→WP3 krysser land»), GPS-boksen og loggen («WP3 passert»). Punkter havna legger til på vei ut og inn (`w.auto` `'out'` eller `'in'`), vises dempet og merket «utseiling» eller «innseiling».
- **A12:** `exitWps` og `entryWps` (`07-harbours.js`) legger bare inn punkter når veien fra dem til neste punkt er fri, og aldri selve havnepunktet. Ser ingen av punktene målet, legges ingen inn, og etappen spilleren tegnet, blir markert.
- **Rutelista** har ett kort per WP: kurs som skal styres (rettvisende, kartet er nord opp), lengde i nm, ETA i spilltid med nedtelling i ekte tid, koordinat, fisketid ± og redskapsbrikke. `draftTimeline()` regner ut kurs og tider. Under kortene står sumlinjene, og knapperaden med «Kast loss» står fast nederst. Sidepanelet i plotteren er 340 px bredt.
- **Sjøen langs ruta** (Ø8, 06.11.2026, backloggen 10.2 «Planleggeren viser ikke bølger langs ruta»): hvert kort har «Sjø 1,2 m» etter ETA: det høyeste lokale varselet langs etappen ved det minuttet båten er der (`hsAtFc`, det samme som kolonnen «Ved båten» i Vær-fanens tabell; `draftSea(tl)` i `ui/03b-route.js`: prøver hver halve km, høyst 24 per etappe, fordi sjøen skifter på noen hundre meter i et havnegap: hver km viste 0,7 m der gapet i Bodø ga 1,2 m, med tida fra `draftTimeline()`, så en utsatt avgang i `S.draftDep` gir sjøen ved den tida). Først viste kortene spillets egen sjø (`hsAt`); Jonas valgte varselet samme dag (R1 A, 06.11.2026), fordi den sjøen som faktisk kommer, er noe skipperen ikke kan vite for en avgang fram i tid. Ved avgang nå er de nesten like; med avgang om 30 timer skilte de 5–8 % ved Finnsnes (`routetest`). Fra båtens forsiktige grense (`BOAT.risk[0]`, det Fartøy-appen kaller «tåler bølger til … m trygt») står tallet i rødt, som regellinjene på kortene, med «farlig» fra faregrensen (`risk[1]`), og under kortene står én linje: «✕ Varselet gir sjø over båtens grense på 1,2 m på etappe WP1→WP2 (2,1 m) … når båten er der.» Kortene tegnes av `panelRoute` i `07-guide.js`; `routeSeaDraw` legger sjøen inn etter hver tegning gjennom en `MutationObserver` på `#panel` (satt opp fra `renderRouteTools`), fordi Ø8 bare skulle røre `03b-route.js` mens andre økter går. Fargen står inline, fordi `.wpc .wg b` veier tyngre enn `.bad` og `styles.css` var en annen økts. Ryddejobb: flytt linja inn i `panelRoute` når `07-guide.js` er fri (backloggen 10.7). Tester: `routetest` (kortene har varselet, likt `hsAtFc` prøvd uavhengig på samme måte, også med avgang om 30 timer, der det skiller seg fra sjøen som kommer; rødt og linja bare over grensen), stikkprøven i Bergen, Bodø og Hammerfest i begge formater (`tests/out/bolger/`).
- **Angre og gjør om:** Alle endringer i kladden er steg i en historikk på 100 steg per båt (`draftEdit`, `draftUndo`, `draftRedo`). Den lagres ikke. Flytende knapper på 44 × 44 px står over zoomknappene.
- **Flytt og sett inn:** Et trykk innenfor 22 px av et punkt drar det. Havner det på land, blir det rødt og går tilbake. En finger til avbryter og zoomer kartet. Havna til slutt kan ikke flyttes. Hver lange etappe har en «+» midt på: et trykk setter inn et punkt der, og et drag lager et nytt punkt der fingeren slipper. Farene regnes per etappe (`legHazardMemo`), så et drag regner bare om de to etappene som berøres.
- **Autonav** (før «Følg leia», `core/11-route.js`): A* på rutenettet på 100 m med avstand til land (`DC`). Et steg koster mer innenfor 200 m fra land, og mye mer over vann grunnere enn sikker dybde + 1 m eller nær skjær (ikke i havnene). Havnene forlates og nås via innseilingen. Ruta rettes ut der en rett etappe holder 150 m fra land (mindre der det er trangt), dyp nok og fri for skjær, til høyst 12 WP (lengre ruter flere, se 4.12). Beregningen går i biter på rundt 8 ms. Søket går i et vindu rundt etappen fra K9 (4.12).
  - Bruk (brukerens ønske 02.10.2026): én knapp, «Autonav» (`#rAuto`), over zoomknappene i kartplotteren, og så et trykk i kartet (et punkt eller en havn). Knappene «Følg leia» i panelet og knapperaden er fjernet. Hele autoruta er ett angresteg. Båten går først når spilleren trykker «Kast loss», og kartplotteren blir stående åpen etter «Kast loss». Den lukkes med «Lukk».
  - En håndtegnet rute får en linje som sammenligner den med Autonav gjennom de samme stoppene: «Autonav: 5,2 nm · 20 min · 3,1 L. Din rute: −0,2 nm, −1 min, −0,1 L.»
  - Målt: Autonav er 0–1,4 % lengre enn den strammeste veien langs land til de seks feltene. Fordelen med en god manuell rute er altså liten, fordi rutene mest går over åpent vann.

- **Kartplotteren** (brukerens ønsker 02.10.2026):
  - **Navigasjonslinja** øverst (`#ecdisTop`): HDG, COG, SOG, POS, dybde, tidevann, sol, ekkoloddfeltet (`#heatBox`, 5.14), og helt til høyre «Rute», «Innstillinger» og «Lukk» (`#ecClose`, tilbake til 3D).
  - **GPS-boksen** er flyttet inn i linja (brukerens ønske 02.10.2026). Mens en rute seiles (`body.navon`), kommer WPT (nummer og tid dit som etikett, avstand og peiling), XTE (avstanden fra etappen, R eller L) og ETA (til siste punkt, med navnet) etter POS, med rosa etiketter som ruta. Er linja for smal, viker SOL (under 1 440 px), så TIDEVANN (1 240 px), og under 980 px XTE og POS.
  - **Play og pause** (`#rPlay`, `routePlayMode`, brukerens ønske 02.10.2026): En stor rosa ▶ dukker opp øverst i knappesøyla når en rute er lagt inn og båten ligger stille, og gjør det samme som «Kast loss». Mens båten seiler ruta, blir den ⏸: båten stopper der den er, og resten av ruta går tilbake til kladden (`routePause`), så den kan endres før ▶ fortsetter. En driftsplan pauses ikke her.
  - **«Innstillinger»** (`#ecSet`) åpner et lite vindu under linja (`#plotSet`) med kartplotterens og ekkoloddets innstillinger. Det lukkes med ✕, et nytt trykk på knappen eller når 3D vises.
  - **Sidepanelet** er skjult til spilleren begynner å legge inn en rute. Klassen `routing` på `body` settes av `renderRouteTools` når kladden har punkter, det er en plan, eller Autonav regner. Da kommer panelet med kursene og driftsplanen som før.
  - **Åpning:** `openPlotter()` sentrerer alltid på båten med 6 km i høyden (`PLOT_KM`).
- **3D-visningen** (brukerens ønsker 02.10.2026):
  - **Kompasslinja** (`#compass3d`, `compassDraw` i `view3d.js`): en tynn linje øverst med ±70° rundt kameraets retning, streker for hver 5°, tall for hver 15° og N, NØ, Ø … Retningen er sann (rutenettsretning + γ). En rosa hakk viser midten.
  - **Det lille kartet** (`#miniPlot`, `ui/03e-miniplot.js`) under statusboksen, like bredt som den: nord opp, så stort at ekkoloddringens diameter fyller det (en halv nautisk mil hver vei uten ekkolodd), med fisken (`heatDrawInto` uten uskarphet), ruta som gjenstår og båten. Det tegnes en gang i sekundet over en bakgrunn (sjø, land og kyst for to ganger utsnittet, `miniBg`) som tegnes på nytt bare når båten har flyttet seg en femdel av radien, eller hvert 20. sekund. Å tegne kysten hver gang gjorde skjermbildene i 3D-testene 5–8 ganger tregere med SwiftShader. Et trykk åpner kartplotteren. Det erstatter GPS-knappen og «Planlegg».
  - **GPS-boksen i 3D** (`#gps3d`, brukerens ønske 02.10.2026) under det lille kartet, like bred og like gjennomsiktig som statusboksen: fart, kurs og posisjon, og mens en rute seiles også WPT, XTE, tid til neste punkt og ETA. Den vises ikke i havn.
  - **Minimer og skjul** (Jonas 05.10.2026: «Spillere skal kunne trykke minimer på disse, som gjør slik at bare basisinformasjonen vises på en tynn stripe … Legg også inn muligheten for fjerning av HUD i innstillingene»): «–» i hjørnet av statusboksen gjør den til én linje med klokke, status og penger, og varsler bare om sjøen og lav energi (`S.settings.hudMin`). «–» på det lille kartet (`#plotMin`) skjuler det og viser fart, kurs og posisjon i en stripe (`plotMin`). «+» åpner igjen. I Innstillinger tar «Skjul HUD» bort statusboksen, det lille kartet, GPS-stripen og kompasset (`hudOff`, `body.hudoff`). Alt lagres. Test: `tests/hudtest.py`.

## 4.12l Autonav viker (Ø11.1, 06.11.2026)

Autonav (og Driftsplan, som seiler med den) viker for fartøy båten du følger har vikeplikt for etter sjøveisreglene, innen 1,2 km: et avvik til styrbord fra linja som autopiloten styrer etter (`sjvAuto`, ett kall i `dynAuto`), eller 35° fra etappen i minuttsteget (`sjvSail`, ett kall i `sail`), og tilbake til ruta når de er klare. Ved et stopp, når hun rygger eller snur fra land, og når grunnsjekken finner grunn foran, går avviket tilbake og hun slakker av i stedet. Bare med spillet åpent; i `catchUp` viker ingen. Fra 12.11.2026 (TB1) også tidligere mot raske fartøy (`sjvLead`), med avslakking når avviket alene ikke holder, og tilbake til ruta først når veien dit holder klar av den andre (`sjvBackClear`, regel 8 d). Se `docs/systemer/sjofart-og-lover.md`, kap. 3.3 og 5.10.

## 4.12m Ut fra kaia: fars naust, feltet på første tur og de forseglede havnene (08.11.2026)

Jonas 08.11.2026: «Noen spillere opplever å ikke kunne forlate kaien ved første oppdrag fordi Autonav ikke fungerer», og «Dette er svært alvorlig». Gren `ccr-4946b87f-2gakv1`, test `tests/utfrakai.py` (sett rød på koden før rettingen, grønn etter). Rullet ut 08.11.2026 i 98a182bc (Jonas: «Rull ut»); Hetzner, Pages og «Autonav langs hele kysten» grønne.

**Hvordan det ble funnet.** Et skript i økta valgte hvert av de 162 startstedene, gjorde det spilleren gjør på steget `route1` (Autonav, så et trykk midt i ringen) og trykket «Kast loss», med hele kysten og vec-pakkene i bygget, på testklokka (mars 2027) og på verdens klokke (17.09.2027) ved fire tidevannsfaser. Tre steder sto fast, alltid de samme:

| Sted | Hva som skjedde | Hvorfor |
|---|---|---|
| Averøy | «Fant ingen trygg rute dit.» ved alle tidevann | Naustet lå i en bukt stengt bak en smal tange; ingen vei på vann fra kaiplassen |
| Sleneset | Det samme | Naustet lå i en lagune med et utløp på 12 m, smalere enn 25 m-masken |
| Fosnavåg (17.09.2027) | Første etappe fra naustet «krysset land», og «Kast loss» var grå; en time senere lå feltet der Autonav ikke fant vei selv fra mottakskaia | Havna er forseglet (`approachPath` `pt.free` 0,4 km): veien ut går over fyllingen, som rutepanelets landsjekk ikke kjente til; og feltet velges uten å spørre om båten kommer dit |

Samme feil i rutepanelets landsjekk gjaldt **alle fire forseglede havner (Ålesund, Fosnavåg, Laukvik, Vengsøy) fra mottakskaia**, ikke bare første tur: hver Autonav-rute ut hadde første etappe «over land», og «Kast loss» var grå. Avgangen selv virket på alle 21 stedene som ble prøvd når ruta fantes; feilen var bare i ruta.

**Rettet:**

- **Naustet plasseres der båten kommer seg ut** (`core/07c-naust.js` `naustWay`, `naustFind`, `naustSite`; versjon 3 av `S.naust`): et bredde-først-søk over 25 m-maskens celler, som `berthPath`, fra 9 m ut fra strandlinja (kaiplassen) til cellene ved havnepunktet, havnas vei inn (`approachPath`) eller åpent vann (en 100 m-celle `LANE.clear` fra land, som `leiaLane`), innen 1,2 km: ikke land, brygge, kai eller havneenhet (`berthBlocked`), ingen kystlinje mellom to celler (`coastSegHit`), ingen avskåret hjørne, og utenfor havna (`inHarbour`, der seilasen ikke ser etter grunn) vann så dypt som rutefinnerens minste ved sjøkartnull (`BOAT.draft + LEIA.minOver`, så det holder ved laveste tidevann) og ingen skjær. Linja strammes på samme måte. `shoreSpot` har fått `o.ok`, som bare spørres for en strekning som ville blitt den beste til nå. Finnes ingen slik strekning, får havna ikke naust, og båten ligger ved mottakskaia (`berthKind` gir `main`). Prøvd på alle 162 startstedene: bare Averøy og Sleneset mangler veien (Smøla nord når åpent vann, ikke havna), rundt 20 ms i median og 250 ms på det meste.
- **Gamle lagringer** (versjon 2): naustet sjekkes én gang når kartet 1,2 km rundt havna er inne. Har det vei ut, blir det stående (versjon 3); hvis ikke, finnes det på nytt, og båten som ligger der, ligger ved det nye (`berthPose` leser stedet). Det flytter naustet bare i Averøy og Sleneset.
- **Autonav fra naustet når søket ikke finner vei** (`ui/03b-route.js` `leiaTo`): etter de to forsøkene som fantes (fra kaiplassen, og med havnas vei ut, tilbakemelding #39) går ruta på vann fra kaiplassen til havnepunktet eller åpent vann (`naustWay`), og videre derfra: fra havnepunktet nøyaktig den ruta en båt ved mottakskaia får, ellers fra der veien ender. Fra naustet teller en rute med en etappe over land som ingen rute (rutepanelet ville gjort «Kast loss» grå), og den første varianten der alle etappene holder seg unna land, tas.
- **Feltet på første tur må kunne nås** (`ui/08c-start.js` `chooseStart`, `tutFieldNear` med `skip`): ruta fra havnepunktet til feltet regnes når startstedet velges; finner Autonav ingen vei, tas neste beste felt (ikke innen 0,8 km av et som ble forkastet), høyst fire. Når ingen nås (ikke sett), står det beste som før.
- **Etapper over en forseglet havns egen fylling** (`core/07-harbours.js` `quayLandLeg`, lest av `legClearMemo` i `core/01-world.js`, altså rutepanelets `estimate` og kartplotterens tegning): en etappe som berører sonen `pt.free` rundt havnepunktet, er klar når landet den krysser er `quayLand`, og den bare krysser kystlinja inne i sonen, samme regel som havnas egen vei ut. `pt.free` er kjent først når havnas vei inn er funnet, så `quayLandLeg` finner den for havnene innen 0,5 km av etappens ender først.

**Ikke rettet, står i backloggen:** krasjene i kartvisningen (sju på to uker fra tre spillere, seks på iPhone; en ny spiller i Troms 06.11.2026 åpnet kartplotteren på steget `gps` og ble borte etter ett livstegn), Smøla nord uten rute fra mottakskaia til feltet 17.09.2027 (fra naustet går den via åpent vann), og oppstartens sjekk av planen (`ui/11-boot.js`, `legClear`), som ikke kjenner `quayLandLeg` (ikke sett feile i testen).

## 4.12n Hopp over resten av ruta (HO1, steg 104, 12.11.2026)

Jonas 12.11.2026: «Under seiling så dukker det opp en liten knapp i hjørnet som åpen en rute der det står en kostnad for å skippe resten av ruten, altså teleportere seg til målet.» Planen, valgene og prisene står i `docs/planer/hopp.md`. HO1 er kjernen uten knapp og betaling. Knappen er HO2 (steg 105), kjøpet HO3 (steg 106).

- **Hvor hoppet går** (`hopStop` i `core/06j-hopp.js`): til neste stopp på ruta, altså en havn, en fiskeplass, redskapsarbeid, en ankring eller rutas siste punkt (`wpStop`, `w.anchor`). Ved målet gjør `arrive(w)` det samme som når båten seiler fram: legger til kai, begynner å fiske, setter eller trekker redskapet, eller ligger stille.
- **Klokka står stille.** Verdens klokke flytter seg ikke, så alt annet enn tida går som om båten seilte (Jonas: «Ja, med vilkår»):
  - **Tørrkjøringen** (`hopRun`) seiler resten av veien minutt for minutt som `sail()`. Den bruker `sailV` for farten, med fartsgrensene, bremsingen inn mot stoppet og sjøen, og trimmen til den går ut. Vind og sjø er der båten er hvert minutt (`windAt`, `hsAt`), og dieselen regnes med `fuelLph`. Ingenting i spillet endres: plassen, farten, kursen og rutas indeks settes tilbake.
  - **En trim som går ut underveis** går ut i tørrkjøringen der den ville gått ut (`trimEnd`, med toppfarten og rutas fart ned som i `vesselStep`), og settes tilbake etterpå.
  - **Hoppet** (`hopDo`):
    - trekker dieselen (`fuelUse`, også på turens felleskostnader) og legger til motortimene
    - tar trimmen og Skippertak for minuttene de ville gått (`b.trim.until`, `S.skip.until`)
    - hvert minutt der båten ville vært: lar fangsten holde seg og hendene på dekk sløye og ise (`holdMinute`, trukket ut av `vesselStep` i `core/05-vessels.js`), bruker provianten (`provMinute`) og gir mannskapet om bord slitasjen (`crewSeaFat`, trukket ut av `crewTick` i `core/04-crew.js`, med natta etter klokka og arbeidsandelen fra `workAssign`: den ved roret og i byssa arbeider hele tida)
    - hver time: turens timer på sjøen (`tripHour`), autolinas kroker (`autoFixHour`) og den levende snøkrabben i tankene (`snoTankHour`)
    - gir energien din som `energyMinute` ville gitt (`hopEnergy`: ned på sjøen, opp i køya, søvn ved null, brovakta som når du sovner)
    - legger punktene båten passerer, i sporet (`S.trail`, som `arrive` gjør for hvert), så veien hjem og kartet følger ruta
- **Det som tjenes ved å seile, tjenes ikke ved å hoppe:** ingen fartstid (`fsMinute`), ingen distanse (`tatAdd('nm')`), ingen merker for vær, natt eller spillere møtt (`achMinute`) og ingen sjøtimer til mannskapets erfaring. Ingen av dem kalles. Det som kommer av å legge til kai, kommer som ved enhver ankomst: «Havner besøkt» (`achVisitPort`) og tatoveringen for en trygg tur (`tatTripEnd`) i `dock`.
- **Nektet før kjøpet** (`hopWhy`, så `hopRun`), med en grunn og uten at noe endres:
  - ingen rute som seiles
  - Driftsplanen (`pl.ops`, `pl.p2`)
  - båten stopper («Stopp båten», `pl.halt`), eller Autonav finner en vei rundt grunt vann (`pl.replan`)
  - ankeret er ute, eller båten ligger bi
  - noen er i sjøen (`S.mob`, Autonav mot den: `pl.mob`)
  - du sleper en annen spiller (`S.ptowH.st === 'tow'`; på vei til en som trenger slep går hoppet)
  - første tur
  - tida fra et lukket spill er ikke spilt inn ennå (`WCLOCK.on` og `worldT()` foran `S.t`): hoppet ville talt minutter innhentingen seiler uansett
  - et turoppdrag i gang med denne båten
  - (før 12.11.2026: været på veien; nå nekter været aldri, se under)
  - for lite diesel
  - nesten fremme (under ett ekte minutt)
- **Været nekter aldri hoppet** (Jonas 12.11.2026: «uavhengig av været eller andre ting», og om kortet som sa nei for 11 m/s på testutgaven: «Jeg trodde vi ble enig om at hoppet skulle fungere uavhengig av været?»). Tørrkjøringen regner vinden og sjøen for farten og dieselen, men nekter ikke for dem. **Betalt** (`hopGo(true)`, HO3) går hoppet også med for lite diesel og nesten fremme.
- **Prisen** (`hopPrice`, `HOP.steps`) er 75 øre per spart ekte minutt den første timen, 50 øre de neste tre timene og 25 øre etter det, minst 5 kr og uten tak. Trinnene virker som skattetrinn, så prisen stiger alltid med tida.
- **Kartet ved målet** lastes før hoppet (`hopGo`: stoppet fra ruta, `mapNeed` der med en tidsgrense på `HOP.mapMs` = 20 s, så én tørrkjøring med verden slik den er da). Kommer ikke kartet, blir det ikke noe hopp: «Kartet ved målet kom ikke. Prøv igjen om litt.» Hånda på roret trenger ingen egen sjekk, fordi roret tar bort ruta (`helmOn` krever at det ikke er noen rute).
- **Spoleknappen og kortet** (HO2, steg 105, `ui/10u-hopp.js`; Jonas 12.11.2026: «Jeg tenker selve knappen kan legges her på skjermen, og vises som et "fast forward"-symbol, nesten som en spoleknapp. Den skal være kontekstuell og kun komme opp når en rute er i gang.»):
  - `#hopBtn` (⏩, `.ov.hop`) står i 3D til høyre, rett under kamera- og kino-knappen og like stor. Den vises bare mens en rute seiles (`hopShown`: ikke Driftsplanen, ikke med hånda på roret, ikke mens båten stopper eller Autonav finner en vei rundt, ikke mens tida fra et lukket spill spilles inn, `CATCH_LEFT`), ikke i kartplotteren, i kinoens rene visning eller mens kinoens «Skjul» står på plassen. I roen (U2-4) dempes den som kamera- og kino-knappen. Hvert bildetikk kaller `hopUi` (`ui/08-actions.js`, ved siden av `turFotoUi`).
  - Kortet (`hopOpen`, `hopCard`, `modal`) åpner med «Regner ut turen …» og fylles når tørrkjøringen er ferdig, så trykket ikke fryser skjermen. Det sier hvor båten hopper («Til Vangshamn», eller «Til neste stopp på ruta, ved Husøy»), den ekte tida spart (`hopSaved`) og prisen med 💎 (`realKr`), eller grunnen fra `hopQuote`.
  - «Hopp» (`hopPress`) gjør skjermen mørk (`#hopFade`, to bilder før arbeidet, så mørket er tegnet), venter på `hopGo` og så på alle pakkene kartet og 3D leser rundt målet, slik start langs kysten laster dem (`mapPreload` med sim, chart, view, vec og far, høyst `HOPUI.packMs` = 15 s), lagrer og viser skjermen igjen.
  - **Testbryteren:** Admin-appens «Hopp over ruta (test)» (`S.adm.hopp`, `admHopp`) viser knappen og gir et gratis hopp, bare for admin (`adminOk`; `11-boot.js` slår den av for andre), og kortet sier det. Ingen spiller kan hoppe gratis. Fra HO3 vises knappen også der butikken selger (under «Kjøpet»).
  - **Det de andre ser:** båten forsvinner ved avgangen og dukker opp ved målet. Et sprang over `PT_SNAP` (1,5 km) mellom to rapporter hoppes, ikke glis (`ptTake`), og det er ikke noe nytt felt i `pos_put`.
  - **Testen:** `tests/hoppshot.py` (3D, begge formater: knappen under kino-knappen, kortet, hoppet til kaia uten land under, knappen borte ved kaia og med bryteren av).
- **Stikkprøven langs kysten** (12.11.2026, med hele kysten fra kart-31): `KYST_HOPP_FRA=<havn> python3 tests/hopptest.py` i Kristiansand, Kristiansund og Båtsfjord. Dagens vær der (8–10 m/s, 1,3–1,6 m sjø) var over trebåtens risiko, og hoppet ble riktig nok nektet. Sammenligningene går derfor i stille vær (`WX_FORCE` 3 m/s) for både seilingen og hoppet.
- **Stikkprøven i 3D** (12.11.2026, `KYST_HOPP_FRA=<havn> KYST_HOPP_TIL=<havn> python3 tests/hoppshot.py`, liggende, uten noe kart lastet langs veien):
  - Kristiansand–Bergen verft, 222 nm: 6 t 10 min spart, ved kaia etter 1,7 s med kartet og 3D-pakkene ved målet.
  - Kristiansund–Ålesund, 68 nm: 1 t 50 min, 2,0 s.
  - Tromsø–Hammerfest, 120 nm: 3 t 19 min, 1,3 s.
  - På Senja (16 nm): 0,6–0,7 s.
  - Det første bildet etter et langt hopp tar minutter med SwiftShader på testmaskinen, fordi alle pakkene rundt målet tegnes. Skjermbildet etter hoppet har derfor 10 minutter. Hvor lenge det tar på et nettbrett, måler Jonas (`docs/spill-dette/105.md`).
- **Tida tørrkjøringen tar** (målt 12.11.2026 på testmaskinen, hele kysten, trebåten, `hopRun`): Bodø–Tromsø 193 nm på 222 ms, Kristiansand–Bergen 222 nm på 263 ms og Ålesund–Bodø 384 nm på 400 ms. Det gir 5,4, 6,2 og 10,7 ekte timer spart, til 156, 168 og 235 kr. `hopGo` kjører den to ganger, og kortet én. På et nettbrett er det trolig to til tre ganger så lenge, og Jonas måler det (`docs/spill-dette/105.md`).
- **Kjøpet** (HO3, steg 106, 12.11.2026; Jonas: «Gjør helt ferdig og rull ut på test med en gang.»; `supabase/migrations/20261112200000_hopp.sql`):
  - **Knappen** vises der butikken selger (`shopMode()` er `live` eller `test`, ikke `off`: ingen sky på et offentlig nettsted, eller butikken stengt for kontoen, P5). Admin-bryteren gir fortsatt et gratis hopp for testing.
  - **Kortets knapp er kjøpet:** «Kjøp · 💎 N kr» med vilkårslinja (`shopLabel`, `shopFine`). Gjester får registreringsspørsmålet (`payBuy`).
  - **Prisen** regnes på hele ekte minutter (`q.realMin`), og serveren regner den samme (`hop_price`, `shop_quote_hop`). `shop-checkout` sender beløpet til Stripe som `price_data` og lagrer minuttene, stoppet (`{x, y, port}`), båten og prisen i kjøpet (`purchases.data`).
  - **Holdet** (Jonas 12.11.2026: «Når brukeren trykker på hopp-knappen stopper båten momentant som om den var fryst i tiden»; `hopHoldOn`, `hopHeld`, `b.hopHold = {t0, until, to, pay}`):
    - ⏩ fryser båten før kortet vises. `vesselStep` (`core/05-vessels.js`) og `dynCan` (`core/16b-dyn.js`) lar henne ligge der hun er: ingen fart, ingen diesel, ingen værvending og ingen motortrøbbel.
    - Verdens klokke, fisken og mannskapet går som før.
    - Holdet står i lagringen, så det varer mens siden er hos Stripe og mens tida borte spilles inn.
    - Holdet slutter ved hoppet, ved «Avbryt», ved `?kjop=avbrutt` (`shopStart`), når ruta endres (`hopMatch` mot stoppet), når siden skjules med kortet åpent, når betalingssida ikke ble åpnet (gjest, feil i `shopGo`: `hopHoldTick`), og etter `HOP.holdReal` = 35 ekte minutter.
    - Stripe-økta for et hopp utløper etter 31 minutter (`shop-checkout` `expires_at`).
  - **Leveringen:** grantet fra webhooken har de samme dataene. `srvApply` (`ui/10i-shop.js`, 5b) gjør hoppet når båten det ble kjøpt for, ligger holdt for det samme stoppet (`hopHoldFor`):
    - Det skjer med `hopDeliver` → `hopPress` → `hopGo(true, minutter)`, uansett vær. Er tida borte ikke spilt inn ennå, eller kom ikke kartet ved målet, ventes det i høyst `HOPUI.waitMs` = 3 min (`hopWait`: `hopCatching`, også `CATCH_LEFT`).
    - Serveren får beskjed med `hopUse` (`hop_use`), én gang om gangen. Id-en står i `S.hopQ` til serveren har svart. Svarer den `false`, var hoppet alt brukt, og det telles (`hop_twice`).
    - Turen må være dekket av minuttene i kjøpet (`hopCovers`, `hopCoverMax`: en tidel og to minutter mer er lov).
    - Kvitteringen (`shopThanks`, `shopWhat(k, g)`) har prisen og minuttene fra grantet.
    - Ingenting er tilgode etter hoppet (Jonas 12.11.2026: «Når spilleren har kommet fram til endepunktet av ruten ved hjelp av hoppet er tjenesten levert og spilleren skal ikke ha noe "hopp" tilgode»), og hopp selges bare ved ⏩ («Hopp skal ikke selges i kaiboden»). Kaiboden-ordningen er tatt bort.
  - **Et kjøp som ikke kan gjøres** blir merket for refusjon (`hopVoid`, `S.hopVoid`, hendelsen `hop_void` for admin), og loggen, Meldinger og skjermen sier det én gang. Det gjelder når holdet var sluppet da betalingen kom, når turen er tydelig lengre enn kjøpet, og når noe i `hopWhy` gjelder. Grantet blir liggende ubrukt på serveren til Jonas refunderer i Stripe, og da tar `shop_refund` det tilbake. En side som har mistet spillet (`TAB`), leverer ingenting; den som har spillet, gjør det.
  - **Refusjonen:** `shop_refund` tar tilbake et hopp og en «Ferdig nå» som er levert og ikke brukt, som en haill. Et brukt hopp står.
  - **Havne-id-en** i kjøpet beholdes som spillet har den (en kaiplass er `'hs:'` + en hash, et mottak kan hete `mØF50`); `shop-checkout` stryker bare kontrolltegn.
  - **Testene:**
    - `tests/sqltest.py` HO3 sjekker `hop_price`, `shop_quote_hop`, grantet i `shop_state`, `hop_use` og refusjonen.
    - `tests/kjoptest.py` steg j og k (kjør med `fasittest`) sjekker:
      - at ⏩ stopper båten
      - kjøpet fra kortet og `shop-checkout` med minuttene og stoppet
      - at båten ligger stille etter retur fra Stripe, også når tida borte er spilt inn
      - at hoppet gjøres fra holdet når betalingen kommer, og at kvitteringen har prisen og minuttene
      - at et grant for en båt som ikke er holdt, merkes for refusjon én gang, uten noe i Kaiboden
      - at hoppet venter på innhentingen (`CATCH_LEFT`)
      - at et kjøp for 1 minutt ikke gjøres på en tur på 15
      - at et avbrutt kjøp slipper båten
    - `tests/hopptest.py` 4d sjekker at båten står stille i 30 spillminutter uten diesel, og at holdet slutter når ruta endres og etter 35 ekte minutter.
    - `tests/hoppshot.py` 4d tar skjermbildet av kortet slik spillerne ser det, «Kjøp · 💎 N kr» med vilkårslinja, i begge formater. 4e sjekker at ⏩ stopper båten og at «Avbryt» slipper henne.
    - `tests/unit/hopp.test.mjs` sjekker holdet, `hopWait`, `hopCovers`, `hopMatch` med en id uten kolon og `TAB`.
  - **Kontrollene av HO3** (12.11.2026) fant blant annet:
    - kvitteringens pris
    - kaiplass-id-en
    - at minuttene ikke ble sjekket
    - at refusjonen ikke tok hopp tilbake
    - at et betalt hopp kunne komme mens tida borte ble spilt inn
    - at grunnene i meldingene ikke stemte
    - at `hop_use` ble sendt to ganger
    - at en fane som hadde mistet spillet, kunne hoppe

    Alt er rettet med tester som ble sett røde først. Den andre kontrollen kom før Jonas bestemte holdet; holdet har fått en egen kontroll.
- **Ikke med:** maskinhavari og sjø over ripa i grov sjø (`risk`): hoppet går i all slags vær, og det som kunne ha skjedd underveis, hoppes over, og måltidene underveis (`mealMinute` går etter klokka, som står stille; de verken serveres eller telles som hoppet over, og i havn spiser mannskapet i land).
- **Testene:** `tests/unit/hopp.test.mjs` (prisstigen, neste stopp, nektingene, tida i ord, energien, mannskapets slitasje og det de andre ser) og `tests/hopptest.py` (LITE, Senja: hoppet mot den samme ruta seilt med `playMinutes`, med og uten en hånd om bord, trim som varer og trim som går ut underveis, et stopp midt på ruta, nektingene og betalt hopp).
- **Kontrollen** (`/kontroll`, 12.11.2026) fant at sporet manglet de hoppede punktene, at proviant, snøkrabbe i tankene, turens timer, mannskapets arbeidsandel og Skippertak ikke gikk som om båten seilte, at mann over bord og slep av en annen spiller ikke ble nektet, at en trim som gikk ut underveis ga et for raskt og billig hopp, at et kart som ikke kom ble hoppet til likevel, og «1 t 60 min» i loggen. Alt er rettet med tester.
