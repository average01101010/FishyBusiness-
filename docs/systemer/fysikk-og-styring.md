# Fysikk, stabilitet og manuell styring

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.21 Skipsstabilitet og båtens bevegelser (02.10.2026)

Brukerens ønske: båtene skal oppføre seg i sjøen etter prinsippene for skipsstabilitet.

Brukerens valg: bevegelse og spill. Båten kantrer ikke, men det kommer tydelige varsler. Ising er ikke med nå.

Fila er `core/03c-stability.js`.

- **Hydrostatikk** (`hullOf`, `stabOf`) fra `VESSELS` (len, beam, draft, disp):
  - Skrogets midlere dypgang gir en blokkoeffisient på minst 0,35. Draft i `VESSELS` er det dypeste punktet.
  - Vannlinjekoeffisient Cwp = (1 + 2·Cb)/3.
  - KB = T·(5/6 − Cb/(3·Cwp)) (Normand) og BM = Cwp²·B²/(11,75·Cb·T) (Murray).
  - Fribord 0,35 + 0,035·L (maks 2,5 m). Dekkskanten går under ved atan(2f/B).
  - Tyngdepunktet: små og åpne båter ligger lavt (KG er en andel av dybden), større båter er bygd til GM ≈ 0,09·B + 0,3 m. Den stiveste av de to gjelder.
  - Resultatet er GM 2,1 m for skiffen, 0,64–0,77 m for sjarkene, 0,9–1,0 m for kystbåtene og 1,3–1,7 m for havbåtene. Alle er over IMOs 0,35 m for fiskefartøy med ett dekk (IS-koden 2008, del B 2.1).
- **Egenperioder:**
  - Rull etter IMOs værkriterium (IS-koden 2.3): T = 2·C·B/√GM, C = 0,373 + 0,023·B/d − 0,043·L/100, med B/d maks 3,5 som formelen er tilpasset.
  - Skiffen ruller på 1,5 s, sjarkene på 4–5 s, kyst21 på 6,1 s og den pelagiske tråleren på 9,2 s.
  - Hiv og stamp: T = 2π·√(Cb·T·1,8/(g·Cwp)).
- **Last** (`stabLoad`):
  - Fangsten ligger lavt i rommet (på dørken i en åpen båt).
  - Karene som venter, og redskapen ligger på dekk (midten 0,8 m opp). Teine 15 kg (stor 25), garn 9, linestamp 25, juksasett 6.
  - Sidene faller ut, så BM faller som (Δ0/Δ)^0,4.
  - Innenfor `gearMax` holder båtene seg over IMOs minimum: sjarken med 150 teiner har GM 0,58 m. Med 500 teiner kommer den ned i 0,32 m.
- **Bevegelser i spillet** (`motionAt`):
  - Vindsjø og dønning møtes hver for seg med møtefrekvensen ωe = |ω − k·v·cos μ|.
  - Rullet svarer på bølgehellingen π·Hs/λ på tvers som en dempet svingning (0,12 av kritisk for spredt sjø), med resonans når møteperioden treffer rulleperioden.
  - Hiv og stamp følger bølger lengre enn skroget og jevner ut de kortere. Vertikal akselerasjon regnes en tredjedel av lengden foran midten.
  - Vind fra siden gir slagside: 0,5·ρ·U²·1,2 på siden over vann (`windHeel`).
- **Arbeidet** (`hsWork`, `motionHere`):
  - Fiske og arbeid om bord (`catchFactors` med bølgehøyden den får, `workTeam`, `teamEff`) bruker bølgehøyden skalert med hvor mye båten beveger seg, mot det samme skroget i drift med siden mot sjøen og tomt dekk. `simday` er uendret (±10 %), og `progweek` gir 312 211 kr mot 312 801 kr uten.
  - Kalibreringen holder derfor i snitt, mens kurs, fart, last og resonans teller.
  - 1 m/s² vertikal akselerasjon teller like mye som 10° rull. Faktoren er avgrenset til 0,6–1,8.
  - Eksempel: skiffen i 18 kn mot sjøen får 1,64, undan sjøen 0,6.
- **Varsler** (`stabState`, `stabTick` én gang i minuttet på sjøen):
  - Redusert når GM er under 0,35 m eller rull + slagside når 60 % av vinkelen til dekkskanten.
  - Kritisk når GM er under 0,15 m eller 90 %.
  - Årsaken er «rank» (for mye på dekk), «synkronrulling» (endre kurs eller fart) eller «kraftig rulling» (legg baugen mot sjøen).
  - Varslene kommer i loggen og i HUD-en. Vær-panelet viser GM, rulleperioden, rullingen og slagsiden.
