# Folk 2: ny figur og ny bevegelse (plan 13.11.2026)

Status: **FB4 (sjøbeina) har klarsignal og er steg 120 i køen (Jonas 13.11.2026: «Kjør på med FB4 i en ny økt»).** Resten venter på klarsignal. **V2 og V4 er besvart 13.11.2026 (A+, og A, B, C og D).** V1 og V3 er åpne og trengs først før del 2 og 3.

## Hva Jonas ba om

Jonas 13.11.2026, etter å ha funnet «procedural animation»: «Jeg vurderer å gjøre en full redesign av hvordan mennersker ser ut og beveger seg i spillet. Hvor ligger taket for hva vi kan gjøre for at de skal bevege seg så realistisk som mulig?» Svaret i økta var fire trinn, med taket for oss på trinn 3 (skjelett, ekte bevegelse i bunnen, prosedyriske lag oppå). Samme dag: «ja, lag en plan med /planlegg».

Jonas 13.11.2026 (senere, mens FB4 ble lagt i køen): «Menneskene trenger forresten også et sterkt grafisk løft, og større mulighet for tilpasning». Det gjelder del 2 (FB5–FB7) og er skrevet inn der og i V2; det endrer ikke del 1.

Tidligere ord som fortsatt gjelder: «no teleporting» (17.10.2026), «Alle deler av arbeidsprosessene må ha egne animasjoner» (20.10.2026), «Sørg også for at mannskapet aldri "clipper" gjennom vegger, rekka eller andre ting» (23.10.2026), «at arbeidet ombord utføres på en så ekte måte som mulig» (09.11.2026).

## Reglene planen må holde

- **Grafikken er nesten det viktigste.** Ingenting blir styggere eller tregere uten at en måling viser at det må. Hver fase måles før og etter.
- **Lagringene røres ikke.** Utseendet er en kode (`S.look`, `c.look`, `presence.lk`/`ck`; `core/09i-look.js`). Den nye figuren leser de samme kodene, og hver del som finnes i dag (69 i `worker.b64`), får en ny utgave med samme navn. Ingen migrering.
- **Kosmetikk er varig.** Butikken (fase 5 i `docs/karaktersystem.md`) er ikke bygd, så ingen eier kjøpte plagg ennå. Bygges den før denne planen er ferdig, gjelder kravet over også for det som er solgt.
- **Aldri gjennom ting.** Vaktene (`poseHits`, `unclip`, `sideways` i `deckcrew.js`, testen `crewclip`) ligger over alt, også over opptak.
- **Én felles verden.** Figurene er utsikt, ikke spilltilstand (som i dag): ingenting lagres, og simuleringen (`workAssign`) bestemmer fortsatt hva folk gjør.
- **Ingen kode velger etter båttypens navn.**
- **Porten er frossen.** Alle fasene går under lanseringslinja i `docs/planer/koen.md`. Jonas styrer rekkefølgen der.
- **Ingen ekte navn på verktøy eller biblioteker i spillet.** I doku og kommentarer kan kildene nevnes; krediteringen en lisens krever, legges der lisensen sier.

## Hva som finnes i dag

