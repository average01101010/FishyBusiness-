# Kystfiske – overlevering fra chat til Claude Code

Skrevet 29.09.2026 ved flytting fra claude.ai-chat til Claude Code. Dokumentet samler beslutninger, regler, tall og arbeidsmåte som ikke står i koden. Les det sammen med `docs/spesifikasjon.md` (fiskerisystemet) og koden.

- Siste publiserte versjon fra chatten: https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f (flåtemodell fase 1).
- Spesifikasjon (Claude Doc): https://claude.ai/code/artifact/0ca28240-d946-46b1-802b-b4b511e9398d
- Spillfila: én selvstendig HTML-fil, `kystfiske-prototype.html` (~4,3 MB, all kart- og terrengdata innebygd som base64).

## 1. Visjon og sjanger

- **Sjanger:** Tycoon-/managementsimulator med idle-elementer for kystfiskeflåten. «Fra jolle til rederi»: spilleren starter med en 19-fots skiff og fiskestang i Finnsnes/Senja og bygger et rederi med en flåte, driftsplaner, skippere og kvoter.
- **Stigen:** kystfisker (skiff, egne hender) → sjarkeier (større båt, mannskap, kvote i lukket gruppe) → småreder (2–3 båter, ansatte skippere, driftsplaner) → reder (flåte, ulike redskap og felt) → verdikjede (mottak, isanlegg, verksted) → imperium (nye regioner, konkurranse, topplister).
- **Idle-løkke:** Hver båt har skipper og driftsplan. Flåten fisker, leverer og fyller drivstoff og is mens spilleren er borte. Spilleren kan alltid gå om bord og ta roret selv.
- **Realisme er kjerneverdien.** Regler, priser, kvoter og båtoppførsel skal være så ekte som mulig. Forenklinger skal være bevisste og dokumenterte. Jonas er fra Finnsnes og har maritim bakgrunn, så han merker urealistiske detaljer.
- Målgruppe: voksne.

## 2. Arbeidsmåte og preferanser

- Kommuniser på **norsk**. Kodekommentarer og identifikatorer er på engelsk.
- Jonas spiller og tester på **nettbrett** (Android). UI må fungere på berøringsskjerm i stående og liggende format.
- Ved større funksjoner: **legg fram en konkret plan og vent på klarsignal**. Når Jonas sier «snakk uten å bygge» eller «vent til jeg gir klarsignal», skal ingenting bygges.
- Når han sier «kjør på», bygg, test og lever.
- Etter hver endring: kjør regresjonstestene, og lever en fungerende versjon. I chatten ble fila publisert som artifact hver gang.
- Vær ærlig om feil. Si fra når en test er svak, når noe er antatt, eller når en regel er usikker.
- Sjekk regelverk mot kilder (Lovdata, Fiskeridirektoratet, Råfisklaget) før regler bygges inn, og oppgi kilden.

## 3. Status nå

**Ferdig og publisert (i rekkefølge):** fiskerisystemet, redskapsstige og animasjoner, tempo 1:6, lukket gruppe-kjøp med lån, «Neste mål», haill, pub og verkstedovertid, kveitefiske med fredning, NPC-kaiplasser og trykkprioritet i kartplotteren, jevnere båtbevegelse, «Kaffe på kaia», fiskekar, rengjort bunn, bestillinger, klær og kulde, mannskapssystemet med Mannskapsbørs, og **flåtemodell fase 1**.

**Påbegynt, ikke bygget:** flåtemodell **fase 2** (flere båter). Designet er ferdig og godkjent, se kapittel 9. Ingen kode for fase 2 er skrevet ennå.

## 4. Teknisk arkitektur

### 4.1 Én fil, flere lag

1. **Kjerne:** simulering, tilstand `S`, arter, priser, kvoter og regler.
2. **UI:** HUD, handlingslinje (`#actbar`), panel, telefonen `PHONE` med apper, overlays (`PUBW`, `DAILYW`, `ROD`).
3. **3D:** `G3`, en egen WebGL-renderer for sjø, terreng, båter og effekter. Kartplotteren er Canvas2D og SVG.
4. **Data:** base64-blobber i `<script type="application/octet-stream">`, blant annet dybde, høyde, land, vei og bygg.

### 4.2 Tilstand og tid

- `S` er hele spilltilstanden. Lagres i `localStorage` under `KEY`, med `v:1`.
- Kart i km-rutenett: x østover, y sørover. Grenser lat 68,98–69,72 og lon 16,55–18,55. `KX = 111,32·cos(69,35°)`, `KY = 111,32`.
- `EPOCH` = mandag 1. mars 2027 kl. 06:00 UTC. `S.t` er spillminutter siden EPOCH, og `H = S.t/60`.
- `GAME_RATE = 6` spillminutter per ekte minutt. Ett spillår er rundt to ekte måneder, og en fisketur rundt én kveld. `S.mult` er en testmultiplikator.
- `step()` kjøres én gang per spillminutt. `catchUp(realMs)` spiller av fravær, opp til `CATCHUP_CAP`.

