# Båtplanen: fartøyene som spillets stjerner

Bestilt av Jonas 17.10.2026: «Båtene er stjernene i dette spillet.» Alle båter uten Blender-modell skal ut, alle båter som kan kjøpes skal ha samme informasjon, mannskapet skal kobles tettere til båtens fasiliteter og utstyr, åpen og lukket gruppe skal ha en forholdsvis lik stige, modellene skal løftes til havsjarkens nivå, lanterner og merking skal følge lovverket, og hver modell skal være laget for farge, dekaler, navn og registreringsmerke. Dokumentet er planen nå og huskeregelen for hver ny båt siden (del 7). Status står nederst.

Lest før planen: `VESSELS` (`core/02-species-gear.js`), databladet (`ui/05-phone.js`, `sheet`), `UPGS`/`HOLDUP`/`ENGUP` (`core/03-simulation.js`), `LIC_OFFERS`, `EQUIP` og `equipFits`, `vessel3d.js` (byggesettet, malingssonene, navnefeltene), `view3d.js` (lanternene), skriptene i `tools/boats/` og testene `vesseltest`, `decktest`, `vessel3d`.

## 1. Slik står det i dag

| Nøkkel | Modell (Blender) | Linjer i skriptet | Gruppe i dag | L (m) | Pris | Mannskap + deg / køyer |
|---|---|---|---|---|---|---|
| `trebat` | `snekke23.py` | 419 | åpen, hjemmel u7 | 7,0 | 45 000 | 1+1 / 0 |
| `skiff` | `skiff59.py` | 434 | åpen | 5,9 | 95 000 | 1+1 / 0 |
| `snekke` | `snekke26.py` | 379 | åpen, h7 | 7,9 | 245 000 | 2+1 / 0 |
| `jukesjark` | **ingen** (byggesettet `SPEC3D`) | – | åpen, h8 | 8,9 | 750 000 | 2+1 / 2 |
| `sjark` | `havsjark35.py` (**målestokken**) | 623 | åpen, h9 | 10,57 | 1 150 000 | 3+1 / 2 |
| `hurtigsjark` | `hurtig11.py` | 384 | åpen, h10 | 10,99 | 4 900 000 | 3+1 / 2 |
| `breisjark` | `malo36.py` | 532 | åpen | 10,99 | 9 000 000 | 4+1 / 4 |
| `sjarkny` | `hs11.py` | 251 | åpen | 10,99 | 10 500 000 | 3+1 / 3 |
| `kyst15` | `kyst15.py` | 304 | lukket, h14 | 14,99 | 18 000 000 | 5+1 / 6 |
| `kyst21` | `kyst21.py` | 319 | lukket, h20 | 21 | 9 000 000 | 6+1 / 8 |
| `autoliner` | `al45.py` | 339 | konsesjon, låst | 45,4 | 70 mill. | 14 / 16 |
| `snokrabbe` | `krabbe50.py` | 336 | konsesjon, låst | 50 | 60 mill. | 14 / 18 |
| `bunntral` | `tral60.py` | 572 | konsesjon, låst | 60,3 | 150 mill. | 25 / 30 |
| `pelagisk` | `not75.py` | 407 | konsesjon, låst | 75 | 250 mill. | 12 / 16 |

