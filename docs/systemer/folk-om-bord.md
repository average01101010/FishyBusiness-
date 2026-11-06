# Folk om bord: mannskapet, karakteren, arbeidet, maten og kulda

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.6 Mannskap

- **Mannskapsbørsen** (app `bors`):
  - Kandidater følger fiskerregisteret 2025. Aldersgrupper: 4,3 / 19,4 / 19,5 / 16,7 / 20,1 / 16,1 / 3,9 %. 6 % kvinner. 10,8 % har biyrke og er om bord fredag–søndag.
  - Én eller to nye kandidater kl. 07 hver dag, ofte ingen i skreisesongen. Hver søker hyre i 2–5 dager, og det er høyst 6 i børsen.
  - Stjernene er anslag, og det andre trekket er skjult til det er avslørt.
  - Kandidatene ber om lotter (lærling 0,75, ellers 1, en tidel mer for arbeidsjern og erfarne i skreisesongen). Forhandling ned en tidel lott lykkes i 60 % av tilfellene, 35 % for stolte folk.
  - Mønstring skjer i havn. Pubrykter kan avsløre skjulte trekk.
- **Egenskaper** (1–5): erfaring, styrke, utholdenhet, teknisk, kokk og sjømannskap. **Redskap og dekk** (`c.gear`): juksa, line, garn, teiner, sløying (`sloy`), ising (`is`) og krabbesortering (`sort`). Dekksferdighetene ble lagt til 01.10.2026, og gamle lagringer får dem ut fra erfaringen (`deckSkills`).
- **13 trekk:** arbeidsjern, kranglefant, spøkefugl, grinebiter, perfeksjonist, lokalkjent, sjøsyk, ølglad, lærevillig, rastløs, makelig, omsorgsfull og stolt. Alle har fordeler og ulemper, se `TRAITS` og `crewEff`.
- **Trivsel** drifter mot et mål:
  - Utgangspunkt 60, pluss (lott − ønsket lott) × 40, i lotter (Økonomi 2, Ø2, 27.10.2026; før: prosent × 300).
  - Pluss eller minus opptil 12 for ukas lott mot det en lott på båten gir i en vanlig uke (`lotWeek` i `core/04-crew.js`, se `priser-og-salg.md`).
  - Mat: (matstell − 3) × 3, der matstell er snittet av de fire siste måltidene (5.19).
  - Minus (slitenhet − 50) × 0,5.
  - Minus kulde × 50.
  - Minus grov sjø, med ekstra straff for sjøsyke.
  - Trekkeffekter, nag × 5, brudd på hviletid −8, og uløst konflikt −10.
  - Driftshastighet 0,04 per time (0,07 for rastløse).
- **Oppsigelse:** Under grensen i mer enn 36 timer fører til oppsigelse i neste havn. Grensen er 22, 30 for rastløse og 15 for grinebitere.
- **Slitenhet:** +6 per time ved fiske og +3 ved seiling, skalert med utholdenhet og høyere om natta. Den som tar pause, blir mindre sliten: faktoren er 0,4 + 0,6 × andelen av timen personen jobbet. Den går ned med 8 per time i havn.
- **Hviletid:** per person etter forskriften, se 5.19. Brudd gir en melding per døgn, 1,5 ganger raskere slitasje og −8 i trivsel.
- **Kjemi** (`compat`): trekk, samme hjemsted, aldersforskjell over 30 år, og nag.
- **Konflikter** (`S.cevt`):
  - Mellom mannskapet (`PAIR_TOPICS`): løses ved å snakke med dem, ta parti, gi fri eller si opp.
  - Med skipperen (`BOSS_TOPICS`): løses ved å høre på, stå på sitt eller si opp.
  - Uløst etter 12 timer blir det verre, og etter 48 timer mønstrer noen av.
- **Utvikling:** Ferdighetene vokser med stasjonen personen faktisk står på (5.19). Erfaring og sjømannskap vokser i tillegg hver 40. time på sjøen, dobbelt så fort for lærevillige. Skjulte trekk avsløres etter 12 timer på sjøen.
- **Rettet 01.10.2026:** `crewQuit` avbrøt resten av `crewTick` den timen, og juksing trente feil redskap etter garn (`lastGear`). Begge er borte.
- **Testet:** Vanlig drift med 10 timers fiske og klær ga trivsel 60–70. Hardkjøring med 20 timer per døgn fikk alle tre til å si opp innen fire døgn.

## 5.6b Mannskapet flyr til og fra Svalbard (H1b R7, 05.11.2026)

Det går ingen vei fra Longyearbyen til fastlandet, så mannskapsbytte på Svalbard skjer med fly fra og til Tromsø (`FLY` i `core/04-crew.js`).

- **Påmønstring** i en havn på Svalbard (`flyPort`: breddegrad 76° N eller mer): `flyIn(c)` fra Mannskapsbørsen. Personen er ansatt, men ikke om bord (`c.off`, `c.fly = {arr, kr}`) før flyet er inne og hun er på kaia, `FLY.min` = 205 min senere. `flyTick` i `crewTick` (hver time) tar henne om bord neste gang båten ligger til kai; har båten gått før flyet landet, venter hun til neste havn.
- **Avmønstring** på Svalbard (sagt opp, krangel, `crewQuit`): `flyOut(c)` bokfører billetten hjem.
- **Billetten** betales av rederiet (antakelse, BACKLOG 10.3) og bokføres som mannskapskostnad («Flybillett Tromsø–Longyearbyen, navn»). Prisen er SAS' laveste enveispris i måneden (`FLY.kr`: juli 2 392, november 950, desember 895 kr; resten trukket rett mellom dem). Jonas 05.11.2026: anslaget står (de ni andre månedene leses ikke).
- **Reisetida:** SAS' flytid 1 t 55 min, en time på flyplassen og en halvtime til kaia.
- **Mannskap-appen:** Mannskapsbørsen sier at den som ansettes, flyr fra Tromsø, hvor lang tid det tar og hva billetten koster denne måneden; Mannskap viser «flyr fra Tromsø, på kaia kl. HH:MM».
- **Tester:** `tests/unit/fly.test.mjs` (flyhavnene, prisene, reisetida) og `tests/lybtest.py` (byttet i Longyearbyen etter turen fra Tromsø).

