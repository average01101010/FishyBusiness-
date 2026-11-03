# NPC-trafikken og flåten

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.16 NPC-trafikk langs hele kysten (del 5, 04.10.2026)

Jonas valgte «Full trafikk langs kysten», men «NPC båtene skal kun dukke opp innenfor spillerens AIS område».

**Rørledningen** (`tools/map/npc.py`, `coast.py game`, fra `kart-6`):
- **Havner:** kaifronter på 12 m eller mer som ligger innenfor 250 m av hverandre, med minst 30 m front til sammen.
  - Flytebryggene i småbåthavner (bryggelinjer, slag 1) teller ikke, for der ligger fritidsbåtene.
  - Senja-ruta er utelatt, fordi `FLEET` er flåten der.
- **Flåte** (fra kart-7): én båt per 150 m front, 1–3 per havn og høyst 55 per flis, 4 137 langs kysten. Fiskeridirektoratet oppgir 4 614 aktive fiskefartøy i 2024. kart-6 hadde én per 45 m, 1–8 per havn og høyst 300 per flis, altså 19 411 båter.
  - Lengdene trekkes fra kystflåten: 45 % 7–10 m, 30 % 10–11 m, 15 % 11–15 m, 8 % 15–21 m og 2 % 21–28 m.
  - Bredden er 0,3·L + 0,9, og dypgåendet er 0,09·L + 0,6. Begge er tilnærminger.
  - Hver båt får en kaiplass som passer (samme regel som `quayFit`). Får ingen front plass, prøves en mindre båt.
  - Navnet trekkes fra en liste.
- **Felt:** 2–4 per havn, 20–150 m dypt og 3–22 km sjøvei unna, 2 km fra hverandre. Fra kart-7 ligger de minst 600 m fra land (helst 1 km), og et felt som en annen havn i flisa har valgt innenfor 2 km, får trekk. En havn uten felt (innsjøer og lommer) er utelatt, og en kaifront uten målt dybde gir ingen kaiplass. Feltene velges mest etter skråningen (dybdens gradient på 500 m) og litt tilfeldig.
- **Leia:** korteste vei på et 100 m rutenett av flisas 25 m-maske, rettet ut der masken er fri.
  - Først prøves et strengt rutenett der høyst én av 16 småruter er land, så et romsligere med fire.
  - Havner hvis munning ligger i samme 500 m-rute, deler beregningen.
  - Noen få leibiter skjærer et hjørne av 25 m-masken: 23 av 680 rundt Tromsø.
- Alt legges som JSON i flisas vec-pakke (`npc`). Det beregnes i parallell før pakkene skrives. Tromsø tar 5 s og Bergen 30 s.

**Spillet** (`core/05-vessels.js`):
- `coastState(båt, H)` er en ren funksjon av klokka, som `fleetState0`:
  - ut om morgenen fra kaiplassen til havnemunningen i havnefart, så leia til et av feltene
  - driv med vinden på feltet
  - hjem om ettermiddagen
  - inne i kuling (en større båt går ut i verre vær) eller på fridager
- `coastNear` regner bare båtene innenfor `AIS_KM` (15 km) fra båten du følger, og ber om pakkene der båten er.
  - Havner der verken båtplassene, leiene eller feltene kan komme innenfor, hoppes over.
  - Klokkeslettet regnes én gang per kall.
  - Det tar rundt 1 ms per kall for 200 båter ved Tromsø (stasjonær maskin).
- `npcStates` tar dem med som `coast:true`, med lengde, bredde, dypgående og lakk.
  - De tar ikke fisk fra bestanden: bare `FLEET` gjør det, og den har hver spiller.
  - De har AIS-kort og spor i kartet, og vises som fiskebåter i miniplotteren.
  - I 3D bruker de byggesettet (`npcMesh` etter lengde og bredde), som Senja-flåten.
- Båtene kommer bare i appen, siden de ligger i vec-pakkene.

**Rettet etter spilltesten 04.10.2026** (skjermbilde fra Toppsundet: båtene i klynger på sjøen og på land, og for mange):
- **Færre.** `vecDecode` beholder bare båtene med `fnv(id) < NPC_KEEP` (0,17, minst én per havn). Det gir rundt 22 % av kart-6s 19 411, altså rundt 4 300. Fiskeridirektoratet oppgir 4 614 aktive fiskefartøy i 2024 (kystmagasinet.no, «Stabilt antall norske fiskefartøy»). Med kart-7 er `NPC_KEEP` satt til 1.
- **Fridager og avreise.** 30 % fridager, og avreise kl. 4–8.
- **Spredt.** Hver båt har en egen plass 0,3–1,2 km fra feltets midtpunkt (`coastSpot`) og en egen vinkel på driften. Hvert kast slutter der det neste starter.
- **Ikke på land.** Før hvert kast sjekkes driften mot land: 25 m-masken der pakken er lastet, ellers kjernens 200 m (`coastLand`). Treffer den land, snus den, legges tvers eller halveres, og ellers ligger båten stille. Svaret lagres per båt og kast (`coastCast`).
  - Årsaken var at to tredjedeler av feltene ved Toppsundet lå under 500 m fra land, og driften (rundt 1 km med vinden) ble ikke sjekket.
- **Navnene i kartplotteren.** Båtene langs kysten får navn bare når kartet er under 4 km høyt. Ingen navn legges oppå et annet, styrt av et rutenett av navneceller i `renderDyn`.

**Test:** `npctest.py` (LITE) sjekker:
- at båtene bare er innenfor AIS-rekkevidden
- natt, dag og kveld
- at samme tid gir de samme posisjonene
- at hver båt ligger ved en front som passer
- at leiene holder seg unna land
- at ingen havn ligger i Senja-ruta
- at båtene ikke tar fisk
- AIS-kortet og sporet

