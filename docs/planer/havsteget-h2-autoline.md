# Havsteget H2: autolineren (plan, 05.11.2026)

Jonas 05.11.2026: «Start neste steg, H2 i en ny økt». Valget av båt er V1 A i `havsteget.md` (03.11.2026: «Ja, du kan gjerne lage autolineren først»), og V2 B og V3 A gjelder: «Prisene må reflektere det virkelige liv, og tillatelsene må også være realitiske. Husk: vi lager en simulering av fiskerinæringen i norge». V6 A gjelder også her: fisket går automatisk med valg, og hånda på rattet når man vil.

Planen bygger på H0 (mottakene og prisene for sjøfryst fisk), H1 (tillatelsen `konv` med kvotefaktorer, 5.5b i `kvoter-og-regler.md`) og H1b (rammen, sonene i 5.28b, å ligge bi i 4.12j i `autonav.md`).

## 1. Hva som finnes i dag

**Båten** (`core/02-species-gear.js` `VESSELS.autoliner`): 45,4 m, last 400 t i frys (`hold:{kind:'frys'}`), 14 om bord (`crew.key` seks nøkkelfolk, lagene dekk 4 og fabrikk 4, `rot:2`), `autoHooks:40000`, sløyemaskin 2 500 kg i timen, `rigs:['line']`, `gearMax.stamp:0`, `land:'tub'`, `lock:true`. Prisen er skroget (70 M) pluss tillatelsen til selgerens verdi (`havPrice`, om lag 155 MNOK for en snitt-tillatelse). Kjøpet (`ui/phone/14-act.js` `buy`) sjekker alt `havLicWhy` (blad B, en tillatelse igjen i registeret) og tar tillatelsen (`havLicTake`); bare `lock` stopper det.

**Lina** (`core/10-gear.js`): kystlina i stamper (hyse 600 krok, bank 300), egnet i land eller om bord for hånd (`egnSelf`, 560 krok i timen), satt og trukket som ett sett `S.sets` mellom to blåser (`startSet`, `startHaul`, `gearOpMinute`), fangsten per time i sjøen (`soakHour`: `30 · q · krok/100 · SELQ · tetthet · agn · ståtid`). `autoHooks` leses bare av databladet (`ui/phone/10-fartoy.js:88`).

**Frysing:** `holdFreezes()` (`05-vessels.js:1043`) gjør at fisken som ises, fryses i stedet; arbeidet gjøres av dekkslaget (`workTeam('sloy')`, `workTeam('is')`) med sløyemaskinen. Fryst fisk råtner ikke (`keepK`) og selges til sedlenes pris for sjøfryst (`marketPrice(sp, H, fz)`, `pmF`). Ingen omregning fra rund vekt til produktvekt.

**Landingen** (`07-harbours.js` `landPlan`): kar på 300 kg, ett kranløft (2,5 min) per kar. 400 t blir 1 334 løft og over 55 timer (BACKLOG 10.1).

**Kvotene:** `access()` (`03-simulation.js:29`) gir `'lukket'` for hele rederiet når det har en kysthjemmel, `'open'` eller `'none'`. Havtillatelsen gir fartøykvoten `havQ` (118 t torsk og 107 t hyse per faktor, sei ingen), men landingene går ennå mot rederiets kystkvote.

**Reglene:** J-161-2026 § 32 tredje ledd (28 m og over ikke innenfor 4 nm, `03e-rules.js:265`), sonene utenfor kysten (5.28b), Kystvakta om bord for kystredskap (`09j-kystvakt.js`). Høstingsforskriften § 26 (line med maskinell egning) finnes ikke.

**Lotten:** § 6 havfiske (autoline, garn og snurrevad over 28 m) etter lengde står i `OPPG.hav` (`04-crew.js:89`) og velges for line over 28 m (`fisheryOf`).

**Driftsplan 2** (`core/06g-plan2.js`, `06h-plan2-engine.js`): line i stamper med ståtid 4–30 t og faste arbeidstider per stamp; går til kai i uvær, også med havfartøy (BACKLOG 10.2), og har ingen arbeidsgrenser for havfartøy.

**NPC-autolinerne** (`05d-hav.js`) setter og drar line på feltene og i 3D; spillerens båt har ingen slik visning.

**Tallene å kalibrere mot** (`src/data/fiske.json`, sedlene 2024–2025, line og lengdegruppe 28+, alle felt): om lag **40 000 t i året** (torsk 14 500, hyse 8 200, brosme 8 200, lange 6 300, blåkveite 2 000, resten under 400), jevnt over året (2 000–4 300 t i måneden). Registeret har **21 aktive** autolinere over 28 m, så om lag **1 900 t rund vekt per båt i året**, rundt 160 t i måneden. Med 40 000 krok i døgnet og 300 fiskedøgn blir det om lag **160 kg per 1 000 krok** i snitt.

