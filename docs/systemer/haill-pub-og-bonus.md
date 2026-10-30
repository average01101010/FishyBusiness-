# Haill, puben, Skippertak og innloggingsbonusen

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.40 Skippertak og Kaiboden (12.10.2026)

Jonas: energi som ny inntektskilde, «en fiktiv energidrikk som heter "Skippertak"», «Skippertak Light = 1 spilldøgn, 29kr, Skippertak = 2 spilldøgn, 39kr, Skippertak Max = 4 spilldøgn, 49kr», «Hele flåten», «Det skal ikke kunne kjøpes noe skippertak med vanlig spillvaluta», en felles app «Kaiboden» for haill, trim og Skippertak, og «Mest for pengene» på den dyreste av hver.

- **Kjernen** (`SKIP`, `skipOn`, `skipLeft`, `giveSkip` i `core/15-energy.js`): `S.skip = {k, t0, until}`, felles for spilleren (ikke i `VKEYS`). Mens den virker, holdes energien din på 100 %, du sovner ikke (sover du, våkner du), mannskapets slitasje på alle båtene i flåten er 0 (`04-crew.js`), og driftsplanens hviløkter hoppes over (`06d-drift.js`, også ventetida etter hvilen i planmakerens planer). Økter med fast klokkeslett går fortsatt på klokkeslettet. En ny legges til tida som er igjen. Tida er spillets ene klokke og går også når spillet er lukket (Jonas: klokka kan ikke stoppes for noen). Når den går ut, står det i loggen, og alle er uthvilt; energien faller så som vanlig.
- **Varslene** (`ui/10g-push.js`): «sliten»-varslene for deg og mannskapet regnes fra når Skippertak går ut.
- **Kjøpet**: produktene `skip_light`, `skip`, `skip_max` (`supabase/migrations/20261012120000_skippertak.sql`, `data.give = 'skip'`), levert av `shopGive` i `ui/10i-shop.js` som haill og trim. Bare ekte penger; gjester får registreringsspørsmålet som før.
- **Kaiboden** (`ui/05-phone.js`): én app i rutenettet der Haill sto. Inne i den er Haill, Trim og Skippertak faner (`KBT`, `kbTabs`); sidene er de gamle, så `PHONE.open('haill')` og veiledningens pekere (`phoneApp` i `07b-first-trip.js`) virker som før. Appen åpner på fanen som ble brukt sist. «Mest for pengene» (`kbBest`) står på luksushaill, økt turbotrykk og Skippertak Max.
- **Regelen** i `docs/engasjement.md` («Det vi ikke gjør») er skrevet om: energi selges bare som avløsning av simuleringens egen trøtthet, og modellen gjøres aldri tyngre for å selge.
- **Test:** `tests/skiptest.py` (energitallene låst, giveSkip for hele flåten, energi og slitasje holdt, hviløkt hoppet over, forlengelse, utløp, «Mest for pengene» sant for alle tre, Kaiboden med faner, kjøp i testmodus, skjermbilder stående og liggende).

## 5.9 Innloggingsbonus (`STREAK`, `S.streak`, fra 01.10.2026)

- Erstatter «Kaffe på kaia», som ble fjernet etter spilltest 1 fordi den ble opplevd som lotteri.
- Hver ny kalenderdag du åpner spillet, gir +1 % på prisen for fisken du leverer. Det er ikke noe tak. Hver dag du ikke kommer innom, trekker 3 %, og bonusen går aldri under 0. Tid tilbake i klokka gir ingenting.
- Regnes i `streakTouch()` (`core/03-simulation.js`) ved oppstart, når appen blir synlig igjen, og hvert minutt. Dagene er lokale kalenderdager (`dayKey`, `dayNum`).
- Bonusen gjelder fisken, ikke tillegg for bestillinger, lever eller rogn. Den står som egen linje på sluttseddelen, og mannskapets lott regnes av totalen med bonusen.
- Vises i HUD-en («Bonus +12 %») og på et kort i Salg-appen med hva i morgen gir og hva en tapt dag koster.
- **Migrering:** Eldre lagringer starter på 0 %. Ubrukte gratis pubrunder fra kaffen ble betalt ut med 1 000 kr hver. Lånte fiskekar og rengjort bunn er borte.
- **Å måle:** Uten tak dobler bonusen fiskeprisen etter 100 dager. Konstantene i `STREAK` gjør det enkelt å sette et tak senere.

