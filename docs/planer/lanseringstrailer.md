# Lanseringstraileren (plan 13.11.2026, venter på valgene)

Planen for den første traileren som legges ut. Den bygger på arbeidet i `trailer/` (strategien, filmoppsettet, opptakslista v2 og grovklippene m1 og m2 fra 10.11.2026) og bytter premisset. Ingenting filmes eller bygges før Jonas har svart på valgene nederst.

## 1. Hva Jonas ba om

Jonas 13.11.2026: «Jeg skal lage en ny trailer til spillet som jeg skal poste på sosiale medier som tiktok. Dette blir den første traileren jeg legger ut, så den må være knallbra. Jeg tenker litt av premisset med traileren må være å fortelle hva spillet handler om, hvor stort det er og hvilke muligheter som finnes her.»

## 2. Hva som finnes i dag

- **Filmoppsettet virker.** `trailer/tools/film.py` styrer spillet utenfra med Playwright og frossen klokke, ett PNG per bilde, med kontroller for skrog mot land, mast mot bru, kamera mot terreng og hopp mellom bilder (`trailer/HARNESS.md`). `G3.film({eye, tgt, fov})` gir fritt kamera (`view3d/24-cinema.js`). `weather.py` velger vær, `beats.py` finner slagene, `titles.py` tegner teksten, `assemble.py` setter sammen.
- **28 klipp er satt opp** i `trailer/shots/` (naustet, trebåten under Gisundbrua, Reine, Vestfjorden, garn i Lofoten, hvalen ved Bleik, kuling og line ved Vardø, verftet, nordlys ved Hekkingen, kystnotbåten under brua, side om side, seks byer, Svalbard, Færøyene, Shetland, Skottland, Grønland, snøkrabbe ved Svalbard). Kontaktarkene ligger i `trailer/control-m1/`.
- **To grovklipp** (m1 og m2, 50 s, 1080×1920) på låta «Fjord at Dawn» (95,7 BPM, rolig til 17,4 s, pust til 22,4, oppbygging til 27,4, full styrke til 44,9, utgang). Videofilene lå på den leide GPU-maskinen, ikke i repoet.
- **Den gamle fortellingen:** «Fra trebåt … til snurper», bare stedsnavn som tekst, og **intet grensesnitt i noe bilde** (Jonas 10.11.2026).
- **Skyen kan ikke filme.** Uten GPU tar ett bilde 8–45 s. Klipp filmes på en maskin med GPU (0,15 s per bilde på den leide). Enkeltbilder og kontaktark kan lages her.
- **Porten for de første brukerne** (`docs/planer/koen.md`): lenken til spillet legges ikke ved traileren før P1–P6 er grønne. P6 (tre fremmede spiller de første ti minuttene) er Jonas'.

## 3. Vurderingen: hvorfor den gamle ikke svarer på det nye premisset

Den gamle traileren er en vakker reise, men den svarer ikke på de tre tingene Jonas nå vil ha sagt:

1. **Hva handler det om?** Ingen bilder viser at du fisker, leverer, tjener penger eller kjøper noe. Uten grensesnitt og uten en setning som sier det, kan den leses som en naturfilm. På TikTok avgjøres det i de første to sekundene om seeren forstår at dette er et spill han kan spille.
2. **Hvor stort er det?** Stedsnavnene antyder det, men ingen påstand sies rett ut. Seks byer på fire sekunder er pynt hvis ingen har sagt «hele kysten» først.
3. **Hvilke muligheter?** Båtene blir større, men redskapene, mannskapet, rederiet og de andre spillerne nevnes ikke.

Og én ting som må rettes uansett: **kystnotbåten på 38,55 m, som har droppet og sluttbildet, kan ikke kjøpes.** Hun har `lock:true` i `VESSELS` (`core/02-species-gear.js`, «her place in the ladder is not decided»), sammen med fryse­tråleren og ringnotbåten på 75 m. Opptakslistas egen første regel er «alt som vises er spillbart den dagen traileren publiseres», og «… til snurper» lover noe spilleren ikke får. Autolineren (45 m) og snøkrabbefartøyet (50 m) er ikke låst. Se valg V2.

