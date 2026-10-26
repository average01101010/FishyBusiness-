# Plan for utviklingsarbeidet videre (26.10.2026)

Jonas spurte 26.10.2026 hvordan vi kan utvikle spillet videre med Claude Code uten at kvaliteten faller når prosjektet er blitt stort. Dette er planen. Den handler om arbeidsmåten, ikke om spillet. Status oppdateres nederst.

## 0. Utgangspunktet

Tallene er fra repoet 26.10.2026.

- 794 commits siden 01.10.2026, mellom 20 og 78 per dag i de travle dagene. Alt er laget i én chat som er komprimert mange ganger.
- Spillkoden er 30 587 linjer JavaScript, 3,5 MB. De to største filene: `src/js/view3d.js` (6 035 linjer, 647 kB, lengste linje 5 845 tegn) og `src/js/ui/05-phone.js` (2 118 linjer, 465 kB). Å lese én av dem koster en stor del av kontekstvinduet.
- `docs/OVERLEVERING.md` er 4 532 linjer. `CLAUDE.md` ber om at den leses før spillet endres. Kapittelnumrene er brutt: 5.40 står før 4.12c, 5.33 og 5.34 finnes to ganger, 5.35–5.63 står etter kapittel 9 og 12.
- 236 testskript, med `tests/run.py` som vet hvilke tester som dekker hvilke filer (`COVER`), og som skiller lette tester fra 3D-tester.
- Ingen skills eller kommandoer i `.claude/` ennå.
- Tilbakemeldingsrutinen (4.22 i overleveringen, `tools/feedback/RUTINE.md`) kjører alt i egne økter fire ganger i døgnet og leverer PR-er. PR #23 kom derfra og ble flettet 25.10.2026 etter gjennomgang.

**Det som har holdt kvaliteten oppe,** er ikke chatten, men dokumentasjonen (`CLAUDE.md`, overleveringen), testene med `COVER`, stikkprøvene langs kysten, skjermbildene i begge formater og én commit per endring. Planen bygger videre på det og gjør det billigere å følge.

**Det som koster nå:** hver komprimering mister detaljer, så avgjørelser må finnes fram igjen; de store filene leses om igjen; overleveringen leses hel når bare ett system trengs.

## 1. Prinsipper

1. **Dokumentene er hukommelsen.** Det som avgjøres, skrives inn samme dag, i dokumentet for systemet det gjelder. En ny økt skal kunne begynne på en oppgave uten å ha vært med på samtalen.
2. **Les bare det oppgaven trenger.** Indeksen og ett systemdokument, ikke hele overleveringen. `grep` før en stor fil leses, og aldri hele `view3d.js`.
3. **Én økt per oppgave.** En oppgave som er ferdig, dokumentert og pushet, lukker økta. Neste oppgave får et rent vindu.
4. **Kvaliteten sikres av det som allerede virker:** `node --check`, bygg, `run.py changed`, stikkprøver sør/midt/nord, skjermbilder stående og liggende, patchnotes, doku, én commit per endring, grønn utrulling. Dette blir en skill (`/lever`), så det er ett ord å følge, ikke ett avsnitt å huske.
5. **Agenter er jobber, ikke roller.** En agent får én avgrenset jobb med klart resultat (en gjennomgang, et søk, en test i bakgrunnen, en modell i en egen mappe, en PR fra en tilbakemelding). Ingen faste «ansatte» som snakker sammen, og aldri to agenter i samme fil.
6. **Ingen omskriving for omskrivingens skyld.** Koden deles bare opp der det kan gjøres uten å endre bygget (byte-identisk `dist/index.html`), og bare der det sparer kontekst.

## 2. Fase A: Dokumentasjonen (én økt, bare dokumenter)