- **Tre lag.** Simuleringen sier hva (`workAssign`, `core/13-work.js`). Agentene sier hvor (`crewSim` i `src/js/deckcrew.js`: gangkart fra modellen, A*, 1,2 m/s, 0,4 m avstand, saktere ved rulling over 0,14 rad og stopp over 0,21). Tegningen sier hvordan (`drawWorker`, `src/js/view3d/08-plants.js:149`).
- **Figuren er stive deler, ikke et skjelett.** `worker.b64` (1,96 MB, 67 788 trekanter i alt, 69 deler, ingen `skins`): torso 1 204 trekanter, hode 936, støvel 678, hånd 1 568, lemmene rundt 200 hver; en figur nært er rundt 5–6 000 trekanter og rundt 14 tegnekall. Delene lages av `tools/harbour/arbeider.py`, `garderobe.py`, `hender.py` og `vestarm.py`.
- **Stillingen regnes og tegnes i samme funksjon.** `drawWorker` har rundt 45 oppgaver (`gutw`, `bleed`, `gaff`, `pick`, `egn`, `mend`, `cold` …), hver som håndpunkter over tid. `workLow` gir knebøy og ryggbøy, `workTurn` vridningen, hodet ser på kameraet innen 7 m (`st.peek`).
- **Lemmene strekkes.** Albuen er midtpunktet mellom skulder og hånd skjøvet ned og ut (`elOf`, `08-plants.js:404`), kneet det samme, og `limbM` (`view3d/13-instruments.js:234`) strekker delen mellom punktene. Ekte to-ledds IK finnes bare for småbåtens skipper (`armTo`, `13-instruments.js:240`).
- **Gangen er en sinus med fast takt** (`T * 6.5`, `08-plants.js:157`) uansett fart, så føttene glir.
- **Rullingen:** agentene får bare `bv.roll` (`view3d/24-cinema.js:407`). Figuren står loddrett på én høyde (`gy`, `view3d/20-trawl-seine.js:144`). «Høyden per fot fra dekkskartet; kroppen lener seg 30 % mot rullingen» (1.3 i `docs/mannskap-plan.md`) er ikke bygd.
- **Klippevakten kjenner stillingen i en kopi** (`poseSegs`, `deckcrew.js`: «as drawWorker draws it»), ikke fra tegningen selv.
- **Figurer tegnes seks steder:** `drawWorker` (dekk, kai, mottak, bunkers, andre båter nært), `figureVB` (`vessel3d.js:1345`, håndbåtene og båter sett utenfra), `personMesh` (`view3d/19-wildlife-npc.js:184`), småbåten (`view3d/12-skiff.js`), hendene (`handMeshes`, `view3d/09-landing-deck.js:369`) og garderoben (`ui/10g-wardrobe.js`, egen WebGL 1-visning).
- **Måleverktøyet finnes:** `#prof` (`G3.prof`, `view3d/25-controls.js`) deler bildet i ni deler med JS- og GPU-tid. Folk har ikke sitt eget merke; de ligger i «egen båt» og «flåten og ting».
- **Det som er målt på en ekte enhet:** Jonas' telefon (A52s) ved Tromsdalen 10.11.2026: 12 bilder/s (84 ms), av det JS 18 ms og sjøen 29 ms (`docs/systemer/3d-verden.md` 4.11r). Nettbrettet er ikke målt etter. Enheten har altså lite å gå på, og folk kan ikke koste mer enn i dag.
- **Testene som dekker dette:** `crewclip`, `crewwalk`, `walktest`, `selfcrew`, `worktest`, `workshot`, `deckshot`, `looktest`, `profshot`, `helmjit`, og enhetstestene (`deckcrew.js` er i `UNIT_SRC`).

## Fasene

**Rekkefølgen (Jonas 13.11.2026: «Jeg ønsker å se umiddelbar forskjell i spillet jeg har nå»):** det synlige først. **FB4** (sjøbeina, steg 120), så **FB3** (føttene i gange, med faste beinlengder), så **FB0** (målingen, før del 2), så **FB1 og FB2** (oppryddingen og armene), så del 2 og 3 som de står. Fasene under står i den opprinnelige nummereringen. Det koster litt: FB4 og FB3 skrives i `drawWorker` slik den er og flyttes av FB1, og armene strekker seg fortsatt til FB2. Regnestykkene for balansen og stegene legges derfor i `deckcrew.js` (uten WebGL, med enhetstester), så FB1 bare flytter kallene.

Hver fase er én økt og synes i spillet alene (unntatt FB0 og FB1). Prefikset er FB (figur og bevegelse). «Ferdig når» står per fase; startmeldingen skrives fra dem når steget legges i køen.

### Del 1: dagens figur beveger seg riktig

**FB0. Målingen.** Et eget merke for folk i `#prof` og et oppsett «uten folk», og en teller for figurer i bildet.
- Filer: `view3d/00-head.js`, `24-cinema.js`, `25-controls.js`, `20-trawl-seine.js`. Test: `profshot`.
- Ferdig når: (1) `#prof` viser JS og GPU for folk for seg, (2) `PROFR` har antall figurer og tid per figur, (3) `docs/spill-dette/FB0.md` sier hva Jonas måler: fire på dekk under linetrekk, og ved et mottak med folk på kaia, på nettbrettet og telefonen.
- Gir: budsjettet i ms per figur som resten av planen holder seg innenfor.

**FB1. Stillingen ut av tegningen.** `drawWorker` deles i en ren funksjon som gir leddenes punkter (`src/js/figpose.js`, uten WebGL, som `deckcrew.js`) og en tegner som bare tegner dem. `poseSegs` leser den ekte stillingen i stedet for kopien.
- Filer: `view3d/08-plants.js`, ny `src/js/figpose.js` (inn i malen, `COVER` og `UNIT_SRC`), `deckcrew.js`. Tester: ny enhetstest, `crewclip`, `workshot`.
- Ferdig når: (1) bildet er likt som før (samme avvik som mellom to kjøringer), (2) enhetstesten kjører alle oppgavene en hel syklus i node og skriver lemlengdene og fotgliet som de er i dag (tallene de neste fasene skal slå), (3) `crewclip` grønn på den ekte stillingen.
- Synes ikke i spillet. Alt etterpå bygger på den.

