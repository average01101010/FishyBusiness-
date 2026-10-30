# Oppdrag 2: leteoppdrag, kjeder, fiskarlaget og Kystvakta

*Plan 30.10.2026, etter `docs/research/oppdrag-forslag.md`. Ingenting her er bygd. Hver fase passer én økt og avsluttes med `/lever` og `/okt-slutt`.*

## Hva Jonas ba om (30.10.2026)

- Leteoppdrag: «spennende og lærerikt, da det lærer spillerne om arter, habitat, bestander og vandringsmønstre og andre relevante ting, men hvordan vi velger å lage oppdragene er viktig for opplevelsen.»
- Oppdragskjeder på tre ledd: «Ja».
- Fiskarlaget: «Ja, dette med fiskarlag må vi satse fullt ut på. Det kan vi et av de viktigste sosiale elementene i spillet.»
- Kystvakta: «Ja, få inn kystvakta.»
- Været som oppdrag: «Nei, vær som oppdrag er et dårlig element.» Strøket.
- Forklar nærmere: mannskapets ærender (2), Kystkartet (7), lærling (8), fars méd (9), ukas fangst (10). Står nederst, under «Forklaringer». Ingen av dem bygges før han har sagt noe om dem.
- Rammen fra samme dag: «Ingenting skal være svakt eller antatt», «alt av oppdrag som legges inn må balanseres». Balanseregelen står i `docs/systemer/oppdrag-og-kystposten.md` («Balansen») og låses av `tests/unit/turer.test.mjs`; hver fase under legger sine tall inn der.

## Hva som finnes i dag

- **Fiskemodellen** (`core/12-heat.js` `heatSample`, `denSp`; `SPECIES` i `02-species-gear.js` med `av` per måned, `skrei`, `dep`, `prod`; eggakanten `eggaArea`; `docs/systemer/fiskerimodellen.md` 5.3): tettheten per art på et sted og en time, den samme som ekkoloddet og varmekartet viser. Fiskeguiden (`ui/06f-fishguide.js`) sier hvor og når per art, uten regioner for torsk, hyse og sei.
- **Oppdragene** (`core/09g-turer.js`): tavla, sju typer, bestyreren med hukommelse (`T.rep`, `turAsk`), hendelser underveis (`turEvent*`), ekkoloddlinja og prøvestasjonen for HI (`turProve`), målebrettet. Hendelsene `tur_*`.
- **Fiskarlaget** (`supabase/migrations/20261009120000_pub.sql`: `lag_join`, `lag_get(w)`; `ui/09c-pubsoc.js` i puben; delte fangstmerker `ui/10l-share.js` med `scope 'l'`): ett lag per havn, medlemskap i puben, ukas kilo per medlem, deling av méd. Ingen mål, ingen tavle, ingen kanal.
- **Sesongtavla** (`EVENTS`, `ev_top`, 30.10.2026): landinger merket med hendelse, sum per båt og mottak.
- **Regelmotoren** (`core/03e-rules.js` `rulesAt`, `ruBlockMsg`, minstemål `ruMinSize`, bifangst og inndragning i salget): vet alt Kystvakta trenger å spørre om. Kilder per regel med lenke (Lovdata, Fiskeridirektoratet).
- **Mannskapet** (`core/14-crewlife.js`, `docs/mannskap-plan.md` del 2): livet deres er planlagt (hjemsted, mål, historie), ikke bygd.

## Fase L1–L2: leteoppdrag

**Idéen.** Oppdragsgiveren (Havforskningsinstituttet som i dag, eller bestyreren) vil vite hvor en art står nå. Spilleren får et område (10–20 nm rundt et punkt) og tre spørsmål som hører til arten: *hvilken dybde*, *hvilken side av kanten eller sundet*, *hvilken tid på døgnet* (for arter der det spiller en rolle). Hun fisker på minst tre steder hun velger selv, og svarer på kortet med det hun så. Fasiten er fiskemodellens egen tetthet, den samme som ekkoloddet, så svaret er sant. Belønningen er tida (fisketimen × 1,0–1,1, som prøvestasjonen), fangsten er hennes, og det som læres, blir værende: etter oppdraget står artens kort i Fiskeguiden med ei ny linje («Hyse i Malangen i mars: 80–140 m, nordsida, best om morgenen»), skrevet av modellen for det området, og et méd i kartet i ett døgn.

