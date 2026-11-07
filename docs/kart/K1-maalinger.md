# K1 Målinger før hele kysten (02.10.2026)

Kladd for planen «Hele Norges kyst». Ingenting i spillet er endret. Skriptene ligger i `tools/map/k1/`.

## 1. Artifact med flere filer

Målt med målebenken (https://claude.ai/artifact/JCTuxnn8svN5bCoW9BKjPw) på Jonas' nettbrett i Claude-appen.

| Spørsmål | Svar |
|---|---|
| Binærfiler | `.bin` (application/octet-stream) blir avvist ved publisering. **`.wasm` godtas** og kommer fram uskadd (SHA-256 stemmer for 1 KB, 5 MB og 14,9 MB). Kartdata legges derfor som `.wasm`. |
| Relativ `fetch` | Virker. |
| Komprimering underveis | Serveren sender gzip. Data vi har pakket med deflate selv, blir ikke mindre av det. |
| Mellomlager | `private, max-age=31536000, immutable`, men adressen inneholder versjonen (`/_f/<versjon>/`). Neste henting av samme fil går på 22 ms mot 1,5 s, men **hver publisering gir nye adresser**. Spillet må lagre kartflisene i IndexedDB etter innholdshash, ellers lastes alt ned på nytt etter hver oppdatering. |
| Range | Støttes ikke (svar 200 med hele fila). Flisene må være små nok til å hentes hele. |
| Ny publisering | Filer som ikke sendes med, blir liggende (bekreftet med en publisering av bare siden). |
| IndexedDB | Virker: 5 MB skrives på 19 ms og leses på 13 ms. Kvote 10 GB. |
| Cache API | Virker. |
| Varig lagring | `persist()` gir nei i Claude-appen. Nettleseren kan altså rydde bort data når det blir trangt. |
| Service worker | Stengt (403). Frakoblet spill blir bare på nettstedet. |
| DecompressionStream | Finnes, men er asynkron. |
| Hastighet | 15 MB på 2,1 s (60 Mbit/s på nettbrettets nett). |

Grenser for artifacten (fra verktøyet): 15 MB per binærfil, 255 filer og 64 MB per publisering, 511 filer og 256 MB per versjon.

## 2. Nettbrettet (OPD2415, Android 16, Adreno 830, 8 kjerner, 8 GB)

| Måling | Resultat |
|---|---|
| Oppstart til startknappen | 1,9 s |
| Til 3D er i gang | 2,6 s |
| Bildetakt i havna, på feltet (9 m/s) og i kuling (20 m/s) | 50,1 bilder/s alle tre, median 20,0 ms, 95 % 20,1 ms, ingen hakk |
| Catch-up 72 timer (4 320 steg, nytt spill) | 46 ms |
| JS-minne | 117 MB (Chrome på Android runder av, tallet står stille) |

50 bilder/s med 20,0 ms jevnt er skjermens takt i appen. Spillet når taket uten ett eneste hakk, så grafikkbrikken har krefter til overs. Spillet kjørte i et vindu på 640 × 788 punkter. Full skjerm gir flere piksler. Adreno 830 er en toppbrikke fra 2025. Eldre telefoner må måles for seg (iPhone 11 og Android med Adreno 6xx).

## 3. Kartblokker på nettbrettet

| Måling | Resultat |
|---|---|
| Oppslag i ett stort rutenett | 15,5 ns |
| Oppslag i 10 km-blokker (Map og siste blokk husket) | 17,2 ns, 11 % tregere |
| Bilineær dybde over blokker | 24,9 ns |
| Pakke ut 32 blokker med fflate (16 masker 400 × 400, 16 dybder 200 × 200) | 65 ms, verste blokk 3,6 ms |
| Det samme med nettleserens DecompressionStream | 38 ms (asynkront) |

Blokkoppslag koster nesten ingenting, og synkron utpakking med fflate (MIT, 33 KB) er rask nok til at klokka bare trenger å vente når en blokk ikke er lastet ned.

## 4. Kilder og prøveområder

**Overture 2026-09-23.1** leses rett fra S3 med HTTP-delhenting (pyarrow). DuckDB får ikke hente utvidelsene sine herfra. En indeks over radgruppene som berører Norge, gjør at bare de hentes. Hele Senja-rammen tar 3 s for land.

**Overture-kysten er OSM-kysten.** Mot dagens 25 m-maske for Senja er 99,82 % av cellene like. Avvikene er én celle langs kanten (polygonfyll og cellesentrum). Ved alle ni havnene ligger avvikene bare i kanten.

**Terreng:** Terrarium z13 har Kartverkets 10 m-terreng for Norge (6,7 m per piksel ved Senja, 9,4 m i Bergen). Det virker nå, uten Geonorge. Dagens spill bruker rundt 27 m (z11). Se `husoy_z11_z13.png`.

| | Senja-rammen | Bergen | Oslofjorden (Horten–Moss) |
|---|---|---|---|
| Utsnitt | 78,5 × 82,4 km | 44 × 44,5 km | 34 × 44,5 km |
| Kystbelte (land innen 3 km fra sjø) | 2 015 km² | 1 147 km² | 522 km² |
| Landpolygoner (punkter) | 2 711 (301 000) | 4 409 (457 000) | 3 049 (294 000) |
| 25 m-maske, pakket | 45 KB | 44 KB | 27 KB |
| 12,5 m-maske, pakket | 98 KB | 102 KB | 61 KB |
| Bygg (punkter per bygg) | 42 088 (7,1) | 207 753 (8,5) | 133 247 (8,4) |
| Veier | 12 334 biter, 2 185 km | 91 432, 6 431 km | 47 343, 3 918 km |
| Kaier (pier) i infrastruktur | 270 | 1 114 | 2 355 |
| Navngitte steder | 1 521 | 1 826 | 467 |
| Terreng 10 m, pakket per km² | 2,5 KB | 2,6 KB | 1,9 KB |
| Terreng 30 m, pakket per km² | 0,7 KB | 0,7 KB | 0,5 KB |

Terrengtallene er høyder i kvartmeter, todimensjonal differanse og deflate. Terrarium-PNG tar rundt 22 KB per km², altså ti ganger mer.

## 5. Hele landet (Overture-grensene, 200 m UTM 33)

| | km² |
|---|---|
| Land (fasit 323 800 for fastlandet) | 326 258 |
| Sjø innenfor territorialgrensa, fjordene med | 144 231 |
| Kystbelte, land innen 3 km fra sjø | 62 145 |
| Land innen 15 km fra sjø | 138 506 |
| Sjø innen 2 km fra land | 44 455 |

## 6. Anslag for størrelsene

| Lag | Fullversjon | Lett utgave |
|---|---|---|
| Terreng | 10 m i kystbeltet 150 MB, 30 m til 15 km 55 MB, grovt innover 20 MB | 30 m i beltet 45 MB, grovt ellers 10 MB |
| Dybde | 50 m i hele territorialfarvannet, rundt 25–30 MB | 50 m innen 2 km fra land, 200 m ellers, rundt 9 MB |
| Land og sjø | 12,5 m, rundt 3 MB | 25 m, rundt 1,5 MB |
| Bygg | omriss, rundt 2,5 mill. bygg, rundt 50 MB | rektangler innen 1 km fra sjø, rundt 10 MB |
| Veier, skog, kaier, lys, navn | rundt 20 MB | rundt 10 MB |
| **Sum** | **rundt 330 MB** | **rundt 85 MB** |

Fullversjonen ser ut til å bli mindre enn anslaget i planen (0,5–1,5 GB). Den får plass på GitHub Pages (1 GB per nettsted og 100 MB per fil), og **Cloudflare R2 trengs trolig ikke**. Den lette utgaven trenger to publiseringer (64 MB hver).

## Hva dette endrer i planen

- Kartdata i artifacten legges som `.wasm`, og lasteren lagrer flisene i IndexedDB etter innholdshash (begge bygg).
- Terrenget hentes fra Terrarium z13 nå. Geonorge trengs bare for dybden (`bathymetry50m`), sjømerkene (Overpass) og tidevannet.
- Overture erstatter OSM for kyst, bygg, veier og arealdekke. Overpass trengs fortsatt for sjømerker med lyktsektorer og for skjær.
- R2 utgår inntil videre. Nettstedet holder.
