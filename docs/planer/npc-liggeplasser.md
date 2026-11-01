# NPC-båtene ved ekte kaier, og én nasjonal flåte (plan, 01.11.2026)

Jonas 01.11.2026, med tre skjermbilder fra Finnsnes (båtene på stranda, på skråningen og inne i en fylling ved et industribygg):

- «Mange av NPC-båtene i spillet ligger til inni landmassen og ikke til en kai, flytebrygge, havn eller andre steder båter faktisk kan ligge.»
- «NPC-flåten skal være nasjonal og ikke knyttet bare til Senja. Det skal være båter langs hele kysten.»
- «Båtene skal benytte seg av de ekte kaiene vi har laget modeller av og som vi har plassert rundt om i verden.»
- «Det er urealistisk at en stor sjark bare fortøyes rett i fjæra.»
- «Spillet, verden, miljøet og opplevelsen skal være så realistisk som mulig.»

Planen hører sammen med `docs/planer/npc-flaaten.md` (N1–N8). Den går foran N1, fordi N1 fordeler båtene på havnene etter de samme liggeplassene.

## 1. Hva som finnes i dag, og hvorfor båtene ligger på land

Det finnes to NPC-flåter:

- **Kystflåten** (hele landet unntatt Senja-ruta): `tools/map/npc.py` gir båtene i vec-pakkene, og `coastMoor`/`moorHarbour` i `core/05-vessels.js` legger dem ved en kaifront, ved en generert flytebrygge (`FDOCK`) eller på bøye (4.16b).
- **Senja-flåten** (`FLEET`, 14 håndlagde båter i `core/05-vessels.js`): `fleetState` legger dem ved en kaifront med `npcBerths` i `core/07-harbours.js`. Uten vec-pakker, som i artifacten og testbygget, gjøres det med `berthShift` rundt havnepunktet. `npc.py` hopper over Senja-ruta (`keep = … ~(lx … LEGW …)`). Skjermbildene er fra Finnsnes, altså denne flåten. Senja-flåten tar fisk fra bestanden når den fisker (`03-simulation.js`, `takeStock`), men det gjør ikke kystflåten.

Begge legger båtene ved **kaifrontene i vec-pakkene** (`quays`, `tools/map/vectors.py`). De er av fire slag:

| Slag | Hva det er | Står det en modell der i 3D? |
|---|---|---|
| 0 | kanten av en brygge kartlagt som flate | ja, bryggeflaten med kaivegger (`slabInto`) |
| 1 | en brygge kartlagt som linje (4,2 m) | ja, som kasse; regnes som småbåthavn og brukes ikke |
| 2 | kailinje fra Overture (`quay/quay`) | må sjekkes i fase L1: linja gir hindringer (`pierBoxes`), men om dekket tegnes, er ikke bekreftet |
| 3 | **rett kystlinje** innen 150 m fra en brygge eller 30 m fra et stort industribygg | **nei, bare terrenget** |

Slag 3, og slag 2 der ingen kai tegnes, er grunnen. Båten legges da langs kystlinja selv, «i fjæra». 3D-terrenget står 2 m over sjøen ved kystlinja og faller 1 : 3 utover (`COAST3` i `view3d/02-mesh-terrain.js`). En båt 2–3 m fra linja står derfor på skråningen.

- For kystflåten ble det lappet 24.10.2026 med `npcPits` (`view3d/03-berths-naust.js`), som graver ut bakken under skroget. Båten flyter, men ligger fortsatt i fjæra uten kai, og det er urealistisk.
- For Senja-flåten graves det ikke, så de står oppå skråningen. Det er det skjermbildene viser.
- `hullDry` og `moorFree` sjekker bare at skroget er utenfor kystlinja, ikke at det finnes en kai å ligge ved.

Modellene som faktisk står ute i verden og som en båt kan ligge ved:

- **Mottakene, verftene og butikkene** (havneenhetene `UNITS`/`UNITA`, Blender-modellene `harbour-unit-*`): de holdes i dag fri for NPC-båter (`quayFree`, `moorBlocked`).
- **Bryggene kartlagt som flater** (slag 0) og eventuelt kailinjene (slag 2).
- **Flytebryggene:** OpenStreetMaps (`src/data/flyte.json`, tegnet med `tools/harbour/brygge.py`), der småbåthavnene har egne båter (`17g-marina.js`), og de som lages for kystflåten (`FDOCK`), langs en rett strandlinje.
- **Kaimodulene** `kai_betong` og `kai_tre` (`tools/harbour/brygge.py`): i dag tegnes de bare ved spillerens holdte plass (4.16c).
- **Fars naust og rorbuene.**

## 2. Fasene

### L1. Liggeplass bare ved en kai som står i 3D

- **Bygger:** én regel, `berthReal(face)`, som både Senja-flåten og kystflåten bruker. En front kan få en båt bare når det står en modell der:
  - slag 0 alltid
  - slag 2 når dekket tegnes (sjekkes først, og tegnes det ikke, får det kaimodulen etter valg 1)
  - slag 3 aldri alene (valg 1)
  - ledige deler av mottakene, verftene og butikkene etter valg 3
- **Flytebryggene** (`FDOCK`) bare for båter under grensa i valg 2, og bare der strandlinja er en havn (innen en molo eller ved en brygge), ikke på åpen strand.
- **Bøye** bare for de små (valg 2). En stor båt som ikke får kai, får ikke en tilfeldig plass. Hun flyttes til nærmeste havn med plass (L2 gjør det i rørledningen; til da står hun ute på feltet sitt som «fortøyd» i stedet for å legges i fjæra).
- `npcPits` fjernes. Bakken graves bare ut foran en kai som tegnes, som ved spillerens plass (`berthPits`).
- **Filer:** `core/07-harbours.js` (`npcBerths`, `quayFree`), `core/05-vessels.js` (`moorHarbour`, `fleetState`), `view3d/03-berths-naust.js`, `view3d/22-docks-air.js` (kaimodulene ved NPC-plassene, valg 1).
- **Tester:** `npctest` (hver båt i havn ligger ved en modell; ingen ved slag 3 uten modell; ingen stor båt på flytebrygge eller bøye), `havntest` (spillerens plasser er like ledige), `berth3d` med nye bilder.
- **Måles:** hvor mange båter som får kai, flytebrygge, bøye eller må flyttes, i Bergen, Bodø, Tromsø, Båtsfjord og Finnsnes (`/stikkprove`). Terrenghøyden under hvert skrog (`terrRaw`) skal være under −dypgangen. Tegnekall og trekanter med kaimodulene.

### L2. Senja inn i den nasjonale flåten

- **Bygger:** `npc.py` tar Senja-ruta med som resten av landet, og med regelen fra L1 også i rørledningen: en havn får bare så mange og så store båter som modellkaiene har plass til, og en båt uten plass legges i nærmeste havn som har det.
- `FLEET` slutter å være egne båter. Kystruteskipet og ferja står til N3 og N4 i NPC-flåtens plan.
- Bestanden etter valg 4.
- Det krever en ny kartrelease: `tools/map/kart.json` endres, og `kart.yml` kjører.
- **Filer:** `tools/map/npc.py`, `tools/map/kart.json`, `core/05-vessels.js` (`FLEET`, `HOMES`, `npcStates`), `core/03-simulation.js` (`takeStock`), `ui/03-map.js` (AIS-kortet og sporet for `fleet`), `view3d/20-trawl-seine.js`.
- **Tester:** `npctest` (båter i Senja-ruta, ingen dobbeltbåter i grensa), `fleet*`-testene og `trip2`/`tut` (Senja-starten med Botnhamn og Gisundet).
- **Måles:** antall båter i Senja-ruta før og etter, og om antallet nasjonalt fortsatt er nær Fiskeridirektoratets 4 614 aktive fiskefartøy (2024).

### L3. Kontroll langs kysten

