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
| 0,37 | 0,3 | 0,6 | 0,3 | 0,3 | 0,35 | 0,5 | 0,35 | 0,6 |

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

- **Skreipulsen** (`skrei`): 0,6 / 2,0 / 2,5 / 0,8 for januar–april, 0,1 i desember. Den virker bare på eksponerte banker på 40–250 m og på de tre ytre feltene (`skreiSpot`).
- **`density(sp, p, H)`** er den ene kilden for fisk i spillet: fangst, ekkolodd, varmekart, garn, line, jukse-spillet og pubrykter. 30 × `density` × innsats er kg i timen (én person med håndjuksa har innsats 2). Den er delt i `denPlace(p)` (det alle arter deler: land, dybde, eksponering, helling og avstand til feltene), `denTime(H)` (sesongtallene, lagret for én time) og `denSp()` (artens egen sum). Delingen ga nøyaktig de samme tallene (kontrollsum over rutenett rundt alle feltene).
- **Fisken trekker** (`hotspot`, `HOT`): Gode flekker på et mønster på 3,5 km. To felt overlapper hele tiden, hvert glir sin vei med 0,7–1,7 km i døgnet og toner inn og ut over 240 timer. Før hoppet hele mønsteret hver 120. time. Snittet er det samme som før (0,742 mot 0,737).
- **Stimer** (`school`, `SCHOOL`): et finere mønster (400 m) som svømmer 0,5–1 km i timen i hver arts egen retning. Det gir ±15 % og er 1 i snitt, så fangsten over en dag er den samme, men bittet på ett sted kommer og går i løpet av en halvtime. Sonaren viser retningen (`schoolDrift`).
- **Bestanden** (`STK`, `S.stock`, ruter på 2 km): Den leses mellom de fire nærmeste rutene (`gridBilinear`), og fangsten trekkes fra de samme fire med samme vekter (`stockW`). Nedtrekket der du fisker er kg/K·Σw², altså mykere enn før, men det samlede uttaket er det samme. Gjenveksten har et minste steg og runder til 1e-4, så en rute kommer helt tilbake til 1: en rute på 0,5 er full igjen etter rundt 42 dager. Før stoppet den på 0,876, og krabbe på 0,667. Krabbe (`S.cstk`) er fortsatt én verdi per rute, som før, fordi teinekalibreringen hviler på det og varmekartet ikke viser krabbe.
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

## 5.33 Fiskeguiden (Jonas 08.10.2026)

Appen **Fiskeguide** på telefonen (`ui/06f-fishguide.js`, `GUIDE`) svarer på «hvor og når skal jeg lete etter hver art» på noen sekunder. Alt leses fra fiskemodellen, så guiden aldri kan si noe annet enn havet gjør: `SPECIES` (`av` per måned og `skrei` for torsk, `dep` og `prod` for dyp og åpen kyst, `minKg`, `maxKg`, `pm` for pris), `SELQ` (hva redskapet beholder), `BAITS`/`baitF` (agn), reglenes datoer (kveite fredet 20. des–20. april, uer bare juni–august: `kveiteClosed` og `uerOpen` i `03-simulation.js`), og de to artene havet forteller per sted: blåkveite (`eggaArea`, lite sør for 62° N) og kongekrabbe (`kingArea`). Rene tekster for stedene (`WHERE`) er skrevet etter kommentarene og reglene i modellen.

- **Måned:** tolv måneds-knapper (nåværende har en prikk), «Mest å hente» (de tre beste, rangert etter `k × base × tilgang`), og alle ti arter med linje (måneden mot artens beste), dybdeintervall og kort sted. Stengte arter står sist og blekt. Merker: **Skrei**, **Fredet**, **Åpner 21. april**, **Fredet fra 20. des**, **Bare bifangst**, **Lite der du er** (blåkveite sør for 62° N, kongekrabbe der `kingArea` er under 0,1).
- **Hele året:** ti arter × tolv måneder. Stripet er fredet, innrammet er den valgte måneden. En bokstav i toppraden åpner den måneden i månedsvisningen.
- **Artskort:** søyler for alle måneder (skreien som egen blå del for torsk, trykk for å se måneden), Best og Bra som månedsområder, Hvor (dyp, sted, åpen kyst, kanter), Hvordan (redskap med ●●● lest av modellen, «–» for redskap som ikke tar arten, se 5.63; agn som gir mer enn 10 %), Pris (valgt måned, best og lavest betalt), Regler (minstemål, største lovlige, kveitas fredning) og en knapp til Regler-appen.
- Valgt måned og kort huskes i `GUIDE.st` (ikke i lagringen). Sesong-appen har en knapp hit under sin egen kalender.
- Test: `tests/guidetest.py` (månedene, stengt og skrei, årsvisningen, kortene for torsk, blåkveite, kongekrabbe og kveite, «Lite der du er» sør og nord, engelsk).
- **Det du har funnet ut** (31.10.2026, L2 i `docs/planer/oppdrag-2.md`): artskortet viser linjene fra spillerens egne leteoppdrag (`S.lete[art]`, skrevet av fiskemodellen når oppdraget er svart: sted ved nærmeste mottak, måned, side, dyp, ly), nyeste først, høyst seks. Testen: `guidetest`.
- Ikke bygget: regionsvise tall for torsk, hyse og sei (modellen har ikke egne regioner for dem, bare dybde, åpen kyst og kanter), og «anbefalt felt der du er» (varmekartet og ekkoloddet viser hvor fisken står akkurat nå).

## 5.38 Juks i dødtiden (Jonas 09.10.2026)

Juksa er alltid tilgjengelig når båten ligger i ro (status `fishing`, ingen `b.gop`), uansett rigg. Rigget (`b.rig`) styrer nå bare det passive redskapet som settes og trekkes (line, garn, teiner), og valget «juksa» heter «Bare juksa». Under setting og haling går båten (`b.gop`), og da jukses det ikke. Lasterommet beskyttes mot at juksefangsten fyller det før redskapet er trukket: `gearReserve()` (`core/10-gear.js`) setter av det redskapet i sjøen ventes å gi (det største av det som er fanget ×1,2 og en typisk fangst per enhet: line 70 kg per stamp, garn 40, teine 7), og `fish()` slutter å jukse når resten av rommet er reservert. Blir lasten likevel full under haling, står resten av redskapet igjen (som før). Test: `tests/jigalongtest.py`.