**Hvorfor slik.** Tre feller å unngå, og hva som gjør det bra:
- *Ikke en gjettekonkurranse med fasit.* Spilleren skal finne ut, ikke gjette. Derfor velger hun stedene selv, og kortet viser ekkoloddet (varmekartet) som hun ser det, ikke skjult.
- *Ikke en tekst om arten.* Kunnskapen kommer av å ha vært der. Linja i Fiskeguiden skrives først når oppdraget er gjort, og bare for det området.
- *Ikke oppdiktet biologi.* Spørsmålene kommer bare fra det modellen faktisk skiller på: dybde (`dep`), eksponering (`prod`), kanten (`eggaArea`), måned (`av`, `skrei`), døgn (`denTime`). Har modellen ikke noe skille (torsk, hyse og sei har ingen regioner), stilles ikke spørsmålet. Det modellen ikke vet, lover ikke oppdraget. Når fiskemodellen får vandringsmønstre per region (Fiskeguidens «ikke bygget»), får leteoppdragene dem gratis.

**L1 (én økt): kjernen.** `turLete(o)` i `09g-turer.js`: velger art som er i sesong og fiskbar med spillerens redskap (`turSpOk`), et område 10–20 nm unna med minst tre steder der modellen gir ulik tetthet (så det finnes noe å finne), og de spørsmålene modellen kan svare på. Kortet: «Finn ut hvor hysa står ved Malangen», spørsmålene, og «Fisket der» 0/3. Hvert fiskested innenfor området på minst 20 minutter teller (`turLeteMinute`, som stasjonen). Svaret: tre knapper per spørsmål (grunnere/dypere, nord/sør …). Riktig etter modellen gir tida pluss inntil 20 % (som målebrettet), galt gir tida. Hendelser `tur_take` med `k:'lete'`, `tur_done` med antall riktige. Balanse: rent oppdrag × 1,0 (kort) eller 1,1 (middels), ingen plass utover tavlas fire, høyst ett om gangen. Test: `turtest` ny sjekk; enhetstest i `turer.test.mjs` for spørsmålsvalget (ingen spørsmål uten skille i modellen).

**L2 (én økt): det som blir værende.** Fiskeguidens artskort får avsnittet «Det du har funnet ut» med én linje per område (`S.lete[sp][område]`, skrevet av modellen ved fullført oppdrag), og kartet får médet i ett døgn (som fars notatbok ga). Kystposten skriver ikke om det (det er spillerens kunnskap). Merket «Letefisker» med trinn 1, 5, 10, 25 i `ACHL`. Test: `guidetest` (linja står), `turtest`.

**Valg L-A: hvem spør.** A) Havforskningsinstituttet alltid (kildene finnes, Kystreferanseflåten). B) Bestyreren når det er hennes art, HI ellers. **Anbefaling: B**, fordi det gir avsenderen med hukommelse en grunn til, og HI står for det som er forskning.

**Valg L-B: hvor mye spilleren ser underveis.** A) Varmekartet som i dag (spilleren ser tettheten der hun fisker). B) Bare ekkoloddet i 3D. **Anbefaling: A**, fordi oppdraget skal lære å lese, ikke å gjette, og varmekartet er alt det spilleren bruker.

## Fase K1: oppdragskjeder på tre ledd

**Idéen.** Bestyrerens egen bestilling (`turAsk`, fra tredje bestilling levert der) blir første ledd. Leverer spilleren, kommer andre ledd fra samme sted innen et døgn: alltid en annen type (frakt tilbake til der hun kom fra, et fyrbilde for Kystposten av fyret ved mottaket, et leteoppdrag for samme art når L1 finnes). Tredje ledd er bestilling igjen, men med en følge: noe skjedde på kaia på grunn av det du leverte (mottaket fikk kontrakten, kaia bygges ut, bestyreren får ros i Kystposten), skrevet som en melding og en sak i avisa (type `tur`, som lange turer i dag). Kjeden står som ett kort med tre prikker på tavla (goal gradient: du ser hvor langt du er), tar én plass, og hvert ledd betales som sin type. Ingen kjedebonus i kroner; belønningen for alle tre er merket «Fast leverandør i X» og linja i avisa. Aldri to like typer på rad (Kaplan). Bryter spilleren kjeden, står det betalte, og bestyreren sier det samme som ved en gitt-fra-seg bestilling. Hendelser `tur_chain` (ledd 1–3). Balanse: leddene betales etter regelen, ingen ny faktor. Test: `turtest`.