## 5.10 Haill og pub

- **Haill selges kun for ekte penger.** Den er i testmodus nå, uten betaling. Kan også vinnes på puben.
- **Haill gjelder hele rederiet,** alle båter. Jonas' begrunnelse: det koster ekte penger.

**Ny haill fra 04.10.2026** (Jonas' liste, `HAILL` i `03-simulation.js`). To typer, og kveithaillen er borte. En gammel kveithaill blir vanlig haill.

| Type | Pris | Trinn (fiskelykke på alle arter og alt redskap) |
|---|---|---|
| Haill | 29 kr | fersk +100 % til 24 t, mellomhaill +50 % til 48 t, gammelhaill +25 % til 72 t, borte |
| Luksushaill | 59 kr | +200 % til 24 t, så fersk +100 % til 48 t, mellom +50 % til 72 t, gammel +25 % til 96 t, borte |

- **Trinnene er 24 spilltimer hver** (Jonas 05.10.2026: «All tidseffekt er oppgitt i spilltid»). 24 timer i spillet er 4 ekte timer. Før var de 48 timer.
- **Tekstene skal selge** (Jonas: «Formuler dette på en intuitiv måte som fremmer salg»): de starter med det spilleren får («Dobbel fiskelykke et helt døgn!», «Tredobbel fiskelykke det første døgnet!»), og så trinnene. De sier aldri «kjøp nå», fordi direkte kjøpsoppfordringer til barn er forbudt (markedsføringsloven og UCPD vedlegg I nr. 28).

- `luck(sp)` = 1 + `haillBoost()`. Trinnene står i `steps`. `haillStage()` gir navnet, og `haillLeft()` gir timene som er igjen.
- **Beholdning:** et kjøp eller en pubpremie legges i `S.haillInv` (`giveHaill`). «Aktiver» i Haill-appen tar en derfra (`useHaill`). Er det allerede haill om bord, må du bekrefte at den byttes ut. **Haill aktiveres aldri av seg selv.**
- +200 % er Jonas' valg («så kan vi eventuelt justere det ned om det blir for sterkt. Målet er jo at det skal være fristende å kjøpe»). Sammen med juksa ×2 gir luksushaillen seks ganger fangsten fra før 04.10. Det må måles i spilltest.
- Haillen vises i HUD («Luksushaill +200 %») og som pynt på gelenderet i 3D (gullhestesko eller liten fisk).
- **Pubrunden** (`PUBW`):
  - 1 000 kr i spillkroner, én gang per spillkveld mellom 15:00 og 03:00, bare i havn.
  - Lykkehjulet (fra 04.10.2026): haill 12 %, luksushaill 3 %, rykte 25 % og tomhendt 60 %. Premien legges i beholdningen. Oddsen vises.
  - Runden betales og lagres før hjulet snurrer, så premien overlever at appen lukkes (A4). Kvelden går fra 15:00 til 03:00 (A3).
- **Første gang er luksushaill gratis** i veiledningen «Første tur», og Haill-appen forklarer da hva haill ellers koster. Steget ber deg også trykke «Aktiver».

## 5.41 Puben i 3D (Jonas 08.10.2026)

Jonas: «Spilleren trykker på pub og blir dermed sendt inn i puben hvor man sitter ved bardisken i first-person-view. Man skal kunne spinne hjulet som tidligere.» Og: «Kanskje noe som blir et sosialt element.»

- **Modellen** (`tools/harbour/pub.py`, `src/data/pub.b64`, `<script id="glb-pub">`): ett rom, likt i alle bygder.
  - Innhold: plankegulv, mørkt brystpanel og grønngrå bord over, bjelketak, bardisk med fotlist, tappetårn og bakbar med flasker og speil.
  - Folk: bartenderen og to faste gjester ved disken (figurene fra `arbeider.py`, sittende), tre ledige fiskere ved det runde bordet og to som spiller kort.
  - Ellers: steinpeis med flammer, quiztavle, oppslagstavle, fiskarlagets langbord med vimpel, vinduer mot havna i skumring, glasskuler, livbøye og bilder.
  - Lyset er bakt inn i hjørnefargene med Cycles (taklamper over disken, vegglamper, peisen, skumringen gjennom glasset). Store flater er delt opp så lyset får nok punkter.
  - Bakingen gjøres per hjørne, og hvert hjørne får egen støy. Derfor slås hjørner på samme sted med samme retning sammen og glattes litt mot naboene (`smooth_bake`). Hvert materiale har et lite minstelys, så hjørner inne i andre deler (en hals i kragen) ikke blir svarte.
  - Skumringen utenfor dempes etter bakingen (`dim_sky`). Tonen er en myk skulder med eksponering etter 90-prosentilen.
  - Bakingen lagres i `tools/harbour/out/pub_baked.blend`, så `python3 tools/harbour/pub.py retone fast` kan justere tone og glatting uten å bake på nytt (rundt 15 minutter).
  - En egen baking holder peisens andel av lyset (`_PAINT[1]`), så spillet kan la den flakke. Flammene er sone 4 og vaier i skyggeleggeren.
  - Hjulet er en egen del (`wheel`) med feltene fra `WHEEL` i skriptet, som må være like `PUB_WHEEL` (`pubtest.py` sjekker det).
  - Navnebrettet over bakbaren (`anchors.sign`) får stedets navn fra spillet.
  - Trykkpunktene står i `anchors.spots` (navn, midtpunkt og radius).
- **Scenen** (`ui/09b-pub.js`, `PUB3`):
  - Et eget lite WebGL-lerret over spillet. GLB-en går rett inn i GPU-en med 16-bits posisjoner, fargebytes og indekser.
  - Verdens 3D holder bildene sine så lenge puben er åpen (`G3.hold`).
  - Man ser rundt med fingeren. Et kort trykk treffer det nærmeste trykkpunktet langs strålen, og merkelappene over tingene kan også trykkes.
  - Uten WebGL, uten modell eller med `#no3d` (testene uten 3D) åpner det gamle 2D-hjulet (`PUBW`).
  - Puben stenger kl. 03 og når båten går. Vifta i Bygd viser Pub når den er åpen, også etter kveldens runde.
- **Hjulet:** samme trekning som før (`PUBW.draw`: betalt, trukket og lagret før hjulet går, én runde per kveld, bare spillpenger). Hjulet roteres til et tilfeldig punkt i feltet trekningen valgte, med fem hele runder og myk stopp.
- **Bartenderen:**
  - Kveldens prat på stedets dialekt (`dialectText`): hvem som betaler best for en art innen 45 km i dag, og sesongpraten.
  - **Runde på mannskapet:** 120 kr per mann om bord, én gang per kveld (`S.crewRoundE`). Gir +8 i trivsel (+12 for den ølglade), og trivselen glir tilbake mot målet som vanlig.
- **Oppslagstavla:** Kystposten, ukas tre beste (`worldTop`) og antall turoppdrag, med knapper til appene.
- **Kjentmannen ved disken** (tilbakemelding #58, Jonas 09.10.2026: «i puben 1 gang per spilldøgn»): for 2 500 kr spillpenger, én gang per spilldøgn (`S.kjent.d`), finner han den beste plassen innen 10 km fra havna for arten du spør om (torsk, sei, hyse, kveite), med et rutenett på 0,8 km over sjø mellom 8 og 400 m dyp (`kjentFind`, samme `density` som fisken kommer fra). Han sier hvor mye av de andre artene som står der (fire nivåer mot det beste i området). Plassen blir et merke i kartet (`S.pins`, `kjent:true`, `until` ved døgnets slutt). Ikke for ekte penger: det ville vært å selge seg forbi ferdigheten i å finne fisk.
- **Det runde bordet:** Mannskapsbørsen. Den ligger fortsatt også under Mannskap.
- **Det sosiale** (`ui/09c-pubsoc.js`, `PUBSOC`; `supabase/migrations/20261009120000_pub.sql`):
  - **I kveld:** de andre spillernes båter som ligger i havna (`peerStates`, under 2 km).
  - **Hilsener:** seks faste linjer, aldri fritekst (spillere fra 13 år). Serveren tar høyst 30 i timen og én til samme spiller hvert femte minutt. Gjester kan ikke sende. Hilsener til deg vises i puben og legges i Meldinger.
  - **Fiskarlaget, felles uke** (F1 i `docs/planer/oppdrag-2.md`, 31.10.2026; Jonas: «dette med fiskarlag må vi satse fullt ut på»): målet og summen telles nå på serveren (`lag_get(w, x, y)` i `supabase/migrations/20261030140000_lag_goal.sql`, samme regel: 1 500 kg per medlem som har levert), så alle ser det samme. Første kall som ser målet nådd, skriver det i `lag_hits` (havn, uke, kilo, båter) og legger saken i Kystposten én gang (type `lag`, uten navn: havna, kiloene og båtene; `pressStory` i `09h-press.js`), på havnas plass som spillet sender med (båtens plass til laget er kjent i økta). Spilleren får ordet fra laget én gang i uka (`lagHit`) og hendelsen `lag_goal_hit`. Sesong-appen har lagets kort øverst under sesongtavla (`PUBSOC.lagCard`: stolpen, tonn av tonn, båter som har levert, dine kilo, de åtte beste; uten medlemskap: «Bli med i puben»). **Bytte av lag venter til uka er over** (valg F-C): `lag_join(port, w)` svarer `wait` når laget ble byttet samme spilluke, og puben sier «Du kan bytte lag når uka er over»; å gå ut kan man når som helst. Premien 3 000 kr («Hent din del») er som før, i puben. Migreringen må kjøres i SQL Editor; til da teller spillet som før lokalt. Testen: `lagtest` (falsk database).
  - **Lagets oppslagstavle** (F2 i `docs/planer/oppdrag-2.md`, 31.10.2026; `supabase/migrations/20261030160000_lag_board.sql`, `lagBoardHtml`/`lagPost`/`lagMine` i `ui/09c-pubsoc.js`): under ukemålet i pubens lagpanel henger medlemmenes lapper, faste linjer og aldri fri tekst (`LAG_LINES`: «Jeg går ut i morgen tidlig», «{Sp}en står {place}», «Tynt med {sp} {place}», «Noen som vil dele garn?», «God pris på {sp} hos mottaket» …). Arten og stedet fylles fra båtens egen dag (`lagMine`: arten fra siste levering eller lasten, stedet fra siste fiskemerke som nærmeste mottak/havn og nautiske mil fra det), og serveren lagrer bare linjenummeret, artskoden, havnas id, milene og båtnavnet (`lag_post`), så ingenting fritt kommer gjennom. Høyst tre lapper per medlem per døgn (`wait` → «Tre lapper om dagen holder»), borte etter 48 timer, de 30 siste leses (`lag_board`, bare for lagets medlemmer). Sesong-appens lagkort viser de tre siste lappene. Hendelsen `lag_post` (linja). Merket «Fiskarlaget: uker med levering» (`ACHL` `lagw`: 1, 4, 12, 26, 52) teller spillukene der laget melder at du leverte som medlem (`lagWeek`, `S.pubSoc.lagWk`). Lagets flagg på båtene hører til Malerverkstedet. VHF-praten (A1) kan senere ta over for tavla. Migreringen må kjøres i SQL Editor; til da svarer serveren at tavla ikke finnes, og panelet sier «Fikk ikke tak i tavla nå». Tester: `lagtest` (lappene, art og sted, tre om dagen, merket, kortet; skjermbilder `lag-staaende.png`/`lag-liggende.png`), `pubtest` (panelet i puben i begge formater, `pub_lag_*.png`).
  - **Fiskarlaget:** ett lag per havn (id-en er havnas id, så ingen navn skrives). Målet for spilluka er 1 500 kg for hver medlem som har levert, minst 1 500 kg. Den som ikke har fisket, trekker ikke målet opp, slik regelen om at sosialt skal være additivt krever. Når målet er nådd, henter hver sin del (3 000 kr, `S.pubSoc.lagW`). Tallene kommer fra landingene som deles for topplista.
  - **Ukas quiz:** fem spørsmål fra en bank på 30, de samme for alle i spilluka. Gir 400 kr per riktig svar, én gang per uke. Fullt hus teller i det lange merket «Quizmester på puben».
- **Merker:** de lange merkene `quiz` og `lag` (`09f-merker.js`).
- **Senere:** dart eller armbryting ved kortbordet.
- **Test:** `tests/pubtest.py` (3D).
- **Svakheter:**
  - Lyset er bakt for kveld. Vinduene viser skumring også midt på sommeren.
  - Folkene står stille.
  - Migrasjonen (`20261009120000_pub.sql`) ble kjørt av Jonas i Supabase sin SQL Editor 09.10.2026. Tabellene har RLS uten policy, og funksjonene kan bare kalles av innloggede (ikke anon).
  - Disken har sprekker mellom bordene foran som slipper litt lys gjennom når man ser ned.
  - Modellen gjør siden 2,8 MB større (base64 3,7 MB).