**Det som ikke henger sammen (funnet 17.10.2026):**
- `jukesjark` er den eneste uten Blender-modell. Ingen av de 19 lagringene i skyen har den (sjekket), så den kan fjernes uten migrering. Den står i `LIC_OFFERS` (h8), `SPEC3D`, `HELM_KIT`, `vesseltest.py` og overleveringens tabell.
- **Databladet** viser rader bare når feltet finnes (`iceCap`, `jukseMax`, hver `gearMax`, `autoHooks`, halere, nøkkelfolk). To båter ved siden av hverandre viser derfor ulike rader. Jonas: alle båter som kan kjøpes, skal vise det samme.
- **Køyer mot folk:** sjarken har plass til deg + 3, men 2 køyer; hurtigsjarken det samme. Ingen regel sier hvem som sover hvor. Lugarer finnes ikke som tall, bare køyer, og oppgraderingen «Lugarer» gir ikke flere plasser.
- **Lasterom:** alle har `holdCap`, også de åpne båtene (skiffen og trebåten 350 kg, snekka 900 kg). I virkeligheten er det dekkslast i kasser og kar. Ingen skiller rom, dekk, fryseri og RSW, og fraktegods tar plass i fiskerommet (`capHold`) i stedet for på dekk.
- **Sløyemaskin og ismaskin** finnes ikke. Isen kjøpes alltid; sløyingen er alltid for hånd.
- **Redskapstallene** i overleveringen (teiner 20/30/50/80/150 …) stemmer ikke med dataene (4/6/9/12/18 …). Dataene er riktige etter kongekrabbeteinene, tabellen er gammel.
- **Forbruket** er en kurve (`fuelK` × fart²) uten kalibrering mot liter per hestekraft. Ingen test sjekker at en 500 hk hurtigsjark bruker rimelig mye mer enn en 30 hk snekke.
- **Lanternene** settes av byggesettet (`geoOf`: sidelys ved styrehuset, hvitt på mastetoppen, akterlys), ikke av modellen, og tegnes som lyspunkter om natta. Ingen fiskelys (rødt over hvitt), ingen trållys, ingen regel etter lengde, ett ankerlys for alle.
- **Maling:** sone 1 (skroget) og sone 2 (stripa der modellen har den) i vertex-dataene; ripe, totone og vannlinje skjæres inn i skrogets trekanter; navn og registreringsmerke legges på skroget forut som fliser funnet fra modellen; logoen og flagget har egne plasser. Overbygget kan ikke males, og ikke alle modeller har stripe-sone. Hva en modell *må* ha for å kunne tilpasses, står ikke noe sted.
- **Stigen:** åpen gruppe har trinnene 7,0 → 7,9 → (8,9) → 10,57 → 10,99 (×3). Lukket gruppe har u7, h7, (h8), h9, h10, h14, h20. Uten plastsjarken får begge gruppene et hull mellom 7,9 og 10,57 m, og prissprang fra 245 000 til 1 150 000 kr. Over 11 m finnes bare lukket gruppe, som i regelverket (`openVesselId`: åpen gruppe under 11 m).
- **Priser:** kystbåten på 21 m (1978, stål) koster 9 mill., kystbåten på 14,99 m 18 mill. Det kan forsvares (gammel stålbåt uten kvote mot moderne shelterdekker), men det må stå i databladet hvorfor.

## 2. Målene og rekkefølgen

1. **Bare båter med Blender-modell** (del 3).
2. **Ett fartøyskjema** med alle feltene for alle båter, og en test som nekter en båt uten dem (del 4). Dette er huskeregelen.
3. **Ett datablad** med de samme radene for alle (del 5).
4. **Hver båt gjennomgått** med forslag til tall (del 6).
5. **Mannskapet koblet til båten** gjennom fasilitetene (del 8).
6. **Stigen og gruppene** (del 9).
7. **Blender-løftet** til havsjarkens nivå, lanterner etter loven, merking og tilpasning (del 10–12).
8. **Tester, dokumentasjon, patchnotes** (del 13), og huskeregelen for nye båter (del 7).

Fart foran finpuss gjelder, men her bygges grunnmuren for alt som kommer, så skjemaet og testen (del 4) kommer før tallene og modellene.

## 3. Trinn 0: plastsjarken ut

- Fjernes fra `VESSELS`, `LIC_OFFERS` (h8), `SPEC3D` i `vessel3d.js`, `HELM_KIT`, `tests/vesseltest.py` (tre steder bruker den som prøvebåt; byttes til `snekke`/`sjark`), overleveringens tabell og `docs/forslag.md`.
- Oppstart (`11-boot.js`): en lagring med `type:'jukesjark'` får `sjark` med mellomlegget ettergitt (ingen finnes i skyen, men lokale lagringer kan finnes). Logglinje og melding.
- Hullet i stigen fylles av en **ny modell** i del 10 (en plastsjark på 29–31 fot, 8,9–9,5 m, med styrhus akter og to køyer forut, etter de vanlige norske plastsjarkene fra 1990-tallet; Jonas 17.10.2026: «ja, så lenge du klarer å lage den så realistisk som mulig», så den bygges etter en ekte GA-tegning eller produsentens mål, ikke på frihånd). Til den er bygd, er stigen 7,9 → 10,57 m.

## 4. Fartøyskjemaet v2 (huskeregelen)

Hver båt i `VESSELS` får disse gruppene. Ingen felt kan mangle; `vesseltest` sjekker at alle båter har alle feltene og at tallene henger sammen (regler under). Det som kan avledes, avledes ett sted (`vesselDerive`), aldri i UI-koden.

**Identitet:** `name`, `desc`, `year` (eller `isNew`), `cls` (`open`/`kyst`/`hav`), `model` (GLB-id; kravet er at `glbHas(model)` er sann), forbildet bare som kommentar (aldri i spillet, Jonas 07.10.2026).

