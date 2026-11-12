# Kappløp: Lindesnes–Nordkapp (plan 12.11.2026)

Status: **plan med valg, skrevet 12.11.2026. Ingenting er bygd.** Valgene V1–V7 venter på Jonas. Fasene KL1–KL4 legges under lanseringslinja i køen når han sier «kjør på» (`docs/planer/koen.md`: et nytt steg står etter linja).

## Hva Jonas ba om

Jonas 12.11.2026: «oppdrag som stimulerer til kjøp som feks kappløp eller time-trails. La oss si spillere kan konkurrere om den kjappeste tiden mellom Lindesnes - Nordkapp feks, der man må utføre noen små oppdrag langs veien. Det skal ikke være lov med teleportering, men trim-boost er lovlig.»

Spurt om trim skal være lov i selve løpet, svarte han samme dag: «Trim skal være lov. Tanken er at oppgavene som kommer underveis i løpet kan være x-faktoren som gjør det mer spennende og balanserer spillet.» Så ba han om «Plan med valg nå». Avgjørelsene står også i `docs/engasjement.md` («Kappløp og tidsløp», over «Vurderes senere»).

Hopp over resten av ruta (teleport mot betaling) er ikke lov i løpet. Det sto alt i vilkårene for hoppet (Jonas 12.11.2026: «Ikke i turoppdrag og løp», `docs/planer/hopp.md`).

## Reglene planen må holde

- **Én felles verden og én felles klokke** (`CLAUDE.md`). Tida går når spillet er lukket, og båten seiler videre på Autonav i `catchUp`. Løpet måles på verdens klokke (`worldT`), aldri på enhetens.
- **Nasjonalt.** Løypa går langs hele kysten, og løpet er åpent for spillere fra hele landet.
- **Engasjement og inntekt** (`docs/engasjement.md`):
  - Betalingen korter ned ekte avstander. Det legges ingen ventetid inn for å selge.
  - Variabel belønning kommer fra sjøen, aldri fra lommeboka.
  - Premien er kjent på forhånd og aldri tilfeldig. Det er ingen nedtelling i butikken, og ingen straff for fravær.
  - Sosialt er additivt. Hver ny funksjon svarer på hva den gir spilleren å gjøre nå, i dag og denne uka.
- **Ingen kode velger etter båttypens navn.** Klassene leses fra feltene i `VESSELS`.
- **Ekte penger** (butikken, `ui/10i-shop.js`) og `src/legal/` går som PR til Jonas. Planen rører ikke butikken. Hoppet er sitt eget steg (HO3, steg 106).
- **Migreringer** kjører Jonas først på testprosjektet (`xlrjbqdhdymcdjkqkulx`), før pushen som trenger dem.
- **Ingen vimpler på båtene.** Jonas 09.11.2026: «fjerne vimplene fra båtene. Jeg liker de ikke» (`core/09f-merker.js`). Premien må synes på en annen måte.

## Hva som finnes i dag

- **Klokka og tida borte:** `worldT()` i `core/01-world.js` (`GAME_RATE` 6, så én spilltime er ti ekte minutter). `catchUp` i `ui/08-actions.js` spiller fraværet. Sover skipperen alene, styrer autopiloten videre på en rute (`sleepAlone`, `sleepDrift` i `core/15-energy.js`; `vesselStep`).
- **Rutene:** `leiaRoute` i `core/11-route.js`, og `draftTimeline` og `draftSea` i `ui/03b-route.js`. Ankomsten går gjennom `arrive(w)`, `dock(pid, berth)` (`core/05-vessels.js`) og `depart()` (`core/06-services.js`).
- **Været** (`docs/systemer/autonav.md` 4.12j): Autonav ligger bi eller går i havn etter innstillingen «Autonav går inn ved» (`lieTo`, `lieToStep`, `windLim`, `seaLim`, `RIDE`).
- **Fartsgrensene** (Ø11.8, `core/05e-sjovei.js`):
  - Kystverkets områder, og ellers 5 knop innen 500 m fra havnene (`fartAt`).
  - Autonav holder grensa, også med spillet lukket (`sailV`, `sjvCapV`).
  - For hånd blir en passering mer enn én knop over i 30 spillsekunder skrevet ned (`farvRec`). Det er ingen bot.
- **Vikeplikten** (Ø11.1): Autonav viker (`sjvAuto`, `sjvSail`). Passeringene under grensa står i `S.nearMiss`.
- **Trim** (`BOOSTS` i `core/03-simulation.js`):
  - Tre trinn: 29, 39 og 49 kr for ×1,5, ×1,75 og ×2 på topp- og marsjfarten.
  - Varer 24, 48 og 72 spilltimer (4, 8 og 12 ekte timer), regnet fra `boostT()`.
  - Trim av samme type legger timene til (`trimSet`). Den virker på alle båter (`canBoost`).
  - Serveren er fasit for trimmen: `shop_state` og grantene (HS4).
