# Driftsplan 2: revisjonen (fase 0, 26.10.2026)

Dette er funnene fra å *spille* dagens driftsplan i testmiljøet, ikke bare lese den. Oppdraget står i `00-oppdrag.md`. Her står hva som virker, hva som ikke virker, og hvorfor: om feilen sitter i **modellen** (hva en plan er), **motoren** (hva den gjør minutt for minutt) eller **siden** (hva spilleren ser og får til). Ingen løsninger her; de kommer i `02-design.md`.

Alt som står her, er målt eller lest i koden 26.10.2026 på grenen `ccr-5e1ba2f4-pusvyd` (siste commit 125fc6a). Loggene og skriptene ligger i `revisjon/` ved siden av denne fila, så tallene kan sjekkes og kjøres på nytt.

## 1. Slik ble det gjort

- **Bygget:** `node build.mjs` med Senja-dataene (hele kysten var ikke bygd), testet over HTTP uten 3D (`KYST_LITE=1`, Playwright 1.63 med Chromium 1243). `tests/drifttest.py` ble kjørt først som grunnlinje: 17 OK, ingen sidefeil. Det som står nedenfor, er altså *ikke* feil testene fanger; testene sjekker det planen ble bygd for, ikke det Jonas ba om.
- **Spilldøgnene:** klokka satt til mandag 6. mars 2028 kl. 03:00 (skreisesong), `S.qseed` låst, `Math.random` seedet inne i hvert oppsett, `TAB.held` så sidens egen løkke ikke blandet seg inn. Minuttene ble spilt med `step()` slik `catchUp` spiller dem; «åpent» spill ga hendelsesløkka slipp hvert tiende minutt (så asynkrone søk kunne fullføre, slik `tick()` gir dem hvert sekund), «lukket» spilte alle minuttene i ett, slik `playMinutes` gjør det ved oppstart.
- **Stedet:** Finnsnes, der et nytt spill starter (`S.home`). Finnsnes har ikke fiskemottak i spillet; de nærmeste er Botnhamn 30,3 km, Senjahopen 34,4, Husøy 36,1, Torsken 36,1. Plassene lå 2,5–4 km fra Finnsnes i Gisundet, 36–77 m dype.
- **Målt hvert minutt:** planens tilstand (tur, status, havn, redskapsarbeid, det planen venter på, stopp), energien din, slitenheten i mannskapet, last, vind og sjø der båten var, redskapet i sjøen med alder; hver time et øyeblikksbilde; «Neste tur» slik siden regnet den ut før hver dag; alle loggmeldinger og varsler; landinger, salg, inndragninger og pengene.
- **Oppsettene** (båttypene er spillets egne; «sjark» er havsjarken 10,6 m med fire køyer, «kyst15» kystbåten 14,99 m):

| Oppsett | Båt og plan | Døgn | Logg |
|---|---|---|---|
| A1 | sjark, to i mannskapet og deg om bord; line 2 + 2 stamper, ståtid 6 t, én juksplass, avgang 05:00, «Vanlig» vær, nærmeste mottak, hjem Finnsnes | 3 | `logg-A1.txt` |
| A2 | samme plan, mannskapet alene (skipper og styrmann utnevnt) | 3 | `logg-A2.txt` |
| B | sjark, tre i mannskapet alene; 18 garn fordelt 6 + 6 + 6 på tre plasser, ståtid 24 t, én juksplass | 3 | `logg-B.txt` |
| C | kyst15, fire i mannskapet alene; døgndrift 2 + 2 med juksa på to plasser | 2 | `logg-C.txt` |
| D | to sjarker samtidig: A1-planen med deg om bord, og B-planen med eget mannskap | 2 | `logg-D.txt` |
| T | kyst15, tre i mannskapet alene; 15 + 15 teiner, ståtid 48 t, juksa imellom | 4 | `logg-T.txt` |
| W | A2 med været tvunget: 12 m/s kl. 03–08, 15 m/s kl. 11–14, ellers 5; grense «Vanlig» (13 m/s) | 2 | `logg-W.txt` |
| Wsafe | det samme med grense «Forsiktig» (10 m/s) | 2 | `logg-Wsafe.txt` |
| Wclosed | Wsafe-dagen spilt *lukket* (alle minuttene i ett, som `catchUp`) | 2 | `logg-Wclosed.txt` |
| N | A1 med 3 % energi kl. 03:00 | 1,4 | `logg-N.txt` |
| E | A1 tre ganger med samme frø: åpent hele tida; åpent dag 1, lukket 30 t, åpent resten; åpent igjen | 3 | `logg-E-*.txt` |
| E9 | A1 spilt lukket i 9 døgn, med deg om bord og med mannskapet alene; veggklokka tatt | 9 | `logg-E9*.txt` |
| F | siden og kartvalget med ekte trykk (CDP) i 384×853, 800×1280 og 1280×800 | – | `side.py`, bildene i `revisjon/` |

Tre scenarier fra oppdraget ble *ikke* spilt på nytt, fordi `drifttest.py` dekker dem og de ikke er der skoen trykker: S8 (stengt felt, oppbrukt kvote), S11 (du tar over) og S12 (gamle planer). Det de gjør i dag, står under R0 og R8.

## 2. Svaret: hvorfor ble den aldri bra nok

Kort: **modellen mangler dagen.** En plan i dag er svarene (hjem, redskap, felt, juksplasser, vær, rytme, avgang) og ingenting mer. Dagen lages på nytt av motoren hver gang båten er ledig (`drTrip`), ut fra et tidsbudsjett på 14 timer og anslåtte timer per enhet redskap, og den som lages, vises ikke for spilleren som det båten faktisk gjør. Det gir tre følger som alle oppsettene viste:

