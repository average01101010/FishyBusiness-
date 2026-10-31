# Prompten for å revidere en eksisterende båtmodell

Prompten Jonas bruker når en ny økt skal løfte en eksisterende Blender-båt til pilotbåtens nivå (F5 i
`docs/planer/grafikk-batmodeller.md`). Brukt på trebåten (`trebat`) og skiffen (`skiff`) 31.10.2026, og oppdatert etter det de øktene lærte
(`sulebas-bygging.md` kap. 11 og 12). Bytt navnet i hakeparentesen, og ta med siste linje bare når det stemmer.

**Neste båt i rekkefølgen** (`docs/batplan.md` del 10, F5): `snekke` (`snekke26.py`, «Snekke 26 fot (7,9 m) …»; se `VESSELS` for det
nøyaktige navnet). Ferdige: `ringnot38` (piloten), `trebat`, `skiff`.

**Grenen:** `main` er tom; spillet ligger på arbeidsgrenene. Den nyeste med skiffen, trebåten og lærdommene er `ccr-bbe9c816-r2609u`
(31.10.2026). Oppdater linja i prompten når en nyere gren har tatt over.

---

```
Revider båtmodellen: [NAVN FRA VESSELS]
Dette er en eksisterende Blender-modell i spillet som ikke ble bygd etter noen plan. Løft den til samme nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene trebat og skiff (F5 i docs/planer/grafikk-batmodeller.md). Finn selv ut hvilken type i VESSELS og hvilket skript i tools/boats/ navnet gjelder.

GRENEN: main er tom. Bygg på den nyeste grenen med spillet (nå ccr-bbe9c816-r2609u) og push til arbeidsgrenen din. Commit underveis.

LES FØRST, I SIN HELHET, før du endrer noe: docs/INDEKS.md, docs/skipsmodeller/sulebas-bygging.md (arbeidsmåten; reglene i kap. 7 og lærdommene i kap. 11 og 12 gjelder), /blender-skillen, docs/skipsmodeller/planliste-fiskefartoy.md (også kap. 29 og 30), docs/skipsmodeller/sulebas-pilot-grunnlag.md (malen for grunnlaget), trebat-grunnlag.md og skiff-grunnlag.md (eksempler på reviderte båter), docs/skipsmodeller/kartlegging-spillet.md og docs/batplan.md (det som er kjent om båten), skriptet, ringnot38.py, fittings.py og bpyutil.py, og det spillet bruker fra modellen (VESSELS, SPEC3D, ankrene og koden som tegner båten). Si fra hvis du ikke har lest noe av dette.

KILDENE: Jeg legger ved de bildene jeg har. Finn selv ut hva hvert bilde viser og hva det kan brukes til (rett fra siden = mål, skrått = form). Har jeg ikke lagt ved bilder, bruk det som finnes i repoet og dokumentene, og si hvilke bilder som ville gjort resultatet bedre. Spør meg bare om det som ikke kan avgjøres uten meg.

SLIK SKAL DU JOBBE:
Gjennomgang før du endrer noe:
- Sjekk at spillet faktisk viser Blender-modellen for typen (og ikke en gammel reserve), og ta skjermbilder fra spillet i begge formater før eksporten.
- Render dagens modell fra kameraene K1–K7 i planlisten og lag overlegget mot sidebildet hvis det finnes et.
- Gå gjennom kravlista (B1–B22), planliste-ID-ene og M-punktene, og like kritisk det skriptet har fra før.
- Skriv avvikslista i docs/skipsmodeller/<båt>-grunnlag.md og send meg bildene og lista. Kjør deretter på uten å vente.

Bygging:
- Velg selv om skriptet bygges om eller skrives på nytt. Skroget skal bli én glatt flate målt i fast skala, og åpninger skal bli ekte hull. Aldri to flater i samme plan.
- Alt skal være festet slik det er på en ekte båt (vindskjermer, rekker, braketter, beslag), og alt skal vende riktig vei mot den som bruker det (skjermer, instrumenter).
- Utstyr som kan brukes på flere båter (også det spillet beveger, som ratt og motorer), lages som felles modeller i fittings.py. Bruk det som finnes der fra før.
- Plassene for utstyr og folk skal gi en arbeidsflyt som går an om bord: fiskeren ved ripa og haleren, blødekar, sløyebord med plass å stå, fangstkar, styreplass. Se på det i spillet, ikke bare i ankrene.
- Behold det spillet er avhengig av: typenavnet, malingssonene og alle ankrene. Ankrene kan flyttes, men skal finnes. Endre VESSELS bare når kildene sier noe annet, og si fra om det.
- Finner du feil i spillets kode som hindrer at modellen vises eller brukes riktig, rett dem, og si fra.

Kritikksløyfen etter hver endring: kameravinklene, overlegg, klasjsjekk (0, også skrogets egne dekk), punkttelling, check() mot VESSELS og lanternereglene, og eksport. Før rundene inn i grunnlaget. Send meg før- og etterbilder underveis.
Vær petimeter, og ikke stopp før båten er så lik kildene som mulig. Si ærlig hva som ikke kan måles.
Budsjett: rundt 300 000 trekanter nær, 40 000 middels og for NPC-båter (trekk fra deler spillet tegner oppå middelsmodellen). Si fra om GLB-størrelsen. Ingen ekte navn eller logo (heller ikke i GLB-dataene), bare utsiden, ikke noe kjøpbart redskap modellert inn, og lanternene på lovlige plasser.

FERDIG BETYR:
- Eksportert og i spillet: utstyr, folk på dekk, utsyn fra broa (konsoll eller instrumenter synlige), navn og lanterner virker, og arbeidsflyten om bord går an.
- Testene som dekker båten er grønne: vessel3d, brotest og lanterntest for typen, vesseltest, regmarktest, maletest og utstyrstestene som gjelder. Røde tester sammenlignes med utgangspunktet.
- Skjermbilder fra spillet i begge formater, før og etter, og nattbildet (K6).
- Grunnlaget, kartlegging-spillet.md, batplan.md, systemdokumentet, backloggen, INDEKS og patchnotes oppdatert, et kort byggedokument docs/skipsmodeller/<båt>-bygging.md, det økta lærte ført inn i sulebas-bygging.md og /blender, og denne prompten (docs/skipsmodeller/prompt-revidere-batmodell.md) oppdatert med neste båt, grenen og det som bør stå i den.

Mål: En mye mer detaljert modell enn vi har i dag.
[Ta med bare hvis det stemmer: Jeg har dessverre ikke tegninger eller bilder for hånd, så du får revidere den etter beste evne.]
```