- **Hoppet** (`core/06j-hopp.js`, `ui/10u-hopp.js`): `hopWhy` nekter blant annet under et turoppdrag med denne båten (`S.turer.act` med `m.vid === S.cur`). Løpet nektes på samme måte (KL1). Kjøpet (HO3) bygges nå i en annen økt. Til det er levert, eier den økta `06j-hopp.js`.
- **Turoppdragene** (`core/09g-turer.js`, `ui/05f-turer.js`, `docs/systemer/oppdrag-og-kystposten.md` 4.26):
  - Typene: `turFoto` (fyrbilde, `G3.seen`/`G3.snap`, lyset fra `TUR_LYS` og `turLysNext`), `turProve` (ekkoloddlinja på høyst 8 knop, `turEkkoSaw`, og prøvestasjonen med målebrettet `turMeasure`, som krever juksa), `turFrakt` (`S.cargo`, `cargoJob`), `turSlep` (høyst 5,5 knop, `TUR_TOWV`; båten driver med vinden) og `turSesong`.
  - `turCan` sjekker at båten klarer turen. `turPay` er belønningen, og `turStuck` stopper fristen.
  - Det første oppdraget (`turFirst`) og kjedens ledd (`turChainNext`) tar ingen plass på tavla (`T.slots`). Løpets oppgaver gjør det samme.
- **Havsnød hos andre:** `sosMinute` i `core/14b-sikkerhet.js` (sjøloven § 135, hjelpeplikten), og nødanrop fra andre spillere (`ui/10o-ptow.js`). Slep fra Redningsselskapet går gjennom `rescue()` i `core/05-vessels.js`.
- **Sesonghendelsene** (`core/09c-seasons.js`, `skyen-og-felles-verden.md` 5.25f): `EVENTS`, `evTop` og `ev_top` (tavla), og `evClose` med premien `EV_PRIZE` (15 000, 7 500 og 3 000 kr) og merket i `S.ach.ev`. Kortet står i Sesong-appen (`ui/06d-season-folk.js`).
- **Topplistene og juks** (`skyen-og-felles-verden.md`):
  - `world_top` holder gjester ute.
  - `pos_world` gir hver båt en offentlig id, en hash, aldri kontoen.
  - `cheat_flags`, bryteren `cheat_on` og `cheat_vt` (lasten per båttype, låst mot `VESSELS` av `tests/unit/juksetabell.test.mjs`).
  - «En registrert konto kan fortsatt melde falske landinger»: simuleringen går i nettleseren.
- **Kystposten** (`core/09h-press.js`): `pressPut`. `news_put` tar bare kjente typer og nøkler, så en ny type trenger en migrering.
- **Bunkring** gjøres i havn fra menyen (`ui/10c-dock.js`). Autonav bunkrer ikke selv underveis, så et bunkringsstopp på en rute krever at spilleren er der.
- **AIS-kortet:** `aisInfo` i `ui/03-map.js` viser eier og fartstid for andre spillere.
- **Merkene:** `ACHL` i `core/09f-merker.js`, Milepæler-appen i `ui/05e-merker.js`.

## Løypa og tidene (anslått, regnes i KL1)

Forslaget er seks etapper mellom havner med diesel, og mållinja nord for Nordkapp. Distansene er rett linje mellom mottakene i `src/data/mottak.json` (km i spillets ramme, delt på 1,852):

| Etappe | Rett linje | Fyr på veien (`src/data/fyr.json`) |
|---|---|---|
| 1 Lindesnes–Bergen | 155 nm | Lindesnes Fyr, Lista, Marstein |
| 2 Bergen–Ålesund (over Stad) | 133 nm | Hellisøy, Kråkenes, Svinøy |
| 3 Ålesund–Rørvik | 197 nm | Grip, Kya, Sklinna |
| 4 Rørvik–Bodø (over polarsirkelen) | 164 nm | Træna, Myken, Skomvær |
| 5 Bodø–Tromsø | 177 nm | Torsvåg |
| 6 Tromsø–Nordkapp (linja nord for platået; havn i Honningsvåg) | 161 nm | Fruholmen, Helneset |
| **Sum** | **988 nm** | |

Rutene hoppet ble målt på (`autonav.md` 4.12n), var 8–37 % lengre enn rett linje. Løypa blir derfor trolig 1 100–1 300 nm. Tallene under er regnet for 1 200 nm på toppfart, uten stopp, vær og oppgaver. Rekkevidden er regnet med `fuelBase`/`fuelLph` på toppfart med full tank:

| Båt (`VESSELS`) | Toppfart | Ekte timer | Med turbo hele veien | Rekkevidde | Med turbo |
|---|---|---|---|---|---|
| Trebåten 7 m | 7 kn | 28,6 | 14,3 | 191 nm | 133 nm |
| Plastsnekka 26 fot | 8 kn | 25,0 | 12,5 | 284 nm | 191 nm |
| Havsjarken 35 fot | 10 kn | 20,0 | 10,0 | 363 nm | 233 nm |
| Kystbåten 15 m | 11,5 kn | 17,4 | 8,7 | 898 nm | 561 nm |
| Hurtigsjarken (brukt) 10,99 m | 22 kn | 9,1 | 4,5 | 374 nm | 196 nm |
| Aluminiumsbåten 5,9 m | 24 kn | 8,3 | 4,2 | 115 nm | 60 nm |

