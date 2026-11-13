# D1: Styrhus-paletten i skuffen og telefonen

Fra `docs/planer/design-ombygging.md` (Jonas 13.11.2026: retning B «Styrhus», «Kjør på D1»).

## Ferdig når

1. Alle skuffesidene og appene i telefonen tegnes i Styrhus-paletten (mørke flater, lys tekst, magenta bare på kjøp og godta), i 800 × 1280 og 1280 × 800 (`tools/ui/designshots.py` før og etter).
2. `python3 tools/ui/kontrast.py` går gjennom hver side og fane og finner ingen tekst under 4,5:1 (3:1 fra 24 px) i skuffen og telefonen.
3. Utenfor skuffen og telefonen er ingenting endret: havn, til sjøs, kartplotter, dagbok og dialog er bildelike før og etter.
4. Kystposten beholder avispapiret.
5. Testene som dekker `src/styles.css` er grønne, og sidefeil er `[]`.

## Slik

Fargene i `src/styles.css` får roller (`var(--m-ink,#22323c)`: rollen med dagens farge som reserve). Rollene er bare definert inne i `#drawer` og `#phone .ph-screen`, så alt utenfor faller tilbake på fargen det har i dag. `tools/ui/styrhus.py` gjør omskrivingen; `tools/ui/kontrast.py` måler.

Ikke i D1: oppsett og bredder (D2), butikkflyten (D3), sammenslåinger (D4), telefonen i nettbrettstørrelse (D5), dialogene og HUD-en (D6), uskarpt glass (må måles på nettbrett først).
