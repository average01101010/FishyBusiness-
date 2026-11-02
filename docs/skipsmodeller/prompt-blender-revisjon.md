Revider båtmodellen: [BÅTENS NAVN]

Dette er en eksisterende Blender-modell i spillet som ikke ble bygd etter noen plan. Løft den til samme nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene trebat, skiff, snekke, plastsjark, sjark (havsjarken) hurtigsjark og den nye hurtigsjarken sjarkny (F5 i docs/planer/grafikk-batmodeller.md). Finn selv ut hvilken type i VESSELS og hvilket skript i tools/boats/ navnet gjelder.

GRENEN: main er tom; spillet ligger på arbeidsgrenene. Bygg på den nyeste grenen med spillet (nå ccr-d78d62c5-6euqj9 med breisjarken; før ccr-70d301a0-y5jgev, som har trebåten, skiffen, plastsnekka, plastsjarken, havsjarken, hurtigsjarken, den nye hurtigsjarken, verktøyene i tools/boats/qa og lærdommene; den er også rullet ut til ccr-5e1ba2f4-pusvyd) og commit underveis.

LESING ER ET ABSOLUTT KRAV FØR NOE ARBEID BEGYNNER. Ingen rendring, ingen eksport og ingen endring i noe skript før alt under er lest i sin helhet, ikke i utdrag; store filer leses i flere biter til de er lest helt. Når du er ferdig, skriv en kort liste til meg over hver fil med én setning om det viktigste du tok med deg fra den, og si ærlig fra om noe ikke er lest helt, og hvorfor. (Plastsjarken fikk 66/100, blant annet fordi økta leste spillets kode for modellen først da testene feilet, sulebas-bygging.md kap. 15. Havsjarken fikk 64/100: Jonas fant bulene i baugen og de svarte klaffene foran spygattene før økta, i bilder som alt var tatt, kap. 16. Hurtigsjarken fikk 62/100: Jonas måtte spørre etter lensportene, og økta brukte timer på tester som ikke kunne si noe nytt, kap. 17.)
  1. Arbeidsmåten: docs/INDEKS.md, CLAUDE.md, docs/skipsmodeller/sulebas-bygging.md hele (reglene i kap. 7, lærdommene i kap. 11–18, kap. 15 med selvkritikken og tabellen over spillets krav, og kap. 16 om jevnheten i skroget og dekkskartet), /blender-skillen, og «Det neste økt bør vite» nederst i denne fila.
  2. Kravlista: docs/skipsmodeller/planliste-fiskefartoy.md hele, også kap. 29 og 30.
  3. Malene for grunnlaget: sulebas-pilot-grunnlag.md, og trebat-, skiff-, snekke-, plastsjark-, havsjark-, hurtigsjark- og sjarkny-grunnlag.md med byggedokumentene (snekka er den første med kjøl, innenbords propell i brønn og dørhus, plastsjarken den første med styrhus og nedsenket dørk, havsjarken den første med ballastkjølen i skrogets flate, bakk og trapper i dekkskartet, hurtigsjarken den første hardknekte planende med skeg i snittet, sprutlister, lensporter ved dekket og skjul under tynt tak, den nye hurtigsjarken den første bygd etter en tegning med overlegg, kjøl og dyse; selvvurderingene står sist i grunnlagene).
  4. Det som er kjent om båten: docs/skipsmodeller/kartlegging-spillet.md (også M-punktene og D8), docs/batplan.md (også statuslinjene for båten), docs/systemer/baater.md og docs/systemer/3d-baater-og-animasjon.md (også 5.13).
  5. Skriptene: båtens eget skript hele (se særlig hva snittfunksjonen returnerer, om kjølen er en egen kropp, og hvilke tegninger eller bilder målene kom fra), ringnot38.py hele, de reviderte skriptene som ligner mest (snekke26.py, plast31.py, havsjark35.py, hurtig11.py, hs11.py) hele, fittings.py og bpyutil.py hele, og alt i tools/boats/qa/.
  6. Spillets kode for modellen, før skriptet planlegges: VESSELS og SPEC3D for typen, og i vessel3d.js glbHas, deckMap (DM_HEAD og lenkene), deckPoints, markStrips, nameStrips, lanterns, mastTop og hvordan rattet og HELM_KIT brukes; i view3d delene som tegner skipperen, mannskapet og utstyret på plassene (20-trawl-seine, 09-landing-deck, 10-gear, 13-instruments; 12-skiff for åpne båter med håndsett).
  7. Testene som dekker båten: tests/unit/vessel3d.test.mjs (tallene for alle modellene i Node, 6 s), vessel3d.py (bare bildene), brotest.py, lanterntest.py, regmarktest.py, maletest.py, walktest.py, vesseltest.py, utstyrstestene som gjelder (penshot for båter med mast), og docs/systemer/testing.md.