**FB2. Faste armer og bein.** To-ledds IK med faste lengder (regnestykket fra `armTo`), albue og kne i riktig retning. Når hånda ikke når målet, går kroppen etter: ryggen bøyes, hofta vris, eller han tar et halvt steg, i stedet for at armen vokser.
- Filer: `figpose.js`, `view3d/13-instruments.js`. Tester: enhetstesten, `crewclip`, `workshot`, `deckshot`.
- Ferdig når: (1) over- og underarm, lår og legg holder lengden innen 1 mm i alle oppgavene gjennom hele syklusen, (2) hånda er innen 2 cm av det den holder i hver oppgave, (3) ingen ny klipping, (4) tid per figur ikke over FB0.
- Risiko: mange av de 45 oppgavene er skrevet for armer som strekker seg. Hver må ses på.

**FB3. Føttene.** Foten står stille på dekket (i båtens ramme) til kroppen har gått forbi, og tar så et steg; steglengden og takten følger farten. Start og stopp myke, steg når han snur på stedet, hofta gynger, armene svinger mot beina, og en som bærer, går tyngre. Agentene får akselerasjon.
- Filer: `figpose.js`, `deckcrew.js`. Tester: enhetstesten, `crewwalk`, `crewclip`, `selfcrew`.
- Ferdig når: (1) foten som står, flytter seg under 1 cm mot dekket i gange i 1,2 og 0,78 m/s og i sving, (2) ingen fot inne i en vegg, et kar eller en annen fot, (3) gangtidene mellom stasjonene er som før innen 10 % (`crewwalk`), så arbeidet ikke går saktere.

**FB4. Sjøbeina.** Hver fot står på dekket der dekket er (høyden per fot, dekket som krenger), kroppen holder seg nær loddrett og lener seg mot rullingen, knærne tar opp hivet, føttene står bredere jo mer sjø, en hånd går til rekka over en grense, og et støttesteg når hun ruller forbi neste. Stampingen sendes med rullingen.
- Filer: `figpose.js`, `deckcrew.js`, `view3d/24-cinema.js`, `view3d/20-trawl-seine.js`. Tester: enhetstesten, `crewclip`, `mobshot` (dekker `deckcrew.js`), `workshot` i sjø.
- Ferdig når: (1) begge føttene er innen 1 cm av dekket ved 0, 8 og 15° rulling, (2) hodet beveger seg mindre enn dekket under føttene (målt som akselerasjon), (3) arbeidet på hendene treffer fortsatt (kravet fra FB2 holder i sjø), (4) grensene (lening, bredde, når hånda tar rekka) står som tall ett sted, til spilltesting.
- Dette er fasen som skiller et båtspill fra andre.

### Del 2: ny kropp med skjelett

**FB5. Kroppen og skjelettet i Blender.** Mann og kvinne som én sammenhengende kropp hver, med et skjelett på rundt 24 bein (hofte, tre i ryggen, nakke, hode, krageben, overarm, underarm, hånd, lår, legg, fot, tå). Alle delene i garderoben vektes til det samme skjelettet (vektene overføres fra kroppen under plagget). Hendene med de seks grepene beholdes som de er og festes på håndleddet (økta velger dette; fingre med bein kan komme senere uten å gjøre om noe).
- Filer: `tools/harbour/arbeider.py`, `garderobe.py`, `vestarm.py`, ny eksport ved siden av `worker.b64` (den gamle står urørt). Skill: `/blender`. Kontrollbilder: hver del i hvilestilling og i fem ytterstillinger (armene opp, dyp knebøy, sittende, bøyd over rekka, vridd).
- Ferdig når: (1) hver av de 69 delene har en utgave med samme navn, (2) ingen flate går gjennom en annen i de fem ytterstillingene (målt, som `garderobe_bilder.py` gjør for hår og hatt), (3) trekantene per figur er ikke flere enn i dag, (4) fila er ikke større enn dagens med mer enn det FB0-budsjettet og nedlastingen tåler (måles og skrives).
- Utseendet følger V2. **Jonas 13.11.2026: «et sterkt grafisk løft, og større mulighet for tilpasning».** FB5 er derfor ikke bare dagens figur med skjelett: kroppen, ansiktet, hendene og stoffet lages på nytt med mer form og bedre materialer, og kroppen bygges slik at den kan tilpasses (se FB5b). Løftet hentes først der det ikke koster bilder i sekundet (form, proporsjoner, farger, bakt lys, folder i nettet), og trekantene og nedlastingen settes av målingen i FB0.

