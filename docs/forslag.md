# Forslagslista: det vi kan gjøre med spillet

Lista over mulige ting å bygge, samlet 13.10.2026 etter at Jonas ba om ti forslag som gir dybde og sjel, og som gjør spillet like gøy alene som sammen med andre. Den fylles på etter hvert. Ingenting her er bestilt før Jonas sier «kjør på»; da flyttes punktet til `docs/engasjement.md` (arbeidslista) eller `docs/slagplan.md`, og planen her er utgangspunktet.

Alle forslagene følger reglene i `docs/engasjement.md`: ingen straff for fravær, betaling bare for fart og pynt, sosialt er additivt, variabel belønning kommer fra sjøen, og hvert forslag skal svare på «hva gir det spilleren å gjøre nå, i dag og denne uka».

Tallene er startverdier som justeres i spilltesting.

## Del A: de fem med plan

Rekkefølgen er også byggerekkefølgen. 14 økter til sammen.

### A1. VHF-praten (3 økter)

**Idéen.** Kysten snakker på VHF, ikke i en chat. Kanal 16 er anropskanalen alle hører. Hvert fiskarlag har en arbeidskanal. Rekkevidden er VHF-ens egen: rundt 30 nm til sjøs, og alle i havn hører hverandre. Du hører bare de du kunne hørt i virkeligheten, og NPC-skipperne snakker på de samme kanalene, så det er aldri stille. Kl. 12 leser Kystradio «Fiskemeldinga»: hva som er levert ved mottakene rundt deg siste døgn, fra ekte landinger (spillernes og NPC-enes).

**For spilleren**
- VHF-radioen (finnes, 6 500 kr i utstyrsbutikken) får en radio-app på telefonen og en smal stripe nederst i 3D og kartplotteren med siste melding. Kanalvelger: 16, lagets kanal, og «Lytt av».
- Meldinger er fri tekst på høyst 120 tegn, én per 10 sekunder, bare for registrerte spillere (gjester lytter). De seks faste frasene fra tutingen beholdes som hurtigknapper.
- Kallesignal: båtnavnet og registreringsmerket, slik det står på skroget («Havgull T-12-T kaller Karl på Skarsvåg»).
- NPC-skipperne får navn, hjemsted og lynne (fra vec-pakkenes NPC-liste, deterministisk av flisens frø, så alle ser de samme navnene). De melder fangst, vær, grunner og erting: «Står godt med sei i strømmen ved Hekkingen. Karl.» Tre–fem linjer i timen innenfor rekkevidde, aldri mer. Dette er «den gamle garde» (B2) i sin første form.
- Fiskemeldinga kl. 12: «Myre 14 tonn torsk, Stø 6 tonn hyse, Andenes 3 tonn sei siste døgn.» Den gjør Salgslaget levende og gir en grunn til å flytte seg.
- Nødanrop («Mayday») som knapp når motoren stopper: andre spillere innen rekkevidde får det som varsel i spillet og kan slepe (slep finnes, `10o-ptow.js`).

**Teknisk**
- Server: tabell `vhf (id, player_id, ch, x, y, text, at)`, RPC `vhf_send` (lengde, takt, vask som `agent_scrub`, bannlyste ord fra `names_banned`), `vhf_get(x, y, ch, since)` som måler avstanden på serveren som `hails_get` gjør. Henting hvert 15. sekund mens VHF er på og spillet er på skjermen, samme mønster som `ui/10n-hail.js`. Rader slettes etter 24 timer.
- Klient: ny fil `ui/10q-vhf.js`, hekter seg på `peerStates()` for hvem som er i rekkevidde, på `hourly()` for Fiskemeldinga og kystradioens varsler (de flyttes inn i samme app), og på NPC-trafikken i `core/01c-vec.js` for NPC-navn og stemmer.
- Fiskemeldinga regnes fra `landings` (det `land_put` sender) i RPC `vhf_fiskemelding(x, y)`: sum per mottak innen 60 nm siste 24 timer, pluss NPC-enes faste anslag der ingen spillere har levert.
- Moderering: «Rapporter» på hver linje skriver til `feedback` med topic `vhf`; admin-fanen får en liste og «Demp i 7 dager». Dempede spillere ser sine egne meldinger, men ingen andre får dem.
- Personvern: fri tekst er personopplysning. Personvernsiden får et avsnitt om at VHF-meldinger lagres 24 timer og kan rapporteres. 13-årsgrensen står.

**Penger.** Ingen. VHF-en koster spillpenger og finnes alt.

