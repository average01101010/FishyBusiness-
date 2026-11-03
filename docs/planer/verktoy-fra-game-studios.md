# Verktøy fra Claude Code Game Studios: hva vi bør ta, og hva vi lar ligge (vurdering 28.10.2026)

> Vurdering etter `/planlegg`. Jonas ba 28.10.2026 om en gjennomgang av github.com/donchitos/claude-code-game-studios for å se om noe der bør brukes i Det Store Blå, og ba så økta svare på valgene selv. Svaret står under «Valg» og «Status». Venter på «kjør på». Ingen spillkode er endret.

## Hva prosjektet er

Claude Code Game Studios (versjon 1.2.0, 19.10.2026, MIT-lisens, 638 filer) er en mal man kloner **før** et spill begynner. Den gjør én Claude Code-økt til et «studio»: 49 agenter med roller i tre lag (direktører, avdelingsledere, spesialister), 74 skills for hver fase fra idé til lansering (`/brainstorm`, `/design-system`, `/create-epics`, `/create-stories`, `/dev-story`, `/story-done`, `/release-checklist`), 15 hooks som kjører automatisk (commit, push, lesing, skriving, øktstart, komprimering), 14 regler som lastes etter hvilken sti som leses, og 62 dokumentmaler (GDD, ADR, sprintplan, art bible). Alt styres av `project.yaml` med en bryter `modes.rigor` (`minimal`, `standard`, `full`). Motorene er Godot, Unity og Unreal.

Prosjektets egen måling er verdt å ta med: fire spill bygd fra samme brief, der `standard` skrev 30 dokumenter før første kodelinje og ble rangert **sist** av to blinde anmeldere og en spilltest. Derfor er `minimal` standardvalget deres. Med andre ord: forfatteren har selv funnet at prosessdelen koster mer enn den gir.

## Hovedkonklusjon

**Rammeverket som helhet passer ikke oss, men fem–seks små mekaniske ting gjør det.** Malen er laget for en som starter fra null i en spillmotor og vil ha struktur å holde seg i. Vi har 1 000 filer, 800 commits på en måned, en vedtatt arbeidsmåte (`docs/utviklingsplan.md`) og dokumenter som alt gjør jobben deres GDD/ADR/epics/stories gjør: `docs/spesifikasjon.md`, `docs/systemer/`, `docs/planer/` med faser per økt, `docs/BACKLOG.md`. Utviklingsplanens D6 sier dessuten nei til faste agenter med titler, og deres egen måling støtter det.

Det vi **mangler**, og som de har, er håndhevelse: vi har ingen `.claude/settings.json` og ingen hooks. Reglene i `CLAUDE.md` og `/lever` følges bare så lenge økta husker dem. Et eksempel fra denne uka: `/lever` punkt 7 sier «ingen modellnavn i meldingen», men de tre siste commitene på arbeidsgrenen (8e1ae5a, ca7ff74, f3a6571) har alle en `Co-Authored-By`-linje med modellnavn. En commit-vakt hadde sagt fra. Det er den slags ting hooks er til, og det er det vi bør ta.

## Del A: det vi bør ta

Alt under er små filer i `.claude/`, skrevet for oss (deres skript er på 300–1 100 linjer hver fordi de støtter Windows, PowerShell, tre motorer og `project.yaml`; våre blir 20–40 linjer bash). Ingen spillkode, ingen tester. Hooks kjører også i skyøktene.

### A1. Sikring i `.claude/settings.json` (deny-liste)

Deres `settings.json` nekter `rm -rf`, `git push --force`, `git reset --hard`, `git clean -f`, `sudo`, og lesing og redigering av `.env`. Vi tar det samme. **Grunn:** arbeidsgrenen ruller rett ut til detstorebla.no, grenen er delt med tilbakemeldingsrutinen og regresjonsrutinen, og en tvungen push eller `reset --hard` i en økt med 1 000 filer er det dyreste uhellet vi kan ha. Koster 20 minutter, ingen risiko. Tilleggsregel for oss: nekt `git push` til `main` (vi publiserer fra arbeidsgrenen, og `deploy.yml` lytter på begge).

### A2. Øktstart-hook (`SessionStart`)

Deres `session-start.sh` skriver status inn i økta ved start **og etter hver komprimering** (hooken kjører igjen da). Det er svaret deres på det samme problemet utviklingsplanen beskriver: «hver komprimering mister detaljer». Vår utgave skriver fem ting: grenen og om den er arbeidsgrenen (`ccr-5e1ba2f4-pusvyd`) eller ei, de fem siste commitene, overskriftslinjene under «Spillarbeid som venter» i `docs/BACKLOG.md`, om hele kysten ligger i `tools/map/out/game/` (det avgjør hvilke tester som kan kjøres), og én linje om `dist/` er eldre enn `src/`. Den erstatter ikke lesingen av indeksen og systemdokumentet, men etter en komprimering ser økta hvor den er uten å spørre. Rundt 30 linjer.

### A3. Commit-vakt (`PreToolUse` på `git commit`)