KILDENE: Jeg legger ved de bildene jeg har. Finn selv ut hva hvert bilde viser og hva det kan brukes til (rett fra siden = mål, skrått = form). Har jeg ikke lagt ved bilder, bruk det som finnes i repoet og dokumentene (kildene i skriptets kommentarer, tegningsmål, kartlegging-spillet.md), og si hvilke bilder som ville gjort resultatet bedre. Spør meg bare om det som ikke kan avgjøres uten meg.

SLIK SKAL DU JOBBE:
0. Før arbeidet begynner: legg alt fra tabellen over spillets krav (sulebas-bygging.md kap. 15) som kan regnes, inn i check() før overbygget formes. Skal båten gjøres penere, legg fram en kort liste over grepene i gjennomgangen.
1. Gjennomgang før du endrer noe:
   - Sjekk at spillet faktisk viser Blender-modellen for typen, og ikke en gammel reserve. Ta skjermbilder fra spillet i begge formater før eksporten (mal: tests/hu11shot.py, med K6 fra begge sider og K7 ovenfra; rundt 50 minutter for begge formater: start det først og alene).
   - Kjør qa/fair.py på det gamle skriptet (knekker per stasjon og rad, vannlinjene) og qa/deckpoints.py og qa/deckgrid.py på typen (hvor plassene havner, hva som er dekk).
   - Render dagens modell fra kameraene K1–K7 i planlisten og lag overlegget mot sidebildet hvis det finnes et.
   - Gå gjennom kravlista, B1–B22, planliste-ID-ene og M-punktene, og like kritisk det skriptet har fra før.
   - Skriv avvikslista i docs/skipsmodeller/<båt>-grunnlag.md og send meg bildene og lista.
   - Kjør deretter på uten å vente.
2. Velg selv om skriptet bygges om eller skrives på nytt etter ringnot38.py. Skroget skal bli én glatt flate målt i fast skala, og åpninger skal bli ekte hull. Aldri to flater i samme plan.
3. Alt skal være festet slik det er på en ekte båt (vindskjermer, rekker, braketter, beslag), og alt skal vende riktig vei mot den som bruker det (skjermer, instrumenter).
4. Utstyr som kan brukes på flere båter, også det spillet beveger (ratt, motorer), lages som felles modeller i fittings.py. Bruk det som finnes der fra før.
5. Plassene for utstyr og folk skal gi en arbeidsflyt som går an om bord: fiskeren ved ripa og haleren, blødekar, sløyebord med plass å stå, fangstkar, styreplass. Se på det i spillet, ikke bare i ankrene.
6. Behold det spillet er avhengig av: typenavnet, malingssonene og alle ankrene. Ankrene kan flyttes, men skal finnes. Endre VESSELS bare når kildene sier noe annet, og si fra om det. Finner du feil i spillets kode som hindrer at modellen vises eller brukes riktig, rett dem, og si fra.
7. Kjør kritikksløyfen etter hver endring: fotovinkler, overlegg, klasjsjekk (0, også skrogets egne dekk), qa/fair.py etter hver endring av snittet (ingen stasjon midt i baugen med knekk, vannlinjene under 0,02), punkttelling, check() mot VESSELS og lanternereglene, og eksport. Se selv på hvert nærbilde (baugen, hekken, åpningene, styrhuset) før noe meldes som ferdig, og mål hele flaten igjen når én feil er funnet. Før rundene inn i grunnlaget. Send meg før- og etterbilder underveis.
8. Vær petimeter, og ikke stopp før båten er så lik kildene som mulig. Si ærlig hva som ikke kan måles.
9. Budsjett: rundt 300 000 trekanter nær, 40 000 middels og for NPC-båter (trekk fra delene spillet tegner oppå middelsmodellen). Si fra om GLB-størrelsen. Ingen ekte navn eller logo (heller ikke i GLB-dataene), bare utsiden, ikke noe kjøpbart redskap modellert inn, og lanternene på lovlige plasser.