**Måling.** Hendelser `vhf_send` og `vhf_listen` i `tm_batch`; trakten får «sendte første VHF-melding».

**Tester.** `vhftest.py` med to sider i hver sin kontekst (som `tabtest.py`), stubbet server: rekkevidde, takt, gjest kan ikke sende, Fiskemeldinga kl. 12, NPC-linjer kommer innenfor rekkevidde og ikke utenfor.

**Økter.** Server og app; NPC-stemmer og Fiskemeldinga; moderering, admin, personvern og test.

### A2. Lofotfisket og årshjulet (2 økter)

**Idéen.** Sesongene finnes som nyheter (`core/09c-seasons.js`). Nå blir de hendelser med en felles tavle: **Lofotfisket** 20. januar–10. april i statistikkområde 00 (Vestfjorden og Lofoten, polygonet ligger i `rules.json`), **Finnmarksfisket** 25. april–15. juni (område 03 og 04), **Seisommeren** 10. juni–31. august (hele kysten), **Krabbehøsten** 1. september–30. november (øst for 26° Ø). Alt som leveres innenfor området i perioden, teller på tavla: per båt, per mottak og totalt. Ingen trenger å vinne; det er å ha vært med som gir noe.

**For spilleren**
- Sesong-appen får et kort øverst: «Lofotfisket 2027, dag 23 av 81. 1 204 tonn levert av 318 båter. Du: 2,3 tonn, plass 41. Myre leder med 212 tonn.»
- Kystposten skriver daglig «Dagens landinger i Lofoten» (fra `landings`) og ukentlig om hvem som leder, og om mottaket som leder. Kystradio åpner og lukker sesongen på VHF.
- Rorbuene i Lofoten viser hvem som ligger der (gjesteboka finnes). Ingen er fulle; fravær skal aldri stenge noen ute.
- Ved slutten: alle med over 1 tonn får merket «Lofotfisker 2027» og en vimpel på båten med årstallet (kosmetikk, varig, synlig for andre; vimpel finnes i merker-systemet). Topp 10 står i Kystposten, og de tre beste får 15 000, 7 500 og 3 000 kr som skreifestivalen i dag.
- Tavla er den samme for alle, så en som spiller alene, ser 300 båter han aldri møter. NPC-landinger teller med på mottakene (ikke på båtlista), så tavla er aldri tom første uka.

**Teknisk**
- Server: tabell `season_ev (id, name_no, name_en, from_md, to_md, area, species[], prize[])`, som Jonas kan redigere i admin uten utrulling. RPC `ev_now()` gir aktive hendelser, `ev_top(ev, year)` gir topp 50 båter, topp 10 mottak og totalen, regnet fra `landings` som `world_top` i dag. Vinnerne skrives inn i `grants` når hendelsen lukker (en cron i Supabase, som push-køen).
- Klient: `09c-seasons.js` leser `ev_now()` ved oppstart og hver time, Sesong-appen (`ui/06d-season-folk.js`) får kortet, `core/09h-press.js` får sakstypen `ev` (daglig og ukentlig), `core/09f-merker.js` får merket og vimpelen.
- Området sjekkes på klienten ved levering (`sell()` vet hvor båten er; `core/03e-rules.js` har «hvilket statistikkområde er jeg i»).

**Penger.** Ingen i tavla. Vimpelen er gratis og kan ikke kjøpes.

**Måling.** Andel aktive spillere som leverer i hendelsens område i uke 1 og uke 4, og dag 7/30-retensjon for dem som fikk merket mot dem som ikke fikk det.

**Tester.** `eventtest.py`: en levering innenfor og én utenfor området, kortet i appen i stående og liggende, merket og vimpelen ved lukking (med klokka flyttet).

**Økter.** Lofotfisket først; de tre andre er bare rader i tabellen.

### A3. Hjellen: tørrfisk fra fars naust (3 økter)

**Idéen.** Fra januar til april henger du skrei på hjell ved naustet. Den henger i rundt tre måneder og tas ned i juni som tørrfisk, verdt omtrent det dobbelte av fersk torsk per kilo rund fisk. Vinden og kulda gjør jobben, og klimaet per sted (finnes, V1) avgjør kvaliteten: Lofoten, Vesterålen og Finnmark er best. Sør for Trøndelag er det for mildt og vått, og der saltes fisken i stedet (saltfisk: to uker i kar, mindre påslag, hele året). Hjellen er synlig for alle som seiler forbi naustet. En lang sløyfe som ingen kan kjøpe seg forbi.