En etappe på rundt 200 nm tar 1,5–5 ekte timer. Trim gir flere bunkringsstopp: trebåten må bunkre rundt seks ganger uten trim og ni med turbo, og aluminiumsbåten ti og nitten. Det kommer av formelen for dieselen, ikke av løpet.

## Forslaget i korte trekk

Det som står her, følger anbefalingene i valgene. Et annet svar endrer det som står ved valget.

**For spilleren:**
- **Nå** (30–90 sekunder): en oppgave ved et fyr eller en linje, eller å komme inn til et sjekkpunkt og se etappetida og plassen.
- **I dag:** én etappe, en kveld.
- **Denne uka:** hele løypa mens vinduet er åpent (rundt 15 ekte dager), og tavla.

Kortet starter med «Påmeldt i Lindesnes» krysset av, så ingenting starter på null.

**Start og mål:**
- Båten ligger til kai i Lindesnes. Spilleren melder seg på i Oppdrag-appen, og klokka går når hun kaster loss.
- Hvert sjekkpunkt er en kai i havna for etappen (mottak eller verft med diesel, som tar imot alle klassene, sjekket med `portWhy`).
- Målet er en linje nord for Nordkapp.
- Forsøket er bundet til båten (`vid`) og klassen hun hadde ved start.

**Reglene i løpet** (spillets egne regler, ikke valg for Jonas; tallene er startverdier):
- **Trim er lov** (Jonas). Skippertak og «Ferdig nå» på verftet følger samme regel: de korter ned en ekte friksjon.
- **Hopp er ikke lov** fra påmeldingen til mål, eller til forsøket er brutt. `hopWhy` sier «Ikke i kappløpet». Hopp **til startstreken** og **hjem fra mål** er lov.
- **Slep fra Redningsselskapet eller en annen spiller bryter forsøket.** Det er hjelp utenfra, som i ekte kappseilas. Det samme gjør salg av båten. Etappene som er seilt, teller på merket.
- **Hjelpeplikten** (sjøloven § 135): svarer spilleren på havsnød (`sosMinute`) eller et nødanrop, trekkes tida fra svaret til hun er tilbake på ruta. Kappseilingsreglene gjør det samme (World Sailing, Racing Rules of Sailing, regel 1.1 og 62.1 c, lest i sammendrag). Sosialt er additivt: å hjelpe koster ingen plass.
- **Regelbrudd for hånd** gir tidstillegg:
  - en passering over fartsgrensa som `farvRec` skriver ned: 15 spillminutter
  - en passering der spilleren hadde vikeplikt (`S.nearMiss`): 15 spillminutter

  Autonav holder grensa og viker selv, så det gjelder bare den som styrer. 15 minutter er mer enn noen vinner på å gå fort gjennom en havn (rundt 2,5 minutter på 500 m).
- **Været:** tida går når båten ligger bi eller går i havn for været. Det er sjømannskap. «Autonav går inn ved» er spillerens valg, med risikoen den har.
- **Spillet lukket:** Autonav seiler videre. Det som krever spilleren (fyrbildet, målebrettet, bunkringen), venter, og klokka går.
- **Gjester** kan seile løpet og ser sin egen plass, men står ikke på tavla, som i `world_top`.

**Oppgavene underveis (x-faktoren):**
- Hver etappe har én kjent oppgave og én overraskelse som er lik for alle i klassen.
- Oppgavene lages med turoppdragenes egne funksjoner, men med faste steder. De ligger i løpet (`S.lop`), ikke på tavla:
  - De tar ingen plass (`T.slots`).
  - De betales ikke med `turPay`.
  - De teller ikke i tilbudsbremsen på 30 %.
- Oppgavene gir utfall som farten ikke kjøper:
  - **Fyrbildet i et bestemt lys** (lav sol, midnattssol): den som kommer fram på feil tid, venter på lyset (`turLysNext`), uansett hvor fort hun kom.
  - **Ekkoloddlinja** går på høyst 8 knop, og **slepet** av en båt med motorstopp på høyst 5,5 knop. Der er alle like trege. Båten på slep driver med vinden, så den som kommer senere, henter henne et annet sted.
  - **Frakta** lastes av folk om bord (`cargoJob`). Den som er alene, bruker lengre tid.
  - **Prøvestasjonen** er én spilltime fiske og målebrettet. Nøyaktig måling gir opptil 30 spillminutter fradrag, og en dårlig måling gir like mye tillegg. Den krever juksa, som havfartøyene ikke har (`rigs`). Havklassen får ekkoloddlinja i stedet.
  - **Havsnød** kommer fra sjøen (`sosMinute`), tilfeldig og gratis, med tida trukket fra.

