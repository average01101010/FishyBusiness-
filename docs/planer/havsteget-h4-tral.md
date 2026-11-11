# Havsteget H4: tråleren (plan, 11.11.2026)

Steg 32 i `docs/planer/koen.md`, Jonas' økt 11.11.2026 (grenen `ccr-caa67856-3cmr94`). Oppgaven (startmeldingen `docs/planer/start/32.md`): «planen for H4, tråleren, med `/planlegg` … redskapet og fangsten …, reglene … lest på Lovdata og fiskeridir.no før de skrives inn, med kilde og om teksten er lest ordrett, fabrikken og lotten for trål, Kystvaktas havsjekk for tråleren …, spillerens tråler i 3D med `drawTrawl` fra spillets egen tilstand, og hele turen og stikkprøvene som siste fase. … Valgene som A/B/C med én anbefaling hver, bare de Jonas må ta … Ingenting bygges.»

Steget står etter lanseringslinja (Jonas 09.11.2026: «kystflåten er MVPen. Havbåtene kan vente»). Planen er skrevet nå fordi Jonas ba om det; fasene bygges etter lanseringen, eller før når han sier det.

Valgene fra `havsteget.md` gjelder: V2 B og V3 A (03.11.2026: «Prisene må reflektere det virkelige liv, og tillatelsene må også være realitiske. Husk: vi lager en simulering av fiskerinæringen i norge, og da må vi være så tett opp mot realiteten som mulig»), V4 C (rammen er utvidet i H1b), V5 A (lag med nøkkelfolk) og V6 A (03.11.2026: trål og not fiskes «automatisk med valg, og hånda på rattet når man vil»). Fra H2 gjelder «husk at vi må ha blendermodeller og animasjoner for hele operasjonen» (05.11.2026), og fra H3c «På de store havbåtene skal forresten mannskapet kun gå døgndrift» (07.11.2026). Formen følger `havsteget-h2-autoline.md` og `havsteget-h3-snokrabbe.md`.

Planen bygger på H0 (mottakene og prisene for sjøfryst fisk), H1 (torsketråltillatelsen `tral`, 5.5b i `docs/systemer/kvoter-og-regler.md`), H1b (rammen, sonene, isen), H2 (lagene, fabrikken med platefrysere, turen, lossingen på paller, havbåten i Driftsplan 2, havsjekken i 5.30b) og H3 (reglene per år som data, kvotefleksen i lagringen, havsjekken i 5.30c).

## 1. Hva som finnes i dag

Funnet i koden og i en sonde mot kjernen 11.11.2026 (enhetstestenes laster kjørt utenfor repoet, ikke lagt inn).

**Båten** (`core/02-species-gear.js` `VESSELS.bunntral`, modellen `tools/boats/tral60.py`): «Frysetråler 60 m med akterslipp», 60,3 × 12,5 × 5,1 m, 2 200 t, 8 000 hk, 12/15 kn, fryserom 1 400 m³ og 800 t (`hold:{kind:'frys'}`), 700 m³ drivstoff (900 l i timen), `crew` ni nøkkelfolk, dekk 4 og fabrikk 6 + 6 i to skift (`rot:2`), 30 køyer, `gutMachine` 4 000, `rigs:[]`, `mottak:['Trål']`, 150 M (bygd 2004, ny 500 M), `lock:true`. Ingen `freezeT` og ingen `plantLph`. Modellen er fra 06.10.2026 (før pilotbåtens arbeidsmåte): akterslipp, galger med tråldører på hver side av slippen, delte trålvinsjer, nettrommel, A-mast og kran; dørene, posen og nota på trommelen er egne deler i GLB-en. Det finnes ikke noe `tral-grunnlag.md`, og `crewclip` er rød på `bunntral` (backloggen 10.6).

**Tillatelsen** (`core/03d-quota.js` `HAVLIC.tral`): torsketråltillatelse, per kvotefaktor 1,00 i 2026 372 t torsk, 332 t hyse og 422 t sei, gruppa 31 785, 28 665 og 43 397 t. Registeret `HREG.tral` er 36 (snl.no 2019), og snittet 2,37 kvotefaktorer per tillatelse (85,4 på 36). Ukas selger i sonden hadde 1,59 faktorer, og båten med tillatelsen kostet 516 MNOK (`havPrice`). Kjøpet virker som for autolineren (`havLicWhy`, `havLicTake`, blad B), men `lock` stopper det.

**Redskapet:** finnes ikke for spilleren. `GEAR`, `SELQ`, `RIGS`, `S.sets` og `soakHour` kjenner bare juksa, line, garn og teiner; alt redskap i dag er passivt (settes, står, trekkes). Tråleren har `rigs:[]`, så «Sett ut» har ingenting å tilby.

**Artene:** torsk, hyse og sei har pris for sjøfryst fisk (`pmF`, H0). Uer og blåkveite har ingen `pmF`. Spillet har én art `uer`; snabeluer (den trålerne tar mest av, kap. 2b) finnes ikke. Reke finnes ikke.

**Fisken på trålfeltene** (`fiskerimodellen.md` 5.3c): tettheten (`density`) finnes over hele rammen, og sedlene for trål 28 m og over ligger i `fiske.json` per hovedområde og måned. Trål og havfiske er lagt jevnt over hovedområdet utenfor grunnlinja, og størrelsen på fisken varierer ikke med feltet (5.30b: «innblanding over 15 % skjer knapt»).

**Reglene** (`core/03e-rules.js`, `src/data/rules.json`): `tral` er et bunnredskap i regelmotoren (`RU_BOTTOM`), så § 58 (`sv58`) og de sårbare økosystemene ved Svalbard (`vme`, lag 25) stopper trål i dag. Grønlandskvotene for torsketrålere finnes (`gl`). `rules.json` har grunnlinja og linjene for 1, 2, 4, 6, 10, 12 og 24 nm, sonene (`sea`) og laget «J-melding stengte fiskefelt» (lag 0, to felt, brukt bare for line og garn). **Finnes ikke:** forbudet innenfor 12 nm med § 62, § 56, § 16, maskevidde og rist, § 15, § 49 for trålhal, de stengte feltene for torsketrål, korallrevene, 30 kg koraller og 400 kg svamp, bifangstreglene for uer og blåkveite, og J-4-2020 ved Jan Mayen.

**Havflåten** (`core/05d-hav.js`, `havflaate.json`): 111 NPC-trålere (bunntrål, reketrål og pelagisk trål i samme gruppe, modellen `bunntral`), turer på 5–12 døgn og 1–2,5 døgn i havn (`HAVG.tral`), tauing 5 timer i 4 knop fram og tilbake over feltet (`havFish`), og trålen ute i 3D.

**3D** (`view3d/20-trawl-seine.js`): `TRAWL` og `trawlState` har fasene skyting (46 s), sleping og haling (50 s) på en lokal klokke, og `drawTrawl(t, A, BMrel, now, stO)` tegner dørene, varpene, nota og posen etter en tilstand `{lo, ro, net, cod, full, tow}`. NPC-ene får den faste tilstanden `NPCTOW`. Spillerens båt tegner trålen bare når `TRAWL.mode` er satt, og ingenting i spillet setter den (bare testen `tral3d`). Lanternene for tråling (grønt over hvitt, regel 26) finnes (`sjvLanternSt`).

