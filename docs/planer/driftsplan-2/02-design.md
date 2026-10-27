# Driftsplan 2: designet (fase 1, 26.10.2026)

Dette er designet for den nye driftsplanen, skrevet etter revisjonen i `01-revisjon.md` og med `/planlegg` som ramme. Det sier hva en plan *er*, hva den *gjør*, hva spilleren *ser*, reglene for energi og skift, flere fartøy, valgene til Jonas, testplanen og delene som bygges én per økt. Ingenting her er bygd. Bestillingen og kravene R0–R10 står i `00-oppdrag.md`.

## 0. Det revisjonen sa, i én setning hver

1. Planen mangler dagen: motoren finner på dagen hver gang båten er ledig, og det siden viser, er noe annet.
2. Alt utenfor svarene finnes ikke for planen: egning, agn, mottaket i forhold til hjemmet, tapt redskap, en utsatt avgang.
3. Motoren trenger asynkrone søk (omvei, ly, ukjente leier) og stopper seg selv etter tre feil; lukket spill strander båten.
4. Siden kan ikke bli god før den viser det som skjer, og kartvalget avbryter seg selv ved et ekte trykk.

Designet svarer på de fire: **dagen blir planen**, **alt dagen trenger regnes ut når planen lages**, **motoren følger dagen uten søk og venter i stedet for å stoppe**, og **siden og kartvinduet viser og redigerer den samme dagen som motoren går**.

## 1. Modellen: hva en plan er

### 1.1 Svarene (det spilleren velger)

`S.ops` v4, ett per båt (`VKEYS` som før):

```
{v:4, on:false,
 home:'finnsnes', anchor:false,                      // hvor båten ligger om natta og mannskapet sover (som v3)
 rig:'line', jig:true,                               // ett redskap om gangen pluss juksa (14a, se valg 6)
 places:[                                            // plassene i den rekkefølgen båten går dem
   {id, k:'felt', x, y, n:2, soak:6, hdg:null},      //   et felt: antall enheter, ståtid i timer, retning på lenka (null = motoren velger)
   {id, k:'juks', x, y}],                            //   en juksplass
 wx:{wind:13, hs:2.5},                               // grensene i tall (R3), aldri over det båten tåler
 dep:5,                                              // avgang (R2)
 rhythm:'day' | 'watch' | 'multi', days:3,           // som v3
 land:{mode:'near' | 'port', port:null,              // nærmeste eller valgt mottak (R7)
       when:'trip' | 'full' | 'days', days:2},       // hver tur, når lasten er full eller fisken må leveres, eller hvert N. døgn (valg 7: spillerens valg, standard 'full')
 …}
```

Alt i v3 har en plass her, så en v3-plan føres over uten tap (1.5). Det nye: `places` er én liste i spillerens rekkefølge med felt og juksplasser om hverandre (rekkefølgen *er* dagen: «sett på felt 1, juks på J1, sett på felt 2 …»), feltet kan ha en retning på lenka, været er to tall, og leveringen har et mottak og en regel.

**Lenker** (R4): et felt setter `n` enheter som *én* lenke fra plassen i retningen `hdg` (graders sann kurs) med lengden redskapet gir (`cycleSpec`/`startSet` som i dag). Vil spilleren ha 18 garn i tre lenker, er det tre felt à 6, og det er slik bestillingen beskriver det («oppdelt i flere lenker på flere steder»). Ingen lenke lages av motoren uten et felt.

### 1.2 Dagen (det planen regner ut)

Dagen er lista over det båten skal gjøre, med klokkeslett, laget av **én** funksjon fra svarene og det som står i sjøen: `planDay(o, H0, state)`. Den samme funksjonen gir tidslinja på siden («I morgen går båten kl. 05:00, setter 2 stamper på felt 1 …») og motorens arbeidsliste. Det finnes ingen annen skisse.

```
day = {t0, steps:[
  {t:5.00, k:'avgang', from:'finnsnes'},
  {t:5.35, k:'sett',   place:'f1', n:2},
  {t:5.60, k:'sett',   place:'f2', n:2},
  {t:5.95, k:'juks',   place:'j1', until:11.35},       // til ståtida på f1 er ute
  {t:11.60, k:'trekk', place:'f1', soak:6.0},
  {t:12.35, k:'trekk', place:'f2', soak:6.2},
  {t:15.70, k:'lever', port:'botnhamn'},
  {t:16.70, k:'hjem',  port:'finnsnes'},
  {t:20.00, k:'egning', where:'finnsnes', ready:23.0},  // mannskapet egner i naustet
  {t:20.00, k:'hvile', until:29.0}],                    // til alle er uthvilt, senest neste avgang
 end:20.0, why:'dagen er 15 t'}
```

Reglene `planDay` følger, i rekkefølge:

1. **Start** kl. `dep` fra der båten ligger (hjem, eller der den endte i går: mottakskaia, en ly-kai, ankerplassen).
2. **Plassene i spillerens rekkefølge.** Et felt: står det redskap der, planlegges trekking når ståtida er ute, *tidligst* da (ingen slakk nedover; er båten der før, jukser den eller venter), og setting på nytt i samme omgang for garn og teiner, og for line når det er egnede stamper om bord. Står det ikke redskap, planlegges setting hvis redskapet er klart om bord (egnet line, agnede teiner, garn), ellers sies det («felt 2 får ikke redskap i dag: lina er ikke egnet») og feltet hoppes over. En juksplass får timene som er til overs der den står i rekkefølgen.
3. **Timene.** Seiling langs de lagrede leiene i marsjfart (ikke rett linje), redskapsarbeid med motorens egne tall (målt i revisjonen: garn 4,3 min/garn trekking og 1 min setting; line 20 min/stamp trekking og 5 min setting; teiner 1 min/teine begge veier; skrives som `DRP2.work` og brukes av *begge*), landing 1 t, bunkring og agn 10 min. Det som er igjen av dagen, går til juksa, fordelt på juksplassene i rekkefølge (spillerens egne tall vekter, som i dag).
4. **Dagens lengde** er den korteste av: `dep + 14 t`; den timen det mest slitne i mannskapet når 72 med 5 per time på sjøen (målt 4–6); den timen energien din når 15 % med 4,2 per time (når du er om bord); mørke-, vær- og ferskhetsgrenser gjelder ikke dagen, bare stegene. Dagen slutter *hjemme* (dagdrift), så hjemturen tas med før grensen.
5. **Leveringen** etter `land.when`: `trip` → til mottaket etter siste redskapssteg, så hjem; `full` → til mottaket bare når lasten ventes over 80 %, eller når den eldste fisken om bord ikke holder til neste dags landing (ferskheten fra D3, `keepF`), ellers hjem med fangsten i is; `days` → hvert N. døgn, og ellers som `full`. Dagen *sier* hva den gjør: «Leverer i Botnhamn» eller «Beholder 216 kg om bord til i morgen».
6. **Egning og agn** er steg i dagen, ikke bivirkninger: line egnes der båten ligger om natta av mannskapet (`egnSelf`, jobbsystemet, tar timene det tar med de hendene som er om bord), eller på egnebua hvis båten ligger ved et mottak over natta; agn til teiner kjøpes på mottaket når båten er der, for teinene om bord. Rekker ikke egninga avgangen, utsettes avgangen til den er klar, og dagen sier det («Går kl. 06:40 når lina er egnet»). Ingen stamp blir igjen i en annen havn.
7. **Døgndrift** (`watch`): dagen er 24 timer med to vakter à 6 (`DRWATCH`), uten hjem; `lever` når lasten er full eller ferskheten krever det, så rett ut igjen. **Flerdøgnstur** (`multi`): som dagdrift, men natta er `hvile` om bord (til ankers på store båter, ellers ved mottakskaia) i stedet for hjem, og hjem den siste dagen.
8. **To dager fram.** `planDay` kalles for i dag og i morgen (og dagen etter når noe står i sjøen med lang ståtid), så siden kan vise «I dag · I morgen · Fredag», og så ståtider over et døgn kommer riktig (garn 24 t: dag 1 setter, dag 2 trekker og setter).

Dagen lages på nytt ved hvert *dagsskille* (når båten ligger hjemme og venter på `dep`) og når noe bryter den (været, du tar over, et stopp). Mellom det følger motoren den som er lagt.

### 1.3 Det planen regner ut når den lages (`planMake`, asynkront, som `driftMake`)

- Mottaket etter `land.mode`.
- **Alle leier** mellom hjem, mottak, hver plass, og *ly-kaia* for hver plass (nærmeste kai som ikke er rorbu, med leia dit), med `leiaRoute`. Hver lei **kontrolleres med seilingens egen sjekk** (den som gir «Grunt vann forut» underveis, `pl.unsafe`/`isLand`/dybde langs leia) *når planen lages*, så en lei motoren ikke kan seile uten omvei aldri havner i planen; en plass som ikke har trygg lei, avvises med «Flytt plassen litt» der og da, ikke på sjøen tre døgn senere.
- Ankerplassene som i dag.
- `made.key` som i dag: endres svarene, lages planen på nytt før neste dag.

Alt som skjer *etterpå* (motoren) trenger ingen søk.

### 1.4 Statistikken (R9)

`o.stats = {days:[{d:'2028-03-06', trips:1, kg:216, kr:6223, lott:2087, cost:{fuel:761, bait:0, egn:2360}, conf:0, sp:{torsk:120, hyse:40, …}, port:{botnhamn:216}}], sum:{…samme felter…}}`, oppdatert ved hver landing (`opsReport`, fra `S.lastSale`) og ved hver utgift planen påfører båten. Høyst 60 døgn; summen holdes løpende. Lagres med planen.

### 1.5 Lagringene: v3 og eldre

Jonas valgte C (26.10.2026): **gamle planer slås av med melding**, som ved omleggingen 23.10 («nytt system, nye planer»). Når bryteren slås på (kapittel 7), gjør `plan2Ops()` med en v3- eller v2-plan det `driftOps()` gjør med en v2 i dag: `S.ops = null` og meldingen «Driftsplanen er laget på nytt. Den gamle planen for «…» er slått av. Lag en ny under Driftsplan. Redskapet i sjøen står der det står.» En v3-plan som er *på tur* når spillet åpnes, fullfører turen (`S.plan.ops` seiles ferdig av `sail`/`dock` som i dag) og slås av når båten er inne. Redskap i sjøen, mannskap, fangst og penger røres ikke; det som sto i `o.rep`, går tapt (statistikken begynner på nytt). Så lenge bryteren er av, røres ingen lagring. Ingen overføring v3 → v4 bygges.

## 2. Motoren: hva planen gjør

### 2.1 Grunnregelen

Motoren (`plan2Step`, hvert spillminutt fra `vesselStep` som `opsStep` i dag) holder **ett steg om gangen** fra dagen i 1.2, med tilstand `o.run = {day, i, since, wait:{k, until, no, en} | null}`. Hvert minutt:

1. Er det et stopp eller en pause, eller har du tatt over (`drTook`): gjør ingenting (som i dag; «Gi båten tilbake» fortsetter fra steget båten er på, 2.4).
2. Ligger båten på tur (`S.plan.ops`): ingenting; seilingen, redskapssyklusen og fisket er som i dag (`sail`, `gearCycle`, `fish`). Steget er ferdig når turen er det.
3. Ellers: prøv steget `i`. Kan det gå, start det (en tur med de lagrede leiene, et redskapsarbeid, en landing, hvile, egning). Kan det ikke, **vent med en grunn og et klokkeslett** (`o.run.wait`), aldri «tre feil og stopp». Er klokkeslettet passert, prøv igjen.
4. Ved dagsskillet: lag dagen på nytt (1.2) med det som står i sjøen nå.

Stegene og hva de trenger:

| Steg | Går når | Venter ellers med |
|---|---|---|
| avgang | været under grensene for dagens leier og plasser i dagens timer, mannskapet (eller du) er klare, redskapet er klart, verftet er ferdig, kaia er ledig | «Venter på været, prøver igjen kl. 06:00», «Lina er egnet kl. 06:40», «Mannskapet hviler til kl. 21:00» |
| sett / trekk | båten er på plassen; redskapet står (trekk) eller er klart (sett); ståtida er ute (trekk) | «Venter ved felt 1 til lina har stått 6 t (kl. 11:35)»; jukser imens hvis juksa er med |
| juks | reglene tillater det der (`ruBlockMsg`) | neste plass |
| lever | mottaket er åpent (`mottakOpen`), kaia er ledig | «Venter på kaia» |
| hjem / hvile / egning | – | – |

Det eneste som **stopper** planen (`o.on = false`, med grunn og knapp, som i dag): ingen skipper og styrmann når du ikke er om bord; haleren mangler; et felt stengt av reglene uten dato; torskekvoten oppbrukt; ikke penger til agn eller diesel. Et stengt felt med dato (`rulesAt`) *venter* til datoen og sier det. Alt annet venter.

### 2.2 Når noe går annerledes

- **Været ved avgang:** varselet (`windAt`, `hsAt`, deterministiske) sjekkes for dagens leier og plasser over de neste 5 timene (`DRP2.fcH`; bygd 27.10.2026: med hele dagen i varselet ville en kuling kl. 11 holdt båten hjemme kl. 05, og lyet aldri blitt brukt). Over grensen: venter til den første timen varselet er under, høyst `dep + 8 t` (`DRP.late`); etter det hoppes dagen over med «Dagen går ut: været» og neste dag planlegges. Ventingen forkorter ikke ståtida: dagen lages på nytt fra den faktiske avgangen.
- **Været underveis:** `driftWx` som i dag utløser vendingen, men **uten søk**: båten går tilbake langs sin egen kjølvannslinje (`S.trail`, som `startReturn(home)`) til forrige plass eller havn, og derfra den lagrede leia til plassens ly-kai (1.3). Står det redskap i sjøen, blir det stående; dagen lages på nytt når været tillater avgang fra ly-kaia, med trekking først, når ståtida er ute. Kuling i varselet (over 17 m/s innen 36 t, `gearCycle`) tar redskapet med hjem som i dag.
- **Slitne:** dagen er planlagt så ingen når 72. Når det likevel skjer (sjøen, kulde, mat), avsluttes juksinga, det som skal trekkes *og har stått ståtida*, trekkes, resten står til i morgen, og båten går inn (som `drSea` i dag, men redskap med gjenstående ståtid trekkes ikke).
- **Full last:** `endFishing('full')` som i dag; motoren hopper til `lever` (eller `hjem` når `land.when` sier det) og fortsetter dagen etterpå hvis det er tid.
- **Stengt felt, kvote:** 2.1. Ingen ulovlig fangst: reglene sjekkes per plass før avgang og ved hvert steg, som i dag.
- **Redskap tapt:** feltet merkes «tapt» i planen med dato, dagen sier «felt 2: redskapet er tapt, meld det til Kystvakten», planen går videre med resten.
- **Mannskapet slutter:** når skipper eller styrmann forsvinner, stopper planen med grunn (som i dag). Ny: det *varsles* dagen før (krangelen, oppsigelsen finnes i `14-crewlife.js`) som en linje i dagen: «Trond mønstrer av i morgen; utnevn ny styrmann».
- **Du tar over** (2.4).
- **Spillet lukket** (2.3).

### 2.3 Lukket spill (R0, S9)

`catchUp` spiller `step()` minutt for minutt i én løkke. Motoren bruker aldri `await` og aldri et søk, så den gjør *nøyaktig* det samme i den løkka som i `tick()`. Det som sikrer det:

- alle leier og ly-leier er regnet ut ved laging (1.3), kontrollert mot seilingens sjekk, så «Grunt vann forut» ikke utløses på dem;
- vendingen i vær går langs kjølvannslinja og lagrede leier (2.2);
- en lei planen ikke har (båten endte et sted planen ikke kjenner, for eksempel etter at du tok over og la henne et annet sted), søkes *når spillet er åpent*; lukket står båten der hun er, og dagen etter oppstart begynner med «Finner veien …». Det er den ene resten av asynkront arbeid, og den oppstår bare når spilleren selv har flyttet båten.

Målet som testes (S9): sju døgn lukket gir samme landinger (kg og kr), samme redskap i sjøen, samme hvile og samme sted som sju døgn åpent, med samme frø, innenfor 2 % på kg (fiskemodellen trekker tilfeldige tall per minutt; motoren trekker ingen). Avspillingen av ni døgn tar under 10 s (målt 2,4 s i dag).

### 2.4 Du tar over, og flere fartøy

Som i dag: din egen rute, Autonav, «Stopp» eller roret setter planen i vent (`held`), redskapet i sjøen står, og «Gi båten tilbake til planen» lager dagen på nytt fra der båten er (ikke fra steget den var på), med trekking av det som står når ståtida er ute. Ligger båten et sted uten lei i planen, søkes leia (2.3).

Flere fartøy: motoren er per båt (`onVessel`), dagen og statistikken ligger i hver båts `S.ops`. Det som er *likt*: dagen, været, reglene, leveringen, hvilen. Det som er *ulikt* på båten du er om bord: du er skipper (ingen styrmann trengs), energien din teller i dagen (3), adgangen i åpen gruppe følger deg (torsk, hyse og sei på kvoten bare med deg om bord), og «Mens du var borte» viser din båts turer først. De andre krever skipper og styrmann som i dag. Rederi (4.4).

## 3. Energi og skift (R8): reglene med tall

Tallene er spillets egne (`15-energy.js`, `04-crew.js`, `06d-drift.js`), målt i revisjonen; ingen kommer fra en kilde utenfor spillet, og de justeres i spilltesting (`CLAUDE.md`).