## 2. Regelverket

Lest 05.11.2026 (kilde og hva som ikke ble lest, står ved hvert punkt):

**Hvor autolineren kan sette** (høstingsforskriften FOR-2021-12-23-3910, lest på Lovdata):

- **§ 26**: «Det er forbudt for fartøy over 21,35 meter som fisker med liner og som har maskinelt egningsutstyr om bord, å sette line innenfor 4 nautiske mil fra grunnlinjene langs norskekysten fra grensen mot Sverige til grensen mot Russland.»
  - Innenfor **10 nm** 1.9–31.12 i to felt utenfor Finnmark og Troms, og 1.9–30.4 i ett felt utenfor Nordland. Feltene er gitt med koordinater; de legges inn i `rules.json` fra teksten.
  - Gjelder ikke fløytline etter hyse. Uendret siden 1.3.2022.
  - Merk: grensen er **21,35 m**, ikke 28 m. Den rammer altså også en kystbåt med egnemaskin, men ingen kystbåt i spillet har egnemaskin.
- **§ 18 røkting**: bunnsatte liner for torsk, hyse og sei minst hver andre dag; liner for blåkveite, lange og brosme minst hver andre dag. Spillet har i dag 2 døgn for blåkveite og 4 døgn for kveite og breiflabb.
- **§ 26 feltene på 10 nm** (koordinatene, lest på Lovdata 05.11.2026): a) Finnmark/Troms 70° 41,16′ N 21° 30′ Ø – 70° 47,52′ N 21° 30′ Ø – langs 10 nm – 70° 36,32′ N 20° 00′ Ø – 70° 29,90′ N 20° 00′ Ø; b) Troms 70° 05,47′ N 18° 07,43′ Ø – 70° 08,98′ N 17° 52,98′ Ø – langs 10 nm – 69° 35,50′ N 16° 27,45′ Ø – 69° 29,99′ N 16° 34,76′ Ø (begge 1.9–31.12); c) Nordland 69° 20′ N 15° 44,71′ Ø – 69° 20′ N 15° 16,59′ Ø – langs 10 nm – 67° 30′ N 11° 25,33′ Ø – 67° 30′ N 11° 41,75′ Ø (1.9–30.4).
- **§ 66 merking:** «Redskap som står i sjøen skal ha minst ett vak (blåse, flyt eller dobbe) som er tydelig merket med fartøyets registreringsmerke.»
- **§ 68 merking utenfor grunnlinjene** (line og garn): bøyestang minst 2 m over vannet med radarreflektor eller flagg i hver ende; vestre ende to flagg over hverandre, østre ett; om natta gult lys (to i vest, ett i øst), synlig 2 nm, 20–25 blink i minuttet om det blinker; vak minst hver nautiske mil på faststående redskap. Det er dette blåsene og lyktene i 3D skal vise (H2d).

**Kvotene** (J-187-2026, gjeldende fra 26.10.2026, erstatter J-161-2026, lest på fiskeridir.no):

- **§ 32 tredje ledd**: «Det er forbudt for fartøy på eller over 28 meter største lengde å fiske torsk, hyse og sei med konvensjonelle redskap innenfor 4 nautiske mil av grunnlinjen nord for 62° N», med unntak for hyse og sei i område 06 og 07 og for område 00 i skreisesongen. Spillet viste til J-161-2026; henvisningene er J-187-2026 fra H2a (leddet er det samme, sjekket i teksten 05.11.2026).
- **§ 13**: 118 t torsk og 107 t hyse per kvotefaktor 1,0, som i spillet. Sei (272 t) bare med garnseitillatelse.
- **§ 5**: gruppa har 10 717 t torsk, 8 647 t hyse og 6 128 t sei, «hvorav 500 tonn sei avsettes til bifangst».
- **§ 14**: «Det er ikke adgang til å ha bifangst av torsk eller hyse ut over fartøykvotene», og sei som bifangst opptil 25 eller 50 %.
- §§ 33–39 er bare lest som sammendrag.

**Lange og brosme** (J-128-2026, gjeldende 3.8–31.12.2026):

