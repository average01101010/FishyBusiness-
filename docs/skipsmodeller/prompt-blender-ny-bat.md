Bygg en ny båtmodell: [BÅTENS NAVN ELLER TYPE]

Bygg modellen på samme måte og til samme nivå som pilotbåten ringnot38 og de reviderte båtene trebat, skiff, snekke og plastsjark (F4–F5 i docs/planer/grafikk-batmodeller.md). Finn selv ut hva slags båt det er, hvilke mål og hvilket utstyr den har, og hvor den hører hjemme i spillet. Er plassen i stigen uklar, legg den inn som låst type (som ringnot38) og si fra.

GRENEN: main er tom; spillet ligger på arbeidsgrenene. Bygg på den nyeste grenen med spillet (nå ccr-bdecba4a-xbp5d0, som har trebåten, skiffen, plastsnekka, plastsjarken, verktøyene i tools/boats/qa og lærdommene; den er også rullet ut til ccr-5e1ba2f4-pusvyd) og commit underveis.

LESING ER ET ABSOLUTT KRAV FØR NOE ARBEID BEGYNNER. Ingen rendring, ingen eksport og intet nytt skript før alt under er lest i sin helhet, ikke i utdrag; store filer leses i flere biter til de er lest helt. Når du er ferdig, skriv en kort liste til meg over hver fil med én setning om det viktigste du tok med deg fra den, og si ærlig fra om noe ikke er lest helt, og hvorfor. (Plastsjarken fikk 66/100, blant annet fordi økta leste spillets kode for modellen først da testene feilet, sulebas-bygging.md kap. 15.)
  1. Arbeidsmåten: docs/INDEKS.md, CLAUDE.md, docs/skipsmodeller/sulebas-bygging.md hele (reglene i kap. 7, lærdommene i kap. 11–14, og kap. 15 med selvkritikken og tabellen over spillets krav), /blender-skillen, og «Det neste økt bør vite» nederst i denne fila og i prompt-blender-revisjon.md.
  2. Kravlista: docs/skipsmodeller/planliste-fiskefartoy.md hele, også kap. 29 og 30.
  3. Malene for grunnlaget: sulebas-pilot-grunnlag.md (bygd etter bilder og byggerapport), og trebat-, skiff-, snekke- og plastsjark-grunnlag.md med byggedokumentene (snekka er den første med kjøl, innenbords propell i brønn og dørhus, plastsjarken den første med styrhus og nedsenket dørk, med selvvurderingen i kap. 9).
  4. Spillets båter og stigen: docs/systemer/baater.md, docs/systemer/3d-baater-og-animasjon.md (også 5.13), docs/batplan.md (skjemaet i del 4, huskeregelen i del 7, sjekklista B1–B22 i del 10, lanternene i del 11) og docs/skipsmodeller/kartlegging-spillet.md.
  5. Skriptene: ringnot38.py hele, de reviderte skriptene som ligner mest på den nye båten (snekke26.py, plast31.py, skiff59.py) hele, fittings.py og bpyutil.py hele, og alt i tools/boats/qa/.
  6. Spillets kode for modellen, før skriptet planlegges: VESSELS og SPEC3D (feltene en ny type må ha), og i vessel3d.js glbHas, deckMap (DM_HEAD og lenkene), deckPoints, markStrips, nameStrips, lanterns, mastTop og hvordan rattet og HELM_KIT brukes; i view3d delene som tegner skipperen, mannskapet og utstyret på plassene (20-trawl-seine, 09-landing-deck, 10-gear, 13-instruments; 12-skiff for åpne båter med håndsett); malen src/index.html (glb- og pic-linjene) og COVER i tests/run.py.
  7. Testene som skal dekke båten: vessel3d.py, brotest.py, lanterntest.py, regmarktest.py, maletest.py, walktest.py, vesseltest.py, utstyrstestene som gjelder (penshot for båter med mast), og docs/systemer/testing.md.

KILDENE: Jeg legger ved de bildene jeg har. Finn selv ut hva hvert bilde viser og hva det kan brukes til (rett fra siden = mål, skrått = form). Finn data selv der du kan: offentlige registre (Fiskeridirektoratet), byggerapporter og verftsdata. Skriv kildene i grunnlaget. Før du bygger, si hvilke bilder som mangler og ville gjort resultatet bedre. Kjør likevel på med det som finnes. Spør meg bare om det som ikke kan avgjøres uten meg.