### 4.3 Flåtemodellen (fase 1, ferdig)

- `S.fleet` er en liste av fartøy, og `S.cur` er båten som følges.
- Alt som hører til én båt, ligger i fartøyet under nøklene i `VKEYS`: `boat, plan, hold, crew, equip, jobs, cevt, ops, lic, quota, draft, draftSpeed, draftDep, marks, target, tubs, clean, trail, fsess, facc, fnext, fishPlanH, workLog, clothes, tripBuff, prep, svcTold, boatName, lastSale, restWarn, kvRel, codWarn, lastIceWarn, navrows`.
- `S.boat`, `S.hold` og de andre er **alias** som peker på fartøyet som er bundet akkurat nå. All eldre kode virker derfor uendret.
- Hjelpefunksjoner:
  - `curVessel()` gir båten som følges.
  - `storeVessel(v)` kopierer tilbake til fartøyet.
  - `bindVessel(v)` setter aliasene og kaller `applyVessel()`.
  - `ensureFleet()` lager en flåte med én båt fra en gammel lagring.
  - `withVessel(v, fn)` binder midlertidig en annen båt.
  - `eachVessel(fn)` kjører en funksjon for hver båt.
- `step()` kjører først en felles del: bestillinger, Mannskapsbørs, marked, bestand og `hourly()`. Deretter kjøres `crewTick`, `navHour` og `vesselStep(H)` for hver båt via `eachVessel`.
- **Lagring:** `save()` skriver flåten én gang og fjerner VKEYS fra toppnivået. `load()` binder aliasene til båten som følges straks lagringen er lest, før noe annet leser `S.boat`.
- **Viktig ved bytte:** Primitive verdier (tall, strenger) må skrives tilbake med `storeVessel` før man bytter båt. `save()` gjør dette selv.
- **Rederinivå, ikke per båt:** `cash, loan, stats, sales, msgs, log, market, stock, orders, rep, bors, daily, haill, pubE, settings, company, owned, tut, lang, me` (fase 2).

### 4.4 Konvensjoner og fallgruver i koden

- **Telefonknapper bruker `data-pa="handling"`.** `data-a` er en *parameter*, for eksempel appnavn for `data-pa="open"`. Dette ga en feil der driftsplanknappene aldri virket.
- **Nye apper** krever tre ting: en linje i `APPS`, et ikon i `IC` (SVG), og funksjonsnavnet i render-kartet `{vaer, post, salg, …}` i `shell()`.
- `BOAT` er et `const`-objekt som oppdateres med `Object.assign(BOAT, VESSELS[type])` i `applyVessel()`.
- **Nye lagrede nøkler** må legges til i standardlista i lastekoden, `for (const k of ['equip', 'crew', …])`. Nøkler per båt legges i `VKEYS`.
- **Telefonoverskrifter:** `L(no, en)` i telefonen, `t(key)` i panelet (ordbok), og `LS(...)` for korte og lange knappetekster.
- **3D-kamera mot styrbord side,** der skipperen står: `cam.yaw = -0.85`.
- Hendelser i 3D fra simuleringen går via `window.CATCHQ`, som er fangstkøen for fiskeanimasjonene.

## 5. Systemer i spillet

### 5.1 Båter og utstyr

| Båt (`VESSELS`) | Pris | Last | Mannskap | Merknad |
|---|---|---|---|---|
| `skiff`, åpen 19 fot, 60 hk påhengs | 95 000 | 350 kg | 1 + 1 | Startbåt, planende, 24 kn |
| `snekke`, 26 fot, 30 hk diesel | 245 000 | 900 kg | 1 + 2 | 8 kn, deplasement |
| `sjark`, 34 fot (10,4 m), styrhus | 1 150 000 | 3 000 kg | 1 + 3 | 600 L diesel |
| `sjarkny`, 10,99 m ny | 6 400 000 | | | Byggetid 45 døgn på verftet i Finnsnes |

**Redskapsstige:**
- *Fiskestang med én sluk:* effekt 0,35 per person. Alle starter med den.
- *Håndjuksa med pilk og fire markkroker:* 1 900 kr, effekt 1,0.
- *Juksamaskin:* 34 000 kr, effekt 1,3 hver. Én person passer tre.
- *Kveiteutstyr:* stor pilk, kraftig snøre og gaff, 2 490 kr.
- *Senere:* garn eller line etter spillerens valg, deretter teiner.

Mister du juksa, fiskes det videre med stang. `motor90` er et utstyrsvalg for skiffen (30 kn).

### 5.2 Kart, fjordlinje og fangstfelt