**FB5b–FB5d. Tilpasningen (ny, etter Jonas 13.11.2026; V4: alle fire).** Hva spilleren kan endre på figuren sin utover dagens kode (kropp, hud, frisyre, hårfarge, skjegg, hatt, jakke, bukser, sko, med farger). Fire ting er for mye for én økt, så den deles i tre, i denne rekkefølgen:
- **FB5b, kroppen og ansiktet (V4 A og B):** høyde, bygning og alder som synes; ansiktsformer, øyenbryn, øyenfarge, flere skjegg og frisyrer. Bygges inn i den nye kroppen fra FB5 (former som blandes i nettet, ikke egne kropper per valg), og må derfor være med før FB6 viser figuren i garderoben.
  - **Referansen for kroppene (Jonas 13.11.2026, to bilder):** «Jeg tenker jo at kroppene må være noe som disse 3d-modellene slik at folk blir forskjellige og har forskjellige kroppsbygninger.» Bildene viser grå grunnkropper på rekke, kvinner (tynn, normal, kurvet, muskuløs og en kraftigere) og menn (tynn, normal, muskuløs, overvektig), alle med samme høyde og holdning og tydelig ulik silhuett: skulderbredde, bryst, mage, hofter, lår og armer. Bildene legges ikke i repoet (som referansetegningene); modellene på bildene er andres og brukes ikke, kroppene lages av våre egne skript.
  - **Slik bygges det (økta velger; kan snus):** én grunnkropp per kjønn med former som blandes (tynn–tung, muskler, kurver, høyde, alder), ikke fire ferdige kropper. Spilleren ser navngitte bygninger som på bildene og kan finjustere; mannskapet trekker tall mellom dem, så ingen to blir like. Formen bakes inn når figuren bygges for et utseende (`lookMesh`), så den koster ingenting per bilde. Skjelettet er det samme, med beinlengder og skulderbredde som følger kroppen; lengdene i FB2 og FB3 må derfor være personens, ikke faste tall.
  - **Det som koster:** hvert plagg må følge hver form (overføres fra kroppen i skriptet, og måles i ytterformene som i FB5). Under oljehyre synes silhuetten (skuldre, mage, armer, bein, høyde), ikke muskeltegningen, så trekantene brukes på silhuett, ansikt, hender og stoff. Ingen figur vises uten klær; kroppen under plagget skjules som i dag.
- **FB5c, plagg og mønstre (V4 C):** flere jakker, bukser, hodeplagg og hansker, og mønster og striper på genser og lue. Etter FB7, når figuren står på dekk.
- **FB5d, små ting (V4 D):** briller, klokke, øredobb og lignende. Tatoveringer ses mot det som finnes (`ui/05-tattoo-art.js`) før noe bygges. Etter FB5c.

