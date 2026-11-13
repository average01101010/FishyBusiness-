# Lanseringstraileren (plan 13.11.2026, valgene tatt, venter på «klar» fra Jonas)

Planen for den første traileren som legges ut. Den bygger på arbeidet i `trailer/` (strategien, filmoppsettet, opptakslista v2 og grovklippene m1 og m2 fra 10.11.2026) og bytter premisset. Valgene er tatt 13.11.2026 (del 8). Filmingen venter til Jonas sier at spillet er klart; han har økter gående som løfter kvaliteten, og GPU-maskinen er fortsatt tilgjengelig.

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

**Én setning først, så tre påstander som hver bevises med bilder, så én oppfordring.** Filmen er filmatisk hele veien (Jonas 13.11.2026: «cinematiske klipp er jævlig stilig»); grensesnittet kommer inn to–tre ganger, oppå filmbildet.

Jonas 13.11.2026: «husk bare at spillet gjelder ikke baaare norge lengre, fordi man kan jo i praksis seile til svalbard, grønland, færøyene, og flere steder.» Kroken og størrelsen sier derfor kysten **og havet utenfor**.

| Tid (s) | Del | Bilde | Tekst (engelsk utgave) | Tekst (norsk utgave) |
|---|---|---|---|---|
| 0–2,5 | Kroken | Det sterkeste bildet vi har i lavt lys | A fishing game with the whole Norwegian coast and the sea beyond | Et fiskespill med hele norskekysten og havet utenfor |
| 2,5–7,4 | Hva | Naustet, trebåten i grålysning | You start with your father's old wooden boat | Du begynner med fars gamle trebåt |
| 7,4–12,4 | Hva | Trebåten på feltet. **Grensesnittet tones inn over samme bilde**, redskapet dras, fisk om bord | You do the fishing | Du fisker selv |
| 12,4–17,4 | Hva | Mottaket, lossing, sluttseddelen | Land it. Sell it. Buy bigger. | Lever. Tjen. Kjøp større. |
| 17,4–22,4 | Hvor stort | Kartet zoomer ut fra båten: kysten, så Svalbard, Færøyene og Grønland | From Hvaler to Kirkenes. And beyond. | Fra Hvaler til Kirkenes. Og videre. |
| 22,4–27,4 | Mulighetene | **Båtstigen som match cut:** samme vinkel, en større båt på hvert slag | – | – |
| 27,4–32,4 | Mulighetene | Droppet: snøkrabbefartøyet ved Svalbard i lav sol, ett langt tak | stedsstempel | stedsstempel |
| 32,4–41,1 | Verden | På slag: Lofoten i vintersol, hvalen i midnattssol, kuling ved Vardø, nordlys, kystnotbåten under Gisundbrua, garn, line og teiner innimellom | stedsstempler; Nets. Longlines. Pots. | stedsstempler; Garn. Line. Teiner. |
| 41,1–44,9 | Mulighetene | Mannskapet på dekk, dine båter, andre spilleres båter | Your crew. Your fleet. One shared ocean. | Eget mannskap. Eget rederi. Ett felles hav. |
| 44,9–50 | Oppfordringen | Logo på slaget, så adressen | Play free in your browser. detstorebla.no | Spill gratis i nettleseren. detstorebla.no |

Teksten er et utkast. Hver påstand sjekkes mot spillet i T1 før den låses (del 7).

**Kystnotbåten** kan ikke kjøpes (del 3), så hun er med som en båt i verden, i sitt beste klipp (under Gisundbrua), uten tekst som sier at hun kan bli din. **Snøkrabbefartøyet** kan kjøpes og får droppet. Skal kystnotbåten vises som spillerens egen, må hun låses opp først; det er Jonas' valg.

## 4b. Stilen

Dommen over m2 (kontaktarket `trailer/control-m1/grovklipp-m2-kontaktark.jpg`): klippene i lavt lys holder (naustet i grålysning, hvalen i motlys, nordlyset, sluttkortet over solstripa, bruklippene). Klippene midt på dagen holder ikke: flat blå himmel, høyt kamera over byene så husene blir fargede klosser og båten en prikk, og snøkrabbefartøyet ved Svalbard i flatt lys og halvveis ute av bildet. Land utenfor Norge og Svalbard er tomme bakker eller en hvit stripe (`docs/BACKLOG.md`). Stedsnavnene er for små og forsvinner mot lys himmel.