- **Fjordlinja** (`FJORD`, `insideFjord(p)`) går fra Andøya via Skrolsvik, Gryllefjord, Hekkingen og Sommarøy til Kvaløya. Punktene er hentet fra Fiskeridirektoratets kart, kalibrert mot tre flyplasser.
- Innenfor fjordlinja er det forbudt for båter på 15 m eller mer å fiske, snurrevad er forbudt, line har høyst 5 000 kroker og torskegarn høyst 80 garn. Linja tegnes stiplet fiolett i kartplotteren.
- Den eneste NPC-båten på 15 m eller mer (20,9 m, fra Mefjordvær) har bare fangstfelt utenfor linja.
- **Fangstfelt** (`FIELDS`, `fieldCode(p)`): 05-25, 05-29, 05-30, 05-31, 05-40, 05-41 og 05-42, tilordnet med nærmeste punkt. Koden vises på sluttseddelen.
- **Kjente felt** (`GROUNDS`): Havet nord for Husøy, Utenfor Mefjorden, Vest av Gryllefjord, Malangsgapet, Gisundet og Solbergfjorden.

### 5.3 Fiskerimodellen

- **Arter** (`SPECIES`): torsk (kysttorsk og skrei), hyse, sei, lyr, lange, brosme, uer og kveite.
  - Hver art har månedlig tilgjengelighet (`av`), dybde (`dep`), eksponering (`prod`) og markedspris (`pm`).
  - Den har også ukentlig prisvariasjon (`sig`), størrelsesfordeling (`size`, lognormal), minstemål (`minKg`) og størrelsesklasser med minstepris (`cls`).
  - Fra sløyd uten hode til rund vekt regnes det med `uh`. Lever og rogn har egne priser.
- **Kalibreringsfaktor per art** (`k`):

| Torsk | Hyse | Sei | Lyr | Lange | Brosme | Uer | Kveite |
|---|---|---|---|---|---|---|---|
| 0,37 | 0,3 | 0,6 | 0,3 | 0,3 | 0,35 | 0,5 | 0,35 |

- **Skreipulsen** (`skrei`): 0,6 / 2,0 / 2,5 / 0,8 for januar–april, 0,1 i desember. Den virker bare på eksponerte banker på 40–250 m og på de tre ytre feltene (`skreiSpot`).
- **Fangst:** `density() × luck(sp) × targetF(sp) × innsats × værstraff`, deretter trekkes hver fisk for seg med egen vekt.
  - Fisk under minstemålet slippes.
  - Kveite i fredningstiden eller over 100 kg slippes.
  - Uer utenfor juni–august er bare bifangst (×0,15).
- **Kalibrering** (én person med håndjuksa, 8 timer):
  - Skreidag på godt felt: 350 kg, altså full last på skiffen.
  - Juli: rundt 80 kg.
  - Seistim i mai: rundt 180 kg.
  - Bare fiskestang: rundt 100–145 kg.
  - Mål for åpen gruppe i 2024 (Lofoten, Vesterålen, Senja og Tromsø): 5,3 t torsk, 3,0 t sei og 1,2 t hyse per båt og år.
- **Kveitefiske** (`S.target = 'kveite'`, krever kveiteutstyr):
  - Kveite får faktor ×9, og best rundt strømstille: ×(1,4 − 0,8·strømstyrke). Andre arter får ×0,2.
  - Juksamaskiner hjelper ikke.
  - Resultat: rundt én kveite per dag i september og 1,5 i oktober, 2 000–3 000 kr per dag.

### 5.4 Priser, kvalitet og salg

- **Prismodell:** `clsPrice = max(minstepris × kroktillegg, markedspris × havnefaktor × tilbudsfaktor × klasseforhold × metningsfaktor)`.
  - `weekDev` er et ukentlig AR(1)-avvik: 0,7 × forrige + støy.
  - `supplyFactor` ligger mellom 0,97 og 1,03.
  - Torskekurven er skalert til 2026-nivå med faktor 1,06.
- **Minstepriser:** dynamiske for torsk, hyse og sei fra 21.09.2026. De andre artene har faste minstepriser fra våren 2026. Tabellen står i spesifikasjonen og i `SPECIES.cls`.
- **Kvalitet** (`GM`):

| E | A | B | X (skadd) | V (vrak) |
|---|---|---|---|---|
| +5 % | 100 % | −15 % | −40 % | 1 kr/kg |

- **Kroktillegg:** Krokfanget hyse over 1,1 kg får +12,8 %.
- **Sløying om bord** (innstilling): fisket går 15 % tregere, men hyse og sei slipper sløyetrekket på 0,30 kr/kg, og du får betalt for lever og rogn. Lever er 5 % av vekta. Rogn er 4 % for torsk i januar–april og 1 % ellers.
- **Sluttseddelen** viser art, størrelse, kvalitet, kilo, kilopris, lever og rogn, inndragning, ferskfiskordningen, bestillinger og fangstfelt.
- Alle priser i spillet er per kilo **rund vekt**.

### 5.5 Kvoter og regulering

- **Åpen gruppe, J-30-2026 § 21:**