- **FB5e, klær etter været og arbeidet (ny, Jonas 13.11.2026):** «Jeg tenker at klesvalg i stor grad også burde være kontekstuell, slik at mannskap ikke står med varmekjeledress i +20 varmegrader.» Figuren har i dag ett fast antrekk; bare lua og hetta (`coldLook`, `view3d/08-plants.js:148`) og redningsvesten (`seaLook`, `view3d/12-skiff.js:95`) følger forholdene. Spillet kjenner alt det trenger: effektiv temperatur med vind (`effTemp`, `core/03-simulation.js:1370`), nedbør (`precipAt`), sjøsprøyt (`hsAt`), hva hver person gjør (`workAssign`), og hvor mange sett oljehyre og varmedress båten eier (`S.clothes`, som alt virker på kuldestraffen i `coldPen`).
  - **Lag, ikke antrekk:** innerst (t-skjorte, ullgenser, hettegenser, fleece), ytterst (oljejakke, oljebukse med seler, varmedress eller flytedress, regnjakke), hode (lue, caps, sixpence, sydvest, hette), hender (fiskehansker i arbeid, bare ellers), føtter (støvler om bord, sko i land).
  - **Reglene (startverdier):** arbeid med fisk på dekk gir oljebukse med seler uansett temperatur (som på bildene: hettegenser og oransje selebukse); regn eller sprøyt gir oljejakke og sydvest eller hette; under rundt 5 °C effektivt kommer ullgenser under og varmedress på den som står stille; over rundt 15 °C og tørt går jakka av, ned til t-skjorte; ved roret inne og i land går arbeidstøyet av. Tersklene har slingring, og ingen skifter oftere enn én gang i spilltimen.
  - **Det som synes, er det båten eier:** oljehyre og varmedress vises bare på så mange som `S.clothes` har sett til. Den som mangler, står i genseren i regnet, og kuldestraffen får et ansikt. Fargen og snittet er personens egne (kosmetikk); om plagget finnes om bord, er spillets (utstyrsbutikken, som i dag).
  - **Ingen skifter foran kamera:** skiftet skjer når personen er inne (døra, `helm`, køya) eller ved klokkehopp.
  - **Kan komme tidlig:** reglene kan bygges på dagens figur med dagens plagg (genser, fleece, oljehyre, parka, lue) som et eget kort steg etter steg 120 (som eier `08-plants.js` nå), og følger med over til den nye kroppen. Hvem som velger antrekket, er V5.
  - Filer: `core/09i-look.js` (lagene og reglene som en ren funksjon, med enhetstest), `view3d/08-plants.js` og `view3d/12-skiff.js` (`coldLook` og `seaLook` går inn i samme regel), `ui/10g-wardrobe.js` (om V5 A). Tester: enhetstesten, `looktest`.
  - Ferdig når: (1) samme person, tid og vær gir samme antrekk hver gang og for alle som ser båten, (2) ingen står i varmedress over 15 °C eller i t-skjorte i regn og kuling (enhetstest over et år med vær på tre steder: sør, midt, nord), (3) ingen skifter i bildet, (4) antall sett i `S.clothes` synes.
- **Referansen for klærne (Jonas 13.11.2026, tolv skjermbilder av bildesøk, «random google-bilder til inspirasjon»):** oljehyre (oransje, gule og røde selebukser, jakker med ermer i annen farge og hette i varselfarge, og de gamle lange hyrene), sydvest (gul, blå, svart, rød, varselgul), ullgenser (islender i hvitt og grått med stripete vrangbord, gensere med fisker i mønsteret, rundfelling i grønt og brunt), varmekjeledress (svart, varselgul og svart, blå og svart, oransje, med refleksbånd), yrkesfisker i arbeid (oransje selebukse over svart hettegenser, oransje jakke, flytedress i svart og gult, hjelm), t-skjorte (hvit, svart, blå, marine), hettegenser (grå, marine med glidelås, gul, oliven, lyseblå), støvler (grønne termostøvler med brun såle, svarte, marine med oransje såle), fiskehansker (rød, blå og grønn PVC med lang mansjett i svart eller annen farge; svart neopren), lue (ribbestrikket i svart, marine, grå, hvit og oransje, med og uten dusk; pelslue med øreklaffer), caps (vanlig, med netting bak, vasket denim, tofarget) og sixpence (tweed, fiskebein, ensfarget). Bildene legges ikke i repoet. **Merkene på bildene bygges ikke inn** (ingen ekte firmanavn uten skriftlig avtale); plaggene heter etter typen, og et ekte merke kommer bare gjennom sponsordataene (`docs/planer/butikker-og-sponsorer.md`).
  - **Nytt mot dagens katalog:** selebukse som eget plagg, t-skjorte, hettegenser, varmedress og flytedress i ett stykke, hansker som egen plass (med lang mansjett), pelslue og caps med netting. **Mønster** (islender, fisker, rundfelling, tweed) krever et lite mønsterbilde på plagget; figurene har i dag bare farger per sone, så det er nytt i tegningen og må måles.

Felles for alle: koden utvides bakover-kompatibelt: en gammel kode gir samme figur som før, og nye felt har en startverdi.
- Filer: `core/09i-look.js` (koden og katalogen), `tools/harbour/garderobe.py`, `ui/10g-wardrobe.js`, `presence.lk` (lengden på koden mot skyen sjekkes; trengs en migrering, kjører Jonas den på testprosjektet først). Tester: `looktest` (gamle koder gir samme figur), garderoben i begge formater.
- Ferdig når: (1) hver gammel kode i `looktest` gir samme utseende som før, (2) de nye valgene synes i garderoben og på dekk og for andre spillere, (3) mannskapet trekker fra de samme nye valgene, så ingen to er like, (4) ingenting av det nye er til salgs (butikken er fase 5 i `docs/karaktersystem.md` og ekte penger går som PR til Jonas).

