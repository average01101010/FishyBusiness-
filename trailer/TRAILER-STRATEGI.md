# Trailer for Det store blå – strategi og tilpasning av Laksebaronen-metoden

*Utkast 30. oktober 2026. Bygger på «Slik lager vi trailerne til Laksebaronen» (30. okt 2026) og to skjermbilder fra spillet: båthandelen med trebåten fra 1956, og kystnotbåten under Gisundbrua ved Finnsnes.*

## 1. Hva vi kan ta rett over, og hva vi må endre

Laksebaronen-dokumentet beskriver to ting: en **produksjonsmetode** (hvordan filmen lages) og et **kreativt valg** (hva filmen handler om). Metoden kan vi ta nesten rett over. Det kreative må lages på nytt, fordi spillene selger forskjellige følelser.

| Område | Laksebaronen | Det store blå | Vurdering |
|---|---|---|---|
| Alt er ekte spillgrafikk | Ja | Ja | Ta over uendret. Hele poenget med spillet er at det er ekte, så traileren må også være det. |
| Privat filmversjon («harness») bak byggeflagg, fast klokke, Playwright | Ja | Ja, enklere: spillet er ren WebGL med eget byggeskript og Playwright-tester, og eksponerer kamera, tid, frø og dyr alt | Ta over uten byggeflagg: filmoppsettet styrer spillet utenfra. Se `PLAN.md` del 4. |
| Musikken bestemmer rytmen | Ja | Delvis | Se punkt 4. Vi har et sterkere lydkort enn musikk: semidieselen. |
| Stemme på engelsk (ElevenLabs «Magnus») | Ja | Nei | Målgruppen er norsk. Se punkt 5. |
| Stående 9:16 først | Ja | Ja, men ikke bare | Den eldre kystpublikummet er på Facebook og YouTube, se punkt 7. |
| Følelsen som selges | Naturspektakel: ørn, hval, nordlys, fyr | Livsløpet til en fisker: fra sjark til snurper | Dette er den store forskjellen. |
| Rene bilder uten meny i masteren | Ja | Ja, med ett unntak | Detaljene i brukergrensesnittet er et salgsargument for oss, se punkt 3. |

## 2. Hva Det store blå faktisk selger

Skjermbildene forteller mye:

- **Trebåt 23 fot, 8 hk semidiesel, 1956, 45 000 kr.** «Treverket er grått og slitt, men skroget er tett. Hun går i 7 knop og bruker nesten ikke diesel.» Dette er ikke spilltekst, det er en kjøpsannonse fra Finn. Tonen er tørr, kjærlig og ekte.
- **«Åpen gruppe under 8 m», «Fjordlinja: kan fiske innenfor», dekkslast i kasser og kar, is 150 kg.** Dette er ekte norsk fiskeriregulering. Ingen andre spill har dette.
- **Kystnotbåt 38,55 m, ringnot og snurrevad** under Gisundbrua kl. 04:02 med lav sol: midnattssol over Finnsnes, med 927 196 kr i kassa.
- **To profiler, Idamor og Kystværing**, og «Neste mål: Havfiske, kommer når kartet utvides vestover». Spillet har en tydelig progresjon og et veikart.

Så det spillet selger er tre ting, i denne rekkefølgen:

1. **Nostalgi og tilhørighet.** «Farfar hadde en sånn båt.» «Det er Finnsnes!» Dette treffer alle som har vokst opp langs kysten, og det er en følelse Laksebaronen ikke har tilgang til på samme måte.
2. **Reisen fra liten til stor.** Fra en sliten sjark til 45 000 kr til en snurper til mange millioner. Klassisk oppbygningshistorie, og den eneste historien traileren trenger.
3. **Dybde for simulatorfolket.** Regulering, lastekapasitet, is, drivstoff. Dette er segmentet som spiller *Fishing: North Atlantic* og *Fishing: Barents Sea*, og som vil se at systemene er ekte.

Laksebaronen bygger traileren på naturens spektakel. Vi bør bygge den på **mennesket og båten**. Naturen (midnattssol, mørketid, nordlys, Senja-fjellene) er bakgrunn og belønning, ikke hovedperson.

## 3. Psykologien bak de valgene vi bør ta