| Lengde | Maks torsk | Garantert torsk |
|---|---|---|
| Under 8 m | 4,0 t | 3,0 t |
| 8–9,99 m | 5,6 t | 4,2 t (uavklart, se kap. 10) |
| 10 m og over | 6,4 t | 4,8 t |

  Hyse og sei er fritt fiske, med garantert 4,0/5,6/6,4 t hyse og 5 t sei.
- **Stopp i maksimalkvotefisket** (`codStopDoy`): 15. mai i 2025 og 16. april i 2026. Andre år trekkes en dato mellom 8. april og 20. mai. Kystposten varsler en uke før.
- **Ferskfiskordningen** (`ffPct`): 20 % fra 29. juni, 30 % fra 15. september, 40 % fra 13. oktober og 10 % fra 15. desember, av ukas ferske landinger. Hyse under 0,8 kg teller ikke.
- **Rekkefølge ved levering:** ferskfisktillegget først, så kvoten, og resten inndras. Verdien av inndratt fisk trekkes fra.
- **Lukket gruppe** (`LIC_OFFERS`, kjøpes i Fartøy-appen):
  - *Snekke med kvote under 7 m:* 9,562 t torsk, 2,4 mill. kr.
  - *Sjark med kvote 10–10,9 m:* 17,78 t torsk, rundt 5,15 mill. kr.
  - Kvotepris rundt 225 kr per kg torsk. Anslaget bygger på Riksrevisjonens nivå fra 2017 og prisutviklingen siden.
  - Lån opptil 80 % over 15 år til 6,9 %. Fast fartøykvote uten stopp.
- **Ikke med i spillet:** Alderstillegg, fordi spilleren ikke har noen alder, og kystfiskeordningen, som gjelder Sørreisa men ikke Finnsnes.
- **Kveite, høstingsforskriften § 39:**
  - Fredet nord for 62° N fra 20.12 til og med 20.4, for alle redskaper.
  - Minstemål 84 cm, minstevekt 7,2 kg ved salg.
  - Kveite over 200 cm skal slippes.
  - Ingen kvote.
- **Uer:** Direktefiske bare med juksa i juni–august for båter under 15 m.

### 5.6 Mannskap

- **Mannskapsbørsen** (app `bors`):
  - Kandidater følger fiskerregisteret 2025. Aldersgrupper: 4,3 / 19,4 / 19,5 / 16,7 / 20,1 / 16,1 / 3,9 %. 6 % kvinner. 10,8 % har biyrke og er om bord fredag–søndag.
  - Én eller to nye kandidater kl. 07 hver dag, ofte ingen i skreisesongen. Hver søker hyre i 2–5 dager, og det er høyst 6 i børsen.
  - Stjernene er anslag, og det andre trekket er skjult til det er avslørt.
  - Forhandling ned 2 prosentpoeng lykkes i 60 % av tilfellene, 35 % for stolte folk.
  - Mønstring skjer i havn. Pubrykter kan avsløre skjulte trekk.
- **Egenskaper** (1–5): erfaring, styrke, utholdenhet, teknisk, kokk og sjømannskap. **Redskap:** juksa, line, garn og teiner.
- **13 trekk:** arbeidsjern, kranglefant, spøkefugl, grinebiter, perfeksjonist, lokalkjent, sjøsyk, ølglad, lærevillig, rastløs, makelig, omsorgsfull og stolt. Alle har fordeler og ulemper, se `TRAITS` og `crewEff`.
- **Trivsel** drifter mot et mål:
  - Utgangspunkt 60, pluss (lott − ønsket lott) × 300.
  - Pluss eller minus opptil 12 for ukesinntekt mot forventning.
  - Kokk: (beste kokk − 2,5) × 3.
  - Minus (slitenhet − 50) × 0,5.
  - Minus kulde × 50.
  - Minus grov sjø, med ekstra straff for sjøsyke.
  - Trekkeffekter, nag × 5, brudd på hviletid −8, og uløst konflikt −10.
  - Driftshastighet 0,04 per time (0,07 for rastløse).
- **Oppsigelse:** Under grensen i mer enn 36 timer fører til oppsigelse i neste havn. Grensen er 22, 30 for rastløse og 15 for grinebitere.
- **Slitenhet:** +6 per time ved fiske og +3 ved seiling, skalert med utholdenhet og høyere om natta. Den går ned med 8 per time i havn.
- **Hviletid:** Minst 10 timer hvile per døgn (arbeidstidsreglene for fiskere). Brudd gir advarsel og 1,5 ganger raskere slitasje.
- **Kjemi** (`compat`): trekk, samme hjemsted, aldersforskjell over 30 år, og nag.
- **Konflikter** (`S.cevt`):
  - Mellom mannskapet (`PAIR_TOPICS`): løses ved å snakke med dem, ta parti, gi fri eller si opp.
  - Med skipperen (`BOSS_TOPICS`): løses ved å høre på, stå på sitt eller si opp.
  - Uløst etter 12 timer blir det verre, og etter 48 timer mønstrer noen av.
