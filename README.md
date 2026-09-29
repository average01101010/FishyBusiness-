# FishyBusiness-
Game-development

## Kystfiske

Kystfiske er et spill om kystfiske fra Senja. Det har kartplotter, 3D-visning i ren WebGL, mobil og dekksdagbok. Spillet kjører som én selvstendig HTML-side og publiseres som artifacten [«Kystfiske – prototype»](https://claude.ai/artifact/HHehndJQmtCYBJpQ1b8L6f).

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
| `src/data/` | Kartdata for Senja (komprimert, base64) og sjømerker og kaier (JSON) |
| `docs/spesifikasjon.md` | Spesifikasjon for fiskerisystemet |

`docs/spesifikasjon.md` er eksportert fra dokumentet [«Kystfiske – spesifikasjon for fiskerisystemet»](https://claude.ai/code/artifact/0ca28240-d946-46b1-802b-b4b511e9398d) 29. september 2026.
