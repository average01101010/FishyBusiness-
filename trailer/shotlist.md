# Opptaksliste v2, stående 9:16 til TikTok

*10.11.2026. Låta er Jonas' «Fjord at Dawn» (Suno, 50,0 s, 95,7 BPM, takt 2,51 s), og den klippes ikke: filmen følger musikken (Jonas: «Vi må heller tilpasse filmen til musikken»). Tidene står på slagene som `tools/beats.py` fant, og ligger i `audio/music-edit-1.json`. Låta har en rolig del A til 17,4 s, et pust ned 17,4–22,4, oppbygging 22,4–27,4, full styrke fra **27,38 s** (droppet) til 44,86, og utgang til lyden slutter ved 49,4 s. v1 (62 s) er erstattet.*

## Regler

- Alt som vises er spillbart den dagen traileren publiseres.
- **Intet grensesnitt i noe bilde** (Jonas 10.11.2026: «Ingen UI, UX eller GUI»): ingen kart, statusbokser, knapper eller stedsnavn fra spillet. Filmoppsettet skjuler alt utenom 3D-lerretet.
- **Reisen fra trebåt til kystnotbåt** (Jonas 10.11.2026): båtene blir større for hvert klipp, i båtstigens rekkefølge. Trebåten og kystnotbåten går under den samme brua, først og på droppet.
- **Ekte fart**: båtene seiler i virkelig fart, ikke spillets seksdobbelte.
- Hvert hardt klipp ligger på et taktslag. Overtoning bare inn i sluttkortet.
- Båter og dyr kommer inn fra bildekanten eller er med fra første bilde. Lyset endres aldri brått i et klipp.
- Stående format: motivet i midtre tredjedel i bredden.
- **Ingen kildehenvisning i bildet** (Jonas 10.11.2026: «Det ser ikke bra ut»). Kartverket (CC BY 4.0), Mapzen (CC BY) og OpenStreetMap (ODbL) krever at kilden oppgis der kartdataene vises, så linja står i teksten under videoen når den publiseres.
- Stemme fra klippekart 3 (10.11.2026); manuset, undertekstene og teksten på skjermen står i `script.md`.

## Klippene, stemmeversjonen (klippekart 3, `audio/music-edit-3.json`, 10.11.2026)

**Båtstigen brytes med vilje i stemmeversjonen** (Jonas 10.11.2026): krabbebåten kommer før kystnotbåten, og kystbåten med hvalen etter droppet. Stemmen bærer historien (`script.md` v4), så regelen om at båtene blir større for hvert klipp gjelder ikke her. Trebåten og kystnotbåten går fortsatt under den samme brua, først og på droppet. Klippekart 2 (m2, uten stemme) holder båtstigen.

| # | Tid (s) | Klipp | Fra sekund | Hva som skjer | Stedsnavn | Stemme |
|---|---|---|---|---|---|---|
| 1 | 0–4,93 | `01-naust-trebat` | 0 | Fars naust i Vangshamn, trebåten | – | S1, S2 |
| 2 | 4,93–7,40 | `02-trebat-naert` | 0 | Nært på trebåten | – | S2 |
| 3 | 7,40–12,40 | `03-trebat-brua` | 0 | Trebåten under Gisundbrua | Finnsnes | S3 |
| 4 | 12,40–14,93 | `05-garn-lofoten` | 0 | Garnene i Lofoten | Lofotfisket | S4 |
| 5 | 14,93–17,40 | `07-vardo-kuling` | 0 | Kulingen ved Vardø | Varanger | S5 |
| 6 | 17,40–19,87 | `18-snokrabbe-svalbard` | 0,3 | Snøkrabbefartøyet ved Svalbard | Svalbard | S6 |
| 7 | 19,87–22,37 | `10-hekkingen-nordlys` | 0 | Nordlyset over Hekkingen | – | S6 |
| 8 | 22,37–24,87 | `04-reine-luft` | 0 | Reine fra lufta | Lofoten | – |
| 9 | 24,87–27,37 | `12-senja-luft` | 0 | Senja fra lufta, siste takt før droppet | – | S7 |
| 10 | 27,37–32,37 | `13-snurper-brua` | 1,0 | Droppet: kystnotbåten under Gisundbrua | – | stille |
| 11 | 32,37–37,37 | `06-bleik-hval` | 0 | Knølhvalen ved Bleik i midnattssol, hele klippet | Midnattssol | stille |
| 12 | 37,37–41,13 | `15a-hvaler`, `15d-tromso`, `15f-kirkenes`, `17a-skottland`, `17b-faeroyene`, `17d-gronland` | 0 | Montasjen, ett slag hver | stedsnavnene | stille |
| 13 | 41,13–44,87 | `14-side-om-side` | 0 | Trebåten og kystnotbåten ved samme kai | – | S8 |
| 14 | 44,87–50,00 | `16-slutt` | 0 | Overtoning 0,4 s, logoen på slaget, adressen ett slag etter, svart fra 49,4 | sluttkortet | – |