**Mottakene** (`portWhy`, sonden): ni havner tar tråleren i dag: Senjahopen, Torsken, Båtsfjord, Melbu, Skudeneshavn, Tromsdalen, Arendal, Selje og Avaldsnes. Fryselagrene der flåten lander (Tromsø, Ålesund og Sortland, kap. 2b) er ikke havner; Tromsdalen ligger ved Tromsø.

**Lotten** (`core/04-crew.js` `OPPG`): tabeller for juksa, garn, line, havfiske § 6 og snøkrabbe § 20. Ingen for trål.

**Fabrikken og turen** (H2b, H3b): `freezeT` (platefryserne, kg produkt i døgnet), `plantLph`, produktvekt i rommet og rund vekt på kvoten og prisen (`landProd`), lossing på paller med båtens kran, proviant og turkortet finnes for autolineren og snøkrabbefartøyet og kan brukes av tråleren.

**Driftsplan 2** (`core/06g-plan2.js`, `06h-plan2-engine.js`, `06i-plan2-sno.js`): havbåtens sløyfe døgnet rundt kjenner autolina og snøkrabbelenkene, ikke slep.

**Kystvakta** (`core/09j-kystvakt.js`): `kvHavCheck` (autoline) og `kvSnoCheck` (snøkrabbe). Ingen sjekk for trål.

## 2. Regelverket

Lest 11.11.2026 av en agent og kontrollert i økta mot det agenten lastet ned. **Lovdata kunne ikke leses** herfra (405 for `curl` og Playwright; et nettleserverktøy ga bare sammendrag). Høstingsforskriften er derfor lest ordrett i Fiskeridirektoratets J-163-2026 (hele forskriften slik den gjelder fra 02.10.2026, fiskeridir.no/yrkesfiske/j-meldinger/j-163-2026); paragrafnumrene er som før. Der noe bare er et utdrag, står det.

**Hvor tråleren kan fiske:**

- **Innenfor 12 nm (havressurslova § 20, utdrag, ikke lest ordrett):** «Det er forbode å hauste med trål innanfor territorialgrensa ved det norske fastlandet», med unntak for tare-, reke- og krepsetrål. Unntakene står i høstingsforskriften kap. XIII, «Adgang til å fiske med trål innenfor 12 nautiske mil fra grunnlinjene utenfor det norske fastland» (lest).
- **§ 62 (lest):** «I området mellom 6 og 12 nautiske mil fra grunnlinjene er det tillatt å fiske med stormasket bunntrål for fartøy med en bruttotonnasje inntil 1200. Fangsten skal landes for bearbeidelse ved anlegg i Norge i fersk, frosset eller saltet tilstand. Fangsten kan ikke være filetert.» 1 200 BT er altså bekreftet (`havsteget.md` hadde det som «ikke bekreftet»). Paragrafen har ingen breddegrader eller tidsrom. Spillets tråler har ingen bruttotonnasje i dataene; et 60 m fartøy med 2 200 t deplasement er trolig over 1 200 (vår vurdering), og må da holde seg utenfor 12 nm. §§ 60 og 61 gjelder småmasket trål og er ikke med.
- **§ 56 (lest):** «Det er forbudt å fiske med trål i følgende områder og til følgende tider: a. Jennegga-Malangsgrunnen avgrenset av rette linjer trukket mellom følgende posisjoner: 68°50'N 13°50'Ø (ved territorialgrensen), 69°09'N 13°37'Ø, 69°33'N 15°32'Ø, 70°00'N 16°28'Ø, 70°00'N 17°28'Ø (ved territorialgrensen) i tidsrommet fra og med 20. oktober til og med 20. mars.» Bokstav b: Storegga (63°00'N 05°15'Ø, 63°00'N 04°53'Ø, 63°27'N 05°24'Ø, 63°27'N 05°48'Ø), hele året, «bare for fartøy større enn 35 meter største lengde». «Fleksible områder» står ikke lenger i forskriften; § 57 lar Fiskeridirektoratet eller Kystvakten sette midlertidige reguleringer ved redskapskonflikter, med melding minst 12 timer før.
- **§ 16 (lest):** «Innenfor grunnlinjene er det på følgende kyststrekninger forbudt å bruke bunntrål på grunnere vann enn angitt nedenfor: a. Svenskegrensen - Jærens rev: 60 m b. Jærens rev til og med Trøndelag fylke: 100 m c. Nordland, Troms og Finnmark fylker: 170 m». For spillets tråler, som er utenfor 12 nm, kommer regelen aldri i bruk; den skrives inn så den finnes når en mindre tråler kommer.
- **§ 58 (lest):** «Med unntak av fiske etter reker med trål og skraping av skjell er det ikke tillatt å drive høsting i følgende områder: a. Innenfor 20 nautiske mil fra grunnlinjene rundt Bjørnøya avgrenset av fiskevernsonen. b. Innenfor 15 nautiske mil fra grunnlinjene på vestsiden av Spitsbergen fra Sørkapp til 77° 30' N. c. Innenfor 20 nautiske mil fra grunnlinjene på vestsiden av Spitsbergen nord for 77° 30' N og vest for 14° Ø.» Spillet har dette (`sv58`).
- **Jan Mayen (J-4-2020 § 1, lest):** «Det er forbudt for norske fartøy å fiske og lande torsk og hyse i fiskerisonen ved Jan Mayen.»
- **Sårbare økosystemer (J-61-2019, lest):** § 2 d: sammenstøt er «tilfeller når mengden per fangst (trålhal, line- eller garnsetting) overstiger 30 kilogram levende koraller og/eller 400 kilogram levende svamp». § 3: fartøyet skal rapportere til Fiskeridirektoratet og «stoppe fisket og flytte minst 2 nautiske mil». § 2 c og § 4: områder dypere enn 1 000 m er «nye fiskeområder» og krever spesialtillatelse. § 5: ti stengte områder ved Svalbard (spillet har 15 flater i lag 25). **Korallrevforskriften (J-78-2023, lest):** § 3 forbyr redskap som slepes og kan berøre bunnen i navngitte rev (Sotbakken, Fugløyrevene, Røstrevet og flere).
- **Stengte felt for torsketrål (lest):** § 50 a lar Fiskeridirektoratet «Forby fiske i visse områder nord for 62° N dersom innblanding av reker, torsk, hyse, sei, blåkveite og uer under minstemål overskrider det som fremgår av § 49». Nord for 62° N står en stenging til den oppheves. Sjøtjenesten (fiskeridir.no): «Ved fangstkontroller tas det representative prøver av fangstene, og ved for stor innblanding av fisk under minstemål og/eller for høy innblanding av andre arter, stenges det aktuelle området.» Gjeldende 11.11.2026: Spitsbergenbanken (J-193-2026, 75°16'–75°43'N, 17°30'–19°00'Ø), Røstbanken, Nordsnaget (71°00'–71°17'N, 20°00'–21°43'Ø) og Sotbakken (J-167-2026), og et felt fra 1993 (J-180-1993, 72°49'–73°33'N, 35°40'–38°24'Ø). Koordinatene står i J-meldingene, og kartlaget finnes hos Fiskeridirektoratet (lag 0 i `rules.json`).

