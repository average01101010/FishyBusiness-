# Grafikk: båtmodellene på et nytt nivå (plan, 30.10.2026)

> Planen for å løfte båtene og utstyret til et detaljnivå på høyde med spill som viser kjøretøy på nært hold. Skrevet etter
> `/planlegg` 30.10.2026. **Vedtatt 30.10.2026.**

## 1. Bestillingen

Jonas 30.10.2026, etter at første runde fra kartleggingen var levert (`docs/skipsmodeller/kartlegging-spillet.md` kap. 8.1):
«Jeg synes bare at arbeidet du har gjort til nå ikke er godt nok i det hele tatt. Ja, det ble pittelitt bedre, men ikke i nærheten
av det detaljnivået jeg forventet.» «Har du gått gjennom planliste-fiskefartoy.md og referanseanalyse-runde-2.md for hver modell?»
(Svaret var nei: planlisten har 248 punkter, båtskriptene viser til 31 av dem.) Og: «Jeg tror vi begrenset oss med størrelsen på
båtmodellene i starten av spillet fordi vi ble begrenset av artefakter i claude. Nå som spillet er på nett burde det vell gå fint å
lage mer detaljerte modeller? Mange spiller jo feks bilspill på enhetene sine der bilene ser super-realistiske ut. […] Vi må i
allefall steppe opp gamet betraktelig.»

Reglene som gjelder: grafikken er nesten det viktigste, og ytelse hentes først uten å endre utseendet (Jonas 03.10.2026); lagging
skal ikke ødelegge opplevelsen; alt nytt må kunne slås av per kvalitetsnivå (Galaxy A52s mister konteksten, BACKLOG 10.1); bare
utsiden av båtene (06.10.2026); ingen redskap modellert inn i båtene (18.10.2026); siden er ikke lenger én fil (29.10.2026).

## 2. Slik er det i dag

- **Taket er artefaktens arv.** `tests/vessel3d.py` setter 120 000 punkter (rundt 40 000 trekanter) på en Blender-båt nær og
  12 000 i fjernversjonen. Tallet kom fra tiden da alt lå i én fil. Modellene ligger nå som egne filer i `data/` (`bootData`,
  29.10.2026), så filstørrelsen er ikke lenger grensen. Ringnotbåten er på 115 896, de andre havbåtene på 71 000–88 000,
  kystbåtene på 21 000–79 000.
- **Tegningen:** WebGL 1 (`view3d/18-setup.js`). Båtene tegnes uten indekser (`drawN` i `12-skiff.js`, `drawArrays`): hver trekant
  har sine egne tre punkter med posisjon, normal og farge, selv om GLB-filene er indeksert (tråleren: 23 678 trekanter på 32 703
  punkter). Terrenget bruker indekser (`drawElements` i `17-draw.js`).
- **Materialet:** bare farge per punkt med glans i alfa, og skyggen fra Cycles (AO) bakt inn i fargen (`LITN_FS`). Lyset er sol,
  himmel, punktlys, glans og fresnel, regnet per piksel. Ingen teksturer, ingen normalkart, ingen refleksjon av himmelen, ingen
  sanntidsskygger på båten (terrenget har skygger, `SHMS`). Slitasjen på egen båt er støy i skyggeren (`WEAR_GL`).
  Teksturer finnes ellers i spillet (bakken, sjøen, teksten på livbøyene), så rendereren kan dem.
- **Nullpunkt for ytelsen:** OnePlus Pad 3, fint vær, nivå Høy: 71 bilder/s, 14,1 ms per bilde (`grafikk-natur-og-miljo.md`).
  Nesten hele bildet går til terreng, sjø, skog og lys; båtene er en liten del, men hvor liten er ikke målt.
- **Enhetene spillerne har:** spillet sender kvalitetsnivå og skjerm til skyen (`ui/10f-cloud.js`, `G3.quality()`), så
  fordelingen kan leses i Supabase før nivåene settes.
- **Arbeidsmåten:** skriptene i `tools/boats/` (14 båter) og `tools/gear/`, `tools/deck/` (utstyret), felles beslag i
  `tools/boats/fittings.py` (30.10.2026). Planlisten (`docs/skipsmodeller/planliste-fiskefartoy.md`) og bildeanalysene
  (`eksempel-sulebas-sf-100-su.md`, `referanseanalyse-runde-2.md`) er ikke brukt punkt for punkt på noen båt.

**Hvorfor bilspillene ser bedre ut:** ikke først og fremst flere trekanter. En bil i et mobilspill har 50 000–300 000 trekanter,
men den har teksturer med normalkart (plateskjøter, bolter og riller uten geometri), PBR-materialer (lakk, krom, gummi, glass som
reagerer ulikt på lys), refleksjon av omgivelsene, sanntidsskygger og etterbehandling (tonekurve, bloom, kantutjevning). Og det står
én bil på skjermen, ikke en hel kyst med sjø og vær. Begge delene trengs her: mer geometri og et ekte materialsystem.

## 3. Fasene

Hver fase passer én økt, så nær som F5 og F6, som er én økt per båt.