**Klassene:** etter toppfarten uten trim (`vmax`), og havfartøyene (`cls: 'hav'`) for seg (V4). Oppgraderinger som propellen gir fart innenfor klassen. Klassen leses av typens eget tall, ikke av den oppgraderte farten.

**Tavla og hvor den vises:**
- I fanen «Kappløp» i Oppdrag-appen: én tavle per klasse, topp 20, din plass og mellomtidene.
- I et kort i Sesong-appen mens vinduet er åpent.
- I Kystposten: saken når vinduet åpner, lederen i hver klasse hver dag, og saken når en spiller fullfører og når løpet er over.
- På AIS-kortet: de tre beste i hver klasse til neste løp.
- Løpet heter etter stedene: «Lindesnes–Nordkapp 2028» (spillåret).

**Premien** (V6): kjent på forhånd, lik for alle og aldri tilfeldig. Alle som fullfører, får merket. Etappene teller på et langsiktig merke også når forsøket ikke blir fullført (1, 6, 18 og 60 etapper), så ingen går tomhendt.

**Juks: hva serveren kan sjekke.** Simuleringen går i nettleseren, så serveren kan bare sjekke at en tid er mulig, ikke at den er ekte:
- Ingen tid er lagt foran verdens klokke (`world_gh()`, som i `land_put`).
- Ingen etappe er raskere enn den korteste sjøveien delt på båttypens toppfart, ganget med trimmen serveren selv har levert (grantene), med en margin på 10 %. Dette krever toppfarten per type i en ny kolonne i `cheat_vt`.
- Sporet: ett punkt per spilltime blir sendt med etappen. Ingen to punkter ligger lenger fra hverandre enn toppfarten med trim rekker, og sporet går forbi sjekkpunktene i rekkefølge.
- Et hopp kjøpt mellom start og mål (`purchases`, HO3) gjør forsøket ugyldig.

Et forsøk som ikke kan være ekte, får merke i `cheat_flags` (slaget `lop`) og står aldri på tavla. Ellers gjelder `cheat_on` som for de andre listene. Serveren kan ikke se om båten gikk over land, om oppgavene ble gjort, eller om været ble respektert. Den som endrer klienten og melder en tid som er mulig, men ikke seilt, slipper gjennom, slik falske landinger gjør i dag.

**Hva serveren må lagre** (én ny migrering i KL3):
- `lop_legs`: løypa, med den korteste sjøveien per etappe fra KL1 og den minste tida oppgaven tar.
- `lop_runs`: ett åpent forsøk per konto og løp, med klassen, båttypen, båtnavnet, start, etappene (start, slutt, oppgave, tillegg, fradrag og sporet) og summen. Statusen er `run`, `done` eller `dnf`, og flagget står ved siden av.
- `vmax` i `cheat_vt`.
- Funksjonene `lop_start`, `lop_leg`, `lop_end`, `lop_top` og `admin_lop`, bare for `authenticated`. Tabellene er stengt for spillerne.
- Typen `lop` i `news_put`.

**Inntekten, ærlig:**
- **Trim gir spillere som betaler en fordel i løpet, slik Jonas har valgt.** Med turbo går båten dobbelt så fort så lenge den varer. I samme klasse vil en spiller som bruker trim hele veien, nesten alltid slå en like flink spiller uten. For trebåten er forskjellen rundt 14 ekte timer på hele løypa.
- Oppgavene endrer ikke den forskjellen i timer, fordi de tar like lang tid for alle. Det de gjør, er å legge inn utfall som farten ikke kjøper: lyset, de trege strekkene, målebrettet, bunkringsstoppene. En dårlig planlagt etappe med trim kan tape for en godt planlagt uten. Det balanserer innenfor marginene, ikke hele forskjellen.
- En plass på pallen i en klasse der noen bruker trim, er i praksis utenfor rekkevidde uten trim. Det er samme valg som for haill og topplista (Jonas 06.10.2026: pay-to-win som et valg). Merket for fullført, mellomtidene og egen beste tid kan alle nå.
- **Trim per etappe:**
  - Trebåten, 200 nm: 4 t 46 min ekte uten trim. Med pumpa (29 kr) tar den 3 t 10 min, og med turboen (49 kr) 2 t 23 min. Turboen har da 9,6 ekte timer igjen til neste etappe.
  - Seiles løypa over seks kvelder, går trimmen ut mellom etappene, fordi den går på verdens klokke også i havn. Det blir 174 kr med pumpa hver kveld og opptil 294 kr med turboen.
  - Hurtigsjarken som seiler alt i ett, trenger én turbo (49 kr).
- **Hopp til startstreken og hjem fra mål** (prisstigen i `hopp.md`, distansene anslått):
  - trebåten fra Bergen (rundt 220 nm): rundt 154 kr
  - havsjarken fra Tromsø (rundt 950 nm): rundt 313 kr

  Mange vil heller seile dit gratis på Autonav mens spillet er lukket.
