# Fiskerimodellen, feltene, Fiskeguiden og juksa

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5. Systemer i spillet

## 5.2 Kart, fjordlinje og fangstfelt

- **Fjordlinja** (`FJORD`, `insideFjord(p)`) går fra Andøya via Skrolsvik, Gryllefjord, Hekkingen og Sommarøy til Kvaløya. Punktene er hentet fra Fiskeridirektoratets kart, kalibrert mot tre flyplasser.
- Innenfor fjordlinja er det forbudt for båter på 15 m eller mer å fiske, snurrevad er forbudt, line har høyst 5 000 kroker og torskegarn høyst 80 garn. Linja tegnes stiplet fiolett i kartplotteren.
- Den eneste NPC-båten på 15 m eller mer (20,9 m, fra Mefjordvær) har bare fangstfelt utenfor linja.
- **Fangstfelt** (`FIELDS`, `fieldCode(p)`): 05-25, 05-29, 05-30, 05-31, 05-40, 05-41 og 05-42, tilordnet med nærmeste punkt. Koden vises på sluttseddelen.
- **Kjente felt** (`GROUNDS`): Havet nord for Husøy, Utenfor Mefjorden, Vest av Gryllefjord, Malangsgapet, Gisundet og Solbergfjorden.

## 5.3 Fiskerimodellen

- **Arter** (`SPECIES`): torsk (kysttorsk og skrei), hyse, sei, lyr, lange, brosme, uer, kveite og blåkveite (fra 07.10.2026, se «Blåkveite» under).
  - Hver art har månedlig tilgjengelighet (`av`), dybde (`dep`), eksponering (`prod`) og markedspris (`pm`).
  - Den har også ukentlig prisvariasjon (`sig`), størrelsesfordeling (`size`, lognormal), minstemål (`minKg`) og størrelsesklasser med minstepris (`cls`).
  - Fra sløyd uten hode til rund vekt regnes det med `uh`. Lever og rogn har egne priser.
- **Kalibreringsfaktor per art** (`k`):

| Torsk | Hyse | Sei | Lyr | Lange | Brosme | Uer | Kveite | Blåkveite |
|---|---|---|---|---|---|---|---|---|
| 0,376 | 0,297 | 0,9 | 0,136 | 0,342 | 0,306 | 0,337 | 0,56 | 0,6 |

  Kalibrert på nytt 02.11.2026 etter fasit-testen (5.3e), da sesongen begynte å komme fra sedlene; kveita mot kveitefisket om høsten. Før det (B3):  0,345 / 0,245 / 0,49 / 0,145 / 0,215 / 0,22 / 0,44 / 0,26 / 0,6.

  Kalibrert på nytt i B3 (02.11.2026, se 5.3d), da grunnlinja tok over for det håndlagde utgangspunktet rundt Senja. I B2 (01.11.2026, 5.3c) var det 0,405 / 0,3 / 0,65 / 0,2 / 0,3 / 0,32 / 0,65 / 0,35 / 0,6, og før det 0,37 / 0,3 / 0,6 / 0,3 / 0,3 / 0,35 / 0,5 / 0,35 / 0,6.

