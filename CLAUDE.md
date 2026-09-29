# Kystfiske

Et kystfiskespill fra Senja som kjører som én selvstendig HTML-side, publisert som artifact. Brukeren skriver norsk; svar på norsk. Koden og kommentarene i den er på engelsk.

## Bygg og sjekk

- `node build.mjs` setter sammen `src/` til `dist/index.html`. `dist/` er ikke i git.
- `node --check <fil>` på hver JS-fil du endrer, og bygg etterpå.
- Filene i `src/` kan ikke åpnes direkte i nettleseren. Test alltid `dist/index.html`.

## Slik er koden satt sammen

- `src/index.html` er malen. `@include(sti)` byttes ut med filen, og i JS skrives JSON-data som `/*@include(sti)*/null`.
- Alle filene i `src/js/core/` og `src/js/ui/` havner i samme `<script>`, i rekkefølgen malen viser. De deler globalt skop, så en ny fil må legges inn i malen på riktig plass.
- `'use strict'` står øverst i `src/js/core/01-world.js` og gjelder hele det første skriptet. Den filen må derfor alltid komme først.
- `src/js/view3d.js` ligger i et eget `<script>` og eksponerer `G3`.
- `src/data/` inneholder komprimerte kartdata. Filene redigeres ikke for hånd.

## Begrensninger

- Siden må forbli én fil. Den eneste eksterne ressursen er Google Fonts, og alt annet er innebygd.
- Spesifikasjonen for fiskerisystemet ligger i `docs/spesifikasjon.md`. Tallene der er startverdier som justeres i spilltesting.

## Publisering

Publiser `dist/index.html` til artifacten https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f med dens URL, slik at lenken beholdes. Gjør det bare når brukeren ber om det.
