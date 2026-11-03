# Kystbåten (kyst15): slik ble revisjonen bygd (02.11.2026)

Kort om byggingen av `tools/boats/kyst15.py`; målene, avgjørelsene, avvikslista, kritikksløyfen og selvvurderingen står i
`kyst15-grunnlag.md`, lærdommene i `sulebas-bygging.md` kap. 20.

## 1. Rekkefølgen

1. Leselista lest (del 1 helt, båtens skript og data, malene `malo36.py`, `havsjark35.py`, `hs11.py`, spillets kode for modellen).
2. Det gamle snittet veid uten Blender (`qa/lines.py`): 120,9 t mot 75 t. Jonas: 75 t er den tomme båten; shelterdekket til hekken; styrhuset i
   full bredde.
3. Plassene for arbeidet lagt først (kap. 19): haleren forut i halestasjonen, karet akter for den, luka, bordet langs innerveggen, juksaplassene på
   ripa akter for haleren, leideren og døra inn. Halestasjonens mål (ripa 0,95 m, taket 2,04 m over arbeidsdekket) i `check()` før veggene.
4. Skroget som én flate (`Mesh`, `hull_shell`): snittet fra kjølens underkant (malo36 `vline` og `section`), shelterdekkets ripe, kappen, innsida
   og shelterdekket i samme nett; malingslinjene som rader og skjæreplan.
5. Hullene (`cutters`, `cut_holes`, `linings`): halestasjonen, koøyene, ventilene, hawse-rørene, lensespaltene, brønnen, utløpene.
6. Halestasjonens innside (`station`), styrhuset (`wheelhouse`, `helm`), shelterdekket (`decks`), speilet (`transom`), masta og mesanen (`rig`),
   seilet (`sail_set`, `sail_furled`), undervann (`underwater`).
7. Kritikksløyfen (grunnlaget kap. 7), eksporten, dekkskartet i spillet, testene.

## 2. Kjøring

    python3.11 tools/boats/kyst15.py check          # kontrollene, uten Blender også: python3 tools/boats/qa/stubcheck.py tools/boats/kyst15.py
    python3.11 tools/boats/kyst15.py fast           # eksporten til src/data/boat-kyst15.b64 og -side.b64
    python3.11 tools/boats/qa/shots.py tools/boats/kyst15.py k15 K1 K2 K3s K4 K5 K6 K7 c_haul c_helm ...
    python3.11 tools/boats/qa/clip_kyst15.py        # klasjsjekken (0)
    python3 tools/boats/qa/deckpoints.py kyst15     # plassene i spillets dekkskart
    TAG=etter python3 tests/ky15shot.py             # bildene i spillet

`python3.11` trenger `bpy==4.5.4` og en egen `pillow` (`pip install --ignore-installed pillow`; systemets PIL mangler `_imaging` for 3.11).

## 3. Tall

Nær 71 150 trekanter (213 450 punkter i spillet), `lodm` 39 295 (taket 40 000 minus seilets), fjern 3 309 trekanter (9 927 punkter mot 12 000),
GLB 3,9 MB (før 0,9). 75,1 t ved vannlinja 3,0, vannlinjebredden 5,39 m (82 %).