- **Utvikling:** Hver 40. time på sjøen øker erfaring og redskap, dobbelt så fort for lærevillige. Skjulte trekk avsløres etter 12 timer på sjøen.
- **Testet:** Vanlig drift med 10 timers fiske og klær ga trivsel 60–70. Hardkjøring med 20 timer per døgn fikk alle tre til å si opp innen fire døgn.

### 5.7 Driftsplan (`S.ops`, per båt)

- Lagret rute som driftsplan, med skipper, ukedager, avgangstid og vindgrense.
- `opsStep` tar værsjekk, fyller drivstoff, is og redskap, og drar. `opsLanded` selger, fyller på, sender rapport og gir skipperen 5 % bonus.
- **Fase 2** endrer hva en ansatt skipper får fiske i åpen gruppe, se kapittel 9.

### 5.8 Bestillinger (`CUSTOMERS`, `ordersTick`)

- **Kjøpere:** Mottakene på Husøy, i Senjahopen, Gryllefjord og Botnhamn. Fiskebutikken og hotellet på Finnsnes leverer via Botnhamn. I tillegg restauranten i Senjahopen.
- **Tilbud:** Nye bestillinger kl. 06, én eller to per dag og høyst 3 åpne. Hver må besvares innen ett døgn.
- **Hva som bestilles:** Bare arter som er fangbare nå. Torsk bare hvis det er over 150 kg kvote igjen.
- **Tillegg:** Store mottak betaler 10–20 %, små kunder 20–40 %, ganget med omdømmet. Bonus ved fullført bestilling.
- **Omdømme:** Fullført gir +8, tapt frist −10. Omdømmet vektlegger hvilke kunder som bestiller.
- Fisk som oppfyller kravet går først til bestillingen når du leverer i riktig havn.

### 5.9 «Kaffe på kaia» (daglig belønning, `DAILYW`)

- Én gang per **ekte** døgn. Åpner seg selv når ingen andre vinduer er åpne og veiledningen er ferdig (`S.tut === 0`).
- **Ukeplan:**

| Dag | Premie |
|---|---|
| 1 | Lånte fiskekar |
| 2 | Full is |
| 3 | Rykte og 1 500 kr |
| 4 | 30 L drivstoff |
| 5 | Fri pubrunde |
| 6 | Rengjort bunn |
| 7 | Overraskelse |

- **Kaffekopp:** Du velger 1 av 3 kopper (`CUPS`): 40 % 500 kr, 20 % 1 000 kr, 15 % is, 15 % rykte, 10 % ingenting.
- **Milepæler:** 10, 30, 60 og 100 dager gir 10 000, 25 000, 50 000 og 100 000 kr.
- **Tilgivende rekke:** Én fridag per uke, og hver tapt dag koster bare ett trinn. Aldri betaling for å redde rekka.

### 5.10 Haill og pub

- **Haill selges kun for ekte penger.** Den er i testmodus nå, uten betaling. Kan også vinnes på puben.
- **Haill gjelder hele rederiet,** alle båter. Jonas' begrunnelse: det koster ekte penger.

| Type | Pris | Effekt |
|---|---|---|
| Kveithaill | 19 kr | ×3 kveite ved kveitefiske, ×1,5 ved vanlig fiske, ingen minus |
| Haill | 29 kr | +10 % på alle arter |
| Luksushaill | 59 kr | +20 % på alle arter, +35 % på torsk |

- **Ferskvare:** Full effekt i 2 døgn, deretter lineært ned til 0 etter 7 døgn. En ny haill erstatter den gamle.
- Haillen vises i HUD og som pynt på gelenderet i 3D (gullhestesko eller liten fisk).
- **Pubrunden** (`PUBW`):
  - 1 000 kr i spillkroner, én gang per spillkveld mellom 15:00 og 03:00, bare i havn.
  - Lykkehjulet: kveithaill 18 %, rykte 20 %, haill 7,5 %, luksushaill 1,5 % og tomhendt 53 %, med humoristiske replikker. Oddsen vises.
  - Frie runder fra kaffen brukes i stedet for tusenlappen.

### 5.11 Kulde, klær og fiskekar

- **Effektiv temperatur** (`effTemp`): Vindavkjølingsformelen. `coldPen` gir opptil 35 % kuldestraff og 15 % våtstraff.
- **Klær, per person:**
  - *Oljehyre* (1 290 kr): kulde ×0,85, våt ×0,2.
  - *Varmedress* (3 490 kr): kulde ×0,3, våt ×0,6.
  - *Begge:* kulde ×0,25, våt ×0,15.
- **Test ved −12 °C effektivt:** Fisket gikk 27 % tregere uten klær, 21 % med oljehyre og 6 % med begge.
- **Fiskekar:** +30 % last, altså 110 kg på skiffen, til neste landing. **Rengjort bunn:** −10 % drivstoff i 5 døgn.

### 5.12 Verksted

- **Overtid** med spillkroner: halverer resten av tiden på jobben som pågår, for 950 kr per spart time.
- **Hastejobb:** ferdig med én gang. Tenkt for ekte penger (15 kr), gratis i testmodus.

