# Bølgene: kortkammet sjø uten mønstre, og lik for alle (plan 09.11.2026)

## 1. Bestillingen

Jonas 09.11.2026, etter videoen fra Brensholmen og bildene av skummet:

- «Også må vi passe på at vi ikke får noen slike geometriske mønstre, det ser helt jævlig ut.»
- «Jeg vil simulere havet så nøyaktig som mulig, men at det ikke ser ut som at havet er helt crazy fordi det beveger seg i 6x.»
- «Havet er også felles for alle brukerne … Er det en spesifikk bølge en plass så skal den være der for alle og oppleves ekte i hvordan den oppfører seg, ser ut og hvordan den påvirker båten.»
- «Gjør det som vil gi det mest realistiske opplevelsen for brukerne.» Svaret på om planen for bølgemønsteret skulle skrives: «Ja».

Mønsteret i skummet ovenfra er rettet (5.20h i `docs/systemer/vaer-og-hav.md`). Selve bølgene står fortsatt i jevne, parallelle rygger fra lav vinkel (`docs/pr/skum-091126/lav_vinkel.png`, både før og etter). Ekte vindsjø er kortkammet: en kam er to–tre bølgelengder lang før den brytes opp av andre, og ingen kam er rett over hele sjøen.

## 2. Slik er det i dag