- Fartøy på 28 m og over kan lande inntil 5 516 t brosme og 3 202 t lange (§ 3).
- **Direktefisket er stoppet** for 28 m og over: lange fra 22.1.2026 (§ 9), brosme fra 6.8.2026 (§ 6). Etterpå er bare bifangst lov: inntil **35 % lange** og **15 % brosme** i fangsten og ved landing.
- Det betyr at sedlene for 2024–2025 (der lange og brosme er 36 % av autolinernes fangst) ikke passer 2026.
- **Forslaget for 2027** (Fiskeridirektoratet, reguleringsmøtet 4.–5.11.2026, sak 15/2026, lest 05.11.2026): totalkvotene som 2026 (lange 6 906 t, brosme 8 748 t), fartøy på 28 m og over 46,36 % av langen (3 202 t) og 63,06 % av brosmen (5 516 t). For konvensjonelle havfiskefartøy og lukket kystgruppe: «inntil 35 % bifangst av lange i de enkelte fangster og ved landing» hele året (ikke noe direktefiske), og «fritt fiske etter brosme», som stoppes når gruppekvoten er tatt (2025: 11. september, 2026: 6. august; etter stoppen 15 % bifangst i 2026). 26 konvensjonelle havfiskefartøy og fire kystfartøy over 28 m har adgang (11.9.2026). Fiskebåt ville ha 49 % lange (innspill 25.10.2026).
- Blåkveitestoppen J-108-2026 gjelder bare under 28 m.

**Andre soner:** J-177-2026 (britisk sone): Nordsjøen inntil 5 000 t lange og 1 500 t brosme; 6.a og 5.b 250 t av hver bare med line, brosmen stoppet 8.10.2026. Dette står alt i spillet fra R4 (5.28b). EU-sonen er ikke funnet.

**Ikke lest:** den reviderte autolinetariffen (vedlegg på fiskarlaget.no, som ikke kan nås herfra). Spillet bruker § 6 i oppgjørsavtalen fra 1.1.2025, som stemmer med lønnsomhetsundersøkelsen (kap. 2b).

## 2b. Driftstallene (funnet 05.11.2026)

Jonas 05.11.2026: «Finn ut det du er usikker på». Det som er lest, med kilde; det som er regnet ut av kildene, er merket.

**Snittbåten** (Fiskeridirektoratet, lønnsomhetsundersøkelsen 2024, tabell G 14, konvensjonelle havfiskefartøy, 14 av 22 båter; arbeidsinnsats og drivstoff 2009–2024):
- 49,3 m, 17,9 år, 290 driftsdøgn og 277 døgn i sjøen.
- **30,1 mann per båt, 15,5 årsverk:** to mannskap som bytter, 15 om bord om gangen (spillets `crewMax:14`, `rot:2` stemmer).
- Inntekt 76,7 MNOK; arbeidsgodtgjørelse til mannskapet 27,8 MNOK (36 %), drivstoff 8,7 MNOK, agn, is, salt og emballasje 5,6 MNOK, proviant 1,05 MNOK, vedlikehold 7,4 MNOK, avgifter om lag 3,5 MNOK.
- **Drivstoff:** 23,8 mill. liter for 22 båter, **1,08 mill. liter per båt i året, om lag 3 700 liter per driftsdøgn, 0,40 liter per kg fisk.**
- Gruppa landet 60 107 t rund vekt i 2024 (2 730 t per båt; i dette er sei med garn 12 000 t), snittpris 29,71 kr/kg, torsk 47,06.
- Kontroll av lotten: inntekt minus drivstoff, agn og avgifter er om lag 59 MNOK; 48 % etter § 6-tabellen (14–15 mann, 44–49 m) er 28 MNOK. Det stemmer med 27,8 MNOK, så § 6 i spillet holder.

**Lina** (søk 05.11.2026):
- Havgående autolinere setter 30 000–50 000 krok i døgnet, turen er 6–7 uker (HI-rapport 2024-11, SNL «autoline»). Spillets 40 000 står.
- 1,2 m mellom krokene på bunnline, noen norske båter 1,4 m; setting i 6–10 knop, 3–4 krok i sekundet (National Fisherman om E-Line; Mustad-katalogen 2023). Draget: linehaleren tar 0–60 m line i minuttet (Mustad), altså høyst om lag 2 500–3 000 krok i timen ved 1,3 m (utregnet).
- Utregnet døgn: 40 000 krok setter seg på om lag 3–4 timer og dras på om lag 15–16; resten er gange mellom lenkene og ståtid. Det stemmer med «døgnet rundt i to vakter».

**Agnet** (Løkkeborg, HI-rapport 24-2013):
- «I dag bruker autolineflåten vanligvis en 50/50-blanding av akkar og saury», noen bruker sild etter lange. Akkar 14,5–17 kr/kg i 2012.
- 4–6 000 t akkar og saury importert i året (Måløy 2005–2012), nesten alt til autolineflåten, om lag 30 båter: **om lag 180 t agn per båt i året, rundt 17 g per krok** (utregnet). Spillet får akkar og saury som agn (`BAITS`); blekksprut finnes alt.

