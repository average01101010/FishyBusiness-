# Kodesjekk av funnene fra runde 1 (Explore-agent, 30.09.2026)

7 er feil i koden, 12 er design som ikke forklares, og nr. 13 er fire designvalg. Ingen er rene misforståelser, men i nr. 2 og 8 tolket testeren tallene feil.

1. **Feil. Tempoet.** `GAME_RATE = 6` (01-world.js:5) gir 6×, mens teksten er skrevet for 2×:
   - intro3 og «2× (normalt)» (01-i18n.js:3, :42; 05-phone.js:68)
   - valgene i index.html:23 heter 60×/600×/3600×, men gir 180×/1 800×/10 800×
   - ruteanslaget i 07-guide.js:81 (`dur(e.hours / 2)`) sier at ekte tid blir 3 ganger så lang som den faktisk blir
2. **Design. Fangstfeltene er bare løse hint.**
   - Sirklene (`GROUNDS`, 01-world.js:179–186) er en bump på 0,45 i tettheten (03-simulation.js:200). Det som styrer mest er hotspot 0,3–1,8, som flytter seg hver 120. time (:161), og eksponering, skråning, dybde, sesong og lokal bestand.
   - Malangsgapet starter delvis nedfisket (`initStock`, 0,55–0,9, :219).
   - Tetthet i mars:

     | Sted | Tetthet |
     |---|---|
     | Sentrum av Malangsgapet | 0,50–0,83 |
     | Gisundet nord | 0,50–0,66 |
     | Åpent vann nord for Botnhamn | median 0,4, p90 0,9, maks 1,4 |

   - Uten juksa er eff 0,35, som gir ca. 10,5 × tetthet kg/t. 107 kg på 8 t er plausibelt.
   - 0 kg på 1 t er normalt, fordi hver art må bygge opp en hel fisk på 2–5 kg (05-vessels.js:243).
   - Brukergrensesnittet sier aldri at sirklene bare er løse hint.
3. **Feil (villedende). «Ny juksa»** (10-daily-coffee.js:142 → 08-actions.js:48):
   - Knappen trekker `PRICE.gear` 1 900 kr uten pris på knappen, uten bekreftelse og uten logg.
   - Startbåten har ikke juksa (`gear:false`), men Fiske-fanen sier «mistet, kjøp ny i havn» (07-guide.js:118). Juksa gir eff 1,0 mot 0,35.
4. **Design. «Kjøp is»** kjøper 50 kg for 75 kr per trykk, opp til `iceCap` 150 kg på skiffen.
   - Handlingslinja viser verken mengde eller pris, men plotteren gjør det (07-guide.js:230).
   - Isen vises bare i Last-fanen og i Rederi-appen, ikke i HUD-en.
5. **Feil. Loggen og regnskapet:**
   - `buyIce` og juksakjøp skriver ingen logglinje, så de mangler på Drift-siden (06-logbook.js:29–36).
   - Kaffekoppen (500 kr) logges ikke og går ikke inn i `S.stats.revenue`, så den mangler i regnskapet.
6. **Feil (avrunding).** Sluttseddelen avrunder hver linje og totalen hver for seg (07-guide.js:240, :245), og kassen får den uavrundede summen. Det gir avvik på ±1.
7. **Design.** HUD-en viser `coldPen` (straff på fangstfarten) og `effTemp` (vindkjøling), mens telefonen viser lufttemperaturen. Ingen av dem er forklart.
8. **Feil (bare visning).** Minsteprisen for lange er 13,57 (02-species-gear.js:21). Priskortet runder den til «14», mens dagens pris vises med én desimal (05-phone.js:153). Prisen 13,9 er lovlig.
9. **Design:**
   - En rute uten havn godtas.
   - Etter siste fiskepunkt går båten til «idle», og planen tømmes (05-vessels.js:262–263).
   - Automatisk retur skjer bare når vinden passerer `autoW`, 11 m/s.
   - Hvileregel og slitenhet gjelder bare mannskap (04-crew.js:83–88). Kulde senker bare fangstfarten.
   - Ingen varsel om at båten ligger stille på sjøen.
10. **Design.** Levering har ingen åpningstider, og det er meningen («Alle møter opp, også om natta», OVERLEVERING.md:478).
11. **Design. Pubhjulet:**
    - 1 000 kr i spillpenger per spinn, med 53 % tomt.
    - Premiene er haill som ellers koster 19/29/59 kr i ekte penger (testbutikk).
    - Kapittel 7 sier «Kroner i spillet selges aldri for ekte penger» og «oddsen vises». Hjulet følger reglene bare fordi kroner i spillet ikke kan kjøpes.
    - Oddslinja (09-hand-fishing.js:21) utelater «tomhendt 53 %», som dokumentasjonen nevner.
12. **Feil (CSS).** Statusen `.stp` har samme pilleform og `cursor:pointer` som knappene (styles.css:71).
13. **Design (fire ting i ruteplanleggeren):**
    - «Det er land» finnes, men meldingen virker taus i fire tilfeller:
      - når trykket snapper til en havn innenfor 22 px
      - når bevegelse over 7 px tolkes som panorering
      - når trykket treffer AIS eller en blåse
      - når en annen melding overskriver den
    - Punkter kan bare legges til på slutten. De kan ikke dras eller settes inn.
    - `entryWps` og `exitWps` legger inn innseilingspunkter automatisk.
    - «Etappe N» teller også punktene som ble lagt inn automatisk.
14. **Design.** «Redskap: nei» blar gjennom handlinger for passive redskap. Uten slike redskap finnes det bare «nei», og da gir trykket ingen respons.
15. **Feil.** Tipset `route_empty` («nord i Gisundet») vises ved tom rute i alle havner (07-guide.js:68).
16. **Design.** Telefonen husker siste app (05-phone.js:74).
17. **Feil.** Kameraet holdes bare over terreng og sjø (view3d.js:2121). Kaier (`PIERBOX`) og bruer ignoreres.
18. **Design:**
    - Finnsnes har verken mottak eller is.
    - Mottak finnes i Botnhamn, Husøy, Senjahopen, Gryllefjord, Sommarøy, Brensholmen, Torsken og Frovåg.
    - Introen nevner ingen av dem, og veiledningen sier «avslutt ruten ved å trykke på en havn», som også omfatter Finnsnes.
19. **Design (hull).** Båten starter med ice:0, og Finnsnes selger ikke is. Ruten og avgangen advarer ikke om is. Første melding kommer på sjøen.
20. **Design. Stangfisket:**
    - Nappvinduet er 1 100 ms (10-daily-coffee.js:100).
    - Nappet kommer tilfeldig og uavhengig av «Rykk». Knappen gjør ingenting mens man venter på napp.
    - Signalet er rosa, pulserende «NAPP! Trekk nå!», knappen blir «Trekk!», og stangtuppen rister. Det er ingen lyd eller vibrasjon.
    - Testoppsettet har minst 2 s per handling, så agenten kan i praksis ikke rekke nappet. Stangfisket kan derfor ikke vurderes rettferdig i denne testen.