- **3D** (`updateBoat`):
  - Skroget svarer som en dempet svingning i hiv og stamp (demping 0,35) og rull (0,08), med egenperiodene fra `stabOf` med lasten.
  - Sjøen snittes over vannlinjen i 3×3 punkter, så lange skrog rir over kort sjø.
  - Vind fra siden gir slagside mot le.
  - Skjermen går 6× fortere enn ekte tid, så møteperiodene i 3D er kortere enn i spillets regning. Den høye frekvensen dempes bort av egenperiodene.
- **Ikke med:** ising, kantring, fri væskeflate i rommet, en GZ-kurve forbi dekkskanten (rullet er bare begrenset til 1,6 × dekkskantvinkelen), og Sjøfartsdirektoratets egne krav for fiskefartøy under 15 m (ikke sjekket i detalj).

**Kilder:**
- IMO International Code on Intact Stability 2008: værkriteriet 2.3 og kravene til fiskefartøy i del B 2.1
- Normand og Murray (anslagene for KB og BM)

## 5.22 Manuell styring (03.10.2026)

Brukerens ønske: en frivillig mulighet til å styre båten selv, med gass og ratt på skjermen.
- **Filer:** `core/16-helm.js` (simuleringen), `ui/10d-helm.js` (kontrollene), `helmtest.py`.
- **Innstillingen:** «Manuell styring» på/av i Innstillinger (`S.settings.manual`).
- **Kontrollene i 3D:**
  - Gassen står til høyre: fram, nøytral og bak. Den klikker inn i nøytral innenfor 7 % og blir stående der du slipper.
  - Rattet (joysticken) står til venstre. Sideveis er roret, og det går tilbake til midten.
  - Begge er 16 % synlige til du rører dem.
- **Å ta roret:** rører du kontrollene på sjøen (`helmTake`), stopper ruta eller Autonav. Lager du en ny rute, styrer ruta igjen (`helmOn` krever at det ikke finnes noen `S.plan`).
- **Klokka er den felles** (6×). Jonas ville ikke ha ekte tid mens man styrer, fordi alle spillerne deler klokka.
- **Simuleringen** (`helmStep`) flytter båten hvert tikk (200 ms) med spillsekundene som har gått:
  - Farten følger `BOAT.accel` per spillminutt.
  - Svingen følger `turnR` når båten har fart, med litt propellstrøm når den står stille i gir. På skjermen svinger den høyst ½ rad/s.
  - Drivstoff går etter `fuelLph`.
  - Grunnstøting skjer som med en rute.
  - **Land** stopper båten. Over 3 knop går den på grunn med skade, saktere legger den bare an. Grunnsjekken regner bare grunt vann som grunn, fordi rutene holdes unna land.
- **Kast loss og Fortøy:**
  - «Kast loss» i havna lar deg starte fra kaiplassen (`helmCast`, `helmCastDone`).
  - «Fortøy i …» kommer når du er under 3 knop innen 80 m fra kaiplassen eller 120 m fra havnepunktet (`helmMoorable`).
- **3D:** båten følger simuleringens posisjon tett, og svingen gir krenging og kjølvann som med en rute.

## 5.58 Fysikk 1: manøvreringsmodellen (Jonas 18.10.2026: «fullverdig fysikkmotor til båtene»)

**Avgjørelsene** (Jonas 18.10.2026): 1. styringen går i spilltid; 2. Autonav går på samme modell; 3. kollisjoner og grunnstøting skal få konsekvens, laget bra og intuitivt (Fysikk 3). Og 19.10.2026: verden går 6×, bølgene i ekte tid, den korte sjøen i båtens ramme (5.20b), fysikken i spilltid.

**Modellen** (`core/16b-dyn.js`): spillerens egen båt under fart (rute, Autonav eller hånda på roret) beveger seg etter en manøvreringsmodell med tre frihetsgrader i skrogets ramme, surge u, sway v og gir r (Fossen 2011, kap. 7):
- Skrogkreftene er lineære deriverte etter Clarke, Gedling og Hine (1983) fra lengde, bredde, dypgang og blokk-koeffisient (regnet av deplasementet, klemt til 0,35–0,75). Regresjonene er laget for skip, og på en liten båt med kjøl lar de sway-gir-koblingen bli nesten like stor som dempingen (roret ville spunnet henne rundt). Girdempingen `Nr` heves derfor til stabilitetsmarginen er halvparten av dempingsproduktet (`kNr` i tabellen). Tilleggsmasse i sway og gir fra samme regresjoner, 5 % i surge.
- Roret er en løfteflate på 2,5 % av L·T med løftehelning 1,8 per radian (1,1 ved 35°, der et lavt ror steiler), 0,45 L akter for dreiepunktet, i skruens strøm (`uR2 = u|u| + 0,35·gass·vmax²`), så hun styrer litt i gir ved kai og motsatt vei akterover. Hardt over er 35°, rorhastigheten 35°/(1,2 s + L/8).
- Motoren gir en skyvkraft av hestekreftene ved toppfart (`0,55·P/vmax`) som faller med farten; motstanden er kvadratisk med et lite lineært ledd, satt så full gass holder toppfarten. Sjøens tak på farten (`speedCap`) skaleres inn som økt motstand, så båten kjenner det i sjøen og ikke bare i kommandoen. Akterover 60 % skyv.
- Litt ulineær girdemping, og en grense for sideakselerasjonen i svingen (0,25 g deplasement, 0,45 g planende), som er det som styrer radien på en planende båt i stor fart.
- Integrasjonen går i steg på 0,2 spillsekunder med dempingen implisitt, så den er stabil uansett steglengde.