1. **Planen vet ikke hva den selv skal gjøre i morgen.** «Neste tur» på siden er en skisse regnet ut med andre tall enn motoren bruker (rett linje i marsjfart, `DRP.setH`/`haulH` som er 2–6 ganger motorens egen fart), og den viser én tur. Motoren prøver gjerne en tur til samme dag, som skissen ikke nevner, og som ofte er meningsløs (6,5 timers seiling for 15 minutter juksa og 12 kg, oppsett T) eller feiler.
2. **Det som ligger utenfor svarene, finnes ikke for planen:** hvor lina egnes og når den er klar, hvor mottaket ligger i forhold til hjemmet, at teinene er tapt, at avgangen ble utsatt av været. Hver av dem veltet planen i et oppsett: lina ble stående i egnebua i Botnhamn 30 km fra hjemmet (A1, D), planen ga opp tre timer før egnebua var ferdig (A2, D, N), ståtida ble én time fordi værventingen spiste dagsbudsjettet (Wsafe).
3. **Motoren bestemmer «hva nå» hvert minutt, og alt den trenger som ikke er regnet ut på forhånd, søkes asynkront.** Med spillet åpent går det som regel bra. Med spillet lukket (`catchUp`) kan ingen søk fullføre, så en båt som møter grunt vann på planens egen lei, eller må søke ly, blir liggende stille på sjøen til spillet åpnes: ni døgn uten én levering (E9), 37 timer ute i Gisundet med line i sjøen (Wclosed). Det bryter huskeregelen om én felles klokke rett i ryggen.

Siden er for så vidt grei å trykke på (kapittel 6), men den kan ikke bli god når det den viser, ikke er det som skjer. De to omgjøringene (09.10 og 23.10) forenklet *svarene*, ikke dagen. Derfor ble den ikke bra nok.

Delt opp per lag:

| Lag | Står seg | Svikter |
|---|---|---|
| Modellen | svarene er de riktige (hjem, redskap, felt med antall og ståtid, juksplasser i rekkefølge, vær, rytme, avgang); én plan per båt; lenkene splittes etter feltet (`cycleSpec`) | ingen dag, ingen leveringsregel, ingen egning og agn, ingen «gjør dette når …», mottaket låst til det nærmeste feltene, ingen statistikk utover kg per døgn |
| Motoren | leiene fra Autonav, redskapssyklusen, reglene, vaktene 2 + 2, hvilen ved kai, været ved avgang og ly underveis (åpent spill) | dagsbudsjettet, «en tur til», tre feil = stopp, asynkrone søk i lukket spill, egnebua, ståtid som forhandles bort, energien din, meldingstekster som sier det motsatte av det som skjer |
| Siden | radene og valgene er enkle, «Nå»-linja, stopp med knapp, kopiering | tidslinja stemmer ikke, ingen dag å redigere, kartvalget krever at spilleren selv åpner plotteren, ingen statistikk, døgndrift uten tidslinje |

## 3. Funn per krav

Hvert krav: hva som virker, hva som ikke virker, og hvor feilen sitter.

### R0: Sømløst, også lukket, uten å ødelegge det som virker

**Virker:** Planen går alle dager uten tilsyn så lenge ingenting uventet skjer (B gikk tre fulle døgn med garn, C to døgn i døgndrift, D to båter samtidig). Autonav, redskapssyklusen, reglene, ferskheten, liggeplassen og ankringen brukes uendret og viste ingen feil. Ni døgn spilles av på 2,4 s (12 960 minutter, 0,19 ms per minutt), godt under kravet på 10 s. Ingen sidefeil i noen kjøring. Gamle planer før v3 slås av med melding (`driftOps`, dekket av `drifttest` 7).

**Virker ikke:**

- **Lukket spill strander båten (motoren).** I E9 møtte båten «Grunt vann forut» på planens egen lei fra felt 1 mot Botnhamn kl. 12:13 dag 1, og la seg stille og ventet på et omveisøk som aldri kom, fordi `catchUp` spiller minuttene i én sammenhengende løkke der ingen `await` fullføres. Ni døgn: null leveringer, 231 kg om bord, du sovnet av utmattelse to ganger, planen stoppet seg selv kl. 14:14 etter tre forsøk på en ny tur som strandet på «lina er ikke egnet». Det samme med mannskapet alene (E9crew: null leveringer). I Wclosed søkte båten ly kl. 11:01 og ble liggende i Gisundet i 37 timer («Båten driver mot land. Motoren holder henne unna»), med tre stamper i sjøen i 41 timer. Åpent spill fant omveien på 7 minutter (A1 kl. 12:13–12:20) og lyet på 19 (W kl. 11:01–11:20). Det samme gjelder leier planen ikke kjenner (`drFetch`, «Finner veien …»). Kravet i oppdraget, «sju døgns fravær skal gi det samme som om spillet hadde stått åpent», er ikke oppfylt.
- **Planens egne leier er ikke trygge for planen (motoren/data).** Leia felt→Botnhamn, funnet av `leiaRoute` når planen lages, utløste «Grunt vann forut» i alle A-kjøringene (12:09–12:13). To ganger fant omveisøket en vei, én gang «ingen trygg vei rundt» (E-open2: båten ble liggende to døgn med 229 kg, åpent spill). Dette er den svake landsjekken på 200 m-celler fra `BACKLOG.md` 10.6 sett fra planens side: i appen med hele kysten blir det bedre, men planen *stoler* på leia og har ingen plan B uten søk.
- **Planen stopper seg selv ved ting som løser seg av seg selv (motoren).** Tre mislykte forsøk på én time hver (`driftFail`, `DRP.failMax = 3`) slår planen av. I A2 sto båten ved Botnhamn, lina var levert til egnebua kl. 14:58 og «klar ca. kl. 19:18»; planen prøvde 15:14, 16:14 og 17:14 og stoppet. Lina kom klar kl. 19:18 til en båt uten plan. Det samme i D (stopp 17:24, lina klar 19:28) og N. Et stopp krever at spilleren åpner siden og trykker Start; en spiller som er borte i to dager, mister dem.
- **Det samme frøet gir ikke det samme (motoren).** Åpent hele vegen mot åpent–lukket–åpent: 228 kg/4 086 kr mot 230 kg/4 075 kr, samme hendelser til samme klokkeslett. Avviket er lite, men det er der: noe trekker tilfeldige tall mellom minuttene når løkka får slipp. Tredje kjøring med samme frø ga «ingen trygg vei rundt» der de to første fant veien, så omveisøket er heller ikke deterministisk.
- **Ikke rørt:** regelmotoren, redskapssyklusen og Autonav oppførte seg likt i alle kjøringene; ingen av funnene her kommer fra dem.