**Fangsten per krok** (utregnet): line 28+ i sedlene 2024–2025 er 40 000 t i året på 21 båter, om lag 1 900 t per båt. Med 277 døgn i sjøen og om lag 85 % av dem på feltet blir det rundt 9 mill. krok i året, altså **om lag 200 kg rund vekt per 1 000 krok** i snitt. Med V5 A (lange bare som bifangst) blir det noe mindre de delene av året brosmen er stoppet.

**Fryseriet:** en 44,5 m frysebåt fryser 10 t i døgnet med 250 t rom (SeaBoats), en 59 m 25 t med 500 t (Gandvik-1, Baird Maritime), en 64 m autoliner 11 t med platefrysere (Atlantic, Norwegian Frozen at Sea); platefrysere selges for 25–100 t i døgnet (Optimar). Spillets autoliner får **15 t produkt i døgnet** (om lag 7–8 t rund vekt fangst sløyd og fryst i døgnet trenger 5–6 t, så det er rom for gode døgn).

**Vektene (V2 A):** de offisielle omregningsfaktorene fra produktvekt til rund vekt, sløyd med hode / sløyd uten hode:
- Felles norsk-russiske for 2023 (fiskeridir.no, «Omregningsfaktorer», vedlegg I): torsk 1,18 / 1,50, hyse 1,14 / 1,40, blåkveite 1,12 / 1,32, snabeluer 1,08 / 1,50.
- Norske (vedlegg til J-128-2018): brosme 1,20 / 1,40, lange 1,20 / 1,40, sei 1,20 / 1,35 (nord for 62° N), kveite 1,10 / 1,35, uer 1,20 / 1,70 (1,65 i NEAFC-området).
- Gjeldende forskrift (FOR-2026-07-10-1545) viser til Fiskeridirektoratets tabell, som ligger i Tableau og ikke kan leses herfra; tallene over er de siste som kunne leses.
- Spillet har alt `uh` per art (rund vekt per kg sløyd uten hode): torsk 1,5, hyse 1,4 og sei 1,35 stemmer; uer (1,0), kveite (1,13) og blåkveite (1,3) rettes etter tabellene.
- Fryste kartonger tar om lag 1,7 m³ per tonn i rommet (Cargo Handbook), så autolinerens 700 m³ er om lag 400 t produkt, som `holdCap`.

**Lossingen (V1 A):** fryst fisk losses med 1–1,5 t per mannetime med mekanisk utstyr og øvd mannskap (FAO, «Handling sea-frozen fish»). Med et lag på 8 i rommet og kran blir det 8–12 t i timen; 300 t tar 25–35 timer. Norske tall for et kjølelager er ikke funnet (Melbu Fryselager: én båt om gangen, mobilkran på kaia). Spillet bruker 10 t i timen med lossegjengen og kranen, paller på om lag 1 t (antatt).

**Kunne ikke nås fra miljøet her:** fiskebat.no, fiskarlaget.no, rafisklaget.no, Fiskeribladet, Nofima, Mustad, SSB, Tableau hos Fiskeridirektoratet. Søket ga utdrag fra noen av dem.

## 3. Fasene

H2 er for stor for én økt. Den deles i fem, hver én økt med `/lever` (V4 A):

### H2a Lina, egnemaskinen, fangsten og reglene

- **Hva:**
  - **Linesystemet:** autolineren har ikke stamper. Lina ligger på magasin under dekk, og egnemaskinen egner hver krok når lina går ut. Om bord: `autoHooks` (40 000) krok på magasin med slitasje og tapte kroker; lina settes i **lenker** på om lag 6 000 krok (1,3 m mellom krokene, 7,8 km) mellom to blåser og dregger. Setting i 8 knop (om lag 3 krok i sekundet), draget om lag 2 500 krok i timen gjennom haleporten (kap. 2b).
  - **Agnet:** akkar og saury (50/50, som autolineflåten bruker) kjøpt fryst på mottaket, om lag 17 g per krok, ført i agnfrysen; uten agn ingen setting. Nye agn i `BAITS`: akkar (blekksprut finnes) og saury.
  - **Fangsten:** `soakHour` med en egen faktor for autoline, kalibrert så en snittbåt tar om lag **200 kg rund vekt per 1 000 krok** over året, med artsfordelingen fra sedlene for line 28+ (`fiske.json`).
  - **Reglene ved setting:** § 26 (4 nm hele året for over 21,35 m med egnemaskin, de tre feltene på 10 nm i sine perioder), J-187-2026 § 32 tredje ledd og sonene. Varsel før feil i Regler-appen (`rulesAt` med redskapet autoline). Henvisningene til J-161-2026 i koden blir J-187-2026.
  - **Kvoten:** landingene fra en havbåt går mot fartøyets egen kvote fra tillatelsen (`havQ`, som alt er per fartøy). Sei uten garnseitillatelse er bifangst (§ 14: 25 %, 50 % mens garnseifisket er åpent), ikke ubegrenset som nå. Lange og brosme etter forslaget for 2027 (V5 A): lange inntil 35 % i hver fangst og landing, brosme fritt til gruppekvoten er tatt (stoppdato hvert år mellom august og september, meldt av Fiskeridirektoratet), så 15 %.
  - **Kjøpet:** `lock` tas av autolineren, så den kan kjøpes med tillatelsen (blad B og pengene som før).