**For spilleren**
- I utstyrsbutikken: «Hjellmateriale, én seksjon» (trevirke og tau, 4 500 kr). Seksjonen settes opp ved fars naust, bare der, og bare når båten ligger der (som trofé-veggen). Én seksjon tar 1 000 kg rund torsk. Høyst fire seksjoner.
- Ved naustet med torsk i lasten: «Heng på hjell». Bare torsk over 2,5 kg, sløyd og hodekappet (hodekapping tar en time per 300 kg for mannskapet, som sløyingen). Vekta synker til 22 % under tørkingen (må sjekkes mot Råfisklagets omregningsfaktorer).
- Mens den henger: temperaturen hver dag teller. Under −4 °C i tre døgn gir frostskade (lavere kvalitet), over +8 °C i fem døgn gir mugg (tapt parti). Regn gjør ingenting. Tatt fra tørrfisknæringens egne beskrivelser; tallene må kontrolleres før de fastsettes.
- Ferdig når 75–90 døgn er gått (kortere i tørr kulde). «Ta ned» legger tørrfisken i naustet. Selges ved mottakene i Lofoten og Vesterålen (de med tørrfiskkjøpere i registeret; ellers til nærmeste mottak med 20 % lavere pris). Pris: forslag 250 kr/kg tørrfisk prima, 170 kr sekunda. Råfisklaget setter ingen minstepris på tørrfisk, så dette er et anslag.
- Kystposten skriver når noen henger over 2 tonn, og når den første tørrfisken i året leveres. Edvard har linjer om hjellen.

**Teknisk**
- Kjerne: `S.hjell = {sec, rows:[{kg, kg0, t0, q, frost, warm}]}` i `core/07c-naust.js`; en daglig sjekk i `hourly()` ved midnatt leser klimaet for `S.home` og oppdaterer kvaliteten. Alt regnes mot felles klokke, så det går mens spillet er lukket (`catchUp` kjører dagsjekkene).
- Produkt: ny vare `torrfisk` i `core/02-species-gear.js` med klasse prima/sekunda, egen linje på sluttseddelen i `sell()` (trekkene er de samme).
- Blender: `tools/harbour/hjell.py`, én seksjon med fisk i fire fyllingsgrader (0, 1/3, 2/3, full), eksportert som de andre havnemodellene. Tegnes i `view3d.js` ved naustets kai. Fyllingsgraden sendes i `pos_put` som ett tall, så andre spilleres hjeller vises ved deres naust innenfor tegneavstand.
- Handelssteder: materialene i utstyrsbutikken, salget på mottaket. Ingenting selges fra naustet (`docs/handelssteder.md`).

**Penger.** Ingen «Ferdig nå» på hjellen: ventetiden er poenget og lengre enn en pause mellom økter, så regelen om ventetid for ekte penger sier nei. Jonas avgjør om en kosmetisk variant kan selges senere.

**Måling.** Hendelser `hjell_hang`, `hjell_down`, `hjell_sell`. Retensjon for spillere med fisk på hjell mot uten.

**Tester.** `hjelltest.py` uten 3D: heng, 90 døgn med klokka flyttet i tre klimaer (Svolvær, Bergen, Vardø), kvalitet og pris; kontrollbilde av modellen.

**Økter.** Modellen og kjernen; UI og salg; klima, kvalitet, Kystposten og test.

### A4. Mannskap med liv (4 økter)

**Bestilt 17.10.2026**, utvidet med fri bevegelse på dekk (ingen teleportering). Planen og statusen står i `docs/mannskap-plan.md`.

**Idéen.** Mannskapet har hjemsted, familie, et mål og en historie som skrives mens de er hos deg. En god mann sparer lotten sin til egen båt, sier opp med en ukes varsel etter to sesonger, og dukker opp som NPC-skipper ved hjemstedet sitt, med navn på AIS og stemme på VHF. En annen vil bli skipper på din neste båt. Noen gifter seg, noen får barn, noen blir skadet og er borte tre uker. De som drar, kan komme tilbake. Mannskapskortet forteller alt som har skjedd.