- **Det som ikke selges:**
  - ingen påmeldingsavgift, ingen betalte nye forsøk og ingen kjøpte tips
  - ingen knapp i løpet som peker til Trim-appen, og ingen ord om at trim vinner

  Løpet skal gjøre trim fristende av seg selv. Mannskapets stillferdige ord om motoren ved avgangen (`turDepart`) gjelder som før.

## Valgene

**V1 Formen**
- **A (anbefalt):** tidsløp. Hver spiller starter når hun vil mens vinduet er åpent, og kan prøve igjen. Det beste fullførte forsøket teller.
- **B:** fellesstart. Alle kaster loss fra Lindesnes samme ekte time.
- **C:** tidsløp nå, og en fellesstart i tillegg når minst ti har meldt seg på.
- *Hvorfor A:* med rundt 14 aktive spillere blir en fellesstart et felt på én til tre båter, mens et tidsløp lar alle konkurrere når de har tid, også mens spillet er lukket.

**V2 Tidtakingen**
- **A:** én klokke fra start til mål, også når båten ligger i havn og du sover, slik Jonas sa det («den kjappeste tiden mellom Lindesnes - Nordkapp»).
- **B (anbefalt):** etappetider. Klokka står fra båten legger til ved et sjekkpunkt til hun kaster loss derfra, og tida er summen av de seks etappene. Løypa seiles likevel hel og i rekkefølge, med samme båt og uten hopp.
- **C:** én klokke, men inntil 10 ekte timer hvile i havn ved hvert sjekkpunkt trekkes fra.
- *Hvorfor B:* løpet skal måle sjømannskap, båt, trim og oppgaver, ikke hvem som kan være våken eller har fri en tirsdag, og en etappe (1,5–5 ekte timer) passer én kveld.

**V3 Når løpet går**
- **A (anbefalt):** én gang i spillåret, i spillets sommer (1.6–31.8 spilltid). Det er rundt 15 ekte dager hver 61. ekte dag.
  - Det første vinduet blir 20.12.2026–5.1.2027 hvis løpet er bygd da, ellers 19.2–7.3.2027.
  - Utenfor vinduet kan løypa seiles som trening, med tid, men uten tavle.
- **B:** alltid åpent, med ny tavle hver ekte uke.
- **C:** to ganger i spillåret: nordover om sommeren, og sørover (Nordkapp–Lindesnes) om vinteren.
- *Hvorfor A:* én ekte uke er seks uker vær i spillet, så bare et fast vindu gir alle samme årstid, lyse netter til fyrbildene og vær åpne båter tåler, og det bruker det sesonghendelsene alt har (tavla, avslutningen, premien, merket).

**V4 Klassene**
- **A (anbefalt):** etter toppfarten uten trim (`vmax`):
  - Sakte, under 9 knop: trebåten, snekka, plastsjarken.
  - Middels, 9–14 knop: havsjarken, sjarken med bakk, den nye sjarken på 12 knop, kystbåtene på 15 og 21 m.
  - Rask, fra 14 knop: den brukte hurtigsjarken, aluminiumsbåten.
  - Havfartøyene (`cls: 'hav'`) for seg.
- **B:** etter lengden (`len`): under 11 m, 11–15 m, over 15 m.
- **C:** én klasse med korrigert tid: tida ganget med båtens toppfart delt på en fast fart, som handikap i kappseilas.
- *Hvorfor A:* over 1 200 nm avgjør farten tida, ikke lengden (aluminiumsbåten på 5,9 m går 24 knop, trebåten på 7 m går 7), og klasser er lettere å forstå enn en korrigert tid.

**V5 Oppgavene**
- **A:** faste oppgaver, like for alle og kjent ved start, én per etappe.
- **B (anbefalt):** som A, pluss én overraskelse per etappe. Den er lik for alle i klassen og vises først når båten legger til ved sjekkpunktet før.
- **C:** oppgavene trekkes for hvert forsøk, ulikt for hver spiller.
- *Hvorfor B:* like oppgaver gjør tidene sammenlignbare, og overraskelsen er x-faktoren Jonas ba om, uten at en loddtrekning avgjør plassen.

**V6 Premien**
- **A:** synlig og varig, uten kroner:
  - plassen og tida i Kystposten
  - merket i Milepæler
  - linja «Lindesnes–Nordkapp 2028: 1. plass, Sakte» på AIS-kortet som de andre ser, fram til neste løp

  Alle som fullfører, får merket.
- **B (anbefalt):** som A, pluss kroner som i sesongene og skreifestivalen: 15 000, 7 500 og 3 000 kr til de tre beste i hver klasse (`EV_PRIZE`).
- **C:** som A, pluss en egen skrogstripe i gull, sølv eller bronse til de tre beste, når malerverkstedet i `docs/planer/tilpasning.md` er bygd.
- *Hvorfor B:* premien er kjent fra før og liten nok til at fisket blir hovedinntekten, og den synlige delen blir AIS-kortet og avisa, siden vimplene er tatt bort.