**Skrog:** `len`, `beam`, `draft`, `disp`, `hullMat` (`tre`/`alu`/`glassfiber`/`stål`; bestemmer slitasje, begroing, lyd og salgsverdi), `planing`.

**Last:** `hold:{kind, kg, m3}` der `kind` er `dekk` (kasser og kar på dekk, ingen isolasjon, fisken mister kvalitet dobbelt så fort), `rom` (lasterom med is), `frys` (fryseri, fast) eller `rsw` (kjølte tanker). `deckCargo` kg fraktegods på dekk (tar ikke fiskeplass, teller i vekta og i stabiliteten). `ice:{cap, maker}` (`maker` 0 eller kg is i døgnet fra ismaskin). `tubCap` (bløggekaret). `land` (`box`/`tub`). `gut:{machine}` (0 eller kg i timen sløyemaskinen tar).

**Maskin og drift:** `hp`, `engine`, `outboard`, `diesel`, `semi`, `rpm`, `vcruise`, `vmax`, `accel`, `turnR`, `fuelCap`, `lph` (liter i timen i marsj; `fuelK` avledes av den), `range` (avledet, nm på full tank i marsj), `svcH`, `svcCost`.

**Sjø:** `risk` (bølge/vind-grenser), `sea` (fartstap), `anchorOk`.

**Folk:** `crewMax` (ved siden av deg), `berths` (køyer, deg medregnet), `cabins` (lugarer), `fac:{house, shelter, galley, wc, dry, mess, watch}` der `house` er `open`/`hardtop`/`hus`, `galley` er `none`/`plate`/`bysse`, `watch` sier om 2+2-vakt er mulig (krever `hus` og `berths ≥ crewMax + 1`). Havbåtene beholder `crew:{key, teams, rot}`.

**Redskap og dekksutstyr:** `rigs`, `jukseMax`, `gearMax:{garn, stamp, teine}`, `autoHooks`, `haulers` (avledet av `equipFits`), `stations:{table, hauler, jig}` (hvor mange som kan stå ved bordet, haleren og juksarekka samtidig; leses fra modellens ankere), `crane` (kran: ja/nei, løfteevne).

**Elektronikk:** `std` (følger med), og hva som passer (`sonar` fra 10 m osv.) avledes av `equipFits`.

**Oppgraderinger:** hvilke `UPGS`, `HOLDUP` og `ENGUP` som passer, avledes av skjemaet: lugaroppgraderinger krever `cabins ≥ 1`, isolert rom krever `hold.kind === 'rom'`, tank krever innenbords diesel, stabilisering fra 9 m, gyro fra 25 m. Nytt: «Sløyemaskin» og «Ismaskin» som verftsoppgraderinger, ikke butikkvarer, siden de bygges inn, og **bare på båter over 14,99 m** (Jonas 17.10.2026), det vil si kystbåten på 21 m og havbåtene; de tre 10,99-metrene og kyst15 sløyer for hånd og kjøper is.

**Regler:** `group` (avledet: åpen under 11 m, lukket med hjemmel, konsesjon for `hav`), `lic` (hjemmelstilbud), `fjordline` (avledet: 15 m og over), `lights` (lanterneklasse, avledet av lengde og fiskemåte, del 11), `marking` (størrelsen på merket, avledet av lengde, del 12).

**Tilpasning:** `paint:{hull, stripe, house}` (hvilke soner modellen har), `signs:{bowL, bowR, stern, nameStern}` (navnefelt og merkefelt som finnes), `logo`, `flagPole`. Leses fra GLB-extras; en modell uten `bowL`/`bowR`-merkefelt feiler testen.

**3D-ankere (fra GLB-extras):** `helm`, `eye`, `doors[]` med type (`hus` styrhusdør, `lugar`, `shelter`, `akter`) og side, plassert der forbildet har dørene (GA-tegningen), aldri der det er bekvemt for dekkskartet, `crewSpots`, `work.table`, `work.tub`, `hauler`, `deck`, `hatch`, `bunk`, `mast.top`, `flag`, `lights[]` med type (`masthead`, `port`, `stbd`, `stern`, `allround`, `fishR`, `fishW`, `trawlG`, `anchor`), `nameQ`/`markQ`/`logoQ`.

**Regler testen håndhever:** `berths ≥ 1` når `fac.house === 'hus'`; `berths ≤ cabins × 4`; `hold.kind === 'dekk'` når `fac.house !== 'hus'` og `len < 9`; `deckCargo ≤ 0.3 × disp × 1000`; `jukseMax ≤ (crewMax + 1) × 3`; `lph` innenfor 0,08–0,22 l per hk og time; `range ≥ 60 nm`; `price` stiger med lengde innen samme klasse og år; alle båter har GLB med ankrene over; minst én `doors`-anker på hver båt med styrhus, og dekkskartet når rattet bare gjennom en dør (ingen går gjennom veggen); ingen kode velger etter typenavn (som i dag).

