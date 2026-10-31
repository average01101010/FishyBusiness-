# FishyBusiness-
Game-development

## Kystfiske

Det Store Blå er et spill om kystfiske langs hele norskekysten. Det har kartplotter, 3D-visning i ren WebGL, mobil og dekksdagbok. Spillet kjører som én selvstendig HTML-side og publiseres som artifacten [«Kystfiske – prototype»](https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f).

### Bygg

```
node build.mjs
```

Byggeskriptet setter sammen `src/` til `dist/index.html`, som kan åpnes direkte i nettleseren. Det trenger bare Node, ingen pakker.

### Struktur

| Sti | Innhold |
| --- | --- |
| `src/index.html` | HTML-mal og rekkefølgen filene settes sammen i |
| `src/styles.css` | Stilark |
| `src/js/core/` | Simulering: verden, arter og utstyr, vær, fangst, priser, kvoter, mannskap, andre fartøy og tjenester |
| `src/js/ui/` | Grensesnitt: språk, kart, instrumenter, mobil, dekksdagbok, guide, handlinger, håndfiske, «Kaffe på kaia» og oppstart |
| `src/js/view3d.js` | 3D-visning |
| `src/data/` | Kartdata (Senja innebygd, hele kysten som kartpakker), sjømerker, mottak, regler og kaier (JSON) |
| `docs/INDEKS.md`, `docs/systemer/` | Dokumentasjonen per system (overleveringen delt opp 26.10.2026), `docs/BACKLOG.md` det som gjenstår |
| `docs/spesifikasjon.md` | Spesifikasjon for fiskerisystemet |
| `tests/` | Playwright-tester i Python, som kjøres mot `dist/index.html` |

`docs/spesifikasjon.md` er eksportert fra dokumentet [«Kystfiske – spesifikasjon for fiskerisystemet»](https://claude.ai/code/artifact/0ca28240-d946-46b1-802b-b4b511e9398d) 29. september 2026.

## Skipsmodeller

- [Planliste for realistiske fiskefartøy i Blender](docs/skipsmodeller/planliste-fiskefartoy.md): standard detaljliste og benchmark for skipsmodeller.
- [Eksempel: bildeanalyse av SULEBAS (SF-100-SU)](docs/skipsmodeller/eksempel-sulebas-sf-100-su.md): planlisten brukt på et ekte referansefoto.
- [Referanseanalyse, runde 2](docs/skipsmodeller/referanseanalyse-runde-2.md): ti fartøy analysert mot planlisten.
- [Kartlegging av spillet](docs/skipsmodeller/kartlegging-spillet.md): arter og redskap, utstyrsmodellene, båtene, feilkatalog og forslag til utstyrsbibliotek.