**Kalibreringen** (`dynCal`, én gang per båttype, rundt 20 ms): roret skaleres (`rs`) til den stasjonære svingradien med fullt ror i marsjfart er båtens `turnR`, klemt til 1,2–2 lengder (alle båtene ligger på 2 L, fordi `turnR`-tallene var satt for den gamle følgeren og er 4–7 L). Så måles tid til 90 % fart, svingsirkelen (advance, tactical diameter), stoppveien fra hver fart med en tredjedel akterover (tabellen `stop`), og Nomotos K og T fra sprangresponsen. IMO (resolusjon MSC.137(76), for skip over 100 m) krever advance ≤ 4,5 L og tactical diameter ≤ 5 L; fiskebåtene våre ligger på 3,7–6,6 L og 4,3–7,2 L. Målt 19.10.2026:

| Båt | L | t90 | R/L | adv/L | td/L | T (s) | K | stopp/L | drift |
|---|---|---|---|---|---|---|---|---|---|
| skiff | 5,9 | 11 s | 2,0 | 5,7 | 6,0 | 1,3 | 0,61 | 11,4 | |
| trebåt | 7,0 | 13 s | 2,0 | 4,1 | 4,6 | 2,4 | 0,24 | 3,9 | 9°, −25 % fart |
| snekke | 7,9 | 7 s | 2,0 | 3,8 | 4,3 | 2,5 | 0,28 | 2,3 | |
| plastsjark | 9,4 | 5 s | 2,0 | 3,7 | 4,3 | 2,9 | 0,27 | 1,4 | |
| sjark | 10,6 | 7 s | 2,0 | 4,0 | 4,3 | 2,8 | 0,25 | 2,1 | 12°, −19 % |
| hurtigsjark | 11,0 | 13 s | 2,0 | 5,4 | 5,6 | 2,3 | 0,33 | 7,0 | |
| sjarkny | 11,0 | 16 s | 2,0 | 5,8 | 6,2 | 1,9 | 0,36 | 10,3 | |
| breisjark | 11,0 | 8 s | 2,0 | 4,2 | 4,4 | 2,8 | 0,26 | 2,5 | |
| kyst15 | 15,0 | 15 s | 2,0 | 4,3 | 4,4 | 3,1 | 0,19 | 3,5 | |
| kyst21 | 21,0 | 29 s | 2,0 | 5,1 | 5,1 | 5,7 | 0,12 | 4,8 | |
| autoliner | 45,4 | 67 s | 2,0 | 5,6 | 5,7 | 12,3 | 0,05 | 5,7 | |
| snøkrabbe | 50,0 | 103 s | 2,0 | 5,8 | 6,2 | 14,5 | 0,04 | 7,9 | |
| bunntrål | 60,3 | 70 s | 2,0 | 5,3 | 5,5 | 15,0 | 0,05 | 4,8 | 16°, −37 % |
| pelagisk | 75,0 | 181 s | 2,0 | 6,6 | 7,2 | 18,5 | 0,03 | 11,8 | |

(t90: tid fra stille til 90 % av toppfart; R: stasjonær radius med fullt ror i marsjfart; T og K: Nomoto; stopp: fra marsjfart med en tredjedel akterover; drift: driftvinkel og fartstap i svingen.) `tests/dyntest.py` skriver tabellen og passer på grensene (R/L 1,0–2,7, td ≤ 7,5 L, adv ≤ 7 L, toppfart ±5 %, t90 ≤ 2 min for båter under 15 m, stopp ≤ 12 L), og kjører trebåten på en rute med et rett hjørne vest av Senja: 19.10.2026 skar hun hjørnet 4,7 m innvendig (R = 14 m), lå 0,5 m fra streken på rettstrekkene, stoppet på 0,0 m fra siste punkt, og veien stemte med farten over minuttene (ingen dobbel flytting fra minuttsteget).