**For spilleren**
- Nye felt på hvert mannskap: `life = {home, fam (ingen/partner/barn), goal (egenbåt/skipper/ro), saved, story[]}`. Målet synes på kortet fra dag én («Vil ha egen båt. Har spart 48 000 av 400 000»).
- Livshendelser kommer som meldinger fra mannskapet selv, på dialekt: «Æ gifte mæ 20. juni. Trenge tre daga fri.» Ja gir moral til hele mannskapet; nei gir −15 og en linje i historien.
- Avmønstring til egen båt: én ukes varsel, avskjed på kaia, Kystposten skriver «Rune kjøpte sjark i Myre». Fra da er Rune en NPC-båt med hans navn, som fisker ved hjemstedet (spawnes deterministisk innenfor AIS-rekkevidde av hjemhavna) og hilser på VHF. Han står på topplista med anslåtte landinger på mottaket sitt, ikke på båtlista.
- Skipper på båt nummer to: den med målet «skipper» og skippervurdering over 3,5 (rollene fra driftsplanen) kan settes som skipper i flåten, så spilleren ikke trenger å være om bord for at driftsplanen kjører.
- Skader: fall på dekk i grov sjø (sannsynlighet av Beaufort og tretthet), tre uker i land på hyre, melding fra legen. Første bit av SK-planen.
- Tilbakekomst: en som dro, kan dukke opp i børsen igjen etter 1–2 år, med lavere lott-krav.

**Teknisk**
- `core/14-crewlife.js` får `lifeTick()` i den daglige sjekken: sparing (lotten × 0,4), teller mot målet, trekker livshendelser av en liten tabell med vekter per alder og familie. Alt mot felles klokke.
- Alumni: `S.alumni = [{id, name, home, boat, since}]`, høyst 10. NPC-tegningen i `01c-vec.js`/`view3d.js` får en liste med «ekstra NPC-er» som tegnes nær hjemhavna når spilleren er der.
- Historien: `c.story` høyst 12 linjer. Skrives der det alt skjer: `crewSettle`, `sell()` (første lott), `recCatch` (stor fisk), `borsTick` (mønstret på), `crewQuit`.
- Kystposten: sakstypene `alumni` og `bryllup`. VHF: alumni-linjer gjennom NPC-stemmene fra A1.
- Lagringen vokser rundt 400 tegn per mannskap.

**Penger.** Ingen.

**Måling.** Hvor mange har et mannskap med over 30 dager fartstid, og hvor mange svarer på livshendelser.

**Tester.** `crewlifetest.py`: to sesonger med klokka flyttet, avmønstring, NPC-båten ved hjemstedet, skipper på båt to, skade og tilbakekomst. `fleet2test` kjøres fordi flåten berøres.

**Økter.** Felt, sparing og historie; livshendelser og skader; alumni som NPC (etter A1); skipper på båt to og tester.

### A5. Årboka (2 økter)

**Idéen.** Hver måned skriver spillet et månedsbrev, og hvert nyttår en årbok, i samme papirstil som naustets trofé-vegg: beste tur, verste natt, største fisk, pengene, mannskapet som kom og gikk, fyrene du fotograferte, merkene du fikk, kulingene du red av. Den kan deles som ett bilde rett fra telefonen, med spillets navn og detstorebla.no nederst. Den eneste av de fem som henter nye spillere utenfra, og den koster ingenting i drift.

**For spilleren**
- 1. i måneden: brev fra «Boka» i meldingene: «Oktober: 3,2 tonn levert for 94 000 kr. Rune mønstret av. Én kuling. Største fisk: torsk 14,2 kg ved Hekkingen.» Appen «Årbok» viser brevene bakover.
- 1. januar: årboka, 6–8 sider: forsiden med båten (sidebildet fra `pic-TYPE`) og årstallet, året i tall, årets fisk, mannskapet, turene og fyrbildene, været (dagene med kuling, dagen med mest vind), «Kystposten skrev om deg» (sakene med `me:true`), og merkene.
- «Del»-knapp på hver side: Web Share API på Android og iOS gir bildet rett til Messenger, Snapchat eller SMS; på PC lastes det ned. Bildet er 1080×1350, tegnet på et lerret fra samme data.
- Det deles aldri noe om haill, penger brukt eller 💎. Bare det sjøen ga.

**Teknisk**
- Kjerne: `core/09j-aarbok.js` samler fra det som finnes: `S.sales`, `S.rec`, merkene, turene, pressens `me`-saker, mannskapshistoriene (A4), værloggen (ny, 365 tall: dagens høyeste vind, lagret som én streng). Månedsbrevet lages i `hourly()` ved midnatt den 1.; årboka 1. januar. Lagres i `S.aarbok` (høyst 24 månedsbrev og 5 årbøker, rundt 20 kB).
- Tegning: `ui/05i-aarbok.js` med én funksjon som tegner en side på et lerret ut fra sidens data; den samme brukes til skjermen og til delingen. Skriftene er innebygd.
- Deling: `navigator.share({files:[png]})` med fallback til nedlasting. Ingen server. Hendelse `aarbok_share` i `tm_batch`.
- Kystposten: nyttårsutgaven «Året som gikk» for hele kysten fra `world_top`.