- **Gjenkjennelse slår imponering.** I Norge deles ting som viser hjemplassen. Et bilde av Gisundbrua eller kaia på Finnsnes gir «det er her jeg bor»-kommentarer, og kommentarer er det algoritmene belønner mest. Bruk ekte, gjenkjennelige steder i hvert klipp, og navngi dem på skjermen.
- **Kontrast er historien.** Det sterkeste enkeltbildet vi kan lage, er trebåten fra 1956 fortøyd ved siden av 38-meteren i samme havn. Alt publikum trenger å forstå er avstanden mellom de to, og at spillet er veien mellom dem.
- **Kroken bør være lyd, ikke bilde.** Laksebaronen sier «kroken må sitte i første sekund». For oss er den sikreste kroken den tomgående semidieselen, «tøff-tøff-tøff» fra en ensylindret Sabb eller Wichmann. Den lyden stopper tommelen hos alle over 40 som har vært på en brygge. Det betyr at traileren bør starte uten musikk: sjø, måker og motoren alene i 1–2 sekunder, så kommer musikken inn på første slag.
- **Nysgjerrighet, ikke forklaring.** Vi skal ikke forklare reglene. Vi skal vise detaljer som får folk til å spørre «har de virkelig med *det*?». Ett bilde av fakta-kortet med «Fjordlinja: kan fiske innenfor» gjør mer enn tre setninger stemme.
- **Aspirasjon med måte.** Pengetallet (927 196 kr) og den store båten er aspirasjonen. Men hvis traileren bare viser den store båten, mister vi nostalgisegmentet, som er det største. Den lille båten skal ha minst like mye tid som den store.
- **Ærlighet om hva som finnes.** «Havfiske kommer når kartet utvides vestover» skal ikke vises som om det er der. Alt i traileren skal være spillbart den dagen den publiseres. Det er både markedsføringsloven og tilliten til et publikum som kjenner kysten bedre enn oss.
- **Lyd av er normalen.** Mesteparten av sosial video sees uten lyd. Traileren må fungere stum: tekst på skjermen bærer historien, lyden forsterker den. Derfor er stemme et tillegg, ikke en bærebjelke (se punkt 5).

## 4. Musikk: hva vi gjør annerledes

Laksebaronen lar låta bestemme alt og klipper hardt på slag. Vi beholder slag-klippingen og klippekartet (`music-edit-*.json`), men med tre endringer:

1. **Lydbildet før musikken.** De første 1–2 sekundene er reallyd fra spillet (motor, sjø, måker). Musikken kommer inn på første nedslag, samtidig med første harde klipp.
2. **Motoren som rytme.** En semidiesel på tomgang ligger på rundt 90–110 slag i minuttet. Hvis vi ber Suno om 96 BPM, kan motorlyden og musikken ligge i samme puls. Det er en detalj få vil legge merke til bevisst, men alle vil kjenne.
3. **Stil.** Ikke episk Hollywood. Tre retninger å prøve i Suno, 2–3 versjoner av hver:
   - **Nordisk, nedpå:** fele eller trekkspill som motiv, varm bass, bygger til et stort men varmt høydepunkt. Nostalgisegmentet.
   - **Moderne kyst:** elektronisk puls, luftig, med ett akustisk instrument oppå. Yngre publikum og 9:16.
   - **Arbeidsrytme:** perkusjon fra dekk, vinsj og motor som del av låta. Mest særpreget, mest risiko.

   Felles krav fra Laksebaronen beholdes: tydelig oppbygning, tydelig drop, kraftig sluttslag for logoen.

## 5. Stemme: tre alternativer

Laksebaronen bruker engelsk ElevenLabs-stemme. Det er feil for oss, fordi hele spillet lever på norsk språk og kystkultur.

| Alternativ | Fordel | Ulempe | Anbefaling |
|---|---|---|---|
| **A. Ingen stemme, bare tekst på skjermen** | Fungerer stumt, enkelt å oversette, ingen dialektproblem | Mindre nærhet | Dette er masteren. |
| **B. Ekte nordnorsk stemme, et menneske** | Autentisk, gir gåsehud, passer «alt er ekte» | Må finnes og tas opp, tar tid | Lag én versjon med dette. En far, bestefar eller fisker som leser tre korte linjer. Dette kan bli det som skiller traileren fra alt annet. |
| **C. ElevenLabs på norsk** | Rask, repeterbar | Bokmål uten dialekt høres «fra Oslo» ut, og publikum hører det umiddelbart | Bare til grovklipp for å sjekke timing. Ikke i ferdig film. |