**Redskapet:**

- **§ 4 (lest):** minste maskevidde nord for 64° N: «a. Trål: 130 mm. b. Flytetrål etter uer: 100 mm. c. Snurrevad: 125 mm», sør for 64° N 120 mm. Ingen egen sats for Svalbard. § 3: målt med «et flatt mål som er 2 mm tykt … med et trykk som tilsvarer 5 kg», snittet av 20 masker.
- **§ 12 (lest):** «… skal det brukes sorteringsristsystem i trålen i følgende tilfeller: a. Ved fiske med stormasket trål nord for 62° N b. Ved fiske med reketrål». **Ristforskriften (J-28-2023, lest):** spileavstanden er minst 50 mm sør og vest for linja 70°58,5'N 23°Ø – 71°30'N 23°Ø – 71°30'N 20°Ø – 72°N 17°Ø – 73°40,5'N 17°Ø, og 55 mm ved Svalbard og nord og øst for linja. Unntak: uten rist 1.1–30.4 i ruta 70°00'–72°30'N, 14°–18°Ø, og «i et direkte fiske etter uer». Godkjente rister: Sort-X, enkeltrist, Sort-V (bare russiske trålere) og fleksirist.
- **§§ 7–9 (lest):** slitematter bare på undersiden, rundstropper minst 1 m fra hverandre, én løftestropp, og forsterkningsnett bare i småmasket trål.
- **§ 15 (lest):** «Det er forbudt å fiske torsk og hyse pelagisk med trål eller snurrevad.» «Det er forbudt å fiske uer med trål.» «Det er forbudt å fiske med bomtrål.»

**Fangsten:**

- **§ 47 (lest):** minstemål nord for 62° N: torsk 44 cm, hyse 40 cm, sei 45 cm, blåkveite 45 cm, uer 30 cm utenfor 12 nm. Spillet har tabellen (`MIN47`).
- **§ 49 (lest):** «Ved fiske etter torsk, hyse og sei med trål og konvensjonelle redskap nord for 62° N er det tillatt å ha til sammen 15 % torsk, hyse og sei under minstemål i antall i de enkelte fangster.» Blåkveite 15 % og uer 15 %.
- **Plikt til å skifte felt ved høy innblanding:** ikke funnet i forskriften. En høring (30.06.2026, frist 02.10.2026, lest) foreslår at hele fangsten av arten inndras ved brudd, og at grensen også skal gjelde ved landing; ikke vedtatt så vidt vi fant.
- **§ 51 (lest):** «All fangst av fisk skal føres i land», med unntak for levedyktig fisk; kveite over 2 m skal slippes. § 55: forbud mot innretninger for oppmaling og utkast.
- **Snabeluer (J-44-2026 § 8, lest av agenten):** «Ved fiske med stormasket trål utenfor 12 nautiske mil fra grunnlinjene er det tillatt å ha inntil 20 % bifangst av snabeluer i vekt i de enkelte fangster og ved landing.» Fartøy med torske- eller seitråltillatelse har en fartøykvote på 1 206 t, og det er trålforbud 1.3–9.5. Hvordan § 15 («forbudt å fiske uer med trål») og det direkte fisket etter snabeluer med fartøykvote henger sammen (flytetrål, område, periode), er ikke lest ferdig og leses ordrett i H4a før det bygges.
- **Blåkveite (J-241-2025 § 8, lest):** «Konvensjonelle havfiskefartøy og trålere kan fiske og lande en fartøykvote på 56 tonn. Denne kvoten må også dekke bifangst av blåkveite i andre fiskerier.» **Kveite (§ 39):** fredet 20.12–20.4 nord for 62° N. **Svalbard-sonen:** uer 20 % bifangst (J-273-2013), blåkveite 12 % i enkeltfangster og 7 % ved landing (J-275-2013).

**Kvotene:**

- **2026 (J-187-2026, 26.10.2026, lest):** § 3: «Fartøy med torsketråltillatelse kan fiske og lande inntil 31 785 tonn torsk, 28 665 tonn hyse og 43 397 tonn sei». §§ 7–8: kvotefaktor 1,00 gir 372 t torsk, 332 t hyse og 422 t sei (spillets tall er bekreftet). § 6a: «Det enkelte fartøy kan overfiske fartøykvoten på torsk … med inntil 10 % i 2026 … Dersom kvoten ikke er oppfisket ved utløpet av 2026, godskrives inntil 10 % av denne kvoten til 2027.»
- **2027 (saksdokumentene til reguleringsmøtet november 2026, lest; forslag, ikke vedtak):** totalkvoten for nordøstarktisk torsk er 325 000 t (285 000 i 2026), trålstigen gir 28,09 %, og forslaget er 423 t torsk og 370 t hyse per kvotefaktor for torsketrål (gruppa 37 150 t torsk). Seien går ned (norsk kvote 127 807 t, −22 %); tallet per faktor er ikke funnet.

**Tillatelsen (konsesjonsforskriften, J-82-2024, lest):**

- **§ 2-1:** «Torsketråltillatelse gir adgang til å drive fiske med trål etter alle fiskeslag i de områder og til de tider departementet bestemmer», unntatt pelagiske arter og industrifisk sør for 64° N.
- **§ 2-2:** lasterom høyst 2 500 m³. **§ 2-3:** ombordproduksjon er forbudt uten særskilt tillatelse når fartøyet har leveringsvilkår; «frysing og pakking, etter at fisken er bløgget, sløyd og hodekappet» er ikke ombordproduksjon. **§ 2-4:** en eier kan ha høyst tolv kvotefaktorer.
- **Antallet (saksdokumentet for torsk, lest):** «Per 26. oktober er det 87,8915 kvotefaktorer i konsesjons- og deltakerregisteret fordelt på 35 konsesjoner i torsketrålgruppen.» Spillet har 36 og 85,4; snittet blir 2,51 per tillatelse, ikke 2,37.
- **Reketrål (§ 3-1)** er en egen tillatelse. **Leveringsplikten** (J-148-2023, lest) gjelder fartøy med leveringsvilkår: 80 % av torsken og 60 % av hysa skal tilbys bestemte bedrifter; i sedlene er det 13 500 t torsk på tre år (kap. 2b).

**Rapporteringen (ERS-forskriften, J-204-2025, lest):** posisjon minst hvert tiende minutt (§ 8), fangstmelding «minst én gang daglig og senest klokken 23.59 UTC» med varigheten per fiskeoperasjon, også ved inspeksjon (§ 12), havneanløp «senest 2 timer før anløp til havn» (§ 13), og melding om fiskestart i Svalbard-sonen «tidligst 24 timer og senest 12 timer før fisket i sonen påbegynnes» (§ 15).