### R1: En arbeidsdag slik en fiskebåt gjør det

**Virker:** Dag 1 i A1 er en fiskedag: ut 05:00, 2 + 2 stamper satt 05:21 og 05:43, juksa 05:59–09:59 (157 kg), lina trukket 10:11–12:05 (49 + 12 kg), levert i Botnhamn 15:18–15:27 (216 kg, 6 223 kr, 3 875 etter lott), bunkret, hjem 20:51. B gjør det garnbåten gjør: setter tre lenker, jukser imellom, leverer, hjem og hviler; dag 2 og 3 trekker og setter på nytt i rekkefølge («sto 24 t», «sto 25 t», «sto 23 t»), leverer, hjem. Dag 2 og 3 var like dag 1 i B.

**Virker ikke:**

- **Dagen tar slutt uten grunn, eller fortsetter uten mening (motoren).** Etter landingen prøver motoren en tur til så lenge dagen (14 t) ikke er brukt opp og ingen er slitne. I A1 ga det to mislykte forsøk (15:34, 16:34) og hjemreise 17:34; i T ga det hver dag en tur nummer to på 6,5 timer (Botnhamn–juksplassen–Botnhamn) for 8–16 kg, fordi turskjelettet (ut, jukse, levere) er fast og budsjettet på 3–4 timer bare gir 15 minutter juksa. I B droppet den tur to fordi overfarten ikke fikk plass. Spilleren får ikke vite noe av dette på forhånd.
- **Finnsnes er uten mottak, og planen sier det ikke (modellen/data).** Hjem i Finnsnes og fiske 4 km unna gir 3,2–3,4 timers seiling til Botnhamn og 3,3 timer hjem igjen, hver dag, for 2–4 timers fiske. Planen legger 6,5–7 timer transport inn i en dag på 10–14 timer uten å si at det er dagen den bruker. Et nytt spill starter nettopp i Finnsnes.
- **Lina kommer ikke hjem (modellen).** Lina leveres til egnebua på mottaket etter landing (`opsGearAfter`), klar 3 t + 20 min per stamp senere. Planen går hjem før den er klar (A1: hjem 17:34, lina klar 19:38 i Botnhamn), og dag 2 kan ikke gå ut («lina er ikke egnet» kl. 05, 06, 07 → stopp). Planen har ikke noe begrep om hvor redskapet er, om det er klart, eller at mannskapet kunne egnet hjemme. Alle A-, D-, W- og N-kjøringene endte slik: *ingen linebåt kom gjennom dag 2.*
- **Tapt redskap tømmer planen (motoren).** I T gikk 15 teiner tapt i været kl. 10:00 dag 1 (7 m/s, 0,2 m sjø; sjansen er liten, men den slo til). Planen prøvde å sette på det tomme feltet hver dag («Ikke noe teiner klart om bord») og fortsatte ellers som før, uten melding om at planen nå halvveis er borte.
- **Meldingene lyver (motoren).** «Fremme. Båten er rigget for line, så den ligger og venter i 4 t» står i loggen hver gang, mens båten jukser og fyller 157 kg (`arrive` sjekker `rigJig()`, men `fish()` jukser likevel). Det samme for garn og teiner.

### R2: Avgangstidspunkt

**Virker:** Avgang kl. 05:00 ble 05:00–05:04 hver dag i alle oppsett (bunkring ved kaia først: «Går når arbeidet på kaia er ferdig, kl. 05:03»). Neste dag starter kl. 05:00 selv om båten kom hjem kl. 00:19 (T). Døgndrift går straks (C: 03:01).

**Virker ikke:**

- **Avgangen eier dagen, men dagen begynner ved første forsøk (motoren).** `o.day.t0` settes når planen *prøver* å gå, ikke når den går. Ventet den på været fra 05:00 til 09:00 (Wsafe), er fire av dagens fjorten timer brukt, og turen regnes med ti: ståtida ble forhandlet ned til én time (se R6).
- **Inntil 8 timer sent går som vanlig, ellers hoppes dagen over** (`DRP.late`). Det er et rimelig valg, men det står ingen steder for spilleren.

### R3: Grenser for vær

