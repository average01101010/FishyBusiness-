# Én sjø: bestandene, vandringen, uttaket og flåten langs hele kysten (plan, 01.11.2026)

Jonas 01.11.2026:

- «Hele kystflåten skal ta av den verdens felles bestand av fisk. NPC-flåten skal simulere antall aktive fiskebåter i Norge basert på ekte fangstdata. Når en ny bruker registrerer seg i spillet skal 1 NPC-båt forsvinne, og på den måten klarer vi å holde en slags balanse i økosystemet.»
- «Havflåten er et element av spillet som skal bygges ganske straks og modellene til båtene er allerede laget, det er dermed viktig at vi klarer å simulere dette med bestander, vandring, uttak, og alt annet på en så realistisk måte som mulig slik at modellen er helt ferdig utviklet når vi starter å få inn aktive brukere.»
- «Spillet, verden, miljøet og opplevelsen skal være så realistisk som mulig.»

Denne planen erstatter valg 4 i `docs/planer/npc-liggeplasser.md` (liggeplassene L1–L3 står der og bygges først) og fase N1–N2 i `docs/planer/npc-flaaten.md` (N3–N8 står). Den er grunnmuren som havsteget (spillerens egne havbåter) bygges på etterpå.

## 1. Hva som finnes i dag, og hva som er feil med det

**Fisken i sjøen** (`core/03-simulation.js` `density`): én funksjon gir kilo i timen på et punkt: artens grunntall × bunnen (dybde, eksponering, kant) × flekker som glir (`hotspot`) × stimer × **sesongtabellen `av`** × skreipulsen × **gytebestanden** (`stockF`) × **den lokale bestanden i ruter på 2 km** (`stockAt`).

- `av` og skreipulsen er **de samme fra Lindesnes til Vardø**. Skreien kommer like sterkt til Bergen i mars som til Lofoten. Det er ikke realistisk. Bare blåkveita (`eggaArea`) og kongekrabben (`kingArea`) har sin egen geografi, hentet fra sluttsedlene.
- **Bestandene år for år** (`core/03d-quota.js` `STOCK`, `stockYear`): gytebestand og totalkvote 2014–2027 fra HI/ICES, så en enkel modell per år med tilfeldige årsklasser og kvoteråd. Fisket **over rådet** holder bestanden nede. Det virkelige fisket er altså **allerede med** i bestanden, som et nasjonalt tall. Alle spillere har samme frø (`WORLD_SEED`), så den er felles.
- **Kvotekjeden** (`norQuota`) deler totalkvoten på trål (28–33 %), havfiskeflåten (12,81 % av det konvensjonelle), lukket gruppe (Finnmarksmodellen) og åpen gruppe (6,62 %). Åpen gruppe fiskes av **2 100 virtuelle båter** dag for dag (`qyStep`) sammen med spillerne (`wshOpen`), og gir stopp, økning og fritt fiske som i virkeligheten. Lukket gruppe har et register på 1 622 NPC-eiere (`REGN`), og **kjøper en spiller en hjemmel, går én NPC ut**. Det er Jonas' idé, alt bygd, men bare lokalt i hver lagring.
- **Den lokale bestanden** (`S.stock`): bare rutene spillerne har fisket i, ligger under 1, og vokser tilbake 0,4 % av underskuddet i timen. De andre spillernes fangst kommer ned fra serveren rute for rute (`wshTake`). Bare Senja-flåten (14 båter, 18 kg i timen) og tre faste felt tar fisk. **Kysten ellers er urørt av flåten.**
- **NPC-flåten** (`npc-trafikk.md`): 4 137 båter etter kailengden, uten redskap, felt etter bunnens helling, ingen fangst. Havflåten finnes ikke som NPC. Havbåtene finnes som modeller (`bunntral`, `autoliner`, `pelagisk`, `snokrabbe`, `ringnot38`) og er låst (`lock`).
- **Rammen** (`MAPB`, 1450 × 1720 km i UTM 33) når rundt 5° V ved 70° N og 33° Ø, altså eggakanten og Finnmarkskysten, men ikke Bjørnøya eller Nordsjøen vest for 1° Ø. Dypet til havs ligger i `deep` (1 km). Havbåtene ble låst «til kartet utvides vestover».

**Konklusjonen:** det vi mangler, er ikke at NPC-båtene «tar fisk», men at det virkelige uttaket får **sted, tid og redskap**, at fisken **vandrer** etter de ekte dataene, og at NPC-flåten og spillerne deler **samme kvote**. Da blir ett system: det båtene du ser på AIS gjør, er det som trekker fisken ned der du fisker, og kvoten som stopper deg, er den samme som stopper dem.

