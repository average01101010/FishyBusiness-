# Redskap og utstyr: om bord og i sjøen

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.31 De andres redskap i havet (tilbakemelding #35, 07.10.2026)

- **Hva:** garn, liner og teiner som andre spillere har stående, vises uten eier: grå streker med bøyer i kartplotteren (`gearSvg`, `10-gear-ui.js`) og bøyene i 3D (`drawGearSea`). Det er bare visning: de kan ikke trykkes på, og de stopper ikke setting eller ruter.
- **Server** (`supabase/migrations/20261007200000_gear.sql`): tabellen `gear_sets` (spiller, id, slag og de to bøyene), uten policy. `gear_put(sets)` skriver over spillerens egne (høyst 60), `gear_near(x, y, r)` gir de andres innenfor r km (høyst 60) som `[slag, x1, y1, x2, y2]`, nærmest først, høyst 300, uten gjester og uten noe om eieren (ingen id, ingen navn). Sett som ikke er fornyet på 14 døgn, hoppes over.
- **Klient** (`gearSync` i `10h-world.js`, kalt fra `worldTick` hvert 15. sekund): egne sett går opp når de endrer seg og hvert 5. minutt, de andres hentes én gang i minuttet eller når båten har gått 5 km. `PEERGEAR` (`05-vessels.js`) er listen. En database uten funksjonene (404) lar spillet være i fred.
- **Å gjøre:** migrasjonen må kjøres (Supabase-MCP-en ble avbrutt da den skulle legges inn). Til da vises ingenting av de andres redskap.
- **Test:** `peergear.py` (en etterligning av databasen står i stedet for den).

## Redskap i sjøen: garn, line og teiner (R1–R7, ferdig 30.09.2026)

Jonas' valg: alle tre kystredskapene i samme runde, ståtid for line som avveiing, ekte krabberegler, og egning både i egnebua og av mannskapet. Snurrevad, trål og ringnot kommer senere med større båter, lisenser og nye farvann (12 nm fra grunnlinja ligger utenfor kartet).

- **Filer:**
  - `src/js/core/10-gear.js`: redskapstabellene, kjøp, regler, setting og trekking, ståtid, vær, bøting, egning og driftsplanens stasjoner.
  - `src/js/ui/10-gear-ui.js`: fiskepanelet, blåsene i kartet og redskapsvalget i ruta. Knappene for redskap ligger i knappelinja (5.17), og «Sett ut» tegnes i kartet (`ui/03d-setmode.js`).
  - Telefonappen «Redskap» ligger i `05-phone.js`, og 3D-delen i `view3d.js` (`buildGear`, `drawGearSea`, `drawGearOp`).
- **Tilstand:**
  - `S.pgear` er per båt (i `VKEYS`): garnlenker `{id, mesh, n, cond}`, stamper `{n, baited}` per linetype, teiner per størrelse, agn i kg, blåsesett og det som ligger på land (egnebu, bøteri).
  - `S.sets` er for hele rederiet: redskap i sjøen `{id, vid, kind, a, b, n, tSet, acc, dead, lost, heavy, …}`, slik at kartet og 3D tegner alle båtenes blåser.
  - `S.cstk` er et eget bestandslag for krabbe (kongekrabbe fra 04.10.2026).
- **Riggen** (`b.rig`, `RIGS` i `10-gear.js`, fra 01.10.2026, brukerens valg): Båten er rigget for én type fiske om gangen.

  | Rigg | Krever |
  |---|---|
  | `juksa` | ingenting (håndjuksa eller juksamaskin) |
  | `line` | linehaler eller elektrisk haler |
  | `garn` | garnhaler |
  | `teiner` | teinehaler eller elektrisk haler |

  - Første montering av en haler er en verftsjobb under Oppgrader. Når utstyret er om bord, byttes riggen gratis og med en gang om bord, i fanen «Rigg» under Beholdning (`rigBlock`, `rigSet`; Jonas 07.10.2026, før lå den under Verft og krevde kai). Det kan gjøres hvor som helst, så lenge ingen av egne garn, liner eller teiner står i sjøen.
  - Riggen styrer `gearRules` (feil rigg gir «Rigg om på verftet»), `setChoices`, valgene i ruta, driftsplanens stasjoner og knappene. «Jukse» er av uten juksarigg, og «Sett ut» er av med juksarigg.
  - Med passiv rigg gir fisketimer i ruta og etter setting ingen juksefangst. Båten venter («Venter, går …»).
  - Trekking sjekkes ikke mot riggen, slik at gamle lagringer med blandet redskap i sjøen kan trekkes.
  - Gamle lagringer får riggen fra redskapet i sjøen eller fra driftsplanen, ellers juksa (`rigGuess`).
  - En skiff kan rigge line og teiner med elektrisk haler, men ikke garn, fordi garnhaleren bare passer snekke og større.
- **Arbeidet på sjøen:** Setting og trekking er `b.gop` under status `fishing`, så sløying, hvileregler, automatisk retur og pausen når bløggekaret er fullt virker som før. Båten går langs strengen mens den setter eller trekker: `gearOpMinute` legger neste minutts flytt i `b.gop.mv`, og `livePose` og 3D-visningen lar henne gå jevnt langs den gjennom minuttet i stedet for å stå og hoppe (tilbakemelding #99, 28.10.2026). Mens endetauene går ned på dypt vann (`lead`), ligger hun fortsatt stille.
  - Setting tar ca. 0,8 min per garn, 5 min per stamp og 0,9 min per teine.
  - **Fangsten kommer om bord i deler** (tilbakemelding #30, 07.10.2026): `haulUnit` flytter ikke en hel enhets fangst på én gang, men en del av den (`HAUL_SLICES` i `10-gear.js`) når redskapet kommer over rekka. Lina gir en del per 100 kroker (3 for en banklinestamp, 7 for hyselina), garn gir tredjedeler per garn, og teiner kommer hele. `b.gop` har `sl` (deler per enhet) og `sub` (deler ferdig i enheten). Sløyinga går da parallelt med trekket i stedet for å vente på slutten av hver enhet. I 3D følger fisken på kroker og i garnet den ekte fangsten per krok (`haulFish` i `view3d.js`), litt tykkere vist (minst hver åttende krok).
  - **Trekket går saktere når bløggekaret fylles** (`haulSlow` i `10-gear.js`, tilbakemelding #30: «man får heller trekke saktere siden bløggekaret fylles opp»): Fisken bløgges når den kommer over rekka og venter i karet til noen sløyer den. Opp til halvt kar går trekket med full fart. Deretter faller farten lineært til en femtedel ved fullt kar, der trekket stopper som før (`deckStop`) til fisken er sløyd og isa. Statuslinja sier «saktere, karet fylles». **Garn:** Trekkes garn, står to ved haleren (`workCtx.hands` i `13-work.js`): en trekker og en bløgger (`p.bl`, vist som «Bløgger» på Mannskap-siden). Farten er den til dem som trekker (`gopUnitMin`), så to om bord gir samme tempo som før. Sløyinga venter da til karet må tømmes, eller til en tredje tar den. Runde fisk som sløyes først på vei inn, og to ved garnhaleren, ble forkastet 07.10.2026.
  - Trekking tar ca. 4 min per garn, 25 min per stamp hyseline og 1,2 min per teine med haler.
  - Mannskapet og ferdighetene (`gear.garn`, `gear.line`, `gear.teiner`) gjør det raskere.
- **Ståtid** (`soakHour`, hver time):
  - *Line:* agnet vaskes ut (τ 10 t), krokene fylles, og marfloen tar 7 %/t etter 20–28 t. Fisken lever de første 5 timene (E-kvalitet og krokpremie), så faller friskheten.
  - *Garn:* fyller seg, og fisken dør i garnet. Friskheten starter på 84 og faller raskere i varmt vann (`SST`). Maskevidden styrer størrelsen (lengde ≈ 0,40 × maske).
  - *Teiner:* halve fangsten etter ca. 20 t, og krabben dør etter 48 t.
  - Selektiviteten per redskap og art står i `SELQ`.
- **Vær og røkting:**
  - Tap og skade per time øker kraftig over 2,5 m sjø. Tung dregg holder bedre.
  - Etter to døgn kommer et varsel, og etter fire døgn en påminnelse fra Fiskeridirektoratet.
  - Tapt redskap gir melding og varsel til du melder det.
- **Slitasje og bøting:**
  - Garna slites ca. 5 % per trekk, mer med stor fangst, krabbe og sjø. Under 25 % går de i filler.
  - Du bøter selv i havn (en jobb), eller leverer til bøteriet i Finnsnes (180 kr per garn per 10 %, klart etter et døgn).
- **Egning:**
  - Egnebua ved mottakene (antatt) tar 500 kr per stamp hyseline og 300 for bankline, pluss agn, og er klar etter 3 t pluss 20 min per stamp.
  - Egen egning går med ca. 560 kroker per time per person.
- **Krabbe** (taskekrabbe til 04.10.2026, så kongekrabbe; brukerens ord: «Taskekrabbe skal fjernes fra spillet. Det er kongekrabbe som gjelder innen fiskerinæringen»):
  - Artsnøkkelen er fortsatt `'krabbe'`, så lagringer, `S.cstk`, `ALLSP`-rekkefølgen (frøene) og delen i `fish.b64` holder seg. Navnet er «Kongekrabbe».
  - **Hvor den finnes** (`kingArea` i `10-gear.js`, etter Havforskningsinstituttet): nesten ingen i Troms (0,004; 0–0,01 krabbe per teine på toktene 2023–2026), litt i Balsfjorden og ved Håkøya (0,03), stigende fra 19,6° Ø til 0,15 ved 22° Ø, 0,7 ved 24° Ø og 1,2 ved 26° Ø. Nord for 72° N er det mindre. Dybden er `dep:[80, 0.8]`.
  - **Tettheten vest for 26° Ø er satt bevisst høyere enn HI-toktene viser** (Jonas 08.10.2026): toktene 2020–22 ga under 1 % av kvoteområdets fangst per teine i fri sone (HI, tabell 5), men krabben trekker gradvis vestover langs kysten. Ikke senk den for å følge den tabellen.
  - **Fangsten** (`KC` i `10-gear.js`): `KC.q = 3` ganger den gamle krabbefangsten per teine, snittvekt 1,5 kg. Store teiner i 24 timer i september i Vest-Finnmark gir 2–12 kg per teine (`geartest`, anslag). Alt som kommer opp, beholdes (J-138 § 5): 40 % hunner (snitt 1,1 kg), 5 % skadde hanner, hannene etter vekt. Klassene er Råfisklagets.
  - **Prisen** (`SPECIES.krabbe`): minstepris for levende krabbe fra 5.10.2026 per klasse: hann over 3,2 kg 296, 2,2–3,2 kg 291, 1,6–2,2 kg 246, 0,8–1,6 kg 66, hunn 80 og skadd hann 100 kr/kg. Under 0,8 kg er fri prising (20 kr er et anslag). Markedsprisen følger måneden (`pm`) etter Råfisklagets statistikk: 2025 i snitt 436 kr/kg, fra 151 i april til 614 i januar. Månedene mellom de kjente er anslått.
  - **Levende eller død:** krabben holdes levende og sløyes og ises ikke. Uten krabbekar faller friskheten 2,5 per time (den lever rundt et døgn), med `EQUIP.krabbekar` (28 000 kr, anslag) 0,4 per time. Under friskhet 40 er den død (`KC.dead`), og død krabbe vrakes til 0 kr med en melding fra mottaket og en linje på seddelen.
  - **Teinen** (`POTS`, endret 08.10.2026): bare én, den store krabbeteina (1,55 × 1,45 × 1,07 m, 2 200 kr, 40 krabber, krever teinehaler eller elektrisk haler). Nøkkelen er fortsatt `big`, og små teiner i gamle lagringer (om bord og i sjøen) blir store (`11-boot.js`). Plassen om bord (`gearMax.teine`) følger dekket (arbeidsdekk ca. 35–45 % av lengden × 80 % av bredden, 2,25 m² per teine, 3–4 i høyden): skiff 4, trebåt 6, snekke 9, havsjark 18, hurtigsjark 18, ny hurtigsjark 21, sjark 36 fot 20, kystbåt 15 m og 21 m 30. Grensen er 30 teiner per fartøy (Norges Kystfiskarlag i høringene; bør bekreftes i forskriften). Anslagene er våre, målene på teina er fra en nettbutikk. Prisene er anslag.
  - **Line og garn** (08.10.2026, etter Fiskeridirektoratets *Redskapshefte*): en stamp hyseline er 600 kroker (heftet: 200–600), et garn 28 m, og kystnære autolinebåter har opptil 20 000 kroker. Derfor har breisjark, kyst15 og kyst21 høyst 33 stamper (19 800 kroker), og kyst21 240 garn (6 lenker à 40; lenke = 10–40 garn). Garntallene for kyst21 er vår antakelse, uten kilde på høyeste antall garn per fartøy.
  - **Agn** (08.10.2026): sju slag i `BAITS`. Sild og lodde (14 kr/kg, hyse ×1,6, torsk ×1,2) og blekksprut (34 kr/kg, lange og brosme ×1,8) er nye, begge våre anslag uten kilde. Krokstørrelsen (hyseline mot bankline) velger fiskefamilien, agnet arten.
  - **Garntyper** (08.10.2026, `NETTY`/`NETOPT` i `10-gear.js`): torskegarn (156/180/200 mm, 1 500 kr), flytegarn (156/180, 1 700 kr, mest sei, `SELQ['garn:flyt']`) og blåkveitegarn (360 mm, 2 400 kr, `SELQ['garn:kveite']`). En lenke har `ty` (mangler den, er den torskegarn), og typen følger garnet gjennom kjøp, setting, trekking, deling og Drift. Maskevidden 360 mm, valgene for flytegarn og utvelgelsen er våre anslag uten kilde, og flytegarnet bryr seg ikke om dybden.
  - **Ekkoloddet og fangsttallene** (Jonas 21.10.2026, tilbakemelding #79): ekkoloddets bilde viser fisken som står der, likt for juksa, garn, line og teiner (`heatShown` = `heatValue`); rigget for garn ble «havet svart» fordi bildet hadde vist hva et garn tar. Ingenting regner ut fangst fra fisken i sjøen (`heatGearCtx`/`heatGearKg`/`heatGearInfo` er fjernet; boksen har ikke vist tall siden 09.10). Fangsttallene kommer bare fra fangst tatt om bord: fangstmerkene (kg/t på juksa, kg per garn, stamp eller teine med ståtid ved trekk) og driftsplanens «du fikk X her» (`planMark`). `HEATG.fair` er en vanlig fangst (garn 30, stamp 70, teine 20 kg; jukse 20 kg/t per hånd), fargen på merkene og planens nøytrale tall der det ikke er merker. Fangstmerkene: kilo per enhet med ståtid, fargen mot en vanlig fangst for den ståtiden (`heatSoakShare`); juksamerket mot riggen. Tallene for «vanlig» er våre anslag. `heatgeartest` sjekker bildet på alle rigger og merkene.
- **Stabilitet (08.10.2026, etter at en spillers skylagring ikke startet):**
  - **Én lagring per konto** (`cloudSync`/`cloudConflict` i `10f-cloud.js`): har både enheten og kontoen spilt siden sist, fortsetter den som har kommet lengst i spilletid (`sumT`), og den andre tas vare på (kontoens i `save_hist`, enhetens som `KEY_PREV`) under Innstillinger › Tidligere lagringer. Spilleren får bare en melding. Et spill tatt tilbake med vilje (`dsb_force`) går foran.
  - **Oppstart som feiler** (`bootFail` i `11-boot.js`): feilen sendes til admin (`cloudErr`, «boot: …»), og spilleren får «Prøv igjen», «Start i sikker modus (uten 3D)» (`#safe,no3d`) og «Hent forrige lagring» (bytter `KEY` og `KEY_PREV`). En lesing i en kartpakke som ikke er lastet, huskes (`dsb_needpk`) og lastes ved neste forsøk, høyst 8 ganger, før feilkortet vises.
  - **Ekte lagringer i testene:** `python3 tools/saves/fetch.py` (med `SUPABASE_SERVICE_ROLE_KEY`) henter alle lagringene til `tests/saves/` (i `.gitignore`, aldri i repoet, som er offentlig), og `savestest` starter hver av dem på en tom enhet og spiller to timer.
  - Krabbe har ingen kvote i fritt område og teller ikke i ferskfiskordningen.
  - **Gamle lagringer** (`S.kc` i `bootGame`): taskekrabbe i lasten fjernes, med en linje i loggen.
  - **Leveringen:** kongekrabben kan leveres ved alle mottakene i spillet. Mottakene i Finnmark kommer med M2.
- **Driftsplan:** Et veipunkt med redskap blir en stasjon: trekk og sett ut igjen langs samme strek, sett nytt om ingenting står der, og ta alt med hjem ved kuling innen 36 t.
  - Garn krever to om bord.
  - Line går til egnebua etter levering.
  - Teiner er en lovlig inntekt for en båt i åpen gruppe med ansatt skipper.
- **Kalibrering (startverdier):**
  - Hyseline 12 t i februar på et godt hysested: ca. 110 kg per stamp, 67 % hyse.
  - Garn 180 mm 20 t i mars vest av Gryllefjord: ca. 30 kg per garn.
  - Store teiner 24 t i september sør på Senja: ca. 1,5 kg per teine.
  - En dag med håndjuksa samme sted: ca. 430 kg for én person.
- **Priser (startverdier):** garn 1 500 kr, stamp hyseline 2 100 og bankline 1 700, teine 550/850, blåsesett 2 500, tung dregg 1 500, agn 18 kr/kg.

## 5.36 Utstyrsstatus, service og tilbakekjøp (Jonas 08.10.2026)

Alt dette ligger i `core/10b-gearcare.js` (kjernen) og i `ui/05-phone.js` (Beholdning og Service-siden), testet av `tests/caretest.py`. Tallene er startverdier uten kilde.

- **Hva slites:**
  - Line: selve lina (`cond`, med et tak `max` som synker 0,07 for hver reparasjon) og krokene (andel manglende `miss` og bøyde `bent`). Ny line kommer komplett. Under 35 % kan stamper gå av ved trekk.
  - Garn: `cond` som før, og et tak som synker 0,04 for hver bøting.
  - Teiner: én stand for teinene om bord (`pg.potc`), tak −0,05 per reparasjon. Under 30 % kan teiner gå tapt.
  - Juksa: pilk og markkroker (`mark`) og kveitepilk (`kveite`) i `pg.jig`, med reservesett. Valget er `S.target` (`mix` eller `kveite`). Fanger 0,65–1,0 av normalt etter standen.
  - Slitasjen kommer av bruk: tung fangst per enhet, grov sjø, lang ståtid og dypt vann (`wearOf`).
- **Fangsten:** `lineQ` (kroker og line) og `potQ` ganges inn i `soakHour`. Friske kroker (`sharp`, 3 trekk) gir ×1,05. `jigQ` ganges inn i `catchFactors`.
- **Kroker:** kjøpes i pakker på 100, 500 og 1000 hos utstyrsbutikken (`pg.hooks`). Mannskapet bytter fra lageret (300 kroker i timen per hånd), og friske kroker kommer når minst 15 % er byttet. Butikken bytter alle på halve tiden mot gebyr, med egne kroker.
- **Butikkens Service** (`Butikk › Service`, siden `service` i `05-phone.js`): reparasjon og bøting på halve tiden mot gebyr (`careQuote`), og tilbakekjøp (`sellGear`) til en firedel av nypris ganger (0,2 + 0,8 × stand), så det aldri lønner seg å kjøpe og selge. Egnede stamper kjøpes ikke tilbake.
- **Mannskapet selv** (`careTick`, én gang i timen i havn, bare med mannskap og uten andre jobber): bøter garn, bytter kroker fra lageret, reparerer line og teiner, bytter et slitt juksasett. Slås av med `S.settings.careAuto` i Beholdning.
- **Blåsesett og dregger** kan ikke kjøpes i flere enn redskapet kan bruke (`kitMax`: stamper, garn og teiner, også de i sjøen).
- **Fjernet:** «Klargjøring til neste tur» (`PREP` i `06-services.js`). Gamle jobber i lagringer droppes ved oppstart (`11-boot.js`).
- **Gamle lagringer:** `careInit` legger til feltene.
- **Ikke gjort:** pilker og juksamaskiner (elektrisk) har ingen egen slitasje utover settet; teinene har én felles stand.

## 5.62 Dekksutstyret: modulære modeller på båtenes festepunkter (Jonas 19.10.2026: «Alt må være modulært og kunne plasseres i alle aktuelle båter»)

Utstyret på dekk er egne Blender-modeller i `tools/deck/` og står på faste plasser i hver båtmodell, i stedet for å være bakt inn i båtene. Dataene bestemmer hva som vises.

**Modellene** (hver med egne deler i én GLB, lest med `glbPart`, `kit(f, navn)` og `kitX(f)` i `view3d.js`):
- `fisk.py` → `deck-fish`: kar på 300, 460 og 1000 liter (hvite, oransje og blå 460), blodvann (`vann`), knust is (`is`), høtt (`hott`, 90 cm), bløggekniv (`kniv`), plastsløyebord (`bord`, 115 × 60 cm) og sløyebenk i stål med renne (`benk`), bøtte (`botte`). Extras: karenes indre mål (`tubs`), tuppen på høtta og kniven, bordets arbeidsflate og avkappets slippunkt (`bord_drop`, `benk_drop`).
- `rigg.py` → `deck-rig`: linestamp (`stamp`), line i rødt og grønt (`line_r`, `line_g`), krokene på kanten (`kroker`), garnhaug (`garn`), trekasse (`kasse`, `kasse_s`) og EUR-pall (`pall`).
- `kran.py` → `deck-crane`: leddkran i 5–8 t·m-klassen bygd etter de målsatte tegningene Jonas sendte 20.10.2026 (PK 5001-EH, PK 3400, PK 33002, Hiab XS 322; 6,5 m hydraulisk rekkevidde, 0,75 t ytterst; pakket sammen 2,15 m lang og 1,89 m høy som PK 5001-EH) i deler med hvert ledd i sitt dreiepunkt (fot, søyle, indre og ytre bom med leddarmene `link1` og `link2` i knekken, to teleskop, krok, to sylindre, bomstøtte), og i extras stillingene `stow`, `park` og `work`, `a2_min` (hvor langt knekken kan lukkes ved hver vinkel på hovedbommen, så ingen deler går i hverandre), `klink` (leddarmenes vinkler), `fold_a1` (hovedbommens vinkel mens knekken lukkes og åpnes) og `stow_box` (den sammenpakkede kranens ytre mål).
- `anker.py` → `deck-anchor`: båtenes egne ankre, plogankeret (`plog`) og det stokkløse Hall-ankeret (`hall`), og kjettingledd uten og med stag (`link`, `stud`), se 5.7.
- `sikker.py` → `deck-safety`: radarkuppel (`radome`), åpen radar (`radar_ped`, `radar_bar4`, `radar_bar6`), livbøye med holder, lys og line, og redningsflåter i vugge med hydrostatisk utløser (4, 6 og 12 personer). Livbøyen har tekststriper (`boye_strip_top`, `boye_strip_bot`) der spillet skriver båtens navn og hjemhavn.

**Festepunktene** står i båtmodellenes `anchors['kit']` (spillets ramme, x styrbord, y opp, z akter): `tubs` (kar på dekk, [x, y, z, ry, størrelse]), `garn` og `stamps` (riggens plass), `cargo` (pallplasser), `raft` (flåtevugger), `buoys` (bøyeholdere med +z ut fra veggen), `radar` (kuppel), `radarA` (åpen antenne på masta) og `crane` (fot, retning, størrelse og bomstøtte). Det bakte utstyret (radar, flåte, livbøyer, kran, løse stamper og kar) er tatt ut av de ti kystbåtene. Havbåtene beholder sine, fordi de er skipets egne systemer.

**Hva som vises:**
- **Flåte og livbøyer** følger med båten etter forskrift om fiskefartøy under 15 meter (FOR-2013-11-22-1404, lest på Lovdata 19.10.2026), `lsaOf` i `02-species-gear.js`. § 38: redningsflåte til alle om bord på dekket fartøy over 6 m, med hydrostatisk utløser (med tre eller færre om bord holder en firemannsflåte etter ISO 9650-1). § 43: én livbøye per tredje person, minst én med 30 m flytende line under 10,67 m og to fra 10,67 til 15 m, halvparten med lys, alle merket med båtens navn og hjemhavn. Over 15 m gjelder andre regler; der er to flåter og fire bøyer (seks på havbåtene) vårt anslag.
- **Radaren** kjøpes i utstyrsbutikken: kuppel (`radar`, til båter med styrhus opp til 12 m) eller åpen antenne (`radarA`, 10–21 m). Antennen går rundt (24 o/min) når båten er ute. Radaren har ingen virkning i spillet ennå (ingen radarbilde); beskrivelsen i butikken sier bare det den gjør.
- **Kar med fisk:** båter med lasterom har bare bløggekaret (300 l med blodvann). Åpne båter uten lasterom (skiff, trebåt, snekke) har kar på dekk som fylles med sløyd og iset fisk lag for lag, på langs, under knust is.
- **Riggen:** rigget for garn står 1000-literskaret med garnhaugen, som synker når garnet settes og stiger når det trekkes. Rigget for line står stampene (opptil åtte) med lina, og de egnede med krokene på kanten. Både når båten bare er rigget og mens redskapen settes og trekkes står de på båtens plass (`rigAt`).
- **Dekkslast:** frakt på dekk (S.cargo opp til `deckCargo`) står som trekasser på paller, én for hver 250 kg, så små kasser oppå.
- **Kranene etter båtstørrelse** (Jonas 20.10.2026: «de større havbåtene skal ha kraner som krever bomstøtte, resten av de mindre båtene skal ha den sammenleggbare knekkbom-kranen. Hurtigsjarken kan ha kran.»): kyst15, kyst21, hurtigsjarken (0,5 t, kranen i 70 % på skapet i styrbord hekkhjørne, `hurtig11.py`) og den nye hurtigsjarken (0,5 t, Jonas 21.10.2026: «Hurtigsjarken min skal også ha kran»; kranen i 70 % på et rustfritt skap i styrbord hekk, `LOCKER` i `hs11.py`, foldet forover langs styrbord ripe, akter for blødekaret) har den sammenleggbare kranen fra `kran.py`. Havbåtenes kraner er skipets egne systemer i skrogmodellen og ligger på bomstøtter (`boom_rest` i `bpyutil.py`: stolpe med sadel, gummiforing, surring og stag): al45 begge kranene, tral60, not75 tårnkranen og bakkekranen, og krabbe50 med knekkbommen lagt ut rett akterover på en lav sadel på shelter-taket (`knuckle_fold`). Kraftblokk-kranen på not75 og den høye kranen på krabbe50 arbeider med bommen oppe.
- **Kranen** (båter med `crane` > 0): pakket sammen på sjøen i transportstillingen fra tegningene og bildene (Jonas 20.10.2026): høy søyle, hovedbommen 43° ned og fram fra toppen av søyla, ytterbommen brettet helt tilbake ved siden av den med teleskophodene oppe bak søyla (`stow`). Båter der bomstøtta i kitet (`crane.rest`) stemmer med modellens `rest_at`, legger bommen i støtta (`park`); i dag gjør ingen av dem det (kyst15 har støtta 2,1 m fra kranen, modellen vil ha 3,1 m), så begge pakker kranen sammen. Ved kaia, mens frakt lastes eller losses (jobben `last`), folder den seg ut og går en runde på 40 s: over en lastplass, kroken ned og opp, svinger ut over kaia på styrbord side, ned og opp, og tilbake. Kassa henger på kroken fra kaia (lasting) eller til kaia (lossing). Rekkefølgen følger kranmanualen (Palfinger PK 23002, s. 38 og 71–72): ved sammenfolding teleskopene inn, svingen hjem, hovedbommen opp til `fold_a1`, knekken lukket, og så hovedbommen ned; ved utfolding omvendt. Hvert ledd har sin fart (utfolding ca. 16 s, sammenfolding ca. 19 s).

**Animasjonene på dekk** (Jonas 20.10.2026: «Fisken skal høttes ombord, bløgges, sløyes, legges i kasse og ises. Alle deler av arbeidsprosessene må ha egne animasjoner»): hver fisk som kommer om bord er den ekte fangsten (`CATCHQ`), én om gangen, og går fra hånd til hånd (`dkEvent`, `dkFor`, `dkTick`, `DKDECK` i `view3d.js`). På linetrekket hugger haleren fisken med høtta i rekka og rister den av kroken på dekket ved seg (`gaff`, `places().drop` i `deckcrew.js`); på garnet plukker den ved siden av haleren den ut av maskene og slipper den der (`pick`); bløggeren tar den opp, kniven i strupen, blodet renner, og kaster den i bløggekaret (`bleed`, uten bløgger gjør den som tok den inn det). Jukser mannskapet for hånd, dras fisken opp hånd over hånd (`jigup`) og bløgges av den som juksa; med maskiner som før. Sløyeren (`gutw`) tar en fisk fra karet, legger den på bordet, skjærer, tar ut innmaten og kaster den over rekka (måkene kommer), og kaster den sløyde i kassa foran pakkeren; pakkeren (`pack`) legger den til rette og måker is over fra isboksen; når 40 kg er pakket, bærer han kassa til luka og senker den i rommet (`stow`; de åpne båtene pakker i karene sine). I den åpne båten bløgger skipperen hver fisk ved rekka før den går i karet. Egning og rensing (`egn`, `strip`): sittende på en bøtte ved stampen, kroken fra kanten, agnet fra bøtta på høyre side, kroken ned i stampen; de egnede krokene kommer på kanten etter hvert (de gamle av ved rensing, og bøtta tømmes over rekka for måkene). Bøting (`mend`): garnet trekkes fra karet over rekka foran den som bøter, med bøtenål. Stampene og garnet blir stående på dekk mens jobben går (`pg.shore` `egnself`, `stripself`, `mendself`). Den som strekker seg etter karet eller kassa, snur seg dit (`workTurn`) og går ned i knærne (`workLow`). Test: `workshot.py` (3D).

**Test:** `tests/deckshot.py` (3D): alle delene er med, hver kystbåt har plassene dataene krever, flåtene og bøyene tegnes i tallet reglene krever med tekst på hver bøye, radaren vises og går rundt, de åpne båtene har fangsten i kar, kranen er foldet på sjøen og ute ved kaia med kasser på dekk; bilder `deck_*.png` liggende og to stående. `G3._debug.kitStat` viser hva siste bilde tegnet av utstyret.

## 5.63 Redskapet om bord, agnet og juksa, synlig uten hint (tilbakemelding #74, Jonas 20.10.2026)

Spilleren fikk ingenting på juksa selv om ekkoloddet viste mye blåkveite, og fant ikke banklina sin under «Sett ut» (bare hyselina var egnet). Jonas: «Ikke vis hint, men det må gjøres mer intuitivt hva båten har slags fiskeredskaper ombord og hva disse eventuelt er egnet med», og agnet må kunne tas av for å egne med noe annet. Løsningen viser tilstanden slik den er, uten tips.

- **Stampene i rad** (`tubsHtml`, `tubLegend`, `tubState` i `ui/10-gear-ui.js`): hver stamp er et merke, fylt i agnets farge (`BAITCOL`), stripet mens mannskapet egner eller renser den, åpent når den ikke er egnet, med navn og antall under. Det står i Beholdning › Redskap (linekortet, `lineCard` i `ui/05-phone.js`), på Agn-siden på mottaket og i kartplotterens redskapsfelt (`gearPanel`). I sjøen sier hvert sett linetype og agn (teinene sitt agn).
- **Egn med valgt agn:** «Egn …» på linekortet åpner en velger med alle sju slag (kilo om bord, hvor mange stamper det rekker, hva det tar best) og antall; «selv» trenger agnet om bord, egnebua (på mottakets kai) selger det den bruker.
- **Fjern agn** (`stripSelf(lk, bait, n, then)` i `core/10-gear.js`): en jobb for mannskapet (`kind:'strip'`) på en tredel av egnetida; stampene er hos mannskapet imens (`pg.shore` `stripself`, som ved egning), det gamle agnet kastes, og de kommer tilbake uegnet. Velges et nytt agn (`then`), egnes de med det med én gang. Uten nytt agn står de uegnet (`bare`), og mannskapets egen egning (uten valgt agn, `egnFreeAuto`) lar dem være. Stasjonen og animasjonen for jobben lages i `core/13-work.js` og `deckcrew.js` (`CREW_JOBS` i `10b-gearcare.js` må ha `'strip'` for at jobben skal gå på sjøen).
- **Sett ut** (`setChoices(all)`): ett valg per linetype og agn («4 stamper bankline · makrell»), teinene per agnslag; uegnede stamper står som en grå rad med tilstanden, og et trykk åpner linekortet. Valget bærer agnet (`spec.bait`), og `startSet` tar de stampene.
- **Juksa:** viften viser utstyret som valg med artene det tar (`jigSets`, artsbrikker fra `jigTake`): «Markkroker og pilk» og, med kveiteutstyr om bord, «Kveitepilk» (bare kveite), fredet i fredningstida. `jigTake(sp, H, tackle)` er artens juksefaktor (`SPECIES.jig`) ganger kveitepilkens virkning (`targetF`, som har fått `pilk` som valgfritt argument). Ekkoloddet viser all fisken som står der, også blåkveita (21.10.2026), og regner aldri ut fangst. Juksespillet (`ui/10-rod-acts.js`) bruker også `jigTake`.
- **Fiskeguiden** leser redskapet av modellen: juksa (`jigTake`), kveitepilken over et døgn med tidevann i sesongen, garn og line (`SELQ`, linene med beste agn); prikker mot artens beste redskap, «–» der redskapet tar under en tidel av vanlig juksa. Blåkveite: Juksa –, Kveitepilk –.
- **Kjøp:** kveitepilk (reservesett) krever kveiteutstyr om bord (`buyGate('jig', 'kveite')`, `docs/handelssteder.md`). Butikken har ikke lenger agnknapper (agn selges på mottaket), og tekstene om halere, egning og kroketall er rettet.
- **Test:** `tests/geartest.py` (egning med valgt agn, fjerning og ny egning, valg per agn, `bare`, kjøpsregelen), `tests/heatgeartest.py` (juksas ekkolodd), `tests/guidetest.py` (Kveitepilk, «–» for blåkveite).