## 5.6c Havbåtens mannskap som anonyme lag (H2b, 05.11.2026)

Havbåtene med `VESSELS.crew` (autolineren) har to skift à 14 som følger båten, anonyme med antall og ferdighet, i stedet for folk fra mannskapsbørsen (Jonas 05.11.2026: V3 A og «Følger båten»). Dekkslaget og fabrikklaget går seks og seks, skiftene bytter ved hver levering, kokken lager maten, og lotten etter § 6 går til skiftet om bord. Alt står i 5.65 i `docs/systemer/redskap.md`. Mannskapsbørsen er stengt for havbåten (`crewHireWhy`), og Mannskap-siden og -appen viser kortet «Lagene». Navngitte nøkkelfolk med liv kommer i H7.

- **Snøkrabbefartøyet** (H3b 06.11.2026, 5.69 i `redskap.md`): seks nøkkelfolk, et dekkslag på 8 og et fabrikklag på 8, 22 om bord og 26 køyer (sedlenes «Besetning»: 21–29 på 50–53 m med fryseri). Skiftene går fem uker på og fem av (`VESSELS.crew.rotD` 35, høringssvaret fra Polar Pioneer AS m.fl. 2023: «to skift under sesongen, hvor mannskapet er 5 uker på og 5 uker av»): skiftet blir om bord ved en levering før de fem ukene har gått, med lotten betalt, og går i land ved den første leveringen etter (`lagLanded`, `S.lag.since`). Lotten er § 20 med 35 %. Proviant for 30 døgn (`provDays`). Lagene-kortet sier ukene, døgnene om bord og paragrafen for lotten. Autolineren er som før (bytter ved hver levering, § 6, 60 døgn proviant).
- **Når du sovner om bord på havbåten** (rettet i H2e 06.11.2026): vakta på broa tar over og lagene arbeider videre (`fallAsleep` i `15-energy.js` regner med `lagOf()`, som `sleepAlone` alt gjorde). Før sa loggen og søvnskjermen «Båten ligger og driver» mens skiftet faktisk dro lina; det var bare teksten, simuleringen var riktig. Funnet av `havtur`.

## 5.11 Kulde og klær

- **Effektiv temperatur** (`effTemp`): Vindavkjølingsformelen. `coldPen` gir opptil 35 % kuldestraff og 15 % våtstraff.
- **Klær, per person:**
  - *Oljehyre* (1 290 kr): kulde ×0,85, våt ×0,2.
  - *Varmedress* (3 490 kr): kulde ×0,3, våt ×0,6.
  - *Begge:* kulde ×0,25, våt ×0,15.
- **Test ved −12 °C effektivt:** Fisket gikk 27 % tregere uten klær, 21 % med oljehyre og 6 % med begge.

## 5.19 Arbeid om bord, mat, hviletid, replikker og energien din (01.10.2026)

> **Fjernet 11.10.2026 (Jonas: «Fjern alt om hviletid»):** mannskapet har ikke lenger krav om hviletid. Regelen (`REST`, `restCheck`, `restHour`, `restLeft`), meldingene om brudd, hvilekortet i Mannskap-appen, replikken `rest`, temaet «hvile» i krangler og push-varselet `rest-` er borte. Energi og slitenhet (`fatigue`, `ENERGY`) består. Teksten under er historikk.


Brukerens ønske: mannskapet skal være en levende og givende del av spillet, inspirert av Fishing: Barents Sea. Ingen portretter.

