# Merker, milepæler, rekorder, trofeer, overtro og tatoveringer

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4.25 Merker: «Første uke på sjøen» og de langsiktige merkene (07.10.2026)

Jonas' avgjørelser står i `docs/engasjement.md`, arbeidslista punkt 1.5 og 3. Milepælene er kalibrert etter når de to første spillerne som leverte, gjorde ting. Ingen av dem hadde prøvd garn eller line, eller levert til et annet mottak, før dag 3. Ingen hadde levert over 100 000 kr på én gang.

- **Kjernen** (`core/09f-merker.js`, `S.ach = {d, g, ch, l, c, sp, peers, owe, seed, best, pen, colour}`):
  - `ACH` har 21 milepæler i tre kapitler, `ACH_CH`: «Fars båt» (første timer), «Egen skipper» (dag 1–2) og «Kjent på kysten» (resten av uka).
  - Hver milepæl er en funksjon `p()` av tilstanden. Den gir `true` eller `[har, trenger]`.
  - Noen bruker tellere i `S.ach.c`, som `achAdd` setter fra spillet: `sleep` (`restStart`, `fallAsleep`), `equip` (utstyr og redskap kjøpt), `crew` (hyret), `boat` (kjøpt), `haul` (`gearBack`), `storm` (en tur i kuling, Beaufort 6 og mer, hjem uten slep, `achTripEnd` fra `tatTripEnd`), `big` (torsk over 9 kg, `achCatch` i `addCatch`) og `night`.
  - To er skjulte, «???» med et hint: første uvær og storfisken.
  - `achCheck` går hvert tiende spilleminutt (`achMinute` i `step`), ved salg (`achSale` i `sell`), ved turens slutt, når båten tas over og når Merker-appen åpnes.
- **Kapitlene:** et kapittel åpner det neste når fem av sju er tatt (`ACH_OPEN`), så ingen står fast på én de ikke vil ta.
  - Milepæler som er nådd i et kapittel som ikke er åpent, er krysset av når kapittelet åpnes, og gavene kommer da.
  - Når alle sju er tatt, kommer belønningen (`achChapter`) og en melding fra Kystposten:
    - **Kapittel 1:** vimpelen (`pen` = 1).
    - **Kapittel 2:** lengre vimpel (`pen` = 2) og en vanlig haill.
    - **Kapittel 3:** enda lengre vimpel (`pen` = 3) og skrogfargen «Kystfisker» (`HULLPAL` med merket `ach`, `palOk`, gratis å male).
  - Vimpelen går i malingskoden til de andre (`p:N` i `livStr`, `livPen` i `vessel3d.js`). AIS-kortet nevner den ikke (Jonas 07.10.2026).
  - Den er den norske vimpelen (Jonas 07.10.2026): rød og spiss, med korsets hvite og blå på langs ut til tuppen (`penTex` i `view3d.js`, `.ach-pen` i `styles.css`).
  - Den henger fra mastetoppen (`mastTop`: høyeste lanterne + 0,3 m, når den er over flaggstanga) på flaggets klut (`FLAGM`), som blafrer med den tilsynelatende vinden. Båter uten mast, som trebåten, har ingen vimpel, bare flagget (Jonas 07.10.2026: «ser jo teit ut med 2 flagg på hverandre»).
  - Kapitlet vises bare med lengden: omtrent 1,7, 2 og 2,4 m (`PEN_S`). `tests/penshot.py` tar bilder fra siden i frisk bris.
- **Gavene («drypp»)** gis ved `achGive`:
  - **Trekningen:** `achPool(skala)` gir det som passer nå: agn bare med line eller teiner, bøting bare med garn som er slitt, skrogrens bare når båten er begrodd, motorservice når den er over 30 % av intervallet, is og diesel når det er plass. Så kommer penger.
  - **Nivåene:** 7 av 10 vanlige, 2 av 10 gode (full tank, bøting, skrogrens, service, 5 000–10 000 kr), 1 av 10 sjeldne (utstyr som båten ikke har, montert gratis av verkstedet, eller 15 000–25 000 kr).
  - **Skala:** ×1, ×1,5 og ×2,5 per kapittel, og ×3 for de langsiktige merkene.
  - **Trekningen er fast per spill** (`achRnd`, hash av `S.ach.seed` og milepælen). Gaven gis og lagres med en gang, så en omlasting gir ikke ny trekning.
  - **Under første tur** (`tutOn`) venter gavene i `S.ach.owe` og kommer når turen er over.
