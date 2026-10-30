# Visjon, arbeidsmåte og status

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

# Det Store Blå (Kystfiske) – overlevering fra chat til Claude Code

> Spillet heter **Det Store Blå** fra 04.10.2026 (brukerens valg, domenet detstorebla.no). Navnet står i `<title>`, lasteskjermen, toppstripa (`T.no.title`, `T.en.title`) og PWA-manifestet. Et engelsk navn for lansering i utlandet er ikke valgt. Repoet, lagringsnøklene (`kystfiske_v2`) og andre interne navn heter fortsatt kystfiske og skal ikke endres. Sjekklista for lanseringen står i `docs/lansering.md`.

Skrevet 29.09.2026 ved flytting fra claude.ai-chat til Claude Code. Dokumentet samler beslutninger, regler, tall og arbeidsmåte som ikke står i koden. Les det sammen med `docs/spesifikasjon.md` (fiskerisystemet) og koden.

- Spillet kjører på detstorebla.no (utrulling fra GitHub Actions ved push, se `CLAUDE.md`, Publisering). Artifacten https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f er ikke oppdatert siden 03.10.2026: siden er 23 MB og artifacten tar høyst 16 MB (Jonas 08.10.2026: la den stå).
- Spesifikasjon (Claude Doc): https://claude.ai/code/artifact/0ca28240-d946-46b1-802b-b4b511e9398d
- Spillfila: én selvstendig HTML-fil, `kystfiske-prototype.html` (~4,3 MB, all kart- og terrengdata innebygd som base64).

## 1. Visjon og sjanger

- **Sjanger:** Tycoon-/managementsimulator med idle-elementer for kystfiskeflåten. «Fra jolle til rederi»: spilleren starter med en 19-fots skiff og fiskestang i Finnsnes/Senja og bygger et rederi med en flåte, driftsplaner, skippere og kvoter.
- **Stigen:** kystfisker (skiff, egne hender) → sjarkeier (større båt, mannskap, kvote i lukket gruppe) → småreder (2–3 båter, ansatte skippere, driftsplaner) → reder (flåte, ulike redskap og felt) → verdikjede (mottak, isanlegg, verksted) → imperium (nye regioner, konkurranse, topplister).
- **Idle-løkke:** Hver båt har skipper og driftsplan. Flåten fisker, leverer og fyller drivstoff og is mens spilleren er borte. Spilleren kan alltid gå om bord og ta roret selv.
- **Realisme er kjerneverdien.** Regler, priser, kvoter og båtoppførsel skal være så ekte som mulig. Forenklinger skal være bevisste og dokumenterte. Jonas er fra Finnsnes og har maritim bakgrunn, så han merker urealistiske detaljer.
- Målgruppe: voksne.

## 2. Arbeidsmåte og preferanser

- Kommuniser på **norsk**. Kodekommentarer og identifikatorer er på engelsk.
- Jonas spiller og tester på **nettbrett** (Android). UI må fungere på berøringsskjerm i stående og liggende format.
- Ved større funksjoner: **legg fram en konkret plan og vent på klarsignal**. Når Jonas sier «snakk uten å bygge» eller «vent til jeg gir klarsignal», skal ingenting bygges.
- Når han sier «kjør på», bygg, test og lever.
- Etter hver endring: kjør regresjonstestene, og lever en fungerende versjon. I chatten ble fila publisert som artifact hver gang.
- Vær ærlig om feil. Si fra når en test er svak, når noe er antatt, eller når en regel er usikker.
- Sjekk regelverk mot kilder (Lovdata, Fiskeridirektoratet, Råfisklaget) før regler bygges inn, og oppgi kilden.

## 3. Status nå

**Ferdig og publisert (i rekkefølge):** fiskerisystemet, redskapsstige og animasjoner, tempo 1:6, lukket gruppe-kjøp med lån, «Neste mål», haill, pub og verkstedovertid, kveitefiske med fredning, NPC-kaiplasser og trykkprioritet i kartplotteren, jevnere båtbevegelse, «Kaffe på kaia», fiskekar, rengjort bunn, bestillinger, klær og kulde, mannskapssystemet med Mannskapsbørs, **flåtemodell fase 1**, **fase 2** (flere båter) og **fase 3** (Rederiappen). Fase 2 og 3 er bygget i Claude Code.