- **Filer:** `core/13-work.js` (stasjonene og hvem som tar hva), `core/04-crew.js` (innsats og samhold), `core/14-crewlife.js` (læring, mat, replikker og feil), `core/15-energy.js` (energien din og søvnen) og `ui/05b-work.js` (skuffesiden «Mannskap», toastene og søvnskjermen).
- **Mannskap med liv** (Jonas 17.10.2026, planen og statusen i `docs/mannskap-plan.md`): folkene om bord teleporterer ikke lenger. `vessel3d.js` leser et *dekkskart* av hver båtmodell (`deckMap`, 20 cm ruter med gulv, sperrer og lenker mellom dekkets deler, `deckPath` A*, `deckPoints` for bordet, karet, haleren, roret eller døra og rekkeplassene; `tests/walktest.py`). `src/js/deckcrew.js` (`crewSim`, egen båt er `CREW3D`) gjør hver person til en agent som går mellom stasjonene `workAssign` gir, med fart 1,2 m/s, snuing, viking, erend med fiskekasse til lasteluka og ledig tid langs rekka; `view3d.js` tegner agentene i ett pass (`drawDeckCrew`), også på andre spilleres båter og NPC-båtene innenfor 150 m (`npcCrewDraw`), med hodet mot kameraet og et enkelt ratt og stol der modellen mangler det (`HELM_KIT`). Agentene lagres aldri (utsikt, ikke spilltilstand); første bilde og klokkehopp setter alle rett på plass. En pause på dekk (lene seg på rekka, se ut, kaffe) varer 30–90 sekunder, men slutter med en gang båten med styrhus kommer underveis, så mannskapet går inn (Jonas 21.10.2026: to lente seg over rekka i 23 knop, som om de jukset; `sync` i `deckcrew.js`). Plassene ved rekka (`deckPoints` i `vessel3d.js`, `lean`) er dekksruter med lufta utenfor skroget innen to ruter (ingen flate i det hele tatt resten av veien ut; en vegg, et skap eller et styrhus med dekk bak er ingen rekke), med dekket innenfor i samme høyde (ingen plass oppå skansekledningen eller et skap), og på arbeidsdekket når båten har minst fire der. Feiing og kveiling gjøres med ryggen mot rekka (Jonas 21.10.2026, #81–#85: armer gjennom styrhusveggen, en som sto oppå rekka, kosten utenbords og kveilingen som så ut som juksing). `crewwalk` sjekker plassene på alle båter. Del 2 (`core/14-crewlife.js`, `crewLife`): familie, drøm, sparing, historie, daglige hendelser, avmønstring til egen båt (`S.alumni`, høyst 10, synlige som sjark på nærmeste felt innen 40 km fra hjemhavna, tuter), retur til børsen etter 1–2 år, fall i grov sjø. Tester: `walktest`, `crewwalk`, `crewlifetest` (alle uten 3D).
- **Aldri gjennom vegger, rekka eller utstyr** (Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger, rekka eller andre ting»). Dekkskartet har `M.hit(a, b)` (første treff mellom to punkter i båtens ramme mot modellens trekanter, Möller–Trumbore over rutenes trekantlister). Tre lag bruker det:
  - **Posene på plassen** (`deckcrew.js`): `poseSegs` gir lemmene til hver pose (pauser og arbeid) som linjestykker, og `poseHits` prøver dem mot modellen. `railAt` finner rekkas topp foran plassen. `fitPlace` flytter personen et skritt inn fra en rekke som står for nær (`REACH`) eller ut til rekka med ryggen mot (`NEED_IN`), og prøver begge veier for de pausene som kan tas begge veier (`BOTH`). `fitWork` gjør det samme for arbeidet: hendene til rekkas topp ved jukse, haling og plukking, og til bordplata ved sløying. Finnes ingen fri plass innen en halv meter, prøves en liten vridning. En pause som ikke passer noe sted, blir til å stå og se ut. Arbeid på dekk under et ly eller et dekk over gjøres inne.
  - **Kroppen på vei** (`unclip`, `sideways`, `bodyHits`): skuldrene og bryst og rygg er fire loddrette linjer fra 0,35 til 1,55 m. En linje som går gjennom noe, skyver kroppen litt unna (der det er dekk). Der det er smalere enn skuldrene et skritt fram, snur personen seg sidelengs før stedet (`a.sqA` glir fra 0 til 1, holdt et halvt sekund). Folk som viker for hverandre, viker bare dit kroppen går fri. `deckPath` gjør ruter innen 0,2 m fra en vegg eller rekka dyrere (`M.tight`), så veien holder skuldrene unna der det er plass.
  - **Tak og trapper i dekkskartet** (01.11.2026, havsjarken): et tak over et rom med egen dørk er ikke dekk (`roofOver` i `deckMap`: en del der de fleste rutene ligger 1,85 m eller mer over en annen dørk, i samme rute eller inntil to ruter unna når den dørken ikke er hoveddekket, og ikke under dekket; en del med mannskapsplass eller dekkets høyde unntas). Det rettet også ringnotbåten (sløyebordet og isen sto på et tak 6,25 m oppe) og breisjarken (styrhustaket var dekk). En modell kan navngi trapper (`stairs: [{from, to}]`, punkter i spillets ramme på de to gulvene): de blir lenker der gangen er for trang til kartets egen lenke (den krever under 0,6 m, og tre ruter er litt over i flyttall). Havsjarken og kyst15 har dem. `tools/boats/qa/deckgrid.py <type>` viser kartet rute for rute.
  - **Veien mellom rutene** (`deckPass`, `linkPass` i `vessel3d.js`): et steg mellom to ruter, eller en lenke i dekkskartet, gjelder bare der en kropp kommer gjennom i kne-, hofte- og brysthøyde (0,6, 1,0 og 1,45 m). De gamle lenkene «forbi en sperre» gikk på de fleste båtene rett gjennom en vegg. Dekket faller derfor i deler (`deckComp`). Mellom delene med en stasjon, døra eller rattet går folk gjennom huset (`hopVia`): de går inn ved døra eller den ruta som ligger nærmest, er borte så lenge turen inne tar, og kommer ut på den andre siden. Rekkeplassene på en del uten stasjon, dør eller ratt (bak en skott, akter for en tverrstang) brukes ikke til pauser (`livePart`).
  - **Testene:** `tests/crewclip.py` tvinger alle pausene og arbeidet på alle båtene med dekk og går et minutt med skiftende pauser. Den sjekker hver tidel av et sekund at ingen kropp går gjennom noe. `tests/walktest.py` krever gangvei mellom plassene på samme del av dekket.
- **Hender, grep og overganger** (M7, Jonas 23.10.2026: «da må vi modellere hender og føtter bedre i blender … Det er også viktig hvordan objekter holdes med hendene for realismen»):
  - `tools/harbour/hender.py` lager hendene (håndflate med tommelballe, fire fingre med to ledd hver, tommel med motstilling) i seks grep per side (`relax`, `flat`, `grip`, `hold`, `pinch`, `hook`), og støvelen på en lest. Hvor grepet holder og aksen for det som holdes, står i GLB-extras (`hands`). `arbeider.py` legger dem i `worker.b64` (`hR_<grep>`, `hL_<grep>`, `hand_lo` for avstand og `tape_L`).
  - `view3d.js`: nærmere enn 10 m tegnes hendene i grepet hver pose trenger (`handSpecs`). Posens punkt er grepets punkt, og håndleddet regnes tilbake fra det (`handFrame`). Det som holdes, tegnes i grepet (`GP`, `GA`): kniven i neven med eggen riktig vei, koppen rundt koppen, telefonen med begge hender og flate hender på rekka. Lenger unna brukes den gamle votten.
  - **Høyre og venstre hånd byttet** (tilbakemelding #105, 01.11.2026): `hender.py` bygger «høyre hånd» med tommelen på +x = håndflate × fingre, og det er anatomisk en venstre hånd (målt: `hR_flat` har tommelsiden på x = +0,036, og på rekka peker x mot figurens høyre side, så tomlene pekte utover). `handMeshes` (`view3d/09-landing-deck.js`) tar derfor `hL_`-modellene og -grepene som høyre hånd og `hR_` som venstre, `handFrame` snur verktøygrepet (tommelen fortsatt mot hodet på kniven), og `tape_L` speilvendes over på den nye venstre hånden. Bygges hendene på nytt i Blender, bør `hender.py` få tommelen på −x på høyre hånd, og byttet i `handMeshes` tas bort samtidig.
  - **Overgangene** (`deckcrew.js`): kaffen, telefonen, kikkerten, røyken, snusen og matpakka legges bort før de går til arbeid (`a.put`, 1,4 s). Den ved haleren eller roret blir stående til den som tar over, er der (`a.relief`, høyst 25 s). De tar i døra før de går inn (`a.door`, 0,6 s) og stopper et øyeblikk når de kommer ut.
  - **Tempo:** hver person har sin egen klokke (`a.tk`), som går med 0,55 + 0,45 × innsatsen (`crewEffort`). Ganghastigheten følger 0,7 + 0,3 × innsatsen, og de slitne bøyer seg litt (`st.slump`).
  - **Feilene i 3D** (`G3.crewFx` fra `crewSlip`): en fisk som glipper, flyr over den nærmeste rekka (`railNear`) og plasker i sjøen. Den som skjærer seg, rister hånda med kniven holdt unna, og hvit teip sitter rundt venstre hånd så lenge kuttet varer (`c.cut`).
- **Stasjoner** (`STATIONS`): Ror, Fiske, Haling, Bløgging, Krabbesortering, Sløying, Ising (pakker og iser), Kokk og Pause, og mannskapets egne jobber på redskapen: Egning, Rensing, Bøting, Vedlikehold og Last. Hvert minutt går hver person om bord til den første stasjonen i kjeden sin som har arbeid og plass (`workAssign`, `workCtx`, `stPlaces`). Plassene etter Jonas 20.10.2026 (tilbakemelding #75: «det burde kun være en mann som har ansvaret for haling mens de andre tar seg av bløgging, sløying, og ising fortløpende»):

  | Stasjon | Har arbeid når … | Plasser |
  |---|---|---|
  | Ror | båten går, kaster loss eller har motorstopp | 1 |
  | Fiske | båten jukser (status `fishing` uten redskapsarbeid, juksarigg, ikke stoppet for sløying) | alle |
  | Haling | redskap settes eller trekkes | `BOAT.stations.hauler` (1, 2 på kystbåtene); garn pluss én som plukker fisken ut (`role` `plukk`, bløgger når ingen andre gjør det), teiner pluss én som tømmer, egner og stabler (`teine`) |
  | Bløgging | line eller garn trekkes (fisken kommer om bord) | 1 |
  | Krabbesortering | teiner trekkes. Med noen her slipper halerne å sortere (ellers ×1,3 på tida). | `stations.table` |
  | Sløying | det ligger over 0,5 kg i karet som skal sløyes | `stations.table` |
  | Ising | noe skal ises (det sløyde, og det som er på vei fra bordet) | 1 (2 fra tre bord) |
  | Kokk | et måltid er forfalt | 1 |
  | Egning, Rensing, Vedlikehold | en jobb på lina i køen (`egn`, `strip`, `hk`, `lr`) | én per stamp, høyst `stations.table` + 1 |
  | Bøting | en garnlenke bøtes (`mend`) | én per garn, høyst `stations.table` + 1 |
  | Last | frakt lastes eller losses (`last`) | 2 med kran, ellers 4 |


- **Mannskapet fordeler arbeidet selv** (Jonas 23.10.2026: «mannskapet skal i større grad være mer selvstendige dynamiske mennesker som tar egne valg slik de ville vært ombord på en fiskebåt»). Kjedene (`c.job`, `S.myJob`, `JOB_PRESETS`, «Endre») er borte. `workAssign` i `core/13-work.js` setter hver person om bord der de gjør mest nytte, hvert minutt:
  - **Det som alltid gjøres først:** under fart står noen ved roret: du, ellers styrmannen (`c.mate`), ellers driftsplanens skipper, ellers den med best sjømannskap. Redskap som er halvveis ute, hales. Fisken som kommer over ripa, bløgges. Fangsten bløgges, sløyes og ises, slik bransjen gjør det (Jonas 23.10.2026). Når båten ikke kjøres, står du på dekk med de andre.
  - **Lysten på en oppgave** (`workScore`): arbeidet som venter per hode (`needOf`, høyst 1) + 0,45 × ferdigheten for arbeidet + 0,35 × vanen (`c.hab`, minuttene personen har stått der, som med tida gir en fast plass: «Fast på» på kortet) + trekkene (arbeidsjernet tar det tunge, perfeksjonisten sløyebordet og isinga, den lærevillige det som er nytt) − 0,5 × slitenhet² × hvor tungt arbeidet er (`HEAVY_ST`) + 0,3 for å bli der man står + dagens lille innfall (±0,08, en hash av hvem og dag, ingen terning).
  - **Pause** (`restScore`): 0,12, mer for den makelige og den utslitte, mindre for arbeidsjernet og når samholdet er godt. Pausene velges etter vær, tid og natur (`idleAssign`, `IDLE_ACTS`): kaffe, prat, røyk, snus, telefon, kikkert, matpakke, spyling og feiing. Under fart går de inn, og den som røyker, går akterut. Å kveile tau er tatt bort (Jonas 02.11.2026: det fantes ikke tau å kveile, og bevegelsen var den samme som juksafisket); arbeidsjernet og perfeksjonisten feier i stedet, og den første ved haleren står i haleposen.
  - **Ro på dekk:** en person blir ved oppgaven så lenge den har arbeid, og ser seg om igjen ved et naturlig avbrudd, hvert 20. minutt på sitt eget minutt (`pBreak`), så dekket ikke stokkes om hvert minutt.
  - **Plassene** (`stPlaces`): haleren tar så mange som båten har halere (`stations.hauler`, garnets plukker og teinenes tømmer i tillegg), bløggeren én, sløyebordet `stations.table`, isinga én (to på de store dekkene). Mannskapets jobber på redskapen (`CREW_JOBS`) tas når fisken gir ledige hender. Under trekket, eller med to ved bordet, går den som pakker og iser foran en andre mann ved bordet (`iceFirst`), så den sløyde fisken ikke blir liggende uten is.
  - **Styrmannen** (`setMate`, knappen «Gjør til styrmann» på personkortet, den samme som driftsplanens `S.ops.mate`) tar roret når du ikke styrer selv, også når du sover.
  - **Hvorfor** (`workWhy`, `WORK_WHY`): den sterkeste grunnen står med ord på Mannskap-siden («styrmannen har roret», «er vant med det», «det hoper seg opp» …).
- **Innsats og samhold** (`core/04-crew.js`): `crewEffort(c)` ganger sammen faktorene i `crewDrive` (slitenhet, humør, sult og maten, sjøgang og sjøsyke, mørke, samholdet, en krangel, tung i hodet etter puben, et kutt i hånda, kulde), og `DRIVE_LVL` gir ordene «Står på», «Jevn innsats», «Går litt tregt» og «Har lite å gi». Samholdet (`crewTeam`, `S.team.v` 0–100) går opp med tid sammen, god mat og godt humør, og ned med par som går hverandre på nervene og krangler.
- **Feil på dekk** (`crewSlip` i `core/14-crewlife.js`, Jonas 23.10.2026: «Det skaper realisme»): per arbeidsminutt 0,0012 × (1 + 2 × slitenhet² + sjøgang over 1 m + 2 × kulde + (5 − sløyeferdighet)/3 + 3 × manglende innsats). 45 % mister en fisk over ripa (1,5–4,5 kg), 30 % sløyer en fisk stygt (ferskheten ned), 25 % skjærer seg (`c.cut`, saktere i fire timer). Hver gir en replikk og, i 3D, en animasjon (`hooks.onCrewFx`).
- **Gode råd** (`sayHour`, `adviceWx`, `adviceGround`): de erfarne sier fra om været som kommer, og om bedre fiske et stykke unna når det har vært dårlig en stund. Det er aldri et spørsmål som må svares, bare noe å gå etter.
- **Farten følger dem som står der** (`workTeam`):
  - Fiske: `effortOf(antall ved ripa, maskiner)` × snittet av deres `crewEff`. Faktoren for hender på dekk i `catchFactors` er borte.
  - Sløying: 5 kg/min × `crewEff(c, 'sloy')` per person, og det som er til overs går til ising.
  - Ising: 13,3 kg/min × `crewEff(c, 'is')`.
  - Haling: `gopUnitMin` med snittet av dem ved haleren; bare de ved haleren haler, høyst `stations.hauler` (garnets plukker haler ikke; på teiner teller den ene ved siden av). Ingen ved halingen betyr ingen framdrift. Med fire om bord tar linetrekket nå like lang tid som med én (26,2 min per stamp på 600 kroker, mot 14,8 før), garnet 4,5 min per garn (3,2 før) og teinene 1,3 min (1,1 før); kystbåtene med to halere 18,5 min per stamp.
  - Mannskapets jobber (`CREW_JOBS`: egn, strip, mend, hk, lr, pr, jg, last) går med dem som står på dem (`jobW`, `jobMinute`): timene en jobb ble lagt i køen med, er arbeidet for alle om bord da (j.w i én persons minutter); hvert minutt går den med farten til dem på stasjonen (egning og rensing: to dobbelt så fort som én, hver neste en halv), og sluttida og timene (`j.until`, `j.h`) følger dem, så køen viser tida som er igjen. Ingen på jobben, så venter den.
  - Du teller som 1, eller 0,75 med energi under 25 %.
- **Menyen «Mannskap»** (`ui/05b-work.js`, ny 23.10.2026, knappelinja i havn og på sjøen så snart du har mannskap eller en driftsplan; ansettelser ligger under Bygd, «Ansatte»):
  - Øverst står samholdet og «N mønstret på» med hvor båten er.
  - «På dekk nå» er brikker, én per arbeid som er i gang (flyten etter riggen: haling eller fiske, bløgging, sløying, ising, og mannskapets jobber og kokken), med navnene på dem som står der. Under står «Venter:» med det som ligger og venter.
  - Så ett kort per person, med deg først: hva personen gjør og hvorfor, innsatsen med ord, målere for energi og humør, det siste personen sa, «Fast på» og merkene Styrmann, Skipper, Skåret seg og Sjøsyk. Et trykk på navnet åpner personkortet med ferdighetene, trekkene og flere replikker, og knappen «Gjør til styrmann».
  - De som har fri, står som korte linjer nederst («Fri»), og under dem kortet «Fast driftsplan».
- **Læring** (`learnHour`, hver time per person om bord utenfor havn): Minuttene per stasjon (`c.wk`) trener ferdigheten for den stasjonen.
  - Formel: vekst = 0,012 × alder × trivsel × lærevillig (×2) × (1 − ferdighet/5,5) per hel time.
  - Alder: 1,7 for 18 år, 1,3 for 30, 1,0 for 40, 0,7 for 50, 0,45 for 60 og 0,3 for 75, lineært mellom.
  - Trivsel: 0,2 under 30, 0,6 under 50, 1 opp til 75 og 1,25 over.
  - Hvilken ferdighet: Haling trener redskapet båten er rigget for, Ror trener sjømannskap, og Kokk trener matlaging.
  - Hvert hele steg logges og gir gjerne en replikk.
- **Mat:**
  - Det er et måltid hver 6. time på sjøen, og bare med mannskap om bord. I havn spiser folk i land.
  - Den som står ved Kokk, lager mat i 30 minutter, og kvaliteten er kokkens `attr.kokk` avrundet. Lager du maten selv, blir den 3.
  - Er ingen ledig innen én time, blir det tørre brødskiver (kvalitet 1).
  - Rettene går fra brødskiver via pølser i lompe, fiskekaker og kokt torsk med poteter til mølje.
  - Matstell (`foodScore`) er snittet av de fire siste måltidene og er 3 uten måltider. Trivselen får (matstell − 3) × 3.
  - Sjansen for krangel ganges med 1,6 når matstellet er under 2,5, og med 0,7 når det er over 3,5.
  - Et måltid på 4 eller mer gir deg +4 % energi.
  - Tilstanden ligger per båt i `S.meal`.
- **Hviletid** (forskrift om arbeids- og hviletid på fiskefartøy, FOR-2017-11-10-1758 § 3):
  - **Bare med rederi** (Jonas 08.10.2026): kravet gjelder først når spilleren har `S.company` (kjøpt seg inn i lukket gruppe eller stiftet AS). Før det kan mannskapet jobbe så lenge de har energi; bare tretthet (`fatigue`) setter grensen. `restRuleOn()` i `14-crewlife.js` slår av `restHour`-bruddene og `restLeft` (ingen advarsel, ingen ×1,5 på tretthet, ingen «må hvile innen»). Loggen føres likevel, så reglene gjelder fra første time når rederiet starter. (`tests/restruletest.py` ble fjernet med regelen.)
  - Kravene: minst 10 timer hvile per 24 timer og 77 per 168 timer, hvilen i høyst to perioder der én er minst 6 timer, og høyst 14 timer mellom hvileperiodene.
  - Hver person har en logg over de siste 168 timene (`c.rest`, 1 = hvile).
  - Ingen av båtene har køyer (`VESSELS.*.berths = 0`), så bare timer i havn eller i land teller som hvile. Med køyer ville en time med høyst 10 minutters arbeid telle.
  - `restCheck` sjekker 14-timersregelen først, deretter døgnet, delingen og uka. `restLeft` gir timene som er igjen.
  - Brudd gir 1,5 ganger raskere slitasje og −8 i trivsel, og én melding per døgn som navngir regelen.
  - Du er unntatt, fordi § 1 holder den som jobber alene på egen båt utenfor. Du har energien i stedet.
  - Følge: en skiff-tur med mannskap på over 14 timer bryter regelen.
- **Replikker** (`SAY`, 102 linjer):
  - Den norske teksten er på nordnorsk, med ord fra brukerens liste (agalaus, au hirre, hustri, sjyen, kokning, låppen på nævan, han står stiv i dag og flere). Den engelske er vanlig engelsk. Grove og nedsettende ord fra lista er ikke brukt.
  - Situasjonene: god og dårlig fangst, fullt kar, kulde, sjøsyke, slitenhet, god og dårlig mat, hvilebrudd, uvær, stille vær, lang tur, lott, nytt ferdighetssteg, morgen, godt og dårlig trekk, og småprat etter trekk.
  - Om lag 60 % av gangene velges en replikk som passer et trekk hos noen om bord.
  - `sayHour` gir høyst én replikk per 1,5 timer per båt, med 55 % sjanse hver time. Hendelser (`crewSay`) kommer straks, men høyst én per 15 minutter.
  - Replikken vises som toast når du er om bord, står i Drift i dagboka, og de fem siste lagres på personen (`c.said`).
- **Energien din** (`S.energy`, 0–100, `energyMinute` hvert minutt):
  - Den synker 100/24 % per time når båten du er om bord på, ikke ligger ved kai.
  - **Hvor du hviler** (Jonas 05.10.2026: «Man skal ikke kunne hvile i en åpen båt, da må man enten seile hjem til naustet sitt eller ta inn på en rorbu», `restRate` i `15-energy.js`):
    - I land, når du har gått inn (`S.rest`, knappen «Hvil» i havn, `restStart`/`restEnd`): i fars naust i hjemhavna (ved begge liggeplassene) stiger den 100/8 % per time, med taket og ovnen raskere (`naustRest`). På en rorbu (5.25i) stiger den 100/6 % per time, for 150 kr natta.
    - Om bord ved kai på en båt med køyer (`VESSELS` `berths` > 0) stiger den 100/8 % per time som før.
    - I en åpen båt (ingen køyer) ved en annen kai står den stille. Advarselen ved 25 % peker på nærmeste rorbu.
    - Mens du hviler i land, er skipperen borte fra båten i 3D (`awaySk` i `view3d.js`). «Gå om bord» eller å kaste loss (`depart`) avslutter hvilen.
  - HUD-raden heter «Energi».
  - Ved 25 % kommer en melding og en toast, og arbeidet ditt går med 0,75.
  - Under 15 % mørkner kantene på skjermen (`#vign`).
  - **Ved 0 sovner du i 8 spilltimer** (`S.sleep`). `#sleep` (z 64) toner til svart og viser nedtellingen i ekte tid.
  - Med mannskap står du utenfor arbeidet, den med best sjømannskap tar roret, og turen går videre.
  - Alene stopper fisket og redskapsarbeidet, og båten driver med vinden i 0,3–0,8 knop (`sleepDrift`). Fra 08.10.2026 (4.12d) stopper den før land eller grunt vann og blir liggende («Båten drev inn mot land og ble liggende der»), og på en rute holder autopiloten kursen og båten går fram til ruta er slutt. Den går aldri på grunn i søvne.
  - Du våkner med 60 %. Det er en antakelse.
  - Søvnen løper også mens spillet er lukket.
  - **Klokka er felles for alle spillerne** (Jonas 03.10.2026). Søvnen kan derfor ikke gå raskere eller spoles over. Den kan bare avbrytes, med mindre hvile:
    - **«Våkn opp»** på søvnskjermen kommer etter første time (`WAKE_MIN`). Du får energien søvnen har gitt så langt (`sleepGain`: 60 % × sovet tid / 8 t).
    - **Du våkner når du kommer tilbake** etter fem minutter eller mer borte (`WAKE_BACK` i `catchUp`), med samme regel.
  - **Brovaktsalarmen** (`EQUIP.brovakt`, 7 900 kr, startverdi, 2 t montering; Jonas 03.10.2026):
    - Døser du av på sjøen, får søvnen `alarmAt` = 3 spillminutter. Da piper den (`SND`), skjermen blir mørkerød og en rød blinkende **ACK** vises.
    - ACK (`alarmAck`) vekker deg med 10 % og gjør deg døsig (`S.drowsy`).
    - Døsig på sjøen døser du av igjen med 3 % sjanse hvert minutt (`h2(S.t, 977)`, så samme minutt er likt for alle). Alarmen går da på nytt.
    - Døsigheten går over når du har hvilt deg til 60 % ved kai, eller etter en hel søvn.
    - Trykker ingen ACK (spillet lukket), piper den videre og du sover som uten alarm.
    - Kilder til selve ordningen er ikke sjekket. BNWAS er påbudt på større skip (SOLAS V/19). Om og når den kreves på norske fiskefartøy, er ikke sjekket.
  - **«Energi av» i Admin** (`S.adm.noEnergy`, `energyOff`; Jonas 03.10.2026, for testing): energien holdes på 100 %, du sovner ikke og døser ikke av, og knappen vekker deg om du sover. HUD-raden viser «av». `sleeptest.py` sjekker den.

## 5.54 Mannskapets arbeid på sjøen og prat om redskapen (Jonas 09.10.2026)

- **Arbeid på sjøen:** egning, krokbytte, reparasjon av line og teiner, bøting og nytt juksesett kan nå gjøres på sjøen (`seaWork()` i `core/10b-gearcare.js`). Kravene:
  - Båten går eller ligger i ro (også til ankers).
  - Den holder ikke på med redskap (`gop`) og er ikke på slep.
  - Det er mannskap om bord. Skipperen alene styrer og kan ikke gjøre det, og får en forklaring.
- **Jobbene:**
  - Knappene under Beholdning vises også da.
  - Jobbene (`CREW_JOBS`) starter med en gang. Mens båten fisker venter de; ellers går de med dem som er ledige (de som sløyer og iser er ikke det), og uten noen ledige skyves tiden ett minutt for hvert minutt (`core/05-vessels.js`, `jobMinute`).
  - Butikkens og verftets jobber går fortsatt bare i havn.
- **Mannskapet på egen hånd:**
  - `careTick` går nå også på sjøen. Mannskapet egner da frie stamper med agnet om bord, og bøter, bytter kroker og reparerer som i havn.
  - Dette skjer også mens en driftsplan går (Jonas 10.10.2026). Egning, krokbytte og reparasjon av line og teiner tar ikke redskap bort fra neste sett (en uegnet stamp settes ikke likevel). Bøting tar en garnlenke av båten til den er ferdig, og planens neste sett kan peke på nettopp den lenka. På en garnplan bøtes derfor ikke garn på sjøen, bare i havn. Testen er `seaworktest.py`.
- **Prat om båten og skipperen** (`vitalsTalk` i `core/14-crewlife.js`, Jonas 10.10.2026): hver time på sjøen sier mannskapet fra når dieselen er under 25 % (`fuelLow`) og under 10 % (`fuelCrit`), og når din energi er under 25 % (`meTired`, bare når du er om bord og våken). Hver ting høyst én gang i spilldøgnet (`S.gsay`), og dieselreplikkene nullstilles etter fylling (over 40 %). Test: `seaworktest.py`.
- **Prat om redskapen:** én gang i timen ser mannskapet på lageret (`gearTalk`). Hver ting sies høyst én gang i spilldøgnet (`S.gsay`), med mannskapets egen stemme og dialekt (`crewSay`: loggen og teksten over hodet i 3D). Det de sier fra om:
  - Kroker: tomt eller lite (`hooksOut`, `hooksLow`).
  - Agn: tomt eller lite (`baitOut`, `baitLow`).
  - Slitt redskap, juksa medregnet (`gearWorn`, `jigWorn`).
  - En ferdig jobb på sjøen (`workDone`).
- **Test:** `seaworktest`.

## 5.33 Karaktersystemet og garderoben (Jonas 10.10.2026)
- **Hva:** spilleren kler figuren sin (kropp mann eller kvinne, hudfarge, frisyre og hårfarge, skjegg, hatt, jakke, bukser, sko, med farger), og mannskapet og folkene på kaia får hvert sitt utseende fra samme katalog. Klærne er nautiske: oljehyre, ullgenser, parka, fleece, sydvest, skipperlue, strikkelue, toppluen, fiskerlue, fiskercaps, hjelm, gummistøvel, ankelstøvel, seilersko. Ingen firmanavn eller merker.
- **Der det står:** planen og status i `docs/karaktersystem.md`. Koden: `core/09i-look.js`, `ui/10g-wardrobe.js`, `vessel3d.js` (`wkPart`, `figureVB`), `view3d.js` (`lookMesh`, `refreshPeople`, `personMesh`). Delene: `tools/harbour/arbeider.py` og `garderobe.py` til `src/data/worker.b64`. Maling i soner: 1 jakke, 3 bukser, 4 hud, 5 hår og skjegg, 6 hatt, 7 sko.
- **Utseendet** er `S.look` for spilleren og `c.look` for hvert mannskap (en liten kode: kropp, hud, frisyre, hårfarge, skjegg, hatt og farge, jakke og farge, buksefarge, sko og farge). Det lagres med spillet. Mannskapet får det første gang det trengs, fra id, alder og kjønn, og forskjellig fra de andre om bord og i flåten (`lookOf`). Folk på kaia og båtene i lokalflåten får sitt fra stedet og nummeret (`lookQuay`) eller båtens id.
- **Hår under hatt:** hver frisyre har en `_h`-utgave uten volum på toppen og med alt som henger festet i et bånd av hår ned i nakken. Under sydvest blir knute, hestehale og flette til en vanlig midlang. `garderobe_bilder.py` måler per hatt og frisyre at ingen flater krysser, at alle deler henger i hodet og at ingenting ligger foran øynene og brynene (skal gi 0). Hjelmens innerreim krysser håret på innsiden (ikke synlig).
- **Redningsvesten (Ø11.4, 06.11.2026; i spillet fra Ø11.5):** en oppblåsbar arbeidsvest på 150–165 N etter Jonas' tre referansebilder (28.10.2026, beskrevet under L6 i `docs/planer/lover-og-regler.md`): en rød krage rundt nakken som går ned over brystet i to tykke, avrundede pølser (76 mm brede, 34 mm tykke) med svart glidelås langs innerkanten, et svart belte på 40 mm med plastspenne midt foran, svart skrittstropp, en rød trekkdråpe under venstre side (bærerens venstre), og refleksfelt på brystet og bak på kragen. Ingen merkenavn, logo, lampe eller sender (V10 C; lampen på en oppblåsbar vest ligger inne i trekket til den blåses opp). Delene i `worker.b64` (fra hoftene som jakkene, 1 940 trekanter hver): `vest` over arbeidsjakka, genseren og fleecen, `vest_o` over oljehyra, `vest_p` over parkaen, og `vestF`, `vest_oF`, `vest_pF` på kvinnekroppen. Hvilken vest som hører til hvilken jakke, står i GLB-ens extras (`vest`: jakkedel → vestdel). Vesten er lagt på det ytterste laget av jakkene den hører til, 3 mm utenfor (lommeklaffene, glidelåsen, knappene, kragen, hetta), med stråler mot kroppen og det høyeste over hvert punkts nabolag, så ingen flate går gjennom noe; kragen går rundt halsen i fast avstand utenfor jakkas egen krage eller hette (0,138, 0,162 og 0,182 m fra halsens akse). `garderobe_bilder.py` måler vesten mot jakkene, hodet, frisyrene som brukes under den, skjeggene og hattene: 0 kryss for alle seks. Mot armene og lårene i stående stilling er det 0, bortsett fra parkavestene (35 par: kragen over parkaens polstrede skulder treffer toppen av overarmen; armene tegnes i alle stillinger i spillet uansett).
  - **Håret under vesten** (antatt i Ø11.4, kan endres): langt hår, hestehale og flette settes opp i knute (`vestHair` i extras: `long`, `pony`, `braid` → `bun`). Pølsene og kragen ligger der det henger, og på dekk settes langt hår opp. Under sydvest blir knuten midlang som før. De andre frisyrene er som før.
  - **Ikke over flytedressen**, som teller som flyteplagg (planen, Ø11.5). Garderoben har ingen flytedress ennå (`docs/karaktersystem.md`); `vestKit` hopper over en jakke som heter noe med `flyte` når den kommer.
  - **I spillet (Ø11.5, 06.11.2026):** på din egen båt til sjøs (`b.status !== 'port'` og ikke ved en levering), på dekk, ikke i havn eller på kaia (Jonas 28.10.2026). Den som står ved roret, har den bare der roret står ute (åpen båt og hardtopp), ikke inne i et styrhus. `seaLook(look, helm)` i `view3d/12-skiff.js` gir utseendet med `v:1`, og `vessel3d.js` `wkKitOf` gjør det til et eget sett (`vestKit`: nøkkelen + `V`, vestdelen fra `vest` i extras, håret etter `vestHair`), så det males og holdes for seg. Det gjelder alle stedene folkene om bord tegnes: arbeidet på dekk (`drawDeck`, redskapsarbeidet i `10-gear.js`, agentene i `20-trawl-seine.js`), båten sett utenfra (`ownPerson`) og de håndstyrte båtene (`refreshPeople` bygger figurene på nytt når båten går ut og inn). Andres båter og folkene på kaia har ingen vest.
  - **Klasjsjekken mot armene i spillet** (Jonas: «Kjør klasjsjekk på vesten mot armene i spillet»): `python3 tools/harbour/vestarm.py` setter armene slik `drawWorker` gjør (skulderen 0,21 m ut og 1,42 m opp, albuen halvveis, hendene fra `poseSegs` i `deckcrew.js` for 27 stillinger) og teller armens trekanter som krysser vesten, men ikke jakka under (armroten ligger inne i jakkas skulder i alle stillingene, 200–500 kryss med jakka alene, så det er figurens ledd og ikke vesten). Med skulderen der den sto, krysset armroten kragen og pølsene i de fleste stillingene (summen over stillingene: arbeidsjakka 307, oljehyra 498 og parkaen 642). Med vesten på settes skulderleddet 2 cm ut og 2 cm ned og albuen 4 cm lenger ut (`VEST_SH` i `vessel3d.js`, både i `drawWorker` og `figureVB`), og da står det igjen 47, 88 og 227 (kvinnekroppen 42, 94 og 228), det meste i stillingene med hendene oppe ved ansiktet (kikkert, snus, kaffe, mat, telefon) og over hodet (vise kranen, hekte av, signal), der armen går over kragen og pølsene foran. I arbeidsstillingene på dekk (hale, plukke, bøte, sløye, jukse, ror, stå, bære) er arbeidsjakkas vest fri, oljehyras har 1 kryss (jukse ved rekka) og parkaens 2–11 (`python3 tools/harbour/vestarm.py` viser tabellen). Resten krever at armene legges utenpå vesten i de stillingene (en egen bane for armen med vest), eller en tynnere krage på parkaen i `arbeider.py` (backloggen).
  - **Lagt til uten å røre de andre delene:** `python3.11 tools/harbour/arbeider.py add` beholder de 63 delene som alt var i `worker.b64` byte for byte og legger bare til de nye (`tools/boats/glbadd.py`). Skyggen som bakes, er ikke lik fra kjøring til kjøring (to kjøringer av samme skript ga annen skygge på 44 av 63 deler), så en full eksport ville endret folkene litt. `tools/boats/qa/glbdiff.py` viser det: 63 av 63 like. `garderobe_bilder.py` skriver ikke lenger `worker.b64` (den kjører `arbeider.py dry`).
- **Hattene** sitter bakoverlente (en skjevstilling i høyden, ikke en dreining: en dreining trakk baksiden inn i hodet), så pannen og øynene er frie.
- **Tegning:** figurene bygges ledd for ledd som før, med delene lagt sammen per utseende. `lookMesh` holder de 40 siste utseendene for folk på dekk og kaia, `personMesh` de for båter sett utenfra. Eget båtutseende bygges på nytt når spillerens eller første mannskaps utseende endres (`refreshPeople`).
- **Garderoben** (`WARD`): et eget skjermbilde med en liten WebGL-visning (samme deler som spillet), dreibar, hel figur eller ansikt, faner for kropp, hud, hår, skjegg, hatt, jakke, bukser og sko, og knappene Ferdig, Avbryt, Tilfeldig og Tilbake til start. Liggende og stående.
- **Ikke gjort ennå:** butikk, fortjente plagg og sesongplagg, og bar hånd i stedet for hansker. Andre spillere ser figuren via `presence.lk`/`ck` (migrering `20261010140000_look.sql`, `lookFromKey`; sendes bare med `pos_put` når serveren kjenner feltene, ellers `WORLDP.noLk`).