Hvis vi velger B, holder vi manuset på 3–4 linjer, maks 0,9 ord i sekundet som i Laksebaronen, og lar hver linje falle på et klipp. Forslag til tone: lavmælt, ingen salgsstemme. Eksempel på manuslinjer (ikke endelig):

> Ho er fra femtiseks. Grå i treverket, men tett.
> Sju knop. Bruker nesten ikke diesel.
> Alle som har noe på havet i dag, begynte med en sånn.
> *(stille over hovedbildet)*
> Det store blå. Spill på detstorebla.no.

Den tredje linjen er budskapet: den lille båten er ikke en begrensning, den er starten på alle historier.

## 6. Struktur for hovedtraileren (60–70 s, 9:16 og 16:9)

| Tid | Hva | Lyd | Tekst på skjermen |
|---|---|---|---|
| 0–2 s | Nærbilde av det grå treverket, så motorkassa. Dønning. | Bare semidiesel, sjø, måker | – |
| 2–10 s | Sjarken går ut fra Finnsnes i grålysning. Gisundbrua over. | Musikk inn på slag ved 2 s | «Finnsnes, Senja» |
| 10–22 s | Arbeidet: sette og dra bruk, fisk om bord, kasser og kar, levering på kaia, pengene tikker inn. Harde klipp på slag. | Oppbygning | «Åpen gruppe under 8 m» · «Fjordlinja» (som ekte spillbilder, ikke grafikk lagt oppå) |
| 22–32 s | Båthandelen. Fakta-kort. Første oppgradering. Verftet. Større båt. | Bygger mot drop | «Fra sjark …» |
| 32–45 s | Drop. 38-meteren legger ut under Gisundbrua kl. 04 i midnattssol. Lang, rolig kamerabevegelse. Dette er vår «fyret med nordlys». | Høydepunkt, ingen tekst, ingen stemme | – |
| 45–55 s | Trebåten fortøyd ved siden av snurperen i samme havn. Så rask montasje av steder og lys: mørketid, nordlys, storm, stille fjord. | Nedtrapping over to slag (lærdom fra Laksebaronen) | «… til snurper» |
| 55–60 s | Logo på siste store slag. Adresse ett slag senere. | Sluttslag, så motoren alene i ett sekund | «detstorebla.no» |

Fire regler fra Laksebaronen beholdes som de er: harde klipp på slag, bare et par myke overtoninger, én lang scene på musikkens høydepunkt, logo på siste slag og adresse ett slag etter.

To regler legges til:

- **Alt som vises skal være spillbart i dag.** Ingen «kommer»-funksjoner i bildet.
- **Komponer for begge formater samtidig.** Viktig innhold holdes innenfor et felt som overlever både 9:16 og 16:9, slik at vi filmer én gang og beskjærer to ganger. Nærbilder og høye motiver (mast, bru) favoriserer 9:16, horisont og havn favoriserer 16:9.

## 7. Plattformer og publikum

Laksebaronen sikter mot TikTok, Reels og Shorts. Vi bør også, men publikummet vårt er delt:

- **Kystfolk 40+:** Facebook-grupper (lokalgrupper for Finnsnes og Senja, «gamle sjarker»-grupper, fiskerigrupper), YouTube. Her er 16:9 og 60–70 s riktig, og der lever gjenkjennelse og nostalgi.
- **Spillere 18–35:** TikTok, Reels, Shorts, Reddit (r/norge, r/simulators). Her er 9:16 og 15–20 s riktig, med rask krok.
- **Simulatorfolket:** YouTube og Steam-lignende miljøer. De vil se dybde, så én av de korte filmene bør være en «detaljfilm» med fakta-kortet, lasten og reguleringen.

De 4–5 korte filmene på 15–20 s som Laksebaronen leverer, bør hos oss ha **hver sin krok**, slik at de også fungerer som en test:

1. Lydkroken: motoren og den gamle båten.
2. Stedskroken: Gisundbrua og Finnsnes, navngitt.
3. Aspirasjonskroken: 38-meteren i midnattssol.
4. Dybdekroken: fakta-kortet og reguleringen.
5. Kontrastkroken: liten og stor båt i samme havn.

Den kroken som gir best seertid de første tre sekundene, flyttes først i neste versjon av hovedtraileren. Det er den billigste markedsundersøkelsen vi kan gjøre.

## 8. Produksjonsmetoden, tilpasset

Arbeidsgangen fra Laksebaronen tas over i sin helhet: idé og opptaksliste, musikk og klippekart, stemme, filming i spillet, grovklipp i halv størrelse, notater med tidskode fra eier, nye runder, full størrelse til slutt. Det som er spesifikt for oss:

- **Harness.** Spillet er ren WebGL i vanlig JavaScript med `node build.mjs`, Playwright-tester med fast frø (`#seed=1`), settbar tid (`S.t`) og et kinokamera. Filmoppsettet styrer spillet utenfra med Playwright, og den eneste tilføyelsen i spillet er en kameraoverstyring i egen PR. Se `PLAN.md` del 4.
- **Egne automatiske kontroller** i tillegg til land-sjekken:
  - masten på den store båten må klare brua i hvert bilde når hun går under Gisundbrua;
  - fortøyde båter skal ligge i riktig høyde ved kai (ingenting henger i lufta);
  - hus, trær og bygder skal ikke hoppe i detaljnivå i bildet (sjekk hvert bilde mot forrige, som Laksebaronen);
  - sol og lys skal være kontinuerlig over et klipp, også ved 04:02 der sola står lavt.
- **Fiskescener er risikoen.** Laksebaronen filmer merder og dyr. Vi må filme mennesker som drar bruk og fisk som kommer om bord. Hvis spillet ikke har gode animasjoner for dette i dag, er det bedre å vise det indirekte (kasser som fylles, dekket som blir vått, fangsttallet) enn å vise svake animasjoner. Feil i spillet rettes i egne PR-er, aldri bare i filmen.
- **Mappestruktur** som i Laksebaronen, under `trailer/`: `script.md`, `shotlist.md`, `production.md`, `HARNESS.md`, `audio/`, `control-m*/`, `rough/`, `fonts/`, `tools/`.
- **Sluttkort.** Spillets logo og «detstorebla.no». Skrift må velges til logoen, ikke kopieres fra Laksebaronen.

## 9. Rettigheter vi må ha orden på

- **Kartdata.** Spillet krediterer Kartverket, Mapzen (CC BY) og OpenStreetMap (ODbL). Disse må krediteres i `CREDITS.md` og i videobeskrivelsen, og helst i sluttkortet med liten tekst.
- **Musikk og stemme.** Betalt Suno- og ElevenLabs-plan hvis de brukes. En ekte stemme trenger skriftlig samtykke til bruk i markedsføring.
- **Motorlyd.** Hvis semidiesel-lyden hentes utenfor spillet, må den ha lisens for kommersiell bruk. Best er at lyden finnes i spillet, så holder «alt er ekte»-løftet også for lyd.

## 10. Avklart 30.10.2026

Spillkoden ligger på arbeidsgrenen `ccr-5e1ba2f4-pusvyd` og er flettet inn her. Jonas svarte samme dag:

1. **Teknologi:** ren WebGL 1 i vanlig JavaScript, ett byggeskript uten npm, Playwright-tester i Python. Harness-metoden kan brukes, uten byggeflagg.
2. **Gratis:** ja. Sluttkortet sier «Spill gratis på detstorebla.no».
3. **Animasjoner:** vi viser båtene og naturen. Arbeidsanimasjonene sjekkes i en egen runde senere (`PLAN.md` F6).
4. **Semidiesel-lyden finnes,** laget i Web Audio etter Jonas' video av en Sabb G, med røyk i takt. Den må tas opp eller rendres (`PLAN.md` del 5).
5. **Hele kysten og alle årstider finnes,** med midnattssol, mørketid, nordlys, sesonghendelser og dyreliv.
6. **Sosialt bevis:** ikke avklart. Tas opp når tallene i admin er store nok til å vises.

## 11. Neste steg

Står i `PLAN.md`, del 8 (fasene) og del 9 (valgene Jonas må ta).
