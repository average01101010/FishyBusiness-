Bygg en ny båtmodell: [BÅTENS NAVN ELLER TYPE]

Bygg modellen på samme måte og til samme nivå som pilotbåten ringnot38 og de reviderte båtene trebat og skiff (F4–F5 i docs/planer/grafikk-batmodeller.md). Finn selv ut hva slags båt det er, hvilke mål og hvilket utstyr den har, og hvor den hører hjemme i spillet. Er plassen i stigen uklar, legg den inn som låst type (som ringnot38) og si fra.

GRENEN: main er tom; spillet ligger på arbeidsgrenene. Bygg på den nyeste grenen med spillet (nå ccr-bbe9c816-r2609u, som har trebåten, skiffen og lærdommene) og commit underveis.

LES FØRST, I SIN HELHET, før du bygger: docs/INDEKS.md, docs/skipsmodeller/sulebas-bygging.md (arbeidsmåten; reglene i kap. 7 og lærdommene i kap. 11 og 12 gjelder), /blender-skillen, docs/skipsmodeller/planliste-fiskefartoy.md (også kap. 29 og 30), docs/skipsmodeller/sulebas-pilot-grunnlag.md (malen for grunnlaget), trebat-grunnlag.md og skiff-grunnlag.md (eksempler), docs/systemer/3d-baater-og-animasjon.md, docs/systemer/baater.md, docs/batplan.md, ringnot38.py, fittings.py og bpyutil.py, og koden som tegner båtene i spillet (vessel3d.js, og 12-skiff.js for åpne båter med håndsett). Si fra hvis du ikke har lest noe av dette.

KILDENE: Jeg legger ved de bildene jeg har. Finn selv ut hva hvert bilde viser og hva det kan brukes til (rett fra siden = mål, skrått = form). Finn data selv der du kan: offentlige registre (Fiskeridirektoratet), byggerapporter og verftsdata. Skriv kildene i grunnlaget. Før du bygger, si hvilke bilder som mangler og ville gjort resultatet bedre. Kjør likevel på med det som finnes. Spør meg bare om det som ikke kan avgjøres uten meg.

SLIK SKAL DU JOBBE:
1. Lag byggegrunnlaget først: docs/skipsmodeller/<båt>-grunnlag.md etter malen i sulebas-pilot-grunnlag.md, med fakta, regler, avgjørelser, målene, kravlista per planliste-ID og lanternene.
2. Mål i fast skala på sidebildet. Bruk skråbilder bare til form og rekkefølge. Skriv kilden til hvert mål i kommentaren. Skriv en check() i skriptet som sjekker modellen mot dataene: lengde, bredde, dybde, volumet under vannlinja mot deplasementet, og lanternereglene.
3. Bygg skroget som én glatt flate. Lag alle åpninger som ekte hull med rom bak, og sidene usymmetriske der båten er det. Fargegrensene skal følge skrogets linjer. Aldri to flater i samme plan.
4. Alt skal være festet slik det er på en ekte båt (vindskjermer, rekker, braketter, beslag), og alt skal vende riktig vei mot den som bruker det (skjermer, instrumenter).
5. Utstyr som kan brukes på flere båter, også det spillet beveger (ratt, motorer), lages som felles modeller i fittings.py. Bruk det som finnes der fra før.
6. Plassene for utstyr og folk (ankrene) skal gi en arbeidsflyt som går an om bord: fiskeren ved ripa og haleren, blødekar, sløyebord med plass å stå, fangstkar, styreplass. Se på det i spillet, ikke bare i ankrene.
7. Kjør kritikksløyfen etter hver endring: kameravinklene K1–K7 i planlisten, overlegg, klasjsjekk (0, også skrogets egne dekk), punkttelling, check() og eksport. Før rundene inn i grunnlaget. Send meg bilder underveis.
8. Vær petimeter, og ikke stopp før båten er så lik kildene som mulig. Si ærlig hva som ikke kan måles.
9. Budsjett: rundt 300 000 trekanter nær, 40 000 middels og for NPC-båter (trekk fra delene spillet tegner oppå middelsmodellen). Si fra om GLB-størrelsen. Det som stikker ut over ripa, teller i bredden vessel3d måler (±5 %). Ingen ekte navn, kallesignal eller logo (heller ikke i GLB-dataene), bare utsiden, ikke noe kjøpbart redskap modellert inn, og lanternene på lovlige plasser etter FOR-1975-12-01-5.

FERDIG BETYR:
- Eksportert, inn i malen, COVER i tests/run.py og VESSELS, og admin-knappen i Båthandelen gir meg båten gratis, så jeg kan teste.
- Spillet viser Blender-modellen (ikke en reserve), og utsynet fra broa, folk på dekk, utstyret, navnet og lanternene virker.
- Testene er grønne: vessel3d, brotest og lanterntest for typen, vesseltest, regmarktest og maletest. Røde tester sammenlignes med utgangspunktet.
- Skjermbilder fra spillet i begge formater, og nattbildet (K6).
- Grunnlaget, systemdokumentet, kartlegging-spillet.md, batplan.md, backloggen, INDEKS og patchnotes oppdatert, og et byggedokument docs/skipsmodeller/<båt>-bygging.md.
- Det økta lærte ført inn i sulebas-bygging.md og /blender, og denne fila (docs/skipsmodeller/prompt-blender-ny-bat.md) oppdatert med grenen og det neste økt bør vite.
- Du får lov å pushe og rulle ut til detstorebla.no (ccr-5e1ba2f4-pusvyd) når testene er grønne. Sjekk at utrullingen ble grønn.

Kjør på.