1. **Lyset velger klippet.** Bare lav sol, blå time, natt eller vær. Ingen klipp midt på dagen under flat blå himmel. Spillet regner sola der båten er, så det er et valg av dato og klokkeslett i klippfila.
2. **Lavt, nært og lang linse.** Kameraet står i høyde med rekka eller lavere, 18–30° brennvidde, båten fyller bildet og fjellene trekkes inn bak. Som filmet fra en annen båt eller fra land. Ingen høye dronebilder over byer. Én rolig bevegelse per klipp; klippene gir farten.
3. **Stående bilde bygges i høyden:** himmel, fjell, båt, speiling. Båten forfra eller bakfra, bru og mast over. Motiv og tekst utenfor TikToks soner (øverste 10 %, nederste 22 %, høyre kant; tallene er et anslag og sjekkes mot appen i T1).
4. **Blått og én varm ting.** Dyp blågrønn sjø, og én varm aksent i hvert bilde: sola, lys i vinduer, oransje oljehyre. Samme gradering over alle klipp (S-kurven, vignetten og kornet i `assemble.py`). Ingen effekter lagt på etterpå: ingen linseglans, risting eller AI-bilder.
5. **Teksten i to nivåer,** begge i Source Serif 4 Display Semibold (spillets egen). *Påstanden:* vanlig skrift, rundt 96 px i 1080 bredde, høyst tre linjer. *Stedsstempelet:* sperrede versaler, en strek og koordinatene under, som en linje i loggboka. Et mykt mørkt felt bak, så teksten leses på lys himmel og i solstripa. Minst to slag på skjermen. Skisse: `trailer/stil/stilark-1.jpg`.
6. **Grensesnittet tones inn over filmbildet,** det klippes ikke til. Samme 3D-bilde, og så kommer instrumentene på: det sier «dette er et spill, og slik ser det ut når du spiller» uten et ord. Kartet filmes i mørkt tema, så det går i ett med graderingen.
7. **Rytmen følger låta:** lange tak i den rolige delen, båtstigen som match cut i oppbyggingen, ett langt tak på droppet, korte klipp på slag etterpå.
8. **Havet utenfor Norge** vises i 3D der landet holder (Svalbard) og i kartet ellers, til terrenget på Færøyene, Shetland og Grønland er løftet.
9. **Sluttkortet** er logoen fra `tools/brand/logo.py` over et levende bilde, som i m2, men med adressen stor nok til å leses på en telefon.
10. **«All footage captured in-game»** i liten skrift i åpningen. Det er sant, og det er det folk spør om.

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

## 8. Valgene (Jonas 13.11.2026)

- **V1 A:** to–tre korte spilløyeblikk med grensesnitt, resten rent. Bare det som holder i prøvebildene i T1.
- **V2 A:** droppet går til en båt spilleren kan eie. Jonas: «gjerne ringnotbåten og krabbebåten da disse er jobbet mye med og har veldig gode modeller.» Snøkrabbefartøyet får droppet; kystnotbåten er med som båt i verden, fordi hun er låst (del 4).
- **V3 A:** «Fjord at Dawn», 50 s.
- **V4:** «i løpet av de nærmeste dagene», ingen fast dag. Filmingen venter på Jonas' «klar».
- **Språk:** Jonas har én TikTok-konto for Norge og én for utlandet, og traileren kan være på engelsk; Norge er fortsatt målgruppen. Teksten på skjermen er det eneste språket i filmen, så den lages i to utgaver av de samme klippene: engelsk til den internasjonale kontoen og norsk til den norske. Stedsnavnene og «Det Store Blå» er like i begge. Vil Jonas bare ha én, blir det den engelske.

## 9. Hva planen ikke gjør

- Ingen stemme i masteren. Jonas' egen stemme kan legges på som egen utgave senere, som avgjort 30.10.2026.
- Ingen 16:9 nå. Den kan klippes av de samme opptakene etterpå.
- Ingen betalt annonsering. Den hører til den offentlige lanseringen.
- Legger ingenting til i køen, i porten eller over lanseringslinja. Traileren er ikke et steg i køen.
- Ingen videoopptak av skjermen: klippene lages bilde for bilde av filmoppsettet, som sist.
- Viser ingenting som ikke er hos spillerne på detstorebla.no den dagen filmen legges ut.

## 10. Status

13.11.2026: planen skrevet, valgene tatt, stilen lagt til (del 4b) med stilarket `trailer/stil/stilark-1.jpg`. Neste er T1 (faktasjekk og prøvebilder), som kan gjøres uten GPU. T3 venter på Jonas' «klar».