- **De langsiktige merkene** (`ACHL`) har trinn, og hvert trinn gir en gave. Merkene er største levering (100 000 kr til 1 million), levert i alt (10 til 1000 t), fartstid (10 til 40 år), mottak, arter, nautiske mil, nattfiske, fars merker og andre spillere møtt på sjøen.
- **Et spill som er spilt før** (`achSeed`) blir krysset av for det det har gjort, og får ukas gaver. De langsiktige merkene starter der spillet er, uten gaver for det som alt er gjort.
- **Første slep og første reparasjon er gratis** (`freeFirst` i `rescue` og `hullRepair`). Ved første slep får spilleren beholde fangsten, også ved nødanrop. En melding forklarer hvordan det kan unngås, og hva det koster neste gang.
- **Det spilleren ser** (`ui/05e-merker.js`):
  - Et banner øverst med milepælen og gaven. Det tar ikke imot trykk, og spillet går videre under det.
  - Et kort når et kapittel er fullført.
  - Ett samlet kort når mange kommer på en gang, som for et spill som er spilt før.
  - Merker-appen har tre faner: «Første uke», «Merker» (med fartstiden) og «Tatoveringer» (flyttet fra Sjømann). Sjømann har nå «Fra gamle dager» og «Papirer».
  - Brikka på hjemskjermen viser «Første uke n / 21» og nærmeste milepæl, til kapittel 3 er fullført.
- **I testene** (`#notut`) gis ingen gaver eller bannere uten `window.__achOn`.
- **Trakten** i admin-fanen «Merker» viser hvor mange som nådde hver milepæl, og kapitlene som er fullført. Kilden er spillets hendelser `ach` og `ach_ch`, så bare spillere som deler statistikk telles. `admin_ach` ligger i `supabase/migrations/20261007140000_ach.sql`.
- **Den store trakten** (admin-fanen «Trakt», `admin_funnel(weeks)` i `supabase/migrations/20261007150000_funnel.sql`, `docs/engasjement.md` punkt 9) følger spilleren fra første økt (konvolutten) til første fangst, første og tredje levering, konto, og tilbake etter 1, 7 og 30 dager.
  - Første fangst er milepælen `fish`, eller en levering for spill fra før merkene. Leveringene er spillets `sale`-hendelser, én per levering. Konto er en WorkOS-id (`user_…`) som ikke er gjest.
  - «Tilbake etter N dager» er en økt startet minst N dager etter den første. Den regnes bare av dem som startet for minst N dager siden (`d1n`, `d7n`, `d30n`).
  - Tallene vises totalt og per uke spillerne startet (de siste 8). Steget med størst frafall er merket. Bare spillere som deler statistikk, er med, siden bare de har økter og hendelser.
- **Tester:**
  - `merketest`: alt over.
  - `sqltest`: trakten.
  - `towtest`: slepet med betaling (`S.free` satt).

## 5.25d Fars notatbok og drømmefisken (05.10.2026) – TATT UT 09.10.2026, se 5.56

Jonas valgte dem fra lista over det som får folk til å spille videre (nr. 2 og 3). Reglene ligger i `core/09b-dream.js`, og appen, kartmerkene og kampen i `ui/06c-notebook.js`. Testen er `tests/dreamtest.py`.

**Notatboka:**
- `notesMake()` lager fem méd rundt hjemhavna (`S.home`, ellers Finnsnes), én gang, når kartet rundt havna er lastet. Appen Notatbok laster kartet selv første gang.
- Hvert méd ligger der arten står best innen 2–12 km, på sin dybde, og minst 1,5 km fra de andre:
  - torsk på 20–80 m
  - hyse på 60–160 m
  - sei på 20–120 m
  - lange på 150–350 m
  - kveite på 40–140 m
- Teksten har retning og avstand fra havna, nærmeste stedsnavn, dybden i favner (m / 1,83) og et råd fra far (`FATHER`).
- Medene lagres i `S.notes` (`marks`, `found`, `shown`). En flytting (`S.home` endres) lager nye.
- Fisker du innen 400 m fra et méd, er det funnet (`dreamTick`). Da kommer en melding, og arten biter 30 % bedre der (`noteBoost` i `fish()`).
- Et funnet méd viser fars historie om stedet (`FATHER_STORY`). Når alle fem er funnet, gir «fars gamle pilk» 5 % bedre fangst overalt (`noteAll`).
- «Vis i kartet» tegner en stiplet sirkel med radius 500 m (`m.c`, inntil 350 m fra medet) og holder den på kartet. Funne méd får et blyantkryss med navnet.
- Første gang du fisker selv (etter «Første tur», eller i et spill fra før), kommer meldingen fra «Naustet».