Det som beholdes fra det gamle: metoden, klippene som holder, harde klipp på slag, én lang scene på droppet, trebåten og naustet som begynnelse, ekte steder med navn, og at alt er ekte spillgrafikk.

## 4. Konseptet

**Én setning først, så tre påstander som hver bevises med bilder, så én oppfordring.**

- **Kroken (0–2,5 s):** det sterkeste bildet vi har, med en setning som sier sjanger og størrelse på én gang: «Et fiskespill med hele norskekysten.» Seeren skal vite at det er et spill før tommelen rekker å bevege seg.
- **Hva (2,5–17,4 s, den rolige delen):** du begynner med fars gamle trebåt, du fisker selv, du leverer og tjener, du kjøper større. Her må fisket synes: redskap som dras, fisk om bord, mottaket.
- **Hvor stort (17,4–27,4 s, pusten og oppbyggingen):** fra båten og ut til hele kysten, så stedene og årstidene på slag. «Fra Hvaler til Kirkenes. Ekte kart. Ekte vær.»
- **Mulighetene (27,4–44,9 s, full styrke):** droppet på den største båten spilleren kan eie, så redskapene, mannskapet, flåten og de andre spillerne i samme hav.
- **Oppfordringen (44,9–50 s):** logoen på slaget, så «Spill gratis i nettleseren. detstorebla.no». «I nettleseren» er nytt og viktig: ingen nedlasting er det laveste gulvet et spill kan ha på TikTok.

### Utkast til tekst på skjermen

Tidene følger slagene i `trailer/audio/music-edit-1.json`. Høyst én kort linje per takt, ingen utropstegn.

| Tid (s) | Bilde | Tekst |
|---|---|---|
| 0–2,5 | Sterkeste bilde (velges i T1: kuling ved Vardø, hvalen i midnattssol eller Lofotveggen) | Et fiskespill med hele norskekysten |
| 2,5–7,4 | Naustet, trebåten ved kaia | Du begynner med fars gamle trebåt |
| 7,4–12,4 | Redskapet dras, fisk om bord | Du fisker selv |
| 12,4–17,4 | Mottaket, lossing, sluttseddelen | Lever. Tjen. Kjøp større. |
| 17,4–22,4 | Fra båten og ut til hele kysten | Fra Hvaler til Kirkenes |
| 22,4–27,4 | Steder og årstider, ett slag hver | stedsnavnene |
| 27,4–32,4 | Droppet: den største båten spilleren kan eie | – |
| 32,4–37,4 | Garn, line, teiner, snøkrabbe | Garn. Line. Teiner. |
| 37,4–41,1 | Mannskapet på dekk, flere av dine båter | Eget mannskap. Eget rederi. |
| 41,1–44,9 | Andre spilleres båter i samme farvann | Alle spiller i samme hav |
| 44,9–50 | Logo, så adressen | Spill gratis i nettleseren. detstorebla.no |

Teksten er et utkast. Hver påstand sjekkes mot spillet i T1 før den låses (del 7).

### Én film og fire korte

Hovedtraileren festes øverst på profilen og er den som deles videre. Rekkevidden på TikTok kommer fra korte klipp, så de fire delene klippes også som egne filmer på 8–15 s, hver med sin egen åpning og samme sluttkort: «Hva», «Hvor stort», «Mulighetene» og «Trebåten». De koster nesten ingenting når klippene finnes, og de viser hvilken åpning som holder seerne (målingen i del 6).

## 5. Fasene

Hver fase er én økt. T3 og T5 går på GPU-maskinen; resten kan gjøres her.