**Virker:** Ved avgang: med grense «Forsiktig» (10 m/s) og 12 m/s i varselet ventet planen fra 05:00 («Venter på været: vinden blir 12 m/s, og grensen er 10 m/s»), sjekket hver time og gikk kl. 09:00 da vinden falt kl. 08:00 (Wsafe). Underveis: 15 m/s kl. 11:01 ga «Vinden økte til 15,0 m/s. Autonav tar båten til nærmeste kai, Finnsnes», fortøyd 11:42 (W) og 11:53 (Wsafe), planen ventet på været ved kaia og gikk ut igjen kl. 14:43/14:58 da det løyet, trakk redskapet som sto i sjøen (sto 9 t og 6 t) og leverte. Grensen er aldri over det båten tåler (`BOAT.risk`). Kuling i varselet tar redskapet med hjem i stedet for å sette det igjen (`gearCycle`, ikke utløst her).

**Virker ikke:**

- **Lukket spill (motoren):** lysøket er asynkront; i Wclosed ble båten liggende på sjøen i 37 timer (se R0).
- **Det er tre valg, ikke grenser (modellen).** Spilleren velger «Forsiktig/Vanlig/Tøff» (10/13/16 m/s og 1,5/2,5/3,5 m). Bestillingen ber om grenseverdier for vind *og* sjø; sjøen vises bare som konsekvens av vindvalget. Planen ser på sjøen ved plassene (`hsAt`) og vinden over turens timer; det er riktig, men ikke synlig.
- **Varselet er for kort (motoren).** `driftWxAhead` ser turens lengde framover ved avgang. Dagsturen i W gikk ut kl. 05:00 i 12 m/s fordi grensen var 13, og ble sendt i ly kl. 11:01 med halvparten av lina i sjøen. Det er riktig etter grensen, men planen regnet ikke med at den måtte avbryte, og trakk resten først kl. 15:14 (9 t ståtid).
- **Halen under lyet (motoren):** «Trekkingen stoppet. 1 stamp står igjen i sjøen» (Wsafe 11:01) ble tatt opp etter lyet; det virket. Men turen etter lyet i W inneholdt et «sett»-stopp på et felt uten egnet line («Ikke noe line klart om bord»), fordi `drTrip` ikke sjekker egnet line når den setter opp et felt uten redskap; `opsGearNeeds` slapp det gjennom fordi det *sto* line i sjøen på det andre feltet.

### R4: Plassene i kartplotteren, lenker på flere plasser

**Virker:** Felt med antall og ståtid, og juksplasser i rekkefølge, finnes i modellen (høyst 8 felt, 6 juksplasser). 18 garn fordelt 6 + 6 + 6 ble satt som tre lenker à 6 (`cycleSpec` deler lenka), trukket og satt på nytt feltvis i rekkefølge (B, D). 2 + 2 stamper på to felt og 15 + 15 teiner på to felt likeså. Et felt får redskapet det ber om, settet kjenner feltet sitt (`s.fid`).

**Virker ikke:**

- **Et felt er ett punkt, ikke ei lenke (modellen).** Spilleren velger et punkt; retningen og lengden på lenka bestemmer motoren (`startSet` fra punktet). Bestillingen ber om «hvordan man ønsker å fordele fiskeredskapet som garn og liner oppdelt i flere lenker på flere steder»; i dag er det antall per punkt, ikke lenker.
- **Kartvalget går utenom siden (siden).** «Velg i kartet …» lukker telefonen og sier «Trykk i kartet der redskapet skal stå», men åpner ikke kartplotteren: står spilleren i 3D (det vanlige i havn), må hun selv trykke på den lille plotteren først. Så ett trykk i kartet, så «Bruk plassen» i rutepanelet, så er hun tilbake på siden. Målt i kapittel 6. #95 handlet om nettopp dette; rettingen fra 25.10 gjorde at trykket velger plassen og ikke lager rute, men veien dit er fortsatt indirekte.
- **Ingen oversikt i kartet (siden).** «Vis plassene i kartet» tegner nålene, men man kan ikke flytte dem der, se lenkene, mottaket og hjemmet i sammenheng, eller legge til neste plass uten å gå tilbake til siden.

### R5: Juksplasser mens annet redskap står