**Penger.** Ingen. En trykt årbok på papir kan bli en vare senere; det er en annen plan.

**Måling.** Delinger per aktiv spiller, og nye registreringer med `?fra=aarbok` i lenka på bildet (QR-kode nederst på siden).

**Tester.** `aarboktest.py`: et år med klokka flyttet, 12 månedsbrev og én årbok, alle sidene tegnet uten feil i stående og liggende, delingsbildet skrevet til `tests/out/`.

**Økter.** Datainnsamling og månedsbrevet; årboka, tegningen og delingen.

## Del B: de fem andre fra samme runde

Kort beskrevet. Planen lages når de velges.

### B1. Folk som husker deg
Hver bygd får tre–fem navngitte personer: bestyreren på mottaket, kaikallen, kjøpmannen, verftseieren. De husker hva du har gjort («Du leverte 800 kilo i går, det snakkes om det»), sladrer om andre spillere, gir småoppdrag og åpner fordeler over tid (mottaket holder åpent ti minutter lenger for deg). Ingen tall på skjermen. Bygger på `core/09d-folk.js` (Edvard, bestyreren, Solveig), kaifolket og dialektene. *Solo: verden svarer deg. Flerspiller: de snakker om hverandre, så andre spillere får ansikt.*

### B2. Den gamle garde: navngitte NPC-skippere
NPC-båtene får navn, skippere, hjemsteder og rekorder som står på topplista. «Karl på Skarsvåg» slår deg alltid på sei, til du en dag slår ham, og Kystposten skriver om det. De reagerer på deg: gratulerer, erter, tipser om plasser når de liker deg. Første halvdel (navn og stemmer) kommer med A1; resten (rekorder på topplista, reaksjoner) er dette punktet. *Solo: topplista er aldri tom. Flerspiller: de er de samme for alle.*

### B3. Fiskarlaget som ekte lag
Laget (finnes, `ui/09c-pubsoc.js`) får et eget sjøhus på en kai medlemmene velger, lagets flagg på båtene (kosmetikk), ukas lagsmål («500 kilo hyse til Myre innen søndag») og bygdekamp: hvilket mottak får mest levert denne uka. Alt teller bare oppover, så den som er borte, skader ingen. Lagets VHF-kanal kommer med A1.

### B4. Læremester og lærling
En ny spiller kan velge en fadder blant de erfarne, eller få en automatisk. Fadderen ser lærlingens første turer, kan sende ett råd om dagen over VHF, og får et merke og en linje i Kystposten når lærlingen leverer tredje gang. Lærlingen får første is og agn fra fadderens kai. Verving uten spam. Trenger A1. *Solo: en NPC-fadder (Karl) fyller rollen.*

### B5. Havet som kan ta
Stormnetter som felles hendelser: alle i et område får samme varsel, og den som er ute, må i havn eller holde seg i le. Båter kan skades og i verste fall gå tapt (forsikringen dekker, men ikke lasten), mannskap kan bli skadet, og andre spillere kan redde deg og slepe deg inn, for betaling og heder. Ved mottakene står en minnetavle over båter som gikk tapt. Risiko er simuleringens egen friksjon; den som er i havn eller lukker spillet, er trygg (driftsplanen går til trygg havn). Hører sammen med sikkerhetsplanen SK1–SK6 (OVERLEVERING kapittel 10) og skadene i A4.

## Del C: eldre åpne forslag

Disse står alt i andre dokumenter og er ikke gjentatt her:
- `docs/slagplan.md`, «Flere forslag som gir verdi og lyst til å fortsette»: «Din uke på sjøen» (dekkes av A5), titler, dagens oppdrag fra mottaket, øyeblikk-album med fotomodus, restaurering av fars båt, «Velkommen tilbake» (naboen har passet båten), langsiktige drømmer (kjøpe fars gamle sjark tilbake, bygge nytt naust).
- `docs/engasjement.md`, «Vurderes senere»: fiskarlag per hjemhavn (B3), innholdsutvidelser som havsteget.
- Sikkerhet SK1–SK6: Blender (vest, drakt, leider, livbøye, PLB), risiko, mann over bord, nødstopp, utstyr og kurs, nestenulykker (B5 og A4 tar de første bitene).
- Åpne feil: kino-visningen viser ofte ikke båten; 3D «støttes ikke» på Galaxy A52s (PWA, Android 14); båten vibrerer under seiling i bro-visningen; tilbakemelding #66 (båten ruller lite i smul sjø).
- Skippertak-energien: spørsmålet fra `docs/engasjement.md` står ubesvart.
