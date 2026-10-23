# Mannskap med liv: folk som går på dekk, og livet deres

Bestilt av Jonas 17.10.2026 («la oss bygge "mannskap med liv", men da må vi gjøre det skikkelig»): mannskapet skal ikke teleportere mellom faste plasser, men gå mellom arbeidsoppgavene og vandre fritt rundt på båten når de er ledige. Forslaget sto som A4 i `docs/forslag.md`. Status oppdateres nederst.

**Jonas' valg 17.10.2026:**
1. Inne i styrhuset forsvinner de i døra. Styrhuset kan få et enkelt interiør med stol, ratt og den som styrer (synlig gjennom vinduene), bare på egen båt.
2. Gangtiden koster: en stasjon man er på vei til, gir null innsats til man er framme (3–6 sekunder på en sjark; økonomien merker det ikke, men ingen sløyer uten å ha gått dit).
3. Bevegelsen først (del 1), livet etterpå (del 2).

## Utgangspunktet i koden

- Figurene er ikke ferdige animasjoner. `drawWorker` i `view3d.js` stiller Blender-kroppen i deler (torso, hode, over- og underarm, lår, legg, støvel, hånd) ledd for ledd hvert bilde; lemmene strekkes mellom to ledd (`limbM`). Gange finnes (`st.walk`), og hver oppgave er håndposisjoner (`gut`, `ice`, `coil`, `coffee`, `sweep`, `carry`, `signal`). Fri bevegelse trenger derfor ingen nye animasjoner fra Blender.
- Plassene er faste punkter per båt i modellens ankere: `crewSpots`, `work.table`/`work.tub`, `hauler`, `skipperAt`. Mannskap som ikke jobber, tegnes stivt på en `crewSpot`; seks steder tegner mannskap hver for seg (`drawVessel`, `drawDeck`, `drawGearOp`, roret, jukserekka, skipperen). Det er teleporteringen.
- Hvem som gjør hva, bestemmes hvert spillminutt av `workAssign` i `core/13-work.js` (ror, fiske, haling, sløying, ising, kokk, pause). Simuleringen sier *hva*; 3D-en skal vise *veien dit*.

## Del 1: dekket som et sted man går

### 1.1 Dekkskartet (bygd 17.10.2026, `deckMap` i `vessel3d.js`)

Lest rett av modellens trekanter, uten Blender og uten håndtegnede planer, så det følger hver modell når den endres:
- Et rutenett på 20 cm (`DM_C`) over båten i båtens ramme. En rute har et *gulv* der en flate med normalen opp eller ned (|n| ≥ 0,55; byggesettets dekk har normalene snudd) ligger under rutens senter med 1,85 m fritt over seg (`DM_HEAD`). Gulvet er *sperret* når noe står i kroppen over det, 0,25–1,7 m (`DM_BODY`), innenfor ruta: en vegg, en rekkestøtte, bløggekaret, husets side. Skrå flater (en bordgang fra kjølen til ripa) måles i høyden de har inne i ruta, ikke over hele lengden.
- Gulvene knyttes sammen til deler, gulv for gulv (en rute kan bære to nivåer, arbeidsdekket og shelterdekket over): naboens gulv innen ett trinn (`DM_STEP` 0,45 m, en tofte på en åpen båt) hører til samme del. Gulv mer enn 0,8 m under det laveste av ankernes nivåer (lasterommet, kjølsvinet) er aldri dekk.
- Dekket er delen med flest ruter ved ankernes dekkshøyde (`deck.y`) og mannskapsplassene (`crewSpots`); ellers den største. Et tak, ripkappen og bløggekaret blir ikke dekk; en plattform eller et fordekk opp en leider knyttes til med en *lenke* (1.2), ikke av fyllingen.
- `deckPath(M, a, b)`: A* over rutene, åtte naboer (diagonalt bare forbi to frie sider), ruter langs en sperre eller en kant koster litt mer, så veien holder seg unna vegger og rekke; så rettes den opp der dekket mellom er fritt.
- `deckPoints(type)`: plassene fra ankerne som ruter: `sloy` (innenfor bordet), `is` (innenfor karet), `haling` (innenfor haleren), `ror` (når huset har gulv i modellen) eller `door` (nærmeste dekksrute til rormannsplassen når huset ikke har gulv), `spot0..n` (dagens plasser), `filler`, og `lean`: ti rekkeplasser spredt langs begge sider og hekken, med retning ut.
- Koster 20–500 ms per type, én gang, og ingen WebGL. `tests/walktest.py` (uten 3D) sjekker alle 14 typene: dekket har ruter, arbeidsplassene ligger på det, og det er vei mellom alle par av plasser; planene skrives til `tests/out/walk-<type>.txt` (`#` dekk, `+` plass, `·` sperret).