- **Din energi** faller 4,2 % per time på sjøen (`ENERGY.sea` = 100 % på 24 t) og stiger 12,5 % per time i køya ved kai (`ENERGY.quay`), raskere på rorbu. Under 25 % går arbeidet tregere (`ENERGY.warn`), ved 0 sovner du i 8 t (`ENERGY.sleep`).
  - **Avgang med deg om bord krever** energi ≥ 15 % + 4,2 % × dagens timer (for en dag på 10 t: 57 %). Ellers venter planen: «Du må hvile til kl. 07:00 før dagen kan begynne» (hvilen i køya eller naustet regnes inn).
  - **Fisket stopper ved 15 %** (`ENERGY.dim`): juksinga avsluttes, det som har stått ståtida trekkes, båten går inn. Ingen fisker tom for energi; det er R8.
  - Det gjelder bare når du er om bord. Mannskapet alene styres av slitenheten.
- **Mannskapets slitenhet** (`fatigue`, 0–100) stiger 3–6 per time på sjøen (6 under fiske, ×1,25 om natta, ×1,1 i åpen båt), og faller 8 per time i hvile (12 om natta, 25 ved kai med køyer eller rorbu).
  - **Avgang krever** alle ≤ 25 (`DRP.rested`).
  - **Dagen planlegges** så ingen passerer 72 (`DRP.tired`) med 5 per time: fra 10 gir det 12 timer, fra 25 gir det 9. Det er derfor dagen «er 14 t» bare når mannskapet er helt uthvilt.
  - Slitne midt på dagen: 2.2.
- **Skipperen går dagvakt, styrmannen natt** (Jonas 26.10.2026). Dagvakta er 06–18, nattvakta 18–06 (`DRP2.dayFrom`, `DRP2.watch` = 12). På dagdrift er skipperen (du, når du er om bord) våken hele dagen: en dag planlegges aldri slik at du må sove mens mannskapet jobber (energiregelen over), og de stegene som går om natta (hjemturen etter kl. 18, natta til ankers på flerdøgnstur) går under styrmannen.
- **Døgndrift** (`watch`, Jonas 26.10.2026): minst fire om bord (skipper, styrmann, to på dekk), styrhus (`V.watch`), og **køyer til alle om bord** (`berths` ≥ mannskapet pluss deg når du er med; i dag kreves bare halvparten). **To vakter à 12 timer:** vakt A er skipperen (eller du) og halve dekket, 06–18; vakt B styrmannen og resten, 18–06. Den som har fri, sover i køya (−8 per time, −12 om natta) og regnes **som om bord** (rettelsen av «Rune har fri, så båten venter»). Med 12 timer på vakt stiger slitenheten til rundt 40–60 ved vaktskiftet (3–6 per time) og faller til 0 i løpet av frivakta; ingen når 72. Tre i mannskapet avvises med «Døgnet rundt krever fire …», for få køyer med «Køyer til alle: båten har 4, dere er 5». Dagen viser vaktene: «06–18 vakt A: Stian og Roger · 18–06 vakt B: Rune og Kjell».
- **Flerdøgnstur:** som dagdrift per dag, hvile om bord om natta (køyer: 25/t ved kai, 21/t til ankers).

## 4. Det spilleren ser og gjør

### 4.1 Siden (Driftsplan-appen)

Dagen øverst, svarene under, statistikken nederst. Skissen (stående):

```
Driftsplan · «T-333-LK»                          [På · trykk for pause]
Nå: Jukser på plass 1 (til kl. 11:35)

I dag · man 6. mars                         I morgen ›
 05:00  Går fra Finnsnes
 05:21  Setter 2 stamper på felt 1
 05:43  Setter 2 stamper på felt 2
 05:59  Jukser på J1 til lina har stått 6 t
 11:35  Trekker felt 1, setter på nytt     ← nå
 12:20  Trekker felt 2, setter på nytt
 15:40  Leverer i Botnhamn
 16:40  Hjem til Finnsnes
 20:00  Mannskapet egner 4 stamper · hviler til kl. 05:00
 Dagen er 15 t: Roger er slitne (72) kl. 20:10.

Hjem        Finnsnes (naustet)                    ›
Redskap     Line, 4 stamper · og juksa            ›
Plasser     2 felt, 1 juksplass · Velg i kartet   ›
Levering    Nærmeste mottak (Botnhamn) · hver tur ›
Vær         Inntil 13 m/s og 2,5 m                ›
Rytme       Dagdrift · ut kl. 05:00               ›
Mannskap    Du er skipper, Per er styrmann        ›

Statistikk · siste 7 døgn            i dag  7 døgn  alt
 Fangst                              216 kg  1 460   …
 Inntekt etter lott                3 875 kr  …
 Utgifter (diesel, agn, egning)    3 121 kr  …
 Arter                        torsk 55 %, sei 25 %, hyse 12 %
 Turer / leveringer                     1 / 1   7 / 7
 Mottak                          Botnhamn 216 kg
 [søyler kg per døgn]
```

- **«Nå»** er steget båten er på, med klokkeslettet det slutter, eller det den venter på med klokkeslettet den prøver igjen. En venting eller et stopp står i rødt/gult med knappen som løser det (som i dag).
- **Dagen** er `planDay` (1.2), ett steg per linje, «← nå» på steget båten er på; i morgen i en fane ved siden av. Under dagen én linje om *hvorfor dagen er som den er* («Dagen er 15 t: …», «Leverer ikke i dag: lasten blir 40 %», «Går kl. 06:40: lina er egnet da»). Når noe ikke får plass (et felt uten redskap, en juksplass uten timer), står det som en grå linje med grunnen.
- **Radene** som i dag, med tre endringer: *Plasser* åpner kartvinduet (4.2) og viser lista med felt og juksplasser i rekkefølge med ↑↓, antall og ståtid; *Levering* har valgene nærmeste/valgt mottak (de tre nærmeste pluss søk) og regelen hver tur/full/hvert N. døgn; *Vær* har to tall med −/+ i trinn (1 m/s, 0,5 m) innenfor det båten tåler, og de tre gamle forvalgene som snarveier.
- **Statistikken** (R9) som skissen: i dag, sju døgn og alt, kg, kr etter lott, utgifter, arter (de tre største i prosent), turer og leveringer, per mottak, og søylene.
- Rytme og Mannskap som i dag; døgndrift viser vaktene i dagen.
- Kopiering og sletting som i dag.
- Stående og liggende: radene bryter som i dag; på telefonen er dagen og statistikken hvert sitt kort som kan slås sammen («Vis mer»).