**V7 Trim på tavla**
- **A (anbefalt):** tavla viser ikke om noen brukte trim, slik haill aldri vises for andre.
- **B:** tida står med «med trim» når trim var på i forsøket.
- **C:** to tavler i hver klasse: én der trim er lov, og én for forsøk uten trim.
- *Hvorfor A:* det er samme regel som for haill på topplista, og med få spillere blir åtte tavler stort sett tomme. Farten på AIS-kortet (en trebåt i 14 knop) viser det likevel for den som ser etter.

## Fasene

Hver fase er én økt. KL1 venter til HO3 (steg 106) er levert, fordi den økta eier `core/06j-hopp.js` nå.

### KL1 Kjernen: løypa, klokka, reglene og oppgavene (uten sky og uten egen skjerm)

- **Hva:**
  - En ny fil, `core/09o-kapplop.js`. Den kommer inn i malen etter `09n-ukas.js` og i `COVER` i `tests/run.py`. Den har:
    - `LOP`: løypa, sjekkpunktene, mållinja, oppgavene per etappe og klasse, vinduet i spillkalenderen og klassene. Det er en konstant i koden som `EVENTS`, ikke en fil i `src/data/`, som ikke redigeres for hånd.
    - `lopCls(V)`, ren funksjon: klassen fra `vmax` og `cls`.
    - `lopStart()` og `lopEnd(how)`.
    - `lopMinute()` fra `step`, med ett kall hver i `dock` og `depart` for sjekkpunktene.
    - `lopTime(run)`, ren funksjon: etappene, tilleggene og fradragene.
    - `lopMinH(nm, vmax, trim)`, ren funksjon: den minste mulige tida, som serveren får som samme regel i KL3.
  - **Oppgavene:** generatorene i `core/09g-turer.js` får et valg om fast sted (`turFoto` med fast fyr, ekkoloddlinja og stasjonen fra `turProve`, `turFrakt` mellom faste havner, `turSlep` på fast sted). Oppgavene ligger i `S.lop`: ingen plass på tavla, ingen `turPay` og utenfor tilbudsbremsen. Overraskelsen er bestemt av løpets id, så den er lik for alle i klassen.
  - **Reglene over:**
    - én linje i `hopWhy`
    - tilleggene fra `farvRec` og `S.nearMiss`
    - fradraget for havsnød
    - brutt forsøk ved slep (`rescue`, slep fra en annen spiller) og ved salg av båten
  - **Trening** utenfor vinduet: tid, men ingenting sendes.
- **Filer:**
  - nye: `core/09o-kapplop.js`, `tests/unit/kapplop.test.mjs`, `tests/kapplop.py` (LITE)
  - endres: `src/index.html`, `core/09g-turer.js` (fast sted som valg i generatorene), `core/05-vessels.js` (ett kall i `dock`), `core/06-services.js` (ett kall i `depart`), `core/06j-hopp.js` (én linje i `hopWhy`), `tests/run.py`
- **Tester:**
  - Enhetstestene, sett røde først: klassen for hver båttype i `VESSELS` lest fra feltene, `lopTime` med tillegg og fradrag, `lopMinH`, hoppet nektet i løpet og lov før start og etter mål. Kjøres med `node tests/unit/run.mjs`.
  - `kapplop.py` med hele kysten i bygget (`python3 tools/map/release.py`, `python3 tools/map/game.py`):
    - påmelding i Lindesnes
    - etappe 1 med oppgave og sjekkpunkt
    - nøytral tid i havn
    - spillet lukket midt i en etappe (`catchUp`) mens Autonav seiler videre
    - hoppet nektet
    - slep fra Redningsselskapet gir brutt forsøk
  - `hopptest` (hoppet nektet i løpet), `turtest` (tavla og turoppdragene urørt) og `python3 tests/run.py changed`.
- **Måles** (tallene skrives i denne planen og i `oppdrag-og-kystposten.md`):
  - lengden på hver etappe med `leiaRoute`
  - tida per etappe for trebåten, havsjarken, kystbåten 15 m og hurtigsjarken, med og uten turbo, med en tørrkjøring som `hopRun`, i stille vær og i dagens vær
  - bunkringsstoppene
  - hvor lang tid hver oppgave tar
  - at sjekkpunkthavnene tar imot alle klassene (`portWhy`), og at åpne båter kommer fram innaskjærs
- **Stikkprøve:** løypa går langs hele kysten. Testen seiler etappe 1 (sør), 3 (midt) og 6 (nord).
- **Ferdig når:**
  1. En etappe seilt i testen gir riktig etappetid med oppgave, tillegg og nøytral tid.
  2. Hoppet nektes i løpet, og er lov til startstreken og etter mål.
  3. Klassen settes fra feltene for alle båttypene, uten navn.
  4. Løypas lengde og tidene per klasse er målt og skrevet inn.

### KL2 Skjermen: Kappløp i Oppdrag-appen, løypa i kartet og klokka

