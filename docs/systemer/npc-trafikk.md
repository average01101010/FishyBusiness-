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