#### 4.16b Liggeplassene i havnene: kai, flytebrygge og bøye (Jonas 18.10.2026)

Jonas: «npc-båter mange plasser er plassert i landmassen når de ligger ved kai … Sørg for at det aldri oppstår konflikt med andre båter, verft, fiskemottak, utstyrsbutikk, naust, rorbuer eller landmasse.» Kaifrontene i vec-pakkene og den fine kystlinja (25 m-masken) stemmer ikke alltid overens, så opptil 60 % av båtene lå med en skrogside på land.

- `coastMoor(b)` i `core/05-vessels.js` setter liggeplassen én gang per havn (`moorHarbour`) når den fine kysten er inne, og igjen bare når vec-pakkene eller kystindeksene endres (`MOOR.ver`). Til da brukes pakkens plass.
- **Kai:** pakkens plass prøves først, så forskjøvet ut fra kaia 0–8 m og langs kaia. `moorFree` krever 15 skrogpunkter utenfor land (med 1 m og 0,5 m margin), ingen kai, molo, brygge eller bøye i `obsSegHit`, avstand til mottak, verft og butikker (`PORTS`, 45 m), havneenhetene (`unitNear`, 60 m), naustet (45 m) og rorbuene (35 m) (`moorBlocked`), og ingen overlapp med båtene som alt er plassert, også i nabohavner innen 600 m (`moorAround`).
- **Flytebrygge** for båter under 15 m som kaia ikke tok: `shoreSpot` finner en rett strandlinje 15–450 m fra havna. Brygga (`FDOCK`) er et landkar på land, en landgang på 10 m ned til 1–4 betongpontonger på 12 × 2,4 m som følger tidevannet, og båtene ligger langs begge sider med baugen ut. `dockFree` krever vann og minst 1,2 m dybde under hele brygga, ingen hindring, ingen sted innen 15 m, ingen plassert båt innen 5 m av sidene og 10 m til andre brygger.
- **Fortøyningsbøye** for resten: vann med plass til å svinge (båtlengde + 8 m fra land, dybde ≥ dypgang + 1,5 m), bort fra bryggene. Bøya ligger `MOOR.PEN` = 3 m foran baugen, og hele svaierringen (2L + 6 m) må være fri. Finnes ingen plass, beholder båten pakkens plass (`none`, telles av proben).
- Bryggene og bøyene (med svaierringen) går inn i hindringene (`core/11b-obstacles.js`, nøkkelen `FDOCK.ver`), så Autonav og andre båter holder seg unna.
- 3D: `drawDocks` i `view3d.js` tegner brygger og bøyer innen 1,5 km. Modellene er byggesettet `tools/harbour/brygge.py` → `src/data/harbour-brygge.b64` (`glb-brygge`): `ponton`, `ponton_end` (stige og livbøye), `finger` (utrigger 8 × 0,8 m), `landgang`, `landkar`, `kai_tre` (trekai på påler, 6 m fag), `kai_betong` (betongkai med fendere og leider, 6 m) og `boye`. Ramma: x langs modulen, y opp fra middelvann, z på tvers. `kai_betong` står ved spillerens plass i havna (4.16c); `finger` og `kai_tre` er klare, men ikke tatt i bruk ennå.
- Stikkprøve 18.10.2026 (proben i økta, sommer kl. 03): Tromsø 43 båter (3 ved flytebrygge), Bergen 22 (1), Bodø 18, Ålesund 56, Båtsfjord 9, Kristiansund 28, Honningsvåg 23 (1): 0 på land, 0 på kai, 0 overlapp, 0 uten plass. Hammerfest fikk tidsavbrudd i proben mens vec-pakkene lastet (ikke plasseringen).

#### 4.16b-L1 Bare ved kai som står i 3D (L1 av `docs/planer/npc-liggeplasser.md`, Jonas 01.11.2026)

Jonas, med bilder fra Finnsnes der Senja-flåten sto på strandskråningen: «Båtene skal benytte seg av de ekte kaiene vi har laget modeller av og som vi har plassert rundt om i verden», «Det er urealistisk at en stor sjark bare fortøyes rett i fjæra». Valgene: 1 A (kaimodulen der kartet viser en kai uten modell), 2 A (flytebrygge og bøye bare under 11 m), 3 A (resten av mottakenes, verftenes og butikkenes kai er åpen for havnas båter).