**Kjente avvik, som rettes med en liten tabell per type i 1.2 (ikke med Blender):**
- Trebåten (`trebat`): det åpne skroget har toft, motorkasse, kasser og bord, så gulvbordene er tre små lommer (11 ruter). Delen som velges, er ripkappen (47 ruter ved 0,59 m), fordi setet akter ligger nær den høyden. Må låses til gulvet (0,04 m) med en overstyring.
- Kystbåten 15 m (`kyst15`): arbeidsdekket under shelterdekket er bare modellert som en stripe akter om styrbord (165 ruter); resten av dekket under shelteret finnes ikke i modellen. Shelterdekkets topp (1 394 ruter) er der folk kan vandre, og må lenkes til arbeidsdekket med en trapp.
- Havsjarken (`sjark`): arbeidsdekket akter (292 ruter). Hekkplattformen og fordekket er egne deler og trenger lenker.
- De store (`autoliner`, `bunntral`, `pelagisk`, `snokrabbe`): dekket som velges, er det åpne arbeidsdekket der `crewSpots` står. Flere nivåer finnes og trenger lenker og flere arbeidsplasser.

### 1.2 Punktene og lenkene (økt 2–4)

En tabell per type i `vessel3d.js` (`DECK_OVR`, data, ikke valg etter båttypens navn i koden): nivået som er dekk når heuristikken tar feil, lenker mellom deler (trapp, leider, dør: fra rute til rute med gangtid), seter (`SEAT`), le (`SHELTER`), styrhusdøra (`DOOR`), nedgangen til køyene (`BUNK`) og lasteluka (`HOLD`). Hver modell sjekkes mot planen fra `walktest` og mot kontrollbilder i 3D.

### 1.3 Agentene (økt 5–6)