`07-vardo-line` er ute. Det nye klippet ved 19,87 ligger på taktslaget 19,876 (takt åtte i `audio/beats.json`).

## Klippene i v2 (klippekart 1, m1), til historien

| # | Tid (s) | Sted, dato og klokkeslett (UTC) | Båt | Hva som skjer | Tekst | Fil |
|---|---|---|---|---|---|---|
| 1 | 0–4,93 | Fars naust i Vangshamn, 16. okt 06:45, grålysning | trebåt | Spillets egen intro: kameraet glir fra kaia ved naustet ut til trebåten | – | `01-naust-trebat` |
| 2 | 4,93–7,40 | Gisundet, 16. okt 07:40 | trebåt | Nært: treverket, motorkassa, røyken fra semidieselen | – | `02-trebat-naert` |
| 3 | 7,40–12,40 | Gisundbrua, 16. okt 07:45 | trebåt | Under brua i 6 knop, kameraet bak og under, ser opp mot brudekket | «Finnsnes» | `03-trebat-brua` |
| 4 | 12,40–14,93 | Reine, 3. feb 11:00 | snekke | Lav vintersol, snø på Reine og tindene | «Lofoten» | `04-reine` |
| 5 | 14,93–17,40 | Henningsvær, Vestfjorden, 4. feb 10:45 | havsjark | Langs Lofotveggen under Lofotfisket | «Lofotfisket» | `05-vestfjorden` |
| 6 | 17,40–22,37 | Bleik, Andøya, 17. juni 23:00, midnattssol | kystbåt 15 | Mot sola; knølhvalen blåser, viser ryggen og halen | «Midnattssol» | `06-bleik-hval` |
| 7 | 22,37–24,87 | Vardø, 27. okt 12:15, 16,8 m/s | kystbåt 21 | Mot kulingen, sjø og skum | «Varanger» | `07-vardo-kuling` |
| 8 | 24,87–27,37 | Finnsnes kai, 5. juni 03:30 | kystbåt 21 | Nært baugen ved kaia, siste takt før droppet | «Fra trebåt …» | `08-verft` |
| 9 | 27,37–34,87 | Gisundbrua, 18. juni 01:00, midnattssol | kystnotbåt 38,55 | Droppet. Hun kommer mot oss gjennom spennet og går under brua; kameraet stiger og svinger mot styrbord baug | – | `13-snurper-brua` |
| 10 | 34,87–37,37 | Hekkingen fyr, 3. jan 22:00 | kystnotbåt | Nordlyset over fyret | – | `10-hekkingen-nordlys` |
| 11 | 37,37–41,13 | Hvaler, Rørvik, Bodø, Tromsø, Hammerfest, Kirkenes, 6. juli 09:00 | båtstigen | Ett slag per sted, samme drone i alle | stedsnavnene | `15a`–`15f` |
| 12 | 41,13–44,87 | Finnsnes kai, 18. juni 02:00 | begge | Trebåten foran kystnotbåten ved samme kai; kameraet trekker seg ut | «… til snurper» | `14-side-om-side` |
| 13 | 44,87–50,01 | Sluttkort | – | Logoen på slaget ved 44,87, adressen ett slag etter; svart når lyden slutter | «Spill gratis på detstorebla.no» | `assemble` |

Været er valgt med `tools/weather.py` (spillets eget vær med fast frø) etter `tools/weather-wants.json`. Filmoppsettet kontrollerer hvert bilde for skrog mot land, skrog og mast mot brupilarer, brudekk, kaier og bygg, kameraet mot sjø, terreng og bygg, og hopp mellom bilder (`HARNESS.md`).