- **Årsaken:** kaifrontene i vec-pakkene er av fire slag (`tools/map/vectors.py`): 0 kanten av en brygge kartlagt som flate (tegnes av `slabInto`), 1 brygge som linje (småbåthavn, brukes ikke), 2 kailinje fra Overture (`pierBoxes` gir den et dekke på 6 m som `pierInto` tegner), og 3 **rett kystlinje** innen 150 m fra en brygge eller 30 m fra et stort industribygg, uten noen modell. Båtene ble lagt ved slag 3 like gjerne som ved de andre, altså i fjæra, og i 3D står bakken 2 m over sjøen ved kystlinja (`COAST3`). For kystflåten gravde `npcPits` bakken ut (24.10.2026), så de fløt i fjæra; Senja-flåten fikk ingen graving og sto på skråningen.
- **Regelen** (`quayReal(f)` i `core/07-harbours.js`): en front tar en båt bare når det står en kai der i 3D: slag 0 og 2 alltid; slag 3 bare der et industribygg på minst 300 m² (type 8, som `vectors.py` regner et fiskebruk) står innen 30 m av fronten, og da setter spillet sin egen kai langs plassen (`f.mod`: `kai_betong`, eller `kai_tre` for båter under 15 m, tegnet av `quayMod` i `view3d/22-docks-air.js`, som ved spillerens plass). Slag 1 og åpen strand aldri.
- **Enhetene** (`faceReserved(f)`): det som holdes fri på en front, er intervaller langs den, ikke hele fronten: 35 m rundt havnepunktet (der spilleren ligger), og enhetens blokk med fylling, bassenget (`basinX`, `basinZ`) og landings- og bunkringsplassen. Resten av mottakets kai tar havnas båter, som ved et ekte fiskebruk. `quayFree` er sann når noe er igjen, og både `npcBerths`, `moorHarbour` og spillerens `havnBerths` holder seg utenfor intervallene (`resHit`). `moorBlocked` bruker `unitHit` (blokk, basseng og plassene) i stedet for 60 m rundt enhetens midtpunkt.
- **Kystflåten** (`moorHarbour` i `core/05-vessels.js`): frontene i havna som står i 3D, den pakkens plass ligger ved først, så langs hver front utover i 2 m-steg og ut fra fronten 0–8 m, skroget fritt (`moorFree`). Under 11 m (`MOOR.SMALL`) får de som ikke fikk kai, flytebrygge, men bare **inne i havna** (`inHarbour`: en kai som står i 3D innen 80 m eller en molo innen 120 m av landkaret), ellers bøye. Fra 11 m og opp får en båt uten kai **ingen plass** (`moored.none`): hun vises ikke i havn (`hidden`, hoppet over i `coastNear` og `npcStates`), og dagen hennes begynner og slutter ved havnemunningen (`coastWay`). Plassen bærer fronten (`moored.face`: punkt, retning, slag, `mod`).
- **Senja-flåten** (`fleetBerth`, `fleetState`): samme `npcBerths` med samme regel. Uten vec-pakker (artifacten, Senja-testbygget) ligger de ved havnepunktet som før (`berthShift`); med pakkene og ingen kai som tar dem, vises de ikke i havn.
- **3D:** `npcPits` graver bare foran plasser som bærer en front (kystflåtens og Senja-flåtens); flytebrygge, bøye og ingen plass graver ingenting. Fra 03.11.2026 bare under vann, se 4.16b-K.
- **Målt** (proben i økta, kl. 03 i juni, havnene innen 2 km, `kart-24`): Finnsnes 2 båter fra kystkant til kailinja ved fiskebruket; Tromsø 4, Bodø 3, Bergen 2 og Båtsfjord 9 båter, alle ved brygge, kailinje eller kystkant ved industribygg med kai satt; bakken under hvert skrog under −0,5 m etter gravingen (før: 14 av 20 på skråningen). Tabellen står i `docs/planer/npc-liggeplasser.md`.
- **Test:** `npctest.py` sjekker at hver båt i havn ligger ved en front som står i 3D eller (under 11 m) ved flytebrygge eller bøye, ingen i fjæra (slag 3 uten modul), ingen på land, at båtene uten plass ikke vises, og at Senja-flåten i Finnsnes ligger ved en slik kai eller ikke vises.

#### 4.16b-K Kaia bygd ut til båten, ingen graving over sjøen (Jonas 03.11.2026)

Jonas, med bilder av tre båter i et utgravd basseng og en båt i et hakk i et kaidekke: «NPC båtene langs hele kysten ligger ved utgravd landmasse, ikke ekte modellerte kaier som glir sømløst inn i miljøet. Det ser ikke bra eller naturlig ut.»

- **Årsaken:** frontene i pakkene ligger på den fine kystlinja eller nær den, og 3D-stranda (`COAST3`) står 2 m over sjøen ved linja og faller 1 på 3 (1 på 1,5 ved molo). `npcPits` gravde derfor en firkantet grop 3 m dyp foran hver plass, også i bakken over sjøen, og det ga loddrette jordvegger og hakk i kaidekker. Kaimodulen (`f.mod`) ble bare satt ved fiskebruk, og bare langs fronten.
- **Regelen nå** (`quayOut(f, a, L)` i `core/07-harbours.js`): kaia bygges ut fra fronten så langt at stranda står minst `QOUT.clear` (0,6 m) under middelvann langs hele båtsida, regnet fra `coastSdIf` med samme profil som 3D-bakken (5 punkter langs båten, en havnelomme regnes som dyp). Båten legges der (`moorHarbour` og `npcBerths`, med de gamle 0–8 m utenfor), og avstanden lagres på plassen som `face.out`. Må kaia ut mer enn `QOUT.max` (16 m), tas ikke den plassen.
- **3D** (`quayMod` i `view3d/22-docks-air.js`): der `face.out` er over 0,3 m eller `f.mod` er satt, står betongkaia (`kai_betong`) med fronten ved båten, og bak dekket en fylling i samme betong (`quayFill`, en enhetsboks skalert) inn til 3 m på land (1,5 m inn under et kaidekke av slag 0 og 2, som da tegnes 1 cm lavere så dekkene ikke slåss). En båt under 15 m ved strand (slag 3) får trebrygga på påler (`kai_tre`) når én bredde av den når land (`out` ≤ 2,2 m). Kaia er et hinder for båtene som legges etter (`placed` i `moorHarbour`).
- **Gravingen** (`npcPits`): bare sjøbunn som alt er under vann (under −0,2 m, `NPIT.wet`) senkes, fra kaifronten og ut forbi båten, og den stiger igjen med 0,6 i helling (`NPIT.slope`) rundt kantene. Under kaia graves ingenting; kaiveggen står ned til −3 m. Ingen vegg står over sjøen noe sted.
- **Ikke endret:** spillerens holdte plasser (`berthPits`, 4.16c) graver som før.
- **Test:** `tests/kaishot.py` (3D, vec-pakkene): Tromsø, Bergen, Bodø, Båtsfjord og Finnsnes om natta, bakken under hvert skrog ved kai under sjøen, bilder i `tests/out/kai_*.png`.

