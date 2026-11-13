# Kildenettene for folkene (FB5, steg 122)

`mann.obj` og `kvinne.obj` er kroppsnettene den nye figuren bygges på (`tools/harbour/kropp_bygg.py`). De er ikke laget av oss.

- **Modell:** «Realistic White Male and Female Low Poly» («Male and Female – Free 3D Model») av **novisoj**, RenderHub, publisert 28.06.2020.
  https://www.renderhub.com/novisoj/realistic-white-male-and-female-low-poly-free-3d-model
- **Lisens slik siden viser den:** «Extended Use License»: «you may use the model for both non-commercial and commercial purposes, in a
  variety of mediums and applications». De fulle vilkårene står i RenderHubs «3D Content Licensing Agreement».
- **Avgjort av Jonas 13.11.2026:** han sendte fila og et skjermbilde av lisensen, og valgte «Bruk modellen nå» da økta spurte
  (alternativene var egne kropper nå, lime inn avtalen først, eller bare som forbilde).
- **Avgjort av Jonas 13.11.2026 (steg 124, før fila gikk ut med bygget):** økta spurte om han hadde lest RenderHubs fulle avtale og om fila kunne rulles ut, med tre valg (bare testadressen til avtalen var lest; «Lest, rull ut alt»: han har lest hele avtalen og den dekker et nettspill der fila ligger åpent; ikke rull ut ennå). Han valgte **«Lest, rull ut alt»**. `src/data/folk2.b64` går derfor med i bygget til testadressen og i slipp.
- **Ikke lest av noen økt (Jonas har lest den, punktet over):** den fulle avtalen. `www.renderhub.com` var utenfor nettverket økta fikk nå, så avsnittene om spill der fila
  følger med og om videredistribusjon er ikke lest av den som bygde dette. Jonas går god for lisensen; leser noen avtalen og finner at
  et nettspill med fila åpent tilgjengelig ikke er dekket, må kroppene byttes (rørledningen tar et hvilket som helst kroppsnett:
  `kropp.py` `SRC`, `BASE` og `fingers()`).
- **Hva som er brukt:** bare de to kroppsnettene (4 944 og 4 986 punkter). Øynene og tennene i pakken er ikke med (øynene er våre egne
  kuler der modellens øyne sitter). Nettene er skalert til 1,776 m, hodet er telt ned fra rundt 3 100 til 1 500 trekanter, og skjelettet,
  vektene, plaggene og hanskene er våre.
- **Navngivning i spillet:** ingen. Modellen og selgeren nevnes bare her og i `docs/systemer/folk-om-bord.md`.
