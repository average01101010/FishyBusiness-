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

## 5.25b Lydsignalene på sjøen (Ø11.2, 06.11.2026)

Sjøveisreglene regel 32–35 og vedlegg III, lest ordrett på Lovdata 06.11.2026. Reglene for når et signal gis, står i `docs/systemer/sjofart-og-lover.md` (4.4); her står hvordan det låter.

- **Køen:** `core/05e-sjovei.js` legger signalene i `SJV.sig` (mønsteret, hvor i rammen, fartøyets lengde, egen båt eller ikke), og `sigTick` i `SND.tick` spiller dem. Et signal som er eldre enn 8 sekunder (lyden startet sent, siden var skjult), spilles ikke. Med lyden av tømmes køen.
- **Mønstrene** (`SND.blasts(pat, {k, L, pan, lp})`, gir tiden i sekunder): `S` kort støt 1 s (32 b «om lag et sekunds varighet»), `L` langt 4,5 s (32 c «fra fire til seks sekunders varighet»), 1 s mellom støtene og 2 s mellom to lange (35 b «om lag 2 sekunders mellomrom»), og `bell`: klokka ringt hurtig i 5 s (35 g), et slag hvert femte sekund med tre deltoner fra en skipsklokke (620 Hz).
- **Fløyta** (`blast`): to sagtenner med en ters mellom gjennom et lavpass, med tonen etter lengden (`SND.hornHz`, vedlegg III 1 b): 420 Hz under 20 m, 300 Hz til 75 m, 190 Hz til 200 m, 110 Hz over. Hornet til tutingen (`SND.horn`, `ui/10n-hail.js`) er ett støt på 1,5 s med tonen til din egen båt; før var det 147 og 220 Hz for alle, som et stort skip.
- **Hvor det høres fra:** som de andre lydene, `(ref / d)^0,9` med lavpasset og panoreringen fra `at`. `ref` er 3,6 % av hørevidden i vedlegg III 1 c (0,5 mil under 20 m: 33 m; 1 mil: 67 m; 1,5 mil: 100 m), så fløyta er en hvisken ved grensa og under 0,03 ikke spilt. En båt på 10 m 400 m unna gir 0,11, kystruteskipet 2 km unna 0,07. I 3D er øret kameraet og egen båt `G3.sndSrc().boat`; i kartet er øret om bord og ser forover (en båt øst for deg når du går nordover høres til høyre). Egen båt spilles på 0,85, så tåkesignalet hennes hvert 110. spillsekund ikke tar over.
- **Et øre som ikke er et tall** (et kamera gått NaN) høres nå om bord, og `set` og `place` hopper over et tall som ikke er endelig (backloggen 10.1, rettet i Ø11.2).
- `soundtest.py` sjekker tonen etter lengden, lengden på mønstrene, egen båt for fullt, en båt på 10 m 400 m unna svakt og til høyre, ingen 2 km unna men kystruteskipet der, at et gammelt signal ikke spilles, hornvifta, og øret som er NaN; ikke hvordan det låter.