#### 4.16d Én nasjonal kystflåte: registerets båter i havnene (L2/N1 av `docs/planer/bestand-og-flaate.md`, 02.11.2026)

Båtene i havnene langs kysten er fartøyregisterets aktive båter under 28 m, kommune for kommune. Før var det én båt per 150 m kaifront.

- **Kildene:**
  - Registerets aktive båter per kommune, lengdegruppe og hovedredskap kommer fra `fiske.json` `kom` (B1: fartøyregisteret og sluttsedlene, NLOD).
  - Havnene, kaiplassene, feltene og leiene er kartpakkenes (`npc.py`, uendret, ingen ny kartrelease).
  - Kommunen per havn kommer fra Geonorges kommuneinfo (Kartverket), slått opp én gang og lagret i `tools/npc/cache/kommune.json`.
- **`tools/npc/flaate.py` → `src/data/flaate.json` (65 kB):**
  - Kommunens aktive båter fordeles på havnene der: de største båtene først, hver på den minste ledige kaiplassen den passer.
  - En båt uten egen plass deler en plass i havna med flest plasser og ledig rom, høyst 16 båter per havn. Spillet flytter den langs kaia eller ut på bøye (`coastMoor`, 4.16b-L1).
  - Når kommunens største ledige plass er kortere enn båten, regnes båten så lang som plassen. Det gjelder 671 båter: kartets kaier er laget for båter på 7–11 m, så 11–14,99 m gir 403 plasserte mot registerets 624.
- **Målt 02.11.2026:**
  - 4 134 aktive båter under 28 m. 3 995 av dem er plassert (1 464 deler kaiplass), 2 har ingen kaiplass, og 137 er i 10 kommuner uten havn i pakkene, mest Senja, der `FLEET` er flåten.
  - 1 193 av 3 187 havner ligger tomme, fordi kommunen ikke har flere aktive båter.
  - Båter innen 15 km, før (én per kaiplass) → etter:

    | Sted | Før | Etter | Redskap etter |
    |---|---|---|---|
    | Honningsvåg | 23 | 150 | garn 63, jukse 48, line 28, teine 9 |
    | Båtsfjord | 9 | 48 | 36 linebåter |
    | Bodø | 21 | 20 | |
    | Bergen | 23 | 13 | |

- **I spillet** (`05-vessels.js`):
  - **Båtene:** `flaateApply` (fra `vecFinish` i `01c-vec.js`) legger registerets båter på havnas kaiplasser med lengde, bredde, dypgang, lengdegruppe og redskap. En smalere båt flyttes inntil kaia med halve forskjellen i bredde.
  - **Åpen gruppe:** en båt under 11 m fisker i åpen gruppe ved trekning. Andelen (`openShare`, 0,60) er 2 100 båter (`OPENF.n`) mot de plasserte under 11 m. Båten blir liggende i havn når gruppa er stoppet og fangsten er nesten null (`openDone`, `trykkOpenScale`).
  - **Spillernes hjemler:** båtene bak hjemlene spillerne eier, vises ikke (`heldShare`: registeret på serveren, `npcReg`, per lengdegruppe).
  - **Feltet for dagen** trekkes etter flåtetrykket der (`coastGround`, `fleetF` for torsk, sei og hyse, med 0,2 til hvert felt).
- **Senja-ruta (02.11.2026, Jonas: «Fiks sånn at Senja også har havner slik at området fungerer som det skal langs hele kysten»):**
  - `tools/npc/senja.py` kjører `npc.build` på de fire rutene over Senja-ruta med lagene fra spillets egne pakker (masken og dybden fra sim-pakkene, kaifrontene fra vec-pakken), med Senja-ruta sluppet inn. Det gir samme regel som resten av kysten uten ny kartrelease. Prøvd mot en rute utenfor Senja: byggingen fra pakkene gir nøyaktig de samme havnene og kaiplassene som kartreleasen.
  - 103 havner med 261 kaiplasser. `flaate.py` leser dem fra `tools/npc/cache/senja.json` og legger dem i `flaate.json` (`x`), og `flaateApply` legger dem etter pakkens egne havner (`h.senja`).
  - Senja kommune (5530) får registerets båter minus de 14 i `FLEET` (8 under 11 m, 5 på 11–14,99 m, 1 på 15–20,99 m). `FLEET` står, med sine navn og ruter.
  - De nye båtene holder seg unna `FLEET`-båtenes kaiplasser (`moorAround`). En båt kan ligge utenpå en `FLEET`-båt, slik båter gjør i en full havn.
  - Plassert langs hele kysten: 4 105 av 4 120 aktive. Bare 13 båter i 7 innlandskommuner står uten havn.