**Autopiloten** (`dynAuto`): følger den samme linja som den gamle 3D-følgeren bygde (ut fra kaiplassen etter `berthPath`, rutas veipunkter som kartplotteren tegner dem, fram til havnepunktet), med siktelinje på etappen hun er på: ønsket kurs er etappens, bøyd mot den av tverravviket over en sikteavstand på halvannen svingradius (`χ_d = χ_etappe − atan(y_e/Δ)`, Δ = max(1,5 R, L)). Neste etappe tas i bruk der svingen må begynne for å treffe den på hennes egen radius, pluss responstiden (R·tan(θ/2) + u·(T + halve rorutslaget)), så hun skjærer hjørnet innvendig med R(1/cos(θ/2) − 1) og aldri svinger ut på utsiden (første utgave hadde et siktepunkt 8 m framme på linja, kortere enn svingradien, og pendlet 7–9 m om streken). Roret av kursfeilen og girraten med forsterkning fra K og T (ω_n = min(1,2/T, 0,6 rad/s), kritisk dempet), farten fra ruta, sjøens tak, 5 knop nær havn, saktere før skarpe svinger (`vTurn = vc·(1 − θ/π)`, minst 1,5 knop) og aldri mer enn hun kan slakke av fra til neste stopp. Hun slakker av med en behagelig retardasjon per båt (`aC`: 60 % av snittet med en tredjedel akterover fra marsjfart, høyst 0,08 m/s² i spilltid, 0,25 for planende skrog), planlagt med 70 % av den som margin. Gassen settes etter akselerasjonen som trengs for å nå den ønskede farten på tre spillsekunder, med avslakkingen som foroverkobling og motstanden ved farten regnet inn (invers dynamikk), og hendelen flyttes høyst en firedel av vandringen per spillsekund. Første utgave bremset så sent som mulig med en enkel P-regulator; den hang etter kurven og ble kappet de siste fire meterne (opptil 22 knop per ekte sekund for skiffen). Nå (simulert på ruta med rett hjørne, `scratchpad/dynsim.js`): 0,9–1,2 knop per ekte sekund for deplasementsbåtene, rundt 2,8 for de planende. «Stopp» bruker samme avslakking (`dynHaltNeed`). Kjent: autolineren (45 m) står 50 m ved siden av sluttpunktet når siste etappe etter et rett hjørne er bare 400 m. De siste fire meterne inn mot et stopp krypes med `√(2·0,12·d)` og holdes av modellen, så hun står nøyaktig på punktet (Jonas 06.10.2026). Veipunkter som ikke er stopp passeres når hun er forbi dem på linja (`arrive`, «WP passert»). Ved et havnepunkt tar kaias tau over innenfor to båtlengder i under 2,5 m/s (`dock`, 3D `moorStep` glir henne inn langs `berthPath` på tiden som virkelig har gått, ikke bildetiden på høyst 0,1 s, så et tregt bilde aldri holder henne utenfor kaia; i 3D-testen under SwiftShader tok innglidningen ellers 16 ganger så lang tid og ble aldri ferdig). Ut fra kaia går hun akterover på linja i 1,5 knop og dreier over til utveien, kinematisk: fendere og en hånd på kaia har ikke modellen ennå (Fysikk 2). Grunn forut sjekkes én gang i sekundet langs linja så langt som stoppveien + 40 m; finner den noe, stopper hun 25 m før og `sailReplan` finner vei rundt (som minuttsteget gjorde), også når de 25 meterne alt er bak henne (første utgave la stoppet én meter foran henne, så hun krøp mot det uten å nå det: en rute tegnet rett i land fra en rorbukai lot henne ligge «under vei» for godt, 19.10.2026); på en rute spilleren selv har tegnet gjennom grunna (`pl.unsafe`) går hun på.

**Hvor den kjører:** `dynTick(dt)` fra `tick()` (ui/08-actions.js) hvert 200 ms når spillet er åpent, `SIMREADY`, `simRate() ≤ 12` og båten seiler med rute eller ror; `dt` i ekte sekunder ganger `simRate()` blir spillsekunder (høyst 20 s ekte om gangen). Er kartet rundt henne ikke inne (`simAreaReady`), venter hun der hun er (`DYN.hold`), og 3D-visningen og kartplotteren holder henne der siste bilde hadde henne (framskrivingen fra siste tikk fryses ved ventingen, tas aldri tilbake); tiden hun ventet (høyst 20 s) tas igjen i dobbelt tempo når kartet er inne (`DYN.debt`), aldri som et hopp. Første utgave nullstilte framskrivingen og tok igjen all ventetiden i ett tikk, så båten rykket bakover og farten falt i trinn under avslakkingen i 3D-testen. Uten verdensklokka (testene) hentes tiden inn kinematisk bare når stansen er over ti spillminutter, som med verdensklokka; kortere stanser steppes som vanlig med modellen, så hun ikke flyttes under 3D-visningen (før: fra seks sekunder, som i 3D-testen teleporterte henne et minutt fram og lot 3D-båten stå 26–60 m fra der simuleringen stoppet). Minuttsteget (`sail`) spør `dynLive()` og bokfører da bare drivstoff, omveier (`obsSail`) og nautiske mil (`dynMinute`), uten å flytte henne. Innhenting (`catchUp`, `playMinutes`), admin-tempo over 12× (testene med `S.mult`) og rederiets andre fartøy går kinematisk som før. Tilstanden ligger i `S.boat.dyn` (meter, radianer, m/s) og skrives til `b.pos`, `b.heading`, `b.v` hvert tikk (`dynWrite`); flyttes båten av noe annet (slep, «Sitter båten fast?», innhenting, nytt fartøy), starter modellen fra der hun er (`dynState`). Manuell styring: `helmStep` (16-helm.js) sender gass og ror rett inn i modellen (`dynHelm`), med landsjekkene fra før (over 3 knop på grunn, saktere stopp mot land). Kartplotteren (`livePose`) og 3D (`dynFollow` i `updateBoat`, med tiden som virkelig har gått, høyst 30 s) tegner modellens pose, litt fram fra siste tikk (`dynPose`); etter at modellen har stoppet henne, står 3D-båten der modellen la henne (`dynRest`: bare når ingenting annet har flyttet henne siden) til simuleringens plass tar over; 3D-følgeren `trkStep` brukes bare når modellen ikke har henne. «Stopp» bruker modellens stoppvei (`dynHaltNeed`). `G3._debug.trk` viser linja og posisjonen på den i samme form som før (`dynTrackView`), så `trackfollow.py` leser den.