**Drømmefisken:**
- Den rulles hvert fiskeminutt med juksa (`dreamTick`), når det er minst 30 kg plass. Arten veies etter tettheten der, og fisken må stå på sin dybde:

  | Art | Vekt | Merknad |
  |---|---|---|
  | Kveite | 60–180 kg | |
  | Skrei | 25–42 kg | En firedel så ofte utenfor januar–april |
  | Lange | 18–30 kg | |
  | Sei | 16–24 kg | |
  | Uer | 8–13 kg | |
  | Brosme | 10–16 kg | |

- **Hvor ofte:** sannsynligheten er `min(0,02, Σtetthet / 2 / 1800)` per minutt. I juni gir det rundt 1 per 100 timer på fars torskeméd og 6 på Kveitebakken (`dreamP`). På Kveitebakken er den åtte ganger så høy, og der er det kveite 60 % av gangene.
- Er du om bord og siden er synlig, kjemper du selv (`DREAMUI`). Ellers tar mannskapet den, og de får den inn halvparten av gangene.
- **Kampen:**
  - En rad viser belastningen og en annen hvor mye line som er ute (40 m ved start).
  - Hold «Sveiv» (eller mellomrom) for å ta inn line, 4,2 m/s. Belastningen stiger da 0,32 per sekund, og mye mer om fisken drar samtidig.
  - Fisken drar ut på måfå, oftere og lenger mens den har krefter, og telefonen vibrerer.
  - Fisken mister krefter mens belastningen er over 30 %.
  - Snøret ryker når belastningen har vært rød i et halvt sekund. Tar fisken 120 m line, er den borte.
  - Er lina inne og fisken sliten (krefter under 35 %), blir den gaffet. Har den krefter igjen, dykker den.
  - 20 sekunder uten berøring, eller at siden skjules, gir fisken til mannskapet.
- Det som landes, går i lasten (så mye det er plass til) og på trofeveggen (`S.trophies`), og meldes i Kystposten.
- Kveite i fredningstida (`kveiteClosed`) settes ut igjen, men kommer likevel på veggen.
- En kamp som er igjen fra en side som ble lukket, er tapt.

**Usikkert:** tallene for hvor ofte storfisken kommer og hvor vanskelig kampen er, er ikke prøvd av en spiller ennå.

## Overtro som kultur (O, ferdig 29.09.2026)

Sjøfolk og fiskere har alltid vært overtroiske. Overtroen er bare lore i spillet og påvirker ikke fangst, vær eller humøret om bord. Alt ligger i `src/js/core/08-lore.js` (`LORE`).
- **Innhold:** noaord (høghus for kirke, svartkjole for prest, hest og gris nevnes ikke), ikke plystre om bord, aldri ut på en fredag, ikke ønske god tur, snu er dårlig fiskelykke, å møte presten, brunost, vafler og bananer, kost og bøtte over bord, mastemynten, omdøping av båt, draugen og troen på at kvinner om bord brakte ulykke. Den siste fortelles som noe puben ler av.
- **Når det dukker opp:**
  - avgang på en fredag
  - av og til ved avgang, med folk på kaia og presten på veien
  - når du snur og går hjem
  - når dere tar inn sjø
  - når du gir båten nytt navn
  - når verftet leverer en ny båt (mastemynten)
  - omtrent hver 30. time på sjøen med mannskap
  - draugen om natta i dårlig sikt
  - pubrunden, der seks av ti tomme kvelder blir en fortelling
- **Hvem forteller:** Den eldste om bord, folk på kaia, verftet eller puben forteller. Det blir en melding og en linje i dekksdagboka. Samme fortelling kommer ikke igjen innen tre døgn.
- **Appen «Sjømann»** viser det du har hørt under «Fra gamle dager», og resten som ukjent.
- **Kilder:** Store norske leksikon (noaord, draug), Redningsselskapet «Ikke ta med brunost på havet!», Båtmagasinet «Om tro og overtro til sjøs», Norsk Fisk «Overtro», NRK om mastemynten og en forumtråd om omdøping (svakt belegg). «Snu med sola» og «måker er druknede sjøfolk» ble tatt ut fordi jeg ikke fant belegg.

