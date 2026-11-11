# Byggingen av den nye hurtigsjarken: slik ble 10,99-meteren revidert (01.–02.11.2026)

Kort byggedokument for revisjonen av `sjarkny` («Ny hurtigsjark 10,99 m, 650 hk»), skriptet `tools/boats/hs11.py`. Avvikslista,
avgjørelsene, lanternene, rundene og selvvurderingen står i `sjarkny-grunnlag.md`.

## 1. Kildene

Generalarrangementstegningen det første skriptet var målt av (13.10.2026), vist igjen av Jonas 02.11.2026: sideriss, plan, forriss og
akterriss med hovedmålene (LOA 10,99, BOA 4,68, dmax 2,06, D 2,40, Δmax 42 t, G 16 t, 12 kn). Tegningen ligger ikke i repoet; målene står i
skriptets tabeller. Skalaen er 131,7 px/m på bildet Jonas viste (3 392 px bredt), speilet ved x 35 og grunnlinja ved y 840 i utsnittet
`qa/overlay_hs11.py` lager. Det tegningen ikke viser (snittene mellom for- og akterrisset, innsiden av huset, beslagene), er antatt.

## 2. Skriptet

Skrevet på nytt med koden fra `hurtig11.py` (ett nett, `pchip`, ekte hull, `check()`), men formen etter tegningen.

- **Rammen:** x forover fra speilet, y til babord, z opp fra grunnlinja; vannlinja er tegningens største, z 1,18 (som det gamle skriptet).
- **Linjene** (`KEEL` kroppens bunn, `CHZ`/`CHY` slaget, `KNZ`/`KNY` knekken under lista, `SHY` ripa i plan) leses med `pchip`; ripas høyde er
  2,87 akter med et kort trinn (6,26–6,50) opp til 3,08. Kjølen (`skeg_bottom`) stiger rett fra 0,88 under grunnlinja og går inn i forfoten.
- **Snittet** (`section`): kjølens fot og side, den hule rota inn i bunnen, den grunne V-en, slagflaten, den nesten loddrette sida, den
  hvite lista, skansekledningen med haleportens hakk til styrbord.
- **Ekte hull**: seks lensporter til styrbord og to til babord ved dekket, lasteromsluka midt akter, forluka, eksosen, lensepumpas utløp.
- **Styrhuset** (`wheelhouse`): skall fra ringer, fronten heller forover (`LEAN` −0,33), tre frontruter, hjørneruter, to sideruter, døra i
  akterveggen til styrbord med bladet hektet åpent, gulvet et trinn over dekket. **Dekkshuset** (`shelter`): en lukket kasse til babord med
  dør, vinduer og to takstolper til styrbord. **Taket**: ett tynt tak fra 3,15 til visiret, oransje kant, dryppkant, bue.
- **Styreplassen** (`helm`): konsollen til styrbord med dashbord, skjermer, kompass, ratt, spak og stol; benk og kartbord til babord.
- **Dekket** (`decks`): rekkverk og pulpit rundt bakken, ankerspill, kjettingrør, baugrulle, pullerter, klamper, sugelufter, håndlister på
  fronten og langs styrbord skanse, stevnbeslaget, haleportens rulle, kista i babord hekk (kranens fot), flaggstanga, hekklyset, leideren.
- **Masta** (`rig`): skrå søyle over styrhusets akterkant, plattform, stang med den hvite, fiskelysene på armer, radarbrakett, arbeidslys,
  piskeantenner, GPS, horn og lyskaster.
- **Under vann** (`underwater`): profilror, propell i dyse på stag og kjølens sko, aksel, slingrekjøler, sinkanoder, ekkoloddgiver.

## 3. Kontrollene

`/opt/bpyenv/bin/python tools/boats/hs11.py check`: deplasementet mot tegningen, lettvekta, lengden, bredden, dypgangen, lanternene, propellen
i dysa, styrhusets høyde, øyet, dashbordet, rattet, skipperen bak ruta, taket over haleplassen, trinnet, skansen, kista, luka, haleporten,
arbeidsflyten, registreringsmerket, båndet `vessel3d` måler, jevnheten. `qa/clip_hs11.py` (0), `qa/fair.py`, `qa/shots.py`,
`qa/overlay_hs11.py <tegningen> <K3s> <ut>` (overlegget på sideriss), `tests/hs11shot.py` (bildene i spillet).

## 4. OB10 runde 2 (11.11.2026)

Det som ble lagt til i skriptet, og det som er verdt å vite neste gang (avgjørelsene og karakteren står i `sjarkny-grunnlag.md` 10.7–10.9).

- **Kranens fold har en retning.** Spillets kran (`tools/deck/kran.py`) ligger foldet langs båten fra aksen: knekken og den lave bommen 1,19 m én vei (fra 0,23 m over foten), teleskopenes hoder 0,96 m den andre veien og 1,73 m opp (ganger `s`). `kit.crane.ry` velger hvilken vei. Legg den lave enden bort fra der folk står, og regn begge endene i `check()` (`CRANE_LOW`, `CRANE_HIGH`).
- **Redskapets høyde mot tak.** Teinedaviten (`tools/gear/teine.py`) er en stolpe på 2,30 m med armen til 3,02 m, og foten står 0,2 m innenfor halve bredden når modellen ikke gir `haulerFoot` (`view3d/10-gear.js` `haulFootP`). Et tak over haleplassen må være over 3,1 m eller spart ut der stolpen står (`ROOF_CUT`). Garnhaleren er 1,95 m.
- **Vinduer på en kasse** (`bar_window`): et hus som er en `abox`, får ikke ekte hull uten å bygges om. Fire lister som står 30 mm ut rundt en rute 6 mm fra veggen, gir samme dybde for øyet, og en dryppelist over.
- **Skjermene** (`screen_art`): malt innhold i lag, 0,6 mm mellom lagene og 2 mm over skjermflata. Fargene eksporteres som hjørnefarger, så de lyser ikke om natta i spillet.
- **Dypgangsmerker** (`fittings.draft_scale`) bare der sida er nær loddrett og rett. I baugen, der sida faller ut og svinger inn mot stevnen, sank de flate tallene inn i skroget.
- **Gripefelt på dørken** (`GRIP`): flater 5 mm over dekket med kant ned, delt i ruter på rundt 0,45 m så de følger dekkets bue. Hold dem unna luka, surringsøyene og skansens fot.
- **Rendringer:** `qa/shots.py` legger vannet på `WL`, som her er tegningens største vannlinje. `qa/hs11_wle.py` gir spillets vannlinje (`WLE`), og `qa/hs11_uv.py` lys nedenfra og tre bilder av undervannsskroget (`uv_q`, `uv_side`, `uv_prop`). Nattbildet K6 i Blender viser nesten bare den grønne lanterna; bruk nattbildene fra spillet (`tests/hs11shot.py`).
- **Teineplassene** leses nå fra `tools/boats/potplaces.json` (`POTS`, `POT_SPOT`, `pot_kit`), som på de andre båtene. Endres plassene, endres de der.