### 4.2 Kartvinduet (R4)

Kartplotteren i **planmodus**: åpnes av «Velg i kartet» i Plasser-raden (valg 4), og åpner seg selv (`openPlotter`), slik at spilleren ikke må finne den lille plotteren. Tilstanden ligger i plotteren (`PLANMAP = {vid, tool}`), ikke i siden, så en ny tegning av siden kan ikke avbryte den (feilen fra #95).

```
┌─ Driftsplan: plassene til «T-333-LK» ──────────────────────── [Ferdig] ─┐
│ [Felt] [Juksplass]   Trykk i kartet for å legge til · dra en nål for å  │
│                      flytte · trykk en nål for antall og ståtid         │
│                                                                         │
│      ⌂ Finnsnes                 ① ─── (lenka 6 garn, 180°)              │
│                                   J1                                     │
│                        ②                                                │
│                                            ⚓ Botnhamn (mottak)          │
│ ┌─ Felt 1 ─────────────────────────────────┐                            │
│ │ 6 garn [−][+]  ståtid 24 t [−][+]         │                            │
│ │ lenka 180° [↶][↷]  ↑ ↓ i rekkefølgen       │                            │
│ │ 1,3 nm fra hjem · sist 15 kg per garn     │                            │
│ │ [Fjern]                                   │                            │
│ └───────────────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

- Hjem (⌂), mottaket (⚓), feltene (①②… med lenka tegnet som strek i retningen), juksplassene (J1, J2 …) og leiene mellom dem (tynne) er tegnet; rekkefølgen er nummerert.
- **Trykk** i sjøen legger til en plass av typen som er valgt (Felt/Juksplass); land, grunt vann og stengte plasser avvises med grunnen (som i dag). **Dra** flytter nålen. **Trykk på nålen** åpner kortet (antall, ståtid, lenkeretning, rekkefølge, fjern). **Ferdig** går tilbake til siden; dagen regnes ut på nytt der.
- Egne fangstprikker (siste to uker) vises som i dag; ingen forventet fangst (Jonas 09.10 og 23.10).
- Virker med berøring i 384×853 (kortet nederst, verktøylinja øverst), 800×1280 og 1280×800 (kortet i sidepanelet). Målt med ekte trykk i S13.
- På rutepanelet (`panelRoute`) forsvinner «Plass til driftsplanen»-tilstanden; den erstattes av planmodus.

### 4.3 Stopp og venting

Tre nivåer, alltid med klokkeslett og grunn: *går* (steget og når det slutter), *venter* (hva og til når; planen fortsetter selv), *stoppet* (hvorfor og knappen). Push (`10g-push.js`) som i dag ved stopp, og i tillegg når en venting varer over et døgn («Driftsplanen har ventet på været siden i går»).

### 4.4 Rederi

Per båt: «Nå» (som i dag), neste steg med klokkeslett, dagens landing (kg og kr), og «Trenger deg» ved stopp. Lista er den samme dagen som planens side.

## 5. Valgene til Jonas

Svar A/B/C per nummer. Anbefalingen står først.

1. **Én fast dag som gjentas, eller en uke med ulike dager?**
   **A (anbefalt):** én dag som gjentas, og dagen tilpasser seg selv det som står i sjøen (garn: sett dag 1, trekk dag 2) og ståtidene. Enkelt å forstå, ett kartvindu, og det er slik S1–S3 er beskrevet. B: en uke med sju dager som kan være ulike (hviledag, andre plasser lørdag). Mer å sette opp og vise; kan legges på senere som «dager båten går». C: A nå, og «dager båten går» (sju brytere) i en senere del.
2. **Hva skjer med redskap i sjøen når planen settes på pause?**
   **A (anbefalt):** det står der det står; siden viser «18 garn har stått 31 t på felt 1–3» med knappen «Hent redskapet» (én tur som trekker alt og går hjem, uten å sette på nytt). B: pause trekker alt først, så stopper planen (kan ta en dag). C: pause er bare mulig ved kai uten redskap i sjøen.
3. **Mottak per plan eller per dag?**
   **A (anbefalt):** per plan: nærmeste eller ett valgt mottak, pluss regelen hver tur / når lasten er full / hvert N. døgn. B: per dag (bare meningsfullt med uka i valg 1 B). C: per plan, og i tillegg «nest nærmeste når det nærmeste er stengt» (mottakene har ingen åpningstider i spillet nå, så C gir ingenting i dag).
4. **Hvor åpnes kartvinduet fra?**
   **A (anbefalt):** fra Plasser-raden («Velg i kartet»), og det åpner plotteren selv og går tilbake med «Ferdig». B: også fra plotterens egen knapperad («Driftsplan») når en plan finnes. C: bare fra plotteren. A holder siden som det ene stedet; B kan legges til senere om spillerne leter.
5. **Gamle planer (v3)?**
   **A (anbefalt):** føres over automatisk (1.5) og står på hvis de sto på, med melding «se gjennom dagen». Ingen spiller mister en plan som gikk. B: føres over, men settes på pause til spilleren har sett dagen og trykket Start. C: slås av med melding som ved forrige omlegging («nytt system, nye planer»).
6. **Skal 14a stå (én redskapstype om gangen pluss juksa) når lenkene kan fordeles på flere plasser?**
   **A (anbefalt):** ja. Riggen er én (haleren), og ett redskap med flere lenker på flere plasser dekker bestillingen. B: to redskap i samme plan (garn og line) med omrigging i havn mellom dagene. Mer regler, lite gevinst nå.
7. **Standard for leveringen når en plan lages?**
   **A (anbefalt):** «når lasten er full eller fisken må leveres» (`full`): det sparer dagene på steder uten mottak (Finnsnes: 6,5 t seiling per levering) og ferskheten fra D3 passer på. B: «hver tur» som i dag. C: «hvert 2. døgn».

**Jonas' svar 26.10.2026:** 1 A · 2 «ta det du mener er mest riktig» → A · 3 A · 4 A · **5 C** (gamle planer slås av med melding, som ved forrige omlegging) · 6 A («siden alle båter må rigges om for å fiske med de ulike passive redskapene») · 7 «dette kan være et valg for brukeren, men da må vi teste at funksjonen fungerer som den skal» → regelen er spillerens valg i Levering-raden, standard A, og S7 tester alle tre. Og to regler til, ordrett: «Om båten går dagdrift på driftsplanen skal ikke skipperen bare kunne gå å legge seg for å sove mens mannskapet jobber, det vil være uansvarlig. Skipper går alltid dagvakt, styrmann natt. Ved døgndrift jobber mannskapet 12 timer hver og mannskap som har frivakt sover ombord. Båten må ha køyer nok til mannskapet for å kunne gå døgndrift.» Begge står i kapittel 3. «Kjør på» gitt samme dag.

Jonas' gamle svar som står uendret: skipper og styrmann når du ikke er med (3), alle dager (6a), felt med antall og ståtid (8), aldri over det båten tåler (9a), én-manns båt bare med deg (13a), anker fra 24 m (C), ingen forventet fangst. Svar 4b (alltid nærmeste) er overstyrt av R7.

## 6. Testplanen

Én ny fil `tests/driftsplan2test.py` i `LITE` (uten 3D) med scenariene som funksjoner, bygd på harnesset fra revisjonen (`revisjon/spill.py`: fast dato, låst frø, holdt løkke, åpent og lukket spill, tvunget vær). Hvert scenario skriver en logg med klokkeslett («05:00 kastet loss», «06:10 satte 2 stamper ved F1») og sjekklinjer som starter med `OK`/`FEIL`. Scenarier for deler som ikke er bygd ennå, skriver `VENTER` (ikke `FEIL`), så regresjonen ikke blir rød av det som ikke finnes (bryteren, kapittel 7). Siden med trykk er `tests/driftsplan2ui.py` (LITE, CDP-berøring). Ingen 3D-test trengs: planen tegner ingenting i 3D; det eneste 3D ser, er båten som seiler og redskapet, som alt er dekket.

| Nr | Test | Måles | Skal stå i loggen | Grense |
|---|---|---|---|---|
| S1 | `s1_line_juksa` | avgang, sett, juksa, trekk, lever, hjem, hvile per dag i 3 døgn; kg og kr i statistikken | hver dag: ut kl. 05:00 (eller grunnen), «satte 2 stamper på felt 1 og 2», «jukset … t», «trakk felt 1 (sto 6,0 t)», «leverte … kg i …», «hjemme kl. …» | avgang ±5 min; ståtid 6 t +0/+1 t; dag 2 og 3 lik dag 1 ±10 min på hvert steg når været er likt |
| S2 | `s2_garn_lenker` | tre lenker satt dag 1, trukket og satt på nytt i rekkefølge dag 2 og 3 | «satte 6 garn på felt 1/2/3», «trakk felt 1 (sto 24,2 t)» | ingen lenke står lenger enn ståtida + 2 t |
| S3 | `s3_teiner` | 48 t ståtid, juksa imellom, agn kjøpt via `buyGate` | «teinene har stått 48,1 t», «kjøpte 60 kg agn i Botnhamn» | ståtid 48 t +0/+3 t; agn bare for teinene om bord |
| S4 | `s4_vaer` | dag 1 venter ved avgang og går når det roer seg; dag 2 går i ly, trekker når det tillater, fortsetter | «venter på været til kl. 08:00», «går i ly til Finnsnes», «trakk felt 1 (sto 6,5 t)» | ingen avgang over grensene; ingen søk (`leiaRoute` kalles ikke under kjøringen); planen står på etterpå |
| S5 | `s5_energi` | du om bord med 0 % → ingen avgang før hvilt; mannskap slitne midt på dagen → dagen slutter, det forfalne trekkes | «du må hvile til kl. …», «mannskapet er slitne, trekker felt 1 og går inn» | ingen fisker under 15 % / over 72 |
| S6 | `s6_dogndrift` | tre i mannskapet avvises; fire: vaktene, levering ved full last, ut igjen | «vakt A 06–12: …», «lasten full, leverer», «ut igjen kl. …» | ingen over 72; ingen venting på den som sover |
| S7 | `s7_levering` | nærmeste mot valgt mottak; `full`-regelen med ferskhet | «leverer i Husøy (valgt)», «beholder 216 kg om bord til i morgen» | statistikken skiller mottakene |
| S8 | `s8_regler` | stengt felt (med og uten dato), oppbrukt kvote, åpen gruppe uten deg | «felt 1 er stengt til 15. april, venter», «stoppet: torskekvoten» | ingen ulovlig fangst; går videre av seg selv når datoen er passert |
| S9 | `s9_lukket` | S1 med 30 t lukket midt i, og 9 døgn lukket; mot åpent med samme frø | landingene, redskapet, hvilen, stedet; «spilte av 9 døgn på 2,6 s» | kg ±2 %, kr ±2 %, samme steg til samme klokkeslett ±1 min, under 10 s |
| S10 | `s10_to_baater` | S1 og S2 samtidig, du på den ene | per båt som S1/S2; Rederi-lista | begge går; ingen på land; din båt har adgangen |
| S11 | `s11_tar_over` | din rute midt i S1, så tilbake | «planen venter: du har tatt over», «fortsetter fra der båten er: trekker felt 2 kl. …» | redskapet står; neste steg riktig |
| S12 | `s12_gamle_lagringer` | en v3 på tur, en v3 i havn, en v2, en v4 | «slått av» for v2 og v3 (valg 5 C), v4 beholdt; turen seiles ferdig | ingen feil, redskap/mannskap/fangst/penger uendret |
| S13 | `driftsplan2ui.py` | hel plan fra null med ekte trykk i 384×853, 800×1280, 1280×800: plasser i kartvinduet, lenker, ståtid, juksplasser, avgang, vær, mottak; Start | antall trykk, skjermbildene (ses på) | planen som startes er den som ble lagt; «Velg i kartet» overlever trykket |
| S14 | `s14_statistikk` | etter S1 og S2 | kg, kr, arter, turer per døgn og samlet | bevart over lagring og omlasting |

Det Jonas prøver selv på nettbrettet når sidedelene er ute (med forventet utfall): lage S1-planen med fingeren i begge formater og se at dagen stemmer med det båten gjør neste morgen; legge et felt på land (avvist med grunn); sette pause med garn i sjøen («Hent redskapet»); lukke spillet et døgn og se «Mens du var borte» mot statistikken; to båter i Rederi.

## 7. Delene (fase 2 og utover)

Hver del er én økt, i avhengighetsrekkefølge, bak **bryteren** `DRIFT2` (`let DRIFT2 = false` i `core/06g-plan2.js`; testene setter den på i sin side). Så lenge den er av, går dagens plan (`06d-drift.js`) uendret for spillerne, ingen lagring røres, og det nye koden gjør, er å finnes i bygget. Den siste delen slår den på. Nye filer legges i malen etter `06d-drift.js` (kjernen) og etter `05c-drift.js` (siden), og inn i `COVER`.

| Del | Bygger | Filer | Grønt etterpå | Står rødt (VENTER) |
|---|---|---|---|---|
| 1 | **Modellen og dagen.** v4-modellen, `planDay` (1.2) med egning, levering og vakter, `plan2Ops` (gamle planer av, 1.5), `plan2Check`, dagen som tekst. Ingen motor, ingenting synlig. | `core/06g-plan2.js`, `tests/driftsplan2test.py` (harnesset) | S1–S3 og S7 *tørt* (dagen fra svarene, uten å seile), S12 tørt | resten |
| 2 | **Motoren, del 1.** `planMake` med leiekontroll (1.3), `plan2Step` med stegene avgang/sett/trekk/juks/lever/hjem/hvile/egning, venting i stedet for stopp, dagsskillet, statistikken. | `core/06h-plan2-engine.js`, `05-vessels.js` (ett kall), `10-gear.js` (`DRP2.work`-tallene fra motoren) | S1, S2, S3, S7, S14 | S4–S6, S8–S13 |
| 3 | **Motoren, del 2.** Været uten søk (2.2), energien og skiftene (3), reglene med dato, du tar over, slitne, full last, tapt redskap. | `06h-plan2-engine.js`, `06e-anchor.js` (ly), `13-work.js` (vaktene) | S4, S5, S6, S8, S11 | S9, S10, S12, S13 |
| 4 | **Lukket spill.** Likhet åpent/lukket, determinismen (motoren trekker ingen tilfeldige tall), ni døgn under 10 s, «Mens du var borte» med planens turer. | `06h-plan2-engine.js`, `ui/08-actions.js` | S9 | S10, S12, S13 |
| 5 | **Siden.** Driftsplan-appen med dagen, radene (Levering og Vær nye), statistikken, stopp/venting, i begge formater og på telefon. | `ui/05d-plan2.js`, `ui/phone/…` (appen), `styles.css` | S14 på siden, halve S13 (alt uten kartet) | S13 kartet, S10, S12 |
| 6 | **Kartvinduet.** Planmodus i plotteren (4.2) med berøring i tre størrelser; `panelRoute`-tilstanden fjernes. | `ui/03g-planmap.js`, `03-map.js`, `07-guide.js` | S13 helt | S10, S12 |
| 7 | **Flere fartøy og bryteren.** Rederi (4.4), gamle planer slås av (1.5), `DRIFT2 = true`, push ved lang venting, stikkprøver sør/midt/nord (`/stikkprove`: Bergen, Bodø, Hammerfest), `/regresjon` med hele kysten, patchnotes (én oppføring), `docs/systemer/driftsplan.md` skrevet om, lista til Jonas. | `06g`, `06h`, `ui/phone/11-rederi.js`, `10g-push.js`, docs | S10, S12, hele lista | – |
| 8 | **Rydding** (egen økt, etter at Jonas har prøvd): `06d-drift.js` og `05c-drift.js` fjernes, `drifttest.py`/`driftuitest.py` erstattes av de nye, `tutdrift.py` og `opsowntest.py` flyttes over. | | | |

Hver del: leser `00-oppdrag.md`, dette dokumentet og statusen nederst, bygger, gjør sine scenarier grønne, skjermbilder i begge formater av alt nytt (del 5–7), `docs/systemer/driftsplan.md` får et avsnitt «Driftsplan 2» per del (det gamle 5.7 står til del 8), status nederst her, `/lever`, `/okt-slutt`. Én commit per del.

## 8. Antatt, usikkert og det planen ikke gjør

- **Antatt:** tidene for redskapsarbeid er motorens egne (målt); slitenhet 5 per time og energien 4,2 per time er spillets konstanter; ferskhetsgrensen for «må leveres» settes til den kvaliteten som gir prisfall (D3, `grade`), og justeres i spilltesting; ly-kaia per plass er nærmeste kai som ikke er rorbu (som `shelterReturn` velger i dag).
- **Usikkert:** om leiekontrollen (1.3) i kjernebygget (200 m-celler) avviser plasser som appen (100 m) ville tatt; det gjelder bare testmiljøet. Om kjølvannslinja alltid er seilbar tilbake (den er seilt én gang, så ja, med mindre tidevannet har falt mye; sjekkes i S4). Om `planDay` på to dager fram er nok for teiner med 96 t ståtid (da vises «trekkes fredag» uten klokkeslett).
- **Ikke med:** trål, not og snurrevad (havsteget); flere redskapstyper i én plan (valg 6); en uke med ulike dager (valg 1 B); forventet fangst; mottakenes åpningstider (finnes ikke); nye Blender-modeller eller 3D; endringer i Autonav, redskapssyklusen, regelmotoren, ferskheten, liggeplassene, ankringen eller mannskapet utover de to rettelsene som er nevnt (den sovende vakta regnes som om bord; «ligger og venter»-teksten når båten jukser).

## Status

- 26.10.2026: designet skrevet etter revisjonen. Venter på Jonas' svar på valgene 1–7 og «kjør på». Ingen spillkode er skrevet.
- 26.10.2026: Jonas svarte (kapittel 5) og sa «kjør på».
- 26.10.2026: **del 1 gjort.** `core/06g-plan2.js` (modellen v4, `planDay`, `planDayText`, `plan2Check`, `plan2Ops`, bryteren av), `tests/driftsplan2test.py` med S1, S2, S3, S7, S12 og vaktene tørt (17 OK), resten VENTER. Dagen fra Finnsnes med line og levering hver tur blir 14,2 t fordi mottaket er 16 nm unna; dagen sier det, og sjekken advarer. Neste: del 2, motoren.
- 27.10.2026: **del 2 gjort.** `core/06h-plan2-engine.js` (planlaging med leiekontroll og ly-kaier, stegene, venting, dagsskillet, turene på de lagrede leiene, ståtida holdt, full last til mottaket, statistikken, agn og egning, vaktene) bak bryteren. S1, S2, S3, S7 og S14 grønne med motoren (33 OK i `driftsplan2test`). Neste: del 3.
- 27.10.2026: **del 3 gjort** (i samme commit som del 2, fordi filene ble bygd videre på før del 2 var committet; del 2 ble kjørt og regresjonstestet for seg, 10 OK). Været på de neste 5 timenes varsel og ly uten søk, energien din og slitenheten med haling innen 3 timer, reglene med dato, leiene kontrollert ved laveste vann, hver lei fra plassen selv, juksa som slutter seks minutter før ståtida. S4, S5, S6, S8 og S11 grønne (46 OK i `driftsplan2test`). Avvik fra designet, skrevet inn i `driftsplan.md`: varselvinduet 5 t (med perfekt varsel ville ly aldri trengs; en kuling senere på dagen møtes med ly, slik S4 ber om); 12-timersvaktene gir slitenhet opp mot 80 ved vaktskiftet (Jonas' regel); haling som forfaller innen 3 t gjøres når dagen kuttes. Neste: del 4, lukket spill.
- 27.10.2026: **del 4 gjort** (delene 2–5 ble én commit: filene ble bygd videre på før regresjonen for de forrige var kjørt; hver del er kjørt grønn for seg). Ingen ny motorkode trengtes: motoren har ingenting asynkront i kjøringen, så det lukkede spillet spiller den som det åpne. S9 grønn (50 OK i `driftsplan2test`): åpent mot 30 t lukket gir samme steg på samme minutt, kg og kr innenfor 2 %; ni døgn lukket på 8 s. Fangsten per lenke er ikke på kiloet lik mellom to kjøringer fordi sim-flisene i kartet kommer inn asynkront; testen laster kartet inn og varmer opp først. `drifttest` scenario 6 er ustabil i seg selv (uten frø), notert i backloggen. Neste: del 5, siden.
- 27.10.2026: **del 5 gjort.** `ui/05d-plan2.js` (`PLAN2UI`) bak bryteren: dagen først, «Nå», de sju radene, statistikken, kopiering, sletting, «Hent redskapet» (`o.fetch` i `planDay` og `plan2Boundary`, `plan2Abort` på tur). Testen `driftsplan2ui.py` (16 OK) med skjermbilder i begge formater og på telefon. Funnet underveis og rettet: en nektet setting (uten blåsesett) ble bare logget, nå sies den og står på siden (`plan2ActWhy`), og sjekken advarer; ankomstmeldingen sa «ligger og venter» selv om juksa gikk. S13 halvveis (siden), S14 på siden. Neste: del 6, kartvinduet.
- 27.10.2026: **del 6 gjort.** `ui/03g-planmap.js` (`PLANMAP`): planmodus i plotteren med lista og kortet over kartet, trykk, dra og Ferdig, hektet inn i `03-map.js`; `DRIFTCTX`-tilstanden på rutepanelet står urørt til del 8 (den gamle siden bruker den ennå). S13 med ekte berøring i tre størrelser (`driftsplan2map.py`). Lenkeretningen er ikke med (motoren bruker den ikke). Neste: del 7.
- 27.10.2026: **del 7 gjort, unntatt stikkprøvene.** `DRIFT2 = true`, Rederi og dokkprikken leser v4, push ved lang venting, patchnotes p143, `driftsplan.md` snudd (5.7 peker på Driftsplan 2, det gamle står til del 8), de gamle testene på bryteren av. Stikkprøvene sør/midt/nord kan ikke gjøres i testmiljøet (bare Senja); de står i backloggen for Jonas eller en økt med hele kysten. Neste: del 8 når Jonas har prøvd.
- 27.10.2026: regresjonen (`run.py full`, 127 av 155 før tidsgrensen): 110 grønne; de røde er sortert i `docs/BACKLOG.md` 10.6 (hele kysten mangler, ustabile uten frø, røde også på grunnbygget, SwiftShader). Ingen rød test skyldes Driftsplan 2 så langt det er prøvd; `saytest` venter nå på bobla i stedet for 800 ms.
- 27.10.2026: **Jonas prøvde planen på detstorebla.no** (Bleik, «Idamor», blåkveiteline) og ga seks punkter og ett spørsmål; alle bygd samme dag (`driftsplan.md`, «Jonas' runde etter prøvingen»): kvoten ut av planen, linetypen per felt og juksautstyret fra Beholdning, lenkeretningen i kartkortet, hard grense på stampene, rekkefølgen er spillerens (juksa først, lina før hjemturen), dagen i kartlista, døgndrift med deg som skipper og tre i mannskapet (du sover i køya om natta). S15–S18 nye.