- `/stikkprove` med vec-pakkene i Kristiansand, Bergen, Ålesund, Bodø, Finnsnes, Tromsø, Hammerfest og Båtsfjord: kontrollbilder i begge formater av hver havn, med tall for kai, flytebrygge, bøye og flyttet, og for land under skroget.
- Systemdokumentet `npc-trafikk.md` (4.16b) skrives om, og backloggen ryddes for de gamle punktene om liggeplassene.

## 3. Valgene

1. **Kystkant uten modell (slag 3, og slag 2 uten tegnet dekke):**
   - **A** Kaimodulen (`kai_betong`, eller `kai_tre` for båter under 15 m) settes langs plassen, som ved spillerens plass, men bare der kartet viser en kai: kailinja (slag 2) eller kystlinja ved et fiskebruk eller industribygg (slag 3 innen 30 m av bygget). Vanlig kyst ved en brygge får aldri båt.
   - **B** Aldri: bare de modellene som står der i dag.
   - *Anbefaling A:* fiskebrukene står ofte på en kai som bare er kartlagt som kystlinje, og uten den mister mange ekte fiskevær alle båtene sine.
2. **Hvor de minste båtene kan ligge:**
   - **A** Under 11 m kan de også ligge ved en flytebrygge i havna eller på bøye; fra 11 m bare ved kai.
   - **B** Alle bare ved kai.
   - *Anbefaling A:* bøye og flytebrygge er vanlig for sjarker under 11 m i norske fiskevær, men ikke for en stor sjark.
3. **Mottakene, verftene og butikkene:**
   - **A** NPC-båtene kan ligge ved de delene av kaia som verken er landingsplassen eller bunkringsplassen.
   - **B** Holdes fri som i dag.
   - *Anbefaling A:* ved ekte mottak ligger det båter, og det er der det er mest kai. Spillerens plasser holdes fri som før.
4. **Bestanden når Senja-flåten blir nasjonal:**
   - **A** Ingen NPC-båter tar fisk, som kystflåten i dag.
   - **B** Båtene i Senja-ruta tar fisk som `FLEET` gjør nå.
   - *Anbefaling A:* bestandsmodellen har alt det virkelige fisket med, og B ville gjøre fisket på Senja tynnere enn resten av landet (det samme som valg 3 i `npc-flaaten.md`).

### Svarene (Jonas 01.11.2026)

- Valg 1, 2 og 3: **A**.
- Valg 4: verken A eller B. Jonas: «Hele kystflåten skal ta av den verdens felles bestand av fisk. NPC-flåten skal simulere antall aktive fiskebåter i Norge basert på ekte fangstdata. Når en ny bruker registrerer seg i spillet skal 1 NPC-båt forsvinne, og på den måten klarer vi å holde en slags balanse i økosystemet.» Han spurte hva jeg tenker om det.
- Innspillene står under. Valg 4 avgjøres før L2 bygges, og L1 avhenger ikke av det.

### Innspill til valg 4 (01.11.2026, venter på svar)

Hvordan bestanden er laget i dag (`core/03-simulation.js`):

- `S.stock` er et lokalt uttak i ruter på 2 × 2 km (1 er urørt). Det går ned med fangsten og tar igjen 0,4 % av underskuddet i timen (`stockHour`).
- Hver spillers spill regner sin egen kopi. De andre spillernes fangst kommer ned fra serveren rute for rute (`WSH`, `wshTake`).
- Senja-flåten tar 18 kg i timen per båt når den fisker. Et fast trykk på tre av Senja-feltene tar 12 kg (`stockHour`).

Ideen gir en ekte konkurranse om fisken, og den passer med valgene. Fire ting bør endres for at den skal virke i en felles verden:

1. **Uttaket som funksjon av klokka per rute, ikke per båt.**
   - Båtene regnes bare innen 15 km fra spilleren (`coastNear`), så hver spiller ville bare se NPC-uttaket rundt seg selv. Et felt du kommer til, ville være urørt av flåten, og to spillere ville ha ulike bestander.
   - Bedre: hver rute får et NPC-trykk i kg i timen etter sluttsedlene (område, måned og redskap), og likevekten mellom trykk og tilvekst regnes ut av klokka for hvilken som helst rute når den trengs.
   - Båtene i 3D og på AIS står der trykket er, men bestanden henger ikke på at noen ser dem.