Nekter en commit der `dist/`, `dist-vec/` eller `tests/out/` er staget, og nekter en melding med modellnavn (`Claude Opus`, `Claude Fable`, `Sonnet`, `Haiku`, `claude-…`). Begge står alt i `/lever` punkt 7; hooken gjør at de holder. Deres `validate-commit.sh` sjekker også designdokumenter og JSON-data, som vi ikke trenger. Rundt 30 linjer.

### A4. Lesevakt (`PreToolUse` på `Read`)

Deres `validate-read.sh` nekter en `Read` uten `offset` og `limit` av et dokument over 40 KB, og svarer med dokumentets overskrifter og linjenumre, så neste lesing tar bare seksjonen. Det er `CLAUDE.md`-regelen «les bare delen du trenger; slå opp i kodekartet og bruk grep» som håndhevelse i stedet for formaning. Våre største filer nå: `src/js/ui/phone/07-patch.js` 215 KB, `src/js/vessel3d.js` 138 KB, `src/js/core/03-simulation.js` 122 KB, `docs/systemer/kodekart.md` 107 KB, `src/js/core/05-vessels.js` 97 KB, `src/js/ui/10f-cloud.js` 79 KB, `src/js/core/10-gear.js` 71 KB. Vår utgave: grense 60 KB under `src/js/` og `docs/`, og svaret er seksjonsoverskriftene (`// ----------` og `function`-linjene for JS, `#`-linjene for Markdown) med linjenummer. En lesing med `offset`/`limit` går alltid gjennom, så ingenting kan sette seg fast. Rundt 40 linjer.

### A5. Historikk for ustabile tester

Deres `/test-flakiness` og `flaky-stats.sh` lager én tabell per test over flere kjøringer: antall kjøringer, grønne, røde, mønsteret (`PPFPP`). Begrunnelsen deres er god: «en ustabil test er verre enn ingen test, fordi den lærer oss å overse rødt». Vi har sju–åtte ustabile nå (`anchortest`, `fleet2test`, `drifttest` 6, `driftsplan2ui`, `driftsplan2test` S9, `turtest`, `selfcrew`, `saytest`), og backloggen beskriver dem som «rød én gang, grønn neste». Forslaget: `tests/run.py` skriver én linje per test per kjøring til `tests/out/historikk.tsv` (dato, gren, test, OK/FEIL, sekunder), og regresjonsrutinen tar med en tabell «x røde av y kjøringer» i PR-en sin. Da blir «ustabil» et tall, og rekkefølgen for rettingene (frys tilfeldigheten, mønsteret fra `caretest.py`) følger tallet. Skriptet deres kopieres ikke (det leser JUnit- og NUnit-XML); idéen er det som tas. Rundt 20 linjer i `run.py`.

### A6. Regel: se testen feile før den stoles på

Fra deres `test-standards.md`: «Every bug fix must have a regression test that would have caught the original bug, and you must watch it fail before you trust it.» En test som rettes eller skrives for en feil, kjøres mot koden **før** rettingen og skal være rød da; en test som bare har vært grønn, vet vi ikke om tester noe. Det er relevant for oss fordi E4 gjorde åtte røde tester grønne på én dag ved å endre testene, og fordi `heattest.console3d` alt står i backloggen som «svak sjekk». Én setning i `docs/systemer/testing.md` og i `/lever` punkt 2. Gratis.

### A7. Én sikkerhetsgjennomgang (kategoriene fra `/security-audit`, ikke skillen)

Skillen deres er bundet til motorene, men kategoriene er riktige for et online-spill med ekte penger: lagring som kan endres på klienten, det serveren stoler på fra klienten, dataeksponering, juksevektorer, avhengigheter. Mye er alt gjort hos oss (RLS på alle tabeller, skriving bare gjennom funksjoner, `sqltest` og `feedbacktest`; `docs/systemer/skyen-og-felles-verden.md`). Spørsmålene en gjennomgang bør svare på, med lesende agenter (D2) og funnene inn i `docs/BACKLOG.md`:

- Hva stoler `save_put2` og `tm_batch` på fra klienten? Kan en klient som endrer `kystfiske_v2` i localStorage melde leveranser, kilo eller penger som topplista og admin-trakten teller med?
- Haill for ekte penger: avgjøres kjøpet av Stripe-webhooken på serveren, eller av noe klienten sender?
- Hva i `src/data/cloud.json` og `10f-cloud.js` er offentlig med vilje, og er det alt?
- Avhengighetene i `build.mjs` og `tools/`: hvilke versjoner er låst?

Én økt, bare lesing og dokumentasjon. Rettinger blir egne oppgaver.

## Del B: det vi lar ligge, og hvorfor