- **Hva:**
  - **Fanen «Kappløp»** i Oppdrag-appen, ved siden av Turer og Bestillinger. Den viser:
    - løypa med etappene, og mellomtidene dine
    - oppgavene, og overraskelsen når den er vist
    - «Meld på» når båten ligger i Lindesnes, og «Begynn på nytt»
    - reglene i korte setninger
  - **Løypa i kartet** mens spilleren er påmeldt: streken, sjekkpunktene og ringene for oppgavene, som `turSvg`.
  - **Løpsklokka** i GPS-boksen i 3D (`#gps3d`) og i kartplotteren mens en etappe går.
  - **Kortet ved hvert sjekkpunkt** med etappetida.
  - **Kortet i Sesong-appen** mens vinduet er åpent.
  - Ingen lenke til Trim-appen.
- **Filer:**
  - ny: `ui/05l-kapplop.js`, `tests/kapplopshot.py`
  - endres: `ui/phone/02-havn-last-agn-ordre.js` (fanen), `ui/03-map.js` (løypa), `ui/04-panels-instruments.js` (klokka i `#gps3d`), `ui/06d-season-folk.js` (kortet), `src/styles.css`, `src/index.html`, `tests/run.py`
- **Tester:** `kapplopshot.py`, `turtest` (fanene i Oppdrag), `hudtest` (GPS-boksen), `eventtest` (Sesong-kortet) og `python3 tests/run.py changed`.
- **Skjermbilder** i 800×1280 og 1280×800: fanen før og under et forsøk, kartet med løypa, klokka i 3D og kortet ved et sjekkpunkt.
- **Ferdig når:**
  1. Fanen, kartet og klokka er sett i begge formater uten at noe overlapper.
  2. Påmelding, sjekkpunkt og «Begynn på nytt» virker med berøring.
  3. Ingenting i løpet peker til butikken.

### KL3 Skyen: tavla, sjekkene og admin

- **Hva:**
  - **Migreringen:**
    - `lop_legs`, `lop_runs` og `vmax` i `cheat_vt`
    - `lop_start`, `lop_leg`, `lop_end` og `lop_top`. `lop_top` gir topp 20 per klasse, antallet, din plass og den offentlige id-en som `pos_world`
    - `admin_lop`
    - sjekkene over, og typen `lop` i `news_put`
    - gjestene utenfor tavla, merkede kontoer ute når `cheat_on` står på, og bare `authenticated`
  - **Klienten:** `lopSync` og `lopTop` i `ui/10h-world.js`. Tavla kommer i fanen fra KL2. Uten sky, eller før migreringen (404), viser fanen bare egen tid.
  - **Hendelsene:** `cloudEv` med `lop_show`, `lop_start`, `lop_leg`, `lop_done` og `lop_dnf` (med hvorfor). Trim på eller av står bare i hendelsene, for admin.
  - **Admin-fanen «Kappløp»:**
    - påmeldte, fullførte og brutte, og hvorfor de ble brutt
    - snittida per klasse
    - andelen med trim, og hopp til startstreken, som summer og aldri navn
    - forsøkene med merke
  - **Personvern:** `src/legal/personvern.html` får et avsnitt om løpstidene på tavla (brukernavn, båtnavn og tid). Det går som PR til Jonas.
- **Filer:** `supabase/migrations/` (ny), `ui/10h-world.js`, `ui/05l-kapplop.js`, `src/admin/index.html`, `tests/unit/juksetabell.test.mjs`, `src/legal/personvern.html` (PR), `tests/run.py`.
- **Migreringen:** Jonas kjører den på testprosjektet før pushen, og i produksjon rett før slippet som tar med koden. Si fra til ham før pushen.
- **Tester:**
  - `sqltest`: funksjonene; en etappe som er for rask, får merke; et hopp kjøpt i løpet gjør forsøket ugyldig; gjestene og `cheat_on`. Sett rød uten migreringen.
  - `kapplop.py` med falsk sky som `eventtest`: tavla, egen plass og 404.
  - `cloudtest` og `admintest`, `juksetabell.test.mjs` og `python3 tests/run.py changed`.
- **Ferdig når:**
  1. En tid som ikke kan være seilt, står aldri på tavla.
  2. Tavla viser topp 20 per klasse og din plass, og gjester ser bare seg selv.
  3. Admin viser løpet i trakten.
  4. Personvern-PR-en er sendt til Jonas, og migreringen er kjørt på testprosjektet.

### KL4 Avslutningen: premien, merket, Kystposten og AIS-kortet

