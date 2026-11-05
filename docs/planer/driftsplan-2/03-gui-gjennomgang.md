# Driftsplan 2: GUI-gjennomgangen (05.11.2026)

Dette er en gjennomgang av driftsplanen slik en spiller bruker den på nettbrettet: siden i skuffen (`ui/05d-plan2.js`, `PLAN2UI`), kartvinduet (`ui/03g-planmap.js`, `PLANMAP`), og det siden viser om motoren (`core/06g-plan2.js`, `core/06h-plan2-engine.js`). Fasiten er avsnittet «Driftsplan 2» i `docs/systemer/driftsplan.md`, med Jonas' to regler: «Skipper går alltid dagvakt, styrmann natt.» og «Ved døgndrift jobber mannskapet 12 timer hver og mannskap som har frivakt sover ombord. Båten må ha køyer nok til mannskapet for å kunne gå døgndrift.»

Alt her er målt eller sett på skjermbilder 05.11.2026 på grenen `ccr-3d7eb5bf-vgz41n` (siste commit 4bbef7f4). Ingenting i `src/` er endret. Testen er `tests/driftsplan2gui.py`; den skriver bildene og målingene til `tests/out/driftsplan2gui/` (`maalinger.json`). Bildene som er lenket her, ligger i `03-gui/`, med de tre formatene side om side: 800×1280, 1280×800 og 384×853.

## Sammendrag

- 20 scenarier (pluss tellingene i to andre formater) er spilt med ekte berøring: telefonen, Driftsplan-appen, radene, −/+, forhåndsvalgene, kartet (trykk, dra, kortet), Start, Pause, «Hent redskapet», kopier og slett. 50 tilstander er tatt og målt i hvert av de tre formatene. Testen gir 86 OK og 11 FEIL på 7,5 minutter, uten sidefeil.
- **Det beste:** en ny plan er klar med to trykk fra «Lag driftsplan» (fire fra lukket telefon). Ingen sideveis overflyt, ingen kuttet tekst, ingen knapper utenfor skjermen. Planlista og kortet i kartet dekker aldri hverandre eller den valgte nåla. «Nå» stemte med det båten gjorde hver time i 26 timer. Låste valg sier hvorfor på selve knappen.
- **Det verste (F2):** med en rorbu som hjem, som en ny plan velger i en mottakshavn, går dagdriften ut igjen hvert kvarter hele kvelden og natta. Mannskapet kommer over 90 i slitenhet (grensen er 72), og du ned i 14 % energi. Årsaken er funnet: et anløp ved rorbu meldes ikke til planen (`05-vessels.js:902`).
- **Feil i grensesnittet:** «Til Mannskap-siden» blir stående på Driftsplan (F1). Fangstlista ligger over skuffen (F3), og dokka dekker bunnen av skuffen på telefon til sjøs (F4). «Tøff» setter vinden over båtens grense (F5). Den engelske utgaven har norske ord (F6), og dagens forklaringer viser negative timer (F7).
- **Friksjon:** skuffen er bare 55 % av høyden i stående format (U1). 49 ulike trykkflater er under 44 px (U7). Pause lar båten fortsette turen uten «Nå» (U4). Grunnen for låst døgndrift på en båt som aldri kan gå døgndrift, er misvisende (U2).

## 1. Slik ble det gjort

