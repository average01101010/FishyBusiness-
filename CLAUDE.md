# Det Store Blå (Kystfiske)

Et kystfiskespill langs hele norskekysten. Spillet heter **Det Store Blå** (detstorebla.no), også i den engelske utgaven. Repoet, lagringsnøklene (`kystfiske_v2`) og andre interne navn heter fortsatt kystfiske og **skal ikke endres** (lagringene ville forsvinne). Jonas skriver norsk; svar på norsk. Koden og kommentarene i den er på engelsk.

Dette er reglene, én linje hver. **Bakgrunnen (Jonas' ord, datoene, grunnene) står i `docs/regler-bakgrunn.md`**; slå opp der når en regel er uklar. En ny regel får den korte linja her og bakgrunnen der.

## Les først

- `docs/INDEKS.md`, så dokumentet i `docs/systemer/` for systemet du skal endre, og `docs/BACKLOG.md` («Spillarbeid som venter» øverst med `offset` og `limit`, resten med `grep`; øktstarten viser de tolv øverste).
- Les ikke mer enn oppgaven trenger. `view3d.js` og `05-phone.js` er delt i `src/js/view3d/` og `src/js/ui/phone/`: slå opp i `docs/systemer/kodekart.md`, bruk `grep`, les med `offset` og `limit`.
- Spesifikasjonen: `docs/spesifikasjon.md`. Arbeidsmåten: `docs/utviklingsplan.md`. Gamle kapittelnumre: `docs/systemer/gamle-numre.md`.

## Spillet

- **Online-spill med én felles verden og én felles klokke.** Tiden går når skjermen er av og spillet er lukket (`WCLOCK`, `catchUp`). Ingenting stopper tiden eller driften fordi en skjerm er av, en fane sover eller en enhet står på pause. Bare en side som ikke har spillet (én enhet styrer om gangen), er på pause, og den sender ingenting.
- **Nasjonalt.** Alt som legges inn eller endres, gjelder hele kysten fra start. Senja er bare et eldre, mer detaljert utsnitt.
- **Grafikken er nesten det viktigste.** Senk ikke kvaliteten uten at målinger viser at vi må. Ytelse hentes først uten å endre utseendet. Lagging og feil skal heller ikke ødelegge opplevelsen.
- **Handelssteder:** man handler tre steder og bare der: utstyrsbutikken, fiskemottaket og verftet. Fars naust (Vangshamn) er bare hjem; rorbuene selger ingenting. Alt nytt følger `docs/handelssteder.md`, som også har reglene for plassering (minst 1,5 km fra hverandre, i ly, ekte plasser, navn etter stedet, eget kartikon).
- **Én kjøpslogikk:** det som kjøpes, må henge sammen med det spilleren eier og passe båten. Regelen står ett sted (`buyGate` i `core/10-gear.js`, `equipFits`); kjøpsfunksjonen og knappene spør den.
- **Ingen ekte firma- eller organisasjonsnavn uten skriftlig avtale.** Alt heter etter stedet. Et ekte navn kommer bare gjennom sponsordataene i databasen, merket som samarbeid (`docs/planer/butikker-og-sponsorer.md`). Offentlige kilder kan nevnes. Båttypenes forbilder står bare i kommentarer og doku.
- **Båtmodeller:** bare utsiden. Ingen innredning, ingen animasjoner i båthandelen. Ingen kjøpbart redskap modellert inn, bare plassene (`hauler`, `reel`, `work`); skipets egne systemer (vinsjer, kraner, galge) er skrog og står.
- **Sjekk regelverk mot kildene** (Lovdata, Fiskeridirektoratet, Råfisklaget) før det bygges inn, og oppgi kilden.
- **Android-nettbrett med berøring**, stående og liggende.
- Tallene i spesifikasjonen og dokumentene er startverdier som justeres i spilltesting.

## Slik går en økt

- **Én økt per oppgave.** Start: indeksen, systemdokumentet, backloggen. Slutt: `/lever` og `/okt-slutt`. Det som avgjøres underveis, skrives i systemdokumentet samme dag. Agenter får én avgrenset jobb, aldri to i `src/js/` samtidig.
- **Fart foran finpuss:** endringene inn raskt, finpuss samlet etterpå.
- **Større funksjoner med uklare valg:** kort plan, vent på klarsignal (`/planlegg`). Enkle endringer bygges rett. «Snakk uten å bygge» = bygg ingenting. «Kjør på» = bygg, test, lever.
- **«Ferdig når» før bygging.** Hvert steg har tre til fem punkter som kan sjekkes, øverst i startmeldingen (`docs/planer/start/<steg>.md`). Mangler de, skriver økta dem fra planen før den bygger noe, og viser dem til Jonas i første melding (uten å vente på svar). Steget er ferdig når alle holder.
- **Økta lukker det den åpner: lukkerunden.** Et steg er ferdig når ingenting står igjen etter det, ikke når resten er skrevet ned. Før `/lever` lister økta alt den ville kalt svakt, antatt, ikke målt, ikke rettet eller gjenstående, og lukker hvert punkt:
  1. **Antatt:** slå opp kilden, mål eller skriv testen, og bygg det svaret krever.
  2. **En feil økta finner, også utenfor steget, rettes i samme økt.** Unntak: filer en annen økt eier nå («Øktene som kjører» i køen) røres ikke, og feilen skrives i den øktas rad; ekte penger og `src/legal/` går som PR til Jonas.
  3. **Et valg bare Jonas kan ta:** en økt han har startet, spør straks med spørsmålsverktøyet (A/B/C, én anbefaling) og bygger videre på resten. Arbeidsrutinen bygger sin egen anbefaling når valget kan gjøres om, og sier hva den valgte og hvordan det snus; valg som ikke kan gjøres om (ekte penger, juss, lagringer og spillerdata), venter på ham.
  4. **Det bare Jonas kan gjøre** (se på nettbrettet, måle på en enhet, bilder, migrering på testprosjektet): `docs/spill-dette/<steg>.md` og én linje i meldingen, ikke et backlogpunkt.
  5. **Rekker ikke økta alt,** er steget `pågår` i køen med hvor langt det kom, og samme steg fortsetter. Resten blir aldri et nytt steg eller backlogpunkt.
  Observasjoner og ideer skrives ikke ned som arbeid. Et nytt åpent punkt i backloggen har `**Åpent fordi:**` med `Jonas`, `annen økt`, `ekte penger eller juss` eller `utenfor repoet`, og hva som lukker det. `python3 tools/plan/lukket.py` er rød når grunnen mangler.
- **Uavhengig kontroll før levering** (`/kontroll`): når et steg har endret `src/`, får en fersk agent endringen og «Ferdig når»-punktene, ikke øktas egen oppsummering, og leter etter det som mangler eller er galt. Det den finner, rettes i økta. Ikke for rene dokumentendringer.
- **Meldingen til Jonas** slutter med «Åpent etter økta: ingenting», eller hvert åpne punkt med grunnen. Vær ærlig om svake tester og usikre regler; ingen pynt.
- **Patchnotes** (`PATCH` i `src/js/ui/phone/07-patch.js`): en endring som merkes i spillet, får en oppføring øverst eller en linje i den nyeste, kort, norsk og engelsk. **Aldri** taktisk design, psykologi, ekte penger, 💎, priser, butikk, registreringsgaver eller hvorfor noe er laget slik.
- **Ingen videoopptak**, bare skjermbilder. Trengs et klipp, sender Jonas det.
- **UI-endringer ses i begge formater** (800×1280 og 1280×800) før de meldes ferdige. Lange løp (`tut.py`) i begge formater bare når UI-et er flyttet eller endret; ellers `KYST_TUT_ONE=liggende`.
- **Stikkprøver langs kysten** (`/stikkprove`): en retting som kan gjelde hele landet, prøves på minst tre andre steder (sør, midt, nord). Svaret sier hvor. Unntak: når du er helt sikker på at den virker overalt, og sier hvorfor.

## Køen og rutinen

- Det som skal bygges, står i rekkefølge i `docs/planer/koen.md` (bare det åpne; resten i `koen-arkiv.md`), startmeldingene hele i `docs/planer/start/<steg>.md`. En økt Jonas starter, merker steget `pågår` før den begynner, og skriver hel startmelding for neste steg når den slutter.
- **Arbeidsrutinen** (`tools/plan/RUTINE.md`, hver time) tar første klare steg, bygger det og ruller ut til testutgaven selv når porten der holder. Skjermbildene fra hver økt går til Jonas til slutt.
- **Ingen tak på steg som venter på at Jonas ser på dem** (fjernet 12.11.2026). Rutinen og koordinatoren bygger videre uansett hvor mange filer som står i `docs/spill-dette/`; `python3 tools/plan/venter.py --liste` samler dem i `SAMLET.md`.
- **Porten for de første brukerne er frossen** (P1–P6 øverst i køen tas først, så stegene over lanseringslinja; kan ingen av dem tas, tar rutinen stegene under linja i rekkefølge). Ingen økt legger noe til i porten eller over lanseringslinja. Et steg som blir for stort, kuttes til det som trengs, og deles ikke i flere steg over linja.
- **Ekte penger** (`ui/10i-shop.js`, `ui/10q-buymoment.js`, Stripe, `shop_*`) **og `src/legal/`** rulles aldri ut og slippes aldri uten at Jonas har sett PR-en.
- **Hooks og deny-liste** (`.claude/settings.json`, `.claude/hooks/`): nekter `rm -rf`, `sudo`, `git push --force`, push til `main`, `git reset --hard`, `git clean -f` og `.env`. Lesevakten nekter en `Read` uten `offset` og `limit` av en `.md` eller `.js` over 60 KB under `docs/` og `src/js/`. Commit-vakten nekter modellnavn i meldingen og `dist/`, `dist-vec/`, `tests/out/` staget. `hooktest` dekker dem.

## Tester

- **Bare de testene som er strengt nødvendige.** Under byggingen: `node --check`, bygg, `python3 tests/run.py changed` (testene som dekker endrede filer, uten 3D). Dokumentendringer kjører ingen tester. Én commit per endring.
- **Spør før hver test:** dekker den en fil jeg har endret, og kan endringen min få den til å feile? Hvis nei, kjøres den ikke. En test du mener ikke er relevant, kan droppes, også når en startmelding nevner den; meldingen og commiten sier hvilke og hvorfor. Tabellen over de lange testene: `docs/systemer/testing.md`.
- **Full regresjon** (`/regresjon`, rundt en time) bare før publisering.
- Kjør aldri samme test to ganger for å lese utskriften annerledes (loggene: `tests/out/logs/`). Lange tester går i bakgrunnen. Aldri flere 3D-tester samtidig.
- **Enhetstester av kjernen:** `node tests/unit/run.mjs`. En endring i `src/js/core/` er ikke ferdig før de er grønne, og en ny eller endret ren funksjon får en sjekk i samme commit.
- **Se testen feile før den stoles på:** en test skrevet eller rettet for en feil, kjøres mot koden før rettingen og skal være rød da. Commit-meldingen sier hvordan den ble sett rød.
- Playwright i Python i `tests/`, mot `dist/index.html` over HTTP (bygg først; `KYST_DIST=<mappe>` for et annet bygg). Oppsett: `pip install playwright==1.63.0`. Kjør med `tests/run.py`; skriptene skriver verdier i stedet for assert, så les utskriften.
- Testene kjører med frø (`seed=1`; `KYST_SEED=2` gir et annet kast, `0` slår av) og med roen av (`ro0`; bare `tut.py` og `roetest.py` har roen). En rød test er en feil, ikke et dårlig kast. En test som lager adressen selv, tar med `ro0`.
- Nye tester: `await boot(pg)` fra `_env.py`, inn i `D3` eller `LITE` i `run.py`. En ny fil i `src/` legges i `COVER` i `run.py`. Trykk i 3D sendes som CDP-berøring; berøring og drag i kartet trenger `--disable-gpu-compositing`.
- Det som må stemme: `trip2.py` ender med `"st":"port"`, `tut.py` med `"tut": 0`, `dbg23o.py` skriver ingenting, sjekklinjer starter med `OK`, sidefeil er `[]`.

## Bygg

- `node build.mjs` setter `src/` sammen til `dist/index.html` og kopierer kartpakkene til `dist/map/` (hele kysten når `tools/map/out/game/` finnes, ellers Senja). `KYST_DIST=<mappe>` bygger dit, `KYST_VEC=1` tar med vec-pakkene, `KYST_ONE=1` gir én fil. `dist/` er ikke i git.
- `node --check <fil>` på hver JS-fil du endrer, og bygg etterpå. Test alltid `dist/index.html` over HTTP (`python3 tools/serve.py`); filene i `src/` kan ikke åpnes direkte.
- `python3 tools/docs/kodekart.py` skriver kodekartet (`/lever` gjør det). Datarørledningene: `docs/systemer/datarorledninger.md`.

## Koden

- `src/index.html` er malen: `@include(sti)` byttes med fila; JSON i JS som `/*@include(sti)*/null`. Alt i `src/js/core/` og `src/js/ui/` havner i samme `<script>` i malens rekkefølge og deler globalt skop. **En ny fil må inn i malen på riktig plass.** `core/00-proj.js` har `'use strict'` og kommer alltid først.
- `vessel3d.js` og `view3d.js` (`G3`) er egne `<script>`. Delene i `src/js/view3d/` og `src/js/ui/phone/` er stykker av én funksjon: de kan ikke `node --check`-es alene, bare bygges.
- **Ingen kode velger etter båttypens navn** (`=== 'sjark'`). Bruk feltene i `VESSELS` (`vesseltest.py`).
- Blender-modellene lages av skriptene i `tools/` (`/blender`, `pip install bpy==4.5.4`) til `src/data/*.b64`; bygget legger dem ut som `data/<id>-<hash>.bin`, og `bootData` henter dem. Referansetegninger legges ikke i repoet, bare målene.
- `src/data/` redigeres ikke for hånd. Rasterkartene leses bare gjennom lasteren i `core/01b-mapdata.js` (`rcell`, `rbil`, `rbilM`); en blokk som ikke er lastet, gir en feil og ingen reserveverdi.
- Rammen er UTM sone 33 i km: x = (E + 250 km)/1000 østover, y = (8 050 km − N)/1000 sørover (`natP`/`natLL`). Sann kurs = rutenettskurs + γ (`gridGamma`, `trueDeg`): det som vises, er sann retning; det som regnes, går i rutenettet. Senja-dataene føres inn med `LG`/`LGa`/`LGm`; nytt skrives med `P(lat, lon)`. Se `docs/systemer/kart-og-terreng.md`.
- Siden er rundt 6 MB; modellene, bildene og Senja-byggene ligger som hashede filer i `data/` og hentes ved oppstart (`ui/11-boot.js`).

## Gemini som andre øyne

- **To verktøy, og de er til det som ses:** `ask_gemini` vurderer og `generate_game_asset` lager bilder. Bruk dem for **UI, UX, GUI og spillgrafikken** (HUD, instrumenter, paneler, ikoner, 3D-bildet, vann, lys, vær, modeller). De er ikke en generell spørretjeneste: kode, regler og spilldata avgjøres ikke der.
- **Arbeidsdelingen:** Claude eier koden (arkitektur, tilstand, refaktorering, implementering). `ask_gemini` leder vurderingen av det som **ses og det som skjer over tid**: bevegelse i klipp, og bilder av det som er tegnet. Den erstatter ikke at økta ser på skjermbildene selv i begge formater, og ikke `/kontroll`.
- **Verktøyene:** MCP-serveren `gemini-reviewer` (`.mcp/gemini-server.mjs`, registrert i `.mcp.json`). `ask_gemini` spør `gemini-4-hydrogen` og bare den, med `prompt`, `filePaths` (bilder inline, video lastet opp, kode og tekst lest inn under stien) og `videoFps`. `generate_game_asset` spør `gemini-3-pro-image` og bare den, med `prompt`, `outputPath`, `aspectRatio`, `imageSize` og `referencePaths`. Krever `GEMINI_API_KEY`; serveren kjører `npm ci` selv når `node_modules/` mangler. Er verktøyene ikke lastet i økta: `node .mcp/gemini-server.mjs --ask "<spørsmål>" [--fps N] <filer>` og `--image "<beskrivelse>" --out <sti> [--aspect 16:9] [<referansebilder>]`.
- **Et klipp går alltid til Gemini først.** Når Jonas har sendt et opptak (`.mp4`, `.webm`, `.mov`), sendes det til `ask_gemini` før økta konkluderer om fysikk, bølgebevegelse, animasjoner, kameraføring eller hakking: Claude ser ikke tidsaksen. Regelen om ingen videoopptak står; klippene kommer fra Jonas.
- **Klipp sendes med `videoFps` 10** (standarden i serveren), 15–24 for det som går fort (krusninger, hakking, takten i sjøen). Uten det ser Gemini ett bilde i sekundet. Hvert bilde koster, så et langt klipp kortes ned til stedet det gjelder før det sendes.
- **Visuell kontroll etter større endringer** i WebGL-shadere, vannflata, refleksjoner, lys, vær, 3D-modeller eller UI og HUD: skjermbildene (`tests/out/`, `docs/okter/`) sendes til `ask_gemini` sammen med koden som tegner dem, før steget meldes ferdig. Ved en endring: før- og etterbilde fra samme sted, klokkeslett og frø. Småendringer trenger det ikke.
- **UX:** en ny eller endret flyt sendes som skjermserie i rekkefølge, i begge formater, med spørsmål som kan svares feil: «Hva tror du skjer når jeg trykker her?», «Hva er det viktigste på skjermen?», lesbarhet, kontrast og trykkflater for en finger.
- **Før større endringer i WebGL-shadere eller vannfysikken** (`src/js/view3d/`, bølgene, skummet, refleksjon, båtens bevegelse i sjøen): send planen og de berørte filene til `ask_gemini` for en sjekk av arkitektur, ytelse (tegnekall, presisjon, mobil-GPU) og aliasing (flimmer, moiré, kanter langt unna).
- **Sparring før tung bygging:** nye mekanikker, ekkolodd og instrumenter, balansering og effekter kan prøves på `ask_gemini` før detaljkoden låses. Gemini kjenner ikke reglene her: det den foreslår, veies mot `CLAUDE.md`, og valgene er fortsatt Jonas' (`/planlegg`).
- **Slik spørres det:** materialet og kildefilene i samme kall (bildet eller klippet sammen med skyggeren eller fysikken), så det som ses, kan kobles til matematikken. Spørsmål som kan vise seg å være feil («Vandrer småbølgene i vindretningen, eller koker de på stedet?», «Er det specular aliasing i solstripa?»), aldri «ser dette bra ut?». Be om hvor i bildet eller når i klippet, og om den ser det eller antar det.
- **Uenighet:** ser Gemini noe som ikke synes i koden eller tallene, er det et symptom, og årsaken letes opp i renderingen før det avfeies. Det den sier om koden, er en påstand og sjekkes mot koden før noe bygges på den. Svaret er en annen mening, ikke fasit.
- **Meldingen til Jonas** sier hva Gemini ble spurt om, hva den fant, og hva økta gjorde med det, også når det ble avfeid og hvorfor.
- **Bilder lages med `generate_game_asset`** der spillet bruker rasterbilder: illustrasjoner (som lastebildene og brevet), bakgrunner, papir- og panelteksturer, og **skisser** til ikoner, knapper og HUD. Ikonene, knappene, panelene og HUD-en i spillet er fortsatt CSS og SVG (skarpe på nettbrettet i begge formater, følger fargene og lys og mørk, få byte): en skisse derfra tegnes som SVG. 3D-modellene lages fortsatt i Blender.
- **Stilen hentes fra spillet, ikke fra adjektiver:** send et skjermbilde eller et bilde spillet alt har som `referencePaths`, og fargene fra `src/styles.css` i prompten. Aldri tekst, logoer eller ekte navn i bildet (serveren legger det til i hver prompt); se etter det likevel.
- **Veien inn i spillet:** utkastene skrives til `tools/ui/out/` (ikke i git). Økta ser på bildet selv, og Jonas ser det før det brukes. Så gjør et skript i `tools/` det om til WebP i `src/data/<navn>.b64` som de andre bildene (`tools/brand/loader.py`, `tools/opening/brev.py`). Aldri rett i `src/data/`; det finnes ingen `public/`.
- **Begge verktøyene koster ekte penger** (forhåndsbetalt, 50 kr lagt inn 13.11.2026): ett `ask_gemini`-kall per steg med alt materialet i samme kall; ett bilde per behov i 1K, høyst to nye forsøk. Meldingen til Jonas sier hvor mange kall og bilder økta brukte. Er kontoen tom eller kvoten brukt opp, sier meldingen det, og steget stopper ikke for det.
- Send ingenting til Gemini som ikke allerede er i repoet eller i skjermbildene og klippene: ikke `.env`, nøkler, spillerdata eller noe fra databasen.

## Engasjement og inntekt

Spillet skal tjene penger. Grunnlaget og arbeidslista står i `docs/engasjement.md`. I hver avgjørelse gjelder:

- **Haill for ekte penger beholdes.** Luksushaill bare som gave ved registrering og som takk for tilbakemelding.
- **Krokene er ekte.** Hver ny funksjon svarer på: hva gir den spilleren å gjøre nå, i dag og denne uka?
- **Betaling korter ned ekte avstander, aldri oppdiktede.** Aldri ventetid, energi eller trøtthet lagt inn for å selge, og aldri en ventetid forlenget for å selge mer.
- **Alt kan nås uten å betale**, med tid og dyktighet. Innholdet legges der betalingen blir fristende av seg selv, og belønningen står i forhold til turen uten trim.
- **Nye ting starter aldri på null** (endowed progress).
- **Variabel belønning kommer fra sjøen.** Ingen tilfeldig utfall for ekte penger: ingen loot boxes, gacha eller pakker med ukjent innhold.
- **Pris i kroner med 💎**, ingen fiktiv valuta, ingen nedtelling i butikken.
- **Ingen straff for fravær.** Push bare om egen båt og eget redskap, med tak etter bruk (`docs/push-plan.md`).
- **Sosialt er additivt.** Ingen reklame eller annonsenettverk; sponsing bare etter `docs/planer/butikker-og-sponsorer.md`.
- **Haill gir plass på topplista, men synes aldri** for andre, i noe som deles.
- **Kosmetikk er varig og synlig.** **Gjester kan ikke kjøpe.** 13-årsgrensen står.
- **Mål og se:** hver engasjementsendring skal kunne leses av i trakten i admin-dashbordet før neste vurderes.

## Publisering

- **En push til arbeidsgrenen som endrer `src/`, går til `test.detstorebla.no`**, ikke til spillerne. «Rull ut» betyr «til testadressen»: sjekk at kjøringen «Appen på Hetzner» er grønn og at `https://test.detstorebla.no/version.json` har den nye versjonen og `"ch":"test"`.
- **detstorebla.no endres bare av et slipp:** `main` flyttes fram av workflowen «Slipp», aldri av en økt (deny-lista) og aldri med fletteknappen. Rutinen slipper høyst én gang i døgnet (03–05 norsk tid) når porten og lagringsporten holder; Jonas kan si «slipp nå». Ekte penger og `src/legal/` krever merkelappen `jonas-har-sett`, som bare Jonas setter. `python3 tools/release/slipp.py` lager slipp-PR-en (`--dry` viser den). En økt som mener noe må ut nå, sier det til Jonas.
- **Migreringer:** først på testprosjektet (`xlrjbqdhdymcdjkqkulx`), som Jonas kjører for hånd før pushen som trenger den (si fra til ham; Supabase-verktøyene i en økt går mot produksjonen). I produksjon rett før slippet som tar med koden, aldri etter og aldri ved utrulling til testadressen.
- Artifacten oppdateres ikke og skal ikke slettes. GitHub Pages har bare flyttesiden.
- Alt står i `docs/systemer/publisering.md` og «Slippet» i `tools/plan/RUTINE.md`.
