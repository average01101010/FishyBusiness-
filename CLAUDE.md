# Kystfiske

Et kystfiskespill fra Senja som kjører som én selvstendig HTML-side, publisert som artifact. Brukeren skriver norsk; svar på norsk. Koden og kommentarene i den er på engelsk.

**Les `docs/OVERLEVERING.md` før du endrer spillet.** Den har visjonen, arbeidsmåten, arkitekturen, alle systemene med tall, regelverket, kjente problemer og flåteplanen. Spesifikasjonen for fiskerisystemet ligger i `docs/spesifikasjon.md`.

## Arbeidsmåte

- Ved større funksjoner: legg fram en konkret plan og vent på klarsignal. «Snakk uten å bygge» betyr at ingenting skal bygges. «Kjør på» betyr bygg, test og lever.
- Kjør regresjonstestene etter hver endring.
- Vær ærlig om svake tester, antakelser og usikre regler. Sjekk regelverk mot kildene (Lovdata, Fiskeridirektoratet, Råfisklaget) før det bygges inn, og oppgi kilden.
- Brukeren tester på Android-nettbrett, så UI må fungere med berøring i både stående og liggende format.

## Bygg og sjekk

- `node build.mjs` setter sammen `src/` til `dist/index.html`. `dist/` er ikke i git.
- `node --check <fil>` på hver JS-fil du endrer, og bygg etterpå.
- Filene i `src/` kan ikke åpnes direkte i nettleseren. Test alltid `dist/index.html`.
- `docs/OVERLEVERING.md` kaller spillfila `kystfiske-prototype.html`. Her er det `dist/index.html`, bygget fra `src/`.

## Tester

- Playwright-skript i Python i `tests/`. De tester `dist/index.html`, så bygg først. Skjermbilder havner i `tests/out/`.
- Oppsett: `pip install playwright==1.56.0`. Nettleseren ligger allerede i `/opt/pw-browsers`.
- Kjør med `python3 tests/<navn>.py`. Skriptene skriver ut verdier og feil i stedet for å bruke assert, så les utskriften.
- Regresjon: `trip2.py` (hel tur, skal ende med `"st":"port"`), `tut.py` (veiledningen, skal ende med `"tut":0`) og `dbg23o.py` (WebGL, skal ikke skrive ut noe). Alle skal gi `[]` for sidefeil.
- Endringer som berører flåten, salget, driftsplanen eller telefonappene: kjør også `fleet2test.py` og `fleet3test.py`. Endringer i havnene, fortøyningen eller leveringen: `harbourtest.py`, `moortest.py`, `landtest.py` og `bunkertest.py`. Alle sjekklinjene skal starte med `OK`.
- Funksjonstestene og triksene for testing står i kapittel 11 i overleveringen.

## Slik er koden satt sammen

- `src/index.html` er malen. `@include(sti)` byttes ut med filen, og i JS skrives JSON-data som `/*@include(sti)*/null`.
- Alle filene i `src/js/core/` og `src/js/ui/` havner i samme `<script>`, i rekkefølgen malen viser. De deler globalt skop, så en ny fil må legges inn i malen på riktig plass.
- `'use strict'` står øverst i `src/js/core/01-world.js` og gjelder hele det første skriptet. Den filen må derfor alltid komme først.
- `src/js/view3d.js` ligger i et eget `<script>` og eksponerer `G3`.
- `src/data/` inneholder komprimerte kartdata. Filene redigeres ikke for hånd.

## Begrensninger

- Siden må forbli én fil. Den eneste eksterne ressursen er Google Fonts, og alt annet er innebygd.
- Tallene i spesifikasjonen og overleveringen er startverdier som justeres i spilltesting.

## Publisering

Publiser `dist/index.html` til artifacten https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f med dens URL, slik at lenken beholdes. Gjør det bare når brukeren ber om det.