- **Redskapet i sjøen (02.11.2026, Jonas: «Garn, liner og annet utstyr skal være synlig og vises i kartplotteren»):**
  - En båt med passivt hovedredskap (`garn`, `line`, `teine`; `blandet` trekkes til garn eller line) har redskapet sitt i sjøen (`coastSet`, `coastGearKind`). Garnbåten har en lenke på 0,35–0,8 km på ukas felt. Teinebåten har en lenke på 0,4–0,9 km på månedens felt. Linebåten setter en line på 1,4–3 km om morgenen og trekker den samme dag.
  - Lenka ligger fra båtens plass på feltet, snudd til begge ender og linja mellom er på vann.
  - Dagen ute: garn- og teinebåten drar lenka a→b og setter den igjen b→a. Linebåten setter a→b, står ved enden i noen timer og drar b→a. Delen som er i sjøen, følger båten.
  - Garn og teiner blir stående når været holder båten inne.
  - Jukse- og snurrevadbåtene driver som før.
  - Alt er en funksjon av klokka og båten, så alle spillerne ser det samme.
  - `NPCGEAR` fylles av `coastNear` (og havflåten, 4.17) for båtene innen rekkevidde. Kartet (`gearSvg`) tegner lenkene i grått med oransje bøyer, uten navn. 3D-plotteren (`paintPlotter`) tegner dem sammen med de andre spillernes (`PEERGEAR`) og dine egne, og sjøen i 3D (`drawGearSea`) setter blåsene på endene.
  - **Hvem som eier redskapet (Jonas 02.11.2026: «Trenger ikke å vises navn i kartet, men at man eventuelt kan trykke på fiskeredskapet for mer å få opp info om hvem som eier redskapet»):** et trykk på en bøye i kartet til en annen spiller eller en NPC-båt (`otherGearHit`, etter dine egne bøyer og AIS-båtene) åpner et kort (`otherGearCard`) med redskapet, eieren (spillerens navn, eller «Fiskefartøy»), båten, lengden og avstanden. Spillerens navn og båt kommer fra den nye `gear_near2` (`supabase/migrations/20261102130000_gear_owner.sql`, Jonas må kjøre den). Til den er kjørt, henter spillet redskapet med `gear_near` som før, uten eier. Navnet vises som tekst, og et navn admin har tatt bort, kommer ikke med.
- **Ikke gjort ennå:**
  - Kortere båter enn i registeret der kartet mangler lange kaier.
  - Garnet og lina mellom bøyene vises ikke under vann i 3D, bare blåsene.
- **Tester:**
  - Ny `tests/unit/flaate.test.mjs` (14 sjekker).
  - `npctest`: havnene har `flaate.json` sine båter, og «hver båt ligger langs en kaifront som er lang og dyp nok» står.
  - Grønne: `havntest`, `harbourtest`, `trip2`, `keeptest`, `autonavtest`, `turtest`, `decktest`, `worktest`, `towtest`, `tattest`, `peergear`, `vectest`, `vindshot` og `heattest`.

#### 4.17 Havflåten som NPC (H1 av `docs/planer/bestand-og-flaate.md`, 02.11.2026)

Registerets aktive fartøy på 28 m og over seiler etter klokka, som kystflåten.

- **`tools/npc/havflaate.py` → `src/data/havflaate.json` (36 kB):**
  - **Fartøyene:** `fiske.json` `kom`, lengdegruppe 28+ per kommune og hovedredskap: 249 aktive, og 248 får en hjemmehavn. Fordelingen er 111 trål, 72 ringnot, 22 snurrevad, 21 autoline, 17 teine (snøkrabbe) og 5 garn.
  - **Modellene:** hvert fartøy er spillets egen modell av sitt slag, i modellens lengde: `bunntral`, `pelagisk`, `ringnot38` (snurrevad og garn), `autoliner` og `snokrabbe`. Registeret gir bare lengdegruppen.
  - **Hjemmehavn:** et mottak i kommunen som tar imot redskapet (`Trål`, `Not` eller `Konvensjonelle` i `mottak.json`), med lengst kai. Har kommunen ikke noe, brukes det nærmeste innen 250 km fra kommunens punkt (Austevoll, Herøy). Kommunenavnene og -punktene kommer fra Geonorge.
  - **Felt og sesong:** sluttsedlene for 28 m og over per redskap (`sp` `k` og `h`, idx redskap*6+4) som kilo per måned og hovedområde. For hvert redskap tas de 12 tyngste områdene, med opptil tre punkter med vann i redskapets dybde. Punktene ligger 6 km fra land for trål, line og teine (28 m og over fisker utenfor 4 nm, J-161-2026 § 32) og 2 km for resten.
  - **Borte:** områder utenfor rammen eller uten slikt vann er «borte» (14 av 164; Bjørnøya, Svalbardsonen, Nordsjøen vest og snøkrabbefeltene øst).
  - **Leiene:** fra farledsnodene mottaket når med et rent rett strekk, til nodene feltet når (`pa` og feltets siste felt). Spillet finner veien gjennom nettet (`lnetPath`).
- **I spillet (`core/05d-hav.js`):**
  - **Syklusen:** havnedager og en tur. Lengden avhenger av redskapet: trål 5–12 døgn, ringnot 2–5, snurrevad 3–6, autoline og snøkrabbe 14–28, garn 4–8.
  - **Sesongen:** turens felt trekkes etter månedens landinger for redskapet. En måned med lite gir færre turer, så ringnotflåten ligger mest i havn om sommeren (`havTrip`).
  - **I havn:** skipet ligger ved en kaifront nær mottaket som står i 3D og er lang og dyp nok (`npcBerths`, `quayFit`). Finnes ingen, vises det ikke i havn.
  - **Til feltet:** langs farledene og rett ut fra siste node, med 11–13 knop.
  - **På feltet** fisker skipet som redskapet sitt (`havFish`):
    - Trålen tauer i 5 timer med 4 knop fram og tilbake gjennom feltet, og trålen står ute i 3D (`drawTrawl` med slepetilstanden).
    - Ringnota leter i 3 timer, kaster rundt stimen og snurper. Snurrevaden tar et kast hver 3. time.
    - Autolineren setter en line på 10 km på 1,2 timer og drar den forrige på 10,8 timer.
    - Snøkrabbe- og garnfartøyet har seks lenker side om side og drar og setter dem etter tur.
    - Linene og lenkene går i `NPCGEAR`.
  - **AIS:** skipene innen 15 km (`havNear`, `npcStates` med id `v…`) med båttype, redskap, størrelse og status («Tråler», «Kaster nota», «Setter og drar line»). `havNear` regner bare ut skipene som kan være nær: i havn nær deg, eller på en tur der leia kan gå forbi.
  - **Borte:** et skip med felt utenfor rammen vises ikke på turen.
