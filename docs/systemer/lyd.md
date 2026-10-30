# Lyd

> Flyttet ordrett fra `docs/OVERLEVERING.md` 26.10.2026 (`docs/utviklingsplan.md`, fase A). Tallene i overskriftene er de gamle kapittelnumrene; `docs/systemer/gamle-numre.md` viser hvor hvert nummer havnet. Nytt skrives inn her, under det systemet det gjelder.

## 5.25 Lyd (03.10.2026)

- **Fil og oppstart:** `ui/10e-sound.js` (`SND`). Lyden lages i nettleseren med Web Audio uten opptak, og starter ved første trykk.
- **Lagene** følges hvert 100. ms:
  - Motoren følger turtallet fra farten. En påhengsmotor går høyt, en diesel lavt og dunkende. Den går på tomgang når båten ligger stille på sjøen, og er av i havn.
  - Skvulp og vasking langs skroget øker med fart og sjø, og det kommer smell i skroget.
  - Vind, regn og snø.
  - Måker, ofte når det sløyes.
  - I havna: kranens sus og truckens ryggepip mens fangsten landes, pumpa ved bunkring og isrenna.
  - Haleren i hydraulikk mens det hales, og snella ved jukse.
  - Brovaktsalarmen.
- **Hvor lyden kommer fra** (Jonas 03.10.2026): i 3D er øret kameraet (`G3.ear`, fra siste bilde som ble tegnet).
  - Det som har en plass, dempes med avstanden: `(ref / d)^0.9` fra `ref` meter (`SNDREF`).
    - Egen båt (`G3.sndSrc`): motor 12 m, skvulp 10 m, haler 5 m, snelle 4 m og smell 8 m. Måkene er 8–38 m rundt båten (12 m).
    - Mottaket der båten ligger: kran 18 m, truck 20 m og isrenne 15 m.
    - Pumpa: 6 m.
    - De tre nærmeste NPC-båtene innen 2,5 km (12 m, Kystpilen og ferja 30 m): en lav diesel hver, sterkere i fart.
  - Lyden blir mattere langt unna, fordi lavpasset går ned til 35 %.
  - Den panoreres mot venstre eller høyre etter vinkelen fra kameraet (`StereoPannerNode`).
  - Vind, regn og havet rundt deg dempes ikke. Brovaktsalarmen går aldri under halv styrke.
  - I 2D-kartet er øret om bord som før, og ingen NPC-motorer høres.
  - Med kameraet 21 m bak båten er motoren 62 % av full styrke, og 300 m unna 5,5 % (målt i 3D).
- **Innstillinger:** Av, 25, 50, 75 eller 100 % (`S.settings.sound`, `S.settings.vol`). I 2D er lyden 60 % av styrken.
- `soundtest.py` sjekker lagene, avstanden, panoreringen, alarmgulvet og NPC-motorene (med `SND.testEar`/`testSrc`), ikke hvordan det låter.
- **Semidieselen** (trebåten, 05.10.2026): se 5.13. Nivået `LV.eng` er styrken på dunkene, som blir litt kraftigere når gassen er oppe.
- **Musikken** (Jonas 05.10.2026: «rolig ambient instrumentaler som svak stemning i bakgrunnen. Må kunne skrus av i innstillinger»):
  - Den lages mens den spiller (`musTick` i `SND`): myke flater (tre oscillatorer per tone gjennom et lavpass) i langsomme akkorder i D, dorisk om dagen og eolisk om natta, over en lav grunntone. Hver akkord varer 19–25 s og glir over i den neste.
  - Nå og da kommer en kort frase på en myk klokke (en til tre toner fra akkorden, en eller to oktaver opp), gjennom et langt ekko og et rom (en konvolver med fire sekunder støy som dør ut).
  - Mørkere om natta (lavere lavpass) og i dårlig vær, og sjeldnere klokker i storm.
  - Den har egen vei ut (ikke `master`), så den spiller også når lydeffektene er av. Styrken er `S.settings.music` (Av, Svak 0,2, Normal 0,35, som er standard, og Sterkere 0,6), og ganget med 0,2 er den aldri høy.
  - Ingen filer eller lisenser. `soundtest.py` sjekker at den spiller med egen styrke og blir stille med Av.