FERDIG BETYR:
- Eksportert og i spillet: utstyr, folk på dekk, utsyn fra broa (konsoll eller instrumenter synlige), navn og lanterner virker, og arbeidsflyten om bord går an.
- Testene som dekker båten er grønne: node tests/unit/run.mjs (også lokalflåtens fjernmodell), vessel3d, brotest og lanterntest for typen, vesseltest, regmarktest, maletest, walktest og utstyrstestene som gjelder (penshot for båter med mast), etter hverandre med tools/boats/qa/runtests.sh i bakgrunnen. En rød test kjøres på bygget før endringen (git stash, KYST_DIST) før den regnes som din eller ikke.
- Skjermbilder fra spillet i begge formater, før og etter, og nattbildet (K6).
- Grunnlaget, kartlegging-spillet.md, batplan.md, systemdokumentet, backloggen, INDEKS og patchnotes oppdatert, og et kort byggedokument docs/skipsmodeller/<båt>-bygging.md.
- Det økta lærte ført inn i sulebas-bygging.md og /blender, og denne fila (docs/skipsmodeller/prompt-blender-revisjon.md) oppdatert med grenen og det neste økt bør vite.
- Selvvurderingen i grunnlaget gir minst 75/100. **Ingenting under 75/100 er godkjent** (Jonas 01.11.2026): ligger vurderingen under, er båten ikke ferdig; ta neste runde i kritikksløyfen på det som trekker ned, og vurder på nytt. Vurder ærlig: det Jonas må påpeke selv, trekker.
- Test det som er relevant for endringen (Jonas 01.11.2026: «Du bestemmer selv hva du mener er relevant å teste»): en rød test som også rammer båter økta ikke har rørt, er ikke økta sin og føres i BACKLOG uten å kjøres på nytt.
- Du får lov å pushe og rulle ut til detstorebla.no (ccr-5e1ba2f4-pusvyd) når testene er grønne. Sjekk først at pushen er en ren framoverføring (docs/systemer/publisering.md), og sjekk at utrullingen ble grønn.

Kjør på.

---

Det neste økt bør vite (etter breisjarken 02.11.2026):

- Grenen med alt er nå `ccr-d78d62c5-6euqj9` (bygd på utrullingsgrenen `ccr-5e1ba2f4-pusvyd`; `main` er fortsatt tom).
- Les `sulebas-bygging.md` kap. 19: se hvor spillets utstyr står (haler, juksamaskiner, bord) før vegger og vinduer legges; Jonas ba om
  å åpne lyet om styrbord der mannskapet arbeider.
- `malo36.py` er den nyeste malen for en rundbunnet sjark med bakk, ly og en ripe som hopper (`z_ref`/`h_ref`, mykt hjørne i baugen).
- Tegningen bak `malo36.py` er ikke i repoet; be Jonas om den, og legg modellen over sideriss når den kommer.
- Selvvurderingen står i `breisjark-grunnlag.md` kap. 8. Neste i rekkefølgen etter `docs/batplan.md` del 10: `kyst15.py`, så `kyst21.py`.