**FB6. Skinning i motoren, sett i garderoben.** GLB-leseren (`glbParse`, `vessel3d.js:375`) leser bein og vekter, en variant av lysprogrammet bøyer kroppen etter beinmatrisene (WebGL 2 og 1), og `figpose.js` gir beinmatriser fra de samme leddene som i dag. Garderoben viser den nye figuren bak `#folk2`, med den gamle ved siden av.
- Filer: `vessel3d.js`, `view3d/01-shaders.js`, `ui/10g-wardrobe.js`, `figpose.js`. Tester: `looktest`, `f1test` (begge kontekstene), nytt skjermbildeløp av garderoben i begge formater.
- Ferdig når: (1) alle utseendekodene i `looktest` tegnes med den nye kroppen uten hull eller flater gjennom hverandre, (2) lik i WebGL 2 og 1, (3) `docs/spill-dette/FB6.md`: Jonas ser de to figurene side om side på nettbrettet og sier om stilen holder.
- **Stopp-punkt:** Jonas ser den før den går på dekk.

**FB7. Skjelettfiguren på dekk og kai.** Tegneren i `drawWorker` byttes til den skinnede kroppen bak `#folk2`: ett til tre tegnekall per figur i stedet for rundt 14. Figurene som er bakt inn (håndbåtene, båter sett utenfra) stilles én gang på prosessoren fra samme skjelett. Utseendebufferne (`lookMesh`, `personMesh`) bærer den nye kroppen.
- Filer: `view3d/08-plants.js`, `12-skiff.js`, `19-wildlife-npc.js`, `20-trawl-seine.js`, `09-landing-deck.js`, `vessel3d.js`. Tester: `crewclip`, `workshot`, `deckshot`, `looktest`, `profshot`, `vesseltest`. Stikkprøver: tre havner (sør, midt, nord) med folk på kaia.
- Ferdig når: (1) alle seks tegnestedene bruker den nye kroppen bak merket, (2) `#prof` på nettbrettet viser at folk ikke koster mer enn i FB0 (`docs/spill-dette/FB7.md`), (3) ingen ny klipping, (4) når Jonas har sett den: merket blir standard, og den gamle figuren og `worker.b64` tas ut i samme økt (ikke to figurer å holde ved like).

### Del 3: ekte bevegelse i bunnen

**FB8. Klipp: gange og hvile.** Et lite klippformat (beinenes vinkler over tid, noen kB per sekund), et skript som fører et opptak over på vårt skjelett, og blanding: klippet gir grunnstillingen, lagene fra del 1 ligger oppå (føttene låses, hendene til målet, balansen, blikket). Første klipp: gange i to tempo, stå og hvile med vektskifte, sette seg og reise seg, bære, snu. Hver person får sin egen takt og holdning (alder, slitenhet).
- Filer: ny `tools/folk/klipp.py`, `src/data/`-fil for klippene (hentes ved oppstart som de andre), `figpose.js`. Tester: enhetstesten (fotgliet og lengdene fra FB2–FB4 holder med klipp under), `crewwalk`, `crewclip`.
- Ferdig når: (1) lisensen for hvert opptak er lest på kildens egen side og står i `docs/systemer/folk-om-bord.md` med lenke og krediteringen den krever, (2) kravene fra FB2–FB4 holder, (3) Jonas har sett gangen på nettbrettet ved siden av FB3-gangen (`#klipp0` slår klippene av) og valgt.
- **Stopp-punkt:** ser den prosedyriske gangen fra FB3 like bra ut, stopper planen her, og klippene tas ut.

**FB9. Ekte arbeid: sløyingen.** Videoen Jonas sendte av sløyingen 23.10.2026 (bare om den er hans egen og den som filmes, samtykker), eller en ny, gjennom et verktøy som leser kroppsstillingen fra video, renset og ført over på skjelettet. Hendene går fortsatt til det ekte bordet, fisken og kniven med IK. Settes opp mot dagens håndskrevne `gutw`.
- Filer: `tools/folk/`, klippfila, `figpose.js`. Tester: enhetstesten, `workshot`, `crewclip`.
- Ferdig når: (1) sløyingen går fra opptaket med hendene innen 2 cm av fisken og bordet, (2) videoen ligger ikke i repoet, bare beinvinklene, (3) Jonas har sett de to ved siden av hverandre og valgt, (4) valget står i planen med hva en oppgave kostet i tid (opptak, rensing, innlegging).
- **Stopp-punkt:** herfra avgjør Jonas om resten av arbeidet (bløgging, kroking, egning, haling, garnplukking, ising, fortøyning) skal tas opp, én oppgave per økt, eller bli stående håndskrevet på det nye skjelettet.