**Det som gjenstår** etter Fysikk 3 (5.60): tidevannsstrøm, og ut- og innseilingen som modellens egen. Kjent: svingen skjærer innsiden av et hjørne på linja med R(1/cos(θ/2) − 1), 7 m for trebåten i et rett hjørne i 3 knop; på en trang led gjør leinettets 50 m-rutenett hjørnene slake.

## 5.59 Fysikk 2: vinden og sjøen på skroget, drift, kontakt og 3D-koblingen (Jonas 19.10.2026: «Kjør på med det neste på lista»)

Planen fra 18.10.2026 (5.58) i fire deler, alle i `core/16b-dyn.js` og for hele kysten (sjøtilstanden kommer fra `03b-sea.js hsParts` og vinden fra `windAt`/`windDir` der båten er).

**Krefter under seiling** (`dynEnv`, én gang per tikk, og `dynInt` per delsteg):
- **Fartstapet etter hvor sjøen kommer fra** (`seaDirF`, `03b-sea.js`): `speedCap(hs, cb)` tar en retningsfaktor fra Kwons metode (Y. J. Kwon, «Speed loss due to added resistance in wind and waves», The Naval Architect, mars 2008, etter Townsin og Kwon 1983 og Aertssens data) ved styrke 6: 1 i motsjø, 0,79 på baugen, 0,45 tvers, 0,14 akterfra for skip. En liten båt sakker av i bratt medsjø for ikke å bli kastet rundt, så akterfra beholder hun en tredjedel av tapet her (0,35). Vindsjøen og dønningen teller etter energien. Det gjelder både modellen og minuttsteget (`sailV`, etappens kurs), så turen tar like lang tid åpent og lukket. Motsjø er det gamle taket; rutetiden (`estimate`) regnes fortsatt uten retning, altså forsiktig.
- **Motstanden** som holder henne på taket ved full gass, løses nå eksakt med skyvkraften hun har (`capF`), ikke som (vmax/tak)².
- **Vinden** mot siden over vannet (lengden ganger fribordet, og styrhuset, hardtoppen eller folka ved konsollen over en del av lengden; `P.AL`, `P.AF`): sidekraft av den relative vinden (0,9 av trykket), minus det hennes egen fart alene gir (det har kalibreringen i motstanden). Den langskips delen er i fartstaket. Trykksenteret midt på de små båtene og 0,04 L forut på de store med styrhuset forut. Avdriften under seiling blir 0,4–2,6° i 12 m/s tvers.
- **Bølgedriften**: ρ g m0 L Kr² / 2 der bølgene går, Kr = tanh(1,3 k T) (et skrog reflekterer bare den korte sjøen).
- **Propell og ror i lufta**: hekkens bevegelse mot sjøen er en andel av bølgehøyden (mer i bølger på hennes egen lengde, som hun ikke rir på, og mer mot sjøen), og propellen er oppe når den passerer tuppenes dybde (0,45 av dypgangen): exp(−h²/2σ²) av tida (Rayleigh). Da faller skyvkraften (−60 %) og rorets bitt (−50 %). Trebåten i en kulings sjø (6,4 m) har propellen oppe 69 % av tida, tråleren aldri.
- **Skruevirkningen**: akterover går hekken til babord (høyregjenget propell), 7 % av skyvkraften på tvers, litt den andre veien forover, mest i lav fart. Halv akterover i 20 s dreier sjarkens baug 3–9° til styrbord.
- **Giring i sjøen**: en jevn tilfeldig girkraft som et roravslag (0,12 rad per 2 m bølgehøyde), med møteperioden som tidskonstant, mest i skrå medsjø og medsjø (der en båt vil bli kastet rundt), minst mot sjøen. Den går på hennes egen klokke (`d.yph`).
- **De siste lengdene inn til et stopp** holder skipperen henne opp mot vind og sjø (`E.side`, fra 80 m eller 2,5 L), så hun står på punktet slik Jonas ba om 06.10.2026, og driver derfra når hun ligger.
- **Autopilotens forsterkning følger farten** (`cal.nom`: Nomotos K, T og radius målt ved en firedel, halvparten, tre firedeler og hel marsjfart), og planende skrog holder minst en tredjedel av marsjfarten inn i svinger. Feil fra Fysikk 1, funnet nå: med marsjfartens forsterkning og ned i 2 knop inn i svingen gikk de raske båtene 50–80 m forbi hjørnet i 5–6 knop (nær havn), fordi roret deres ikke biter uten propellstrømmen. Nå 4–12 m (skiffen, hurtigsjarken og den nye sjarken på hjørneruta, `scratchpad/dynroute.js` i økta). Trebåten og sjarkene er som før eller litt bedre.