## 5. Databladet: ett for alle

Åtte faste seksjoner med de samme radene for hver båt. En rad som ikke gjelder, viser «ingen» eller «–», den fjernes aldri. Rekkefølgen og ordlyden er lik i Båthandelen, på flåtekortet og i Rederiet.

1. **Generelt:** pris (og nypris), byggeår, lengde, bredde, dypgående, vekt, skrogmateriale, gruppe og hjemmel, fjordlinja.
2. **Last:** lasterom (type og kg/m³), dekkslast (kasser/kar), is (kap., ismaskin), fraktegods på dekk, bløggekar.
3. **Maskin og drift:** motor, hk, marsj/topp, forbruk i marsj (l/t), tank, rekkevidde (nm), service hver N timer.
4. **Sjø:** bølger og vind båten tåler, kan ankre, 2+2-vakt mulig.
5. **Folk om bord:** mannskap, lugarer, køyer, styrhus/hardtop/åpen, ly over arbeidsdekket, bysse, toalett, tørkerom, messe.
6. **Redskap og dekk:** rigger, juksamaskiner, garn, linestamper, teiner, autoline, halere som passer, plasser ved sløyebordet, kran, sløyemaskin, ismaskin.
7. **Elektronikk:** følger med, kan monteres.
8. **Oppgraderinger på verftet:** lista over det som passer, med «ikke på denne båten» for resten.

Tilpasning (maling, dekaler, navn) vises i Malerverkstedet, ikke i databladet. Skjermbilder i stående og liggende format av to båter (snekke og kyst15) før det meldes ferdig.

## 6. Båtene én for én (forslag til tall)

Tallene er forslag til Jonas, med begrunnelse. Det som ikke står, beholdes.

| Båt | Folk (deg+) | Lugarer/køyer | Fasiliteter | Last | Dekkslast frakt | Jukse | Garn/stamper/teiner | Maskiner | Forbruk marsj | Pris |
|---|---|---|---|---|---|---|---|---|---|---|
| skiff 5,9 | +1 | 0/0 | åpen, ingenting | dekk 350 kg | 150 kg | 2 | 6/4/4 | – | 11 l/t (60 hk bensin, 18 kn) | 95 000 |
| trebat 7,0 | +1 | 0/0 | åpen, ingenting | dekk 350 kg | 200 kg | 2 | 6/4/6 | – | 1,0 l/t (8 hk) | 45 000 |
| snekke 7,9 | +2 | 0/0 (åpen båt: ingen hvile om bord, Jonas 17.10.2026) | hardtop, ruff | dekk 900 kg | 300 kg | 3 | 15/10/9 | – | 3,5 l/t (30 hk) | 245 000 |
| **ny plastsjark ~9,2** | +2 | 1/2 | hus, kokeplate | rom 1 800 kg | 600 kg | 4 | 25/14/12 | – | 9 l/t (150 hk, 8,5 kn) | 850 000 |
| sjark 10,57 | +3 | 1/4 (bakken har plass til fire) | hus, kokeplate, wc | rom 6 500 kg | 1 500 kg | 5 | 40/24/18 | – | 12 l/t (180 hk) | 1 150 000 |
| hurtigsjark 10,99 | +2 (Jonas 17.10.2026: slik de drives) | 1/2 | hus, kokeplate, wc | rom 5 000 kg | 1 200 kg | 6 | 50/26/18 | – | 55 l/t (500 hk, 17 kn) | 4 900 000 |
| sjarkny 10,99 | +3 | 2/4 | hus, bysse, wc, tørkerom | rom 7 000 kg | 1 800 kg | 6 | 60/30/21 | – | 75 l/t (650 hk, 20 kn) | 10 500 000 |
| breisjark 10,99 | +4 | 2/4 | hus, ly, bysse, wc, tørkerom | rom 10 000 kg | 2 500 kg | 6 | 100/33/20 | – | 20 l/t (300 hk) | 9 000 000 |
| kyst15 | +5 | 3/6 | hus, shelter, bysse, messe, wc, tørkerom, kran | rom 28 t | 6 t | 8 | 160/33/30 | kran 1 t (14,99 m: ingen maskiner) | 70 l/t (750 hk) | 18 000 000 |
| kyst21 | +6 | 4/8 | hus, bysse, messe, wc, tørkerom, kran, galge | rom 55 t | 10 t | 8 | 240/33/30 | begge, kran 2 t | 90 l/t (900 hk) | 9 000 000 (1978, forklares) |
| autoliner 45 | lag | 8/16 | fabrikk, fryseri | frys 400 t | 30 t | 0 | autoline 40 000 kroker | fabrikk | 350 l/t | 70 mill. |
| snokrabbe 50 | lag | 9/18 | fabrikk, fryseri | frys 500 t | 40 t | 0 | 7 000 teiner | fabrikk | 400 l/t | 60 mill. |
| bunntral 60 | lag | 15/30 | fabrikk, fryseri | frys 800 t | 60 t | 0 | trål | fabrikk | 900 l/t | 150 mill. |
| pelagisk 75 | lag | 8/16 | RSW | rsw 2 000 t | 80 t | 0 | not og trål | – | 1 000 l/t | 250 mill. |