## Valgene

**V1. Hvor langt?**
- **A (anbefalt): hele veien til del 3, med stopp-punktene** etter FB6, FB8 og FB9. Hver del står på egne bein, så det koster ingenting å stoppe.
- B: bare del 1 (FB0–FB4). Dagens figur, riktig bevegelse. Minst arbeid, og skjøtene i skuldre og albuer blir stående.
- C: del 1 og 2 uten opptak. Ny kropp, all bevegelse håndskrevet.

**V2. Hvordan skal de se ut?** (styrer FB5) **Besvart 13.11.2026: «Utseende V2: A+».** Dagens stil løftet kraftig: ny kropp, nytt ansikt, nye hender og nytt stoff med mer form og bedre materialer, i slekt med båtene og landskapet. Referansebilder fra Jonas trengs fortsatt før FB5.
- **A (anbefalt): dagens stil, men én sammenhengende kropp med bedre proporsjoner, og stoff som folder seg i leddene.** Tåler nettbrettet, og bevegelsen kan holde følge med utseendet.
- B: merkbart mer realistisk (flere detaljer, ansikter med trekk). Flere trekanter og større nedlasting, og småfeil i bevegelsen synes mer.
- C: tydelig stilisert. Tilgir mest, men bryter med båtene og landskapet.
- Uansett valg: referansebilder fra Jonas av det han ser for seg, før FB5.
- **Etter Jonas 13.11.2026 («et sterkt grafisk løft»):** A slik den sto, er for lite. Valget står nå mellom **A+ (anbefalt): dagens stil løftet kraftig**, altså ny kropp, nytt ansikt, nye hender og nytt stoff med mer form og bedre materialer, men fortsatt i slekt med båtene og landskapet, og **B: mot det realistiske**. Anbefalingen er A+ fordi telefonen ga 12 bilder/s, og fordi småfeil i bevegelsen synes mer jo mer ekte kroppen ser ut. Referansebildene avgjør.

**V4. Hva betyr «større mulighet for tilpasning»?** (styrer FB5b; flere kan velges) **Besvart 13.11.2026: «V4: ABCD».** Alle fire: kroppen, ansiktet, flere plagg og mønstre, og små ting.
- **A (anbefalt): kroppen.** Høyde og bygning (for eksempel tre av hver), og alder som synes.
- **B (anbefalt): ansiktet.** Noen ansiktsformer, øyenbryn, øyenfarge, og flere skjegg og frisyrer.
- C: flere plagg og mønstre (flere jakker, bukser, hodeplagg, hansker, mønster og striper på genser og lue).
- D: små ting (briller, snusleppe, tatoveringer, klokke, øredobb).
- A og B er anbefalt først fordi de må bygges inn i den nye kroppen fra starten; C og D kan legges til når som helst etterpå og er det butikken senere kan selge.

**V3. Hvor kommer arbeidsbevegelsene fra?** (styrer FB9; kan vente til FB8 er sett)
- **A (anbefalt): Jonas filmer ekte fiskere med telefonen, med skriftlig samtykke.** Det nærmeste «så ekte måte som mulig» det går an å komme, og ingen andre har det.
- B: bare frie bibliotek for gange og hvile; arbeidet blir håndskrevet som i dag.
- C: leie eller kjøpe opptaksutstyr. Bedre fingre og føtter, men ekte penger og mer arbeid per opptak.

**V5. Hvem velger antrekket?** (styrer FB5e)
- **A (anbefalt): du setter opp stilen din, spillet velger laget.** I garderoben velger du plaggene dine per plass (din genser, din lue, din hyre og fargene), og spillet tar av og på etter vær og arbeid. Mannskapet gjør det samme med sin egen stil. Du får ditt eget utseende uten å måtte kle deg om selv.
- B: helt automatisk for alle; garderoben velger bare kropp, ansikt og farger.
- C: du lager hele antrekk selv for hver situasjon (arbeid, fint vær, kulde, i land). Mest kontroll, mest å stelle med.

## Antatt eller usikkert