---

## Hvorfor prompten ser slik ut

Det Jonas måtte si underveis i de første revisjonene, står nå i prompten fra start:

| Lagt til | Fordi |
|---|---|
| Grenen | `main` er tom; skiffens økt startet på første commit og måtte finne grenen med spillet selv |
| «Les i sin helhet», kap. 11 og 12, eksemplene | Skiffens økt leste flere dokumenter bare i utdrag og fant to krav i planlisten (kap. 29, 30) sent |
| Sjekk at spillet viser modellen | Egen skiff ble tegnet med den gamle JS-modellen i to dager uten at noen så det |
| Det arvede like kritisk | Skjermene i det gamle skriptet vendte ned mot dørken (Jonas så det) |
| Festet som på en ekte båt | Vindskjermen svevde over konsollen (Jonas) |
| Felles modeller, også det spillet beveger | Jonas: «lag gjerne modeller av utstyr som kan brukes felles», «rattet til en felles modell» |
| Arbeidsflyten om bord | Spillets sløyebord og blødekar sto ved skipperens sete (Jonas: «Det går jo ikke») |
| Rett spillets feil | «Uten endring i oppførsel» kunne ikke holdes når modellen ikke ble vist i det hele tatt |
| regmarktest, maletest, sammenligning med utgangspunktet | Testene som faktisk dekker en båtmodell; noen er røde fra før |
| K6, GLB-størrelsen, `extras` | Lanternene ses best tent; båtfilene vokser 5–10 ganger; skiffens GLB hadde produsentens navn |
| Oppdater denne prompten | Så neste økt får det denne lærte |

## Endringslogg

- 31.10.2026: første versjon, etter revisjonene av trebåten og skiffen.