## 2b. Driftstallene

### Fra sluttsedlene (regnet ut 11.11.2026)

Kilde: Fiskeridirektoratets fangstdata (sluttsedler) for 2024, 2025 og 2026 til og med 10.11, `register.fiskeridir.no/uttrekk/fangstdata_<år>.csv.zip`, NLOD, regnet ut av en agent 11.11.2026. Norske fartøy på 28 m og over, bunntrål (redskap 51 og 52), nord for 62° N. En landing er sedlene fra samme fartøy med datoer tett i tid; turdøgn er døgnene siden forrige landing minus tre (gange og lossing, antatt).

| | 2024 | 2025 | 2026 (til 10.11) |
|---|---|---|---|
| Rund vekt | 204 727 t | 164 365 t | 112 143 t |
| Torsk | 58 828 t | 40 723 t | 22 638 t |
| Hyse | 25 859 t | 25 519 t | 24 875 t |
| Sei | 69 972 t | 51 003 t | 29 453 t |
| Uer (mest snabeluer) | 43 391 t | 40 476 t | 29 248 t |
| Blåkveite | 3 320 t | 2 653 t | 1 855 t |
| Fartøy med over 100 t | 38 | 37 | 38 |

- **Flåten:** median 70 m (kvartilene 60–75 m). Et fartøy på 60 m er i nedre kvartil.
- **Nesten alt fryses om bord:** 97 % av rundvekta. De ferske landingene (om lag 5 000 t i året) kommer fra fartøy som ellers fryser; det finnes ingen ren ferskfisktrålerflåte over 28 m i disse årene.
- **Torsken er ikke størst:** sei og uer er hver for seg større enn torsk. Torsk var 29, 25 og 20 % av fangsten i de tre årene.
- **En frossen tur, alle fartøy:** median 450 t rund vekt per landing (kvartilene 290–740), 20 døgn mellom landingene (14–31), 20 om bord (17–21), og to døgn fra siste fangst til landing.
- **Fartøyene på 55–65 m (sju fartøy):** median **414 t per landing** (262–579, største 1 089 t), **19 døgn** mellom landingene (14–26), **19 om bord**, og **25 t per turdøgn** (17–38).
- **Tonn per turdøgn etter måned** (50–75 m, turer med minst 60 % torsk og hyse): februar 39, mars 40, april 39, oktober 17, november 20, desember 18. Alle turer: mars–april om lag 35, oktober–desember 17–18. Hyseturer 39, uerturer 31, torsketurer 26 og seiturer 23 t per turdøgn.
- **Per fartøy i året (bunntrål nord for 62° N):** median 5 600 t i 2024, 3 900 t i 2025; sju landinger. De samme fartøyene tok i tillegg reker (93 000 t på tre år), pelagisk fisk og sei i Nordsjøen.
- **Feltene:** Nordkappbanken (hovedområde 12, 161 000 t på tre år, 46 % uer), Vest-Finnmark (04, 108 000 t, 41 % sei), Røstbanken til Malangsgrunnen (05, 74 000 t, 46 % sei), Bjørnøya (20, 51 000 t, 42 % torsk), Helgelandsbanken (06, 70 % sei), Storegga–Frøyabanken (07, 89 % sei), Øst-Finnmark (03) og Thor Iversens Bank (13, 56 % torsk). De fire største lokasjonene ligger langs eggakanten vest av Troms og Finnmark (12-07 ved 72,5° N 16° Ø, 70 % uer; 12-01, 04-07 og 05-35). **Sonene:** Norges økonomiske sone 93–97 %, fiskevernsonen ved Svalbard 2,5–6 %, russisk sone null.
- **Sesongen:** torsk desember–april, hyse mars–april, sei februar–mars og september–desember, uer januar og mai–juni, og nesten stille i juli–august (da går mange på reke).
- **Produktene:** sløyd uten hode er 90 % av torsken, hysa og seien, filet 7–8 %. Omregningen fra produkt til rund vekt i sedlene: **torsk 1,50, hyse 1,40, sei 1,35**; uer japankuttet om lag 2,0, blåkveite 1,5. Pakket som blokk i sekk på 50 eller 25 kg.
- **Prisen** (beløp for fisker per kg rund vekt, fryst om bord): torsk 43,8 kr i 2024 og 56,1 i 2025, hyse 23,0 og 39,9, sei 16,4 og 23,5, uer 14,0 og 15,9, blåkveite 51,2 og 61,1. Høyest i oktober–november. 2026 har ingen beløp i fila. Samlet 26,0 kr/kg over alle arter i 2024.
- **Størrelsen på torsken** (sløyd uten hode): 47 % under 2,5 kg, 32 % 2,5–5 kg og 18 % over 4 kg; andelen under 1 kg økte fra 4 til 12 % fra 2024 til 2026. Tolkningen av størrelseskodene er agentens.
- **Hvor fryst trålfangst landes:** Tromsø 50 % (to anlegg), Ålesund 36 % (seks), Sortland 10 %, Båtsfjord 2 %, Hadsel 1 %, Senja 0,5 %. Mottaksnumrene er i samme serie som fryselagrene for snøkrabbe (TF9199, T9211, F9175), så det er trolig nøytrale fryselagre (antatt av nummerserien).
- **Reketrål, 28 m og over:** 49 000 t i 2024, 35 000 i 2025 og 30 000 i 2026 så langt, 24–28 fartøy med over 100 t (i stor grad de samme fartøyene), april–september, på Storbanken, Sentralbanken og ved Hopen; 64 % i fiskevernsonen og 29 % i Smutthullet.

### Fra kildene (søkt 11.11.2026)

- **Lønnsomhetsundersøkelsen 2024, fartøygruppe 006 «Torsketrålere inkl. trålere i andre bunnfiskerier»** (Fiskeridirektoratet, tabell G 15, lest; 35 av 37 fartøy): 67,5 m, 16,5 år; driftsinntekter 187,7 MNOK; arbeidsgodtgjørelse til mannskapet 54,3 MNOK (**28,9 %** av inntektene, utregnet); drivstoff 32,6 MNOK (17,4 %); vedlikehold 9,3 MNOK og redskap 4,7 MNOK; driftsresultat 36,1 MNOK; 318 driftsdøgn og 302 døgn i sjøen. Gruppa tok 277 000 t rund vekt i 2024 (om lag 7 500 t per fartøy, reker og annet medregnet).
- **Trålen** (Teknisk arbeidsgruppe om trål, Fiskeridirektoratet 2013, lest): «Bunntrål, vanlig størrelse tauet ved 4.0 knop: Høyde 4-6.5 m og bredde: 15-18 m, Åpningsareal: 60-75 m2», og en ordinær bunntrål veier om lag 12 t (dobbeltrål om lag 20 t). Typen som er nevnt som vanlig i Barentshavet, er en stormasket bunntrål med rockhoppergir.
- **Ikke funnet i en kilde som kunne leses:** slepetid per hal, fangst per hal eller tråltime, avstanden mellom dørene, varpelengden mot dybden, frysekapasiteten for en tråler på 60–70 m og lotten i oppgjørsavtalen. `havsteget.md` har 3–6 timer og 2–20 t per hal som bransjetall. Av sedlene: 25 t per turdøgn er 5 t per hal med fem hal i døgnet, og de beste månedene 8 t.
- **Kystvaktas kontroll:** forsvaret.no var stengt. Fiskeridirektoratets sjøtjeneste (lest): «Kontrollene omfatter alt fra redskapskontroller, fangstkontroller og at gjeldende regelverk overholdes», og torsketrål og reketrål «blir oftest berørt av stenging og åpning».