**Virker:** Juksa får timene til ståtida er ute, og fangsten faller → neste plass (`wp.jc`, fra #57). I A1 ga 4 timer juksa 157 kg mens lina sto. Flere juksplasser i rekkefølge virker (C: plass 1 i 10,1 t, plass 2 i 10,1 t).

**Virker ikke:**

- **Juksetimene forsvinner i budsjettet (motoren).** Timene til juksa er det som er igjen av 14 timer etter overfartene (regnet rett linje), redskapsarbeidet (regnet med `DRP.setH`/`haulH`) og landing (1 t) og hjemturen. I B dag 2 og 3 fikk juksa 15 minutter («høyst 0,3 t») fordi skissen regnet 2,2 timer per garnlenke for trekking og setting; motoren brukte 32 minutter. Dagen endte kl. 14:55 med mannskapet lite slitne (slitenhet 34) og tre–fire timer dagslys ubrukt. I T ble det tur to på 6,5 timer for 15 minutter juksa.
- **Konstantene er 2–6 ganger feil (motoren):** målt garn: 6 garn trukket på 26 min og satt på 6 min (`DRP`: 90 og 36 min); line: 2 stamper satt på 9–11 min (`DRP`: 18), trukket på 41–52 min (`DRP`: 42); teiner: 15 satt på 14 min (`DRP`: 45). Skissen og motoren er to forskjellige klokker.
- «Jukser ved redskapet» når ingen juksplass er valgt, er ikke prøvd.

### R6: Ståtid per redskap

**Virker:** Garn med 24 t ståtid ble trukket etter 23–25 t tre dager på rad (B, D). Ståtida vises per felt, kan stilles i trinn (line 1 t, garn 6 t, teine 12 t) og advarer utenfor redskapets vindu.

**Virker ikke (motoren):**

- **Ståtida er et mål minus slakk, ikke en ståtid.** Line 6 t ble trukket etter 5 t (A1, A2, D: «sto 5 t»; slakk = 2 t). Teiner 48 t ble trukket etter 37 og 39 t (T; slakk 7,2 t). Garn 24 t traff fordi slakken (3,6 t) og dagsrytmen passet.
- **Ståtida forhandles bort når dagen er kort.** I Wsafe gikk båten ut kl. 09:00 etter værventing, og lina ble trukket etter **1 time** («Trekker line: 2 stamper, sto 1 t»), fordi turen med ti timers budsjett satte halingen rett etter 15 minutter juksa. Og etter lyet i W ble resten trukket etter 9 t. Spilleren valgte 6.

### R7: Levering til nærmeste eller valgt mottak

**Virker:** Mottaket velges når planen lages: av de tre nærmeste midten av plassene det båten når raskest langs leia (`o.M`), og båten leverer der hver gang (alle oppsett: Botnhamn). Fangst om bord leveres før noe annet når båten ligger ved mottaket. Lasten full → leverer og går ut igjen (C). Ferskheten (D3) telles, men påvirket ikke når det ble levert i noen kjøring (ingen tur var lang nok).

**Virker ikke:**

- **Ingen valg (modellen/siden).** Raden «Levering» på siden er en ren tekst uten valg («Nærmeste mottak: Botnhamn»). Bestillingen (R7) vil ha nærmeste *eller* valgt.
- **Nærmeste feltene, ikke nærmeste hjemmet eller nærmeste turen (modellen).** Fra Finnsnes blir det Botnhamn: 3,2–3,4 t fra feltet og 3,3 t hjem. Planen regner ikke på om det lønner seg å levere i dag, i morgen eller annenhver dag; den leverer hver tur, også 8 kg (T dag 4 kl. 19:58).
- **Leveringen stjeler dagen.** Et dagsoppsett blir «fiske 4 t, seile 7 t» uten at noen sier det.

### R8: Energi og skift

**Virker:** Mannskapets slitenhet (`fatigue`) styrer: dagen slutter når noen er over 72, og neste dag venter til alle er under 25 («Mannskapet hviler til de er uthvilt», B 17:10–20:01, slitenhet 59 → 9). Mannskapet hviler i køyene ved kai like fort som på rorbu. Døgndrift krever fire («Døgnet rundt 2 + 2 krever fire i mannskapet … Båten har 3», C) og styrhus med køyer; med fire går to vakter på seks timer (C: `wzwz` → `zwzw` hver sjette time), den som har fri sover, og slitenheten holdt seg under 33 i 48 timer. Hvem som har vakt, er målbart (`c.sleepW`), men ikke vist.

**Virker ikke:**

- **Din energi er ikke med (modellen/motoren).** Planen med deg om bord gikk ut kl. 05:00 med 28 % energi (N: 3 % kl. 03:00, pluss hvile i køya ved kai), du ble «sliten» 05:44, sovnet av utmattelse kl. 11:43 under halingen («Vegard tar roret»), sov gjennom leveringen og våknet 19:44 ved kaia i Botnhamn. Planen leste aldri `S.energy`. R8 sier «ingen fisker tom for energi»; i dag gjør du det, og mannskapet jobber videre.
- **Slitenhet ender aldri en dag i praksis.** I ingen kjøring nådde noen 72: dagene endte på 14 timer eller på budsjettet før det (høyeste målte: 59 i B dag 1, 47 i T). Grensene er anslag (`driftsplan.md`, «Svakt»), og de er ikke kalibrert mot en dag med line og juksa.
- **Døgndrift venter på den som sover (motoren).** Etter landing i C kl. 02:38: «Rune har fri, så båten venter» i 23 minutter til vaktskiftet kl. 03:00, fordi `driftCrewWhy` regner styrmannen som ikke om bord når han sover i køya.
- **Mannskapslivet velter planen uten varsel (motoren).** B dag 3: en krangel om sløyinga (varslet dag 1 kl. 12:00, «Løs det under Mannskap») endte med at Trond mønstret av kl. 13:00, og planen stoppet kl. 14:56 («må både en skipper og en styrmann være utnevnt»). Riktig regel, men en plan som skal gå i dagevis mens spillet er lukket, kan ikke stoppe på noe spilleren bare kan løse i spillet.
- **Pengene (ikke planens feil, men planen ser dem ikke).** Uten eieren om bord i åpen gruppe ble 70–80 % av fangsten inndratt hver gang (A2: 110 av 147 kg, B: 103–194 kg per dag, T: 175–320 kg). Planen advarer én gang på siden og fisker videre: C tjente 1 877 + 1 206 kr etter lott på to døgn og brukte 15 129 kr i diesel og lott; T tjente 7 408 kr på fire døgn og brukte 50 623 kr. Ingen oppsummering sier spilleren det.

### R9: Statistikk

**Virker:** `o.rep` lagrer hver landing (tid, mottak, kg, kr etter lott, timer, levert eller ikke) opptil 120, og siden viser de siste sju døgnene som søyler i kg med snitt og beste døgn.

**Virker ikke (siden/modellen):** Ingen inntekt, ingen arter, ingen turer, ingen utgifter, ingen inndragninger, ingen samlet sum, ikke per mottak. Søylene viser bare kg per dato. Salgene (`S.sales`) har artene, men planen bruker dem ikke. Det Jonas ba om («fangst, inntekt, arter og slikt nederst som oppdateres daglig») finnes ikke.

### R10: Flere fartøy

**Virker:** Hver båt har sin plan (`S.ops` i `VKEYS`), to planer gikk samtidig i to døgn uten å blande seg (D): line-båten med deg om bord, garnbåten med eget mannskap, begge på sjøen samtidig, hver med sine vakter, hvile og leveringer; ingen av dem havnet på land. Planen kan kopieres til en annen båt og får egne plass-id-er. Rederi viser «Nå» per båt (bekreftet i koden, `driftNow`; ikke målt på skjerm i D fordi siden ikke sto åpen).

**Virker ikke:** Ingenting særskilt for flåten ble funnet utover det som gjelder én båt: den andre båten stoppet av samme grunn som alene (lina i egnebua). Rederi viser ikke hva planen *skal* gjøre, bare hva den gjør nå. Begge båtene valgte samme mottak uten at det ble sagt.

## 4. Det spillerne sa

- **#57 (09.10.2026, snekke, Windows):** ville at mannskapet leverer når lasten er full og går ut igjen, ville vite om de legger seg eller går ut igjen etter første levering, ville ha flere juksepunkter i rekkefølge, og mente de skulle stå ved mottaket og vente om det var stengt. Rettet i det små (punktene og forklaringen i planmakeren, cccc32a, 8cbaf4d). Det han egentlig spurte om, «hva kommer mannskapet til å gjøre», er fortsatt ubesvart: tidslinja viser én tur, og det som skjer etter landingen (en tur til, eller hjem) avgjøres av motoren der og da.
- **#95 (24.10.2026, ny hurtigsjark, Android):** «Velg i kartet» laget en rute i stedet for å velge plassen; «dette må løses på en bedre og mer intuitiv måte som er enklere å forstå». Rettet 25.10 (PR #23): trykket velger plassen, «Bruk plassen» ligger øverst. Målingen i kapittel 6 viser at veien fortsatt går gjennom tre skjermer og at plotteren må åpnes av spilleren selv.
- **Spilltestene** (`docs/playtest/rapport-1.md` og `-2.md`): driftsplanen ble «aldri oppdaget» i spilltest 1, og i spilltest 2 slått på etter 13,5 timer, rett etter første mann ble ansatt; «Reglene står i lange avsnitt i driftsplanen og markedet, akkurat når jeg skulle gjøre noe annet».

## 5. Det backloggen alt hadde

Fra `docs/BACKLOG.md` som gjelder planen, bekreftet eller utvidet her:

- «Planleggeren viser ikke bølger langs ruta» (10.2): planen ser på sjøen ved plassene og vinden på turen, men viser ingen av delene.
- «Mannskapet er ikke spilltestet» (10.2): slitenheten endte aldri en dag; grensene er ikke kalibrert.
- «Fiske inne i havna i kuling har ingen egen regel» (10.2): ikke prøvd her.
- «Grensene for slitenhet (72 og 25) og dagens lengde (14 t) er anslag», «timene for setting og haling per enhet er anslag», «tidslinja regner med marsjfart og høyeste antall juksetimer» (`driftsplan.md`, Svakt): alle tre bekreftet som årsaker til funn (R5, R6, R1).
- «Planleggerens landsjekk på 200 m-celler er fortsatt svak» (10.6, routetest): det er grunnen til «Grunt vann forut» på planens lei i testbygget; i appen med hele kysten er den bedre, men planen har ingen vei uten søk.
- SwiftShader-laggen (10.6, «tick spiller 4–5 minutter på ett tikk»): ikke sett her, fordi løkka ble holdt.
- Oppdragsfristene (strøket 26.10): ikke berørt.

## 6. Siden og kartvinduet (oppsett F)

Målt med ekte trykk (CDP-berøring, `side.py`) i 800×1280, 1280×800 og 384×853 uten 3D, båten i havn i Finnsnes med to i mannskapet og fire stamper line om bord. Bildene ligger i `revisjon/side-*.jpg`.

**Virker:**

- Veien dit: telefonknappen → appen «Driftsplan» (åttende ikon; på nettbrettet ligger den under kanten av telefonskjermen og må rulles fram), eller dokkknappen «Mannskap» → «Driftsplan · Åpne». På telefonen åpner appen i skuffen. «Lag driftsplan» gir en ferdig utfylt plan: hjem Finnsnes, juksa, én juksplass fra egen fangstprikk, ut kl. 05:00, «Vanlig», dagdrift.
- Radene åpner og lukker seg der de trykkes. Fiske → Line, Rytme og Vær virker med fingeren, knappene er store nok, og «Start planen» lager planen (finner mottak og leier) og slår den på når sjekken går gjennom; «Ikke klar ennå» med grunnen når den ikke gjør det («Legg ut minst ett felt for line.»).
- «Nå», «Neste tur» som tidslinje og sju søyler vises (bildene `side-telefon-neste-tur.jpg`, `side-nettbrett-staaende-ny-plan.jpg`).

**Virker ikke:**

- **«Velg i kartet …» avbryter seg selv (siden).** Rett etter trykket er `DRIFTCTX` null, målt likt på nettbrett liggende, nettbrett stående og telefon. Dokka tegner siden på nytt etter hvert trykk (`10c-dock.js`: `draw(true); render()` etter `PHONE.dact`), og `DRIFTUI.page()` nullstiller valget når siden tegnes («a place being picked … end when the plan's page is opened again»). Spilleren får beskjeden «Trykk i kartet der redskapet skal stå, og så «Bruk plassen»», må selv åpne plotteren (den åpnes ikke for henne), trykker, og får en rute med «Etappe WP0→WP1 krysser land» og «Kast loss» i stedet for «Plass til driftsplanen» og «Bruk plassen» (`side-nettbrett-liggende-velg-i-kartet-gir-rute.jpg`). Det er feilen fra #95, uendret etter rettingen 25.10, fordi `driftuitest.py` kaller `PHONE.dact` direkte og aldri går gjennom dokkas trykk. Kalles `PHONE.dact` direkte, står valget, og trykket i kartet gir «Bruk plassen»; med fingeren gjør det ikke det. **Med fingeren kan ingen plan med line-, garn- eller teinefelt lages i dag.** Juksplasser går, fordi de kan tas fra forslagene («Fangstplass», «Der båten er nå»).
- **Plotteren må spilleren åpne selv (siden).** «Velg i kartet …» lukker skuffen og lar spilleren stå i 3D. Hun må vite at den lille plotteren åpner den store.
- **Tre skjermer for én plass (siden).** Siden → kartet → rutepanelet → siden. Opptelling for S1-planen (to linefelt à 2 stamper med 6 t ståtid, én juksplass): 2 trykk til appen, 1 for ny plan, 2 for line, 7 per felt (raden, «+ Felt», «Velg i kartet», åpne plotteren, trykk i kartet, «Bruk plassen», to for ståtiden 8 → 6), 2 for juksplassen, 1 for Start: 24 trykk fordelt på tre skjermer. I dag stopper det ved trykk 9.
- **Radene rekker ikke skjermen (siden).** På telefonen ligger Plasser, Rytme og Vær under kanten; en åpen Plasser-rad med to felt og en juksplass er to skjermhøyder (`side-nettbrett-staaende-plasser.jpg`).
- **Tidslinja** sier selv at tidene er anslag, men den viser ikke det motoren gjør (kapittel 7), ikke dag 2, og ingenting for døgndrift.
- **Statistikken** er sju søyler i kg (R9).
- **«Nå»-linja** er én setning. Ventingen («Neste tur går kl. 05:00 i morgen», «Venter på været …», «Finner veien …») og stoppene vises, men ikke hvor lenge, ikke hva som skjer med redskapet i sjøen, og ikke hvorfor dagen ble som den ble.
- **Telefonen (384 px):** trykket i kartet på det utregnede punktet ga ingen plass i to av to forsøk, også når valget var satt programmatisk; ikke undersøkt videre, men det er den skjermen #57 og #95 spilte på.

## 7. Tallene samlet

**Dagene slik de gikk** (klokkeslett i spillets klokke; «→» er seiling):

| Oppsett | Dag | Ut | Redskap satt | Juksa | Trukket | Levert | Hjem | Hvilt til |
|---|---|---|---|---|---|---|---|---|
| A1 | 1 | 05:00 | 05:21, 05:43 | 05:59–09:59 (157 kg) | 10:11–12:05 (49 + 12 kg, sto 5 t) | Botnhamn 15:18–15:27, 216 kg, 6 223 kr | 17:34 → 20:51 | – |
| A1 | 2–3 | – | – | – | – | – | – | stopp 07:00 dag 2: «lina er ikke egnet» |
| A2 | 1 | 05:00 | 05:21, 05:41 | 05:55–09:55 (88 kg) | 10:07–11:43 (45 + 14 kg, sto 5 t) | 14:58–15:07, 147 kg (110 inndratt), 882 kr | – | stopp 17:14 ved Botnhamn; lina klar 19:18 |
| B | 1 | 05:00 | 05:21, 05:35, 05:56 | 06:21–10:09 (153 kg) | – | 13:35–13:44, 153 kg (103 inndratt), 1 102 kr | 13:51 → 17:09 | 20:01 |
| B | 2 | 05:04 | – | 07:43–07:58 (14 kg) | 05:25–07:25 (90 + 51 + 66 kg, sto 24–25 t) | 11:22–11:31, 221 kg (186 inndratt), 1 208 kr | 11:38 → 14:55 | 15:01 |
| B | 3 | 05:04 | – | 07:44–07:59 | 05:25–07:25 (102 + 55 + 61 kg, sto 23 t) | 11:22–11:31, 222 kg (194 inndratt), 1 130 kr | 11:38 → 14:55 | stopp 14:56: styrmannen mønstret av |
| C | 1 | 03:01 | – | 03:21–13:27 og 13:33–23:39 (887 kg) | – | 02:15–02:29, 887 kg, 5 441 kr (1 877 etter lott) | går ikke hjem | vaktene |
| C | 2 | 03:01 | – | 06:04–14:40 og 14:46–23:34 (586 kg) | – | 02:10–02:21, 586 kg, 1 206 kr etter lott | – | – |
| T | 1 | 05:00 | 05:20, 05:42 (15 + 15 teiner) | 06:07–11:37 (249 kg) | – | 14:32–14:41, 249 kg (175 inndratt), 657 kr | tur to 14:50 → 18:03, juksa 15 min, 12 kg, levert 21:20, hjem 00:19 | 02:01 |
| T | 2 | 05:06 | – | 05:37–11:55 (349 kg) | 18:47 (15 teiner, sto 37 t, 2 kg krabbe), satt igjen 19:03 | 14:50–15:01, 349 kg (264 inndratt) | tur to 15:10 → 22:19 (16 kg), hjem 01:18 | 03:01 |
| W | 1 | 05:00 (12 m/s) | 05:21, 05:42 | 05:57–09:57 (75 kg) | 10:11–10:52 (47 kg); ly 11:01 → Finnsnes 11:42; ut 14:43; 15:14–15:54 (16 kg, sto 9 t) | 19:47–19:56, 144 kg, 764 kr | 20:03 → 23:20 | stopp dag 2 |
| Wsafe | 1 | 09:00 (ventet fra 05:00) | 09:21, 09:41 | 09:55–10:10 (13 kg) | 10:23 (sto 1 t); ly 11:01 med 1 stamp igjen; ut 14:58; 15:19–16:30 (sto 6 t) | 20:17–20:26, 48 kg, 199 kr | 20:33 → 23:50 | stopp dag 2 |
| Wclosed | 1 | 09:00 | 09:21, 09:41 | 09:55–10:10 | 10:23 (sto 1 t); ly 11:01 → ligger stille på sjøen resten av 37 timer | – | – | – |

**Ståtid valgt mot målt:** line 6 t → 5 t (A1, A2, D), 1 t (Wsafe), 9 t (W etter ly); garn 24 t → 23–25 t (B, D); teiner 48 t → 37 og 39 t (T).

**«Neste tur» på siden mot det som skjedde:**

| Oppsett | Siden sa | Det ble |
|---|---|---|
| A1 dag 1 | setter 05:17 og 05:39, jukser høyst 4,0 t fra 06:05, trekker 10:16 og 11:02, leverer 14:46, hjem og hvile 18:59 | satt 05:21 og 05:43, jukset 05:59–09:59, trukket 10:11 og 11:14, levert 15:18, to mislykte forsøk på en tur til, hjem 20:51 |
| B dag 2 | trekker og setter på nytt 05:17, 07:27 og 09:44, jukser høyst 0,3 t fra 12:06, leverer 15:43, hjem 19:56 | trukket og satt 05:25, 06:05 og 06:52, jukset 07:43–07:58, levert 11:22, hjem 14:55 |
| C | ingen tidslinje (døgndrift) | – |
| T dag 1 | setter 05:14 og 06:02, jukser høyst 5,5 t, leverer 15:17, hjem 19:00 | satt 05:20 og 05:42, jukset 06:07–11:37, levert 14:41, *tur to* 14:50–21:20, hjem 00:19 |

**Redskapsarbeid, planens konstanter mot motoren:** garn, 6 stk: trekking 26 min (planen regner 90), setting 6 min (36); line, 2 stamper: setting 9–11 min (18), trekking 41–52 min (42); teiner, 15 stk: setting 14 min (45), trekking 16 min (90).

**Energi og slitenhet:** din energi faller 4,2 %/t på sjøen og stiger 12,5 %/t i køya ved kai; mannskapets slitenhet steg 4–6 per time med line og juksa (A1: 0 → 33 på ti timer), 3–5 på garn (B: 0 → 59 på tolv timer), og falt 8–25 per time ved kai. Ingen dag ble avsluttet av slitenhet.

**Lukket spill:** 9 døgn på 2,4 s (deg om bord) og 2,2 s (mannskapet alene); 0 leveringer i begge, fordi båten sto stille på sjøen fra dag 1 kl. 12:13. 30 timer lukket midt i tre åpne døgn ga samme dag som åpent (228 mot 230 kg), fordi ingenting krevde søk de 30 timene.

**Penger** (inntekt etter lott mot utgifter til diesel, lott, egning og agn): A1 3 875 mot 5 566 kr på én dag; C 3 083 mot 15 129 kr på to døgn; T 2 639 mot 50 623 kr på fire døgn. Uten eieren om bord i åpen gruppe ble 70–80 % av fangsten inndratt.

## 8. Det som ikke ble målt, og det som er usikkert

- Hele kysten var ikke bygd (`tools/map/out/game/` er tom i dette miljøet), så «Grunt vann forut» på leia er sett med 200 m-celler. I appen er cellene 100 m. Om leia er trygg der, er ikke sjekket; det at planen *trenger* et søk når den ikke er det, gjelder uansett.
- Stikkprøver sør, midt og nord er ikke gjort i fase 0; alt er spilt fra Finnsnes. Mottaksavstanden er antakelig annerledes de fleste andre steder (Husøy har mottak ved kaia), så R7-funnet gjelder først og fremst steder uten mottak, som startstedet.
- Flerdøgnsturer («multi») og anker som hjem er ikke spilt på nytt; `drifttest` 6 dekker det grunnleggende.
- Ferskheten (D3) utløste aldri en levering, fordi ingen tur varte over et døgn.
- Været var spillets egne (5–10 m/s de tre døgnene i mars 2028), pluss det tvungne i W. Ingen kjøring traff en ekte kuling; tap av redskap i T skjedde i 7 m/s ved et lite tilfeldig trekk.
- Siden ble målt med ekte trykk, men bare på én båt i havn; stopp- og ventetilstander er vist ved å sette dem.
- Push ved stopp (`onOpsStop`) er ikke prøvd.

## Status

- 26.10.2026: revisjonen gjort og skrevet. Jonas leser. Designet står i `02-design.md`.