### 5.13 Båtbevegelse og animasjoner

- **Simuleringen** (`sailV`):
  - Planende båter akselererer 10 kn per minutt, deplasementsbåter 3 kn per minutt. Nedbremsing går 1,5 ganger så raskt.
  - 5 kn innenfor 250 m fra en havn.
  - Bremsing før neste stopp (havn eller fiskeplass) langs ruta.
  - `livePose` bruker samme fart som neste steg.
- **3D-følgeren** (`updateBoat`):
  - Styrer mot et punkt litt lenger fremme på ruta (pure pursuit).
  - `TURN_R`: skiff 35, snekke 45, sjark 70 og sjarkny 80 m.
  - Dreiepunktet ligger en tredel fra baugen, så hekken slår ut.
  - Sideskrens: β = 0,14·yawrate, begrenset til 0,18 rad.
  - Planende båter krenger innover (−0,18·yaw), deplasementsbåter utover (+0,06·yaw).
  - Båten flyttes direkte til simuleringens posisjon hvis den er mer enn 900 m unna.
  - `G3._debug.stepBoat(dt, t, frac)` brukes til frakoblet testing med 60 bilder i sekundet.
- **Fiskeanimasjoner:**
  - Stang: skipperen rykker og svinger fisken inn.
  - Håndjuksa: snelle med sveiv på ripa, og én til fem fisk på pilk og markkroker.
  - Juksamaskiner: haler selv.
  - Figuren har armer som tegnes live (`limbM`, armløs kropp + rør).
  - Fiskekaret regner bort fisk som fortsatt er i lufta.
- **Stangfisket** (`ROD`): minispill med napp, kamp, stramming og brudd. Automatisk fangst halveres mens det pågår.

### 5.14 NPC-flåte og kartplotter

- **Kaiplasser** (`berthSlot`, `berthShift`): Hver NPC-båt har en egen plass langs kaia, 30–60 m fra havnepunktet. Plassen er kontrollert mot land, og båter i samme havn ligger minst 20 m fra hverandre. Forskyvningen avtar over 150 m.
- Kystruteskipet og ferja har egne plasser, 70 m unna.
- **Trykk i kartplotteren:** Trykk nær en havn går til havna, ikke til en fortøyd båt. Fortøyde AIS-mål tegnes mindre og svakere.

## 6. Regelverk og kilder

| Tema | Kilde | Hovedpunkter |
|---|---|---|
| Kvoter nord for 62° N | J-30-2026 (endret flere ganger i 2026) | Se 5.5. Stopp 16.4.2026 |
| Deltakelse | Deltakerforskriften 2025/2026 (Lovdata) | Eier med ≥ 50 % i båt i lukket gruppe gjør at andre båter ikke kan være i åpen gruppe. Eier med båt i åpen gruppe kan ikke ha flere der |
| Eier om bord | Fiskeridirektoratets høringsnotat 26.03.2026 | I åpen gruppe må eieren selv være høvedsmann om bord (unntak ved sykdom, graviditet med mer) |
| Én båt | NFD pressemelding 19.12.2025 | «Ein person, ein båt, ein kvote» |
| Bifangst uten adgang | J-30 § 35 | Høyst 10 % torsk, hyse og sei samlet per landing, og høyst 2 t torsk |
| Kveite | Høstingsforskriften § 39, 2026 | Fredet 20.12–20.4, 84 cm / 7,2 kg, slippes over 200 cm |
| Minstepriser | Råfisklaget, 21.09.2026 og rundskriv 7/2026 | Se `SPECIES.cls` |
| Priser og sesong | Råfisklaget, salgsstatistikk 2025 | Troms-sonen, fersk |
| Fiskere | Fiskerregisteret 2025 | 9 210 med fiske som hovedyrke og 1 115 med biyrke. Troms 963, 6 % kvinner, 24 % under 30 år |
| Kvotepris | Riksrevisjonen 2017 | 9-meters hjemmel rundt 1,8 mill. kr |
| Hviletid | Arbeidstidsreglene for fiskere | ≥ 10 t hvile per døgn og ≥ 77 t per uke (per uke ikke modellert) |

**Følg med på:**
- Arbeidsgruppens rapport om åpen gruppe fra 23.06.2026, som foreslår minstekvantum og aldersgrense 30 år.
- Høringen om kveiteregulering, som kan gi åpen gruppe for kveite for båter under 15 m.

## 7. Monetisering: prinsipper

- **Haill** er det eneste som selges for ekte penger nå. Senere kan det komme kosmetikk, et abonnement (bekvemmelighet, ikke mer fisk), nye regioner, lokale sponsorer og skolelisenser.
- **Kroner i spillet selges aldri for ekte penger.** Da ville pubhjulet blitt betalt pengespill.
- **Tilfeldige belønninger er alltid gratis,** og oddsen vises.
- **Ingen betaling** for å redde en rekke, og ingen kunstig ventetid som bare finnes for å selge snarveien.
- **Kvotene begrenser verdien av boostere.** Salget bygger på moro og tid spart.
- **Betaling krever egen server og brukerkontoer.** Kjøp kan ikke ligge i localStorage. Vipps er nesten et krav.