## Sjømannstatoveringer (T, ferdig 29.09.2026)

Tatoveringene er belønninger som kommer av seg selv, med en melding når du har gjort deg fortjent til en. Appen «Sjømann» viser dem på en figur, og kortene under viser betydning, krav og hvor langt du har kommet. Bare det du gjør selv om bord, teller. Alt ligger i `src/js/core/09-tattoos.js` (`TATS`, tellerne i `S.tat`, tatoveringene i `S.tattoos`).

| Tatovering | Plass | Krav |
|---|---|---|
| Svale og svale nummer to | Brystet | 5000 og 10 000 nautiske mil med deg om bord |
| Nautisk stjerne | Skulderen | 100 turer hjem uten grunnstøting eller slep |
| Tau rundt håndleddet | Håndleddet | 100 timer eget arbeid på dekk: sløying, ising og fiske for hånd |
| Kryssede ankere | Mellom tommel og pekefinger | 50 turer som skipper med fullt mannskap |
| Harpun | Underarmen | Et rederi med tre båter |
| Gris og hane | Fotbladene | Reddet etter grunnstøting, motorstopp eller drift |
| Kniv gjennom rose | Leggen | Samme mann om bord i ett år, eller 50 leveranser til samme mottak |
| Anker, skilpadde, hulajente, Kong Neptun | Skulderen, håndbaken, overarmen og leggen | Låst. Krever Atlanterhavet, ekvator og Hawaii, altså farvann utenfor Senja. |

- **Tegningene** ligger i `src/js/ui/05-tattoo-art.js` (`TATART`). Stilen er strektegning i marineblått blekk på kremfarget papir, etter de gamle flash-arkene. En sjømann med sjømannslue og bart sitter på en pullert med en taukveil ved føttene. Tatoveringer du har fått, er tatovert på ham. Resten vises som svake sjablonger, og de låste er svakest. `AT` bestemmer plassen til hver tatovering på figuren. `icon(id, fått)` gir tegningen til kortene. Figuren var først en enkel strekfigur, men brukeren ville ha den profesjonell, etter et referansebilde av en tatovert sjømann. Den ble tegnet om 29.09.2026.

- **Tempo:** En fiskedag er 20–40 nm, så den første svalen kommer etter 150–250 fiskedager. Tallene justeres i spilltesting.
- **Kilder for betydningene:** US Navy History «Sailors' Tattoos», One Ocean Expedition om svalen og The Bermudian «Vintage Sailor Tattoos and Their Meanings».

## 5.47 Fars notatbok fjernet (Jonas 09.10.2026)

«Notatboka kan fjernes i sin helhet og fars fiskeplasser strykes fra kartet.»
- Appen `notat` er borte, sammen med fars méd (`notesMake`, `noteBoost` med +30 % og +5 %, ×8 storfisk på kveitebakken), Edvards hint om medene og merket «Fars merker funnet».
- Gamle lagringers `S.notes` blir liggende, men leses ikke.
- Storfisken og kampen (`core/09b-dream.js`, `DREAMUI`) er som før.
- Istandsettingen av naustet og trofeveggen er siden `naustp` (`NOTEBOOK.page`). Den åpnes fra dokken bare når båten ligger ved fars naust (`berthKind === 'naust'`, Jonas: «bare tilgjengelig om man ligger ved fars naust. Samme med trofeveggen»).
- Kartet viser fortsatt fars naust.

## 5.48 Milepæler, og Sjømann-appen fjernet (Jonas 09.10.2026)

- Merker-appen heter **Milepæler** (id fortsatt `merker`) og samler alt spilleren har oppnådd: Første uke, Merker (med fartstiden), Rekordfisk, Fra gamle dager og Tatoveringer. Kystfareren kommer som egen fane med gjesteboka.
- Rekordfisk er den samme lista som trofeveggen (`NOTEBOOK.wall(true)` i `ui/06c-notebook.js`), men uten oppgraderingene. Selve trofeveggen og oppgraderingene finnes bare når båten ligger ved fars naust (5.47).
- **Sjømann-appen er fjernet.** Papirene står i Kvote, under Mine kvoter: blad B, ervervstillatelsen og foretaket (`papBladB`, `papPermit`, `papBiz` i `ui/05-phone.js`). Knappen «Se papirene» i Neste mål åpner Kvote.
- **Rederi-appen åpner først når rederiet finnes** (`rederiOpen`: AS stiftet eller mer enn én båt; Jonas 09.10.2026). Da flytter foretaket dit, med formen (AS eller ENK), og forsvinner fra Kvote. Ervervstillatelsen og blad B blir stående i Kvote.
- «Stift Rederi AS» er et steg i Neste mål med knapp til banken. Det kommer etter båtstigen, så det synes først når båtene er nådd.
- De oppdiktede attestene (helseerklæring, sikkerhetskurs, fiskeskipper klasse C, SRC) er tatt bort. Spillet sjekket dem aldri.
- Testene: `loretest` sjekker Rekordfisk-fanen og at Sjømann er borte, og `booktest` sjekker papirene i Kvote, og foretaket som AS i Rederi.