Forbruket er regnet som 0,12–0,15 l per hestekraft og time i marsj (dieselmotorer rundt 0,19 l/hk·t ved full last, 60–75 % last i marsj; skal sjekkes mot produsentenes kurver før tallene låses). En egen test (`fuelcal`) skriver ut l/t og rekkevidde per båt og feiler utenfor ±25 % av tabellen.

**Sløyemaskin og ismaskin bare over 14,99 m** (Jonas 17.10.2026). **Sløyemaskin:** verftsoppgradering på kystbåten 21 m, 6 % av båtprisen, minst 350 000 kr; tar 600 kg i timen med én person som mater (mot `DECK.gut` 5 kg i minuttet for hånd per person); fisken får kvalitetsklasse som for hånd. Havbåtene har den i fabrikken fra før. **Ismaskin:** 5 % av båtprisen, minst 300 000 kr; lager 1 500 kg is i døgnet på sjøen, så isen aldri tar slutt på lange turer; is kjøpes fortsatt billigere ved kai. Alle andre båter sløyer for hånd og kjøper is, som nå.

## 7. Huskeregelen for en ny båt

Når en båt legges inn senere, gjøres dette, i rekkefølge, og ingenting hoppes over:
1. **Forbildet og tegningene:** mål fra GA-tegning eller produsentens datablad (bare i kommentarer), også hvor dørene sitter og hvilken side de slår til. Ingen ekte navn i spillet.
2. **Blender-skriptet** i `tools/boats/` etter malen i del 10 (sjekklista B1–B22), med ankrene og sonene fra del 4, og kontrollbilder i `tools/boats/out/`.
3. **Dataene** i `VESSELS` etter skjemaet i del 4, med kilde for pris og forbruk i kommentar.
4. **Plassen i stigen:** hvilken gruppe, hvilket hjemmelstilbud (`LIC_OFFERS`), «Neste mål».
5. **Byggesettets NPC-utgave** (`npcKit`) og AIS-størrelse.
6. **Testene:** `vesseltest` (skjema), `walktest` (dekkskartet), `vessel3d` (bilder), `decktest` når arbeidsplassene er nye, `fuelcal`.
7. **Dokumentasjon:** tabellen i dette dokumentet og 5.1 i overleveringen, patchnote.

## 8. Mannskapet og båten