2. **Balanse etter fangst, ikke etter registrering.**
   - Mange registrerer seg og slutter. Én båt borte per registrering gjør kysten tom over tid, og fisken vokser tilbake der ingen spiller.
   - Bedre: NPC-trykket i et område går ned med det de aktive spillerne har landet der de siste 30 dagene (tonn mot tonn). Båtene tas bort etter det, én om gangen, i spillernes egne områder. Spillere som slutter, gir båtene tilbake.
   - Det følger også regelen om ingen straff for fravær: ingen mister noe fordi andre har sluttet.
3. **Serveren bestemmer hvilke båter som er borte,** så alle ser den samme flåten (et tall per område fra Supabase, og båtene velges i fast rekkefølge etter hash). Kystflåten er i dag en ren funksjon av klokka og pakkene, så dette er det eneste den trenger fra serveren.
4. **Kalibrering før det slås på.**
   - Fangsten per time for spilleren er i dag kalibrert uten NPC-uttak langs kysten (bare på Senja).
   - NPC-trykket må settes slik at en vanlig dag på et vanlig felt gir omtrent den samme fangsten som i dag. Ellers blir kjernesløyfen dårligere uten at noe annet er bedre.
   - Det måles med de faste fangsttestene og et anslag fra sluttsedlene før det rulles ut.

Usikkert: hvor mye av sluttsedlenes fangst som skal regnes som NPC-trykk i en rute på 2 km. Det meste av den virkelige fangsten tas av havfiskeflåten langt ute, som spillet ikke har felt for. Det må avgrenses til kystflåtens redskap og områder.

## 4. Antatt eller usikkert

- Om kailinjene (slag 2) tegnes med dekke i 3D, er ikke sjekket. Det avgjøres først i L1.
- Hvor mange havner som mister båter eller må dele dem med en nabohavn med L1, er ikke målt. Kystflåten har ikke vært prøvd med vec-pakkene i denne økta, fordi releasen `kart-24` ikke kunne hentes hit (privat repo, 401). L1 og L3 trenger en økt med `tools/map/out/game`.
- Grensa på 11 m i valg 2 er et anslag (lengdegruppene i fartøyregisteret er under 11 m, 11–15 m og så videre), ikke hentet fra en kilde om fortøyning.
- At Senja-flåten står på skråningen ved Finnsnes, er funnet i koden: `npcPits` tar bare kystflåten, og `COAST3` gir bakken. Det er ikke målt med vec-pakkene. Lokalt, uten vec-pakker, ligger de to Finnsnes-båtene på vann ved havnepunktet (`berthShift`).

## 5. Hva planen ikke gjør

- Ingen nye fartøytyper, ferjer eller sesonger: det er N2–N8 i `npc-flaaten.md`.
- Ingen NPC-båter på spillerens holdte plasser, landingsplassen eller bunkringsplassen.
- Ingen graving i terrenget for å få en båt til å flyte der det ikke står en kai.

## 6. Status

- 01.11.2026: planen er skrevet. En lapp som gravde ut skråningen under Senja-flåten (som `npcPits`), ble prøvd i økta og tatt ut igjen før commit, etter Jonas' svar. Venter på valgene og klarsignal.
- 01.11.2026: valg 1–3 er A. Valg 4 er Jonas' forslag om at kystflåten tar av den felles bestanden; innspillene er sendt, og svaret avgjør L2. Venter på klarsignal for L1.
- 01.11.2026, senere: Jonas ba om at planen tenkes gjennom på nytt med havflåten, bestandene, vandringen og uttaket. Valg 4 og L2 er flyttet til `docs/planer/bestand-og-flaate.md` (B1–B4, L2/N1, H1). L1 og L3 står her.