## 5.50 Flere merker (Jonas 09.10.2026: «Jo flere milepæler jo bedre»)

- **Nye lange merker** i `ACHL` (`core/09f-merker.js`), hvert trinn med en gave, som de andre:
  - Fisk tatt: 100–100 000.
  - Turer fullført: 10–500.
  - Havner besøkt: 5–100.
  - Verft besøkt: 1–20.
  - Utstyrsbutikker besøkt: 1–20.
  - Rorbuer besøkt: 1–20.
  - Puber besøkt: 1–20.
  - Venner: 1–25.
  - Levert i alt (tonn) og mottak fantes fra før.
- **Besøkene:**
  - `dock()` skriver havna i `S.ach.v` (`achVisitPort`). Første gang fylles den med mottakene det er solgt til, og stedet båten ligger.
  - Puben skriver havna i `S.ach.pub` når du går inn.
  - Sorteringen går etter havnas `sted` (verft, butikk) og `rorbu`.
- **Fisken:** telles én og én i `addCatch` (`S.ach.c.fishn`). Et eldre spill starter på levert kilo delt på 3. Det er en antakelse, men nye ting skal ikke starte på null.
- **Et merke som kommer til seinere**, tas opp stille der spillet står (`S.ach.lk`), så en gammel lagring ikke får en flom av gaver. Nye spill kjenner alle merkene fra start.
- **Test:** sjekk 11 i `merketest`.

## 5.52 Gjestebøker og Kystfareren (Jonas 09.10.2026)

- **Gjesteboka:** én i hver pub (alle havner med bygd) og hver rorbu (`ui/10m-guestbook.js`).
  - Den åpnes fra «Gjestebok» i Bygd-viften, ved rorbua og i pubens «I kveld»-panel.
  - Du skriver deg inn med én av 8 faste hilsener (`GBOOK.LINES`) eller «Bare navnet». Det er ingen fritekst, fordi spillerne kan være 13 år.
  - Du kan skrive deg inn én gang i døgnet per sted.
  - Boka viser hvor mange som har skrevet seg inn, og de siste 30 med spillernavn, båtnavn, hilsen og tid.
- **Kystfareren:**
  - Stedene du har skrevet deg inn, ligger i `S.gb`. De hentes fra skyen én gang per økt (`gb_mine`), så de teller på alle enheter.
  - Fanen Kystfareren i Milepæler teller per landsdel (`GBOOK.part`, etter breddegrad og lengdegrad). Den viser antallet mot alle puber og rorbuer der, med navnene på dem du har besøkt.
  - Det lange merket «Kystfareren: gjestebøker» har trinnene 1–250.
  - Landsdelene er prøvd ved Kristiansand (Sør), Bergen (Vest), Kristiansund (Midt), Bodø (Nordland), Tromsø (Troms), Hammerfest og Vardø (Finnmark).
- **Skyen:** `supabase/migrations/20261009220000_guestbook.sql`.
  - Tabellen `guestbook`, som er stengt for spillerne, og funksjonene `gb_sign`, `gb_get` og `gb_mine`.
  - Båtnavnet hentes fra `presence`, og tegn som kan lage HTML, fjernes.
  - Høyst 30 innskrivninger i timen. Gjester kan ikke skrive seg inn.
- **Testene:** `gbtest` (med en falsk database) og gjestebøkene i `sqltest`.

## 5.56 Personlige rekorder og trofeveggen (Jonas 09.10.2026)

«Drømmefisken fra fars notatbok skal droppes helt. Nå kjører vi kun på største fisk man har fisket.» `core/09b-dream.js` er slettet (drømmefisken, kampen `DREAMUI`, `dreamTick`) og erstattet av `core/09b-records.js`.