- **Forenklet, og sagt rett ut:**
  - Leveringen er alltid ved hjemmemottaket.
  - Nota og snurrevaden vises ikke i 3D; trålen gjør det.
  - Feltpunktene innenfor et hovedområde er trukket, ikke målt.
  - Fartøyene tar ikke fisk av spillets bestand. Den delen er med i flåtetrykket (B3, `03g-trykk.js`).
- **Tester:**
  - `tests/unit/hav.test.mjs`: sesongene (trålerne på Tromsøflaket, Finnmarkskysten og i Lofoten i februar; ringnot på makrellen i september og på silda utenfor Troms i november; ringnot mest i havn i juni), snøkrabbe for det meste borte, leia, en tur ut–fiske–inn, trålen innen feltet, linene og teinelenkene.
  - `tests/havflaate.py` (med vec-pakkene): leiene holder seg av land, skipene ved Tromsø i februar, kai som passer, egne modeller, tiden og en tråler som tråler.

#### 4.16c Liggeplass for spillerens båt i havnene (D2 av driftsplanen, Jonas 23.10.2026)

Jonas: «Båten burde som oftest ligge til en skikkelig kai fremfor å ligge på anker … Vår båt burde også kunne ligge ved disse om det er en ledig plass som passer vår båt, i verste fall skal man kunne ligge ved fiskemottak, utstyrsbutikker, verft eller på anker, men anker vil som regel være siste alternativ med mindre man har en veldig stor båt.» Svarene: A b (havneavgift per døgn etter lengden), B a (god hvile bare om bord med køyer), C «fra 24 Meter og opp» (anker er vanlig fra 24 m), D a (serveren holder rede på hvem som ligger hvor).

- `core/07e-havn.js`. Havnene er vec-pakkenes NPC-havner (`t.npc`, 4.16), id `hv<tx>_<ty>_<i>`. Uten vec-pakker (artifacten uten `KYST_VEC=1`) finnes ingen havneplasser, og alt annet virker som før.
- **En plass** (`havnBerths(H, type, vid, n)`) er en strekning av en kaifront (`quays`) eller en side av en flytebrygge (`FDOCK`) i havna: båtens lengde + 2 m (`HAVN.margin`, trinn 2 m), dybde ≥ dypgang + 0,5 m ved sjøkartnull (laveste tidevann), `quayFit` for kaitypen, og fri for havnas egne båter (`moorAround`), selskapets andre båter, plasser andre spillere holder (`HVC`, serverens svar), brygger (`obsSegHit` på midtlinja og begge sider, klaring 0,15), kaiplater (punkt i polygon) og moloer (3 m, eller inne i en lukket molo). Rangering: kaitype 2 (kai) → 0, flytebrygge → 0,5, brygge 0/1 → 1, kystkai 3 → 2, så avstanden.
- **Plassen som sted:** `havnPlaceOf` gjør plassen til et sted med id `hs:<hash>` (nøkkelen `hid:q<face>@<a>` eller `hid:d<i><a|b>@<s>`), som `portById` kjenner gjennom `PORTX` (`01-world.js`), og som lagres i `S.havn = {h, s}`, så den finnes før pakken er lastet. Den har ingen tjenester (handel bare på de tre handelsstedene). `quayFace` gir `havnFace`, og `berthPose` legger båten langs plassen. Plasser som bare er sett, glemmes etter et døgn (`havnPrune`).
- **Holdt:** plassen er båtens mens hun ligger der eller den er planens hjem (`havnHold`/`havnFree`; `dock` holder, avgang slipper). Fortøy-lista (`moorAll`) har nærmeste ledige plass, kartet viser havnene (`.havn`, navnet fra zoom 4), og et trykk nær en havn går dit (`havnTapNear`, også i `leiaTo`). Autonav går helt inn til plassen.
- **Havneavgift** per påbegynt døgn etter lengden (`HAVN.due`, `havnMinute`): 190 kr under 12 m, 380 kr 12–15 m og 590 kr over 15 m. Kilde: Herøy kommunes satser for næringsfartøy 2026; gjestehavnene tar omtrent det samme (Brosundet gjestehavn i Ålesund 200/375/500 kr). Loggen: «Havneavgift i X».
- **Navn** (`havnNm`): nærmeste lokale navn i kartet (by eller tettsted innen 1,2 km, bukt eller sund innen 1 km, øy innen 0,7 km; skjær, grunner og vann tas ikke med) + «havn», og hver havn får sitt eget blant naboene innen 2,5 km (den som ligger nærmest et navn, tar det først). Ellers stedet havna ligger i og hvilken side av det (Bodø øst havn). Ingen firmanavn. Stikkprøve 24.10.2026: Tromsø havn, Hungerbukta, Lilleholla, Tromsøysundet, Lanesbukta, Tromsdalen; Bergen havn, Sjøflyhavnen, Breiviken; Bodø havn, Nyholmsundet, Hernes, Skagen; Båtsfjord havn, Liholmen; Hammerfest havn, Meland, Rypefjord, Indrefjorden.
- **Serveren** (`supabase/migrations/20261023120000_berths.sql`, lagt inn 24.10.2026): tabellen `berths` (RLS uten policyer) og `berth_get(hid)`, `berth_put(...)` → `'ok' | 'taken' | 'full'` og `berth_free(slot)`, bare for `authenticated`. Et krav varer 30 dager og fornyes av `havnRenew` hver 6. time (`ui/10f-cloud.js`); høyst 30 per spiller. `havnAsk` spør om en havn høyst hvert 2. minutt. Svarer serveren `taken`, får båten en ny plass i samme havn (`havnMoved`). Prøvd i databasen med to spillere: `ok`, så `taken` for den andre, og `berth_free` sletter bare eierens.
- **3D:** båten ligger ved `berthPose`. Ved en holdt plass langs en kaifront av type 2 tegnes betongkaia (`kai_betong`, fag på 6 m, `DKM.kaib`) langs plassen, og langs strand (type 3) trekaia på påler (`kai_tre`, `DKM.ktre`) for båter under 15 m (større: betong). Fingrene (`finger`) er ikke tatt i bruk: båtene ligger langs flytebryggene, slik havnas egne båter gjør, ikke inn mellom fingre. Fortøyningen inn i 3D tar opptil 45 s (`moorStep`).
- **Vannet ved plassen i 3D** (`berthPits`/`berthPit` i `view3d.js`): kaifrontene i pakkene ligger på den fine kystlinja, og strandskråningen i 3D (`COAST3`: 2 m over sjøen ved linja, ned 1 på 3) satte båten på stranda (målt i Bodø: +0,9 m 3 m ut, der båten ligger). Foran en holdt plass går bakken derfor ned til 3 m under middelvann (dypgang + 1 m om det er mer), ut til båtsida + 6 m, langs lengden + 3 m i hver ende og 4 m inn under kaidekket, så trinnet mellom terrengpunktene (4 m i det fine nettet) ligger under kaia. Plassene som holdes, leses hver ramme, og når de endres, lages terrengbitene innen 700 m og det nære og fine nettet på nytt. Fra 24.10.2026 graves det også ut ved NPC-båtenes kaiplasser der bakken står over −1,2 m under skroget (`npcPits`: ut til båtsida + 6 m, langs lengden + 3 m, og bare 1,5 m inn fra fronten, fordi ingen kai av våre tegnes der), for havnene innen 2,5 km, sett på hver 30. ramme og holdt i ruter på 64 m. Før og etter i Båtsfjord, Tromsø og Bodø: båtene lå på stranda og flyter nå ved kaia. Kontrollbilder 24.10.2026: Bodø (trekai, strand), Båtsfjord (betongkai), Tromsø (brygge).
- Test: `havntest.py` (bygger `dist-vec/` selv) i Bergen, Bodø, Tromsø og Båtsfjord: havner med ledig plass for sjark og 15 m-båt, plassen på vann og dyp nok, fri for havnas båter, Autonav inn, fortøyd, holdt og avgift per døgn, ikke gitt til selskapets andre båt eller der en annen spiller ligger, og sluppet ved avgang.