- **49 agenter med roller og `/team-*`-skillene.** Utviklingsplanen D6: «faste agenter med titler som snakker sammen» koster mer enn det gir, hver overlevering mister detaljer, og en agent bekrefter hypotesen den får. Deres egen måling peker samme vei. Agentene våre er jobber (gjennomgang, søk, test i bakgrunnen), og det holder.
- **GDD, ADR, epics, stories, sprintplan, `sprint-status.yaml`, director gates, `/gate-check`.** Vi har spesifikasjonen, systemdokumentene, planene med faser per økt og backloggen. Samme funksjon, en brøkdel av vekten. «Fart foran finpuss» (01.10.2026).
- **`project.yaml`, `/settings`, `yaml-helper.sh`, `modes.rigor`.** Det er maskineri for å gjøre én mal brukbar for mange prosjekter. Vi er ett prosjekt; `CLAUDE.md` er konfigurasjonen.
- **Samarbeidsprotokollen «spør før hver skriving».** Hver agent skal spørre «May I write this to [path]?» før den skriver. Det er det motsatte av «Kjør på» og av én økt per oppgave. Vi spør ved valg (A/B/C), ikke ved hver fil.
- **Conventional Commits (`feat:`, `fix:`).** Våre meldinger er setninger på engelsk som sier hva og hvorfor, med tester og steder. De er bedre å lese enn prefikser.
- **Run-and-observe og «a parse check is not a run».** Riktig, og vi gjør det alt: skjermbilder i begge formater før noe meldes ferdig (Jonas 09.10.2026). Ingenting å hente.
- **`/patch-notes`.** Generisk oversettelse av git-loggen til spillerspråk. Vår `PATCH` i `07-patch.js` har strengere regler (aldri design, psykologi, penger) og skrives for hånd av økta. Bedre slik.
- **Regler per sti (`.claude/rules/*.md` med `paths:`).** Kunne flyttet regler fra `CLAUDE.md` som bare gjelder noen filer («ingen kode velger etter båttypens navn» for `src/js/`, «`src/data/` redigeres ikke for hånd», `buyGate` for kjøp). Men reglene lastes bare når en slik fil **leses**, ikke når en ny lages, og `CLAUDE.md` er alt nede i 81 linjer. Liten gevinst, ikke nå.
- **`/soak-test`-protokollen.** Punktene i backloggen 10.1 (konteksttapet på Galaxy A52s etter 11–17 minutter) og 10.5 («må måles på nettbrettet») er soak-tester, og vi har `tm_perf`. Men protokollen deres er en mal for mennesker som spiller i timer og noterer; det Jonas trenger, er at admin-dashbordet viser bildetakt mot tid og sted, som alt står i 10.5. Ingen ny mal.
- **Agentminne, agent-audit-hooks, `review-receipts.sh`, `/reverse-document`, `/tech-debt`, `/bug-triage`.** Vi har kodekartet, backloggen 10.7 og tilbakemeldingsrutinen. Nei.

## Del C: valgfritt

- **Statuslinje** (`statusline.sh`): én linje nederst i terminalen med kontekstbruk i prosent, modell og gren. Utviklingsplanen fase C sier at tegnet på et fullt vindu er at «økta begynner å lese de samme filene om igjen»; prosenten viser det før det skjer. Ti linjer bash. Gjelder bare når Jonas kjører Claude Code lokalt, ikke i skyøktene i appen.

## Rekkefølge og omfang

| Økt | Hva | Omfang | Risiko |
|---|---|---|---|
| 1 | A7 sikkerhetsgjennomgangen | 1 økt, bare lesing | ingen; funn blir oppgaver i backloggen |
| 2 | A1 deny-liste, A2 øktstart, A4 lesevakt, A6 regelen (én `settings.json`, to skript, to setninger i doku) | 1 økt, rundt 1 time | ingen for spillet; en hook som selv feiler, slipper verktøyet gjennom (exit 0) så ingenting låser seg |
| venter | A3 commit-vakt og A5 historikk i `run.py` | 1 økt til sammen | tas den dagen en commit eller en ustabil test faktisk koster noe |

## Valg for Jonas

Jonas ba økta svare selv (28.10.2026). Svarene, med grunnen:

1. **Hooks og sikring (A1–A4, A6) i én økt?** A: alle fem. B: bare A1 og A2. C: nei. **Svar: A1, A2, A4 og A6; A3 venter.** Øktstarten og lesevakten sparer noe hver dag (færre økter på feil gren, færre komprimeringer), deny-lista er billig forsikring for en gren som ruller ut til detstorebla.no, og A6 er to setninger. Commit-vakten tas den dagen en commit faktisk går galt.
2. **Historikk for ustabile tester (A5)?** A: ja. B: nei. **Svar: B, venter.** Ingen ustabil test har kostet en feil i spillet ennå.
3. **Sikkerhetsgjennomgangen (A7)?** A: nå. B: som del av lanseringen. C: nei. **Svar: A, først av alt.** Det er den eneste som kan ramme spillerne og pengene (topplista, gjester, haill).
4. **Statuslinjen (del C)?** A: ja. B: nei. **Svar: B.** Jonas kjører øktene i appen og tester på nettbrettet, så linjen i terminalen ville ikke blitt sett.

## Status

- 28.10.2026: vurderingen skrevet. Jonas spurte hva som ville merkes i ettertid, og ba økta svare på valgene selv. Svar: 1 A1+A2+A4+A6 (A3 venter), 2 B, 3 A, 4 B. Rekkefølge: A7 først, så hook-økta. Venter på «kjør på».