| Fase | Hva | Resultat | Ferdig når |
|---|---|---|---|
| **T1** | Faktasjekk og prøvebilder. Hver påstand i teksten slås opp i koden og dataene (del 7). Stillbilder i 1080×1920 av kandidatene til kroken, fisket, mottaket og spilløyeblikkene med grensesnitt (V1), sett i begge formater og sendt til `ask_gemini` i ett kall med spørsmål som kan svares feil («Hva tror du dette er en video av?», «Hva gjør spilleren her?»). Animasjonene om bord sjekkes klipp for klipp: det som ikke holder, vises ikke. | `trailer/script.md` v3 og `trailer/shotlist.md` v3, kontaktark til Jonas | hver tekstlinje har en kilde i koden; Jonas har sagt ja til manus og klippeliste |
| **T2** | Klipp-JSON for de nye klippene (kroken, fisket, mottaket, kartet, mannskapet, flåten, de andre spillerne), med stillbilder herfra til utsnitt og lys. Spillfeil filmen avslører, rettes i spillet på vanlig måte, aldri bare i filmen. | `trailer/shots/*.json`, kontaktark | hvert nytt klipp har et kontaktark uten landvarsler, og Jonas har sett dem |
| **T3** | Filming på GPU-maskinen i 1080×1920, grovklipp m3 på låta. | `trailer/out/rough/m3.mp4` | m3 er 50 s, alle klipp ligger på slag, kontrollene er grønne |
| **T4** | Runder. Jonas ser m3 på mobilen og sender notater med tidskode. Klippet går til `ask_gemini` med 10 bilder i sekundet (hakking, hopp, lesbar tekst, om kroken sier «spill»). To til tre runder. | m4, m5 | Jonas sier at bildet er låst |
| **T5** | Ferdigstilling: full størrelse, lyd til −14 LUFS, sluttkort fra `tools/brand/logo.py`, de fire korte, forsidebilde, teksten under videoen med kildelinja (Kartverket, Mapzen, OpenStreetMap), emneknagger. | Leveransen | fem filer klare til opplasting, og teksten til hver |
| **T6** | Publisering og måling. `#fra=tiktok` i lenka (egen liten endring i spillet, `core/18-telemetry.js`), så trakten i admin kan deles etter kilde. | Tall i trakten | porten er grønn, lenka er lagt ved, og første ukes tall er lest |

## 6. Måling

`CLAUDE.md`: «Mål og se». Traileren er en engasjementsendring.

- **På TikTok:** hvor mange som ser de første tre sekundene og hvor mange som ser hele, per film. De fire korte har hver sin åpning; den som holder best, blir åpningen i neste utgave.
- **I spillet:** `#fra=<kilde>` lagres ved første oppstart og følger med i telemetrien, så trakten (konvolutt → første fangst → første levering → registrert → dag 1/7/30) kan leses per kilde.

## 7. Det som er antatt eller usikkert

- **Tallene er ikke sjekket mot det spilleren møter.** Dataene har 310 fiskemottak (`src/data/mottak.json`, Fiskeridirektoratets kjøperregister og Råfisklagets mottakskart), 194 steder, 9 157 navngitte fiskefelt, åtte arter i `SPECIES` og 15 båttyper hvorav tre er låst. Ingen tall går inn i filmen før T1 har sjekket at spilleren faktisk kan bruke det tallet sier. Utkastet bruker derfor «Fra Hvaler til Kirkenes» og ingen tall.
- **«Du fisker selv» krever at fisket ser godt ut.** Arbeidet om bord er under ombygging (Om bord OB1–OB15, Folk 2). T1 avgjør klipp for klipp. Holder ingenting, vises fisket indirekte (redskapet i sjøen, kar som fylles, mottaket).
- **Sjøen har kjente feil** i enkelte lys og farter (striper i grunt havnevann, skumkrage, flate skumflak; `docs/BACKLOG.md`). Klippene legges rundt dem som sist.
- **Om grensesnittet tåler å filmes,** vet vi ikke før prøvebildene i T1. Kartet tror jeg holder; resten er usikkert.
- **GPU-maskinen:** jeg vet ikke om den fortsatt er leid, eller om m1, m2 og klippene fra 10.11 ligger der. Uten dem filmes alt på nytt (rundt ett minutt per klipp), og det er uansett riktig etter tre dager med endringer i spillet.
- **«Alle spiller i samme hav»:** andre spilleres båter legges inn i filmoppsettet som `PEERS`, slik side om side-klippet gjorde. Det viser det spillet gjør, men det er satt opp, ikke tatt opp fra ekte spillere.
- **Lengden.** 50 s er langt for kald rekkevidde på TikTok. Planen satser på at kroken og de korte klippene bærer det (V3).
- **Lyden:** musikken bærer. Semidieselen under åpningen er fortsatt bare mulig med lydrendering i filmoppsettet, som ikke er prøvd.

