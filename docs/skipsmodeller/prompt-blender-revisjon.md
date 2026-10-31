Revider båtmodellen: [BÅTENS NAVN]

Dette er en eksisterende Blender-modell i spillet som ikke ble bygd etter noen plan. Løft den til samme nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene trebat og skiff (F5 i docs/planer/grafikk-batmodeller.md). Finn selv ut hvilken type i VESSELS og hvilket skript i tools/boats/ navnet gjelder.

GRENEN: main er tom; spillet ligger på arbeidsgrenene. Bygg på den nyeste grenen med spillet (nå ccr-bbe9c816-r2609u, som har trebåten, skiffen og lærdommene) og commit underveis.

LES FØRST, I SIN HELHET, før du endrer noe: docs/INDEKS.md, docs/skipsmodeller/sulebas-bygging.md (arbeidsmåten; reglene i kap. 7 og lærdommene i kap. 11 og 12 gjelder), /blender-skillen, docs/skipsmodeller/planliste-fiskefartoy.md (også kap. 29 og 30), docs/skipsmodeller/sulebas-pilot-grunnlag.md (malen for grunnlaget), trebat-grunnlag.md og skiff-grunnlag.md (eksempler på reviderte båter), docs/skipsmodeller/kartlegging-spillet.md og docs/batplan.md (det som er kjent om båten), skriptet, ringnot38.py, fittings.py og bpyutil.py, og det spillet bruker fra modellen (VESSELS, SPEC3D, ankrene og koden som tegner båten). Si fra hvis du ikke har lest noe av dette.

KILDENE: Jeg legger ved de bildene jeg har. Finn selv ut hva hvert bilde viser og hva det kan brukes til (rett fra siden = mål, skrått = form). Har jeg ikke lagt ved bilder, bruk det som finnes i repoet og dokumentene (kildene i skriptets kommentarer, tegningsmål, kartlegging-spillet.md), og si hvilke bilder som ville gjort resultatet bedre. Spør meg bare om det som ikke kan avgjøres uten meg.

SLIK SKAL DU JOBBE:
1. Gjennomgang før du endrer noe:
   - Sjekk at spillet faktisk viser Blender-modellen for typen, og ikke en gammel reserve. Ta skjermbilder fra spillet i begge formater før eksporten.
   - Render dagens modell fra kameraene K1–K7 i planlisten og lag overlegget mot sidebildet hvis det finnes et.
   - Gå gjennom kravlista, B1–B22, planliste-ID-ene og M-punktene, og like kritisk det skriptet har fra før.
   - Skriv avvikslista i docs/skipsmodeller/<båt>-grunnlag.md og send meg bildene og lista.
   - Kjør deretter på uten å vente.
2. Velg selv om skriptet bygges om eller skrives på nytt etter ringnot38.py. Skroget skal bli én glatt flate målt i fast skala, og åpninger skal bli ekte hull. Aldri to flater i samme plan.
3. Alt skal være festet slik det er på en ekte båt (vindskjermer, rekker, braketter, beslag), og alt skal vende riktig vei mot den som bruker det (skjermer, instrumenter).
4. Utstyr som kan brukes på flere båter, også det spillet beveger (ratt, motorer), lages som felles modeller i fittings.py. Bruk det som finnes der fra før.
5. Plassene for utstyr og folk skal gi en arbeidsflyt som går an om bord: fiskeren ved ripa og haleren, blødekar, sløyebord med plass å stå, fangstkar, styreplass. Se på det i spillet, ikke bare i ankrene.
6. Behold det spillet er avhengig av: typenavnet, malingssonene og alle ankrene. Ankrene kan flyttes, men skal finnes. Endre VESSELS bare når kildene sier noe annet, og si fra om det. Finner du feil i spillets kode som hindrer at modellen vises eller brukes riktig, rett dem, og si fra.
7. Kjør kritikksløyfen etter hver endring: fotovinkler, overlegg, klasjsjekk (0, også skrogets egne dekk), punkttelling, check() mot VESSELS og lanternereglene, og eksport. Før rundene inn i grunnlaget. Send meg før- og etterbilder underveis.
8. Vær petimeter, og ikke stopp før båten er så lik kildene som mulig. Si ærlig hva som ikke kan måles.
9. Budsjett: rundt 300 000 trekanter nær, 40 000 middels og for NPC-båter (trekk fra delene spillet tegner oppå middelsmodellen). Si fra om GLB-størrelsen. Ingen ekte navn eller logo (heller ikke i GLB-dataene), bare utsiden, ikke noe kjøpbart redskap modellert inn, og lanternene på lovlige plasser.

FERDIG BETYR:
- Eksportert og i spillet: utstyr, folk på dekk, utsyn fra broa (konsoll eller instrumenter synlige), navn og lanterner virker, og arbeidsflyten om bord går an.
- Testene som dekker båten er grønne: vessel3d, brotest og lanterntest for typen, vesseltest, regmarktest, maletest og utstyrstestene som gjelder. Røde tester sammenlignes med utgangspunktet.
- Skjermbilder fra spillet i begge formater, før og etter, og nattbildet (K6).
- Grunnlaget, kartlegging-spillet.md, batplan.md, systemdokumentet, backloggen, INDEKS og patchnotes oppdatert, og et kort byggedokument docs/skipsmodeller/<båt>-bygging.md.
- Det økta lærte ført inn i sulebas-bygging.md og /blender, og denne fila (docs/skipsmodeller/prompt-blender-revisjon.md) oppdatert med grenen og det neste økt bør vite.
- Du får lov å pushe og rulle ut til detstorebla.no (ccr-5e1ba2f4-pusvyd) når testene er grønne. Sjekk at utrullingen ble grønn.

Kjør på.
