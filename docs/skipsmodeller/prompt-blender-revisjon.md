Revider båtmodellen: [BÅTENS NAVN]

Dette er en eksisterende Blender-modell i spillet som ikke ble bygd etter noen plan. Løft den til samme nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene trebat, skiff, snekke og plastsjark (F5 i docs/planer/grafikk-batmodeller.md). Finn selv ut hvilken type i VESSELS og hvilket skript i tools/boats/ navnet gjelder.

GRENEN: main er tom; spillet ligger på arbeidsgrenene. Bygg på den nyeste grenen med spillet (nå ccr-bdecba4a-xbp5d0, som har trebåten, skiffen, plastsnekka, plastsjarken, verktøyene i tools/boats/qa og lærdommene; den er også rullet ut til ccr-5e1ba2f4-pusvyd) og commit underveis.

LESING ER ET ABSOLUTT KRAV FØR NOE ARBEID BEGYNNER. Ingen rendring, ingen eksport og ingen endring i noe skript før alt under er lest i sin helhet, ikke i utdrag; store filer leses i flere biter til de er lest helt. Når du er ferdig, skriv en kort liste til meg over hver fil med én setning om det viktigste du tok med deg fra den, og si ærlig fra om noe ikke er lest helt, og hvorfor. (Plastsjarken fikk 66/100, blant annet fordi økta leste spillets kode for modellen først da testene feilet, sulebas-bygging.md kap. 15.)
  1. Arbeidsmåten: docs/INDEKS.md, CLAUDE.md, docs/skipsmodeller/sulebas-bygging.md hele (reglene i kap. 7, lærdommene i kap. 11–14, og kap. 15 med selvkritikken og tabellen over spillets krav), /blender-skillen, og «Det neste økt bør vite» nederst i denne fila.
  2. Kravlista: docs/skipsmodeller/planliste-fiskefartoy.md hele, også kap. 29 og 30.
  3. Malene for grunnlaget: sulebas-pilot-grunnlag.md, og trebat-, skiff-, snekke- og plastsjark-grunnlag.md med byggedokumentene (snekka er den første med kjøl, innenbords propell i brønn og dørhus, plastsjarken den første med styrhus og nedsenket dørk, med selvvurderingen i kap. 9).
  4. Det som er kjent om båten: docs/skipsmodeller/kartlegging-spillet.md (også M-punktene og D8), docs/batplan.md (også statuslinjene for båten), docs/systemer/baater.md og docs/systemer/3d-baater-og-animasjon.md (også 5.13).
  5. Skriptene: båtens eget skript hele (se særlig hva snittfunksjonen returnerer, om kjølen er en egen kropp, og hvilke tegninger eller bilder målene kom fra), ringnot38.py hele, de reviderte skriptene som ligner mest (snekke26.py, plast31.py) hele, fittings.py og bpyutil.py hele, og alt i tools/boats/qa/.
  6. Spillets kode for modellen, før skriptet planlegges: VESSELS og SPEC3D for typen, og i vessel3d.js glbHas, deckMap (DM_HEAD og lenkene), deckPoints, markStrips, nameStrips, lanterns, mastTop og hvordan rattet og HELM_KIT brukes; i view3d delene som tegner skipperen, mannskapet og utstyret på plassene (20-trawl-seine, 09-landing-deck, 10-gear, 13-instruments; 12-skiff for åpne båter med håndsett).
  7. Testene som dekker båten: vessel3d.py, brotest.py, lanterntest.py, regmarktest.py, maletest.py, walktest.py, vesseltest.py, utstyrstestene som gjelder (penshot for båter med mast), og docs/systemer/testing.md.

KILDENE: Jeg legger ved de bildene jeg har. Finn selv ut hva hvert bilde viser og hva det kan brukes til (rett fra siden = mål, skrått = form). Har jeg ikke lagt ved bilder, bruk det som finnes i repoet og dokumentene (kildene i skriptets kommentarer, tegningsmål, kartlegging-spillet.md), og si hvilke bilder som ville gjort resultatet bedre. Spør meg bare om det som ikke kan avgjøres uten meg.

SLIK SKAL DU JOBBE:
0. Før arbeidet begynner: legg alt fra tabellen over spillets krav (sulebas-bygging.md kap. 15) som kan regnes, inn i check() før overbygget formes. Skal båten gjøres penere, legg fram en kort liste over grepene i gjennomgangen.
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

---

Det neste økt bør vite (etter plastsjarken 01.11.2026):
- Les `sulebas-bygging.md` kap. 15 først: tabellen over spillets krav (dekkskartet 1,85 m og lenkene til tak, navnet mot registreringsmerket,
  LOD-grensene) skal inn i `check()` før overbygget formes; plastsjarken brukte to ekstra runder på dem. Selvvurderingen står i
  `plastsjark-grunnlag.md` kap. 9 (66/100): ikke noe overlegg, et avvik bortforklart, en regel om testene brutt.
- Sjekk hva snittfunksjonen returnerer før du veier: `qa/lines.py <skript> --section <navn>` tegner spantrisset og veier tre vannlinjer for
  alle skript (plast31: `curve` var hele skroget, 21,9 t mot 6). Kroppen under vannlinja som én kubisk kurve (`plast31.py body`) gir rund kimming uten knekk.
- `tests/p31shot.py` er den nyeste malen for før- og etter-bildene; `runtests.sh` tar `P=<prefiks>` for loggnavnene.
- Fjernmodellen må holde 12 000 punkter (rundt 4 000 trekanter) i `vessel3d`; hold beslag og ekstra rader ute av `build(False)`.
- Jonas ga frie tøyler til å gjøre plastsjarken pen: se `plastsjark-bygging.md` kap. 3 og `sulebas-bygging.md` kap. 14 for hva som virket.
- Åpent spørsmål til Jonas: hvor står styrhuset på forbildet (akter eller midtskips)? `plastsjark-grunnlag.md` kap. 8.
- Neste i rekkefølgen etter `docs/batplan.md` del 10: `hs11.py` (sjarkny, 45 t mot 15), så `hurtig11.py` og `malo36.py`.

Det neste økt bør vite (etter plastsnekka 01.11.2026):
- Regn ut det gamle skrogets deplasement før du ser på bildene (kap. 13): snekka hadde 10,5 t mot 3,0 t uten at noen hadde sett det.
- `tests/sn26shot.py` er malen for før- og etter-bildene (utenfra K1 og K2, broa, dekket under fiske med to mann og fangst, natt K6), og
  verktøyene for kritikksløyfen ligger i `tools/boats/qa/` (se under).
- Felles beslag nye 01.11.2026: `single_lever`, `helm_seat`, `stern_lantern`, `foil_rudder`. Slå opp i `fittings.py` først.
- Neste i rekkefølgen etter `docs/batplan.md` del 10: `hs11.py` (sjarkny), så `hurtig11.py` og `malo36.py`.

Verktøy (fra 01.11.2026): kritikksløyfens skript ligger i `tools/boats/qa/` (shots, sheet, stubcheck, clip- og lines-eksemplene, runtests);
bruk og forbedre dem i stedet for å skrive nye i kladdemappa. Vei båten med `stubcheck.py --volume` før noe annet (`kartlegging-spillet.md` D8).