**Etter spilltest 1 (bygget 01.10.2026, ikke publisert ennå):** feilrettinger A1–A15, juksamaskin = 2 × håndjuksa, innloggingsbonus i stedet for «Kaffe på kaia», riktig tid (6×) med nedtelling i ekte tid, butikken «Fiskeutstyr», rute-editor med WP-navn, angre og dra, autoruta «Følg leia» og den obligatoriske veiledningen «Første tur». Planen står i kapittel 9 under «Etter spilltest 1».

**Spilltest 2 (01.10.2026):** én agent, 384 handlinger fra nytt spill. Se `docs/playtest/rapport-2.md`.

**Ekkolodd-varmekart (bygget 01.10.2026, ikke publisert ennå):** Kartplotteren viser hvor fisken står i en sirkel rundt båten, ut fra ekkoloddet eller sonaren. Fisken trekker jevnt, bestanden vokser helt tilbake, og første tur har en ekte skreiflekk. Ekkoloddvinduet vises i plotteren, og sonaren er nytt utstyr. Se 5.1, 5.3, 5.14 og 5.16.

**Fartøystigen (bygget 01.10.2026, ikke publisert ennå):** 13 båttyper (plastsjarken på 29 fot, den eneste uten Blender-modell, gikk ut 17.10.2026; `docs/batplan.md`) fra skiffen til havfiskeflåten med fullt datablad, 3D-modeller fra et byggesett (`vessel3d.js`), Båthandelen med faner, sideriss og visning i 3D, blad B, lån som innfris ved salg, toppfinansiering fra Innovasjon Norge og stigen i «Neste mål». NPC-flåten bruker de samme modellene. Se «Fartøystigen» i kapittel 9.

**Publisert 03.10.2026 (artifactversjon 64):**
- alt over
- kystplanens K1–K10: hele kysten med detalj i 3D og sjøkart, Autonav overalt, og tidevann og sol der båten er
- UI-runden for kartplotteren og 3D (5.15)
- «Fyll tanken» i Admin

Siden og 425 kartfiler (195 MB) gikk ut i fire publiseringer. Levering og bunkring finnes fortsatt bare i Senja-havnene.

**Publisert 03.10.2026 (artifactversjon 68):**
- alt over
- rettingene etter spilltesten 03.10.2026: Husøy, ytelse i 3D, kartplotteren i fliser, bro-visningen og stille sjø
- Kartverkets dybde langs hele kysten (kart-4, 4.8b)
- søvn på den felles klokka, brovaktsalarm og manuell styring (5.19, 5.22)
- lys om natta, kino, lyd, måker og halerne fra Blender (5.23–5.26)

Siden og 424 kartpakker (230 MB, 321 nye) gikk ut i fire publiseringer, med de 321 gamle fjernet. Regresjonen var grønn, unntatt to tester som feilet på testens egen venting og tidsgrense: `sea3d` og `vessel3d`. Begge er rettet i testene etterpå.

**Neste:** rettingene etter spilltest 2, med prioritet i rapportens siste del. Deretter K11 (nettstedet og PWA) og innholdet sone for sone, hver med eget klarsignal, og fase 4 i flåteplanen.

## 12. Innhold i overleveringspakken

- `OVERLEVERING.md` (dette dokumentet) og `README.md`.
- `kystfiske-prototype.html`: siste publiserte versjon (fase 1).
- `tests/`: alle testskriptene.
- `scripts/`: alle oppdateringsskriptene fra chatten (`patch_*.py` og lignende), som historikk for hvordan funksjonene ble bygget.
- `data/processed/`: behandlede datafiler (base64 og json) som er bakt inn i HTML-fila.
- `data/osm2/`: råkilder fra OpenStreetMap for kart.
- `transcripts/`: fullstendige utskrifter av de fire tidligere chatøktene og `journal.txt`, med hele historikken før denne økta.

Kartrastere i `.npy`-format (over 300 MB) er ikke med. De kan lages på nytt fra OpenStreetMap-kildene, og resultatet ligger allerede i HTML-fila.