SLIK SKAL DU JOBBE:
0. Før arbeidet begynner: legg alt fra tabellen over spillets krav (sulebas-bygging.md kap. 15) som kan regnes, inn i check() før overbygget formes.
1. Lag byggegrunnlaget først: docs/skipsmodeller/<båt>-grunnlag.md etter malen i sulebas-pilot-grunnlag.md, med fakta, regler, avgjørelser, målene, kravlista per planliste-ID og lanternene.
2. Mål i fast skala på sidebildet. Bruk skråbilder bare til form og rekkefølge. Skriv kilden til hvert mål i kommentaren. Skriv en check() i skriptet som sjekker modellen mot dataene: lengde, bredde, dybde, volumet under vannlinja mot deplasementet, og lanternereglene.
3. Bygg skroget som én glatt flate. Lag alle åpninger som ekte hull med rom bak, og sidene usymmetriske der båten er det. Fargegrensene skal følge skrogets linjer. Aldri to flater i samme plan.
4. Alt skal være festet slik det er på en ekte båt (vindskjermer, rekker, braketter, beslag), og alt skal vende riktig vei mot den som bruker det (skjermer, instrumenter).
5. Utstyr som kan brukes på flere båter, også det spillet beveger (ratt, motorer), lages som felles modeller i fittings.py. Bruk det som finnes der fra før.
6. Plassene for utstyr og folk (ankrene) skal gi en arbeidsflyt som går an om bord: fiskeren ved ripa og haleren, blødekar, sløyebord med plass å stå, fangstkar, styreplass. Se på det i spillet, ikke bare i ankrene.
7. Kjør kritikksløyfen etter hver endring: kameravinklene K1–K7 i planlisten, overlegg (uten foto: mot profilen fra qa/lines.py), klasjsjekk (0, også skrogets egne dekk), punkttelling, check() og eksport, og qa/deckpoints.py etter hver endring i høyder, tak eller luker. Et avvik i en rendring undersøkes med en gang. Aldri to SwiftShader-sider eller en Blender-rendring og en SwiftShader-test samtidig, heller ikke for feilsøking. Før rundene inn i grunnlaget. Send meg bilder underveis.
8. Vær petimeter, og ikke stopp før båten er så lik kildene som mulig. Si ærlig hva som ikke kan måles.
9. Budsjett: rundt 300 000 trekanter nær, 40 000 middels og for NPC-båter (trekk fra delene spillet tegner oppå middelsmodellen). Si fra om GLB-størrelsen. Det som stikker ut over ripa, teller i bredden vessel3d måler (±5 %). Ingen ekte navn, kallesignal eller logo (heller ikke i GLB-dataene), bare utsiden, ikke noe kjøpbart redskap modellert inn, og lanternene på lovlige plasser etter FOR-1975-12-01-5.

FERDIG BETYR:
- Eksportert, inn i malen, COVER i tests/run.py og VESSELS, og admin-knappen i Båthandelen gir meg båten gratis, så jeg kan teste.
- Spillet viser Blender-modellen (ikke en reserve), og utsynet fra broa, folk på dekk, utstyret, navnet og lanternene virker.
- Testene er grønne: vessel3d, brotest og lanterntest for typen, vesseltest, regmarktest og maletest. Røde tester sammenlignes med utgangspunktet.
- Skjermbilder fra spillet i begge formater, og nattbildet K6 fra begge sider.
- Grunnlaget med selvvurdering og karakter, systemdokumentet, kartlegging-spillet.md, batplan.md, backloggen, INDEKS og patchnotes oppdatert, og et byggedokument docs/skipsmodeller/<båt>-bygging.md.
- Det økta lærte ført inn i sulebas-bygging.md og /blender, og denne fila (docs/skipsmodeller/prompt-blender-ny-bat.md) oppdatert med grenen og det neste økt bør vite.
- Du får lov å pushe og rulle ut til detstorebla.no (ccr-5e1ba2f4-pusvyd) når testene er grønne. Sjekk først at pushen er en ren framoverføring (docs/systemer/publisering.md), og sjekk at utrullingen ble grønn.

Kjør på.

Verktøy (fra 01.11.2026): kritikksløyfens skript ligger i `tools/boats/qa/` (shots, sheet, stubcheck, lines for alle skript, clip-eksemplene, deckpoints, runtests med `P=`);
bruk og forbedre dem i stedet for å skrive nye i kladdemappa. Vei båten med `stubcheck.py --volume` før noe annet (`kartlegging-spillet.md` D8).