**Valg K-A: hvor ofte.** A) Hver gang bestyreren legger sin egen bestilling (høyst én per uke per mottak i dag). B) Annenhver. **Anbefaling: A**, med samme ukebrems; da er kjeden det hun gjør for dem hun kjenner.

## Fase F1–F3: fiskarlaget

**Idéen.** Laget per havn (finnes i puben) blir det sosiale stedet: ett ukemål, ei tavle, en kanal, et merke, og aldri noe som straffer den som er borte. Alt teller oppover.

**F1 (én økt): ukemålet og tavla.** Serveren: `lag_goal(w)`: lagets kilo denne spilluka og målet, satt automatisk til forrige ukes faktiske landinger fra lagets medlemmer × 1,1 (minst 500 kg, høyst 50 t), så det følger laget og aldri er umulig eller trivielt. `lag_get` utvides med målet, per medlem og per art. Klienten: lagets kort i puben (finnes) og i Sesong-appen under sesongtavla: «Fiskarlaget i Myre: 14,2 av 20 tonn denne uka, 9 båter har levert.» Når målet nås: melding til alle som leverte, og en sak i Kystposten (type `lag`, ny kode på serveren, bare tall og havne-id). Hendelser `lag_goal_hit`. Balanse: ingen kroner. Test: ny `lagtest.py` med falsk database (som `ptowtest`), og `sqltest` for `lag_goal`.

**F2 (én økt): lagets kanal og merket.** VHF-praten (A1 i forslagslista) er ikke bygd, så kanalen i første runde er lagets *oppslagstavle* i puben: faste linjer (som pubens hilsener, aldri fri tekst), «Jeg går ut i morgen», «Seien står ved Hekkingen», «Noen som vil dele garn?», med båtnavn, høyst tre per medlem per dag, slettes etter 48 timer. Merket «Fiskarlaget i X» med trinn for uker med levering (1, 4, 12, 26, 52). Lagets flagg på båtene (B3) er kosmetikk og hører til Malerverkstedet, ikke her. Test: `lagtest`.

**F3 (én økt): bygdekampen.** Hvilket mottak fikk mest levert denne uka, per landsdel (sør, vest, midt, nord), lest fra `landings` (`world_top`-mønsteret). Lagets kort viser plassen og de tre over. Søndag kveld skriver Kystposten ukas vinner per landsdel. Ingen premie i kroner; æren og avisa. Test: `lagtest`, `posttest`.

**Valg F-A: hvem kan være med.** A) Alle registrerte, i havna de velger (som i dag). B) Også gjester. **Anbefaling: A**, fordi gjester ikke er på topplista og ikke sender landinger.

**Valg F-B: målet.** A) Automatisk fra forrige uke × 1,1 (over). B) Laget setter det selv i puben. **Anbefaling: A** i første runde, fordi det aldri trenger en som bestemmer og ikke kan settes så lavt at det er tomt; B kan komme når lagene har liv.

**Valg F-C: bytte av lag.** A) Når som helst, som i dag. B) Først etter uka. **Anbefaling: B**, så ukemålet ikke kan jukses ved å hoppe til et lag som nesten er i mål.

## Fase V1: Kystvakta om bord

**Idéen.** Kystvakta kommer til båten, ved kai eller på feltet, høyst én gang per spilluke, aldri i Første uke, aldri i kuling. Den spør det regelmotoren alt vet for stedet, redskapet og fangsten om bord: fjordlinjer og lengde (§ 31–32), garn og kroker (§ 33), minstemål (§ 47), bifangst, stengte felt, redskap uten merking. Alt i orden: en setning, og «Kontrollert» i papirene, som senker sannsynligheten for neste kontroll i to uker. Et avvik gir nøyaktig det regelverket gir i dag ved levering (inndragning av det ulovlige, ingen ny bot i første runde), med kilden lest opp, og en linje i Kystposten (type `kv`, bare koden for regelen). Spilleren kan se hva Kystvakta vil spørre om før den kommer: Regler-appens «Kan jeg fiske her?» er svaret, og det sies i håndboka. Kystvakta tegnes som en NPC-båt (gråmalt, som slepets båter) som kommer langs siden; i 3D en figur som går over, i første runde bare båten og meldingen. Balanse: ingen kroner. Kilder: høstingsforskriften, J-meldingene, slik regelmotoren siterer dem. Hendelser `kv_check` med utfall. Test: `rulestest` (regelmotoren som før), ny sjekk i `turtest` eller egen `kvtest.py`.