Det neste økt bør vite (etter den nye hurtigsjarken 02.11.2026):

- Les `sulebas-bygging.md` kap. 18: malen gjelder koden, ikke formen. To typer i samme klasse skal skille seg i silhuetten; Jonas avviste
  et første utkast som lignet den brukte hurtigsjarken. Spør etter retningen tidlig når typen ligner en annen.
- Se etter tegninger eller bilder bak det gamle skriptet (kommentarene øverst, `3d-baater-og-animasjon.md`) og be Jonas om dem; med en
  tegning legges modellen over sideriss hver runde (`qa/overlay_hs11.py` er malen).
- Tegningens vekt (Δmax) og dataenes `disp` (lettvekt) er ikke det samme: les begge før bunnen tegnes om.
- `hs11.py` er malen for en tung arbeidsbåt med loddrett stevn, kjøl, dyse og et hus som fyller bredden.
- Selvvurderingen står i `sjarkny-grunnlag.md` kap. 8; farten (`vmax` 25 mot tegningens 12 kn) venter på Jonas.

Det neste økt bør vite (etter hurtigsjarken 01.11.2026):
- Grenen med alt er nå ccr-7d69b776-9fggkf (rullet ut til ccr-5e1ba2f4-pusvyd).
- Les `sulebas-bygging.md` kap. 17: tabeller lest av bilder leses med en glatt kurve (`hurtig11.py pchip`), linjene skal ende der de møter
  stevnen, og det spilleren venter å se (lensporter, spygatt), skal synes fra dekket.
- `hurtig11.py` er den nyeste malen for en hardknekt planende båt (skeg i snittet, sprutlister, slagflate, liste, skjul og tynt tak);
  `tests/hu11shot.py` for bildene i spillet (rundt 50 minutter for begge formater: start det først, alene).
- Fjernmodellen: spillets lokalflåte teller tre punkter per trekant; hold `build(False)` under 4 000 trekanter.
- Selvvurderingen står i `hurtigsjark-grunnlag.md` kap. 8.
- Neste i rekkefølgen etter `docs/batplan.md` del 10: `hs11.py` (sjarkny, 45 t mot 15), så `malo36.py`.

Det neste økt bør vite (etter havsjarken 01.11.2026):
- Les `sulebas-bygging.md` kap. 16: mål jevnheten i snittet (andrederiverte langs x) før bildene; Jonas så bulene i baugen før meg.
  Kimmingen som kubisk kurve med fyldighet per stasjon (`havsjark35.py vline`, `FULL`), ikke som bue fra en hjørnevinkel.
- Spillet fikk to regler i dekkskartet (`roofOver`: tak over rom er ikke dekk; `stairs: [{from, to}]`: trapper som lenker). Når en del ikke
  blir dekk: se rutenettet (`M._floors`, `M._lab`, `M.h`), og prøv en endring i `deckMap` på alle typer mot bygget før (`KYST_DIST`).
- Nye verktøy: `qa/fair.py <skript>` (knekkene i skroget per stasjon og rad, og vannlinjene; kjør det før hvert nærbilde av baugen) og
  `qa/deckgrid.py <type>` (dekkskartet rute for rute). Jonas fant bulene i baugen to ganger før meg: mål hele flaten, se på nærbildet.
- `qa/clip_havsjark35.py` er den nyeste klipp-kontrollen; `tests/hs35shot.py` tar også K6 fra babord og K7 ovenfra.
- Selvvurderingen står i `havsjark-grunnlag.md` kap. 8 (64/100). `check()` måler vannlinjenes jevnhet: bruk den i neste skript.
- Tallsjekkene for modellene går i Node (`node tests/unit/run.mjs vessel3d`, 6 s), også lokalflåtens fjernmodell; `vessel3d.py` tar bare bildene.
- Neste i rekkefølgen etter `docs/batplan.md` del 10: `hs11.py` (sjarkny, 45 t mot 15), så `hurtig11.py` og `malo36.py`.

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
