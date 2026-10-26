---
name: blender
description: Rørledningen for en ny eller endret Blender-modell (båt, folk, havneenhet, fisk, måker, brygger, naust, butikk): skriptet, eksporten til src/data, malen, kontrollbildene og testene som trengs.
---

# /blender <modellen>

Modellene lages av skript, aldri for hånd i Blender, så de kan lages på nytt. Reglene: bare utsiden som spillerne ser (Jonas 06.10.2026), ingen kjøpbart redskap modellert inn i båtene, bare ankrene der spillet setter det (Jonas 18.10.2026), ingen ekte firmanavn på skrog eller skilt. Referansetegninger legges ikke i repoet, bare målene.

1. **Les** `docs/systemer/3d-baater-og-animasjon.md` (5.13, rørledningen) og `docs/systemer/baater.md` for en båt, `docs/systemer/havner-og-mottak.md` for havneenheten og bryggene, `docs/systemer/folk-om-bord.md` for folkene. Felles kode, også eksporten, ligger i `tools/boats/bpyutil.py`.
2. **Oppsett:** `pip install bpy==4.5.4`. Skriptene: `tools/boats/<type>.py` (båter), `tools/harbour/arbeider.py` (folk), `kaimottak.py` (havneenheten), `brygge.py` (kaier og flytebrygger), `naust.py`, `butikk.py`, `pub.py`, `rorbu.py`, `tools/fish/fisk.py`, `tools/wild/maake.py`, `tools/opening/brev.py`. Et nytt skript følger det nærmeste av dem.
3. **Kjør** skriptet (`fast` uten bildene mens du arbeider). Det skriver GLB og sidebilde som base64 til `src/data/<navn>.b64` og kontrollbilder til `tools/*/out/` (ikke i git). Se på kontrollbildene.
4. **Malen:** en ny modell trenger sine linjer i `src/index.html` (`<script id="glb-TYPE">` og `pic-TYPE`), og `src/data/<navn>.b64` i `COVER` i `tests/run.py`. Spillet leser modellen først når typen trengs (`glbData`, `glbPart`).
5. **I spillet:** bygg, start over HTTP (`python3 tools/serve.py`) og se modellen i 3D der den hører hjemme, fra flere vinkler, i dagslys. Ankrene (`anchors` i GLB-en) sjekkes mot det spillet forventer (`hauler`, `reel`, `work` på båter; liggeplassene og kranen på havneenheten).
6. **Tester:** `vessel3d` (24 min) bare når en båtmodell eller malingen er endret; `unittest` når havneenheten; `vectest` når bryggene. Ellers det `run.py changed` velger.
7. Deretter `/lever`.