**A1. Overleveringen deles opp.** Hvert kapittel og delkapittel flyttes ordrett til `docs/systemer/<navn>.md`, ett dokument per system (for eksempel `kart-og-terreng.md`, `autonav.md`, `havner-og-kaier.md`, `npc-trafikk.md`, `fiskerimodellen.md`, `priser-og-salg.md`, `kvoter-og-regler.md`, `mannskap.md`, `driftsplan.md`, `baater-og-utstyr.md`, `3d-og-animasjon.md`, `vaer-og-hav.md`, `skyen-og-felles-verden.md`, `telefon-og-apper.md`, `testing.md`). Kapittelnumrene erstattes av filnavn. En tabell `docs/systemer/gamle-numre.md` sier hvor hvert gammelt nummer havnet, så henvisninger i commit-meldinger og kodekommentarer («se 4.16c») fortsatt kan følges.

**A2. `docs/INDEKS.md`:** ett avsnitt per systemdokument med hva det dekker og hvilke kildefiler det gjelder. Det er dette en økt leser først. Visjonen, arbeidsmåten og statusen (kapittel 1–3) blir `docs/visjon.md` og står øverst i indeksen.

**A3. Kapittel 10 blir `docs/BACKLOG.md`:** feil, spillbarhet, antakelser, valg som står med vilje, det som må måles, røde tester, små ryddejobber. Hver økt avsluttes med å oppdatere den. Det som er rettet, flyttes til bunnen med dato. Dette er den ene lista. Oppgavene i chatten (#402–#412) overlever ikke økta, så alt som skal huskes, står her.

**A4. `CLAUDE.md` kortes.** Reglene blir stående (de er Jonas' valg og skal følges), men prosedyrene flyttes til skills, og «les overleveringen» blir «les `docs/INDEKS.md`, så dokumentet for systemet du endrer». Mål: under 120 linjer. Et avsnitt om kontekst kommer til: les aldri hele `view3d.js` eller `05-phone.js`, bruk `grep` og kodekartet.

**A5. Kodekart:** `docs/systemer/kodekart.md` med seksjonene i de største filene, etter kommentaroverskriftene (`// ---------- … ----------` i `view3d.js`, appene i `05-phone.js`), med funksjonsnavnene i hver. Det er billigere å slå opp i enn å lese fila. Kartet lages av et lite skript (`tools/docs/kodekart.py`) så det kan lages på nytt når koden endres; `/lever` skriver det på nytt (`--check` sier om det er gammelt).

**Sikring:** ingen setning slettes, bare flyttes. Summen av linjer før og etter sammenlignes. Alle lenker i `CLAUDE.md`, `docs/` og `tools/feedback/RUTINE.md` som peker til overleveringen, oppdateres og sjekkes med `grep`. `OVERLEVERING.md` blir stående som én side som bare peker til indeksen, så gamle lenker ikke dør. Ingen spillkode endres, så ingen tester trengs.

## 3. Fase B: Skills (én økt, bare dokumenter)

En skill er en fil `.claude/skills/<navn>/SKILL.md` med en framgangsmåte. `/<navn>` i chatten laster den inn, og den følges. Skillene er korte og peker til dokumentene; de gjentar ikke kunnskap.

| Skill | Når | Innhold |
|---|---|---|
| `/lever` | hver gang en endring skal ut | `node --check` på endrede JS-filer, `node build.mjs`, `python3 tests/run.py changed`, skjermbilder 800×1280 og 1280×800 av UI-endringer og se på dem, patchnotes (ny oppføring eller linje øverst, norsk og engelsk, aldri design/psykologi/penger), systemdokumentet oppdatert, `BACKLOG.md` oppdatert, én commit med klar melding, push, sjekk at «Appen på Hetzner» og «Appen på GitHub Pages» er grønne, kort rapport til Jonas med hva som er prøvd hvor |
| `/stikkprove <hva>` | en retting som kan gjelde hele kysten | prøv i minst tre byer spredt (Bergen, Bodø, Hammerfest eller Båtsfjord, i tillegg til der feilen ble funnet), med `dist-vec` når det gjelder vec-pakkene, og rapporter per sted om feilen fantes der |
| `/tilbakemeldinger` | når Jonas spør, eller før en økt velger oppgave | hent nye fra `feedback` (status ikke rettet), oppsummer per spiller og sak, finn PR-er fra rutinen som venter, foreslå hva som tas nå og hva som trenger et valg; aldri svar spillerne direkte |
| `/regresjon` | før publisering og én gang i uka | `python3 tests/run.py full` i bakgrunnen, så sortering: nytt rødt mot kjent rødt (`BACKLOG.md`), gjenta én gang det som kan være ustabilt, rett det som er vårt, skriv resten i backloggen |
| `/planlegg <funksjon>` | en større funksjon med valg | les systemdokumentet, skriv planen til `docs/planer/<navn>.md` med faser som hver passer én økt (som D1–D6 for driftsplanen), still valgene som A/B/C med anbefaling, og vent på klarsignal |
| `/okt-slutt` | siste handling i hver økt | `BACKLOG.md` ajour, systemdokumentet ajour, alt pushet, og en kort status i tre linjer: gjort, prøvd hvor, neste |
| `/blender <modell>` | en ny eller endret modell | rørledningen i 5.13: skriptet i `tools/…`, `bpy==4.5.4`, eksport til `src/data/*.b64`, linjene i malen, kontrollbildene, `vessel3d` bare når båtmodellene er endret |

Innebygde som brukes i tillegg: `/code-review` før push av endringer i kjernefilene (`03-simulation`, `05-vessels`, `10-gear`, `03e-rules`, `10f-cloud`, lagring og penger) og av alt over rundt 150 linjer; `/simplify` etter en funksjon, før `/lever`; plan-modus i stedet for `/planlegg` når Jonas vil se planen før noe skrives til repoet; `/compact` med beskjed om hva som skal beholdes («behold valgene A–D og fillista») når en økt må fortsette etter en lang utredning.

## 4. Fase C: Slik går en økt (fra og med fase B)

1. **Start:** «Les `CLAUDE.md`, `docs/INDEKS.md` og `docs/BACKLOG.md`. Oppgave: …». Økta leser så bare systemdokumentet for oppgaven.
2. **Størrelse:** en oppgave passer én økt når den gjelder ett system og under fem filer. Større ting får `/planlegg` først, og hver fase sin økt. Driftsplanen D1–D6 var seks økter i én chat; heretter er det seks økter.
3. **Underveis:** `grep` før lesing, lesing med `offset`/`limit`, lange tester i bakgrunnen, og lesende agenter til søk over mange filer. Et valg som dukker opp, stilles som A/B med anbefaling, kort.
4. **Slutt:** `/lever`, så `/okt-slutt`. Økta lukkes.
5. **Ny økt når:** temaet byttes, en stor funksjon er ferdig, eller økta begynner å lese de samme filene om igjen. Det siste er tegnet på at vinduet er fullt.
6. **Jonas' del:** valgene i korte meldinger (A/B/C virker godt), testing på nettbrettet, tilbakemeldinger gjennom appen som før. Når noe ikke stemmer med det han ba om, sier han det, og økta retter før den går videre.

## 5. Fase D: Agenter og automatikk

Det som virker, og som vi delvis har:

- **D1. Gjennomgang.** `/code-review` er en ny agent som leser diffen uten konklusjonene mine. Brukes som i kapittel 3. Funn rettes før push; det som ikke rettes, begrunnes i commit-meldingen.
- **D2. Søk.** Lesende agenter («Explore») når et spørsmål går over mange filer. De holder fildumpene ute av hovedvinduet. Brukt 24.10.2026 til gjennomgangen av kapittel 10 (fire agenter).
- **D3. Parallelt arbeid bare i adskilte mapper:** `tools/boats`, `tools/harbour`, `tools/map`, `tools/fish`, `docs`, `tests`. Hver agent i egen arbeidskopi (worktree), hovedøkta fletter og kjører `/lever`. Aldri to agenter i `src/js/`, fordi alt deler ett skop og én fil.
- **D4. Tilbakemeldingsrutinen** fortsetter som i dag: ny økt fire ganger i døgnet, høyst to PR-er, aldri push til arbeidsgrenen. Hovedøkta ser gjennom og fletter (som #23). Endring: `RUTINE.md` får `/stikkprove` og skjermbilder i PR-beskrivelsen som krav når rettingen gjelder kysten eller UI, så gjennomgangen går raskere.
- **D5. Ukentlig regresjon (ny rutine, etter E4):** en planlagt økt natt til mandag kjører `/regresjon` på arbeidsgrenen og leverer én PR som oppdaterer `BACKLOG.md` med det røde, med loggene lenket. Ingen kodeendringer fra den. Hovedøkta retter.
- **D6. Det vi ikke gjør:** faste agenter med titler som snakker sammen (hver overlevering mister detaljer, en agent bekrefter hypotesen den får, og det koster mer enn det gir); agenter som fletter uten et menneske; agenter som skriver i `.github/`, `supabase/`, admin eller `CLAUDE.md`.

## 6. Fase E: Koden (bare det som sparer kontekst uten risiko)

- **E1. `view3d.js` deles i filer per seksjon** (`src/js/view3d/00-….js` til `NN-….js`) som malen legger i samme `<script>`, slik `core/` og `ui/` alt gjør. Rent flytt etter kommentaroverskriftene, ingen logikk endres. Krav: `dist/index.html` byte-identisk før og etter (bygg begge og `cmp`). Da trengs ingen tester for flyttingen. Én commit per fil som skilles ut. `COVER` får hver nye fil med testene som i dag dekker `view3d.js`, fordelt etter innhold. Samme for `05-phone.js` (én fil per app). Gevinst: en økt leser 300 linjer i stedet for 6 000.
- **E2. De lange linjene** røres ikke. Å brekke dem gir diff-støy i hele fila og ingen gevinst for grep.
- **E3. `COVER` holdes ved like:** hver ny fil i `src/` får sin test samme commit (regelen finnes), og nye tester legges i `LITE` når de ikke ser på 3D-bildet.
- **E4. De røde testene rettes først:** `geartest`, `routetest`, `worktest`, `maptest`, `camtest`, `bunkertest`, `charttest`, `crewwalk`, `anchor3d` (`BACKLOG.md`). Før de er grønne eller merket ustabile med grunn, betyr ikke «full regresjon grønn» noe, og D5 kan ikke starte.
- **E5. `npctest` og `havntest` bygger begge `dist-vec/`** og kan feile når de går samtidig. `run.py` bygger `dist-vec/` én gang før dem, eller de settes i `SOLO`.

## 7. Rekkefølge og omfang

| Uke | Hva | Omfang | Risiko for spillet |
|---|---|---|---|
| 1 | Fase A (dokumentene) | 1 økt, 2–3 timer | ingen, bare dokumenter |
| 1 | Fase B (skills) | 1 økt, 1–2 timer | ingen |
| 1 | E5 (`dist-vec` bygges én gang) | 20 minutter | ingen |
| 2 | E4 (de røde testene), én økt per test | 3–5 økter | lav, rettinger i tester og enkeltfeil |
| 2 | E1 (`view3d.js` og `05-phone.js` deles) | 2 økter | ingen når bygget er byte-identisk |
| 3 | D4 (rutinen får stikkprøver og skjermbilder), D5 (ukentlig regresjon) | 1 økt | ingen |
| løpende | fase C er arbeidsmåten for alt annet | | |

Spillarbeidet (sikkerhet SK1–SK6, oppdragsfristene fra #92/#93, resten av backloggen) går videre fra uke 1 etter fase C, med de nye skillene. Fase A og B er forutsetningen, resten kan flettes inn mellom spilloppgavene.

## 8. Slik ser vi at det virker

- En ny økt er i gang med oppgaven etter å ha lest indeksen og ett systemdokument, uten å ha åpnet `view3d.js` hel.
- En oppgave går i én økt uten komprimering, eller med høyst én.
- Avgjørelser som ble tatt tidligere, finnes i systemdokumentet, ikke bare i chatten. Prøve: still en ny økt et spørsmål om et valg fra forrige uke, og se om den svarer fra dokumentene.
- Full regresjon er grønn hver uke, eller rødt står i `BACKLOG.md` med grunn innen mandag.
- Tilbakemelding til flettet PR: under ett døgn for små feil, slik #95 ble (meldt 24.10 kl. 09, PR samme formiddag, flettet 25.10).

## 9. Valg for Jonas

1. **Fase A og B nå?** Anbefalt ja. Bare dokumenter og skill-filer, ingen spillkode og ingen tester.
2. **E1, oppdelingen av `view3d.js` og `05-phone.js`?** Anbefalt ja, med byte-identisk bygg som krav for hver commit. Alternativet er å la filene stå og leve med kodekartet (A5), som gir det meste av gevinsten for lesingen, men ikke for redigeringen.
3. **D5, ukentlig regresjon som egen rutine?** Anbefalt ja, men først etter E4.
4. **Navn:** `docs/systemer/`, `docs/INDEKS.md`, `docs/BACKLOG.md`, `docs/planer/`. Si fra om du vil ha andre.

## Status

- 26.10.2026: planen skrevet. Jonas svarte «1 ja, 2 ja, 3 ja, 4 ok, kjør på».
- 26.10.2026: **fase A gjort.** Overleveringen (4 532 linjer) delt ordrett i 31 dokumenter i `docs/systemer/`, `docs/planer/flaateplanen.md`, `docs/planer/forslagslista-04.10.2026.md` og `docs/BACKLOG.md` (skriptet flyttet hver seksjon hel og talte linjene: 4 532 inn, 4 532 ut). `docs/INDEKS.md` og `docs/systemer/gamle-numre.md` laget. `CLAUDE.md` fra 171 til 81 linjer; prosedyrene og rørledningene i `docs/systemer/datarorledninger.md`, `publisering.md` og `testing.md`. Kodekartet (`tools/docs/kodekart.py`, 2 760 linjer) laget. `OVERLEVERING.md` står som peker.
- 26.10.2026: **fase B gjort.** Skillene `/lever`, `/stikkprove`, `/tilbakemeldinger`, `/regresjon`, `/planlegg` (het `/plan` i planen; omdøpt så den ikke går i veien for plan-modus), `/okt-slutt` og `/blender` i `.claude/skills/`.
- 26.10.2026: **E5 gjort.** `run.py` bygger `dist-vec/` én gang før `npctest`, `havntest` og `vectest` (`VECB`, `KYST_VEC_BUILT`).
- 26.10.2026: **E4 nesten gjort** (første økt med den nye arbeidsmåten). worktest, crewwalk, anchor3d, geartest, camtest, maptest og bunkertest er grønne, routetest så nær som Autonav Bodø–Reine (kjernebygg); alt var feil eller utdatert i testene, spillet er ikke endret. Står igjen i `BACKLOG.md` 10.6: Bodø–Reine (prøves i et bygg med hele kysten) og charttest (navn i regionen, sømmen ved Lyngen stående, tegnetiden 3 s i fjorden).
- 26.10.2026, andre økt: **E4 gjort** så nær som charttests tegnetid (fjorden stående 3,0 s mot 2,5 s, rasterflisene; ytelsesoppgave i `BACKLOG.md` 10.6). Bodø–Reine er grønn med hele kysten i bygget (regresjonen må bygges slik). Én spillretting: rang 0-navnene på kartet plasseres før havneetikettene (fad44f5).
- Neste: E1 (oppdelingen av `view3d.js` og `05-phone.js`), D4 og D5, hver i sin egen økt; D5 kjører med hele kysten i bygget.