## 5.14 NPC-flåte og kartplotter

- **Kaiplasser** (`berthSlot`, `berthShift`): Hver NPC-båt har en egen plass langs kaia, 30–60 m fra havnepunktet. Plassen er kontrollert mot land, og båter i samme havn ligger minst 20 m fra hverandre. Forskyvningen avtar over 150 m.
- Kystruteskipet og ferja har egne plasser, 70 m unna.
- **NPC-modellene** (V9): Hver båt i `FLEET` får den dekkede kystmodellen nærmest i lengde og bredde (`npcKit`), skalert til egne mål, i en av fire fargedrakter (`LIVERY`: egen, marineblå, rød, grønnblå). Innenfor 500 m tegnes den med full detalj (lod 1) med skipper i styrhuset og to på dekk når hun fisker, innenfor 1,5 km med lod 0,3 (rundt 5 000 punkter), og lenger ute som de gamle boksmodellene. Lanternene følger modellen. I kartplotteren er ikonet større jo lengre båten er.
- **Trykk i kartplotteren:** Trykk nær en havn går til havna, ikke til en fortøyd båt. Fortøyde AIS-mål tegnes mindre og svakere.
- **Fangstprikkene** (`S.marks`, fra 05.10.2026): Hver fiskeøkt og hvert trekk gir en prikk i kartplotteren, farget etter kilo i timen. Prikken forsvinner 12 spilltimer etter at den ble satt (Jonas 05.10.2026: «Prikkene med fangst-rate skal forsvinne etter 12 in-game timer», `MARK_LIFE` i `ui/03-map.js`). `renderDyn` tegner kartet på nytt når den neste går ut. Prikkene blir liggende i lagringen, så sluttseddelen finner fortsatt feltet.
- **Egne merker** (`S.pins`, `ui/03-map.js`, fra 06.10.2026, ønske fra en spiller): hold fingeren stille i kartplotteren i 0,55 s, så settes et gult flagg (ikke et veipunkt). Et trykk på flagget åpner et kort med navn, posisjon og avstand, «Rute hit» (legger et veipunkt) og «Slett». Merkene lagres med spillet, ikke per båt, og blir liggende til de slettes (høyst 60). `routetest.py` sjekker det med berøring.
- **Varmekartet** (`core/12-heat.js`, `ui/03c-heat.js`, fra 01.10.2026): Kartplotteren viser fisken i en sirkel rundt båten du følger, i både Navigasjon og Fiskekart, ut fra ekkoloddet eller sonaren (tabellen i 5.1). Kartplotteren er ikke nødvendig.
  - Rutene ligger på et fast rutenett i verden (`HEATC`), så bildet ikke flimrer. De regnes ut med `heatSample()` fra den samme `density()` som fangsten, i biter på 5 ms (`heatWork`). Nærmeste ruter regnes først, og litt foran båten når den går. Ved nytt bestandstime regnes de på nytt. I havn, i skjult fane og før dybdedataene er lastet regnes ingenting.
  - Det båten har passert, gløder etter og blekner over 30 spillminutter (`HEAT.glow`). Så glemmes det.
  - Tegnes på `#heatcv` under SVG-kartet: ettergløden og de levende rutene. Skalaen er logaritmisk (4,5–150 kg/t internt), og det enkle ekkoloddet viser fire trinn.
  - **Fargene** (Jonas 05.10.2026, før lys turkis, blå og lilla fra 02.10.2026): fem trinn som et ekkolodd, hvitt (gjennomsiktig, så kartet viser seg) under 10 kg/t, så blått fra 10, grønt fra 20, gult fra 40 og rødt fra 80 kg/t (`HEAT_STEPS`, `HEATPAL`). Det enkle ekkoloddet viser trinnene som de er, og de bedre glir mellom dem, så bare ansamlingene av fisk synes, og fargen skiller mengdene. Under 10 kg/t er det klart, og fargen er tett like over. Den grå skiva og den stiplede ringen er borte.
  - **Myk kant:** Bildet tegnes med uskarphet på 5 % av radien. Hver rute husker hvor nær båten den har vært mens den har lyst (`c.near`, andel av radien), og dekningen går fra full innenfor 55 % av radien til ingenting ved ringen. Sporet bak en båt i fart beholder dermed fargen, mens sidene og forkanten fader ut.
  - **Ingen tall for fisken** (brukerens krav 01.10.2026): Spilleren skal aldri se kilo eller kilo i timen for fisken. Varmen viser hvor fisken står tett, ikke hvor mye en båt vil ta. Feltet `#heatBox` i navigasjonslinja øverst i plotteren (`#ecdisTop`, etter SOL) viser bare instrumentet, rekkevidden i nm, en fargestripe fra «lite» til «mye fisk» og artsbrikka. Teksten i `title` har resten. Med sonar står det også hvor stimene trekker (bare retning), og under første tur at full last er garantert.
  - Valgene står under «Innstillinger» i navigasjonslinja (`#plotSet`, `plotSetOpen`): kartplotterens innstillinger (`chartSettings`), «Ekkolodd: På | Av», «Sonar: På | Av» og «Art: Alle | Torsk | Hyse | Sei» (`S.settings.heatSp`, bare med CHIRP eller sonar).
  - **Egen skala per art** (08.10.2026, tilbakemelding: lyr, lange, brosme, uer, kveite og blåkveite ble aldri farget): fargene gjelder tall i kg/t, men de sjeldne artene når aldri 10 kg/t på håndsjøl. Valgt art tegnes derfor mot sitt eget nivå (`HEATSC` i `core/12-heat.js`, `heatShown`): de tykkeste 2 % av stedene der arten finnes, ligger på grensen mellom grønt og gult, og de beste stedene over. Faktorene er målt fra Rogaland til Varanger og på eggakanten, fire årstider: hyse 4, lyr 15, lange 12, brosme 11, uer 20, kveite 30, blåkveite 5 og kongekrabbe 3. Torsk og sei har faktor 1 (98. persentil 20 og 25), og «all fisk» er den vanlige summen. Bare bildet skaleres: tallene bak (`heatValue`), og dermed fangsten, er som før. Etter målingen får 8 til 28 % av havet blått for hver art, mot 13 % for torsk.
  - **Kongekrabbe på CHIRP og sonar** (08.10.2026): siste valg i artslista (`HEAT.sp`, indeks 10 i `heatSample`), etter teinemodellen (`kingArea`, bestanden `S.cstk`). Den er ikke med i «all fisk», og sonaren sier ikke hvor den trekker, for krabben står på bunnen. Den vises der den finnes: svært lite i Troms, mer fra Loppa og Sørøya, mest vest for Nordkapp og øst for 26° Ø.
  - Ekkoloddvinduet (`#echoWrap`) er fjernet (02.10.2026). GPS-boksen (`#instr`, `INSTR`) står igjen.
  - **Konsollen i 3D** (skiffen) viser den samme varmen (`heatDrawInto`) og «EKKOLODD AV» når ekkoloddet er av. Med CHIRP viser konsollkartet litt mer enn ±1,1 km.
  - Ytelse: Rundt 10 µs per rute her og rundt 40 µs med CPU-en struping fire ganger. Hele sonarsirkelen (4 000 ruter) tar 0,15–0,18 s fordelt på biter, og en full oppdatering kommer hvert annet spillminutt.