- `S.rec[art] = {sp, kg, t, at, boat, how}`: den største fisken av hver art, vekt, tid, nærmeste havn eller felt innen 25 km, båtnavn og redskap (`juksa`, `line`, `garn`, `teine`). 10 arter, kongekrabbe med.
- `recCatch(sp, kg, how)` kalles fra `addCatch` (05-vessels.js) med `opt.how` fra jukse-løkka, `landFish` (nøkkelen før kolon) og teina. Større fisk tar plassen. Melding bare når den slår forrige med minst 15 %, første fisk av arten går i loggen.
- `recState()` bretter gamle `S.trophies` inn (største per art) og fjerner `S.trophies`/`S.dream` første gang rekordene leses. Gamle lagringer har ikke historikk for enkeltfisker, så rekordene starter med trofeene.
- Veggen (`NOTEBOOK.wall`, brukt av Rekordfisk-fanen og Naustet-siden) viser alle artene, de ikke fangede som «?». Uten oppgraderingen «vegg» (3 000 kr) er det en bar planke med spiker; rekordene telles likevel.
- Edvard (`09d-folk.js`) og merket «Storfisken» (torsk over 9 kg) leser fra rekordene.
- Test: `tests/rectest.py` (erstatter `dreamtest.py`).
- 3D-naustet (5.57) viser rekordene som fisk på veggen.

Gaver av utstyr (`09f-merker.js`) monteres nå med en gang uten verftskø («gaver skal aldri ha ventetid»). Kø-brikken sier «Mannskapet jobber til» når køen bare er mannskapets egne jobber.

## 5.57 Naustet i 3D med trofeveggen (Jonas 09.10.2026: «Kjør på med naustet»)

«Naustet» i skuffen (bare der båten ligger ved fars naust) åpner et rom i førsteperson, bygd etter pub-mønsteret:

- **Modellen:** `tools/harbour/naustinne.py` (Blender, bpy) → `src/data/naustinne.b64` (`<script id="glb-naustinne">` i malen). Lys bakt i toppunktene (skumring gjennom vinduene, en lampe over veggen, en lanterne, en lampe ved benken); ildens andel bakt for seg og flimrer. Delene er egne noder som spillet viser etter oppgraderingene: `roofold`/`roofnew` (tak), `ovn`, `benk`/`benkold`, `vegg`, `room`, `glass`. To bakinger: de nye delene sammen, og de gamle med de nye skjult. `python3 tools/harbour/naustinne.py fast` bygger uten kontrollbilder (`look` bare bildene; `NAUST_SAMPLES` setter prøvene).
- **Scenen:** `ui/09c-naust3d.js` (`NAUST3D`) er en tilpasset kopi av `PUB3`: eget lite WebGL-lerret, `G3.hold`, se deg rundt med fingeren, trykk på det du vil se. Fiskene på veggen er spillets egne modeller (`glbLoad('fish')`, `tools/fish/fisk.py`), én per art (10, kongekrabbe med), i størrelse etter vekten mot en stor fisk av arten (`lenOf`, 0,4–0,95 m); arter du ikke har fått, er en stiplet etikett med «?». Etikettene er knapper over plakettene (art og kg); trykk på fisken eller etiketten viser vekt, dato, sted, båt og redskap.
- **Oppgraderingene i rommet:** tak, ovn, benk og vegg kjøpes fra rommet (samme `naustBuy` og `naustWhy` som Naustet-siden). Uten vegg henger ingen fisk der, og trykk på veggen viser rekordtabellen og tilbudet; rekordene telles likevel fra første fisk.
- **Tilbakefall:** uten WebGL eller modell åpner knappen Naustet-siden som før; «Liste» i rommet åpner den også. Rommet lukkes når båten legger fra.
- **Lyd** (`SND.room(on, {ovn, tak})` i `ui/10e-sound.js`, kalt fra `NAUST3D`): utendørslyden (hav, vind, båter) går gjennom et lavpassfilter som lukkes til 1,2 kHz; rommets egne lyder ligger på en egen buss (`RB`) utenom det: ovnen (lav ild, knitring, av og til et smell), drypp fra taket så lenge det lekker (oftere i regn), regn som tromler (hardere og lysere der taket lekker), og at trevirket knirker. Samme volumvalg som resten.
- Test: `tests/naust3dtest.py` (3D) og lydsjekken i `tests/soundtest.py`.