- **Bølgefeltet** (`view3d/14-sea.js` `updateWaves`, `WL`, `WOFF`, `WPH`; skyggerne `SEA_WAVE` og `seaVS` i `view3d/01-shaders.js`): 13 Gerstner-bølger over hele sjøen, 10 vindbølger på 96–6,4 m og 3 dønninger. Hver er én plan bølge med én retning (JONSWAP-spekteret og Hasselmann-spredningen fra F3 gir høyden og retningen, men hver komponent har bare én retning og én fase). Seks komponenter i den korte sjøen (27,5–6,4 m) gir rette kammer som går tvers over hele synsfeltet: det er ryggene på bildet.
- **Det samme på CPU** (`seaDisp`/`seaH`, `FOAM.capAt`): båten, bøyene og de andre båtene ligger i nøyaktig de bølgene som tegnes.
- **Begrensningene:** løkkene er skrevet ut med faste indekser, fordi Adreno 642L (Jonas' telefon) og Direct3D 11 ikke lenket sjøskyggeren ellers (05.10.2026). Hjørneskyggeren leser teksturer bare der enheten har det (`SST_VS` i `view3d/18-setup.js`, `#novtf`); telefonen har det ikke. Fysikk 4 F6 (FFT-sjø som prøve) står som valgfri og er ikke bygd (`docs/planer/fysikk-4-sjo-og-skrog.md`).
- **Sjøen er ikke lik for alle:** bølgeklokka er sekundene siden 3D-visningen startet (`T0` i `view3d/00-head.js`, `t` i `24-cinema.js` `frame`). Retningen, lengden og fasen følger tilstanden der din båt er (`updateWaves` holder fasen fast der hun er når en bølge dreier), og nærfeltet (`nfStep`) forskyver fasene etter din egen vei.
- **Nullpunktet for bildetakten:** 71 bilder/s, 14,1 ms, Høy, på OnePlus Pad 3 (Fysikk 4 kap. 10). I videoen 09.11.2026: 43–58 bilder/s.

## 3. Fasene

Hver fase er én økt og står for seg selv; sjøen er brukbar etter hver av dem.

### B1. Den korte sjøen fra en FFT-flis, først bare i lyset

- **Hva:** en worker regner den korte vindsjøen (rundt 40 m og ned til 0,5 m) som et ekte bølgefelt med FFT, slik filmer og havsimulatorer gjør det (Tessendorf 2001): JONSWAP med Hasselmann-spredningen fra F3, tilfeldige faser fra et fast frø, og hver bølge går med sin egen fart. Det gir kortkammet sjø uten rette rygger, fordi tusenvis av bølger i alle retninger legges sammen i stedet for seks. To fliser med ulik størrelse (forslag 128 × 128 over 157 m og 64 × 64 over 23 m, med et forhold som ikke går opp, så de aldri gjentar seg sammen) lastes opp som teksturer hvert bilde eller annethvert. I B1 brukes de bare til normalene i sjøskyggeren (lyset, glansen og glitringen), og Gerstner-bølgene 4–9 tones ned der flisa tar over. Bak `#fft0` i adressen for sammenligning.
- **Filer:** ny `view3d/14b-fft.js` (workeren som tekst, som `core/01c-vec.js` og `core/01d-coast.js` gjør), `01-shaders.js` (`SEA_FS`), `14-sea.js` (opplastingen).
- **Tester:** en enhetstest av FFT-en mot en direkte sum (`tests/unit/`), `sea3d`, `dbg23o`, og bilder fra lav vinkel, ovenfra på 90 m og 450 m og fra broa, før og etter, i Brensholmen-været (10 m/s fra NØ) og i kuling.
- **Måles:** workerens tid per bilde, opplastingen, bildetakten med `#fps` på nettbrettet (Jonas), og at flisene ikke synes som gjentakelser fra 450 m.

### B2. Den korte sjøen i formen og i båten

- **Hva:** hjørneskyggeren løfter og forskyver sjøen med flisa der enheten kan lese teksturer der (nettbrettet). `seaH` og `seaDisp` leser de samme tallene fra workeren, så båten, bøyene og de andre båtene ligger i bølgene som tegnes. Nærfeltet blir en forskyvning av oppslaget i flisa, som i dag for Gerstner-fasene. Gerstner 4–9 tas ut der flisa er på; der enheten ikke kan lese teksturer i hjørneskyggeren (telefonen), beholdes Gerstner-formen og flisa gir bare lyset (B1).
- **Filer:** `01-shaders.js` (`seaVS`), `14-sea.js` (`seaH`, `seaDisp`, `nfStep`), `16-motion.js` bare om skrogsnittene trenger det.
- **Tester:** `sea3d`, `hull3d` (stamp og rull i samme sjø før og etter), `seatrytest`, `wakeshot`.
- **Måles:** rull og stamp for sjarken og trebåten i 8, 12 og 17 m/s mot F3-tallene; bildetakten.

### B3. Skumtoppene fra flisa

- **Hva:** brytningen regnes av flisas egen Jacobi-determinant (sammenpressingen, som F3 regner av Gerstner-summen i dag), så skumtoppene kommer der det kortkammete feltet faktisk brekker. Da blir portfeltet `capGate` fra 09.11.2026 unødvendig og tas ut. Kalibreres mot Monahan som før (`sea3d`).
- **Filer:** `14b-fft.js` (J i workeren), `01-shaders.js` (`SEA_FS`, `FOAM_FS`), `14-sea.js` (`FOAM.capAt`).
- **Tester:** `sea3d` (andelen mot Monahan, tegnet og regnet), bildene fra B1 på nytt.

### B4. Den samme sjøen for alle

- **Hva:** bølgene regnes av den felles klokka i ekte sekunder (`worldNow`, ikke `T0`), og fasene av en fast regel for stedet (frø, ikke båtens historie), så to spillere på samme sted ser og ligger i de samme bølgene. Flisa er deterministisk av natur (fast frø, felles klokke). For Gerstner-bølgene som blir igjen (de lange og dønningen) må fasen ikke lenger holdes der båten er når en bølge dreier (`updateWaves`); den glir i stedet sakte mot den felles. Nærfeltets forskyvning glir tilbake til null når båten ligger stille eller går sakte, høyst en halv bølgelengde over et par minutter, så sjøen er den felles igjen når to båter ligger ved siden av hverandre. Ute i fart er sjøen rundt deg forskjøvet, slik det må være (se kap. 5).
- **Filer:** `14-sea.js` (`updateWaves`, `nfStep`, klokka inn i workeren), `24-cinema.js` (bølgeklokka ved siden av `t`).
- **Tester:** en ny test med to sider på samme sted og samme klokke som sammenligner `seaH` på fem punkter (skal være like), `sea3d`.
- **Måles:** hvor fort fasen glir tilbake (skal ikke kunne ses), og at klokka ikke gir hopp når den hentes fra serveren.

### B5. Nettbrettet og telefonen

- **Hva:** Jonas måler på nettbrettet med `#fps` i samme vær som nullpunktet og i kuling, og ser på sjøen fra broa, dekket og ovenfra; telefonen (Adreno 642L) prøves for at den fortsatt lenker sjøen. Så avgjøres det om FFT-sjøen er standard på Høy og Ultra, og hva Middels og Lav får.
- **Filer:** `18-setup.js` (kvalitetsnivåene), dokumentene.

## 4. Valgene

1. **Hvordan den korte sjøen lages.**
   - A: FFT-fliser i en worker (B1–B3).
   - B: flere Gerstner-bølger (20–30 i stedet for 6) med retninger som varierer litt over sjøen.
   - C: ferdige bølgeteksturer som glir i hver sin retning, som i mange spill.

   **Anbefalt A.** Det er den eneste som gir ekte kortkammet sjø, der hver bølge går i sin egen fart. B koster to–tre ganger så mye i skyggeren og får fortsatt rette kammer, bare flere av dem. C ser bra ut på avstand, men bølgene går ikke som bølger, og båten ligger ikke i dem.
2. **Hvor FFT-en regnes.**
   - A: på CPU i en worker.
   - B: på skjermkortet med flere pass per bilde.

   **Anbefalt A.** Båten må ligge i de samme bølgene som tegnes, og da trenger CPU-en tallene uansett. Det virker på alle enheter, også telefonen som ikke lenker flere pass. B er raskere for store fliser, men må lese tilbake fra skjermkortet til fysikken, og det koster mest på en mobil.
3. **Hvor felles sjøen skal være (B4).**
   - A: de samme bølgene på samme sted og tid for alle, og sjøen rundt en båt i fart glir tilbake til den felles når hun går sakte eller ligger stille.
   - B: bare den samme sjøtilstanden for alle (vind, høyde, retning), som i dag.

   **Anbefalt A.** Det er det Jonas ba om, og flisa med fast frø og felles klokke gir det nesten gratis.

**Valgt 09.11.2026 (Jonas):** «V1: A, V2: A, V3: A, men det kan ikke være et markant tydelig skille som oppleves når man går fra "privat" sjø til felles.»

**Overgangen fra privat til felles sjø (krav fra V3), slik B4 bygger den:**
- **Ingen bryter og ingen terskel.** Hvor fort forskyvningen glir tilbake, er en jevn funksjon av farten: null i full fart, full ved stillstand, og glatt imellom. Det finnes altså ikke noe øyeblikk der sjøen «bytter».
- **Glidningen er langsommere enn noe en ser som bevegelse:** høyst rundt 0,3 m/s, som en svak strøm, og aldri mer enn en tidel av bølgenes egen fart. Ved siden av bølgene, kjølvannet og båtens egen drift i vinden kan den ikke skilles fra ekte strøm.
- **Hver bølge og hver flis glir bare den korteste veien,** høyst en halv bølgelengde eller en halv flis: for den korte flisa noen meter, for de lange bølgene og den store flisa opptil et par minutter.
- **Skummet og kjølvannet glir ikke,** fordi de alt ligger i verden.
- **Prøves med en test** som kjører båten i fart, stopper og måler hvor fort sjøen rundt henne flytter seg mens hun glir tilbake, og som ser at den ender på den felles sjøen (`seaH` lik en annen side på samme sted). Jonas ser overgangen på nettbrettet.

## 5. Antatt og usikkert

- **Gjentakelsen:** en FFT-flis gjentar seg. Med to fliser i et forhold som ikke går opp, og de lange Gerstner-bølgene og dønningen oppå, skal det ikke kunne ses fra 450 m. Dette er antatt og må ses i bildene i B1, før noe annet bygges. Ser det ut som et mønster, stopper fasen der.
- **Kostnaden:** to fliser på 128² og 64² med høyde, forskyvning og helning er rundt 10 FFT-er per bilde, anslått 2–4 ms i en worker på nettbrettet (JavaScript, ikke målt). Opplastingen er under 0,5 MB per bilde. Kan regnes annethvert bilde med blanding om det trengs.
- **Telefonen** (Adreno 642L) kan ikke lese teksturer i hjørneskyggeren. Der får den korte sjøen lyset fra flisa, men formen fra Gerstner, så båten ligger i litt andre bølger enn de som lyser. I liten sjø synes det ikke; i stor sjø er det de lange bølgene som bærer båten.
- **«Lik for alle» gjelder ikke helt for en båt i fart.** Nærfeltet (båten møter bølgene i sin ekte fart) betyr at sjøen rundt henne er forskjøvet mens hun går. Det er regnestykket fra samtalen 09.11.2026. Når hun går sakte eller ligger stille, glir hun tilbake til den felles sjøen.
- **Skumtoppene** må kalibreres på nytt mot Monahan i B3. Portfeltet fra 09.11.2026 virker til da.
- **SwiftShader** tegner ett bilde på sekunder, så bevegelsen, glitringen og bildetakten må ses på nettbrettet.

## 6. Det planen ikke gjør

- **Kystnær sjø** (brenning, refraksjon og grunt vann, Fysikk 4 F4) endres ikke. Flisa tones bort der brenningen tar over.
- **Strøm på bølgene** (Fysikk 4 F8) endres ikke.
- **De lange bølgene og dønningen** forblir Gerstner, fordi de er få, lange og bærer båten.
- **Kjølvannet og hekkbølgen** endres ikke. De ligger fast i verden fra 09.11.2026.
- **Klokka i spillet** (6×) og båtens fart over kartet endres ikke.

## Status

- 09.11.2026: planen skrevet. Valgene tatt samme dag (V1 A, V2 A, V3 A med kravet om ingen synlig overgang); venter på «kjør på» for B1.