Fasilitetene i skjemaet styrer det mannskapet gjør, i stedet for `berths > 0` og lengde spredt rundt i koden:
- **Søvn:** `berths` og `cabins`. Uten køyer sover alle i land (Jonas 05.10.2026). Med køyer sover `berths` personer om bord ved kai og til ankers; 2+2-vakt (`06d-drift.js`) krever `fac.watch`. Hvile for skipperen om bord på sjøen (tilbakemelding #70) kommer her: båter med `fac.house === 'hus'` og en våken på vakt.
- **Mat:** `galley` `none` gir termos og brødskiver (måltidsscoren tak 2), `plate` dagens enkle retter, `bysse` alle rettene og kokken som egen stasjon. `mess` gir humørtillegget fra messa.
- **Kulde og vått:** `shelter` og `dry` tar kulden ned som `UPGS.dry` gjør i dag; en åpen båt gir full kulde.
- **Arbeidet:** `stations.table` setter hvor mange som kan sløye samtidig, `stations.hauler` hvor mange som trekker, `jukseMax` og `crewMax` hvor mange maskiner som faktisk passes. `workAssign` leser dette i stedet for faste tall. Sløyemaskinen er en stasjon som trenger én person.
- **Fraktegods** bæres om bord for hånd under 60 kg per kolli, ellers trengs kran (`crane`, fra kyst15), og lastetiden følger av det (Jonas 17.10.2026: «dette løser du sikkert på en bra måte»).
- **Dekksagentene** (`deckcrew.js`) får stasjonene fra de samme ankrene, så det som står i databladet, er det man ser på dekk.
- **Dørene er ekte** (Jonas 17.10.2026): mannskapet går inn og ut av styrhuset, lugaren og shelteret gjennom dørene der forbildet har dem, på riktig side. Dekkskartet (`deckMap`) får åpningene sine fra `doors`-ankrene, ikke fra et hull i skroget der stien passet best, og `walktest` feiler når en sti krysser en vegg utenom en dør. Døra åpnes i modellen når noen går gjennom (enkel rotasjon om hengslet, som lukene).
- **Mannskapet sier fra:** uten bysse klager de over maten på lange turer, uten wc over turer over 12 timer, uten ly over kulde. Linjene finnes i `SAY`; de kobles til fasilitetene.

## 9. Stigen og gruppene

Mål: begge gruppene har et trinn omtrent hver 1,5× i pris opp til 11 m, og «Neste mål» peker alltid på neste trinn.

| Trinn | Åpen gruppe (under 11 m) | Lukket gruppe (hjemmel) |
|---|---|---|
| 1 | trebat 45 000 | u7 trebat |
| 2 | snekke 245 000 | h7 snekke |
| 3 | ny plastsjark 850 000 | h8 ny plastsjark |
| 4 | sjark 1 150 000 | h9 sjark |
| 5 | hurtigsjark 4,9 mill. | h10 hurtigsjark |
| 6 | breisjark 9 mill. / sjarkny 10,5 mill. | h10 breisjark / sjarkny |
| 7 | – | h14 kyst15 18 mill. |
| 8 | – | h20 kyst21 9 mill. (gammel, billig, stor) |
| 9 | – | konsesjon: autoliner, snøkrabbe, tråler, ringnot (låst til havfeltene) |

Skiffen står utenfor stigen (kjøpes på verftet). Lukket gruppe får h10 for alle tre 10,99-metrene, så valget mellom fart, plass og pris er det samme i begge gruppene. Trinnene 7–9 er bare lukket, som i regelverket. Det som mangler mellom 11 og 14,99 m og mellom 21 m og havflåten, er egne nye båter senere (en 12–13 m sjark med shelter og en 28 m snurrevadbåt står på ønskelista, ikke i denne runden).

Oppdragsøkonomien fra 17.10.2026 (`docs/OVERLEVERING.md` 4.26) gjør at fisket bærer klatringen; prisene over er satt så en aktiv spiller bruker uker, ikke dager, per trinn. Dette måles i `progweek.py` etter at tallene er lagt inn.

## 10. Blender-løftet

**Målestokken er `havsjark35.py`.** Det den har, skal alle ha (sjekklista B1–B22):
- B1 målte linjer fra tegning, og `checks against the drawings` til slutt i skriptet
- B2 skrog med bordganger/platestøt der forbildet har det, kjøl, propellåpning, ror, propell
- B3 slingrekjøler, fendere, ripkapp, skandekk, spygatt
- B4 overbygget med vinduer (glass som egen del), trapper, rekkverk med støtter, og **dørene på samme sted og side som på forbildet** (styrhusdør, lugardør, shelterdør, akterdør), med karm, terskel og hengsel som egen del så de kan åpnes, og `doors`-ankeret i karmen
- B5 styrhusinteriør synlig gjennom vinduene: konsoll, ratt, stol, skjermer (byggesettets `HELM_KIT` faller bort)
- B6 arbeidsdekket: luker, sløyebord, bløggekar, haler på riktig side, redskapsrom, kasser
- B7 master, rigg, bom/derrick, antenner, radar, lyskastere, styttesegl der forbildet har det
- B8 lanterner som geometri med farget glass, på lovlige plasser (del 11), og eksportert som typede `lights`
- B9 ankerspill, anker, pullerter, fortøyningsøyer
- B10 redningsutstyr: livbøyer, flåte i container (kreves fra 10,99 m i den virkelige flåten), nødbluss-skap
- B11 eksos, ventilasjon, tanker, slanger
- B12 navnefelt på begge bauger og hekken, merkefelt på begge bauger, hjemsted på hekken (del 12), logofelt på styrhuset
- B13 flaggstang/-pinne akter og vimpelfeste i mastetoppen
- B14 malingssoner: 1 skrog, 2 stripe/bånd, 3 overbygg, 4 dekk (nytt: overbygget kan males, dekket får eget valg; Jonas 17.10.2026: ja)
- B15 ankrene fra del 4, inkludert `hatch`, `bunk`, `door`, og dekkskartet (`walktest`) grønt uten `DECK_OVR`
- B16 slitasje og rust som vertex-mørking, mer på gamle båter (år), ikke som tekstur
- B17 LOD: `lod0` for nær, `lod1` for 150–400 m, og NPC-utgaven; trekantbudsjett 80 000 for båter under 12 m, 150 000 for kystbåtene, 250 000 for havbåtene (måles av eksporten og skrives i loggen)
- B18 sidebildet (`pic-TYPE`) tatt fra samme vinkel og lys for alle
- B19 kontrollbilder fra åtte vinkler i `tools/boats/out/`, sett på før commit
- B20 ingen ekte navn, logoer eller registreringsnumre i modellen
- B21 `vessel3d`-testen og `kjoptest` grønne, dekkskartet grønt
- B22 én commit per modell, med kontrollbildene beskrevet i meldingen

**Rekkefølge** (etter hvor mye de ses, og hvor tynne skriptene er):
1. `snekke23.py` (trebåten, startbåten alle ser): B8, B12, B16, interiør med motorkasse og rorkult er alt der
2. `snekke26.py`: B4–B6, B8, B12
3. `hs11.py` (sjarkny, det dyreste kjøpet under 11 m, tynnest skript): hele lista
4. `hurtig11.py`: B5, B6, B8, B12
5. `malo36.py`: B6, B8, B12, B16
6. `kyst15.py`: hele lista, med shelterdekket og trappa som dekkskartet savner
7. `kyst21.py`: hele lista, med galgen og rusten
8. **ny plastsjark 9 m** (del 3): fra bunnen etter malen
9. `havsjark35.py`: B8 (typede lanterner), B12, B14 (overbygg-sone)
10. `skiff59.py`: B8, B12
11. havbåtene `al45.py`, `krabbe50.py`, `tral60.py`, `not75.py`: B4, B7–B10, B12, B17 (Jonas 17.10.2026: alle nå, «så er det gjort»)

Hver modell er 1–2 økter (Blender-skript, eksport, dekkskart, kontrollbilder, `vessel3d`-testen på 24 minutter). Kontrollbildene legges fram for Jonas etter hver modell, slik det ble gjort med havsjarken.

## 11. Lanterner etter loven

Kilden er Sjøveisreglene (forskrift 1. desember 1975 nr. 5 om forebygging av sammenstøt på sjøen, reglene 21–26 og 30) med Sjøfartsdirektoratets veiledning. Reglene under er slik jeg husker dem; de sjekkes mot Lovdata før noe bygges, og kilden oppgis i koden.
- **Under fart med maskin:** topplanterne (hvit, 225°), sidelanterner (rød babord, grønn styrbord, 112,5°), akterlanterne (hvit, 135°). Under 12 m kan topp- og akterlanterne være én rundtlysende hvit; under 7 m og høyst 7 knop holder én rundtlysende hvit (trebåten). 50 m og over: to topplanterner (den aktre høyere).
- **Fiskende, ikke trål:** rødt over hvitt rundtlysende, uten topplanterne; sidelanterner og akterlanterne bare når båten gjør fart gjennom vannet. **Trålende:** grønt over hvitt, og topplanterne akterut for båter 50 m og over.
- **Til ankers:** rundtlysende hvitt forut (det som finnes i dag); 50 m og over også ett aktre lavere. Under 7 m utenfor lei: ingen.
- **Dagsignaler** (tegnes, de er billige): to kjegler med spissene mot hverandre når det fiskes, kule til ankers.
- I spillet: lanternene er geometri i modellen (B8) med typer, `view3d.js` tenner dem etter `S.boat.status`, redskapet i sjøen (`b.gop`) og lengden; lysstyrken og rekkevidden etter natta som i dag. NPC-båtene og andre spilleres båter følger samme regel ut fra `st`. En test (`lighttest`, 2–3 min, finnes) utvides med de fire tilstandene på tre lengder.

## 12. Merking, navn og tilpasning

- **Registreringsmerket** (fylkesbokstav, nummer, kommunebokstaver, T-33-LK i dag) på begge bauger, bokstaver i størrelse etter lengden slik merkeforskriften krever (Fiskeridirektoratets forskrift om merking av fiskefartøy; sjekkes og oppgis). **Navnet** på begge bauger og hekken, **hjemstedet** på hekken for båter som er i skipsregisteret (15 m og over; sjekkes mot forskriften om skipsregistrering).
- Alle feltene er flate flater i modellen med kjent størrelse (`nameQ`, `markQ`), så teksturen aldri krummer rundt et spant. Fonten og farger som i dag (hvit eller svart etter skrogfargen).
- **Malingssonene** 1–4 i alle modeller, så Malerverkstedet kan tilby skrog, stripe, overbygg og dekk for hver båt. Designene (ripe, totone, vannlinje) skjæres som i dag; stripa krever sone 2 i modellen.
- **Dekaler:** logofeltet på styrhuset (finnes) og et nytt felt på baugen for et symbol fra samlingen (kommer med merkene). Flagget og vimpelen som i dag.
- Hva en modell har, står i `signs` og `paint` i skjemaet, så Malerverkstedet aldri tilbyr noe modellen ikke kan vise.

## 13. Tester, dokumentasjon og utrulling

- `vesseltest`: skjemaet (alle felt, reglene i del 4, GLB og ankrene for alle), databladets åtte seksjoner for alle båter, ingen valg etter typenavn.
- `fuelcal` (ny, uten 3D): forbruk og rekkevidde per båt.
- `walktest`, `decktest`, `vessel3d`, `lighttest`, `kjoptest` som før.
- `progweek.py` etter tallene, så stigen måles i uker.
- Overleveringen 5.1 skrives om til skjemaet; dette dokumentet er huskeregelen. Patchnotes når noe synes: plastsjarken ut, nye datablad, maskinene, lanternene, hver modell.
- Full regresjon før publisering av Blender-løftet.

## 14. Økter (anslag)

| Økt | Innhold |
|---|---|
| 1 | Trinn 0: plastsjarken ut, lagringer, tester, docs |
| 2–3 | Skjemaet v2: feltene, `vesselDerive`, `vesseltest` utvidet, alle 13 båtene fylt ut med forslagene i del 6 |
| 4 | Databladet med åtte seksjoner, flåtekortet, skjermbilder |
| 5–6 | Mannskapet og båten (del 8): fasilitetene inn i `crewTick`, `workAssign`, mat, hvile, 2+2, dekksagentene; `fuelcal` |
| 7 | Sløyemaskin og ismaskin på verftet; dekkslast og frakt på dekk |
| 8 | Stigen: `LIC_OFFERS`, «Neste mål», priser, `progweek` |
| 9 | Lanternene (del 11) i `view3d.js` for byggesettet og typede lys; `lighttest` |
| 10–24 | Blender-løftet i rekkefølgen i del 10 (1–2 økter per modell, den nye plastsjarken 2) |
| 25 | Full regresjon, overlevering, patchnotes |

## 15. Avgjort av Jonas 17.10.2026

1. **Ny plastsjark på ~9 m:** ja, så realistisk som mulig (del 3 og 10).
2. **Åpne båter gir ikke hvile om bord.** Snekka beholder 0 køyer.
3. **Hurtigsjarken:** deg + 2.
4. **Sløyemaskin og ismaskin bare på båter over 14,99 m.**
5. **Frakt på dekk** med kran fra kyst15, for hånd under 60 kg ellers: ja, løses som foreslått.
6. **Blender-løftet tar med havbåtene nå.**
7. **Overbygg og dekk blir egne malingssoner.**

## Status

- 17.10.2026: planen skrevet. Dørene lagt til (ekte plassering, ankere, dekkskart). Alle sju spørsmålene avgjort (del 15).
- 17.10.2026, økt 1: plastsjarken ut av `VESSELS`, `LIC_OFFERS` (h8), `SPEC3D`, `HELM_KIT`, admin-eksempeldataene, `vesseltest` og overleveringen; en lagring som eide en, får havsjarken uten mellomlegg og h8 blir h9 (`load()` i `02-format-state.js`); patchnote p112.
- 17.10.2026, økt 2–3: skjemaet v2 inne i `VESSELS` for alle 13 båtene (`hullMat`, `hold`, `deckCargo`, `iceMaker`, `gutMachine`, `lph`, `cabins`, `fac`, `stations`, `crane`), `vesselDerive` (`fuelK` fra `lph`, `range`, `watch`, `haulers`, `openOk`), `fuelBase` felles for kurven, påhengsmotoren på 90 hk gir `lph` 15, `vesseltest` håndhever reglene i del 4 (dørankrene venter på Blender-løftet og er ikke med ennå). Hurtigsjarken deg + 2, havsjarken og den nye hurtigsjarken 4 køyer. Patchnote p113.
- 17.10.2026, økt 4: databladet med åtte faste seksjoner (`specSecs` i `05-phone.js`) i Båthandelen og under Beholdning → Båten («Hele databladet»); rader som ikke gjelder, sier «ingen», «–» eller «ikke på denne båten». «Isolert lasterom» krever nå `hold.kind === 'rom'`. Skjermbilder i 800×1280 og 1280×800 av snekka, kyst15 og Min båt sett på.