## 2. Modellen (tre lag, én klokke)

Alt er en ren funksjon av den felles klokka pluss det serveren deler. Ingen spiller regner noe de andre ikke får.

### Lag 1: bestandene (nasjonalt, per art, per år)

- Som i dag: gytebestand, råd og totalkvote per år, felles frø. Utvides med artene havflåten trenger: **NVG-sild, makrell** (ringnotbåten og den pelagiske tråleren), **snøkrabbe** (snøkrabbefartøyet), **reke** (vurderes, valg 4). Kilder: HI/ICES-rådene (samme som for torsk, hyse, sei, blåkveite), Fiskeridirektoratets J-meldinger for kvotene.
- **Fangsten holdes under totalkvoten.** NPC-flåtens uttak er totalkvoten minus det spillerne lander, fordelt på gruppene i kvotekjeden. Lander spillerne mer, fisker flåten mindre. Det er slik Norge faktisk virker: kvoten er taket, og flere aktive båter deler den samme kvoten. Ingenting tas to ganger, og bestanden kan aldri fiskes mer enn modellen tåler.
- **Serveren får bestanden når spillerne betyr noe.** I dag lander spillerne en dråpe mot 285 000 t. Admin-dashbordet får en linje «spillernes andel av gruppekvoten», og når den passerer 1 % i en gruppe, flyttes årets fangst og bestandsmodellen for den arten til serveren (én rad per art og år). Til da holder frøet (valg 3).

### Lag 2: fordelingen og vandringen (per art, per område, per måned)

- **Datagrunnlaget er sluttsedlene** (Fiskeridirektoratets «fangstdata (seddel)», NLOD, alt lest av `tools/mottak/mottak.py`): for hver landing art, rundvekt, redskap, største lengde, fangstområde og lokasjon (Fiskeridirektoratets statistikkområder, som alt ligger i `rules.json`: 60 hovedområder og 578 lokasjoner), måned og fartøykommune. De to siste hele årene.
- **Fordelingsfeltet `areaF(art, punkt, måned)`:** kilo per lokasjon og måned, delt på innsatsen (antall landinger), glattet mellom nabolokasjoner og over måneder. Det erstatter den ene `av`-tabellen der det finnes data, og holder den der det ikke gjør (fjordene innerst, Sørlandet om vinteren). Blåkveita er alt laget slik, så mønsteret finnes.
- **Vandringene som egne kurver** der sluttsedlene alene ikke viser bevegelsen, fordi båtene bare fisker der de har lov:
  - **Skreien:** inn fra Barentshavet til Finnmark og Troms i januar, Vesterålen og Lofoten februar–april, ut igjen i mai. Innsiget regnes som en front som går sørover med breddegraden, så Båtsfjord har skreien tre uker før Røst, og mengden følger gytebestanden. Kilde: HI (skreiinnsiget) og sluttsedlene per lokasjon og uke.
  - **NVG-silda:** gyting på Mørekysten og Haltenbanken februar–mars, beiting i Norskehavet om sommeren, overvintring utenfor Troms og Vesterålen oktober–januar. Kilde: HI.
  - **Makrellen:** nord langs kysten juli–september til Lofoten, sør og ut om høsten. Kilde: HI.
  - **Seien:** gyting på Møre og Haltenbanken februar–mars, seistimene langs kysten i mai. Kilde: HI og sluttsedlene.
  - **Lodda** tas ikke med som fiske, men kan senere brukes som det som trekker torsken til Finnmarkskysten i mars–april.
- **Feltene får navn langs hele kysten** fra Fiskeridirektoratets «Fiskeplasser – redskap» (WFS), som i N1: navn uten sirkel i kartplotteren. Der de mangler, holdes skråningsregelen.
- **Kalibreringen holdes:** `k` per art stilles slik at `simday.py` på Senja (Husøy mars, Gryllefjord mars, Husøy juli, Malangsgapet mai) gir de samme tallene ±10 % som i dag. Det som endrer seg, er resten av landet: Lofoten i mars får mer skrei enn i dag, Bergen får mindre.

### Lag 3: uttaket der du fisker (ruter på 2 km, per time)