- **Filer:** `core/10-gear.js`, `core/02-species-gear.js`, `core/03d-quota.js`, `core/03e-rules.js`, `src/data/rules.json` (feltene i § 26), `core/09j-kystvakt.js` (henvisningene), `ui/08-actions.js` (Sett ut / Trekk), `ui/phone/10-fartoy.js`.
- **Tester:** ny `tests/unit/autoline.test.mjs` (kg per 1 000 krok mot sedlene, § 26-linjene, sei, lange og brosme), `rules.test.mjs`, `havlic.test.mjs`, `geartest`, `rulestest`.
- **Måles:** kg per 1 000 krok og per døgn på fem felt (Finnmark, Tromsøflaket, Eggakanten, Møre, Nordsjøen) mot sedlene.

### H2b Drift om bord: fabrikken, vakter, turen på uker og lossingen

- **Hva:**
  - **Fabrikken:** sløying og hodekapping med sløyemaskinen (2,5 t/t) og frysing i platefrysere, **15 t produkt i døgnet**; det som ikke rekker å fryses, venter i bløggekaret, og draget går saktere (`haulSlow`), som på kystbåtene.
  - **Vektene (V2 A):** lasten regnes i produktvekt (sløyd uten hode, fryst), kvoten og prisen i rund vekt med omregningsfaktorene i kap. 2b. `uh` for uer, kveite og blåkveite rettes etter tabellene.
  - **To vakter (V3 A):** 15 om bord, dekkslaget og fabrikklaget går seks og seks som anonyme lag; mannskapet bytter i havn hver tur (30 mann på båten). Nøkkelfolkene som personer kommer i H7.
  - **Turen:** proviant, drivstoff (om lag 3 700 l per døgn i snitt, 0,4 l per kg fisk), agnet og lastrommet setter lengden, med varsler. 6–7 uker er vanlig.
  - **Lotten:** § 6 for autoline over 28 m med turoppgjøret som finnes (stemmer med lønnsomhetsundersøkelsen).
  - **Lossingen (V1 A):** fryst fisk på paller, om lag 1 t per løft og 10 t i timen med lossegjengen, så 300 t tar rundt 30 timer. Kystbåtene og karene er som før.
- **Filer:** `core/05-vessels.js` (`holdFreezes`, arbeidet om bord), `core/13-work.js`, `core/03-simulation.js` (`capHold`, `sell`), `core/04-crew.js`, `core/07-harbours.js` (`landPlan`), `core/07f-kar.js`.
- **Tester:** enhetstester for omregningen, fabrikkfarten og lossetiden, `selltest`, `crewlifetest`, `trip2`.
- **Måles:** tonn produkt per døgn og per tur, drivstoff per tur mot 0,4 l/kg, lotten per tur mot lønnsomhetsundersøkelsen.

### H2c Autoline i Driftsplan 2, været og ligge bi

- **Hva:**
  - **Autoline som driftsform:** feltet får en sløyfe: sett lenkene, la dem stå 3–8 t, dra dem og sett igjen, døgnet rundt i vaktene, til lasten, agnet, drivstoffet eller planen sier stopp; så mottaket.
  - **Havfartøyenes værgrenser:** arbeidsgrensen for fisket (setting og drag stopper ved vind eller sjø over en grense under `risk`) og ligge bi over den (som 4.12j) i stedet for å gå til kai (BACKLOG 10.2). Grensen settes først etter et søk etter hva autolinere driver i; ellers står den som antakelse.
  - **Den felles klokka:** sløyfen spilles også når appen er lukket (`catchUp`).