## Jevn bevegelse i 3D (02.11.2026)

`drawNPC` (`view3d/20-trawl-seine.js`) regner båtene med sin egen klokke (`npcClock`): spillminuttet og tiden siden, ikke holdt på 0,999 av minuttet som `currentFrac`. Før sto båtene stille i opptil 0,2 s hvert tiende sekund, til 200 ms-ticken tok neste minutt. Klokka går aldri bakover med en brøkdel; et ekte sprang (innhenting, nytt spill) tas som det er. Kursen båten tegnes med, dreier mot den virkelige over rundt et halvt sekund (`npcHead`), så den ikke snur på stedet i et hjørne av ruta eller mellom drift og tilbakeløp. Posisjonen er fortsatt nøyaktig. En snuing over 150° (ved kai) og båtene på slep tas med en gang.

**Realistisk bevegelse** (03.11.2026, Jonas: «NPC-båter også må oppføre seg realistiske»): `npcFollow` i `drawNPC` lar farten båten tegnes med følge farten klokka gir over 0,6 s (`NPCV_T`), så den tar fart og slakker av gradvis og svinger i en bue på noen titalls meter i skjermens tempo i stedet for på stedet. Den trekkes tilbake mot den nøyaktige plassen over 2 s (`NPCP_T`), og over 80 m unna (`NPCF_SNAP`: ny båt, ute av syne) settes den rett dit. Med fart (over 1–3 m/s på skjermen) peker baugen dit båten går; en båt som driver, ligger som klokka sier. Den krenger i svingene (høyst 0,12 rad, en tredjedel for kystruta og ferja). Andre spilleres båter og båter på slep tas ikke med (de har sitt eget spor). Kartet og AIS-en viser fortsatt den nøyaktige plassen. NPC-båtenes ruter, avgang, fiske og hjemtur er som før.
