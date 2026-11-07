# K1: målinger før hele kysten

Resultatene står i `docs/kart/K1-maalinger.md`. Skriptene skriver mellomfiler hit (ikke i git).

- `probe/`: målebenken som Jonas åpner på enheten. `python3 probe/gen.py` lager filene (bygg spillet først), og så publiseres `probe/index.html` med `game.html`, `bench.js`, `fflate.js` (fflate 0.8.2 fra npm, MIT), `sw.js` og `p/*` som filer ved siden av.
- `ovlist.py` lister filene i Overture-utgaven, og `ovindex.py <type> ...` lager indeksen over radgruppene som berører Norge. `ovfetch.features(type, boks, kolonner)` henter bare dem.
- `region.py senja|bergen|oslofjord`: vektordata og pakkede masker for et prøveområde.
- `terrain.py` henter Terrarium-fliser, `hill.py` lager relieffet z11 mot z13 ved Husøy, og `tsize.py` måler pakket terreng per km².
- `national.py`: Norge på 200 m UTM 33 (land, territorialfarvann og kystbelte). Trenger `norway.pkl` (Overture `divisions/division_area`, land og maritim for NO).
- `gamemask.py` og `cmpmask.py`: dagens 25 m-maske mot Overture.

Oppsett: `pip install pyarrow requests shapely pyproj scipy pillow numpy`.