**Valg V-A: følgen av avvik.** A) Bare det som finnes (inndragning). B) Også et gebyr etter forskriften om overtredelsesgebyr (Fiskeridirektoratet), med kilde. **Anbefaling: A** først; B er riktig i virkeligheten, men gebyrsatsene må hentes fra kilden og legges inn med lenke før det bygges.

## Forklaringer (det Jonas ba om å få forklart)

**2. Mannskapets små ærender.** Mannskapsplanen (del 2) gir hver mann et hjemsted, en familie og et mål. Et ærende er at han ber om noe som hører til livet sitt mens båten er ute: «Kan vi gå innom Husøy? Søstera mi har en pakke til meg», «Jeg vil hjem til helga, det er dåp», «Kan vi legge til i Gryllefjord, jeg må kjøpe medisin». Det er en omvei på under 20 minutter eller en fridag, ikke et oppdrag med kroner. Sier spilleren ja, får han det, og det får en følge: han forteller noe om seg selv (ei linje i `c.story`), og han jobber litt bedre i en uke. Sier hun nei, skjer ingenting vondt; han spør ikke igjen på en uke. Poenget er at mannskapet blir folk, ikke lott, og at tavla ikke er det eneste som ber om noe. Det er ikke bygd fordi del 2 av mannskapsplanen (livet deres) ikke er bygd ennå; ærendene hører til den og bør komme der, ikke i oppdragssystemet.

**7. Kystkartet.** Punkt 7 i arbeidslista i `docs/engasjement.md`, som Jonas selv satte opp: en samling for hele landet som fylles av det spilleren alt gjør. Fire lister på ett kart: mottak du har levert til (av 310), fyr du har fotografert (av 134), arter du har landet (av 10 pluss krabbe), statistikkområder du har fisket i (av 60, fra `ruHom`). Ingenting nytt å gjøre; hver levering, hvert bilde og hver tur setter en prikk, og kartet viser hvor mye av kysten du har sett. Trinnene (10, 25, 50, 100 mottak …) gir drypp som ukas merker. Det er endowed progress og utforskning i ett: en som har spilt i en uke, ser at kartet alt har prikker. Det ble ikke bygd fordi det var sist i rekkefølgen min; det er to økter (kartet og trinnene).

**8. Lærling om bord.** Forslaget B4 i forslagslista snudd: ikke en fadder for nybegynneren, men en lærling for den erfarne. Fra ti års fartstid kan en ung NPC mønstre på som lærling. Han koster lott som en mann, jobber som en, og lærer av det spilleren gjør: fisker hun i strøm, setter garn riktig, går hjem før kulingen, spør han etterpå hvorfor, og svarene (tre knapper) blir hans kunnskap. Etter en sesong mønstrer han av til egen båt, blir en navngitt NPC-skipper ved hjemstedet sitt (som mannskapsplanen alt lover for de som drar), og hilser når dere møtes. Spilleren får merket «Læremester» og ei linje i Kystposten. Poenget er at den som har klatret båtstigen, får et mål som ikke er flere tonn: å lære bort. Retention-forskningen sier at det er dette som holder de erfarne. Det er ikke bygd fordi det trenger mannskapsplanens del 2 (livet, avmønstring til egen båt), og helst VHF-praten.

**9. Fars méd langs kysten.** Fars notatbok fantes (5.25d) og ble tatt ut 09.10. Den ga fem méd rundt hjemhavna med fars ord. Forslaget er å ta den tilbake, men spredt: første gang spilleren kommer til et nytt statistikkområde, får hun ett méd der med en setning fra far («Her satte vi line på hausten, på kanten der det går fra 90 til 140 favner»). Médet er sant (det ligger der modellen gir mest av arten på den dybden), og gir 30 % bedre fangst der i ett døgn, som notatboka ga. Det er historie og første-gang-her-opplevelse i ett, uten at det kalles et oppdrag. Det ble tatt ut før; derfor spør jeg i stedet for å bygge.