- **Blåkveite** (07.10.2026, tilbakemelding #10; researchen i `docs/blakveite.md`, planen i `docs/plan-blakveite.md`):
  - **Hvor:** eggakanten. `eggaArea` (`03-simulation.js`, via feltet `area:'egga'`) gir null grunnere enn 280–400 m og dypere enn 1000–1150 m, null sør for 62° N, 0,15 fra Storegga til Helgeland, full styrke fra Lofoten (67,6–68,8° N) og nordover, × 0,4 i Vest-Finnmark og × 0,6 øst for 26,5° Ø (sluttseddelene 2025 per område). Vestfjorden × 0,15, de skjermede fjordbassengene i Troms × 0,12 (usikkert). Om vinteren (nov–feb) tynnes det sør for 70° N (inntil −45 %) og fylles nord for (+30 %), fordi gytefisken samles på kanten fra 70 til 75° N.
  - **Dypet** kommer fra kjernelaget `deep` (`tools/map/deep.py`, se 4.6): kystflisene slutter 40–65 km ut, og modellen utenfor dem ble aldri dypere enn rundt 260 m.
  - **Eget bestandslag** `S.bstk` (feltet `stk`), som vokser tilbake saktere enn krabbens (0,1 % av underskuddet i timen).
  - **Frøene:** feltet `late` legger arten sist i `ALLSP`, etter krabben, så ingen andre arters hotspots, dagsstøy og ukepriser flytter seg.
  - **Størrelse** `size:[2.0, 0.4]` (Råfisklaget 2026: 4 % under 1 kg, 46 % 1–2 kg, 50 % over 2 kg), minstemål 45 cm = 0,9 kg. **Pris:** minstepris 46/47/48 kr under 1,2, 1,2–2,4 og over 2,4 kg (uke 27 2026), snitt 61 kr. `uh` 1,3 er et anslag.
  - **Redskap:** juksa tar nesten ingen (`jig:0.03`, arten finnes ikke i juksastatistikken). Bankline 5,0, hyseline 2,5 og garn 3,2 (`SELQ`); line er 49 % og garn 40 % av kystfangsten i 2026. Kalibrert grovt (07.10.2026): med 4,0 ga ti stamper bankline i 20 timer på kanten ved Andøya i juni 300–320 kg (rundt 100 kg per 1000 kroker), og med 5,0 blir det rundt 125 kg, så 30 stamper om dagen gir en båt under 14 m rundt 7 t den første uka (målet i planen er 7,5 t). Spermhvalen tok 20–28 % i to av tre trekk ved Andøya. En hel uke er ikke kjørt, og om halvparten av båtene fisker opp maksimalkvoten, er ikke målt.
  - **Bestanden** på kanten tas fra `S.bstk` (også fra line og garn, `soakHour`): ett sett på ti stamper tar rundt 30 % av ruta, så man må flytte seg langs kanten. Den vokser tilbake med 0,1 % av underskuddet i timen. Makrell 1,3 og sei 1,1 som agn.
  - **Dypt vann:** endetauene går ned og opp før første enhet (`endLines` i `10-gear.js`): 60 m i minuttet ned, 40 med haler og 25 for hånd opp, begge ender. På 700 m blir det rundt 23 min setting og 35 min før trekket kommer i gang.
  - **Tjuver på lina** (`thiefOf`): spermhval ved Andøya (68,9–70° N, 14,6–17,2° Ø) tar 20–50 % av lina i en fjerdedel av trekkene (HI, rapport 2024-10), og håkjerring tar 5–15 % i 8 % av trekkene på over 300 m.
  - **Røkting:** redskap på over 300 m får påminnelse etter to døgn (høstingsforskriften § 18).
  - **Mottak og oppdrag** (07.10.2026, Jonas: «Alle mottak skal kunne ta i mot blåkveite»): salget har aldri skilt på mottak, så alle kjøper den. Alle mottak nord for 62° N får `mk.sp.blakveite` (`06b-coastports.js`, med kilo og måneder fra registeret der det har dem), og alle store kunder der får arten lagt til (`custSp`, `bkPlant` i `03-simulation.js`). Bestillingene kommer bare i direktefisket fram til stoppen varsles, for en båt under 28 m på blad B som eier line eller garn (`bkOrderable`, via `spCatchable`): 300–3000 kg, fire dager. `turRoom` er resten av maksimalkvoten, så Turer kan også gi bestillinger og sesongflytting for blåkveite.
  - **Kystposten** (`newsForDay` i `06-services.js`, forsiden): åpningen, varselet om stoppen tre dager før, stoppdagen, kvoterådet 26. juni og totalkvoten 17. oktober, sammen med torskens.

- **Skreipulsen** (`skrei`): 0,6 / 2,0 / 2,5 / 0,8 for januar–april, 0,1 i desember. Den virker bare på eksponerte banker på 40–250 m og på de tre ytre feltene (`skreiSpot`). Fra B2 (5.3c) er dette pulsen på Senjas breddegrad. Den går som en front langs kysten, og mengden per sted kommer fra sluttsedlene.
- **`density(sp, p, H)`** er den ene kilden for fisk i spillet: fangst, ekkolodd, varmekart, garn, line, jukse-spillet og pubrykter. 30 × `density` × innsats er kg i timen (én person med håndjuksa har innsats 2). Den er delt i `denPlace(p)` (det alle arter deler: land, dybde, eksponering, helling og avstand til feltene), `denTime(H)` (sesongtallene, lagret for én time) og `denSp()` (artens egen sum). Delingen ga nøyaktig de samme tallene (kontrollsum over rutenett rundt alle feltene).
- **Fisken trekker** (`hotspot`, `HOT`): Gode flekker på et mønster på 3,5 km. To felt overlapper hele tiden, hvert glir sin vei med 0,7–1,7 km i døgnet og toner inn og ut over 240 timer. Fra B2 styrer artens vandring der og da retningen (`migDir`, se 5.3c «Fisken beveger seg»). Før hoppet hele mønsteret hver 120. time. Snittet er det samme som før (0,742 mot 0,737).
- **Stimer** (`school`, `SCHOOL`): et finere mønster (400 m) som svømmer 0,5–1 km i timen. Fra B2 svømmer stimene dit arten vandrer på stedet og i sesongen, i felt på 6 timer som toner over i hverandre (se 5.3c). Før hadde hver art én fast retning for hele kysten. Det gir ±15 % og er 1 i snitt, så fangsten over en dag er den samme, men bittet på ett sted kommer og går i løpet av en halvtime. Sonaren viser retningen (`schoolDrift`).
- **Bestanden** (`STK`, `S.stock`, ruter på 2 km). Fra B3 (5.3d) er dette spillernes avvik, og bestanden på et sted er grunnlinja (hele flåtens trykk) × avviket: Den leses mellom de fire nærmeste rutene (`gridBilinear`), og fangsten trekkes fra de samme fire med samme vekter (`stockW`). Nedtrekket der du fisker er kg/K·Σw², altså mykere enn før, men det samlede uttaket er det samme. Gjenveksten har et minste steg og runder til 1e-4, så en rute kommer helt tilbake til 1: en rute på 0,5 er full igjen etter rundt 42 dager. Før stoppet den på 0,876, og krabbe på 0,667. Krabbe (`S.cstk`) er fortsatt én verdi per rute, som før, fordi teinekalibreringen hviler på det og varmekartet ikke viser krabbe.
- **Fangst:** `density() × luck(sp) × targetF(sp) × innsats × værstraff`, deretter trekkes hver fisk for seg med egen vekt.
  - Fisk under minstemålet slippes.
  - Kveite i fredningstiden eller over 100 kg slippes.
  - Uer utenfor juni–august er bare bifangst (×0,15).
- **Kalibrering** (én person med håndjuksa, 8 timer, etter doblingen 04.10.2026):
  - Skreidag på godt felt: full last på skiffen (350 kg) på rundt halve dagen.
  - Juli: rundt 270 kg (før doblingen 140).
  - Seistim i mai: full last.
  - `tests/simday.py` kjører også dekksarbeidet, ellers stopper fisket når bløggekaret er fullt (60 kg). Dekket holder følge: juli ga 269 kg mot 140 før. Den skriver ut innsatsstigen 2 : 4 : 8 for håndjuksa, én og to maskiner (og 0,35 for den gamle stanga, som ikke brukes lenger).
  - Mål for åpen gruppe i 2024 (Lofoten, Vesterålen, Senja og Tromsø): 5,3 t torsk, 3,0 t sei og 1,2 t hyse per båt og år.
  - **Etter varmekartet (01.10.2026):** `simday.py` ga 350 / 322 / 98 / 245 / 110 / 350 kg før og 350 / 273 / 129 / 229 / 134 / 350 kg etter (Husøy mars, Gryllefjord mars, Husøy juli, Malangsgapet mai, stang, to maskiner). Hver kjøring har ±10–15 % tilfeldighet, og de enkelte tallene flytter seg fordi hotspotene ligger annerledes. Det mykere nedtrekket gir litt mer fisk over en dag på samme sted. `calib.py`, `kvtest.py` og `geartest.py` holder seg innenfor sine intervaller.
- **Kveitefiske** (`S.target = 'kveite'`, krever kveiteutstyr):
  - Kveite får faktor ×9, og best rundt strømstille: ×(1,4 − 0,8·strømstyrke). Andre arter får ×0,2.
  - Juksamaskiner hjelper ikke.
  - Resultat: rundt én kveite per dag i september og 1,5 i oktober, 2 000–3 000 kr per dag.

## 5.3b Datagrunnlaget: fisket langs kysten slik det virkelig var (B1 i `docs/planer/bestand-og-flaate.md`, 01.11.2026)

`tools/npc/fiske.py` → `src/data/fiske.json`, releasen `fiske-N` (`.github/workflows/fiske.yml`, den 3. hver måned og når skriptet endres). Spillet leser fila fra B2 (5.3c); B3 (flåtetrykket) bygger videre på den, og L2/N1 og H1 bruker kommunetabellen.

- **Kildene** (NLOD, «Lisens for bruk av Fiskeridirektoratets data»):
  - Sluttsedlene, «fangstdata (seddel)» (`register.fiskeridir.no/uttrekk/fangstdata_<år>.csv.zip`), de to siste hele årene (nå 2024 og 2025), norske fartøy (`Fartøynasjonalitet` NOR), alle landingsnasjoner. Rundt 975 000 seddellinjer i året. Kolonnene som brukes: `Art - gruppe`/`Art - FDIR`, `Rundvekt`, `Hovedområde (kode)`, `Lokasjon (kode)` (lokasjonen står på hver seddellinje, også i `Fangstfelt (kode)` = kyst/hav + hovedområde + lokasjon), `Landingsmåned (kode)`, `Redskap (kode)`, `Lengdegruppe (kode)` (de fem gruppene under 11, 11–14,99, 15–20,99, 21–27,99, 28 m og over, etter `Største lengde`), `Fartøy ID`, `Landingsdato`, `Mottaksstasjon`, `Nord/sør for 62 grader nord`, `Sone`, `Fartøykommune (kode)` og navnet. `Kyst/hav (kode)` (0 hav, 8 kyst) brukes ikke; lengden og lokasjonen skiller.
  - Fartøyregisteret, «uttrekk fra fartøyregisteret» (`register.fiskeridir.no/fartoyreg/last/frtyweb.tar`, nytt hver natt, bare gjeldende fartøy). Bare `fartoy.csv` leses, og bare `fartoy_id`, `kommunenummer` og `stoerste_lengde`. **Registeret har ikke redskap**, så hver båts redskap er det den landet mest kilo med i sluttsedlene (koblet på `Fartøy ID`), som planen åpnet for. Tillatelsene (`tillatelser.csv`) kunne gitt gruppa i lukket gruppe, men ikke redskapet; de er ikke brukt.
  - **Ingen navn ut:** fartøynavn, registreringsmerker, kallesignaler, fiskere, eiere og kjøpere står i filene, men leses aldri inn i resultatet; eierfilene (`juridisk_enhet.csv`, `fartoy_eier.csv`) åpnes ikke. Kommunenavnene (`kn`) er med. Testen ser etter registreringsmerker i fila.
- **Artene:** spillets ti (torsk av begge bestander, hyse, sei, lyr, lange, brosme, vanlig uer, kveite, blåkveite, kongekrabbe), taskekrabbe (spillets `krabbe`, kom med fordi den er spillets art), og for havflåten NVG-sild (`Norsk vårgytende sild`, ikke Nordsjøsild), makrell og snøkrabbe (valg 4 = A). Reke venter.
- **Redskapet** etter `Redskap (kode)`: garn (20–29), line (30–32, 35: autoline, andre liner, flyteline), jukse (33 juksa/pilk, 34 dorg/harp/snik), snurrevad (61), teine (41–44: teiner, havteiner, ruser), trål (50–58), not (10–14), annet. Krokredskap deles altså i line og jukse, som i spillet. Torsk under 11 m: garn 21 500 t, jukse 5 600, line 5 300, snurrevad 1 100 t i året.
- **Hvor:** båtene under 28 m med en lokasjon fra `rules.json` legges per lokasjon (`k`, 239 av de 578 lokasjonene har data); resten per hovedområde (`h`): 28 m og over (havflåten, som planen sier), kystlandinger uten lokasjon i `rules.json` (lokasjon 00 «uspesifisert», Barentshavet 20-xx, Nordsjøen 4x utenfor lokasjonene) og landinger uten lengde (fritids-, skole- og forskningsfartøy). Hovedområdene utenfor `rules.json` står i `meta.homOut` (66, 68, 80, 81). Andelen av kystflåtens kilo med gyldig lokasjon (2025): torsk 99,8 % under 21 m og 93 % for 21–27,99 m, hyse 98–99,8 % under 21 m og 75 % for 21–27,99 m, sei 87–98 %.
- **De 339 lokasjonene uten data** er åpent hav der bare havflåten fisker (Grønland, Danmarkstredet, Norskehavet, Svalbard-sonene, Murmanskkysten); alle 18 i Vestfjorden og 30 av 36 på Røstbanken–Malangsgrunnen har landinger fra båtene under 28 m.
- **En landing** er én båt ved ett mottak én dag (`Fartøy ID`, `Landingsdato`, `Mottaksstasjon`), talt én gang per celle; uten fartøy-ID (fritidsfartøy) talles seddelen. Måned 13 («fanget i året, landet etter») legges i desember.
- **Formatet** (kommentaren øverst i `fiske.py`): `sp[art].k` og `.h` er lister `[område, [12 måneder]]`, og hver måned en flat liste med tre tall per celle: redskap × 6 + lengdegruppe, kg, landinger, summert over årene (del med `meta.ny`). Kg har tre gjeldende sifre og skrives `12e4` for 120 000 (gyldig JSON). Celler under **5 000 kg over de to årene** (`meta.small`, 2,5 t i året) slås sammen per område og måned til én celle med redskap 8 (blandet) og lengdegruppa med mest kilo: stedet, måneden og summene står, bare delingen på redskap og lengde forsvinner for 1,4 % av kiloene. `kom[kommunenummer]` er `[lengdegruppe, redskap, registrert, aktiv, reserve]` (redskap 8 = ingen landinger, aktiv = landinger siste år, reserve = båter med landinger siste år som ikke står i registeret nå, talt etter seddelens kommune).
- **Målt 01.11.2026:**
  - **Størrelsen:** 366 kB (25 234 celler, 239 lokasjoner, 43 hovedområder, 192 kommuner). Uten sammenslåingen og med vanlige tall var det 855 kB; den tette formen alene ga 447 kB.
  - **Summene mot Fiskeridirektoratets egne tall** (`tests/unit/fiske.test.mjs`, kilde: Fiskeridirektoratets «Vekestatistikk for utvalde artar», veke 53 2025, «Sum kvotebelastning 2025» og «Fangst t.o.m. uke 53 2024», nord for 62° N, minus avsetningene til rekreasjons- og ungdomsfiske, som er et fast tall og ikke sluttsedler):

    | Art | 2024 sluttsedlene | 2024 Fdir | 2025 sluttsedlene | 2025 Fdir |
    |---|---|---|---|---|
    | Torsk nord for 62° N | 201 383 t | 200 447 t | 165 608 t | 165 147 t |
    | Hyse nord for 62° N | 71 197 | 71 135 | 66 206 | 66 650 |
    | Sei nord for 62° N | 169 623 | 169 100 | 140 180 | 139 826 |
    | Blåkveite (NØ-arktisk) | 10 452 | 10 452 | 9 474 | 9 474 |
    | Lange nord for 62° N | 10 143 | 10 144 | 9 257 | 9 261 |
    | Brosme nord for 62° N | 9 305 | 9 305 | 9 722 | 9 723 |

    Torsk, hyse og sei innen 0,7 %, resten på tonnet. Blåkveita teller bare Norges sone, Svalbard, Russlands sone og Smutthullet (ukestatistikken tar ikke med britisk sone og Jan Mayen; med dem blir det 6–8 % mer). **Alle 14 artene mot Fiskeridirektoratets offisielle statistikk** (tabell F.06.002 «Fangst av norske fartøy etter landingsnasjon, art og redskap (2000–2025)», statistikkbanken.fiskeridir.no, PxWeb, oppdatert 18.06.2026; alle landingsnasjoner, redskap og områder): innen 0,8 % begge år, de fleste innen 0,1 %. Største avvik: brosme 2024 −0,8 % (13 162 mot 13 265 t), kongekrabbe 2024 +0,5 %, blåkveite 2025 +0,3 %, lange 2024 −0,3 %; sild 259 031 og 258 730 t og makrell 2025 156 234 t er like på tonnet. Sluttsedlene oppdateres etter at tabellen ble laget, derfor ±1 % i testen (`FDIR_TOT`). Statistikkbanken og `data.ssb.no` ble åpnet i miljøets nettverksinnstillinger samme dag.
  - **Dekningen** (andelen lokasjoner med landinger per måned, jan–des, begge år sammen), av de 239 lokasjonene kystflåten bruker: torsk 60 58 67 61 67 64 59 67 67 64 63 59 %, sei 57 55 63 57 64 63 59 63 66 64 61 58 %, hyse 59 58 67 59 64 62 54 62 63 62 58 56 %. Av alle 578: torsk 24–28 %, sei 23–27 %, hyse 22–28 % (`meta.cover`).
  - **Båtene:** 4 997 fartøy i registeret (Fiskeridirektoratet: 4 989 ved utgangen av 2025, «Offisiell statistikk om fiskefartøy»), 4 383 av dem (88 %, Fiskeridirektoratet: 89 %) med landinger i 2025, og 208 båter med landinger i 2025 som ikke står i registeret nå.
  - **Fornuftsprøven:** torsk i Vestfjorden (00) 163 / 1 041 / 5 999 / 1 445 t i januar–april og under 60 t i måneden resten av året (skreien); Øst-Finnmark (03) har toppen i mars, men fisk hele året; Bergen (08) under 61 t i måneden; seien på Møre (07) topper i februar.
- **Krav 5b (5 000 aktive):** fila er statisk og følger appen (som `mottak.json`); den koster serveren ingenting per spiller. Releasen lages én gang i måneden på GitHub.
- **Antatt eller usikkert:** to års snitt glatter ikke ut et år med uvanlig vandring (makrellen 2024 mot 2025: 250 000 mot 156 000 t); grensen på 5 000 kg er et valg for å holde fila under 400 kB; båtens redskap er det den landet mest kilo med, så en båt som fisker garn om vinteren og jukse om sommeren, telles som garnbåt.

## 5.3c Fordelingen og vandringen (B2 i `docs/planer/bestand-og-flaate.md`, 01.11.2026)

`core/03f-fiske.js`. `av`-tabellen og skreipulsen var de samme fra Lindesnes til Vardø. Nå følger fisken sluttsedlene per lokasjon og måned (5.3b), med vandringskurver der sedlene alene ikke viser bevegelsen.

- **Fila i siden:** `fiske.json` ligger som tekst i siden (`/*@text(data/fiske.json)*/null`, ny form i `build.mjs` og `tests/unit/run.mjs`). Den leses med `JSON.parse` første gang fisket spør (`fkData`). Målt i Chromium: som objekt-literal kostet de 366 kB **51 ms** ved oppstart, og **73 ms** med CPU-en strupet 4×. Som tekst er det ~0 ms ved oppstart. Første oppslag koster `JSON.parse` (6–12 ms her, ~37 ms strupet) pluss byggingen av feltet (**42–62 ms** i Node, én gang). Siden vokser fra 6,31 til **6,84 MB**: 0,39 MB for `fiske.json` som tekst (med escapede anførselstegn) og resten for `felt.json` (128 kB). Jonas valgte tekst lest ved behov 01.11.2026.
- **Leseren `fkCell(sp, område, måned, redskap, lengdegruppe)`** gir kg og landinger i året:
  - for en lokasjon (`'05-29'`, kystflåten) eller et hovedområde (`'05'`, havflåten og landingene uten lokasjon)
  - redskapet er et navn fra `meta.gear` eller `null`, og lengdegruppa 0–4 eller `null`
  - Spillets `krabbe` er `kongekrabbe` i fila.
- **Tettheten fra sedlene (valg A, Jonas 01.11.2026):** kilo per landing på lokasjonen og i måneden, justert for redskap og båtlengde. Hver landing måles mot snittet nasjonalt for sin redskap × lengdegruppe, så en kystgarnbåt og en linebåt på 20 m teller likt. Det ganges med andelen av lokasjonens landinger den måneden som hadde arten (innsatsen er alle landingene der: det høyeste tallet for noen art den måneden).
  - **Glatting:** en firedel fra hver nabomåned, og halvparten av snittet for nabolokasjonene. Naboene er polygonene i `rules.json` som deler et hjørne (til 50 m).
  - **Krymping:** tallet trekkes mot hovedområdets tall når det er under `FK.n0` = 20 landinger.
  - **Forholdet til Senja:** spillet bruker tallet som forholdet til Senja-feltene (lokasjonene til `GROUNDS` 0–3) i samme måned, ganget med `av`. Grensene er 0,03–5.
  - **Der det ikke finnes tall** (ingen landinger på lokasjonen eller i hovedområdet), er faktoren 1, og `av` holder.
- **Torsken deles i to:**
  - **Kysttorsken:** lokasjonens sommernivå (juni–september) mot Senjas.
  - **Skreien:** lokasjonens overskudd over sommernivået januar–mai, mot Senjas. Den kommer og går med skreifronten og gytebestanden (`stockF`). Bergen har ikke noe slikt overskudd, og har derfor ingen skrei.
  - Den store skreien i `sampleFish` følger det samme (`skreiShare`).
- **Ikke med:** blåkveita og kongekrabben beholder sin egen geografi (`eggaArea`, `kingArea`), som alt var tatt fra de samme sedlene.
- **Oppslaget per rute og time (5b):**
  - **Lokasjonen per rute:** `lokOfCell(p)` gir lokasjonen (indeks i `RU.lok`) og midten av 2 km-ruta. Den slås opp én gang per rute og lagres i `LOKC`. Kandidatpolygonene per 10 km-blokk ligger i `LOKB`.
  - **Måneden:** `denTime` gir månedsvektene (`fkMonth`) og skreifronten per dag med forskyvning, én gang per time.
  - **Hvor `denSp` henter det:** fra `fkAvail(sp, q, T)`. `denPlace` legger ruta i `q.c`.
  - **Målt:** oppslaget er **0,03 µs** per art og time, og 0,08 µs for ruta (0,2 µs første gang ruta slås opp). Et helt `density`-kall i Chromium tar 17,7 µs før og 18,5 µs etter med samme time. Når timen byttes hvert 2 000. kall, er det 16,4 µs før og 19,0 µs etter. Ingenting koster serveren.
- **Vandringskurvene (`MIG`), med kilde:**
  - **Skreien** (HI, «Skrei» og torskens gytevandring, hi.no; sluttsedlene per lokasjon):
    - Spillets skreipuls er den som gjelder på Senjas breddegrad (snittet for `GROUNDS` 0–3, 69,5° N).
    - Den kommer 7 dager tidligere per grad nordover og senere sørover, langs skreikysten 66–71,2° N. Båtsfjord har skreien 22 dager før Røst (`vandring.test.mjs`).
    - Gytefeltene går fra Møre til Finnmark, så skreien tones ut sør for Stad (61,8–62,6° N).
    - Mengden er lokasjonens overskudd i sedlene og gytebestanden.
  - **NVG-silda** (HI, «Norsk vårgytande sild»): gyting på Møre og Haltenbanken (62–65,5° N) i februar–mars, beiting i Norskehavet om sommeren (utenfor rammen), overvintring utenfor Troms og Vesterålen (68,3–71° N) i oktober–januar. Sedlene viser det samme: havflåtens sild er i hovedområde 04 i oktober–januar (71 850 t i januar i året).
  - **Makrellen** (HI, «Makrell»): langs kysten mai–november. Nordgrensen går fra 58° N i mai til 69° N i august, og ingen langs kysten desember–april.
  - **Seien** (HI, «Sei»; sluttsedlene): gyting på Møre og Haltenbanken i februar–mars, stimene langs kysten nord for 65° N i mai. Kurven er 1 på Senja og fyller bare inn der sedlene ikke har lokasjonen. Der de har den, gjelder sedlene.
  - **Snøkrabben** (HI, «Snøkrabbe»): bare nordøst i Barentshavet, øst for 30° Ø og nord for 72° N (hjørnet av rammen).
- **De nye artene** sild, makrell og snøkrabbe (`SPECIES`, `npc:true`, valg 4 = A):
  - De er bare for flåtetrykket (B3) og AIS (H1).
  - De er ikke i `SP` eller `SHELL`, og `spCatchable` sier nei.
  - De er ikke i Fiskeguiden eller rekordene (`PLAYSP`), og mottakene kjøper dem ikke.
  - De ligger sist i `ALLSP`, etter blåkveita, så ingen andre arters frø flytter seg (krabben er fortsatt den niende).
  - Prisene er grove anslag som ingenting leser ennå.
- **Feltnavnene** (`tools/npc/felt.py` → `src/data/felt.json`, `feltIn` i `01e-marks.js`, tegnet i `ui/03-map.js`):
  - **Kilden:** Fiskeridirektoratets «Fiskeplasser – redskap» (WFS `FiskeridirWFS_fiskeri`, lagene `fiskeplasser_aktive_redskap` med 2 101 felt og `fiskeplasser_passive_redskap` med 2 941). Lisensen er NLOD (Fiskeridirektoratets åpne data; GetCapabilities oppgir ingen avgift eller begrensning).
  - **Feltene i lagene:** stedsnavn, status, kommune, opphav, datoer, brukere, merknader, opptil åtte art/redskap/fra/til, `alle_arter`, `alle_redskap` og polygonet.
  - **Det som leses:** bare stedsnavnet, polygonet og om redskapet er aktivt eller passivt. «Brukere» og merknadene leses aldri.
  - **Resultatet:** 4 684 felt etter at samme navn innen 3 km er slått sammen (128 kB). Skriftpunktet er tyngdepunktet når det ligger inne i polygonet, ellers midten av den bredeste raden.
  - **I kartplotteren:** navn uten sirkel, i kursiv, fra zoom 1, de største først. Bare ett navn per celle på 110 × 22 piksler, og høyst 80 i bildet. Senjas egne navn (`GROUNDS`) vinner innen 1,5 km.
  - **Der feltene mangler** (for eksempel rundt Båtsfjord, der WFS-en har få felt), står det ingen navn. NPC-båtene holder skråningsregelen for sine felt (`npc.py`, uendret).
- **`k` kalibrert på nytt:**
  - **Målet:** snittet av 60 × `density` (én person med håndjuksa) over sjøen på 20–300 m rundt hvert av de fire stedene i `simday`, timene 8–16 på fem dager i måneden, med urørt bestand.
  - **Endringen:** summen over de fire stedene før mot etter ga torsk 0,91, sei 0,92, lyr 1,48, brosme 1,11 og uer 0,77. `k` ble justert for disse fem. Hyse, lange og kveite var innen 3 %.
  - **`simday`** (Husøy mars, Gryllefjord mars, Husøy juli, Malangsgapet mai, kg på dagen): før **350 / 350 / 297 / 350**, etter **350 / 350 / 316 / 350**, altså innen ±10 % (tre av fire fyller lasterommet). Artene fordeler seg litt annerledes: mer torsk på Husøy og mindre på Gryllefjord, der sedlene har mindre torsk per landing.
- **Kg i timen** for én person med håndjuksa (snittet over sjøen på 20–300 m innen 10 km, urørt bestand, 2028), før → etter:

  | Sted og måned | Torsk | Sei | Hyse | Alle |
  |---|---|---|---|---|
  | Lofoten (Henningsvær–Svolvær), mars | 29,6 → 13,5 | 8,6 → 29,6 | 6,5 → 7,1 | 49,7 → 53,8 |
  | Røst, mars | 43,7 → 35,2 | 10,1 → 52,0 | 8,4 → 20,7 | 67,9 → 113,9 |
  | Bergen (Sotra–Fedje), mars | 33,1 → 12,9 | 9,7 → 46,9 | 9,3 → 11,0 | 59,4 → 89,9 |
  | Bodø, mars | 39,8 → 16,4 | 10,7 → 52,7 | 10,3 → 12,6 | 68,2 → 94,0 |
  | Finnmark (Båtsfjord), januar | 15,4 → 27,5 | 32,5 → 8,8 | 8,8 → 2,6 | 61,1 → 40,1 |
  | Finnmark (Hammerfest), januar | 13,9 → 25,2 | 24,0 → 14,0 | 10,2 → 4,8 | 53,6 → 47,9 |
  | Møre (Ålesund), februar | 21,3 → 14,8 | 11,9 → 58,4 | 8,1 → 7,4 | 47,2 → 97,4 |
  | Husøy, mars (Senja) | 77,7 → 94,1 | 17,2 → 13,4 | 14,6 → 13,2 | 121,6 → 130,6 |

- **Funnene, sagt rett ut:**
  - **Lofoten i mars får *mindre* skrei enn i dag, ikke mer** (planen antok mer). Sedlene sier at en landing ved Henningsvær er mindre enn en landing fra Senja-feltene, også med samme redskap, lengde og måned (0,21 av Senjas i mars). Det samme gjelder kilo per lokasjon: 00-46 har 1 176 t i mars over to år, mot 5 110 t på 05-30. Lofotfisket er spredt over mange lokasjoner, og Vestfjorden har strengere regler for redskap og båtstørrelse.
  - **Justert for redskap fjerner noe av sesongen.** Garna brukes mest i skreisesongen, så det nasjonale snittet per garnlanding har alt skreien i seg. Det gjelder alle steder likt, også Senja, så forholdet mellom stedene står.
  - **Seien øker mye i februar–mars** langs Lofoten, Bodø, Bergen og Møre (3–5 ganger før). Grunnen er at Senjas egen sei per landing er lavest nettopp i mars (0,21 mot 0,6–1,5 andre steder), så forholdet blir stort. Mange lokasjoner treffer taket på 5. Gisundet (05-41) har mye sei per landing om vinteren (seinot). Derfor er feltet på første tur 85 kg i timen etter garantien (22 før), og `heattest` sjekker nå at feltet faller under 45 % av ringen. Bør ses i spilltest: blir det for mye, er taket (`FK.hi`) eller glattingen stedet å skru.
  - **`calib` sammenligner ikke helt likt** før og etter: havpunktene trekkes med `Math.random` etter oppstarten, og flere arter i `ALLSP` gir andre trekk.
- **Fisken beveger seg** (Jonas 01.11.2026: «En fisk er jo et levende vesen som beveger seg … Kjør på med alt»):
  - **Retningen etter art, sesong og sted** (`migHeading`, `migDir`):
    - Stimene og de gode flekkene svømmer dit arten vandrer der og da, blandet med en langsom vimsing som er ulik fra sted til sted (støy over ~100 km) og fra periode til periode.
    - **Skreien** går sørvest langs kysten mot gytefeltene i januar–mars og nordøst tilbake i april–mai (nord for 66° N). I Finnmark går den inn mot land etter lodda i mars–april.
    - **Seien** går ut på gytebankene i januar–mars og inn langs kysten i april–juni.
    - **Hysa** går ut mot eggakanten i mars–mai.
    - **Silda** går inn mot gytefeltene i februar–mars, ut i Norskehavet i april–juli og nordøst mot vinterfjordene i Troms i september–november.
    - **Makrellen** går nord i mai–august og sør og ut i september–november.
    - **De andre artene** vimser bare.
    - **«Ut til havs»** er en jevn kurs per kyststrekning (`migOffshore`).
    - **Uten skjøter:** retningen regnes i knutepunkter hver 20. km per art og periode, lagres der og leses mellom de fire rundt et punkt. Mønsteret bøyer seg da jevnt (høyst 0,0001 forskjell over 50 m).
    - **Stimene:** feltene varer 6 timer og toner over i hverandre, så en stim kan snu uten at mønsteret hopper (høyst 0,012 per minutt), og snittet er 1. Flekkene beholder sine 120 timer, og vandringen styrer 70 % av retningen.
    - Sonaren sier hvor stimene trekker der båten er (`schoolDrift(sp, p, H)`).
  - **Opp og ned i vannet** (`VERT`, `vertZ`, `cellNight`; HI om døgnvandringen):
    - Hver art har en høyde over bunnen om dagen og om natta, som andel av vannsøylen: torsk 0,06/0,25, hyse 0,03/0,1, sei 0,3/0,6, sild 0,25/0,75, makrell 0,45/0,6, de dype artene nær bunnen.
    - Natta regnes fra solhøyden (`sunAt`) per 2 km-rute og time.
    - **Bunngarn og line** tar fisken nær bunnen, og **flytegarnet** den som står høyt (`gearVertF`). Snittet over et døgn er rundt 1, så kalibreringen av redskapet står: bunngarnet tar 1,11 om dagen og 0,89 om natta i mars, snittet er 1,01.
    - **Juksa** biter inntil 15 % bedre i skumringen (`biteF`, solen mellom −6° og +4°). Midt på dagen er den som før, og under midnattssola er det ingen skumring.
    - **Ekkoloddet** tegner merkene der torsken står i vannet (`echoSvg`).
  - **Lodda** (HI, «Lodde»): gyter langs kysten av Finnmark og Kola i mars–april, og torsken følger den inn.
    - Fra Loppa og østover (`MIG.loddeW`) kommer halvparten av torskens vår med skreifronten og halvparten med loddepulsen (topp 3,7, samme vekt over våren som skreipulsen).
    - Båtsfjord i april: 2,23 mot 0,76 med fronten alene. Mengden over våren er den samme (1,00 mot Senja).
  - **Skreien strømmer inn** (`skreiFlow`): mens skreien går forbi, fylles en nedfisket rute på dens vei opptil tre ganger raskere. Det er fordi ny fisk svømmer inn, ikke fordi den gamle vokser. Det er ingenting i juli og ingenting i Bergen.
    - Innsig fra naborutene fantes alt (1 % i timen mot snittet av de fire rundt, `stockHour`). Det har jeg sagt feil om tidligere.
  - **Ikke ennå:** skreien som én mengde, der det som tas i Finnmark i januar mangler i Lofoten i mars. Spillerne tar for lite til at det merkes uten flåten, så det bygges i B3 sammen med flåtetrykket `F`. Fisken reagerer heller ikke på temperatur, strøm (bare kveita, ved strømstille) eller vær.
  - **Målt:**
    - `simday` 350 / 350 / 326 / 350 kg (+9,8 % i juli, innenfor ±10 %; tilfeldige trekk og stimmønsteret, ikke skumringen).
    - `density` rundt +1 µs per kall (median 18,2 → 19,2 µs, tre kjøringer hver, vekselvis; maskinen svinger ±15 %).
    - Grønne: `heattest`, `geartest`, `jigalongtest`, `bktest` og `r4test`.
- **Tester:** `tests/unit/vandring.test.mjs` (33 sjekker), `bktest` (frøene: blåkveita er sist av spillerens arter), `guidetest` (ti arter: `PLAYSP`), `heattest`.

## 5.3d Flåtetrykket og grunnlinja (B3 i `docs/planer/bestand-og-flaate.md`, 02.11.2026)

`core/03g-trykk.js`. Hele den norske flåten tar av den felles bestanden. Det spilleren møter på et sted, er likevekten mellom flåtens trykk der og hvor fort fisken kommer tilbake, ganget med det spillerne selv har gjort. Alt er en ren funksjon av den felles klokka og dataene i appen. Det er likt for alle, uten at noen må ha sett båtene, og serveren spørres ikke om noe nytt (5b).

- **Trykket `F`** (`trykkYear(sp, år)`, `fleetF(sp, p, H)` i kg i timen i 2 km-ruta):
  - **Utgangspunktet:** landingene i sedlene (`fiske.json`) per lokasjon (kysten) og hovedområde (havet), måned, redskap og lengdegruppe, skalert til årets kvote for hver gruppe i kvotekjeden (`codChain`).
  - **Gruppene for torsk:**
    - Kystens lengdegrupper er lukket gruppe per hjemmelslengde (under 11, 11–14,99, 15–20,99, 21–27,99 m).
    - Åpen gruppe er en andel av båtene under 11 m, i forholdet mellom åpen gruppes kvote og lukket gruppes under 11 m.
    - Båtene på 28 m og over er trål (trålredskap) og havfiske (resten).
    - Sedler under 28 m uten lokasjon regnes til kysten, lagt per hovedområde.
  - **Årssummen per gruppe er gruppekvoten.** 2027: åpen 10 537 t, under 11 m 23 719, 11–14,99 m 23 408, 15–20,99 m 21 676, 21–27,99 m 15 935, trål 38 041 og havfiske 12 450 t. Til sammen 146 kt av Norges 160 kt; resten er avsetningene på toppen.
  - **Hyse og sei:** alle sedlene skalert til Norges kvote (`norQuota`). **De andre artene:** sedlene som de var. Sild, makrell og snøkrabbe er med, for havflåten (H1).
  - **Åpen gruppe** følger sesongen sin dag for dag (`qyAt`: rundt 2 100 båter, stoppen, økningene). Trykket er gruppas fangst den dagen mot sedlenes nivå (`trykkOpenScale`). Etter stoppen er båtene som er over den garanterte kvoten ferdige, og trykket faller med fangsten, ofte til null.
  - **Spillernes landinger** i åpen gruppe går fra trykket, fordi `qyStep` teller dem sammen med de andres fra serveren. For de lukkede gruppene er spillernes fangst ikke delt per gruppe på serveren ennå, så den kommer oppå flåtens. Det er en dråpe i dag; B4 flytter registeret og gruppenes fangst til serveren.
- **Hvor i lokasjonen:** trykket legges tre ganger så tett innen 2 km fra et navngitt felt i «Fiskeplasser – redskap» (`felt.json`, `trkCellW`), og jevnt ellers. Summen per lokasjon er den samme. Havflåtens trykk legges bare utenfor grunnlinja, der de store båtene kan fiske (J-161-2026 § 32).
- **Hvor mye av fisken som tas** (`fleetU`): trykket mot fisken i ruta.
  - **Fisken totalt per art:** for torsk, hyse og sei er det gytebestanden (`STOCK`) ganget med forholdet til totalbestanden: torsk 3,1 og hyse 3,1 (JRN-AFWG 2026), sei 2,1 (regnet fra ICES 2026, se «Ekte tall for bestanden» under). Silda og makrellen tar ICES' gytebestander for 2025 (3,2 og 3,6 Mt). For resten er det årets landinger delt på en beskatningsrate: lyr 0,25, lange og brosme 0,2, uer og kveite 0,12, snøkrabbe 0,2. Alle disse er anslag.
  - **Fordelingen:** fisken deles først mellom kyst og hav etter hvor fangsten tas den måneden. I mars står torsken mest på kysten for å gyte, om sommeren ute i Barentshavet. Innenfor hver fordeles den etter fangst per landing mot snittet for samme redskap og lengde, ganget med arealet.
  - Fangst per landing kan bare sammenlignes innenfor samme redskap. Den første versjonen, som blandet trål og kystgarn, ga havområdene nesten all fisken og Husøy en grunnlinje på 0,26.
- **Grunnlinja** (`baseAt(p, sp, H)`): `r / (r + u)`, der `r` = 0,004 i timen er tilveksten til `S.stock` (fisk som kommer tilbake og svømmer inn). Det er den lukkede formen for likevekten. Bestanden blir da `stockAt = baseAt × avviket i S.stock` for fiskeartene. Blåkveita og krabben har egne lag og ingen grunnlinje.
  - **Målt i 2027:**

    | Sted | Januar | Mars | Juli |
    |---|---|---|---|
    | Husøy | 0,64 | 0,64 | 1,00 |
    | Malangsgapet | 0,72 | 0,77 | 1,00 |
    | Henningsvær | 0,92 | 0,81 | 0,99 |
    | Båtsfjord | 0,94 | 0,96 | 0,91 |
    | Bergen | 1,00 | 1,00 | 1,00 |

  - Det gamle håndlagde utgangspunktet rundt Senjas fire felt (`initStock`, 0,55–0,9 hele året) er borte. `initStock` gir nå et urørt avvik.
- **Skreien som én mengde** (`skreiLeft(H)`): skreisesongens fangst så langt mot gytebestanden. Sesongens fangst er den nasjonale torsken over sommernivået i januar–mai, skalert til årets kvoter. Det som er tatt i Finnmark i januar, er ikke der i Lofoten i mars. Andelen som er igjen: 1,00 / 0,98 / 0,91 / 0,81 / 0,76 / 0,75 den 1. januar–juni 2027. Den ganges på skreidelen i `fkAvail`.
- **Senja-flåtens eget uttak er fjernet:** 18 kg i timen per båt og de tre faste feltene i `stockHour`. Det ligger nå i trykket, langs hele kysten. NPC-båtene på Senja vises som før, og L2/N1 gir dem redskap og felt etter `F`.
- **Ytelsen:** ruta regner trykket og andelen for alle elleve arter én gang per time (`trkCell`: 5,6 µs første gang i en ny time). Oppslaget etterpå tar 0,13 µs, under kravet på 5 µs. Årstabellene bygges én gang per art og år (60 ms for torsk).
- **Kalibreringen:**
  - **`k`:** med den ekte bestanden i begge bygg ga grunnlinja 17–48 % mer fisk på de fire Senja-stedene enn det gamle utgangspunktet. `k` er delt på forholdet, så summen over de fire stedene er den samme som før B2.
  - **`simday`:** 350 / 350 / 350 / 350 kg (alle fyller lasterommet). Juli på Husøy er nå over ±10 % mot før B2 (297), fordi flåten nesten ikke fisker der om sommeren. Mars er litt lavere (snittet ved Husøy 72 mot 82 kg i timen).
  - **`progweek`:** 311 kg per tur mot 341 før B2. Blad B dag 18 mot 15, inngangen i lukket gruppe dag 23 mot 22.
  - **`geartest`:** garnet vest av Gryllefjord gikk over grensen (47 kg per garn) før `k` ble justert, og er innenfor etterpå.
- **Tester:** ny `tests/unit/trykk.test.mjs` (21 sjekker: gruppekvotene, åpen gruppe etter stoppen, grunnlinja, skreien gjennom sesongen, ingen Senja-flåte, tiden). Grønne: `simday`, `calib`, `progweek`, `kvtest`, `geartest`, `bktest`, `heattest`, `jigalongtest`, `posttest` og `guidetest`. `quotatest` er rød på kvotesamarbeidet, som før (backloggen).
- **Rettet i B4 (02.11.2026):**
  - **Spillernes fangst trekkes fra flåten.** Lukket gruppes torsk og all hyse og sei viker for det spillerne har landet i år (`trkPlayersF`; de andres fangst fra serveren, din egen fra kvoten din). Åpen gruppes virtuelle båter er 2 100 minus de aktive spillerne (`qyBoats`).
  - **Etterslepet:** grunnlinja følger trykket med etterslep, ikke månedstabellen direkte. Den er likevekten med trykket så lenge før som stedet trenger for å finne seg til ro (`1/(r+u)` timer, høyst 30 døgn, i steg på 6 timer). Et felt som fiskes hardt i mars, er derfor tynt ut i april og fylles over et par uker.
  - **Trålerne og notbåtene** legges tre ganger så tett på fiskeplassene for aktive redskap (`felt.json` `g` = a eller b) i sitt hovedområde, utenfor grunnlinja.
  - **Temperaturen** (`tempDepthK`, `TWARM`): fisken går dypere når overflaten er varmere enn den liker. Grensen er torsk og hyse 10 °C, sei 12, lyr 14 og kveite 10. Over grensen går den foretrukne dybden 12 % dypere per grad, høyst dobbelt så dypt.
    - Kilder: Svein Sundby (UiB) i Fædrelandsvennen 10.08.2012: torsken holder seg helst i vann på 0–10 °C nær kysten, i fjordene og på bankene. HIs notat til reguleringsmøtet 2022 (sak 30, fiskeforbudet for torsk i Skagerrak): kysttorsken der lever i den varme enden av det den liker, blir stresset av små økninger, og har strategier for å komme seg gjennom varmt overflatevann om sommeren.
    - Grensene for sei, lyr og kveite og 12 % per grad er anslag.
    - Overflatetemperaturen er `seaTemp` (Senjas år, flyttet etter de månedlige snittene fra marine-API-et for stedet), per rute og time.
  - **Kysttorsken følger ikke skreiens bestand.** Den stedegne torsken ganges ikke lenger med gytebestanden for NØ-arktisk torsk (`stockF`); det gjør bare skreien. Kysttorsken har egne vurderinger hos ICES (nord og sør for 62° N), men vi har ikke tidsserien. Derfor er den uten trend år for år. Sør for 62° N er nivået det sedlene viser.
  - **Strømmen og været:**
    - **Strømmen:** torsken biter inntil 8 % bedre i stille strøm (`biteF`), oppå skumringen. Kilde: telemetri på torsk ved kunstige rev i Nordsjøen (VLIZ, Reubens mfl.), der torsken var mest aktiv i skumringen og nest mest når strømmen var svak. Hvor mye (8 %) er et anslag.
    - **Uvær:** i storm (10–20 m/s) står torsk, hyse, sei og lyr inntil 0,15 høyere i vannsøylen (`STORMZ` i `gearVertF`), så bunngarn og line tar mindre og flytegarnet mer. Det er en analogi fra lysingen utenfor Sør-Afrika (Rhodes University), som går opp fra bunnen ved sterk vind og blir borte for bunntrålen. Det er ikke målt på våre arter.
    - **Ikke funnet kilde:** Ehrich og Stransky (1999) om kuling og fisken i Nordsjøen ble bare funnet som referanse. Løkkeborg og Pina (1997) fant at line satt før daggry og på tvers av strømmen ga mer hyse, men ikke mer torsk. Det er ikke bygd inn, fordi spillet ikke regner retningen på lina mot strømmen.
  - **Lofoten:** sedlene for 2024–2025 sier at skreien sto minst like tett på Senja-feltene som ved Henningsvær. Det gjelder både per landing og per km² (00-46 er 0,53 av Senja; Stamsund 00-48 er 1,95). HIs kartlegging av gytefeltene i 1983–1985 fant rundt 40 % av eggene i Lofoten og viktige gytefelt langs Troms. Visit Norway (reiselivskilde, ikke måling) skriver at mye av skreien de siste årene har gått lenger nord, til Vesterålen og Senja. Modellen står derfor på sedlene; et kompromiss med kilo per km² ga ikke et bedre bilde (mer ved Stamsund, langt mindre ved Røst).
  - **Gytetoppen mot fronten:** HI (1983–1985) fant gytetoppen på det nordligste feltet rundt 14 dager *senere* enn i Lofoten. Skreifronten i spillet gjelder når skreien kommer inn fra Barentshavet (Båtsfjord før Røst), ikke når den gyter. Begge deler kan stemme samtidig.
  - **Ekte tall for bestanden** (02.11.2026, etter at Jonas åpnet vertene):
    - **Torsk** (JRN-AFWG 2026, IMR-VNIRO-rapport 2026 nr. 5, Sikt NVA, kap. 3.6.5 og tabell 3.20): totalbestanden (3 år og eldre) var 1 102 kt og gytebestanden 352 kt i 2025. I 2026 er det 1 069 og 338 kt. Forholdet er 3,1 (`TRK.tsb`). F5–10 var 0,548 i 2025.
    - **Hyse** (samme rapport, kap. 4.7): totalbestanden var 494 692 t og gytebestanden 157 942 t i 2025. Forholdet er 3,1. Gytebestanden er 165 kt i 2026.
    - **Sei** (ICES 2026, `pok.27.1-2`, databasen over bestandsvurderinger `sag.ices.dk`, nøkkel 22657): ICES oppgir ingen totalbestand. Forholdet 2,1 er regnet ut av fangsten i 2025 (147 482 t) delt på andelen fiskedødeligheten 0,399 tar med naturlig dødelighet 0,2: F/Z·(1 − e^−Z) = 0,30. Det gir rundt 490 kt mot en gytebestand på 234 kt.
    - **Seiens gytebestand 2014–2026** er lagt inn i `STOCK.sei` fra samme vurdering; før var bare 2026 og 2027 med. ICES' vurdering fra 2025 lå høyere (413 kt i 2025 mot 234 kt i 2026-vurderingen).
    - Gytebestandene i spillet for 2025–2026 stemmer med rapportene for alle tre.
    - **Grunnlinja ble høyere:** Husøy i mars er 0,73 (før 0,64), og skreien er 0,77 igjen i juni. Fangsten på Senja-stedene flyttet seg høyst 6 % (hyse), så `k` står.
  - **Kysttorsken år for år** (`KYSTT`, `kystF` i `03d-quota.js`; ICES 2026 via `sag.ices.dk`):
    - **Nord for 67° N** (`cod.27.1-2.coastN`, nøkkel 22637): gytebestanden falt fra 99 036 t i 2012 til 53 035 t i 2023, og tok seg opp til 71 729 t i 2024 og 80 933 t i 2025.
    - **62–67° N** (`cod.27.2.coastS`, nøkkel 23775): bare B/Bmsy, fra 0,74 i 2012 til 0,42–0,44 i 2023–2026. Fiskedødeligheten lå 1,5–1,66 ganger over nivået for maksimalt bærekraftig utbytte hvert år 2012–2025. Bestanden er svak og overfisket.
    - **Hvordan det brukes:** den stedegne torskens nivå er kvadratroten av bestanden mot 2024–2025, årene sedlene er fra, med glidende overgang ved 67° N og 62° N. Etter siste år med data holdes nivået, fordi vi ikke har en egen framskriving. Sør for 62° N har spillet ingen serie (Nordsjøen og Skagerrak er andre bestander), så faktoren er 1.
    - **Målt:** nord for 67° N gir det 1,14 i 2014, 0,90 i 2023 og 1,03 fra 2025.
  - **Uer:** beskatningsraten er 0,19 (anslaget 0,12 × 1,59). ICES 2026 (`reg.27.1-2`, vanlig uer, nøkkel 23725) har fiskedødeligheten 1,52–1,61 ganger over nivået for maksimalt bærekraftig utbytte i 2022–2025.
  - **Lange og brosme** (`lin.27.1-2`, `usk.27.1-2`, ICES 2025) har bare indekser (kg per 1 000 kroker og relativ fiskedødelighet), ingen absolutt bestand, så anslagene (0,2) står. Lyr og kveite vurderes ikke av ICES nord for 62° N.
  - **Etter dette:** fangsten på Senja-stedene er innen 6 % av før B2 (torsk +4 %, hyse +6 %), og `k` står.
  - **Fortsatt anslag:** beskatningsratene for lyr, lange, brosme, kveite og snøkrabbe, tilveksten `r`, og skalaen 0,12 for uer.
  - **Kalibreringen etter B4:** summen per art over de fire Senja-stedene er innen 2–4 % av før B2, så `k` står.
  - **Ytelsen:** en rute regner trykket for alle elleve arter med etterslep én gang per time. Det tar rundt 12 µs for en rute fra forrige time og 30 µs første gang ruta slås opp (fiskeplassene, grunnlinja). Oppslaget etterpå tar 0,13–0,21 µs. Et varmekart med 2 500 ruter koster da 30–75 ms én gang per spilltime (10 ekte minutter). Det bør flyttes ut av hovedtråden hvis det merkes på Pad 3.
  - **Kg i timen med håndjuksa etter B4** (urørt avvik; før B2 → B2 → B4):

    | Sted og måned | Torsk | Sei |
    |---|---|---|
    | Lofoten, mars | 29,6 → 13,5 → 8,2 | 8,6 → 29,6 → 17,5 |
    | Bergen, mars | 33,1 → 12,9 → 10,8 | 9,7 → 46,9 → 34,9 |
    | Båtsfjord, januar | 15,4 → 27,5 → 21,3 | |
    | Bodø, mars | 39,8 → 16,4 → 12,6 | |
    | Husøy, mars | 77,7 → 94,1 → 50,7 | |

- **Antatt eller usikkert:**
  - Beskatningsratene for artene uten bestand i spillet og tilveksten `r` er anslag. Forholdet mellom totalbestand og gytebestand er fra JRN-AFWG og ICES (2026).
  - Etterslepet er en lukket tilnærming (likevekten med trykket for en tid siden), ikke en simulert dynamikk.
  - Fordelingen av fisken mellom kyst og hav etter fangsten antar at flåten fisker der fisken er.
  - Trål og havfiske er lagt jevnt over hele hovedområdet utenfor grunnlinja.
  - Kysttorsken sør for 62° N er ikke en egen bestand.

## 5.3e Fasit-testen: modellen mot et år den ikke har sett (02.11.2026)

`tests/fasit.py` og `tests/fasit_ref.py`. Testen måler hele modellen (`density`: feltet fra sedlene, vandringene, skreifronten, grunnlinja, dybden og temperaturen) mot det flåten faktisk fisket per landing, lokasjon for lokasjon og måned for måned.

- **Utenfor dataene:**
  - Spillet bygges med sedlene for 2024 alene (`KYST_FISKE=<fil> python3 tools/npc/fiske.py 2024`, lagt i `src/data/fiske.json` bare for bygget til `dist-oos`) og sammenlignes med sedlene for 2025.
  - **Taket** er hvor godt 2024-sedlene alene forutsier 2025, altså hvor mye fisket flytter seg fra år til år.
  - **Gulvet** er spillet fra før B2, med én tabell for hele kysten.
- **Fasiten:**
  - Den er fangst per landing mot snittet nasjonalt for samme redskap og lengdegruppe, ganget med andelen av lokasjonens landinger som hadde arten.
  - Bare celler der minst 5 landinger hadde arten, er med.
- **Modellen:**
  - Den er snittet av `density` i opptil 6 punkter på 20–300 m i lokasjonen, kl. 08, 12 og 16 den 5., 15. og 25. i måneden, med urørt avvik.
  - Punktene trekkes likt i hvert bygg.
  - I alt 109 lokasjoner og 1 204 punkter. En kjøring tar rundt 27 minutter, mest for å laste kartet.
- **Målet:** Spearmans rangkorrelasjon (1 er samme rekkefølge, 0 ingen sammenheng), regnet tre ganger:
  - **alle:** over hver lokasjon × måned
  - **steder:** årets snitt per lokasjon
  - **sesong:** kystens snitt per måned
- **Varianter** (`FASIT_VARIANTS`) slår av en del av modellen om gangen på de samme punktene: grunnlinja, `av`, skreifronten, lodda, og sesongen fra sedlene.

**Resultatet, mot 2025** (alle / steder / sesong):

| Art | Gulvet (før B2) | B2–B4 | Endelig (sesongen fra sedlene) | Taket |
|---|---|---|---|---|
| Torsk | 0,03 / −0,15 / 0,78 | 0,44 / 0,59 / 0,59 | **0,54 / 0,72 / 0,84** | 0,66 / 0,86 / 0,93 |
| Hyse | −0,01 / −0,42 / 0,46 | 0,44 / 0,40 / 0,57 | **0,47 / 0,51 / −0,15** | 0,63 / 0,78 / 0,15 |
| Sei | 0,05 / −0,06 / 0,55 | 0,32 / 0,61 / −0,25 | **0,54 / 0,57 / 0,84** | 0,64 / 0,80 / 0,75 |
| Lyr | 0,18 / −0,10 / 0,76 | 0,45 / 0,46 / 0,71 | **0,62 / 0,69 / 0,80** | 0,78 / 0,88 / 0,91 |
| Lange | 0,11 / 0,09 / 0,69 | 0,59 / 0,73 / 0,47 | **0,67 / 0,77 / 0,52** | 0,72 / 0,89 / 0,76 |
| Brosme | 0,08 / 0,20 / 0,38 | 0,39 / 0,61 / −0,04 | **0,57 / 0,67 / 0,94** | 0,61 / 0,71 / 0,87 |
| Uer | 0,15 / 0,04 / 0,71 | 0,48 / 0,68 / 0,30 | **0,54 / 0,62 / 0,89** | 0,73 / 0,79 / 0,90 |
| Kveite | 0,55 / 0,30 / 0,87 | 0,68 / 0,82 / 0,85 | **0,80 / 0,81 / 0,98** | 0,82 / 0,86 / 0,99 |

- **Som andel av taket (alle celler):** gulvet ligger på rundt 16 % i snitt over de åtte artene. Den endelige modellen ligger på rundt 85 %: torsk 81, hyse 76, sei 86, lyr 80, lange 93, brosme 93, uer 73 og kveite 98 %.
- **Det testen fant:**
  - B2–B4 ga mye bedre treff på *hvor* fisken står, men dårligere treff på *når* for torsk, sei, lange, brosme og uer.
  - Årsaken var at forholdet til Senja i samme måned ble ganget med den gamle håndlagde `av`-tabellen. Det flyttet hele kystens sesong der `av` avvek fra det Senja faktisk fisket.
  - Grunnlinja, skreifronten og lodda flyttet tallene lite på månedsnivå. Lodda hjelper torsken litt (0,57 uten, 0,59 med).
- **Rettingen (`FK.season = 'data'`, `FK.torsk = 'data'` i `03f-fiske.js`):**
  - Lokasjonen måles mot Senjas snitt over året, ikke mot Senja i samme måned, så sesongen kommer fra sedlene overalt, også på Senja.
  - For torsken setter sedlene nivået per lokasjon og måned. Innenfor måneden deles det på kysttorsk (lokasjonens sommernivå, `kystF`) og skrei (resten). Skreidelen følger fronten og lodda dag for dag (pulsen mot snittet for måneden), skreiplassene (`skreiSpot` mot rundt 0,6), det som er igjen (`skreiLeft`) og gytebestanden.
  - Den gamle løsningen ligger igjen bak `'av'` og `'split'`.
- **Kalibreringen etter rettingen:**
  - `k` er delt på forholdet, så summen på de fire Senja-stedene er som før B2 (tabellen i 5.3).
  - Kveita er kalibrert mot kveitefisket om høsten i stedet. De fire stedene er fra mars, mai og juli, og kveita er en høstart. `kvtest` gir 4–5 kveiter og 939–1 116 kr per dag, som før B2.
  - **simday:** 350 / 350 / 350 / 350 kg.
  - **progweek:** blad B dag 15, inngangen dag 22.
  - **Fordelingen endret seg slik sedlene sier:** seien på Husøy i juli 14,5 → 36 kg i timen, Malangsgapet i mai 43 → 25. Sedlene viser ingen seistim i mai på Malangsgapet-lokasjonen. Det var et kalibreringsmål i spillet, ikke en måling.
- **Svakheter:**
  - Én test med ett år. 2023 eller 2022 mot 2024 kan gi et annet tall.
  - Hysas sesong er nesten tilfeldig fra år til år (taket 0,15), så den kan ikke treffes.
  - Testen måler månedssnitt. Fronten og lodda virker innenfor måneden og synes ikke her; for det trengs sedlene uke for uke.

## 5.33 Fiskeguiden (Jonas 08.10.2026)

Appen **Fiskeguide** på telefonen (`ui/06f-fishguide.js`, `GUIDE`) svarer på «hvor og når skal jeg lete etter hver art» på noen sekunder. Alt leses fra fiskemodellen, så guiden aldri kan si noe annet enn havet gjør: `SPECIES` (`av` per måned og `skrei` for torsk, `dep` og `prod` for dyp og åpen kyst, `minKg`, `maxKg`, `pm` for pris), `SELQ` (hva redskapet beholder), `BAITS`/`baitF` (agn), reglenes datoer (kveite fredet 20. des–20. april, uer bare juni–august: `kveiteClosed` og `uerOpen` i `03-simulation.js`), og de to artene havet forteller per sted: blåkveite (`eggaArea`, lite sør for 62° N) og kongekrabbe (`kingArea`). Rene tekster for stedene (`WHERE`) er skrevet etter kommentarene og reglene i modellen.

- **Måned:** tolv måneds-knapper (nåværende har en prikk), «Mest å hente» (de tre beste, rangert etter `k × base × tilgang`), og alle ti arter med linje (måneden mot artens beste), dybdeintervall og kort sted. Stengte arter står sist og blekt. Merker: **Skrei**, **Fredet**, **Åpner 21. april**, **Fredet fra 20. des**, **Bare bifangst**, **Lite der du er** (blåkveite sør for 62° N, kongekrabbe der `kingArea` er under 0,1).
- **Hele året:** ti arter × tolv måneder. Stripet er fredet, innrammet er den valgte måneden. En bokstav i toppraden åpner den måneden i månedsvisningen.
- **Artskort:** søyler for alle måneder (skreien som egen blå del for torsk, trykk for å se måneden), Best og Bra som månedsområder, Hvor (dyp, sted, åpen kyst, kanter), Hvordan (redskap med ●●● lest av modellen, «–» for redskap som ikke tar arten, se 5.63; agn som gir mer enn 10 %), Pris (valgt måned, best og lavest betalt), Regler (minstemål, største lovlige, kveitas fredning) og en knapp til Regler-appen.
- Guiden viser `PLAYSP` (spillerens arter), ikke havflåtens sild, makrell og snøkrabbe (B2, 01.11.2026).
- Valgt måned og kort huskes i `GUIDE.st` (ikke i lagringen). Sesong-appen har en knapp hit under sin egen kalender.
- Test: `tests/guidetest.py` (månedene, stengt og skrei, årsvisningen, kortene for torsk, blåkveite, kongekrabbe og kveite, «Lite der du er» sør og nord, engelsk).
- **Det du har funnet ut** (31.10.2026, L2 i `docs/planer/oppdrag-2.md`): artskortet viser linjene fra spillerens egne leteoppdrag (`S.lete[art]`, skrevet av fiskemodellen når oppdraget er svart: sted ved nærmeste mottak, måned, side, dyp, ly), nyeste først, høyst seks. Testen: `guidetest`.
- Ikke bygget: regionsvise tall for torsk, hyse og sei (modellen har ikke egne regioner for dem, bare dybde, åpen kyst og kanter), og «anbefalt felt der du er» (varmekartet og ekkoloddet viser hvor fisken står akkurat nå).

## 5.38 Juks i dødtiden (Jonas 09.10.2026)

Juksa er alltid tilgjengelig når båten ligger i ro (status `fishing`, ingen `b.gop`), uansett rigg. Rigget (`b.rig`) styrer nå bare det passive redskapet som settes og trekkes (line, garn, teiner), og valget «juksa» heter «Bare juksa». Under setting og haling går båten (`b.gop`), og da jukses det ikke. Lasterommet beskyttes mot at juksefangsten fyller det før redskapet er trukket: `gearReserve()` (`core/10-gear.js`) setter av det redskapet i sjøen ventes å gi (det største av det som er fanget ×1,2 og en typisk fangst per enhet: line 70 kg per stamp, garn 40, teine 7), og `fish()` slutter å jukse når resten av rommet er reservert. Blir lasten likevel full under haling, står resten av redskapet igjen (som før). Test: `tests/jigalongtest.py`.