- Hver person om bord er en agent i båtens ramme: posisjon, retning, fart, mål, vei. Oppdateres 20 ganger i sekundet, tegnes interpolert. Ganghastighet 1,2 m/s, 0,8 ved rulling over 8°, 0,5 i trapp og på leider. Svinger med 0,4 m radius, snur på stedet når målet er bak, går aldri gjennom hverandre (viker til styrbord, venter i døra).
- Sjøgang: i Beaufort 5 og over velger veien ruter langs rekka og husveggen, én hånd i rekka, stopp og hold fast når rullingen passerer 12°. Bruker rullingen og stampingen fra `03c-stability.js`.
- Føttene står på dekket: høyden per fot fra dekkskartet; kroppen lener seg 30 % mot rullingen.
- Stasjonsbytte: `workAssign` setter stasjonen; agenten får målet, oppgaven begynner når han er framme, med 0,4 s overgang. Innsatsen er null underveis (Jonas' valg 2). Ved oppstart og etter `catchUp` står alle på stasjonen sin. Agentene lagres ikke (utsikt, ikke spilltilstand).
- De seks tegnestedene slås sammen til én personliste med én tegnerutine: én person, ett sted, alltid.

### 1.4 Når de ikke har noe å gjøre (økt 8–9)

Pause er en aktivitet valgt etter vær, tid, lynne og de andre (nyttefunksjon), 20–90 sekunder om gangen: lene seg på rekka i le, sitte på luka, kaffe, kveile tau, spyle dekk, se på trekket, prate med en annen ledig (replikkene over hodet går mellom dem), gå inn i styrhuset (regn, kulde, natt), legge seg i køya (trøtt, båt med køyer), kikkert mot land eller en båt, røyke ved hekken. Inne i styrhuset og i køya tegnes de ikke, men de går inn og ut døra. Egen båt får et enkelt styrhusinteriør: stol, ratt og den som styrer, synlig gjennom vinduene (Jonas' valg 1). De som jobber, strekker ryggen, tørker kniven, ser opp når måka skriker, snur seg når du kommer ut.

### 1.5 Ting som flyttes (økt 10)

Fisken bæres i kasse fra bordet til lasteluka hvert 50. kg (`carry`), agnet fra agnkassa til egnebordet, tauet kveiles etter trekket, blåsene stables akter før setting.

### 1.6 Figuren (økt 7)

Kne og albue med riktig bøyeretning, 90° sittende; hodet ser dit han går, på det han gjør og på deg når du kommer nær; hånd på rekka, hånd i lomma, kopp, kikkert, kost, tauring; pust og vektskifte. Overganger mellom positurer blandes over 0,5 s. Ser det stivt ut i bro-visningen, er neste steg et skjelett i Blender med få klipp (gå, sitt, reis deg), som måles for behov først.

### 1.7 Andre båter og ytelse (økt 11)

Spiller- og NPC-båter innenfor 150 m får samme agenter (bare stasjonene), to personer. Utenfor 150 m står de, utenfor 400 m tegnes de ikke. Budsjett: én figur rundt 12 tegnekall; målet er null målbar endring i bildetakt på nettbrettet (`helmjit`, `jigshot` før og etter). På 3D-nivå 0 står folk på stasjonsplassene som i dag.

### 1.8 Tester

- `walktest` (uten 3D, bygd): dekkskartet for alle typer.
- `crew3d` (med 3D): tre båter, 60 sekunder med stasjonsbytte, skjermbilder hvert tiende sekund, ingen figur utenfor dekkskartet eller i en vegg.
- `vesseltest` passer på at ingen kode velger etter båttypens navn.

## Del 2: livet deres (økt 12–15)

- `life = {home, fam, goal (egenbåt/skipper/ro), saved, story[]}` på hvert mannskap; målet synlig på kortet fra dag én. `lifeTick()` i `core/14-crewlife.js` daglig, mot felles klokke: sparing (lotten × 0,4), livshendelser etter alder og familie som meldinger på dialekt (bryllup: tre dager fri; barn; sykdom; skade ved fall på dekk i grov sjø, med et synlig fall når rullingen går over grensen uten rekke å holde i, tre uker i land på hyre).
- Avmønstring til egen båt med en ukes varsel; Kystposten skriver; han blir NPC-skipper ved hjemstedet (`S.alumni`, høyst 10, tegnes innenfor AIS-rekkevidde av hjemhavna) og hilser med hornet til VHF-praten er bygd.
- Skipper på båt to for den med målet og vurderingen (rollene fra driftsplanen), så driftsplanen går uten spilleren om bord.
- Tilbakekomst etter 1–2 år til lavere lott.
- `c.story` høyst 12 linjer, skrevet i `crewSettle`, `sell()`, `recCatch`, `borsTick`, `crewQuit`.
- `crewlifetest.py`, `fleet2test`, patchnotes, overleveringen, full regresjon.

## Status

- 17.10.2026: økt 1 ferdig. `deckMap`, `deckPath`, `deckPoints` i `vessel3d.js`, `tests/walktest.py` grønn for alle 14 typene. Avvikene over venter på overstyringene i 1.2. Ingenting synes i spillet ennå.
- 17.10.2026: økt 5–6 ferdig, første synlige steg. `src/js/deckcrew.js` (`CREW3D`): hver person om bord er en agent i båtens ramme med mål fra `workAssign`, A*-vei over dekkskartet, 1,2 m/s, snuing på stedet, viking for andre som går; første tikk og klokkehopp over 30 min setter alle rett på plass. Ror → rorplassen eller døra (inne, `helm`); pause under fart → døra (inne); dekksarbeid → bordet, karet, ellers en rekkeplass; haling → haleren; fiske → innenfor juksamaskinene; kokk → inne. Ledige velger rekkeplass med lene/se/kaffe/kveile/feie, natt og vind → inn. `view3d.js` tegner agentene i ett pass (`drawDeckCrew`) i stedet for de seks tegnestedene når `CREW3D.on()` (egen båt med modell, ikke håndbåter), og `drawDeck`/`drawGearOp`/`drawVessel` hopper over sine egne folk da. Nye positurer `helm`, `lean`, `jig`. `tests/crewwalk.py` (uten 3D) grønn: tre agenter på sjarken, går til bordet og karet uten å forlate dekket eller hoppe, inne/ror under fart, fri hånd borte. Patchnote p110. Gjenstår i del 1: figuren (økt 7), bedre ledigtid og styrhusinteriør (8–9), bæring (10), andre båter/LOD og `DECK_OVR`-tabellen (11).
- 17.10.2026 (senere): deler av økt 7–10. Hodet snur seg mot kameraet når det kommer nærmere enn 7 m forfra (`st.peek`), bøyen i ryggen blandes inn over 0,4 s (`a.blend`), den som sløyer bærer en kasse fra bordet til lasteluka (`G.deck`) hvert 25.–65. sekund og går tilbake (`a.sub`, positur `carry`/`stack`), og båtene uten ratt og stol i modellen (`HELM_KIT` i `vessel3d.js`: kyst15, kyst21, hurtigsjark, sjarkny, havflåten, juksesjarken) får et enkelt ratt med søyle og en stol ved `skipperAt` (`drawHelmKit`). Agentenes klokke går i tikk (`ST.clk`), så testen og spillet følger samme tid. Gjenstår: andre båters agenter og LOD (11), `DECK_OVR`, sitting, prat mellom ledige, fall i grov sjø.
- 17.10.2026 (økt 11, første del): `crewSim(src)` i `deckcrew.js` er fabrikken; `CREW3D = crewSim(null)` er egen båt. Andre spilleres båter og NPC-båtene innenfor nær-LOD (150 m med GLB-modell, `npcCrewDraw` i `view3d.js`) får hver sin sim med `npcCrewCtx` (fiske: skipper ved juksa, én ved bordet, én ved juksa; under fart: skipper ved roret, hendene inne; i havn: ingen på dekk), tegnet med `drawWorker` i båtens skalerte ramme og med spillerens egne utseender (`lk`/`ck`). Simene slippes når båten har vært ute av syne i ett minutt (høyst 24). Dekkskartet for en ny type regnes første gang den kommer nær (20–500 ms, ett hakk). Gjenstår: LOD-måling (`helmjit`), `DECK_OVR`, sitting, prat mellom ledige, fall i grov sjø, og del 2 (livet).
- 20.10.2026 (tilbakemelding #75 og Jonas' ønske om ekte arbeid på dekk): stasjonene har plasser (én ved haleren, garnets plukker, bløgger, sløyebordets plasser, pakking og ising), de ledige tar arbeidet der mest venter, og mannskapets jobber på redskapen går med dem som står på dem (`core/13-work.js`). Hver agent har sin egen rute, utstyret på dekk er tatt ut av gangkartet, og hver del av arbeidet med fisken har sin animasjon og sin plass, med den ekte fangsten fra haleren til kassa i rommet (`deckcrew.js`, `view3d.js`; overleveringen 5.19 og 5.62). Tester: `worktest`, `crewwalk`, `workshot` (3D).
- 21.10.2026 (Jonas' bilde: to av mannskapet lente seg over rekka i 23 knop, «juksa-animasjonen»): en pause på dekk som var begynt før båten gikk, ble holdt til den var over (30–90 s). Nå slutter den med en gang båten med styrhus er underveis, og de går inn (`sync`, `crewwalk`).
- 21.10.2026 (#81–#85, ved mottaket): plassene ved rekka lå også foran vegger og skap (vendt mot dem, armene gjennom), oppå skansekledningen og et skap, og feiing og kveiling skjedde vendt utover (kosten utenbords, kveilingen som juksing). Plassene krever nå lufta utenfor skroget, dekk i samme høyde innenfor og arbeidsdekket; feiing og kveiling vendt innover (`deckPoints`, `idleGoal`, `crewwalk`).
- 17.10.2026 (del 2, økt 12–14): `c.life` i `core/14-crewlife.js` (`crewLife`): familie (`fam`), drøm (`goal`: egenbat/skipper/ro etter alder), sparing (`saved`, starter på 0–70 % av målet etter årene på sjøen, +40 % av hvert oppgjør, 25 % med barn; `lifeEarn` fra `sell()`, `payHyre` og `crewSettle`), `story` (høyst 12 linjer), `notice`, `bday`. `lifeDay` hver spilldag fra `crewTick` (også i `catchUp`): bursdag, ukes varsel når sparingen når målet, avmønstring i havn (`lifeDepart` → `S.alumni`, høyst 10, med båtnavn fra `LIFE_BOATS`, utseende og et øyeblikksbilde av personen), bryllup (3 dager fri), barn (2), sykdom (1–3); `lifeInjury` per time i fiske når Hs > 2,2 m (2–3 uker i land); `lifeOffTick` avslutter fri med dato. `alumniStates` legger alumni-båtene inn i `npcStates` som sjark på nærmeste felt innen 40 km fra hjemhavna (ellers skipperens hjemhavn; uten felt innen 40 km vises de ikke, de nasjonale feltene mangler ennå), 07–15 unntatt søndag; `lifeHail` tuter én gang om dagen innen 1,5 km. `alumniReturn` i `borsTick` etter 1–2 år med 10 % lavere lott og historien videre. Kortet under Mannskap viser drømmen, sparingen, familien og de tre siste linjene (`lifeHtml` i `05-phone.js`). `tests/crewlifetest.py` grønn. Ikke bygd: skipper på båt to (bare en replikk når erf ≥ 4,5), Kystposten-sak om båtkjøpet (serveren godtar ikke nye saktyper uten migrasjon).


## Del 3: mannskapet styrer seg selv (M1–M8, 23.10.2026)

Jonas 23.10.2026: «mannskapet skal i større grad være mer selvstendige dynamiske mennesker som tar egne valg slik de ville vært ombord på en fiskebåt. Vanlige mennesker hjelper hverandre og ser arbeidsoppgaver som trenger å gjøres». Hele beskrivelsen med tall står i 5.19 i overleveringen.

- **M1–M2** (`core/13-work.js`): kjedene er borte. `workAssign` setter hver person der de gjør mest nytte (arbeidet som venter, ferdigheten, vanen `c.hab`, trekkene, slitenheten), med ro på dekk (`pBreak`, hvert 20. minutt). Styrmannen (`c.mate`) tar roret når du ikke styrer. Når båten ikke kjøres, står du på dekk med de andre.
- **M3–M4** (`core/04-crew.js`): innsatsen (`crewEffort`, `crewDrive`) og samholdet (`crewTeam`) med ord på Mannskap-siden.
- **M5/M5b** (`core/14-crewlife.js`, `deckcrew.js`, `tools/deck/pause.py`): feil på dekk (`crewSlip`), gode råd (`adviceWx`, `adviceGround`), pausene etter vær, tid og natur (`idleAssign`) med egne animasjoner og ting fra Blender.
- **Aldri gjennom ting** (`deckPass`, `linkPass`, `poseHits`, `unclip`, `sideways`, `hopVia`): `crewclip.py` på alle båtene med dekk.
- **M6** (`ui/05b-work.js`): Mannskap-siden med «På dekk nå» som brikker og ett kort per person.
- **M7** (`tools/harbour/hender.py`, `view3d.js`, `deckcrew.js`): hender med fingre i seks grep, støvel med fotform, ting holdt i grepet; glipp over ripa med plask, kutt med teip i fire timer, tempo etter innsatsen, tingene lagt bort før arbeidet, avløsning ved haleren og roret, en hånd på døra.
- **M8**: `tests/selfcrew.py` (sjark, kyst15, autoline; frøet `window.CREW_SEED` i `crewSlip`), overleveringen 5.19 skrevet om og patchnotes.