| Fase | Bygger | Filer | Tester | Må måles |
|---|---|---|---|---|
| **F0 Måling** | En målside (`#bench`) som setter egen båt og 1–20 andre båter rundt, med modellen ganget opp 1×, 2×, 4× og 8× (kopier av lod0), og skriver bildetid og bilder/s. Jonas åpner den på Pad 3 (og en billigere telefon om han har). Fordelingen av enheter hentes fra skyen | `view3d/25-controls.js` (debug), ny `tests/benchshot.py` | ny `benchshot` | **Alt i planen avhenger av dette:** hvor mange trekanter nær og i havna Pad 3 tåler før den faller under 60 bilder/s |
| **F1 Tegnegrunnlaget** | WebGL 2 med WebGL 1 som reserve. Båtene tegnes med indekser (GLB-indeksene beholdes, 32-bit), komprimerte punkter (halvparten av bytene), tre LOD-trinn (nær / middels / fjern) etter avstand og nivå, utstyr og teiner som instanser. Taket i `vessel3d.py` og `batplan.md` settes fra F0, per kvalitetsnivå | `18-setup.js`, `12-skiff.js` (`drawN`), `vessel3d.js` (`glbModel`, `glbPart`), `bpyutil.export_boat` | `vessel3d`, `brotest`, `tral3d`, `deckshot`, `dbg23o` | Bildetiden før og etter på Pad 3: samme utseende, mindre arbeid |
| **F2 Materialer** | UV-er i eksporten, et felles teksturatlas (stålplater med sveis, malt stål med slitasje og rustrenner, antisklidekk, rist, gummi, tau og not, tre, glassfiber, glass) med farge, normalkart og ruhet/metall, i KTX2/Basis. Skyggeren blir PBR (GGX) med refleksjon av himmelen; malingssonene (paint zones) farger albedoen som før | `bpyutil.py`, ny `tools/boats/atlas.py`, `12-skiff.js` (`LITN_FS`), `vessel3d.js` | `vessel3d`, `maletest`, `regmarktest`, `lanterntest` | Nedlasting (atlaset 2–4 MB, lagres etter første gang) og bildetid |
| **F3 Skygger og lys på båten** | Sanntidsskygge fra sola på egen båt og båtene nær (mast, styrhus og folk kaster skygge på dekk), kantutjevning og tonekurve. Av på lavt nivå | `17-draw.js`, `01-shaders.js` | `brotest`, `deckshot`, `lighttest` | Bildetid |
| **F4 Pilotbåten** | Én båt gjennom hele planlisten: hvert punkt for typen (felles moduler og typemodulen) og bildeanalysene, med avvikslista `docs/skipsmodeller/<båt>-avvik.md` (finnes, mangler, feil, og hvor), bygd på nytt med det nye taket og materialene, kontrollbilder fra K1–K7 (planlisten kap. 30) og skjermbilder fra spillet i begge formater. **Jonas godkjenner nivået før F5** | `tools/boats/<båt>.py`, `fittings.py` | `vessel3d`, `brotest`, og typens egen (`tral3d` for not og trål) | Pilotbåtens bildetid i havna |
| **F5 Resten av flåten** | Samme løp for hver båt, én økt per båt, i rekkefølgen spillerne møter dem: skiff, trebåt, snekke, plastsjark, sjark, hurtigsjark, sjarkny, breisjark, kyst15, kyst21, så havbåtene | `tools/boats/*.py` | som F4 | Per båt |
| **F6 Utstyret** | Halerne, juksamaskinene, teinene, kranen, flåten, livbøyene, radarene, fiskekassene og folkene på samme nivå, og det som mangler fra kartleggingen (liten haler, juksavinde, påhengsmotor 90 hk, VHF/AIS/GPS-antenner) | `tools/gear/`, `tools/deck/` | `deckshot`, `potshot`, `haultest`, `jigshot` | Per modell |

F0 kommer først fordi tallene i F1 og hele detaljnivået i F4 avhenger av den. F1–F3 kommer før piloten, ellers må piloten
lages to ganger (først uten UV-er og materialer, så med).

## 4. Valgene

1. **Grafikk-API.** A) WebGL 2 med WebGL 1 som reserve. B) Bli på WebGL 1 med utvidelser. C) WebGPU.
   **Anbefaling: A.** WebGL 2 finnes i alle nettlesere på Android og iOS i dag og gir indekser, instanser, flerprøve-kantutjevning
   og bedre teksturer uten å stenge noen ute; WebGPU er ikke stabilt nok på Android ennå.
2. **Kvalitetsnivåene.** A) Nivået velges etter målt bildetid på enheten, og spilleren kan overstyre det. B) Samme nivå for alle.
   C) Bare høyt nivå.
   **Anbefaling: A.** Pad 3 skal få alt, mens svakere telefoner (som A52s, som allerede mister konteksten) må få et lettere nivå.