- **Hva:**
  - **`lopClose`**, som `evClose`, når vinduet er over: premien per klasse (V6), merket «Lindesnes–Nordkapp 2028» og plassen i `S.ach.ev`, og det langsiktige merket for etapper (`ACHL` `lop`: 1, 6, 18 og 60).
  - **Kystposten:**
    - saken når vinduet åpner (nasjonalt, `newsForDay`)
    - lederen i hver klasse hver dag
    - en sak når en spiller fullfører (type `lop`: klasse, tid og plass)
    - resultatet
  - **AIS-kortet** (`aisInfo`): plassen til de tre beste i hver klasse, fram til neste løp.
  - **Push** bare om egen båt etter `docs/push-plan.md`, innenfor taket: «Båten er ved sjekkpunktet» og «Fyret venter på lyset» mens appen er lukket.
  - **Patchnote**, kort på norsk og engelsk, uten trim, priser eller butikk.
- **Filer:** `core/09o-kapplop.js`, `core/09h-press.js`, `core/09f-merker.js`, `ui/05e-merker.js`, `ui/03-map.js` (`aisInfo`), `ui/10g-push.js`, `ui/phone/07-patch.js`.
- **Tester:**
  - `kapplop.py`: avslutningen med falsk tavle, med premie, merke og sak.
  - `posttest`, `merketest`, `cloudtest` (AIS-kortet), `tests/unit/patch.test.mjs` og `python3 tests/run.py changed`.
- **Skjermbilder** i 800×1280 og 1280×800: AIS-kortet, saken i Kystposten og merket.
- **Sjekkes før premien settes:** at et løp uten innsats, og med premie i spillets kroner som ikke kan tas ut, ikke er pengespill etter pengespilloven (Lotteritilsynet).
- **Ferdig når:**
  1. Avslutningen gir premien og merkene én gang, også når spillet var lukket da vinduet stengte.
  2. Saken, AIS-kortet og merket er sett i begge formater.
  3. Patchnoten står.

### KL5 Fellesstarten (bare ved V1 B eller C)

En fast ekte starttid i vinduet, samling ved kaia i Lindesnes, startsignal på VHF og en egen tavle. Den planlegges når Jonas har svart.

## Det som er antatt eller usikkert

- **Løypas lengde** (1 100–1 300 nm) og tidene i tabellen er regnet av rett linje og toppfart, ikke seilt. Det gjelder også rekkevidden fra dieselformelen og datoene for vinduet. KL1 måler dem.
- **Om åpne båter kommer over Stad, Hustadvika og Vestfjorden** innaskjærs og innenfor grensene sine i sommervær, og om sjekkpunkthavnene tar imot havfartøyene. Gjør de ikke det, står havklassen utenfor første runde.
- **Tilleggene og fradragene** (15 minutter per regelbrudd, opptil 30 minutter for målebrettet) og marginen på 10 % i serverens sjekk er startverdier.
- **At slep bryter forsøket**, og at Skippertak og «Ferdig nå» er lov som trim, er øktas forslag. Begge kan snus i KL1 med én linje.
- **Kappseilingsreglene 1.1 og 62.1 c** er bare lest i sammendrag, fra en eldre utgave. Sjøloven § 135 er lest i sammendrag, som i `sjofart-og-lover.md` 7.1. Begge sjekkes før KL1 skriver tekstene.
- **Pengespilloven** er ikke sjekket for et løp med premie der trim kjøpt for ekte penger gir fart (KL4). Spilleren kjøper en kjent vare og satser ingenting, og premien er spillets kroner. Det må likevel slås opp.
- **Været er ulikt for hvert forsøk** i et tidsløp. Det er rettferdig bare i den forstand at alle har samme varsel og velger selv når de går, slik rekordforsøk til sjøs gjøres.
- **Om oppgaver som krever spilleren** (fyrbildet, målebrettet, bunkringen) gjør løpet til en prøve i å være til stede. V2 B demper det. Hvor mye, ses først i trakten.
- **Om spillerne vil kjøpe trim til løpet, og hopp til startstreken,** vet ingen før butikken er i ekte modus (steg 72, L2) og løpet har gått én gang. Det leses av i admin før noe endres.
- **Antallet:** med få spillere kan en klasse ha én båt. Tavla viser antallet, så en seier i en tom klasse ser ut som det den er.

## Det planen ikke gjør

- Ingen hopp i løpet, ingen ny teleport, og ingen endring i hoppets pris, trimmen (`BOOSTS`), haillen eller turoppdragenes belønning.
- Ingen påmeldingsavgift, ingen betalte nye forsøk, ingen kjøpte tips og ingen premie i ekte penger.
- Ingen tilfeldig belønning, ingen nedtelling og ingen salgsknapp i løpet. Patchnoten nevner aldri trim eller butikken.
- Ingen vimpel på båten (Jonas 09.11.2026).
- Ingen NPC-båter på tavla og ingen «spøkelsesbåt» med lederens spor i kartet. Det kan komme etter KL4 hvis Jonas vil.
- Ingen andre løyper i første runde. `LOP` er laget slik at en sørgående løype eller korte løp i hver landsdel kan legges til uten ny motor.
- Ingen hopp eller løp for flåtens båter på Driftsplanen, bare for båten spilleren følger.

## Status

- 12.11.2026: planen skrevet i Jonas' økt (bare dokument). Valgene V1–V7 venter på Jonas. Ingenting er bygd.