## 8. Valgene

**V1. Grensesnitt i bildet.** 10.11 sa Jonas «Ingen UI, UX eller GUI». Det nye premisset trekker den andre veien.
- **A (anbefalt): to–tre korte spilløyeblikk med grensesnitt,** filmet i telefonformat: kartet som zoomer ut fra båten til hele kysten, fangsten som kommer om bord, sluttseddelen. Resten rent. Uten ett bilde som viser at dette styres med fingeren, er «er dette et spill?» den første kommentaren. Bare det som holder i prøvebildene i T1, kommer med.
- B: intet grensesnitt. Teksten på skjermen sier alt.
- C: spillbilder først, filmbilder som pynt.

**V2. Den største båten og løftet.** Kystnotbåten kan ikke kjøpes i dag.
- **A (anbefalt): droppet går til en båt spilleren kan eie,** snøkrabbefartøyet eller autolineren, og teksten lover bare det som finnes. Kystnotbåten kan gå forbi som en av de andre båtene i farvannet. T1 sjekker hele kjøpsveien før noe låses.
- B: kystnotbåten låses opp før publisering. Det er spillarbeid (plassen i stigen er ikke bestemt), og porten er frossen.
- C: bildet beholdes, «… til snurper» strykes. Hun er fortsatt hovedbildet i en film om hva du kan bli, så løftet står der uten ord.

**V3. Lengde og musikk.**
- **A (anbefalt): 50 s på «Fjord at Dawn»,** med kroken lagt foran og de fire korte ved siden av. Låta er analysert, og droppet ved 27,4 s passer overgangen til «mulighetene».
- B: ny låt på rundt 30 s og én strammere film. Bedre for kald rekkevidde, men ny musikk, nytt klippekart og mindre plass til tre påstander.

**V4. Når.**
- **A (anbefalt): så snart filmen holder og porten er grønn,** og en utgave med Lofoten først i uka før Lofotfisket åpner 20. januar (den gamle planen), klippet av de samme opptakene.
- B: vent til januar med alt.
- C: legg ut filmen før porten er grønn, uten lenke til spillet.

## 9. Hva planen ikke gjør

- Ingen stemme i masteren. Jonas' egen stemme kan legges på som egen utgave senere, som avgjort 30.10.2026.
- Ingen engelsk utgave og ingen 16:9 nå. Begge kan klippes av de samme opptakene etterpå.
- Ingen betalt annonsering. Den hører til den offentlige lanseringen.
- Legger ingenting til i køen, i porten eller over lanseringslinja. Traileren er ikke et steg i køen.
- Ingen videoopptak av skjermen: klippene lages bilde for bilde av filmoppsettet, som sist.
- Viser ingenting som ikke er hos spillerne på detstorebla.no den dagen filmen legges ut.

## 10. Status

13.11.2026: planen skrevet. Venter på V1–V4 og på svar om GPU-maskinen.