**10. Ukas fangst (søndagskortet).** Punkt 6 i arbeidslista i `docs/engasjement.md`: hver søndag kveld ett kort i spillet og én push («Ukas fangst»), med plassen på topplista, beste dag, største fisk, hva naboene i havna leverte, og nå også sesongtavla og lagets uke. Det kan deles som bilde. Det er ikke en daily og ikke FOMO: ingenting tapes ved å ikke se det, det er bare å se tilbake. Det ble ikke bygd fordi det er et kort, ikke et oppdrag, og hørte ikke til oppdragsøkta.

## Det planen ikke gjør

- Været som oppdrag (Jonas: nei).
- VHF-praten (A1) og lagets ekte kanal; lagets oppslagstavle er faste linjer til A1 kommer.
- Gebyr fra Kystvakta (V-A B) før satsene er hentet med kilde.
- Lagets flagg på båtene (Malerverkstedet).

## Usikkert

- Leteoppdragene kan bare spørre om det modellen skiller på. For torsk, hyse og sei er det dybde, eksponering og måned; regionene mangler i modellen (Fiskeguiden 5.33 sier det samme). Det er ærlig, men betyr at «vandringsmønster» først kommer når modellen får det.
- Ukemålet × 1,1 er en regel, ikke et målt tall. Den leses av i `lag_goal_hit` mot antall lag etter noen uker.
- Kystvaktas hyppighet (én per spilluke) er et valg for ikke å mase; måles i `kv_check`.

## Jonas' svar (30.10.2026)

- «2. Ja dette er en grei ide, men de må være kontekstualiserte slik at han ikke spør om å dra hjem til feks botnhamn hvis båten ligger i kirkenes, for det blir litt for dumt.» Ærendene bygges med mannskapsplanens del 2, og bare for steder innen rekkevidde av der båten er (hjemstedet innen 40 nm, ellers et ærende som passer der båten er).
- «7. Ja, dette er intressante stats for enkelte, og vil bygge geografisk lærdom.» Kystkartet bygges (K2 under).
- «8. Ja, enig i dette.» Lærlingen bygges etter mannskapsplanens del 2.
- «9. Nei, jeg liker ikke konseptet med fars notatbok og ønsker det ikke tilbake.» Strøket for godt.
- «10. Ja.» Ukas fangst bygges (U1 under).
- «Gjør det du mener er riktig for spillet, men sørg for at det blir så bra som mulig.» Valgene tas etter anbefalingene: L-A B, L-B A, K-A A, F-A A, F-C B, V-A A. F-B: fiskarlaget har alt et ukemål (1 500 kg per medlem som har levert, premie 3 000 kr per medlem, Jonas 08.10.2026, `ui/09c-pubsoc.js`); det beholdes som regel, og F1 flytter det til serveren så tavla, avisa og merket blir felles. Rekkefølgen: F1, L1, K1, V1, F2, L2, F3, K2 (Kystkartet), U1 (Ukas fangst); ærendene og lærlingen når mannskapsplanens del 2 er bygd.

## Status

- 30.10.2026: planen skrevet, Jonas' svar inn samme dag.
- 31.10.2026: **F1 bygd** (`20261030140000_lag_goal.sql`, `09c-pubsoc.js` `lagCard`/`lagHit`, `09h-press.js` `lag`, Sesong-kortet, `lagtest`). Dokumentert i `haill-pub-og-bonus.md`. Migreringen må kjøres. Jonas samme dag: oppdrag bare etter kapasitet (kvote, redskap, båt), skrevet inn under «Balansen» i `oppdrag-og-kystposten.md`.
- 31.10.2026: **L1 bygd** (`turLete`, `turLeteQs`, `turLeteMinute`, `turLeteAnswer` i `09g-turer.js`, kortet med spørsmålene i `05f-turer.js`, `turans` i `14-act.js`; `S.lete`). Dokumentert i `oppdrag-og-kystposten.md`. L2 (Fiskeguidens linjer, merket) gjenstår.