## 3. Fasene

H4 deles som H2 og H3, i seks økter med `/lever` etter hver. Hver fase er ett steg i køen (32a–32f). Rekkefølgen står fast: H4a gjør tråleren spillbar for hånd, og resten bygger på den.

### H4a Trålen, slepet, fangsten og reglene (steg 32a)

- **Hva:**
  - **Redskapet (V1):** en stormasket bunntrål med 130 mm maske og sorteringsrist (§§ 4 og 12; rista 55 mm, eller 50 mm sør og vest for linja i ristforskriften), dører og varp. Trålen følger båten, slik autolinesystemet gjør (`hasHauler`), og kjøpes ikke for seg; en reservetrål og nye dører kjøpes i utstyrsbutikken bare til et fartøy som kan tråle (`buyGate`, `equipFits`). Riggen heter `tral`.
  - **Slepet (V2, og V6 A fra `havsteget.md`):** «Sett ut» på tråleren åpner slepet: spilleren trykker hvor det skal ende (en rett linje fra der båten er), eller velger retning og lengde. Linja prøves mot land, dybden trålen tåler og reglene før hun skyter (varsel før feil, 5.29b). Båten skyter (om lag 20 minutter, antatt), sleper langs linja i 3,5–4 knop, og haler ved enden (om lag 30 minutter, antatt), eller når spilleren trykker «Hal». Den som vil, tar rattet under slepet; da følger trålen båten. Slepet er én tilstand på båten (`b.tow`: start, retning, fart, når, fangsten så langt), ikke et sett i `S.sets`, og går videre mot den felles klokka når spillet er lukket (`catchUp`): et slep som er ferdig mens spilleren var borte, er halt og fisken i mottaksbingen.
  - **Fangsten:** per minutt av slepet: tettheten av hver art der trålen er (`density`), ganget med arealet trålen dekker (farten × bredden mellom vingene, 18 m etter arbeidsgruppen, og en faktor for det dørene og sveipene jager inn, kalibrert), høyden (4–6,5 m mot `gearVertF`: torsk, hyse og sei som står over bunnen i uvær, går over trålen) og seleksjonen i maske og rist (en kurve per art etter lengden, antatt til en kilde er lest). `takeStock` tar av den felles bestanden. Hver fisk får lengde som i dag (`lwKg`), så det som går gjennom rista, og det som blir igjen under minstemålet, er tall og ikke prosent.
  - **Kalibreringen:** mot sedlene i kap. 2b for fartøyene på 55–65 m: 25 t rund vekt per turdøgn over året (17–38), om lag 39 t i februar–april og 17–20 t i oktober–desember på torsk og hyse, og artsblandingen per hovedområde og måned (Nordkappbanken, Vest-Finnmark, Røstbanken–Malangsgrunnen, Bjørnøya, Helgelandsbanken, Storegga, Øst-Finnmark, Thor Iversens Bank). `tools/npc/fiske.py` tar lokasjonene for trål 28 m og over (i dag bare hovedområdet), så eggakanten får fisken sedlene viser.
  - **Snabeluer (V4):** ny art `snabeluer` (i dag er `uer` én art), med utbredelsen fra sedlene (eggakanten og Nordkappbanken, 400–600 m), fartøykvoten 1 206 t, 20 % bifangst i enkeltfangster og trålforbudet 1.3–9.5 (J-44-2026, leses ordrett i fasen sammen med § 15). Blåkveite: fartøykvoten 56 t som også dekker bifangsten (J-241-2025 § 8).
  - **Småfisken:** størrelsen på torsk, hyse og sei får variere med feltet og måneden, så et hal kan ha over 15 % under minstemålet. Grunnlaget er feltene Fiskeridirektoratet har stengt (Spitsbergenbanken, Nordsnaget, Sotbakken, Røstbanken) og størrelsene i sedlene; hvor mye, er antatt og måles mot hvor ofte felt stenges.
  - **Reglene ved skyting og under slepet** (`rulesAt` med `gear:'tral'`, prøvd langs hele slepelinja):
    - forbudt innenfor 12 nm (havressurslova § 20), med § 62 (6–12 nm for fartøy inntil 1 200 BT; båten får `bt` i dataene, og spillets tråler er over);
    - § 56 a (Jennegga–Malangsgrunnen 20.10–20.3) og b (Storegga, over 35 m, hele året);
    - § 16 (dybden innenfor grunnlinja), for senere og mindre trålere;
    - § 58 (finnes), de stengte områdene ved Svalbard (finnes) og korallrevene (J-78-2023, nytt lag);
    - de stengte feltene for torsketrål (lag 0 i `rules.json`, hentet på nytt med `tools/rules/fetch.py`; feltene fra J-167-2026, J-193-2026 og J-180-1993);
    - dypere enn 1 000 m krever spesialtillatelse (J-61-2019 § 4): ingen skyting der;
    - torsk og hyse ved Jan Mayen (J-4-2020), og kveita fredet 20.12–20.4 (§ 39).
  - **Reglene etter halet:** § 49 (15 % torsk, hyse og sei under minstemålet i antall): fangstdagboka sier andelen, og over grensen får spilleren rådet «skift felt» (ingen plikt er funnet; Kystvakta ser på det i H4f). 30 kg koraller eller 400 kg svamp i et hal (J-61-2019): stopp, meld og flytt minst 2 nm; hvor ofte det skjer, følger korallrevene og svampområdene i dataene, ellers sjelden (antatt). Alt som er dødt, skal i land (§ 51).
  - **Kvotene:** reglene per år som data, slik snøkrabben fikk dem i H3a: 2026 fra J-187-2026 (372, 332 og 422 t per faktor), 2027 fra forslaget (423 t torsk og 370 t hyse; seien skalert med norsk kvote til tallet er funnet), kvotefleksen på 10 % i lagringen (§ 6a), og deretter spillets egen bestand (`codChain`, `tacOf`). Registeret rettes til 35 tillatelser og 87,89 kvotefaktorer (`HREG.tral`, `HAVKF.tral`; en migrering som `20261106120000_snokrabbe_30.sql`, kjørt på testprosjektet av Jonas og i produksjon før slippet).
  - **Kjøpet:** `lock` tas av tråleren.