## 8. Engasjement: veikart

**Ferdig:**
- «Kaffe på kaia»
- Bestillinger
- «Neste mål»
- Pub og haill
- Mannskapssystemet

**Neste kandidater:**
- Fartstid som XP, med titlene dekksgutt → lettmatros → matros → skipper → reder
- Sertifikater for større båter
- Utmerkelser, artslogg og største fisk
- Trofé-fisk og tegn i sjøen, som måkeflokker og seistimer
- «Mens du var borte»-oppsummering
- Varsler og topplister når spillet får server

## 9. Flåteplanen

### Fase 1: Flåtemodell uten synlige endringer (ferdig)

Se 4.3.

Testet:
- Lagring og innlasting.
- Et gammelt lagret spill blir en flåte med én båt, og fem timers fravær ble spilt av som 1 800 spillminutter.
- Alle regresjonstester består.

### Fase 2: Flere båter (godkjent, ikke bygget)

Jonas valgte den strengt realistiske varianten.

**Regler:**
1. **Én båt i åpen gruppe.** Den første båten uten lisens (`openVesselId()`), og **ingen** hvis en båt i flåten har lisens i lukket gruppe.
2. **Eieren må være om bord i åpen gruppe.** `S.me` er båten spilleren er om bord på. Ved avgang settes `S.tripOwner = !S.plan?.ops && S.me === S.cur` (legg `tripOwner` i `VKEYS`).
3. **Tilgang ved levering:**
   - `'lukket'` hvis båten har `lic`.
   - `'open'` hvis det er åpen gruppe-båten og `tripOwner` er sann.
   - Ellers `'none'`.
4. **`'none'`:** Torsk, hyse og sei samlet høyst 10 % av landingen, fordelt forholdsmessig. Torsk høyst 2 t per år (`q.byCod`). Resten inndras. Ingen ferskfiskordning.
5. **Driftsplan med ansatt skipper** er bare for lukket gruppe når det gjelder torsk, hyse og sei. På en båt i åpen gruppe eller uten adgang skal skipperen fiske kveite (`S.target = 'kveite'` hvis `kgear`) og andre arter.
6. **Uten deg om bord** kan en båt bare kjøre hvis den har mannskap. Sjekk i starten av `depart()`.

**Endringer i koden:**
- **`sell()`:** Torskeblokken (`codFF` / `codQ` / `codConf` / `confShare`) generaliseres til inndragning per art (`confBy[sp]`). I løkka: `const cs = confBy[sp] || 0; if (cs > 0){ confKr += v * cs; confKg += x.kg * cs; v *= 1 - cs; }`. Egen meldingstekst for `'none'`.
- **`depart()`:** Skippersjekken og `S.tripOwner`.
- **`opsStep`:** Sett kveitemål når båten ikke har lukket gruppe.
- **Kjøp i telefonen:**
  - `a === 'buy'` får `data-ti="1"` for innbytte (dagens oppførsel med `switchVessel`) og `data-ti="0"` for å legge båten til flåten (`newVesselObj(type, havn, lic)`).
  - Samme for `a === 'buylic'`, med varsel om at skiffen mister åpen gruppe.
  - Ny båt fra verftet (`S.order`, der `PHONE.switchVessel(k)` kalles ved overtakelse) legges til flåten, med mindre bestillingen var med innbytte.
- **`newVesselObj`:** Klon standardverdiene for VKEYS fra `newState()`. Båten ligger i havn i oppgitt havn med 40 % drivstoff. Store båter får plotter og VHF. Navn fra en liste (Senjaværing, Nordlys, Malangen, Gisund, Havglimt, Skreien, Fjordbris, Straumen, Hekkingen, Kvitskjær). Ny id `vN`.
- **Fartøy-appen, fanen «Min båt»:** Et flåtekort per båt med navn, type, status, tilgang og «du er om bord». Knapper:
  - `vfollow`: bytter hvilken båt som følges (`storeVessel`, `bindVessel` og `G3.vesselChanged()`).
  - `vboard`: bytter båten du er om bord på. Begge må ligge i havn.
  - `vname`: gir nytt navn med `prompt()`.
  - `vsell`: selger båten for 70 % av prisen pluss 95 % av kvoteverdien. Ikke båten du er om bord på, og ikke den siste.
- **Mannskap-appen:** Merknad om tilgang for båten. Mannskapsbørsen ansetter til båten som følges.
- **`log()`:** Hendelser inne i `eachVessel` får båtnavn som prefiks når flåten har flere båter. Bruk et flagg som settes i `eachVessel`.
- **HUD:** Egen rad med båtnavnet og ⚓ når du er om bord, hvis flåten har flere båter.
- **Tester:**
  - To båter kjører driftsplan en simulert uke, med kvoter holdt adskilt og ingen båt på land.
  - Levering uten adgang gir riktig inndragning.
  - Knappene for følge, gå om bord, navn og salg trykkes ekte.
  - Lagring og innlasting med to båter.
  - Regresjonstestene.

