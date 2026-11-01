# Byggingen av plastsnekka: slik ble 26-foteren revidert (01.11.2026)

Kort byggedokument for revisjonen av `snekke` («Plastsnekke 26 fot, 30 hk diesel»), skriptet `tools/boats/snekke26.py`, etter
arbeidsmåten i `sulebas-bygging.md` (kap. 7, 11, 12 og 13). Avvikslista, kravlista, lanternene og rundene står i `snekke-grunnlag.md`.

## 1. Kildene

Ingen bilder i denne økta (Jonas 01.11.2026: «Jeg har dessverre ikke noen bilder for hånden»). Grunnlaget er spillets data
(`VESSELS.snekke`: 7,9 × 2,7 m, 1,2 m dypgang med kjølen, 3,0 t, 30 hk innenbords diesel, 1994, plotter og VHF som standard), og tabellene
det første skriptet leste av Jonas' bilder 13.10.2026 (ripa med spring, stevnen, halvbreddene ved ripa, ruffen, hardtoppen; bildene ligger
ikke i repoet). Alt under vann, vannlinjebredden og alt inni er antatt for typen. **Ingen mål er målt på et bilde i denne økta.**
`check()` sjekker modellen mot dataene og lanternereglene; `lines.py` tegner spantrisset og profilen fra tabellene.

## 2. Skriptet

Skrevet på nytt etter `ringnot38.py` og `skiff59.py` (det gamle skroget var to løse rutenett og et speil, kjølen en egen kropp, og formen
ga 10,5 t mot 3,0 t).

- **Rammen:** x forover fra speilets fot, y til babord, z opp fra kjølens underkant (grunnlinja); vannlinja z = 1,20 (dypgangen). Speilet
  heller akterover (`RAKE`): toppen ved x = 0, så lengden over alt er 7,90 m. Stasjonene akter for 0,8 m følger rakingen (`x_of`).
- **Snittet** (`section`) går fra kjølens underkant på senterlinja ut over kjølens bunn, opp kjølens side til roten (`zr`), og videre etter
  kroppen (`body`, catmull gjennom kontrollpunkter): hul kjølrot (vinglass), rund kimming under vannlinja, utfall opp til ripa. Over
  vannlinja sju støpte klinkbord (tre rader per bord, underkanten 22 mm ut, et trinn på 4 mm til neste), så det mørke båndet og ripa.
  Antallet punkter er fast; der kjølen ikke finnes (akter for 1,05 m) samles punktene i roten, så kjølens akterkant blir en skarp kant
  (to stasjoner 2 mm fra hverandre).
- **Ett nett** (`Mesh`, punktene delt etter posisjon): kjølen og sidene møtes på senterlinja, speilet er strimler på tvers mellom sidenes
  første snitt, og ripas teakkapp, cockpitforingen, dørken, akterveggen, skottet med ruffens akterside, sidedekkene, ruffens sider og topp og
  fordekket deler ripas punkter. Fordekket har egne rader fra ruffens nese (`frow`), så ruffens rader aldri går over i dekkets.
- **Malingsgrensene** skjæres i flaten (`bisect_plane`) på plan som stiger 12 mm per meter forover, og flatene males etter siden av planet.
- **Ekte hull:** prismer (`cutters`) skjæres ut med boolsk EXACT (`cut_holes`), lokket løseren legger over hullet slettes, og hvert hull
  fores (`linings`): vinduene i ruffen (lysning, glass, gummiramme, mørkt bak), nedgangsdøra (teakdør med lameller og håndtak),
  forluka (aluminiumsramme, røykfarget lokk med hengsler), motorluka i dørken (renne, avsats, teaklokk 4 mm under dørken), lensportene
  gjennom speilet (rør og gummiklaff), eksosen (rør og rustfri krage) og lensepumpens utløp.
- **Under vann:** bronsesko fra kjølen til rorets hæl, profilroret (`F.foil_rudder`) med stamme og lager, akselen ut av kjølens akterkant
  gjennom lageret, akselanoden, propellen (`F.propeller`, tre blad, fast stigning), anoder på kjølen og speilet, ekkoloddgiveren og
  sjøvannsinntaket.