- **Filer:** `core/06g-plan2.js`, `core/06h-plan2-engine.js`, `ui/05d-plan2.js`, `core/05-vessels.js` (`lieTo`).
- **Tester:** `driftsplan2test` (nytt scenario: en uke med autoline), `driftsplan2ui`, alene.
- **Måles:** at en uke i planen gir det samme som en uke spilt for hånd (innenfor 15 %).

### H2d Blender-modellene og animasjonene for hele operasjonen

Jonas 05.11.2026: «husk at vi må ha blendermodeller og animasjoner for hele operasjonen». Etter `/blender` og leselista for modellene; bare utsiden, ingen rom under dekk (CLAUDE.md). Det som finnes: blåsestaken og dreggen (`tools/gear/blaase.py`), linehaleren for kystbåtene (`tools/gear/haler.py`), kranen (`tools/deck/kran.py`), havneenheten med kaikran og truck (`tools/harbour/kaimottak.py`), folkene (`tools/harbour/arbeider.py`), karene (`tools/deck/fisk.py`), autolineren med haleporten (`tools/boats/al45.py`).

- **Nye modeller:**
  - **Autolinehaleren** med krokrenseren ved haleporten. Den er en del av autolinesystemet som følger båten (`autoHooks`), men lages som egen del som spillet setter på ankeret `hauler`, slik regelen om redskap i båtene sier.
  - **Bøyestanga for havet** etter § 68: stang minst 2 m over vannet, radarreflektor, to flagg i vest og ett i øst, gult blinklys om natta; blåsestaken finnes og utvides.
  - **Lina med krok og agn** som går ut over hekken og inn i haleporten (krok, forsyn og agnbit som enkle deler, mange av dem som instanser).
  - **Fryste kartonger og pallen** (kartong om lag 20–25 kg, pall på om lag 1 t, med strekkfilm), **lasteluka** som åpnes på dekk og **lossestroppen** eller pallegaflene på kranen.
- **Animasjonene i 3D:**
  - **Setting:** dreggen og bøyestanga over hekken, lina med agnede kroker i strekk ut i kjølvannet i båtens fart, ny bøyestang mellom lenkene.
  - **Draget:** båten ligger mot lina, lina kommer inn gjennom haleporten, fisken løftes inn én og én (`gaff`, som på kystbåtene), krokrenseren og lina tilbake mot magasinet; folkene ved haleporten.
  - **Lossingen:** luka åpnes, kranen (båtens eller kaiens) løfter pall for pall opp fra rommet og ned på kaia, trucken kjører dem inn i fryselageret, lossegjengen i luka og på kaia.
- **Filer:** `tools/gear/` (ny `autoline.py`), `tools/gear/blaase.py`, `tools/deck/` (ny `pall.py`), `view3d/10-gear.js`, `view3d/09-landing-deck.js`, `src/data/*.b64`, malen.
- **Tester:** `vessel3d.test.mjs`, kontrollbildene fra Blender, `haultest`, `landtest` og skjermbilder i begge formater, 3D-testene alene.

### H2e Kystvakta på havet, hele turen og stikkprøvene

- **Hva:**
  - **Kystvakta:** havsjekk om bord (posisjon mot § 26 og § 32, merkingen etter §§ 66 og 68, fangst og fartøykvote, minstemål, innblanding, bifangst av sei, lange og brosme).
  - **Hele turen** i `tests/havtur.py`: kjøp med tillatelse, ut fra en havn, sett, dra, frys, lever ved et mottak som tar konvensjonelt.
  - **Stikkprøvene:** turen fra Båtsfjord, Tromsø, Ålesund og Bergen; skjermbilder i begge formater.
  - Patchnotes.
- **Tester:** `havtur`, `kystvakttest`, `kystvakt.test.mjs`.

## 4. Valgene

**V1 Hvordan fryst fisk losses** (valgt: A, Jonas 05.11.2026: «men husk at vi må ha blendermodeller og animasjoner for hele operasjonen»)
- **A (anbefalt): på paller,** som fryst fisk losses i virkeligheten: om lag 1 t per løft og 25–40 t i timen (antatt; sjekkes mot et kjølelager), så 300 t tar et døgn. Kystbåtene og karene er som før.
- **B: kar på 300 kg som i dag.** Over 1 300 løft og to døgn for en full båt.
- **C: bare tiden,** uten løft i 3D.

**V2 Hva lasten måles i** (valgt: A)
- **A (anbefalt): produktvekt i rommet, rund vekt på kvoten,** med Fiskeridirektoratets omregningsfaktorer. Slik regnes det i virkeligheten, og da betyr 400 t lasterom det samme som på båten.
- **B: rund vekt overalt som i dag.** Enklere, men lastrommet blir fullt for tidlig og prisen per kg passer ikke sedlene for sjøfryst.