**Uten fart: drift** (`dynDrift`, `lieDrift` i minuttsteget, `05-vessels.js`): ligger hun stille (fisker, ligger, tom for drivstoff; ikke til ankers, ikke på redskapet, ikke for hånd, ikke i veiledningen) faller hun av tvers av vinden over noen minutter og driver med vinden og bølgedriften. Farten der vindens trykk på siden og bølgedriften møter vannets tak (det lineære skroget i krabbefart og tverrstrømsmotstanden, 0,5 av L ganger middeldypgangen), løst for minuttsteget, så driften er den samme med spillet lukket. 2–6 % av vinden for fiskebåtene; en 15 m fiskebåt drev med 4,0 % av vinden, 30 ± 15° fra rett le, i US Coast Guards feltforsøk utenfor Florida i 1997 (bak taksonomien til Allen og Plourde 1999). Jukser hun, kjører skipperen opp igjen over feltet hun startet på når hun har drevet 400 m av (i 5 knop, én gang i loggen per stopp), slik juksefiskere gjør. Mot land holder motoren henne 60 m unna («Motoren holder henne unna»); tom for drivstoff blir hun liggende der. Minuttets drift (`b.drv`) er det kartplotteren og 3D tegner henne langs (`livePose`). 3D-båten følger driften på tiden som virkelig har gått (som under modellen), ikke på tiden per bilde (høyst 0,1 s): i 3D-testen kom bildene sekunder fra hverandre etter en stans på 20 s, og med den vanlige glidingen lå 3D-båten 50–68 m bak der simuleringen hadde stoppet henne. Sovende alene om bord gjelder `sleepDrift` som før (15-energy.js). I modellen med alt av (rorkult midt, ingen gass) faller hun også av tvers (et moment mot tvers som forsvinner med farten), og skrogets egen svai-gir-kobling kommer av farten (Munks moment går som u v), så hun spinner ikke når hun driver.

**Kontakt og fendere** (`dynContact`): sju punkter rundt vannlinja (stevnen, skuldrene, midten og låringene på begge sider) prøves mot boksene til brygger, moloer og kaidekk (`07-harbours.js PIERBOX`) og havneenhetenes kaiblokker. Et punkt inne settes ut igjen langs nærmeste flate, og skroget får støtet et skrog med fendere får: farten inn i flaten snus med en femtedel (fenderne og ripa tar resten), med litt friksjon langs den, som et stivt legeme med tilleggsmassene, så en baug som tar i, svinger hekken inn. Energien i støtet (halve den effektive massen ganger farten inn i flaten i andre) lagres i `b.hits` til skaden i Fysikk 3. Under 1 knop tar fenderne det uten et ord; over sier loggen «Smell i kaia» eller «Hardt støt mot kaia» med farten. For hånd i hvert delsteg; under autopilot ellers enn de siste fire lengdene inn til en havn (der tar kaias tau over) og den kinematiske veien ut fra kaia. Selve land er som før (over 3 knop går hun på grunn, saktere stopper hun mot det). Sjarken for hånd inn i kaia i Senjahopen i 6 knop: 60 kJ, hun går ikke inn i kaia, og akterover går hun av igjen.