- **Bygget og nettleseren:** `dist/` fra `node build.mjs` med Senja-dataene, Playwright 1.63 med Chromium, `KYST_LITE=1` (ingen 3D; bakgrunnen bak skuffen er derfor svart på bildene), `--disable-gpu-compositing`, frø `seed=1`, oppstart med `boot(pg)`. Havna er Husøy.
- **Tilstanden settes i JS før hvert scenario:** båttypen, mannskapet, haler og redskap (`S.equip`, `S.pgear`), fangstmerker, penger, full tank, og hvem som er om bord. «Deg i land» betyr om bord i en annen båt i flåten, slik spillet har det (`S.me` er alltid en båt, `ensureFleet`).
- **All bruk av planen er ekte berøring:** `Input.dispatchTouchEvent` på midten av et element som er på skjermen. Telefonen og skuffen reagerer på `click`, og et berøringstrykk gir `click` i Chromium, som på Android. Et element utenfor synsfeltet hentes fram med et sveip i panelet det ligger i, slik en finger gjør. Testen teller trykk og sveip.
- **Kartet:** nålene trykkes der de ligger etter at kartet har tilpasset utsnittet. Bare når et punkt er utenfor skjermen eller under et panel, flyttes utsnittet først i JS (for noen av de nye plassene i S04); trykket er likevel ekte.
- **Formatene:** samhandlingen skjer i 800×1280 (Jonas' nettbrett stående). Hver viktig tilstand tas også i 1280×800 og 384×853 ved å endre vinduet, og måles der. Tellingene til en plan som går, er gjort i alle tre formater.
- **Motoren** er spilt videre med `step()` i løkke, slik `driftsplan2ui.py` gjør. Skuffen har tegnet seg selv mellom hver avlesning, som den gjør hvert 0,7 s i spillet.
- **Målt per tilstand og format:**
  - sideveis overflyt (siden og panelene);
  - overlapp: planlista mot kortet, mot nålene og mot plotterens knapper, og skuffen mot fangstlista, dokka og toasten;
  - trykkflater under 44 × 44 px i skuffen, planlista og kortet (regelen i `docs/planer/ui-redesign.md`);
  - kuttet tekst og knapper utenfor skjermen;
  - `pageerror` og `console.error`.

## 2. Hva som er dekket

| # | Oppsett | Trykket | Resultat |
|---|---|---|---|
| S01 | sjark, deg + 2, bare juks, fangstmerker | telefon → app → Lag driftsplan → Start; hele siden sveipet | OK. 4 trykk fra lukket telefon, 2 fra «Lag driftsplan». Planen kom utfylt med hjem (rorbu), juks og juksplass fra merket. [bilde](03-gui/s01-dagdrift-ny-plan.jpg) |
| S02 | sjark, du i land, 2 uten skipper/styrmann | Mannskap-raden → Til Mannskap-siden → Gjør til skipper/styrmann → Åpne → Start | «Ikke klar ennå» med grunn: OK. «Til Mannskap-siden»: **FEIL (F1)**. Via dokka: 7 trykk og 2 sveip til planen går. [bilde](03-gui/s02-ikke-klar-ikke-klar.jpg) |
| S03 | sjark, linehaler, 4 hyseline + 10 bankline, 6 blåsesett | Redskap (Bare juksa, Line, Ja), + Felt, forslaget, typebryteren, + til grensen, ståtid ±, ↑ | OK. + stopper ved 4 stamper med toast; ståtid i steg på 1 t. [bilde](03-gui/s03-line-plasser.jpg) |
| S04 | som S03 | Velg i kartet, trykk nål, kortets −/+, ↷, fri, land, sjø, dra, Juksplass, ↑/↓, Fjern, Ferdig | OK. 14 trykk. Land avvist med «Det er land der.». Lista sier for eksempel «Dagen blir 12,6 t, hjemme kl. 18:46», og «… 14,4 t … · over 14 t: mannskapet blir slitne» når dagen blir lang. Kortet dekker plotterens knapper i 384×853: **FEIL (U6)**. [bilde](03-gui/s04-kart-kort-felt.jpg) |
| S05 | sjark, garnhaler, 12 garn | + Felt for garn, forslaget, + ståtid, Start | OK. Ståtid i steg på 6 t. Planen starter. |
| S06 | sjark, teinehaler, 20 teiner, uten agn | + Felt for teiner, forslaget | OK. 48 t ståtid, og dagen sier «Kjøper 24 kg agn i Husøy». [bilde](03-gui/s06-teiner-dagen.jpg) |
| S07 | sjark uten haler, 0 blåsesett | Redskap (låste knapper), så linehaler satt i JS, Line, felt, Start | Låst med grunn: OK. Uten blåsesett starter planen, og først på feltet står «Kunne ikke sette …» (U9). [bilde](03-gui/s07-uten-haler-laast.jpg) |
| S08 | sjark | Levering: valgt mottak, Hver tur, Hvert N. døgn med + til 7, Nærmeste, Full last | OK. Raden sier «Senjahopen · hvert 7. døgn». |
| S09 | sjark | Vær: Forsiktig/Tøff/Vanlig, + vind og sjø til grensen | + stopper ved 15 m/s og 3,6 m: OK. «Tøff» gir 16 m/s: **FEIL (F5)**. [bilde](03-gui/s09-vaer-grense.jpg) |
| S10 | sjark, deg + 2 | Rytme: flerdøgn, + døgn, + ut kl., Start | Døgndrift låst «fire om bord (dere er 3)», flerdøgn åpen, starter: OK. |
| S11 | kyst15, deg + 3, 6 køyer | Rytme → Døgndrift → Start; 16 t spilt | OK. Vaktene står i «I dag» (06–18 deg og Per, 18–06 Ole og Kari). 4 trykk og 2–5 sveip fra «Lag driftsplan». [bilde](03-gui/s11-dogndrift-kveld.jpg) |
| S12 | breisjark, deg + 4, 4 køyer | Rytme | Låst «Krever køyer til alle om bord (4 av 5)». Med deg i land (fire om bord) åpner den: OK. [bilde](03-gui/s12-faa-koyer-laast.jpg) |
| S13 | snekke (ingen køyer, plass til 2), deg + 2 | Rytme, Hjem | Låst, men grunnen er misvisende (U2). Hjem skiller «sover godt»/«hviler dårlig»: OK. [bilde](03-gui/s13-uten-koyer-rytme.jpg) |
| S14 | trebat (plass til 1), deg + 1; deg i land; bare deg | Mannskap-raden, Start | OK. «Du er skipper» om bord, «Går bare med deg om bord» i land. Bare deg: planen starter. |
| S15 | autoliner 45 m, linehaler, 20 bankline | Hjem → Til ankers nær havna | OK. Raden sier «Husa, til ankers». [bilde](03-gui/s15-stor-bat-til-ankers.jpg) |
| S16 | sjark | Hjem: ett trykk på hver type | OK for rorbu, fiskemottak, verft og naust. Havneplass finnes ikke i testbygget (kapittel 5). [bilde](03-gui/s16-hjem-liste.jpg) |
| S17 | sjark, deg + 2, line + juks | Start, 26 t spilt time for time, statistikk, «Mer», stopp → Endre plassene | «Nå» stemmer hver time: OK. Pila «←»: OK. Statistikk etter et døgn: OK (fisket, turer, om bord; levert 0 kg, fordi lasten ikke ble full). [statistikk](03-gui/s17-i-drift-statistikk.jpg). Avganger hele natta: **FEIL (F2)**. [bilde](03-gui/s17-i-drift-natt.jpg) |
| S17b | som S17, feltet først | Start, Pause med lina i sjøen, Hent redskapet | OK. Lina hentet og planen av etter 3 t. Etter Pause fisker båten videre (U4). [bilde](03-gui/s17b-hent-pause.jpg) |
| S18 | sjark + en båt til | kopier-knappen, Slett (avbryt), Slett (ja) | OK. Toast ved kopiering; Slett spør først. [bilde](03-gui/s18-kopier-slett-kopier.jpg) |
| S19 | sjark, stoppet plan, du i land | dokka (prikken), telefonen → Rederi → Åpne; Mannskap → Åpne | OK. Prikk på Mannskap; Rederi sier «Driftsplanen har stoppet»; begge «Åpne» går til planen. [bilde](03-gui/s19-rederi-rederi.jpg) |
| S20 | som S03, engelsk | Make a plan, Places, + Field, Choose in the chart, kortet | **FEIL (F6):** «Bankline», «hyseline», «8 t». [bilde](03-gui/s20-engelsk-kort.jpg) |

## 3. Funnene

Hvert funn har en ID som Jonas kan velge fra. «Sett» betyr på skjermbildet; «målt» betyr i DOM-en eller i motoren; «antatt» betyr lest i koden uten å være prøvd.

### Feil

**F1 – «Til Mannskap-siden» blir stående på Driftsplan.**
- **Hva:** trykket på knappen i Mannskap-raden (og den samme knappen når planen har stoppet for mannskapet, `fix:'mannskap'`) åpner Mannskap-siden et øyeblikk, så hopper skuffen tilbake til Driftsplan. Spilleren ser ingen endring. Målt: `DOCK.open('arbeid')` kalles, men skuffen viser `drift` etterpå. Omveien er Mannskap-knappen i dokka.
- **Hvor:** `ui/05d-plan2.js:266–267` (`PHONE.open('arbeid'); return false`). I `ui/10c-dock.js:342–343` returnerer `PHONE.dact` den gamle siden (`drift`), og den er ulik `page` (nå `arbeid`), så skuffen settes tilbake. Det samme gjelder trolig «Se kvoten» (antatt).
- **Formater:** alle.
- **Bilde:** [s02-ikke-klar-til-mannskap-trykket.jpg](03-gui/s02-ikke-klar-til-mannskap-trykket.jpg)
- **Forslag:** la `p2-crew` og `p2-fix` returnere siden de vil til (som `open` gjør), eller la skuffens klikk-handler ikke overstyre når `page` er endret under `dact` (ta vare på `page` før kallet).

**F2 – Dagdrift med rorbu som hjem går ut igjen hele kvelden og natta.**
- **Hva, målt:** S17 er en sjark med deg og to, line og juks, «Dagdrift, ut kl. 05:00». Hjemmet er Husa rorbu, som `fresh()` velger når båten ligger ved et mottak (`05d-plan2.js:218–219`). Når båten kommer hjem om kvelden, legger planen en ny dag med en gang. Den går ut igjen hvert 14. minutt med 0,6 t juksing: 22 avganger mellom 18:24 og 00:09 i siste kjøring. Mannskapet nådde 92 i slitenhet (grensen er 72), og du 14 % energi. Fire kjøringer før den ga det samme. Lina ble trukket kl. 04–05 om natta. «I dag» viser det samme: «20:23 Går fra Husa · 20:27 Jukser på juksplass 1 til kl. 21:00 (0,6 t) ← · 21:05 Hjem til Husa · Hviler til kl. 00:16».
- **Årsak, funnet med en instrumentert kjøring:** `dock` kaller ikke `opsLanded` ved en rorbu (`core/05-vessels.js:902`: `if (wasOps && !port.rorbu)`). Turen avsluttes derfor «utenfor planen». `plan2Step` setter `replan` (`06h-plan2-engine.js:176`), og `plan2Boundary` legger en ny dag straks uten å vente på avgangstida eller hvilen (`06h-plan2-engine.js:210`). «Mannskapet er slitne» kutter hver tur etter ett minutt, og ringen begynner på nytt. Dette bryter «Skipper går alltid dagvakt» og grensene 72/25.
- **Formater:** ikke avhengig av format.
- **Bilde:** [s17-i-drift-natt.jpg](03-gui/s17-i-drift-natt.jpg)
- **Forslag:** kall `opsLanded` også ved rorbu når turen var planens (unntaket gjelder Autonav-hvilen), eller la `plan2Step` regne et anløp ved `o.home` som steget «hjem». Testen sjekker at dagdrift ikke går ut mellom kl. 20 og 04.

**F3 – Fangstlista ligger over skuffen.**
- **Hva, sett og målt:** når båten fisker, ligger fangstflisene («Her 28 kg · 28 kg/t», «9 × Torsk 22,4 kg · ca. 1 314 kr» …) oppå skuffen. De dekker verdiene i radene Redskap, Plasser og Levering, og i 384×853 også dagen. Målt i 10 av 50 tilstander i 800×1280, 8 i 1280×800 og 7 i 384×853. Flisene tar ikke trykk (`pointer-events:none`), men teksten under kan ikke leses.
- **Hvor:** `styles.css:1503` (`#catchFeed` med z-index 5 i `#app`, skuffen ligger i `#mapwrap`).
- **Formater:** alle.
- **Bilder:** [s17-i-drift-naa-idag.jpg](03-gui/s17-i-drift-naa-idag.jpg), [s11-dogndrift-kveld.jpg](03-gui/s11-dogndrift-kveld.jpg)
- **Forslag:** skjul fangstlista mens skuffen er åpen (`body.dk-open #catchFeed{display:none}`), eller flytt den til venstre for skuffen i liggende format og over den i stående.

**F4 – Dokka dekker bunnen av skuffen på telefon til sjøs.**
- **Hva, sett og målt:** i 384×853 til sjøs har dokka to rader. Den øverste raden (Mannskap, Beholdning) ligger over den nederste delen av skuffen, der «Hjem»-raden skal stå. Målt i 7 av 50 tilstander, bare i 384×853.
- **Hvor:** `styles.css:122` (skuffens `bottom` med `--dkx`) og `ui/10c-dock.js:236` (`rowsUp` setter `--dkx`). Antatt: høyden regnes ikke på nytt når dokka bytter fra havneknapper til sjøknapper mens skuffen er åpen.
- **Formater:** 384×853.
- **Bilde:** [s17-i-drift-naa-idag.jpg](03-gui/s17-i-drift-naa-idag.jpg) (høyre del)
- **Forslag:** kjør `rowsUp` når dokkas knapper endres (eller med en `ResizeObserver` på `#dock`), eller hold dokka på én rad mens skuffen er oppe.

**F5 – «Tøff» setter vinden over båtens grense.**
- **Hva, målt:** på en sjark stopper + for vind ved 15 m/s (`BOAT.risk[2]`), men forhåndsvalget «Tøff 16/3,5» setter 16 m/s. Knappen viser «Tøff 16/3,5» uansett båt.
- **Hvor:** `ui/05d-plan2.js:287`; grensen i `:285`.
- **Formater:** alle.
- **Bilde:** [s09-vaer-grense.jpg](03-gui/s09-vaer-grense.jpg)
- **Forslag:** klem vinden i forhåndsvalget som sjøen klemmes (`Math.min(P.wind, Math.round(BOAT.risk[2] || 20))`), og vis tallene som blir satt på knappen.

**F6 – Norske ord i den engelske utgaven.**
- **Hva, målt og sett:**
  - Redskap-raden: «Line: 4 hyseline, 10 bankline».
  - Linetypebryteren på siden: «Bankline».
  - Kortet: «Bankline ⇄», radnavnet «Bankline» og «8 t» for ståtida (skal være «8 h»).
- **Hvor:** `ui/05d-plan2.js:87` og `:102` (`LINE_KINDS[…].no` i begge språk), `ui/03g-planmap.js:52–54` (`.no` og `' t'`).
- **Formater:** alle.
- **Bilder:** [s20-engelsk-plasser.jpg](03-gui/s20-engelsk-plasser.jpg), [s20-engelsk-kort.jpg](03-gui/s20-engelsk-kort.jpg)
- **Forslag:** `L(LINE_KINDS[k].no, LINE_KINDS[k].en)` og `L(' t', ' h')`. Testen leter etter norske ord på siden, i lista og på kortet.

**F7 – Dagens forklaringer viser feil.**
- **Hva, sett:**
  - Negative timer: «Dagen: Per blir sliten (72) etter −0,4 t» og «energien din holder −0,2 t». Det skjer når mannskapet eller du allerede er over grensen; planen legger likevel en dag (henger sammen med F2).
  - Feil tid: «felt 1: trekkes i kveld etter dagen (ståtida er ute kl. 05:51)», om en trekking neste morgen.
- **Hvor:** `core/06g-plan2.js:117–118` (`fmt(bF, 1)`, `fmt(bE, 1)` uten nedre grense); `:187` (`p.due - H0 < 24` gir «i kveld» også om morgenen etter).
- **Formater:** alle.
- **Bilder:** [s17-i-drift-natt.jpg](03-gui/s17-i-drift-natt.jpg), [s17-i-drift-stoppet.jpg](03-gui/s17-i-drift-stoppet.jpg)
- **Forslag:** når grensen alt er nådd, si «Per er sliten nå (78): hviler først» og legg ingen dag. Skriv «i natt»/«i morgen kl. 05:51» ut fra klokka, ikke ut fra 24 timer.

### UX-friksjon

**U1 – Skuffen er bare 55 % av høyden i stående format.**
- **Hva, målt:** på 800×1280 er 644 px av planen synlige; Start, dagen og to til fire rader. Rytme og Mannskap krever sveip, og døgndrift tar 4 sveip. På 384×853 er bare Start og dagen synlige. Over skuffen står HUD-en og 3D-bildet, som planen ikke trenger.
- **Hvor:** `styles.css:122`.
- **Formater:** 800×1280 og 384×853.
- **Bilde:** [s01-dagdrift-ny-plan.jpg](03-gui/s01-dagdrift-ny-plan.jpg)
- **Forslag:** la Driftsplan (og andre skjemasider) åpne i 85–90 % høyde i stående format, eller la skuffen kunne dras opp.

**U2 – Grunnen for låst døgndrift er misvisende på en båt som aldri kan gå døgndrift.**
- **Hva, målt:** på en snekke (plass til 2 i mannskapet, ingen køyer, ikke styrhus) står det «Krever fire om bord, deg medregnet (dere er 3)». Spilleren tror han kan ansette en til. Men båten har verken plass til fire eller køyer. På breisjarken er grunnen god: «Krever køyer til alle om bord (4 av 5)».
- **Hvor:** `ui/05d-plan2.js:161`. Antallet sjekkes før båtens egne grenser.
- **Formater:** alle.
- **Bilder:** [s13-uten-koyer-rytme.jpg](03-gui/s13-uten-koyer-rytme.jpg), [s12-faa-koyer-laast.jpg](03-gui/s12-faa-koyer-laast.jpg)
- **Forslag:** sjekk båten først: «Båten har ingen køyer» eller «Båten har plass til bare 3 om bord». Si deretter hva som mangler, og hva som løser det («ansett én til», «kjøp en båt med køyer»).

**U3 – En rad med feil farger hele innholdet rødt.**
- **Hva, sett:** når Plasser mangler et felt, blir hele den åpne raden rød og mindre, også juksplassen som er riktig. Verdien «1 juksplass» er rød uten å si hva som mangler.
- **Hvor:** den globale `.bad` i `styles.css:494` (farge, 13 px, marg) treffer `.dr-row.bad` (`ui/05d-plan2.js:17`).
- **Formater:** alle.
- **Bilde:** [s03-line-forslag.jpg](03-gui/s03-line-forslag.jpg)
- **Forslag:** egen klasse (`dr-bad`) som bare farger `.dr-rv`, og verdien sier det som mangler («1 juksplass · mangler felt»).

**U4 – Etter Pause fortsetter båten turen, men «Nå» forsvinner.**
- **Hva, målt:** etter Pause er båten fortsatt «fishing» på planens tur. Siden viser ikke lenger «Nå». «I dag» står med pila på «Jukser på juksplass 1 … ←», som om planen gikk. Det samme gjelder en stoppet plan («I dag» med «← Går fra Husa»).
- **Hvor:** `ui/05d-plan2.js:263` (Pause avbryter ikke turen), `:187` («Nå» bare når planen er på eller stoppet) og `:47` (`preview` ser ikke på `o.on`).
- **Formater:** alle.
- **Bilder:** [s17b-hent-pause.jpg](03-gui/s17b-hent-pause.jpg), [s17-i-drift-stoppet.jpg](03-gui/s17-i-drift-stoppet.jpg)
- **Forslag:** vis «Nå» også på pause («På pause: fullfører turen og går hjem» eller «ligger stille»), og vis «Neste dag når planen startes igjen» i stedet for «I dag ←» når planen er av. Om Pause skal stoppe båten, må det avgjøres (spørsmål til Jonas).

**U5 – «Nå» og «I dag» viser ulike sluttider for juksinga.**
- **Hva, målt:** i S11 sier «Nå» «Jukser til kl. 17:46» og «I dag» «til kl. 16:05 (23,9 t)». I S17 var forskjellen 2–5 min.
- **Hvor:** `nowOf` bruker `b.fishUntil` (`ui/05d-plan2.js:36`), dagen bruker planens tid.
- **Formater:** alle.
- **Bilde:** [s11-dogndrift-kveld.jpg](03-gui/s11-dogndrift-kveld.jpg)
- **Forslag:** vis motorens tid begge steder når steget er i gang, eller marker dagens tider som plan.

**U6 – Kortet i kartet dekker plotterens knapper på telefon.**
- **Hva, målt og sett:** i 384×853 ligger kortet (full bredde nederst) over Autonav, Søk og Vis båten. De skinner gjennom det halvgjennomsiktige kortet. Kortet dekker også nåler nederst i kartet (4 tilstander). Den valgte nåla dekkes aldri.
- **Hvor:** `styles.css:1362` og `:1365`.
- **Formater:** 384×853.
- **Bilde:** [s04-kart-kort-felt.jpg](03-gui/s04-kart-kort-felt.jpg)
- **Forslag:** skjul `#rAuto`, `#zsearch` og `#zboat` i planmodus (`body.pm`), eller løft dem over kortet. Kartet kan også flytte utsnittet så nåler ikke havner under kortet.

**U7 – Trykkflater under 44 px.**
- **Hva, målt:** 49 ulike, de samme i alle formater.
  - På siden: −/+ for antall, ståtid, avgang, døgn, levering, vind og sjø (38×36); ↑/↓ (38×36); Fjern (53–58×36); linetypen (82×36); Vær-forhåndsvalgene (29 px høye); kopier-knappen (29 px høy); båtvelgeren (36 px høy).
  - I kartet: kortets −/+, ↶/↷, «fri» og ↑/↓ (36×36); Fjern (50×36); «⇄» (98×36); Felt/Juksplass (36 px høye); Ferdig (40 px høy). Kortets lukk «×» er 21×22.
- **Hvor:** `styles.css:1185`, `:1206`, `:1361`, `:1363`, `:1364`.
- **Formater:** alle.
- **Bilder:** [s03-line-plasser.jpg](03-gui/s03-line-plasser.jpg), [s04-kart-kort-felt.jpg](03-gui/s04-kart-kort-felt.jpg)
- **Forslag:** minst 44×44 (handlingsknapper 56 px) etter `docs/planer/ui-redesign.md:98`. Kortets × som en egen 44 px-knapp. Mer luft mellom «+» for stamper og «−» for ståtid, som står tett i 800-bredden.

**U8 – «Start planen» ser ut som en nøytral knapp, og «Slett driftsplanen» er den tyngste på siden.**
- **Hva, sett:** Start er lys grå (`#e3eaee`), mens Slett er mørk og fylt nederst. Den farligste handlingen får mest vekt, og den viktigste ser nesten låst ut. «Lag driftsplan» og «Velg i kartet …» er magenta, en tredje stil.
- **Hvor:** `styles.css:1214` (`.dr-onoff`), `ui/05d-plan2.js:243`.
- **Formater:** alle.
- **Bilder:** [s01-dagdrift-ny-plan.jpg](03-gui/s01-dagdrift-ny-plan.jpg), [s01-dagdrift-bunn.jpg](03-gui/s01-dagdrift-bunn.jpg)
- **Forslag:** Start grønn og fylt (som «På»), Slett som en rød kantknapp. Én farge for «gå videre» på hele siden.

**U9 – Planen kan startes uten blåsesett.**
- **Hva, målt:** uten blåsesett er det bare en advarsel. Start virker, og først på feltet står «Kunne ikke sette eller trekke: Du trenger et blåsesett …». Båten jukser videre, og lina blir liggende om bord.
- **Hvor:** `core/06g-plan2.js:253` (en advarsel, ikke en feil).
- **Formater:** alle.
- **Bilde:** [s07-uten-haler-uten-blaasesett-etter.jpg](03-gui/s07-uten-haler-uten-blaasesett-etter.jpg)
- **Forslag:** gjør «ingen blåsesett» til en feil når et felt ikke får noe sett, med en knapp til butikken. Færre sett enn felt kan fortsatt være en advarsel.

**U10 – Mannskap-siden: skipperens kort tilbyr «Gjør til styrmann».**
- **Hva, målt:** når Ole er utnevnt til skipper, har kortet hans fortsatt «Gjør til styrmann». Et trykk der flytter ham, og planen blir «Ikke klar ennå» igjen uten at spilleren skjønner hvorfor.
- **Hvor:** `ui/05b-work.js:62`.
- **Formater:** alle.
- **Bilde:** ingen.
- **Forslag:** vis bare «Gjør til styrmann» på den som ikke er skipper, eller si i toasten at skipperrollen da går bort.

**U11 – En sen avgang kan gi dagdrift langt inn i natta.**
- **Hva, målt:** en sen avgang kan gi dagdrift til langt på natt. I S20 var planen «Dagdrift, ut kl. 05:00». Klokka 12:46 viste siden «Next day · out at 12:46 … Home to Husa 01:59». En avgang inntil 8 t etter avgangstida regnes som samme dag.
- **Hvor:** `core/06g-plan2.js:91` (`DRP2.late`).
- **Formater:** alle.
- **Bilde:** ingen.
- **Forslag:** på dagdrift: kutt dagen ved en fast kveldstid, eller vent til i morgen når dagen ellers ender etter midnatt. Spørsmål til Jonas, siden «Skipper går alltid dagvakt».

**U12 – «Mer» kan lukke seg igjen.**
- **Hva, målt:** en lang forklaring som er åpnet med «Mer», lukket seg igjen da siden tegnet seg på nytt med nytt innhold. Det skjedde i to av fire kjøringer; i de to andre endret ikke innholdet seg mens testen ventet. Den åpne raden (`open`) blir stående; det gjør ikke «Mer».
- **Hvor:** `ui/10c-dock.js:327` (`fold()` etter at `innerHTML` er byttet).
- **Formater:** alle.
- **Bilde:** ingen.
- **Forslag:** husk åpne «Mer» per side (som raden), og sett `open` igjen etter `fold()`.

**U13 – Grunnene under «Ikke klar ennå» er tekst, ikke veier.**
- **Hva, målt:** «Når du ikke er om bord, må både en skipper og en styrmann være utnevnt. Gjør det på Mannskap-siden.» står rødt øverst, men er ikke en knapp. Mannskap-raden som løser det, står nederst. Med F1 tok det 7 trykk og 2 sveip fra «Ikke klar ennå» til en plan som går.
- **Hvor:** `ui/05d-plan2.js:193`.
- **Formater:** alle.
- **Bilde:** [s02-ikke-klar-ikke-klar.jpg](03-gui/s02-ikke-klar-ikke-klar.jpg)
- **Forslag:** gjør hver grunn til en knapp som åpner raden eller siden som løser den, slik «Endre plassene» gjør for en stoppet plan.

**U14 – Hjem-lista er lite til hjelp.**
- **Hva, sett:** på en båt med køyer står «Mannskapet sover godt her» på alle åtte valgene. Et verft står som mulig hjem («Fjordgard verft (verft)»). Spillerens eget naust står sist (19,5 nm unna). Valget av hjem bestemmer egnebua, hvilen og veien hver dag, men lista sier lite om det.
- **Hvor:** `ui/05d-plan2.js:67–81`.
- **Formater:** alle.
- **Bilde:** [s16-hjem-liste.jpg](03-gui/s16-hjem-liste.jpg)
- **Forslag:** sorter naustet og nærmeste rorbu først. Si det som skiller valgene (egnebu, køyer, avstand til plassene). Vurder å ta verft ut av lista.

### Pynt

**P1 – Planlista ligger over ECDIS-linja, som skinner gjennom.**
- **Hva, sett:** øverst i planmodus ligger planlista oppå plotterens ECDIS-linje (HDG/SOG/POS, tidevannet). Lista er 94 % tett, så teksten under skinner svakt gjennom.
- **Hvor:** `styles.css:1359`.
- **Formater:** alle.
- **Bilde:** [s04-kart-kart.jpg](03-gui/s04-kart-kart.jpg)
- **Forslag:** skjul `#ecdisTop` i `body.pm`, eller gjør lista helt tett.

**P2 – Nålenes navn kolliderer med fangstmerkene og stedsnavnene.**
- **Hva, sett:** «Felt 1» står oppå «3,2 kg/stamp · 10 t», «Juksplass 1» oppå «52 kg/t», «Hjem» oppå «Rorbu Husa».
- **Hvor:** `ui/03g-planmap.js:103`.
- **Formater:** alle.
- **Bilde:** [s04-kart-kort-felt.jpg](03-gui/s04-kart-kort-felt.jpg)
- **Forslag:** skjul fangstmerkets etikett når en nål står på merket, eller legg nålens navn på motsatt side.

**P3 – Kortet gjentar linetypen.**
- **Hva, sett:** kortet har «Line: Hyseline ⇄», og på neste rad «Hyseline − 4 stamper av 4 +».
- **Hvor:** `ui/03g-planmap.js:52–53`.
- **Formater:** alle.
- **Bilde:** [s04-kart-kort-felt.jpg](03-gui/s04-kart-kort-felt.jpg)
- **Forslag:** kall den andre raden «Stamper».

**P4 – Ordene i dagen.**
- **Hva, sett:**
  - Gjentatte ord: «Dagen: dagen er 14 t.» og «Dagen: døgndrift: to vakter à 12 t.».
  - Tider etter midnatt uten «i morgen»: «Jukser … til kl. 16:05 (23,9 t)».
- **Hvor:** `core/06g-plan2.js:113`, `:213` og `:238`.
- **Formater:** alle.
- **Bilder:** [s17-i-drift-naa-idag.jpg](03-gui/s17-i-drift-naa-idag.jpg), [s11-dogndrift-kveld.jpg](03-gui/s11-dogndrift-kveld.jpg)
- **Forslag:** «Dagen er 14 t.» uten prefiks, og «i morgen kl.» på tider etter midnatt.

**P5 – Toasten ligger over innholdet i stående format.**
- **Hva, sett:** toasten (for eksempel «Driftsplanen er på.», «Det er land der.» eller «Du må hvile til kl. …») ligger midt over skuffens innhold i stående format, i 2–3 s. Målt i 14 tilstander i 800×1280. Etter Start står «Lager planen …» opptil 0,7 s etter at planen er på, til skuffen tegner seg på nytt.
- **Hvor:** `styles.css:541`, `ui/05d-plan2.js:250`.
- **Formater:** 800×1280 og 384×853.
- **Bilde:** [s04-kart-land-avvist.jpg](03-gui/s04-kart-land-avvist.jpg)
- **Forslag:** legg toasten over skuffen (eller i skuffens hode) når skuffen er åpen, og tegn skuffen med en gang etter Start (`DOCK.redraw()` i `rerender`).

**P6 – Ord og brytning i den engelske utgaven.**
- **Hva, sett:**
  - Feilen sier «longline», radene «Line».
  - «field 1: …» begynner med liten bokstav.
  - På kortet brytes «The string 2.3 km» og «by the course» over to linjer.
- **Hvor:** `ui/03g-planmap.js:55`, `core/06g-plan2.js:187` og `:248`.
- **Formater:** alle.
- **Bilde:** [s20-engelsk-kort.jpg](03-gui/s20-engelsk-kort.jpg)
- **Forslag:** ett ord for line på engelsk, stor forbokstav, og kortere tekster eller et bredere kort.

**P7 – Slett bruker nettleserens dialog.**
- **Hva, målt:** Slett beskyttes av `confirm()`: avbryt beholder planen, ja sletter den. Dialogen har nettleserens utseende, ikke spillets.
- **Hvor:** `ui/05d-plan2.js:292`.
- **Formater:** alle.
- **Bilde:** ingen (dialogen kommer ikke med på skjermbildet).
- **Forslag:** spillets egen bekreftelse, med planens navn og hva som skjer med redskapet i sjøen.

## 4. Målingene

### Trykk og tid til en plan som går

Tallene er trykk og sveip. Tida er testens egen (med 0,36 s per trykk og rundt 0,6 s per sveip), målt i rundene uten skjermbilder. Selve lagingen av planen etter Start tok rundt ett sekund.

| Vei | 800×1280 | 1280×800 | 384×853 |
|---|---|---|---|
| Dagdrift, fra lukket telefon | 4 trykk, 1 sveip | 4 trykk, 0 sveip, 2,9 s | 4 trykk, 0 sveip, 3,0 s |
| Dagdrift, fra «Lag driftsplan» | 2 trykk, 0 sveip | 2 trykk, 0 sveip, 1,6 s | 2 trykk, 0 sveip, 1,8 s |
| Døgndrift, fra lukket telefon | 6 trykk, 4 sveip | 6 trykk, 2 sveip, 6,2 s | 6 trykk, 5 sveip, 9,3 s |
| Døgndrift, fra «Lag driftsplan» | 4 trykk, 4 sveip | 4 trykk, 2 sveip, 5,0 s | 4 trykk, 5 sveip, 8,1 s |
| «Ikke klar ennå» → går (S02, med omveien i F1) | 7 trykk, 2 sveip | – | – |
| Kartet (S04: åpne, sju endringer, Ferdig) | 14 trykk, 0 sveip | – | – |
| Hele siden med planen på, toppen → bunnen | 2 sveip (1 303 px, 644 synlige) | – | – |

Anslag for en spiller med 1,5 s per trykk og 1 s per sveip: rundt 3 s fra «Lag driftsplan» til dagdrift, og 8–11 s til døgndrift. Telefonen i 800×1280 krever ett sveip i appgrida for å nå Driftsplan; i 384×853 fyller telefonen skjermen, og appen er synlig med en gang.

### Overflyt, overlapp og trykkflater per format

| Måling (antall tilstander) | 800×1280 | 1280×800 | 384×853 |
|---|---|---|---|
| Tilstander målt | 50 | 50 | 50 |
| Sideveis overflyt, siden eller panelene | 0 | 0 | 0 |
| Kuttet tekst | 0 | 0 | 0 |
| Knapper utenfor skjermen | 0 | 0 | 0 |
| Planlista × kortet | 0 | 0 | 0 |
| Kortet × den valgte nåla | 0 | 0 | 0 |
| Kortet × plotterens knapper (Autonav, Søk, Vis båten) | 0 | 0 | 5 (U6) |
| Kortet × andre nåler | 0 | 0 | 4 (U6) |
| Planlista × ECDIS-linja | 6 | 6 | 6 (P1) |
| Skuffen × fangstlista | 10 | 8 | 7 (F3) |
| Skuffen × dokka | 0 | 0 | 7 (F4) |
| Skuffen × toasten (forbigående) | 14 | 2 | 10 (P5) |
| Ulike trykkflater under 44 px | 49 | 49 | 49 (U7) |
| Sidefeil (`pageerror`, `console.error`) | 0 | 0 | 0 |

Hver kjøring gir én `console.error` fra skyen («401 Unauthorized»), fordi testen ikke er logget inn. Testen holder den utenfor.

## 5. Det som ikke kunne testes, og hvorfor

- **Havneplass som hjem:** `havnOptions` gir ingen havneplasser rundt Senja i testbygget (prøvd fra 31 havner innenfor 90 km av Husøy). Havneplassene krever hele kysten (`tools/map/out/game`), som ikke finnes i miljøet.
- **Steder utenfor Senja:** bare Senja-kartet finnes. Stikkprøver langs kysten må tas i appen eller i et miljø med hele kysten.
- **Et ekte Android-nettbrett:** berøringen er Chromiums (CDP), med de samme hendelsene som Android gir. Momentum i sveip, lange trykk, tilbakeknappen, skjermtastaturet og ekte fingerbredde er ikke prøvd. Sveipene er gjort sakte, så de ikke fikk fart.
- **3D-bildet bak skuffen:** testen kjører uten 3D (`KYST_LITE`), så bakgrunnen er svart. Hvordan skuffen ser ut over sjøen i 3D, er ikke sett.
- **Dialogen ved Slett:** nettleserens `confirm()` kommer ikke med på skjermbildet. Testen svarte på den.
- **Lukket spill og push:** at planen går videre mens spillet er lukket (`catchUp`), og varslene, er motorens og pushens tester (`driftsplan2test.py`, `fleet3test.py`), ikke denne.
- **Garn, teiner og flerdøgnstur over tid:** de er startet, men ikke spilt i døgn. Bare line + juks (26 t) og døgndrift (16 t) er spilt.
- **Kvote, stengt felt og været:** en stoppet plan og en venting er laget i JS, ikke av et ekte stengt felt eller ekte vær.
- **Merknad om testtilstanden:** `driftsplan2ui.py` setter `S.me = 'nobody'` for «deg i land». Med det kaster Rederi-siden «Cannot read properties of null (reading 'id')». Dette er ikke en feil i spillet, fordi `S.me` alltid er en båt der. Den nye testen bruker en annen båt i flåten i stedet.
- **Hva testen hindret av seg selv:** mellom scenariene måtte tank, is og kaiarbeid nullstilles (`b.after`, `b.fueling`). Ellers ble neste båt stående i «Gjør båten klar: is, drivstoff og agn» i timevis. I spillet skjer ikke dette, fordi tilstanden der ikke byttes midt i et skifte.

## 6. Filene

- `tests/driftsplan2gui.py`: testen. Den kjøres med `python3 tests/driftsplan2gui.py` (LITE settes selv) på rundt 7,5 minutter; `KYST_GUI_ONLY=S03,S04` kjører bare de scenariene. Den er ikke lagt i `run.py`.
- `tests/out/driftsplan2gui/`: alle skjermbildene (`<scenario>-<tilstand>-<format>.png`) og `maalinger.json` med målingene, tellingene, notatene og tekstene per tilstand.
- `docs/planer/driftsplan-2/03-gui/`: de 27 bildene som er lenket her, med de tre formatene side om side.