**V3 Mannskapet i H2** (valgt: A)
- **A (anbefalt): lagene som finnes** (nøkkelfolk, dekk 4 og fabrikk 4, to vakter) som anonyme lag med antall og ferdighet; navngitte nøkkelfolk med liv kommer i H7. Da kommer den første havturen raskere.
- **B: ta H7 inn i H2,** så nøkkelfolkene er personer fra første tur.

**V4 Rekkefølgen** (valgt: A)
- **A (anbefalt): fasene som egne økter med utrulling etter hver** (fem etter Jonas' svar på V1: H2a–H2e), så autolineren kan kjøpes og fiske etter H2a (for hånd), og planen og 3D kommer etter.
- **B: alt i én utrulling** til slutt.

**V5 Lange og brosme i spillets år (fra 2027)** (valgt: «det som er mest realistisk», altså A, slik forslaget for 2027 er)
- **A (anbefalt): som reguleringen for 2026:** gruppekvoten for 28 m og over, direktefisket stoppes når den er tatt (i 2026 i januar for lange og august for brosme), deretter bare bifangst. Autolineren må da leve av torsk, hyse og blåkveite store deler av året, som i virkeligheten nå.
- **B: som sedlene for 2024–2025,** der lange og brosme er over en tredel av fangsten hele året. Mer å fiske, men ikke slik reglene er i dag.

## 5. Antatt eller usikkert

Etter søket 05.11.2026 (kap. 2b) står dette igjen:

- **Lenkene** (6 000 krok, 7,8 km), **farten i draget** (2,5 krok i sekundet) og **agnet per krok** (17 g) er regnet ut av kildene, ikke lest hos et rederi.
- **Fryseriet** på 15 t i døgnet er valgt mellom båter på 44–64 m; autolinerens eget tall finnes ikke.
- **Lossingen:** 10 t i timen er FAOs 1–1,5 t per mannetime med et lag på 8; norske tall for et kjølelager er ikke funnet.
- **Arbeidsgrensen i vær** for setting og drag er ikke funnet (H2c søker igjen).
- **Fangsten per krok** er regnet av sedlene og døgnene i sjøen; HI har ingen tall for autoline (rapportene skiller ikke autoline fra annen line).
- **Den reviderte autolinetariffen** er ikke lest; § 6 fra 2025 stemmer med lønnsomhetsundersøkelsen.
- **Omregningsfaktorene** er de siste som kunne leses (2018 og 2023); den gjeldende tabellen ligger i Tableau, som ikke kan nås herfra.
- **Reguleringen for 2027** er et forslag (sak 15/2026); den endelige J-meldingen kommer i desember.
- Sedlene sier ikke hvor mye som er tatt i hvilken sone utenfor norsk økonomisk sone; fordelingen på felt følger hovedområdene i `fiske.json`.

Fra H2b (05.11.2026):

- **Generatorene** (95 l i timen når båten ligger eller fisker) er kalibrert så et snittdøgn på sjøen med om lag 10 % gange blir 3 900 l; andelen gange er antatt. Et fiskedøgn uten gange måles til om lag 3 500 l. Drivstoff per kg fisk blir om lag 0,5 l, over undersøkelsens 0,40, fordi den regner med garnseien.
- **Krokbyttet:** 5 % av bruket i døgnet er HI-rapport 2024-11; at de verste delene byttes først (så lina holder seg på om lag 0,65 med god fangst på dypt vann), og prisen på en eske med 10 000 kroker (22 000 kr), er antatt.
- **Proviant:** 250 kr per manndøgn er regnet av undersøkelsen (1,05 MNOK, 277 døgn, 15 mann); 60 døgn om bord er antatt. Om proviant er rederiets kostnad eller en felleskostnad etter oppgjørsavtalen, er ikke sjekket (tariffen er ikke lest); spillet fører den som rederiets.
- **Lagene:** veksten i ferdighet (en tidel per tur), vaktene (00–06 og 12–18 mot 06–12 og 18–24), at basen går første vakt og at broa bare står ved roret under fart, er antatt. Lagene blir ikke slitne og har ikke humør. Reisen hjem for skiftet som går i land, koster ingenting.

## 6. Hva planen ikke gjør

- Ikke garn eller snurrevad på konvensjonell havfisketillatelse (de hører til tillatelsen, men kommer med egne båter senere).
- Ikke garnseitillatelse, strukturkvote eller eiertak (H8).
- Ikke navngitte nøkkelfolk med liv (H7, om ikke V3 B).
- Ingen innredning, fabrikk eller rom under dekk i modellen (CLAUDE.md).
- Ingenting selges for ekte penger.

## 7. Status

- 05.11.2026: planen skrevet på grenen `h2-autoline`. Venter på valgene V1–V5 og «kjør på».
- 05.11.2026: **valgene tatt** (Jonas): V1 A («men husk at vi må ha blendermodeller og animasjoner for hele operasjonen»), V2 A, V3 A, V4 A, V5 «det som er mest realistisk» (A, etter forslaget for 2027), og «Finn ut det du er usikker på». Søket står i kap. 2b; H2d er nå Blender-modellene og animasjonene, og Kystvakta, hele turen og stikkprøvene er H2e.
- 05.11.2026: **H2a bygd** på grenen `h2-autoline` (5.64 i `docs/systemer/redskap.md`, 5.5c i `docs/systemer/kvoter-og-regler.md`):
  - Autolineren kan kjøpes. Lina ligger på magasin (8 lenker à 5 000 krok), egnes av maskinen med agn fra frysen (85 kg per lenke; ny agnsort saury), settes på om lag 28 min og dras på om lag 2 t per lenke, og kan settes ut igjen med én gang etter draget.
  - Fangsten er kalibrert mot sedlene for line 28+: 197 kg per 1 000 krok, artsmiks som sedlene (`tests/autolinetest.py`).
  - § 26 (4 nm og de tre 10 nm-feltene), J-187-2026 i stedet for J-161-2026 (leddet sjekket), sei 25 % uten garnseitillatelse, lange 35 % og brosme fritt til stoppen, så 15 %.
  - Havlandingene går som egen gruppe til den felles verden.
  - Rettet for alt redskap: en setting som stoppes halvveis, gir resten tilbake.
  - **Står igjen til H2b:** krokbytte om bord, fabrikken og frysingen i produktvekt (V2 A), vaktene, turen og lossingen på paller.
- 05.11.2026: **H2a rullet ut** (Jonas: «Rull ut H2a, Start H2b i en ny økt»), flettet med arbeidsgrenen i 3cc5009. **Neste:** H2b i en ny økt.
- 05.11.2026: **H2b bygd** på grenen `ccr-99204901-f1vpx2` (5.65 i `docs/systemer/redskap.md`). Valgene i detaljene samme dag (Jonas, alle de anbefalte): lasten vises i produktvekt med rund vekt under, fisk som ligger ufryst ved levering fryses ved kaia, lagene følger båten, og provianten fylles ved avgang.
  - Omregningsfaktorene rettet (uer 1,70, kveite 1,35, blåkveite 1,32); rommet fylles av produktvekten, kvoten og prisen går på rund vekt.
  - Fryseriet tar 15 t produkt i døgnet; det som venter, gjør draget saktere. Generatorene og hovedmotoren langs lina bruker drivstoff (om lag 3 500 l et fiskedøgn).
  - Krokbytte om bord, 5 % av bruket i døgnet, idet lina kommer inn; eske med 10 000 kroker i butikken.
  - To skift à 14 følger båten, seks og seks på dekk og i fabrikken, kokken lager maten, lotten etter § 6 til skiftet, skiftbytte ved levering; mannskapsbørsen er stengt for havbåten.
  - Proviant for 60 døgn ved avgang; turens grenser (proviant, drivstoff, agn, kroker, rom) med varsler og kortet Turen.
  - Lossing på paller, om lag 10 t i timen, med frysing ved kaia; enkel pall med kartonger i 3D (Blender-pallen er H2d).
  - Tester: `tests/unit/fabrikk.test.mjs` (47 sjekker) og `tests/fabrikktest.py` (26, to døgn der lagene fisker uten deg om bord og en lossing i Vannareid). Stikkprøve av lossingen sør, midt og nord: Egersund, Valderøya (Ålesund) og Båtsfjord, 63 paller på 6,4 timer hvert sted, sluttseddel, lott og skiftbytte, ingen sidefeil. **Venter på Jonas før utrulling.**
- 05.11.2026: **H2b rullet ut** (Jonas: «Rull ut h2b, Start h2c i en ny økt»), flettet med arbeidsgrenen i d5d6b4c (det nye der var dokumenter, en migrering og `sqltest`, ikke `src/`). **Neste:** H2c (autoline i Driftsplan 2, havfartøyenes værgrenser og ligge bi) i en ny økt. H2c må også få Driftsplan 2 til å gå med lagene (`lagOf`, `lagOnDeck` i `04-crew.js`) uten deg om bord, fordi planens rytme, skipper og styrmann leser `S.crew`.
