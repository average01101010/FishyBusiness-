# Leselista for båtmodellene

Hver økt som bygger eller reviderer en Blender-modell av en båt, leser denne lista før noe arbeid begynner. **Pilotbåten er grunnlaget**
(Jonas 02.11.2026: «arbeidet som ble gjort med sulebas som var pilotbåten var svært viktig for fremtidige revisjoner, og denne burde 100%
leses i hver økt som skal holde på med modellering av båtene»). Lista er delt i tre: det som leses helt hver gang, det som gjelder båten,
og det som slås opp. Si fra i svaret om noe i del 1 ikke er lest helt.

## 1. Leses helt, hver gang (rundt 270 KB)

| Dokument | Hvorfor |
|---|---|
| `docs/skipsmodeller/sulebas-bygging.md` | Arbeidsmåten fra bilde til spill: kildene og målingen i fast skala, skroget som én flate, hullene, kritikksløyfen (kap. 5), reglene (kap. 7), tabellen over spillets krav (kap. 15) og det hver revisjon lærte (kap. 11–19) |
| `docs/skipsmodeller/sulebas-pilot-grunnlag.md` | Malen for grunnlaget: fakta med kilde (S/T/A/R), avgjørelsene B1–B5, målene fra sidebildet (kap. 4.0), kravlista per planliste-ID med ✓/½/✗ (kap. 5), lanternene (kap. 6), og de 22 rundene i kritikksløyfen (kap. 7.1), som viser hva Jonas finner og hvordan det ble rettet |
| `tools/boats/ringnot38.py` | Pilotskriptet: linjene som tabeller med kilden i kommentaren, `holes()` med lysningene, de felles beslagene, `build(fine)` med fjernversjon, `anchors()`, eksporten |
| `docs/skipsmodeller/planliste-fiskefartoy.md` | Kravlista per sone, de vanlige feilene (kap. 29), benchmarken og kameraene K1–K7 (kap. 30) |
| `.claude/skills/blender/SKILL.md` | Rørledningen og lærdommene i kortform |
| `docs/skipsmodeller/prompt-blender-revisjon.md` eller `prompt-blender-ny-bat.md` | Bestillingen, og «Det neste økt bør vite» nederst |

## 2. Det som gjelder båten

- Båtens eget skript, hele: hva snittfunksjonen returnerer, om kjølen er en egen kropp, og hvilke tegninger eller bilder målene kom fra
  (be Jonas om dem).
- Grunnlaget og skriptet til den reviderte båten som ligner mest (malen for koden, ikke for formen; kap. 18): rundbunnet sjark med bakk
  `havsjark35.py` og `malo36.py`, med ly også `malo36.py`, hardknekt `hurtig11.py`, tung arbeidsbåt etter tegning `hs11.py`, åpne båter
  `snekke23.py`, `skiff59.py` og `snekke26.py`, styrhus akter `plast31.py`, shelterdekker med halestasjon og styrhus i full bredde `kyst15.py`. Selvvurderingen står sist i hvert grunnlag.
- `docs/skipsmodeller/kartlegging-spillet.md`: båtens rader, M-punktene og D8. `docs/batplan.md`: statuslinjene for båten.
  `docs/systemer/3d-baater-og-animasjon.md` 5.13.
- Spillets kode for modellen, før skriptet planlegges: `VESSELS` og `SPEC3D` for typen, og det tabellen i `sulebas-bygging.md` kap. 15
  peker på i `vessel3d.js` (`deckMap`, `deckPoints`, `markStrips`, `nameStrips`, `lanterns`) og `13-instruments.js` (`mastTop`, `jigRail`
  og `JIG_Z`). Legg spillets plasser (haler, juksamaskiner, bord, `kit`) inn før vegger og vinduer formes (kap. 19).

## 3. Slås opp når de trengs

- `tools/boats/fittings.py` og `tools/boats/bpyutil.py`: de felles beslagene og hjelperne. Se gjennom funksjonslista før et beslag bygges.
- `tools/boats/qa/`: verktøyene for kritikksløyfen (`shots.py`, `sheet.py`, `stubcheck.py`, `lines.py`, `fair.py`, `deckpoints.py`,
  `deckgrid.py`, `clip_*.py`, `overlay_hs11.py`, `runtests.sh`).
- `docs/systemer/testing.md` og testene som dekker båten (`tests/unit/vessel3d.test.mjs`, `vessel3d.py`, `brotest.py`, `lanterntest.py`,
  `regmarktest.py`, `maletest.py`, `walktest.py`, `vesseltest.py`, `penshot.py`, `jigshot.py`).
- Bakgrunn, bare når det er relevant: `eksempel-sulebas-sf-100-su.md` (slik et foto analyseres, når det finnes bilder),
  `referanseanalyse-runde-2.md` (ti referansebåter), `docs/planer/grafikk-batmodeller.md` (budsjettene; summert i
  `sulebas-bygging.md` kap. 1).

## Endringslogg

- 02.11.2026: kystbåten (`kyst15.py`) lagt til malene for en shelterdekker.
- 02.11.2026: første versjon (Jonas: pilotbåten skal leses i hver økt).