- **Filer:** ny `core/10f-trawl.js` (inn i malen etter `10e-krabbefabrikk.js`), `core/02-species-gear.js`, `core/10-gear.js` (`buyGate`, riggen), `core/03e-rules.js`, `core/03d-quota.js`, `core/03f-fiske.js`, `core/05-vessels.js` (minuttet og `catchUp`), `core/05d-hav.js` (NPC-trålerne tar snabeluer), `tools/npc/fiske.py` og `src/data/fiske.json`, `tools/rules/` og `src/data/rules.json`, `ui/08-actions.js`, `ui/10-gear-ui.js`, `ui/03-map.js` (slepelinja), `ui/phone/10-fartoy.js`, `ui/phone/07-patch.js`, ny migrering, `tests/run.py` (`COVER`).
- **Tester:** ny `tests/unit/trawl.test.mjs` (fangst per time og per døgn mot sedlene per felt og måned, seleksjonen, § 49 i et hal, linjene: 12 nm, § 56 med datoene, § 58, stengt felt, 1 000 m; kvotene per år og registeret med 35; skrives og ses rød mot koden før fasen), `rules.test.mjs`, `havlic.test.mjs`, `hav.test.mjs`, ny `tests/traltest.py` (kalibreringen på feltene, ett slep skutt, slept og halt, slepet som går mens spillet er lukket, reglene på stedet, skjermbilder av slepelinja i kartet og «Sett ut» i begge formater), `geartest`, `sqltest`.
- **Måles:** tonn per slepetime og per fiskedøgn på de åtte hovedområdene i februar, april, juni og november mot sedlene; artsblandingen; andelen under minstemålet per felt; at slepet ikke krysser land eller linjer; minuttets tid i kjernen med et slep ute (kravet om 5 000 spillere, `havsteget.md` kap. 5).
- **Stikkprøver:** slep på Nordkappbanken, vest av Troms (eggakanten), ved Bjørnøya (utenfor 20 nm), på Helgelandsbanken og på Storegga (§ 56 b stopper tråleren der).

### H4b Drift om bord: fabrikken, turen, lotten og lossingen (steg 32b)

- **Hva:**
  - **Fabrikken:** fangsten fra posen går i mottaksbingen, bløgges, sløyes og hodekappes (`gutMachine`), fryses i platefryserne (`freezeT`) og pakkes i sekk på 50 eller 25 kg. Kapasiteten settes så fabrikken, ikke trålen, er grensen på de beste døgnene (sedlene: 39 t rund vekt per turdøgn i februar–april, kvartilen 47): om lag 40 t produkt i døgnet (60 t rund vekt torsk), antatt; ingen norsk kapasitet for 60 m er funnet. Er bingen full, venter neste hal. Ingen filet (konsesjonsforskriften § 2-3; 7 % av fangsten i sedlene).
  - **Produktvekt i rommet, rund vekt på kvoten og prisen** (V2 A fra H2): faktorene fra sedlene, torsk 1,50, hyse 1,40, sei 1,35, snabeluer japankuttet 2,0 og blåkveite 1,5. Rommet på 800 t produkt holder om lag 1 100 t rund vekt (sedlene: største landing i klassen 1 089 t).
  - **Prisene:** `pmF` finnes for torsk, hyse og sei; nytt for snabeluer og blåkveite, per måned fra sedlene 2024 og 2025 (2026 når fila har beløp).
  - **Mannskapet og vaktene:** 19–21 om bord etter sedlene (i dag 25 i `VESSELS`: ni nøkkelfolk, fire på dekk og tolv i fabrikken); tallet rettes mot sedlene. Døgndrift i to vakter (Jonas 07.11.2026), som autolineren.
  - **Lotten:** oppgjørsavtalen for trål er ikke funnet. Søkes på nytt i fasen (Fiskebåt og Fiskarlaget var stengt i tidligere økter); finnes den ikke, settes en flat prosent som står mot lønnsomhetsundersøkelsens 28,9 % av inntektene, og merkes som antatt (`OPPG.tral`, `fisheryOf`).
  - **Turen:** turkortet med drivstoffet (900 l i timen under slep, generatorene ellers, `plantLph`), provianten for 30 døgn og emballasjen; en tur er om lag 19 døgn og 400 t rund vekt etter sedlene.
  - **Mottakene (V5 B, Jonas 11.11.2026):** to nye havmottak bare for havflåten, i Ålesund og på Sortland, der 36 og 10 % av den fryste trålfangsten landes (kap. 2b), lagt inn som de 13 havmottakene fra H0 (4.18c i `havner-og-mottak.md`; `tools/mottak/`, kaia fra registeret, plassert etter reglene i `docs/handelssteder.md`, navn etter stedet og aldri etter et firma). Med de ni som tar tråleren i dag blir det elleve. Det nye mottaket tar alle havbåtene kaia og redskapet passer for, ikke bare tråleren.
  - **Lossingen:** paller med båtens kran, som H2d2, ved mottakene som tar tråleren.
  - **Rapporteringen** (ERS, J-204-2025): fangstdagboka sender fangstmeldingen hver dag og meldingen om havneanløp to timer før, av seg selv, og meldingen om fiskestart i Svalbard-sonen 12–24 timer før; spilleren ser dem i dagboka. Ingen straff for noe spillet gjør selv.
- **Filer:** `core/10f-trawl.js`, `core/02-species-gear.js`, `core/05-vessels.js` (fabrikkens minutt), `core/04-crew.js` (`OPPG`, turen), `core/07-harbours.js` (lossingen), `tools/mottak/`, `src/data/mottak.json`, `core/06b-coastports.js` og `tools/steder/` om noe må flyttes (de to havmottakene), `core/03-simulation.js` (`sell`), `ui/05b-work.js`, `ui/phone/10-fartoy.js`, `ui/phone/04-kvote.js`, `ui/phone/07-patch.js`.
- **Tester:** ny `tests/unit/tralfabrikk.test.mjs` (kapasiteten, faktorene, rommet, prisene, lotten; sett rød først), ny `tests/tralfabrikktest.py` (et døgn med fem hal gjennom fabrikken, turkortet, lossingen, Kvote-appen, skjermbilder i begge formater), `fabrikktest`, `landtest`, `selltest`; for de to havmottakene `havsteg.test.mjs`, `havntest`, `stedertest` og `placetest`, med skjermbilder av Ålesund og Sortland i begge formater.
- **Måles:** kroner per turdøgn og per tur mot sedlene (26 kr/kg over alle arter i 2024) og undersøkelsen (187,7 MNOK i året med reker og alt), lotten per mann, og drivstoffet mot 17 % av inntektene.

### H4c Trål i Driftsplan 2 (steg 32c)