3. **Pilotbåten.** A) Ringnotbåten. B) En kystbåt spillerne møter tidlig (sjarken, `havsjark35`). C) Startbåten.
   **Anbefaling: A.** Vi har Sulebas-bildet og hele analysen av det, så nivået kan måles mot noe ekte. Etter godkjenningen tas
   flåten i den rekkefølgen spillerne møter båtene.
4. **Rekkefølgen.** A) F0–F3 før piloten. B) Piloten først i dagens renderer, grunnlaget etterpå.
   **Anbefaling: A.** Uten UV-er, materialer og et høyere tak blir piloten bare en bedre versjon av det du ikke var fornøyd med.

## 5. Antatt eller usikkert

- **Hvor mye Pad 3 tåler i nettleseren er ikke målt.** At den kjører tunge bilspill, betyr ikke at den tåler like mye i Chrome:
  WebGL går gjennom ANGLE og koster mer enn en app skrevet direkte mot Vulkan. Spillet bruker allerede 14,1 ms av 16,7 ms per
  bilde (60 bilder/s) i fint vær. F0 avgjør det.
- **Spillerne har ikke bare Pad 3.** Fordelingen i skyen er ikke lest ennå.
- **Nedlastingen vokser:** en båt går fra 0,7–1,7 MB til trolig 3–6 MB, og atlaset kommer i tillegg. Det lagres på enheten etter
  første gang.
- **Varme og batteri** på nettbrett med høy grafikk over lang tid; en grense på 30 bilder/s kan bli et valg i innstillingene.
- **Testene i skyen** går i SwiftShader og blir tregere med tyngre modeller (allerede nå når `deckshot`, `brotest`, `tral3d` og
  `vessel3d` tidsgrensene i `run.py`). Testene bør kjøre på lavt nivå, og tidsgrensene settes etter målinger.
- **Tiden:** F4 og F5 er 13–14 økter med båter, F6 flere. Det er mange økter.

## 6. Hva planen ikke gjør

- Ingen innredning eller rom under dekk (06.10.2026), ingen kjøpbart utstyr modellert inn i båtene (18.10.2026).
- Ingen endring i båtenes mål, data eller spillmekanikk.
- Ingen nye båttyper.
- Ingen endring i terreng, sjø eller natur (det er `grafikk-natur-og-miljo.md`).

## Status

Vedtatt 30.10.2026 (Jonas: «Kjør på», med anbefalingene A i alle fire valg; og: «Tenker det går fint om npc-båter ikke
har samme oppløsning som bruker-styrte båter»). Pilotbåten er ringnotbåten, med Jonas' tre nye bilder av Sulebas (30.10.2026, ikke i repoet).

- **F0 bygd 30.10.2026:** `G3.bench(ks, ns)` (`view3d/25-controls.js`, `BENCH` i `00-head.js`), startet med `#bench` i adressen: egen båt
  tegnet k = 1, 2, 4, 8 ganger og 0, 5, 10, 20 andre båter på dagens nivå rundt henne, 2,5 s innsvinging og 4 s måling per oppsett,
  tabell på skjermen (bildetid, bilder/s, andel bilder over 20 ms). Test: `benchshot`.
- **Målingen fra Pad 3 (Jonas 30.10.2026 11:09, sjarkny, Adreno 830, nivå 2, 1292 × 778 @ 2,625, i havn om kvelden):** 20 ms
  (50 bilder/s) i alle 16 oppsett, fra 8 009 til 224 252 båttrekanter (egen båt 1–8 ganger, 0–20 båter rundt), 34–48 % av bildene
  over 20 ms uten mønster. Båtenes trekanter koster altså ikke målbart opp til minst 224 000; bildetida bestemmes av noe annet
  (fyllraten med 2,6 i pikseltetthet, terrenget, skyggeren eller JS-tida), ikke av geometrien. **Følger for F1:** taket på egen båt
  kan heves til rundt 300 000 trekanter nær (omtrent 8 ganger dagens), NPC-båtene blir på dagens nivå; indeksene er ikke lenger det
  som må til for å få plass, og F1 kan legge vekten på WebGL 2, LOD og taket. Materialene i F2 koster per piksel og må måles på nytt.
  Usikkert: målt med en lett båt (8 009 trekanter); ringnotbåten ganger 8 er rundt 310 000, utenfor det som er målt.
- **Referanseenheten (Jonas 30.10.2026: «Nå vet du hvor lista ligger»):** OnePlus Pad 3, Snapdragon 8 Elite, Adreno 830 (opptil
  1,1 GHz), Oryon-CPU opptil 4,32 GHz, 12/16 GB LPDDR5X, skjerm 13,2″ LCD 3392 × 2400 (315 ppi) med opptil 144 Hz. Det høyeste
  nivået skal se best mulig ut på den. Merk: spillet tegner i dag med pikseltetthet 1,5 på nivå 2 (`QUAL.dpr`), altså rundt
  1940 × 1170 på en skjerm som har 3392 × 2042 i det samme vinduet, og når 50 bilder/s på en skjerm som kan vise 144. Hva som holder
  det på 20 ms, finnes i F1 (profil av JS-tid mot GPU-tid), før et nytt «ultra»-nivå med full oppløsning vurderes.
