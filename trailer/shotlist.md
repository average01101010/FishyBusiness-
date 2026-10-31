# Opptaksliste v1, stående 9:16 til TikTok

*30.10.2026. Hovedformatet er 9:16 (1080×1920), etter Jonas' valg. 16:9 lages senere fra de samme klippene der utsnittet tåler det. Tidene er omtrentlige til musikken er valgt og klippekartet skrevet; da flyttes hvert klipp til nærmeste slag. Ingen klipp med brukergrensesnitt. Alle klipp er data i `shots/<nr>-<navn>.json` og filmes med `tools/film.py`.*

## Regler

- Alt som vises er spillbart den dagen traileren publiseres.
- Hvert hardt klipp ligger på et taktslag. Overtoning bare i to overganger: 9 → 10 og 12 → 13.
- Båter og dyr kommer inn fra bildekanten eller er med fra første bilde.
- Lyset endres aldri brått innenfor et klipp. Nordlyset bygger seg opp over hele klippet.
- Stående format: motivet holdes i midtre tredjedel i bredden, horisonten i øvre eller nedre tredjedel, aldri midt på.
- Trebåten har flere klipp enn snurperen, med vilje.
- Ingen stemme i masteren. Teksten på skjermen står i `script.md`.

## Klippene

| # | Tid | Sted, dato og klokkeslett (UTC) | Båt | Hva som skjer | Kamera | Tekst | Fil |
|---|---|---|---|---|---|---|---|
| 1 | 0–3 | Vangshamn, Senja, 12. okt kl. 04:30, grålysning | trebåt | Naustdøra, trebåten ved kaia. Spillets egen intro. | `intro`, ut døra og ned på kaia | – | `01-naust-trebat` |
| 2 | 3–6 | Samme | trebåt | Nært: grått treverk, rorkult, motorkasse. Røyken puffer. | orbit, lavt, 6–8 m, 40° | – | `02-trebat-naert` |
| 3 | 6–12 | Gisundet nordover under Gisundbrua, 12. okt kl. 05:30 | trebåt | 7 knop under brua. Finnsnes våkner, røyk fra pipene. | orbit bakfra lavt, så opp | «Finnsnes» | `03-trebat-brua` |
| 4 | 12–15 | Reine, Lofoten, 25. jan kl. 10:30 | snekke 26 | Lav vintersol på snødekte tinder, ærfugl på sjøen. | orbit, drone sidelengs | «Lofoten» | `04-reine` |
| 5 | 15–18 | Vestfjorden, 25. jan kl. 11:00 | havsjark 35 | Flere sjarker på feltet, lett sjø. | orbit fra siden, tele (fov 25) | «Lofotfisket» | `05-vestfjorden` |
| 6 | 18–21 | Honningsvåg, 10. mai kl. 08:00 | kyst 15 | Havørn over fjellet, skarv på bergene, båten passerer. | orbit høyt, tilter ned | «Finnmark» | `06-honningsvag` |
| 7 | 21–24 | Bleik, Andøya, 20. juni kl. 23:00, midnattssol | kyst 21 | Knølhval blåser, rygg, hale. `spawn humpback` i bilde 0. | orbit lavt mot sola | «Midnattssol» | `07-bleik-hval` |
| 8 | 24–27 | Vardø, 15. okt kl. 12:00, Beaufort 7 | kyst 21 | Sjø over baugen, skum i striper. | orbit forfra lavt | «Varanger» | `08-vardo-kuling` |
| 9 | 27–30 | Bergen, 5. april kl. 17:30 | hurtigsjark | Byen, lys i husene, MS Kystpilen går ut. | orbit høyt over havna | «Bergen» | `09-bergen` |
| 10 | 30–36 | Hekkingen fyr, Senja, 20. des kl. 22:00, klart | havsjark 35 | Lyskjeglene går rundt. Nordlyset bygger seg opp over 6 s. | orbit stille, lav pitch, mot nord | – | `10-hekkingen-nordlys` |
| 11 | 36–40 | Finnsnes verft, 1. juni kl. 06:00 | kyst 15 → kyst 21 | Større båt ved kaia, navnet på baugen. Siste slag før droppet. | orbit nært baugen | «Fra sjark …» | `11-verft` |
| 12 | 40–50 | Gisundet, 21. juni kl. 02:00, midnattssol | kystnotbåt 38,55 | Hun legger ut under Gisundbrua. Masten klarer brua. Lang bevegelse. Droppet. | orbit: lavt forfra, stiger, rundt styrbord til akter | – | `13-snurper-brua` |
| 13 | 50–54 | Finnsnes kai, samme morgen | begge | Trebåten fortøyd ved siden av snurperen. Kameraet trekker ut. | orbit fra kaia, dist øker | «… til snurper» | `14-side-om-side` |
| 14 | 54–58 | Hvaler, Rørvik, Bodø, Tromsø, Hammerfest, Kirkenes | ulike | Ett slag per sted. Samme høyde og retning i alle. | orbit drone, lik i alle | stedsnavnene | `15a`–`15f` |
| 15 | 58–62 | Sluttkort | – | Logo på siste store slag. Adressen ett slag etter. Kreditering nederst. | – | «Spill gratis på detstorebla.no» | `assemble` |

## Det som må løses per klipp

- **1:** `G3.intro` krever at båten ligger ved fars naust (`naustSite`). Nytt spill med `#notut` må starte i Vangshamn, eller båten flyttes dit først.
- **3 og 12:** kamerabanen må gå klar av Gisundbrua (`camFree`), og masten på snurperen må klare brua (`G3.mastTop` mot `G3.bridgeInto`).
- **4–9, 14:** krever hele kysten i `tools/map/out/game/` før bygget. I skyen finnes bare Senja i dag.
- **7:** hvalen settes ut med `spawnWild('humpback')` i bilde 0 så blåsten kommer tidlig i klippet.
- **8:** været velges ved å lete i timene rundt klokkeslettet etter Beaufort 7 (`windAt`), ikke ved å tvinge det.
- **10:** nordlyset krever klar himmel og nok aktivitet (`auroraAt`); tiden letes fram på samme måte.
- **13:** to båter ved samme kai krever at trebåten står som NPC eller som båt nummer to i flåten. Må prøves.
