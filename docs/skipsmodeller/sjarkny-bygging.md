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