- **Budsjettet er ikke kjent før FB0.** Telefonen ga 12 bilder/s i havn, så det er ingenting å gi bort. Skinning skal gi færre tegnekall per figur, men det er ikke målt her.
- **Om bevegelse ser naturlig ut, kan ikke måles i en test.** Testene måler fotgli, lemlengder, klipping og tid. Resten ser Jonas på nettbrettet; derfor stopp-punktene.
- **Lisensene er ikke lest på kildenes egne sider.** Søk 13.11.2026 ga bare annenhånds gjengivelser: opptaksbasen fra Carnegie Mellon oppgis som fri også for kommersiell bruk mot kreditering, men en omgjort utgave ligger ute som ikke-kommersiell (CC BY-NC); Adobes Mixamo oppgis som fri i spill så lenge filene er bygd inn og ikke deles videre som filer. FB8 leser originalene før noe hentes.
- **Verktøyet for video til bevegelse er ikke valgt eller prøvd.** De åpne som ble funnet (ett for flere kameraer under GPL/AGPL, ett for én video med ukjent lisens), må prøves på Jonas' video. Fra én video er fingre og fotkontakt svake; FB2–FB4 retter føttene og hendene, men ryggen og hofta kan bli urolige.
- **Samtykke og personvern:** en video av en gjenkjennelig person er personopplysninger. Planen legger til grunn skriftlig samtykke og at videoen blir hos Jonas. Dette er ikke sjekket mot Datatilsynets veiledning; gjøres før FB9.
- **FB1 er en stor omskriving uten synlig gevinst.** `drawWorker` er rundt 300 tette linjer, og `crewclip` og bildesammenligningen er det som skal fange feil.
- **FB2 kan ta mer enn én økt** fordi hver oppgave må ses på. Da er steget `pågår` og fortsetter.
- **Stampingen** er ikke sendt til agentene i dag; hva `03c-stability.js` gir per bilde, sjekkes i FB4.
- **Tallene** (24 bein, 1 cm, 2 cm, 30 % lening, 12°) er startverdier.

## Hva planen ikke gjør

- Ingen ansiktsanimasjon, ingen stoffsimulering, ingen kropper styrt av fysikk (trinn 4 i samtalen: for tungt for nettbrettet).
- Ingen butikk og ingenting til salgs (fase 5 i `docs/karaktersystem.md` er sin egen). De nye plaggene og småtingene (V4 C og D) er gratis til butikken bygges, som resten av garderoben (Jonas 10.10.2026: «gratis til å begynne med»).
- Ingen endring i hva mannskapet gjør, tjener eller koster (`workAssign`, `crewEffort`); gangtidene holdes.
- Ingen endring i lagringene, utseendekodene eller skyen.
- Måkene, fisken og dyrene er ikke med.
- Ingen patchnote før noe synes: FB2, FB3, FB4 og FB7 får hver sin linje.

## Kilder for lisensene (annenhånds, se over)

- https://paperswithcode.com/dataset/cmu-motion-capture
- https://data.4tu.nl/datasets/0448aab2-3332-449f-a8e2-d208cb58c7df
- https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775
- https://github.com/justinjohn0306/Mocapy
- https://www.cgchannel.com/2021/07/the-freemocap-project-markerless-mocap-for-under-100

## Status

- 13.11.2026: planen skrevet (Jonas' økt, grenen `ccr-535ab52d-bv560n`). Venter på V1–V3 og klarsignal. Ikke lagt i køen.
- 13.11.2026 (senere): Jonas: «Menneskene trenger forresten også et sterkt grafisk løft, og større mulighet for tilpasning». Skrevet inn i FB5, ny FB5b, V2 (A+ eller B) og nytt V4.
- 13.11.2026 (senere): rekkefølgen snudd etter Jonas' ønske om synlig forskjell straks, og FB4 lagt i køen som steg 120 under lanseringslinja med startmeldingen `docs/planer/start/120.md`. Jonas: «Kjør på med FB4 i en ny økt».
- 13.11.2026 (senere): Jonas svarte «Utseende V2: A+» og «V4: ABCD». Skrevet inn i valgene; tilpasningen delt i FB5b (kroppen og ansiktet, før FB6), FB5c (plagg og mønstre) og FB5d (små ting). Åpent: V1, V3 og referansebildene før FB5.
- 13.11.2026 (senere): Jonas sendte to referansebilder av kroppsbygninger (kvinner og menn, tynn til tung). Beskrevet under FB5b. Bilder av klær kommer.
- 13.11.2026 (senere): Jonas sendte tolv bilder av klær og ba om klær etter forholdene. Skrevet inn som FB5e, referansen for klærne og V5.