- **Hva:** havbåtens sløyfe døgnet rundt (H2c, H3c) får slep: spilleren legger ett eller flere slep på et felt (linjer i kartet), og planen skyter, sleper, haler og snur, så lenge fabrikken har plass, til rommet er fullt, kvoten for en art er tatt eller turen er slutt; så går hun til mottaket, losser og ut igjen. Planen flytter til neste slep når et hal har over 15 % under minstemålet eller koraller, holder seg unna stengte felt og linjene, tar ikke snabeluer 1.3–9.5, og ligger bi over værgrensene (4.12j i `autonav.md`). Kvotebudsjettet per art (torsk, hyse, sei, snabeluer, blåkveite) vises som for snøkrabben.
- **Filer:** ny `core/06j-plan2-tral.js` (inn i malen etter `06i-plan2-sno.js`), `core/06g-plan2.js`, `core/06h-plan2-engine.js`, `ui/05d-plan2.js`, `ui/phone/07-patch.js`.
- **Tester:** `tests/unit/havplan.test.mjs` (nye deler for trål: en tur på 19 døgn, kvoten som grense, flyttingen etter et hal med småfisk, § 56 i perioden; sett rød først), `havplantest` (ny del), `driftsplan2ui`, skjermbilder av siden og kartkortet i begge formater.
- **Måles:** tonn per tur og døgn per tur med planen mot sedlene (414 t, 19 døgn), og en sesong (et år) mot fartøykvoten med ukas tillatelse.

### H4d Blender-modellene (steg 32d)

- **Hva:** tråleren revideres etter pilotens arbeidsmåte (leselista i `docs/skipsmodeller/leseliste.md`, `/blender`), slik snøkrabbefartøyet ble i H3d1: grunnlag og avviksliste (`docs/skipsmodeller/tral-grunnlag.md`, `tral-bygging.md`), skroget som én flate mot 2 200 t, tråldekket med slippen, galgene, vinsjene og nettrommelen, lanternene etter vedlegg I, kit-plassene i modellen, og tre detaljnivåer. Redskapet som egne modeller: trålen med vinger, belg, forlengelse med rista og pose, rockhoppergiret, dørene, sveipene og varpene; posen full og tom; fangsten i mottaksbingen; pallen med sekker. Ingen fabrikk eller rom under dekk (CLAUDE.md), og ingen redskap modellert inn i skroget utenom skipets egne systemer (vinsjer, galger, trommel).
- **Filer:** `tools/boats/tral60.py`, ny `tools/gear/tral.py`, `tools/deck/pall.py`, `src/data/*.b64`, malen, `vessel3d.js`, `docs/skipsmodeller/`.
- **Tester:** ny `tests/h4dshot.py` (3D alene; sett rød først), `tral3d`, `vessel3d`, `crewclip` (rød på `bunntral` i dag), kontrollbildene fra `tools/boats/qa/`, skjermbilder i begge formater.

### H4e Animasjonene: skyting, sleping, haling og lossing (steg 32e)

- **Hva:** spillerens tråler tegner trålen fra spillets egen tilstand: `b.tow` gir `drawTrawl` tilstanden (`lo`, `ro`, `net`, `cod`, `full`, `tow`) i stedet for den lokale klokka i `TRAWL`, slik NPC-ene får `NPCTOW`. Skytingen: posen og nota ned slippen, sveipene ut, dørene av galgene og varpene ut til tre ganger dybden (antatt). Slepet: varpene stramme akterover og lanternene for tråling. Halingen: varpene inn, dørene i galgene, nota på trommelen, posen opp slippen og tømt i luka til mottaksbingen, med folkene på dekk. Under vann: dørene, trålen og posen på bunnen slik dybden er. Lossingen med båtens kran. Det samme for NPC-trålerne der det er billig.
- **Filer:** `view3d/20-trawl-seine.js`, `view3d/10-gear.js`, `view3d/09-landing-deck.js`, `deckcrew.js`, `ui/phone/07-patch.js`.
- **Tester:** `h4dshot` (nye deler; sett røde først), `tral3d`, `landtest`, `deckshot`; skjermbilder i begge formater av hver fase. Ingen videoopptak (Jonas 09.11.2026).

### H4f Kystvakta, hele turen og stikkprøvene (steg 32f)

- **Hva:**
  - **Kystvaktas havsjekk for tråleren** (`kvTralCheck` i `core/09j-kystvakt.js`, bygd som `kvHavCheck` og `kvSnoCheck`, 5.30b og 5.30c): posisjonen langs slepet som pågår og de siste slepene i fangstdagboka (12 nm, § 56, § 58, stengte felt, sårbare økosystemer og korallrev, 1 000 m); redskapet (maskevidden målt etter § 3 mot 130 mm, rista og spileavstanden for området, stroppene); fartøykvotene for torsk, hyse, sei, snabeluer og blåkveite med kvotefleksen; bifangsten i siste hal (snabeluer 20 %, og satsene i Svalbard-sonen); stikkprøven av siste hal mot minstemålene (§ 47) og 15 % (§ 49), og om hun har skutt igjen på samme felt etter et hal over grensen; koraller og svamp; og fangstdagboka (dagens fangstmelding, § 12 i ERS-forskriften). Skipet ligger av babord og setter over inspektører under slepet, som i dag.
  - **Hele turen** i `tests/havtur.py` (`havtur.py tral`): kjøp med tillatelsen, ut fra Tromsdalen, slep på eggakanten, fabrikken, Kystvakta om bord, hjem og lossing.
  - **Stikkprøvene:** turer fra Båtsfjord (nord), Tromsdalen eller Melbu (midt) og Selje eller Avaldsnes (sør), blant mottakene som tar båten, og en tur fra Storegga eller Helgelandsbanken til Ålesund og en til Sortland (V5 B); skjermbilder i begge formater.
  - Patchnotes.
- **Filer:** `core/09j-kystvakt.js`, `core/10f-trawl.js` (stikkprøven av halet), `ui/phone/08-home-papers-merker.js`, `ui/phone/07-patch.js`, `tests/havtur.py`.
- **Tester:** `tests/unit/kystvakt.test.mjs` (ny del `tral`; sett rød først), `kystvakttest`, `havtur`.

## 4. Valgene

Hvert valg har én anbefaling og én setning om hvorfor. Valgene er tatt 11.11.2026 (Jonas 11.11.2026: «V1: A», «V2: A», «V3: A», «V4: A», «V5: B»). Bare det Jonas må ta, står her; resten følger valgene fra `havsteget.md`, H2 og H3 (seks økter med `/lever` etter hver, reglene per år som data, produktvekt i rommet, lagene i to vakter).

**V1 Hvilken trål som kommer først** (valgt: A, Jonas 11.11.2026)
- **A (anbefalt): én stormasket bunntrål med rist, for torsk, hyse og sei** (og snabeluer etter V4). Det er det tillatelsen og båten er laget for, og 97 % av det flåten leverer, er tatt slik og fryst om bord.
- **B: dobbeltrål** (to tråler side om side med et lodd mellom). Vanlig på de nyeste trålerne, men sedlene har nesten ingen landinger ført som dobbeltrål, og modellen har én slipp.
- **C: også flytetrål** (pelagisk trål etter uer og sei). Det er H5.