- **Styreplassen:** konsollen på styrbord mot skottet med lyst dashbord, plotteren og motorpanelet i mørke rammer som vender mot skipperen,
  kompasset, bryterpanelet, rattet (`F.helm_wheel`), enspaken på konsollens innside (`F.single_lever`), VHF-en under hardtoppen og styrestolen
  (`F.helm_seat`). Skipperen står på dørken med 1,98 m under taket.
- **Dørhuset:** vindskjermen i tre ruter på ruffens topp, vingene bøyd tilbake til ruffens hjørne og ut til sida, skottets forlengelse under
  dem, sidene på ripa (hvitt panel og glass) som heller inn til hardtoppen, stolpene på fotplater, hardtoppen med leppe og antisklitopp,
  viskerne, håndtakene, masta i tabernakel med den hvite rundtlysende, VHF-pisken, GPS-en, hornet og arbeidslyset.
- **Nye felles beslag i `fittings.py`:** `single_lever`, `helm_seat`, `stern_lantern` (135° linse) og `foil_rudder`. Fra før: `propeller`,
  `anode`, `cleat`, `side_lantern`, `allround_lantern`, `bow_roller`, `hatch_lid`, `helm_wheel`, `whip`, `gps`, `pipe`, `loft`, `atorus`.
- **Arbeidet om bord:** båtens eget sløyebord over babord ripe ved haleren (`gutting_board`, `work.own`), blødekaret på dørken akter for
  fiskeren på styrbord, fangstkaret akter på senterlinja (grunnlaget kap. 6.2).

## 3. Kritikksløyfen

Verktøyene ligger i repoet, `tools/boats/qa/` (flyttet dit fra kladdemappa etter økta): `shots.py` (K1–K7 i planlisten kap. 30.3, K6 om natta med lanternene tent, og
nærbilder av styreplassen, vindskjermen, hekken, baugen, propellbrønnen og arbeidsplassen), `lines_snekke26.py` (spantriss, profil og volum uten
Blender), `stubcheck.py`, `clip_snekke26.py` (klasjsjekken: beslagene, styreplassen og dørhuset mot skrogets innside i snittets høyde, under dørken og inni ruffen;
skrogets egne dekk mot skrogets utside), `sheet.py` (kontaktark), `snekke26.py check` (eller `stubcheck.py` uten Blender), `runtests.sh` og eksporten. Rundene står i grunnlaget kap. 6.1.

## 4. Spillet

Spillet viste Blender-modellen også før revisjonen (`glbHas('snekke')`, 10 332 trekanter), så ingen feil i koden hindret den. Før- og
etter-bildene i begge formater: `tests/sn26shot.py` (`TAG=for`/`etter`): utenfra (K1 og K2), broa, dekket under fiske med to mann og
fangst, og natt (K6).

## 5. Tall

| | Før | Etter |
|---|---|---|
| Nær (`lod0`) | 10 332 trekanter | 68 057 |
| Middels (`lodm`) | – | 40 000 |
| Fjern (`lod1`) | 1 589 | 3 071 |
| GLB | 412 KB | 4 258 KB |
| Deplasement (skroget under vannlinja) | 10,5 t uten kjølen | 3,58 t med kjølen (data: 3,0 t) |

## 6. Kjøring

    uv venv -p /usr/bin/python3.11 /opt/bpyenv && VIRTUAL_ENV=/opt/bpyenv uv pip install bpy==4.5.4 pillow numpy
    /opt/bpyenv/bin/python tools/boats/snekke26.py check       kontrollene mot dataene og reglene
    /opt/bpyenv/bin/python tools/boats/snekke26.py fast dry    GLB-en bare i tools/boats/out
    /opt/bpyenv/bin/python tools/boats/snekke26.py fast        til src/data
    TAG=etter python3 tests/sn26shot.py                        skjermbilder fra spillet i begge formater

## 7. Det som ikke kan måles, og hva som ville gjort det bedre

- Under vann og på tvers er alt antatt. Bilder som ville hjulpet: rett fra siden av en 26 fots plastsnekke av typen med kjent lengde, helst
  på land; rett akterfra og forfra; inn i cockpiten og styreplassen; helst produsentens linjer og generalarrangement.
- Deplasementet blir 3,58 t mot 3,0 t i dataene (19 % over); grunnere blir bunnen flat. Dataene er ikke endret.
- Materialene (F2): gelcoaten, teaken og plastens glans er farger per hjørne.

## Endringslogg

- 01.11.2026: første versjon.