- **Flåtetrykket `F(rute, time)`** i kg i timen per art: gruppens andel av kvoten (lag 1) lagt ut i rommet og tiden etter sluttsedlene (lag 2), delt på redskap og lengdegruppe: kystflåten (under 28 m, garn, line, jukse, snurrevad, teine) på lokasjonene, havflåten (trål, autoline, not) på hovedområdene. Trykket **nulles i en gruppe når gruppa er stoppet** (`qyStep` gir stoppen i dag), og NPC-båtene i gruppa blir liggende i havn. Det synes på AIS.
- **Likevekten regnes, ikke simuleres:** den lokale bestanden er `grunnlinje(rute, time) × avvik(rute)`. Grunnlinja er likevekten mellom flåtetrykket og tilveksten (0,4 % i timen), i lukket form, så den kan regnes for hvilken som helst rute når som helst, lik for alle, uten at noen må ha sett båtene. Avviket er det spillerne gjør (`S.stock`, `wshTake`), som i dag. Senja-flåtens egne 18 kg og de tre faste feltene fjernes: de ligger i `F`.
- **Båtene du ser, står der `F` er høyt.** Rørledningen (`npc.py`) gir hver havn båter etter fartøyregisteret (antall og lengde per kommune) og gir hver båt redskap og felt etter sluttsedlene for kommunen. Det NPC-båtene «gjør» i 3D og på AIS, er bare bildet av `F`; bestanden henger ikke på at noen ser dem, og den er lik for en spiller i Tromsø og en i Bergen.
- **Balansen når spillere kommer til** (Jonas' «én NPC-båt forsvinner»), gjort på den realistiske måten:
  - **Lukket gruppe:** en spiller som kjøper en hjemmel, tar plassen til en NPC-eier i registeret. Det finnes (`REGN`), og flyttes til serveren, så alle ser det samme registeret, og NPC-båten med den hjemmelen forsvinner fra havna si for alle.
  - **Åpen gruppe:** det er fri adgang i virkeligheten, så antallet båter styres ikke. Det som gir balansen, er kvoten: spillernes landinger teller i gruppekvoten (finnes, `wshOpen`), flåtetrykket `F` går ned tilsvarende, og stoppen kommer tidligere for alle. Flåtens virtuelle 2 100 båter (`OPENF.n`) byttes ut med registerets tall for åpen gruppe minus spillernes aktive båter, så antallet båter ute stemmer.
  - **Ingen straff for fravær:** en spiller som slutter, gir plassen tilbake etter 90 dager uten landinger (samme regel som aktivitetsmålingen i admin).
  - Hvorfor ikke bokstavelig «én båt per registrering»: de fleste som registrerer seg, slutter etter noen dager, og kysten ville bli tom der ingen spiller, uten at det tas mindre fisk. Kvoten gir balansen i tonn, registeret gir den i båter.

### Havflåten som NPC (bildet av lag 3 til havs)

- Trålere, autolinere, ringnotbåter, snurrevadbåter og snøkrabbefartøy etter sluttsedlene (redskap, største lengde, hovedområde, måned). Hjemmehavnene er de store fiskerihavnene med kai som passer (L1-regelen: en tråler på 60 m trenger en ekte kai på 60 m og 6 m dybde). Turene varer døgn til uker etter båttypen, med levering ved mottakene som tar imot fryst og pelagisk fisk (registeret har dem).
- Modellene finnes alt. Redskapet i sjøen (trål, not) finnes for spillerens båter (`view3d/20-trawl-seine.js`).
- Rammen holder til eggakanten og Finnmarkskysten. Feltene utenfor rammen (Bjørnøya, Nordsjøen vest) regnes som «borte»: båten ligger utenfor rammen i turens lengde og kommer tilbake. Utvides rammen senere, kommer feltene med av seg selv.

## 3. Fasene (hver er én økt)

| Fase | Hva | Filer | Tester | Måles |
|---|---|---|---|---|
| **L1** | Liggeplass bare ved kai som står i 3D (`npc-liggeplasser.md`, valg 1–3 = A) | `07-harbours.js`, `05-vessels.js`, `view3d/03`, `view3d/22` | `npctest`, `havntest`, `berth3d` | kai/flytebrygge/bøye/flyttet per havn, bakken under skroget |
| **B1** | Datagrunnlaget: `tools/npc/fiske.py` leser sluttsedlene og fartøyregisteret → `src/data/fiske.json` (per art: kg per lokasjon × måned × redskapsgruppe × lengdegruppe, antall landinger; per kommune: båter per lengdegruppe og redskap). Workflow `fiske.yml` som release `fiske-N` hver 3. i måneden, som `mottak.yml`. Også sild, makrell, snøkrabbe (reke venter, valg 4). | `tools/npc/` (ny), `.github/workflows/fiske.yml`, `datarorledninger.md` | ny `tests/unit/fiske.test.mjs` (summene per art mot Fiskeridirektoratets årstall) | størrelsen på `fiske.json` (mål under 400 kB), dekning: andel lokasjoner med data per måned |
| **B2** | Fordelingen og vandringen: `areaF`, skrei-, sild-, makrell- og seikurvene, feltnavnene fra WFS, `k` kalibrert på nytt | `03-simulation.js` (`denTime`, `denSp`), `02-species-gear.js` (nye arter, bare for `F` og AIS; ikke fiskbare for spilleren ennå), `01e-marks.js`/`ui/03-map.js` (navn) | `simday`, `calib`, `kvtest`, `bktest`, ny `tests/unit/vandring.test.mjs` (skreien i Båtsfjord før Røst, silda på Møre i februar, ingen skrei i Bergen) | `simday` ±10 % mot i dag; kg per time i Lofoten mars / Bergen mars / Finnmark januar før og etter |
| **B3** | Flåtetrykket og grunnlinja: `F(rute, time)`, `stockAt = grunnlinje × avvik`, Senja-flåtens eget uttak og de tre feltene fjernet, `stockHour` uendret for avviket | `03-simulation.js`, `03d-quota.js` (`F` følger gruppene og stoppene), `05-vessels.js` | `simday`, `calib`, `progweek`, `quotatest`, ny `tests/unit/trykk.test.mjs` (årssummen av `F` per gruppe = gruppens kvote ± 2 %, `F` = 0 etter stopp) | fangst per dag for spilleren før og etter på de fire kalibreringsstedene; tiden `stockAt` tar (mål under 5 µs) |
| **B4** | Balansen: registeret på serveren (`register` i Supabase: antall per lengdegruppe og kommune, `reg_take`/`reg_free`), `OPENF.n` fra registeret minus spillernes aktive båter, plassen tilbake etter 90 dager, admin-linja «spillernes andel av gruppekvoten» | `03d-quota.js`, `ui/10f-cloud.js`, `ui/10h-world.js`, ny migrering, admin | `sqltest`, `cloudtest`, `quotatest` | registerets tall før og etter et kjøp fra to kontoer |
| **L2/N1** | Én nasjonal kystflåte: `npc.py` bruker registeret og `fiske.json` (antall, lengde, redskap og felt per kommune), Senja-ruta med, `FLEET` fjernet, båtene i en stoppet gruppe ligger inne, hjemler spillere eier er borte fra havnene. Ny kartrelease. | `tools/map/npc.py`, `kart.json`, `05-vessels.js`, `03-simulation.js`, `ui/03-map.js`, `view3d/20` | `npctest`, `fleet*`, `trip2`, `tut` | antall båter nasjonalt mot registerets aktive (4 614 i 2024); antall i Senja-ruta før/etter |
| **H1** | Havflåten som NPC: typer, hjemmehavner med kai som passer, hovedområder og sesonger fra `fiske.json`, turlengder, levering, AIS og 3D med redskapet i sjøen, utenfor rammen = borte | `tools/map/npc.py`, `05-vessels.js`, `view3d/19`, `view3d/20`, `07-harbours.js` (`quayFit` for 45–75 m) | `npctest`, ny `havflaate.py` (trålere på Tromsøflaket i februar, ringnot på Møre i februar, snøkrabbe øst i rammen, alle i havn som passer) | antall havbåter mot registeret (trål, not, autoline); tegnekall i Tromsø havn |
| **L3** | Stikkprøvene langs kysten i begge formater, systemdokumentene (`fiskerimodellen.md`, `kvoter-og-regler.md`, `npc-trafikk.md`) og backloggen | docs | `/stikkprove` | – |

Rekkefølgen: L1 (synlig feil nå), B1 (alt annet står på den), B2, B3, B4, L2, H1, L3. Åtte økter. Havsteget for spilleren (trål, autoline, not som egne redskap, kvotene i trål- og havfiskegruppene, som alt ligger i kvotekjeden) er neste plan og bygger rett på H1 og B3.

## 4. Valgene

1. **Balansen når spillere kommer til:**
   - **A** Kvoten gir balansen i tonn (flåtetrykket viker for spillernes landinger), og registeret gir den i båter (en hjemmel tar en NPC-plass; åpen gruppe teller aktive båter). Plassen tilbake etter 90 dager uten landinger.
   - **B** Bokstavelig: én NPC-båt forsvinner for alltid per registrert konto.
   - *Anbefaling A:* det er slik fiskeriet virker, det tar aldri mer enn kvoten, og kysten tømmes ikke av kontoer som sluttet.
2. **Oppløsningen i fordelingen:**
   - **A** Lokasjon × måned for kystflåten (578 lokasjoner), hovedområde × måned for havflåten, de to siste hele årene, glattet.
   - **B** Bare hovedområde × måned (60 områder).
   - *Anbefaling A:* kystfisket er lokalt (Hekkingen mot Malangsgapet), og lokasjonene ligger alt i `rules.json`.
3. **Når bestanden flyttes til serveren:**
   - **A** Nå: registeret og årets fangst per gruppe på serveren (B4), bestandsmodellen fortsatt fra frøet, og den flyttes når spillernes andel passerer 1 % av en gruppekvote (admin-linja sier fra).
   - **B** Alt på serveren fra start.
   - *Anbefaling A:* alt virker uten nett som i dag, og terskelen gjør at vi bygger serverdelen når den trengs, ikke før.
4. **De pelagiske artene og skalldyra for havflåten:**
   - **A** Sild, makrell og snøkrabbe legges inn i B1–B2 som arter NPC-flåten fisker og AIS viser, men som spilleren ikke kan fiske før havsteget. Reke venter.
   - **B** Bare torsk, hyse, sei, lange, brosme og blåkveite; havflåten som NPC fisker bare dem.
   - *Anbefaling A:* uten sild og makrell har ringnotbåten og den pelagiske tråleren ingenting å gjøre, og de er to av fem havbåter.

## 5. Antatt eller usikkert

- ~~Kolonnenavnene for fangstområde, lokasjon og fartøykommune i sluttseddeluttrekket er ikke sjekket.~~ Sjekket i B1 (01.11.2026): `Hovedområde (kode)`, `Lokasjon (kode)` (på hver seddellinje), `Fartøykommune (kode)`, `Største lengde` og `Lengdegruppe (kode)` finnes. Valg 2 står (A). 99,8 % av torskekiloene fra båtene under 21 m har en lokasjon fra `rules.json`.
- ~~Fartøyregisterets åpne utgave~~ sjekket i B1: `fartoy.csv` i det daglige uttrekket (`frtyweb.tar`, NLOD) har hjemkommune (`kommunenummer`) og største lengde, men **ikke redskap**. Redskapet per båt tas fra sluttsedlene (det den landet mest kilo med), koblet på `Fartøy ID`.
- ~~Årstallene fra Fiskeridirektoratet for lyr, uer, kveite, krabbene, sild og makrell~~ sjekket samme dag mot statistikkbankens tabell F.06.002: alle 14 artene innen 0,8 % begge år (5.3b i `fiskerimodellen.md`).
- Vandringskurvene (skrei, sild, makrell, sei) bygger på HIs beskrivelser og sluttsedlene, ikke på en egen bestandsmodell med alder og vekst. Det er en forenkling vi velger med vilje: det spilleren ser, er riktig i tid og rom, og bestanden år for år er fra HI.
- Likevekten i lag 3 antar at tilveksten er den samme som i dag (0,4 % av underskuddet i timen). Den er aldri målt mot virkeligheten; den er kalibrert mot at et felt tar seg opp igjen på noen uker.
- Rammen stopper ved Bjørnøya og 1° Ø. Havflåten mister de feltene til rammen utvides. Det er en egen avgjørelse (kartplanen).
- Hvor stor del av en lokasjons fangst som skal legges som trykk på rutene, avhenger av hvor stor lokasjonen er mot feltene båtene faktisk bruker. Der WFS-fiskeplassene finnes, legges trykket på dem; ellers jevnt over lokasjonens vann på 20–300 m.
- Ytelsen: `areaF` og `F` må slås opp per rute og time, ikke per punkt. Lokasjonsoppslaget (`ruLok`, polygontest mot 578 polygoner) lagres per 2 km-rute.

## 5b. Kravet om 5 000 aktive brukere ved lansering (Jonas 01.11.2026)

Jonas: «jeg vil gjerne være rustet til å kunne ha minst 5000 aktive brukere når jeg offentlig lanserer spillet.» Det setter tre krav på planen:

- **Ingenting i modellen skal koste serveren per spiller per minutt.** Bestanden, flåten og vandringen er rene funksjoner av klokka og dataene i appen (lag 1–3), og det eneste serveren deler, er det den deler i dag (fangst per rute, landinger per gruppe) pluss registeret (B4). Et nytt serverkall per spiller legges ikke inn uten at B4 regner ut hva det koster med 5 000 samtidige: i dag sender hver spiller posisjonen hvert 15. sekund, henter verden hvert 10. minutt og spør om havneplasser høyst hvert 2. minutt. 5 000 spillere er da rundt 20 000 kall i minuttet bare for posisjonen, og det må måles mot Supabase-planen før lansering (egen oppgave i B4: en lasttest med 5 000 syntetiske spillere mot en kopi av databasen).
- **Det som regnes i appen, må være billig nok for 5 000 ulike steder samtidig,** altså for hvilken som helst rute når som helst, uten at noen forhåndsregner hele kysten: likevekten i lag 3 i lukket form, oppslagene per rute og time (ikke per punkt), og `fiske.json` under 400 kB.
- **Registeret og gruppekvoten tåler at 5 000 spillere er i åpen gruppe samtidig:** da er spillernes landinger ikke lenger en dråpe (5 000 × 5 t er 25 000 t mot gruppekvoten på rundt 19 000 t torsk), så terskelen i valg 3 (1 % av en gruppekvote) nås raskt, og bestanden og årets fangst per gruppe flyttes til serveren **før** lanseringen, ikke etter. B4 bygger den delen ferdig med terskelen slått av i admin, så den kan slås på den dagen.

## 6. Hva planen ikke gjør

- Ingen fiske for spilleren med trål, not eller autoline, og ingen opplåsing av havbåtene: det er havsteget, neste plan.
- Ingen oppdrett, ingen ferjer, kystrute eller skipsfart (N3–N5), ingen vikeplikt (N8).
- Ingen ekte fartøynavn, rederier eller firmanavn.
- Ingen ventetid, straff eller tap for spilleren fordi andre spiller eller slutter.
- Ingen aldersstrukturert bestandsmodell. Bestanden år for år er HIs tall og den enkle modellen vi har.

## 7. Status

- 01.11.2026: planen er skrevet etter Jonas' svar på valg 1–4 i `npc-liggeplasser.md` og beskjeden om at havflåten kommer snart.
- 01.11.2026: Jonas: «Kjør på med det du anbefaler» (valg 1–4 = A) og kravet om 5 000 aktive brukere (5b). L1 bygd samme dag (`npc-liggeplasser.md`). Neste økt: B1.
- 01.11.2026: **B1 bygd** (gren `ccr-fab8a6c3-hvqkji`, fra `ccr-1dbd88d6-lrtiim`; ikke flettet inn i utrullingsgrenen). `tools/npc/fiske.py` → `src/data/fiske.json` (**366 kB**), `.github/workflows/fiske.yml` (releasen `fiske-N`, testen før releasen), `tests/unit/fiske.test.mjs` (87 sjekker). Sluttsedlene 2024–2025 og fartøyregisteret: 14 arter, 25 234 celler, 239 lokasjoner for kystflåten og 43 hovedområder, båtene i 192 kommuner (4 997 i registeret, 4 383 aktive i 2025). Summene mot Fiskeridirektoratets ukestatistikk for uke 53 2025: torsk, hyse og sei nord for 62° N innen 0,7 %, blåkveite, lange og brosme på tonnet, begge år. Dekningen av kystflåtens lokasjoner per måned: torsk 58–67 %, sei 55–66 %, hyse 54–67 %. Formatet, kildene og målingene står i 5.3b i `fiskerimodellen.md`. Etterpå samme dag, da statistikkbanken var åpnet: alle 14 artene mot Fiskeridirektoratets offisielle årstall (tabell F.06.002), innen 0,8 % begge år. Neste økt: B2.
- 01.11.2026: **B2 bygd** (gren `ccr-0ee7bc29-0si0zm`, fra B1-grenen `ccr-fab8a6c3-hvqkji`; ikke flettet inn i utrullingsgrenen). `core/03f-fiske.js`: `fiske.json` i siden som tekst, lest ved behov (Jonas valgte det: som literal kostet den 51 ms ved oppstart, 73 ms strupet), leseren `fkCell`, `areaF`/`fkAvail` med kilo per landing justert for redskap og båtlengde mot Senja (Jonas valgte A), lokasjonen per 2 km-rute (`lokOfCell`, 0,08 µs), vandringskurvene `MIG` for skrei (front med breddegraden, Båtsfjord 22 dager før Røst, ingen skrei sør for Stad), NVG-sild, makrell, sei og snøkrabbe, med HI som kilde. Sild, makrell og snøkrabbe ligger i `SPECIES` (`npc`) og sist i `ALLSP`, men kan ikke fiskes. Feltnavnene langs hele kysten kommer fra WFS-en «Fiskeplasser – redskap» (4 684 navn, `tools/npc/felt.py`). `k` er kalibrert på nytt: `simday` 350/350/297/350 før og 350/350/316/350 etter. Ny `tests/unit/vandring.test.mjs`. Alt står i 5.3c i `fiskerimodellen.md`. **Funnet:** sedlene gir Lofoten i mars *mindre* skrei enn før (Henningsvær 29,6 → 13,5 kg torsk i timen), fordi landingene der er mindre enn på Senja også med samme redskap, lengde og måned. Seien øker mye langs kysten i februar–mars (3–5 ganger). Begge bør ses i spilltest før B3. Bergen har ingen skrei (33,1 → 12,9 kg torsk i mars). Finnmark i januar går fra 15,4 til 27,5. Neste økt: B3.
- 01.11.2026: Jonas: «Kjør på med alt som gjør at du mener vi klarer i simulerer fiskens liv med høyest mulig nøyaktighet.» Bygd i B2 (5.3c «Fisken beveger seg»): stimene og flekkene svømmer etter artens vandring på stedet og i sesongen, fisken går opp og ned i vannet med døgnet (garn, line, juksa, ekkolodd), lodda trekker torsken inn i Finnmark i mars–april, og en nedfisket rute på skreiens vei fylles raskere mens skreien går forbi. Skreien som én mengde, der det som tas i nord mangler i sør, legges til B3 (krever flåtetrykket for å merkes).
- 02.11.2026: **B3 bygd** (Jonas: «Kjør på med B3»; samme gren `ccr-0ee7bc29-0si0zm`, ikke flettet inn). `core/03g-trykk.js`: flåtetrykket `F` per art, lokasjon, måned og gruppe er sedlene skalert til årets gruppekvote. Årssummen er kvoten på tonnet: torsk 2027 åpen 10 537 t, lukket 84 738 t, trål 38 041 t, havfiske 12 450 t. Åpen gruppes trykk følger `qyStep` dag for dag og faller med stoppen. Grunnlinja er `r / (r + u)` i lukket form, med `stockAt = grunnlinje × avvik` (Husøy 0,64 i mars, 1,00 i juli; Bergen 1,00). Skreien er én mengde gjennom sesongen (`skreiLeft`, 0,75 igjen i juni). Senja-flåtens 18 kg og de tre feltene er fjernet, og `initStock` er urørt. `k` er kalibrert på nytt. `progweek` 311 mot 341 kg per tur. Ny `tests/unit/trykk.test.mjs`. Alt står i 5.3d i `fiskerimodellen.md`. Neste økt: B4.
- 02.11.2026: **B4 bygd** (Jonas: «Kjør på med B4, samt alt du mener ikke er nøyaktig enda»; samme gren, ikke flettet inn).
  - **Migreringen** `20261102120000_register.sql`: registeret (`reg_take`/`reg_free`, 90 dager), `world_get` med registeret, de aktive i åpen gruppe, de andres fangst per gruppe og bestanden når bryteren er på, sammendraget `world_year`/`world_agg`, og `admin_share`, `admin_cfg_set` og `admin_stock_set`. Jonas må kjøre den i SQL Editor.
  - **`sqltest`:** 114 sjekker, med registeret før og etter et kjøp fra to kontoer: 200 → 199 → 198, likt for begge.
  - **Lasttesten** med 5 000 spillere og 200 000 landinger: `world_get` 126–136 ms gjennom psql, mot 337–372 ms uten sammendraget; `pos_put` under 1 ms.
  - **Klienten:** `npcReg` fra serveren, `qyBoats`, `trkPlayersF`, `stockYear` fra serveren.
  - **Admin:** andelen av gruppekvoten med varsel ved 1 %, registeret, og bryteren.
  - **Rettet i modellen:** fisken går dypere i varmt vann, kysttorsken følger ikke skreiens bestand, trålerne og notbåtene ligger på sine felt, og grunnlinja har etterslep. `k` står (2–4 %).
  - Alt står i 5.3d i `fiskerimodellen.md` og 4.21 i `skyen-og-felles-verden.md`.
  - **Neste økt:** L2/N1.
- 02.11.2026: **B1–B4 rullet ut** på detstorebla.no (Jonas: «Push ut på detstorebla.no først»). Flettet inn i `ccr-5e1ba2f4-pusvyd` (89fc2bb), med «Appen på Hetzner» og «Appen på GitHub Pages» grønne. Migreringen `20261102120000_register.sql` er kjørt av Jonas. Før utrullingen kjørte `run.py changed` på flettingen: 58 OK. Rødt som også er rødt på utrullingsgrenen alene: `coast3d`, `starttest`, `docktest`. Kjent: `quotatest`, `teleport3d`. `keeptest` ble rettet (mer tid til fryseren). Første push stoppet i CI, fordi konfliktløsningen i patchnotes mistet en `]],`. Det er rettet, og bygget sjekkes nå også med `KYST_PWA=1`. Neste: vurderingen etter spilltest (forslagene: fasit-test mot sedlene, skreien per uke, størrelse og artsblanding per sted, flere år, AIS, havmodellen).
- 02.11.2026: **Fasit-testen** (`tests/fasit.py`, 5.3e i `fiskerimodellen.md`): spillet bygd på sedlene for 2024 mot 2025. B2–B4 ga mye bedre treff på hvor fisken står, men dårligere på når, fordi den gamle `av`-tabellen fulgte med. Rettet: sesongen kommer fra sedlene (`FK.season`/`FK.torsk = 'data'`), med fronten, lodda og skreiplassene innenfor måneden for torsken. Nå er treffet rundt 85 % av taket, mot rundt 16 % før B2. `k` er kalibrert på nytt, kveita mot høsten. Ikke rullet ut ennå. Neste: L2/N1.
- 02.11.2026: **L2/N1 bygd** (Jonas: «Kjør på videre»; gren `ccr-0ee7bc29-0si0zm`, ikke rullet ut). Uten ny kartrelease: `tools/npc/flaate.py` gir havnene i kartpakkene registerets aktive båter kommune for kommune (Geonorges kommuner). 3 995 av 4 134 aktive under 28 m er plassert, Honningsvåg har 150 båter (før 23) og Bergen 13 (før 23). Åpen gruppe ligger inne når gruppa er stoppet, spillernes hjemler skjuler båter, og feltet velges etter trykket. `FLEET` på Senja står, og redskapet styrer ikke oppførselen ennå. Se 4.16d i `npc-trafikk.md`. Neste: H1.
- 02.11.2026: **Senja-havnene, redskapet i sjøen og H1 bygd** (Jonas: «Fiks sånn at senja også har havner …», «Garn, liner og annet utstyr skal være synlig og vises i kartplotteren», «Start på h1»; samme gren, ikke rullet ut).
  - **Senja-ruta:** `tools/npc/senja.py` kjører `npc.py` sin regel på pakkene med Senja-ruta sluppet inn. Det gir 103 havner. Senja kommune får registerets båter minus de 14 i `FLEET`, som står. Langs kysten er 4 105 av 4 120 plassert.
  - **Redskapet:** kystbåtenes garn, liner og teiner står i sjøen etter klokka og vises på kartet, i 3D-plotteren og som blåser i 3D.
  - **H1:** `tools/npc/havflaate.py` gir 248 av registerets 249 fartøy på 28 m og over en hjemmehavn ved et mottak som tar redskapet. Feltene og sesongene kommer fra sedlene for 28 m og over, og leiene går langs farledene. `core/05d-hav.js` seiler dem etter klokka: tråling med trålen i 3D, notkast, autoline, teinelenker, og AIS. Det er ingen ny kartrelease. Se 4.16d og 4.17 i `npc-trafikk.md`.
  - **Neste:** L3.
- 02.11.2026: **L3, stikkprøvene langs kysten** (Jonas: «Kjør på videre»). Kystbåtene, Senja-havnene, NPC-redskapet og havflåten er prøvd i Kristiansand, Bergen, Trondheim, Bodø, Tromsø, Finnsnes, Husøy, Hammerfest og Båtsfjord, i juni og februar klokka 12.
  - **Ingen feil:** ingen båt på land, ingen lenke eller line over land, og alle havskip i havn ligger ved kai som passer (2 av 2 i Kristiansand, 5 av 5 i Tromsø, 3 av 3 i Hammerfest og Båtsfjord). Ingen sidefeil, og `npcStates` tar 0,3–3,3 ms.
  - **Redskapet:** garn langs hele kysten, teiner i sør og nord (Kristiansand 9, Hammerfest 2), og linene i Båtsfjord i februar (11).
  - **Senja-havnene** har båter ved Finnsnes og Husøy (14 havner innen rekkevidde).
  - **Havflåten** er på AIS overalt utenom Trondheim og Bergen i februar: trålere i Hammerfest, Båtsfjord og Bodø (på vei ut i februar), og ringnot i Tromsø.
  - Skjermbilder i stående og liggende format er sett på.
  - **Funnet og rettet:** havflåtens navneliste hadde navn som kunne tilhøre ekte fartøy. Den er byttet ut med oppdiktede navn (CLAUDE.md).
  - **Lagt merke til, ikke en feil:** en dag med halvparten av Tromsø-båtene på fridag var et utslag (snittet over 200 dager er 30 %). Kartet ber om pakkene der det sist sto, også når båten er flyttet langt bort i en test.
  - Planen er dermed bygd ferdig (L1, B1–B4, L2, H1 og L3), men L2–L3 er ikke rullet ut.