### Fase 3: Rederiappen

Flåteoversikt med status, posisjon, last, drivstoff, skipper, driftsplan og dagens inntekt. Varsler når en båt trenger deg. Velger for hvilken båt i Mannskap, Fartøy, Utstyr og Verksted.

### Fase 4: Flåten i kart og 3D

Egne båter vises med egne symboler i kartplotteren, og du kan trykke for å følge. Båter i nærheten vises i 3D.

### Fase 5: Rapport og nøkkeltall

«Mens du var borte» per båt, og lønnsomhet per båt og for rederiet.

### Senere

Større fartøyklasser, line, garn, snurrevad og teiner, egne anlegg og nye regioner.

## 10. Kjente problemer og åpne spørsmål

- **Garantert torsk for 8–9,99 m:** 4,2 t i forskriften og 3,2 t i departementets rapport. Spillet bruker forskriften.
- **Minstepriser for andre arter etter 21.09:** Rundskriv 13/2026 er ikke hentet, så lyr og de andre bygger på rundskriv 7/2026.
- **Farten i 3D:** Med tempo 1:6 går båten seks ganger raskere enn virkeligheten. Bevegelsen er jevn, men farten ser høy ut.
- **Timesfunksjonen** `hourly()` bruker den fulgte båtens posisjon for dekning og service. Den bør gjøres per båt i fase 2 eller 3.
- **`S.owned`** er en liste over båttyper fra før flåtemodellen. Den bør avledes av flåten.
- **Kveithaill** kan gi rundt 8 000 kr per dag ved kveitefiske om høsten. Sjekk balansen i spilltesting.
- **Klær og kulde:** `coldPen` bruker hele mannskapet (`S.crew.length`), ikke bare dem som er om bord.
- **Sløyetid:** Anslaget på 150 kg per person og time må sjekkes.

## 11. Testing

- **Verktøy:** Playwright med Chromium og SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). Testskriptene i `tests/` har hardkodede stier (`/home/claude/work.html` eller `/mnt/user-data/outputs/...`), som må byttes ut.
- **Regresjon:**
  - `trip2.py`: hel tur via kartplotter, avgang, 3D, fiske og havn.
  - `tut.py`: førstegangsveiledningen.
  - `dbg23o.py`: ingen WebGL-feil.
- **Funksjonstester**, blant andre:
  - `selltest.py`: salg, kvote, ferskfisk og sløying.
  - `simday.py` og `kvtest.py`: kalibrering av fangst.
  - `ordtest.py`: bestillinger, klær og kulde.
  - `dailytest.py`: kaffen og rekkeregler.
  - `hailltest.py` og `luck2.py`: haill og pub.
  - `crewtest.py`: mannskap.
  - `motion2.py`: båtbevegelse, frakoblet med 60 bilder i sekundet.
  - `berthtest.py`: kaiplasser og trykk i kartplotteren.
  - `fleet1test.py` og `fleet1mig.py`: flåtemodell og migrering.
- **Triks:**
  - Testmaskinen gir få bilder i sekundet, og `dt` begrenses til 0,1 s. Test dynamikk frakoblet med `G3._debug.stepBoat`.
  - Spillet lagrer seg selv når siden lukkes. For å teste gamle lagrede spill: legg dem inn med `context.add_init_script` i en ny nettleserøkt.
  - Nyttige verktøy: `G3._debug` (cam, bv, SK, TRAIL, stepBoat), `ROD._strike/_prog`, `DAILYW.claim/pick/close/auto`, `PUBW.open`, `PHONE.open(app)`.
  - Klikk telefonknapper med `document.querySelector('[data-pa=...]').click()`.
  - Test effekter med bestanden nullstilt (`S.stock = initStock()`) mellom kjøringer, ellers tømmer den første kjøringen feltet.

## 12. Innhold i overleveringspakken

- `OVERLEVERING.md` (dette dokumentet) og `README.md`.
- `kystfiske-prototype.html`: siste publiserte versjon (fase 1).
- `tests/`: alle testskriptene.
- `scripts/`: alle oppdateringsskriptene fra chatten (`patch_*.py` og lignende), som historikk for hvordan funksjonene ble bygget.
- `data/processed/`: behandlede datafiler (base64 og json) som er bakt inn i HTML-fila.
- `data/osm2/`: råkilder fra OpenStreetMap for kart.
- `transcripts/`: fullstendige utskrifter av de fire tidligere chatøktene og `journal.txt`, med hele historikken før denne økta.

Kartrastere i `.npy`-format (over 300 MB) er ikke med. De kan lages på nytt fra OpenStreetMap-kildene, og resultatet ligger allerede i HTML-fila.