**3D-koblingen** (`view3d.js updateBoat`): den korte vindsjøen (bølge 4–9, nærfeltet i båtens ramme, 5.20b) går rett til skroget, med ekte møtefrekvens, mens den lange sjøen og dønningen (som står i verden og møtes seks ganger for ofte) glattes som før. Rulledempingen følger farten (Ikeda: skrogets løft demper den): 0,06 av kritisk i ro, 0,15 ved Froudetall 0,3. Sammen med at hun legger seg tvers når hun ligger og jukser, ruller hun nå i sjøen (tilbakemelding #66). Målt med skroget steppet for hånd i 30 bilder i sekundet (`scratchpad/motion3d2.py` i økta; SwiftShaders trege bilder demper bevegelsen i testene, fordi tiden per bilde er kappet til 0,1 s): sjarken i 3,5 m sjø ruller 10° signifikant tvers av sjøen og 5–6° med baugen mot den (kjernens `motionAt` sier 6° tvers); hiv 1,0–1,2 m. Før lå hun med kursen hun kom inn med, ofte mot sjøen, og rullet lite.

**Tester:** `tests/dyntest.py` har fått sjøen etter retning (mot, tvers, akterfra), driften i ro (1,5–7 % av vinden og tvers), skruevirkningen, propellen i lufta, den nye sjarken (planende) på hjørneruta i 6 knop, driften når hun ligger og jukser, motoren mot land og kaistøtet i Senjahopen.

**Ikke gjort:** tidevannsstrøm for båter i fart og i drift (eget prosjekt; en første, forenklet strøm, `curAt`, finnes for ankringen fra 21.10.2026, se 5.7), og ut- og innseilingen er fortsatt kinematisk (veien ut fra kaia, og glidningen inn langs `berthPath` i 3D). En autopilot som legger til kai med propellslag og fendere er et eget prosjekt.

## 5.60 Fysikk 3: skade, lensepumpe, verft og kasko (Jonas 18.10.2026: «kollisjoner og grunnstøting skal få konsekvens, laget bra og intuitivt»; «Kjør på med det neste på lista» 19.10.2026)

**Målet er støtet.** Farten inn mot flaten (og med den energien fra kontakten i Fysikk 2, `dynContact`) avgjør hva som skjer, i `core/16c-hull.js` (`hullHit`). Tilstanden ligger per fartøy i `b.dmg = {s, h, A, w}`: skrammer (0–1), skade på skroget (0–1), hull (cm²) og vann om bord (liter). `b.damage` er flagget resten av spillet leser, og følger `hullBad`.

| Fart inn mot kaia | Hva skjer |
|---|---|
| Under 1 knop | Fenderne tar det, gratis og stille |
| 1–3 knop | Skrammer i malingen (`s` + 0,1 + 0,08 · knop) |
| Fra 3 knop | Skade på skroget, `h` + m · 0,08 · (knop − 2)^1,4 |
| Fra 5/m knop | Hull, `A` + 3 · L/10 · (knop − 5/m + 1)² cm² |

`m` er skrogmaterialet: tre 1,25, glassfiber 1, aluminium 0,8, stål 0,6 (`VESSELS.hullMat`). Sjarken (glassfiber, 10,6 m) får skade fra 3 knop, en lekkasje pumpa holder unna i 6 knop (12,7 cm², 198 l/min inn, 319 ut) og mer enn pumpa tar i 8 knop (51 cm², 793 l/min).

**Lekkasjen** går etter Torricelli: Q = 0,6 · A · √(2 g d) med hullet på 0,6 av dypgangen. **Lensepumpa** tar 40 + 2,5 · L² liter i minuttet (sjarken 319, skiffen 130, 60 m-båtene rundt 9 000). Det som kommer inn over det, blir liggende (`b.dmg.w`, veier 1,025 kg per liter i `boatTons` og stabiliteten) til motorrommet er fullt (6 % av L · B · T, sjarken 4 160 l). Da stopper motoren, og mannskapet ringer etter redningsskøyta (`rescue(true)`, fangsten beholdes). Skøyta har pumper (1 500 l/min) når slepet er satt, kaia har 2 000. Båten synker aldri. Meldinger: «Lensepumpa går» én gang, «Vann i båten!» med minutter til motorrommet er fullt, alarmlyd hvert tredje spillminutt (`hooks.onBilge`), push `leak-` (prioritet 1) mens det stiger. Et skadet skrog er inntil 12 % saktere (`hullSpeed` i `speedCap`).

**Grunnstøting** (`runAground` → `hullGround`) skiller fjell fra sand (`bedRock`): et skjær innen 40 m eller over 8 m dypt innen 60 m er fjell, en slak bunn er sand og grus. Det er en forenkling (vi har ingen bunntypedata), men den følger at bratt kyst er berg og slake bukter har sand. På fjell: `h` + m · 0,1 · (knop − 0,5)^1,3 og hull fra 2/√m knop. På sand: skrammer, og fra 5 knop litt skade på ror og propell. Loggen sier «på fjell» eller «på sandbunn», farten og hva det gjorde. 6 knop på fjell for sjarken: 92 % skade og 66 cm² hull; på sand: 27 % skrammer og 7 % skade.

**Reparasjonen** er verftets jobb (30 ekte minutter): kortet «Skrog og skade» øverst på Vedlikehold viser skrammene, skaden, lekkasjen, vannet, prisen per del og hvem som betaler, med «Reparer». Prisen: skrammer (1 000 + 0,4 % av båtprisen) · s, skroget 3 000 + 8 % av båtprisen · h, hull + 2 000 + 0,5 %, motoren etter oversvømmelse 5 000 + 3 %. Sjarken etter 6 knop mot kaia: 65 200 kr. Det som repareres, betales ved bestillingen og trekkes fra når jobben er ferdig (`hullMended`); et nytt støt mens jobben står i kø, bestilles for seg (`hullLeft`). Etter et slep bestilles reparasjonen av seg selv der båten ble slept (nærmeste verft, `hullRepair`). Den første reparasjonen er gratis (`freeFirst('rep')`, som før). En lagring med bare det gamle flagget får en vanlig skade på 35 % (`hullOld`).

**Kasko** tegnes på verftet (kortet «Kasko», `kaskoSign`), per fartøy (`b.kasko`). Premien er 2,5 % av båtprisen i året, trukket hver måned (30 spilldager, `kaskoHour` i timen), og 25 % høyere for hver skade det siste året. Egenandelen er 1,5 % av båtprisen, minst 5 000 kr. Kaskoen betaler reparasjonen over egenandelen. Sjarken: 2 400 kr i måneden, egenandel 17 000 kr; etter én skade 2 990 kr. Kilder: et gjensidig forsikringsselskap for fiskere i Alaska krever 2,5 % av verdien i året med fast egenandel (Alaska Legislature, dokument om SEAFAR); NOAAs studie av forsikring for fiskefartøy setter skrogpremien som en andel av takstverdien, etter vedlikehold og skadehistorikk; Skatteetaten (Skatte-ABC F-13-7.15) om premie for fiskefartøy. Kaskoen ligger på verftet, ikke hos Salgslaget som i planen 18.10.2026: verftet er stedet for reparasjoner og vedlikehold (`docs/handelssteder.md`), og Råfisklaget selger ikke forsikring.

**I 3D** synes skaden på eget skrog (`uWear` i modellskyggeleggeren, `wearOn`/`wearOff` rundt skroget i `drawVessel` og `drawSkiff`): skrammer som tynne striper langs skutesida mellom 30 % av ripehøyden og ripa og ned stevnen, der malingen er skrapt ned til grunningen (lys på mørke skrog, grå på lyse) og glansen er borte; skader som mørke bulker med rustbrunt i fra vannlinja og opp, mest forut. Null for alt annet, så andre modeller ser ut som før.

**Tester:** `tests/hulltest.py` (uten 3D, 18 sjekker): støtene etter fart og materiale, lekkasjen til full motorrom og slepet med pumpene, grunnstøting på fjell og sand, fart og vekt, kaskoen, kortet på verftet i begge formater (`tests/out/hull_yard_*.png`). Skrammene i 3D er sett på skjermbilder av sjarken og trebåten (ikke i en fast test).

**Ikke gjort:** støt mot andre båter og bøyer (kontakten kjenner bare kaier, brygger og moloer), skade på andre spilleres båter i 3D, at en skadet båt er mindre verdt i båthandelen, og opplagsrabatt på premien.

**Bunntype: data som finnes (undersøkt 19.10.2026, ikke bygget inn).** `bedRock` gjetter fjell eller sand ut fra skjær og bratthet. Tre åpne kilder kan erstatte gjetningen:
- **NGU, «Bunntyper fra sjømåling»:** over 62 000 punkter i fjorder og kystfarvann, registrert av Kartverket sjødivisjonen under dybdemålingen, med sannsynlig bunntype (grovt eller fint sediment, fjell). Det er den nærmeste kilden til der båtene går på grunn. Nedlasting fra NGU (datasett 709) som txt, SOSI eller shp. Lisensen står ikke i metadataene og må sjekkes.
- **NGU, «Bunnsedimenter (kornstørrelse)»,** oversikt og detaljert (MAREANO og kystkartleggingen), med klasser fra leire til «bart fjell». NLOD. WMS `MarinBunnsedimenterWMS` (lag `Kornstorrelse_Det`) og nedlasting fra Geonorge. Detaljert bare der det er kartlagt.
- **EMODnet Geology, «Seabed substrate»:** de nasjonale kartene (også NGUs) samlet i Folk-klasser, med fem klasser der én er «rock and boulders». 1:250 000 og 1:1 000 000 for hele norskekysten, finere der det finnes. GeoServer `drive.emodnet-geology.eu`. EMODnet-data er frie (CC BY 4.0).
Containeren slipper ikke gjennom til `geo.ngu.no` eller `drive.emodnet-geology.eu` (403 fra proxyen), så de må hentes av en GitHub-arbeidsflyt, som kartdataene, reglene og mottakene: `tools/bunn/bunn.py` + `.github/workflows/bunn.yml` → release `bunn-N` → et lite raster per flis (fjell, grus, sand, mudder) i kartpakkene eller `src/data/bunn.json`, og `bedRock` slår opp der og faller tilbake på brattheten der det mangler data. Sjøkartenes egen bunntype (`SBDARE` i ENC fra Kartverket) er ikke åpen.
