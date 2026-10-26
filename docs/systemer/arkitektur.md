# Arkitektur: én fil, tilstand, tid og konvensjoner

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 4. Teknisk arkitektur

## 4.1 Én fil, flere lag

1. **Kjerne:** simulering, tilstand `S`, arter, priser, kvoter og regler.
2. **UI:** HUD, knappelinja `#dock` med skuffen `#drawer` (`ui/10c-dock.js`), panel, telefonen `PHONE` med apper, overlays (`PUBW`, `ROD`), rute-editoren (`ui/03b-route.js`) og veiledningen «Første tur» (`ui/07b-first-trip.js`). Autoruta ligger i kjernen (`core/11-route.js`).
3. **3D:** `G3`, en egen WebGL-renderer for sjø, terreng, båter og effekter. Kartplotteren er Canvas2D og SVG.
4. **Data:**
   - Rasterkartene (land, dybde, avstand til land, eksponering, høyde og skog) ligger i kartpakker i `dist/map/`, som spillet henter (4.6).
   - Resten er base64-blobber i `<script type="application/octet-stream">`, blant annet vei, bygg, fin kyst og båtmodellene.

## 4.2 Tilstand og tid

- `S` er hele spilltilstanden. Lagres i `localStorage` under `KEY`, med `v:1`.
- Kart i km-rutenett: x østover, y sørover. Grenser lat 68,98–69,72 og lon 16,55–18,55. `KX = 111,32·cos(69,35°)`, `KY = 111,32`.
- `EPOCH` = mandag 1. mars 2027 kl. 06:00 UTC. `S.t` er spillminutter siden EPOCH, og `H = S.t/60`.
- `GAME_RATE = 6` spillminutter per ekte minutt. Ett spillår er rundt to ekte måneder, og en fisketur rundt én kveld. `S.mult` er en testmultiplikator.
- `step()` kjøres én gang per spillminutt. `catchUp(realMs)` spiller av fravær, opp til `CATCHUP_CAP`.
- **Tid i ekte tid** (`02-format-state.js`): `realDur(spillminutter)` og `inReal()` gir «om 12 min» ut fra `GAME_RATE × S.mult`, og `whenTxt(T)` gir «14:20 · om 12 min». Brukes i ruteanslaget, fisketida, verkstedet, bunkringen, lossingen, ståtida og planlagt avgang. HUD-brikka «Neste» (`nextEvent()` i `04-panels-instruments.js`) viser den nærmeste hendelsen for båten du ser på, for eksempel «⏱ Fremme på feltet om 7 min (14:20)».

## 4.4 Konvensjoner og fallgruver i koden

- **Telefonknapper bruker `data-pa="handling"`.** `data-a` er en *parameter*, for eksempel appnavn for `data-pa="open"`. Dette ga en feil der driftsplanknappene aldri virket.
- **Nye apper** krever tre ting: en linje i `APPS`, et ikon i `IC` (SVG), og funksjonsnavnet i sidekartet `PAGES()`. En side som skal åpnes i skuffen i stedet for telefonen, legges også i `DRAWER` og får tittel i `TITLE` i `ui/10c-dock.js` (se 5.17).
- `BOAT` er et `const`-objekt som oppdateres med `Object.assign(BOAT, VESSELS[type])` i `applyVessel()`.
- **Nye lagrede nøkler** må legges til i standardlista i lastekoden, `for (const k of ['equip', 'crew', …])`. Nøkler per båt legges i `VKEYS`.
- **Telefonoverskrifter:** `L(no, en)` i telefonen, `t(key)` i panelet (ordbok), og `LS(...)` for korte og lange knappetekster.
- **3D-kamera mot styrbord side,** der skipperen står: `cam.yaw = -0.85`.
- Hendelser i 3D fra simuleringen går via `window.CATCHQ`, som er fangstkøen for fiskeanimasjonene.
- **Lagene i kartplotteren:** dybdekartet `#chartcv` (lerret), varmekartet `#heatcv` (lerret) og så SVG-kartet `svg#map` øverst. Land, kystlinje, kurver og navn ligger i SVG, så det som tegnes på `#heatcv`, havner aldri over land. Legg aldri noe som skal ligge under land, i `gBase` eller etter den.
- **TDZ mellom filene:** Funksjoner heises i det felles skriptet, men `let` og `const` finnes først når fila deres har kjørt. `03-map.js` kaller derfor `heatPaint()` bare når `window.heatReady` er satt (av `03c-heat.js`), og ingen fil kaller noe fra en senere fil mens den lastes.
- **Innstillinger må tåle `undefined`:** `S.settings` får ikke standardverdier nøkkel for nøkkel ved lasting. Nye nøkler leses som «ikke satt», for eksempel `S.settings.echo !== false` for «på».
- **`chartMode()`** (`07-guide.js`) gir `'fish'` bare når båten du følger har kartplotter. `S.settings.chart` er ønsket ditt og beholdes når du følger en båt uten plotter.