**V2 Hvordan slepet styres på nettbrettet** (valgt: A, Jonas 11.11.2026)
- **A (anbefalt): ett trykk i kartet for hvor slepet skal ende.** Linja fra båten tegnes og prøves mot land, dybde og regler før hun skyter; «Hal» tar den inn når som helst, og rattet kan tas under slepet. Det virker med berøring i begge formater, og et slep går videre når spillet er lukket.
- **B: retning og tid** («slep 4 timer på 045°») uten kart. Enklest, men spilleren ser ikke hva slepet krysser.
- **C: en tegnet linje med flere knekkpunkter** langs en dybdekote. Mest likt virkeligheten, men mer å gjøre for hvert hal; knekkpunktene kommer uansett i Driftsplan 2 (H4c).

**V3 Reketrål** (valgt: A, Jonas 11.11.2026)
- **A (anbefalt): ikke i H4, en egen plan senere.** Reketrål er egen tillatelse, eget redskap (35 mm og rist med 19 mm), en art spillet ikke har, og innsatsregulert i døgn ved Svalbard; det er et helt steg. Det fyller sommeren for den virkelige flåten (30 000–49 000 t i året, april–september), så det bør komme.
- **B: med som en sjuende fase i H4.**
- **C: aldri.**

**V4 Snabeluer** (valgt: A, Jonas 11.11.2026)
- **A (anbefalt): med som egen art fra H4a.** Trålerne tok 25 000–39 000 t snabeluer i året, mer enn torsk i 2025 og 2026, og uten den får spillerens tråler en tredel mindre å fiske på enn flåten har. Reglene (fartøykvoten 1 206 t, 20 % bifangst, forbudet 1.3–9.5 og § 15) leses ordrett først.
- **B: bare torsk, hyse og sei** (og dagens `uer` som bifangst). Raskere, men turen blir fattigere og året kortere.

**V5 Hvor fryst trålfangst landes** (valgt: B, Jonas 11.11.2026)
- **A (anbefalt): der kaia passer, som for snøkrabben** (V2 C i H3, Jonas 06.11.2026): de ni mottakene i dag, med Tromsdalen for Tromsø, og ingen nye havner. Det følger det Jonas valgte sist.
- **B: også Ålesund og Sortland som havmottak**, der 36 og 10 % av den fryste trålfangsten landes. Mer likt virkeligheten og kortere vei fra Storegga og Helgelandsbanken, men to nye havner gjennom datarørledningen for mottakene.
- **C: bare der sedlene har trålfangst** (Tromsdalen, Båtsfjord, Melbu og Senjahopen blant dagens ni).

## 5. Antatt eller usikkert

- **Slepet:** slepetiden (4–5 timer), tiden for skyting og haling, varpelengden mot dybden, avstanden mellom dørene og hva dørene og sveipene jager inn, er ikke funnet i en kilde som kunne leses. Fangsten kalibreres derfor mot tonn per turdøgn i sedlene, ikke mot fangst per hal.
- **Turdøgnene** i sedlene er døgnene mellom landinger minus tre (antatt), og de har med vær, leting og flytting; fangsten per fiskedøgn er høyere. Hovedområdet står én gang per tur for frossen fangst, så artsblandingen per felt er grovere enn tabellen ser ut.
- **Seleksjonen** i 130 mm og rist (kurven per art) og **småfisken per felt og måned** er antatt til HI er lest.
- **Bruttotonnasjen** til spillets tråler finnes ikke; over 1 200 er vår vurdering av et 60 m fartøy.
- **Snabeluer:** J-44-2026 er lest av agenten, ikke i økta; forholdet til § 15 er ikke avklart.
- **Plikt til å skifte felt** ved over 15 % under minstemålet er ikke funnet; høringen fra 30.06.2026 kan endre § 49.
- **Havressurslova § 20** er et utdrag, ikke lest ordrett (Lovdata stengt).
- **Kvotene for 2027** er forslag; seien per kvotefaktor er ikke funnet.
- **Fabrikken:** 40 t produkt i døgnet er antatt. **Lotten** for trål er ikke funnet; 28,9 % er arbeidsgodtgjørelsen i undersøkelsen for en gruppe som også tar reker.
- **Mannskapet:** sedlene sier 19–21 om bord på 55–65 m; spillets 25 rettes i H4b.
- **Fryselagrene:** at mottaksnumrene i Tromsø, Ålesund og Sortland er nøytrale fryselagre, er lest av nummerserien, ikke av et register.
- **Kystvaktas kontrollpunkter** er satt sammen av forskriftene, ikke lest hos Kystvakten.
- **Koraller og svamp:** hvor ofte et hal får over 30 kg eller 400 kg, er ikke funnet.
- **Ytelsen:** et slep er en ny bevegelse per minutt i kjernen; måles i H4a.

## 6. Hva planen ikke gjør

- Ingen reketrål (V3 A: en egen plan senere), ingen flytetrål, dobbeltrål eller seitråltillatelse, og ingen fiske ved Grønland utover kvotene som finnes (`gl`).
- Ingen ferskfisktråler og ingen filet om bord.
- Ingen leveringsplikt (gjelder fartøy med leveringsvilkår, konsesjonsforskriften § 2-3 og J-148-2023).
- Ingen nye havner utenom havmottakene i Ålesund og på Sortland (V5 B), og ingen fryselagre som egne steder.
- Ingen navngitte nøkkelfolk med liv (H7), og ingen strukturkvote eller eiertak (H8; taket er tolv kvotefaktorer, § 2-4).
- Ingen fabrikk eller rom under dekk i modellen (CLAUDE.md: bare utsiden), og ingen ekte fartøynavn, rederier eller firmanavn.
- Ingenting selges for ekte penger.

## 7. Status

- 11.11.2026: planen skrevet på grenen `ccr-caa67856-3cmr94` (Jonas' økt, steg 32). Regelverket lest samme dag (høstingsforskriften i J-163-2026, J-187-2026, J-82-2024, J-28-2023, J-61-2019, J-78-2023, J-204-2025, J-148-2023, J-4-2020, J-167-2026, J-193-2026, saksdokumentene for 2027; havressurslova § 20 bare som utdrag), sedlene for 2024–2026 regnet ut, og driftstallene søkt opp. Fasene H4a–H4f står i køen som steg 32a–32f etter lanseringslinja, og startmeldingen for H4a i `docs/planer/start/32a.md`. **Venter på valgene V1–V5** (valg 37 i køen). Ingenting er bygd.
- 11.11.2026: **valgene tatt** (Jonas 11.11.2026: «V1: A», «V2: A», «V3: A», «V4: A», «V5: B»): V1 A (én stormasket bunntrål med rist), V2 A (ett trykk i kartet for hvor slepet skal ende), V3 A (reketrål ikke i H4, en egen plan senere), V4 A (snabeluer som egen art fra H4a) og V5 B (også Ålesund og Sortland som havmottak; lagt i H4b, og stikkprøvene i H4f går dit). Fasene over er rettet etter valgene. **Neste:** H4a (steg 32a) i en ny økt, etter lanseringen eller når Jonas sier det.
